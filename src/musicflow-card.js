import { LitElement, html, css, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";

/* ==================== Icons: verbatim MDI paths (same as HA frontend uses) ==================== */
const ICONS = {
  play: "M8,5.14V19.14L19,12.14L8,5.14Z",
  pause: "M14,19H18V5H14M6,19H10V5H6V19Z",
  play_pause: "M3,5V19L11,12M13,19H16V5H13M18,5V19H21V5",
  skip_previous: "M6,18V6H8V18H6M9.5,12L18,6V18L9.5,12Z",
  skip_next: "M16,18H18V6H16M6,18L14.5,12L6,6V18Z",
  power_standby: "M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12A7,7 0 0,1 12,19C8.14,19 5,15.88 5,12C5,9.91 5.95,7.91 7.58,6.58L6.17,5.17C2.38,8.39 1.92,14.07 5.14,17.86C8.36,21.64 14.04,22.1 17.83,18.88C19.85,17.17 21,14.65 21,12C21,9.37 19.84,6.87 17.83,5.17Z",
  power_off: "M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12A9,9 0 0,0 12,3M12,19A7,7 0 0,1 5,12A7,7 0 0,1 12,5A7,7 0 0,1 19,12A7,7 0 0,1 12,19Z",
  power_on: "M11,3H13V21H11V3Z",
  volume_high: "M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z",
  volume_off: "M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z",
  volume_minus: "M3,9H7L12,4V20L7,15H3V9M14,11H22V13H14V11Z",
  volume_plus: "M3,9H7L12,4V20L7,15H3V9M14,11H17V8H19V11H22V13H19V16H17V13H14V11Z",
  repeat: "M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z",
  repeat_once: "M13,15V9H12L10,10V11H11.5V15M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z",
  shuffle: "M17,3L22.25,7.5L17,12L22.25,16.5L17,21V18H14.26L11.44,15.18L13.56,13.06L15.5,15H17V12L17,9H15.5L6.5,18H2V15H5.26L14.26,6H17V3M2,6H6.5L9.32,8.82L7.2,10.94L5.26,9H2V6Z",
  /* play_mode = order */
  arrow_right: "M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z",
  headphones: "M12,1C7,1 3,5 3,10V17A3,3 0 0,0 6,20H9V12H5V10A7,7 0 0,1 12,3A7,7 0 0,1 19,10V12H15V20H18A3,3 0 0,0 21,17V10C21,5 16.97,1 12,1Z",
  heart: "M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z",
  heart_outline: "M12.1,18.55L12,18.65L11.89,18.55C7.14,14.24 4,11.39 4,8.5C4,6.5 5.5,5 7.5,5C9.04,5 10.54,6 11.07,7.36H12.93C13.46,6 14.96,5 16.5,5C18.5,5 20,6.5 20,8.5C20,11.39 16.86,14.24 12.1,18.55M16.5,3C14.76,3 13.09,3.81 12,5.08C10.91,3.81 9.24,3 7.5,3C4.42,3 2,5.41 2,8.5C2,12.27 5.4,15.36 10.55,20.03L12,21.35L13.45,20.03C18.6,15.36 22,12.27 22,8.5C22,5.41 19.58,3 16.5,3Z",
  playlist_music: "M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z",
  check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
  cast: "M1,10V12A9,9 0 0,1 10,21H12C12,14.92 7.07,10 1,10M1,14V16A5,5 0 0,1 6,21H8A7,7 0 0,0 1,14M1,18V21H4A3,3 0 0,0 1,18M21,3H3C1.89,3 1,3.89 1,5V8H3V5H21V19H14V21H21A2,2 0 0,0 23,19V5C23,3.89 22.1,3 21,3Z",
  music_note: "M12,3V13.55C11.41,13.21 10.73,13 10,13C7.79,13 6,14.79 6,17C6,19.21 7.79,21 10,21C12.21,21 14,19.21 14,17V7H18V3H12Z",
  stop: "M18,18H6V6H18V18Z",
};
const icon = (name, size = 22) => html`
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="${ICONS[name]}" fill="currentColor" />
  </svg>
`;

const MF_DOMAIN = "musicflow";

/* MediaPlayerEntityFeature bitmask - same values as Home Assistant core */
const F = {
  PAUSE: 1,
  SEEK: 2,
  VOLUME_SET: 4,
  VOLUME_MUTE: 8,
  PREVIOUS_TRACK: 16,
  SKIP: 32,
  NEXT_TRACK: 64,
  TURN_OFF: 128,
  TURN_ON: 256,
  PLAY_MEDIA: 512,
  VOLUME_STEP: 1024,
  SELECT_SOURCE: 2048,
  STOP: 4096,
  CLEAR_PLAYLIST: 8192,
  PLAY: 16384,
  SHUFFLE_SET: 32768,
  REPEAT_SET: 65536,
  GROUPING: 131072,
  MEDIA_ENQUEUE: 524288,
  MEDIA_ANNOUNCE: 1048576,
  BROWSE_MEDIA: 2097152,
  SEARCH_MEDIA: 4194304,
};
const supportsFeature = (stateObj, feature) =>
  Boolean(stateObj?.attributes?.supported_features & feature);
const stateActive = (stateObj) => {
  const state = stateObj?.state;
  return state === "playing" || state === "paused" || state === "on";
};
const UNAVAILABLE = "unavailable";

function debounce(func, wait, immediate = false) {
  let timeout;
  return function (...args) {
    const context = this;
    const later = () => {
      timeout = undefined;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

/* ==================== Card ==================== */
class MusicFlowPlayerCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _activeEntity: { type: String },
      _showPlayerPicker: { type: Boolean },
      _narrow: { type: Boolean },
      _veryNarrow: { type: Boolean },
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
    .card {
      background: var(--ha-card-background, var(--card-background-color, #fff));
      border-radius: var(--ha-card-border-radius, 12px);
      box-shadow: var(--ha-card-box-shadow, none);
      padding: 12px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto auto auto auto auto auto;
      column-gap: 12px;
      row-gap: 8px;
      align-items: start;
    }

    .top {
      grid-column: 1;
      grid-row: 1;
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

    .title-block {
      grid-column: 1;
      grid-row: 2;
      min-width: 0;
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

    /* Controls row (official entity-row logic) */
    .controls {
      grid-column: 1;
      grid-row: 4;
      display: flex;
      align-items: center;
      gap: 2px;
      white-space: nowrap;
      direction: ltr;
      flex-wrap: wrap;
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

    /* Favorite button row */
    .actions {
      grid-column: 1;
      grid-row: 3;
    }

    /* Full-bleed artwork on the right column */
    .art {
      grid-column: 2;
      grid-row: 1 / 7;
      min-height: 220px;
      border-radius: 10px;
      background: var(--secondary-background-color, #eee);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--disabled-text-color);
      overflow: hidden;
      position: relative;
    }
    .art img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .art-browse {
      position: absolute;
      bottom: 8px;
      right: 8px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.45);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(2px);
    }
    .art-browse:hover { background: rgba(0, 0, 0, 0.65); }

    /* Volume (official layout: mute + slider) */
    .volume-bar {
      grid-column: 2;
      grid-row: 7;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .volume-bar input[type="range"] {
      flex: 1;
      min-width: 0;
      accent-color: var(--primary-color);
    }

    /* Progress bar - bottom of the card, full width */
    .progress-bar {
      grid-column: 1 / -1;
      grid-row: 7;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .progress-bar .time {
      font-size: 11px;
      color: var(--secondary-text-color);
      flex-shrink: 0;
      min-width: 32px;
      text-align: center;
    }
    .progress-bar input[type="range"] {
      flex: 1;
      min-width: 0;
      accent-color: var(--primary-color);
    }

    /* Player switcher dropdown */
    .picker-wrap { position: relative; }
    .picker-toggle {
      background: none;
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      color: var(--secondary-text-color);
      border-radius: 999px;
      padding: 2px 6px;
      cursor: pointer;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .picker-toggle.is-current {
      color: var(--primary-color);
      border-color: var(--primary-color);
    }
    .picker-toggle:hover {
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
    .picker-item.offline { opacity: 0.55; }
    .picker-item-icon {
      color: var(--secondary-text-color);
      flex-shrink: 0;
    }
    .picker-item-info { flex: 1; min-width: 0; }
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
  `;

  constructor() {
    super();
    this._activeEntity = "";
    this._showPlayerPicker = false;
    this._narrow = false;
    this._veryNarrow = false;
    this._seekPos = null;
    this._seeking = false;
    this._tick = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    this._ticker = setInterval(() => this._tick++, 1000);
    document.addEventListener("click", this._closePickerOnOutsideClick, true);
    this._attachObserver();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._ticker) clearInterval(this._ticker);
    document.removeEventListener("click", this._closePickerOnOutsideClick, true);
    this._resizeObserver?.unobserve(this);
  }

  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error("请配置 MusicFlow 播放器实体 (entity)");
    }
    this.config = { show_artwork: true, ...config };
    if (!this._activeEntity || !this._isMusicFlowEntity(config.entity)) {
      this._activeEntity = config.entity;
    }
  }

  /* ==================== Official entity-row helpers ==================== */
  get _stateObj() {
    return this.hass?.states?.[this._activeEntity];
  }
  get _attr() { return this._stateObj?.attributes || {}; }
  get _state() { return this._stateObj?.state; }
  get _playing() { return this._state === "playing"; }
  get _on() { return this._state !== "off" && this._state !== "unavailable"; }
  get _position() {
    if (this._seeking && this._seekPos != null) return this._seekPos;
    const attr = this._attr;
    const pos = Number(attr.media_position || 0);
    if (this._playing && attr.media_position_updated_at) {
      const updated = Date.parse(attr.media_position_updated_at);
      if (isFinite(updated)) {
        const elapsed = (Date.now() - updated) / 1000;
        const dur = Number(attr.media_duration || 0);
        if (dur > 0) return Math.max(0, Math.min(pos + elapsed, dur));
        return pos + elapsed;
      }
    }
    return pos;
  }
  get _duration() { return Number(this._attr.media_duration || 0); }
  get _volume() { return Number(this._attr.volume_level || 0); }
  get _liked() { return Boolean(this._attr.liked); }

  get _peers() {
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

  _peerLabel(p) { return p.state.attributes?.friendly_name || p.entityId; }

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

  /* Official: computeMediaDescription */
  _mediaDescription() {
    const attr = this._attr;
    const title = attr.media_title;
    const artist = attr.media_artist || "";
    const album = attr.media_album_name || "";
    const parts = [];
    if (artist) parts.push(artist);
    if (album) parts.push(album);
    return title ? `${title}${parts.length ? ` · ${parts.join(" · ")}` : ""}` : "";
  }

  /* Official: _computeControlButton */
  _computeControlButton() {
    const s = this._state;
    return s === "on"
      ? { icon: "play_pause", action: "media_play_pause" }
      : s !== "playing"
        ? { icon: "play", action: "media_play" }
        : supportsFeature(this._stateObj, F.PAUSE)
          ? { icon: "pause", action: "media_pause" }
          : { icon: "stop", action: "media_stop" };
  }

  _closePickerOnOutsideClick = (ev) => {
    if (!this._showPlayerPicker) return;
    const path = ev.composedPath ? ev.composedPath() : [];
    if (!path.includes(this)) this._showPlayerPicker = false;
  };

  /* ==================== Actions (official service calls) ==================== */
  _service(domain, service, data = {}) {
    this.hass.callService(domain, service, data, { entity_id: this._activeEntity });
  }
  _turnOn() { this._service("media_player", "turn_on"); }
  _turnOff() { this._service("media_player", "turn_off"); }
  _playPauseStop() {
    const service =
      this._state !== "playing"
        ? "media_play"
        : supportsFeature(this._stateObj, F.PAUSE)
          ? "media_pause"
          : "media_stop";
    this._service("media_player", service);
  }
  _play() { this._service("media_player", "media_play"); }
  _pause() { this._service("media_player", "media_pause"); }
  _stop() { this._service("media_player", "media_stop"); }
  _previousTrack() { this._service("media_player", "media_previous_track"); }
  _nextTrack() { this._service("media_player", "media_next_track"); }
  _toggleMute() {
    this._service("media_player", "volume_mute", {
      is_volume_muted: !this._attr.is_volume_muted,
    });
  }
  _volumeDown() { this._service("media_player", "volume_down"); }
  _volumeUp() { this._service("media_player", "volume_up"); }
  _selectedVolumeChanged(ev) {
    this._service("media_player", "volume_set", {
      volume_level: Number(ev.target.value),
    });
  }
  _toggleLike() { this._service("musicflow", "like_track"); }
  _cyclePlayMode() {
    const cycle = ["order", "all", "one", "shuffle"];
    const cur = this._attr.play_mode || "order";
    const next = cycle[(cycle.indexOf(cur) + 1) % cycle.length];
    this._service("musicflow", "set_play_mode", { play_mode: next });
  }
  _playModeIcon(mode) {
    return mode === "shuffle" ? "shuffle"
         : mode === "one" ? "repeat_once"
         : mode === "all" ? "repeat"
         : "arrow_right";
  }
  _playModeLabel(mode) {
    return mode === "shuffle" ? "随机"
         : mode === "one" ? "单曲循环"
         : mode === "all" ? "列表循环"
         : "顺序";
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
    /* MusicFlow switchPeer 语义:纯 UI 切换控制目标,旧播放器队列/状态不动 */
    this._showPlayerPicker = false;
    this._activeEntity = newEntity;
    this.requestUpdate();
  }
  _openMediaBrowser() {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId: this._activeEntity },
        bubbles: true,
        composed: true,
      })
    );
  }

  /* ==================== Narrow layout (official ResizeObserver) ==================== */
  _attachObserver() {
    if (!this._resizeObserver) {
      this._resizeObserver = new ResizeObserver(
        debounce(() => this._measureCard(), 250, false)
      );
    }
    this._resizeObserver.observe(this);
  }
  _measureCard() {
    if (!this.isConnected) return;
    this._narrow = (this.clientWidth || 0) < 300;
    this._veryNarrow = (this.clientWidth || 0) < 225;
  }

  /* ==================== Render ==================== */
  render() {
    if (!this.hass || !this._stateObj) {
      return html`<ha-card class="card"><div class="title">未找到实体 ${this.config?.entity || ""}</div></ha-card>`;
    }
    const stateObj = this._stateObj;
    const entityState = this._state;
    const assumedState = stateObj.attributes.assumed_state === true;
    const controlButton = this._computeControlButton();
    const attr = this._attr;
    const playMode = attr.play_mode || "order";
    const playModeActive = playMode !== "order";
    const pos = this._position;
    const dur = this._duration;
    const peers = this._peers;
    const currentPeerLabel = this._peerLabel({ entityId: this._activeEntity, state: stateObj });
    const isCurrentActive = peers.find((p) => p.entityId === this._activeEntity)?.available;
    const artwork = this.config.show_artwork ? attr.entity_picture : null;
    const mediaDesc = this._mediaDescription() || this._fmtState();

    /* ---- official buttons block (same visibility rules as hui-media-player-entity-row) ---- */
    const showVolume =
      (supportsFeature(stateObj, F.VOLUME_STEP) || supportsFeature(stateObj, F.VOLUME_SET)) &&
      stateActive(stateObj);

    const buttons = html`
      ${!this._narrow && (entityState === "playing" || assumedState) && supportsFeature(stateObj, F.PREVIOUS_TRACK)
        ? html`<button class="action" title="上一首" @click=${this._previousTrack}>${icon("skip_previous", 24)}</button>` : ""}
      ${!assumedState &&
        ((entityState === "playing" && (supportsFeature(stateObj, F.PAUSE) || supportsFeature(stateObj, F.STOP))) ||
         ((entityState === "paused" || entityState === "idle") && supportsFeature(stateObj, F.PLAY)) ||
         (entityState === "on" && (supportsFeature(stateObj, F.PLAY) || supportsFeature(stateObj, F.PAUSE))))
        ? html`<button class="action" title=${this._label(controlButton.action)} @click=${this._playPauseStop}>${icon(controlButton.icon, 30)}</button>` : ""}
      ${assumedState && supportsFeature(stateObj, F.PLAY)
        ? html`<button class="action" title="播放" @click=${this._play}>${icon("play", 24)}</button>` : ""}
      ${assumedState && supportsFeature(stateObj, F.PAUSE)
        ? html`<button class="action" title="暂停" @click=${this._pause}>${icon("pause", 24)}</button>` : ""}
      ${assumedState && supportsFeature(stateObj, F.STOP) && !supportsFeature(stateObj, F.VOLUME_SET)
        ? html`<button class="action" title="停止" @click=${this._stop}>${icon("stop", 24)}</button>` : ""}
      ${(entityState === "playing" || (assumedState && !supportsFeature(stateObj, F.VOLUME_SET))) && supportsFeature(stateObj, F.NEXT_TRACK)
        ? html`<button class="action" title="下一首" @click=${this._nextTrack}>${icon("skip_next", 24)}</button>` : ""}
    `;

    return html`
      <ha-card class="card">
        <!-- 顶部:cast 图标 + 设备名 -->
        <div class="top">
          <span class="icon-badge">${icon("cast", 18)}</span>
          <span class="device-name" title="${currentPeerLabel}">${currentPeerLabel}</span>
        </div>

        <!-- 标题 / 艺术家 -->
        <div class="title-block">
          <div class="title">${attr.media_title || (this._on ? "未在播放" : "已关闭")}</div>
          <div class="secondary">${attr.media_artist || attr.media_album_name || this._fmtState()}</div>
        </div>

        <!-- ❤ 喜欢(始终可点) -->
        <div class="actions">
          <button class="action ${this._liked ? "on" : ""}" title="喜欢 / 取消喜欢" @click=${this._toggleLike}>
            ${icon(this._liked ? "heart" : "heart_outline", 22)}
          </button>
        </div>

        <!-- 控制行:电源 + 播放按钮组 + 播放模式 + 切换播放器 -->
        <div class="controls">
          ${supportsFeature(stateObj, F.TURN_ON) && (!stateActive(stateObj) || assumedState) && entityState !== UNAVAILABLE
            ? html`<button class="action" title="开启" @click=${this._turnOn}>${icon(assumedState ? "power_on" : "power_standby", 22)}</button>` : ""}
          ${!supportsFeature(stateObj, F.VOLUME_SET) && !supportsFeature(stateObj, F.VOLUME_STEP) && (stateActive(stateObj) || assumedState || !supportsFeature(stateObj, F.TURN_ON) || entityState === UNAVAILABLE)
            ? buttons : ""}
          ${supportsFeature(stateObj, F.TURN_OFF) && (stateActive(stateObj) || assumedState)
            ? html`<button class="action" title="关闭" @click=${this._turnOff}>${icon(assumedState ? "power_off" : "power_standby", 22)}</button>` : ""}
          <!-- MusicFlow 增强:播放模式单按钮(循环切换) -->
          <button class="action ${playModeActive ? "on" : ""}" title="播放模式:${this._playModeLabel(playMode)} (点击循环切换)" @click=${this._cyclePlayMode}>
            ${icon(this._playModeIcon(playMode), 22)}
          </button>
          <!-- MusicFlow 增强:切换播放器(耳机) -->
          <span class="picker-wrap">
            <button class="picker-toggle ${isCurrentActive ? "is-current" : ""}" @click=${(ev) => { ev.stopPropagation(); this._showPlayerPicker = !this._showPlayerPicker; }} title="切换播放器">
              ${icon("headphones", 20)}
            </button>
            ${this._showPlayerPicker ? html`
              <div class="picker" @click=${(ev) => ev.stopPropagation()}>
                ${peers.length === 0
                  ? html`<div class="picker-item-meta">没有 MusicFlow 播放器</div>`
                  : peers.map((p) => html`
                      <div class="picker-item ${classMap({ active: p.entityId === this._activeEntity, offline: !p.available })}" @click=${() => this._switchPeer(p.entityId)}>
                        <span class="picker-item-icon">${icon("headphones", 18)}</span>
                        <div class="picker-item-info">
                          <div class="picker-item-name">${this._peerLabel(p)}</div>
                          <div class="picker-item-meta">${this._peerMeta(p)}</div>
                        </div>
                        ${p.entityId === this._activeEntity ? icon("check", 18) : nothing}
                      </div>`)}
              </div>` : nothing}
          </span>
        </div>

        <!-- 大封面(右列满铺) + 媒体库按钮(右下角) -->
        <div class="art">
          ${artwork ? html`<img src="${artwork}" alt="" />` : icon("music_note", false, 64)}
          <button class="art-browse" title="浏览媒体库" @click=${this._openMediaBrowser}>${icon("playlist_music", 18)}</button>
        </div>

        <!-- 音量(右列底部,官方布局) -->
        <div class="volume-bar">
          ${showVolume ? html`
            ${supportsFeature(stateObj, F.VOLUME_MUTE)
              ? html`<button class="action ${attr.is_volume_muted ? "on" : ""}" title="静音" @click=${this._toggleMute}>${icon(attr.is_volume_muted ? "volume_off" : "volume_high", 20)}</button>` : ""}
            ${!this._veryNarrow && supportsFeature(stateObj, F.VOLUME_SET)
              ? html`<input type="range" min="0" max="1" step="0.01" value=${this._volume} @change=${this._selectedVolumeChanged} />`
              : !this._veryNarrow && supportsFeature(stateObj, F.VOLUME_STEP)
                ? html`<button class="action" title="音量-" @click=${this._volumeDown}>${icon("volume_minus", 20)}</button>
                       <button class="action" title="音量+" @click=${this._volumeUp}>${icon("volume_plus", 20)}</button>`
                : ""}
          ` : ""}
        </div>

        <!-- 进度条(底部跨整张,HA 插值实时更新) -->
        <div class="progress-bar">
          <span class="time">${this._fmt(pos)}</span>
          <input type="range" min="0" max=${dur || 100} step="1" value=${Math.min(pos, dur || 100)}
                 @pointerdown=${this._seekStart} @input=${this._seekInput} @change=${this._seekEnd}
                 ?disabled=${!dur} />
          <span class="time">${this._fmt(dur)}</span>
        </div>
      </ha-card>
    `;
  }

  _label(action) {
    const map = {
      media_play: "播放",
      media_pause: "暂停",
      media_stop: "停止",
      media_play_pause: "播放/暂停",
    };
    return map[action] || action;
  }

  _fmtState() {
    const s = this._state;
    const map = { playing: "播放中", paused: "已暂停", idle: "空闲", off: "已关闭", unavailable: "不可用", on: "已开启" };
    return map[s] || s || "";
  }
}

customElements.define("musicflow-player-card", MusicFlowPlayerCard);

/* ==================== Visual editor ==================== */
const EDITOR_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: "media_player" } } },
  { name: "show_artwork", selector: { boolean: {} }, default: true },
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
    "MusicFlow media player card - a faithful replica of the HA native media_player controls with MusicFlow enhancements: favorite, browse media library, switch between MusicFlow players. Requires MusicFlow integration 1.2.6+.",
  preview: true,
});