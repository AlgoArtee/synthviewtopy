# Revision 42 — formal visual review, round 1

**Score: 7.1/10. Not accepted.** The apartment review threshold is 8/10, with at most three formal rounds, per `src/apartments/AGENTS.md`.

This review covers the new central-chip holographic projections and their mixer. Existing city rendering outside that feature is not graded. The intended medium is a transparent, fixed world-space artwork projection with dimensional projector rays and particles; it is not being assessed as fourteen sculpted characters.

## Evidence inspected

All images below are captures of the actual running full room, rather than an isolated projection preview. Paths are relative to `F:/001_YouTopy/SynthViewTopy/`.

- `test-artifacts/north-city/revision-42/native/day-jellyfish.png`
- `test-artifacts/north-city/revision-42/native/night-jellyfish.png`
- `test-artifacts/north-city/revision-42/native/night-phoenix.png`
- `test-artifacts/north-city/revision-42/native/night-bremen.png`
- `test-artifacts/north-city/revision-42/native/night-lorelei.png`
- `test-artifacts/north-city/revision-42/native/night-rain.png`
- `test-artifacts/north-city/revision-42/native/night-clouds.png`
- `test-artifacts/north-city/revision-42/native/night-cold.png`
- `test-artifacts/north-city/revision-42/native/night-storm.png`
- `test-artifacts/north-city/revision-42/native/night-heat.png`
- `test-artifacts/north-city/revision-42/native/night-snow.png`
- `test-artifacts/north-city/revision-42/native/night-sunrise.png`
- `test-artifacts/north-city/revision-42/native/night-noon.png`
- `test-artifacts/north-city/revision-42/native/night-sunset.png`
- `test-artifacts/north-city/revision-42/native/night-midnight.png`
- `test-artifacts/north-city/revision-42/native/mixed-jellyfish-snow.png`
- `test-artifacts/north-city/revision-42/native/all-off.png`
- `test-artifacts/north-city/revision-42/native/mixer-desktop.png`
- `test-artifacts/north-city/revision-42/native/mixer-mobile.png`
- `test-artifacts/north-city/revision-42/live-day.jpg`
- `test-artifacts/north-city/revision-42/live-phoenix.jpg`

The fourteen supplied references in `E:/003_Location/O_Apartment/Apartment0_BeforeVinculumStart/plaza_projections/` were compared with the corresponding captures. The filename mapping is preserved in `public/apartments/assets/north-city/holograms/README.md`. Cold, snow and sunrise reference files were additionally opened directly to examine the lost highlights. Isolated preflight captures were not used for the score.

## Required fixes before round 2

1. **Restore the defining white/cyan linework of the weather designs.** The cold thermometer, six-armed snowflake and rain cloud render as similarly filled cyan discs at the actual balcony viewing distance. The thermometer stem and bulb, snowflake branches and cloud/raindrop outlines are much weaker than the references. The original artwork separates bright, nearly white outlines from a darker blue interior. That hierarchy is substantially lost in the current conversion to emitted color. Preserve or reconstruct those bright details while reducing the broad blue fill; do not solve this by increasing the brightness of the entire disc. Validate cold, snow and rain individually against the busy plaza background. Partly cloudy and thunderstorm remain identifiable from their yellow symbols, but should benefit from the same improved cyan-outline separation.

2. **Preserve the sun core in sunrise and noon.** Sunrise has a dark semicircular notch at the center of its rays where the reference shows a luminous white/yellow half sun. Noon has a bright orange field but loses the high white/yellow sun disc. White subject highlights must survive without bringing back the white rectangular source background. Use subject-aware highlight treatment or localized core treatment rather than applying a blanket white-background removal rule to those regions. Validate that sunrise, noon and sunset remain visibly distinct.

## Secondary recommendation

The north branch of the plaza circuit is visible through the middle of every projection and often has stronger contrast than the projection's own fine linework. Transparency is appropriate, but the current weather fill and faint subject lines let the circuit become the dominant shape. Improving the subject-to-fill contrast above is the preferred first fix. Retain the sense of emitted light and avoid turning the projection into an opaque poster.

## What is working

- The jellyfish, phoenix, stacked Bremen animals and Lorelei are readily recognizable and closely preserve the supplied silhouettes. The phoenix's warm center and cyan wing tips are particularly effective.
- The jellyfish remains visible through the daylight haze without a white rectangle around it. The nighttime figures also retain transparent gaps.
- Midnight retains a clear moon, star field and blue/violet circular display. Heat remains recognizable as a thermometer with flame shapes and its large temperature label.
- The emitter is correctly located at the central chip. The converging rays and particles connect the display to the chip; there is no obvious detached support or opaque backing plane. The all-off capture clears the projection.
- The mixed capture shows simultaneous layers. It also confirms why preserving individual symbol contrast matters: the faint snowflake is hard to distinguish inside the stronger jellyfish.
- The mixer clearly exposes per-projection amounts, Solo, master brightness, size, animation, All off and Reset mix. Desktop labels and controls are legible. The narrow-screen panel stays inside the viewport and presents usable controls; it necessarily covers much of the scene while open. No new UI blocker was observed in the captured layouts.

## Limits and next review

Static screenshots establish appearance and visible control layout, not animation smoothness or persistence. The parent implementation's separate functional checks cover those behaviors and are not a substitute for this visual score. No implementation was edited during this review.

Capture new full-room weather and solar views after the two concrete rendering fixes, preserve these round-1 images, then request formal round 2. The accepted character silhouettes, transparent chip grounding and mixer layout should be retained.
