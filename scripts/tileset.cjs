#!/usr/bin/env node
/* Paints the open day tileset from the content: floors and wall faces per
   room, a standing board for every NeurIPS poster with its thumbnail and
   title, a nameplate for every team, banners, signs and furniture. Writes
   tilesets/prism.png and tilesets/prism.json (the id table the map builder
   reads). Everything is generated, so the tileset is CC0; the poster
   thumbnails inside it belong to their authors.  node scripts/tileset.cjs */
"use strict";
const fs = require("fs"), path = require("path");
const sharp = require("sharp");
const { Sprite, Atlas, font, SIZE } = require("./paint.cjs");
const { ROOT, TRACKS, ROOMS, SHORT } = require("./world.cjs");
const BASE_ROOMS = Object.keys(ROOMS).filter(k => !ROOMS[k].style);
const posters = require(path.join(ROOT, "content", "posters.json"));
const teams = require(path.join(ROOT, "content", "teams.json"));

const INK = "#1b1f2a", PAPER = "#f4f1ea", WALLTOP = "#2b2f3a", GOLD = "#e9b949", WOOD = "#8a6a48", WOOD_LIGHT = "#b08a5e";
const hx = c => Array.isArray(c) ? c : [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };
const shade = (c, t) => mix(c, "#000000", t), tint = (c, t) => mix(c, "#ffffff", t);

const A = new Atlas(16), T = {};
const blank = () => new Sprite(SIZE, SIZE);
const sprite = (w, h) => new Sprite(w * SIZE, h * SIZE);

/* ---------- text plates ---------- */
function fit(text, wPx, pref) { let sc = pref; while (sc > 1 && font.width(text, sc) > wPx - 10) sc--; return sc; }
function clip(text, wPx, sc) { let t = font.norm(text); while (t.length > 1 && font.width(t, sc) > wPx - 10) t = t.slice(0, -1); return t.length < font.norm(text).length ? t.replace(/\s+$/, "") + "." : t; }
function plate(lines, wTiles, hTiles, { bg = INK, edge = GOLD, colors = [PAPER], scales = [2] } = {}) {
  const w = wTiles * SIZE, h = hTiles * SIZE, s = new Sprite(w, h);
  s.rect(0, 0, w, h, bg).frame(0, 0, w, h, edge).frame(1, 1, w - 2, h - 2, shade(edge, 0.55));
  const sc = lines.map((l, i) => fit(l, w, scales[i] == null ? scales[0] : scales[i]));
  const gap = 4, total = sc.reduce((a, s2) => a + 5 * s2, 0) + gap * (lines.length - 1);
  let y = Math.round((h - total) / 2);
  lines.forEach((l, i) => { font.draw(s, w / 2, y, clip(l, w, sc[i]), { scale: sc[i], color: colors[i] || colors[0], align: "center" }); y += 5 * sc[i] + gap; });
  return s;
}

/* ---------- floors, walls, doors ---------- */
function floorTile(color, seed) { const s = blank(); s.rect(0, 0, SIZE, SIZE, color).rect(0, 0, SIZE, 1, shade(color, 0.1)).rect(0, 0, 1, SIZE, shade(color, 0.1)); return s.grain(3, seed); }
T.EMPTY = A.one(blank()); T.COLLIDE = A.one(blank()); T.ZONE = A.one(blank()); T.START = A.one(blank());
const floors = {}, faces = {}, trackFloors = {};
for (const key of BASE_ROOMS) floors[key] = [A.one(floorTile(ROOMS[key].floor[0], 1)), A.one(floorTile(ROOMS[key].floor[1], 2))];
for (const key in TRACKS) trackFloors[key] = A.one(floorTile(mix(TRACKS[key].color, "#ffffff", 0.7), 7));
T.WALL_TOP = A.one(blank().rect(0, 0, SIZE, SIZE, WALLTOP).rect(0, 0, SIZE, 2, tint(WALLTOP, 0.2)).rect(0, SIZE - 2, SIZE, 2, shade(WALLTOP, 0.4)).grain(2, 5));
for (const key of BASE_ROOMS) {
  const c = ROOMS[key].face, mk = bottom => { const s = blank().gradient(0, 0, SIZE, SIZE, tint(c, 0.08), shade(c, 0.1)); for (let y = 8; y < SIZE; y += 8) s.rect(0, y, SIZE, 1, shade(c, 0.22)); if (bottom) s.rect(0, SIZE - 4, SIZE, 4, shade(c, 0.5)).rect(0, SIZE - 4, SIZE, 1, tint(c, 0.2)); return s.grain(2, 3); };
  faces[key] = { top: A.one(mk(false)), bottom: A.one(mk(true)) };
}
T.DOOR = A.one(blank().rect(0, 0, SIZE, SIZE, "#cfc6b2").rect(2, 2, SIZE - 4, SIZE - 4, "#e8dfc8").rect(2, 2, SIZE - 4, 2, GOLD).rect(2, SIZE - 4, SIZE - 4, 2, GOLD));
function arrow(dir) {
  const s = blank(), c = GOLD, a = 175;
  if (dir === "up" || dir === "down") { s.rect(13, 13, 6, 13, c, a); for (let i = 0; i < 9; i++) s.rect(16 - i, 5 + i, 2 * i + 1, 1, c, a); return dir === "up" ? s : s.flipV(); }
  s.rect(6, 13, 13, 6, c, a); for (let i = 0; i < 9; i++) s.rect(18 + i, 16 - (8 - i), 1, 2 * (8 - i) + 1, c, a); return dir === "right" ? s : s.flipH();
}
T.ARROW_UP = A.one(arrow("up")); T.ARROW_DOWN = A.one(arrow("down")); T.ARROW_LEFT = A.one(arrow("left")); T.ARROW_RIGHT = A.one(arrow("right"));
T.STAGE_FLOOR = A.one(blank().rect(0, 0, SIZE, SIZE, "#4a4468").rect(0, 0, SIZE, 1, "#5a5480").grain(3, 9));
T.STAGE_EDGE = A.one(blank().rect(0, 0, SIZE, SIZE, "#4a4468").rect(0, SIZE - 6, SIZE, 6, GOLD).rect(0, SIZE - 6, SIZE, 1, tint(GOLD, 0.5)).rect(0, SIZE - 2, SIZE, 2, shade(GOLD, 0.4)));

