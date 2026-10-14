# North City revision 28 — independent camera-alignment review, round 1

Score: **8.4/10**

Status: **Accepted for the scoped plaza alignment and balcony projection correction** against the 8/10 threshold. This is the first formal graded round for revision 28. The reviewer did not edit source, tests or captures, operate the browser, or generate evidence.

## Evidence and method

The reviewer read the revision 28 brief and inspected all thirteen actual-room screenshots in `test-artifacts/north-city/revision-28/final-1/` at native size. Desktop captures are **951×892**; the mobile capture is **390×844**:

- `balcony-evening.png`, `balcony-night.png`, `balcony-day-clear.png`, `balcony-day-rain.png`, and `balcony-fog.png`.
- `northern-skyline-night.png` and `southern-skyline-night.png`.
- `balcony-after-drag.png`, `balcony-after-zoom.png`, and `balcony-mobile.png`.
- `balcony-ceiling.png`, `balcony-steep-ceiling.png`, and `interior-north-window.png`.

The main and southern night views were compared with `revision-27/final-2/skyline-balcony-night.png` and `revision-27/final-2/skyline-southern-crowns-night.png`. Revision 28 deliberately retains the user's 35% shadows, 19% illuminated windows, 54% TV windows and 0.2× streams. Its darker window field is therefore not treated as evidence of a lighting regression or used as a matched lighting comparison.

The fresh results record contains 38 passing checks, no reported errors and no changed source hashes. The parent's reported projection samples, edge drift and visible rail samples are functional evidence; they do not replace the visual assessment. This is a still-image review. No continuous free-look, doorway transition or video playback was auditioned.

## Findings

**The main plaza now reads as level and upright.** The Data Mall's long roof and sign bands run horizontally across the image, and the glazed mullions below follow a consistent vertical direction. The large background towers no longer appear to lean outward or collectively tip to the left. The centered processor and circuit branches provide a coherent axis into the plaza. Compared with revision 27, the squared frontage and reduced vertical convergence are apparent without guide lines or enlarged crops. The evening and clear-day images make these relationships particularly easy to assess.

**The correction preserves believable depth.** Foreground circuit traces still widen toward the viewer, the mall has readable roof depth, and the neighboring retail blocks recede toward their respective vanishing directions. In the northern and southern views, roof and balcony horizontals become diagonal as the camera looks obliquely across the space, while the building verticals remain upright. Those receding lines are appropriate perspective rather than a renewed city-wide tilt. The result has the intended architectural-camera character without making the scene look orthographic or flattening its major depth relationships.

**The side skyline is visibly more consistent.** The tall isolated tower at the right of the southern view stands vertically, as do the neighboring slab edges and storefront posts. The northern view's close left facade and distant tower edges also share a stable vertical direction. The varied roof crowns retain their silhouettes. No obvious bowed facade, sheared tower, stretched sign or disconnected building base appears in these captures.

**The inspected free-look compositions remain plausible.** The after-drag image changes the oblique angle across the mall and railing while preserving upright posts and window edges. The zoom image shows a wider composition with coherent building proportions and a recognizable plaza. The mobile image retains the central mall, circuit-board foreground and skyline in a narrow framing without conspicuous horizontal stretching. Some storefronts are naturally cropped at the mobile edges. These stills support sensible resulting views, although they cannot establish the smoothness of the motion between them.

**The ceiling and interior views do not show an obvious projection failure.** The moderate upward balcony view retains a plausible relationship between ceiling, wall, planting and railing. The steep upward image shows ordinary-looking ceiling convergence rather than an extreme shifted-frustum smear or inversion. The interior north-window image retains the established window frame, bed foreground and deep street canyon. Whether the doorway and steep-angle blends are temporally smooth remains a functional/runtime matter, not something proved by these endpoint stills.

**The rail sightline remains intact.** The main night image shows the pale train above the mall roof on the continuous guideway. The guideway and train are also discernible in the side views. The camera correction does not hide the transit behind the retail frontage or replace the plaza composition with an excessively elevated skyline view. Day rain and fog obscure distant detail as expected while retaining the same level mall bands and upright near facade.

## Scope and limits

This acceptance covers the visible correction to apparent plaza/building tilt, upright architectural edges, useful balcony framing and preserved transit visibility in the inspected views. It is not a new whole-city realism assessment. The city remains stylized, the foreground railing occupies a substantial band in the main view, and the strongest atmosphere reduces the amount of geometry available for judging distant alignment. Those existing composition and weather characteristics do not undermine the requested correction.

Revision 18 remains **7.3/10, not accepted**, with its three whole-city rounds exhausted. Revisions 19, 20 and 21 remain **8.2/10**, revision 22 remains **8.4/10**, and revisions 23 and 24 remain historically **8.2/10** for their scopes. Revision 25 retains round 1's **7.6/10, not accepted**, followed by round 2's **8.1/10 scoped acceptance**. Revision 26 remains **8.2/10 accepted for its feature scope**. Revision 27 retains round 1's **7.7/10, not accepted**, followed by round 2's **8.1/10 scoped acceptance**. This revision 28 **8.4/10 camera-alignment acceptance** preserves those records.
