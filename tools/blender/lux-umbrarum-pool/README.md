# Lux Umbrarum Pool Commons

An original, editable reconstruction of the user's indoor-pool reference, subsequently widened and furnished with suspended pods at the user's request. The room is approximately 21.6 × 16.6 m, with a 6.4 m ceiling and an 11.2 × 7.2 m basin recessed 1.6 m. Dimensions and areas outside the photograph are inferred. The real-time rendition reproduces the reference's principal objects and composition; it is not a pixel-identical photographic reproduction.

## Source and generation

`create_pool_commons.py` builds the tiled basin and deck, three real arched window openings, ivory paneling and a flat coffered ceiling, seven retrofuturistic canvas loungers, towels and books, two recessed libraries, olive trees, marble bust, Art Deco wall instruments, and a mechanical brass diving platform. The three ceiling arch ribs and their spring capitals were removed at the user's request. The loungers occupy all four sides of the pool and have pearl shell edging, platinum cantilever frames, wood inlays, brass reclining controls, padded armrests and neck bolsters. Five physical brass steps and a landing lead onto the board; a separate metal ladder has five rungs for leaving the water. `suspended_pods.py` builds two 2.8 m long open ellipsoidal reclining seats, with pearl enamel shells, upholstered cushions, brass rims and platinum double-helix chains above and below. All nine seats point toward the pool's centre. `model_helpers.py` supplies local modeling primitives. Seed 41026 keeps reconstruction reproducible. Generated texture maps are local PNGs; no paid generation service is required. Windows Times is used for geometric dial and book lettering and packed into the editable blend.

The existing isolated Blender MCP bridge was used, preserving the user's GUI scenes. A standalone background Blender invocation also works:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --python tools/blender/lux-umbrarum-pool/create_pool_commons.py
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background tools/blender/lux-umbrarum-pool/lux-umbrarum-pool-commons.blend --python tools/blender/lux-umbrarum-pool/render_pool_views.py
```

The editable blend retains individual modeling parts and a presentation rig. The self-contained `public/apartments/assets/lux-umbrarum-pool-commons.glb` excludes presentation cameras, lights and editable duplicates. Eleven generated 1K PNG maps are embedded. The flat-ceiling instrument version has 658,676 triangles, 32 material primitives, 5,402 editable parts and 33,725,548 bytes; `asset-report.json` records the current counts. Three clock hands remain separate pivoted meshes for live animation. The generator enforces limits of 750,000 triangles, 40 primitives and 40 MiB before publishing the GLB atomically.

## Integration

`src/apartments/poolCommons.ts` loads the asset through the room's readiness and loading-error flow, exposes its identity and loaded state in the scene snapshot, and disposes resources on departure, including late load results. Furniture has colliders, with a continuous walking route around the deck and into the approach corridor. The outdoor lawn starts beyond the rear wall, preventing its previous green overlap with the water.

`poolNavigation.ts` supplies room-local gravity, jumping, stair/board support, surface buoyancy, submerged swimming, basin boundaries and a ladder exit. Use **WASD / arrows** to walk or swim, **Space** to jump, and hold **C** to dive. At the front-left pool ladder, **Space** climbs out. Walk up the brass access steps to the diving board, then jump toward the water. Touch devices have movement, Jump and Dive buttons. Choosing a guide viewpoint resets navigation safely. Other rooms retain their existing walking behavior.

`poolSplash.ts` pools up to three short entry effects: instanced ballistic water droplets, a rising crown and expanding fading ripples. Splash strength follows the falling speed. Water is rendered on both sides, with blue fog when submerged. Snapshots expose navigation mode, board state, depth, entry count and active splash effects. Instrument controls remain decorative.

The wall ensemble has four defined readouts: the large upper Roman-numeral clock follows the viewer's local device time, including separate hour/minute/second hands. Lower-left pressure shows **1013 hPa** on a 950–1050 hPa scale. Lower-middle **O₂ concentration** shows **20.9 vol.%** on a 0–25% scale. Lower-right **CO₂ concentration** shows **600 ppm** on a 0–2000 ppm scale. The three environmental values are illustrative room readings, not sensor measurements. Their units, values and calibrated needles are authored into the asset and exported in layout metadata; the local clock value and time zone appear in the live snapshot. The four small shield accents are decorative brass rosettes.

The route is `room.html?id=lux-umbrarum-pool-commons`, under **Interiors → Lux Umbrarum Student Spaces**, alongside the existing shared lounge. The directory has 103 rooms, including two shared spaces.

## Verification and comparisons

Run `node scripts/pool-commons-smoke.mjs` with the development server on port 5178. Eleven check groups cover the expanded hall and pool, nine inward-facing seats, the directory and editing, all eleven viewpoints, walking and water entry, mobile presentation, missing-asset recovery, disposal and departure during a delayed load. `node scripts/pool-swimming-smoke.mjs` exercises real keyboard and touch controls for edge jumps, swimming, diving/resurfacing, basin containment, ladder exits, board climbing/jumping, splash emission and expiry. `node scripts/pool-instruments-smoke.mjs` verifies the flat ceiling, four dial definitions, controlled local-time changes and physical clock-hand orientation. The production build is `npm run build`; `node test-artifacts/lux-umbrarum-pool/production-check.mjs` runs all three suites against the packaged build.

Evidence lives in `test-artifacts/lux-umbrarum-pool/`: `comparison.html`, successive Blender and actual-browser renders, `geometry-audit.json`, smoke results and bundled web-game client captures. Comparisons led to corrections to the wall carrying the gauges, the central fanlight, broad plaster arches, brass shading, rounded railings, instrument-frame clearance and walking routes. The directory thumbnail is an actual rendered room view, not the supplied photograph. Existing shared-lounge, private-room and catalog regression checks also passed.
