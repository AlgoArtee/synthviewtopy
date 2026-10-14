from pathlib import Path
import bpy

HERE=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(HERE/'lux-umbrarum-community-room.blend'))
scene=bpy.context.scene
try:
    preferences=bpy.context.preferences.addons['cycles'].preferences
    preferences.compute_device_type='OPTIX'; preferences.get_devices()
    for device in preferences.devices: device.use=device.type!='CPU'
    scene.cycles.device='GPU' if any(d.use for d in preferences.devices) else 'CPU'
except (TypeError,RuntimeError,KeyError): scene.cycles.device='CPU'
output=HERE.parents[2]/'test-artifacts/lux-umbrarum-community-room/blender-reference.png'
scene.render.filepath=str(output)
bpy.ops.render.render(write_still=True)
result={'render':str(output),'device':scene.cycles.device}
