# Revision 38 — market relocation and mall visitors

Moved Myco Neo to (96, -47) and Bio Spice to (105, -43), facing back toward the plaza. Their complete footprints lie beyond the east plaza boundary at X=88.6, in the upper-right gap between the club and mall. Live inspection prompted two placement adjustments so both stalls remain visible from the balcony.

Replaced the mall's 106 static geometric people with walking visitors across all ten floors and the entrance. Five instanced batches provide coats, faces/hands, articulated limbs, shoes and hair. Visitors follow contained gallery routes with varied gait phases. Their clock is independent of circuit speed; reduced motion pauses their entire pose and resumes without catch-up. Existing photographic interior panels retain their baked imagery.

Validation:

- Production build passed: `room-MWbKBA4S.js`.
- `scripts/north-city-mall-visitors-check.mjs`: all 10 checks passed. Sampled 63,706 visitor positions, 25 complete-body pose frames and 18,000 outdoor route positions. No rail, glazing, floor, neighboring visitor, building or outdoor-route conflicts. Circuit pause and reduced-motion/resume checks passed.
- Original bundled web-game client exited successfully with `ready=true`, 106 animated visitors and both final stall coordinates in its state. Screenshot inspected; no error artifacts.
- Live user-tab screenshots inspected: both relocated stalls visible and mall visitor positions visibly change between frames. Browser error log empty. User tab left at the mall viewpoint with Day/Rain, controls collapsed and prior sound/window/stream settings retained.
- `git diff --check` passed. No formal scene regrade was requested for this placement and animation adjustment.

Evidence under `test-artifacts/north-city/revision-38/`:

- `geometry-motion.json`
- `build.log`
- `market-final.jpg`
- `mall-frame-a.jpg` and `mall-frame-b.jpg`
- `bundled-client/shot-0.png` and `bundled-client/state-0.json`

An additional full-room capture process was interrupted before readiness during placement tuning and is not counted as a passing test. Earlier placement screenshots are retained as intermediate evidence.
