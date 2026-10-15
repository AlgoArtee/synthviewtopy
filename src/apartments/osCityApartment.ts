import { CITY_WEATHER_OPTIONS, CITY_TIME_OPTIONS, getCityWeatherPreset, getCityWeatherLightning, isCityWeather, isCityTimeOfDay, type OsCityWeather, type CityTimeOfDay } from './osCityWeather';
import * as THREE from 'three';
import { CityRoundedBoxGeometry as RoundedBoxGeometry } from './osCityGeometry';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { enableWorldSpaceUV } from './roomMaterials';
import { createOsCityExterior } from './osCityExterior';
import { createOsCityTV } from './osCityTV';
import { createOsCityWindow } from './osCityWindow';
import { createCityNavigation, cityFloorHeight } from './osCityNavigation';
import { CITY_BED, CITY_WINDOW, CITY_EXTERIOR_OFFSET, CITY_RESIDENCE_ELEVATION, CITY_BALCONY, CITY_BALCONY_DOOR, CITY_KITCHEN_OFFSET_Z, insideCityFootprint } from './osCityLayout';
import { createOsCityBalcony } from './osCityBalcony';
import { createOsCityBalconyDistrict } from './osCityBalconyDistrict';
import { CITY_WINDOW_DEFAULTS, normalizeCityWindowSettings, type CityWindowSettings } from './osCityWindowTv';
import type { LiminetteRoom } from './liminetteRoom';
import { createOsCityFurnishings, OS_CITY_LOUNGE_OFFSET_Z } from './osCityFurnishings';
import { createOsCityFridge } from './osCityFridge';
import { createOsCityKettle } from './osCityKettle';
import { createOsCityHolidays } from './osCityHolidays';
import { createOsCityRadio } from './osCityRadio';

export const OS_CITY_APARTMENT_ID = 'os-city-apartment';

