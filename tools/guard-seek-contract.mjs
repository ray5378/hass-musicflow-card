#!/usr/bin/env node
/**
 * 拖动进度条（seek）契约守卫 —— 防止本轮四连修被改回去。
 *
 * 背景：卡片 `_seek` 曾是 `@input` 逐像素直发 POST（一次拖拽数十个 seek，
 * DLNA 在 TRANSITIONING 窗内乱序/丢弃 → 拖后停住/定位乱跳）；拖拽中 tick 与
 * 轮询覆盖手指值（跟手打架）；设备型 peer 无 reportedAt 导致 2s 轮询必回跳一次；
 * duration 未知时 seek(0)（点哪都回开头）；尾部越界被渲染器拒收。
 *
 * 它们的共同点和 client-link 一样是**静默退化**：不报错，只是拖不动/跳变，
 * 手测易当成"网络卡"，所以在 CI 钉死。只查"函数在不在"不够，要查调用点接线。
 *
 * 追加(2026-09-22):「精度」规则 —— 下发目标必须整秒(最小粒度 1 秒)。
 *   非整秒目标会让服务端 sendspin 子进程按 25ms 帧栅格取帧时与窗口的毫秒基准
 *   错位，陷入纯微任务自旋被 65s 看门狗 SIGKILL(拖完进度条播放静默死掉，
 *   而客户端(下发整秒)一直正常)。
 *
 * 追加(2026-09-23):「跟手可见性」规则 —— 进度小圆点必须按 property 回写。
 *   `value="${prog}"` 是**属性**绑定,属性只写 defaultValue;range 一经用户交互即置位
 *   脏值标志,此后属性写入被忽略 ⇒ 拖动之后小圆点永久冻结,而填充条(内联 style 渐变)
 *   照常前进。真实 Chromium 复现见下方用例 8 注释。属纯静默回归,故入 CI。
 *
 * 用法：node tools/guard-seek-contract.mjs
 * （先 npm run build，dist 同步校验，防止 src 修了 dist 没重建。）
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = join(root, "src", "musicflow-remote-card.js");
const distPath = join(root, "dist", "hass-musicflow-card.js");

const src = readFileSync(srcPath, "utf8");
const dist = existsSync(distPath) ? readFileSync(distPath, "utf8") : "";

/** @type {{name: string, why: string, src: boolean, dist: boolean}[]} */
const results = [];

function check(name, why, srcRe, distRe) {
  results.push({
    name,
    why,
    src: srcRe.test(src),
    // dist 缺失时不做断言（CI 会在 build 之后跑，本地未构建也允许）
    dist: dist ? (distRe || srcRe).test(dist) : true,
  });
}

function checkAbsent(name, why, srcRe, distRe) {
  results.push({
    name,
    why,
    src: !srcRe.test(src),
    dist: dist ? !(distRe || srcRe).test(dist) : true,
  });
}

/** 函数级断言：正则表达不了的（如“某调用只许出现在某回调内”）走回调。 */
function checkFn(name, why, fn) {
  let srcOk = false;
  let distOk = false;
  try {
    ({ src: srcOk, dist: distOk } = fn(src, dist));
  } catch (e) {
    console.log(`      断言执行异常：${e.message}`);
  }
  results.push({ name, why, src: !!srcOk, dist: dist ? !!distOk : true });
}

// 1) seek 风暴：@input 必须经 debounce 再发 POST，一次拖拽只发最后一次。
check(
  "_seek 经 250ms debounce 再发 POST（_seekTimer）",
  "逐像素直发 = DLNA TRANSITIONING 窗内乱序/丢弃，拖后停住或定位乱跳",
  /this\._seekTimer\s*=\s*setTimeout\(/,
  /this\._seekTimer\s*=\s*setTimeout/,
);
// POST 只许出现在 debounce 回调内：_seek 函数体里 setTimeout 之前的部分
// 不得出现 _client.seek（否则就是同步直发，风暴本体）。
checkFn(
  "_seek 的 POST 只在 debounce 回调内（setTimeout 之前无直调）",
  "同步直调 = 风暴本体；_seek 入口到 setTimeout 之间出现 _client.seek 即退化",
  (srcText, distText) => {
    const srcFn = srcText.match(/_seek\(e\)\s*\{[\s\S]*?\n  \}/);
    const srcHead = srcFn ? srcFn[0].split("setTimeout")[0] : "";
    const distFn = distText.match(/_seek\(e\)\{[\s\S]*?\},250\)/);
    const distHead = distFn ? distFn[0].split("setTimeout")[0] : "";
    return {
      src: srcHead.length > 0 && !srcHead.includes("_client.seek"),
      dist: distHead.length > 0 && !distHead.includes("_client.seek"),
    };
  },
);

