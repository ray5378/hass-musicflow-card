# MusicFlow Card — 开发记录 (Development Notes)

本文档记录 `hass-musicflow-card` 的当前技术路线与踩坑点。

## 当前技术路线

本仓库是 MusicFlow 的 Home Assistant 前端卡片,作为 MusicFlow 后端的专用外部控制器:

- 卡片类型 = `custom:hass-musicflow-card`;
- 中文化 = 在 `src/localize/languages/zh.js` 提供完整简体中文包,由
  `src/localize/localize.js` 根据 HA 语言自动选用(跟随 HA 系统语言,GUI 无需额外设置)。

## 目录结构

```
src/
  musicflow-remote-card.js      # 卡片入口(自定义元素 + 主逻辑)
  backend-client.js             # 后端通信客户端(直连/代理、REST/WS、封面)
  localize/
    localize.js                 # 语言选择:localStorage / hass.language / en
    languages/{en,zh,...}.js    # 每种语言一个文件
rollup.config.js                # 构建 -> dist/hass-musicflow-card.js
```

## 构建与校验

```bash
npm install
npm run build   # rollup: src/musicflow-remote-card.js -> dist/hass-musicflow-card.js
```

CI(`.github/workflows/validate.yml`)会:
1. `git diff --exit-code dist/hass-musicflow-card.js` —— **产物必须提交且为最新**;
2. 校验 `README.md` 必须纯 ASCII(HACS 按 ASCII 解码,中文会被丢弃);
3. HACS `category: plugin` 校验。

## 踩坑记录

1. **产物文件名必须与仓库同名**:`dist/hass-musicflow-card.js`;
2. **`hacs.json` 的 `filename` 必须是纯文件名** `hass-musicflow-card.js`,不带 `dist/` 前缀
   (带前缀会走根模式下载,文件落 `dist/` 而资源 URL 指向根 → 404);
3. **`README.md` 必须纯 ASCII**,中文放 `README.zh-CN.md`;
4. HACS 要求 README 至少一张图片(`images/` 放 SVG 即可);
5. 发版:先 push 让 CI 跑绿,再打 tag 建 GitHub Release(HACS 需要 Release 才能更新版本)。

## 翻译说明

- 所有界面文案都走 `localize('key.path')`,没有散落的硬编码界面文字;
- 新增/修改文案改 `src/localize/languages/zh.js`,保持与 `en.js` 的 key 一一对应,
  不必翻译的保持英文 key 会被回退到 en;
- 跟随 HA 语言:HA 设为中文时卡片自动显示中文,不影响其他语言用户。