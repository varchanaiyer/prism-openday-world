/// <reference types="@workadventure/iframe-api-typings" />
/* The open day's map script: a banner naming each room, bay and team pod as
   you walk in, and a Directory button. Zones are tile layers named
   zone-<key>, painted by scripts/build-maps.cjs, which also writes world.json. */
import world from "./world.json";

const W: { base: string; zones: Record<string, string> } = world;

WA.onInit().then(() => {
  for (const key of Object.keys(W.zones)) {
    WA.room.onEnterLayer("zone-" + key).subscribe(() => {
      try {
        WA.ui.banner.openBanner({ id: "zone", text: W.zones[key], bgColor: "#141a26", textColor: "#e9b949", closable: false, timeToClose: 3200 });
      } catch (e) { console.warn("banner", e); }
    });
  }
  const here = (WA.room.mapURL || "").split("/").pop() || "";
  const rooms: [string, string][] = [["lobby", "Lobby"], ["posters", "Posters"], ["stage", "Stage"], ["teams", "Teams"], ["lounge", "Lounge"]];
  for (const [key, label] of rooms) {
    if (here.startsWith(key + ".tmj")) continue;
    WA.ui.actionBar.addButton({ id: "go-" + key, label, callback: () => { WA.nav.goToRoom("./" + key + ".tmj#from-" + (here.replace(/\.tmj.*$/, "") || "lobby")); } });
  }
  WA.ui.actionBar.addButton({
    id: "directory", label: "Directory",
    callback: () => { WA.nav.openCoWebSite(W.base + "/pages/directory.html", false, "", 50).catch(e => console.warn(e)); }
  });
  console.info("PRISM open day script ready");
}).catch(e => console.error(e));

export {};
