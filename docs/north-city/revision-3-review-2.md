# O's City Apartment — revision 3, realism review 2

Date: 2026-10-11  
Reviewer: independent realism agent  
Formal review: **2 of 3**  
Decision: **8.1/10 — accepted narrowly**  
Acceptance threshold: **8/10**  
Remaining formal review allowance: **1 unused**

The completed second-pass runtime captures clear the requested minimum. The cyan human figure is no longer visually decapitated by the upper bridge, the crowd has better scale and grouping, and the road traffic and reflections are less uniform. The circular white rug and the kitchen-facing floating chair remain correctly integrated into the apartment.

Acceptance is for a credible real-time interpretation of the supplied references. It does not mean the city or interior is indistinguishable from a photograph. The retained limitations below remain visible and should be disclosed. A third formal review is not necessary solely to exhaust the maximum allowance.

## Fixed rubric

| Criterion | Score | Maximum | Assessment |
| --- | ---: | ---: | --- |
| Physical layout, scale and construction | 1.90 | 2.00 | Coherent apartment and chair assembly; full cyan head/neck visible below the bridge; crowd scale and grouping improved. Exterior figures and vehicles retain simplified geometry. |
| Lighting, shadows and reflections | 1.55 | 2.00 | Controlled neon boards, dark readable facade masses, warm windows and softer broken road reflections. The conspicuous blue puddle and patterned reflection distribution remain less natural than the reference. |
| Materials and textiles | 1.45 | 2.00 | White fibrous rug, matte bedding, acrylic, porcelain and plaster stay coherent. Vehicle body/glass variety improves material separation, although most surfaces and textiles remain simplified. |
| Fidelity to references | 1.95 | 2.50 | All central motifs of the new rainy-city reference are recognizable, including a complete cyan figure, pink figure, cable swags, occupied bridges, street traffic, projecting signs and steam. Density, human detail and wet-road richness remain reduced. |
| Composition and coherence | 1.25 | 1.50 | Arch-framed street depth and the cyan/pink focal pair read clearly; the corrected head removes the main focal defect. Wide interior views retain the required furniture relationships. |
| **Total** | **8.10** | **10.00** | **Accepted at the requested threshold** |

Revision-3 history: **review 1: 7.7/10, rejected → review 2: 8.1/10, accepted**. Earlier revision grades remain preserved and are not replaced by this evaluation.

## Changes verified against review 1

- **Cyan hologram composition:** The full head and neck are visible beneath the upper bridge in city-reference.png, city-detail.png, on-bed.png and sleep.png. The earlier headless impression is resolved. The full silhouette also remains readable in the inspected weather captures.
- **Bridge crowd:** Reduced visual dominance, unequal heights/widths and more varied group gaps make the crowd less regimented. They still read as simplified silhouettes, but no longer dominate the view as strongly as the pass-1 identical tall mannequins.
- **Vehicle variation:** The road now shows several recognizable body proportions, roof/cabin treatments and muted colors. Rear glazing and body highlights improve the distinction between vehicles.
- **Road reflection treatment:** The earlier crisp wavy/barcode rectangles are replaced by softer, more broken light streaks of varying lengths. This is a visible improvement even though the overall distribution remains patterned.
- **Neon boards:** The large cyan NOVA and pink LUNA signs no longer contain conspicuous concentrated white hot spots. Their text, colored borders and dark backing stay readable.
- **Facade layering:** Larger sagging cable bundles, additional vent groupings and vertical signs improve the layered city texture. Warm room patches and blinds contribute a more occupied appearance.
- **Room revisions retained:** The circular rug remains bright white with discernible fibers, edge thickness and floor contact. The transparent chair, back cushion and seat rotate coherently toward the east kitchen; the floating position is explicit user intent. No redesign of either is required by this review.

## Remaining limitations

1. **The pale-blue road puddle is conspicuously simplified.** Its hard, largely uniform outline and flat blue interior read as a patch laid onto the road rather than a naturally irregular reflective wet area. This is the clearest remaining local material artifact.
2. **Cars, pedestrians and holograms are visibly stylized.** Added variations help, but vehicle bodies remain fairly box-like, bridge people are low-detail silhouettes, and the luminous people have simple anatomical surfaces. Their fidelity does not match the reference's richly modeled human forms and vehicles.
3. **Wet-road light remains more patterned than photographic.** The softer streaks are better than pass 1, but they do not yet merge with a continuous, richly varied reflective asphalt surface like the reference. There is less colored mist, lateral reflected light and subtle variation around traffic.
4. **Building motifs repeat.** Facade bays, blinds, warm-window blocks, signs and mechanical fittings remain modular. The larger cable swags improve the layering but do not eliminate repetition.
5. **The prior interior limitations persist.** Bed folds and pillow tension wrinkles are simpler than real relaxed cotton, rug fibers remain relatively fine and granular, and broad walls/floor can look evenly shaded. The expanded living area also leaves deliberately sparse floor space in overview views.
6. **The new reference is interpreted rather than reproduced exactly.** Overall street-canyon framing and the key objects match, while exact building density, bridge positions, typography, hologram anatomy and photographic light transport differ.

These limits are part of the accepted 8.1/10 assessment. They are not claimed as solved.

## Animation and functional evidence

The paired city-detail.png and city-time-b.png captures show different car placement, bridge crowd distribution and steam shapes. animation-results.json records the same city-detail viewpoint at 2.716 and 7.766 seconds. Sample car positions change in opposite signed directions for the opposing streams; sampled pedestrians, steam and hologram yaw also change.

Recorded counts remain 44 cars, 68 pedestrians, 2 holograms and 8 steam vents. This evidence establishes active animated state. It does not independently establish sustained frame pacing, every loop transition or collision behavior from two still images. The implementing agent reports that opposing traffic motion aligns with the headlights; that broader runtime assertion was not independently replayed during this screenshot review.

The saved records contain ready=true and empty runtime and animation error arrays. They record the 60.48 m² living area, bed eye height 2.37 m, window stop Z=-2.735 m, floor return eye height 1.65 m and mobile viewport/scroll widths both 390 px. Functional success does not contribute points to the realism score.

## Evidence inspected

Immutable runtime directory:

`F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-3/pass-2/`

Inspected PNGs: city-reference.png, city-detail.png, city-time-b.png, sleep.png, lounge.png, plan.png, on-bed.png, weather-clear.png, weather-rain.png, weather-storm.png, weather-snow.png, mobile.png, bathroom.png and corner-sw.png.

Read records: results.json, animation-results.json and animation-errors.json in the same directory.

Primary new-city comparison:

`F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/references/07-live-rain-city.jpg`

Original room references retained in the same durable references directory:

`01-layout.png`, `02-bed.jpg`, `03-bathroom.png`, `04-desk.png`, `05-lamp.png`, `06-ceiling-chair-carpet.jpg`.

Later user directions for expanded living space, the floating east-facing chair, the circular brilliant-white rug and the new rainy animated city override conflicting features in the earlier references.

This report grades the immutable pass-2 visual evidence. No scene implementation source was changed by the independent reviewer.

