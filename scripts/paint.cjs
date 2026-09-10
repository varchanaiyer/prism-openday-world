/* A tiny pixel painter: sprites of any size, an atlas that slices them into
   32 px tiles, a 3 by 5 bitmap font, and a PNG encoder. No dependencies. */
"use strict";
const zlib = require("zlib");
const SIZE = 32;

function hex(c) { if (Array.isArray(c)) return c; const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mulberry(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

class Sprite {
  constructor(w, h) { this.w = w; this.h = h; this.px = Buffer.alloc(w * h * 4); }
  put(x, y, c, a = 255) {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4, col = hex(c);
    if (a >= 255) { this.px[i] = col[0]; this.px[i + 1] = col[1]; this.px[i + 2] = col[2]; this.px[i + 3] = 255; return; }
    const k = a / 255, ka = this.px[i + 3] / 255, out = k + ka * (1 - k);
    if (out <= 0) return;
    for (let c2 = 0; c2 < 3; c2++) this.px[i + c2] = (col[c2] * k + this.px[i + c2] * ka * (1 - k)) / out;
    this.px[i + 3] = Math.min(255, out * 255);
  }
  rect(x, y, w, h, c, a) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, c, a); return this; }
  frame(x, y, w, h, c, a) { this.rect(x, y, w, 1, c, a); this.rect(x, y + h - 1, w, 1, c, a); this.rect(x, y, 1, h, c, a); this.rect(x + w - 1, y, 1, h, c, a); return this; }
  circle(cx, cy, r, c, a) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r * 0.5) this.put(cx + i, cy + j, c, a); return this; }
  ring(cx, cy, r, c, a, t = 1) { for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) { const d = Math.hypot(i, j); if (d <= r + 0.5 && d > r - t + 0.5) this.put(cx + i, cy + j, c, a); } return this; }
  ellipse(cx, cy, rx, ry, c, a) { for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) if ((i * i) / (rx * rx + 0.25) + (j * j) / (ry * ry + 0.25) <= 1) this.put(cx + i, cy + j, c, a); return this; }
  line(x0, y0, x1, y1, c, a) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))); for (let k = 0; k <= n; k++) this.put(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), c, a); return this; }
  grain(amt, seed) { const R = mulberry(seed); for (let i = 0; i < this.w * this.h; i++) { if (!this.px[i * 4 + 3]) continue; const n = (R() * 2 - 1) * amt; for (let c = 0; c < 3; c++) this.px[i * 4 + c] = Math.max(0, Math.min(255, this.px[i * 4 + c] + n)); } return this; }
  gradient(x, y, w, h, c0, c1) { const a = hex(c0), b = hex(c1); for (let j = 0; j < h; j++) { const t = j / Math.max(1, h - 1); this.rect(x, y + j, w, 1, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); } return this; }
  radial(cx, cy, r, c, aMax) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const d = Math.hypot(i, j) / r; if (d < 1) this.put(cx + i, cy + j, c, aMax * (1 - d) * (1 - d)); } return this; }
  blit(sp, x, y) { for (let j = 0; j < sp.h; j++) for (let i = 0; i < sp.w; i++) { const k = (j * sp.w + i) * 4, a = sp.px[k + 3]; if (a) this.put(x + i, y + j, [sp.px[k], sp.px[k + 1], sp.px[k + 2]], a); } return this; }
  flipH() { const s = new Sprite(this.w, this.h); for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) { const k = (j * this.w + i) * 4, m = (j * this.w + (this.w - 1 - i)) * 4; s.px[m] = this.px[k]; s.px[m + 1] = this.px[k + 1]; s.px[m + 2] = this.px[k + 2]; s.px[m + 3] = this.px[k + 3]; } return s; }
  flipV() { const s = new Sprite(this.w, this.h); for (let j = 0; j < this.h; j++) this.px.copy(s.px, (this.h - 1 - j) * this.w * 4, j * this.w * 4, (j + 1) * this.w * 4); return s; }
  text(x, y, str, opts = {}) { return font.draw(this, x, y, str, opts); }
}

