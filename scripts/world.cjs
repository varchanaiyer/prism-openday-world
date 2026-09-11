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
  posters: { name: "The Poster Foyer", floor: ["#e3e4e6", "#dadbdf"], face: "#6f7480", blurb: "Four doors, one per PRISM track, each with a coloured runner on the floor. The signpost in the middle lists them." },
  "posters-technical": { name: "Technical Safety posters", style: "posters", track: "technical", blurb: "NeurIPS 2025 posters on interpretability, steering and the mechanics of alignment." },
  "posters-evals": { name: "Risks and Evaluations posters", style: "posters", track: "evals", blurb: "NeurIPS 2025 posters on red teaming, safety benchmarks, multilingual and medical evaluation, and confidence." },
  "posters-frontier": { name: "Frontier Risks posters", style: "posters", track: "frontier", blurb: "NeurIPS 2025 posters on agent security, reward hacking and safety degradation in deployed systems." },
  "posters-governance": { name: "Governance posters", style: "posters", track: "governance", blurb: "NeurIPS 2025 posters on regulation, deployment security and where the field should go." },
  stage: { name: "The Auditorium", floor: ["#3a3550", "#36314b"], face: "#3b3548", blurb: "The main stage. Everyone in the seats shares one call for talks and the cohort showcase." },
  teams: { name: "The Team Rooms", floor: ["#c9a678", "#c19c6d"], face: "#7a5a3a", blurb: "Twelve pods, one per PRISM team. Read the nameplate, then press SPACE to join the team call." },
  lounge: { name: "The Lounge", floor: ["#c8d5c0", "#bfcdb6"], face: "#5f7a5a", blurb: "Coffee, sofas, the get-involved board, and a quiet reading room." }
};
const SHORT = { technical: "Technical", evals: "Evaluations", frontier: "Frontier", governance: "Governance" };
module.exports = { ROOT, BASE, TRACKS, ROOMS, SHORT, readEnv };
