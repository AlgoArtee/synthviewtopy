# North City revision 22 — independent scoped visual review, round 1

Score: 8.3/10

Status: **Accepted for the revision 22 daytime rain/storm and distant-neon polish**, against the 8/10 threshold. This is the first formal graded round for this request, with a maximum of three permitted. The reviewer wrote the focused browser capture/check script but did not edit any scene source.

## Review prompt and boundaries

Review the user's request for brighter daytime rain and storm, clear and sharp night neon except during fog, and more diverse distant city neon with occasional localized flicker. Inspect actual room captures from both the balcony and north window, compare the previous night appearance where evidence exists, and identify regressions or limitations. Grade this change independently from earlier whole-city realism reviews. Distinguish what still images show from actual runtime emission samples; do not claim continuous video or audio audition.

The parent explicitly authorized this formal round only after the source-frozen runtime capture completed. The evidence set is `test-artifacts/north-city/revision-22/final-1/`. Its completed run contains 40 time/weather combinations, 364 passing runtime checks, 12 screenshots, zero browser errors and unchanged before/after hashes for scene and capture sources. Those functional results support behavior coverage and evidence integrity; they do not supply visual points.

## Images inspected

Every one of the following actual browser-rendered images was individually inspected. Paths are relative to `test-artifacts/north-city/revision-22/final-1/`:

- `balcony-rain-day.png`
- `window-rain-day.png`
- `balcony-storm-day.png`
- `window-storm-day.png`
- `balcony-clear-night.png`
- `window-clear-night.png`
- `balcony-rain-night.png`
- `window-rain-night.png`
- `balcony-fog-night.png`
- `window-fog-night.png`
- `balcony-clear-night-later.png`
- `window-clear-night-later.png`

For the previous night appearance, the reviewer also inspected `test-artifacts/north-city/revision-21/final-1b/balcony-clear-night.png` and `test-artifacts/north-city/revision-21/final-1b/balcony-rain-night.png`. There is no matched earlier daytime-rain or daytime-storm balcony still in that prior evidence set, so the before/after daytime brightness comparison is numerical; the current daytime legibility is judged from the new rendered images.

## Visual findings

Daytime rain now reads as an overcast day. The balcony outlook has a light blue-gray sky and haze, visible mid-distance building mass, and readable foreground roofs, paving and shop facades. It is clearly separated from the dark clear/rain night images. Daytime storm retains a darker and bluer atmosphere than rain, denser angled drops and more distance attenuation, but it still has daylight in the sky and visible architectural volume. At the north window, both weather types leave the bedding and ceiling bright while the closely packed street remains appropriately shaded. This is a coherent distinction between shaded buildings and the overall time of day.

The nighttime sharpness improvement is substantial in the actual balcony images. Compared with revision 21, the broad cyan veil around the shop signs and circuit paths is greatly reduced. Individual luminous lines, lettering edges and dark gaps remain distinct. The city still reads as illuminated: shop interiors, pavement reflections and the local pools of light remain visible. The north-window images likewise preserve clean cyan and magenta sign borders and recognizable glyphs without the large soft halos. Clear and rainy night remain dark, while the night rain's reflections and precipitation preserve its different surface/weather character.

Fog keeps the intended exception. The balcony fog image has diffuse cyan halos around the plaza lighting and softened building bodies, and the north-window fog image visibly spreads light around the cyan and pink signs. Thus the sharper night treatment has not erased atmospheric softness from the fog condition.

The distant balcony skyline now has more visibly mixed warm, cool, rose and violet window groups and architectural accents. Purple/pink remote sign faces stand apart from the cyan-dominant plaza. Small colored accents also appear at depth in the north canyon, though this view gives them much less screen area. The dominant cyan city identity survives, while the far layers look less uniformly treated than the prior balcony night frames. The two later clear-night frames preserve that composition without obvious new geometry, black-rectangle, clipping or light-sheet artifacts.

## Dynamics evidence and limits

The 48 discrete actual-room samples span approximately 83 seconds of explicitly advanced scene time, in addition to elapsed rendering time. Seven of nine balcony emitters and four of five north emitters changed pulse during that sampling. The lowest observed actual pulses were approximately 0.501 and 0.439 respectively; no sampled pulse exceeded its steady value. At most one emitter per outlook was dimmed in any captured sample. Both outlooks reset all sampled emitters to 1 under reduced motion and kept them unchanged across a further 30-second advance.

This establishes independently changing, bounded local light emission in the running scene. It does not establish the perceived pacing or smoothness of continuous flicker. The two later stills show a stable city and different ongoing activity, but their sparse timing is not sufficient to visually evaluate every short dim/recover event. No continuous playback or audio audition was performed, and neither is claimed by this score.

## Remaining limitations

- Far-distance color variety is a restrained accent. Warm/cool window grids and repeated purple sign treatments still dominate parts of the skyline; the distant blocks do not have the individually authored advertising variety of the original city reference.
- Bright daytime rain has a pale, low-contrast far background. It is clearly daytime, but distant signs can become faint against that haze.
- Fog still leaves some detached-looking luminous window grids when their building bodies fade, and the north-window fog frame blooms the interior ceiling strip as well as exterior signs. These are existing atmospheric limitations, not evidence that fog has become sharp.
- Regular window patterns, repeated facade forms and simplified materials remain visible. This lighting polish does not resolve the earlier whole-city reference-fidelity gap.
- Continuous flicker cadence remains a perceptual limitation of this still-image review; the runtime checks establish local modulation and reduced-motion behavior separately.

No blocking visual defect was found within the requested revision 22 scope. Daytime rain/storm, non-fog night sharpness and restrained distant color diversity are visibly achieved, with the temporal claim bounded as above.

## Historical acceptance boundaries

Revision 18 remains **7.3/10, not accepted**, after its three exhausted whole-city review rounds. Revisions 19, 20 and 21 each remain **8.2/10, accepted only for their respective enhancement scopes**. This revision 22 score does not supersede those records or claim whole-city reference fidelity has been accepted.
