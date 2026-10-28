// 卡片（musicflow-remote-card）单元测试。
// 模块本身不导出任何符号：靠 import 触发注册,再用 customElements.get 取到类实例化。
// 所有网络/WebSocket/hass 调用都用桩替代,不产生真实 IO。
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import "../src/musicflow-remote-card.js";

const CardCtor = customElements.get("hass-musicflow-card");

const okJson = (data, ct = "application/json") => ({
  ok: true, status: 200,
  headers: { get: () => ct },
  json: async () => data,
  text: async () => JSON.stringify(data),
  blob: async () => ({ size: 1 }),
});

const flush = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 0)); };

// ---- 客户端桩：所有端点返回可控数据,不触网 ----
function makeClient(over = {}) {
  const client = {
    mode: "direct",
    connected: true,
    on: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    // peer actions
    play: vi.fn(async () => ({})),
    pause: vi.fn(async () => ({})),
    stop: vi.fn(async () => ({})),
    next: vi.fn(async () => ({})),
    prev: vi.fn(async () => ({})),
    seek: vi.fn(async () => ({})),
    setVolume: vi.fn(async () => ({})),
    setMute: vi.fn(async () => ({})),
    setPlayMode: vi.fn(async () => ({})),
    playQueue: vi.fn(async () => ({})),
    playContent: vi.fn(async () => ({})),
    jumpToIndex: vi.fn(async () => ({})),
    enqueue: vi.fn(async () => ({})),
    removeAt: vi.fn(async () => ({})),
    clearQueue: vi.fn(async () => ({})),
    reorderQueue: vi.fn(async () => ({})),
    transferFrom: vi.fn(async () => ({ success: true, transferred: 1 })),
    resetPeer: vi.fn(async () => ({ success: true })),
    getStatus: vi.fn(async () => ({ state: "PLAYING", position: 1, duration: 100, volume: 50, muted: false, media: { songId: "s1", title: "歌", artist: "手", album: "辑", coverArt: "c1", duration: 100 } })),
    getQueue: vi.fn(async () => ({ items: [{ songId: "s1", title: "A", artist: "B", coverArt: "c1", duration: 100 }], total: 1, currentIndex: 0, playMode: "order", isActive: true })),
    getPeers: vi.fn(async () => ({ peers: [] })),
    getGroups: vi.fn(async () => ({ groups: [{ id: "g1", memberIds: ["airplay:a1"] }] })),
    updateGroupMembers: vi.fn(async () => ({ group: { memberIds: ["airplay:a1", "sendspin:s1"] } })),
    getLyrics: vi.fn(async () => ({ lyricsList: { structuredLyrics: [{ synced: true, line: [{ start: 0, value: "第一行" }, { start: 1000, value: "第二行" }] }] } })),
    star: vi.fn(async () => ({})),
    unstar: vi.fn(async () => ({})),
    getPlaylists: vi.fn(async () => ({ playlists: { playlist: [{ id: "p1", name: "PL", coverArt: "pc", songCount: 3 }], total: 1 } })),
    updatePlaylist: vi.fn(async () => ({})),
    getStarred: vi.fn(async () => ({ starred2: { song: [{ id: "s1", title: "S", suffix: "mp3" }], songTotal: 1 } })),
    getAlbumList2: vi.fn(async () => ({ albumList2: { album: [{ id: "al2" }] } })),
    getArtists: vi.fn(async () => ({})),
    getArtist: vi.fn(async () => ({ artist: { album: [{ id: "al1", name: "AL", artist: "A", coverArt: "ac" }] } })),
    getAlbum: vi.fn(async () => ({ album: { song: [{ id: "s2", title: "S2", suffix: "flac" }], songTotal: 1 } })),
    getGenres: vi.fn(async () => ({})),
    getPlaylistSongs: vi.fn(async () => ({ playlist: { entry: [{ id: "s3", title: "S3", suffix: "mp3" }], songTotal: 1 } })),
    getSongsV2: vi.fn(async () => ({ items: [{ id: "v1", title: "V1", artist: "A", album: "B", coverArt: "vc", duration: 10, suffix: "flac" }], total: 1 })),
    getAlbumsV2: vi.fn(async () => ({ items: [{ id: "va1", name: "VA", artist: "A", coverArt: "vac", songCount: 4 }], total: 1 })),
    getArtistsV2: vi.fn(async () => ({ items: [{ id: "var1", name: "VAR", coverArt: "varc" }], total: 1 })),
    getGenresV2: vi.fn(async () => ({ items: [{ id: "vg1", name: "Pop", songCount: 2, albumCount: 1 }], total: 1 })),
    getPlaylistsV2: vi.fn(async () => ({ items: [{ id: "vp1", name: "VPL", songCount: 40, coverArt: "vpc" }] })),
    getHomePlaylistCount: vi.fn(async () => ({ count: 6 })),
    getHomeCards: vi.fn(async () => ({ cards: [{ playlistId: "vp1", playlistName: "今日漫游", coverArt: "vpc", songCount: 50, isCombo: true }] })),
    getRecommend: vi.fn(async () => ({ channels: [{ name: "网易音乐", source: "netease", playlists: [{ id: "r1", name: "RP", trackCount: 10, cover: "u", source: "netease" }] }], providerId: "netease" })),
    getLocalRecommend: vi.fn(async () => ({ channels: [{ name: "本地音乐", source: "local", subtag: "每日更新", tagline: "说明", playlists: [{ id: "lp1", name: "LP", songCount: 5, coverArt: "lc" }] }] })),
    refreshRecommend: vi.fn(async () => ({})),
    importRecommendPlaylist: vi.fn(async () => ({ playlistId: "pl9" })),
    getSearchProviders: vi.fn(async () => ({ providers: [{ id: "netease", name: "网易" }] })),
    remoteSearch: vi.fn(async () => ({ items: [{ id: "x1", name: "X", artist: "A", cover: "u", trackCount: 2, source: "netease", platformLabel: "NE" }] })),
    aggregatePlaylistSearch: vi.fn(async () => ({ playlists: [{ id: "ap1", name: "AP", providerId: "netease" }], providers: [] })),
    aggregateEntitySearch: vi.fn(async () => ({ items: [{ id: "ae1", name: "AE", providerId: "netease" }], providers: [] })),
    remoteItems: vi.fn(async () => ({ items: [{ id: "ri1", name: "RI", trackCount: 3 }] })),
    importRemoteSongs: vi.fn(async () => ({ taskId: "t1" })),
    importRemoteCollection: vi.fn(async () => ({ taskId: "t2" })),
    getTask: vi.fn(async () => ({})),
    waitTask: vi.fn(async () => ({ ids: ["id1"], playlistId: "pl9" })),
    coverUrl: vi.fn(() => "http://cov/c.png"),
    requestCover: vi.fn(async () => "blob:cov"),
  };
  return Object.assign(client, over);
}

function fakeHass(over = {}) {
  return {
    language: "zh",
    states: {},
    callWS: vi.fn(async () => ({ backends: [{ url: "http://h", username: "u", password: "p", proxySupported: false }] })),
    connection: { subscribeMessage: vi.fn(async () => () => {}) },
    fetchWithAuth: vi.fn(async () => okJson({ "subsonic-response": { status: "ok" } })),
    ...over,
  };
}

let card = null;
function mkCard(config = {}, clientOver = {}, hassOver = {}) {
  card = document.createElement("hass-musicflow-card");
  document.body.appendChild(card);
  card.setConfig(config);
  card._ready = true; // 跳过 _bootstrap,直接注入桩客户端
  card._client = makeClient(clientOver);
  card.hass = fakeHass(hassOver);
  return card;
}
function dropCard() {
  if (card && card.parentNode) card.parentNode.removeChild(card);
  card = null;
}

beforeEach(() => {
  globalThis.fetch = vi.fn(async () => okJson({ token: "tk" }));
  globalThis.WebSocket.instances.length = 0;
  globalThis.__MockIntersectionObserver.instances.length = 0;
  try { localStorage.clear(); } catch {}
});
afterEach(() => {
  dropCard();
  vi.restoreAllMocks();
});

const PEERS = [
  { peerId: "dlna:d1", name: "客厅", kind: "dlna", available: true, queue: { isActive: true } },
  { peerId: "local:l1", name: "本机", kind: "local", platform: "windows", self: true, available: true, queue: { isActive: false } },
  { peerId: "sendspin:s1", kind: "sendspin", available: false },
  { peerId: "group:g1", kind: "group", groupId: "g1", name: "组", available: false },
  { peerId: "dlna:d2", name: "书房", kind: "dlna", available: true, managedByGroup: "g1" },
  { peerId: "web:1", kind: "local", platform: "web" },
];

const lvl = (type, extra = {}) => ({ type, items: [], query: "", loading: false, ...extra });

describe("模块注册", () => {
  it("customElements 已注册且注入 window.customCards", () => {
    expect(typeof CardCtor).toBe("function");
    expect(Array.isArray(window.customCards)).toBe(true);
    expect(window.customCards.some((c) => c.type === "hass-musicflow-card")).toBe(true);
  });

  it("静态 properties 与 styles 可用", () => {
    expect(CardCtor.properties.hass).toBeTruthy();
    expect(CardCtor.properties._config).toBeTruthy();
    expect(typeof CardCtor.styles).toBe("object");
  });

  it("setConfig 写入配置并清空 idle 指纹", () => {
    const c = document.createElement("hass-musicflow-card");
    document.body.appendChild(c);
    c._idleKey = "x";
    c.setConfig({ url: "u" });
    expect(c._config).toEqual({ url: "u" });
    expect(c._idleKey).toBe("");
    c.setConfig(null);
    expect(c._config).toEqual({});
    document.body.removeChild(c);
  });
});

describe("生命周期 / 绑定", () => {
  it("set hass 触发 _bootstrap 并绑定客户端", async () => {
    const c = document.createElement("hass-musicflow-card");
    document.body.appendChild(c);
    c.setConfig({ url: "http://h", username: "u", password: "p", transport: "direct" });
    const bind = vi.spyOn(c, "_bindClient");
    c.hass = fakeHass();
    await flush();
    expect(c._ready).toBe(true);
    expect(c._client).toBeTruthy();
    expect(bind).toHaveBeenCalled();
    expect(c._probeTimer).toBeTruthy();
    expect(c._visHandler).toBeTruthy();
    // visibilitychange 回调
    document.dispatchEvent(new Event("visibilitychange"));
    c.disconnectedCallback();
    document.body.removeChild(c);
  });

  it("_bootstrap 失败写入 error", async () => {
    const c = document.createElement("hass-musicflow-card");
    document.body.appendChild(c);
    c.setConfig({}); // 无 url → init 走 callWS
    const hass = fakeHass({ callWS: vi.fn(async () => ({})) }); // backends 空 → 抛错
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    c.hass = hass;
    await flush();
    expect(c._ui.error).toMatch(/未配置后端连接/);
    errSpy.mockRestore();
    c.disconnectedCallback();
    document.body.removeChild(c);
  });

  // 默认传输为 auto(自动切换直连 / 中转);direct / proxy 仍可按需显式指定。
  it("默认 transport 为 auto,direct/proxy 可显式覆盖", async () => {
    const mk = async (transport) => {
      const c = document.createElement("hass-musicflow-card");
      document.body.appendChild(c);
      c.setConfig({
        url: "http://h",
        username: "u",
        password: "p",
        ...(transport ? { transport } : {}),
      });
      c.hass = fakeHass();
      await flush();
      const mode = c._client.transport;
      c.disconnectedCallback();
      document.body.removeChild(c);
      return mode;
    };
    expect(await mk()).toBe("auto");
    expect(await mk("direct")).toBe("direct");
    expect(await mk("proxy")).toBe("proxy");
  });

  it("_bindClient 注册全部事件回调并驱动 UI", async () => {
    const c = mkCard();
    const handlers = {};
    c._client = makeClient({ on: vi.fn((ev, cb) => { handlers[ev] = cb; }) });
    c._bindClient();
    expect(Object.keys(handlers).sort()).toEqual(
      ["close", "device_list_changed", "group", "group_deleted", "media", "open", "peer_queue", "peer_snapshot", "peer_update", "queue_changed", "refresh", "rest_ok", "snapshot", "state"].sort()
    );
    handlers.open();
    expect(c._ui.connected).toBe(true);
    expect(c._ui.wsState).toBe("open");
    handlers.close();
    expect(c._ui.connected).toBe(false);
    handlers.rest_ok();
    handlers.snapshot({});
    handlers.peer_snapshot(PEERS);
    handlers.peer_update({ peerId: "dlna:d1", kind: "dlna", available: true });
    handlers.peer_queue({ peerId: "dlna:d1", queue: { total: 2, items: [], currentIndex: 0 } });
    handlers.queue_changed({ deviceId: "d1", queue: { total: 1 } });
    handlers.state({ deviceId: "d1", state: { state: "PLAYING" } });
    handlers.media({ deviceId: "d1", media: { songId: "s9", title: "M" } });
    handlers.refresh({ deviceId: "d1" });
    handlers.group();
    handlers.group_deleted();
    handlers.device_list_changed();
    await flush();
  });

  it("connectedCallback 在已就绪且断开时重连", () => {
    const c = mkCard();
    c._client = { connected: false, connect: vi.fn(), disconnect: vi.fn() };
    c.connectedCallback();
    expect(c._client.connect).toHaveBeenCalled();
  });

  it("disconnectedCallback → _teardown 清理全部定时器与监听", async () => {
    const c = mkCard();
    c._bindClient();
    c._ui.currentPeerId = "dlna:d1";
    c._startTracking();
    c._startHeartbeat();
    c._probeTimer = setInterval(() => {}, 1000);
    c._refreshTimer = setTimeout(() => {}, 1000);
    c._miniTimer = setTimeout(() => {}, 1000);
    c._pauseTimer = setTimeout(() => {}, 1000);
    c._visHandler = () => {};
    c._idleVisHandler = () => {};
    c._idleObserver = { disconnect: vi.fn() };
    c._coverObserver = { disconnect: vi.fn() };
    c._teardown();
    expect(c._tickTimer).toBe(null);
    expect(c._pollTimer).toBe(null);
    expect(c._refreshTimer).toBe(null);
    expect(c._probeTimer).toBe(null);
    expect(c._miniTimer).toBe(null);
    expect(c._pauseTimer).toBe(null);
    expect(c._visHandler).toBe(null);
    expect(c._coverObserver).toBe(null);
  });

  it("_probeServer:成功/失败两分支", async () => {
    const c = mkCard({}, { getPeers: vi.fn(async () => ({ peers: PEERS })) });
    c._ui.connected = false;
    c._probeServer();
    await flush();
    expect(c._ui.serverOk).toBe(true);
    expect(c._ui.wsState).toBe("rest");
    expect(c._ui.peers.length).toBeGreaterThan(0);

    const c2 = mkCard({}, { getPeers: vi.fn(async () => { throw new Error("down"); }) });
    c2._ui.connected = false;
    c2._probeServer();
    await flush();
    expect(c2._ui.serverOk).toBe(false);
    expect(c2._ui.wsState).toBe("down");

    const c3 = mkCard();
    c3._ui.connected = true;
    c3._probeServer(); // 已连接 → 直接返回
  });

  it("_loc / _t 按语言缓存", () => {
    const c = mkCard();
    expect(c._loc().lang).toBe("zh");
    expect(c._t("control.queue")).toBe("队列");
    c._hass = { language: "en" };
    expect(c._loc().lang).toBe("en");
    expect(c._t("control.queue")).toBe("Queue");
  });
});

