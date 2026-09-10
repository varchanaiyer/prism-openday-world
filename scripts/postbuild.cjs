#!/usr/bin/env node
/* After the map optimiser has written dist/, copy in the pages and write an
   index that walks people into the lobby. */
"use strict";
const fs = require("fs"), path = require("path");
const { ROOT, BASE } = require("./world.cjs");
const DIST = path.join(ROOT, "dist");
fs.cpSync(path.join(ROOT, "pages"), path.join(DIST, "pages"), { recursive: true });
const host = BASE.replace(/^https?:\/\//, ""), play = `https://play.workadventu.re/_/global/${host}/maps/lobby.tmj`;
fs.writeFileSync(path.join(DIST, "index.html"), `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=${play}"><title>PRISM Open Day</title></head><body style="background:#141a26;color:#ece5d3;font-family:Avenir Next,Helvetica,Arial,sans-serif;padding:40px"><p>Walking you in: <a style="color:#e9b949" href="${play}">${play}</a></p></body></html>`);
console.log("dist ready · play address:", play);
