"""Deterministic photograph-derived ivory library ensemble. Metres, Z up.

Front -Y; runtime rotates +90 degrees about Y onto Liminette's west wall.
All texture pixels are generated locally, packed and embedded in the GLB.
"""
from pathlib import Path
import bpy,bmesh,math,json,random,numpy as np
from mathutils import Vector
HERE=Path(__file__).resolve().parent; ROOT=HERE.parents[2]
ASSET=ROOT/'public/apartments/assets/liminette-ivory-library.glb'
EVIDENCE=ROOT/'test-artifacts/liminette-library'; TEXTURES=HERE/'textures'
for folder in (ASSET.parent,EVIDENCE,TEXTURES): folder.mkdir(parents=True,exist_ok=True)
random.seed(51426); rng=np.random.default_rng(51426)
scene=bpy.data.scenes.new('Liminette | Ivory Library'); bpy.context.window.scene=scene
scene['generator']='liminette-ivory-library'
for previous in list(bpy.data.scenes):
    if previous==scene or previous.get('generator')!='liminette-ivory-library': continue
    for obj in list(previous.objects):
        if not any(obj.name in other.objects for other in bpy.data.scenes if other!=previous): bpy.data.objects.remove(obj,do_unlink=True)
    bpy.data.scenes.remove(previous)
scene.unit_settings.system='METRIC'
authored=bpy.data.collections.new('LIBRARY | editable components'); scene.collection.children.link(authored)
parts=[]; colliders=[]; zone='library'
serif_font=bpy.data.fonts.load(r'C:\Windows\Fonts\times.ttf'); serif_font.pack()
exec(compile((HERE/'model_helpers.py').read_text(),str(HERE/'model_helpers.py'),'exec'))
y,x=np.mgrid[:1024,:1024].astype(np.float32)/1024; noise=rng.normal(0,.015,x.shape)
plaster=material('Ivory painted plaster',(1,1,1),.84,base=np.clip(np.array([.88,.85,.78])+noise[:,:,None]*.3,0,1),bump=normal(noise,2))
ivory=material('Warm ivory joinery',(.87,.84,.76),.66)
shadow=material('Warm recess shadow',(.54,.51,.43),.92)
brass=material('Brushed antique brass',(1,1,1),.30,.78,base=np.clip(np.array([.70,.53,.27])+(.016*np.sin(x*840+y*4)+noise*.2)[:,:,None],0,1),bump=normal(noise,.5))
bronze=material('Dark bronze fittings',(.21,.13,.06),.38,.76)
ink=material('Engraved dark ink',(.065,.046,.025),.7)
paper=material('Aged cream pages',(.73,.66,.53),.95)
bookmats=[material('Pale cloth book '+str(i),c,.91) for i,c in enumerate([(.78,.73,.62),(.68,.61,.48),(.87,.82,.71),(.61,.56,.48),(.81,.77,.69),(.65,.70,.69)])]
# Boucle: baked looping yarn detail, stable in the exported viewer.
cell_radius=np.sqrt(((x*160)%1-.5)**2+((y*160)%1-.5)**2)
loop=.024*np.exp(-((cell_radius-.29)/.07)**2)+.006*np.sin(y*math.tau*190)+noise*.5
cloth=material('Cream boucle upholstery',(1,1,1),.98,base=np.clip(np.array([.88,.85,.77])+loop[:,:,None],0,1),bump=normal(loop,8))
cloth.node_tree.nodes.get('Principled BSDF').inputs['Sheen Weight'].default_value=.32
# Paired V stitches and twisted wool fibres, baked into exportable maps.
stitch_x=(x*38)%1; stitch_y=(y*58)%1
strand=np.exp(-((stitch_x-(.24+.40*stitch_y))/.075)**2)+np.exp(-((stitch_x-(.76-.40*stitch_y))/.075)**2)
wool_height=.16*strand+.008*np.sin(x*math.tau*420+y*math.tau*180)+noise*.55
knit=material('Chunky cream wool',(1,1,1),.98,base=np.clip(np.array([.81,.77,.67])+(.025*strand+noise*.30)[:,:,None],0,1),bump=normal(wool_height,6))
knit.node_tree.nodes.get('Principled BSDF').inputs['Sheen Weight'].default_value=.55
grain=.018*np.sin(y*math.tau*23+np.sin(x*math.tau*3)*.7)+.009*np.sin(y*math.tau*91+x*6)+noise*.45
walnut=material('Matching walnut window joinery',(1,1,1),.51,base=np.clip(np.array([.24,.13,.061])+grain[:,:,None]*np.array([1,.62,.34]),0,1),bump=normal(grain,3))
glass=material('Valve smoked glass',(.42,.31,.19),.14,0)
glass.node_tree.nodes.get('Principled BSDF').inputs['Transmission Weight'].default_value=.55
glass.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value=.20
glass.surface_render_method='DITHERED'
amber=material('Warm valve filament',(.98,.40,.10),.35,emission=3.2)
diffuser=material('Opal globe diffuser',(.93,.89,.78),.36,emission=.65)
screen=material('Dark curved CRT glass',(.018,.027,.039),.27,.08)
screen.node_tree.nodes.get('Principled BSDF').inputs['Coat Weight'].default_value=.25
windowglass=material('Clear library window',(.79,.89,.94),.11)
windowglass.node_tree.nodes.get('Principled BSDF').inputs['Transmission Weight'].default_value=1
windowglass.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value=.1
windowglass.surface_render_method='DITHERED'
wood=material('Light honey oak',(.43,.31,.18),.66)
flower=material('Dried copper petals',(.47,.28,.14),.8)