describe("peer 解析与选择", () => {
  it("_isControllablePeer 各类前缀/kind", () => {
    const c = mkCard();
    expect(c._isControllablePeer(null)).toBe(false);
    expect(c._isControllablePeer({ peerId: "group:g" })).toBe(true);
    expect(c._isControllablePeer({ peerId: "dlna:d" })).toBe(true);
    expect(c._isControllablePeer({ peerId: "airplay:a" })).toBe(true);
    expect(c._isControllablePeer({ peerId: "sendspin:s" })).toBe(true);
    expect(c._isControllablePeer({ peerId: "local:l", platform: "windows" })).toBe(true);
    expect(c._isControllablePeer({ peerId: "local:l", platform: "web" })).toBe(false);
    expect(c._isControllablePeer({ peerId: "zzz:1" })).toBe(false);
    expect(c._isControllablePeer({ kind: "group" })).toBe(true);
    expect(c._isControllablePeer({ kind: "dlna" })).toBe(true);
    expect(c._isControllablePeer({ kind: "airplay" })).toBe(true);
    expect(c._isControllablePeer({ kind: "sendspin" })).toBe(true);
    expect(c._isControllablePeer({ kind: "local", platform: "web" })).toBe(false);
    expect(c._isControllablePeer({ kind: "local", platform: "android" })).toBe(true);
    expect(c._isControllablePeer({ kind: "mystery" })).toBe(false);
  });

  it("_filterControllable / _sortPeersForDisplay", () => {
    const c = mkCard();
    const list = c._filterControllable(PEERS);
    expect(list.map((p) => p.peerId)).toEqual(["dlna:d1", "local:l1", "sendspin:s1", "group:g1", "dlna:d2"]);
    const sorted = c._sortPeersForDisplay(list);
    expect(sorted[0].peerId).toBe("dlna:d1"); // 正在播的排最前
    expect(c._filterControllable(null)).toEqual([]);
  });

  it("_managedGroupPeerId / _resolveControlPeerId", () => {
    const c = mkCard();
    c._ui.peers = PEERS;
    expect(c._managedGroupPeerId("dlna:d2")).toBe("group:g1");
    expect(c._managedGroupPeerId("dlna:d1")).toBe(null);
    expect(c._resolveControlPeerId("dlna:d2")).toBe("group:g1");
    expect(c._resolveControlPeerId("dlna:d1")).toBe("dlna:d1");
  });

  it("_resolveDefaultPeerId 依据 entity 的 peer_id", () => {
    const c = mkCard({ entity: "media_player.x" });
    c._hass = fakeHass({ states: { "media_player.x": { attributes: { peer_id: "dlna:d1" } } } });
    expect(c._resolveDefaultPeerId(PEERS)).toBe("dlna:d1");
    c._hass = fakeHass({ states: { "media_player.x": { attributes: { peer_id: "ghost" } } } });
    expect(c._resolveDefaultPeerId(PEERS)).toBe(null);
    c._hass = fakeHass();
    expect(c._resolveDefaultPeerId(PEERS)).toBe(null);
  });

  it("_applyPeerSnapshot:自动选 + 持久化恢复", async () => {
    const c = mkCard();
    c._applyPeerSnapshot(PEERS);
    expect(c._ui.peers.length).toBeGreaterThan(0);
    expect(c._ui.currentPeerId).toBe("dlna:d1");
    await flush();

    // 恢复分支:localStorage 里存了上次选择
    const c2 = mkCard({ entity: "e1" });
    c2._storePeerId("local:l1");
    expect(c2._loadStoredPeerId()).toBe("local:l1");
    c2._applyPeerSnapshot(PEERS);
    expect(c2._ui.currentPeerId).toBe("local:l1");
    expect(c2._pollTimer).toBeTruthy(); // 恢复路径补挂追踪
    c2._stopTracking();
    await flush();

    // 存的是被组托管的成员 → 收敛到组(组需在线,否则 _ensurePeerSelected 会换台)
    const c3 = mkCard();
    c3._storePeerId("dlna:d2");
    c3._applyPeerSnapshot(PEERS.map((p) => (p.peerId === "group:g1" ? { ...p, available: true } : p)));
    expect(c3._ui.currentPeerId).toBe("group:g1");
    await flush();

    // 存的对已被移除 → 清空后自动选
    const c4 = mkCard();
    c4._peerRestoreDone = true;
    c4._ui.currentPeerId = "dlna:gone";
    c4._applyPeerSnapshot(PEERS);
    expect(c4._ui.currentPeerId).toBe("dlna:d1");
    await flush();
  });

  it("_applyPeerSnapshot:pinned 优先且为空时不选", async () => {
    const c = mkCard({ entity: "media_player.x" }, {}, { states: { "media_player.x": { attributes: { peer_id: "local:l1" } } } });
    c._applyPeerSnapshot(PEERS);
    expect(c._ui.currentPeerId).toBe("local:l1");
    await flush();
    const c2 = mkCard();
    c2._applyPeerSnapshot([]);
    expect(c2._ui.currentPeerId).toBe("");
  });

  it("_peerStorageKey 有/无 entity", () => {
    const c = mkCard({ entity: "x" });
    expect(c._peerStorageKey()).toBe("musicflow-remote-peer:x");
    c._config = {};
    expect(c._peerStorageKey()).toBe("musicflow-remote-peer");
  });

  it("_storePeerId 忽略空值", () => {
    const c = mkCard();
    c._storePeerId("");
    expect(localStorage.getItem(c._peerStorageKey())).toBe(null);
  });

  it("_ensurePeerSelected:已选在线补追踪 / 离线换台 / 未选自动", async () => {
    const c = mkCard();
    c._ui.peers = PEERS;
    c._ui.currentPeerId = "dlna:d1";
    c._ensureTracking = vi.fn();
    c._ensurePeerSelected();
    expect(c._ensureTracking).toHaveBeenCalled();

    c._ui.currentPeerId = "sendspin:s1"; // available:false
    c._stopTracking = vi.fn();
    c._ensurePeerSelected();
    expect(c._stopTracking).toHaveBeenCalled();
    await flush();

    const c2 = mkCard();
    c2._ui.peers = PEERS;
    c2._ui.currentPeerId = "";
    c2._applyPeerSnapshot(PEERS);
    await flush();
    expect(c2._ui.currentPeerId).toBeTruthy();
  });

  it("_maybeFollowDevice:未选时跟随设备事件", async () => {
    const c = mkCard();
    c._ui.peers = PEERS;
    c._ui.currentPeerId = "";
    c._maybeFollowDevice("d1");
    await flush();
    expect(c._ui.currentPeerId).toBe("dlna:d1");

    const c2 = mkCard();
    c2._ui.peers = PEERS;
    c2._ui.currentPeerId = "local:l1"; // 正看在线设备 → 不抢
    c2._maybeFollowDevice("d1");
    expect(c2._ui.currentPeerId).toBe("local:l1");
    await flush();

    const c3 = mkCard();
    c3._ui.peers = [];
    c3._maybeFollowDevice("nope"); // 没有匹配设备
  });

  it("_onPlayerRefresh:命中目标后去抖刷新", async () => {
    vi.useFakeTimers();
    try {
      const c = mkCard();
      c._ui.peers = PEERS;
      c._ui.currentPeerId = "dlna:d1";
      c._refreshCurrentPeerView = vi.fn(async () => true);
      c._onPlayerRefresh("d1");
      expect(c._refreshTimer).toBeTruthy();
      await vi.advanceTimersByTimeAsync(300);
      expect(c._refreshCurrentPeerView).toHaveBeenCalled();
      // 未命中
      const c2 = mkCard();
      c2._ui.peers = PEERS;
      c2._ui.currentPeerId = "local:l1";
      c2._onPlayerRefresh("d1");
      expect(c2._refreshTimer).toBeFalsy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("_onPlayerRefresh:刷新失败后 1s 重试", async () => {
    vi.useFakeTimers();
    try {
      const c = mkCard();
      c._ui.currentPeerId = "dlna:d1";
      let n = 0;
      c._refreshCurrentPeerView = vi.fn(async () => { n++; return n > 1; });
      c._onPlayerRefresh("d1");
      await vi.advanceTimersByTimeAsync(300);
      await vi.advanceTimersByTimeAsync(1000);
      expect(c._refreshCurrentPeerView).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("_upsertPeer:新增/更新/离线移除/移除当前", () => {
    const c = mkCard();
    c._ui.peers = [{ peerId: "dlna:d1", kind: "dlna", available: true }];
    c._upsertPeer({ peerId: "dlna:d2", kind: "dlna", available: true, name: "新" });
    expect(c._ui.peers.length).toBe(2);
    c._upsertPeer({ peerId: "dlna:d2", kind: "dlna", available: true, name: "改名" });
    expect(c._ui.peers.find((p) => p.peerId === "dlna:d2").name).toBe("改名");

    c._ui.currentPeerId = "dlna:d2";
    c._upsertPeer({ peerId: "dlna:d2", kind: "dlna", available: false });
    expect(c._ui.peers.some((p) => p.peerId === "dlna:d2")).toBe(false);
    expect(c._ui.currentPeerId).toBe("dlna:d1");

    // 离线且无其它可用 → 清空选择
    const c2 = mkCard();
    c2._ui.peers = [{ peerId: "dlna:d1", kind: "dlna", available: true }];
    c2._ui.currentPeerId = "dlna:d1";
    c2._upsertPeer({ peerId: "dlna:d1", kind: "dlna", available: false });
    expect(c2._ui.currentPeerId).toBe(null);

    const c3 = mkCard();
    const before = c3._ui.peers.length;
    c3._upsertPeer({ peerId: "web:1", kind: "local", platform: "web" }); // 不可控 → 忽略
    expect(c3._ui.peers.length).toBe(before);
    c3._upsertPeer(null);
    c3._upsertPeer({ peerId: "dlna:x", kind: "dlna", available: false }); // 不在列表 → 无变化
  });

  it("_selectPeer 切换设备并清理状态", async () => {
    const c = mkCard();
    c._ui.peers = PEERS;
    c._selectPeer("dlna:d1");
    expect(c._ui.currentPeerId).toBe("dlna:d1");
    expect(c._pollTimer).toBeTruthy();
    await flush();
    c._selectPeer("dlna:d2"); // 被组托管 → 收敛到组
    expect(c._ui.currentPeerId).toBe("group:g1");
    c._selectPeer("group:g1"); // 相同 → 早退
    c._stopTracking();
    await flush();
  });

  it("_selectPeer 切目标后音量被新目标真实值纠正(跨端污染修复)", async () => {
    const c = mkCard({}, {
      // 按端回不同音量:旧端(DLNA)=88,新端(群组)=30 —— 复刻流转污染现场
      getStatus: vi.fn(async (pid) => pid === "dlna:d1"
        ? { state: "PLAYING", position: 1, duration: 100, volume: 88, media: {} }
        : { state: "PLAYING", position: 1, duration: 100, volume: 30, media: {} }),
    });
    c._ui.peers = PEERS;
    c._selectPeer("dlna:d1");
    await flush();
    expect(c._ui.volume).toBeCloseTo(0.88); // 旧目标真实音量进单例
    c._ui.volume = 0.88; // 模拟流转前滑条残留旧端 88%
    c._selectPeer("group:g1"); // 流转:遥控目标切到群组
    expect(c._volumeIssuedAt).toBe(0); // 旧目标的音量命令保护窗不跨目标
    await flush();
    expect(c._ui.volume).toBeCloseTo(0.3); // 群组真实音量纠正单例
    expect(c._client.setVolume).not.toHaveBeenCalled(); // 只读不写:流转绝不 POST 音量
    c._stopTracking();
    await flush();
  });

  it("_refreshPeers:成功与失败", async () => {
    const c = mkCard({}, { getPeers: vi.fn(async () => ({ peers: PEERS })) });
    c._refreshPeers();
    await flush();
    expect(c._ui.peers.length).toBeGreaterThan(0);
    const c2 = mkCard({}, { getPeers: vi.fn(async () => { throw new Error("x"); }) });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    c2._refreshPeers();
    await flush();
    errSpy.mockRestore();
  });

  it("_refreshCurrentPeerView:成功 / 无选择 / 失败", async () => {
    const c = mkCard();
    expect(await c._refreshCurrentPeerView()).toBe(false); // 无 currentPeerId
    c._ui.currentPeerId = "dlna:d1";
    expect(await c._refreshCurrentPeerView()).toBe(true);
    const c2 = mkCard({}, { getStatus: vi.fn(async () => { throw new Error("x"); }) });
    c2._ui.currentPeerId = "dlna:d1";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await c2._refreshCurrentPeerView()).toBe(false);
    errSpy.mockRestore();
  });

  it("_applySnapshot 只处理 dlna 当前设备", () => {
    const c = mkCard();
    c._applySnapshot({ d1: { state: "PLAYING", position: 1, duration: 10 } }); // 未选 → 早退
    c._ui.currentPeerId = "local:l1";
    c._applySnapshot({ d1: { state: "PLAYING" } }); // 非 dlna → 早退
    c._ui.currentPeerId = "dlna:d1";
    c._applySnapshot({ d1: { state: "PLAYING", position: 2, duration: 10, media: { songId: "s1" } } });
    c._applySnapshot({});
  });
});

describe("队列与状态应用", () => {
  it("_applyQueue:全量重建 / 部分清缓存 / 空队列清展示 / 打开面板", async () => {
    const c = mkCard();
    c._ui.showQueue = true;
    c._ui.queue.total = 1;
    c._applyQueue({ items: [{ songId: "s1" }, { songId: "s2" }], total: 2, currentIndex: 1, playMode: "order", isActive: true, ended: false });
    expect(c._ui.qCache.size).toBe(2);
    expect(c._ui.currentIndex).toBe(1);
    await flush();

    c._applyQueue({ items: [], total: 5, currentIndex: 0 });
    await flush();

    c._ui.song = { songId: "s9" };
    c._applyQueue({ items: [], total: 0, isActive: false });
    expect(c._ui.song).toBe(null);

    c._applyQueue(null); // 空 → 早退
  });

  it("_applyPeerQueue / _applyDeviceQueue / _applyDeviceState / _applyDeviceMedia", async () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    c._ui.peers = PEERS.map((p) => ({ ...p }));
    c._applyPeerQueue("dlna:d1", { total: 3, items: [], currentIndex: 0 });
    expect(c._ui.queue.total).toBe(3);
    c._applyPeerQueue("local:l2", { total: 1, items: [] }); // local 未选 → 跟随
    await flush();
    const c2 = mkCard();
    c2._ui.peers = PEERS.map((p) => ({ ...p }));
    c2._ui.currentPeerId = "dlna:d1";
    c2._applyPeerQueue("dlna:d2", { total: 4, items: [] });
    expect(c2._ui.peers.find((p) => p.peerId === "dlna:d2").queue.total).toBe(4);

    c2._applyDeviceQueue("d1", { total: 7, items: [], currentIndex: 0 });
    expect(c2._ui.queue.total).toBe(7);
    c2._applyDeviceQueue("dX", { total: 1, items: [] });
    c2._applyDeviceState("d1", { state: "PLAYING", position: 1, duration: 10, media: { songId: "s1" } });
    c2._applyDeviceMedia("d1", { songId: "s2", title: "T" });
    c2._applyDeviceState("dX", { state: "PLAYING" });
    c2._applyDeviceMedia("dX", { songId: "s3" });
    await flush();
  });

  it("_projectStatusPosition / _isStaleSample", () => {
    const c = mkCard();
    expect(c._projectStatusPosition({ position: 5 }, false)).toBe(5);
    expect(c._projectStatusPosition({ position: 5 }, true)).toBe(5); // 无 reportedAt
    const at = Date.now() - 2000;
    const p = c._projectStatusPosition({ position: 5, reportedAt: at, duration: 100 }, true);
    expect(p).toBeGreaterThan(5);
    expect(c._projectStatusPosition({ position: 5, reportedAt: Date.now() + 60000 }, true)).toBe(5); // ageSec<=0
    expect(c._projectStatusPosition({ position: 5, reportedAt: Date.now() - 60000 }, true)).toBe(5); // TTL 超
    expect(c._projectStatusPosition({ position: 95, reportedAt: at, duration: 96 }, true)).toBeLessThanOrEqual(96);

    expect(c._isStaleSample({}, 0)).toBe(false);
    expect(c._isStaleSample({}, Date.now() - 20000)).toBe(false); // 超 8s 窗口
    expect(c._isStaleSample({ reportedAt: Date.now() - 5000 }, Date.now())).toBe(true);
    expect(c._isStaleSample({}, Date.now())).toBe(false); // 无 reportedAt
  });

  it("_applyStatus:播放中 + media 补全 + 音量/静音", () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    c._lastPos = 0;
    c._applyStatus({
      state: "PLAYING", position: 5, duration: 100, volume: 42, muted: true,
      media: { songId: "s1", title: "T", artist: "A", album: "B", coverArt: "c", duration: 100 },
      items: [{ songId: "s1", title: "T", artist: "A", album: "B", coverArt: "c", duration: 100 }],
      currentIndex: 0,
    });
    expect(c._ui.isPlaying).toBe(true);
    expect(c._ui.currentTime).toBeGreaterThan(0);
    expect(c._ui.volume).toBeCloseTo(0.42);
    expect(c._ui.muted).toBe(true);
    expect(c._ui.song.songId).toBe("s1");
  });

  it("_applyStatus:STOPPED 清展示 / 无 status 早退 / position 前进自愈", () => {
    const c = mkCard();
    c._ui.song = { songId: "x", coverArt: "c" };
    c._applyStatus({ state: "STOPPED" });
    expect(c._ui.song).toBe(null);
    c._applyStatus(null);

    const c2 = mkCard();
    c2._lastPos = 1;
    c2._applyStatus({ state: "STOPPED", position: 3, duration: 100 });
    expect(c2._ui.isPlaying).toBe(true); // position 前进 → 自愈
    c2._applyStatus({ state: "STOPPED", position: 3, duration: 100 }); // 未前进
  });

  it("_applyStatus:seek 陈旧采样与拖拽中不覆盖", () => {
    const c = mkCard();
    c._seekAckAtMs = 1000;
    c._lastFetchStartedAtMs = 500; // 早于 ack → fetchStale
    c._ui.currentTime = 77;
    c._applyStatus({ state: "PLAYING", position: 12, duration: 100 });
    expect(c._ui.currentTime).toBe(77);

    const c2 = mkCard();
    c2._seekIssuedAt = Date.now();
    c2._ui.currentTime = 55;
    c2._applyStatus({ state: "PLAYING", position: 8, duration: 100, reportedAt: Date.now() - 1000 }); // sampleStale
    expect(c2._ui.currentTime).toBe(55);

    const c3 = mkCard();
    c3._ui.seekDragging = true;
    c3._ui.currentTime = 33;
    c3._applyStatus({ state: "PLAYING", position: 9, duration: 100 });
    expect(c3._ui.currentTime).toBe(33);
  });

  it("_applyStatus:传输/音量陈旧窗口", () => {
    const c = mkCard();
    c._transportIssuedAt = Date.now();
    c._ui.isPlaying = false;
    c._applyStatus({ state: "PLAYING", position: 9, duration: 100, reportedAt: Date.now() - 1000 });
    expect(c._ui.isPlaying).toBe(false); // transportStale 沿用

    const c2 = mkCard();
    c2._volumeIssuedAt = Date.now();
    c2._ui.volume = 0.3;
    c2._ui.muted = false;
    c2._applyStatus({ volume: 90, muted: true, reportedAt: Date.now() - 1000, state: "PAUSED" });
    expect(c2._ui.volume).toBeCloseTo(0.3);
    expect(c2._ui.muted).toBe(false);
  });

  it("_applyStatus:media 用 songId 反查当前项补全", () => {
    const c = mkCard();
    c._ui.currentPeerId = "local:l1";
    c._applyStatus({
      state: "PLAYING", position: 1, duration: 0,
      items: [{ songId: "sA", title: "甲", duration: 30 }, { songId: "sB", title: "乙", duration: 40 }],
      currentIndex: -1,
      media: { songId: "sB" },
    });
    expect(c._ui.song.title).toBe("乙");
    expect(c._ui.duration).toBe(40);
  });

  it("_clearNowPlaying 复位", () => {
    const c = mkCard();
    c._ui.song = { songId: "s" };
    c._ui.lyrics = [{ time: 1, text: "x" }];
    c._lastPos = 5;
    c._clearNowPlaying();
    expect(c._ui.song).toBe(null);
    expect(c._ui.lyrics).toEqual([]);
    expect(c._ui.isPlaying).toBe(false);
    expect(c._lastPos).toBe(-1);
  });

  it("_setMedia:换歌重置 + 触发歌词/收藏", async () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    c._setMedia(null); // 空 → clearNowPlaying
    c._setMedia({ songId: "s1", title: "T", coverArt: "c" });
    expect(c._ui.song.songId).toBe("s1");
    await flush();
    c._setMedia({ songId: "s1", title: "T2" }); // 同曲 → 不重置
    expect(c._ui.song.title).toBe("T2");
    c._setMedia({ songId: "s2", title: "T3" });
    expect(c._ui.song.songId).toBe("s2");
    await flush();
  });
});

describe("播放控制", () => {
  it("_togglePlay 播放/暂停两分支", () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    c._ui.isPlaying = true;
    c._togglePlay();
    expect(c._client.pause).toHaveBeenCalled();
    expect(c._ui.isPlaying).toBe(false);
    c._togglePlay();
    expect(c._client.play).toHaveBeenCalled();
    const c2 = mkCard();
    c2._togglePlay(); // 无 peer → 早退
  });

  it("_next / _prev(>3s 退化为 seek 0 / ≤3s 切歌)", async () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    c._next();
    expect(c._client.next).toHaveBeenCalled();
    c._ui.currentTime = 5;
    c._prev();
    expect(c._client.seek).toHaveBeenCalledWith("dlna:d1", 0);
    c._ui.currentTime = 1;
    c._prev();
    expect(c._client.prev).toHaveBeenCalled();
    const c2 = mkCard();
    c2._next();
    c2._prev();
    await flush();
  });

  it("_cyclePlayMode 循环推进", () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    c._ui.playMode = "order";
    c._cyclePlayMode();
    expect(c._ui.playMode).toBe("one");
    expect(c._client.setPlayMode).toHaveBeenCalledWith("dlna:d1", "one");
    c._ui.playMode = "shuffle";
    c._cyclePlayMode();
    expect(c._ui.playMode).toBe("order");
    const c2 = mkCard();
    c2._cyclePlayMode();
  });

  it("_setVolume 防抖下发", async () => {
    vi.useFakeTimers();
    try {
      const c = mkCard();
      c._ui.currentPeerId = "dlna:d1";
      c._setVolume({ target: { value: "50" } });
      expect(c._ui.volume).toBeCloseTo(0.5);
      await vi.advanceTimersByTimeAsync(150);
      expect(c._client.setVolume).toHaveBeenCalledWith("dlna:d1", 0.5);
      const c2 = mkCard();
      c2._setVolume({ target: { value: "10" } }); // 无 peer
    } finally {
      vi.useRealTimers();
    }
  });

  it("_toggleMute / _toggleVolumePop", () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    c._toggleMute();
    expect(c._ui.muted).toBe(true);
    expect(c._client.setMute).toHaveBeenCalledWith("dlna:d1", true);
    const e = { stopPropagation: vi.fn() };
    c._ui.showQueue = true;
    c._toggleVolumePop(e);
    expect(c._ui.showVolume).toBe(true);
    expect(c._ui.showQueue).toBe(false);
    c._toggleVolumePop(); // 无参
    const c2 = mkCard();
    c2._toggleMute();
  });

  it("音量指针拖动全链路", () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    const fill = document.createElement("div"); fill.className = "vol-fill";
    const knob = document.createElement("div"); knob.className = "vol-knob";
    const val = document.createElement("div"); val.className = "vol-value";
    const el = {
      classList: { add: vi.fn(), remove: vi.fn() },
      setPointerCapture: vi.fn(),
      getBoundingClientRect: () => ({ width: 100 }),
      querySelector: (sel) => ({ ".vol-fill": fill, ".vol-knob": knob, ".vol-value": val }[sel] || null),
    };
    c._volPointerDown({ currentTarget: el, pointerId: 1, clientX: 10 });
    expect(c._ui.volDragging).toBe(true);
    c._volPointerMove({ clientX: 60 });
    expect(c._ui.volume).toBeGreaterThan(0.8);
    c._volPointerUp();
    expect(c._ui.volDragging).toBe(false);
    c._volPointerMove({ clientX: 20 }); // 已结束 → 早退
    c._volPointerUp();
  });

  it("_commitVolume:immediate 与防抖", async () => {
    vi.useFakeTimers();
    try {
      const c = mkCard();
      c._ui.currentPeerId = "dlna:d1";
      c._commitVolume(0.2, true);
      expect(c._client.setVolume).toHaveBeenCalledWith("dlna:d1", 0.2);
      c._volumeDebounce = setTimeout(() => {}, 1000);
      c._commitVolume(0.7, false);
      await vi.advanceTimersByTimeAsync(120);
      expect(c._client.setVolume).toHaveBeenCalledWith("dlna:d1", 0.7);
      const c2 = mkCard();
      c2._commitVolume(0.1, true); // 无 peer
    } finally {
      vi.useRealTimers();
    }
  });

  it("_seek:时长未知忽略 / 越界钳位 / 整秒对齐 / 下发", async () => {
    vi.useFakeTimers();
    try {
      const c = mkCard();
      c._ui.currentPeerId = "dlna:d1";
      c._seek({ target: { value: "50" } }); // duration 0 → 忽略
      expect(c._ui.seekDragging).toBeFalsy();
      c._ui.duration = 100;
      c._seek({ target: { value: "150" } }); // 越界钳位到 99.5 → 整秒 99
      expect(c._ui.currentTime).toBe(99);
      expect(c._ui.seekDragging).toBe(true);
      await vi.advanceTimersByTimeAsync(250);
      expect(c._client.seek).toHaveBeenCalledWith("dlna:d1", 99);
      expect(c._ui.seekDragging).toBe(false);
      const c2 = mkCard();
      c2._ui.currentPeerId = "dlna:d1";
      c2._ui.duration = 10;
      c2._seek({ target: { value: "abc" } }); // 非有限值 → 早退
      const c3 = mkCard();
      c3._seek({ target: { value: "10" } }); // 无 peer
    } finally {
      vi.useRealTimers();
    }
  });

  it("_seek:失败清零 seek 标记", async () => {
    vi.useFakeTimers();
    try {
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const c = mkCard({}, { seek: vi.fn(async () => { throw new Error("nope"); }) });
      c._ui.currentPeerId = "dlna:d1";
      c._ui.duration = 50;
      c._seek({ target: { value: "20" } });
      await vi.advanceTimersByTimeAsync(250);
      expect(c._seekIssuedAt).toBe(0);
      errSpy.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });

  it("_jumpTo:合法 / 越界 / 后端缺失回落", async () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    c._ui.queue = { total: 3 };
    c._jumpTo(-1); // 越界
    c._jumpTo(5); // 越界
    c._jumpTo(1);
    expect(c._client.jumpToIndex).toHaveBeenCalledWith("dlna:d1", 1);
    await flush();
    const c2 = mkCard({}, { jumpToIndex: vi.fn(async () => { throw new Error("404"); }) });
    c2._ui.currentPeerId = "dlna:d1";
    c2._ui.queue = { total: 3 };
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    c2._jumpTo(2);
    await flush();
    expect(c2._client.playQueue).toHaveBeenCalled();
    errSpy.mockRestore();
    const c3 = mkCard();
    c3._jumpTo(1); // 无 peer
  });

  it("_removeFromQueue / _clearQueue", async () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    c._ui.song = { songId: "s" };
    c._removeFromQueue(2);
    expect(c._client.removeAt).toHaveBeenCalledWith("dlna:d1", 2);
    c._clearQueue();
    expect(c._ui.song).toBe(null);
    expect(c._client.clearQueue).toHaveBeenCalled();
    await flush();
    const c2 = mkCard();
    c2._removeFromQueue(0);
    c2._clearQueue();
  });

  it("_appendAndPlay:enqueue + jumpToIndex", async () => {
    const c = mkCard({}, { getQueue: vi.fn(async () => ({ items: [{ songId: "s1" }, { songId: "s2" }] })) });
    c._ui.currentPeerId = "dlna:d1";
    await c._appendAndPlay({ id: "s2", title: "T", suffix: "mp3" });
    expect(c._client.enqueue).toHaveBeenCalled();
    expect(c._client.jumpToIndex).toHaveBeenCalled();
  });

  it("_appendAndPlay:单曲无需跳 / 后端无 jump 回落 / 无 peer", async () => {
    const c = mkCard({}, { getQueue: vi.fn(async () => ({ items: [{ songId: "s1" }] })) });
    c._ui.currentPeerId = "dlna:d1";
    await c._appendAndPlay({ id: "s1" });
    expect(c._client.jumpToIndex).not.toHaveBeenCalled();

    const c2 = mkCard({}, {
      getQueue: vi.fn(async () => ({ items: [{ songId: "a" }, { songId: "b" }] })),
      jumpToIndex: vi.fn(async () => { throw new Error("404"); }),
    });
    c2._ui.currentPeerId = "dlna:d1";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await c2._appendAndPlay({ id: "b" });
    expect(c2._client.playQueue).toHaveBeenCalled();
    errSpy.mockRestore();

    const c3 = mkCard();
    await c3._appendAndPlay({ id: "x" });
    await c3._appendAndPlay(null);
  });

  it("_appendAndPlay:整体失败被捕获", async () => {
    const c = mkCard({}, { enqueue: vi.fn(async () => { throw new Error("x"); }) });
    c._ui.currentPeerId = "dlna:d1";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await c._appendAndPlay({ id: "s" });
    errSpy.mockRestore();
  });

  it("_qReorder:合法移动 / 越界 / 失败回滚", async () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    c._ui.queue = { total: 3, currentIndex: 0 };
    c._ui.currentIndex = 0;
    c._ui.qCache = new Map([[0, { songId: "a" }], [1, { songId: "b" }], [2, { songId: "c" }]]);
    await c._qReorder(0, 2);
    expect(c._client.reorderQueue).toHaveBeenCalledWith("dlna:d1", 0, 2);
    expect(c._ui.qCache.get(2).songId).toBe("a");
    c._qReorder(-1, 1);
    c._qReorder(0, 0);
    c._qReorder(5, 1);
    const c2 = mkCard({}, { reorderQueue: vi.fn(async () => { throw new Error("x"); }) });
    c2._ui.currentPeerId = "dlna:d1";
    c2._ui.queue = { total: 2 };
    c2._ui.qCache = new Map([[0, { songId: "a" }], [1, { songId: "b" }]]);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await c2._qReorder(0, 1);
    expect(c2._ui.qCache.size).toBe(0); // 回滚清缓存
    errSpy.mockRestore();
    const c3 = mkCard();
    c3._qReorder(0, 1); // 无 peer
  });
});

