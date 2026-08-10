# MusicFlow Remote Card

![MusicFlow Card](images/card-preview.svg)

一个 Lovelace 卡片，作为 [MusicFlow](https://github.com/ray5378/MusicFlow)
服务端的**完整外部控制器**（非 YAMP 派生，为 MusicFlow 专属实现）。

卡片**直连** MusicFlow 后端的实时 WebSocket（`/ws`）与 REST API，与 Web 界面、
移动 App 平级：卡片上的任何操作都会通过同一条通道推送给所有其他客户端，
其他客户端的变化也会立刻反映到卡片上。

> English docs: [README.md](README.md)

## 功能

- **输出切换** - 实时切换播放器 / 播放组（peer）。
- **播放控制** - 播放/暂停、上一首/下一首、停止、随机/循环模式。
- **进度条** - 平滑插值显示实时进度，支持拖动跳转。
- **歌词** - 同步歌词滚动高亮，固定 3 行窗口、当前行居中（黄色）。
- **队列** - 查看、跳转、删除、拖拽重排。
- **搜索** - 搜索曲库并播放或入队。
- **加入歌单** - 把当前歌曲或搜索结果加入指定歌单。
- **喜欢** - 收藏 / 取消收藏当前歌曲。

## 混合传输（局域网直连 + 外网代理）

卡片默认**直连** MusicFlow 后端（WebSocket + REST），局域网内延迟最低。
当浏览器无法直连后端时（外网访问、或受 Private Network Access / 混合内容 /
私有 IP 不可路由拦截），卡片会自动切换为**经 Home Assistant 中转**：

- REST 请求走集成提供的代理视图；
- 实时事件由集成通过 WebSocket 订阅转发；
- 封面经 HA 拉取后以 blob 渲染。

这需要集成 **1.3.0 及以上**。代理模式下后端 API Key 只保存在 HA 侧，
不会下发到浏览器。

直连模式下，后端仍需在 `CORS_ORIGINS` 中放行 HA 前端来源（或设 `CORS_ORIGINS=*`）。

## 版本要求

| 组件 | 最低版本 |
|---|---|
| [hass-musicflow](https://github.com/ray5378/hass-musicflow) 集成 | 1.3.0 及以上 |
| Home Assistant | 2024.12 及以上 |

## 安装

### HACS（推荐）

1. HACS 右上角 ⋮ → **自定义存储库**；
2. 添加 `https://github.com/ray5378/hass-musicflow-card`，类别选 **Dashboard**
   （HACS UI 下拉里没有 "Lovelace"，前端卡片的类别就是 Dashboard）；
3. 进入 **HACS → 前端**，在 **MusicFlow Card** 条目上点**下载**，刷新仪表盘（或重启 HA）。

### 手动

1. 把 `dist/hass-musicflow-card.js` 复制到你的 `config/www/` 目录；
2. **设置 → 仪表盘 → ⋮ → 资源**里添加：`/local/hass-musicflow-card.js`，类型 **JavaScript 模块**。

## 配置

手动添加卡片，类型 `custom:hass-musicflow-card`：

```yaml
type: custom:hass-musicflow-card
```

卡片会自动从 MusicFlow 集成获取后端地址与 API Key。也可以显式指定：

```yaml
type: custom:hass-musicflow-card
url: http://musicflow.local:3000
api_key: YOUR_LONG_LIVED_API_KEY
```

### 固定到指定播放器

设置 `entity` 为 MusicFlow 的 `media_player` 实体，卡片读取该实体的
`peer_id` 属性并默认选中对应输出：

```yaml
type: custom:hass-musicflow-card
entity: media_player.hivi_h5mkii_2
```

只有 MusicFlow 创建的实体带 `peer_id` 属性；非 MusicFlow 的 media_player
该配置无效，卡片回退到第一个可用输出。

### 传输模式

默认 `auto`：先探测直连，失败且集成支持时自动切换 HA 代理。也可强制指定：

```yaml
type: custom:hass-musicflow-card
transport: direct   # 始终直连后端
# transport: proxy  # 始终经 HA 中转（需要集成 1.3.0+）
```

## 构建

```bash
npm install
npm run build        # rollup: src/musicflow-remote-card.js -> dist/hass-musicflow-card.js
```

产物在 `dist/hass-musicflow-card.js`，需要一并提交（`.github/workflows/validate.yml`
会校验产物与源码一致）。

## 相关仓库

| 仓库 | 说明 |
|---|---|
| [MusicFlow](https://github.com/ray5378/MusicFlow) | 服务端：曲库、DLNA 播放、播放组 |
| [hass-musicflow](https://github.com/ray5378/hass-musicflow) | HACS 集成（媒体播放器实体 + 卡片代理） |
| [hassio-addons](https://github.com/ray5378/hassio-addons) | 服务端的 HA 加载项封装 |

## 许可证

MIT
