#!/usr/bin/env node
// idle 底色配色体检 + 环序优化。
//
// 直接解析 src/musicflow-remote-card.js 里的 IDLE_GROUPS,不在这里重复维护配色表 ——
// 唯一数据源永远是源码,改了配色直接重跑本脚本即可。
//
// 用法:
//   node tools/palette/check.cjs          # 体检:逐色 Lab / 相对亮度 Y、最像的若干对、环上相邻 ΔE
//   node tools/palette/check.cjs --order  # 在体检基础上,再跑环序优化并打印建议顺序
//
// 为什么用 Lab ΔE*ab 而不是色相差:
//   低彩度色(C* 只有 20 出头)的色相必须拉开很大才分得开,而高彩度色差 30° 就已经很不一样。
//   "两组看着像不像"只有 ΔE 这个感知距离说得准。经验阈值:
//     ΔE < 20 偏像(会被看成同一族),20~30 勉强分得开,> 40 是明确的不同色,> 60 是强跳变。
//
// 不变量(改配色后必须依然成立):
//   ① 环上**相邻**两组的最小 ΔE 足够大(本项目基线 65.7,别低于 ~40,否则换色会"糊");
//   ② 每组的相对亮度 Y 落在既定的几个档位上(峰 .175 / .140 / .110 / .085 / 谷 .070),
//      这样相邻两组同时吃到"换色 + 换明暗"两重变化;
//   ③ 最亮那组的 Y 上限 ≈0.183 —— 再亮,白字对比度就跌破 WCAG AA 4.5:1。

const fs = require("fs");
const path = require("path");

