import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { createCityNeonAtmosphere } from './osCityNeonAtmosphere';
import type { OsCityWeather } from './osCityWeather';

export const CITY_MARKET_STALLS = [
  {name:'NOODLES',type:'noodles',x:32,z:-41,width:5.4,depth:3.2,rotation:-.18,reference:'image_20261014_152320.jpg'},
  {name:'CYBERWARE',type:'cyberware',x:40,z:-42,width:5.8,depth:3,rotation:-.10,reference:'image_20261014_152321.jpg'},
  {name:'HOLO FISH',type:'fish',x:48,z:-40.8,width:5.4,depth:2.8,rotation:-.26,reference:'image_20261014_152321_1.jpg'},
  {name:'MYCO · NEO',type:'myco',x:96,z:37,width:5,depth:2.8,rotation:-Math.PI+1.1,reference:'image_20261014_152322.jpg'},
  {name:'BIO · SPICE',type:'spice',x:105,z:33,width:5.6,depth:3,rotation:-Math.PI+1.0,reference:'image_20261014_152322_1.jpg'},
  {name:'SMART FABRIC',type:'fabric',x:30,z:28.3,width:5.6,depth:3,rotation:Math.PI+.08,reference:'image_20261014_152322_2.jpg'},
  {name:'MEMORY DREAM',type:'memory',x:38.3,z:28.3,width:5.5,depth:2.8,rotation:Math.PI+.08,reference:'image_20261014_152324.jpg'},
  {name:'RETRO / VINYL',type:'vinyl',x:48,z:28.3,width:5.5,depth:2.8,rotation:Math.PI+.08,reference:'image_20261014_152324_1.jpg'},
  {name:'SYNTH FRUIT',type:'fruit',x:60,z:38,width:6.2,depth:3.4,rotation:Math.PI+.28,reference:'image_20261014_152326.jpg'},
  {name:'KURO · MECH',type:'repair',x:70,z:43,width:5.8,depth:3,rotation:Math.PI+.55,reference:'image_20261014_152341.jpg'},
] as const;

export function cityMarketFootprints(){
  return CITY_MARKET_STALLS.map(s=>({x:s.x,z:s.z,
    halfWidth:(Math.abs(Math.cos(s.rotation))*(s.width+.3)+Math.abs(Math.sin(s.rotation))*(s.depth+.4))/2,
    halfDepth:(Math.abs(Math.sin(s.rotation))*(s.width+.3)+Math.abs(Math.cos(s.rotation))*(s.depth+.4))/2}));
}

