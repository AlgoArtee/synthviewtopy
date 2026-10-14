"""Photo-derived classical pool commons; deterministic editable Blender source.

Metres, Z up, front -Y. Export is Y up with north -Z. All surface maps are local,
packed in the blend and embedded in the GLB. The user's other scenes are kept.
"""
from pathlib import Path
import math,json,random
import bpy,bmesh,numpy as np
from mathutils import Vector,Matrix

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
ASSET=ROOT/'public/apartments/assets/lux-umbrarum-pool-commons.glb'
EVIDENCE=ROOT/'test-artifacts/lux-umbrarum-pool'
TEXTURES=HERE/'textures'
for directory in (ASSET.parent,EVIDENCE,TEXTURES): directory.mkdir(parents=True,exist_ok=True)
random.seed(41026); rng=np.random.default_rng(41026)
scene=bpy.data.scenes.new('Lux Umbrarum | Pool Commons'); bpy.context.window.scene=scene
scene['generator']='lux-umbrarum-pool-commons'
for previous in list(bpy.data.scenes):
    if previous==scene or previous.get('generator')!='lux-umbrarum-pool-commons': continue
    collections=list(previous.collection.children)
    for obj in list(previous.objects):
        if not any(obj.name in other.objects for other in bpy.data.scenes if other!=previous): bpy.data.objects.remove(obj,do_unlink=True)
    bpy.data.scenes.remove(previous)
    for collection in collections:
        if collection.users==0: bpy.data.collections.remove(collection)
scene.name='Lux Umbrarum | Pool Commons'; scene.unit_settings.system='METRIC'
authored=bpy.data.collections.new('POOL | editable architecture and furniture'); scene.collection.children.link(authored)
parts=[]; colliders=[]; seating=[]; zone='interior'
HALL_WIDTH=21.6; HALF_HALL=HALL_WIDTH/2; POOL_WIDTH=11.2; HALF_POOL=POOL_WIDTH/2
WIDTH_GAIN=(HALL_WIDTH-15.6)/2
serif_font=bpy.data.fonts.load(r'C:\Windows\Fonts\times.ttf')
serif_font.pack()
exec(compile((HERE/'model_helpers.py').read_text(),str(HERE/'model_helpers.py'),'exec'))

# Locally baked centimetre-scale surfaces: grout, crazed porcelain, linen,
# weathered oak and aged brass, all with real physical UV dimensions.
y,x=np.mgrid[:1024,:1024].astype(np.float32)/1024
noise=rng.normal(0,.015,x.shape)
plaster=material('Ivory lime plaster',(1,1,1),.90,base=np.clip(np.array([.78,.72,.61])+noise[:,:,None]*.40,0,1),bump=normal(noise,2))
ivory=material('Warm carved plaster',(.75,.69,.58),.83)
dark=material('Recess and dial ink',(.063,.049,.031),.82)
gx=np.minimum((x*4)%1,1-(x*4)%1); gy=np.minimum((y*4)%1,1-(y*4)%1)
grout=(gx<.014)|(gy<.014)
shade=rng.uniform(-.018,.018,(4,4))[np.minimum((y*4).astype(int),3),np.minimum((x*4).astype(int),3)]
tile_height=np.where(grout,0,.55)+noise*.35
tile_color=np.clip(np.array([.78,.76,.67])+(shade+noise*.25)[:,:,None],0,1)
tile_color[grout]=(.39,.39,.33)
tiles=material('Old ivory pool tiles',(1,1,1),.38,base=tile_color,bump=normal(tile_height,2.5))
grain=.025*np.sin(x*240+np.sin(y*12)*2)+.012*np.sin(x*980+y*6)+noise*.3
wood=material('Golden bentwood',(1,1,1),.65,base=np.clip(np.array([.40,.27,.14])+grain[:,:,None],0,1),bump=normal(grain,1.5))
weave=.015*np.sin(x*math.tau*230)+.015*np.sin(y*math.tau*230)+noise*.30
linen=material('Natural linen canvas',(1,1,1),.94,base=np.clip(np.array([.79,.76,.67])+weave[:,:,None],0,1),bump=normal(weave,6))
linen.node_tree.nodes.get('Principled BSDF').inputs['Sheen Weight'].default_value=.25
wear=.012*np.sin(x*17+np.sin(y*24)*2)+noise*.3
brass=material('Aged golden brass',(1,1,1),.30,.82,base=np.clip(np.array([.73,.57,.31])+wear[:,:,None],0,1),bump=normal(wear,.5))
copper=material('Oxidised copper pipes',(.38,.18,.09),.42,.78)
paper=material('Aged book paper',(.68,.62,.48),.93)
bookmats=[material('Clothbound volume '+str(i),color,.86) for i,color in enumerate([(.19,.22,.14),(.38,.30,.16),(.52,.40,.23),(.34,.29,.21)])]
marble=material('Ivory marble sculpture',(.82,.78,.68),.60)
leaf=material('Olive foliage',(.17,.24,.12),.87)
leaflight=material('Silver olive leaves',(.30,.34,.21),.84)
soil=material('Terracotta and soil',(.27,.17,.105),.86)
dialface=material('Antique ivory gauge faces',(1,1,1),.66,base=np.clip(np.array([.76,.66,.45])+noise[:,:,None]*1.5+.012*np.sin(x*70)[:,:,None],0,1))
water=material('POOL WATER | animated surface',(.16,.43,.62),.09,.02)
shader=water.node_tree.nodes.get('Principled BSDF'); shader.inputs['Transmission Weight'].default_value=.42; shader.inputs['IOR'].default_value=1.333
glazing=material('Clear window glass',(.85,.91,.91),.08)
glazing.node_tree.nodes.get('Principled BSDF').inputs['Transmission Weight'].default_value=1
glazing.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value=.12
glazing.surface_render_method='DITHERED'

def beam(name,mat,a,b,r=.032): return tube(name,mat,[a,b],r)

def arch_prism(name,center,width,bottom,spring,depth,mat=None):
    radius=width/2; outline=[(-radius,bottom),(radius,bottom),(radius,spring)]
    outline.extend((radius*math.cos(t),spring+radius*math.sin(t)) for t in np.linspace(0,math.pi,65)[1:])
    verts=[(center[0]+u,center[1]+v,z) for v in (-depth/2,depth/2) for u,z in outline]
    n=len(outline); faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    faces.extend((i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n))
    obj=mesh_object(name,mat,verts,faces)
    bm=bmesh.new(); bm.from_mesh(obj.data); bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces)); bm.to_mesh(obj.data); bm.free()
    return obj

def boolean_open(wall,cutter):
    bpy.context.view_layer.update(); bpy.context.view_layer.objects.active=wall
    mod=wall.modifiers.new('Real architectural aperture','BOOLEAN'); mod.operation='DIFFERENCE'; mod.solver='EXACT'; mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name); parts.remove(cutter); bpy.data.objects.remove(cutter,do_unlink=True)

