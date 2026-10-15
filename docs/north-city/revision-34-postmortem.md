# Revision 34: near circuit visibility and balcony guardrail approach

The user reported an incomplete near/south circuit bundle and a balcony viewpoint that could no longer reach the guardrail for a downward view.

The circuit geometry was intact. Actual scene raycasts identified the neighboring north-street podium as the obstruction: its top at world Y -34.71 covered four lines on the plaza at Y -37.93. The podium extended to world X 22.475 and Z -11.46. Its unused southeast corner is now notched back, with the rear slab preserved beneath the lateral buildings. The circuit paths, palette and animation were not changed.

The navigation model previously applied its 24 cm body radius to the rail, stopping the eye roughly 30 cm behind the handrail center. Balcony guards are now identified explicitly. The eye can lean over their waist-high caps while the slab perimeter still contains movement. The walls, doorway, planter and inner balcony edges retain normal clearance. Partial blocked steps resolve to contact, including at slower frame rates. The plaza guide viewpoint starts at the rail; drag down to inspect the complete circuit.

Verification evidence lives in `test-artifacts/north-city/revision-34`. The reference and original sources are preserved there. The 61 geometry/navigation checks cover all 13 near circuit lanes, lateral building support, both rail boundaries, corner containment, retreat and wall clearance at multiple frame steps. Existing bed navigation and 321 door checks also pass. Production build passed with `room-BgiNGM3V.js`; its existing bundle-size advisory remains.

Native capture, original bundled action-client and independent scoped review results are recorded in the final validation and review files. This revision does not regrade the historical whole-city realism result or change the mall, train route, club, lighting controls or sound preferences.

The first native run preserved 12 screenshots and passed its movement, doorway, retained-feature, error and source-integrity checks. One test assertion incorrectly read serialized screen-coordinate arrays as `.x`/`.y`; the recorded coordinates and circuit ray hits were valid. Corrected the test to use array indices and increased its downward drag to inspect the near endpoints. This required no further scene changes. The first run remains in the evidence directory rather than being overwritten.

Final result: all15native checks and12screenshots pass with zero browser/WebGL errors and unchanged39source hashes. The original bundled action client passed. Independent scoped round1 accepted8.5/10 with no blockers; the review preserves viewport framing and motion-evidence limits. Final validation binds43artifacts. The user tab was restored to Day/Clear and left looking down over the complete near circuit. No commit or push was performed.
