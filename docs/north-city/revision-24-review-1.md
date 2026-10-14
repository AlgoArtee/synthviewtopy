# North City revision 24 — independent scoped visual review, round 1

Score: 8.2/10

Status: **Accepted for the revision 24 distant-window TV-shadow scope**, against the 8/10 threshold. This is the first formal graded round for this request. The reviewer created the focused capture script and inspected the running room, but did not edit scene source. No scene repair or second graded round was required.

## Review prompt and evidence

Assess approximately 40% of distant city windows having changing interior shadows and colored light resembling television activity. Require actual spatial changes within visible windows, not just a uniform facade brightness pulse. Check both the balcony skyline and north outlook, all four time settings, stable selection and reduced motion. This is a scoped addition, not a renewed whole-city realism assessment.

Evidence is in `test-artifacts/north-city/revision-24/final-1/`, produced by `scripts/north-city-window-tv-review.mjs`. The single browser run passed **70 checks**, reached the actual ready WebGL room, reported **zero browser/WebGL errors**, and preserved identical before/after source hashes. It produced eight primary exact-canvas PNGs, two nearest-neighbor temporal crop triplets and one native 12-second canvas WebM recording. The native recording is retained as supplemental evidence; this review does not claim continuous video audition.

The reviewer inspected all eight primary images: `balcony-night-t0.png`, `balcony-night-t1.png`, `balcony-night-t2.png`, `north-night-t0.png`, `north-night-t1.png`, `north-night-t2.png`, `balcony-day.png` and `north-day.png`. Both `balcony-window-temporal-crop.png` and `north-window-temporal-crop.png` were also inspected. Each triplet contains the same small crop from the three actual frames, enlarged four times without synthesizing detail. Captures use the same camera and actual scene timestamps separated by approximately 1.43 and 2.11 additional seconds.

## Visual findings

The balcony crop shows an interior dark region shifting within a rose-lit window while a neighboring warm room remains steady. Changes affect the distribution of light and shadow across the opening, with restrained cool/rose variation. They do not flash the whole facade or move its frame. The broad scene retains sharp night signs, dark building bodies and stable masonry; train and pedestrian motion are not counted as evidence of this feature.

The selected balcony room is **3129**, on an actual tagged facade approximately **144.5 metres** from the camera. Its opening projects to **x520–531, y30–39** in the 1600×1000 frame. Three.js scene observation, UV mapping and a raycast establish that this window is visible and belongs to the animated material. The sampled interior is seven by six pixels. After fitting a uniform brightness gain and offset, its remaining spatial difference is **6.58–8.31 intensity levels RMS**; adjacent unselected room 3128 changes only **0.034 RMS**. This corroborates the inspected local shadow change, rather than determining the visual grade.

The north crop shows a darker, subtler interior change, with a cool illuminated region emerging to one side and a changing shadow distribution. This room is **509**, approximately **72.2 metres** away, projected to **x862–876, y303–313**. The ten by six interior pixels have spatial residuals of **2.84–7.08 RMS**, while the unselected control is exactly stable in both comparisons. Its dim starting level and small footprint make the change less immediately noticeable than the balcony example, but it is visible in the crop and is not only a whole-window brightness adjustment.

Both day views keep the existing daylight atmosphere. The interior effect is appropriately restrained against brighter facades and haze. No new light sheet, unmasked facade wash, moving frame, clipping or obvious geometry regression is visible in the inspected views. Night remains the clearest setting for observing the new small interior changes.

## Functional scope

The actual tagged balcony population is **24,576 animated windows out of 61,440 (40.0%)**. The north population is **599 out of 1,496 (40.04%)**. Selection remains fixed across samples and all four times of day; individual rooms have independent phases and spatial shadow positions change in each time setting. Coverage is a count of the tagged distant window population, not a claim that 40% of the current screen's visible pixels are animated.

TV strength follows the configured night/evening/morning/day values **1.0 / 0.9 / 0.65 / 0.28**. Reduced-motion mode keeps the recorded interior light, color and shadow samples unchanged after advancing twelve scene seconds. Runtime snapshots and source inspection confirm static geometry, static texture maps and no additional point lights for the TV effect. The ready-room check verifies actual shader compilation, separately from the parent's passing production build, bundled client and pure helper checks.

## Limits and historical record

These are small distant-room illusions. At normal viewing size many windows occupy only a few pixels, so individual interior movement is subtle and cannot establish detailed people or a readable television program. The north example is particularly dark. The feature supplies changing TV-like illumination and shadow shapes, not decoded video or fully modeled inhabitants. Repeated facade patterns and the prior simplified city geometry remain. The focused run used clear weather for clean temporal attribution; it does not independently repeat the full previous weather, geometry or audio suites. Continuous pacing across every weather/time combination was not visually auditioned.

These limits do not block the requested scoped addition. Revision 18 remains **7.3/10, not accepted**, after its three exhausted whole-city rounds. Revisions 19, 20 and 21 remain **8.2/10** for their respective scopes; revision 22 remains **8.4/10** and revision 23 remains **8.2/10** for their accepted scoped changes. This score preserves those records and does not claim whole-city reference fidelity.