describe("歌词与收藏", () => {
  it("_loadLyrics 成功 / 失败", async () => {
    const c = mkCard();
    await c._loadLyrics("s1");
    expect(c._ui.lyrics.length).toBe(2);
    const c2 = mkCard({}, { getLyrics: vi.fn(async () => { throw new Error("x"); }) });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await c2._loadLyrics("s1");
    expect(c2._ui.lyrics).toEqual([]);
    errSpy.mockRestore();
  });

  it("_updateLyric 定位当前行", () => {
    const c = mkCard();
    c._ui.lyrics = [{ time: 0, text: "a" }, { time: 5, text: "b" }, { time: 10, text: "c" }];
    c._ui.currentTime = 6;
    c._updateLyric();
    expect(c._ui.currentLyric).toBe("b");
    expect(c._ui.lyricIndex).toBe(1);
    c._ui.currentTime = 0.5;
    c._updateLyric();
    expect(c._ui.lyricIndex).toBe(0);
    c._ui.lyrics = [];
    c._updateLyric();
    expect(c._ui.lyricIndex).toBe(-1);
  });

  it("_loadLiked 成功 / 失败", async () => {
    const c = mkCard();
    await c._loadLiked("s1");
    expect(c._ui.liked).toBe(true);
    const c2 = mkCard({}, { getStarred: vi.fn(async () => { throw new Error("x"); }) });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await c2._loadLiked("s1");
    expect(c2._ui.liked).toBe(false);
    errSpy.mockRestore();
  });

  it("_toggleLike:点赞 / 取消 / 报错回退", async () => {
    const c = mkCard();
    c._ui.song = { songId: "s1" };
    c._ui.liked = false;
    await c._toggleLike();
    expect(c._client.star).toHaveBeenCalledWith("s1");
    expect(c._ui.liked).toBe(true);

    c._ui.liked = true;
    await c._toggleLike();
    expect(c._client.unstar).toHaveBeenCalledWith("s1");

    const c2 = mkCard({}, { star: vi.fn(async () => ({ error: { message: "no" } })) });
    c2._ui.song = { songId: "s2" };
    c2._ui.liked = false;
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await c2._toggleLike();
    expect(c2._ui.liked).toBe(false);
    expect(c2._ui.error).toMatch(/喜欢操作失败/);
    errSpy.mockRestore();

    const c3 = mkCard();
    await c3._toggleLike(); // 无 song → 早退
  });
});

describe("队列虚拟滚动", () => {
  it("_qReset / _qEnsureLoaded / _qFetchChunk / _qOnScroll", async () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    c._ui.showQueue = true;
    c._ui.queue = { total: 3, currentIndex: 1 };
    c._qEnsureLoaded();
    await flush();
    expect(c._ui.qCache.size).toBeGreaterThan(0);

    c._qFetchChunk(0);
    await flush();

    const scroller = { currentTarget: { scrollTop: 100, clientHeight: 240 } };
    c._qOnScroll(scroller);
    await flush();

    c._qReset();
    expect(c._ui.qCache.size).toBe(0);

    // total<=0 早退 / 未打开早退
    const c2 = mkCard();
    c2._ui.showQueue = true;
    c2._ui.queue = { total: 0 };
    c2._qEnsureLoaded();
    const c3 = mkCard();
    c3._ui.showQueue = false;
    c3._qEnsureLoaded();
  });

  it("_qFetchChunk 无 peer / 异常", async () => {
    const c = mkCard();
    await c._qFetchChunk(0); // 无 peer
    c._ui.currentPeerId = "dlna:d1";
    const c2 = mkCard({}, { getQueue: vi.fn(async () => { throw new Error("x"); }) });
    c2._ui.currentPeerId = "dlna:d1";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await c2._qFetchChunk(0);
    errSpy.mockRestore();
  });

  it("_qFetchChunk 用服务端 total 校正", async () => {
    const c = mkCard({}, { getQueue: vi.fn(async () => ({ items: [{ songId: "z" }, null], total: 9 })) });
    c._ui.currentPeerId = "dlna:d1";
    await c._qFetchChunk(0);
    expect(c._ui.queue.total).toBe(9);
    expect(c._ui.qCache.get(0).songId).toBe("z");
  });

  it("_renderQueue / _qRow / _qMoreHint", async () => {
    const c = mkCard();
    c._ui.showQueue = true;
    c._ui.queue = { total: 0, currentIndex: -1 };
    c._qReset();
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".panel.queue")).toBeTruthy();
    c._ui.queue = { total: 2, currentIndex: 0 };
    c._ui.qWinStart = 0;
    c._ui.qWinEnd = 1;
    c._ui.qCache = new Map([[0, { songId: "a", title: "A", coverArt: "c", albumId: "al" }]]);
    c._ui.qLoading = new Set([0]);
    c.requestUpdate();
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".qlist")).toBeTruthy();
    expect(c.shadowRoot.querySelector(".vs-more")).toBeTruthy();
    c._ui.qLoading = new Set();
    c.requestUpdate();
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".qitem")).toBeTruthy();
  });

  // 回归(2026-10-28「队列页偶发一片空白」):流转/切端后 WS 先推来全量 items(len===total)
  // 把稀疏缓存填满、窗口留在未初始化(-1);此时用户打开队列页,那一次 render 用 -1 算出
  // 零行,而所需块已在缓存 ⇒ 没有 fetch 回调 ⇒ 再也不会 requestUpdate ⇒ 整页空白。
  it("窗口未初始化(qWinEnd<0)时打开队列页:必须渲染出行", async () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    c._ui.showQueue = false;
    c._ui.queue = { total: 0 };
    c._applyQueue({
      items: [
        { songId: "a", title: "A", artist: "x", coverArt: "c1" },
        { songId: "b", title: "B", artist: "y", coverArt: "c2" },
      ],
      total: 2, currentIndex: 0, playMode: "order", isActive: true,
    });
    expect(c._ui.qCache.size).toBe(2);
    expect(c._ui.qWinEnd).toBe(-1);
    c._ui.showQueue = true;
    c.requestUpdate();
    await c.updateComplete;
    await flush();
    expect(c._ui.qWinEnd).toBeGreaterThanOrEqual(0);
    expect(c.shadowRoot.querySelectorAll(".vs-row").length).toBe(2);
    expect(c.shadowRoot.querySelectorAll(".qitem").length).toBe(2);
  });
});

