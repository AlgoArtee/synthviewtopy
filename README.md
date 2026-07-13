# SynthViewTopy Lab Island

SynthViewTopy is an interactive Three.js spatial editor for the YouTopy Lab Island masterplan in `YT_LabIsland_Ideas1.png`. It turns the sketch into a navigable, procedural 3D island with editable research districts, six climate domes, transit rings, a coastal express loop, an Alpine logistics port, a bridge, and a distant cyberpunk city. The scene can accept external meshes and export a named, Blender-ready GLB hierarchy.

## Current masterplan coverage

- 35 editable district definitions covering every district/lab label in the sketch
- 6 editable biome domes at 2.15x their original dimensions: alpine, tundra, desert, savanna, temperate deciduous forest, and tropical rainforest; each contains a visible field lab
- 1 bridge connection centered between the Alpine and Tundra sectors, leading across the expanded sea to a long cyberpunk mainland skyline
- 1 industrial cold-chain port with four piers, three ships, and a direct freight road to Logistics
- 1 continuous six-segment road following the hexagonal coastline
- An exact pointy-top regular-hex island with five concentric ring-road delimiters and three biome-to-biome radial axes
- A Design Studio catalog with 10 exterior building/landscape assets and 12 interior lab, office, furniture, and systems assets
- Procedural terrain, architecture, biome interiors, roads, landscape, labels, water, lighting, and atmosphere

The source wording is retained as `sourceLabel` where a display name was normalized. The three central labels are represented as closely grouped parts of the integrated core complex.

## Run locally

