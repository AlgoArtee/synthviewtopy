# Revision 31 — larger plaza and blue/pink circuitry

Request: enlarge the plaza, move the two left buildings clear of the mall, and use only neon blue and pink shades for the circuits.

The market slab is now 102.7 × 114.4 m instead of 79 × 88 m: 30% larger on both horizontal axes and 69% more area. The transformation anchors the apartment-facing edge at X=8 and preserves the main chip/mall axis at Z=-5. The mall moves back with the expanded square. Clinic and club move to [40.5,-14,-53.3] and [66.5,-14,-46.8], with another 8 m of leftward offset beyond the expanded layout. Their roofs, signs and equipment move with their storefronts. Adjacent ground slabs meet the new market boundary.

Circuit geometry and chips expand horizontally. Residents, furnishings and fixtures keep their physical sizes while their positions and paths spread across the larger square. Trains keep their existing connected route. Wet-pavement coverage follows the expanded circuit area.

The circuit palette is shared by static traces, vias, chip contacts, chip detail, moving packets and packet glow instances: #168aff, #48b3ff, #ff389f, #ff79c7. Storefront and skyline lighting retain their existing palettes.

Validation:

- TypeScript/Vite production build passes (room-B9odp_AL.js).
- Actual-room capture: 25 checks and 16 screenshots pass, with zero browser/WebGL errors and no source drift. Evidence: `test-artifacts/north-city/revision-31/final-1/results.json`.
- Actual slab geometry measures 102.699995 × 114.400002 m. Both relocated buildings lie fully left of the mall's balcony sightline, including roof/canopy margins. Seven diagnostic rays across the mall's ground frontage find no intervening district geometry.
- Actual static material and animated instance colors match the four blue/pink palette entries. Native train movement, weather, mobile layout, balcony floor and indoor return checks pass.
- Existing transit geometry/two-lap check passes: no tower collisions, 2.363 m minimum tower clearance, unchanged 684.81 m route and 189,081 district triangles. Evidence: `test-artifacts/north-city/revision-31/transit-geometry/results.json`.

The balcony guardrail continues to obscure part of the plaza. The downward chip viewpoint exposes more circuitry; the main panorama balances the square, mall and skyline. This change does not claim a whole-city realism improvement. Independent scoped review and bundled action-client result are recorded separately.

Independent formal round 1 accepted **8.4/10**, with no blocking defects (revision-31-review-1.md). The original bundled action client also passed; its screenshot and ready-state output were inspected. The open in-app browser shows the expanded plaza through the downward chip view, preserving Day/Rain, 35/19/54 window settings, 0.2x stream speed and sound off. No source changes followed the final captures. No commit or deployment.