// 2) 拖拽跟手：拖拽中 tick 与轮询不得覆盖手指值（对标 volDragging）。
check(
  "拖拽标志 seekDragging 在 _seek 置位",
  "无标志 = tick 每 250ms +0.25 把手上的值顶走，滑块跟手抖",
  /this\._ui\.seekDragging\s*=\s*true/,
  /seekDragging=!0/,
);
check(
  "tick 遇 seekDragging 直接返回",
  "只置位不消费 = 等于没修",
  /if\s*\(\s*this\._ui\.seekDragging\s*\)\s*return;/,
  /seekDragging\|\|/,
);
check(
  "_applyStatus 遇 seekDragging 跳过位置覆盖",
  "2s 轮询同样会把手指值顶回去",
  /!this\._ui\.seekDragging/,
  /!this\._ui\.seekDragging/,
);

// 3) seek 保护用 MA 因果判定(无固定窗口,2026-09-22 改制):
// ①fetchStale:seek 响应返回之前发起的拉取一律丢弃(设备型 peer 唯一判据);
// ②sampleStale:reportedAt 早于下发时刻的采样丢弃。拖拽中一律不覆盖。
check(
  "fetchStale:响应返回前发起的拉取丢弃(设备型 peer 判据)",
  "无此条 = DLNA 拖后,响应前的在途拉取把旧位置写回来",
  /_lastFetchStartedAtMs\s*<\s*this\._seekAckAtMs/,
  /_lastFetchStartedAtMs\s*<\s*\w+\._seekAckAtMs/,
);
check(
  "sampleStale:reportedAt 早于下发时刻的采样丢弃",
  "无此条 = 客户端实例的滞后上报把手指值顶回去",
  /status\.reportedAt\s*<\s*this\._seekIssuedAt/,
  /reportedAt<this\._seekIssuedAt/,
);

// 4) 分母未知时不发 seek（否则点哪都是 seek 0 = 回开头）。
// 走 checkFn 而非字面正则：这条早退路径**允许先打一行诊断日志再 return**
// ——「拖了没反应」最常见的成因就是分母还是 0，静默早退不可观测才是真问题，
// 所以不能把 `if (!(dur > 0)) return;` 这种排版钉死。要钉的是语义：
// 「条件成立 → 首个 return」这段路径上不得出现 seek 调用。
checkFn(
  "duration 未知时直接 return，不发 seek",
  "队列/状态未到就拖 = 无论拖哪都回开头",
  (srcText, distText) => {
    // 截取「条件判断 → 首个 return」之间的一段，这段即早退路径本体。
    const earlyExitPath = (text, re) => {
      const m = text.match(re);
      if (!m) return null;
      const seg = text.slice(m.index);
      const retIdx = seg.indexOf("return");
      return retIdx < 0 ? null : seg.slice(0, retIdx);
    };
    const s = earlyExitPath(srcText, /if\s*\(!\(dur\s*>\s*0\)\)/);
    const d = earlyExitPath(distText, /if\(!\(\w+>0\)\)/);
    // 必须真有 return，且它之前不得出现方法调用形态的 seek（`.seek(` 兼容
    // dist 压缩后 this._client 被重命名的情形）。
    const ok = (seg) => seg !== null && !seg.includes(".seek(");
    return { src: ok(s), dist: ok(d) };
  },
);

