// backend-client 单元测试:覆盖导出面、认证、传输模式、消息分发、全部端点与 URL 拼接。
// 全部用假 fetch / 假 hass / 假 WebSocket,不发起真实网络。
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BackendClient, childToQueueItem, parseLyrics } from "../src/backend-client.js";

// ---- 假响应对象 ----
function jsonRes(data, ct = "application/json") {
  return {
    ok: true,
    status: 200,
    headers: { get: () => ct },
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => ({ size: 1 }),
  };
}
function textRes(body = "text", ct = "text/plain") {
  return {
    ok: true,
    status: 200,
    headers: { get: () => ct },
    json: async () => ({}),
    text: async () => body,
    blob: async () => ({ body }),
  };
}
function badRes(status, body = "boom", ct = "text/plain") {
  return {
    ok: false,
    status,
    headers: { get: () => ct },
    json: async () => ({}),
    text: async () => body,
    blob: async () => ({}),
  };
}

const flush = () => new Promise((r) => setTimeout(r, 0));
// 只让微任务跑完(可在假定时器下安全使用)
const micro = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

let origFetch;
beforeEach(() => {
  origFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = origFetch;
  vi.useRealTimers();
});

describe("导出面与构造默认值", () => {
  it("导出 BackendClient / childToQueueItem / parseLyrics", () => {
    expect(typeof BackendClient).toBe("function");
    expect(typeof childToQueueItem).toBe("function");
    expect(typeof parseLyrics).toBe("function");
  });

  it("构造默认值", () => {
    const c = new BackendClient();
    expect(c.hass).toBe(null);
    expect(c.url).toBe(null);
    expect(c.apiKey).toBe(null);
    expect(c.username).toBe(null);
    expect(c.password).toBe(null);
    expect(c.token).toBe(null);
    expect(c._tokenExpiry).toBe(0);
    expect(c.transport).toBe("auto");
    expect(c.mode).toBe(null);
    expect(c.proxySupported).toBe(false);
    expect(c.ws).toBe(null);
    expect(c._unsub).toBe(null);
    expect(c._listeners instanceof Map).toBe(true);
    expect(c.connected).toBe(false);
  });

  it("构造时应用 opts", () => {
    const c = new BackendClient({ url: "http://h", apiKey: "K", transport: "proxy" });
    expect(c.url).toBe("http://h");
    expect(c.apiKey).toBe("K");
    expect(c.transport).toBe("proxy");
  });
});

