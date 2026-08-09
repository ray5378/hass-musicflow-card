// MusicFlow Remote Card — a Lovelace card that acts as a full external
// controller for a MusicFlow server. It connects directly to the backend's
// real-time /ws channel + REST API (via the `musicflow/backend_config` HA WS
// command), so it is an equal peer to the Web/App clients: any action taken
// here is reflected everywhere via the same WS, and vice-versa.
//
// Replaces the generic YAMP-based card; this one targets MusicFlow's own
// surface (peers as outputs, native queue/lyrics/playlists/star).
import { LitElement, html, css } from "lit";
import { BackendClient, childToQueueItem, parseLyrics } from "./backend-client.js";

const PLAY_MODES = ["order", "one", "all", "shuffle"];
const PLAY_MODE_LABEL = { order: "顺序", one: "单曲", all: "循环", shuffle: "随机" };

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
      song: null, // {songId,title,artist,album,coverArt,duration}
      lyrics: [],
      currentLyric: "",
      liked: false,
      // panels
      showLyrics: false,
      showQueue: false,
      showSearch: false,
      showPlaylistPicker: false,
      searchQuery: "",
      searchResults: [],
      playlists: [],
      pickerSongId: null,
    };
    this._tickTimer = null;
    this._pollTimer = null;
    this._heartbeatTimer = null;
  }

  connectedCallback() {
    super.connectedCallback();
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

  // hass is assigned by Lovelace; bootstrap on first assignment.
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
      this._ui.error = e.message || String(e);
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
  _applyPeerSnapshot(peers) {
    const list = (peers || []).slice();
    this._ui.peers = list;
    if (!this._ui.currentPeerId) {
      const first = list.find((p) => p.available) || list[0];
      if (first) this._selectPeer(first.peerId, true);
    } else {
      this._refreshCurrentPeerView();
    }
    this.requestUpdate();
  }
  _upsertPeer(peer) {
    if (!peer) return;
    const idx = this._ui.peers.findIndex((p) => p.peerId === peer.peerId);
    if (idx >= 0) this._ui.peers[idx] = { ...this._ui.peers[idx], ...peer };
    else this._ui.peers.push(peer);
    this.requestUpdate();
  }
  _applyPeerQueue(peerId, queue) {
    if (peerId === this._ui.currentPeerId) this._applyQueue(queue);
    // also mirror into peers list for the switcher
    const idx = this._ui.peers.findIndex((p) => p.peerId === peerId);
    if (idx >= 0) this._ui.peers[idx] = { ...this._ui.peers[idx], queue };
    this.requestUpdate();
  }
  _applyDeviceQueue(deviceId, queue) {
    // device_id is the bare id; match dlna:<id> or group:<id>
    for (const kind of ["dlna:", "group:"]) {
      if (this._ui.currentPeerId === kind + deviceId) { this._applyQueue(queue); break; }
    }
    const idx = this._ui.peers.findIndex((p) => p.peerId === `dlna:${deviceId}` || p.peerId === `group:${deviceId}`);
    if (idx >= 0) this._ui.peers[idx] = { ...this._ui.peers[idx], queue };
    this.requestUpdate();
  }
  _applyQueue(queue) {
    if (!queue) return;
    if (Array.isArray(queue.items)) this._ui.queue = queue.items.map((it) => ({
      songId: it.songId, title: it.title, artist: it.artist || "", album: it.album || "",
      coverArt: it.coverArt, duration: it.duration || 0,
    }));
    if (typeof queue.currentIndex === "number") this._ui.currentIndex = queue.currentIndex;
    if (typeof queue.playMode === "string") this._ui.playMode = queue.playMode;
    this._syncCurrentSong();
  }
  _applyDeviceState(deviceId, state) {
    const id = `dlna:${deviceId}`;
    const gid = `group:${deviceId}`;
    if (this._ui.currentPeerId !== id && this._ui.currentPeerId !== gid) return;
    if (!state) return;
    this._ui.isPlaying = state.state === "PLAYING";
    if (typeof state.position === "number") this._ui.currentTime = state.position;
    if (typeof state.duration === "number" && state.duration > 0) this._ui.duration = state.duration;
    if (typeof state.volume === "number") this._ui.volume = Math.max(0, Math.min(100, state.volume)) / 100;
    if (typeof state.muted === "boolean") this._ui.muted = state.muted;
    this._updateLyric();
    this.requestUpdate();
  }
  _applyDeviceMedia(deviceId, media) {
    const id = `dlna:${deviceId}`;
    const gid = `group:${deviceId}`;
    if (this._ui.currentPeerId !== id && this._ui.currentPeerId !== gid) return;
    this._setMedia(media);
  }
  _setMedia(media) {
    if (!media) return;
    const song = {
      songId: media.songId, title: media.title || "未知", artist: media.artist || "",
      album: media.album || "", coverArt: media.coverArt, duration: media.duration || 0,
    };
    const changed = song.songId !== this._ui.song?.songId;
    this._ui.song = song;
    if (changed) {
      this._ui.lyrics = [];
      this._ui.currentLyric = "";
      this._ui.currentTime = 0;
      if (song.songId) {
        this._client.scrobble(song.songId);
        this._loadLyrics(song.songId);
        this._loadLiked(song.songId);
      }
    }
    this._syncCurrentSong();
    this.requestUpdate();
  }
  _syncCurrentSong() {
    const idx = this._ui.currentIndex;
    const q = this._ui.queue;
    if (idx >= 0 && idx < q.length) {
      const it = q[idx];
      if (!this._ui.song || this._ui.song.songId !== it.songId) {
        this._ui.song = {
          songId: it.songId, title: it.title, artist: it.artist, album: it.album,
          coverArt: it.coverArt, duration: it.duration,
        };
        if (it.songId) { this._client.scrobble(it.songId); this._loadLyrics(it.songId); this._loadLiked(it.songId); }
      }
    }
  }
  _refreshPeers() {
    this._client.getPeers().then((res) => {
      const peers = res?.peers || [];
      if (peers.length) { this._ui.peers = peers; this.requestUpdate(); }
    }).catch(() => {});
  }
  _refreshCurrentPeerView() {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    this._client.getQueue(pid).then((snap) => this._applyQueue(snap)).catch(() => {});
    this._client.getStatus(pid).then((s) => {
      if (!s) return;
      this._ui.isPlaying = s.state === "PLAYING";
      if (typeof s.position === "number") this._ui.currentTime = s.position;
      if (typeof s.duration === "number" && s.duration > 0) this._ui.duration = s.duration;
      if (typeof s.volume === "number") this._ui.volume = Math.max(0, Math.min(100, s.volume)) / 100;
      if (s.media) this._setMedia(s.media);
      this.requestUpdate();
    }).catch(() => {});
  }

  _selectPeer(peerId, silent) {
    if (peerId === this._ui.currentPeerId) return;
    this._ui.currentPeerId = peerId;
    this._stopTracking();
    this._ui.queue = []; this._ui.currentIndex = -1; this._ui.song = null;
    this._ui.lyrics = []; this._ui.currentLyric = ""; this._ui.currentTime = 0; this._ui.duration = 0;
    this._refreshCurrentPeerView();
    if (!silent) this._startTracking();
    else this._startTracking();
    this.requestUpdate();
  }

  // ============ Real-time progress tracking for the active peer ============
  _startTracking() {
    this._stopTracking();
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    // Poll /status every 2s for ground-truth position/volume/media.
    this._pollTimer = setInterval(async () => {
      try {
        const s = await this._client.getStatus(pid);
        if (!s) return;
        this._ui.isPlaying = s.state === "PLAYING";
        if (typeof s.position === "number") this._ui.currentTime = s.position;
        if (typeof s.duration === "number" && s.duration > 0) this._ui.duration = s.duration;
        if (typeof s.volume === "number") this._ui.volume = Math.max(0, Math.min(100, s.volume)) / 100;
        if (s.media) this._setMedia(s.media);
        this.requestUpdate();
      } catch {}
    }, 2000);
    // Smooth 250ms interpolation so the bar moves between polls.
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
    // Heartbeat keeps any local peer alive; harmless for dlna/group peers.
    this._heartbeatTimer = setInterval(() => {
      const pid = this._ui.currentPeerId;
      if (pid && pid.startsWith("local:")) this._client.heartbeat(pid).catch(() => {});
    }, 30000);
  }

  // ============ Controls ============
  _togglePlay() {
    const pid = this._ui.currentPeerId; if (!pid) return;
    if (this._ui.isPlaying) { this._client.pause(pid); this._ui.isPlaying = false; }
    else { this._client.play(pid); this._ui.isPlaying = true; }
    this.requestUpdate();
  }
  _next() { const pid = this._ui.currentPeerId; if (pid) this._client.next(pid).catch(() => {}); }
  _prev() {
    const pid = this._ui.currentPeerId; if (!pid) return;
    if (this._ui.currentTime > 3) { this._client.seek(pid, 0); this._ui.currentTime = 0; }
    else this._client.prev(pid).catch(() => {});
  }
  _stop() { const pid = this._ui.currentPeerId; if (pid) this._client.stop(pid).catch(() => {}); }
  _cyclePlayMode() {
    const pid = this._ui.currentPeerId; if (!pid) return;
    const next = PLAY_MODES[(PLAY_MODES.indexOf(this._ui.playMode) + 1) % PLAY_MODES.length];
    this._ui.playMode = next;
    this._client.setPlayMode(pid, next).catch(() => {});
    this.requestUpdate();
  }
  _setVolume(e) {
    const v = Number(e.target.value) / 100;
    this._ui.volume = v;
    const pid = this._ui.currentPeerId;
    if (pid) this._client.setVolume(pid, v).catch(() => {});
    this.requestUpdate();
  }
  _toggleMute() {
    const pid = this._ui.currentPeerId; if (!pid) return;
    this._ui.muted = !this._ui.muted;
    this._client.setMute(pid, this._ui.muted).catch(() => {});
    this.requestUpdate();
  }
  _seek(e) {
    const pid = this._ui.currentPeerId; if (!pid) return;
    const pct = Number(e.target.value);
    const t = (pct / 100) * (this._ui.duration || 0);
    this._ui.currentTime = t;
    this._client.seek(pid, t).catch(() => {});
    this._updateLyric();
    this.requestUpdate();
  }

  // ============ Lyrics ============
  async _loadLyrics(songId) {
    try {
      const res = await this._client.getLyrics(songId);
      this._ui.lyrics = parseLyrics(res);
      this._updateLyric();
    } catch { this._ui.lyrics = []; }
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
      const ids = new Set((res?.song || []).map((s) => s.id));
      this._ui.liked = ids.has(songId);
      this.requestUpdate();
    } catch { this._ui.liked = false; }
  }
  _toggleLike() {
    const song = this._ui.song; if (!song?.songId) return;
    if (this._ui.liked) this._client.unstar(song.songId).catch(() => {});
    else this._client.star(song.songId).catch(() => {});
    this._ui.liked = !this._ui.liked;
    this.requestUpdate();
  }

  // ============ Queue ============
  _removeFromQueue(index) {
    const pid = this._ui.currentPeerId; if (!pid) return;
    this._client.removeAt(pid, index).catch(() => {});
  }
  _clearQueue() {
    const pid = this._ui.currentPeerId; if (!pid) return;
    this._client.clearQueue(pid).catch(() => {});
  }
  _jumpTo(index) {
    const pid = this._ui.currentPeerId; if (!pid) return;
    this._ui.currentIndex = index;
    this._client.setQueueIndex(pid, index).catch(() => {});
    this.requestUpdate();
  }
  _reorder(from, to) {
    const pid = this._ui.currentPeerId; if (!pid) return;
    const items = this._ui.queue.slice();
    if (from < 0 || from >= items.length || to < 0 || to >= items.length) return;
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    // Recompute the active index so the currently-playing track stays "current".
    const playingId = this._ui.song?.songId;
    let newIndex = items.findIndex((it) => it.songId === playingId);
    if (newIndex < 0) newIndex = Math.max(0, Math.min(to, items.length - 1));
    this._ui.queue = items;
    this._ui.currentIndex = newIndex;
    this._client.playQueue(pid, items.map(childToQueueItem), newIndex).catch(() => {});
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
        songId: s.id, title: s.title, artist: s.artist || "", album: s.album || "",
        coverArt: s.coverArt, duration: s.duration || 0,
      }));
    } catch { this._ui.searchResults = []; }
    this.requestUpdate();
  }
  _searchPlay(song) {
    const pid = this._ui.currentPeerId; if (!pid) return;
    this._client.playQueue(pid, [childToQueueItem(song)], 0).catch(() => {});
  }
  _searchEnqueue(song) {
    const pid = this._ui.currentPeerId; if (!pid) return;
    this._client.enqueue(pid, [childToQueueItem(song)]).catch(() => {});
  }

  // ============ Add to playlist ============
  async _loadPlaylists() {
    try {
      const res = await this._client.getPlaylists();
      const list = res?.playlists?.playlist || res?.playlists || [];
      this._ui.playlists = list
        .filter((p) => p && p.id != null)
        .map((p) => ({ id: String(p.id), name: p.name || "未命名歌单" }));
    } catch { this._ui.playlists = []; }
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
    this._client.updatePlaylist(playlistId, { songIdsToAdd: [songId] }).catch(() => {});
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

    return html`
      <ha-card>
        <div class="wrap">
          <div class="topbar">
            <span class="title">MusicFlow</span>
            <span class="conn ${u.connected ? "on" : "off"}">${u.connected ? "已连接" : "未连接"}</span>
          </div>

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
                  @input=${this._seek} />
                <span class="t">${this._fmtTime(u.duration)}</span>
              </div>
            </div>
          </div>

          <div class="controls">
            <button class="ctl" title="随机" @click=${this._cyclePlayMode}>🔀<small>${PLAY_MODE_LABEL[u.playMode]}</small></button>
            <button class="ctl" title="上一首" @click=${this._prev}>⏮</button>
            <button class="ctl play" title="播放/暂停" @click=${this._togglePlay}>${u.isPlaying ? "⏸" : "▶"}</button>
            <button class="ctl" title="下一首" @click=${this._next}>⏭</button>
            <button class="ctl" title="停止并清空" @click=${this._stop}>⏹</button>
            <button class="ctl" title="静音" @click=${this._toggleMute}>${u.muted ? "🔇" : "🔈"}</button>
          </div>

          <div class="vol-row">
            <span>音量</span>
            <input class="vol" type="range" min="0" max="100" value="${Math.round(u.volume * 100)}"
              @input=${this._setVolume} />
          </div>

          <div class="actions">
            <button class="act ${u.showLyrics ? "active" : ""}" @click=${() => { u.showLyrics = !u.showLyrics; u.showQueue = false; u.showSearch = false; this.requestUpdate(); }}>歌词</button>
            <button class="act ${u.showQueue ? "active" : ""}" @click=${() => { u.showQueue = !u.showQueue; u.showLyrics = false; u.showSearch = false; this.requestUpdate(); }}>队列</button>
            <button class="act ${u.showSearch ? "active" : ""}" @click=${() => { u.showSearch = !u.showSearch; u.showLyrics = false; u.showQueue = false; this.requestUpdate(); }}>搜索</button>
            <button class="act like ${u.liked ? "on" : ""}" @click=${this._toggleLike}>${u.liked ? "♥ 已喜欢" : "♡ 喜欢"}</button>
          </div>

          ${u.showLyrics ? this._renderLyrics() : ""}
          ${u.showQueue ? this._renderQueue() : ""}
          ${u.showSearch ? this._renderSearch() : ""}
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

  static get styles() {
    return css`
      :host { display: block; }
      ha-card { background: var(--card-background-color, #fff); color: var(--primary-text-color, #333); }
      .wrap { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
      .topbar { display: flex; justify-content: space-between; align-items: center; }
      .title { font-weight: 600; font-size: 15px; }
      .conn { font-size: 12px; padding: 1px 8px; border-radius: 10px; }
      .conn.on { color: #fff; background: #2e9e5b; }
      .conn.off { color: #999; background: #eee; }
      .err { color: #c33; padding: 12px; }
      .outputs { display: flex; flex-wrap: wrap; gap: 6px; }
      .out { border: 1px solid var(--divider-color, #ddd); background: transparent; color: inherit;
        border-radius: 14px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
      .out.active { background: var(--primary-color, #03a9f4); color: #fff; border-color: transparent; }
      .out.off { opacity: 0.5; }
      .hint { color: #999; font-size: 12px; }
      .now { display: flex; gap: 12px; align-items: center; }
      .cover { width: 72px; height: 72px; border-radius: 8px; overflow: hidden; flex: 0 0 auto;
        background: var(--secondary-background-color, #f0f0f0); display: flex; align-items: center; justify-content: center; }
      .cover img { width: 100%; height: 100%; object-fit: cover; }
      .nocover { font-size: 28px; color: #bbb; }
      .meta { flex: 1; min-width: 0; }
      .track { font-weight: 600; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .artist { font-size: 13px; color: var(--secondary-text-color, #777); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .progress-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
      .progress-row .t { font-size: 11px; color: #999; width: 34px; text-align: center; }
      .seek { flex: 1; }
      .controls { display: flex; justify-content: space-between; align-items: center; gap: 4px; }
      .ctl { border: none; background: transparent; color: inherit; cursor: pointer; font-size: 20px;
        display: flex; flex-direction: column; align-items: center; padding: 4px 6px; border-radius: 8px; }
      .ctl small { font-size: 9px; color: #999; }
      .ctl.play { font-size: 26px; color: var(--primary-color, #03a9f4); }
      .vol-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #777; }
      .vol { flex: 1; }
      .actions { display: flex; gap: 6px; }
      .act { flex: 1; border: 1px solid var(--divider-color, #ddd); background: transparent; color: inherit;
        border-radius: 8px; padding: 6px 4px; font-size: 12px; cursor: pointer; }
      .act.active { background: var(--primary-color, #03a9f4); color: #fff; border-color: transparent; }
      .act.like.on { color: #e9573f; }
      .panel { border-top: 1px solid var(--divider-color, #eee); padding-top: 8px; }
      .panel-head { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
      .empty { color: #999; font-size: 13px; padding: 8px 0; }
      .lyrics { max-height: 200px; overflow-y: auto; text-align: center; }
      .lyr { padding: 3px 0; color: #999; font-size: 13px; }
      .lyr.active { color: var(--primary-color, #03a9f4); font-weight: 600; }
      .qlist, .slist, .plist { max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
      .qitem, .sitem { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border-radius: 6px; }
      .qitem.cur { background: var(--secondary-background-color, #f5f5f5); }
      .qitem .idx { width: 18px; color: #999; font-size: 12px; }
      .qitem .qt, .sitem .st { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; }
      .qitem .qa, .sitem .sa { width: 90px; color: #999; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mini { border: 1px solid var(--divider-color, #ddd); background: transparent; color: inherit;
        border-radius: 6px; padding: 2px 6px; font-size: 12px; cursor: pointer; }
      .search-input { flex: 1; border: 1px solid var(--divider-color, #ddd); border-radius: 6px;
        padding: 6px 8px; background: var(--card-background-color, #fff); color: inherit; }
      .pitem { padding: 8px; border-radius: 6px; cursor: pointer; font-size: 13px; }
      .pitem:hover { background: var(--secondary-background-color, #f5f5f5); }
      .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 999; }
      .picker { background: var(--card-background-color, #fff); color: var(--primary-text-color, #333);
        border-radius: 12px; padding: 12px; width: 280px; max-height: 70vh; overflow-y: auto; }
    `;
  }
}

customElements.define("hass-musicflow-card", MusicFlowRemoteCard);

// Lovelace card registration helpers.
window.customCards = window.customCards || [];
window.customCards.push({
  type: "hass-musicflow-card",
  name: "MusicFlow Remote Card",
  description: "MusicFlow 服务器的外部控制器:实时同步播放/队列/歌词/歌单/喜欢。",
});
