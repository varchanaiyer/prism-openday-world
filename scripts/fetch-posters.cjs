#!/usr/bin/env node
/* Reads content/posters.txt, fetches each poster's public page on neurips.cc,
   and writes content/posters.json (title, authors, abstract, keywords, image
   addresses) plus a small thumbnail per poster in content/thumbs/ for the
   tileset painter. Only metadata is committed; the thumbnails are fetched
   again on demand. Run: node scripts/fetch-posters.cjs */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const UA = { "User-Agent": "Mozilla/5.0 (PRISM open day world builder)" };
const lines = fs.readFileSync(path.join(ROOT, "content", "posters.txt"), "utf8").split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"));
const decode = s => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
async function one(track, id) {
  const page = "https://neurips.cc/virtual/2025/poster/" + id;
  const html = await (await fetch(page, { headers: UA })).text();
  const ld = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/);
  if (!ld) throw new Error("no JSON-LD for " + id);
  const meta = JSON.parse(ld[1]);
  if (!meta.image) throw new Error("no poster image uploaded for " + id + " (" + meta.name + ")");
  const abs = html.match(/<div class="abstract-text-inner">([\s\S]*?)<\/div>/);
  const kw = html.match(/<meta name="keywords" content="([^"]*)"/);
  const image = "https://neurips.cc" + meta.image.split("?")[0], thumb = "https://neurips.cc" + (meta.thumbnailUrl || meta.image).split("?")[0];
  const file = path.join(ROOT, "content", "thumbs", id + ".png");
  if (!fs.existsSync(file)) { const r = await fetch(thumb, { headers: UA }); if (!r.ok) throw new Error("thumb " + r.status + " for " + id); fs.writeFileSync(file, Buffer.from(await r.arrayBuffer())); }
  return { id: String(id), track, title: meta.name, authors: (meta.author || []).map(a => a.name), abstract: abs ? decode(abs[1]) : "", keywords: kw ? decode(kw[1]) : "", page, image, thumb };
}
(async () => {
  const out = [];
  for (const l of lines) { const [track, id] = l.split(/\s+/); try { const p = await one(track, id); out.push(p); console.log("ok ", id, track, p.title.slice(0, 70)); } catch (e) { console.log("ERR", id, String(e).slice(0, 100)); } }
  fs.writeFileSync(path.join(ROOT, "content", "posters.json"), JSON.stringify(out, null, 1));
  console.log(out.length, "posters written");
})();
