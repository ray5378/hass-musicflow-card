// MusicFlow Remote Card — a Lovelace card that acts as a full external
// controller for a MusicFlow server. It connects directly to the backend's
// real-time /ws channel + REST API (via the `musicflow/backend_config` HA WS
// command), so it is an equal peer to the Web/App clients.
import { LitElement, html, css } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { BackendClient, childToQueueItem, parseLyrics } from "./backend-client.js";

const PLAY_MODES = ["order", "one", "all", "shuffle"];
const PLAY_MODE_LABEL = { order: "顺序", one: "单曲", all: "循环", shuffle: "随机" };
const PLAY_MODE_TIP = { order: "顺序播放", one: "单曲循环", all: "列表循环", shuffle: "随机播放" };
// 与主项目一致(lucide):order→list-ordered / one→repeat-1 / all→repeat / shuffle→shuffle
const PLAY_MODE_ICON = { order: "listOrdered", one: "repeat1", all: "repeat", shuffle: "shuffle" };
// 媒体库全库统一滚动(所有库类型同一套):虚拟滚动 + 窗口化预取。
// - CHUNK:每次向服务端要一块的条数(服务端 offset/size 分页,内存恒定 1 块)。
// - ROW_STEP:固定行高 + 行距(px),必须与 CSS .bitem 高(48)+ .br-list gap(2)一致,
//   虚拟滚动按它计算窗口与占位高度。
// - VS_OVERSCAN:窗口上下多渲染的行数(预取提前量)。
// - VS_CONCURRENCY:同时在途的块请求上限(快速滚动时不打爆服务端)。
const CHUNK = 200;
const ROW_STEP = 50;
const VS_OVERSCAN = 6;
const VS_CONCURRENCY = 2;

// 歌词滚动:单行高度(px)。必须与 CSS .lyricbox-line 的 height/line-height 一致,
// 因为轨道位移是按「行数 x 行高」算的。视口高 = LYRIC_VIEW_LINES x 该值(见 CSS .lyricbox)。
const LYRIC_LINE_H = 20;
// 视口显示行数,以及「当前行」落在第几槽(0 基)。当前 = 4 行视口、当前行固定在第 2 行。
const LYRIC_VIEW_LINES = 4;
const LYRIC_CUR_SLOT = 1;

// lucide 24x24 图标内容(stroke 风格,与 MusicFlow 主项目 MfIcon 同源)
const MF_ICONS = {
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  prev: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>',
  next: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
  shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  repeat1: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10h1v4"/>',
  listOrdered: '<line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  volume2: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  volumeX: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  queue: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  mediaLibrary: '<path d="M20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M20,16H8V4H20M12.5,15A2.5,2.5 0 0,0 15,12.5V7H18V5H14V10.5C13.58,10.19 13.07,10 12.5,10A2.5,2.5 0 0,0 10,12.5A2.5,2.5 0 0,0 12.5,15M4,6H2V20A2,2 0 0,0 4,22H18V20H4"/>',
  // 媒体库分类图标(lucide,与主项目前端 lucide-vue-next 完全同款路径):
  // 音乐→Headphones / 专辑→Disc3 / 艺术家→User / 风格→Library / 歌单→List / 我喜欢→Heart(filled)
  headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  disc3: '<circle cx="12" cy="12" r="10"/><path d="M6 12c0-1.7.7-3.2 1.8-4.2"/><circle cx="12" cy="12" r="2"/><path d="M18 12c0 1.7-.7 3.2-1.8 4.2"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  list: '<path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/>',
  library: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
  heart2: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
};

function log(...args) { console.log("[MF card]", ...args); }
function err(...args) { console.error("[MF card]", ...args); }

// 媒体库根层级分类图标映射(与主项目前端同款):歌单→List / 专辑→Disc3 / 音乐→Headphones
// 艺术家→User / 风格→Library / 我喜欢的音乐→Heart(实心红)
const CAT_ICONS = { playlists: "list", albums: "disc3", songs: "headphones", artists: "user", genres: "library", starred: "heart2" };
const CAT_HEART = new Set(["starred"]); // 心形分类:filled + 实心红