/* ---------- poster boards, 4 by 3 tiles ---------- */
async function board(p) {
  const col = TRACKS[p.track].color, s = new Sprite(128, 96);
  s.rect(0, 0, 128, 96, WALLTOP).rect(1, 1, 126, 94, PAPER).rect(1, 1, 126, 3, col).rect(0, 94, 128, 2, shade(WALLTOP, 0.5));
  try {
    const { data, info } = await sharp(path.join(ROOT, "content", "thumbs", p.id + ".png")).resize(118, 68, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const ox = 5 + Math.floor((118 - info.width) / 2), oy = 7 + Math.floor((68 - info.height) / 2);
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) { const k = (y * info.width + x) * 4; s.put(ox + x, oy + y, [data[k], data[k + 1], data[k + 2]], data[k + 3]); }
    s.frame(ox - 1, oy - 1, info.width + 2, info.height + 2, shade(PAPER, 0.4));
  } catch (e) { s.rect(5, 7, 118, 68, "#d8d4cc"); font.draw(s, 64, 36, "POSTER", { scale: 2, color: INK, align: "center" }); }
  const lines = font.wrap(p.title, 30, 2);
  font.draw(s, 64, 79, lines[0], { scale: 1, color: INK, align: "center" });
  if (lines[1]) font.draw(s, 64, 86, lines[1], { scale: 1, color: INK, align: "center" });
  return A.add(s);
}

