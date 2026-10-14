# North City revision 23 — independent scoped visual review, round 1

Score: 8.2/10

Status: **Accepted for the revision 23 local light-flicker scope**, against the 8/10 threshold. This is the first formal graded round for this request; no scene-source revision or further graded round was required. The reviewer wrote the focused capture tools but did not edit scene source.

## Review prompt and evidence

Assess the user's request for flickering plaza lights and especially distant building lights, active at night, evening and morning, with less activity by day. Require actual visible temporal evidence; pulse metadata alone does not establish that an emitter is visible. Preserve the previous lighting, weather and scene-layout character. This is a scoped lighting review, not a reassessment of whole-city reference fidelity.

The primary evidence is `test-artifacts/north-city/revision-23/final-1b/`. Its run passes 120 checks, captures ten exact-canvas stills and two 12-second native canvas WebM recordings, reports no browser errors and has unchanged before/after hashes for 32 scene/capture sources. The first `final-1` run is retained: its sole failure was a test that incorrectly required more than three simultaneous distinct plaza/day pulse values. Rare daytime flicker should not require several fixtures to dim simultaneously. The corrected test still requires multiple participating emitters over time and a mixture of dimmed and steady neighbors.

The reviewer inspected all ten primary stills: `balcony-night-before.png`, `balcony-night-dim.png`, `balcony-night-recovered.png`, `north-night-before.png`, `north-night-dim.png`, `north-night-recovered.png`, `balcony-clear-morning.png`, `balcony-clear-day.png`, `balcony-clear-evening.png`, and `balcony-fog-night.png`.

Additional evidence inspected: the exact `far-visible-crop-triplet.png`, its full `far-visible-dim.png` source, and `native-plaza-lantern-crop-triplet.png`. The first triplet uses exact same-task canvas/emission snapshots. The lantern triplet is extracted from native playback, with approximately aligned 200 ms telemetry. The left, center and right panels show before, dimmed and recovered states. No continuous video audition or audio listening is claimed.

## Visual findings

The plaza storefront event is clearly readable: the ripperdoc lettering and border dim locally and return while the neighboring Data Mall, pavement circuitry and building bodies remain stable. The north-window triplet also changes a distant sign independently, though its smaller image footprint makes the effect more restrained. Both outlooks retain crisp night lettering and varied cyan, rose, violet and warm windows. The change does not create a synchronous city-wide brightness pulse.

The far-window claim was checked directly rather than inferred from a moving train, drone or compressed video difference. A supplementary browser capture used Three.js's observation interface to inspect actual mesh bounds. The selected **Tower 4 local window group** is approximately **142 metres from the camera** and projects to **x544–581, y59–138** in the 1600×1000 balcony frame. A raycast reaches that exact animated material with no nearer geometry at its center. The same-task triplet records its pulse changing **1 → 0.570 → 1**. The crop visibly dims the small window group and restores it while the nearby green sign and adjacent facade remain steady. This is a subtle far-distance change, considerably less conspicuous than the large storefront event. Raw pixel comparisons locate the dim/recover change within the projected patch, typically about 9–10 intensity levels on affected pixels; that measurement corroborates the inspected crop but does not determine the grade.

The plaza's right-hand cyan lantern at approximately **(1332,504)** is independently dimmed in the native-frame crop. Its halo reduces and returns; the bright core remains quite bright because of the existing tone response. The visible effect is a restrained fluctuation rather than a complete lamp blackout. Actual core, halo, pavement-spill and existing point-light values are also recorded by the runtime snapshot.

Morning remains warm, day remains cool and brighter, and evening retains its violet atmosphere. The far lighting is appropriately less conspicuous against the morning/day haze. Night fog retains the softer glow and atmospheric scattering. There is no visible new geometry, clipping, broad light-sheet or facade-layout regression in the inspected viewpoints.

## Functional temporal coverage

The actual runtime samples cover 48 explicitly advanced scene seconds at each time, across 31 balcony sign/facade emitters, 14 north emitters and eight plaza lanterns. Every emitter participates in each sampled period. Relative to day, mean dimming is approximately **5.5–7.6×** stronger for balcony night/evening/morning, **4.5–6.7×** for the north outlook and **4.5–7.0×** for plaza lanterns. Day also has fewer dimmed samples and shallower drops. Simultaneous activity remains a minority of each district. Reduced motion returns all three sets to steady emission, and all ten weather options remain wired to both outlooks.

These runtime checks establish the four-time behavior; the visual temporal examples were captured at night. The native clips preserve roughly 11–12 actual scene seconds each, with 60 telemetry samples per clip. Frame extraction demonstrates real local changes, but it does not substitute for a human's continuous pacing assessment across every weather/time combination.

## Remaining limits and historical boundaries

Far-window changes occupy small screen areas and can be easy to miss in a still image or against daylight haze. Several deeper window patches are geometrically occluded from the default balcony position; the direct visible-patch check prevents those hidden materials from supplying the visual proof. The earlier native Tower 31 extraction is retained as diagnostic material but is **not** relied on for the far-window visual finding because its center is occluded. Plaza lamp cores remain strongly tone-mapped, so their halo/spill fluctuation is clearer than their core brightness change. The city still uses repeated facade patterns and simplified materials.

These limitations do not block the requested localized flicker change. Revision 18 remains **7.3/10, not accepted**, after its three exhausted whole-city rounds. Revisions 19, 20 and 21 remain **8.2/10** for their scopes; revision 22 remains **8.4/10** for its final scoped polish. This revision 23 acceptance does not supersede those records or claim whole-city reference fidelity.
