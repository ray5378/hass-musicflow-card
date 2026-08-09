# MusicFlow Card

![MusicFlow Card](images/card-preview.svg)

A Lovelace custom card for the [MusicFlow](https://github.com/ray5378/MusicFlow)
Home Assistant integration. It puts the full MusicFlow player control onto one
card:

- Play / pause / stop / previous / next, seek bar, volume and mute
- Play modes: shuffle toggle, order / all / one repeat cycle
- **Favorite (heart)** - add or remove the current track from the server's
  "liked songs", two-way synced
- **Add to playlist** - append the current track to any of your playlists
- **Scrolling lyrics** - LRC lyrics follow the playback position in real time
- **Switch output** - move the current queue and position to another
  MusicFlow player (DLNA device or sync group)

The card adapts to the light / dark HA theme automatically.

> Chinese docs: [README.zh-CN.md](README.zh-CN.md)

## Requirements

| Component | Minimum |
|---|---|
| MusicFlow integration | **1.2.6** (adds the lyrics and playlists WebSocket commands) |
| MusicFlow server | 1.1.7 or newer |
| Home Assistant | 2024.12 or newer |

## Install

### HACS (recommended)

1. In HACS go to **Frontend**, open the three-dot menu and choose
   **Custom repositories**.
2. Add `https://github.com/ray5378/hass-musicflow-card` with category
   **Lovelace**.
3. Click **Download** on the **MusicFlow Card** entry, then reload the
   Lovelace dashboard (or restart Home Assistant).

### Manual

1. Copy `dist/musicflow-card.js` into your `config/www/` directory.
2. Add it as a module resource in **Settings -> Dashboards -> three-dot menu
   -> Resources**: `/local/musicflow-card.js`, type **JavaScript Module**.

## Usage

Add a card to your dashboard with the following YAML:

```yaml
type: custom:musicflow-player-card
entity: media_player.living_room
```

Any MusicFlow media player entity works - a DLNA device or a sync group.

### Options

| Option | Default | Description |
|---|---|---|
| `entity` | (required) | The MusicFlow media player entity to control |
| `show_artwork` | `true` | Show the album art thumbnail |
| `show_lyrics` | `true` | Show the scrolling lyrics panel |
| `name` | - | Optional card title override |

## Behavior notes

- The **heart** button uses the `musicflow.like_track` service; its state
  comes from the entity's `liked` attribute, refreshed automatically.
- **Add to playlist** opens the playlist picker and calls
  `musicflow.add_to_playlist`. Imported (read-only) playlists are filtered by
  the server.
- **Switch output** uses the built-in `select_source` feature of the
  integration, so the queue and playback position move to the target player.
- Lyrics are fetched once per track via the `musicflow/lyrics` WebSocket
  command and highlighted locally against `media_position`.

## Related repositories

| Repo | What it is |
|---|---|
| [MusicFlow](https://github.com/ray5378/MusicFlow) | The server: music library, DLNA playback, sync groups |
| [hass-musicflow](https://github.com/ray5378/hass-musicflow) | The HACS integration (media player entities) |
| [hassio-addons](https://github.com/ray5378/hassio-addons) | HA add-on packaging of the server |

## License

MIT
