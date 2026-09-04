// MusicFlow Remote Card — 语言选择 + 文案读取。
// 严格跟随 HA 前端系统语言:zh 开头用中文、其余用英文;不提供任何手动切换入口。
// 缺 key/缺语言包时回退中文默认;仍缺则显示 key 本身。
import { zh } from "./languages/zh.js";
import { en } from "./languages/en.js";
const LANGS = { zh, en };
function resolveLang(hassLang) {
  const lang = hassLang || (typeof navigator !== "undefined" ? navigator.language : "") || "";
  return String(lang).toLowerCase().startsWith("zh") ? "zh" : "en";
}
export function localize(hassLang) {
  const lang = resolveLang(hassLang);
  const dict = LANGS[lang] || zh;
  const t = (key, params) => {
    let s = dict[key];
    if (s === undefined || s === null) s = zh[key];
    if (s === undefined || s === null) s = key;
    if (params) { for (const k of Object.keys(params)) s = s.split("{" + k + "}").join(String(params[k] ?? "")); }
    return s;
  };
  return { t, lang };
}
