# Revision 43 — wall computer displays and kitchen fridge

User request: bring the desk projections close to the wall, add more PC projections on the wall, and add a tall fridge beside the kitchen.

## Implemented

- Eight wall-parallel computer displays, arranged in three rows, replace the previous floating display arrangement. Actual panel-to-wall clearance is 38 mm. Added file archive, resource monitoring, terminal and render-queue dashboards alongside the existing code, neural field, orbital and sensor views. A slim wall projection rail sits above the desk.
- A 2.18 m pearl-white refrigerator with a lower freezer stands at the south end of the kitchen. Separate doors, gaskets, chrome handles, levelling feet, toe vents and a temperature display give it depth and scale. It clears the worktop by 141 mm and the east wall by 50 mm.
- The fridge collider includes its handles. Updated Room guide viewpoints frame the complete workstation and kitchen additions. Both additions are decorative; appliance opening and live computer interaction were not requested.

## Verification

- `npm run build`: passed TypeScript and Vite production build. Existing large-bundle advisory remains.
- `node scripts/north-city-interior-upgrade-review.mjs`: 11 checks passed against the actual running apartment, with day/night captures of both views. Checks cover wall clearance and facing, panel separation, floor contact, appliance/counter/wall clearance, handle-inclusive collision, and walking along the kitchen aisle. No browser or WebGL errors.
- Final native results and screenshots: `test-artifacts/north-city/revision-43/native-verified/`. Source hashes in `results.json` confirm the source was unchanged during verification.
- Original installed `develop-web-game/scripts/web_game_playwright_client.js`, with the existing project loader, completed its movement/space action burst successfully. Reviewed `bundled-client/shot-0.png` and `state-0.json`; room ready, eight displays and the fridge reported, no error artifact.
- Actual in-app browser captures: `test-artifacts/north-city/revision-43/live-study.jpg` and `live-kitchen.jpg`.
- Separate formal visual review round 1: **8.2/10, accepted**. See `revision-43-review-1.md`. Muted daylight dashboard contrast and uniform white materials are non-blocking visual limitations.

The first native run captured all four views without application errors but its inspection hook missed Vite's timestamped module URL. The test route was corrected to accept query strings; the complete rerun passed. Original evidence remains under `revision-43/native/`. No production code change was needed for that harness issue.

Changes remain local and uncommitted. No outstanding work for this request.
