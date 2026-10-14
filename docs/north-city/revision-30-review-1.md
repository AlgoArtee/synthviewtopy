# North City revision 30 — independent elevation and alignment review, round 1

Score: **8.2/10**

Status: **Accepted for the higher apartment outlook, centered mall/plaza and inspected weather/return integration** against the 8/10 threshold. This is the first formal graded round for revision 30. The reviewer did not edit scene source, tests or captures, operate the browser, or generate the evidence.

## Evidence and method

The reviewer read the revision 30 brief and inspected all sixteen actual-room screenshots in `test-artifacts/north-city/revision-30/final-1/` at native size. Desktop images are **951×892**; the mobile image is **390×844**:

- `raised-balcony-night.png`, `raised-north-night.png`, `raised-south-night.png`, `raised-transit.png`, and `chip-alignment.png`.
- `raised-day-clear.png`, `raised-day-rain.png`, `raised-day-storm.png`, `raised-night-fog.png`, `raised-day-snow.png`, and `raised-academia-morning.png`.
- `raised-north-window.png`, `raised-mobile.png`, `raised-ceiling.png`, `raised-return.png`, and `interior-return.png`.

The main and side views were compared with the previously inspected accepted revision 29 `final-5` compositions, particularly `mall-hybrid-night.png`, `hybrid-north-night.png`, `hybrid-south-night.png` and `raised-connected-rail.png`. This comparison assesses framing and geometry placement; it does not assume identical window activity or illumination in captures made at different times.

The final record contains 21 passing checks, no reported browser/WebGL errors and no changed source hashes. Exact world elevation, shared centreline coordinates, rename propagation, navigation floor and extended weather volumes are functional checks. They are not inferred from screenshot pixels. No continuous camera motion, doorway transition or video playback was auditioned.

## Findings

**The higher outlook visibly achieves the main request.** The mall roof now sits substantially lower in the main composition, leaving a broad view of towers, image-city facades, graphic boards and the train line behind it. Compared with revision 29's large mall mass immediately below the elevated deck, the residence now feels above the roof rather than directly below the transit. The northern and southern views expose more of the intermediate towers and far industrial architecture. The main view retains the recognizable Data Mall frontage while providing more of the city behind it. The specified 24 m lift and 38 m floor height are established by the parent's geometry checks, not estimated from this visual change.

**The mall and main chip read as aligned.** In `chip-alignment.png`, the central mall sign and facade axis sit over the centre of the plaza processor, with the central circuit trunk connecting the composition between them. The two small side processors and receding branches reinforce that symmetry. The mall's upright posts and level floor bands remain coherent in the main panorama. The steeper alignment view uses plausible perspective convergence, rather than an obviously skewed attempt to force the buildings and chip into line. The visible gap by the neighboring retail building does not show an obvious canopy or stoop collision.

**The existing transit remains clearly recognizable from the higher level.** Pale three-car shapes are visible on the route behind the mall in the main night, mobile, clear-day and transit views. The side views retain the continuous curve and its supporting columns. Their new relationship to the viewer makes the train bodies easier to distinguish than when the residence looked sharply upward at the underside of the raised guideway. There is no visible discontinuity between the mall, towers and route that would suggest only one part of the city was moved.

**The higher perspective remains consistent across the apartment.** The north-window image now looks across nearby tower roofs into the larger city. It no longer presents the street-level holograms at the previous eye-line, which is a natural consequence of raising the whole residence relative to both districts. The balcony ceiling, walls, planted corner, railing, return corridor and doorway retain their familiar positions and proportions. The interior return keeps the bed, chair, ceiling and window relationship intact while showing the new exterior height. These endpoint views contain no obvious clipping plane, split exterior elevation or intrusion of city geometry into the apartment.

**The inspected weather reaches the new viewpoint.** Rain and storm show precipitation across the higher panorama as well as the plaza below, with storm producing the stronger obscuration. Clear day leaves the roof and skyline readable. Night fog attenuates the far architecture and spreads nearby emission while preserving the closer mall edge and railing. Snow adds visible pale caps on nearer roofs/ledges and substantially reduces far contrast. The warm Academia morning view retains its golden cast and visible airborne leaves at the elevated balcony. No obvious horizontal weather cutoff or dry upper slice appears in the supplied images. Actual volume endpoints and continued movement to ground level remain functional matters rather than claims derived from individual stills.

**The mobile composition retains the intended hierarchy.** The narrower image keeps the mall sign, several upper floors, a visible train and the background city. Cropping of the long frontage and lower plaza is expected in that aspect ratio. Its architectural edges remain upright without conspicuous stretching.

**The rename is supported by functional evidence.** The captures keep the controls collapsed and do not expose the residence title prominently enough to visually audit every label. The passing runtime checks establish `0.8.0` in the level name, document title and directory while retaining the stable room URL. This report does not substitute an assumed visual observation for those checks.

## Scope and remaining limits

The higher vantage has an unavoidable composition tradeoff: the guardrail occupies a strong foreground band and masks some of the lower mall frontage and plaza. The downward chip preset makes the alignment visible through the patterned glazing, but it does not provide an unobstructed aerial view. Street-level inhabitants and previous canyon details are also smaller or below the north-window frame. These limitations are consistent with the requested higher residence and preserved balcony rather than evidence that the elevation failed.

The increased view also exposes the simplified intermediate tower bases and broad dark gaps between buildings. The far image city remains flatter than the modeled near layers and quieter in its night-light hierarchy than the original cyberpunk reference. Revision 30 does not introduce new photorealism, street geometry or a performance improvement claim, and this acceptance should not be presented as covering those matters.

The score covers the visible elevation, mall/chip alignment, retained transit and coherent inspected weather/return views. Continuous navigation, camera-blend smoothness and every weather/time combination were not independently visually auditioned. The functional suite covers the local floor and shared placement separately.

Revision 18 remains **7.3/10, not accepted**, with its three whole-city rounds exhausted. Revisions 19, 20 and 21 remain **8.2/10**, revision 22 remains **8.4/10**, and revisions 23 and 24 remain historically **8.2/10** for their scopes. Revision 25 retains **7.6/10, not accepted**, followed by **8.1/10 scoped acceptance**. Revision 26 remains **8.2/10 accepted** for its feature scope. Revision 27 retains **7.7/10, not accepted**, followed by **8.1/10 scoped acceptance**. Revision 28 remains **8.4/10 accepted** for camera alignment, and revision 29 remains **8.0/10 accepted** for its taller-mall/hybrid-city scope. This revision 30 **8.2/10 scoped acceptance** preserves all those records and is not a new whole-city realism grade.
