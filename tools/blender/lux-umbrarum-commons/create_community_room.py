"""Reproducible, fully modelled Lux Umbrarum community lounge.

Blender metres, Z up, front -Y; GLB exports Y up, north -Z.
Run in a separate Blender process or through the installed official Blender MCP.
All maps are generated locally, baked to PNG, packed and embedded in the GLB.
"""
from pathlib import Path
import math
import json
import random
import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
ASSET=ROOT/'public/apartments/assets/lux-umbrarum-community-room.glb'
EVIDENCE=ROOT/'test-artifacts/lux-umbrarum-community-room'
TEXTURES=HERE/'textures'
for folder in (ASSET.parent,EVIDENCE,TEXTURES): folder.mkdir(parents=True,exist_ok=True)
random.seed(62026)
rng=np.random.default_rng(62026)
scene=bpy.data.scenes.new('Lux Umbrarum | Community Room')
bpy.context.window.scene=scene
scene['generator']='lux-umbrarum-community-room'
# Replace only previous generated common-room scenes in this authoring session.
# Other projects, scenes, preferences and startup settings remain untouched.
for previous in list(bpy.data.scenes):
    if previous==scene or not previous.name.startswith('Lux Umbrarum | Community Room'): continue
    owned=[obj for obj in previous.objects if obj.name.startswith('COMMONS__Lux_Umbrarum') and obj.get('layout_json')]
    if not owned: continue
    collections=list(previous.collection.children)
    for obj in list(previous.objects):
        if not any(obj.name in other.objects for other in bpy.data.scenes if other!=previous): bpy.data.objects.remove(obj,do_unlink=True)
    bpy.data.scenes.remove(previous)
    for collection in collections:
        if collection.users==0: bpy.data.collections.remove(collection)
scene.name='Lux Umbrarum | Community Room'
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=1
authored=bpy.data.collections.new('COMMONS | editable architecture and furniture')
scene.collection.children.link(authored)
parts=[]
colliders=[]
zone='interior'

def image(name,pixels,data=False):
    if pixels.ndim==2: pixels=np.repeat(pixels[:,:,None],3,axis=2)
    h,w=pixels.shape[:2]
    rgba=np.ones((h,w,4),dtype=np.float32); rgba[:,:,:3]=pixels
    img=bpy.data.images.new(name,width=w,height=h,alpha=False)
    img.colorspace_settings.name='Non-Color' if data else 'sRGB'
    img.pixels.foreach_set(np.flipud(rgba).ravel())
    img.filepath_raw=str(TEXTURES/(name+'.png')); img.file_format='PNG'; img.save()
    img=bpy.data.images.load(img.filepath_raw,check_existing=False); img.pack()
    img.colorspace_settings.name='Non-Color' if data else 'sRGB'
    return img

def normal(height,strength=2):
    dy,dx=np.gradient(height)
    n=np.stack((-dx*strength,dy*strength,np.ones_like(dx)),axis=-1)
    n/=np.linalg.norm(n,axis=-1,keepdims=True)
    return n*.5+.5

def material(name,color,rough=.6,metal=0,base=None,bump=None,emission=0):
    mat=bpy.data.materials.new(name); mat.use_nodes=True
    shader=mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value=(*color,1)
    shader.inputs['Roughness'].default_value=rough
    shader.inputs['Metallic'].default_value=metal
    for pixels,socket,data in [(base,'Base Color',False),(bump,'Normal',True)]:
        if pixels is None: continue
        tex=mat.node_tree.nodes.new('ShaderNodeTexImage'); tex.image=image(name+'-'+socket,pixels,data)
        if data:
            n=mat.node_tree.nodes.new('ShaderNodeNormalMap'); n.inputs['Strength'].default_value=.8
            mat.node_tree.links.new(tex.outputs['Color'],n.inputs['Color'])
            mat.node_tree.links.new(n.outputs['Normal'],shader.inputs['Normal'])
        else: mat.node_tree.links.new(tex.outputs['Color'],shader.inputs[socket])
    if emission:
        shader.inputs['Emission Color'].default_value=(*color,1)
        shader.inputs['Emission Strength'].default_value=emission
    return mat

y,x=np.mgrid[:1024,:1024].astype(np.float32)/1024
grain=.45+.06*np.sin(x*330+np.sin(y*14)*3)+.035*np.sin(x*1290+y*11)+rng.normal(0,.012,x.shape)
oak=material('Honey oak', (1,1,1),.64,base=np.array([.45,.34,.23])+grain[:,:,None]*np.array([.17,.14,.10]),bump=normal(grain,.5))
# Irregular curled yarn, baked once. The UVs below use real fabric-scale repeats.
weave=rng.normal(0,.11,x.shape)
for offset in (0,.37):
    xx=(x*92+offset+np.sin(y*140)*.12)%1-.5
    yy=(y*92+offset+np.sin(x*155)*.12)%1-.5
    weave+=np.exp(-((np.sqrt(xx*xx+yy*yy)-.28)/.08)**2)*.45
