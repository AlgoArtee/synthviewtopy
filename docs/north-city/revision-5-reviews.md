# Revision 5 — square sleeping alcove, crowd scale and ghost faces

User selected **8.55 x 8.55 m** explicitly after clarification: triple the old 2.85 m mattress width. This unusual custom bed size is intentional. The square alcove extends north and west, joining the original main room through a 3.55 m opening. The mattress fits the west, north/window and east boundaries. The north arched opening is subtracted from the thick wall, enlarged to 4.32 m and relocated with the complete city. The nearest city geometry stays 0.50 m beyond the window boundary. A three-sided recessed ceiling cove lights the deep alcove.

Bedding is rebuilt from a metre-scale relaxed cloth lattice with physical-size gathered folds and tucked side edges. Pillows retain their original human dimensions; repeated side/head pillows share geometry rather than stretching with the mattress. Bed support, footprint containment, solid glazing, climbing, step-off and all related views are updated from the same layout contract.

The exterior uses compressed miniature geometry. Car height is approximately 1.05 scene units; assuming a 1.50 m passenger car yields 0.70 scene units/metre. Pedestrians are selected at 1.60–1.84 m equivalent height, producing 1.121–1.288 scene-unit heights. Average reduction is 16.668% (1.25 head lengths under a 7.5-head figure convention). The same calibration yields a 1.89 m car body width and roughly 4.08–4.90 m car lengths, a useful consistency check across all three vehicle axes. The nominal old human average was 2.07 m equivalent; the revised mean is 1.72 m. Stride timing is slowed consistently. Giant spectral figures remain intentional holographic projections. The calculation is a proportional scene calibration, not a claim that the city is metrically life-size.

Ghost faces now have an authored curved surface for cheekbones, jaw, eye sockets and nose, plus dimensional almond-eye rims, brows, lips, irises and fine crescent temple ornament. Cyan/right and pink/left placement, translucent layers, independent wind deformation and reduced-motion freeze are retained. Dedicated QA face portraits capture the actual loaded runtime geometry beyond the window; they are diagnostic cameras, not walkable destinations in the public room.

## Verification

- Production TypeScript/Vite build passed.
- Independent navigation check passed: deliberate climb, entire 8.55 m bed traversal, west/east/north stops, south step down, living area and alcove containment.
- Actual mattress bounds measure 8.55000019 x 8.55000019 m; finite geometry and city boundary checks passed.
- 1,192,709 unique triangles; 1,691,179 instance-expanded scene triangles. Unique scene count remains below the 1.2M target.
- Six weather modes, mobile fit, continuing ghost cloth motion, reduced-motion freeze and collapsed/restored weather controls passed without browser errors in preflight.
- Evidence: `test-artifacts/north-city/revision-5/preflight/` and `revision-5/validation/`. Formal capture directory: `revision-5/pass-1/`.

## Independent realism reviews

Maximum three formal rounds; minimum accepted score 8/10. Prior revision reports remain unchanged.

### Round 1 — 7.8/10, rejected

Independent report: [revision-5-review-1.md](revision-5-review-1.md). Immutable runtime evidence: `test-artifacts/north-city/revision-5/pass-1/`.

The reviewer accepted the selected square bed layout, car-calibrated crowd scale and more detailed artistic faces. A conspicuous hard sector of illumination across the ceiling rings prevented acceptance. Broad flat duvet regions and repeated upright pillows remained secondary limitations. Ghost faces read as luminous artistic masks rather than naturalistic faces.

### Fixes before round 2

The `White room-side window bounce` area emitter was tilted through the reflective concentric housings. An actual-mesh diagnostic compared original, disabled and relocated emitter renders (`revision-5/light-diagnostic/`); disabling or relocating it removed the cutoff. The runtime emitter is now vertical at `(windowX, 2.2, -1.8)`, aimed north, height 1.8 m, fully away from the rings. Actual production-viewer ceiling and oblique captures confirm the cutoff is gone.

Seven tapered cloth creases with asymmetric paired valleys supplement the normal-scale duvet gathers. Pillow compression, lean and roll vary; actual transformed bounds settle them on the mattress and constrain them inside the three walls.

Round-2 evidence: `test-artifacts/north-city/revision-5/pass-2/` includes all 21 runtime views, controls-collapsed hero views, two face portraits, actual-mesh orthographic plan, six weather modes, mobile, six separated motion frames and a normal-speed canvas recording. Final finite-geometry/reduced-motion/control audit: `revision-5/validation-pass-2/audit.json`. Production build and full room regression pass, including whole-bed walking, solid window stop, south step-down and kitchen collision, with no browser errors. Geometry remains 1,192,709 unique / 1,691,179 instance-expanded triangles.

### Round 2 — 8.1/10, accepted

Independent report: [revision-5-review-2.md](revision-5-review-2.md). Immutable evidence: `test-artifacts/north-city/revision-5/pass-2/`. Two of three allowed formal reviews were used; one remains unused, and no additional review is required for this accepted snapshot.

Fixed rubric: construction 1.90/2, lighting 1.55/2, materials 1.40/2, fidelity 2.00/2.5, coherence 1.25/1.5, total **8.10/10**. The reviewer independently inspected the three corrected ceiling views, bed-wide/sleep/actual floor plan, both face portraits, city-reference and six-frame motion contact. The hard illumination cutoff is removed; the selected bed footprint and three-side fit remain coherent; bridge figures are smaller and the detailed cyan/pink faces persist. Separated frames support independent gown deformation.

Remaining limitations: the very large duvet still has broad smooth areas, pillow shapes repeat, faces read as luminous artistic masks, hand/neck anatomy is simple, and buildings/traffic/reflections remain procedural. Cables obscure ghost midsections. Temporal motion was assessed from separated frames rather than direct video playback. Acceptance is an 8.1/10 real-time scene judgment, not photographic equivalence to the references.

The final TypeScript/Vite build passes. Packaged preview SHA256 matches the public preview (`e73e2bd724a4e688f240c6fad0931a5de63ce4b47263a69fd1d539d4432d88d8`). The North City directory description now reflects the 8.55 m square bed, ghost projections and luminous circular white rug. Changes remain local and uncommitted.
