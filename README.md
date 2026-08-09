# MusicFlow Card

![MusicFlow Card](images/card-preview.svg)

A Lovelace card that acts as a **full external controller** for a
[MusicFlow](https://github.com/ray5378/MusicFlow) server.

The card connects **directly** to the MusicFlow backend's real-time WebSocket
(`/ws`) and REST API. It is an equal peer to the Web UI and the mobile App:
every action taken on the card is pushed to all other clients through the same
channel, and any change made elsewhere is reflected on the card immediately.

> Chinese docs: [README.zh-CN.md](README.zh-CN.md)

## Features

- **Output switcher** - switch between players and groups (peers) in real time.
- **Playback controls** - play/pause, previous/next, stop, shuffle/loop modes.
- **Progress bar** - smooth, with live position interpolation and seek.
- **Lyrics** - synced lyrics that scroll and highlight with the current line.
- **Queue** - view, jump, remove, and drag-to-reorder the play queue.
- **Search** - search the library and play or enqueue results.
- **Add to playlist** - add the current or any searched song to a playlist.
- **Like / favorite** - star or unstar the current song.

## Requirements

- Home Assistant **2024.12.0** or newer.
- The [MusicFlow integration](https://github.com/ray5378/hass-musicflow)
  configured (it supplies the backend URL and API key to the card).
- The MusicFlow backend must allow your Home Assistant frontend origin in
  `CORS_ORIGINS` (or set `CORS_ORIGINS=*`), because the card calls the backend
  directly from the browser.

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
url: http://musicflow.local:3000
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

## How it works

The card obtains the backend connection details from the integration via the
`musicflow/backend_config` WebSocket command, then opens a live `/ws`
connection using the user's API key. All playback, queue, lyrics, search,
playlist, and favorite actions are sent straight to the backend REST API, so
the card and every other MusicFlow client stay perfectly in sync.