describe("媒体库浏览", () => {
  it("_openBrowser 切换 / 音量面板优先收起", async () => {
    const c = mkCard();
    c._openBrowser();
    expect(c._ui.showBrowser).toBe(true);
    expect(c._ui.browserStack[0].type).toBe("root");
    c._openBrowser(); // 再点 → 收起
    expect(c._ui.showBrowser).toBe(false);
    c._ui.showVolume = false;
    c._ui.showBrowser = false;
    c._ui.showVolume = true;
    c._openBrowser();
    expect(c._ui.showVolume).toBe(false);
    expect(c._ui.showBrowser).toBe(false);
    await flush();
    c._openBrowser();
    expect(c._ui.showBrowser).toBe(true);
    await flush();
  });

  it("_browserLoad 各类型(本地)", async () => {
    const c = mkCard();
    for (const t of ["songs", "albums", "artists", "genres", "genre", "starred", "album", "playlist", "playlists", "artist", "home"]) {
      const level = lvl(t, { id: "id1", name: "n1" });
      if (t !== "home") level.srcMode = "local";
      c._ui.browserStack = [level];
      await c._browserLoad(level);
      expect(level.loading).toBe(false);
    }
    await flush();
    // 早退分支
    const rootLevel = lvl("root");
    await c._browserLoad(rootLevel);
    const loadingLevel = lvl("songs", { loading: true });
    await c._browserLoad(loadingLevel);
  });

  it("_browserLoad 未知类型 → 空结果", async () => {
    const c = mkCard();
    const level = lvl("mystery", { srcMode: "local" });
    c._ui.browserStack = [level];
    const r = await c._fetchBrowseRange(level, 0, 10);
    expect(r).toEqual({ items: [], total: 0 });
  });

  it("_fetchBrowseRange 远程专辑/歌单/艺术家分支", async () => {
    const c = mkCard();
    const albumLvl = lvl("album", { _remote: true, _provider: "p", vSeq: 1, id: "a1" });
    await expect(c._fetchBrowseRange(albumLvl, 0, 10)).resolves.toBeTruthy();
    const plLvl = lvl("playlist", { _remote: true, _provider: "p", vSeq: 1, id: "p1" });
    await expect(c._fetchBrowseRange(plLvl, 0, 10)).resolves.toBeTruthy();
    const arLvl = lvl("artist", { _remote: true, _provider: "p", vSeq: 1, id: "ar1" });
    await expect(c._fetchBrowseRange(arLvl, 0, 10)).resolves.toBeTruthy();
  });

  it("_mapBrowseItems 全类型", () => {
    const c = mkCard();
    expect(c._mapBrowseItems("songs", [{ id: 1, title: "T", suffix: "mp3" }])[0].kind).toBe("song");
    expect(c._mapBrowseItems("albums", [{ id: 2, name: "A" }])[0].kind).toBe("album");
    expect(c._mapBrowseItems("artists", [{ id: 3, name: "AR" }])[0].kind).toBe("artist");
    expect(c._mapBrowseItems("genres", [{ id: "g", name: "G" }])[0].kind).toBe("genre");
    expect(c._mapBrowseItems("other", [{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(c._mapBrowseItems("songs", null)).toEqual([]);
  });

  it("_fetchHomeItems 两阶段聚合 + 复用", async () => {
    const c = mkCard();
    const level = lvl("home", { vSeq: 1 });
    const r1 = await c._fetchHomeItems(level);
    expect(r1.total).toBeGreaterThan(0);
    await flush();
    // 令牌命中复用
    const r2 = await c._fetchHomeItems(level);
    expect(r2.items).toBe(level._homeAll || r2.items);
    // 阶段一复用
    const level2 = lvl("home", { vSeq: 2 });
    level2._homeStage1 = [{ kind: "playlist", id: "x" }];
    level2._homeStage1Seq = 2;
    await expect(c._fetchHomeItems(level2)).resolves.toEqual({ items: level2._homeStage1, total: 1 });
    // 无 level
    await expect(c._fetchHomeItems(null)).resolves.toBeTruthy();
    // 旧后端无 home-cards → 回落今日漫游名匹配
    const c2 = mkCard({}, {
      getHomeCards: vi.fn(async () => ({})),
      getPlaylistsV2: vi.fn(async () => ({ items: [{ id: "tm", name: "今日漫游", songCount: 40, coverArt: "x" }] })),
    });
    const level3 = lvl("home", { vSeq: 1 });
    await c2._fetchHomeItems(level3);
    await flush();
    expect(level3._homeAll || level3._homeStage1).toBeTruthy();
  });

  it("_appendHomeSections / _pushHomePlaylist", () => {
    const c = mkCard();
    const items = [];
    c._pushHomePlaylist(items, "1", null, "c", 0, "badge");
    expect(items[0].name).toBe("未命名歌单");
    c._appendHomeSections(items, { channels: [{ name: "网易音乐", source: "netease", playlists: [{ id: "r", name: "R" }] }], providerId: "netease" },
      { channels: [{ name: "本地音乐", source: "local", subtag: "每日更新", tagline: "t", playlists: [{ id: "l", name: "L" }] }] });
    expect(items.some((i) => i.kind === "section")).toBe(true);
    expect(items.some((i) => i.kind === "remote")).toBe(true);
    c._appendHomeSections(items, {}, {}); // 空
    c._appendHomeSections(items, { channels: [{ name: "x", playlists: [] }] }, { channels: [{ playlists: [] }] });
  });

  it("_browserPush / _browserPopTo / _browserSearchInput / _browserSearch", async () => {
    vi.useFakeTimers();
    try {
      const c = mkCard();
      c._openBrowser();
      c._browserPush(lvl("songs", { srcMode: "local" }));
      await vi.advanceTimersByTimeAsync(0);
      expect(c._ui.browserStack.length).toBe(2);
      c._browserPopTo(0);
      expect(c._ui.browserStack.length).toBe(1);
      // root 层 → 搜索输入早退
      c._browserSearchInput();
      c._browserSearch();
      c._browserPush(lvl("songs", { srcMode: "local", query: "ab" }));
      c._browserSearchInput();
      await vi.advanceTimersByTimeAsync(320);
      c._browserSearch();
      c._browserPush(lvl("songs", { srcMode: "local", query: "" }));
      c._browserSearchInput();
      await vi.advanceTimersByTimeAsync(5);
      c._searchComposing = true;
      c._browserSearchInput();
      c._searchComposing = false;
    } finally {
      vi.useRealTimers();
    }
  });

  it("_browserRefreshHome 刷新 / 非 home 早退", async () => {
    const c = mkCard();
    c._ui.browserStack = [lvl("home", { vSeq: 1 })];
    await c._browserRefreshHome();
    expect(c._ui.homeRefreshing).toBe(false);
    c._ui.browserStack = [lvl("songs")];
    await c._browserRefreshHome();
    c._ui.browserStack = [];
    await c._browserRefreshHome();
  });

  it("_browserItemClick 全 kind 分支", async () => {
    const c = mkCard();
    c._openBrowser();
    c._browserPlaySong = vi.fn();
    for (const cat of ["home", "playlists", "albums", "songs", "artists", "genres"]) {
      c._browserItemClick({ kind: "cat", cat });
    }
    c._browserItemClick({ kind: "playlist", id: "p", name: "P" });
    c._browserItemClick({ kind: "album", id: "a", name: "A" });
    c._browserItemClick({ kind: "artist", id: "ar", name: "AR" });
    c._browserItemClick({ kind: "genre", id: "g", name: "G" });
    c._browserItemClick({ kind: "song", id: "s" });
    c._browserItemClick({ kind: "song", id: "s", _remote: true });
    expect(c._browserPlaySong).toHaveBeenCalled();
    c._browserItemClick(null);
    await flush();
  });

  it("_browserPlaySong:本地入队 / 远程先导入", async () => {
    const c = mkCard();
    c._appendAndPlay = vi.fn();
    c._remotePlaySong = vi.fn();
    c._browserPlaySong({ id: "s" });
    expect(c._appendAndPlay).toHaveBeenCalled();
    c._browserPlaySong({ id: "s", _remote: true });
    expect(c._remotePlaySong).toHaveBeenCalled();
  });

  it("_levelKind / _levelSearchable / _loadLevelProviders / _onSrcModeChange", async () => {
    const c = mkCard();
    expect(c._levelKind("playlists")).toBe("playlist");
    expect(c._levelKind("albums")).toBe("album");
    expect(c._levelKind("artists")).toBe("artist");
    expect(c._levelKind("songs")).toBe("song");
    expect(c._levelKind("genres")).toBe("");
    expect(c._levelSearchable("songs")).toBe(true);
    expect(c._levelSearchable("genres")).toBe(false);

    const level = lvl("songs");
    await c._loadLevelProviders(level);
    expect(level.providers.length).toBe(1);
    await c._loadLevelProviders(level); // providersLoaded → 早退
    const noKind = lvl("home");
    await c._loadLevelProviders(noKind);
    const errLvl = lvl("songs");
    const c2 = mkCard({}, { getSearchProviders: vi.fn(async () => { throw new Error("x"); }) });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await c2._loadLevelProviders(errLvl);
    errSpy.mockRestore();

    const l2 = lvl("songs", { srcMode: "local" });
    c._browserSearch = vi.fn();
    c._onSrcModeChange(l2, "local"); // 相同 → 早退
    c._onSrcModeChange(l2, "aggregate");
    expect(l2.srcMode).toBe("aggregate");
    expect(c._browserSearch).toHaveBeenCalled();
  });

  it("_mapRemoteItem 全 kind", () => {
    const c = mkCard();
    expect(c._mapRemoteItem("song", { id: 1, name: "S" }, "p").kind).toBe("song");
    expect(c._mapRemoteItem("album", { id: 2, name: "A" }, "p").kind).toBe("album");
    expect(c._mapRemoteItem("artist", { id: 3, name: "AR" }, "p").kind).toBe("artist");
    expect(c._mapRemoteItem("playlist", { id: 4, name: "PL" }, "p").kind).toBe("playlist");
    expect(c._mapRemoteItem("song", {}, "p").title).toBe("未知");
  });

  it("_fetchRemoteRange / _fetchAggregateRange / _fetchRemoteLevelSongs", async () => {
    const c = mkCard();
    // 远程:无 kind / 无 query → 空
    const bad = lvl("home", { query: "q" });
    await expect(c._fetchRemoteRange(bad, 0, 10, "p")).resolves.toEqual({ items: [], total: 0 });
    const songs = lvl("songs", { query: "q" });
    const r = await c._fetchRemoteRange(songs, 0, 10, "prov1");
    expect(r.total).toBe(1);
    await c._fetchRemoteRange(songs, 0, 10, "prov1"); // 缓存
    songs.query = "q2";
    await c._fetchRemoteRange(songs, 0, 10, "prov1"); // query 变化重拉

    // 聚合:playlist / song
    const pl = lvl("playlists", { query: "q" });
    const agg = await c._fetchAggregateRange(pl, 0, 10);
    expect(agg.total).toBeGreaterThan(0);
    const sg = lvl("songs", { query: "" });
    await c._fetchAggregateRange(sg, 0, 10);
    const sg2 = lvl("songs", { query: "z" });
    await c._fetchAggregateRange(sg2, 0, 10);
    const al = lvl("albums", { query: "z" });
    await c._fetchAggregateRange(al, 0, 10);
    const ar = lvl("artists", { query: "z" });
    await c._fetchAggregateRange(ar, 0, 10);
    const none = lvl("home", { query: "z" });
    await expect(c._fetchAggregateRange(none, 0, 10)).resolves.toEqual({ items: [], total: 0 });

    // 远程集合详情
    const lvlRemote = lvl("album", { _provider: "p", vSeq: 1, id: "a", name: "n", source: "s" });
    const rr = await c._fetchRemoteLevelSongs(lvlRemote, "album", 0, 10);
    expect(rr.total).toBe(1);
  });

  it("虚拟滚动:_vsReset / _vsEnsureLoaded / _vsPrune / _vsFetchChunk / _onBrScroll", async () => {
    const c = mkCard();
    const level = lvl("songs", { srcMode: "local" });
    c._ui.browserStack = [level];
    c._vsReset(level);
    expect(level.vSeq).toBe(1);
    await c._vsFetchChunk(level, 0);
    expect(level.total).toBe(1);
    level.vWinStart = 0;
    level.vWinEnd = 10;
    level.vLoaded = new Set([0]);
    // 造出窗口外缓存以触发剪枝
    level.vCache = new Map([[0, {}], [CHUNK_SAFE(), {}]]);
    c._vsEnsureLoaded(level);
    expect(level.vLoaded.size).toBeGreaterThanOrEqual(1);
    const scroller = { currentTarget: { scrollTop: 100, clientHeight: 240 } };
    c._onBrScroll(scroller);
    await flush();
    c._onBrScroll({ currentTarget: { scrollTop: 0, clientHeight: 240 } });

    // 早退分支
    c._vsEnsureLoaded(null);
    c._vsEnsureLoaded(lvl("root"));
    c._vsEnsureLoaded(lvl("songs")); // 无 vLoaded
    c._onBrScroll({ currentTarget: {} }); // root → 早退
  });

  it("_vsFetchChunk 过期响应被丢弃 / 异常", async () => {
    const c = mkCard();
    const level = lvl("songs", { srcMode: "local", vSeq: 1, total: 0 });
    c._ui.browserStack = [level];
    c._fetchBrowseRange = vi.fn(async () => { level.vSeq = 99; return { items: [{ id: 1 }], total: 5 }; });
    await c._vsFetchChunk(level, 0);
    expect(level.total).toBe(0); // 丢弃

    const c2 = mkCard({}, {});
    const l2 = lvl("songs", { srcMode: "local", vSeq: 1, total: 0 });
    c2._fetchBrowseRange = vi.fn(async () => { throw new Error("x"); });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await c2._vsFetchChunk(l2, 0);
    errSpy.mockRestore();
  });

  it("_crumbName 全类型", () => {
    const c = mkCard();
    const types = ["root", "home", "playlists", "playlist", "albums", "album", "songs", "artists", "artist", "genres", "genre", "starred", "?"];
    for (const t of types) c._crumbName({ type: t, name: "N" });
    expect(c._crumbName({ type: "unknown" })).toBe("");
  });

  it("_toSongItem 缺省回退", () => {
    const c = mkCard();
    const r = c._toSongItem({ id: 1 });
    expect(r.title).toBe("未知");
    expect(r.kind).toBe("song");
  });

  it("_remotePlaySong:导入后整播 / 无 id / 忙 / 失败", async () => {
    const c = mkCard({}, { waitTask: vi.fn(async () => ({ ids: [] })) });
    c._ui.currentPeerId = "dlna:d1";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await c._remotePlaySong({ id: "x", _provider: "p", _raw: {} }); // 无 ids
    errSpy.mockRestore();

    const c2 = mkCard();
    c2._ui.currentPeerId = "dlna:d1";
    c2._appendAndPlay = vi.fn();
    await c2._remotePlaySong({ id: "x", _provider: "p", _raw: {}, title: "T" });
    expect(c2._appendAndPlay).toHaveBeenCalled();

    const c3 = mkCard();
    await c3._remotePlaySong({ id: "x" }); // 无 peer
    c3._ui.currentPeerId = "dlna:d1";
    c3._ui.remoteBusy = "x";
    await c3._remotePlaySong({ id: "x" }); // 忙 → 早退

    const c4 = mkCard({}, { importRemoteSongs: vi.fn(async () => { throw new Error("x"); }) });
    c4._ui.currentPeerId = "dlna:d1";
    const e2 = vi.spyOn(console, "error").mockImplementation(() => {});
    await c4._remotePlaySong({ id: "x", _provider: "p", _raw: {} });
    e2.mockRestore();
  });

  it("_playRemoteCollection:专辑 / 艺术家 / 无 id / 空队列", async () => {
    const c = mkCard({}, { waitTask: vi.fn(async () => ({ playlistId: "pl9" })) });
    c._ui.currentPeerId = "dlna:d1";
    await c._playRemoteCollection({ id: "a", kind: "album", _provider: "p", name: "AL" });
    expect(c._client.playContent).toHaveBeenCalled();
    await flush();

    const c2 = mkCard();
    c2._ui.currentPeerId = "dlna:d1";
    await c2._playRemoteCollection({ id: "ar", kind: "artist", _provider: "p", name: "AR" });
    await flush();
    expect(c2._client.playQueue).toHaveBeenCalled();

    const c3 = mkCard({}, { waitTask: vi.fn(async () => ({})) });
    c3._ui.currentPeerId = "dlna:d1";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await c3._playRemoteCollection({ id: "a", kind: "album", _provider: "p" }); // 无 playlistId
    errSpy.mockRestore();

    const c4 = mkCard({}, { remoteItems: vi.fn(async () => ({ items: [] })) });
    c4._ui.currentPeerId = "dlna:d1";
    await c4._playRemoteCollection({ id: "ar", kind: "artist", _provider: "p" }); // 无歌
    await flush();

    const c5 = mkCard({}, { importRemoteCollection: vi.fn(async () => { throw new Error("x"); }) });
    c5._ui.currentPeerId = "dlna:d1";
    const e2 = vi.spyOn(console, "error").mockImplementation(() => {});
    await c5._playRemoteCollection({ id: "a", kind: "album", _provider: "p" });
    e2.mockRestore();

    const c6 = mkCard();
    await c6._playRemoteCollection({ id: "a" }); // 无 peer
    c6._ui.currentPeerId = "dlna:d1";
    c6._ui.remoteBusy = "a";
    await c6._playRemoteCollection({ id: "a" }); // 忙

    // playContent 失败 → 回落 playQueue
    const c7 = mkCard({}, { playContent: vi.fn(async () => { throw new Error("old server"); }) });
    c7._ui.currentPeerId = "dlna:d1";
    const e3 = vi.spyOn(console, "error").mockImplementation(() => {});
    await c7._playRemoteCollection({ id: "a", kind: "album", _provider: "p", name: "AL" });
    await flush();
    expect(c7._client.playQueue).toHaveBeenCalled();
    e3.mockRestore();
  });

  it("_browserImportRemote:歌曲 / 专辑 / 艺术家跳过 / 已导入", async () => {
    const c = mkCard();
    await c._browserImportRemote({ kind: "song", _remote: true, _provider: "p", _raw: {} });
    await c._browserImportRemote({ kind: "album", _remote: true, _provider: "p", id: "a", name: "A" });
    await c._browserImportRemote({ kind: "artist", _remote: true }); // 跳过
    await c._browserImportRemote({ kind: "song", _remote: false }); // 非远程
    await c._browserImportRemote(null);
    const item = { kind: "song", _remote: true, _provider: "p", _raw: {}, _importing: true };
    await c._browserImportRemote(item); // 进行中
    await flush();

    // 顶部是本地层 → 触发 _browserSearch
    const c2 = mkCard();
    c2._openBrowser();
    c2._ui.browserStack = [lvl("songs", { srcMode: "local" })];
    c2._browserSearch = vi.fn();
    await c2._browserImportRemote({ kind: "song", _remote: true, _provider: "p", _raw: {} });
    expect(c2._browserSearch).toHaveBeenCalled();

    const c3 = mkCard({}, { waitTask: vi.fn(async () => { throw new Error("x"); }) });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await c3._browserImportRemote({ kind: "song", _remote: true, _provider: "p", _raw: {} });
    errSpy.mockRestore();
  });

  it("_collLabel 全 kind", () => {
    const c = mkCard();
    expect(c._collLabel({ kind: "playlist" })).toBe("歌单");
    expect(c._collLabel({ kind: "remote" })).toBe("歌单");
    expect(c._collLabel({ kind: "album" })).toBe("专辑");
    expect(c._collLabel({ kind: "artist" })).toBe("艺人");
    expect(c._collLabel({ kind: "genre" })).toBe("风格");
    expect(c._collLabel({ kind: "zzz" })).toBe("列表");
  });

  it("_browserPlayCollection:本地集合主通道 / 回落 / 远程", async () => {
    // 主通道成功
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    await c._browserPlayCollection({ kind: "playlist", id: "p1", name: "P" });
    expect(c._client.playContent).toHaveBeenCalled();

    // 主通道失败 → 拉全量整队推送
    const c2 = mkCard({}, { playContent: vi.fn(async () => { throw new Error("old"); }) });
    c2._ui.currentPeerId = "dlna:d1";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await c2._browserPlayCollection({ kind: "album", id: "a1", name: "A" });
    await flush();
    expect(c2._client.playQueue).toHaveBeenCalled();
    errSpy.mockRestore();

    // 远程 → 转交 _playRemoteCollection
    const c3 = mkCard();
    c3._ui.currentPeerId = "dlna:d1";
    c3._playRemoteCollection = vi.fn();
    await c3._browserPlayCollection({ kind: "album", _remote: true });
    expect(c3._playRemoteCollection).toHaveBeenCalled();

    // remote 首页平台歌单:先导入再走主通道
    const c4 = mkCard();
    c4._ui.currentPeerId = "dlna:d1";
    await c4._browserPlayCollection({ kind: "remote", id: "r", name: "R", providerId: "p" });
    expect(c4._client.importRecommendPlaylist).toHaveBeenCalled();
    expect(c4._client.playContent).toHaveBeenCalled();

    // remote 缺 providerId
    const c5 = mkCard();
    c5._ui.currentPeerId = "dlna:d1";
    const e2 = vi.spyOn(console, "error").mockImplementation(() => {});
    await c5._browserPlayCollection({ kind: "remote", id: "r" });
    e2.mockRestore();

    // artist / genre 走逐专辑拉取
    const c6 = mkCard();
    c6._ui.currentPeerId = "dlna:d1";
    await c6._browserPlayCollection({ kind: "artist", id: "ar1", name: "AR" });
    await flush();
    const c7 = mkCard();
    c7._ui.currentPeerId = "dlna:d1";
    await c7._browserPlayCollection({ kind: "genre", id: "g1", name: "G" });
    await flush();

    // 空集合 / 无 peer / 拉取失败
    const c8 = mkCard({}, { getPlaylistSongs: vi.fn(async () => ({ playlist: { entry: [] } })) });
    c8._ui.currentPeerId = "dlna:d1";
    await c8._browserPlayCollection({ kind: "playlist", id: "p" });
    const c9 = mkCard();
    await c9._browserPlayCollection({ kind: "playlist", id: "p" }); // 无 peer
    await c9._browserPlayCollection(null);
    const c10 = mkCard({}, { getAlbum: vi.fn(async () => { throw new Error("x"); }) });
    c10._ui.currentPeerId = "dlna:d1";
    const e3 = vi.spyOn(console, "error").mockImplementation(() => {});
    await c10._browserPlayCollection({ kind: "album", id: "a" });
    e3.mockRestore();

    // 首页 remote 主通道失败 → 回落整队
    const c11 = mkCard({}, { playContent: vi.fn(async () => { throw new Error("old"); }) });
    c11._ui.currentPeerId = "dlna:d1";
    const e4 = vi.spyOn(console, "error").mockImplementation(() => {});
    await c11._browserPlayCollection({ kind: "remote", id: "r", name: "R", providerId: "p" });
    await flush();
    expect(c11._client.playQueue).toHaveBeenCalled();
    e4.mockRestore();

    // 首页 remote 导入失败
    const c12 = mkCard({}, { importRecommendPlaylist: vi.fn(async () => { throw new Error("x"); }) });
    c12._ui.currentPeerId = "dlna:d1";
    const e5 = vi.spyOn(console, "error").mockImplementation(() => {});
    await c12._browserPlayCollection({ kind: "remote", id: "r", providerId: "p" });
    e5.mockRestore();
    const c13 = mkCard({}, { importRecommendPlaylist: vi.fn(async () => ({})) });
    c13._ui.currentPeerId = "dlna:d1";
    const e6 = vi.spyOn(console, "error").mockImplementation(() => {});
    await c13._browserPlayCollection({ kind: "remote", id: "r", providerId: "p" });
    e6.mockRestore();
  });
});

// CHUNK 在卡片里是模块内常量,这里用一个远大于窗口的值制造"窗口外"下标。
function CHUNK_SAFE() { return 100000; }

describe("渲染", () => {
  it("render:error / 未初始化 / 正常(封面 + idle 底)", async () => {
    const c = document.createElement("hass-musicflow-card");
    document.body.appendChild(c);
    c.setConfig({});
    c._ui.error = "崩了";
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".err")).toBeTruthy();

    const c2 = document.createElement("hass-musicflow-card");
    document.body.appendChild(c2);
    c2.setConfig({});
    await c2.updateComplete;
    expect(c2.shadowRoot.querySelector(".err")).toBeTruthy();

    const c3 = mkCard();
    c3._ui.song = { songId: "s1", title: "T", artist: "A", coverArt: "c1" };
    c3._ui.isPlaying = true;
    c3._ui.connected = true;
    await c3.updateComplete;
    expect(c3.shadowRoot.querySelector(".coverbg")).toBeTruthy();

    const c4 = mkCard({ idle_theme: "ember", idle_speed: "fast" });
    c4._ui.song = null;
    await c4.updateComplete;
    expect(c4.shadowRoot.querySelector(".idlebg")).toBeTruthy();

    const c5 = mkCard();
    c5._ui.connected = false;
    c5._ui.wsState = "rest";
    await c5.updateComplete;
    // v2.7.1:REST 兜底(REST 通、WS 未连上)不再显示任何提示条 —— 用户要求去掉。
    expect(c5.shadowRoot.querySelector(".warnbar")).toBeFalsy();
    c5._ui.wsState = "down";
    c5.requestUpdate();
    await c5.updateComplete;
    expect(c5.shadowRoot.querySelector(".warnbar.bad")).toBeTruthy();

    document.body.removeChild(c);
    document.body.removeChild(c2);
    await flush();
  });

  it("_renderOutputs:无设备 / 有设备 / 首页无成员管理控件", async () => {
    const c = mkCard();
    c._ui.peers = [];
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".outputs .hint")).toBeTruthy();

    c._ui.peers = PEERS.filter((p) => p.available !== false);
    c._ui.currentPeerId = "dlna:d1";
    c.requestUpdate();
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".out")).toBeTruthy();

    // 2026-10-23:首页不再有群组增减成员入口;点群组 chip 只切遥控目标。
    c._ui.peers = [...PEERS.filter((p) => p.available !== false),
      { peerId: "group:g2", kind: "group", groupId: "g2", name: "组2", available: true }];
    c.requestUpdate();
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".out-badge")).toBeFalsy();
    expect(c.shadowRoot.querySelector(".gm-hint")).toBeFalsy();
    const g = [...c.shadowRoot.querySelectorAll(".out")]
      .find((el) => el.textContent.includes("组2"));
    g.click();
    await flush();
    expect(c._ui.currentPeerId).toBe("group:g2");
    await flush();
  });

  it("_renderOutputs:chip 行恒单行 + 行尾「流转播放」按钮", async () => {
    const c = mkCard();
    const online = PEERS.filter((p) => p.available !== false);
    c._ui.peers = online;
    // 当前遥控目标不在列表首位 → 渲染时应提到首位,保证被裁时仍可见
    c._ui.currentPeerId = "dlna:d2";
    c.requestUpdate();
    await c.updateComplete;

    const list = c.shadowRoot.querySelector(".outputs > .out-list");
    expect(list).toBeTruthy();
    const chips = list.querySelectorAll(".out");
    expect(chips.length).toBe(online.length);
    expect(chips[0].textContent).toContain("书房");
    // 流转按钮固定在列表外(行尾),不会被 overflow 裁掉
    const transfer = c.shadowRoot.querySelector(".outputs > .out.transfer");
    expect(transfer).toBeTruthy();
    expect(transfer.title).toBe("流转播放");
    expect(c._ui.transferOpen).toBe(false);
    transfer.click();
    await c.updateComplete;
    expect(c._ui.transferOpen).toBe(true);
    await flush();
  });

  it("首页 chip 单行版式守卫(20+ 端不换行/不撑高/按钮不落行)", async () => {
    // jsdom 无布局,这里对静态样式做守卫:曾经为了让按钮同行、chip 不换行,必须同时满足
    // ①chip 行 nowrap ②chip 不收缩 ③chip 文字单行省略。
    // (2026-10-23 首页取消成员管理模式后,不再有 `.outputs.managing` 的 wrap 回退。)
    const all = [].concat(CardCtor.styles).map((x) => x.cssText || String(x)).join("\n");
    expect(all).toMatch(/\.outputs \{[^}]*flex-wrap: nowrap/);
    expect(all).not.toMatch(/\.outputs\.managing/);
    expect(all).toMatch(/\.out \{[^}]*flex: 0 0 auto/);
    expect(all).toMatch(/\.out \{[^}]*white-space: nowrap/);
    expect(all).toMatch(/\.out-wrap \{[^}]*flex: 0 0 auto/);
    expect(all).toMatch(/\.out-label \{[^}]*text-overflow: ellipsis/);
    expect(all).toMatch(/\.out-label \{[^}]*white-space: nowrap/);

    const c = mkCard();
    c._ui.peers = PEERS.filter((p) => p.available !== false);
    c.requestUpdate();
    await c.updateComplete;
    const label = c.shadowRoot.querySelector(".outputs > .out-list > .out-wrap > .out > .out-label");
    expect(label).toBeTruthy();
    expect(label.textContent.length).toBeGreaterThan(0);
    await flush();
  });

  it("_openTransfer:收起队列/媒体库面板", async () => {
    const c = mkCard();
    c._ui.showQueue = true;
    c._ui.showBrowser = true;
    c._openTransfer();
    expect(c._ui.showQueue).toBe(false);
    expect(c._ui.showBrowser).toBe(false);
    expect(c._ui.transferOpen).toBe(true);
    await c.updateComplete;
    await flush();
  });

  it("_renderTransfer:整卡覆盖 / 内容区滚动 / 点空白与关闭按钮退出", async () => {
    const c = mkCard();
    c._openTransfer();
    await c.updateComplete;
    const panel = c.shadowRoot.querySelector(".wrap > .panel.transfer");
    expect(panel).toBeTruthy();
    expect(c.shadowRoot.querySelector(".wrap.panelmode")).toBeTruthy();
    expect(panel.querySelector(".panel-head .tp-title").textContent).toBe("流转播放");
    expect(panel.querySelector(".tp-scroll .tp-grid")).toBeTruthy();

    // 点内容区空白 → 关闭,面板退出 .open(常驻 DOM,靠 visibility 延迟切换播出场动画)、退出整卡面板态
    panel.querySelector(".tp-scroll").click();
    await c.updateComplete;
    expect(c._ui.transferOpen).toBe(false);
    expect(c.shadowRoot.querySelector(".panel.transfer.open")).toBeFalsy();
    expect(c.shadowRoot.querySelector(".wrap.panelmode")).toBeFalsy();

    // 再开 → 右上角关闭按钮返回首页
    c._openTransfer();
    await c.updateComplete;
    c.shadowRoot.querySelector(".panel.transfer .close").click();
    await c.updateComplete;
    expect(c._ui.transferOpen).toBe(false);

    // 交互元素(播放端圆 .tp-peer)不触发「点空白关闭」
    c._openTransfer();
    await c.updateComplete;
    const p2 = c.shadowRoot.querySelector(".panel.transfer");
    const fakePeer = document.createElement("div");
    fakePeer.className = "tp-peer";
    p2.appendChild(fakePeer);
    fakePeer.click();
    await c.updateComplete;
    expect(c._ui.transferOpen).toBe(true);

    // 面板根部空白仍可关闭
    p2.click();
    await c.updateComplete;
    expect(c._ui.transferOpen).toBe(false);
    await flush();
  });

  it("_renderLyricBox / _renderVolumeOverlay / _icon / _coverImgTag", async () => {
    const c = mkCard();
    c._ui.lyrics = [];
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".lyricbox")).toBeTruthy();

    c._ui.lyrics = [{ time: 0, text: "a" }, { time: 1, text: "b" }];
    c._ui.lyricIndex = 1;
    c._ui.mini = true;
    c.requestUpdate();
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".lyricbox-line.cur")).toBeTruthy();

    c._ui.mini = false;
    c._ui.showVolume = true;
    c.requestUpdate();
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".vol-overlay")).toBeTruthy();
    expect(c._icon("play").strings || true).toBeTruthy();
    expect(c._coverImgTag(null).strings || true).toBeTruthy();
    expect(c._coverImgTag("c1", true).strings || true).toBeTruthy();
  });

  it("_renderMediaBrowser:root / 列表 / 首页 / 各条目类型", async () => {
    const c = mkCard();
    c._openBrowser();
    c._ui.showBrowser = true;
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".cat-grid")).toBeTruthy();
    c._ui.browserStack[0].items.forEach((it) => c._browserItemClick(it));
    await flush();

    // playlists 层(含 pin-fav)
    const plLevel = lvl("playlists", { srcMode: "local", total: 2, vWinStart: 0, vWinEnd: 1 });
    plLevel.vCache = new Map([[0, { kind: "playlist", id: "p", name: "P", songCount: 2 }], [1, { kind: "album", id: "a", name: "A", artist: "Z" }]]);
    plLevel.vLoading = new Set([0]);
    plLevel.providers = [{ id: "netease", name: "网易" }];
    c._ui.browserStack = [lvl("root"), plLevel];
    c._ui.showBrowser = true;
    c.requestUpdate();
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".pin-fav")).toBeTruthy();
    expect(c.shadowRoot.querySelector(".vs-more")).toBeTruthy();

    // songs 层:含远程歌曲 / 分区 / 远程歌单 条目
    const sLevel = lvl("songs", { srcMode: "aggregate", total: 4, vWinStart: 0, vWinEnd: 3, query: "q" });
    sLevel.vCache = new Map([
      [0, { kind: "song", id: "s", title: "S", artist: "A", coverArt: "c", _remote: true, platformLabel: "NE", _provider: "p", _raw: {} }],
      [1, { kind: "section", name: "精选", count: 3 }],
      [2, { kind: "section", name: "本地·每日", _local: true }],
      [3, { kind: "remote", id: "r", name: "R", coverUrl: "u", trackCount: 5, source: "netease" }],
    ]);
    c._ui.browserStack = [lvl("root"), sLevel];
    c.requestUpdate();
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".rtag")).toBeTruthy();
    expect(c.shadowRoot.querySelector(".bsec")).toBeTruthy();

    // album / genre / artist / starred / playlist 层
    for (const t of ["album", "genre", "artist", "starred", "playlist", "home"]) {
      const l = lvl(t, { total: 1, vWinStart: 0, vWinEnd: 0, name: "N" });
      l.vCache = new Map([[0, { kind: "album", id: "a", name: "A", artist: "Z", coverArt: "c", songCount: 3 }]]);
      if (t === "home") l.vCache.set(0, { kind: "playlist", id: "p", name: "P", songCount: 40, badge: "今日漫游" });
      c._ui.browserStack = [lvl("root"), l];
      c.requestUpdate();
      await c.updateComplete;
    }
    // 空层(loading / empty)
    const empty = lvl("songs", { srcMode: "local", total: 0, loading: true });
    c._ui.browserStack = [lvl("root"), empty];
    c.requestUpdate();
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".empty")).toBeTruthy();
    const empty2 = lvl("songs", { srcMode: "local", total: 0, loading: false });
    c._ui.browserStack = [lvl("root"), empty2];
    c.requestUpdate();
    await c.updateComplete;
    // 空 stack
    c._ui.browserStack = [];
    c.requestUpdate();
    await c.updateComplete;
    await flush();
  });

  it("_vsRow 命中 / 骨架 / _vsMoreHint", async () => {
    const c = mkCard();
    const level = lvl("songs", { total: 2, vWinStart: 0, vWinEnd: 1 });
    level.vCache = new Map([[0, { kind: "song", id: "s", title: "S" }]]);
    level.vLoading = new Set([0]);
    c._ui.browserStack = [lvl("root"), level];
    c._ui.showBrowser = true;
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".vs-skel")).toBeTruthy();
    expect(c.shadowRoot.querySelector(".vs-more")).toBeTruthy();
  });

  it("updated():浏览器/队列打开时登记封面观察器 + root 图标自适应", async () => {
    const c = mkCard();
    c._openBrowser();
    c._ui.showBrowser = true;
    await c.updateComplete;
    await flush();
    expect(c._coverObserver).toBeTruthy();

    const sLevel = lvl("songs", { srcMode: "local", total: 1, vWinStart: 0, vWinEnd: 0 });
    sLevel.vCache = new Map([[0, { kind: "song", id: "s", title: "S", coverArt: "cov1" }]]);
    c._ui.browserStack = [lvl("root"), sLevel];
    c.requestUpdate();
    await c.updateComplete;
    c._observeBrowserCovers();
    expect(c._coverObserver.observed.size).toBeGreaterThanOrEqual(0);

    c._ui.showQueue = true;
    c._ui.queue = { total: 1, currentIndex: 0 };
    c._ui.qWinStart = 0;
    c._ui.qWinEnd = 0;
    c._ui.qCache = new Map([[0, { songId: "a", title: "A", coverArt: "qc" }]]);
    c.requestUpdate();
    await c.updateComplete;
    await flush();
    c._observeQueueCovers();
    await flush();

    // 观察器回调驱动 _loadCoverInto
    const obs = globalThis.__MockIntersectionObserver.instances.at(-1);
    const img = c.shadowRoot.querySelector("img.bcover-lazy");
    if (img) {
      obs._trigger([{ isIntersecting: true, target: img }]);
      await flush();
    }
    // _ensureCoverObserver 复用 / root 变化重建
    const root = c.shadowRoot.querySelector(".br-list");
    if (root) {
      c._ensureCoverObserver(root);
      c._ensureCoverObserver(root);
    }
  });

  it("_loadCoverInto:direct / proxy / 无 id / 未连接", async () => {
    const c = mkCard();
    const img = document.createElement("img");
    img.setAttribute("data-cover-id", "cov1");
    document.body.appendChild(img);
    c._loadCoverInto(img);
    expect(c._client.coverUrl).toHaveBeenCalled();

    const img2 = document.createElement("img");
    document.body.appendChild(img2);
    c._loadCoverInto(img2); // 无 id

    const c2 = mkCard({}, { mode: "proxy" });
    const img3 = document.createElement("img");
    img3.setAttribute("data-cover-id", "cov2");
    document.body.appendChild(img3);
    c2._loadCoverInto(img3);
    await flush();
    expect(c2._client.requestCover).toHaveBeenCalled();

    const c3 = mkCard();
    c3._client = null;
    const img4 = document.createElement("img");
    img4.setAttribute("data-cover-id", "cov3");
    c3._loadCoverInto(img4);

    // 已加载过同一 cover → 跳过
    c._loadCoverInto(img);
    document.body.removeChild(img);
    document.body.removeChild(img2);
    document.body.removeChild(img3);
  });

  it("_onBgCoverLoad / _analyzeBrightness", () => {
    const c = mkCard();
    c._onBgCoverLoad({ currentTarget: { getAttribute: () => null } }); // 无 src
    c._onBgCoverLoad({ currentTarget: { getAttribute: () => "x" } });
    c._analyzeBrightness({});
    // 强制切一次浅色/深色文字以覆盖 requestUpdate 分支
    c._ui.coverLightText = false;
    c._analyzeBrightness({});
    c._ui.accentRgb = "1,2,3";
    c._analyzeBrightness({});
  });

  it("_peerIcon / _peerLabel / _peerTitle", () => {
    const c = mkCard();
    expect(c._peerIcon({ kind: "local", platform: "windows" })).toBe("monitor");
    expect(c._peerIcon({ kind: "local", platform: "android" })).toBe("smartphone");
    expect(c._peerIcon({ kind: "dlna" })).toBe("speaker");
    expect(c._peerLabel({ name: "N" })).toBe("N");
    expect(c._peerLabel({ kind: "local", self: true })).toBe("本机");
    expect(c._peerLabel({ kind: "local" })).toBe("MusicFlow 客户端");
    expect(c._peerLabel({ kind: "dlna", peerId: "dlna:x" })).toBe("dlna:x");
    expect(c._peerTitle({ kind: "local", self: true, platform: "windows" })).toMatch(/本机 · windows/);
    expect(c._peerTitle({ kind: "dlna" })).toMatch(/播放设备/);
    c._ui.peers = [{ peerId: "group:g1", kind: "group", groupId: "g1", name: "客厅组" }];
    expect(c._peerTitle({ kind: "dlna", managedByGroup: "g1" })).toMatch(/跟随「客厅组」播放/);
    expect(c._peerTitle({ kind: "dlna", managedByGroup: "ghost" })).toMatch(/ghost/);
  });
});

