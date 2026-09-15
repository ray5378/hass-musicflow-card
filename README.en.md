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

When there is **no cover art to show** (stopped / queue cleared / no media), the card fills the background with a rotating set of **12 fixed palettes** instead of going colourless. Whenever a cover is available it always wins — the two are mutually exclusive.

The implementation is **N full-card diagonal gradients cross-fading in place**: each layer paints `linear-gradient(140deg, c1, c2 62%, #14182a 100%)`, starts at `opacity: 0`, and runs the same keyframes with a **negative `animation-delay`** that staggers the N layers evenly by 1/N of a cycle.

The keyframe window is **derived from the layer count** (not hard-coded): hold window = fade window = `50/N %`, so each layer's "visible window" is exactly the `100/N %` stagger — guaranteeing only two adjacent layers ever overlap, instead of three or four blurring together. For N=12 the card injects:

```css
@keyframes mf-cyc {                        /* N=12: hold = fade = 50/12 ≈ 4.167% */
  0%, 4.167%      { opacity: 1; }          /* full opacity, holding */
  8.333%, 95.833% { opacity: 0; }          /* cross-fade out, then fully clear */
  100%            { opacity: 1; }          /* fade back in */
}
```

> For N=5 this reduces exactly to the old `{0%,10%→1; 20%,90%→0; 100%→1}`, so the visual baseline is unchanged. The keyframe is **not hard-coded in CSS** — the card injects it from `50/N` after mounting. A hard-coded window only holds for one layer count; with more layers the stagger drops below the window, three or four layers go semi-transparent at once, and the dominant palette falls to ~45% — which reads as mush.

The phases are staggered by 1/N of a cycle (N = number of palettes, **12** today) — inside a transition window one layer is always falling while another rises, so there is no "dark then bright" gap and no additive brightening either (every layer is a **fully opaque** gradient, so over-compositing normalises itself). The one thing worth watching is **backdrop bleed**: when every layer is semi-transparent the card background shows through. Measured worst case: **N=5 → 25%**, **N=8 → 1.56%**, **N=12 → 0%** (the 8.33% stagger is already denser than the hold window, so a fully opaque layer is always pinned underneath). Only `opacity` is animated (a compositor-only property) — **no movement, no repaint, no filters, zero main-thread work**.

> 2.3.0 used a **5-cell sprite strip shifted via `background-position`**; that transition is a spatial interpolation between two cells, so the colour literally slides sideways rather than swapping in place. **2.3.1 switched to the A+ in-place cross-fade.**

```yaml
type: custom:hass-musicflow-card
idle_background: true    # default true; set false for the original static gradient
idle_speed: normal       # slow | normal | fast | off (static, rests on the first palette = deep red)
idle_theme: auto         # tints the accent colour only; no longer affects the background
```

- The **12 fixed palettes** (starting from **deep red**) are **deep red / teal / burnt orange / lake teal / dark gold / indigo / warm brown / wisteria / pine ink / magenta / grass green / slate grey**, hard-coded in the card and independent of the theme.
- The **order is a fixed ring, not random**: there is no random number anywhere in the code — it always cycles in the order above and wraps back to the first entry. The ring order was optimised directly on **Lab ΔE** (max-min criterion), giving a **minimum adjacent ΔE of 65.7** — every swap is a clearly visible jump (ΔE 65 is roughly the gap between "mid blue" and "mid orange").
- **The starting point only sets the "first palette seen"**: the ring is cyclic, so rotating the start **changes no adjacent ΔE at all** (the sum is invariant too) — it only decides which colour appears first when the card enters the idle state. Deep red is the start because it is the highest-chroma, most saturated warm hue on the ring, giving the strongest opening recognition. To change the first palette, just rotate the start of `IDLE_GROUPS` — no need to re-run the ring optimisation.
- "Do two palettes look alike?" is judged by **Lab ΔE*ab, not hue difference**: low-chroma deep teal-greens must be pulled far apart in hue to be told apart. In the first 12-palette draft "pine ink vs teal" were only ΔE 15~17 apart, so pine ink was moved to 125° (a true pine green), teal raised to 65% chroma and moved to 170°, and warm brown desaturated — lifting their nearest-neighbour distances from 15/20/21 to 27/27/24. The closest pair overall is "warm brown vs burnt orange" (ΔE 24.4), and they are not adjacent on the ring.
- Each palette is pinned by **relative luminance Y** (not HSL's L): `peak 0.175` (grass green / lake teal / indigo) / `0.140` (magenta / teal / burnt orange / dark gold) / `0.110` (deep red / warm brown / wisteria) / `0.085` (slate grey) / `trough 0.070` (pine ink), a **1.88x** peak-to-trough span. Neighbouring palettes therefore change both colour *and* light level — that is what makes the "breath" read.
- Deep red / burnt orange / dark gold are constrained by the dark base plus white text (luminance tops out near 0.183 before white text drops below WCAG AA), so they only reach this depth rather than being bright primaries — a deliberate trade-off, not a colour-picking slip.
- Slate grey is the only **achromatic** entry (~7% saturation): it covers "the axis other than hue" and acts as a breather between two high-chroma palettes.
- `idle_speed` scales the **seconds each palette holds**: `slow` 11.2s / `normal` 7s / `fast` 4.2s, i.e. a full cycle of 89.6s / 56s / 33.6s; `off` rests on the first palette (deep red).
- `idle_theme` now controls **only** the hue of the accent colour (icons / progress bar / active pill): `auto` (default) derives it from the HA theme's `--primary-color`; you can also pin `twilight` / `ocean` / `ember` / `forest` / `mono`.
- The background is a fixed dark gradient (ending on `#14182a`), so the idle state is always rendered as *light-on-dark* and no longer flips to a light base in HA light mode; white text on the brightest peak palette still has a **4.67:1** contrast ratio (passes AA).
- Animation is paused when the card scrolls out of view, the tab goes to the background, or the queue/media-browser panel is open, and it degrades to a static palette (the first one, red) under `prefers-reduced-motion`.

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