class MusicFlowRemoteCard extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      _config: { state: true },
    };
  }

  setConfig(config) {
    this._config = config || {};
  }

  constructor() {
    super();
    this._client = null;
    this._ready = false;
    this._ui = {
      error: "",
      connected: false,
      serverOk: false,
      peers: [],
      currentPeerId: "",
      queue: { total: 0, currentIndex: -1, playMode: "shuffle", isActive: false, ended: false },
      // 队列虚拟滚动状态:稀疏缓存(Map idx→item)+ 已加载/加载中块集合 + 渲染窗口
      qCache: new Map(),
      qLoaded: new Set(),
      qLoading: new Set(),
      qWinStart: 0,
      qWinEnd: -1,
      catIconSize: 42, // 媒体库根层级分类图标尺寸(按可用高度自适应;卡片宽由容器查询保证 hover 不超)
      currentIndex: -1,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playMode: "shuffle",
      volume: 0.8,
      muted: false,
      song: null,
      lyrics: [],
      currentLyric: "",
      lyricIndex: -1,
      liked: false,
      showQueue: false,
      showBrowser: false,
      browserStack: [],
      showVolume: false,
      coverLightText: true, // 封面背景融合:true=浅色文字(暗背景),false=深色文字(亮背景)
      volAnchor: null,
    };
    this._tickTimer = null;
    this._pollTimer = null;
    this._heartbeatTimer = null;
    this._volumeDebounce = null;
    this._coverObserver = null; // 视口懒加载封面的 IntersectionObserver
    this._coverObserverRoot = null; // 该 observer 绑定的滚动容器(媒体库每次重开是新节点)
    this._vsInflight = 0; // 全库滚动:同时在途的块请求数(上限 VS_CONCURRENCY)
    this._vsRaf = 0; // 滚动处理 rAF 句柄(节流)
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._teardown();
  }

  _teardown() {
    if (this._tickTimer) { clearInterval(this._tickTimer); this._tickTimer = null; }
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    if (this._heartbeatTimer) { clearInterval(this._heartbeatTimer); this._heartbeatTimer = null; }
    if (this._probeTimer) { clearInterval(this._probeTimer); this._probeTimer = null; }
    if (this._client) this._client.disconnect();
    if (this._coverObserver) { this._coverObserver.disconnect(); this._coverObserver = null; }
    this._coverObserverRoot = null;
  }

  set hass(hass) {
    const old = this._hass;
    this._hass = hass;
    if (!old && hass && !this._ready) this._bootstrap(hass);
  }
  get hass() { return this._hass; }

  async _bootstrap(hass) {
    this._ready = true;
    const cfg = this._config || {};
    this._client = new BackendClient({
      hass,
      url: cfg.url || null,
      apiKey: cfg.api_key || null,
      transport: cfg.transport || "auto", // auto | direct | proxy
    });
    try {
      await this._client.init();
    } catch (e) {
      const msg = e.message || String(e);
      err("init failed", msg);
      this._ui.error = msg;
      this.requestUpdate();
      return;
    }
    this._bindClient();
    this._client.connect();
    // WS 断开期间每 15s 用 REST 探测一次服务器可达性,作为"调暗"的判定依据。
    this._probeTimer = setInterval(() => { if (!this._ui.connected) this._probeServer(); }, 15000);
  }

  // REST 探测服务器是否可达(只在 WS 断开时调用);成功=能和服务器通信,不变暗。
  _probeServer() {
    if (this._ui.connected || !this._client) return;
    this._client.getPeers()
      .then(() => { this._ui.serverOk = true; })
      .catch(() => { this._ui.serverOk = false; })
      .finally(() => this.requestUpdate());
  }

  _bindClient() {
    const c = this._client;
    c.on("open", () => {
      this._ui.connected = true;
      this._ui.serverOk = true;
      this._startHeartbeat();
      this.requestUpdate();
    });
    // WS 断开 ≠ 连不上服务器(可能只是 WS 通道被空闲超时掐断)。先 REST 探测,
    // 探测成功说明服务器可达,保持卡片正常显示;探测失败才调暗。
    c.on("close", () => { this._ui.connected = false; this._probeServer(); this.requestUpdate(); });
    c.on("rest_ok", () => {
      if (!this._ui.serverOk) { this._ui.serverOk = true; this.requestUpdate(); }
    });
    c.on("snapshot", (devices) => this._applySnapshot(devices));
    c.on("peer_snapshot", (peers) => this._applyPeerSnapshot(peers));
    c.on("peer_update", (peer) => this._upsertPeer(peer));
    c.on("peer_queue", ({ peerId, queue }) => this._applyPeerQueue(peerId, queue));
    c.on("queue_changed", ({ deviceId, queue }) => this._applyDeviceQueue(deviceId, queue));
    c.on("state", ({ deviceId, state }) => this._applyDeviceState(deviceId, state));
    c.on("media", ({ deviceId, media }) => this._applyDeviceMedia(deviceId, media));
    c.on("group", () => this._refreshPeers());
    c.on("group_deleted", () => this._refreshPeers());
    // 后端实时发现 DLNA 设备上线/下线 -> 刷新设备列表(peer_registered/available
    // 事件通常也会到,这里兜底确保卡片立刻显示刚上线的设备)。
    c.on("device_list_changed", () => this._refreshPeers());
    // 封面统一走 <img src> URL + 视口懒加载,浏览器按 URL 复用缓存,无需重渲染钩子
  }

  // ============ Peer / output management ============
  _resolveDefaultPeerId(peers) {
    const cfg = this._config || {};
    if (cfg.entity && this._hass?.states?.[cfg.entity]) {
      const pid = this._hass.states[cfg.entity].attributes?.peer_id;
      if (pid && peers.some((p) => p.peerId === pid)) return pid;
    }
    return null;
  }

  // 本卡片只控制 DLNA 设备,非 DLNA(local/group)不显示。
  _isDlnaPeer(p) {
    if (!p) return false;
    if (typeof p.peerId === "string") return p.peerId.startsWith("dlna:");
    return (p.kind || "") === "dlna";
  }
  _filterDlna(peers) {
    return (peers || []).filter((p) => this._isDlnaPeer(p));
  }

  _applyPeerSnapshot(peers) {
    // 只显示在线 DLNA 设备(离线设备由 _upsertPeer 移除,此处过滤兜底)。
    const list = this._filterDlna(peers).filter((p) => p.available !== false);
    this._ui.peers = list;
    const pinned = this._resolveDefaultPeerId(list);
    if (!this._ui.currentPeerId || pinned) {
      const preferred = pinned && list.find((p) => p.peerId === pinned);
      const first = preferred || list.find((p) => p.available) || list[0];
      if (first) this._selectPeer(first.peerId, true);
    } else {
      this._refreshCurrentPeerView();
    }
    this.requestUpdate();
  }

  _applySnapshot(devices) {
    // devices: { <deviceId>: DeviceStatus+media+name }
    // If current peer is dlna:<deviceId>, seed initial state from the snapshot.
    const pid = this._ui.currentPeerId;
    if (!pid || !pid.startsWith("dlna:")) return;
    const deviceId = pid.slice(5);
    const st = devices[deviceId];
    if (st) this._applyStatus(st);
  }

  _upsertPeer(peer) {
    if (!peer || !this._isDlnaPeer(peer)) return;
    // 设备离线:从列表移除(不再置灰显示);若正是当前播放设备,自动切到下一个可用。
    if (peer.available === false) {
      const before = this._ui.peers.length;
      this._ui.peers = this._ui.peers.filter((x) => x.peerId !== peer.peerId);
      if (this._ui.currentPeerId === peer.peerId) {
        const next = this._ui.peers.find((x) => x.available);
        if (next) this._selectPeer(next.peerId, true);
        else this._ui.currentPeerId = null;
      }
      if (before !== this._ui.peers.length) this.requestUpdate();
      return;
    }
    const idx = this._ui.peers.findIndex((p) => p.peerId === peer.peerId);
    if (idx >= 0) this._ui.peers[idx] = { ...this._ui.peers[idx], ...peer };
    else this._ui.peers.push(peer);
    this.requestUpdate();
  }

  _applyPeerQueue(peerId, queue) {
    if (peerId === this._ui.currentPeerId) this._applyQueue(queue);
    const idx = this._ui.peers.findIndex((p) => p.peerId === peerId);
    if (idx >= 0) this._ui.peers[idx] = { ...this._ui.peers[idx], queue };
    this.requestUpdate();
  }

  _applyDeviceQueue(deviceId, queue) {
    const pid = this._ui.currentPeerId;
    if (pid === `dlna:${deviceId}` || pid === `group:${deviceId}`) {
      this._applyQueue(queue);
    }
    const idx = this._ui.peers.findIndex((p) => p.peerId === `dlna:${deviceId}` || p.peerId === `group:${deviceId}`);
    if (idx >= 0) this._ui.peers[idx] = { ...this._ui.peers[idx], queue };
    this.requestUpdate();
  }

  _applyQueue(queue) {
    if (!queue) return;
    const items = Array.isArray(queue.items) ? queue.items : null;
    const prev = this._ui.queue || {};
    const total = typeof queue.total === "number" ? queue.total : (items ? items.length : (prev.total || 0));
    this._ui.queue = {
      total,
      currentIndex: typeof queue.currentIndex === "number" ? queue.currentIndex : (prev.currentIndex ?? -1),
      playMode: typeof queue.playMode === "string" ? queue.playMode : (prev.playMode || "shuffle"),
      isActive: queue.isActive ?? prev.isActive,
      ended: queue.ended ?? prev.ended,
    };
    // 镜像字段:旧代码仍读 _ui.currentIndex / _ui.playMode(切歌高亮、模式切换等)。
    if (typeof queue.currentIndex === "number") this._ui.currentIndex = queue.currentIndex;
    if (typeof queue.playMode === "string") this._ui.playMode = queue.playMode;
    if (items && items.length >= (total || 0)) {
      // 仅"全量 items"(len===total,小队列 WS 整推或旧后端全量返回)才视为权威重建缓存;
      // 分块/部分 items 不覆盖窗口缓存,避免 2s 轮询把滚动中已加载的块清空。
      this._ui.qCache = new Map(items.map((it, i) => [i, it]));
      this._ui.qLoaded = new Set([0]);
      this._ui.qLoading = new Set();
      this._ui.qWinStart = 0;
      this._ui.qWinEnd = -1;
    } else if (total !== (prev.total ?? 0)) {
      // 摘要且 total 变化(增删/清空/换队列):内容变了,清缓存重拉当前窗口。
      this._qReset();
    }
    if (this._ui.showQueue) this._qEnsureLoaded();
    this.requestUpdate();
  }

  _applyDeviceState(deviceId, state) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    if (pid === `dlna:${deviceId}` || pid === `group:${deviceId}`) {
      this._applyStatus(state);
    }
  }

  _applyDeviceMedia(deviceId, media) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    if (pid === `dlna:${deviceId}` || pid === `group:${deviceId}`) {
      this._setMedia(media);
    }
  }

  _applyStatus(status) {
    if (!status) return;
    this._ui.isPlaying = status.state === "PLAYING";
    if (typeof status.position === "number") this._ui.currentTime = status.position;
    if (typeof status.duration === "number" && status.duration > 0) this._ui.duration = status.duration;
    // 拖拽中忽略服务器回传的音量,避免外网代理延迟把滑块拽回旧值(跟手问题)。
    if (typeof status.volume === "number" && !this._ui.volDragging) this._ui.volume = Math.max(0, Math.min(100, status.volume)) / 100;
    if (typeof status.muted === "boolean") this._ui.muted = status.muted;
    if (status.media) this._setMedia(status.media);
    this._updateLyric();
    this.requestUpdate();
  }

  _setMedia(media) {
    if (!media) return;
    const song = {
      songId: media.songId,
      title: media.title || "未知",
      artist: media.artist || "",
      album: media.album || "",
      coverArt: media.coverArt,
      duration: media.duration || this._ui.duration || 0,
    };
    const changed = song.songId !== this._ui.song?.songId;
    this._ui.song = song;
    if (changed && song.songId) {
      this._ui.lyrics = [];
      this._ui.currentLyric = "";
      this._ui.lyricIndex = -1;
      this._ui.coverLightText = true; // 新封面分析完成前先浅色文字,避免闪深色
      this._client.scrobble?.(song.songId).catch((e) => err("scrobble failed", e));
      this._loadLyrics(song.songId);
      this._loadLiked(song.songId);
    }
    this.requestUpdate();
  }

  _refreshPeers() {
    this._client.getPeers().then((res) => {
      const peers = this._filterDlna(res?.peers || []).filter((p) => p.available !== false);
      if (peers.length) { this._ui.peers = peers; this.requestUpdate(); }
    }).catch((e) => err("getPeers failed", e));
  }

  async _refreshCurrentPeerView() {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    try {
      const [status, queue] = await Promise.all([
        this._client.getStatus(pid),
        this._client.getQueue(pid, { size: CHUNK }), // 分块:只同步元数据,队列内容按需窗口化拉取
      ]);
      this._applyStatus(status);
      this._applyQueue(queue);
    } catch (e) {
      err("refreshCurrentPeerView failed", e);
    }
  }

  _selectPeer(peerId, silent) {
    if (peerId === this._ui.currentPeerId) return;
    this._ui.currentPeerId = peerId;
    this._stopTracking();
    this._ui.queue = { total: 0, currentIndex: -1, playMode: "shuffle", isActive: false, ended: false };
    this._ui.currentIndex = -1;
    this._qReset();
    this._ui.song = null;
    this._ui.lyrics = [];
    this._ui.currentLyric = "";
    this._ui.lyricIndex = -1;
    this._ui.currentTime = 0;
    this._ui.duration = 0;
    this._refreshCurrentPeerView();
    this._startTracking();
    this.requestUpdate();
  }

  // ============ Real-time progress tracking ============
  _startTracking() {
    this._stopTracking();
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    this._pollTimer = setInterval(async () => {
      try {
        const [status, queue] = await Promise.all([
          this._client.getStatus(pid),
          this._client.getQueue(pid, { size: CHUNK }), // 分块:只同步 total/currentIndex,不全量拉
        ]);
        this._applyStatus(status);
        this._applyQueue(queue);
      } catch (e) {
        err("poll failed", e);
      }
    }, 2000);
    this._tickTimer = setInterval(() => {
      if (this._ui.isPlaying && this._ui.duration > 0 && this._ui.currentTime < this._ui.duration) {
        this._ui.currentTime = Math.min(this._ui.duration, this._ui.currentTime + 0.25);
        this._updateLyric();
        this.requestUpdate();
      }
    }, 250);
  }

  _stopTracking() {
    if (this._tickTimer) { clearInterval(this._tickTimer); this._tickTimer = null; }
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
  }

  _startHeartbeat() {
    if (this._heartbeatTimer) return;
    this._heartbeatTimer = setInterval(() => {
      const pid = this._ui.currentPeerId;
      if (pid && pid.startsWith("local:")) this._client.heartbeat(pid).catch((e) => err("heartbeat failed", e));
    }, 30000);
  }

  // ============ Controls ============
  _togglePlay() {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    if (this._ui.isPlaying) {
      this._client.pause(pid).catch((e) => err("pause failed", e));
    } else {
      this._client.play(pid).catch((e) => err("play failed", e));
    }
    this._ui.isPlaying = !this._ui.isPlaying;
    this.requestUpdate();
  }

  _next() {
    const pid = this._ui.currentPeerId;
    if (pid) this._client.next(pid).catch((e) => err("next failed", e));
  }

  _prev() {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    if (this._ui.currentTime > 3) {
      this._client.seek(pid, 0).then(() => { this._ui.currentTime = 0; this.requestUpdate(); }).catch((e) => err("seek failed", e));
    } else {
      this._client.prev(pid).catch((e) => err("prev failed", e));
    }
  }

  _cyclePlayMode() {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    const next = PLAY_MODES[(PLAY_MODES.indexOf(this._ui.playMode) + 1) % PLAY_MODES.length];
    this._ui.playMode = next;
    this._client.setPlayMode(pid, next).catch((e) => err("setPlayMode failed", e));
    this.requestUpdate();
  }

  _setVolume(e) {
    const v = Number(e.target.value) / 100;
    this._ui.volume = v;
    const pid = this._ui.currentPeerId;
    if (pid) {
      if (this._volumeDebounce) clearTimeout(this._volumeDebounce);
      this._volumeDebounce = setTimeout(() => {
        this._client.setVolume(pid, v).catch((err2) => err("setVolume failed", err2));
      }, 150);
    }
    this.requestUpdate();
  }

  _toggleMute() {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    const next = !this._ui.muted;
    this._ui.muted = next;
    this._client.setMute(pid, next).catch((e) => err("setMute failed", e));
    this.requestUpdate();
  }

  // 音量:点击展开覆盖下半卡的音量遮罩层。
  // 必须 stopPropagation,否则事件冒泡到 .wrap 的「点外部关闭」会立刻把刚打开的面板关掉。
  _toggleVolumePop(e) {
    e?.stopPropagation?.();
    if (!this._ui.showVolume) { this._ui.showQueue = false; this._ui.showBrowser = false; } // 打开音量时关闭队列/媒体库面板(互斥)
    this._ui.showVolume = !this._ui.showVolume;
    this.requestUpdate();
  }

  // 点击音量控件本体以外的任意位置 = 关闭并保存(音量拖动时已实时下发,无需确认按钮)
  _onWrapClick(e) {
    const path = e.composedPath ? e.composedPath() : [];
    if (this._ui.showVolume) {
      for (const n of path) {
        if (n?.classList?.contains?.("vol-row")) return; // 点在静音键/音量条上不关闭
      }
      this._ui.showVolume = false;
      this.requestUpdate();
      return;
    }
    // 队列/媒体库面板(无感全屏覆盖)打开时:点列表项/按钮/面包屑/搜索框不收起,点面板空白处收起。
    if (this._ui.showQueue || this._ui.showBrowser) {
      const keep = ["qitem", "sitem", "bitem", "mini", "crumb",
        "br-search", "search-input", "cat", "pg-btn", "pg-input", "pg-jump"];
      for (const n of path) {
        const cls = n && n.classList;
        if (cls && Array.from(cls).some((c) => keep.includes(c))) return; // 点在交互元素上不收起
      }
      this._ui.showQueue = false;
      this._ui.showBrowser = false;
      this.requestUpdate();
      return;
    }
  }

  // 音量面板:本层完全透明(无底色/无模糊),「遮挡」靠 .lower.volmode 把控件行、
  // 进度条、队列设为 visibility:hidden 原地隐身实现——露出的是卡片自身的模糊封面背景,
  // 与上半部分同源,无色差无边界,卡片高度零跳变。上半部分保持可见可点(点一下即关闭)。
  // 布局对齐:静音键 42px 顶替进度条左侧时间标签的位置,右侧留 42px 空位,
  // 使音量条与下方 seek 严格等长、上下重合。
  // 触屏优化:采用「相对拖动」——按下只记录起点、不跳值;移动时按位移增量调音量。
  _renderVolumeOverlay() {
    const u = this._ui;
    const vpct = Math.round(u.volume * 100);
    return html`
      <div class="vol-overlay">
        <div class="vol-row" @click=${(e) => e.stopPropagation()}>
          <button class="ctl" title="${u.muted ? "取消静音" : "静音"}" @click=${this._toggleMute}>${this._icon(u.muted ? "volumeX" : "volume2", 20)}</button>
          <div class="vol-slider" @pointerdown=${this._volPointerDown} @pointermove=${this._volPointerMove} @pointerup=${this._volPointerUp} @pointercancel=${this._volPointerUp}>
            <div class="vol-track"></div>
            <div class="vol-fill" style="width:${vpct}%"></div>
            <div class="vol-knob" style="left:${vpct}%"></div>
            <span class="vol-value" style="left:${vpct}%">${vpct}%</span>
          </div>
          <span class="vol-gap"></span>
        </div>
      </div>`;
  }

  _volPointerDown(e) {
    const el = e.currentTarget;
    if (el.setPointerCapture && e.pointerId != null) { try { el.setPointerCapture(e.pointerId); } catch {} }
    const rect = el.getBoundingClientRect();
    this._volSliderEl = el;
    this._volDrag = { startX: e.clientX, startVal: this._ui.volume, width: Math.max(1, rect.width) };
    this._ui.volDragging = true;
    el.classList.add("dragging");
  }

  _volPointerMove(e) {
    if (!this._volDrag) return;
    const d = this._volDrag;
    let pct = d.startVal * 100 + ((e.clientX - d.startX) / d.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    const v = pct / 100;
    this._ui.volume = v;
    // 直接改 DOM,避免每次 pointermove 触发整卡重渲染——外网代理下更跟手。
    const el = this._volSliderEl;
    if (el) {
      const fill = el.querySelector(".vol-fill");
      const knob = el.querySelector(".vol-knob");
      const val = el.querySelector(".vol-value");
      if (fill) fill.style.width = pct + "%";
      if (knob) knob.style.left = pct + "%";
      if (val) { val.style.left = pct + "%"; val.textContent = Math.round(pct) + "%"; }
    }
    this._commitVolume(v);
  }

  _volPointerUp() {
    if (!this._volDrag) return;
    const el = this._volSliderEl;
    if (el) el.classList.remove("dragging");
    this._volSliderEl = null;
    this._volDrag = null;
    this._ui.volDragging = false;
    this._commitVolume(this._ui.volume, true);
    this.requestUpdate();
  }

  _commitVolume(v, immediate = false) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    if (this._volumeDebounce) clearTimeout(this._volumeDebounce);
    if (immediate) {
      this._client.setVolume(pid, v).catch((e) => err("setVolume failed", e));
      return;
    }
    this._volumeDebounce = setTimeout(() => {
      this._client.setVolume(pid, v).catch((e) => err("setVolume failed", e));
    }, 120);
  }

  _seek(e) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    const pct = Number(e.target.value);
    const t = (pct / 100) * (this._ui.duration || 0);
    this._ui.currentTime = t;
    this._client.seek(pid, t).catch((err2) => err("seek failed", err2));
    this._updateLyric();
    this.requestUpdate();
  }

  // ============ Lyrics ============
  async _loadLyrics(songId) {
    try {
      const res = await this._client.getLyrics(songId);
      this._ui.lyrics = parseLyrics(res);
      this._updateLyric();
    } catch (e) {
      err("loadLyrics failed", e);
      this._ui.lyrics = [];
    }
    this.requestUpdate();
  }

  _updateLyric() {
    const lines = this._ui.lyrics;
    if (!lines.length) { this._ui.currentLyric = ""; this._ui.lyricIndex = -1; return; }
    const t = this._ui.currentTime;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= t) idx = i; else break;
    }
    this._ui.currentLyric = idx >= 0 ? lines[idx].text : "";
    this._ui.lyricIndex = idx;
  }

  // ============ Like / star ============
  async _loadLiked(songId) {
    try {
      const res = await this._client.getStarred();
      const ids = new Set((res?.starred2?.song || res?.starred?.song || []).map((s) => s.id));
      this._ui.liked = ids.has(songId);
    } catch (e) {
      err("loadLiked failed", e);
      this._ui.liked = false;
    }
    this.requestUpdate();
  }

  async _toggleLike() {
    const song = this._ui.song;
    if (!song?.songId) return;
    const wasLiked = this._ui.liked;
    this._ui.liked = !wasLiked; // 乐观翻转,先给即时反馈
    this.requestUpdate();
    try {
      if (wasLiked) {
        const r = await this._client.unstar(song.songId);
        if (r?.error) throw new Error(r.error.message || "unstar failed");
      } else {
        const r = await this._client.star(song.songId);
        if (r?.error) throw new Error(r.error.message || "star failed");
      }
      // 成功后从后端重新同步收藏态,保证 UI 与服务器一致(也能暴露代理通道失败)
      await this._loadLiked(song.songId);
    } catch (e) {
      err("like toggle failed", e);
      this._ui.liked = wasLiked; // 失败回退到真实状态
      this._ui.error = "喜欢操作失败(可能代理通道异常或未连通),请重试";
      this.requestUpdate();
    }
  }

  // ============ Queue ============
  _removeFromQueue(index) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    this._client.removeAt(pid, index).catch((e) => err("removeAt failed", e));
  }

  _clearQueue() {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    this._client.clearQueue(pid).catch((e) => err("clearQueue failed", e));
  }

  // 跳播到队列中指定曲目并立即播放(后端已持有该队列,直接跳;shuffle 下也尊重指定索引)
  _jumpTo(index) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    const total = (this._ui.queue && this._ui.queue.total) || 0;
    if (index < 0 || index >= total) return;
    this._client.jumpToIndex(pid, index)
      .catch((e) => {
        // 后端未升级:退化成完整队列 + 目标索引重放(REST 拉全量,不再依赖本地全量数组)
        err("jumpToIndex unavailable, fallback to playQueue", e);
        this._client.getQueue(pid).then((q) => {
          const items = (q && q.items) || [];
          this._client.playQueue(pid, items, index).catch((e2) => err("jumpTo failed", e2));
        }).catch((e2) => err("jumpTo fallback getQueue failed", e2));
      });
  }

  // 加入播放队列并播放这首歌(不是继续播队列里别的歌):
  // 1) enqueue 把该曲追加到后端队列末尾(队列为空时后端会自动起播)
  // 2) 取权威队列,定位刚追加的这首歌(末尾),用 jump 跳播到它
  //    —— 关键:后端 playFrom 在 shuffle 下会随机起播、忽视 startIndex,
  //       所以必须用专门的 jump 端点严格跳到这首歌(随机只作用于后续续播)。
  //    后端未升级(无 /queue/jump)时退化为"重建队列=原队列+该曲、从该曲起播",
  //    绝不再用 playQueue([song],0) 清空原队列。
  async _appendAndPlay(song) {
    const pid = this._ui.currentPeerId;
    if (!pid || !song) return;
    const item = childToQueueItem(song);
    try {
      await this._client.enqueue(pid, [item]);
      const q = await this._client.getQueue(pid);
      const items = (q && q.items) || [];
      // 取最后(最新追加)的该曲下标,兼容队列里本就有同曲的情况
      let idx = -1;
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i] && items[i].songId === item.songId) { idx = i; break; }
      }
      if (idx < 0) idx = Math.max(0, items.length - 1);
      // 仅一首(队列原本为空,enqueue 已起播)无需再跳
      if (items.length > 1) {
        try {
          await this._client.jumpToIndex(pid, idx);
        } catch (e2) {
          // 后端未升级(无 /queue/jump):退化成"重建队列=原队列+该曲,并跳到该曲"——保留原队列,绝不清空
          err("jumpToIndex unavailable, fallback preserves queue", e2);
          const q2 = await this._client.getQueue(pid);
          const rebuilt = [...((q2 && q2.items) || []), item];
          await this._client.playQueue(pid, rebuilt, (q2 && q2.items) ? q2.items.length : 0);
        }
      }
    } catch (e) {
      err("appendAndPlay failed", e);
    }
  }

  // 拖拽排序:优先走后端 reorder 端点(不整队列重建);本地缓存先做即时反馈。
  async _qReorder(from, to) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    const meta = this._ui.queue || { total: 0 };
    const total = meta.total || 0;
    if (from < 0 || from >= total || to < 0 || to >= total || from === to) return;
    // 本地先移动缓存中已加载的行,拖拽即时反馈;currentIndex 跟随被移动的曲目。
    const cache = this._ui.qCache || new Map();
    const ordered = [];
    for (let i = 0; i < total; i++) ordered.push(cache.get(i));
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    const newCache = new Map();
    ordered.forEach((it, i) => { if (it) newCache.set(i, it); });
    this._ui.qCache = newCache;
    if (typeof meta.currentIndex === "number") {
      const cur = cache.get(meta.currentIndex);
      if (cur) {
        let ni = -1;
        newCache.forEach((v, i) => { if (v === cur) ni = i; });
        if (ni >= 0) { this._ui.queue = { ...meta, currentIndex: ni }; this._ui.currentIndex = ni; }
      }
    }
    this.requestUpdate();
    try {
      await this._client.reorderQueue(pid, from, to);
    } catch (e) {
      err("reorder failed", e);
      this._qReset(); // 失败回滚:清缓存等下一次 WS/重拉
    }
  }

  // ============ Rendering ============
  // lucide 风格 SVG 图标(stroke=currentColor;filled 时实心,用于播放/暂停/红心)
  _icon(name, size = 20, filled = false) {
    const body = MF_ICONS[name] || "";
    // 关键:必须把完整 <svg> 根字符串一起注入 HTML 元素(span)——HTML 解析器遇到
    // <svg> 会把子节点切到 SVG 命名空间;若只把子节点注入 lit 生成的 <svg>,
    // unsafeHTML 经 <template> 按 HTML 解析,子节点变成 HTMLUnknownElement 不渲染
    // (v1.5.7 图标全消失的根因)。
    const svg = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${filled ? "currentColor" : "none"}" stroke="${filled ? "none" : "currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
    return html`<span class="ic">${unsafeHTML(svg)}</span>`;
  }

  // 媒体库列表封面:标题先出,封面视口懒加载。
  // 直连模式返回可缓存直链;代理模式经 fetchWithAuth 拉 blob(objectURL)。
  // 这里先渲染带 data-cover-id 的占位 <img>,由 IntersectionObserver 进入视口后写 src
  // (代理模式则经 requestCover 拉取),见 _loadCoverInto。
  _coverImgTag(coverArt) {
    if (!coverArt) return html`<span class="bnocover">♪</span>`;
    return html`<img class="bcover-lazy" data-cover-id="${coverArt}" alt="" loading="lazy" />`;
  }

  _loadCoverInto(img) {
    const id = img.getAttribute("data-cover-id");
    if (!id) return;
    // loadedId 守卫:翻页时 Lit 会复用同位置 <img> 节点(仅改 data-cover-id),
    // 若只用"是否加载过"做判据,复用节点的旧 src/dataset 残留会导致新页永远
    // 显示首页封面。改为比对"已为哪个 cover 加载过",不一致就重新加载。
    if (img.dataset.loadedId === id && img.getAttribute("src")) return;
    img.dataset.loadedId = id;
    const client = this._client;
    if (!client) return;
    if (client.mode === "proxy") {
      // 代理模式:经 fetchWithAuth 拉取(带 HA 凭据)转 objectURL,浏览器裸
      // <img src> 不带 HA 鉴权会被 401。直连模式用可缓存直链。
      client.requestCover(id).then((url) => {
        if (url && img.isConnected && img.dataset.loadedId === id) img.src = url;
      }).catch(() => {});
    } else {
      const url = client.coverUrl(id);
      if (url && img.isConnected) img.src = url;
    }
  }

  // 背景融合封面加载完成:采样其亮度,自动决定整卡文字用浅色(暗背景)还是深色(亮背景)。
  // proxy 模式 blob 同源可读;direct 跨域 tainted → catch 降级浅色文字。
  _onBgCoverLoad(e) {
    const img = e.currentTarget;
    if (!img || !img.getAttribute("src")) return;
    this._analyzeBrightness(img);
  }

  _analyzeBrightness(img) {
    try {
      const cv = document.createElement("canvas");
      cv.width = 24; cv.height = 24;
      const ctx = cv.getContext("2d");
      ctx.drawImage(img, 0, 0, 24, 24);
      const d = ctx.getImageData(0, 0, 24, 24).data;
      let sum = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        n++;
      }
      const avg = n ? sum / n : 0;
      // 平均亮度 >165(很亮的封面,如白/浅绿)→ 背景偏亮用深色文字;否则浅色文字。
      const lightText = !(avg > 165);
      if (this._ui.coverLightText !== lightText) {
        this._ui.coverLightText = lightText;
        this.requestUpdate();
      }
    } catch (err2) {
      // tainted canvas(直连跨域无 CORS):无法分析,保持默认浅色文字。
      if (this._ui.coverLightText !== true) { this._ui.coverLightText = true; this.requestUpdate(); }
    }
  }

  _ensureCoverObserver(root) {
    // 媒体库每次重开,滚动容器 .br-list 都是全新节点。若复用上次绑定在旧节点上的
    // observer,新封面 img 不在旧 root 子树内,IntersectionObserver 永不触发
    // isIntersecting → 关闭再打开后封面全空。故 root 变化时重建 observer。
    if (this._coverObserver && this._coverObserverRoot === root) return;
    if (this._coverObserver) this._coverObserver.disconnect();
    this._coverObserverRoot = root;
    this._coverObserver = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          this._loadCoverInto(e.target);
          this._coverObserver.unobserve(e.target);
        }
      }
    }, { root, rootMargin: "250px 0px", threshold: 0.01 });
  }

  // 媒体库打开后,把当前可见(或即将可见)的封面占位登记进观察器。
  _observeBrowserCovers() {
    if (!this._ui.showBrowser || !this._client) return;
    const root = this.shadowRoot?.querySelector(".br-list");
    if (!root) return;
    this._ensureCoverObserver(root);
    root.querySelectorAll("img.bcover-lazy").forEach((img) => {
      const id = img.getAttribute("data-cover-id");
      // 只登记尚未为当前 cover 加载的节点;翻页复用节点(data-cover-id 已变)
      // 会重新登记并加载,避免残留首页封面。
      if (img.dataset.loadedId !== id) {
        img.removeAttribute("src"); // 清掉旧封面,避免显示错误的首页图直到新图加载
        this._coverObserver.observe(img);
      }
    });
  }

  _fmtTime(s) {
    if (!s || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  }

  // 每次渲染后,若媒体库打开,等 DOM 落定再把可见封面登记进懒加载观察器。
  updated() {
    if (this._ui.showBrowser) {
      this.updateComplete.then(() => this._observeBrowserCovers()).catch(() => {});
      // 根层级分类网格:图标尺寸按可用高度自适应(3x2 保证不出现纵向滚动)。
      const bl = this._ui.browserStack[this._ui.browserStack.length - 1];
      if (bl && bl.type === "root") {
        this.updateComplete.then(() => {
          const el = this.shadowRoot?.querySelector(".br-list");
          if (!el) return;
          // 固定开销:每项 gap6+文字12+上下 padding22=40,2行+行距10+grid padding16=106。
          // 上限 42:卡片宽已由容器查询保证 hover 放大不超列宽,图标不再受此约束。
          const size = Math.max(20, Math.min(42, Math.floor((el.clientHeight - 106) / 2)));
          if (size !== this._ui.catIconSize) { this._ui.catIconSize = size; this.requestUpdate(); }
        }).catch(() => {});
      }
    }
    if (this._ui.showQueue) {
      this.updateComplete.then(() => this._qEnsureLoaded()).catch(() => {});
    }
    // 播放器清晰封面 + 背景融合封面都走 mode 感知加载(代理模式裸 <img src> 不带 HA 鉴权会 401)。
    const pc = this.shadowRoot?.querySelector(".nowcover");
    if (pc) this._loadCoverInto(pc);
    const bg = this.shadowRoot?.querySelector(".coverbg-img");
    if (bg && this._ui.song?.coverArt) this._loadCoverInto(bg);
  }

  render() {
    if (this._ui.error) {
      return html`<ha-card><div class="wrap"><div class="err">MusicFlow: ${this._ui.error}</div></div></ha-card>`;
    }
    if (!this._client) {
      return html`<ha-card><div class="wrap"><div class="err">MusicFlow 卡片初始化中…</div></div></ha-card>`;
    }
    const u = this._ui;
    const song = u.song;
    const prog = u.duration > 0 ? (u.currentTime / u.duration) * 100 : 0;

    return html`
      <ha-card class="${u.coverLightText ? "light" : "dark"}">
        ${song?.coverArt ? html`
          <div class="coverbg">
            <img class="coverbg-img" data-cover-id="${song.coverArt}" alt="" @load=${this._onBgCoverLoad} />
            <div class="coverbg-veil"></div>
          </div>` : ""}
        <div class="wrap ${u.connected || u.serverOk ? "" : "off"} ${u.showQueue || u.showBrowser ? "panelmode" : ""}" @click=${this._onWrapClick}>
          ${this._renderOutputs()}

          <div class="now">
            <div class="meta">
              <div class="track">${song ? song.title : "未在播放"}<span class="t-art">${song && song.artist ? " - " + song.artist : ""}</span></div>
              ${this._renderLyricBox()}
            </div>
            <div class="cover" role="button" @click=${(e) => { e.stopPropagation(); this._openBrowser(); }}>${song?.coverArt
              ? html`<img class="nowcover" data-cover-id="${song.coverArt}" alt="" />`
              : html`<div class="nocover">♪</div>`}</div>
          </div>

          <!-- 下半区(控件行 + 进度条)作为音量面板的定位容器。
               volmode 时下面几块用 visibility:hidden 原地隐身(保留占位,卡片高度零跳变)。
               队列/媒体库面板已移出到 .wrap 级(.panelmode 时覆盖整张卡)。 -->
          <div class="lower ${u.showVolume ? "volmode" : ""}">
            <div class="controls">
              <button class="ctl ${u.showQueue ? "active" : ""}" title="队列" @click=${(e) => { e.stopPropagation(); u.showQueue = !u.showQueue; u.showBrowser = false; this.requestUpdate(); }}>${this._icon("queue", 20)}</button>
              <button class="ctl" title="${PLAY_MODE_TIP[u.playMode]}" @click=${this._cyclePlayMode}>${this._icon(PLAY_MODE_ICON[u.playMode], 20)}</button>
              <button class="ctl" title="上一首" @click=${this._prev}>${this._icon("prev", 22)}</button>
              <button class="ctl play" title="播放/暂停" @click=${this._togglePlay}>${this._icon(u.isPlaying ? "pause" : "play", 22, true)}</button>
              <button class="ctl" title="下一首" @click=${this._next}>${this._icon("next", 22)}</button>
              <button class="ctl like ${u.liked ? "on" : ""}" title="喜欢" @click=${this._toggleLike}>${this._icon("heart", 20, u.liked)}</button>
              <button class="ctl vol-open" title="音量" @click=${this._toggleVolumePop}>${this._icon(u.muted || u.volume <= 0 ? "volumeX" : "volume2", 20)}</button>
            </div>

            <div class="progress-row">
              <span class="t">${this._fmtTime(u.currentTime)}</span>
              <input class="seek" type="range" min="0" max="100" step="0.1" value="${prog}"
                style="background: linear-gradient(90deg, #f62c55 ${prog}%, var(--seek-bg) ${prog}%)"
                @input=${this._seek} />
              <span class="t">${this._fmtTime(u.duration)}</span>
            </div>

            ${u.showVolume ? this._renderVolumeOverlay() : ""}
          </div>

          ${u.showQueue ? this._renderQueue() : ""}
          ${u.showBrowser ? this._renderMediaBrowser() : ""}
        </div>
      </ha-card>
    `;
  }

  _renderOutputs() {
    // 兜底过滤:任何路径进来的离线设备都不渲染。
    const peers = (this._ui.peers || []).filter((p) => p.available !== false);
    if (!peers.length) return html`<div class="outputs"><span class="hint">无可用播放器</span></div>`;
    return html`
      <div class="outputs">
        ${peers.map((p) => html`
          <button class="out ${p.peerId === this._ui.currentPeerId ? "active" : ""} ${p.available ? "" : "off"}"
            title="${p.kind || ""}"
            @click=${() => this._selectPeer(p.peerId)}>
            ${p.kind === "group" ? "👥" : p.kind === "dlna" ? "🔊" : "💻"} ${p.name || p.peerId}
          </button>
        `)}
      </div>
    `;
  }

  // 歌词滚动:视口固定 LYRIC_VIEW_LINES 行高,整条歌词轨道按当前行整体上移,
  // 让当前行始终停在第 LYRIC_CUR_SLOT 槽(即第二行),上方 1 行已唱、下方 2 行待唱。
  _renderLyricBox() {
    const lines = this._ui.lyrics || [];
    if (!lines.length) return html`<div class="lyricbox"></div>`;
    const idx = this._ui.lyricIndex;
    // 当前行落到第二槽 => 轨道上移 (idx - LYRIC_CUR_SLOT) 行高;idx 更小时为负,轨道下沉、上方留空行。
    const shift = (idx - LYRIC_CUR_SLOT) * LYRIC_LINE_H;
    return html`
      <div class="lyricbox">
        <div class="lyricbox-track" style="transform: translateY(${-shift}px)">
          ${lines.map((l, i) => html`<div class="lyricbox-line ${i === idx ? "cur" : ""}">${l.text || ""}</div>`)}
        </div>
      </div>`;
  }

  _renderQueue() {
    const q = this._ui.queue || { total: 0, currentIndex: -1 };
    const total = q.total || 0;
    const cur = typeof q.currentIndex === "number" ? q.currentIndex : (this._ui.currentIndex ?? -1);
    // 虚拟滚动窗口:只渲染 [qWinStart, qWinEnd](行高 ROW_STEP 与媒体库一致)。
    const win = [];
    if (total > 0 && (this._ui.qWinStart ?? -1) >= 0) {
      const s = Math.max(0, this._ui.qWinStart);
      const e = Math.min(total - 1, this._ui.qWinEnd ?? s);
      for (let i = s; i <= e; i++) win.push(i);
    }
    return html`
      <div class="panel queue">
        <div class="panel-head">
          <span>队列 (${total})</span>
          <button class="mini" @click=${this._clearQueue}>清空</button>
          <button class="mini close" title="关闭" @click=${(e) => { e.stopPropagation(); this._ui.showQueue = false; this._ui.showBrowser = false; this.requestUpdate(); }}>✕</button>
        </div>
        ${total === 0 ? html`<div class="empty">队列为空</div>` : html`
          <div class="qlist" @scroll=${this._qOnScroll}>
            <div class="vs-spacer" style="height:${total * ROW_STEP}px">
              ${win.map((i) => this._qRow(i, cur))}
            </div>
            ${this._qMoreHint()}
          </div>
        `}
      </div>
    `;
  }

  // 队列虚拟滚动行:缓存未到渲染骨架占位;当前行高亮用绝对下标(WS 直接给,无需等数据)。
  _qRow(i, cur) {
    const it = this._ui.qCache.get(i);
    return html`
      <div class="vs-row" style="top:${i * ROW_STEP}px">
        ${it ? html`
          <div class="qitem ${i === cur ? "cur" : ""}"
            draggable="true"
            @dragstart=${(e) => { e.dataTransfer.setData("text/plain", String(i)); }}
            @dragover=${(e) => e.preventDefault()}
            @drop=${(e) => { e.preventDefault(); const from = Number(e.dataTransfer.getData("text/plain")); this._qReorder(from, i); }}>
            <span class="idx">${i + 1}</span>
            <span class="qt">${it.title}</span>
            <span class="qa">${it.artist || ""}</span>
            <button class="mini" title="跳播" @click=${() => this._jumpTo(i)}>▶</button>
            <button class="mini" title="移除" @click=${() => this._removeFromQueue(i)}>✕</button>
          </div>
        ` : html`<div class="qitem vs-skel"></div>`}
      </div>`;
  }

  // 底部「加载中」提示(队列分块预取在途时显示)。
  _qMoreHint() {
    if (!this._ui.qLoading || this._ui.qLoading.size === 0) return html``;
    return html`<div class="vs-more">加载中…</div>`;
  }

  // ============ 队列虚拟滚动 + 窗口化预取 ============
  // 与媒体库同一套哲学:WS 只提供元数据(total/currentIndex/playMode,大队列摘要化),
  // items 按 CHUNK 从 /v1/peers/:peerId/queue?offset=&size= 分块拉取,只渲染视口窗口。
  _qReset() {
    this._ui.qCache = new Map();
    this._ui.qLoaded = new Set();
    this._ui.qLoading = new Set();
    this._ui.qWinStart = 0;
    this._ui.qWinEnd = -1;
    if (this.shadowRoot) {
      const el = this.shadowRoot.querySelector(".qlist");
      if (el) el.scrollTop = 0;
    }
  }

  _qOnScroll(e) {
    const el = e.currentTarget;
    if (this._vsRaf) cancelAnimationFrame(this._vsRaf);
    this._vsRaf = requestAnimationFrame(() => {
      this._vsRaf = 0;
      this._ui.qWinStart = Math.max(0, Math.floor(el.scrollTop / ROW_STEP) - VS_OVERSCAN);
      this._ui.qWinEnd = Math.floor((el.scrollTop + el.clientHeight) / ROW_STEP) + VS_OVERSCAN;
      this._qEnsureLoaded();
      this.requestUpdate();
    });
  }

  // 首次打开时初始化顶部窗口;之后保证 [窗口±overscan] 覆盖的块已加载。
  _qEnsureLoaded() {
    if (!this._ui.showQueue) return;
    const meta = this._ui.queue || { total: 0 };
    const total = meta.total || 0;
    if (total <= 0) return;
    if (!this._ui.qLoaded) this._qReset();
    if ((this._ui.qWinEnd ?? -1) < 0) {
      const el = this.shadowRoot?.querySelector(".qlist");
      const vh = el ? el.clientHeight : 240;
      this._ui.qWinStart = 0;
      this._ui.qWinEnd = Math.floor(vh / ROW_STEP) + VS_OVERSCAN;
    }
    // currentIndex 所在块优先(当前行高亮不依赖数据,但行内容要尽快可见)
    const ci = typeof meta.currentIndex === "number" && meta.currentIndex >= 0 ? meta.currentIndex : -1;
    const start = Math.max(0, (this._ui.qWinStart || 0) - VS_OVERSCAN);
    const end = Math.max(0, (this._ui.qWinEnd || 0) + VS_OVERSCAN);
    const need = [];
    if (ci >= 0 && ci < total) need.push(ci);
    for (let i = start; i <= end; i++) need.push(i);
    const seen = new Set();
    for (const i of need) {
      const ci2 = Math.floor(i / CHUNK);
      if (seen.has(ci2) || this._ui.qLoaded.has(ci2) || this._ui.qLoading.has(ci2)) continue;
      seen.add(ci2);
      if (this._vsInflight >= VS_CONCURRENCY) continue;
      this._ui.qLoading.add(ci2);
      this._vsInflight++;
      this._qFetchChunk(ci2).finally(() => {
        this._vsInflight--;
        this._ui.qLoaded.add(ci2);
        this._ui.qLoading.delete(ci2);
        this.requestUpdate();
        this._qEnsureLoaded();
      });
    }
  }

  // 拉取一块队列写入稀疏缓存;total 恒以服务端为准(变更防御)。
  async _qFetchChunk(ci) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    const offset = ci * CHUNK;
    try {
      const res = await this._client.getQueue(pid, { offset, size: CHUNK });
      const items = (res && res.items) || [];
      const total = typeof res?.total === "number" ? res.total : undefined;
      if (typeof total === "number" && total >= 0) {
        this._ui.queue = { ...(this._ui.queue || {}), total };
      }
      items.forEach((it, j) => { if (it) this._ui.qCache.set(offset + j, it); });
    } catch (e) {
      err("queue chunk load failed", e);
    }
  }

  // ============ Media library browser ============
  _openBrowser() {
    const u = this._ui;
    // 音量面板打开时,点封面只表示「点外部退出」,不顺带进媒体库(需再点一次)。
    if (u.showVolume) { u.showVolume = false; this.requestUpdate(); return; }
    // 再次点封面 = 收起(与队列按钮一致的可切换行为)。
    if (u.showBrowser) { u.showBrowser = false; this.requestUpdate(); return; }
    u.showBrowser = true;
    u.showQueue = false;
    u.browserStack = [{
      type: "root",
      items: [
        { kind: "cat", cat: "playlists", name: "歌单" },
        { kind: "cat", cat: "albums", name: "专辑" },
        { kind: "cat", cat: "songs", name: "音乐" },
        { kind: "cat", cat: "artists", name: "艺术家" },
        { kind: "cat", cat: "genres", name: "风格" },
        { kind: "cat", cat: "starred", name: "我喜欢的音乐" },
      ],
      query: "", loading: false,
    }];
    this.requestUpdate();
  }

  _crumbName(lv) {
    switch (lv.type) {
      case "root": return "媒体库";
      case "playlists": return "歌单";
      case "playlist": return lv.name || "歌单";
      case "albums": return "专辑";
      case "album": return lv.name || "专辑";
      case "songs": return "音乐";
      case "artists": return "艺术家";
      case "artist": return lv.name || "艺术家";
      case "genres": return "风格";
      case "genre": return lv.name || "风格";
      case "starred": return "我喜欢的音乐";
      default: return "";
    }
  }

  _toSongItem(s) {
    return {
      kind: "song", id: String(s.id), title: s.title || "未知",
      artist: s.artist || "", album: s.album || "",
      coverArt: s.coverArt, duration: s.duration || 0, suffix: s.suffix,
    };
  }

  // ============ 全库统一滚动:虚拟滚动 + 窗口化预取 ============
  // 所有库类型(歌曲/专辑/艺术家/风格/歌单列表/歌单内/专辑内/我喜欢的)共用同一套:
  // 后端按 offset/size 服务端分页(内存恒定 1 块),卡片只渲染视口窗口(约一屏+2*OVERSCAN 行),
  // 滚动到未加载区域时按 CHUNK 预取;total 恒取服务端最新值(扫描变更自动收敛)。
  // level 滚动状态:total / vCache(Map idx→item) / vLoaded、vLoading(Set 块号) / vWinStart、vWinEnd。
  async _browserLoad(level, { reset = true } = {}) {
    if (level.loading) return;
    if (level.type === "root") return;
    if (reset) this._vsReset(level);
    level.loading = true;
    this.requestUpdate();
    // 初始窗口:列表顶部一屏(打开/搜索后滚动位置在顶)。
    const list = this.shadowRoot?.querySelector(".br-list");
    const vh = list ? list.clientHeight : 240;
    level.vWinStart = 0;
    level.vWinEnd = Math.floor(vh / ROW_STEP) + VS_OVERSCAN;
    await this._vsFetchChunk(level, 0).catch((e) => err("browser load failed", e));
    level.loading = false;
    this.requestUpdate();
    this._vsEnsureLoaded(level);
  }

  _vsReset(level) {
    level.vCache = new Map();
    level.vLoaded = new Set();
    level.vLoading = new Set();
    level.total = 0;
    level.vWinStart = 0;
    level.vWinEnd = -1;
    level.vSeq = (level.vSeq || 0) + 1; // 防乱序令牌:在途的旧分块响应将被丢弃
    if (this.shadowRoot) {
      const el = this.shadowRoot.querySelector(".br-list");
      if (el) el.scrollTop = 0;
    }
  }

  // 滚动(rAF 节流):更新渲染窗口并补齐覆盖到的块。
  _onBrScroll(e) {
    const el = e.currentTarget;
    const level = this._ui.browserStack[this._ui.browserStack.length - 1];
    if (!level || level.type === "root") return;
    if (this._vsRaf) cancelAnimationFrame(this._vsRaf);
    this._vsRaf = requestAnimationFrame(() => {
      this._vsRaf = 0;
      level.vWinStart = Math.max(0, Math.floor(el.scrollTop / ROW_STEP) - VS_OVERSCAN);
      level.vWinEnd = Math.floor((el.scrollTop + el.clientHeight) / ROW_STEP) + VS_OVERSCAN;
      this._vsEnsureLoaded(level);
      this.requestUpdate();
    });
  }

  // 保证 [窗口±overscan] 覆盖的块都已加载(在途并发 ≤ VS_CONCURRENCY,块到达后继续)。
  _vsEnsureLoaded(level) {
    if (!level || level.type === "root" || !level.vLoaded) return;
    const start = Math.max(0, (level.vWinStart || 0) - VS_OVERSCAN);
    const end = Math.max(0, (level.vWinEnd || 0) + VS_OVERSCAN);
    const firstChunk = Math.floor(start / CHUNK);
    const lastChunk = Math.floor(end / CHUNK);
    for (let ci = firstChunk; ci <= lastChunk; ci++) {
      if (level.vLoaded.has(ci) || level.vLoading.has(ci)) continue;
      if (this._vsInflight >= VS_CONCURRENCY) return;
      level.vLoading.add(ci);
      this._vsInflight++;
      this._vsFetchChunk(level, ci).finally(() => {
        this._vsInflight--;
        level.vLoading.delete(ci);
        this.requestUpdate();
        this._vsEnsureLoaded(level);
      });
    }
  }

  // 拉取一块(offset=ci*CHUNK,size=CHUNK)写入稀疏缓存;total 恒以服务端为准(变更防御)。
  // vSeq 令牌:实时搜索快速输入时旧请求晚返回,seq 不匹配即丢弃(不写缓存/不改 total/不标 loaded)。
  async _vsFetchChunk(level, ci) {
    const seq = level.vSeq || 0;
    const offset = ci * CHUNK;
    try {
      const { items, total } = await this._fetchBrowseRange(level, offset, CHUNK);
      if (seq !== (level.vSeq || 0)) return; // 已发起新查询,丢弃过期响应
      if (typeof total === "number" && total >= 0) level.total = total;
      items.forEach((it, j) => { if (it) level.vCache.set(offset + j, it); });
      level.vLoaded.add(ci);
    } catch (e) {
      err("browser chunk load failed", e);
    }
  }

  // 统一取数:按类型走 V2 或 Subsonic 端点(全部服务端分页,返回 {items,total})。
  async _fetchBrowseRange(level, offset, size) {
    const q = (level.query || "").trim();
    const page = Math.floor(offset / size) + 1; // V2 端点 1-based page
    switch (level.type) {
      case "songs": {
        const res = await this._client.getSongsV2({ page, pageSize: size, query: q });
        return { items: this._mapBrowseItems("songs", res?.items), total: res?.total };
      }
      case "albums": {
        const res = await this._client.getAlbumsV2({ page, pageSize: size, query: q });
        return { items: this._mapBrowseItems("albums", res?.items), total: res?.total };
      }
      case "artists": {
        const res = await this._client.getArtistsV2({ page, pageSize: size, query: q });
        return { items: this._mapBrowseItems("artists", res?.items), total: res?.total };
      }
      case "genres": {
        const res = await this._client.getGenresV2({ page, pageSize: size, query: q });
        return { items: this._mapBrowseItems("genres", res?.items), total: res?.total };
      }
      case "genre": { // 风格内 = 该风格全部歌曲(V2 支持 genre 过滤)
        const res = await this._client.getSongsV2({ page, pageSize: size, genre: level.name || "" });
        return { items: this._mapBrowseItems("songs", res?.items), total: res?.total };
      }
      case "starred": {
        const res = await this._client.getStarred({ offset, size, query: q });
        return { items: (res?.starred2?.song || []).map((s) => this._toSongItem(s)), total: res?.starred2?.songTotal };
      }
      case "album": {
        const res = await this._client.getAlbum(level.id, { offset, size });
        return { items: (res?.album?.song || []).map((s) => this._toSongItem(s)), total: res?.album?.songTotal };
      }
      case "playlist": {
        const res = await this._client.getPlaylistSongs(level.id, { offset, size });
        return { items: (res?.playlist?.entry || []).map((s) => this._toSongItem(s)), total: res?.playlist?.songTotal };
      }
      case "playlists": {
        const res = await this._client.getPlaylists({ offset, size, query: q });
        const arr = res?.playlists?.playlist || res?.playlists || [];
        return {
          items: arr.map((p) => ({ kind: "playlist", id: String(p.id), name: p.name || "未命名歌单", coverArt: p.coverArt, songCount: p.songCount })),
          total: res?.playlists?.total ?? arr.length,
        };
      }
      case "artist": { // 艺术家内 = 其全部专辑(单艺术家专辑数有限,一次取回后内存切片)
        const res = await this._client.getArtist(level.id);
        const albums = res?.artist?.album || [];
        const slice = albums.slice(offset, offset + size).map((a) => ({
          kind: "album", id: String(a.id), name: a.name || "未知专辑", artist: a.artist || "", coverArt: a.coverArt,
        }));
        return { items: slice, total: albums.length };
      }
      default:
        return { items: [], total: 0 };
    }
  }

  // 服务端分页类型把后端 items 映射成本地浏览项
  _mapBrowseItems(type, items) {
    if (type === "songs") return (items || []).map((s) => this._toSongItem(s));
    if (type === "albums") return (items || []).map((a) => ({
      kind: "album", id: String(a.id), name: a.name || "未知专辑",
      artist: a.artist || "", coverArt: a.coverArt, songCount: a.songCount,
    }));
    if (type === "artists") return (items || []).map((a) => ({
      kind: "artist", id: String(a.id), name: a.name || "未知艺术家", coverArt: a.coverArt,
    }));
    if (type === "genres") return (items || []).map((g) => ({
      kind: "genre", id: g.id, name: g.name, songCount: g.songCount, albumCount: g.albumCount,
    }));
    return items || [];
  }

  _browserPush(level) {
    this._ui.browserStack.push(level);
    this._browserLoad(level);
  }

  _browserPopTo(index) {
    while (this._ui.browserStack.length > index + 1) this._ui.browserStack.pop();
    this.requestUpdate();
  }

  // 实时搜索:输入停顿 300ms 自动触发(防抖,避免每键一次请求)。
  // 中文输入法组字期间(compositionstart..end)暂停,只有选字上屏后才搜,避免搜到拼音。
  // 清空输入框立即回全库(不等待防抖)。防乱序由 _vsReset 的 vSeq 令牌保证。
  _browserSearchInput() {
    clearTimeout(this._searchTimer);
    if (this._searchComposing) return;
    const level = this._ui.browserStack[this._ui.browserStack.length - 1];
    if (!level || level.type === "root") return;
    const q = (level.query || "").trim();
    this._searchTimer = setTimeout(() => this._browserSearch(), q ? 300 : 0);
  }

  _browserSearch() {
    const level = this._ui.browserStack[this._ui.browserStack.length - 1];
    if (!level || level.type === "root") return;
    // 服务端搜索(query 随 _fetchBrowseRange 下发)+ 重置到顶部重新分块,不一次性拉全库。
    this._vsReset(level);
    this._browserLoad(level, { reset: false });
  }

  _browserItemClick(item) {
    if (!item) return;
    if (item.kind === "cat") {
      const map = { playlists: "playlists", albums: "albums", songs: "songs", artists: "artists", genres: "genres", starred: "starred" };
      this._browserPush({ type: map[item.cat], items: [], query: "", loading: false });
    } else if (item.kind === "playlist") {
      this._browserPush({ type: "playlist", id: item.id, name: item.name, items: [], query: "", loading: false });
    } else if (item.kind === "album") {
      this._browserPush({ type: "album", id: item.id, name: item.name, items: [], query: "", loading: false });
    } else if (item.kind === "artist") {
      this._browserPush({ type: "artist", id: item.id, name: item.name, items: [], query: "", loading: false });
    } else if (item.kind === "genre") {
      this._browserPush({ type: "genre", id: item.id, name: item.name, items: [], query: "", loading: false });
    } else if (item.kind === "song") {
      this._appendAndPlay(item);
    }
  }

  _browserPlaySong(song) { this._appendAndPlay(song); }

  _collLabel(it) {
    switch (it.kind) {
      case "playlist": return "歌单";
      case "album": return "专辑";
      case "artist": return "艺人";
      case "genre": return "风格";
      default: return "列表";
    }
  }

  // 点击封面:直接播放整个集合(歌单/专辑/艺人/风格)的全部歌曲,
  // 用集合歌曲替换当前队列并从第 1 首开始播放。
  async _browserPlayCollection(item) {
    const pid = this._ui.currentPeerId;
    if (!pid || !item) return;
    let songs = [];
    try {
      if (item.kind === "playlist") {
        const res = await this._client.getPlaylistSongs(item.id);
        songs = (res?.playlist?.entry || []).map((s) => this._toSongItem(s));
      } else if (item.kind === "album") {
        const res = await this._client.getAlbum(item.id);
        songs = (res?.album?.song || []).map((s) => this._toSongItem(s));
      } else if (item.kind === "artist") {
        const res = await this._client.getArtist(item.id);
        const albums = res?.artist?.album || [];
        for (const a of albums) {
          const ar = await this._client.getAlbum(String(a.id));
          songs.push(...(ar?.album?.song || []).map((s) => this._toSongItem(s)));
        }
      } else if (item.kind === "genre") {
        const res = await this._client.getAlbumList2({ type: "byGenre", genre: item.id, size: 500 });
        const albums = res?.albumList2?.album || [];
        for (const a of albums) {
          const ar = await this._client.getAlbum(String(a.id));
          songs.push(...(ar?.album?.song || []).map((s) => this._toSongItem(s)));
        }
      }
    } catch (e) {
      err("browser play collection failed", e);
      return;
    }
    if (!songs.length) { log("collection empty"); return; }
    const items = songs.map((s) => childToQueueItem(s));
    this._client.playQueue(pid, items, 0)
      .then(() => log("playing", this._collLabel(item), item.name, songs.length, "songs"))
      .catch((e) => err("playCollection failed", e));
  }

  _renderBrowserItem(it) {
    if (it.kind === "song") {
      return html`
        <div class="bitem">
          <div class="bthumb" style="cursor:pointer" title="播放这首歌" @click=${() => this._browserPlaySong(it)}>
            ${this._coverImgTag(it.coverArt)}
          </div>
          <div class="bmeta" style="cursor:pointer;flex:1;min-width:0" @click=${() => this._browserItemClick(it)}>
            <div class="bt">${it.title}</div>
            <div class="ba">${it.artist || ""}</div>
          </div>
          <button class="mini" title="播放这首歌" @click=${() => this._browserPlaySong(it)}>▶</button>
        </div>`;
    }
    const sub = it.kind === "album" ? (it.artist || "")
      : it.kind === "genre" ? `${it.songCount || 0} 首`
      : it.kind === "playlist" ? `${it.songCount || 0} 首`
      : "";
    return html`
      <div class="bitem">
        <div class="bthumb" style="cursor:pointer" title="播放整个${this._collLabel(it)}" @click=${() => this._browserPlayCollection(it)}>
          ${this._coverImgTag(it.coverArt)}
        </div>
        <div class="bmeta" style="cursor:pointer;flex:1;min-width:0" title="进入查看" @click=${() => this._browserItemClick(it)}>
          <div class="bt">${it.name}</div>
          <div class="ba">${sub}</div>
        </div>
        <button class="mini" title="播放整个${this._collLabel(it)}" @click=${(e) => { e.stopPropagation(); this._browserPlayCollection(it); }}>▶</button>
      </div>`;
  }

  _renderMediaBrowser() {
    const stack = this._ui.browserStack;
    const level = stack[stack.length - 1];
    if (!level) return html``;
    const isRoot = level.type === "root";
    // 搜索框:与虚拟滚动共用同一取数路径(服务端 query 过滤),显示给可搜索的库类型。
    const showSearch = ["playlists", "albums", "artists", "genres", "starred", "songs"].includes(level.type);
    // 虚拟滚动窗口:只在 [vWinStart, vWinEnd] 渲染(行数恒 ≈ 一屏 + 2*OVERSCAN)。
    const win = [];
    if (!isRoot && level.total > 0 && (level.vWinStart ?? -1) >= 0) {
      const s = Math.max(0, level.vWinStart);
      const e = Math.min(level.total - 1, level.vWinEnd ?? s);
      for (let i = s; i <= e; i++) win.push(i);
    }
    return html`
      <div class="panel browser">
        <button class="mini close" title="关闭" @click=${(e) => { e.stopPropagation(); this._ui.showBrowser = false; this._ui.showQueue = false; this.requestUpdate(); }}>✕</button>
        <div class="br-crumbs">
          ${stack.map((lv, i) => html`
            <span class="crumb ${i === stack.length - 1 ? "cur" : ""}" @click=${() => this._browserPopTo(i)}>${this._crumbName(lv)}</span>
            ${i < stack.length - 1 ? html`<span class="crumb-sep">›</span>` : ""}
          `)}
        </div>
        ${showSearch ? html`
          <div class="br-search">
            <input class="search-input" placeholder="搜索…" .value=${level.query}
              @input=${(e) => { level.query = e.target.value; this._browserSearchInput(); }}
              @compositionstart=${(e) => { this._searchComposing = true; }}
              @compositionend=${(e) => { this._searchComposing = false; this._browserSearchInput(); }}
              @keydown=${(e) => { if (e.key === "Enter") this._browserSearch(); }} />
          </div>
        ` : ""}
        <div class="br-list ${isRoot ? "root-grid" : ""}" @scroll=${this._onBrScroll}>
          ${isRoot ? html`
            <div class="cat-grid">
              ${(level.items || []).map((c) => html`
                <button class="cat" @click=${() => this._browserItemClick(c)}>
                  <span class="cat-ic ${CAT_HEART.has(c.cat) ? "heart" : ""}">${this._icon(CAT_ICONS[c.cat] || "list", this._ui.catIconSize || 42, CAT_HEART.has(c.cat))}</span>
                  <span class="cat-name">${c.name}</span>
                </button>
              `)}
            </div>
          ` : (level.loading && !level.total ? html`<div class="empty">加载中…</div>` : html`
            ${!level.total && !level.loading ? html`<div class="empty">无内容</div>` : ""}
            <div class="vs-spacer" style="height:${(level.total || 0) * ROW_STEP}px">
              ${win.map((i) => this._vsRow(level, i))}
            </div>
            ${this._vsMoreHint(level)}
          `)}
        </div>
      </div>
    `;
  }

  // 虚拟滚动行:缓存未到的位置渲染骨架占位行(不白屏闪烁)。
  _vsRow(level, i) {
    const it = level.vCache.get(i);
    return html`
      <div class="vs-row" style="top:${i * ROW_STEP}px">
        ${it ? this._renderBrowserItem(it) : html`<div class="bitem vs-skel"></div>`}
      </div>`;
  }

  // 底部「加载中」轻量指示(预取在途时显示,用户感知仍在加载)。
  _vsMoreHint(level) {
    if (!level.vLoading || level.vLoading.size === 0) return html``;
    return html`<div class="vs-more">加载中…</div>`;
  }

  static get styles() {
    return css`
      :host { display: block; }
      ha-card {
        /* 颜色变量:默认浅色文字(暗背景);.dark 时整体切深色文字(亮背景封面) */
        --fg: #ffffff;
        --fg-invert: #1b1b1f; /* 实底高亮(如设备按钮激活态)上的反色文字:深封面=白底黑字 */
        --fg-dim: rgba(255, 255, 255, 0.6);
        --fg-faint: rgba(255, 255, 255, 0.5);
        --ctl: rgba(255, 255, 255, 0.85);
        --ctl-hover: rgba(255, 255, 255, 0.10);
        --seek-bg: rgba(255, 255, 255, 0.18);
        --panel-bg: rgba(255, 255, 255, 0.04);
        --line: rgba(255, 255, 255, 0.12);
        --line-soft: rgba(255, 255, 255, 0.08);
        /* MusicFlow FnOS 暗色玻璃拟态:深紫灰渐变底(无封面时回退显示) */
        background: linear-gradient(180deg, #2d293a 0%, #1a1728 52%, #15121f 100%);
        color: var(--fg);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        overflow: hidden;
        position: relative;
        font-family: 'Montserrat', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Segoe UI', Arial, sans-serif;
      }
      ha-card.dark {
        --fg: #1b1b1f;
        --fg-invert: #ffffff; /* 浅封面=黑底白字 */
        --fg-dim: rgba(0, 0, 0, 0.6);
        --fg-faint: rgba(0, 0, 0, 0.5);
        --ctl: rgba(0, 0, 0, 0.78);
        --ctl-hover: rgba(0, 0, 0, 0.08);
        --seek-bg: rgba(0, 0, 0, 0.18);
        --panel-bg: rgba(0, 0, 0, 0.06);
        --line: rgba(0, 0, 0, 0.16);
        --line-soft: rgba(0, 0, 0, 0.10);
      }
      .wrap { position: relative; z-index: 1; padding: 14px; display: flex; flex-direction: column; gap: 12px;
        transition: opacity 0.3s ease, filter 0.3s ease; }
      /* 封面融合背景层:当前封面放大+模糊+拉伸铺满整卡;veil 统一压暗保证文字可读 */
      .coverbg { position: absolute; inset: 0; z-index: 0; overflow: hidden; }
      .coverbg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
        transform: scale(1.45); filter: blur(42px) saturate(1.35); }
      .coverbg-veil { position: absolute; inset: 0;
        background: linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.40) 55%, rgba(0,0,0,0.50) 100%); }
      /* 未连接:整卡调暗降饱和做区分(不再显示"已连接/未连接"文字) */
      .wrap.off { opacity: 0.45; filter: saturate(0.5) brightness(0.75); }
      .ic { display: inline-flex; align-items: center; justify-content: center; line-height: 0; }
      .ic svg { display: block; }
      .err { color: #f05672; padding: 12px; }
      .outputs { display: flex; flex-wrap: wrap; gap: 6px; }
      .out { border: 1px solid var(--line); background: var(--panel-bg); color: var(--ctl);
        border-radius: 14px; padding: 4px 12px; font-size: 12px; cursor: pointer;
        transition: border-color 0.2s, box-shadow 0.18s ease, transform 0.18s ease, color 0.2s; }
      /* 悬停反馈与封面/播放控件统一:仅放大上浮 + 中性阴影 */
      .out:hover { transform: scale(1.06); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35); }
      .out:active { transform: scale(0.96); }
      /* 激活态与播放控件同语言:半透明一体感 + 周边亮框(无实底色块),颜色随封面底色。
         默认态:半透明底 + 细框;激活态:亮框(var(--fg)) + 亮文字加粗。 */
      .out.active { background: var(--panel-bg); border-color: var(--fg); color: var(--fg); font-weight: 600;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18); }
      .out.off { opacity: 0.45; }
      .hint { color: var(--fg-faint); font-size: 12px; }
      .now { display: flex; gap: 12px; align-items: flex-start; justify-content: space-between; }
      .cover { width: 92px; height: 92px; border-radius: 12px; overflow: hidden; flex: 0 0 auto;
        background: rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35); }
      .cover { cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease; position: relative; }
      .cover:hover { transform: scale(1.06); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45); z-index: 2; }
      .cover img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.18s ease; }
      .cover:hover img { transform: scale(1.04); }
      .nocover { font-size: 30px; color: rgba(255, 255, 255, 0.3); }
      .meta { flex: 1; min-width: 0; }
      .track { font-weight: 600; font-size: 16px; color: var(--fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      /* 歌词滚动:视口固定 4 行(4 x 20px = 80px),当前行恒在第二行;上下边缘渐隐做出滚动纵深。
         .lyricbox-line 的 height/line-height 必须与 JS 常量 LYRIC_LINE_H 一致,
         .lyricbox 的 height 必须等于 LYRIC_VIEW_LINES x LYRIC_LINE_H。 */
      .lyricbox { height: 80px; overflow: hidden; margin-top: 2px; position: relative;
        -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 20%, #000 74%, transparent 100%);
        mask-image: linear-gradient(180deg, transparent 0%, #000 20%, #000 74%, transparent 100%); }
      .lyricbox-track { transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1); will-change: transform; }
      .lyricbox-line { height: 20px; line-height: 20px; font-size: 13px; color: var(--fg-dim); opacity: 0.55;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        transition: color 0.3s ease, opacity 0.3s ease; }
      .lyricbox-line.cur { color: #ffd400; opacity: 1; }
      /* 浅色封面(整卡切深色文字)时金色对比不足,换成深琥珀 */
      ha-card.dark .lyricbox-line.cur { color: #a3690a; }
      .t-art { font-size: 13px; font-weight: 400; color: var(--fg-dim); }
      .progress-row { display: flex; align-items: center; gap: 8px; }
      .progress-row .t { font-size: 11px; color: var(--fg-faint); width: 34px; text-align: center; font-variant-numeric: tabular-nums; }
      .seek { flex: 1; height: 6px; border-radius: 3px; }
      .seek { -webkit-appearance: none; appearance: none; outline: none; cursor: pointer; background: var(--seek-bg); }
      .seek::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
        width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 2px solid #f62c55;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4); cursor: pointer; transition: transform 0.15s ease; }
      .seek:hover::-webkit-slider-thumb { transform: scale(1.2); }
      .seek::-moz-range-track { height: 6px; border-radius: 3px; background: var(--seek-bg); }
      .seek::-moz-range-progress { height: 6px; border-radius: 3px; background: #f62c55; }
      .seek::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%;
        background: #fff; border: 2px solid #f62c55; }
      .controls { display: flex; justify-content: center; align-items: center; gap: 23px; position: relative; }
      .ctl { border: none; background: transparent; color: var(--ctl); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        width: 42px; height: 42px; padding: 0; border-radius: 50%;
        transition: box-shadow 0.18s ease, transform 0.18s ease, color 0.2s; }
      .ctl svg { display: block; }
      /* 悬停反馈与封面统一:仅放大上浮 + 中性阴影,不加红圈、不改底色 */
      .ctl:hover { transform: scale(1.10); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35); }
      .ctl:active { transform: scale(0.92); }
      .ctl.play { width: 42px; height: 42px; background: transparent; color: var(--ctl); }
      .ctl.play:hover { transform: scale(1.10); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35); }
      .ctl.play:active { transform: scale(0.92); }
      .ctl.like.on { color: #f62c55; }
      /* 展开态只用图标变色标识,不再加红圈描边 */
      .ctl.active { color: #f62c55; }
      .ctl.vol-open { background: transparent; color: var(--ctl); }
      /* 下半区容器:音量遮罩以它为定位参照,盖住控件行 + 进度条 + 队列面板 */
      .lower { position: relative; display: flex; flex-direction: column; gap: 12px; }
      /* 音量态「无感」隐身:不盖蒙层,而是把下半区各块设为 visibility:hidden。
         用 visibility 而非 display:none —— 元素仍占原高度,卡片高度全程零跳变,
         露出的就是卡片自身那层模糊封面背景,与上半部分同源,不可能有色差/边界。
         队列展开时那块列表会留一片空白(刻意为之:保高度不抖)。 */
      .lower.volmode > .controls,
      .lower.volmode > .progress-row { visibility: hidden; }
      /* 音量面板层本身完全透明,只负责承载音量行 + 接管「点外部关闭」。
         inset:0 与 .lower 严格对齐,不再需要负 inset/padding 那套魔数补偿,
         音量条左右端与下方 seek 天然重合。 */
      .vol-overlay { position: absolute; inset: 0; z-index: 6;
        display: flex; align-items: flex-start; }
      /* 静音键占最左 42px(顶替进度条左侧时间标签的位置),右侧留 42px 空位,
         使音量条与下方 seek 严格等长、左右端上下重合。gap 必须为 0。 */
      .vol-row { display: flex; align-items: center; gap: 0; width: 100%; height: 42px; }
      .vol-gap { width: 42px; flex: 0 0 auto; }
      .vol-slider { position: relative; flex: 1; height: 30px; cursor: pointer; touch-action: none; display: flex; align-items: center; }
      .vol-track { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); height: 6px; border-radius: 3px; background: var(--seek-bg); }
      .vol-fill { position: absolute; left: 0; top: 50%; transform: translateY(-50%); height: 6px; border-radius: 3px; background: #f62c55; }
      .vol-knob { position: absolute; top: 50%; width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 2px solid #f62c55; transform: translate(-50%, -50%); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4); }
      .vol-slider:active .vol-knob { transform: translate(-50%, -50%) scale(1.15); }
      /* 实时数值气泡:默认隐藏,拖动/悬停时显示;位置跟随滑块把手(translateX 居中)。 */
      .vol-value { position: absolute; bottom: calc(100% + 2px); transform: translateX(-50%);
        font-size: 12px; font-weight: 600; color: #fff; background: rgba(20, 20, 24, 0.92);
        border: 1px solid rgba(246, 44, 85, 0.55); border-radius: 8px; padding: 1px 7px;
        pointer-events: none; opacity: 0; transition: opacity 0.12s ease;
        font-variant-numeric: tabular-nums; white-space: nowrap; z-index: 5; }
      .vol-slider.dragging .vol-value, .vol-slider:hover .vol-value { opacity: 1; }
      /* 歌词/队列/媒体库已移入控件行(.ctl),不再需要 .actions/.act */
      /* 面板无感全屏覆盖:打开队列/媒体库时,主视图(.outputs/.now/.lower)原地隐身(保留占位→卡高恒定),
         面板透明铺满整张卡(inset:0),露出卡片自身模糊封面背景,与卡片同源、无边框。 */
      .wrap.panelmode > .outputs { visibility: hidden; }
      .wrap.panelmode > .now { visibility: hidden; }
      .wrap.panelmode > .lower > .controls,
      .wrap.panelmode > .lower > .progress-row { visibility: hidden; }
      .panel { position: absolute; inset: 0; z-index: 5; background: transparent; border: none; border-radius: 0;
        padding: 14px; width: 100%; height: 100%; display: flex; flex-direction: column; box-sizing: border-box; }
      .panel-head { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
      .panel-head .close { margin-left: auto; }
      .empty { color: var(--fg-faint); font-size: 13px; padding: 10px 0; text-align: center; }
      /* 歌词展开面板已移除,当前行常驻显示在 .artist(this._ui.currentLyric) */
      .qlist, .slist { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; scrollbar-width: thin; }
      .qlist::-webkit-scrollbar, .slist::-webkit-scrollbar,
      .br-list::-webkit-scrollbar { width: 4px; }
      .qlist::-webkit-scrollbar-thumb, .slist::-webkit-scrollbar-thumb,
      .br-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 2px; }
      .qlist::-webkit-scrollbar-thumb:hover, .slist::-webkit-scrollbar-thumb:hover,
      .br-list::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.28); }
      .qitem, .sitem { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 8px; transition: background 0.15s; }
      /* 队列虚拟滚动:行高固定 50px(与媒体库 ROW_STEP 一致,绝对定位按它铺排) */
      .qlist .qitem { height: 50px; box-sizing: border-box; }
      .qitem.vs-skel { background: var(--panel-bg); }
      .qitem:hover, .sitem:hover { background: rgba(255, 255, 255, 0.06); }
      .qitem.cur { background: rgba(246, 44, 85, 0.16); }
      .qitem .idx { width: 18px; color: rgba(255, 255, 255, 0.4); font-size: 12px; }
      .qitem .qt, .sitem .st { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; color: var(--fg); }
      .qitem .qa, .sitem .sa { width: 90px; color: var(--fg-faint); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mini { border: 1px solid var(--line); background: var(--panel-bg); color: var(--ctl);
        border-radius: 8px; padding: 3px 8px; font-size: 12px; cursor: pointer;
        transition: box-shadow 0.18s ease, transform 0.18s ease, color 0.2s; }
      .mini:hover { transform: scale(1.06); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35); }
      .mini:active { transform: scale(0.94); }
      .search-input { flex: 1; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px;
        padding: 7px 10px; background: rgba(0, 0, 0, 0.3); color: #fff; outline: none;
        transition: border-color 0.2s, box-shadow 0.2s; }
      .search-input::placeholder { color: rgba(255, 255, 255, 0.35); }
      .search-input:focus { border-color: #f62c55; box-shadow: 0 0 0 1px #f62c55; }
      .browser { width: 100%; height: 100%; display: flex; flex-direction: column; }
      .browser .close { position: absolute; top: 8px; right: 8px; z-index: 7; }
      .br-crumbs { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; font-size: 15px; font-weight: 600;
        color: rgba(255, 255, 255, 0.5); margin-bottom: 8px; padding-right: 30px; }
      .crumb { cursor: pointer; transition: color 0.15s; }
      .crumb:hover { color: rgba(255, 255, 255, 0.85); }
      /* 当前目录:金黄(与歌词当前行同色系),.dark 浅色封面下换琥珀保证对比 */
      .crumb.cur { color: #ffd400; font-weight: 600; }
      ha-card.dark .crumb.cur { color: #a3690a; }
      .crumb-sep { color: rgba(255, 255, 255, 0.3); }
      .br-search { display: flex; gap: 6px; margin-bottom: 8px; }
      .br-list { overflow-y: auto; flex: 1; min-height: 0; min-width: 0; max-width: 100%;
        display: flex; flex-direction: column; scrollbar-width: thin; }
      /* 虚拟滚动:总高占位(level.total x ROW_STEP)+ 绝对定位窗口行;骨架行避免空白闪烁 */
      .vs-spacer { position: relative; width: 100%; }
      .vs-row { position: absolute; left: 0; right: 0; height: 48px; }
      .bitem.vs-skel { background: var(--panel-bg); border-radius: 8px; height: 38px; }
      .vs-more { position: sticky; bottom: 0; text-align: center; font-size: 12px; color: var(--fg-faint);
        padding: 5px; background: var(--panel-bg); border-radius: 8px; margin-top: 2px; }
      /* 媒体库根层级分类:图标在上、文字在下(类似 Windows 文件夹中等图标视图)。
         固定 3 列(6 分类 = 3x2),图标尺寸按可用高度 JS 自适应(见 _catIconSize),
         网格区域禁止滚动(overflow hidden),任何情况不出现上下/左右滚动条。
         卡片宽度用容器查询(cqi)自动算 = 列宽/1.06 − 10,保证 hover scale(1.06) 放大后
         不超列宽(余量 ~5px);justify-items:center 使卡片居中,不 stretch 占满列宽。 */
      .cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 8px 0;
        justify-items: center; container-type: inline-size; }
      .br-list.root-grid { overflow: hidden; }
      .cat { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 4px 10px;
        border: 1px solid var(--line); background: var(--panel-bg); color: var(--fg); border-radius: 12px;
        cursor: pointer; min-width: 0;
        /* 卡片宽 = 列宽/1.06 − 10(列宽=(100cqi−20)/3):hover 放大后不超列宽,且卡片饱满不缩成竖条 */
        width: calc((100cqi - 20px) / 3.18 - 10px); max-width: 100%; box-sizing: border-box;
        transition: background 0.2s, box-shadow 0.18s ease, transform 0.18s ease; }
      .cat .cat-ic { display: flex; align-items: center; justify-content: center; color: var(--ctl); }
      .cat .cat-ic.heart { color: #f62c55; }
      .cat .cat-name { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
      .cat:hover { background: var(--ctl-hover); transform: scale(1.06); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35); }
      .cat:active { transform: scale(0.97); }
      .bitem { display: flex; align-items: center; gap: 8px; padding: 5px 6px; border-radius: 8px; transition: background 0.15s; }
      .bitem:hover { background: var(--ctl-hover); }
      .bthumb { width: 38px; height: 38px; border-radius: 8px; overflow: hidden; flex: 0 0 auto;
        background: var(--panel-bg); display: flex; align-items: center; justify-content: center;
        transition: box-shadow 0.2s, transform 0.12s; }
      .bthumb:hover { box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); transform: scale(1.05); }
      .bthumb img { width: 100%; height: 100%; object-fit: cover; }
      .bcover-lazy:not([src]) { visibility: hidden; }
      .bnocover { font-size: 18px; color: var(--fg-faint); }
      .bmeta { min-width: 0; }
      .bt { font-size: 13px; color: var(--fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ba { font-size: 11px; color: var(--fg-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    `;
  }
}

customElements.define("hass-musicflow-card", MusicFlowRemoteCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "hass-musicflow-card",
  name: "MusicFlow Remote Card",
  description: "MusicFlow 服务器的外部控制器:实时同步播放/队列/歌词/歌单/喜欢。",
});
