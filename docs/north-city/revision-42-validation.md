# Revision 42 — central-chip hologram mixer

The plaza's central processor now projects the fourteen supplied designs: jellyfish, phoenix, Bremen Town Musicians, Lorelei, rain cloud, partly cloudy, cold, thunderstorm, heat, snowflake, sunrise, noon, sunset and midnight. The source JPEGs are preserved unchanged; `public/apartments/assets/north-city/holograms/README.md` records their provenance.

## Controls and behavior

Open **Plaza holograms** in the apartment controls. Each design has a 0–100% blend slider and Solo button. Master brightness (0–150%), projection size (60–140%), animation, All off and Reset mix apply to the projector. All changes persist in browser storage, with validation and an in-memory fallback if storage is unavailable. Weather and time designs are artwork presets, not live measurements or city-weather controls.

The fixed projection surface is anchored above the central chip at world position `[41.8, -37.31, -5]`, inclined toward the balcony. Looking around does not billboard or rescale it. Additive, depth-tested artwork layers have softly keyed exteriors, animated scanning and subtle depth waves. Batched focusing rings, rising rays and particles connect them to the chip. Blends fade smoothly; reduced-motion preferences freeze ornamental movement. All off fades the whole emitter away, and zero brightness also hides it.

This is an artwork-based light projection within the 3D scene, not fourteen sculpted character meshes. It is intended for the balcony viewpoint. Small reference annotations are not expected to be readable at that distance. Light remains translucent, so the city circuits can be seen behind it. No extra real-time lights or shadow passes are introduced; one active projection adds three draw calls (artwork, lines, particles).

## Verification

- Production build passed: `room-ufJjLMiR.js`. Existing large-bundle advisory only; log saved at `test-artifacts/north-city/revision-42/build.log`.
- Isolated WebGL suite: 25 checks passed, all fourteen textures loaded, no browser or shader errors. Covers every Solo, multiple simultaneous layers, fixed world orientation across viewpoints, pause/resume, reduced motion, persistence in a new instance, invalid input, limits, All off and brightness zero. Evidence: `test-artifacts/north-city/revision-42/preflight/`.
- Full-room native suite: 24 checks passed and 20 screenshots captured against frozen projection source. Covers chip origin, all presets, independent blend sliders, animation controls, keyboard range adjustment without camera movement, All off, 390px mobile layout, loaded assets and storage. No browser/WebGL errors. Final evidence: `test-artifacts/north-city/revision-42/native-final/`; the initial `native/` captures are preserved for review history.
- Live in-app checks confirmed the new controls, cold design, jellyfish and phoenix in the user's actual room. Browser error log was empty. Final live evidence: `live-cold-final.jpg` and `live-mixer-final.jpg` in the revision-42 evidence directory.
- Original installed `develop-web-game` action client passed after the final shader changes. The repository loader uses the room's asynchronous readiness and installed Chrome. Inspected `bundled-client/shot-0.png` and `state-0.json`: `ready=true`, all fourteen assets ready, default jellyfish active, correct chip origin and no error artifacts.

## Visual review history

Formal round 1 scored **7.1/10, not accepted**. The new figure silhouettes, chip grounding and mixer were effective, but the shader removed pale weather linework and white solar cores. Details and original screenshot paths are preserved in `revision-42-review-1.md`.

The shader now preserves white weather filaments with nearby colored detail, recovers the continuous cold/snow HUD interiors and restores localized sunrise/noon cores while keeping the surrounding paper transparent. These fixes were verified in fresh full-room captures. Formal round 2 scored **8.0/10, accepted**. The full report is `revision-42-review-2.md`. Non-blocking limits remain: bright cold/snow halos, some competition between fine artwork details and the visible circuits, dense appearance when many designs overlap, and small reference labels at balcony distance.

The live user tab is restored to Day/Rain at the main chip/mall balcony view with the mixer open and default jellyfish active. Existing window percentages (35/49/71), sound off at 88%, circuit speed 0.8× and open balcony door are retained. No commit or push is part of this request.
