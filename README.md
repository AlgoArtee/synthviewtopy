# SynthViewTopy Lab Island

SynthViewTopy is an interactive Three.js spatial editor for the YouTopy Lab Island masterplan in `YT_LabIsland_Ideas1.png`. It turns the sketch into a navigable, procedural 3D island with editable research districts, six climate domes, transit rings, a coastal railway, an Alpine logistics port, a bridge, and a distant cyberpunk city. The scene can accept external meshes and export a named, Blender-ready GLB hierarchy.

## Current masterplan coverage

- 35 editable district programs covering every district/lab label in the sketch; each has a description-specific, widely spaced satellite campus, at least four themed objects, and visible roads terminating at building approaches
- A district-scale dark-academia university with 14 configured, walk-accessible facilities; a gate and porter lodge; central and secondary courts; library, humanities, chapel, dining, science, residence, garden, canal, boathouse, and service zones; three furnished interiors; and optional discoveries
- 6 editable, fully populated biome domes at 2.15x their original dimensions: alpine, tundra, desert, savanna, temperate deciduous forest, and tropical rainforest; each has a distinct ecology set and named field laboratory
- 1 bridge connection centered between the Alpine and Tundra sectors, leading across the expanded sea to a long cyberpunk mainland skyline
- 1 industrial cold-chain port with four piers, three ships, and a direct freight road to Logistics
- 1 continuous double-track railway following the hexagonal coastline
- An exact pointy-top regular-hex island whose only district delimiters are five concentric ring roads and three continuous biome-to-biome roads, forming six radial spokes; no per-campus boundary overlays are rendered
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
- Press `Space` for a 0.55 m hop or hold it for a 1.6 m traversal jump. Airborne collision uses the character's actual feet height, so a sufficiently high jump can clear low walls and props while full-height architecture remains solid.
- Press `E` to interact with the object or entrance in reach.
- Press `Escape` to release pointer lock and return the mouse to the interface.
- WALK is calibrated to a 1.7 m adult: the camera eye level is 0.162 world units (1.62 m), the normal pace is 1.8 m/s, and the dedicated 55° vertical field of view is restored to the overview lens when WALK ends.
- Terrain, roads, district plots, bridge approaches, and city ramps expose semantic walkable surfaces. Buildings, biome structures, and imported meshes participate in collision/obstacle checks, while ramps keep traversal grounded across elevation changes.
- Every district has a lit entry door and a walkable foyer linked to its approach ramp. All 14 Academic District facilities have their own open arched doorway, walkable ground floor, and exterior path; the Ashcroft Grand Library entrance hall, Founders Dining Hall, and St Anselm Chapel nave are furnished in-place rather than loaded as disconnected scenes. Each climate dome has a glazed airlock corridor: follow its ramp, cross the glowing threshold, and continue onto the dome's interior ground.

## Academic District instructions

Select **Academic District — Libraries & Theoretical Labs** in the Atlas, then use Explore or Walk to follow the leaf-strewn processional path through the Blackwood gate. Academic paths are rough earth/gravel dressings only 6 cm above terrain, with consistent 4.2 m secondary walks and a 5.8 m ceremonial avenue; the former raised steel-grey slabs and 3.4 m Great Hall plinth are gone. One 48-segment network links the live thresholds of all fourteen facilities through six named routes: Processional Avenue, West Service Walk, Library Walk, Science Walk, South Transverse Walk, and East Canal Walk. Disconnected entrance stubs, the central five-spoke starburst, decorative lawn crosses, and the long diagonal chapel strip have been removed. The gate is laid out to frame the central clock tower; Old Science Court, Chapel Close, Marlowe Courts, and the Blackwater Canal branch from the central quadrangles.

