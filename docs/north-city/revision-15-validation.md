# Revision 15 validation

The current request concerns wall-pillow side profiles and the duvet ending at their fronts. The requested visual threshold is 9/10; technical checks below do not earn visual-review points.

- Production `npm run build`: TypeScript and Vite pass. Existing large-chunk advisories remain.
- Actual Chrome runtime: ten focused room viewpoints, entrance, clear/rain/snow duvet captures, three side/contact views in clear and academic rainy dusk, and phone panorama; 22 capture files. No browser errors or phone horizontal overflow.
- Pillow mesh audit: six closed indexed shells, zero nonmanifold edges and positive signed volume. Four wall pillows retain 0.545–0.613 m full side depths, rear pressure areas 1.451–1.652 m² within 12 mm of the wall, and support areas 0.439–0.506 m² below Y=0.661 m. The nominal wall gap is 4 mm. No sampled duvet vertices lie inside any pillow at 2 mm tolerance; inspection cameras remain outside their volumes. This is a vertex penetration check, not exhaustive triangle-intersection proof or dynamic cloth simulation.
- Full room audit: 1,833,986 unique triangles / 2,176,086 instance-expanded triangles; finite geometry; closed duvet; zero duvet wall crossings or nightstand penetrations; all 270 sampled television sightlines clear. Weather, H/chevron collapse and reduced-motion freeze pass.
- Duvet: nominal unfolded cut 9.10 × 9.46 m; measured gathered centre-surface spans 9.170 × 8.264 m. Mean filled thickness 0.246 m; minimum 0.030 m. Head inset approximately 1.33 m; east profile inset up to 0.656 m, occupied by fitted sheet and wall pillows. Blanket meets the uncovered west and south-return walls and hangs over the open foot. Nominal cut dimensions are not its gathered footprint.
- Window clearance: current relaxed west pillow top Y=1.025 m remains below the previously swept opening-sash minimum Y=1.234 m (about 0.209 m vertical clearance). Its X/Z placement and sash geometry are unchanged. The earlier complete sweep is retained at `test-artifacts/north-city/revision-15/window/`; it predates the small sheet-height adjustment and is not represented as a fresh final sweep.

Final capture folder: `test-artifacts/north-city/revision-15/review-3/`. Focused and full geometry reports: `revision-15/geometry-final/`. Build log: `revision-15/build-final.log`. Separate source, capture and validation SHA256 bindings are stored beside this document.

Development contact-rendering diagnostics isolated the old near-coplanar toe facets. Rounded monotone toe compression removes their detached dotted traces; the final room retains its ambient occlusion and shadow rendering. Temporary diagnostic hooks and the temporary runner were removed before final build and capture.

The historical 100-image Snapshot archive has not been regenerated. Its revision-12 images remain a separate saved artifact.