def arch_trim(name,mat,cx,yy,r,spring,bottom,thickness):
    points=[(cx-r,yy,bottom),(cx-r,yy,spring)]
    points.extend((cx+r*math.cos(t),yy,spring+r*math.sin(t)) for t in np.linspace(math.pi,0,80))
    points.append((cx+r,yy,bottom)); return tube(name,mat,points,thickness)

def outline_panel(cx,yy,cz,w,h,mat=ivory):
    for sx in (-1,1): box('Raised wall panel vertical',mat,(cx+sx*w/2,yy,cz),(.034,.035,h),.01)
    for sz in (-1,1): box('Raised wall panel horizontal',mat,(cx,yy,cz+sz*h/2),(w,.035,.034),.01)

# Open pool basin and continuous tiled deck: the void is real, with a rounded lip.
deck=box('Tiled deck with open pool basin',tiles,(0,-1.30,-.16),(HALL_WIDTH,16.6,.32),0)
cutter=box('Temporary pool opening',None,(0,0,-.2),(POOL_WIDTH,7.2,3.4),.24)
bpy.context.view_layer.objects.active=cutter
for mod in list(cutter.modifiers): bpy.ops.object.modifier_apply(modifier=mod.name)
boolean_open(deck,cutter)
box('Tiled pool bottom',tiles,(0,0,-1.6),(POOL_WIDTH,7.2,.16),.06)
for sx in (-1,1): box('Tiled pool side',tiles,(sx*(HALF_POOL-.02),0,-.78),(.13,7.12,1.56),.05)
for sy in (-1,1): box('Tiled pool end',tiles,(0,sy*3.58,-.78),(POOL_WIDTH-.12,.13,1.56),.05)
# Separate rounded coping sections retain the grid around the corners.
for sx in (-1,1): box('Rounded tiled pool coping',tiles,(sx*(HALF_POOL+.10),0,.016),(.28,6.86,.09),.065)
for sy in (-1,1): box('Rounded tiled pool coping',tiles,(0,sy*3.69,.016),(POOL_WIDTH-.33,.28,.09),.065)
for sx in (-1,1):
    for sy in (-1,1):
        points=[(sx*(HALF_POOL-.20+.31*math.cos(t)),sy*(3.40+.31*math.sin(t)),.022) for t in np.linspace(0,math.pi/2,40)]
        tube('Rounded tiled coping corner',tiles,points,.13)
for sx in (-1,1): box('Dark pool skimmer opening',dark,(sx*(HALF_POOL-.095),2.1,-.23),(.018,.26,.16),.009)
box('Pool boundary collision volume',None,(0,0,-4),(1,1,1),0).hide_render=True
temporary=parts.pop(); bpy.data.objects.remove(temporary,do_unlink=True)
collide(0,0,POOL_WIDTH+.32,7.50,1.0,-1.68)

nx,ny=160,128; verts=[]; faces=[]
for j in range(ny+1):
    for i in range(nx+1):
        xx=-HALF_POOL+.13+i*(POOL_WIDTH-.26)/nx; yy=-3.47+j*6.94/ny
        zz=-.19+.007*math.sin(xx*8+yy*6)+.004*math.sin(xx*11-yy*9)
        verts.append((xx,yy,zz))
for j in range(ny):
    for i in range(nx):
        q=j*(nx+1)+i; faces.append((q,q+1,q+nx+2,q+nx+1))
surface=finish(mesh_object('POOL__rippling_water',water,verts,faces)); surface['role']='pool water'; surface['waterLevel']=-.19

# Three tall arched windows, wall paneling, carved surrounds and pilasters.
wall=box('Window wall with three real arch apertures',plaster,(0,7.03,3.2),(HALL_WIDTH,.34,6.4),0)
WINDOWS=[x*HALL_WIDTH/15.6 for x in (-5.55,-1.75,2.05)]
CENTRAL_WINDOW=WINDOWS[1]
for cx in WINDOWS:
    boolean_open(wall,arch_prism('Temporary arched window cutter',(cx,7.03),2.62,1.10,4.70,1.0))
    for r,yy,thick in [(1.36,6.82,.095),(1.49,6.84,.05),(1.57,6.87,.055)]: arch_trim('Layered carved arched window surround',ivory,cx,yy,r,4.70,1.06,thick)
    glass=arch_prism('Tall clear arched window glass',(cx,7.09),2.59,1.10,4.70,.025,glazing)
    for sx in (-1,1): box('Window sash stile',ivory,(cx+sx*1.27,6.99,2.90),(.065,.11,3.64),.006)
    for z in (1.13,1.91,2.70,3.49,4.27,4.70): box('Window horizontal glazing bar',ivory,(cx,6.98,z),(2.58,.10,.045 if z!=4.70 else .115),.005)
    for dx in (-.43,.43): box('Window vertical glazing bar',ivory,(cx+dx,6.98,3.28),(.044,.10,4.39),.005)
    box('Window central meeting rail',ivory,(cx,6.94,2.92),(.061,.12,3.55),.005)
    beam('Arched fanlight center bar',ivory,(cx,6.98,4.70),(cx,6.98,5.98),.018)
    for z in (() if cx==CENTRAL_WINDOW else (5.2,5.58)):
        span=math.sqrt(1.27**2-(z-4.70)**2); box('Fanlight horizontal bar',ivory,(cx,6.98,z),(span*2,.09,.032),.004)
    for dx in (() if cx==CENTRAL_WINDOW else (-.43,.43)):
        zz=4.70+math.sqrt(1.27**2-dx*dx); beam('Fanlight radial vertical bar',ivory,(cx+dx,6.98,4.70),(cx+dx,6.98,zz),.017)
    if cx==CENTRAL_WINDOW:
        tube('Inner semicircle in central window fanlight',ivory,
             [(cx+.62*math.cos(t),6.98,4.70+.62*math.sin(t)) for t in np.linspace(0,math.pi,48)],.024)
    for dx in (-.065,.065): cylinder('Window brass handle',brass,(cx+dx,6.855,2.59),.018,.07,(math.pi/2,0,0),12)
    box('Deep pale stone window sill',ivory,(cx,6.80,1.045),(2.95,.42,.13),.026)
    outline_panel(cx,6.82,.50,2.44,.72)
for cx in (x*HALL_WIDTH/15.6 for x in (-7.35,-3.65,.15,3.95)):
    box('Fluted window wall pilaster',ivory,(cx,6.77,3.02),(.37,.31,5.82),.014)
    for dx in (-.11,0,.11): box('Pilaster fluting',plaster,(cx+dx,6.598,3.05),(.028,.026,4.45),.012)
    for z,w,d,h in [(.15,.60,.44,.25),(1.04,.53,.42,.11),(4.69,.65,.45,.12),(4.82,.57,.39,.13),(5.78,.65,.44,.17)]: box('Layered pilaster capital',ivory,(cx,6.74,z),(w,d,h),.017)
    box('Window arch keystone',ivory,(cx+1.63,6.76,6.13),(.19,.29,.27),.012,(0,math.radians(-4),0))

