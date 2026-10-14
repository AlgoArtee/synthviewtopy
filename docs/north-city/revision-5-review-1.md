# Revision 5 — independent realism review 1 of 3

**Formal result: 7.8/10 — not accepted.** Acceptance requires at least 8.0/10. This is the first formal review of revision 5; two formal rounds remain. Prior accepted revisions remain historical and do not supply this revision's score.

## Scope and evidence

The current brief explicitly selects an 8.55 × 8.55 m square bed in an enlarged city-facing alcove, fitted against three enclosed sides, ordinary city pedestrians approximately one to two head lengths smaller, and more detailed artistic ghost faces with the wind-blown spectral gowns retained. The unusual bed size and giant hologram scale are intentional and are not penalized as accidental scaling errors. Later user directions supersede the corresponding original reference details.

Reviewed the immutable actual runtime evidence at:
`F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-5/pass-1/`

Inspected floor-plan.png, bed-wide.png, sleep.png, entrance.png, bed-edge.png, corner-nw.png, plan.png, lounge.png, on-bed.png, city-reference.png, city-detail.png, ghost-cyan-face.png, ghost-pink-face.png, ceiling.png, ceiling-oblique-a.png, ceiling-oblique-b.png, bathroom.png, study.png, mobile.png, mobile-ghosts.png, weather-clear.png, weather-rain.png, weather-storm.png, weather-fog.png, and ghost-motion-contact.jpg. The contact sheet provides six temporally separated views of the live ghosts. Reviewed the brief, review ledger, geometry audit, results.json and relevant hologram-results.json data.

**Motion evidence limitation:** I inspected the contact sheet and separated-frame evidence, not direct playback of ghost-motion.webm or its close crop. Changes in hem and veil shapes support wind deformation beyond rigid rotation; continuous temporal smoothness and a hypnotic viewing experience are inferred from samples, not directly verified by watching the clip. The recorded clip wall duration is approximately 27.0 seconds.

Reference basis: the six original room references and 07-live-rain-city.jpg, retained in `test-artifacts/north-city/references/`, with subsequent explicit user changes applied.

## Fixed rubric

| Criterion | Score | Reason |
| --- | ---: | --- |
| Physical layout, scale and construction | 1.90 / 2.00 | The expanded mattress fits the north/window, west and east enclosure. The south opening connects to the main apartment. Bedding is supported and normal-size pillows communicate the intentional giant mattress. Ordinary bridge figures read smaller relative to the vehicles. |
| Lighting, shadows and reflections | 1.25 / 2.00 | The rainy outlook, neon, pastel bathroom and transparent projections remain coherent. However, an abrupt planar brightness cutoff crosses multiple concentric ceiling housings in all three ceiling inspection views, producing an implausible spliced or cut-away appearance. The expanded sleeping surface also has broadly uniform, flat illumination. |
| Materials and textiles | 1.40 / 2.00 | Translucent ghost layers, luminous linework, porcelain, clear chair and white finishes remain differentiated. The large duvet still has an expansive smooth central field and locally concentrated wrinkles, while repeated upright pillow forms weaken a natural bedding impression. Facial details remain stylized mask-like contours with limited naturalistic relief. |
| Fidelity to references and current brief | 2.00 / 2.50 | The selected square bed, three enclosed sides, smaller pedestrians and facial detail additions are delivered. Eyes, brows, nose, lips and temple motifs are visible in live-scene close portraits, with cyan/pink identities and long spectral gowns retained. Original cotton rumpling and photographic softness remain approximate. |
| Composition and coherence | 1.25 / 1.50 | The framed city view and ghost pair remain legible, including in the portrait mobile capture. The deep sleeping alcove communicates the new scale. The ceiling discontinuity and repeated bedding shapes draw attention to the procedural construction. |
| **Total** | **7.80 / 10.00** | **Below the acceptance threshold.** |

## Improvements verified