cloth=material('Ivory boucle', (1,1,1),.96,base=np.clip(np.array([.79,.74,.64])+weave[:,:,None]*.13,0,1),bump=normal(weave,4))
cloth.node_tree.nodes.get('Principled BSDF').inputs['Sheen Weight'].default_value=.25
carpet=material('Warm wool carpet',(.65,.59,.49),.99,bump=normal(weave,5))
plaster=material('Warm lime plaster',(1,1,1),.88,base=np.clip(np.array([.77,.70,.57])+rng.normal(0,.006,(1024,1024,1)),0,1))
enamel=material('Cream enamel',(.78,.73,.62),.35)
brass=material('Champagne brass',(.64,.49,.26),.28,.82)
gold=material('Brass leaf ribs',(.78,.64,.36),.34,.72)
black=material('Charcoal acoustic fabric',(.022,.021,.018),.86)
dark=material('Deep oak shadows',(.105,.074,.041),.72)
paper=material('Ivory book pages',(.71,.67,.56),.93)
bookmats=[material('Book cloth '+str(i),c,.88) for i,c in enumerate([(.37,.31,.23),(.53,.47,.34),(.66,.60,.46),(.21,.22,.19),(.76,.71,.59)])]
ceramic=material('Alabaster ceramics',(.81,.78,.69),.42)
glass=material('Faceted crystal',(.65,.75,.79),.09,.32)
lamp=material('Warm opal diffusers',(.95,.78,.45),.38,emission=.6)
chart_ink=material('Warm phosphor chart',(.52,.46,.32),.7,emission=.22)

def celestial_screen_texture():
    # Bake the fine constellation drafting into the screen; it remains legible
    # through WebGL mipmapping instead of breaking up into subpixel tubes.
    chart_rng=np.random.default_rng(713)
    qx=(x-.5)*4.25+.14; qy=(y-.5)*2.22+.05
    radius=np.hypot(qx,qy); angle=np.arctan2(qy,qx)
    pixels=np.zeros((1024,1024,3),dtype=np.float32)+np.array([.13,.14,.125])
    pixels+=chart_rng.normal(0,.003,(1024,1024,1))
    grid=np.zeros_like(x)
    for r in (.20,.42,.63,.83,1.03): grid=np.maximum(grid,np.exp(-((radius-r)/.0035)**2))
    for a in np.linspace(0,math.tau,12,endpoint=False):
        grid=np.maximum(grid,np.exp(-(np.sin(angle-a)*radius/.0023)**2)*(radius<1.035))
    pixels+=grid[:,:,None]*np.array([.25,.24,.18])
    stars=[]
    for i in range(115):
        a=chart_rng.uniform(0,math.tau); r=chart_rng.uniform(.08,1.0)
        px=math.cos(a)*r; py=math.sin(a)*r; stars.append((px,py))
        strength=.55 if i%5==0 else .32
        dot=np.exp(-((qx-px)**2+(qy-py)**2)/(.000025 if i%5==0 else .000011))
        pixels+=dot[:,:,None]*strength
    for i in range(0,100,5):
        px,py=stars[i]
        for bx,by in sorted(stars,key=lambda p:math.dist(p,stars[i]))[1:3]:
            dx=bx-px; dy=by-py
            t=np.clip(((qx-px)*dx+(qy-py)*dy)/(dx*dx+dy*dy),0,1)
            d=np.hypot(qx-px-t*dx,qy-py-t*dy)
            pixels+=np.exp(-(d/.0024)**2)[:,:,None]*np.array([.20,.20,.16])
    return np.clip(pixels,0,1)

screen=material('Celestial CRT phosphor',(.13,.14,.125),.74,base=celestial_screen_texture(),emission=.3)
screen_nodes=screen.node_tree.nodes
screen.node_tree.links.new(next(n for n in screen_nodes if n.type=='TEX_IMAGE').outputs['Color'],screen_nodes.get('Principled BSDF').inputs['Emission Color'])
stone=material('Distant sandstone',(.43,.40,.33),.95)
mountain=material('Hazy mountain limestone',(.46,.46,.39),1)
water=material('Quiet lake',(.48,.59,.59),.24,.22)

def own(obj,name,mat=None):
    obj.name=name
    for c in list(obj.users_collection): c.objects.unlink(obj)
    authored.objects.link(obj)
    if mat: obj.data.materials.append(mat)
    obj['zone']=zone; parts.append(obj)
    return obj

def finish(obj,bevel=0,smooth=True):
    if bevel:
        mod=obj.modifiers.new('Soft manufactured edges','BEVEL'); mod.width=bevel; mod.segments=3
    for p in obj.data.polygons: p.use_smooth=smooth
    if bevel:
        mod=obj.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL'); mod.keep_sharp=True
    return obj

def mesh_object(name,mat,verts,faces,uvs=None):
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    if uvs:
        uv=mesh.uv_layers.new(name='Surface UV')
        for poly in mesh.polygons:
            for loop in poly.loop_indices:
                uv.data[loop].uv=uvs[mesh.loops[loop].vertex_index]
    return own(bpy.data.objects.new(name,mesh),name,mat)

