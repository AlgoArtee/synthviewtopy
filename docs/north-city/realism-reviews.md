# O's City Apartment: realism review record

The user required an independent realism agent, acceptance only at 8/10 or higher, and at most three formal graded checks. Engineering inspections, build checks and screenshot recaptures are not extra graded checks. Every formal score below was supplied by the separate realism reviewer from actual running-scene captures and the six user references.

## Review 1 of 3 - 5.5/10, rejected

Evidence: `test-artifacts/north-city/pass-1/`, including the 14 desktop viewpoints and mobile captures; source references in `test-artifacts/north-city/references/`.

Subscores: layout 1.6/2; lighting 1.0/2; materials 0.8/2; reference fidelity 1.5/2.5; composition 0.6/1.5.

Findings: the arrival camera was partly blocked, surfaces had dark/chrome and triangular artifacts, bedding looked like a thin wave, the rug resembled bristles, the chair was angular, the city filled the window with a solid facade, and computer panels were faint.

Changes before review 2: repositioned the arrival and lounge views; corrected thin rounded geometry locally using a unit-cube basis and verified dimensions/outward normals; moved the reflection probe out of the partition; made a rounded chair bowl; added textile detail and a clear street canyon beyond the window; improved monitor contrast and bathroom details.

## Review 2 of 3 - 7.2/10, rejected

Evidence: `test-artifacts/north-city/pass-2/` desktop captures. Its browser run exposed an arrival-point collision-radius issue before mobile captures; the spawn was moved inside the playable boundary and the final run passed movement checks.

Subscores: layout 1.8/2; lighting 1.25/2; materials 1.15/2; reference fidelity 1.8/2.5; composition 1.2/1.5.

Findings: coarse grass-like rug fibres intersected the chair pedestal; bedding remained smooth with tubular edges; lighting washed out material detail; holograms needed luminous cyan contrast and transparent panel backing; bathroom joints needed clearer pink/cyan glow and spill.

Changes before review 3: continuous plush underpile and 37,000 finer curled wool ends with a pedestal exclusion; irregular localized duvet gathers, fine stitch edges and pillow wrinkles; reduced broad illumination with stronger local color; brighter cyan screens over darker translucent backing; additional exterior details; corrected the arch trim sampling. The chair base rests on the carpet surface.

## Review 3 of 3 - 7.6/10, not accepted

Final evidence: `test-artifacts/north-city/pass-3/` contains entrance, sleep, lounge, study, bathroom, kitchen, ceiling, outlook, plan, four corners, two oblique ceiling views, mobile and mobile guide. The actual-mesh orthographic floor plan is `test-artifacts/north-city/floor-plan.png`.

Subscores: layout/construction 1.80/2; lighting 1.45/2; materials/textiles 1.35/2; reference fidelity 1.80/2.5; composition/coherence 1.20/1.5.

The fine rug pile, local colored illumination and translucent cyan displays improved. Remaining limitations are synthetic duvet folds and periodic pillow ridges, repetitive city facades, weak glass definition in the bright nightlight, and uniform surfaces/shadow transitions. The reviewer also flagged a surround discontinuity and the chair crossing the direct ceiling viewpoint; the oblique ceiling captures are clean.

**The required 8/10 threshold was not reached. This implementation remains a reviewable local scene and is not accepted for realism.** The independent report is `final-review-agent.md`. Exactly three formal reviews were used; no fourth review was run.

## Technical verification

- Production TypeScript/Vite build passed; existing large-bundle advisory remains.
- Final browser smoke passed: ready state, 14 viewpoint changes, walking, collision stop, reset, Escape, mobile 390px fit, and zero console/page errors.
- Integration smoke passed: North City category order, directory-to-room and return navigation, mobile directory, unknown-room handling, student collection retained at 103, city collection isolated.
- Metadata audit passed: student 103, city 1, all 104; student previous/next excludes the city residence and the single city room does not link to itself.
- Local rounded geometry check passed: thin slabs retain requested dimensions and outward normals.
- Final entrance frame reports 836 render calls, 2,008,791 submitted triangles and 29 textures. These are complete-renderer figures including the repeated postprocessing/reflection passes, not a unique scene triangle count.