/* ---------- furniture ---------- */
function desk() { const s = sprite(3, 1); s.rect(0, 8, 96, 22, shade(WOOD, 0.2)).rect(0, 6, 96, 6, WOOD_LIGHT).rect(0, 6, 96, 1, tint(WOOD_LIGHT, 0.3)).rect(40, 2, 16, 10, "#2b2f3a").rect(42, 4, 12, 6, "#7fb3ff").rect(10, 9, 14, 3, PAPER).rect(70, 9, 12, 3, PAPER); return A.add(s); }
function table() { const s = sprite(2, 2); s.ellipse(32, 32, 26, 22, shade(WOOD, 0.35)).ellipse(32, 30, 26, 22, WOOD_LIGHT).ellipse(32, 30, 20, 16, tint(WOOD_LIGHT, 0.12)); return A.add(s); }
function chair(color) { const s = blank(); s.rect(9, 8, 14, 14, color).rect(9, 8, 14, 2, tint(color, 0.25)).rect(8, 21, 16, 5, shade(color, 0.35)).rect(8, 21, 16, 1, tint(color, 0.1)); return A.one(s); }
function sofa(color) { const s = sprite(2, 1); s.rect(2, 6, 60, 22, shade(color, 0.35)).rect(4, 6, 56, 12, color).rect(4, 6, 56, 2, tint(color, 0.25)).rect(2, 18, 60, 8, shade(color, 0.15)).rect(2, 6, 4, 20, shade(color, 0.25)).rect(58, 6, 4, 20, shade(color, 0.25)).rect(32, 8, 1, 10, shade(color, 0.3)); return A.add(s); }
function plant() { const s = blank(); s.rect(11, 20, 10, 9, "#7a4b2a").rect(10, 19, 12, 2, "#9a6238"); s.circle(16, 14, 6, "#3f8a4a").circle(11, 16, 4, "#4f9d58").circle(21, 16, 4, "#357a40").circle(16, 9, 4, "#5cb066"); return A.one(s); }
function shelf() { const s = sprite(2, 1); s.rect(0, 0, 64, 32, shade(WOOD, 0.4)).rect(2, 2, 60, 28, WOOD); const cols = ["#c0392b", "#2980b9", "#27ae60", "#f1c40f", "#8e44ad", "#e67e22", "#ecf0f1"]; for (let r = 0; r < 2; r++) { let x = 4; let i = r * 3; while (x < 58) { const w = 3 + (i * 7) % 4; s.rect(x, 4 + r * 13, w, 10, cols[i % cols.length]); x += w + 1; i++; } s.rect(2, 15 + r * 13, 60, 2, shade(WOOD, 0.3)); } return A.add(s); }
function screen() { const s = sprite(8, 2); s.rect(0, 0, 256, 64, "#0d0f16").frame(0, 0, 256, 64, "#3c4152").gradient(4, 4, 248, 56, "#1c2a4a", "#0e1526"); s.radial(128, 30, 90, "#3b5fb8", 90); font.draw(s, 128, 14, "PRISM OPEN DAY", { scale: 3, color: PAPER, align: "center" }); font.draw(s, 128, 38, "COHORT SHOWCASE 2026", { scale: 1, color: GOLD, align: "center" }); font.draw(s, 128, 48, "PEER-VETTED RESEARCH INITIATIVE FOR SAFETY METHODOLOGIES", { scale: 1, color: "#9fb4d8", align: "center" }); return A.add(s); }
function lectern() { const s = blank(); s.rect(10, 6, 12, 22, shade(WOOD, 0.25)).rect(7, 4, 18, 6, WOOD_LIGHT).rect(7, 4, 18, 1, tint(WOOD_LIGHT, 0.3)).rect(12, 12, 8, 1, GOLD); return A.one(s); }
function coffee() { const s = sprite(3, 1); s.rect(0, 10, 96, 20, shade(WOOD, 0.2)).rect(0, 8, 96, 6, WOOD_LIGHT).rect(0, 8, 96, 1, tint(WOOD_LIGHT, 0.3)); s.rect(8, 0, 18, 14, "#3a3d46").rect(11, 3, 12, 5, "#7fb3ff").rect(14, 9, 6, 3, "#c0392b"); for (let i = 0; i < 4; i++) s.rect(40 + i * 12, 4, 8, 6, PAPER).rect(40 + i * 12, 4, 8, 1, GOLD); return A.add(s); }
function rug(color) { const s = sprite(3, 2); s.rect(2, 2, 92, 60, shade(color, 0.2)).rect(4, 4, 88, 56, color).frame(8, 8, 80, 48, shade(color, 0.25)).frame(12, 12, 72, 40, tint(color, 0.2)); return A.add(s.grain(3, 11)); }
function kiosk() { const s = blank(); s.rect(13, 16, 6, 12, "#3a3d46").rect(8, 27, 16, 3, "#2b2f3a").rect(6, 2, 20, 16, "#2b2f3a").rect(8, 4, 16, 12, "#7fb3ff").rect(10, 6, 12, 2, PAPER).rect(10, 10, 8, 2, PAPER); return A.one(s); }
function whiteboard() { const s = sprite(2, 1); s.rect(2, 2, 60, 26, "#c9ccd2").rect(4, 4, 56, 22, "#fbfbfb"); s.line(8, 10, 30, 10, "#2b6fd6").line(8, 15, 40, 15, "#2b6fd6").line(8, 20, 24, 20, "#d64545"); s.circle(48, 14, 5, "#27ae60"); s.rect(2, 28, 60, 2, "#8e939c"); return A.add(s); }

