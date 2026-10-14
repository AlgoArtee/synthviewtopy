"""Elongated open sphere seats with ceiling and floor double-helix suspension.

Executed by the room generator with its local Blender modeling primitives.
The pod's local -Y direction is its foot end, and faces the pool centre.
"""


def double_helix(name,yy,bottom,top):
    pitch=.66; height=top-bottom; turns=height/pitch
    samples=max(24,round(turns*24)); radius=.095
    for phase in (0,math.pi):
        points=[]
        for i in range(samples+1):
            u=i/samples; a=u*turns*math.tau+phase
            points.append((radius*math.cos(a),yy+radius*math.sin(a),bottom+u*height))
        tube(name+' continuous metallic strand',chrome,points,.019)
    for i in range(max(4,round(height/.14))+1):
        u=i/max(4,round(height/.14)); a=u*turns*math.tau; z=bottom+u*height
        beam(name+' DNA ladder rung',brass,
             (radius*math.cos(a),yy+radius*math.sin(a),z),
             (-radius*math.cos(a),yy-radius*math.sin(a),z),.010)
    for z in (bottom,top):
        cylinder(name+' swivel collar',chrome,(0,yy,z),.125,.068,vertices=24)

def suspended_pod(px,py):
    start=len(parts); angle=math.atan2(-px,py); n=48; m=56
    verts=[]; faces=[]; uvs=[]
    # A tailored ellipsoidal shell, open across the foot and side shoulders,
    # becomes a continuous tall rounded hood behind the reclining cushion.
    def shell_point(i,j):
        t=-math.pi/2+math.pi*i/m; s=math.sin(t); r=math.cos(t)
        u=max(0,min(1,(s+.28)/1.28)); blend=u*u*(3-2*u)
        opening=.08+1.46*blend
        a=math.pi-opening+(math.pi+2*opening)*j/n
        return (.71*r*math.cos(a),1.40*s,1.53+.20*s+.78*r*math.sin(a))
    for i in range(m+1):
        for j in range(n+1):
            verts.append(shell_point(i,j)); uvs.append((j/n,i/m))
    for i in range(m):
        for j in range(n):
            q=i*(n+1)+j; faces.append((q,q+n+1,q+n+2,q+1))
    shell=finish(mesh_object('Suspended elongated sphere pearl shell',pearl,verts,faces,uvs))
    bm=bmesh.new(); bm.from_mesh(shell.data)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces)); bm.to_mesh(shell.data); bm.free()
    solid=shell.modifiers.new('Molded enamel shell thickness','SOLIDIFY'); solid.thickness=.032
    for edge in (0,n):
        tube('Continuous brass oval pod opening rim',brass,[shell_point(i,edge) for i in range(m+1)],.025)
    for j in (5,12,20,28,36,43):
        tube('Sweeping pod exterior meridian rib',chrome,
             [(x*1.015,y,z-.010) for x,y,z in [shell_point(i,j) for i in range(m+1)]],.010)
    sphere('Long upholstered pod chaise cushion',linen,(0,-.24,1.17),(.50,.94,.17),36,20)
    back=sphere('Upholstered reclining pod back cushion',linen,(0,.63,1.57),(.49,.54,.16),36,20)
    back.rotation_euler.x=math.radians(46)
    cylinder('Pod padded neck bolster',linen,(0,.92,1.94),.105,.84,(0,math.pi/2,0),28)
    for sx in (-1,1):
        tube('Pod cushion stitched side piping',ivory,
             [(sx*.475,-1.07,1.19),(sx*.49,-.56,1.29),(sx*.48,.16,1.29),
              (sx*.46,.45,1.50),(sx*.43,.77,1.84)],.006)
    # The upper yoke connects the helix to both sides of the molded shell.
    tube('Pod curved suspension shoulder yoke',chrome,
         [(.70*math.cos(t),.66,1.64+.74*math.sin(t)) for t in np.linspace(0,math.pi,40)],.029)
    for sx in (-1,1):
        cylinder('Pod shell suspension hinge',brass,(sx*.69,.66,1.64),.067,.075,(0,math.pi/2,0),20)
    double_helix('Upper pod ceiling suspension',.66,2.38,6.14)
    cylinder('Pod bolted ceiling canopy',chrome,(0,.66,6.18),.25,.076,vertices=32)
    double_helix('Lower pod floor tether',0,.11,.73)
    cylinder('Pod floor anchor disc',chrome,(0,0,.062),.23,.07,vertices=32)
    cylinder('Pod underside suspension plate',chrome,(0,0,.76),.20,.085,vertices=32)
    for angle_bolt in np.linspace(0,math.tau,6,endpoint=False):
        for y,z in ((.66,6.132),(0,.103)):
            cylinder('Helix anchor flange bolt',brass,(.18*math.cos(angle_bolt),y+.18*math.sin(angle_bolt),z),.017,.013,vertices=8)
    transform=Matrix.Translation(Vector((px,py,0))) @ Matrix.Rotation(angle,4,'Z')
    bpy.context.view_layer.update()
    for obj in parts[start:]: obj.matrix_world=transform @ obj.matrix_world
    # Covers the complete suspended shell, protecting its open lower tether too.
    width=2*(abs(math.cos(angle))*.76+abs(math.sin(angle))*1.46)
    depth=2*(abs(math.sin(angle))*.76+abs(math.cos(angle))*1.46)
    collide(px,py,width,depth,2.60)
    seating.append({'kind':'suspended-oval-pod','position':[px,0,-py],
                    'forward':[math.sin(angle),0,math.cos(angle)],'target':[0,0,0],
                    'length':2.8,'width':1.42,'suspension':'metallic double helix above and below'})

for px in (-7.90,7.90): suspended_pod(px,-7.10)
