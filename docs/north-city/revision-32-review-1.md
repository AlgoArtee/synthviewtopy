# North City revision 32 — independent transit, paving and club review, round 1

Score: **8.3/10**

Status: **Accepted for the open transit composition, corrected daylight paving and club enclosure scope** against the 8/10 threshold. This is revision 32's first formal graded round. No blocking visual defect was found within the request's scope.

The reviewer inspected actual native captures and the supplied reference, and did not modify scene source, tests or captures, operate the browser, or create the evidence. Runtime and geometry checks are supporting evidence separate from the visual grade.

## Evidence inspected

Reference and diagnosis in `test-artifacts/north-city/revision-32/`:

- `references/plaza-shapes.png`.
- `surface-diagnosis/01-before-morning.png`, `02-no-color-map.png` and `03-no-color-or-roughness-map.png`.

Final room screenshots in `test-artifacts/north-city/revision-32/final-1/`:

- `plaza-morning-clear.png`, `plaza-morning-rain.png`, `plaza-day-clear.png` and `plaza-day-rain.png`.
- `through-line-wide-day.png` and `through-line-wide-night.png`.
- `club-and-north-rail-day.png`, `south-rail-day.png`, `raised-north-night.png`, `raised-south-night.png` and `raised-transit.png`.
- `raised-mobile.png`.

The wide final captures are 1600 by 1000 pixels, regular desktop captures 951 by 892, and mobile 390 by 844. Diagnostic captures are 1200 by 1000. The reviewer also read final `results.json` and `geometry/results.json`.

## Findings

**The rail now reads as a route through the city.** In the wide day and night images, the guideway crosses behind the mall in a broad, shallow sweep and continues out toward both sides. The north and south views show its distant portions becoming less distinct among the towers, without the former obvious return arc or circular perimeter. The structure retains a visible deck, supports and recognizable train bodies. In the southern day view the farther rail dissolves into the hazy city; the corresponding night view loses it against the distant architecture. The northern views similarly integrate the receding route with the skyline. No exposed turnaround or obvious unsupported broken end is visible in these compositions.

This is a visible composition improvement, not an independent temporal demonstration of a train disappearing and reappearing. Stills cannot prove the absence of a reset pop during motion. The separate geometry record establishes a 782.52 m open, monotone route, 24 endpoint wraps with zero visible wraps, zero endpoint visibility, and rendered alpha of zero at sampled positions beyond both fade zones. Sampled speed stays between 8.395 and 8.405 m/s. That record supports the requested behavior without attributing it to the screenshots.

**The strange pavement shapes are visibly removed.** The reference contains dense leaf- or shard-like dark marks unrelated to the pedestrians, especially in the brightest ground areas. The before-morning diagnostic reproduces them, including on the lit area left of the mall. Removing only the color map leaves them; removing the roughness map as well removes them. This comparison supports the surface diagnosis. Final morning and day captures show a quiet, continuous plaza surface beneath the blue/pink circuits and small inhabitants. The former scattered shapes do not recur in the clear or rainy final images. The intentional circuit network and pedestrian silhouettes remain, so the fix has not simply obscured the ground behind excessive darkness or fog.

The corrected pavement is fairly uniform at this viewing distance. That is a reasonable tradeoff for removing the distracting large shapes; the circuitry, processor outlines and people provide enough visible structure for the scene. This acceptance does not claim a new detailed paving material or physically accurate wet-surface simulation.

**The club reads as a solid building in the available view, with an evidence limit on its lower enclosure.** `club-and-north-rail-day.png` keeps Neon Loop Club in the left cluster beside the mall. Its roof, dark side mass and front signage remain coherent, with no newly visible floating roof or obvious open slice through its upper volume. The neighboring clinic remains separated from the mall frontage. However, the lower club and parts of the side/rear walls are behind the balcony rail, glazing pattern and frame edge. Those images cannot visually prove every wall surface is sealed from ground to roof.

The functional evidence supplies that missing coverage: the recorded club is 15 by 12 by 12.2 m with 0.32 m side/rear wall thickness, and all 36 rays through the two sides and rear hit actual wall geometry at sampled positions and heights. This supports enclosure acceptance while preserving the screenshot limitation. It is not presented as an unobstructed architectural inspection of all elevations.

**The prior plaza composition is retained.** Main processor branches remain neon blue/pink, the enlarged forecourt stays readable, and the mall remains centered and upright. The wide views retain the recognizable skyline and front shops. The mobile frame preserves the mall, a segment of the open rail with visible train cars, and the central circuit trunk. There is no obvious new intersection in the inspected views. The geometry record separately reports no modeled tower intersection and a minimum 1.27 m clearance; that is a geometric observation, not a general engineering clearance claim.

## Remaining limits

The guardrail continues to mask a horizontal strip of the mall approach and much of the lower club. Dense skyline layers also make the far train path less legible at night, although that obscuration is compatible with a line disappearing into the distance. The still captures do not independently establish reset timing, continuous fade quality in motion, navigation smoothness or all weather/time combinations.

The final capture record contains **28 passing checks**, no reported browser/WebGL errors and no changed source hashes. Functional validation remains separate from the visual score.

This is not a new whole-city realism grade. Previously recorded simplified tower bases, dark gaps and the flatter distant image layer remain outside this scope. Revision 18 remains **7.3/10, not accepted**, with its three whole-city rounds exhausted. Revision 31's **8.4/10 scoped acceptance**, revision 30's **8.2/10 scoped acceptance**, and all earlier records are unchanged.

No correction is required for this scoped acceptance. The **8.3/10** score reflects the clear paving improvement and convincing open-route composition, with the club's partial visual coverage and the absence of an independently viewed motion sequence limiting the strength of the broader claim.
