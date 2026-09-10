#!/usr/bin/env node
/* Writes the pages the world opens in its side panel: one per poster, one
   per team, the directory, programme, about, reading list, get involved
   and the coffee machine. Plain HTML, no build step.  node scripts/build-pages.cjs */
"use strict";
const fs = require("fs"), path = require("path");
const { ROOT, BASE, TRACKS, ROOMS } = require("./world.cjs");
const posters = require(path.join(ROOT, "content", "posters.json")), teams = require(path.join(ROOT, "content", "teams.json"));
const OUT = path.join(ROOT, "pages");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const CSS = `
:root{--bg:#141a26;--card:#1c2333;--ink:#ece5d3;--dim:#a39c8b;--gold:#e9b949;--line:#2c3446}
*{box-sizing:border-box}html{color-scheme:dark}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 "Avenir Next",Avenir,"Helvetica Neue",Helvetica,Arial,sans-serif;padding:20px 18px 40px}
h1{font-size:1.45rem;line-height:1.25;margin:.2rem 0 .6rem}h2{font-size:1.05rem;margin:1.6rem 0 .5rem;color:var(--gold);text-transform:uppercase;letter-spacing:.06em}
p{margin:.5rem 0}a{color:var(--gold)}img{max-width:100%;height:auto;display:block;border-radius:6px;background:#fff}
.kicker{font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin:0}.kicker b{color:var(--accent,var(--gold))}
.authors{color:var(--dim);font-size:.95rem}.fine{color:var(--dim);font-size:.8rem}.hint{color:var(--dim);font-size:.85rem;margin-top:.3rem}
.btn{display:inline-block;background:var(--gold);color:#141a26;font-weight:600;padding:.5rem .9rem;border-radius:6px;text-decoration:none;margin:.4rem .4rem .4rem 0}
.card{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--accent,var(--gold));border-radius:8px;padding:.8rem 1rem;margin:.6rem 0}
.card h3{margin:0 0 .25rem;font-size:1rem}.card p{margin:.2rem 0;color:var(--dim);font-size:.92rem}
ul{padding-left:1.2rem}li{margin:.3rem 0}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:.6rem}
table{border-collapse:collapse;width:100%;font-size:.95rem}td,th{text-align:left;padding:.4rem .5rem;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--dim);font-weight:600}
.frame{border:1px solid var(--line);border-radius:8px;padding:6px;background:#fff}
`;
function shell(title, body, accent) { return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style></head><body${accent ? ` style="--accent:${accent}"` : ""}>${body}<p class="fine" style="margin-top:2rem">PRISM open day · <a href="${BASE}/pages/directory.html">directory</a></p></body></html>`; }
function write(rel, html) { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); }
const trackOf = k => TRACKS[k] || { name: k, color: "#e9b949" };

/* posters */
for (const p of posters) {
  const t = trackOf(p.track);
  write(`posters/${p.id}.html`, shell(p.title, `
<p class="kicker">NeurIPS 2025 poster · <b>${esc(t.name)}</b> bay</p>
<h1>${esc(p.title)}</h1>
<p class="authors">${esc(p.authors.join(", "))}</p>
<a href="${p.image}" target="_blank" rel="noopener" title="Open the poster full size in a new tab"><img src="${p.image}" alt="Poster: ${esc(p.title)}" loading="eager"></a>
<p class="hint">Click the poster to open it full size in a new tab. Pinch or scroll to zoom there.</p>
${p.abstract ? `<h2>Abstract</h2><p>${esc(p.abstract)}</p>` : ""}
${p.keywords ? `<p class="fine">Topic: ${esc(p.keywords)}</p>` : ""}
<p><a class="btn" href="${p.page}" target="_blank" rel="noopener">Open on neurips.cc</a></p>
<p class="fine">The poster image is served by neurips.cc and belongs to its authors. It is shown here for the PRISM open day, with a link back to the original.</p>`, t.color));
}

/* teams */
for (const tm of teams) {
  const t = trackOf(tm.track);
  write(`teams/${tm.slug}.html`, shell(tm.title, `
<p class="kicker">PRISM 2026 team · <b>${esc(t.name)}</b></p>
<h1>${esc(tm.title)}</h1>
<p class="authors">Mentor: ${esc(tm.mentor)} · ${esc(tm.theme)}</p>
<p>${esc(tm.blurb)}</p>
<h2>Meet the team</h2>
<p>Step inside the pod and press SPACE to join the team's call. The fellows will be in and out of their pod during the open day; the programme says when each team presents on the stage.</p>
<p><a class="btn" href="${BASE}/pages/programme.html">Programme</a> <a class="btn" href="${BASE}/pages/directory.html">Directory</a></p>`, t.color));
}

/* directory */
const byTrack = k => teams.filter(t => t.track === k), postersBy = k => posters.filter(p => p.track === k);
write("directory.html", shell("Directory", `
<p class="kicker">PRISM open day</p><h1>Directory</h1>
<p>Five rooms, joined by doors. Walk onto a door mat to go through. Stand on a sign or a coloured strip and press SPACE to read.</p>
${Object.keys(ROOMS).map(k => `<div class="card"><h3>${esc(ROOMS[k].name)}</h3><p>${esc(ROOMS[k].blurb)}</p></div>`).join("")}
<h2>The four tracks</h2>
${Object.keys(TRACKS).map(k => `<div class="card" style="--accent:${TRACKS[k].color}"><h3>${esc(TRACKS[k].name)}</h3><p>Teams: ${byTrack(k).map(t => esc(t.mentor)).join(", ") || "none"}</p><p>Posters in the hall: ${postersBy(k).length}</p></div>`).join("")}
<h2>Tips</h2>
<ul><li>Arrow keys or WASD to walk. Walk up to someone and your cameras connect.</li><li>SPACE opens whatever the prompt at the bottom of the screen offers.</li><li>The auditorium puts everyone in the seats into one call, so mute when you are not speaking.</li><li>The quiet room in the lounge keeps microphones off.</li></ul>`));

/* programme */
const sorted = [...teams].sort((a, b) => ["technical", "evals", "frontier", "governance"].indexOf(a.track) - ["technical", "evals", "frontier", "governance"].indexOf(b.track));
write("programme.html", shell("Programme", `
<p class="kicker">PRISM open day</p><h1>Programme</h1>
<p>The running order for the day. Times will be confirmed by the PRISM team; the shape of the day is set.</p>
<table><tr><th>Block</th><th>What happens</th><th>Where</th></tr>
<tr><td>Doors open</td><td>Arrive, pick an avatar, find the welcome desk.</td><td>Lobby</td></tr>
<tr><td>Opening</td><td>Welcome from the PRISM programme team and what the cohort set out to do.</td><td>Auditorium</td></tr>
<tr><td>Cohort showcase</td><td>Each of the twelve teams presents for fifteen minutes, in track order.</td><td>Auditorium</td></tr>
<tr><td>Poster session</td><td>Walk the NeurIPS 2025 posters that shaped the teams' methods. Fellows are on hand by the boards of their track.</td><td>Poster hall</td></tr>
<tr><td>Office hours</td><td>Every team is in its pod. Step in and press SPACE to join the conversation.</td><td>Team rooms</td></tr>
<tr><td>Closing</td><td>What comes next for the papers and for PRISM.</td><td>Auditorium</td></tr></table>
<h2>Showcase order</h2>
<ol>${sorted.map(t => `<li><b>${esc(t.mentor)}</b>: ${esc(t.title)} <span class="fine">(${esc(trackOf(t.track).name)})</span></li>`).join("")}</ol>`));

/* about */
write("about.html", shell("About PRISM", `
<p class="kicker">Welcome desk</p><h1>What PRISM is</h1>
<p><b>PRISM</b> is the Peer-vetted Research Initiative for Safety Methodologies: a sixteen-week AI safety research fellowship run by <a href="https://w2d2.org" target="_blank" rel="noopener">Women Who Do Data</a>. Teams of four fellows work with one senior mentor each, and the whole programme is built backwards from one goal: a paper submitted to a conference by week sixteen.</p>
<h2>How a team works</h2>
<ul><li><b>Weeks one and two:</b> a distributed literature review. Each fellow reads a few papers deeply and teaches them to the team.</li>
<li><b>Week three:</b> every fellow proposes methodologies.</li>
<li><b>Week four:</b> the team votes, with the mentor. Two votes each, one of which must go to someone else. The winner sets the direction.</li>
<li><b>Week six onwards:</b> pairs run experiments in parallel and present to each other every week.</li>
<li><b>All the way through:</b> contribution is tracked from day one and shown to everyone, so authorship is never a surprise at the end.</li></ul>
<h2>The 2026 cohort</h2>
<p>Twelve mentor projects across four tracks: Technical Safety, Risks and Evaluations, Frontier Risks, and Governance. Around eight hundred people applied, three quarters of them women, from every continent. The cohort started in June 2026.</p>
<p><a class="btn" href="https://prism-research.org" target="_blank" rel="noopener">prism-research.org</a> <a class="btn" href="${BASE}/pages/directory.html">Directory</a></p>`));

/* reading list */
write("reading.html", shell("Reading list", `
<p class="kicker">Quiet room</p><h1>Reading list</h1>
<p>Every poster hanging in the hall, by bay. Each link opens the poster page on neurips.cc in a new tab.</p>
${Object.keys(TRACKS).map(k => `<h2 style="color:${TRACKS[k].color}">${esc(TRACKS[k].name)}</h2><ul>${postersBy(k).map(p => `<li><a href="${p.page}" target="_blank" rel="noopener">${esc(p.title)}</a><br><span class="fine">${esc(p.authors.slice(0, 4).join(", "))}${p.authors.length > 4 ? " and others" : ""}</span></li>`).join("")}</ul>`).join("")}`));

/* get involved */
write("join.html", shell("Get involved", `
<p class="kicker">Lounge</p><h1>Get involved with PRISM</h1>
<div class="card"><h3>Apply as a fellow</h3><p>The next call opens on <a href="https://prism-research.org" target="_blank" rel="noopener">prism-research.org</a>. Twenty hours a week for sixteen weeks, remote, with a real paper at the end.</p></div>
<div class="card"><h3>Mentor a team</h3><p>Mentors bring a project and meet their team weekly. Write to <a href="mailto:support@prism-research.org">support@prism-research.org</a>.</p></div>
<div class="card"><h3>Volunteer</h3><p>Programme support volunteers keep the cohort running: onboarding, tooling, reviews. Same address.</p></div>
<div class="card"><h3>Women Who Do Data</h3><p>PRISM is a W2D2 programme. See <a href="https://w2d2.org" target="_blank" rel="noopener">w2d2.org</a> for everything else the community does.</p></div>`));

/* coffee */
write("coffee.html", shell("Coffee", `
<p class="kicker">Lounge</p><h1>The coffee machine</h1>
<p>It is a picture of a coffee machine. Go and make a real one, then come back: the sofas are a good place to catch a fellow between talks.</p>
<p class="fine">Tip: walk up to someone and your cameras connect. Up to four people share one bubble.</p>`));

console.log("pages:", posters.length, "posters,", teams.length, "teams, and 7 fixed pages in", path.relative(ROOT, OUT));
