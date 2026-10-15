import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { getCityWeatherPreset, type CityTimeOfDay, type OsCityWeather } from './osCityWeather';
import { createCityNeonAtmosphere } from './osCityNeonAtmosphere';
import { createCityDistantNeon } from './osCityDistantNeon';
import { createCityWindowTv } from './osCityWindowTv';
import { createOsCitySkylineDetail } from './osCitySkylineDetail';
import { createOsCityBackdrop } from './osCityBackdrop';
import { insideCityBalcony } from './osCityLayout';
import { createOsCityBalconyWeather } from './osCityBalconyWeather';
import { createOsCityPlazaLife } from './osCityPlazaLife';
import { CITY_PLAZA_SCALE, CITY_CIRCUIT_COLORS, plazaX, plazaZ } from './osCityPlazaLayout';
import { createOsCityTransitRoute, CITY_TRANSIT_ELEVATION_LIFT } from './osCityTransit';
import { applyCityTransitDistanceFade, CITY_TRANSIT_FADE_START, CITY_TRANSIT_FADE_END } from './osCityTransitDistance';
import { createOsCityMall } from './osCityMall';
import { createOsCityMarketStalls, cityMarketFootprints } from './osCityMarketStalls';
import { createOsCityOuterMarketLights } from './osCityOuterMarketLights';
import { createCityHolograms } from './osCityPlazaHolograms';

