Revision 11, formal review **1 of 3: 7.8/10 — not accepted**.

The new portraits are substantially closer to the supplied reference in facial detail, luminous eyes, hair and overall appearance. A conspicuous nose-shape mismatch and a smaller eyelid defect still prevent acceptance. These are visible construction issues in the runtime render, despite the improved texture quality.

| Criterion | Score |
|---|---:|
| Construction and scale | 1.45 / 2 |
| Lighting | 1.60 / 2 |
| Materials and detail | 1.65 / 2 |
| Current request and reference fidelity | 1.85 / 2.5 |
| Composition and coherence | 1.25 / 1.5 |
| **Total** | **7.80 / 10** |

Reference inspected: `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/references/08-hologram-portrait.jpg`.

Actual runtime images inspected under `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-11/review-1/`:

- `cyan-open.png`, `cyan-blink.png`, `cyan-head-turn.png`
- `pink-open.png`, `pink-blink.png`, `pink-head-turn.png`
- `city-detail.png`, `panorama.png`

The reference’s defining qualities are now much better represented: a realistic face with softly modeled cheeks and lips, luminous eyes, swept-back hair with fine loose strands, and light patterns extending into the neck and shoulders. Both runtime portraits retain those qualities. The cyan and pink treatments remain coherent with their respective gowns and city placement. The wider views show no obvious disruption to the established composition.

The principal defect is the **nose relief**. In `cyan-open.png`, the nose has an unusually sharp edge along its image-right side and underside. In `pink-head-turn.png`, it projects prominently from the otherwise softly shaded portrait and reads as a separate dark piece. `pink-blink.png` shows the same issue. This changes the reference’s facial proportions and draws attention to the construction method. The texture supplies convincing facial shading, but the visible geometry does not consistently agree with it across the supplied head orientations.

Before the next review, reduce and reshape that projection to match the reference and atlas landmarks. Blend the nasal bridge, sidewalls, tip and nostril region continuously into the surrounding face. Check both colors at the most oblique supplied head poses; correcting only the frontal appearance would leave the main defect unresolved.

The second issue is a **small broken-looking patch at the inner corner of the eye on image-left in `cyan-blink.png`**. The lid closes, but this local discontinuity interrupts the otherwise natural lash line. Align and blend the closing lid with the adjacent face surface so the closed-eye state has a continuous contour.

Depth remains uneven overall: the portrait texture is detailed, while some shading and hair detail retain a fixed, image-like quality. The current result is a close visual interpretation rather than an exact dimensional reproduction of the reference.

The screenshots demonstrate distinct open-eye, closed-eye and turned-head states. I did not directly play motion footage, so this review does not establish animation smoothness or blink timing. Root-reported build and mesh-animation checks contributed no visual points.

**Two formal rounds remain.** Preserve the improved facial texture and hair; prioritize the nose transition and closed-lid continuity for round 2.
