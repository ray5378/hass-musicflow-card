// 测试环境最小桩:补 happy-dom 未实现 / 不稳定的浏览器 API。
// 仅覆盖卡片与后端客户端实际用到的部分,不引入任何业务逻辑。

// ---- WebSocket:可手动触发 onopen/onclose/onerror/onmessage 的假实现 ----
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.sent = [];
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    MockWebSocket.instances.push(this);
  }
  send(data) { this.sent.push(data); }
  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (typeof this.onclose === "function") this.onclose({ type: "close" });
  }
  // ---- 测试辅助(非标准 API)----
  _open() { this.readyState = MockWebSocket.OPEN; if (this.onopen) this.onopen({ type: "open" }); }
  _message(payload) {
    const data = typeof payload === "string" ? payload : JSON.stringify(payload);
    if (this.onmessage) this.onmessage({ data });
  }
  _serverClose() { this.readyState = MockWebSocket.CLOSED; if (this.onclose) this.onclose({ type: "close" }); }
  _error(e) { if (this.onerror) this.onerror(e || { type: "error" }); }
}
MockWebSocket.instances.length = 0;

// ---- IntersectionObserver:记录 observe/unobserve,支持手动触发回调 ----
class MockIntersectionObserver {
  static instances = [];
  constructor(cb, opts) {
    this.cb = cb;
    this.options = opts;
    this.observed = new Set();
    MockIntersectionObserver.instances.push(this);
  }
  observe(el) { this.observed.add(el); }
  unobserve(el) { this.observed.delete(el); }
  disconnect() { this.observed.clear(); }
  takeRecords() { return []; }
  _trigger(entries) { this.cb(entries, this); }
}
MockIntersectionObserver.instances.length = 0;

class MockResizeObserver {
  constructor(cb) { this.cb = cb; }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// ---- canvas 2d 上下文桩:让封面亮度/强调色分析走通 ----
function makeFake2dContext() {
  return {
    drawImage() {},
    getImageData() { return { data: new Uint8ClampedArray(24 * 24 * 4) }; },
  };
}

const g = globalThis;

g.WebSocket = MockWebSocket;
g.__MockWebSocket = MockWebSocket;
g.__MockIntersectionObserver = MockIntersectionObserver;
// 强制替换:测试需要检查 observed/instances(happy-dom 自带的 IO 无这些字段)。
g.IntersectionObserver = MockIntersectionObserver;
if (typeof g.ResizeObserver === "undefined") g.ResizeObserver = MockResizeObserver;

// 强制替换:happy-dom 的 URL.createObjectURL 返回值不稳定,统一成可断言的字符串。
if (typeof g.URL === "undefined") g.URL = {};
let __objN = 0;
g.URL.createObjectURL = () => `blob:mock-${++__objN}`;
g.URL.revokeObjectURL = () => {};

if (typeof g.HTMLCanvasElement !== "undefined") {
  g.HTMLCanvasElement.prototype.getContext = function () { return makeFake2dContext(); };
}

if (typeof g.requestIdleCallback !== "function") g.requestIdleCallback = () => 0;

// rAF 用同步回调:滚动节流逻辑无需真等一帧,便于断言同步结束后的状态。
g.requestAnimationFrame = (cb) => { cb(0); return 0; };
g.cancelAnimationFrame = () => {};

if (typeof g.window !== "undefined") {
  g.window.WebSocket = MockWebSocket;
  g.window.IntersectionObserver = MockIntersectionObserver;
  g.window.requestAnimationFrame = g.requestAnimationFrame;
  g.window.cancelAnimationFrame = g.cancelAnimationFrame;
}