def outline(cx,yy,z,w,h):
    for sx in (-1,1): box('Raised plaster panel stile',ivory,(cx+sx*w/2,yy,z),(.027,.032,h),.008)
    for sz in (-1,1): box('Raised plaster panel rail',ivory,(cx,yy,z+sz*h/2),(w,.032,.027),.008)
def beam(name,mat,a,b,r=.018): return tube(name,mat,[a,b],r)
def rounded(name,mat,p,scale,exp=.62,segments=40,rings=24,latitude_details=False):
    # Superellipsoid pillow surfaces: rounded panels with full, pillowed centres.
    def power(v): return math.copysign(abs(v)**exp,v)
    verts=[]; faces=[]; uvs=[]
    angles=list(np.linspace(-math.pi/2,math.pi/2,rings+1))
    if latitude_details: angles=sorted(angles+[-.060,-.042,-.025,-.014,.014,.025,.042,.060])
    rings=len(angles)-1
    for j,a in enumerate(angles):
        for i in range(segments+1):
            t=i*math.tau/segments
            verts.append((scale[0]*power(math.cos(a))*power(math.cos(t)),scale[1]*power(math.cos(a))*power(math.sin(t)),scale[2]*power(math.sin(a))))
            uvs.append((i/segments*scale[0]*4,j/rings*scale[2]*4))
    for j in range(rings):
        for i in range(segments):
            q=j*(segments+1)+i; faces.append((q,q+1,q+segments+2,q+segments+1))
    obj=finish(mesh_object(name,mat,verts,faces,uvs)); obj.location=p; return obj

# Wall elevation matches the reference's shelf / television / shelf hierarchy.
box('Continuous ivory library wall',plaster,(0,.13,2.6),(7.8,.24,5.2),.008)
for xx in (-3.79,-1.61,1.61,3.72):
    box('Fluted library pilaster',ivory,(xx,-.07,2.52),(.18,.22,4.96),.016)
    for dx in (-.047,0,.047): box('Pilaster carved groove',plaster,(xx+dx,-.19,2.58),(.015,.016,4.15),.006)
    for z,w,h in [(.11,.28,.20),(.28,.25,.08),(4.65,.34,.12),(4.78,.28,.14),(4.93,.35,.13)]: box('Layered Corinthian capital',ivory,(xx,-.08,z),(w,.28,h),.014)
    for dx in (-.09,0,.09):
        leaf=sphere('Carved acanthus leaf',ivory,(xx+dx,-.24,4.81),(.058,.026,.11),12,8); leaf.rotation_euler.y=dx*4
for z,h,depth in [(0.08,.15,.2),(.27,.055,.19),(4.99,.07,.25),(5.07,.11,.32),(5.18,.05,.35)]:
    box('Continuous layered library cornice',ivory,(0,-.02,z),(7.88,depth,h),.012)
for xx in np.arange(-3.75,3.85,.11): box('Cornice dentil',ivory,(float(xx),-.155,5.01),(.055,.06,.055),.006)
outline(0,-.024,4.52,2.90,.64); outline(0,-.024,3.99,2.90,.26)

def volume(cx,yy,z,w,h,d,color,tilt=0):
    obj=box('Pale linen library volume',bookmats[color],(cx,yy,z+h/2),(w,d,h),.006,(0,tilt,0))
    box('Book page block',paper,(cx,yy+.016,z+h/2),(w*.79,d*.93,h*.94),.002)
    for zz in (z+.075,z+h-.075): box('Small faded spine rule',bronze,(cx,yy-d/2-.004,zz),(w*.67,.005,.004),.001)
    # Embossed marks stay small, varied and muted like old cream cloth covers.
    for row in range(3): box('Faded spine title mark',bronze,(cx,yy-d/2-.004,z+h*.71-row*.014),(w*.58,.005,.0025),0)
def shelves(cx,width):
    box('Library recessed ivory backing',shadow,(cx,-.028,2.53),(width,.035,4.71),0)
    for side in (-1,1): box('Built-in bookshelf stile',ivory,(cx+side*(width/2+.035),-.27,2.52),(.07,.51,4.75),.01)
    for level in range(8):
        zz=.22+level*.61; box('Ivory shelf with rounded lip',ivory,(cx,-.27,zz),(width,.53,.055),.01)
        if level==7: continue
        xx=cx-width/2+.03
        while xx<cx+width/2-.08:
            w=random.uniform(.062,.105); h=random.uniform(.40,.54); d=random.uniform(.24,.31)
            volume(xx+w/2,-.24-random.uniform(0,.035),zz+.028,w,h,d,random.choices(range(6),weights=[5,2,6,1,4,.4])[0])
            xx+=w+random.uniform(.003,.010)
    collide(cx,-.25,width+.16,.57,4.95)
