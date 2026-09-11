# Editing the world

How to move rooms around, add doors, place furniture, or add a whole new room. Read the README first
for the quick start; this page is the detail.

## 1. What a room is, in code

Every room is one function in `scripts/build-maps.cjs`: `lobby()`, `posterFoyer()`, `posterRoom(track)`,
`stage()`, `teamRooms()`, `lounge()`. Each one creates a `Room`, paints floor and walls, places things,
declares doors, and returns the finished map. The list at the bottom of the file (`built`) says which
functions become which files.

The rooms' names, floor colours, wall colours and one-line blurbs live in `scripts/world.cjs` under
`ROOMS`. The four tracks and their colours are `TRACKS` in the same file.

## 2. Coordinates

Everything is in tiles. One tile is 32 pixels. `x` runs left to right, `y` runs top to bottom, and
`(0, 0)` is the top-left tile of the map. A room that is `32 x 24` has tiles `x = 0..31` and `y = 0..23`.

Walls: the top wall is three tiles thick (one dark top row and two lighter face rows), so that banners
and signs can hang on it. The other three walls are one tile thick. So in a room made with
`r.box(0, 0, W, H)` the walkable floor is `x = 1..W-2`, `y = 3..H-2`.

Layers, from bottom to top: `floor`, `decor` (rugs, floor arrows), `props` (furniture, standing signs),
`walls` (walls, banners, poster boards), `collisions` (invisible, where you cannot walk), `zone-*`
(invisible, triggers a banner), `start` (where you appear if no door brought you), and `floorLayer`
(the areas you interact with). Avatars draw above all of these.

## 3. The Room toolkit

All coordinates are tiles; `w` and `h` are sizes in tiles.

| Call | What it does |
| --- | --- |
| `new Room(key, W, H)` | a blank map of `W` by `H` tiles. `key` must exist in `ROOMS` in `scripts/world.cjs` |
| `r.floor(x, y, w, h)` | checkered floor in the room's colours |
| `r.floorOne(x, y, w, h, tileId)` | one tile everywhere, for example `TS.trackFloors.evals` or `TS.T.STAGE_FLOOR` |
| `r.box(x, y, w, h)` | a ring of walls with collisions, top wall three thick |
| `r.door(x, y, w, h)` | cuts an opening in a wall: door mat, no collision |
| `r.exit(x, y, w, h, targetKey, entryName)` | a door that leads to another map: cuts the opening and adds the exit. Leads to `<targetKey>.tmj#<entryName>` |
| `r.entry(name, x, y, w, h)` | a named arrival spot for a door in another map to point at |
| `r.arrive(x, y, w, h)` | the room's default spawn and the `arrive` entry the room buttons jump to. Every room needs exactly one |
| `r.website(name, x, y, w, h, url, prompt, width)` | stand here, press SPACE, the page opens in the side panel (`width` in percent, default 50). The url must be https and the site must allow iframes |
| `r.jitsi(name, x, y, w, h, roomName, prompt)` | a shared call for everyone inside. With a `prompt` it is opt-in (press SPACE); without one it joins on entry |
| `r.area(name, x, y, w, h, props)` | any other WorkAdventure area, for example `[prop("silent", true)]` |
| `r.grid(layer, tiles, x, y, collide)` | places a multi-tile thing from the tileset with its top-left at `(x, y)`; `collide = true` makes it solid |
| `r.set(layer, x, y, tileId)` | one tile |
| `r.plants(cells)` | a potted plant on each `[x, y]`, solid |
| `r.arrows(dir, cells)` | floor arrows (`"up"`, `"down"`, `"left"`, `"right"`) on each `[x, y]` |
| `r.zone(name, x, y, w, h)` | a banner zone; its text is in the `zones` block at the end of the file |
| `r.build(description)` | the finished map |

Things you can place with `r.grid` come from `tilesets/prism.json`, loaded as `TS`:

- furniture: `TS.furniture.desk` (3 x 1), `.table` (2 x 2), `.chair`, `.seat`, `.sofa` and `.sofa2` (2 x 1),
  `.plant`, `.shelf` (2 x 1), `.screen` (8 x 2), `.lectern`, `.coffee` (3 x 1), `.rug` and `.rug2` (3 x 2),
  `.kiosk`, `.whiteboard` (2 x 1)
- signs: `TS.signs["↑ POSTERS"]` and friends (3 x 1), `TS.wallsigns.PROGRAMME` (3 x 1), `TS.doorSigns.evals` (6 x 1),
  `TS.sideSigns["← technical"]` (4 x 1), `TS.bays.frontier` (5 x 1), `TS.signpost` (5 x 2), `TS.signposts.foyer` (6 x 2)