# The right wall and rear instrument/library wall are real substrates.
box('Right ivory panelled wall',plaster,(HALF_HALL+.02,-1.30,3.2),(.32,16.6,6.4),.01)
box('Left ivory side wall',plaster,(-HALF_HALL-.02,-1.30,3.2),(.32,16.6,6.4),.01)
library_start=len(parts)
for cx in (1.90,8.22):
    # Library recesses cut into the rear wall, with visible depth and a backing.
    # Built-in shelves are mounted in the right side wall, with a true recess.
    cutter=box('Temporary side library recess',None,(HALF_HALL+.02,7.82-cx,2.8),(.9,1.27,3.60),0)
    right_wall=next(obj for obj in parts if obj.name=='Right ivory panelled wall')
    boolean_open(right_wall,cutter)
    box('Library alcove dark backing',dark,(cx,7.24,2.80),(1.26,.065,3.58),.006)
    for dx in (-.70,.70): box('Built-in library frame',ivory,(cx+dx,6.82,2.82),(.095,.34,3.80),.015)
    for z in (1.0,1.70,2.4,3.10,3.80,4.58):
        box('Recessed library shelf',ivory,(cx,7.0,z),(1.32,.46,.055),.007)
        if z>=4.5: continue
        cursor=cx-.52
        for j in range(9):
            w=random.uniform(.055,.11); h=random.uniform(.29,.53)
            obj=box('Antiquarian library volume',bookmats[j%4],(cursor+w/2,6.93,z+h/2+.035),(w,.24,h),.004,(0,random.uniform(-.08,.08),0))
            for tz in (.20,.79): box('Gilt spine bands',brass,(cursor+w/2,6.796,z+.035+h*tz),(w*.83,.007,.005),.001)
            cursor+=w+.017
            if cursor>cx+.53: break
    box('Alcove carved header',ivory,(cx,6.78,4.65),(1.58,.18,.16),.025)
side_transform=Matrix.Translation(Vector((.60+WIDTH_GAIN,7.82,0))) @ Matrix.Rotation(-math.pi/2,4,'Z')
bpy.context.view_layer.update()
for obj in parts[library_start:]: obj.matrix_world=side_transform @ obj.matrix_world
panel_start=len(parts)
for cx in (2.90,7.05):
    box('Gauge wall full-height pilaster',ivory,(cx,6.77,3.0),(.24,.20,5.98),.011)
for cx in (3.65,4.65,5.65,6.65): outline_panel(cx,6.82,.62,.82,.78)
outline_panel(4.87,7.06,3.78,3.93,4.53)
bpy.context.view_layer.update()
for obj in parts[panel_start:]: obj.matrix_world=side_transform @ obj.matrix_world
for sx in (-1,1):
    for yy in np.arange(-8.5,6,1.60):
        # Side panel moulding uses the same front-plane construction, rotated.
        start=len(parts); outline_panel(yy,0,.63,1.37,.82)
        transform=Matrix.Translation(Vector((sx*(HALF_HALL-.16),0,0))) @ Matrix.Rotation(sx*math.pi/2,4,'Z')
        bpy.context.view_layer.update()
        for obj in parts[start:]: obj.matrix_world=transform @ obj.matrix_world
    box('Side wall dado rail',ivory,(sx*(HALF_HALL-.20),-1.30,1.16),(.12,16.6,.13),.02)
    box('Side wall cornice',ivory,(sx*(HALF_HALL-.21),-1.30,6.02),(.24,16.6,.24),.026)
for z,d,h in [(.12,.19,.16),(1.16,.13,.13),(6.06,.21,.24)]: box('Continuous rear wall moulding',ivory,(0,6.79,z),(HALL_WIDTH,d,h),.018)

# Entry remains outside the reference framing, with a visible dormitory corridor.
front=box('Entrance wall with open hall',plaster,(0,-9.63,3.2),(HALL_WIDTH,.34,6.4),0)
boolean_open(front,arch_prism('Temporary arrival arch',(-5.50,-9.63),2.5,-.3,2.7,1.1))
arch_trim('Open arrival arch surround',ivory,-5.50,-9.42,1.31,2.7,0,.08)
box('Dormitory approach tiled floor',tiles,(-5.50,-10.8,-.10),(2.6,2.6,.20),.005)
for xx in (-6.82,-4.18): box('Approach hallway wall',plaster,(xx,-10.8,2.1),(.16,2.6,4.2),.01)
box('Approach hallway ceiling',ivory,(-5.50,-10.8,4.08),(2.6,2.6,.16),.01)
box('Pool hall ceiling',plaster,(0,-1.30,6.42),(HALL_WIDTH+.1,16.8,.25),.01)
# The requested flat ceiling retains its coffers, without the three arch ribs.
for xx in (-7.5,-5,-2.5,0,2.5,5,7.5):
    for yy in (-8.2,-5.5,-2.8,-.1,2.6,5.3):
        for sy in (-1,1): box('Coffered ceiling horizontal frame',ivory,(xx,yy+sy*1.10,6.245),(2.24,.09,.13),.015)
        for sx in (-1,1): box('Coffered ceiling vertical frame',ivory,(xx+sx*1.10,yy,6.245),(.09,2.20,.13),.015)

