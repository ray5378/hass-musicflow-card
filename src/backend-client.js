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
//                    Used when the browser cannot reach the backend directly
//                    (PNA / mixed content / private IP not routable from the WAN).
//   transport "auto" (default) - probe a direct REST call first; on failure and
//                    when the integration reports proxySupported, fall back to
//                    proxy mode. "direct" / "proxy" force a specific mode.

const RECONNECT_DELAY = 3000;
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
    this._coverCache = new Map();
    this._listeners = new Map();
    this._connected = false;
    this._pendingInit = null;
    this._reconnectTimer = null;
    this._connecting = false;
    this._subPending = false;
    this._proxyFallbackTried = false;
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
    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      this._handle(msg);
    };
    ws.onopen = () => {
      ws._mfOpened = true;
      this._connected = true;
      log("WS open");
      this._emit("open");
      this._startWsKeepalive();
    };
    ws.onclose = () => {
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
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      this.connect();
    }, RECONNECT_DELAY);
  }
  disconnect() {
    if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
    this._stopWsKeepalive();
    this._closeProxy();
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
  getQueue(peerId) { return this.rest(this.peerPath(peerId, "/queue")); }
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
  async getPlaylists() { return this.rest("/getPlaylists"); }
  async updatePlaylist(playlistId, { songIdsToAdd = [] } = {}) {
    const qs = songIdsToAdd.map((id) => `songIdToAdd=${encodeURIComponent(id)}`).join("&");
    return this.rest(`/updatePlaylist?playlistId=${encodeURIComponent(playlistId)}${qs ? "&" + qs : ""}`);
  }
  async getStarred() { return this.rest("/getStarred2"); }

  // ============ Media library browse (Subsonic) ============
  async getAlbumList2({ type = "alphabeticalByName", genre = "", size = 300, offset = 0 } = {}) {
    const qs = `type=${encodeURIComponent(type)}&size=${size}&offset=${offset}` +
      (genre ? `&genre=${encodeURIComponent(genre)}` : "");
    return this.rest(`/getAlbumList2?${qs}`);
  }
  async getArtists() { return this.rest("/getArtists"); }
  async getArtist(id) { return this.rest(`/getArtist?id=${encodeURIComponent(id)}`); }
  async getAlbum(id) { return this.rest(`/getAlbum?id=${encodeURIComponent(id)}`); }
  async getGenres() { return this.rest("/getGenres"); }
  async getPlaylistSongs(id) { return this.rest(`/getPlaylist?id=${encodeURIComponent(id)}`); }

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

  // ============ Media URLs ============
  coverUrl(coverId) {
    if (!coverId) return null;
    if (this.mode === "proxy") {
      // 经 HA 拉取并转成 blob URL(浏览器 <img> 无法带 HA 认证头)。
      // 首次返回 null 占位,取到后通过 cover_ready 事件触发重渲染。
      if (this._coverCache.has(coverId)) return this._coverCache.get(coverId);
      this._fetchCover(coverId);
      return null;
    }
    return this._withToken(`/getCoverArt?id=${encodeURIComponent(coverId)}&size=300`);
  }

  async _fetchCover(coverId) {
    try {
      const res = await this.hass.fetchWithAuth(
        `/api/musicflow/rest/getCoverArt?id=${encodeURIComponent(coverId)}&size=300`
      );
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      this._coverCache.set(coverId, url);
      this._emit("cover_ready");
    } catch (e) {
      error("proxy cover fetch failed", coverId, e);
    }
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