(async () => {
  const furniture = { desk: desk(), table: table(), chair: chair("#6c5b7b"), seat: chair("#8b3a4a"), sofa: sofa("#6b4f8f"), sofa2: sofa("#3f7a6a"), plant: plant(), shelf: shelf(), screen: screen(), lectern: lectern(), coffee: coffee(), rug: rug("#b8574e"), rug2: rug("#4f7f8f"), kiosk: kiosk(), whiteboard: whiteboard() };
  const banners = {
    lobby: A.add(plate(["PRISM OPEN DAY", "PEER-VETTED RESEARCH INITIATIVE FOR SAFETY METHODOLOGIES"], 10, 2, { scales: [4, 1], colors: [GOLD, PAPER] })),
    foyer: A.add(plate(["POSTER FOYER", "FOUR ROOMS, ONE PER TRACK. FOLLOW A COLOURED RUNNER"], 8, 2, { scales: [4, 1], colors: [GOLD, PAPER] })),
    teams: A.add(plate(["TEAM ROOMS", "TWELVE TEAMS, FOUR TRACKS. PRESS SPACE AT A NAMEPLATE"], 12, 2, { scales: [4, 1], colors: [GOLD, PAPER] })),
    lounge: A.add(plate(["LOUNGE", "COFFEE, SOFAS AND A QUIET ROOM"], 8, 2, { scales: [4, 1], colors: [GOLD, PAPER] }))
  };
  const signs = {}; for (const t of ["↑ POSTERS", "← TEAMS", "STAGE →", "↓ LOUNGE", "↓ LOBBY", "← LOBBY", "LOBBY →", "↑ LOBBY", "↓ FOYER"]) signs[t] = A.add(plate([t], 3, 1, { scales: [2], colors: [GOLD] }));
  const order = ["technical", "evals", "frontier", "governance"], roomBanners = {}, doorSigns = {}, sideSigns = {}, signposts = {};
  for (const k of order) {
    roomBanners[k] = A.add(plate([TRACKS[k].name.toUpperCase() + " POSTERS", "STAND ON THE COLOURED STRIP BELOW A BOARD AND PRESS SPACE"], 12, 2, { scales: [3, 1], colors: [GOLD, PAPER], edge: TRACKS[k].color }));
    doorSigns[k] = A.add(plate(["↑ " + TRACKS[k].name.toUpperCase()], 6, 1, { scales: [2], colors: [GOLD], edge: TRACKS[k].color }));
    sideSigns["← " + k] = A.add(plate(["← " + SHORT[k].toUpperCase()], 4, 1, { scales: [2], colors: [GOLD], edge: TRACKS[k].color }));
    sideSigns[k + " →"] = A.add(plate([SHORT[k].toUpperCase() + " →"], 4, 1, { scales: [2], colors: [GOLD], edge: TRACKS[k].color }));
  }
  signposts.foyer = A.add(plate(["↑ FOUR POSTER ROOMS", order.map(k => SHORT[k].toUpperCase()).join(" · "), "↓ LOBBY"], 6, 2, { scales: [2, 1, 2], colors: [GOLD, PAPER, PAPER] }));
  order.forEach((k, i) => {
    const lines = [];
    if (i > 0) lines.push("← " + TRACKS[order[i - 1]].name.toUpperCase());
    if (i < order.length - 1) lines.push(TRACKS[order[i + 1]].name.toUpperCase() + " →");
    lines.push("↓ FOYER · LOBBY");
    signposts[k] = A.add(plate(lines, 6, 2, { scales: lines.map(() => 2), colors: lines.map((l, j) => j === lines.length - 1 ? GOLD : PAPER), edge: TRACKS[k].color }));
  });
  const signpost = A.add(plate(["↑ POSTERS", "← TEAMS · STAGE →", "↓ LOUNGE"], 5, 2, { scales: [2, 2, 2], colors: [GOLD, PAPER, PAPER] }));
  const wallsigns = {}; for (const t of ["PROGRAMME", "DIRECTORY", "QUIET ROOM"]) wallsigns[t] = A.add(plate([t], 3, 1, { scales: [2] }));
  wallsigns["GET INVOLVED"] = A.add(plate(["GET INVOLVED"], 4, 1, { scales: [2] }));
  const bays = {}; for (const k in TRACKS) bays[k] = A.add(plate([TRACKS[k].name.toUpperCase()], 5, 1, { scales: [2], edge: TRACKS[k].color }));
  const nameplates = {}; for (const t of teams) nameplates[t.slug] = A.add(plate([t.short || t.mentor, t.theme], 6, 2, { scales: [2, 1], colors: [PAPER, GOLD], edge: TRACKS[t.track].color }));
  const boards = {}; for (const p of posters) boards[p.id] = await board(p);
  const out = { file: "../tilesets/prism.png", cols: A.cols, width: A.width, height: A.height, tileCount: A.tiles.length, T, floors, faces, trackFloors, furniture, banners, roomBanners, signs, doorSigns, sideSigns, signpost, signposts, wallsigns, bays, nameplates, boards };
  fs.mkdirSync(path.join(ROOT, "tilesets"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "tilesets", "prism.png"), A.png());
  fs.writeFileSync(path.join(ROOT, "tilesets", "prism.json"), JSON.stringify(out));
  console.log("tileset:", A.tiles.length, "tiles,", A.width + "x" + A.height, "·", posters.length, "poster boards ·", teams.length, "nameplates");
})().catch(e => { console.error(e); process.exit(1); });
