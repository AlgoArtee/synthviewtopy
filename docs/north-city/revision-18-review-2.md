# North City revision 18 — independent visual review, round 2

- Date: 2026-10-13
- Reviewer: separate `realism_review` agent; no scene edits.
- Requirement: `src/apartments/AGENTS.md`, minimum accepted score 8/10, maximum three formal rounds.
- **Overall visual realism / reference fidelity: 6.8/10. Not accepted.**
- Previous round: 6.5/10 (`revision-18-review-1.md`).
- Formal rounds used: **2 of 3**. One round remains.
- Evidence: `test-artifacts/north-city/revision-18/final-2/`, running-room capture starting `2026-10-13T08:54:27.824Z`, `http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1`. The capture folder includes source hashes and functional results. Navigation/build checks do not determine this grade.

## Evidence inspected

Compared against the three supplied references under `test-artifacts/north-city/revision-18/references/`, visually inspected previously. The reference and requested placement interpretation remain as documented in `revision-18-brief.json`.

Opened these actual final-2 screenshots individually:

- `balcony.png`
- `balcony-corner.png`
- `balcony-door.png`
- `balcony-return.png`
- `kitchen.png`
- `window-pillows.png`
- `balcony-mobile.png`
- `floor-plan.png`
- `balcony-clear.png`
- `bed-wide.png`

## Improvements confirmed

- The rail cap is substantially thinner. Circuit panel faces are now visible in the hero and mobile outlooks, replacing the broad blank band from round 1.
- The corner view shows a planter, cable coil, wall conduits, terminal and more metallic wall treatment. These make the terrace less empty and connect it to the reference's service details.
- Storefronts contain visible shelves and other interior silhouettes. Some extra street fixtures and secondary circuit routes break up the previous perfectly symmetric plaza.
- The borrowed skyline supplies the reference's recognizable cyan-lit density in the background.
- The floor plan still matches the balcony's wrap around the bathroom, door position to its right, and shifted kitchen. The window pillows remain clearly above the blanket; no new placement regression is visible.

## Remaining issues, in priority order

1. **Terrace floor has conspicuous triangular/striped rendering artifacts.** `balcony-corner.png` shows large diagonal triangles with fine horizontal interference patterns, and `balcony-door.png` shows repeated bands. These look like overlapping surfaces or depth precision artifacts, not worn flooring. The exact implementation cause is not established by screenshots. Resolve the overlap/depth behavior or replace it with restrained texture/roughness variation. Check the whole L-shaped floor at grazing angles, not only the city-facing hero.
2. **The skyline image is visibly a separate oversized backdrop.** In `balcony.png` and the mobile view, large photographic towers and aircraft sit behind much smaller, flat procedural towers with a strong scale, lighting and sharpness mismatch. In `balcony-return.png`, a curved/slanted top fade and a bottom fade into empty sky expose the image boundary. `balcony-clear.png` also has a pale top strip and bright empty wedges behind the shops. The result resembles a nearby illuminated mural. Integrate it at a believable distant angular scale with continuous coverage, a matched horizon/perspective, and atmosphere that connects foreground/midground/background. Avoid visible rectangular or curved image edges from any accessible terrace angle.
3. **Storefronts are still too uniformly flat and bright.** The new cream-lit panes make shelf silhouettes visible, but nearly every shop has the same evenly luminous back wall and regular grid. Data Mall remains a regular dark grille against a cream panel. Reference 3 has local lighting, dark recesses, cyan server displays, transparent glazing, distinct entrances and varied depth. Use varied dark/bright interior zones and facade-specific contents rather than uniform white emissive backgrounds.
4. **New plaza geometry remains substantially simpler than the reference.** The low buildings have broad plain faces, repeated roof vents and billboard templates. The procedural midground towers still have repetitive windows and rectangular silhouettes. Ground circuitry remains highly regular; large blue reflection patches dominate the wet plaza. More varied physical depth, integrated lighting, intermediate blocks and less uniform surface response are needed to make the scene visually close to the supplied image.
5. **The hero's foreground composition is improved but still incomplete.** The central post takes a large share of the narrow mobile view and the rail crosses the central chip focal point. The panel circuitry is legible, but no deck foreground is visible in the main city-facing capture. A natural standing view slightly farther from the railing should show some deck, a less obstructed city focus and useful panel context without hiding the rail. The corner screenshot already demonstrates a more convincing spatial relationship.

The second pass improves the identifiable components, but the floor artifacts and background integration prevent a convincing continuous environment. Including part of the exact source image does not, by itself, make the rendered environment close to the source's overall realism.

## Recommended final-round sequence

1. Remove the terrace surface interference and verify multiple grazing views.
2. Correct the backdrop horizon, angular scale, coverage and fade/lighting integration; inspect both hero and return directions.
3. Refine facade depth and illumination, especially Data Mall and the repeated club windows; temper the broad plaza reflection patches.
4. Capture a natural rail/deck city view on desktop and mobile, then recapture the preserved layout and bedding checks.

No fixes were made by this reviewer. The third review must grade the resulting evidence honestly; if below 8/10, retain that result and report the remaining limitations without another graded round.