def box(name,mat,p,size,bevel=.012,rotation=(0,0,0)):
    verts=[]; faces=[]; uvs=[]
    for axis in range(3):
        other=[i for i in range(3) if i!=axis]
        for side in (-1,1):
            start=len(verts)
            for u,v in ((0,0),(1,0),(1,1),(0,1)):
                co=[0,0,0]; co[axis]=side*size[axis]/2
                co[other[0]]=(u-.5)*size[other[0]]; co[other[1]]=(v-.5)*size[other[1]]
                verts.append(co); uvs.append((u*size[other[0]],v*size[other[1]]))
            indices=tuple(range(start,start+4))
            faces.append(indices if side*(1 if axis!=1 else -1)>0 else indices[::-1])
    obj=mesh_object(name,mat,verts,faces,uvs); obj.location=p; obj.rotation_euler=rotation
    # Weld face vertices before bevel, keeping UV seams on the loops.
    bm=bmesh.new(); bm.from_mesh(obj.data); bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001); bm.to_mesh(obj.data); bm.free()
    return finish(obj,bevel)

def sphere(name,mat,p,size,segments=24,rings=12):
    verts=[]; faces=[]; uvs=[]
    for j in range(rings+1):
        a=math.pi*j/rings
        for i in range(segments+1):
            t=math.tau*i/segments
            verts.append((size[0]*math.sin(a)*math.cos(t),size[1]*math.sin(a)*math.sin(t),size[2]*math.cos(a))); uvs.append((i/segments,j/rings))
    for j in range(rings):
        for i in range(segments):
            q=j*(segments+1)+i; faces.append((q,q+segments+1,q+segments+2,q+1))
    obj=mesh_object(name,mat,verts,faces,uvs); obj.location=p
    return finish(obj)

def cylinder(name,mat,p,r,h,rotation=(0,0,0),vertices=40):
    verts=[]; faces=[]; uvs=[]
    for z in (-h/2,h/2):
        for i in range(vertices):
            a=i*math.tau/vertices; verts.append((r*math.cos(a),r*math.sin(a),z)); uvs.append((r*math.cos(a),r*math.sin(a)))
    faces.extend([tuple(reversed(range(vertices))),tuple(range(vertices,vertices*2))])
    faces.extend((i,(i+1)%vertices,(i+1)%vertices+vertices,i+vertices) for i in range(vertices))
    obj=mesh_object(name,mat,verts,faces,uvs); obj.location=p; obj.rotation_euler=rotation
    return finish(obj,min(.012,h*.1))

def tube(name,mat,points,r=.008):
    curve=bpy.data.curves.new(name,'CURVE'); curve.dimensions='3D'
    curve.resolution_u=1; curve.bevel_depth=r; curve.bevel_resolution=1
    spline=curve.splines.new('POLY'); spline.points.add(len(points)-1)
    for p,co in zip(spline.points,points): p.co=(*co,1)
    obj=bpy.data.objects.new(name,curve); authored.objects.link(obj)
    curve.materials.append(mat); obj['zone']=zone; parts.append(obj)
    return obj

def ring(name,mat,p,r,minor=.012,rotation=(0,0,0)):
    verts=[]; faces=[]
    for i in range(72):
        t=i*math.tau/72
        for j in range(8):
            a=j*math.tau/8; verts.append(((r+minor*math.cos(a))*math.cos(t),(r+minor*math.cos(a))*math.sin(t),minor*math.sin(a)))
    for i in range(72):
        for j in range(8): faces.append((i*8+j,((i+1)%72)*8+j,((i+1)%72)*8+(j+1)%8,i*8+(j+1)%8))
    obj=mesh_object(name,mat,verts,faces); obj.location=p; obj.rotation_euler=rotation
    return finish(obj)

def label(text,p,size=.13,mat=brass,rotation=(math.pi/2,0,0),align='CENTER'):
    data=bpy.data.curves.new('Engraved lettering','FONT'); data.body=text; data.size=size
    data.align_x=align; data.align_y='CENTER'; data.extrude=.0005; data.resolution_u=2
    obj=bpy.data.objects.new(text,data); authored.objects.link(obj); obj.location=p; obj.rotation_euler=rotation
    data.materials.append(mat); obj['zone']=zone; parts.append(obj)
    return obj

def collide(x,y,w,d,top,bottom=0):
    colliders.append({'min':[x-w/2,bottom,-y-d/2],'max':[x+w/2,top,-y+d/2]})

def pillow(name,p,size,rotation=(0,0,0)):
    # A welded superellipsoid is closed, softly stuffed, and continuous at seams.
    verts=[]; faces=[]; uvs=[]
    n=14
    for axis in range(3):
        others=[i for i in range(3) if i!=axis]
        for side in (-1,1):
            start=len(verts)
            for j in range(n+1):
                for i in range(n+1):
                    u=2*i/n-1; v=2*j/n-1
                    direction=[0,0,0]; direction[axis]=side; direction[others[0]]=u; direction[others[1]]=v
                    direction=Vector(direction).normalized()
                    co=[math.copysign(abs(direction[k])**.35,direction[k])*size[k]*.5 for k in range(3)]
                    puff=(max(0,1-u*u)*max(0,1-v*v))**.6
                    co[axis]+=math.sin(u*16+v*4)*math.sin(v*18)*.003*puff
                    verts.append(co); uvs.append((i/n,j/n))
            for j in range(n):
                for i in range(n):
                    q=start+j*(n+1)+i
                    indices=(q,q+1,q+n+2,q+n+1)
                    # Axes 0/2 use the same handedness, axis 1 the opposite.
                    faces.append(indices if side*(1 if axis!=1 else -1)>0 else indices[::-1])
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    uv=mesh.uv_layers.new(name='Cloth UV')
    for poly in mesh.polygons:
        for loop in poly.loop_indices: uv.data[loop].uv=uvs[mesh.loops[loop].vertex_index]
    bm=bmesh.new(); bm.from_mesh(mesh); bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces)); bm.to_mesh(mesh); bm.free()
    obj=bpy.data.objects.new(name,mesh); authored.objects.link(obj); obj.location=p; obj.rotation_euler=rotation
    mesh.materials.append(cloth); obj['zone']=zone; parts.append(obj)
    return finish(obj)