- banners: `TS.banners.lobby` (10 x 2), `.foyer` (8 x 2), `.teams` (12 x 2), `.lounge` (8 x 2), `TS.roomBanners.evals` (12 x 2)
- poster boards: `TS.boards["119475"]` (4 x 3), one per poster id; nameplates: `TS.nameplates["rachel-freedman"]` (6 x 2)
- single tiles: `TS.T.WALL_TOP`, `TS.T.DOOR`, `TS.T.STAGE_FLOOR`, `TS.T.STAGE_EDGE`, `TS.T.ARROW_UP` and so on,
  `TS.floors.<room>` (a pair), `TS.faces.<room>.top` and `.bottom`, `TS.trackFloors.<track>`

All of these are painted by `scripts/tileset.cjs`. To add a new piece of furniture or a new sign, paint it
there (the painter has `rect`, `circle`, `line`, `gradient`, `text` and a 3 by 5 capitals font with arrows)
and add it to the `out` object at the bottom.

## 4. The rules that keep doors working

1. **Every exit must land on a named arrival in the other map.** `r.exit(..., "lounge", "from-lobby")`
   needs `r.entry("from-lobby", ...)` inside `lounge()`. The build refuses to write maps if one is missing
   and prints `BROKEN DOOR`.
2. **Keep every arrival two tiles clear of every exit.** If you arrive on the tile next to an exit mat,
   the exit fires again and throws you back through the door. Leave one empty tile between them. This is
   why arrivals sit on row 4 under a top door (rows 0 to 2 are the door, row 3 is the gap).
3. **Every room has one `r.arrive(...)`.** It is the default spawn and where the room buttons jump to.
   Put it somewhere safe and open, also two tiles from any exit.
4. **Doors through the top wall are three tiles tall** (`r.exit(x, 0, 2, 3, ...)`); through the other walls
   they are one tile thick (`r.exit(0, y, 1, 2, ...)` on the left wall, `r.exit(W-1, y, 1, 2, ...)` on the
   right, `r.exit(x, H-1, 2, 1, ...)` at the bottom). Two tiles wide is comfortable.
5. **Signs beside doors, arrows on the floor.** Visitors find doors by the "↑ POSTERS" style plates and the
   arrow trails, not by the door mats. When you move a door, move its signs and arrows.
6. **Do not stack two press-SPACE areas on the same tile.** A poster strip and a team call on the same tile
   both want the SPACE key.

## 5. Worked examples

### Move the lounge door from the lobby's bottom wall to its right wall

In `lobby()`, the lounge door is the bottom door and the stage door is the right one. Swap them:

```js
// before
r.exit(31, 11, 1, 2, "stage", "from-lobby");  r.entry("from-stage", 29, 11, 1, 2);  r.grid("props", TS.signs["STAGE →"], 28, 9, true);
r.exit(15, 23, 2, 1, "lounge", "from-lobby"); r.entry("from-lounge", 15, 21, 2, 1); r.grid("props", TS.signs["↓ LOUNGE"], 12, 22, true);
// after: the lounge takes the right wall, the stage the bottom wall
r.exit(31, 11, 1, 2, "lounge", "from-lobby"); r.entry("from-lounge", 29, 11, 1, 2); r.grid("props", TS.signs["LOUNGE →"], 28, 9, true);
r.exit(15, 23, 2, 1, "stage", "from-lobby");  r.entry("from-stage", 15, 21, 2, 1);  r.grid("props", TS.signs["↓ STAGE"], 12, 22, true);
```

`TS.signs["LOUNGE →"]` and `TS.signs["↓ STAGE"]` do not exist yet: add the two strings to the `signs` list in
`scripts/tileset.cjs`. The lounge's own door back (`lounge()`) can stay where it is; doors do not have to be
geographically consistent, only named consistently. Update the signpost text in `tileset.cjs` if it now points
the wrong way. Then `npm run content && npm run previews && npm run buildmap`.

### Make the lounge bigger

In `lounge()` the room is `new Room("lounge", 30, 22)`, the floor is `r.floor(1, 3, 28, 18)` and the walls are
`r.box(0, 0, 30, 22, 2)`. Change all three consistently, for example to `40, 26`, `r.floor(1, 3, 38, 22)` and
`r.box(0, 0, 40, 26, 2)`. Then move the door, the entry, the signs and the quiet-room walls to where you want
them; their coordinates are absolute. Look at the preview before building.

### Add a room