// ---------- 色彩数学(sRGB -> Lab / 相对亮度) ----------
function s2l(v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
function hex2rgb(h) {
  let s = h.replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
// WCAG 相对亮度 Y(注意:和 Lab 的 L* 不是一回事,这里定标用的是 Y)。
function relY(hx) {
  const [R, G, B] = hex2rgb(hx);
  return 0.2126 * s2l(R) + 0.7152 * s2l(G) + 0.0722 * s2l(B);
}
function lab(hx) {
  const [R, G, B] = hex2rgb(hx), r = s2l(R), g = s2l(G), b = s2l(B);
  const X = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const Y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  const Z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X / 0.95047), fy = f(Y), fz = f(Z / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function dE(a, b) {
  const A = lab(a), B = lab(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
}
// 白字落在某底色上的对比度(Y 是相对亮度)。
function whiteContrast(hx) { return 1.05 / (relY(hx) + 0.05); }

// ---------- 从源码读 IDLE_GROUPS ----------
const SRC = path.join(__dirname, "..", "..", "src", "musicflow-remote-card.js");
function loadGroups() {
  const text = fs.readFileSync(SRC, "utf8");
  const block = text.match(/const IDLE_GROUPS = \[([\s\S]*?)\n\];/);
  if (!block) throw new Error("在 src 里没找到 IDLE_GROUPS —— 解析模式需要跟着源码改。");
  const out = [];
  const re = /\{\s*c1:\s*"(#[0-9a-fA-F]{3,6})",\s*c2:\s*"(#[0-9a-fA-F]{3,6})"\s*\}\s*,?\s*(?:\/\/\s*(\S+))?/g;
  let m;
  while ((m = re.exec(block[1]))) out.push({ c1: m[1], c2: m[2], name: m[3] || "?" });
  if (!out.length) throw new Error("IDLE_GROUPS 解析出 0 组 —— 条目格式变了?");
  return out;
}

// 环评分:首要目标最大化"相邻最小 ΔE",并列时比 ΣΔE。
function ringScore(ring) {
  const N = ring.length;
  let min = Infinity, sum = 0;
  for (let i = 0; i < N; i++) {
    const d = dE(ring[i].c1, ring[(i + 1) % N].c1);
    if (d < min) min = d;
    sum += d;
  }
  return [min, sum];
}
// 随机重启 + 2-opt / 交换邻域的爬山(纯确定性:固定种子,可复现)。
function optimizeRing(groups, restarts = 600, seed0 = 20260915) {
  const N = groups.length;
  let seed = seed0;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  let best = null, bestMin = -1, bestSum = -1;
  for (let r0 = 0; r0 < restarts; r0++) {
    const r = groups.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    let improved = true;
    while (improved) {
      improved = false;
      let [bs, bt] = ringScore(r), bi = -1, bj = -1;
      for (let i = 1; i < N; i++) for (let j = i + 1; j < N; j++) {
        const t = r[i]; r[i] = r[j]; r[j] = t;
        const [s, tt] = ringScore(r);
        r[j] = r[i]; r[i] = t;
        if (s > bs + 1e-9 || (Math.abs(s - bs) < 1e-9 && tt > bt + 1e-9)) { bs = s; bt = tt; bi = i; bj = j; }
      }
      if (bi >= 0) { const t = r[bi]; r[bi] = r[bj]; r[bj] = t; improved = true; }
    }
    const [s, t] = ringScore(r);
    if (s > bestMin + 1e-9 || (Math.abs(s - bestMin) < 1e-9 && t > bestSum)) { bestMin = s; bestSum = t; best = r.slice(); }
  }
  return { ring: best, min: bestMin, sum: bestSum };
}

// ---------- 主流程 ----------
const pad = (s, n) => String(s).padStart(n);
function main() {
  const groups = loadGroups();
  const N = groups.length;

  // 自检:黑 vs 白 的 ΔE 应当正好是 100,标定数学没错。
  const san = dE("#000000", "#FFFFFF");
  console.log(`组数 N = ${N}   自检 黑vs白 ΔE=${san.toFixed(1)} ${Math.abs(san - 100) < 0.5 ? "(ok)" : "(!! 数学有问题)"}`);

  console.log("\n=== 逐组 ===   Y = 相对亮度(越小越暗);  c1→c2 ΔE 是组内两端差距(别太大,否则一格里有两块颜色)");
  for (const g of groups) {
    const [, a, b] = lab(g.c1);
    const C = Math.hypot(a, b);
    const h = ((Math.atan2(b, a) * 180 / Math.PI) % 360 + 360) % 360;
    const cnt = whiteContrast(g.c1);
    console.log(
      `  ${g.name.padEnd(3)} ${g.c1} Y=${relY(g.c1).toFixed(3)} L*=${pad(lab(g.c1)[0].toFixed(0), 3)} C*=${pad(C.toFixed(0), 3)} h=${pad(h.toFixed(0), 3)}` +
      `   c2 ${g.c2}  组内ΔE=${pad(dE(g.c1, g.c2).toFixed(1), 5)}  白字对比=${cnt.toFixed(2)}:1 ${cnt >= 4.5 ? "" : "← 跌破 AA!"}`
    );
  }

  // 全表两两 ΔE 的最小若干对(不看环,纯看有没有"撞色")。
  const pairs = [];
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) pairs.push({ a: groups[i], b: groups[j], d: dE(groups[i].c1, groups[j].c1) });
  pairs.sort((x, y) => x.d - y.d);
  console.log("\n=== 最像的 8 对(全局,不限相邻)===");
  for (const p of pairs.slice(0, 8)) {
    const tag = p.d < 20 ? "  ← 偏像,会被看成同一族" : p.d < 30 ? "  ← 勉强分得开" : "";
    console.log(`  ${p.a.name.padEnd(3)} vs ${p.b.name.padEnd(3)} ΔE=${pad(p.d.toFixed(1), 5)}${tag}`);
  }

  // 当前环(源码里的顺序)相邻 ΔE —— 这是最关键的一段。
  console.log("\n=== 当前环顺序(源码里的顺序)相邻 ΔE ===");
  let curMin = Infinity, curSum = 0;
  for (let i = 0; i < N; i++) {
    const a = groups[i], b = groups[(i + 1) % N];
    const d = dE(a.c1, b.c1);
    if (d < curMin) curMin = d;
    curSum += d;
    const y = Math.abs(relY(a.c1) - relY(b.c1));
    console.log(`  ${a.name.padEnd(3)} ${a.c1} Y=${relY(a.c1).toFixed(3)}  →  ${b.name.padEnd(3)} ${b.c1} Y=${relY(b.c1).toFixed(3)}   ΔE=${pad(d.toFixed(1), 5)}  ΔY=${y.toFixed(3)}`);
  }
  const lg = pairs.find((p) => true);
  const adjSet = new Set();
  for (let i = 0; i < N; i++) {
    const s = [groups[i].name, groups[(i + 1) % N].name].sort().join("|");
    adjSet.add(s);
  }
  const weakestGlobal = pairs[0];
  const weakestAdjacent = adjSet.has([weakestGlobal.a.name, weakestGlobal.b.name].sort().join("|"));
  console.log(`\n  相邻最小 ΔE = ${curMin.toFixed(1)}   ΣΔE = ${curSum.toFixed(0)}`);
  console.log(`  全局最像的一对是 ${weakestGlobal.a.name} vs ${weakestGlobal.b.name} (ΔE ${weakestGlobal.d.toFixed(1)})` +
    `  —— ${weakestAdjacent ? "!! 它俩正好相邻,请重排环" : "好在它俩在环上不相邻"}`);
  console.log(`  判定:${curMin >= 40 ? "环很干净,换色是明确跳变" : curMin >= 30 ? "可用,但有两组换色时会有点糊" : "偏弱,建议跑 --order 重排"}`);

  if (process.argv.includes("--order")) {
    const opt = optimizeRing(groups);
    console.log(`\n=== 建议环顺序(随机重启爬山 + 交换邻域,种子固定、结果可复现)===\n  最优 min 相邻 ΔE = ${opt.min.toFixed(1)}   ΣΔE = ${opt.sum.toFixed(0)}`);
    console.log("  " + opt.ring.map((g) => g.name).join(" → ") + ` →(回 ${opt.ring[0].name})`);
    console.log("");
    for (let i = 0; i < N; i++) {
      const a = opt.ring[i], b = opt.ring[(i + 1) % N];
      console.log(`  ${a.name.padEnd(3)} ${a.c1} → ${b.name.padEnd(3)} ${b.c1}   ΔE=${dE(a.c1, b.c1).toFixed(1)}`);
    }
    console.log(`\n  代码里 IDLE_GROUPS 的排列请照抄上面的顺序(源码注释里也记了这条)。`);
  }
}

main();