describe("on / _emit", () => {
  it("注册、触发、取消订阅", () => {
    const c = new BackendClient();
    const cb = vi.fn();
    const off = c.on("e", cb);
    c._emit("e", 1);
    expect(cb).toHaveBeenCalledWith(1);
    off();
    c._emit("e", 2);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("监听器抛错被吞掉,不影响其它监听器", () => {
    const c = new BackendClient();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const good = vi.fn();
    c.on("e", () => { throw new Error("boom"); });
    c.on("e", good);
    expect(() => c._emit("e")).not.toThrow();
    expect(good).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("未注册事件的 _emit 是空操作", () => {
    const c = new BackendClient();
    expect(() => c._emit("nope")).not.toThrow();
  });
});

describe("init()", () => {
  it("url + 用户名 + 密码:直接返回,不调用 callWS", async () => {
    const callWS = vi.fn();
    const c = new BackendClient({ hass: { callWS }, url: "http://h", username: "u", password: "p" });
    await expect(c.init()).resolves.toBeUndefined();
    expect(callWS).not.toHaveBeenCalled();
  });

  it("url + apiKey:直接返回", async () => {
    const callWS = vi.fn();
    const c = new BackendClient({ hass: { callWS }, url: "http://h", apiKey: "K" });
    await expect(c.init()).resolves.toBeUndefined();
    expect(callWS).not.toHaveBeenCalled();
  });

  it("缺少地址且无 hass:抛错", async () => {
    const c = new BackendClient();
    await expect(c.init()).rejects.toThrow(/缺少后端地址/);
  });

  it("callWS 拉取 backend_config 成功", async () => {
    const callWS = vi.fn(async () => ({
      backends: [{ url: "http://b", username: "u2", password: "p2", api_key: "ak", proxySupported: true }],
    }));
    const c = new BackendClient({ hass: { callWS } });
    await c.init();
    expect(c.url).toBe("http://b");
    expect(c.username).toBe("u2");
    expect(c.password).toBe("p2");
    expect(c.apiKey).toBe("ak");
    expect(c.proxySupported).toBe(true);
  });

  it("backends 为空:抛错", async () => {
    const c = new BackendClient({ hass: { callWS: vi.fn(async () => ({})) } });
    await expect(c.init()).rejects.toThrow(/未配置后端连接/);
  });

  it("_pendingInit 复用:并发 init 只跑一次", async () => {
    const c = new BackendClient({ hass: {} });
    c._pendingInit = Promise.resolve("ok");
    await expect(c.init()).resolves.toBe("ok");
  });
});

describe("login() / _ensureToken()", () => {
  it("登录成功写入 token 与 24h 过期", async () => {
    const fetchMock = vi.fn(async () => jsonRes({ token: "JWT" }));
    globalThis.fetch = fetchMock;
    const c = new BackendClient({ url: "http://h/", username: "u", password: "p" });
    const before = Date.now();
    const t = await c.login();
    expect(t).toBe("JWT");
    expect(c.token).toBe("JWT");
    expect(c._tokenExpiry).toBeGreaterThanOrEqual(before + 24 * 3600 * 1000 - 1000);
    expect(fetchMock.mock.calls[0][0]).toBe("http://h/rest/api/v1/auth/login");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
  });

  it("401 → 用户名或密码错误", async () => {
    globalThis.fetch = vi.fn(async () => badRes(401));
    const c = new BackendClient({ url: "http://h", username: "u", password: "p" });
    await expect(c.login()).rejects.toThrow("用户名或密码错误");
  });

  it("非 ok → 登录失败", async () => {
    globalThis.fetch = vi.fn(async () => badRes(500, "server down"));
    const c = new BackendClient({ url: "http://h", username: "u", password: "p" });
    await expect(c.login()).rejects.toThrow(/登录失败 500/);
  });

  it("fetch 抛异常时向上传播", async () => {
    globalThis.fetch = vi.fn(async () => { throw new TypeError("net"); });
    const c = new BackendClient({ url: "http://h", username: "u", password: "p" });
    await expect(c.login()).rejects.toThrow("net");
  });

  it("apiKey 直返", async () => {
    const c = new BackendClient({ apiKey: "K" });
    await expect(c._ensureToken()).resolves.toBe("K");
  });

  it("proxy 模式返回 null", async () => {
    const c = new BackendClient({ url: "http://h" });
    c.mode = "proxy";
    await expect(c._ensureToken()).resolves.toBe(null);
  });

  it("未过期 token 复用", async () => {
    const c = new BackendClient({ url: "http://h", username: "u", password: "p" });
    c.token = "T";
    c._tokenExpiry = Date.now() + 3600 * 1000;
    const spy = vi.spyOn(c, "login");
    await expect(c._ensureToken()).resolves.toBe("T");
    expect(spy).not.toHaveBeenCalled();
  });

  it("缺凭据抛错", async () => {
    const c = new BackendClient({ url: "http://h" });
    c.mode = "direct";
    await expect(c._ensureToken()).rejects.toThrow(/缺少用户名\/密码/);
  });

  it("缺 token / 已过期 → 触发 login", async () => {
    const c = new BackendClient({ url: "http://h", username: "u", password: "p" });
    c.mode = "direct";
    const spy = vi.spyOn(c, "login").mockImplementation(async () => { c.token = "NEW"; return "NEW"; });
    await expect(c._ensureToken()).resolves.toBe("NEW");
    expect(spy).toHaveBeenCalled();
  });
});

describe("_restBase / _wsUrl / _withToken", () => {
  it("_restBase 去掉尾部斜杠", () => {
    const c = new BackendClient({ url: "http://h///" });
    expect(c._restBase()).toBe("http://h/rest");
    const c2 = new BackendClient();
    expect(c2._restBase()).toBe("/rest");
  });

  it("_wsUrl:http → ws", () => {
    const c = new BackendClient({ url: "http://h:8139" });
    c.token = "T";
    expect(c._wsUrl()).toBe("ws://h:8139/ws?token=T");
  });

  it("_wsUrl:https → wss 且 token 编码", () => {
    const c = new BackendClient({ url: "https://h" });
    c.token = "a b/c";
    expect(c._wsUrl()).toBe("wss://h/ws?token=a%20b%2Fc");
  });

  it("_wsUrl 无 token 时用 apiKey", () => {
    const c = new BackendClient({ url: "http://h", apiKey: "K" });
    expect(c._wsUrl()).toBe("ws://h/ws?token=K");
  });

  it("_withToken:无 token 无 qs", () => {
    const c = new BackendClient({ url: "http://h" });
    expect(c._withToken("/x")).toBe("http://h/rest/x");
  });

  it("_withToken:有 token 有 qs,path 无 ? 用 ?", () => {
    const c = new BackendClient({ url: "http://h" });
    c.token = "T";
    expect(c._withToken("/x", "a=1")).toBe("http://h/rest/x?token=T&a=1");
  });

  it("_withToken:path 已含 ? 时用 &", () => {
    const c = new BackendClient({ url: "http://h" });
    c.token = "T";
    expect(c._withToken("/x?a=1", "b=2")).toBe("http://h/rest/x?a=1&token=T&b=2");
  });
});

describe("_probeDirect / _resolveMode", () => {
  it("无 url 返回 false", async () => {
    const c = new BackendClient();
    await expect(c._probeDirect()).resolves.toBe(false);
  });

  it("有 url 无凭据返回 false", async () => {
    const c = new BackendClient({ url: "http://h" });
    await expect(c._probeDirect()).resolves.toBe(false);
  });

  it("探测成功返回 true", async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, status: 200 }));
    const c = new BackendClient({ url: "http://h", apiKey: "K" });
    await expect(c._probeDirect()).resolves.toBe(true);
  });

  it("探测抛错返回 false", async () => {
    globalThis.fetch = vi.fn(async () => { throw new Error("x"); });
    const c = new BackendClient({ url: "http://h", apiKey: "K" });
    await expect(c._probeDirect()).resolves.toBe(false);
  });

  it("transport direct → direct", async () => {
    const c = new BackendClient({ transport: "direct" });
    await expect(c._resolveMode()).resolves.toBe("direct");
  });

  it("transport proxy:支持→proxy,不支持→direct", async () => {
    const a = new BackendClient({ transport: "proxy" });
    a.proxySupported = true;
    await expect(a._resolveMode()).resolves.toBe("proxy");
    const b = new BackendClient({ transport: "proxy" });
    await expect(b._resolveMode()).resolves.toBe("direct");
  });

  it("auto + proxySupported + 直连失败 → proxy", async () => {
    const c = new BackendClient({ transport: "auto", url: "http://h", apiKey: "K" });
    c.proxySupported = true;
    vi.spyOn(c, "_probeDirect").mockResolvedValue(false);
    await expect(c._resolveMode()).resolves.toBe("proxy");
  });

  it("auto + proxySupported + 直连成功 → direct", async () => {
    const c = new BackendClient({ transport: "auto", url: "http://h", apiKey: "K" });
    c.proxySupported = true;
    vi.spyOn(c, "_probeDirect").mockResolvedValue(true);
    await expect(c._resolveMode()).resolves.toBe("direct");
  });

  it("auto + 不支持代理 → direct", async () => {
    const c = new BackendClient({ transport: "auto", url: "http://h", apiKey: "K" });
    await expect(c._resolveMode()).resolves.toBe("direct");
  });
});

