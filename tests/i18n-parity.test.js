// i18n 对齐守卫:zh 与 en 语言包的 key 集合必须完全一致(多 key / 少 key 都判红)。
import { describe, it, expect } from "vitest";
import { zh } from "../src/localize/languages/zh.js";
import { en } from "../src/localize/languages/en.js";

describe("zh / en 语言包 key 对齐", () => {
  it("key 数量一致", () => {
    expect(Object.keys(en).length).toBe(Object.keys(zh).length);
  });

  it("en 无缺失 key", () => {
    const zhKeys = Object.keys(zh);
    const missing = zhKeys.filter((k) => !(k in en));
    expect(missing).toEqual([]);
  });

  it("en 无多余 key", () => {
    const enKeys = Object.keys(en);
    const extra = enKeys.filter((k) => !(k in zh));
    expect(extra).toEqual([]);
  });

  it("两包同 key 均非空字符串", () => {
    for (const k of Object.keys(zh)) {
      expect(typeof zh[k]).toBe("string");
      expect(zh[k].length).toBeGreaterThan(0);
      expect(typeof en[k]).toBe("string");
      expect(en[k].length).toBeGreaterThan(0);
    }
  });

  it("同名占位符集合一致(zh 与 en 的 {param} 对齐)", () => {
    const placeholders = (s) => (String(s).match(/\{[a-zA-Z0-9_]+\}/g) || []).sort().join(",");
    for (const k of Object.keys(zh)) {
      expect(placeholders(en[k])).toBe(placeholders(zh[k]));
    }
  });
});
