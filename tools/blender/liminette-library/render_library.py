from pathlib import Path
import bpy,os
from mathutils import Vector
HERE=Path(__file__).resolve().parent;OUT=HERE.parents[2]/'test-artifacts/liminette-library'
bpy.ops.wm.open_mainfile(filepath=str(HERE/'liminette-ivory-library.blend'));scene=bpy.context.scene
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
    for device in prefs.devices:device.use=device.type!='CPU'
    scene.cycles.device='GPU' if any(d.use for d in prefs.devices) else 'CPU'
except (KeyError,TypeError,RuntimeError):scene.cycles.device='CPU'
shots=[('blender-reference',(-4.6,-9.2,2.8),(.70,-2.0,1.85),25),('blender-wall',(0,-3.2,2.75),(0,0,2.6),22),('blender-sofa',(-3.8,-7.7,2.1),(.2,-4.85,.65),34),('blender-valves',(-1.8,-3,1.7),(0,-.2,1.5),45),('blender-window',(0,-4.5,2.55),(4,-2.21,2.8),34)]
requested=os.environ.get('LIBRARY_RENDER_VIEWS','all').split(',')
shots.append(('blender-sofa-front',(-3.4,-1.85,1.9),(.25,-4.85,.70),30))
for name,p,target,lens in shots:
    if 'all' not in requested and name not in requested:continue
    camera=scene.camera;camera.location=p;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=lens;scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
result={'renders':requested,'device':scene.cycles.device}