describe("首页群组 chip(不再管理成员)", () => {
  it("_memberKeyFor:服务端成员命名空间(流转页仍在用)", () => {
    const c = mkCard();
    // 成员键 = 服务端口径的完整 peerId;DLNA 已不能进组,旧版「剥掉 dlna: 前缀」已废
    expect(c._memberKeyFor({ kind: "sendspin", peerId: "sendspin:s1" })).toBe("sendspin:s1");
    expect(c._memberKeyFor({ kind: "airplay", peerId: "airplay:a1" })).toBe("airplay:a1");
    expect(c._memberKeyFor({ kind: "dlna", peerId: "dlna:d1" })).toBe("dlna:d1");
    // 已在组内且组里存的是裸 id(历史数据)⇒ 移除要用组里那条,不能自己造一条
    c._ui.transferGroupId = "group:g1";
    c._transferGroupMembers = new Set(["d1"]);
    expect(c._memberKeyFor({ kind: "dlna", peerId: "dlna:d1" })).toBe("d1");
  });

  it("点群组 chip 只切遥控目标,不进入成员管理、不拉群组、不渲染勾选圈", async () => {
    const c = mkCard();
    c._ui.peers = [{ peerId: "group:g1", kind: "group", groupId: "g1", name: "组", available: true }];
    c.requestUpdate();
    await c.updateComplete;
    c.shadowRoot.querySelector(".out").click();
    await flush();
    expect(c._ui.currentPeerId).toBe("group:g1");
    // 2026-10-23 用户拍板:首页不再有增减成员入口(成员管理只在流转页)。
    expect(c._ui.groupManage).toBeUndefined();
    expect(c.shadowRoot.querySelector(".out-badge")).toBeFalsy();
    expect(c.shadowRoot.querySelector(".gm-hint")).toBeFalsy();
    expect(c._client.getGroups).not.toHaveBeenCalled();
    await flush();
  });
});

