import * as THREE from 'three';
import { ACADEMIC_CAMPUS_BUILDINGS, academicBuildingSelectableId } from '../data/academicCampus';
import { getAcademicAshlarTextures, getAcademicSlateTextures } from '../world/academicSurfaceTextures';
import { APARTMENT_SKY_METADATA } from './apartmentSky';

const BUILDING_IDS = [
  'ashcroft-grand-library', 'blackwood-great-hall', 'wren-rare-books',
  'st-anselm-chapel', 'halley-observatory', 'institute-theoretical-sciences', 'marlowe-residences',
] as const;

/** Authored window composition using the island's actual campus identities, not surveyed island coordinates. */
export const ACADEMIC_OUTLOOK_METADATA = {
  location: 'Lux Umbrarum',
  districtId: 'academic-libraries-theoretical-labs',
  district: 'Academic District — Libraries & Theoretical Labs',
  source: 'src/data/academicCampus.ts',
  coordinateSpace: 'apartment-local metres; exterior ground y = -8; north is negative z',
  locationResolution: 'Lux Umbrarum is the user-specified residence; no matching checked-in campus building record exists.',
  placement: 'Authored courtyard outlook inspired by the reference; not an exact island-coordinate reconstruction.',
  exteriorGroundY: -8,
  buildings: BUILDING_IDS.map(id => {
    const record = ACADEMIC_CAMPUS_BUILDINGS.find(building => building.id === id)!;
    return { id, selectableId: academicBuildingSelectableId(id), name: record.name, kind: record.kind, founded: record.founded };
  }),
  sky: APARTMENT_SKY_METADATA,
} as const;