def dial(name,cx,yy,cz,r,title='',roman=False,reading=None):
    cylinder(name+' deep brass case',brass,(cx,yy,cz),r,.13,(math.pi/2,0,0),64)
    cylinder(name+' porcelain face',dialface,(cx,yy-.075,cz),r*.89,.012,(math.pi/2,0,0),64)
    ring(name+' rolled bezel',brass,(cx,yy-.10,cz),r*.945,r*.043,(math.pi/2,0,0))
    ring(name+' fine inner rule',dark,(cx,yy-.087,cz),r*.82,.0035,(math.pi/2,0,0))
    divisions=60 if reading is None else 50
    for i in range(divisions+int(reading is not None)):
        a=i*math.tau/60 if reading is None else -math.pi*.77+i*math.pi*1.54/divisions
        ri=.71 if i%(5 if reading is None else 10)==0 else .78
        beam(name+' engraved graduation',dark,(cx+r*ri*math.sin(a),yy-.090,cz+r*ri*math.cos(a)),(cx+r*.83*math.sin(a),yy-.090,cz+r*.83*math.cos(a)),.0035 if i%5==0 else .0018)
    if roman:
        for i,text in enumerate(['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI']):
            a=i*math.tau/12; label(text,(cx+r*.655*math.sin(a),yy-.094,cz+r*.655*math.cos(a)),r*.135,dark)
    elif reading is not None:
        for i in range(6):
            a=-math.pi*.77+i*math.pi*1.54/5
            value=reading['min']+(reading['max']-reading['min'])*i/5
            label(f'{value:g}',(cx+r*.64*math.sin(a),yy-.094,cz+r*.64*math.cos(a)),r*.090,dark)
    elif r>.27:
        for i in range(10):
            a=-math.pi*.77+i*math.pi*1.54/9; label(str(i*10),(cx+r*.64*math.sin(a),yy-.094,cz+r*.64*math.cos(a)),r*.095,dark)
    if title: label(title,(cx,yy-.096,cz+r*.28),r*.11,dark)
    if reading is not None:
        label(reading['display'],(cx,yy-.096,cz-r*.38),r*.105,dark)
        angle=-math.pi*.77+(reading['value']-reading['min'])/(reading['max']-reading['min'])*math.pi*1.54
    else: angle=random.uniform(-2.0,2.0)
    if roman:
        # Retain separate pivoted meshes for the browser's real local-time clock.
        for hand,length,width,angle,depth in [('hour',.48,.030,math.tau*(10+10/60)/12,.12),
                                              ('minute',.70,.020,math.tau*10/60,.14),('second',.76,.007,0,.16)]:
            outline=[(-width*r,-.13*r),(-width*r,.15*r),(-width*.55*r,length*.83*r),(0,length*r),
                     (width*.55*r,length*.83*r),(width*r,.15*r),(width*r,-.13*r)]
            verts=[(x,y,z) for y in (-.005,.005) for x,z in outline]; n=len(outline)
            faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
            obj=finish(mesh_object('Clock '+hand+' hand',dark,verts,faces),.002)
            obj.location=(cx,yy-depth,cz); obj.rotation_euler.y=angle
            obj['clock_hand']=hand; obj['rest_angle']=angle
    else:
        beam(name+' black indicator',dark,(cx-r*.15*math.sin(angle),yy-.12,cz-r*.15*math.cos(angle)),(cx+r*.70*math.sin(angle),yy-.12,cz+r*.70*math.cos(angle)),r*.012)
    sphere(name+' hand pivot',brass,(cx,yy-.14,cz),(.030,.020,.030),16,8)
    return (cx,yy,cz)

# The wall ensemble reproduces the stacked Art Deco clock/barometer silhouette.
gauge_start=len(parts)
cx=5.12; yy=6.57
profile=[(-1.63,-1.02),(-1.34,-1.48),(-.72,-1.72),(.72,-1.72),(1.34,-1.48),(1.63,-1.02),(1.63,.90),(1.40,.90),(1.40,1.39),(.80,1.39),(.80,1.76),(-.80,1.76),(-.80,1.39),(-1.40,1.39),(-1.40,.90),(-1.63,.90)]
verts=[(cx+u,yy+v,3.81+z) for v in (0,.12) for u,z in profile]; n=len(profile)
faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
finish(mesh_object('Art Deco wall instrument shield',brass,verts,faces),.02)
rim=[(cx+u,yy-.025,3.81+z) for u,z in profile+[profile[0]]]
tube('Stepped shield fine rolled brass edging',brass,rim,.018)
for zz in (4.71,4.77,4.83): box('Wall instrument horizontal stepped wing',brass,(cx,yy-.035,zz),(3.63,.15,.046),.01)
for dx in (-.36,-.24,-.12,0,.12,.24,.36): box('Wall instrument stepped crown',brass,(cx+dx,yy-.09,5.65-abs(dx)*.65),(.10,.10,.32),.017)
INSTRUMENTS=[{'id':'time','position':'upper','label':'LOCAL TIME','unit':'HH:MM:SS','source':'device-local-time'},
 {'id':'pressure','position':'lower-left','label':'PRESSURE','unit':'hPa','min':950,'max':1050,'value':1013,'display':'1013 hPa','source':'illustrative'},
 {'id':'oxygen','position':'lower-middle','label':'O₂ CONCENTRATION','unit':'vol.%','min':0,'max':25,'value':20.9,'display':'20.9 vol.%','source':'illustrative'},
 {'id':'carbon-dioxide','position':'lower-right','label':'CO₂ CONCENTRATION','unit':'ppm','min':0,'max':2000,'value':600,'display':'600 ppm','source':'illustrative'}]
dial('Grand local time clock',cx,yy-.065,4.47,1.02,'LOCAL TIME',True)
for dx,dz,r,reading in [(-1.02,-.86,.53,INSTRUMENTS[1]),(0,-1.17,.47,INSTRUMENTS[2]),(.99,-.88,.58,INSTRUMENTS[3])]:
    title=reading['label'] if reading['id']=='pressure' else reading['label'].replace(' ','\n',1)
    dial('Lower brass wall gauge',cx+dx,yy-.065,3.79+dz,r,title,reading=reading)
for dx,dz in [(-1.31,1.32),(1.30,1.32),(-1.31,.55),(1.31,.56)]:
    # Small shield accents are decorative brass rosettes, without extra readings.
    p=(cx+dx,yy-.065,3.79+dz)
    cylinder('Wall instrument decorative rosette',brass,p,.205,.13,(math.pi/2,0,0),40)
    ring('Rosette concentric brass rim',brass,(p[0],p[1]-.085,p[2]),.169,.017,(math.pi/2,0,0))
    sphere('Rosette centre stud',brass,(p[0],p[1]-.105,p[2]),(.040,.019,.040),16,8)
for dx in (-.57,.57): ring('Wall gauge lower rosette',brass,(cx+dx,yy-.16,2.14),.11,.023,(math.pi/2,0,0))
gauge_transform=Matrix.Translation(Vector((1.0+WIDTH_GAIN,8.07,0))) @ Matrix.Rotation(-math.pi/2,4,'Z')
bpy.context.view_layer.update()
for obj in parts[gauge_start:]: obj.matrix_world=gauge_transform @ obj.matrix_world

def book(p,w,d,h,index,title='',angle=0):
    start=len(parts); mat=bookmats[index%4]
    box('Antique book page block',paper,(0,0,0),(w-.025,d-.025,h-.014),.006)
    for sz in (-1,1): box('Clothbound book cover',mat,(0,0,sz*h/2),(w+.014,d+.014,.014),.007)
    box('Cloth book spine',mat,(0,-d/2,0),(w,.020,h),.008)
    if title:
        label(title,(0,-d/2-.012,0),min(.055,w/max(7,len(title))*1.2),brass)
        label(title.replace(' ','\n',1) if title=='THE ILIAD' else title,(0,.02,h/2+.009),min(.073,w/max(5,len(title))*.95),paper,(0,0,0))
    transform=Matrix.Translation(Vector(p)) @ Matrix.Rotation(angle,4,'Z')
    bpy.context.view_layer.update()
    for obj in parts[start:]: obj.matrix_world=transform @ obj.matrix_world

