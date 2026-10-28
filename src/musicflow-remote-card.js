
// controller for a MusicFlow server. It connects directly to the backend's
// real-time /ws channel + REST API (via the `musicflow/backend_config` HA WS
// command), so it is an equal peer to the Web/App clients.
import { LitElement, html, css, nothing } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { BackendClient, childToQueueItem, parseLyrics } from "./backend-client.js";
import { localize } from "./localize/localize.js";

const PLAY_MODES = ["order", "one", "all", "shuffle"];
// 服务端能自行解析成队列的内容类型:这些类型起播走主通道 POST /v1/play
// (只传内容 id,服务端查库解析),不必把整份歌曲列表推给 /queue/play。
const CONTENT_PLAY_TYPES = new Set(["song", "playlist", "album", "artist", "genre"]);
// 播放模式提示经 localize 读取(playModeTip.*);PLAY_MODE_ICON 为图标映射(不含文案)
// 与主项目一致(lucide):order→list-ordered / one→repeat-1 / all→repeat / shuffle→shuffle
const PLAY_MODE_ICON = { order: "listOrdered", one: "repeat1", all: "repeat", shuffle: "shuffle" };
// 媒体库全库统一滚动(所有库类型同一套):虚拟滚动 + 窗口化预取。
// - CHUNK:每次向服务端要一块的条数(服务端 offset/size 分页,内存恒定 1 块)。
// - ROW_STEP:固定行高 + 行距(px),必须与 CSS .bitem 高(48)+ .br-list gap(2)一致,
//   虚拟滚动按它计算窗口与占位高度。
// - VS_OVERSCAN:窗口上下多渲染的行数(预取提前量)。
// - VS_CONCURRENCY:同时在途的块请求上限(快速滚动时不打爆服务端)。
const CHUNK = 200;
const ROW_STEP = 50;
const VS_OVERSCAN = 6;
const VS_CONCURRENCY = 2;
// 队列窗口尚未初始化(qWinEnd<0)时的首屏兜底行数:保证打开队列页一定有行渲染,
// 不会出现「有 total、有缓存、但零行」的整页空白(2026-10-28 缺陷)。
const Q_FIRST_ROWS = 12;
// 首屏行数(px 高度 ≥ 一屏):这些行的封面给 fetchpriority=high 提前拉,加快首屏观感;
// 其余行保持懒加载,不设高优先级。
const VS_PRIO_ROWS = 8;

// 歌词滚动:单行高度(px)。必须与 CSS .lyricbox-line 的 height/line-height 一致,
// 因为轨道位移是按「行数 x 行高」算的。视口高 = LYRIC_VIEW_LINES x 该值(见 CSS .lyricbox)。
const LYRIC_LINE_H = 20;
// 视口显示行数,以及「当前行」落在第几槽(0 基)。完整模式 = 5 行视口、当前行固定在第 2 行。
const LYRIC_VIEW_LINES = 5;
const LYRIC_CUR_SLOT = 1;
// 极简歌词模式(auto-hide):歌词视口扩到 188px(≈9.4 行,标题下沿到卡底),当前行落在第 5 槽(中段)。
const LYRIC_CUR_SLOT_MINI = 4;
// 暂停去抖:isPlaying 变 false 后等这么久才退出极简。
// 切歌/短暂暂停(几秒内恢复)都让 mini 保持;真暂停持续 20s 才回退完整模式。
const MINI_PAUSE_REVERT_MS = 20000;
// 极简歌词模式「退出后点击拦截窗口」(ms):退出 mini 后这段时间内的一击只用于退出极简模式,
// 不落到刚(或正在)露出的控件上。根因:桌面 pointermove / 触屏 pointerenter 会在 click 之前
// 就退出 mini,而控件退出瞬间即 visibility:visible —— 同一次手势的 click 于是命中播放/暂停等
// 按钮,变成「点空白处却切了歌」。窗口取 300ms:盖住「移动即点」的连击,又短于人的反应时间,
// 不影响看清控件后的正常点击。触屏另由 pointerType === "touch" 走「只在 click 退出」分支,
// 长按也不漏(见 _onCardPointer / _onWrapClickCapture)。
const MINI_CLICK_GUARD_MS = 300;
// 卡片版本(发版时与 package.json 同步;控制台可见,用于核对实际加载的版本,排查 HACS/浏览器缓存)
const CARD_VERSION = "2.8.20";

// 流转页拖拽/边缘自动滚动参数(与客户端 PlayerTransferPage 同一套手感):
// - TP_DRAG_THRESHOLD: 指针位移超过它才算「拖拽」,否则按单击(切遥控目标)处理。
// - TP_AUTOSCROLL_ZONE: 滚动视口**上下边缘内的隐形热区**高度(px)。热区不占布局、
//   无可见元素;指针进入即连续滚动,越靠近边缘越快。
// - TP_AUTOSCROLL_MIN/MAX_SPEED: 热区内缘→外缘的速度区间(px/s)。
// - 底部热区止于滚动视口下缘:回收站在滚动区之外,越界即不滚动、只触发销毁,
//   二者物理分界,不会误触。
const TP_DRAG_THRESHOLD = 6;
const TP_AUTOSCROLL_ZONE = 44;
const TP_AUTOSCROLL_MIN_SPEED = 140;
const TP_AUTOSCROLL_MAX_SPEED = 1100;

// 拖动 seek 目标的精度契约 ——「最小粒度 1 秒」(2026-09-22 事故沉淀)。
//
// 服务端 sendspin 流式引擎按 **25ms 帧栅格**取帧(lo = floor(pos/25) * 2400 样点),而
// 滑动窗口的基准是「毫秒 → 样本」换算。**只有目标落在 25ms 整数倍上两者才严格相等**;
// 否则子进程每轮取帧都判淘汰、游标却不前进 → 纯微任务自旋 → 事件循环饿死 → 心跳超时
// 被 65s 看门狗 SIGKILL(现场:拖动进度条后播放静默死掉,而客户端正常 —— 因为客户端
// 下发的是 Duration.inSeconds(整秒),1000 / 25 = 40,整秒必然是 25ms 的整数倍)。
//
// 故卡片所有拖拽 seek 目标一律整秒,与客户端 inSeconds 同语义(向下取整)。服务端
// /v1/peers/:peerId/seek 入口另有兜底,但契约要求**这里就发整秒**(最外层守卫)。
// 守卫:tools/guard-seek-contract.mjs 的「精度」规则(同时校验 src 与 dist)。
const SEEK_GRANULARITY_SEC = 1;
function alignSeekSeconds(seconds) {
  if (!Number.isFinite(seconds)) return 0;
  return Math.max(0, Math.floor(seconds / SEEK_GRANULARITY_SEC) * SEEK_GRANULARITY_SEC);
}

// lucide 24x24 图标内容(stroke 风格,与 MusicFlow 主项目 MfIcon 同源)
const MF_ICONS = {
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  prev: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>',
  next: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
  shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  repeat1: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10h1v4"/>',
  listOrdered: '<line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  volume2: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  volumeX: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  queue: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  mediaLibrary: '<path d="M20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M20,16H8V4H20M12.5,15A2.5,2.5 0 0,0 15,12.5V7H18V5H14V10.5C13.58,10.19 13.07,10 12.5,10A2.5,2.5 0 0,0 10,12.5A2.5,2.5 0 0,0 12.5,15M4,6H2V20A2,2 0 0,0 4,22H18V20H4"/>',
  // 媒体库分类图标(lucide,与主项目前端 lucide-vue-next 完全同款路径):
  // 音乐→Headphones / 专辑→Disc3 / 艺术家→User / 风格→Library / 歌单→List / 我喜欢→Heart(filled)
  headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  disc3: '<circle cx="12" cy="12" r="10"/><path d="M6 12c0-1.7.7-3.2 1.8-4.2"/><circle cx="12" cy="12" r="2"/><path d="M18 12c0 1.7-.7 3.2-1.8 4.2"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  list: '<path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/>',
  library: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
  heart2: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  speaker: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 6h.01"/><circle cx="12" cy="14" r="4"/><path d="M12 14h.01"/>',
  // 客户端本机实例(安卓/Windows):与 DLNA 的 speaker 区分开来,一眼看出是「客户端播放器」。
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  // 流转播放:无限循环(∞)与客户端 `AppIcons.transferInfinity` 同形 —— 两段交叉闭合弧 + 圆头描边。
  transfer: '<path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/>',
  // 群组(多台设备的集合,lucide users)/ 回收站(lucide trash-2)
  group: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
};

function log(...args) { console.log("[MF card]", ...args); }
function err(...args) { console.error("[MF card]", ...args); }

/* 调试日志开关(与后端「设置 → 日志等级」对应的前端侧开关)。
   默认 info:只保留 log/err(控制台干净,等同旧行为)。
   打开方式(二选一,无需改代码):
     - 浏览器控制台执行 `localStorage.mfLog = "debug"`,然后刷新页面;
     - 或在 URL 后加 `?mfLog=debug`(优先级更高,方便临时抓一次)。
   关闭:`localStorage.removeItem("mfLog")` 后刷新。
   打开后 dbg() 会打印 seek / 进度回退 / 陈旧上报丢弃等链路细节 —— 拖动进度条
   出问题时的第一手证据都在这几行里。 */
const MF_LOG_LEVEL = (() => {
  try {
    const q = new URLSearchParams(location.search).get("mfLog");
    if (q) return String(q).toLowerCase();
    return String(localStorage.getItem("mfLog") || "info").toLowerCase();
  } catch (_e) {
    return "info";
  }
})();
function dbg(...args) { if (MF_LOG_LEVEL === "debug") console.debug("[MF card][dbg]", ...args); }

// HSL → RGB,供封面取色(accent)用:返回 [r,g,b] 0-255。
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) { r = c; g = x; }
  else if (hp < 2) { r = x; g = c; }
  else if (hp < 3) { g = c; b = x; }
  else if (hp < 4) { g = x; b = c; }
  else if (hp < 5) { r = x; b = c; }
  else { r = c; b = x; }
  const m = l - c / 2;
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// 媒体库根层级分类图标映射(与主项目前端同款):歌单→List / 专辑→Disc3 / 音乐→Headphones
// 艺术家→User / 风格→Library / 首页推荐→Home
const CAT_ICONS = { home: "home", playlists: "list", albums: "disc3", songs: "headphones", artists: "user", genres: "library" };
const CAT_HEART = new Set(); // 心形分类:filled + 实心红(暂无根级分类使用)

// 未播放态「固定配色底色」(idle ambient):无封面时接管整卡底色。
// 视觉构成 = A+ 方案:N 层**固定配色**的整卡对角渐变,原地交叉淡入轮换(N = IDLE_GROUPS 长度,现 12)。
//   .idlebg 内 N 个 <i>,每层一条 linear-gradient(140deg, c1, c2 62%, #14182a 100%);
//   层初始 opacity 0,各自跑同一条 mf-cyc 关键帧,靠负 animation-delay 错峰 1/N 周期。
//   关键帧的窗口宽随 N 推导(见 _syncIdleKeyframes),不写死 —— 写死就只对某一种层数成立。
//   相位均匀错开 1/N,交叉区里必然一层在升、另一层在降,所以不会"先暗再亮"。
//   每层都是**全不透明**的渐变,叠起来按 over 合成自动归一,不会叠加变亮;
//   真正要留意的是"底层漏出"(所有层都半透时透出卡片底色)。实测最大漏出比例:
//   N=5 → 25%,N=8 → 1.56%,N=12 → 0%(错峰 8.33% 已比停留窗还密,任意时刻都有一层满不透明压着)。
// 只动 opacity —— 合成属性:无位移、无重绘、无滤镜,动画主线程零参与。
// 明确不用:
//   ① background-position 平移雪碧条(上一版做法):过渡是相邻两格的空间线性插值,
//      底色会跟着"往左走",而不是原地换色;
//   ② filter / hue-rotate:每帧都要对整层像素重跑颜色矩阵,成本 ≈ 面积 × 帧率;
//   ③ transition: background-image:Chromium 对 gradient 不做插值,会直接硬跳。
// 渐变以固定深色 #14182a 收尾,故 idle 态一律按"暗底浅字"渲染(cardCls 恒 light),
//   不再随 HA 明暗模式切浅色底 —— 保证任一配色组下白字对比度都够。
// 12 组固定配色。顺序是一条**固定的环**(代码里没有任何随机数),以**深红**为起点:
//   深红 → 青绿 → 焦橙 → 湖青 → 暗金 → 靛蓝 → 暖褐 → 藤紫 → 松墨 → 品红 → 草绿 → 烟灰 →(回深红)
// 环的顺序用 Lab ΔE 直接优化(max-min),结果 **相邻两组的最小 ΔE = 65.7** ——
//   每换一组都是一次肉眼明确的跳变(ΔE 65 约等于"中蓝 → 中橙"的差距)。
// 起点选深红:环是循环的,**旋转起点不改变任何一段相邻 ΔE**,只决定"首次进入 idle 态时先看到哪个
//   颜色"(即首屏色)。深红是这条环上彩度最高、色相最正的暖色,开场辨识度最高。
//   顺序是脚本排的、不是手排的;以后增删配色请重跑 `node tools/palette/check.cjs --order`
//   (脚本直接从本文件解析 IDLE_GROUPS,无第二份配色表),别手工插位。
// 每组 c1 按**相对亮度 Y** 定标(不是 HSL 的 L):
//   峰 .175(草绿/湖青/靛蓝) / .140(品红/青绿/焦橙/暗金) / .110(深红/暖褐/藤紫) / .085(烟灰) / 谷 .070(松墨),
//   峰值→谷底 1.88×。更早的 5 组版几乎等亮(0.081~0.115,只有 1.26×),交叉淡入时只有色相在挪、
//   亮度几乎不变 → 观感就是"没有呼吸"。这是整条线上最重要的一条经验。
// 判"两组看着像不像"的口径是 Lab ΔE*ab,不是色相差:
//   全表最像的一对是 暖褐 vs 焦橙(ΔE 24.4),它们环上不相邻;其余组合都 ≥26。
//   初版 12 组里 松墨 vs 青绿 只有 ΔE 15~17 —— 低彩度的深青绿三色挤在 158~196°,
//   而低彩度色相必须拉很大才分得开,于是把 松墨 挪到 125°(真·墨绿)、青绿 彩度提到 65%
//   并挪到 170°,两者最近邻距离由 15 / 20 拉到 27。
// 深红 / 暗金 / 焦橙 受「暗底 + 白字」约束(Y 上限 ≈0.183,再亮白字对比度就跌破 WCAG AA),
//   只能压到这个深度,不是明亮原色 —— 这是取舍,不是取色失误。
// 烟灰是唯一的无彩组(饱和度 ~7%):补的是"色相之外的那条轴",夹在两张高彩之间当一次换气。
// 白字落在最亮的峰值组上对比度仍有 4.67:1(过 AA),故 idle 恒用浅字安全。
const IDLE_GROUPS = [
  { c1: "#b2262f", c2: "#9a3424" }, // 深红     Y .110   ← 起点(开场色)
  { c1: "#197566", c2: "#216a7c" }, // 青绿     Y .140
  { c1: "#9a5816", c2: "#a64027" }, // 焦橙     Y .140
  { c1: "#307d98", c2: "#26786b" }, // 湖青 峰  Y .175
  { c1: "#796811", c2: "#7e5b1f" }, // 暗金     Y .140
  { c1: "#4c71c7", c2: "#317394" }, // 靛蓝 峰  Y .175
  { c1: "#874f3a", c2: "#705030" }, // 暖褐     Y .110
  { c1: "#7a42ab", c2: "#893386" }, // 藤紫     Y .110
  { c1: "#1d5621", c2: "#1a4f30" }, // 松墨 谷  Y .070
  { c1: "#ad3a92", c2: "#a43a6b" }, // 品红     Y .140
  { c1: "#3a841f", c2: "#4e7720" }, // 草绿 峰  Y .175
  { c1: "#4f535a", c2: "#4b4c54" }, // 烟灰 无彩 Y .085
];
const IDLE_GROUP_COUNT = IDLE_GROUPS.length;

// 强调色(图标 / 进度条 / 选中态)仍跟随主题:auto 取 HA --primary-color 派生;
// 预设只固定强调色色相,不再影响底色(底色恒为上面那 12 组固定配色)。
const IDLE_THEMES = {
  auto: null, // 运行时从 HA 主题 --primary-color 派生
  twilight: { color: "#5b6fa8" },
  ocean: { color: "#3d7f92" },
  ember: { color: "#9c6247" },
  forest: { color: "#4a7a55" },
  mono: { color: "#8a919c" },
};
const IDLE_SPEED_FACTOR = { slow: 1.6, normal: 1, fast: 0.6, off: 0 }; // 速度档(周期倍率)
// 换色节奏:idle_speed 缩放「每组停留秒数」,normal = 7s/组、一轮 56s(数值越小越快)
const IDLE_SWAP_BASE = 7;

// CSS 颜色 → [r,g,b]:支持 #rgb / #rrggbb / rgb(a,b,c)。解析失败返回 null。
function parseCssColor(str) {
  if (!str) return null;
  const s = String(str).trim();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    const n = h.length === 3 ? h.split("").map((c) => parseInt(c + c, 16)) : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    return n;
  }
  const rgb = s.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (rgb) return [+rgb[1], +rgb[2], +rgb[3]];
  return null;
}

// RGB → HSL(h:0-360, s/l:0-1)。仅取色用,不追求感知精度。
function rgbToHsl(r, g, b) {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const mx = Math.max(rr, gg, bb), mn = Math.min(rr, gg, bb);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  let h = 0, s = 0;
  if (d) {
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) * 60;
    else if (mx === gg) h = ((bb - rr) / d + 2) * 60;
    else h = ((rr - gg) / d + 4) * 60;
  }
  return [h, s, l];
}

