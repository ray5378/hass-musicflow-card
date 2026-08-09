# MusicFlow 卡片

![MusicFlow Card](images/card-preview.svg)

本仓库构建的是 **中文本地化版** 的
[Yet Another Media Player (YAMP)](https://github.com/jianyu-li/yet-another-media-player),
与 [MusicFlow](https://github.com/ray5378/MusicFlow) 生态配套使用。

卡片就是熟悉的 YAMP 多实体媒体播放器卡片:封面、播放控制、队列、搜索、歌词、
音量、播放器分组与可自定义的操作芯片。所有界面文字都走 YAMP 的 `localize()`
多语言系统,自动跟随 Home Assistant 的语言设置;除了 YAMP 自带的多语言外,
本仓库额外提供了完整的**简体中文 (zh) 语言包**。

> English docs: [README.md](README.md)
>
> 上游项目: [jianyu-li/yet-another-media-player](https://github.com/jianyu-li/yet-another-media-player)

## 版本要求

| 组件 | 最低版本 |
|---|---|
| [MusicFlow](https://github.com/ray5378/MusicFlow) 服务端 | 1.1.x 及以上 |
| [hass-musicflow](https://github.com/ray5378/hass-musicflow) 集成 | 1.2.x 及以上 |
| Home Assistant | 2024.1 及以上 |

## 安装

### HACS(推荐)

1. HACS 右上角 ⋮ → **自定义存储库**;
2. 添加 `https://github.com/ray5378/hass-musicflow-card`,类别选 **Dashboard**
   (HACS UI 下拉里没有 "Lovelace"，前端卡片的类别就是 Dashboard)；
3. 进入 **HACS → 前端**,在 **MusicFlow Card** 条目上点**下载**,刷新仪表盘(或重启 HA)。

### 手动

1. 把 `dist/hass-musicflow-card.js` 复制到你的 `config/www/` 目录;
2. **设置 → 仪表盘 → ⋮ → 资源**里添加:`/local/hass-musicflow-card.js`,类型 **JavaScript 模块**。

## 使用

卡片注册名是 **`yet-another-media-player`**(YAMP 原生类型),所以任何 YAMP 的
YAML 配置都直接可用:

```yaml
type: custom:yet-another-media-player
entities:
  - entity: media_player.living_room
```

更方便的方式:仪表盘**编辑模式 → 添加卡片** → 选择 **Yet Another Media Player**。
卡片自带完整的可视化编辑器(实体/行为/外观/封面/操作)。

MusicFlow 用户,把 DLNA 设备或播放组的 `media_player` 实体填进 `entities` 即可。
卡片跟随 HA 的语言显示;HA 设为中文时,卡片自动显示简体中文。

## 构建

```bash
npm install
npm run build        # rollup: src/yet-another-media-player.js -> dist/hass-musicflow-card.js
```

产物在 `dist/hass-musicflow-card.js`,需要一并提交(`.github/workflows/validate.yml`
会校验产物与源码一致)。

## 修改/新增翻译

所有界面文字位于 `src/localize/languages/`(每种语言一个文件)。`zh.js` 是中文包;
`src/localize/localize.js` 会在 HA 语言为 `zh` / `zh-CN` / `zh-Hant` 时自动选用它。

## 相关仓库

| 仓库 | 说明 |
|---|---|
| [MusicFlow](https://github.com/ray5378/MusicFlow) | 服务端:曲库、DLNA 播放、播放组 |
| [hass-musicflow](https://github.com/ray5378/hass-musicflow) | HACS 集成(媒体播放器实体) |
| [hassio-addons](https://github.com/ray5378/hassio-addons) | 服务端的 HA 加载项封装 |
| [yet-another-media-player](https://github.com/jianyu-li/yet-another-media-player) | 本卡片所基于的上游项目 |

## 许可证

MIT