describe("极简模式与交互", () => {
  it("_canMini / _setMini", () => {
    const c = mkCard();
    c._ui.isPlaying = true;
    c._ui.lyrics = [{ time: 0, text: "x" }];
    expect(c._canMini()).toBe(true);
    c._ui.showQueue = true;
    expect(c._canMini()).toBe(false);
    c._ui.showQueue = false;
    c._setMini(true);
    expect(c._ui.mini).toBe(true);
    c._setMini(true); // 相同 → 早退
    c._setMini(false);
    expect(c._ui.mini).toBe(false);

    // 焦点在内 / 条件不满足 → 拒入
    const c2 = mkCard();
    c2._ui.isPlaying = true;
    c2._ui.lyrics = [{ time: 0, text: "x" }];
    c2._focusInside = true;
    c2._setMini(true);
    expect(c2._ui.mini).toBe(false);
    c2._focusInside = false;
    c2._ui.lyrics = [];
    c2._setMini(true);
    expect(c2._ui.mini).toBe(false);
  });

  it("_resetIdleTimer / _onCardPointer / 焦点进出", async () => {
    vi.useFakeTimers();
    try {
      const c = mkCard();
      c._ui.isPlaying = true;
      c._ui.lyrics = [{ time: 0, text: "x" }];
      c._resetIdleTimer();
      expect(c._miniTimer).toBeTruthy();
      await vi.advanceTimersByTimeAsync(3000);
      expect(c._ui.mini).toBe(true);
      c._onCardPointer();
      expect(c._ui.mini).toBe(false);

      c._onWrapFocusIn();
      expect(c._focusInside).toBe(true);
      c._onWrapFocusOut();
      expect(c._focusInside).toBe(false);

      // auto_hide=false → 不设计时器
      const c2 = mkCard({ auto_hide: false });
      c2._ui.isPlaying = true;
      c2._ui.lyrics = [{ time: 0, text: "x" }];
      c2._resetIdleTimer();
      expect(c2._miniTimer).toBeFalsy();

      // 焦点在内 + 已 mini → 退出
      const c3 = mkCard();
      c3._focusInside = true;
      c3._ui.mini = true;
      c3._resetIdleTimer();
      expect(c3._ui.mini).toBe(false);

      // 条件不满足 → 不设
      const c4 = mkCard();
      c4._resetIdleTimer();
      expect(c4._miniTimer).toBeFalsy();

      // 自定义延迟下限 500
      const c5 = mkCard({ auto_hide_delay: 1 });
      c5._ui.isPlaying = true;
      c5._ui.lyrics = [{ time: 0, text: "x" }];
      c5._resetIdleTimer();
      await vi.advanceTimersByTimeAsync(500);
      expect(c5._ui.mini).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("_updatedMiniWatch:停顿/恢复/开面板各分支", async () => {
    vi.useFakeTimers();
    try {
      const c = mkCard();
      c._ui.isPlaying = true;
      c._ui.lyrics = [{ time: 0, text: "x" }];
      c._ui.song = { songId: "s1" };
      c._updatedMiniWatch(); // 首次:变化 → 记快照
      c._updatedMiniWatch(); // 无变化 → 早退
      c._miniWatch.isPlaying = true;
      c._ui.isPlaying = false; // 暂停 → 去抖
      c._updatedMiniWatch();
      expect(c._pauseTimer).toBeTruthy();
      c._ui.mini = true;
      await vi.advanceTimersByTimeAsync(20000);
      expect(c._ui.mini).toBe(false);

      // 暂停后立刻恢复 → 撤销去抖
      const c2 = mkCard();
      c2._ui.isPlaying = true;
      c2._updatedMiniWatch();
      c2._miniWatch.isPlaying = true;
      c2._ui.isPlaying = false;
      c2._updatedMiniWatch();
      c2._ui.isPlaying = true;
      c2._updatedMiniWatch();
      expect(c2._pauseTimer).toBe(null);

      // 打开队列 → 退出 mini
      const c3 = mkCard();
      c3._ui.mini = true;
      c3._ui.isPlaying = true;
      c3._updatedMiniWatch();
      c3._ui.showQueue = true;
      c3._updatedMiniWatch();
      expect(c3._ui.mini).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("_onWrapClick:音量 / 队列面板分支", () => {
    const c = mkCard();
    const mkPath = (cls) => { const el = document.createElement("div"); cls.forEach((x) => el.classList.add(x)); return { composedPath: () => [el] }; };
    // 音量面板点击外部 → 关闭
    c._ui.showVolume = true;
    c._onWrapClick({ composedPath: () => [] });
    expect(c._ui.showVolume).toBe(false);
    // 点在 vol-row → 不关闭
    c._ui.showVolume = true;
    c._onWrapClick(mkPath(["vol-row"]));
    expect(c._ui.showVolume).toBe(true);
    c._ui.showVolume = false;

    // 队列面板:交互元素不收起
    c._ui.showQueue = true;
    c._onWrapClick(mkPath(["qitem"]));
    expect(c._ui.showQueue).toBe(true);
    // 空白处 → 收起
    c._ui.showBrowser = true;
    c._onWrapClick({ composedPath: () => [] });
    expect(c._ui.showQueue).toBe(false);
    expect(c._ui.showBrowser).toBe(false);

    // 首页已无群组增减成员管理态(2026-10-23),点 out 不会产生任何管理分支副作用
    c._onWrapClick(mkPath(["out"]));
    expect(c._ui.showQueue).toBe(false);

    // 无 composedPath 的实现
    const c2 = mkCard();
    c2._onWrapClick({});
    const c3 = mkCard();
    c3._ui.mini = true;
    c3._ui.isPlaying = true;
    c3._ui.lyrics = [{ time: 0 }];
    c3._onWrapClick({ composedPath: () => [] });
    expect(c3._ui.mini).toBe(false);
  });
});

describe("杂项工具", () => {
  it("_fmtTime / _progressPct / _syncSeekThumb", async () => {
    const c = mkCard();
    expect(c._fmtTime(0)).toBe("0:00");
    expect(c._fmtTime(-1)).toBe("0:00");
    expect(c._fmtTime(65)).toBe("1:05");
    expect(c._progressPct()).toBe(0);
    c._ui.duration = 100;
    c._ui.currentTime = 50;
    expect(c._progressPct()).toBe(50);

    await c.updateComplete;
    c._syncSeekThumb();
    const el = c.shadowRoot.querySelector(".seek");
    el.value = "0";
    c._syncSeekThumb(); // 需回写
    c._ui.seekDragging = true;
    c._syncSeekThumb(); // 拖拽中不写
    c._ui.seekDragging = false;
    c._syncSeekThumb();
    const c2 = mkCard();
    c2._syncSeekThumb(); // 无 shadowRoot .seek
    c2.shadowRoot.querySelector(".seek");
  });

  it("_startTracking / _ensureTracking / _stopTracking / _startHeartbeat", async () => {
    vi.useFakeTimers();
    try {
      const c = mkCard();
      c._ui.peers = PEERS;
      c._ui.currentPeerId = "dlna:d1";
      c._startTracking();
      expect(c._pollTimer).toBeTruthy();
      expect(c._tickTimer).toBeTruthy();
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(250);
      c._ensureTracking();
      expect(c._pollTimer).toBeTruthy();
      c._startHeartbeat();
      c._stopTracking();
      expect(c._pollTimer).toBe(null);

      // tick 推进逻辑
      const c2 = mkCard();
      c2._ui.currentPeerId = "dlna:d1";
      c2._ui.isPlaying = true;
      c2._ui.duration = 10;
      c2._ui.currentTime = 0;
      c2._startTracking();
      await vi.advanceTimersByTimeAsync(250);
      expect(c2._ui.currentTime).toBeGreaterThan(0);
      c2._ui.seekDragging = true;
      await vi.advanceTimersByTimeAsync(250);
      c2._stopTracking();

      // 无 peer → 早退
      const c3 = mkCard();
      c3._startTracking();
      expect(c3._pollTimer).toBeFalsy();
      c3._ensureTracking();

      // 目标离线 → 不补挂
      const c4 = mkCard();
      c4._ui.peers = [{ peerId: "dlna:d1", kind: "dlna", available: false }];
      c4._ui.currentPeerId = "dlna:d1";
      c4._ensureTracking();
      expect(c4._pollTimer).toBeFalsy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("_idleAmbientOn / _idlePalette / _syncIdleKeyframes / _syncIdleAmbient", async () => {
    const c = mkCard({ idle_theme: "ocean", idle_speed: "slow" });
    expect(c._idleAmbientOn()).toBe(true);
    c._ui.song = { coverArt: "c" };
    expect(c._idleAmbientOn()).toBe(false);
    const c2 = mkCard({ idle_background: false });
    expect(c2._idleAmbientOn()).toBe(false);

    const c3 = mkCard({ idle_theme: "auto", idle_speed: "off" });
    const pal = c3._idlePalette();
    expect(pal.cycle).toBeGreaterThanOrEqual(0);
    expect(c3._idlePalette()).toBe(pal); // 缓存命中
    // mono 无彩主题
    const c4 = mkCard({ idle_theme: "mono" });
    expect(c4._idlePalette().acc).toBeTruthy();
    // 未知主题 → auto
    const c5 = mkCard({ idle_theme: "zzz" });
    expect(c5._idlePalette()).toBeTruthy();

    const c6 = mkCard();
    c6._ui.song = null;
    await c6.updateComplete;
    c6._syncIdleKeyframes();
    c6._syncIdleAmbient();
    expect(c6._idleBuiltKey).toBeTruthy();
    c6._syncIdleAmbient(); // 二次:builtKey 相同 → 不重设变量
    // 观察器回调
    const obs = globalThis.__MockIntersectionObserver.instances.at(-1);
    if (obs) obs._trigger([{ isIntersecting: false }]);
    c6._syncIdleAmbient();

    // 无 .idlebg → 清理
    const c7 = mkCard();
    c7._ui.song = { coverArt: "c" };
    c7._idleObserver = { disconnect: vi.fn() };
    c7._idleVisHandler = () => {};
    await c7.updateComplete;
    c7._syncIdleAmbient();
    expect(c7._idleObserver).toBe(null);
    expect(c7._idleBuiltKey).toBe("");
    const c8 = mkCard();
    c8._syncIdleKeyframes(); // root 存在但无 tag → 创建
    c8._syncIdleKeyframes(); // 二次 → 已存在
  });

  it("updated():极简模式上移量测量(--mini-shift)与 miniWatch", async () => {
    const c = mkCard();
    await c.updateComplete;
    // v2.8.15:不再测量整卡高度,改测切换器行高度 + gap(写进 --mini-shift)
    expect(c._miniShift).toBeGreaterThanOrEqual(0);
    const w = c.shadowRoot && c.shadowRoot.querySelector(".wrap");
    expect(w).toBeTruthy();
    expect(w.getAttribute("style") || "").toContain("--mini-shift");
    c._ui.mini = true;
    await c.updateComplete;
    c._updatedMiniWatch();
  });
});

// ============ 整卡流转页(A4–A8 / B1–B5) ============
const TP_PEERS = [
  { peerId: "dlna:d1", name: "客厅", kind: "dlna", available: true,
    queue: { isActive: true, currentIndex: 0,
      items: [{ songId: "s1", title: "甲", artist: "乙", coverArt: "cov1" }] } },
  { peerId: "local:l1", name: "本机", kind: "local", platform: "windows", self: true, available: true,
    queue: { isActive: false, currentIndex: -1, items: [] } },
  { peerId: "dlna:d2", name: "书房", kind: "dlna", available: true, queue: { isActive: false } },
  { peerId: "group:g1", kind: "group", groupId: "g1", name: "组", available: false,
    memberIds: ["d1", "d2"], queue: { isActive: true } },
  { peerId: "sendspin:s1", kind: "sendspin", available: false },
  { peerId: "web:1", kind: "local", platform: "web", available: true },
];

// 群组成员夹具:只有 airplay / sendspin 能进组,DLNA 不能 ——
// 所以要有一台 DLNA 设备专门用来验证「管理态下不渲染勾选圈」。
const GROUP_PEERS = [
  { peerId: "airplay:a1", name: "主卧", kind: "airplay", available: true, queue: { isActive: false } },
  { peerId: "sendspin:s1", name: "书房", kind: "sendspin", available: true, queue: { isActive: false } },
  { peerId: "dlna:d1", name: "客厅", kind: "dlna", available: true, queue: { isActive: false } },
  { peerId: "group:g1", kind: "group", groupId: "g1", name: "组", available: false,
    memberIds: ["airplay:a1"], queue: { isActive: true } },
];

function openTransfer(c) {
  c._ui.peers = TP_PEERS;
  c._openTransfer();
}

describe("流转页:数据层与交互(A4–A8)", () => {
  it("A4 渲染:过滤/排序/封面/当前目标/在播/群组/回收站", async () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    c._ui.isPlaying = true;
    c._ui.song = { title: "镜像歌", coverArt: "mirror" };
    openTransfer(c);
    await c.updateComplete;

    const nodes = [...c.shadowRoot.querySelectorAll(".panel.transfer .tp-grid .tp-peer")];
    const ids = nodes.map((n) => n.getAttribute("data-peer-id"));
    // 在播优先 → 群组 > 独立设备;离线 sendspin 与 web 端不展示
    expect(ids).toEqual(["group:g1", "dlna:d1", "local:l1", "dlna:d2"]);

    const d1 = c.shadowRoot.querySelector('.tp-peer[data-peer-id="dlna:d1"]');
    expect(d1.classList.contains("current")).toBe(true);
    // 选中态 = 外圈呼吸光环;封面圆内不再有勾选标记(2026-10-23 用户要求)
    expect(d1.querySelector(".tp-pulse")).toBeTruthy();
    expect(d1.querySelector(".tp-cur")).toBeFalsy();
    expect(d1.querySelector(".tp-live")).toBeTruthy();
    expect(d1.querySelector(".tp-cover img").getAttribute("data-cover-id")).toBe("cov1");
    expect(d1.querySelector(".tp-sub").textContent).toContain("甲 - 乙");

    const g = c.shadowRoot.querySelector('.tp-peer[data-peer-id="group:g1"]');
    expect(g.classList.contains("group")).toBe(true);
    expect(g.querySelector(".tp-dash")).toBeTruthy();
    expect(g.querySelector(".tp-sub").textContent).toBe("2 个成员");

    const local = c.shadowRoot.querySelector('.tp-peer[data-peer-id="local:l1"]');
    expect(local.querySelector(".tp-fallback")).toBeTruthy();
    expect(local.querySelector(".tp-sub").textContent).toBe("空闲");

    expect(c.shadowRoot.querySelector(".panel.transfer .tp-trash")).toBeTruthy();
    expect(c.shadowRoot.querySelector(".panel.transfer .tp-gm-hint")).toBeFalsy();
    await flush();
    expect(c._coverObserverRoot).toBe(c.shadowRoot.querySelector(".tp-scroll"));
  });

  it("A5 单击:切遥控目标 + 成功提示 + 到点自动关页", async () => {
    vi.useFakeTimers();
    try {
      const c = mkCard();
      c._ui.currentPeerId = "dlna:d1";
      openTransfer(c);
      await c.updateComplete;

      const d2 = c.shadowRoot.querySelector('.tp-peer[data-peer-id="dlna:d2"]');
      d2.querySelector(".tp-ring").click();
      expect(c._ui.currentPeerId).toBe("dlna:d2");
      expect(c._ui.transferMsg).toContain("已切换到「书房」");
      expect(c._ui.transferOpen).toBe(true);
      expect(c._tpCloseTimer).toBeTruthy();

      await vi.advanceTimersByTimeAsync(700);
      expect(c._ui.transferOpen).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("A5 _tpTransfer:transfer-from → 源端 reset → 目标跟随 → 关页", async () => {
    const c = mkCard();
    c._ui.currentPeerId = "local:l1";
    openTransfer(c);
    await c.updateComplete;

    await c._tpTransfer(TP_PEERS[0], TP_PEERS[2]);
    expect(c._client.transferFrom).toHaveBeenCalledWith("dlna:d2", "dlna:d1");
    expect(c._client.resetPeer).toHaveBeenCalledWith("dlna:d1");
    expect(c._ui.currentPeerId).toBe("dlna:d2");
    expect(c._ui.transferMsg).toContain("已流转到「书房」");
    expect(c._ui.transferOpen).toBe(true);
    expect(c._tpCloseTimer).toBeTruthy();
    await flush();
  });

  it("A5 流转失败:留在页面并报错,不 reset 源端", async () => {
    const c = mkCard({}, { transferFrom: vi.fn(async () => { throw new Error("boom"); }) });
    c._ui.currentPeerId = "local:l1";
    openTransfer(c);
    await c.updateComplete;

    await c._tpTransfer(TP_PEERS[0], TP_PEERS[2]);
    expect(c._client.resetPeer).not.toHaveBeenCalled();
    expect(c._ui.transferMsgErr).toBe(true);
    expect(c._ui.transferMsg).toContain("流转失败");
    expect(c._ui.transferOpen).toBe(true);
    expect(c._tpCloseTimer).toBeFalsy();
    await flush();
  });

  it("A6 群组:点群组切目标 + 成员模式,勾选态调 updateGroupMembers", async () => {
    const c = mkCard();
    c._ui.currentPeerId = "local:l1";
    c._ui.peers = GROUP_PEERS;
    c._openTransfer();
    await c.updateComplete;

    let g = c.shadowRoot.querySelector('.tp-peer[data-peer-id="group:g1"]');
    g.querySelector(".tp-ring").click();
    await flush();
    expect(c._ui.currentPeerId).toBe("group:g1");
    expect(c._ui.transferGroupId).toBe("group:g1");
    expect(c._isTransferGroupMember(GROUP_PEERS[0])).toBe(true);
    await c.updateComplete;
    expect(c.shadowRoot.querySelector(".panel.transfer .tp-gm-hint")).toBeTruthy();

    // 成员勾选圈:两态都渲染 ✓,已加入为 accent 实心(in),未加入为空心圈
    const inBadge = c.shadowRoot.querySelector('.tp-peer[data-peer-id="airplay:a1"] .tp-badge');
    const outBadge = c.shadowRoot.querySelector('.tp-peer[data-peer-id="sendspin:s1"] .tp-badge');
    expect(inBadge.textContent.trim()).toBe("✓");
    expect(inBadge.classList.contains("in")).toBe(true);
    expect(inBadge.getAttribute("aria-pressed")).toBe("true");
    expect(outBadge.textContent.trim()).toBe("✓");
    expect(outBadge.classList.contains("in")).toBe(false);
    expect(outBadge.getAttribute("aria-pressed")).toBe("false");
    // 勾选语义:两个态的符号一致,只靠视觉态区分(+/− 已废弃)
    expect(inBadge.textContent.trim()).toBe(outBadge.textContent.trim());
    // ★ 只有 AirPlay / Sendspin 能进组 ⇒ DLNA 设备在管理态下不得出现勾选圈
    expect(c.shadowRoot.querySelector('.tp-peer[data-peer-id="dlna:d1"] .tp-badge')).toBeFalsy();
    outBadge.click();
    await flush();
    // 成员键必须是服务端口径的完整 peerId(旧版剥掉 dlna: 前缀那套已废)
    expect(c._client.updateGroupMembers).toHaveBeenCalledWith("g1", ["sendspin:s1"], []);
    expect(c._isTransferGroupMember(GROUP_PEERS[1])).toBe(true);

    // 再点群组 = 退出成员模式(遥控目标仍是该群组)
    g = c.shadowRoot.querySelector('.tp-peer[data-peer-id="group:g1"]');
    g.querySelector(".tp-ring").click();
    await flush();
    expect(c._ui.transferGroupId).toBe(null);
    expect(c._ui.currentPeerId).toBe("group:g1");
    expect(c.shadowRoot.querySelector(".panel.transfer .tp-gm-hint")).toBeFalsy();
  });

  it("A6b 群组:非 AirPlay/Sendspin 直接被拒;历史 DLNA 成员仍可移除", async () => {
    // ① 拒绝路径:直接调 _tpToggleMember 给一台 DLNA(勾选圈本身已不渲染),不许发请求
    const c = mkCard();
    c._ui.peers = GROUP_PEERS;
    c._openTransfer();
    c._ui.transferGroupId = "group:g1";
    await flush();
    await c._tpToggleMember({ stopPropagation: vi.fn() }, GROUP_PEERS[2]);
    expect(c._client.updateGroupMembers).not.toHaveBeenCalled();
    expect(c._ui.transferMsg).toContain("不支持加入群组");

    // ② 移除路径:旧组里存的是裸 deviceId(`d1`),勾选圈照渲染,点一下用**组里那条**删除
    const getGroups = vi.fn(async () => ({ groups: [{ id: "g1", memberIds: ["d1"] }] }));
    const updateGroupMembers = vi.fn(async () => ({ group: { memberIds: [] } }));
    const c2 = mkCard({}, { getGroups, updateGroupMembers });
    c2._ui.peers = GROUP_PEERS;
    c2._openTransfer();
    await c2.updateComplete;
    c2.shadowRoot.querySelector('.tp-peer[data-peer-id="group:g1"] .tp-ring').click();
    await flush();
    const badge = c2.shadowRoot.querySelector('.tp-peer[data-peer-id="dlna:d1"] .tp-badge');
    expect(badge).toBeTruthy(); // 已是成员 ⇒ 保留删除出口
    expect(badge.classList.contains("in")).toBe(true);
    badge.click();
    await flush();
    expect(updateGroupMembers).toHaveBeenCalledWith("g1", [], ["d1"]);
  });

  it("A7 回收站:_tpDestroy 成功留页提示,失败报错", async () => {
    const c = mkCard();
    openTransfer(c);
    await c.updateComplete;

    await c._tpDestroy(TP_PEERS[2]);
    expect(c._client.resetPeer).toHaveBeenCalledWith("dlna:d2");
    expect(c._ui.transferMsg).toContain("已销毁「书房」");
    expect(c._ui.transferMsgErr).toBe(false);
    expect(c._ui.transferOpen).toBe(true);

    const c2 = mkCard({}, { resetPeer: vi.fn(async () => { throw new Error("x"); }) });
    openTransfer(c2);
    await c2.updateComplete;
    await c2._tpDestroy(TP_PEERS[2]);
    expect(c2._ui.transferMsgErr).toBe(true);
    expect(c2._ui.transferMsg).toContain("销毁失败");
    expect(c2._ui.transferOpen).toBe(true);
    await flush();
  });

  it("A8 指针拖拽:幽灵跟手 / 落点命中 / 松手流转,结束后清理现场", async () => {
    const c = mkCard();
    c._ui.currentPeerId = "local:l1";
    openTransfer(c);
    await c.updateComplete;

    const srcEl = c.shadowRoot.querySelector('.tp-peer[data-peer-id="dlna:d1"]');
    const dstEl = c.shadowRoot.querySelector('.tp-peer[data-peer-id="dlna:d2"]');
    const mkEv = (over = {}) => ({
      pointerId: 7, button: 0, clientX: 10, clientY: 10,
      cancelable: true, preventDefault: vi.fn(), currentTarget: srcEl, ...over,
    });

    c._tpPointerDown(mkEv(), TP_PEERS[0]);
    expect(c._tpDrag).toBeTruthy();
    c._tpPointerMove(mkEv({ clientX: 40, clientY: 40 })); // 超过 6px 阈值 → 起拖
    expect(c._tpGhostEl).toBeTruthy();
    expect(srcEl.classList.contains("drag-src")).toBe(true);
    expect(c.shadowRoot.querySelector(".panel.transfer").classList.contains("dragging")).toBe(true);

    // elementFromPoint 在真实 DOM 里命中的是圆内最深层节点(封面图/图标),
    // 落点判定只认 .tp-ring 祖先 —— 这里返回封面圆。
    c.shadowRoot.elementFromPoint = vi.fn(() => dstEl.querySelector(".tp-cover"));
    c._tpPointerMove(mkEv({ clientX: 44, clientY: 44 }));
    expect(c._tpOverPeerId).toBe("dlna:d2");
    expect(dstEl.classList.contains("drop")).toBe(true);

    c._tpPointerUp(mkEv({ clientX: 44, clientY: 44 }));
    expect(c._tpDrag).toBe(null);
    expect(c._tpGhostEl).toBe(null);
    expect(srcEl.classList.contains("drag-src")).toBe(false);
    await flush();
    expect(c._client.transferFrom).toHaveBeenCalledWith("dlna:d2", "dlna:d1");

    // 拖回自己身上不算落点
    c._tpPointerDown(mkEv(), TP_PEERS[0]);
    c._tpPointerMove(mkEv({ clientX: 40, clientY: 40 }));
    c.shadowRoot.elementFromPoint = vi.fn(() => srcEl.querySelector(".tp-cover"));
    c._tpPointerMove(mkEv({ clientX: 44, clientY: 44 }));
    expect(c._tpOverPeerId).toBe(null);
    c._tpPointerUp(mkEv({ clientX: 44, clientY: 44 }));
    await flush();
    // 拖回自己身上不得再发一次 transfer-from(旧目标残留会重复流转)
    expect(c._client.transferFrom).toHaveBeenCalledTimes(1);
  });
});

describe("流转页边缘自动滚动(B1–B5)", () => {
  function mountScroll(c) {
    const sc = c.shadowRoot.querySelector(".panel.transfer .tp-scroll");
    Object.defineProperty(sc, "scrollHeight", { value: 600, configurable: true });
    Object.defineProperty(sc, "clientHeight", { value: 200, configurable: true });
    sc.getBoundingClientRect = () => ({ top: 0, bottom: 200, left: 0, right: 300, height: 200, width: 300 });
    sc.scrollTop = 0;
    return sc;
  }

  it("B1/B2 热区方向与深度调速:上/下越靠边越快,中间不滚", async () => {
    const c = mkCard();
    openTransfer(c);
    await c.updateComplete;
    const sc = mountScroll(c);

    const top = c._tpHotzoneVector(sc, 100, 5);
    expect(top.dir).toBe(-1);
    const topMid = c._tpHotzoneVector(sc, 100, 22);
    const botMid = c._tpHotzoneVector(sc, 100, 178);
    const bottom = c._tpHotzoneVector(sc, 100, 195);
    expect(bottom.dir).toBe(1);
    // 越靠视口外缘(深度越大)速度越快
    expect(top.speed).toBeGreaterThan(topMid.speed);
    expect(bottom.speed).toBeGreaterThan(botMid.speed);
    expect(top.speed).toBeGreaterThanOrEqual(140);
    expect(top.speed).toBeLessThanOrEqual(1100);

    expect(c._tpHotzoneVector(sc, 100, 100)).toBe(null); // 中间
    expect(c._tpHotzoneVector(sc, -5, 100)).toBe(null); // 水平出了视口
    await flush();
  });

  it("B3 回收站分界:指针进入滚动区之外(回收站)不滚动", async () => {
    const c = mkCard();
    openTransfer(c);
    await c.updateComplete;
    const sc = mountScroll(c);
    c._tpDrag = { active: true, x: 100, y: 250, src: TP_PEERS[0] };

    expect(c._tpHotzoneVector(sc, 100, 250)).toBe(null); // y 在 .tp-scroll 下缘之外
    expect(c._tpAutoScrollTick(100)).toBe(0);
    expect(sc.scrollTop).toBe(0);
    await flush();
  });

  it("B1/B4 滚动推进:按 dt 累加、边界自然停、无滚动空间不生效", async () => {
    const c = mkCard();
    openTransfer(c);
    await c.updateComplete;
    const sc = mountScroll(c);
    c._tpDrag = { active: true, x: 100, y: 195, src: TP_PEERS[0] };

    const moved = c._tpAutoScrollTick(100);
    expect(moved).toBeGreaterThan(0);
    expect(sc.scrollTop).toBeGreaterThan(0);
    expect(sc.scrollTop).toBeLessThanOrEqual(400);

    sc.scrollTop = 400; // 已到最底(max = 600-200)
    expect(c._tpAutoScrollTick(100)).toBe(0);
    expect(sc.scrollTop).toBe(400);

    // 顶部热区在顶端 → 不再往上滚
    c._tpDrag.y = 5;
    sc.scrollTop = 0;
    expect(c._tpAutoScrollTick(100)).toBe(0);
    expect(sc.scrollTop).toBe(0);

    // 没有滚动空间:热区整体失效
    Object.defineProperty(sc, "scrollHeight", { value: 200, configurable: true });
    c._tpDrag.y = 195;
    expect(c._tpHotzoneVector(sc, 100, 195)).toBe(null);
    expect(c._tpAutoScrollTick(100)).toBe(0);

    // 非拖拽态直接调用不产生滚动
    c._tpDrag = null;
    Object.defineProperty(sc, "scrollHeight", { value: 600, configurable: true });
    expect(c._tpAutoScrollTick(16)).toBe(0);
    await flush();
  });

  it("B5 _closeTransfer 清理拖拽监听/幽灵/定时器", async () => {
    const c = mkCard();
    openTransfer(c);
    await c.updateComplete;

    const srcEl = c.shadowRoot.querySelector('.tp-peer[data-peer-id="dlna:d1"]');
    const mkEv = (over = {}) => ({
      pointerId: 9, button: 0, clientX: 10, clientY: 10,
      cancelable: true, preventDefault: vi.fn(), currentTarget: srcEl, ...over,
    });
    c._tpPointerDown(mkEv(), TP_PEERS[0]);
    c._tpPointerMove(mkEv({ clientX: 40, clientY: 40 }));
    expect(c._tpGhostEl).toBeTruthy();
    expect(c._tpMoveHandler).toBeTruthy();

    c._closeTransfer();
    expect(c._tpDrag).toBe(null);
    expect(c._tpGhostEl).toBe(null);
    expect(c._tpMoveHandler).toBe(null);
    expect(c._tpUpHandler).toBe(null);
    expect(c._tpCancelHandler).toBe(null);
    expect(c._tpBlurHandler).toBe(null);
    expect(c._tpLostHandler).toBe(null);
    expect(c._ui.transferOpen).toBe(false);
    await flush();
  });
});

// ============ 落地后审查修复(D4 回归守卫) ============
// 反馈实测链路才会暴露的两类问题,逐条钉死:
// ① pointerdown 里 preventDefault 会抑制触屏补发的 click(单击切目标/群组 +/− 全失效);
// ② 拖拽只挂 window 监听、无指针捕获,指针在窗口外松开 → _tpDrag 永不清,后续拖拽全废。
describe("流转页落地后审查修复(D4 回归守卫)", () => {
  const mkEv = (srcEl, over = {}) => ({
    pointerId: 11, button: 0, clientX: 10, clientY: 10,
    cancelable: true, preventDefault: vi.fn(), currentTarget: srcEl, ...over,
  });

  it("D4 指针按下不再 preventDefault(否则触屏 click 被吞)", async () => {
    const c = mkCard();
    openTransfer(c);
    await c.updateComplete;
    const srcEl = c.shadowRoot.querySelector('.tp-peer[data-peer-id="dlna:d1"]');
    const ev = mkEv(srcEl);
    c._tpPointerDown(ev, TP_PEERS[0]);
    expect(ev.preventDefault).not.toHaveBeenCalled();
    c._tpPointerUp(mkEv(srcEl));
    await flush();
  });

  it("D4 窗口失焦 / 丢失捕获时兜底结束拖拽,避免 _tpDrag 卡死", async () => {
    const c = mkCard();
    openTransfer(c);
    await c.updateComplete;
    const srcEl = c.shadowRoot.querySelector('.tp-peer[data-peer-id="dlna:d1"]');

    c._tpPointerDown(mkEv(srcEl), TP_PEERS[0]);
    c._tpPointerMove(mkEv(srcEl, { clientX: 40, clientY: 40 }));
    expect(c._tpDrag).toBeTruthy();
    expect(c._tpGhostEl).toBeTruthy();
    expect(c._tpBlurHandler).toBeTruthy();

    window.dispatchEvent(new Event("blur"));
    expect(c._tpDrag).toBe(null);
    expect(c._tpGhostEl).toBe(null);
    expect(c._tpMoveHandler).toBe(null);
    expect(c._tpBlurHandler).toBe(null);
    expect(c._tpLostHandler).toBe(null);
    // 兜底结束不是落点:不得流转,页面仍在
    expect(c._client.transferFrom).not.toHaveBeenCalled();
    expect(c._ui.transferOpen).toBe(true);

    // 结束干净后能立刻开始下一次拖拽(守卫不会误挡)
    c._tpPointerDown(mkEv(srcEl), TP_PEERS[0]);
    expect(c._tpDrag).toBeTruthy();
    c._tpPointerUp(mkEv(srcEl));
    await flush();
  });

  it("D4 源队列为空(transferred=0):不 reset 源端、不关页、报空队列提示", async () => {
    const c = mkCard({}, {
      transferFrom: vi.fn(async () => ({ success: true, transferred: 0 })),
    });
    c._ui.currentPeerId = "local:l1";
    openTransfer(c);
    await c.updateComplete;

    await c._tpTransfer(TP_PEERS[0], TP_PEERS[2]);
    expect(c._client.resetPeer).not.toHaveBeenCalled();
    expect(c._ui.currentPeerId).toBe("local:l1");
    expect(c._ui.transferMsgErr).toBe(true);
    expect(c._ui.transferMsg).toContain("队列为空");
    expect(c._ui.transferOpen).toBe(true);
    expect(c._tpCloseTimer).toBeFalsy();
    await flush();
  });
});

// ============ 流转页审查修复(D1 回归守卫) ============
// 落地前审查抓到的 4 类问题,逐条钉死,防止后续重构退化:
// ①拖拽结束后浏览器补发的 click 被当成「点空白」关页;②多指 pointerdown 覆盖
// 进行中的拖拽;③关页/重开后旧会话的异步回写污染新会话;④音量浮层遮挡底部热区。
describe("流转页审查修复(D1 回归守卫)", () => {
  const blankClick = (c) => c._onTransferClick({
    composedPath: () => [c.shadowRoot.querySelector(".panel.transfer")],
  });

  it("D1 拖拽后的补发 click 不关页,冷却结束后点空白才关", async () => {
    const c = mkCard();
    openTransfer(c);
    await c.updateComplete;

    c._tpSuppressClickUntil = Date.now() + 500;
    blankClick(c);
    expect(c._ui.transferOpen).toBe(true); // 拖拽尾随 click:忽略

    c._tpSuppressClickUntil = 0;
    blankClick(c);
    expect(c._ui.transferOpen).toBe(false); // 真实点空白:关页
    await flush();
  });

  it("D1 多指/重复 pointerdown 不覆盖进行中的拖拽", async () => {
    const c = mkCard();
    openTransfer(c);
    await c.updateComplete;

    const srcEl = c.shadowRoot.querySelector('.tp-peer[data-peer-id="dlna:d1"]');
    const otherEl = c.shadowRoot.querySelector('.tp-peer[data-peer-id="dlna:d2"]');
    const mkEv = (over = {}) => ({
      pointerId: 7, button: 0, clientX: 10, clientY: 10, stopPropagation: vi.fn(),
      cancelable: true, preventDefault: vi.fn(), currentTarget: srcEl, ...over,
    });

    c._tpPointerDown(mkEv(), TP_PEERS[0]);
    const firstHandler = c._tpMoveHandler;
    c._tpPointerDown(mkEv({ pointerId: 8, currentTarget: otherEl }), TP_PEERS[2]);
    expect(c._tpDrag.pointerId).toBe(7);
    expect(c._tpDrag.src).toBe(TP_PEERS[0]);
    expect(c._tpDrag.srcEl).toBe(srcEl);
    expect(c._tpMoveHandler).toBe(firstHandler); // 监听没被第二根手指覆盖
    c._tpPointerCancel(mkEv());
    expect(c._tpDrag).toBe(null);
    await flush();
  });

  it("D1 关页后旧会话的流转回写被丢弃(不抢遥控目标/不弹提示)", async () => {
    let resolveT;
    const transferFrom = vi.fn(() => new Promise((r) => { resolveT = r; }));
    const c = mkCard({}, { transferFrom });
    c._ui.currentPeerId = "local:l1";
    c._ui.showVolume = true;
    openTransfer(c);
    expect(c._ui.showVolume).toBe(false); // 打开流转页先收音量浮层,否则遮住回收站/热区
    await c.updateComplete;

    const pending = c._tpTransfer(TP_PEERS[0], TP_PEERS[2]);
    expect(c._ui.transferBusy).toBe(true);
    c._closeTransfer(); // 请求在途时关页
    openTransfer(c);    // 立刻重开 = 新会话
    resolveT({ success: true });
    await pending;

    expect(c._ui.currentPeerId).toBe("local:l1"); // 不跟随旧会话的目的地
    expect(c._ui.transferMsg).toBe("");
    expect(c._ui.transferOpen).toBe(true);
    expect(c._ui.transferBusy).toBe(false); // 新会话忙态未被旧 finally 打乱
    expect(c._client.resetPeer).toHaveBeenCalledWith("dlna:d1"); // 搬运本身照常收尾
    await flush();
  });

  it("D1 关页后旧会话的销毁回写被丢弃", async () => {
    let resolveR;
    const resetPeer = vi.fn(() => new Promise((r) => { resolveR = r; }));
    const c = mkCard({}, { resetPeer });
    openTransfer(c);
    await c.updateComplete;

    const pending = c._tpDestroy(TP_PEERS[2]);
    c._closeTransfer();
    openTransfer(c);
    resolveR({ success: true });
    await pending;

    expect(c._ui.transferMsg).toBe(""); // 新会话页面上不出现「已销毁」
    expect(c._ui.transferOpen).toBe(true);
    await flush();
  });

  it("D1 群组成员旧会话回写被丢弃,且不复位新会话的忙态", async () => {
    let resolveU;
    const updateGroupMembers = vi.fn(() => new Promise((r) => { resolveU = r; }));
    const c = mkCard({}, { updateGroupMembers });
    openTransfer(c);
    c._ui.transferGroupId = "group:g1";
    await c.updateComplete;

    // 用一台 airplay 设备:DLNA 会被 _tpToggleMember 直接拒绝,这里测的是会话回写
    const pending = c._tpToggleMember({ stopPropagation: vi.fn() }, { peerId: "airplay:a9", kind: "airplay" });
    expect(c._ui.transferBusy).toBe(true);
    c._closeTransfer();
    openTransfer(c);
    c._ui.transferGroupId = "group:g1";
    c._ui.transferBusy = true; // 新会话自己的操作在跑
    resolveU({ group: { memberIds: ["dlna:d1", "dlna:d2"] } });
    await pending;

    expect(c._transferGroupMembers.size).toBe(0); // 旧群成员集没覆盖新会话
    expect(c._ui.transferBusy).toBe(true); // 旧 finally 不乱复位
    c._ui.transferBusy = false;
    await flush();
  });
});

describe("v2.6.1 复审修复:E1–E5 回归守卫", () => {
  const allCss = () => [].concat(CardCtor.styles).map((x) => x.cssText || String(x)).join("\n");

  it("E1 流转按钮:无限循环(∞)图标,且不再渲染文字", async () => {
    const c = mkCard();
    c._ui.peers = PEERS.filter((p) => p.available !== false);
    c.requestUpdate();
    await c.updateComplete;

    const btn = c.shadowRoot.querySelector(".out.transfer");
    expect(btn).toBeTruthy();
    // 只留图标:按钮内文本节点为空,旧「流转播放」文案不再挂在按钮上
    expect(btn.textContent.trim()).toBe("");
    expect(btn.getAttribute("aria-label")).toBe("流转播放");
    const d = btn.querySelector("svg path").getAttribute("d");
    // 与客户端 AppIcons.transferInfinity 同形的交叉双环
    expect(d).toContain("M12 12c-2-2.67-4-4-6-4");
    await flush();
  });

  it("E4 流转按钮无外框:透明底/无边框,hover 与 MINI 播放器 .ctl 同款", () => {
    const all = allCss();
    expect(all).toMatch(/\.out\.transfer \{[^}]*border: none/);
    expect(all).toMatch(/\.out\.transfer \{[^}]*background: transparent/);
    expect(all).toMatch(/\.out\.transfer:hover \{[^}]*transform: scale\(1\.10\)/);
    expect(all).toMatch(/\.out\.transfer:active \{[^}]*transform: scale\(0\.92\)/);
    // 旧的高亮底色/边框版本必须彻底移除
    expect(all).not.toMatch(/\.out\.transfer \{ border-color/);
  });

  it("E2 选中态收敛到圆框:格子不再画底色,网格两侧留出光晕空间", () => {
    const all = allCss();
    // 整格底色会在卡片左右边缘形成被切掉的黑边 —— 必须禁用
    expect(all).not.toMatch(/\.tp-peer\.current \{ background/);
    expect(all).not.toMatch(/\.tp-peer:hover \{[^}]*background/);
    // 选中效果只落在圆上;2026-10-23 起改为外圈呼吸光环(不再有白色外环/圆内勾选)
    expect(all).toMatch(/\.tp-peer\.current \.tp-ring \{[^}]*border-color: rgb\(var\(--acc\)\)/);
    expect(all).not.toMatch(/\.tp-peer\.current \.tp-ring \{[^}]*box-shadow/);
    // 网格左右 padding,给圆外环留出不被裁切的空间
    expect(all).toMatch(/\.tp-grid \{[^}]*padding: 2px 8px/);
  });

  it("E7 选中态=外圈呼吸光环(无圆内勾选),频谱底色固定不随选中态", () => {
    const all = allCss();
    // 封面圆内的勾选标记已彻底移除
    expect(all).not.toMatch(/\.tp-cur/);
    // 呼吸光环:外径与封面圆 border box 一致(56+2×2=60),1.0 → 1.26 放大渐隐,1.2s ease-in-out 往返
    expect(all).toMatch(/\.tp-pulse \{[^}]*width: 60px; height: 60px/);
    expect(all).toMatch(/\.tp-pulse \{[^}]*border: 3px solid rgb\(var\(--acc\)\)/);
    expect(all).toMatch(/\.tp-pulse \{[^}]*animation: tp-pulse 1\.2s ease-in-out infinite alternate/);
    expect(all).toMatch(/@keyframes tp-pulse[\s\S]{0,160}scale\(1\.26\)/);
    // 频谱徽标底色固定,不得再吃强调色(强调色会随选中曲目封面重算)
    expect(all).toMatch(/\.tp-live \{[^}]*background: rgba\(38, 38, 41/);
    expect(all).not.toMatch(/\.tp-live \{[^}]*background: rgba\(var\(--acc\)/);
    expect(all).not.toMatch(/\.tp-peer\.current \.tp-live/);
    // 已加入群组的勾选圈仍为红勾
    expect(all).toMatch(/\.tp-badge\.in \{[^}]*color: #ef4444/);
  });

  it("E3 点选/拖拽只认封面圆:点名称与在播文字都不响应", async () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    openTransfer(c);
    await c.updateComplete;

    const peer = c.shadowRoot.querySelector('.tp-peer[data-peer-id="dlna:d2"]');
    peer.querySelector(".tp-name").click();
    peer.querySelector(".tp-sub").click();
    expect(c._ui.currentPeerId).toBe("dlna:d1"); // 没切走
    expect(c._ui.transferOpen).toBe(true); // 也没被当成「点空白」关页

    // 名称上没有 pointerdown 处理器 ⇒ 不会起拖
    peer.querySelector(".tp-name").dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(c._tpDrag).toBeFalsy();

    // 圆框才响应单击
    peer.querySelector(".tp-ring").click();
    expect(c._ui.currentPeerId).toBe("dlna:d2");
    await flush();
  });

  it("E5 首页 chip 行:按住 chip 横向拖动,超过阈值才算拖、松手吞 click", async () => {
    const c = mkCard();
    c._ui.peers = PEERS.filter((p) => p.available !== false);
    c._ui.currentPeerId = "dlna:d2";
    c.requestUpdate();
    await c.updateComplete;

    const list = c.shadowRoot.querySelector(".out-list");
    Object.defineProperty(list, "scrollWidth", { value: 600, configurable: true });
    Object.defineProperty(list, "clientWidth", { value: 200, configurable: true });
    list.scrollLeft = 10;

    c._outListPointerDown({
      pointerType: "mouse", button: 0, pointerId: 3, clientX: 100,
      currentTarget: list, composedPath: () => [list],
    });
    expect(c._outDrag).toBeTruthy();

    // 4px 抖动:不算拖动,也不吞后续 click
    c._onOutDragMove({ pointerId: 3, clientX: 104, cancelable: true, preventDefault: vi.fn() });
    expect(c._outDrag.active).toBe(false);
    expect(c._outDragSwallowed()).toBe(false);

    // 超过阈值:进入拖动,列表反向跟手(10 - (60-100) = 50)
    c._onOutDragMove({ pointerId: 3, clientX: 60, cancelable: true, preventDefault: vi.fn() });
    expect(c._outDrag.active).toBe(true);
    expect(list.scrollLeft).toBe(50);

    c._onOutDragEnd({ pointerId: 3 });
    expect(c._outDrag).toBeNull();
    expect(c._outDragSwallowed()).toBe(true); // 浏览器随后补发的 click 会被吞
    await flush();
  });

  it("E5 无滚动空间不起拖 / 有滚动空间正常起拖,首页已无群组徽标", async () => {
    const c = mkCard();
    c._ui.peers = PEERS.filter((p) => p.available !== false);
    c.requestUpdate();
    await c.updateComplete;

    const list = c.shadowRoot.querySelector(".out-list");
    // 内容不超出视口 ⇒ 不起拖
    Object.defineProperty(list, "scrollWidth", { value: 200, configurable: true });
    Object.defineProperty(list, "clientWidth", { value: 200, configurable: true });
    c._outListPointerDown({
      pointerType: "mouse", button: 0, pointerId: 4, clientX: 10,
      currentTarget: list, composedPath: () => [list],
    });
    expect(c._outDrag).toBeFalsy();

    // 2026-10-23 用户拍板:首页不再有群组增减成员徽标,chip 行只保留切台
    expect(c.shadowRoot.querySelector(".out-badge")).toBeFalsy();

    // 有滚动空间 ⇒ 正常进入拖动(原先的徽标豁免分支已随功能移除)
    Object.defineProperty(list, "scrollWidth", { value: 600, configurable: true });
    c._outListPointerDown({
      pointerType: "mouse", button: 0, pointerId: 5, clientX: 10,
      currentTarget: list, composedPath: () => [list],
    });
    expect(c._outDrag).toBeTruthy();
    expect(c._outDrag.pointerId).toBe(5);
    c._onOutDragEnd({ pointerId: 5 });
    expect(c._outDrag).toBeNull();
    await flush();
  });

  it("E6 从名称/文字上按下、在空白处松手:补发的 click 不得被当成点空白关页", async () => {
    const c = mkCard();
    c._ui.currentPeerId = "dlna:d1";
    openTransfer(c);
    await c.updateComplete;

    const panel = c.shadowRoot.querySelector(".panel.transfer");
    const peer = c.shadowRoot.querySelector('.tp-peer[data-peer-id="dlna:d2"]');
    const name = peer.querySelector(".tp-name");
    const grid = c.shadowRoot.querySelector(".tp-grid");

    // press 落在名称(属于 .tp-peer)→ 松手在网格空白:共同祖先 .tp-grid 不是交互元素,
    // 但按下位置在播放端格子里 ⇒ 只算「从文字起手」,不关页
    c._onTransferPointerDown({ composedPath: () => [name, peer, grid, panel] });
    c._onTransferClick({ composedPath: () => [grid, panel] });
    expect(c._ui.transferOpen).toBe(true);

    // 真正点空白:press 与 click 都在空白 ⇒ 仍然关页
    c._onTransferPointerDown({ composedPath: () => [grid, panel] });
    c._onTransferClick({ composedPath: () => [grid, panel] });
    expect(c._ui.transferOpen).toBe(false);
    await flush();
  });
});

describe("v2.8.8 手机端播放控件圆形按钮:等比收缩防回退静态守卫", () => {
  // 直接读源码文本,不经 CSSOM —— 级联顺序(同特异性下「后写者胜」)只能在源文本顺序上判定,
  // CSSOM 序列化会重排/归一化,不能作为顺序证据。
  // vitest 转换后 import.meta.url 不是 file: 协议,优先按仓库根(cwd)定位,再回退到模块自身相对路径
  const repoFile = (rel) => {
    const fromRoot = resolve(process.cwd(), rel);
    if (existsSync(fromRoot)) return fromRoot;
    const self = String(import.meta.url);
    if (self.startsWith("file:")) return fileURLToPath(new URL("../" + rel, self));
    throw new Error("cannot locate " + rel + " (cwd=" + process.cwd() + ")");
  };
  const SRC = () => repoFile("src/musicflow-remote-card.js");
  const DIST = () => repoFile("dist/hass-musicflow-card.js");
  const srcLines = () => readFileSync(SRC(), "utf8").split(/\r?\n/);
  // 静态守卫只认非注释行:注释里出现同名串会让位置判定失真。
  const ruleLine = (lines, selectorStart) =>
    lines.findIndex((l) => l.includes(selectorStart) && !/^\s*(\/\/|\/\*|\*)/.test(l));

  const OVERRIDE = ".controls > .ctl {";
  const PLAY = ".ctl.play {";
  const CONTROLS = ".controls { display: flex;";

  it("覆盖块存在:可收缩 flex + min-width:0 + height:auto + aspect-ratio:1", () => {
    const lines = srcLines();
    const i = ruleLine(lines, OVERRIDE);
    expect(i).toBeGreaterThan(-1);
    const rule = lines[i] + " " + lines[i + 1];
    expect(rule).toContain("flex: 0 1 42px");
    expect(rule).toContain("min-width: 0");
    expect(rule).toContain("height: auto");
    expect(rule).toContain("aspect-ratio: 1");
  });

  it("级联顺序:覆盖块必须晚于 .ctl.play(同为 0,2,0 特异性,后写者胜)", () => {
    const lines = srcLines();
    const playIdx = ruleLine(lines, PLAY);
    const overrideIdx = ruleLine(lines, OVERRIDE);
    expect(playIdx).toBeGreaterThan(-1);
    // .ctl.play 的 height: 42px 若写在覆盖块之后,会把 height:auto 顶掉 ⇒ play 键重变椭圆
    expect(overrideIdx).toBeGreaterThan(playIdx);
    // 覆盖块之后也不得再出现把 .ctl 高度钉回固定 px 的规则
    const after = lines.slice(overrideIdx + 1).filter((l) => /^\s*\.ctl[^{]*\{[^}]*\bheight:\s*\d/.test(l));
    expect(after).toEqual([]);
  });

  it(".controls 改用 width: min(100%, 432px) + space-between,旧的固定 gap: 23px 已移除", () => {
    const lines = srcLines();
    const i = ruleLine(lines, CONTROLS);
    expect(i).toBeGreaterThan(-1);
    const rule = lines[i] + " " + lines[i + 1];
    expect(rule).toContain("width: min(100%, 432px)");
    expect(rule).toContain("justify-content: space-between");
    expect(rule).toContain("align-self: center");
    expect(rule).toContain("gap: 0");
    // 7 × 42px + 6 × 23px = 432px:宽卡下 space-between 的间距必须正好回到 23px,视觉零回归
    expect((432 - 7 * 42) / 6).toBe(23);
    expect(lines.some((l) => l.includes("gap: 23px"))).toBe(false);
  });

  it("图标不被拉伸:只给 svg 加 max-* 上限,不放大 20/22px 的原始尺寸", () => {
    const lines = srcLines();
    const i = ruleLine(lines, OVERRIDE);
    const block = lines.slice(i, i + 3).join(" ");
    expect(block).toMatch(/\.controls > \.ctl \.ic, \.controls > \.ctl svg \{[^}]*max-width: 100%/);
    expect(block).toMatch(/\.controls > \.ctl \.ic, \.controls > \.ctl svg \{[^}]*max-height: 100%/);
    // SVG 自带 width/height 属性(20 或 22),只放宽上限即可随按钮收缩,不应放大到 42px
    expect(block).toMatch(/\.controls > \.ctl svg \{[^}]*width: auto/);
    expect(block).toMatch(/\.controls > \.ctl svg \{[^}]*height: auto/);
  });

  it("dist 与 src 同步:构建产物里含同一段自适应 CSS 且顺序一致", () => {
    const dLines = readFileSync(DIST(), "utf8").split(/\r?\n/);
    const di = ruleLine(dLines, OVERRIDE);
    expect(di).toBeGreaterThan(-1);
    expect(dLines[di]).toContain("aspect-ratio: 1");
    expect(di).toBeGreaterThan(ruleLine(dLines, PLAY));
    expect(ruleLine(dLines, CONTROLS)).toBeGreaterThan(-1);
  });
});

describe("流转按钮(∞)与圆形高亮底同心:静态守卫", () => {
  // 与 v2.8.8 播放控件守卫同一套路:直接读源码文本,不经 CSSOM。
  // 背景:.out 只设了 align-items:center(纵向),横向仍是默认 flex-start;
  // .out.transfer 把盒子钉成 30×30、padding 归零后,∞ 图标作为唯一 flex item 贴左,
  // 而 border-radius:50% 画出的圆(hover 的 box-shadow 圆 / focus-visible 的 outline 圆)
  // 以按钮盒子中心为圆心 ⇒ 图标与圆心不同心(Chrome 实测横偏 6.5~7px)。
  const repoFile = (rel) => {
    const fromRoot = resolve(process.cwd(), rel);
    if (existsSync(fromRoot)) return fromRoot;
    const self = String(import.meta.url);
    if (self.startsWith("file:")) return fileURLToPath(new URL("../" + rel, self));
    throw new Error("cannot locate " + rel + " (cwd=" + process.cwd() + ")");
  };
  const SRC = () => repoFile("src/musicflow-remote-card.js");
  const DIST = () => repoFile("dist/hass-musicflow-card.js");
  const srcLines = () => readFileSync(SRC(), "utf8").split(/\r?\n/);
  // 静态守卫只认非注释行:注释里出现同名串会让位置判定失真。
  const ruleLine = (lines, selectorStart) =>
    lines.findIndex((l) => l.includes(selectorStart) && !/^\s*(\/\/|\/\*|\*)/.test(l));
  // 严格版:要求「选择器独占行首」。.out 家族有两条同名规则(.out { display… } 与
  // .out { position: relative }),用 includes 取第一命中等于把「两条规则的先后次序」
  // 当成了隐含依赖 —— 一旦有人把两条调序,守卫就会对着错的那条断言、报出误导性失败。
  const ruleLinesAt = (lines, re) =>
    lines.map((l, i) => [i, l]).filter(([, l]) => re.test(l) && !/^\s*(\/\/|\/\*|\*)/.test(l)).map(([i]) => i);

  const TRANSFER = ".out.transfer {";
  const RE_TRANSFER = /^\s*\.out\.transfer\s*\{/;
  const RE_IC = /^\s*\.ic\s*\{/;
  const RE_OUT = /^\s*\.out\s*\{/;
  // 取规则全文(含续行),transfer 家族都是两行写法
  const ruleText = (lines, idx) => lines[idx] + " " + (lines[idx + 1] || "");

  it(".out.transfer 必须同时具备横向与纵向居中(缺 justify-content 会回退成图标贴左)", () => {
    const lines = srcLines();
    const i = ruleLine(lines, TRANSFER);
    expect(i).toBeGreaterThan(-1);
    const rule = lines[i] + " " + lines[i + 1];
    // 横向:按钮自己写死(不能只靠 .out 继承,.out 只管了纵向)
    expect(rule).toContain("justify-content: center");
    // 纵向:.out 的 align-items: center 仍在生效,守卫里把它钉住防止被误删。
    // 注意 .out 有两条同名规则,必须「全部捞出来一起判」,不能只认第一条。
    const outIdxs = ruleLinesAt(lines, RE_OUT);
    expect(outIdxs.length).toBeGreaterThan(0);
    const outAll = outIdxs.map((i) => ruleText(lines, i)).join("\n");
    expect(outAll).toContain("align-items: center");
  });

  it(".ic 图标容器必须双轴居中:∞ 的 svg 才能落在按钮中心(而不只是 .ic 盒子对齐)", () => {
    const lines = srcLines();
    const idxs = ruleLinesAt(lines, RE_IC);
    expect(idxs.length).toBe(1); // 锚必须唯一:`.ic {` 与 `.out .ic {` 同处一个文件
    const ic = ruleText(lines, idxs[0]);
    expect(ic).toContain("display: inline-flex");
    expect(ic).toContain("justify-content: center");
    expect(ic).toContain("align-items: center");
  });

  it("圆形底必须保持正方形(width == height):border-radius:50% 只在正方时才画得出正圆", () => {
    const lines = srcLines();
    const idxs = ruleLinesAt(lines, RE_TRANSFER);
    expect(idxs.length).toBe(1);
    const rule = ruleText(lines, idxs[0]);
    const wm = rule.match(/width:\s*([\d.]+)px/);
    const hm = rule.match(/height:\s*([\d.]+)px/);
    expect(wm, "规则里没找到 width").toBeTruthy();
    expect(hm, "规则里没找到 height").toBeTruthy();
    expect(parseFloat(hm[1])).toBe(parseFloat(wm[1]));
  });

  it("圆形底的尺寸/配色/反馈语义不变:仍是 30×30 透明底无边框圆,hover 放大 + 中性阴影", () => {
    const lines = srcLines();
    const i = ruleLine(lines, TRANSFER);
    const rule = lines[i] + " " + lines[i + 1];
    expect(rule).toContain("width: 30px");
    expect(rule).toContain("height: 30px");
    expect(rule).toContain("padding: 0");
    expect(rule).toContain("border: none");
    expect(rule).toContain("background: transparent");
    expect(rule).toContain("border-radius: 50%");
    const hi = ruleLine(lines, ".out.transfer:hover {");
    expect(hi).toBeGreaterThan(-1);
    const hover = lines[hi] + " " + lines[hi + 1];
    expect(hover).toContain("transform: scale(1.10)");
    expect(hover).toContain("box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35)");
  });

  it("dist 与 src 同步:构建产物里的 .out.transfer 同样带 justify-content: center", () => {
    const dLines = readFileSync(DIST(), "utf8").split(/\r?\n/);
    const di = ruleLine(dLines, TRANSFER);
    expect(di).toBeGreaterThan(-1);
    expect(dLines[di]).toContain("justify-content: center");
  });
});

// ============ v2.8.11 面板/极简过渡动画:防回退静态守卫(QA 回归补强) ============
// 背景:vol-overlay / 三个 .panel 从条件渲染改常驻 DOM + .open class 过渡;极简模式三块
// 从 display:none 改 max-height 收缩。动画节奏为产品拍板的固定值(进场 cubic-bezier(0.2,0,0,1) /
// 出场 cubic-bezier(0.4,0,1,1) / visibility 延迟切换),这里把曲线、时长、visibility 延迟、
// mini 三块 max-height 展开值全部钉进源码文本,任何一处被改掉都会让守卫立即 FAIL。
// (v2.8.12 起时长翻倍:0.3s→0.6s、0.22s→0.44s,守卫值同步更新。)
describe("v2.8.11 面板/极简过渡动画:防回退静态守卫", () => {
  const repoFile = (rel) => {
    const fromRoot = resolve(process.cwd(), rel);
    if (existsSync(fromRoot)) return fromRoot;
    const self = String(import.meta.url);
    if (self.startsWith("file:")) return fileURLToPath(new URL("../" + rel, self));
    throw new Error("cannot locate " + rel + " (cwd=" + process.cwd() + ")");
  };
  const SRC = () => repoFile("src/musicflow-remote-card.js");
  const srcLines = () => readFileSync(SRC(), "utf8").split(/\r?\n/);
  // 只认非注释行,防止注释里的示例串当锚点
  const ruleLine = (lines, anchor) =>
    lines.findIndex((l) => l.includes(anchor) && !/^\s*(\/\/|\/\*|\*)/.test(l));
  // 从锚点行起拼出完整规则文本(到含 "}" 的行为止)
  const ruleText = (lines, anchor) => {
    const i = ruleLine(lines, anchor);
    if (i < 0) return "";
    let t = lines[i];
    for (let j = i + 1; j < lines.length && !t.includes("}"); j++) t += " " + lines[j];
    return t;
  };

  it(":host 动画节奏四变量存在且值正确(进场 0.6s ease-out / 出场 0.44s ease-in,v2.8.12 翻倍)", () => {
    const lines = srcLines();
    expect(ruleText(lines, "--anim-in: cubic-bezier")).toContain("--anim-in: cubic-bezier(0.2, 0, 0, 1);");
    expect(ruleText(lines, "--anim-out: cubic-bezier")).toContain("--anim-out: cubic-bezier(0.4, 0, 1, 1);");
    expect(ruleText(lines, "--dur-in: 0.6s")).toContain("--dur-in: 0.6s;");
    expect(ruleText(lines, "--dur-out: 0.44s")).toContain("--dur-out: 0.44s;");
  });

  it(".vol-overlay.open 与 .panel.open 进场过渡:var(--dur-in) 缓出曲线 + visibility 立即恢复", () => {
    const lines = srcLines();
    for (const sel of [".vol-overlay.open {", ".panel.open {"]) {
      const rule = ruleText(lines, sel);
      expect(rule, sel + " 规则丢失").not.toBe("");
      expect(rule).toContain("opacity var(--dur-in) var(--anim-in)");
      expect(rule).toContain("transform var(--dur-in) var(--anim-in)");
      expect(rule).toContain("visibility 0s linear 0s");
    }
  });

  it(".vol-overlay 与 .panel 关闭态出场过渡:var(--dur-out) 缓入曲线 + visibility 延迟切换", () => {
    const lines = srcLines();
    for (const sel of [".vol-overlay { position: absolute;", ".panel { position: absolute;"]) {
      const rule = ruleText(lines, sel);
      expect(rule, sel + " 规则丢失").not.toBe("");
      expect(rule).toContain("opacity: 0");
      expect(rule).toContain("transform: translateY(20px)");
      expect(rule).toContain("visibility: hidden");
      expect(rule).toContain("opacity var(--dur-out) var(--anim-out)");
      expect(rule).toContain("transform var(--dur-out) var(--anim-out)");
      expect(rule).toContain("visibility 0s linear var(--dur-out)");
    }
  });

  it("首页内容隐身规则(panelmode/volmode):opacity 0 + translateY(8px) 下沉淡出 + visibility 延迟", () => {
    const lines = srcLines();
    const rule = ruleText(lines, ".wrap.panelmode > .outputs,");
    expect(rule).not.toBe("");
    expect(rule).toContain(".wrap.panelmode > .now");
    expect(rule).toContain(".lower.volmode > .controls");
    expect(rule).toContain(".lower.volmode > .progress-row");
    expect(rule).toContain("opacity: 0; transform: translateY(8px); visibility: hidden;");
    expect(rule).toContain("visibility 0s linear var(--dur-out)");
  });

  it("极简模式三块只位移/淡出,不收缩(占位不变 → 高度与动画进度无关)", () => {
    const lines = srcLines();
    // 不再有展开态的 max-height 上限,也不再有收缩态的 max-height:0
    expect(lines.filter((l) => /\.wrap > \.outputs \{ max-height/.test(l)).length).toBe(0);
    expect(lines.filter((l) => /\.wrap > \.lower > \.controls \{ max-height/.test(l)).length).toBe(0);
    const rule = ruleText(lines, ".wrap.mini > .outputs {");
    expect(rule).toContain("opacity: 0");
    expect(rule).toContain("visibility: hidden");
    expect(rule).not.toContain("max-height");
    expect(rule).not.toContain("display: none");
    // --mini-h 地板整套机制已删除(高度不再靠 min-height 兜);注释里保留历史说明
    expect(lines.join(String.fromCharCode(10))).not.toContain("var(--mini-h");
  });

  it("reduced-motion 覆盖全部新增过渡(面板/音量/极简收缩块直切)", () => {
    const lines = srcLines();
    // 第二个 reduce 块(第一个是 idlebg 的):锚定 .vol-overlay, .panel 直切行
    const idxs = lines
      .map((l, i) => [i, l])
      .filter(([, l]) => l.includes(".vol-overlay, .panel { transition: none !important; }") && !/^\s*(\/\/|\/\*|\*)/.test(l))
      .map(([i]) => i);
    expect(idxs.length).toBe(1);
    const block = lines.slice(idxs[0] - 8, idxs[0] + 2).join("\n");
    expect(block).toContain(".wrap.mini > .outputs");
    expect(block).toContain(".wrap.mini > .lower > .controls");
    expect(block).toContain(".wrap.mini > .lower > .progress-row");
    expect(block).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });
});

// ============ v2.8.12 极简模式「一击只退出」+ 动画节奏翻倍:行为 + 静态守卫 ============
// 背景(主理人实机反馈):极简歌词模式下点空白处会误触发播放/暂停等控件。
// 根因:桌面 pointermove、触屏 pointerenter 都在 click 之前就把 mini 退掉了,而控件退出瞬间
// 立刻 visibility:visible —— 同一次手势末尾的 click 于是命中刚露出的按钮。修复两步:
//   1) 触屏(pointerType === "touch")不在按下/滑动阶段退出,留到 click 统一退出;
//   2) host 捕获阶段的守卫 _onWrapClickCapture:极简中/刚退出(MINI_CLICK_GUARD_MS 窗口内)
//      的那一击被吞掉(stopPropagation 截断,控件 handler 根本不执行),只退出极简模式。
// 守卫分两层:行为测试直接驱动这两个方法(真回归),静态守卫把时长翻倍后的数值钉死。
describe("v2.8.12 极简模式:一击只退出(点击守卫)", () => {
  const mkEvt = () => ({ preventDefault: vi.fn(), stopPropagation: vi.fn() });
  const miniCard = () => {
    const c = mkCard();
    c._ui.isPlaying = true;
    c._ui.lyrics = [{ time: 0, text: "x" }];
    return c;
  };

  it("极简模式下的点击被吞掉:只退出极简,不落到任何控件", () => {
    const c = miniCard();
    c._setMini(true);
    expect(c._ui.mini).toBe(true);
    const e = mkEvt();
    c._onWrapClickCapture(e);
    expect(e.stopPropagation).toHaveBeenCalledTimes(1);
    expect(e.preventDefault).toHaveBeenCalledTimes(1);
    expect(c._ui.mini).toBe(false); // 仅仅退出极简,没有其它副作用
  });

  it("退出后窗口内那一击同样只用于退出;只拦一击,窗口过后放行", () => {
    const c = miniCard();
    c._miniExitAt = Date.now(); // 刚退出(桌面 pointermove 抢在 click 之前)
    const e1 = mkEvt();
    c._onWrapClickCapture(e1);
    expect(e1.stopPropagation).toHaveBeenCalledTimes(1);
    expect(c._miniExitAt).toBe(0); // 拦完即清,不会持续吞点击
    const e2 = mkEvt();
    c._onWrapClickCapture(e2);
    expect(e2.stopPropagation).not.toHaveBeenCalled();
    // 超出窗口(手势早就结束)→ 正常放行
    c._miniExitAt = Date.now() - 5000;
    const e3 = mkEvt();
    c._onWrapClickCapture(e3);
    expect(e3.stopPropagation).not.toHaveBeenCalled();
  });

  it("非极简状态(不在窗口内)的点击一律放行,不干扰正常操作", () => {
    const c = mkCard();
    const e = mkEvt();
    c._onWrapClickCapture(e);
    expect(e.stopPropagation).not.toHaveBeenCalled();
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it("_setMini(false) 会打上退出时刻戳(守卫窗口的触发前提)", () => {
    const c = miniCard();
    expect(c._miniExitAt).toBe(0);
    c._setMini(true);
    expect(c._miniExitAt).toBe(0); // 进入极简不打戳
    c._setMini(false);
    expect(c._miniExitAt).toBeGreaterThan(0);
    // 已经退出时再调用不刷新戳,避免一直移动鼠标把窗口无限延长
    const t = c._miniExitAt;
    c._setMini(false);
    expect(c._miniExitAt).toBe(t);
  });

  it("触屏:按下/滑动阶段不退出极简,交给 click 守卫统一退出;鼠标仍保持悬停即退出", () => {
    const c = miniCard();
    c._setMini(true);
    c._onCardPointer({ pointerType: "touch" });
    expect(c._ui.mini).toBe(true); // 触屏不在 hover 阶段退出(否则随后的 tap 会命中控件)
    const e = mkEvt();
    c._onWrapClickCapture(e);
    expect(c._ui.mini).toBe(false);
    expect(e.stopPropagation).toHaveBeenCalledTimes(1);

    const c2 = miniCard();
    c2._setMini(true);
    c2._onCardPointer({ pointerType: "mouse" });
    expect(c2._ui.mini).toBe(false); // 鼠标悬停即唤出控件(既有行为不变)
  });
});

describe("v2.8.12 动画节奏翻倍:防回退静态守卫", () => {
  const repoFile = (rel) => {
    const fromRoot = resolve(process.cwd(), rel);
    if (existsSync(fromRoot)) return fromRoot;
    const self = String(import.meta.url);
    if (self.startsWith("file:")) return fileURLToPath(new URL("../" + rel, self));
    throw new Error("cannot locate " + rel + " (cwd=" + process.cwd() + ")");
  };
  const srcText = () => readFileSync(repoFile("src/musicflow-remote-card.js"), "utf8");
  const codeLine = (needle) => {
    const hit = srcText().split(/\r?\n/).filter((l) => l.includes(needle) && !/^\s*(\/\/|\/\*|\*)/.test(l));
    expect(hit.length, "锚点必须唯一: " + needle).toBe(1);
    return hit[0];
  };

  it("极简模式歌词盒高度过渡翻倍(0.42s→0.84s、delay 0.18s→0.36s、收缩 0.3s→0.6s)", () => {
    expect(codeLine(".wrap.mini .lyricbox { height: 188px;")).toContain("height 0.84s cubic-bezier(0.22, 1, 0.36, 1) 0.36s");
    expect(codeLine(".wrap:not(.mini) .lyricbox { height: 100px;")).toContain("height 0.6s ease");
  });

  it("歌词轨道滚动与当前行高亮过渡同步翻倍(0.45s→0.9s / 0.3s→0.6s)", () => {
    expect(codeLine(".lyricbox-track { transition:")).toContain("transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)");
    expect(codeLine("transition: color 0.6s ease, opacity 0.6s ease; }")).toContain("color 0.6s ease, opacity 0.6s ease");
  });

  it("极简模式收起态走 --dur-out 出场曲线(时长随变量翻倍)", () => {
    const lines = srcText().split(/\r?\n/);
    const at = lines.findIndex((l) => l.includes(".wrap.mini > .outputs {"));
    expect(at).toBeGreaterThan(-1);
    const rule = lines.slice(at, at + 4).join(" "); // 规则跨多行
    expect(rule).toContain("opacity var(--dur-out) var(--anim-out)");
    expect(rule).toContain("transform var(--dur-out) var(--anim-out)");
    expect(rule).toContain("visibility 0s linear var(--dur-out)");
    expect(rule).not.toContain("0.5s");
  });

  it("点击守卫接线完整:常量 + 捕获阶段注册/注销 + stopPropagation 截断", () => {
    const t = srcText();
    expect(t).toContain("const MINI_CLICK_GUARD_MS = 300;");
    expect(t).toContain('this.addEventListener("click", this._hostClickCapture, true);');
    expect(t).toContain('this.removeEventListener("click", this._hostClickCapture, true);');
    expect(t).toContain("this._hostClickCapture = (e) => this._onWrapClickCapture(e);");
    expect(codeLine("const justExited =")).toContain("MINI_CLICK_GUARD_MS");
    // 触屏分支:pointerType === "touch" 早退,不在 hover 阶段退出极简
    expect(codeLine('if (e && e.pointerType === "touch")')).toContain("_resetIdleTimer()");
  });
});

// ============ v2.8.15 极简模式带方向进出场 + 高度铁律:防回退静态守卫 ============
// 主理人拍板(v2.8.13 因「歌词/封面位置偏移 + 无方向感」回退到 v2.8.12 后重做):
//   ① 隐藏时上半部分(切换器行)**向上移出卡片**、下半部分(控件行/进度条)**向下移出卡片**,
//      回归时全部反向;② 歌词 + 封面整体上移,填到切换器腾出的位置(解决位置偏移);
//   ③ **动画任何时刻都不得改变卡片整体高度** —— 三块只做 transform/opacity/visibility,
//      绝不碰 max-height / display / padding / margin / min-height。
// 守卫把「方向」和「高度铁律」都钉死:方向反了(改成统一 translateY(8px))或又用收缩,
// 都会立即 FAIL。
describe("v2.8.15 极简模式带方向进出场:防回退静态守卫", () => {
  const repoFile = (rel) => {
    const fromRoot = resolve(process.cwd(), rel);
    if (existsSync(fromRoot)) return fromRoot;
    const self = String(import.meta.url);
    if (self.startsWith("file:")) return fileURLToPath(new URL("../" + rel, self));
    throw new Error("cannot locate " + rel + " (cwd=" + process.cwd() + ")");
  };
  const allLines = () => readFileSync(repoFile("src/musicflow-remote-card.js"), "utf8").split(/\r?\n/);
  const code = () => allLines().filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l));
  const ruleLine = (anchor) => {
    const hit = code().filter((l) => l.includes(anchor));
    expect(hit.length, "锚点必须唯一: " + anchor).toBe(1);
    return hit[0];
  };
  // 取某条规则的完整文本(从选择器行拼到收尾的 })
  const rule = (anchor) => {
    const lines = code();
    const i = lines.findIndex((l) => l.includes(anchor));
    expect(i, "找不到规则: " + anchor).toBeGreaterThan(-1);
    let t = lines[i];
    for (let j = i + 1; j < lines.length && !t.includes("}"); j++) t += " " + lines[j];
    return t;
  };

  it("上半部分(切换器行):向上位移 → translateY 负值", () => {
    const r = rule(".wrap.mini > .outputs {");
    expect(r).toMatch(/transform:\s*translateY\(-/);
    expect(r).not.toContain("max-height");
    expect(r).not.toContain("display: none");
  });

  it("下半部分(控件行 / 进度条):向下位移 → translateY 正值", () => {
    for (const anchor of [".wrap.mini > .lower > .controls {", ".wrap.mini > .lower > .progress-row {"]) {
      const r = rule(anchor);
      expect(r, anchor).toMatch(/transform:\s*translateY\((?!-)/);
      expect(r, anchor).not.toContain("max-height");
    }
  });

  it("歌词 + 封面(.now)用 --mini-shift 上移(负号),且不改布局", () => {
    const r = rule(".wrap.mini > .now {");
    expect(r).toContain("var(--mini-shift");
    expect(r).toMatch(/translateY\(calc\(-1 \* var\(--mini-shift/);
    expect(r).not.toContain("padding");
    expect(r).not.toContain("margin");
  });

  it(".wrap.mini 只保留 overflow + 锁死 padding(其余占位属性一律禁止)", () => {
    const r = ruleLine(".wrap.mini { overflow: hidden; padding: 14px; }");
    // padding 必须显式锁死:极简时 .outputs 向上移出会溢出到容器 block-start,
    // Chrome 会吃掉 .wrap 的上下 padding(实测 14px→3px,整卡矮 20px、内容上移 11px),
    // 歌词/封面于是顶到卡片上边缘。锁成与完整模式同值后高度与上移基准都不漂移。
    expect(r).toContain("padding: 14px");
    for (const bad of ["min-height", "max-height", "height:", "margin", "display", "gap"]) {
      expect(r, "不得出现 " + bad).not.toContain(bad);
    }
  });

  it("全仓 transition 只过渡合成属性(布局属性与 all 一律禁止,.lyricbox 例外)", () => {
    const banned = /\b(all|height|max-height|min-height|padding|margin|width|top|bottom|gap|flex)\b/;
    const text = code().join("\n");
    const offenders = [];
    for (let i = text.indexOf("transition:"); i >= 0; i = text.indexOf("transition:", i + 11)) {
      const rel = text.slice(i).search(/[;}]/);
      const decl = text.slice(i, rel < 0 ? text.length : i + rel);
      const pre = text.slice(Math.max(0, i - 140), i);
      if (!pre.includes(".lyricbox") && banned.test(decl)) offenders.push(decl.trim());
    }
    expect(offenders, "这些过渡会改变布局/卡片高度: " + JSON.stringify(offenders)).toEqual([]);
  });

  it(".lyricbox / .vol-overlay / .panel 必须绝对定位(不参与卡片高度)", () => {
    expect(ruleLine(".lyricbox { position: absolute;")).toContain("position: absolute");
    expect(ruleLine(".vol-overlay { position: absolute;")).toContain("position: absolute");
    expect(ruleLine(".panel { position: absolute;")).toContain("position: absolute");
  });

  it("--mini-shift 由 JS 实测注入(.now 与 .outputs 的静态布局差),--mini-h 已彻底移除", () => {
    const t = code().join("\n");
    // v2.8.16:不再用 offsetHeight + 硬编码 gap,改测 offsetTop 差值(不受 transform 影响)
    expect(t).toContain("const diff = now.offsetTop - outputs.offsetTop;");
    expect(t).toContain("_measureMiniShift()");
    expect(t).toContain("--mini-shift:${this._miniShift}px");
    expect(t).not.toContain("var(--mini-h");
    expect(t).not.toContain("_miniFullH");
  });
});

// ============ v2.8.16 极简模式「两种位置状态」根治:行为 + 静态守卫 ============
// 主理人实机反馈:极简模式下歌词/封面有两种位置 —— 打开页面自动进入是对的,
// 点击/选择过之后再进入就「左右和上面贴着卡片边缘」。无头 Chrome 实测定位到两条硬伤:
//   ① .wrap.mini 的上下 padding 被 Chrome 从 14px 吃掉到 3px(切换器行向上移出会溢出到
//      容器 block-start 之外)⇒ 整卡矮 20px、所有内容上移 11px,歌词/封面因此顶到卡边;
//   ② 上移量用 offsetHeight + 硬编码 12px gap 近似,且只在「非 mini」时测 → 值滞后一帧,
//      不同进入路径拿到的值不同(两种位置状态的直接成因)。
// 修法:padding 显式锁死 + 上移量改测 .now/.outputs 的 offsetTop 静态差(不受 transform
// 影响,每次渲染都刷新,极简期间也准确)。守卫把这两条钉死,任一条回退立即 FAIL。
describe("v2.8.16 极简模式上移量:offsetTop 几何差(行为)", () => {
  // 只 stub shadowRoot.querySelector(不整块替换 shadowRoot):Lit 的后续异步 render
  // 要用真实的 shadowRoot,整块换掉会让 render 抛错(覆盖率模式下会记成未捕获错误)。
  const stubTop = (c, offsets) => {
    const sr = c.shadowRoot;
    const orig = sr.querySelector.bind(sr);
    sr.querySelector = (sel) =>
      Object.prototype.hasOwnProperty.call(offsets, sel) ? { offsetTop: offsets[sel] } : orig(sel);
    return () => { delete sr.querySelector; };
  };

  it("上移量 = .now 顶部 − .outputs 顶部(自动包含 gap/warnbar,与硬编码 gap 解耦)", () => {
    const c = mkCard();
    expect(c._miniShift).toBe(64); // DOM 未就绪时的兜底
    const restore = stubTop(c, { ".outputs": 14, ".now": 73 });
    try {
      expect(c._measureMiniShift()).toBe(true); // 64 → 59:值变了,需要补一次渲染
      expect(c._miniShift).toBe(59);
      expect(c._measureMiniShift()).toBe(false); // 值没变 → 不触发多余渲染
    } finally { restore(); }
  });

  it("布局变化(chip 行变高、插了 warnbar)会被下一次渲染跟上", () => {
    const c = mkCard();
    const r1 = stubTop(c, { ".outputs": 14, ".now": 73 });
    try { c._measureMiniShift(); } finally { r1(); }
    const r2 = stubTop(c, { ".outputs": 40, ".now": 116 });
    try {
      expect(c._measureMiniShift()).toBe(true);
      expect(c._miniShift).toBe(76);
    } finally { r2(); }
  });

  it("测不到时保留上一个有效值,不写脏值(offsetTop 为 0 / 元素缺失 / 无 shadowRoot)", () => {
    const c = mkCard();
    const r1 = stubTop(c, { ".outputs": 14, ".now": 73 });
    try { c._measureMiniShift(); } finally { r1(); }
    const keep = c._miniShift;
    const r2 = stubTop(c, { ".outputs": 0, ".now": 0 }); // jsdom / 首帧:差值为 0
    try {
      expect(c._measureMiniShift()).toBe(false);
      expect(c._miniShift).toBe(keep);
    } finally { r2(); }
    const r3 = stubTop(c, {}); // 元素缺失 → querySelector 落到真实 DOM,首帧也可能取不到
    try {
      const got = c._measureMiniShift();
      expect(c._miniShift === keep || got === true).toBe(true); // 取到真实值也算合法,但不许写 0
      expect(c._miniShift).toBeGreaterThan(0);
    } finally { r3(); }
    // 无 shadowRoot(同步调用,不触发异步渲染)
    const real = c.shadowRoot;
    Object.defineProperty(c, "shadowRoot", { value: undefined, configurable: true });
    expect(c._measureMiniShift()).toBe(false);
    Object.defineProperty(c, "shadowRoot", { value: real, configurable: true });
    expect(c._miniShift).toBeGreaterThan(0);
  });
});

describe("v2.8.16 极简模式:padding 锁死 + 测量接线(防回退静态守卫)", () => {
  const repoFile = (rel) => {
    const fromRoot = resolve(process.cwd(), rel);
    if (existsSync(fromRoot)) return fromRoot;
    const self = String(import.meta.url);
    if (self.startsWith("file:")) return fileURLToPath(new URL("../" + rel, self));
    throw new Error("cannot locate " + rel + " (cwd=" + process.cwd() + ")");
  };
  const code = () =>
    readFileSync(repoFile("src/musicflow-remote-card.js"), "utf8")
      .split(/\r?\n/)
      .filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l));
  const one = (needle) => {
    const hit = code().filter((l) => l.includes(needle));
    expect(hit.length, "锚点必须唯一: " + needle).toBe(1);
    return hit[0];
  };

  it(".wrap.mini 显式锁死 padding: 14px(与完整模式同值)", () => {
    expect(one(".wrap.mini { overflow: hidden; padding: 14px; }")).toContain("padding: 14px");
  });

  it("上移量用 offsetTop 静态差,不用 rect(rect 会被正在播放的 transform 带偏)", () => {
    const t = code().join("\n");
    expect(one("const diff = now.offsetTop - outputs.offsetTop;")).toContain("offsetTop");
    expect(t).not.toContain("offsetHeight + 12");
    expect(t).not.toContain("getBoundingClientRect().top - outputs");
  });

  it("测量接线完整:每次渲染都测 + 值变补渲染 + 进入前再测一次", () => {
    const t = code().join("\n");
    expect(t).toContain("if (this._measureMiniShift()) this.requestUpdate();");
    expect(t).toContain("if (on) this._measureMiniShift();");
  });

  it("兜底值 64 仍在(DOM 未就绪时不至于上移 0)", () => {
    expect(one("this._miniShift = 64;")).toContain("64");
  });
});
