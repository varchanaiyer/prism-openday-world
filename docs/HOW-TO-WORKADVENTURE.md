# Building a WorkAdventure world for anything

Notes from building the Museum of AI Safety world, written so the same
approach works for a conference, a classroom, a team office, or an art
show. Everything here was checked against WorkAdventure's documentation and
against the live client in September 2026.

## What WorkAdventure is, in one paragraph

A hosted, open-source Gather-style world. You supply a map; WorkAdventure
supplies the avatars, walking, proximity voice and video, chat, and the
side panel that opens web pages. Maps are ordinary Tiled files served from
any static host. The free plan allows ten visitors at a time with unlimited
audio and video; paid plans add moderation, custom avatars, a custom domain,
and more bots. Self-hosting needs three servers and is not worth it for a
small project.

## The five rules a map must follow

1. Tiled, exported as JSON (`.tmj`), orthogonal, 32 by 32 pixel tiles.
2. An object layer named `floorLayer`. Avatars are drawn at this layer:
   everything below it is floor and furniture, everything above it draws
   over people (use that for the tops of tall things).
3. Tilesets embedded in the map, not linked as separate `.tsx` files.
4. Walls: a tile with a boolean property `collides = true`. The convention
   is a separate tile layer named `collisions` painted with one transparent
   colliding tile, so any art can sit on the wall layers.
5. A tile layer named `start` with at least one tile: visitors spawn there.
   For named arrivals, add an area object with `start = true`; its name is
   the entry point (`map.tmj#that-name`).

Map-level properties worth setting: `mapName`, `mapDescription`,
`mapCopyright`, and `script` (a path to your map script, relative to the
map file; in the starter kit that is `../src/main.ts` for maps in `maps/`).

## The properties that make things happen

All of these go on rectangle objects of class `area` on the `floorLayer`
group, unless noted.

| Want | Property | Notes |
| --- | --- | --- |
| Open a web page in the side panel when a visitor stands here | `openWebsite = https://…` | Must be https. Add `openWebsiteTrigger = onaction` so it waits for Space, `openWebsiteTriggerMessage` for the prompt text, `openWebsiteWidth` (percent), `openWebsiteAllowApi = true` if the page uses the scripting API, `openWebsitePolicy = fullscreen` for games |
| Open in a new tab instead | `openTab = https://…` | Use for sites that refuse iframes (they send `X-Frame-Options`); test with `curl -I` first |
| A door to another map | `exitUrl = other.tmj#entry-name` | Relative paths work. Put a matching `start = true` area named `entry-name` in the other map, one cell away from its own exit so people do not bounce |
| A quiet reading area | `silent = true` | Nobody talks inside |
| A meeting room where everyone inside shares one call | `jitsiRoom = SomeName` | Add `jitsiTrigger = onaction` to make it opt-in |
| Ambient sound | `playAudio = ../sounds/x.mp3` | Plus `audioLoop`, `audioVolume` |
| A web page drawn onto the map itself | object with `url = …` | Any rectangle object; sized by the rectangle; always drawn above tiles; `allowApi`, `policy` optional |

Layer-based zones still work and are handy for scripts: paint a tile layer
named, say, `zone-lobby`, and `WA.room.onEnterLayer("zone-lobby")` fires.

## Scripting, the useful parts

A map script is TypeScript in `src/`, bundled by the starter kit, run in
an iframe in the visitor's browser. It runs per visitor: nothing is shared
unless you use `WA.state` (shared variables) or `WA.event` (broadcasts).

```ts
WA.onInit().then(() => {
  WA.room.onEnterLayer("zone-lobby").subscribe(() =>
    WA.ui.banner.openBanner({ id: "hall", text: "Welcome to the lobby", timeToClose: 3000 }));
  WA.player.state.saveVariable("seen", 3, { persist: true, public: false, scope: "world" });
  WA.ui.actionBar.addButton({ id: "dir", label: "Directory", callback: () => WA.nav.openCoWebSite("https://…") });
});
```

A page opened in the side panel with `openWebsiteAllowApi = true` gets the
same `WA` object by including
`<script src="https://play.workadventu.re/iframe_api.js"></script>`, so a
placard can record itself as seen or open another page.

Limits met in practice: `WA.player.moveTo` and click-to-walk fail with
"No path found" on long trips across big open maps; keep maps modest or
cells small. `WA.players` only tracks people inside your viewport.

## Hosting, cheapest first

**GitHub Pages, no accounts beyond GitHub.** The museum world repo and this one are the recipe: the
starter kit's `.github/workflows/build-and-deploy.yml` with `UPLOAD_MODE=GH_PAGES`
in `.env` builds `dist/` and pushes it to a `gh-pages` branch on every push
to `main`. Enable Pages once (Settings, Pages, source `gh-pages`, or
`gh api -X POST repos/OWNER/REPO/pages -f "source[branch]=gh-pages" -f "source[path]=/"`).
GitHub Pages sends the `Access-Control-Allow-Origin: *` header the client
needs. Public play address:

