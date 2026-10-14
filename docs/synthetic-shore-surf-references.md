# Synthetic Shore: surf and swimming references

User request, 6 September 2026: research realistic shore wash, give the immersive
beach the same joined outline as Lab Island, and allow surface/underwater swimming
like the local MizuTopia project.

## Footage and coastal research

- [USGS, Wave runup during Tropical Storm Colin at Madeira Beach, Florida](https://www.usgs.gov/media/videos/wave-runup-during-tropical-storm-colin-madeira-beach-florida-0), 6 June 2016. Viewed the public-domain 21-second clip in the browser. The advancing front has an irregular scalloped edge; after recession, the same area is largely exposed wet sand with fine, stretched foam traces. This is a storm example, so its whitewater coverage is an upper-end reference, not the default calm-weather target.
- [Stockdon and Holman, Observations of wave runup, setup, and swash on natural beaches](https://www.usgs.gov/publications/observations-wave-runup-setup-and-swash-natural-beaches), USGS Data Series 602, 2011, DOI 10.3133/ds602. Video observations span ten field experiments. Used as context for varying runup with wave conditions instead of a single uniform shoreline animation.
- [USGS, Field observations of alongshore runup variability under dissipative conditions in presence of a shoreline sandwave](https://pubs.usgs.gov/publication/70200000), 2018. The observed alongshore variation supports letting local beach shape affect the visible wave fronts.
- [University of Delaware, Master's Project Update](https://coastal.udel.edu/2019/12/03/masters-project-update/), 3 December 2019. Field measurements describe a rapid rise in water level during uprush; useful context for an advancing wash followed by a thinner draining phase.

Implementation interpretation: use a narrow broken foam edge over a shallow
water sheet, patches that disperse as the wash retreats, and wet sand that stays
dark and reflective after water leaves. Waves should follow local exposed-coast
orientation and blend into the offshore wave field. These are visual and physical
approximations for the interactive scene, not a coastal engineering solver.

## User-owned source project

`F:/001_YouTopy/NatureSimTopy/MizuTopia/src/main.ts` contains MizuTopia's surface
buoyancy, deliberate Ctrl/Q dive, Space/E ascent, neutral underwater buoyancy,
look-directed movement, and seabed clearance. `underwater.ts`, `ocean.ts`, and
`coast.ts` provide the optical reference. The island's existing dry-land movement
and venue interactions remain the land-control baseline.

The canonical beach outline belongs in one shared module so island geometry,
immersive terrain, shoreline shading, and navigation can agree. The immersive
scene uses metres and a presentation scale; matching the outline does not imply
duplicating the entire editable island at full resolution.

## 1 October 2026: close wave and recession correction

The new reference screenshot showed fine repeating marks covering an incoming
wave. Source review also found a logarithmic ocean grid growing beyond two-metre
cells only twenty metres from the eye, rapid alongshore phase perturbations, and
a spatially uniform shallow sheet blended into a travelling crest.

Research checked for this correction:

- [NOAA, Waves](https://oceanservice.noaa.gov/education/tutorial_currents/03coastal1.html): waves steepen and become unstable as they approach the bottom. This supports concentrating fresh foam on breaking shoulders.
- [NOAA, Longshore Currents](https://oceanservice.noaa.gov/education/tutorial_currents/03coastal2.html): depth and coastline shape affect wave approach, and nearshore flow moves up and down the beach as a sheet. This supports local coast orientation and connected shallow water.
- [Fisheries and Oceans Canada, Shallow-Water Waves, chapter 8](https://waves-vagues.dfo-mpo.gc.ca/Library/487-12.pdf): shallow-water celerity is `sqrt(g D)`. The new phase integrates its reciprocal along the sloping shelf so crests slow and their spacing contracts shoreward.
- [USACE, Final IEPR Report, armoring study](https://www.mvn.usace.army.mil/Portals/56/docs/PD/PeerReview/ArmoringFinalIEPRReport.pdf): the depth-limited breaker parameter depends on slope and site features; a typical range given is 0.5–0.78. This scene uses 0.78 to place a broad visual breaking zone, rather than presenting it as a universal exact threshold.
- [University of Delaware, Master's Project Update](https://coastal.udel.edu/2019/12/03/masters-project-update/): measured storm uprush rises rapidly; the backwash thins enough to fall below sensors. Together with the existing USGS runup observations, this motivates a quicker advance, thinning recession, and exposed wet sand. The storm velocities are not used as calm-weather tuning values.

Implementation: one shared travelling wash controls the water sheet, foam flow
and wetness history. Small fixed scallops replace rapidly oscillating wash
fingers. Fresh whitewater is concentrated near the crest and its trailing foam
decays; fine noise octaves and pore detail fade below the pixel footprint. A
sine-free hash avoids precision banding. Fragment water depth uses the analytic
surface instead of triangle-interpolated heights, and a denser camera-centred
grid resolves the visible surf within approximately one metre in balanced mode
and two metres in low mode. The distant ocean retains sparse geometry.

The 8.4-second period, 0.32 m effective bore depth, wash envelope and foam
coefficients are tuned approximations. This is a continuous height-field surf
renderer with coherent buoyancy, not a mass-conserving fluid solver or a model
of overturning barrels. Agreement between CPU and GPU verifies implementation
consistency, not independent agreement with measured beach data.

Reproduce the focused verification with the dev server running:

```powershell
npm run test:shore-realism
```

It compares the actual GPU shader against CPU surface, slope, foam and wetness
sampling at 1,360 points across calm, small, normal and storm heights; checks
analytic gradients independently with finite differences; samples connected
water 498,240 times across complete cycles; checks cover/uncover on sand; and
captures 32 labelled frames each for daylight wash and sunset wading. Shader
time is fixed explicitly for each labelled capture because the live runtime
clock deliberately does not rewind.

On the final implementation: maximum height disagreement 0.00691 mm, maximum
slope disagreement 0.00000149, maximum foam-channel disagreement 0.00000911;
all connected-water and wet/dry checks passed. The tuned cycle advances for
2.958 s and drains for 5.442 s. Production build, nine curved-coast surf probes,
underwater captures and the surface/dive/ascent/return swimming regression also
pass with no browser or shader errors. Visual evidence and measurements are in
`output/shore-realism/final`; `wave-cycle.html` provides a fixed-camera animation
and phase slider. Running the focused script without an output override writes
the same viewer and measurements to `output/shore-realism/proof`.
