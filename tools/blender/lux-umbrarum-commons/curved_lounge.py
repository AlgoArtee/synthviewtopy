"""Photo-derived curved architecture; executed in the generator's namespace.

Geometry and walking surfaces share the same ellipse and stair sectors. Angles
are Blender plan angles, counterclockwise from +X, with north at +Y.
"""
PIT_CENTER=(0,-1.7)
PIT_RADII=(5.25,4.25)
STAIR_SECTORS=[(87,123),(246,294)]
SOFA_ARCS=[(-66,87),(123,246)]
SOFA_BACK_TOP=.86
stairs=[]

def sector(name,mat,rx,ry,inner,outer,a0,a1,top,bottom=-.62):
    n=max(4,math.ceil(abs(a1-a0)/1.5)); verts=[]; faces=[]; uvs=[]
    for i in range(n+1):
        t=math.radians(a0+(a1-a0)*i/n)
        for radius,z in ((inner,bottom),(outer,bottom),(outer,top),(inner,top)):
            px=rx*radius*math.cos(t); py=ry*radius*math.sin(t)
            verts.append((px,PIT_CENTER[1]+py,z)); uvs.append((px,py))
    for i in range(n):
        for j in range(4): faces.append((i*4+j,(i+1)*4+j,(i+1)*4+(j+1)%4,i*4+(j+1)%4))
    faces.extend([(3,2,1,0),tuple(n*4+i for i in range(4))])
    obj=mesh_object(name,mat,verts,faces,uvs)
    # Keep horizontal treads planar, but smooth the curved risers.
    for i,p in enumerate(obj.data.polygons): p.use_smooth=i<n*4 and i%4 in (1,3)
    return obj

def upholstered_arc(name,rx,ry,a0,a1,z,width,height,exponent=.48,cap_depth=None):
    """One continuous padded sweep, with genuinely rounded closed end caps."""
    n=max(12,math.ceil((a1-a0)/1.4)); m=24
    cap_depth=width if cap_depth is None else cap_depth
    verts=[]; faces=[]; uvs=[]
    angles=[math.radians(a0+(a1-a0)*i/n) for i in range(n+1)]
    for i,t in enumerate(angles):
        normal=Vector((math.cos(t)/rx,math.sin(t)/ry,0)).normalized()
        for j in range(m):
            a=j*math.tau/m
            d=math.copysign(abs(math.cos(a))**exponent,math.cos(a))*width
            dz=math.copysign(abs(math.sin(a))**exponent,math.sin(a))*height
            verts.append((rx*math.cos(t)+normal.x*d,PIT_CENTER[1]+ry*math.sin(t)+normal.y*d,z+dz))
            uvs.append((i/n*math.radians(a1-a0)*(rx+ry)/2/1.1,j/m*2*(width+height)/1.1))
    for i in range(n):
        for j in range(m): faces.append((i*m+j,(i+1)*m+j,(i+1)*m+(j+1)%m,i*m+(j+1)%m))
    # Hemispherical closures extend into the arc tangents rather than flat caps.
    for end,sign in ((0,-1),(n,1)):
        t=angles[end]; tangent=Vector((-rx*math.sin(t),ry*math.cos(t),0)).normalized()
        normal=Vector((math.cos(t)/rx,math.sin(t)/ry,0)).normalized()
        center=Vector((rx*math.cos(t),PIT_CENTER[1]+ry*math.sin(t),z)); prev=end*m
        for ring_index in range(1,7):
            phase=math.pi/2*ring_index/7; start=len(verts)
            for j in range(m):
                a=j*math.tau/m
                d=math.copysign(abs(math.cos(a))**exponent,math.cos(a))*width*math.cos(phase)
                dz=math.copysign(abs(math.sin(a))**exponent,math.sin(a))*height*math.cos(phase)
                co=center+normal*d+tangent*(sign*cap_depth*math.sin(phase))+Vector((0,0,dz))
                verts.append(tuple(co)); uvs.append((math.cos(a)*width,math.sin(a)*height))
            for j in range(m):
                f=(prev+j,start+j,start+(j+1)%m,prev+(j+1)%m)
                faces.append(f if sign==1 else f[::-1])
            prev=start
        tip=len(verts); verts.append(tuple(center+tangent*(sign*cap_depth))); uvs.append((0,0))
        for j in range(m):
            f=(prev+j,tip,prev+(j+1)%m); faces.append(f if sign==1 else f[::-1])
    obj=mesh_object(name,cloth,verts,faces,uvs)
    bm=bmesh.new(); bm.from_mesh(obj.data); bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces)); bm.to_mesh(obj.data); bm.free()
    return finish(obj)

