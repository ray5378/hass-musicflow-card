#!/usr/bin/env node
/**
 * 卡片 UI 契约守卫 —— 三组「静默退化」体质的问题,手测极易漏,钉死在 CI。
 *
 * A. CSS 自定义属性**类型**契约
 *    自定义属性是字面量替换:`rgb(var(--x))` / `rgba(var(--x), a)` 要求 --x 的值是
 *    `r, g, b` 三元组(可带第 4 位 alpha)。把**完整色值**塞进去 ——
 *    `--ctl: rgba(255,255,255,.85)` 却写 `rgba(var(--ctl), .45)` —— 属**无效值**:
 *    CSS 不报错,只在计算值阶段把**整条声明**作废。
 *    现场(2026-09-24):`.out-badge { border: 1.5px solid rgba(var(--ctl), .45) }` 整条
 *    border 变 unset(border-style:none)⇒ 点进群组后设备底下的「加入/退出」圆圈
 *    **直接消失**(已加入态因为是 accent 实心圈才看得见),用户看到的现象是
 *    「点了群组,没有任何圆圈,没办法加减成员」。同一类错误在任何 var 上都静默,
 *    所以按**类型**统一拦,而不是逐个修。
 *
 * B. 首页播放器 chip 行契约(2026-10-23 用户拍板)
 *    ① 点任何 chip(含群组)= **只切遥控目标**;
 *    ② 首页**不再**提供群组增减成员入口(勾选圈 / 管理提示条),成员加减只在整卡流转页;
 *    ③ 流转页的成员控件用**勾选 / 非勾选**表达(空心圈 = 未加入,accent 实心 ✓ = 已加入),
 *       位置沿用原「+/−」处。用户反馈:「加减号改为勾选和非勾选显示」。
 *
 * C. 播放端展示序契约(三端同一口径:**在播优先 → 类别 → 名称**)
 *    第一维度是「正在播」(服务端 queue.isActive),第二维度才是「类别」
 *    (本机 > 群组 > 独立播放器),最后按名称。这条口径在客户端与卡片之间
 *    **反复横跳过**:① 曾把「类别」提到最前变成「类别优先」(群组恒压过在播设备,
 *    用户明确否掉);② 曾两端各写一份比较器,改了一处就漂移。
 *    这类错误编译不报错、单看某一端也说得通 ⇒ 只能靠守卫静态钉住键序。
 *    (客户端侧同口径由 `tool/check-peer-order.mjs` + peer_order 单测锁。)
 *
 * E. 首页「打开速度」契约(2026-10-18)
 *    首页原为 5 路 Promise.all 齐等,慢两路(平台精选/本地随机,冷启动 2.5s+)不回就整屏不出
 *    (用户现象:「卡片加载了、封面迟迟不显示」)。现改为「阶段一只等快三路 + 慢两路 .then 后台
 *    追加」,并给首屏前 8 行封面 fetchpriority=high。纯体感提速改动,退化不报错、不红动态用例,
 *    故静态钉住:阶段一不含慢两路、慢两路非 await、回包比对 vSeq、首屏行封面优先。
 *
 * 用法：node tools/guard-card-ui.mjs
 * （先 npm run build —— A 组同时校验 dist 产物,防止重演「src 修了、dist 没重建」。）
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = join(root, "src", "musicflow-remote-card.js");
const distPath = join(root, "dist", "hass-musicflow-card.js");

// CSS 注释会原样进产物(rollup 只 minify JS,不 minify 模板里的 CSS)。
// 注释里提到 `rgba(var(--ctl)` 是「说明」不是「用法」—— 判红前必须剥掉,
// 否则守卫被自己的文档骗红(同 version-guard 的 hacs 注释坑)。
const stripCssComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "");
const src = stripCssComments(readFileSync(srcPath, "utf8"));
const dist = stripCssComments(existsSync(distPath) ? readFileSync(distPath, "utf8") : "");

/** dist 缺失时不做断言(CI 在 build 之后跑;本地未构建也允许)。 */
const hasDist = dist.length > 0;

