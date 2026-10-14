# North City revision 33 — independent Data Mall facade review, round 1

Score: **8.1/10**

Status: **Accepted for the reference-inspired Data Mall replacement, corrected/editable floor displays and visible facade circuitry** against the 8/10 threshold. This is revision 33's first formal graded round. No blocking visual defect was found within that scope.

The reviewer inspected the supplied reference and actual native room screenshots. The reviewer did not edit source, tests or captures, operate the browser, or generate the evidence. Functional behavior and geometry measurements are reported separately from visual judgment.

## Evidence

Reference: `test-artifacts/north-city/revision-33/references/data-mall.png`.

All fifteen final screenshots in `test-artifacts/north-city/revision-33/final-1/` were inspected:

- `mall-day-clear.png`, `mall-morning-clear.png`, `mall-day-rain.png`, `mall-evening-clear.png` and `mall-night-clear.png`.
- `mall-city-wide-day.png` and `mall-city-wide-night.png`.
- `mall-custom-promotion.png`, `mall-editor-desktop.png`, `mall-editor-mobile.png` and `mall-city-mobile.png`.
- `mall-stream-frame-a.png` and `mall-stream-frame-b.png`.
- `mall-promotion-after-reload.png` and `mall-default-final.png`.

Regular desktop captures are 951 by 892 pixels, wide city captures 1600 by 1000, and mobile captures 390 by 844. The reviewer also read final `results.json` and the relevant retained geometry results in `geometry/results.json`.

## Findings

**The replacement carries the reference's main architectural identity.** The old closed facade is replaced by two open gallery wings, a recessed central strip, a broad DATA MALL sign above the entrance, and a strong vertical circuit bundle. Visible server racks, screens and occupants make the galleries feel used. Cyan/blue and pink lighting connects the balcony edges, central atrium and entrance. The building remains a coherent modeled volume within the city, without the white border of the supplied image or an obvious rectangular image pasted across the entire facade. The entrance and main circuit bundle remain on the plaza's central axis.

This is a simplified interpretation of the reference rather than an exact reconstruction. The supplied image has more sculpted, rounded and layered silver framing, deeper-looking side-wing returns, and a more elaborate lower portal/sign surround. The replacement's regular rectangular slabs and repeated interior/figure arrangements are noticeably simpler at the closer inspection scale. Those differences limit the score, although the reference's layout, glass galleries and neon identity are sufficiently recognizable for this scoped acceptance.

**Default floor numbering is visually coherent.** In the close day, evening, night and restored final captures, both wings read from LEVEL 01 at the bottom through LEVEL 10 at the top, with matching numbers across each row. The incorrect duplicated and out-of-order labels in the reference are not visible as competing text behind the corrected signs. Each label occupies its own balcony band, with no obvious collision with the next floor. The matching sequence is also supported by the recorded positions of all twenty signs on ten ascending physical floors.

**The editable displays have a clear visible result.** `mall-custom-promotion.png` replaces the two LEVEL 07 signs with distinct messages: `WEEKEND SALE · 20% OFF` on the left and `NEW TECH / LEVEL 07` on the right. The text remains inside its display band; other floors retain their numbers. The desktop editor shows the selected floor and both independent text fields, with instructions, a restore button and storage feedback. The mobile editor fits the viewport width and keeps those controls readable in its scrollable panel. The after-reload image retains both messages, and the final default image restores LEVEL 07 on each side.

These are legible at the close native view, but the narrow floor strips naturally produce small lettering in the full-city and mobile compositions. Custom promotions are especially small in the mobile city image, and outer labels are partly cropped by the narrow aspect ratio. The prominent DATA MALL title remains readable. This acceptance does not imply that all twenty signs are comfortably readable from every distant preset without zooming. The tiny secondary text under DATA MALL is also decorative at the reviewed scale rather than a reliable information display.

**The circuits are integrated into the facade.** The central bundle bends between gallery rows and continues toward the entrance; branches follow the balcony edges and lower portal. The inspected colors remain within the blue/cyan and pink visual family. The evening capture gives the strongest soft glow, while night preserves the colorful interiors behind the lit paths. Day and rain reduce contrast without turning the building into an isolated glowing poster. Fine illuminated lines and packets do become pale and densely striped at the close night scale, so the effect is less smooth and saturated than the broader neon channels in the reference. They do not erase the floor labels or the main architectural divisions.

The two stream frames contain different bright segment placements while retaining the same route design. They are consistent with moving data, but do not by themselves establish continuous motion quality. The runtime record separately shows native wall-time advancing packet positions by about 1.7 seconds, a nominal speed of 3.8 m/s, pause at zero speed, resumed movement, and reduced-motion freezing while retaining the static design. No independent video or continuous animation sequence was reviewed.

**The replacement remains compatible with the wider scene.** The wide day/night captures preserve the open elevated railway behind the mall, surrounding tower hierarchy and enlarged blue/pink plaza below. There is no new obvious facade intersection, white image edge or misplaced entrance in the inspected views. The mobile composition retains the central entrance, sign and circuit trunk. The foreground guardrail still masks part of the lower mall/plaza relationship, as previously documented.

## Functional evidence and limits

Final `results.json` records **25 passing checks**, no browser/WebGL errors and unchanged source hashes during native capture. These separately support independent edits, persistence through an actual reload, restoration, blank display behavior, bounded long text, keyboard isolation, mobile overflow handling, literal text when storage is blocked, and the animation controls. The reviewer saw the captured editor states and rendered outcomes, but did not independently operate those controls.

The replacement records 56,740 submitted triangles and the district 219,605. Retained geometry evidence reports no visible train wraps, zero endpoint visibility and no modeled tower intersections. These measurements are functional evidence, not a visual realism score or a guarantee of device performance.

No blocking correction is required for this scoped acceptance. The **8.1/10** score reflects recognizable reference identity, coherent numbering/edit states and integrated circuit appearance, while preserving the limitations in architectural fidelity, repeated staging, distant sign legibility and still-image motion evidence.

This is not a whole-city realism regrade. Simplified tower bases, broad dark gaps and the flatter distant image layer remain outside the request. Revision 18 remains **7.3/10, not accepted**, with its three whole-city rounds exhausted. Revision 32 remains **8.3/10**, revision 31 **8.4/10**, and revision 30 **8.2/10** for their respective accepted scopes. All earlier review records remain unchanged.
