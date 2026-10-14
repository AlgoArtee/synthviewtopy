# North City revision 18 — independent visual review, round 3 (final)

- Date: 2026-10-13
- Reviewer: separate `realism_review` agent; no scene implementation edits.
- Requirement: `src/apartments/AGENTS.md`, acceptance at 8/10 or higher, maximum three formal graded rounds.
- **Final overall visual realism / reference fidelity: 7.3/10. Not accepted against the 8/10 requirement.**
- Score history: round 1 **6.5/10**; round 2 **6.8/10**; round 3 **7.3/10**.
- Formal rounds used: **3 of 3**. No further formal review round is permitted for this request.
- Evidence graded: **only** `test-artifacts/north-city/revision-18/final-3b/`. The intermediate `final-3` capture was not inspected or graded by this reviewer.
- Capture metadata: `2026-10-13T09:17:59.914Z`, running scene `http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1`. Source hashes and functional checks are preserved in the same folder. Functional checks remain separate from this visual grade.

## Images inspected

Compared with the previously inspected supplied references under `test-artifacts/north-city/revision-18/references/`: `window-pillows.png`, `layout.png`, and `city.jpg`.

Opened these final-3b screenshots individually:

- `balcony.png`
- `balcony-corner.png`
- `balcony-return.png`
- `balcony-door.png`
- `balcony-mobile.png`
- `balcony-clear.png`
- `window-pillows.png`
- `kitchen.png`
- `floor-plan.png`
- `bed-wide.png`

## Final request status

| Requested change | Visual finding |
| --- | --- |
| Blanket underneath the two pillows next to the window | Satisfied in the supplied views. Both pillows sit visibly on top of the blanket. |
| L-shaped balcony around the bathroom | Satisfied. Actual geometry plan matches the north/east wrap, and door/return/corner views show a continuous terrace. |
| Access door immediately right of bathroom | Satisfied in plan and rendered doorway views. |
| Kitchen moved down the right living-room wall | Satisfied in plan and kitchen view; no visible doorway obstruction. |
| Balcony exterior very close to reference 3 | Theme, recognizable signage, open plaza, circuit lighting, flying traffic and circuit railing are present. Overall realism and integration remain below the requested closeness. |

## Fixes confirmed since round 2

1. **Terrace floor interference is resolved in the inspected views.** The large triangular striped patches no longer appear in `balcony-corner.png`, `balcony-door.png`, or `balcony-return.png`. Tiles and broad reflections now form a continuous surface.
2. **The hard bright sky boundary in the return direction is resolved.** `balcony-return.png` no longer has the previous pale blue upper field and conspicuous bright top fade. The dark sky is continuous without that hard angular seam. This does not fully resolve the photographic backdrop's spatial integration, described below.
3. Storefronts have more varied blue interior detail, most noticeably the Data Mall server imagery. They read less like uniform cream light panels.
4. The central railing post has been moved out of the mobile focal area. The thinner rail and circuit panels remain much better presented than round 1.
5. The skyline is darker and less overwhelming; the number/height of nearby repeated towers has been reduced. The rainy main view is more coherent than in round 2.

## Remaining limitations

1. **Skyline and modeled city still look like distinct visual layers.** In `balcony.png`, the detailed image-based far district meets a band of comparatively plain, grey-blue modeled towers and shop roofs. Their perspective, detail density and lighting do not fully agree. In `balcony-return.png`, the background towers and transport curve still have a conspicuous leaning/wrapped appearance behind the straight modeled environment. The worst case is `balcony-clear.png`: the photographic district appears as a pale translucent band high in the sky, with broad bright empty areas between it and the modeled blocks. The corrected hard seam should not be described as complete backdrop integration.
2. **The foreground district remains visibly more schematic than the reference.** Repeated box shops, vent rows, large billboard templates, dark rectangular sign backs and the thin elevated structure retain a procedural look. The reference's richer roof machinery, intermediate streets, facade relief, irregular light clusters and depth layers are not reproduced at comparable fidelity.
3. **The plaza and materials remain too uniform.** The radial circuit layout is still dominated by evenly spaced parallel lines and a single central square. Large blue-lit patches and silhouettes do not convey the reference's finer wet reflections, varied paving and dense activity. The new textured shop recesses help, but some interiors read as image panels behind regular glass grids rather than fully convincing spaces.
4. **Balcony foreground materials are still clean and simple.** The plant, cable coil, terminal and wall conduits are useful. The regular glossy tiles, simple planter and broad plain wall do not yet match the worn dark metal, varied wetness, weathering and surface detail of reference 3. The main outlook still shows almost no deck foreground, although the corner view demonstrates the actual terrace clearly.

These are visual quality limitations, not evidence that the requested layout failed. The implementation has made a substantial improvement over the first reviewed pass, but it should be described as a functional reference-inspired balcony scene with remaining city realism work, not as accepted at 8/10 or as a very close reproduction of the reference.

## Review closure

No scene edits were performed by the reviewer. Preserve all three reports and their evidence paths. Under the repository rule, this third result ends formal grading for the current request. Report the actual **7.3/10** result and the remaining backdrop/material/detail limitations; do not claim visual acceptance or run another graded round.
