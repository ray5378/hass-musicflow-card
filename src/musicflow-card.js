import { LitElement, html, css, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";

/* ==================== SVG icons (inline, no HA asset deps) ==================== */
const ICONS = {
  play: "M8 5v14l11-7z",
  pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  next: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
  prev: "M18 18L9.5 12 18 6v12zM6 6v12h2V6H6z",
  power: "M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42A6.92 6.92 0 0 1 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.18 1-4.12 2.59-5.41L6.17 5.17A8.932 8.932 0 0 0 3 12a9 9 0 1 0 18 0c0-2.83-1.31-5.34-3.17-7.83z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  heart_outline: "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z",
  playlist_add: "M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z",
  library: "M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H4V4h16v16zm-2-12H6v-2h12v2zm0 4H6v-2h12v2zm0 4H6v-2h12v2z",
  shuffle: "M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
  repeat: "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",
  repeat_one: "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z",
  volume: "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
  volume_off: "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z",
  swap: "M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z",
  swap_horiz: "M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z",
  swap_vert: "M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z",
  cast: "M3.27 1L1 3.27 4.73 7H1v4h5.73L3 14.73V18h3.27L9.45 21l1.41-1.41L5.27 14.18l5.46-5.46 6.09 6.09L21 18.55V22h-3.45l-3.18 3.18L21 21.91V1L3.27 1zM3 21v-3h3v3H3zm9.5-9.5L9.45 14.55 12 17.09l3.5-3.5L12 10l-.5 1.5zM21 19.09L17.91 16 21 12.91v6.18z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  expand_more: "M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z",
  expand_less: "M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z",
  music_off: "M14 7V3.41L11.59 1H4v2h5.59L0 12.59 1.41 14 4 11.41V20h2v-7.59l4 4V20l6-6v-3.59l4.59 4.59L22 13l-8-8z",
  music: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
};
const icon = (name, size = 22) => html`
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="${ICONS[name]}" fill="currentColor" />
  </svg>
`;

/* HA 原生媒体播放器集成域名(用于在 hass.entities 里筛 MusicFlow 实体) */
const MF_DOMAIN = "musicflow";

/* ==================== Card ==================== */
class MusicFlowPlayerCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      // 运行态:当前控制的目标实体(初始 = config.entity,可被播放器切换器改写)
      _activeEntity: { type: String },
      _showPlayerPicker: { type: Boolean },
      _showLyrics: { type: Boolean },
      _showAddToPlaylist: { type: Boolean },
      _playlists: { type: Array },
      _lyrics: { type: Array },
      _lyricIndex: { type: Number },
      _seekPos: { type: Number },
      _seeking: { type: Boolean },
      _tick: { type: Number },
    };
  }

  static styles = css`
    :host {
      display: block;
      font-family: var(--primary-font-family, inherit);
      color: var(--primary-text-color);
    }
    /* HA 原生 media-player 卡片的整体外观 */
    .card {
      background: var(--ha-card-background, var(--card-background-color, #fff));
      border-radius: var(--ha-card-border-radius, 12px);
      box-shadow: var(--ha-card-box-shadow, none);
      padding: 12px;
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto auto auto;
      gap: 8px 12px;
      align-items: center;
    }
    .top {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .icon-badge {
      flex-shrink: 0;
      color: var(--primary-color);
      display: inline-flex;
      align-items: center;
    }
    .device-name {
      flex: 1;
      min-width: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .picker-toggle {
      background: none;
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      color: var(--secondary-text-color);
      border-radius: 999px;
      padding: 2px 8px;
      cursor: pointer;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      max-width: 38%;
      min-width: 0;
    }
    .picker-toggle span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    .picker-toggle:hover {
      color: var(--primary-color);
      border-color: var(--primary-color);
    }
    .picker-toggle.is-current {
      color: var(--primary-color);
      border-color: var(--primary-color);
    }
    .picker {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: var(--ha-card-background, #fff);
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
      padding: 4px;
      min-width: 220px;
      max-width: 280px;
      max-height: 280px;
      overflow-y: auto;
      z-index: 9;
    }
    .picker-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }
    .picker-item:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    }
    .picker-item.active {
      color: var(--primary-color);
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    }
    .picker-item.offline {
      opacity: 0.55;
    }
    .picker-item-icon {
      color: var(--secondary-text-color);
      flex-shrink: 0;
    }
    .picker-item-info {
      flex: 1;
      min-width: 0;
    }
    .picker-item-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .picker-item-meta {
      font-size: 11px;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .picker-wrap {
      position: relative;
      flex-shrink: 0;
    }

    /* 主信息区(标题/艺术家/歌词) */
    .info {
      grid-column: 1 / 2;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .title {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .secondary {
      font-size: 13px;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .lyric-line {
      font-size: 13px;
      color: var(--secondary-text-color);
      font-style: italic;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .lyric-line.active {
      color: var(--primary-color);
      font-weight: 600;
      font-style: normal;
    }
    .lyric-toggle {
      background: none;
      border: none;
      color: var(--secondary-text-color);
      cursor: pointer;
      padding: 0;
      margin-top: 4px;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    .lyric-toggle:hover { color: var(--primary-color); }

    /* 大封面 */
    .art {
      grid-column: 2 / 3;
      grid-row: 2 / 4;
      width: 120px;
      height: 120px;
      border-radius: 12px;
      background: var(--secondary-background-color, #eee);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--disabled-text-color);
      flex-shrink: 0;
      overflow: hidden;
    }
    .art img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* 增强按钮行(喜欢 / 加歌单 / 浏览媒体库) */
    .actions {
      grid-column: 1 / 2;
      display: flex;
      gap: 4px;
      margin-top: 4px;
    }
    .action {
      background: none;
      border: none;
      color: var(--secondary-text-color);
      cursor: pointer;
      padding: 6px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .action:hover {
      color: var(--primary-color);
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    }
    .action.on { color: var(--primary-color); }
    .action:disabled { opacity: 0.35; cursor: default; }

    /* 进度条 */
    .progress {
      grid-column: 1 / 2;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--secondary-text-color);
    }
    .progress input[type="range"] {
      flex: 1;
      accent-color: var(--primary-color);
    }

    /* 控制行:上一首/播放/下一首/模式/音量/电源 */
    .controls {
      grid-column: 1 / 2;
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .controls input[type="range"] {
      width: 60px;
      accent-color: var(--primary-color);
    }
    .mute-toggle.on { color: var(--primary-color); }

    /* 歌词滚动面板 */
    .lyrics-panel {
      grid-column: 1 / -1;
      max-height: 200px;
      overflow-y: auto;
      border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      padding-top: 6px;
      scroll-behavior: smooth;
    }
    .lyrics-panel .line {
      padding: 3px 4px;
      border-radius: 4px;
      font-size: 14px;
      color: var(--secondary-text-color);
    }
    .lyrics-panel .line.active {
      color: var(--primary-text-color);
      background: var(--primary-color);
      font-weight: 600;
    }
    .lyrics-panel .line.blank {
      opacity: 0.4;
      font-style: italic;
    }
    .lyrics-panel .empty {
      text-align: center;
      color: var(--disabled-text-color);
      font-size: 13px;
      padding: 12px 0;
    }

    /* 加歌单下拉 */
    .playlist-picker {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
    }
    .playlist-picker select {
      flex: 1;
      background: var(--input-background-color, var(--secondary-background-color));
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 13px;
    }

    .empty {
      grid-column: 1 / -1;
      text-align: center;
      color: var(--disabled-text-color);
      padding: 12px 0;
    }
  `;

  constructor() {
    super();
    this._activeEntity = "";
    this._showPlayerPicker = false;
    this._showLyrics = false;
    this._showAddToPlaylist = false;
    this._playlists = null;
    this._lyrics = null;
    this._lyricIndex = -1;
    this._seekPos = null;
    this._seeking = false;
    this._tick = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    this._ticker = setInterval(() => this._tick++, 1000);
    document.addEventListener("click", this._closePickerOnOutsideClick, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._ticker) clearInterval(this._ticker);
    document.removeEventListener("click", this._closePickerOnOutsideClick, true);
  }

  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error("请配置 MusicFlow 播放器实体 (entity)");
    }
    this.config = {
      show_artwork: true,
      show_lyrics: true,
      ...config,
    };
    if (!this._activeEntity || !this._isMusicFlowEntity(config.entity)) {
      this._activeEntity = config.entity;
    }
  }

  /* ==================== 计算属性 / helpers ==================== */
  get _entity() {
    return this.hass?.states?.[this._activeEntity];
  }

  get _attr() {
    return this._entity?.attributes || {};
  }

  get _state() {
    return this._entity?.state;
  }

  get _playing() {
    return this._state === "playing";
  }

  get _on() {
    return this._state !== "off" && this._state !== "unavailable";
  }

  get _position() {
    if (this._seeking && this._seekPos != null) return this._seekPos;
    return Number(this._attr.media_position || 0);
  }

  get _duration() {
    return Number(this._attr.media_duration || 0);
  }

  get _volume() {
    return Number(this._attr.volume_level || 0);
  }

  get _liked() {
    return Boolean(this._attr.liked);
  }

  get _songId() {
    return this._attr.song_id || null;
  }

  get _peers() {
    /* 所有 MusicFlow 媒体播放器实体(集成侧已经镜像每个 peer) */
    if (!this.hass?.states) return [];
    const out = [];
    for (const [entityId, s] of Object.entries(this.hass.states)) {
      if (!entityId.startsWith("media_player.")) continue;
      const entry = this.hass.entities?.[entityId];
      if (!entry || entry.platform !== MF_DOMAIN) continue;
      out.push({ entityId, state: s, available: s.state !== "unavailable" });
    }
    return out;
  }

  _isMusicFlowEntity(entityId) {
    return this.hass?.entities?.[entityId]?.platform === MF_DOMAIN;
  }

  _peerLabel(p) {
    return p.state.attributes?.friendly_name || p.entityId;
  }

  _peerMeta(p) {
    const attr = p.state.attributes || {};
    const items = attr.queue_size ?? 0;
    const pos = attr.queue_position;
    const isActive = attr.play_mode && attr.queue_size > 0 && pos != null && pos >= 0;
    const title = attr.media_title;
    if (isActive && title) return `${items} 首 · ${title}`;
    if (isActive) return `${items} 首 · 播放中`;
    if (items > 0) return `${items} 首 · 空闲`;
    return "空闲";
  }

  _fmt(sec) {
    if (!isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  _closePickerOnOutsideClick = (ev) => {
    if (!this._showPlayerPicker) return;
    const path = ev.composedPath ? ev.composedPath() : [];
    if (!path.includes(this)) this._showPlayerPicker = false;
  };

  /* ==================== 操作 ==================== */
  _service(domain, service, data = {}, target = {}) {
    this.hass.callService(domain, service, data, {
      entity_id: this._activeEntity,
      ...target,
    });
  }

  _togglePlay() {
    this._service("media_player", this._playing ? "media_pause" : "media_play");
  }

  _togglePower() {
    this._service("media_player", this._on ? "turn_off" : "turn_on");
  }

  _toggleLike() {
    this._service("musicflow", "like_track");
  }

  _toggleShuffle() {
    this._service("musicflow", "set_play_mode", {
      play_mode: this._attr.shuffle ? "order" : "shuffle",
    });
  }

  _cycleRepeat() {
    const cur = this._attr.play_mode;
    const next = cur === "one" ? "order" : cur === "all" ? "one" : "all";
    this._service("musicflow", "set_play_mode", { play_mode: next });
  }

  _setVolume(e) {
    this._service("media_player", "volume_set", {
      volume_level: Number(e.target.value),
    });
  }

  _toggleMute() {
    this._service("media_player", "volume_mute", {
      is_volume_muted: !this._attr.is_volume_muted,
    });
  }

  _seekStart(e) { this._seeking = true; this._seekPos = Number(e.target.value); }
  _seekInput(e) { this._seekPos = Number(e.target.value); }
  _seekEnd(e) {
    this._service("media_player", "media_seek", { seek_position: Number(e.target.value) });
    this._seekPos = null;
    this._seeking = false;
  }

  _switchPeer(newEntity) {
    if (!newEntity || newEntity === this._activeEntity) {
      this._showPlayerPicker = false;
      return;
    }
    // 主项目 switchPeer 是纯 UI 操作:只改控制目标,旧播放器的队列/状态不动。
    // HA 里每个 peer 已经是独立 media_player 实体,WS 实时推送各自状态,
    // 所以这里只切换 _activeEntity 即可,无需调用任何服务器接口。
    this._showPlayerPicker = false;
    this._showLyrics = false;
    this._lyrics = null;
    this._lyricIndex = -1;
    this._activeEntity = newEntity;
    this.requestUpdate();
  }

  _addToPlaylist(e) {
    const id = e.target.value;
    if (!id) return;
    this.hass.callService(
      "musicflow",
      "add_to_playlist",
      { playlist_id: id },
      { entity_id: this._activeEntity }
    );
    e.target.value = "";
    this._showAddToPlaylist = false;
  }

  async _loadPlaylists() {
    if (this._playlists) return;
    try {
      const res = await this.hass.callWS({
        type: "musicflow/playlists",
        entity_id: this._activeEntity,
      });
      this._playlists = res.playlists || [];
    } catch {
      this._playlists = [];
    }
  }

  _toggleAddToPlaylist() {
    this._showAddToPlaylist = !this._showAddToPlaylist;
    if (this._showAddToPlaylist) this._loadPlaylists();
  }

  _openMediaBrowser() {
    /* 复用 HA 原生 media_player 详情卡里的"浏览媒体"入口
     * (more-info 弹窗里有完整浏览树,比卡片自己造一遍更稳也更"原生") */
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId: this._activeEntity },
        bubbles: true,
        composed: true,
      })
    );
  }

  async _loadLyrics() {
    if (!this._songId) {
      this._lyrics = null;
      return;
    }
    try {
      const res = await this.hass.callWS({
        type: "musicflow/lyrics",
        entity_id: this._activeEntity,
        song_id: this._songId,
      });
      this._lyrics = res.lines || [];
    } catch {
      this._lyrics = [];
    }
  }

  _toggleLyrics() {
    this._showLyrics = !this._showLyrics;
    if (this._showLyrics) this._loadLyrics();
  }

  _updateLyricIndex() {
    const lines = this._lyrics;
    if (!lines || lines.length === 0) {
      this._lyricIndex = -1;
      return;
    }
    const pos = this._position * 1000;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (pos >= lines[i].start) idx = i;
      else break;
    }
    if (idx !== this._lyricIndex) this._lyricIndex = idx;
  }

  updated(changed) {
    /* 切歌时重新拉歌词 */
    if (changed.has("hass")) {
      const prev = changed.get("hass");
      const prevAttr = prev?.states?.[this._activeEntity]?.attributes || {};
      if (prevAttr.song_id !== this._songId) {
        this._lyrics = null;
        this._lyricIndex = -1;
        if (this._showLyrics) this._loadLyrics();
      }
    }
    this._updateLyricIndex();
    if (this._showLyrics && this._lyricIndex >= 0) {
      const box = this.shadowRoot?.querySelector(".lyrics-panel");
      const active = box?.querySelector(".line.active");
      if (active) {
        const target = active.offsetTop - box.clientHeight / 2 + active.clientHeight / 2;
        box.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
      }
    }
  }

  /* ==================== 渲染 ==================== */
  render() {
    if (!this.hass || !this._entity) {
      return html`<ha-card class="card"><div class="empty">未找到实体 ${this.config?.entity || ""}</div></ha-card>`;
    }
    const attr = this._attr;
    const pos = this._position;
    const dur = this._duration;
    const title = attr.media_title || (this._on ? "未在播放" : "已关闭");
    const artist = attr.media_artist || "";
    const showArtwork = this.config.show_artwork;
    const artwork = showArtwork ? attr.entity_picture : null;
    const playMode = attr.play_mode || "order";
    const repeatActive = playMode !== "order";
    const peers = this._peers;
    const currentPeerLabel = this._peerLabel({ entityId: this._activeEntity, state: this._entity });

    /* 紧凑模式的歌词显示:取当前行(或下一行)单行显示 */
    const compactLyric = this._lyrics && this._lyricIndex >= 0
      ? (this._lyrics[this._lyricIndex].value || "")
      : "";
    const showCompactLyric = this.config.show_lyrics && !this._showLyrics && this._playing && compactLyric;

    return html`
      <ha-card class="card" @click=${(ev) => {
        /* 点卡片空白处折叠歌词面板 */
        if (ev.target === ev.currentTarget) this._showLyrics = false;
      }}>
        <!-- 顶部:Wi-Fi-ish 图标 + 设备名 + 播放器切换器 -->
        <div class="top">
          <span class="icon-badge">${icon("cast", 18)}</span>
          <span class="device-name" title="${currentPeerLabel}">${currentPeerLabel}</span>
          <span class="picker-wrap">
            <button
              class="picker-toggle ${peers.find((p) => p.entityId === this._activeEntity)?.available ? "is-current" : ""}"
              @click=${(ev) => { ev.stopPropagation(); this._showPlayerPicker = !this._showPlayerPicker; }}
              title="切换播放器"
            >
              ${icon("swap_horiz", 14)}
              <span>切换</span>
            </button>
            ${this._showPlayerPicker ? html`
              <div class="picker" @click=${(ev) => ev.stopPropagation()}>
                ${peers.length === 0
                  ? html`<div class="empty">没有 MusicFlow 播放器</div>`
                  : peers.map((p) => html`
                      <div
                        class="picker-item ${classMap({
                          active: p.entityId === this._activeEntity,
                          offline: !p.available,
                        })}"
                        @click=${() => this._switchPeer(p.entityId)}
                      >
                        <span class="picker-item-icon">${icon(p.state.attributes?.icon ? "music" : "cast", 18)}</span>
                        <div class="picker-item-info">
                          <div class="picker-item-name">${this._peerLabel(p)}</div>
                          <div class="picker-item-meta">${this._peerMeta(p)}</div>
                        </div>
                        ${p.entityId === this._activeEntity ? icon("check", 18) : nothing}
                      </div>
                    `)}
              </div>
            ` : nothing}
          </span>
        </div>

        <!-- 主信息区(标题/艺术家 + 可选紧凑歌词) -->
        <div class="info">
          <div class="title">${title}</div>
          <div class="secondary">${artist}</div>
          ${showCompactLyric
            ? html`<div class="lyric-line">♪ ${compactLyric}</div>`
            : nothing}
          ${this.config.show_lyrics && this._lyrics
            ? html`<button class="lyric-toggle" @click=${() => this._toggleLyrics()}>
                ${this._showLyrics ? "收起歌词" : "展开歌词"}
                ${icon(this._showLyrics ? "expand_less" : "expand_more", 14)}
              </button>`
            : nothing}
        </div>

        <!-- 大封面 -->
        <div class="art" @click=${() => this._toggleLyrics()} title="${this._showLyrics ? "收起歌词" : "展开歌词"}">
          ${artwork
            ? html`<img src="${artwork}" alt="" />`
            : icon("music", false, 56)}
        </div>

        <!-- 增强按钮行:❤喜欢 / 加歌单 / 浏览媒体库(HA 原生入口) -->
        <div class="actions">
          <button
            class="action ${this._liked ? "on" : ""}"
            title="喜欢 / 取消喜欢"
            @click=${this._toggleLike}
            ?disabled=${!this._songId}
          >${icon(this._liked ? "heart" : "heart_outline", 20)}</button>
          <button
            class="action ${this._showAddToPlaylist ? "on" : ""}"
            title="添加到歌单"
            @click=${this._toggleAddToPlaylist}
            ?disabled=${!this._songId}
          >${icon("playlist_add", 20)}</button>
          <button
            class="action"
            title="浏览媒体库(打开 HA 原生媒体浏览)"
            @click=${this._openMediaBrowser}
          >${icon("library", 20)}</button>
        </div>

        ${this._showAddToPlaylist ? html`
          <div class="playlist-picker">
            <select @focus=${this._loadPlaylists} @change=${this._addToPlaylist}>
              <option value="">${this._playlists === null ? "加载歌单..." : "选择歌单..."}</option>
              ${(this._playlists || []).map(
                (p) => html`<option value=${p.id}>${p.name}</option>`
              )}
            </select>
          </div>
        ` : nothing}

        <!-- 进度条 -->
        <div class="progress">
          <span>${this._fmt(pos)}</span>
          <input
            type="range"
            min="0"
            max=${dur || 100}
            step="1"
            value=${Math.min(pos, dur || 100)}
            @pointerdown=${this._seekStart}
            @input=${this._seekInput}
            @change=${this._seekEnd}
            ?disabled=${!dur}
          />
          <span>${this._fmt(dur)}</span>
        </div>

        <!-- 控制行:上一首/播放/下一首/随机/循环/音量/电源 -->
        <div class="controls">
          <button class="action" title="上一首" @click=${() => this._service("media_player", "media_previous_track")}>${icon("prev", 22)}</button>
          <button class="action" title="${this._playing ? "暂停" : "播放"}" @click=${this._togglePlay}>
            ${icon(this._playing ? "pause" : "play", 28)}
          </button>
          <button class="action" title="下一首" @click=${() => this._service("media_player", "media_next_track")}>${icon("next", 22)}</button>
          <button class="action ${attr.shuffle ? "on" : ""}" title="随机" @click=${this._toggleShuffle}>${icon("shuffle", 16)}</button>
          <button class="action ${repeatActive ? "on" : ""}" title="循环模式:${playMode}" @click=${this._cycleRepeat}>
            ${icon(playMode === "one" ? "repeat_one" : "repeat", 16)}
          </button>
          <span style="flex:1"></span>
          <button class="action ${attr.is_volume_muted ? "on" : ""}" title="静音" @click=${this._toggleMute}>${icon(attr.is_volume_muted ? "volume_off" : "volume", 18)}</button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value=${this._volume}
            @change=${this._setVolume}
          />
          <button class="action" title="${this._on ? "关闭" : "开启"}" @click=${this._togglePower}>
            ${icon("power", 18)}
          </button>
        </div>

        ${this._showLyrics ? html`
          <div class="lyrics-panel">
            ${this._lyrics === null
              ? html`<div class="empty">加载歌词中...</div>`
              : this._lyrics.length === 0
                ? html`<div class="empty">暂无歌词</div>`
                : this._lyrics.map((l, i) => html`
                    <div class="line ${classMap({ active: i === this._lyricIndex })} ${l.value.trim() === "" ? "blank" : ""}">
                      ${l.value || "♪"}
                    </div>
                  `)}
          </div>
        ` : nothing}
      </ha-card>
    `;
  }
}

customElements.define("musicflow-player-card", MusicFlowPlayerCard);

/* ==================== Visual editor ==================== */
const EDITOR_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: "media_player" } } },
  { name: "show_artwork", selector: { boolean: {} }, default: true },
  { name: "show_lyrics", selector: { boolean: {} }, default: true },
];

class MusicFlowPlayerCardEditor extends LitElement {
  static properties = { hass: { type: Object }, config: { type: Object } };

  setConfig(config) { this.config = config; }

  render() {
    if (!this.hass || !this.config) return nothing;
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${EDITOR_SCHEMA}
        .computeLabel=${(s) => s.label ?? s.name}
        @value-changed=${this._onChange}
      ></ha-form>
    `;
  }

  _onChange(ev) {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { value: ev.detail.value },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("musicflow-player-card-editor", MusicFlowPlayerCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "musicflow-player-card",
  name: "MusicFlow Player",
  description:
    "MusicFlow media player control card. Mirrors the HA native media_player card with enhancements: favorite, add-to-playlist, scrolling lyrics, switch between MusicFlow players (control target only). Requires MusicFlow integration 1.2.6+.",
  preview: true,
});