Node.js 20.19+ or 22.12+ is recommended.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5178](http://127.0.0.1:5178). The fixed local-only port avoids colliding with other Vite projects that commonly use `5173`.

```bash
npm run build     # Type-check and create the production bundle in dist/
npm run preview   # Preview the production bundle locally
```

## Editor modes and controls

| Mode | Purpose | Mouse controls | Shortcut |
| --- | --- | --- | --- |
| Explore | Orbit around the island and inspect districts | Drag to orbit, scroll to zoom, click to select | `1` |
| Plan | Read the sketch as a north-up overhead masterplan | Drag to pan, scroll to zoom, click to select | `2` |
| Edit | Move, rotate, and scale the selected district, dome, or imported mesh | Click to select, then drag the transform gizmo | `3` |
| Walk | Explore the island at human eye level with collision-aware movement | Click the viewport for mouse-look; use movement keys to walk | `4` |

Additional controls:

- Click a district in the Atlas to select it; double-click a model or Atlas item to focus the camera.
- In Edit mode, use `G` for Move, `R` for Rotate, and `S` for Scale.
- The Inspector also exposes numeric XYZ position, Y rotation, uniform scale, accent color, visibility, Focus, and Reset controls.
- Press `/` to focus Atlas search, `Escape` to clear selection, `Home` to return to the overview, and `F` to toggle fullscreen.
- Toggle the Architecture, Landscape, Labels, and Transit layer buttons independently.
- Switch between Blue hour and Daylight from the top bar.
- Explore and Edit preserve the exact camera view when switching. Walk starts on safe ground at the current viewed area and returning to Explore or Edit keeps the resulting Walk position and heading.

### Edit workspaces

- Choose **Edit → Landscape** to select, move, rotate, scale, recolor, add, import, or delete buildings and outdoor objects. Choose an asset card and press **Add asset** or `A`; remove the selected object with **Delete** or the `Delete` key.
- Choose **Edit → Interior Design**, select a district building or biome dome in the scene or Atlas, and choose **Enter Interior**. The editor opens a lit cutaway room tied to that object's transform and exposes a dedicated catalog of lab benches, safety cabinets, scientific instruments, workstations, furniture, storage, servers, airlocks, and utility systems. Dome interiors begin with five field-laboratory fixtures and remain extensible through the same catalog.
- Interior objects use the same transform Inspector and gizmo as exterior assets. Imported meshes are automatically fitted and parented to the active building while Interior Design is open.
- Choose **Exit Interior** to restore the island view. Authored interiors remain attached to their buildings and are included in project JSON and Blender-ready GLB exports.

### Walk mode

- Press `4` or choose **Walk**, then click the 3D viewport to capture the pointer for mouse-look. If pointer lock is unavailable or denied, Walk automatically switches to drag-based mouse look; move or drag on the viewport to turn the camera.
- Move with `W`, `A`, `S`, `D` or the arrow keys. Hold `Shift` to move faster.
- Press `E` to inspect the object in reach.
- Press `Escape` to release pointer lock and return the mouse to the interface.
- The eye height is 0.18 world units, representing 1.8 metres at the project scale.
- Terrain, roads, district plots, bridge approaches, and city ramps expose semantic walkable surfaces. Buildings, biome structures, and imported meshes participate in collision/obstacle checks, while ramps keep traversal grounded across elevation changes.
- Every district has a lit entry door and a walkable foyer linked to its approach ramp. Each climate dome has a glazed airlock corridor: follow its ramp, cross the glowing threshold, and continue onto the dome's interior ground.

## Import meshes

Choose **Import**, select the island location where the building should stand, and then choose the GLB, GLTF, OBJ, or STL file. A cyan/magenta marker previews and confirms the placement; press `Escape` or cancel the file picker to abort. Dragged exterior files use the same click-to-place step. Multiple files can be imported in one pass and are arranged around the selected point. Imports made while an Interior Design room is active retain the room-scale placement workflow.

| Format | Behavior |
| --- | --- |
| `.glb` | Preferred self-contained format; hierarchy and PBR materials are retained where supported. |
| `.gltf` | Supported. Drag the `.gltf` and any referenced `.bin`/texture sidecar files together so relative references can be resolved in the browser. |
| `.obj` | Geometry is imported; a separate MTL workflow is not currently provided. |
| `.stl` | Geometry receives a neutral physical material and generated vertex normals. |

An imported asset is centered on X/Z and grounded from the bottom of its bounding box. In Landscape it is fitted to roughly 8 world units and added near the current selection; inside Interior Design it is fitted to furniture scale and parented to the active building. Imported assets can be selected, transformed, hidden, reset, deleted, included in the next GLB export, and treated as obstacles in Walk mode. Importing is local to the browser; files are not uploaded.

## Export GLB and open it in Blender

1. Click **Export scene**. The browser downloads `YouTopy_Lab_Island.glb`.
2. In Blender, choose **File > Import > glTF 2.0** and select that file.
3. Use the Outliner to work with the named `LAB_ISLAND__BLENDER_EXPORT` hierarchy and its district architecture, terrain/biomes, transit/bridge, cyberpunk city, and imported-asset collections.
4. The design scale is **1 world unit = 10 metres**. glTF/Blender will initially interpret one exported unit as one metre; for real-world dimensions, scale the imported root hierarchy uniformly by `10`, then use **Object > Apply > Scale**.
5. Save as `.blend`, or use Blender's exporters to continue into other DCC and engine formats.

Only visible objects under the export root are written to GLB. Hidden districts/assets are intentionally omitted. The export adds a Blender-compatible PBR ocean fallback and directional sun; editor labels, selection bounds, transform gizmos, and the live shader sky/water presentation layers are not included.

### Editable project JSON

Hold **Shift** while clicking **Export scene** to download `YouTopy_Lab_Island.project.json` instead of GLB. This JSON records all definitions and current object transforms, visibility, accent colors, editor mode, day/night state, camera position, scale metadata, and source-sketch metadata. It is useful for versioning or a future round-trip editor workflow; the current UI exports this JSON but does not yet import it.

## Architecture

| Location | Responsibility |
| --- | --- |
| `index.html` | Application shell, Atlas, Inspector, mode switch, layer controls, and import/export actions |
| `src/main.ts` | UI bindings, keyboard controls, Inspector synchronization, import/export workflow, and app startup |
| `src/config/island.ts` | Shared island radius, plan projection, regular-hex/biome coordinates, ring-road radii, surface height, and Walk dimensions/speeds |
| `src/data/districts.ts` | Declarative masterplan: IDs, labels, rings, positions, footprints, heights, archetypes, palettes, and descriptions for all 35 districts and 6 domes |
| `src/world/IslandWorld.ts` | Three.js scene lifecycle, camera/selection/edit/walk mode coordination, layers, day/night, mesh loaders, GLB exporter, and project JSON exporter |
| `src/world/WalkController.ts` | Pointer-lock mouse-look, keyboard movement, grounding, semantic surface sampling, collision checks, and inspect interaction |
| `src/world/editorAssets.ts` | Exterior/interior Design Studio catalog, GLB-safe procedural asset meshes, and reusable cutaway room shells |
| `src/world/procedural.ts` | Seeded procedural district and biome geometry/material generation |
| `src/world/environment.ts` | Island shell, landscape, ocean/sky presentation, transit rings, bridge, and cyberpunk skyline |
| `src/style.css` | Responsive editor interface and scene-label styling |

For masterplan changes, start in `src/data/districts.ts`. Definitions are stable, named records rather than baked geometry, so positions, footprints, heights, labels, colors, and archetypes remain easy to revise. Procedural visual families are selected by district category in `src/world/procedural.ts`, with district-specific equipment signatures for genomics, microbiology, toxicology, pharmacology, robotics, medical, forensic, logistics, hospitality, and other specialized zones.

## Coordinates and scale

- Origin: the central megabuilding/core
- `+X`: east; `-X`: west
- `+Y`: up
- `+Z`: south; `-Z`: north
- Scale: 1 world unit = 10 metres
- Island: exact pointy-top regular hex with circumradius 276 world units
- North-to-south height: 552 world units = 5,520 metres
- East-to-west width: `sqrt(3) x 276` world units, approximately 478 units = 4,780 metres
- District source projection: the original sketch coordinates are unwarped with `X x 1.2` and `Z x 1.8`
- Biome dome centers: exact pointy-hex directions at radius 228 world units
- District ring-road radii: 42, 63, 88.5, 120, and 154.5 world units
- District boundary ring-road radii: 14, 21, 29.5, 40, and 51.5 world units
- Three radial axes connect each pair of opposite biome domes through the origin