def book(p,w=.35,d=.46,h=.075,index=0,rotation=0,title=None):
    mat=bookmats[index%len(bookmats)]
    for dz in (-h/2,h/2): box('Cloth book cover',mat,(p[0],p[1],p[2]+dz),(w,d,.010),.003,(0,0,rotation))
    box('Layered page block',paper,p,(w*.95,d*.96,max(.015,h-.012)),.002,(0,0,rotation))
    if title:
        label(title,(p[0],p[1]-d/2-.003,p[2]),min(.027,h*.36),gold)

# Curved architecture and furniture are shared with the walking profile.
exec(compile((HERE/'curved_lounge.py').read_text(),str(HERE/'curved_lounge.py'),'exec'))

# Heavy oval oak coffee table on three rounded pedestal legs.
table_start=len(parts)
table=cylinder('Oval oak conversation table',oak,(0,-1.53,-.055),1.72,.14,vertices=72); table.scale.y=.69
for x0,y0 in [(-1.02,-1.82),(.95,-1.82),(0,-.87)]: cylinder('Coffee table solid oak leg',oak,(x0,y0,-.35),.28,.37)
collide(0,-2.33,3.45,2.38,.04,-.54)
for x0,y0,count in [(-.9,-1.38,4),(.62,-1.83,3),(.65,-1.15,3),(-.05,-1.92,2)]:
    for i in range(count): book((x0,y0,.025+i*.073),.58,.43,.061,i,random.uniform(-.06,.06))
cylinder('Small brass bowl',(brass),(.70,-1.78,.286),.145,.04)
cylinder('Table brass tray',brass,(-.67,-1.98,.045),.16,.018)
for obj in parts[table_start:]: obj.location.y-=.80

# Media wall: complete ensemble placed on the left angled side wall.
media_start=len(parts)
frame=box('Rounded ivory star-map frame',enamel,(-4.10,4.99,2.13),(4.50,.19,1.95),.16)
frame.location.z=2.30; frame.scale.z=2.48/1.95
display=box('Charcoal celestial display',screen,(-4.10,4.875,2.13),(4.25,.024,1.70),.10)
display.location.z=2.30; display.scale.z=2.22/1.70
for poly in display.data.polygons:
    for loop in poly.loop_indices:
        co=display.data.vertices[display.data.loops[loop].vertex_index].co
        display.data.uv_layers.active.data[loop].uv=(co.x/4.25+.5,co.z/1.70+.5)
label('QUIET ORBITS',(-2.65,4.845,2.73),.065,chart_ink)
label('OBSERVE\nLISTEN\nTOGETHER',(-2.66,4.845,2.44),.066,chart_ink)
for x0 in (-6.57,-1.62):
    for z in (1.47,2.02,2.57):
        cylinder('Circular acoustic driver',black,(x0,4.865,z),.22,.04,(math.pi/2,0,0))
        ring('Speaker brass rim',brass,(x0,4.835,z),.227,.012,(math.pi/2,0,0))
        sphere('Speaker cone centre',dark,(x0,4.823,z),(.06,.01,.06),16,8)
box('Long curved cream hi-fi cabinet',enamel,(-4.02,4.70,.49),(5.8,.72,.93),.13)
box('Recessed music equipment shadow',dark,(-4.02,4.31,.62),(3.82,.035,.57),.012)
for x0 in (-5.18,-4.71,-4.24):
    cylinder('Open reel face',ceramic,(x0,4.269,.71),.195,.025,(math.pi/2,0,0))
    for t in np.linspace(0,math.tau,6,endpoint=False):
        sphere('Reel-to-reel aperture',black,(x0+math.cos(t)*.112,4.25,.71+math.sin(t)*.112),(.047,.006,.047),12,6)
    cylinder('Tape reel spindle',brass,(x0,4.236,.71),.027,.022,(math.pi/2,0,0),16)
box('Vintage tuner front',enamel,(-3.53,4.265,.57),(1.02,.06,.31),.018)
for i in range(8): cylinder('Tuner rotary dial',brass,(-3.96+i*.123,4.224,.50),.022,.023,(math.pi/2,0,0),16)
box('Radio display',black,(-3.53,4.22,.63),(.86,.01,.08),.005)
for i in range(11): box('Record sleeves',bookmats[i%5],(-2.32+i*.030,4.45,.62),(.018,.28,.49),.003,(0,0,random.uniform(-.04,.04)))
for x0 in (-6.18,-1.35):
    sphere('Warm globe console light',lamp,(x0,4.52,1.14),(.23,.23,.23),32,16)
    cylinder('Globe lamp base',brass,(x0,4.52,.955),.12,.045)
    for i in range(3): book((x0+.36,4.53,.97+i*.06),.34,.35,.048,i)
bpy.context.view_layer.update()
media_angle=math.atan2(3.05,5.7)
wall_fit(parts[media_start:],(-4.10,4.99),(-4.25,3.56),media_angle)
rotated_collider(None,(-4.21,3.27),media_angle,5.8,.82,1.0)

