"""Shared local modeling primitives; Blender metres, Z up."""

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

def label(text,p,size=.13,mat=None,rotation=(math.pi/2,0,0),align='CENTER'):
    if mat is None: mat=brass
    data=bpy.data.curves.new('Engraved lettering','FONT'); data.body=text; data.size=size
    data.font=serif_font
    data.align_x=align; data.align_y='CENTER'; data.extrude=.0005; data.resolution_u=2
    obj=bpy.data.objects.new(text,data); authored.objects.link(obj); obj.location=p; obj.rotation_euler=rotation
    data.materials.append(mat); obj['zone']=zone; parts.append(obj)
    return obj

def collide(x,y,w,d,top,bottom=0):
    colliders.append({'min':[x-w/2,bottom,-y-d/2],'max':[x+w/2,top,-y+d/2]})