const results = [];
function record(name, why, ok, okDist) {
  results.push({ name, why, ok, distOk: hasDist ? okDist : true });
}

// ============ A. CSS 变量类型 ============

/** `r, g, b` 或 `r, g, b, a` */
const TRIPLE = /^\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[\d.%]+\s*)?$/;

/** 收集 `--name: value` 定义(含内联 style 属性,故不只以 `;` 收尾)。
 *  ⚠️ 值里必须允许 `{`:`--acc: ${acc}` 是 JS 赋值的常见形态,把它当「不是定义」
 *  会误判成「未定义」而假红。 */
function collectVarDefs(text) {
  const defs = new Map(); // name -> { triple, dynamic, raw }
  const re = /--([a-z0-9-]+)\s*:\s*([^;\n"']*)/gi;
  let m;
  while ((m = re.exec(text))) {
    const name = m[1];
    const raw = m[2].trim();
    const dynamic = /\$\{|var\(/.test(raw); // JS 赋值(`--acc: ${acc}`)或二次转发 ⇒ 类型不可静态判定
    const prev = defs.get(name);
    defs.set(name, {
      dynamic: Boolean(prev?.dynamic) || dynamic,
      // 多处定义必须**全部**是三元组才算三元组
      triple: prev ? prev.triple && TRIPLE.test(raw) : TRIPLE.test(raw),
      raw: prev ? `${prev.raw} | ${raw}` : raw,
    });
  }
  return defs;
}

/** 找出所有被塞进 rgb()/rgba() 的变量,逐个核对类型。 */
function analyzeVarTyping(text) {
  const defs = collectVarDefs(text);
  const uses = new Set();
  const re = /rgba?\(\s*var\(\s*--([a-z0-9-]+)\s*\)/gi;
  let m;
  while ((m = re.exec(text))) uses.add(m[1]);
  const bad = [];
  for (const name of uses) {
    const def = defs.get(name);
    if (!def) { bad.push(`--${name}(未定义)`); continue; }
    if (def.dynamic) continue; // 由 JS 计算填写:类型在运行时才成立,静态放行
    if (!def.triple) bad.push(`--${name} = "${def.raw}"`);
  }
  return bad;
}

const srcBadVars = analyzeVarTyping(src);
const distBadVars = analyzeVarTyping(dist);
record(
  "A1 CSS 变量类型:rgb()/rgba() 内只许放三元组变量",
  "完整色值(如 --ctl: rgba(...))塞进 rgba(var(--x), a) 是无效值 ⇒ 整条声明静默作废",
  srcBadVars.length === 0,
  distBadVars.length === 0,
);
if (srcBadVars.length) console.log("   src 违规变量:", srcBadVars.join(" / "));
if (distBadVars.length) console.log("   dist 违规变量:", distBadVars.join(" / "));

// 勾选圈必须自带轮廓:底色随封面 / idle 渐变变化,没有边框的圈等于隐形。
// 首页的成员勾选圈已移除(2026-10-23),现在只剩流转页的 .tp-badge。
const badgeRule = (text) => {
  const i = text.indexOf(".tp-badge {");
  return i < 0 ? "" : text.slice(i, i + 500);
};
const badgeOk = (text) => {
  const block = badgeRule(text);
  return (
    /\.tp-badge\s*\{[^}]*border:\s*\d+(?:\.\d+)?px\s+solid/.test(block) &&
    /\.tp-badge\.in\s*\{[^}]*background:\s*rgb\(var\(--acc\)\)/.test(text)
  );
};
record(
  "A2 流转页成员勾选圈必须自带可见边框 + 已加入态实心",
  "底色随封面/idle 渐变变,无边框的空心圈在亮底上等于隐形",
  badgeOk(src),
  badgeOk(dist),
);

// 流转页「当前目标」= 外圈呼吸光环(2026-10-23 用户二次拍板):
//   ① 封面圆内**不再**放勾选标记(先前的 `.tp-cur` 白色小圆 + 红 ✓ 已删除);
//   ② 选中态靠一圈与客户端 `_ActivePulse` 同款的呼吸光环:56px 圆环从 1.0
//      放大到 1.26 并渐隐,1.2s ease-in-out 往返;
//   ③ 封面下方的频谱徽标底色固定,不随强调色/选择状态变化。
// ⚠️ 只取到本条规则的 `}` 为止:按固定长度切片会把下一条规则(比如 .tp-peer.drop
//    的 box-shadow)一起吞进来,导致「没有外环」的断言假红。
const ruleAt = (text, selector) => {
  const i = text.indexOf(selector);
  if (i < 0) return "";
  const j = text.indexOf("}", i);
  return j < 0 ? text.slice(i) : text.slice(i, j + 1);
};
const ringOk = (text) => {
  const pulse = ruleAt(text, ".tp-pulse {");
  const curRing = ruleAt(text, ".tp-peer.current .tp-ring {");
  const live = ruleAt(text, ".tp-live {");
  return (
    !/tp-cur/.test(text) && // 圆内勾选标记已彻底移除
    /class="tp-pulse"/.test(text) &&
    /border:\s*3px\s+solid\s+rgb\(var\(--acc\)\)/.test(pulse) &&
    /animation:\s*tp-pulse\s+1\.2s\s+ease-in-out\s+infinite\s+alternate/.test(pulse) &&
    /scale\(1\.26\)/.test(text) && // 关键帧放大到 1.26
    !/box-shadow/.test(curRing) && // 白色外环(以及任何外环阴影)不得回流
    !/background:\s*rgba\(var\(--acc\)/.test(live) && // 频谱底色不再跟强调色
    !/\.tp-peer\.current \.tp-live/.test(text)
  );
};
record(
  "A3 选中态=外圈呼吸光环(无圆内勾选)、频谱底色固定",
  "把红 ✓ / 白圈加回来,或让频谱底色跟着选中态换色 = 用户明确否掉的视觉回流(2026-10-23)",
  ringOk(src),
  ringOk(dist),
);

// 已加入群组的勾选圈仍为红色 ✓(与上一轮口径一致,勿随选中态改造被冲掉)。
const RED_CHECK = /color:\s*#ef4444/i;
record(
  "A4 已加入群组的勾选圈 ✓ 为红色",
  "改回白勾 = 用户明确否掉的视觉回流(2026-10-23)",
  RED_CHECK.test(ruleAt(src, ".tp-badge.in {")),
  RED_CHECK.test(ruleAt(dist, ".tp-badge.in {")),
);

// ============ B. 首页 chip 行:只切遥控目标,不做成员管理 ============

/** 取方法体(方法名须在行首缩进后出现,避免命中 `this._x(...)` 调用点)。 */
function bodyOf(text, name) {
  const re = new RegExp(`^(?:\\s*)(?:async\\s+)?${name}\\(`, "m");
  const m = re.exec(text);
  if (!m) return "";
  const start = text.indexOf("{", m.index);
  if (start < 0) return "";
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return text.slice(start);
}

const outputsBody = bodyOf(src, "_renderOutputs");

record(
  "B1 首页点任何 chip(含群组)只切遥控目标",
  "首页又冒成员管理入口 = 用户明确要求去掉的功能回流(2026-10-23)",
  /_selectPeer\(p\.peerId\)/.test(outputsBody) &&
    !/_toggleGroupManage/.test(src) &&
    !/groupManage/.test(src),
  true, // 行为契约只查 src(标识符会被 minify 改名)
);
record(
  "B2 首页不得渲染成员勾选圈 / 管理提示条",
  "勾选圈或提示行回流 = 首页 chip 行又变成临时管理浮层",
  // ⚠️ 不能笼统匹配 `gm-hint`:流转页的 `.tp-gm-hint` 是保留的,只拦首页那份 `class=\"gm-hint\"`。
  !/out-badge/.test(src) && !/groupManageHint/.test(src) && !/class="gm-hint"/.test(src),
  true,
);
record(
  "B3 成员管理只在流转页,且用勾选 / 非勾选表达",
  "改成 +/− 数字号或挪回首页都违背用户要求;空心圈 = 未加入,accent 实心 ✓ = 已加入",
  src.includes('class="tp-badge ${member ? "in" : ""}"') &&
    src.includes(">✓</button>") &&
    /_tpToggleMember\(/.test(src),
  true,
);

// ============ C. 播放端展示序(在播优先 → 类别 → 名称) ============

/** 取「方法**定义**」的函数体(src / dist 通用)。
 *  ⚠️ 不能用行首锚点:dist 是单行压缩产物,`^` 永远匹配不到;
 *  也不能用 `indexOf(name+"(")`:会先命中 `this._x(...)` 调用点。
 *  用「名字前没有 `.`」+ 紧跟参数表与 `{` 定位定义。 */
function defBody(text, name) {
  const re = new RegExp(`(?<![\\w.])${name}\\s*\\([^)]*\\)\\s*\\{`);
  const m = re.exec(text);
  if (!m) return "";
  const start = text.indexOf("{", m.index);
  if (start < 0) return "";
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return text.slice(start);
}

/** 键序契约:在播(playing) → 类别(rank) → 名称(localeCompare)。
 *  ⚠️ 必须查 **sort() 回调里的调用顺序**,不能查 lambda 的声明顺序 ——
 *  两个 lambda 都声明在 sort 之前,声明序恒为「在播在前」,调换回调里的比较
 *  照样会把口径变成「类别优先」而声明序不变(第一版就漏了这个)。
 *  只查**形态**:terser 会把 playing→e、rank→s,所以先解析出实际名字再比位置。 */
function orderOk(text) {
  const b = defBody(text, "_sortPeersForDisplay");
  if (!b) return false;
  // ⚠️ 不能用 `const\s+(\w+)` 找第二个 lambda:terser 把 `const a=…,b=…` 合并成
  //    一个 const,第二个名字前面没有 const。且 `[^;]*` 会跨逗号把第一个 lambda
  //    也匹配上 ⇒ 用不依赖 const、且不跨 `,` / `;` 的写法。
  const playingVar = /(\w+)\s*=\s*\(?\w*\)?\s*=>[^;,]*?\.isActive/.exec(b)?.[1];
  const kindVar = /(\w+)\s*=\s*\(?\w*\)?\s*=>[^;,]*?kind\s*===\s*"local"/.exec(b)?.[1];
  if (!playingVar || !kindVar || playingVar === kindVar) return false; // 形态不认识 ⇒ 保守判红
  const sortAt = b.indexOf(".sort(");
  if (sortAt < 0) return false;
  const cmp = b.slice(sortAt);
  const iPlaying = cmp.indexOf(`${playingVar}(`);
  const iKind = cmp.indexOf(`${kindVar}(`);
  const iName = cmp.indexOf("localeCompare");
  return iPlaying >= 0 && iKind > iPlaying && iName > iKind;
}
record(
  "C1 展示序键序:在播 → 类别 → 名称",
  "把「类别」提到最前 = 「类别优先」⇒ 群组恒压过在播设备(已被用户否掉的口径)",
  orderOk(src),
  orderOk(dist),
);

/** 类别权重:本机 0 < 群组 1 < 独立播放器 2。 */
function rankOk(text) {
  const b = defBody(text, "_sortPeersForDisplay");
  return (
    /kind\s*===\s*"local"\s*\?\s*0/.test(b) &&
    /kind\s*===\s*"group"\s*\?\s*1\s*:\s*2/.test(b)
  );
}
record(
  "C2 类别权重:本机 0 < 群组 1 < 独立播放器 2",
  "权重写错 ⇒ 群组/本机位置不对,且与客户端不同序",
  rankOk(src),
  rankOk(dist),
);

// ============ D. 遥控目标解析 + 追踪启动(2026-09-26 真机现场) ============
//
// 两条「静默退化」:都不报错、单看代码也说得通,只在真机上表现为「卡片不灵」。
//
// D-a 恢复选中态不启动追踪
//    `_pollTimer` / `_tickTimer` **只在 `_startTracking()` 里创建**,而 `_startTracking()`
//    原本全仓只有**一个**调用点 —— `_selectPeer()` 末尾。于是所有**不经过 `_selectPeer`**
//    的选中态来路都拿不到追踪:`_applyPeerSnapshot()` 的 localStorage 恢复分支、
//    `_ensurePeerSelected()` 的「已选中且在线」早退分支(`_refreshPeers` / `_probeServer`
//    的兜底刷新都走它)。
//    真机现场(192.168.10.249 上跑 2.4.12,重开 HA 客户端):恢复成本地存的设备后
//    `_pollTimer`/`_tickTimer` 均为 null、8 秒内 **0** 次状态拉取 ⇒ 进度条纹丝不动;
//    手动切一次设备再切回来立刻正常 —— 与用户描述的三条现象完全吻合。
//    修法:`_ensureTracking()`(幂等,缺才挂),在上述两条路径补调。
//
// D-b 被活跃组托管的成员设备没有收敛到组
//    服务端唯一出口 `decoratePeersForClient`(backend `src/services/access.ts`)已经给出
//    口径:成员设备行带 `managedByGroup: <groupId>`、且自身 `queue.isActive` 被强制 false,
//    注释写明「三端据此把成员渲染成『跟随某组』而不是『自己在放某首』」。
//    但**四个消费端一个都没消费它**(卡片 / Web / Flutter / 集成 grep 全空)⇒ 卡片仍允许
//    选中成员设备,而成员自身 `/status` 恒 STOPPED、position/duration 恒 0、`/queue` 恒空
//    ⇒ 只显示 0:00/0:00、进度不走;且对成员下发 play/pause/next 会经服务端
//    `detachFromActiveGroups` 把它从组里摘掉 ⇒ 对成员的「遥控」语义根本不成立。
//    修法:`_resolveControlPeerId()` 把被托管成员解析成它的组;`_selectPeer()` 入口与
//    `_applyPeerSnapshot()` 的恢复分支都过这道解析。

/** D-a:恢复路径必须补挂追踪,且 `_ensureTracking` 自身是「缺才挂」的精确形态。
 *  ⚠️ 曾一度只验 `_startTracking()` **调用在场** —— 变异验证立刻打脸:把调用改成
 *  `if (… && false) this._startTracking()`(文本仍在、行为已死)可静默通过。
 *  故这里钉**条件式本身**:`if (!this._pollTimer || !this._tickTimer) this._startTracking();`
 *  (dist 是 minify 产物,空白用 `\s*` 吸收;方法名/property 名不被 terser 改名。) */
const trackingWired = (text) =>
  /_ensureTracking\(\)/.test(defBody(text, "_applyPeerSnapshot")) &&
  /_ensureTracking\(\)/.test(defBody(text, "_ensurePeerSelected"));
/** src:钉**精确条件式** —— 能抓住「调用仍在场、却被 `&& false` 短路」这类变异
 *  (只验「_startTracking 出现过」的话,变异验证立刻打脸:文本在场、行为已死,静默通过)。 */
const trackStartStrict = (text) =>
  /if\s*\(\s*!this\._pollTimer\s*\|\|\s*!this\._tickTimer\s*\)\s*this\._startTracking\(\)\s*;/.test(
    defBody(text, "_ensureTracking"),
  );
/** dist:terser 会把 `if (x) return; if (y) z;` 折成短路表达式,实测产物是
 *  `t&&t.available===!1||(!this._pollTimer||!this._tickTimer)&&this._startTracking()`,
 *  精确形态不复存在。故 dist 只钉「缺计时器这个条件确实门控着 _startTracking」;
 *  若变异把它短路成死代码,terser 会直接删掉这个调用 ⇒ 仍判红。 */
const trackStartLoose = (text) =>
  /_pollTimer\s*\|\|\s*!this\._tickTimer[\s\S]{0,80}?this\._startTracking\(\)/.test(
    defBody(text, "_ensureTracking"),
  );
record(
  "D1 恢复/兜底选中态必须补挂追踪(缺才挂的精确形态)",
  "追踪只在 _selectPeer() 挂载 ⇒ 恢复分支绕过它:重开客户端后 poll/tick 均 null、8s 内 0 次拉取、进度冻结",
  trackingWired(src) && trackStartStrict(src),
  trackingWired(dist) && trackStartLoose(dist),
);

/** D-b:被托管成员 ⇒ 目标收敛到组。 */
const managedWired = (text) =>
  /managedByGroup/.test(defBody(text, "_managedGroupPeerId")) &&
  /_managedGroupPeerId\(/.test(defBody(text, "_resolveControlPeerId")) &&
  /_resolveControlPeerId\(/.test(defBody(text, "_selectPeer"));
record(
  "D2 被活跃组托管的成员设备必须收敛为控组",
  "成员 status 恒 STOPPED、queue 恒空 ⇒ 选中它只显示 0:00/0:00;对它下发 play/pause 还会经 detachFromActiveGroups 把它从组里摘掉",
  managedWired(src),
  managedWired(dist),
);

// ============ E. 首页两阶段加载 + 首屏封面优先(2026-10-18 打开提速) ============
//
// 用户现场:「卡片加载了,封面迟迟不显示」。根因是首页 `_fetchHomeItems` 把 5 路请求塞进
// 一个 Promise.all **齐等** —— 歌单/计数/固定卡(快)与平台精选/本地随机(冷启动 2.5s+)
// 一起 await,慢两路不回就整屏不出。改法与客户端发现页同思路:
//   E-a 阶段一只 await 快三路;慢两路另起一个 **非 await** 的 Promise.all,放 `.then` 后台追加
//       (复用虚拟滚动「失效首块 + 重载」就地补齐,不白屏)。
//   E-b 慢两路回包必须比对 level.vSeq 序号,不一致直接丢弃 —— 否则期间切 agent / 刷新 /
//       搜索会用旧数据覆盖新状态。
//   E-c 前 VS_PRIO_ROWS(=8) 行封面 fetchpriority=high,其余保持 loading=lazy —— 让浏览器
//       先取首屏可见的 8 张,而不是把视口附近的百来张同源封面一起排队(与 Web 首页同策略)。
//
// 这一整组是纯「体感提速」改动:退化回「5 路齐等 / 不比对序号 / 全 lazy」**不报错、
// 不红任何动态用例**,只会让首页悄悄变慢 —— 正是本守卫存在的理由。

const HOME_FETCH = "_fetchHomeItems";

/** 阶段一 Promise.all 只许含快三路;必须存在第二个(阶段二)Promise.all。 */
function homeStage1FastOnly(text) {
  const b = defBody(text, HOME_FETCH);
  if (!b) return false;
  const p1 = b.indexOf("Promise.all");
  if (p1 < 0) return false;
  const p2 = b.indexOf("Promise.all", p1 + 1);
  if (p2 < 0) return false; // 阶段二缺失 = 退回齐等
  const seg = b.slice(p1, p2); // 阶段一的内容
  return (
    /getPlaylistsV2/.test(seg) &&
    /getHomePlaylistCount/.test(seg) &&
    /getHomeCards/.test(seg) &&
    !/getRecommend\(/.test(seg) &&
    !/getLocalRecommend\(/.test(seg)
  );
}

/** 慢两路必须 defer 到 `.then`(不得 await),追加走 _appendHomeSections + _homeAll。 */
function homeStage2Deferred(text) {
  const b = defBody(text, HOME_FETCH);
  if (!b) return false;
  const p1 = b.indexOf("Promise.all");
  const p2 = p1 < 0 ? -1 : b.indexOf("Promise.all", p1 + 1);
  if (p2 < 0) return false;
  const tail = b.slice(p2);
  // 阶段二那个 Promise.all 的**前面**不得是 await(否则又变回阻塞首屏)
  const before = b.slice(Math.max(0, p2 - 16), p2);
  return (
    !/await\s*$/.test(before) &&
    /\.then\(/.test(tail) &&
    /_appendHomeSections\(/.test(tail) &&
    /_homeAll\s*=/.test(tail)
  );
}

/** 慢两路回包序号比对:不一致必须 return(src/dist 同为 `!== (x.vSeq || 0)) return`)。 */
function homeSeqGuard(text) {
  const b = defBody(text, HOME_FETCH);
  return /!==\s*\(\s*[\w$]+\.vSeq\s*\|\|\s*0\s*\)\s*\)\s*return/.test(b) && /_homeSlowSeq/.test(b);
}

/** 首屏封面优先:prio 输出 high + prio 透传到 _coverImgTag + 前 N 行按行号取优先。 */
function coverPriority(text) {
  const imgBody = defBody(text, "_coverImgTag");
  const rowBody = defBody(text, "_renderBrowserItem");
  return (
    /fetchpriority=\$\{[^}]*\?\s*["']high["']\s*:\s*[^}]*\}/.test(imgBody) &&
    /_coverImgTag\([^)]*,[^)]*\)/.test(rowBody) &&
    /_renderBrowserItem\([^,]+,\s*[\w$]+\s*<\s*[\w$]+\s*\)/.test(text)
  );
}

record(
  "E1 首页阶段一只等快三路(歌单/计数/固定卡),慢两路不得进首屏 Promise.all",
  "5 路齐等 ⇒ 冷启动时慢请求(2.5s+)不回,整屏不出(用户现象「卡片加载了、封面迟迟不显示」)",
  homeStage1FastOnly(src),
  homeStage1FastOnly(dist),
);
record(
  "E2 慢两路 defer 到 .then 后台追加(_appendHomeSections + _homeAll),不得 await",
  "回到 await 齐等 = 首屏重新被慢请求阻塞",
  homeStage2Deferred(src),
  homeStage2Deferred(dist),
);
record(
  "E3 慢两路回包比对 vSeq 序号,不一致丢弃",
  "不比对 ⇒ 期间切 agent/刷新/搜索会被旧回包覆盖新状态(列表错位、刷新回退)",
  homeSeqGuard(src),
  homeSeqGuard(dist),
);
record(
  "E4 首屏前 N 行封面 fetchpriority=high,其余保持 lazy",
  "全部 lazy ⇒ 视口附近百来张同源封面一起排队,首屏封面迟迟不显示",
  coverPriority(src),
  coverPriority(dist),
);

// ============ 汇总 ============
let failed = 0;
for (const r of results) {
  const ok = r.ok && r.distOk;
  if (!ok) failed++;
  const mark = ok ? "PASS" : "FAIL";
  const where = ok ? "" : `(src:${r.ok ? "ok" : "bad"} dist:${r.distOk ? "ok" : "bad"})`;
  console.log(`[${mark}] ${r.name} ${where}`);
  if (!ok) console.log(`       why: ${r.why}`);
}
console.log(
  failed
    ? `\n卡片 UI 契约守卫:${failed}/${results.length} 条不通过。`
    : `\n卡片 UI 契约守卫:${results.length}/${results.length} 条通过。`,
);
process.exit(failed ? 1 : 0);
