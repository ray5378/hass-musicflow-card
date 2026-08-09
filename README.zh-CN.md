# MusicFlow 卡片

[MusicFlow](https://github.com/ray5378/MusicFlow) HA 集成的 Lovelace 自定义卡片，
把 MusicFlow 的完整播放控件放到一张卡片上：

- 播放 / 暂停 / 停止 / 上一首 / 下一首、进度拖动、音量与静音
- 播放模式：随机开关、顺序 / 列表循环 / 单曲循环 循环切换
- **喜欢（心形）**：把当前歌曲加入或移出服务器的「我喜欢的音乐」，双向实时同步
- **添加到歌单**：把当前歌曲追加到你任意一个歌单
- **滚动歌词**：LRC 歌词跟随播放进度实时高亮滚动
- **切换输出设备**：把当前队列和播放进度整体转移到另一台 MusicFlow 播放器（DLNA 设备或播放组）

卡片自动适配 HA 的明 / 暗主题。

> English docs: [README.md](README.md)

## 版本要求

| 组件 | 最低版本 |
|---|---|
| MusicFlow 集成 | **1.2.6**（新增歌词与歌单的 WebSocket 命令） |
| MusicFlow 服务端 | 1.1.7 及以上 |
| Home Assistant | 2024.12 及以上 |

## 安装

### HACS（推荐）

1. HACS 右上角 ⋮ → **自定义存储库**；
2. 添加 `https://github.com/ray5378/hass-musicflow-card`，类别选 **Dashboard**
   （HACS UI 下拉里没有 "Lovelace"，前端卡片的类别就是 Dashboard）；
3. 进入 **HACS → 前端**，在 **MusicFlow Card** 条目上点**下载**，然后刷新仪表盘（或重启 HA）。

### 手动

1. 把 `dist/hass-musicflow-card.js` 复制到你的 `config/www/` 目录；
2. **设置 → 仪表盘 → ⋮ → 资源**里添加：`/local/hass-musicflow-card.js`，类型 **JavaScript 模块**。

装好后进入仪表盘**编辑模式 → 添加卡片**，在选择器里直接选 **MusicFlow Player**；若没显示，在搜索框输入 `musicflow` 就能找到——卡片通过 `window.customCards` 注册到 HA 前端，资源加载后即可被 GUI 发现，不需要写 YAML。

## 使用

两种方式都行：

- **GUI**：仪表盘编辑模式 → 添加卡片 → 选 **MusicFlow Player**；
- **YAML**：

```yaml
type: custom:musicflow-player-card
entity: media_player.living_room
```

任意 MusicFlow 媒体播放器实体都可以——DLNA 设备或播放组均可。

### 配置项

| 选项 | 默认 | 说明 |
|---|---|---|
| `entity` | （必填） | 要控制的 MusicFlow 播放器实体 |
| `show_artwork` | `true` | 显示专辑封面缩略图 |
| `show_lyrics` | `true` | 显示滚动歌词面板 |
| `name` | - | 可选卡片标题 |

## 行为说明

- **心形按钮**调用 `musicflow.like_track` 服务，状态来自实体的 `liked` 属性，自动刷新；
- **添加到歌单**打开歌单选择器并调用 `musicflow.add_to_playlist`；导入的只读歌单由服务端过滤；
- **切换输出设备**使用集成内置的 `select_source` 能力，队列与进度整体搬过去；
- 歌词通过 `musicflow/lyrics` WebSocket 命令每首歌拉取一次，在卡片本地按
  `media_position` 高亮滚动。

## 排查

| 现象 | 解决 |
|---|---|
| 添加卡片时 `Custom element doesn't exist: musicflow-player-card`（或 `not found`） | JS 还没作为资源加载。检查 **设置 → 仪表盘 → ⋮ → 资源**：HACS 安装应自动加上 `/local/community/hass-musicflow-card/hass-musicflow-card.js`（类型 module）；缺的话手动加，然后强制刷新仪表盘（Ctrl/Cmd+R）。 |
| **添加卡片**选择器里看不到 MusicFlow Player | 资源没加载成功，处理同上。卡片通过 `window.customCards` 自注册，资源加载后就会出现在选择器里（搜索 `musicflow`）。 |
| 点心形按钮报 `musicflow.like_track` 不存在 | 集成版本低于 1.2.5，去 HACS 升级集成并重启 HA。 |
| 歌词面板一直显示「暂无歌词」 | 当前曲目在服务端旁边没有 `.lrc` 文件。MusicFlow 服务端只会拉取它能找到的歌词。 |
| 「添加到歌单」下拉是空的 | 服务端还没有可编辑的歌单，先去 MusicFlow 网页端创建一个。 |

## 相关仓库

| 仓库 | 说明 |
|---|---|
| [MusicFlow](https://github.com/ray5378/MusicFlow) | 服务端：曲库、DLNA 播放、播放组 |
| [hass-musicflow](https://github.com/ray5378/hass-musicflow) | HACS 集成（媒体播放器实体） |
| [hassio-addons](https://github.com/ray5378/hassio-addons) | 服务端的 HA 加载项封装 |

## 许可证

MIT