# Library cabinet faces into the room from the right angled side wall.
library_start=len(parts)
box('Oak library backing',dark,(5.45,5.00,1.70),(2.78,.09,3.36),.008)
for x0 in (4.06,4.99,5.92,6.85): box('Library upright',oak,(x0,4.82,1.69),(.065,.45,3.36),.007)
for z in (.83,1.36,1.89,2.42,2.95,3.38): box('Library shelf',oak,(5.45,4.82,z),(2.84,.48,.065),.006)
for x0 in (4.50,5.44,6.38):
    box('Library base door',oak,(x0,4.565,.40),(.89,.035,.77),.016)
    cylinder('Cupboard brass pull',brass,(x0+.3,4.535,.43),.012,.02,(math.pi/2,0,0),12)
    for row in range(5):
        z=.87+row*.53
        for i in range(8):
            h=random.uniform(.25,.43); w=random.uniform(.035,.070)
            px=x0-.38+i*.093
            box('Standing library book',bookmats[(i+row)%5],(px,4.78,z+h/2),(w,.27,h),.003,(0,random.uniform(-.09,.09),0))
            for line in (.20,.76): box('Book spine gilt rule',brass,(px,4.639,z+h*line),(w*.80,.004,.005),.001)
        if row%2==0:
            sphere('Alabaster shelf vessel',ceramic,(x0+.33,4.71,z+.16),(.085,.085,.14),20,12)
bpy.context.view_layer.update()
for obj in parts[library_start:]:
    obj.matrix_world=Matrix.Translation(Vector((5.45,4.82,0))) @ Matrix.Diagonal(Vector((1.35,1,1.12,1))) @ Matrix.Translation(Vector((-5.45,-4.82,0))) @ obj.matrix_world
library_angle=math.atan2(-3.05,3.1)
wall_fit(parts[library_start:],(5.45,4.82),(5.43,3.62),library_angle)
rotated_collider(None,(5.43,3.62),library_angle,3.83,.60,3.8)
box('Framed community motto',oak,(3.18,4.98,2.17),(.88,.04,1.38),.016)
box('Motto parchment',paper,(3.18,4.952,2.17),(.85,.012,1.35),.001)
label('COMMON\nPEOPLE\nKINDER\nPLANETS',(3.18,4.94,2.21),.13,dark)

# Window bench, ceramics, reading chair and matching footstool.
box('Long window bench',oak,(.9,4.27,.47),(3.57,.52,.105),.06)
for x0 in (-.72,2.52): box('Bench tapered leg',oak,(x0,4.27,.22),(.09,.42,.44),.015,(0,.10 if x0<0 else -.10,0))
collide(.9,4.27,3.57,.55,.54)
for i in range(4): book((-.04,4.21,.56+i*.061),.39,.33,.050,i)
ring('Sculptural stone ring',ceramic,(1.52,4.28,.78),.245,.082,(math.pi/2,0,0))
sphere('Bench stone orb',ceramic,(.93,4.24,.65),(.10,.10,.10))
def lounge_chair(x0,y0):
    cylinder('Chair pedestal',black,(x0,y0,.23),.04,.43)
    for t in np.linspace(0,math.tau,4,endpoint=False): tube('Reading chair star base',black,[(x0,y0,.12),(x0+math.cos(t)*.4,y0+math.sin(t)*.4,.06)],.021)
    box('Bent oak lounge seat',oak,(x0,y0,.48),(.87,.85,.12),.1)
    pillow('Cream leather lounge seat',(x0,y0-.02,.58),(.88,.85,.22))
    box('Bent oak lounge back',oak,(x0,y0+.34,.93),(.84,.16,.85),.12,(math.radians(-14),0,0))
    pillow('Cream lounge back',(x0,y0+.25,.98),(.78,.20,.76),(math.radians(-14),0,0))
    for side in (-1,1): pillow('Curved chair arm',(x0+side*.46,y0,.67),(.20,.63,.22))
    pillow('Reading ottoman',(x0-.42,y0-.92,.39),(.84,.62,.21))
    cylinder('Ottoman pedestal',black,(x0-.42,y0-.92,.17),.035,.33)
    for side in (-1,1): tube('Ottoman feet',black,[(x0-.42,y0-.92,.09),(x0-.42+side*.30,y0-.92,.04)],.019)
    collide(x0,y0,1.15,1.15,1.4); collide(x0-.42,y0-.92,.88,.66,.51)
lounge_chair(4.42,3.45)
cylinder('Small reading side table',oak,(5.29,3.40,.61),.27,.05)
for t in (0,math.tau/3,math.tau*2/3): tube('Tripod table legs',brass,[(5.29,3.40,.59),(5.29+math.cos(t)*.21,3.40+math.sin(t)*.21,.02)],.01)
for i in range(5): sphere('Stacked alabaster ornament',ceramic,(5.29,3.40,.67+i*.038),(.10-i*.010,.10-i*.010,.022))
cylinder('Reading lamp upright',brass,(4.91,4.10,.89),.018,1.72)
sphere('Mushroom lamp diffuser',lamp,(4.91,4.10,1.64),(.26,.26,.18))

