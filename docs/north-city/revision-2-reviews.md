# Revision 2: expansion, floating chair, city weather and bed access

This user-requested revision starts a new independent realism review cycle with a maximum of three graded checks and an acceptance threshold of 8/10. Original revision scores remain in `realism-reviews.md` and `final-review-agent.md`.

## Implemented behavior

- Main living area: 30.24 to 60.48 square metres (exactly doubled); south wall, entrance and workstation moved 3.15 m. Gross L-shaped apartment: 78.15 square metres.
- Floating acrylic chair: no pedestal/support; fitted seat and back cushions sit inside the moulded shell.
- City: varied dimensional facades, balconies, HVAC, cables, rooftop equipment, snow buildup and 44 framed illuminated signs with lettering/icons. Weather controls snow cover and wet surfaces.
- Weather: Clear, Overcast, Rain, Storm, Snow and Fog, selected in Room guide. Sky, haze, precipitation and window illumination change; reflections refresh with the selected state.
- Bed: Space at the mattress foot or the touch Climb bed button climbs to a 0.72 m support and 2.37 m eye height. Walk off to step down; solid window bounds prevent leaving the apartment. Guide viewpoints provide an accessible bed-edge and on-bed outlook.
- Materials/details: existing cotton and plaster scans, controlled glass nightlight with internal filaments/fittings, four distinct hologram layouts, pearl bathroom panels and shelf planter.
- Finishing: window emitter moved behind the glazing to remove its plane-cut lighting wedge; dedicated ceiling camera moved clear of the chair.

## Formal review 1 of 3: 7.7/10, not accepted

Evidence: `test-artifacts/north-city/revision-2/pass-1/` (16 views, six weather captures, bed climb, mobile and results.json).

Scores: layout/construction 1.85/2; lighting 1.45/2; materials/textiles 1.25/2; reference fidelity 1.95/2.5; composition 1.20/1.5.

Reviewer confirmed improved city, floating chair containment, nightlight, distinct screens, weather, bed traversal and removal of the arch/ceiling artifacts. Rejected because cloth had uniform foil-like crumpling and a hovering turnback, bathroom lighting was too gray, window reveal contrast was excessive and overview emphasized empty floor.

Fixes before review 2: cloth contact/draped edge and surface-following turnback; localized broad folds and calmer areas; bathroom-local soft/color illumination and planter; reduced window source with white room-side bounce; matte trim and adjusted overview.

## Formal review 2 of 3: 7.9/10, not accepted

Evidence: `test-artifacts/north-city/revision-2/pass-2/`.

Scores: layout/construction 1.90/2; lighting 1.55/2; materials/textiles 1.35/2; reference fidelity 1.95/2.5; composition 1.15/1.5.

Reviewer confirmed corrected duvet contact, brighter pearl bathroom, coherent window trim and stable artifact fixes. Remaining blocker: duvet became too smooth and taut; needs a few localized filled overlapping folds and subtle cotton detail. Loose pillow piping looked rigid/silvery with a dark underside. Minor limitations: repeat city motifs, grainy rug pile and overview framing.

## Formal review 3 of 3: 8.1/10, accepted

Evidence: `test-artifacts/north-city/revision-2/pass-3/`. Independent full report: `revision-2-final-review.md`.

Scores: layout/construction 1.90/2; lighting 1.55/2; materials/textiles 1.45/2; reference fidelity 1.95/2.5; composition 1.25/1.5.

Final gains: continuous localized duvet folds with mattress contact, closed matte pillow edges, softer rug highlights, and overview showing more functional zones. The reviewer accepts the scene narrowly at the requested 8/10 threshold. Remaining limitations are simplified cloth, grainy short-looking rug pile, repeated city facade/sign motifs and some flat ambient shading. It is a credible real-time scene, but does not match the photographic textile detail of the references.

All three formal reviews for revision 2 are used. Scores: 7.7, 7.9, 8.1. No additional graded review was run.

## Functional evidence

- Browser checks passed for 16 viewpoints, all six weather modes, walk/collision, bed climb, solid window stop, step down, Escape, reset and 390px mobile fit; no page or console errors.
- Recorded traversal: climbed eye 2.37 m, stopped at window z=-2.735, returned to floor eye 1.65 m.
- Navigation edge-case test passed: cannot walk into bed before climbing; height settles after releasing movement; expanded south boundary and L-shaped exclusion remain enforced.
- Build and city integration checks passed. Student collection remains 103 rooms; an existing student room retains its sky and controls without city weather/climb UI.
- Final pass-3 capture passed after the last textile changes: all 16 viewpoints, six weather modes, bed traversal, collisions and mobile fit; runtime errors []. Final `npm run build` passed. Renderer telemetry records 983 calls, 2,478,893 submitted triangles across rendering passes, and 38 textures; these are not unique scene-geometry counts.
