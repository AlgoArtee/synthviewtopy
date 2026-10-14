# North City revision 25 — independent animation visibility review, round 1

Score: **7.6/10**

Status: **Not accepted** against the 8/10 threshold. This is the first formal graded round for the user's report that flicker and TV-like window activity are not visible. The reviewer did not edit scene source, operate the browser, or create the captures. Two formal rounds remain for this request.

## Evidence and method

The reviewer inspected these actual running-room images from `test-artifacts/north-city/revision-25/final-1/` at their native **951×892** size, without enlargement or selected-window crops:

- `balcony-evening-native-0s.png`, `balcony-evening-native-3s.png`, `balcony-evening-native-6s.png`, `balcony-evening-native-9s.png`, `balcony-evening-native-12s.png`.
- `balcony-night-native-0s.png`, `balcony-night-native-3s.png`, `balcony-night-native-6s.png`, `balcony-night-native-9s.png`, `balcony-night-native-12s.png`.
- `north-evening-native-0s.png`, `north-evening-native-4s.png`, and `balcony-day-native.png`.

The capture agent reports native playback without `advanceTime`. Two 12-second WebM recordings are retained alongside the frames; this reviewer does **not** claim continuous video audition. Shader samplers, changed-pixel metrics, coverage counts and the corrected clock are functional evidence, not the basis for this visual score. The investigation record was read before inspection.

## Findings

**Localized neon flicker is now readable.** Data Mall is conspicuously dimmer in the evening 3-second frame than in the 0- and 6-second frames. Its letters and border dim together while the neighboring Circuit Dive sign and surrounding masonry retain their appearance. This is a clear improvement at normal viewing size. The plaza's overall light remains coherent, and the inspected sequence does not show the entire city flashing or breathing in synchrony.

**TV-like interior movement is still insufficiently legible for acceptance of this corrective request.** Across the full-size balcony sequences, the skyline's dominant impression remains a stable, dense pattern of repeated bright window interiors. Some individual cool/warm and brightness differences can be found by comparing windows, particularly at night, but multiple shifting interior shadows do not announce themselves at normal viewing size. The repeated existing furniture/shadow marks are visually stronger than the moving component. The north pair likewise does not plainly convey someone watching television through several distant windows; signs, traffic, steam and holograms are much easier to perceive. This does not mean the shader is stopped or that no pixels change. It means the user's stated visibility problem has not yet been convincingly resolved by the inspected normal-size evidence.

**Visual integration remains plausible.** Window frames and masonry appear fixed, light is localized, and the nighttime signs remain sharp. The day capture is restrained and does not look like a bright flashing facade. Existing facade repetition and small distant-room footprints limit how much interior detail can survive. There is no visible clipping, displaced facade geometry, or new broad light sheet in these frames.

## Concrete correction before round 2

1. Make the selected windows' moving dark/light split survive downsampling to a handful of pixels. Favor a broad change across a substantial part of the opening, with a clearly distinguishable darker TV scene and brighter scene, over finer silhouette detail that disappears at this viewing distance. Retain independent timing and the stable approximately 40% selection.
2. Ensure existing static emission/furniture detail does not visually overwhelm that broad change. Raising all window brightness is not sufficient and risks flattening the night scene. A few unmistakable asynchronous interior changes among steady neighboring rooms would demonstrate the effect better than a uniformly brighter skyline.
3. Recapture fixed normal-size native-playback balcony night/evening frames, and the north view if changed, after the correction. Evaluate whether the broad changes are readable before consulting crops or metrics. Keep the already readable localized sign flicker and stable masonry.

## Limits and historical record

This grade is scoped to visible ambient flicker and TV-like interior activity at the user's viewport, not to a renewed whole-city realism assessment, detailed inhabitants, or every weather combination. A single day still cannot validate day animation pacing, and no morning sequence was visually graded here. Functional clock and reduced-motion checks remain separate.

Revision 18 remains **7.3/10, not accepted**, with its three whole-city rounds exhausted. Revisions 19, 20 and 21 remain **8.2/10** for their respective scopes, revision 22 remains **8.4/10**, and revisions 23 and 24 remain historically **8.2/10**. Those historical grades are not evidence that this user's current visibility concern is solved. Revision 25 round 1 remains **7.6/10, not accepted** until concrete changes and a new formal round establish otherwise.
