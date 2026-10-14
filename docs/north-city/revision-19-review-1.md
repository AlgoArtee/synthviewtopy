# North City revision 19 — independent scoped review, round 1

- Date: 2026-10-13
- Reviewer: separate `realism_review` agent; no scene edits.
- Scope: the new covered balcony, weather visible from the terrace, added plaza lighting and movement, and visible regressions associated with these changes.
- **Scoped score: 7.6/10. Not accepted against the 8/10 requirement.**
- Revision 19 formal rounds used: **1 of 3**. Two remain.
- This is **not** a fourth revision 18 city-fidelity review. Revision 18's final whole-city **7.3/10, not accepted**, its three exhausted rounds and documented baseline limitations remain unchanged.
- Requirement source: `src/apartments/AGENTS.md`.
- Evidence: `test-artifacts/north-city/revision-19/final-2/`, actual runtime capture metadata `2026-10-13T10:00:18.618Z`, `http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1`. Source hashes are preserved alongside the evidence. Reported build, effects and navigation checks are separate from the visual score.

## Evidence inspected

Read `docs/north-city/revision-19-brief.json`. Used the original city reference at `test-artifacts/north-city/revision-18/references/city.jpg` and previously inspected revision 18 final-3b images as context. Existing city fidelity is not regraded here.

Opened these final-2 images individually:

- `balcony-ceiling.png`
- `balcony-corner.png`
- `balcony-door.png`
- `balcony-return.png`
- `plaza-rain.png`
- `plaza-storm.png`
- `plaza-snow.png`
- `plaza-fog.png`
- `plaza-clear.png`
- `plaza-cloudy.png`
- `plaza-academic-autumn.png`
- `plaza-academic-foggy-night.png`
- `plaza-academic-overcast.png`
- `plaza-academic-rainy-dusk.png`
- `plaza-mobile.png`
- `motion-frame-01.png`
- `motion-frame-02.png`
- `motion-frame-03.png`
- `motion-frame-04.png`

**Motion observation method:** inspected four discrete images extracted from the actual `plaza-motion.webm` clip, described as 0.5 fps sampling. I did not view continuous video playback. There is no `motion-frame-05.png` in the inspected folder. The frame sequence supports conclusions about visible changes of position, not animation smoothness, frame rate, looping, or continuous collision avoidance.

## What works in the new scope

1. **The terrace now clearly reads as covered by the floor above.** The ceiling, spanning beams, panel joints, edge structure and attached linear lights appear together in `balcony-ceiling.png`. The doorway, corner and return views show the cover continuing around the bathroom. It joins the existing walls without obvious floating pieces or gaps in these views. Headroom and the open outer edge remain readable.
2. **Weather is visibly present outside the balcony.** Rain streaks are plainly visible beyond the railing in the return and main plaza views while the covered interior remains free of obvious falling streaks. Storm mode has denser, slanted rain and reduced distance clarity; snow has discrete flakes and cold haze; clear has no visible precipitation. These modes can be distinguished without reading their filenames.
3. **Plaza activity has increased.** Pedestrians occupy more of the plaza, some holding umbrellas in wet conditions. The sampled frames show changing pedestrian positions and limb silhouettes, trains moving along the elevated route, courier craft changing position, and precipitation changing between frames. The illuminated train windows make movement readable against the distant city.
4. **New local lights contribute readable points of light.** The additional pole lights, lit rail vehicles and accents around the plaza add small warm/cyan/magenta sources to the existing circuit pattern. They help identify human-scale activity beneath the much larger signs. Weather and walkers remain visible in the narrow mobile capture.
5. The earlier terrace triangular/striped surface artifact has not returned in these inspected covered-balcony views. No obvious new obstruction of the doorway or terrace passage is visible.

## Issues preventing scoped acceptance

1. **High-contrast black rectangular artifacts remain exposed by the weather.** `plaza-fog.png` shows two large near-black vertical quads above the left roofs and smaller dark rectangular patches on the shopfronts while surrounding buildings are almost entirely obscured. They do not integrate with fog extinction and read as rendering artifacts. Similar large black rectangles are present in other presets. The implementer has separately reported a transparent-sprite / ambient-occlusion diagnosis; this review establishes the visible symptom only. The fix must be verified in fog, normal rain, clear and night captures.
2. **Foggy night removes almost all of the requested plaza lighting and life.** In `plaza-academic-foggy-night.png`, the central mall, pedestrians, trains and most plaza points of light are effectively lost in blackness. Only near-side signage and a few circuit traces remain. This communicates darkness more strongly than illuminated fog. Retain severe distance attenuation if intended, but preserve local near/midground light sources and some lit silhouettes so the added activity and atmospheric depth remain readable.

## Lesser limitations

- Snow flakes are subdued against the pale sky and much less legible than the long rain streaks. Autumn leaves are sparse and small. Both appear present, but their distinguishing local cues could be stronger without filling the view with particles.
- The new ceiling lights are clean, regular emissive bars; the slab and wall treatment remains simple. This is consistent with the existing room, and the cover itself is convincingly integrated for the current scope.
- I can verify changes between motion frames but cannot claim smooth animation or absence of path intersections from 0.5 fps samples. A denser sequence or continuous playback is needed for those claims.
- Baseline city issues documented in revision 18 remain visible, including the backdrop/model transition and repeated simplified architecture. They are carried-over limitations, not a newly assigned city score.

## Next-round verification

Recapture the unchanged ceiling/passages plus the full weather set after addressing transparent rendering and foggy-night light extinction. Include motion evidence sufficient to distinguish train/pedestrian/circuit-light activity from a static view. Preserve this round and its source-bound evidence. Two formal revision 19 review rounds remain.