def towel(name,px,py,rotation=0,hang=False):
    verts=[]; faces=[]; n=28; m=36
    for j in range(m+1):
        v=j/m
        for i in range(n+1):
            u=i/n
            xx=(u-.5)*.62; yy=(v-.5)*.98
            zz=.017*math.sin(u*math.pi*12+v*2)+.022*math.sin(v*15)*math.sin(u*math.pi)
            if hang:
                yy=-.35+v*.94; zz+=-.52*max(0,(v-.55)/.45)**.58
            verts.append((xx,yy,zz))
    for j in range(m):
        for i in range(n):
            q=j*(n+1)+i; faces.append((q,q+1,q+n+2,q+n+1))
    obj=finish(mesh_object(name,linen,verts,faces)); obj.location=(px,py,.63); obj.rotation_euler.z=rotation
    solid=obj.modifiers.new('Linen hem thickness','SOLIDIFY'); solid.thickness=.004

pearl=material('Pearl enamel elongated pod shell',(.76,.77,.70),.25,.12)
chrome=material('Polished platinum helix suspension',(.67,.72,.73),.22,1)

def lounger(px,py,angle=0,with_towel=False,volume=None):
    start=len(parts)
    # Pearl shell edging, articulated platinum cantilevers and warm wood inlays.
    for sx in (-1,1):
        xx=sx*.37
        tube('Retrofuturistic lounger pearl side shell',pearl,[(xx,-1.04,.48),(xx,-.32,.49),(xx,.18,.58),(xx,.66,.98),(xx,1.03,1.27)],.052)
        tube('Lounger platinum cantilever runner',chrome,[(xx,-1.00,.06),(xx,.63,.06),(xx,.81,.16),(xx,.78,.48),(xx,.67,.83)],.027)
        beam('Lounger warm wood inlay',wood,(xx,-.94,.505),(xx,.17,.602),.015)
        beam('Lounger diagonal brass support',brass,(xx,-.76,.085),(xx,.20,.57),.023)
        for yy in (-.89,.55): box('Lounger rounded anti-slip foot',dark,(xx,yy,.04),(.11,.19,.06),.025)
        cylinder('Folding frame brass pivot',brass,(xx,.01,.49),.027,.025,(0,math.pi/2,0),16)
    for yy,zz in [(-1.00,.49),(.18,.57),(1.00,1.27)]: beam('Canvas tension crossbar',wood,(-.39,yy,zz),(.39,yy,zz),.031)
    verts=[]; faces=[]; n=18; m=36
    for j in range(m+1):
        yy=-.97+1.94*j/m
        zz=.51+(yy+.97)*.042 if yy<.16 else .56+(yy-.16)*.845
        for i in range(n+1):
            u=i/n; xx=(u-.5)*.68
            sag=.052*math.sin(u*math.pi)*math.sin(j/m*math.pi)
            verts.append((xx,yy,zz-sag+.006*math.sin(u*42)*math.sin(j/m*math.pi)))
    for j in range(m):
        for i in range(n):
            q=j*(n+1)+i; faces.append((q,q+1,q+n+2,q+n+1))
    fabric=finish(mesh_object('Sagging canvas lounger sling',linen,verts,faces)); fabric.modifiers.new('Padded tailored canvas thickness','SOLIDIFY').thickness=.045
    for sx in (-1,1): beam('Stitched canvas side hem',linen,(sx*.343,-.97,.515),(sx*.343,.16,.567),.007)
    for sx in (-1,1):
        tube('Pearl padded lounger armrest',pearl,[(sx*.44,-.33,.79),(sx*.44,-.27,.85),(sx*.44,.31,.87),(sx*.44,.41,.81)],.035)
        beam('Lounger metal armrest stanchion',chrome,(sx*.44,-.22,.54),(sx*.44,-.22,.82),.018)
        cylinder('Lounger brass back recline control',brass,(sx*.473,.28,.75),.047,.023,(0,math.pi/2,0),16)
    cylinder('Lounger upholstered head bolster',linen,(0,.89,1.225),.085,.64,(0,math.pi/2,0),24)
    if with_towel: towel('Casually draped linen towel',0,-.12,hang=True)
    if volume:
        book((.05,-.58,.59),.39,.28,.073,1,volume,.11)
        # A recognisable pair of wire reading glasses rests on the book.
        for xx in (-.055,.065): ring('Reading glasses lens rim',brass,(xx,-.59,.638),.047,.003)
        beam('Reading glasses bridge',brass,(-.008,-.59,.638),(.018,-.59,.638),.003)
        for xx in (-.10,.11): beam('Reading glasses temples',brass,(xx,-.59,.637),(xx,-.44,.646),.0025)
    transform=Matrix.Translation(Vector((px,py,0))) @ Matrix.Rotation(angle,4,'Z')
    bpy.context.view_layer.update()
    for obj in parts[start:]: obj.matrix_world=transform @ obj.matrix_world
    # A tight rotated rectangle keeps the surrounding deck route open.
    for i in range(8):
        local=-.92+i*.26; xx=px-local*math.sin(angle); yy=py+local*math.cos(angle)
        collide(xx,yy,abs(math.cos(angle))*1.0+abs(math.sin(angle))*.27,abs(math.sin(angle))*1.0+abs(math.cos(angle))*.27,1.34)
    seating.append({'kind':'canvas-lounger','position':[px,0,-py],
                    'forward':[math.sin(angle),0,math.cos(angle)],'target':[0,0,0]})

LOUNGER_POSITIONS=[(-7.20,-1.0),(-7.20,1.8),(-7.20,4.0),(7.20,.4),(7.20,3.4),(0,5.4),(1.2,-7.1)]
for i,(px,py) in enumerate(LOUNGER_POSITIONS):
    lounger(px,py,math.atan2(-px,py),i in (0,4),'MEDITATIONS' if i==1 else None)
stool_start=len(parts)
for sx in (-1,1):
    for sy in (-1,1): beam('Low rattan book stool leg',wood,(sx*.44,sy*.34,.04),(sx*.41,sy*.32,.44),.032)
for sy in (-1,1): beam('Rattan stool side rail',wood,(-.48,sy*.36,.44),(.48,sy*.36,.44),.030)
for sx in (-1,1): beam('Rattan stool end rail',wood,(sx*.48,-.36,.44),(sx*.48,.36,.44),.030)
box('Low linen-topped reading stool',linen,(0,0,.435),(.91,.65,.038),.014)
book((-.07,.02,.507),.44,.32,.080,1,'THE ILIAD',-.15)
book((.24,.06,.478),.29,.40,.030,2,'',.09)
transform=Matrix.Translation(Vector((-3.25,-7.50,0))) @ Matrix.Rotation(-.12,4,'Z')
bpy.context.view_layer.update()
for obj in parts[stool_start:]: obj.matrix_world=transform @ obj.matrix_world
collide(-3.25,-7.50,1.1,.86,.60)
for i in range(5): book((-9.00,2.91,.10+i*.067),.39,.32,.060,i,'HISTORIES' if i==4 else '',.045)

