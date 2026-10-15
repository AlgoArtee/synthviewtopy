# Revision 47 — rooftop hologram placement

Moved the existing female projections out of the central street view and onto the three rooftops indicated in the user's red-arrow reference. The fan dancer is on the left roof hut, the singer is beside the nearer right roof equipment, and the parasol figure is on the next right roof hut.

The positions are derived from the actual seeded buildings, rather than guessed absolute heights. Small physical projector discs rest on those roofs. Figure heights are now 4.3 m, 3.5 m and 5.1 m (previously 7.2 m, 8 m and 11.4 m). Original artwork, scan/cloth/particle animations, haze and reduced-motion behavior are retained.

Reference: `C:/Users/Admin/AppData/Local/Temp/codex-clipboard-0e19a8be-72cb-4252-ba88-a2b81a33ddae.png`.

Actual in-app captures inspected:
- `test-artifacts/north-city/revision-47/live-bed-day.jpg`
- `test-artifacts/north-city/revision-47/live-panorama-night.jpg`

These confirm rooftop contact visually, the left/right placement, smaller scale and the unobstructed central canyon in day/night views. This correction changes existing prop transforms and adds emitter discs; it does not substantially rebuild the apartment, so no new formal graded scene-review round was invoked.

TypeScript/Vite build passes (`room-BgTRXXck.js`); only the existing large-chunk advisory remains. The native test now checks projector contact by casting down onto actual city architecture, plus placement and scale. Its first run erroneously included hidden seasonal snow geometry, producing a 0.192 m gap on roof huts. The test was corrected to exclude invisible ancestors; original results are preserved in `native/hidden-snow-harness-results.json`. No product change was needed. A transient hot-reload error between the two coordinated building-ID edits is historical; the completed source resolves all three roof anchors.

Final native rerun passes all six checks with no browser/WebGL errors and four day/night bed/window captures. Actual projector-to-roof gaps are below 0.000001 m. Original installed develop-web-game client also passes with `ready=true` and no error artifact; its screenshot and state were inspected. The final native bed capture was inspected against the arrow reference. Evidence is under `test-artifacts/north-city/revision-47/{native,bundled-client}/`. `git diff --check` passes. User tab remains at the daytime bed outlook. No requested work remains; changes are local and uncommitted.
