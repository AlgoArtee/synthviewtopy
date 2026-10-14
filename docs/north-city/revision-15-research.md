# Revision 15: filled pillow side profiles

The user’s defect screenshot shows a steeply leaning, thin pillow with a large triangular empty space behind it. The latest request asks for rear fill to the wall and for the duvet to stop at the pillow fronts. This supersedes earlier blanket-under-pillow support in these areas.

Primary manufacturer references:

- [QE Home feather Euro pillow insert](https://www.qehomelinens.com/feather-euro-pillow-insert/): a 26 × 26 inch feather-filled cotton insert, photographed upright. Internal visual reference: `test-artifacts/north-city/revision-15/research/qe-upright.webp`.
- [ecolinen feather and down chamber pillow](https://ecolinen.com.au/products/feather-and-down-chamber-pillow): side and stacked product photographs. Internal visual references: `ecolinen-side.jpg` and `ecolinen-stacked.webp` in the same research folder.

Visual interpretation of those photographs: filled pillows have curved front and rear volume, a compressed support footprint, narrow sewn edges, softly yielding corners and unequal short creases around seams and pressure points. The central cloth can remain relatively calm. A thin tilted plate or an evenly thick rigid extrusion does not reproduce this construction.

The apartment keeps its intentionally oversized pillows for the 8.55 m custom bed. The 1.37–1.64 m nominal widths are not claimed to be standard manufacturer dimensions. Reference construction is adapted at that custom scale.

The implementation uses closed Three.js cotton volumes with rounded fill, broad wall pressure and mattress support. Four pillows sit opposite the TV; two relaxed pillows sit near the window. The fitted sheet continues underneath. The actual filled duvet terminates in front of the pillows, rather than placing a decorative line on an unchanged blanket underneath them. Its east boundary follows a measured lower-pillow profile. The mattress and fitted sheet still fill all three bed walls.

Manufacturer photographs are retained only as internal study references and are not shipped as app textures. Cotton microstructure uses the existing credited room material. Geometry is authored deterministically; no dynamic cloth simulation or scanned pillow mesh is claimed.

Independent review reports, actual runtime images, source/evidence hashes and geometry diagnostics are preserved separately under revision-15. The focused 9/10 target does not change the historical whole-room 8.1/10 grade.