# A sculpted marble bust, not an abstract sphere on a pole.
bust_start=len(parts)
box('Classical bust marble pedestal',marble,(2.30,6.00,.72),(.48,.43,1.44),.019)
box('Bust pedestal cornice',marble,(2.30,6.00,1.45),(.56,.48,.075),.022)
sphere('Carved bust shoulders',marble,(2.30,5.99,1.70),(.28,.16,.24),36,20)
sphere('Bust draped breast',marble,(2.30,5.97,1.58),(.20,.145,.16),32,16)
cylinder('Classical marble neck',marble,(2.30,5.99,1.94),.073,.19,vertices=28)
sphere('Marble bust head',marble,(2.30,5.98,2.11),(.105,.105,.145),40,28)
sphere('Bust nose',marble,(2.30,5.868,2.11),(.022,.040,.046),20,12)
for sx in (-1,1):
    sphere('Classical bust ear',marble,(2.30+sx*.105,5.98,2.105),(.018,.028,.043),16,10)
    beam('Sculpted bust brow',marble,(2.30+sx*.025,5.882,2.16),(2.30+sx*.070,5.89,2.166),.008)
for i in range(24):
    a=i*2.399; sphere('Carved wavy hair curl',marble,(2.30+.101*math.cos(a),5.98+.092*math.sin(a),2.19+.033*math.sin(a*2)),(.035,.030,.039),14,8)
for i in range(8):
    zz=1.52+i*.02; beam('Marble drapery fold',marble,(2.10,5.84,zz+.18),(2.48,5.83,zz),.006)
for obj in parts[bust_start:]: obj.location.x+=4.55+WIDTH_GAIN
collide(6.85+WIDTH_GAIN,6.0,.62,.54,2.31)

def olive_tree(px,py,height=2.75,outside=False):
    if not outside:
        cylinder('Terracotta olive pot',soil,(px,py,.25),.32,.50,vertices=48)
        ring('Rolled clay planter rim',soil,(px,py,.49),.32,.035)
        cylinder('Olive pot dark soil',dark,(px,py,.485),.29,.012)
        collide(px,py,.74,.74,.60)
    beam('Gnarled olive trunk',wood,(px,py,.15),(px+.04,py,height*.83),.11 if outside else .045)
    for i in range(14):
        a=i*2.399; end=Vector((px+math.cos(a)*random.uniform(.35,.85),py+math.sin(a)*random.uniform(.28,.75),height*.55+random.uniform(.15,height*.45)))
        base=Vector((px,py,height*.38)); beam('Olive spreading branch',wood,base,end,.025 if outside else .010)
        for j in range(21 if outside else 18):
            scatter=.37 if outside else .20
            tip=end+Vector((random.uniform(-scatter,scatter),random.uniform(-scatter,scatter),random.uniform(-scatter,scatter)))
            obj=sphere('Narrow silver olive leaf',leaf if j%3 else leaflight,tip,(.055,.018,.16) if outside else (.025,.010,.082),8,4)
            obj.rotation_euler=(random.uniform(-1,1),random.uniform(-1,1),a)
olive_tree(-6.98-WIDTH_GAIN,5.60)

# Hero brass diving platform with real supports, perforated board, handrails,
# embossed case, controls, individual rivets, gauge bezels and copper plumbing.
machine_start=len(parts); mx,my=7.10,-2.45
base=box('Mechanical diving platform bronze cabinet',brass,(mx,my,.54),(1.89,1.50,1.06),.11)
box('Diving machine stepped foot',brass,(mx,my,.075),(2.00,1.59,.15),.06)
box('Machine inset dark front panel',dark,(mx,my-.758,.57),(1.68,.024,.82),.052)
box('Beveled bronze cabinet door',brass,(mx,my-.785,.57),(1.55,.035,.70),.050)
for sx in (-1,1):
    for zz in (.27,.57,.86): sphere('Cabinet brass rivet',brass,(mx+sx*.67,my-.810,zz),(.016,.011,.016),12,6)
for xx in np.arange(mx-.49,mx+.51,.20): sphere('Cabinet lower brass rivet',brass,(xx,my-.813,.26),(.014,.010,.014),12,6)
box('Upright diving control panel',brass,(mx+.32,my+.06,1.77),(1.30,.30,1.02),.07)
for dx,dz,r in [(-.43,.23,.205),(.03,.23,.22),(.49,.23,.225),(.49,-.24,.145)]: dial('Diving console gauge',mx+.32+dx,my-.115,1.77+dz,r,'DEPTH' if r>.21 else '')
for dx,dz,r in [(-.22,-.19,.09),(.07,-.28,.065),(-.46,-.06,.048),(.37,-.40,.047)]:
    cylinder('Diving console turned control',brass,(mx+.32+dx,my-.165,1.77+dz),r,.08,(math.pi/2,0,0),24)
    ring('Console control inset ring',dark,(mx+.32+dx,my-.214,1.77+dz),r*.68,.008,(math.pi/2,0,0))
for dx in (-.59,.59):
    for dz in (-.40,.40): sphere('Control panel corner screw',dark,(mx+.32+dx,my-.108,1.77+dz),(.016,.012,.016),12,6)
for dx in (-.52,.56):
    cylinder('Diving console support column',brass,(mx+dx,my+.12,1.27),.067,.58,vertices=28)
    for zz in (1.06,1.16,1.38): ring('Flanged console pillar collar',brass,(mx+dx,my+.12,zz),.10,.025)
for i in range(4):
    xx=mx+.28+i*.17
    tube('Copper hydraulic return pipe',copper,[(xx,my-.1,1.32),(xx,my-.2,1.11),(xx+.10,my-.36,1.04),(xx+.1,my-.4,.82)],.027)
    for p,direction in [((xx,my-.138,1.24),(0,-.10,-.21)),((xx+.10,my-.389,.88),(0,-.04,-.22))]:
        rotation=Vector(direction).to_track_quat('Z','Y').to_euler()
        cylinder('Pipe coupling fitted to copper tube',brass,p,.046,.073,rotation,20)
for yy in (my-.54,my+.54):
    # Board projects left over the water, matching the reference silhouette.
    beam('Diving board underside girder',brass,(mx-.13,yy,.88),(mx-5.74,yy,.81),.055)
    tube('Cantilever diagonal brace',brass,[(mx-.21,yy,.25),(mx-1.15,yy,.64),(mx-4.90,yy,.80)],.053)