// 5) 尾部钳位：目标不得超过 duration - 0.5s（越界被渲染器拒收/跳开头）。
check(
  "seek 目标钳位到 duration - 0.5s",
  "拖到 100% 四舍五入超 duration = DLNA 拒收或跳开头",
  /dur\s*-\s*0\.5/,
  /-\.5>0\?/,
);

// 6) 换歌清 seek 标记:旧目标/窗口属于上一首,新歌开头的正常 0 采样若被
// 旧窗口屏蔽会冻住进度。新歌与 seek 紧邻到达时必现,属高频回归点。
check(
  "换歌时清 seek 标记(issued/ack/dragging)",
  "不清 = 新歌开头被旧 seek 窗屏蔽,进度冻住不动",
  /if\s*\(changed\s*&&\s*song\.songId\)\s*\{[^}]*_seekIssuedAt\s*=\s*0/s,
  /_seekIssuedAt=0,this\._seekAckAtMs=0/,
);

// 7) 精度(最小粒度 1 秒,2026-09-22 事故):下发目标必须是整秒。
//
// 背景:服务端 sendspin 流式引擎按 25ms 帧栅格取帧(lo = floor(pos/25)*2400),
// 窗口基准却是「毫秒 → 样本」换算 —— 只有目标为 25ms 整数倍时两者相等。整秒必然
// 满足(1000 / 25 = 40);而卡片下发的是 (pct/100)*duration 的浮点值(如 31.178),
// 会让子进程每轮取帧都判淘汰、游标却不前进 → 纯微任务自旋 → 事件循环饿死 →
// 心跳超时被 65s 看门狗 SIGKILL(现场=「拖完进度条播放静默死掉,客户端却正常」)。
//
// 已做变异验证:把 `const t = alignSeekSeconds(clamped)` 改回 `= clamped`,本用例转红。
checkFn(
  "seek 下发目标经整秒对齐(最小粒度 1 秒)",
  "非整秒目标 = 子进程微任务自旋被看门狗强杀(拖完进度条播放静默死掉,手测易当网络卡)",
  (srcText, distText) => {
    // src:① 对齐函数在,且实现为向下取整;② _seek 里的目标值由它产出
    // (乐观值 _ui.currentTime 与下发值同源,否则轮询一回就把手指值拽回)。
    const srcFn = srcText.match(/_seek\(e\)\s*\{[\s\S]*?\n  \}/);
    const src = !!srcFn
      && /function alignSeekSeconds\s*\(/.test(srcText)
      && /SEEK_GRANULARITY_SEC\s*=\s*1\b/.test(srcText)
      && /const t = alignSeekSeconds\(/.test(srcFn[0]);
    // dist:rollup+terser 会把对齐器内联折叠(常量 1 折叠后只剩 Math.floor),
    // 名字也被 mangle,故这里查**形态**而不是名字:
    //   ① 钳位之后的目标值必须是**某个函数调用**的返回值(不是裸的钳位值);
    //   ② 产物里存在整秒对齐的折叠体(Math.max(0, Math.floor(...)))。
    // 目的:挡住「src 修了、dist 没重建」—— 该仓库 dist 入仓,漏重建会静默退化。
    const distFn = distText.match(/_seek\(e\)\{[\s\S]*?\},250\)/);
    const dist = !!distFn
      && /=\s*Math\.min\(Math\.max\(0,[\s\S]{0,80}?\),\w+=\w+\(\w+\)/.test(distFn[0])
      && /Math\.max\(0,Math\.floor\(/.test(distText);
    return { src, dist };
  },
);

// 8) 滑块圆点必须与填充条同源(2026-09-23 事故):拖过进度条后小圆点冻结。
//
// 背景:模板 `value="${prog}"` 是**属性**绑定,属性只写 defaultValue;按 HTML 规范,
// value 内容属性**仅在脏值标志(dirty value flag)为假时**才同步到控件当前值,而
// range 一经用户交互(拖动/点击)即置位该标志 ⇒ 首次交互之后所有属性写入被忽略,
// 小圆点永远停在手指松开处;填充条走内联 style 渐变(不受脏值标志影响)⇒ 现场即
// 「填充条在动、小圆点留在原地」。真实 Chromium 实测三连:
//   ①全新元素 + 只改属性 60 → 60(首次渲染本来就生效,故平时看不出问题)
//   ②拖过一手 + 改属性 60   → 仍停在 40(失效 = 事故现场)
//   ③拖过一手 + 改 property 60 → 60(改用 property 即恢复)
//
// 该回归同样是**纯静默**体质(不报错、不跳变,只是不动),手测极易当成渲染卡顿,
// 故在 CI 钉死四件事:
//   ① 渲染后按 **property** 回写(只在模板里改属性 = 没修);
//   ② 回写在 updated() 生命周期里接线(定义了不调用 = 等于没修);
//   ③ 拖拽中不回写(与指针抢位);
//   ④ 填充与圆点取自**同一个**百分比函数(两处各算一遍就会再次走偏)。
checkFn(
  "进度圆点按 property 回写,且与填充条同源",
  "range 的 value 属性绑定在首次交互后失效 = 圆点冻结、填充条独走(纯静默,手测易当渲染卡顿)",
  (srcText, distText) => {
    const fn = srcText.match(/_syncSeekThumb\(\)\s*\{[\s\S]*?\n  \}/);
    // ④ 同源函数在,且**渲染侧**确实调它 —— 必须锚在 render() 里:
    //    _syncSeekThumb 体内也有一行同样的取值,不锚住就会把「渲染侧退回各算一遍」
    //    误判成通过(变异验证时发现的假绿)。区域取 render() 到下一个方法之间。
    const rs = srcText.indexOf("\n  render() {");
    const re = srcText.indexOf("\n  _renderOutputs()");
    const renderRegion = rs >= 0 && re > rs ? srcText.slice(rs, re) : "";
    const src = !!fn
      && /_progressPct\(\)\s*\{/.test(srcText)
      && !!renderRegion && /const prog = this\._progressPct\(\)/.test(renderRegion)
      // ① 回写走的是 property(给 input 的 .value 赋值),不是 setAttribute
      && /\.value\s*=\s*String\(/.test(fn[0])
      // ④b 回写侧的值也必须取自同一个 _progressPct(自己再算一遍 = 又埋一个真相)
      && /this\._progressPct\(\)/.test(fn[0])
      // ③ 拖拽中直接 return,不写
      && /if\s*\(this\._ui\.seekDragging\)\s*return;/.test(fn[0])
      // ② updated() 里有接线
      && /updated\(\)\s*\{[\s\S]*?this\._syncSeekThumb\(\)/.test(srcText);
    // dist:esbuild minify 只 mangle 局部变量,成员名(属性)保留 → 可按名字查形态;
    // 局部变量名会被 mangle,故 property 回写只查形态 `.value=`。
    // 渲染侧同源用**出现次数**判:定义 + 渲染调用 + 回写调用 = 3 处,少一处即说明
    // 有人把其中一侧改回各算一遍(名字被 mangle,无法按上下文定位)。
    const at = distText.indexOf("_syncSeekThumb(){");
    const win = at >= 0 ? distText.slice(at, at + 800) : "";
    const pctUses = (distText.match(/_progressPct/g) || []).length;
    const dist = !!distText
      && at >= 0                                   // 方法本体在产物里
      && /this\._syncSeekThumb\(\)/.test(distText)  // 且被调用(接线)
      && pctUses >= 3                               // 同源:定义 + 渲染侧 + 回写侧
      && /\.value=/.test(win);                      // property 回写在方法体内
    return { src, dist };
  },
);

let failed = 0;
for (const r of results) {
  const ok = r.src && r.dist;
  if (!ok) failed += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"} [src:${r.src ? "ok" : "MISS"} dist:${r.dist ? "ok" : "MISS"}] ${r.name}`,
  );
  if (!ok) console.log(`      为何重要：${r.why}`);
}
if (failed > 0) {
  console.error(`\n${failed} 条 seek 契约被破坏，禁止合入。`);
  process.exit(1);
}
console.log("\nseek 契约全部成立。");
