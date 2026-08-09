import { LitElement, html, css, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";

/* ==================== Icons: verbatim MDI paths (same as HA frontend) ==================== */
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
  headphones: "M12,1C7,1 3,5 3,10V17A3,3 0 0,0 6,20H9V12H5V10A7,7 0 0,1 12,3A7,7 0 0,1 19,10V12H15V20H18A3,3 0 0,0 21,17V10C21,5 16.97,1 12,1Z",
  check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
  cast: "M1,10V12A9,9 0 0,1 10,21H12C12,14.92 7.07,10 1,10M1,14V16A5,5 0 0,1 6,21H8A7,7 0 0,0 1,14M1,18V21H4A3,3 0 0,0 1,18M21,3H3C1.89,3 1,3.89 1,5V8H3V5H21V19H14V21H21A2,2 0 0,0 23,19V5C23,3.89 22.1,3 21,3Z",
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

/* ==================== Card ====================
 * Faithful replica of HA's hui-media-player-entity-row
 * (generic-entity-row header + official control logic).
 * The ONLY deviation: tapping the left state-badge (DLNA icon) opens the
 * MusicFlow player switcher instead of the more-info dialog. Everything
 * else - controls, visibility rules, volume block, narrow layout - is the
 * official implementation.
 */
class MusicFlowPlayerCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _activeEntity: { type: String },
      _showPlayerPicker: { type: Boolean },
      _narrow: { type: Boolean },
      _veryNarrow: { type: Boolean },
    };
  }

  /* Official entity-row styles + generic-entity-row header styles */
  static styles = css`
    :host {
      display: block;
    }
    .row {
      display: flex;
      align-items: center;
      flex-direction: row;
      width: 100%;
      outline: none;
    }
    .badge-wrap {
      flex: 0 0 40px;
      display: flex;
      align-items: center;
      cursor: pointer;
      border-radius: 50%;
    }
    .badge-wrap:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    }
    .info {
      padding-left: 16px;
      padding-right: 8px;
      padding-inline-start: 16px;
      padding-inline-end: 8px;
      flex: 1 1 30%;
      min-width: 0;
    }
    .info,
    .info > * {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .name {
      color: var(--primary-text-color);
    }
    .secondary {
      color: var(--secondary-text-color);
    }
    .flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 4px;
    }
    .volume {
      display: flex;
      align-items: center;
      flex-grow: 2;
      flex-shrink: 2;
    }
    .controls {
      white-space: nowrap;
      direction: ltr;
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
      vertical-align: middle;
    }
    .action:hover {
      color: var(--primary-color);
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    }
    .action:disabled {
      opacity: 0.35;
      cursor: default;
    }
    .volume input[type="range"] {
      flex-grow: 2;
      flex-shrink: 2;
      width: 100%;
      min-width: 0;
      accent-color: var(--primary-color);
    }

    /* Player switcher dropdown (shown when the badge is tapped) */
    .picker-wrap { position: relative; }
    .picker {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
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
    .picker-title {
      font-size: 11px;
      color: var(--secondary-text-color);
      padding: 4px 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
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
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._closePickerOnOutsideClick, true);
    this._attachObserver();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._closePickerOnOutsideClick, true);
    this._resizeObserver?.unobserve(this);
  }

  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error("请配置 MusicFlow 播放器实体 (entity)");
    }
    this.config = { ...config };
    if (!this._activeEntity || !this._isMusicFlowEntity(config.entity)) {
      this._activeEntity = config.entity;
    }
  }

  /* ==================== State helpers (official) ==================== */
  get _stateObj() { return this.hass?.states?.[this._activeEntity]; }
  get _attr() { return this._stateObj?.attributes || {}; }
  get _state() { return this._stateObj?.state; }

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

  _fmtState() {
    const s = this._state;
    const map = { playing: "播放中", paused: "已暂停", idle: "空闲", off: "已关闭", unavailable: "不可用", on: "已开启" };
    return map[s] || s || "";
  }

  _label(action) {
    const map = { media_play: "播放", media_pause: "暂停", media_stop: "停止", media_play_pause: "播放/暂停" };
    return map[action] || action;
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
    this._service("media_player", "volume_set", { volume_level: Number(ev.target.value) });
  }

  /* ==================== The ONLY MusicFlow deviation: player switcher ==================== */
  _togglePlayerPicker(ev) {
    ev.stopPropagation();
    this._showPlayerPicker = !this._showPlayerPicker;
  }
  _switchPeer(newEntity) {
    if (!newEntity || newEntity === this._activeEntity) {
      this._showPlayerPicker = false;
      return;
    }
    /* MusicFlow switchPeer 语义:纯 UI 切换控制目标。旧播放器的队列/状态完全不动,
       本卡片只是改为读取/控制另一个播放器的实体。 */
    this._showPlayerPicker = false;
    this._activeEntity = newEntity;
    this.requestUpdate();
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

  /* ==================== Render (official layout) ==================== */
  render() {
    if (!this.hass || !this._stateObj) {
      return html`<hui-warning>未找到实体 ${this.config?.entity || ""}</hui-warning>`;
    }
    const stateObj = this._stateObj;
    const entityState = this._state;
    const assumedState = stateObj.attributes.assumed_state === true;
    const controlButton = this._computeControlButton();
    const attr = this._attr;
    const peers = this._peers;
    const name = this.hass.formatEntityName
      ? this.hass.formatEntityName(stateObj, this.config?.name)
      : attr.friendly_name || this._activeEntity;

    /* Official buttons block */
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

    const showVolume =
      (supportsFeature(stateObj, F.VOLUME_STEP) || supportsFeature(stateObj, F.VOLUME_SET)) &&
      stateActive(stateObj);

    const mediaDescription = this._mediaDescription() || this._fmtState();

    return html`
      <div class="row" style="position:relative">
        <!-- 左上角 DLNA 图标:点击打开 MusicFlow 播放器切换器(唯一改动点) -->
        <span class="badge-wrap" @click=${this._togglePlayerPicker} title="切换播放器">
          <state-badge .stateObj=${stateObj}></state-badge>
        </span>

        <div class="info" .title=${name}>
          ${name}
          <div class="secondary">${mediaDescription}</div>
        </div>

        <div class="controls">
          ${supportsFeature(stateObj, F.TURN_ON) && (!stateActive(stateObj) || assumedState) && entityState !== UNAVAILABLE
            ? html`<button class="action" title="开启" @click=${this._turnOn}>${icon(assumedState ? "power_on" : "power_standby", 22)}</button>` : ""}
          ${!supportsFeature(stateObj, F.VOLUME_SET) && !supportsFeature(stateObj, F.VOLUME_STEP) && (stateActive(stateObj) || assumedState || !supportsFeature(stateObj, F.TURN_ON) || entityState === UNAVAILABLE)
            ? buttons : ""}
          ${supportsFeature(stateObj, F.TURN_OFF) && (stateActive(stateObj) || assumedState)
            ? html`<button class="action" title="关闭" @click=${this._turnOff}>${icon(assumedState ? "power_off" : "power_standby", 22)}</button>` : ""}
        </div>

        <!-- 播放器切换器下拉(图标点击弹出) -->
        ${this._showPlayerPicker ? html`
          <div class="picker" @click=${(ev) => ev.stopPropagation()}>
            <div class="picker-title">切换播放器</div>
            ${peers.length === 0
              ? html`<div class="picker-item-meta" style="padding:6px 8px">没有 MusicFlow 播放器</div>`
              : peers.map((p) => html`
                  <div class="picker-item ${classMap({ active: p.entityId === this._activeEntity, offline: !p.available })}"
                       @click=${() => this._switchPeer(p.entityId)}>
                    <span class="picker-item-icon">${icon("headphones", 18)}</span>
                    <div class="picker-item-info">
                      <div class="picker-item-name">${this._peerLabel(p)}</div>
                      <div class="picker-item-meta">${this._peerMeta(p)}</div>
                    </div>
                    ${p.entityId === this._activeEntity ? icon("check", 18) : nothing}
                  </div>`)}
          </div>
        ` : nothing}
      </div>

      <!-- 音量(官方第二行) -->
      ${showVolume ? html`
        <div class="flex">
          <div class="volume">
            ${supportsFeature(stateObj, F.VOLUME_MUTE)
              ? html`<button class="action" title="静音" @click=${this._toggleMute}>${icon(attr.is_volume_muted ? "volume_off" : "volume_high", 20)}</button>` : ""}
            ${!this._veryNarrow && supportsFeature(stateObj, F.VOLUME_SET)
              ? html`<input type="range" min="0" max="1" step="0.01" value=${Number(attr.volume_level || 0)} @change=${this._selectedVolumeChanged} />`
              : !this._veryNarrow && supportsFeature(stateObj, F.VOLUME_STEP)
                ? html`<button class="action" title="音量-" @click=${this._volumeDown}>${icon("volume_minus", 20)}</button>
                       <button class="action" title="音量+" @click=${this._volumeUp}>${icon("volume_plus", 20)}</button>`
                : ""}
          </div>
          <div class="controls">${buttons}</div>
        </div>
      ` : ""}
    `;
  }
}

customElements.define("musicflow-player-card", MusicFlowPlayerCard);

/* ==================== Visual editor ==================== */
const EDITOR_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: "media_player" } } },
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
    "Official HA media_player controls with one MusicFlow enhancement: tap the DLNA icon to switch between MusicFlow players. Requires MusicFlow integration 1.2.6+.",
  preview: true,
});