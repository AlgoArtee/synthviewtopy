# Validation — 4 October 2026

Generated through the official Blender Lab MCP `execute_blender_code` tool in
an isolated Blender 5.1.2 process. The existing unsaved UI session was preserved.
The MCP stdio server is registered as `blender` in Codex; its bridge uses loopback
port 9877. Computer Use capture remained unavailable, so the requested MCP
installation supplied the authoring connection.

- GLB: 101,408 triangles, 18 primitives/materials, 12 embedded images,
  12,350,152 bytes; one asset scene and no cameras or lights.
- Editable Blender file: 701 separate authored components, 18 optimized meshes,
  12 packed image textures, and no linked libraries. A separate Blender process
  reopened and inspected the saved file.
- All four studio angles were rendered and visually checked for the console
  slope, return cabinet, three drawers/two doors, CRT, instruments, books and
  stool. Veneer UV direction and CRT corner curvature were refined after the
  first render.
- Expanded room footprint: 19 × 15 m (285 m²), approximately 48% more floor
  area. Walls, floor, vault ribs, windows and walking bounds match the enlarged
  footprint. The library and foyer furnishings moved 3 m west; the sleeping
  furniture moved 3 m north. The orrery sits at (5.2, 0, 1.0) in the foyer.
- The astronomy ensemble is centred at (3.175, 0, −4.75) and rotated −90° around
  Y, with its back against the east partition opposite the bookshelves. The
  seated user faces +X; the asset's front faces −X. It forms a 90° angle with
  the writing desk and leaves the sleeping-alcove doorway clear.
- The writing desk is centred at (1.15, 0, −7.05). The astronomy ensemble moved
  55 cm toward the lounge and 12.5 cm west, aligning only the end corners at the
  writing desk's front edge. No writing-desk surface extends in front of the
  astronomy controls. The writing chair remains at (1.19, 0, −5.92), clear of
  the brass stool. Both desks form one compact L, with access in front.
- Study viewpoint: (−0.6, 1.65, −4.7), target (1.25, 1.18, −7.15).
- Furniture footprint: approximately X 2.425–3.925, Z −6.50–−3.00, desktop
  0.85 m. Stool centre: (2.4, 0, −5.4). Instrument overhang extends slightly
  behind the furniture footprint. Full ensemble bounds: (2.150, 0, −6.505) to
  (4.001, 1.996, −2.988).
- Astronomy viewpoint: (0.475, 1.65, −4.15), target (3.175, 1.05, −4.75).
- Control lettering regenerated in Blender: general research parameters, with
  every caption above its associated control and **Channel** above the large
  brown knob. The old footer and row captions were removed. Left/right plates
  use separate regions of one embedded atlas; geometry and material counts are
  unchanged. GPU close-ups of both plates were checked for case, alignment,
  legibility and clearance around knobs, switches and meters.
- Focused asset smoke passed: entrance/study/astronomy/sleep and mobile captures,
  viewpoint clearance, approaches to both desks, sustained forward collision,
  walking through the sleeping
  alcove doorway, exact resource disposal counts, pending-load disposal,
  departure during loading, missing-GLB recovery and directory navigation.
- Existing room-scoped apartment smoke passed all 14 checks, including the
  missing-texture error flow. No browser errors occurred in the normal room.
- TypeScript validation and `npm run build` passed. The production GLB matches
  the source GLB byte for byte.

Full responses, screenshots and machine-readable results are in
`test-artifacts/liminette-astronomy-desk/`. The expanded room's full viewpoint
captures and 14-check room suite are in `test-artifacts/liminette-expanded-room/`.
The perpendicular desk layout is captured in `test-artifacts/liminette-perpendicular-desks/`.
The final close L arrangement is captured in `test-artifacts/liminette-close-desks/`.
The exposed-control corner correction is captured in `test-artifacts/liminette-clear-controls/`.
Updated control close-ups and asset integration checks are in `test-artifacts/liminette-research-labels/`.
Screens and controls are decorative.