- The actual-mesh floor plan supports the selected square footprint, not merely a camera illusion. The geometry audit gives approximately 8.55000019 m for both mattress dimensions, x bounds -9.8 to -1.25 and z bounds -9.46 to -0.91.
- The mattress fills the west, north/window and east sides. The added western front return encloses the expanded pocket; the approximately 3.55 m south opening connects the bed to the living room.
- The city remains outside the new glazing. The audit places its nearest geometry at z=-9.96, outside the window at z=-9.46 by approximately 0.50 m.
- Pillows are not uniformly inflated to match the new bed footprint. Human-sized pillows and normal-scale cloth details help communicate the deliberate scale.
- Ordinary bridge pedestrians are visibly reduced. The documented average reduction is approximately 16.67%, or 1.25 head lengths under the stated 7.5-head convention. The exterior uses a compressed scene scale; this review does not label its raw scene units as literal human metres. Vehicle-relative calibration is more meaningful here.
- Both ghost portraits now show almond eye rims, brows, a nose bridge/tip, mouth contours and crescent temple ornament. Their translucency, luminous filigree and long gauze dresses remain intact. The added detail is easiest to appreciate in the QA close portraits and is naturally less apparent from the bed or in fog.
- The sampled motion contact sheet shows changing dress and veil contours with the updated faces retained.

## Priority fixes before review 2

### 1. Remove the hard ceiling-light discontinuity

In ceiling.png the lower/front sections of several white ring housings jump abruptly to a brighter value along a common straight boundary. In ceiling-oblique-b.png a matching hard diagonal divide crosses several rings on the right. ceiling-oblique-a.png shows the same issue from the opposite side. This is separate from the intentionally interrupted luminous arcs: the housing shading itself changes along a planar line. It reads as missing or spliced sectors rather than a smoothly illuminated white fixture.

A read-only inspection found multiple rectangular area-light planes near the fixture. A likely candidate is the tilted `White room-side window bounce`, positioned at [wx, 2.9, -0.3] and aimed north/down toward [wx, 1.3, wz], after the window moved to wx=-5.525 and wz=-9.46. Its plane can cross the fixture region. This is a diagnostic hypothesis, not a proven cause. Isolate lights in QA and adjust the offending emitter so its luminous plane does not intersect the visible ring housings, then recheck all three ceiling viewpoints. If the issue persists, inspect reflection-probe seams, housing normals and overlapping geometry. Preserve the intentional arc interruptions.

### 2. Improve large-bed cloth and pillow variation

Keep the approved 8.55 m square size. The central/front duvet region in bed-wide.png and bed-edge.png reads as a broad smooth sheet with a relatively small band of rumpling farther away. Distribute several unequal, physically scaled soft gathers over a larger portion of the bedding, with continuous contact and varied relaxed areas. Do not uniformly stretch an old duvet mesh or densely cover it in equal ripples.

The repeated upright pillow rows would benefit from a few unequal tilts, overlap depths, edge compression and seam orientations. Keep the pillows at normal human scale and avoid floating corners. This is secondary to the ceiling artifact but would materially help reference-2 fidelity.

## Remaining limitations that do not imply missing requested features

- Ghost faces are more expressive and ornate, but still resemble smooth luminous masks with linework; their cheek/jaw relief is subtle. The user's artistic spectral direction makes stylization appropriate, but this is not a claim of photorealistic human facial anatomy.
- Rainy road reflections, repeated building modules, simplified vehicles and bridge pedestrians remain visibly procedural at close inspection. The giant ghosts are intentional projections.
- The circular luminous rug retains a somewhat grainy fibre appearance; broader material and room light response remain less photographic than the reference images.
- Ghost detail naturally becomes faint in dense fog and less legible at distant viewpoints.

## Functional evidence, separate from the visual grade

The supplied runtime result reports ready=true, errors=[], 21 named viewpoints, six weather modes, a mobile viewport width/scroll width of 390/390, bed climb eye height 2.37 m and floor return eye height 1.65 m. Root also reports the full traversal and wall-stop regression passed. The geometry audit reports finite geometry and 1,192,709 unique triangles. These checks support implementation integrity but did not add points to the realism score.

No scene implementation files were changed by this reviewer. The verdict is grounded in the captured rendered state; no additional formal review has been performed beyond revision 5 review 1/3.