1. In `scripts/world.cjs`, add it to `ROOMS`:
   `workshop: { name: "The Workshop", floor: ["#d8d0e8", "#cfc6e0"], face: "#6a5a8a", blurb: "Hands-on sessions." }`
   Because it has its own `floor` and `face`, the tileset paints floor and wall tiles for it.
2. In `scripts/build-maps.cjs`, write `function workshop() { ... }` following `lounge()` as a template: room,
   floor, box, a banner if you paint one, a door back (`r.exit(..., "lobby", "from-workshop")`), an arrival
   for the lobby's door (`r.entry("from-lobby", ...)`), one `r.arrive(...)`, a `r.zone("workshop", ...)`, and
   `return r.build("...")`.
3. Give the lobby a door to it: `r.exit(...)` to `"workshop"` with entry `"from-lobby"`, and
   `r.entry("from-workshop", ...)` two tiles clear of it, plus a sign.
4. Register it: `built.workshop = workshop()` next to the other rooms.
5. Optional: a room button, in `src/main.ts`, add `["workshop", "Workshop"]` to the `rooms` list. A banner
   line appears automatically from the room's name; edit the `zones` block for custom text.
6. `npm run content`, check `docs/previews/workshop.png`, `npm run buildmap`.

### Put a poster in another room, or hang a new one

Posters are rooms by track. Edit `content/posters.txt`: the first word on a line is the track
(`technical`, `evals`, `frontier`, `governance`), the second is the neurips.cc poster id (the number at the end
of `https://neurips.cc/virtual/2025/poster/119475`). Run `npm run posters` to fetch anything new, then
`npm run content`. Posters whose authors never uploaded an image are skipped and listed as `ERR`.
Each room holds five boards per row and grows a row every five posters.

### Change what a sign says

Signs are painted from strings in `scripts/tileset.cjs`. The font has capitals, digits, common punctuation
and the four arrows; anything else is dropped. Text shrinks to fit, so keep plates short: about 10
characters per 3 tiles at the large size. `npm run content` repaints and re-places everything.

## 6. Drawing by hand in Tiled

Open `maps/<room>.tmj` in [Tiled](https://www.mapeditor.org) (1.10 or newer). The tileset `tilesets/prism.png`
is embedded, so it just works. Add a map property `handEdited` (bool) `= true` and save as JSON. From then
on `npm run content` prints `kept` for that file and does not overwrite it.

Two cautions. The tile ids in the tileset shift when posters or teams are added or removed, because the
tileset is repainted; a hand-edited map keeps the old ids and would show the wrong tiles. If you change
`content/`, regenerate that map (remove the property, rebuild, redo your edits) or accept that it is frozen.
And keep the rules in section 4 by hand: the door check only runs on generated maps.

If a lot of hand editing is coming, the better path is WorkAdventure's own map storage and in-browser
editor: set `UPLOAD_MODE=MAP_STORAGE` in `.env` and follow the map starter kit's README. The world then
lives at a `https://play.workadventu.re/@/...` address instead of GitHub Pages.

## 7. Looking at it and testing it

- `npm run previews` writes a picture of every room to `docs/previews/`, with areas outlined: red exits,
  green arrivals, yellow press-SPACE spots, blue shared calls, purple silent zones. Check that no green box
  touches a red one.
- `npm run buildmap` is exactly what the deploy runs. If it fails, the deploy would have failed.
- To try a change in the real client before pushing to `main`, push to a branch and play
  `https://play.workadventu.re/_/test/varchanaiyer.github.io/prism-openday-world/maps/lobby.tmj` after
  merging, or serve locally through an https tunnel as described in `HOW-TO-WORKADVENTURE.md`. The `test`
  label keeps you out of the room the visitors are in.
- `hosting/tests/wa-client-test.js` in the museum world repo drives the real client with Playwright and walks
  to a placard; it needs a machine with memory to spare.

## 8. Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Walking through a door sends you straight back | the arrival is next to an exit; move it two tiles away (section 4) |
| `BROKEN DOOR` when building | an exit names an entry that the other map does not have; check spelling on both sides |
| A page will not open in the side panel, only a blank frame | the site sends `X-Frame-Options`; use `prop("openTab", url)` instead of `openWebsite` |
| "No path found" when clicking to walk | long trips across big open rooms fail; keep rooms modest, walk with the keys |
| The build passes but the world shows old maps | GitHub Pages takes a minute or two after the workflow; hard-reload the play page |
| A sign shows a dot at the end or tiny text | the text did not fit; shorten it or make the plate wider in `tileset.cjs` |
| Poster boards show "POSTER" instead of a thumbnail | `content/thumbs/` is empty on this clone; run `npm run posters` before `npm run content` |
