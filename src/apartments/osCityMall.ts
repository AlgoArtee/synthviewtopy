import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { createCityNeonAtmosphere } from './osCityNeonAtmosphere';
import { createCityStreamClock } from './osCityStreamClock';

export type CityMallSignSide = 'left' | 'right';
export interface CityMallLevelLabel { level:number; left:string; right:string }
export interface CityMallSigns {
  getLabels:()=>CityMallLevelLabel[];
  setLabel:(level:number,side:CityMallSignSide,text:string)=>void;
  resetLevel:(level:number)=>void;
  isSaved:()=>boolean;
}
export const CITY_MALL_LABEL_LIMIT=36;
const STORAGE_KEY='north-city-data-mall-labels-v1';
const levelText=(level:number)=>`LEVEL ${String(level).padStart(2,'0')}`;

/** Ten occupied galleries around a deep atrium, with independent editable signs. */
export function createOsCityMall(neon:ReturnType<typeof createCityNeonAtmosphere>) {
  const group=new THREE.Group();group.name='Data Mall · ten-level circuit atrium';
  const width=51.5,depth=13,height=33.6,floorHeight=3.3;
  const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();
  const materials:THREE.Material[]=[];
  const vec=(p:number[])=>new THREE.Vector3(...p);
  function material(name:string,color:string,roughness=.45,metalness=.25,emission=0) {
    const mat=new THREE.MeshStandardMaterial({color,roughness,metalness,emissive:color,emissiveIntensity:emission});
    mat.name='Data Mall · '+name;materials.push(mat);neon.register(mat,emission?'neon':'surface',mat.name);return mat;
  }
  const shell=material('satin ceramic aluminium','#a9bdc7',.38,.45);
  const edge=material('recessed graphite joints','#263c4b',.56,.38);
  const dark=material('server cases and interior shadows','#152836',.58,.2);
  const floor=material('gallery floors','#687c8b',.62,.16);
  const rail=material('brushed steel handrails','#91b2bf',.32,.65);
  const blue=material('blue circuit channels','#48b3ff',.3,.15,2.4);
  const pink=material('pink circuit channels','#ff79c7',.3,.15,2.1);
  const clothes=material('gallery visitors','#1d2a36',.88,.02);
  const skin=material('visitor faces','#bfa394',.78,.01);
  const glass=new THREE.MeshPhysicalMaterial({color:'#72b4cc',transparent:true,opacity:.13,roughness:.14,metalness:.08,depthWrite:false,side:THREE.DoubleSide,clearcoat:.6});
  glass.name='Data Mall · recessed glazing and balustrades';materials.push(glass);
  function push(g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0) {
    if(g.index){const indexed=g;g=g.toNonIndexed();indexed.dispose();}g.translate(x,y,z);
    const list=batches.get(m)??[];list.push(g);batches.set(m,list);
  }
  const box=(m:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number)=>push(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  function line(m:THREE.Material,a:number[],b:number[],radius:number) {
    const start=vec(a),end=vec(b),g=new THREE.CylinderGeometry(radius,radius,start.distanceTo(end),5);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(start).normalize()));
    const center=start.add(end).multiplyScalar(.5);push(g,m,center.x,center.y,center.z);
  }
  // Rounded front corners in plan keep the stacked terraces from looking like boxes.
  function slab(x:number,y:number,w:number,d:number,z:number,thickness=.28) {
    const r=.55,s=new THREE.Shape();s.moveTo(-w/2,-d/2);s.lineTo(w/2,-d/2);s.lineTo(w/2,d/2-r);
    s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:thickness,bevelEnabled:false,curveSegments:4});g.rotateX(Math.PI/2);push(g,shell,x,y+thickness/2,z);
  }
  let texture!:THREE.Texture;
  const ready=new Promise<void>((resolve,reject)=>{texture=new THREE.TextureLoader().load('/apartments/assets/north-city/data-mall-reference.png',()=>resolve(),undefined,()=>reject(new Error('Data Mall interior reference failed to load')));});
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  const interiors=new THREE.MeshStandardMaterial({map:texture,emissiveMap:texture,color:'#c1d5df',emissive:'#b6e2ff',emissiveIntensity:.62,roughness:.7,metalness:.03});
  interiors.name='Data Mall · reference shop interiors behind real galleries';materials.push(interiors);neon.register(interiors,'window',interiors.name);
  const crops=[[151,100,658,137],[150,260,664,309],[157,420,681,474],[161,518,676,562],[1157,335,1657,385]];
  function interior(x:number,y:number,z:number,w:number,h:number,tile:number) {
    const [x1,y1,x2,y2]=crops[tile%crops.length],g=new THREE.PlaneGeometry(w,h),uv=g.getAttribute('uv');
    for(let i=0;i<uv.count;i++)uv.setXY(i,(x1+uv.getX(i)*(x2-x1))/1808,1-(y2-uv.getY(i)*(y2-y1))/1152);
    push(g,interiors,x,y,z);
  }
  // Both wings have a closed back and outer walls, open galleries and a recessed central bridge.
  box(edge,0,height/2,-depth/2+.16,width,height,.32);
  for(const side of [-1,1])box(shell,side*(width/2-.18),height/2,0,.36,height,depth);
  box(floor,0,.08,0,width,.16,depth);
  const peoplePositions:number[][]=[];
  function person(x:number,y:number,z:number,n:number) {
    const h=1.45+(n%3)*.08;peoplePositions.push([x,y,z]);
    box(clothes,x,y+h*.57,z,.35,h*.40,.23);
    push(new THREE.SphereGeometry(.135,6,5),skin,x,y+h-.14,z);
    for(const side of [-1,1]){line(clothes,[x+side*.10,y+.08,z],[x+side*.085,y+h*.40,z],.064);line(clothes,[x+side*.20,y+h*.74,z],[x+side*.27,y+h*.40,z+.05],.055);}
  }
  const paths:{points:THREE.Vector3[];lengths:number[];length:number;color:number;offset:number}[]=[];
  function circuit(points:number[][],color:number,radius=.041) {
    const m=color?pink:blue;for(let i=1;i<points.length;i++)line(m,points[i-1],points[i],radius);
    const vectors=points.map(vec),lengths=[0];for(let i=1;i<vectors.length;i++)lengths.push(lengths[i-1]+vectors[i].distanceTo(vectors[i-1]));
    paths.push({points:vectors,lengths,length:lengths.at(-1)!,color,offset:paths.length*.37});
  }
  const labelPositions:{level:number;side:CityMallSignSide;x:number;y:number;z:number}[]=[];
  for(let level=1;level<=10;level++){
    const base=(level-1)*floorHeight,top=base+floorHeight;
    // Central bridge is 6.6 metres behind the projecting wing fronts.
    slab(0,base+.14,17.1,5.8,-3.4,.25);
    box(dark,0,base+1.55,-5.85,17,2.85,.16);interior(0,base+1.65,-5.74,16.4,2.65,level+1);
    box(glass,0,base+.72,-.45,16.9,1.08,.025);box(rail,0,base+1.27,-.44,17,.035,.045);
    for(let i=0;i<4;i++)person(-6+i*4.1,base+.27,-1.35,level+i);
    for(const side of [-1,1]){
      const wingWidth=17.6,center=side*17.0,front=level<=3?7.65:6.7;
      slab(center,base+.16,wingWidth,13.4,0,.30);
      box(edge,center,base+.05,front+.04,wingWidth-.7,.055,.06);
      box(shell,center,top-.12,front-.08,wingWidth+.18,.57,.46);
      // Panel seams divide each fascia, with slim metal cap and glass set behind it.
      box(rail,center,top+.18,front+.03,wingWidth-.65,.045,.06);
      for(const offset of [-7,-3.5,3.5,7])box(edge,center+offset,top-.13,front+.158,.022,.52,.015);
      box(dark,center,base+1.65,1.55,wingWidth-.5,2.8,.18);
      interior(center,base+1.67,1.66,wingWidth-.65,2.73,level+(side<0?0:2));
      box(glass,center,base+1.65,4.75,wingWidth-.5,2.72,.022);
      box(glass,center,base+.85,front-.12,wingWidth-.7,1.06,.026);
      box(rail,center,base+1.39,front-.11,wingWidth-.6,.045,.055);
      for(let col=0;col<=5;col++){
        const x=center-wingWidth/2+.35+col*(wingWidth-.7)/5;
        box(edge,x,base+1.65,4.78,.055,2.9,.075);
        box(rail,x,base+.85,front-.12,.03,1.08,.04);
      }
      // Actual server cabinets, counters and visitors provide depth in front of the images.
      for(let rack=0;rack<3;rack++){
        const x=center+side*(5.8-rack*.8);box(dark,x,base+1.3,3.0,.62,2.3,.65);
        for(let slot=0;slot<6;slot++){
          box(edge,x,base+.43+slot*.32,3.34,.52,.22,.035);
          box(slot%3?blue:pink,x-.15,base+.47+slot*.32,3.37,.16,.028,.015);
        }
      }
      box(floor,center-side*1.6,base+.78,3.45,3.2,.18,.7);
      for(const x of [center-side*2.8,center-side*.4])box(edge,x,base+.37,3.45,.08,.74,.4);
      for(let i=0;i<3;i++)person(center-4.2+i*3.6+(level%2)*.35,base+.31,5.45,level+i);
      // Feed traces follow balcony edges and turn into the atrium, as in the reference.
      for(let lane=0;lane<3;lane++){
        const y=top-.42-lane*.11,inner=side*(8.45+lane*.16);
        circuit([[side*25.1,y,front+.20],[side*21.8,y,front+.20],[side*20.8,y+.22,front+.20],[side*12.1,y+.22,front+.20],[side*10.8,y-.55,front+.20],[inner,y-.55,4.5],[inner,Math.min(height-.15,y+1.6),1.4]],(level+lane+(side>0?1:0))%2,.026);
      }
      labelPositions.push({level,side:side<0?'left':'right',x:center,y:top-.09,z:front+.18});
    }
    // Horizontal atrium links give the central luminous trunk a real destination on every level.
    for(const side of [-1,1])circuit([[side*8.3,base+1.05,-.32],[side*4.1,base+1.05,-.32],[side*3.5,base+1.65,-.32],[side*.8,base+1.65,-.32]],(level+(side<0?0:1))%2,.035);
  }
  // Continuous central data trunk with stepped, circuit-board bends.
  for(let lane=0;lane<12;lane++){
    const x=(lane-5.5)*.25,z=.22+(lane%3)*.12;
    circuit([[x,.22,7.0],[x,4.0,7.0],[x+.8,5.0,4.1],[x+.8,10.1,1.3],[x-.5,11.5,z],[x-.5,18.7,z],[x+.7,20.1,z],[x+.7,27.6,z],[x,28.4,z],[x,height+.15,z]],lane<7?0:1,.044);
  }
  // Angled metal portal and broad nameplate are physical volumes in front of the atrium.
  function frontPanel(points:number[][],z:number,thickness:number) {
    const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
    const g=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelSize:.06,bevelThickness:.04,bevelSegments:1});push(g,shell,0,0,z);
  }
  frontPanel([[-18,.2],[-6.6,.2],[-6.15,4.5],[-5.3,5.2],[-5.3,6.2],[-9.5,6.2],[-12.1,8.6],[-18,8.6]],6.92,.42);
  frontPanel([[18,.2],[6.6,.2],[6.15,4.5],[5.3,5.2],[5.3,6.2],[9.5,6.2],[12.1,8.6],[18,8.6]],6.92,.42);
  frontPanel([[-10,8.4],[-8.7,7.7],[8.7,7.7],[10,8.4],[10,11.8],[-10,11.8]],7.05,.65);
  for(const side of [-1,1]){
    circuit([[side*17.7,.8,7.43],[side*11.5,.8,7.43],[side*8.5,3.3,7.43],[side*8.5,5.7,7.43],[side*10.4,7.7,7.43]],side<0?1:0,.055);
    circuit([[side*17.3,7.6,7.43],[side*13.0,7.6,7.43],[side*10.6,5.7,7.43],[side*10.6,3.2,7.43],[side*8.4,1.3,7.43]],side<0?0:1,.036);
    for(let lane=0;lane<3;lane++)circuit([[side*(6.15+lane*.19),.2,7.5],[side*(5.8+lane*.19),4.1,7.5],[side*(5.2+lane*.19),4.6,7.5],[0,4.6+lane*.19,7.5]],lane%2,.035);
    for(let seam=0;seam<3;seam++)box(edge,side*(11.6+seam*2.1),3.2,7.40,.025,5.2,.015);
  }
  box(edge,0,2.25,5.6,11.4,4.5,.16);interior(0,2.2,5.70,11,4.2,2);
  for(let pane=0;pane<6;pane++){box(glass,(pane-2.5)*1.75,2.1,7.15,1.67,4.1,.03);box(rail,(pane-3)*1.75,2.1,7.2,.065,4.2,.1);}
  box(rail,0,4.27,7.2,10.6,.09,.2);
  for(let n=0;n<6;n++)person((n-2.5)*1.4,.18,6.3,n);
  for(let step=0;step<3;step++)box(shell,0,.06+step*.07,8.2-step*.25,13.3,.12,1.5-step*.3);
  // Roof fascia, exposed mechanical plant and return walls complete the silhouette.
  slab(0,height,51.8,13.6,0,.30);
  for(const side of [-1,1])for(let unit=0;unit<3;unit++){
    const x=side*(13+unit*4.2);box(edge,x,height+.5,-2.3,2.7,.8,2.8);box(rail,x,height+.94,-2.3,2.8,.08,2.9);
    for(let slat=0;slat<5;slat++)box(dark,x,height+.22+slat*.13,-.88,2.35,.06,.03);
  }
  function canvas(w:number,h:number){const c=document.createElement('canvas');c.width=w;c.height=h;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return {canvas:c,ctx:c.getContext('2d')!,texture:t};}
  const title=canvas(2048,320);title.ctx.clearRect(0,0,2048,320);title.ctx.textAlign='center';title.ctx.textBaseline='middle';title.ctx.fillStyle='#b5eaff';title.ctx.font='600 166px Arial';title.ctx.fillText('DATA MALL',1024,132,1940);title.ctx.font='500 33px Arial';title.ctx.fillText('DATA EXCHANGE  ·  CLOUD VAULT  ·  NEURAL STORAGE',1024,269,1860);
  const titleMaterial=new THREE.MeshStandardMaterial({map:title.texture,emissiveMap:title.texture,emissive:'#b5eaff',emissiveIntensity:1.45,transparent:true,alphaTest:.03,depthWrite:false,roughness:.3});titleMaterial.name='Data Mall · entrance lettering';neon.register(titleMaterial,'neon',titleMaterial.name);materials.push(titleMaterial);
  push(new THREE.PlaneGeometry(18.3,2.85),titleMaterial,0,9.85,7.77);
  const labels:CityMallLevelLabel[]=Array.from({length:10},(_,i)=>({level:i+1,left:levelText(i+1),right:levelText(i+1)}));
  const normalize=(value:string)=>[...value.replace(/[\u0000-\u001f\u007f]/g,' ')].slice(0,CITY_MALL_LABEL_LIMIT).join('');
  let saved=true;
  try {const stored:unknown=JSON.parse(localStorage.getItem(STORAGE_KEY)??'null');if(Array.isArray(stored))for(let i=0;i<10;i++)for(const side of ['left','right'] as const){const value=stored[i]?.[side];if(typeof value==='string')labels[i][side]=normalize(value);}}catch{saved=false;}
  const atlas=canvas(2048,1024);
  function drawLabel(level:number,side:CityMallSignSide){
    const ctx=atlas.ctx,x=side==='left'?0:1024,y=(level-1)*102.4,text=labels[level-1][side];ctx.clearRect(x,y,1024,102.4);
    ctx.fillStyle=level%2?'#ff9cdb':'#8bd7ff';ctx.textAlign='center';ctx.textBaseline='middle';
    let size=78;ctx.font=`700 ${size}px Arial`;while(ctx.measureText(text).width>980&&size>28){size-=2;ctx.font=`700 ${size}px Arial`;}
    ctx.fillText(text,x+512,y+51,984);atlas.texture.needsUpdate=true;
  }
  labels.forEach(l=>{drawLabel(l.level,'left');drawLabel(l.level,'right');});
  const labelMaterial=new THREE.MeshStandardMaterial({map:atlas.texture,emissiveMap:atlas.texture,emissive:'#ffffff',emissiveIntensity:1.7,transparent:true,alphaTest:.03,depthWrite:false,roughness:.38});labelMaterial.name='Data Mall · editable floor lettering atlas';materials.push(labelMaterial);neon.register(labelMaterial,'neon',labelMaterial.name);
  for(const p of labelPositions){
    const g=new THREE.PlaneGeometry(10.8,.78),uv=g.getAttribute('uv'),col=p.side==='left'?0:1;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(col+uv.getX(i))/2,1-(p.level-uv.getY(i))/10);
    push(g,labelMaterial,p.x,p.y,p.z+.035);
  }
  const persist=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(labels));saved=true;}catch{saved=false;}};
  const signs:CityMallSigns={getLabels:()=>labels.map(l=>({...l})),setLabel:(level,side,text)=>{if(!Number.isInteger(level)||level<1||level>10||!['left','right'].includes(side))return;labels[level-1][side]=normalize(text);drawLabel(level,side);persist();},resetLevel:level=>{if(!Number.isInteger(level)||level<1||level>10)return;labels[level-1].left=labels[level-1].right=levelText(level);drawLabel(level,'left');drawLabel(level,'right');persist();},isSaved:()=>saved};
  for(const [m,geometries] of batches){const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());const mesh=new THREE.Mesh(merged,m);mesh.name=m.name;group.add(mesh);}
  // Constant-speed luminous packets travel along the actual bent channels, with short tapered tails.
  const packetMaterial=new THREE.MeshBasicMaterial({color:new THREE.Color('#ffffff').multiplyScalar(3),toneMapped:false});packetMaterial.name='Data Mall · moving blue and pink data';materials.push(packetMaterial);neon.register(packetMaterial,'neon',packetMaterial.name);
  const packetsPerPath=2,tailCount=5,packets=new THREE.InstancedMesh(new THREE.BoxGeometry(.075,.075,.50),packetMaterial,paths.length*packetsPerPath*tailCount);packets.name='Data Mall · travelling data stream packets';packets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);packets.frustumCulled=false;group.add(packets);
  const clock=createCityStreamClock(),matrix=new THREE.Matrix4(),pos=new THREE.Vector3(),direction=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),forward=new THREE.Vector3(0,0,1);
  const packetColors=[new THREE.Color('#8bd7ff'),new THREE.Color('#ff9cdb')];
  for(let i=0;i<packets.count;i++)packets.setColorAt(i,packetColors[paths[Math.floor(i/(packetsPerPath*tailCount))].color]);
  function update(elapsed:number,reducedMotion=false){
    const t=clock.step(elapsed,reducedMotion);let instance=0;
    for(const path of paths)for(let stream=0;stream<packetsPerPath;stream++)for(let tail=0;tail<tailCount;tail++){
      const distance=((t*3.8+path.offset+stream*path.length/packetsPerPath-tail*.33)%path.length+path.length)%path.length;
      let segment=1;while(segment<path.lengths.length-1&&path.lengths[segment]<distance)segment++;
      const a=path.points[segment-1],b=path.points[segment],span=path.lengths[segment]-path.lengths[segment-1];
      pos.copy(a).lerp(b,(distance-path.lengths[segment-1])/span);pos.z+=.035;
      direction.copy(b).sub(a).normalize();rotation.setFromUnitVectors(forward,direction);scale.setScalar(1-tail*.14);matrix.compose(pos,rotation,scale);packets.setMatrixAt(instance++,matrix);
    }
    packets.instanceMatrix.needsUpdate=true;
  }
  update(0);
  const snapshot=()=>({width,depth,height,retailLevels:10,interiorBays:30,atriumDepth:6.6,labels:signs.getLabels(),labelPositions,labelsSaved:saved,editableLabels:20,visitorCount:peoplePositions.length,circuitPaths:paths.length,circuitPalette:['#48b3ff','#ff79c7'],stream:{...clock.snapshot(),packets:packets.count,speedMetresPerSecond:3.8,headPositions:paths.slice(0,4).map((_,i)=>{packets.getMatrixAt(i*packetsPerPath*tailCount,matrix);return new THREE.Vector3().setFromMatrixPosition(matrix).toArray();})},reference:'data-mall-reference.png'});
  group.userData.snapshot=snapshot;
  return {group,ready,signs,update,setStreamSpeed:clock.setSpeed,snapshot,dispose:()=>packets.dispose()};
}
