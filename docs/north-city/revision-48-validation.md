# Revision 48 — holiday controls and cyberpunk Halloween

The Holidays control sits directly below time/weather in the right control stack. It offers None (everyday apartment) and Halloween (cyberpunk). Valid choices persist locally; unavailable storage does not prevent live changes. The default is None.

Halloween adds five ribbed metallic jack-o-lanterns with luminous face cutouts and circuit seams; seven gently articulated holographic bats; two floating friendly ghosts; three circuit spiderwebs; a wall moon and Halloween sign; a kitchen Trick or Treat projection; and an amber/violet bedroom lantern garland. Existing room diffusers and eight fixtures receive seasonal colors. Time, weather, city, TV programming and workstation screens remain independently controlled. None restores captured original material/light colors and removes seasonal floor collision bounds. Reduced motion freezes seasonal animation.

Implementation uses existing room lights rather than adding global lights. An initial experiment with extra point lights caused expensive city-wide shader compilation; it was removed before final verification. Two preliminary native runs were interrupted during startup while that fix and the garland placement were completed. The bedroom garland was raised after live inspection so its lanterns clear the television's top edge.

Actual in-app captures:
- test-artifacts/north-city/revision-48/live-living-day.jpg
- test-artifacts/north-city/revision-48/live-living-night.jpg
- test-artifacts/north-city/revision-48/live-kitchen.jpg
- test-artifacts/north-city/revision-48/live-desk.jpg
- test-artifacts/north-city/revision-48/live-bedroom-final.jpg
- test-artifacts/north-city/revision-48/live-holiday-menu.jpg

Final production build passed (room-GLAAtyIT.js). Only the existing large-chunk advisory remains.

The native browser check passed all 14 assertions: default everyday decor, enabling Halloween, independent time/weather, fixture/diffuser tinting, floor collision activation, animated ghosts/bats, reduced-motion freezing, exact original lighting/material/collision restoration, geometry hiding, weather coexistence, persistence after reload, phone layout, disabling on mobile, and no browser/WebGL errors. Seven actual-room captures were saved under test-artifacts/north-city/revision-48/native/; the restoration and mobile screenshots were inspected.

Independent actual-scene visual review accepted round 1 at 8/10. See revision-48-review-1.md for evidence and remaining polish limitations: stylized props and faint secondary projection text in daylight. The final bedroom capture confirms the garland clears the TV.

The original installed browser action client completed successfully using the existing readiness/native-GPU loader. Its captured state reports ready=true, the correct apartment scene and default holiday=none; screenshot and state were inspected, with no error artifact. Evidence is in test-artifacts/north-city/revision-48/bundled-client/. Final git diff --check passed (only existing line-ending conversion notices).

The user tab remains at the apartment layout view with Night/Rain, Halloween selected and the Holidays panel visible. Work remains local and uncommitted.
