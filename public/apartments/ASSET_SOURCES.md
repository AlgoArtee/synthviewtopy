# Apartment material asset sources

## Liminette ivory library

`assets/liminette-ivory-library.glb` is an original Blender reconstruction guided
by the user's supplied ivory library photograph and subsequent sofa/window requests. All upholstery, brass, plaster
and rug maps are generated locally, packed in the editable blend and embedded
in the GLB. Source and generator: `tools/blender/liminette-library/`. Reference
photos remain comparison evidence and are not used as room textures. The new
single walnut-framed corner window shows the existing three-dimensional Academic District outlook.
`liminette-preview.jpg` is captured from the implemented ivory library view.

## Lux Umbrarum Pool Commons

`assets/lux-umbrarum-pool-commons.glb` is an original Blender reconstruction guided by the user's supplied indoor-pool photograph. Its eleven embedded 1K PNG maps are generated locally by `tools/blender/lux-umbrarum-pool/create_pool_commons.py`; the editable source and generator are retained in that directory. The photograph is reference evidence only and is not distributed as the room's preview. `pool-commons-preview.jpg` is captured from the implemented room. This asset is separate from the downloaded Poly Haven material sets documented below.

Downloaded 2026-09-07 from the Poly Haven asset API and official download host. These six texture sets are released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/), as documented by the [Poly Haven asset license](https://polyhaven.com/license). The license permits redistribution with this project. The images are stored locally; the running apartment makes no requests to Poly Haven.

The 18 JPEG maps total **13,709,702 bytes (13.07 MiB)**. Every downloaded file matched the byte size and MD5 provided by the source API. [materials/manifest.json](materials/manifest.json) records original download URLs, authors, physical dimensions, MD5 and SHA-256 hashes. Original source JPEGs are unchanged.

## Material conventions

Base-color maps use sRGB; roughness and OpenGL normal maps use linear data interpretation. All texture sets use repeat wrapping and mipmaps. One geometry UV unit means one metre, with texture repeats derived from the photographed patch dimensions. `setMetricUVs()` projects custom box/rounded-box geometry in its local metric coordinates. `enableWorldSpaceUV()` projects scaled instances after their instance and world transforms, keeping architectural grain and floorboards at a consistent physical size. Apply only one of those approaches; the world-space shader overrides existing UVs. Curved, tailored upholstery may use its own metric UVs.

Normal maps perturb shading only; these surfaces do not displace geometry. Metallic brass and glazed ceramic are authored physical materials without downloaded maps. The `oak` material name is a warm wood accent tint of the walnut scan, not a separate oak photograph.

## Smoked Walnut Veneer

Source: [Smoked Walnut Veneer](https://polyhaven.com/a/smoked_walnut_veneer) · [file API](https://api.polyhaven.com/files/smoked_walnut_veneer)

Authors: Jenelle van Heerden (All).

Walnut furniture, shelves and dark joinery. Warm/dark variations use a material tint over the same original maps. Source patch: 1.000 × 1.000 m; the room uses a 0.65 m repeat for finer cabinet grain.

| Local file | Map | Resolution | Bytes |
| --- | --- | --- | ---: |
| [smoked_walnut_veneer_basecolor.jpg](materials/smoked_walnut_veneer_basecolor.jpg) | basecolor | 1k | 534,484 |
| [smoked_walnut_veneer_normal.jpg](materials/smoked_walnut_veneer_normal.jpg) | OpenGL normal | 1k | 366,348 |
| [smoked_walnut_veneer_roughness.jpg](materials/smoked_walnut_veneer_roughness.jpg) | roughness | 1k | 408,443 |

## Herringbone Parquet

Source: [Herringbone Parquet](https://polyhaven.com/a/herringbone_parquet) · [file API](https://api.polyhaven.com/files/herringbone_parquet)

Authors: Jenelle van Heerden (Processing); Sergej Majboroda (Photography).

Oiled timber floor. Base color is 2048 px; normal and roughness maps are 1024 px. Source patch: 3.400 × 3.400 m.

| Local file | Map | Resolution | Bytes |
| --- | --- | --- | ---: |
| [herringbone_parquet_basecolor.jpg](materials/herringbone_parquet_basecolor.jpg) | basecolor | 2k | 3,482,793 |
| [herringbone_parquet_normal.jpg](materials/herringbone_parquet_normal.jpg) | OpenGL normal | 1k | 373,438 |
| [herringbone_parquet_roughness.jpg](materials/herringbone_parquet_roughness.jpg) | roughness | 1k | 515,202 |

## Brown Leather

Source: [Brown Leather](https://polyhaven.com/a/brown_leather) · [file API](https://api.polyhaven.com/files/brown_leather)

Authors: Rob Tuytel (All).

Aged brown leather upholstery. Small-scale normal detail follows the 0.4 m photographed patch. Source patch: 0.400 × 0.400 m.

| Local file | Map | Resolution | Bytes |
| --- | --- | --- | ---: |
| [brown_leather_basecolor.jpg](materials/brown_leather_basecolor.jpg) | basecolor | 1k | 503,348 |
| [brown_leather_normal.jpg](materials/brown_leather_normal.jpg) | OpenGL normal | 1k | 863,280 |
| [brown_leather_roughness.jpg](materials/brown_leather_roughness.jpg) | roughness | 1k | 686,142 |

## Velour Velvet

Source: [Velour Velvet](https://polyhaven.com/a/velour_velvet) · [file API](https://api.polyhaven.com/files/velour_velvet)

Authors: colormass (Photography); Rico Cilliers (Processing).

Velvet upholstery and curtains. The fragment shader retains the original scan’s luminance variation while dyeing it bottle green; the downloaded maps remain unmodified. Source patch: 0.284 × 0.273 m.

| Local file | Map | Resolution | Bytes |
| --- | --- | --- | ---: |
| [velour_velvet_basecolor.jpg](materials/velour_velvet_basecolor.jpg) | basecolor | 1k | 735,556 |
| [velour_velvet_normal.jpg](materials/velour_velvet_normal.jpg) | OpenGL normal | 1k | 695,985 |
| [velour_velvet_roughness.jpg](materials/velour_velvet_roughness.jpg) | roughness | 1k | 943,960 |

## Cotton Jersey

Source: [Cotton Jersey](https://polyhaven.com/a/cotton_jersey) · [file API](https://api.polyhaven.com/files/cotton_jersey)

Authors: colormass (Photography); Rico Cilliers (Processing).

Cream cotton bed linen and cushions. Fine knit structure is kept at its photographed physical scale. Source patch: 0.264 × 0.264 m.

| Local file | Map | Resolution | Bytes |
| --- | --- | --- | ---: |
| [cotton_jersey_basecolor.jpg](materials/cotton_jersey_basecolor.jpg) | basecolor | 1k | 581,360 |
| [cotton_jersey_normal.jpg](materials/cotton_jersey_normal.jpg) | OpenGL normal | 1k | 678,670 |
| [cotton_jersey_roughness.jpg](materials/cotton_jersey_roughness.jpg) | roughness | 1k | 865,264 |

## White Plaster 02

Source: [White Plaster 02](https://polyhaven.com/a/white_plaster_02) · [file API](https://api.polyhaven.com/files/white_plaster_02)

Authors: Rob Tuytel (All).

Smooth lime plaster walls and ceiling. Subtle normal strength avoids oversized surface noise; a shader limewash retains 28% of the scan's albedo variation. Source patch: 1.000 × 1.000 m.

| Local file | Map | Resolution | Bytes |
| --- | --- | --- | ---: |
| [white_plaster_02_basecolor.jpg](materials/white_plaster_02_basecolor.jpg) | basecolor | 1k | 527,219 |
| [white_plaster_02_normal.jpg](materials/white_plaster_02_normal.jpg) | OpenGL normal | 1k | 652,310 |
| [white_plaster_02_roughness.jpg](materials/white_plaster_02_roughness.jpg) | roughness | 1k | 295,900 |

## O's City Apartment - North City

The shell, skyline, furniture, textiles, light fixtures, bathroom and kitchen are deterministic geometry authored in `src/apartments/osCityApartment.ts`, `osCityFurnishings.ts` and `osCityGeometry.ts`. Surface noise, weave, wood grain and holographic interfaces are generated in Canvas. Revision 2 also uses the existing Cotton Jersey normal/roughness scans and White Plaster 02 maps documented above. No new remote geometry or image-generation service is used. The city visible through the opening is 3D geometry.

The six original user-supplied reference attachments and seventh rainy-city reference are preserved under `test-artifacts/north-city/references/` solely as design and review evidence. They are not used as scene backdrop textures. `os-city-apartment-preview.jpg` is a capture of the implemented Three.js apartment.

Revision 3 adds `osCityExterior.ts` and `osCityLife.ts`: authored batched facades, a Canvas sign atlas and window interiors, instanced cars and pedestrians, modeled holographic figures, and locally generated steam/reflection masks. The new city image is not used as a background texture. No new external assets or paid services are involved.

Revision 4 adds `osCityHolograms.ts`: authored draped gowns, veils, hair ribbons and luminous curved embroidery, with custom spectral and wind shaders. All shapes and effects are generated locally; no new images, remote assets or paid services are used. Runtime videos and stills are captured directly from the implemented scene.

### North City revision 5 — square sleeping alcove and engraved ghost faces

The 8.55 m square mattress/alcove, adjusted cloth relaxation lattice, shared human-size pillow rows, arched structural opening, cove lights and sculpted ghost faces are authored locally in the Three.js source. The crowd uses car-calibrated proportional scale. No new remote assets, reference backdrops, paid services or generated meshes are introduced. Actual loaded-runtime captures remain in `test-artifacts/north-city/revision-5/`.

### O’s City Apartment — panoramic revision 6
Full-wall glazing, west-wall optical TV rail, animated aurora/ocean shader artwork, six unique oversized down pillows and six lateral city blocks are locally authored Three.js geometry/shaders. Existing stored cotton/plaster scans retain their earlier credits. No new external image, mesh, paid service or third-party media was added.

### O’s City Apartment — filled bedding revision 7
The large closed white down duvet, asymmetric filled turnback, sewn cotton perimeter and four-pillow east-wall arrangement are locally authored Three.js geometry. The duvet reuses the existing credited cotton normal/roughness scans; no external media or paid assets were added.

### O’s City Apartment — oversized gathered duvet revision 8
The oversized, asymmetrically gathered down duvet, irregular partly rolled corner, compressed pillow contact patches and hanging open-foot edge are locally authored in `src/apartments/osCityDuvet.ts`. The geometry reuses the existing credited cotton scans and contains no new external image, mesh or paid assets.

### O’s City Apartment — wall-fitted bedding revision 9
The wall-fitted duvet boundaries, softly lowered folds beneath the TV and bedside-clear hanging corner are locally authored modifications to the existing cotton geometry. Mattress and fitted-sheet bevels are reduced to 3 mm at their existing square dimensions. No additional external or paid assets were added.


### North City revision 10 — expressive spectral portraits

Two original adult East Asian feminine portraits, iris shaders, sculpted eyelids/lips/cheeks, crescent temple filigree, head pivots and blink morph targets are authored locally in `src/apartments/osCityGhostFace.ts` and `osCityHolograms.ts`. No real person likeness or external facial image was used. Independent blink intervals, slow head yaw/nod/tilt and existing wind-driven gowns share the runtime elapsed time and respect reduced motion. Actual production-room captures and live motion clips are in `test-artifacts/north-city/revision-10/`. No paid service or generated remote mesh was used.


### North City revision 11 — reference-derived photographic hologram faces

`holograms/reference-portrait-atlas-v11.png` is a 1536 x 1024 RGBA open/closed portrait atlas generated with the built-in imagegen tool using the user-provided cyan female hologram reference. The native transparency is preserved. The full prompt and source are recorded in `docs/north-city/revision-11-portrait-asset.json`. The atlas is mapped onto authored facial relief, real closing aperture/lid meshes, and softly faded neck/shoulders; it is not a city or room backdrop. Central facial depth prevents background AO/signs from overwhelming the face; hair and edges retain transparency. Head pivots, independent blink rhythms and wind-driven gowns remain real runtime animation. This revision supersedes revision 10's entirely procedural face construction. No external mesh service or deployment was used. Final evidence is captured from the actual production apartment renderer.

## Revision 18 balcony skyline reference (2026-10-13)

`public/apartments/assets/north-city/balcony-city-reference.jpg` is the original, unmodified third image supplied by the user for this apartment revision (457,050 bytes). The final runtime samples its upper 30 percent on a curved distant skyline matte behind the modeled plaza. Selected clinic, server-hall and bar window regions also texture recessed storefront backplanes; glass, framing, counters and server racks remain dimensional foreground geometry. Balcony construction, circuit plaza, pedestrians, aircraft, precipitation and near architecture are authored scene content. The image is an explicit user-provided reference, not an externally sourced or newly generated stock asset; no third-party license is asserted. Its SHA-256 is recorded with the revision-18 capture evidence.

## Revision 20 skyline and transit correction (2026-10-13)

The historical revision 18 use above is superseded in the current scene: the curved photographic skyline has been removed. Its perspective projection, repeated around a cylinder, distorted buildings and included a distant railway that did not connect to the modeled tracks. Upright authored 3D towers and one continuous modeled maglev circuit now supply the skyline and railway. The original image remains unchanged and is still sampled only for recessed storefront interiors. Train shells, rail structures, sky and weather are authored locally; no new external assets were introduced.

## Revision 29 hybrid balcony skyline (2026-10-14)

`assets/north-city/skyline-r29/unlit-city.png` is a 2172 × 724 RGBA skyline generated with the built-in image tool from the user's latest cyberpunk reference, then edited with that tool to remove the sky and switch off architectural lighting. Native transparency is preserved. `lit-source.png` retains the intermediate artwork for read-only window-location analysis; it is not rendered. `windows.json` contains those normalized placements. The source images were copied without pixel edits. Prompts, modes, saved paths and SHA-256 hashes are documented in `docs/north-city/revision-29-image-provenance.json`.

This revision supersedes the entirely modeled far balcony skyline: about three depth bands retain actual 3D retail buildings and towers; the remaining horizon uses three upright flat image sectors. Separate 3D neon screen instances, architectural light strips and room quads provide active lights and the shared window/shadow/TV controls. The image contains no railway, balcony, weather or readable business signs. Trains, raised continuous rails, plaza, weather and foreground buildings remain modeled runtime content. No third-party stock license or remote mesh service is asserted.

### Data Mall facade reference (2026-10-14)
- File: apartments/assets/north-city/data-mall-reference.png
- Source: image supplied by the user for the Data Mall facade revision. Original retained without image edits.
- Use: selected shop-interior regions behind modeled glazing, floor plates, railings and visitors. The facade, entrance, floor numbering, editable signs and moving circuits are independent 3D geometry/canvas text; the reference's inconsistent level labels are excluded from the interior crops.
