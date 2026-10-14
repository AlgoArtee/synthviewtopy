from pathlib import Path
import bpy,os
from mathutils import Vector
HERE=Path(__file__).resolve().parent
OUTPUT=HERE.parents[2]/'test-artifacts/lux-umbrarum-pool'
bpy.ops.wm.open_mainfile(filepath=str(HERE/'lux-umbrarum-pool-commons.blend'))
scene=bpy.context.scene
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type='OPTIX'; prefs.get_devices()
    for device in prefs.devices: device.use=device.type!='CPU'
    scene.cycles.device='GPU' if any(d.use for d in prefs.devices) else 'CPU'
except (KeyError,TypeError,RuntimeError): scene.cycles.device='CPU'
camera=scene.camera
shots=[('blender-reference',tuple(camera.location),None,camera.data.lens),
       ('blender-gauges',(4.9,2.95,3.70),(10.45,2.95,3.70),26),
       ('blender-machine',(5.3,-6.0,1.70),(7.1,-2.45,1.23),38),
       ('blender-pod',(0,-4.0,2.20),(7.9,-7.1,3.10),26),
       ('blender-lounger',(-4.8,-3.25,1.8),(-7.2,1.8,.64),46),
       ('blender-board-steps',(4.5,-5.6,1.80),(6.34,-3.4,.9),44)]
requested=os.environ.get('POOL_RENDER_VIEWS','all').split(',')
if 'all' not in requested: shots=[shot for shot in shots if shot[0] in requested]
for name,p,target,focal in shots:
    camera.location=p
    if target: camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.lens=focal; scene.render.filepath=str(OUTPUT/(name+'.png')); bpy.ops.render.render(write_still=True)
result={'renders':len(shots),'device':scene.cycles.device}
