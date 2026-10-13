เมืองตอนนี้ · The City, Live — motdang.net/sites/city-live/

  python3 tools/bake.py                        mot-dang files -> out/data/{lamps,specks,names,roads,ground,traffic}.json
  python3 tools/build.py                       src/ + out/data -> out/site
  python3 tools/build.py --motdang 2026-09-30  also -> mot-dang assets/sites/city-live (+card.json)
                                               and docs/sites/city-live
  cd mot-dang && python3 publish/deploy.py --files sites/city-live/<each file> --yes

Baked: places + schedules from docs/api/v1/index.json, roads from cache/roads{,/wide},
rivers + provinces from data/regional_ground.json, TomTom hexes from data/traffic.json.
Read live by the page: /data/{weather,air,ping,sky,events}.json, /ticker.json, /api/v1/search.

Load order: lamps.json (~40 kB, preloaded) paints first; weather/air/ping, ground, specks, roads,
sky, events follow; traffic.json only in rush bands; names.json on the first tap.

URL: ?at=2026-10-02T20:30 shows that Bangkok time · ?card=1 hides the panels ·
#engine opens the panel · #engine/q=khao%20soi runs a query · ` toggles the panel.
Card: headless Chrome on ?at=…&card=1 at 1200x630 -> out/card.jpg.
Preview: launch entry city-live (:8921) in catalog/.claude/launch.json.
