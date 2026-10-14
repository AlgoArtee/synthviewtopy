# O’s City Apartment — North City

This residence follows the six original user-supplied references and the later rainy-city reference. The island navigation places **North City** directly above **Lux Umbrarum Student Spaces**. North City has its own directory and the first residence is `/room.html?id=os-city-apartment`.

## Local room contract

- Runtime: Three.js in the existing room viewer, with WASD/arrows, drag look, pinch/scroll zoom, reset, fullscreen and named viewpoints.
- Shell: asymmetric main room plus an expanded north-west square sleeping alcove, 3.5 m ceiling, 143.833 m² gross footprint (14.6 × 15.61 m bounding envelope). The main living rectangle doubles from 30.24 to 60.48 m² by extending its south wall 3.15 m. The north-east 3.4 × 2.85 m corner is outside the apartment.
- Arrangement: an 8.55 × 8.55 m wall-fitted square bed and full 8.55 × 3.5 m modern north glazing in the extended north-west alcove, plus a 3.72 m holographic TV on its left wall; bathroom north-middle; floating chair and brilliant-white luminous carpet moved together 1.3 m farther into the living area; desk along the south wall; kitchen east; apartment entrance south-west.
- Hero: a huge square cotton bed with six oversized down pillows below a full-wall panoramic window, with a fully dimensional, animated rainy neon city beyond it (with snow available through the weather panel). The north wall infill is removed completely; slim aluminium perimeter frames, three structural mullions and dark gaskets seal four laminated glass panes.
- Circulation: 0.24 m player radius, bounded floor and furnishing/partition collisions. Space at the foot of the bed (or the touch Climb bed button) climbs to a 0.72 m mattress support; walking off steps down. The glazing remains solid. Bathroom clear door width is 1.02 m; the private apartment entrance is 1.14 m. These are domestic doorway exceptions to a public-room arrival width.
- Ceiling: five concentric annular housings join the ceiling underside, with interrupted opal diffusers. The fixture is a fixed architectural light.
- Lighting: an initially visible weather panel at the top right exposes six selectable outdoor states (clear, overcast, rain, storm, snow and fog) change sky, visibility, precipitation, snow/wet surfaces and indoor window light. Weather changes refresh the reflection probe. Broad window and ceiling emitters, soft shadowed daylight, local pastel bathroom light and a glass bedside practical provide fixture-scale illumination. The shared viewer adds contact occlusion, reflection probe, restrained bloom and anti-aliasing.
- Budget: no paid services, no external mesh generation, deterministic in-project geometry and textures plus the existing locally stored cotton and plaster scans; source credits remain in public/apartments/ASSET_SOURCES.md. Revision 6 targets fewer than 1,650,000 unique scene triangles; six additional lateral blocks extend the window panorama; multi-pass browser submissions are recorded separately. Actual browser figures are in the review evidence.
- Reference provenance: user attachments preserved in `test-artifacts/north-city/references`. No reference photograph is used as the room geometry or backdrop.

## Reference map

1. L-shaped floor plan and all functional zones.
2. Low pale bed, white folds/pillows, deeply framed arch and snowy pastel city.
3. Porcelain bathroom wall panels with cyan/pink illuminated joints, small display and soft cove light.
4. White workstation, transparent cyan information panels and projected desktop controls.
5. Intertwined sculptural luminous tubes on the nightstand.
6. Concentric ceiling fixture, clear rounded chair, white cushion and thick soft carpet. The pictured person is not part of the room brief.
7. Rainy nighttime street canyon: NOVA, LUNA and vertical CAFÉ signs; warm occupied windows; bundled utility cables; three occupied bridges; cyan/pink human holograms; traffic, head/tail lights, steam and wet-road reflections.

## Verification and acceptance

**Revision 5 is accepted at 8.1/10 on the second independent realism review (7.8 → 8.1).** The selected 8.55 × 8.55 m bed fits the expanded three-sided alcove; ordinary pedestrians are car-calibrated about 16.67% smaller; both flowing ghosts have sculpted, ornamental faces. The failed first review and diagnosed ceiling-light correction are preserved in `revision-5-reviews.md`; the final independent verdict is `revision-5-review-2.md`. Broad duvet regions, repeated pillows, luminous mask-like faces and procedural city details remain limitations. Motion was assessed from separated frames rather than direct video playback. Two of three allowed formal reviews were used.

**Revision 4 is accepted at 8.2/10 on the first independent realism review.** Both city holograms are now translucent filigree ghosts with long wind-blown gowns. Evidence and limitations are in `revision-4-reviews.md`; the independent verdict is `revision-4-review-1.md`. The reviewer assessed screenshots and separated motion samples, not direct video playback. Faces remain abstract, fine filigree loses clarity at distance, and heavy fog can almost hide the figures.

