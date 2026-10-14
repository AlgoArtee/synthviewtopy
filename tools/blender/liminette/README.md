# Liminette reference astronomy desk

This asset recreates the complete astronomy workstation ensemble from the four
user-supplied front, side, and three-quarter reference photographs. It is an
additional desk in the original Liminette student room.

Open `create_astronomy_desk.py` in Blender 5.1's Text Editor and choose **Run
Script**. The generator creates a separate scene, preserves any existing scene,
and writes the editable `liminette-astronomy-desk.blend`, a merged-by-material
runtime GLB, four reference-comparison studio renders, and `asset-report.json`.
The source project contains the individual components and packed baked images;
the additional optimized collection is the export representation. Cameras,
lights, studio ground, and the editable collection are excluded from the GLB.

The same generation can run in an isolated background Blender process:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --python tools/blender/liminette/create_astronomy_desk.py
```

The official [Blender Lab MCP](https://www.blender.org/lab/mcp-server/) was also
installed in this project's ignored `.runtime/` directory, using source revision
`dbbf836ad4b1025f14a2b3b504c43903f39e0b04` (Python server 1.0.2). It connects to a
separate background Blender bridge on `127.0.0.1:9877`. Start that bridge in a
terminal with `tools/blender/liminette/start_mcp_bridge.ps1`, then verify or
regenerate through the MCP Python SDK client:

```powershell
.\.runtime\blender-mcp-python\Scripts\python.exe tools/blender/liminette/mcp_asset_client.py
.\.runtime\blender-mcp-python\Scripts\python.exe tools/blender/liminette/mcp_asset_client.py --generate
```

The SDK client calls the official server's `execute_blender_code` tool. Its
connection and generation responses are saved beside the validation evidence.
The bridge needs no changes to the user's open Blender scene or saved preferences.

The generator itself needs no downloaded models, textures, add-ons, or Python
packages. Wood,
brass, leather, globes, instrument scales, the orbital chart, and Saturn display
are generated locally and baked into PNG images embedded in both deliverables.
The intermediate `textures/` directory can be regenerated from the script.

The furniture is approximately 3.5 × 1.5 metres, with a 0.85-metre worktop. Blender
uses Z up and front −Y; glTF export converts it to Y up and front +Z. The source
origin is at the centre of the furniture footprint on the floor. The stool
projects forward beyond that footprint. Dimensions are inferred from the photos.

The expanded 19 × 15 m room places the asset at (3.175, 0, −4.75), rotated −90°
around Y against the east partition, opposite the west-wall bookshelves.
The seated user faces east; the ensemble's front faces west into the room.
The writing desk is centred at (1.15, 0, −7.05) along the north windows.
The console's north end aligns with the writing desk's front edge at the corner,
forming a compact L while leaving the full control panel exposed.
The writing chair is at (1.19, 0, −5.92); both seats are approached from the lounge.
The CRT and controls are decorative. Compound furniture and stool
colliders protect the room's walking routes. GLB readiness precedes room lighting
and the geometry audit; failed loading uses the existing readable error flow.
Control captions name general research parameters and sit above their controls,
including **Channel** above the large brown knob. The left plate uses Signal,
Range, Rate, Channel, Gain, Phase, Focus and Sample. The right plate uses monitoring,
filtering and measurement parameters. A shared texture atlas gives each plate its
own lettering while retaining one material; neither plate has a footer caption.
The astronomy viewpoint is at (0.475, 1.65, −4.15), looking at (3.175, 1.05, −4.75).
The freestanding orrery sits in the foyer to keep both desk approaches clear.

Run the focused integration/lifecycle smoke against the development server:

```powershell
node scripts/liminette-astronomy-desk-smoke.mjs
$env:APARTMENTS_SCOPE='room'
npm run test:apartments
npm run build
```

Evidence is written to `test-artifacts/liminette-astronomy-desk/`, including the
four Blender renders, room viewpoints, mobile view, missing-asset recovery, asset
budget, resource disposal, and departure-during-loading checks.
