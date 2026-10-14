"""Render one reference angle from the editable asset, also callable via MCP."""
from pathlib import Path
import sys
import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
views = {
    '01-front': (.05, -7.8, 3.40),
    '02-left-profile': (-5.8, -3.3, 2.7),
    '03-left-three-quarter': (-4.9, -5.5, 4.0),
    '04-right-three-quarter': (5.0, -5.3, 3.65),
}
angle = globals().get('ANGLE_NAME', sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '03-left-three-quarter')
if not bpy.context.scene.name.startswith('Liminette Astronomy Desk'):
    bpy.ops.wm.open_mainfile(filepath=str(HERE / 'liminette-astronomy-desk.blend'))
scene = bpy.context.scene
try:
    preferences = bpy.context.preferences.addons['cycles'].preferences
    preferences.compute_device_type = 'OPTIX'
    preferences.get_devices()
    gpu = False
    for device in preferences.devices:
        device.use = device.type != 'CPU'
        gpu = gpu or device.use
    scene.cycles.device = 'GPU' if gpu else 'CPU'
except (TypeError, RuntimeError, KeyError):
    scene.cycles.device = 'CPU'
scene.camera.location = views[angle]
scene.camera.rotation_euler = (Vector((0, .04, .96)) - scene.camera.location).to_track_quat('-Z', 'Y').to_euler()
output = ROOT / 'test-artifacts/liminette-astronomy-desk/blender' / (angle + '.png')
scene.render.filepath = str(output)
bpy.ops.render.render(write_still=True)
scene['asset_id'] = 'liminette-reference-astronomy-desk'
bpy.data.libraries.write(str(HERE / 'liminette-astronomy-desk.blend'), {scene}, fake_user=True, compress=True)
result = {'render': str(output), 'device': scene.cycles.device, 'angle': angle}