/* ---------- a 3 by 5 capitals font ---------- */
const G = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111", F: "111100110100100", G: "011100101101011",
  H: "101101111101101", I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101",
  O: "010101101101010", P: "110101110100100", Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010", U: "101101101101011",
  V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010", Z: "111001010100111",
  "0": "010101101101010", "1": "010110010010111", "2": "110001010100111", "3": "110001010001110", "4": "101101111001001", "5": "111100110001110", "6": "011100110101010", "7": "111001010010010", "8": "010101010101010", "9": "010101011001110",
  " ": "000000000000000", ".": "000000000000010", ",": "000000000010100", ":": "000010000010000", ";": "000010000010100", "'": "010010000000000", "?": "110001010000010", "!": "010010010000010",
  "-": "000000111000000", "/": "001001010100100", "&": "010101010101011", "(": "001010010010001", ")": "100010010010100", "º": "010101010000000", "·": "000000010000000", "+": "000010111010000", "=": "000111000111000", "%": "101001010100101"
};
const font = {
  norm(s) { return String(s).toUpperCase().replace(/[’‘]/g, "'").replace(/[“”]/g, "").replace(/—|–/g, "-").replace(/É/g, "E").replace(/[^A-Z0-9 .,:;'?!\-\/&()º·+=%]/g, ""); },
  width(str, scale = 1) { return Math.max(0, font.norm(str).length * 4 * scale - scale); },
  draw(sp, x, y, str, { scale = 1, color = "#ece5d3", alpha = 255, align = "left" } = {}) {
    const s = font.norm(str); let cx = align === "center" ? x - font.width(s, scale) / 2 : align === "right" ? x - font.width(s, scale) : x; cx = Math.round(cx);
    for (const ch of s) { const g = G[ch] || G["?"]; for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r * 3 + c] === "1") sp.rect(cx + c * scale, y + r * scale, scale, scale, color, alpha); cx += 4 * scale; }
    return sp;
  },
  wrap(str, maxChars, maxLines) {
    const words = font.norm(str).split(" "), lines = []; let line = "";
    for (const w of words) { const t = line ? line + " " + w : w; if (t.length > maxChars && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].slice(0, maxChars - 1) + "."; }
    return lines.map(l => l.length > maxChars ? l.slice(0, maxChars - 1) + "." : l);
  }
};

/* ---------- the atlas: sprites sliced into tiles, 16 per row ---------- */
class Atlas {
  constructor(cols = 16) { this.cols = cols; this.tiles = []; }
  add(sp) { /* returns a grid of tile ids, [row][col] */
    const grid = [];
    for (let ty = 0; ty < sp.h / SIZE; ty++) { const row = []; for (let tx = 0; tx < sp.w / SIZE; tx++) { const t = new Sprite(SIZE, SIZE); for (let j = 0; j < SIZE; j++) for (let i = 0; i < SIZE; i++) { const k = ((ty * SIZE + j) * sp.w + tx * SIZE + i) * 4; t.px[k === -1 ? 0 : (j * SIZE + i) * 4] = sp.px[k]; t.px[(j * SIZE + i) * 4 + 1] = sp.px[k + 1]; t.px[(j * SIZE + i) * 4 + 2] = sp.px[k + 2]; t.px[(j * SIZE + i) * 4 + 3] = sp.px[k + 3]; } row.push(this.tiles.push(t) - 1); } grid.push(row); }
    return grid;
  }
  one(sp) { return this.add(sp)[0][0]; }
  get rows() { return Math.ceil(this.tiles.length / this.cols); }
  get width() { return this.cols * SIZE; }
  get height() { return this.rows * SIZE; }
  pixels() { const W = this.width, H = this.height, out = Buffer.alloc(W * H * 4); this.tiles.forEach((t, id) => { const ox = (id % this.cols) * SIZE, oy = Math.floor(id / this.cols) * SIZE; for (let j = 0; j < SIZE; j++) t.px.copy(out, ((oy + j) * W + ox) * 4, j * SIZE * 4, (j + 1) * SIZE * 4); }); return out; }
  png() { return encodePNG(this.pixels(), this.width, this.height); }
}

/* ---------- PNG ---------- */
const crcTable = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc32(buf) { let c = -1; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function encodePNG(px, W, H) {
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; px.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

module.exports = { Sprite, Atlas, font, hex, mulberry, encodePNG, SIZE };
