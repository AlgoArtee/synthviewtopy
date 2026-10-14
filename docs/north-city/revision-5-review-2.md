# Revision 5 — independent realism review 2 of 3

**Formal result: 8.1/10 — ACCEPTED.** Acceptance requires 8.0/10. Revision 5 used two of the maximum three formal rounds: 7.8 rejected, then 8.1 accepted. One round remains unused; no further review is needed for this accepted snapshot.

This report preserves the independent realism reviewer's direct verdict. The root agent assembled this record from the reviewer's messages after the reviewer's standalone report-saving turn stalled. The score and visual findings below are the independent reviewer's; no root regrading or additional formal round occurred. An earlier screenshot-reading stall was resumed as the same second review.

## Scope and inspected evidence

The user explicitly selected an 8.55 × 8.55 m square bed, triple the prior width, fitted against the three sides of an enlarged city-facing alcove. Ordinary pedestrians should be proportionally smaller relative to cars, while both flowing ghost projections should have more detailed artistic faces.

Actual runtime evidence: `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-5/pass-2/`.

The reviewer independently inspected ceiling.png, ceiling-oblique-a.png, ceiling-oblique-b.png, bed-wide.png, sleep.png, floor-plan.png, ghost-cyan-face.png, ghost-pink-face.png, city-reference.png and the new six-frame ghost-motion-contact.jpg. The reviewer compared against the current brief and previous rejected snapshot. Other runtime captures, six weather modes, mobile views and normal-speed ghost-motion.webm are retained in the same directory.

**Motion limitation:** the reviewer judged motion from separated frames and the contact sheet, not direct video playback. Sampled independent gown deformation is supported; uninterrupted temporal smoothness is not directly verified by this review.

## Fixed rubric

| Criterion | Score |
| --- | ---: |
| Construction and scale | 1.90 / 2.00 |
| Lighting | 1.55 / 2.00 |
| Materials | 1.40 / 2.00 |
| Fidelity to references and current brief | 2.00 / 2.50 |
| Composition and coherence | 1.25 / 1.50 |
| **Total** | **8.10 / 10.00** |

## Independent findings

- The sharp ring shading cutoff is visibly removed in all three corrected ceiling views. The supported square bed and three-side fit remain coherent.
- Human-sized pillows remain normal-scale within the intentionally huge bed; their positions, compression and folds are more varied.
- Smaller bridge figures and detailed cyan/pink faces are retained. The face portraits show the added artistic details while preserving the spectral projection language.
- The new motion contact supports independently deforming gowns rather than only rigid whole-figure movement.

## Remaining limitations

The huge bedding surface still has broad smooth regions and repetitive pillow shapes. Faces remain luminous artistic masks, with simple hand and neck anatomy. Buildings, traffic and reflections remain visibly procedural. Utility cables obscure ghost midsections. These limitations prevent a claim of photographic equivalence even though the scene clears the requested 8/10 threshold.

## Fixes and technical evidence recorded by root

The rejected first review's ceiling defect was isolated to the tilted room-side window bounce emitter intersecting the concentric light housings. Actual-mesh original/disabled/relocated diagnostics are preserved in `revision-5/light-diagnostic/`. The emitter is now vertical, north of the rings, at `(windowX, 2.2, -1.8)`, directed north with height 1.8 m. Seven tapered duvet creases with paired shallow valleys and varied measured pillow contacts were added before this review.

Production build and 21 runtime viewpoint checks pass, including all six weather modes, whole-bed traversal, solid window/wall stops, south step-down, kitchen collision and mobile fit. Geometry/reduced-motion/collapsed-controls audit: `revision-5/validation-pass-2/audit.json`; no browser errors. Mattress measures 8.55000019 × 8.55000019 m. Crowd scale is car-calibrated at approximately 16.67% smaller (1.25 head lengths). Final scene has 1,192,709 unique and 1,691,179 instance-expanded triangles. These checks support implementation correctness; the independent visual grade remains the rubric above.
