# North City revision 20 — independent scoped visual review, round 1

Date: 2026-10-13. Reviewer: independent realism-review agent. No scene edits or browser interaction were performed by this reviewer.

**Score: 7.7/10. Status: NOT ACCEPTED for revision 20.** The required minimum is 8/10 under `src/apartments/AGENTS.md`. This is round 1 of at most 3 for this new request; two rounds remain. The score applies to the immutable evidence below, not to corrective source edits begun while this report was being written.

This review covers connected near/far transit, aerodynamic train appearance, weather consistency between the north window and balcony, correction of the warped skyline, and the closed/half/open balcony door. It does not reopen the exhausted revision-18 city-fidelity review: that historical whole-city result remains **7.3/10, not accepted**. Revision 19 remains **8.2/10, accepted for its ceiling/weather/activity scope**.

## Evidence and inspection method

Actual-runtime evidence directory: `test-artifacts/north-city/revision-20/final-1/`. Capture timestamp recorded in `results.json`: `2026-10-13T11:13:42.882Z`; URL: `http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1`. `source-hashes.json` binds the capture to its source version, and `results.json` records `changedSources: []`. The directory contains 29 scene screenshots, five extracted motion frames, one WebM and two JSON files: 37 files total.

All 29 scene screenshots were individually inspected:

- Door: `door-closed.png`, `door-half.png`, `door-open.png`.
- Balcony weather: `balcony-clear.png`, `balcony-cloudy.png`, `balcony-rain.png`, `balcony-storm.png`, `balcony-fog.png`, `balcony-snow.png`, `balcony-academic-overcast.png`, `balcony-academic-rainy-dusk.png`, `balcony-academic-foggy-night.png`, `balcony-academic-autumn.png`.
- Paired north-window weather: `window-clear.png`, `window-rain.png`, `window-storm.png`, `window-fog.png`, `window-snow.png`, `window-academic-foggy-night.png`.
- Spatial/transit/regression views: `balcony-left.png`, `balcony-right.png`, `balcony-ceiling.png`, `balcony-transit.png`, `transit-clear.png`, `transit-clear-zoom.png`, `transit-before.png`, `transit-after.png`.
- Mobile: `mobile-balcony.png`, `mobile-controls.png`.

`motion-frame-01.png` through `motion-frame-05.png` were also individually inspected. These are discrete samples extracted from the actual canvas recording `transit-motion.webm`, reported as a ten-second recording sampled at 0.5 fps. **I did not watch continuous video or audition audio.** Frame differences establish movement, but cannot establish uninterrupted loop completion, absence of all animation discontinuities, frame pacing, or perceived audio attenuation.

Reference comparison uses the user's revision-20 `references/warped-skyline.png`, the original city reference in `test-artifacts/north-city/revision-18/references/city.jpg`, and the preserved prior reviews. The root's reported 155 functional checks, zero browser errors and production-build pass are separate evidence; they do not add visual points.

## What succeeds

The door's three requested states are unambiguous. Closed glass fills the aperture, half-open exposes one side, and fully open clears the opening with the moving pane parked to the right. The mobile control is readable and fits within the viewport. The screenshots do not expose a conspicuous door intersection, but they are not a precise clearance audit.

The sideways, mirrored photographic skyline defect has been removed. The left, right and clear views now show dimensional towers with coherent verticals and visible side faces, rather than the warped repeated image band in the user's defect screenshot. This resolves that specific perspective complaint. Repetition of stepped towers and window patterns remains evident, especially in clear weather; removal of the projection defect is not a claim of reference-level architectural realism.

The right-side balcony view visibly shows the near rails turning into a returning run with consistent width and supports. This reads as a coherent piece of infrastructure rather than a near line beside an unrelated photographic ring. Far segments remain partly hidden by buildings and atmospheric attenuation, so the entire closed route cannot be traced visually from a single production viewpoint. The functional continuity checks are useful corroboration, not something these screenshots independently prove.

The train has a low, rounded capsule silhouette, tapered end cars, dark glazing/body bands and separated articulated cars. The discrete motion sequence shows the same three-car form progressing leftward along the rail, while other plaza actors also change position. It reads as futuristic transit at the intended viewing distance. Fine aerodynamic detailing is difficult to assess at this scale; the submitted `transit-clear-zoom.png` captures very little train detail, while `balcony-right.png` and the motion frames are more informative.

Rain, storm, clear and foggy-night pairs broadly describe the same selected weather around the apartment. Storm is visibly stronger than rain. The balcony roof and soffit remain intact, and the plaza retains readable lighting and activity at night. No recurrence of the earlier opaque black sprite rectangles is apparent in the inspected views.

## Blocking findings

1. **Dense fog has inconsistent depth extinction.** In `balcony-fog.png`, the nearby plaza and shops are almost washed out, yet remote skyline silhouettes remain disproportionately dark and defined. This makes distant towers look restored over the fog rather than embedded within it. `window-fog.png` presents the expected progression toward obscured street depth, so the paired outlooks do not yet feel like one coherent fog field. Root has separately diagnosed post-process ambient occlusion being applied without appropriate fog extinction; this report's finding is the visible depth inconsistency, not an independent shader diagnosis. Correct the rendering order or attenuation and show that remote geometry no longer punches through the dense fog while nearby surfaces remain readable where appropriate.

2. **Snow state disagrees physically between the two outlooks.** `window-snow.png` clearly accumulates white snow on exposed ledges, fixtures, bridges and other upward-facing surfaces. `balcony-snow.png` shows falling snow and cold haze, but exposed district roofs and rooftop equipment remain predominantly bare. Shelter explains a dry balcony floor, not bare exposed buildings across the plaza. Add comparable accumulation on suitable exposed district surfaces, preserving the sheltered terrace distinction, and inspect the paired snow views again.

These findings directly concern the new request to unify weather; they are substantial enough to keep this round below the acceptance threshold even though the door, transit silhouette and skyline projection changes are materially improved.

## Remaining limits and next evidence

The original city reference still has much richer material variation, irregular architecture and atmospheric depth than this procedural district. That is carried-over context, not a fourth grade of revision 18. The new skyline's repetition is particularly apparent in clear views. Rail continuity is most legible toward the right turn; central production views flatten distant segments and partly conceal the return. Train design remains modestly detailed at the current screen size.

For the next scoped review, provide fresh source-bound paired fog/snow captures, representative clear/rain/night views to detect regressions, and the door/transit views after any related changes. A closer actual-runtime train capture timed to include the train would support a more confident detail assessment. Keep audio behavior stated as functionally checked unless a separate audible recording or listening test is performed. This report does not assert that sound attenuation has been heard or that a full transit loop has been watched.
