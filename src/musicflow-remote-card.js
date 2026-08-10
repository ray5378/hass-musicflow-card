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
// 媒体库浏览器每页/每批渲染条数(懒加载步长)
// 媒体库每页行数(需求:每页 8 行)。服务端分页类型走后端 /api/v1/* 真分页只拉当前页;
// 其余类型一次取回后本地切片。分页控件参考主项目 PagePagination(el-pagination)。
const PAGE_SIZE = 8;
const SERVER_PAGED = new Set(["songs", "albums", "artists", "genres"]);
// 我喜欢的 / 专辑内歌曲 / 歌单内歌曲:走 Subsonic 端点 offset/size 真分页(几千首也只拉当前页)
const PAGED_SUBSONIC = new Set(["starred", "album", "playlist"]);

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
};

function log(...args) { console.log("[MF card]", ...args); }
function err(...args) { console.error("[MF card]", ...args); }

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
      queue: [],
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
      liked: false,
      showQueue: false,
      showBrowser: false,
      browserStack: [],
      showVolume: false,
      volAnchor: null,
    };
    this._tickTimer = null;
    this._pollTimer = null;
    this._heartbeatTimer = null;
    this._volumeDebounce = null;
    this._coverObserver = null; // 视口懒加载封面的 IntersectionObserver
    this._coverObserverRoot = null; // 该 observer 绑定的滚动容器(媒体库每次重开是新节点)
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
    const list = this._filterDlna(peers);
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
    if (Array.isArray(queue.items)) {
      this._ui.queue = queue.items.map((it) => ({
        songId: it.songId,
        title: it.title || "未知",
        artist: it.artist || "",
        album: it.album || "",
        coverArt: it.coverArt,
        duration: it.duration || 0,
      }));
    }
    if (typeof queue.currentIndex === "number") this._ui.currentIndex = queue.currentIndex;
    if (typeof queue.playMode === "string") this._ui.playMode = queue.playMode;
    this._syncCurrentSong();
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
      this._client.scrobble?.(song.songId).catch((e) => err("scrobble failed", e));
      this._loadLyrics(song.songId);
      this._loadLiked(song.songId);
    }
    this.requestUpdate();
  }

  _syncCurrentSong() {
    const idx = this._ui.currentIndex;
    const q = this._ui.queue;
    if (idx >= 0 && idx < q.length) {
      const it = q[idx];
      if (!this._ui.song || this._ui.song.songId !== it.songId) {
        this._ui.song = {
          songId: it.songId,
          title: it.title,
          artist: it.artist,
          album: it.album,
          coverArt: it.coverArt,
          duration: it.duration,
        };
        if (it.songId) {
          this._client.scrobble?.(it.songId).catch((e) => err("scrobble failed", e));
          this._loadLyrics(it.songId);
          this._loadLiked(it.songId);
        }
      }
    }
  }

  _refreshPeers() {
    this._client.getPeers().then((res) => {
      const peers = this._filterDlna(res?.peers || []);
      if (peers.length) { this._ui.peers = peers; this.requestUpdate(); }
    }).catch((e) => err("getPeers failed", e));
  }

  async _refreshCurrentPeerView() {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    try {
      const [status, queue] = await Promise.all([
        this._client.getStatus(pid),
        this._client.getQueue(pid),
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
    this._ui.queue = [];
    this._ui.currentIndex = -1;
    this._ui.song = null;
    this._ui.lyrics = [];
    this._ui.currentLyric = "";
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
          this._client.getQueue(pid),
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

  // 音量:点击把整个控制区切换为内联滑动条(反之亦然)
  _toggleVolumePop() {
    this._ui.showVolume = !this._ui.showVolume;
    this.requestUpdate();
  }

  // 音量内联面板:用水平滑动条替换整个播放控件区(去掉弹窗)。
  // 触屏优化:采用「相对拖动」——按下只记录起点、不跳值;移动时按位移增量调音量,
  // 松开才提交。避免触屏一点就直接跳到 100。
  _renderVolumeInline() {
    const u = this._ui;
    const vpct = Math.round(u.volume * 100);
    return html`
      <div class="vol-inline">
        <button class="ctl" title="${u.muted ? "取消静音" : "静音"}" @click=${this._toggleMute}>${this._icon(u.muted ? "volumeX" : "volume2", 20)}</button>
        <div class="vol-slider" @pointerdown=${this._volPointerDown} @pointermove=${this._volPointerMove} @pointerup=${this._volPointerUp} @pointercancel=${this._volPointerUp}>
          <div class="vol-track"></div>
          <div class="vol-fill" style="width:${vpct}%"></div>
          <div class="vol-knob" style="left:${vpct}%"></div>
          <span class="vol-value" style="left:${vpct}%">${vpct}%</span>
        </div>
        <button class="ctl" title="完成" @click=${() => { u.showVolume = false; this.requestUpdate(); }}>${this._icon("check", 20)}</button>
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
    if (!lines.length) { this._ui.currentLyric = ""; return; }
    const t = this._ui.currentTime;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= t) idx = i; else break;
    }
    this._ui.currentLyric = idx >= 0 ? lines[idx].text : "";
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
    if (!this._ui.queue[index]) return;
    this._client.jumpToIndex(pid, index)
      .catch((e) => {
        // 后端未升级:退化成完整队列 + 目标索引重放
        err("jumpToIndex unavailable, fallback to playQueue", e);
        const items = this._ui.queue.map((it) => childToQueueItem(it));
        this._client.playQueue(pid, items, index).catch((e2) => err("jumpTo failed", e2));
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
          const rebuilt = [...this._ui.queue.map((it) => childToQueueItem(it)), item];
          await this._client.playQueue(pid, rebuilt, this._ui.queue.length);
        }
      }
    } catch (e) {
      err("appendAndPlay failed", e);
    }
  }

  _reorder(from, to) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    const items = this._ui.queue.slice();
    if (from < 0 || from >= items.length || to < 0 || to >= items.length) return;
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    const playingId = this._ui.song?.songId;
    let newIndex = items.findIndex((it) => it.songId === playingId);
    if (newIndex < 0) newIndex = Math.max(0, Math.min(to, items.length - 1));
    this._ui.queue = items;
    this._ui.currentIndex = newIndex;
    // 先按新顺序重建队列(startIndex 任意,shuffle 下会被随机化,故随即 jump 修正)
    this._client.playQueue(pid, items.map(childToQueueItem), 0)
      .catch((e) => err("reorder failed", e));
    this._client.jumpToIndex(pid, newIndex)
      .catch((e) => err("reorder jump failed", e));
    this.requestUpdate();
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
    }
    // 播放器封面也要走 mode 感知加载(代理模式裸 <img src> 不带 HA 鉴权会 401)。
    const pc = this.shadowRoot?.querySelector(".nowcover");
    if (pc) this._loadCoverInto(pc);
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
      <ha-card>
        <div class="wrap ${u.connected || u.serverOk ? "" : "off"}">
          ${this._renderOutputs()}

          <div class="now">
            <div class="cover" role="button" @click=${this._openBrowser}>${song?.coverArt
              ? html`<img class="nowcover" data-cover-id="${song.coverArt}" alt="" />`
              : html`<div class="nocover">♪</div>`}</div>
            <div class="meta">
              <div class="track">${song ? song.title : "未在播放"}<span class="t-art">${song && song.artist ? " - " + song.artist : ""}</span></div>
              <div class="artist">${u.currentLyric || ""}</div>
            </div>
          </div>

          <div class="controls">
            <button class="ctl ${u.showQueue ? "active" : ""}" title="队列" @click=${() => { u.showQueue = !u.showQueue; u.showBrowser = false; this.requestUpdate(); }}>${this._icon("queue", 20)}</button>
            ${u.showVolume ? this._renderVolumeInline() : html`
              <button class="ctl" title="${PLAY_MODE_TIP[u.playMode]}" @click=${this._cyclePlayMode}>${this._icon(PLAY_MODE_ICON[u.playMode], 20)}</button>
              <button class="ctl" title="上一首" @click=${this._prev}>${this._icon("prev", 22)}</button>
              <button class="ctl play" title="播放/暂停" @click=${this._togglePlay}>${this._icon(u.isPlaying ? "pause" : "play", 22, true)}</button>
              <button class="ctl" title="下一首" @click=${this._next}>${this._icon("next", 22)}</button>
              <button class="ctl like ${u.liked ? "on" : ""}" title="喜欢" @click=${this._toggleLike}>${this._icon("heart", 20, u.liked)}</button>
              <button class="ctl vol-open" title="音量" @click=${this._toggleVolumePop}>${this._icon(u.muted || u.volume <= 0 ? "volumeX" : "volume2", 20)}</button>
            `}
          </div>

          <div class="progress-row">
            <span class="t">${this._fmtTime(u.currentTime)}</span>
            <input class="seek" type="range" min="0" max="100" step="0.1" value="${prog}"
              style="background: linear-gradient(90deg, #f62c55 ${prog}%, rgba(255,255,255,0.18) ${prog}%)"
              @input=${this._seek} />
            <span class="t">${this._fmtTime(u.duration)}</span>
          </div>

          ${u.showQueue ? this._renderQueue() : ""}
          ${u.showBrowser ? this._renderMediaBrowser() : ""}
        </div>
      </ha-card>
    `;
  }

  _renderOutputs() {
    const peers = this._ui.peers || [];
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

  // 歌词当前行已常驻显示在卡片歌手行(this._ui.currentLyric),不再展开独立面板。

  _renderQueue() {
    const q = this._ui.queue || [];
    return html`
      <div class="panel queue">
        <div class="panel-head">
          <span>队列 (${q.length})</span>
          <button class="mini" @click=${this._clearQueue}>清空</button>
        </div>
        ${q.length === 0 ? html`<div class="empty">队列为空</div>` : html`
          <div class="qlist">
            ${q.map((it, i) => html`
              <div class="qitem ${i === this._ui.currentIndex ? "cur" : ""}"
                draggable="true"
                @dragstart=${(e) => { e.dataTransfer.setData("text/plain", String(i)); }}
                @dragover=${(e) => e.preventDefault()}
                @drop=${(e) => { e.preventDefault(); const from = Number(e.dataTransfer.getData("text/plain")); this._reorder(from, i); }}>
                <span class="idx">${i + 1}</span>
                <span class="qt">${it.title}</span>
                <span class="qa">${it.artist || ""}</span>
                <button class="mini" title="跳播" @click=${() => this._jumpTo(i)}>▶</button>
                <button class="mini" title="移除" @click=${() => this._removeFromQueue(i)}>✕</button>
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }

  // ============ Media library browser ============
  _openBrowser() {
    const u = this._ui;
    u.showBrowser = true;
    u.showQueue = false;
    u.browserStack = [{
      type: "root",
      items: [
        { kind: "cat", cat: "playlists", name: "歌单" },
        { kind: "cat", cat: "albums", name: "专辑" },
        { kind: "cat", cat: "songs", name: "音乐" },
        { kind: "cat", cat: "artists", name: "艺术家" },
        { kind: "cat", cat: "genres", name: "流派" },
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
      case "genres": return "流派";
      case "genre": return lv.name || "流派";
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

  // 分页加载:每页 PAGE_SIZE 行。
  // - SERVER_PAGED 类型(songs/albums/artists/genres):走后端 /api/v1/* 真分页,只拉当前页 + total。
  // - 其余类型(playlists/playlist/album/artist/starred):一次取回全部缓存到 allItems,本地切片分页。
  // reset=false 时不重新拉全部(客户端类型翻页用);page 指定目标页(1-based)。
  async _browserLoad(level, { page = 1, reset = true } = {}) {
    if (level.loading) return;
    if (SERVER_PAGED.has(level.type)) {
      level.loading = true; level.page = page; this.requestUpdate();
      try {
        const q = (level.query || "").trim();
        let res;
        if (level.type === "songs") res = await this._client.getSongsV2({ page, pageSize: PAGE_SIZE, query: q });
        else if (level.type === "albums") res = await this._client.getAlbumsV2({ page, pageSize: PAGE_SIZE, query: q });
        else if (level.type === "artists") res = await this._client.getArtistsV2({ page, pageSize: PAGE_SIZE, query: q });
        else if (level.type === "genres") res = await this._client.getGenresV2({ page, pageSize: PAGE_SIZE, query: q });
        const items = res?.items || [];
        level.items = this._mapBrowseItems(level.type, items);
        level.total = res?.total || items.length;
      } catch (e) {
        err("browser server-page load failed", e);
        if (page === 1) level.items = [];
        level.total = 0;
      }
      level.totalPages = Math.max(1, Math.ceil(level.total / PAGE_SIZE));
      level.loading = false; this.requestUpdate();
      return;
    }
    // 服务端分页(Subsonic 端点):我喜欢的 / 专辑内歌曲 / 歌单内歌曲
    else if (PAGED_SUBSONIC.has(level.type)) {
      level.loading = true; level.page = page; this.requestUpdate();
      try {
        const offset = (page - 1) * PAGE_SIZE;
        let res, items = [], total = 0;
        if (level.type === "starred") {
          res = await this._client.getStarred({ offset, size: PAGE_SIZE });
          items = res?.starred2?.song || [];
          total = res?.starred2?.songTotal || items.length;
        } else if (level.type === "album") {
          res = await this._client.getAlbum(level.id, { offset, size: PAGE_SIZE });
          items = res?.album?.song || [];
          total = res?.album?.songTotal || items.length;
        } else if (level.type === "playlist") {
          res = await this._client.getPlaylistSongs(level.id, { offset, size: PAGE_SIZE });
          items = res?.playlist?.entry || [];
          total = res?.playlist?.songTotal || items.length;
        }
        level.items = items.map((s) => this._toSongItem(s));
        level.total = total;
      } catch (e) {
        err("browser subsonic-page load failed", e);
        if (page === 1) level.items = [];
        level.total = 0;
      }
      level.totalPages = Math.max(1, Math.ceil(level.total / PAGE_SIZE));
      level.loading = false; this.requestUpdate();
      return;
    }
    // 客户端分页:首次(reset)或尚无缓存时拉全部
    if (reset || !level.allItems) {
      level.loading = true; level.page = 1; this.requestUpdate();
      try { level.allItems = await this._fetchAllItems(level); }
      catch (e) { err("browser client load failed", e); level.allItems = []; }
      level.loading = false;
    }
    level.page = page;
    const q = (level.query || "").trim().toLowerCase();
    let view = level.allItems || [];
    if (q && level.type === "playlists") {
      view = view.filter((it) => ((it.title || it.name || "") || "").toLowerCase().includes(q));
    }
    level.viewItems = view;
    level.total = view.length;
    const start = (page - 1) * PAGE_SIZE;
    level.items = view.slice(start, start + PAGE_SIZE);
    level.totalPages = Math.max(1, Math.ceil(level.total / PAGE_SIZE));
    this.requestUpdate();
  }

  // 翻页:服务端类型同样走 _browserLoad(始终按页拉取);客户端类型复用 allItems 切片。
  _browserGotoPage(level, page) {
    page = Math.max(1, Math.min(level.totalPages || 1, page | 0));
    if (page === level.page) return;
    this._browserLoad(level, { page, reset: false });
  }

  // 一次性取回客户端分页类型的全部条目
  async _fetchAllItems(level) {
    if (level.type === "playlists") {
      const res = await this._client.getPlaylists();
      return (res?.playlists?.playlist || res?.playlists || []).map((p) => ({
        kind: "playlist", id: String(p.id), name: p.name || "未命名歌单",
        coverArt: p.coverArt, songCount: p.songCount,
      }));
    } else if (level.type === "artist") {
      const res = await this._client.getArtist(level.id);
      return (res?.artist?.album || []).map((a) => ({
        kind: "album", id: String(a.id), name: a.name || "未知专辑",
        artist: a.artist || "", coverArt: a.coverArt,
      }));
    }
    return [];
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

  _browserSearch() {
    const level = this._ui.browserStack[this._ui.browserStack.length - 1];
    if (!level) return;
    // songs/albums/artists/genres 走服务端 V2 搜索(带 total 分页);
    // playlists/starred 走本地过滤。统一重置到第 1 页。
    this._browserLoad(level, { page: 1, reset: false });
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
      case "genre": return "流派";
      default: return "列表";
    }
  }

  // 点击封面:直接播放整个集合(歌单/专辑/艺人/流派)的全部歌曲,
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
      : it.kind === "genre" ? `${it.albumCount || 0} 专辑`
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
        <button class="bplay" title="播放整个${this._collLabel(it)}" @click=${(e) => { e.stopPropagation(); this._browserPlayCollection(it); }}>${this._icon("play", 18, true)}</button>
      </div>`;
  }

  _renderMediaBrowser() {
    const stack = this._ui.browserStack;
    const level = stack[stack.length - 1];
    if (!level) return html``;
    const visible = level.items || [];
    // 搜索框:专辑/艺术家/流派走服务端 V2 搜索;歌单/我喜欢的走本地过滤;音乐(全库歌曲)走服务端搜索。
    const showSearch = ["playlists", "albums", "artists", "genres", "starred", "songs"].includes(level.type);
    return html`
      <div class="overlay" @click=${() => { this._ui.showBrowser = false; this.requestUpdate(); }}>
        <div class="browser" @click=${(e) => e.stopPropagation()}>
          <div class="br-head">
            <span class="br-title">媒体库</span>
            <button class="mini" @click=${() => { this._ui.showBrowser = false; this.requestUpdate(); }}>关闭</button>
          </div>
          <div class="br-crumbs">
            ${stack.map((lv, i) => html`
              <span class="crumb ${i === stack.length - 1 ? "cur" : ""}" @click=${() => this._browserPopTo(i)}>${this._crumbName(lv)}</span>
              ${i < stack.length - 1 ? html`<span class="crumb-sep">›</span>` : ""}
            `)}
          </div>
          ${showSearch ? html`
            <div class="br-search">
              <input class="search-input" placeholder="搜索…" .value=${level.query}
                @input=${(e) => { level.query = e.target.value; }}
                @keydown=${(e) => { if (e.key === "Enter") this._browserSearch(); }} />
              <button class="mini" @click=${this._browserSearch}>搜索</button>
            </div>
          ` : ""}
          <div class="br-list">
            ${level.loading ? html`<div class="empty">加载中…</div>` : ""}
            ${!level.loading && level.type === "root" ? html`
              <div class="cat-grid">
                ${visible.map((c) => html`<button class="cat" @click=${() => this._browserItemClick(c)}>${c.name}</button>`)}
              </div>
            ` : ""}
            ${!level.loading && level.type !== "root" ? html`
              ${visible.length === 0 ? html`<div class="empty">无内容</div>` : ""}
              ${visible.map((it) => this._renderBrowserItem(it))}
              ${this._renderPager(level)}
            ` : ""}
          </div>
        </div>
      </div>
    `;
  }

  _pagerPages(cur, tp) {
    const out = [];
    if (tp <= 7) { for (let i = 1; i <= tp; i++) out.push(i); return out; }
    out.push(1);
    if (cur > 4) out.push("...");
    const s = Math.max(2, cur - 2), e = Math.min(tp - 1, cur + 2);
    for (let i = s; i <= e; i++) out.push(i);
    if (cur < tp - 3) out.push("...");
    out.push(tp);
    return out;
  }

  // 分页控件:参考主项目 PagePagination(el-pagination)。
  // 显示 总数 + 上一页 + 页码(带省略号) + 下一页 + 跳页。每页 PAGE_SIZE(8)行。
  _renderPager(level) {
    const tp = level.totalPages || 1;
    const cur = level.page || 1;
    if (tp <= 1) return html``;
    const pages = this._pagerPages(cur, tp);
    return html`
      <div class="br-pager">
        <span class="pg-total">共 ${level.total || 0} 条</span>
        <button class="pg-btn" ?disabled=${cur <= 1} @click=${() => this._browserGotoPage(level, cur - 1)}>‹</button>
        ${pages.map((p) => p === "..." ? html`<span class="pg-ell">…</span>` :
          html`<button class="pg-btn ${p === cur ? "cur" : ""}" @click=${() => this._browserGotoPage(level, p)}>${p}</button>`)}
        <button class="pg-btn" ?disabled=${cur >= tp} @click=${() => this._browserGotoPage(level, cur + 1)}>›</button>
        <span class="pg-jump">前往 <input class="pg-input" type="number" min="1" max="${tp}" .value=${String(cur)}
          @change=${(e) => { const v = parseInt(e.target.value, 10) || 1; this._browserGotoPage(level, v); }}> 页</span>
      </div>`;
  }

  static get styles() {
    return css`
      :host { display: block; }
      ha-card {
        /* MusicFlow FnOS 暗色玻璃拟态:深紫灰渐变底 + 细微极光 */
        background: linear-gradient(180deg, #2d293a 0%, #1a1728 52%, #15121f 100%);
        color: #ffffff;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        overflow: hidden;
        position: relative;
        font-family: 'Montserrat', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Segoe UI', Arial, sans-serif;
      }
      ha-card::before {
        content: '';
        position: absolute; inset: 0; z-index: 0; pointer-events: none;
        background:
          radial-gradient(ellipse 62% 44% at 16% 0%, rgba(126, 110, 178, 0.16), transparent 62%),
          radial-gradient(ellipse 54% 42% at 88% 100%, rgba(246, 44, 85, 0.10), transparent 62%);
      }
      .wrap { position: relative; z-index: 1; padding: 14px; display: flex; flex-direction: column; gap: 12px;
        transition: opacity 0.3s ease, filter 0.3s ease; }
      /* 未连接:整卡调暗降饱和做区分(不再显示"已连接/未连接"文字) */
      .wrap.off { opacity: 0.45; filter: saturate(0.5) brightness(0.75); }
      .ic { display: inline-flex; align-items: center; justify-content: center; line-height: 0; }
      .ic svg { display: block; }
      .err { color: #f05672; padding: 12px; }
      .outputs { display: flex; flex-wrap: wrap; gap: 6px; }
      .out { border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.85);
        border-radius: 14px; padding: 4px 12px; font-size: 12px; cursor: pointer;
        transition: background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.12s; }
      .out:hover { background: rgba(255, 255, 255, 0.10); box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .out:active { transform: scale(0.96); }
      .out.active { background: #f62c55; border-color: #f62c55; color: #fff; box-shadow: 0 4px 14px rgba(246, 44, 85, 0.35); }
      .out.off { opacity: 0.45; }
      .hint { color: rgba(255, 255, 255, 0.5); font-size: 12px; }
      .now { display: flex; gap: 12px; align-items: flex-start; justify-content: space-between; }
      .cover { width: 84px; height: 84px; border-radius: 12px; overflow: hidden; flex: 0 0 auto;
        background: rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35); }
      .cover { cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease; position: relative; }
      .cover:hover { transform: scale(1.06); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45); z-index: 2; }
      .cover img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.18s ease; }
      .cover:hover img { transform: scale(1.04); }
      .nocover { font-size: 30px; color: rgba(255, 255, 255, 0.3); }
      .meta { flex: 1; min-width: 0; }
      .track { font-weight: 600; font-size: 16px; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .artist { font-size: 13px; color: #ffd400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
      .t-art { font-size: 13px; font-weight: 400; color: rgba(255, 255, 255, 0.6); }
      .progress-row { display: flex; align-items: center; gap: 8px; }
      .progress-row .t { font-size: 11px; color: rgba(255, 255, 255, 0.5); width: 34px; text-align: center; font-variant-numeric: tabular-nums; }
      .seek { flex: 1; height: 6px; border-radius: 3px; }
      .seek { -webkit-appearance: none; appearance: none; outline: none; cursor: pointer; background: rgba(255, 255, 255, 0.18); }
      .seek::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
        width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 2px solid #f62c55;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4); cursor: pointer; transition: transform 0.15s ease; }
      .seek:hover::-webkit-slider-thumb { transform: scale(1.2); }
      .seek::-moz-range-track { height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.18); }
      .seek::-moz-range-progress { height: 6px; border-radius: 3px; background: #f62c55; }
      .seek::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%;
        background: #fff; border: 2px solid #f62c55; }
      .controls { display: flex; justify-content: center; align-items: center; gap: 23px; position: relative; }
      .ctl { border: none; background: transparent; color: rgba(255, 255, 255, 0.85); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        width: 42px; height: 42px; padding: 0; border-radius: 50%;
        transition: background 0.2s, box-shadow 0.2s, transform 0.12s, color 0.2s; }
      .ctl svg { display: block; }
      .ctl:hover { background: rgba(255, 255, 255, 0.10); box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .ctl:active { transform: scale(0.92); }
      .ctl.play { width: 42px; height: 42px; background: transparent; color: rgba(255, 255, 255, 0.85); }
      .ctl.play:hover { background: rgba(255, 255, 255, 0.10); box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .ctl.play:active { transform: scale(0.92); }
      .ctl.like.on { color: #f62c55; }
      .ctl.active { color: #f62c55; box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .ctl.vol-open { background: transparent; color: rgba(255, 255, 255, 0.85); }
      /* 音量内联面板:点击音量键后把整个控制区替换为水平滑动条(无弹窗)。
         触屏用相对拖动(touch-action:none + pointer 事件),按下不跳值、仅按位移增量调音量。 */
      .vol-inline { display: flex; align-items: center; gap: 10px; width: 100%; }
      .vol-slider { position: relative; flex: 1; height: 30px; cursor: pointer; touch-action: none; display: flex; align-items: center; }
      .vol-track { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.18); }
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
      .panel { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 10px; }
      .panel-head { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
      .empty { color: rgba(255, 255, 255, 0.45); font-size: 13px; padding: 10px 0; text-align: center; }
      /* 歌词展开面板已移除,当前行常驻显示在 .artist(this._ui.currentLyric) */
      .qlist, .slist { max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
      .qlist::-webkit-scrollbar, .slist::-webkit-scrollbar,
      .br-list::-webkit-scrollbar { width: 6px; }
      .qlist::-webkit-scrollbar-thumb, .slist::-webkit-scrollbar-thumb,
      .br-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 3px; }
      .qlist::-webkit-scrollbar-thumb:hover, .slist::-webkit-scrollbar-thumb:hover,
      .br-list::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.28); }
      .qitem, .sitem { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 8px; transition: background 0.15s; }
      .qitem:hover, .sitem:hover { background: rgba(255, 255, 255, 0.06); }
      .qitem.cur { background: rgba(246, 44, 85, 0.16); }
      .qitem .idx { width: 18px; color: rgba(255, 255, 255, 0.4); font-size: 12px; }
      .qitem .qt, .sitem .st { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; color: rgba(255, 255, 255, 0.9); }
      .qitem .qa, .sitem .sa { width: 90px; color: rgba(255, 255, 255, 0.45); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mini { border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.85);
        border-radius: 8px; padding: 3px 8px; font-size: 12px; cursor: pointer;
        transition: background 0.2s, box-shadow 0.2s, transform 0.12s; }
      .mini:hover { background: rgba(255, 255, 255, 0.10); box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .bplay { border: none; background: #f62c55; color: #fff; cursor: pointer;
        width: 38px; height: 38px; padding: 0; border-radius: 50%; flex: 0 0 auto;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.2s, box-shadow 0.2s, transform 0.12s; }
      .bplay:hover { background: #e63954; box-shadow: 0 0 0 1px rgba(246, 44, 85, 0.5); }
      .bplay:active { transform: scale(0.92); }
      .bplay svg { display: block; }
      .mini:active { transform: scale(0.94); }
      .search-input { flex: 1; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px;
        padding: 7px 10px; background: rgba(0, 0, 0, 0.3); color: #fff; outline: none;
        transition: border-color 0.2s, box-shadow 0.2s; }
      .search-input::placeholder { color: rgba(255, 255, 255, 0.35); }
      .search-input:focus { border-color: #f62c55; box-shadow: 0 0 0 1px #f62c55; }
      .overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 999; }
      .browser { background: #1f1c2a; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); border-radius: 16px; padding: 14px;
        width: 400px; max-width: 92vw; max-height: 82vh; display: flex; flex-direction: column; }
      .br-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .br-title { font-weight: 600; font-size: 15px; }
      .br-crumbs { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; font-size: 12px;
        color: rgba(255, 255, 255, 0.5); margin-bottom: 8px; }
      .crumb { cursor: pointer; transition: color 0.15s; }
      .crumb:hover { color: rgba(255, 255, 255, 0.85); }
      .crumb.cur { color: #f62c55; font-weight: 600; }
      .crumb-sep { color: rgba(255, 255, 255, 0.3); }
      .br-search { display: flex; gap: 6px; margin-bottom: 8px; }
      .br-list { overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 2px; min-height: 140px; }
      .br-pager { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 5px;
        padding: 12px 4px 6px; }
      .br-pager .pg-total { font-size: 12px; color: rgba(255, 255, 255, 0.5); margin-right: 6px; }
      .br-pager .pg-btn { min-width: 30px; height: 30px; padding: 0 6px; border-radius: 7px;
        border: 1px solid rgba(255, 255, 255, 0.14); background: transparent; color: rgba(255, 255, 255, 0.88);
        cursor: pointer; font-size: 13px; line-height: 1; transition: background 0.15s, border-color 0.15s; }
      .br-pager .pg-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.10); }
      .br-pager .pg-btn.cur { background: #f62c55; color: #fff; border-color: transparent; font-weight: 600; }
      .br-pager .pg-btn:disabled { opacity: 0.32; cursor: default; }
      .br-pager .pg-ell { color: rgba(255, 255, 255, 0.5); padding: 0 2px; }
      .br-pager .pg-jump { font-size: 12px; color: rgba(255, 255, 255, 0.5); display: flex; align-items: center;
        gap: 4px; margin-left: 6px; }
      .br-pager .pg-input { width: 46px; height: 26px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.14);
        background: transparent; color: rgba(255, 255, 255, 0.9); text-align: center; font-size: 13px; }
      .br-pager .pg-input:focus { outline: none; border-color: #f62c55; }
      .cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px 0; }
      .cat { border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.9);
        border-radius: 12px; padding: 20px 8px; font-size: 14px; cursor: pointer;
        transition: background 0.2s, box-shadow 0.2s, transform 0.12s; }
      .cat:hover { background: rgba(255, 255, 255, 0.10); box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .cat:active { transform: scale(0.97); }
      .bitem { display: flex; align-items: center; gap: 8px; padding: 5px 6px; border-radius: 8px; transition: background 0.15s; }
      .bitem:hover { background: rgba(255, 255, 255, 0.06); }
      .bthumb { width: 38px; height: 38px; border-radius: 8px; overflow: hidden; flex: 0 0 auto;
        background: rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: center;
        transition: box-shadow 0.2s, transform 0.12s; }
      .bthumb:hover { box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); transform: scale(1.05); }
      .bthumb img { width: 100%; height: 100%; object-fit: cover; }
      .bcover-lazy:not([src]) { visibility: hidden; }
      .bnocover { font-size: 18px; color: rgba(255, 255, 255, 0.3); }
      .bmeta { min-width: 0; }
      .bt { font-size: 13px; color: rgba(255, 255, 255, 0.92); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ba { font-size: 11px; color: rgba(255, 255, 255, 0.45); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