/** Reference-authored North City residence. Dimensions in metres; north is negative Z. */
export function createOsCityApartment(): LiminetteRoom {
  RectAreaLightUniformsLib.init();
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#b8cfda');
  scene.userData.reflectionProbe = [-2, 1.7, .9];
  scene.fog = new THREE.FogExp2('#b5ccd8', .016);
  const interior = new THREE.Group(); interior.name = 'O’s City Apartment · reference floor plan'; scene.add(interior);
  const colliders: THREE.Box3[] = [];
  let seed = 86723;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  function tex(draw: (c: CanvasRenderingContext2D) => void) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
    draw(canvas.getContext('2d')!); const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  const noise = tex(c => {
    c.fillStyle = '#a9a9a9'; c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 33000; i++) { const g = 120 + random() * 90; c.fillStyle = 'rgba('+g+','+g+','+g+',.22)'; c.fillRect(random()*512, random()*512, 1, 1); }
  }); noise.colorSpace = THREE.NoColorSpace; noise.wrapS = noise.wrapT = THREE.RepeatWrapping; noise.repeat.set(4,4);
  const materialReady: Promise<unknown>[] = [];
  const loader = new THREE.TextureLoader();
  function scan(name: string, color = false) {
    let t!: THREE.Texture;
    materialReady.push(new Promise<void>((resolve,reject)=>{t=loader.load('/apartments/materials/'+name,()=>resolve(),undefined,()=>reject(new Error('Material missing: '+name)));}));
    t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    return t;
  }
  const plasterColor = scan('white_plaster_02_basecolor.jpg', true), plasterNormal = scan('white_plaster_02_normal.jpg'), plasterRoughness = scan('white_plaster_02_roughness.jpg');
  const paint = enableWorldSpaceUV(new THREE.MeshStandardMaterial({ color: '#eaedf1', roughness: .84, map: plasterColor, normalMap: plasterNormal, normalScale: new THREE.Vector2(.16,.16), roughnessMap: plasterRoughness }));
  const compilePaint = paint.onBeforeCompile;
  paint.onBeforeCompile=(shader,renderer)=>{
    compilePaint.call(paint,shader,renderer);
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec3 plasterSample = texture2D(map, vMapUv).rgb;
        float plasterTone = dot(plasterSample, vec3(.2126,.7152,.0722));
        diffuseColor.rgb *= .92 + .08 * plasterTone;
      #endif
    `);
  };
  paint.customProgramCacheKey=()=> 'north-city-pearl-plaster-v2';
  const trim = new THREE.MeshPhysicalMaterial({color:'#f0f0ef',roughness:.48,clearcoat:.12});
  const porcelain = new THREE.MeshPhysicalMaterial({ color:'#eef0f2',roughness:.2,clearcoat:.42 });
  const floor = new THREE.MeshStandardMaterial({ color:'#cdd0d5',roughness:.29,metalness:.08,bumpMap:noise,bumpScale:.004 });
  const chrome = new THREE.MeshStandardMaterial({color:'#b2c1cf',metalness:.94,roughness:.17});
  const dark = new THREE.MeshStandardMaterial({color:'#354455',roughness:.5});
  const glow = (c: string, n=2.2) => new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:n,roughness:.3});
  const cyan=glow('#55d9f2',1.65), pink=glow('#ed7ac5',1.65), whiteGlow=glow('#e8f7ff',3);
  function mesh(g: THREE.BufferGeometry, m: THREE.Material, name:string, p: THREE.Vector3, parent:THREE.Object3D=interior) {
    const o = new THREE.Mesh(g,m); o.name=name; o.position.copy(p); o.castShadow=true; o.receiveShadow=true; parent.add(o); return o;
  }
  function box(name:string, m:THREE.Material, p:number[], d:number[], bevel=.015, parent:THREE.Object3D=interior) {
    return mesh(bevel ? new RoundedBoxGeometry(d[0],d[1],d[2],2,bevel) : new THREE.BoxGeometry(d[0],d[1],d[2]), m,name,v(p[0],p[1],p[2]),parent);
  }
  function tube(name:string, pts:THREE.Vector3[], radius:number, mat:THREE.Material, parent:THREE.Object3D=interior) {
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),Math.max(24,pts.length*3),radius,8,false),mat,name,v(0,0,0),parent);
  }
  function block(x:number,z:number,w:number,d:number,top=2.2) {const bounds=new THREE.Box3(v(x-w/2,0,z-d/2),v(x+w/2,top,z+d/2));colliders.push(bounds);return bounds;}
  function wall(name:string,p:number[],d:number[]) {box(name,paint,p,d,0);block(p[0],p[2],d[0],d[2],3.5);}
  const outline = new THREE.Shape(); outline.moveTo(CITY_BED.minX,CITY_BED.minZ); outline.lineTo(CITY_BED.maxX,CITY_BED.minZ); outline.lineTo(CITY_BED.maxX,-3); outline.lineTo(1.4,-3); outline.lineTo(1.4,-.15); outline.lineTo(4.8,-.15); outline.lineTo(4.8,6.15); outline.lineTo(-4.8,6.15); outline.lineTo(-4.8,CITY_BED.maxZ); outline.lineTo(CITY_BED.minX,CITY_BED.maxZ); outline.closePath();
  const floorGeo = new THREE.ExtrudeGeometry(outline,{depth:.18,bevelEnabled:false}); floorGeo.rotateX(Math.PI/2);
  mesh(floorGeo,floor,'Sealed L-shaped floor',v(0,0,0));
  mesh(floorGeo.clone(),paint,'Sealed L-shaped ceiling',v(0,3.68,0));
  wall('West structural wall',[-4.91,1.75,2.62],[.22,3.5,7.29]);
  wall('Bed alcove west structural wall',[CITY_BED.minX-.11,1.75,CITY_BED.centerZ],[.22,3.5,CITY_BED.depth+.22]);
  wall('Bed alcove east structural wall',[CITY_BED.maxX+.065,1.75,(CITY_BED.minZ-.15)/2],[.13,3.5,-.15-CITY_BED.minZ]);
  wall('Alcove south return',[(CITY_BED.minX-4.8)/2,1.75,CITY_BED.maxZ+.11],[-4.8-CITY_BED.minX,3.5,.22]);
  // Butt the bathroom cross-wall against the partition's outer face so its
  // end cap cannot protrude through the continuous bedroom wall.
  const partitionOuterX=CITY_BED.maxX+.13;
  wall('North bathroom wall',[(partitionOuterX+1.62)/2,1.75,-3.11],[1.62-partitionOuterX,3.5,.22]);
  wall('Bathroom east boundary',[1.51,1.75,-1.575],[.22,3.5,3.07]);
  // Subtract the full-height access cutout in the wall outline before extrusion.
  // This is a single connected wall mesh with a real opening, not a door decal.
  const doorWall=new THREE.Shape();doorWall.moveTo(1.4,0);doorWall.lineTo(CITY_BALCONY_DOOR.minX,0);doorWall.lineTo(CITY_BALCONY_DOOR.minX,CITY_BALCONY_DOOR.height);doorWall.lineTo(CITY_BALCONY_DOOR.maxX,CITY_BALCONY_DOOR.height);doorWall.lineTo(CITY_BALCONY_DOOR.maxX,0);doorWall.lineTo(4.91,0);doorWall.lineTo(4.91,3.5);doorWall.lineTo(1.4,3.5);doorWall.closePath();
  const doorWallMesh=mesh(new THREE.ExtrudeGeometry(doorWall,{depth:.22,bevelEnabled:false}),paint,'North living wall with balcony doorway',v(0,0,-.37));
  doorWallMesh.userData.opening={id:'balcony-door',operation:'door-profile subtraction',...CITY_BALCONY_DOOR,destination:'Wraparound balcony'};
  block(1.75,-.26,.7,.22,3.5);block(4.255,-.26,1.31,.22,3.5);
  colliders.push(new THREE.Box3(v(2.1,2.62,-.37),v(3.6,3.5,-.15)));
  wall('East structural wall',[4.91,1.75,3],[.22,3.5,6.52]);
  wall('South entry left pier',[-4.6,1.75,6.26],[.4,3.5,.22]);
  wall('South desk wall',[.76,1.75,6.26],[8.08,3.5,.22]);
  box('Entry lintel',paint,[-3.83,2.93,6.26],[1.14,1.14,.22],0);
  // Full-wall curtain glazing replaces the complete north infill. Floor, side walls and
  // ceiling continue around a genuine clear aperture; slim thermally-broken frames seal it.
  const wx=CITY_WINDOW.x,wz=CITY_WINDOW.z;
  const cityWindow=createOsCityWindow();interior.add(cityWindow.group);
  block(wx,wz-.13,CITY_BED.width,.26,3.5); // Keep the elevated exterior boundary contained in every opening mode.
  const television=createOsCityTV();interior.add(television.group);
  box('Entry door shadow reveal',dark,[-3.83,1.17,6.22],[1.13,2.34,.11],.01);
  box('Apartment door leaf',trim,[-3.83,1.14,6.158],[1.04,2.28,.055],.013);
  box('Entry threshold',chrome,[-3.83,.008,6.11],[1.11,.016,.3],.004);
  box('Door handle plate',chrome,[-3.44,1.08,6.111],[.05,.2,.012],.008);
  box('Door lever',chrome,[-3.52,1.1,6.077],[.18,.022,.035],.01);block(-3.83,6.21,1.14,.15);
  box('West shadow-gap skirting',trim,[-4.765,.07,2.62],[.055,.14,7.06]);
  box('Alcove west shadow-gap skirting',trim,[CITY_BED.minX+.025,.07,CITY_BED.centerZ],[.05,.14,CITY_BED.depth]);
  box('Alcove east shadow-gap skirting',trim,[CITY_BED.maxX-.025,.07,CITY_BED.centerZ],[.05,.14,CITY_BED.depth]);
  box('South shadow-gap skirting',trim,[.77,.07,6.116],[8.05,.14,.055]);
  for(const z of [-.7,1.5,4.8]) box('West cyan recessed light',cyan,[-4.779,1.77,z],[.014,3.31,.012],.003);
  // Concentric fixture has backing collars joined flush to the ceiling underside.
  for(let i=0;i<5;i++) {
    const r=.44+i*.245; const h=.052+i*.013;
    const profile=new THREE.Shape();profile.absarc(0,0,r+.083,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,r-.083,0,Math.PI*2,true);profile.holes.push(hole);const housing=new THREE.ExtrudeGeometry(profile,{depth:h+.05,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.006,bevelThickness:.006,curveSegments:72});housing.rotateX(Math.PI/2);mesh(housing,trim,'Concentric ceiling recessed housing',v(-2.75,3.505,.35));
    const led=mesh(new THREE.TorusGeometry(r+.003,.017,8,160,Math.PI*1.9),whiteGlow,'Broken arc opal ceiling diffuser',v(-2.75,3.441-h,.35));led.rotation.set(Math.PI/2,0,i*.6);
  }
  // Recessed three-sided cove gives the deep sleeping alcove a visible light source.
  for(const x of [CITY_BED.minX+.10,CITY_BED.maxX-.10])box('Alcove ceiling · recessed opal cove',whiteGlow,[x,3.46,CITY_BED.centerZ],[.025,.025,CITY_BED.depth-.12],.005);
  box('Alcove ceiling · north opal cove',whiteGlow,[CITY_BED.centerX,3.46,CITY_BED.minZ+.10],[CITY_BED.width-.2,.025,.025],.005);
  const furnishings=createOsCityFurnishings(); interior.add(furnishings); materialReady.push(furnishings.userData.ready ?? Promise.resolve());
  const radio=createOsCityRadio();interior.add(radio.group);block(1.91,5.68,.88,.43,1.1);
  const bedCollider=block(CITY_BED.centerX,CITY_BED.centerZ,CITY_BED.width,CITY_BED.depth,.66);block(-1.65,-.4,.52,.52,.7);block(-3.4,.4+OS_CITY_LOUNGE_OFFSET_Z,1.3,1.3,1.6);block(-.05,5.65,2.75,.64,.85);block(0,4.77,.4,.4,.5);
  // Bathroom: tub north, sink west, WC east; lower doorway faces the main room.
  // The continuous alcove east wall also forms the bedroom/bathroom partition.
  wall('Bathroom south left panel',[-.58,1.75,-.15],[1.47,3.5,.13]);
  wall('Bathroom door right pier',[1.29,1.75,-.15],[.23,3.5,.13]);
  box('Bathroom doorway lintel',paint,[.67,3.01,-.15],[1.06,.98,.13],0);
  for(const x of [.14,1.17]) box('Bathroom door satin metal jamb',chrome,[x,1.26,-.15],[.026,2.52,.17],.005);
  box('Bathroom door header',chrome,[.66,2.51,-.15],[1.07,.026,.17],.005);
  box('Bathroom sliding leaf parked in pocket',trim,[-.4,1.24,-.19],[1,2.48,.045],.01);
  const bathGroup = new THREE.Group();bathGroup.name='Pastel illuminated ceramic bathroom'; interior.add(bathGroup);
  function tiles(cols:number, rows:number, width:number, height:number, pos:THREE.Vector3, rotY:number) {
    const group=new THREE.Group(); group.position.copy(pos); group.rotation.y=rotY; bathGroup.add(group);
    const w=width/cols,h=height/rows;
    for(let c=0;c<cols;c++)for(let r=0;r<rows;r++) {
      const mat=new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(.61+(random()-.5)*.025,.075,.75+random()*.045),roughness:.30+random()*.14,metalness:0,bumpMap:noise,bumpScale:.002});
      box('Pearl ceramic wall panel',mat,[-width/2+(c+.5)*w,(r+.5)*h,0],[w-.015,h-.017,.052],.005,group);
      if(c<cols-1)box('Vertical illuminated joint',(c+r)%2?pink:cyan,[-width/2+(c+1)*w,(r+.5)*h,-.005],[.012,h-.03,.022],.001,group);
      if(r<rows-1)box('Horizontal illuminated joint',(c+r)%3?cyan:pink,[-width/2+(c+.5)*w,(r+1)*h,-.005],[w-.01,.012,.022],.001,group);
    }
  }
  tiles(5,5,2.48,3.46,v(.09,0,-2.967),0);
  tiles(5,5,2.76,3.46,v(-1.167,0,-1.55),Math.PI/2);
  tiles(5,5,2.76,3.46,v(1.369,0,-1.55),-Math.PI/2);
  box('Bathroom porcelain floor',porcelain,[.11,.008,-1.57],[2.52,.016,2.8],0);
  for(let x=-1.12;x<1.35;x+=.5) box('Bathroom floor grout',floor,[x,.018,-1.57],[.005,.002,2.8],0);
  for(let z=-2.95;z<-.18;z+=.55) box('Bathroom floor grout',floor,[.11,.018,z],[2.52,.002,.005],0);
  const tubProfile=[[0,0],[.7,0],[.83,.035],[.95,.22],[1,.5],[.995,.58],[.97,.605],[.92,.605],[.895,.57],[.86,.26],[.73,.13],[0,.13]];
  const tubGeo=new THREE.LatheGeometry(tubProfile.map(([r,y])=>new THREE.Vector2(r,y)),128); tubGeo.scale(1.05,1,.44);
  mesh(tubGeo,porcelain,'Continuous hollow soaking bathtub',v(.07,.025,-2.36));block(.07,-2.36,2.16,.93,.67);
  mesh(new THREE.CylinderGeometry(.035,.035,.004,32),chrome,'Bath drain',v(.07,.158,-2.36));
  tube('Bath wall-mounted mixer spout',[v(.75,.83,-2.94),v(.75,.83,-2.66),v(.75,.78,-2.58)],.018,chrome);
  for(const x of [.59,.91])box('Bath mixer control',chrome,[x,.83,-2.91],[.065,.065,.06],.012);
  const basinGeo=new THREE.LatheGeometry([[0,0],[.22,0],[.32,.09],[.35,.17],[.345,.19],[.315,.19],[.29,.11],[.19,.045],[0,.045]].map(([r,y])=>new THREE.Vector2(r,y)),80);basinGeo.scale(.75,1,1.1);
  box('Floating vanity carcass',trim,[-.87,.5,-1.03],[.48,.42,.85],.025);box('Vanity underside shadow',dark,[-.94,.27,-1.03],[.34,.04,.67],.008);
  box('Vanity drawer reveal',floor,[-.618,.48,-1.03],[.007,.014,.73],.003);
  box('Vanity counter',porcelain,[-.84,.75,-1.03],[.62,.05,.95],.025);
  mesh(basinGeo,porcelain,'Open vessel washbasin',v(-.81,.777,-1.06));
  tube('Vanity gooseneck faucet',[v(-1.08,.78,-1.06),v(-1.08,1.15,-1.06),v(-.94,1.17,-1.06),v(-.9,1.1,-1.06)],.014,chrome);block(-.86,-1.03,.6,.95,1);
  const mirror=new Reflector(new THREE.CircleGeometry(.36,80),{color:0xcbd7e3,textureWidth:512,textureHeight:512,clipBias:.003});mirror.name='Round vanity planar mirror';mirror.position.set(-1.127,1.72,-1.03);mirror.rotation.y=Math.PI/2;interior.add(mirror);
  const mirrorRim=mesh(new THREE.TorusGeometry(.365,.012,8,96),whiteGlow,'Mirror edge diffuser',v(-1.12,1.72,-1.03));mirrorRim.rotation.y=Math.PI/2;
  const wcGeo=new THREE.LatheGeometry([[0,0],[.17,0],[.19,.09],[.17,.28],[.25,.4],[.26,.44],[.22,.46],[.18,.37],[0,.3]].map(([r,y])=>new THREE.Vector2(r,y)),72);wcGeo.scale(1,1,1.25);
  mesh(wcGeo,porcelain,'Porcelain WC bowl',v(.97,.025,-1.16));
  const seat=mesh(new THREE.SphereGeometry(1,48,24),porcelain,'Soft-close WC seat',v(.97,.495,-1.16));seat.scale.set(.257,.038,.32);
  box('Concealed WC support',porcelain,[1.15,.29,-1.25],[.42,.55,.45],.045);block(1.02,-1.16,.61,.75,.6);
  box('Brushed dual flush panel',chrome,[1.327,1.02,-1.11],[.014,.14,.24],.01);
  tube('Chrome towel rail',[v(1.29,1.54,-1.92),v(1.19,1.54,-1.92),v(1.19,1.54,-1.5),v(1.29,1.54,-1.5)],.013,chrome);
  const towel = new THREE.MeshStandardMaterial({color:'#e4deea',roughness:.98,bumpMap:noise,bumpScale:.025});
  box('Folded hand towel',towel,[1.18,1.37,-1.69],[.047,.33,.31],.02);
  box('Small wall-mounted bath display',dark,[-.33,1.58,-2.916],[.61,.43,.022],.008);
  const art=tex(c=>{const g=c.createLinearGradient(0,0,512,512);g.addColorStop(0,'#a7dbe9');g.addColorStop(.5,'#ded7ef');g.addColorStop(1,'#edacd7');c.fillStyle=g;c.fillRect(0,0,512,512);for(let i=0;i<140;i++){c.fillStyle='rgba(240,244,255,.12)';c.fillRect(random()*512,random()*512,1,180);}});
  mesh(new THREE.PlaneGeometry(.57,.39),new THREE.MeshBasicMaterial({map:art}),'Pastel rain artwork',v(-.33,1.58,-2.901));
  for(const [x,z,w,d] of [[.1,-2.91,2.55,.019],[-1.12,-1.55,.019,2.7],[1.31,-1.55,.019,2.7]])box('Pink bathroom ceiling cove',pink,[x,3.4,z],[w,.016,d],.003);
  // Small glass planter and a floating ceramic shelf echo the bathroom reference.
  box('Bathroom display shelf',porcelain,[-.33,1.085,-2.82],[.43,.043,.29],.008);
  const planterGlass=new THREE.MeshPhysicalMaterial({color:'#d5eaec',transmission:.6,thickness:.016,roughness:.12,transparent:true,opacity:.72,ior:1.46});
  const potProfile=[[.05,0],[.073,.02],[.078,.065],[.06,.105],[.052,.105],[.065,.064],[.062,.026],[.045,.016]];
  mesh(new THREE.LatheGeometry(potProfile.map(([r,y])=>new THREE.Vector2(r,y)),40),planterGlass,'Glass succulent planter',v(-.33,1.109,-2.79));
  mesh(new THREE.CylinderGeometry(.055,.05,.04,32),new THREE.MeshStandardMaterial({color:'#b1aa9a',roughness:1}),'Pale planter gravel',v(-.33,1.144,-2.79));
  const leafMaterial=new THREE.MeshStandardMaterial({color:'#a5c5bd',roughness:.55});
  for(let i=0;i<24;i++){
    const angle=i*2.39996, ring=i<10?1:i<19?.68:.39;
    const leaf=mesh(new THREE.SphereGeometry(1,14,8),leafMaterial,'Succulent fleshy leaf',v(-.33+Math.sin(angle)*.032*ring,1.195+(1-ring)*.1,-2.79+Math.cos(angle)*.032*ring));
    leaf.scale.set(.023*ring,.017,.085*ring);leaf.rotation.set(-.35-(1-ring)*.65,angle,0);
  }
  // Right-hand kitchen: soft white cabinetry, quartz, sink, induction and cup.
  const kitchenStart=interior.children.length;
  const cabinet=new THREE.MeshStandardMaterial({color:'#dadcde',roughness:.38});
  box('Kitchen recessed plinth',dark,[4.43,.07,1.44],[.62,.14,2.62],.015);
  box('Kitchen base cabinetry',cabinet,[4.36,.405,1.44],[.82,.63,2.78],.025);box('Kitchen cabinet fronts',cabinet,[3.96,.47,1.44],[.035,.75,2.78],.012);
  const worktop=new THREE.Shape();worktop.moveTo(3.835,.025);worktop.lineTo(4.785,.025);worktop.lineTo(4.785,2.855);worktop.lineTo(3.835,2.855);worktop.closePath();const sinkHole=new THREE.Path();sinkHole.absellipse(4.26,.65,.225,.299,0,Math.PI*2,true,0);worktop.holes.push(sinkHole);const worktopGeo=new THREE.ExtrudeGeometry(worktop,{depth:.055,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2,curveSegments:48});worktopGeo.rotateX(Math.PI/2);mesh(worktopGeo,porcelain,'Quartz countertop with sink aperture',v(0,.904,0));
  for(let z=.14;z<2.79;z+=.54) {box('Cabinet reveal',dark,[3.941,.47,z],[.008,.64,.009],0);box('Recessed finger pull',chrome,[3.929,.775,z+.24],[.013,.012,.26],.005);}
  box('Kitchen glass backsplash',trim,[4.762,1.29,1.44],[.025,.73,2.85],.008);
  box('Upper kitchen cupboard',cabinet,[4.55,2.27,1.44],[.47,.74,2.76],.025);
  for(let z=.15;z<2.8;z+=.55)box('Upper cabinet join',floor,[4.308,2.27,z],[.008,.66,.009],0);
  box('Under-cabinet opal strip',whiteGlow,[4.41,1.883,1.44],[.023,.018,2.65],.004);
  box('Inset induction cooktop',dark,[4.21,.908,2.22],[.57,.012,.72],.022);
  for(const z of [2.03,2.41]){const ring=mesh(new THREE.TorusGeometry(.122,.003,6,64),chrome,'Induction cooking zone',v(4.21,.917,z));ring.rotation.x=Math.PI/2;}
  const sinkG=new THREE.LatheGeometry([[0,0],[.17,0],[.22,.1],[.24,.135],[.215,.14],[.2,.1],[.16,.025],[0,.025]].map(([r,y])=>new THREE.Vector2(r,y)),64);sinkG.scale(1.04,1,1.35);
  mesh(sinkG,chrome,'Inset stainless kitchen basin',v(4.26,.774,.65));
  tube('Kitchen swan neck tap',[v(4.61,.9,.65),v(4.61,1.28,.65),v(4.39,1.29,.65),v(4.36,1.21,.65)],.014,chrome);
  box('Pale wood cutting board',new THREE.MeshStandardMaterial({color:'#b6a392',roughness:.68}),[4.18,.92,1.46],[.5,.032,.36],.025);
  const mugGeo=new THREE.LatheGeometry([[0,0],[.067,0],[.073,.13],[.07,.145],[.061,.145],[.059,.02],[0,.02]].map(([r,y])=>new THREE.Vector2(r,y)),48);
  mesh(mugGeo,porcelain,'Ceramic cup on countertop',v(4.12,.939,1.48));
  const handle=mesh(new THREE.TorusGeometry(.04,.009,8,24),porcelain,'Cup handle',v(4.19,1.018,1.48));handle.rotation.y=Math.PI/2;block(4.37,1.44+CITY_KITCHEN_OFFSET_Z,.86,2.84,.95);
  const kettle=createOsCityKettle();interior.add(kettle);
  const kitchen=new THREE.Group();kitchen.name='Relocated east-wall kitchen';
  for(const child of interior.children.slice(kitchenStart))kitchen.add(child);
  kitchen.position.z=CITY_KITCHEN_OFFSET_Z;interior.add(kitchen);
  const fridge=createOsCityFridge();interior.add(fridge.group);colliders.push(fridge.collider);
  const balcony=createOsCityBalcony(colliders);interior.add(balcony);
  const balconyDistrict=createOsCityBalconyDistrict();balconyDistrict.position.y=-CITY_RESIDENCE_ELEVATION;scene.add(balconyDistrict);materialReady.push(balconyDistrict.userData.ready ?? Promise.resolve());
  balconyDistrict.userData.placement={cityOffsetY:-CITY_RESIDENCE_ELEVATION,floorAbovePlaza:14+CITY_RESIDENCE_ELEVATION,coordinates:'District snapshots are local; world Y adds cityOffsetY'};
  const exterior = createOsCityExterior();exterior.group.position.set(CITY_EXTERIOR_OFFSET.x,-CITY_RESIDENCE_ELEVATION,CITY_EXTERIOR_OFFSET.z);scene.add(exterior.group);materialReady.push(exterior.group.userData.ready);
  const hemisphere = new THREE.HemisphereLight('#dceaff','#686b7f',.5); scene.add(hemisphere);
  const daylight=new THREE.DirectionalLight('#dcf0ff',.65);daylight.position.set(CITY_WINDOW.x-2,7,CITY_WINDOW.z-4);daylight.target.position.set(-1,0,2);daylight.castShadow=true;daylight.shadow.mapSize.set(2048,2048);Object.assign(daylight.shadow.camera,{left:-14,right:14,top:16,bottom:-16,near:.2,far:160});daylight.shadow.normalBias=.01;daylight.shadow.bias=-.00008;daylight.shadow.radius=5;daylight.shadow.blurSamples=12;scene.add(daylight,daylight.target);
  daylight.shadow.camera.updateProjectionMatrix();
  function area(name:string,color:string,intensity:number,p:number[],target:number[],w:number,h:number){const light=new THREE.RectAreaLight(color,intensity,w,h);light.name=name;light.position.set(p[0],p[1],p[2]);light.lookAt(target[0],target[1],target[2]);scene.add(light);return light;}
  const windowLight=area('Panoramic-window sky light','#cfe8ff',2,[wx,1.75,wz-.4],[wx,1.75,wz+3],CITY_WINDOW.width-.12,3.38);
  // Keep this vertical emitter north of the living-room ceiling rings so it cannot cut their reflective housings.
  const windowBounce=area('White room-side window bounce','#eef0f3',.8,[wx,2.2,-1.8],[wx,2.2,wz],5.8,1.8);
  area('Ceiling ring illumination','#eef3ff',1.1,[-2.7,3.3,.35],[-2.7,0,.35],2.5,2.5);
  area('South room reflected light','#e6e0f2',.65,[.3,3.37,4.3],[0,0,3],3.5,2);
  area('Alcove cove indirect light','#e8efff',.88,[CITY_BED.centerX,3.38,CITY_BED.centerZ],[CITY_BED.centerX,0,CITY_BED.centerZ],7.8,7.8);
  area('Bathroom pink wall wash','#ff82c6',2.1,[1.40,2.2,-1.5],[-1,2.2,-1.5],.35,2.4);
  area('Bathroom ceiling fill','#f0eaff',2.0,[.1,3.28,-1.55],[.1,0,-1.55],2.25,2.5);
  area('Bathroom cyan wall wash','#64d8ff',2.5,[-1.22,2.2,-1.6],[1,2.2,-1.6],.35,2.4);
  for(const [x,y,z,color] of [[-.99,1.75,-2.77,'#65d9ff'],[1.2,2.3,-2.65,'#f69acc'],[.48,3.13,-2.82,'#f098d1']] as const){
    const accent=new THREE.PointLight(color,.5,1.55,2);accent.position.set(x,y,z);scene.add(accent);
  }
  area('Workstation soft cyan light','#7cdeef',.9,[-.1,1.7,5.79],[-.1,.7,4.85],2.3,1.1);
  area('Workstation pink edge light','#f7a9d6',.5,[1.2,1,5.7],[-1,.7,5.15],.35,.7);
  area('Holographic TV · localized cyan wall spill','#72cbdc',.32,[CITY_BED.minX+.20,2.06,CITY_BED.centerZ],[CITY_BED.minX,2.06,CITY_BED.centerZ],3.6,1.8);
  const kitchenLight=new THREE.PointLight('#edf6ff',2,3,2);kitchenLight.position.set(4.2,1.75,1.4+CITY_KITCHEN_OFFSET_Z);scene.add(kitchenLight);
  area('Balcony doorway city bounce','#78cee7',.8,[2.85,1.6,-.6],[2.85,1.2,1.5],1.35,2.4);
  // Atmospheric haze belongs outside; indoor surfaces remain in clear room air.
  scene.traverse(object=>{let outside=false;for(let ancestor:THREE.Object3D|null=object;ancestor;ancestor=ancestor.parent)if(ancestor===exterior.group||ancestor===balconyDistrict){outside=true;break;}if(!outside&&(object instanceof THREE.Mesh||object instanceof THREE.Points||object instanceof THREE.Line))for(const material of Array.isArray(object.material)?object.material:[object.material])if('fog' in material)material.fog=false;});
  const interiorFixtures:{light:THREE.Light;intensity:number}[]=[];
  scene.traverse(object=>{
    if(!(object instanceof THREE.Light)||object===hemisphere||object===daylight||object===windowLight||object===windowBounce)return;
    for(let ancestor:THREE.Object3D|null=object;ancestor;ancestor=ancestor.parent)if(ancestor===exterior.group||ancestor===balconyDistrict)return;
    interiorFixtures.push({light:object,intensity:object.intensity});
  });
  // Seasonal colors reuse room fixtures; weather retains control of their intensity.
  const holidays=createOsCityHolidays(scene,[cyan,pink,whiteGlow],holiday=>balconyDistrict.userData.setHoliday(holiday));colliders.push(...holidays.colliders);
  let weather: OsCityWeather = 'rain', timeOfDay:CityTimeOfDay='day', lastElapsed=0;
  let weatherProfile=getCityWeatherPreset(weather,timeOfDay);
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const applyWeather = () => {
    const p=weatherProfile=getCityWeatherPreset(weather,timeOfDay);
    (scene.background as THREE.Color).set(p.sky); (scene.fog as THREE.FogExp2).color.set(p.sky); (scene.fog as THREE.FogExp2).density=p.fog;
    hemisphere.color.set(p.ambientColor);hemisphere.groundColor.set(p.groundColor);hemisphere.intensity=p.ambient;
    daylight.color.set(p.color);daylight.intensity=p.sun;daylight.position.fromArray(p.sunPosition);
    daylight.shadow.radius=weather==='clear'?timeOfDay==='day'?2.5:4:7;daylight.shadow.needsUpdate=true;
    windowLight.color.set(p.color);windowLight.intensity=p.window;windowBounce.color.set(p.color);windowBounce.intensity=p.window*.18;
    for(const fixture of interiorFixtures)fixture.light.intensity=fixture.intensity*p.fixtureIntensity;
    exterior.setWeather(weather,timeOfDay);balcony.userData.setWetness(p.wetness);balconyDistrict.userData.setWeather?.(weather,timeOfDay);
    scene.userData.cityRendering={environmentIntensity:p.environmentIntensity,exposure:p.exposure,bloomStrength:p.bloomStrength,bloomRadius:p.bloomRadius,bloomThreshold:p.bloomThreshold};
    scene.environmentIntensity=p.environmentIntensity;
    scene.userData.weather={mode:weather,timeOfDay,sky:p.sky,daylightIntensity:p.sun,windowIntensity:p.window,fogDensity:p.fog,precipitation:p.precipitation,rainIntensity:p.rainIntensity,wetness:p.wetness,autumn:p.autumn,
      lighting:{sunColor:'#'+daylight.color.getHexString(),sunPosition:daylight.position.toArray(),sunTarget:daylight.target.position.toArray(),ambientColor:'#'+hemisphere.color.getHexString(),groundColor:'#'+hemisphere.groundColor.getHexString(),ambientIntensity:hemisphere.intensity,windowColor:'#'+windowLight.color.getHexString(),shadowRadius:daylight.shadow.radius,shadowFar:daylight.shadow.camera.far,neonIntensity:p.neonIntensity,windowGlow:p.windowGlow,fixtureIntensity:p.fixtureIntensity,neonFogDensity:p.neonFogDensity,...scene.userData.cityRendering}};
  };
  const setWeather=(value:string)=>{if(isCityWeather(value)){weather=value;applyWeather();}};
  const setTimeOfDay=(value:string)=>{if(isCityTimeOfDay(value)){timeOfDay=value;applyWeather();}};
  const windowSettingsKey='north-city-window-appearance-v1';
  let windowSettings:CityWindowSettings={...CITY_WINDOW_DEFAULTS};
  try { windowSettings=normalizeCityWindowSettings(JSON.parse(localStorage.getItem(windowSettingsKey)??'{}')); } catch { /* Use defaults when storage is unavailable. */ }
  const setWindowSettings=(value:Partial<CityWindowSettings>)=>{
    windowSettings=normalizeCityWindowSettings(value,windowSettings);
    balconyDistrict.userData.setWindowSettings(windowSettings);exterior.setWindowSettings(windowSettings);
    try { localStorage.setItem(windowSettingsKey,JSON.stringify(windowSettings)); } catch { /* Controls still work without persistence. */ }
  };
  setWindowSettings(windowSettings);
  const streamSpeedKey='north-city-plaza-stream-speed-v1';
  const setStreamSpeed=(value:number)=>{
    balconyDistrict.userData.setStreamSpeed(value);
    try {localStorage.setItem(streamSpeedKey,String(balconyDistrict.userData.getStreamSpeed()));} catch { /* Live control also works without storage. */ }
  };
  try {setStreamSpeed(Number(localStorage.getItem(streamSpeedKey)??'1'));} catch { /* Keep normal speed. */ }
  const getWeatherSnapshot=()=>({...scene.userData.weather,actual:{sky:'#'+(scene.background as THREE.Color).getHexString(),fogColor:'#'+(scene.fog as THREE.FogExp2).color.getHexString(),fogDensity:(scene.fog as THREE.FogExp2).density,sunPosition:daylight.position.toArray(),sunTarget:daylight.target.position.toArray(),sunIntensity:daylight.intensity,sunColor:'#'+daylight.color.getHexString(),ambientColor:'#'+hemisphere.color.getHexString(),groundColor:'#'+hemisphere.groundColor.getHexString(),ambientIntensity:hemisphere.intensity,windowIntensity:windowLight.intensity,shadowEnabled:daylight.castShadow,shadowRadius:daylight.shadow.radius,shadowFar:daylight.shadow.camera.far,...scene.userData.actualCityRendering}});
  applyWeather();
  const viewpoints=[
    {id:'sleep',label:'Square bed & city alcove',position:v(-3.1,1.9,.2),target:v(-5.4,1.1,-5.4)},
    {id:'lounge',label:'Clear chair & soft carpet',position:v(-1.72,1.4,2.36+OS_CITY_LOUNGE_OFFSET_Z),target:v(-3.2,1.15,-.45+OS_CITY_LOUNGE_OFFSET_Z)},
    {id:'study',label:'Holographic workstation',position:v(-1.5,1.65,3.25),target:v(-.05,1.65,6.112)},
    {id:'radio',label:'Desk radio · Nocturne 01',position:v(.84,1.46,4.28),target:v(1.91,.99,5.68)},
    {id:'bathroom',label:'Pastel bathroom',position:v(.61,1.62,.08),target:v(.05,1.22,-2.18)},
    {id:'kitchen',label:'Kitchen',position:v(1.25,1.6,4.9),target:v(4.3,1.3,3.4)},
    {id:'balcony-door',label:'Door to the balcony',position:v(2.85,1.65,1),target:v(2.85,1.65,-3)},
    {id:'balcony',label:'Balcony · circuit city panorama',position:v(3.8,1.65,-5),target:v(55,-17,-5)},
    {id:'balcony-left',label:'Balcony · northern skyline',position:v(3.8,1.65,-5),target:v(80,2,-62)},
    {id:'balcony-right',label:'Balcony · southern skyline',position:v(3.8,1.65,-5),target:v(80,2,56)},
    {id:'balcony-transit',label:'City maglev through line',position:v(3.9,1.7,-3),target:v(102,37.5-CITY_RESIDENCE_ELEVATION,5)},
    {id:'balcony-plaza',label:'Balcony · main chip and mall alignment',position:v(4.775,1.65,-5),target:v(44,-28,-5)},
    {id:'balcony-mall',label:'Balcony · Data Mall facade',position:v(3.8,1.65,-5),target:v(88.6,-20,-5)},
      {id:'balcony-market-north',label:'Balcony · north market stalls',position:v(4.775,1.65,-5),target:v(48,-35,-39)},
      {id:'balcony-market-south',label:'Balcony · south market stalls',position:v(4.775,1.65,-5),target:v(46,-35,31)},
    {id:'balcony-return',label:'Balcony around the bathroom',position:v(3.5,1.65,-7.9),target:v(2.6,1.2,-.2)},
    {id:'balcony-corner',label:'Balcony planted corner',position:v(3.25,1.65,-4.9),target:v(-.6,1.1,-8.1)},
    {id:'balcony-ceiling',label:'Covered balcony & upstairs floor',position:v(3.2,1.65,-2.35),target:v(.25,3.4,-7.7)},
    {id:'window-pillows',label:'Blanket beneath the window pillows',position:v(-5.35,2.45,-6.05),target:v(-5.35,.95,-8.85)},
    {id:'ceiling',label:'Concentric ceiling light',position:v(-1.72,1.58,2.35),target:v(-2.75,3.5,.34)},
    {id:'bed-edge',label:'Climb onto the bed',position:v(-3,1.65,-.35),target:v(-3,1.8,CITY_WINDOW.z)},
    {id:'on-bed',label:'Look outside from the bed',position:v(wx,2.37,wz+.9),target:v(wx,-1.5,-35+CITY_EXTERIOR_OFFSET.z)},
    {id:'outlook',label:'Panoramic city outlook',position:v(wx,2.37,wz+.7),target:v(wx,-1.5,-34+CITY_EXTERIOR_OFFSET.z)},
    {id:'city-reference',label:'Rainy neon city',position:v(wx,2.37,wz+2),target:v(wx,.2,-38+CITY_EXTERIOR_OFFSET.z)},
    {id:'city-detail',label:'Street life & holograms',position:v(wx,2.37,wz+.34),target:v(wx,-2.3,-42+CITY_EXTERIOR_OFFSET.z)},
    {id:'television',label:'Holographic TV',position:v(-5.8,2.0,-4.70),target:v(CITY_BED.minX+.16,2.12,CITY_BED.centerZ)},
    {id:'window',label:'Opening city window',position:v(-6.50,2.40,-6.25),target:v(-8.65,2.20,wz)},
    {id:'panorama',label:'Full-wall city window',position:v(wx,2.32,wz+4.10),target:v(wx,1.85,wz-13)},
    {id:'pillows',label:'Oversized cotton pillows',position:v(-5.20,2.55,-4.85),target:v(-1.8,1.32,-5.6)},
    {id:'pillow-side',label:'Pillow side and wall contact',position:v(-1.56,1.35,.50),target:v(-1.52,1.15,-3.3)},
    {id:'pillow-low',label:'Pillow fill and mattress contact',position:v(-1.36,1.24,-.20),target:v(-1.60,1.24,-2.45)},
    {id:'pillow-row',label:'Layered cotton pillow row',position:v(-4.20,2.48,-.75),target:v(-1.60,1.20,-5.4)},
    {id:'cat-cushions',label:'Blue and magenta cat cushions',position:v(-4.60,1.60,-5.40),target:v(-2.05,1.05,-5.40)},
    {id:'cat-cushion-row',label:'Full staggered cat cushion row',position:v(-8.90,2.20,-5.25),target:v(-1.90,1.12,-5.25)},
    {id:'duvet-pillow-edge',label:'Duvet ending at the pillows',position:v(-3.03,1.58,-2.91),target:v(-1.80,.76,-4.40)},
    {id:'duvet',label:'Filled white duvet',position:v(-7.80,2.50,-1.40),target:v(-5.05,.89,-5.55)},
    {id:'duvet-drape',label:'Soft oversized duvet',position:v(-2.9,1.6,.70),target:v(-3.9,.72,-4.8)},
    {id:'bed-wide',label:'Full square sleeping alcove',position:v(-1.68,3.03,-1.3),target:v(-6.0,.7,-5.7)},
    {id:'plan',label:'Apartment layout',position:v(4.45,3.08,5.85),target:v(-.8,.9,1.6)},
  ];
  if(new URLSearchParams(location.search).has('qa')) viewpoints.push(
    {id:'ghost-cyan-face',label:'QA cyan sculpted ghost portrait',position:v(.72+CITY_EXTERIOR_OFFSET.x+.25,4.48,-31.3+CITY_EXTERIOR_OFFSET.z),target:v(.72+CITY_EXTERIOR_OFFSET.x,4.48,-35+CITY_EXTERIOR_OFFSET.z)},
    {id:'ghost-pink-face',label:'QA pink sculpted ghost portrait',position:v(-6.3+CITY_EXTERIOR_OFFSET.x-.2,3.66,-45.2+CITY_EXTERIOR_OFFSET.z),target:v(-6.3+CITY_EXTERIOR_OFFSET.x,3.66,-49+CITY_EXTERIOR_OFFSET.z)},
    {id:'ghost-cyan-portrait',label:'QA cyan expressive portrait',position:v(.72+CITY_EXTERIOR_OFFSET.x+.10,4.48,-33.35+CITY_EXTERIOR_OFFSET.z),target:v(.72+CITY_EXTERIOR_OFFSET.x,4.48,-35+CITY_EXTERIOR_OFFSET.z)},
    {id:'ghost-pink-portrait',label:'QA pink expressive portrait',position:v(-6.3+CITY_EXTERIOR_OFFSET.x-.10,3.66,-47.30+CITY_EXTERIOR_OFFSET.z),target:v(-6.3+CITY_EXTERIOR_OFFSET.x,3.66,-49+CITY_EXTERIOR_OFFSET.z)},
    {id:'corner-sw',label:'South-west review',position:v(-4.50,1.6,5.73),target:v(-.2,1.3,-1.2)},
    {id:'corner-se',label:'South-east review',position:v(3.66,1.6,5.73),target:v(-2,1.4,-.5)},
    {id:'corner-nw',label:'North-west review',position:v(CITY_BED.minX+.35,2.37,CITY_BED.minZ+.55),target:v(-.4,1.2,1.4)},
    {id:'corner-ne',label:'Bathroom reverse review',position:v(.75,1.65,-1.6),target:v(.6,1.5,1.4)},
    {id:'ceiling-oblique-a',label:'Ceiling attachment A',position:v(-4.3,1.5,2.5),target:v(-2.7,3.35,.25)},
    {id:'ceiling-oblique-b',label:'Ceiling attachment B',position:v(-1.6,1.5,-2.4),target:v(-2.7,3.35,.25)}
  );
  scene.userData.apartment={floorArea:143.833,location:{residence:'0.8.0',district:'North City',space:'City apartment'},design:{palette:'Pearl white, icy blue, pale pink, satin chrome',reference:'Six room references and rainy living-city reference; L-shaped floor plan',materials:'Microtextured plaster, porcelain, wrinkled cotton, acrylic, brushed chrome, shag wool'},outlook:{type:'Animated rainy North City with traffic, pedestrians, filigree ghosts in flowing long dresses, neon, cable bundles and steam'},northCity:{id:OS_CITY_APARTMENT_ID,level:'0.8.0',residenceElevation:CITY_RESIDENCE_ELEVATION,floorAbovePlaza:14+CITY_RESIDENCE_ELEVATION,cityOffsetY:-CITY_RESIDENCE_ELEVATION,livingArea:60.48,previousLivingArea:30.24,livingAreaRatio:2,referenceCount:10,balcony:{...CITY_BALCONY,door:CITY_BALCONY_DOOR,ceiling:balcony.userData.layout.ceiling},kitchen:{offsetZ:CITY_KITCHEN_OFFSET_Z},bed:{...CITY_BED,previousWidth:2.85,widthRatio:3,wallFittedSides:3},window:cityWindow.snapshot(),features:['Covered walkable wraparound balcony','Upper-floor slab and illuminated soffit','Weather-responsive circuit plaza','Walking plaza residents and elevated trains','Circuit plaza city panorama','Balcony sliding glass door','Relocated east-wall kitchen','Blanket beneath north-window pillows','Tilt-and-turn left window','Uninterrupted large panorama','Centred left-wall television','Varied illuminated city interiors','Expanded city-facing sleeping alcove','Full-wall modern glazing','Left-wall holographic TV','Large down-filled white duvet','Six oversized pillows, four opposite the TV','Seven puffy blue and magenta cat cushions in a staggered east-wall row','Pastel bathroom','Holographic desk','Helix night light','Concentric ceiling lights','Floating transparent chair','Circular luminous white rug','Kitchen','Walkable bed','Four times of day with six weather conditions and four Dark Academia presets','Moving city traffic','Occupied skybridges','Cyan and pink filigree ghosts with wind-blown gowns','Rising vent steam']}};
  scene.userData.apartment.workstation=furnishings.getObjectByName('Southern living-room workstation')?.userData.projections;
  scene.userData.apartment.northCity.kitchen.fridge=fridge.group.userData.appliance;
  scene.userData.apartment.northCity.kitchen.kettle=kettle.userData.appliance;
  return {scene,spawn:v(-2.18,1.65,3.7),lookAt:v(-3,1.47,-1.5),bounds:{minX:CITY_BED.minX+.18,maxX:CITY_BALCONY.maxX,minZ:CITY_BALCONY.minZ,maxZ:5.97},colliders,viewpoints,fieldOfView:62,ready:Promise.all(materialReady).then(()=>undefined),navigation:createCityNavigation(colliders.filter(box=>box!==bedCollider),balcony.userData.guardrailColliders),floorHeight:cityFloorHeight,environment:{weatherOptions:CITY_WEATHER_OPTIONS,timeOptions:CITY_TIME_OPTIONS,setWeather,setTimeOfDay,getSnapshot:getWeatherSnapshot},
    windowFixture:{options:cityWindow.options,setMode:cityWindow.setMode,getSnapshot:cityWindow.snapshot},
    television:television.controls,
    radio,
    holidays:holidays.controls,
    doorFixture:balcony.userData.doorFixture,
    windowAppearance:{getSettings:()=>({...windowSettings}),setSettings:setWindowSettings},
    plazaStreams:{getSpeed:()=>balconyDistrict.userData.getStreamSpeed(),setSpeed:setStreamSpeed},
    mallSigns:balconyDistrict.userData.mallSigns,
    plazaHolograms:balconyDistrict.userData.plazaHolograms,
    canWalk:(x,z,r)=>insideCityFootprint(x,z,r),
    update:(t)=>{radio.update(t);cityWindow.update(t);television.update(t);holidays.update(t);balconyDistrict.userData.update?.(Math.min(.05,Math.max(0,t-lastElapsed)),t);exterior.update(Math.min(.05,Math.max(0,t-lastElapsed)),t);lastElapsed=t;daylight.intensity=weatherProfile.sun+getCityWeatherLightning(weather,t,reducedMotion.matches)*7;},
    dispose:()=>{radio.dispose();holidays.dispose();television.dispose();balconyDistrict.userData.dispose?.();mirror.getRenderTarget().dispose();const gs=new Set<THREE.BufferGeometry>(),ms=new Set<THREE.Material>(),ts=new Set<THREE.Texture>();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Points||o instanceof THREE.Line){gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){ms.add(m);Object.values(m).forEach(a=>{if(a instanceof THREE.Texture)ts.add(a);});if(m instanceof THREE.ShaderMaterial)Object.values(m.uniforms).forEach(u=>{if(u.value instanceof THREE.Texture)ts.add(u.value);});}}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());scene.clear();}
  };
}