```
https://play.workadventu.re/_/global/OWNER.github.io/REPO/maps/your-map.tmj
```

`global` is any label you like; it names the room instance.

**Vercel or any static host.** Same address pattern with your host name.
Add a header rule for `Access-Control-Allow-Origin: *` (see `vercel.json`
here) and serve the build output. Vercel cannot hold WebSockets, but the
maps are static, so that does not matter.

**WorkAdventure Map Storage.** Free account, `npm run upload`, and you get
their in-browser map editor and an address of the form
`https://play.workadventu.re/@/ORG/WORLD/MAP`. The recommended path once
there is an account.

## Testing locally, and the two traps

`npm run dev` serves the maps on `http://localhost:5173`, but WorkAdventure's
client runs on their https site and browsers block or prompt when a public
page reads `localhost`. You will see NETWORK ERROR. Use an https tunnel:

```sh
brew install cloudflared
cloudflared tunnel --url http://localhost:5173
# prints https://something.trycloudflare.com
```

Then play `https://play.workadventu.re/_/test/something.trycloudflare.com/maps/your-map.tmj`.

Trap one: Vite refuses unknown Host headers with a 403. This repo's
`web.vite.config.ts` has `server.allowedHosts: [".trycloudflare.com"]`.

Trap two: do not look the tunnel name up before Cloudflare has published
it. A home router caches the "no such name" answer for a long time and
your browser will fail while everyone else's works. Wait twenty seconds
after the URL appears, then try.

Anything opened with `openWebsite` must be https, so point those at the
tunnel or a deployed host while testing, never at localhost.

## Tools you need

- Node 20 or newer (`nvm install 22`). The starter kit's Vite build needs it.
- Tiled 1.10 or newer (`brew install --cask tiled`) if you draw by hand.
- A WorkAdventure account only when you want their storage, editor, or a bot.

## Two ways to make the map

**Draw it in Tiled.** Start from the starter kit's `office.tmj`; its tilesets
are licensed for use in WorkAdventure maps but not for redistribution on
their own. Keep an unbroken wall ring, paint collisions, place a start
tile, draw areas on `floorLayer` with the properties above. Embed the
tilesets. Export as JSON.

**Generate it.** If your content already exists as data (a schedule, a
catalogue, a grid), write a script that emits the Tiled JSON, as
`scripts/build-maps.cjs` (in this repo; `scripts/convert.cjs` in the museum world) does here. The shape of a map file is small: a `map`
object with `width`, `height`, `tilewidth`, `tileheight`, an array of
layers (tile layers carry `data`, a flat array of global tile ids; object
groups carry `objects`), and embedded `tilesets` with `firstgid`. Tile id
zero means empty; a tileset's first tile is `firstgid`. Watch the origin:
if your map has a margin, every tile placement needs the same offset, or
walls drift one cell from their floors.

Painting your own tileset in code (see `scripts/paint.cjs`) means the art
is yours to publish under any licence, and titles can be rendered onto
tiles with a bitmap font, so every object can carry its own label.

## Choosing a scale

Avatars are 32 pixels wide, roughly one tile. A corridor two tiles wide
feels tight, three feels right, four feels generous. Rooms much wider than
the screen (about forty tiles at default zoom) feel empty; fill with
furniture, light pools, and props, or shrink. This museum uses three tiles
per grid cell and would likely be better at two.

## Checklist before sharing an address

- Map exports as JSON with tilesets embedded, and `npm run buildmap` reports every map succeeded.
- A `start` layer exists; every `exitUrl` has a matching named arrival on the other side.
- Every `openWebsite` is https and the target allows iframes, or uses `openTab`.
- Walls collide; walk the edges once in the client.
- The host sends `Access-Control-Allow-Origin: *` (`curl -I` the map file).
- Open the play address in a private window: name, avatar, camera screen, then the map.

## Sources

- Map requirements: https://docs.workadventu.re/map-building/tiled-editor/wa-maps
- Opening websites: https://docs.workadventu.re/map-building/tiled-editor/opening-a-website/
- Entries and exits: https://docs.workadventu.re/map-building/tiled-editor/entry-exit/
- Special zones: https://docs.workadventu.re/map-building/tiled-editor/special-zones/
- Websites on the map: https://docs.workadventu.re/map-building/tiled-editor/website-in-map/
- Scripting API: https://docs.workadventu.re/developer/map-scripting/
- Starter kit: https://github.com/workadventure/map-starter-kit
- Pricing: https://workadventu.re/pricing/
