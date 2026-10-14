# North City revision 21 — independent scoped visual review, round 1

Score: 8.2/10

Status: **Accepted for the revision 21 time-of-day, weather and lighting enhancements** against the 8/10 threshold. This is the first formal graded round for this request. The earlier `final-1` test attempt was not a graded visual review.

## Scope and evidence

This review covers the independent Night, Morning, Day and Evening selection across the existing weather modes; corresponding sky, lighting and shadow changes; warmer Dark Academia morning/day lighting; and stronger night/evening/fog lights with softer daytime emission. It also checks representative interior, balcony ceiling, doorway and mobile-control views for regressions. The reviewer authored the browser test/capture script but did not implement or edit the scene sources. The visual score comes from actual rendered images, separately from functional checks.

The graded evidence is the immutable actual browser capture at `test-artifacts/north-city/revision-21/final-1b/`. Its completed run reported 40 time/weather combinations, 1,667 passing checks, 24 screenshots, no browser errors and unchanged before/after source hashes. The first capture, `final-1`, is preserved: two window-opening assertions sampled the existing animated window before it settled. Only the capture script's window-settle wait was corrected for `final-1b`. Passing checks establish functional coverage; they do not contribute visual points.

The following 23 files were individually visually inspected. Every path below is relative to `test-artifacts/north-city/revision-21/final-1b/`:

- `balcony-clear-night.png`
- `balcony-clear-morning.png`
- `balcony-clear-day.png`
- `balcony-clear-evening.png`
- `window-clear-night.png`
- `window-clear-morning.png`
- `window-clear-day.png`
- `window-clear-evening.png`
- `balcony-fog-night.png`
- `balcony-fog-morning.png`
- `balcony-fog-day.png`
- `balcony-fog-evening.png`
- `balcony-academic-autumn-night.png`
- `balcony-academic-autumn-morning.png`
- `balcony-academic-autumn-day.png`
- `balcony-academic-autumn-evening.png`
- `balcony-rain-night.png`
- `balcony-snow-day.png`
- `balcony-storm-evening.png`
- `balcony-ceiling-morning.png`
- `interior-evening.png`
- `balcony-door-night.png`
- `mobile-controls.png`

`mobile-balcony-evening.png` was captured but was not visually inspected and is not used to support this grade. These are still-image observations. No continuous video playback or audio audition was performed for this review. The original city reference at `test-artifacts/north-city/revision-18/references/city.jpg` and the prior revision outcomes remain the historical context; this round does not regrade the original whole-city fidelity request.

## Findings

The four clear-weather balcony views communicate different times convincingly. Night has a dark sky and building bodies, strong cyan signage and circuits, and visible warm window lights. Morning introduces warmer light, illuminated facade faces and long directional shadows. Day is cooler and more neutral, with softer halos and clearer building mass. Evening shifts the atmosphere toward mauve and peach while increasing the visual prominence of neon. The difference is visible in the rendered scene rather than merely in a control label.

The four paired north-window images follow those changes coherently. The morning and evening lighting also affects the bed, ceiling and interior walls, making the controls feel connected to the room. In particular, evening introduces a warm pink cast to the interior while preserving the cyan and magenta city signage. The two outlooks read as views into the same selected time and atmosphere, despite their different compositions and distances.

Dark Academia autumn morning and day are visibly warmer than the standard clear equivalents. The beige and ochre atmosphere, warm facade illumination, leaves and rain make these modes distinguishable without losing their city setting. Autumn night retains the cooler nocturnal appearance, while evening combines warm haze with stronger lights. The inspected rain-night, snow-day and storm-evening combinations remain recognizable as their weather types. Snow accumulation on exposed roofs remains visible; the storm still shows dense, angled precipitation. No prior black rectangular sprite artifact or opaque distant fog silhouette was evident in these inspected images.

Fog now preserves luminous information while attenuating solid geometry. Night and evening retain readable shop lettering and light cores after much of the remote architecture disappears. This supports the requested city-light visibility in fog. The result is strongest at night and evening and substantially more subdued in daytime, as detailed below.

The morning ceiling view retains a coherent overhead slab, beams and fixtures, with directional light across the nearby wall. The night doorway view retains a readable covered route and railing, without an obvious new clipping or floor artifact. The evening interior remains legible. The inspected phone screenshot shows readable time, weather, window, balcony-door and sound controls within the viewport, with labels and selected values intact. The panel occupies a considerable part of the portrait view, but there is no obvious horizontal overflow in that image. Scroll accessibility and other phone combinations were exercised functionally; this is not a claim that all phone scene compositions were visually reviewed.

## Remaining limitations

- **Morning and daytime dense fog are pale and low contrast.** The main shop labels remain discernible, but distant window and neon cores are faint and may be difficult to read on a dim display. Softer daytime emission is achieved, though the visual balance leaves limited headroom for the separate wish for readable lights in fog. This is a visible quality limitation, not an assertion that every distant sign is clear.
- **Night fog can reveal detached-looking window grids.** Luminous windows persist after their building bodies are extinguished, producing a somewhat floating, graphic appearance. Strong cyan bloom and fairly uniform light treatment keep this less natural than the reference's varied atmospheric scattering and local illumination.
- **The existing city simplifications remain.** Repeated tower forms, regular window patterns and simplified architecture/material variation are still apparent. This enhancement does not resolve the original reference-fidelity gap.
- Still images cannot establish continuous precipitation smoothness, full transit-loop behavior, temporal shadow stability or the audible quality of door/weather sound transitions. Functional snapshot and control checks cover behavior, but no listening claim is made.

No blocking visual defect was established within the new revision 21 scope. The requested time distinction, warmer seasonal daylight and relative neon behavior are sufficiently clear for scoped acceptance, with the fog limitations retained above.

## Historical acceptance boundaries

Revision 18 remains **7.3/10, not accepted**, after its three exhausted formal reviews of the original whole-city result. Revision 19 remains **8.2/10, accepted for its ceiling/weather/activity scope**. Revision 20 remains **8.2/10, accepted for its transit, skyline, unified-weather and door scope**. This revision 21 score does not supersede those records or imply that the entire city now matches the original reference at an accepted fidelity level.
