#!/usr/bin/env node
/**
 * 客户端本机实例（local）链路守卫 —— 防止 v2.4.1 的修复被改回去。
 *
 * 背景：客户端实例（安卓 / Windows）经 `/status` 回传的东西和设备型 peer 不一样，
 * 卡片 v2.4.0 沿用了设备型的假设，于是出现「歌名恒为未知、无封面、进度/歌词反复
 * 回退、拖完进度条又跳回原位」。v2.4.1 修了这四类，但它们的共同点是
 * **静默退化**：不报错、不崩溃，只是显示不对，手测也容易当成"网络卡"。
 *
 * 所以这里不只查"函数还在不在"，还查**调用点是否真的接上了**
 * （例如 `_projectStatusPosition` 定义了却没人调，等于没修）。
 *
 * 另：v2.4.0 那次事故的根是「src 里改了、dist 没重建」——所以本守卫默认
 * **同时校验 dist 产物**，防止改了 src 忘记 `npm run build`。
 *
 * 用法：node tools/guard-client-link.mjs
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

// 1) 进度外推：客户端 position 是周期上报的采样，必须按 reportedAt 外推到此刻。
check(
  "进度外推函数 _projectStatusPosition 已定义",
  "客户端 ~4s 上报一次 position；不外推会把已在推进的时钟每 2s 拽回旧值（进度/歌词反复回退）",
  /_projectStatusPosition\s*\(/,
);
check(
  "_applyStatus 真的调用了外推函数（不是只定义不调用）",
  "定义了却不在赋值处调用 = 等于没修",
  /this\._ui\.currentTime\s*=\s*this\._projectStatusPosition\(/,
);
// 反向断言：currentTime 不得再直接写 status.position（那正是 v2.4.0 的形态）。
const directAssign = /this\._ui\.currentTime\s*=\s*status\.position/.test(src);
results.push({
  name: "currentTime 不得直接写 status.position",
  why: "直接写采样值 = v2.4.0 的回退 bug 本体",
  src: !directAssign,
  dist: dist ? !/currentTime\s*=\s*[a-z]\.position/.test(dist) : true,
});

// 2) seek 后丢弃陈旧上报：拖完进度条又被拽回原位。
check(
  "_seekIssuedAt 已声明并在 seek / 上一首 打点",
  "seek 后客户端要等下一个上报周期才回新位置；不丢弃旧采样会把进度条拽回 seek 之前",
  /this\._seekIssuedAt\s*=\s*Date\.now\(\)/,
);
check(
  "_applyStatus 按 reportedAt 丢弃 seek 之前的采样",
  "光打点不消费同样无效",
  /status\.reportedAt\s*<\s*this\._seekIssuedAt/,
  /reportedAt\s*<\s*this\._seekIssuedAt/,
);

// 3) now-playing 补全：local 的 /status 只回 media:{songId}，标题/封面在队列项里。
//    dist 经 rollup 压缩后局部变量名被改写（statusItem → n），但属性名保留，
//    故产物断言要针对压缩形态（`coverArt:n.coverArt||o.coverArt`）。
check(
  "补全对象逐字段以队列项为兜底（title / coverArt）",
  "不补全 = v2.4.0 的「歌名恒为未知 + 无封面」；只补一半字段同样会掉回「未知」",
  /title:\s*media\.title\s*\|\|\s*statusItem\.title/,
  /title:\s*[\w$]+\.title\s*\|\|\s*[\w$]+\.title/,
);
check(
  "封面同样以队列项为兜底",
  "标题补了但封面没补，卡片仍渲染不出封面",
  /coverArt:\s*media\.coverArt\s*\|\|\s*statusItem\.coverArt/,
  /coverArt:\s*[\w$]+\.coverArt\s*\|\|\s*[\w$]+\.coverArt/,
);
check(
  "补全走的是 status.items[currentIndex]",
  "标题/封面的权威来源是队列快照的当前项（与 Web 前端 peerPlayingTitle 同源）",
  /status\.items|statusItems/,
  /Array\.isArray\([\w$]+\.items\)/,
);

// 4) 游标兜底：currentIndex 不可用/越界时按客户端上报的 songId 反查。
check(
  "游标不可用时按 songId 反查当前项",
  "队列行未激活 / 越界时标题与封面又会掉回「未知」",
  /songId\s*===\s*sid|\.find\(\(it\)\s*=>\s*it\.songId/,
  /songId\s*===\s*[\w$]+\.songId/,
);

// 5) 边界：外推必须以 reportedAt 为判据（该字段只有 local 的 /status 才有），
//    否则会把设备型 peer 的实时值也拿去外推，设备链路跟着遭殃。
check(
  "外推以 reportedAt 为判据（保证只作用于客户端实例）",
  "缺了 reportedAt 门控会让 DLNA/AirPlay/Sendspin/群组走错分支",
  /status\.reportedAt|reportedAt/,
);

let failed = 0;
console.log("客户端本机实例（local）链路守卫\n");
for (const r of results) {
  const ok = r.src && r.dist;
  if (!ok) failed++;
  const tag = ok ? "✅" : "❌";
  const where = r.src ? (r.dist ? "" : "  (dist 缺失该逻辑!)") : "  (src 缺失该逻辑)";
  console.log(`${tag} ${r.name}${where}`);
  if (!ok) console.log(`     原因：${r.why}`);
}

console.log(
  `\n${results.length - failed}/${results.length} 通过` +
    (dist ? "（src + dist 双重校验）" : "（未找到 dist，跳过产物校验）"),
);
if (failed > 0) {
  console.error("\n客户端链路契约回归 —— 详见上表。");
  process.exit(1);
}
