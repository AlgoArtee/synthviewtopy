# Revision 4 — filigree ghosts in flowing long dresses

User direction: both cyan and pink holograms become delicate ghostlike figures with long dresses moving as if in the wind, flowing and hypnotic. This text replaces the former rigid human-hologram silhouette; the seventh city reference remains the target for the surrounding city. The accepted revision-3 scene and its review records remain preserved.

## Implemented visual and motion design

The figures have slender translucent heads/necks and softly posed arms, continuous full-length gauze gowns, an offset inner silk layer and open trailing shoulder veils. Fine curved luminous filaments replace the triangular wire lattice. Hair ribbons and fading hems complete the spectral outline. The cyan figure stays right and the pink figure stays left, with both heads below the upper bridge.

Wind travels down the dress in several slow waves, increasing toward free hems; the bodice stays anchored. Veil and hair use offset phases and strengths. Gentle floating sway uses longer periods. No hard time reset or opacity strobe is used. Decorative movement freezes under reduced-motion preferences.

## Actual runtime evidence

Immutable graded capture directory: `test-artifacts/north-city/revision-4/pass-1/`.

- Six principal room/city views, six weather states and mobile ghost view.
- `ghost-motion.webm`: normal-speed 26.208-second canvas recording.
- `ghost-motion-close.webm`: cropped version of the same recording, with timing retained.
- `ghost-motion-contact.jpg`: six close-up samples around four seconds apart.
- `motion-1.png` through `motion-6.png`: actual wall-time-separated full-view screenshots.
- `hologram-results.json`: readiness, figure style, changing dress probe/sway values, weather/mobile checks, and errors=[].

Build, finite geometry and exterior boundary checks pass. The final unique triangle count is 1,103,257, below the 1.2M target; the instance-expanded scene count is 1,444,479. Reduced-motion snapshots remain identical while weather and collapsed/restored controls work. These tests do not establish realism.

## Independent acceptance

Formal review **1/3: 8.2/10, accepted**. Fixed rubric: construction 1.90/2, lighting 1.55/2, materials 1.50/2, fidelity 2.00/2.5, composition 1.25/1.5. The independent report is `revision-4-review-1.md`. Two permitted checks remain unused. Previous revision scores are preserved and are not reused as this revision's grade.

The reviewer found both figures readable as delicate translucent ghosts with full-length gowns, clear heads below the bridge and city details visible through the cloth. Separated motion samples show asymmetric, independently changing hems and veils rather than rigid rotation alone. The reviewer did not directly play the WebM; temporal continuity was inferred from sampled frames and recorded cloth/sway states.

Remaining limits: city cables obscure parts of both midsections, fine filigree can appear grainy at distance, faces and anatomy remain abstract, and snow/fog deliberately reduce visibility (heavy fog can almost hide the figures). The cloth uses authored vertex waves, not physical fabric simulation. Previously documented city, road and interior realism limits remain.
