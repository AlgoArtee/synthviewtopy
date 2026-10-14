# Wall-fitted bedding and clear TV — revision 9

Requested local correction: fill exposed gaps beside the bed/duvet, including the closed wall opposite the window, and keep the holographic TV clear. Existing bed scale, six pillows, city, TV position and room circulation are preserved.

Duvet seams meet the west, north, east and closed south return planes. The open foot hangs into the room, tapering upward before the bedside cabinet. Mattress and fitted sheet retain the 8.55 m square dimensions with their edge bevel reduced to 3 mm. Loft and gathers beneath the TV decrease smoothly across its screen width. The nominal cloth cut is 9.10 × 9.46 m, with measured surface paths of 9.189830 × 9.457779 m.

## Independent formal review

| Round | Score | Result | Evidence | Report |
| --- | ---: | --- | --- | --- |
| 1 / 3 | 8.1 / 10 | Accepted | `test-artifacts/north-city/revision-9/review-1` | [Full reviewer report](revision-9-review-1.md) |

One formal check was used; two remain unused. The acceptance threshold is 8/10. Earlier preflight/pass-1 captures were ungraded and remain preserved. Revision 8 scores and reports remain unchanged.

The reviewer inspected bed-wide, television, corner-nw, lounge and duvet-drape actual runtime images. Wall contact and TV clearance read correctly. Broad smooth duvet surfaces, sculpted hem waves, firm pillow silhouettes and uniform illumination remain visible limits. Concealed seams and animation playback were not visually assessed. Technical validation contributed no extra review points.

## Final validation

- TypeScript/Vite build passed; usual large-chunk warning only.
- 26 room viewpoints plus entrance, three weather captures and 390 px mobile capture: 31 PNGs, no browser errors. Desktop images are 1920 × 1080.
- Fitted duvet boundary errors: west 0.000191 mm, east 0 mm, north 0.000038 mm, closed south return 0.000026 mm. No wall crossings, non-manifold edges or vertices inside the bedside cabinet.
- All 270 sampled TV rays clear from five views, including samples within 5 mm of screen edges.
- Closed down-filled shell mean thickness 0.227613 m; floor clearance 0.255337 m; open-foot overhang 0.534830 m.
- Finite geometry, exact pillow bounds/support, weather/collapsed controls and reduced-motion checks passed. 1,522,202 unique triangles; 1,863,424 after instance expansion.
- Existing bed navigation and collision code preserved; passing revision 8 traversal retained, not rerun for this bedding-only correction.
- Actual-mesh orthographic plan: `test-artifacts/north-city/revision-9/validation/floor-plan.png`.
- Final source hashes: `revision-9-source-hashes.json`. Screenshot hashes: `test-artifacts/north-city/revision-9/review-1/evidence-manifest.json`. Validation hashes: `revision-9-validation-hashes.json`.

Existing fifty 4K Snapshots remain their original capture version. No paid services, deployment or commit were performed.
