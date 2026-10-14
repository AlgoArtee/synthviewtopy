# North City revision 22 — independent scoped visual review, round 2

Score: 8.4/10

Status: **Accepted for the final revision 22 daytime rain/storm and distant-neon polish**, against the 8/10 threshold. This is the second formal round of a maximum of three. Round 1 remains honestly recorded at **8.3/10, accepted** for its earlier source/capture state; it is not retroactively marked failed.

## Prompt, change and evidence

Independently recheck the actual rendered city after the root reviewer found correlated billboard placement and atlas selection. Confirm that the repeated distant violet KIBO TECH treatment has become visibly more varied, and that brighter daytime rain/storm, sharp non-fog night lights and soft fog lights remain intact. Keep claims about animation separate from still-image observations and preserve previous review history.

The scene change since round 1 is the distant balcony billboard tile selection. The revised expression decorrelates the chosen atlas tile from the rule that places the billboard. Emission, weather, geometry layout and flicker profiles were not redesigned in this correction. The reviewer did not edit scene source.

Current visual evidence is `test-artifacts/north-city/revision-22/final-2/`: 12 fresh actual-room screenshots with four passing integrity checks, no browser errors and stable before/after source hashes. This was deliberately a **capture-only run**. The full runtime evidence remains `test-artifacts/north-city/revision-22/final-1/results.json`, with 40 combinations and 364 passing checks; those checks were not rerun or misrepresented as fresh after the tile-only correction. The capture report links that supporting evidence explicitly.

## Images inspected

All 12 current images were individually inspected. Paths are relative to `test-artifacts/north-city/revision-22/final-2/`:

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

The comparison uses the earlier `final-1` images already inspected in round 1, particularly its balcony clear/rain-night frames. The revision 21 night baseline inspection and its paths remain recorded in the round-1 report.

## Findings

The billboard correction is visibly successful. In the clear-night balcony view, the distant upper-left sign now has a mint/green treatment, upper-right boards carry pink treatments, and other remote boards retain violet or cyan. Their labels also vary instead of almost every visible remote horizontal board reading KIBO TECH. This is a small but clear improvement to the skyline's visual variety; the far signs look more like several separate businesses. They remain subordinate to the foreground plaza rather than turning the whole skyline into a flashing display.

The daytime rain and storm images retain their improved illumination. Rain has a pale, overcast blue-gray distance; storm remains darker and denser but still reads as daytime. Near roofs and shops have readable form, and the north-window views keep the bedding and ceiling bright while the street canyon remains shaded. The storm does not revert to the dark nighttime appearance.

Clear and rainy night still have distinctly edged sign lettering, borders and circuit paths. The broad cyan halo seen in revision 21 is restrained, while local shop illumination and wet reflections remain. Both fog-night views retain visibly diffuse light and softened atmosphere. The tile correction has not introduced an obvious new sign-plane, clipping, black-rectangle or geometry artifact in these inspected views.

The later clear-night images remain coherent with their earlier counterparts. They show different ongoing scene activity, but they are not a continuous animation review. The independently changing distant emission and reduced-motion behavior remain supported by the earlier actual runtime samples summarized in round 1, not by a claim that these sparse stills display every brief flicker event.

## Remaining limitations and acceptance boundaries

The scoped result is accepted with the same principal limitations as round 1: repeated tower and window patterns remain; distant colors and ads occupy small screen areas; daytime rainy haze can make remote signs faint; fog can leave detached-looking luminous window grids and blooms the north-window interior strip. The retained cyan identity still dominates the plaza, and the far advertising is more varied without becoming fully individually authored reference-level architecture.

No continuous video playback or audio audition was performed. Brief flicker pacing is functionally sampled but not continuously visually graded. The scene sources and actual rendered evidence, rather than the numeric test count, determine this visual score.

Revision 18 remains **7.3/10, not accepted**, after its three exhausted whole-city review rounds. Revisions 19, 20 and 21 remain **8.2/10 for their respective accepted enhancement scopes**. This final revision 22 acceptance does not supersede those historical boundaries or claim that the whole city meets the original reference-fidelity target.
