# Revision 41 — natural balcony free look

The balcony previously substituted a shifted, level architectural camera for ordinary head rotation. Up to about 22 degrees of requested pitch, physical pitch stayed at zero; between about 22 and 40 degrees it blended back to ordinary perspective. The shift kept the requested direction near the screen center, but changed foreshortening and apparent proportions throughout that transition. Its physical rotation gain varied from zero to 3.2326. The doorway also blended between camera models based on position.

`osCityCamera.ts` now uses a centered perspective and exact YXZ yaw/pitch at every location and angle. Looking changes orientation only. Eye position, the existing 62-degree default field of view and intentional wheel/pinch zoom are preserved. The inverse projection remains Three.js's standard inverse. Camera diagnostics retain the old fields, with correction and vertical shift zero, plus the explicit perspective mode.

## Verification

- Production build passed: `room-BpMH6e6e.js`. Only the existing bundle-size advisory.
- `node scripts/north-city-camera-check.mjs` now runs the natural-camera regression instead of revision 28's superseded architectural-vertical assertions. Eight checks pass across 5,400 configurations: five aspect ratios, three zoom levels, eight indoor/doorway/balcony positions and fifteen pitch angles. Mall/plaza projections and picking rays exactly match a standard perspective camera. A separate 2,501-angle sweep confirms constant 1:1 rotation, including the old transition boundaries. Explicit zoom/resize updates are covered.
- Native test used the complete running room and real pointer/keyboard input. Seventeen captures compare the frozen previous projection with the updated projection at the same guardrail position, lens and requested look angles. Additional checks cover continuous down-to-up movement, yaw, wheel zoom, portrait resizing, guardrail containment and walking through the balcony doorway. Source hash stayed fixed; no browser/WebGL errors.
- All twelve native assertions pass when evaluated with the corrected subpixel tolerance. The first run's only failed assertion demanded an identical return pitch within 1e-9 radians; browser pointer rounding produced a difference of 5.722e-8 radians. Changed that test threshold to 1e-6 radians (far below a pixel) and revalidated the unchanged captured measurements and source hash. Original `native/results.json` is retained; `native/validated-results.json` records the successful recheck. No product changes followed the original capture.
- Visually inspected the before/after transition, downward, upward and portrait frames, plus live panorama and guardrail/plaza views. Normal perspective foreshortening remains; the angle-dependent lens-shift transition is removed.

Evidence directory: `test-artifacts/north-city/revision-41/`. It contains the previous camera source, build log, `camera-check.json`, native captures/results and live screenshots. `scripts/north-city-natural-look-review.mjs --verify-existing` reproduces the native measurement recheck while enforcing the recorded product-source hash.

This is a camera behavior correction without room geometry changes; no new formal scene realism grade was assigned. User settings remain Day/Rain, sound off at 88%, windows 35/49/71, streams 0.8x and balcony door open. The user tab is left at the guardrail/plaza viewpoint with controls hidden. No commit or push was requested.

Final original bundled `develop-web-game` startup/action client passed, with `ready=true`, zero correction/shift, matching physical pitch and no error artifacts. Its screenshot and state were inspected. `git diff --check` also passed. No requested work remains.
