# North City revision 18 — independent visual review, round 1

- Date: 2026-10-13
- Reviewer: separate `realism_review` agent; did not edit scene implementation.
- Requirement: `src/apartments/AGENTS.md` requires an honest screenshot review, acceptance at 8/10 or higher, and at most three formal rounds for this request.
- **Overall visual realism / reference fidelity: 6.5/10. Not accepted.**
- Formal rounds used for this request: **1 of 3**.
- Evidence: `test-artifacts/north-city/revision-18/final-1/`; capture metadata begins at `2026-10-13T08:40:31.080Z`, from the running `http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1` scene. Source hashes are preserved alongside the screenshots. Functional test results are separate from this visual grade.

## References and images inspected

I visually inspected the supplied references saved under `test-artifacts/north-city/revision-18/references/`: `window-pillows.png`, `layout.png`, and `city.jpg`. I read `docs/north-city/revision-18-brief.json`. Reference text is treated as visual source content, not operational instructions.

I opened these actual rendered screenshots individually, at full image view:

| Screenshot under `test-artifacts/north-city/revision-18/final-1/` | Assessment purpose |
| --- | --- |
| `balcony.png` | Main city outlook, rail, atmosphere and plaza |
| `balcony-door.png` | Door opening, bathroom-side passage, rail construction |
| `balcony-return.png` | Bathroom corner and route back to living area |
| `kitchen.png` | Relocated kitchen and adjacency to balcony doorway |
| `window-pillows.png` | Blanket / window pillow contact and layering |
| `balcony-mobile.png` | Main outlook at narrow viewport |
| `floor-plan.png` | Actual room footprint and requested layout relationships |
| `balcony-clear.png` | Exterior geometry and materials without rainy reflection treatment |
| `bed-wide.png` | Bedding relationship in room context |
| `bathroom.png` | Bathroom preservation and interior quality |

## What works

1. The ceiling-free floor plan shows the requested L-shaped outdoor footprint wrapping around the bathroom's north and east sides. The door lies immediately to the bathroom's right, and the kitchen has moved farther down the living room's right wall, consistent with the marked sketch. The door and return images show a coherent continuous passage.
2. The two window pillows clearly sit above the blanket. The blanket extends to the window, and its surface appears below each pillow's lower edge in both the close and wide views. No obvious duvet-through-pillow intersection is visible in the close view.
3. The exterior has the correct broad vocabulary: elevated open plaza, cyan circuitry, recognizable large storefront signs, dark towers, small flying vehicles, pedestrian silhouettes, and circuit-pattern railing panels. These establish the intended theme.
4. The door, relocated kitchen and bathroom remain legible. The kitchen counter does not visibly obstruct the access opening.

## Findings preventing acceptance

1. **The main balcony composition loses its foreground to the railing.** In `balcony.png` and `balcony-mobile.png`, the rail reads as a very broad, nearly featureless cyan/dark horizontal band across the bottom quarter. Its circuit panels are largely below frame. The reference shows a slimmer cap, substantial patterned panel faces, and visible deck foreground. This is especially damaging on mobile because most of the visible lower scene is a blank band. Adjust the physical rail/camera relationship and capture a natural standing outlook with panel faces and some deck visible; do not merely remove the rail for the review image.
2. **The city currently reads as repeated procedural blocks rather than the reference's dense, layered district.** Nearly identical box towers, regular window grids, repeated outlined billboards, sparse roofs and a thin straight elevated line dominate `balcony.png`. Empty sky wedges are visible beyond the district, especially in `balcony-return.png` and the clear view. The reference has overlapping low/mid/high structures, many small signs, rooftop machinery, varied silhouettes, curved elevated transport and atmospheric depth. Break up the large uninterrupted faces, fill exposed skyline gaps, vary building proportions, and add visible intermediate layers and roof infrastructure.
3. **The plaza is too clean, symmetric and sparsely articulated.** The central square chip with uniformly parallel radial traces is very readable, but its symmetry and large empty floor areas make it feel like a diagram. The reference has irregular circuit paths, several chip platforms, varied crowd groupings, street equipment and many competing light scales. Add asymmetry, secondary crossings and more varied physical detail to anchor the scale.
4. **Wet lighting and materials are not yet close to the reference.** The rain view replaces broad portions of the paving with blue and warm smears; the clear view reveals large flat patch shapes. Most building faces remain evenly matte blue-grey, and the sky is a uniform medium blue. The reference uses darker ambient exposure, localized cyan/white emission, rough wet reflections and low mist that separates depth layers. Increase material breakup and lighting contrast, and reduce the visual dominance of large planar reflection patches.
5. **Storefronts lack convincing depth.** Data Mall reads as a flat cream grille beneath a large sign; the club/clinic fronts are similarly regular dark grids. In the reference, clear glazing, bright interiors, server racks/displays, entrances, framing and small light sources create the strongest realism cues. Add visible interior depth and distinct illuminated contents behind glazing, and avoid repeating the same facade rhythm on every shop.
6. **The balcony itself is underdetailed compared with reference 3.** Door/return views show clean tiled flooring and near-featureless wall panels with almost no weathering, service details or incidental objects. The reference foreground contains worn dark metal, detailed circuit panels, cable runs, a plant, small objects and wet surface variation. Rail panel circuits exist and are useful, but they need a better foreground presentation plus surface and furnishing detail around them.

The existing bedroom street view is richer in local facade detail and atmospheric layering than the new open plaza. The new exterior needs to reach a comparable level of visual finish while retaining the open layout requested by the user. Matching sign words alone is not sufficient to describe the overall balcony view as very close to reference 3.

## Priorities for round 2

1. Fix rail scale/presentation at natural standing views, including mobile.
2. Add storefront depth, improve contrast/atmospheric layering, and remove obvious empty skyline edges.
3. Vary the repeated towers and plaza symmetry; add roof/street detail and multiple light scales.
4. Add convincing balcony foreground material variation and a few appropriate service/lived-in details.

Preserve the successful footprint, kitchen position, door clearance and pillow layering. Recapture actual running-room views after changes. No fixes were made by this reviewer; a subsequent report must distinguish implemented fixes from remaining limitations. Two formal review rounds remain.