/** True 3D scenery shared by all north windows, with ground, branches and deep architectural parallax. */
export function createAcademicOutlook(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'Lux Umbrarum · Academic District outlook';
  root.userData.academicOutlook = ACADEMIC_OUTLOOK_METADATA;
  root.userData.exterior = true;
  const groundY = -8;
  let seed = 0x42ad91;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 10);
  const coneGeometry = new THREE.ConeGeometry(1, 1, 8);
  const sphereGeometry = new THREE.SphereGeometry(1, 10, 7);
  const crownGeometry = new THREE.IcosahedronGeometry(1, 1);
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -.5); leafShape.quadraticCurveTo(.4, 0, 0, .5); leafShape.quadraticCurveTo(-.4, 0, 0, -.5);
  const leafGeometry = new THREE.ShapeGeometry(leafShape, 3);
  const batches = new Map<string, { geometry: THREE.BufferGeometry; material: THREE.Material; matrices: THREE.Matrix4[]; colors: THREE.Color[] }>();
  const transform = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);

  // Exterior materials see outdoor irradiance, never the apartment's brown
  // reflection probe. These six tiny faces are lighting data, not a backdrop:
  // every visible courtyard and skyline silhouette remains geometry.
  const skyFaces = Array.from({ length: 6 }, (_, face) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d')!;
    if (face === 2 || face === 3) {
      context.fillStyle = face === 2 ? '#c2d9e5' : '#65725c';
    } else {
      const gradient = context.createLinearGradient(0, 0, 0, 64);
      gradient.addColorStop(0, '#b2d2e3'); gradient.addColorStop(.48, '#d4deda');
      gradient.addColorStop(.57, '#a5afa0'); gradient.addColorStop(1, '#737965');
      context.fillStyle = gradient;
    }
    context.fillRect(0, 0, 64, 64);
    return canvas;
  });
  const outdoorEnvironment = new THREE.CubeTexture(skyFaces);
  outdoorEnvironment.name = 'Academic outlook · neutral daylight irradiance';
  outdoorEnvironment.colorSpace = THREE.SRGBColorSpace;
  outdoorEnvironment.needsUpdate = true;

  function standard(name: string, color: string, roughness = .82, metalness = 0) {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness, envMap: outdoorEnvironment, envMapIntensity: 1.35 });
    material.name = `Outlook · ${name}`;
    return material;
  }
  const ashlar = getAcademicAshlarTextures();
  const slateTextures = getAcademicSlateTextures();
  const stone = standard('weathered collegiate ashlar', '#f8faf4', .95);
  stone.map = ashlar.albedo; stone.bumpMap = ashlar.height; stone.bumpScale = .09;
  const dressedStone = standard('dressed limestone', '#b8b29c', .88);
  const darkStone = standard('stone recesses', '#686d66', 1);
  const roofSlate = standard('layered Welsh slate', '#c3cfda', .83);
  roofSlate.map = slateTextures.albedo; roofSlate.bumpMap = slateTextures.height; roofSlate.bumpScale = .065;
  const roofEdge = standard('slate ridge and flashing', '#364347', .72, .1);
  const copper = standard('oxidized copper', '#557b72', .6, .55);
  const iron = standard('wrought iron', '#252d2b', .65, .72);
  const brass = standard('aged brass', '#9b865a', .48, .65);
  const darkGlass = standard('leaded blue glass', '#354952', .24, .24);
  const amberGlass = standard('occupied reading rooms', '#81664d', .37, .08);
  amberGlass.emissive.set('#745337'); amberGlass.emissiveIntensity = .2;
  const oak = standard('oak doors and benches', '#524336', .91);
  const grass = standard('collegiate lawns', '#426f36', .98);
  const grassLight = standard('mown stripes', '#4a773e', .99);
  const path = standard('worn limestone paths', '#aaa58e', .95);
  const soil = standard('planting beds', '#383a27', 1);
  const trunk = standard('fissured oak bark', '#494539', 1);
  const foliage = ['#324b26', '#3c602e', '#517438', '#688744', '#475d31'].map((color, i) => standard(`foliage ${i}`, color, .96));
  foliage.forEach(material => { material.side = THREE.DoubleSide; });
  const burgundyLeaves = standard('copper beech leaves', '#674c38', .96); burgundyLeaves.side = THREE.DoubleSide;
  const skyline = standard('distant city silhouette', '#17272e', .83, .2);
  const researchSkin = standard('research superstructures', '#adb6b8', .48, .48);
  const researchDark = standard('research glazing', '#253d49', .25, .48);

  function place(geometry: THREE.BufferGeometry, material: THREE.Material, position: THREE.Vector3, scale: THREE.Vector3,
    rotation = new THREE.Euler(), parent: THREE.Object3D = root, tint?: THREE.Color) {
    const key = `${geometry.uuid}:${material.uuid}`;
    let batch = batches.get(key);
    if (!batch) { batch = { geometry, material, matrices: [], colors: [] }; batches.set(key, batch); }
    transform.position.copy(position); transform.scale.copy(scale); transform.rotation.copy(rotation); transform.updateMatrix();
    parent.updateWorldMatrix(true, false);
    batch.matrices.push(new THREE.Matrix4().multiplyMatrices(parent.matrixWorld, transform.matrix));
    batch.colors.push(tint ?? new THREE.Color(1, 1, 1));
  }
  function box(material: THREE.Material, x: number, y: number, z: number, width: number, height: number, depth: number,
    parent: THREE.Object3D = root, rotation = new THREE.Euler()) {
    place(boxGeometry, material, new THREE.Vector3(x, y, z), new THREE.Vector3(width, height, depth), rotation, parent);
  }
  function rod(material: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, radius: number, parent: THREE.Object3D = root) {
    const direction = b.clone().sub(a);
    const rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize()));
    place(cylinderGeometry, material, a.clone().add(b).multiplyScalar(.5), new THREE.Vector3(radius, direction.length(), radius), rotation, parent);
  }
  function sphere(material: THREE.Material, x: number, y: number, z: number, rx: number, ry = rx, rz = rx, parent: THREE.Object3D = root) {
    place(sphereGeometry, material, new THREE.Vector3(x, y, z), new THREE.Vector3(rx, ry, rz), new THREE.Euler(), parent);
  }
  function roof(width: number, depth: number, height: number, rise: number, parent: THREE.Object3D) {
    const half = width / 2 + .45;
    const slope = Math.atan2(rise, half);
    const length = Math.hypot(half, rise);
    for (const side of [-1, 1]) {
      box(roofSlate, side * half / 2, height + rise / 2, 0, length, .19, depth + .8, parent, new THREE.Euler(0, 0, -side * slope));
      box(roofEdge, side * half, height, 0, .16, .23, depth + .95, parent);
    }
    box(roofEdge, 0, height + rise + .1, 0, .3, .24, depth + .95, parent);
    const shape = new THREE.Shape(); shape.moveTo(-width / 2, 0); shape.lineTo(width / 2, 0); shape.lineTo(0, rise); shape.closePath();
    const gable = new THREE.ExtrudeGeometry(shape, { depth: .25, bevelEnabled: false });
    for (const side of [-1, 1]) place(gable, stone, new THREE.Vector3(0, height, side * depth / 2 - .12), new THREE.Vector3(1, 1, 1), new THREE.Euler(), parent);
    for (const z of [-depth / 2 - .2, depth / 2 + .2]) for (const side of [-1, 1]) {
      rod(dressedStone, new THREE.Vector3(side * (width / 2 + .25), height, z), new THREE.Vector3(0, height + rise + .14, z), .12, parent);
    }
    for (const z of [-depth * .32, depth * .32]) {
      box(stone, width * .18, height + rise * .7, z, .7, 3, .85, parent);
      box(dressedStone, width * .18, height + rise * .7 + 1.55, z, .87, .26, 1.02, parent);
      for (const dx of [-.2, .2]) place(cylinderGeometry, roofEdge, new THREE.Vector3(width * .18 + dx, height + rise * .7 + 1.9, z), new THREE.Vector3(.13, .55, .13), new THREE.Euler(), parent);
    }
  }
  function lancet(x: number, y: number, z: number, width: number, height: number, parent: THREE.Object3D, lit = false, yaw = 0) {
    const bay = new THREE.Group(); bay.position.set(x, y, z); bay.rotation.y = yaw; parent.add(bay);
    box(darkStone, 0, 0, -.015, width + .34, height + .3, .23, bay);
    box(lit ? amberGlass : darkGlass, 0, 0, .115, width, height, .025, bay);
    for (const xx of [-width / 2 - .055, width / 2 + .055]) box(dressedStone, xx, 0, .21, .14, height + .38, .22, bay);
    for (const yy of [-height / 2 - .08, height / 2 + .08]) box(dressedStone, 0, yy, .21, width + .4, .17, .27, bay);
    box(dressedStone, 0, 0, .23, .075, height, .1, bay);
    box(iron, 0, -.1, .252, width, .055, .07, bay);
    for (let yy = -height / 2 + .26; yy < height / 2; yy += .44) box(iron, 0, yy, .254, width, .025, .025, bay);
    for (const side of [-1, 1]) rod(dressedStone, new THREE.Vector3(side * width * .49, height * .32, .23), new THREE.Vector3(0, height / 2 + .48, .23), .065, bay);
  }
  function building(id: typeof BUILDING_IDS[number], x: number, z: number, width: number, depth: number, height: number, yaw = 0) {
    const record = ACADEMIC_CAMPUS_BUILDINGS.find(entry => entry.id === id)!;
    const anchor = new THREE.Group(); anchor.name = record.name; anchor.position.set(x, groundY, z); anchor.rotation.y = yaw;
    anchor.userData = { sourceBuildingId: id, sourceSelectableId: academicBuildingSelectableId(id), semanticName: record.name, founded: record.founded, authoredOutlookPlacement: true };
    root.add(anchor);
    box(stone, 0, height / 2, 0, width, height, depth, anchor);
    box(darkStone, 0, .45, 0, width + .45, .9, depth + .45, anchor);
    for (const yy of [1.05, height * .48, height - .35, height + .05]) box(dressedStone, 0, yy, 0, width + .4, .22, depth + .4, anchor);
    const columns = Math.max(3, Math.floor(width / 3.4));
    for (let row = 0; row < 3; row++) for (let column = 0; column < columns; column++) {
      const xx = -width * .39 + column / Math.max(1, columns - 1) * width * .78;
      if (row === 0 && Math.abs(xx) < 1.5) continue;
      lancet(xx, 2.3 + row * (height - 4) / 2, depth / 2 + .06, .98, 1.75, anchor, random() > .8);
    }
    for (const side of [-1, 1]) for (let i = 0; i < Math.max(3, Math.floor(depth / 3)); i++) {
      const zz = -depth * .36 + i * depth * .72 / (Math.max(3, Math.floor(depth / 3)) - 1);
      for (let row = 0; row < 2; row++) lancet(side * (width / 2 + .06), 3.1 + row * 3.3, zz, .9, 1.9, anchor, false, side * Math.PI / 2);
    }
    for (const xx of [-width / 2, width / 2]) for (const zz of [-depth / 2, depth / 2]) {
      box(dressedStone, xx, height * .39, zz, .7, height * .78, .72, anchor);
      box(darkStone, xx, .55, zz, 1.03, 1.1, 1.07, anchor);
      place(coneGeometry, dressedStone, new THREE.Vector3(xx, height + .85, zz), new THREE.Vector3(.34, 1.5, .34), new THREE.Euler(0, Math.PI / 4, 0), anchor);
    }
    box(oak, 0, 1.5, depth / 2 + .1, 1.9, 3, .2, anchor);
    for (const xx of [-1.1, 1.1]) box(dressedStone, xx, 1.65, depth / 2 + .23, .22, 3.3, .43, anchor);
    rod(dressedStone, new THREE.Vector3(-1.2, 3.12, depth / 2 + .23), new THREE.Vector3(0, 4.08, depth / 2 + .23), .17, anchor);
    rod(dressedStone, new THREE.Vector3(1.2, 3.12, depth / 2 + .23), new THREE.Vector3(0, 4.08, depth / 2 + .23), .17, anchor);
    box(brass, 1.55, 1.55, depth / 2 + .15, .48, .4, .055, anchor);
    for (let step = 0; step < 3; step++) box(dressedStone, 0, .09 + step * .14, depth / 2 + .7 - step * .2, 3.05 - step * .12, .18, 1.05 - step * .18, anchor);
    roof(width, depth, height, Math.min(6, width * .28), anchor);
    return anchor;
  }

  // Landscaped quadrangle is a real foreground several metres below the apartment.
  box(grass, 0, groundY - .25, -87, 210, .5, 165);
  for (let i = 0; i < 18; i++) box(grassLight, -51 + i * 6, groundY + .018, -33, 3, .025, 42);
  for (const z of [-14.7, -36.5, -62]) box(path, -2, groundY + .045, z, 116, .065, z === -36.5 ? 3.5 : 2.4);
  box(path, -6.6, groundY + .06, -38, 3.5, .06, 55);
  for (const x of [-25, 15]) box(path, x, groundY + .052, -35, 1.9, .06, 43);
  for (const x of [-44, 36]) box(soil, x, groundY + .08, -25, 7, .16, 15);
  // Lux Umbrarum's lower exterior wall and projecting sill masonry.
  box(stone, 0, -4.3, -6.65, 18, 7.4, .65);
  box(dressedStone, 0, -.65, -6.85, 18.4, .22, 1.05);
  for (const x of [-8.4, -3.65, -.2, 7.8]) box(dressedStone, x, -4.4, -7.05, .5, 7.2, .46);

  // Iron palings, spear finials, gate posts and restrained college lighting.
  for (let x = -57; x <= 57; x += .68) {
    if (x > -9.1 && x < -4.1) continue;
    box(iron, x, groundY + 1.02, -17.1, .055, 1.86, .055);
    place(coneGeometry, iron, new THREE.Vector3(x, groundY + 2.02, -17.1), new THREE.Vector3(.11, .24, .11));
  }
  for (const span of [{ x: -33.4, width: 47.2 }, { x: 26.7, width: 60.8 }]) for (const y of [.5, 1.42]) box(iron, span.x, groundY + y, -17.1, span.width, .055, .065);
  for (const x of [-57, -9.25, -4, 57]) {
    box(stone, x, groundY + 1.1, -17.1, .6, 2.2, .65);
    box(dressedStone, x, groundY + 2.25, -17.1, .82, .18, .87);
    sphere(dressedStone, x, groundY + 2.57, -17.1, .24);
  }
  for (const x of [-23, 13]) for (const z of [-19.5, -33.5]) {
    rod(iron, new THREE.Vector3(x, groundY, z), new THREE.Vector3(x, groundY + 3.3, z), .065);
    box(iron, x, groundY + 3.6, z, .5, .7, .5);
    box(amberGlass, x, groundY + 3.6, z + .26, .32, .5, .025);
    place(coneGeometry, iron, new THREE.Vector3(x, groundY + 4.06, z), new THREE.Vector3(.4, .3, .4));
  }
  for (const x of [-17, 9]) {
    for (const z of [-33.9, -33.55, -33.2]) box(oak, x, groundY + .6, z, 2.5, .1, .23);
    for (const y of [.92, 1.16]) box(oak, x, groundY + y, -34.02, 2.5, .17, .08);
    for (const dx of [-.9, .9]) for (const z of [-33.95, -33.25]) rod(iron, new THREE.Vector3(x + dx, groundY, z), new THREE.Vector3(x + dx, groundY + .63, z), .055);
  }
  // A low central stone basin provides another scale cue beneath the windows.
  place(cylinderGeometry, dressedStone, new THREE.Vector3(-6.6, groundY + .3, -37), new THREE.Vector3(2.4, .6, 2.4));
  place(cylinderGeometry, darkGlass, new THREE.Vector3(-6.6, groundY + .63, -37), new THREE.Vector3(2.07, .018, 2.07));
  place(cylinderGeometry, stone, new THREE.Vector3(-6.6, groundY + 1.2, -37), new THREE.Vector3(.42, 1.2, .42));
  sphere(dressedStone, -6.6, groundY + 1.88, -37, .52, .28, .52);

  building('ashcroft-grand-library', -29, -48, 25.6, 14, 12.5, .025);
  building('wren-rare-books', 15, -72, 19, 12, 11.4, -.05);
  building('institute-theoretical-sciences', -54, -85, 22, 15, 15.3, .1);
  building('marlowe-residences', 48, -67, 28, 14, 12, -.18);
  const hall = building('blackwood-great-hall', -5, -76, 26, 15, 14.2);
  box(stone, 0, 12, 6, 5.6, 24, 5.4, hall);
  for (const y of [14.8, 18.8, 23.7]) box(dressedStone, 0, y, 6, 6.05, .36, 5.85, hall);
  for (const xx of [-2.7, 2.7]) for (const zz of [3.4, 8.6]) place(coneGeometry, roofSlate, new THREE.Vector3(xx, 25.3, zz), new THREE.Vector3(.6, 3.1, .6), new THREE.Euler(), hall);
  const clockFace = new THREE.CircleGeometry(1.45, 40);
  place(clockFace, dressedStone, new THREE.Vector3(0, 20.9, 8.74), new THREE.Vector3(1, 1, 1), new THREE.Euler(), hall);
  box(iron, .36, 21.02, 8.78, .91, .085, .03, hall, new THREE.Euler(0, 0, .48));
  box(iron, 0, 21.34, 8.8, .085, 1.01, .03, hall, new THREE.Euler(0, 0, -.1));
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    box(iron, Math.sin(angle) * 1.16, 20.9 + Math.cos(angle) * 1.16, 8.78, .09, .19, .04, hall, new THREE.Euler(0, 0, -angle));
  }
  const chapel = building('st-anselm-chapel', 30, -49, 10.5, 24, 14.6, -.055);
  for (const side of [-1, 1]) for (let z = -9; z <= 9; z += 4.5) {
    box(dressedStone, side * 5.8, 4.2, z, .9, 8.4, 1.15, chapel);
    rod(dressedStone, new THREE.Vector3(side * 6.1, 7.4, z), new THREE.Vector3(side * 5.25, 11.8, z), .25, chapel);
  }
  box(stone, 1, 9.5, 5.1, 5.3, 19, 5.3, chapel);
  for (const y of [13, 16.5, 18.8]) box(dressedStone, 1, y, 5.1, 5.8, .32, 5.8, chapel);
  for (const xx of [-.15, 2.15]) lancet(xx, 16.1, 7.81, .72, 2.3, chapel);
  place(new THREE.ConeGeometry(3.2, 9.6, 4), roofSlate, new THREE.Vector3(1, 23.7, 5.1), new THREE.Vector3(1, 1, 1), new THREE.Euler(0, Math.PI / 4, 0), chapel);
  rod(iron, new THREE.Vector3(1, 28.1, 5.1), new THREE.Vector3(1, 29.8, 5.1), .075, chapel);
  rod(iron, new THREE.Vector3(.5, 29.05, 5.1), new THREE.Vector3(1.5, 29.05, 5.1), .055, chapel);
  const observatory = building('halley-observatory', -39, -84, 12.5, 12.5, 12);
  place(cylinderGeometry, stone, new THREE.Vector3(0, 14, 0), new THREE.Vector3(5.2, 7, 5.2), new THREE.Euler(), observatory);
  const domeGeometry = new THREE.SphereGeometry(5.35, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  place(domeGeometry, copper, new THREE.Vector3(0, 17.5, 0), new THREE.Vector3(1, 1, 1), new THREE.Euler(), observatory);
  box(roofEdge, 0, 20.1, 1.1, .5, 5.9, 5.5, observatory, new THREE.Euler(-.15, 0, 0));

  function tree(x: number, z: number, height: number, radius: number, beech = false) {
    const base = new THREE.Vector3(x, groundY, z);
    const crown = new THREE.Vector3(x + (random() - .5) * .6, groundY + height * .77, z);
    rod(trunk, base, crown, height * .026);
    for (let branch = 0; branch < 9; branch++) {
      const angle = branch * 2.399;
      const endpoint = new THREE.Vector3(x + Math.cos(angle) * radius * .78, groundY + height * (.64 + random() * .24), z + Math.sin(angle) * radius * .78);
      const start = base.clone().lerp(crown, .47 + random() * .2);
      rod(trunk, start, endpoint, .07 + height * .006);
      const tip = endpoint.clone().add(new THREE.Vector3(Math.cos(angle) * .7, .9, Math.sin(angle) * .7));
      rod(trunk, endpoint, tip, .045);
    }
    const treeColors = beech ? [burgundyLeaves, foliage[0], burgundyLeaves] : foliage;
    for (let cluster = 0; cluster < 54; cluster++) {
      const angle = cluster * 2.399;
      const radial = Math.sqrt(random()) * radius;
      const cx = crown.x + Math.cos(angle) * radial;
      const cz = crown.z + Math.sin(angle) * radial;
      const cy = crown.y + (random() - .5) * radius * .9 + .4;
      const material = treeColors[cluster % treeColors.length];
      const tint = new THREE.Color().setScalar(.78 + random() * .32);
      place(crownGeometry, material, new THREE.Vector3(cx, cy, cz), new THREE.Vector3(.3 + random() * .23, .23 + random() * .24, .3 + random() * .23), new THREE.Euler(random(), random(), random()), root, tint);
      for (let leaf = 0; leaf < 12; leaf++) {
        place(leafGeometry, material, new THREE.Vector3(cx + (random() - .5) * 1.65, cy + (random() - .5) * 1.1, cz + (random() - .5) * 1.6), new THREE.Vector3(.55, .8, .55), new THREE.Euler(random() * 2.7, random() * 6.28, random() * 3), root, tint);
      }
    }
    for (let rootIndex = 0; rootIndex < 5; rootIndex++) {
      const angle = rootIndex * 1.256;
      rod(trunk, new THREE.Vector3(x, groundY + .5, z), new THREE.Vector3(x + Math.cos(angle) * .9, groundY + .05, z + Math.sin(angle) * .9), .095);
    }
  }
  const treePlacements = [
    [-19, -23, 9.2, 3.3], [13.5, -27, 10.4, 3.7], [-44, -25, 11, 4.2], [39, -27, 10, 3.7],
    [-45, -43, 12, 4.3], [48, -42, 11.4, 4], [-21, -37, 8.2, 2.8], [5, -48, 8.6, 2.7],
    [-18, -65, 9, 3.4], [46, -83, 10.1, 3.6], [-64, -51, 11, 4.4], [67, -54, 12, 4.4],
  ];
  treePlacements.forEach(([x, z, height, radius], index) => tree(x, z, height, radius, index === 3 || index === 6));
  // Dense clipped yew hedges and individual groundcover leaves soften the courtyard edges.
  for (const x of [-44, 36]) for (let i = 0; i < 26; i++) {
    sphere(foliage[0], x + (i % 2 ? 2.6 : -2.6), groundY + .48, -31.5 + Math.floor(i / 2) * 1.06, .72, .57, .7);
  }
  for (let i = 0; i < 160; i++) {
    const x = (i % 2 ? 36 : -44) + (random() - .5) * 5;
    const z = -25 + (random() - .5) * 13;
    place(leafGeometry, foliage[i % foliage.length], new THREE.Vector3(x, groundY + .25, z), new THREE.Vector3(.22, .42, .22), new THREE.Euler(.65, random() * 6.28, random() * 2));
  }

  // A distant research campus and black city skyline preserve the island's retro-futuristic contrast.
  for (let i = 0; i < 49; i++) {
    const x = -124 + i * 5.1;
    const height = 16 + random() * 29 + (i % 9 === 0 ? 21 : 0);
    const z = -149 - random() * 20;
    const width = 2.3 + random() * 4.2;
    box(skyline, x, groundY + height / 2, z, width, height, 5 + random() * 8);
    if (i % 4 === 0) box(skyline, x, groundY + height + 2.5, z, width * .55, 5, 3);
    if (i % 7 === 0) rod(skyline, new THREE.Vector3(x, groundY + height, z), new THREE.Vector3(x, groundY + height + 12, z), .12);
  }
  for (const [x, z, height] of [[-62, -113, 49], [-80, -126, 66], [-46, -120, 37]]) {
    box(researchDark, x, groundY + height / 2, z, 8, height, 10);
    for (const dx of [-4.2, 4.2]) box(researchSkin, x + dx, groundY + height / 2 + 2, z, 1.2, height + 5, 11);
    for (let level = 3; level < height; level += 4) box(researchSkin, x, groundY + level, z + 5.15, 9.8, .24, .36);
    const ring = new THREE.TorusGeometry(8.6, .65, 8, 48);
    place(ring, researchSkin, new THREE.Vector3(x, groundY + height - 5, z), new THREE.Vector3(1, 1, 1), new THREE.Euler(Math.PI / 2, 0, 0));
    for (const dx of [-5.6, 5.6]) rod(researchSkin, new THREE.Vector3(x + dx, groundY + height - 5, z), new THREE.Vector3(x + dx * .4, groundY + height + 5, z), .28);
  }
  box(researchSkin, -68, groundY + 21, -123, 35, 1.8, 5.3);
  box(researchDark, -68, groundY + 22.1, -123, 35, 1.7, 4.6);

  for (const batch of batches.values()) {
    const mesh = new THREE.InstancedMesh(batch.geometry, batch.material, batch.matrices.length);
    mesh.name = `${batch.material.name || batch.material.type} · ${batch.matrices.length} instances`;
    batch.matrices.forEach((matrix, index) => { mesh.setMatrixAt(index, matrix); mesh.setColorAt(index, batch.colors[index]); });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = !(batch.material instanceof THREE.MeshBasicMaterial);
    mesh.receiveShadow = true;
    mesh.computeBoundingBox(); mesh.computeBoundingSphere();
    root.add(mesh);
  }
  root.userData.academicOutlook = {
    ...ACADEMIC_OUTLOOK_METADATA,
    buildingCount: BUILDING_IDS.length,
    treeCount: treePlacements.length,
    instanceCount: [...batches.values()].reduce((count, batch) => count + batch.matrices.length, 0),
    instancedDrawCalls: batches.size,
    minimumCameraFar: 300,
  };
  return root;
}
