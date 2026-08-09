# MusicFlow Card

![MusicFlow Card](images/card-preview.svg)

This repository builds a **Chinese-localized version** of
[Yet Another Media Player (YAMP)](https://github.com/jianyu-li/yet-another-media-player)
designed for the [MusicFlow](https://github.com/ray5378/MusicFlow) ecosystem.

The card renders as the familiar YAMP multi-entity media player card: artwork,
playback controls, queue, search, lyrics, volume, grouping and customizable
action chips. All interface strings go through YAMP's `localize()` system, so
the card automatically follows the Home Assistant language. We contribute a
complete **Chinese (zh) language pack** in addition to YAMP's built-in locales.

> Chinese docs: [README.zh-CN.md](README.zh-CN.md)
>
> Upstream: [jianyu-li/yet-another-media-player](https://github.com/jianyu-li/yet-another-media-player)

## Requirements

| Component | Minimum |
|---|---|
| [MusicFlow](https://github.com/ray5378/MusicFlow) server | 1.1.x or newer |
| [hass-musicflow](https://github.com/ray5378/hass-musicflow) integration | 1.2.x or newer |
| Home Assistant | 2024.1 or newer |

## Install

### HACS (recommended)

1. Open the three-dot menu in HACS and choose **Custom repositories**.
2. Add `https://github.com/ray5378/hass-musicflow-card` with category
   **Dashboard** (this is the HACS label for the plugin / frontend category).
3. Go to **HACS -> Frontend** and click **Download** on the **MusicFlow Card**
   entry, then reload the Lovelace dashboard (or restart Home Assistant).

### Manual

1. Copy `dist/hass-musicflow-card.js` into your `config/www/` directory.
2. Add it as a module resource in **Settings -> Dashboards -> three-dot menu
   -> Resources**: `/local/hass-musicflow-card.js`, type **JavaScript Module**.

## Usage

The card is registered as **`yet-another-media-player`** (YAMP's native type),
so any YAMP YAML works:

```yaml
type: custom:yet-another-media-player
entities:
  - entity: media_player.living_room
```

Or, easier, open the dashboard edit mode, choose **Add card**, and pick
**Yet Another Media Player** from the picker. The card has a full visual
editor (entities, behavior, look & feel, artwork, actions).

For MusicFlow players, add your DLNA device or sync group entity as an
`entities` entry. The UI will follow Home Assistant's language; when HA is set
to Chinese, the card shows Simplified Chinese.

## Building

```bash
npm install
npm run build        # rollup: src/yet-another-media-player.js -> dist/hass-musicflow-card.js
```

The compiled bundle lives at `dist/hass-musicflow-card.js` and must be
committed so it can be validated (`.github/workflows/validate.yml`).

## Adding / tweaking translations

All UI strings live in `src/localize/languages/` (one file per language).
`zh.js` is the Chinese pack. It is selected automatically by
`src/localize/localize.js` when the HA language is `zh`/`zh-CN`/`zh-Hant`.

## Related repositories

| Repo | What it is |
|---|---|
| [MusicFlow](https://github.com/ray5378/MusicFlow) | The server: music library, DLNA playback sync groups |
| [hass-musicflow](https://github.com/ray5378/hass-musicflow) | The HACS integration (media player entities) |
| [hassio-addons](https://github.com/ray5378/hassio-addons) | HA add-on packaging of the server |
| [yet-another-media-player](https://github.com/jianyu-li/yet-another-media-player) | Upstream card this build is based on |

## License

MIT