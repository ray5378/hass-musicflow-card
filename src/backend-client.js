// MusicFlow backend client: real-time WS + REST, used by the Lovelace card.
// Mirrors the Web frontend's player store (frontend/src/stores/player.ts) so
// the card is an equal peer to the Web/App clients: any action taken here is
// reflected on every other client via the same /ws channel, and vice-versa.
//
// Hybrid transport (v1.6.7):
//   mode "direct"  - WebSocket + REST straight to the backend (lowest latency,
//                    used on the LAN).
//   mode "proxy"   - everything goes through the HA integration:
//                    REST via  GET/POST/... /api/musicflow/rest/{path}
//                    events via hass.connection.subscribeMessage({type:"musicflow/subscribe"})
//                    covers  via /api/musicflow/rest/getCoverArt (blob -> objectURL)
//
// 封面请求尺寸:缩略图在 UI 里只渲染 38–84px,160px(×2 DPR)已足够清晰,
// 比早期 300px 省约 3–4 倍流量——外网/慢网下体验关键。
const COVER_SIZE = 160;
//                    Used when the browser cannot reach the backend directly
//                    (PNA / mixed content / private IP not routable from the WAN).
//   transport "auto" (default) - probe a direct REST call first; on failure and
//                    when the integration reports proxySupported, fall back to
//                    proxy mode. "direct" / "proxy" force a specific mode.

const RECONNECT_DELAY = 3000;
const RECONNECT_MAX_DELAY = 30000; // 重连指数退避上限
const HANDSHAKE_TIMEOUT_MS = 10000; // WS 握手看门狗:超时未 open 即主动断开走重连
const PROBE_TIMEOUT = 4000;

function log(...args) {
  console.log("[MusicFlow card]", ...args);
}
function warn(...args) {
  console.warn("[MusicFlow card]", ...args);
}
function error(...args) {
  console.error("[MusicFlow card]", ...args);
}

export class BackendClient {
  constructor(opts = {}) {
    this.hass = opts.hass || null;
    this.url = opts.url || null;
    this.apiKey = opts.apiKey || null;
    this.transport = opts.transport || "auto"; // auto | direct | proxy
    this.mode = null; // resolved: "direct" | "proxy"
    this.proxySupported = false;
    this.ws = null;
    this._unsub = null; // HA WS subscription unsub (proxy mode)
    this._listeners = new Map();
    this._connected = false;
    this._pendingInit = null;
    this._reconnectTimer = null;
    this._connecting = false;
    this._subPending = false;
    this._proxyFallbackTried = false;
    this._coverBlobCache = null; // 代理模式封面 blob URL 缓存: key=coverId@size -> url|promise
    this._reconnectDelay = RECONNECT_DELAY; // 指数退避当前档位(成功复位)
    this._wsHandshakeTimer = null; // WS 握手看门狗定时器
    this._proxyRecheckTimer = null; // proxy 模式下直连恢复探测定时器
    this._proxyOkStreak = 0; // 直连恢复连续成功次数(防抖动)
  }

