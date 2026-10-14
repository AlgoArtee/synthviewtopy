# North City revision 20 — independent scoped visual review, round 2

Date: 2026-10-13. Reviewer: independent realism-review agent. No scene edits, browser interaction or implementation changes were performed by this reviewer.

**Score: 8.2/10. Status: ACCEPTED for the revision-20 visual scope.** This meets the 8/10 minimum in `src/apartments/AGENTS.md`. Round 1 remains recorded as **7.7/10, not accepted**. This is formal round 2 of the maximum 3 for this request; no further round is needed for acceptance of the submitted scope.

The scope is connected near/far transit, aerodynamic train appearance, unified north-window/balcony weather, corrected skyline perspective, and the three balcony-door states. This is not a new whole-city reference-fidelity grade. The historical revision-18 result remains **7.3/10, not accepted, with its three rounds exhausted**; revision 19 remains **8.2/10, accepted for its ceiling/weather/activity enhancements**.

## Frozen evidence and inspection

Evidence directory: `test-artifacts/north-city/revision-20/final-2/`. Capture timestamp: `2026-10-13T11:34:32.942Z`. Runtime URL: `http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1`. The folder contains 29 scene screenshots, five extracted motion frames, one WebM and two JSON files, totaling 37 files. The saved results report 165 checks, zero failed checks, zero browser errors and zero changed sources. `source-hashes.json` contains 32 source hashes.

The following 21 actual-runtime scene screenshots were individually inspected for this focused correction/regression review:

- Prior blockers and paired weather: `balcony-fog.png`, `window-fog.png`, `balcony-snow.png`, `window-snow.png`, `balcony-rain.png`, `window-rain.png`, `balcony-storm.png`, `window-storm.png`, `balcony-academic-foggy-night.png`, `window-academic-foggy-night.png`.
- Door states: `door-closed.png`, `door-half.png`, `door-open.png`.
- Skyline, transit and shelter: `balcony-clear.png`, `balcony-left.png`, `balcony-right.png`, `balcony-ceiling.png`, `transit-clear.png`, `transit-clear-zoom.png`.
- Mobile: `mobile-balcony.png`, `mobile-controls.png`.

All five `motion-frame-01.png` through `motion-frame-05.png` were individually inspected. These are discrete samples from the supplied actual-canvas `transit-motion.webm`. **Continuous video was not watched and audio was not auditioned.** Comparisons retain the user's warped-skyline screenshot and original city reference considered in round 1, and the frozen round-1 findings. Build, geometry, ray-support and audio-state checks are separate functional evidence and do not add visual points.

## Findings and resolution

**Dense-fog blocker resolved.** The dark, remote tower silhouettes that previously remained conspicuous over an almost extinguished plaza are gone in `balcony-fog.png`. Remote structures now disappear into the fog while the nearby railing remains clear and the nearest lit plaza elements remain faintly visible. The paired north-window view similarly preserves nearby facades and obscures street depth. The dense-fog preset is still deliberately close to a whiteout from the open terrace, but it no longer presents the previous inverted distance cues. Rain and storm views retain a more gradual recession of the skyline, and the night view retains local shops and circuit lighting without restoring the remote tower wall.

**Snow-state blocker resolved at the production viewing distance.** The balcony snow capture now shows light accumulation across exposed roof planes and rooftop equipment tops. Those surfaces are visibly lighter than the bare roofs in the clear/rain views. The north-window capture still has its more detailed snow along ledges, fixtures and bridges; both outlooks now portray accumulation as well as snowfall. The treatment is not equally detailed in both districts, but the prior categorical disagreement between accumulated snow on one side and bare exposed roofs on the other is resolved. The covered terrace/railing has not acquired an implausible blanket of exposed-roof snow in the inspected view.

**Door integration remains clear.** Closed, half-open and open states are visually distinct, with a readable glass/frame boundary in the first two states and a clear aperture when fully open. The parked leaf and handle remain coherent after the reported roomward offset; no obvious clipping is visible. Exact rear-handle clearance is a geometry-check result, not something proven by these frontal screenshots. The mobile selector remains legible and within the viewport.

**Skyline and transit corrections remain intact.** Left/right and clear views retain upright dimensional towers without the former warped mirrored photograph. The right-side return visibly joins the near rail into a consistent curved run with supports. The far route is still partly occluded by buildings and haze. A low rounded train with tapered ends and separated cars progresses leftward on the rail across the sampled frames. Its body remains recognizable as streamlined futuristic transit at this viewing distance. There is no visible regression to the disconnected photographic ring or squared, abrupt train silhouette.

**The prior shelter and activity improvements remain present.** The balcony ceiling, beams and lamps are intact. Rain/storm effects are visible beyond the shelter; nearby city lighting and actors remain legible. The sampled train, pedestrians and flying vehicles change position. Mobile framing retains the plaza and transit band, although portrait width naturally reveals less of the route. No recurrence of the earlier black sprite rectangles was observed.

## Remaining limitations

The skyline uses repeated stepped towers and window patterns; clear weather makes that repetition conspicuous. Architectural and material variety remain below the richness of the original city reference. This inherited fidelity gap is preserved in the historical review rather than silently erased by scoped acceptance.

The new snow is a relatively uniform, thin cap treatment with limited irregular buildup, overhangs or drift detail. It resolves the weather-state mismatch but does not simulate fully developed snow deposition. The fog preset obscures most of the vista; this is coherent as dense fog, with limited scenery legibility as its tradeoff.

The route cannot be traced end-to-end from one production view, and the train remains small in the submitted zoom capture. The right view and sampled frames give the strongest appearance evidence. These samples establish movement along a visible rail segment, not uninterrupted completion of the whole loop, animation smoothness or absence of every possible temporal artifact.

Door-dependent sound admission is functionally reported and checked in the captured results, but perceived loudness and transitions were not heard during this visual review. Acceptance here concerns the visible integration; it is not an audio-listening certification.