# Botanical metalwork: shaped leaf surfaces, open lobes, polished ribs and stems.
def plant(x0,y0,height=1.35):
    sphere('Spun brass planter',brass,(x0,y0,.20),(.30,.30,.24))
    cylinder('Planter open soil',dark,(x0,y0,.36),.25,.016)
    collide(x0,y0,.62,.62,.42)
    for leaf in range(6):
        t=leaf*2.399; tip=Vector((x0+math.cos(t)*.55,y0+math.sin(t)*.55,.55+height*(.4+leaf*.09)))
        base=Vector((x0,y0,.35)); stem_end=tip-Vector((math.cos(t)*.22,math.sin(t)*.22,.12))
        tube('Botanical brass stalk',gold,[base,base.lerp(stem_end,.4)+Vector((0,0,.12)),stem_end],.010)
        center=tip; u=Vector((-math.sin(t),math.cos(t),0)); v=Vector((math.cos(t)*.36,math.sin(t)*.36,.86)).normalized()
        verts=[]; faces=[]; n=16; m=10
        for row in range(n+1):
            a=row/n; width=math.sin(math.pi*a)**.7*.29
            for col in range(m+1):
                b=2*col/m-1
                co=center+v*((a-.5)*.65)+u*(b*width)+Vector((0,0,(1-b*b)*math.sin(math.pi*a)*.09))
                verts.append(co)
        for row in range(n):
            for col in range(m):
                if row in (4,7,10) and col in (0,1,8,9): continue
                q=row*(m+1)+col; faces.append((q,q+1,q+m+2,q+m+1))
        # Open wirework, so the leaf ribs and window remain visible through it.
        for sign in (-1,1):
            outline=[]
            for a in np.linspace(0,1,36):
                width=math.sin(math.pi*a)**.7*.29
                outline.append(center+v*((a-.5)*.65)+u*(sign*width))
            tube('Open brass leaf outline',gold,outline,.005)
        tube('Leaf central rib',gold,[center+v*((a-.5)*.65) for a in np.linspace(0,1,20)],.004)
        for a in np.linspace(.07,.93,18):
            width=math.sin(math.pi*a)**.7*.29
            for sign in (-1,1):
                points=[center+v*((a-.5+f*.05)*.65)+u*(sign*width*f)+Vector((0,0,math.sin(f*math.pi)*.05)) for f in np.linspace(0,1,9)]
                tube('Fine metallic leaf veins',gold,points,.006)
for x0,y0,h in [(-6.12,.12,1.3),(-1.85,3.45,1.7),(3.08,3.57,1.0),(6.35,.12,1.35)]: plant(x0,y0,h)
# Small flower arrangement on the conversation table.
cylinder('Flower vase',brass,(0,-2.22,.16),.13,.26)
for i in range(6):
    t=i*2.4; p=(math.cos(t)*.30,-2.22+math.sin(t)*.20,.54+i*.055)
    tube('Flower stem',gold,[(0,-2.22,.23),(p[0]*.6,-2.22+(p[1]+2.22)*.6,p[2]*.7),p],.005)
    for k in range(5):
        a=k*math.tau/5
        sphere('Metal flower petal',brass,(p[0]+math.cos(a)*.046,p[1]+math.sin(a)*.046,p[2]),(.040,.024,.040),12,6)

# Four suspended wire chandeliers, visibly connected to ceiling canopies.
for index,(x0,y0) in enumerate([(-2.0,1.65),(-.3,2.7),(2.45,1.83),(4.23,2.75)]):
    cylinder('Ceiling opal canopy',enamel,(x0,y0,3.955),.39,.07)
    ring('Chandelier upper brass ring',gold,(x0,y0,3.90),.30,.009)
    for j in range(10):
        t=j*math.tau/10; length=random.uniform(.85,1.57)
        pts=[]
        for f in np.linspace(0,1,40):
            pts.append((x0+math.cos(t+f*2.3)*(.30*(1-f)+.14)+math.sin(f*9+j)*.045,y0+math.sin(t+f*2.3)*(.30*(1-f)+.14),3.89-f*length))
        tube('Wandering chandelier brass strand',gold,pts,.004)
        tip=pts[-1]
        sphere('Crystal teardrop',glass,(tip[0],tip[1],tip[2]-.04),(.027,.027,.067),10,5)
        if j%3==0: sphere('Small crystal bead',glass,pts[25],(.022,.022,.036),10,5)

# Fully three-dimensional lakeside Gothic skyline beyond the circular opening.
zone='exterior'
box('Lake horizon',water,(.9,105,-2.3),(360,280,.1),0)
for ridge in range(3):
    verts=[]; faces=[]; yy=155+ridge*75; nx=96; ny=20
    peaks=[(random.uniform(-145,145),random.uniform(8,38),random.uniform(7,22)) for _ in range(9)]
    for j in range(ny+1):
        for i in range(nx+1):
            xx=-180+i*360/nx; dy=j*55/ny
            h=sum(hh*math.exp(-((xx-px)/20)**2-((dy-py)/12)**2) for px,py,hh in peaks)
            h+=.35*math.sin(xx*.23+dy*.35)+.16*math.sin(xx*.61-dy*.41)
            verts.append((xx,yy+dy,-3.0+h*(.58+ridge*.2)))
    for j in range(ny):
        for i in range(nx):
            q=j*(nx+1)+i; faces.append((q,q+1,q+nx+2,q+nx+1))
    mesh=bpy.data.meshes.new('Mountain ridge'); mesh.from_pydata(verts,[],faces)
    obj=bpy.data.objects.new('Distant mountain ridge',mesh); authored.objects.link(obj); mesh.materials.append(mountain)
    obj['zone']=zone; parts.append(obj); finish(obj)
