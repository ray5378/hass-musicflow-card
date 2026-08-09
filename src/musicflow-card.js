import { LitElement, html, css, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";

/* ==================== SVG 图标(内联,不依赖 HA 图标库) ==================== */
const ICONS = {
  play: "M8 5v14l11-7z",
  pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  stop: "M6 6h12v12H6z",
  next: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
  prev: "M18 18L9.5 12 18 6v12zM6 6v12h2V6H6z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  heart_outline: "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z",
  shuffle: "M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
  repeat: "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",
  repeat_one: "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z",
  volume: "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
  volume_off: "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z",
  music: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  list_add: "M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z",
  switch_audio: "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
};

const icon = (name, filled = false, size = 22) => html`
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:block">
    <path d="${ICONS[name]}" fill="currentColor" />
  </svg>
`;

/* ==================== 播放模式映射 ==================== */
const REPEAT_ORDER = ["off", "all", "one"];
const REPEAT_LABEL = { off: "顺序", all: "列表循环", one: "单曲循环" };
const REPEAT_ICON = { off: "repeat", all: "repeat", one: "repeat_one" };

/* ==================== 卡片 ==================== */
class MusicFlowPlayerCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
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
    .card {
      background: var(--ha-card-background, var(--card-background-color, #fff));
      border-radius: var(--ha-card-border-radius, 12px);
      box-shadow: var(--ha-card-box-shadow, none);
      padding: 12px;
    }
    .top {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .art {
      width: 72px;
      height: 72px;
      border-radius: 8px;
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
    .meta {
      min-width: 0;
      flex: 1;
    }
    .title {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .artist {
      font-size: 13px;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .progress {
      margin-top: 10px;
    }
    .time {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--secondary-text-color);
      margin-top: 2px;
    }
    .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .btn {
      background: none;
      border: none;
      color: var(--secondary-text-color);
      cursor: pointer;
      padding: 6px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s, background 0.15s;
    }
    .btn:hover {
      color: var(--primary-text-color);
      background: var(--secondary-background-color, rgba(0,0,0,0.06));
    }
    .btn.on {
      color: var(--primary-color);
    }
    .btn.primary {
      color: var(--text-primary-color, #fff);
      background: var(--primary-color);
      width: 44px;
      height: 44px;
    }
    .btn.primary:hover {
      background: var(--primary-color);
      filter: brightness(1.1);
      color: var(--text-primary-color, #fff);
    }
    .btn:disabled {
      opacity: 0.35;
      cursor: default;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }
    .row label {
      font-size: 12px;
      color: var(--secondary-text-color);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    select {
      flex: 1;
      min-width: 0;
      background: var(--input-background-color, var(--secondary-background-color));
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 13px;
    }
    input[type="range"] {
      width: 100%;
      accent-color: var(--primary-color);
      margin: 0;
    }
    .lyrics {
      margin-top: 12px;
      max-height: 240px;
      overflow-y: auto;
      border-top: 1px solid var(--divider-color, rgba(0,0,0,0.12));
      padding-top: 8px;
      scroll-behavior: smooth;
    }
    .lyric {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 14px;
      color: var(--secondary-text-color);
      transition: color 0.2s, background 0.2s;
    }
    .lyric.active {
      color: var(--primary-text-color);
      background: var(--primary-color);
      font-weight: 600;
    }
    .lyric.blank {
      opacity: 0.55;
      font-style: italic;
    }
    .empty {
      text-align: center;
      color: var(--disabled-text-color);
      font-size: 13px;
      padding: 14px 0;
    }
    .badge {
      font-size: 11px;
      color: var(--disabled-text-color);
    }
  `;

  constructor() {
    super();
    this._playlists = null;
    this._lyrics = null;
    this._lyricIndex = -1;
    this._seekPos = null;
    this._seeking = false;
    this._tick = 0;
  }

  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error("请配置 MusicFlow 播放器实体 (entity)");
    }
    this.config = { show_artwork: true, show_lyrics: true, ...config };
  }

  get _entity() {
    return this.hass?.states?.[this.config?.entity];
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

  get _repeat() {
    const mode = this._attr.play_mode;
    if (mode === "one") return "one";
    if (mode === "all") return "all";
    return "off";
  }

  get _liked() {
    return Boolean(this._attr.liked);
  }

  get _songId() {
    return this._attr.song_id || null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._ticker = setInterval(() => this._tick++, 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._ticker) clearInterval(this._ticker);
  }

  updated(changed) {
    const attrs = changed.get("hass");
    if (attrs) {
      const prev = attrs?.states?.[this.config?.entity]?.attributes || {};
      if (prev.song_id !== this._songId) {
        this._loadLyrics();
        this._lyricIndex = -1;
      }
      this._updateLyricIndex();
    }
  }

  /* ---- HA 调用 ---- */
  _service(domain, service, data = {}, target = {}) {
    this.hass.callService(domain, service, data, {
      entity_id: this.config.entity,
      ...target,
    });
  }

  async _loadLyrics() {
    if (!this._songId) {
      this._lyrics = null;
      return;
    }
    try {
      const res = await this.hass.callWS({
        type: "musicflow/lyrics",
        entity_id: this.config.entity,
        song_id: this._songId,
      });
      this._lyrics = res.lines || [];
    } catch (e) {
      this._lyrics = [];
    }
  }

  async _loadPlaylists() {
    if (this._playlists) return;
    try {
      const res = await this.hass.callWS({
        type: "musicflow/playlists",
        entity_id: this.config.entity,
      });
      this._playlists = res.playlists || [];
    } catch (e) {
      this._playlists = [];
    }
  }

  _togglePlay() {
    this._service("media_player", this._playing ? "media_pause" : "media_play");
  }

  _toggleLike() {
    this._service("musicflow", "like_track");
  }

  _addToPlaylist(e) {
    const id = e.target.value;
    if (!id) return;
    this._service("musicflow", "add_to_playlist", { playlist_id: id });
    e.target.value = "";
  }

  _selectSource(e) {
    const source = e.target.value;
    if (!source) return;
    this._service("media_player", "select_source", { source });
  }

  _cycleRepeat() {
    const next = REPEAT_ORDER[(REPEAT_ORDER.indexOf(this._repeat) + 1) % REPEAT_ORDER.length];
    const mode = next === "off" ? "order" : next;
    this._service("musicflow", "set_play_mode", { play_mode: mode });
  }

  _toggleShuffle() {
    this._service("musicflow", "set_play_mode", {
      play_mode: this._attr.shuffle ? "order" : "shuffle",
    });
  }

  _toggleMute() {
    this._service("media_player", "volume_mute", {
      is_volume_muted: !this._attr.is_volume_muted,
    });
  }

  _setVolume(e) {
    this._service("media_player", "volume_set", { volume_level: Number(e.target.value) });
  }

  _seekStart(e) {
    this._seeking = true;
    this._seekPos = Number(e.target.value);
  }

  _seekInput(e) {
    this._seekPos = Number(e.target.value);
  }

  _seekEnd(e) {
    this._service("media_player", "media_seek", { seek_position: Number(e.target.value) });
    this._seekPos = null;
    this._seeking = false;
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

  _fmt(sec) {
    if (!isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  render() {
    if (!this.hass || !this._entity) {
      return html`<ha-card class="card"><div class="empty">未找到实体 ${this.config?.entity}</div></ha-card>`;
    }
    const attr = this._attr;
    const artwork = attr.entity_picture;
    const position = this._position;
    const duration = this._duration;
    const progressPct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
    const repeatIcon = REPEAT_ICON[this._repeat];
    const canControl = this._state !== "unavailable";

    return html`
      <ha-card class="card">
        <!-- 封面 + 元信息 -->
        <div class="top">
          <div class="art">
            ${this.config.show_artwork && artwork
              ? html`<img src="${artwork}" alt="" />`
              : icon("music", false, 30)}
          </div>
          <div class="meta">
            <div class="title">${attr.media_title || "未在播放"}</div>
            <div class="artist">${attr.media_artist || ""}${attr.media_album_name ? ` · ${attr.media_album_name}` : ""}</div>
            <div class="badge">${this._entity.entity_id}</div>
          </div>
          <!-- 心形喜欢 -->
          <button class="btn ${this._liked ? "on" : ""}" title="喜欢 / 取消喜欢"
                  @click=${this._toggleLike} ?disabled=${!this._songId || !canControl}>
            ${icon(this._liked ? "heart" : "heart_outline", this._liked, 24)}
          </button>
        </div>

        <!-- 进度 -->
        <div class="progress">
          <input type="range" min="0" max=${duration || 100} step="1"
                 value=${Math.min(position, duration || 100)}
                 @pointerdown=${this._seekStart} @input=${this._seekInput}
                 @change=${this._seekEnd} ?disabled=${!canControl || !duration} />
          <div class="time">
            <span>${this._fmt(position)}</span>
            <span>${this._fmt(duration)}</span>
          </div>
        </div>

        <!-- 主控制 -->
        <div class="controls">
          <button class="btn" title="上一首" @click=${() => this._service("media_player", "media_previous_track")} ?disabled=${!canControl}>${icon("prev")}</button>
          <button class="btn primary" title="${this._playing ? "暂停" : "播放"}" @click=${this._togglePlay} ?disabled=${!canControl}>
            ${icon(this._playing ? "pause" : "play", false, 26)}
          </button>
          <button class="btn" title="下一首" @click=${() => this._service("media_player", "media_next_track")} ?disabled=${!canControl}>${icon("next")}</button>
          <button class="btn" title="停止" @click=${() => this._service("media_player", "media_stop")} ?disabled=${!canControl}>${icon("stop", false, 18)}</button>
          <button class="btn ${attr.shuffle ? "on" : ""}" title="随机播放" @click=${this._toggleShuffle} ?disabled=${!canControl}>${icon("shuffle", false, 18)}</button>
          <button class="btn ${this._repeat !== "off" ? "on" : ""}" title="${REPEAT_LABEL[this._repeat]}（点击切换）" @click=${this._cycleRepeat} ?disabled=${!canControl}>${icon(repeatIcon, false, 18)}</button>
        </div>

        <!-- 音量 + 静音 -->
        <div class="row">
          <label>${icon(this._attr.is_volume_muted ? "volume_off" : "volume", false, 16)}</label>
          <input type="range" min="0" max="1" step="0.01" value=${this._volume}
                 @change=${this._setVolume} ?disabled=${!canControl} style="flex:1" />
          <button class="btn ${this._attr.is_volume_muted ? "on" : ""}" title="静音" @click=${this._toggleMute} ?disabled=${!canControl}>${icon("volume", false, 18)}</button>
        </div>

        <!-- 输出设备(切换播放器) + 添加到歌单 -->
        <div class="row">
          <label>${icon("switch_audio", false, 16)} 输出</label>
          <select @change=${this._selectSource} ?disabled=${!canControl || !(attr.source_list || []).length}>
            ${(attr.source_list || []).map(
              (s) => html`<option value=${s} ?selected=${s === attr.source}>${s}</option>`
            )}
          </select>
        </div>
        <div class="row">
          <label>${icon("list_add", false, 16)} 歌单</label>
          <select @focus=${this._loadPlaylists} @change=${this._addToPlaylist} ?disabled=${!this._songId}>
            <option value="">添加到歌单…</option>
            ${(this._playlists || []).map(
              (p) => html`<option value=${p.id}>${p.name}</option>`
            )}
          </select>
        </div>

        <!-- 歌词 -->
        ${this.config.show_lyrics
          ? html`
              <div class="lyrics" id="lyrics">
                ${this._lyrics === null
                  ? html`<div class="empty">正在加载歌词…</div>`
                  : this._lyrics.length === 0
                    ? html`<div class="empty">暂无歌词</div>`
                    : this._lyrics.map(
                        (l, i) => html`
                          <div class="lyric ${classMap({ active: i === this._lyricIndex })} ${l.value.trim() === "" ? "blank" : ""}"
                               data-idx=${i}>${l.value || "♪"}</div>
                        `
                      )}
              </div>
            `
          : nothing}
      </ha-card>
    `;
  }

  /* 歌词行滚动:active 行滚到容器中部 */
  updated() {
    if (!this.config?.show_lyrics || this._lyricIndex < 0) return;
    const box = this.shadowRoot?.getElementById("lyrics");
    if (!box) return;
    const active = box.querySelector(".lyric.active");
    if (active) {
      const target = active.offsetTop - box.clientHeight / 2 + active.clientHeight / 2;
      box.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    }
  }
}

customElements.define("musicflow-player-card", MusicFlowPlayerCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "musicflow-player-card",
  name: "MusicFlow Player",
  // HA 卡片选择器（仪表盘 → 添加卡片）按 description 显示卡片，
  // 同时按 name 在搜索框里匹配。这里简短一句 + 一行引导，比全角中文更稳。
  description:
    "Full MusicFlow player card. Requires MusicFlow integration 1.2.6+ and a MusicFlow media_player entity.",
  preview: true,
});
