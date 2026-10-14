**Revision 15 — formal realism review 2/3: 8.7/10. Not accepted against the requested 9/10 threshold.**

This score covers the four wall pillows and duvet-to-pillow contact. It does not replace the historical whole-room score. One formal round remains.

| Criterion | Score |
|---|---:|
| Construction and contact | 1.90 / 2 |
| Lighting and shape readability | 1.70 / 2 |
| Materials and cloth detail | 1.65 / 2 |
| Current request and reference fidelity | 2.15 / 2.5 |
| Composition and coherence | 1.30 / 1.5 |
| **Total** | **8.70 / 10** |

The changes improve the appearance over round 1. Curving side seams, unequal crown heights and spreading lower corners make the pillows less like identical upholstered panels. Their side views retain substantial rear volume against the wall. The original thin diagonal silhouette and large hollow triangular space remain resolved.

The bases now suggest compression more convincingly, especially in `pillows.png` and `pillow-row.png`. Smaller folds and asymmetric outlines provide visible individuality. Clear and evening views retain these improvements without excessive gloss.

The duvet edge is thinner and less mechanically straight. It approaches the pillow fronts while leaving a visible fitted-sheet separation. This communicates the requested arrangement: pillows resting on the sheet, with the filled duvet ending in front. The window and television remain visually clear in the sampled compositions.

Three focused issues prevent a 9/10 acceptance:

1. **Clean the lower-corner seam or shading artifacts.** In `duvet-pillow-edge.png` and its clear/evening variants, thin dark dotted lines extend onto the sheet beyond lower pillow corners. They are particularly visible near approximately **x1400/y700** and **x1690/y840** in the 1920×1080 image. Their precise implementation cause is unverified, but visually they resemble detached seam traces or rendering artifacts. Keep seams attached to the fabric, with clean termination or continuous wrapping at compressed corners. Avoid hiding them with stronger contact shadows.

2. **Smooth the duvet boundary between contact spans.** Following the individual pillow profiles improves placement, but introduces abrupt bends and narrow pointed transitions where the edge moves between pillows. The contact close-ups show these more clearly than the wide bed view. Blend those transitions into broad, rounded changes of direction and gradual thickness changes. Preserve the sheet-only separation; do not restore a straight, uniform raised border.

3. **Refine the close cotton appearance.** The silhouettes are now convincing, but several face folds remain broad, smooth, wedge-shaped depressions. The manufacturer photographs show a finer hierarchy: short seam puckers, small compression wrinkles and quieter central cloth. Shorten and soften selected large folds rather than adding more of them. Add restrained fine fabric variation and seam-local puckering without a uniform noisy bump pattern. This is the main remaining difference between a good modeled cushion and highly convincing filled cotton bedding.

The final refinement should preserve the improved rear fullness, asymmetry and base support. Another wholesale pillow redesign or unrelated city/UI work is unnecessary.

I inspected all **16 actual runtime images** under:

`F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-15/review-2/`

- `pillow-side.png`
- `pillow-low.png`
- `pillow-row.png`
- `duvet-pillow-edge.png`
- `pillows.png`
- `bed-wide.png`
- `sleep.png`
- `duvet.png`
- `duvet-drape.png`
- `television.png`
- `pillow-side-clear.png`
- `pillow-low-clear.png`
- `duvet-pillow-edge-clear.png`
- `pillow-side-evening.png`
- `pillow-low-evening.png`
- `duvet-pillow-edge-evening.png`

Comparison uses the previously inspected user defect at `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/references/10-pillow-side.png` and manufacturer photos `qe-upright.webp`, `ecolinen-stacked.webp`, and `ecolinen-side.jpg` under `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-15/research/`.

This is a still-image assessment. Parent-reported geometry, clearance, build and hash checks contributed no visual points. No source or evidence files were modified.
