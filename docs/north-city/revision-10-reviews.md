# Expressive city ghost portraits — revision 10

User request: beautiful Asian female features on both holographic ghosts, blinking and head movement. Scope is the two original adult feminine spectral portraits. City placement/scale, flowing gowns, architecture, bedding, weather and circulation remain preserved.

## Formal review history

| Round | Score | Result | Report | Evidence |
| --- | ---: | --- | --- | --- |
| 1 / 3 | 7.6 / 10 | Not accepted | [Full report](revision-10-review-1.md) | `test-artifacts/north-city/revision-10/review-1` |
| 2 / 3 | 8.1 / 10 | Accepted | [Full report](revision-10-review-2.md) | `test-artifacts/north-city/revision-10/review-2` |

Round 1 found conspicuous independent neck capsules, graphic eyes on a smooth shell and excessive background show-through in the central face. Hair remained parallel and repetitive. The reviewer inspected open, closed and turned portrait states plus city-detail and panorama; no direct WebM playback was claimed.

## Changes before round 2

- Removed the old rounded neck ellipsoid; an open taper blends between shoulder line and jaw with fades at both ends.
- Strengthened central face opacity while retaining translucent silhouettes, deeper cheek/nose/socket relief, volumetric eyelids with matching morph normals, softer lash accents, sculpted shaded lip volumes and tiny recessed nostrils.
- Varied hair in swept groups, with unequal widths, lengths and bends.
- Kept independent 0.29 s eyelid closure, slow head yaw/nod/tilt and gown wind motion. Reduced-motion mode freezes every animation at time zero.

Runtime checks are separate from visual scores. Round 1 and final evidence are not overwritten. No paid services, exports, deployment or commit are included.

## Acceptance and limits

Round 2 accepted at 8.1/10; one formal check remains unused. The reviewer inspected eight actual runtime images and confirmed continuous jaw/neck/shoulder construction, better eyelid/nose/lip depth, closed eye states and changed head orientation. No direct WebM playback was claimed. Smooth cheeks/foreheads, some graphic contours, cyan sign bleed-through, ribbon-like hair and simplified ears remain limits. The result is a stylized real-time spectral portrait, visibly rendered rather than photographic.

## Final technical evidence

- TypeScript/Vite build passed; usual large-chunk warning only.
- Ten 1920 × 1080 portrait/city frames and two live approximately 8-second WebM clips. Deterministic frames hold browser RAF and advance the actual production room renderer; live videos retain normal timing.
- Evaluated mesh aperture heights change from 12.900/12.200 mm to zero; upper lid vertices move 8.700/8.000 mm. Morph normals follow the closed shape. Actual head-local quaternions differ independently of body rotation.
- Unequal blink sequences checked over 40 seconds at 30 samples/s; normal live animation changes head/gown state. Reduced-motion runtime remains unchanged after a 12-second advance.
- Final geometry audit: 1,561,050 unique triangles; 1,902,272 including instances. Both ghost characters total 153,568 triangles. Finite geometry and morph attributes, no browser/shader errors.
- All 270 bed-to-TV rays remain clear. Four bedding boundaries still meet wall planes within 0.001 mm, with no cabinet intersection. Weather/control-collapse checks pass.
- Portrait source bindings and evidence hashes are preserved separately for both graded rounds. Existing accepted architecture, circulation, bed navigation and fifty 4K Snapshots remain their prior versions.

Final room regression captures passed: 28 viewpoints, including four corners and three ceiling views; entrance, clear/rain/snow duvet views and 390 px mobile fit bring the set to 33 PNGs. No browser errors. Evidence: `test-artifacts/north-city/revision-10/room-views-2/`. Actual-mesh plan: `test-artifacts/north-city/revision-10/validation-2/floor-plan.png`. All final source hashes verified after acceptance.
