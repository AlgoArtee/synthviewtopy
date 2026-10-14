"""Author Liminette's reference astronomy desk in Blender 5.1.

Open this file in Blender's Text Editor and Run Script, or use:
  blender --background --python tools/blender/liminette/create_astronomy_desk.py

All geometry, artwork and baked material images are generated locally. The
original four photographs guide proportions; they are not projected onto boxes.
Blender coordinates: metres, Z up, front -Y. glTF exports Y up, front +Z.
"""
from pathlib import Path
import json
import math
import os
import random

import bpy
import numpy as np
from mathutils import Vector

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
ASSET = ROOT / 'public/apartments/assets/liminette-astronomy-desk.glb'
EVIDENCE = ROOT / 'test-artifacts/liminette-astronomy-desk/blender'
TEXTURES = HERE / 'textures'
for folder in (ASSET.parent, EVIDENCE, TEXTURES):
    folder.mkdir(parents=True, exist_ok=True)

random.seed(82473)
rng = np.random.default_rng(82473)
scene = bpy.data.scenes.new('Liminette Astronomy Desk')
bpy.context.window.scene = scene
scene['asset_id']='liminette-reference-astronomy-desk'
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
authored = bpy.data.collections.new('ASTRODESK | editable components')
scene.collection.children.link(authored)
parts = []
mat_by_name = {}


def baked_image(name, pixels, data=False):
    """Bake sampled procedural colour/roughness/artwork into a portable PNG."""
    h, w = pixels.shape[:2]
    if pixels.ndim == 2:
        pixels = np.repeat(pixels[:, :, None], 3, axis=2)
    rgba = np.ones((h, w, 4), dtype=np.float32)
    rgba[:, :, :3] = pixels
    image = bpy.data.images.new(name, width=w, height=h, alpha=False)
    image.colorspace_settings.name = 'Non-Color' if data else 'sRGB'
    image.pixels.foreach_set(np.flipud(rgba).ravel())
    image.filepath_raw = str(TEXTURES / (name + '.png'))
    image.file_format = 'PNG'
    image.save()
    # Reload the actual baked file: the material and GLB use the same pixels.
    image = bpy.data.images.load(image.filepath_raw, check_existing=False)
    image.name = name
    image.colorspace_settings.name = 'Non-Color' if data else 'sRGB'
    image.pack()
    return image


