Revision 10, formal review **1 of 3: 7.6/10 — not accepted**.

Both ghosts now have readable feminine facial features, visibly closed eyelids in the blink captures, and changed head orientations. The main remaining problem is portrait construction: the close views still resemble illustrated masks mounted above separate translucent neck capsules. They do not yet reach the requested realism threshold.

| Criterion | Score |
|---|---:|
| Construction and scale | 1.65 / 2 |
| Lighting | 1.55 / 2 |
| Materials and detail | 1.30 / 2 |
| Current request and reference fidelity | 1.85 / 2.5 |
| Composition and coherence | 1.25 / 1.5 |
| **Total** | **7.60 / 10** |

I inspected these eight actual runtime images under `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-10/review-1/`:

- `cyan-open.png`, `cyan-blink.png`, `cyan-head-turn.png`
- `pink-open.png`, `pink-blink.png`, `pink-head-turn.png`
- `city-detail.png`, `panorama.png`

The paired portraits clearly establish open and closed eye states. Irises disappear when the lids close, and the head-turn captures show different facial orientations. However, these are sampled states: I did **not** directly play either WebM, so I cannot independently judge blink timing, interpolation, acceleration or continuous head-motion smoothness.

The cyan and pink identities remain coherent with their translucent gowns and the surrounding neon city. Their overall silhouettes work at the apartment’s viewing distance, and the panorama retains a clear city composition. The close portraits also have recognizable brows, irises, lips and decorative cheek markings. These additions provide more personality than an anonymous luminous head.

Three visible issues prevent acceptance:

1. **The neck reads as a separate oval component.** Its bright capsule-shaped outline remains conspicuous beneath both chins, including during head turns. The jaw, neck and shoulder surfaces need a continuous transition. Suppress the capsule’s independent outline and soften overlapping transparency at this junction.
2. **Eyes and facial features look applied to a smooth shell.** Thin almond outlines and circular irises have little surrounding lid thickness or socket depth. Add restrained upper-lid volume, a softer lower-lid transition, and clearer cheek, nose and lip shaping. Preserve the calm expression without relying chiefly on dark contour lines.
3. **Transparency obscures the central face.** Background signs and building details pass strongly through the nose and mouth, especially in the cyan portrait. Slightly strengthen local facial readability while retaining translucency around the head silhouette. The goal is a legible spectral face, not an opaque human head.

The long hair ribbons also remain broadly parallel and evenly spaced. Variation in width, grouping and curvature would help them feel less like repeated strips. This is secondary to the face and neck fixes.

Root-supplied tests report evaluated eye closure, moving lid vertices, independent head rotation, distinct blink rhythms and reduced-motion handling. Those support implementation correctness; they have not increased this visual score.

**Two formal rounds remain.** Revise the face/neck continuity and facial depth before the next review; the existing city placement and gown silhouettes do not require redesign.