box('Brass diving board rolled rim',brass,(mx-3.20,my,.94),(5.54,1.24,.12),.060)
box('Perforated board dark backing',dark,(mx-3.20,my,1.008),(5.39,1.10,.006),.025)
for i in range(134):
    xx=mx-5.89+i*.040
    beam('Fine diving board woven mesh',brass,(xx,my-.54,1.017),(xx,my+.54,1.017),.006)
for i in range(28):
    yy=my-.54+i*.04; beam('Fine diving board woven mesh',brass,(mx-5.89,yy,1.018),(mx-.50,yy,1.018),.006)
for yy in (my-.71,my+.69):
    pts=[(mx-.49,yy,1.03),(mx-.86,yy,1.77),(mx-.96,yy,2.12)]
    pts.extend((mx-.60+.36*math.cos(t),yy,2.12+.36*math.sin(t)) for t in np.linspace(math.pi,math.pi/2,18)[1:])
    pts.append((mx+1.0,yy,2.48))
    tube('Continuous rounded diving platform handrail',brass,pts,.044)
    for xx in (mx+.07,mx+.85): beam('Handrail support upright',brass,(xx,yy,1.06),(xx,yy,2.48),.026)
collide(mx,my,2.06,1.65,1.08)
collide(mx+.32,my+.06,1.30,.34,2.30,1.22)
# Five physical steps approach the free left side of the control cabinet.
BOARD_HEIGHT=1.024; stair_x=6.34; stair_width=.76
for i in range(5):
    top=(i+1)*BOARD_HEIGHT/5; zz=4.32-i*.255
    box('Brass diving board access step',brass,(stair_x,-zz,top/2),(stair_width,.255,top),.014)
    box('Ivory non-slip diving step tread',ivory,(stair_x,-zz,top+.004),(stair_width-.065,.225,.009),.006)
for sx in (-1,1):
    tube('Board access curved stair handrail',chrome,
         [(stair_x+sx*.47,-4.48,.17),(stair_x+sx*.47,-4.48,1.03),
          (stair_x+sx*.47,-3.15,2.01),(stair_x+sx*.47,-2.98,2.01)],.025)
    for zz,hh in ((4.15,1.19),(3.55,1.62),(3.08,2.01)):
        beam('Diving stair handrail upright',chrome,(stair_x+sx*.47,-zz,.10),(stair_x+sx*.47,-zz,hh),.022)
BOARD={'minX':mx-5.97,'maxX':mx-.43,'minZ':-my-.62,'maxZ':-my+.62,'height':BOARD_HEIGHT,
       'steps':[{'minX':stair_x-stair_width/2,'maxX':stair_x+stair_width/2,
                 'minZ':4.32-i*.255-.1275,'maxZ':4.32-i*.255+.1275,'height':(i+1)*BOARD_HEIGHT/5} for i in range(5)]}
BOARD['steps'].append({'minX':stair_x-stair_width/2,'maxX':stair_x+stair_width/2,'minZ':2.93,'maxZ':3.18,'height':BOARD_HEIGHT})
box('Diving board top landing',brass,(stair_x,-3.055,BOARD_HEIGHT-.065),(stair_width,.25,.13),.013)
# The exit ladder is on the front-left pool edge, with submerged rungs.
LADDER={'x':-4.5,'z':3.25,'exitX':-4.5,'exitZ':4.20}
for sx in (-1,1):
    xx=LADDER['x']+sx*.30
    tube('Pool exit ladder curved rail',chrome,[(xx,-4.10,.06),(xx,-4.10,.52),(xx,-3.94,.68),
         (xx,-3.45,.68),(xx,-3.25,.49),(xx,-3.25,-1.34)],.032)
    for yy in (-4.10,-3.94): cylinder('Pool ladder deck mounting flange',brass,(xx,yy,.036),.074,.07,vertices=20)
for zz in (-1.20,-.89,-.58,-.27,.04):
    beam('Pool ladder submerged rung',chrome,(-4.80,-3.25,zz),(-4.20,-3.25,zz),.024)

exec(compile((HERE/'suspended_pods.py').read_text(),str(HERE/'suspended_pods.py'),'exec'))

# A genuine garden beyond the window wall supplies daylight, depth and parallax.
zone='exterior'
grass=material('Muted courtyard lawn',(.38,.43,.26),.96)
sky_stone=material('Distant collegiate limestone',(.56,.54,.43),.90)
box('Garden lawn',(grass),(0,44,-.26),(100,70,.18),0)
for xx in (-13,-10,-7,-4,-1,3,6,9,12,15): olive_tree(xx,random.uniform(14,22),random.uniform(5.5,8.0),True)
for i in range(7):
    xx=-18+i*5.6; yy=68+random.uniform(-3,3); h=random.uniform(4.5,7.0)
    box('Distant college garden wing',sky_stone,(xx,yy,h/2),(4.2,3.0,h),.04)
    for row in range(3):
        for dx in (-1.1,0,1.1): box('Distant college window',dark,(xx+dx,yy-1.53,1.0+row*1.7),(.50,.035,1.1),.08)
    box('Garden building cornice',ivory,(xx,yy,h+.03),(4.50,3.20,.17),.025)
zone='interior'

LAYOUT={'id':'lux-umbrarum-pool-commons','dimensions':[HALL_WIDTH,16.6,6.4],
 'bounds':{'minX':-HALF_HALL+.1,'maxX':HALF_HALL-.1,'minZ':-6.82,'maxZ':12.08},
 'pool':{'minX':-HALF_POOL-.16,'maxX':HALF_POOL+.16,'minZ':-3.75,'maxZ':3.75,'depth':1.6,'waterLevel':-.19},
 'board':BOARD,'ladder':LADDER,'seating':seating,'colliders':colliders,'ceilingArches':0,'instruments':INSTRUMENTS,
 'features':['wider rectangular tiled aquamarine pool','three tall real arched windows',
 'ivory paneling and flat coffered ceiling','seven pearl and platinum canvas loungers on all four sides',
 'climbable brass board access steps and pool exit ladder',
 'all nine reclining seats face the pool centre','two elongated spherical pods with upper and lower metallic DNA helix chains',
 'Art Deco local-time clock with pressure, O₂ and CO₂ concentration gauges','mechanical brass cantilever diving platform',
 'copper pipework and perforated bronze board','recessed libraries and antique books','classical marble bust',
 'olive tree and three-dimensional courtyard garden'],
 'walkable':[{'minX':-HALF_HALL+.2,'maxX':HALF_HALL-.2,'minZ':-6.80,'maxZ':9.40},
             {'minX':-6.74,'maxX':-4.26,'minZ':9.30,'maxZ':12.05}],
 'openingSchedule':[{'type':'window','center':[cx,7.03],'width':2.62,'bottom':1.1,'spring':4.7,'radius':1.31} for cx in WINDOWS]+
 [{'type':'door','center':[-5.5,-9.63],'width':2.5,'spring':2.7,'destination':'Lux Umbrarum dormitory corridor'}],
}

