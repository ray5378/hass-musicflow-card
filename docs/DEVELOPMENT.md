# MusicFlow Card — 开发目标 (Development Goals)

> 本文档是 `hass-musicflow-card` 的开发蓝图。**动手前先读「复刻基线」一节。**

## 一句话目标

在 Home Assistant 里给 MusicFlow 提供一张**外观与交互完全等同于 HA 官方媒体控制卡片**、但叠加了 MusicFlow 特有能力的 Lovelace 卡片。

## 复刻基线（最重要，先读）

**本卡片的开发方式是：先完整复刻官方 `media-control` 卡片，再在其基础上一点点修改，而不是从零自绘。**

- 官方文档：https://www.home-assistant.io/dashboards/media-control/
- 官方卡片类型：`type: media-control`（实体 domain 为 `media_player`）
- 官方源码：Home Assistant 前端仓库
  `src/panels/lovelace/cards/hui-media-control-card.ts`
  （依赖组件同目录 `card-features/`、`components/media-player/` 等）

复刻时要求：
1. **布局 1:1**：封面图、设备名、媒体标题/艺术家、进度条、控制按钮（上一首/播放暂停/下一首/停止等）、音量、更多信息入口——位置与官方一致；
2. **交互 1:1**：按钮显隐按官方状态机（`MediaPlayerEntityFeature` 位掩码）、进度条实时插值（`position + (now - media_position_updated_at)`）、窄屏适配（官方 ResizeObserver 阈值）；
3. **视觉 1:1**：MDI 图标 path 与官方逐字符一致、HA 主题变量（`--primary-color` 等）自适应明暗主题；
4. **图标字体/组件**：优先复用 HA 内置元素（`state-badge`、`ha-icon-button`、`ha-slider` 等），无法复用再内联等价实现。

> 教训：此前把 `hui-media-player-entity-row`（实体行）误当基线，与用户期望的 `media-control` 卡片样式不符，整体返工。**基线必须锁定 `media-control` 卡片。**

## 已确认的增强（在官方基线上叠加）

| 能力 | 说明 | 依赖 |
|---|---|---|
| **切换播放器** | 官方 `media-control` 卡片左侧的 DLNA 图标改为可点击，点击弹出 MusicFlow 播放器切换器（耳机图标列表，显示每台"N 首 · 播放中 · 曲名 / 空闲"）。**切换遵循服务器 `switchPeer` 语义：纯 UI 切换卡片控制目标实体，旧播放器播放队列与状态完全不变，随时可切回** | 集成 1.2.6+（实体 + WS 状态推送） |
| **喜欢（❤）** | 把当前曲目加入/移出服务器「我喜欢的音乐」，双向同步（实体 `liked` 属性） | 集成 1.2.5+（`musicflow.like_track`） |
| **浏览媒体库** | 复用 HA 原生媒体浏览入口（实体 more-info 弹窗内自带「浏览媒体」） | 集成 1.2.6+（browse 能力） |

## 候选能力（未定，按用户确认逐个加）

- 播放模式单按钮循环（`order → all → one → shuffle`，图标随模式切换）
- 滚动歌词（依赖 `musicflow/lyrics` WebSocket 命令）
- 添加到歌单（依赖 `musicflow/playlists` + `musicflow.add_to_playlist`）

> 原则：**以官方为基线逐步微调**，不一次堆功能；用户确认一项、实现一项。

## 仓库约定（踩过的坑，务必遵守）

1. **产物文件名必须与仓库同名**：`dist/hass-musicflow-card.js`（HACS plugin 规则：dist 下必须有与仓库同名的 js）；
2. **`hacs.json` 的 `filename` 必须是纯文件名** `hass-musicflow-card.js`，**不要带 `dist/` 前缀**（带前缀会走根模式下载，文件落 `dist/` 子目录而资源 URL 指向根 → 404）；
3. **`README.md` 必须纯 ASCII**（HACS 用 `decode("ascii", errors="ignore")` 读文档，中文会被丢弃），中文放 `README.zh-CN.md`；
4. HACS 校验要求 README 至少有一张图片（`images/` 放 SVG 即可）；
5. HACS 资源 URL 形如 `/hacsfiles/<仓库名>/<文件名>`（HACS 自动注册，勿手写 `/local/community/...` 误导用户）；
6. 发版：**改完先 push 让 CI 跑绿**（build 校验 dist 一致性 + HACS validation `category: plugin`），再打 tag 建 GitHub Release（HACS 需要 Release 才能更新版本）；
7. bash heredoc 里不要写含反引号的正文（会被 shell 吞掉），Release body 有代码块时建完后用 API PATCH 补。

## 开发流程

```bash
npm install        # 安装 esbuild / lit
npm run build      # src/musicflow-card.js → dist/hass-musicflow-card.js（必须提交 dist）
# 本地验证后提交推送 → GitHub Actions 跑 CI → 绿 → 打 tag → 建 Release
```

版本配套：卡片 v1.x 依赖集成 1.2.6+（`musicflow/lyrics`、`musicflow/playlists` WebSocket 命令）与服务端 1.1.8+。