def wall_between(name,a,b):
    mid=((a[0]+b[0])/2,(a[1]+b[1])/2,1.95)
    length=math.dist(a,b); angle=math.atan2(b[1]-a[1],b[0]-a[0])
    return box(name,plaster,mid,(length,.22,4.2),.012,(0,0,angle))

def pillow_mesh(size):
    """Stuffed faces meet at a pinched edge, with rounded square corners."""
    n=18; side=n+1; panel=side*side; verts=[]; faces=[]
    for face in (-1,1):
        for j in range(side):
            v=2*j/n-1
            for i in range(side):
                u=2*i/n-1
                px=u*math.sqrt(1-.16*v*v)*size[0]/2
                pz=v*math.sqrt(1-.16*u*u)*size[2]/2
                puff=(max(0,1-u*u)*max(0,1-v*v))**.55
                crease=(math.exp(-((v-.53)/.10)**2)+math.exp(-((v+.42)/.10)**2))*abs(u)**9
                depth=.016+(size[1]/2-.016)*puff-.010*crease*puff
                verts.append((px,face*depth,pz))
        start=0 if face==-1 else panel
        for j in range(n):
            for i in range(n):
                q=start+j*side+i; f=(q,q+1,q+side+1,q+side)
                faces.append(f if face==-1 else f[::-1])
    boundary=list(range(side))+[j*side+n for j in range(1,side)]+[n*side+i for i in range(n-1,-1,-1)]+[j*side for j in range(n-1,0,-1)]
    for i,a in enumerate(boundary):
        b=boundary[(i+1)%len(boundary)]; faces.append((a,a+panel,b+panel,b))
    return verts,faces,boundary

def throw_pillow(name,t,size,rotation,back,forward_offset=0):
    """Rest on the seat and lean against the actual curved back surface."""
    from mathutils.bvhtree import BVHTree
    verts,faces,boundary=pillow_mesh(size)
    obj=mesh_object(name,cloth,verts,faces)
    bm=bmesh.new(); bm.from_mesh(obj.data); bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces)); bm.to_mesh(obj.data); bm.free()
    finish(obj)
    normal=Vector((math.cos(t)/4.93,math.sin(t)/3.93,0)).normalized()
    yaw=math.atan2(normal.y,normal.x)-math.pi/2
    obj.rotation_euler=(rotation[0],rotation[1],yaw+rotation[2])
    matrix=obj.rotation_euler.to_matrix()
    rotated=[matrix @ Vector(co) for co in verts]
    center=Vector((4.93*math.cos(t),PIT_CENTER[1]+3.93*math.sin(t),0))
    center.z=-.107-min(v.z for v in rotated)
    # Fit the whole inflated cushion to the mesh, rather than a flat or inset
    # ellipse. This leaves a small cloth gap while allowing a believable lean.
    tree=BVHTree.FromPolygons([tuple(v.co) for v in back.data.vertices],
                             [tuple(p.vertices) for p in back.data.polygons])
    low,high=0,1.2
    for _ in range(30):
        distance=(low+high)/2; p=center-normal*distance
        clear=True
        for vertex in rotated:
            co=p+vertex
            # Reject the far side of the closed back before testing distance.
            if math.hypot(co.x/4.93,(co.y-PIT_CENTER[1])/3.93)>=1:
                clear=False; break
            point,surface_normal,index,separation=tree.find_nearest(co)
            if (co-point).dot(surface_normal)<.008:
                clear=False; break
        if clear: high=distance
        else: low=distance
    obj.location=center-normal*(high+forward_offset)
    obj['role']='loose sofa pillow'; obj['seat_top']=-.11
    obj['sofa_back_top']=SOFA_BACK_TOP; obj['arc_angle']=t
    obj['forward_offset']=forward_offset
    seam=tube('Pinched cushion perimeter seam',piping,[(verts[i][0],0,verts[i][2]) for i in boundary+[boundary[0]]],.0035)
    seam.location=obj.location; seam.rotation_euler=obj.rotation_euler
    return obj