shelves(-2.73,1.96); shelves(2.65,1.73)

# Ladder on the left bay, with its feet attached to the floor.
for xx in (-2.60,-1.94):
    beam('Brass rolling ladder rail',brass,(xx,-1.16,.07),(xx,-.52,3.62),.027)
    cylinder('Ladder round foot',bronze,(xx,-1.16,.028),.061,.056,vertices=20)
    sphere('Ladder rail finial',brass,(xx,-.52,3.62),(.044,.045,.052),16,8)
for i in range(10):
    z=.24+i*.32; yy=-1.16+(z-.07)/3.55*.64
    beam('Brass ladder rung',brass,(-2.62,yy,z),(-1.92,yy,z),.025)
beam('Library ladder rolling track',brass,(-3.67,-.48,3.53),(-1.72,-.48,3.53),.025)
collide(-2.28,-.88,.81,.85,3.68)

def rim(name,mat,xx,yy,z,w,h,thick,depth):
    for sx in (-1,1): box(name,mat,(xx+sx*(w-thick)/2,yy,z),(thick,depth,h),min(.04,thick*.3))
    for sz in (-1,1): box(name,mat,(xx,yy,z+sz*(h-thick)/2),(w-thick*2,depth,thick),min(.04,thick*.3))
def knob(xx,yy,z,r=.04):
    cylinder('TV machined control knob',brass,(xx,yy,z),r,.06,(math.pi/2,0,0),24)
    cylinder('Control centre',bronze,(xx,yy-.037,z),r*.65,.016,(math.pi/2,0,0),20)
    beam('Control index mark',ivory,(xx,yy-.048,z+r*.25),(xx,yy-.048,z+r*.60),.002)
def valve(xx,yy,z,h=.58,r=.055):
    cylinder('Vacuum valve black base',ink,(xx,yy,z+.035),r*1.12,.07,vertices=24)
    cylinder('Vacuum valve brass collar',brass,(xx,yy,z+.09),r*.98,.055,vertices=24)
    cylinder('Smoked glass valve envelope',glass,(xx,yy,z+h*.54),r,h*.78,vertices=24)
    sphere('Valve glass rounded crown',glass,(xx,yy,z+h*.93),(r,r,r*.70),20,10)
    cylinder('Valve upper metal cap',bronze,(xx,yy,z+h*.88),r*.92,.025,vertices=24)
    for dz in (.26,.7): cylinder('Valve internal electrode',bronze,(xx,yy,z+h*dz),r*.65,.025,vertices=16)
    cylinder('Illuminated valve filament',amber,(xx,yy-.012,z+h*.43),r*.23,h*.23,vertices=12)
    for dx in (-r*.5,r*.5): beam('Valve electrode support',brass,(xx+dx,yy,z+.07),(xx+dx,yy,z+h*.85),.004)
    beam('Valve tip contact',brass,(xx,yy,z+h),(xx,yy,z+h+.022),.006)

# Large warm brass CRT, broad lower control strip and warm valve lamps.
box('Rounded brass TV chassis',brass,(0,-.18,3.0),(2.95,.26,1.93),.13)
box('Black TV inset',ink,(0,-.325,3.06),(2.39,.022,1.58),.07)
rounded('Convex dark television glass',screen,(0,-.368,3.10),(1.10,.064,.686),.22,64,36)
rim('TV inner brass screen bezel',brass,0,-.39,3.10,2.32,1.48,.037,.023)
for sx in (-1,1):
    for dz in (.73,.47,-.16): knob(sx*1.33,-.351,3.0+dz,.034 if dz==.47 else .045)
    for z in np.arange(3.05,3.52,.023): box('TV side ventilation grille',bronze,(sx*1.33,-.327,float(z)),(.13,.012,.007),.002)
    valve(sx*1.29,-.42,2.18,.50,.052)
box('TV control strip',brass,(0,-.35,2.165),(2.79,.09,.23),.025)
for xx in (-1.24,-.96,-.77,-.63,.72,.88,1.18): knob(xx,-.41,2.17,.035)
rim('Engraved television maker plate',bronze,0,-.405,2.165,.96,.17,.009,.005)
label('ANALOG ENGINE',(0,-.414,2.181),.065,ink)
label('LUX UMBRARUM',(0,-.414,2.125),.034,ink)
collide(0,-.18,3.0,.60,4.01)

# Fireplace-sized valve bank: twelve tall glowing tubes, then a second short row.
box('Valve alcove shadow backing',ink,(0,-.055,.95),(2.84,.07,1.78),.01)
rim('Brass valve display surround',brass,0,-.24,.96,2.95,1.89,.135,.30)
box('Projecting brass valve hearth',brass,(0,-.35,.055),(3.10,.80,.11),.025)
box('Brass valve rack lower chassis',brass,(0,-.29,.38),(2.56,.37,.43),.025)
box('Brass valve rack upper chassis',brass,(-.34,-.23,.64),(1.88,.34,.16),.015)
for xx in np.linspace(-1.09,1.09,12): valve(float(xx),-.26,.73,.79,.063)
for xx in np.linspace(-.85,.18,6): valve(float(xx),-.49,.27,.40,.048)
for xx in (.52,.84):
    box('Analog rack meter',ivory,(xx,-.492,.61),(.27,.045,.21),.02)
    rim('Analog meter brass bezel',bronze,xx,-.52,.61,.28,.22,.012,.018)
    beam('Analog meter needle',ink,(xx-.07,-.532,.55),(xx+.04,-.532,.665),.003)
