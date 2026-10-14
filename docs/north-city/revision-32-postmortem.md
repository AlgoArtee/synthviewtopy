# Revision 32 — through railway, concrete paving and club enclosure

The visible railway loop is replaced by an open 782.52 m route through the city. Track, edge lights, supports and vehicles share a geographic fade from 165 to 245 m along the north/south direction. The physical endpoints lie beyond the invisible zone. Trains retain 8.4 m/s motion and reset at the opposite endpoint only while completely invisible. No visible return curve remains. The viewpoint label is now “City maglev through line.”

The user's daylight reference is preserved at `test-artifacts/north-city/revision-32/references/plaza-shapes.png`. A diagnostic in the actual running room isolated the large dark shapes: removing the color map left them visible, while removing the roughness map removed them. Evidence is in `surface-diagnosis/01-before-morning.png`, `02-no-color-map.png`, and `03-no-color-or-roughness-map.png`. One earlier diagnostic attempt was interrupted by source hot reload before its control interaction; it produced no accepted captures.

The paving now uses fine, low-contrast concrete grain and quieter slab joints. Large oval roughness and albedo patches are removed. Low metalness and restrained rain-dependent clearcoat retain a wet sheen without the daylight pattern. The procedural random sequence is preserved so this material edit does not rearrange the city. Circuit geometry, blue/pink colors and moving packets remain intact.

Neon Loop Club now has 0.32 m thick lower side and rear walls, a continuous floor and a ceiling over the ground level. Its upper solid body is aligned to the roof footprint. The new walls join the existing upper shell without duplicate coplanar upper faces; the original façade, glazing and room recess remain.

Validation:

- Production build passes: `dist/assets/room-CFx3uXNF.js`.
- `scripts/north-city-through-transit-check.mjs`: 24 endpoint resets over two traversals, zero visible resets, 8.395–8.405 m/s sampled motion, and 1.273 m minimum clearance from modeled towers. The route advances monotonically north to south. Actual rendered instanced-material pixels are fully transparent beyond both fade ends and partially transparent in the transition.
- All 36 ray samples strike the club's side/rear walls at lower and upper floor heights. The complete district submits 189,389 triangles.
- `scripts/north-city-through-line-review.mjs`: 28 actual-room checks and 24 native screenshots pass, with no browser/WebGL errors or source drift. Views cover morning/day clear and rain pavement, north/south railway, wide daytime/nighttime panorama, club placement, mobile and retained weather/indoor return.
- Historical closed-loop transit tests describe the previous design. The new through-transit check replaces that closed-loop invariant for this request.

Evidence lives in `test-artifacts/north-city/revision-32/`. Formal scoped visual review and the bundled action-client result are recorded separately. The balcony railing still masks portions of the plaza and lower club walls. Static screenshots do not independently prove the temporal endpoint reset; the geometry simulation and rendered fade checks establish that behavior. No whole-city realism claim is made.

Completion: independent visual review accepted round 1 at **8.3/10**, with no blocking defects (`revision-32-review-1.md`). The original bundled web-game action client completed successfully; its saved state reports ready on page 0.8.0, its native screenshot was inspected, and no browser error file was produced. The user's existing browser is left on the updated plaza in Day/Clear, with stored window, stream and audio controls preserved. Final source and evidence hashes are recorded in `revision-32-validation.json`. No commit or deployment was made.
