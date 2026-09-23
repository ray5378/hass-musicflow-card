#!/usr/bin/env node
/**
 * 卡片 UI 契约守卫 —— 两组「静默退化」体质的问题,手测极易漏,钉死在 CI。
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
 * B. 群组「增减成员」管理态可用性契约
 *    用户拍板的三条性质,少一条就「遥控用不了 / 管理态粘住」:
 *    ① 点群组 chip = **同时**把遥控目标切到该群组(否则点群组只冒出圆圈,遥控还挂在
 *       别的设备上 ⇒ 「没办法选择遥控」);
 *    ② 勾选圈只改成员,**不得**改遥控目标(挑成员时不该顺手把遥控切走);
 *    ③ 管理态必须有出口:点空白处退出 + 10s 无操作自动退出,且管理态内的操作要重新
 *       计时(否则连着挑设备会被闹钟打断)。管理态是**临时浮层**,不是常驻模式。
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
const badgeRule = (text) => {
  const i = text.indexOf(".out-badge {");
  return i < 0 ? "" : text.slice(i, i + 400);
};
const badgeOk = (text) => {
  const block = badgeRule(text);
  return (
    /\.out-badge\s*\{[^}]*border:\s*\d+(?:\.\d+)?px\s+solid/.test(block) &&
    /\.out-badge\.in\s*\{[^}]*background:\s*rgb\(var\(--acc\)\)/.test(text)
  );
};
record(
  "A2 加入/退出勾选圈必须自带可见边框 + 已加入态实心",
  "底色随封面/idle 渐变变,无边框的空心圈在亮底上等于隐形",
  badgeOk(src),
  badgeOk(dist),
);

// ============ B. 群组管理态可用性 ============

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

const toggleManage = bodyOf(src, "_toggleGroupManage");
const toggleMember = bodyOf(src, "_toggleGroupMember");
const wrapClick = bodyOf(src, "_onWrapClick");

record(
  "B1 点群组 = 同时把遥控目标切到该群组",
  "只冒圆圈不切遥控 ⇒ 用户没法用卡片遥控群组",
  /_selectPeer\(p\.peerId\)/.test(toggleManage),
  true, // 行为契约只查 src(标识符会被 minify 改名)
);
record(
  "B2 勾选圈只改成员,不得改遥控目标",
  "挑成员时顺手把遥控切走 = 遥控状态被非预期改写",
  !/_selectPeer\(/.test(toggleMember),
  true,
);
record(
  "B3 管理态有出口:点空白处退出",
  "没有出口 ⇒ 管理态粘在界面上,勾选圈一直挂着",
  /_exitGroupManage\(\)/.test(wrapClick),
  true,
);
record(
  "B4 管理态有出口:10s 无操作自动退出",
  "用户明确要求的兜底出口(定时器常量 + 进入时挂载)",
  /const\s+GROUP_MANAGE_IDLE_MS\s*=\s*10000\s*;/.test(src) &&
    /_armGroupManageTimeout\(\)\s*;/.test(toggleManage),
  true,
);
record(
  "B5 管理态内的操作要重新计时",
  "不重置 ⇒ 连着挑第二个设备时被 10s 闹钟打断",
  /_armGroupManageTimeout\(\)/.test(toggleMember),
  true,
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
