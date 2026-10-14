import * as THREE from 'three';
import { CITY_BALCONY as B, CITY_BALCONY_DOOR as D } from './osCityLayout';
import { createOsCityBalconyDoor } from './osCityBalconyDoor';

/** Covered terrace beneath the next apartment floor, with contained outer edges. */
export function createOsCityBalcony(colliders: THREE.Box3[]) {
  const group = new THREE.Group(); group.name = 'Wraparound circuit balcony';
  const metal = new THREE.MeshStandardMaterial({ color: '#455b69', metalness: .56, roughness: .38, emissive:'#263f4e',emissiveIntensity:.16 });
  const dark = new THREE.MeshStandardMaterial({ color: '#1b2b36', metalness: .42, roughness: .43,emissive:'#142b3e',emissiveIntensity:.15 });
  const slab = new THREE.MeshStandardMaterial({ color: '#36434c', roughness: .78 });
  const cyan = new THREE.MeshStandardMaterial({color:'#63c8dd',emissive:'#32b8df',emissiveIntensity:1.5,roughness:.26,metalness:.2});
  const warm = new THREE.MeshStandardMaterial({color:'#ffdb9c',emissive:'#ffcf80',emissiveIntensity:1.15});
  const handrail=new THREE.MeshStandardMaterial({color:'#26343d',metalness:.71,roughness:.31});
  function box(name:string, p:number[], d:number[], m:THREE.Material=metal) {
    const o=new THREE.Mesh(new THREE.BoxGeometry(d[0],d[1],d[2]),m);o.name=name;o.position.set(p[0],p[1],p[2]);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;
  }
  function block(x:number,z:number,w:number,d:number,h=1.15) {
    colliders.push(new THREE.Box3(new THREE.Vector3(x-w/2,-.25,z-d/2),new THREE.Vector3(x+w/2,h,z+d/2)));
  }
  const outline=new THREE.Shape();outline.moveTo(B.minX,B.minZ);outline.lineTo(B.maxX,B.minZ);outline.lineTo(B.maxX,B.maxZ);outline.lineTo(B.elbowX,B.maxZ);outline.lineTo(B.elbowX,B.elbowZ);outline.lineTo(B.minX,B.elbowZ);outline.closePath();
  const slabGeometry=new THREE.ExtrudeGeometry(outline,{depth:.26,bevelEnabled:false});slabGeometry.rotateX(Math.PI/2);
  const floor=new THREE.Mesh(slabGeometry,slab);floor.name='Continuous L-shaped balcony slab';floor.position.y=-.026;floor.receiveShadow=true;group.add(floor);
  // Rain-polished porcelain pavers retain narrow dark joints and supported edges.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d')!;
  c.fillStyle='#808080';c.fillRect(0,0,512,512);let seed=7231;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<22000;i++){c.fillStyle=`rgba(${random()>.5?'230,230,230':'30,30,30'},.12)`;c.fillRect(random()*512,random()*512,1,1);}
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,2);
  const wearCanvas=document.createElement('canvas');wearCanvas.width=wearCanvas.height=512;const wc=wearCanvas.getContext('2d')!;wc.fillStyle='#899193';wc.fillRect(0,0,512,512);
  for(let i=0;i<180;i++) {const x=random()*512,y=random()*512;const gradient=wc.createRadialGradient(x,y,0,x,y,10+random()*40);gradient.addColorStop(0,i%3?'#20323d19':'#d7d2b315');gradient.addColorStop(1,'#566a7200');wc.fillStyle=gradient;wc.fillRect(0,0,512,512);}
  for(let i=0;i<380;i++){wc.fillStyle=i%3?'#b4bbc219':'#283b4626';wc.fillRect(random()*512,random()*512,random()*22+.5,.5+random()*1.5);}
  const wear=new THREE.CanvasTexture(wearCanvas);wear.colorSpace=THREE.SRGBColorSpace;wear.anisotropy=8;wear.wrapS=wear.wrapT=THREE.RepeatWrapping;
  const paving=new THREE.MeshPhysicalMaterial({color:'#63757e',map:wear,metalness:.24,roughness:.36,roughnessMap:texture,clearcoat:.65,clearcoatRoughness:.24,bumpMap:texture,bumpScale:.008,emissive:'#162936',emissiveIntensity:.08});
  const rainscreen=new THREE.MeshStandardMaterial({color:'#556770',map:wear,metalness:.32,roughness:.63,bumpMap:texture,bumpScale:.003,emissive:'#142b3e',emissiveIntensity:.12});
  // The upstairs floor follows the full L footprint and bears on the apartment
  // walls; its underside meets their 3.5 m heads without closing the city view.
  const ceiling=new THREE.Group();ceiling.name='Balcony ceiling · upper apartment floor';group.add(ceiling);
  const ceilingConcrete=new THREE.MeshStandardMaterial({color:'#71808a',map:wear,roughness:.83,bumpMap:texture,bumpScale:.003});
  const overhead=new THREE.Mesh(slabGeometry.clone(),ceilingConcrete);overhead.name='Balcony ceiling · continuous structural floor slab';overhead.position.y=3.76;overhead.castShadow=true;overhead.receiveShadow=true;ceiling.add(overhead);
  const ceilingPart=(name:string,p:number[],d:number[],mat:THREE.Material=dark)=>{const o=box('Balcony ceiling · '+name,p,d,mat);ceiling.add(o);return o;};
  ceilingPart('east floor edge', [B.maxX+.045,3.63,(B.minZ+B.maxZ)/2],[.09,.30,B.maxZ-B.minZ+.09]);
  ceilingPart('north floor edge', [(B.minX+B.maxX)/2,3.63,B.minZ-.045],[B.maxX-B.minX,.30,.09]);
  for(const z of [-8.5,-5.5])ceilingPart('cantilever beam',[1.84,3.43,z],[B.maxX-B.minX,.14,.12],metal);
  ceilingPart('bathroom return beam',[3.21,3.43,-1.05],[B.maxX-B.elbowX,.14,.12],metal);
  for(const z of [-8.72,-7.24,-5.76,-4.28])ceilingPart('soffit panel joint',[1.84,3.496,z],[B.maxX-B.minX,.006,.012]);
  for(const z of [-2.49,-1.02])ceilingPart('return soffit joint',[3.21,3.496,z],[B.maxX-B.elbowX,.006,.012]);
  ceilingPart('east recessed gutter',[B.maxX+.076,3.465,(B.minZ+B.maxZ)/2],[.07,.065,B.maxZ-B.minZ],metal);
  ceilingPart('north recessed gutter',[(B.minX+B.maxX)/2,3.465,B.minZ-.076],[B.maxX-B.minX,.065,.07],metal);
  const soffitGlow=new THREE.MeshStandardMaterial({color:'#c7e2ed',emissive:'#add5e8',emissiveIntensity:1.7,roughness:.45});
  for(const z of [-7.7,-4.8,-1.55]) {
    const x=z<-3.22?1.7:3.12;
    ceilingPart('recessed light housing',[x,3.475,z],[1.18,.044,.16],metal);
    ceilingPart('diffused light strip',[x,3.447,z],[1.09,.012,.095],soffitGlow);
  }
  for(const [x,z,w,h] of [[1.7,-6.3,2.6,4.2],[3.12,-1.55,1.5,1.7]]) {
    const light=new THREE.RectAreaLight('#b6d5e4',.8,w,h);light.name='Balcony ceiling · downward soffit illumination';light.position.set(x,3.39,z);light.lookAt(x,0,z);ceiling.add(light);
  }
  // Upper-floor guard rail is visible when looking up from the edge, making
  // the slab read as another storey rather than a thin rain canopy.
  for(let z=B.minZ+.2;z<B.maxZ;z+=1.45)ceilingPart('upstairs balustrade post',[B.maxX-.055,4.28,z],[.055,1.02,.06]);
  ceilingPart('upstairs balustrade cap',[B.maxX-.055,4.82,(B.minZ+B.maxZ)/2],[.065,.04,B.maxZ-B.minZ]);
  ceilingPart('upstairs balustrade lower rail',[B.maxX-.055,3.98,(B.minZ+B.maxZ)/2],[.045,.04,B.maxZ-B.minZ]);
  colliders.push(new THREE.Box3(new THREE.Vector3(B.minX,3.5,B.minZ),new THREE.Vector3(B.maxX,3.76,B.elbowZ)),new THREE.Box3(new THREE.Vector3(B.elbowX,3.5,B.elbowZ),new THREE.Vector3(B.maxX,3.76,B.maxZ)));
  ceiling.userData.cover={underside:3.5,top:3.76,area:B.area,upperFloor:true,footprint:'Continuous L shape',openEdges:['north','east']};
  const tile=(x0:number,x1:number,z0:number,z1:number)=>{
    const nx=Math.ceil((x1-x0)/.74),nz=Math.ceil((z1-z0)/.74),w=(x1-x0)/nx,d=(z1-z0)/nz;
    // The slab supports the paver bottoms at -26 mm, keeping their tops at
    // the level walking datum without coplanar surfaces / depth interference.
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)box('Rain-dark terrace paver',[x0+(i+.5)*w,-.013,z0+(j+.5)*d],[w-.008,.026,d-.008],paving);
  };
  tile(B.minX,B.maxX,B.minZ,B.elbowZ);tile(B.elbowX,B.maxX,B.elbowZ,B.maxZ);
  box('Terrace slab east fascia',[B.maxX+.025,-.18,(B.minZ+B.maxZ)/2],[.1,.34,B.maxZ-B.minZ],dark);
  box('Terrace slab north fascia',[(B.minX+B.maxX)/2,-.18,B.minZ-.025],[B.maxX-B.minX,.34,.1],dark);
  for(const z of [-8.5,-5.5,-2.5])box('Cantilever steel beam',[1.82,-.4,z],[5.98,.3,.15],dark);
  // Exterior cladding follows the real bedroom / bathroom walls, leaving the door open.
  box('Bedroom exterior rainscreen',[B.minX+.015,1.75,(B.minZ+B.elbowZ)/2],[.035,3.5,B.elbowZ-B.minZ],rainscreen);
  box('Bathroom north exterior rainscreen',[(B.minX+B.elbowX)/2,1.75,B.elbowZ-.012],[B.elbowX-B.minX,3.5,.025],rainscreen);
  box('Bathroom east exterior rainscreen',[B.elbowX+.012,1.75,(B.elbowZ+B.maxZ)/2],[.025,3.5,B.maxZ-B.elbowZ],rainscreen);
  for(const z of [-8.8,-7.4,-6,-4.6])box('Rainscreen vertical reveal',[B.minX+.037,1.75,z],[.007,3.5,.014],dark);
  for(const y of [.85,1.7,2.55]) {
    box('Bedroom rainscreen horizontal joint',[B.minX+.037,y,(B.minZ+B.elbowZ)/2],[.007,.012,B.elbowZ-B.minZ],dark);
    box('Bathroom rainscreen horizontal joint',[B.elbowX+.029,y,(B.elbowZ+B.maxZ)/2],[.007,.012,B.maxZ-B.elbowZ],dark);
  }
  box('Bedroom exterior base flashing',[B.minX+.04,.1,(B.minZ+B.elbowZ)/2],[.09,.2,B.elbowZ-B.minZ],dark);
  // Circuit etched laminated panels: opaque traces over a softly transmitting infill.
  const art=document.createElement('canvas');art.width=1024;art.height=768;const a=art.getContext('2d')!;
  a.fillStyle='#768e96';a.fillRect(0,0,1024,768);a.strokeStyle='#142731';a.lineWidth=5;
  for(let i=0;i<22;i++){
    const y=32+i*32,x=80+(i%7)*63;a.beginPath();a.moveTo(0,y);a.lineTo(x,y);a.lineTo(x+115,y+(i%2?90:-90));a.lineTo(690-i*8,y+(i%2?90:-90));a.lineTo(820-i*5,y);a.lineTo(1024,y);a.stroke();
    a.beginPath();a.arc(x,y,7,0,Math.PI*2);a.stroke();
  }
  const circuitMap=new THREE.CanvasTexture(art);circuitMap.colorSpace=THREE.SRGBColorSpace;circuitMap.anisotropy=8;
  const panelMaterial=new THREE.MeshPhysicalMaterial({map:circuitMap,color:'#b1c2c6',metalness:.42,roughness:.31,transparent:true,opacity:.78,side:THREE.DoubleSide,depthWrite:false});
  function rail(start:THREE.Vector3,end:THREE.Vector3) {
    const length=start.distanceTo(end),n=Math.ceil(length/1.34),w=length/n;const line=new THREE.Group();line.name='Circuit balcony balustrade';line.position.copy(start);line.rotation.y=-Math.atan2(end.z-start.z,end.x-start.x);group.add(line);
    const part=(name:string,x:number,y:number,z:number,d:number[],mat:THREE.Material)=>{const o=box(name,[x,y,z],d,mat);line.add(o);return o;};
    for(let i=0;i<=n;i++){
      part('Bolted balustrade post',i*w,.56,0,[.085,1.12,.09],dark);part('Post anchored baseplate',i*w,.018,0,[.18,.036,.19],metal);
      for(const offset of [-.059,.059])part('Stainless anchor bolt',i*w+offset,.04,.057,[.018,.01,.018],metal);
    }
    part('Continuous rain-shedding handrail',length/2,1.115,0,[length+.12,.035,.065],handrail);
    part('Protected cyan handrail light',length/2,1.073,-.023,[length,.014,.024],cyan);
    part('Balustrade lower rail',length/2,.16,0,[length,.06,.055],metal);
    part('Balustrade low cyan edge',length/2,.19,0,[length,.013,.024],cyan);
    for(let i=0;i<n;i++){
      const p=new THREE.Mesh(new THREE.PlaneGeometry(w-.12,.79),panelMaterial);p.name='Etched circuit glass infill';p.position.set((i+.5)*w,.624,0);line.add(p);
      for(const side of [-1,1])part('Panel compression clamp',(i+.5)*w+side*(w/2-.075),.63,0,[.038,.13,.07],metal);
    }
  }
  rail(new THREE.Vector3(B.minX,0,B.minZ+.06),new THREE.Vector3(B.maxX-.055,0,B.minZ+.06));
  rail(new THREE.Vector3(B.maxX-.055,0,B.minZ+.06),new THREE.Vector3(B.maxX-.055,0,B.maxZ));
  block((B.minX+B.maxX)/2,B.minZ+.06,B.maxX-B.minX,.12);block(B.maxX-.055,(B.minZ+B.maxZ)/2,.12,B.maxZ-B.minZ);
  // Linear drain and small grilles keep the exposed surface physically plausible.
  box('Terrace edge drainage channel',[B.maxX-.23,.002,(B.minZ+B.maxZ)/2],[.065,.008,B.maxZ-B.minZ-.25],dark);
  for(let z=B.minZ+.22;z<B.maxZ-.12;z+=.115)box('Drain crossbar',[B.maxX-.23,.008,z],[.062,.009,.013],metal);
  for(const z of [-7.8,-4.2]){
    box('Exterior wall lamp housing',[B.minX+.09,2.1,z],[.16,.34,.16],dark);
    box('Exterior wall lamp opal',[B.minX+.175,2.1,z],[.012,.22,.1],warm);
    const light=new THREE.PointLight('#a4d3e8',.9,4,2);light.position.set(B.minX+.35,1.9,z);group.add(light);
  }
  const railBounce=new THREE.RectAreaLight('#8bd2e2',1.3,8,2.5);railBounce.name='Balcony reflected city light';railBounce.position.set(6.2,3,-5.4);railBounce.lookAt(1,0,-5.4);group.add(railBounce);
  // One planted, weathered corner and a utility console leave the full route open.
  const pot=box('Balcony planted zinc trough',[-.53,.32,-8.55],[.58,.64,.62],metal);block(-.53,-8.55,.58,.62,.7);
  box('Planter dark soil',[-.53,.65,-8.55],[.5,.018,.54],new THREE.MeshStandardMaterial({color:'#18231c',roughness:1}));
  const foliage=new THREE.MeshStandardMaterial({color:'#35594a',roughness:.86,emissive:'#17332d',emissiveIntensity:.12});
  for(let i=0;i<46;i++){
    const angle=i*2.39996,height=.73+random()*.65;
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,8,5),foliage);leaf.name='Balcony trailing fern leaf';leaf.position.set(-.53+Math.sin(angle)*.25,height,-8.55+Math.cos(angle)*.25);leaf.scale.set(.045,.025,.15);leaf.rotation.set((random()-.5)*1.6,angle,.3);group.add(leaf);
    if(i%2===0){const start=new THREE.Vector3(-.53,.64,-8.55),delta=leaf.position.clone().sub(start);const stem=new THREE.Mesh(new THREE.CylinderGeometry(.004,.008,delta.length(),5),foliage);stem.name='Planter fern stem';stem.position.copy(start.addScaledVector(delta,.5));stem.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());group.add(stem);}
  }
  for(let i=0;i<3;i++) {
    const wire=new THREE.Mesh(new THREE.TorusGeometry(.24+i*.017,.009,5,64),dark);wire.name='Coiled service cable';wire.rotation.x=Math.PI/2;wire.position.set(-.45,.021+i*.014,-7.82);group.add(wire);
  }
  const display=document.createElement('canvas');display.width=512;display.height=320;const dc=display.getContext('2d')!;dc.fillStyle='#071b29';dc.fillRect(0,0,512,320);dc.strokeStyle='#4dc6e1';dc.lineWidth=4;dc.strokeRect(14,14,484,292);dc.fillStyle='#8de3f4';dc.font='bold 44px sans-serif';dc.fillText('BALCONY / 08',38,80);dc.font='25px monospace';dc.fillText('CITY FEED ACTIVE',38,139);dc.fillText('NORTH CITY',38,182);dc.fillText('LOCAL CONDITIONS',38,256);
  const displayMap=new THREE.CanvasTexture(display);displayMap.colorSpace=THREE.SRGBColorSpace;
  box('Outdoor utility screen housing',[B.minX+.09,1.48,-8.1],[.18,.48,.72],dark);
  const monitor=new THREE.Mesh(new THREE.PlaneGeometry(.65,.4),new THREE.MeshBasicMaterial({map:displayMap,color:'#69aaba'}));monitor.name='Balcony local status screen';monitor.rotation.y=Math.PI/2;monitor.position.set(B.minX+.185,1.48,-8.1);group.add(monitor);
  box('Outdoor terminal shelf',[B.minX+.18,1.18,-8.1],[.34,.035,.75],metal);
  for(const y of [.35,.40])box('Protected exterior service conduit',[B.minX+.055,y,(B.minZ+B.elbowZ)/2],[.034,.027,B.elbowZ-B.minZ-.12],dark);
  for(const z of [-8.8,-7.1,-5.4,-3.6])box('Wall pipe fixing clip',[B.minX+.07,.375,z],[.04,.12,.026],metal);
  const doorFixture=createOsCityBalconyDoor(colliders,window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  group.add(doorFixture.group);group.userData.doorFixture=doorFixture;
  group.userData.layout={...B,door:{...D,state:'open',type:'sliding',clearWidth:D.maxX-D.minX},railHeight:1.15,floorHeight:0,ceiling:ceiling.userData.cover};
  group.userData.setWetness=(wetness:number)=>{paving.roughness=.6-.3*wetness;paving.clearcoat=.12+.53*wetness;};
  return group;
}