- In **Walk**, stand within 4.5 m of an entrance plaque and press `E`. **Inspect entrance** opens the configured name, founding date, zone, description, and editable two-sentence fictional history. Saved edits stay in this browser.
- The interaction menu rings the St Anselm bell, toggles selected library reading-room lights, opens the stylized campus map, and exposes the manual close action for an already-open night gate. The campus is physically walkable while these overlays are open; closing an overlay restores the scene.
- The main gate is automatically open at sunrise, noon, and sunset. At night it closes and blocks WALK until the player stands within roughly 6 m of any part of the broad gate and presses `E` once; opening no longer requires precise crosshair aim or a menu click. It will wait rather than close on a player standing in the threshold.
- The processional avenue now runs directly from the gate to four broad worn-stone Great Hall steps, an open Gothic arch, and a continuous walkable interior. Its tree rows and deliberate canopy gaps frame the clock tower while keeping the gate, steps, entrances, and principal sightline clear. Thirty-two human-scale vintage benches with aged-oak slats and cast-iron scroll ends are distributed through parks, courts, the canal edge, and the open avenue.
- A tall, visually permeable Collegiate Gothic boundary follows the complete Academic sector: the inner ring-road arc, both biodome avenues, and the coastal railway edge. Its 708 instanced bays use crested carved-stone piers, blackened iron bars, pointed arches, quatrefoils, and botanical motifs. The existing Blackwood gate remains the main inward entrance; ivy-clad brass-signed garden openings face the Tundra and Desert biodomes, and an always-open monumental gate continues the canal bridge path to the rear railway.
- The 79-tree historic arboretum uses all 15 requested species in setting-specific groups: ancient English oaks and horse chestnuts occupy quadrangles; lindens and London planes line the ceremonial avenue; copper beeches frame libraries and administration; English yews, Irish yews, holly, and hawthorn shelter the chapel and graveyard; cedars of Lebanon stand inside the professors' garden; Scots pines surround Halley Observatory; willows and alders follow the canal and damp ground; European beeches form boundary groves and secluded walks; and rowans soften the Marlowe residential courts.
- Every logical tree retains editable procedural controls for structural variant, age, canopy density, leaf retention, moss, restrained ivy, deadwood, lean, and wind exposure. Veteran specimens can combine thick irregular trunks, exposed roots, pruning scars, hollow sections, dead secondary limbs, asymmetric crowns, and layered bark without forcing younger or historically introduced species into implausibly ancient forms.
- Campus audio is muted by default. Use **Audio muted** in the bottom layer bar to opt into low-volume synthesized wind/rain and bell audio; no loud audio autoplays.
- The Weather selector includes four district presets: **Late-autumn after rain**, **Overcast afternoon**, **Rainy dusk**, and **Foggy night**. Each coordinates sky, fog, precipitation, time of day, and restrained warm windows. Autumn trees use a dedicated seven-tone dark-green, olive, copper, russet, ochre, grey-brown, and muted-gold palette with full, thinning, and nearly bare crowns. Wet leaf collections accumulate around walls, drains, benches, exposed roots, cloisters, and residence bicycle racks instead of appearing as one uniform carpet.
- Canopies and secondary branches move subtly with deterministic, asynchronous phases. Wind response is species-specific and exposure-aware: flexible willows and rowans move more than veteran oaks, while yews, holly, cedar, and Scots pine remain comparatively restrained.
- Choose **Low**, **Medium**, or **High** in Graphics. Low limits pixel ratio and disables shadows, Medium keeps a balanced presentation, and High restores the maximum pixel ratio plus the single sun shadow. Expensive live updates pause while the tab is hidden.
- Arboretum trunks, branches, crown lobes, roots, defects, moss, ivy, and leaf deposits share instanced procedural kits and switch between near, mid, and far LOD tiers. WALK collision uses compact per-trunk barrier segments rather than district-spanning instanced-mesh bounds, so paths and entrances remain usable. GLB export temporarily selects the near-detail tree representation so Blender receives the authored trunks, branches, roots, and defects rather than the camera's last runtime LOD.
- Use **Debug** in the layer bar to show Academic District collision volumes in green, scene light positions in cyan, and live mesh/geometry/triangle/draw-call/texture statistics. Debug helpers are presentation-only and excluded from GLB export.

The building/history configuration is [src/data/academicCampus.ts](src/data/academicCampus.ts). `location` values use campus axes rather than world compass coordinates: the first value runs tangentially across the district wedge and the second runs radially from the island centre toward the canal. Editing a record updates the model, campus map, entrance card, and text snapshot together.

### Academic component hierarchy

