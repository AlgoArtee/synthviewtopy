# Lux Umbrarum community room

This is an original, editable Blender reconstruction of the user's supplied cream
community lounge reference. The picture supplies visual proportions; dimensions
are inferred. The room measures 14.2 × 12.6 m with a 54 cm deep seating pit and
two broad, curved flights of three 18 cm steps. The continuous horseshoe sofa
follows a recessed oval with 5.25 × 4.25 m radii. Its seat tops sit below the
surrounding terrace. Blender uses Z up; the exported GLB uses Y up,
with north at negative Z.

The scene includes the complete ivory seating ensemble, a three-pedestal oval oak
table and books, a constellation display and reel-to-reel music cabinet, a
circular architectural opening, library, lounge chair and ottoman, open metal
monstera sculptures, and four wire chandeliers with crystal drops. The view
through the opening is actual lake, terrain and Gothic tower geometry.

`create_community_room.py` is the deterministic generator, seeded 62026.
`curved_lounge.py` supplies the curved architecture, upholstery sweeps, actual
recess, stair sectors, room outline and three open corridor approaches. The TV
and hi-fi occupy the angled left side wall; the bookcase occupies the right side
wall. The circular window occupies its own rear wall.
It creates its own scene and preserves other scenes in the Blender session.
`lux-umbrarum-community-room.blend` contains separate editable components,
material-grouped export meshes and a presentation camera and lighting rig.
The seven local PNG maps in `textures/` are generated procedurally, packed in the
blend and embedded in the GLB. No remote or paid assets are required.

The scene was authored and repeatedly refined through the official Blender Lab MCP
bridge, isolated from the user's Blender UI. A fresh background Blender process
produces the final export reproducibly. From the repository root, run:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --factory-startup --python tools/blender/lux-umbrarum-commons/create_community_room.py
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --factory-startup --python tools/blender/lux-umbrarum-commons/render_reference_view.py
```

The generator writes `public/apartments/assets/lux-umbrarum-community-room.glb`
and `asset-report.json`. Cameras, lights and editable duplicates are excluded
from the GLB. Its root extras contain `layout_json`, which the room loader uses
for colliders, bounds, elliptical stairs, floor heights and walkable room/corridor
regions. Eight perimeter samples give visitors body clearance along the angled
walls and through the three exits. Pit edges can only be crossed on the stairs.
Evaluated components merge directly by material, preserving UVs and corner
normals; no slow per-object conversions are needed. The runtime budget is 500,000
triangles, 40 material primitives and 35 MiB; exceeding it fails the generator.
The GLB replaces the published asset only after passing the budget checks.

The browser loader waits before baking reflections and shadows, reports failures
through the room's recovery UI, and releases geometry, materials, textures and
decoded image bitmaps on departure. Pending loads cannot attach after disposal.
The existing private-room routes, editable metadata key and export format remain
compatible. There are 101 private rooms and one community room in the collection.

Validation and actual scene captures are written to
`test-artifacts/lux-umbrarum-community-room/` by:

```powershell
node scripts/community-room-smoke.mjs
```

The directory thumbnail is captured from the actual running 3D room. The reference
image is not substituted for the room or used as a fake preview.

The revised export has **481,928 triangles, 25 material primitives and seven
embedded PNG maps**. The production build and eight focused community checks
cover ten viewpoints, both stair flights, all three exits, furniture clearance, phone layout,
missing-asset recovery, departure during loading and exact-once resource disposal.
The 14 existing private-room checks also pass after the walking-region extension.

Reference comparisons during the revision corrected the original rectangular
seating, flat rear-wall arrangement, overly high/narrow
seats, distant table, pinched fabric UVs, opaque leaf plates and subpixel screen
drafting. `reference-comparison.html` in the evidence folder shows the provided
photo, final browser render and Blender render together. The unseen architecture
and physical measurements are inferred from the single photo; the exported room
is a navigable reconstruction rather than a pixel-identical photograph.

The cushion follow-up replaces the block-like throw cushions with larger puffed
front/back panels, pinched edges and perimeter piping. The latest arrangement
uses small groups with irregular gaps, varied sizes, lean and roll angles, and
slightly staggered depth. A separate deterministic random stream keeps all other
furnishings fixed. Projected cushion widths keep the groups from intersecting,
and fitting to the actual curved back mesh lets pillows lean against it. Their lowest
vertices sit 3 mm above the highest seat surface. The two oversized entrance arm
cushions and their book stacks are removed. The upholstered back now reaches
0.86 m above the terrace, at least 15 cm above every pillow; its collider matches
the raised height. `pillow-clearance.json` and the
`pillow-closeup.png` / `entrance-stairs.png` evidence verify these changes.
