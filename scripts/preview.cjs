#!/usr/bin/env node
/* Renders a map to a PNG at a chosen scale so the layout can be judged
   without opening Tiled: node scripts/preview.cjs lobby [out.png] [divisor] */
"use strict";
const fs = require("fs"), path = require("path");
const { encodePNG, SIZE } = require("./paint.cjs");
const { ROOT } = require("./world.cjs");
const name = process.argv[2] || "lobby", D = +(process.argv[4] || 2);
const map = JSON.parse(fs.readFileSync(path.join(ROOT, "maps", name + ".tmj"), "utf8"));
const png = require("pngjs").PNG.sync.read(fs.readFileSync(path.join(ROOT, "tilesets", "prism.png")));
const src = png.data, SW = png.width, COLS = SW / SIZE;
const W = map.width * SIZE / D | 0, H = map.height * SIZE / D | 0, out = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) { out[i * 4] = 8; out[i * 4 + 1] = 8; out[i * 4 + 2] = 10; out[i * 4 + 3] = 255; }
for (const l of map.layers) {
  if (l.type !== "tilelayer" || /^(collisions|zone-|start)/.test(l.name)) continue;
  for (let ty = 0; ty < l.height; ty++) for (let tx = 0; tx < l.width; tx++) {
    const g = l.data[ty * l.width + tx]; if (!g) continue;
    const id = g - 1, sx = (id % COLS) * SIZE, sy = Math.floor(id / COLS) * SIZE;
    for (let j = 0; j < SIZE / D; j++) for (let i = 0; i < SIZE / D; i++) {
      const si = ((sy + j * D) * SW + (sx + i * D)) * 4, a = src[si + 3] / 255; if (!a) continue;
      const di = ((ty * SIZE / D + j) * W + (tx * SIZE / D + i)) * 4;
      for (let c = 0; c < 3; c++) out[di + c] = src[si + c] * a + out[di + c] * (1 - a);
    }
  }
}
/* areas as outlines, so the interaction strips and doors can be checked */
const fl = map.layers.find(l => l.name === "floorLayer");
for (const o of fl.objects) {
  const col = o.properties.some(p => p.name === "exitUrl") ? [255, 80, 80] : o.properties.some(p => p.name === "start") ? [80, 255, 120] : o.properties.some(p => p.name === "jitsiRoom") ? [120, 160, 255] : o.properties.some(p => p.name === "silent") ? [200, 120, 255] : [255, 220, 80];
  const x0 = o.x / D | 0, y0 = o.y / D | 0, x1 = (o.x + o.width) / D - 1 | 0, y1 = (o.y + o.height) / D - 1 | 0;
  for (let x = x0; x <= x1; x++) for (const y of [y0, y1]) { const di = (y * W + x) * 4; out[di] = col[0]; out[di + 1] = col[1]; out[di + 2] = col[2]; }
  for (let y = y0; y <= y1; y++) for (const x of [x0, x1]) { const di = (y * W + x) * 4; out[di] = col[0]; out[di + 1] = col[1]; out[di + 2] = col[2]; }
}
const dest = process.argv[3] || path.join(ROOT, "maps", name + "-preview.png");
fs.writeFileSync(dest, encodePNG(out, W, H)); console.log("wrote", dest, W + "x" + H);