/** Ten small, dimensional businesses, sharing material batches rather than ten scene graphs. */
export function createOsCityMarketStalls(neon:ReturnType<typeof createCityNeonAtmosphere>){
  const group=new THREE.Group();group.name='Circuit Market · ten independent street vendors';
  const snow=new THREE.Group();snow.name='Market awnings · supported snow';snow.visible=false;group.add(snow);
  const batches=new Map<THREE.Material,THREE.BufferGeometry[]>(),materials:THREE.Material[]=[],textures:THREE.Texture[]=[];
  const loads:Promise<void>[]=[];
  let current=new THREE.Matrix4(),partCount=0;
  function mat(name:string,color:string,roughness=.65,metalness=.25,emission=0){
    const m=new THREE.MeshStandardMaterial({color,roughness,metalness,emissive:color,emissiveIntensity:emission});
    m.name='Market · '+name;materials.push(m);neon.register(m,emission?'neon':'surface',m.name);return m;
  }
  const steel=mat('weathered steel','#27353c',.61,.65),edges=mat('worn metal edges','#60717a',.45,.68);
  const black=mat('recesses and cables','#10191f',.85,.12),counter=mat('brushed stainless counters','#65777e',.42,.7);
  const wood=mat('timber crates','#66503a',.92,.04),canvas=mat('woven awnings','#303c45',.96,.02);
  const cyan=mat('cyan neon','#58dfff',.3,.25,2.8),pink=mat('pink neon','#ff62b3',.3,.25,2.6);
  const gold=mat('amber lanterns','#ffc46d',.55,.12,1.3),violet=mat('violet produce','#8b77d2',.6,.12,.28);
  const blue=mat('blue cloth','#28699e',.88,.02),rose=mat('pink cloth','#975876',.87,.02);
  const glowcap=mat('blue mushroom caps','#66b9cf',.62,.03,.34);
  const orange=mat('ripe fruit','#de8a35',.65,.03),green=mat('fresh produce','#638953',.9,.02);
  const ceramic=mat('ramen bowls','#d0c6b4',.38,.10),food=mat('noodles and mushrooms','#d1b784',.83,.02);
  const snowMat=mat('snow on canopies','#e2ebf0',.97,0);
  const glass=new THREE.MeshPhysicalMaterial({color:'#8fc8db',transparent:true,opacity:.13,roughness:.16,metalness:.06,depthWrite:false,side:THREE.DoubleSide});materials.push(glass);
  // Fine seams, scratches and fasteners add material scale without a patchy pavement-like pattern.
  const wearCanvas=document.createElement('canvas');wearCanvas.width=wearCanvas.height=256;
  const wc=wearCanvas.getContext('2d')!;wc.fillStyle='#b5babe';wc.fillRect(0,0,256,256);
  for(let n=0;n<170;n++){const x=(n*67)%256,y=(n*109)%256;wc.strokeStyle=n%3?'#a4adb2':'#d0d4d6';wc.lineWidth=1;wc.beginPath();wc.moveTo(x,y);wc.lineTo(x+2+n%9,y+.4);wc.stroke();}
  wc.strokeStyle='#7b898e';wc.strokeRect(3,3,250,250);
  const wear=new THREE.CanvasTexture(wearCanvas);wear.colorSpace=THREE.SRGBColorSpace;textures.push(wear);steel.map=wear;steel.bumpMap=wear;steel.bumpScale=.018;
  counter.map=wear;counter.bumpMap=wear;counter.bumpScale=.008;blue.side=THREE.DoubleSide;canvas.side=THREE.DoubleSide;snowMat.side=THREE.DoubleSide;
  const timberCanvas=document.createElement('canvas');timberCanvas.width=timberCanvas.height=128;
  const tc=timberCanvas.getContext('2d')!;tc.fillStyle='#b9a48a';tc.fillRect(0,0,128,128);
  for(let n=0;n<110;n++){tc.strokeStyle=n%3?'#988570':'#cebaa0';tc.lineWidth=.5;tc.beginPath();tc.moveTo(0,n*1.17);tc.bezierCurveTo(30,n*1.17-3,90,n*1.17+2,128,n*1.17);tc.stroke();}
  const timber=new THREE.CanvasTexture(timberCanvas);timber.colorSpace=THREE.SRGBColorSpace;textures.push(timber);wood.map=timber;wood.bumpMap=timber;wood.bumpScale=.025;
  function push(g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0,rx=0,ry=0,rz=0){
    if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}
    const transform=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(1,1,1));
    g.applyMatrix4(current.clone().multiply(transform));const list=batches.get(m)??[];list.push(g);batches.set(m,list);partCount++;
  }
  const box=(m:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number,rx=0,ry=0,rz=0)=>push(new THREE.BoxGeometry(w,h,d),m,x,y,z,rx,ry,rz);
  const cyl=(m:THREE.Material,x:number,y:number,z:number,r:number,h:number,rx=0,rz=0)=>push(new THREE.CylinderGeometry(r,r,h,10),m,x,y,z,rx,0,rz);
  function sphere(m:THREE.Material,x:number,y:number,z:number,r:number,sx=1,sy=1,sz=1){const g=new THREE.SphereGeometry(r,10,7);g.scale(sx,sy,sz);push(g,m,x,y,z);}
  const ring=(m:THREE.Material,x:number,y:number,z:number,r:number,t=.025,rx=0)=>push(new THREE.TorusGeometry(r,t,5,16),m,x,y,z,rx);
  function rod(m:THREE.Material,a:number[],b:number[],radius=.025){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),g=new THREE.CylinderGeometry(radius,radius,start.distanceTo(end),6);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(start).normalize()));const mid=start.add(end).multiplyScalar(.5);push(g,m,mid.x,mid.y,mid.z);
  }
  function cable(a:number[],b:number[],drop=.25){
    const mid=a.map((n,i)=>(n+b[i])/2);mid[1]-=drop;
    push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(...a),new THREE.Vector3(...mid),new THREE.Vector3(...b)]),10,.018,5,false),black);
  }
  const signCanvas=document.createElement('canvas');signCanvas.width=2048;signCanvas.height=1280;
  const sc=signCanvas.getContext('2d')!;
  const subtitles=['RAMEN / STEAM / OPEN LATE','IMPLANTS / CALIBRATION','HOLOGRAPHIC FRESH CATCH','CULTURED / FRESH / LOCAL','SMALL BATCH / BIO SPICES','WEAVE / THREAD / REPAIR','DATA CHIPS / NEURAL PORTS','RECORDS / CHIPS / REPAIRS','LAB GROWN / PICKED TODAY','ANDROID PARTS / SALVAGE'];
  CITY_MARKET_STALLS.forEach((s,i)=>{
    const x=i%2*1024,y=Math.floor(i/2)*256,color=i%2?'#69e8ff':'#ff7bbd';
    sc.fillStyle='#0c1820';sc.fillRect(x,y,1024,256);sc.strokeStyle='#4d626e';sc.lineWidth=9;sc.strokeRect(x+7,y+7,1010,242);
    sc.strokeStyle=color;sc.lineWidth=2;sc.strokeRect(x+20,y+20,984,216);
    sc.textAlign='center';sc.textBaseline='middle';sc.fillStyle=color;sc.font='500 91px Arial';sc.fillText(s.name,x+512,y+100,935);
    sc.font='500 30px Arial';sc.fillStyle='#c4dfdf';sc.fillText(subtitles[i],x+512,y+190,920);
    for(let bolt=0;bolt<6;bolt++){sc.fillStyle='#70828c';sc.beginPath();sc.arc(x+22+(bolt%3)*490,y+20+Math.floor(bolt/3)*216,4,0,Math.PI*2);sc.fill();}
  });
  const signMap=new THREE.CanvasTexture(signCanvas);signMap.colorSpace=THREE.SRGBColorSpace;signMap.anisotropy=8;textures.push(signMap);
  const signMat=new THREE.MeshStandardMaterial({map:signMap,emissiveMap:signMap,emissive:'#ffffff',emissiveIntensity:1.25,roughness:.45,metalness:.3});materials.push(signMat);neon.register(signMat,'neon','Market business lettering');
  const priceCanvas=document.createElement('canvas');priceCanvas.width=1024;priceCanvas.height=640;const pc=priceCanvas.getContext('2d')!;
  const stockLabels=['RAMEN · 350¥','MK-IV · TESTED','FRESH · 24H','GLOWCAP · 60¥','BIO SPICE · 12G','SMARTWEAVE · 1M','DREAM CHIP · 256GB','VINYL · USED · 15¥','SYNTH FRUIT · 1KG','PARTS · TESTED'];
  stockLabels.forEach((t,i)=>{const x=i%2*512,y=Math.floor(i/2)*128;pc.fillStyle='#12242b';pc.fillRect(x,y,512,128);pc.strokeStyle='#60838a';pc.lineWidth=4;pc.strokeRect(x+5,y+5,502,118);pc.fillStyle='#b6e4e8';pc.font='bold 33px monospace';pc.textAlign='center';pc.fillText(t,x+256,y+57,474);pc.fillStyle='#7b9fa3';pc.font='19px monospace';pc.fillText('NORTH CITY // MARKET',x+256,y+99);});
  const priceMap=new THREE.CanvasTexture(priceCanvas);priceMap.colorSpace=THREE.SRGBColorSpace;textures.push(priceMap);
  const priceMat=new THREE.MeshStandardMaterial({map:priceMap,roughness:.8});materials.push(priceMat);
  function panel(m:THREE.Material,x:number,y:number,z:number,w:number,h:number,crop:number[],rx=0){
    const g=new THREE.PlaneGeometry(w,h),uv=g.getAttribute('uv');for(let n=0;n<uv.count;n++)uv.setXY(n,crop[0]+uv.getX(n)*(crop[2]-crop[0]),1-crop[3]+uv.getY(n)*(crop[3]-crop[1]));push(g,m,x,y,z,rx);
  }
  function label(index:number,x:number,y:number,z:number,w:number,h:number){
    box(black,x,y,z-.035,w+.08,h+.08,.09);panel(signMat,x,y,z+.012,w,h,[index%2/2,Math.floor(index/2)/5,(index%2+1)/2,(Math.floor(index/2)+1)/5]);
  }
  function crate(x:number,y:number,z:number,w=1,h=.30,d=.65){
    box(wood,x,y-h/2+.035,z,w,.07,d);
    for(const side of [-1,1]){box(wood,x+side*(w/2-.035),y,z,.07,h,d);box(wood,x,y,z+side*(d/2-.035),w,h,.07);}
    for(let n=0;n<3;n++)box(black,x,y-h*.27+n*h*.27,z+d/2+.002,w-.12,.012,.012);
  }
  function bottle(x:number,y:number,z:number,tint:THREE.Material,h=.34,r=.08){
    cyl(tint,x,y+h*.42,z,r,h*.84);cyl(counter,x,y+h*.88,z,r*.45,h*.15);cyl(wood,x,y+h*.99,z,r*.48,.035);
    box(ceramic,x,y+h*.43,z+r,.09,h*.26,.006);
  }
  function mushroom(x:number,y:number,z:number,tint:THREE.Material,size=.23){
    cyl(food,x,y+size*.48,z,size*.13,size*.95);const cap=new THREE.SphereGeometry(size,10,5,0,Math.PI*2,0,Math.PI/2);cap.scale(1,.38,1);push(cap,tint,x,y+size,z);
  }
  function arm(x:number,y:number,z:number,s=.65){
    sphere(edges,x,y,z,.12*s);rod(counter,[x,y,z],[x-.12*s,y-.48*s,z+.03],.10*s);
    ring(black,x-.12*s,y-.47*s,z+.08,.11*s,.028*s);rod(edges,[x-.12*s,y-.5*s,z],[x+.03,y-.96*s,z+.15],.078*s);
    box(counter,x+.03,y-1.06*s,z+.15,.19*s,.22*s,.10*s);
    for(let f=0;f<4;f++)rod(edges,[x+(.065-f*.043)*s,y-1.15*s,z+.15],[x+(.09-f*.058)*s,y-1.36*s,z+.19],.018*s);
    rod(cyan,[x-.06*s,y-.12*s,z+.09],[x-.17*s,y-.37*s,z+.11],.014*s);
  }
  function head(x:number,y:number,z:number,s=.4){
    sphere(counter,x,y,z,s,.79,1,.85);box(steel,x,y-.19*s,z+s*.62,s*1.1,s*.62,s*.42);
    box(black,x,y+.09*s,z+s*.75,s*1.26,s*.37,.05);box(pink,x,y+.09*s,z+s*.79,s*1.1,.035,.018);
    for(const side of [-1,1])cyl(edges,x+side*s*.79,y,z,s*.30,.07,0,Math.PI/2);
  }
  function lantern(x:number,y:number,z:number,tint:THREE.Material){
    rod(black,[x,y+.30,z],[x,2.88,z],.012);sphere(tint,x,y,z,.24,1,1.35,1);
    for(let j=0;j<7;j++){const dy=(j-3)*.07,rad=.235*Math.sqrt(1-(dy/.34)**2);ring(wood,x,y+dy,z,rad,.009,Math.PI/2);}
    cyl(black,x,y+.32,z,.09,.045);cyl(black,x,y-.32,z,.09,.045);
  }
  // Back panels are cropped merchandise details from the supplied images, recessed
  // behind real counters, shelving and products. No white-background stall billboards.
  const crops=[[.38,.34,.67,.70],[.30,.28,.69,.66],[.28,.37,.70,.68],[.31,.35,.71,.72],[.32,.28,.72,.68],[.37,.34,.61,.70],[.40,.28,.61,.70],[.35,.30,.66,.68],[.27,.36,.69,.64],[.20,.61,.72,.77]];
  CITY_MARKET_STALLS.forEach((s,index)=>{
    current.compose(new THREE.Vector3(s.x,-14.02,s.z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),s.rotation),new THREE.Vector3(1,1,1));
    const w=s.width,d=s.depth,front=d/2-.1,back=-d/2+.13,accent=index%2?cyan:pink;
    const timberFront=['fruit','myco','vinyl'].includes(s.type),openBench=['memory','repair'].includes(s.type);
    // A braced frame, shallow roof, open service side and grounded plinth.
    box(steel,0,.10,0,w,.20,d);box(black,0,.22,0,w-.18,.08,d-.16);
    box(steel,0,1.52,back,w-.12,2.65,.13);
    for(const side of [-1,1]){
      for(const z of [back,front-.1]){box(edges,side*(w/2-.10),1.75,z,.10,3.25,.10);box(steel,side*(w/2-.10),.06,z,.25,.12,.24);}
      box(steel,side*(w/2-.12),.65,0,.12,.95,d-.15);
      rod(edges,[side*(w/2-.1),2.35,front-.1],[side*(w/2-.1),3.15,front-.8],.035);
      cable([side*w*.45,3.0,back+.1],[side*w*.45,2.0,front-.12],.3);
      for(let n=0;n<5;n++)cyl(counter,side*(w/2-.1),.45+n*.55,front-.035,.025,.025,Math.PI/2);
    }
    box(s.type==='repair'?wood:counter,0,1.05,.02,w+.1,.11,d-.12);
    if(!openBench)box(timberFront?wood:steel,0,.61,front-.45,w-.2,.77,.12);
    // Raised stock sits on real shelves with legs that meet the working deck.
    const raisedShelf=(top:number,z:number,width:number,depth:number)=>{
      box(counter,0,top-.035,z,width,.07,depth);
      const h=top-.07-1.105;
      for(const x of [-width/2+.10,width/2-.10])for(const dz of [-depth/2+.08,depth/2-.08])box(edges,x,1.105+h/2,z+dz,.055,h,.055);
    };
    for(let n=0;n<4;n++){
      const x=(n-1.5)*w/4;
      if(timberFront){
        crate(x,.58,front-.50,w/4-.08,.57,.72);
        for(let q=0;q<4;q++)box(s.type==='vinyl'?black:wood,x+(q-1.5)*.19,.83,front-.40,.15,.28,.24);
      }else if(openBench){
        box(edges,x,.60,front-.48,.06,.84,.06);box(steel,x,.34,front-.52,w/4-.18,.20,.75);
        for(let q=0;q<3;q++){box(black,x+(q-1)*.24,.52,front-.40,.19,.16,.26);box(accent,x+(q-1)*.24,.55,front-.26,.08,.014,.01);}
      }else{
        box(edges,x,.60,front-.37,w/4-.09,.61,.035);box(black,x,.60,front-.345,w/4-.19,.48,.012);
        box(counter,x+.22,.66,front-.32,.12,.035,.04);
        for(let slit=0;slit<4;slit++)box(edges,x-.19,.48+slit*.038,front-.32,.22,.012,.012);
        box(wood,x-.27,.75,front-.32,.17,.10,.012,0,0,.12);
      }
      for(const dx of [-.42,.42])box(counter,x+dx,.36,front-.29,.025,.025,.014);
    }
    // Distinct silhouettes: tarpaulin produce canopy, half-covered textile rack,
    // open repair/data benches and deeper food awnings instead of identical kiosks.
    const roofWidth=s.type==='fabric'?w*.64:w+.22,roofX=s.type==='fabric'?w*.18:0;
    const roofDepth=openBench?d*.44:s.type==='vinyl'?d*.62:d+.20,roofZ=openBench?back+.36:-.12;
    if(s.type==='fruit'){
      for(const [m,lift] of [[canvas,0],[snowMat,.035]] as const){
        const g=new THREE.PlaneGeometry(w+.22,d+.2,18,10),p=g.getAttribute('position');
        for(let q=0;q<p.count;q++){const x=p.getX(q),z=p.getY(q);p.setXYZ(q,x,3.07+.055*Math.cos(x*5.3)-.08*Math.abs(z)+lift,z-.12);}g.computeVertexNormals();push(g,m);
      }
      for(let n=0;n<12;n++)box(n%3?canvas:rose,(n-5.5)*w/12,2.91,front+.05,w/12-.012,.25,.035);
    }else{
      box(canvas,roofX,3.02,roofZ,roofWidth,.10,roofDepth,.045);
      box(snowMat,roofX,3.085,roofZ,roofWidth-.04,.028,roofDepth-.04,.045);
    }
    if(!openBench&&s.type!=='fruit'){
      box(s.type==='myco'||s.type==='vinyl'?canvas:steel,roofX,2.91,front-.24,roofWidth,.085,s.type==='noodles'?1.4:.94,.17);
      box(accent,roofX,2.82,front+.20,roofWidth-.24,.032,.045);
      for(let rib=0;rib<7;rib++)box(edges,roofX+(rib-3)*roofWidth/7,2.95,front-.24,.025,.04,.94,.17);
    }else box(edges,0,2.90,front-.10,w,.07,.07);
    const signW=s.type==='noodles'?w*.62:s.type==='fruit'?w*.57:s.type==='spice'?w*.65:w-.33;
    const signX=s.type==='fruit'?w*.17:s.type==='noodles'?-w*.12:0,signH=s.type==='noodles'?.82:s.type==='vinyl'?.37:.52;
    if(s.type==='repair')label(index,0,.63,front-.27,w*.66,.55);
    else{box(steel,signX,3.35,front-.40,signW+.18,signH+.13,.20);label(index,signX,3.35,front-.29,signW,signH);}
    if(s.type!=='repair')label(index,-w*.30,.65,front-.30,w*.28,.20);
    let tex!:THREE.Texture;
    loads.push(new Promise<void>((resolve,reject)=>{tex=new THREE.TextureLoader().load('/apartments/assets/north-city/market-stalls/'+s.reference,()=>resolve(),undefined,()=>reject(new Error('Market reference failed: '+s.reference)));}));
    tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;textures.push(tex);
    const detail=new THREE.MeshStandardMaterial({map:tex,emissiveMap:tex,color:'#aeb9c4',emissive:'#c9def0',emissiveIntensity:.27,roughness:.8});materials.push(detail);neon.register(detail,'window','Market recessed '+s.type+' stock');
    const detailW=s.type==='fabric'||s.type==='repair'?w*.31:w*.78;
    box(edges,0,2.36,back+.075,detailW+.10,.70,.045);
    panel(detail,0,2.36,back+.105,detailW,.60,crops[index]);
    const shelfHeights=s.type==='spice'?[1.5775,2.0575,2.76]:s.type==='fabric'?[1.1775,1.6375,2.0975]:[1.25,2.0,2.76];
    for(const y of shelfHeights){box(edges,0,y,back+.28,w-.25,.045,.40);box(accent,0,y-.03,back+.47,w-.4,.018,.018);}
    // Outward-facing payment terminal, lamps and utilities give every vendor a working counter.
    box(black,w*.37,1.26,front-.23,.42,.30,.10,-.2);box(cyan,w*.37,1.27,front-.16,.34,.19,.012,-.2);
    for(let k=0;k<3;k++)box(black,w*.37,1.23+k*.045,front-.145,.26,.012,.009,-.2);
    cable([w*.39,1.05,front-.45],[w*.40,.35,back+.2],.15);
    for(const x of [-w*.28,.0,w*.25]){
      box(black,x,1.16,front+.04,.035,.11,.035);
      panel(priceMat,x,1.245,front+.065,.58,.145,[index%2/2,Math.floor(index/2)/5,(index%2+1)/2,(Math.floor(index/2)+1)/5]);
    }
    if(['noodles','myco','spice'].includes(s.type))for(const x of [-w*.35,w*.35])lantern(x,2.52,front-.06,gold);
    if(s.type==='noodles'){
      box(black,0,1.1575,-.20,w-.65,.105,.95);
      for(let n=0;n<3;n++){
        const x=(n-1)*1.25;for(let tier=0;tier<2;tier++){cyl(counter,x,1.35+tier*.30,-.20,.39,.28);ring(edges,x,1.50+tier*.30,-.20,.40,.025,Math.PI/2);}
        cyl(food,x,1.81,-.20,.33,.035);rod(counter,[x-.12,1.82,-.20],[x+.12,1.82,-.20],.025);
        push(new THREE.CylinderGeometry(.32,.17,.20,16),ceramic,x,1.20,front-.07);cyl(food,x,1.31,front-.07,.29,.018);
        for(let q=0;q<4;q++)ring(food,x+(q-1.5)*.065,1.325,front-.07,.09,.018,Math.PI/2);
        sphere(green,x-.12,1.35,front-.13,.075);sphere(ceramic,x+.13,1.34,front-.04,.09,1,.3,1);sphere(orange,x+.13,1.365,front-.04,.045,1,.3,1);
        rod(wood,[x-.36,1.33,front+.15],[x+.35,1.42,front-.18],.012);rod(wood,[x-.34,1.33,front+.19],[x+.37,1.42,front-.14],.012);
      }
      for(let n=0;n<4;n++)bottle(-2+n*.20,1.11,front-.36,n%2?orange:steel,.38);
    }else if(s.type==='cyberware'){
      for(let n=0;n<3;n++){
        const x=(n-1)*1.65;box(black,x,1.17,0,1.15,.12,.8);box(steel,x,2.53,0,1.15,.08,.8);
        for(const side of [-1,1]){box(edges,x+side*.55,1.87,.37,.055,1.3,.055);box(cyan,x+side*.48,1.87,.38,.02,1.23,.02);}
        arm(x+.05,2.38,.10,.77);box(glass,x,1.88,.405,1.04,1.3,.012);
      }
      for(let n=0;n<5;n++){ring(edges,-1.8+n*.65,1.14,front-.10,.15,.05,Math.PI/2);sphere(cyan,-1.8+n*.65,1.16,front-.10,.065);}
    }else if(s.type==='fish'){
      raisedShelf(1.17,.05,w-.55,.85);
      for(let n=0;n<3;n++){
        const x=(n-1)*1.55,m=n===1?pink:cyan;box(black,x,1.82,.05,1.4,1.3,.8);
        for(const dx of [-.65,.65])box(m,x+dx,1.82,.48,.025,1.2,.025);
        for(const yy of [1.23,2.41])box(m,x,yy,.48,1.30,.025,.025);
        // A luminous wire model reads as a projected fish rather than a solid icon.
        for(let rib=0;rib<10;rib++){
          const u=(rib-4.5)/5,r=.23*Math.sqrt(1-u*u);
          const g=new THREE.TorusGeometry(r,.006,3,16);g.scale(.24,1,1);push(g,m,x+u*.40,1.84,.54,0,Math.PI/2);
        }
        for(const dy of [-.10,0,.10])rod(m,[x-.36,1.84+dy*.65,.54],[x+.34,1.84+dy*.65,.54],.007);
        rod(m,[x-.36,1.84,.54],[x-.61,2.00,.54],.01);rod(m,[x-.61,2.00,.54],[x-.61,1.68,.54],.01);rod(m,[x-.61,1.68,.54],[x-.36,1.84,.54],.01);
        rod(m,[x-.12,2.04,.54],[x+.02,2.20,.54],.008);rod(m,[x+.02,2.20,.54],[x+.19,2.03,.54],.008);
        ring(m,x+.27,1.90,.59,.035,.009);
        box(glass,x,1.82,.61,1.30,1.18,.012);
      }
    }else if(s.type==='myco'){
      raisedShelf(1.77,-.42,w-.45,.70);
      for(let row=0;row<2;row++)for(let n=0;n<4;n++){
        const x=(n-1.5)*1.02,y=row?1.87:1.205,z=row?-.42:front-.18;crate(x,y,z,.92,.20,.65);
        for(let q=0;q<6;q++)mushroom(x+((q%3)-1)*.21,y+.05,z+(Math.floor(q/3)-.5)*.24,n%2?glowcap:violet,.16+(q%3)*.055);
      }
    }else if(s.type==='spice'){
      for(let row=0;row<3;row++)for(let n=0;n<13;n++)bottle((n-6)*.34,1.12+row*.48,row?back+.36:front-.23,[gold,orange,cyan,green][(n+row)%4],.27+(n%3)*.08,.075);
      for(let n=0;n<3;n++){bottle(-1.6+n*.43,1.12,front+.10,n%2?cyan:gold,.60,.15);}
    }else if(s.type==='fabric'){
      for(let stack=0;stack<3;stack++)for(let layer=0;layer<3;layer++){
        box(layer%2?rose:blue,-1.65+stack*.68,1.14+layer*.045,front-.25,.55,.04,.43,0,.035*(stack-1));
        box(cyan,-1.65+stack*.68,1.165+layer*.045,front-.22,.43,.004,.012,0,.035*(stack-1));
      }
      for(let row=0;row<3;row++)for(let n=0;n<4;n++){
        const x=-.8+n*.49,y=1.35+row*.46; cyl(n%2?blue:rose,x,y,back+.35,.15,.28,Math.PI/2);ring(wood,x,y,back+.50,.13,.024);
      }
      rod(edges,[-2.25,2.55,.25],[-1.15,2.55,.25],.03);
      for(let n=0;n<3;n++){
        const x=-2.08+n*.34,m=n%2?rose:blue;rod(counter,[x,2.55,.25],[x,2.35,.25],.01);box(m,x,1.98,.25,.28,.70,.12);
        rod(m,[x-.12,2.25,.25],[x-.25,1.85,.27],.065);rod(m,[x+.12,2.25,.25],[x+.25,1.85,.27],.065);
      }
      for(const x of [1.1,2.12])box(steel,x,1.47,.40,.12,.75,1.0);
      for(const y of [1.22,1.70])cyl(counter,1.61,y,.75,.10,1.13,0,Math.PI/2);
      const cloth=new THREE.PlaneGeometry(.93,1.14,10,16),p=cloth.getAttribute('position');
      for(let j=0;j<p.count;j++){const t=(p.getY(j)+.57)/1.14;p.setXYZ(j,p.getX(j),1.73-t*.72,.38+t*.77+.06*Math.sin(t*Math.PI));}cloth.computeVertexNormals();push(cloth,blue,1.61,0,0);
      for(let n=0;n<12;n++)rod(n%2?cyan:pink,[1.17+n*.08,1.74,.37],[1.17+n*.08,1.10,1.27],.005);
    }else if(s.type==='memory'){
      box(steel,0,1.12,.13,2.45,.03,.46);
      box(steel,-1.89,1.79,.24,.96,1.37,.08);box(steel,1.75,1.85,.24,.62,1.49,.10);
      for(let n=0;n<5;n++){
        const x=(n-2)*.50,m=n%2?cyan:pink;cyl(black,x,1.20,.13,.16,.13);cyl(m,x,1.82,.13,.10,1.04);cyl(counter,x,2.39,.13,.16,.09);
        ring(edges,x,1.26,.13,.15,.022,Math.PI/2);cable([x-.05,2.34,.13],[x+.05,1.33,.13],.12);
      }
      for(let n=0;n<8;n++){
        const x=-2.12+(n%2)*.46,y=1.24+Math.floor(n/2)*.32;box(steel,x,y,.30,.31,.24,.065);box(black,x,y,.35,.20,.16,.025);
        for(let pin=0;pin<5;pin++){box(counter,x-.13+pin*.065,y+.14,.32,.025,.06,.03);box(counter,x-.13+pin*.065,y-.14,.32,.025,.06,.03);}
      }
      for(let n=0;n<3;n++)ring(cyan,1.75,1.4+n*.40,.34,.15,.03);
      for(let n=0;n<7;n++){const x=-1.7+n*.48;box(steel,x,1.14,front-.26,.35,.065,.29,0,n*.13);box(black,x,1.185,front-.26,.23,.026,.18,0,n*.13);}
    }else if(s.type==='vinyl'){
      box(steel,0,1.1725,.15,2.50,.135,.78);
      for(const x of [-.65,.65]){
        box(wood,x,1.70,.15,1.05,.92,.74);box(black,x,1.70,.54,.91,.74,.06);box(cyan,x-.05,1.70,.58,.72,.57,.015);
        for(let n=0;n<5;n++)box(black,x-.06,1.49+n*.09,.594,.58-(n%2)*.17,.025,.008);
        cyl(counter,x+.39,1.86,.59,.06,.05,Math.PI/2);rod(edges,[x,2.16,.03],[x-.22,2.51,-.08],.012);
      }
      for(const x of [-1.88,1.88]){
        crate(x,1.29,front-.12,1.02,.42,.72);
        for(let n=0;n<9;n++){box(n%3?steel:rose,x,1.52,front-.36+n*.06,.83,.62,.027,-.13);ring(black,x,1.52,front-.34+n*.06,.20,.06,-.13);}
      }
    }else if(s.type==='fruit'){
      raisedShelf(1.475,-.35,w-.5,.80);
      for(let row=0;row<2;row++)for(let n=0;n<5;n++){
        const x=(n-2)*1.04,y=1.225+row*.37,z=row?-.35:front-.16;crate(x,y,z,.94,.24,.75);
        for(let q=0;q<9;q++){const m=[orange,green,rose,violet,orange][n];sphere(m,x+((q%3)-1)*.23,y+.17+(q%2)*.05,z+(Math.floor(q/3)-1)*.19,.13,1,n===0?1.25:1,1);}
      }
      for(let n=0;n<5;n++)lantern((n-2)*1.08,2.45,front-.12,n%2?cyan:pink);
    }else{
      for(let n=0;n<6;n++){
        const x=(n-2.5)*.80;rod(black,[x,2.80,.05],[x,2.52,.05],.012);
        if(n%2)head(x,2.19,.05,.27);else arm(x,2.50,.05,.63);
      }
      sphere(steel,0,1.29,front-.18,.35,1.8,.55,.75);ring(cyan,0,1.45,front-.18,.17,.04,Math.PI/2);
      for(let n=0;n<4;n++)box(counter,(n-1.5)*.21,1.37,front-.32,.14,.08,.46,0,0,(n-1.5)*.13);
      for(const x of [-.77,.77]){sphere(edges,x,1.28,front-.18,.14);rod(counter,[x,1.28,front-.18],[x*1.55,1.18,front+.03],.08);}
      for(let n=0;n<4;n++){cyl(counter,1.55+n*.19,1.30,back+.70,.07,.38);box(blue,1.55+n*.19,1.30,back+.78,.08,.16,.01);}
      for(let n=0;n<4;n++){const x=-1.8+n*.45;rod(edges,[x,1.12,front-.37],[x+.20,1.12,front-.08],.018);box(rose,x+.22,1.12,front-.04,.08,.045,.15,0,-.6);}
      for(let n=0;n<9;n++){box(counter,-2.1+(n%3)*.32,1.16+Math.floor(n/3)*.035,front-.13+(n%2)*.18,.26,.04,.22);}
      arm(1.22,1.6,front-.40,.43);rod(edges,[1.98,1.15,.35],[2.13,2.0,.20],.03);rod(edges,[2.13,2.0,.20],[1.71,2.22,.40],.03);cyl(cyan,1.71,2.18,.4,.22,.08);
    }
    // Small stock cartons and an attendant behind the counter establish usable scale.
    crate(-w*.34,.43,back+.60,.65,.40,.60);box(steel,w*.33,.48,back+.58,.62,.50,.55);
    const vendorZ=back+.40;
    sphere(wood,-w*.22,1.93,vendorZ,.125);box(black,-w*.22,1.52,vendorZ,.34,.56,.25);
    rod(black,[-w*.22-.14,1.73,vendorZ],[-w*.22-.29,1.25,vendorZ+.5],.055);
    rod(black,[-w*.22+.14,1.73,vendorZ],[-w*.22+.29,1.25,vendorZ+.5],.055);
  });
  for(const [material,parts] of batches){
    const geometry=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(geometry,material);
    mesh.name=material===snowMat?'Market awnings · 28mm snow caps':'Market stalls · '+material.name;mesh.receiveShadow=true;mesh.castShadow=false;(material===snowMat?snow:group).add(mesh);
  }
  let disposed=false;
  const ready=Promise.all(loads).then(()=>undefined);
  const snapshot=()=>({count:CITY_MARKET_STALLS.length,stalls:CITY_MARKET_STALLS,footprints:cityMarketFootprints(),partCount,drawCalls:batches.size,triangles:[...group.children,...snow.children].reduce((n,o)=>n+(o instanceof THREE.Mesh?o.geometry.getAttribute('position').count/3:0),0),snowVisible:snow.visible,referenceUse:'Recessed merchandise panels behind dimensional shelves, counters and products'});
  return {group,ready,snapshot,setWeather:(mode:OsCityWeather)=>{snow.visible=mode==='snow';},dispose:()=>{if(disposed)return;disposed=true;group.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