**Revision 3 is accepted at 8.1/10 on the second independent realism review (7.7 → 8.1).** Review evidence, fixes and remaining limits are in `revision-3-reviews.md`; the independent verdict is `revision-3-review-2.md`. The real-time city remains stylized in vehicle/figure geometry, modular facades and wet reflections.

**Revision 2 was accepted at 8.1/10 on the third and final independent realism review.** The three scores were 7.7, 7.9 and 8.1. Evidence and fixes are in `revision-2-reviews.md`; the independent final verdict is in `revision-2-final-review.md`. Cloth, rug detail, repeated city motifs and some ambient shading remain below photographic reference quality. Original revision records remain in `realism-reviews.md` and `final-review-agent.md`.

Run `npm run build`, then `npm run test:north-city` against port 5178 (override `BASE_URL` for a production preview). `CITY_OUTPUT` selects the evidence directory. The browser check captures every named viewpoint, the initial view, and mobile room/guide. It checks readiness, doubled area metadata, view changes, walking, climb onto bed, window collision, step down, all six weather settings, Escape, mobile horizontal fit and runtime errors. `npm run test:north-city-navigation` checks bed and boundary edge cases independently. A separate integration check covers the city directory and unchanged student collection.

An independent realism reviewer is limited to **three formal scene reviews**, with **8/10 required for acceptance**. Current scores and concrete findings are recorded in `revision-6-reviews.md`; a successful build does not count as visual acceptance.

The supplied floor plan and visual brief authorize implementation. The local runtime scene is the review artifact. No deployment, paid generation or production asset export is performed by this change. The Blender/export-specific skill gates are not represented as approved.

## Rug and weather-control follow-up

The rug now uses neutral brilliant-white wool with a restrained white emissive response. Rug and chair move together 1.3 m south, with the chair collider and lounge viewpoint updated consistently. The weather selector is outside Room guide on desktop and mobile, and hides with the other apartment controls when collapsed. Build and all 16 browser viewpoints, six weather modes, bed traversal and mobile fit passed; no browser errors. Evidence: `test-artifacts/north-city/rug-weather-update/`. The earlier three formal realism scores are preserved for their original reviewed snapshots.

## Collapsible apartment controls

The chevron integrated into the North City navigation, or H while looking around, hides/restores the apartment tag, Room guide, weather panel, movement hint and touch controls. Collapsing closes an open guide; the North City back link remains available. Restoring preserves the selected weather and camera position. Desktop and touch-mobile interaction checks, keyboard movement, student-room isolation and build passed with no browser errors. Evidence: `test-artifacts/north-city/collapsible-controls/`.

## Circular rug and living city — revision 3

The brilliant-white wool rug has a 2.32 m circular footprint at the existing southward lounge placement. The whole floating chair, including shell, rim and cushions, turns toward the east kitchen.

The latest city reference replaces the initial pastel snow scene as the default rainy-night outlook. Four lanes carry 44 moving cars with paired headlights, tail lamps, tires and rippled wet-road light reflections. Three skybridges carry 68 pedestrians with moving limbs. Two dimensional human holograms scan and turn subtly; eight vent locations emit rising, expanding, fading steam. Framed NOVA/LUNA/CAFÉ boards, dense anchored utility bundles, window interiors and localized sign lighting carry the reference's composition. Rain, storm, snow, clear, overcast and fog remain selectable. Reduced-motion preference freezes decorative movement.

The Room guide adds **Rainy neon city** (framed by the arch) and **Street life & holograms** (close street detail). The city is modeled geometry; the reference image is comparison evidence only. The city remains a real-time approximation, particularly its modular architecture, holographic anatomy and projected wet-road reflections.

Evidence: `test-artifacts/north-city/revision-3/`. The full browser capture records 18 viewpoints, six weather modes, mobile layout and bed traversal. Time-separated city frames and animation snapshots verify traffic, pedestrians and steam. `scripts/north-city-live-audit.mjs` checks reduced motion, restored weather controls, finite geometry, the circular footprint, kitchen-facing chair direction and the street boundary. The independent revision-3 grade is recorded separately from the preserved revision-2 scores.

## Filigree ghosts in flowing gowns — revision 4

The cyan right and pink left holograms now have slender spectral silhouettes, continuous long transparent gowns, an inner gauze layer, trailing shoulder veils, fine curved luminous embroidery and floating hair ribbons. Slow wind waves travel down the cloth with a loosely moving hem and anchored bodice. Independent phases and gentle floating sway give the pair an unhurried, hypnotic rhythm. No hard animation reset or opacity strobe is used; reduced-motion preferences freeze decorative movement.

Focused validation: `node scripts/north-city-ghost-holograms-smoke.mjs` captures six room/city views, six weather modes, a 26.208-second normal-speed canvas clip, separated motion frames and a 390 px mobile view. Build and the live geometry/reduced-motion audit pass with no browser errors. Final scene geometry is 1,103,257 unique triangles and 1,444,479 instance-expanded triangles. Evidence: `test-artifacts/north-city/revision-4/pass-1/` and `revision-4/validation/`. The shader deformation is an authored cloth approximation; acceptance is limited to the evidence and findings in the independent review.

