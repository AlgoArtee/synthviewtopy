# Synthetic Shore effect sources

The effect modules in this directory are ported from the user's local project
`F:/001_YouTopy/NatureSimTopy/MizuTopia/src`:

- `celestial.ts`: Cygnus X-1's companion star, corona, stellar-wind threads,
  accretion disk, orbital shear, Doppler brightness, and lensed photon ring.
- `ocean.ts`, `shore.ts`, `simulation.ts`: shared wave, bathymetry, surf, foam,
  wetness, and water lighting calculations.
- `coastShaders.ts`: textured sand and wet-shore shading.
- `atmosphere.ts`: coastal sky and clouds.
- `reflections.ts`, `types.ts`: water reflection and effect types.

`../syntheticShoreEffects.ts` adapts MizuTopia's offshore +X axis to -Z, recolors
the sand to silver with sparse mica highlights, creates graded ocean geometry,
and supplies bounded reflections. The separate scene uses metres; the island
editor uses ten metres per world unit. Celestial animation code is retained,
including its eight-second corona and ten-second stellar-wind cycles. No remote
assets or additional dependencies are required.

The integration deliberately leaves MizuTopia's unrelated gameplay and giant
wave controls inactive. Water, sand, camera, and reflection coordinate transforms
share the same reference frame. Call `dispose()` when leaving the scene.

The coastline now follows `../syntheticBeachLayout.ts`, also used by the island
pier. A cached field describes distance and direction to the exposed coast;
CPU navigation and water buoyancy use the same sampling convention as the GPU.
The seabed continues below the water for swimming. Surf, foam, and wetness use
local coastal distance rather than assuming a straight waterline.

The swimming integration follows MizuTopia's surface float, intentional dive,
neutral underwater buoyancy, ascent, and floor clearance. The current visual
references and interpretation are recorded in
[the surf research notes](../../../docs/synthetic-shore-surf-references.md).
