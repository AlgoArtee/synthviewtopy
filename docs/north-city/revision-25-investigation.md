# Animation visibility investigation

The user's report supersedes the prior product-level acceptance of flicker and TV-window visibility. Revision 23/24 grades remain historical, but their enlarged 7–10 pixel window crops and motion-enabled test contexts did not establish a visible effect at normal viewing size.

The existing user tab was inspected before reload: 951×892 viewport, Evening/Clear, visible document, reduced-motion false, no browser warnings or errors. Trains, pedestrians and aircraft visibly advanced between screenshots. This confirms the shared scene was running; a reduced-motion freeze was not demonstrated in this tab.

Code inspection identified a separate real bug: the room captured the reduced-motion boolean at startup and could continue sending time zero after the preference was disabled. Capped navigation deltas also slowed ambient effects at low frame rates. The corrected live preference and ambient clock retain reduced-motion support and discard time spent in hidden tabs.

Visibility changes extend TV shading to the larger skyline facades, retain deterministic 40% coverage, increase screen light and shadow contrast, and lengthen/deepen independently timed neon dips. Day remains less active. Static geometry, shared maps and existing light counts are retained. Plaza light timing now uses the ambient clock independently of bounded pedestrian movement.

Validation must include native playback at 951×892 with no manual time advancement, fixed whole-scene captures, and startup-reduced-motion → motion-enabled → reduced-motion. Small crops and sampler values are diagnostic only.

## First visual review and correction

The first native run passed 51 functional checks, with 13 normal-size stills, two 12-second recordings, no errors and matching source hashes. Its visual review scored 7.6/10: sign flicker was plainly visible, but static bright interior patterns still overwhelmed the TV shadows. This was not accepted.

The second shader revision replaces steady overhead emission inside selected TV rooms. Broad moving cast shadows traverse most of the interior, with independent screen-scene brightness changes; static diffuse room lighting is subdued. Unselected windows and masonry retain their original lighting. This addresses the review's normal-size contrast finding rather than merely adding brightness. The 40% selection and the clock correction are unchanged. Fresh native evidence is saved separately under final-2; final-1 remains preserved.

## Final visual outcome

Fresh final-2 native captures pass38functional checks at951x892 with no manual time advancement, no browser errors, no source drift and clocks tracking wall time. The startup reduced-motion regression is explicitly reused from final-1 because room.ts is unchanged. Independent round2 inspected all13unscaled frames and accepted the scoped visibility correction at8.1/10. Several larger windows now show readable independent dark/light changes; night is clearest, evening softer and north-facing distant windows remain restrained. This is TV-like interior illumination and shadow activity, not detailed distant silhouettes. Continuous video audition is not claimed; the native clips are retained for playback.
