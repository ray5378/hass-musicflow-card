// MusicFlow backend client: real-time WS + REST, used by the Lovelace card.
// Mirrors the Web frontend's player store (frontend/src/stores/player.ts) so
// the card is an equal peer to the Web/App clients: any action taken here is
// reflected on every other client via the same /ws channel, and vice-versa.
//
// Auth: every REST call and the WS upgrade carry the user's long-lived apiKey
// as ?token=<apiKey> (backend auth.ts supports JWT-first then apiKey, same as
// the WS upgrade path). The card obtains url + apiKey from the MusicFlow HA
// integration via the `musicflow/backend_config` WS command, falling back to
// explicit config (url + api_key) if provided.

const RECONNECT_DELAY = 3000;

export class BackendClient {
  constructor(opts = {}) {
    this.hass = opts.hass || null; // HomeAssistant object (for musicflow/backend_config)
    this.url = opts.url || null; // backend base url, e.g. http://host:3000
    this.apiKey = opts.apiKey || null;
    this.ws = null;
    this._listeners = new Map(); // event -> Set<cb>
    this._connected = false;
    this._pendingInit = null;
    this._reconnectTimer = null;
  }

  // ---- event subscription ----
  on(event, cb) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(cb);
    return () => this._listeners.get(event)?.delete(cb);
  }
  _emit(event, payload) {
    this._listeners.get(event)?.forEach((cb) => {
      try { cb(payload); } catch (e) { console.error("[mf-client] listener error", e); }
    });
  }

  get connected() { return this._connected; }

  // ---- bootstrap ----
  async init() {
    if (this.url && this.apiKey) return;
    if (!this.hass) throw new Error("MusicFlow 卡片: 缺少后端地址,且未提供 hass 以自动获取");
    if (this._pendingInit) return this._pendingInit;
    this._pendingInit = (async () => {
      const res = await this.hass.callWS({ type: "musicflow/backend_config" });
      const backends = (res && res.backends) || [];
      if (!backends.length) throw new Error("MusicFlow 集成未配置后端连接");
      const b = backends[0];
      this.url = b.url;
      this.apiKey = b.api_key;
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
  // Append ?token= to a /rest path (path may already carry a query).
  _withToken(path, qs) {
    const base = this._restBase();
    const sep = path.includes("?") ? "&" : "?";
    const token = `token=${encodeURIComponent(this.apiKey)}`;
    const extra = qs ? `${sep}${token}&${qs}` : `${sep}${token}`;
    return `${base}${path}${extra}`;
  }

  // ---- REST ----
  async rest(path, { method = "GET", body } = {}) {
    const url = this._withToken(path);
    const init = { method, headers: {} };
    if (body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`MusicFlow REST ${method} ${path} -> ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const data = await res.json();
      if (data && data["subsonic-response"]) return data["subsonic-response"];
      return data;
    }
    return res;
  }

  // ---- WebSocket ----
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    let ws;
    try {
      ws = new WebSocket(this._wsUrl());
    } catch (e) {
      console.error("[mf-client] WS open failed", e);
      this._scheduleReconnect();
      return;
    }
    this.ws = ws;
    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      this._handle(msg);
    };
    ws.onopen = () => { this._connected = true; this._emit("open"); };
    ws.onclose = () => { this._connected = false; this._emit("close"); this._scheduleReconnect(); };
    ws.onerror = () => { try { ws.close(); } catch {} };
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
    if (this.ws) { this.ws.onclose = null; try { this.ws.close(); } catch {} this.ws = null; }
  }

  _handle(msg) {
    switch (msg.type) {
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
      default:
        break;
    }
  }

  // ============ High-level peer actions (paths mirror frontend peerApi) ============
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
    return this.rest(this.peerPath(peerId, "/mute"), { method: "POST", body: { mute } });
  }
  setPlayMode(peerId, mode) {
    return this.rest(this.peerPath(peerId, "/play-mode"), { method: "POST", body: { mode } });
  }
  playQueue(peerId, items, startIndex = 0) {
    return this.rest(this.peerPath(peerId, "/queue/play"), { method: "POST", body: { items, startIndex } });
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
  setQueueIndex(peerId, index) {
    return this.rest(this.peerPath(peerId, "/queue/index"), { method: "POST", body: { index } });
  }
  getQueue(peerId) { return this.rest(this.peerPath(peerId, "/queue")); }
  getStatus(peerId) { return this.rest(this.peerPath(peerId, "/status")); }
  registerLocal(name) { return this.rest("/api/v1/peers/register", { method: "POST", body: { name } }); }
  heartbeat(peerId) { return this.rest(this.peerPath(peerId, "/heartbeat"), { method: "POST" }); }
  getPeers() { return this.rest("/api/v1/peers"); }

  // ============ Subsonic endpoints ============
  async search(query, { count = 20, offset = 0 } = {}) {
    return this.rest(`/search3?query=${encodeURIComponent(query)}&count=${count}&offset=${offset}`);
  }
  async getLyrics(songId) {
    return this.rest(`/getLyricsBySongId?id=${encodeURIComponent(songId)}&f=json`);
  }
  async star(songId) { return this.rest(`/star?id=${encodeURIComponent(songId)}`); }
  async unstar(songId) { return this.rest(`/unstar?id=${encodeURIComponent(songId)}`); }
  async getPlaylists() { return this.rest("/getPlaylists"); }
  async updatePlaylist(playlistId, { songIdsToAdd = [] } = {}) {
    const qs = songIdsToAdd.map((id) => `songIdToAdd=${encodeURIComponent(id)}`).join("&");
    return this.rest(`/updatePlaylist?playlistId=${encodeURIComponent(playlistId)}&${qs}`);
  }
  async getStarred() { return this.rest("/getStarred2"); }
  scrobble(songId) { return this.rest(`/scrobble?id=${encodeURIComponent(songId)}`).catch(() => {}); }

  // ============ Media URLs ============
  streamUrl(id) { return this._withToken(`/stream?id=${encodeURIComponent(id)}`); }
  coverUrl(coverId) {
    if (!coverId) return null;
    return this._withToken(`/getCoverArt?id=${encodeURIComponent(coverId)}&size=300`);
  }
}

// Convert a Subsonic child (search result / playlist entry) into a QueueItem
// the backend's /queue/play expects.
export function childToQueueItem(child) {
  const SUFFIX_MIME = {
    mp3: "audio/mpeg", flac: "audio/flac", wav: "audio/wav", aac: "audio/aac",
    ogg: "audio/ogg", m4a: "audio/mp4", opus: "audio/opus", wma: "audio/x-ms-wma", ape: "audio/ape",
  };
  const suffix = (child.suffix || "").toLowerCase();
  return {
    songId: child.id,
    title: child.title || "未知",
    artist: child.artist || undefined,
    album: child.album || undefined,
    albumId: child.albumId || undefined,
    mime: SUFFIX_MIME[suffix] || "audio/mpeg",
    coverArt: child.coverArt || (child.albumId ? `al-${child.albumId}` : undefined),
    duration: child.duration || undefined,
  };
}

// Parse a Subsonic getLyricsBySongId response into [{time: seconds, text}].
export function parseLyrics(subsonicResp) {
  const structured = subsonicResp?.lyricsList?.structuredLyrics || [];
  const first = structured.find((l) => l.synced) || structured[0];
  if (!first || !first.line) return [];
  return first.line
    .filter((l) => l.start !== undefined && l.start !== null)
    .map((l) => ({ time: Number(l.start) / 1000, text: l.value }))
    .sort((a, b) => a.time - b.time);
}
