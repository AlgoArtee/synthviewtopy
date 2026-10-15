# Revision 42 — formal visual review, round 2

**Score: 8.0/10. Accepted at the required threshold.** This is formal round 2 of at most 3 under `src/apartments/AGENTS.md`. Round 1 remains recorded as **7.1/10, not accepted**, with its original screenshots preserved.

The score covers the central-chip artwork projections, emitted-light treatment, blending appearance and mixer layout. It does not regrade unrelated city features or claim that the artwork figures are volumetric sculptures.

## Evidence and capture identity

Actual full-room screenshots inspected under `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-42/native-final/`:

- `day-jellyfish.png`, `night-jellyfish.png`, `night-phoenix.png`, `night-bremen.png`, `night-lorelei.png`
- `night-rain.png`, `night-clouds.png`, `night-cold.png`, `night-storm.png`, `night-heat.png`, `night-snow.png`
- `night-sunrise.png`, `night-noon.png`, `night-sunset.png`, `night-midnight.png`
- `mixed-jellyfish-snow.png`, `all-off.png`, `mixer-desktop.png`, `mixer-mobile.png`

Additional actual in-app captures inspected:

- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-42/live-cold-final.jpg`
- `F:/001_YouTopy/SynthViewTopy/test-artifacts/north-city/revision-42/live-mixer-final.jpg`

Comparison references are the fourteen supplied images in `E:/003_Location/O_Apartment/Apartment0_BeforeVinculumStart/plaza_projections/`, mapped in `public/apartments/assets/north-city/holograms/README.md`. Round-1 captures under `revision-42/native/` and the round-1 findings were also used for the before/after comparison. No isolated preview was used to establish acceptance.

The capture report records projection-source SHA-256 `4bf504b49832d64097b91e2b07fc8687e74cbd789a2cc1c93f9171742b94ff96`, which matches the source hash read during this review. `native-final/results.json` records 24/24 passing functional checks and an empty errors list. These are supporting evidence, separate from the visual grade.

## Round-1 findings resolved

1. **Weather symbols now retain their defining linework.** Cold clearly shows the vertical thermometer, bulb, scale, top snowflake and large temperature label. Snow clearly shows the six branching arms against the circular HUD. Rain has a more distinct cloud outline and falling-drop structure. The cold and snow improvements are substantial at the actual balcony distance: they no longer read merely as interchangeable cyan discs. The snowflake also remains distinguishable in the jellyfish/snow blend.

2. **Solar highlights survive the projection conversion.** Sunrise now has a luminous pale-yellow/white half sun where round 1 had a dark notch. Noon retains a bright high core above its downward rays. The warm low sunset disc, low bright sunrise, high golden noon and blue moon/star midnight display remain distinct. No white rectangular source backing has been introduced.

## Regression assessment

- Jellyfish retains a clear bell and long tentacles in daylight haze and at night. Phoenix retains the spread wings and warm/cyan contrast. The Bremen stack and Lorelei silhouette remain recognizable. These figure views do not show a visual regression from round 1.
- All fourteen requested designs are visibly present in the individual captures. Weather and solar variants preserve the principal symbols and color families from the references.
- The displays remain rooted above the central chip, with converging rays and particles tying them to the emitter. Transparent exterior gaps retain the surrounding scene. All off removes the light volume cleanly.
- The mixed capture visibly combines two designs. The stronger snowflake linework makes the second layer easier to identify than in round 1.
- Desktop and narrow-screen mixer labels, sliders, Solo controls, master settings and reset/off actions remain legible and contained within their panels. The in-app daylight mixer capture confirms the same layout in the user's running surface.

## Remaining limitations

- Cold and snow have a broad, bright white/cyan halo. Their symbols now read clearly, but a more restrained halo would better match the fine luminous lines and darker interiors of the references. This is polish, not a blocker for recognition.
- The north circuit remains visible through the artwork. It competes with fine detail in rain and noon, particularly around the central axis. Rain's cloud/drop silhouette is readable, while small individual drops and noon's small label are weaker than the source artwork.
- Small decorative labels in several references are not fully readable from the balcony at the default size. The feature works as a plaza-scale projection, rather than as a close-up information panel.
- Combining several detailed projections produces visual clutter. The two-layer example remains distinguishable, and independent levels/Solo give the user control over that tradeoff.
- The effect is a fixed artwork projection with dimensional emitter effects. It does not provide sculpted parallax within each figure. On narrow screens the open mixer covers much of the scene, although it remains usable and can be hidden.

Static captures do not establish animation smoothness or persistence by themselves; those behaviors are covered by the separately recorded functional checks. No implementation was edited during this review. The two concrete blockers from round 1 have been resolved sufficiently to accept the feature at 8.0/10; no further formal round is required for this version.
