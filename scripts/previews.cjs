#!/usr/bin/env node
/* Renders every map in maps/ to docs/previews/<map>.png at half scale, with
   areas outlined: red exits, green arrivals, yellow press-SPACE spots, blue
   shared calls, purple silent zones.   node scripts/previews.cjs */
"use strict";
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const ROOT = path.join(__dirname, ".."), OUT = path.join(ROOT, "docs", "previews");
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, "maps")).filter(f => f.endsWith(".tmj")).sort()) {
  const name = f.replace(".tmj", "");
  execFileSync(process.execPath, [path.join(__dirname, "preview.cjs"), name, path.join(OUT, name + ".png"), "2"], { stdio: "inherit" });
}
