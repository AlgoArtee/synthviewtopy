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