# Raised perimeter with an actual ellipse cut out, so the recess remains visible.
box('Sunken oval carpet floor',carpet,(0,-1,-.62),(14.3,12.7,.16),.005)
terrace=box('Continuous carpet terrace around circular pit',carpet,(0,-1,-.28),(14.2,12.6,.56),0)
cutter=cylinder('Temporary elliptical pit cutter',None,(0,PIT_CENTER[1],-.1),1,1.8,vertices=192)
cutter.scale=(PIT_RADII[0],PIT_RADII[1],1); cutter.modifiers.clear()
bpy.context.view_layer.update()
mod=terrace.modifiers.new('Real lowered conversation pit','BOOLEAN'); mod.operation='DIFFERENCE'; mod.solver='EXACT'; mod.object=cutter
bpy.context.view_layer.objects.active=terrace; bpy.ops.object.modifier_apply(modifier=mod.name)
parts.remove(cutter); bpy.data.objects.remove(cutter,do_unlink=True)
for flight,(a0,a1) in enumerate(STAIR_SECTORS):
    for i,(inner,outer,height) in enumerate([(.71,.81,-.36),(.81,.91,-.18),(.91,1.006,0)]):
        sector(('Rear' if flight==0 else 'Arrival')+' broad curved stair '+str(i+1),carpet,*PIT_RADII,inner,outer,a0,a1,height)
        stairs.append({'shape':'elliptical-sector','center':[0,1.7],'radii':list(PIT_RADII),'inner':inner,'outer':outer,
                       'startAngle':a0,'endAngle':a1,'height':height})

# The TV wall and library wall are angled side walls, meeting the window wall.
wall_between('Left angled media side wall',(-7.1,2.2),(-1.4,5.25))
wall_between('Right angled library side wall',(4,5.25),(7.1,2.2))
wall=box('Rear wall with real circular opening',plaster,(1.3,5.25,1.95),(5.4,.3,4.2),0)
cutter=cylinder('Temporary round window cutter',None,(.9,5.25,1.94),1.75,1.1,(math.pi/2,0,0),128); cutter.modifiers.clear()
bpy.context.view_layer.update()
mod=wall.modifiers.new('Circular daylight opening','BOOLEAN'); mod.operation='DIFFERENCE'; mod.solver='EXACT'; mod.object=cutter
bpy.context.view_layer.objects.active=wall; bpy.ops.object.modifier_apply(modifier=mod.name)
parts.remove(cutter); bpy.data.objects.remove(cutter,do_unlink=True)
ring('Deep ivory window surround',enamel,(.9,5.07,1.94),1.78,.055,(math.pi/2,0,0))
ring('Fine brass window reveal',brass,(.9,5.045,1.94),1.735,.008,(math.pi/2,0,0))
for x0 in (-1.4,4): box('Rear wall corner pier',enamel,(x0,5.04,1.96),(.18,.22,3.92),.028)