for i in range(27):
    xx=14+random.uniform(-18,18); yy=random.uniform(80,115); h=random.uniform(8,16)
    width=random.uniform(1.5,3.5); depth=random.uniform(1.7,3)
    box('Sandstone college tower',stone,(xx,yy,h*.5-1), (width,depth,h),.12)
    for level in range(1,int(h/2.7)):
        for dx in (-.26,.26):
            box('Distant lancet window',dark,(xx+dx*width,yy-depth/2-.018,level*2.7),(width*.10,.04,1.15),.06)
        box('Sandstone stringcourse',stone,(xx,yy,level*2.7+.7),(width+.18,depth+.15,.11),.015)
    for dx in (-.48,.48): box('Gothic tower buttress',stone,(xx+dx*width,yy-depth/2-.17,h*.45-1),(.18,.35,h*.9),.02)
    bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=1.5,radius2=.06,depth=h*.36,location=(xx,yy,h+h*.18-1))
    own(bpy.context.object,'Slender Gothic spire',stone)
for xx,yy,h in [(14,110,24),(21,117,18),(6,115,16)]:
    box('Landmark Gothic tower',stone,(xx,yy,h*.5-1),(2.3,2.8,h),.1)
    for level in range(1,int(h/2.5)):
        for dx in (-.55,.55): box('Landmark lancet',dark,(xx+dx,yy-1.43,level*2.5),(.28,.045,1.4),.1)
        box('Landmark ornate cornice',stone,(xx,yy,level*2.5+.88),(2.55,3.02,.13),.015)
    for dx in (-1.15,1.15):
        box('Needle buttress',stone,(xx+dx,yy-1.48,h*.5-1),(.2,.36,h),.02)
        bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=.38,radius2=.01,depth=4,location=(xx+dx,yy-1.48,h+1))
        own(bpy.context.object,'Smaller sandstone pinnacle',stone)
    bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=1.8,radius2=.02,depth=8,location=(xx,yy,h+3))
    own(bpy.context.object,'Landmark needle pinnacle',stone)

# Fit the distant skyline inside the window and ground it on a lakeside bank.
for obj in parts:
    if obj['zone']=='exterior' and obj.data.materials[0] in (stone,dark):
        obj.location.x=14+(obj.location.x-14)*.55
        obj.location.y=110+(obj.location.y-110)*.55
        obj.location.z=-2+(obj.location.z+2)*.45
        obj.scale.x*=.55; obj.scale.y*=.55; obj.scale.z*=.45
sphere('Collegiate lakeside bank',mountain,(14,110,-3.05),(18,17,1.85),48,20)

LAYOUT={
 'id':'lux-umbrarum-community-room','dimensions':[14.2,12.6,4.15],
 'bounds':{'minX':-9.5,'maxX':9.5,'minZ':-5.0,'maxZ':9.7},
 'pit':{'shape':'ellipse','center':[0,1.7],'radii':list(PIT_RADII),'height':-.54},
 'stairs':stairs,'colliders':colliders,
 'walkable':[
   {'shape':'polygon','points':[[-7,-2.2],[-1.4,-5.1],[4,-5.1],[7,-2.2],[7,7.16],[-7,7.16]]},
   {'shape':'rectangle','minX':-9.4,'maxX':-6.8,'minZ':-1.85,'maxZ':-.05},
   {'shape':'rectangle','minX':6.8,'maxX':9.4,'minZ':-1.85,'maxZ':-.05},
   {'shape':'rectangle','minX':-1.28,'maxX':1.28,'minZ':6.9,'maxZ':9.7},
 ],
 'architecture':{'sofa':'continuous elliptical upholstered arcs','sofaArcs':SOFA_ARCS,
   'mediaWall':{'center':[-4.25,3.56],'angleDegrees':math.degrees(media_angle)},
   'libraryWall':{'center':[5.43,3.62],'angleDegrees':math.degrees(library_angle)},
   'exits':[{'name':'West dormitory corridor','center':[-8.2,-.95]},
            {'name':'East dormitory corridor','center':[8.2,-.95]},
            {'name':'Main entrance','center':[0,8.5]}]},
 'features':['continuous rounded sunken boucle sofa','two broad curved three-step flights',
             'three open dormitory exits','oval oak table','circular window aperture',
             'retrofuturistic TV and reel-to-reel on left side wall','right side-wall oak library',
             'brass botanical sculptures','suspended crystal chandeliers','three-dimensional lakeside skyline'],
}

# Evaluated meshes merge directly by material: no per-component conversion/join.
# This keeps the reproducible authoring run short enough for iterative comparison.
optimized=bpy.data.collections.new('COMMONS | optimized runtime'); scene.collection.children.link(optimized)
for obj in parts:
    if obj.type!='MESH' or not obj.data.materials or obj.data.materials[0] not in (cloth,carpet): continue
    mesh=obj.data; uv=mesh.uv_layers.active or mesh.uv_layers.new(name='Physical fabric UV')
    # Face projection prevents pinched fibre stripes on rounded end caps.
    for poly in mesh.polygons:
        axis=max(range(3),key=lambda i:abs(poly.normal[i])); axes=[i for i in range(3) if i!=axis]
        for loop in poly.loop_indices:
            co=mesh.vertices[mesh.loops[loop].vertex_index].co
            uv.data[loop].uv=(co[axes[0]]/1.1,co[axes[1]]/1.1)