# Material-grouped meshes maintain a small draw-call budget. Water remains a
# separate named mesh for the runtime ripple update. No presentation rig exports.
optimized=bpy.data.collections.new('POOL | optimized runtime'); scene.collection.children.link(optimized)
for obj in parts:
    if obj.type!='MESH' or not obj.data.materials: continue
    mat=obj.data.materials[0]
    if mat not in (plaster,tiles,wood,linen,brass): continue
    mesh=obj.data; uv=mesh.uv_layers.active or mesh.uv_layers.new(name='Physical surface UV')
    scale=.88 if mat==tiles else 1.0
    for poly in mesh.polygons:
        axis=max(range(3),key=lambda i:abs(poly.normal[i])); axes=[i for i in range(3) if i!=axis]
        for loop in poly.loop_indices:
            co=mesh.vertices[mesh.loops[loop].vertex_index].co
            uv.data[loop].uv=(co[axes[0]]/scale,co[axes[1]]/scale)
root=bpy.data.objects.new('POOL__Lux_Umbrarum',None); optimized.objects.link(root); root['layout_json']=json.dumps(LAYOUT)
parents={}
for name in ('interior','exterior'):
    parent=bpy.data.objects.new('POOL__'+name,None); optimized.objects.link(parent); parent.parent=root; parents[name]=parent
bpy.context.view_layer.update(); depsgraph=bpy.context.evaluated_depsgraph_get(); groups={}; merged=[]
for obj in parts:
    if obj.type not in ('MESH','CURVE','FONT'): continue
    evaluated=obj.evaluated_get(depsgraph); mesh=bpy.data.meshes.new_from_object(evaluated,preserve_all_data_layers=True,depsgraph=depsgraph)
    if obj.get('clock_hand'):
        matrix=obj.matrix_world; pivot=matrix.translation.copy(); normal_matrix=matrix.to_3x3().inverted().transposed()
        normals=[tuple((normal_matrix @ n.vector).normalized()) for n in mesh.corner_normals]
        for vertex in mesh.vertices: vertex.co=matrix @ vertex.co-pivot
        mesh.normals_split_custom_set(normals); mesh.update()
        moving=bpy.data.objects.new('POOL__clock_'+obj['clock_hand']+'_hand',mesh); optimized.objects.link(moving)
        moving.location=pivot; moving.parent=parents['interior']; moving['clock_hand']=obj['clock_hand']; moving['rest_angle']=obj['rest_angle']
        merged.append(moving); continue
    key=(obj['zone'],mesh.materials[0].name)
    vertices,faces,uvs,smooth,normals=groups.setdefault(key,([],[],[],[],[]))
    offset=len(vertices); matrix=obj.matrix_world; normal_matrix=matrix.to_3x3().inverted().transposed()
    vertices.extend(tuple(matrix @ v.co) for v in mesh.vertices)
    faces.extend(tuple(v+offset for v in p.vertices) for p in mesh.polygons); smooth.extend(p.use_smooth for p in mesh.polygons)
    uvs.extend(tuple(uv.uv) for uv in mesh.uv_layers.active.data) if mesh.uv_layers.active else uvs.extend((0,0) for loop in mesh.loops)
    normals.extend(tuple((normal_matrix @ normal.vector).normalized()) for normal in mesh.corner_normals)
    bpy.data.meshes.remove(mesh)
for (name,mat),(vertices,faces,uvs,smooth,normals) in groups.items():
    mesh=bpy.data.meshes.new('POOL__'+name+'__'+mat.replace(' ','_')); mesh.from_pydata(vertices,[],faces); mesh.materials.append(bpy.data.materials[mat]); mesh.polygons.foreach_set('use_smooth',smooth)
    uv=mesh.uv_layers.new(name='Baked surface UV'); uv.data.foreach_set('uv',np.asarray(uvs,dtype=np.float32).ravel())
    mesh.normals_split_custom_set(normals); mesh.update(); obj=bpy.data.objects.new(mesh.name,mesh); optimized.objects.link(obj); obj.parent=parents[name]; merged.append(obj)
authored.hide_render=True; authored.hide_viewport=True
bpy.ops.object.select_all(action='DESELECT')
for obj in optimized.objects: obj.select_set(True)
bpy.context.view_layer.objects.active=root
temporary_asset=ASSET.with_name(ASSET.stem+'.building.glb')
bpy.ops.export_scene.gltf(filepath=str(temporary_asset),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
REPORT={'asset':str(ASSET),'bytes':temporary_asset.stat().st_size,'triangles':sum(sum(len(p.vertices)-2 for p in obj.data.polygons) for obj in merged),
        'materialPrimitives':len(merged),'editableComponents':len(parts),'layout':LAYOUT}
if REPORT['triangles']>750000 or len(merged)>40 or REPORT['bytes']>40*1024*1024: raise RuntimeError('Pool room runtime budget exceeded')
temporary_asset.replace(ASSET); (HERE/'asset-report.json').write_text(json.dumps(REPORT,indent=2)+'\n')

studio=bpy.data.collections.new('PRESENTATION | pool cameras and lights'); scene.collection.children.link(studio)
world=bpy.data.worlds.new('Sunlit ivory pool atmosphere'); world.use_nodes=True; world.node_tree.nodes['Background'].inputs['Color'].default_value=(.77,.81,.80,1); world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65; scene.world=world
for name,p,energy,size,target in [('Window afternoon sun',(-5,9,7),2300,2.0,(-1,-2,0)),('Pool ceiling bounce',(1,-1,5.8),190,8,(0,0,0)),('Camera soft fill',(-5,-5,4),65,5,(0,3,1))]:
    data=bpy.data.lights.new(name,'AREA'); data.energy=energy; data.size=size
    obj=bpy.data.objects.new(name,data); studio.objects.link(obj); obj.location=p; obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('Pool reference composition'); camera=bpy.data.objects.new(data.name,data); studio.objects.link(camera)
camera.location=(-4.3,-8.0,1.80); camera.rotation_euler=(Vector((.90,2.10,1.30))-camera.location).to_track_quat('-Z','Y').to_euler(); data.lens=23
scene.camera=camera; scene.render.engine='CYCLES'; scene.cycles.samples=40; scene.cycles.use_denoising=True
scene.render.resolution_x=1600; scene.render.resolution_y=900; scene.render.resolution_percentage=100; scene.view_settings.view_transform='AgX'
bpy.data.libraries.write(str(HERE/'lux-umbrarum-pool-commons.blend'),{scene},fake_user=True,compress=True)
print('POOL_COMMONS_EXPORTED '+json.dumps({key:val for key,val in REPORT.items() if key!='layout'}))
