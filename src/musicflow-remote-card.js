// MusicFlow Remote Card — a Lovelace card that acts as a full external
// controller for a MusicFlow server. It connects directly to the backend's
// real-time /ws channel + REST API (via the `musicflow/backend_config` HA WS
// command), so it is an equal peer to the Web/App clients.
import { LitElement, html, css } from "lit";
import { BackendClient, childToQueueItem, parseLyrics } from "./backend-client.js";

const PLAY_MODES = ["order", "one", "all", "shuffle"];
const PLAY_MODE_LABEL = { order: "顺序", one: "单曲", all: "循环", shuffle: "随机" };

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
      showLyrics: false,
      showQueue: false,
      showSearch: false,
      showPlaylistPicker: false,
      searchQuery: "",
      searchResults: [],
      playlists: [],
      pickerSongId: null,
      showBrowser: false,
      browserStack: [],
    };
    this._tickTimer = null;
    this._pollTimer = null;
    this._heartbeatTimer = null;
    this._volumeDebounce = null;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._teardown();
  }

  _teardown() {
    if (this._tickTimer) { clearInterval(this._tickTimer); this._tickTimer = null; }
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    if (this._heartbeatTimer) { clearInterval(this._heartbeatTimer); this._heartbeatTimer = null; }
    if (this._client) this._client.disconnect();
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
  }

  _bindClient() {
    const c = this._client;
    c.on("open", () => {
      this._ui.connected = true;
      this._startHeartbeat();
      this.requestUpdate();
    });
    c.on("close", () => { this._ui.connected = false; this.requestUpdate(); });
    c.on("snapshot", (devices) => this._applySnapshot(devices));
    c.on("peer_snapshot", (peers) => this._applyPeerSnapshot(peers));
    c.on("peer_update", (peer) => this._upsertPeer(peer));
    c.on("peer_queue", ({ peerId, queue }) => this._applyPeerQueue(peerId, queue));
    c.on("queue_changed", ({ deviceId, queue }) => this._applyDeviceQueue(deviceId, queue));
    c.on("state", ({ deviceId, state }) => this._applyDeviceState(deviceId, state));
    c.on("media", ({ deviceId, media }) => this._applyDeviceMedia(deviceId, media));
    c.on("group", () => this._refreshPeers());
    c.on("group_deleted", () => this._refreshPeers());
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
    if (typeof status.volume === "number") this._ui.volume = Math.max(0, Math.min(100, status.volume)) / 100;
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

  _toggleLike() {
    const song = this._ui.song;
    if (!song?.songId) return;
    if (this._ui.liked) {
      this._client.unstar(song.songId).catch((e) => err("unstar failed", e));
    } else {
      this._client.star(song.songId).catch((e) => err("star failed", e));
    }
    this._ui.liked = !this._ui.liked;
    this.requestUpdate();
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

  // 跳播:用完整队列 + 目标索引重放,保留队列其它曲目(不重建/不清空)
  _jumpTo(index) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    if (!this._ui.queue[index]) return;
    const items = this._ui.queue.map((it) => childToQueueItem(it));
    this._client.playQueue(pid, items, index)
      .catch((e) => err("jumpTo failed", e));
  }

  // 加入播放队列并播放:现有队列 + 该曲,从新曲索引开始
  _appendAndPlay(song) {
    const pid = this._ui.currentPeerId;
    if (!pid || !song) return;
    const items = [...this._ui.queue.map((it) => childToQueueItem(it)), childToQueueItem(song)];
    this._client.playQueue(pid, items, this._ui.queue.length)
      .catch((e) => err("appendAndPlay failed", e));
  }

  // 仅加入队列(不改变当前播放)
  _enqueueOnly(song) {
    const pid = this._ui.currentPeerId;
    if (!pid || !song) return;
    this._client.enqueue(pid, [childToQueueItem(song)])
      .catch((e) => err("enqueue failed", e));
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
    this._client.playQueue(pid, items.map(childToQueueItem), newIndex)
      .catch((e) => err("reorder failed", e));
    this.requestUpdate();
  }

  // ============ Search ============
  async _doSearch() {
    const q = (this._ui.searchQuery || "").trim();
    if (!q) { this._ui.searchResults = []; this.requestUpdate(); return; }
    try {
      const res = await this._client.search(q, { count: 30 });
      const songs = res?.searchResult3?.song || res?.searchResult2?.song || [];
      this._ui.searchResults = songs.map((s) => ({
        songId: s.id,
        title: s.title || "未知",
        artist: s.artist || "",
        album: s.album || "",
        coverArt: s.coverArt,
        duration: s.duration || 0,
        suffix: s.suffix,
      }));
    } catch (e) {
      err("search failed", e);
      this._ui.searchResults = [];
    }
    this.requestUpdate();
  }

  _searchPlay(song) {
    this._appendAndPlay(song);
  }

  _searchEnqueue(song) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    this._client.enqueue(pid, [childToQueueItem(song)])
      .catch((e) => err("searchEnqueue failed", e));
  }

  // ============ Add to playlist ============
  async _loadPlaylists() {
    try {
      const res = await this._client.getPlaylists();
      const list = res?.playlists?.playlist || res?.playlists || [];
      this._ui.playlists = list
        .filter((p) => p && p.id != null)
        .map((p) => ({ id: String(p.id), name: p.name || "未命名歌单" }));
    } catch (e) {
      err("loadPlaylists failed", e);
      this._ui.playlists = [];
    }
    this.requestUpdate();
  }

  _openPlaylistPicker(songId) {
    this._ui.pickerSongId = songId;
    this._ui.showPlaylistPicker = true;
    this._loadPlaylists();
  }

  _addToPlaylist(playlistId) {
    const songId = this._ui.pickerSongId;
    if (!songId) return;
    this._client.updatePlaylist(playlistId, { songIdsToAdd: [songId] })
      .then(() => log("added to playlist", playlistId))
      .catch((e) => err("addToPlaylist failed", e));
    this._ui.showPlaylistPicker = false;
    this._ui.pickerSongId = null;
  }

  // ============ Rendering ============
  _cover(coverArt) {
    return this._client ? this._client.coverUrl(coverArt) : null;
  }

  _fmtTime(s) {
    if (!s || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
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
    const vpct = Math.round(u.volume * 100);

    return html`
      <ha-card>
        <div class="wrap">
          ${this._renderOutputs()}

          <div class="now">
            <div class="cover">${song?.coverArt
              ? html`<img src="${this._cover(song.coverArt)}" alt="" />`
              : html`<div class="nocover">♪</div>`}</div>
            <div class="meta">
              <div class="track">${song ? song.title : "未在播放"}</div>
              <div class="artist">${song ? song.artist : "—"}</div>
              <div class="progress-row">
                <span class="t">${this._fmtTime(u.currentTime)}</span>
                <input class="seek" type="range" min="0" max="100" step="0.1" value="${prog}"
                  style="background: linear-gradient(90deg, #f62c55 ${prog}%, rgba(255,255,255,0.18) ${prog}%)"
                  @input=${this._seek} />
                <span class="t">${this._fmtTime(u.duration)}</span>
              </div>
            </div>
            <span class="conn ${u.connected ? "on" : "off"}" title="后端连接状态">${u.connected ? "已连接" : "未连接"}</span>
          </div>

          <div class="controls">
            <button class="ctl" title="播放模式" @click=${this._cyclePlayMode}>🔀<small>${PLAY_MODE_LABEL[u.playMode]}</small></button>
            <button class="ctl" title="上一首" @click=${this._prev}>⏮</button>
            <button class="ctl play" title="播放/暂停" @click=${this._togglePlay}>${u.isPlaying ? "⏸" : "▶"}</button>
            <button class="ctl" title="下一首" @click=${this._next}>⏭</button>
            <button class="ctl like ${u.liked ? "on" : ""}" title="喜欢" @click=${this._toggleLike}>${u.liked ? "♥" : "♡"}</button>
          </div>

          <div class="vol-row">
            <button class="vbtn" title="静音" @click=${this._toggleMute}>${u.muted ? "🔇" : "🔈"}</button>
            <input class="vol" type="range" min="0" max="100" value="${vpct}"
              style="background: linear-gradient(90deg, #f62c55 ${vpct}%, rgba(255,255,255,0.18) ${vpct}%)"
              @input=${this._setVolume} />
            <span class="vpct">${vpct}%</span>
          </div>

          <div class="actions">
            <button class="act ${u.showLyrics ? "active" : ""}" @click=${() => { u.showLyrics = !u.showLyrics; u.showQueue = false; u.showSearch = false; u.showBrowser = false; this.requestUpdate(); }}>歌词</button>
            <button class="act ${u.showQueue ? "active" : ""}" @click=${() => { u.showQueue = !u.showQueue; u.showLyrics = false; u.showSearch = false; u.showBrowser = false; this.requestUpdate(); }}>队列</button>
            <button class="act ${u.showSearch ? "active" : ""}" @click=${() => { u.showSearch = !u.showSearch; u.showLyrics = false; u.showQueue = false; u.showBrowser = false; this.requestUpdate(); }}>搜索</button>
            <button class="act ${u.showBrowser ? "active" : ""}" @click=${this._openBrowser}>媒体库</button>
          </div>

          ${u.showLyrics ? this._renderLyrics() : ""}
          ${u.showQueue ? this._renderQueue() : ""}
          ${u.showSearch ? this._renderSearch() : ""}
          ${u.showBrowser ? this._renderMediaBrowser() : ""}
        </div>

        ${u.showPlaylistPicker ? this._renderPlaylistPicker() : ""}
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

  _renderLyrics() {
    const lines = this._ui.lyrics;
    if (!lines.length) return html`<div class="panel"><div class="empty">无歌词</div></div>`;
    const t = this._ui.currentTime;
    let active = -1;
    for (let i = 0; i < lines.length; i++) { if (lines[i].time <= t) active = i; else break; }
    return html`
      <div class="panel lyrics">
        ${lines.map((l, i) => html`<div class="lyr ${i === active ? "active" : ""}">${l.text || "…"}</div>`)}
      </div>
    `;
  }

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

  _renderSearch() {
    return html`
      <div class="panel search">
        <div class="panel-head">
          <input class="search-input" placeholder="搜索歌曲…"
            .value=${this._ui.searchQuery}
            @input=${(e) => { this._ui.searchQuery = e.target.value; }}
            @keydown=${(e) => { if (e.key === "Enter") this._doSearch(); }} />
          <button class="mini" @click=${this._doSearch}>搜索</button>
        </div>
        <div class="slist">
          ${this._ui.searchResults.map((s) => html`
            <div class="sitem">
              <span class="st">${s.title}</span>
              <span class="sa">${s.artist || ""}</span>
              <button class="mini" title="播放" @click=${() => this._searchPlay(s)}>▶</button>
              <button class="mini" title="加入队列" @click=${() => this._searchEnqueue(s)}>＋</button>
              <button class="mini" title="加入歌单" @click=${() => this._openPlaylistPicker(s.songId)}>♥+</button>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  _renderPlaylistPicker() {
    return html`
      <div class="overlay" @click=${() => { this._ui.showPlaylistPicker = false; this.requestUpdate(); }}>
        <div class="picker" @click=${(e) => e.stopPropagation()}>
          <div class="panel-head"><span>添加到歌单</span><button class="mini" @click=${() => { this._ui.showPlaylistPicker = false; this.requestUpdate(); }}>关闭</button></div>
          <div class="plist">
            ${(this._ui.playlists || []).map((p) => html`
              <div class="pitem" @click=${() => this._addToPlaylist(p.id)}>${p.name}</div>
            `)}
            ${(this._ui.playlists || []).length === 0 ? html`<div class="empty">无歌单</div>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  // ============ Media library browser ============
  _openBrowser() {
    const u = this._ui;
    u.showBrowser = true;
    u.showLyrics = u.showQueue = u.showSearch = false;
    u.browserStack = [{
      type: "root",
      items: [
        { kind: "cat", cat: "playlists", name: "歌单" },
        { kind: "cat", cat: "albums", name: "专辑" },
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

  async _browserLoad(level) {
    level.loading = true; this.requestUpdate();
    try {
      if (level.type === "playlists") {
        const res = await this._client.getPlaylists();
        level.items = (res?.playlists?.playlist || res?.playlists || []).map((p) => ({
          kind: "playlist", id: String(p.id), name: p.name || "未命名歌单",
          coverArt: p.coverArt, songCount: p.songCount,
        }));
      } else if (level.type === "playlist") {
        const res = await this._client.getPlaylistSongs(level.id);
        level.items = (res?.playlist?.entry || []).map((s) => this._toSongItem(s));
      } else if (level.type === "albums") {
        const res = await this._client.getAlbumList2({ type: "alphabeticalByName", size: 300 });
        level.items = (res?.albumList2?.album || []).map((a) => ({
          kind: "album", id: String(a.id), name: a.name || "未知专辑",
          artist: a.artist || "", coverArt: a.coverArt, songCount: a.songCount,
        }));
      } else if (level.type === "album") {
        const res = await this._client.getAlbum(level.id);
        level.items = (res?.album?.song || []).map((s) => this._toSongItem(s));
      } else if (level.type === "artists") {
        const res = await this._client.getArtists();
        const indexes = res?.artists?.index || [];
        const flat = [];
        for (const idx of indexes) for (const a of (idx.artist || [])) {
          flat.push({ kind: "artist", id: String(a.id), name: a.name || "未知艺术家", coverArt: a.coverArt });
        }
        level.items = flat;
      } else if (level.type === "artist") {
        const res = await this._client.getArtist(level.id);
        level.items = (res?.artist?.album || []).map((a) => ({
          kind: "album", id: String(a.id), name: a.name || "未知专辑",
          artist: a.artist || "", coverArt: a.coverArt,
        }));
      } else if (level.type === "genres") {
        const res = await this._client.getGenres();
        level.items = (res?.genres?.genre || []).map((g) => ({
          kind: "genre", id: g.value, name: g.value,
          songCount: g.songCount, albumCount: g.albumCount,
        }));
      } else if (level.type === "genre") {
        const res = await this._client.getAlbumList2({ type: "byGenre", genre: level.id, size: 300 });
        level.items = (res?.albumList2?.album || []).map((a) => ({
          kind: "album", id: String(a.id), name: a.name || "未知专辑",
          artist: a.artist || "", coverArt: a.coverArt, songCount: a.songCount,
        }));
      } else if (level.type === "starred") {
        const res = await this._client.getStarred();
        level.items = (res?.starred2?.song || []).map((s) => this._toSongItem(s));
      }
    } catch (e) {
      err("browser load failed", e);
      level.items = [];
    }
    level.loading = false;
    this.requestUpdate();
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
    const q = (level.query || "").trim();
    if (level.type === "albums") {
      if (!q) { this._browserLoad(level); return; }
      this._client.search(q, { count: 100 }).then((res) => {
        level.items = (res?.searchResult3?.album || []).map((a) => ({
          kind: "album", id: String(a.id), name: a.name || "未知专辑",
          artist: a.artist || "", coverArt: a.coverArt, songCount: a.songCount,
        }));
        this.requestUpdate();
      }).catch((e) => err("browser album search failed", e));
    } else if (level.type === "artists") {
      if (!q) { this._browserLoad(level); return; }
      this._client.search(q, { count: 100 }).then((res) => {
        level.items = (res?.searchResult3?.artist || []).map((a) => ({
          kind: "artist", id: String(a.id), name: a.name || "未知艺术家", coverArt: a.coverArt,
        }));
        this.requestUpdate();
      }).catch((e) => err("browser artist search failed", e));
    } else {
      this.requestUpdate();
    }
  }

  _browserItemClick(item) {
    if (!item) return;
    if (item.kind === "cat") {
      const map = { playlists: "playlists", albums: "albums", artists: "artists", genres: "genres", starred: "starred" };
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
  _browserEnqueueSong(song) { this._enqueueOnly(song); }

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
    const cover = it.coverArt ? this._cover(it.coverArt) : null;
    if (it.kind === "song") {
      return html`
        <div class="bitem">
          <div class="bthumb">${cover ? html`<img src="${cover}" alt="" />` : html`<span class="bnocover">♪</span>`}</div>
          <div class="bmeta" style="cursor:pointer;flex:1;min-width:0" @click=${() => this._browserItemClick(it)}>
            <div class="bt">${it.title}</div>
            <div class="ba">${it.artist || ""}</div>
          </div>
          <button class="mini" title="播放(加入队列并播放)" @click=${() => this._browserPlaySong(it)}>▶</button>
          <button class="mini" title="加入队列" @click=${() => this._browserEnqueueSong(it)}>＋</button>
        </div>`;
    }
    const sub = it.kind === "album" ? (it.artist || "")
      : it.kind === "genre" ? `${it.albumCount || 0} 专辑`
      : it.kind === "playlist" ? `${it.songCount || 0} 首`
      : "";
    return html`
      <div class="bitem">
        <div class="bthumb" style="cursor:pointer" title="播放整个${this._collLabel(it)}" @click=${() => this._browserPlayCollection(it)}>
          ${cover ? html`<img src="${cover}" alt="" />` : html`<span class="bnocover">♪</span>`}
        </div>
        <div class="bmeta" style="cursor:pointer;flex:1;min-width:0" title="进入查看" @click=${() => this._browserItemClick(it)}>
          <div class="bt">${it.name}</div>
          <div class="ba">${sub}</div>
        </div>
        <button class="mini" title="进入查看" @click=${() => this._browserItemClick(it)}>›</button>
      </div>`;
  }

  _renderMediaBrowser() {
    const stack = this._ui.browserStack;
    const level = stack[stack.length - 1];
    if (!level) return html``;
    const q = (level.query || "").trim().toLowerCase();
    let items = level.items || [];
    if (q && (level.type === "playlists" || level.type === "genres" || level.type === "starred")) {
      items = level.type === "starred"
        ? items.filter((s) => (s.title || "").toLowerCase().includes(q))
        : items.filter((s) => (s.name || "").toLowerCase().includes(q));
    }
    const showSearch = ["playlists", "albums", "artists", "genres", "starred"].includes(level.type);
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
                ${items.map((c) => html`<button class="cat" @click=${() => this._browserItemClick(c)}>${c.name}</button>`)}
              </div>
            ` : ""}
            ${!level.loading && level.type !== "root" ? html`
              ${items.length === 0 ? html`<div class="empty">无内容</div>` : ""}
              ${items.map((it) => this._renderBrowserItem(it))}
            ` : ""}
          </div>
        </div>
      </div>
    `;
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
      .wrap { position: relative; z-index: 1; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
      .conn { font-size: 11px; padding: 2px 9px; border-radius: 10px; white-space: nowrap; }
      .conn.on { color: #9fe07c; background: rgba(107, 171, 69, 0.18); }
      .conn.off { color: rgba(255, 255, 255, 0.5); background: rgba(255, 255, 255, 0.08); }
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
      .now { display: flex; gap: 12px; align-items: center; justify-content: space-between; }
      .cover { width: 84px; height: 84px; border-radius: 12px; overflow: hidden; flex: 0 0 auto;
        background: rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35); }
      .cover img { width: 100%; height: 100%; object-fit: cover; }
      .nocover { font-size: 30px; color: rgba(255, 255, 255, 0.3); }
      .meta { flex: 1; min-width: 0; }
      .track { font-weight: 600; font-size: 16px; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .artist { font-size: 13px; color: rgba(255, 255, 255, 0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
      .progress-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
      .progress-row .t { font-size: 11px; color: rgba(255, 255, 255, 0.5); width: 34px; text-align: center; font-variant-numeric: tabular-nums; }
      .seek { flex: 1; }
      .seek, .vol { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 3px;
        background: rgba(255, 255, 255, 0.18); outline: none; cursor: pointer; }
      .seek::-webkit-slider-thumb, .vol::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
        width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 2px solid #f62c55;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4); cursor: pointer; transition: transform 0.15s ease; }
      .seek:hover::-webkit-slider-thumb, .vol:hover::-webkit-slider-thumb { transform: scale(1.2); }
      .seek::-moz-range-track, .vol::-moz-range-track { height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.18); }
      .seek::-moz-range-progress, .vol::-moz-range-progress { height: 6px; border-radius: 3px; background: #f62c55; }
      .seek::-moz-range-thumb, .vol::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%;
        background: #fff; border: 2px solid #f62c55; }
      .controls { display: flex; justify-content: center; align-items: center; gap: 14px; }
      .ctl { border: none; background: transparent; color: rgba(255, 255, 255, 0.85); cursor: pointer; font-size: 19px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 42px; height: 42px; padding: 0; border-radius: 50%;
        transition: background 0.2s, box-shadow 0.2s, transform 0.12s, color 0.2s; }
      .ctl small { font-size: 9px; color: rgba(255, 255, 255, 0.45); margin-top: 1px; }
      .ctl:hover { background: rgba(255, 255, 255, 0.10); box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .ctl:active { transform: scale(0.92); }
      .ctl.play { width: 54px; height: 54px; font-size: 22px; background: #f62c55; color: #fff;
        box-shadow: 0 4px 16px rgba(246, 44, 85, 0.4); }
      .ctl.play:hover { background: #e63954; box-shadow: 0 6px 22px rgba(246, 44, 85, 0.55); transform: scale(1.06); }
      .ctl.play:active { transform: scale(0.94); }
      .ctl.like.on { color: #f62c55; }
      .vol-row { display: flex; align-items: center; gap: 10px; }
      .vbtn { border: none; background: transparent; color: rgba(255, 255, 255, 0.75); font-size: 16px; cursor: pointer;
        width: 34px; height: 34px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        transition: background 0.2s, box-shadow 0.2s, transform 0.12s; }
      .vbtn:hover { background: rgba(255, 255, 255, 0.10); box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .vbtn:active { transform: scale(0.92); }
      .vol { flex: 1; }
      .vpct { font-size: 11px; color: rgba(255, 255, 255, 0.5); width: 36px; text-align: right; font-variant-numeric: tabular-nums; }
      .actions { display: flex; gap: 8px; }
      .act { flex: 1; border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.85);
        border-radius: 10px; padding: 8px 4px; font-size: 12px; cursor: pointer;
        transition: background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.12s; }
      .act:hover { background: rgba(255, 255, 255, 0.10); box-shadow: 0 0 0 2px rgba(246, 44, 85, 0.42); }
      .act:active { transform: scale(0.96); }
      .act.active { background: #f62c55; border-color: #f62c55; color: #fff; box-shadow: 0 4px 14px rgba(246, 44, 85, 0.35); }
      .panel { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 10px; }
      .panel-head { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
      .empty { color: rgba(255, 255, 255, 0.45); font-size: 13px; padding: 10px 0; text-align: center; }
      .lyrics { max-height: 220px; overflow-y: auto; text-align: center; }
      .lyr { padding: 4px 0; color: rgba(255, 255, 255, 0.5); font-size: 13px; transition: color 0.2s; }
      .lyr.active { color: #f62c55; font-weight: 600; }
      .qlist, .slist, .plist { max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
      .qlist::-webkit-scrollbar, .slist::-webkit-scrollbar, .plist::-webkit-scrollbar,
      .br-list::-webkit-scrollbar, .lyrics::-webkit-scrollbar { width: 6px; }
      .qlist::-webkit-scrollbar-thumb, .slist::-webkit-scrollbar-thumb, .plist::-webkit-scrollbar-thumb,
      .br-list::-webkit-scrollbar-thumb, .lyrics::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 3px; }
      .qlist::-webkit-scrollbar-thumb:hover, .slist::-webkit-scrollbar-thumb:hover, .plist::-webkit-scrollbar-thumb:hover,
      .br-list::-webkit-scrollbar-thumb:hover, .lyrics::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.28); }
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
      .mini:active { transform: scale(0.94); }
      .search-input { flex: 1; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px;
        padding: 7px 10px; background: rgba(0, 0, 0, 0.3); color: #fff; outline: none;
        transition: border-color 0.2s, box-shadow 0.2s; }
      .search-input::placeholder { color: rgba(255, 255, 255, 0.35); }
      .search-input:focus { border-color: #f62c55; box-shadow: 0 0 0 1px #f62c55; }
      .pitem { padding: 9px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; transition: background 0.15s; }
      .pitem:hover { background: rgba(255, 255, 255, 0.08); }
      .overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 999; }
      .picker { background: #1f1c2a; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); border-radius: 16px; padding: 14px; width: 300px; max-height: 70vh; overflow-y: auto; }
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