describe("rest() 直连分支", () => {
  function directClient(extra = {}) {
    const c = new BackendClient({ url: "http://h", apiKey: "K" });
    c.mode = "direct";
    Object.assign(c, extra);
    return c;
  }

  it("成功返回 JSON", async () => {
    globalThis.fetch = vi.fn(async () => jsonRes({ a: 1 }));
    const c = directClient();
    await expect(c.rest("/x")).resolves.toEqual({ a: 1 });
  });

  it("subsonic-response 解包", async () => {
    globalThis.fetch = vi.fn(async () => jsonRes({ "subsonic-response": { status: "ok" } }));
    const c = directClient();
    await expect(c.rest("/x")).resolves.toEqual({ status: "ok" });
  });

  it("非 JSON 返回原始 Response", async () => {
    globalThis.fetch = vi.fn(async () => textRes("plain"));
    const c = directClient();
    const r = await c.rest("/x");
    expect(r.ok).toBe(true);
  });

  it("POST 带 body 时写 Content-Type 并序列化", async () => {
    const fetchMock = vi.fn(async () => jsonRes({}));
    globalThis.fetch = fetchMock;
    const c = directClient();
    await c.rest("/x", { method: "POST", body: { a: 1 } });
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
  });

  it("401 首次 → 重新登录后重试成功", async () => {
    let n = 0;
    globalThis.fetch = vi.fn(async () => { n++; return n === 1 ? badRes(401) : jsonRes({ ok: 1 }); });
    const c = directClient({ username: "u", password: "p" });
    c.login = vi.fn(async () => { c.token = "T2"; return "T2"; });
    await expect(c.rest("/x")).resolves.toEqual({ ok: 1 });
    expect(c.login).toHaveBeenCalled();
  });

  it("401 重试后仍失败 → 抛错", async () => {
    globalThis.fetch = vi.fn(async () => badRes(401));
    const c = directClient({ username: "u", password: "p" });
    c.login = vi.fn(async () => { c.token = "T2"; return "T2"; });
    await expect(c.rest("/x")).rejects.toThrow(/-> 401/);
  });

  it("非 ok(500)→ 抛错含状态码", async () => {
    globalThis.fetch = vi.fn(async () => badRes(500));
    const c = directClient();
    await expect(c.rest("/x", { method: "POST" })).rejects.toThrow("MusicFlow REST POST /x -> 500");
  });

  it("网络层 TypeError → 抛出并给出提示语", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    globalThis.fetch = vi.fn(async () => { throw new TypeError("Failed to fetch"); });
    const c = directClient();
    await expect(c.rest("/x")).rejects.toThrow("Failed to fetch");
    const joined = spy.mock.calls.map((a) => a.join(" ")).join("\n");
    expect(joined).toMatch(/CORS/);
    spy.mockRestore();
  });

  it("rest_ok 事件在成功时触发", async () => {
    globalThis.fetch = vi.fn(async () => jsonRes({}));
    const c = directClient();
    const cb = vi.fn();
    c.on("rest_ok", cb);
    await c.rest("/x");
    expect(cb).toHaveBeenCalled();
  });
});

describe("rest() 代理分支", () => {
  function proxyClient(fetchWithAuth) {
    const c = new BackendClient({ url: "http://h", hass: { fetchWithAuth } });
    c.mode = "proxy";
    return c;
  }

  it("走 hass.fetchWithAuth 且成功解包", async () => {
    const fwa = vi.fn(async () => jsonRes({ "subsonic-response": { status: "ok" } }));
    const c = proxyClient(fwa);
    await expect(c.rest("/x")).resolves.toEqual({ status: "ok" });
    expect(fwa.mock.calls[0][0]).toBe("/api/musicflow/rest/x");
  });

  it("POST body 序列化 + Content-Type", async () => {
    const fwa = vi.fn(async () => jsonRes({}));
    const c = proxyClient(fwa);
    await c.rest("/x", { method: "POST", body: { s: 1 } });
    const init = fwa.mock.calls[0][1];
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ s: 1 }));
  });

  it("非 ok → 抛错", async () => {
    const fwa = vi.fn(async () => badRes(502, "bad gateway"));
    const c = proxyClient(fwa);
    await expect(c.rest("/y")).rejects.toThrow("MusicFlow REST GET /y -> 502");
  });

  it("非 JSON 返回 Response", async () => {
    const fwa = vi.fn(async () => textRes("raw"));
    const c = proxyClient(fwa);
    const r = await c.rest("/z");
    expect(r.ok).toBe(true);
  });

  it("网络错误时抛出", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fwa = vi.fn(async () => { throw new Error("proxy down"); });
    const c = proxyClient(fwa);
    await expect(c.rest("/z")).rejects.toThrow("proxy down");
    spy.mockRestore();
  });

  it("rest_ok 事件触发", async () => {
    const fwa = vi.fn(async () => jsonRes({}));
    const c = proxyClient(fwa);
    const cb = vi.fn();
    c.on("rest_ok", cb);
    await c.rest("/z");
    expect(cb).toHaveBeenCalled();
  });
});