for xx in (-1.19,1.17): knob(xx,-.48,.43,.085)
label('ANALOG ENGINE',(0,-.49,.135),.068,ink)
for xx in (-1.21,-1.04,-.92,.46,.61,.79,1.00):
    for zz in (.30,.47): cylinder('Valve chassis ventilation hole',ink,(xx,-.482,zz),.012,.006,(math.pi/2,0,0),12)
collide(0,-.25,3.12,.80,1.92)

def sconce(xx,yy,z,rotation=0):
    start=len(parts)
    cylinder('Sconce brass wall rose',brass,(xx,yy,z-.18),.085,.045,(math.pi/2,0,0),24)
    tube('Sconce curved brass stem',brass,[(xx,yy-.025,z-.18),(xx,yy-.15,z-.18),(xx,yy-.24,z-.10),(xx,yy-.24,z+.08)],.024)
    cylinder('Sconce globe cup',brass,(xx,yy-.24,z+.065),.059,.09,vertices=24)
    sphere('Opal globe wall lamp',diffuser,(xx,yy-.24,z+.205),(.14,.14,.14),32,16)
    ring('Globe brass equator',brass,(xx,yy-.24,z+.205),.141,.008)
for xx in (-1.82,1.85,3.64): sconce(xx,-.20,3.12 if xx<0 else 2.62)