  on(event, cb) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(cb);
    return () => this._listeners.get(event)?.delete(cb);
  }
  _emit(event, payload) {
    this._listeners.get(event)?.forEach((cb) => {
      try { cb(payload); } catch (e) { error("listener error", e); }
    });
  }

  get connected() { return this._connected; }

  async init() {
    if (this.url && this.apiKey) return;
    if (!this.hass) throw new Error("MusicFlow 卡片: 缺少后端地址,且未提供 hass 以自动获取");
    if (this._pendingInit) return this._pendingInit;
    this._pendingInit = (async () => {
      log("fetching backend_config from HA integration");
      const res = await this.hass.callWS({ type: "musicflow/backend_config" });
      const backends = (res && res.backends) || [];
      if (!backends.length) throw new Error("MusicFlow 集成未配置后端连接");
      const b = backends[0];
      this.url = b.url;
      this.apiKey = b.api_key;
      this.proxySupported = !!b.proxySupported;
      log("backend_config ok", this.url, "proxySupported:", this.proxySupported);
    })();
    await this._pendingInit;
  }

  _restBase() {
    return (this.url || "").replace(/\/+$/, "") + "/rest";
  }
  _wsUrl() {
    const u = new URL(this.url);
    const proto = u.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${u.host}/ws?token=${encodeURIComponent(this.apiKey)}`;
  }
  _withToken(path, qs) {
    const base = this._restBase();
    const sep = path.includes("?") ? "&" : "?";
    const token = `token=${encodeURIComponent(this.apiKey)}`;
    const extra = qs ? `${sep}${token}&${qs}` : `${sep}${token}`;
    return `${base}${path}${extra}`;
  }

  // ============ transport mode ============
  // 直连可达性探测:局域网内直连延迟最低,探测成功就保持直连;
  // 外网/跨网段(混合内容、PNA、私有 IP 不可路由)会抛网络错误 -> 走 HA 代理。
  async _probeDirect() {
    if (!this.url || !this.apiKey) return false;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT);
      let ok = false;
      try {
        const res = await fetch(this._withToken("/api/v1/users/me"), {
          signal: ctrl.signal,
        });
        ok = res.ok;
      } finally {
        clearTimeout(timer);
      }
      return ok;
    } catch (e) {
      log("direct probe failed -> will use proxy", e && e.message);
      return false;
    }
  }

  async _resolveMode() {
    if (this.transport === "direct") return "direct";
    if (this.transport === "proxy") return this.proxySupported ? "proxy" : "direct";
    // auto: 直连可达就用直连;不可达且集成支持代理才切代理
    if (this.proxySupported && !(await this._probeDirect())) return "proxy";
    return "direct";
  }

  async rest(path, { method = "GET", body } = {}) {
    if (this.mode === "proxy") {
      // 代理模式下仍带上卡片自己的 api_key 作为 ?token= 兜底。
      // 集成代理补的 `Authorization: Bearer <api_key>` 头依赖后端 v1.1.7+ 的
      // "Bearer->apiKey 回退";较旧后端(或 :latest 镜像滞后)或某些反向代理
      // 剥离自定义头时该头认证失败,导致 star 等需要用户身份的操作在外网代理
      // 模式 401。卡片从 backend_config 拿到的 api_key 是经 HA 校验过的同一把
      // 钥匙,用 ?token= 走与直连完全相同的契约(后端各版本均支持),使收藏等
      // 操作在外网代理下稳定可用——这才是"之前只显示失败"那次修复真正该做的。
      let url = "/api/musicflow/rest" + path;
      if (this.apiKey) {
        const sep = url.includes("?") ? "&" : "?";
        url += `${sep}token=${encodeURIComponent(this.apiKey)}`;
      }
      const init = { method, headers: {} };
      if (body !== undefined) {
        init.headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }
      log("proxy REST", method, path);
      let res;
      try {
        res = await this.hass.fetchWithAuth(url, init);
      } catch (e) {
        error("proxy REST network error", method, path, e);
        throw e;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        error("proxy REST failed", method, path, res.status, text.slice(0, 200));
        throw new Error(`MusicFlow REST ${method} ${path} -> ${res.status}`);
      }
      this._emit("rest_ok"); // 任何一次 REST 成功都证明"能和服务器通信"
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        if (data && data["subsonic-response"]) return data["subsonic-response"];
        return data;
      }
      return res;
    }

    const url = this._withToken(path);
    const init = { method, headers: {} };
    if (body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    log("REST", method, url.replace(/token=[^&]+/, "token=***"));
    let res;
    try {
      res = await fetch(url, init);
    } catch (e) {
      // 网络层失败:不是 HTTP 状态码错误,而是请求根本没发出去/被浏览器拦截。
      // 几乎总是以下三者之一:
      //  1) CORS 未放行该来源(后端 CORS_ORIGINS 没包含 HA 前端域,也未设 *)
      //  2) 混合内容:HA 前端是 HTTPS 而后端是 http://(浏览器禁止)
      //  3) 后端地址对浏览器不可达(集成里填的是 localhost,但卡片在另一台设备浏览器运行)
      const hint = (e instanceof TypeError)
        ? "网络层失败: 通常是 (1)CORS 未放行 (2)混合内容 HTTPS页访问HTTP后端 (3)后端地址浏览器不可达。请确认后端已放行该来源,且卡片所用的 url 浏览器能直接访问"
        : String(e);
      error("REST network error", method, url.replace(/token=[^&]+/, "token=***"), hint);
      throw e;
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      error("REST failed", method, path, res.status, text.slice(0, 200));
      throw new Error(`MusicFlow REST ${method} ${path} -> ${res.status}`);
    }
    this._emit("rest_ok"); // 任何一次 REST 成功都证明"能和服务器通信"
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const data = await res.json();
      if (data && data["subsonic-response"]) return data["subsonic-response"];
      return data;
    }
    return res;
  }

  connect() {
    if (this._connecting) return;
    if (this.mode === "proxy") return this._connectProxy();
    if (this.mode === "direct") return this._connectWS();
    // 首次连接:先探测决定直连还是代理,再走对应通道
    this._connecting = true;
    this._resolveMode()
      .then((mode) => {
        this.mode = mode;
        log("transport mode:", mode);
        this._connecting = false;
        this.connect();
      })
      .catch((e) => {
        this._connecting = false;
        error("mode resolve failed", e);
        this._scheduleReconnect();
      });
  }

  // ============ direct transport (WebSocket) ============
  _connectWS() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    let ws;
    try {
      ws = new WebSocket(this._wsUrl());
    } catch (e) {
      error("WS open failed", e);
      this._maybeProxyFallback();
      return;
    }
    this.ws = ws;
    ws._mfOpened = false;
    // 握手看门狗:部分网络黑洞/防火墙会静默丢弃握手(onopen/onclose/onerror 都不触发),
    // 连接会永久卡 CONNECTING 且重连(只在 onclose 触发)永不执行 → 超时主动 close 走重连。
    if (this._wsHandshakeTimer) clearTimeout(this._wsHandshakeTimer);
    this._wsHandshakeTimer = setTimeout(() => {
      this._wsHandshakeTimer = null;
      if (this.ws && !this.ws._mfOpened && this.ws.readyState === WebSocket.CONNECTING) {
        warn("WS handshake timeout, closing to trigger reconnect");
        try { this.ws.close(); } catch {}
      }
    }, HANDSHAKE_TIMEOUT_MS);
    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      this._handle(msg);
    };
    ws.onopen = () => {
      ws._mfOpened = true;
      if (this._wsHandshakeTimer) { clearTimeout(this._wsHandshakeTimer); this._wsHandshakeTimer = null; }
      this._reconnectDelay = RECONNECT_DELAY; // 重连成功后退避复位
      this._connected = true;
      log("WS open");
      this._emit("open");
      this._startWsKeepalive();
    };
    ws.onclose = () => {
      if (this._wsHandshakeTimer) { clearTimeout(this._wsHandshakeTimer); this._wsHandshakeTimer = null; }
      this._connected = false;
      this._stopWsKeepalive();
      warn("WS close");
      this._emit("close");
      if (this._maybeProxyFallback()) return;
      this._scheduleReconnect();
    };
    ws.onerror = (e) => { error("WS error", e); try { ws.close(); } catch {} };
  }

  // 直连 WS 从未打开过(说明后端对浏览器不可达)且集成支持代理 -> 切一次代理。
  // transport 显式为 direct 时不自动切换(用户明确要求只走直连)。
  _maybeProxyFallback() {
    if (this.transport === "direct") return false;
    if (this.mode === "direct" && this.proxySupported && !this._proxyFallbackTried) {
      this._proxyFallbackTried = true;
      log("direct WS failed -> switching to proxy");
      this.mode = "proxy";
      this.connect();
      return true;
    }
    return false;
  }

  // 应用层 WS 心跳:没有 DLNA 设备/未播放时 WS 完全无流量,代理或防火墙的
  // 空闲超时会把连接掐掉,卡片被误判为"连不上服务器"而变暗。25s 一次 ping
  // (服务端回 pong)保持连接活跃。
  _startWsKeepalive() {
    this._stopWsKeepalive();
    this._wsPingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try { this.ws.send(JSON.stringify({ type: "ping" })); } catch {}
      }
    }, 25000);
  }
  _stopWsKeepalive() {
    if (this._wsPingTimer) { clearInterval(this._wsPingTimer); this._wsPingTimer = null; }
  }
  _scheduleReconnect() {
    if (this._reconnectTimer) return;
    const delay = this._reconnectDelay || RECONNECT_DELAY;
    this._reconnectDelay = Math.min((this._reconnectDelay || RECONNECT_DELAY) * 2, RECONNECT_MAX_DELAY);
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      this.connect();
    }, delay);
  }
  disconnect() {
    if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
    this._stopWsKeepalive();
    this._closeProxy();
    this._stopProxyRecheck();
    if (this._wsHandshakeTimer) { clearTimeout(this._wsHandshakeTimer); this._wsHandshakeTimer = null; }
    this._subPending = false; // 防止 detach 时订阅中途残留,重连后 _connectProxy 被防重入挡住
    if (this.ws) { this.ws.onclose = null; try { this.ws.close(); } catch {} this.ws = null; }
    this._connected = false;
  }

  // ============ proxy transport (via HA integration) ============
  _connectProxy() {
    if (this._unsub || this._subPending) return; // 已订阅或订阅中
    if (!this.hass || !this.hass.connection) {
      error("proxy: no hass.connection");
      this._scheduleReconnect();
      return;
    }
    this._subPending = true;
    log("subscribing backend events via HA");
    this.hass.connection
      .subscribeMessage((msg) => this._handle(msg), { type: "musicflow/subscribe" })
      .then((unsub) => {
        this._subPending = false;
        this._unsub = unsub;
        this._connected = true;
        this._reconnectDelay = RECONNECT_DELAY; // 订阅成功后退避复位
        this._startProxyRecheck();
        log("proxy subscribed");
        this._emit("open");
      })
      .catch((e) => {
        this._subPending = false;
        error("proxy subscribe failed", e);
        this._emit("close");
        this._scheduleReconnect();
      });
  }
  _closeProxy() {
    if (this._unsub) { try { this._unsub(); } catch {} this._unsub = null; }
  }

  // proxy 模式下定期探测直连是否恢复:连续 2 次(约 2 分钟)稳定后自动切回 direct,
  // 避免 proxy 通道长期锁定(直连恢复后优先低延迟直连)。
  _startProxyRecheck() {
    this._stopProxyRecheck();
    this._proxyRecheckTimer = setInterval(async () => {
      if (this.mode !== "proxy") return;
      let ok = false;
      try { ok = await this._probeDirect(); } catch {}
      if (ok) {
        this._proxyOkStreak = (this._proxyOkStreak || 0) + 1;
        if (this._proxyOkStreak >= 2) {
          log("direct reachable again -> switch back to direct");
          this._proxyOkStreak = 0;
          this._proxyFallbackTried = false;
          this.mode = "direct";
          this._stopProxyRecheck();
          this._closeProxy();
          this.connect();
        }
      } else {
        this._proxyOkStreak = 0;
      }
    }, 60000);
  }
  _stopProxyRecheck() {
    if (this._proxyRecheckTimer) { clearInterval(this._proxyRecheckTimer); this._proxyRecheckTimer = null; }
  }

  // ============ message dispatch ============
  _handle(msg) {
    log("WS", msg.type, msg);
    switch (msg.type) {
      case "snapshot":
        this._emit("snapshot", msg.devices || {});
        break;
      case "peer_snapshot":
        this._emit("peer_snapshot", msg.peers || []);
        break;
      case "peer_registered":
      case "peer_available":
      case "peer_unavailable":
        if (msg.peer) this._emit("peer_update", msg.peer);
        break;
      case "peer_queue_changed":
        this._emit("peer_queue", { peerId: msg.peer_id, queue: msg.queue });
        break;
      case "peer_queue_cleared":
        this._emit("peer_queue", {
          peerId: msg.peer_id,
          queue: { items: [], currentIndex: -1, playMode: "order", isActive: false },
        });
        break;
      case "queue_changed":
        this._emit("queue_changed", { deviceId: msg.device_id, queue: msg.queue });
        break;
      case "player_state_changed":
        this._emit("state", { deviceId: msg.device_id, state: msg.state });
        break;
      case "media_changed":
        this._emit("media", { deviceId: msg.device_id, media: msg.media });
        break;
      case "player_refresh":
        // 后端起播信号:提示卡片立即强制重新拉取该设备最新状态
        // (不依赖事件内容/时序,getStatus 走实时 SOAP 必拿真值)。
        this._emit("refresh", { deviceId: msg.device_id });
        break;
      case "group_changed":
        this._emit("group", msg.group);
        break;
      case "group_deleted":
        this._emit("group_deleted", msg.id);
        break;
      case "device_list_changed":
        // 后端发现 DLNA 设备上线/下线(实时 SSDP) -> 兜底刷新一次 peers
        this._emit("device_list_changed", { deviceCount: msg.deviceCount });
        break;
      case "connection_closed":
        // 集成侧的后端 WS 断了(后端重启等):重新订阅
        warn("backend connection closed, resubscribing");
        this._closeProxy();
        this._connected = false;
        this._emit("close");
        this._scheduleReconnect();
        break;
      default:
        break;
    }
  }

  // ============ Peer actions ============
  peerPath(peerId, suffix) {
    return `/api/v1/peers/${encodeURIComponent(peerId)}${suffix}`;
  }
  play(peerId) { return this.rest(this.peerPath(peerId, "/play"), { method: "POST" }); }
  pause(peerId) { return this.rest(this.peerPath(peerId, "/pause"), { method: "POST" }); }
  stop(peerId) { return this.rest(this.peerPath(peerId, "/stop"), { method: "POST" }); }
  next(peerId) { return this.rest(this.peerPath(peerId, "/next"), { method: "POST" }); }
  prev(peerId) { return this.rest(this.peerPath(peerId, "/prev"), { method: "POST" }); }
  seek(peerId, seconds) { return this.rest(this.peerPath(peerId, "/seek"), { method: "POST", body: { seconds } }); }
  setVolume(peerId, volume) {
    return this.rest(this.peerPath(peerId, "/volume"), { method: "POST", body: { volume: Math.round(volume * 100) } });
  }
  setMute(peerId, mute) {
    return this.rest(this.peerPath(peerId, "/mute"), { method: "POST", body: { muted: mute } });
  }
  setPlayMode(peerId, mode) {
    return this.rest(this.peerPath(peerId, "/play-mode"), { method: "POST", body: { mode } });
  }
  playQueue(peerId, items, startIndex = 0) {
    return this.rest(this.peerPath(peerId, "/queue/play"), { method: "POST", body: { items, startIndex } });
  }
  // 跳播到指定索引并立即播放(即使随机模式也尊重 index)。见后端 queue/jump。
  jumpToIndex(peerId, index) {
    return this.rest(this.peerPath(peerId, "/queue/jump"), { method: "POST", body: { index } });
  }
  enqueue(peerId, items) {
    return this.rest(this.peerPath(peerId, "/queue/enqueue"), { method: "POST", body: { items } });
  }
  removeAt(peerId, index) {
    return this.rest(this.peerPath(peerId, `/queue/${index}`), { method: "DELETE" });
  }
  clearQueue(peerId) {
    return this.rest(this.peerPath(peerId, "/queue"), { method: "DELETE" });
  }
  getQueue(peerId, { offset = 0, size = 0 } = {}) {
    const qs = [];
    if (offset) qs.push(`offset=${offset}`);
    if (size) qs.push(`size=${size}`);
    return this.rest(this.peerPath(peerId, `/queue${qs.length ? "?" + qs.join("&") : ""}`));
  }
  reorderQueue(peerId, from, to) {
    return this.rest(this.peerPath(peerId, "/queue/reorder"), { method: "POST", body: { from, to } });
  }
  getStatus(peerId) { return this.rest(this.peerPath(peerId, "/status")); }
  getPeers() { return this.rest("/api/v1/peers"); }

  // ============ Subsonic endpoints ============
  async search(query, { songCount = 20, songOffset = 0, albumCount = 20, albumOffset = 0, artistCount = 20, artistOffset = 0 } = {}) {
    const qs = `query=${encodeURIComponent(query)}&songCount=${songCount}&songOffset=${songOffset}` +
      `&albumCount=${albumCount}&albumOffset=${albumOffset}&artistCount=${artistCount}&artistOffset=${artistOffset}`;
    return this.rest(`/search3?${qs}`);
  }

  // 全部歌曲:复用 search3 空查询(后端注释明确支持空查询翻全库),按标题排序,
  // 走 songOffset/songCount 真分页,无需改后端即可实现「音乐」分类懒加载。
  async getSongs({ offset = 0, count = 60 } = {}) {
    return this.rest(`/search3?query=&songCount=${count}&songOffset=${offset}`);
  }
  async getLyrics(songId) {
    return this.rest(`/getLyricsBySongId?id=${encodeURIComponent(songId)}&f=json`);
  }
  async star(songId) { return this.rest(`/star?id=${encodeURIComponent(songId)}`); }
  async unstar(songId) { return this.rest(`/unstar?id=${encodeURIComponent(songId)}`); }
  async getPlaylists({ offset = 0, size = 0, query = "" } = {}) {
    const qs = [];
    if (offset) qs.push(`offset=${offset}`);
    if (size) qs.push(`size=${size}`);
    if (query) qs.push(`query=${encodeURIComponent(query)}`);
    return this.rest(`/getPlaylists${qs.length ? "?" + qs.join("&") : ""}`);
  }
  async updatePlaylist(playlistId, { songIdsToAdd = [] } = {}) {
    const qs = songIdsToAdd.map((id) => `songIdToAdd=${encodeURIComponent(id)}`).join("&");
    return this.rest(`/updatePlaylist?playlistId=${encodeURIComponent(playlistId)}${qs ? "&" + qs : ""}`);
  }
  async getStarred({ offset = 0, size = 0, query = "" } = {}) {
    const qs = [];
    if (offset) qs.push(`offset=${offset}`);
    if (size) qs.push(`size=${size}`);
    if (query) qs.push(`query=${encodeURIComponent(query)}`);
    return this.rest(`/getStarred2${qs.length ? "?" + qs.join("&") : ""}`);
  }

  // ============ Media library browse (Subsonic) ============
  async getAlbumList2({ type = "alphabeticalByName", genre = "", size = 300, offset = 0 } = {}) {
    const qs = `type=${encodeURIComponent(type)}&size=${size}&offset=${offset}` +
      (genre ? `&genre=${encodeURIComponent(genre)}` : "");
    return this.rest(`/getAlbumList2?${qs}`);
  }
  async getArtists() { return this.rest("/getArtists"); }
  async getArtist(id) { return this.rest(`/getArtist?id=${encodeURIComponent(id)}`); }
  async getAlbum(id, { offset = 0, size = 0 } = {}) {
    const qs = [`id=${encodeURIComponent(id)}`];
    if (offset) qs.push(`offset=${offset}`);
    if (size) qs.push(`size=${size}`);
    return this.rest(`/getAlbum?${qs.join("&")}`);
  }
  async getGenres() { return this.rest("/getGenres"); }
  async getPlaylistSongs(id, { offset = 0, size = 0 } = {}) {
    const qs = [`id=${encodeURIComponent(id)}`];
    if (offset) qs.push(`offset=${offset}`);
    if (size) qs.push(`size=${size}`);
    return this.rest(`/getPlaylist?${qs.join("&")}`);
  }

  // ============ MusicFlow v1 paginated browse endpoints ============
  // 与 Web 前端 Music/Albums/Artists/Genres 页面共用 /rest/api/v1/* 端点,
  // 返回 { total, page, pageSize, items },支持 page/pageSize/query。
  // 卡片据此实现「每页 8 行 + 分页控件」(参考主项目 PagePagination):服务端真分页,
  // 只拉当前页,并拿 total 渲染页码/跳页。
  async getSongsV2({ page = 1, pageSize = 8, query = "", genre = "" } = {}) {
    const qs = `page=${page}&pageSize=${pageSize}` +
      (query ? `&query=${encodeURIComponent(query)}` : "") +
      (genre ? `&genre=${encodeURIComponent(genre)}` : "");
    return this.rest(`/api/v1/songs?${qs}`);
  }
  async getAlbumsV2({ page = 1, pageSize = 8, query = "" } = {}) {
    const qs = `page=${page}&pageSize=${pageSize}` + (query ? `&query=${encodeURIComponent(query)}` : "");
    return this.rest(`/api/v1/albums?${qs}`);
  }
  async getArtistsV2({ page = 1, pageSize = 8, query = "" } = {}) {
    const qs = `page=${page}&pageSize=${pageSize}` + (query ? `&query=${encodeURIComponent(query)}` : "");
    return this.rest(`/api/v1/artists?${qs}`);
  }
  async getGenresV2({ page = 1, pageSize = 8, query = "" } = {}) {
    const qs = `page=${page}&pageSize=${pageSize}` + (query ? `&query=${encodeURIComponent(query)}` : "");
    return this.rest(`/api/v1/genres?${qs}`);
  }
  // 首页推荐:与 Web 首页共用同一批端点,能力驱动接收所有插件的推荐。
  // - 全量歌单(含每日推荐/本地推荐/随机补齐池)
  // - homeCount 配置(每日推荐插件,默认 8)
  // - recommend 能力插件输出(各平台精选,如 go-music-dl /music/recommend)
  async getPlaylistsV2({ page = 1, pageSize = 200 } = {}) {
    return this.rest(`/api/v1/playlists?page=${page}&pageSize=${pageSize}`);
  }
  async getHomePlaylistCount() {
    return this.rest("/api/v1/home/playlist-count");
  }
  /** 首页固定推荐卡:各推荐插件配置(showOnHome + homePosition)聚合,按位次排序。 */
  async getHomeCards() {
    return this.rest("/api/v1/recommend/home-cards");
  }
  async getRecommend() {
    return this.rest("/api/v1/recommend");
  }
  /** 手动刷新推荐:每日推荐/本地推荐重新随机生成并重组今日漫游(Web 首页刷新同源)。 */
  async refreshRecommend() {
    return this.rest("/api/v1/recommend/refresh", {
      method: "POST",
      body: {},
    });
  }
  async importRecommendPlaylist(providerId, payload) {
    return this.rest(`/api/v1/online/${encodeURIComponent(providerId)}/recommend/import`, {
      method: "POST",
      body: payload,
    });
  }

  // ============ 远程搜索(媒体库「本地/插件」切换,与 Web 前端同源端点) ============
  // kind: song | artist | album | playlist(映射 {kind}-search 端点)
  async getSearchProviders(kind) {
    return this.rest(`/api/v1/${kind}-search/providers`);
  }
  async remoteSearch(kind, providerId, q) {
    return this.rest(`/api/v1/${kind}-search/${encodeURIComponent(providerId)}/search`, {
      method: "POST",
      body: { q },
    });
  }
  // 远程集合详情(专辑/歌单/艺术家)只拉不导入:返回歌曲列表
  async remoteItems(kind, providerId, { source = "", id = "", name = "" } = {}) {
    const qs = [];
    if (source) qs.push(`source=${encodeURIComponent(source)}`);
    if (id) qs.push(`id=${encodeURIComponent(id)}`);
    if (name) qs.push(`name=${encodeURIComponent(name)}`);
    return this.rest(`/api/v1/${kind}-search/${encodeURIComponent(providerId)}/items${qs.length ? "?" + qs.join("&") : ""}`);
  }
  // 远程歌曲批量入库(返回 taskId;完成后的 result.ids 为真实 DB songId,供入队播放)
  async importRemoteSongs(providerId, songs) {
    return this.rest(`/api/v1/song-search/${encodeURIComponent(providerId)}/import`, {
      method: "POST",
      body: { songs },
    });
  }
  // 远程专辑/歌单整库导入(返回 taskId;完成后的 result.playlistId 为本地歌单 id)
  async importRemoteCollection(kind, providerId, payload) {
    return this.rest(`/api/v1/${kind}-search/${encodeURIComponent(providerId)}/import`, {
      method: "POST",
      body: payload,
    });
  }
  async getTask(taskId) {
    return this.rest(`/api/v1/tasks/${encodeURIComponent(taskId)}`);
  }
  // 轮询异步任务直到 ok/error,返回 result(导入类端点触发即返回 taskId)
  async waitTask(taskId, { intervalMs = 800, maxMs = 120000 } = {}) {
    const deadline = Date.now() + maxMs;
    for (;;) {
      const res = await this.getTask(taskId).catch(() => null);
      const t = res && res.task;
      if (t) {
        if (t.status === "ok") return t.result;
        if (t.status === "error") throw new Error(t.error || "task failed");
      }
      if (Date.now() > deadline) throw new Error("task timeout");
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  // ============ Media URLs ============
  // 封面统一返回可直接用于 <img src> 的 URL:
  // - 直连:带 token 的后端 /getCoverArt 直链(浏览器原生缓存 + 懒加载)。
  // - 代理:HA 同源代理直链 + ?token=,后端对该响应加了 Cache-Control/ETag,
  //   浏览器按 URL 复用,外网翻页/刷新不再重复下载同一封面。
  // 两种方式都返回字符串(不会返回 null),懒加载交给卡片的 IntersectionObserver。
  coverUrl(coverId) {
    if (!coverId) return null;
    const path = `/getCoverArt?id=${encodeURIComponent(coverId)}&size=${COVER_SIZE}`;
    if (this.mode === "proxy") {
      // 经 HA 同源代理:路径走 /api/musicflow/rest,并把 token 一并带在 query 里。
      // path 本身已含 '?',必须按 separator 用 '&' 追加,否则出现两个 '?' 会让
      // token 落到第二个 '?' 之后而失效,且 size 被污染 → 代理模式封面全失败。
      const sep = path.includes("?") ? "&" : "?";
      return `/api/musicflow/rest${path}${sep}token=${encodeURIComponent(this.apiKey)}`;
    }
    return this._withToken(path);
  }

  // 模式感知的封面 URL 解析:返回可直接赋值给 <img src> 的值。
  // - 直连:返回可缓存直链(浏览器原生缓存 + 懒加载),与 coverUrl 一致。
  // - 代理:浏览器裸 <img src> 加载 /api/musicflow/rest/* 时不会携带 HA 鉴权,
  //   外网会被 401 → 封面全空白(这正是 v1.6.9 把 blob 改成直链后外网回归的根因)。
  //   故代理模式改为经 fetchWithAuth(带 HA 凭据)拉取,转 objectURL 复用;
  //   与 pre-v1.6.9 行为一致,外网恢复正常。结果按 coverId@size 缓存避免重复拉取。
  async requestCover(coverId) {
    if (!coverId) return null;
    const key = `${coverId}@${COVER_SIZE}`;
    this._coverBlobCache = this._coverBlobCache || new Map();
    const hit = this._coverBlobCache.get(key);
    if (hit) return hit; // 已解析的 url,或正在进行的 promise(可 await)

    const path = `/getCoverArt?id=${encodeURIComponent(coverId)}&size=${COVER_SIZE}`;
    let url;
    if (this.mode === "proxy") {
      url = `/api/musicflow/rest${path}`;
      if (this.apiKey) {
        const sep = url.includes("?") ? "&" : "?";
        url += `${sep}token=${encodeURIComponent(this.apiKey)}`;
      }
    } else {
      url = this._withToken(path);
    }

    const promise = (async () => {
      try {
        const res = await (this.mode === "proxy"
          ? this.hass.fetchWithAuth(url)
          : fetch(url));
        if (!res.ok) { this._coverBlobCache.delete(key); return null; }
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        this._coverBlobCache.set(key, objUrl);
        return objUrl;
      } catch (e) {
        this._coverBlobCache.delete(key);
        return null;
      }
    })();
    // 存 promise 防并发重入;resolve 后上面会改写为真实 objectURL。
    this._coverBlobCache.set(key, promise);
    return promise;
  }
}

export function childToQueueItem(child) {
  const SUFFIX_MIME = {
    mp3: "audio/mpeg", flac: "audio/flac", wav: "audio/wav", aac: "audio/aac",
    ogg: "audio/ogg", m4a: "audio/mp4", opus: "audio/opus", wma: "audio/x-ms-wma", ape: "audio/ape",
  };
  const suffix = (child.suffix || "").toLowerCase();
  return {
    songId: child.id || child.songId,
    title: child.title || "未知",
    artist: child.artist || undefined,
    album: child.album || undefined,
    albumId: child.albumId || undefined,
    mime: SUFFIX_MIME[suffix] || "audio/mpeg",
    coverArt: child.coverArt || (child.albumId ? `al-${child.albumId}` : undefined),
    duration: child.duration || undefined,
  };
}

export function parseLyrics(subsonicResp) {
  const structured = subsonicResp?.lyricsList?.structuredLyrics || [];
  const first = structured.find((l) => l.synced) || structured[0];
  if (!first || !first.line) return [];
  return first.line
    .filter((l) => l.start !== undefined && l.start !== null)
    .map((l) => ({ time: Number(l.start) / 1000, text: l.value }))
    .sort((a, b) => a.time - b.time);
}
