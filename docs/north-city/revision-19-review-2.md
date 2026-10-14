# North City revision 19 — independent scoped review, round 2

- Date: 2026-10-13
- Reviewer: separate `realism_review` agent; no scene edits or functional retesting.
- Scope: new balcony ceiling, weather visible from the terrace, additional plaza lights/activity, and visible regressions in those enhancements.
- **Scoped visual score: 8.2/10. Accepted for the revision 19 enhancement scope.**
- Revision 19 history: round 1 **7.6/10, not accepted**; round 2 **8.2/10, accepted**. Two of the permitted three rounds were used; another round is not needed.
- **Historical revision 18 whole-city result remains 7.3/10, not accepted.** Its three formal rounds remain exhausted. This report is not a fourth city-fidelity review and does not erase the documented backdrop, architecture or material limitations.
- Requirement source: `src/apartments/AGENTS.md`.
- Evidence graded: `test-artifacts/north-city/revision-19/final-4/`, runtime capture metadata `2026-10-13T10:24:48.304Z`, from `http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1`. Source hashes and effects results are present. Functional/build passes do not contribute visual points.

## Evidence inventory and inspection

The folder contains **17 scene stills**, **4 extracted motion-frame PNGs**, **1 WebM**, and **2 JSON files**: 24 files total, including 21 PNGs. There is no fifth extracted motion frame.

I opened these images individually:

- `plaza-fog.png`
- `plaza-academic-foggy-night.png`
- `plaza-rain.png`
- `plaza-clear.png`
- `balcony-ceiling.png`
- `balcony-return.png`
- `balcony-door.png`
- `plaza-mobile.png`
- `plaza-storm.png`
- `plaza-snow.png`
- `motion-frame-01.png`
- `motion-frame-02.png`
- `motion-frame-03.png`
- `motion-frame-04.png`

Compared these with revision 19 round-1 evidence and the previously inspected original city reference and revision 18 baseline. The remaining seasonal stills were inspected in round 1; this round used fresh representative weather modes and the specifically corrected cases.

**Motion method:** discrete extracted frames only. I did not watch continuous `plaza-motion.webm` playback. The four samples visibly establish changes of position and pose, but do not establish smooth frame pacing, every loop transition or absence of momentary path intersections.

## Round-1 blockers: resolved

1. **Black rectangular artifacts are absent.** The previously conspicuous quads above the left roofs and small dark shopfront patches are no longer visible in the fresh fog, rain and clear screenshots. Dense fog now attenuates those regions consistently with the surrounding city. The rain view exposes normal rooftop/window detail where the black shapes previously stood.
2. **Foggy-night local lighting and life remain readable.** The updated night image retains the mall and club signs, illuminated windows, circuit paths, small plaza lamps, airborne light points and silhouettes of pedestrians near the central plaza. The remote skyline is obscured. This preserves a dark low-visibility mood while allowing the requested light and activity additions to be seen, unlike the round-1 near-black center.

## Scoped result

- **Ceiling:** the slab, beams, joints and linear lights read as a continuous upper-floor structure. Door and return views preserve clear headroom and the L-shaped covered route. No obvious gap, floating lamp or new surface interference appears in the inspected views.
- **Weather:** rain and storm are plainly visible beyond the shelter; covered walking space remains visually sheltered. Snow has identifiable near flakes and cold distance haze. Dense fog strongly reduces range, and the corrected night preset preserves local lights while obscuring distant structures. Clear and precipitation modes remain distinguishable.
- **Plaza lights and activity:** additional local lamps and illuminated trains add light sources at a smaller scale than the large signs. Sampled frames show trains advancing along the track, pedestrians crossing the lit plaza with changing poses, courier movement and changing rain positions. The new activity is also legible in the mobile view. These additions give the previously static-looking open area more visible life.
- **Regressions:** no new doorway blockage, ceiling collision appearance, terrace depth artifact or broken railing is visible in the inspected screenshots. Geometry/navigation behavior is covered by the separate functional checks, not inferred from this review.

## Remaining non-blocking limits

1. Dense daytime fog is close to a whiteout and obscures most of the plaza; this is a strong preset rather than a subtle atmospheric effect. Night fog has readable local lighting but still little volumetric glow around it.
2. Snow and seasonal leaves remain quieter cues than the rain. Rain streaks are fairly uniform and the weather treatment is stylized.
3. Pedestrians and trains remain simple at close inspection. The sampled sequence demonstrates movement, while detailed gait quality, animation smoothness and continuous path interactions are outside what four extracted frames can prove. Circuit-light packet movement is less independently obvious at this sampling than train and pedestrian motion; its behavior is covered by the separate runtime checks.
4. The ceiling is coherently integrated but uses clean, repetitive beams and lights with limited surface weathering.
5. Existing whole-city fidelity limitations remain, especially the image-based skyline transition and simplified repeated architecture. The acceptance here applies only to the current ceiling/weather/activity follow-up, not to a claim that the entire exterior now closely reproduces reference 3.

The requested new features are visibly present, integrated and free of the two blocking issues found in round 1. Preserve this report together with both revisions' earlier scores and evidence.
