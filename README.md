# PRISM Open Day · the WorkAdventure world

A walk-around venue for the PRISM open day, built on [WorkAdventure](https://workadventu.re).
PRISM is the Peer-vetted Research Initiative for Safety Methodologies, a sixteen-week
AI safety research fellowship run by Women Who Do Data.

Nine rooms joined by doors:

| Map | What is there |
| --- | --- |
| `maps/lobby.tmj` | welcome desk (about PRISM), programme and directory boards, a kiosk for prism-research.org, doors to everything |
| `maps/posters.tmj` | the poster foyer: four doors in the top wall, one per PRISM track, each with a coloured runner and a signpost in the middle |
| `maps/posters-<track>.tmj` | one room per track (technical, evals, frontier, governance) with the NeurIPS 2025 posters on standing boards; stand on the coloured strip and press SPACE. Side doors join neighbouring tracks |
| `maps/stage.tmj` | the auditorium: a screen, a lectern with the programme, and one shared call for everyone in the seats |
| `maps/teams.tmj` | twelve pods, one per team, each with a nameplate, a project page and an opt-in team call |
| `maps/lounge.tmj` | coffee, sofas, the get-involved board, and a silent reading room with the reading list |

Everything is generated from data, so nothing needs Tiled to change:

```sh
source ~/.nvm/nvm.sh && nvm use 22   # the build tools need Node 20 or newer
npm install
npm run posters      # fetch poster metadata and thumbnails from neurips.cc (content/posters.txt lists them)
npm run content      # tilesets/prism.png, maps/*.tmj, src/world.json, pages/
npm run dev          # serve locally; see HOW-TO in the museum repo for the https tunnel trick
npm run build        # validate and optimise into dist/ (what GitHub Actions deploys)
```

| Folder | What lives there |
| --- | --- |
| `content/` | `posters.txt` (track and neurips.cc id per poster), `posters.json` (fetched), `teams.json` (the twelve teams) |
| `scripts/` | `fetch-posters.cjs`, `tileset.cjs` (paints the tileset), `build-maps.cjs` (the rooms), `build-pages.cjs`, `preview.cjs` |
| `maps/`, `tilesets/`, `pages/`, `src/` | generated output, committed so the deploy needs no network |

To hang a different poster: add its neurips.cc id to `content/posters.txt` with a track, run
`npm run posters && npm run content`, commit, push. Pages without an uploaded poster image are skipped.
To change a team: edit `content/teams.json`, run `npm run content`.

Set `PAGES_BASE` in `.env` to the https host the pages are served from.

Licences: code MIT (`LICENSE.code`); maps CC BY 4.0; the generated tileset CC0, except the poster
thumbnails inside it, which belong to their authors and are shown with a link back to neurips.cc.