describe("connect() / _connectWS / 重连", () => {
  it("_connecting 为真时直接返回", () => {
    const c = new BackendClient();
    c._connecting = true;
    const spy = vi.spyOn(c, "_connectWS");
    c.connect();
    expect(spy).not.toHaveBeenCalled();
  });

  it("mode=direct → 走 _connectWS", () => {
    const c = new BackendClient();
    c.mode = "direct";
    vi.spyOn(c, "_connectWS").mockImplementation(() => {});
    c.connect();
    expect(c._connectWS).toHaveBeenCalled();
  });

  it("mode=proxy → 走 _connectProxy", () => {
    const c = new BackendClient();
    c.mode = "proxy";
    vi.spyOn(c, "_connectProxy").mockImplementation(() => {});
    c.connect();
    expect(c._connectProxy).toHaveBeenCalled();
  });

  it("首次连接:探测后分流并复位 _connecting", async () => {
    const c = new BackendClient({ url: "http://h", apiKey: "K" });
    c._connectWS = vi.fn();
    vi.spyOn(c, "_resolveMode").mockResolvedValue("direct");
    c.connect();
    await flush();
    expect(c.mode).toBe("direct");
    expect(c._connecting).toBe(false);
    expect(c._connectWS).toHaveBeenCalled();
  });

  it("探测失败 → _scheduleReconnect", async () => {
    const c = new BackendClient({ url: "http://h" });
    vi.spyOn(c, "_resolveMode").mockRejectedValue(new Error("nope"));
    const spy = vi.spyOn(c, "_scheduleReconnect").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    c.connect();
    await flush();
    expect(c._connecting).toBe(false);
    expect(spy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("_connectWS:open/keepalive/message/close 全链路", async () => {
    vi.useFakeTimers();
    const c = new BackendClient({ url: "http://h", apiKey: "K", transport: "direct" });
    c.mode = "direct";
    const events = [];
    c.on("open", () => events.push("open"));
    c.on("close", () => events.push("close"));
    c.on("snapshot", (d) => events.push(["snapshot", d]));
    c.connect();
    await micro();
    const ws = globalThis.WebSocket.instances.at(-1);
    expect(ws.url).toBe("ws://h/ws?token=K");
    ws._open();
    expect(c.connected).toBe(true);
    expect(events).toContain("open");
    // keepalive ping
    await vi.advanceTimersByTimeAsync(25000);
    expect(ws.sent.some((s) => s.includes("ping"))).toBe(true);
    ws._message({ type: "snapshot", devices: { a: 1 } });
    ws._message("not-json"); // JSON.parse 失败被吞
    expect(events.some((e) => Array.isArray(e) && e[0] === "snapshot")).toBe(true);
    ws._serverClose();
    expect(c.connected).toBe(false);
    expect(events).toContain("close");
    await vi.advanceTimersByTimeAsync(3000); // 3s 后重连
    expect(globalThis.WebSocket.instances.length).toBeGreaterThan(1);
    c.disconnect();
  });

  it("_connectWS:重复 connect 在 OPEN/CONNECTING 时不新建", async () => {
    vi.useFakeTimers();
    const c = new BackendClient({ url: "http://h", apiKey: "K", transport: "direct" });
    c.mode = "direct";
    c.connect();
    await micro();
    const n = globalThis.WebSocket.instances.length;
    c.connect(); await micro();
    expect(globalThis.WebSocket.instances.length).toBe(n);
    c.disconnect();
  });

  it("_connectWS:登录失败仅告警,仍继续建连", async () => {
    vi.useFakeTimers();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const c = new BackendClient({ url: "http://h", username: "u", password: "p", transport: "direct" });
    c.mode = "direct";
    vi.spyOn(c, "_ensureToken").mockRejectedValue(new Error("login bad"));
    c.connect();
    await micro();
    expect(globalThis.WebSocket.instances.length).toBeGreaterThan(0);
    errSpy.mockRestore();
    c.disconnect();
  });

  it("_connectWS:new WebSocket 抛错 → _maybeProxyFallback", async () => {
    vi.useFakeTimers();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const c = new BackendClient({ url: "http://h", apiKey: "K", transport: "proxy" });
    c.mode = "proxy";
    vi.spyOn(c, "_maybeProxyFallback").mockReturnValue(true);
    const saved = globalThis.WebSocket;
    globalThis.WebSocket = class { constructor() { throw new Error("blocked"); } };
    try {
      await c._connectWS();
      expect(c._maybeProxyFallback).toHaveBeenCalled();
    } finally {
      globalThis.WebSocket = saved;
      errSpy.mockRestore();
    }
  });

  it("握手看门狗:超时未 open → 主动 close 触发重连", async () => {
    vi.useFakeTimers();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const c = new BackendClient({ url: "http://h", apiKey: "K", transport: "direct" });
    c.mode = "direct";
    c._scheduleReconnect = () => {};
    c.connect();
    await Promise.resolve(); await Promise.resolve();
    const ws = globalThis.WebSocket.instances.at(-1);
    await vi.advanceTimersByTimeAsync(10000);
    expect(ws.readyState).toBe(3);
    warnSpy.mockRestore();
    c.disconnect();
  });

  it("ws.onerror → close", async () => {
    vi.useFakeTimers();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const c = new BackendClient({ url: "http://h", apiKey: "K", transport: "direct" });
    c.mode = "direct";
    c._scheduleReconnect = () => {};
    c.connect();
    await Promise.resolve(); await Promise.resolve();
    const ws = globalThis.WebSocket.instances.at(-1);
    ws._error({ type: "error" });
    expect(ws.readyState).toBe(3);
    errSpy.mockRestore();
    c.disconnect();
  });

  it("_maybeProxyFallback:transport=direct 时不切换", () => {
    const c = new BackendClient({ transport: "direct" });
    c.mode = "direct";
    c.proxySupported = true;
    expect(c._maybeProxyFallback()).toBe(false);
  });

  it("_maybeProxyFallback:auto+支持代理+未试过 → 切 proxy", () => {
    const c = new BackendClient({ transport: "auto" });
    c.mode = "direct";
    c.proxySupported = true;
    c._connectProxy = vi.fn();
    expect(c._maybeProxyFallback()).toBe(true);
    expect(c.mode).toBe("proxy");
    expect(c._connectProxy).toHaveBeenCalled();
  });

  it("_maybeProxyFallback:已试过 → 不再切换", () => {
    const c = new BackendClient({ transport: "auto" });
    c.mode = "direct";
    c.proxySupported = true;
    c._proxyFallbackTried = true;
    expect(c._maybeProxyFallback()).toBe(false);
  });

  it("_scheduleReconnect:指数退避到 30s 上限", async () => {
    vi.useFakeTimers();
    const c = new BackendClient();
    c.connect = () => {};
    const seen = [];
    for (let i = 0; i < 6; i++) {
      if (c._reconnectTimer) break;
      seen.push(c._reconnectDelay);
      c._scheduleReconnect();
      await vi.advanceTimersByTimeAsync(c._reconnectDelay);
    }
    expect(seen[0]).toBe(3000);
    expect(seen.at(-1)).toBe(30000); // 封顶
    expect(seen).toEqual([3000, 6000, 12000, 24000, 30000, 30000]);
    c.disconnect();
  });

  it("disconnect() 清理定时器与 ws", async () => {
    vi.useFakeTimers();
    const c = new BackendClient({ url: "http://h", apiKey: "K", transport: "direct" });
    c.mode = "direct";
    c.connect();
    await Promise.resolve(); await Promise.resolve();
    c._reconnectTimer = setTimeout(() => {}, 1000);
    c.disconnect();
    expect(c._reconnectTimer).toBe(null);
    expect(c.ws).toBe(null);
    expect(c.connected).toBe(false);
  });
});

describe("proxy 传输", () => {
  it("无 hass.connection → 重连", () => {
    const c = new BackendClient({ hass: {} });
    c.mode = "proxy";
    const spy = vi.spyOn(c, "_scheduleReconnect").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    c._connectProxy();
    expect(spy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("订阅成功 → connected + _unsub + open 事件", async () => {
    const unsub = vi.fn();
    const hass = { connection: { subscribeMessage: vi.fn(async () => unsub) } };
    const c = new BackendClient({ hass });
    c.mode = "proxy";
    c._startProxyRecheck = vi.fn();
    const open = vi.fn();
    c.on("open", open);
    c._connectProxy();
    await flush();
    expect(c.connected).toBe(true);
    expect(c._unsub).toBe(unsub);
    expect(open).toHaveBeenCalled();
  });

  it("订阅失败 → close 事件 + 重连", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const hass = { connection: { subscribeMessage: vi.fn(async () => { throw new Error("no"); }) } };
    const c = new BackendClient({ hass });
    c.mode = "proxy";
    const spy = vi.spyOn(c, "_scheduleReconnect").mockImplementation(() => {});
    const close = vi.fn();
    c.on("close", close);
    c._connectProxy();
    await flush();
    expect(close).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("_subPending 防重入", () => {
    const c = new BackendClient({ hass: { connection: { subscribeMessage: vi.fn(() => new Promise(() => {})) } } });
    c.mode = "proxy";
    const sub = c.hass.connection.subscribeMessage;
    c._connectProxy();
    c._connectProxy();
    expect(sub).toHaveBeenCalledTimes(1);
  });

  it("已有 _unsub 时不再订阅", () => {
    const c = new BackendClient({ hass: { connection: { subscribeMessage: vi.fn() } } });
    c._unsub = vi.fn();
    c._connectProxy();
    expect(c.hass.connection.subscribeMessage).not.toHaveBeenCalled();
  });

  it("_closeProxy 调用 unsub 并清空", () => {
    const c = new BackendClient();
    const unsub = vi.fn();
    c._unsub = unsub;
    c._closeProxy();
    expect(unsub).toHaveBeenCalled();
    expect(c._unsub).toBe(null);
  });

  it("_closeProxy 对抛错的 unsub 静默", () => {
    const c = new BackendClient();
    c._unsub = () => { throw new Error("x"); };
    expect(() => c._closeProxy()).not.toThrow();
  });

  it("_startProxyRecheck:连续 2 次探测成功后切回 direct", async () => {
    vi.useFakeTimers();
    const c = new BackendClient({ url: "http://h", apiKey: "K" });
    c.mode = "proxy";
    c.proxySupported = true;
    vi.spyOn(c, "_probeDirect").mockResolvedValue(true);
    c.connect = vi.fn();
    c._startProxyRecheck();
    await vi.advanceTimersByTimeAsync(60000);
    await vi.advanceTimersByTimeAsync(60000);
    expect(c.mode).toBe("direct");
    expect(c.connect).toHaveBeenCalled();
    c._stopProxyRecheck();
  });

  it("_startProxyRecheck:探测失败清零 streak", async () => {
    vi.useFakeTimers();
    const c = new BackendClient({ url: "http://h", apiKey: "K" });
    c.mode = "proxy";
    c._proxyOkStreak = 1;
    vi.spyOn(c, "_probeDirect").mockResolvedValue(false);
    c._startProxyRecheck();
    await vi.advanceTimersByTimeAsync(60000);
    expect(c._proxyOkStreak).toBe(0);
    c._stopProxyRecheck();
  });

  it("_startProxyRecheck:mode 非 proxy 时直接返回", async () => {
    vi.useFakeTimers();
    const c = new BackendClient();
    c.mode = "direct";
    c._probeDirect = vi.fn();
    c._startProxyRecheck();
    await vi.advanceTimersByTimeAsync(60000);
    expect(c._probeDirect).not.toHaveBeenCalled();
    c._stopProxyRecheck();
  });
});

describe("_handle 消息分发", () => {
  const cases = [
    [{ type: "snapshot", devices: { d: 1 } }, "snapshot", { d: 1 }],
    [{ type: "peer_snapshot", peers: [{ peerId: "p" }] }, "peer_snapshot", [{ peerId: "p" }]],
    [{ type: "peer_registered", peer: { peerId: "p1" } }, "peer_update", { peerId: "p1" }],
    [{ type: "peer_available", peer: { peerId: "p2" } }, "peer_update", { peerId: "p2" }],
    [{ type: "peer_unavailable", peer: { peerId: "p3" } }, "peer_update", { peerId: "p3" }],
    [{ type: "peer_queue_changed", peer_id: "p", queue: { total: 2 } }, "peer_queue", { peerId: "p", queue: { total: 2 } }],
    [{ type: "queue_changed", device_id: "d", queue: { total: 1 } }, "queue_changed", { deviceId: "d", queue: { total: 1 } }],
    [{ type: "player_state_changed", device_id: "d", state: { state: "PLAYING" } }, "state", { deviceId: "d", state: { state: "PLAYING" } }],
    [{ type: "media_changed", device_id: "d", media: { songId: "s" } }, "media", { deviceId: "d", media: { songId: "s" } }],
    [{ type: "player_refresh", device_id: "d" }, "refresh", { deviceId: "d" }],
    [{ type: "group_changed", group: { id: "g" } }, "group", { id: "g" }],
    [{ type: "group_deleted", id: "g" }, "group_deleted", "g"],
    [{ type: "device_list_changed", deviceCount: 3 }, "device_list_changed", { deviceCount: 3 }],
  ];
  for (const [msg, ev, payload] of cases) {
    it(`分发 ${msg.type}`, () => {
      const c = new BackendClient();
      const cb = vi.fn();
      c.on(ev, cb);
      c._handle(msg);
      expect(cb).toHaveBeenCalledWith(payload);
    });
  }

  it("peer_registered 无 peer 时不发事件", () => {
    const c = new BackendClient();
    const cb = vi.fn();
    c.on("peer_update", cb);
    c._handle({ type: "peer_registered" });
    expect(cb).not.toHaveBeenCalled();
  });

  it("peer_queue_cleared 归一成空队列", () => {
    const c = new BackendClient();
    const cb = vi.fn();
    c.on("peer_queue", cb);
    c._handle({ type: "peer_queue_cleared", peer_id: "p" });
    const arg = cb.mock.calls[0][0];
    expect(arg.peerId).toBe("p");
    expect(arg.queue.items).toEqual([]);
    expect(arg.queue.currentIndex).toBe(-1);
  });

  it("connection_closed → close + 重连", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const c = new BackendClient();
    c._unsub = vi.fn();
    const spy = vi.spyOn(c, "_scheduleReconnect").mockImplementation(() => {});
    const close = vi.fn();
    c.on("close", close);
    c._handle({ type: "connection_closed" });
    expect(close).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
    expect(c._unsub).toBe(null);
    warnSpy.mockRestore();
  });

  it("未知类型是空操作", () => {
    const c = new BackendClient();
    expect(() => c._handle({ type: "whatever" })).not.toThrow();
  });
});

describe("peer actions 的 URL 与 body", () => {
  function spied() {
    const c = new BackendClient();
    c.rest = vi.fn(async () => ({}));
    return c;
  }
  const last = (c) => c.rest.mock.calls.at(-1);

  it("play/pause/stop/next/prev", async () => {
    const c = spied();
    await c.play("p 1");
    expect(last(c)[0]).toBe("/api/v1/peers/p%201/play");
    expect(last(c)[1].method).toBe("POST");
    await c.pause("p1"); await c.stop("p1"); await c.next("p1"); await c.prev("p1");
    expect(last(c)[0]).toBe("/api/v1/peers/p1/prev");
    expect(last(c)[1].method).toBe("POST");
  });

  it("seek 带 seconds", async () => {
    const c = spied();
    await c.seek("p1", 12);
    expect(last(c)[1].body).toEqual({ seconds: 12 });
  });

  it("setVolume ×100 且取整", async () => {
    const c = spied();
    await c.setVolume("p1", 0.376);
    expect(last(c)[1].body).toEqual({ volume: 38 });
  });

  it("setMute / setPlayMode", async () => {
    const c = spied();
    await c.setMute("p1", true);
    expect(last(c)[1].body).toEqual({ muted: true });
    await c.setPlayMode("p1", "shuffle");
    expect(last(c)[1].body).toEqual({ mode: "shuffle" });
  });

  it("playQueue 默认 startIndex=0", async () => {
    const c = spied();
    await c.playQueue("p1", [{ songId: "a" }]);
    expect(last(c)[0]).toBe("/api/v1/peers/p1/queue/play");
    expect(last(c)[1].body).toEqual({ items: [{ songId: "a" }], startIndex: 0 });
  });

  it("playContent:songId 优先", async () => {
    const c = spied();
    await c.playContent("p1", "song", "id1", { songId: "s1", playMode: "order", enqueue: true });
    expect(last(c)[0]).toBe("/api/v1/play");
    expect(last(c)[1].body).toEqual({ peerId: "p1", type: "song", id: "id1", enqueue: true, songId: "s1", playMode: "order" });
  });

  it("playContent:startIndex 二选一", async () => {
    const c = spied();
    await c.playContent("p1", "album", "id2", { startIndex: 3 });
    expect(last(c)[1].body).toEqual({ peerId: "p1", type: "album", id: "id2", enqueue: false, startIndex: 3 });
  });

  it("playContent:两者都不给", async () => {
    const c = spied();
    await c.playContent("p1", "genre", "id3");
    expect(last(c)[1].body).toEqual({ peerId: "p1", type: "genre", id: "id3", enqueue: false });
  });

  it("jumpToIndex / enqueue / removeAt / clearQueue", async () => {
    const c = spied();
    await c.jumpToIndex("p1", 4);
    expect(last(c)[0]).toBe("/api/v1/peers/p1/queue/jump");
    expect(last(c)[1].body).toEqual({ index: 4 });
    await c.enqueue("p1", [{ songId: "z" }]);
    expect(last(c)[0]).toBe("/api/v1/peers/p1/queue/enqueue");
    await c.removeAt("p1", 2);
    expect(last(c)[0]).toBe("/api/v1/peers/p1/queue/2");
    expect(last(c)[1].method).toBe("DELETE");
    await c.clearQueue("p1");
    expect(last(c)[0]).toBe("/api/v1/peers/p1/queue");
  });

  it("getQueue:offset/size 省略时无 query", async () => {
    const c = spied();
    await c.getQueue("p1");
    expect(last(c)[0]).toBe("/api/v1/peers/p1/queue");
    await c.getQueue("p1", { offset: 10, size: 200 });
    expect(last(c)[0]).toBe("/api/v1/peers/p1/queue?offset=10&size=200");
  });

  it("reorderQueue / getStatus / getPeers / getGroups / updateGroupMembers", async () => {
    const c = spied();
    await c.reorderQueue("p1", 1, 3);
    expect(last(c)[1].body).toEqual({ from: 1, to: 3 });
    await c.getStatus("p1");
    expect(last(c)[0]).toBe("/api/v1/peers/p1/status");
    await c.getPeers();
    expect(last(c)[0]).toBe("/api/v1/peers");
    await c.getGroups();
    expect(last(c)[0]).toBe("/api/v1/groups");
    await c.updateGroupMembers("g 1", ["dlna:a"], null);
    expect(last(c)[0]).toBe("/api/v1/groups/g%201/members");
    expect(last(c)[1].body).toEqual({ add: ["dlna:a"], remove: [] });
  });
});

describe("Subsonic / v1 端点 URL 拼接", () => {
  function spied() {
    const c = new BackendClient();
    c.rest = vi.fn(async () => ({}));
    return c;
  }
  const path = (c) => c.rest.mock.calls.at(-1)[0];

  it("search / getSongs", async () => {
    const c = spied();
    await c.search("a b");
    expect(path(c)).toBe("/search3?query=a%20b&songCount=20&songOffset=0&albumCount=20&albumOffset=0&artistCount=20&artistOffset=0");
    await c.getSongs({ offset: 60, count: 30 });
    expect(path(c)).toBe("/search3?query=&songCount=30&songOffset=60");
  });

  it("getLyrics / star / unstar", async () => {
    const c = spied();
    await c.getLyrics("id 1");
    expect(path(c)).toBe("/getLyricsBySongId?id=id%201&f=json");
    await c.star("s1");
    expect(path(c)).toBe("/star?id=s1");
    await c.unstar("s1");
    expect(path(c)).toBe("/unstar?id=s1");
  });

  it("getPlaylists 有无 query", async () => {
    const c = spied();
    await c.getPlaylists();
    expect(path(c)).toBe("/getPlaylists");
    await c.getPlaylists({ offset: 1, size: 2, query: "q q" });
    expect(path(c)).toBe("/getPlaylists?offset=1&size=2&query=q%20q");
  });

  it("updatePlaylist", async () => {
    const c = spied();
    await c.updatePlaylist("pl1", { songIdsToAdd: ["a", "b"] });
    expect(path(c)).toBe("/updatePlaylist?playlistId=pl1&songIdToAdd=a&songIdToAdd=b");
    await c.updatePlaylist("pl1");
    expect(path(c)).toBe("/updatePlaylist?playlistId=pl1");
  });

  it("getStarred", async () => {
    const c = spied();
    await c.getStarred();
    expect(path(c)).toBe("/getStarred2");
    await c.getStarred({ offset: 5, size: 10, query: "x" });
    expect(path(c)).toBe("/getStarred2?offset=5&size=10&query=x");
  });

  it("getAlbumList2 有无 genre", async () => {
    const c = spied();
    await c.getAlbumList2();
    expect(path(c)).toBe("/getAlbumList2?type=alphabeticalByName&size=300&offset=0");
    await c.getAlbumList2({ type: "byGenre", genre: "rock", size: 5, offset: 2 });
    expect(path(c)).toBe("/getAlbumList2?type=byGenre&size=5&offset=2&genre=rock");
  });

  it("getArtists / getArtist / getAlbum / getGenres / getPlaylistSongs", async () => {
    const c = spied();
    await c.getArtists();
    expect(path(c)).toBe("/getArtists");
    await c.getArtist("ar1");
    expect(path(c)).toBe("/getArtist?id=ar1");
    await c.getAlbum("al1");
    expect(path(c)).toBe("/getAlbum?id=al1");
    await c.getAlbum("al1", { offset: 3, size: 8 });
    expect(path(c)).toBe("/getAlbum?id=al1&offset=3&size=8");
    await c.getGenres();
    expect(path(c)).toBe("/getGenres");
    await c.getPlaylistSongs("pl1", { offset: 1, size: 2 });
    expect(path(c)).toBe("/getPlaylist?id=pl1&offset=1&size=2");
  });

  it("V2 分页端点", async () => {
    const c = spied();
    await c.getSongsV2();
    expect(path(c)).toBe("/api/v1/songs?page=1&pageSize=8");
    await c.getSongsV2({ page: 2, pageSize: 4, query: "q", genre: "g" });
    expect(path(c)).toBe("/api/v1/songs?page=2&pageSize=4&query=q&genre=g");
    await c.getAlbumsV2({ query: "x" });
    expect(path(c)).toBe("/api/v1/albums?page=1&pageSize=8&query=x");
    await c.getArtistsV2({ query: "y" });
    expect(path(c)).toBe("/api/v1/artists?page=1&pageSize=8&query=y");
    await c.getGenresV2({ query: "z" });
    expect(path(c)).toBe("/api/v1/genres?page=1&pageSize=8&query=z");
    await c.getPlaylistsV2();
    expect(path(c)).toBe("/api/v1/playlists?page=1&pageSize=200");
  });

  it("首页推荐端点", async () => {
    const c = spied();
    await c.getHomePlaylistCount();
    expect(path(c)).toBe("/api/v1/home/playlist-count");
    await c.getHomeCards();
    expect(path(c)).toBe("/api/v1/recommend/home-cards");
    await c.getRecommend();
    expect(path(c)).toBe("/api/v1/recommend");
    await c.getLocalRecommend();
    expect(path(c)).toBe("/api/v1/local-recommend");
    await c.refreshRecommend();
    expect(path(c)).toBe("/api/v1/recommend/refresh");
    expect(c.rest.mock.calls.at(-1)[1].method).toBe("POST");
    await c.importRecommendPlaylist("prov 1", { a: 1 });
    expect(path(c)).toBe("/api/v1/online/prov%201/recommend/import");
  });

  it("搜索 provider / remoteSearch 归一为 items", async () => {
    const c = spied();
    await c.getSearchProviders("song");
    expect(path(c)).toBe("/api/v1/song-search/providers");
    c.rest = vi.fn(async () => ({ playlists: [{ id: "p" }] }));
    await expect(c.remoteSearch("playlist", "prov1", "q")).resolves.toEqual({ items: [{ id: "p" }] });
    c.rest = vi.fn(async () => ({ items: [{ id: "s" }] }));
    await expect(c.remoteSearch("song", "prov1", "q")).resolves.toEqual({ items: [{ id: "s" }] });
    c.rest = vi.fn(async () => ({}));
    await expect(c.remoteSearch("song", "prov1", "q")).resolves.toEqual({ items: [] });
  });

  it("聚合搜索", async () => {
    const c = spied();
    c.rest = vi.fn(async () => ({ playlists: [{ id: "p" }], providers: ["a"] }));
    await expect(c.aggregatePlaylistSearch("q")).resolves.toEqual({ playlists: [{ id: "p" }], providers: ["a"] });
    c.rest = vi.fn(async () => ({ items: [{ id: "i" }], providers: ["b"] }));
    await expect(c.aggregateEntitySearch("song", "q")).resolves.toEqual({ items: [{ id: "i" }], providers: ["b"] });
    c.rest = vi.fn(async () => ({}));
    await expect(c.aggregatePlaylistSearch("q")).resolves.toEqual({ playlists: [], providers: [] });
    await expect(c.aggregateEntitySearch("song", "q")).resolves.toEqual({ items: [], providers: [] });
  });

  it("remoteItems / importRemoteSongs / importRemoteCollection / getTask", async () => {
    const c = spied();
    await c.remoteItems("album", "prov1");
    expect(path(c)).toBe("/api/v1/album-search/prov1/items");
    await c.remoteItems("album", "prov1", { source: "s", id: "i", name: "n" });
    expect(path(c)).toBe("/api/v1/album-search/prov1/items?source=s&id=i&name=n");
    await c.importRemoteSongs("prov1", [{ a: 1 }]);
    expect(path(c)).toBe("/api/v1/song-search/prov1/import");
    await c.importRemoteCollection("playlist", "prov1", { b: 2 });
    expect(path(c)).toBe("/api/v1/playlist-search/prov1/import");
    await c.getTask("t 1");
    expect(path(c)).toBe("/api/v1/tasks/t%201");
  });

  it("waitTask:ok / error / timeout", async () => {
    const c = spied();
    c.getTask = vi.fn(async () => ({ task: { status: "ok", result: { ids: [1] } } }));
    await expect(c.waitTask("t")).resolves.toEqual({ ids: [1] });
    c.getTask = vi.fn(async () => ({ task: { status: "error", error: "bad" } }));
    await expect(c.waitTask("t")).rejects.toThrow("bad");
    c.getTask = vi.fn(async () => ({ task: { status: "error" } }));
    await expect(c.waitTask("t")).rejects.toThrow("task failed");
    c.getTask = vi.fn(async () => { throw new Error("x"); });
    await expect(c.waitTask("t", { intervalMs: 1, maxMs: -1 })).rejects.toThrow("task timeout");
  });
});

describe("coverUrl / requestCover", () => {
  it("无 coverId → null", () => {
    const c = new BackendClient();
    expect(c.coverUrl(null)).toBe(null);
  });

  it("proxy + apiKey:追加 token 用 &", () => {
    const c = new BackendClient({ apiKey: "K" });
    c.mode = "proxy";
    expect(c.coverUrl("id 1")).toBe("/api/musicflow/rest/getCoverArt?id=id%201&size=160&token=K");
  });

  it("proxy 无 apiKey:不带 token", () => {
    const c = new BackendClient();
    c.mode = "proxy";
    expect(c.coverUrl("id")).toBe("/api/musicflow/rest/getCoverArt?id=id&size=160");
  });

  it("direct 带 token", () => {
    const c = new BackendClient({ url: "http://h" });
    c.token = "T";
    expect(c.coverUrl("id")).toBe("http://h/rest/getCoverArt?id=id&size=160&token=T");
  });

  it("requestCover:无 coverId → null", async () => {
    const c = new BackendClient();
    await expect(c.requestCover(null)).resolves.toBe(null);
  });

  it("requestCover direct:成功转 objectURL 并缓存", async () => {
    globalThis.fetch = vi.fn(async () => jsonRes({}, "image/png"));
    const c = new BackendClient({ url: "http://h", apiKey: "K" });
    c.mode = "direct";
    const url = await c.requestCover("c1");
    expect(typeof url).toBe("string");
    const again = await c.requestCover("c1");
    expect(again).toBe(url); // 命中缓存
  });

  it("requestCover proxy + apiKey:走 fetchWithAuth", async () => {
    const fwa = vi.fn(async () => jsonRes({}, "image/png"));
    const c = new BackendClient({ hass: { fetchWithAuth: fwa }, apiKey: "K" });
    c.mode = "proxy";
    const url = await c.requestCover("c2");
    expect(typeof url).toBe("string");
    expect(fwa.mock.calls[0][0]).toContain("token=K");
  });

  it("requestCover:失败删除缓存并返回 null", async () => {
    const fetchMock = vi.fn(async () => badRes(404));
    globalThis.fetch = fetchMock;
    const c = new BackendClient({ url: "http://h", apiKey: "K" });
    c.mode = "direct";
    await expect(c.requestCover("c3")).resolves.toBe(null);
    await c.requestCover("c3");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("requestCover:fetch 抛错也返回 null", async () => {
    globalThis.fetch = vi.fn(async () => { throw new Error("net"); });
    const c = new BackendClient({ url: "http://h", apiKey: "K" });
    c.mode = "direct";
    await expect(c.requestCover("c4")).resolves.toBe(null);
  });

  it("requestCover:并发重入返回同一 promise", async () => {
    let resolveFetch;
    const fetchMock = vi.fn(() => new Promise((r) => { resolveFetch = () => r(jsonRes({}, "image/png")); }));
    globalThis.fetch = fetchMock;
    const c = new BackendClient({ url: "http://h", apiKey: "K" });
    c.mode = "direct";
    const p1 = c.requestCover("c5");
    const p2 = c.requestCover("c5");
    resolveFetch();
    const [u1, u2] = await Promise.all([p1, p2]);
    expect(u1).toBe(u2); // 同一缓存条目
    expect(typeof u1).toBe("string");
    expect(fetchMock).toHaveBeenCalledTimes(1); // 只发一次请求
  });
});

describe("childToQueueItem", () => {
  it("各后缀 mime 映射", () => {
    const map = { mp3: "audio/mpeg", flac: "audio/flac", wav: "audio/wav", aac: "audio/aac", ogg: "audio/ogg", m4a: "audio/mp4", opus: "audio/opus", wma: "audio/x-ms-wma", ape: "audio/ape" };
    for (const [suffix, mime] of Object.entries(map)) {
      expect(childToQueueItem({ id: "1", suffix }).mime).toBe(mime);
    }
  });

  it("未知后缀回退 audio/mpeg", () => {
    expect(childToQueueItem({ id: "1", suffix: "xyz" }).mime).toBe("audio/mpeg");
    expect(childToQueueItem({ id: "1" }).mime).toBe("audio/mpeg");
  });

  it("coverArt 回退 al-<albumId>,字段缺省", () => {
    const r = childToQueueItem({ songId: "s1", albumId: "a1", suffix: "FLAC" });
    expect(r).toEqual({
      songId: "s1", title: "未知", artist: undefined, album: undefined,
      albumId: "a1", mime: "audio/flac", coverArt: "al-a1", duration: undefined,
    });
  });

  it("有 coverArt 时优先", () => {
    expect(childToQueueItem({ id: "1", coverArt: "c9", albumId: "a1" }).coverArt).toBe("c9");
  });
});

describe("parseLyrics", () => {
  it("优先取 synced", () => {
    const res = {
      lyricsList: {
        structuredLyrics: [
          { synced: false, line: [{ start: 0, value: "plain" }] },
          { synced: true, line: [{ start: 1000, value: "a" }, { start: 2000, value: "b" }] },
        ],
      },
    };
    expect(parseLyrics(res)).toEqual([{ time: 1, text: "a" }, { time: 2, text: "b" }]);
  });

  it("无 synced 时取第一个", () => {
    const res = { lyricsList: { structuredLyrics: [{ line: [{ start: 500, value: "x" }] }] } };
    expect(parseLyrics(res)).toEqual([{ time: 0.5, text: "x" }]);
  });

  it("无 line → []", () => {
    expect(parseLyrics({ lyricsList: { structuredLyrics: [{}] } })).toEqual([]);
    expect(parseLyrics({})).toEqual([]);
    expect(parseLyrics(undefined)).toEqual([]);
  });

  it("过滤无 start 的行", () => {
    const res = { lyricsList: { structuredLyrics: [{ synced: true, line: [{ value: "no-start" }, { start: 1000, value: "ok" }, { start: null, value: "null" }] }] } };
    expect(parseLyrics(res)).toEqual([{ time: 1, text: "ok" }]);
  });

  it("按时间升序", () => {
    const res = { lyricsList: { structuredLyrics: [{ synced: true, line: [{ start: 3000, value: "c" }, { start: 1000, value: "a" }, { start: 2000, value: "b" }] }] } };
    expect(parseLyrics(res).map((l) => l.text)).toEqual(["a", "b", "c"]);
  });
});
