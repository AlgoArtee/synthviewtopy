# Revision 46 — bed-window holograms

Added three adult fictional Japanese women to the north-window street canyon: a kimono fan dancer, a contemporary synth singer and a woman carrying a luminous parasol. The original generated transparent PNGs and exact prompts are stored in `public/apartments/assets/north-city/window-holograms/README.md`.

The projections use fixed exterior positions, centered at world heights 0.6 m, 0.3 m and 1.1 m relative to the apartment floor. The city root's 24 m residence offset is included explicitly, so the figures sit in the bedroom sightline. They are staggered beyond the glazing, 14–40 m from the bed-facing window. Their height ranges from 7.2–11.4 m to read as monumental city projections. Existing street-level ghost figures are preserved.

Rendering uses original alpha, additive emission, depth testing against buildings, distance haze, a subtle cloth displacement and slow light sweep. Sparse rising particles and optical halos accompany the figures. Reduced motion freezes their shared time. All textures join room readiness, and the apartment's existing resource disposal handles materials, geometry and uniform textures; late image loads are safely disposed.

## Evidence

- Production TypeScript/Vite build passes (`room-CmA_dBsB.js`). Existing large-chunk advisory remains.
- Original installed develop-web-game action client passes with `ready=true`, no error artifact. Its startup screenshot and state were inspected under `test-artifacts/north-city/revision-46/bundled-client/`.
- Actual in-app browser captures: `live-bed-day.jpg`, `live-bed-night.jpg`, `live-panorama-day.jpg` and `live-panorama-night.jpg`, under `test-artifacts/north-city/revision-46/`. All three figures are visible from both bed viewpoints, day and night. In-app console has no errors.
- Independent formal review round 1 accepts **8.0/10**; see `revision-46-review-1.md`. Bright existing signs reduce the central parasol figure's contrast at night. This is a documented polish limitation, not a visibility blocker.
- The initial native harness passed asset loading, world placement, original alpha, animation advancement and reduced motion with no browser errors, then tried to open the room guide while controls were hidden. The harness now shows controls first; original evidence is preserved in `native/initial-harness-results.json`.

The corrected native rerun passes all six checks, captures both viewpoints in day/night lighting, and reports no browser or WebGL errors. Final native results and four captures are under `test-artifacts/north-city/revision-46/native/`; the night panorama and daytime bed captures were inspected. No product source was changed for the harness correction. `git diff --check` passes. The user tab remains at the full-wall bed-window view in Day/Rain with controls collapsed. All requested work is complete; changes remain local and uncommitted.