def material(name, colour, metallic=0, roughness=.5, texture=None,
             roughmap=None, bump=None, emission=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*colour, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if texture:
        node = mat.node_tree.nodes.new('ShaderNodeTexImage')
        node.image = texture
        mat.node_tree.links.new(node.outputs['Color'], bsdf.inputs['Base Color'])
    if roughmap:
        node = mat.node_tree.nodes.new('ShaderNodeTexImage')
        node.image = roughmap
        mat.node_tree.links.new(node.outputs['Color'], bsdf.inputs['Roughness'])
    if bump:
        node = mat.node_tree.nodes.new('ShaderNodeTexImage')
        node.image = bump
        normal = mat.node_tree.nodes.new('ShaderNodeNormalMap')
        normal.inputs['Strength'].default_value = .32
        mat.node_tree.links.new(node.outputs['Color'], normal.inputs['Color'])
        mat.node_tree.links.new(normal.outputs['Normal'], bsdf.inputs['Normal'])
    if emission:
        bsdf.inputs['Emission Color'].default_value = (*colour, 1)
        bsdf.inputs['Emission Strength'].default_value = emission
        if texture:
            mat.node_tree.links.new(mat.node_tree.nodes.get('Image Texture').outputs['Color'], bsdf.inputs['Emission Color'])
    mat_by_name[name] = mat
    return mat


def normal_from_height(height, strength):
    dy, dx = np.gradient(height)
    normal = np.stack((-dx * strength, dy * strength, np.ones_like(height)), axis=-1)
    normal /= np.sqrt(np.sum(normal ** 2, axis=-1, keepdims=True))
    return normal * .5 + .5


def make_materials():
    y, x = np.mgrid[0:1024, 0:1024].astype(np.float32) / 1024
    warp = x + .007 * np.sin(y * 23) + .012 * np.sin(y * 7 + x * 8)
    grain = (.040 * np.sin(warp * 810 + np.sin(y * 8) * 3)
             + .018 * np.sin(warp * 2310 + y * 15)
             + .095 * np.sin(warp * 119 + y * 3)
             + .018 * rng.normal(size=x.shape))
    pores = np.maximum(0, np.sin(warp * 1390 + y * 15)) ** 20
    tone = np.clip(.5 + grain - pores * .065, 0, 1)
    wood_pixels = np.array([.17, .110, .065]) + tone[:, :, None] * np.array([.19, .145, .09])
    woodmap = baked_image('walnut-veneer-baked-colour', wood_pixels)
    woodrough = baked_image('walnut-veneer-baked-roughness', np.clip(.46 + grain * .15, .3, .65), True)
    woodnormal = baked_image('walnut-veneer-baked-normal', normal_from_height(tone, .55), True)
    wood = material('01 | warm walnut veneer', (1, 1, 1), roughness=.48,
                    texture=woodmap, roughmap=woodrough, bump=woodnormal)
    darkwood = material('02 | walnut recesses and end grain', (.085, .042, .018), roughness=.58)
    patina = np.clip(.5 + .16 * np.sin(x * 35 + np.sin(y * 17))
                     + .07 * np.sin(y * 2800) + .035 * rng.normal(size=x.shape), 0, 1)
    brassmap = baked_image('brushed-brass-baked-colour', np.array([.25, .15, .055]) + patina[:, :, None] * np.array([.33, .28, .17]))
    brassrough = baked_image('brushed-brass-baked-roughness', np.clip(.24 + (1 - patina) * .28, .22, .58), True)
    brass = material('03 | aged brushed brass', (1, 1, 1), .88, .32, brassmap, brassrough)
    gold = material('04 | polished brass edges', (.52, .34, .13), .88, .24)
    cream = material('05 | warm ivory enamel', (.64, .63, .54), .05, .36)
    black = material('06 | black bakelite', (.012, .016, .013), .12, .38)
    rubber = material('07 | charcoal rubber seams', (.008, .011, .008), 0, .8)
    keycap = material('08 | parchment keycaps', (.61, .52, .34), .02, .57)
    pages = material('09 | aged paper edges', (.53, .43, .27), 0, .82)
    leather_pixels = np.array([.12, .045, .020]) + rng.random((512, 512, 1)) * np.array([.045, .025, .014])
    leathermap = baked_image('leather-baked-colour', leather_pixels)
    leather = material('10 | oxblood leather books', (1, 1, 1), 0, .64, leathermap)
    seat = material('11 | dark brown stool leather', (.046, .023, .011), 0, .55)
    earth = np.clip(np.sin(x * 19 + np.sin(y * 27) * 3)
                    + np.cos(y * 17 + x * 12) * .8, -1, 1)
    globepixels = np.array([.25, .18, .080]) + (earth[:, :, None] + 1) * np.array([.035, .038, .02])
    globemap = baked_image('antique-globe-baked-colour', globepixels)
    globe = material('12 | antique terrestrial globe', (1, 1, 1), .3, .5, globemap)
    return locals()


# Small bitmap lettering is baked into panel images; no font dependency is needed.
GLYPHS = {
 'A':['01110','10001','10001','11111','10001','10001','10001'],
 'B':['11110','10001','10001','11110','10001','10001','11110'],
 'C':['01111','10000','10000','10000','10000','10000','01111'],
 'D':['11110','10001','10001','10001','10001','10001','11110'],
 'E':['11111','10000','10000','11110','10000','10000','11111'],
 'F':['11111','10000','10000','11110','10000','10000','10000'],
 'G':['01111','10000','10000','10111','10001','10001','01111'],
 'H':['10001','10001','10001','11111','10001','10001','10001'],
 'I':['111','010','010','010','010','010','111'],
 'J':['00111','00010','00010','00010','00010','10010','01100'],
 'K':['10001','10010','10100','11000','10100','10010','10001'],
 'L':['10000','10000','10000','10000','10000','10000','11111'],
 'M':['10001','11011','10101','10101','10001','10001','10001'],
 'N':['10001','11001','10101','10011','10001','10001','10001'],
 'O':['01110','10001','10001','10001','10001','10001','01110'],
 'P':['11110','10001','10001','11110','10000','10000','10000'],
 'Q':['01110','10001','10001','10001','10101','10010','01101'],
 'R':['11110','10001','10001','11110','10100','10010','10001'],
 'S':['01111','10000','10000','01110','00001','00001','11110'],
 'T':['11111','00100','00100','00100','00100','00100','00100'],
 'U':['10001','10001','10001','10001','10001','10001','01110'],
 'V':['10001','10001','10001','10001','10001','01010','00100'],
 'W':['10001','10001','10001','10101','10101','10101','01010'],
 'X':['10001','10001','01010','00100','01010','10001','10001'],
 'Y':['10001','10001','01010','00100','00100','00100','00100'],
 'Z':['11111','00001','00010','00100','01000','10000','11111'],
 '0':['01110','10001','10011','10101','11001','10001','01110'],
 '1':['010','110','010','010','010','010','111'],
 '2':['01110','10001','00001','00110','01000','10000','11111'],
 '3':['11110','00001','00001','01110','00001','00001','11110'],
 '4':['00010','00110','01010','10010','11111','00010','00010'],
 '5':['11111','10000','10000','11110','00001','00001','11110'],
 '6':['01110','10000','10000','11110','10001','10001','01110'],
 '7':['11111','00001','00010','00100','01000','01000','01000'],
 '8':['01110','10001','10001','01110','10001','10001','01110'],
 '9':['01110','10001','10001','01111','00001','00001','01110'],
 '-':['000','000','000','111','000','000','000'],
 '.':['0','0','0','0','0','1','1'],
 '/':['00001','00001','00010','00100','01000','10000','10000'],
 ' ':['000'] * 7,
}
GLYPHS.update({
 'a':['00000','00000','01110','00001','01111','10001','01111'],
 'b':['10000','10000','10110','11001','10001','10001','11110'],
 'c':['00000','00000','01111','10000','10000','10000','01111'],
 'd':['00001','00001','01101','10011','10001','10001','01111'],
 'e':['00000','00000','01110','10001','11111','10000','01111'],
 'f':['00110','01001','01000','11100','01000','01000','01000'],
 'g':['00000','01111','10001','10001','01111','00001','01110'],
 'h':['10000','10000','10110','11001','10001','10001','10001'],
 'i':['010','000','110','010','010','010','111'],
 'j':['001','000','001','001','001','101','010'],
 'k':['10000','10000','10010','10100','11000','10100','10010'],
 'l':['110','010','010','010','010','010','111'],
 'm':['00000','00000','11010','10101','10101','10001','10001'],
 'n':['00000','00000','10110','11001','10001','10001','10001'],
 'o':['00000','00000','01110','10001','10001','10001','01110'],
 'p':['00000','11110','10001','10001','11110','10000','10000'],
 'q':['00000','01111','10001','10001','01111','00001','00001'],
 'r':['00000','00000','10110','11001','10000','10000','10000'],
 's':['00000','00000','01111','10000','01110','00001','11110'],
 't':['01000','01000','11100','01000','01000','01001','00110'],
 'u':['00000','00000','10001','10001','10001','10011','01101'],
 'v':['00000','00000','10001','10001','10001','01010','00100'],
 'w':['00000','00000','10001','10001','10101','10101','01010'],
 'x':['00000','00000','10001','01010','00100','01010','10001'],
 'y':['00000','10001','10001','10001','01111','00001','01110'],
 'z':['00000','00000','11111','00010','00100','01000','11111'],
})


class Artwork:
    def __init__(self, w, h, colour):
        self.w, self.h = w, h
        self.pixels = np.zeros((h, w, 3), dtype=np.float32) + colour

    def line(self, a, b, colour, width=1, opacity=1):
        x0, y0 = a; x1, y1 = b
        left = max(0, int(min(x0, x1) - width - 2))
        right = min(self.w, int(max(x0, x1) + width + 3))
        top = max(0, int(min(y0, y1) - width - 2))
        bottom = min(self.h, int(max(y0, y1) + width + 3))
        yy, xx = np.mgrid[top:bottom, left:right]
        length = (x1-x0)**2 + (y1-y0)**2
        t = np.clip(((xx-x0)*(x1-x0) + (yy-y0)*(y1-y0)) / max(length, 1e-8), 0, 1)
        distance = np.sqrt((xx-x0-t*(x1-x0))**2 + (yy-y0-t*(y1-y0))**2)
        alpha = (np.clip(width * .5 + .65 - distance, 0, 1) * opacity)[:, :, None]
        patch = self.pixels[top:bottom, left:right]
        patch[:] = patch * (1-alpha) + np.array(colour) * alpha

    def ellipse(self, cx, cy, rx, ry, colour, width=1, angle=0, opacity=1, start=0, end=math.tau):
        points = []
        for t in np.linspace(start, end, max(32, int((rx + ry) * .8))):
            x, y = math.cos(t)*rx, math.sin(t)*ry
            points.append((cx+x*math.cos(angle)-y*math.sin(angle), cy+x*math.sin(angle)+y*math.cos(angle)))
        for a, b in zip(points, points[1:]): self.line(a, b, colour, width, opacity)

    def text(self, text, x, y, scale, colour, preserve_case=False):
        for char in text if preserve_case else text.upper():
            glyph = GLYPHS.get(char, GLYPHS[' '])
            for row, values in enumerate(glyph):
                for column, value in enumerate(values):
                    if value == '1':
                        px, py = int(x + column * scale), int(y + row * scale)
                        self.pixels[max(0,py):min(self.h,py+scale),max(0,px):min(self.w,px+scale)] = colour
            x += (len(glyph[0]) + 1) * scale


def chart_art():
    a = Artwork(2048, 1440, [.012, .032, .037])
    gold = [.63, .49, .25]; pale = [.88, .73, .40]
    a.pixels += rng.normal(0, .0025, a.pixels.shape).astype(np.float32)
    for inset in (18, 27):
        for p, q in [((inset,inset),(2048-inset,inset)),((inset,inset),(inset,1440-inset)),
                     ((2048-inset,inset),(2048-inset,1440-inset)),((inset,1440-inset),(2048-inset,1440-inset))]:
            a.line(p,q,gold,1.4)
    cx, cy = 1024, 712
    for i in range(1, 10):
        a.ellipse(cx,cy,85+i*85,48+i*49,gold,1.3,opacity=.85)
    a.ellipse(cx,cy,876,529,pale,2)
    a.ellipse(cx,cy,918,587,gold,1)
    for deg in range(0,360,5):
        angle=math.radians(deg)
        a.line((cx+math.cos(angle)*868,cy+math.sin(angle)*525),
               (cx+math.cos(angle)*(854 if deg%30 else 836),cy+math.sin(angle)*(517 if deg%30 else 506)),gold,1)
    for i in range(12):
        t=i*math.pi/12
        a.line((cx-math.cos(t)*874,cy-math.sin(t)*529), (cx+math.cos(t)*874,cy+math.sin(t)*529),gold,1,opacity=.26)
    a.ellipse(cx,cy,894,355,pale,1.2,angle=-.24,opacity=.75)
    for count in range(340):
        x,y=rng.uniform(135,1910),rng.uniform(140,1265)
        r=rng.choice([1,1,1,2,3])
        a.ellipse(x,y,r,r,pale,1.7)
        if count%17==0:
            a.line((x-6,y),(x+6,y),pale,.9); a.line((x,y-6),(x,y+6),pale,.9)
    for count in range(22):
        px,py=rng.uniform(270,1800),rng.uniform(220,1120)
        for j in range(3):
            nx,ny=px+rng.uniform(-70,70),py+rng.uniform(-70,70)
            a.line((px,py),(nx,ny),gold,.8,.55); px,py=nx,ny
    for x,y in ((155,144),(1880,152),(180,1280),(1870,1270)):
        a.ellipse(x,y,43,24,gold,1,angle=-.3)
        a.ellipse(x,y,23,22,gold,1,angle=.5)
    for radius,opacity in ((22,.10),(13,.18),(7,.65),(3,1)):
        a.ellipse(cx,cy,radius,radius,pale,radius*2,opacity=opacity)
    a.text('VINCULUM CELESTIAL ATLAS',71,61,3,gold)
    a.text('QUIET ORBITS / EPOCH 014',1460,1350,2,gold)
    return baked_image('orbital-chart-original-artwork',np.clip(a.pixels,0,1))


def crt_art():
    a=Artwork(768,768,[.012,.033,.016]); green=[.40,.82,.43]
    yy,xx=np.mgrid[0:768,0:768]
    glow=np.exp(-(((xx-290)/245)**2+((yy-307)/250)**2))*.037
    a.pixels+=glow[:,:,None]*np.array([.45,1,.50])
    for offset in range(-110,111,13):
        rx=math.sqrt(max(0,125**2-offset**2))
        a.ellipse(310,290+offset,rx,rx*.12,green,1.1,angle=-.17,opacity=.85)
    a.ellipse(310,290,124,124,green,2)
    a.ellipse(310,290,195,37,green,2.5,angle=-.43)
    a.ellipse(310,290,184,31,green,1.4,angle=-.43)
    for i,line in enumerate(['OBSERVE','STUDY','WONDER','REPEAT']):
        a.text(line,465,455+i*39,3,green)
    a.pixels[::3]*=.91
    return baked_image('CRT-Saturn-phosphor-artwork',np.clip(a.pixels,0,1))


def meter_art():
    a=Artwork(256,192,[.018,.045,.028]); c=[.43,.74,.43]
    for radius in (50,67,84): a.ellipse(128,154,radius,radius*.75,c,1,start=math.pi,end=math.tau)
    for i in range(20):
        t=math.pi+i/19*math.pi
        a.line((128+math.cos(t)*82,154+math.sin(t)*61),(128+math.cos(t)*73,154+math.sin(t)*54),c,1)
    a.line((128,154),(94,82),c,2); a.ellipse(128,154,4,4,c,3)
    a.text('FLUX',20,15,2,c)
    return baked_image('instrument-meter-original-artwork',a.pixels)


def plate_art(legend=False):
    if legend:
        a=Artwork(256,1024,[.014,.023,.021]); c=[.62,.51,.31]
        lines=['CELESTIAL','COORDINATES','01 MERCURY','02 VENUS','03 TERRA','04 MARS','05 JUPITER','06 SATURN','07 URANUS','08 NEPTUNE','RIGHT ASC.','DECLINATION','SIDEREAL','VINCULUM']
        for i,label in enumerate(lines):
            y=38+i*68
            a.text(label,18,y,2,c)
            a.line((18,y+28),(a.w-18,y+28),c,.7,.65)
        return baked_image('orbital-legend',a.pixels)

    # A shared atlas keeps one material, with different lettering for each plate.
    # v is measured upward on the sloped panel; every caption is above its control.
    panels=[
        (-1.52,.355,[
            ('Research Parameters',-1.52,.414),
            ('Signal',-1.635,.360),('Range',-1.635,.260),('Rate',-1.635,.160),
            ('Channel',-1.484,.222),
            ('Gain',-1.610,-.075),('Phase',-1.447,-.075),
            ('Focus',-1.610,-.259),('Sample',-1.447,-.259),
        ]),
        (.257,.318,[
            ('Input',.176,.415),('Output',.330,.415),
            ('Threshold',.166,.164),('Bandwidth',.309,.164),
            ('Filter',.133,.050),('Track',.235,.050),
            ('Offset',.166,-.021),('Balance',.309,-.021),('Bias',.377,.007),
            ('Sync',.133,-.129),('Hold',.235,-.129),('Auto',.335,-.129),
            ('Depth',.166,-.194),('Scale',.309,-.194),
        ]),
    ]
    atlas=Artwork(1024,1024,[.43,.33,.19]); c=[.085,.06,.031]
    for column,(center,width,labels) in enumerate(panels):
        for label,x,v in labels:
            scale=3
            text_width=sum((len(GLYPHS[char][0])+1)*scale for char in label)-scale
            px=column*512+((x-center)/width+.5)*512-text_width/2
            py=(.5-v/.887)*1024
            atlas.text(label,px,py,scale,c,preserve_case=True)
    return baked_image('engraved-control-plate',atlas.pixels)


def own(obj,name,mat):
    obj.name=name
    for collection in list(obj.users_collection): collection.objects.unlink(obj)
    authored.objects.link(obj)
    if mat: obj.data.materials.append(mat)
    parts.append(obj)
    return obj


def finish(obj,bevel=0,smooth=True):
    bpy.context.view_layer.objects.active=obj
    if bevel:
        modifier=obj.modifiers.new('Small machined edge bevel','BEVEL')
        modifier.width=bevel
        modifier.segments=1 if min(obj.dimensions)<.012 else 3
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    if smooth:
        for polygon in obj.data.polygons: polygon.use_smooth=True
        modifier=obj.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL')
        modifier.keep_sharp=True; modifier.weight=35
        try: bpy.ops.object.modifier_apply(modifier=modifier.name)
        except RuntimeError: obj.modifiers.remove(modifier)
    return obj


def box(name,mat,position,size,bevel=.005,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=1,location=position)
    obj=own(bpy.context.object,name,mat)
    obj.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.rotation_euler=rotation
    return finish(obj,min(bevel,min(size)*.45))


def cylinder(name,mat,position,radius,depth,rotation=(0,0,0),vertices=32,bevel=.002):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=position,rotation=rotation)
    return finish(own(bpy.context.object,name,mat),min(bevel,depth*.2))


