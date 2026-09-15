# MusicFlow Card

A Lovelace card that acts as a **full external controller** for a
[MusicFlow](https://github.com/ray5378/MusicFlow) server.

The card connects **directly** to the MusicFlow backend's real-time WebSocket
(`/ws`) and REST API. It is an equal peer to the Web UI and the mobile App:
every action taken on the card is pushed to all other clients through the same
channel, and any change made elsewhere is reflected on the card immediately.

> 中文文档见 [README.md](README.md).
>
> **Note:** The MusicFlow server is now the plugin-based architecture.

## Features

- **Output switcher** - switch between players and groups (peers) in real time.
- **Playback controls** - play/pause, previous/next, stop, shuffle/loop modes.
- **Progress bar** - smooth, with live position interpolation and seek.
- **Lyrics** - synced lyrics that scroll and highlight with the current line.
- **Queue** - view, jump, remove, and drag-to-reorder the play queue.
- **Search** - search the library and play or enqueue results.
- **Add to playlist** - add the current or any searched song to a playlist.
- **Like / favorite** - star or unstar the current song.
- **Media library** - browse playlists / albums / artists / genres / favorites,
  with server-side pagination for large libraries.

## Requirements

- Home Assistant **2024.12.0** or newer.
- The [MusicFlow integration](https://github.com/ray5378/hass-musicflow)
  configured (it supplies the backend URL and API key to the card).
- **Tested with**: MusicFlow server **v1.7.x** + integration **v1.3.6** +
  card **v1.6.11**. Keep these three in sync; upgrading the server should be
  followed by updating the integration and the card in HACS.

## Hybrid transport (LAN direct + WAN proxy)

The card normally connects **directly** to the MusicFlow backend (WebSocket +
REST), which gives the lowest latency on your LAN. When the browser cannot
reach the backend directly - outside your LAN, or when a Public Network Access
/ mixed-content / private-IP restriction blocks the connection - the card
automatically falls back to routing everything through Home Assistant:

- REST calls go through the integration's proxy view.
- Real-time events are forwarded by the integration over a WebSocket
  subscription.
- Cover art is fetched through Home Assistant (the card uses the integration's
  authenticated fetch and renders the image as a blob, so artwork shows even
  from outside your LAN).

This requires the MusicFlow integration **1.3.0 or newer** (current stable:
**1.3.6**). The backend API key stays inside Home Assistant and is never sent
to the browser in proxy mode.

In direct mode the backend must still allow your Home Assistant frontend origin
in `CORS_ORIGINS` (or set `CORS_ORIGINS=*`), because the card calls the backend
directly from the browser.

## Cover art performance (with server v1.7.x+)

- **Direct mode**: the card requests covers at the thumbnail size (~160px) with
  a cacheable URL; the server resizes on the fly (sharp) and returns `webp`
  when the client supports it, plus `Cache-Control`/`ETag` so the browser reuses
  covers across pages and refreshes (304).
- **Proxy mode**: covers are pulled through Home Assistant with the
  integration's credentials and cached per `(coverId, size)` in the card, so no
  raw unauthenticated `<img>` request hits the protected HA endpoint.

## Installation

1. In HACS, add the custom repository
   `https://github.com/ray5378/hass-musicflow-card` (category: Dashboard).
2. Install **MusicFlow Card**.
3. Restart Home Assistant if needed.

## Configuration

Add a manual card with type `custom:hass-musicflow-card`:

```yaml
type: custom:hass-musicflow-card
```

The card fetches the backend URL and API key automatically from the MusicFlow
integration. If you prefer to hard-code them, provide them explicitly:

```yaml
type: custom:hass-musicflow-card
url: http://musicflow.local:46400
api_key: YOUR_LONG_LIVED_API_KEY
```

### Pin to a specific player

If you want a card dedicated to one player (for example the HiVi H5MKII in the
living room), set `entity` to the MusicFlow `media_player` entity. The card reads
the entity's `peer_id` attribute and selects that output by default, so the card
always opens on that player. You can still switch outputs with the chips.

```yaml
type: custom:hass-musicflow-card
entity: media_player.hivi_h5mkii_2
```

Only MusicFlow-created `media_player` entities carry the `peer_id` attribute. For
a generic media_player (not managed by MusicFlow) the `entity` option has no
effect and the card falls back to the first available output.

### Transport mode

By default the card auto-detects the best transport (`auto`): it probes a direct
connection first and switches to the Home Assistant proxy when direct access
fails. You can force a mode with the `transport` option:

```yaml
type: custom:hass-musicflow-card
transport: direct   # always connect straight to the backend
# transport: proxy  # always route through Home Assistant (needs integration 1.3.0+)
```

### Idle background (idle ambient)

When there is **no cover art to show** (stopped / queue cleared / no media), the card fills the background with a "5-palette rotation" flowing colour instead of going colourless. Whenever a cover is available it always wins — the two are mutually exclusive.

Under the hood is **a 5-cell sprite strip**: `background-size: 500%` makes one cell exactly the card width, and sliding `background-position` by one cell swaps to the next palette. `background-position` joins `transform` / `opacity` as a compositor-only property, so the whole animation triggers **zero Paint / Raster / Layout** — no main-thread work.

Three layers:

- `base`: a low-saturation colour derived from the HA theme's `--primary-color`. It **never moves** and carries the white-text contrast; because the base layer never changes colour, there is no brightness dip during palette swaps.
- `sprite`: the 5-palette strip, sliding cell-by-cell at the `idle_speed` cadence. Adjacent palettes differ by only 22° of hue and wrap around after a full cycle; all derive from a single base hue.
- `breath`: a soft glow that slowly drifts / scales / brightens (`transform` + `opacity`), independent of the swap cadence.

```yaml
type: custom:hass-musicflow-card
idle_background: true    # default true; set false for the original static gradient
idle_theme: auto         # fallback palette, only used before any song has played
idle_speed: normal       # slow | normal | fast | off (static, no animation)
```

- `idle_theme` is only a **fallback** for a cold start (HA restarted and nothing has played yet): `auto` (default) derives from the HA theme's `--primary-color`; you can also pin `twilight` / `ocean` / `ember` / `forest` / `mono`, now fixing the hue only. After the first song plays it no longer has any effect.
- `idle_speed` now drives **both** the breathing and the palette swap: `slow` 32s / `normal` 20s / `fast` 12s / `off` holds on the first palette (a full cycle is 160s / 100s / 60s respectively). **The `off` behaviour changed**: the old build still showed 3 drifting spots when paused; the new build rests on the first palette.
- Animation is paused when the card scrolls out of view, the tab goes to the background, or the queue/media-browser panel is open, and it degrades to a static gradient under `prefers-reduced-motion`.

## How it works

The card obtains the backend connection details from the integration via the
`musicflow/backend_config` WebSocket command. In **direct** mode it opens a live
`/ws` connection using the user's API key; all playback, queue, lyrics, search,
playlist, and favorite actions are sent straight to the backend REST API, so
the card and every other MusicFlow client stay perfectly in sync.

In **proxy** mode (used automatically when direct access fails) the card talks
only to Home Assistant: REST through `/api/musicflow/rest/*`, real-time events
through the `musicflow/subscribe` WebSocket command, and covers through the same
proxy (authenticated fetch -> blob). The integration forwards everything to the
backend with its own API key.
