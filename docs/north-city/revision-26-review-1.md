# North City revision 26 — independent visual review, round 1

Score: **8.2/10**

Status: **Accepted for the requested mall, window controls, plaza hair and moving circuit-light changes** against the 8/10 threshold. This is the first formal graded round for revision 26. The reviewer did not edit scene source or tests, launch a browser, operate the room, or generate the captures.

## Evidence and method

The reviewer inspected all twenty screenshots in `test-artifacts/north-city/revision-26/final-1b/` at their native size. Production-room captures are **951×892**; the mobile controls capture is **390×844**.

- `mall-evening-default.png`, `mall-evening-clear.png`, `mall-night-clear.png`, `mall-morning-cloudy.png`, and `mall-day-rain.png` establish the production balcony composition across the four times of day.
- `mall-night-native-0s.png`, `mall-night-native-2s.png`, `mall-night-native-4s.png`, `mall-night-native-6s.png`, and `mall-night-native-8s.png` are fixed-camera native-playback samples.
- `balcony-windows-all-dark.png`, `balcony-windows-all-lit-steady.png`, `balcony-shadows-only.png`, `balcony-tv-only.png`, `north-windows-all-dark.png`, and `north-windows-all-lit-steady.png` show the window-control extremes.
- `window-sliders-desktop.png` and `window-sliders-mobile.png` show control layout and readable values.
- `residents-hair-inspection.png` and `mall-interior-inspection.png` use inspection cameras rendering the actual loaded scene. They establish the smaller geometry and interior details; they are not represented as production balcony views.

The supplied user reference was compared with the changed retail frontage and preserved rail sightline. The retained eight-second WebM was not continuously auditioned; this report makes no video-audition claim. The reported 84 passing functional checks, zero browser errors, source stability, rail occlusion samples and animation-clock measurements corroborate capture conditions but do not determine this visual grade. The earlier `final-1` QA failure concerned a weather-option identifier; it is not counted as a formal visual round or a scene correction.

## Findings

**The requested neighboring retail buildings now read as one larger Data Mall.** The new continuous roof, broad centered Data Mall sign, uninterrupted glazed frontage and repeated internal bays replace the reference's separate Data Mall and eastern Circuit Dive. The facade remains proportionate to the plaza rather than becoming an oversized tower. Cloud / 24 and Server Vault boards flank the main sign, the upper Now Open board remains visible, and smaller colored department boards and luminous strips populate the interior. These additions are visible in the normal balcony composition, especially at night. The surviving Circuit Dive elsewhere in the scene is outside the merged neighboring footprint.

**The rail and train sightline is retained.** The guideway runs clearly across the background above the mall's roof in the production views. In the native night sequence, the pale aerodynamic train is visible at the right in the four-second frame, moves farther left in the six-second frame and reaches the central background in the eight-second frame. The new retail frontage does not obscure its body in these samples. Morning haze reduces contrast but still leaves a recognizable train above the roof. No visual evidence requires raising the unchanged-height mall or its rail alignment.

**The three window controls are clear and visually consequential.** The desktop and mobile panels show distinct sliders for moving shadows, illuminated windows and TV lights, with percentage readouts and a short explanation that the latter two effects apply to illuminated rooms. All-dark and all-lit comparisons produce a conspicuous skyline change in both balcony and north views while retaining signs, street life and the mall's commercial lighting. The shadow-only and TV-only balcony images show different interior treatments: dark divisions in the former and broader colored light in the latter. Static images cannot establish exact selection percentages, independence at every intermediate value, persistence or temporal behavior; those remain functional checks. The mobile panel is compact but all three sliders, their labels and percentages fit without overlap.

**Hair is present and follows the existing stylized inhabitants.** The actual-scene inspection shows dark fitted caps, longer rounded styles and a tied-back silhouette rather than the uniformly bare heads. The geometry sits on the heads without obvious floating gaps or penetration in the inspected frame. At the normal balcony distance most heads occupy only a few pixels, so hairstyle detail is understandably modest. These are simple low-poly hair shapes, not realistic strands or detailed human characters; the result is appropriate to the existing pedestrian models but should be described accordingly.

**Moving circuit lights are readable at the production distance.** Across the native night samples, short bright packets occupy different positions along the plaza's fixed cyan and warm circuit traces. The effect is particularly legible along the foreground trunk and the branches around the central processor. The base board remains steadily illuminated, which keeps the circuit layout legible while the packets provide activity. Walkers and the train also change position without the whole board flashing together. The still sequence supports visible distributed movement; uninterrupted progression between every sampled instant is established by the runtime checks rather than inferred from these five frames alone.

**The changes remain integrated across the inspected conditions.** Night has sharp localized boards and strong circuit contrast; evening and morning are softer; rain adds visible precipitation and a brighter, hazier daytime field. The mall retains its identity in all four. No new obvious clipping, floating retail board, displaced building edge or rail obstruction appears in the production captures.

## Scope and limits

This acceptance covers the requested revision 26 features in the inspected production and inspection views. It is not a new whole-city realism grade, a photorealism claim, a detailed hair assessment from the balcony, or independent validation of all weather combinations. The closer mall inspection still exposes the established simplified geometry and blurred background imagery, and the skyline remains repetitive. Those limits remain visible but do not prevent the requested features from reading clearly in the intended balcony view.

Revision 18 remains **7.3/10, not accepted**, with its three whole-city rounds exhausted. Revisions 19, 20 and 21 remain **8.2/10**, revision 22 remains **8.4/10**, and revisions 23 and 24 remain historically **8.2/10** for their scopes. Revision 25 round 1 remains **7.6/10, not accepted**, followed by round 2's **8.1/10 scoped acceptance**. This **8.2/10 revision 26 scoped acceptance** does not replace or rewrite those records.