# Two side exits plus the main entrance. All have real openings and short halls.
for side in (-1,1):
    for ya,yb in [(-7.28,.05),(1.85,2.2)]:
        box('Side wall beside exit',plaster,(side*7.1,(ya+yb)/2,1.95),(.22,yb-ya,4.2),.01)
    box('Side exit lintel',plaster,(side*7.1,.95,3.65),(.22,1.8,.80),.015)
    for y0 in (.03,1.87): box('Side exit cream jamb',enamel,(side*7.04,y0,1.59),(.22,.13,3.18),.024)
    box('Side exit hallway floor',carpet,(side*8.25,.95,-.08),(2.4,1.8,.16),.005)
    for y0 in (0,1.9): box('Dormitory corridor wall',plaster,(side*8.25,y0,1.95),(2.4,.16,4.2),.01)
    box('Corridor ceiling',plaster,(side*8.25,.95,4.03),(2.4,1.9,.14),.01)
    box('Corridor end wall',plaster,(side*9.45,.95,1.95),(.14,1.9,4.2),.01)
    box('Dormitory corridor oak door',dark,(side*9.36,.95,1.46),(.08,1.43,2.92),.014)
    for z in (.55,1.46,2.37):
        box('Recessed oak door panel',oak,(side*9.307,.95,z),(.025,1.17,.68),.025)
    for y0 in (.19,1.71): box('Far doorway cream surround',enamel,(side*9.30,y0,1.49),(.12,.11,2.98),.01)
    box('Far doorway header',enamel,(side*9.30,.95,2.98),(.12,1.65,.11),.01)
    cylinder('Corridor door brass handle',brass,(side*9.24,.43,1.10),.03,.07,(0,math.pi/2,0),16)
for x0,w in [(-4.2,5.8),(4.2,5.8)]: box('Entrance wall beside open doorway',plaster,(x0,-7.28,1.95),(w,.24,4.2),.012)
box('Entrance lintel',plaster,(0,-7.28,3.6),(2.6,.24,1.0),.014)
box('Entrance hallway floor',carpet,(0,-8.6,-.08),(2.6,2.7,.16),.005)
for x0 in (-1.35,1.35): box('Entrance hallway wall',plaster,(x0,-8.6,1.95),(.14,2.7,4.2),.01)
box('Ceiling',plaster,(0,-1,4.06),(14.3,12.7,.18),.01)

# Two continuous horseshoe arcs, interrupted only by the two stair approaches.
piping=material('Ivory cushion seams',(.45,.40,.33),.96)
# A dedicated stream varies only upholstery; the rest of the room stays fixed.
pillow_rng=random.Random(271004)
for a0,a1 in SOFA_ARCS:
    upholstered_arc('Continuous rounded boucle sofa plinth',4.45,3.45,a0,a1,-.38,.65,.15)
    back=upholstered_arc('Continuous curved upholstered sofa back',4.93,3.93,a0,a1,.16,.22,.70,.52)
    back['role']='curved sofa back'; back['top']=SOFA_BACK_TOP
    count=max(4,round((a1-a0)/23))
    poses=[]
    for i in range(count):
        lo=a0+(a1-a0)*i/count+.7; hi=a0+(a1-a0)*(i+1)/count-.7
        upholstered_arc('Curved deep sofa seat',4.28,3.28,lo,hi,-.255,.69,.145,.40,.045)
        # Preserve the existing random stream for all other room furnishings.
        random.uniform(-.12,.12); random.uniform(-.12,.12)
        poses.append(('Loose boucle back cushion',
                      (pillow_rng.uniform(.82,.91),pillow_rng.uniform(.29,.34),pillow_rng.uniform(.70,.80)),
                      (pillow_rng.uniform(-.30,-.14),pillow_rng.uniform(-.19,.19),pillow_rng.uniform(-.10,.10)),
                      pillow_rng.uniform(0,.012)))
        if i%2==0:
            poses.append(('Casual square companion pillow',
                          (pillow_rng.uniform(.68,.77),pillow_rng.uniform(.28,.33),pillow_rng.uniform(.62,.72)),
                          (pillow_rng.uniform(-.36,-.22),pillow_rng.uniform(-.25,.25),pillow_rng.uniform(-.13,.13)),
                          pillow_rng.uniform(.018,.045)))
    # Small groups have close neighbours and wider gaps between them. Projected
    # widths include lean/roll, keeping the varied arrangement from intersecting.
    from mathutils import Euler
    angles=np.linspace(math.radians(a0),math.radians(a1),600)
    centers=np.column_stack((4.52*np.cos(angles),3.52*np.sin(angles)))
    distance=np.r_[0,np.cumsum(np.linalg.norm(np.diff(centers,axis=0),axis=1))]
    widths=[]
    for name,size,rotation,forward_offset in poses:
        matrix=Euler(rotation,'XYZ').to_matrix()
        projected=[(matrix @ Vector(co)).x for co in pillow_mesh(size)[0]]
        widths.append(max(projected)-min(projected)+.018)
    group_breaks={1,4,7} if len(poses)>8 else {1,4}
    weights=[pillow_rng.uniform(2.8,4.0) if i in group_breaks else pillow_rng.uniform(.15,.50)
             for i in range(len(poses)-1)]
    free=distance[-1]-.56-sum(widths)-.012*len(weights)
    assert free>0, 'The casual pillow groups must fit along the sofa arc'
    gaps=[.012+free*weight/sum(weights) for weight in weights]
    cursor=.28
    for i,(name,size,rotation,forward_offset) in enumerate(poses):
        t=float(np.interp(cursor+widths[i]/2,distance,angles))
        obj=throw_pillow(name,t,size,rotation,back,forward_offset)
        obj['sofa_arc']=[a0,a1]
        cursor+=widths[i]+(gaps[i] if i<len(gaps) else 0)
    # The oversized entrance arm cushions and their book stacks are removed.

