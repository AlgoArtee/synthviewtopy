import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { createBankerLamp, createBath, createBed, createChesterfield, createCoffeeTable, createDeskChair, createKitchenSink, createMug, createReadingChair, createTeapot, createToilet, createVanity, createWritingDesk, type FurnitureMaterials } from './realisticFurniture';
import { createAdvancedWorkstation, ADVANCED_WORKSTATION_SPEC } from './advancedWorkstation';
import { createReferenceAstronomyDesk, REFERENCE_DESK_PLACEMENT } from './referenceAstronomyDesk';
import { createReferenceLibrary } from './referenceLibrary';
import { getRoomDesign } from './roomDesign';
import { ROOM_CATALOG } from './roomCatalog';
import { createRoomMaterials, enableWorldSpaceUV } from './roomMaterials';
import { createAcademicOutlook, ACADEMIC_OUTLOOK_METADATA } from './academicOutlook';
import { createArchedNorthWall, createWindowGlass, createPleatedCurtains } from './roomArchitecture';
import { fingerprintScene } from './sceneAudit';
import type { CityWindowSettings } from './osCityWindowTv';
import type { CityMallSigns } from './osCityMall';
import type { CityHologramControls } from './osCityPlazaHolograms';
import type { CityTVControls } from './osCityTV';
import type { CityHolidayControls } from './osCityHolidays';
import type { CityRadio } from './osCityRadio';

/** Custom modelled interior with local scanned materials. Dimensions are in metres. */
export interface RoomNavigation {
  reset: (position: THREE.Vector3) => void;
  step: (position: THREE.Vector3, direction: THREE.Vector3, dt: number, jump: boolean, dive: boolean) => void;
  snapshot: () => Record<string, unknown>;
  controls: string;
}
export interface LiminetteRoom {
  scene: THREE.Scene;
  spawn: THREE.Vector3;
  lookAt: THREE.Vector3;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  colliders: THREE.Box3[];
  viewpoints: { id: string; label: string; position: THREE.Vector3; target: THREE.Vector3 }[];
  update: (elapsedSeconds: number) => void;
  ready: Promise<void>;
  floorHeight?: (x: number, z: number) => number;
  canWalk?: (x: number, z: number, radius: number) => boolean;
  fieldOfView?: number;
  navigation?: RoomNavigation;
  environment?: { weatherOptions: {id:string;label:string}[]; setWeather:(value:string)=>void; timeOptions?:{id:string;label:string}[]; setTimeOfDay?:(value:string)=>void; getSnapshot:()=>Record<string,unknown> };
  windowFixture?: { options:{id:string;label:string}[]; setMode:(value:string)=>void; getSnapshot:()=>Record<string,unknown> };
  doorFixture?: { options:{id:string;label:string}[]; setMode:(value:string)=>void; update:(dt:number,listener?:{x:number;y:number;z:number})=>void; getSnapshot:()=>Record<string,unknown> };
  windowAppearance?: { getSettings: () => CityWindowSettings; setSettings: (value: Partial<CityWindowSettings>) => void };
  plazaStreams?: {getSpeed:()=>number;setSpeed:(value:number)=>void};
  mallSigns?: CityMallSigns;
  plazaHolograms?: CityHologramControls;
  television?: CityTVControls;
  holidays?: CityHolidayControls;
  radio?: CityRadio;
  dispose: () => void;
}