```text
Academic District
├─ Main Entrance — gatehouses, porter lodge, notice board, iron leaves, open avenue
├─ Gothic Boundary — crested stone piers, permeable iron tracery, biodome gardens, railway gate
├─ Central Quadrangles — old lawn, entrance-linked walks, cloisters, scholar statue, reading courts
├─ Scholarship — Ashcroft, Wren, Humanities, Theoretical Sciences, lecture hall, archive
├─ Ceremonial — clock-towered Great Hall, chapel/graveyard, dining hall/kitchen chimneys
├─ Old Science Court — Halley Observatory, Faraday building, instruments and inscriptions
├─ Residential — Marlowe ranges, small courts, bicycles and secluded laundry
├─ Arboretum — 15 historic species, editable veteran defects, species wind, near/mid/far LOD
├─ Landscape — lawns, clipped hedges, ivy, wet fallen leaves, canal, bridge, reeds, boathouse
├─ Service — boiler court, delivery alley, coal/service doors, crates, pipes and sheds
└─ Hidden Discoveries — archive door, Rook Alley, lit basement/map room, blocked tunnel, raven
```

The principal optimization choices are shared unit geometries and cached procedural materials; cullable instanced Gothic fence bays, tree kits, leaf litter, windows, columns, ivy, and vintage benches; spatial near/mid/far arboretum LOD; emissive windows instead of one real-time light per room; only two non-shadowing gate lantern lights; precise authored fence, wall, and trunk segments instead of aggregate decorative-mesh collision; and presentation-only debug/audio systems. Seeded albedo/height patterns give limestone staggered ashlar courses, damp streaks, pits, and lichen; brick gets mortar, soot, and efflorescence; slate gets overlapping chipped rows; oak and arboretum bark families get layered grain and relief; and the earth paths tile at a stable physical scale without downloaded textures.

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
| `src/data/districtCampusPlans.ts` | Description-specific facility, object, and biome-ecology programs used by the procedural population layer |
| `src/data/academicCampus.ts` | Editable Academic District building names, dates, histories, locations, interior flags, hidden details, and weather preset catalog |
| `src/world/IslandWorld.ts` | Three.js scene lifecycle, camera/selection/edit/walk mode coordination, layers, day/night, mesh loaders, GLB exporter, and project JSON exporter |
| `src/world/WalkController.ts` | Pointer-lock mouse-look, keyboard movement, grounding, semantic surface sampling, collision checks, and inspect interaction |
| `src/world/editorAssets.ts` | Exterior/interior Design Studio catalog, GLB-safe procedural asset meshes, and reusable cutaway room shells |
| `src/world/procedural.ts` | Seeded procedural district and biome geometry/material generation |
| `src/world/academicDistrict.ts` | Reusable Gothic building shells, furnished interiors, gate, quadrangles, garden, canal, service areas, hidden discoveries, semantic access, and optimization metadata |
| `src/world/academicSurfaceTextures.ts` | Cached deterministic limestone, brick, slate, oak, and leaf-strewn path albedo/height patterns |
| `src/world/academicAudio.ts` | Opt-in synthesized campus wind, rain, and chapel-bell audio graph |
| `src/world/environment.ts` | Island shell, landscape, ocean/sky presentation, transit rings, bridge, and cyberpunk skyline |
| `src/style.css` | Responsive editor interface and scene-label styling |

For masterplan changes, start in `src/data/districts.ts`. Definitions are stable, named records rather than baked geometry, so positions, footprints, heights, labels, colors, and archetypes remain easy to revise. The five annular bands align to six shared road-bounded wedges; rings with seven named programs let two asymmetric campuses share one cell without introducing another visible delimiter. `src/data/districtCampusPlans.ts` assigns every program its own facilities and objects, while `src/world/procedural.ts` distributes them asymmetrically across each district cell and joins building entrances with short, exposed local roads. The Academic District is special-cased there as a reusable multi-mesh collegiate-Gothic kit with precise WALK collision segments and semantic access routes.

## Coordinates and scale

- Origin: the central megabuilding/core
- `+X`: east; `-X`: west
- `+Y`: up
- `+Z`: south; `-Z`: north
- Scale: 1 world unit = 10 metres
- Island: exact pointy-top regular hex with circumradius 552 world units
- North-to-south height: 1,104 world units = 11,040 metres
- East-to-west width: `sqrt(3) x 552` world units, approximately 956 units = 9,560 metres
- District source projection: the original sketch coordinates are unwarped with `X x 1.2` and `Z x 1.8`
- Biome dome centers: exact pointy-hex directions at radius 456 world units
- District ring-road radii: 84, 126, 177, 240, and 309 world units
- Original sketch boundary radii: 14, 21, 29.5, 40, and 51.5 world units before the 6x masterplan expansion
- Three continuous radial roads connect opposite biome domes through the origin, producing the six visible spoke boundaries used with the concentric roads
