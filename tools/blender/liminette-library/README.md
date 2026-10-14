# Liminette ivory reference library

This replacement for Liminette's original three dark bookcases follows the
user-supplied ivory library photograph. It includes two built-in shelves with
pale clothbound books, carved pilasters and cornices, a brass ladder, a dark
convex television, twenty detailed vacuum valves, opal globe sconces, a six-lobe
boucle sofa-bed, a huge draped cable-knit blanket, a faded blue and cream rug, a white side
table and window-sill books, botanical vitrine, jar and globe.
The foreground white writing table includes papers, a green banker lamp and a
brass microscope; a small drawer cabinet finishes the opposite window end.

`create_library.py` is the deterministic Blender 5.1 generator. It creates an
isolated scene, retains the other Blender scenes, bakes surface details to local
PNG files, packs them in `liminette-ivory-library.blend`, and embeds them in
`public/apartments/assets/liminette-ivory-library.glb`. Editable components are
kept separately from meshes grouped by material. Cameras and presentation
lights are excluded from the export. `render_library.py` renders the overview,
wall, front/rear sofa, single window and valve close-ups for reference comparison.

Run through the existing isolated official Blender MCP bridge:

```powershell
.\.runtime\blender-mcp-python\Scripts\python.exe tools/blender/liminette/mcp_asset_client.py --code-file test-artifacts/liminette-library/mcp-generate.py
.\.runtime\blender-mcp-python\Scripts\python.exe tools/blender/liminette/mcp_asset_client.py --code-file test-artifacts/liminette-library/mcp-render.py
```

The ensemble is mounted on the west wall at (-10.91, 0, -4.8), rotated +90°
about Y. Its single walnut-and-brass corner window contains an actual arch aperture and
shares the apartment's existing courtyard. The north structural wall has a
matching opening; nearby dark beams and trim clear the new architecture.
Dimensions and hidden geometry are inferred from a single photo. The shared
outdoor world, real-time lighting, and the rest of the existing apartment differ
from the reference photograph.

`referenceLibrary.ts` owns loading, metadata, furniture colliders and exact-once
resource release. Loading participates in room readiness and lighting/geometry
capture. A failed GLB uses the existing room error view, and a load completed
after departure is released without attaching objects. The room guide includes
an overview and a television/valve view; desks retain their existing placement.

The follow-up sofa is 4.66 m wide × 2.22 m deep, moved 1.85 m away from the
television. The seated viewing distance is about 4.15 m. The 2.92 m wide wool
blanket has a thick fabric substrate, soft folds, interlaced raised stitches,
rolled hems and baked yarn detail. It follows the actual upholstery surfaces,
then pools on the rug. The window matches the original adjacent 2.16 m arch,
walnut sill/wainscot and brass tracery. Library walls and ceiling remain ivory.

Budget: at most 450,000 triangles, 32 material primitives and 30 MiB. Current
statistics are recorded in `asset-report.json`. The comparison and captures are
under `test-artifacts/liminette-library/`.

Current export statistics are in `asset-report.json`. Development and packaged
checks include the clear viewing aisle, the moved/expanded sofa collider, all
guide departures, phone layout, error recovery and exact-once disposal. The
Blender audit checks one open arch, filled obsolete window apertures, enlarged
sofa bounds, floor clearance and blanket/sofa intersection. Repeated visual
comparisons are in `comparison.html` and `comfort-comparison.html`; the directory
preview is captured from the actual room.

Final follow-up export: 445,569 triangles, 25 material primitives, twelve
embedded PNG maps, 2,830 editable components and 30,443,660 bytes. Nine
development and eight packaged library check groups, fifteen apartment checks
in each environment, the production build, original bundled action client and
Blender geometry audit pass. Packaged GLB/thumbnail bytes match the published
files and the 1600×1000 directory image decodes correctly.

```powershell
node scripts/liminette-library-smoke.mjs
node scripts/liminette-astronomy-desk-smoke.mjs
$env:APARTMENTS_SCOPE='room'
node scripts/apartments-smoke.mjs
npm run build
```
