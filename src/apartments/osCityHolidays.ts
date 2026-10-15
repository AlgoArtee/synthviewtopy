import * as THREE from 'three';
import { CITY_BED } from './osCityLayout';

export const CITY_HOLIDAYS = [{id:'none',label:'None · everyday apartment'},{id:'halloween',label:'Halloween · cyberpunk'}] as const;
export type CityHoliday = typeof CITY_HOLIDAYS[number]['id'];
export interface CityHolidayControls {
  setHoliday: (value:string) => void;
  getSnapshot: () => {holiday:CityHoliday;active:boolean;saved:boolean;reducedMotion:boolean;elapsed:number;decorations:{pumpkins:number;bats:number;ghosts:number;webs:number}};
  subscribe: (listener:()=>void) => ()=>void;
}

/** Reversible, room-local seasonal installation. All positions are in apartment metres. */
export function createOsCityHolidays(scene:THREE.Scene, diffusers:THREE.MeshStandardMaterial[], onHolidayChange?:(holiday:CityHoliday)=>void) {
  const group=new THREE.Group();group.name='Halloween · cyberpunk apartment installation';scene.add(group);
  const orange=new THREE.MeshBasicMaterial({color:'#ff9b36',toneMapped:false,fog:false});
  const violet=new THREE.MeshBasicMaterial({color:'#c180ff',toneMapped:false,fog:false});
  const cyan=new THREE.MeshBasicMaterial({color:'#58f2ff',toneMapped:false,fog:false});
  const alloy=new THREE.MeshStandardMaterial({color:'#202232',metalness:.72,roughness:.34,fog:false});
  const shell=new THREE.MeshPhysicalMaterial({color:'#a94517',metalness:.56,roughness:.34,clearcoat:.45,fog:false});
  const dark=new THREE.MeshStandardMaterial({color:'#080e1b',metalness:.3,roughness:.45,fog:false});
  const hologram=new THREE.MeshBasicMaterial({color:'#ad87ff',transparent:true,opacity:.19,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,fog:false});
  const mesh=(parent:THREE.Object3D,name:string,geometry:THREE.BufferGeometry,material:THREE.Material,p:number[]=[0,0,0])=>{
    const object=new THREE.Mesh(geometry,material);object.name='Halloween · '+name;object.position.set(p[0],p[1],p[2]);parent.add(object);return object;
  };
  const line=(parent:THREE.Object3D,name:string,points:number[][],material:THREE.Material,radius=.005)=>
    mesh(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number]))),Math.max(12,points.length*3),radius,5,false),material);
  const polygon=(parent:THREE.Object3D,name:string,points:number[][],material:THREE.Material,z=0)=>{
    const shape=new THREE.Shape(points.map(p=>new THREE.Vector2(p[0],p[1])));
    return mesh(parent,name,new THREE.ShapeGeometry(shape),material,[0,0,z]);
  };
  const ring=(parent:THREE.Object3D,r:number,material:THREE.Material,x=0,y=0,z=0)=>mesh(parent,'optical halo',new THREE.TorusGeometry(r,.006,6,64),material,[x,y,z]);
  let pumpkinCount=0;
  function pumpkin(x:number,y:number,z:number,r:number,turn:number) {
    const p=new THREE.Group();p.name='Halloween · jack-o-lantern '+(++pumpkinCount);p.position.set(x,y,z);p.rotation.y=turn;p.scale.setScalar(r);group.add(p);
    const geometry=new THREE.SphereGeometry(1,64,40),positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++){
      const px=positions.getX(i),py=positions.getY(i),pz=positions.getZ(i),angle=Math.atan2(pz,px),rib=.92+.08*Math.cos(angle*10);
      positions.setXYZ(i,px*rib,py*.79+.83-.07*Math.pow(Math.abs(py),10),pz*rib);
    }
    geometry.computeVertexNormals();const body=mesh(p,'ribbed anodized pumpkin shell',geometry,shell);body.castShadow=body.receiveShadow=true;
    mesh(p,'pumpkin optical base',new THREE.CylinderGeometry(.64,.70,.07,40),alloy,[0,.035,0]);
    const base=ring(p,.66,cyan,0,.07,0);base.rotation.x=Math.PI/2;
    line(p,'short bent carbon stem',[[0,1.54,0],[.01,1.72,0],[.10,1.82,-.04]],alloy,.10);
    for(let j=0;j<10;j++){
      const a=(j+.5)/10*Math.PI*2,points=[];
      for(let i=0;i<=24;i++){const t=.3+i/24*2.5;points.push([Math.cos(a)*Math.sin(t)*.85,Math.cos(t)*.79+.83,Math.sin(a)*Math.sin(t)*.85]);}
      line(p,'inlaid illuminated pumpkin seam',points,j%2?orange:violet,.008);
    }
    // Face patches follow the curved shell instead of floating on a rectangular card.
    const face=(name:string,points:number[][])=>{
      const shape=new THREE.Shape(points.map(a=>new THREE.Vector2(a[0],a[1]+.83)));
      const g=new THREE.ShapeGeometry(shape),pos=g.attributes.position;
      for(let i=0;i<pos.count;i++){const fx=pos.getX(i),fy=(pos.getY(i)-.83)/.79;pos.setZ(i,Math.sqrt(Math.max(.1,1-fx*fx-fy*fy))+.018);}
      mesh(p,name+' black recess',g,dark);
      const lightG=g.clone(),lp=lightG.attributes.position;
      const centre=new THREE.Vector3();for(let i=0;i<lp.count;i++)centre.add(new THREE.Vector3().fromBufferAttribute(lp,i));centre.divideScalar(lp.count);
      for(let i=0;i<lp.count;i++){lp.setX(i,centre.x+(lp.getX(i)-centre.x)*.77);lp.setY(i,centre.y+(lp.getY(i)-centre.y)*.77);lp.setZ(i,lp.getZ(i)+.014);}
      mesh(p,name+' amber optical cutout',lightG,orange);
    };
    face('left eye',[[-.59,.08],[-.23,.10],[-.34,.39]]);face('right eye',[[.23,.10],[.59,.08],[.34,.39]]);
    face('nose',[[-.09,-.09],[.09,-.09],[0,.07]]);
    face('toothed grin',[[-.57,-.18],[-.33,-.27],[-.19,-.22],[-.16,-.34],[.08,-.34],[.11,-.22],[.3,-.27],[.57,-.18],[.38,-.48],[.18,-.54],[.16,-.43],[-.04,-.44],[-.07,-.55],[-.36,-.47]]);
    return p;
  }
  // Two floor lanterns sit against the west wall, clear of the lounge and walkways.
  pumpkin(-4.29,.01,4.08,.42,1.04);pumpkin(-3.88,.01,4.57,.27,.8);
  pumpkin(1.03,.805,5.65,.18,Math.PI); // spare end of the desk
  pumpkin(4.23,.911,2.64,.16,-Math.PI/2); // clear counter, between sink and mug
  pumpkin(4.34,2.20,4.86,.22,-Math.PI/2); // fridge top
  const floorFootprints=[new THREE.Box3(new THREE.Vector3(-4.71,0,3.66),new THREE.Vector3(-3.87,.85,4.50)),new THREE.Box3(new THREE.Vector3(-4.15,0,4.30),new THREE.Vector3(-3.61,.55,4.84))];
  const colliders=floorFootprints.map(()=>new THREE.Box3());

  // A translucent wall projection, with a warm moon and a custom Halloween logotype.
  function sign(parent:THREE.Object3D,text:string,sub:string,width:number,height:number,position:number[],turn:number) {
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=320;const c=canvas.getContext('2d')!;
    c.strokeStyle='#ffae54';c.lineWidth=3;c.strokeRect(12,12,1000,296);
    for(let i=0;i<9;i++){const x=40+i*112;c.strokeStyle=i%2?'#a681fa':'#ff9e40';c.beginPath();c.moveTo(x,32);c.lineTo(x+34,32);c.lineTo(x+49,47);c.lineTo(x+75,47);c.stroke();}
    c.textAlign='center';c.fillStyle='#ffbe79';c.shadowColor='#ff6217';c.shadowBlur=12;c.font='600 92px monospace';c.fillText(text,512,159);c.shadowBlur=0;
    c.fillStyle='#c4a2ff';c.font='26px monospace';c.fillText(sub,512,234);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,fog:false});
    const panel=mesh(parent,'holographic '+text,new THREE.PlaneGeometry(width,height),material,position);panel.rotation.y=turn;return panel;
  }
  sign(group,'HALLOWEEN','NORTH CITY  /  AFTER DARK  /  31.10',2.25,.70,[-4.785,2.0,3.73],Math.PI/2);
  sign(group,'TRICK OR TREAT','SYNTH CANDY  /  SWEET SIGNALS',1.38,.43,[4.275,2.28,2.95],-Math.PI/2);
  const moon=new THREE.Group();moon.name='Halloween · violet harvest moon';moon.position.set(-4.77,2.78,3.73);moon.rotation.y=Math.PI/2;group.add(moon);
  mesh(moon,'translucent moon disc',new THREE.CircleGeometry(.37,64),hologram);ring(moon,.38,orange);ring(moon,.42,violet);
  for(let i=0;i<7;i++)line(moon,'moon scanline',[[-.28,.24-i*.08,.006],[.28,.24-i*.08,.006]],violet,.0015);

  // Slow wing articulation and a few centimetres of drift keep the holograms restful.
  const bats:{root:THREE.Group;wings:THREE.Group[];base:THREE.Vector3;phase:number}[]=[];
  function bat(position:number[],scale:number,turn:number,phase:number){
    const b=new THREE.Group();b.name='Halloween · holographic bat';b.position.set(...position as [number,number,number]);b.rotation.y=turn;b.scale.setScalar(scale);group.add(b);
    const wings:THREE.Group[]=[];
    for(const side of [-1,1]){
      const wing=new THREE.Group();wing.scale.x=side;b.add(wing);wings.push(wing);
      const points=[[.04,.05],[.23,.3],[.45,.42],[.7,.48],[.61,.18],[.54,.08],[.41,.16],[.30,-.04],[.19,.03],[.08,-.17]];
      polygon(wing,'translucent bat membrane',points,hologram);
      line(wing,'violet bat silhouette',[...points,points[0]].map(p=>[p[0],p[1],.003]),violet,.007);
      for(const end of [[.7,.48],[.41,.16],[.30,-.04]])line(wing,'bat wing circuitry',[[.06,0,.008],[.25,.15,.008],[end[0],end[1],.008]],cyan,.003);
    }
    const body=mesh(b,'bat body',new THREE.SphereGeometry(.13,12,10),hologram);body.scale.set(.65,1.35,.7);
    for(const x of [-.05,.05]){mesh(b,'bat eye',new THREE.SphereGeometry(.016,8,6),orange,[x,.09,.09]);polygon(b,'bat pointed ear',[[x-.04,.13],[x,.24],[x+.04,.13]],violet);}
    bats.push({root:b,wings,base:b.position.clone(),phase});
  }
  bat([-4.55,2.81,1.45],.62,Math.PI/2,0);bat([-4.49,2.47,2.45],.38,Math.PI/2,1.4);bat([-4.54,3.06,5.12],.42,Math.PI/2,3);
  bat([2.8,3.04,5.93],.56,Math.PI,2.2);bat([3.6,2.85,5.92],.31,Math.PI,4);
  bat([CITY_BED.minX+.35,3.04,-2.15],.54,Math.PI/2,1);bat([CITY_BED.minX+.36,2.79,-7.6],.38,Math.PI/2,4.8);

  const ghosts:{root:THREE.Group;baseY:number;phase:number}[]=[];
  function ghost(x:number,y:number,z:number,turn:number,scale:number,phase:number){
    const g=new THREE.Group();g.name='Halloween · friendly holographic ghost';g.position.set(x,y,z);g.rotation.y=turn;g.scale.setScalar(scale);group.add(g);
    const geo=new THREE.SphereGeometry(1,32,20,0,Math.PI*2,0,Math.PI*.5);geo.scale(.27,.3,.19);mesh(g,'ghost domed head',geo,hologram);
    const skirt=new THREE.CylinderGeometry(.27,.37,.64,40,10,true),pos=skirt.attributes.position;
    for(let i=0;i<pos.count;i++){const a=Math.atan2(pos.getZ(i),pos.getX(i)),v=(.32-pos.getY(i))/.64;pos.setY(i,pos.getY(i)-.32+.065*Math.cos(a*6)*v*v);pos.setZ(i,pos.getZ(i)*.70);}
    skirt.computeVertexNormals();mesh(g,'flowing ghost projection',skirt,hologram);
    for(let j=0;j<12;j++){const a=j/12*Math.PI*2,pts=[];for(let i=0;i<=18;i++){const t=i/18;pts.push([Math.cos(a)*(.27+.10*t),-.64*t+.065*Math.cos(a*6)*t*t,Math.sin(a)*(.27+.10*t)*.70]);}line(g,'ghost scan filaments',pts,j%3?cyan:violet,.0025);}
    for(const x of [-.09,.09]){const eye=mesh(g,'friendly ghost eye',new THREE.SphereGeometry(.035,12,8),cyan,[x,-.02,.195]);eye.scale.y=1.5;}
    const mouth=ring(g,.032,orange,0,-.13,.21);mouth.scale.y=1.3;
    const halo=ring(g,.33,violet,0,-.84,0);halo.rotation.x=Math.PI/2;
    ghosts.push({root:g,baseY:y,phase});
  }
  ghost(-3.5,2.5,-.70,0,.72,0);ghost(CITY_BED.minX+.45,2.5,-7.9,Math.PI/2,.65,2);

  function web(x:number,y:number,z:number,turn:number,r:number){
    const w=new THREE.Group();w.name='Halloween · circuit spiderweb';w.position.set(x,y,z);w.rotation.y=turn;group.add(w);
    const point=(a:number,r:number)=>[Math.cos(a)*r,Math.sin(a)*r,0];
    for(let i=0;i<9;i++)line(w,'web radial trace',[[0,0,0],point(i/8*Math.PI/2-Math.PI/2,r)],violet,.003);
    for(let k=1;k<=5;k++){const p=[];for(let i=0;i<=16;i++)p.push(point(i/16*Math.PI/2-Math.PI/2,r*k/5*(i%2?.89:1)));line(w,'web polygon trace',p,k%2?cyan:violet,.003);}
    const spider=mesh(w,'tiny optical spider',new THREE.SphereGeometry(.045,12,8),alloy,[r*.32,-r*.48,.025]);spider.scale.y=1.3;
    for(const side of [-1,1])for(let i=0;i<4;i++){const by=-r*.48+.02*(i-1.5);line(w,'spider articulated legs',[[r*.32,by,.03],[r*.32+side*.07,by+.025*(i-1.5),.035],[r*.32+side*.10,by+.05*(i-1.5),.015]],violet,.003);}
  }
  web(-4.78,3.38,5.95,Math.PI/2,1.08);web(1.45,3.38,6.12,Math.PI,.90);web(CITY_BED.minX+.04,3.38,-1.08,Math.PI/2,.88);

  // A low-profile garland attaches to the alcove wall, never across the city window.
  const garland=[];for(let i=0;i<=32;i++){const t=i/32;garland.push([CITY_BED.minX+.07,3.43-Math.sin(t*Math.PI)*.07,-1.25-t*7.7]);}
  line(group,'bedroom garland cable',garland,alloy,.008);
  for(let i=0;i<15;i++){
    const t=i/14,y=3.43-Math.sin(t*Math.PI)*.07,z=-1.25-t*7.7;
    line(group,'short lantern pendant',[[CITY_BED.minX+.07,y,z],[CITY_BED.minX+.07,y-.035,z]],alloy,.004);
    const lantern=mesh(group,'faceted lantern',new THREE.IcosahedronGeometry(.055,0),i%2?orange:violet,[CITY_BED.minX+.07,y-.09,z]);lantern.scale.y=1.25;
  }
  // Reuse the installed room fixtures. Extra global lights would recompile and
  // increase shading cost for the entire city, even when the decor is switched off.
  const tintMaterials=diffusers.map((material,i)=>({material,color:material.color.clone(),emissive:material.emissive.clone(),tint:i===0?'#ff9e49':i===1?'#bd76ff':'#d3a0ff'}));
  const fixtureTints:Record<string,string>={'Ceiling ring illumination':'#c295ff','South room reflected light':'#ffc18c','Alcove cove indirect light':'#b787ff','Workstation soft cyan light':'#ff9f52','Workstation pink edge light':'#a473ff','Bathroom pink wall wash':'#b772ff','Bathroom cyan wall wash':'#ff9f52'};
  const tintLights:{light:THREE.Light;color:THREE.Color;tint:string}[]=[];
  scene.traverse(o=>{if(o instanceof THREE.Light&&fixtureTints[o.name])tintLights.push({light:o,color:o.color.clone(),tint:fixtureTints[o.name]});});
  const key='north-city-holiday-v1',motion=window.matchMedia('(prefers-reduced-motion: reduce)'),listeners=new Set<()=>void>();
  let holiday:CityHoliday='none',saved=false,elapsed=0,lastTime:number|undefined;
  try{const value=localStorage.getItem(key);if(value==='none'||value==='halloween'){holiday=value;saved=true;}}catch{/* Storage is optional. */}
  const notify=()=>listeners.forEach(fn=>fn());
  const sync=()=>{
    const active=holiday==='halloween';group.visible=active;
    onHolidayChange?.(holiday);
    tintMaterials.forEach(t=>{t.material.color.copy(active?new THREE.Color(t.tint):t.color);t.material.emissive.copy(active?new THREE.Color(t.tint):t.emissive);});
    tintLights.forEach(t=>t.light.color.copy(active?new THREE.Color(t.tint):t.color));
    colliders.forEach((box,i)=>active?box.copy(floorFootprints[i]):box.makeEmpty());
  };
  const controls:CityHolidayControls={
    setHoliday(value){if(value!=='none'&&value!=='halloween')return;holiday=value;try{localStorage.setItem(key,value);saved=true;}catch{saved=false;}sync();notify();},
    getSnapshot:()=>({holiday,active:group.visible,saved,reducedMotion:motion.matches,elapsed:Math.round(elapsed*1000)/1000,decorations:{pumpkins:pumpkinCount,bats:bats.length,ghosts:ghosts.length,webs:3}}),
    subscribe(fn){listeners.add(fn);return()=>{listeners.delete(fn);};}
  };
  motion.addEventListener('change',notify);sync();
  return {group,controls,colliders,update(t:number){
    const dt=lastTime===undefined?0:Math.max(0,t-lastTime);lastTime=t;
    if(!group.visible||motion.matches)return;elapsed+=dt;
    bats.forEach(({root,wings,base,phase})=>{root.position.y=base.y+Math.sin(elapsed*.6+phase)*.035;wings.forEach((wing,i)=>{wing.rotation.y=(i?1:-1)*Math.sin(elapsed*1.8+phase)*.28;});});
    ghosts.forEach(({root,baseY,phase})=>{root.position.y=baseY+Math.sin(elapsed*.7+phase)*.055;root.rotation.z=Math.sin(elapsed*.43+phase)*.045;});
  },dispose(){motion.removeEventListener('change',notify);listeners.clear();holiday='none';sync();}};
}