/** Dimensional circuit market with upright buildings and one physically connected transit circuit. */
export function createOsCityBalconyDistrict(): THREE.Group {
  const district = new THREE.Group();
  district.name = 'Balcony · rain-soaked Circuit Market and layered east skyline';
  const snowGroup=new THREE.Group();snowGroup.name='Circuit Market · snow on exposed roof surfaces';snowGroup.visible=false;district.add(snowGroup);
  const snowCaps:{name:string;x:number;z:number;supportY:number;width:number;depth:number;rotation:number;thickness:number}[]=[];
  const groundY = -14;
  const pedestrianObstacles:{x:number;z:number;halfWidth:number;halfDepth:number}[]=[];
  const reserveFootprint=(x:number,z:number,width:number,depth:number)=>pedestrianObstacles.push({x,z,halfWidth:width/2,halfDepth:depth/2});
  // The neighboring street's raised podium overlaps the northwest market edge.
  reserveFootprint(18,-29.7,20,28);
  let referenceTexture!:THREE.Texture;
  const referenceReady=new Promise<void>((resolve,reject)=>{
    referenceTexture=new THREE.TextureLoader().load('/apartments/assets/north-city/balcony-city-reference.jpg',()=>resolve(),undefined,()=>reject(new Error('Balcony reference materials did not load')));
  });
  referenceTexture.colorSpace=THREE.SRGBColorSpace;referenceTexture.anisotropy=8;
  let seed = 17031984;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const vector = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  let signCount = 0, towerCount = 0, circuitCount = 0;
  const neonAtmosphere=createCityNeonAtmosphere('Balcony circuit market');
  const distantNeon=createCityDistantNeon(neonAtmosphere,'Distant Circuit Market',48);
  const skylineDetails=createOsCitySkylineDetail(neonAtmosphere,distantNeon,'Circuit Market skyline');district.add(skylineDetails.group);
  const tvWindows=createCityWindowTv('Distant Circuit Market windows');
  const backdrop=createOsCityBackdrop(neonAtmosphere,distantNeon,tvWindows,skylineDetails.displayMaterial);district.add(backdrop.group);
  district.userData.ready=Promise.all([referenceReady,backdrop.ready]).then(()=>undefined);
  district.userData.setWindowSettings = tvWindows.setSettings;
  district.userData.getWindowSettings = tvWindows.getSettings;
  const distanceFog = {
    strength: { value: .21 },
    tint: { value: new THREE.Color().setRGB(.037, .079, .109) },
    tintMix: { value: .70 },
  };

  function atmosphere<T extends THREE.Material>(material: T): T {
    // All ordinary surfaces use the room's unmodified atmospheric extinction.
    // Only specifically registered light emitters receive the shared neon path.
    return material;
  }
  function material(color: string, roughness = .6, metalness = .3, emissiveIntensity = .32) {
    return atmosphere(new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive: color, emissiveIntensity }));
  }
  const gunmetal = material('#283c49', .43, .7), edge = material('#101d29', .48, .58);
  const concrete = material('#43525c', .78, .10), roof = material('#25333e', .76, .2);
  const silver = material('#8393a0', .28, .8), drain = material('#09151e', .69, .65);
  const glazing = material('#264959', .23, .38, .40), cyan = material('#78e6ff', .3, .14, 3.2);
  const blue = material('#299af7', .32, .2, 2.9), amber = material('#f1cd8c', .38, .1, 1.8);
  const pink = material('#f176c7', .38, .1, 2.3), warmGlass = material('#d0ba96', .25, .3, .95);
  const circuitMaterials = CITY_CIRCUIT_COLORS.map((color,index) => {
    const mat = material(color,.32,.14,2.6);
    mat.name = `Circuit Market · ${index<2?'neon blue':'neon pink'} circuitry ${index}`;
    return neonAtmosphere.register(mat,'neon',mat.name);
  });
  for(const [mat,name] of [[cyan,'Cyan signs and circuit cores'],[blue,'Blue circuits and orbital rail ribbon'],[pink,'Magenta business lights'],[amber,'Amber fixture cores']] as const)neonAtmosphere.register(mat,'neon',name);
  neonAtmosphere.register(warmGlass,'window','Warm shop and kiosk glazing');
  const blackClothes = material('#0d1b26', .94, .02), greyClothes = material('#2c414c', .91, .03);
  const snowSurface=atmosphere(new THREE.MeshStandardMaterial({color:'#dce5eb',roughness:.96,metalness:0}));
  function snowCap(name:string,x:number,supportY:number,z:number,width:number,depth:number,rotation=0){
    const thickness=.03;
    // Every lower face rests on a real exposed roof or equipment top. These
    // exterior caps never extend onto the sheltered apartment terrace.
    box(snowSurface,x,supportY+thickness/2,z,width,thickness,depth,rotation);
    snowCaps.push({name,x,z,supportY,width,depth,rotation,thickness});
  }

  function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, color = true) {
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    draw(canvas.getContext('2d')!);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.anisotropy = 8; return texture;
  }
  const claddingTexture=canvasTexture(512,512,c=>{
    c.fillStyle='#a2a7ab';c.fillRect(0,0,512,512);
    for(let n=0;n<21000;n++){const grey=55+random()*150;c.fillStyle=`rgba(${grey},${grey},${grey},${.035+random()*.075})`;c.fillRect(random()*512,random()*512,1+random()*2,1+random()*3);}
    for(let y=0;y<512;y+=64){c.fillStyle='#3f535b70';c.fillRect(0,y,512,2);for(let x=(y%128?32:0);x<512;x+=128){c.fillRect(x,y,2,64);c.fillStyle='#1b32382b';c.fillRect(x+2,y+2,2+random()*5,22+random()*100);c.fillStyle='#3f535b70';}}
    for(let n=0;n<75;n++){const x=random()*512,y=random()*512,g=c.createLinearGradient(x,y,x,y+110);g.addColorStop(0,'#1429323b');g.addColorStop(1,'#14293200');c.fillStyle=g;c.fillRect(x,y,2+random()*8,110);}
    c.fillStyle='#d2d9d922';for(let n=0;n<90;n++)c.fillRect(random()*512,random()*512,3+random()*8,1);
  });
  concrete.map=claddingTexture;concrete.bumpMap=claddingTexture;concrete.bumpScale=.02;
  roof.map=claddingTexture;roof.bumpMap=claddingTexture;roof.bumpScale=.012;
  const storeGlass=atmosphere(new THREE.MeshPhysicalMaterial({color:'#8ab9cb',roughness:.14,metalness:.16,transparent:true,opacity:.16,depthWrite:false,clearcoat:1,side:THREE.DoubleSide}));
  storeGlass.envMapIntensity=.12;
  const storeInterior=atmosphere(new THREE.MeshStandardMaterial({map:referenceTexture,emissiveMap:referenceTexture,color:'#94a5af',emissive:'#c3dbe6',emissiveIntensity:.70,roughness:.62,metalness:.05}));
  neonAtmosphere.register(storeInterior,'window','Recessed illuminated shop interiors');
  const interiorQuads=[
    [[210,410],[517,365],[218,499],[526,445]],
    [[1284,307],[1708,361],[1289,422],[1710,492]],
    [[1778,429],[1994,475],[1778,509],[1994,579]],
  ];
  function interiorPhoto(tile:number,x:number,y:number,z:number,w:number,h:number,rotation:number){
    const [tl,tr,bl,br]=interiorQuads[tile===2?1:tile===0||tile===6?0:2];
    const geo=new THREE.PlaneGeometry(w,h,12,4),uv=geo.getAttribute('uv');
    for(let i=0;i<uv.count;i++){
      const u=uv.getX(i),v=uv.getY(i),topX=tl[0]+(tr[0]-tl[0])*u,topY=tl[1]+(tr[1]-tl[1])*u,bottomX=bl[0]+(br[0]-bl[0])*u,bottomY=bl[1]+(br[1]-bl[1])*u;
      uv.setXY(i,(bottomX+(topX-bottomX)*v)/2048,1-(bottomY+(topY-bottomY)*v)/878);
    }
    push(geo,storeInterior,x,y,z,rotation);
  }
  let expandCircuitGeometry = false;
  function push(geometry: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, rotation = 0) {
    if (geometry.index) { const indexed = geometry; geometry = geometry.toNonIndexed(); indexed.dispose(); }
    if (rotation) geometry.rotateY(rotation); geometry.translate(x, y, z);
    if (expandCircuitGeometry) {
      geometry.scale(CITY_PLAZA_SCALE,1,CITY_PLAZA_SCALE);
      geometry.translate(8*(1-CITY_PLAZA_SCALE),0,-5*(1-CITY_PLAZA_SCALE));
    }
    const bucket = batches.get(mat) ?? []; bucket.push(geometry); batches.set(mat, bucket);
  }
  function box(mat: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, rotation = 0) {
    push(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rotation);
  }
  function cylinder(mat: THREE.Material, x: number, y: number, z: number, radius: number, height: number, segments = 10) {
    push(new THREE.CylinderGeometry(radius, radius, height, segments), mat, x, y, z);
  }
  function line(mat: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, width: number) {
    const geometry = new THREE.CylinderGeometry(width, width, a.distanceTo(b), 5);
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(vector(0, 1, 0), b.clone().sub(a).normalize()));
    push(geometry, mat, (a.x+b.x)/2, (a.y+b.y)/2, (a.z+b.z)/2);
  }
  function strip(mat: THREE.Material, points: number[][], width: number, elevation = groundY + .045) {
    for (let i = 1; i < points.length; i++) {
      const [ax, az] = points[i-1], [bx, bz] = points[i];
      box(mat, (ax+bx)/2, elevation, (az+bz)/2, width, .018, Math.hypot(bx-ax,bz-az), Math.atan2(bx-ax,bz-az));
    }
  }

  // Fine concrete aggregate and quiet slab joints, without oversized puddle shapes.
  const pavementMap = canvasTexture(1024,1024,c => {
    c.fillStyle='#516472';c.fillRect(0,0,1024,1024);
    for(let n=0;n<70000;n++){const l=50+random()*150;c.fillStyle=`rgba(${l},${l},${l},${.02+random()*.14})`;c.fillRect(random()*1024,random()*1024,1+random()*2,1+random()*3);}
    for(let row=0;row<16;row++)for(let col=0;col<12;col++){
      const x=(col+(row%2)*.5)*90,y=row*67;c.strokeStyle='#26343c30';c.lineWidth=1;c.strokeRect(x,y,90,67);
      c.fillStyle=`rgba(7,23,34,${random()*.035})`;c.fillRect(x+2,y+2,86,63);
    }
    // Preserve the district's seeded random sequence while reducing this detail
    // to sub-centimetre grain instead of large, leaf-shaped albedo patches.
    for(let n=0;n<95;n++){const x=random()*1024,y=random()*1024,w=.6+random(),h=.6+random();random();c.fillStyle='#26343c12';c.fillRect(x,y,w,h);}
  });
  pavementMap.wrapS=pavementMap.wrapT=THREE.RepeatWrapping;pavementMap.repeat.set(3,3);
  const roughnessMap=canvasTexture(512,512,c=>{
    c.fillStyle='#dadada';c.fillRect(0,0,512,512);
    for(let n=0;n<120;n++){const x=random()*512,y=random()*512,w=.6+random(),h=.6+random();random();c.fillStyle=n%3?'#d3d3d3':'#e1e1e1';c.fillRect(x,y,w,h);}
  },false);roughnessMap.wrapS=roughnessMap.wrapT=THREE.RepeatWrapping;roughnessMap.repeat.set(7,7);
  const pavement=atmosphere(new THREE.MeshPhysicalMaterial({color:'#6a7277',map:pavementMap,roughnessMap,bumpMap:pavementMap,bumpScale:.006,roughness:.42,metalness:.04,clearcoat:.65,clearcoatRoughness:.22,emissive:'#26343c',emissiveIntensity:.08}));
  pavement.name='Circuit Market · fine-grain concrete paving';
  pavement.envMapIntensity=.05;
  box(pavement,plazaX(47.5),groundY-.17,-5,79*CITY_PLAZA_SCALE,.30,88*CITY_PLAZA_SCALE);
  box(concrete,plazaX(47.5),groundY-.44,-5,79*CITY_PLAZA_SCALE,.25,90*CITY_PLAZA_SCALE);
  const wetReflection=new Reflector(new THREE.PlaneGeometry(64*CITY_PLAZA_SCALE,59*CITY_PLAZA_SCALE),{color:0x69899b,textureWidth:512,textureHeight:512,clipBias:.005,multisample:0});
  wetReflection.name='Circuit Market · uneven wet-pavement planar reflections';wetReflection.rotation.x=-Math.PI/2;wetReflection.position.set(plazaX(40),groundY+.014,-5);
  wetReflection.camera.layers.enable(1);
  // Do not render an unseen plaza through the bedroom walls or during the
  // interior environment probe. The mirrored camera is below the plaza.
  const renderWetReflection=wetReflection.onBeforeRender.bind(wetReflection);
  wetReflection.onBeforeRender=(renderer,scene,camera,geometry,mat,group)=>{
    if(camera.position.y<groundY+1||!insideCityBalcony(camera.position.x,camera.position.z))return;
    renderWetReflection(renderer,scene,camera,geometry,mat,group);
  };
  const wetShader=wetReflection.material as THREE.ShaderMaterial;
  wetShader.transparent=true;wetShader.depthWrite=false;
  wetShader.uniforms.surfaceRoughness={value:roughnessMap};wetShader.uniforms.wetness={value:1};
  wetShader.vertexShader=wetShader.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec2 plazaUv;').replace('vUv = textureMatrix','plazaUv = uv; vUv = textureMatrix');
  wetShader.fragmentShader=wetShader.fragmentShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec2 plazaUv; uniform sampler2D surfaceRoughness; uniform float wetness;').replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec2 projectedUv=vUv.xy/vUv.w;
    float ripple=texture2D(surfaceRoughness,plazaUv*19.0).r;
    vec2 wobble=vec2(sin(plazaUv.y*2100.0),cos(plazaUv.x*1700.0))*.0006;
    vec4 base=texture2D(tDiffuse,projectedUv+wobble)*.36;
    base+=texture2D(tDiffuse,projectedUv+vec2(.0022,.0007))*.16;
    base+=texture2D(tDiffuse,projectedUv-vec2(.0022,.0007))*.16;
    base+=texture2D(tDiffuse,projectedUv+vec2(.0044,.0014))*.16;
    base+=texture2D(tDiffuse,projectedUv-vec2(.0044,.0014))*.16;`).replace('vec4( blendOverlay( base.rgb, color ), 1.0 )','vec4( blendOverlay( base.rgb, color ), wetness*(.10+.24*(1.0-ripple)) )');
  district.add(wetReflection);
  // Delimit the whole square behind the four shops, including their rear walls.
  // Keep both channels inside the paving and their grilles within the same span.
  const plazaBoundary={minX:plazaX(9),maxX:plazaX(70),northZ:plazaZ(-48),southZ:plazaZ(38)};
  for(const z of [plazaBoundary.northZ,plazaBoundary.southZ]){
    box(gunmetal,(plazaBoundary.minX+plazaBoundary.maxX)/2,groundY+.055,z,plazaBoundary.maxX-plazaBoundary.minX,.10,.3);
    for(let x=plazaBoundary.minX+.8;x<=plazaBoundary.maxX-.8;x+=2.2*CITY_PLAZA_SCALE)box(drain,x,groundY+.115,z,1.55,.03,.34);
  }

  // The chip plaza is deliberately legible from eight floors up: parallel tracks
  // bend at 45 degrees, with vias and exclusively neon blue/pink circuits.
  const centerX=34,centerZ=-5;
  const circuitGlows=CITY_CIRCUIT_COLORS.map(color=>neonAtmosphere.register(atmosphere(new THREE.MeshBasicMaterial({color,transparent:true,opacity:.065,depthWrite:false,blending:THREE.AdditiveBlending})),'neon','Circuit pavement halo'));
  const movingCircuitTraces:number[][][]=[];
  const movingCircuitColors:string[]=[];
  const movingTrace=(points:number[][],colorIndex:number)=>{
    movingCircuitTraces.push(points.map(([x,y,z])=>[plazaX(x),y,plazaZ(z)]));
    movingCircuitColors.push(CITY_CIRCUIT_COLORS[colorIndex]);
  };
  expandCircuitGeometry=true;
  for(let quadrant=0;quadrant<4;quadrant++)for(let lane=0;lane<13;lane++){
    const angle=quadrant*Math.PI/2,dx=Math.cos(angle),dz=Math.sin(angle),px=-dz,pz=dx;
    const side=-3.9+lane*.61,extent=15+(lane%4)*2.05;
    const local=[[5.1,side],[9+lane*.25,side],[13+lane*.25,side+Math.sign(side||1)*4],[extent+9,side+Math.sign(side||1)*4]];
    const path=local.map(([along,across])=>[centerX+dx*along+px*across,centerZ+dz*along+pz*across]);
    // Leave the near edge clear for the balcony's façade and keep circuits in the plaza.
    const clipped=path.map(([x,z])=>[Math.max(9.0,Math.min(58,x)),Math.max(-27,Math.min(18,z))]);
    const colorIndex=lane%4;
    movingTrace(clipped.map(([x,z])=>[x,groundY+.092,z]),colorIndex);
    strip(circuitGlows[colorIndex],clipped,.78,groundY+.027);strip(gunmetal,clipped,.27,groundY+.035);strip(circuitMaterials[colorIndex],clipped,.090,groundY+.061);
    const last=clipped[clipped.length-1];const ring=new THREE.TorusGeometry(.22,.028,4,16);ring.rotateX(Math.PI/2);push(ring,circuitMaterials[colorIndex],last[0],groundY+.066,last[1]);
    circuitCount++;
  }
  // Each processor carries the same blue/pink palette down to its fine contacts.
  function processor(x:number,z:number,size:number){
    reserveFootprint(plazaX(x),plazaZ(z),(size+.4)*CITY_PLAZA_SCALE,(size+.4)*CITY_PLAZA_SCALE);
    box(edge,x,groundY+.23,z,size,.42,size);box(gunmetal,x,groundY+.49,z,size-.35,.13,size-.35);
    box(glazing,x,groundY+.58,z,size-.8,.06,size-.8);
    const ring=new THREE.EdgesGeometry(new THREE.BoxGeometry(size-1,.07,size-1));
    const lines=new THREE.LineSegments(ring,new THREE.LineBasicMaterial({color:CITY_CIRCUIT_COLORS[1],toneMapped:false}));lines.position.set(plazaX(x),groundY+.63,plazaZ(z));lines.scale.set(CITY_PLAZA_SCALE,1,CITY_PLAZA_SCALE);district.add(lines);
    for(let side=0;side<4;side++)for(let pin=0;pin<Math.floor(size/.35);pin++){
      const a=side*Math.PI/2,offset=-size*.44+pin*.34;
      const px=x+Math.cos(a)*(size*.5+.12)-Math.sin(a)*offset,pz=z+Math.sin(a)*(size*.5+.12)+Math.cos(a)*offset;
      box(circuitMaterials[pin%4],px,groundY+.35,pz,.27,.07,.10,-a);
    }
    for(let n=0;n<5;n++){
      const s=size*.20+n*.14;
      strip(circuitMaterials[n%4],[[x-s,z-s],[x+s,z-s],[x+s,z+s],[x-s,z+s],[x-s,z-s]],.05,groundY+.63);
      movingTrace([[x-s,z-s],[x+s,z-s],[x+s,z+s],[x-s,z+s],[x-s,z-s]].map(([px,pz])=>[px,groundY+.665,pz]),n%4);
    }
    for(let n=0;n<10;n++)strip(circuitMaterials[n%4],[[x-size*.33,z-size*.32+n*size*.065],[x-size*.16,z-size*.32+n*size*.065],[x-size*.10,z-size*.26+n*size*.065]],.024,groundY+.64);
  }
  processor(centerX,centerZ,8.1);processor(18,-19,4.2);processor(49,12,4.9);processor(50,-22,3.6);processor(18,12,3.8);
  const holograms=createCityHolograms(vector(plazaX(centerX),groundY+.69,plazaZ(centerZ)));
  district.add(holograms.group);district.userData.plazaHolograms=holograms.controls;
  district.userData.setHoliday=(holiday:string)=>holograms.setHalloween(holiday==='halloween');
  district.userData.ready=Promise.all([district.userData.ready,holograms.ready]).then(()=>undefined);
  for(let n=0;n<32;n++){
    const x=14+random()*42,z=-25+random()*41;
    if(Math.hypot(x-centerX,z-centerZ)<7)continue;
    const r=.12+random()*.23,ring=new THREE.TorusGeometry(r,.022,4,14);ring.rotateX(Math.PI/2);push(ring,circuitMaterials[n%4],x,groundY+.055,z);
    strip(circuitMaterials[n%4],[[x,z],[x+1.4,z],[x+2.3,z+.9],[x+3.9,z+.9]],.043,groundY+.053);
  }
  expandCircuitGeometry=false;

  // One detailed eight-panel atlas keeps every large business sign in one draw call.
  const signs=[
    ['ripperdoc','CIRCUIT CLINIC','CYBERWARE · IMPLANTS · REPAIR · 24HR EMERGENCY'],
    ['NEON LOOP CLUB','DJ // CIRCUIT BREAKER','TONIGHT 22:00    ·    LIVE + SYNTHWAVE'],
    ['DATA MALL','SERVERS · CLOUD STORAGE','TECH · DATA · 24/7'],
    ['CIRCUIT DIVE','BAR · LOUNGE · LIVE MUSIC','OPEN ALL NIGHT'],
    ['KIBO TECH','DATA SAFE','CLOUD SOLUTIONS'],
    ['FLEET DR@VER','FLEET DRONE DELIVERY','CITYWIDE / 24HR'],
    ['NEURALWARE','UPGRADE NOW','LEVEL 8 / WALK-INS WELCOME'],
    ['NOW OPEN','NIGHT MARKET / 08','FOOD · SOUND · REPAIR']
  ];
  const signAtlas=canvasTexture(2048,1024,c=>{
    signs.forEach(([title,subtitle,footer],n)=>{
      const x=(n%2)*1024,y=Math.floor(n/2)*256,ink=['#7fecff','#7fecff','#7fecff','#7fecff','#bca2ff','#79e5c3','#ffc582','#ee91cc'][n];
      c.fillStyle='#091c2a';c.fillRect(x,y,1024,256);c.fillStyle='#152f3e';c.fillRect(x+9,y+9,1006,238);
      const gradient=c.createLinearGradient(x,y,x,y+256);gradient.addColorStop(0,'#34586940');gradient.addColorStop(1,'#09131e20');c.fillStyle=gradient;c.fillRect(x+12,y+12,1000,232);
      c.strokeStyle='#477286';c.lineWidth=3;c.strokeRect(x+18,y+18,988,220);
      c.strokeStyle=ink;c.lineWidth=2;c.beginPath();c.moveTo(x+32,y+37);c.lineTo(x+32,y+219);c.lineTo(x+106,y+219);c.moveTo(x+992,y+37);c.lineTo(x+992,y+219);c.lineTo(x+915,y+219);c.stroke();
      c.textAlign='center';c.textBaseline='middle';c.fillStyle=ink;c.shadowBlur=0;
      c.font=`700 ${title.length>14?62:title.length>11?72:88}px Arial`;c.fillText(title,x+512,y+83,900);c.shadowBlur=0;
      c.font=`600 ${subtitle.length>23?29:39}px Arial`;c.fillText(subtitle,x+512,y+154,906);
      c.font='500 21px Arial';c.fillStyle='#bde2e9';c.fillText(footer,x+512,y+209,895);
      // Tiny scan-lines temper the billboard surfaces; luminous lettering stays sharp.
      c.fillStyle='#000b171c';for(let scan=0;scan<256;scan+=4)c.fillRect(x,y+scan,1024,1);
    });
  });
  const signEmission=canvasTexture(2048,1024,c=>{
    c.drawImage(signAtlas.image as HTMLCanvasElement,0,0);const data=c.getImageData(0,0,2048,1024);
    for(let p=0;p<data.data.length;p+=4)if(Math.max(data.data[p],data.data[p+1],data.data[p+2])<110)data.data[p]=data.data[p+1]=data.data[p+2]=0;c.putImageData(data,0,0);
  });
  const signMaterial=atmosphere(new THREE.MeshStandardMaterial({map:signAtlas,emissiveMap:signEmission,emissive:'#ffffff',emissiveIntensity:2.25,roughness:.48,metalness:.18}));
  neonAtmosphere.register(signMaterial,'neon','Masked business sign lettering and borders');
  const mallDirectory=[['DATA // EXCHANGE','TRADING FLOOR'],['COMPONENTS','BUILD · UPGRADE'],['CLOUD / 24','SECURE STORAGE'],['NEURAL LAB','INTERFACES'],['SIM STUDIO','IMMERSIVE WORLDS'],['DEVICE CARE','REPAIR · RECYCLE'],['SERVER VAULT','COMPUTE · HOSTING'],['FOOD // LEVEL 01','OPEN ALL NIGHT']];
  const mallDirectoryMap=canvasTexture(2048,1024,c=>{
    mallDirectory.forEach(([title,subtitle],index)=>{
      const x=index%2*1024,y=Math.floor(index/2)*256,ink=['#75e9ff','#9ef5cd','#b8a6ff','#ffbd9b'][index%4];
      c.fillStyle='#0a1e2b';c.fillRect(x,y,1024,256);c.strokeStyle=ink;c.lineWidth=4;c.strokeRect(x+20,y+20,984,216);
      c.textAlign='center';c.textBaseline='middle';c.fillStyle=ink;c.font='700 68px Arial';c.fillText(title,x+512,y+95,920);
      c.font='500 33px Arial';c.fillText(subtitle,x+512,y+176,910);
    });
  });
  const mallDirectoryEmission=canvasTexture(2048,1024,c=>{
    c.drawImage(mallDirectoryMap.image as HTMLCanvasElement,0,0);const data=c.getImageData(0,0,2048,1024);
    for(let p=0;p<data.data.length;p+=4)if(Math.max(data.data[p],data.data[p+1],data.data[p+2])<110)data.data[p]=data.data[p+1]=data.data[p+2]=0;c.putImageData(data,0,0);
  });
  const mallDirectoryMaterial=neonAtmosphere.register(new THREE.MeshStandardMaterial({map:mallDirectoryMap,emissiveMap:mallDirectoryEmission,emissive:'#ffffff',emissiveIntensity:1.6,roughness:.45,metalness:.15}),'neon','Data Mall interior and department boards');
  function sign(tile:number,x:number,y:number,z:number,width:number,height:number,rotation:number,luminousMaterial:THREE.MeshStandardMaterial=signMaterial){
    signCount++;box(edge,x,y,z,width+.26,height+.26,.24,rotation);
    const geo=new THREE.PlaneGeometry(width,height),uv=geo.getAttribute('uv'),column=tile%2,row=Math.floor(tile/2);
    for(let i=0;i<uv.count;i++)uv.setXY(i,(column+.003+uv.getX(i)*.994)/2,1-(row+.996-uv.getY(i)*.992)/4);
    push(geo,luminousMaterial,x+Math.sin(rotation)*.131,y,z+Math.cos(rotation)*.131,rotation);
    for(const side of [-1,1]){
      const offset=side*(width/2+.11);
      box(silver,x+Math.cos(rotation)*offset,y,z-Math.sin(rotation)*offset,.075,height+.23,.29,rotation);
    }
  }

  // Recessed shop interiors: actual ceiling strips, mullions, server cages and counters.
  function retail(x:number,z:number,width:number,depth:number,height:number,rotation:number,tile:number){
    reserveFootprint(x,z,width+.5,depth+2.6);
    const c=Math.cos(rotation),s=Math.sin(rotation);
    const world=(u:number,y:number,v:number)=>[x+c*u+s*v,y,z-s*u+c*v];
    const localBox=(mat:THREE.Material,u:number,y:number,v:number,w:number,h:number,d:number)=>{const p=world(u,y,v);box(mat,p[0],p[1],p[2],w,h,d,rotation);};
    const wall=material(tile===2?'#657078':tile===1?'#3b5060':'#51616b',.67,.16);
    wall.map=claddingTexture;wall.bumpMap=claddingTexture;wall.bumpScale=.019;
    const enclosed=tile===1||tile===3||tile===6;
    if(enclosed)wall.name=`${tile===1?'Neon Loop Club':tile===3?'Circuit Dive':'Neuralware'} · continuous exterior walls`;
    localBox(wall,0,groundY+5.2+(height-5.2)/2,tile===2?-1.6:enclosed?0:-.8,width,height-5.2,tile===2?depth-1.6:depth);
    if(enclosed){
      // Enclose the ground floor behind the glazed frontage, including the
      // previously open side/rear elevations visible from the higher balcony.
      for(const side of [-1,1])localBox(wall,side*(width/2-.16),groundY+2.6,.35,.32,5.2,depth+.70);
      localBox(wall,0,groundY+2.6,-depth/2+.16,width,5.2,.32);
      localBox(concrete,0,groundY+.10,.35,width,.20,depth+.70);
      localBox(concrete,0,groundY+5.10,.35,width-.64,.20,depth+.06);
      const shell={name:tile===1?'Neon Loop Club':tile===3?'Circuit Dive':'Neuralware',center:[x,groundY,z],width,depth,height,rotation,sideWallThickness:.32,rearWallThickness:.32,groundFloorEnclosed:true};
      (district.userData.retailShells??=[]).push(shell);
      if(tile===1)district.userData.neonClub=shell;
    }
    localBox(wall,0,groundY+2.55,depth/2-2.3,width,5.1,.22);
    localBox(concrete,0,groundY+.12,depth/2-1,width,.19,2.9);
    // A genuine two-metre room recess is visible through the window glass.
    const photoPosition=world(0,groundY+2.50,depth/2-2.16);interiorPhoto(tile,photoPosition[0],photoPosition[1],photoPosition[2],width-.94,4.7,rotation);
    const bays=Math.floor(width/2.8),bayW=(width-1)/bays;
    for(let bay=0;bay<bays;bay++){
      const u=-width/2+.5+(bay+.5)*bayW;
      localBox(storeGlass,u,groundY+2.53,depth/2+.31,bayW-.13,4.5,.025);
      localBox(silver,u-bayW/2,groundY+2.56,depth/2+.42,.095,4.9,.16);
      localBox(amber,u,groundY+4.72,depth/2+.48,bayW-.35,.065,.07);
      // Fine illuminated rooms and racks are readable behind the shop mullions.
      if(tile===2&&bay%3!==1){
        for(let rack=0;rack<2;rack++){
          localBox(gunmetal,u+(rack-.5)*bayW*.39,groundY+1.97,depth/2-.84,bayW*.23,2.94,.74);
          for(let level=0;level<8;level++){
            localBox(edge,u+(rack-.5)*bayW*.39,groundY+.71+level*.34,depth/2-.45,bayW*.21,.23,.055);
            for(let led=0;led<3;led++)localBox(led%2?cyan:blue,u+(rack-.5)*bayW*.39+(led-1)*.13,groundY+.74+level*.34,depth/2-.41,.054,.033,.026);
          }
        }
      }else{
        localBox(gunmetal,u,groundY+.91,depth/2-.48,bayW*.61,1.02,.72);
        localBox(warmGlass,u,groundY+1.5,depth/2-.38,bayW*.65,.14,.92);
        for(let shelf=0;shelf<3;shelf++){
          localBox(silver,u+bayW*.28,groundY+1.9+shelf*.52,depth/2-1.43,bayW*.31,.052,.48);
          localBox(tile===1?pink:cyan,u+bayW*.28,groundY+1.94+shelf*.52,depth/2-1.16,bayW*.30,.029,.028);
          for(let product=0;product<3;product++)localBox(product%2?gunmetal:warmGlass,u+bayW*.17+product*.13,groundY+2.05+shelf*.52,depth/2-1.40,.07,.19,.08);
        }
      }
      localBox(gunmetal,u,groundY+2.59,depth/2+.59,.047,4.62,.09);
      localBox(gunmetal,u,groundY+2.82,depth/2+.60,bayW-.06,.06,.09);
      if(tile===2){
        localBox(bay%3===0?pink:bay%3===1?cyan:blue,u-bayW/2+.12,groundY+2.57,depth/2+.50,.035,4.38,.04);
        localBox(bay%2?cyan:blue,u,groundY+4.46,depth/2-.60,bayW-.28,.045,1.8);
        if(bay%2===0){const p=world(u,groundY+3.60,depth/2-.42);sign(Math.floor(bay/2)%8,p[0],p[1],p[2],bayW*.82,.76,rotation,mallDirectoryMaterial);}
      }
    }
    for(const side of [-1,1])localBox(wall,side*(width/2-.27),groundY+height/2,depth/2+.32,.54,height,.70);
    localBox(gunmetal,0,groundY+5.07,depth/2+.60,width+.34,.29,1.18);
    localBox(cyan,0,groundY+5.03,depth/2+1.21,width-.7,.038,.075);
    const storefrontLight=tile<3?distantNeon.localized(tile,4801+tile*283,'Plaza storefront '+signs[tile][0],signMaterial):signMaterial;
    const signHeight=tile===2?height-4.8:7.30;
    const main=world(0,groundY+signHeight,depth/2+.43);sign(tile,main[0],main[1],main[2],tile===2?Math.min(31,width-.75):width-.75,3.9,rotation,storefrontLight);
    if(tile===2){
      for(const side of [-1,1]){
        const p=world(side*(width/2-5.05),groundY+signHeight,depth/2+.43);sign(side<0?2:6,p[0],p[1],p[2],8.2,3.2,rotation,mallDirectoryMaterial);
        localBox(side<0?distantNeon.material(4):distantNeon.material(3),side*(width/2-.7),groundY+height*.53,depth/2+.76,.075,height*.87,.075);
      }
      localBox(distantNeon.material(4),0,groundY+height-2.57,depth/2+.65,width-1.2,.065,.07);
      localBox(blue,0,groundY+5.30,depth/2+.64,width-1.2,.05,.07);
      // Three real upper retail galleries: floor plates, recessed display bays,
      // mullions and illuminated departments, rather than stretched ground-floor props.
      for(let floor=0;floor<3;floor++){
        const base=10.6+floor*5.6;
        localBox(concrete,0,groundY+base-.16,.25,width,.32,depth+.5);
        localBox(gunmetal,0,groundY+base+5.02,depth/2+.53,width,.18,.32);
        localBox(floor%2?pink:cyan,0,groundY+base+4.94,depth/2+.72,width-.7,.055,.06);
        for(let bay=0;bay<bays;bay++){
          const u=-width/2+.5+(bay+.5)*bayW;
          // Modelled rooms stay readable from oblique balcony views. The back
          // wall is recessed 2.7 metres behind glass, with supported furniture.
          localBox(gunmetal,u,groundY+base+2.45,4.16,bayW-.12,4.9,.10);
          localBox(edge,u-bayW/2,groundY+base+2.45,5.25,.06,4.9,2.2);
          if((bay+floor)%3!==1){
            for(const side of [-1,1]){
              const rackU=u+side*bayW*.21;
              localBox(edge,rackU,groundY+base+1.6,4.95,bayW*.26,3.2,.72);
              for(let slot=0;slot<4;slot++)localBox(slot%2?blue:cyan,rackU,groundY+base+.5+slot*.7,5.33,bayW*.20,.055,.03);
            }
          }else{
            localBox(gunmetal,u,groundY+base+.55,5.2,bayW*.62,1.1,.8);
            localBox(warmGlass,u,groundY+base+1.16,5.2,bayW*.68,.12,.88);
            localBox(silver,u,groundY+base+2.7,4.42,bayW*.7,.06,.55);
            localBox(pink,u,groundY+base+2.75,4.68,bayW*.67,.04,.04);
          }
          localBox(storeGlass,u,groundY+base+2.53,depth/2+.31,bayW-.13,4.5,.025);
          localBox(silver,u-bayW/2,groundY+base+2.56,depth/2+.42,.095,4.9,.16);
          localBox(gunmetal,u,groundY+base+.20,depth/2+.43,bayW,.14,.30);
          localBox(amber,u,groundY+base+4.65,depth/2-.28,bayW-.35,.065,.07);
          localBox(bay%2?cyan:blue,u,groundY+base+4.30,depth/2-.17,bayW-.35,.045,.08);
          if(bay%3===0){const department=world(u,groundY+base+3.7,depth/2+.44);sign((bay/3+floor*2)%8,department[0],department[1],department[2],bayW*.84,.85,rotation,mallDirectoryMaterial);}
        }
      }
      for(let department=0;department<5;department++){
        const p=world((department-2)*9.1,groundY+7.35,depth/2+.44);sign(department,p[0],p[1],p[2],8.3,2.5,rotation,mallDirectoryMaterial);
      }
    }
    localBox(concrete,0,groundY+height+.12,0,width+.7,.34,depth+.4);
    snowCap('Exposed shop roof and perimeter cap',x,groundY+height+.29,z,width+.64,depth+.34,rotation);
    for(let floor=0;floor<3;floor++)localBox(gunmetal,0,groundY+5.4+floor*1.43,depth/2+.56,width+.15,.067,.11);
    for(let col=0;col<Math.floor(width/3);col++){
      const u=-width*.4+col*3;localBox(gunmetal,u,groundY+height+1.0,-.5,2.1,1.7,2.7);
      localBox(silver,u,groundY+height+1.92,-.5,2.1,.16,2.7);
      const snowTop=world(u,groundY+height+2,-.5);snowCap('Shop HVAC top',snowTop[0],snowTop[1],snowTop[2],2.06,2.66,rotation);
      for(let slat=0;slat<6;slat++)localBox(edge,u,groundY+height+.47+slat*.20,.88,1.6,.085,.028);
      for(let pipe=0;pipe<2;pipe++){
        const a=world(u-.8+pipe*.3,groundY+height+.23,.5),b=world(u-.8+pipe*.3,groundY+height+.23,depth/2-.55);
        line(silver,vector(a[0],a[1],a[2]),vector(b[0],b[1],b[2]),.065);
      }
    }
    for(const u of [-width*.4,width*.36]){
      const p=world(u,groundY+height+2.2,-depth*.25);cylinder(silver,p[0],p[1],p[2],.07,4.1,7);
      localBox(edge,u,groundY+height+2.55,-depth*.25,1.9,.05,.055);
    }
    // Service conduits, structural panel joints and shop stoops stop the podiums looking like cubes.
    for(let u=-width/2+2;u<width/2;u+=3.4)localBox(edge,u,groundY+height-.55,depth/2+.42,.04,1.1,.04);
    for(let step=0;step<3;step++)localBox(concrete,0,groundY+.10+step*.095,depth/2+1.75-step*.25,width-.25,.15,1.1-step*.2);
    return world;
  }
  const clinicX=plazaX(33),clinicZ=plazaZ(-36)-8;
  const clubX=plazaX(53),clubZ=plazaZ(-31)-8;
  retail(clinicX,clinicZ,24,13,10.8,0,0);
  retail(clubX,clubZ,15,12,12.2,0,1);
  const mallHeight=11.2*3;
  const mallX=plazaX(70),mallZ=centerZ;
  reserveFootprint(mallX,mallZ,15,53);
  const dataMall=createOsCityMall(neonAtmosphere);dataMall.group.position.set(mallX,groundY,mallZ);dataMall.group.rotation.y=-Math.PI/2;district.add(dataMall.group);
  district.userData.ready=Promise.all([district.userData.ready,dataMall.ready]).then(()=>undefined);
  district.userData.mallSigns=dataMall.signs;
  snowCap('Data Mall exposed roof',mallX,groundY+mallHeight+.15,mallZ,51.7,13.5,-Math.PI/2);
  district.userData.dataMall={center:[mallX,groundY,mallZ],plazaChipCenter:[plazaX(centerX),groundY,centerZ],alignedWithMainChip:true,width:51.5,depth:13,height:mallHeight,roofY:groundY+mallHeight+.29,
    previousMallHeight:11.2,heightRatio:3,mergedCircuitDive:true,retailLevels:10,facade:'Ten galleries, recessed central atrium and framed entrance',railHeightChanged:true,railElevationLift:CITY_TRANSIT_ELEVATION_LIFT};
  retail(plazaX(33),plazaZ(30),23,13,9.8,Math.PI,3);
  retail(plazaX(17),plazaZ(29),8.7,9,11.7,Math.PI,6);
  district.userData.plaza={scale:CITY_PLAZA_SCALE,areaRatio:CITY_PLAZA_SCALE**2,width:79*CITY_PLAZA_SCALE,depth:88*CITY_PLAZA_SCALE,
    bounds:{minX:8,maxX:plazaX(87),minZ:plazaZ(-49),maxZ:plazaZ(39)},delimitation:plazaBoundary,circuitColors:[...CITY_CIRCUIT_COLORS],
    leftBuildings:[{name:'Circuit Clinic',center:[clinicX,groundY,clinicZ],width:24,depth:13},{name:'Neon Loop Club',center:[clubX,groundY,clubZ],width:15,depth:12}]};
  for(const [name,color,intensity,x,y,z,tx,tz,width] of [
    ['Data Mall glazing spill','#83cfee',6.5,mallX-8,-8.2,mallZ,plazaX(36),mallZ,49],
    ['Data Mall southern interior spill','#e6b0d1',3.0,mallX-6,-10.8,mallZ+16.75,plazaX(48),mallZ+16.75,13],
    ['Clinic and club canopy spill','#89c8e9',4.8,clinicX,-8.5,clinicZ+8,clinicX,clinicZ+28,22],
    ['Circuit Dive warm interior spill','#d7c5a1',3.5,plazaX(33),-9.2,plazaZ(30)-7,plazaX(33),plazaZ(5),20],
  ] as const){const light=new THREE.RectAreaLight(color,intensity,width,3);light.name=`Circuit Market · ${name}`;light.position.set(x,y,z);light.lookAt(tx,groundY,tz);district.add(light);neonAtmosphere.registerLight(light);}
  for(const [baseX,baseZ,tile] of [[43,-20,7],[23,15,4]] as const){
    const x=plazaX(baseX),z=plazaZ(baseZ);
    reserveFootprint(x,z,4.4,3.5);
    box(concrete,x,groundY+.19,z,4.4,.32,3.5);box(gunmetal,x,groundY+1.1,z,2.6,1.7,1.35);
    box(warmGlass,x-.05,groundY+1.85,z+.73,2.8,.12,1.6);
    for(const side of [-1,1])box(silver,x+side*1.65,groundY+1.75,z,.06,3.5,.06);
    box(edge,x,groundY+3.52,z,4.0,.16,3.0);box(cyan,x,groundY+3.43,z+1.5,3.8,.042,.035);
    snowCap('Exposed street kiosk roof',x,groundY+3.60,z,3.96,2.96);
    const kioskLight=tile===7?distantNeon.localized(tile,5903,'Plaza kiosk sign',signMaterial):signMaterial;
    sign(tile,x,groundY+2.65,z+.8,2.65,.8,0,kioskLight);
    for(let item=0;item<5;item++)cylinder(item%2?silver:amber,x-1+item*.44,groundY+2.05,z+.76,.085,.25,8);
  }

  // Procedural office façades are built from window rooms with blinds, desks,
  // interruptions and service panels; eight maps prevent a repeated grid pattern.
  const facades=Array.from({length:8},(_,variant)=>{
    const map=canvasTexture(512,1024,c=>{
      c.fillStyle=variant%2?'#142633':'#1b2b38';c.fillRect(0,0,512,1024);
      for(let row=0;row<24;row++)for(let col=0;col<8;col++){
        const x=col*64+8,y=row*42.66+8,lit=random();
        c.fillStyle='#070f18';c.fillRect(x-2,y-2,51,24);
        const warm=lit<.21,bright=lit<.35,screenRoom=bright&&!warm&&(row*11+col*7+variant)%5===0;
        const screenColor=(row+variant)%3===0?'#c38fb9':(row+variant)%3===1?'#8f9dc6':'#7cbcae';
        c.fillStyle=bright?(warm?'#aa957a':screenRoom?screenColor:'#517d8c'):'#172b36';c.fillRect(x,y,47,19);
        if(bright){
          c.fillStyle=warm?'#f4dcb2':screenRoom?screenColor:'#bde0e8';c.fillRect(x+7,y+2,20+random()*14,2);
          c.fillStyle=warm?'#857867':'#315161';c.fillRect(x+3,y+12,34,5);
          c.fillStyle='#142430';c.fillRect(x+6+random()*20,y+11,13,8);
          if((col+row+variant)%5===0){c.fillStyle='#14222d90';for(let blind=0;blind<5;blind++)c.fillRect(x,y+blind*4,47,2);}
          else if((col+row)%4===0){c.fillStyle='#2d3b46';c.fillRect(x,y,11,19);}
        }
        c.fillStyle='#3c4b56';c.fillRect(x+23,y,1,19);
        c.fillStyle='#3c4c5970';c.fillRect(col*64,row*42.66+40,64,2);
      }
      // Vertical mullions and irregular unlit technical floors.
      c.fillStyle='#61728025';for(let col=0;col<8;col++)c.fillRect(col*64,0,3,1024);
      for(let floor=0;floor<3;floor++){const y=Math.floor(random()*28)*32;c.fillStyle='#0c1c27';c.fillRect(0,y,512,27);c.fillStyle='#334a58';for(let slat=0;slat<6;slat++)c.fillRect(0,y+3+slat*4,512,1);}
    });
    const glow=canvasTexture(512,1024,c=>{c.drawImage(map.image as HTMLCanvasElement,0,0);const image=c.getImageData(0,0,512,1024);for(let p=0;p<image.data.length;p+=4){const intensity=Math.max(image.data[p],image.data[p+1],image.data[p+2]);if(intensity<78)image.data[p]=image.data[p+1]=image.data[p+2]=0;}c.putImageData(image,0,0);});
    return neonAtmosphere.register(atmosphere(new THREE.MeshStandardMaterial({color:'#aec5d4',map,emissiveMap:glow,emissive:'#f0ede8',emissiveIntensity:.96+(variant%5)*.095,roughness:.37,metalness:.29})),'window','Masked tower window lights '+variant);
  });
  // Share eight static facade maps, while a per-face attribute gives every
  // distant window its own TV lighting and interior-shadow timing.
  const tvFacades=facades.map((source,index)=>{
    const result=tvWindows.material(source,'atlas');
    result.name='Distant Circuit Market · TV window facade '+index;
    return neonAtmosphere.register(result,'window',result.name);
  });
  let tvFaceId=0;
  function distantFacade(variant:number,x:number,y:number,z:number,w:number,h:number,rotation:number){
    const faceId=++tvFaceId;
    const geometry=tvWindows.tagGeometry(new THREE.PlaneGeometry(w,h),faceId,'atlas');
    push(geometry,tvFacades[variant%8],x,y,z,rotation);
    return faceId;
  }
  function tower(x:number,z:number,w:number,d:number,h:number,index:number){
    towerCount++;const top=groundY+h,body=material(index%3?'#2d4555':'#43535e',.59,.27,.23);
    box(body,x,groundY+h/2,z,w,h,d);
    distantFacade(index%8,x-w/2-.018,groundY+h/2,z,d-.42,h-.44,-Math.PI/2);
    distantFacade((index+3)%8,x,groundY+h/2,z+d/2+.018,w-.42,h-.44,0);
    distantFacade((index+5)%8,x,groundY+h/2,z-d/2-.018,w-.42,h-.44,Math.PI);
    for(let floor=0;floor<Math.floor(h/3.5);floor++){
      const y=groundY+floor*3.5;
      box(gunmetal,x-w/2-.06,y,z,.13,.095,d+.24);box(gunmetal,x,y,z+d/2+.07,w,.095,.15);
    }
    for(const dx of [-1,1])for(const dz of [-1,1])box(edge,x+dx*(w/2-.12),groundY+h/2,z+dz*(d/2-.12),.36,h,.36);
    const setback=h*.10;
    box(roof,x+w*.07,top+setback/2,z-d*.07,w*.72,setback,d*.72);
    snowCap('Tower upper setback roof',x+w*.07,top+setback,z-d*.07,w*.72-.04,d*.72-.04);
    distantFacade((index+1)%8,x-w*.29-.018,top+setback/2,z-d*.07,d*.69,setback,-Math.PI/2);
    box(gunmetal,x,top+.1,z,w+.35,.30,d+.35);
    for(let n=0;n<3;n++){
      const tx=x-w*.28+n*w*.22,tz=z+(n%2?1:-1)*d*.20;
      box(gunmetal,tx,top+setback+.5,tz,1.3,.92,1.5);cylinder(silver,tx,top+setback+1.18,tz,.39,.21,10);
      snowCap('Tower HVAC housing',tx,top+setback+.96,tz,1.26,1.46);
    }
    if(index%3===0){
      const accent=index===0||index===3?distantNeon.localized(index+1,6109+index,'Tower '+index+' crown strip'):distantNeon.material(index+1);
      box(accent,x-w/2-.09,groundY+h*.7,z-d*.34,.07,h*.43,.13);
      box(distantNeon.material(index+2),x-w/2-.09,groundY+h*.68,z+d*.35,.07,h*.46,.13);
      box(accent,x-w/2-.10,groundY+h*.91,z,.09,.10,d*.72);
      sign(4+index%3,x-w/2-.30,groundY+h*.68,z,d*.73,Math.min(2.5,h*.075),-Math.PI/2);
    }else if(index%4===1){
      const lit=distantNeon.material(index+3);
      for(let n=0;n<3;n++)box(lit,x-w/2-.14,groundY+h*.79-n*.55,z+d*.36,.09,.12,1.6);
      sign(index%8,x-w/2-.3,groundY+h*.4,z,d*.77,Math.min(3.6,h*.12),-Math.PI/2);
    }
    cylinder(edge,x,top+setback+3,z,.055,5.1,6);
    const beacon=new THREE.SphereGeometry(.115,6,5);push(beacon,index%3?pink:cyan,x,top+setback+5.6,z);
    skylineDetails.decorate({x,z,width:d,depth:w,height:h,groundY,roofY:top+setback,rotation:-Math.PI/2,index:index+200,crowns:false});
  }
  // A staggered skyline, with lower roofs in front and narrow, taller shafts behind.
  const nearTowers=[[129,-43,11,14,43],[130,-26,9,11,36],[145,-6,13,12,49],[130,18,10,10,39],[124,42,12,12,41],[99,-58,11,12,32],[93,56,10,12,34]];
  nearTowers.forEach((t,i)=>tower(t[0],t[1],t[2],t[3],t[4],i));
  // Towers on the peripheral views keep the balcony wraparound credible.
  const peripheralTowers=[[88,126,10,13,48,49],[110,-102,10,12,55,50]];
  peripheralTowers.forEach(t=>tower(t[0],t[1],t[2],t[3],t[4],t[5]));

  // Keep the foreground and two successive tower bands dimensional. The far
  // matte uses upright planes, a transparent sky and no baked railway; it is
  // never stretched around a cylinder or mirrored into a second transit system.
  const railCurve=createOsCityTransitRoute();
  const route=railCurve.getSpacedPoints(420);
  // The extended city has a real ground plane below all tower bases and columns.
  // Three adjoining slabs avoid coplanar overlap with the existing market floor.
  const plazaEndX=plazaX(87),plazaMinZ=plazaZ(-49),plazaMaxZ=plazaZ(39);
  box(roof,(plazaEndX+312)/2,groundY-.30,-5,312-plazaEndX,.56,640);
  box(roof,plazaX(47.5),groundY-.30,(-325+plazaMinZ)/2,79*CITY_PLAZA_SCALE,.56,plazaMinZ+325);
  box(roof,plazaX(47.5),groundY-.30,(315+plazaMaxZ)/2,79*CITY_PLAZA_SCALE,.56,315-plazaMaxZ);
  const skylineTowers: {x:number;z:number;width:number;depth:number;height:number}[]=[];
  let animatedFacadeCount=0,animatedBoardCount=0,animatedWindowGroupCount=0;
  function distantTower(x:number,z:number,w:number,d:number,h:number,index:number){
    towerCount++;skylineTowers.push({x,z,width:w,depth:d,height:h});
    const top=groundY+h,body=index%3?gunmetal:concrete;
    box(body,x,groundY+h/2,z,w,h,d);
    const westFaceId=distantFacade(index%8,x-w/2-.02,groundY+h/2,z,d-.24,h-.30,-Math.PI/2);
    distantFacade((index+2)%8,x,groundY+h/2,z+d/2+.02,w-.24,h-.30,0);
    distantFacade((index+5)%8,x,groundY+h/2,z-d/2-.02,w-.24,h-.30,Math.PI);
    for(const side of [-1,1])box(edge,x-w/2-.05,groundY+h/2,z+side*(d/2-.17),.14,h,.27);
    for(let setback=0;setback<2;setback++){
      const sw=w*(.73-setback*.19),sd=d*(.76-setback*.20),sh=h*(.07-setback*.018),sy=top+setback*h*.067;
      box(body,x,sy+sh/2,z,sw,sh,sd);
      // These shallow roof tiers house plant, not another compressed 24-floor
      // apartment atlas. Solid cladding keeps the actual crown silhouette clear.
      box(roof,x,sy+sh+.12,z,sw+.27,.24,sd+.27);
      snowCap('Distant tower setback roof',x,sy+sh+.24,z,sw+.23,sd+.23);
    }
    const paletteIndex=index*3+Math.floor(index/7);
    const animateAccent=index%3!==1&&(index%4===0||index%7===2)&&animatedFacadeCount<16;
    const neon=animateAccent?distantNeon.localized(paletteIndex,7207+index*101,'Tower '+index+' local facade accent'):distantNeon.material(paletteIndex);
    if(animateAccent)animatedFacadeCount++;
    if(index%3!==1){
      const side=index%2?1:-1;
      if(index%4===0){
        box(neon,x-w/2-.09,groundY+h*.64,z+side*d*.29,.07,h*.49,.10);
        box(neon,x-w/2-.09,groundY+h*.89,z,.07,.09,d*.61);
      }else if(index%4===1){
        for(let band=0;band<3;band++)box(neon,x-w/2-.09,groundY+h*(.71+band*.066),z+side*band*d*.06,.07,.11,d*(.62-band*.13));
      }else if(index%4===2){
        for(const edgeSide of [-1,1]){
          box(neon,x-w/2-.09,groundY+h*.72,z+edgeSide*d*.23,.07,h*.18,.10);
          box(neon,x-w/2-.09,groundY+h*(.72+edgeSide*.09),z,.07,.10,d*.46);
        }
      }else{
        box(neon,x-w/2-.09,groundY+h*.73,z+side*d*.25,.07,h*.30,.10);
        for(let dash=0;dash<3;dash++)box(neon,x-w/2-.09,groundY+h*(.66+dash*.066),z-side*d*.13,.07,h*.032,d*.13);
      }
    }
    if(index%4===0||index%7===3){
      const animateBoard=(index%11===0||index%11===3)&&animatedBoardCount<4;
      const signLight=animateBoard?distantNeon.localized(paletteIndex,19403+index*71,'Tower '+index+' business sign',signMaterial):signMaterial;
      if(animateBoard)animatedBoardCount++;
      // Do not reuse the placement modulus: most signs are on index%4===0
      // towers, which otherwise forces all of them to the same violet panel.
      const signTile=4+(Math.floor(index/4)+Math.floor(index/7))%4;
      sign(signTile,x-w/2-.14,groundY+h*.52,z,d*.76,Math.min(3.1,h*.065),-Math.PI/2,signLight);
      box(glazing,x-w/2-.10,groundY+h*.37,z,d*.02,h*.17,d*.49);
    }
    if(index%9===4&&animatedWindowGroupCount<6){
      // The crop retains its independent neon dip and exactly matches the TV
      // pattern of the wall beneath it; it does not count these rooms twice.
      const source=facades[index%8];
      const localLight=distantNeon.localized(paletteIndex,24107+index*173,'Tower '+index+' local window group',source);
      const localWindows=localLight===source?tvFacades[index%8]:tvWindows.material(localLight,'atlas',true);
      const u0=.16+(index%3)*.19,v0=.47+(index%2)*.13,uw=.30,vh=.17,fw=d-.24,fh=h-.30;
      const patch=new THREE.PlaneGeometry(fw*uw,fh*vh),uv=patch.getAttribute('uv');
      for(let vertex=0;vertex<uv.count;vertex++)uv.setXY(vertex,u0+uv.getX(vertex)*uw,v0+uv.getY(vertex)*vh);
      tvWindows.tagGeometry(patch,westFaceId,'atlas',false);
      push(patch,localWindows,x-w/2-.032,groundY+h/2+fh*(v0+vh/2-.5),z+fw*(u0+uw/2-.5),-Math.PI/2);
      animatedWindowGroupCount++;
    }
    const antennaTop=top+h*.14;
    cylinder(edge,x,antennaTop+2.6,z,.05,5.2,5);
    push(new THREE.SphereGeometry(.13,5,4),index%2?cyan:pink,x,antennaTop+5.25,z);
    skylineDetails.decorate({x,z,width:d,depth:w,height:h,groundY,roofY:top+h*.119+.24,rotation:-Math.PI/2,index});
  }
  // Three depth bands: retail foreground, intermediate towers, and one final
  // dimensional tower row. The remaining district is a shared matte backdrop.
  for(let column=0;column<6;column++){
    const x=178+(random()-.5)*8,z=-143+column*50+(random()-.5)*8;
    const w=9+random()*8,d=10+random()*8,h=40+random()*30;
    // All buildings sit on the ground and leave the real elevated railway clear.
    if(Math.hypot(x-4,z+5)>306)continue;
    if(route.some(p=>Math.abs(p.x-x)<w/2+4.0&&Math.abs(p.z-z)<d/2+4.0))continue;
    distantTower(x,z,w,d,h,column);
  }
  // Peripheral buildings continue the horizon around the balcony return.
  for(let n=0;n<6;n++){
    const x=[90,130,178][Math.floor(n/2)],z=n%2?155:-151;
    distantTower(x,z,7+random()*4,10+random()*5,47+random()*38,100+n);
  }
  skylineDetails.finish();
  const outerMarket=createOsCityOuterMarketLights(neonAtmosphere,[...pedestrianObstacles,...cityMarketFootprints(),
    ...nearTowers.map(([x,z,w,d])=>({x,z,halfWidth:w/2,halfDepth:d/2})),
    ...peripheralTowers.map(([x,z,w,d])=>({x,z,halfWidth:w/2,halfDepth:d/2})),
    ...skylineTowers.map(t=>({x:t.x,z:t.z,halfWidth:t.width/2,halfDepth:t.depth/2})),
  ]);district.add(outerMarket.group);
  const skyGeometry=new THREE.SphereGeometry(520,48,24),skyColors=new Float32Array(skyGeometry.getAttribute('position').count*3);
  skyGeometry.setAttribute('color',new THREE.BufferAttribute(skyColors,3));
  const skyMaterial=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,depthWrite:false,toneMapped:false,fog:false});
  const sky=new THREE.Mesh(skyGeometry,skyMaterial);sky.name='Circuit Market · continuous surrounding atmospheric sky';sky.position.set(4,0,-5);sky.renderOrder=-20;sky.userData.background=true;district.add(sky);
  district.userData.skylineSource={asset:'/apartments/assets/north-city/skyline-r29/unlit-city.png',provenance:'Built-in image generation from user city reference; transparent unlit architecture with separate 3D emitters',role:'Image-backed far skyline beyond three dimensional building bands',storefrontTextureQuads:interiorQuads,projection:'single physical camera and upright planar backdrop sectors, no cylindrical photographic warp or mirrored skyline',towerCount:skylineTowers.length,towers:skylineTowers,buildingDepthBands:3,previousFarTowerCount:64};

  // An open through line follows exactly the vehicle curve. Its ends disappear
  // into the district instead of joining a visible return loop.
  function guideway(width:number,height:number,offset:number,elevation:number){
    const positions:number[]=[],indices:number[]=[],uvs:number[]=[];
    for(let i=0;i<route.length;i++){
      const p=route[i],t=railCurve.getTangentAt(i/(route.length-1)),normal=vector(t.z,0,-t.x).normalize();
      for(const [side,vertical] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
        const lateral=offset+side*width/2;
        positions.push(p.x+normal.x*lateral,p.y+elevation+vertical*height/2,p.z+normal.z*lateral);
        uvs.push(i*.15,side>0?1:0);
      }
      if(i)for(let face=0;face<4;face++){
        const a=(i-1)*4+face,b=(i-1)*4+(face+1)%4,c=i*4+(face+1)%4,d=i*4+face;
        indices.push(a,b,c,a,c,d);
      }
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
  }
  const railDeck=material('#667f91',.60,.30,.68);
  railDeck.name='Raised guideway · visible blue-grey underside';
  const railwayMaterials=new Map<THREE.MeshStandardMaterial,THREE.MeshStandardMaterial>();
  const railMaterial=(source:THREE.MeshStandardMaterial)=>{
    let result=railwayMaterials.get(source);
    if(!result){
      result=applyCityTransitDistanceFade(source.clone());result.name='Distant through railway · '+(source.name||source.color.getHexString());
      neonAtmosphere.register(result,source.userData.cityAtmosphere?.kind??'surface',result.name);
      railwayMaterials.set(source,result);
    }
    return result;
  };
  push(guideway(2.8,.44,0,0),railMaterial(railDeck));
  railDeck.dispose();
  for(const offset of [-1.15,-.72,.72,1.15])push(guideway(.11,.14,offset,.27),railMaterial(Math.abs(offset)>1?silver:edge));
  for(const offset of [-1.4475,1.4475])push(guideway(.085,.12,offset,-.03),railMaterial(offset<0?cyan:blue));
  for(let i=0;i<route.length-1;i+=15){
    const p=route[i],t=railCurve.getTangentAt(i/(route.length-1)),angle=Math.atan2(t.x,t.z);
    if(Math.abs(p.z+5)>CITY_TRANSIT_FADE_END+3)continue;
    cylinder(railMaterial(concrete),p.x,(p.y+groundY)/2,p.z,.66,p.y-groundY,8);
    box(railMaterial(gunmetal),p.x,p.y-.52,p.z,3.6,.43,1.22,angle);
  }
  district.userData.transitGuideway={closed:false,length:railCurve.getLength(),routePoints:route.map(p=>p.toArray()),distantFade:{start:CITY_TRANSIT_FADE_START,end:CITY_TRANSIT_FADE_END},deckWidth:2.8,elevationLift:CITY_TRANSIT_ELEVATION_LIFT,groundY:groundY-.02,nearTowerFootprints:[...nearTowers,...peripheralTowers.map(t=>t.slice(0,5))],rendering:'open through railway with shared distance fade for deck, rails, lights, supports and vehicles'};

  // Neon reflections are shallow, broken light decals on the physical wet pavement.
  // This does not bake any buildings or the city view into a background image.
  const reflectionTexture=canvasTexture(256,256,c=>{
    const gradient=c.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#c3efffb0');gradient.addColorStop(.22,'#92dfff55');gradient.addColorStop(1,'#3c88ad00');c.fillStyle=gradient;c.fillRect(0,0,256,256);
    c.globalCompositeOperation='destination-out';for(let n=0;n<110;n++){c.fillStyle=`rgba(0,0,0,${.3+random()*.65})`;c.fillRect(random()*256,random()*256,12+random()*120,1+random()*3);}
  });
  const reflectionMaterial=atmosphere(new THREE.MeshBasicMaterial({color:'#59d3ff',map:reflectionTexture,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,visible:false}));
  for(let n=0;n<37;n++){
    const x=plazaX(12+random()*46),z=plazaZ(-27+random()*45),geo=new THREE.PlaneGeometry(.45+random()*.75,2+random()*4);
    geo.rotateX(-Math.PI/2);geo.rotateY((random()-.5)*.20);push(geo,reflectionMaterial,x,groundY+.075,z);
  }
  // Small street fixtures, queues and pedestrians supply the human scale in the square.
  const market=createOsCityMarketStalls(neonAtmosphere);district.add(market.group);
  pedestrianObstacles.push(...cityMarketFootprints());
  district.userData.ready=Promise.all([district.userData.ready,market.ready]).then(()=>undefined);
  for(let i=0;i<20;i++){
    const side=i%2?-1:1,x=plazaX(12+Math.floor(i/2)*4.8),z=plazaZ(-5+side*21);
    reserveFootprint(x,z,.4,.4);reserveFootprint(x+1.8,z,.2,.2);
    cylinder(gunmetal,x,groundY+1.5,z,.055,3);box(edge,x,groundY+3.07,z,.58,.14,.28);box(cyan,x,groundY+3.0,z,.43,.045,.21);
    cylinder(gunmetal,x+1.8,groundY+.45,z,.07,.9);cylinder(cyan,x+1.8,groundY+.87,z,.078,.045);
  }
  const crowdSkin=[material('#ae907b',.95,0,.04),material('#75584a',.95,0,.04),material('#cfac90',.95,0,.04)];
  const crowdHair=[material('#101824',.96,0,.02),material('#30251f',.96,0,.02),material('#756b63',.96,0,.02),material('#45334b',.96,0,.02)];
  for(let i=0;i<7;i++)reserveFootprint(plazaX(18+i*6),plazaZ(i%2?15:-22),1.8,.6);
  for(const [x,z] of [[22,-27.6],[43,-27.6],[57,-17],[57,5],[34,20.4],[13,8],[13,-11],[43,20.4]])reserveFootprint(plazaX(x),plazaZ(z),.36,.36);
  // Seed the whole neighborhood rather than lining people up along the old border.
  // Keep the busiest area near the shops, with a looser spread into both side streets.
  const standingResidents:number[][]=[];
  let crowdSeed=360145;
  const crowdRandom=()=>{crowdSeed=(Math.imul(crowdSeed,1664525)+1013904223)>>>0;return crowdSeed/4294967296;};
  for(let attempt=0;standingResidents.length<145&&attempt<10000;attempt++){
    const central=crowdRandom()<.52;
    const x=plazaX(12+crowdRandom()*51),z=plazaZ(central?-32+crowdRandom()*58:-58+crowdRandom()*105);
    if(pedestrianObstacles.some(o=>Math.abs(x-o.x)<o.halfWidth+.85&&Math.abs(z-o.z)<o.halfDepth+.85))continue;
    if(standingResidents.some(([px,pz])=>Math.hypot(x-px,z-pz)<1.25))continue;
    standingResidents.push([x,z]);
  }
  for(let n=0;n<standingResidents.length;n++){
    // Retain the detail RNG sequence so redistributing people does not change the city.
    random();random();
    const [x,z]=standingResidents[n];
    const y=groundY+.10,h=1.50+random()*.28,cloth=n%5?blackClothes:greyClothes;
    const torso=new THREE.CapsuleGeometry(.16,h*.34,2,5);push(torso,cloth,x,y+h*.58,z,random()*6.28);
    push(new THREE.SphereGeometry(.118,6,5),crowdSkin[n%3],x,y+h*.94,z);
    push(new THREE.SphereGeometry(.128,7,4,0,Math.PI*2,0,Math.PI*.60),crowdHair[n%4],x,y+h*.94+.012,z);
    line(cloth,vector(x-.085,y+h*.40,z),vector(x-.13,y+.05,z+.11),.052);
    line(cloth,vector(x+.085,y+h*.40,z),vector(x+.13,y+.05,z-.08),.052);
    line(cloth,vector(x-.17,y+h*.77,z),vector(x-.26,y+h*.46,z+.04),.052);
    line(cloth,vector(x+.17,y+h*.77,z),vector(x+.25,y+h*.46,z-.05),.052);
    if(n%7===0){const umbrella=new THREE.SphereGeometry(.64,10,4,0,Math.PI*2,0,Math.PI*.42);umbrella.scale(1,.31,1);push(umbrella,n%2?gunmetal:glazing,x,y+h+.18,z);line(silver,vector(x+.16,y+h*.6,z),vector(x,y+h+.17,z),.014);}
  }
  for(let i=0;i<7;i++){
    const x=plazaX(18+i*6),z=plazaZ(i%2?15:-22);box(gunmetal,x,groundY+.37,z,1.8,.12,.6);
    for(const side of [-1,1])box(edge,x+side*.65,groundY+.17,z,.09,.32,.5);
  }

  // All static detail, including windows, circuits, pedestrians and equipment,
  // is merged by material; the moving objects below have small, separate meshes.
  for(const [mat,geometries] of batches){
    const geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
    const mesh=new THREE.Mesh(geometry,mat);mesh.name=mat===snowSurface?'Circuit Market · batched 30mm supported snow caps':mat===signMaterial?'Circuit Market · eight-business luminous sign atlas':mat===pavement?'Circuit Market · rain-polished slab plaza':'Circuit Market · batched dimensional architecture';
    mesh.receiveShadow=false;mesh.castShadow=false;(mat===snowSurface?snowGroup:district).add(mesh);
  }
  snowGroup.userData.surfaces=snowCaps;
  const aircraft: {group:THREE.Group;base:THREE.Vector3;phase:number;speed:number}[]=[];
  const droneBody=new THREE.BoxGeometry(.86,.22,.43),droneArm=new THREE.BoxGeometry(1.85,.065,.075),rotorGeo=new THREE.CylinderGeometry(.28,.28,.035,12);
  const droneLamp=new THREE.SphereGeometry(.065,5,4);
  for(let n=0;n<9;n++){
    const group=new THREE.Group();group.name='Autonomous courier · lit twin-rotor aircraft';
    group.add(new THREE.Mesh(droneBody,edge));
    for(const z of [-.3,.3]){const arm=new THREE.Mesh(droneArm,gunmetal);arm.position.z=z;group.add(arm);for(const side of [-1,1]){const rotor=new THREE.Mesh(rotorGeo,edge);rotor.position.set(side*.91,.03,z);group.add(rotor);const lamp=new THREE.Mesh(droneLamp,side<0?cyan:pink);lamp.position.set(side*.96,-.08,z);group.add(lamp);}}
    const underside=new THREE.Mesh(new THREE.BoxGeometry(.54,.04,.24),blue);underside.position.y=-.14;group.add(underside);
    const base=vector(30+random()*78,3+random()*18,-36+random()*70);group.position.copy(base);group.rotation.y=random()*6.28;group.scale.setScalar(1.1+random()*.75);district.add(group);
    aircraft.push({group,base,phase:random()*6.28,speed:.045+random()*.05});
  }
  // Restrained local steam wisps soften a few industrial rooflines.
  const steamTexture=canvasTexture(128,128,c=>{const gradient=c.createRadialGradient(64,64,1,64,64,62);gradient.addColorStop(0,'#b8d8e652');gradient.addColorStop(.35,'#a6cdda28');gradient.addColorStop(1,'#a6cdda00');c.fillStyle=gradient;c.fillRect(0,0,128,128);});
  const steamMaterial=atmosphere(new THREE.SpriteMaterial({map:steamTexture,transparent:true,opacity:.18,depthWrite:false,color:'#7fa9bf'}));
  const steam:THREE.Sprite[]=[];
  for(let n=0;n<16;n++){const sprite=new THREE.Sprite(steamMaterial);sprite.position.set(plazaX(38+(n%4)*11),-2+Math.floor(n/4)*2.4,n%2?clinicZ+5:plazaZ(27));sprite.scale.set(8,4,1);district.add(sprite);steam.push(sprite);}
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const exteriorWeather=createOsCityBalconyWeather();district.add(exteriorWeather.group);
  district.traverse(object=>{const mat=(object as THREE.Mesh).material;if(mat)(Array.isArray(mat)?mat:[mat]).forEach(item=>{if(item instanceof THREE.MeshStandardMaterial)neonAtmosphere.register(item,'surface',object.name);});});
  const plazaLife=createOsCityPlazaLife(movingCircuitTraces,movingCircuitColors);district.add(plazaLife);
  district.userData.setStreamSpeed=(value:number)=>{plazaLife.userData.setStreamSpeed(value);dataMall.setStreamSpeed(value);};
  district.userData.getStreamSpeed=plazaLife.userData.getStreamSpeed;
  const baseSkyColors=new Float32Array(skyColors.length);
  let lastLightning=0,disposed=false;
  let weather:OsCityWeather='rain',timeOfDay:CityTimeOfDay='day';
  district.userData.setWeather=(mode:OsCityWeather,time:CityTimeOfDay='day')=>{
    weather=mode;timeOfDay=time;const preset=getCityWeatherPreset(mode,time);
    exteriorWeather.setWeather(mode,time);plazaLife.userData.setWeather(mode,time);neonAtmosphere.setWeather(mode,time);
    skylineDetails.setWeather(mode,time);
    backdrop.setWeather(mode,time);
    snowGroup.visible=mode==='snow';
    market.setWeather(mode);
    outerMarket.setWeather(mode,time);
    holograms.setWeather(mode,time);
    pavement.roughness=THREE.MathUtils.lerp(.88,.42,preset.wetness);pavement.metalness=.04;pavement.clearcoat=preset.wetness*.65;
    reflectionMaterial.opacity=0;reflectionMaterial.visible=false;wetShader.uniforms.wetness.value=preset.wetness;wetReflection.visible=preset.wetness>.05;
    const denseFog=mode==='fog'||mode==='academic-foggy-night';
    // Room window, balcony, skyline, precipitation and moving traffic now use
    // exactly the same atmosphere; distance alone controls their extinction.
    distanceFog.strength.value=1;
    distanceFog.tintMix.value=0;
    const sharedSky=new THREE.Color(preset.sky),skyColor=skyGeometry.getAttribute('color');
    for(let i=0;i<skyColor.count;i++)skyColor.setXYZ(i,sharedSky.r,sharedSky.g,sharedSky.b);skyColor.needsUpdate=true;
    baseSkyColors.set(skyColors);lastLightning=0;
    steamMaterial.opacity=denseFog?.08:.12+preset.wetness*.06;
    district.userData.weather={mode,timeOfDay,wetness:preset.wetness,precipitation:preset.precipitation,snowAccumulationVisible:snowGroup.visible,reducedMotion:reducedMotion.matches};
  };
  district.userData.update=(delta:number,elapsed:number)=>{
    if(disposed)return;
    exteriorWeather.update(delta,elapsed);plazaLife.userData.update(delta,elapsed);dataMall.update(elapsed,reducedMotion.matches);
    holograms.update(delta,reducedMotion.matches);
    const lightning=exteriorWeather.getLightning();
    if(lightning!==lastLightning){
      for(let i=0;i<skyColors.length;i++)skyColors[i]=baseSkyColors[i]+lightning*(i%3===0?.65:i%3===1?.82:1);
      skyGeometry.getAttribute('color').needsUpdate=true;lastLightning=lightning;
    }
    distantNeon.update(elapsed,reducedMotion.matches,timeOfDay);
    tvWindows.update(elapsed,reducedMotion.matches,timeOfDay);
    backdrop.update(elapsed,reducedMotion.matches);
    if(reducedMotion.matches)return;
    for(const aircraftItem of aircraft){const t=elapsed*aircraftItem.speed+aircraftItem.phase;aircraftItem.group.position.set(aircraftItem.base.x+Math.sin(t)*12,aircraftItem.base.y+Math.sin(t*.71)*.42,aircraftItem.base.z+Math.cos(t)*17);aircraftItem.group.rotation.y=Math.atan2(Math.cos(t)*12,-Math.sin(t)*17);aircraftItem.group.rotation.z=Math.sin(t)*.045;}
    for(let n=0;n<steam.length;n++){steam[n].position.y=-2+Math.floor(n/4)*2.4+Math.sin(elapsed*.21+n)*.4;}
  };
  district.userData.getSnapshot=()=>({
    holograms:holograms.controls.getSnapshot(),
    market:market.snapshot(),outerMarket:outerMarket.snapshot(),
    placement:district.userData.placement,plaza:district.userData.plaza,neonClub:district.userData.neonClub,retailShells:district.userData.retailShells,transitGuideway:district.userData.transitGuideway,weather:exteriorWeather.snapshot(),life:{...plazaLife.userData.snapshot(),standingResidents,pedestrianObstacles},lighting:neonAtmosphere.snapshot(),distantNeon:distantNeon.snapshot(),tvWindows:tvWindows.snapshot(),dataMall:{...district.userData.dataMall,...dataMall.snapshot()},skylineDetails:skylineDetails.snapshot(),backdrop:backdrop.snapshot(),
    snowAccumulation:{visible:snowGroup.visible,capCount:snowCaps.length,thickness:.03,drawCalls:snowGroup.children.length,shelteredTerrace:false},
    atmosphere:{mode:weather,timeOfDay,fogStrength:distanceFog.strength.value,fogTintMix:distanceFog.tintMix.value,sharedWeather:true,fogDensity:getCityWeatherPreset(weather,timeOfDay).fog,sky:getCityWeatherPreset(weather,timeOfDay).sky,skylineVisible:true,skylineGeometry:'three building depth bands plus image-backed distant district',skylineTowerCount:skylineTowers.length,skyRadius:520,skyCoverage:'closed sphere'},
    droneCount:aircraft.length,dronePositions:aircraft.map(item=>item.group.position.toArray()),disposed,
  });
  district.userData.exterior={groundY,boundaryMinX:8,boundaryExcludesSky:true,skyRadius:520,plazaCenter:[plazaX(centerX),groundY,centerZ],towerCount,businessSignCount:signCount,circuitCount,staticDrawCalls:batches.size,buildingDepthBands:3,far3dTowerCount:skylineTowers.length,referenceFeatures:['Expanded neon blue and pink circuit-board plaza with matching moving data lights','Central raised processor with neon blue and pink contacts','Ripperdoc clinic, Neon Loop Club, tripled Data Mall and southern Circuit Dive','Recessed server-hall storefronts','Image-backed skyline with editable neon and controlled windows','Elevated through railway fading into the north and south distance','Courier drones, umbrellas and pedestrians with hair','Shared weather and atmospheric scattering']};
  district.userData.dispose=()=>{if(disposed)return;disposed=true;wetReflection.getRenderTarget().dispose();steamMaterial.dispose();steamTexture.dispose();exteriorWeather.dispose();plazaLife.userData.dispose();dataMall.dispose();market.dispose();outerMarket.dispose();holograms.dispose();backdrop.dispose();};
  district.userData.setWeather('rain');district.userData.update(0,0);
  return district;
}
