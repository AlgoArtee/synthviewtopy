import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CityRoundedBoxGeometry } from './osCityGeometry';
import { createOsCityLife, CITY_BRIDGES } from './osCityLife';

import { getCityWeatherPreset, getCityLeafMotion, type CityTimeOfDay, type OsCityWeather } from './osCityWeather';
import { createCityPrecipitation } from './osCityPrecipitation';
import { createCityNeonAtmosphere } from './osCityNeonAtmosphere';
import { createCityDistantNeon } from './osCityDistantNeon';
import { createCityWindowTv, type CityWindowSettings } from './osCityWindowTv';
import { createOsCitySkylineDetail } from './osCitySkylineDetail';
import { createCityWindowHolograms, type WindowHologramRooftop } from './osCityWindowHolograms';
import { CITY_RESIDENCE_ELEVATION, CITY_EXTERIOR_OFFSET } from './osCityLayout';
export type { OsCityWeather } from './osCityWeather';
export interface OsCityExterior {
  group: THREE.Group;
  setWeather(mode: OsCityWeather,timeOfDay?:CityTimeOfDay): void;
  update(delta: number, elapsed: number): void;
  setWindowSettings(settings: CityWindowSettings): void;
}

/** An elevated, north-facing street canyon. Every object and particle remains beyond the glazing. */
export function createOsCityExterior(): OsCityExterior {
  const group = new THREE.Group(); group.name = 'North City · behind the island';
  const neonAtmosphere=createCityNeonAtmosphere('North-window street canyon');
  const distantNeon=createCityDistantNeon(neonAtmosphere,'Distant North City',20);
  const skylineDetails=createOsCitySkylineDetail(neonAtmosphere,distantNeon,'North City skyline');group.add(skylineDetails.group);
  const tvWindows=createCityWindowTv('North City residential windows');
  const tvWindowMaterials=new Map<THREE.MeshStandardMaterial,THREE.MeshStandardMaterial>();
  let tvWindowId=0;
  const snowGroup = new THREE.Group(); snowGroup.name = 'Weather-dependent accumulated snow'; group.add(snowGroup);
  const wetGroup = new THREE.Group(); wetGroup.name = 'Weather-dependent street puddles'; group.add(wetGroup);
  let seed = 142687;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const hologramRooftops: WindowHologramRooftop[] = [];
  const mat = (color: string, roughness = .68, metalness = .05) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  function texture(size: number, draw: (c: CanvasRenderingContext2D, size: number) => void) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size; draw(canvas.getContext('2d')!, size);
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  const masonryMap = texture(512, (c, s) => {
    c.fillStyle = '#b6b8bb'; c.fillRect(0, 0, s, s);
    for (let n = 0; n < 19000; n++) { const k = 128 + rnd() * 120; c.fillStyle = `rgba(${k},${k},${k},${.05 + rnd() * .18})`; c.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2, 1 + rnd() * 3); }
    for (let n = 0; n < 70; n++) { c.fillStyle = `rgba(24,38,48,${.012 + rnd() * .045})`; c.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 5, 22 + rnd() * 180); }
    c.strokeStyle = '#59626b30'; c.lineWidth = 1;
    for (let y = 0; y < s; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(s, y); c.stroke(); }
  });
  const paintColors = ['#46515b', '#354651', '#525b5c', '#304450', '#45515b', '#4e4651'];
  const walls = paintColors.map(color => new THREE.MeshStandardMaterial({ color, map: masonryMap, roughness: .85, metalness: .06 }));
  const concrete = mat('#485560', .82), edge = mat('#293a46', .54, .5), seam = mat('#1c2c37', .63, .3);
  const metal = mat('#8495a0', .41, .76), vent = mat('#435866', .65, .58), brass = mat('#8c8c75', .45, .68);
  const roof = mat('#344653', .91, .17), asphalt = mat('#142734', .94, .07);
  const roadSurface=texture(512,c=>{c.fillStyle='#8e8e8e';c.fillRect(0,0,512,512);for(let n=0;n<13000;n++){const shade=60+rnd()*120;c.fillStyle=`rgba(${shade},${shade},${shade},.25)`;c.fillRect(rnd()*512,rnd()*512,1+rnd()*3,1+rnd()*5);}for(let n=0;n<40;n++){c.fillStyle='#25374b30';c.beginPath();c.ellipse(rnd()*512,rnd()*512,6+rnd()*45,15+rnd()*90,rnd(),0,Math.PI*2);c.fill();}});roadSurface.colorSpace=THREE.NoColorSpace;roadSurface.wrapS=roadSurface.wrapT=THREE.RepeatWrapping;roadSurface.repeat.set(3,26);asphalt.roughnessMap=roadSurface;asphalt.bumpMap=roadSurface;asphalt.bumpScale=.012;
  const snow = mat('#dce5eb', .96), snowShade = mat('#c8d8e2', .94);
  const wet = new THREE.MeshPhysicalMaterial({ color: '#667f91', metalness: .86, roughness: .10, clearcoat: 1, clearcoatRoughness: .08 });
  // Independent texture seeds preserve the existing architectural and traffic layout.
  const lightingKinds=['dark','warm','cool','rose','neon'] as const;
  const windowCounts={dark:0,warm:0,cool:0,rose:0,neon:0};
  const glass=Array.from({length:24},(_,i)=>{
    const kind=lightingKinds[i<6?0:i<12?1:i<18?2:i<22?3:4];
    let state=57431+i*9173;
    const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
    const warm=kind==='warm',dark=kind==='dark',rose=kind==='rose';
    const palette=dark?['#12212b','#263946','#0c1720']:warm?['#836c51','#f1d5a3','#403d36']:rose?['#66516f','#d0a3c8','#2a293b']:['#385966','#a3c6d1','#182e3b'];
    const roomMap=texture(384,(c,s)=>{
      const vanishingX=s*(.29+random()*.42),vanishingY=s*(.29+random()*.23);
      const wall=c.createLinearGradient(0,0,s,s);wall.addColorStop(0,palette[0]);wall.addColorStop(.60,palette[1]);wall.addColorStop(1,palette[2]);c.fillStyle=wall;c.fillRect(0,0,s,s);
      // Three unequal planes, a ceiling light and a soft pool from a lamp give each room depth.
      c.fillStyle=palette[0];c.beginPath();c.moveTo(0,0);c.lineTo(vanishingX,vanishingY);c.lineTo(vanishingX,s);c.lineTo(0,s);c.fill();
      c.fillStyle=dark?'#152630':warm?'#b5a17d':'#567a88';c.beginPath();c.moveTo(0,0);c.lineTo(s,0);c.lineTo(s*.86,vanishingY*.7);c.lineTo(vanishingX,vanishingY);c.fill();
      const pool=c.createRadialGradient(s*.68,s*.43,3,s*.68,s*.43,s*.57);pool.addColorStop(0,warm?'#ffe5b990':rose?'#f8b9e56c':'#bddfe766');pool.addColorStop(1,'#00000000');c.fillStyle=pool;c.fillRect(0,0,s,s);
      const floor=c.createLinearGradient(0,s*.7,0,s);floor.addColorStop(0,palette[2]);floor.addColorStop(1,'#0b1925');c.fillStyle=floor;c.beginPath();c.moveTo(0,s);c.lineTo(vanishingX,s*.70);c.lineTo(s*.87,s*.70);c.lineTo(s,s);c.fill();
      const lampX=s*(.49+random()*.30),lampY=s*(.17+random()*.20);
      c.shadowColor=warm?'#ffdb9c':rose?'#ffa9dc':'#a2dcec';c.shadowBlur=dark?0:15;c.fillStyle=dark?'#3b4b51':warm?'#ffedca':rose?'#f2c6e8':'#d5e9ec';c.fillRect(lampX,lampY,s*(.08+random()*.19),s*.015);c.shadowBlur=0;
      // Different silhouettes of shelves, plants, desks and low sofas, rather than one repeated T shape.
      const layout=i%4;c.fillStyle='#0d202b';
      if(layout===0){c.fillRect(s*.41,s*.76,s*.46,s*.13);c.fillRect(s*.45,s*.71,s*.36,s*.08);c.fillRect(s*.45,s*.89,s*.025,s*.04);c.fillRect(s*.80,s*.89,s*.025,s*.04);}
      else if(layout===1){c.fillRect(s*.46,s*.69,s*.42,s*.025);c.fillRect(s*.50,s*.71,s*.018,s*.23);c.fillRect(s*.82,s*.71,s*.018,s*.23);c.fillRect(s*.59,s*.51,s*.16,s*.14);c.fillRect(s*.66,s*.65,s*.018,s*.04);}
      else if(layout===2){c.fillRect(s*.65,s*.39,s*.20,s*.55);for(let shelf=0;shelf<4;shelf++){c.fillStyle=palette[0];c.fillRect(s*.67,s*(.42+shelf*.12),s*.16,s*.08);for(let book=0;book<6;book++){c.fillStyle=book%2?'#213746':'#4b4c4b';c.fillRect(s*(.68+book*.024),s*(.435+shelf*.12),s*.013,s*(.045+random()*.025));}}}
      else{c.fillRect(s*.50,s*.78,s*.37,s*.15);c.fillStyle=palette[0];c.fillRect(s*.52,s*.77,s*.33,s*.025);}
      c.fillStyle='#10232b';c.fillRect(s*.22,s*.81,s*.10,s*.10);c.strokeStyle='#1a3030';c.lineWidth=3;c.beginPath();c.moveTo(s*.27,s*.82);c.lineTo(s*.27,s*.54);c.stroke();for(let leaf=0;leaf<6;leaf++){c.beginPath();c.ellipse(s*(.27+(leaf%2?1:-1)*.035),s*(.57+leaf*.034),s*.037,s*.013,leaf%2?.5:-.5,0,Math.PI*2);c.fill();}
      // Varied curtain openings and blind depths produce independent silhouettes and light/shadow ratios.
      const covering=i%6;
      if(covering===0||covering===3){const drop=s*(.25+random()*.42);for(let y=8;y<drop;y+=11){c.fillStyle=y%22?'#142a38d4':'#5a6874b8';c.fillRect(0,y,s,6);}c.fillStyle='#0e2331a8';c.fillRect(0,drop,s,3);}
      else if(covering===1||covering===4){const curtainWidth=s*(.14+random()*.24);for(const x of [0,s-curtainWidth]){const fabric=c.createLinearGradient(x,0,x+curtainWidth,0);fabric.addColorStop(0,'#182a38f0');fabric.addColorStop(.5,warm?'#6d6259e8':'#475465e8');fabric.addColorStop(1,'#112535f5');c.fillStyle=fabric;c.fillRect(x,0,curtainWidth,s);c.fillStyle='#08192570';for(let fold=8;fold<curtainWidth;fold+=15)c.fillRect(x+fold,0,4,s);}}
      if(kind==='neon'||rose){const neon=i===23?'#f380d3':'#62d9e9';c.shadowColor=neon;c.shadowBlur=12;c.fillStyle=neon;c.fillRect(s*.88,s*.25,s*.009,s*.40);if(kind==='neon')c.fillRect(s*.47,s*.25,s*.42,s*.008);c.shadowBlur=0;}
      const edgeShade=c.createLinearGradient(0,0,s,0);edgeShade.addColorStop(0,'#07152299');edgeShade.addColorStop(.20,'#00000000');edgeShade.addColorStop(.81,'#00000000');edgeShade.addColorStop(1,'#071522b0');c.fillStyle=edgeShade;c.fillRect(0,0,s,s);
      c.fillStyle=dark?'#061220b8':'#07172428';c.fillRect(0,0,s,s);
      for(let speck=0;speck<650;speck++){c.fillStyle=speck%2?'#b1ced008':'#0616260b';c.fillRect(random()*s,random()*s,1,1);}
      // Oblique blue reflection remains subtle enough to preserve interior silhouettes.
      c.fillStyle='#a4cbd70c';c.beginPath();c.moveTo(s*.12,0);c.lineTo(s*.28,0);c.lineTo(s*.73,s);c.lineTo(s*.57,s);c.fill();
    });
    const emission=texture(384,c=>{c.drawImage(roomMap.image as HTMLCanvasElement,0,0);const image=c.getImageData(0,0,384,384),px=image.data;for(let p=0;p<px.length;p+=4){const value=Math.max(px[p],px[p+1],px[p+2])/255,mask=THREE.MathUtils.smoothstep(value,.13,.64);px[p]*=mask;px[p+1]*=mask;px[p+2]*=mask;}c.putImageData(image,0,0);});
    const intensity=dark?.018+(i%6)*.009:warm?.34+(i-6)*.17:kind==='cool'?.18+(i-12)*.105:rose?.27+(i-18)*.11:.92;
    const material=new THREE.MeshStandardMaterial({color:dark?'#718a9c':'#d4dde2',map:roomMap,emissiveMap:emission,emissive:'#ffffff',emissiveIntensity:intensity,roughness:.18+(i%5)*.038,metalness:.27+(i%3)*.045});
    material.name=`City window · ${kind} interior ${i+1}`;material.userData.windowVariant={id:i,kind,emissiveIntensity:intensity};return neonAtmosphere.register(material,dark?'surface':'window');
  });
  const windowHash=(building:number,floor:number,bay:number,elevation:number)=>{let h=Math.imul(building+59,73856093)^Math.imul(floor+71,19349663)^Math.imul(bay+101,83492791)^Math.imul(elevation+7,2654435761);h=Math.imul(h^(h>>>16),2246822507);return(h^(h>>>13))>>>0;};
  function windowMaterial(building:number,floor:number,bay:number,elevation:number,roll?:number){
    const h=windowHash(building,floor,bay,elevation),r=roll??(h%10007)/10007;
    const occupiedBias=(windowHash(building,floor,0,8)%101/100-.5)*.16;
    const index=r<.32+occupiedBias?h%6:r<.70+occupiedBias?6+h%6:r<.91?12+h%6:r<.98?18+h%4:22+h%2;
    windowCounts[glass[index].userData.windowVariant.kind as keyof typeof windowCounts]++;return glass[index];
  }
  const cyan = new THREE.MeshStandardMaterial({ color: '#57dcec', emissive: '#23cdef', emissiveIntensity: 2.7, roughness: .32 });
  const pink = new THREE.MeshStandardMaterial({ color: '#ef8ec8', emissive: '#fc45b1', emissiveIntensity: 2.7, roughness: .32 });
  const amber = new THREE.MeshStandardMaterial({ color: '#ddc59e', emissive: '#f4c87a', emissiveIntensity: .5, roughness: .45 });
  neonAtmosphere.register(cyan,'neon','North city cyan luminous cores');neonAtmosphere.register(pink,'neon','North city magenta luminous cores');neonAtmosphere.register(amber,'fixture','North city amber street lamps');
  function push(g: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0, ry = 0) {
    if (g.index) { const old = g; g = g.toNonIndexed(); old.dispose(); }
    if (ry) g.rotateY(ry); g.translate(x, y, z);
    const bucket = batches.get(material) ?? []; bucket.push(g); batches.set(material, bucket);
  }
  function box(material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, bevel = 0, ry = 0) {
    push(bevel ? new CityRoundedBoxGeometry(w, h, d, 1, Math.min(bevel, w * .45, h * .45, d * .45)) : new THREE.BoxGeometry(w, h, d), material, x, y, z, ry);
  }
  function tvWindowMaterial(source:THREE.MeshStandardMaterial,inPlace=false) {
    let material=tvWindowMaterials.get(source);
    if(!material){
      material=tvWindows.material(source,'room',inPlace);
      // Local r23 window groups already belong to the atmosphere registry and
      // retain their original object so their existing neon pulse stays wired.
      if(!inPlace)neonAtmosphere.register(material,'window',material.name);
      tvWindowMaterials.set(source,material);
    }
    return material;
  }
  function residentialWindow(source:THREE.MeshStandardMaterial,x:number,y:number,z:number,w:number,h:number,d:number) {
    const geometry=new THREE.BoxGeometry(w,h,d);
    // One stable ID per complete room; the existing room map remains intact on
    // every face, and the GPU adds only independently timed interior shadows.
    tvWindows.tagGeometry(geometry,tvWindowId++,'room');
    push(geometry,tvWindowMaterial(source),x,y,z);
  }
  function pipe(material: THREE.Material, points: THREE.Vector3[], radius: number, segments = 18) {
    push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 7, false), material);
  }
  function cylinder(material: THREE.Material, x: number, y: number, z: number, radius: number, h: number, segments = 12) {
    push(new THREE.CylinderGeometry(radius, radius, h, segments), material, x, y, z);
  }
  function snowCap(x: number, y: number, z: number, w: number, d: number, thickness = .12) {
    box(snow, x, y + thickness * .4, z, w + .08, thickness, d + .10, thickness * .48);
    // Uneven melted lips and small drifts avoid perfectly flat white ledges.
    const n = Math.max(2, Math.ceil(w / 1.8));
    for (let i = 0; i < n; i++) {
      const g = new THREE.SphereGeometry(1, 8, 4); g.scale(w / n * (.4 + rnd() * .22), thickness * (.3 + rnd() * .45), .14 + rnd() * .13);
      push(g, i % 3 ? snow : snowShade, x - w * .42 + (i + .4) * w / n, y + thickness * .53, z + d * .44);
    }
  }

  // A shared emissive atlas supplies legible business typography, pictograms, borders and small print.
  const labels = [
    ['NOVA', 'COFFEE · 06—24', 'cafe'], ['LUNA', 'ROOMS / HOTEL', 'hotel'], ['NORTH', 'TRANSIT · 02', 'metro'], ['KAI', 'TEA HOUSE', 'tea'],
    ['24', 'NIGHT MARKET', 'market'], ['RAMEN', 'BROTH & NOODLES', 'ramen'], ['REPAIR', 'DEVICES · AUDIO', 'repair'], ['ORBIT', 'RECORDS', 'orbit'],
    ['HOTEL', 'LUNA / 24H', 'vertical'], ['CAFÉ', 'NOVA / 03', 'vertical'], ['夜市', 'NIGHT MARKET', 'vertical'], ['電脳', 'NORTH CITY', 'vertical'],
    ['M', 'NORTH LINE 02', 'metro'], ['OPEN', 'UNTIL 02:00', 'market'], ['ATELIER', 'FORM / LIGHT', 'orbit'], ['PHARM', 'NIGHT SERVICE', 'repair'],
  ];
  const signAtlas = texture(2048, (c) => {
    labels.forEach(([name, sub, icon], n) => {
      const x = n % 4 * 512, y = Math.floor(n / 4) * 512;
      const color = ['#39e0f7','#ee7ac3','#7bddf6','#83e2c4','#ffc582','#f3998c','#83dabb','#b8a0f3','#e785c9','#70dcec','#f2c088','#b8a0f3','#83b3f0','#8edfc4','#e99fbf','#a5dfbd'][n];
      c.fillStyle = '#233845'; c.fillRect(x, y, 512, 512);
      c.fillStyle = '#314854'; c.fillRect(x + 10, y + 10, 492, 492);
      c.strokeStyle = color; c.lineWidth = 5; c.strokeRect(x + 27, y + 28, 458, 456);
      c.strokeStyle = '#8ea8b3'; c.lineWidth = 1; c.strokeRect(x + 39, y + 40, 434, 432);
      c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (icon === 'vertical') {
        c.font = '600 72px Arial'; [...name].forEach((letter, j) => c.fillText(letter, x + 256, y + 77 + j * (310 / Math.max(name.length - 1, 1))));
        c.font = '18px Arial'; c.fillText(sub, x + 256, y + 446);
      } else {
        c.save(); c.translate(x + 256, y + 137); c.strokeStyle = color; c.lineWidth = 6;
        if (icon === 'cafe' || icon === 'tea') { c.strokeRect(-38, -27, 65, 53); c.beginPath(); c.arc(34, -4, 19, -Math.PI / 2, Math.PI / 2); c.stroke(); c.beginPath(); c.moveTo(-48, 37); c.lineTo(47, 37); c.stroke(); }
        else if (icon === 'ramen') { c.beginPath(); c.arc(0, -8, 48, 0, Math.PI); c.moveTo(-58, -10); c.lineTo(58, -10); c.moveTo(-18, -52); c.lineTo(-4, -13); c.moveTo(4, -52); c.lineTo(16, -13); c.stroke(); }
        else if (icon === 'hotel') { c.beginPath(); c.arc(0, 0, 48, -.45, Math.PI * 1.55); c.stroke(); c.fillRect(5, -13, 7, 7); }
        else if (icon === 'repair') { c.strokeRect(-35, -43, 70, 86); c.beginPath(); c.moveTo(-19, 0); c.lineTo(19, 0); c.moveTo(0, -19); c.lineTo(0, 19); c.stroke(); }
        else if (icon === 'metro') { c.font = '700 85px Arial'; c.fillText('M', 0, 0); c.beginPath(); c.arc(0, 0, 61, 0, Math.PI * 2); c.stroke(); }
        else { c.beginPath(); c.ellipse(0, 0, 60, 21, -.35, 0, Math.PI * 2); c.arc(0, 0, 32, 0, Math.PI * 2); c.stroke(); }
        c.restore();
        c.font = `600 ${name.length > 6 ? 63 : name.length > 4 ? 74 : 101}px Arial`; c.fillText(name, x + 256, y + 287);
        c.font = '23px Arial'; c.fillText(sub, x + 256, y + 385);
        c.font = '15px Arial'; c.fillStyle = '#a9bbc4'; c.fillText(`N / ${String(n + 11).padStart(3, '0')}   ·   NORTH CITY`, x + 256, y + 440);
      }
    });
  });
  // Only the lettering, icons and neon perimeter emit; the physical sign chassis remains dark.
  const signEmission = texture(2048, c => {
    c.drawImage(signAtlas.image as HTMLCanvasElement, 0, 0);
    const image = c.getImageData(0, 0, 2048, 2048), px = image.data;
    for (let i = 0; i < px.length; i += 4) {
      if (Math.max(px[i], px[i + 1], px[i + 2]) < 108) px[i] = px[i + 1] = px[i + 2] = 0;
    }
    c.putImageData(image, 0, 0);
  });
  const signMaterial = new THREE.MeshStandardMaterial({ map: signAtlas, emissiveMap: signEmission, emissive: '#ffffff', emissiveIntensity: 3.1, roughness: .75, metalness: .04, side: THREE.DoubleSide });
  neonAtmosphere.register(signMaterial,'neon','North city masked sign lettering and icons');
  let businessSignCount=0,distantSignCount=0;
  function sign(tile: number, x: number, y: number, z: number, w: number, h: number, rotation: number) {
    businessSignCount++;
    // Double-sided boards have an actual chassis, projecting outriggers and a metal perimeter.
    box(edge, x, y, z, w + .10, h + .10, .11, .035, rotation);
    const offset = (u: number, depth: number) => [x + Math.cos(rotation) * u + Math.sin(rotation) * depth, z - Math.sin(rotation) * u + Math.cos(rotation) * depth];
    const surface = offset(0, .061), g = new THREE.PlaneGeometry(w, h);
    const uv = g.getAttribute('uv'), col = tile % 4, row = Math.floor(tile / 4);
    for (let i = 0; i < uv.count; i++) { uv.setXY(i, (col + .003 + uv.getX(i) * .994) / 4, 1 - (row + .997 - uv.getY(i) * .994) / 4); }
    const localSign=z<-55&&businessSignCount%5===0&&distantSignCount<3?distantNeon.localized(tile,29173+businessSignCount*103,'Canyon sign '+(++distantSignCount),signMaterial):signMaterial;
    push(g, localSign, surface[0], y, surface[1], rotation);
    for (const u of [-w / 2 - .025, w / 2 + .025]) { const p = offset(u, .04); box(metal, p[0], y, p[1], .035, h + .05, .025, 0, rotation); }
    for (const dy of [-h / 2 - .025, h / 2 + .025]) box(metal, surface[0], y + dy, surface[1], w + .06, .035, .025, 0, rotation);
    const neon = tile % 2 ? pink : cyan;
    for (const u of [-w / 2 + .025, w / 2 - .025]) { const p = offset(u, .079); box(neon, p[0], y, p[1], .014, h - .045, .014, 0, rotation); }
    for (const dy of [-h * .35, h * .35]) { const p = offset(0, -.26); box(vent, p[0], y + dy, p[1], .11, .10, .54, 0, rotation); }
    snowCap(x, y + h / 2 + .09, z, Math.max(w, .6), .19, .08);
  }

  // A building has a front elevation facing the apartment plus a detailed side elevation facing the street.
  function building(x: number, z: number, w: number, depth: number, height: number, side: -1 | 1, index: number) {
    const bottom = -10.6, top = bottom + height, face = z + depth / 2, inner = x - side * w / 2;
    // The second canyon row and lateral skyline have readable room-sized
    // windows in the apartment view. Include them alongside the far towers;
    // the nearest neighbors and street-level storefronts remain unchanged.
    const wall = walls[index % walls.length];
    box(wall, x, bottom + height / 2, z, w, height, depth, .055);
    box(seam, x, bottom + height / 2, face + .015, w - .12, height - .15, .035);
    // Structural piers separate recessed glazing bays on both visible elevations.
    const floors = Math.floor(height / 1.55), bayCount = Math.max(3, Math.floor(w / 1.15));
    for (let level = 0; level < floors; level++) {
      const y = bottom + .8 + level * 1.55;
      const projecting = (level + index) % 3 === 0;
      box(concrete, x, y - .63, face + (projecting ? .21 : .04), w + .10, .13, projecting ? .64 : .16);
      if (projecting) snowCap(x, y - .55, face + .22, w + .16, .66, .09 + rnd() * .045);
      for (let j = 0; j < bayCount; j++) {
        const wx = x - w / 2 + (j + .5) * w / bayCount, ww = w / bayCount - .20;
        box(wall, wx, y, face + .015, w / bayCount, 1.4, .04);
        box(seam, wx, y + .04, face + .046, ww + .13, 1.01, .06);
        residentialWindow(windowMaterial(index,level,j,0,rnd()), wx, y + .05, face + .081, ww, .88, .028);
        box(metal, wx, y + .05, face + .105, .035, .93, .035);
        box(metal, wx, y - .20, face + .105, ww, .022, .035);
        if(windowHash(index,level,j,5)%7===0){const drop=.12+(windowHash(index,level,j,6)%100)/100*.40;box(wall,wx,y+.49-drop/2,face+.124,ww-.02,drop,.016);}
        if (projecting && j % 2 === index % 2) {
          box(edge, wx, y - .20, face + .49, ww + .12, .028, .028);
          for (const dx of [-.38, 0, .38]) box(edge, wx + dx * ww, y - .37, face + .49, .024, .38, .024);
        }
      }
      const sideBays = Math.max(3, Math.floor(depth / 1.35));
      box(concrete, inner - side * .08, y - .63, z, .27, .12, depth + .10);
      if (projecting) snowCap(inner - side * .11, y - .55, z, .52, depth + .11, .1);
      for (let j = 0; j < sideBays; j++) {
        const wz = z - depth / 2 + (j + .5) * depth / sideBays;
        box(seam, inner - side * .02, y, wz, .035, 1.04, .96);
        residentialWindow(windowMaterial(index,level,j,1,rnd()), inner - side * .045, y, wz, .025, .91, .81);
        box(metal, inner - side * .066, y, wz, .026, .95, .033);
        box(metal, inner - side * .066, y - .16, wz, .026, .024, .86);
      }
      // Wall-mounted HVAC has a recessed fan circle, fins, bracket and paired refrigerant pipes.
      if ((level + index) % 3 === 1 && level < 13) {
        const ax = x + w * .29, ay = y - .01, az = face + .29;
        box(metal, ax, ay, az, .63, .38, .40, .025);
        const fan = new THREE.CylinderGeometry(.115, .115, .024, 14); fan.rotateX(Math.PI / 2); push(fan, seam, ax + .13, ay, az + .212);
        const rim = new THREE.TorusGeometry(.118, .009, 5, 16); push(rim, metal, ax + .13, ay, az + .229);
        for (let fin = 0; fin < 5; fin++) box(vent, ax - .16, ay - .12 + fin * .059, az + .212, .18, .016, .026);
        box(edge, ax, ay - .23, az - .03, .72, .05, .55);
        snowCap(ax, ay + .21, az, .65, .4, .075);
      }
    }
    for (const dx of [-.48, .48]) box(wall, x + dx * w, bottom + height / 2, face + .16, .19, height, .31);
    const pipeX = x - w * .37;
    pipe(brass, [v(pipeX, bottom, face + .22), v(pipeX, -1, face + .22), v(pipeX + .23, -.4, face + .22), v(pipeX + .23, top - .5, face + .22)], .043, 10);
    for (let y = bottom + 1; y < top; y += 3.1) box(edge, pipeX + (y > -.4 ? .23 : 0), y, face + .23, .15, .06, .15);
    // Roof setbacks, raised parapets, steel water tank, louvered plant and aerial cluster.
    box(roof, x, top + .025, z, w, .11, depth);
    for (const dx of [-w / 2, w / 2]) { box(concrete, x + dx, top + .23, z, .15, .43, depth + .13); snowCap(x + dx, top + .48, z, .23, depth + .16, .12); }
    for (const dz of [-depth / 2, depth / 2]) { box(concrete, x, top + .23, z + dz, w, .43, .15); snowCap(x, top + .48, z + dz, w + .12, .23, .12); }
    const hutW = w * .47, hutD = depth * .43;
    box(wall, x + side * w * .12, top + .74, z - depth * .13, hutW, 1.48, hutD, .04);
    if (index === 2 || index === 1 || index === 3) {
      hologramRooftops.push({ buildingId: index,
        position: index === 1
          ? [x - w * .28, top + .08, z - depth * .13]
          : [x + side * w * .12, top + 1.48, z - depth * .13] });
    }
    snowCap(x + side * w * .12, top + 1.51, z - depth * .13, hutW + .16, hutD + .17, .18);
    box(vent, x - w * .22, top + .41, z + depth * .12, 1.15, .74, .84);
    for (let l = 0; l < 7; l++) box(metal, x - w * .22, top + .15 + l * .087, z + depth * .12 + .44, 1.07, .025, .025);
    if (index % 2 === 0) {
      const tx = x + w * .24, tz = z - depth * .13;
      for (const dx of [-.34, .34]) for (const dz of [-.34, .34]) box(edge, tx + dx, top + 1.9, tz + dz, .045, 1.1, .045);
      cylinder(metal, tx, top + 2.7, tz, .60, 1.02, 16); cylinder(edge, tx, top + 2.2, tz, .64, .07, 16);
      const lid = new THREE.SphereGeometry(.63, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); lid.scale(1, .22, 1); push(lid, snow, tx, top + 3.22, tz);
      cylinder(metal, tx, top + 3.21, tz, .61, .04, 16);
    }
    const antennaX = x - side * w * .28;
    cylinder(edge, antennaX, top + 2.7, z - depth * .2, .035, 4.3, 7);
    for (let i = 0; i < 4; i++) box(metal, antennaX, top + 2.4 + i * .37, z - depth * .2, 1.2 - i * .18, .025, .025);
    if (index >= 2 && index < 12) {
      const sy = .9 + (index % 3) * 1.8;
      sign(index % 8, x - w * .14, sy, face + .56, 1.65, 1.31, 0);
      // Narrow projecting boards face the apartment and sit just inside the street line.
      sign(8 + index % 4, inner - side * .36, 3.2 + index % 3 * .55, face - .6, .72, 2.85, side * .23);
      if (index < 8) sign(index % 8, inner - side * .77, .95 + index % 3 * .70, face - 1.4, 2.25, 1.38, side * .18);
      sign(12 + index % 4, inner - side * .17, -3.8 + index % 2 * .7, z + depth * .12, 1.1, 1.1, -side * Math.PI / 2);
    }
    if (index < 7) {
      // A facade maintenance ladder and a gently sagging service bundle.
      const lx = x + w * .36;
      for (const dx of [-.20, .20]) cylinder(edge, lx + dx, top - 2, face + .22, .017, 4.4, 6);
      for (let i = 0; i < 15; i++) box(metal, lx, top - 4.15 + i * .29, face + .22, .4, .02, .035);
      pipe(seam, [v(inner, 5.7, face - 1), v(inner - side * .45, 5.1, z), v(inner, 5.6, z - depth * .5)], .018, 14);
    }
  }

  box(asphalt, -3, -10.79, -72, 10.2, .18, 137);
  const lanePaint = new THREE.MeshStandardMaterial({color:'#bdc3ad',roughness:.51,emissive:'#c5a76e',emissiveIntensity:.09});
  for(let z=-8;z>-138;z-=4.2){box(lanePaint,-3,-10.685,z,.075,.008,2.1);for(const x of [-5.16,-.84])box(lanePaint,x,-10.685,z,.055,.008,1.9);}
  for(const x of [-7.22,1.22])box(lanePaint,x,-10.685,-72,.055,.008,133);
  for (const side of [-1, 1] as const) {
    box(concrete, -3 + side * 4.72, -10.62, -70, .92, .25, 131);
    for (let z = -9; z > -137; z -= 4.2) box(seam, -3 + side * 4.72, -10.483, z, .88, .012, .025);
    for (let i = 0; i < 7; i++) {
      const z = -14 - i * 11.4 - (side === 1 ? 1.9 : 0);
      const w = 4.7 + rnd() * 2.0, d = 6.4 + rnd() * 2.6;
      const x = -3 + side * (5.1 + w / 2 + (i % 3 === 1 ? .6 : 0));
      building(x, z, w, d, 19 + rnd() * 18 + i * 1.1, side, i * 2 + (side === 1 ? 1 : 0));
    }
  }
  // Distant staggered towers frame a readable central vista instead of closing the canyon.
  for (let i = 0; i < 13; i++) {
    const x = -34 + i * 5.3, z = -109 - rnd() * 33, h = 28 + rnd() * 43;
    const w = 3 + rnd() * 4, d = 4 + rnd() * 4, y0 = -12;
    box(walls[i % walls.length], x, y0 + h / 2, z, w, h, d, .04);
    box(roof, x, y0 + h + 1, z, w * .59, 2, d * .64);
    snowCap(x, y0 + h + 2.06, z, w * .63, d * .69, .2);
    const localWindows=i===1||i===10?distantNeon.localized(i,36709+i*193,'North tower '+i+' local window group',glass[12+i%6]):undefined;
    if(localWindows)tvWindowMaterial(localWindows,true);
    for (let floor = -6; floor < y0 + h; floor += 2.4) {
      for (let k = 0; k < 3; k++) {
        const window=windowMaterial(i+30,Math.round(floor*10),k,0);
        const inLocalGroup=localWindows&&k<2&&floor>y0+h*.55&&floor<y0+h*.55+5;
        residentialWindow(inLocalGroup?localWindows:window, x + (k - 1) * w * .28, floor, z + d / 2 + .025, w * .16, 1.2, .06);
      }
    }
    if(i%4!==3){
      const light=i!==1&&i!==10?distantNeon.localized(i*3+1,31847+i*137,'North tower '+i+' local accent'):distantNeon.material(i*3+1);
      if(i%3===0){
        box(light,x+w*.3,y0+h*.68,z+d/2+.1,.10,h*.34,.05);
        box(light,x,y0+h*.86,z+d/2+.1,w*.59,.10,.05);
      }else if(i%3===1){
        for(let band=0;band<3;band++)box(light,x-w*.08+band*w*.08,y0+h*(.64+band*.078),z+d/2+.1,w*(.65-band*.12),.11,.05);
      }else{
        for(const side of [-1,1]){
          box(light,x+side*w*.29,y0+h*.70,z+d/2+.1,.09,h*.18,.05);
          box(light,x,y0+h*(.70+side*.09),z+d/2+.1,w*.58,.09,.05);
        }
      }
    }
    if(i%3===0){cylinder(metal,x,y0+h+4,z,.08,6,8);sign(10+i%6,x,y0+h*.45,z+d/2+.15,w*.72,1.85,0);}
    skylineDetails.decorate({x,z,width:w,depth:d,height:h,groundY:y0,roofY:y0+h+2,rotation:0,index:i+300});
  }
  // A landmark in the central distance adds scale without creating a wall across the near view.
  cylinder(walls[2], -3.9, 12, -153, 3.1, 49, 12); cylinder(metal, -3.9, 39.2, -153, 1.75, 5.5, 12);
  cylinder(edge, -3.9, 46.4, -153, .1, 11, 8); box(distantNeon.localized(3,38723,'North distant landmark strip'), -3.9, 29, -149.83, .12, 12, .1);
  skylineDetails.decorate({x:-3.9,z:-153,width:6.2,depth:6.2,height:49,groundY:-12.5,roofY:41.95,rotation:0,index:302});skylineDetails.finish();

  function bridge(z: number, y: number, w: number) {
    box(edge, -3, y, z, w, .25, 1.35); box(concrete, -3, y + .25, z, w, .23, 1.55);
    for (const dz of [-.68, .68]) {
      box(metal, -3, y + 1.18, z + dz, w, .05, .05);
      for (let x = -3 - w / 2; x < -3 + w / 2; x += .85) box(metal, x, y + .75, z + dz, .035, .86, .035);
    }
    snowCap(-3, y + .40, z, w + .08, 1.58, .12);
    const transit = new THREE.CylinderGeometry(.27, .27, w, 18); transit.rotateZ(Math.PI / 2); push(transit, metal, -3, y - .5, z - .68);
    for (let x = -3 - w / 2; x < -3 + w / 2; x += 1.5) { const collar = new THREE.TorusGeometry(.29, .026, 6, 18); collar.rotateY(Math.PI / 2); push(collar, edge, x, y - .5, z - .68); }
  }
  for(const b of CITY_BRIDGES) bridge(b.z,b.y,b.width);
  // Service pipe follows the right canyon edge with elbows, flanges and threaded hangers.
  pipe(metal, [v(2.38, 6.8, -8.5), v(2.38, 6.8, -28), v(2.8, 7.2, -31), v(2.8, 7.2, -74)], .24, 38);
  for (let z = -10; z > -68; z -= 3.2) { const g = new THREE.TorusGeometry(.255, .022, 6, 18); push(g, edge, z > -28 ? 2.38 : 2.8, z > -28 ? 6.8 : 7.2, z); box(edge, 2.85, 7.63, z, 1, .045, .045); }
  pipe(seam, [v(-8.1, 6.4, -22), v(-3, 5.0, -24), v(2.4, 6.2, -22)], .014, 25);
  pipe(seam, [v(-8.1, 6.7, -22), v(-3, 5.22, -24), v(2.4, 6.48, -22)], .009, 25);
  // Dense, anchored utility bundles hang along both facades and across the canyon.
  for(const side of [-1,1]) for(let section=0;section<6;section++) {
    const a=-9-section*16.5,b=a-15.5,wallX=-3+side*5.06;
    for(const baseY of [-6,-2,2.2,6.4]) {
      for(let strand=0;strand<5;strand++) {
        const y=baseY+strand*.105,sag=.65+rnd()*1.25;
        pipe(seam,[v(wallX,y,a),v(wallX-side*.16,y-sag*.8,a-4),v(wallX-side*.3,y-sag,(a+b)/2),v(wallX-side*.1,y-.3,b+2),v(wallX,y+.16,b)],.012+(strand%3)*.005,22);
      }
      box(metal,wallX,baseY+.3,a,.16,.72,.18);box(edge,wallX-side*.2,baseY+.22,a,.45,.07,.12);
    }
  }
  for(const z of [-24,-43,-64])for(let strand=0;strand<4;strand++)pipe(seam,[v(-8.04,3.3+strand*.11,z),v(-3,1.85+strand*.09,z-1.2),v(2.04,3.15+strand*.1,z)],.015,28);
  for(const side of [-1,1]) {
    const x=-3+side*5.02;
    for(let bundle=0;bundle<3;bundle++)for(let strand=0;strand<9;strand++){
      const z=-10-bundle*11,y=5.7-bundle*3+strand*.073,sag=1.6+(strand%4)*.18;
      pipe(seam,[v(x,y,z),v(x-side*.24,y-sag,z-3.4),v(x-side*.38,y-sag*1.26,z-6.3),v(x,y+.21,z-10.3)],.018+(strand%3)*.005,26);
    }
    for(let n=0;n<5;n++){
      const z=-13-n*12.5,cy=-3.2+(n%3)*3.4;
      for(let k=0;k<3;k++){
        box(vent,x-side*.17,cy+k*.52,z,.31,.40,.76,.035);
        for(let fin=0;fin<5;fin++)box(metal,x-side*.34,cy+k*.52-.14+fin*.07,z,.025,.018,.61);
      }
      pipe(brass,[v(x,cy-1,z-.36),v(x-side*.22,cy-.7,z-.36),v(x-side*.22,cy+1.8,z-.36)],.045,12);
    }
  }
  // Street-level awnings and recessed storefronts anchor the apartment's elevated viewpoint.
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? 1 : -1, z = -13 - Math.floor(i / 2) * 17;
    const x = -3 + side * 5.6;
    box(vent, x, -8.73, z, .62, 2.85, 3.4);
    box(windowMaterial(i+50,0,0,2), x - side * .34, -8.67, z, .055, 2.5, 2.9);
    box(i % 3 ? edge : pink, x - side * .35, -7.15, z, 1.05, .14, 3.65);
    snowCap(x - side * .35, -7.03, z, 1.11, 3.74, .12);
    cylinder(edge, -3 + side * 4.56, -8.2, z + 3.0, .052, 4.8, 8);
    box(amber, -3 + side * 4.35, -5.75, z + 3.0, .45, .11, .24, .025);
  }
  // The two foreground businesses and vertical cafe board anchor the supplied composition.
  sign(0,-7.0,.25,-10.8,2.45,1.65,.08);
  sign(1,1.55,1.30,-12.2,2.15,1.55,-.1);
  sign(9,1.65,4.35,-15.0,.78,3.55,-.1);
  sign(1,1.22,-1.1,-23.7,1.85,1.30,-.08);
  sign(11,-6.6,8.2,-39,.72,2.7,.03);sign(10,.8,7.1,-48,.64,2.5,-.06);
  sign(8,-6.4,-3.2,-18,.62,2.6,.08);sign(11,1.1,-4.2,-31,.64,2.7,-.06);
  // Local neon spill and street lamps light the nearby wet masonry, cables and asphalt.
  for(const [x,y,z,color,power,range] of [
    [-6.0,.6,-9.0,'#45d9ee',10,7.5],[.5,1.6,-10.4,'#f767c2',11,7.5],
    [.5,4.5,-13.2,'#70d9f0',9,6.5],[0,-.7,-21.9,'#ec64c0',10,7],
    [-7.2,-5.8,-10,'#ffd5a0',24,8],[1.2,-5.8,-23.3,'#c1e3f7',22,8],
  ] as const){const light=new THREE.PointLight(color,power,range,2);light.position.set(x,y,z);light.name='North City · localized sign and street lighting';group.add(light);neonAtmosphere.registerLight(light);}
  const streetFill=new THREE.RectAreaLight('#b2d3e5',.75,10,62);streetFill.position.set(-3,14,-40);streetFill.lookAt(-3,-10.7,-40);streetFill.name='North City · broad overcast sky bounce';group.add(streetFill);
  const puddleGeometries: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 22; i++) {
    const x = -3 + (rnd() - .5) * 10, z = -10 - rnd() * 109;
    const g = new THREE.CircleGeometry(1, 16); g.rotateX(-Math.PI / 2); g.scale(.3 + rnd() * 1.5, 1, .8 + rnd() * 2.2); g.translate(x, -10.688, z);
    puddleGeometries.push(g);
    if (i < 12) snowCap(x, -10.64, z, .7 + rnd() * 1.2, .7 + rnd() * 1.4, .065);
  }
  const puddles = new THREE.Mesh(mergeGeometries(puddleGeometries, false), wet); puddles.name = 'Batched wet street puddles'; puddles.receiveShadow = true; wetGroup.add(puddles); puddleGeometries.forEach(g => g.dispose());
  // Panoramic glazing reveals lateral blocks which the former narrow arch concealed.
  // Add independently proportioned architecture rather than stretching the central canyon.
  const lateralBlocks=[
    {x:-17.2,z:-12.6,w:6.1,d:6.4,h:27.3,side:-1,index:14},
    {x:11.4,z:-14.1,w:6.5,d:7.2,h:32.2,side:1,index:15},
    {x:-23.6,z:-27.8,w:7.0,d:9.2,h:35.8,side:-1,index:16},
    {x:18.5,z:-30.2,w:7.8,d:8.4,h:29.7,side:1,index:17},
    {x:-17.3,z:-48.3,w:6.3,d:8.1,h:41.2,side:-1,index:18},
    {x:12.6,z:-53.1,w:7.1,d:9.1,h:46.5,side:1,index:19},
  ];
  for(const b of lateralBlocks){
    building(b.x,b.z,b.w,b.d,b.h,b.side as -1|1,b.index);
    const face=b.z+b.d/2;
    sign((b.index+2)%8,b.x+b.w*.18,1.1+(b.index%3)*1.35,face+.56,1.7,1.20,b.side*.04);
    sign(8+b.index%4,b.x-b.side*b.w*.38,4.4,face+.42,.61,2.60,0);
    // Irregular balcony stacks, services and shallow roof canopies give side views depth.
    for(let level=0;level<5;level++){
      const y=-6.9+level*2.7,x=b.x-b.side*b.w*.17;
      box(concrete,x,y,face+.49,2.25,.14,1.12);
      snowCap(x,y+.10,face+.49,2.30,1.15,.11);
      box(edge,x,y+.65,face+1.01,2.22,.035,.035);
      for(const dx of [-1,-.5,0,.5,1])box(metal,x+dx,y+.37,face+1.01,.025,.56,.025);
      box(vent,x+b.side*1.2,y+.46,face+.27,.41,.58,.42,.025);
    }
    pipe(seam,[v(b.x-b.w*.42,5.8,face+.3),v(b.x,4.3,face+.5),v(b.x+b.w*.42,5.7,face+.3)],.022,20);
  }
  // The street podium is 3.22m above Circuit Market. Its unused southeast
  // corner must stop at the plaza edge, otherwise it roofs over four near
  // circuit lanes. Retain the full rear slab beneath the lateral buildings.
  const podiumFront=-9.4,plazaEdge=8-CITY_EXTERIOR_OFFSET.x;
  box(concrete,-3,-10.79,(-37+podiumFront)/2,56,.16,podiumFront+37);
  box(concrete,(-31+plazaEdge)/2,-10.79,(podiumFront-5)/2,plazaEdge+31,.16,-5-podiumFront);
  // Single mesh per material keeps detailed facades affordable in the room renderer.
  for (const [material, geometries] of batches) {
    const merged = mergeGeometries(geometries, false); geometries.forEach(g => g.dispose());
    const mesh = new THREE.Mesh(merged, material); mesh.name = material === signMaterial ? 'Framed North City business sign atlas' : material.userData.windowVariant ? material.name : 'Batched city architecture';
    mesh.castShadow = false; mesh.receiveShadow = true;
    (material === snow || material === snowShade ? snowGroup : group).add(mesh);
  }

  // The same line rain, snow size, density factor and metre/second wind as the
  // balcony. This district is translated only, so axes match world weather.
  const precipitation=createCityPrecipitation('North-window weather',142687,[
    {name:'street canyon',capacity:1500,minX:-24,maxX:18,minY:-12,maxY:25+CITY_RESIDENCE_ELEVATION,minZ:-84.8,maxZ:-4.8},
  ]);
  group.add(precipitation.group);
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const life=createOsCityLife();group.add(life.group);group.userData.life=life.group.userData.animation;
  const windowHolograms=createCityWindowHolograms(hologramRooftops);group.add(windowHolograms.group);
  group.userData.windowHolograms=windowHolograms.snapshot;
  group.userData.ready=Promise.all([life.group.userData.ready,windowHolograms.ready]);
  // Small physical leaves stay outside the glazing; seven restrained autumn tones.
  const autumnGroup=new THREE.Group();autumnGroup.name='Dark Academia · late-autumn wind and leaf collections';group.add(autumnGroup);
  const leafMap=texture(64,c=>{c.fillStyle='#fff';c.beginPath();c.moveTo(8,34);c.bezierCurveTo(14,13,35,8,57,12);c.bezierCurveTo(57,37,39,54,8,34);c.fill();c.strokeStyle='#72624b';c.lineWidth=1.7;c.beginPath();c.moveTo(8,34);c.lineTo(53,15);c.stroke();for(let n=0;n<4;n++){c.beginPath();c.moveTo(16+n*8,30-n*3);c.lineTo(20+n*8,17-n);c.stroke();}});
  const leafMaterial=new THREE.MeshStandardMaterial({color:'#fff',map:leafMap,alphaTest:.5,side:THREE.DoubleSide,roughness:.97});
  const leafGeometry=new THREE.PlaneGeometry(.16,.085),leafColors=['#66704a','#77623c','#9d733d','#a35a38','#967246','#8b8160','#827c69'];
  const fallingLeaves=new THREE.InstancedMesh(leafGeometry,leafMaterial,120),settledLeaves=new THREE.InstancedMesh(leafGeometry,leafMaterial,320);fallingLeaves.name='Wind-driven individual autumn leaves';settledLeaves.name='Uneven damp leaf collections at street edges';autumnGroup.add(fallingLeaves,settledLeaves);
  const leafDummy=new THREE.Object3D(),leafSeeds=Array.from({length:120},()=>({x:-9+rnd()*12,y:-9+rnd()*29,z:-8-rnd()*62,phase:rnd()*6.28,speed:.22+rnd()*.43}));
  for(let i=0;i<320;i++){leafDummy.position.set(i%2?-9.1+rnd()*.8:2.3+rnd()*.8,-10.665+rnd()*.012,-9-rnd()*109);leafDummy.rotation.set(-Math.PI/2+(rnd()-.5)*.12,0,rnd()*6.28);leafDummy.scale.setScalar(.65+rnd()*.9);leafDummy.updateMatrix();settledLeaves.setMatrixAt(i,leafDummy.matrix);settledLeaves.setColorAt(i,new THREE.Color(leafColors[i%leafColors.length]));}
  for(let i=0;i<120;i++)fallingLeaves.setColorAt(i,new THREE.Color(leafColors[i%leafColors.length]));
  function updateLeaves(t:number){leafSeeds.forEach((l,i)=>{const fallHeight=29+CITY_RESIDENCE_ELEVATION,motion=getCityLeafMotion(group.userData.weather??'rain',t,l.phase,l.speed,fallHeight);leafDummy.position.set(l.x+motion.dx,20+CITY_RESIDENCE_ELEVATION-motion.age*fallHeight,l.z+motion.dz);leafDummy.rotation.set(motion.rx,motion.ry,motion.rz);leafDummy.scale.setScalar(.7+(i%7)*.08);leafDummy.updateMatrix();fallingLeaves.setMatrixAt(i,leafDummy.matrix);});fallingLeaves.instanceMatrix.needsUpdate=true;}
  updateLeaves(0);
  let timeOfDay:CityTimeOfDay='day';
  function setWeather(mode: OsCityWeather,time:CityTimeOfDay='day') {
    windowHolograms.setWeather(mode,time);
    timeOfDay=time;life.setWeather(mode,time);precipitation.setWeather(mode,time);neonAtmosphere.setWeather(mode,time);skylineDetails.setWeather(mode,time);const p=getCityWeatherPreset(mode,time),raining=p.precipitation==='rain';
    snowGroup.visible=mode==='snow';wetGroup.visible=p.wetness>.2;autumnGroup.visible=p.autumn;
    fallingLeaves.count=mode==='academic-rainy-dusk'?40:120;
    streetFill.color.set(p.color);streetFill.intensity=.75*p.ambient/.28;
    asphalt.roughness=THREE.MathUtils.lerp(.94,.22,p.wetness);asphalt.metalness=THREE.MathUtils.lerp(.07,.27,p.wetness);
    walls.forEach(m=>{m.roughness=THREE.MathUtils.lerp(.85,.50,p.wetness);});
    concrete.roughness=THREE.MathUtils.lerp(.82,.41,p.wetness);roof.roughness=THREE.MathUtils.lerp(.91,.24,p.wetness);
    group.userData.weather=mode;group.userData.timeOfDay=timeOfDay;group.userData.snowAccumulationVisible=snowGroup.visible;group.userData.rainWetness=raining;
    group.userData.weatherEffects={precipitation:p.precipitation,particleCount:precipitation.snapshot().particleCount,wetness:p.wetness,autumnLeaves:p.autumn,fallingLeafCount:p.autumn?fallingLeaves.count:0,settledLeafCount:p.autumn?320:0};
  }
  group.userData.getWeatherSnapshot=()=>({...precipitation.snapshot(),timeOfDay,shelterDry:true,precipitationBoundaryZ:-4.8,wetness:getCityWeatherPreset(group.userData.weather as OsCityWeather,timeOfDay).wetness,autumnLeaves:autumnGroup.visible?fallingLeaves.count:0,lighting:neonAtmosphere.snapshot(),distantNeon:distantNeon.snapshot(),tvWindows:tvWindows.snapshot(),skylineDetails:skylineDetails.snapshot(),skyFill:{intensity:streetFill.intensity,color:streetFill.color.toArray()}});
  setWeather('rain');
  group.userData.exterior = { buildingCount: 34, panoramicLateralBlocks: 6, businessSignCount, windowLighting:{variants:glass.length,counts:windowCounts,emissiveRange:[Math.min(...glass.map(m=>m.emissiveIntensity)),Math.max(...glass.map(m=>m.emissiveIntensity))],independentRoomLayouts:4,variableCurtainsAndBlinds:true,seed:57431}, precipitationBoundaryZ: -4.8, seeded: true, features: ['Individually varied dark, warm, cool and occasional neon interiors','Variable curtains, blind depths and local room shadows','Six detailed lateral blocks for the full-wall panorama','Recessed multi-elevation glazing', 'Balconies and HVAC fans', 'Setback roofs, tanks and antennas', 'Framed typography and pictograms', 'Dimensional skybridges and conduits', 'Weather-dependent snow and wet materials','Moving lane traffic and reflected lights','Occupied pedestrian bridges','Cyan and pink dimensional human holograms','Dense anchored cable bundles','Rising vent steam'] };
  return { group, setWeather, setWindowSettings: tvWindows.setSettings, update(delta, elapsed) {
    windowHolograms.update(elapsed);
    distantNeon.update(elapsed,reducedMotion.matches,timeOfDay);
    tvWindows.update(elapsed,reducedMotion.matches,timeOfDay);
    if(!reducedMotion.matches){life.update(elapsed);if(autumnGroup.visible)updateLeaves(elapsed);}
    precipitation.update(delta,elapsed);
  } };
}