root=bpy.data.objects.new('COMMONS__Lux_Umbrarum',None); optimized.objects.link(root)
root['layout_json']=json.dumps(LAYOUT)
parents={}
for name in ('interior','exterior'):
    parent=bpy.data.objects.new('COMMONS__'+name,None); optimized.objects.link(parent); parent.parent=root; parents[name]=parent
bpy.context.view_layer.update()
depsgraph=bpy.context.evaluated_depsgraph_get()
groups={}; merged=[]
for obj in parts:
    if obj.type not in ('MESH','CURVE','FONT'): continue
    evaluated=obj.evaluated_get(depsgraph)
    mesh=bpy.data.meshes.new_from_object(evaluated,preserve_all_data_layers=True,depsgraph=depsgraph)
    key=(obj['zone'],mesh.materials[0].name)
    vertices,faces,uvs,smooth,normals=groups.setdefault(key,([],[],[],[],[]))
    offset=len(vertices); matrix=obj.matrix_world; normal_matrix=matrix.to_3x3().inverted().transposed()
    vertices.extend(tuple(matrix @ v.co) for v in mesh.vertices)
    faces.extend(tuple(v+offset for v in p.vertices) for p in mesh.polygons)
    smooth.extend(p.use_smooth for p in mesh.polygons)
    if mesh.uv_layers.active:
        uvs.extend(tuple(uv.uv) for uv in mesh.uv_layers.active.data)
    else: uvs.extend((0,0) for loop in mesh.loops)
    normals.extend(tuple((normal_matrix @ normal.vector).normalized()) for normal in mesh.corner_normals)
    bpy.data.meshes.remove(mesh)
for (name,mat),(vertices,faces,uvs,smooth,normals) in groups.items():
    mesh=bpy.data.meshes.new('COMMONS__'+name+'__'+mat.replace(' ','_')); mesh.from_pydata(vertices,[],faces)
    mesh.materials.append(bpy.data.materials[mat]); mesh.polygons.foreach_set('use_smooth',smooth)
    uv=mesh.uv_layers.new(name='Baked surface UV'); uv.data.foreach_set('uv',np.asarray(uvs,dtype=np.float32).ravel())
    mesh.normals_split_custom_set(normals); mesh.update()
    obj=bpy.data.objects.new(mesh.name,mesh); optimized.objects.link(obj); obj.parent=parents[name]; merged.append(obj)
authored.hide_render=True; authored.hide_viewport=True
bpy.ops.object.select_all(action='DESELECT')
for obj in optimized.objects: obj.select_set(True)
bpy.context.view_layer.objects.active=root
temporary_asset=ASSET.with_name(ASSET.stem+'.building.glb')
bpy.ops.export_scene.gltf(filepath=str(temporary_asset),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
REPORT={'asset':str(ASSET),'bytes':temporary_asset.stat().st_size,'triangles':sum(sum(len(p.vertices)-2 for p in obj.data.polygons) for obj in merged),'materialPrimitives':len(merged),'editableComponents':len(parts),'layout':LAYOUT}
if REPORT['triangles']>500000 or len(merged)>40 or REPORT['bytes']>35*1024*1024: raise RuntimeError('Community room runtime budget exceeded')
temporary_asset.replace(ASSET)
(HERE/'asset-report.json').write_text(json.dumps(REPORT,indent=2)+'\n',encoding='utf-8')

# Presentation lights/camera remain editable but never enter the exported GLB.
studio=bpy.data.collections.new('PRESENTATION | cameras and lights'); scene.collection.children.link(studio)
world=bpy.data.worlds.new('Warm overcast afternoon'); world.use_nodes=True; world.node_tree.nodes['Background'].inputs['Color'].default_value=(.78,.73,.62,1); world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35; scene.world=world
for name,p,energy,size in [('Window daylight',(.9,4.8,2.9),1000,3.3),('Camera fill',(0,-3.5,2.6),80,5),('Ceiling bounce',(0,0,3.3),120,7)]:
    data=bpy.data.lights.new(name,'AREA'); data.energy=energy; data.size=size
    obj=bpy.data.objects.new(name,data); studio.objects.link(obj); obj.location=p; obj.rotation_euler=(Vector((0,0,.4))-obj.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('Reference composition'); camera=bpy.data.objects.new('Reference composition',data); studio.objects.link(camera)
camera.location=(.0,-7.8,1.65); camera.rotation_euler=(Vector((.0,4.5,-.4))-camera.location).to_track_quat('-Z','Y').to_euler(); data.lens=23
scene.camera=camera; scene.render.engine='CYCLES'; scene.cycles.samples=32; scene.cycles.use_denoising=True
scene.render.resolution_x=1440; scene.render.resolution_y=900; scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
bpy.data.libraries.write(str(HERE/'lux-umbrarum-community-room.blend'),{scene},fake_user=True,compress=True)
print('COMMON_ROOM_EXPORTED '+json.dumps({key:val for key,val in REPORT.items() if key!='layout'}))
