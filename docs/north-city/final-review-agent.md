# O's City Apartment — independent final realism review

Date: 2026-10-11 (Europe/Berlin)
Reviewer: independent realism reviewer agent
Formal visual review: 3 of 3 — final permitted review
Acceptance threshold: 8.0/10

## Result

**7.6/10 — NOT ACCEPTED.** The requested realism threshold has not been met within the maximum three formal checks. This score is an assessment of the rendered scene against the supplied visual references, not a claim about functional correctness or browser performance.

| Criterion | Score | Maximum |
| --- | ---: | ---: |
| Physical layout, scale and construction | 1.80 | 2.00 |
| Lighting, shadows and reflections | 1.45 | 2.00 |
| Materials and textiles | 1.35 | 2.00 |
| Fidelity to the six references | 1.80 | 2.50 |
| Composition and scene coherence | 1.20 | 1.50 |
| **Total** | **7.60** | **10.00** |

## Evidence inspected

Actual browser captures in `test-artifacts/north-city/pass-3/`: entrance, sleep, lounge, study, bathroom, kitchen, ceiling, outlook, four corner views, two oblique ceiling views, mobile, and plan. Also inspected `test-artifacts/north-city/floor-plan.png`, the actual-mesh orthographic layout supplied by the implementation agent, and compared against the six user references retained in `test-artifacts/north-city/references/`.

The floor-plan evidence establishes the intended L-shaped zoning: bed upper left, bathroom beside it with tub across the rear and sink/WC to either side, kitchen on the right, workstation near the lower wall, entry lower left, and round chair in front of the bed. The implementation is recognizable as the requested apartment, and all requested hero features are represented.

## Improvements confirmed in this pass

- Rug now reads as a continuous pale pile surface rather than sparse upright grass; the pedestal is no longer visibly penetrated by fibres.
- Cyan workstation information has useful contrast over translucent panels.
- Bathroom pink/cyan joints and nearby color wash are more apparent and closer to reference 3.
- Exposure and local shading separate forms better than the second pass.
- Arrival and bedroom composition expose the bed, arch, chair and bedside lamp.
- Clear chair bowl, concentric ceiling assembly, and bathroom fixture placement are coherent at room scale.

## Remaining realism limitations

1. **Bedding is still visibly procedural.** In sleep and entrance views, the duvet has pointed dune-like peaks, repeated vertical gathers and comparatively stiff edges. The pillows carry periodic horizontal ridges. These do not yet reproduce the thin, irregular, overlapping cotton crumples, compression and varied fold scales of reference 2. The additional folds increase detail but do not consistently improve physical plausibility.
2. **City detail remains simplified.** The window view has convincing depth and a readable street canyon, but repeated box facades, regular ledges and blank luminous bars dominate. The references show varied protruding infrastructure, rounded snow buildup, complex rooftops, denser signage and a richer atmospheric silhouette.
3. **Lighting and material variation remain too uniform for the requested photographic standard.** Broad white surfaces have limited microstructure, and many transitions are uniformly filled. The bathroom has the correct palette and grid but less reflective depth and localized luminous falloff than reference 3.
4. **The bedside lamp loses its construction in the glow.** Its intertwined silhouette is recognizable, but the tubes read mostly as white emissive rods. Reference 5 retains clear/glassy tube edges, attachments and a more controlled pink glow.
5. **Workstation and chair remain approximations.** The workstation has the right luminous clear-panel language, but repeated planet graphics and flat information planes remain more schematic than reference 4. The round chair silhouette is improved; cushion deformation and rim/material detail remain simpler than reference 6.
6. **Visible finishing artifacts remain.** Sleep/outlook captures show a conspicuous angular wedge/discontinuity on the upper-right arched surround. The dedicated ceiling capture is crossed by the transparent chair shell, indicating an unsuitable camera position for that view; the oblique ceiling captures show the fixture clearly.

## Review history and limit

- Review 1: 5.5/10 — not accepted.
- Review 2: 7.2/10 — not accepted.
- Review 3: 7.6/10 — not accepted.

All three permitted formal reviews are now used. There is no fourth review and no 8/10 acceptance claim. The work can be presented as the implemented apartment with the documented remaining realism shortfall.