# A single arch matches the adjoining original walnut-and-brass windows.
wall=box('Adjoining single-window wall',plaster,(4.08,-2.21,2.59),(.24,4.50,5.18),0)
cy=-2.21;radius=1.08;spring=3.57;bottom=1.15
outline=[(-radius,bottom),(radius,bottom),(radius,spring)]
outline.extend((radius*math.cos(a),spring+radius*math.sin(a)) for a in np.linspace(0,math.pi,65)[1:])
n=len(outline);verts=[(4.08+d,cy+u,z) for d in (-.5,.5) for u,z in outline]
faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
cutter=mesh_object('Temporary true window aperture',None,verts,faces)
bm=bmesh.new();bm.from_mesh(cutter.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(cutter.data);bm.free()
bpy.context.view_layer.objects.active=wall;bpy.context.view_layer.update()
mod=wall.modifiers.new('True single arched opening','BOOLEAN');mod.object=cutter;mod.operation='DIFFERENCE';mod.solver='EXACT';bpy.ops.object.modifier_apply(modifier=mod.name)
parts.remove(cutter);bpy.data.objects.remove(cutter,do_unlink=True)
for r,xx,thickness,name in [(1.08,3.93,.080,'Walnut arched window frame'),(1.15,3.91,.036,'Layered walnut window arch')]:
    points=[(xx,cy-r,bottom),(xx,cy-r,spring)]+[(xx,cy+r*math.cos(a),spring+r*math.sin(a)) for a in np.linspace(math.pi,0,65)]+[(xx,cy+r,bottom)]
    tube(name,walnut,points,thickness)
verts=[(4.12,cy-1.06,1.17),(4.12,cy+1.06,1.17)]+[(4.12,cy+1.06*math.cos(a),spring+1.06*math.sin(a)) for a in np.linspace(0,math.pi,65)]
finish(mesh_object('Clear arched window glazing',windowglass,verts,[tuple(range(len(verts)))]),smooth=False)
for dy in (-.54,0,.54):
    top=spring+math.sqrt(1.06**2-dy**2)
    beam('Brass window vertical tracery',brass,(3.99,cy+dy,1.17),(3.99,cy+dy,top),.015)
for zz in (2.14,3.17,3.57):beam('Brass window horizontal tracery',brass,(3.97,cy-1.06,zz),(3.97,cy+1.06,zz),.015)
beam('Window brass handle',brass,(3.91,cy-.055,2.25),(3.91,cy-.055,2.40),.012)
box('Deep walnut window sill',walnut,(3.82,cy,1.11),(.68,2.55,.105),.018)
box('Window walnut wainscot',walnut,(3.92,cy,.67),(.23,4.50,1.30),.008)
for yy in (-.76,-2.21,-3.66):
    for sy in (-1,1):box('Walnut window panel stile',walnut,(3.78,yy+sy*.62,.60),(.045,.035,1.03),.006)
    for zz in (.12,1.10):box('Walnut window panel rail',walnut,(3.78,yy,zz),(.045,1.26,.035),.006)
for z,h,d in [(.09,.12,.30),(1.34,.045,.25),(4.90,.10,.27),(5.02,.07,.35)]:box('Matching brown window wall rail',walnut,(4.0,cy,z),(d,4.62,h),.016)
# Upper plaster and the existing white ceiling crown remain ivory.
box('White window ceiling crown',ivory,(4.0,cy,5.10),(.44,4.62,.12),.02)
collide(4.00,cy,.42,4.5,5.20)

# Keep the reference still life, regrouped on the one deep walnut sill.
for yy in (-1.95,-2.48):
    for i in range(3):box('Window sill stacked pale book',bookmats[2],(3.56,yy,1.20+i*.04),(.31,.37,.036),.006,(0,0,.07-i*.06))
cylinder('Porcelain lidded jar',ivory,(3.57,-2.20,1.39),.075,.38,vertices=32)
cylinder('Porcelain jar lid',ivory,(3.57,-2.20,1.59),.084,.04,vertices=32)
box('Botanical vitrine wood base',wood,(3.55,-1.32,1.175),(.43,.53,.06),.008)
for xx in (3.35,3.75):
    for yy in (-1.56,-1.08):beam('Fine brass glass case upright',bronze,(xx,yy,1.20),(xx,yy,1.72),.006)
for zz in (1.20,1.72):
    for xx in (3.35,3.75):beam('Fine case frame',bronze,(xx,-1.56,zz),(xx,-1.08,zz),.005)
    for yy in (-1.56,-1.08):beam('Fine case frame',bronze,(3.35,yy,zz),(3.75,yy,zz),.005)
for i in range(5):
    yy=-1.52+i*.10;xx=3.52+random.uniform(-.06,.06);h=random.uniform(.25,.47)
    tube('Dried botanical stem',wood,[(xx,yy,1.21),(xx+.025,yy,1.21+h)],.004)
    for dz in (.45,.8):
        for side in (-1,1):
            leaf=sphere('Dried petal in glass vitrine',flower,(xx+side*.042,yy,1.21+h*dz),(.055,.012,.038),12,8);leaf.rotation_euler.y=side*.6
cy=-3.11;cylinder('Sill globe pedestal',brass,(3.57,cy,1.23),.14,.13,vertices=32)
beam('Sill globe stand',brass,(3.57,cy,1.25),(3.57,cy,1.45),.022)
sphere('Brass terrestrial globe',brass,(3.57,cy,1.61),(.20,.20,.20),40,24)
ring('Globe meridian',bronze,(3.57,cy,1.61),.23,.012,(math.pi/2,.3,0))
ring('Globe equator',bronze,(3.57,cy,1.61),.202,.008)

# Small pale desk at the window, consistent with the reference.
box('Library side table top',ivory,(2.97,-.90,.84),(.83,.57,.075),.012)
box('Side table drawer',ivory,(2.97,-.90,.73),(.75,.50,.14),.012)
for xx in (2.65,3.28):
    for yy in (-1.12,-.68): box('Side table tapered leg',ivory,(xx,yy,.36),(.042,.042,.72),.006)
knob(2.97,-1.17,.73,.012)
cylinder('Brass desk lamp foot',brass,(2.96,-.90,.905),.08,.04,vertices=24)
beam('Brass desk lamp stem',brass,(2.96,-.9,.925),(2.96,-.9,1.41),.011)
sphere('Desk lamp dome',brass,(2.96,-.90,1.45),(.12,.12,.075),24,12)

# Rounded sofa, six quilted vertical lobes with an uninterrupted pillowed outline.
# Foreground writing table, green banker lamp, paper and a brass microscope.
green_glass=material('Emerald banker lamp glass',(.035,.23,.07),.23,.07)
box('Foreground ivory writing table',ivory,(-3.46,-3.04,.83),(1.38,.75,.075),.018)
box('Writing table shallow drawer',ivory,(-3.46,-3.04,.72),(1.29,.68,.15),.012)
for xx in (-4.03,-2.89):
    for yy in (-3.32,-2.77):
        box('Writing table square leg',ivory,(xx,yy,.35),(.064,.064,.70),.006)
        cylinder('Writing table brass ferrule',brass,(xx,yy,.04),.042,.07,vertices=16)
for i in range(7): box('Loose desk paper stack',paper,(-3.34,-3.08,.877+i*.007),(.51,.42,.006),.003,(0,0,.04-i*.01))
box('Desk closed cream book',bookmats[2],(-3.66,-3.1,.887),(.29,.38,.055),.004,(0,0,.10))
xx,yy=-3.92,-2.94
cylinder('Banker lamp brass foot',brass,(xx,yy,.89),.10,.042,vertices=24)
beam('Banker lamp stem',brass,(xx,yy,.91),(xx,yy,1.27),.018)
rounded('Green banker lamp shade',green_glass,(xx,yy,1.31),(.20,.105,.088),.6,32,16)
beam('Banker lamp shade hinge',brass,(xx-.20,yy,1.29),(xx+.20,yy,1.29),.015)
for side in (-1,1):beam('Banker lamp bracket',brass,(xx+side*.18,yy,1.28),(xx+side*.12,yy,1.19),.01)
cylinder('Microscope weighted foot',bronze,(-3.0,-2.92,.895),.085,.06,vertices=24)
tube('Microscope brass curved arm',brass,[(-3.0,-2.92,.92),(-3.04,-2.92,1.13),(-2.99,-2.92,1.23),(-2.90,-2.92,1.23)],.019)
beam('Microscope black eyepiece',ink,(-2.90,-2.92,1.07),(-2.91,-2.92,1.33),.028)
box('Microscope specimen stage',bronze,(-2.91,-2.92,1.02),(.14,.11,.018),.004)
collide(-3.46,-3.04,1.46,.80,1.41)
box('Window side ivory drawer cabinet',ivory,(3.35,-4.02,.43),(.57,.52,.86),.018)
for zz in (.19,.47,.72):
    box('Window cabinet inset drawer',ivory,(3.05,-4.02,zz),(.02,.43,.20),.007)
    cylinder('Window drawer brass pull',brass,(3.025,-4.02,zz),.013,.035,(0,math.pi/2,0),16)
collide(3.35,-4.02,.66,.60,.90)

sofa_y=-4.85;sofa_shapes=[]
for i in range(6):
    xx=-1.725+i*.69
    rounded('Sofa quilted lower lobe',cloth,(xx,sofa_y,.32),(.385,1.08,.31),.73)
    rounded('Sofa padded seat lobe',cloth,(xx,sofa_y+.28,.56),(.384,.75,.22),.72)
    sofa_shapes.extend([((xx,sofa_y,.32),(.385,1.08,.31),.73),((xx,sofa_y+.28,.56),(.384,.75,.22),.72)])
    back=rounded('Sofa rounded high back lobe',cloth,(xx,sofa_y-.76,.71),(.385,.31,.59),.72,latitude_details=True)
    sofa_shapes.append(((xx,sofa_y-.76,.71),(.385,.31,.59),.72))
    # A soft horizontal tuck joins the quilt rows in one continuous skin.
    for vertex in back.data.vertices:
        seam=math.exp(-((vertex.co.z+.71-.63)/.048)**2)
        vertex.co.y*=1-.18*seam
    # Fine seams describe the quilting without deep crevices.
    if i<5: tube('Sofa vertical quilt seam',knit,[(xx+.345,sofa_y-1.06,.19),(xx+.345,sofa_y-1.07,.54),(xx+.345,sofa_y-1.05,.97)],.0025)
for sx in (-1,1):
    rounded('Rounded sofa arm',cloth,(sx*2.05,sofa_y-.03,.73),(.28,.86,.40),.82)
    sofa_shapes.append(((sx*2.05,sofa_y-.03,.73),(.28,.86,.40),.82))
collide(0,sofa_y,4.66,2.22,1.32)

# Huge wool blanket: seat, rounded back, long falling drapes and a pooled hem.
profile=np.array([[0,1.29,.065],[.10,1.045,.55],[.18,.90,.795],[.36,.10,.825],[.45,-.38,.96],[.58,-.69,1.355],[.67,-1.09,1.06],[.87,-1.20,.11],[1,-1.53,.045]])
profile_slopes=np.gradient(profile[:,1:],profile[:,0],axis=0)
def smooth_profile(t):
    k=min(len(profile)-2,max(0,int(np.searchsorted(profile[:,0],t))-1))
    a,b=profile[k],profile[k+1];h=b[0]-a[0];q=(t-a[0])/h
    return (2*q**3-3*q**2+1)*a[1:]+(q**3-2*q**2+q)*h*profile_slopes[k]+(-2*q**3+3*q**2)*b[1:]+(q**3-q**2)*h*profile_slopes[k+1]
def throw_surface(u,v):
    xx=-1.10+u*2.92+.040*math.sin(v*12+u*4)+.12*(v-.5)
    yy,zz=smooth_profile(v)
    fold=.009+.012*math.sin(v*math.pi)**2
    wave=.65*math.sin(u*math.tau*3.5+v*3+u*u*2)+.25*math.sin(u*math.tau*8-v*6)
    zz+=fold*(wave+1.0)*(.22+.78*math.sin(v*math.pi))
    yy+=.025*wave+.08*(u-.5)*math.cos(v*math.pi)
    if v>.86:zz+=.022*math.sin((v-.86)/.14*math.pi*3+u*4)**2
    yy+=sofa_y
    # Conform to the actual superellipsoid upholstery: rest above the front
    # surfaces, then roll against the outer back rather than intersecting it.
    for centre,scale,exponent in sofa_shapes:
        power=2/exponent
        if v<=.62:
            remain=1-abs((xx-centre[0])/scale[0])**power-abs((yy-centre[1])/scale[1])**power
            if remain>0:zz=max(zz,centre[2]+scale[2]*remain**(1/power)+.023+fold*(wave+1))
        else:
            remain=1-abs((xx-centre[0])/scale[0])**power-abs((zz-centre[2])/scale[2])**power
            if remain>0 and yy<centre[1]:yy=min(yy,centre[1]-scale[1]*remain**(1/power)-.024)
    return (xx,yy,zz)
verts=[];faces=[];uvs=[];nu,nv=56,110
for j in range(nv+1):
    for i in range(nu+1):verts.append(throw_surface(i/nu,j/nv));uvs.append((i/nu,j/nv))
for j in range(nv):
    for i in range(nu):q=j*(nu+1)+i;faces.append((q,q+nu+1,q+nu+2,q+1))
throw=finish(mesh_object('Draped wool throw substrate',knit,verts,faces,uvs))
mod=throw.modifiers.new('Soft blanket thickness','SOLIDIFY');mod.thickness=.018;mod.offset=-.35
def throw_normal(u,v):
    tangent_u=Vector(throw_surface(u+.001,v))-Vector(throw_surface(u-.001,v))
    tangent_v=Vector(throw_surface(u,min(1,v+.001)))-Vector(throw_surface(u,max(0,v-.001)))
    return tangent_v.cross(tangent_u).normalized()
def soft_yarn(name,points,radius=.024):
    # Dense centreline and six smooth radial faces spend geometry on soft
    # stitch bends, while retaining the room's existing runtime budget.
    verts=[];faces=[];uvs=[]
    for j,point in enumerate(points):
        tangent=(Vector(points[min(len(points)-1,j+1)])-Vector(points[max(0,j-1)])).normalized()
        cross=tangent.cross(Vector((1,0,0))).normalized();across=cross.cross(tangent).normalized()
        r=radius*(1+.035*math.sin(j*.67))
        for k in range(6):
            a=k*math.tau/6;verts.append(tuple(Vector(point)+r*(across*math.cos(a)+cross*math.sin(a))));uvs.append((k/6,j*.047))
    for j in range(len(points)-1):
        for k in range(6):
            q=j*6+k;faces.append((q,j*6+(k+1)%6,(j+1)*6+(k+1)%6,q+6))
    finish(mesh_object(name,knit,verts,faces,uvs))
for i in range(22):
    u=(i+.5)/22
    for side in (-1,1):
        points=[]
        for j in range(229):
            v=j/228;phase=v*math.tau*32+u*.9;tu=u+side*.016*math.sin(phase)
            offset=.024+side*.015*math.cos(phase)
            p=Vector(throw_surface(tu,v))+throw_normal(tu,v)*offset;points.append(tuple(p))
        soft_yarn('Chunky interlaced wool stitch',points)
for edge in (0,1):
    tube('Soft rolled blanket side hem',knit,[throw_surface(edge,j/110) for j in range(111)],.019)
    tube('Soft rolled blanket end hem',knit,[throw_surface(i/56,edge) for i in range(57)],.022)

# Cream / faded blue patterned carpet, generated and embedded rather than a flat colour.
carpet=np.ones((1024,1024,3),dtype=np.float32)*np.array([.73,.69,.58]);carpet+=noise[:,:,None]*.5
border=(np.minimum.reduce([x,1-x,y,1-y])>.045)&(np.minimum.reduce([x,1-x,y,1-y])<.12)
ornament=(abs(np.sin(x*math.tau*16+np.sin(y*math.tau*8)))<.23)|(abs(np.sin(y*math.tau*18+np.sin(x*math.tau*7)))<.17)
carpet[border&ornament]=(.24,.33,.39)
field=(x>.14)&(x<.86)&(y>.14)&(y<.86)
scroll=(abs(np.sin(x*math.tau*10+np.sin(y*math.tau*7)*1.5))<.11)|(abs(np.sin(y*math.tau*11+np.sin(x*math.tau*6)*1.2))<.08)
carpet[field&scroll]=(.34,.40,.42)
medallion=abs(abs(x-.5)*1.1+abs(y-.5)-.26)<.005
carpet[field&medallion]=(.26,.34,.39)
for edge in (.03,.044,.124,.133):
    line=(abs(x-edge)<.0015)|(abs(x-(1-edge))<.0015)|(abs(y-edge)<.0015)|(abs(y-(1-edge))<.0015);carpet[line]=(.38,.42,.41)
rug=material('Faded blue ivory carpet',(1,1,1),.99,base=np.clip(carpet,0,1),bump=normal(loop,4))
obj=box('Faded patterned library rug',rug,(0,sofa_y+.10,.014),(5.28,3.65,.025),.008)
for side in (-1,1):
    for i in range(64): beam('Carpet cotton fringe',knit,(-2.58+i*.082,sofa_y+.10+side*1.83,.015),(-2.58+i*.082,sofa_y+.10+side*1.92,.015),.003)

# Local ivory ceiling replaces dark beams over this scene, with moulded panels.
box('Ivory library ceiling substrate',plaster,(.12,-2.15,5.18),(8.08,4.75,.11),.008)
for xx in (-2.70,-.04,2.62):
    for yy in (-1.10,-3.25):
        for dx in (-1.16,1.16): box('Ivory ceiling panel stile',ivory,(xx+dx,yy,5.109),(.035,1.88,.025),.006)
        for dy in (-.94,.94): box('Ivory ceiling panel rail',ivory,(xx,yy+dy,5.109),(2.34,.035,.025),.006)

LAYOUT={'id':'liminette-ivory-library','features':['ivory built-in libraries','pale cloth books','brass rolling ladder','dark convex brass CRT','illuminated vacuum valve display','opal globe sconces','six-lobe cream boucle sofa-bed','draped cable-knit wool throw','faded blue ivory rug','one walnut-framed arched window','window sill botanical vitrine and globe'],
        'colliders':colliders,'dimensions':[8.15,6.8,5.25], 'windowOpening':{'centerX':-8.70,'width':4.45,'bottom':1.04,'top':4.72},
        'valves':{'upper':12,'lower':6,'television':2},'sofaLobes':6,'realWindowApertures':1,
        'sofa':{'dimensions':[4.66,2.22,1.32],'localCenter':[0,-sofa_y,0],'viewingDistance':4.15,'screenHorizontalAngleDegrees':29.7},
        'blanket':{'width':2.92,'drapedLength':4.3,'thickness':.018,'raisedCablePairs':22},'windowFinish':'walnut and brass','ceilingFinish':'ivory'}

# Export a material-grouped asset with the editable components kept in the blend.
optimized=bpy.data.collections.new('LIBRARY | runtime optimized');scene.collection.children.link(optimized)
root=bpy.data.objects.new('LIBRARY__Liminette',None);optimized.objects.link(root);root['layout_json']=json.dumps(LAYOUT)
bpy.context.view_layer.update();depsgraph=bpy.context.evaluated_depsgraph_get();groups={};merged=[]
for obj in parts:
    if obj.type not in ('MESH','CURVE','FONT'): continue
    evaluated=obj.evaluated_get(depsgraph);mesh=bpy.data.meshes.new_from_object(evaluated,preserve_all_data_layers=True,depsgraph=depsgraph)
    mat=mesh.materials[0];vertices,faces,uvs,smooth,normals=groups.setdefault(mat.name,([],[],[],[],[]));offset=len(vertices)
    matrix=obj.matrix_world;normal_matrix=matrix.to_3x3().inverted().transposed()
    vertices.extend(tuple(matrix@v.co) for v in mesh.vertices);faces.extend(tuple(v+offset for v in p.vertices) for p in mesh.polygons);smooth.extend(p.use_smooth for p in mesh.polygons)
    uvs.extend(tuple(uv.uv) for uv in mesh.uv_layers.active.data) if mesh.uv_layers.active else uvs.extend((0,0) for loop in mesh.loops)
    normals.extend(tuple((normal_matrix@n.vector).normalized()) for n in mesh.corner_normals);bpy.data.meshes.remove(mesh)
for name,(vertices,faces,uvs,smooth,normals) in groups.items():
    mesh=bpy.data.meshes.new('LIBRARY__'+name.replace(' ','_'));mesh.from_pydata(vertices,[],faces);mesh.materials.append(bpy.data.materials[name]);mesh.polygons.foreach_set('use_smooth',smooth)
    uv=mesh.uv_layers.new(name='Baked UV');uv.data.foreach_set('uv',np.asarray(uvs,dtype=np.float32).ravel());mesh.normals_split_custom_set(normals);mesh.update()
    obj=bpy.data.objects.new(mesh.name,mesh);optimized.objects.link(obj);obj.parent=root;merged.append(obj)
authored.hide_render=True;authored.hide_viewport=True
bpy.ops.object.select_all(action='DESELECT')
for obj in optimized.objects:obj.select_set(True)
bpy.context.view_layer.objects.active=root
temp=ASSET.with_name(ASSET.stem+'.building.glb')
bpy.ops.export_scene.gltf(filepath=str(temp),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
REPORT={'bytes':temp.stat().st_size,'triangles':sum(sum(len(p.vertices)-2 for p in obj.data.polygons) for obj in merged),'materialPrimitives':len(merged),'editableComponents':len(parts),'layout':LAYOUT}
if REPORT['triangles']>450000 or len(merged)>32 or REPORT['bytes']>30*1024*1024:raise RuntimeError('Library runtime budget exceeded: '+str(REPORT))
temp.replace(ASSET);(HERE/'asset-report.json').write_text(json.dumps(REPORT,indent=2)+'\n')
studio=bpy.data.collections.new('PRESENTATION | cameras and lights');scene.collection.children.link(studio)
world=bpy.data.worlds.new('Library daylight');world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.70,.80,.86,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.45;scene.world=world
for name,p,energy,size,target,color in [('Window daylight',(4.5,-2,4),1200,3,(0,-1,1),(.82,.91,1)),('Soft camera fill',(-1,-5,4),400,4,(0,0,2),(1,.91,.76)),('Valve warmth',(0,-.8,1),25,1,(0,0,.8),(1,.36,.10))]:
    data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.size=size;data.color=color;obj=bpy.data.objects.new(name,data);studio.objects.link(obj);obj.location=p;obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('Library reference camera');camera=bpy.data.objects.new(data.name,data);studio.objects.link(camera)
camera.location=(-3.6,-6.8,2.4);camera.rotation_euler=(Vector((.70,-.8,2.15))-camera.location).to_track_quat('-Z','Y').to_euler();data.lens=29;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX'
bpy.data.libraries.write(str(HERE/'liminette-ivory-library.blend'),{scene},fake_user=True,compress=True)
print('LIBRARY_EXPORTED '+json.dumps({k:v for k,v in REPORT.items() if k!='layout'}))
