# North City revision 25 — independent animation visibility review, round 2

Score: **8.1/10**

Status: **Accepted for the scoped flicker and TV-window visibility correction** against the 8/10 threshold. This is the second formal graded round for this request. Round 1 remains **7.6/10, not accepted**; its report and evidence are preserved. The reviewer did not edit scene source, operate a browser or generate the captures.

## Evidence and method

The reviewer inspected all thirteen actual running-room images in `test-artifacts/north-city/revision-25/final-2/` at their native **951×892** size:

- `balcony-evening-native-0s.png`, `balcony-evening-native-3s.png`, `balcony-evening-native-6s.png`, `balcony-evening-native-9s.png`, `balcony-evening-native-12s.png`.
- `balcony-night-native-0s.png`, `balcony-night-native-3s.png`, `balcony-night-native-6s.png`, `balcony-night-native-9s.png`, `balcony-night-native-12s.png`.
- `north-evening-native-0s.png`, `north-evening-native-4s.png`, and `balcony-day-native.png`.

These are fixed-camera samples of native playback without manual time advancement. No crop, enlargement, marked window or changed-pixel statistic was used to determine this grade. The two 12-second WebM recordings are supplementary artifacts; the reviewer does **not** claim continuous video audition. The capture agent's reported 38 passing checks, zero browser errors, unchanged source hashes and approximately 1.000 ambient-clock ratios corroborate the capture conditions rather than determine the visual score.

## Findings

**Several larger skyline windows now show legible independent interior changes at normal viewing size.** In the night sequence, windows on the broad tower left of center, the narrow central tower and the stepped tower to the right visibly alternate between brighter colored interiors and substantially darker interiors. Broad dark portions change while adjacent warm rooms remain steady. These differences can be located in the full scene rather than requiring a magnified seven-pixel opening. The old repeated bright U-shaped interior marks no longer dominate every selected room throughout the sequence. This addresses the main failed criterion from round 1.

The result reads as intermittent television illumination and changing interior shadow distribution among occupied rooms. It does not communicate a detailed television program or a clearly modeled seated person at this distance, and it should not be described as doing so. The individual windows remain small, but the distributed activity is now readable without making the entire skyline flash.

**Evening is softer but still shows distributed dark/light changes.** The lighter atmosphere reduces their contrast relative to night, as expected. The north pair remains more restrained because the relevant windows occupy a smaller central area among bright signs and holograms. Its far central window pattern does change across the four-second interval, including brighter and darker openings, but this is less conspicuous than the balcony night effect. That view should be described as subtle rather than equally strong.

**Localized sign flicker remains visibly independent.** For example, the left-facing Data Mall board is dimmer in the evening 9-second frame than in the 6- and 12-second frames, while the large central Data Mall and Circuit Dive signs do not undergo the same change. Building bodies, frames and masonry hold their appearance. The sampled sequences contain no broad synchronous facade pulse, moving window frame, clipping regression or new sheet of illumination across the city.

**The day frame retains the intended lower contrast.** Window activity does not overwhelm the brighter, hazier daytime environment. This still establishes visual integration only; a single day image cannot establish the pacing of the day animation.

## Scope and remaining limits

The acceptance is for the visibility correction in the inspected native-size balcony evening/night and north evening views, with a daylight integration check. It is not a new whole-city realism grade and does not independently validate every weather/time combination. Morning pacing and continuous video playback were not visually auditioned. The repeated city geometry remains, and the smallest remote windows will still resolve primarily as changing colored points rather than readable silhouettes.

The approximately 40% stable window selection, reduced-motion behavior and clock regression checks are functional matters covered by the parent validation. They are not inferred from the visible percentage of windows in these images. The startup reduced-motion bug was a separately identified issue; the investigation did not demonstrate that it caused the user's original report.

Revision 18 remains **7.3/10, not accepted**, after its exhausted three whole-city rounds. Revisions 19, 20 and 21 remain **8.2/10** for their respective scopes, revision 22 remains **8.4/10**, and revisions 23 and 24 remain historically **8.2/10**. Revision 25 round 1 remains **7.6/10, not accepted**. This round's **8.1/10 scoped acceptance** follows a concrete change to the selected windows' interior illumination and does not rewrite those records.