def sphere(name,mat,position,size,segments=32,rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=1,location=position)
    obj=own(bpy.context.object,name,mat); obj.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(obj)


def rounded_front_box(name,mat,position,size,radius):
    """Rounded rectangular CRT face; corner radius is independent of depth."""
    width,depth,height=size
    outline=[]
    for cx,cz,start in [(width/2-radius,height/2-radius,0),
                        (-width/2+radius,height/2-radius,90),
                        (-width/2+radius,-height/2+radius,180),
                        (width/2-radius,-height/2+radius,270)]:
        for i in range(9):
            a=math.radians(start+i*90/8)
            outline.append((cx+radius*math.cos(a),cz+radius*math.sin(a)))
    count=len(outline)
    vertices=[(x,y,z) for y in (-depth/2,depth/2) for x,z in outline]
    faces=[tuple(range(count)),tuple(range(count,2*count))[::-1]]
    faces += [(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(vertices,[],faces); mesh.update()
    obj=bpy.data.objects.new(name,mesh); authored.objects.link(obj)
    obj.location=position; mesh.materials.append(mat); parts.append(obj)
    return finish(obj,.0025)


def veneer_uvs():
    """Vertical veneer on cabinetry, lengthwise grain on shelves and aprons."""
    for obj in parts:
        if obj.type!='MESH' or not obj.data.materials or obj.data.materials[0]!=M['wood']: continue
        layer=obj.data.uv_layers.active or obj.data.uv_layers.new(name='Veneer grain UV')
        long_grain=any(word in obj.name.lower() for word in ('apron','fascia','worktop','shelf','moulding'))
        for poly in obj.data.polygons:
            normal=obj.matrix_world.to_3x3() @ poly.normal
            axis=max(range(3), key=lambda a:abs(normal[a]))
            for loop in poly.loop_indices:
                p=obj.matrix_world @ obj.data.vertices[obj.data.loops[loop].vertex_index].co
                if axis==2: uv=(p.y/.55,p.x/1.6)
                elif axis==1: uv=(p.z/.55,p.x/1.6) if long_grain else (p.x/.55,p.z/1.6)
                else: uv=(p.y/.55,p.z/1.6)
                layer.data[loop].uv=uv


def tube(name,mat,points,radius,cyclic=False):
    curve=bpy.data.curves.new(name,'CURVE'); curve.dimensions='3D'
    curve.resolution_u=1; curve.bevel_depth=radius; curve.bevel_resolution=2
    spline=curve.splines.new('POLY'); spline.points.add(len(points)-1)
    for point,coordinate in zip(spline.points,points): point.co=(*coordinate,1)
    spline.use_cyclic_u=cyclic
    obj=bpy.data.objects.new(name,curve); authored.objects.link(obj)
    curve.materials.append(mat); parts.append(obj)
    return obj


def ring(name,mat,center,radius,tube_radius,rotation=(0,0,0),segments=72):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius,minor_radius=tube_radius,
                                   major_segments=segments,minor_segments=8,location=center,rotation=rotation)
    return finish(own(bpy.context.object,name,mat))


ANGLE=math.atan2(.515,.81)
YC=.135; ZC=1.1325


def on_panel(x,v,w=0):
    return (x,YC+v*math.cos(ANGLE)-w*math.sin(ANGLE),ZC+v*math.sin(ANGLE)+w*math.cos(ANGLE))


def panel_box(name,mat,x,v,width,height,depth=.008,w=.012,bevel=.003):
    return box(name,mat,on_panel(x,v,w),(width,height,depth),bevel,(ANGLE,0,0))


def panel_disc(name,mat,x,v,radius,depth,w=.032):
    return cylinder(name,mat,on_panel(x,v,w),radius,depth,(ANGLE,0,0),24,.0015)


def plane(name,mat,center,width,height,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_plane_add(size=1,location=center,rotation=rotation)
    obj=own(bpy.context.object,name,mat); obj.scale=(width,height,1)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return obj


def screw(x,v):
    panel_disc('Slotted control plate screw',M['gold'],x,v,.006,.002,.024)
    panel_box('Screwdriver slot',M['darkwood'],x,v,.007,.0012,.001,.026,0)


def knob(x,v,r=.028,large=False):
    panel_disc('Brass knob escutcheon',M['gold'],x,v,r*1.14,.005,.029)
    panel_disc('Bakelite rotary knob',M['brass'] if large else M['black'],x,v,r,.030,.047)
    panel_disc('Rotary knob cap',M['darkwood'] if large else M['rubber'],x,v,r*.77,.003,.064)
    for k in range(12):
        t=k*math.tau/12
        panel_box('Knurled grip detail',M['gold'] if large else M['rubber'],
                  x+math.cos(t)*r*.96,v+math.sin(t)*r*.96,.002,.006,.020,.049,.0005)
    panel_box('Knob position marker',M['keycap'],x,v+r*.44,.002,.013,.001,.067,0)


def furniture():
    wood=M['wood']; dark=M['darkwood']; brass=M['brass']; gold=M['gold']
    # Main desk and the forward-projecting right return: two joined cabinet forms.
    box('Main console worktop',wood,(-.65,.225,.814),(2.2,1.05,.072),.025)
    box('Return cabinet worktop',wood,(1.1,0,.814),(1.3,1.5,.072),.028)
    for x,y,w,d in [(-.65,.225,2.2,1.05),(1.1,0,1.3,1.5)]:
        box('Worktop upper brass edge',gold,(x,y,.850),(w,.0+ d,.006),.002)
        box('Walnut inset top surface',wood,(x,y,.855),(w-.017,d-.017,.009),.003)
    box('Console front apron',wood,(-.65,-.29,.739),(2.16,.052,.14),.012)
    box('Apron lower brass bead',brass,(-.65,-.322,.675),(2.15,.009,.009),.003)
    box('Center shallow drawer',dark,(-.04,-.322,.742),(.31,.014,.095),.008)
    box('Center drawer brass inlay',brass,(-.04,-.332,.742),(.294,.005,.077),.003)
    box('Center drawer face',wood,(-.04,-.336,.742),(.281,.004,.065),.002)
    sphere('Center drawer lock',gold,(-.04,-.344,.742),(.009,.005,.007),16,8)
    box('Main desk back panel',wood,(-.65,.714,.402),(2.16,.066,.64),.008)
    box('Back panel base moulding',dark,(-.65,.692,.105),(2.16,.092,.095),.010)
    box('Left pedestal cupboard',wood,(-1.445,.26,.395),(.57,.89,.64),.018)
    box('Left pedestal plinth',dark,(-1.445,.26,.092),(.59,.91,.077),.008)
    box('Cupboard door recess',dark,(-1.445,-.193,.393),(.502,.018,.556),.006)
    box('Cupboard framed door',wood,(-1.445,-.206,.393),(.475,.018,.529),.009)
    box('Cupboard recessed field',dark,(-1.445,-.218,.393),(.391,.005,.425),.003)
    box('Cupboard inset veneer',wood,(-1.445,-.222,.393),(.372,.006,.406),.004)
    sphere('Cupboard brass knob',gold,(-1.237,-.241,.428),(.009,.016,.009),16,8)
    for x in (-1.67,-1.22):
        for y in (-.10,.61): box('Pedestal foot',dark,(x,y,.04),(.068,.083,.08),.007)
    # Sloped wedge with authentic solid side cheeks and rear shelf.
    for x in (-1.72,.42):
        verts=[(x-.015,-.28,.857),(x+.015,-.28,.857),(x-.015,.60,.857),(x+.015,.60,.857),
               (x-.015,-.28,.875),(x+.015,-.28,.875),(x-.015,.60,1.39),(x+.015,.60,1.39)]
        mesh=bpy.data.meshes.new('Walnut console wedge cheek')
        mesh.from_pydata(verts,[],[(0,2,3,1),(0,1,5,4),(2,6,7,3),(4,5,7,6),(0,4,6,2),(1,3,7,5)])
        obj=bpy.data.objects.new('Solid wedge side cheek',mesh); authored.objects.link(obj)
        mesh.materials.append(wood); parts.append(obj); finish(obj,.007)
    box('Console raised rear wall',wood,(-.65,.648,1.122),(2.16,.063,.535),.008)
    box('Instrument display shelf',wood,(-.65,.676,1.405),(2.2,.148,.030),.008)
    box('Shelf brass lip',brass,(-.65,.596,1.404),(2.2,.009,.033),.003)
    panel_box('Sloping wooden console frame',wood,-.65,0,2.19,.989,.032,0,.012)
    panel_box('Sloping brass perimeter',brass,-.65,0,2.174,.973,.008,.020,.004)
    panel_box('Sloping dark face inset',dark,-.65,0,2.144,.943,.004,.027,.003)
    # Right cabinet, recessed face frames, three drawers and twin doors.
    box('Right cabinet carcass',wood,(1.1,.018,.42),(1.26,1.40,.70),.018)
    box('Right cabinet bottom plinth',dark,(1.1,.018,.083),(1.27,1.41,.105),.009)
    box('Return drawer-and-door shadow field',dark,(1.1,-.692,.421),(1.16,.017,.585),.006)
    box('Right cabinet end frame',dark,(1.736,.018,.416),(.014,1.22,.56),.006)
    box('Right cabinet end veneer',wood,(1.748,.018,.416),(.010,1.16,.51),.006)
    for i in range(3):
        z=.222+i*.177
        box('Return drawer frame',wood,(.684,-.711,z),(.326,.022,.162),.008)
        box('Return drawer inset shadow',dark,(.684,-.727,z),(.272,.009,.114),.004)
        box('Return drawer inset veneer',wood,(.684,-.734,z),(.255,.009,.099),.004)
        sphere('Drawer cast brass pull',gold,(.684,-.758,z),(.011,.016,.011),20,10)
    for x in (1.058,1.470):
        box('Return cupboard framed door',wood,(x,-.711,.421),(.391,.022,.564),.009)
        box('Return door inset shadow',dark,(x,-.727,.421),(.326,.009,.496),.004)
        box('Return door inset veneer',wood,(x,-.734,.421),(.310,.009,.480),.004)
        sphere('Return door brass pull',gold,(x+(-.11 if x>1.2 else .11),-.758,.494),(.011,.016,.011),20,10)
    for x,y in [(-1.726,-.270),(.429,-.270),(1.733,-.716)]:
        cylinder('Brass pencil leg',brass,(x,y,.345),.016,.654,vertices=24)
        cylinder('Leg ornamental sleeve',gold,(x,y,.080),.020,.034,vertices=24)
        cylinder('Round brass foot',brass,(x,y,.016),.029,.019,vertices=32)
    box('Return front fascia',wood,(1.1,-.747,.75),(1.29,.026,.12),.010)
    box('Return fascia lower brass strip',brass,(1.1,-.765,.685),(1.29,.005,.009),.002)


def instruments():
    chart=material('13 | celestial atlas chart', (1,1,1),.08,.58,chart_art())
    legend=material('14 | engraved orbital legend',(1,1,1),.15,.53,plate_art(True))
    control=material('15 | engraved brushed control panels',(1,1,1),.6,.44,plate_art(False))
    meter=material('16 | twin green instrument screens',(1,1,1),.04,.26,meter_art(),emission=.22)
    panel_box('Chart dark brass surround',M['brass'],-.515,0,1.205,.888,.010,.032,.004)
    panel_box('Chart black recessed border',M['black'],-.515,0,1.190,.873,.005,.039,.003)
    plane('Central orbital chart artwork',chart,on_panel(-.515,0,.043),1.175,.856,(ANGLE,0,0))
    plane('Left orbital coordinates legend',legend,on_panel(-1.22,0,.033),.190,.885,(ANGLE,0,0))
    for column,(x,width) in enumerate(((-1.52,.355),(.257,.318))):
        panel_box('Analog control panel base',M['brass'],x,0,width+.014,.901,.010,.032)
        artwork=plane('Engraved control plate artwork',control,on_panel(x,0,.039),width,.887,(ANGLE,0,0))
        for loop in artwork.data.uv_layers.active.data:
            loop.uv.x=(loop.uv.x+column)/2
        for dx in (-width*.46,width*.46):
            for v in (-.421,.421): screw(x+dx,v)
    # Left: vertical selectors, rotary tuning, and four heavy bakelite dials.
    for v in (.305,.205,.105): knob(-1.635,v,.019)
    knob(-1.484,.136,.040,True)
    panel_box('Selector silver scale',M['keycap'],-1.399,.264,.045,.17,.003,.043)
    for i in range(9): panel_box('Scale engraved tick',M['darkwood'],-1.399,.198+i*.015,.029,.0015,.001,.047,0)
    for v in (.320,.244): panel_box('Selector black window',M['black'],-1.471,v,.045,.026,.003,.044)
    for x in (-1.610,-1.447):
        for v in (-.145,-.329): knob(x,v,.034)
    # Right: twin CRT gauges, tuning knobs, switches, and vertical fader.
    for x in (.176,.330):
        panel_box('Small instrument brass bezel',M['gold'],x,.307,.135,.139,.008,.047,.004)
        panel_box('Small instrument rubber gasket',M['black'],x,.307,.121,.125,.006,.053,.008)
        plane('Green instrument gauge',meter,on_panel(x,.307,.058),.107,.109,(ANGLE,0,0))
    for x in (.166,.309):
        knob(x,.094,.027,True)
        knob(x,-.072,.020)
        knob(x,-.254,.028)
    for x,v in ((.133,-.160),(.235,-.160),(.335,-.160),(.133,.015),(.235,.015)):
        panel_disc('Toggle switch mounting washer',M['gold'],x,v,.007,.003,.045)
        panel_box('Silver toggle switch',M['cream'],x,v,.004,.019,.020,.057,.001)
    panel_box('Vertical fader brass surround',M['gold'],.377,-.172,.032,.264,.008,.046)
    panel_box('Vertical fader recessed channel',M['black'],.377,-.172,.023,.251,.006,.053)
    for i in range(10): panel_box('Vertical fader scale',M['keycap'],.377,-.282+i*.024,.019,.002,.001,.058,0)
    panel_box('Vertical fader slider',M['brass'],.377,-.096,.032,.024,.011,.066)


def screen_mesh(name,mat,cx,y,cz,width,height,bulge):
    """Convex CRT face with rounded rectangular silhouette and coherent UVs."""
    vertices=[]; faces=[]; uv=[]; nx=32; nz=24
    for j in range(nz+1):
        v=j/nz
        for i in range(nx+1):
            u=i/nx; px=(u-.5)*2; pz=(v-.5)*2
            xx=px*width*.5; zz=pz*height*.5; radius=.065
            dx=max(abs(xx)-(width*.5-radius),0); dz=max(abs(zz)-(height*.5-radius),0)
            length=math.hypot(dx,dz)
            if length>radius:
                xx=math.copysign(width*.5-radius+dx*radius/length,xx)
                zz=math.copysign(height*.5-radius+dz*radius/length,zz)
            vertices.append((cx+xx,y-bulge*(1-px*px)*(1-pz*pz),cz+zz))
            uv.append((u,v))
    for j in range(nz):
        for i in range(nx):
            a=j*(nx+1)+i; faces.append((a,a+1,a+nx+2,a+nx+1))
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(vertices,[],faces); mesh.update()
    layer=mesh.uv_layers.new(name='CRT face artwork UV')
    for polygon in mesh.polygons:
        polygon.use_smooth=True
        for loop in polygon.loop_indices: layer.data[loop].uv=uv[mesh.loops[loop].vertex_index]
    obj=bpy.data.objects.new(name,mesh); authored.objects.link(obj); mesh.materials.append(mat); parts.append(obj)
    return obj


def terminal():
    cx=1.085; z=.875
    screen=material('17 | Saturn green phosphor CRT',(1,1,1),.02,.22,crt_art(),emission=.55)
    led=material('18 | green status indicator',(.10,.64,.16),.05,.24,emission=.7)
    box('Cream terminal base unit',M['cream'],(cx,.037,z+.048),(.66,.51,.092),.025)
    box('Terminal base black front inset',M['rubber'],(cx,-.224,z+.048),(.249,.010,.047),.006)
    for x in (cx-.083,cx+.069): cylinder('Base controller dial',M['gold'],(x,-.240,z+.048),.017,.017,(math.pi/2,0,0),24,.002)
    sphere('Base green status lamp',led,(cx-.107,-.239,z+.048),(.009,.007,.009),16,8)
    for i in range(12): box('Base right air vent',M['black'],(cx+.218+i*.007,-.226,z+.048),(.002,.007,.033),.0005)
    cylinder('Display swivel pedestal',M['cream'],(cx,.075,z+.116),.11,.058,vertices=48,bevel=.008)
    sphere('Rounded egg-shaped CRT rear shell',M['cream'],(cx,.080,z+.413),(.342,.352,.343),48,24)
    # The rear bulbous shell and a soft flat front rim are separately modelled.
    box('CRT cream front bezel',M['cream'],(cx,-.181,z+.421),(.611,.161,.605),.076)
    rounded_front_box('CRT black rounded gasket',M['rubber'],(cx,-.269,z+.421),(.535,.025,.524),.069)
    screen_mesh('Convex green Saturn display',screen,cx,-.287,z+.421,.495,.480,.020)
    # Case seam follows the broad hemisphere; side vents are real recessed details.
    ring('CRT equatorial shell seam',M['rubber'],(cx,.080,z+.413),.340,.0012,segments=96)
    for i in range(10):
        for j in range(4):
            box('CRT side ventilation slots',M['black'],(cx-.325,.01+i*.020,z+.354+j*.030),(.003,.012,.015),.001)
    for dx in (-.236,.236):
        for dz in (-.236,.236): sphere('CRT face bezel screw',M['brass'],(cx+dx,-.270,z+.421+dz),(.004,.002,.004),12,6)
    # Vintage low-profile keyboard, individual keys, row offsets and spacebar.
    kx=1.03; ky=-.460
    box('Keyboard dark lower chassis',M['black'],(kx,ky,.882),(.495,.217,.037),.010)
    box('Keyboard brass upper chassis',M['brass'],(kx,ky,.904),(.479,.206,.014),.006)
    for row in range(4):
        for col in range(13):
            x=kx-.207+col*.033+(row%2)*.003
            y=ky+.071-row*.039
            box('Individual ivory keyboard key',M['keycap'],(x,y,.920),(.028,.030,.015),.003)
            # A simple incised symbol on each cap reads as authentic key lettering.
            box('Keyboard key engraved legend',M['darkwood'],(x-.004,y+.002,.928),(.006,.007,.001),.0003)
    box('Keyboard long spacebar',M['keycap'],(kx,ky-.083,.920),(.238,.027,.015),.003)
    for side in (-1,1):
        for i in range(3): box('Keyboard lower modifier',M['black'],(kx+side*(.141+i*.033),ky-.083,.920),(.028,.027,.015),.003)
    tube('Keyboard cloth-covered cord',M['rubber'],[(kx+.22,ky+.11,.89),(1.48,-.16,.876),(1.52,.09,.876),(1.33,.20,.90)],.004)


def book(name,x,y,z,width=.26,depth=.19,height=.045,angle=0):
    created=[]
    created.append(box(name+' aged page block',M['pages'],(x,y,z+height*.5),(width-.008,depth-.014,height-.012),.003))
    for zz in (z+.005,z+height-.005):
        created.append(box(name+' leather cover',M['leather'],(x,y,zz),(width,depth,.010),.004))
    created.append(box(name+' rounded leather spine',M['leather'],(x,y+depth*.5-.002,z+height*.5),(width,.019,height),.007))
    for offset in (-width*.36,width*.36):
        created.append(box(name+' embossed spine band',M['brass'],(x+offset,y+depth*.5+.008,z+height*.5),(.004,.002,height*.7),.001))
    for i in range(5):
        created.append(box(name+' individual page edges',M['darkwood'],(x,y-depth*.5+.006,z+.010+i*(height-.020)/5),(width-.015,.0012,.00065),0))
    if angle:
        for obj in created:
            dx,dy=obj.location.x-x,obj.location.y-y
            obj.location.x=x+dx*math.cos(angle)-dy*math.sin(angle)
            obj.location.y=y+dx*math.sin(angle)+dy*math.cos(angle)
            obj.rotation_euler.z+=angle


def globe_and_armillary():
    brass=M['brass']; gold=M['gold']
    x=-.405; y=.667; base=1.425
    # Turned base, vertical axis, gimbals and orbital arms.
    for dz,r,h in ((.009,.117,.018),(.027,.095,.017),(.055,.067,.041),(.097,.041,.043),(.134,.029,.041)):
        cylinder('Armillary turned brass pedestal',brass,(x,y,base+dz),r,h,vertices=40)
    center=(x,y,base+.323)
    sphere('Armillary central antique globe',M['globe'],center,(.112,.112,.112),40,20)
    for radius,rot in ((.175,(math.pi/2,0,0)),(.195,(math.pi/2,math.radians(25),0)),
                       (.163,(0,math.pi/2,math.radians(-18))),(.132,(0,0,0))):
        ring('Armillary concentric brass gimbal',brass,center,radius,.004,rot)
    tube('Armillary polar axis',gold,[(x,y,base+.105),(x,y,base+.562)],.006)
    sphere('Armillary polar finial',gold,(x,y,base+.557),(.009,.009,.014),20,10)
    tube('Armillary long planetary axis',brass,[(x-.255,y,center[2]-.017),(x+.303,y,center[2]+.017)],.004)
    for dx,r in ((-.255,.014),(.303,.026)):
        sphere('Armillary orbital planet',M['globe'],(x+dx,y,center[2]+dx*.065),(r,r,r),24,12)
    # Fine meridians on the central sphere, visible metal etched cartography.
    for i in range(6): ring('Globe fine longitude',gold,center,.1124,.00065,(math.pi/2,0,i*math.pi/6),48)
    for dz in (-.070,-.035,0,.035,.070):
        r=math.sqrt(.1125**2-dz**2)
        ring('Globe fine latitude',gold,(x,y,center[2]+dz),r,.00065,segments=48)
    # Smaller globe on a tall cylindrical scientific instrument pedestal.
    gx=-1.035; gy=.675
    for dz,r,h in ((.009,.081,.018),(.029,.067,.019),(.053,.054,.028),(.147,.032,.170),(.245,.022,.034)):
        cylinder('Small globe telescope-like turned stand',brass,(gx,gy,base+dz),r,h,vertices=32)
    gc=(gx,gy,base+.345)
    sphere('Small antique terrestrial globe',M['globe'],gc,(.086,.086,.086),32,16)
    ring('Small globe equatorial hoop',gold,gc,.088,.0025,segments=64)
    ring('Small globe tilted meridian',brass,gc,.096,.003,(math.pi/2,0,-.25),64)
    for dx in (-.061,.061): sphere('Small globe axis end',gold,(gx+dx,gy,base+.345),(.007,.006,.007),16,8)
    for offset in (-.034,.034):
        tube('Small instrument vertical rails',gold,[(gx+offset,gy-.014,base+.068),(gx+offset,gy-.014,base+.223)],.003)
    cylinder('Slim companion scientific instrument',brass,(-.827,.69,base+.101),.020,.18,vertices=24)
    cylinder('Slim instrument stepped base',gold,(-.827,.69,base+.019),.032,.02,vertices=24)
    sphere('Slim instrument finial',gold,(-.827,.69,base+.20),(.009,.009,.014),16,8)


def accessories():
    globe_and_armillary()
    for i in range(3): book('Rear shelf research volume',.080,.666,1.425+i*.045,.280,.132,.044,(-.035 if i%2 else .025))
    for i in range(2): book('Rear instrument atlas',-.704,.677,1.425+i*.034,.206,.121,.033,.018)
    # A pale notebook rests flat along the rear shelf.
    box('Closed pale notebook',M['keycap'],(-1.448,.670,1.435),(.362,.125,.016),.005)
    for i in range(2): book('Left terminal notebooks',.654,-.439,.870+i*.048,.240,.196,.047,-.055+i*.03)
    for i in range(2): book('Right tied leather journals',1.509,-.478,.870+i*.047,.297,.209,.046,.060-i*.025)
    # Leather straps wrapping around the right-hand journals.
    for x in (1.42,1.59):
        box('Journal leather tie strap',(M['darkwood']),(x,-.478,.969),(.011,.222,.003),.001)
        box('Journal strap front drop',M['darkwood'],(x,-.588,.920),(.011,.003,.093),.001)
    cylinder('Small brass dish',brass:=M['brass'],(1.306,-.429,.878),.045,.012,vertices=40)
    ring('Brass dish rim',M['gold'],(1.306,-.429,.886),.043,.0025,segments=40)
    sphere('Small collected mineral',M['globe'],(1.307,-.429,.895),(.020,.015,.011),16,8)
    # The stool sits forward of the console, with four narrow brass columns.
    sx=-.65; sy=-.775
    cylinder('Stool wide weighted foot',brass,(sx,sy,.028),.244,.037,vertices=64,bevel=.009)
    cylinder('Stool stepped foot highlight',M['gold'],(sx,sy,.049),.217,.012,vertices=64,bevel=.004)
    for dx,dy in ((-.038,-.038),(.038,-.038),(-.038,.038),(.038,.038)):
        cylinder('Stool slender brass support',brass,(sx+dx,sy+dy,.284),.009,.467,vertices=20)
        cylinder('Stool turned column collar',M['gold'],(sx+dx,sy+dy,.087),.013,.027,vertices=24)
    cylinder('Stool seat underside',M['darkwood'],(sx,sy,.516),.220,.026,vertices=64,bevel=.008)
    cylinder('Stool polished seat rim',brass,(sx,sy,.543),.250,.036,vertices=64,bevel=.010)
    cylinder('Stool dark leather seat cushion',M['seat'],(sx,sy,.571),.239,.033,vertices=64,bevel=.012)
    ring('Stool leather piping',M['seat'],(sx,sy,.580),.232,.003,segments=64)


def optimize_export():
    """Keep editable pieces; export a duplicate merged by material, under 40 calls."""
    collection=bpy.data.collections.new('ASTRODESK | optimized GLB')
    scene.collection.children.link(collection)
    copies=[]
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:
        copy=obj.copy(); copy.data=obj.data.copy(); collection.objects.link(copy)
        copies.append(copy)
    for obj in copies:
        if obj.type=='CURVE':
            bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True)
            bpy.context.view_layer.objects.active=obj
            bpy.ops.object.convert(target='MESH')
    by_material={}
    for obj in copies:
        if obj.type!='MESH': continue
        mat=obj.data.materials[0]
        by_material.setdefault(mat.name,[]).append(obj)
    root=bpy.data.objects.new('ASTRODESK__Reference_Ensemble',None)
    collection.objects.link(root)
    root['asset_id']='liminette-reference-astronomy-desk'
    root['units']='metres'; root['front']='-Y in Blender / +Z in glTF'
    root['reference_views']=4
    root['features']=['sloped orbital console','cabinet return','CRT terminal','keyboard','armillary sphere','globe','books','stool']
    merged=[]
    for name,objects in by_material.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects: obj.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1: bpy.ops.object.join()
        obj=bpy.context.view_layer.objects.active
        obj.name='ASTRODESK__'+name.split(' | ')[-1].replace(' ','_')
        obj.parent=root
        merged.append(obj)
    authored.hide_render=True
    authored.hide_viewport=True
    bpy.ops.object.select_all(action='DESELECT')
    root.select_set(True)
    for obj in merged: obj.select_set(True)
    bpy.context.view_layer.objects.active=root
    bpy.ops.export_scene.gltf(filepath=str(ASSET),export_format='GLB',
                              use_selection=True,use_active_scene=True,export_yup=True,export_apply=True,
                              export_extras=True,export_materials='EXPORT',
                              export_cameras=False,export_lights=False)
    triangles=sum(sum(len(p.vertices)-2 for p in obj.data.polygons) for obj in merged)
    report={'asset':str(ASSET),'triangles':triangles,'materialPrimitives':len(merged),
            'bytes':ASSET.stat().st_size,'editableComponents':len(parts),
            'furnitureDimensionsMetres':[3.5,1.5,.85],'front':'+Z in glTF'}
    (HERE/'asset-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print('ASTRONOMY_DESK_EXPORTED '+json.dumps(report))
    if triangles>150000 or len(merged)>40 or ASSET.stat().st_size>20*1024*1024:
        raise RuntimeError('Export exceeded the agreed runtime asset budget')
    return root


def presentation(root):
    # Studio objects belong to a separate collection, never to the GLB selection.
    studio=bpy.data.collections.new('PRESENTATION | excluded from GLB')
    scene.collection.children.link(studio)
    groundmat=material('Studio ground',(.72,.73,.71),roughness=.85)
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.005))
    ground=bpy.context.object; ground.name='Studio ground'; ground.data.materials.append(groundmat)
    for owner in list(ground.users_collection): owner.objects.unlink(ground)
    studio.objects.link(ground)
    world=bpy.data.worlds.new('Soft white reference studio'); world.use_nodes=True
    world.node_tree.nodes['Background'].inputs['Color'].default_value=(.78,.80,.82,1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35; scene.world=world
    for name,position,energy,size in [('Large softbox',(-3,-4,6),750,5),('Right softbox',(4,-1,3),400,4),('Rear stripbox',(-1,4,5),650,3)]:
        data=bpy.data.lights.new(name,'AREA'); data.energy=energy; data.shape='DISK'; data.size=size
        obj=bpy.data.objects.new(name,data); studio.objects.link(obj); obj.location=position
        obj.rotation_euler=(Vector((0,0,1))-obj.location).to_track_quat('-Z','Y').to_euler()
    data=bpy.data.cameras.new('Reference comparison camera'); camera=bpy.data.objects.new('Reference comparison camera',data)
    studio.objects.link(camera); scene.camera=camera; data.type='ORTHO'; data.ortho_scale=4.65
    scene.render.engine='CYCLES'; scene.cycles.samples=32; scene.cycles.use_denoising=True
    scene.render.resolution_x=1440; scene.render.resolution_y=1000; scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.view_settings.view_transform='AgX'
    views=[('01-front',(.05,-7.8,3.40)),('02-left-profile',(-5.8,-3.3,2.7)),
           ('03-left-three-quarter',(-4.9,-5.5,4.0)),('04-right-three-quarter',(5.0,-5.3,3.65))]
    camera.location=views[0][1]
    camera.rotation_euler=(Vector((0,.04,.96))-camera.location).to_track_quat('-Z','Y').to_euler()
    # Save before rendering too, so a render interruption cannot lose the asset.
    bpy.data.libraries.write(str(HERE/'liminette-astronomy-desk.blend'), {scene}, fake_user=True, compress=True)
    requested=os.environ.get('ASTRODESK_RENDER_VIEWS', 'all')
    for name,position in views:
        if requested!='all' and name not in requested.split(','): continue
        camera.location=position
        camera.rotation_euler=(Vector((0,.04,.96))-camera.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=str(EVIDENCE/(name+'.png'))
        bpy.ops.render.render(write_still=True)
    bpy.ops.object.select_all(action='DESELECT'); root.select_set(True)
    bpy.context.view_layer.objects.active=root
    bpy.data.libraries.write(str(HERE/'liminette-astronomy-desk.blend'), {scene}, fake_user=True, compress=True)


M=make_materials()
furniture()
instruments()
terminal()
accessories()
veneer_uvs()
root=optimize_export()
presentation(root)
print('ASTRONOMY_DESK_COMPLETE')
