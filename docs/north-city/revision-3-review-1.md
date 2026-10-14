# O's City Apartment — revision 3, realism review 1

Date: 2026-10-11  
Reviewer: independent realism agent  
Formal review: **1 of 3** for the new user-requested revision  
Decision: **7.7/10 — not accepted**  
Acceptance threshold: **8/10**  
Remaining formal reviews for this revision: **2**

The circular bright-white rug and the kitchen-facing floating chair are implemented convincingly enough to preserve the room's established design. The city now contains the principal requested types of activity and has a much stronger night-street identity. However, the new city's prominent human figures, vehicle shapes and wet-road reflections still have visible defects that prevent the complete scene from reaching 8/10 against the new reference. Previous revision grades are preserved; this grade evaluates the substantial new city request and its current evidence.

## Fixed rubric

| Criterion | Score | Maximum | Reason |
| --- | ---: | ---: | --- |
| Physical layout, scale and construction | 1.80 | 2.00 | Room layout and chair assembly remain coherent. Exterior pedestrian proportions and the cyan figure's overlap with the bridge weaken scale and construction plausibility. |
| Lighting, shadows and reflections | 1.50 | 2.00 | Neon color, dark architecture, warm windows and depth haze establish the intended atmosphere. Road reflections are too regular and graphic, and several sign/facade highlights are concentrated into artificial-looking hot spots. |
| Materials and textiles | 1.40 | 2.00 | White fibrous rug, matte bed, transparent bowl, porcelain and plaster remain recognizable. Vehicle bodies and wet road are conspicuously simplified; existing cloth/rug microdetail limitations persist. |
| Reference fidelity | 1.80 | 2.50 | Arch framing, street canyon, NOVA/LUNA/CAFE placement, bridges, traffic, steam and two colored human holograms are present. Human silhouettes, roadway light, cable density and facade variation remain notably unlike reference 07. |
| Composition and coherence | 1.20 | 1.50 | The city-reference view conveys the requested overall composition and the room views stay readable. The cropped cyan head and overly prominent bridge crowd damage a focal region of the new composition. |
| **Total** | **7.70** | **10.00** | **Below the acceptance threshold** |

## Confirmed improvements and fulfilled room changes

- The rug is circular, substantially white and visibly fibrous. It retains an edge and floor contact rather than becoming a clipped white disc.
- The transparent chair and its seat/back cushions rotate as a coherent assembly. The open seated direction faces the east kitchen, visible in the overview and south-west room view. Its unsupported floating position remains intentional user direction.
- The enlarged room still contains the bed beside the arch, pastel bathroom, white kitchen, holographic workstation, helix bedside light and concentric ceiling fitting.
- The night city has warm occupied windows and blinds, cables, AC/vent details, projecting cyan/magenta signs, two occupied bridges, traffic and two colored holographic human forms.
- The captured cars, crowd distribution and steam change over time. The recorded animation values support ongoing animation rather than a single decorative still.
- Weather states remain visibly distinct. The default rainy night atmosphere is appropriate to the new primary reference.

## Priority defects and concrete corrections

1. **The cyan hologram reads as headless.** In city-reference.png, city-detail.png, on-bed.png, sleep.png and the inspected weather views, its shoulders meet the underside of the upper bridge while its head/neck are not visibly readable. Bridge occlusion is the apparent cause in these views; the review does not claim the head mesh is absent. Move or resize the figure/bridge relationship so the entire head, neck and upper torso stay clearly visible from the main bedroom cameras. The reference's full cyan human figure is a major visual anchor, so this is the highest-priority composition defect.

2. **Bridge walkers look like a row of oversized, repeated mannequins.** The upper-bridge people are much more visually dominant relative to the bridge rail and nearby facade than the small crowd in the reference. Similar thin bodies, heights, spacing and poses create a regimented silhouette. Adjust apparent scale against the windows/rail, diversify body/clothing outlines and grouping, retain some gaps, and stagger walking phases. Feet should remain at deck height and bodies within the railing.

3. **Cars and road reflections look diagrammatic.** Cars are predominantly identical dark box-like forms. Reflections have crisp rectangular extents and a repeated wavy or barcode pattern, with little irregular wet-surface integration. Use several distinct vehicle silhouettes, lengths and restrained colors, visibly plausible glazing and shaped body highlights. Break reflection edges and intensity into irregular puddle-shaped smears; vary reflection width/length and introduce broader cyan, pink and warm street/sign contributions. The reference's wet road is a continuous reflective surface containing traffic, rather than a dark plane carrying repeated bright strips.

4. **The city lacks the reference's irregular dense layers.** Added details help, but facade bays, lit-window arrangements and signs repeat strongly. More asymmetric sagging cable bundles, localized pipe/vent clusters, varied occupied interior patches and a few tall luminous signs would better reproduce the reference. The current central sky and road also have less luminous mist and multicolored reflected depth than reference 07. Retain readable dark masses; uniformly increasing exposure or fog would not solve this.

These corrections should focus on the new exterior. The rug and chair direction do not require another redesign.

## Continuing limitations

The previously accepted interior remains recognizably synthetic at close range: bedding has fewer nested creases than the photographic reference, the rug uses fine grainy pile rather than long soft overlapping wool, some plaster/floor lighting is flat, and manufactured edges lack subtle wear and finish variation. These are retained limitations, not new failures caused by this revision.

The large room remains sparsely furnished in the overview because of the authorized doubled living area. I have not treated this as permission to invent additional furniture.

## Animation and functional evidence

The visual pair city-detail.png / city-time-b.png shows changed vehicle placement, bridge crowd distribution and steam shape. animation-results.json records the same city-detail camera at times 3.017 and 8.067 seconds. Sample cars move, three of the four sampled pedestrian positions change, the steam sample changes height/position, and both hologram yaw values change. One unchanged pedestrian sample can represent a stationary observer; it does not invalidate the recorded moving pedestrians.

Recorded counts are 44 cars, 68 bridge pedestrians, 2 holograms and 8 steam vents. Both animation errors and regular runtime errors are empty. results.json records ready=true, living area 60.48 m², gross area 78.15 m², six weather modes, climbed eye height 2.37 m, window stop Z=-2.735 m, floor return eye height 1.65 m and equal mobile viewport/scroll widths of 390 px.

These records confirm functioning features, not photographic realism. Two separated stills establish changed state, but do not independently establish sustained smoothness, frame pacing or absence of every loop discontinuity. No additional realism points were awarded solely for object counts or successful functional checks.

## Evidence

Primary new reference:

`F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/references/07-live-rain-city.jpg`

Original references retained, with later user changes taking precedence:

`F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/references/01-layout.png`  
`F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/references/02-bed.jpg`  
`F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/references/03-bathroom.png`  
`F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/references/04-desk.png`  
`F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/references/05-lamp.png`  
`F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/references/06-ceiling-chair-carpet.jpg`

Immutable runtime capture directory:

`F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-3/pass-1/`

Inspected PNGs: city-reference.png, city-detail.png, city-time-b.png, lounge.png, plan.png, entrance.png, sleep.png, on-bed.png, bathroom.png, study.png, kitchen.png, ceiling.png, mobile.png, corner-sw.png, weather-clear.png, weather-rain.png, weather-storm.png, weather-snow.png and weather-fog.png.

Read recorded evidence: results.json, animation-results.json and animation-errors.json in that directory.

No scene source edits were made during this independent review. This is one formal grade, review 1/3; it does not consume an additional review for the explanatory findings or report.