# Small boxes track the actual curved upholstery rather than filling the pit.
for a0,a1 in SOFA_ARCS:
    for t in np.linspace(math.radians(a0),math.radians(a1),math.ceil((a1-a0)/3)+1):
        px=4.55*math.cos(t); py=PIT_CENTER[1]+3.55*math.sin(t)
        normal=Vector((math.cos(t)/4.55,math.sin(t)/3.55,0)).normalized()
        tangent=Vector((-normal.y,normal.x,0))
        w=abs(normal.x)*1.30+abs(tangent.x)*.28; d=abs(normal.y)*1.30+abs(tangent.y)*.28
        collide(px,py,w,d,SOFA_BACK_TOP,-.54)

# Side walls/corridors constrain walking even when the global bounds include exits.
for side in (-1,1):
    collide(side*7.1,-3.6,.22,7.3,4.2,-.54)
    collide(side*7.1,2.10,.22,.50,4.2,-.54)
    for y0 in (0,1.9): collide(side*8.25,y0,2.4,.16,4.2)
    collide(side*9.31,.95,.16,1.9,4.2)
for x0 in (-1.35,1.35): collide(x0,-8.6,.14,2.7,4.2)
for x0 in (-4.2,4.2): collide(x0,-7.28,5.8,.24,4.2,-.54)

def wall_fit(objects,old_center,new_center,angle):
    """Rigidly place a complete authored wall ensemble, including lettering."""
    transform=Matrix.Translation(Vector((*new_center,0))) @ Matrix.Rotation(angle,4,'Z') @ Matrix.Translation(Vector((-old_center[0],-old_center[1],0)))
    for obj in objects: obj.matrix_world=transform @ obj.matrix_world

def rotated_collider(old_center,new_center,angle,w,d,top,bottom=0):
    # Several narrow boxes retain the aisle beside a diagonal piece of furniture.
    for i in range(math.ceil(w/.18)):
        px=-w/2+w*(i+.5)/math.ceil(w/.18)
        x0=new_center[0]+px*math.cos(angle); y0=new_center[1]+px*math.sin(angle)
        collide(x0,y0,abs(math.cos(angle))*.18+abs(math.sin(angle))*d,abs(math.sin(angle))*.18+abs(math.cos(angle))*d,top,bottom)
