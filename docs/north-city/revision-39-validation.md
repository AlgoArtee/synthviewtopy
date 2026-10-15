# Revision 39 — balcony-right stands and market lights in the haze

The user clarified that right means the balcony viewer's right. Myco Neo is now at (96, 37), and Bio Spice at (105, 33), on the positive-Z/Circuit Dive side of the mall. Both footprints remain outside the plaza and clear of the mall, towers and pedestrian routes. Their fronts face back toward the balcony/plaza.

Added 24 distant ground-level market light clusters, with 60 small supported awning/counter silhouettes, hanging lamps, soft ground pools and low haze halos. They occupy gaps outside the plaza, with tower-footprint exclusions. Blue, pink and occasional warm lights fade with the existing atmospheric density and respond to day/night, fog and wetness. The effect adds four draw calls and no realtime lights; depth testing keeps it behind occluding buildings.

Verification completed:

- Production build passed: `room-BKNhms-c.js`.
- Seven outer-market checks passed, including actual shader compilation/rendering, ground height, tower clearance, external placement and weather response. No browser or shader errors.
- Ten placement/mall-motion checks passed, including 18,000 outdoor route samples, 63,706 mall visitor positions and 25 full-body pose frames.
- Original bundled web-game client passed with `ready=true`, the corrected stand positions, 24 light clusters and all 106 animated mall visitors. Screenshot inspected; no error artifacts.
- Inspected actual live balcony views on both sides in Day/Rain and the right side in Night/Fog. The two stands appear to the right of the mall; market lights remain visible among tower bases through the haze. Live error log empty.
- `git diff --check` passed. Existing edits from earlier requests were retained.

Evidence: `test-artifacts/north-city/revision-39/geometry-motion.json`, `outer-market-check.json`, `source-hashes.json`, `bundled-client/`, `right-day-rain.jpg`, `left-day-rain.jpg`, `right-night-fog.jpg`, and `right-final.jpg`.

The user tab is left on the south market view (balcony-right) in Day/Rain with controls collapsed and the prior window, sound and circuit-speed settings preserved.