class MusicFlowRemoteCard extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      _config: { state: true },
    };
  }

  setConfig(config) {
    this._config = config || {};
    this._idleKey = ""; // idle_theme / 明暗模式可能变了,下次重新算底色配色
  }

  constructor() {
    super();
    this._client = null;
    this._ready = false;
    this._peerRestoreDone = false; // 一次性:刷新后从 localStorage 恢复上次选中的遥控目标
    this._ui = {
      error: "",
      connected: false,
      serverOk: false,
      peers: [],
      currentPeerId: "",
      // 流转播放页:true = 用「与当前卡片同尺寸的整卡覆盖层」显示流转页(见 _renderTransfer)。
      transferOpen: false,
      // 流转页的群组管理态:点群组圆进入,保持到用户再点群组 / 关页。存 group:<gid>。
      // 首页不再提供增减成员能力(2026-10-23 用户拍板),群组成员管理只在流转页。
      transferGroupId: null,
      transferBusy: false, // 流转页内任一异步操作(切换/流转/销毁/加减成员)进行中:禁止重复操作
      transferMsg: "",     // 流转页内联提示(成功/失败)
      transferMsgErr: false,
      queue: { total: 0, currentIndex: -1, playMode: "shuffle", isActive: false, ended: false },
      // 队列虚拟滚动状态:稀疏缓存(Map idx→item)+ 已加载/加载中块集合 + 渲染窗口
      qCache: new Map(),
      qLoaded: new Set(),
      qLoading: new Set(),
      qWinStart: 0,
      qWinEnd: -1,
      catIconSize: 42, // 媒体库根层级分类图标尺寸(按可用高度自适应;卡片宽由容器查询保证 hover 不超)
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
      lyricIndex: -1,
      liked: false,
      accentRgb: null, // 封面提取的强调色 "r,g,b"(当前播放器立体样式 --acc;null=回落中性白,不落品牌红)
      wsState: "init", // init | open(WS 正常) | rest(WS 断,REST 兜底) | down(都不可达)
      showQueue: false,
      showBrowser: false,
      browserStack: [],
      homeRefreshing: false, // 首页推荐手动刷新中(禁用重复点击)
      showVolume: false,
      mini: false, // 极简歌词模式:播放控件/切换器隐藏,歌词视口扩展(空闲自动进入)
      coverLightText: true, // 封面背景融合:true=浅色文字(暗背景),false=深色文字(亮背景)
      volAnchor: null,
    };
    // ===== 流转页运行态(非响应式)=====
    this._transferGroupMembers = new Set(); // 流转页选中群组的成员键集合
    this._tpMsgTimer = null;   // 内联提示自动清除
    this._tpCloseTimer = null; // 成功后延迟关页(让「已流转/已切换」提示能被看到)
    this._tpDrag = null;       // { src, srcEl, pointerId, x, y, startX, startY, active }
    this._tpGhostEl = null;    // 拖拽幽灵(position:fixed, pointer-events:none)
    this._tpAutoRAF = null;    // 自动滚动 rAF 句柄
    this._tpLastRAFAt = null;
    this._tpOverPeerId = null; // 当前落点(拖动经过的播放端)
    this._tpOverTrash = false; // 指针是否已在回收站(此时不滚动)
    this._tpSuppressClickUntil = 0; // 拖拽结束后抑制一次 click(否则会误触「切目标」)
    this._tpDownInPeer = false;  // 本次 press 是否落在播放端格子内(含名称/文字),用于避免误判「点空白」关页
    this._tpSession = 0;        // 流转页会话号:关页/重开即递增,丢弃旧会话的异步回写
    this._tpMoveHandler = null;
    this._tpUpHandler = null;
    this._tpCancelHandler = null;
    this._tickTimer = null;
    this._pollTimer = null;
    this._lastFetchStartedAtMs = 0; // 最近一次状态拉取的发起时刻(ms):与 _seekAckAtMs 比较判因果
    this._refreshTimer = null; // 起播强制刷新信号去抖/重试定时器(见 _onPlayerRefresh)
    this._heartbeatTimer = null;
    this._volumeDebounce = null;
    this._miniTimer = null; // 极简歌词模式:空闲隐藏计时器
    this._pauseTimer = null; // 极简歌词模式:暂停去抖计时器(切歌瞬间 isPlaying 短暂 false 也会触发,需去抖)
    // 极简模式相关状态快照:仅当这些值真正变化时才重置计时(进度 tick 每秒都 requestUpdate,不能重置)
    this._miniWatch = { isPlaying: false, lyricCount: 0, showVolume: false, showQueue: false, showBrowser: false, transferOpen: false, songId: null };
    this._focusInside = false; // 键盘焦点是否在卡片内(焦点在内不进入极简,保证控件可达)
    this._miniExitAt = 0; // 极简模式最近一次「退出」的时刻(ms):退出后一击只用于退出,不传给控件
    // 极简模式点击守卫必须挂在 host 的捕获阶段:Lit 模板里同一个元素只能绑一个 @click,
    // 而守卫要抢在控件 handler 之前执行;捕获阶段从 host 往影子根内部走,先于 .wrap 上任何监听。
    this._hostClickCapture = (e) => this._onWrapClickCapture(e);
    this._miniShift = 64; // 极简模式上移量(px):.now 顶部 − .outputs 顶部的静态布局差;64 为 DOM 未就绪时的兜底
    this._lastPos = -1; // position 前进自愈基线(播放状态判定,见 _applyStatus)
    this._seekIssuedAt = 0; // 本卡片最近一次发起 seek 的时刻(ms);用于丢弃"seek 之前采样的"陈旧 position
    this._seekAckAtMs = 0; // seek REST 响应返回时刻(ms)。服务端 seek 同步语义:响应=锚点已落位,
    // 故「在此之前发起」的状态拉取数据可能早于 seek → 丢弃(MA 因果判定,无固定窗口)
    this._volumeIssuedAt = 0; // 最近一次下发**音量类**命令(volume / mute)的时刻(ms)
    this._transportIssuedAt = 0; // 最近一次下发**传输类**命令(play / pause)的时刻(ms)
    this._coverObserver = null; // 视口懒加载封面的 IntersectionObserver
    this._coverObserverRoot = null; // 该 observer 绑定的滚动容器(媒体库每次重开是新节点)
    this._vsInflight = 0; // 全库滚动:同时在途的块请求数(上限 VS_CONCURRENCY)
    this._vsRaf = 0; // 滚动处理 rAF 句柄(节流)
    this._visHandler = null; // 后台 tab 回前台刷新监听
    // 未播放态流动底色:可见性(IO 判定)/ 配色缓存 / 后台 tab 监听
    this._idleVisible = true;
    this._idleObserver = null;
    this._idleVisHandler = null;
    this._idlePaletteCache = null;
    this._idleKey = "";
    this._idleBuiltKey = ""; // 已写入的配色指纹(cycle/静止态):变了才重新下发 CSS 变量
  }

  // HA 前端可能 detach 再 attach 卡片(面板切换/资源重载/其他卡片报错触发重渲染):
  // _teardown() 已断开 client,重新挂载时必须恢复连接,否则卡片永久断开直到刷新页面。
  connectedCallback() {
    super.connectedCallback();
    // 控制台版本标记:核对实际加载的 JS 版本(排查 HACS/浏览器缓存导致的"更新了但没变化")
    if (typeof console !== "undefined") console.info(`[musicflow-remote-card] v${CARD_VERSION}`);
    // 极简模式「一击只退出」守卫:捕获阶段注册在 host 上(见 _onWrapClickCapture)
    this.addEventListener("click", this._hostClickCapture, true);
    if (this._ready && this._client && !this._client.connected) {
      this._client.connect();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this._hostClickCapture, true);
    this._teardown();
  }

  _teardown() {
    if (this._tickTimer) { clearInterval(this._tickTimer); this._tickTimer = null; }
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    if (this._refreshTimer) { clearTimeout(this._refreshTimer); this._refreshTimer = null; }
    if (this._heartbeatTimer) { clearInterval(this._heartbeatTimer); this._heartbeatTimer = null; }
    if (this._probeTimer) { clearInterval(this._probeTimer); this._probeTimer = null; }
    if (this._miniTimer) { clearTimeout(this._miniTimer); this._miniTimer = null; }
    if (this._pauseTimer) { clearTimeout(this._pauseTimer); this._pauseTimer = null; }
    // 流转页:拖拽监听/幽灵节点/rAF 循环与提示定时器都必须随卡片卸载清理,
    // 否则重新挂载后 window 上会残留指向旧实例的监听。
    this._tpEndDrag();
    // 首页 chip 行横向拖动同样挂在 window 上,卸载时必须摘掉
    this._onOutDragEnd({ pointerId: this._outDrag ? this._outDrag.pointerId : undefined });
    if (this._tpMsgTimer) { clearTimeout(this._tpMsgTimer); this._tpMsgTimer = null; }
    if (this._tpCloseTimer) { clearTimeout(this._tpCloseTimer); this._tpCloseTimer = null; }
    if (this._visHandler) { document.removeEventListener("visibilitychange", this._visHandler); this._visHandler = null; }
    if (this._idleVisHandler) { document.removeEventListener("visibilitychange", this._idleVisHandler); this._idleVisHandler = null; }
    if (this._idleObserver) { this._idleObserver.disconnect(); this._idleObserver = null; }
    if (this._client) this._client.disconnect();
    if (this._coverObserver) { this._coverObserver.disconnect(); this._coverObserver = null; }
    this._coverObserverRoot = null;
  }

  set hass(hass) {
    const old = this._hass;
    this._hass = hass;
    if (!old && hass && !this._ready) this._bootstrap(hass);
  }
  get hass() { return this._hass; }

  // 本地化:跟随 HA 前端语言(zh 中文 / 其余英文),localizer 按语言缓存复用。
  _loc() {
    const lang = this._hass?.language || "";
    if (this.__locLang !== lang) { this.__locLang = lang; this.__loc = localize(lang); }
    return this.__loc;
  }

  _t(key, params) { return this._loc().t(key, params); }

  async _bootstrap(hass) {
    this._ready = true;
    const cfg = this._config || {};
    this._client = new BackendClient({
      hass,
      url: cfg.url || null,
      username: cfg.username || null,
      password: cfg.password || null,
      apiKey: cfg.api_key || null, // 旧 YAML 兜底静态 token
      // 默认 auto:先探测直连,可达则直连(最低延迟);不可达且集成支持代理时自动切
      // HA 中转。direct / proxy 仍可在 YAML 显式指定,强制只走某一种。
      transport: cfg.transport || "auto", // auto | direct | proxy
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
    // WS 断开期间每 15s 用 REST 探测一次服务器可达性,作为"调暗"的判定依据。
    this._probeTimer = setInterval(() => { if (!this._ui.connected) this._probeServer(); }, 15000);
    // 后台 tab 恢复前台时浏览器节流可能已暂停轮询/心跳,立即拉一次刷新状态。
    this._visHandler = () => {
      if (document.visibilityState === "visible" && this._client) {
        this._refreshCurrentPeerView();
      }
    };
    document.addEventListener("visibilitychange", this._visHandler);
  }

  // REST 探测服务器是否可达(只在 WS 断开时调用);成功=能和服务器通信,不变暗。
  // WS 断开期间 REST 兜底:探测成功即把设备写进列表,否则卡片会一直显示
  // "无可用播放器"(探测拿到了设备数据却不用)。
  _probeServer() {
    if (this._ui.connected || !this._client) return;
    this._client.getPeers()
      .then((res) => {
        this._ui.serverOk = true;
        this._ui.wsState = "rest"; // WS 断但 REST 通:兜底模式
        const peers = this._filterControllable(res?.peers || []).filter((p) => p.available !== false || p.kind === "group");
        if (peers.length) {
          this._ui.peers = peers;
          this._ensurePeerSelected();
        }
      })
      .catch(() => {
        this._ui.serverOk = false;
        this._ui.wsState = "down"; // REST 也不可达
      })
      .finally(() => this.requestUpdate());
  }

  _bindClient() {
    const c = this._client;
    c.on("open", () => {
      this._ui.connected = true;
      this._ui.serverOk = true;
      this._ui.wsState = "open";
      this._startHeartbeat();
      this.requestUpdate();
    });
    // WS 断开 ≠ 连不上服务器(可能只是 WS 通道被空闲超时掐断)。先 REST 探测,
    // 探测成功说明服务器可达,保持卡片正常显示;探测失败才调暗。
    c.on("close", () => { this._ui.connected = false; this._probeServer(); this.requestUpdate(); });
    c.on("rest_ok", () => {
      if (!this._ui.serverOk) { this._ui.serverOk = true; this.requestUpdate(); }
    });
    c.on("snapshot", (devices) => this._applySnapshot(devices));
    c.on("peer_snapshot", (peers) => this._applyPeerSnapshot(peers));
    c.on("peer_update", (peer) => this._upsertPeer(peer));
    c.on("peer_queue", ({ peerId, queue }) => this._applyPeerQueue(peerId, queue));
    c.on("queue_changed", ({ deviceId, queue }) => this._applyDeviceQueue(deviceId, queue));
    c.on("state", ({ deviceId, state }) => this._applyDeviceState(deviceId, state));
    c.on("media", ({ deviceId, media }) => this._applyDeviceMedia(deviceId, media));
    c.on("refresh", ({ deviceId }) => this._onPlayerRefresh(deviceId));
    c.on("group", () => this._refreshPeers());
    c.on("group_deleted", () => this._refreshPeers());
    // 后端实时发现 DLNA 设备上线/下线 -> 刷新设备列表(peer_registered/available
    // 事件通常也会到,这里兜底确保卡片立刻显示刚上线的设备)。
    c.on("device_list_changed", () => this._refreshPeers());
    // 封面统一走 <img src> URL + 视口懒加载,浏览器按 URL 复用缓存,无需重渲染钩子
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

  // 本卡片控制后端驱动的播放器:DLNA 设备、AirPlay 设备、Sendspin 客户端,以及
  // MusicFlow 客户端本机实例(安卓 / Windows,kind==="local" 且非 web 平台)。
  // 服务端 decoratePeersForClient 已对其它端隐藏 web 行(Web 不再作为被遥控目标),
  // 这里再以 platform!=="web" 保险一次;group 是「容器」型播放器,照常展示
  // (点它进群组管理模式加减成员)。
  _isControllablePeer(p) {
    if (!p) return false;
    if (typeof p.peerId === "string") {
      if (p.peerId.startsWith("group:")) return true;
      if (p.peerId.startsWith("dlna:") || p.peerId.startsWith("airplay:") || p.peerId.startsWith("sendspin:")) return true;
      if (p.peerId.startsWith("local:")) return p.platform !== "web";
      return false;
    }
    const k = p.kind || "";
    if (k === "group") return true;
    if (k === "dlna" || k === "airplay" || k === "sendspin") return true;
    if (k === "local") return p.platform !== "web";
    return false;
  }
  _filterControllable(peers) {
    return (peers || []).filter((p) => this._isControllablePeer(p));
  }

  /** 展示序(与客户端 / Web 同一口径):**正在播的排前面**;同为在播或同为闲置时
   *  按 **客户端本机 > 群组 > 独立播放器**;再相同按名称。
   *  「正在播」取服务端 queue.isActive —— 多台设备一起响时,在播的先看得到。 */
  _sortPeersForDisplay(list) {
    const playing = (p) => ((p && p.queue && p.queue.isActive) ? 0 : 1);
    const rank = (p) => (p && p.kind === "local" ? 0 : p && p.kind === "group" ? 1 : 2);
    return [...(list || [])].sort((a, b) => {
      const d = playing(a) - playing(b);
      if (d) return d;
      const k = rank(a) - rank(b);
      if (k) return k;
      return String((a && a.name) || "").localeCompare(String((b && b.name) || ""));
    });
  }

  /** 该 peer 是否被某个**活跃组**托管(服务端出口层 `managedByGroup` 标记)。
   *  返回托管组的 peerId(`group:<gid>`);不在托管关系中返回 null。 */
  _managedGroupPeerId(peerId) {
    const p = (this._ui.peers || []).find((x) => x.peerId === peerId);
    const gid = p && p.managedByGroup;
    return gid ? `group:${gid}` : null;
  }

  /** 把「用户想选的 peer」解析成**真正可遥控的目标**:被活跃组托管的成员设备收敛到
   *  该组,其余原样返回。判定依据全部来自服务端出口层,卡片不自造口径。 */
  _resolveControlPeerId(peerId) {
    return this._managedGroupPeerId(peerId) || peerId;
  }

  _applyPeerSnapshot(peers) {
    // 只显示在线可控播放器(DLNA 设备 + 客户端本机实例;离线由 _upsertPeer 移除,此处过滤兜底)。
    // 群组是「容器」:成员全离线也不剪掉,否则管理模式入口消失、空组没法加减成员。
    const list = this._filterControllable(peers).filter((p) => p.available !== false || p.kind === "group");
    this._ui.peers = this._sortPeersForDisplay(list);
    const pinned = this._resolveDefaultPeerId(list);

    // 刷新 / 卡片重挂载后,恢复上次选中的遥控目标,避免每次都跳回默认(排序最前的独立播放器)。
    // 一次性:仅当没有显式默认(pinned)且快照里确实还有这个 peer 时才采纳;否则清空交自动选。
    if (!this._peerRestoreDone) {
      this._peerRestoreDone = true;
      const stored = !pinned ? this._loadStoredPeerId() : null;
      // 存的是成员设备、但它此刻被活跃组托管 ⇒ 恢复成该组(见 _resolveControlPeerId)。
      // 否则重开页面会回到「选中的是一台已被组接管的设备」= 0:00/0:00、进度不走。
      if (stored && list.some((p) => p.peerId === stored)) {
        this._ui.currentPeerId = this._resolveControlPeerId(stored);
      }
    }
    // restored / pinned 指向的 peer 已不在快照里(被删 / 离线移除)⇒ 清空,交给下方自动选。
    if (this._ui.currentPeerId && !list.some((p) => p.peerId === this._ui.currentPeerId)) {
      this._ui.currentPeerId = "";
    }

    if (!this._ui.currentPeerId || pinned) {
      const preferred = pinned && list.find((p) => p.peerId === pinned);
      const first = preferred || list.find((p) => p.available) || list[0];
      if (first) this._selectPeer(first.peerId, true);
    } else {
      // 恢复态:追踪(2s 轮询 + 250ms 插值 tick)**只在 _selectPeer() 末尾挂载**,
      // 这条分支绕过了它 —— 过去只做一次性刷新 ⇒ 卡片冻结在「拉过一次」的快照上,
      // 进度条不走、歌词不滚,直到用户手动切一次设备。
      // 真机现场(2026-09-26):重开 HA 客户端后 _pollTimer/_tickTimer 均为 null、
      // 8 秒内 0 次状态拉取;手动点设备再点回来立刻正常。故此处补一次幂等的补挂。
      this._ensureTracking();
      this._refreshCurrentPeerView();
    }
    // 兜底:snapshot 列表为空(设备尚未注册完)时本次可能未选中,后续
    // 设备经 _upsertPeer 上线时会由 _ensurePeerSelected 补选,这里也再保一次。
    this._ensurePeerSelected();
    this.requestUpdate();
  }

  // 选中的遥控目标持久化到 localStorage(按实体配置分桶),刷新 / 重挂载后由
  // _applyPeerSnapshot 一次性恢复 —— 否则每次刷新都会跳回排序最前的独立播放器。
  _peerStorageKey() {
    const entity = this._config && this._config.entity;
    return entity ? `musicflow-remote-peer:${entity}` : "musicflow-remote-peer";
  }
  _storePeerId(peerId) {
    // 只持久化有效选择,不写空(离线清空时保留上次有效值,不要被 null 覆盖)。
    if (!peerId) return;
    try { localStorage.setItem(this._peerStorageKey(), peerId); } catch {}
  }
  _loadStoredPeerId() {
    try { return localStorage.getItem(this._peerStorageKey()) || null; } catch { return null; }
  }

  _applySnapshot(devices) {
    // devices: { <deviceId>: DeviceStatus+media+name } (DLNA EventManager 快照)
    // If current peer is dlna:<deviceId>, seed initial state from the snapshot.
    const pid = this._ui.currentPeerId;
    if (!pid || !pid.startsWith("dlna:")) return;
    const deviceId = pid.slice(5);
    const st = devices[deviceId];
    if (st) this._applyStatus(st);
  }

  // 保证至少有一台可用播放器被选中(并因此启动 2s 轮询)。
  // 修复:auto-select 原本只发生在 _applyPeerSnapshot(初始 peer_snapshot);
  // _upsertPeer 收到设备注册/恢复事件只更新列表、从不选中 → 设备短暂离线后
  // 恢复上线会永远停在"设备可见但未选中"→ 轮询不跑、设备事件被丢弃,卡片
  // 冻结直到手动刷新。所有 peers 列表变更路径都应经过这里兜底。
  _ensurePeerSelected() {
    const pid = this._ui.currentPeerId;
    if (pid) {
      const cur = (this._ui.peers || []).find((p) => p.peerId === pid);
      if (cur && cur.available !== false) {
        // 已选中且在线:只补追踪(恢复路径的第二次兜底),不重置界面、不换台。
        this._ensureTracking();
        return;
      }
      // 选中设备已离线:解除选中,交给下方重新选一台
      this._ui.currentPeerId = null;
      this._stopTracking();
    }
    const list = (this._ui.peers || []).filter((p) => p.available !== false);
    const first = list[0];
    if (first) this._selectPeer(first.peerId, true);
  }

  // 事件保底唤醒:某台 DLNA 设备有 state/media/queue 事件而当前未选中它时,
  // 若卡片正处于"未选中"或"选中了离线设备"的冻结态,自动选中它并启动轮询,
  // 让音流等外部控制器起播后卡片立即跟随显示。用户手动选中了别的在线设备则不抢。
  _maybeFollowDevice(deviceId) {
    const pid = this._ui.currentPeerId;
    if (pid) {
      const cur = (this._ui.peers || []).find((p) => p.peerId === pid);
      if (cur && cur.available !== false) return; // 正在看别的在线设备,不打扰
    }
    for (const target of [`dlna:${deviceId}`, `airplay:${deviceId}`, `sendspin:${deviceId}`]) {
      const p = (this._ui.peers || []).find((x) => x.peerId === target);
      if (p && p.available !== false) {
        this._selectPeer(target, true);
        return;
      }
    }
  }

  // 后端起播强制刷新信号(player_refresh):起播瞬间立即全量拉取该设备最新状态
  // (getStatus 走实时 SOAP),不依赖 GENA 事件/轮询周期;300ms 去抖合并连发信号,
  // 拉取失败后 1s 本地补一次重试,仍失败交给 2s 轮询兜底。
  _onPlayerRefresh(deviceId) {
    this._maybeFollowDevice(deviceId);
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    // 命中条件:①目标就是这台设备 / 这个组;②目标是「这台设备所属的活跃组」——
    // 卡片此刻的目标往往是组,成员设备的起播事件必须放大到该组,不能直接丢掉。
    const direct = [`dlna:${deviceId}`, `airplay:${deviceId}`, `sendspin:${deviceId}`, `group:${deviceId}`];
    if (!direct.includes(pid) && !direct.some((x) => this._managedGroupPeerId(x) === pid)) return;
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
    this._refreshTimer = setTimeout(() => {
      this._refreshTimer = null;
      this._refreshCurrentPeerView().then((ok) => {
        if (!ok) setTimeout(() => this._refreshCurrentPeerView(), 1000);
      });
    }, 300);
  }

  _upsertPeer(peer) {
    if (!peer || !this._isControllablePeer(peer)) return;
    // 播放器离线:从列表移除(不再置灰显示);若正是当前播放设备,自动切到下一个可用。
    if (peer.available === false) {
      const before = this._ui.peers.length;
      this._ui.peers = this._ui.peers.filter((x) => x.peerId !== peer.peerId);
      if (this._ui.currentPeerId === peer.peerId) {
        const next = this._ui.peers.find((x) => x.available);
        if (next) this._selectPeer(next.peerId, true);
        else { this._ui.currentPeerId = null; this._stopTracking(); }
      }
      if (before !== this._ui.peers.length) this.requestUpdate();
      return;
    }
    const idx = this._ui.peers.findIndex((p) => p.peerId === peer.peerId);
    if (idx >= 0) this._ui.peers[idx] = { ...this._ui.peers[idx], ...peer };
    else this._ui.peers.push(peer);
    // 设备注册/恢复上线也必须确保被选中,否则卡片停在"可见但未选中"冻结态
    this._ensurePeerSelected();
    this.requestUpdate();
  }

  _applyPeerQueue(peerId, queue) {
    if (peerId === this._ui.currentPeerId) {
      this._applyQueue(queue);
      return;
    }
    // 客户端本机实例(非 DLNA)起播/换曲:卡片空闲(未选)或正看离线设备时自动跟随显示,
    // 与 DLNA 的 _maybeFollowDevice 语义一致 —— 不打扰正在看的在线设备。
    if (peerId.startsWith("local:")) {
      const cur = (this._ui.peers || []).find((p) => p.peerId === this._ui.currentPeerId);
      if (!cur || cur.available === false) {
        this._selectPeer(peerId, true);
        return;
      }
    }
    const idx = this._ui.peers.findIndex((p) => p.peerId === peerId);
    if (idx >= 0) this._ui.peers[idx] = { ...this._ui.peers[idx], queue };
    this.requestUpdate();
  }

  _applyDeviceQueue(deviceId, queue) {
    this._maybeFollowDevice(deviceId);
    const pid = this._ui.currentPeerId;
    if (pid === `dlna:${deviceId}` || pid === `airplay:${deviceId}` || pid === `sendspin:${deviceId}` || pid === `group:${deviceId}`) {
      this._applyQueue(queue);
    }
    const idx = this._ui.peers.findIndex(
      (p) => p.peerId === `dlna:${deviceId}` || p.peerId === `airplay:${deviceId}` || p.peerId === `sendspin:${deviceId}` || p.peerId === `group:${deviceId}`
    );
    if (idx >= 0) this._ui.peers[idx] = { ...this._ui.peers[idx], queue };
    this.requestUpdate();
  }

  _applyQueue(queue) {
    if (!queue) return;
    // 队列已空(清空/播完)且当前还挂着歌曲 → 清掉"正在播放"展示,避免残留。
    const emptyNow = (Array.isArray(queue.items) && queue.items.length === 0) || queue.total === 0;
    if (emptyNow && !queue.isActive && this._ui.song) {
      this._clearNowPlaying();
    }
    const items = Array.isArray(queue.items) ? queue.items : null;
    const prev = this._ui.queue || {};
    const total = typeof queue.total === "number" ? queue.total : (items ? items.length : (prev.total || 0));
    this._ui.queue = {
      total,
      currentIndex: typeof queue.currentIndex === "number" ? queue.currentIndex : (prev.currentIndex ?? -1),
      playMode: typeof queue.playMode === "string" ? queue.playMode : (prev.playMode || "shuffle"),
      isActive: queue.isActive ?? prev.isActive,
      ended: queue.ended ?? prev.ended,
    };
    // 镜像字段:旧代码仍读 _ui.currentIndex / _ui.playMode(切歌高亮、模式切换等)。
    if (typeof queue.currentIndex === "number") this._ui.currentIndex = queue.currentIndex;
    if (typeof queue.playMode === "string") this._ui.playMode = queue.playMode;
    if (items && items.length >= (total || 0)) {
      // 仅"全量 items"(len===total,小队列 WS 整推或旧后端全量返回)才视为权威重建缓存;
      // 分块/部分 items 不覆盖窗口缓存,避免 2s 轮询把滚动中已加载的块清空。
      this._ui.qCache = new Map(items.map((it, i) => [i, it]));
      this._ui.qLoaded = new Set([0]);
      this._ui.qLoading = new Set();
      this._ui.qWinStart = 0;
      this._ui.qWinEnd = -1;
    } else if (total !== (prev.total ?? 0)) {
      // 摘要且 total 变化(增删/清空/换队列):内容变了,清缓存重拉当前窗口。
      this._qReset();
    }
    if (this._ui.showQueue) this._qEnsureLoaded();
    this.requestUpdate();
  }

  _applyDeviceState(deviceId, state) {
    this._maybeFollowDevice(deviceId);
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    if (pid === `dlna:${deviceId}` || pid === `airplay:${deviceId}` || pid === `sendspin:${deviceId}` || pid === `group:${deviceId}`) {
      this._applyStatus(state);
    }
  }

  _applyDeviceMedia(deviceId, media) {
    this._maybeFollowDevice(deviceId);
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    if (pid === `dlna:${deviceId}` || pid === `airplay:${deviceId}` || pid === `sendspin:${deviceId}` || pid === `group:${deviceId}`) {
      this._setMedia(media);
    }
  }

  // 客户端实例(local)的 position 是它**周期性上报**的采样(实测约 4s 一次),不是实时值;
  // 采样时刻由服务端随 status 回传的 `reportedAt` 给出。
  //
  // 直接把采样值当"此刻"写进进度,会把本地已经在推进的时钟每轮询拽回旧值 ——
  // 表现为进度/歌词"前进一段又回退"(回退幅度 = 一个上报周期,实测 2~4s,不是固定 2s)。
  // 卡片 2s 轮询、客户端 ~4s 上报,于是每两轮就回退一次。
  //
  // 修法:按 `采样值 + (现在 - reportedAt)` 外推到此刻再写入 —— 两次上报之间连续推进,
  // 新上报只重新对齐锚点,不再回退。暂停时保持上报值原样(不推进,避免暂停态漂移)。
  //
  // 边界:只有客户端实例的 status 带 `reportedAt`。DLNA / AirPlay / Sendspin / 群组的
  // status 走各自实时查询(SOAP / 进程内状态),没有该字段 → 原样返回,行为完全不变。
  _projectStatusPosition(status, playing) {
    const pos = status.position;
    if (!playing) return pos;
    const at = status.reportedAt;
    if (typeof at !== "number" || !isFinite(at)) return pos;
    const ageSec = (Date.now() - at) / 1000;
    // 上报过旧(TTL 30s,见服务端 getLocalStatusReport)或时钟异常 → 原样,不做外推。
    if (!(ageSec > 0) || ageSec > 30) return pos;
    const projected = pos + ageSec;
    const dur = typeof status.duration === "number" ? status.duration : 0;
    return dur > 0 ? Math.min(projected, dur) : projected;
  }

  // 该上报是不是「命令下发**之前**采的样」—— 即尚未包含本次命令的结果。
  //
  // 客户端实例的音量 / 静音 / 播放态与 position 一样,都是**周期性上报**的采样
  // (实测约 4s 一次)。本卡片下发命令后,在下一个上报到达前,轮询读到的仍是旧值,
  // 直接采纳会把用户刚设的值**顶回去** —— 典型表现:音量从 20 拖到 50、再拖到 30,
  // 结果跳回 50(上报回来的还是上一拍的 50)。
  //
  // 判据与 seek 同款:采样时刻(reportedAt)早于命令下发时刻,且仍在 8s 保护窗口内。
  // 无 reportedAt 的设备型 peer(走实时查询)→ 恒 false,设备链路行为完全不变。
  _isStaleSample(status, commandAt) {
    if (!commandAt) return false;
    if (Date.now() - commandAt > 8000) return false;
    const at = status && status.reportedAt;
    return typeof at === "number" && at < commandAt;
  }

  // 播放状态判定(自愈,对齐 Web 端 player.ts:625-627):
  // 1) 显式 state 为 PLAYING 变体 → 播放中;
  // 2) 关键自愈:部分 DLNA 设备 GENA 事件缓存停留在旧值(如 STOPPED)并覆盖 SOAP
  //    实时 PLAYING,此时以"position 真实前进"作为播放中的权威证据,
  //    避免按钮卡在"未播放"而进度/封面正常(HA 卡片实时同步目标)。
  _applyStatus(status) {
    if (!status) return;
    // 停止/无媒体时清空"正在播放"展示(封面/歌词/进度),避免残留上一首(bug: 清队列后残留)。
    if (status.state === "STOPPED" && !status.media && this._ui.song) {
      this._clearNowPlaying();
    }
    const statePlaying = status.state === "PLAYING" || status.state === "playing" || status.state === "STARTED";
    // 传输类命令(play/pause)刚下发时,陈旧上报的 position 仍在前进,若照常做
    // 「position 前进 → 判在播」自愈,会把刚点的**暂停**改回播放中
    // (表现为「点了暂停没反应,自己又播起来」)→ 窗口内停用该自愈。
    const transportStale = this._isStaleSample(status, this._transportIssuedAt);
    // 音量类命令(volume/mute)刚下发时,陈旧上报会把手上刚设的值顶回上一拍。
    const volumeStale = this._isStaleSample(status, this._volumeIssuedAt);
    const advancing = !transportStale && status.duration > 0 && typeof status.position === "number" &&
      this._lastPos >= 0 && status.position > this._lastPos && status.position < status.duration;
    // 沿用在地播放态:本端点过播放/暂停后,_ui.isPlaying 已是乐观值,别被滞后上报覆盖。
    this._ui.isPlaying = transportStale ? this._ui.isPlaying : (statePlaying || advancing);
    if (typeof status.position === "number") this._lastPos = status.position;
    if (typeof status.position === "number") {
      // MA 对齐(2026-09-22 去掉固定 6s 窗):位置陈旧只用两个精确判据 ——
      // ①因果:seek REST 响应返回(服务端同步语义=锚点已落位)**之前发起**的状态拉取,
      //   数据可能早于 seek → 丢弃。设备型 peer(DLNA/AirPlay/Sendspin,无 reportedAt)
      //   只靠这一条:精确、无窗口、无魔法数字。
      // ②采样:带 reportedAt 的客户端实例,采样时刻早于 seek 下发 → 该上报未含 seek 结果。
      //   时钟 sanity:reportedAt 与本机偏差 >120s 视为不可信,只按 ① 判定。
      // 拖拽中(seekDragging)一律不覆盖手指值。
      const fetchStale = this._seekAckAtMs > 0 && this._lastFetchStartedAtMs > 0 &&
        this._lastFetchStartedAtMs < this._seekAckAtMs;
      const sampleStale = this._seekIssuedAt > 0 &&
        typeof status.reportedAt === "number" &&
        Math.abs(Date.now() - status.reportedAt) < 120000 &&
        status.reportedAt < this._seekIssuedAt;
      const stale = fetchStale || sampleStale;
      if (stale) {
        // debug:被 seek 保护窗挡下的陈旧上报 —— 「拖完进度又跳回原位」的现场。
        // 有这一行 = 上报确实是 seek 之前采的样(正常防护,该挡);
        // 拖动后进度仍跳回却**没有**这一行 = 保护窗太短/被绕过,才是真 bug。
        dbg("丢弃 seek 前陈旧上报", {
          peer: this._ui.currentPeerId,
          reported: status.position,
          reportedAt: status.reportedAt,
          seekIssuedAt: this._seekIssuedAt,
          seekAckAtMs: this._seekAckAtMs,
          fetchStartedAtMs: this._lastFetchStartedAtMs,
          fetchStale,
          sampleStale,
          ageMs: Date.now() - this._seekIssuedAt,
        });
      } else if (this._ui.seekDragging) {
        dbg("拖拽中:不覆盖手指值", { peer: this._ui.currentPeerId, finger: this._ui.currentTime, reported: status.position });
      }
      if (!stale && !this._ui.seekDragging) this._ui.currentTime = this._projectStatusPosition(status, statePlaying);
    }
    // 客户端本机实例(local)经 /status 回传的 duration 来自它本地上报,真实可用;
    // 若上报 duration 为 0(旧端/上报空窗),回退到队列快照里当前曲的时长,避免进度条分母恒为 0。
    const statusItems = Array.isArray(status.items) ? status.items : null;
    const statusIdx = typeof status.currentIndex === "number" ? status.currentIndex
      : (typeof this._ui.currentIndex === "number" ? this._ui.currentIndex : -1);
    let statusItem = statusItems && statusIdx >= 0 ? statusItems[statusIdx] : null;
    // 兜底:游标不可用(队列行未激活 / 越界)时按客户端**上报的 songId** 反查当前项 ——
    // 否则 media 补不全,标题/封面又掉回「未知」。正常路径(游标有效)行为不变。
    if (!statusItem && statusItems) {
      const sid = status.media && status.media.songId;
      if (sid) statusItem = statusItems.find((it) => it.songId === sid) || null;
    }
    if (typeof status.duration === "number" && status.duration > 0) this._ui.duration = status.duration;
    else if (statusItem && typeof statusItem.duration === "number" && statusItem.duration > 0) this._ui.duration = statusItem.duration;
    // 拖拽中忽略服务器回传的音量,避免外网代理延迟把滑块拽回旧值(跟手问题)。
    // 拖拽**结束**后同样要忽略「命令之前采样」的上报:连续拖动(20→50→30)时回传的
    // 可能还是上一拍的 50,会把手上的 30 顶掉 —— 这正是 volumeStale 要挡的情形。
    if (typeof status.volume === "number" && !this._ui.volDragging && !volumeStale) this._ui.volume = Math.max(0, Math.min(100, status.volume)) / 100;
    // 静音态同样来自周期上报,刚切过就别被旧值顶回去。
    if (typeof status.muted === "boolean" && !volumeStale) this._ui.muted = status.muted;
    // 客户端本机实例(local)经 /status 只回传 media:{ songId },标题/封面/时长都在队列
    // 快照的 items 里(见服务端 GET /peers/:id/status)。这里用当前队列项补全成完整 media,
    // 否则 now-playing 永远显示「未知」且无封面,收藏/歌词也定位不到具体歌曲。
    // DLNA/airplay/sendspin 的 status 不带 items,走原本就完整的 media,不受影响。
    if (status.media) {
      let media = status.media;
      if (statusItem) {
        media = {
          songId: media.songId || statusItem.songId,
          title: media.title || statusItem.title,
          artist: media.artist ?? statusItem.artist,
          album: media.album ?? statusItem.album,
          coverArt: media.coverArt || statusItem.coverArt,
          duration: media.duration || statusItem.duration,
        };
      }
      this._setMedia(media);
    }
    this._updateLyric();
    this.requestUpdate();
  }

  // 清空"正在播放"展示:停止/清空队列/媒体清空后调用,避免封面/歌词/进度残留。
  // 后端清队列会清 media 缓存但可能只推 queue_changed;对齐 Web 端 castClearQueue 直接清空模式。
  _clearNowPlaying() {
    this._ui.song = null;
    this._ui.lyrics = [];
    this._ui.currentLyric = "";
    this._ui.lyricIndex = -1;
    this._ui.currentTime = 0;
    this._ui.duration = 0;
    this._ui.isPlaying = false;
    this._lastPos = -1;
    // 无封面后必须清掉上一首的强调色:否则 --acc 残留旧歌色,
    // 未播放态的图标/进度条会带着上一首的颜色(并盖掉 idle 底色的柔色)。
    this._ui.accentRgb = null;
    this.requestUpdate();
  }

  // ============ 未播放态「固定配色底色」(idle ambient) ============
  // 是否启用:与 .coverbg 严格互斥——只要有封面就走封面主色,没封面才补流动底色。
  // (停止/清空队列/无媒体 → 启用;暂停但有封面 → 不启用,保持原封面背景。)
  _idleAmbientOn() {
    if ((this._config || {}).idle_background === false) return false;
    return !(this._ui.song && this._ui.song.coverArt);
  }

  // 配色:底色恒为 IDLE_GROUPS 那 8 组固定配色(见常量注释),不在这里算。
  // 这里只产出:cycle(一轮秒数)/ swap(每组秒数)/ acc(强调色 RGB 三通道)。
  // 结果按「主题 + 主色 + 速度」缓存,只在变化时重算一次。
  _idlePalette() {
    const cfg = this._config || {};
    const name = IDLE_THEMES[cfg.idle_theme] !== undefined ? cfg.idle_theme : "auto";
    let primary = "";
    if (name === "auto") {
      // HA 把 --primary-color 挂在 :root 上,shadow DOM 内可继承读取
      primary = (getComputedStyle(this).getPropertyValue("--primary-color") || "").trim();
    }
    const factor = IDLE_SPEED_FACTOR[cfg.idle_speed] ?? 1;
    const key = `${name}|${primary}|${factor}`;
    if (this._idleKey === key && this._idlePaletteCache) return this._idlePaletteCache;

    // 强调色色相:auto → HA 主色;预设 → 固定色。是否无彩(黑/白/灰主题)决定改用中性灰。
    const preset = name === "auto" ? null : IDLE_THEMES[name];
    const rgb = parseCssColor(preset ? preset.color : primary) || [88, 101, 242]; // 解析失败回落 HA 默认蓝紫
    const [h, ps] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    const achromatic = ps < 0.08;

    // 换色节奏:idle_speed 缩放「每组停留秒数」(数值越小越快)
    const swap = Math.round(IDLE_SWAP_BASE * factor * 10) / 10;
    const cycle = Math.round(swap * IDLE_GROUP_COUNT * 10) / 10;

    this._idleKey = key;
    this._idlePaletteCache = {
      cycle, swap, factor,
      // 强调色:图标 / 进度条 / 选中态。底色恒为深色,故一律取"浅字"那一档,与明暗模式无关。
      acc: (() => {
        const [ar, ag, ab] = achromatic ? [176, 180, 190] : hslToRgb(h, 0.34, 0.62);
        return `${ar}, ${ag}, ${ab}`;
      })(),
    };
    return this._idlePaletteCache;
  }

  // 只在 idlebg 实际渲染后调用:下发节奏变量、切暂停/静止态、挂可见性监听。
  // 换色完全由 CSS 动画驱动,这里不做任何逐帧或定时器工作。
  // mf-cyc 关键帧按层数推导(而非写死)。要满足两条:
  //   ① 每层的「出现窗」(淡入 + 停留 + 淡出)必须正好等于错峰 100/N %,这样任意时刻
  //      只有相邻两层在交叉,不会三四层糊在一起;
  //   ② 窗内一半时间全亮、一半时间做淡入淡出,即 停留窗 = 淡出窗 = 50/N %。
  // 合起来:opacity 1 于 [0, 50/N] → 淡出到 [100/N] → 0 到 [100-50/N] → 淡入回 100%。
  // N=5 时正好算回原 A+ 的 {0%,10%→1; 20%,90%→0; 100%→1},所以视觉基准没变;
  // N=12 时是 {0%,4.167%→1; 8.333%,95.833%→0; 100%→1},仍是干净的两两交叉。
  // 只在 N 变化时重写 textContent —— 不放进 render():每次 render 重建 <style>
  // 会让动画从头上播,相位跳一下。
  _syncIdleKeyframes() {
    const root = this.shadowRoot;
    if (!root) return;
    const hold = 50 / IDLE_GROUP_COUNT; // 停留窗 = 淡出窗 = 50/N %
    const r3 = (v) => Math.round(v * 1000) / 1000;
    const css = `@keyframes mf-cyc{0%,${r3(hold)}%{opacity:1}${r3(hold * 2)}%,${r3(100 - hold)}%{opacity:0}100%{opacity:1}}`;
    let tag = root.querySelector("style[data-mf-cyc]");
    if (!tag) {
      tag = document.createElement("style");
      tag.setAttribute("data-mf-cyc", "");
      root.appendChild(tag);
    }
    if (tag.textContent !== css) tag.textContent = css;
  }

  _syncIdleAmbient() {
    const el = this.shadowRoot?.querySelector(".idlebg");
    if (!el) {
      if (this._idleObserver) { this._idleObserver.disconnect(); this._idleObserver = null; }
      if (this._idleVisHandler) { document.removeEventListener("visibilitychange", this._idleVisHandler); this._idleVisHandler = null; }
      this._idleBuiltKey = "";
      return;
    }
    // 节奏变了(主题/主色/speed)→ 重新下发 --idle-cycle 与静止态。只在这里做重活,不进 render。
    const pal = this._idlePalette();
    // 关键帧的窗口宽随层数,与节奏无关,但同样只在挂到 DOM 后才需要(只写一次)。
    this._syncIdleKeyframes();
    const builtKey = `${this._idleKey}|${pal.cycle}`;
    if (this._idleBuiltKey !== builtKey) {
      el.style.setProperty("--idle-cycle", pal.cycle > 0 ? `${pal.cycle}s` : "0s");
      el.classList.toggle("static", pal.cycle <= 0);
      this._idleBuiltKey = builtKey;
    }

    // 不可见 / 后台 tab → 停表(animation-play-state: paused)。
    // **打开队列/媒体库面板不停表**:面板是透明全屏覆盖(.panel 无背景色),底下露出的就是本层
    // 流动底色 —— 停表会让用户看到"背景冻住"(v2.3.9 修)。且本动画只动 opacity(合成器线程),
    // 各层还有 contain 隔离,不占主线程,与面板滚动无争用,为它停表没收益、只有可见的副作用。
    const paused = !this._idleVisible || !!document.hidden;
    el.classList.toggle("paused", paused);

    if (!this._idleObserver) {
      this._idleObserver = new IntersectionObserver(([e]) => {
        this._idleVisible = !!e.isIntersecting;
        this._syncIdleAmbient();
      }, { threshold: 0.01 });
      this._idleObserver.observe(this);
    }
    if (!this._idleVisHandler) {
      this._idleVisHandler = () => this._syncIdleAmbient();
      document.addEventListener("visibilitychange", this._idleVisHandler);
    }
  }

  _setMedia(media) {
    if (!media) { this._clearNowPlaying(); return; }
    const song = {
      songId: media.songId,
      title: media.title || this._t("common.unknown"),
      artist: media.artist || "",
      album: media.album || "",
      coverArt: media.coverArt,
      duration: media.duration || this._ui.duration || 0,
    };
    const changed = song.songId !== this._ui.song?.songId;
    this._ui.song = song;
    if (changed && song.songId) {
      this._lastPos = -1; // 换歌重置前进基线,避免沿用上一首进度误判播放态
      // 换歌清 seek 标记:旧目标/窗口属于上一首,否则新歌开头的正常 0 采样会被
      // 当成"未落位"屏蔽(进度冻住)或旧目标污染显示。失败路径同理已清零。
      this._seekIssuedAt = 0;
      this._seekAckAtMs = 0;
      this._ui.seekDragging = false;
      this._ui.accentRgb = null; // 换歌重置强调色,新封面加载后自动更新
      this._ui.lyrics = [];
      this._ui.currentLyric = "";
      this._ui.lyricIndex = -1;
      this._ui.coverLightText = true; // 新封面分析完成前先浅色文字,避免闪深色
      // 注意:backend-client 目前没有 scrobble 方法,`?.()` 会短路掉整条链(含后面的 .catch),
      // 所以这里是**静默空转**(不抛错、也不上报播放记录)。属既有行为,本次不动。
      this._client.scrobble?.(song.songId).catch((e) => err("scrobble failed", e));
      this._loadLyrics(song.songId);
      this._loadLiked(song.songId);
    }
    this.requestUpdate();
  }

  _refreshPeers() {
    this._client.getPeers().then((res) => {
      // 群组是容器:成员全离线也不剪(与 _applyPeerSnapshot 同口径)。
      const peers = this._filterControllable(res?.peers || []).filter((p) => p.available !== false || p.kind === "group");
      if (peers.length) {
        this._ui.peers = this._sortPeersForDisplay(peers);
        this._ensurePeerSelected();
        this.requestUpdate();
      }
    }).catch((e) => err("getPeers failed", e));
  }

  async _refreshCurrentPeerView() {
    const pid = this._ui.currentPeerId;
    if (!pid) return false;
    try {
      const [status, queue] = await Promise.all([
        (this._lastFetchStartedAtMs = Date.now(), this._client.getStatus(pid)),
        this._client.getQueue(pid, { size: CHUNK }), // 分块:只同步元数据,队列内容按需窗口化拉取
      ]);
      this._applyStatus(status);
      this._applyQueue(queue);
      return true;
    } catch (e) {
      err("refreshCurrentPeerView failed", e);
      return false;
    }
  }

  // 音量单例的跨端隔离(对齐 Web 前端 v4.9.3 的 resyncVolumeForPeer):
  // _ui.volume 是跨受控目标共享的;流转/切换目标后残留旧目标音量(如主卧 DLNA 的
  // 88%),用户一碰滑条就把旧值 POST 给新目标(240 日志实证:HA 通道向群组 POST 88
  // 两次,群组落库音量被改)。切换目标后立即用新目标的真实音量纠正 _ui.volume:
  //   - **只读不写**:采纳真实值,绝不主动调 setVolume;
  //   - 拖拽中(_ui.volDragging)不覆盖手指值;
  //   - _isStaleSample 口径:保护窗内的陈旧采样不采纳 —— _volumeIssuedAt 已在
  //     _selectPeer 清零,这里只剩「切过来之后用户对新目标的下发窗口」。
  // 音量浮层开着时切换目标:采纳后 requestUpdate,浮层显示值跟随真实值。
  // (无独立 status 缓存可复用,_refreshCurrentPeerView 的拉取走 _applyStatus 同一套
  // 守卫;此处显式发一次 status 请求保证纠正一定发生,切换动作低频,代价可忽略。)
  _resyncVolumeForPeer(peerId) {
    if (!peerId || !this._client) return;
    this._client.getStatus(peerId).then((status) => {
      if (this._ui.currentPeerId !== peerId) return; // 已切走:不写单例
      if (!status || typeof status.volume !== "number") return;
      if (this._ui.volDragging) return; // 手指优先
      if (this._isStaleSample(status, this._volumeIssuedAt)) return; // 刚下发过,不回顶
      this._ui.volume = Math.max(0, Math.min(100, status.volume)) / 100;
      this.requestUpdate();
    }).catch((e) => err("volume resync failed", e));
  }

  _selectPeer(peerId, silent) {
    // 被活跃组托管的成员设备 ⇒ 遥控目标收敛到该组(服务端唯一出口 decoratePeersForClient
    // 的 `managedByGroup` 口径,注释写明「三端据此把成员渲染成『跟随某组』」)。理由:
    // 成员的 /status 恒 STOPPED、position/duration 恒 0、/queue 恒空 ⇒ 选中它只会显示
    // 0:00/0:00 且进度不走;而对成员下发 play/pause/next 又会经服务端
    // detachFromActiveGroups 把它从组里摘掉 ⇒ 对成员的「遥控」语义根本不成立。
    peerId = this._resolveControlPeerId(peerId);
    if (peerId === this._ui.currentPeerId) return;
    this._ui.currentPeerId = peerId;
    this._storePeerId(peerId); // 持久化选中目标,刷新后不再跳回默认(独立播放器)
    this._stopTracking();
    this._ui.queue = { total: 0, currentIndex: -1, playMode: "shuffle", isActive: false, ended: false };
    this._ui.currentIndex = -1;
    this._qReset();
    this._ui.song = null;
    this._ui.lyrics = [];
    this._ui.currentLyric = "";
    this._ui.lyricIndex = -1;
    this._ui.currentTime = 0;
    this._ui.duration = 0;
    this._lastPos = -1; // 切换设备后重置前进基线,避免沿用旧设备误判播放态
    // 音量单例的跨端隔离(缺陷与修法见 _resyncVolumeForPeer 注释):_ui.volume 不随
    // 目标切换重置,流转后滑条残留旧目标音量,一碰就把旧值 POST 给新目标。
    // ①旧目标的音量命令保护窗不得跨目标生效 → 清零(_isStaleSample 对 0 恒放行);
    // ②立即从新目标状态重新拉取真实音量(群组=群组音量,设备=设备音量)。
    this._volumeIssuedAt = 0;
    this._resyncVolumeForPeer(peerId);
    this._refreshCurrentPeerView();
    this._startTracking();
    this.requestUpdate();
  }

  // ============ Real-time progress tracking ============
  /** 保证「已选中的在线目标」有活跃追踪(2s 轮询 + 250ms 插值 tick)。幂等:**缺才挂**。
   *
   *  选中态有两条来路:①`_selectPeer()`(手动点 chip / 自动选 / 跟随设备)—— 它末尾就挂好;
   *  ②**不经过 `_selectPeer` 的恢复路径**:`_applyPeerSnapshot` 的 localStorage 恢复分支、
   *  `_ensurePeerSelected()` 的「已选中且在线」早退分支(以及 `_refreshPeers` / `_probeServer`
   *  的兜底刷新)。② 过去只做一次性 `_refreshCurrentPeerView()`,于是卡片冻结在首次读数上 ——
   *  重开 HA 客户端后进度条纹丝不动,直到手动切一次设备。 */
  _ensureTracking() {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    const cur = (this._ui.peers || []).find((p) => p.peerId === pid);
    if (cur && cur.available === false) return; // 目标已离线:交给 _ensurePeerSelected 换台
    if (!this._pollTimer || !this._tickTimer) this._startTracking();
  }

  _startTracking() {
    this._stopTracking();
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    this._pollTimer = setInterval(async () => {
      try {
        const [status, queue] = await Promise.all([
          (this._lastFetchStartedAtMs = Date.now(), this._client.getStatus(pid)),
          this._client.getQueue(pid, { size: CHUNK }), // 分块:只同步 total/currentIndex,不全量拉
        ]);
        this._applyStatus(status);
        this._applyQueue(queue);
      } catch (e) {
        err("poll failed", e);
      }
    }, 2000);
    this._tickTimer = setInterval(() => {
      // 拖拽 seek 中手指值优先,tick 不推进(否则边拖边涨,跟手打架;对标 volDragging)。
      if (this._ui.seekDragging) return;
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

  // 进度百分比:进度条的**填充**(内联 linear-gradient)与**小圆点**(range 的 thumb)
  // 必须同源。两处各算一遍就会各自跑偏 —— 这正是 2026-09-23 那次事故的形态,
  // 故这里收敛成唯一来源,渲染与回写都调它。
  _progressPct() {
    const dur = this._ui.duration || 0;
    if (!(dur > 0)) return 0;
    return (this._ui.currentTime / dur) * 100;
  }

  // 进度小圆点回写(2026-09-23 事故修复)。
  //
  // 事故:拖/点过进度条之后,**填充条继续前进,小圆点却永远停在手指松开的位置**。
  // 根因:模板写的是 `<input type=range value="${prog}">` —— 这是**属性**绑定,属性只
  //   写 defaultValue。按 HTML 规范,value 内容属性**仅在脏值标志(dirty value flag)
  //   为假时**才同步到控件的当前值,而 range 一经用户交互(拖动/点击)即置位该标志,
  //   于是此后所有属性写入被忽略 ⇒ 小圆点冻结;填充条走的是内联 style 渐变(不受脏值
  //   标志影响)⇒ 两者分道扬镳。真实 Chromium 实测三连:
  //     ①全新元素 + 只改属性 60 → 60(首次渲染生效,故平时看不出问题)
  //     ②拖过一手 + 改属性 60   → 仍停在 40(失效 = 事故现场)
  //     ③拖过一手 + 改 property 60 → 60(改用 property 即恢复)
  // 修法:渲染后把**同一个** _progressPct() 用 **property** 写回 input(不走属性),
  //   让填充与圆点恒同源。注解:属性绑定留在模板里做首帧默认值,无冲突 —— 对脏元素
  //   它是 no-op,真正的驱动是这里这次 property 回写。
  // 拖拽中不写:手指即权威(_seek 已把 _ui.currentTime 同步成手指值),此时回写零收益,
  //   反而可能与指针抢位(部分浏览器拖动中回写会重置拖拽基准)。
  _syncSeekThumb() {
    const el = this.shadowRoot && this.shadowRoot.querySelector(".seek");
    if (!el) return;
    if (this._ui.seekDragging) return; // 手指优先,见上方说明
    const prog = this._progressPct();
    // range 会按 step 归一化(step=0.1),字符串不等不代表位置不同 → 用数值比较,
    // 差值小于半个 step 就不写,避免每 250ms tick 都做一次无意义的 DOM 写入。
    const cur = Number(el.value);
    if (Number.isFinite(cur) && Math.abs(cur - prog) <= 0.05) return;
    el.value = String(prog);
    // 静默退化的可观测性:差值明显(>1%,约 1.5s 画面)才记一行 —— 正常跟随时不刷屏,
    // 真出问题时这行会指认「圆点与期望值脱节」,而不是让用户当成画面卡顿。
    if (Math.abs(cur - prog) > 1) {
      dbg("进度圆点回写", { 圆点: cur, 期望: prog, currentTime: this._ui.currentTime, duration: this._ui.duration });
    }
  }

  // 心跳:卡片是「遥控器」,自身不会注册成 local peer,故无需对任何 peer 发心跳。
  // 关键:绝不能为当前选中的客户端本机实例代发心跳 —— 在线状态由客户端自身上报维持;
  // 卡片代发等于「保活」一台可能已挂掉的客户端,使其一直被误显示为在线、无法自动下线。
  _startHeartbeat() {
    // 故意为空:卡片充当控制器,不做 peer 心跳(避免误保活远端客户端)。
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
    // 播放/暂停态也是周期上报的:先打点,再乐观翻转,避免被滞后上报顶回去。
    this._transportIssuedAt = Date.now();
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
      this._seekIssuedAt = Date.now(); // 同 _seek:回退到 0 也要丢弃 seek 前采样的上报
      // debug:「上一首」在播放 >3s 时退化为 seek 0(而非切歌)—— 这是有意行为,
      // 用户常误报成「点了上一首没换歌」,日志里要能看到走的是哪条分支。
      dbg("上一首 → 回退到本曲开头(>3s)", { peer: pid, 位置: this._ui.currentTime });
      this._client.seek(pid, 0).then(() => { this._ui.currentTime = 0; this.requestUpdate(); }).catch((e) => err("seek failed", { peer: pid, 目标秒: 0 }, e));
    } else {
      dbg("上一首 → 切歌(≤3s)", { peer: pid, 位置: this._ui.currentTime });
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
        this._volumeIssuedAt = Date.now(); // 窗口从真正下发时刻算起
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
    this._volumeIssuedAt = Date.now(); // 静音态同样来自周期上报
    this._client.setMute(pid, next).catch((e) => err("setMute failed", e));
    this.requestUpdate();
  }

  // 音量:点击展开覆盖下半卡的音量遮罩层。
  // 必须 stopPropagation,否则事件冒泡到 .wrap 的「点外部关闭」会立刻把刚打开的面板关掉。
  _toggleVolumePop(e) {
    e?.stopPropagation?.();
    if (!this._ui.showVolume) { this._ui.showQueue = false; this._ui.showBrowser = false; } // 打开音量时关闭队列/媒体库面板(互斥)
    this._ui.showVolume = !this._ui.showVolume;
    this.requestUpdate();
  }

  // 点击音量控件本体以外的任意位置 = 关闭并保存(音量拖动时已实时下发,无需确认按钮)
  _onWrapClick(e) {
    // 极简歌词模式:任意点击都先恢复完整模式并重置空闲计时(点击歌词/卡片即唤出控件)
    this._onCardPointer();
    const path = e.composedPath ? e.composedPath() : [];
    if (this._ui.showVolume) {
      for (const n of path) {
        if (n?.classList?.contains?.("vol-row")) return; // 点在静音键/音量条上不关闭
      }
      this._ui.showVolume = false;
      this.requestUpdate();
      return;
    }
    // 队列/媒体库面板(无感全屏覆盖)打开时:点列表项/按钮/面包屑/搜索框不收起,点面板空白处收起。
    if (this._ui.showQueue || this._ui.showBrowser) {
      const keep = ["qitem", "sitem", "bitem", "mini", "crumb",
        "br-search", "search-input", "cat", "pg-btn", "pg-input", "pg-jump"];
      for (const n of path) {
        const cls = n && n.classList;
        if (cls && Array.from(cls).some((c) => keep.includes(c))) return; // 点在交互元素上不收起
      }
      this._ui.showQueue = false;
      this._ui.showBrowser = false;
      this.requestUpdate();
      return;
    }
    // 首页已不再有群组增减成员的管理态:点群组 chip 只是切遥控目标(见 _renderOutputs)。
    // 成员管理统一在整卡流转页里做。
  }

  // ============ 极简歌词模式(auto-hide) ============
  // 允许进入极简的条件:播放中、无面板打开、有歌词。触屏同样生效(点按恢复)。
  _canMini() {
    const u = this._ui;
    return !!(u.isPlaying && !u.showVolume && !u.showQueue && !u.showBrowser && !u.transferOpen && u.lyrics && u.lyrics.length);
  }

  // 极简模式上移量 = 「.now 顶部 − .outputs 顶部」的**静态布局差**。
  // 🔴 为什么用 offsetTop 而不是 offsetHeight + 硬编码 gap / getBoundingClientRect:
  //   · offsetHeight + 12 是近似值:gap 一旦不是 12、或两行之间插了 .warnbar,位移就偏;
  //   · rect 会被正在播放的进出场 transform 带偏 —— 动画中途测量必错;
  //   · offsetTop 是「布局位置」,与 transform 无关 ⇒ **极简进行中测量也准确**。
  // 因此这里每次渲染都测(不再限制「非 mini 才测」):--mini-shift 永远是当前的真实差值,
  // 不存在「上一次进入时留下的旧值」—— 这正是 v2.8.15 出现两种位置状态的根因:
  // 自动进入用的是加载完成后测得的值(对),点击后进入用的是上一次的旧值(错)。
  // 上移后 .now 顶部与 .outputs 顶部严格重合,不会上移过头把歌词/封面顶出卡片。
  _measureMiniShift() {
    const sr = this.shadowRoot;
    if (!sr) return false;
    const outputs = sr.querySelector(".outputs");
    const now = sr.querySelector(".now");
    if (!outputs || !now) return false;
    const diff = now.offsetTop - outputs.offsetTop;
    if (!Number.isFinite(diff) || diff <= 0) return false; // 测不到(DOM 未就绪)时保留兜底 64
    if (diff === this._miniShift) return false;
    this._miniShift = diff;
    return true; // 值变了:调用方需要补一次渲染,把新值写进 --mini-shift
  }

  _setMini(on) {
    if (this._ui.mini === on) return;
    if (on && this._focusInside) return; // 键盘焦点在卡片内:不进入极简,控件保持可达
    if (on && !this._canMini()) return; // 条件不满足时拒入,等可进入时机(如切歌后)
    if (on) this._measureMiniShift(); // 进入前用「当前完整模式布局」再测一次,双保险
    if (!on) this._miniExitAt = Date.now(); // 退出后短暂拦截一击(见 MINI_CLICK_GUARD_MS)
    this._ui.mini = on;
    this.requestUpdate();
  }

  // 重置空闲计时:满足条件则 delay 后自动进入极简。
  // 不在这里强制退出 mini —— 切歌瞬间 isPlaying 短暂 false 也会让 canMini()=false,
  // 强制退出会让切歌时整卡闪一下完整模式。"暂停"和"打开面板"两种真该退出的场景
  // 由 _updatedMiniWatch 显式处理。
  _resetIdleTimer() {
    if (this._miniTimer) { clearTimeout(this._miniTimer); this._miniTimer = null; }
    if (!(this._config.auto_hide ?? true)) return;
    if (this._focusInside) { if (this._ui.mini) this._setMini(false); return; } // 焦点在内:保持完整,不重开计时
    if (!this._canMini()) return; // 条件不满足:不重开计时,也不强制退出
    const delay = Math.max(500, Number(this._config.auto_hide_delay ?? 3000));
    this._miniTimer = setTimeout(() => {
      this._miniTimer = null;
      this._setMini(true);
    }, delay);
  }

  // pointerenter / pointermove / click / touch 统一入口:恢复完整模式并重新开始计时。
  _onCardPointer(e) {
    // 触屏(touch)不在按下/滑动阶段退出极简:手指一按下 pointerenter 就退出,同一次手势末尾的
    // click 会命中刚露出(或正在淡入)的控件 —— 结果是「点空白却切了歌」。触屏改由 click 捕获
    // 阶段统一退出并吞掉这一击(见 _onWrapClickCapture),长按同样不漏。
    if (e && e.pointerType === "touch") { this._resetIdleTimer(); return; }
    if (this._ui.mini) this._setMini(false);
    this._resetIdleTimer();
  }

  // 极简歌词模式的「一击只退出」守卫(在 .wrap 的捕获阶段执行,先于任何控件的 click handler):
  // 极简模式下控件虽然已收起淡出,但收缩动画期间仍 visible,退出瞬间更是立刻可交互 ——
  // 同一手势里的 click 会穿透到播放/暂停/收藏/音量等按钮上。这里拦下它:只退出极简模式,
  // 并重置空闲计时,这一击不产生任何其它副作用。
  _onWrapClickCapture(e) {
    const justExited = !!this._miniExitAt && Date.now() - this._miniExitAt <= MINI_CLICK_GUARD_MS;
    if (!this._ui.mini && !justExited) return;
    if (justExited) this._miniExitAt = 0; // 只拦一击,窗口过后恢复正常可点
    e.preventDefault();
    e.stopPropagation(); // 捕获阶段截断:目标按钮的 handler 根本不会执行
    this._onCardPointer();
  }

  // 键盘焦点进入卡片(如 Tab 到进度条/控件):恢复完整模式,保证控件可达;
  // 用 JS 而非 CSS :focus-within —— 后者 visibility:visible !important 会顶掉音量面板的
  // volmode 隐身规则(点音量按钮即获得焦点),导致音量面板打开时控件不消失。
  _onWrapFocusIn() {
    this._focusInside = true;
    if (this._ui.mini) this._setMini(false);
    this._resetIdleTimer();
  }

  // 焦点离开卡片:重新允许空闲隐藏。
  _onWrapFocusOut() {
    this._focusInside = false;
    this._resetIdleTimer();
  }

  // 仅当极简相关状态真正变化时才重置计时(进度 tick 每秒触发 requestUpdate,不能每次都重置)。
  // 显式处理两种真该退出 mini 的场景:暂停、开面板。切歌(songId 变化)不退出,
  // 让 mini 在切歌时保持,避免整卡闪一下完整模式。
  _updatedMiniWatch() {
    const u = this._ui;
    const w = this._miniWatch;
    const lyricCount = u.lyrics ? u.lyrics.length : 0;
    const songId = u.song ? u.song.songId : null;

    const isPlayingChanged = w.isPlaying !== u.isPlaying;
    const songIdChanged = w.songId !== songId;
    const queueChanged = w.showQueue !== u.showQueue;
    const browserChanged = w.showBrowser !== u.showBrowser;
    const volumeChanged = w.showVolume !== u.showVolume;
    const transferChanged = w.transferOpen !== u.transferOpen;
    const lyricCountChanged = w.lyricCount !== lyricCount;

    if (!isPlayingChanged && !songIdChanged && !queueChanged && !browserChanged &&
        !volumeChanged && !transferChanged && !lyricCountChanged) return;

    const wasPlaying = w.isPlaying;
    const wasQueue = w.showQueue;
    const wasBrowser = w.showBrowser;
    const wasTransfer = w.transferOpen;

    w.isPlaying = u.isPlaying; w.lyricCount = lyricCount;
    w.showVolume = u.showVolume; w.showQueue = u.showQueue;
    w.showBrowser = u.showBrowser; w.songId = songId;
    w.transferOpen = u.transferOpen;

    // 暂停(isPlaying true→false)→ 去抖 500ms:切歌瞬间 isPlaying 会有短暂 false
    // (~几十~几百毫秒),持续 false 才是真暂停,短暂 false 让 mini 保持不闪。
    if (isPlayingChanged && wasPlaying && !u.isPlaying) {
      if (this._pauseTimer) clearTimeout(this._pauseTimer);
      this._pauseTimer = setTimeout(() => {
        this._pauseTimer = null;
        if (this._ui.isPlaying) return; // 已经恢复播放,不退出
        if (this._ui.mini) this._setMini(false);
        this._resetIdleTimer();
      }, MINI_PAUSE_REVERT_MS);
      return;
    }
    // 切歌时 isPlaying 短暂 false 后变 true:撤销去抖
    if (isPlayingChanged && !wasPlaying && u.isPlaying && this._pauseTimer) {
      clearTimeout(this._pauseTimer);
      this._pauseTimer = null;
    }
    // 打开队列/媒体库/流转页面板 → 退出 mini
    if ((!wasQueue && u.showQueue) || (!wasBrowser && u.showBrowser) || (!wasTransfer && u.transferOpen)) {
      if (this._ui.mini) this._setMini(false);
      this._resetIdleTimer();
      return;
    }
    // 切歌/歌词加载/音量切换:仅重置计时(mini 状态保持)
    this._resetIdleTimer();
  }

  // 音量面板:本层完全透明(无底色/无模糊),「遮挡」靠 .lower.volmode 把控件行、
  // 进度条、队列设为 visibility:hidden 原地隐身实现——露出的是卡片自身的模糊封面背景,
  // 与上半部分同源,无色差无边界,卡片高度零跳变。上半部分保持可见可点(点一下即关闭)。
  // 布局对齐:静音键 42px 顶替进度条左侧时间标签的位置,右侧留 42px 空位,
  // 使音量条与下方 seek 严格等长、上下重合。
  // 触屏优化:采用「相对拖动」——按下只记录起点、不跳值;移动时按位移增量调音量。
  _renderVolumeOverlay() {
    const u = this._ui;
    const vpct = Math.round(u.volume * 100);
    return html`
      <div class="vol-overlay ${u.showVolume ? "open" : ""}">
        <div class="vol-row" @click=${(e) => e.stopPropagation()}>
          <button class="ctl" title="${u.muted ? this._t("control.unmute") : this._t("control.mute")}" @click=${this._toggleMute}>${this._icon(u.muted ? "volumeX" : "volume2", 20)}</button>
          <div class="vol-slider" @pointerdown=${this._volPointerDown} @pointermove=${this._volPointerMove} @pointerup=${this._volPointerUp} @pointercancel=${this._volPointerUp}>
            <div class="vol-track"></div>
            <div class="vol-fill" style="width:${vpct}%"></div>
            <div class="vol-knob" style="left:${vpct}%"></div>
            <span class="vol-value" style="left:${vpct}%">${vpct}%</span>
          </div>
          <span class="vol-gap"></span>
        </div>
      </div>`;
  }

  _volPointerDown(e) {
    const el = e.currentTarget;
    if (el.setPointerCapture && e.pointerId != null) { try { el.setPointerCapture(e.pointerId); } catch {} }
    const rect = el.getBoundingClientRect();
    this._volSliderEl = el;
    this._volDrag = { startX: e.clientX, startVal: this._ui.volume, width: Math.max(1, rect.width) };
    this._ui.volDragging = true;
    el.classList.add("dragging");
  }

  _volPointerMove(e) {
    if (!this._volDrag) return;
    const d = this._volDrag;
    let pct = d.startVal * 100 + ((e.clientX - d.startX) / d.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    const v = pct / 100;
    this._ui.volume = v;
    // 直接改 DOM,避免每次 pointermove 触发整卡重渲染——外网代理下更跟手。
    const el = this._volSliderEl;
    if (el) {
      const fill = el.querySelector(".vol-fill");
      const knob = el.querySelector(".vol-knob");
      const val = el.querySelector(".vol-value");
      if (fill) fill.style.width = pct + "%";
      if (knob) knob.style.left = pct + "%";
      if (val) { val.style.left = pct + "%"; val.textContent = Math.round(pct) + "%"; }
    }
    this._commitVolume(v);
  }

  _volPointerUp() {
    if (!this._volDrag) return;
    const el = this._volSliderEl;
    if (el) el.classList.remove("dragging");
    this._volSliderEl = null;
    this._volDrag = null;
    this._ui.volDragging = false;
    this._commitVolume(this._ui.volume, true);
    this.requestUpdate();
  }

  _commitVolume(v, immediate = false) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    if (this._volumeDebounce) clearTimeout(this._volumeDebounce);
    if (immediate) {
      this._volumeIssuedAt = Date.now();
      this._client.setVolume(pid, v).catch((e) => err("setVolume failed", e));
      return;
    }
    this._volumeDebounce = setTimeout(() => {
      this._volumeIssuedAt = Date.now();
      this._client.setVolume(pid, v).catch((e) => err("setVolume failed", e));
    }, 120);
  }

  _seek(e) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    const dur = this._ui.duration || 0;
    // 分母未知时不发 seek 0(否则「点哪都回开头」):等队列/状态把时长带回来再拖。
    if (!(dur > 0)) {
      dbg("seek 忽略:时长未知(分母为 0)", { peer: pid, pct: e.target.value });
      return;
    }
    const pct = Number(e.target.value);
    if (!isFinite(pct)) return;
    // 越界钳位:拖到 100% 四舍五入超 duration 会让 DLNA 拒收/跳开头,留 0.5s 余量。
    const clamped = Math.min(Math.max(0, (pct / 100) * dur), dur - 0.5 > 0 ? dur - 0.5 : dur);
    // ★ 精度守卫(最小粒度 1 秒):见 alignSeekSeconds 的硬约束。乐观值 _ui.currentTime
    //   必须与下发值同源 —— 否则轮询一回就比手指值小,进度条会被拽回。
    const t = alignSeekSeconds(clamped);
    // debug:手指落点 vs 实际下发值。三者不一致时,前两段差值是尾部 0.5s 余量在起作用,
    // 后两段差值是 1 秒粒度在起作用 —— 用户会感觉「拖到最右却没到最后」,有意为之,
    // 日志里要能一眼分清是哪一层。
    dbg("拖动", { peer: pid, pct, duration: dur, 手指秒: (pct / 100) * dur, 钳位后: clamped, 下发: t });
    this._ui.currentTime = t;
    this._ui.seekDragging = true; // 拖拽中:tick/轮询不覆盖手指值(对标 volDragging)
    if (this._seekTimer) clearTimeout(this._seekTimer);
    this._seekTimer = setTimeout(() => {
      this._seekTimer = null;
      this._ui.seekDragging = false;
      // 拖拽结束立刻重渲染一次,让 _syncSeekThumb 把圆点对齐到权威值(整秒对齐后可能与
      // 手指终点差不到 1s)。不写这行也能跟上,但要等下一个 tick/轮询(最差 2s),期间
      // 圆点停在手指处 —— 观感与本次事故一样,不留这个窗口。
      this.requestUpdate();
      this._seekIssuedAt = Date.now(); // 丢弃 seek 前采样的上报,避免进度条被拽回
      // debug:实际下发的一刻(250ms 防抖收敛后)。连拖时这行的 t 若与手指终点不符,
      // 说明防抖窗口没吃住最后一次 input。
      dbg("下发 seek", { peer: pid, 目标秒: t, issuedAt: this._seekIssuedAt });
      this._client.seek(pid, t)
        .then(() => {
          this._seekAckAtMs = Date.now(); // 因果屏障:此后发起的拉取必含 seek 结果
          dbg("seek 返回成功", { peer: pid, 目标秒: t, 耗时ms: Date.now() - this._seekIssuedAt });
        })
        .catch((err2) => {
          this._seekIssuedAt = 0; // seek 失败:服务端未落位,旧位置上报依然有效
          this._seekAckAtMs = 0;
          err("seek failed", { peer: pid, 目标秒: t }, err2);
        });
    }, 250);
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
    if (!lines.length) { this._ui.currentLyric = ""; this._ui.lyricIndex = -1; return; }
    const t = this._ui.currentTime;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= t) idx = i; else break;
    }
    this._ui.currentLyric = idx >= 0 ? lines[idx].text : "";
    this._ui.lyricIndex = idx;
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

  async _toggleLike() {
    const song = this._ui.song;
    if (!song?.songId) return;
    const wasLiked = this._ui.liked;
    this._ui.liked = !wasLiked; // 乐观翻转,先给即时反馈
    this.requestUpdate();
    try {
      if (wasLiked) {
        const r = await this._client.unstar(song.songId);
        if (r?.error) throw new Error(r.error.message || "unstar failed");
      } else {
        const r = await this._client.star(song.songId);
        if (r?.error) throw new Error(r.error.message || "star failed");
      }
      // 成功后从后端重新同步收藏态,保证 UI 与服务器一致(也能暴露代理通道失败)
      await this._loadLiked(song.songId);
    } catch (e) {
      err("like toggle failed", e);
      this._ui.liked = wasLiked; // 失败回退到真实状态
      this._ui.error = this._t("errors.likeFailed");
      this.requestUpdate();
    }
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
    // 乐观清空本地展示(封面/歌词/进度/播放态),不等后端事件回传(对齐 Web castClearQueue)。
    this._clearNowPlaying();
    this._client.clearQueue(pid).catch((e) => err("clearQueue failed", e));
  }

  // 跳播到队列中指定曲目并立即播放(后端已持有该队列,直接跳;shuffle 下也尊重指定索引)
  // 后端 v2.3.23 起 playFrom 同样尊重指定起点(shuffle 不再随机覆盖),两条路都对。
  _jumpTo(index) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    const total = (this._ui.queue && this._ui.queue.total) || 0;
    if (index < 0 || index >= total) return;
    this._client.jumpToIndex(pid, index)
      .catch((e) => {
        // 后端未升级:退化成完整队列 + 目标索引重放(REST 拉全量,不再依赖本地全量数组)
        err("jumpToIndex unavailable, fallback to playQueue", e);
        this._client.getQueue(pid).then((q) => {
          const items = (q && q.items) || [];
          this._client.playQueue(pid, items, index).catch((e2) => err("jumpTo failed", e2));
        }).catch((e2) => err("jumpTo fallback getQueue failed", e2));
      });
  }

  // 加入播放队列并播放这首歌(不是继续播队列里别的歌):
  // 1) enqueue 把该曲追加到后端队列末尾(队列为空时后端会自动起播)
  // 2) 取权威队列,定位刚追加的这首歌(末尾),用 jump 跳播到它
  //    —— jump 是"在既有队列里跳到第 N 位"的专用端点,语义比重新起播精确:
  //       它不会动队列内容,也不会触发洗牌序列重建。
  //    后端未升级(无 /queue/jump)时退化为"重建队列=原队列+该曲、从该曲起播",
  //    绝不用 playQueue([song],0) 清空原队列。
  //
  // 注(2026-09-10):后端 v2.3.23 起 `playFrom` 已修好「指定起点不再被随机覆盖」
  // (修前它在 shuffle 下会 Math.random 丢弃 startIndex)。上面这套 jump 流程仍保留
  // ——它是"在既有队列中定位"的正确工具,与起点定位 bug 无关,不因该修复而失效。
  async _appendAndPlay(song) {
    const pid = this._ui.currentPeerId;
    if (!pid || !song) return;
    const item = childToQueueItem(song);
    // 乐观:起播指令已下发,按钮立即切到播放中(后端事件/轮询会纠正)。
    this._ui.isPlaying = true;
    this.requestUpdate();
    try {
      await this._client.enqueue(pid, [item]);
      const q = await this._client.getQueue(pid);
      const items = (q && q.items) || [];
      // 取最后(最新追加)的该曲下标,兼容队列里本就有同曲的情况
      let idx = -1;
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i] && items[i].songId === item.songId) { idx = i; break; }
      }
      if (idx < 0) idx = Math.max(0, items.length - 1);
      // 仅一首(队列原本为空,enqueue 已起播)无需再跳
      if (items.length > 1) {
        try {
          await this._client.jumpToIndex(pid, idx);
        } catch (e2) {
          // 后端未升级(无 /queue/jump):退化成"重建队列=原队列+该曲,并跳到该曲"——保留原队列,绝不清空
          err("jumpToIndex unavailable, fallback preserves queue", e2);
          const q2 = await this._client.getQueue(pid);
          const rebuilt = [...((q2 && q2.items) || []), item];
          await this._client.playQueue(pid, rebuilt, (q2 && q2.items) ? q2.items.length : 0);
        }
      }
    } catch (e) {
      err("appendAndPlay failed", e);
    }
  }

  // 拖拽排序:优先走后端 reorder 端点(不整队列重建);本地缓存先做即时反馈。
  async _qReorder(from, to) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    const meta = this._ui.queue || { total: 0 };
    const total = meta.total || 0;
    if (from < 0 || from >= total || to < 0 || to >= total || from === to) return;
    // 本地先移动缓存中已加载的行,拖拽即时反馈;currentIndex 跟随被移动的曲目。
    const cache = this._ui.qCache || new Map();
    const ordered = [];
    for (let i = 0; i < total; i++) ordered.push(cache.get(i));
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    const newCache = new Map();
    ordered.forEach((it, i) => { if (it) newCache.set(i, it); });
    this._ui.qCache = newCache;
    if (typeof meta.currentIndex === "number") {
      const cur = cache.get(meta.currentIndex);
      if (cur) {
        let ni = -1;
        newCache.forEach((v, i) => { if (v === cur) ni = i; });
        if (ni >= 0) { this._ui.queue = { ...meta, currentIndex: ni }; this._ui.currentIndex = ni; }
      }
    }
    this.requestUpdate();
    try {
      await this._client.reorderQueue(pid, from, to);
    } catch (e) {
      err("reorder failed", e);
      this._qReset(); // 失败回滚:清缓存等下一次 WS/重拉
    }
  }

  // ============ Rendering ============
  // lucide 风格 SVG 图标(stroke=currentColor;filled 时实心,用于播放/暂停/红心)
  _icon(name, size = 20, filled = false) {
    const body = MF_ICONS[name] || "";
    // 关键:必须把完整 <svg> 根字符串一起注入 HTML 元素(span)——HTML 解析器遇到
    // <svg> 会把子节点切到 SVG 命名空间;若只把子节点注入 lit 生成的 <svg>,
    // unsafeHTML 经 <template> 按 HTML 解析,子节点变成 HTMLUnknownElement 不渲染
    // (v1.5.7 图标全消失的根因)。
    const svg = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${filled ? "currentColor" : "none"}" stroke="${filled ? "none" : "currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
    return html`<span class="ic">${unsafeHTML(svg)}</span>`;
  }

  // 媒体库列表封面:标题先出,封面视口懒加载。
  // 直连模式返回可缓存直链;代理模式经 fetchWithAuth 拉 blob(objectURL)。
  // 这里先渲染带 data-cover-id 的占位 <img>,由 IntersectionObserver 进入视口后写 src
  // (代理模式则经 requestCover 拉取),见 _loadCoverInto。
  _coverImgTag(coverArt, prio = false) {
    if (!coverArt) return html`<span class="bnocover">♪</span>`;
    return html`<img class="bcover-lazy" data-cover-id="${coverArt}" alt="" loading="lazy" fetchpriority=${prio ? "high" : nothing} />`;
  }

  _loadCoverInto(img) {
    const id = img.getAttribute("data-cover-id");
    if (!id) return;
    // loadedId 守卫:翻页时 Lit 会复用同位置 <img> 节点(仅改 data-cover-id),
    // 若只用"是否加载过"做判据,复用节点的旧 src/dataset 残留会导致新页永远
    // 显示首页封面。改为比对"已为哪个 cover 加载过",不一致就重新加载。
    if (img.dataset.loadedId === id && img.getAttribute("src")) return;
    img.dataset.loadedId = id;
    const client = this._client;
    if (!client) return;
    if (client.mode === "proxy") {
      // 代理模式:经 fetchWithAuth 拉取(带 HA 凭据)转 objectURL,浏览器裸
      // <img src> 不带 HA 鉴权会被 401。直连模式用可缓存直链。
      client.requestCover(id).then((url) => {
        if (url && img.isConnected && img.dataset.loadedId === id) img.src = url;
      }).catch(() => {});
    } else {
      const url = client.coverUrl(id);
      if (url && img.isConnected) img.src = url;
    }
  }

  // 背景融合封面加载完成:采样其亮度,自动决定整卡文字用浅色(暗背景)还是深色(亮背景)。
  // proxy 模式 blob 同源可读;direct 跨域 tainted → catch 降级浅色文字。
  _onBgCoverLoad(e) {
    const img = e.currentTarget;
    if (!img || !img.getAttribute("src")) return;
    this._analyzeBrightness(img);
  }

  _analyzeBrightness(img) {
    try {
      const cv = document.createElement("canvas");
      cv.width = 24; cv.height = 24;
      const ctx = cv.getContext("2d");
      ctx.drawImage(img, 0, 0, 24, 24);
      const d = ctx.getImageData(0, 0, 24, 24).data;
      let sum = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        n++;
      }
      const avg = n ? sum / n : 0;
      // 平均亮度 >165(很亮的封面,如白/浅绿)→ 背景偏亮用深色文字;否则浅色文字。
      const lightText = !(avg > 165);
      if (this._ui.coverLightText !== lightText) {
        this._ui.coverLightText = lightText;
        this.requestUpdate();
      }
      // 封面强调色:主色提取——RGB 分桶(4bit/通道)统计,按「频次 × 饱和度」评分选最显著
      // 色桶,桶内平均色作主色。比全图平均色更贴近封面主色调(光晕/图标/强调色统一使用),
      // 避免多彩封面被平均成灰调。与亮度判定共用同一次像素遍历,零额外成本。
      if (n) {
        const bucket = new Map();
        for (let i = 0; i < d.length; i += 4) {
          const k = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4);
          let e = bucket.get(k);
          if (!e) { e = { c: 0, r: 0, g: 0, b: 0 }; bucket.set(k, e); }
          e.c++; e.r += d[i]; e.g += d[i + 1]; e.b += d[i + 2];
        }
        let best = null, bestScore = -1;
        for (const e of bucket.values()) {
          const ar = e.r / e.c / 255, ag = e.g / e.c / 255, ab = e.b / e.c / 255;
          const mx = Math.max(ar, ag, ab), mn = Math.min(ar, ag, ab);
          const sat = mx > 0 ? (mx - mn) / (mx + 1e-6) : 0;
          const score = e.c * (1 + sat * 1.5);
          if (score > bestScore) { bestScore = score; best = { ar, ag, ab }; }
        }
        if (best) {
          const { ar, ag, ab } = best;
          const mx = Math.max(ar, ag, ab), mn = Math.min(ar, ag, ab);
          const dl = mx - mn;
          const l = (mx + mn) / 2;
          let h = 0, s = 0;
          if (dl) {
            s = l > 0.5 ? dl / (2 - mx - mn) : dl / (mx + mn);
            if (mx === ar) h = ((ag - ab) / dl + (ag < ab ? 6 : 0)) * 60;
            else if (mx === ag) h = ((ab - ar) / dl + 2) * 60;
            else h = ((ar - ag) / dl + 4) * 60;
          }
          s = Math.min(1, Math.max(0.25, s * 1.6)); // 提饱和,避免灰蒙
          const ll = Math.min(0.7, Math.max(0.32, l)); // 限亮度,保证可读
          const [cr, cg, cb] = hslToRgb(h, s, ll);
          const acc = `${cr}, ${cg}, ${cb}`;
          if (this._ui.accentRgb !== acc) {
            this._ui.accentRgb = acc;
            this.requestUpdate();
          }
        }
      }
    } catch (err2) {
      // tainted canvas(直连跨域无 CORS):无法分析,保持默认浅色文字与品牌红强调色。
      if (this._ui.coverLightText !== true) { this._ui.coverLightText = true; this.requestUpdate(); }
      if (this._ui.accentRgb !== null) { this._ui.accentRgb = null; this.requestUpdate(); }
    }
  }

  _ensureCoverObserver(root) {
    // 媒体库每次重开,滚动容器 .br-list 都是全新节点。若复用上次绑定在旧节点上的
    // observer,新封面 img 不在旧 root 子树内,IntersectionObserver 永不触发
    // isIntersecting → 关闭再打开后封面全空。故 root 变化时重建 observer。
    if (this._coverObserver && this._coverObserverRoot === root) return;
    if (this._coverObserver) this._coverObserver.disconnect();
    this._coverObserverRoot = root;
    this._coverObserver = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          this._loadCoverInto(e.target);
          this._coverObserver.unobserve(e.target);
        }
      }
    }, { root, rootMargin: "250px 0px", threshold: 0.01 });
  }

  // 媒体库打开后,把当前可见(或即将可见)的封面占位登记进观察器。
  _observeBrowserCovers() {
    if (!this._ui.showBrowser || !this._client) return;
    const root = this.shadowRoot?.querySelector(".br-list");
    if (!root) return;
    this._ensureCoverObserver(root);
    root.querySelectorAll("img.bcover-lazy").forEach((img) => {
      const id = img.getAttribute("data-cover-id");
      // 只登记尚未为当前 cover 加载的节点;翻页复用节点(data-cover-id 已变)
      // 会重新登记并加载,避免残留首页封面。
      if (img.dataset.loadedId !== id) {
        img.removeAttribute("src"); // 清掉旧封面,避免显示错误的首页图直到新图加载
        this._coverObserver.observe(img);
      }
    });
  }

  // 队列封面懒加载:与媒体库同一套 IntersectionObserver(绑定 .qlist 滚动容器),
  // 虚拟滚动窗口内的封面随视口加载;已加载节点(loadedId===id)自动跳过。
  _observeQueueCovers() {
    if (!this._ui.showQueue || !this._client) return;
    const root = this.shadowRoot?.querySelector(".qlist");
    if (!root) return;
    this._ensureCoverObserver(root);
    root.querySelectorAll("img.bcover-lazy").forEach((img) => {
      const id = img.getAttribute("data-cover-id");
      if (img.dataset.loadedId !== id) {
        img.removeAttribute("src"); // 清掉旧封面,避免显示错误的残留图直到新图加载
        this._coverObserver.observe(img);
      }
    });
  }

  // 流转页封面懒加载:与媒体库/队列同一套观察器(绑定 .tp-scroll 滚动容器),
  // 由 B 的自动滚动带出视口的圆会随滚动陆续加载。
  _observeTransferCovers() {
    if (!this._ui.transferOpen || !this._client) return;
    const root = this.shadowRoot?.querySelector(".tp-scroll");
    if (!root) return;
    this._ensureCoverObserver(root);
    root.querySelectorAll("img.tp-cover-lazy").forEach((img) => {
      const id = img.getAttribute("data-cover-id");
      if (img.dataset.loadedId !== id) {
        img.removeAttribute("src");
        this._coverObserver.observe(img);
      }
    });
  }

  _fmtTime(s) {
    if (!s || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  }

  // 每次渲染后,若媒体库打开,等 DOM 落定再把可见封面登记进懒加载观察器。
  updated() {
    if (this._ui.showBrowser) {
      this.updateComplete.then(() => this._observeBrowserCovers()).catch(() => {});
      // 根层级分类网格:图标尺寸按可用高度自适应(3x2 保证不出现纵向滚动)。
      const bl = this._ui.browserStack[this._ui.browserStack.length - 1];
      if (bl && bl.type === "root") {
        this.updateComplete.then(() => {
          const el = this.shadowRoot?.querySelector(".br-list");
          if (!el) return;
          // 固定开销:每项 gap6+文字12+上下 padding22=40,2行+行距10+grid padding16=106。
          // 上限 42:卡片宽已由容器查询保证 hover 放大不超列宽,图标不再受此约束。
          // 垂直留 1.06 余量(类比 v1.6.33 水平「列宽/1.06-10」):2 行卡片 hover 放大后
          // 总高仍 ≤ 可用高,第二行底部不再溢出被裁。
          const size = Math.max(18, Math.min(42, Math.floor((el.clientHeight / 1.06 - 106) / 2)));
          if (size !== this._ui.catIconSize) { this._ui.catIconSize = size; this.requestUpdate(); }
        }).catch(() => {});
      }
    }
    if (this._ui.showQueue) {
      this.updateComplete.then(() => this._qEnsureLoaded()).catch(() => {});
      this.updateComplete.then(() => this._observeQueueCovers()).catch(() => {});
    }
    if (this._ui.transferOpen) {
      this.updateComplete.then(() => this._observeTransferCovers()).catch(() => {});
    }
    // 播放器清晰封面 + 背景融合封面都走 mode 感知加载(代理模式裸 <img src> 不带 HA 鉴权会 401)。
    const pc = this.shadowRoot?.querySelector(".nowcover");
    if (pc) this._loadCoverInto(pc);
    const bg = this.shadowRoot?.querySelector(".coverbg-img");
    if (bg && this._ui.song?.coverArt) this._loadCoverInto(bg);
    // 极简模式:上移量实测(见 _measureMiniShift)—— 每次渲染都刷新,值永远是最新的。
    // 实测值变化(如 chip 行换行、warnbar 出现)会补一次渲染,把新值写进 --mini-shift,
    // 否则极简期间布局一旦漂移,transform 仍用旧值 → 歌词/封面上移过头(顶出卡片)。
    if (this._measureMiniShift()) this.requestUpdate();
    // 极简歌词模式:相关状态变化时重置空闲计时;条件不满足(暂停/开面板/无歌词)时强制恢复完整模式。
    this._updatedMiniWatch();
    // 未播放态流动底色:同步暂停态(不可见 / 后台 tab / 面板打开)。
    this._syncIdleAmbient();
    // 进度小圆点跟随(2026-09-23):range 的 value 属性绑定首次交互后即失效,必须每次
    // 渲染后用 property 回写同一个百分比 —— 否则「填充条在动、圆点留在原地」。
    this._syncSeekThumb();
  }

  render() {
    if (this._ui.error) {
      return html`<ha-card><div class="wrap"><div class="err">MusicFlow: ${this._ui.error}</div></div></ha-card>`;
    }
    if (!this._client) {
      return html`<ha-card><div class="wrap"><div class="err">${this._t("common.init")}</div></div></ha-card>`;
    }
    const u = this._ui;
    const song = u.song;
    // 填充与圆点共用同一百分比来源(_progressPct),不得各算一遍(见 _syncSeekThumb)。
    const prog = this._progressPct();
    // 未播放态固定配色底色:无封面时接管底色(与 .coverbg 互斥),并让 --acc 落到柔色,
    // 使图标/进度条/选中态与底色同一色系,而不是突兀的纯白。
    const idleOn = this._idleAmbientOn();
    const pal = idleOn ? this._idlePalette() : null;
    const acc = u.accentRgb || (pal ? pal.acc : "255, 255, 255");
    // idle 底色是 8 组固定深色渐变(收尾 #14182a),一律按"暗底浅字"渲染,与 HA 明暗模式无关。
    const cardCls = pal ? "light" : (u.coverLightText ? "light" : "dark");

    return html`
      <ha-card class="${cardCls} ${pal ? "idle" : ""}" style="--acc: ${acc}">
        ${song?.coverArt ? html`
          <div class="coverbg">
            <img class="coverbg-img" data-cover-id="${song.coverArt}" alt="" @load=${this._onBgCoverLoad} />
            <div class="coverbg-veil"></div>
          </div>` : ""}
        ${pal ? html`
          <div class="idlebg">
            ${IDLE_GROUPS.map((g, i) => html`<i style="--c1:${g.c1};--c2:${g.c2};--dly:${(-(i * pal.cycle) / IDLE_GROUP_COUNT).toFixed(2)}s"></i>`)}
          </div>` : ""}
        <div class="wrap ${u.connected || u.serverOk ? "" : "off"} ${u.showQueue || u.showBrowser || u.transferOpen ? "panelmode" : ""} ${u.mini ? "mini" : ""}" style="--mini-shift:${this._miniShift}px" @click=${this._onWrapClick} @pointerenter=${this._onCardPointer} @pointermove=${this._onCardPointer} @focusin=${this._onWrapFocusIn} @focusout=${this._onWrapFocusOut}>
          ${!u.connected && u.wsState === "down" ? html`<div class="warnbar bad">${this._t("connection.cannotConnect")}</div>` : ""}
          ${this._renderOutputs()}

          <div class="now">
            <div class="meta">
              <div class="track">${song ? song.title : this._t("common.notPlaying")}<span class="t-art">${song && song.artist ? " - " + song.artist : ""}</span></div>
              ${this._renderLyricBox()}
            </div>
            <div class="cover" role="button" @click=${(e) => { e.stopPropagation(); this._openBrowser(); }}>${song?.coverArt
              ? html`<img class="nowcover" data-cover-id="${song.coverArt}" alt="" />`
              : html`<div class="nocover">♪</div>`}</div>
          </div>

          <!-- 下半区(控件行 + 进度条)作为音量面板的定位容器。
               volmode 时下面几块下沉淡出(仍占位,卡片高度零跳变,见 CSS 共享隐身规则)。
               队列/媒体库面板已移出到 .wrap 级(.panelmode 时覆盖整张卡)。 -->
          <div class="lower ${u.showVolume ? "volmode" : ""}">
            <div class="controls">
              <button class="ctl ${u.showQueue ? "active" : ""}" title="${this._t("control.queue")}" @click=${(e) => { e.stopPropagation(); u.showQueue = !u.showQueue; u.showBrowser = false; this.requestUpdate(); }}>${this._icon("queue", 20)}</button>
              <button class="ctl" title="${this._t("playModeTip." + u.playMode)}" @click=${this._cyclePlayMode}>${this._icon(PLAY_MODE_ICON[u.playMode], 20)}</button>
              <button class="ctl" title="${this._t("control.prev")}" @click=${this._prev}>${this._icon("prev", 22)}</button>
              <button class="ctl play" title="${this._t("control.playPause")}" @click=${this._togglePlay}>${this._icon(u.isPlaying ? "pause" : "play", 22, true)}</button>
              <button class="ctl" title="${this._t("control.next")}" @click=${this._next}>${this._icon("next", 22)}</button>
              <button class="ctl like ${u.liked ? "on" : ""}" title="${this._t("control.like")}" @click=${this._toggleLike}>${this._icon("heart", 20, u.liked)}</button>
              <button class="ctl vol-open" title="${this._t("control.volume")}" @click=${this._toggleVolumePop}>${this._icon(u.muted || u.volume <= 0 ? "volumeX" : "volume2", 20)}</button>
            </div>

            <div class="progress-row">
              <span class="t">${this._fmtTime(u.currentTime)}</span>
              <!-- value= 只作首帧默认值:range 一经用户交互,属性写入即被忽略(脏值标志),
                   实时跟随由 _syncSeekThumb() 在 updated() 里按 property 回写,勿改回属性驱动 -->
              <input class="seek" type="range" min="0" max="100" step="0.1" value="${prog}"
                style="background: linear-gradient(90deg, rgb(var(--acc)) ${prog}%, var(--seek-bg) ${prog}%)"
                @input=${this._seek} />
              <span class="t">${this._fmtTime(u.duration)}</span>
            </div>

            <!-- 音量面板常驻渲染:开合只切 .open,CSS 只播进场滑动(--dur-panel-in),
                 关闭为 visibility 瞬切,不可点/不可 Tab,行为与旧条件渲染一致 -->
            ${this._renderVolumeOverlay()}
          </div>

          <!-- 三个面板常驻渲染:开合只切各自的 .open class,CSS 只播「从底部滑上来」
               的进场动画(不淡入);关闭是 visibility 瞬切,不可点/不可 Tab。
               互斥与数据加载守卫(仅 .open 时 observe)不变。 -->
          ${this._renderQueue()}
          ${this._renderMediaBrowser()}
          ${this._renderTransfer()}
        </div>
      </ha-card>
    `;
  }

  _renderOutputs() {
    // 兜底过滤:任何路径进来的离线设备都不渲染;群组是「容器」,成员全离线也保留
    // (否则群里没成员时连遥控入口都找不到)。
    const peers = (this._ui.peers || []).filter((p) => p.available !== false || p.kind === "group");
    if (!peers.length) return html`<div class="outputs"><span class="hint">${this._t("browser.noPlayer")}</span></div>`;
    // 首页 chip 行**恒为一行**:不换行,放不下的播放器靠**按住任意 chip 左右拖动**滑出来
    // (鼠标拖 = 本文件 _outListPointerDown;触屏走原生 pan-x)。点行尾「流转播放」可进整卡
    // 流转页做流转/群组增减成员/销毁。当前遥控目标提到首位,保证初始视口内「正在控的那台」可见。
    // 点任何 chip(含群组)= 只切换遥控目标;群组增减成员只在流转页做(2026-10-23 用户拍板)。
    const cur = this._ui.currentPeerId;
    const ordered = cur
      ? [...peers.filter((p) => p.peerId === cur), ...peers.filter((p) => p.peerId !== cur)]
      : peers;
    return html`
      <div class="outputs">
        <div class="out-list" @pointerdown=${this._outListPointerDown}>
          ${ordered.map((p) => html`
            <div class="out-wrap">
              <button class="out ${p.peerId === this._ui.currentPeerId ? "active" : ""} ${p.available ? "" : "off"}"
                title="${this._peerTitle(p)}"
                @click=${() => {
                  // 横向拖动结束后浏览器仍会补发 click:这一段直接吞掉,避免「拖完就切台」。
                  if (this._outDragSwallowed()) return;
                  this._selectPeer(p.peerId);
                }}>
                ${this._icon(this._peerIcon(p), 16)}<span class="out-label">${this._peerLabel(p)}</span>
              </button>
            </div>
          `)}
        </div>
        <button class="out transfer" title="${this._t("outputs.transfer")}"
          aria-label="${this._t("outputs.transfer")}"
          @click=${(e) => { e.stopPropagation(); this._openTransfer(); }}>
          ${this._icon("transfer", 17)}
        </button>
      </div>
    `;
  }

  // ---- 首页 chip 行横向拖动(鼠标 / 笔) ----
  // 触屏走 CSS 原生 `touch-action: pan-x`,这里只补鼠标与笔:按住**任意 chip** 左右拖,
  // 位移超过 8px 才算拖动(不误触切换),松手后 350ms 内吞掉浏览器补发的 click。
  // 不做惯性滑动(按需求明确不加)。
  _outDragSwallowed() {
    return !!this._outDragUntil && Date.now() < this._outDragUntil;
  }

  _outListPointerDown(e) {
    if (e.pointerType === "touch") return; // 触屏由原生滚动处理
    if (typeof e.button === "number" && e.button !== 0) return;
    const list = e.currentTarget;
    if (!list || list.scrollWidth <= list.clientWidth + 1) return; // 无滚动空间:不起拖
    this._outDrag = { list, pointerId: e.pointerId, x: e.clientX, left: list.scrollLeft, active: false };
    this._outDragMoveH = (ev) => this._onOutDragMove(ev);
    this._outDragEndH = (ev) => this._onOutDragEnd(ev);
    window.addEventListener("pointermove", this._outDragMoveH, { passive: false });
    window.addEventListener("pointerup", this._outDragEndH);
    window.addEventListener("pointercancel", this._outDragEndH);
  }

  _onOutDragMove(ev) {
    const d = this._outDrag;
    if (!d || ev.pointerId !== d.pointerId) return;
    const dx = ev.clientX - d.x;
    if (!d.active) {
      if (Math.abs(dx) < 8) return;
      d.active = true;
      d.list.classList.add("drag-x");
    }
    if (ev.cancelable) ev.preventDefault();
    d.list.scrollLeft = d.left - dx;
  }

  _onOutDragEnd(ev) {
    const d = this._outDrag;
    if (!d || (ev.pointerId !== undefined && ev.pointerId !== d.pointerId)) return;
    if (d.active) this._outDragUntil = Date.now() + 350;
    this._outDrag = null;
    d.list.classList.remove("drag-x");
    if (this._outDragMoveH) {
      window.removeEventListener("pointermove", this._outDragMoveH);
      this._outDragMoveH = null;
    }
    if (this._outDragEndH) {
      window.removeEventListener("pointerup", this._outDragEndH);
      window.removeEventListener("pointercancel", this._outDragEndH);
      this._outDragEndH = null;
    }
  }

  // 打开整卡流转页:首页 chip 行只放得下一行,被裁掉的播放器在这里切换/拖拽流转。
  // 先收起队列/媒体库面板,避免流转页底下残留临时浮层状态(A3 渲染页面)。
  _openTransfer() {
    this._ui.showQueue = false;
    this._ui.showBrowser = false;
    this._ui.showVolume = false; // 音量浮层 z-index 高于 .panel,不关会遮住回收站与底部热区
    this._tpSession += 1;        // 新会话:关页前残留的异步回写全部作废
    if (this._tpCloseTimer) { clearTimeout(this._tpCloseTimer); this._tpCloseTimer = null; }
    this._ui.transferOpen = true;
    this._ui.transferGroupId = null;
    this._ui.transferBusy = false;
    this._ui.transferMsg = "";
    this._ui.transferMsgErr = false;
    this._transferGroupMembers = new Set();
    this.requestUpdate();
  }

  // ============ 整卡流转页 ============
  // 与队列/媒体库同款:`.panel` inset:0 铺满整张卡片(尺寸 = 打开前的卡片尺寸,不动卡高),
  // 头部固定、内容区 .tp-scroll 独立滚动;底部回收站在滚动区之外(B3 的物理分界)。
  // 点空白关闭:播放端圆(.tp-peer)/回收站(.tp-trash)/按钮等交互元素不触发关闭。
  _renderTransfer() {
    // 过滤口径与首页一致:离线设备不展示(避免拖到一台已下线的端上才失败);
    // 群组是容器,成员全离线也保留;Web 端不出声,不是流转目标。
    const peers = (this._ui.peers || []).filter(
      (p) => (p.available !== false || p.kind === "group") &&
        (p.kind !== "local" || p.platform !== "web"),
    );
    const ordered = this._sortPeersForDisplay(peers);
    const busy = this._ui.transferBusy;
    return html`
      <div class="panel transfer ${busy ? "busy" : ""} ${this._ui.transferOpen ? "open" : ""}"
        @pointerdown=${this._onTransferPointerDown} @click=${this._onTransferClick}>
        <div class="panel-head">
          <span class="tp-title">${this._t("transfer.title")}</span>
          ${this._ui.transferMsg ? html`
            <span class="tp-msg ${this._ui.transferMsgErr ? "err" : ""}">${this._ui.transferMsg}</span>` : null}
          <button class="mini close" title="${this._t("control.close")}"
            @click=${(e) => { e.stopPropagation(); this._closeTransfer(); }}>✕</button>
        </div>
        ${this._ui.transferGroupId ? html`
          <div class="tp-gm-hint">${this._t("transfer.groupHint")}</div>` : null}
        <div class="tp-scroll">
          <div class="tp-grid">
            ${ordered.length ? ordered.map((p) => this._renderTransferPeer(p)) : html`
              <div class="empty tp-empty">${this._t("transfer.empty")}</div>`}
          </div>
        </div>
        <div class="tp-trash ${this._tpOverTrash ? "over" : ""}" title="${this._t("transfer.trashHint")}">
          ${this._icon("trash", 18)}
          <span>${this._t("transfer.trash")}</span>
        </div>
      </div>
    `;
  }

  // 单个播放端:圆形封面(在播曲目;没有则设备图标)+ 名称 + 状态行。
  // 当前遥控目标带 accent 高亮与勾选角标;群组用虚线圆 + 成员数区分。
  _renderTransferPeer(p) {
    const isGroup = p.kind === "group";
    const q = p.queue || {};
    const items = Array.isArray(q.items) ? q.items : null;
    const idx = typeof q.currentIndex === "number" ? q.currentIndex : -1;
    const item = items && idx >= 0 && idx < items.length ? items[idx] : null;
    const isCurrent = this._ui.currentPeerId === p.peerId;
    // 当前目标的 peer 行可能只拿到队列摘要(items 为空),封面/曲名从卡片已镜像的
    // 当前歌曲补全 —— 否则「正在播的那台」反而是唯一没有封面的。
    const mirrored = isCurrent ? this._ui.song : null;
    const playing = isGroup
      ? !!q.isActive
      : (!!q.isActive || (isCurrent && !!this._ui.isPlaying));
    const coverArt = (item && item.coverArt) || (playing && mirrored && mirrored.coverArt) || null;
    const title = (item && item.title) || (playing && mirrored && mirrored.title) || "";
    const artist = (item && item.artist) || "";
    const sub = isGroup
      ? (playing && title
        ? title
        : this._t("transfer.members", { n: (p.memberIds || []).length }))
      : (playing && title
        ? (artist ? `${title} - ${artist}` : title)
        : this._t("transfer.idle"));
    // 成员勾选圈只给**能进群组**的设备:群组出流是 sendspin pump → AirPlay BridgeRing
    // 桥接,只有 airplay / sendspin 两种成员能出声;DLNA(与本机客户端)加进去也是静默。
    // Web 端群组页的候选口径同样是这两个 kind(Groups/index.vue 的 selectableDevices)。
    // 「已是成员」时也照渲染 —— 历史组里若存着 DLNA 成员,用户仍得有出口把它移除。
    const member = this._isTransferGroupMember(p);
    const joinable = this._canJoinGroup(p);
    const showBadge = !!this._ui.transferGroupId && !isGroup && (joinable || member);
    const isDropTarget = p.peerId === this._tpOverPeerId;
    return html`
      <div class="tp-peer ${isCurrent ? "current" : ""} ${isDropTarget ? "drop" : ""} ${isGroup ? "group" : ""} ${p.available === false ? "off" : ""}"
        data-peer-id="${p.peerId}" title="${this._peerTitle(p)}">
        ${isCurrent ? html`<span class="tp-pulse" aria-hidden="true"></span>` : null}
        <div class="tp-ring" role="button" tabindex="0"
          @click=${(e) => this._tpPeerClick(e, p)}
          @keydown=${(e) => this._tpPeerKey(e, p)}
          @pointerdown=${(e) => this._tpPointerDown(e, p)}>
          <div class="tp-cover">
            ${coverArt
              ? html`<img class="tp-cover-lazy" data-cover-id="${coverArt}" alt="" draggable="false" />`
              : html`<span class="tp-fallback">${this._icon(isGroup ? "group" : this._peerIcon(p), 30)}</span>`}
          </div>
          ${isGroup ? html`<span class="tp-dash"></span>` : null}
          ${playing ? html`<span class="tp-live" title="${this._t("transfer.playing")}"><i></i><i></i><i></i></span>` : null}
        </div>
        <div class="tp-name">${this._peerLabel(p)}</div>
        <div class="tp-sub">${sub}</div>
        ${showBadge ? html`
          <button class="tp-badge ${member ? "in" : ""}"
            title="${member ? this._t("outputs.groupLeave") : this._t("outputs.groupJoin")}"
            aria-pressed="${member ? "true" : "false"}"
            @pointerdown=${(e) => e.stopPropagation()}
            @click=${(e) => this._tpToggleMember(e, p)}>✓</button>` : null}
      </div>
    `;
  }

  _tpPeerKey(e, p) {
    const path = e.composedPath ? e.composedPath() : [];
    // 焦点在 +/− 勾选圈上按 Enter:交给按钮自己的 click,别先被这里当成「切目标」。
    if (path.some((n) => n && n.classList && n.classList.contains("tp-badge"))) return;
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      this._tpPeerClick(e, p);
    }
  }

  // 单击播放端 = 切遥控目标(与首页 chip 同义);点当前目标 = 直接关页;
  // 点群组 = 切到该群组并进入成员管理模式(见 _tpToggleGroup)。
  _tpPeerClick(e, p) {
    if (e && e.stopPropagation) e.stopPropagation();
    if (Date.now() < this._tpSuppressClickUntil) return; // 刚结束的一次拖拽,别误当单击
    if (this._ui.transferBusy) return;
    this._tpCancelCloseSoon(); // 用户又操作了:撤销上一次成功后排的自动关页
    if (p.kind === "group") { this._tpToggleGroup(p); return; }
    const target = this._resolveControlPeerId(p.peerId);
    if (target === this._ui.currentPeerId) { this._closeTransfer(); return; }
    this._selectPeer(p.peerId);
    this._tpFlash(this._t("transfer.switched", { name: this._peerLabel(p) }), false);
    this._tpCloseSoon();
  }

  // ============ 群组管理(流转页内) ============
  // 点群组 = ①遥控目标切到该群组;②进入成员管理模式,设备圆右上出现 +/−。
  // 再点同一群组 = 退出管理(遥控目标不变,与首页/客户端一致)。
  async _tpToggleGroup(p) {
    if (this._ui.transferBusy) return;
    this._tpCancelCloseSoon();
    if (this._ui.transferGroupId === p.peerId) {
      this._ui.transferGroupId = null;
      this._transferGroupMembers = new Set();
      this.requestUpdate();
      return;
    }
    const session = this._tpSession;
    if (this._resolveControlPeerId(p.peerId) !== this._ui.currentPeerId) {
      this._selectPeer(p.peerId);
    }
    this._ui.transferGroupId = p.peerId;
    this._transferGroupMembers = new Set();
    this.requestUpdate();
    try {
      const res = await this._client.getGroups();
      // 旧请求(已切到别的群/已关页)回来时不得覆盖当前成员集。
      if (session !== this._tpSession || this._ui.transferGroupId !== p.peerId) return;
      const gid = p.peerId.startsWith("group:") ? p.peerId.slice("group:".length) : p.peerId;
      const hit = (res && res.groups || []).find((g) => g && g.id === gid);
      if (hit) this._transferGroupMembers = new Set((hit.memberIds || []).map(String));
    } catch (_e) {
      // 拉取失败:全部显示 +,点一下以服务端返回的 memberIds 为准。
    }
    if (session !== this._tpSession || this._ui.transferGroupId !== p.peerId) return;
    this.requestUpdate();
  }

  /** 能否加入群组:只有 AirPlay / Sendspin 走群组桥接出流;DLNA / 本机客户端在组里
   *  没有出声通路,服务端群组页也不把它们列为候选。 */
  _canJoinGroup(p) {
    return !!p && (p.kind === "airplay" || p.kind === "sendspin");
  }

  /** 群组 memberIds 里与该设备对应的那条字符串(命中返回原样,未命中 null)。
   *  服务端口径是 `airplay:<deviceId>` / `sendspin:<clientId>`;旧组可能存裸 deviceId,
   *  故按「peerId → kind:裸id → 裸id」依次回查 —— 移除成员必须回传**组里那条**,
   *  否则服务端按 no-op 处理,成员删不掉。 */
  _groupMemberKey(p) {
    const set = this._transferGroupMembers;
    if (!set || !p) return null;
    const pid = String(p.peerId || "");
    const cut = pid.indexOf(":");
    const bare = cut >= 0 ? pid.slice(cut + 1) : pid;
    for (const k of [pid, `${p.kind}:${bare}`, bare]) {
      if (k && set.has(k)) return k;
    }
    return null;
  }

  _isTransferGroupMember(p) {
    if (!this._ui.transferGroupId) return false;
    return this._groupMemberKey(p) !== null;
  }

  async _tpToggleMember(e, p) {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!this._client || !this._ui.transferGroupId || this._ui.transferBusy) return;
    const groupId = this._ui.transferGroupId;
    const gid = groupId.startsWith("group:")
      ? groupId.slice("group:".length)
      : groupId;
    const key = this._memberKeyFor(p);
    const join = !this._isTransferGroupMember(p);
    // 加入路径再拦一道:非 AirPlay / Sendspin(如 DLNA)不许进组 —— 组播对它没有出声
    // 通路,放进去只会得到「成员在册但没声音」的假成功。移除路径不拦(历史成员要能清掉)。
    if (join && !this._canJoinGroup(p)) {
      this._tpFlash(this._t("transfer.groupUnsupported"), true);
      return;
    }
    const session = this._tpSession;
    this._ui.transferBusy = true;
    this.requestUpdate();
    try {
      const res = await this._client.updateGroupMembers(gid, join ? [key] : [], join ? [] : [key]);
      // 请求在途时关页/换了群:成员集只属于原群,丢弃本次回写。
      if (session !== this._tpSession || this._ui.transferGroupId !== groupId) return;
      const ids = res && res.group && res.group.memberIds;
      if (Array.isArray(ids)) this._transferGroupMembers = new Set(ids.map(String));
      else if (join) { this._transferGroupMembers.add(key); this._transferGroupMembers.add(p.peerId); }
      else { this._transferGroupMembers.delete(key); this._transferGroupMembers.delete(p.peerId); }
    } catch (e2) {
      err("transfer group member update failed", e2);
      if (session === this._tpSession) this._tpFlash(this._t("transfer.groupFailed"), true);
    } finally {
      // busy 归新会话管:旧会话的 finally 不能把新会话的忙态/页面状态改掉。
      if (session === this._tpSession) {
        this._ui.transferBusy = false;
        this.requestUpdate();
      }
    }
  }

  // ============ 流转 / 销毁 ============
  async _tpTransfer(from, to) {
    if (!this._client || !from || !to || from.peerId === to.peerId) return;
    if (this._ui.transferBusy) return;
    const session = this._tpSession;
    this._ui.transferBusy = true;
    this._ui.transferMsgErr = false;
    this._ui.transferMsg = this._t("transfer.transferring", {
      from: this._peerLabel(from), to: this._peerLabel(to),
    });
    this.requestUpdate();
    let ok = false;
    try {
      const res = await this._client.transferFrom(to.peerId, from.peerId);
      if (!res || res.success !== true) throw new Error("transfer-from failed");
      // 源队列为空时服务端返回 success:true + transferred:0(见 peers.ts):
      // 不能谎报流转成功,更不能 reset 源端(那会弹「已销毁」式副作用)。
      if (res.transferred === 0) {
        if (session === this._tpSession) {
          this._tpFlash(this._t("transfer.emptyQueue", { from: this._peerLabel(from) }), true);
        }
        return;
      }
      // 源端彻底重置(停止 + 清队列 + 清运行态):搬移语义,不是复制。
      // 失败不影响流转本身 —— 队列已在目标端起播(与客户端同口径)。
      try { await this._client.resetPeer(from.peerId); }
      catch (e2) { err("transfer reset source failed", e2); }
      ok = true;
      // 在途时关页/重开:搬运已发生,但不能再改新会话的遥控目标与提示。
      if (session !== this._tpSession) return;
      this._selectPeer(to.peerId); // 遥控目标跟随目的地(成员会收敛到托管组)
      this._tpFlash(this._t("transfer.transferred", { to: this._peerLabel(to) }), false);
      this._tpCloseSoon();
    } catch (e2) {
      err("transfer failed", e2);
      if (session === this._tpSession) this._tpFlash(this._t("transfer.transferFailed"), true);
    } finally {
      if (session === this._tpSession) {
        this._ui.transferBusy = false;
        this.requestUpdate();
        if (ok) this._refreshPeers();
      }
    }
  }

  // 回收站 = 销毁该端(停止 + 清空队列)。成功弹提示**不关页**,失败留页报错。
  async _tpDestroy(p) {
    if (!this._client || !p) return;
    if (this._ui.transferBusy) return;
    const session = this._tpSession;
    this._ui.transferBusy = true;
    this.requestUpdate();
    try {
      await this._client.resetPeer(p.peerId);
      if (session !== this._tpSession) return;
      this._tpFlash(this._t("transfer.destroyed", { name: this._peerLabel(p) }), false);
      this._refreshPeers();
    } catch (e2) {
      err("destroy peer failed", e2);
      if (session === this._tpSession) this._tpFlash(this._t("transfer.destroyFailed"), true);
    } finally {
      if (session === this._tpSession) {
        this._ui.transferBusy = false;
        this.requestUpdate();
      }
    }
  }

  _tpFlash(text, isErr = false) {
    if (this._tpMsgTimer) { clearTimeout(this._tpMsgTimer); this._tpMsgTimer = null; }
    this._ui.transferMsg = text || "";
    this._ui.transferMsgErr = !!isErr;
    this.requestUpdate();
    if (text) {
      this._tpMsgTimer = setTimeout(() => {
        this._tpMsgTimer = null;
        this._ui.transferMsg = "";
        this.requestUpdate();
      }, 3200);
    }
  }

  _tpCloseSoon(ms = 650) {
    if (this._tpCloseTimer) clearTimeout(this._tpCloseTimer);
    this._tpCloseTimer = setTimeout(() => {
      this._tpCloseTimer = null;
      this._closeTransfer();
    }, ms);
  }

  // 撤销「成功后排的自动关页」:用户在等待窗口内又操作了,不能把页面从他手下关掉。
  _tpCancelCloseSoon() {
    if (this._tpCloseTimer) { clearTimeout(this._tpCloseTimer); this._tpCloseTimer = null; }
  }

  // ============ 流转页拖拽(指针事件:鼠标 / 触屏统一) ============
  // 为什么不用原生 HTML5 drag:Shadow DOM + 触屏下 dragover 命中不稳定,且幽灵
  // 样式无法完全自控。这里用 pointerdown/move/up + 自建幽灵,滚动手感与落点判定可测。
  _tpPointerDown(e, p) {
    if (!this._ui.transferOpen || this._ui.transferBusy) return;
    // 已有拖拽在跑(第二根手指/鼠标与触屏混用):忽略,否则会覆盖 _tpDrag 并泄漏监听。
    if (this._tpDrag) return;
    if (typeof e.button === "number" && e.button !== 0) return;
    this._tpCancelCloseSoon(); // 开始新操作:撤销成功后排的自动关页
    // 这里**不能** preventDefault:取消 pointerdown 会抑制触屏后续补发的 click,
    // 而「单击切目标」与群组 +/− 都挂在 click 上。滚动/选中已由 .tp-ring 的
    // touch-action:none + user-select:none 挡住,无需再动默认行为。
    if (e.stopPropagation) e.stopPropagation();
    this._tpDrag = {
      src: p, srcEl: e.currentTarget,
      // 交互元素已缩到圆框(.tp-ring),但「被拖走的那一格」要整格变淡,所以单独记 peer 节点。
      peerEl: (e.currentTarget && e.currentTarget.closest)
        ? (e.currentTarget.closest(".tp-peer") || e.currentTarget) : e.currentTarget,
      pointerId: e.pointerId,
      x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, active: false,
    };
    // 指针捕获 + blur 兜底:指针拖到窗口外/切走再松开时仍能收到 pointerup,
    // 否则 _tpDrag 永远不清,后续拖拽全被 2456 的守卫挡死、自动滚动也会一直跑。
    try {
      if (e.currentTarget && e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    } catch (_e) {}
    this._tpLostHandler = (ev) => {
      if (this._tpDrag && ev.pointerId === this._tpDrag.pointerId) this._tpEndDrag();
    };
    try {
      if (e.currentTarget) e.currentTarget.addEventListener("lostpointercapture", this._tpLostHandler);
    } catch (_e) {}
    this._tpBlurHandler = () => { if (this._tpDrag) this._tpEndDrag(); };
    window.addEventListener("blur", this._tpBlurHandler);
    this._tpMoveHandler = (ev) => this._tpPointerMove(ev);
    this._tpUpHandler = (ev) => this._tpPointerUp(ev);
    this._tpCancelHandler = (ev) => this._tpPointerCancel(ev);
    window.addEventListener("pointermove", this._tpMoveHandler, { passive: false });
    window.addEventListener("pointerup", this._tpUpHandler);
    window.addEventListener("pointercancel", this._tpCancelHandler);
  }

  _tpPointerMove(ev) {
    const d = this._tpDrag;
    if (!d || ev.pointerId !== d.pointerId) return;
    if (!d.active) {
      if (Math.hypot(ev.clientX - d.startX, ev.clientY - d.startY) < TP_DRAG_THRESHOLD) return;
      d.active = true;
      this._tpStartGhost(d);
      const panel = this.shadowRoot && this.shadowRoot.querySelector(".panel.transfer");
      if (panel) panel.classList.add("dragging");
      if (d.peerEl) d.peerEl.classList.add("drag-src");
      this._tpFlash("", false); // 拖拽期间清掉上一条提示,避免遮挡落点
      this._tpEnsureAutoScrollLoop();
    }
    if (ev.cancelable) ev.preventDefault();
    d.x = ev.clientX;
    d.y = ev.clientY;
    this._tpMoveGhost(d.x, d.y);
    this._tpUpdateHover(d.x, d.y);
  }

  _tpPointerUp(ev) {
    const d = this._tpDrag;
    if (!d || ev.pointerId !== d.pointerId) return;
    const active = d.active;
    const src = d.src;
    const overPeerId = this._tpOverPeerId;
    const overTrash = this._tpOverTrash;
    this._tpEndDrag();
    if (!active) return; // 没超过阈值 = 普通单击,交给 click 处理
    this._tpSuppressClickUntil = Date.now() + 500;
    if (overTrash) { this._tpDestroy(src); return; }
    if (overPeerId && overPeerId !== src.peerId) {
      const to = (this._ui.peers || []).find((p) => p.peerId === overPeerId);
      if (to) this._tpTransfer(src, to);
    }
  }

  _tpPointerCancel(ev) {
    const d = this._tpDrag;
    if (!d || ev.pointerId !== d.pointerId) return;
    this._tpEndDrag();
  }

  _tpEndDrag() {
    if (this._tpMoveHandler) { window.removeEventListener("pointermove", this._tpMoveHandler); this._tpMoveHandler = null; }
    if (this._tpUpHandler) { window.removeEventListener("pointerup", this._tpUpHandler); this._tpUpHandler = null; }
    if (this._tpCancelHandler) { window.removeEventListener("pointercancel", this._tpCancelHandler); this._tpCancelHandler = null; }
    if (this._tpBlurHandler) { window.removeEventListener("blur", this._tpBlurHandler); this._tpBlurHandler = null; }
    if (this._tpLostHandler) {
      const el = this._tpDrag && this._tpDrag.srcEl;
      if (el) { try { el.removeEventListener("lostpointercapture", this._tpLostHandler); } catch (_e) {} }
      this._tpLostHandler = null;
    }
    if (this._tpAutoRAF) {
      // 用排程时一并留下的取消函数:rAF 与 setTimeout 兜底不是同一对全局函数,
      // 混用会留下一个永不停止的回调。
      if (typeof this._tpCancelRAF === "function") { try { this._tpCancelRAF(); } catch (_e) {} }
      else if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(this._tpAutoRAF);
      this._tpAutoRAF = null;
    }
    this._tpCancelRAF = null;
    this._tpLastRAFAt = null;
    if (this._tpGhostEl) { this._tpGhostEl.remove(); this._tpGhostEl = null; }
    const sr = this.shadowRoot;
    if (sr) {
      const panel = sr.querySelector(".panel.transfer");
      if (panel) panel.classList.remove("dragging");
      const drop = sr.querySelector(".tp-peer.drop");
      if (drop) drop.classList.remove("drop");
      const trash = sr.querySelector(".tp-trash.over");
      if (trash) trash.classList.remove("over");
      const srcPeerEl = this._tpDrag && this._tpDrag.peerEl;
      if (srcPeerEl) srcPeerEl.classList.remove("drag-src");
    }
    this._tpDrag = null;
    this._tpOverPeerId = null;
    this._tpOverTrash = false;
    this.requestUpdate();
  }

  // 幽灵 = 被拖圆的视觉副本:position:fixed 跟指针,pointer-events:none
  // (否则 elementFromPoint 永远命中幽灵,落点判定全失效)。
  _tpStartGhost(d) {
    const sr = this.shadowRoot;
    if (!sr || !d || !d.srcEl) return;
    const el = document.createElement("div");
    el.className = "tp-ghost";
    const ring = document.createElement("div");
    ring.className = "tp-ring";
    const cover = document.createElement("div");
    cover.className = "tp-cover";
    const srcImg = d.srcEl.querySelector(".tp-cover img");
    const srcIcon = d.srcEl.querySelector(".tp-fallback");
    if (srcImg && srcImg.getAttribute("src")) {
      const img = document.createElement("img");
      img.src = srcImg.getAttribute("src");
      img.alt = "";
      cover.appendChild(img);
    } else if (srcIcon && srcIcon.firstElementChild) {
      cover.appendChild(srcIcon.firstElementChild.cloneNode(true));
    }
    ring.appendChild(cover);
    const name = document.createElement("div");
    name.className = "tp-name";
    name.textContent = this._peerLabel(d.src);
    el.appendChild(ring);
    el.appendChild(name);
    sr.appendChild(el);
    this._tpGhostEl = el;
    this._tpMoveGhost(d.x, d.y);
  }

  _tpMoveGhost(x, y) {
    if (!this._tpGhostEl) return;
    this._tpGhostEl.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  }

  // 落点命中:用 ShadowRoot.elementFromPoint(全局 elementFromPoint 在 Shadow DOM
  // 里只返回宿主节点,拿不到内部圆)。幽灵 pointer-events:none 不会抢命中。
  _tpUpdateHover(x, y) {
    const sr = this.shadowRoot;
    if (!sr || typeof sr.elementFromPoint !== "function") return;
    const el = sr.elementFromPoint(x, y);
    // 落点也只认**封面圆框**:拖到名称/在播文字上不算落到该端(与点选口径一致)。
    const ringEl = el && el.closest ? el.closest(".tp-ring") : null;
    const peerEl = ringEl && ringEl.closest ? ringEl.closest(".tp-peer") : null;
    const trashEl = el && el.closest ? el.closest(".tp-trash") : null;
    const d = this._tpDrag;
    let pid = peerEl ? peerEl.getAttribute("data-peer-id") : null;
    // 拖回自己身上不算落点(不能自己流转给自己)。
    if (d && pid === d.src.peerId) pid = null;
    if (pid !== this._tpOverPeerId) {
      sr.querySelectorAll(".tp-peer.drop").forEach((n) => n.classList.remove("drop"));
      if (pid && peerEl) peerEl.classList.add("drop");
      this._tpOverPeerId = pid;
    }
    const overTrash = !!trashEl;
    if (overTrash !== this._tpOverTrash) {
      const t = sr.querySelector(".tp-trash");
      if (t) t.classList.toggle("over", overTrash);
      this._tpOverTrash = overTrash;
    }
  }

  // ============ 边缘自动滚动 ============
  // 热区在滚动视口内部的上/下边缘,不占布局、无可见元素;指针进入即按 rAF 连续滚动,
  // 越靠边越快,离开/到边界自然停。回收站在滚动视口之外 —— 指针进入回收站时
  // _tpHotzoneVector 返回 null,只触发销毁,绝不滚动(B3 互斥)。
  _tpEnsureAutoScrollLoop() {
    if (this._tpAutoRAF) return;
    // 有些测试/嵌入式环境的 requestAnimationFrame 是同步实现(回调里立刻执行),
    // 那样「回调末尾再排下一帧」会无限递归爆栈。先探测一次,同步实现就退化为
    // setTimeout 定时器;真实浏览器仍是 rAF(后台标签页自动降频/暂停)。
    let syncRAF = true;
    if (typeof requestAnimationFrame === "function") {
      let called = false;
      try { requestAnimationFrame(() => { called = true; }); } catch (_e) { called = false; }
      syncRAF = called;
    }
    const raf = syncRAF
      ? (cb) => setTimeout(() => cb(Date.now()), 16)
      : (cb) => requestAnimationFrame(cb);
    const caf = syncRAF ? clearTimeout : (id) => cancelAnimationFrame(id);
    const step = (ts) => {
      this._tpAutoRAF = null;
      if (!this._tpDrag || !this._tpDrag.active || !this._ui.transferOpen) return;
      if (this._tpLastRAFAt == null) this._tpLastRAFAt = ts;
      const dt = Math.max(0, Math.min(80, ts - this._tpLastRAFAt));
      this._tpLastRAFAt = ts;
      if (dt > 0) this._tpAutoScrollTick(dt);
      if (this._tpDrag && this._tpDrag.active) {
        this._tpAutoRAF = raf(step);
      }
    };
    this._tpLastRAFAt = null;
    this._tpAutoRAF = raf(step);
    // 保留取消函数,供 _tpEndDrag 用(不同环境 raf/caf 可能不是一对全局函数)。
    this._tpCancelRAF = () => { try { caf(this._tpAutoRAF); } catch (_e) {} };
  }

  // 热区向量:返回 { dir: -1 上 / 1 下, speed: px/s } 或 null(不在热区/不可滚动)。
  _tpHotzoneVector(sc, x, y) {
    if (!sc || typeof sc.getBoundingClientRect !== "function") return null;
    const rect = sc.getBoundingClientRect();
    if (!rect || !(rect.height > 0)) return null;
    // 视口外(含回收站,它在 .tp-scroll 下缘之外)→ 不滚动
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
    const max = Math.max(0, (sc.scrollHeight || 0) - (sc.clientHeight || 0));
    if (max <= 0) return null; // 没有可滚动空间:热区不生效,避免误滚
    const zone = Math.min(TP_AUTOSCROLL_ZONE, rect.height / 2);
    if (zone <= 0) return null;
    let dir = 0;
    let depth = 0;
    if (y < rect.top + zone) {
      dir = -1;
      depth = 1 - (y - rect.top) / zone; // 0=热区内缘,1=视口外缘
    } else if (y > rect.bottom - zone) {
      dir = 1;
      depth = 1 - (rect.bottom - y) / zone;
    }
    if (!dir) return null;
    depth = Math.max(0, Math.min(1, depth));
    return {
      dir,
      speed: TP_AUTOSCROLL_MIN_SPEED + (TP_AUTOSCROLL_MAX_SPEED - TP_AUTOSCROLL_MIN_SPEED) * depth,
    };
  }

  // 推进一次自动滚动(供 rAF 循环调用;单测直接调用它断言滚动量与边界)。
  _tpAutoScrollTick(dtMs) {
    const d = this._tpDrag;
    if (!d || !d.active) return 0;
    const sc = this.shadowRoot && this.shadowRoot.querySelector(".tp-scroll");
    if (!sc) return 0;
    const v = this._tpHotzoneVector(sc, d.x, d.y);
    if (!v) return 0;
    const max = Math.max(0, (sc.scrollHeight || 0) - (sc.clientHeight || 0));
    if (max <= 0) return 0;
    const before = sc.scrollTop || 0;
    const next = Math.max(0, Math.min(max, before + (v.dir * v.speed * dtMs) / 1000));
    sc.scrollTop = next;
    const moved = next - before;
    // 滚动改变了圆相对指针的位置 ⇒ 落点高亮必须立即重算(否则松手会落到旧目标)。
    if (moved) this._tpUpdateHover(d.x, d.y);
    return moved;
  }

  _closeTransfer() {
    if (!this._ui.transferOpen) return;
    this._tpSession += 1; // 会话作废:关页前发出的异步请求回来后不得再改 UI/busy
    this._tpEndDrag();
    if (this._tpCloseTimer) { clearTimeout(this._tpCloseTimer); this._tpCloseTimer = null; }
    if (this._tpMsgTimer) { clearTimeout(this._tpMsgTimer); this._tpMsgTimer = null; }
    this._ui.transferBusy = false;
    this._ui.transferMsg = "";
    this._ui.transferMsgErr = false;
    this._ui.transferGroupId = null;
    this._transferGroupMembers = new Set();
    this._ui.transferOpen = false;
    this.requestUpdate();
  }

  // 记录按下位置是否落在播放端格子内(含圆、名称、在播文字)。名称/文字已不参与点选与拖拽,
  // 但「从文字上按下、在别处松手」时浏览器补发的 click 目标是两点的共同祖先(.tp-grid),
  // 会被误判成「点空白」而关页 —— 用按下位置兜住,保证从文字上起手不会关页。
  _onTransferPointerDown(e) {
    const path = e.composedPath ? e.composedPath() : [];
    this._tpDownInPeer = path.some((n) => n && n.classList && n.classList.contains("tp-peer"));
  }

  _onTransferClick(e) {
    // 拖拽刚结束时浏览器仍会补发一次 click:它不代表「点空白」,不能关页
    // (含拖进回收站销毁的场景 —— 销毁成功本来就要求留在页面)。
    if (Date.now() < this._tpSuppressClickUntil) return;
    const downInPeer = !!this._tpDownInPeer;
    this._tpDownInPeer = false;
    const path = e.composedPath ? e.composedPath() : [];
    const interactive = path.some((n) => {
      if (!n || !n.classList) return false;
      return n.classList.contains("panel-head") || n.classList.contains("tp-peer") ||
        n.classList.contains("tp-trash") || n.classList.contains("tp-badge") ||
        n.classList.contains("tp-msg") || n.tagName === "BUTTON";
    });
    if (!interactive && !downInPeer) this._closeTransfer();
  }

  // ============ 群组成员键(仅流转页使用) ============

  // 服务端成员命名空间写法:sendspin = `sendspin:<clientId>`(与 peerId 同形);
  // DLNA = 裸设备 id(历史数据约定,去掉 peerId 的 `dlna:` 前缀)。
  // 首页不做成员管理(点群组只切遥控目标),加减成员只在流转页(_tpToggleMember)。
  _memberKeyFor(p) {
    // 已在组内:回传组里存的那条(移除才有效);不在组内:用 peerId 加入
    //(`airplay:<deviceId>` / `sendspin:<clientId>`,与服务端成员候选同口径)。
    return this._groupMemberKey(p) || String(p.peerId || "");
  }


  // 客户端本机实例与 DLNA 设备用不同图标区分,一眼看出是「客户端播放器」还是「设备」。
  _peerIcon(p) {
    if (p.kind === "local") return p.platform === "windows" ? "monitor" : "smartphone";
    return "speaker";
  }
  _peerLabel(p) {
    if (p.name) return p.name;
    if (p.kind === "local") return p.self ? this._t("outputs.selfDevice") : this._t("outputs.client");
    return p.peerId;
  }
  _peerTitle(p) {
    // 被活跃组托管的成员设备:点它实际控的是那个组(见 _resolveControlPeerId),
    // 标题点明,避免「明明点的设备、高亮却跳到组」的疑惑。
    const mg = p && p.managedByGroup
      ? (this._ui.peers || []).find((x) => x.kind === "group" && x.groupId === p.managedByGroup)
      : null;
    const managed = p && p.managedByGroup
      ? ` · ${this._t("outputs.managedBy", { group: (mg && mg.name) || p.managedByGroup })}`
      : "";
    if (p.kind === "local") {
      const base = p.self ? this._t("outputs.selfDevice") : this._t("outputs.client");
      return (p.platform ? `${base} · ${p.platform}` : base) + managed;
    }
    return this._t("outputs.device") + managed;
  }

  // 歌词滚动:视口固定 LYRIC_VIEW_LINES 行高,整条歌词轨道按当前行整体上移,
  // 让当前行始终停在第 LYRIC_CUR_SLOT 槽(即第二行),上方 1 行已唱、下方 2 行待唱。
  _renderLyricBox() {
    const lines = this._ui.lyrics || [];
    if (!lines.length) return html`<div class="lyricbox"></div>`;
    const idx = this._ui.lyricIndex;
    // 极简模式:开头几行从顶部开始(高亮随时间下滑到中段),避免顶部留白;
    // 完整模式:当前行固定在第 2 槽(紧贴标题)。
    const curSlot = this._ui.mini
      ? Math.min(Math.max(0, idx), LYRIC_CUR_SLOT_MINI)
      : LYRIC_CUR_SLOT;
    const shift = (idx - curSlot) * LYRIC_LINE_H;
    return html`
      <div class="lyricbox">
        <div class="lyricbox-track" style="transform: translateY(${-shift}px)">
          ${lines.map((l, i) => html`<div class="lyricbox-line ${i === idx ? "cur" : ""}">${l.text || ""}</div>`)}
        </div>
      </div>`;
  }

  _renderQueue() {
    const q = this._ui.queue || { total: 0, currentIndex: -1 };
    const total = q.total || 0;
    const cur = typeof q.currentIndex === "number" ? q.currentIndex : (this._ui.currentIndex ?? -1);
    // 虚拟滚动窗口:只渲染 [qWinStart, qWinEnd](行高 ROW_STEP 与媒体库一致)。
    // 兜底(2026-10-28):窗口未初始化(qWinEnd<0,典型=WS 全量 items 已入缓存后刚打开
    // 队列页)时按 Q_FIRST_ROWS 渲染首屏;否则 .qlist 里只有一个撑高的 spacer、零行,
    // 用户看到的就是「队列页一片空白」。
    const win = [];
    if (total > 0) {
      const s = (this._ui.qWinStart ?? -1) >= 0 ? Math.max(0, this._ui.qWinStart) : 0;
      const rawEnd = this._ui.qWinEnd ?? -1;
      const e = Math.min(total - 1, Math.max(s, rawEnd >= 0 ? rawEnd : Q_FIRST_ROWS - 1));
      for (let i = s; i <= e; i++) win.push(i);
    }
    return html`
      <div class="panel queue ${this._ui.showQueue ? "open" : ""}">
        <div class="panel-head">
          <span>${this._t("queue.title", { n: total })}</span>
          <button class="mini" @click=${this._clearQueue}>${this._t("control.clear")}</button>
          <button class="mini close" title="${this._t("control.close")}" @click=${(e) => { e.stopPropagation(); this._ui.showQueue = false; this._ui.showBrowser = false; this.requestUpdate(); }}>✕</button>
        </div>
        ${total === 0 ? html`<div class="empty">${this._t("queue.empty")}</div>` : html`
          <div class="qlist" @scroll=${this._qOnScroll}>
            <div class="vs-spacer" style="height:${total * ROW_STEP}px">
              ${win.map((i) => this._qRow(i, cur))}
            </div>
            ${this._qMoreHint()}
          </div>
        `}
      </div>
    `;
  }

  // 队列虚拟滚动行:缓存未到渲染骨架占位;当前行高亮用绝对下标(WS 直接给,无需等数据)。
  // 封面与媒体库同一套 _coverImgTag 占位 + IntersectionObserver 懒加载(_observeQueueCovers)。
  _qRow(i, cur) {
    const it = this._ui.qCache.get(i);
    return html`
      <div class="vs-row" style="top:${i * ROW_STEP}px">
        ${it ? html`
          <div class="qitem ${i === cur ? "cur" : ""}"
            draggable="true"
            @dragstart=${(e) => { e.dataTransfer.setData("text/plain", String(i)); }}
            @dragover=${(e) => e.preventDefault()}
            @drop=${(e) => { e.preventDefault(); const from = Number(e.dataTransfer.getData("text/plain")); this._qReorder(from, i); }}>
            <span class="qcov">${this._coverImgTag(it.coverArt || (it.albumId ? `al-${it.albumId}` : null))}</span>
            <span class="idx">${i + 1}</span>
            <span class="qt">${it.title}</span>
            <span class="qa">${it.artist || ""}</span>
            <button class="mini" title="${this._t("control.jump")}" @click=${() => this._jumpTo(i)}>▶</button>
            <button class="mini" title="${this._t("control.remove")}" @click=${() => this._removeFromQueue(i)}>✕</button>
          </div>
        ` : html`<div class="qitem vs-skel"></div>`}
      </div>`;
  }

  // 底部「加载中」提示(队列分块预取在途时显示)。
  _qMoreHint() {
    if (!this._ui.qLoading || this._ui.qLoading.size === 0) return html``;
    return html`<div class="vs-more">${this._t("common.loading")}</div>`;
  }

  // ============ 队列虚拟滚动 + 窗口化预取 ============
  // 与媒体库同一套哲学:WS 只提供元数据(total/currentIndex/playMode,大队列摘要化),
  // items 按 CHUNK 从 /v1/peers/:peerId/queue?offset=&size= 分块拉取,只渲染视口窗口。
  _qReset() {
    this._ui.qCache = new Map();
    this._ui.qLoaded = new Set();
    this._ui.qLoading = new Set();
    this._ui.qWinStart = 0;
    this._ui.qWinEnd = -1;
    if (this.shadowRoot) {
      const el = this.shadowRoot.querySelector(".qlist");
      if (el) el.scrollTop = 0;
    }
  }

  _qOnScroll(e) {
    const el = e.currentTarget;
    if (this._vsRaf) cancelAnimationFrame(this._vsRaf);
    this._vsRaf = requestAnimationFrame(() => {
      this._vsRaf = 0;
      this._ui.qWinStart = Math.max(0, Math.floor(el.scrollTop / ROW_STEP) - VS_OVERSCAN);
      this._ui.qWinEnd = Math.floor((el.scrollTop + el.clientHeight) / ROW_STEP) + VS_OVERSCAN;
      this._qEnsureLoaded();
      this.requestUpdate();
    });
  }

  // 首次打开时初始化顶部窗口;之后保证 [窗口±overscan] 覆盖的块已加载。
  _qEnsureLoaded() {
    if (!this._ui.showQueue) return;
    const meta = this._ui.queue || { total: 0 };
    const total = meta.total || 0;
    if (total <= 0) return;
    const winUnset = (this._ui.qWinEnd ?? -1) < 0;
    if (!this._ui.qLoaded) this._qReset();
    if ((this._ui.qWinEnd ?? -1) < 0) {
      const el = this.shadowRoot?.querySelector(".qlist");
      const vh = el ? el.clientHeight : 240;
      this._ui.qWinStart = 0;
      this._ui.qWinEnd = Math.floor(vh / ROW_STEP) + VS_OVERSCAN;
    }
    // 窗口刚从「未初始化」算出来时必须主动重渲染:打开队列页的那次 update 已用 -1 渲染过,
    // 若所需块已在缓存(WS 全量 items)就没有任何 fetch 回调来触发下一次 update ⇒ 整页空白。
    // 仅在窗口由未初始化→有值时触发,避免 updated()→_qEnsureLoaded→requestUpdate 死循环。
    if (winUnset) this.requestUpdate();
    // currentIndex 所在块优先(当前行高亮不依赖数据,但行内容要尽快可见)
    const ci = typeof meta.currentIndex === "number" && meta.currentIndex >= 0 ? meta.currentIndex : -1;
    const start = Math.max(0, (this._ui.qWinStart || 0) - VS_OVERSCAN);
    const end = Math.max(0, (this._ui.qWinEnd || 0) + VS_OVERSCAN);
    const need = [];
    if (ci >= 0 && ci < total) need.push(ci);
    for (let i = start; i <= end; i++) need.push(i);
    const seen = new Set();
    for (const i of need) {
      const ci2 = Math.floor(i / CHUNK);
      if (seen.has(ci2) || this._ui.qLoaded.has(ci2) || this._ui.qLoading.has(ci2)) continue;
      seen.add(ci2);
      if (this._vsInflight >= VS_CONCURRENCY) continue;
      this._ui.qLoading.add(ci2);
      this._vsInflight++;
      this._qFetchChunk(ci2).finally(() => {
        this._vsInflight--;
        this._ui.qLoaded.add(ci2);
        this._ui.qLoading.delete(ci2);
        this.requestUpdate();
        this._qEnsureLoaded();
      });
    }
  }

  // 拉取一块队列写入稀疏缓存;total 恒以服务端为准(变更防御)。
  async _qFetchChunk(ci) {
    const pid = this._ui.currentPeerId;
    if (!pid) return;
    const offset = ci * CHUNK;
    try {
      const res = await this._client.getQueue(pid, { offset, size: CHUNK });
      const items = (res && res.items) || [];
      const total = typeof res?.total === "number" ? res.total : undefined;
      if (typeof total === "number" && total >= 0) {
        this._ui.queue = { ...(this._ui.queue || {}), total };
      }
      items.forEach((it, j) => { if (it) this._ui.qCache.set(offset + j, it); });
    } catch (e) {
      err("queue chunk load failed", e);
    }
  }

  // ============ Media library browser ============
  _openBrowser() {
    const u = this._ui;
    // 音量面板打开时,点封面只表示「点外部退出」,不顺带进媒体库(需再点一次)。
    if (u.showVolume) { u.showVolume = false; this.requestUpdate(); return; }
    // 再次点封面 = 收起(与队列按钮一致的可切换行为)。
    if (u.showBrowser) { u.showBrowser = false; this.requestUpdate(); return; }
    u.showBrowser = true;
    u.showQueue = false;
    u.browserStack = [{
      type: "root",
      items: [
        { kind: "cat", cat: "home", name: this._t("browser.home") },
        { kind: "cat", cat: "playlists", name: this._t("browser.playlists") },
        { kind: "cat", cat: "albums", name: this._t("browser.albums") },
        { kind: "cat", cat: "songs", name: this._t("browser.songs") },
        { kind: "cat", cat: "artists", name: this._t("browser.artists") },
        { kind: "cat", cat: "genres", name: this._t("browser.genres") },
      ],
      query: "", loading: false,
    }];
    this.requestUpdate();
  }

  _crumbName(lv) {
    switch (lv.type) {
      case "root": return this._t("browser.library");
      case "home": return this._t("browser.home");
      case "playlists": return this._t("browser.playlists");
      case "playlist": return lv.name || this._t("browser.playlists");
      case "albums": return this._t("browser.albums");
      case "album": return lv.name || this._t("browser.albums");
      case "songs": return this._t("browser.songs");
      case "artists": return this._t("browser.artists");
      case "artist": return lv.name || this._t("browser.artists");
      case "genres": return this._t("browser.genres");
      case "genre": return lv.name || this._t("browser.genres");
      case "starred": return this._t("browser.starred");
      default: return "";
    }
  }

  _toSongItem(s) {
    return {
      kind: "song", id: String(s.id), title: s.title || this._t("common.unknown"),
      artist: s.artist || "", album: s.album || "",
      coverArt: s.coverArt, duration: s.duration || 0, suffix: s.suffix,
    };
  }

  // ============ 全库统一滚动:虚拟滚动 + 窗口化预取 ============
  // 所有库类型(歌曲/专辑/艺术家/风格/歌单列表/歌单内/专辑内/我喜欢的)共用同一套:
  // 后端按 offset/size 服务端分页(内存恒定 1 块),卡片只渲染视口窗口(约一屏+2*OVERSCAN 行),
  // 滚动到未加载区域时按 CHUNK 预取;total 恒取服务端最新值(扫描变更自动收敛)。
  // level 滚动状态:total / vCache(Map idx→item) / vLoaded、vLoading(Set 块号) / vWinStart、vWinEnd。
  async _browserLoad(level, { reset = true } = {}) {
    if (level.loading) return;
    if (level.type === "root") return;
    // 搜索来源默认:所有可搜索库类型(歌单/音乐/艺术家/专辑)默认「聚合」(同时搜本地库
    // 与全部已启用插件的全网结果),其余分类默认「本地」;所有可搜索类型都预取插件列表。
    if (level.srcMode === undefined) level.srcMode = this._levelSearchable(level.type) ? "aggregate" : "local";
    this._loadLevelProviders(level);
    if (reset) this._vsReset(level);
    level.loading = true;
    this.requestUpdate();
    // 初始窗口:列表顶部一屏(打开/搜索后滚动位置在顶)。
    const list = this.shadowRoot?.querySelector(".br-list");
    const vh = list ? list.clientHeight : 240;
    level.vWinStart = 0;
    level.vWinEnd = Math.floor(vh / ROW_STEP) + VS_OVERSCAN;
    await this._vsFetchChunk(level, 0).catch((e) => err("browser load failed", e));
    level.loading = false;
    this.requestUpdate();
    this._vsEnsureLoaded(level);
  }

  _vsReset(level) {
    level.vCache = new Map();
    level.vLoaded = new Set();
    level.vLoading = new Set();
    level.total = 0;
    level.vWinStart = 0;
    level.vWinEnd = -1;
    level.vSeq = (level.vSeq || 0) + 1; // 防乱序令牌:在途的旧分块响应将被丢弃
    if (this.shadowRoot) {
      const el = this.shadowRoot.querySelector(".br-list");
      if (el) el.scrollTop = 0;
    }
  }

  // 滚动(rAF 节流):更新渲染窗口并补齐覆盖到的块。
  _onBrScroll(e) {
    const el = e.currentTarget;
    const level = this._ui.browserStack[this._ui.browserStack.length - 1];
    if (!level || level.type === "root") return;
    if (this._vsRaf) cancelAnimationFrame(this._vsRaf);
    this._vsRaf = requestAnimationFrame(() => {
      this._vsRaf = 0;
      level.vWinStart = Math.max(0, Math.floor(el.scrollTop / ROW_STEP) - VS_OVERSCAN);
      level.vWinEnd = Math.floor((el.scrollTop + el.clientHeight) / ROW_STEP) + VS_OVERSCAN;
      this._vsEnsureLoaded(level);
      this.requestUpdate();
    });
  }

  // 保证 [窗口±overscan] 覆盖的块都已加载(在途并发 ≤ VS_CONCURRENCY,块到达后继续)。
  _vsEnsureLoaded(level) {
    if (!level || level.type === "root" || !level.vLoaded) return;
    // 每次同步窗口后先做一次剪枝,保证 vCache / vLoaded 严格上界(不随浏览量增长)。
    this._vsPrune(level);
    const start = Math.max(0, (level.vWinStart || 0) - VS_OVERSCAN);
    const end = Math.max(0, (level.vWinEnd || 0) + VS_OVERSCAN);
    const firstChunk = Math.floor(start / CHUNK);
    const lastChunk = Math.floor(end / CHUNK);
    for (let ci = firstChunk; ci <= lastChunk; ci++) {
      if (level.vLoaded.has(ci) || level.vLoading.has(ci)) continue;
      if (this._vsInflight >= VS_CONCURRENCY) return;
      level.vLoading.add(ci);
      this._vsInflight++;
      this._vsFetchChunk(level, ci).finally(() => {
        this._vsInflight--;
        level.vLoading.delete(ci);
        this.requestUpdate();
        this._vsEnsureLoaded(level);
      });
    }
  }

  // 剪枝:把数据缓存收窄到 [窗口 ±(overscan+1 块)] 内,窗口外的整块行与「已加载」标记一并删除。
  // 作用:内存占用恒为「当前窗口 + 上下各 1 块」量级,不随滚动浏览过的条目数增长(回退到已剪掉的
  // 区域时按块重新拉一次,开销可忽略);回退到保留区(±1 块 ≈ 3~4 屏)内时直接复用缓存,避免抖拉。
  // 注意:vCache 与 vLoaded 按块(ci = idx / CHUNK)对齐剪;在途的 vLoading 块不在此打断,块到达后
  // 由下一次 _vsEnsureLoaded 的自然剪枝收敛,避免「边拉边删」导致整块残留在缓存里不释放。
  _vsPrune(level) {
    const ws = level.vWinStart || 0, we = level.vWinEnd || 0;
    const firstKeepChunk = Math.floor(Math.max(0, ws - (VS_OVERSCAN + CHUNK)) / CHUNK);
    const lastKeepChunk = Math.floor((we + (VS_OVERSCAN + CHUNK)) / CHUNK);
    if (level.vCache && level.vCache.size) {
      for (const absIdx of level.vCache.keys()) {
        const ci = Math.floor(absIdx / CHUNK);
        if (ci < firstKeepChunk || ci > lastKeepChunk) level.vCache.delete(absIdx);
      }
    }
    if (level.vLoaded && level.vLoaded.size) {
      for (const ci of level.vLoaded) {
        if (ci < firstKeepChunk || ci > lastKeepChunk) level.vLoaded.delete(ci);
      }
    }
  }

  // 拉取一块(offset=ci*CHUNK,size=CHUNK)写入稀疏缓存;total 恒以服务端为准(变更防御)。
  // vSeq 令牌:实时搜索快速输入时旧请求晚返回,seq 不匹配即丢弃(不写缓存/不改 total/不标 loaded)。
  async _vsFetchChunk(level, ci) {
    const seq = level.vSeq || 0;
    const offset = ci * CHUNK;
    try {
      const { items, total } = await this._fetchBrowseRange(level, offset, CHUNK);
      if (seq !== (level.vSeq || 0)) return; // 已发起新查询,丢弃过期响应
      if (typeof total === "number" && total >= 0) level.total = total;
      items.forEach((it, j) => { if (it) level.vCache.set(offset + j, it); });
      level.vLoaded.add(ci);
    } catch (e) {
      err("browser chunk load failed", e);
    }
  }

  // 统一取数:按类型走 V2 或 Subsonic 端点(全部服务端分页,返回 {items,total})。
  async _fetchBrowseRange(level, offset, size) {
    const q = (level.query || "").trim();
    const page = Math.floor(offset / size) + 1; // V2 端点 1-based page
    // 「插件」搜索模式:走远程搜索端点(一次拉全,内存切片);本地模式走原有分支
    const srcMode = level.srcMode || "local";
    // 「聚合」模式(仅歌单):本地按 query 过滤 + 全部已启用插件全网歌单合并成一股
    if (srcMode === "aggregate") {
      return this._fetchAggregateRange(level, offset, size);
    }
    if (srcMode !== "local") {
      return this._fetchRemoteRange(level, offset, size, srcMode);
    }
    switch (level.type) {
      case "home": {
        // 首页推荐:与 Web 首页同源、能力驱动(每日推荐/本地推荐/随机补齐 + 各平台精选)。
        // 条目数 ≤ homeCount+平台歌单,一次拉齐,不做服务端分页。
        const { items, total } = await this._fetchHomeItems(level);
        return { items, total };
      }
      case "songs": {
        const res = await this._client.getSongsV2({ page, pageSize: size, query: q });
        return { items: this._mapBrowseItems("songs", res?.items), total: res?.total };
      }
      case "albums": {
        const res = await this._client.getAlbumsV2({ page, pageSize: size, query: q });
        return { items: this._mapBrowseItems("albums", res?.items), total: res?.total };
      }
      case "artists": {
        const res = await this._client.getArtistsV2({ page, pageSize: size, query: q });
        return { items: this._mapBrowseItems("artists", res?.items), total: res?.total };
      }
      case "genres": {
        const res = await this._client.getGenresV2({ page, pageSize: size, query: q });
        return { items: this._mapBrowseItems("genres", res?.items), total: res?.total };
      }
      case "genre": { // 风格内 = 该风格全部歌曲(V2 支持 genre 过滤)
        const res = await this._client.getSongsV2({ page, pageSize: size, genre: level.name || "" });
        return { items: this._mapBrowseItems("songs", res?.items), total: res?.total };
      }
      case "starred": {
        const res = await this._client.getStarred({ offset, size, query: q });
        return { items: (res?.starred2?.song || []).map((s) => this._toSongItem(s)), total: res?.starred2?.songTotal };
      }
      case "album": {
        // 远程专辑详情(搜索结果进入):只拉不导入,歌曲带 _remote 可播放/加入库
        if (level._remote) return this._fetchRemoteLevelSongs(level, "album", offset, size);
        const res = await this._client.getAlbum(level.id, { offset, size });
        return { items: (res?.album?.song || []).map((s) => this._toSongItem(s)), total: res?.album?.songTotal };
      }
      case "playlist": {
        if (level._remote) return this._fetchRemoteLevelSongs(level, "playlist", offset, size);
        const res = await this._client.getPlaylistSongs(level.id, { offset, size });
        return { items: (res?.playlist?.entry || []).map((s) => this._toSongItem(s)), total: res?.playlist?.songTotal };
      }
      case "playlists": {
        const res = await this._client.getPlaylists({ offset, size, query: q });
        const arr = res?.playlists?.playlist || res?.playlists || [];
        return {
          items: arr.map((p) => ({ kind: "playlist", id: String(p.id), name: p.name || this._t("common.unnamedPlaylist"), coverArt: p.coverArt, songCount: p.songCount })),
          total: res?.playlists?.total ?? arr.length,
        };
      }
      case "artist": { // 艺术家内 = 其全部专辑(单艺术家专辑数有限,一次取回后内存切片)
        if (level._remote) return this._fetchRemoteLevelSongs(level, "artist", offset, size);
        const res = await this._client.getArtist(level.id);
        const albums = res?.artist?.album || [];
        const slice = albums.slice(offset, offset + size).map((a) => ({
          kind: "album", id: String(a.id), name: a.name || this._t("common.unknownAlbum"), artist: a.artist || "", coverArt: a.coverArt,
        }));
        return { items: slice, total: albums.length };
      }
      default:
        return { items: [], total: 0 };
    }
  }

  // 服务端分页类型把后端 items 映射成本地浏览项
  _mapBrowseItems(type, items) {
    if (type === "songs") return (items || []).map((s) => this._toSongItem(s));
    if (type === "albums") return (items || []).map((a) => ({
      kind: "album", id: String(a.id), name: a.name || this._t("common.unknownAlbum"),
      artist: a.artist || "", coverArt: a.coverArt, songCount: a.songCount,
    }));
    if (type === "artists") return (items || []).map((a) => ({
      kind: "artist", id: String(a.id), name: a.name || this._t("common.unknownArtist"), coverArt: a.coverArt,
    }));
    if (type === "genres") return (items || []).map((g) => ({
      kind: "genre", id: g.id, name: g.name, songCount: g.songCount, albumCount: g.albumCount,
    }));
    return items || [];
  }

  // 首页推荐数据:与 Web 首页同源(能力驱动,不写死插件名)。两阶段返回:
  // - 阶段一(快):歌单 / 固定卡计数 / 固定卡三路请求先回,顶部固定卡 + 侧栏随机立即渲染;
  // - 阶段二(慢):平台精选 / 本地随机两路请求(冷启动可能 2.5s+)到达后,把两个分区
  //   追加到同一列表尾,再复用虚拟滚动「失效首块 + 重载」就地补齐,不整页重载、不白屏。
  // 最终聚合顺序/字段与旧版逐字节一致:固定卡 → 侧栏随机 → 平台精选分区 → 本地随机分区。
  async _fetchHomeItems(level) {
    const seq = level ? (level.vSeq || 0) : 0;
    // 令牌命中:该 level 已完成两阶段聚合(seq 对齐),直接返回内存完整列表,重载零网络。
    if (level && level._homeAll && level._homeAllSeq === seq) {
      return { items: level._homeAll, total: level._homeAll.length };
    }
    // 阶段一同序号复用:慢半拍在途时若再次取块(如窗口回退重拉),避免重复快请求,
    // 也保证侧栏「随机」只在同一序号下随机一次(两次调用取到同一批歌单,最终列表不抖)。
    if (level && level._homeStage1 && level._homeStage1Seq === seq) {
      return { items: level._homeStage1, total: level._homeStage1.length };
    }
    const [plRes, cntRes, cardRes] = await Promise.all([
      this._client.getPlaylistsV2({ page: 1, pageSize: 200 }).catch(() => null),
      this._client.getHomePlaylistCount().catch(() => null),
      this._client.getHomeCards().catch(() => null),
    ]);
    const pls = plRes?.items || [];
    let homeCount = 8;
    const n = parseInt(String(cntRes?.count), 10);
    if (Number.isFinite(n) && n >= 1 && n <= 24) homeCount = n;
    // 固定卡:后端已按位次排序;前端保持 >30 首门槛,只展示有内容的卡。
    // 旧版后端无 home-cards 端点时回落「今日漫游」名匹配(兼容 v1.7.21 及更早)。
    let cards = (cardRes?.cards || []).filter((c) => (c.songCount || 0) > 30);
    if (!cardRes || !Array.isArray(cardRes.cards)) {
      const legacy = pls.find((p) => p.name === "今日漫游" && (p.songCount || 0) > 30) || null;
      if (legacy) cards = [{ playlistId: legacy.id, playlistName: legacy.name, coverArt: legacy.coverArt, songCount: legacy.songCount, isCombo: true }];
    }
    const fixedIds = new Set(cards.map((c) => c.playlistId));
    const pool = pls.filter((p) => !fixedIds.has(p.id) && (p.songCount || 0) >= 30);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const side = shuffled.slice(0, Math.max(0, homeCount - fixedIds.size));
    const items = [];
    cards.forEach((c) => this._pushHomePlaylist(items, c.playlistId, c.playlistName || c.name, c.coverArt, c.songCount, c.isCombo ? this._t("browser.todayMix") : (c.playlistName || c.name)));
    side.forEach((p) => this._pushHomePlaylist(items, p.id, p.name, p.coverArt, p.songCount, ""));
    if (level) { level._homeStage1 = items; level._homeStage1Seq = seq; }
    // 阶段二:同一 seq 只补一次慢请求;到达后合并 + 失效重载。期间若 level 被重置/刷新/搜索
    // (vSeq 变化)则整段丢弃,绝不覆盖更新的状态(复用 _vsReset 的序号令牌纪律)。
    if (level && level._homeSlowSeq !== seq) {
      level._homeSlowSeq = seq;
      Promise.all([
        this._client.getRecommend().catch(() => null),
        this._client.getLocalRecommend().catch(() => null),
      ]).then(([recRes, lcRes]) => {
        if (seq !== (level.vSeq || 0)) return;
        const full = items.slice();
        this._appendHomeSections(full, recRes, lcRes);
        level._homeAll = full;
        level._homeAllSeq = level.vSeq || 0;
        // 复用虚拟滚动「失效 + 重载」:作废首块(缓存条目仍在,故顶部不闪),
        // 再用内存完整列表重新落盘,并按窗口补齐渲染。
        if (level.vLoaded) level.vLoaded.delete(0);
        level.total = full.length;
        this._vsFetchChunk(level, 0).finally(() => {
          if (seq !== (level.vSeq || 0)) return;
          this._vsEnsureLoaded(level);
          this.requestUpdate();
        });
      });
    }
    return { items, total: items.length };
  }

  // 首页推荐:固定卡 / 侧栏随机 / 本地随机 共用的歌单行(字段与旧版 pushPl 逐字节一致)。
  _pushHomePlaylist(items, id, name, coverArt, songCount, badge) {
    items.push({
      kind: "playlist", id: String(id), name: name || this._t("common.unnamedPlaylist"),
      coverArt, songCount: songCount || 0, badge,
    });
  }

  // 阶段二分区:各平台精选(recommend 插件 channels)+ 本地随机(/v1/local-recommend channels)。
  // 追加到 items 尾部,顺序与字段与旧版一致(精选在前、本地随机在后)。
  _appendHomeSections(items, recRes, lcRes) {
    // 各平台精选分区:channels → 分区头 + 远程歌单行(直接整播=先导入再播,与 Web playRemotePl 同流程)。
    const channels = recRes?.channels || [];
    const providerId = recRes?.providerId || "";
    for (const ch of channels) {
      const chPls = ch.playlists || [];
      if (!chPls.length) continue;
      items.push({ kind: "section", name: `${(ch.name || ch.source || "").replace(/音乐$/, "")}${this._t("browser.featured")}`, count: chPls.length });
      chPls.forEach((pl) => items.push({
        kind: "remote", id: String(pl.id), name: pl.name || this._t("common.unnamedPlaylist"),
        coverUrl: pl.cover || "", source: pl.source || ch.source || "",
        trackCount: pl.trackCount || "", creator: pl.creator || "", link: pl.link || "",
        providerId,
      }));
    }
    // 本地随机(按平台):后端 /v1/local-recommend 提供,本地库已入库歌单按平台分组随机,
    // 每次刷新不同。与 Web 前端「本地随机」一致:kind=playlist 直接打开本地歌单,无需导入。
    const lcChannels = lcRes?.channels || [];
    for (const ch of lcChannels) {
      const chPls = ch.playlists || [];
      if (!chPls.length) continue;
      // 分区标题优先用后端透传的 subtag(如「每日更新」),缺省回落「本地随机」;
      // 副标题用 tagline(说明性文案),缺省显示歌单数量「N 张」(与「精选」分区一致)。
      const base = (ch.name || ch.source || "").replace(/音乐$/, "");
      items.push({
        kind: "section",
        name: `${base}·${ch.subtag || this._t("browser.localRandom")}`,
        tagline: typeof ch.tagline === "string" && ch.tagline ? ch.tagline : null,
        count: chPls.length,
        _local: true,
      });
      chPls.forEach((pl) => this._pushHomePlaylist(items, pl.id, pl.name, pl.coverArt, pl.songCount, ""));
    }
  }

  _browserPush(level) {
    this._ui.browserStack.push(level);
    this._browserLoad(level);
  }

  // 首页推荐手动刷新:先触发后端重新随机生成(每日推荐/本地推荐/今日漫游),
  // 再重置虚拟滚动缓存重新拉取。
  async _browserRefreshHome() {
    const level = this._ui.browserStack[this._ui.browserStack.length - 1];
    if (!level || level.type !== "home" || this._ui.homeRefreshing) return;
    this._ui.homeRefreshing = true;
    this.requestUpdate();
    try {
      await this._client.refreshRecommend().catch((e) => { err("refresh recommend failed", e); });
      this._vsReset(level); // 清 vCache/vLoaded,total=0 → 重新按块拉取
      await this._vsFetchChunk(level, 0).catch((e) => err("refresh home failed", e));
      this._vsEnsureLoaded(level);
      this.requestUpdate();
    } finally {
      this._ui.homeRefreshing = false;
      this.requestUpdate();
    }
  }

  _browserPopTo(index) {
    while (this._ui.browserStack.length > index + 1) this._ui.browserStack.pop();
    this.requestUpdate();
  }

  // 实时搜索:输入停顿 300ms 自动触发(防抖,避免每键一次请求)。
  // 中文输入法组字期间(compositionstart..end)暂停,只有选字上屏后才搜,避免搜到拼音。
  // 清空输入框立即回全库(不等待防抖)。防乱序由 _vsReset 的 vSeq 令牌保证。
  _browserSearchInput() {
    clearTimeout(this._searchTimer);
    if (this._searchComposing) return;
    const level = this._ui.browserStack[this._ui.browserStack.length - 1];
    if (!level || level.type === "root") return;
    const q = (level.query || "").trim();
    this._searchTimer = setTimeout(() => this._browserSearch(), q ? 300 : 0);
  }

  _browserSearch() {
    const level = this._ui.browserStack[this._ui.browserStack.length - 1];
    if (!level || level.type === "root") return;
    // 服务端搜索(query 随 _fetchBrowseRange 下发)+ 重置到顶部重新分块,不一次性拉全库。
    this._vsReset(level);
    this._browserLoad(level, { reset: false });
  }

  _browserItemClick(item) {
    if (!item) return;
    if (item.kind === "cat") {
      const map = { home: "home", playlists: "playlists", albums: "albums", songs: "songs", artists: "artists", genres: "genres" };
      this._browserPush({ type: map[item.cat], items: [], query: "", loading: false });
    } else if (item.kind === "playlist") {
      this._browserPush({ type: "playlist", id: item.id, name: item.name, _remote: item._remote, _provider: item._provider, source: item.source, items: [], query: "", loading: false });
    } else if (item.kind === "album") {
      this._browserPush({ type: "album", id: item.id, name: item.name, _remote: item._remote, _provider: item._provider, source: item.source, items: [], query: "", loading: false });
    } else if (item.kind === "artist") {
      this._browserPush({ type: "artist", id: item.id, name: item.name, _remote: item._remote, _provider: item._provider, source: item.source, items: [], query: "", loading: false });
    } else if (item.kind === "genre") {
      this._browserPush({ type: "genre", id: item.id, name: item.name, items: [], query: "", loading: false });
    } else if (item.kind === "song") {
      // 远程歌曲走 _browserPlaySong(先导入拿 DB songId 再播);本地歌直接追加
      this._browserPlaySong(item);
    }
  }

  _browserPlaySong(song) {
    // 远程(未入库)歌曲:先「加入库」拿真实 DB songId,再入队播放(DLNA peer 需要 DB id)。
    if (song && song._remote) { this._remotePlaySong(song); return; }
    this._appendAndPlay(song);
  }

  // ============ 远程搜索(媒体库「本地/插件」切换) ============
  _levelKind(type) {
    if (type === "playlists") return "playlist";
    if (type === "albums") return "album";
    if (type === "artists") return "artist";
    if (type === "songs") return "song";
    return "";
  }

  // 搜索来源切换器只对可远程搜索的库类型显示
  _levelSearchable(type) { return !!this._levelKind(type); }

  async _loadLevelProviders(level) {
    const kind = this._levelKind(level.type);
    if (!kind || level.providersLoaded) return;
    level.providersLoaded = true;
    try {
      const res = await this._client.getSearchProviders(kind);
      level.providers = (res && res.providers) || [];
      this.requestUpdate();
    } catch (e) {
      err("load search providers failed", e);
    }
  }

  // 切换「本地/插件」:重置远程缓存并重搜(本地模式走原服务端搜索)
  _onSrcModeChange(level, mode) {
    if ((level.srcMode || "local") === mode) return;
    level.srcMode = mode;
    level._remoteAll = undefined;
    level._aggregateAll = undefined; // 来源变化:丢弃聚合缓存,交给 _browserSearch 按新来源重搜
    this._browserSearch();
  }

  // 远程搜索结果 → 本地浏览项(带 _remote/_raw/_provider 标记;封面为远程 URL)
  _mapRemoteItem(kind, it, providerId) {
    const base = {
      _remote: true, _raw: it, _provider: providerId,
      source: it.source || "", platformLabel: it.platformLabel || "",
    };
    if (kind === "song") {
      return { ...base, kind: "song", id: String(it.id), title: it.name || this._t("common.unknown"),
        artist: it.artist || "", album: it.album || "", duration: it.duration || 0, coverArt: it.cover || "" };
    }
    if (kind === "album") {
      return { ...base, kind: "album", id: String(it.id), name: it.name || this._t("common.unknownAlbum"),
        artist: it.artist || "", coverArt: it.cover || "", songCount: it.trackCount || 0 };
    }
    if (kind === "artist") {
      return { ...base, kind: "artist", id: String(it.id), name: it.name || this._t("common.unknownArtist"),
        coverArt: it.avatar || it.cover || "", albumCount: it.albumCount, songCount: it.songCount };
    }
    return { ...base, kind: "playlist", id: String(it.id), name: it.name || this._t("common.unnamedPlaylist"),
      coverArt: it.cover || "", songCount: it.trackCount || 0, creator: it.creator || "" };
  }

  // 远程搜索取数(一次拉全,内存切片交给虚拟滚动);query 变化自动重拉
  async _fetchRemoteRange(level, offset, size, providerId) {
    const kind = this._levelKind(level.type);
    const q = (level.query || "").trim();
    if (!kind || !q) return { items: [], total: 0 };
    if (!level._remoteAll || level._remoteQuery !== q) {
      const res = await this._client.remoteSearch(kind, providerId, q);
      level._remoteAll = ((res && res.items) || []).map((it) => this._mapRemoteItem(kind, it, providerId));
      level._remoteQuery = q;
    }
    const all = level._remoteAll;
    return { items: all.slice(offset, offset + size), total: all.length };
  }

  // 聚合取数(歌单/音乐/艺术家/专辑):本地(按 query 过滤)置前,再接入全部已启用插件的
  // 全网结果(query 为空跳过远程)。一次拉全后内存切片(聚合结果量级小,内存恒定)。
  async _fetchAggregateRange(level, offset, size) {
    const kind = this._levelKind(level.type);
    const q = (level.query || "").trim();
    if (!kind) return { items: [], total: 0 };
    if (!level._aggregateAll || level._aggregateQuery !== q) {
      // 本地结果:query 命中本地库(subsonic/V2 服务端过滤,一次取回;q 为空取前 500)。
      let localList = [];
      if (kind === "playlist") {
        const localRes = await this._client.getPlaylists({ offset: 0, size: 500, query: q }).catch(() => null);
        const localRaw = localRes?.playlists?.playlist || localRes?.playlists || [];
        localList = localRaw.map((p) => ({
          kind: "playlist", id: String(p.id), name: p.name || this._t("common.unnamedPlaylist"),
          coverArt: p.coverArt, songCount: p.songCount,
        }));
      } else {
        const type = kind === "song" ? "songs" : kind === "album" ? "albums" : "artists";
        const res = kind === "song"
          ? await this._client.getSongsV2({ page: 1, pageSize: 500, query: q }).catch(() => null)
          : kind === "album"
            ? await this._client.getAlbumsV2({ page: 1, pageSize: 500, query: q }).catch(() => null)
            : await this._client.getArtistsV2({ page: 1, pageSize: 500, query: q }).catch(() => null);
        localList = this._mapBrowseItems(type, res?.items);
      }
      // 远程:query 非空才并发搜全部已启用插件的全网结果。
      // 歌单聚合端点返回 playlists,实体(song/album/artist)聚合端点返回 items——必须按类走对方法,否则取空。
      let remoteList = [];
      if (q) {
        if (kind === "playlist") {
          const agg = await this._client.aggregatePlaylistSearch(q).catch(() => ({ playlists: [] }));
          remoteList = ((agg && agg.playlists) || []).map((it) => this._mapRemoteItem("playlist", it, it.providerId || ""));
        } else {
          const agg = await this._client.aggregateEntitySearch(kind, q).catch(() => ({ items: [] }));
          remoteList = ((agg && agg.items) || []).map((it) => this._mapRemoteItem(kind, it, it.providerId || ""));
        }
      }
      level._aggregateAll = [...localList, ...remoteList];
      level._aggregateQuery = q;
    }
    const all = level._aggregateAll;
    return { items: all.slice(offset, offset + size), total: all.length };
  }

  // 远程集合详情层取数(专辑/歌单/艺术家内歌曲,只拉不导入)
  async _fetchRemoteLevelSongs(level, kind, offset, size) {
    if (!level._remoteAll || level._remoteSeq !== (level.vSeq || 0)) {
      const res = await this._client.remoteItems(kind, level._provider, {
        source: level.source || "", id: level.id || "", name: level.name || "",
      });
      level._remoteAll = ((res && res.items) || []).map((it) => this._mapRemoteItem("song", it, level._provider));
      level._remoteSeq = level.vSeq || 0;
    }
    const all = level._remoteAll;
    return { items: all.slice(offset, offset + size), total: all.length };
  }

  // 远程歌曲播放:先导入拿 DB songId,再入队跳播(与首页 remote 歌单「先导入再整播」同思路)
  async _remotePlaySong(item) {
    const pid = this._ui.currentPeerId;
    if (!pid || !item) return;
    if (this._ui.remoteBusy) return;
    this._ui.remoteBusy = item.id;
    this.requestUpdate();
    try {
      const imp = await this._client.importRemoteSongs(item._provider, [item._raw]);
      const task = await this._client.waitTask(imp.taskId);
      const ids = (task && task.ids) || [];
      if (!ids.length) { err("remote song import returned no ids"); return; }
      await this._appendAndPlay({
        id: ids[0], title: item.title || item.name || this._t("common.unknown"),
        artist: item.artist || "", album: item.album || "",
        duration: item.duration || 0, coverArt: item.coverArt || "", suffix: "mp3",
      });
      item._imported = true;
    } catch (e) {
      err("remote play song failed", e);
    } finally {
      this._ui.remoteBusy = null;
      this.requestUpdate();
    }
  }

  // 远程集合整播:专辑/歌单 → 导入为本地歌单拿 playlistId → 拉歌整播;
  // 艺术家 → 远程拉歌 → 批量入库拿 DB songId → 整播。
  async _playRemoteCollection(item) {
    const pid = this._ui.currentPeerId;
    if (!pid || !item) return;
    if (this._ui.remoteBusy) return;
    this._ui.remoteBusy = item.id;
    this.requestUpdate();
    let queueItems = [];
    let serverPlaylistId = null;
    try {
      const kind = item.kind; // album | playlist | artist
      if (kind === "album" || kind === "playlist") {
        const imp = await this._client.importRemoteCollection(kind, item._provider, {
          source: item.source || "", id: item.id, name: item.name || "", cover: item.coverArt || "",
        });
        const task = await this._client.waitTask(imp.taskId);
        const plId = task && task.playlistId;
        if (!plId) { err("remote collection import returned no playlistId"); return; }
        // 导入后已是本地歌单 → 优先走主通道(服务端自己解析,不必拉全量回浏览器)。
        serverPlaylistId = plId;
        const res = await this._client.getPlaylistSongs(plId);
        queueItems = ((res && res.playlist && res.playlist.entry) || [])
          .map((s) => this._toSongItem(s)).map((s) => childToQueueItem(s));
      } else if (kind === "artist") {
        const res = await this._client.remoteItems("artist", item._provider, {
          source: item.source || "", name: item.name || "",
        });
        const songs = ((res && res.items) || []).map((it) => this._mapRemoteItem("song", it, item._provider));
        if (!songs.length) { log("remote artist has no songs"); return; }
        const imp = await this._client.importRemoteSongs(item._provider, songs.map((s) => s._raw));
        const task = await this._client.waitTask(imp.taskId);
        const ids = (task && task.ids) || [];
        queueItems = songs.map((s, i) => childToQueueItem({
          id: ids[i] || s.id, title: s.title, artist: s.artist, album: s.album,
          duration: s.duration || 0, coverArt: "", suffix: "mp3",
        }));
      }
    } catch (e) {
      err("play remote collection failed", e);
      return;
    } finally {
      this._ui.remoteBusy = null;
      this.requestUpdate();
    }
    if (!queueItems.length) { log("remote collection empty"); return; }
    this._ui.isPlaying = true;
    this.requestUpdate();
    // 专辑/歌单导入后已是本地歌单 → 主通道(服务端解析)优于把整份列表推回去。
    // 艺术家分支没有对应的服务端内容 id(是逐曲聚合成的一个临时队列),走整队推送。
    if (serverPlaylistId) {
      try {
        await this._client.playContent(pid, "playlist", serverPlaylistId);
        log("playing remote via server content", item.name);
        return;
      } catch (e) {
        err("playContent failed for remote collection, fallback to playQueue", e);
      }
    }
    this._client.playQueue(pid, queueItems, 0)
      .then(() => log("playing remote", this._collLabel(item), item.name, queueItems.length, "songs"))
      .catch((e) => err("play remote collection failed", e));
  }

  // 「加入库」按钮:歌曲批量入库 / 专辑·歌单整库导入(异步任务轮询);艺术家无导入
  async _browserImportRemote(item) {
    if (!item || item._importing || !item._remote) return;
    if (item.kind === "artist") return;
    item._importing = true;
    this.requestUpdate();
    try {
      if (item.kind === "song") {
        const imp = await this._client.importRemoteSongs(item._provider, [item._raw]);
        await this._client.waitTask(imp.taskId);
      } else {
        const imp = await this._client.importRemoteCollection(item.kind, item._provider, {
          source: item.source || "", id: item.id, name: item.name || "", cover: item.coverArt || "",
        });
        await this._client.waitTask(imp.taskId);
      }
      item._imported = true;
      // 若当前处于本地列表层(歌单/专辑/音乐),刷新以显示新入库内容
      const top = this._ui.browserStack[this._ui.browserStack.length - 1];
      if (top && !(top.srcMode !== "local") && ["playlists", "albums", "songs"].includes(top.type)) {
        this._browserSearch();
      }
    } catch (e) {
      err("remote import failed", e);
    } finally {
      item._importing = false;
      this.requestUpdate();
    }
  }

  _collLabel(it) {
    switch (it.kind) {
      case "playlist": return this._t("browser.collPlaylist");
      case "remote": return this._t("browser.collPlaylist");
      case "album": return this._t("browser.collAlbum");
      case "artist": return this._t("browser.collArtist");
      case "genre": return this._t("browser.collGenre");
      default: return this._t("browser.collList");
    }
  }

  // 点击封面:直接播放整个集合(歌单/专辑/艺人/风格)的全部歌曲,
  // 用集合歌曲替换当前队列并从第 1 首开始播放。
  //
  // 起播走**主通道** `/v1/play`(只传内容类型 + 内容 ID,几百字节):
  // 由服务端自行查库解析队列再投屏,与 Web 前端同源,且享有服务端的多源优选
  // 与换源回退。历史上这里是把浏览器里的整份快照推给 `/queue/play`(数千首
  // 可达数 MB),弱网下极易超时 —— 那正是「大歌单推不动」的根因。
  // 服务端解析不出该内容时(如远程导入的歌单 id 变了),回落到整队推送。
  async _browserPlayCollection(item) {
    const pid = this._ui.currentPeerId;
    if (!pid || !item) return;
    // 远程搜索结果集合(专辑/歌单/艺术家):先导入再整播(未入库,DLNA 需要 DB songId)
    if (item._remote) {
      this._playRemoteCollection(item);
      return;
    }
    // 服务端能自行解析的内容 → 走主通道,不必在浏览器里拉全量。
    let serverType = item.kind;
    let serverId = item.id;
    if (item.kind === "remote") {
      // 首页推荐平台歌单:先导入为本地歌单,再按本地歌单 id 走主通道解析。
      if (!item.providerId) { err("remote playlist missing providerId"); return; }
      const imp = await this._client.importRecommendPlaylist(item.providerId, {
        source: item.source || "", id: item.id, name: item.name || "",
        cover: item.coverUrl || "", creator: item.creator || "",
        trackCount: item.trackCount || "", link: item.link || "",
      }).catch((e) => { err("import remote playlist failed", e); return null; });
      const plId = imp && imp.playlistId;
      if (!plId) { err("import remote playlist returned no playlistId"); return; }
      serverType = "playlist";
      serverId = plId;
    }
    if (CONTENT_PLAY_TYPES.has(serverType) && serverId) {
      this._ui.isPlaying = true;
      this.requestUpdate();
      try {
        await this._client.playContent(pid, serverType, serverId);
        log("playing via server content", serverType, serverId);
        return;
      } catch (e) {
        // 主通道失败(老服务端无 /v1/play、或内容解析不出)→ 回落整队推送
        err("playContent failed, fallback to playQueue", e);
      }
    }
    let songs = [];
    try {
      if (item.kind === "playlist") {
        const res = await this._client.getPlaylistSongs(item.id);
        songs = (res?.playlist?.entry || []).map((s) => this._toSongItem(s));
      } else if (item.kind === "remote") {
        // 主通道已尝试并失败:退回浏览器拉全量后整队推送。
        const imp = await this._client.importRecommendPlaylist(item.providerId, {
          source: item.source || "", id: item.id, name: item.name || "",
          cover: item.coverUrl || "", creator: item.creator || "",
          trackCount: item.trackCount || "", link: item.link || "",
        }).catch((e) => { err("import remote playlist failed", e); return null; });
        const plId = imp?.playlistId;
        if (!plId) { err("import remote playlist returned no playlistId"); return; }
        const res = await this._client.getPlaylistSongs(plId);
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
    // 乐观:起播指令已下发,按钮立即切到播放中(后端事件/轮询会纠正,避免 2s 空窗)。
    this._ui.isPlaying = true;
    this.requestUpdate();
    this._client.playQueue(pid, items, 0)
      .then(() => log("playing", this._collLabel(item), item.name, songs.length, "songs"))
      .catch((e) => err("playCollection failed", e));
  }

  _renderBrowserItem(it, prio = false) {
    if (it.kind === "song") {
      return html`
        <div class="bitem">
          <div class="bthumb" style="cursor:pointer" title="${this._t("browser.playSong")}" @click=${() => this._browserPlaySong(it)}>
            ${it._remote && it.coverArt ? html`<img class="bremote-img" src="${it.coverArt}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : this._coverImgTag(it.coverArt, prio)}
          </div>
          <div class="bmeta" style="cursor:pointer;flex:1;min-width:0" @click=${() => this._browserItemClick(it)}>
            <div class="bt">${it.title}${it._remote && it.platformLabel ? html`<span class="rtag">${it.platformLabel}</span>` : ""}</div>
            <div class="ba">${it.artist || ""}</div>
          </div>
          <button class="mini" title="${this._t("browser.playSong")}" @click=${() => this._browserPlaySong(it)}>▶</button>
          ${it._remote ? html`<button class="mini imp" ?disabled=${it._importing || this._ui.remoteBusy === it.id} title="${this._t("browser.addToLibrary")}" @click=${(e) => { e.stopPropagation(); this._browserImportRemote(it); }}>${it._imported ? this._t("browser.added") : this._t("browser.add")}</button>` : ""}
        </div>`;
    }
    // 首页推荐分区头(各平台精选小标题)。有 tagline(说明文案)时作为副标题展示;
    // 精选分区缺省回落歌单数量「N 张」;本地随机分区(无 tagline)不显示副标题。
    if (it.kind === "section") {
      const sub = it.tagline
        ? html`<span class="bsec-sub">${it.tagline}</span>`
        : (it._local ? "" : html`<span class="bsec-sub">${this._t("browser.sections", { n: it.count || 0 })}</span>`);
      return html`
        <div class="bsec">
          <span class="bsec-name">${it.name}</span>
          ${sub}
        </div>`;
    }
    // 首页推荐:远程平台歌单(go-music-dl 等 recommend 插件输出)。封面为远程 URL,
    // 直接 <img src> 渲染(不走 getCoverArt);整播 = 先导入再播(与 Web playRemotePl 同流程)。
    if (it.kind === "remote") {
      const sub = it.trackCount ? this._t("browser.tracks", { n: it.trackCount }) : this._t("browser.collPlaylist");
      return html`
        <div class="bitem">
          <div class="bthumb" style="cursor:pointer" title="${this._t("browser.playCollection", { label: this._t("browser.collPlaylist") })}" @click=${() => this._browserPlayCollection(it)}>
            ${it.coverUrl ? html`<img class="bremote-img" src="${it.coverUrl}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : html`<span class="bnocover">♪</span>`}
          </div>
          <div class="bmeta" style="cursor:pointer;flex:1;min-width:0" title="${this._t("browser.enter")}" @click=${() => this._browserPlayCollection(it)}>
            <div class="bt">${it.name}</div>
            <div class="ba">${it.source ? `${it.source} · ` : ""}${sub}</div>
          </div>
          <button class="mini" title="${this._t("browser.playCollection", { label: this._t("browser.collPlaylist") })}" @click=${(e) => { e.stopPropagation(); this._browserPlayCollection(it); }}>▶</button>
        </div>`;
    }
    const sub = it.kind === "album" ? (it.artist || "")
      : it.kind === "genre" ? this._t("browser.tracks", { n: it.songCount || 0 })
      : it.kind === "playlist" ? this._t("browser.tracks", { n: it.songCount || 0 })
      : "";
    // 首页推荐:今日漫游(红角标)带角标,样式与媒体库歌单行完全一致。
    const badge = it.kind === "playlist" && it.badge
      ? html`<span class="plbadge">${it.badge}</span>`
      : "";
    return html`
      <div class="bitem">
        <div class="bthumb" style="cursor:pointer" title="${this._t("browser.playCollection", { label: this._collLabel(it) })}" @click=${() => this._browserPlayCollection(it)}>
          ${it._remote && it.coverArt ? html`<img class="bremote-img" src="${it.coverArt}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : this._coverImgTag(it.coverArt, prio)}
        </div>
        <div class="bmeta" style="cursor:pointer;flex:1;min-width:0" title="${this._t("browser.enter")}" @click=${() => this._browserItemClick(it)}>
          <div class="bt">${it.name}${badge}${it._remote && it.platformLabel ? html`<span class="rtag">${it.platformLabel}</span>` : ""}</div>
          <div class="ba">${sub}</div>
        </div>
        <button class="mini" title="${this._t("browser.playCollection", { label: this._collLabel(it) })}" @click=${(e) => { e.stopPropagation(); this._browserPlayCollection(it); }}>▶</button>
        ${it._remote && it.kind !== "artist" ? html`<button class="mini imp" ?disabled=${it._importing || this._ui.remoteBusy === it.id} title="${this._t("browser.addToLibrary")}" @click=${(e) => { e.stopPropagation(); this._browserImportRemote(it); }}>${it._imported ? this._t("browser.added") : this._t("browser.add")}</button>` : ""}
      </div>`;
  }

  _renderMediaBrowser() {
    const stack = this._ui.browserStack;
    const level = stack[stack.length - 1];
    // 面板壳无条件渲染(即使 browserStack 为空):首次打开时节点必须已在 DOM,
    // 否则「首次插入 + 同帧加 .open」没有起始渲染态,transition 不播 → 首开硬跳无动画。
    // ⚠️ 必须用**同一个模板**输出壳(壳常驻、内部内容用 ${level ? ... : ""} 条件渲染),
    // 不能按 level 有无返回两个不同模板 —— Lit 会把两个模板当不同结构直接换节点,
    // 换出来的新节点同样没有起始渲染态,首开照样不播动画(实测踩过这个坑)。
    // 空壳不带 open,走 .panel 关闭态(visibility:hidden 瞬切),不可见不可点,
    // 与旧的「不渲染任何节点」行为等价;_openBrowser 会在置 showBrowser=true 的同一帧
    // 同步压入根级 stack,不会出现「开着但壳是空」的状态。
    const isRoot = !!level && level.type === "root";
    // 搜索框:与虚拟滚动共用同一取数路径(服务端 query 过滤),显示给可搜索的库类型。
    const showSearch = !!level && ["playlists", "albums", "artists", "genres", "starred", "songs"].includes(level.type);
    // 虚拟滚动窗口:只在 [vWinStart, vWinEnd] 渲染(行数恒 ≈ 一屏 + 2*OVERSCAN)。
    const win = [];
    if (level && !isRoot && level.total > 0 && (level.vWinStart ?? -1) >= 0) {
      const s = Math.max(0, level.vWinStart);
      const e = Math.min(level.total - 1, level.vWinEnd ?? s);
      for (let i = s; i <= e; i++) win.push(i);
    }
    return html`
      <div class="panel browser ${this._ui.showBrowser ? "open" : ""}">
        ${level ? html`
        <button class="mini close" title="${this._t("control.close")}" @click=${(e) => { e.stopPropagation(); this._ui.showBrowser = false; this._ui.showQueue = false; this.requestUpdate(); }}>✕</button>
        <div class="br-crumbs">
          ${stack.map((lv, i) => html`
            <span class="crumb ${i === stack.length - 1 ? "cur" : ""}" @click=${() => this._browserPopTo(i)}>${this._crumbName(lv)}</span>
            ${i < stack.length - 1 ? html`<span class="crumb-sep">›</span>` : ""}
          `)}
          ${level.type === "home" ? html`
            <button class="br-refresh" title="${this._t("browser.refreshHome")}" ?disabled=${this._ui.homeRefreshing}
              @click=${() => this._browserRefreshHome()}>⟳</button>
          ` : ""}
        </div>
        ${showSearch ? html`
          <div class="br-search">
            ${this._levelSearchable(level.type) ? html`
              <select class="br-src" .value=${level.srcMode || "local"} title="${this._t("browser.srcHint")}" @change=${(e) => this._onSrcModeChange(level, e.target.value)}>
                ${this._levelSearchable(level.type) ? html`<option value="aggregate">${this._t("browser.aggregate")}</option>` : ""}
                <option value="local">${this._t("browser.local")}</option>
                ${(level.providers || []).map((p) => html`<option value=${p.id}>${p.name}</option>`)}
              </select>
            ` : ""}
            <input class="search-input" placeholder="${this._t("browser.search")}" .value=${level.query}
              @input=${(e) => { level.query = e.target.value; this._browserSearchInput(); }}
              @compositionstart=${(e) => { this._searchComposing = true; }}
              @compositionend=${(e) => { this._searchComposing = false; this._browserSearchInput(); }}
              @keydown=${(e) => { if (e.key === "Enter") this._browserSearch(); }} />
          </div>
        ` : ""}
        <div class="br-list ${isRoot ? "root-grid" : ""}" @scroll=${this._onBrScroll}>
          ${isRoot ? html`
            <div class="cat-grid">
              ${(level.items || []).map((c) => html`
                <button class="cat" @click=${() => this._browserItemClick(c)}>
                  <span class="cat-ic ${CAT_HEART.has(c.cat) ? "heart" : ""}">${this._icon(CAT_ICONS[c.cat] || "list", this._ui.catIconSize || 42, CAT_HEART.has(c.cat))}</span>
                  <span class="cat-name">${c.name}</span>
                </button>
              `)}
            </div>
          ` : (level.loading && !level.total ? html`<div class="empty">${this._t("common.loading")}</div>` : html`
            ${level.type === "playlists" ? html`
              <div class="bitem pin-fav" @click=${() => this._browserPush({ type: "starred", items: [], query: "", loading: false })}>
                <div class="bthumb fav" title="${this._t("browser.enter")}">${this._icon("heart2", 20, true)}</div>
                <div class="bmeta" style="cursor:pointer;flex:1;min-width:0" title="${this._t("browser.enter")}">
                  <div class="bt">${this._t("browser.starred")}</div>
                  <div class="ba">${this._t("browser.starredDesc")}</div>
                </div>
                <button class="mini" title="${this._t("browser.enter")}" @click=${(e) => { e.stopPropagation(); this._browserPush({ type: "starred", items: [], query: "", loading: false }); }}>›</button>
              </div>
            ` : ""}
            ${!level.total && !level.loading ? html`<div class="empty">${this._t("common.empty")}</div>` : ""}
            <div class="vs-spacer" style="height:${(level.total || 0) * ROW_STEP}px">
              ${win.map((i) => this._vsRow(level, i))}
            </div>
            ${this._vsMoreHint(level)}
          `)}
        </div>
        ` : ""}
      </div>
    `;
  }

  // 虚拟滚动行:缓存未到的位置渲染骨架占位行(不白屏闪烁)。
  _vsRow(level, i) {
    const it = level.vCache.get(i);
    return html`
      <div class="vs-row" style="top:${i * ROW_STEP}px">
        ${it ? this._renderBrowserItem(it, i < VS_PRIO_ROWS) : html`<div class="bitem vs-skel"></div>`}
      </div>`;
  }

  // 底部「加载中」轻量指示(预取在途时显示,用户感知仍在加载)。
  _vsMoreHint(level) {
    if (!level.vLoading || level.vLoading.size === 0) return html``;
    return html`<div class="vs-more">${this._t("common.loading")}</div>`;
  }

  static get styles() {
    return css`
      :host { display: block;
        /* 面板/极简模式过渡的全局节奏(柔和档,主理人拍板):
           进场 = 缓出曲线 cubic-bezier(0.2,0,0,1) 600ms —— 起步快收尾稳,面板像从底部滑上来;
           出场 = 缓入曲线 cubic-bezier(0.4,0,1,1) 440ms —— 出场比进场短是 Material/HIG 通用做法,
           用户关闭时意图已明确,不需要再铺垫情绪。
           (v2.8.12:主理人反馈 300/220ms 偏快,整套节奏翻倍 —— 只改这两个变量即可全局生效。) */
        --anim-in: cubic-bezier(0.2, 0, 0, 1);
        --anim-out: cubic-bezier(0.4, 0, 1, 1);
        --dur-in: 0.6s;
        --dur-out: 0.44s;
        /* 覆盖层(.panel / .vol-overlay)进场滑动时长,与极简模式的淡入淡出解耦:
           覆盖层是「只滑不淡」(见 .panel 注释),0.6s 的慢滑在失去淡入衬托后明显发黏,
           取原生弹层手感的 0.26s;极简模式的 --dur-in/--dur-out 保持不变。 */
        --dur-panel-in: 0.26s; }
      ha-card {
        /* 颜色变量:默认浅色文字(暗背景);.dark 时整体切深色文字(亮背景封面) */
        --fg: #ffffff;
        --fg-invert: #1b1b1f; /* 实底高亮(如设备按钮激活态)上的反色文字:深封面=白底黑字 */
        --fg-dim: rgba(255, 255, 255, 0.6);
        --fg-faint: rgba(255, 255, 255, 0.5);
        --ctl: rgba(255, 255, 255, 0.85);
        /* --ctl 的「三元组」形态(r,g,b):只有它能塞进 rgba(var(--x), alpha)。
           完整色值(--ctl/--fg 这类)写进 rgba() 是无效值,计算值阶段整条声明作废。 */
        --ctl-rgb: 255, 255, 255;
        --ctl-hover: rgba(255, 255, 255, 0.10);
        --seek-bg: rgba(255, 255, 255, 0.18);
        --panel-bg: rgba(255, 255, 255, 0.04);
        --line: rgba(255, 255, 255, 0.12);
        --line-soft: rgba(255, 255, 255, 0.08);
        /* 选中播放器文字投影:白字配深投影,保证压在任意 accent 底色上都读得清。 */
        --sel-text-shadow: 0 1px 2px rgba(0, 0, 0, 0.65);
        /* MusicFlow FnOS 暗色玻璃拟态:深紫灰渐变底(无封面时回退显示) */
        background: linear-gradient(180deg, #2d293a 0%, #1a1728 52%, #15121f 100%);
        color: var(--fg);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        overflow: hidden;
        position: relative;
        font-family: 'Montserrat', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Segoe UI', Arial, sans-serif;
      }
      ha-card.dark {
        --fg: #1b1b1f;
        --fg-invert: #ffffff; /* 浅封面=黑底白字 */
        --fg-dim: rgba(0, 0, 0, 0.6);
        --fg-faint: rgba(0, 0, 0, 0.5);
        --ctl: rgba(0, 0, 0, 0.78);
        --ctl-rgb: 20, 20, 24;
        --ctl-hover: rgba(0, 0, 0, 0.08);
        --seek-bg: rgba(0, 0, 0, 0.18);
        --panel-bg: rgba(0, 0, 0, 0.06);
        --line: rgba(0, 0, 0, 0.16);
        --line-soft: rgba(0, 0, 0, 0.10);
        /* .dark = 深色文字(亮背景封面):投影反相为浅色,同上。 */
        --sel-text-shadow: 0 1px 2px rgba(255, 255, 255, 0.55);
      }
      .wrap { position: relative; z-index: 1; padding: 14px; display: flex; flex-direction: column; gap: 12px;
        box-sizing: border-box; /* shadow DOM 不吃 HA 全局 reset:content-box 会让 min-height+padding 叠加,极简模式卡片变高 */
        transition: opacity 0.3s ease, filter 0.3s ease; }
      /* 封面融合背景层:当前封面放大+模糊+拉伸铺满整卡;veil 统一压暗保证文字可读 */
      .coverbg { position: absolute; inset: 0; z-index: 0; overflow: hidden; }
      .coverbg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
        transform: scale(1.45); filter: blur(42px) saturate(1.35); }
      .coverbg-veil { position: absolute; inset: 0;
        background: linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.40) 55%, rgba(0,0,0,0.50) 100%); }
      /* 未播放态固定配色底色(idle ambient):无封面时接管整卡底色。
         N 层整卡对角渐变原地交叉淡入 —— 只动 opacity(合成属性),无位移 / 无重绘 / 无滤镜。
         各层相位均匀错开 1/N 周期(mf-cyc:0~10% 全亮 → 10~20% 淡出 → 90~100% 淡入),
         交叉区必然一层在升、另一层在降;每层都是全不透明渐变,over 合成自动归一不会叠加变亮。
         contain 把重绘锁在本层内,不影响 HA 整页合成。 */
      .idlebg { position: absolute; inset: 0; z-index: 0; overflow: hidden;
        contain: layout paint style;
        background: #14182a; opacity: 0; transition: opacity 900ms ease;
        --idle-cycle: 0s; }
      ha-card.idle .idlebg { opacity: 1; }
      /* 交叉淡入层:每层一条固定配色对角渐变,跑同一条关键帧、靠负 delay 错峰。 */
      .idlebg i { position: absolute; inset: 0; display: block; opacity: 0;
        background: linear-gradient(140deg, var(--c1), var(--c2) 62%, #14182a 100%);
        will-change: opacity;
        animation: mf-cyc var(--idle-cycle) linear infinite;
        animation-delay: var(--dly, 0s); }
      /* mf-cyc 关键帧不写死在这里:它的窗口宽必须随层数推导(见 _syncIdleKeyframes)。
         写死窗口(旧值 0~10% 停留)只对 5 层成立 —— 层数一多,错峰 < 窗口,
         就会有 3~4 层同时半透明叠在一起,主导配色权重掉到 ~45%,观感发糊。 */
      /* 降级:idle_speed=off → 静止在首组配色;不可见 / 后台 tab → 停表(打开面板**不停表**);无障碍 → 静止 */
      .idlebg.static i { animation: none; }
      .idlebg.static i:first-child { opacity: 1; }
      .idlebg.paused i { animation-play-state: paused; }
      @media (prefers-reduced-motion: reduce) {
        .idlebg i { animation: none; }
        .idlebg i:first-child { opacity: 1; }
      }
      /* 未连接:整卡调暗降饱和做区分(不再显示"已连接/未连接"文字) */
      .wrap.off { opacity: 0.45; filter: saturate(0.5) brightness(0.75); }
      .ic { display: inline-flex; align-items: center; justify-content: center; line-height: 0; }
      .ic svg { display: block; }
      .err { color: #f05672; padding: 12px; }
      .warnbar { padding: 5px 12px; font-size: 12px; color: #b8860b; background: rgba(255, 180, 0, 0.12); border-bottom: 1px solid rgba(255, 180, 0, 0.25); }
      .warnbar.bad { color: #f05672; background: rgba(240, 86, 114, 0.12); border-bottom-color: rgba(240, 86, 114, 0.25); }
      /* 播放设备切换按钮区:gap 加大(12px)补偿选中态 scale(1.1) 放大后的视觉间距,
         避免相邻按钮放大后贴在一起。 */
      /* 正常态恒单行:flex 换行按「未收缩宽度」排线 —— 列表内容再宽也会独占第一行、
         把行尾按钮挤到第二行(2026-10-22 20+ 端实测)。故这里 nowrap,让列表收缩裁剪。 */
      .outputs { display: flex; flex-wrap: nowrap; gap: 12px; align-items: center; }
      /* 首页 chip 列表:恒单行、不换行。放不下的 chip 靠**按住任意 chip 左右拖动**滑出来
         (鼠标见 _outListPointerDown;触屏走原生 pan-x),滚动条隐藏。
         flex:1 1 auto 占满剩余宽度 ⇒ 行尾「流转播放」按钮恒定在卡片右缘。 */
      /* 纵向 padding 10px(原 4px):给选中 chip 的 scale(1.12) 与底部投影留出绘制空间 ——
         overflow-x:auto 会让 overflow-y 实际落在 hidden,投影一旦超出 padding 就被硬切成一条直线。 */
      .out-list { display: inline-flex; flex-wrap: nowrap; align-items: center; gap: 12px; min-width: 0; flex: 1 1 auto;
        overflow-x: auto; overflow-y: hidden; padding: 10px 0 10px 4px; scrollbar-width: none;
        touch-action: pan-x; -webkit-overflow-scrolling: touch; }
      .out-list::-webkit-scrollbar { display: none; }
      .out-list.drag-x { cursor: grabbing; }
      /* 行尾「流转播放」:去掉外框,与 MINI 播放器那一排 .ctl 按钮完全同款 —— 
         透明底、无边框,仅 hover 放大上浮 + 中性阴影,active 缩回。 */
      /* justify-content: center —— .out 只设了 align-items:center(纵向),横向仍是默认 flex-start;
         按钮被钉成 30×30、padding 归零后,∞ 图标作为唯一 flex item 贴左排布,而圆形底
         (border-radius:50% ⇒ hover 的 box-shadow 圆 / focus-visible 的 outline 圆)以按钮盒子
         中心为圆心 ⇒ 图标与圆心不同心(Chrome 实测横偏 6.5~7px)。播放控件那一排 .ctl 本就
         写了 justify-content:center,这里补齐同一条。 */
      .out.transfer { flex: 0 0 auto; width: 30px; height: 30px; padding: 0; gap: 0; justify-content: center;
        border: none; background: transparent; color: var(--ctl); border-radius: 50%; box-shadow: none; }
      .out.transfer:hover { border: none; background: transparent; color: var(--ctl);
        transform: scale(1.10); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35); }
      .out.transfer:active { transform: scale(0.92); }
      .out.transfer:focus-visible { outline: 2px solid rgba(var(--acc), 0.9); outline-offset: 2px; }
      /* 芯片不收缩、文字恒单行:名称再长也只省略号裁字。否则 20+ 端时每个 chip 被压到
         59px,长设备名在 chip 内部换行,整行从 32px 撑到 95px(2026-10-22 实测)。 */
      .out { display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--line); background: var(--panel-bg); color: var(--ctl);
        border-radius: 14px; padding: 4px 12px; font-size: 12px; cursor: pointer; flex: 0 0 auto; white-space: nowrap;
        transition: border-color 0.2s, box-shadow 0.18s ease, transform 0.18s ease, color 0.2s; }
      .out-label { min-width: 0; max-width: 132px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .out .ic { display: inline-flex; }
      /* 每个 output 外包一层纵向 wrap(仅用于保持 chip 不收缩的对齐结构)。 */
      .out-wrap { display: inline-flex; flex-direction: column; align-items: center; gap: 4px; flex: 0 0 auto; }
      /* 悬停反馈与封面/播放控件统一:仅放大上浮 + 中性阴影。
         选中播放器(.active)恒保持放大状态(等同悬停效果),切换后才缩小;
         未选中仅悬停放大、移走恢复。 */
      .out:hover, .out.active { transform: scale(1.1); box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35); }
      .out:active { transform: scale(0.96); }
      /* 当前播放器:立体突出(放大上浮 + 受光渐变 + 底部投影);去除霓虹光晕,仅用底部阴影营造立体感。
         底色/边框仍跟随封面 accent(--acc) 保留选中色感,但**文字与图标恒取 --fg**(卡片当前明暗档的
         固定前景,不再跟 --acc 走):--acc 逐曲变化会让选中那台的文字/图标跟着换色,浅封面时浅字压
         浅底近乎不可见(2026-10-26 实测)。投影走 --sel-text-shadow:白字深投影 / 深字浅投影。
         底部投影已收窄 —— 原 8px/22px 会伸出容器被 overflow-y:hidden 切成一条直线,见 .out-list。 */
      .out { position: relative; }
      .out.active {
        transform: scale(1.12) translateY(-1px);
        background: linear-gradient(180deg, rgba(var(--acc), 0.32), rgba(var(--acc), 0.10));
        border-color: rgba(var(--acc), 0.85);
        color: var(--fg);
        text-shadow: var(--sel-text-shadow);
        box-shadow: 0 2px 3px rgba(0, 0, 0, 0.45), 0 4px 9px rgba(0, 0, 0, 0.5);
      }
      .out.active .ic { color: var(--fg); }
      .out.off { opacity: 0.45; }
      .hint { color: var(--fg-faint); font-size: 12px; }
      .now { display: flex; gap: 12px; align-items: flex-start; justify-content: space-between; }
      .cover { width: 92px; height: 92px; border-radius: 12px; overflow: hidden; flex: 0 0 auto;
        background: rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35); }
      .cover { cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease; position: relative; }
      .cover:hover { transform: scale(1.06); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45); z-index: 2; }
      .cover img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.18s ease; }
      .cover:hover img { transform: scale(1.04); }
      .nocover { font-size: 30px; color: rgba(255, 255, 255, 0.3); }
      .meta { flex: 1; min-width: 0; position: relative; min-height: 104px; /* 4 行歌词版的高度(标题22+间距2+80),保证加 1 行后卡片高度不变 */ }
      .track { font-weight: 600; font-size: 16px; color: var(--fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      /* 歌词滚动:视口固定 5 行(5 x 20px = 100px),当前行恒在第二行;上下边缘渐隐做出滚动纵深。
         歌词框绝对定位在标题下方(top:24 = 标题行高+间距),不撑高卡片;向下延伸到播放控件
         区域,作为控件的背景(控件在 DOM 更后,盖住歌词)。.lyricbox-line 的 height/line-height
         必须与 JS 常量 LYRIC_LINE_H 一致,.lyricbox 的 height = LYRIC_VIEW_LINES x LYRIC_LINE_H。 */
      .lyricbox { position: absolute; left: 0; right: 0; top: 24px; height: 100px; overflow: hidden; z-index: 0;
        -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%);
        mask-image: linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%); }
      .lyricbox-track { transition: transform 0.9s cubic-bezier(0.4, 0, 0.2, 1); will-change: transform; }
      .lyricbox-line { height: 20px; line-height: 20px; font-size: 13px; color: var(--fg-dim); opacity: 0.55;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        transition: color 0.6s ease, opacity 0.6s ease; }
      .lyricbox-line.cur { color: #ffd400; opacity: 1; }
      /* 浅色封面(整卡切深色文字)时金色对比不足,换成深琥珀 */
      ha-card.dark .lyricbox-line.cur { color: #a3690a; }
      /* === 极简歌词模式(auto-hide) ===
         播放中空闲 auto_hide_delay(默认 3s)后进入:卡片上半部分往上「移出卡片」、
         下半部分往下「移出卡片」,歌词 + 封面整体上移补位,歌词视口 100px → 188px。
         🔴 铁律:动画不得改变卡片整体高度 —— 三块「只位移 + 淡出,不收缩」,绝不碰
         max-height / display / padding / margin / min-height。占位全程保留,整卡高度恒等于
         完整模式高度,与动画播到第几帧完全无关(v2.8.13 用收缩换位置必然动高度,已回退)。
         位移量说明:
         · .outputs(切换器行,上半):translateY(-200%) —— 自身高度的 2 倍往上,连同行上方
           14px 内边距一起越过卡顶,被 .wrap.mini 的 overflow:hidden 裁掉 = 「移出卡片」。
         · .now(歌词 + 封面):translateY(calc(-1 * var(--mini-shift))) —— 上移「切换器行高 +
           flex gap」(JS 实测注入 --mini-shift,默认 64px),正好填到切换器腾出的位置。
         · .controls / .progress-row(下半):translateY(260% / 420%) —— 自身高度的倍数往下,
           越过卡底被裁掉 = 「移出卡片」;倍数而非定值,chip 行/控件尺寸变化时同样够用。
         回归(出 mini)时全部反向:transform 回到 none,从各自的方向滑回原位。
         用自身高度百分比而不用定值:卡片尺寸随内容变化时,位移量自动跟着变,永远够飞出卡片。
         visibility 延迟到淡出结束再切 hidden —— 动画期间仍参与渲染,结束后不可点/不可 Tab。
         --mini-shift 由 JS 在完整模式下实测 .outputs 高度 + 12px gap 写入(见 updated())。 */
      /* 🔴 padding 必须显式锁死(与完整模式同值):极简时 .outputs 向上移出会溢出到
         容器的 block-start 之外,Chrome 会因此把 .wrap 的上下 padding 从 14px 吃掉到 3px
         (实测:padding-top/bottom 14→3,整卡矮 20px,所有内容上移 11px)—— 歌词/封面
         于是顶到卡片上边缘、「贴边」。显式声明 .wrap.mini 的 padding 后前后一致,
         卡片高度与上移基准都不再漂移。
         (2026-10-29 修「极简态左右留白会变」)overflow 必须是 clip 而不是 hidden:
         hidden 会把 .wrap 变成**可滚动容器** —— 常驻渲染的三个 .panel 与移出卡外的三块
         一起撑出几十 px 可滚动溢出区(实测 scrollH 288~339 / clientH 268),任何浏览器
         自发滚动(焦点揭示 / scrollIntoView / 滚动锚定)都会把整块内容顶走;且可滚动容器
         的内容盒会被滚动条槽改动(实测 .now 392px → 390px,左右各缩 1px)。
         clip 裁剪范围与 hidden 一致(都在 padding 边)但**不产生滚动容器**:不可滚动 ⇒
         不可能位移,内容盒与完整模式严格同值。hidden 保留在前作兜底(老 Safari 不认 clip)。 */
      .wrap.mini { overflow: hidden; overflow: clip; padding: 14px; }
      /* 展开态(完整模式 / 回归)过渡:进场曲线 + 进场时长;visibility 立即恢复
         (动画一开始就可见可交互)。只过渡合成属性,不碰任何影响布局的属性。 */
      .wrap > .outputs,
      .wrap > .now,
      .wrap > .lower > .controls,
      .wrap > .lower > .progress-row {
        transition: opacity var(--dur-in) var(--anim-in), transform var(--dur-in) var(--anim-in),
          visibility 0s linear 0s; }
      /* 上半部分:切换器行向上移出卡片 + 淡出 */
      .wrap.mini > .outputs {
        opacity: 0; transform: translateY(-200%); visibility: hidden;
        transition: opacity var(--dur-out) var(--anim-out), transform var(--dur-out) var(--anim-out),
          visibility 0s linear var(--dur-out); }
      /* 歌词 + 封面:整体上移到切换器腾出的位置(纯 transform,不碰布局) */
      .wrap.mini > .now {
        transform: translateY(calc(-1 * var(--mini-shift, 64px)));
        transition: transform var(--dur-out) var(--anim-out); }
      /* 下半部分:控件行 / 进度条向下移出卡片 + 淡出 */
      .wrap.mini > .lower > .controls {
        opacity: 0; transform: translateY(260%); visibility: hidden;
        transition: opacity var(--dur-out) var(--anim-out), transform var(--dur-out) var(--anim-out),
          visibility 0s linear var(--dur-out); }
      .wrap.mini > .lower > .progress-row {
        opacity: 0; transform: translateY(420%); visibility: hidden;
        transition: opacity var(--dur-out) var(--anim-out), transform var(--dur-out) var(--anim-out),
          visibility 0s linear var(--dur-out); }
      .wrap.mini .lyricbox { height: 188px; transition: height 0.84s cubic-bezier(0.22, 1, 0.36, 1) 0.36s; }
      .wrap:not(.mini) .lyricbox { height: 100px; transition: height 0.6s ease; }
      /* 键盘可达性:焦点在卡片内时由 JS(focusin/focusout)恢复完整模式并暂停空闲隐藏。 */
      /* 动效偏好:reduced-motion → 全部直切(新加的面板/音量/极简过渡 + 歌词盒既有过渡),
         状态 class 照常生效,只是不再播动画 —— 保持直切瞬时的旧行为。 */
      @media (prefers-reduced-motion: reduce) {
        .wrap.mini .lyricbox, .wrap:not(.mini) .lyricbox { transition: none !important; }
        .wrap > .outputs, .wrap > .now,
        .wrap > .lower > .controls, .wrap > .lower > .progress-row,
        .wrap.mini > .outputs, .wrap.mini > .lower > .controls, .wrap.mini > .lower > .progress-row,
        .vol-overlay, .panel { transition: none !important; }
      }
      .t-art { font-size: 13px; font-weight: 400; color: var(--fg-dim); }
      .progress-row { display: flex; align-items: center; gap: 8px; }
      .progress-row .t { font-size: 11px; color: var(--fg-faint); width: 34px; text-align: center; font-variant-numeric: tabular-nums; }
      .seek { flex: 1; height: 6px; border-radius: 3px; }
      .seek { -webkit-appearance: none; appearance: none; outline: none; cursor: pointer; background: var(--seek-bg); }
      .seek::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
        width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 2px solid rgb(var(--acc));
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4); cursor: pointer; transition: transform 0.15s ease; }
      .seek:hover::-webkit-slider-thumb { transform: scale(1.2); }
      .seek::-moz-range-track { height: 6px; border-radius: 3px; background: var(--seek-bg); }
      .seek::-moz-range-progress { height: 6px; border-radius: 3px; background: rgb(var(--acc)); }
      .seek::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%;
        background: #fff; border: 2px solid rgb(var(--acc)); }
      /* 播放控件最大宽度保持原 7 × 42px + 6 × 23px 的布局；窄卡先自动收紧间距，
         可用宽度不足 294px 时再等比收缩按钮，避免只压缩宽度造成椭圆。 */
      .controls { display: flex; width: min(100%, 432px); align-self: center; justify-content: space-between;
        align-items: center; gap: 0; position: relative; }
      .ctl { border: none; background: transparent; color: var(--ctl); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        width: 42px; height: 42px; padding: 0; border-radius: 50%;
        transition: box-shadow 0.18s ease, transform 0.18s ease, color 0.2s; }
      .ctl svg { display: block; }
      /* 悬停反馈与封面统一:仅放大上浮 + 中性阴影,不加红圈、不改底色 */
      .ctl:hover { transform: scale(1.10); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35); }
      .ctl:active { transform: scale(0.92); }
      .ctl.play { width: 42px; height: 42px; background: transparent; color: var(--ctl); }
      .ctl.play:hover { transform: scale(1.10); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35); }
      .ctl.play:active { transform: scale(0.92); }
      /* 仅播放控件行允许按钮等比收缩；音量面板里的 .ctl 仍保持原 42px 尺寸。 */
      .controls > .ctl { flex: 0 1 42px; min-width: 0; height: auto; aspect-ratio: 1; }
      .controls > .ctl .ic, .controls > .ctl svg { max-width: 100%; max-height: 100%; }
      .controls > .ctl svg { width: auto; height: auto; }
      /* 前提:_icon() 生成的 svg 自带尺寸属性(20/22px)。若将来改成只留 viewBox,
         这里必须给 svg 写死尺寸,否则上面的 auto 会让图标撑满整个按钮。 */
      .ctl.like.on { color: rgb(var(--acc)); }
      /* 展开态只用图标变色标识,不再加红圈描边 */
      .ctl.active { color: rgb(var(--acc)); }
      .ctl.vol-open { background: transparent; color: var(--ctl); }
      /* 下半区容器:音量遮罩以它为定位参照,盖住控件行 + 进度条 + 队列面板 */
      .lower { position: relative; display: flex; flex-direction: column; gap: 12px; }
      /* 音量态/面板态的首页内容**瞬隐**(2026-10-29 定调,取代旧的「下沉淡出」):
         被覆盖层盖住的块直接 visibility:hidden,不播任何淡出/下沉动画。
         仍占位(没动 max-height/display)→ 卡片高度全程零跳变,露出的就是卡片自身
         那层模糊封面背景,与上半部分同源,不可能有色差/边界。
         为什么不再渐变:旧内容一边淡出、覆盖层一边滑入 = 两层各跑各的,中途必然出现
         「半透明旧内容 + 新面板」的交错逗留帧(主理人实机反馈)。旧内容瞬隐后观感是
         「一层换一层」,与覆盖层的纯滑动进场不再重叠。 */
      /* 🔴 必须整块覆盖(:not(.panel)),不能逐个列名 —— .panel 背景是全透明的,漏掉任何一块都会从面板背后透出来(如断线时 .warnbar 透在媒体库列表底下)= 主理人实机反馈的「媒体库和首页两种显示叠加」。.lower 整块隐藏也顺带盖住 .vol-overlay,避免音量浮层(z-index 6)压在面板之上。 */
      .wrap.panelmode > :not(.panel),
      .lower.volmode > .controls,
      .lower.volmode > .progress-row {
        visibility: hidden; }
      /* 音量面板层本身完全透明,只负责承载音量行 + 接管「点外部关闭」。
         inset:0 与 .lower 严格对齐,不再需要负 inset/padding 那套魔数补偿,
         音量条左右端与下方 seek 天然重合。
         常驻渲染 + .open 开合:**只滑不淡**(2026-10-29 定调)。
         进场 = 从底部 20px 滑上来(--dur-panel-in);出场 = visibility 立即 hidden 瞬切。
         出场不再走动画的原因:本层完全透明,只要还「可见」就在顶层接事件,淡出的那 0.44s
         会变成「看不见却能点」的幽灵层(点外部关闭后还能拖到音量/点到静音)。 */
      .vol-overlay { position: absolute; inset: 0; z-index: 6;
        display: flex; align-items: flex-start;
        transform: translateY(20px); visibility: hidden; }
      .vol-overlay.open { transform: none; visibility: visible;
        transition: transform var(--dur-panel-in) var(--anim-in), visibility 0s linear 0s; }
      /* 静音键占最左 42px(顶替进度条左侧时间标签的位置),右侧留 42px 空位,
         使音量条与下方 seek 严格等长、左右端上下重合。gap 必须为 0。 */
      .vol-row { display: flex; align-items: center; gap: 0; width: 100%; height: 42px; }
      .vol-gap { width: 42px; flex: 0 0 auto; }
      .vol-slider { position: relative; flex: 1; height: 30px; cursor: pointer; touch-action: none; display: flex; align-items: center; }
      .vol-track { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); height: 6px; border-radius: 3px; background: var(--seek-bg); }
      .vol-fill { position: absolute; left: 0; top: 50%; transform: translateY(-50%); height: 6px; border-radius: 3px; background: rgb(var(--acc)); }
      .vol-knob { position: absolute; top: 50%; width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 2px solid rgb(var(--acc)); transform: translate(-50%, -50%); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4); }
      .vol-slider:active .vol-knob { transform: translate(-50%, -50%) scale(1.15); }
      /* 实时数值气泡:默认隐藏,拖动/悬停时显示;位置跟随滑块把手(translateX 居中)。 */
      .vol-value { position: absolute; bottom: calc(100% + 2px); transform: translateX(-50%);
        font-size: 12px; font-weight: 600; color: #fff; background: rgba(20, 20, 24, 0.92);
        border: 1px solid rgba(var(--acc), 0.55); border-radius: 8px; padding: 1px 7px;
        pointer-events: none; opacity: 0; transition: opacity 0.12s ease;
        font-variant-numeric: tabular-nums; white-space: nowrap; z-index: 5; }
      .vol-slider.dragging .vol-value, .vol-slider:hover .vol-value { opacity: 1; }
      /* 歌词/队列/媒体库已移入控件行(.ctl),不再需要 .actions/.act */
      /* 面板无感全屏覆盖 + **只滑不淡**(面板常驻 DOM,开合只切 .open;2026-10-29 定调):
         关闭态 = 下沉 20px + visibility:hidden(无延迟,瞬切);打开态 = 从底部滑上来(--dur-panel-in)。
         去掉淡入淡出的原因:①面板背景透明,淡入期间与下方旧内容叠出半透明交错帧;
         ②淡出期间面板仍在顶层接事件 = 看不见却能点的幽灵层。现在开关都是「一层换一层」。
         首页内容(.outputs/.now/.lower 内两行)同步瞬隐,见上方共享隐身规则。 */
      .panel { position: absolute; inset: 0; z-index: 5; background: transparent; border: none; border-radius: 0;
        padding: 14px; width: 100%; height: 100%; display: flex; flex-direction: column; box-sizing: border-box;
        transform: translateY(20px); visibility: hidden; }
      .panel.open { transform: none; visibility: visible;
        transition: transform var(--dur-panel-in) var(--anim-in), visibility 0s linear 0s; }
      /* 流转播放页:沿用 .panel 的整卡 inset:0 覆盖(尺寸 = 卡片尺寸),头部固定,
         内容区 .tp-scroll 独立滚动 —— A4 的网格与 B 的上下隐形热区都以这层滚动容器为准。 */
      .tp-title { font-weight: 600; font-size: 14px; }
      .panel.transfer .panel-head { flex: 0 0 auto; }
      .tp-scroll { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 2px; scrollbar-width: thin; }
      .tp-scroll::-webkit-scrollbar { width: 4px; }
      .tp-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 2px; }
      .tp-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.28); }
      /* 流转页网格:每格一个播放端(圆 + 名称 + 状态),窄卡自动单列。
         颜色一律走 --ctl-rgb / --acc:深底白圈、浅底黑圈,强调色跟随封面。 */
      /* 选中/悬停/焦点全部收敛到**封面圆**上:格子本身(.tp-peer)不再画底色,
         否则整格底色在卡片左右边缘会像一条被切掉的黑边。 */
      .tp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
        gap: 10px 6px; align-items: start; padding: 2px 8px; }
      .tp-peer { position: relative; display: flex; flex-direction: column; align-items: center;
        gap: 3px; padding: 6px 2px 8px; border-radius: 12px;
        transition: opacity 0.15s; -webkit-tap-highlight-color: transparent; }
      .tp-ring { position: relative; width: 56px; height: 56px; border-radius: 50%;
        border: 2px solid rgba(var(--ctl-rgb), 0.82); background: rgba(var(--ctl-rgb), 0.12);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; touch-action: none;
        transition: border-color 0.15s, box-shadow 0.15s, background 0.15s; }
      .tp-ring:hover { border-color: rgba(var(--acc), 0.85); }
      .tp-ring:focus-visible { outline: 2px solid rgba(var(--acc), 0.9); outline-offset: 3px; }
      /* 当前目标:不再画白色外环,也不在封面里塞勾选标记(2026-10-23 用户要求),
         改为与客户端 _ActivePulse 同款的**外圈呼吸光环**:一圈 3px 强调色圆环
         从 1.0 放大到 1.26 并渐隐,1.2s ease-in-out 往返 ⇒ 视觉上向外「吐」。
         光环是 .tp-ring 的**前置兄弟节点**,因此画在封面与频谱徽标之下。
         ⚠️ 圆心/直径必须与封面圆严格同心:.tp-ring 未设 border-box,外径 =
         内容 56 + 上下左右各 2px 边框 = 60;而 .tp-peer 的 padding-top 是 6px。
         所以光环取 60×60、top 6px、left calc(50% - 30px)——与 .tp-ring 的
         border box 完全重合(2026-10-23 用户实测反馈「圆心偏移」后修正;
         守卫 A5 会按这三条算式反查,禁止再手改单一数值)。 */
      .tp-peer.current .tp-ring { border-color: rgb(var(--acc)); background: rgba(var(--acc), 0.10); }
      .tp-pulse { position: absolute; left: calc(50% - 30px); top: 6px;
        width: 60px; height: 60px; box-sizing: border-box;
        border-radius: 50%; border: 3px solid rgb(var(--acc));
        box-shadow: 0 0 10px rgba(var(--acc), 0.45);
        pointer-events: none;
        animation: tp-pulse 1.2s ease-in-out infinite alternate; }
      @keyframes tp-pulse {
        0% { transform: scale(1); opacity: 0.9; }
        100% { transform: scale(1.26); opacity: 0; }
      }
      .tp-peer.drop .tp-ring { border-color: rgb(var(--acc));
        box-shadow: 0 0 0 3px rgba(var(--acc), 0.36), 0 0 10px rgba(var(--acc), 0.5); }
      .tp-peer.drag-src { opacity: 0.32; }
      .tp-peer.off { opacity: 0.45; }
      .tp-cover { width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
        display: flex; align-items: center; justify-content: center; }
      .tp-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .tp-fallback { display: flex; align-items: center; justify-content: center; color: rgba(var(--ctl-rgb), 0.85); }
      .tp-dash { position: absolute; inset: -5px; border-radius: 50%; pointer-events: none;
        border: 1.5px dashed rgba(var(--acc), 0.75); }
      /* 「正在播」频谱徽标:底色固定为中性深灰,**不跟随强调色 / 选择状态变化**
         (2026-10-23 用户要求)。曾用 rgba(var(--acc), .92):强调色随当前曲封面
         重算,切一次遥控目标徽标就换色,看起来像选中态在改频谱底色。 */
      .tp-live { position: absolute; left: 50%; bottom: -7px; transform: translateX(-50%);
        display: flex; align-items: flex-end; gap: 2px; height: 9px; padding: 1px 5px;
        border-radius: 6px; background: rgba(38, 38, 41, 0.92);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35); }
      .tp-live i { width: 2px; height: 6px; border-radius: 1px; background: #fff;
        animation: tp-eq 0.9s ease-in-out infinite; }
      .tp-live i:nth-child(1) { animation-delay: -0.2s; }
      .tp-live i:nth-child(2) { animation-delay: -0.45s; }
      .tp-live i:nth-child(3) { animation-delay: -0.7s; }
      @keyframes tp-eq { 0%, 100% { transform: scaleY(0.5); } 50% { transform: scaleY(1); } }
      /* 动效偏好:reduced-motion → 呼吸光环停在静止可见态,频谱不再跳。 */
      @media (prefers-reduced-motion: reduce) {
        .tp-pulse { animation: none; transform: scale(1.08); opacity: 0.5; }
        .tp-live i { animation: none; }
      }
      .tp-name { max-width: 100%; font-size: 12px; font-weight: 600; color: var(--fg);
        text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tp-sub { max-width: 100%; font-size: 10.5px; color: var(--fg-faint);
        text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      /* 群组成员勾选圈:与首页 chip 无关,只在流转页的成员管理态出现。
         未加入 = 空心圈(边框 + 半透明底,✓ 着色为透明);
         已加入 = 强调色实心圈 + **红色 ✓**(2026-10-23 用户要求:红勾,与选中态同色);
         勾外加极轻的暗色描边,保证红勾在红/橙系强调色底上也不糊。
         位置固定在原「+/−」处(封面圆右上角)。 */
      .tp-badge { position: absolute; right: 3px; top: 0; width: 20px; height: 20px; padding: 0;
        box-sizing: border-box; border-radius: 50%;
        border: 1.5px solid rgba(var(--ctl-rgb), 0.75);
        background: rgba(var(--ctl-rgb), 0.18); color: transparent;
        font-size: 12px; font-weight: 700; line-height: 1;
        display: flex; align-items: center; justify-content: center; cursor: pointer;
        box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.35);
        transition: background 0.18s, border-color 0.18s, color 0.18s, transform 0.18s; }
      .tp-badge:hover { border-color: rgba(var(--acc), 0.95); background: rgba(var(--acc), 0.22);
        transform: scale(1.1); }
      .tp-badge.in { border-color: rgb(var(--acc)); background: rgb(var(--acc)); color: #ef4444;
        text-shadow: 0 0 2px rgba(0, 0, 0, 0.55), 0 1px 1px rgba(0, 0, 0, 0.35); }
      .tp-badge:focus-visible { outline: 2px solid rgb(var(--acc)); outline-offset: 2px; }
      /* 回收站固定在滚动区之外:滚动视口下缘 = 热区与回收站的物理分界。 */
      .tp-trash { flex: 0 0 auto; margin-top: 6px; display: flex; align-items: center;
        justify-content: center; gap: 6px; height: 34px; border-radius: 10px;
        border: 1px dashed rgba(var(--ctl-rgb), 0.4); color: var(--fg-faint);
        font-size: 12px; transition: border-color 0.15s, color 0.15s, background 0.15s; }
      .tp-trash.over { border-color: rgba(var(--acc), 0.95); border-style: solid;
        color: rgb(var(--acc)); background: rgba(var(--acc), 0.16); }
      .tp-msg { flex: 1; min-width: 0; font-size: 11.5px; color: var(--fg-faint);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tp-msg.err { color: #ff7a7a; }
      .tp-gm-hint { flex: 0 0 auto; margin-bottom: 4px; font-size: 11px; color: var(--fg-faint); }
      .tp-empty { grid-column: 1 / -1; }
      /* 拖拽幽灵:fixed + pointer-events:none,elementFromPoint 才能命中真实落点。 */
      .tp-ghost { position: fixed; left: 0; top: 0; z-index: 9999; pointer-events: none;
        display: flex; flex-direction: column; align-items: center; gap: 3px;
        opacity: 0.92; filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.45)); }
      .tp-ghost .tp-ring { display: flex; width: 56px; height: 56px;
        border-color: rgb(var(--acc)); background: rgba(20, 20, 24, 0.55); }
      .tp-ghost .tp-name { max-width: 120px; color: #fff; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6); }
      /* 拖拽/点选时不选中文字:pointerdown 已不再 preventDefault(见 _tpPointerDown),
         鼠标按住拖动靠这里避免把设备名/状态文字拖成选区。 */
      .tp-peer, .tp-trash, .tp-ghost { user-select: none; -webkit-user-select: none; }
      .panel.transfer.busy .tp-peer { pointer-events: none; }
      .panel-head { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
      .panel-head .close { margin-left: auto; }
      .empty { color: var(--fg-faint); font-size: 13px; padding: 10px 0; text-align: center; }
      /* 歌词展开面板已移除,当前行常驻显示在 .artist(this._ui.currentLyric) */
      .qlist, .slist { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; scrollbar-width: thin; }
      .qlist::-webkit-scrollbar, .slist::-webkit-scrollbar,
      .br-list::-webkit-scrollbar { width: 4px; }
      .qlist::-webkit-scrollbar-thumb, .slist::-webkit-scrollbar-thumb,
      .br-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 2px; }
      .qlist::-webkit-scrollbar-thumb:hover, .slist::-webkit-scrollbar-thumb:hover,
      .br-list::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.28); }
      .qitem, .sitem { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 8px; transition: background 0.15s; }
      /* 队列虚拟滚动:行高固定 50px(与媒体库 ROW_STEP 一致,绝对定位按它铺排) */
      .qlist .qitem { height: 50px; box-sizing: border-box; }
      .qitem.vs-skel { background: var(--panel-bg); }
      .qitem:hover, .sitem:hover { background: rgba(255, 255, 255, 0.06); }
      .qitem.cur { background: rgba(var(--acc), 0.16); }
      .qitem .qcov { width: 34px; height: 34px; border-radius: 6px; overflow: hidden; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.05); }
      .qitem .qcov img.bcover-lazy { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; display: block; }
      .qitem .idx { width: 18px; color: rgba(255, 255, 255, 0.4); font-size: 12px; }
      .qitem .qt, .sitem .st { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; color: var(--fg); }
      .qitem .qa, .sitem .sa { width: 90px; color: var(--fg-faint); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mini { border: 1px solid var(--line); background: var(--panel-bg); color: var(--ctl);
        border-radius: 8px; padding: 3px 8px; font-size: 12px; cursor: pointer;
        transition: box-shadow 0.18s ease, transform 0.18s ease, color 0.2s; }
      .mini:hover { transform: scale(1.06); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35); }
      .mini:active { transform: scale(0.94); }
      .search-input { flex: 1; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 10px;
        padding: 7px 10px; background: rgba(0, 0, 0, 0.3); color: #fff; outline: none;
        transition: border-color 0.2s, box-shadow 0.2s; }
      .search-input::placeholder { color: rgba(255, 255, 255, 0.35); }
      .search-input:focus { border-color: rgb(var(--acc)); box-shadow: 0 0 0 1px rgb(var(--acc)); }
      .browser { width: 100%; height: 100%; display: flex; flex-direction: column; }
      .browser .close { position: absolute; top: 8px; right: 8px; z-index: 7; }
      .br-crumbs { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; font-size: 15px; font-weight: 600;
        color: rgba(255, 255, 255, 0.5); margin-bottom: 8px; padding-right: 30px; }
      .crumb { cursor: pointer; transition: color 0.15s; }
      .crumb:hover { color: rgba(255, 255, 255, 0.85); }
      /* 当前目录:金黄(与歌词当前行同色系),.dark 浅色封面下换琥珀保证对比 */
      .crumb.cur { color: #ffd400; font-weight: 600; }
      ha-card.dark .crumb.cur { color: #a3690a; }
      .crumb-sep { color: rgba(255, 255, 255, 0.3); }
      .br-refresh { margin-left: auto; background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.8);
        border: none; border-radius: 6px; padding: 2px 9px; font-size: 15px; line-height: 1.4; cursor: pointer; }
      .br-refresh:hover { background: rgba(255, 255, 255, 0.22); }
      .br-refresh:disabled { opacity: 0.5; cursor: default; }
      .br-search { display: flex; gap: 6px; margin-bottom: 8px; }
      /* 「本地/插件」搜索来源切换器:紧凑下拉,与搜索框同高同风格 */
      .br-src { flex: 0 0 auto; max-width: 118px; border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px; padding: 7px 6px; background: rgba(0, 0, 0, 0.3); color: #fff;
        outline: none; font-size: 12px; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; }
      .br-src:focus { border-color: rgb(var(--acc)); box-shadow: 0 0 0 1px rgb(var(--acc)); }
      .br-src option { background: #1b1b1f; color: #fff; }
      /* 远程结果「加入库」小按钮(与 .mini 播放按钮区分:更紧凑、主色描边) */
      .mini.imp { border-color: rgba(var(--acc), 0.55); color: rgb(var(--acc)); padding: 3px 6px; font-size: 11px; }
      .mini.imp:disabled { opacity: 0.5; cursor: default; }
      /* 远程结果平台标签(歌名后小徽标) */
      .rtag { display: inline-block; vertical-align: middle; margin-left: 6px; padding: 0 6px;
        border-radius: 6px; font-size: 10px; font-weight: 500; line-height: 1.7;
        background: rgba(0, 0, 0, 0.45); color: rgba(255, 255, 255, 0.85); }
      .br-list { overflow-y: auto; flex: 1; min-height: 0; min-width: 0; max-width: 100%;
        display: flex; flex-direction: column; scrollbar-width: thin; }
      /* 虚拟滚动:总高占位(level.total x ROW_STEP)+ 绝对定位窗口行;骨架行避免空白闪烁 */
      .vs-spacer { position: relative; width: 100%; }
      .vs-row { position: absolute; left: 0; right: 0; height: 48px; }
      .bitem.vs-skel { background: var(--panel-bg); border-radius: 8px; height: 38px; }
      .vs-more { position: sticky; bottom: 0; text-align: center; font-size: 12px; color: var(--fg-faint);
        padding: 5px; background: var(--panel-bg); border-radius: 8px; margin-top: 2px; }
      /* 媒体库根层级分类:图标在上、文字在下(类似 Windows 文件夹中等图标视图)。
         固定 3 列(6 分类 = 3x2),图标尺寸按可用高度 JS 自适应(见 _catIconSize),
         网格区域禁止滚动(overflow hidden),任何情况不出现上下/左右滚动条。
         卡片宽度用容器查询(cqi)自动算 = 列宽/1.06 − 10,保证 hover scale(1.06) 放大后
         不超列宽(余量 ~5px);justify-items:center 使卡片居中,不 stretch 占满列宽。 */
      .cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 8px 0;
        justify-items: center; container-type: inline-size; }
      .br-list.root-grid { overflow: hidden; }
      .cat { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 4px 10px;
        border: 1px solid var(--line); background: var(--panel-bg); color: var(--fg); border-radius: 12px;
        cursor: pointer; min-width: 0;
        /* 卡片宽 = 列宽/1.06 − 10(列宽=(100cqi−20)/3):hover 放大后不超列宽,且卡片饱满不缩成竖条 */
        width: calc((100cqi - 20px) / 3.18 - 10px); max-width: 100%; box-sizing: border-box;
        transition: background 0.2s, box-shadow 0.18s ease, transform 0.18s ease; }
      .cat .cat-ic { display: flex; align-items: center; justify-content: center; color: var(--ctl); }
      .cat .cat-ic.heart { color: rgb(var(--acc)); }
      .cat .cat-name { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
      .cat:hover { background: var(--ctl-hover); transform: scale(1.06); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35); }
      .cat:active { transform: scale(0.97); }
      .bitem { display: flex; align-items: center; gap: 8px; padding: 5px 6px; border-radius: 8px; transition: background 0.15s; }
      .bitem:hover { background: var(--ctl-hover); }
      .bthumb { width: 38px; height: 38px; border-radius: 8px; overflow: hidden; flex: 0 0 auto;
        background: var(--panel-bg); display: flex; align-items: center; justify-content: center;
        transition: box-shadow 0.2s, transform 0.12s; }
      .bthumb:hover { box-shadow: 0 0 0 2px rgba(var(--acc), 0.42); transform: scale(1.05); }
      .bthumb img { width: 100%; height: 100%; object-fit: cover; }
      .bcover-lazy:not([src]) { visibility: hidden; }
      .bnocover { font-size: 18px; color: var(--fg-faint); }
      .bmeta { min-width: 0; }
      .bt { font-size: 13px; color: var(--fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ba { font-size: 11px; color: var(--fg-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      /* 首页推荐:平台精选分区头(小标题 + 张数) */
      .bsec { display: flex; align-items: baseline; gap: 8px; padding: 10px 6px 2px; font-size: 12px; font-weight: 600; color: var(--fg); }
      .bsec-sub { font-size: 10px; font-weight: 400; color: var(--fg-faint); }
      /* 首页推荐:每日推荐(红)/本地推荐(蓝)角标 */
      /* 首页推荐:每日推荐(红)/本地推荐(蓝)角标。固定色,不依赖 --acc(默认白会导致白底白字隐形)。 */
      .plbadge { display: inline-block; margin-left: 6px; padding: 0 5px; border-radius: 4px; font-size: 9px; line-height: 14px; color: #fff; background: #ef4444; vertical-align: 1px; }
      .plbadge.local { background: #3b82f6; }
      /* 歌单页固定第一行「我喜欢的音乐」 */
      .bitem.pin-fav { border: 1px dashed var(--line); background: var(--panel-bg); margin-bottom: 4px; cursor: pointer; }
      .bitem.pin-fav .bthumb.fav { background: rgba(var(--acc), 0.16); color: rgb(var(--acc)); }
    `;
  }
}

customElements.define("hass-musicflow-card", MusicFlowRemoteCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "hass-musicflow-card",
  name: "MusicFlow Remote Card",
  description: localize().t("card.description"),
});