## Square sleeping alcove, crowd scale and artistic ghost faces — revision 5

The user selected an **8.55 × 8.55 m** square bed, three times its former width. The matching alcove extends toward the city and westward, with the mattress fitted to the west, north/window and east sides. A 3.55 m south connection joins the existing living room. The thick north wall has a real 4.32 m elliptical arched aperture; the city translates with the window. Rebuilt cotton retains human-scale folds and pillow dimensions. Three recessed ceiling coves light the deep alcove. Bed climbing, full-surface walking, wall/glazing boundaries and step-down access use the updated shared layout contract.

Pedestrian sizes are now calibrated against the exterior cars: a 1.05 scene-unit car height at an assumed 1.50 m gives 0.70 scene units per metre. Crowds span 1.60–1.84 m equivalent height, averaging 16.67% smaller (about 1.25 head lengths), with matched stride timing. This is a relative calibration of the compressed miniature city; giant ghosts remain deliberate projections.

Both ghosts have sculpted cheeks, jaws, sockets and noses with almond eyes, brows, irises, lips and fine crescent temple ornament. Their translucent wind-blown gowns and independent movement remain. Two QA portrait cameras show these actual runtime surfaces; public navigation stays inside the apartment.

Build, all 21 viewpoint captures, six weather modes, mobile fit, whole-bed traversal, three boundaries, south step-down, finite geometry, city clearance and reduced-motion controls pass. Final geometry is 1,192,709 unique triangles and 1,691,179 instance-expanded triangles. Evidence: `test-artifacts/north-city/revision-5/`; review findings and limitations: `revision-5-reviews.md`.

## Panoramic glazing, holographic TV and oversized down pillows — revision 6

The city-facing north boundary is now full-wall 8.55 × 3.5 m curtain glazing. Four clear panes, slender 28 mm mullions, recessed aluminium perimeter frames and dark gaskets replace the arch and deep sill. Six independently proportioned city blocks add lateral facade, balcony, signage and roof detail. Existing traffic, bridge pedestrians, steam, spectral gowns and weather remain active.

The left/west alcove wall carries a 3.72 × 2.02 m translucent television, supported by a wall-mounted optical rail. Its aurora, ocean reflection and atmospheric island ridges drift slowly; reduced-motion preference holds the art still. Six larger pillows replace eighteen smaller ones: four leaning and two relaxed, each with unique seam-fed folds, irregular down lobes, compressed undersides and fine cotton seams. Pillow widths range from 1.37 to 1.64 m as requested for the unusually large bed. Room guide adds Panoramic city outlook, Full-wall city window, Holographic TV and Oversized cotton pillows.

Evidence and independent realism verdict are recorded under `test-artifacts/north-city/revision-6/` and `revision-6-reviews.md`. The existing 50-picture Snapshots archive remains the prior captured version.

Revision 6 is accepted at **8.2/10 on the first independent check** (two rounds unused). Final geometry: 1,417,296 unique triangles. Build, all 24 runtime viewpoints, six weather states, full-bed navigation, mobile fit, finite geometry and city/TV reduced-motion checks passed without browser errors. The retained limitations and full evidence are in `revision-6-reviews.md`.


## Current snapshot archive — 2026-10-12

The old 50-picture archive has been deleted and replaced by 100 new captures of revision 12: 50 ultrawide 5120 × 2160 PNGs and 50 independently framed vertical phone 2160 × 3840 PNGs. Gallery and manifest are in `Snapshots/North City/O's Apartment/`, with `Ultrawide` and `Phone` subfolders. All 100 native dimensions, hashes and gallery links pass. Independent contact-sheet QA found no publication blocker; the existing scene grade remains 8.3/10. See [snapshot-100-export.md](snapshot-100-export.md).


## Filled wall pillows and duvet fronts — revision15

Manufacturer side/upright pillow photos informed closed rounded front/rear volumes, wall pressure and compressed sheet contact. Four oversized pillows fill to the east wall opposite the TV; two relaxed pillows remain near the glazing. The actual filled duvet stops at their fronts, while mattress and fitted sheet continue to the walls. Fine cotton detail uses the existing credited material with unique seam-local puckering. Dotted corner traces were removed by correcting compressed-toe geometry.

Final independent focused review **8.8/10, below the requested9/10** after3rounds (8.4,8.7,8.8). Remaining limits: etched/parallel seam grooves, pointed lower toes and a closely fitted duvet outline. [Full review record](revision-15-reviews.md), [research](revision-15-research.md) and [validation](revision-15-validation.md). Historical whole-room8.1 and100revision12Snapshots remain separate.
