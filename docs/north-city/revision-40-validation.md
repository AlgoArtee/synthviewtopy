# Revision 40 — varied market lighting and enclosed south shops

Request: make the distant ground-market lights less regular and vary their forms using the supplied foggy-market reference; add Circuit Dive and Neuralware's missing side and rear walls.

## Changes

- Replaced the repeated awning/two-lamp pattern with six fixture families: round lanterns, tall segmented signs, rectangular lightboxes, sagging bulb strings, neon rings and partial awning strips. Seeded variation changes spacing, angle, canopy height, brightness, color, halo size and ground pools. Blue, pink, violet, warm amber and warm white fixtures sit on supported street-stall frames. The separate blue/pink plaza circuit palette is unchanged.
- Retained the 24 collision-cleared outer market clusters. They now contain 63 small canopies and 151 varied light fixtures, rendered in four batches with no additional realtime lights. Physical geometry remains within the original footprints.
- Added 0.32 m side/rear walls, floor slabs and ceilings to Circuit Dive and Neuralware's lower stories. Aligned their upper bodies with those walls and the existing roofs. Front glazing, signs and recessed shop displays remain visible.
- Preserved the corrected balcony-right Myco Neo/Bio Spice positions and moving mall visitors.

## Verification

- `npm run build`: passed, room bundle `room-CI3Lq5TY.js` (existing bundle-size advisory only).
- `git diff --check`: passed (working-copy newline notices only).
- `scripts/north-city-outer-market-check.mjs`: 10/10 checks pass, no browser/GLSL errors. Includes actual-mesh footprint containment, all six light forms, weather response, four rendered batches, and 114 rays confirming continuous side/rear walls on both shops from ground floor to roof and from inside and outside.
- Original installed `develop-web-game` action client, using the existing readiness/Playwright loader: passed with `ready=true`, no error artifacts. Inspected its screenshot and state; the runtime contains the final 24 clusters, 63 canopies, 151 fixtures and all three enclosed shop shells.
- Inspected actual running-room captures in Day/Rain on the right and Night/Fog on both sides. The fixture silhouettes and brightness vary through the haze, and both south shops' side elevations now meet the ground. The user tab is restored to the south-market balcony view in Day/Rain with controls collapsed and stored window/audio/stream settings retained.

Evidence: `test-artifacts/north-city/revision-40/outer-market-check.json`, `right-day-rain.jpg`, `right-night-fog.jpg`, `left-night-fog.jpg`, `right-final.jpg`, and `bundled-client/{shot-0.png,state-0.json}`. Build log: `test-artifacts/north-city/revision-40-build.log`.

This is a bounded lighting-pattern revision and enclosure repair, not a new apartment or substantial layout change; no new formal realism grade was assigned. These distant market fixtures are deliberately simplified for the balcony viewing distance. No commit or push was requested in this turn.
