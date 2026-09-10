/* Shared vocabulary for the PRISM open day world: the four tracks, the five
   rooms, and where the placard pages are served from. */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
function readEnv(k) { try { const m = fs.readFileSync(path.join(ROOT, ".env"), "utf8").match(new RegExp("^" + k + "=(.*)$", "m")); return m && m[1].trim(); } catch (e) { return null; } }
const BASE = (process.env.PAGES_BASE || readEnv("PAGES_BASE") || "https://varchanaiyer.github.io/prism-openday-world").replace(/\/$/, "");
const TRACKS = {
  technical: { name: "Technical Safety", color: "#5b8def" },
  evals: { name: "Risks & Evaluations", color: "#e0a03c" },
  frontier: { name: "Frontier Risks", color: "#e05c6c" },
  governance: { name: "Governance", color: "#48b38a" }
};
const ROOMS = {
  lobby: { name: "The Lobby", floor: ["#d9d2c3", "#d1c9b8"], face: "#8d7b66", blurb: "Welcome desk, programme, directory, and doors to everything else." },
  posters: { name: "The Poster Hall", floor: ["#e3e4e6", "#dadbdf"], face: "#6f7480", blurb: "NeurIPS 2025 posters on standing boards, one bay per PRISM track." },
  stage: { name: "The Auditorium", floor: ["#3a3550", "#36314b"], face: "#3b3548", blurb: "The main stage. Everyone in the seats shares one call for talks and the cohort showcase." },
  teams: { name: "The Team Rooms", floor: ["#c9a678", "#c19c6d"], face: "#7a5a3a", blurb: "Twelve pods, one per PRISM team. Read the nameplate, then press SPACE to join the team call." },
  lounge: { name: "The Lounge", floor: ["#c8d5c0", "#bfcdb6"], face: "#5f7a5a", blurb: "Coffee, sofas, the get-involved board, and a quiet reading room." }
};
module.exports = { ROOT, BASE, TRACKS, ROOMS, readEnv };