export function createLiminetteRoom(): LiminetteRoom {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#79a9c1');
  scene.fog = new THREE.Fog('#98b8c5', 105, 360);
  const pbr = createRoomMaterials();
  [pbr.walnut, pbr.darkWood, pbr.oak, pbr.parquet, pbr.plaster].forEach(enableWorldSpaceUV);
  const colliders: THREE.Box3[] = [];
  const textures: THREE.Texture[] = [];
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const batches = new Map<string, { geometry: THREE.BufferGeometry; material: THREE.Material; matrices: THREE.Matrix4[] }>();
  const transform = new THREE.Object3D();
  // Move whole furnishing zones without changing furniture dimensions.
  const layoutOffset = new THREE.Vector3();
  const westExtension = 3;
  const northExtension = 3;
  let seed = 8271;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    draw(ctx);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    textures.push(texture);
    return texture;
  }
  function material(color: THREE.ColorRepresentation, roughness = 0.65, metalness = 0, map?: THREE.Texture) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness, map });
    materials.add(mat);
    return mat;
  }
  function glow(color: THREE.ColorRepresentation, intensity: number, map?: THREE.Texture) {
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, map, emissiveMap: map, roughness: 0.45 });
    materials.add(mat);
    return mat;
  }
  const grain = canvasTexture(128, 512, ctx => {
    ctx.fillStyle = '#a18a6b'; ctx.fillRect(0, 0, 128, 512);
    for (let i = 0; i < 950; i++) {
      const x = random() * 128;
      ctx.strokeStyle = `rgba(${random() > 0.4 ? '45,22,9' : '223,194,140'},${0.05 + random() * 0.11})`;
      ctx.lineWidth = 0.5 + random() * 1.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + random() * 15, 170, x - random() * 12, 350, x, 512); ctx.stroke();
    }
  });
  const rugMap = canvasTexture(1024, 768, ctx => {
    ctx.fillStyle = '#4c282b'; ctx.fillRect(0, 0, 1024, 768);
    const bands = ['#b69b63', '#243e40', '#b69b63', '#704448'];
    bands.forEach((color, i) => { ctx.strokeStyle = color; ctx.lineWidth = i === 1 ? 24 : 5; ctx.strokeRect(20 + i * 15, 20 + i * 15, 984 - i * 30, 728 - i * 30); });
    function diamond(x: number, y: number, size: number, color: string) {
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x + size * 0.64, y); ctx.lineTo(x, y + size); ctx.lineTo(x - size * 0.64, y); ctx.closePath(); ctx.stroke();
    }
    diamond(512, 384, 260, '#b99a69'); diamond(512, 384, 232, '#173d3e'); diamond(512, 384, 180, '#a77759'); diamond(512, 384, 150, '#c5a878');
    for (let x = 108; x < 980; x += 80) for (let y = 102; y < 730; y += 80) {
      if (Math.abs(x - 512) / 0.64 + Math.abs(y - 384) < 280) continue;
      diamond(x, y, 18, '#a3825c');
      ctx.fillStyle = '#768d7a'; ctx.fillRect(x - 3, y - 3, 6, 6);
    }
    for (let n = 0; n < 24000; n++) { ctx.fillStyle = `rgba(231,215,160,${random() * 0.09})`; ctx.fillRect(random() * 1024, random() * 768, 1, 2); }
  });
  const walnut = pbr.walnut;
  const darkWood = pbr.darkWood;
  const insetWood = material('#5a4937', 0.68, 0, grain);
  const oak = pbr.oak;
  const brass = pbr.brass;
  const darkBrass = material('#65573d', 0.4, 0.65);
  const iron = material('#252f30', 0.46, 0.72);
  const plaster = pbr.plaster;
  const green = pbr.velvet;
  const teal = pbr.velvet.clone(); teal.color.set('#25443a');
  teal.onBeforeCompile = pbr.velvet.onBeforeCompile;
  teal.customProgramCacheKey = pbr.velvet.customProgramCacheKey;
  teal.side = THREE.DoubleSide; materials.add(teal);
  const leather = pbr.leather;
  const linen = pbr.linen;
  const burgundy = material('#51212d', 0.93);
  const black = material('#151e21', 0.75);
  const ceramic = pbr.ceramic;
  const paper = material('#d8caa5', 0.93);
  const luminous = glow('#ffdc99', 1.8);
  const windowGlass = new THREE.MeshPhysicalMaterial({ color: '#d2e3de', transparent: true, opacity: .07, roughness: .12, metalness: .04, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: .3 });
  materials.add(windowGlass);

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const roundedUnitBox = new RoundedBoxGeometry(1, 1, 1, 3, 0.1);
  const unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 16);
  const unitSphere = new THREE.SphereGeometry(1, 16, 10);
  const unitCone = new THREE.CylinderGeometry(0.65, 1, 1, 24);
  function place(geometry: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
    geometries.add(geometry); materials.add(mat);
    const key = `${geometry.uuid}/${mat.uuid}`;
    if (!batches.has(key)) batches.set(key, { geometry, material: mat, matrices: [] });
    transform.position.set(x, y, z).add(layoutOffset); transform.rotation.set(rx, ry, rz); transform.scale.set(sx, sy, sz); transform.updateMatrix();
    batches.get(key)!.matrices.push(transform.matrix.clone());
  }
  function box(mat: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, ry = 0) { place(unitBox, mat, x, y, z, w, h, d, 0, ry); }
  function softBox(mat: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, ry = 0) { place(roundedUnitBox, mat, x, y, z, w, h, d, 0, ry); }
  function cylinder(mat: THREE.Material, x: number, y: number, z: number, r: number, h: number, rx = 0, rz = 0) { place(unitCylinder, mat, x, y, z, r, h, r, rx, 0, rz); }
  function sphere(mat: THREE.Material, x: number, y: number, z: number, r: number, sy = 1) { place(unitSphere, mat, x, y, z, r, r * sy, r); }
  function torus(mat: THREE.Material, x: number, y: number, z: number, radius: number, tube: number, rx = 0, ry = 0, rz = 0, arc = Math.PI * 2) {
    place(new THREE.TorusGeometry(radius, tube, 7, 48, arc), mat, x, y, z, 1, 1, 1, rx, ry, rz);
  }
  function rod(mat: THREE.Material, start: THREE.Vector3, end: THREE.Vector3, r: number) {
    const direction = end.clone().sub(start);
    transform.position.copy(start).add(end).multiplyScalar(0.5).add(layoutOffset);
    transform.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    transform.scale.set(r, direction.length(), r); transform.updateMatrix();
    const key = `${unitCylinder.uuid}/${mat.uuid}`;
    if (!batches.has(key)) batches.set(key, { geometry: unitCylinder, material: mat, matrices: [] });
    batches.get(key)!.matrices.push(transform.matrix.clone()); geometries.add(unitCylinder);
  }
  function collider(x: number, z: number, w: number, d: number, height = 3) { colliders.push(new THREE.Box3(new THREE.Vector3(x - w / 2, 0, z - d / 2), new THREE.Vector3(x + w / 2, height, z + d / 2)).translate(layoutOffset)); }
  function light(color: THREE.ColorRepresentation, intensity: number, x: number, y: number, z: number, distance = 16) {
    const lamp = new THREE.PointLight(color, intensity, distance, 2); lamp.position.set(x, y, z).add(layoutOffset); scene.add(lamp); return lamp;
  }
  function plaque(text: string, x: number, y: number, z: number, width: number, height: number, ry = 0, luminousText = false) {
    const map = canvasTexture(512, 160, ctx => {
      ctx.fillStyle = luminousText ? '#122c2a' : '#292b25'; ctx.fillRect(0, 0, 512, 160);
      ctx.strokeStyle = '#ae915d'; ctx.lineWidth = 3; ctx.strokeRect(12, 12, 488, 136);
      ctx.fillStyle = luminousText ? '#96d3ae' : '#dbc59a'; ctx.font = '26px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 83, 465);
    });
    const mat = luminousText ? glow('#91c5a7', 0.5, map) : material('#ffffff', 0.75, 0, map);
    place(new THREE.PlaneGeometry(width, height), mat, x, y, z, 1, 1, 1, 0, ry);
  }
  function picture(x: number, y: number, z: number, w: number, h: number, type: 'stars' | 'botany', ry = 0) {
    const map = canvasTexture(512, 640, ctx => {
      ctx.fillStyle = type === 'stars' ? '#17373d' : '#c2b28d'; ctx.fillRect(0, 0, 512, 640);
      ctx.strokeStyle = type === 'stars' ? '#b8aa7a' : '#776444'; ctx.lineWidth = 2; ctx.strokeRect(24, 24, 464, 592);
      if (type === 'stars') {
        for (let r = 55; r < 225; r += 44) { ctx.beginPath(); ctx.arc(256, 290, r, 0, Math.PI * 2); ctx.stroke(); }
        for (let i = 0; i < 80; i++) { const x = 50 + random() * 412; const y = 50 + random() * 465; ctx.fillStyle = '#e0c695'; ctx.fillRect(x, y, 2, 2); }
        ctx.beginPath(); ctx.ellipse(256, 290, 218, 105, -0.55, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.strokeStyle = '#435243'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(257, 505); ctx.bezierCurveTo(180, 370, 295, 260, 258, 100); ctx.stroke();
        for (let i = 0; i < 9; i++) { ctx.save(); ctx.translate(251, 455 - i * 37); ctx.rotate(i % 2 ? -0.8 : 0.8); ctx.fillStyle = i % 2 ? '#576550' : '#687957'; ctx.beginPath(); ctx.ellipse(i % 2 ? -40 : 40, 0, 55, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      }
      ctx.fillStyle = type === 'stars' ? '#d2c095' : '#414734'; ctx.font = '25px Georgia'; ctx.textAlign = 'center'; ctx.fillText(type === 'stars' ? 'ATLAS OF QUIET ORBITS' : 'HERBARIUM · NO. 07', 256, 567);
      ctx.font = '13px Georgia'; ctx.fillText('V I N C U L U M   A C A D E M Y', 256, 592);
    });
    const group = new THREE.Group(); group.position.set(x, y, z).add(layoutOffset); group.rotation.y = ry; scene.add(group);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material('#ffffff', 0.85, 0, map)); group.add(mesh); geometries.add(mesh.geometry);
    for (const [px, py, pw, ph] of [[0, h / 2, w + 0.09, 0.07], [0, -h / 2, w + 0.09, 0.07], [-w / 2, 0, 0.07, h], [w / 2, 0, 0.07, h]]) {
      const frame = new THREE.Mesh(unitBox, brass); frame.position.set(px, py, 0.016); frame.scale.set(pw, ph, 0.065); group.add(frame);
    }
  }

  // Continuous architecture: warm parquet, panelled walls and a shallow plaster vault.
  box(pbr.parquet, -westExtension / 2, -0.09, -northExtension / 2, 16.3 + westExtension, 0.18, 12.3 + northExtension);
  const northWall = createArchedNorthWall(plaster, -8.15 - westExtension, 8.15, [{center: -8.70, width: 4.45, bottom: 1.04, top: 4.72}]);
  northWall.position.z -= northExtension; scene.add(northWall);
  box(plaster, -8.07 - westExtension, 2.8, -northExtension / 2, 0.18, 5.6, 12.3 + northExtension);
  box(plaster, 8.07, 2.8, -northExtension / 2, 0.18, 5.6, 12.3 + northExtension);
  box(plaster, -westExtension / 2, 2.8, 6.07, 16.3 + westExtension, 5.6, 0.18);
  box(plaster, -westExtension / 2, 5.55, -northExtension / 2, 16.3 + westExtension, 0.15, 12.3 + northExtension);
  function panelWall(z: number, rotation: number, length: number, centerX = 0, centerZ = 0) {
    const sign = rotation === 0 ? 1 : -1;
    for (let n = 0; n < Math.floor(length / 1.12); n++) {
      const p = -length / 2 + 0.59 + n * 1.12;
      const x = rotation === 0 ? centerX + p : centerX;
      const zz = rotation === 0 ? z : centerZ + p;
      if (rotation === 0 && z < -8 && x < -6.5) continue;
      if (rotation === 1 && centerX < -10 && zz < -.8) continue;
      box(walnut, x, 0.66, zz, rotation === 0 ? 1.08 : 0.12, 1.24, rotation === 0 ? 0.12 : 1.08);
      box(insetWood, x + (rotation ? sign * 0.075 : 0), 0.67, zz + (rotation ? 0 : 0.075), rotation === 0 ? 0.89 : 0.025, 0.92, rotation === 0 ? 0.025 : 0.89);
    }
    const x = rotation === 0 ? centerX : centerX; const zz = rotation === 0 ? z : centerZ;
    for (const [y, h, depth] of [[0.09, 0.16, 0.19], [1.29, 0.065, 0.2], [1.36, 0.055, 0.15], [4.9, 0.12, 0.2], [5.02, 0.1, 0.3]]) {
      const libraryWindowWall = rotation === 0 && z < -8;
      const libraryWestWall = rotation === 1 && centerX < -10;
      box(walnut, libraryWindowWall ? .75 : x, y, libraryWestWall ? 2.6 : zz, rotation === 0 ? (libraryWindowWall ? 14.5 : length) : depth, h, rotation === 0 ? depth : (libraryWestWall ? 6.8 : length));
    }
  }
  panelWall(-5.93 - northExtension, 0, 16 + westExtension, -westExtension / 2); panelWall(5.92, 0, 16 + westExtension, -westExtension / 2);
  panelWall(0, 1, 12 + northExtension, -7.93 - westExtension, -northExtension / 2); panelWall(0, 1, 12 + northExtension, 7.93, -northExtension / 2);
  for (const x of [-10.8, -9, -6.8, -3.5, -0.1, 3.3, 7.8]) {
    if (x < -6.5) continue; // The new ivory library's real window opening.
    box(walnut, x, 2.85, -5.8 - northExtension, 0.16, 4.2, 0.24);
    box(brass, x, 4.75, -5.68 - northExtension, 0.2, 0.035, 0.25);
  }
  // Vault ribs and structural crossbeams.
  const ribPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) { const x = -7.9 - westExtension + i / 48 * (15.8 + westExtension); ribPoints.push(new THREE.Vector3(x, 4.96 + 0.48 * Math.sin(i / 48 * Math.PI), 0)); }
  for (const z of [-8.7, -4.8, -.9, 2.1, 5.65]) {
    const curve = new THREE.CatmullRomCurve3(ribPoints.filter(p => z > -.8 || p.x > -6.25).map(p => new THREE.Vector3(p.x, p.y, z)));
    place(new THREE.TubeGeometry(curve, 48, 0.065, 8, false), walnut, 0, 0, 0);
  }
  for (const x of [-5.1, -1, 3.1, 7.2]) box(walnut, x, 5.34, -northExtension / 2, 0.09, 0.12, 11.8 + northExtension);

  // Three tall rain-glazed arched windows, visible copper tracery and deep sills.
  layoutOffset.set(0, 0, -northExtension);
  for (const x of [-5.25, -1.85, 1.55]) {
    const radius = 1.08; const base = 1.15; const spring = 3.57;
    const glass = createWindowGlass(x, windowGlass); glass.position.add(layoutOffset); scene.add(glass);
    box(darkWood, x - radius - 0.055, 2.35, -5.68, 0.12, 2.5, 0.23);
    box(darkWood, x + radius + 0.055, 2.35, -5.68, 0.12, 2.5, 0.23);
    torus(walnut, x, spring, -5.68, radius + 0.05, 0.083, 0, 0, 0, Math.PI);
    torus(brass, x, spring, -5.56, radius - 0.025, 0.024, 0, 0, 0, Math.PI);
    box(walnut, x, 1.1, -5.62, 2.55, 0.12, 0.65);
    for (const dx of [-0.54, 0, 0.54]) {
      const top = spring + Math.sqrt(radius * radius - dx * dx);
      box(brass, x + dx, (top + base) / 2, -5.65, 0.033, top - base, 0.055);
    }
    for (const y of [2.14, 3.17, 3.57]) box(brass, x, y, -5.65, 2.16, 0.035, 0.05);
    const curtains = createPleatedCurtains(x, teal, brass, x === -5.25 ? [1] : [-1, 1]); curtains.position.add(layoutOffset); scene.add(curtains);
    rod(brass, new THREE.Vector3(x - (x === -5.25 ? 1.12 : 1.75), 4.87, -5.43), new THREE.Vector3(x + 1.75, 4.87, -5.43), 0.032);
    for (const side of (x === -5.25 ? [1] : [-1, 1])) sphere(brass, x + side * 1.79, 4.87, -5.43, 0.065);
  }

  // The original dark bookcases are replaced by the Blender reference ensemble.
  layoutOffset.set(-westExtension, 0, 0);
  const bookMaterials = ['#334943', '#583939', '#264454', '#79634d', '#3c3935', '#805d43', '#566252', '#725155'].map(c => material(c, 0.86));
  const referenceLibrary = createReferenceLibrary(); scene.add(referenceLibrary.group); colliders.push(...referenceLibrary.colliders);
  light('#ffc477', 8, -10.25, 1.08, -4.8, 4.0);
  light('#e0edf9', 22, -8.4, 3.85, -8.2, 10);
  light('#ffeccc', 12, -7.1, 4.25, -3.0, 10);
  // The front door faces the foyer; brass details echo the apartment directory.
  box(darkWood, -7.785, 1.34, 4.06, 0.17, 2.67, 1.42);
  for (const z of [3.28, 4.84]) box(walnut, -7.65, 1.4, z, 0.22, 2.8, 0.14);
  box(walnut, -7.65, 2.8, 4.06, 0.23, 0.17, 1.7);
  for (const z of [3.73, 4.39]) for (const y of [0.57, 1.46, 2.23]) {
    box(walnut, -7.683, y, z, 0.035, y === 1.46 ? 0.94 : 0.46, 0.52);
    box(insetWood, -7.659, y, z, 0.017, y === 1.46 ? 0.78 : 0.31, 0.39);
  }
  box(brass, -7.642, 1.15, 4.56, 0.035, 0.25, 0.07);
  sphere(brass, -7.589, 1.18, 4.56, 0.045);
  torus(brass, -7.636, 1.72, 4.06, 0.022, 0.008, 0, Math.PI / 2);
  plaque('014 · LIMINETTE', -7.63, 2.235, 4.06, 0.85, 0.18, Math.PI / 2);
  box(darkWood, -7.0, 0.018, 4.09, 0.91, 0.02, 1.52);

  // The central study, made for a student who works between paper and retro technology.
  const furnishingPalette: FurnitureMaterials = { walnut, darkWood, brass, iron, upholstery: green, leather, linen, teal, burgundy, ceramic, paper, black, luminous };
  function furnish(object: THREE.Group, x: number, y: number, z: number, ry = 0) {
    object.position.set(x, y, z).add(layoutOffset); object.rotation.y = ry; scene.add(object);
  }
  // The writing desk meets the north end of the astronomy console in a compact L.
  layoutOffset.set(0, 0, 0);
  const dx = 1.15; const dz = -7.05;
  furnish(createWritingDesk(furnishingPalette), dx, 0, dz);
  collider(dx, dz, 3.5, 1.17, 0.94);
  const workstation = createAdvancedWorkstation();
  furnish(workstation, dx + 0.23, 0.907, dz - 0.17);
  const projection = workstation.getObjectByName('Atlas volumetric model');
  const referenceDesk = createReferenceAstronomyDesk();
  scene.add(referenceDesk.group);
  colliders.push(...referenceDesk.colliders);
  // Green glass banker's lamp.
  furnish(createBankerLamp(furnishingPalette), dx - 1.07, 0.913, dz - 0.03);
  light('#ffe4b0', 5, dx - 1.07, 1.32, dz + 0.05, 3);
  // Paper stack, open book, fountain pen, mug and ink bottle.
  for (let i = 0; i < 7; i++) box(paper, dx + 1.2 + random() * 0.04, 0.908 + i * 0.007, dz + 0.17, 0.36, 0.004, 0.48, -0.14);
  box(burgundy, dx - 0.65, 0.927, dz + 0.24, 0.47, 0.04, 0.34, 0.1);
  for (const side of [-1, 1]) box(paper, dx - 0.65 + side * 0.116, 0.952, dz + 0.24, 0.222, 0.013, 0.31, side * 0.04 + 0.1);
  for (let i = 0; i < 9; i++) box(insetWood, dx - 0.765, 0.96, dz + 0.14 + i * 0.022, 0.15, 0.001, 0.003, 0.1);
  furnish(createMug(furnishingPalette), dx + 0.87, 0.91, dz + 0.33, -0.3);
  box(black, dx + 0.81, 0.958, dz - 0.3, 0.08, 0.11, 0.08);
  cylinder(brass, dx + 0.81, 1.024, dz - 0.3, 0.032, 0.025);
  rod(iron, new THREE.Vector3(dx + 0.92, 0.978, dz + 0.23), new THREE.Vector3(dx + 1.14, 0.978, dz + 0.04), 0.008);
  // Desk chair, open approach from the main room.
  furnish(createDeskChair(furnishingPalette), dx + 0.04, 0, dz + 1.13);
  collider(dx + 0.04, dz + 1.13, 0.77, 0.83, 1.5);
  // A pinned noticeboard and an astronomical atlas near the desk.
  layoutOffset.set(0, 0, -northExtension);
  picture(3.37, 2.86, -5.76, 0.77, 1.13, 'stars');

  // Persian carpet and a lived-in lounge, with a clear walking ring around it.
  layoutOffset.set(0, 0, 0);
  box(material('#c6a5a4', 0.98, 0, rugMap), -1.4, 0.016, 1.38, 5.4, 0.024, 4.25);
  for (let i = 0; i < 85; i++) for (const sign of [-1, 1]) box(linen, -4.08 + i * 0.063, 0.018, 1.38 + sign * 2.18, 0.016, 0.01, 0.11);
  furnish(createChesterfield(furnishingPalette), -1.35, 0, 2.88);
  collider(-1.35, 2.88, 3.14, 1.28, 1.5);
  furnish(createCoffeeTable(furnishingPalette), -1.28, 0, 1.12);
  collider(-1.28, 1.12, 1.79, 1.02, 0.55);
  for (let i = 0; i < 3; i++) box(bookMaterials[i + 1], -1.65, 0.525 + i * 0.065, 1.13, 0.43, 0.055, 0.56, 0.12 - i * 0.07);
  cylinder(brass, -0.9, 0.523, 0.98, 0.2, 0.015);
  furnish(createMug(furnishingPalette), -0.93, 0.534, 1.02, 0.44);
  furnish(createTeapot(furnishingPalette), -0.7, 0.503, 1.21, -0.13);
  // Reading chair angled toward the table.
  furnish(createReadingChair(furnishingPalette), -5.64, 0, 0.4, -Math.PI / 2 + 0.15);
  collider(-5.64, 0.4, 1.18, 1.24, 1.5);
  // Floor lamps, each with a real diffuser and exposed brass structure.
  function floorLamp(x: number, z: number) {
    cylinder(darkBrass, x, 0.04, z, 0.23, 0.07); cylinder(brass, x, 1.08, z, 0.022, 2.09);
    place(unitCone, linen, x, 1.98, z, 0.35, 0.41, 0.35);
    cylinder(luminous, x, 1.77, z, 0.325, 0.012);
    torus(brass, x, 1.775, z, 0.35, 0.013, Math.PI / 2);
    sphere(brass, x, 2.22, z, 0.04);
  }
  floorLamp(-6.48, 1.8); floorLamp(0.82, 3.43);
  light('#ffd8a1', 24, -5.7, 2.3, 1.1, 9);

  // Brass armillary display in the foyer, clear of both desk approaches.
  layoutOffset.set(3.35, 0, 1.88);
  cylinder(darkWood, 1.85, 0.48, -0.88, 0.35, 0.92);
  cylinder(brass, 1.85, 0.94, -0.88, 0.43, 0.075);
  cylinder(brass, 1.85, 0.08, -0.88, 0.45, 0.09);
  const orrery = new THREE.Group(); orrery.position.set(1.85, 1.47, -0.88).add(layoutOffset); scene.add(orrery);
  const centralSun = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), glow('#d9ad59', 0.3)); orrery.add(centralSun); geometries.add(centralSun.geometry);
  for (let i = 0; i < 4; i++) {
    const orbit = new THREE.Group(); orbit.rotation.set(0.45 + i * 0.4, i * 0.72, i * 0.35); orrery.add(orbit);
    const orbitGeometry = new THREE.TorusGeometry(0.25 + i * 0.11, 0.008, 6, 72); geometries.add(orbitGeometry);
    orbit.add(new THREE.Mesh(orbitGeometry, brass));
    const planet = new THREE.Mesh(unitSphere, i % 2 ? teal : brass); planet.position.x = 0.25 + i * 0.11; planet.scale.setScalar(0.035 + i * 0.01); orbit.add(planet);
  }
  rod(brass, new THREE.Vector3(1.85, 0.96, -0.88), new THREE.Vector3(1.85, 1.95, -0.88), 0.014);
  torus(brass, 1.85, 1.47, -0.88, 0.6, 0.018, 0, Math.PI / 2, 0.23);
  collider(1.85, -0.88, 0.93, 0.93, 2.1);

  // Northeast sleeping alcove, separated with a panelled partition and an open archway.
  layoutOffset.set(0, 0, 0);
  box(plaster, 4.42, 2.5, -4.1 - northExtension / 2, 0.18, 5, 3.8 + northExtension);
  box(walnut, 4.3, 0.68, -4.1 - northExtension / 2, 0.08, 1.35, 3.8 + northExtension);
  box(walnut, 4.42, 4.25, -0.89, 0.27, 1.5, 2.7);
  for (const z of [-2.2, 0.41]) {
    box(walnut, 4.42, 2.15, z, 0.34, 4.3, 0.24);
    box(brass, 4.225, 2.03, z, 0.027, 3.68, 0.027);
    box(walnut, 4.42, 0.16, z, 0.46, 0.31, 0.4);
  }
  collider(4.42, -4.1 - northExtension / 2, 0.29, 3.8 + northExtension, 5); collider(4.42, -2.2, 0.44, 0.27, 5); collider(4.42, 0.41, 0.44, 0.27, 5);
  layoutOffset.set(0, 0, -northExtension);
  picture(4.301, 2.74, -3.55, 1.1, 1.48, 'stars', -Math.PI / 2);
  const bx = 6.17; const bz = -3.95;
  furnish(createBed(furnishingPalette), bx, 0, bz);
  collider(bx, bz, 2.3, 3.17, 1.7);
  // Bedside drawers and a glowing opal globe.
  box(walnut, 7.51, 0.42, -4.91, 0.56, 0.77, 0.66);
  for (let i = 0; i < 2; i++) { box(insetWood, 7.51, 0.29 + i * 0.29, -4.563, 0.49, 0.25, 0.02); sphere(brass, 7.51, 0.29 + i * 0.29, -4.535, 0.025); }
  cylinder(brass, 7.51, 0.85, -4.93, 0.12, 0.09); sphere(luminous, 7.51, 1.052, -4.93, 0.18);
  collider(7.51, -4.91, 0.62, 0.7, 1.3);
  light('#ffd6a0', 14, 6.4, 2.8, -3.8, 7);
  picture(7.89, 2.7, -3.18, 1.12, 1.47, 'botany', -Math.PI / 2);
  box(material('#ebe0be', 0.96), 6.36, 0.025, -1.65, 2.52, 0.025, 0.92);
  // Luggage and slippers at the foot of the bed.
  box(leather, 6.29, 0.26, -1.64, 1.17, 0.46, 0.55);
  for (const xx of [5.9, 6.68]) box(brass, xx, 0.266, -1.354, 0.04, 0.36, 0.015);
  box(brass, 6.29, 0.37, -1.344, 0.18, 0.04, 0.025);
  for (const xx of [5.61, 5.88]) place(unitSphere, leather, xx, 0.065, -0.99, 0.097, 0.045, 0.21);
  collider(6.29, -1.64, 1.21, 0.59, 0.6);

  // Wardrobe, hanging coat and the entry foyer.
  layoutOffset.set(-westExtension, 0, 0);
  box(darkWood, -6.65, 1.38, 5.44, 2.2, 2.73, 0.92);
  for (const x of [-7.19, -6.11]) {
    box(walnut, x, 1.41, 4.964, 1.025, 2.58, 0.055);
    box(insetWood, x, 1.45, 4.921, 0.83, 2.19, 0.018);
    cylinder(brass, x + (x < -6.65 ? 0.34 : -0.34), 1.4, 4.886, 0.018, 0.18);
  }
  box(walnut, -6.65, 2.81, 5.43, 2.35, 0.12, 1.0);
  collider(-6.65, 5.44, 2.35, 1.06);
  cylinder(brass, -5.19, 1.12, 5.28, 0.031, 2.21); cylinder(darkWood, -5.19, 0.05, 5.28, 0.28, 0.08);
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; rod(brass, new THREE.Vector3(-5.19, 1.93, 5.28), new THREE.Vector3(-5.19 + Math.cos(a) * 0.26, 2.09, 5.28 + Math.sin(a) * 0.26), 0.018); }
  box(burgundy, -5.31, 1.28, 5.22, 0.37, 1.22, 0.18, 0.12);
  rod(burgundy, new THREE.Vector3(-5.43, 1.8, 5.22), new THREE.Vector3(-5.65, 1.28, 5.25), 0.086);
  box(linen, -5.09, 1.57, 5.08, 0.1, 0.88, 0.04);
  collider(-5.26, 5.24, 0.7, 0.65);

  // A complete compact kitchen, facing the room along the south wall.
  layoutOffset.set(0, 0, 0);
  const counterMat = material('#96988c', 0.38);
  for (let i = 0; i < 5; i++) {
    const x = -3.94 + i * 1.02;
    box(green, x, i === 0 ? 0.35 : 0.46, 5.38, 0.99, i === 0 ? 0.69 : 0.88, 1.0);
    box(walnut, x, 0.47, 4.864, 0.91, 0.73, 0.035);
    box(green, x, 0.47, 4.836, 0.81, 0.62, 0.017);
    box(brass, x + 0.32, 0.68, 4.807, 0.023, 0.17, 0.038);
  }
  // The stone counter has a real opening so the hollow sink is visible below its rim.
  box(counterMat, -4.325, 0.943, 5.34, 0.28, 0.095, 1.12);
  box(counterMat, -1.3425, 0.943, 5.34, 4.015, 0.095, 1.12);
  box(counterMat, -3.76, 0.943, 4.845, 0.85, 0.095, 0.13);
  box(counterMat, -3.76, 0.943, 5.8, 0.85, 0.095, 0.2);
  collider(-1.9, 5.36, 5.23, 1.17, 1.04);
  // Pale green glazed tile backsplash, mortar is physically visible.
  const tileColors = ['#829489', '#94a496', '#a7b0a0', '#7f978d'].map(c => material(c, 0.28));
  for (let row = 0; row < 5; row++) for (let col = 0; col < 21; col++) box(tileColors[(row + col) % 4], -4.42 + col * 0.246, 1.11 + row * 0.17, 5.897, 0.237, 0.16, 0.025);
  // Range with visible burners, knobs and an oven door.
  box(iron, -1.77, 1.008, 5.28, 0.92, 0.04, 0.8);
  for (const x of [-2, -1.55]) for (const z of [5.08, 5.49]) {
    cylinder(black, x, 1.038, z, 0.129, 0.025);
    torus(darkBrass, x, 1.052, z, 0.105, 0.015, Math.PI / 2);
    box(iron, x, 1.06, z, 0.29, 0.02, 0.03); box(iron, x, 1.06, z, 0.03, 0.02, 0.29);
  }
  box(iron, -1.77, 0.47, 4.805, 0.88, 0.79, 0.075);
  box(black, -1.77, 0.415, 4.752, 0.7, 0.44, 0.027);
  box(brass, -1.77, 0.684, 4.712, 0.63, 0.035, 0.055);
  for (let i = 0; i < 4; i++) cylinder(brass, -2.04 + i * 0.18, 0.803, 4.749, 0.035, 0.035, Math.PI / 2);
  place(unitCone, iron, -1.78, 2.42, 5.58, 0.59, 0.36, 0.43);
  box(iron, -1.78, 2.95, 5.65, 0.36, 0.77, 0.33);
  box(brass, -1.78, 2.24, 5.55, 1.15, 0.035, 0.79);
  // Kettle on the hob.
  sphere(ceramic, -1.55, 1.185, 5.49, 0.143, 0.85);
  cylinder(brass, -1.55, 1.31, 5.49, 0.055, 0.025);
  torus(iron, -1.55, 1.29, 5.49, 0.145, 0.015);
  rod(ceramic, new THREE.Vector3(-1.68, 1.2, 5.49), new THREE.Vector3(-1.77, 1.29, 5.49), 0.034);
  // Sink basin inset into the counter and a high gooseneck tap.
  furnish(createKitchenSink(furnishingPalette), -3.76, 1.0, 5.3);
  // Wall cabinets and open crockery shelf.
  for (const x of [-3.78, 0.11]) {
    box(green, x, 2.21, 5.66, 1.32, 1.16, 0.5);
    for (const side of [-1, 1]) { box(walnut, x + side * 0.325, 2.2, 5.394, 0.63, 1.06, 0.045); cylinder(brass, x + side * 0.08, 2.11, 5.362, 0.016, 0.17); }
    box(brass, x, 1.597, 5.67, 1.36, 0.024, 0.56);
  }
  box(walnut, 1.59, 1.95, 5.65, 1.38, 0.075, 0.43);
  box(walnut, 1.59, 2.65, 5.65, 1.38, 0.075, 0.43);
  for (let i = 0; i < 5; i++) cylinder(ceramic, 1.13 + i * 0.22, 2.1, 5.66, 0.07, 0.22);
  for (let i = 0; i < 4; i++) { cylinder(material(['#aa8e58', '#734a39', '#8f9b75', '#b19662'][i], 0.4), 1.09 + i * 0.29, 2.83, 5.66, 0.09, 0.27); cylinder(darkWood, 1.09 + i * 0.29, 2.981, 5.66, 0.095, 0.036); }
  // Rounded-era cream refrigerator with a freezer, vents and pinned notes.
  box(ceramic, 3.23, 1.03, 5.34, 1.12, 2.05, 1.14);
  box(ceramic, 3.23, 1.055, 4.748, 1.06, 1.92, 0.073);
  box(darkBrass, 3.23, 1.5, 4.704, 1.03, 0.016, 0.011);
  box(brass, 2.87, 1.74, 4.674, 0.027, 0.26, 0.058);
  box(brass, 2.87, 1.15, 4.674, 0.027, 0.43, 0.058);
  for (let i = 0; i < 9; i++) box(iron, 2.88 + i * 0.087, 0.18, 4.702, 0.035, 0.066, 0.008);
  box(paper, 3.46, 1.8, 4.697, 0.26, 0.23, 0.006, 0.09);
  sphere(burgundy, 3.44, 1.875, 4.673, 0.022);
  plaque('NORTHSTAR', 3.23, 1.384, 4.7, 0.53, 0.09, Math.PI);
  collider(3.23, 5.32, 1.17, 1.28);
  // Espresso machine, chopping board, bread, knife block.
  box(brass, -0.38, 1.2, 5.48, 0.43, 0.4, 0.43);
  box(iron, -0.38, 1.26, 5.25, 0.35, 0.18, 0.055);
  cylinder(ceramic, -0.38, 1.097, 5.17, 0.058, 0.13);
  box(iron, -0.38, 1.025, 5.19, 0.35, 0.035, 0.21);
  box(oak, 0.18, 1.012, 5.19, 0.49, 0.045, 0.41, -0.11);
  place(unitSphere, material('#b7864d', 0.98), 0.17, 1.105, 5.2, 0.17, 0.087, 0.12);
  for (let i = 0; i < 3; i++) box(linen, 0.07 + i * 0.08, 1.177, 5.2, 0.01, 0.004, 0.15, -0.17);
  light('#ffe0b4', 30, -0.4, 3.28, 3.87, 10);

  // Bathroom has two real openings in its partition, with a clear 1.35 m doorway.
  const bathTile = material('#a5b6af', 0.41);
  box(plaster, 6.2, 2.35, 2.01, 3.6, 4.7, 0.18);
  box(plaster, 4.42, 2.35, 2.35, 0.18, 4.7, 0.5);
  box(plaster, 4.42, 2.35, 5.25, 0.18, 4.7, 1.5);
  box(plaster, 4.42, 3.79, 3.56, 0.18, 1.81, 1.91);
  collider(6.2, 2.01, 3.6, 0.26, 5); collider(4.42, 2.35, 0.3, 0.5, 5); collider(4.42, 5.25, 0.3, 1.5, 5);
  for (const z of [2.65, 4.47]) box(walnut, 4.29, 1.45, z, 0.16, 2.9, 0.14);
  box(walnut, 4.29, 2.89, 3.56, 0.17, 0.16, 1.96);
  plaque('BATH & WASH', 4.312, 3.22, 3.56, 0.79, 0.16, -Math.PI / 2);
  for (let ix = 0; ix < 12; ix++) for (let iz = 0; iz < 13; iz++) box((ix + iz) % 2 ? ceramic : bathTile, 4.62 + ix * 0.282, 0.018, 2.23 + iz * 0.284, 0.276, 0.024, 0.278);
  for (let col = 0; col < 13; col++) for (let row = 0; row < 6; row++) box(tileColors[(col + row) % 4], 4.58 + col * 0.262, 0.18 + row * 0.27, 2.122, 0.254, 0.261, 0.03);
  // Vanity, porcelain basin, brass faucet and a large rounded mirror.
  furnish(createVanity(furnishingPalette), 5.56, 0, 5.54);
  const mirror = new Reflector(new THREE.CircleGeometry(.56, 64), {
    color: 0xbfc6c2, textureWidth: 512, textureHeight: 512, clipBias: .003, multisample: 2,
  });
  mirror.name = 'Oval vanity mirror';
  mirror.position.set(5.56, 2.13, 5.77);
  mirror.rotation.y = Math.PI;
  mirror.scale.y = 1.2;
  // Only the visible colour pass needs a reflection, not the room probe or AO.
  mirror.layers.set(1);
  mirror.camera.layers.enable(1);
  scene.add(mirror);
  place(new THREE.TorusGeometry(.58, .029, 8, 64), brass, 5.56, 2.13, 5.75, 1, 1.2, 1);
  for (const xx of [4.88, 6.24]) sphere(luminous, xx, 2.13, 5.73, 0.085, 1.7);
  collider(5.56, 5.54, 1.56, 0.87, 1.0);
  // Clawfoot bath, deep inset water, shower riser and towel rail.
  furnish(createBath(furnishingPalette), 7.19, 0, 3.26);
  collider(7.19, 3.27, 1.27, 2.03, 1.0);
  // WC in the back corner and neatly folded towels.
  furnish(createToilet(furnishingPalette), 7.18, 0, 5.39);
  collider(7.18, 5.39, 0.77, 1.01, 1.2);
  rod(brass, new THREE.Vector3(5.14, 1.54, 2.25), new THREE.Vector3(6.07, 1.54, 2.25), 0.021);
  box(linen, 5.58, 1.26, 2.264, 0.62, 0.63, 0.048);
  for (let i = 0; i < 3; i++) box(teal, 5.83, 0.953 + i * 0.044, 5.69, 0.4, 0.04, 0.3);
  box(teal, 5.8, 0.036, 4.09, 1.2, 0.02, 0.63);
  light('#e5eac9', 26, 6.13, 3.45, 4.14, 7);

  // Curved, tapered leaf blades share one geometry across all indoor plants.
  const leafMaterials = ['#3d6047', '#526e48', '#294e41'].map(c => material(c, 0.82));
  leafMaterials.forEach(mat => { mat.side = THREE.DoubleSide; });
  const leafBlade = new THREE.PlaneGeometry(2, 2, 8, 16);
  const leafPositions = leafBlade.getAttribute('position');
  for (let i = 0; i < leafPositions.count; i++) {
    const across = leafPositions.getX(i);
    const along = (leafPositions.getY(i) + 1) / 2;
    const width = Math.pow(Math.sin(Math.PI * along), .72);
    leafPositions.setXYZ(i, across * width, .22 * width * (1 - Math.abs(across)) - .13 * across * across, (along - .5) * 2);
  }
  leafBlade.computeVertexNormals();
  function plant(x: number, z: number, scale: number, floorY = 0) {
    place(unitCone, material('#855d46', 0.93), x, floorY + 0.19 * scale, z, 0.22 * scale, 0.37 * scale, 0.22 * scale);
    cylinder(darkWood, x, floorY + 0.382 * scale, z, 0.17 * scale, 0.012);
    torus(oak, x, floorY + 0.375 * scale, z, 0.183 * scale, 0.018 * scale, Math.PI / 2);
    for (let i = 0; i < 11; i++) {
      const a = i * 2.399; const h = (0.55 + random() * 0.7) * scale;
      const end = new THREE.Vector3(x + Math.cos(a) * 0.33 * scale, floorY + h, z + Math.sin(a) * 0.33 * scale);
      rod(leafMaterials[0], new THREE.Vector3(x, floorY + 0.35 * scale, z), end, 0.009 * scale);
      place(leafBlade, leafMaterials[i % 3], end.x, end.y, end.z, 0.14 * scale, 0.3 * scale, 0.3 * scale, 0.38, a, 0.2);
    }
    if (floorY === 0 && scale > 0.8) collider(x, z, 0.55 * scale, 0.55 * scale, 1.8 * scale);
  }
  plant(-4.1, -4.2, 1.0); plant(3.1, -4.97 - northExtension, 1.25); plant(-6.8, 3.15, 1.2); plant(3.55, 0.65, .9); plant(1.1, 5.59, 0.5, 1.02); plant(5.08, 5.72, 0.36, 0.95);

  // A small breakfast table at the boundary between kitchen and lounge.
  cylinder(walnut, 2.35, 0.78, 3.39, 0.63, 0.075);
  cylinder(brass, 2.35, 0.4, 3.39, 0.043, 0.75);
  cylinder(darkWood, 2.35, 0.075, 3.39, 0.36, 0.075);
  for (const x of [1.39, 3.29]) {
    cylinder(leather, x, 0.51, 3.39, 0.29, 0.12);
    for (const z of [3.22, 3.56]) for (const xx of [x - 0.16, x + 0.16]) cylinder(brass, xx, 0.26, z, 0.019, 0.5);
    collider(x, 3.39, 0.59, 0.62, 0.66);
  }
  collider(2.35, 3.39, 1.31, 1.31, 0.85);
  cylinder(ceramic, 2.35, 0.835, 3.39, 0.17, 0.025);
  for (let i = 0; i < 4; i++) sphere(material(i % 2 ? '#92793a' : '#883e35', 0.66), 2.27 + (i % 2) * 0.13, 0.9, 3.33 + Math.floor(i / 2) * 0.13, 0.078);

  // Overhead brass chandelier: warm opal globes and orbital rings.
  cylinder(brass, -1.32, 4.72, 0.49, 0.028, 1.36);
  cylinder(darkBrass, -1.32, 5.4, 0.49, 0.18, 0.065);
  torus(brass, -1.32, 4.12, 0.49, 1.14, 0.028, Math.PI / 2);
  torus(brass, -1.32, 4.16, 0.49, 0.77, 0.018, Math.PI / 2);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2; const x = -1.32 + Math.cos(a) * 1.14; const z = 0.49 + Math.sin(a) * 1.14;
    rod(brass, new THREE.Vector3(-1.32, 4.55, 0.49), new THREE.Vector3(x, 4.13, z), 0.014);
    cylinder(brass, x, 4.02, z, 0.035, 0.19); sphere(luminous, x, 3.87, z, 0.15);
  }
  light('#ffe0ae', 48, -1.32, 3.92, 0.49, 20);
  light('#c4dce7', 22, -3.8, 3.55, -5.0 - northExtension, 12);
  light('#c4dce7', 14, -8.8, 3.3, -3.8 - northExtension, 10);
  scene.add(new THREE.HemisphereLight('#c4dce7', '#504034', 0.38));
  scene.add(new THREE.AmbientLight('#ede0cb', 0.08));
  // The single shadow-casting key avoids the cost and self-shadowing of many point lights.
  const keyLight = new THREE.SpotLight('#ffe8c5', 55, 20, 1.15, 0.8, 2);
  keyLight.position.set(-0.5, 4.85, -1.3); keyLight.target.position.set(-1.4, 0, 0.8);
  keyLight.castShadow = true; keyLight.shadow.mapSize.set(2048, 2048); keyLight.shadow.bias = -0.00015; keyLight.shadow.normalBias = 0.025;
  keyLight.shadow.camera.near = 0.4; keyLight.shadow.camera.far = 18;
  scene.add(keyLight, keyLight.target);
  const daylight = new THREE.DirectionalLight('#e1ecf0', 2.2);
  daylight.position.set(-12, 20, -36 - northExtension); daylight.target.position.set(-1, 0, -northExtension);
  daylight.castShadow = true;
  daylight.shadow.mapSize.set(2048, 2048);
  Object.assign(daylight.shadow.camera, {left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 100});
  daylight.shadow.bias = -.00015; daylight.shadow.normalBias = .025;
  scene.add(daylight, daylight.target);
  const exterior = createAcademicOutlook(); exterior.position.z -= northExtension; scene.add(exterior);

  // Finalize all static repeats into instanced batches (books, trim, appliances, foliage).
  for (const batch of batches.values()) {
    const mesh = new THREE.InstancedMesh(batch.geometry, batch.material, batch.matrices.length);
    batch.matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = !(batch.material instanceof THREE.MeshStandardMaterial && batch.material.emissive.getHex() !== 0 && batch.material.emissiveIntensity > 0);
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere(); scene.add(mesh);
  }
  scene.userData.apartment = { id: 'liminette-student-room', name: 'Liminette Student Room', location: 'Lux Umbrarum · Academic District', style: 'Retro-futuristic dark academia', floorArea: (16 + westExtension) * (12 + northExtension), outlook: ACADEMIC_OUTLOOK_METADATA, design: {...getRoomDesign(ROOM_CATALOG[0]), wallTreatment:'panels', ceilingTreatment:'beams'}, workstation: ADVANCED_WORKSTATION_SPEC, referenceDesk: referenceDesk.metadata, referenceLibrary: referenceLibrary.metadata, audit: {interior: fingerprintScene(scene), exterior: fingerprintScene(exterior)} };
  let disposed = false;
  const ready = Promise.all([pbr.ready, referenceDesk.ready, referenceLibrary.ready]).then(() => {
    if (!disposed) scene.userData.apartment.audit.interior = fingerprintScene(scene);
  });

  return {
    scene,
    ready,
    spawn: new THREE.Vector3(2.7, 1.65, 2.04),
    lookAt: new THREE.Vector3(1.4, 1.3, -5.7),
    bounds: { minX: -7.65 - westExtension, maxX: 7.65, minZ: -5.65 - northExtension, maxZ: 5.65 },
    colliders,
    viewpoints: [
      { id: 'outlook', label: 'Lux Umbrarum outlook', position: new THREE.Vector3(-1.85, 1.65, -4.72 - northExtension), target: new THREE.Vector3(-3, -.8, -45 - northExtension) },
      { id: 'study', label: 'The study', position: new THREE.Vector3(-.6, 1.65, -4.7), target: new THREE.Vector3(1.25, 1.18, -7.15) },
      { id: 'astronomy-desk', label: 'Astronomy desk', position: new THREE.Vector3(...REFERENCE_DESK_PLACEMENT.viewpoint), target: new THREE.Vector3(...REFERENCE_DESK_PLACEMENT.target) },
      { id: 'library', label: 'Ivory library & analog engine', position: new THREE.Vector3(-4.45, 1.75, -1.25), target: new THREE.Vector3(-10.15, 2.05, -5.0) },
      { id: 'library-detail', label: 'Brass television & valves', position: new THREE.Vector3(-8.10, 1.75, -2.35), target: new THREE.Vector3(-10.65, 2.30, -4.8) },
      { id: 'lounge', label: 'The lounge', position: new THREE.Vector3(0.69, 1.65, -0.15), target: new THREE.Vector3(-2.26, 0.96, 2.17) },
      { id: 'sleep', label: 'Sleeping alcove', position: new THREE.Vector3(5.07, 1.65, -0.7), target: new THREE.Vector3(6.27, 1.02, -4.26 - northExtension) },
      { id: 'kitchen', label: 'The kitchen', position: new THREE.Vector3(-3.22, 1.65, 3.71), target: new THREE.Vector3(-0.6, 1.38, 5.48) },
      { id: 'bathroom', label: 'Bath & wash', position: new THREE.Vector3(5.02, 1.65, 3.01), target: new THREE.Vector3(6.65, 1.2, 4.88) },
    ],
    update: elapsedSeconds => { orrery.rotation.y = elapsedSeconds * 0.085; if(projection)projection.rotation.y=elapsedSeconds*.28; },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      referenceDesk.dispose();
      referenceLibrary.dispose();
      mirror.dispose();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) { geometries.add(object.geometry); const objectMaterials = Array.isArray(object.material) ? object.material : [object.material]; objectMaterials.forEach(mat => materials.add(mat)); }
        if (object instanceof THREE.Light && object.shadow) object.shadow.dispose();
      });
      const allTextures = new Set(textures);
      materials.forEach(mat => Object.values(mat).forEach(value => { if (value instanceof THREE.Texture) allTextures.add(value); }));
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(mat => mat.dispose()); allTextures.forEach(texture => texture.dispose()); pbr.dispose(); scene.clear();
    },
  };
}
