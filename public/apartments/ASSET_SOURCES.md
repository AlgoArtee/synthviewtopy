# Apartment material asset sources

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
