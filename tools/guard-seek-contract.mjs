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

// 3) 设备型 peer 回跳：无 reportedAt 时按时间窗保护（DLNA Seek 生效慢，
//    实时查询读回的仍是旧值；旧实现要求 reportedAt<number> 才保护 = 设备永不保护）。
check(
  "seek 保护窗覆盖无 reportedAt 的设备型 peer",
  "只保 local = DLNA 拖后 2s 内必回跳一次",
  /typeof\s+status\.reportedAt\s*!==\s*"number"\s*\|\|/,
  /typeof\s+\w+\.reportedAt\s*!=\s*"number"\s*\|\|/,
);

// 4) 分母未知时不发 seek（否则点哪都是 seek 0 = 回开头）。
check(
  "duration 未知时直接 return，不发 seek",
  "队列/状态未到就拖 = 无论拖哪都回开头",
  /if\s*\(!\(dur\s*>\s*0\)\)\s*return;/,
  /if\(!\(\w+>0\)\)return/,
);

// 5) 尾部钳位：目标不得超过 duration - 0.5s（越界被渲染器拒收/跳开头）。
check(
  "seek 目标钳位到 duration - 0.5s",
  "拖到 100% 四舍五入超 duration = DLNA 拒收或跳开头",
  /dur\s*-\s*0\.5/,
  /-\.5>0\?/,
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
