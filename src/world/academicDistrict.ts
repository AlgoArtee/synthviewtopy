import * as THREE from 'three';
import {
  BIOME_RING_RADIUS,
  COASTAL_RAIL_INSET,
  ISLAND_APOTHEM,
  ISLAND_SURFACE_Y,
} from '../config/island';
import type { DistrictDefinition } from '../data/districts';
import {
  ACADEMIC_CAMPUS_BUILDINGS,
  ACADEMIC_CAMPUS_HIDDEN_DETAILS,
  academicBuildingSelectableId,
  academicCampusBuildingByName,
  type AcademicCampusBuilding,
  type AcademicInteriorKind,
} from '../data/academicCampus';
import { ACADEMIC_FOUNTAIN_COURT_NAME } from '../data/academicFountain';
import {
  getAcademicAshlarTextures,
  getAcademicLeafPathTextures,
  getAcademicOakTextures,
  getAcademicSlateTextures,
  tileAcademicPathGeometry,
} from './academicSurfaceTextures';
import { buildAcademicTreeSystem } from './academicTrees';

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitCylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const lowPolyCrown = new THREE.IcosahedronGeometry(0.5, 1);
const up = new THREE.Vector3(0, 1, 0);

interface AcademicMaterials {
  limestone: THREE.MeshPhysicalMaterial;
  repairedStone: THREE.MeshStandardMaterial;
  slate: THREE.MeshStandardMaterial;
  oak: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  copper: THREE.MeshStandardMaterial;
  iron: THREE.MeshStandardMaterial;
  wetCobble: THREE.MeshPhysicalMaterial;
  leadedGlass: THREE.MeshStandardMaterial;
  stainedGlass: THREE.MeshStandardMaterial;
  moss: THREE.MeshStandardMaterial;
  plaster: THREE.MeshStandardMaterial;
  water: THREE.MeshPhysicalMaterial;
  foliage: THREE.MeshStandardMaterial;
  yew: THREE.MeshStandardMaterial;
  leaf: THREE.MeshStandardMaterial;
  earthPath: THREE.MeshStandardMaterial;
  darkness: THREE.MeshBasicMaterial;
}

export interface AcademicDistrictBuildResult {
  readonly facilities: THREE.Group[];
  readonly features: THREE.Object3D[];
  readonly localRoads: THREE.Mesh[];
}

function makeNoiseTexture(colors: readonly [string, string], size = 192) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const left = new THREE.Color(colors[0]);
  const right = new THREE.Color(colors[1]);
  const image = context.createImageData(size, size);
  let seed = 0x5f3759df;
  for (let index = 0; index < size * size; index += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const noise = (seed & 0xffff) / 0xffff;
    const color = left.clone().lerp(right, noise * 0.72);
    const offset = index * 4;
    image.data[offset] = Math.round(color.r * 255);
    image.data[offset + 1] = Math.round(color.g * 255);
    image.data[offset + 2] = Math.round(color.b * 255);
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeCanalRippleTexture(size = 192) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const image = context.createImageData(size, size);
  let seed = 0x31a7c0de;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const noise = ((seed >>> 16) / 0xffff - 0.5) * 8;
      const broad = Math.sin(y * 0.24 + Math.sin(x * 0.07) * 1.8) * 17;
      const cross = Math.sin(y * 0.47 - x * 0.105) * 7;
      const value = Math.round(THREE.MathUtils.clamp(128 + broad + cross + noise, 76, 180));
      const offset = (y * size + x) * 4;
      image.data[offset] = value;
      image.data[offset + 1] = value;
      image.data[offset + 2] = value;
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.6, 1);
  texture.anisotropy = 4;
  return texture;
}

function createMaterials(): AcademicMaterials {
  const limestone = getAcademicAshlarTextures('medieval');
  const repairedStone = getAcademicAshlarTextures('repair');
  const slate = getAcademicSlateTextures();
  const oak = getAcademicOakTextures();
  const earthPath = getAcademicLeafPathTextures();
  const cobbleNoise = makeNoiseTexture(['#252a2b', '#555752']);
  const canalRipples = makeCanalRippleTexture();
  const materials: AcademicMaterials = {
    limestone: new THREE.MeshPhysicalMaterial({
      color: '#d8d2c5',
      map: limestone.albedo,
      bumpMap: limestone.height,
      bumpScale: 0.032,
      roughness: 0.9,
      metalness: 0,
      clearcoat: 0.03,
      clearcoatRoughness: 0.8,
    }),
    repairedStone: new THREE.MeshStandardMaterial({
      color: '#e0dbcf',
      map: repairedStone.albedo,
      bumpMap: repairedStone.height,
      bumpScale: 0.022,
      roughness: 0.86,
      metalness: 0,
    }),
    slate: new THREE.MeshStandardMaterial({
      color: '#aeb4b3',
      map: slate.albedo,
      bumpMap: slate.height,
      bumpScale: 0.027,
      roughness: 0.88,
      metalness: 0,
    }),
    oak: new THREE.MeshStandardMaterial({
      color: '#b29a87',
      map: oak.albedo,
      bumpMap: oak.height,
      bumpScale: 0.018,
      roughness: 0.88,
      metalness: 0,
    }),
    brass: new THREE.MeshStandardMaterial({ color: '#75572b', roughness: 0.42, metalness: 0.82 }),
    copper: new THREE.MeshStandardMaterial({ color: '#315f58', roughness: 0.65, metalness: 0.68 }),
    iron: new THREE.MeshStandardMaterial({ color: '#101213', roughness: 0.63, metalness: 0.78 }),
    wetCobble: new THREE.MeshPhysicalMaterial({
      color: '#383d3c',
      map: cobbleNoise,
      bumpMap: cobbleNoise,
      bumpScale: 0.035,
      roughness: 0.32,
      metalness: 0.04,
      clearcoat: 0.55,
      clearcoatRoughness: 0.25,
    }),
    leadedGlass: new THREE.MeshStandardMaterial({
      color: '#7d725d', emissive: '#c48b42', emissiveIntensity: 1.15, roughness: 0.28, metalness: 0.12,
    }),
    stainedGlass: new THREE.MeshStandardMaterial({
      color: '#6b2947', emissive: '#d58d62', emissiveIntensity: 1.3, roughness: 0.25, metalness: 0.05,
    }),
    moss: new THREE.MeshStandardMaterial({ color: '#263226', roughness: 1 }),
    plaster: new THREE.MeshStandardMaterial({ color: '#81796b', roughness: 0.92 }),
    water: new THREE.MeshPhysicalMaterial({
      color: '#15343b', emissive: '#081f25', emissiveIntensity: 0.2, roughness: 0.36, metalness: 0.03,
      bumpMap: canalRipples, bumpScale: 0.022,
      clearcoat: 0.52, clearcoatRoughness: 0.28, transparent: true, opacity: 0.93,
      side: THREE.DoubleSide,
    }),
    foliage: new THREE.MeshStandardMaterial({ color: '#283324', roughness: 1 }),
    yew: new THREE.MeshStandardMaterial({ color: '#16221b', roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#4d3822', roughness: 1 }),
    earthPath: new THREE.MeshStandardMaterial({
      color: '#d2c9b8',
      map: earthPath.albedo,
      bumpMap: earthPath.height,
      bumpScale: 0.025,
      roughness: 0.96,
      metalness: 0,
    }),
    darkness: new THREE.MeshBasicMaterial({ color: '#050607' }),
  };
  materials.limestone.name = 'Academic weathered ashlar limestone';
  materials.repairedStone.name = 'Academic pale repair stone';
  materials.slate.name = 'Academic chipped slate';
  materials.oak.name = 'Academic aged oak';
  materials.iron.name = 'Academic blackened cast iron';
  materials.earthPath.name = 'Academic leaf-strewn earth path';
  Object.entries(materials).forEach(([key, material]) => {
    if (!['foliage', 'yew', 'leaf', 'moss'].includes(key)) material.userData.excludeSeasonFoliage = true;
  });
  return materials;
}

function prepare<T extends THREE.Object3D>(object: T, districtId: string, role?: string) {
  object.userData.districtId = districtId;
  if (role) object.userData.academicFeatureType = role;
  if (object instanceof THREE.Mesh) {
    object.castShadow = true;
    object.receiveShadow = true;
  }
  return object;
}

function addBox(
  parent: THREE.Object3D,
  districtId: string,
  name: string,
  size: readonly [number, number, number],
  material: THREE.Material,
  position: readonly [number, number, number],
  options: { obstacle?: boolean; walkable?: boolean } = {},
) {
  const mesh = prepare(new THREE.Mesh(unitBox, material), districtId);
  mesh.name = name;
  mesh.scale.set(...size);
  mesh.position.set(...position);
  mesh.userData.navObstacle = options.obstacle === true;
  mesh.userData.walkable = options.walkable === true;
  parent.add(mesh);
  return mesh;
}

function addSegment(
  parent: THREE.Object3D,
  districtId: string,
  name: string,
  start: THREE.Vector3,
  end: THREE.Vector3,
  width: number,
  height: number,
  material: THREE.Material,
  y = 0.025,
  options: { walkable?: boolean; obstacle?: boolean } = {},
) {
  const direction = end.clone().sub(start);
  const length = Math.max(direction.length(), 0.01);
  const mesh = addBox(
    parent,
    districtId,
    name,
    [width, height, length],
    material,
    [(start.x + end.x) * 0.5, y, (start.z + end.z) * 0.5],
    options,
  );
  mesh.rotation.y = Math.atan2(direction.x, direction.z);
  return mesh;
}

/**
 * Campus paths are thin terrain dressings, not structural road slabs. Keeping
 * their upper face six centimetres above the district datum avoids z-fighting
 * while remaining comfortably below WALK's step threshold.
 */
function addGroundPath(
  parent: THREE.Object3D,
  districtId: string,
  name: string,
  start: THREE.Vector3,
  end: THREE.Vector3,
  width: number,
  material: THREE.Material,
) {
  const length = Math.max(start.distanceTo(end), 0.01);
  const direction = end.clone().sub(start);
  const geometry = tileAcademicPathGeometry(new THREE.BoxGeometry(width, 0.006, length));
  const path = prepare(new THREE.Mesh(geometry, material), districtId);
  path.name = name;
  path.position.set((start.x + end.x) * 0.5, 0.003, (start.z + end.z) * 0.5);
  path.rotation.y = Math.atan2(direction.x, direction.z);
  path.userData.navObstacle = false;
  path.userData.walkable = true;
  parent.add(path);
  path.userData.naturalGroundPath = true;
  path.userData.roadEndpoints = { start: start.toArray(), end: end.toArray() };
  return path;
}

function createPathLeafLitter(
  definition: DistrictDefinition,
  paths: readonly THREE.Mesh[],
  materials: AcademicMaterials,
) {
  const pathCounts = paths.map((path) => {
    const parameters = (path.geometry as THREE.BoxGeometry).parameters;
    const length = (parameters?.depth ?? 1) * path.scale.z;
    return Math.max(6, Math.min(120, Math.round(length * 2.2)));
  });
  const total = pathCounts.reduce((sum, count) => sum + count, 0);
  const geometry = new THREE.CircleGeometry(0.018, 5);
  geometry.rotateX(-Math.PI * 0.5);
  const litter = prepare(new THREE.InstancedMesh(geometry, materials.leaf, total), definition.id, 'fallen leaves');
  litter.name = `${definition.id}__ACADEMIC_PATH_LEAF_LITTER`;
  litter.castShadow = false;
  litter.receiveShadow = true;
  litter.userData.academicLeafLitter = true;
  litter.userData.leafClusterCount = total;
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  const colors = ['#6f3222', '#9b4f27', '#b47631', '#563b28', '#7f602f'];
  let seed = 0xa11ce57;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  let instance = 0;
  paths.forEach((path, pathIndex) => {
    const parameters = (path.geometry as THREE.BoxGeometry).parameters;
    const width = (parameters?.width ?? 1) * path.scale.x;
    const length = (parameters?.depth ?? 1) * path.scale.z;
    const cosine = Math.cos(path.rotation.y);
    const sine = Math.sin(path.rotation.y);
    for (let index = 0; index < pathCounts[pathIndex]; index += 1) {
      const localX = (random() - 0.5) * width * 0.86;
      const localZ = (random() - 0.5) * length * 0.96;
      position.set(
        path.position.x + localX * cosine + localZ * sine,
        0.0072 + random() * 0.0008,
        path.position.z - localX * sine + localZ * cosine,
      );
      quaternion.setFromAxisAngle(up, random() * Math.PI * 2);
      const size = 0.58 + random() * 0.82;
      scale.set(size * (0.72 + random() * 0.5), 1, size);
      matrix.compose(position, quaternion, scale);
      litter.setMatrixAt(instance, matrix);
      litter.setColorAt(instance, new THREE.Color(colors[Math.floor(random() * colors.length)]));
      instance += 1;
    }
  });
  litter.instanceMatrix.needsUpdate = true;
  if (litter.instanceColor) litter.instanceColor.needsUpdate = true;
  return litter;
}

function campusPoint(
  hub: THREE.Vector3,
  tangent: THREE.Vector3,
  radial: THREE.Vector3,
  location: readonly [number, number],
) {
  return hub.clone().addScaledVector(tangent, location[0]).addScaledVector(radial, location[1]);
}

function facingYaw(position: THREE.Vector3, target: THREE.Vector3) {
  const facing = target.clone().sub(position).setY(0).normalize();
  return Math.atan2(facing.x, facing.z);
}

function makeGableGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0);
  shape.lineTo(0.5, 0);
  shape.lineTo(0, 0.6);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  geometry.translate(0, 0, -0.5);
  return geometry;
}

const gableGeometry = makeGableGeometry();

function addInterior(
  building: THREE.Group,
  record: AcademicCampusBuilding,
  materials: AcademicMaterials,
  districtId: string,
) {
  if (!record.interior) return;
  const [width, depth] = record.footprint;
  // Interiors occupy a deliberate human-scale furnished zone just beyond the
  // entrance; the surrounding shell retains the monumental campus footprint.
  const zoneZ = depth * 0.5 - 2.35;
  const interior = new THREE.Group();
  interior.name = `${record.id.toUpperCase()}__${record.interior.toUpperCase().replace('-', '_')}`;
  interior.userData.academicInterior = record.interior;
  interior.userData.runtimeInterior = true;
  interior.userData.runtimeVisibilityPolicy = 'walk-inside-building-only';
  interior.visible = false;
  building.add(interior);

  const addColumn = (x: number, z: number) => {
    const column = prepare(new THREE.Mesh(unitCylinder, materials.limestone), districtId);
    column.name = `${interior.name}__STONE_COLUMN`;
    column.scale.set(0.1, 0.62, 0.1);
    column.position.set(x, 0.31, z);
    column.userData.navObstacle = true;
    interior.add(column);
  };

  for (const side of [-1, 1]) {
    for (const z of [zoneZ - 1.55, zoneZ + 0.2]) addColumn(side * 0.82, z);
  }

  if (record.interior === 'library-entrance') {
    for (const side of [-1, 1]) {
      for (let index = 0; index < 3; index += 1) {
        addBox(
          interior,
          districtId,
          `${interior.name}__OAK_BOOKCASE`,
          [0.1, 0.32, 0.7],
          materials.oak,
          [side * 0.94, 0.16, zoneZ + 0.25 - index * 0.76],
          { obstacle: true },
        );
      }
    }
    addBox(interior, districtId, `${interior.name}__BRASS_LAMP_TABLE`, [0.86, 0.075, 0.32], materials.oak, [0, 0.075, zoneZ - 0.55], { obstacle: true });
    const lamp = addBox(interior, districtId, `${interior.name}__BRASS_READING_LAMP`, [0.045, 0.2, 0.045], materials.brass, [0, 0.21, zoneZ - 0.55]);
    lamp.userData.academicLightPosition = true;
  } else if (record.interior === 'dining-hall') {
    for (const x of [-0.48, 0.48]) {
      addBox(interior, districtId, `${interior.name}__LONG_OAK_TABLE`, [0.18, 0.075, 2.25], materials.oak, [x, 0.075, zoneZ - 0.78], { obstacle: true });
      for (const offset of [-0.14, 0.14]) {
        const bench = addBox(interior, districtId, `${interior.name}__DINING_BENCH`, [0.065, 0.055, 2.05], materials.oak, [x + offset, 0.052, zoneZ - 0.78], { obstacle: true });
        bench.userData.surfaceKind = 'seat';
      }
    }
    for (let index = 0; index < 5; index += 1) {
      addBox(interior, districtId, `${interior.name}__HAMMERBEAM`, [2.35, 0.085, 0.075], materials.oak, [0, 0.66, zoneZ + 0.3 - index * 0.62]);
    }
  } else {
    for (let row = 0; row < 5; row += 1) {
      for (const side of [-1, 1]) {
        const pew = addBox(interior, districtId, `${interior.name}__WORN_OAK_PEW`, [0.34, 0.09, 0.085], materials.oak, [side * 0.24, 0.085, zoneZ + 0.15 - row * 0.46], { obstacle: true });
        pew.userData.surfaceKind = 'seat';
      }
    }
    addBox(interior, districtId, `${interior.name}__STONE_ALTAR`, [0.68, 0.13, 0.28], materials.limestone, [0, 0.065, zoneZ - 2.45], { obstacle: true });
    const candles = addBox(interior, districtId, `${interior.name}__CANDLELIGHT`, [0.45, 0.035, 0.045], materials.stainedGlass, [0, 0.15, zoneZ - 2.42]);
    candles.userData.academicLightPosition = true;
  }

  const dust = prepare(new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(
      Array.from({ length: 120 }, (_, index) => {
        const axis = index % 3;
        const sample = ((index * 47) % 113) / 113;
        if (axis === 0) return (sample - 0.5) * 2.2;
        if (axis === 1) return 0.04 + sample * 0.62;
        return zoneZ - 0.9 + (sample - 0.5) * 3.6;
      }),
      3,
    )),
    new THREE.PointsMaterial({ color: '#e4d2a4', size: 0.006, transparent: true, opacity: 0.22, depthWrite: false }),
  ), districtId);
  dust.name = `${interior.name}__DUST_IN_LIGHT_SHAFTS`;
  dust.userData.animate = 'academic-dust';
  interior.add(dust);
}

function addBuildingEnvelopeDetails(
  building: THREE.Group,
  record: AcademicCampusBuilding,
  materials: AcademicMaterials,
  districtId: string,
) {
  const [width, depth] = record.footprint;
  const height = record.height;
  const doorwayWidth = Math.min(0.58, Math.max(0.42, width * 0.06));
  const doorwayHeight = 0.42;
  const wallThickness = 0.18;
  const frontZ = depth * 0.5 - wallThickness * 0.5;
  const frontSegment = (width - doorwayWidth) * 0.5;

  addBox(building, districtId, `${record.id}__WALKABLE_FLOOR`, [width - 0.24, 0.035, depth - 0.24], materials.limestone, [0, 0.018, 0], { walkable: true });
  addBox(building, districtId, `${record.id}__REAR_WALL`, [width, height, wallThickness], materials.limestone, [0, height * 0.5, -frontZ], { obstacle: true });
  addBox(building, districtId, `${record.id}__LEFT_WALL`, [wallThickness, height, depth], materials.limestone, [-width * 0.5 + wallThickness * 0.5, height * 0.5, 0], { obstacle: true });
  addBox(building, districtId, `${record.id}__RIGHT_WALL`, [wallThickness, height, depth], materials.limestone, [width * 0.5 - wallThickness * 0.5, height * 0.5, 0], { obstacle: true });
  addBox(building, districtId, `${record.id}__FRONT_LEFT_WALL`, [frontSegment, height, wallThickness], materials.limestone, [-(doorwayWidth + frontSegment) * 0.5, height * 0.5, frontZ], { obstacle: true });
  addBox(building, districtId, `${record.id}__FRONT_RIGHT_WALL`, [frontSegment, height, wallThickness], materials.limestone, [(doorwayWidth + frontSegment) * 0.5, height * 0.5, frontZ], { obstacle: true });
  addBox(building, districtId, `${record.id}__CARVED_LINTEL`, [doorwayWidth, height - doorwayHeight, wallThickness * 1.2], materials.repairedStone, [0, doorwayHeight + (height - doorwayHeight) * 0.5, frontZ], { obstacle: true });

  const roof = prepare(new THREE.Mesh(gableGeometry, materials.slate), districtId);
  roof.name = `${record.id}__NEAR_BLACK_SLATE_ROOF`;
  roof.scale.set(width + 0.5, 1.6, depth + 0.55);
  roof.position.y = height;
  building.add(roof);

  const arch = prepare(new THREE.Mesh(new THREE.TorusGeometry(doorwayWidth * 0.5, 0.055, 7, 20, Math.PI), materials.repairedStone), districtId);
  arch.name = `${record.id}__CARVED_ENTRANCE_ARCH`;
  arch.position.set(0, doorwayHeight, depth * 0.5 + 0.012);
  building.add(arch);

  for (const side of [-1, 1]) {
    const door = addBox(building, districtId, `${record.id}__OPEN_HEAVY_OAK_DOOR`, [doorwayWidth * 0.42, doorwayHeight * 0.9, 0.05], materials.oak, [side * doorwayWidth * 0.4, doorwayHeight * 0.45, depth * 0.5 + 0.13]);
    door.rotation.y = side * 1.05;
  }

  const windows: THREE.Mesh[] = [];
  const columns = Math.max(4, Math.min(9, Math.floor(width / 1.55)));
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = THREE.MathUtils.lerp(-width * 0.4, width * 0.4, column / Math.max(1, columns - 1));
      if (row === 0 && Math.abs(x) < doorwayWidth) continue;
      const window = addBox(building, districtId, `${record.id}__LEADED_LANCET_WINDOW`, [0.42, 0.76, 0.035], record.interior === 'chapel-nave' ? materials.stainedGlass : materials.leadedGlass, [x, height * (0.31 + row * 0.34), depth * 0.5 + 0.018]);
      window.userData.academicReadingLights = record.kind === 'library' || record.kind === 'dining';
      windows.push(window);
    }
  }

  for (const side of [-1, 1]) {
    for (const z of [-depth * 0.32, 0, depth * 0.32]) {
      addBox(building, districtId, `${record.id}__GOTHIC_BUTTRESS`, [0.34, height * 0.55, 0.48], materials.repairedStone, [side * (width * 0.5 + 0.12), height * 0.275, z], { obstacle: true });
    }
  }

  const plaque = addBox(building, districtId, `${record.id}__TARNISHED_BRASS_FOUNDING_PLAQUE`, [0.72, 0.34, 0.035], materials.brass, [doorwayWidth * 1.15, 0.72, depth * 0.5 + 0.025]);
  plaque.userData.academicHotspot = record.id;

  if (record.kind === 'observatory') {
    const drum = prepare(new THREE.Mesh(new THREE.CylinderGeometry(width * 0.26, width * 0.31, height * 0.66, 24), materials.limestone), districtId);
    drum.name = `${record.id}__CIRCULAR_OBSERVATORY_DRUM`;
    drum.position.y = height * 0.68;
    const dome = prepare(new THREE.Mesh(new THREE.SphereGeometry(width * 0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), materials.copper), districtId);
    dome.name = `${record.id}__OXIDIZED_COPPER_DOME`;
    dome.position.y = height + 0.42;
    building.add(drum, dome);
  }

  if (record.kind === 'chapel') {
    const tower = addBox(building, districtId, `${record.id}__BELL_TOWER`, [2.15, height + 2.2, 2.15], materials.limestone, [-width * 0.28, (height + 2.2) * 0.5, -depth * 0.28], { obstacle: true });
    tower.userData.academicBellTower = true;
    const vane = prepare(new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.4, 4), materials.copper), districtId);
    vane.name = `${record.id}__WEATHERED_SPIRE`;
    vane.position.set(-width * 0.28, height + 2.9, -depth * 0.28);
    building.add(vane);
  }

  if (record.kind === 'dining') {
    for (const x of [-width * 0.3, 0, width * 0.3]) {
      addBox(building, districtId, `${record.id}__TALL_KITCHEN_CHIMNEY`, [0.42, 2.2, 0.42], materials.limestone, [x, height + 1.1, -depth * 0.31], { obstacle: true });
    }
  }

  if (record.kind === 'residence') {
    for (const side of [-1, 1]) {
      const tower = addBox(building, districtId, `${record.id}__STONE_STAIR_TOWER`, [2.3, height + 1.25, 2.3], materials.limestone, [side * width * 0.34, (height + 1.25) * 0.5, 0], { obstacle: true });
      tower.userData.academicResidenceTower = true;
    }
  }

  addInterior(building, record, materials, districtId);
}

function createBuilding(
  definition: DistrictDefinition,
  record: AcademicCampusBuilding,
  position: THREE.Vector3,
  yaw: number,
  materials: AcademicMaterials,
) {
  const building = new THREE.Group();
  building.name = `${definition.id}__ACADEMIC_FACILITY__${record.id.toUpperCase().replaceAll('-', '_')}`;
  building.position.copy(position);
  building.rotation.y = yaw;
  addBuildingEnvelopeDetails(building, record, materials, definition.id);

  const front = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const halfDepth = record.footprint[1] * 0.5;
  const routeStart = position.clone().addScaledVector(front, halfDepth + 2.8);
  const threshold = position.clone().addScaledVector(front, halfDepth + 0.08);
  const interiorTarget = position.clone().addScaledVector(front, halfDepth - 1.25);
  building.userData.semanticName = record.name;
  building.userData.academicFacility = true;
  building.userData.academicFacilityType = record.kind;
  building.userData.academicBuildingData = { ...record };
  building.userData.accessibleInWalk = true;
  building.userData.footprint = [...record.footprint];
  building.userData.entrancePoint = threshold.toArray();
  building.userData.walkAccess = {
    accessible: true,
    buildingKind: record.kind,
    coordinateSpace: 'district-local',
    routeStart: routeStart.toArray(),
    threshold: threshold.toArray(),
    interiorTarget: interiorTarget.toArray(),
    finishedFloorY: 0,
    doorwayWidth: Math.min(0.58, Math.max(0.42, record.footprint[0] * 0.06)),
  };
  building.userData.meshArchitecture = {
    style: 'English and collegiate Gothic with restrained later additions',
    elements: ['weathered limestone', 'slate gable', 'lancet windows', 'buttresses', 'oak doors', 'copper rainwater goods'],
  };
  return building;
}

function createMainGate(
  definition: DistrictDefinition,
  hub: THREE.Vector3,
  tangent: THREE.Vector3,
  radial: THREE.Vector3,
  materials: AcademicMaterials,
) {
  const gate = new THREE.Group();
  gate.name = `${definition.id}__ACADEMIC_ZONE__MAIN_ENTRANCE`;
  const center = campusPoint(hub, tangent, radial, [0, -50]);
  gate.position.copy(center);
  gate.userData.semanticName = 'Blackwood Main Gate and Porter\'s Lodge';
  gate.userData.academicFeatureType = 'main entrance';

  const localTangent = tangent;
  const gatehouseCenters = [-6.4, 6.4].map((offset) => localTangent.clone().multiplyScalar(offset));
  gatehouseCenters.forEach((position, index) => {
    addBox(gate, definition.id, `ACADEMIC__${index ? 'PORTERS_LODGE' : 'WEST_GATEHOUSE'}`, [4.8, 4.5, 5.6], materials.limestone, [position.x, 2.25, position.z], { obstacle: true });
    const roof = prepare(new THREE.Mesh(new THREE.ConeGeometry(3.7, 2.2, 4), materials.slate), definition.id);
    roof.name = 'ACADEMIC__GATEHOUSE_SLATE_ROOF';
    roof.position.set(position.x, 5.55, position.z);
    roof.rotation.y = Math.PI * 0.25;
    gate.add(roof);
  });

  const leftTop = localTangent.clone().multiplyScalar(-4);
  const rightTop = localTangent.clone().multiplyScalar(4);
  const arch = addSegment(gate, definition.id, 'ACADEMIC__CRESTED_GATE_ARCH', leftTop, rightTop, 0.75, 1.15, materials.limestone, 4.35);
  arch.userData.universityCrest = 'Blackwood raven, open book, and three stars';
  const crest = prepare(new THREE.Mesh(new THREE.OctahedronGeometry(0.68, 0), materials.brass), definition.id);
  crest.name = 'ACADEMIC__CARVED_UNIVERSITY_CREST';
  crest.position.y = 5.25;
  gate.add(crest);

  for (const side of [-1, 1]) {
    const hinge = localTangent.clone().multiplyScalar(side * 4.15);
    const leaf = new THREE.Group();
    leaf.name = `ACADEMIC__WROUGHT_IRON_GATE_LEAF_${side < 0 ? 'WEST' : 'EAST'}`;
    leaf.position.copy(hinge);
    const towardCenter = localTangent.clone().multiplyScalar(-side);
    const closedYaw = Math.atan2(towardCenter.x, towardCenter.z);
    leaf.rotation.y = closedYaw;
    leaf.userData.academicGateLeaf = true;
    leaf.userData.closedYaw = closedYaw;
    leaf.userData.openYaw = closedYaw + side * 1.28;
    for (const [railIndex, railY] of [0.58, 1.48, 2.38].entries()) {
      const rail = addBox(
        leaf,
        definition.id,
        `${leaf.name}__HORIZONTAL_RAIL_${railIndex + 1}`,
        [0.075, 0.11, 4.15],
        materials.iron,
        [0, railY, 2.08],
      );
      rail.userData.academicGateLeafBars = true;
    }
    for (let index = 0; index < 7; index += 1) {
      const verticalBar = addBox(
        leaf,
        definition.id,
        `${leaf.name}__VERTICAL_BAR_${index + 1}`,
        [0.055, 2.95, 0.055],
        materials.iron,
        [0, 1.47, 0.35 + index * 0.58],
      );
      verticalBar.userData.academicGateLeafBars = true;
    }
    const leafCollision = new THREE.Object3D();
    leafCollision.name = `${leaf.name}__PRECISE_WALK_COLLISION`;
    leafCollision.userData.academicGateLeafCollision = true;
    leafCollision.userData.navBarrierSegments = [
      { start: [0, 1.45, 0.12], end: [0, 1.45, 4.12], radius: 0.04 },
    ];
    leaf.add(leafCollision);
    gate.add(leaf);
  }

  // One atomic blocker represents the closed gate in WALK. Decorative leaf
  // bars remain non-colliding so their large rotated AABBs cannot cover the
  // central opening after the leaves swing inward.
  const gateCollider = prepare(new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 3.1, 8.3),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, colorWrite: false, depthWrite: false }),
  ), definition.id);
  gateCollider.name = 'ACADEMIC__MAIN_GATE_CLOSED_COLLIDER';
  gateCollider.position.y = 1.55;
  gateCollider.rotation.y = Math.atan2(localTangent.x, localTangent.z);
  gateCollider.castShadow = false;
  gateCollider.receiveShadow = false;
  gateCollider.userData.academicGateCollider = true;
  gateCollider.userData.navObstacle = true;
  gate.add(gateCollider);

  for (const side of [-1, 1]) {
    const position = localTangent.clone().multiplyScalar(side * 4.6);
    const lantern = addBox(gate, definition.id, 'ACADEMIC__WARM_GATE_LANTERN', [0.28, 0.52, 0.28], materials.leadedGlass, [position.x, 3.25, position.z]);
    lantern.userData.academicLightPosition = true;
    const light = new THREE.PointLight('#f0ad62', 4.2, 11, 2);
    light.name = 'ACADEMIC__GATE_LANTERN_LIGHT';
    light.position.set(position.x, 3.2, position.z);
    light.castShadow = false;
    gate.add(light);
  }

  addBox(gate, definition.id, 'ACADEMIC__BRASS_NOTICE_BOARD', [1.7, 1.25, 0.16], materials.oak, [gatehouseCenters[1].x, 1.05, gatehouseCenters[1].z + 2.95]);
  return gate;
}

interface AcademicBoundaryTransform {
  readonly position: THREE.Vector3;
  readonly quaternion: THREE.Quaternion;
  readonly scale: THREE.Vector3;
}

interface AcademicBoundaryRun {
  readonly id: string;
  readonly label: string;
  readonly points: THREE.Vector3[];
  readonly skipFirstPier?: boolean;
  readonly skipLastPier?: boolean;
}

function setAcademicBoundaryInstances(
  mesh: THREE.InstancedMesh,
  transforms: readonly AcademicBoundaryTransform[],
) {
  const matrix = new THREE.Matrix4();
  transforms.forEach((transform, index) => {
    matrix.compose(transform.position, transform.quaternion, transform.scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
}

function addAcademicBoundaryBeam(
  transforms: AcademicBoundaryTransform[],
  start: THREE.Vector3,
  end: THREE.Vector3,
  thickness: number,
) {
  const direction = end.clone().sub(start);
  const length = Math.max(direction.length(), 0.001);
  transforms.push({
    position: start.clone().add(end).multiplyScalar(0.5),
    quaternion: new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      direction.normalize(),
    ),
    scale: new THREE.Vector3(thickness, thickness, length),
  });
}

function makeAcademicBoundaryCrestGeometry() {
  const shield = new THREE.Shape();
  shield.moveTo(-0.052, 0.062);
  shield.lineTo(0.052, 0.062);
  shield.lineTo(0.046, -0.012);
  shield.quadraticCurveTo(0.026, -0.065, 0, -0.082);
  shield.quadraticCurveTo(-0.026, -0.065, -0.046, -0.012);
  shield.closePath();
  const geometry = new THREE.ExtrudeGeometry(shield, {
    depth: 0.014,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.006,
    bevelThickness: 0.004,
  });
  geometry.translate(0, 0.01, -0.007);
  return geometry;
}

function createAcademicBoundarySignMaterial(label: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 192;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#4f3920');
  gradient.addColorStop(0.46, '#a77a38');
  gradient.addColorStop(1, '#3d2e1d');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#d5b56f';
  context.lineWidth = 9;
  context.strokeRect(17, 17, canvas.width - 34, canvas.height - 34);
  context.fillStyle = '#17130f';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 47px Georgia, serif';
  context.fillText(label, canvas.width * 0.5, canvas.height * 0.43);
  context.font = '600 26px Georgia, serif';
  context.fillText('GARDEN ENTRANCE', canvas.width * 0.5, canvas.height * 0.72);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new THREE.MeshStandardMaterial({
    color: '#a88446',
    map: texture,
    roughness: 0.54,
    metalness: 0.72,
  });
  material.name = `Academic aged brass sign - ${label}`;
  material.userData.excludeSeasonFoliage = true;
  return material;
}

/**
 * Frames the complete east Academic masterplan cell rather than only the
 * immediate group of halls. The inner fence follows the ring road, the side
 * runs follow the two dome avenues, and the rear line stays inside the coastal
 * railway. Decorative instances never own navigation AABBs; compact authored
 * segments provide exact collision while leaving every named aperture open.
 */
function createCollegiateGothicBoundary(
  definition: DistrictDefinition,
  hub: THREE.Vector3,
  tangent: THREE.Vector3,
  radial: THREE.Vector3,
  materials: AcademicMaterials,
) {
  const boundary = new THREE.Group();
  boundary.name = `${definition.id}__ACADEMIC_ZONE__COLLEGIATE_GOTHIC_BOUNDARY`;
  boundary.userData.semanticName = 'Blackwood Collegiate Gothic Boundary';
  boundary.userData.academicFeatureType = 'architectural enclosure';
  boundary.userData.academicGothicBoundary = true;
  const sector = definition.sector;
  if (!sector) return boundary;

  const hubRadius = Math.hypot(definition.position[0], definition.position[2]);
  const halfAngle = (sector.endAngle - sector.startAngle) * 0.5;
  const innerRadius = sector.innerRadius + 1.1;
  const sideInset = 1.15;
  const railRadius = ISLAND_APOTHEM * COASTAL_RAIL_INSET;
  const rearRadius = railRadius - 1.25;
  const domeGapInnerRadius = BIOME_RING_RADIUS - 23.5;
  const domeGapOuterRadius = BIOME_RING_RADIUS + 18;
  const domeGateRadius = BIOME_RING_RADIUS - 20.8;
  const maximumBayLength = 1.55;
  const heightMultiplier = 5;
  const fenceSpearCenterY = 0.33 * heightMultiplier;
  const fencePicketBottomY = 0.0545;
  const fencePicketTopY = fenceSpearCenterY - 0.031;
  const fencePicketHeight = fencePicketTopY - fencePicketBottomY;
  const fencePicketCenterY = fencePicketBottomY + fencePicketHeight * 0.5;
  const pierOverallHeight = 0.49 * heightMultiplier;
  const pierBaseHeight = 0.07;
  const pierCollarHeight = 0.045;
  const pierCapHeight = 0.09;
  const pierShaftTopY = pierOverallHeight - pierCapHeight - pierCollarHeight;
  const pierShaftHeight = pierShaftTopY - pierBaseHeight;
  const pierShaftCenterY = pierBaseHeight + pierShaftHeight * 0.5;
  const pierCollarCenterY = pierShaftTopY + pierCollarHeight * 0.5;
  const pierCapCenterY = pierOverallHeight - pierCapHeight * 0.5;
  const zeroQuaternion = new THREE.Quaternion();
  const oneScale = new THREE.Vector3(1, 1, 1);
  const localUp = new THREE.Vector3(0, 1, 0);

  const sectorPoint = (radius: number, delta: number) => hub.clone()
    .addScaledVector(radial, radius * Math.cos(delta) - hubRadius)
    .addScaledVector(tangent, radius * Math.sin(delta));
  const sideFrame = (sign: -1 | 1) => {
    const delta = sign * halfAngle;
    const along = radial.clone().multiplyScalar(Math.cos(delta))
      .addScaledVector(tangent, Math.sin(delta)).normalize();
    const angularNormal = radial.clone().multiplyScalar(-Math.sin(delta))
      .addScaledVector(tangent, Math.cos(delta)).normalize();
    const inward = angularNormal.multiplyScalar(-sign);
    return {
      sign,
      along,
      inward,
      point: (radius: number) => sectorPoint(radius, delta).addScaledVector(inward, sideInset),
    };
  };
  const tundraSide = sideFrame(-1);
  const desertSide = sideFrame(1);
  const rearJoinRadius = (rearRadius - sideInset * Math.sin(halfAngle)) / Math.cos(halfAngle);
  const rearPoint = (offset: number) => hub.clone()
    .addScaledVector(radial, rearRadius - hubRadius)
    .addScaledVector(tangent, offset);
  const subdivide = (start: THREE.Vector3, end: THREE.Vector3) => {
    const count = Math.max(1, Math.ceil(start.distanceTo(end) / maximumBayLength));
    return Array.from({ length: count + 1 }, (_, index) => start.clone().lerp(end, index / count));
  };
  const arc = (start: number, end: number) => {
    const count = Math.max(1, Math.ceil(Math.abs(end - start) * innerRadius / maximumBayLength));
    return Array.from({ length: count + 1 }, (_, index) => (
      sectorPoint(innerRadius, THREE.MathUtils.lerp(start, end, index / count))
    ));
  };

  const mainGapHalfWidth = 9.35;
  const mainGapAngle = Math.asin(mainGapHalfWidth / innerRadius);
  const tundraInner = tundraSide.point(innerRadius);
  const desertInner = desertSide.point(innerRadius);
  const tundraGapStart = tundraSide.point(domeGapInnerRadius);
  const tundraGapEnd = tundraSide.point(domeGapOuterRadius);
  const desertGapStart = desertSide.point(domeGapInnerRadius);
  const desertGapEnd = desertSide.point(domeGapOuterRadius);
  const tundraRear = tundraSide.point(rearJoinRadius);
  const desertRear = desertSide.point(rearJoinRadius);
  const rearGateHalfWidth = 1.8;

  const tundraInnerArc = arc(-halfAngle, -mainGapAngle);
  tundraInnerArc.unshift(tundraInner);
  const desertInnerArc = arc(mainGapAngle, halfAngle);
  desertInnerArc.push(desertInner);
  const runs: AcademicBoundaryRun[] = [
    { id: 'INNER_ARC_TUNDRA_WING', label: 'inner ring fence, Tundra wing', points: tundraInnerArc },
    { id: 'INNER_ARC_DESERT_WING', label: 'inner ring fence, Desert wing', points: desertInnerArc },
    { id: 'TUNDRA_SIDE_INNER', label: 'Tundra avenue inner fence', points: subdivide(tundraInner, tundraGapStart), skipFirstPier: true },
    { id: 'TUNDRA_SIDE_REAR', label: 'Tundra avenue rear fence', points: subdivide(tundraGapEnd, tundraRear) },
    {
      id: 'COASTAL_REAR_TUNDRA_WING',
      label: 'coastal railway fence, Tundra wing',
      points: subdivide(tundraRear, rearPoint(-rearGateHalfWidth)),
      skipFirstPier: true,
      skipLastPier: true,
    },
    {
      id: 'COASTAL_REAR_DESERT_WING',
      label: 'coastal railway fence, Desert wing',
      points: subdivide(rearPoint(rearGateHalfWidth), desertRear),
      skipFirstPier: true,
    },
    { id: 'DESERT_SIDE_REAR', label: 'Desert avenue rear fence', points: subdivide(desertRear, desertGapEnd), skipFirstPier: true },
    { id: 'DESERT_SIDE_INNER', label: 'Desert avenue inner fence', points: subdivide(desertGapStart, desertInner), skipLastPier: true },
  ];

  const crestGeometry = makeAcademicBoundaryCrestGeometry();
  const capGeometry = new THREE.ConeGeometry(0.5, 1, 4);
  const spearGeometry = new THREE.ConeGeometry(0.018, 0.062, 4);
  const quatrefoilGeometry = new THREE.TorusGeometry(0.028, 0.0055, 5, 10);
  const botanicalGeometry = new THREE.OctahedronGeometry(0.035, 0);
  let totalBayCount = 0;
  let totalPierCount = 0;
  let totalBarrierCount = 0;

  runs.forEach((spec) => {
    const run = new THREE.Group();
    run.name = `ACADEMIC__GOTHIC_BOUNDARY_${spec.id}`;
    run.userData.semanticName = spec.label;
    run.userData.academicBoundaryRun = true;
    const stoneTransforms: AcademicBoundaryTransform[] = [];
    const capTransforms: AcademicBoundaryTransform[] = [];
    const crestTransforms: AcademicBoundaryTransform[] = [];
    const ironTransforms: AcademicBoundaryTransform[] = [];
    const archTransforms: AcademicBoundaryTransform[] = [];
    const spearTransforms: AcademicBoundaryTransform[] = [];
    const quatrefoilTransforms: AcademicBoundaryTransform[] = [];
    const botanicalTransforms: AcademicBoundaryTransform[] = [];
    const barriers: Array<{ start: [number, number, number]; end: [number, number, number]; radius: number }> = [];
    let visiblePierCount = 0;

    spec.points.forEach((point, pointIndex) => {
      if ((pointIndex === 0 && spec.skipFirstPier)
        || (pointIndex === spec.points.length - 1 && spec.skipLastPier)) return;
      visiblePierCount += 1;
      const adjacent = pointIndex === spec.points.length - 1
        ? point.clone().sub(spec.points[pointIndex - 1]).normalize()
        : spec.points[pointIndex + 1].clone().sub(point).normalize();
      const normal = adjacent.clone().cross(localUp).normalize();
      const basis = new THREE.Matrix4().makeBasis(adjacent, localUp, normal);
      const crestQuaternion = new THREE.Quaternion().setFromRotationMatrix(basis);
      const reverseBasis = new THREE.Matrix4().makeBasis(adjacent.clone().negate(), localUp, normal.clone().negate());
      const reverseCrestQuaternion = new THREE.Quaternion().setFromRotationMatrix(reverseBasis);
      stoneTransforms.push(
        {
          position: point.clone().setY(pierBaseHeight * 0.5),
          quaternion: zeroQuaternion,
          scale: new THREE.Vector3(0.18, pierBaseHeight, 0.18),
        },
        {
          position: point.clone().setY(pierShaftCenterY),
          quaternion: zeroQuaternion,
          scale: new THREE.Vector3(0.12, pierShaftHeight, 0.12),
        },
        {
          position: point.clone().setY(pierCollarCenterY),
          quaternion: zeroQuaternion,
          scale: new THREE.Vector3(0.17, pierCollarHeight, 0.17),
        },
      );
      capTransforms.push({
        position: point.clone().setY(pierCapCenterY),
        quaternion: new THREE.Quaternion().setFromAxisAngle(localUp, Math.PI * 0.25),
        scale: new THREE.Vector3(0.2, pierCapHeight, 0.2),
      });
      crestTransforms.push(
        {
          position: point.clone().addScaledVector(normal, 0.067).setY(0.245 * heightMultiplier),
          quaternion: crestQuaternion,
          scale: oneScale,
        },
        {
          position: point.clone().addScaledVector(normal, -0.067).setY(0.245 * heightMultiplier),
          quaternion: reverseCrestQuaternion,
          scale: oneScale,
        },
      );
    });

    for (let panelIndex = 0; panelIndex < spec.points.length - 1; panelIndex += 1) {
      const start = spec.points[panelIndex];
      const end = spec.points[panelIndex + 1];
      const direction = end.clone().sub(start).setY(0);
      const length = Math.max(direction.length(), 0.001);
      direction.normalize();
      const normal = direction.clone().cross(localUp).normalize();
      const panelBasis = new THREE.Matrix4().makeBasis(direction, localUp, normal);
      const panelQuaternion = new THREE.Quaternion().setFromRotationMatrix(panelBasis);
      const center = start.clone().add(end).multiplyScalar(0.5);
      for (const y of [0.085, 0.18, 0.285].map((value) => value * heightMultiplier)) {
        addAcademicBoundaryBeam(ironTransforms, start.clone().setY(y), end.clone().setY(y), 0.014);
      }
      const picketCount = Math.max(4, Math.floor(length / 0.23));
      for (let picket = 1; picket <= picketCount; picket += 1) {
        const position = start.clone().lerp(end, picket / (picketCount + 1));
        ironTransforms.push({
          position: position.clone().setY(fencePicketCenterY),
          quaternion: zeroQuaternion,
          scale: new THREE.Vector3(0.012, fencePicketHeight, 0.012),
        });
        spearTransforms.push({
          position: position.clone().setY(fenceSpearCenterY),
          quaternion: zeroQuaternion,
          scale: oneScale,
        });
      }
      const archLeft = start.clone().lerp(end, 0.07).setY(0.205 * heightMultiplier);
      const archApex = center.clone().setY(0.315 * heightMultiplier);
      const archRight = start.clone().lerp(end, 0.93).setY(0.205 * heightMultiplier);
      addAcademicBoundaryBeam(archTransforms, archLeft, archApex, 0.012);
      addAcademicBoundaryBeam(archTransforms, archApex, archRight, 0.012);
      for (const [along, vertical] of [[-0.032, 0], [0.032, 0], [0, -0.032], [0, 0.032]] as const) {
        quatrefoilTransforms.push({
          position: center.clone().addScaledVector(direction, along).setY(0.18 * heightMultiplier + vertical),
          quaternion: panelQuaternion,
          scale: oneScale,
        });
      }
      for (const side of [-1, 1]) {
        botanicalTransforms.push({
          position: center.clone()
            .addScaledVector(direction, side * Math.min(0.18, length * 0.19))
            .setY(0.115 * heightMultiplier),
          quaternion: panelQuaternion.clone().multiply(
            new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), side * 0.58),
          ),
          scale: new THREE.Vector3(1.5, 0.56, 0.35),
        });
      }
      for (const y of [0.1, 0.25]) {
        barriers.push({
          start: start.clone().setY(y).toArray(),
          end: end.clone().setY(y).toArray(),
          radius: 0.04,
        });
      }
    }

    const addInstanced = (
      name: string,
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      transforms: AcademicBoundaryTransform[],
      role: string,
      shadows = false,
    ) => {
      const mesh = prepare(new THREE.InstancedMesh(geometry, material, transforms.length), definition.id, role);
      mesh.name = `ACADEMIC__${name}`;
      mesh.castShadow = shadows;
      mesh.receiveShadow = shadows;
      mesh.userData.academicGothicBoundaryComponent = true;
      mesh.userData.instanceCount = transforms.length;
      setAcademicBoundaryInstances(mesh, transforms);
      run.add(mesh);
    };
    addInstanced('GOTHIC_STONE_PIER_COMPONENTS', unitBox, materials.limestone, stoneTransforms, 'carved stone piers', true);
    addInstanced('GOTHIC_STONE_PIER_CAPS', capGeometry, materials.repairedStone, capTransforms, 'weathered pier caps', true);
    addInstanced('GOTHIC_CARVED_CRESTS', crestGeometry, materials.repairedStone, crestTransforms, 'carved college crests', true);
    addInstanced('GOTHIC_WROUGHT_IRON_BARS', unitBox, materials.iron, ironTransforms, 'slender wrought-iron railings');
    addInstanced('GOTHIC_POINTED_ARCH_TRACERY', unitBox, materials.iron, archTransforms, 'pointed arch iron tracery');
    addInstanced('GOTHIC_IRON_SPEARHEADS', spearGeometry, materials.iron, spearTransforms, 'wrought-iron spearhead finials');
    addInstanced('GOTHIC_QUATREFOILS', quatrefoilGeometry, materials.iron, quatrefoilTransforms, 'quatrefoil ironwork');
    addInstanced('GOTHIC_BOTANICAL_LEAF_MOTIFS', botanicalGeometry, materials.iron, botanicalTransforms, 'restrained botanical ironwork');
    const collisionGuide = new THREE.Object3D();
    collisionGuide.name = `ACADEMIC__GOTHIC_BOUNDARY_${spec.id}__PRECISE_WALK_COLLISION`;
    collisionGuide.userData.navBarrierSegments = barriers;
    collisionGuide.userData.academicBoundaryBarrierCount = barriers.length;
    run.add(collisionGuide);
    run.userData.fenceBayCount = spec.points.length - 1;
    run.userData.pierCount = visiblePierCount;
    run.userData.visualPermeability = 'open iron bars and tracery';
    totalBayCount += spec.points.length - 1;
    totalPierCount += visiblePierCount;
    totalBarrierCount += barriers.length;
    boundary.add(run);
  });

  const gatePierBarriers: Array<{ start: [number, number, number]; end: [number, number, number]; radius: number }> = [];
  const ivyLeafGeometry = new THREE.OctahedronGeometry(0.024, 0);
  const createOpenGate = (options: {
    name: string;
    semanticName: string;
    center: THREE.Vector3;
    along: THREE.Vector3;
    inward: THREE.Vector3;
    width: number;
    monumental: boolean;
    sign?: string;
  }) => {
    const gate = new THREE.Group();
    gate.name = options.name;
    gate.userData.semanticName = options.semanticName;
    gate.userData.academicBoundaryOpening = true;
    gate.userData.alwaysOpen = true;
    gate.userData.clearWidth = options.width;
    gate.userData.monumental = options.monumental;
    gate.userData.alongDirection = options.along.toArray();
    gate.userData.crossingDirection = options.inward.toArray();
    const along = options.along.clone().setY(0).normalize();
    const inward = options.inward.clone().setY(0).normalize();
    const basis = new THREE.Matrix4().makeBasis(along, localUp, inward);
    const orientation = new THREE.Quaternion().setFromRotationMatrix(basis);
    const pierHeight = (options.monumental ? 0.64 : 0.48) * heightMultiplier;
    const pierWidth = options.monumental ? 0.3 : 0.2;
    const springY = (options.monumental ? 0.48 : 0.38) * heightMultiplier;
    const apexY = (options.monumental ? 0.76 : 0.58) * heightMultiplier;
    const pierCenters = [-1, 1].map((side) => options.center.clone().addScaledVector(along, side * options.width * 0.5));
    pierCenters.forEach((center, index) => {
      const base = addBox(
        gate,
        definition.id,
        `${options.name}__CARVED_STONE_PIER_${index + 1}`,
        [pierWidth * 1.25, pierHeight, pierWidth * 1.25],
        index % 2 ? materials.repairedStone : materials.limestone,
        [center.x, pierHeight * 0.5, center.z],
      );
      base.userData.academicGatePier = true;
      const cap = prepare(new THREE.Mesh(capGeometry, materials.repairedStone), definition.id, 'Gothic gate pier cap');
      cap.name = `${options.name}__CROCKETED_PIER_CAP`;
      cap.position.copy(center).setY(pierHeight + 0.055);
      cap.scale.set(pierWidth * 1.45, 0.11, pierWidth * 1.45);
      cap.rotation.y = Math.PI * 0.25;
      gate.add(cap);
      const crest = prepare(new THREE.Mesh(crestGeometry, materials.repairedStone), definition.id, 'carved college crest');
      crest.name = `${options.name}__CARVED_COLLEGE_CREST`;
      crest.position.copy(center).addScaledVector(inward, pierWidth * 0.66).setY(pierHeight * 0.62);
      crest.quaternion.copy(orientation);
      gate.add(crest);
      for (const y of [0.1, 0.25]) {
        const barrierPoint = center.clone().setY(y).toArray() as [number, number, number];
        gatePierBarriers.push({ start: barrierPoint, end: [...barrierPoint], radius: pierWidth * 0.62 });
      }
    });
    const apex = options.center.clone().setY(apexY);
    pierCenters.forEach((center, index) => {
      const beamTransforms: AcademicBoundaryTransform[] = [];
      addAcademicBoundaryBeam(beamTransforms, center.clone().setY(springY), apex, options.monumental ? 0.055 : 0.032);
      const beam = prepare(new THREE.Mesh(unitBox, materials.limestone), definition.id, 'pointed gate arch');
      beam.name = `${options.name}__POINTED_STONE_ARCH_${index + 1}`;
      const transform = beamTransforms[0];
      beam.position.copy(transform.position);
      beam.quaternion.copy(transform.quaternion);
      beam.scale.copy(transform.scale);
      gate.add(beam);
    });
    const archCrest = prepare(new THREE.Mesh(crestGeometry, options.monumental ? materials.brass : materials.repairedStone), definition.id, 'gate crest');
    archCrest.name = `${options.name}__ARCH_CREST`;
    archCrest.position.copy(options.center).addScaledVector(inward, 0.02).setY(apexY + 0.07);
    archCrest.quaternion.copy(orientation);
    archCrest.scale.setScalar(options.monumental ? 1.65 : 1.1);
    gate.add(archCrest);

    if (options.sign) {
      const signCenter = pierCenters[1].clone().addScaledVector(inward, pierWidth * 0.68).setY(pierHeight * 0.52);
      const back = prepare(new THREE.Mesh(unitBox, materials.brass), definition.id, 'aged brass garden sign');
      back.name = `${options.name}__AGED_BRASS_SIGN_BACK`;
      back.position.copy(signCenter);
      back.quaternion.copy(orientation);
      back.scale.set(0.18, 0.065, 0.018);
      back.userData.signText = `${options.sign} - Garden Entrance`;
      gate.add(back);
      const signMaterial = createAcademicBoundarySignMaterial(options.sign);
      if (signMaterial) {
        const face = prepare(new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.052), signMaterial), definition.id, 'readable aged brass garden sign');
        face.name = `${options.name}__AGED_BRASS_SIGN`;
        face.position.copy(signCenter).addScaledVector(inward, 0.014);
        face.quaternion.copy(orientation);
        face.userData.signText = `${options.sign} - Garden Entrance`;
        gate.add(face);
      }
      const ivyStemTransforms: AcademicBoundaryTransform[] = [];
      const ivyLeafTransforms: AcademicBoundaryTransform[] = [];
      pierCenters.forEach((center, pierIndex) => {
        for (let stem = 0; stem < 3; stem += 1) {
          const start = center.clone().addScaledVector(inward, pierWidth * 0.68).setY(0.02 + stem * 0.025);
          const end = center.clone()
            .addScaledVector(inward, pierWidth * 0.69)
            .addScaledVector(along, (pierIndex ? -1 : 1) * (0.035 + stem * 0.018))
            .setY((0.34 + stem * 0.045) * heightMultiplier);
          addAcademicBoundaryBeam(ivyStemTransforms, start, end, 0.012);
          for (let leafIndex = 1; leafIndex <= 4; leafIndex += 1) {
            ivyLeafTransforms.push({
              position: start.clone().lerp(end, leafIndex / 5)
                .addScaledVector(along, (leafIndex % 2 ? -1 : 1) * 0.028),
              quaternion: orientation,
              scale: new THREE.Vector3(1.35, 0.72, 0.38),
            });
          }
        }
      });
      const ivyStems = prepare(
        new THREE.InstancedMesh(unitBox, materials.moss, ivyStemTransforms.length),
        definition.id,
        'climbing ivy stems',
      );
      ivyStems.name = `${options.name}__CLIMBING_IVY_STEMS`;
      ivyStems.userData.ivyStemCount = ivyStemTransforms.length;
      setAcademicBoundaryInstances(ivyStems, ivyStemTransforms);
      const ivyLeaves = prepare(
        new THREE.InstancedMesh(ivyLeafGeometry, materials.moss, ivyLeafTransforms.length),
        definition.id,
        'climbing ivy leaves',
      );
      ivyLeaves.name = `${options.name}__IVY_LEAVES`;
      ivyLeaves.userData.ivyLeafCount = ivyLeafTransforms.length;
      setAcademicBoundaryInstances(ivyLeaves, ivyLeafTransforms);
      gate.add(ivyStems, ivyLeaves);
      gate.userData.agedBrassSign = options.sign;
      gate.userData.climbingIvy = true;
    }
    if (options.monumental) {
      pierCenters.forEach((center, index) => {
        const lantern = addBox(
          gate,
          definition.id,
          `${options.name}__LANTERN_${index + 1}`,
          [0.16, 0.22, 0.16],
          materials.leadedGlass,
          [center.x, pierHeight + 0.17, center.z],
        );
        lantern.userData.academicLightPosition = true;
      });
    }
    boundary.add(gate);
    return gate;
  };

  const tundraGateCenter = tundraSide.point(domeGateRadius);
  const desertGateCenter = desertSide.point(domeGateRadius);
  const rearGateCenter = rearPoint(0);
  createOpenGate({
    name: 'ACADEMIC__TUNDRA_DOME_GARDEN_ENTRANCE',
    semanticName: 'Tundra Biodome Garden Entrance',
    center: tundraGateCenter,
    along: tundraSide.along,
    inward: tundraSide.inward,
    width: 1.45,
    monumental: false,
    sign: 'TUNDRA BIODOME',
  });
  createOpenGate({
    name: 'ACADEMIC__DESERT_DOME_GARDEN_ENTRANCE',
    semanticName: 'Desert Biodome Garden Entrance',
    center: desertGateCenter,
    along: desertSide.along,
    inward: desertSide.inward,
    width: 1.45,
    monumental: false,
    sign: 'DESERT BIODOME',
  });
  createOpenGate({
    name: 'ACADEMIC__MONUMENTAL_COASTAL_RAIL_GATE',
    semanticName: 'Blackwood Coastal Railway Gate',
    center: rearGateCenter,
    along: tangent,
    inward: radial.clone().negate(),
    width: rearGateHalfWidth * 2,
    monumental: true,
  });

  const tundraSpur = addGroundPath(
    boundary,
    definition.id,
    'ACADEMIC__TUNDRA_DOME_GARDEN_GATE_PATH',
    tundraGateCenter.clone().addScaledVector(tundraSide.inward, 2.4),
    tundraGateCenter.clone().addScaledVector(tundraSide.inward, -2.4),
    0.48,
    materials.earthPath,
  );
  const desertSpur = addGroundPath(
    boundary,
    definition.id,
    'ACADEMIC__DESERT_DOME_GARDEN_GATE_PATH',
    desertGateCenter.clone().addScaledVector(desertSide.inward, 2.4),
    desertGateCenter.clone().addScaledVector(desertSide.inward, -2.4),
    0.48,
    materials.earthPath,
  );
  const railSpur = addGroundPath(
    boundary,
    definition.id,
    'ACADEMIC__COASTAL_RAIL_GATE_PATH',
    hub.clone().addScaledVector(radial, 59.2),
    hub.clone().addScaledVector(radial, railRadius - hubRadius),
    0.58,
    materials.earthPath,
  );
  [tundraSpur, desertSpur, railSpur].forEach((path) => {
    path.userData.academicBoundaryAccessPath = true;
    path.userData.localCampusRoad = true;
  });
  const gateCollisionGuide = new THREE.Object3D();
  gateCollisionGuide.name = 'ACADEMIC__GOTHIC_GATE_PIERS__PRECISE_WALK_COLLISION';
  gateCollisionGuide.userData.navBarrierSegments = gatePierBarriers;
  gateCollisionGuide.userData.academicBoundaryBarrierCount = gatePierBarriers.length;
  boundary.add(gateCollisionGuide);
  totalBarrierCount += gatePierBarriers.length;

  const worldPoint = (local: THREE.Vector3) => [
    local.x + definition.position[0],
    local.y + definition.position[1] + ISLAND_SURFACE_Y,
    local.z + definition.position[2],
  ];
  const openingMetadata = [
    {
      id: 'main-avenue',
      destination: 'inner ring road and island centre',
      type: 'monumental existing gate',
      localPoint: sectorPoint(innerRadius, 0).toArray(),
      worldPoint: worldPoint(sectorPoint(innerRadius, 0)),
      clearWidth: 8.3,
      crossingDirection: radial.toArray(),
      passable: true,
      schedule: 'open by day; interactively openable at night',
    },
    {
      id: 'tundra-biodome',
      destination: 'Tundra Biodome',
      type: 'ivy garden entrance and dome aperture',
      localPoint: tundraGateCenter.toArray(),
      worldPoint: worldPoint(tundraGateCenter),
      clearWidth: 1.45,
      crossingDirection: tundraSide.inward.toArray(),
      domeApertureLength: domeGapOuterRadius - domeGapInnerRadius,
      passable: true,
      schedule: 'always open',
    },
    {
      id: 'desert-biodome',
      destination: 'Desert Biodome',
      type: 'ivy garden entrance and dome aperture',
      localPoint: desertGateCenter.toArray(),
      worldPoint: worldPoint(desertGateCenter),
      clearWidth: 1.45,
      crossingDirection: desertSide.inward.toArray(),
      domeApertureLength: domeGapOuterRadius - domeGapInnerRadius,
      passable: true,
      schedule: 'always open',
    },
    {
      id: 'coastal-railway',
      destination: 'island coastal railway',
      type: 'monumental open gate',
      localPoint: rearGateCenter.toArray(),
      worldPoint: worldPoint(rearGateCenter),
      clearWidth: rearGateHalfWidth * 2,
      crossingDirection: radial.toArray(),
      railClearance: railRadius - rearRadius,
      passable: true,
      schedule: 'always open',
    },
  ];
  boundary.userData.boundaryModel = 'annular Academic sector framed between inner ring road, radial biodome avenues, and coastal railway';
  boundary.userData.heightMultiplier = heightMultiplier;
  boundary.userData.fenceHeightMetres = 3.3 * heightMultiplier;
  boundary.userData.pierHeightMetres = 4.9 * heightMultiplier;
  boundary.userData.visuallyPermeable = true;
  boundary.userData.patterns = ['pointed arches', 'quatrefoils', 'restrained botanical scrolls', 'carved college crests'];
  boundary.userData.materials = ['weathered carved limestone', 'repair stone', 'blackened wrought iron', 'aged brass', 'climbing ivy'];
  boundary.userData.openings = openingMetadata;
  boundary.userData.runCount = runs.length;
  boundary.userData.fenceBayCount = totalBayCount;
  const gatePierCount = 6;
  boundary.userData.pierCount = totalPierCount + gatePierCount;
  boundary.userData.gatePierCount = gatePierCount;
  boundary.userData.carvedCrestCount = totalPierCount + gatePierCount;
  boundary.userData.preciseBarrierCount = totalBarrierCount;
  // At this district-wide scale the narrow ironwork and ivy cast sub-pixel
  // shadows while multiplying work across both shadow maps. The stone still
  // receives the shared environmental shadows, but the enclosure itself uses
  // baked/weathered material contrast instead of real-time shadow casting.
  boundary.traverse((object) => {
    if (object instanceof THREE.Mesh) object.castShadow = false;
  });
  return boundary;
}

function createCentralQuadrangle(
  definition: DistrictDefinition,
  hub: THREE.Vector3,
  tangent: THREE.Vector3,
  radial: THREE.Vector3,
  materials: AcademicMaterials,
) {
  const quad = new THREE.Group();
  quad.name = `${definition.id}__ACADEMIC_ZONE__GRAND_CENTRAL_QUADRANGLE`;
  quad.userData.semanticName = 'Founders Grand Central Quadrangle';
  quad.userData.academicFeatureType = 'quadrangle and cloister';
  quad.position.copy(campusPoint(hub, tangent, radial, [0, 9]));

  const lawn = prepare(new THREE.Mesh(new THREE.PlaneGeometry(19, 14, 4, 4), materials.foliage), definition.id);
  lawn.name = 'ACADEMIC__OLD_UNEVEN_QUADRANGLE_LAWN';
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = 0.004;
  lawn.userData.walkable = true;
  quad.add(lawn);
  quad.userData.decorativeCrossPathsRemoved = true;

  const plinth = prepare(new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.52, 0.58, 16), materials.limestone), definition.id);
  plinth.name = 'ACADEMIC__STATUE_PLINTH';
  plinth.position.y = 0.29;
  plinth.userData.navObstacle = true;
  const scholar = prepare(new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.35, 5, 10), materials.brass), definition.id);
  scholar.name = 'ACADEMIC__STATUE_OF_PROFESSOR_ADA_MARSH';
  scholar.position.y = 1.75;
  scholar.userData.academicHotspot = 'founders-statue';
  quad.add(plinth, scholar);

  for (const side of [-1, 1]) {
    for (let index = 0; index < 9; index += 1) {
      const x = THREE.MathUtils.lerp(-9, 9, index / 8);
      const column = prepare(new THREE.Mesh(unitCylinder, materials.limestone), definition.id);
      column.name = 'ACADEMIC__CLOISTER_COLUMN';
      column.scale.set(0.18, 2.2, 0.18);
      column.position.set(x, 1.1, side * 7.65);
      column.userData.navObstacle = true;
      quad.add(column);
    }
    addBox(quad, definition.id, 'ACADEMIC__CLOISTER_SLATE_CANOPY', [19.5, 0.22, 1.55], materials.slate, [0, 2.32, side * 7.65]);
  }

  const abandonedProps = [
    [-5.2, -2.8, 'ABANDONED_BOOKS'], [4.4, 2.4, 'STUDENT_BICYCLE'], [-2.6, 3.8, 'FORGOTTEN_SATCHEL'],
  ] as const;
  abandonedProps.forEach(([x, z, name], index) => {
    const prop = addBox(quad, definition.id, `ACADEMIC__${name}`, index === 1 ? [1.25, 0.08, 0.55] : [0.56, 0.14, 0.38], index === 1 ? materials.iron : materials.oak, [x, 0.1, z]);
    prop.rotation.y = index * 0.7;
  });
  return quad;
}

function createProfessorsGarden(
  definition: DistrictDefinition,
  hub: THREE.Vector3,
  tangent: THREE.Vector3,
  radial: THREE.Vector3,
  materials: AcademicMaterials,
) {
  const garden = new THREE.Group();
  garden.name = `${definition.id}__ACADEMIC_ZONE__PROFESSORS_GARDEN`;
  garden.position.copy(campusPoint(hub, tangent, radial, [48, -14]));
  garden.userData.semanticName = 'Professors\' Garden';
  garden.userData.academicFeatureType = 'locked garden';
  const width = 17;
  const depth = 13;
  const wallHeight = 2.6;
  addBox(garden, definition.id, 'ACADEMIC__GARDEN_NORTH_WALL', [width, wallHeight, 0.28], materials.limestone, [0, wallHeight * 0.5, -depth * 0.5], { obstacle: true });
  addBox(garden, definition.id, 'ACADEMIC__GARDEN_SOUTH_WALL', [width, wallHeight, 0.28], materials.limestone, [0, wallHeight * 0.5, depth * 0.5], { obstacle: true });
  addBox(garden, definition.id, 'ACADEMIC__GARDEN_WEST_WALL', [0.28, wallHeight, depth], materials.limestone, [-width * 0.5, wallHeight * 0.5, 0], { obstacle: true });
  addBox(garden, definition.id, 'ACADEMIC__GARDEN_EAST_WALL', [0.28, wallHeight, depth], materials.limestone, [width * 0.5, wallHeight * 0.5, 0], { obstacle: true });
  const gate = addBox(garden, definition.id, 'ACADEMIC__LOCKED_PROFESSORS_GARDEN_GATE', [2.1, 2.2, 0.12], materials.iron, [0, 1.1, depth * 0.5 + 0.05], { obstacle: true });
  gate.userData.academicHotspot = 'professors-garden';

  for (let index = 0; index < 14; index += 1) {
    // Retain clipped shrubs, but remove the five tall crown proxies that read
    // as trees and obscured the historic facades from the paths.
    if (index % 3 === 0) continue;
    const angle = index * 2.39996;
    const radius = 2.4 + (index % 4) * 1.15;
    const crown = prepare(new THREE.Mesh(lowPolyCrown, materials.yew), definition.id);
    crown.name = 'ACADEMIC__CLIPPED_YEW_HEDGE';
    crown.scale.set(1.35 + (index % 2) * 0.4, 0.72 + (index % 3) * 0.08, 0.58 + (index % 2) * 0.16);
    crown.position.set(Math.cos(angle) * radius, crown.scale.y * 0.5, Math.sin(angle) * radius);
    garden.add(crown);
  }
  const fountain = prepare(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.42, 20), materials.limestone), definition.id);
  fountain.name = 'ACADEMIC__PROFESSORS_GARDEN_FOUNTAIN';
  fountain.position.y = 0.21;
  fountain.userData.navObstacle = true;
  garden.add(fountain);
  return garden;
}

function createCanalStripGeometry(
  curve: THREE.CatmullRomCurve3,
  leftOffset: number,
  rightOffset: number,
  leftY: number,
  rightY: number,
  segments = 72,
) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const lateral = new THREE.Vector3();
  const curveLength = curve.getLength();
  for (let index = 0; index <= segments; index += 1) {
    const alpha = index / segments;
    const point = curve.getPointAt(alpha);
    const direction = curve.getTangentAt(alpha).setY(0).normalize();
    lateral.set(-direction.z, 0, direction.x).normalize();
    const left = point.clone().addScaledVector(lateral, leftOffset);
    const right = point.clone().addScaledVector(lateral, rightOffset);
    positions.push(left.x, leftY, left.z, right.x, rightY, right.z);
    const longitudinal = alpha * curveLength / 4;
    uvs.push(0, longitudinal, 1, longitudinal);
    if (index === segments) continue;
    const current = index * 2;
    const next = current + 2;
    indices.push(current, current + 1, next, current + 1, next + 1, next);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createCanalEdge(
  definition: DistrictDefinition,
  hub: THREE.Vector3,
  tangent: THREE.Vector3,
  radial: THREE.Vector3,
  materials: AcademicMaterials,
) {
  const canal = new THREE.Group();
  canal.name = `${definition.id}__ACADEMIC_ZONE__BLACKWATER_CANAL_EDGE`;
  canal.userData.semanticName = 'Blackwater Canal Edge';
  canal.userData.academicFeatureType = 'meandering canal, sloped embankment, arched bridge and riparian planting';

  // The original straight channel clipped the rotated Rowing House. This
  // restrained outward meander stays between the historic willow/alder rows
  // and leaves a dry maintenance margin beside the complete facade.
  const centerlineControls = [
    [-50, 52.55], [-35, 53.05], [-20, 54.05], [-8, 55.75],
    [6, 56.35], [21, 55.15], [36, 53.55], [50, 52.65],
  ] as const;
  const centerline = centerlineControls.map((point) => campusPoint(hub, tangent, radial, point));
  const curve = new THREE.CatmullRomCurve3(centerline, false, 'centripetal', 0.38);
  const waterWidth = 5.4;
  const waterHalfWidth = waterWidth * 0.5;
  const bankOuterHalfWidth = 3.35;
  const stripSegments = 80;

  const riverbed = prepare(new THREE.Mesh(
    createCanalStripGeometry(curve, -waterHalfWidth - 0.1, waterHalfWidth + 0.1, 0.007, 0.007, stripSegments),
    materials.wetCobble,
  ), definition.id, 'riverbed');
  riverbed.name = 'ACADEMIC__BLACKWATER_RIVERBED';
  riverbed.castShadow = false;
  riverbed.userData.naturalRiverbed = true;
  canal.add(riverbed);

  const water = prepare(new THREE.Mesh(
    createCanalStripGeometry(curve, -waterHalfWidth, waterHalfWidth, 0.021, 0.021, stripSegments),
    materials.water,
  ), definition.id, 'flowing water');
  water.name = 'ACADEMIC__BLACKWATER_CANAL';
  water.castShadow = false;
  water.renderOrder = 2;
  water.userData.academicWaterReflection = true;
  water.userData.meanderingWaterRibbon = true;
  water.userData.flowDirection = 'west to east along the Blackwater centerline';
  water.userData.waterWidthWorldUnits = waterWidth;
  water.onBeforeRender = () => {
    const rippleMap = materials.water.bumpMap;
    if (rippleMap) rippleMap.offset.y = -((performance.now() * 0.000018) % 1);
  };
  canal.add(water);

  for (const side of [-1, 1] as const) {
    const leftOffset = side < 0 ? -bankOuterHalfWidth : waterHalfWidth - 0.04;
    const rightOffset = side < 0 ? -waterHalfWidth + 0.04 : bankOuterHalfWidth;
    const leftY = side < 0 ? 0.155 : 0.026;
    const rightY = side < 0 ? 0.026 : 0.155;
    const bank = prepare(new THREE.Mesh(
      createCanalStripGeometry(curve, leftOffset, rightOffset, leftY, rightY, stripSegments),
      materials.limestone,
    ), definition.id, 'sloped stone river bank');
    bank.name = 'ACADEMIC__MOSSY_STONE_EMBANKMENT';
    bank.userData.slopedRiverBank = true;
    bank.userData.navObstacle = false;
    canal.add(bank);

    const copingInner = side < 0 ? -waterHalfWidth - 0.02 : waterHalfWidth - 0.22;
    const copingOuter = side < 0 ? -waterHalfWidth + 0.22 : waterHalfWidth + 0.02;
    const coping = prepare(new THREE.Mesh(
      createCanalStripGeometry(curve, copingInner, copingOuter, 0.04, 0.04, stripSegments),
      materials.repairedStone,
    ), definition.id, 'stone waterline coping');
    coping.name = 'ACADEMIC__BLACKWATER_STONE_COPING';
    coping.userData.waterlineCoping = true;
    canal.add(coping);

    const mossInner = side < 0 ? -waterHalfWidth - 0.13 : waterHalfWidth + 0.02;
    const mossOuter = side < 0 ? -waterHalfWidth - 0.02 : waterHalfWidth + 0.13;
    const waterlineMoss = prepare(new THREE.Mesh(
      createCanalStripGeometry(curve, mossInner, mossOuter, 0.043, 0.043, stripSegments),
      materials.moss,
    ), definition.id, 'moss and river sediment at the waterline');
    waterlineMoss.name = 'ACADEMIC__BLACKWATER_WATERLINE_MOSS';
    waterlineMoss.userData.naturalWaterlineDetail = true;
    waterlineMoss.castShadow = false;
    canal.add(waterlineMoss);
  }

  const bridgeTangentCoordinate = -10.5;
  let bridgeParameter = 0;
  let bridgeCoordinateError = Number.POSITIVE_INFINITY;
  for (let sample = 0; sample <= 240; sample += 1) {
    const alpha = sample / 240;
    const point = curve.getPointAt(alpha);
    const coordinate = point.clone().sub(hub).dot(tangent);
    const error = Math.abs(coordinate - bridgeTangentCoordinate);
    if (error >= bridgeCoordinateError) continue;
    bridgeCoordinateError = error;
    bridgeParameter = alpha;
  }
  const bridgeCenter = curve.getPointAt(bridgeParameter);
  const riverDirection = curve.getTangentAt(bridgeParameter).setY(0).normalize();
  const crossingDirection = new THREE.Vector3(-riverDirection.z, 0, riverDirection.x).normalize();
  if (crossingDirection.dot(radial) < 0) crossingDirection.negate();
  const crossingHalfLength = bankOuterHalfWidth + 0.9;
  const bridgeStart = bridgeCenter.clone().addScaledVector(crossingDirection, -crossingHalfLength);
  const bridgeEnd = bridgeCenter.clone().addScaledVector(crossingDirection, crossingHalfLength);
  const bridge = new THREE.Group();
  bridge.name = 'ACADEMIC__ARCHED_PEDESTRIAN_BRIDGE';
  bridge.userData.districtId = definition.id;
  bridge.userData.academicBridge = true;
  bridge.userData.relocatedFromRowingHouse = true;
  bridge.userData.bridgeCenterlineParameter = bridgeParameter;
  const deckSegments = 24;
  const bridgeWidth = 1.5;
  const railOffsetDistance = bridgeWidth * 0.46;
  const bridgeArchRise = 0.06;
  const deckTargets: number[][] = [];
  const railBarriers: Array<{ start: [number, number, number]; end: [number, number, number]; radius: number }> = [];
  const deckTopAt = (alpha: number) => 0.035 + Math.sin(alpha * Math.PI) * bridgeArchRise;
  for (let index = 0; index < deckSegments; index += 1) {
    const startAlpha = index / deckSegments;
    const endAlpha = (index + 1) / deckSegments;
    const midpointAlpha = (startAlpha + endAlpha) * 0.5;
    const deckStart = bridgeStart.clone().lerp(bridgeEnd, startAlpha);
    const deckEnd = bridgeStart.clone().lerp(bridgeEnd, endAlpha);
    const deckTop = deckTopAt(midpointAlpha);
    const slab = addSegment(
      bridge,
      definition.id,
      `ACADEMIC__BRIDGE_STONE_DECK_${String(index + 1).padStart(2, '0')}`,
      deckStart,
      deckEnd,
      bridgeWidth,
      0.035,
      index % 4 === 0 ? materials.repairedStone : materials.limestone,
      deckTop - 0.0175,
      { walkable: true },
    );
    slab.userData.academicBridgeDeck = true;
    slab.userData.walkable = false;
    slab.userData.bridgeDeckTop = deckTop;
    deckTargets.push(deckStart.clone().lerp(deckEnd, 0.5).setY(deckTop).toArray());
    for (const side of [-1, 1] as const) {
      const railOffset = riverDirection.clone().multiplyScalar(side * railOffsetDistance);
      const railStart = deckStart.clone().add(railOffset);
      const railEnd = deckEnd.clone().add(railOffset);
      const railY = deckTop + 0.14;
      const handrail = addSegment(bridge, definition.id, 'ACADEMIC__BRIDGE_IRON_RAIL', railStart, railEnd, 0.035, 0.035, materials.iron, railY);
      handrail.userData.academicBridgeHandrail = true;
      const lowerRail = addSegment(bridge, definition.id, 'ACADEMIC__BRIDGE_IRON_LOWER_RAIL', railStart, railEnd, 0.025, 0.025, materials.iron, deckTop + 0.075);
      lowerRail.userData.academicBridgeHandrail = true;
      railBarriers.push({
        start: railStart.clone().setY(deckTop + 0.08).toArray() as [number, number, number],
        end: railEnd.clone().setY(deckTop + 0.08).toArray() as [number, number, number],
        radius: 0.035,
      });
    }
  }
  for (let index = 0; index <= deckSegments; index += 1) {
    const alpha = index / deckSegments;
    const deckPoint = bridgeStart.clone().lerp(bridgeEnd, alpha);
    const deckTop = deckTopAt(alpha);
    for (const side of [-1, 1] as const) {
      const postPosition = deckPoint.clone().addScaledVector(riverDirection, side * railOffsetDistance);
      addBox(bridge, definition.id, 'ACADEMIC__BRIDGE_IRON_POST', [0.045, 0.15, 0.045], materials.iron, [postPosition.x, deckTop + 0.075, postPosition.z]);
    }
  }
  const walkVertices: number[] = [];
  const walkIndices: number[] = [];
  for (let index = 0; index <= deckSegments; index += 1) {
    const alpha = index / deckSegments;
    const center = bridgeStart.clone().lerp(bridgeEnd, alpha).setY(deckTopAt(alpha) + 0.002);
    const left = center.clone().addScaledVector(riverDirection, -bridgeWidth * 0.42);
    const right = center.clone().addScaledVector(riverDirection, bridgeWidth * 0.42);
    walkVertices.push(left.x, left.y, left.z, right.x, right.y, right.z);
    if (index === deckSegments) continue;
    const base = index * 2;
    walkIndices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
  }
  const walkGeometry = new THREE.BufferGeometry();
  walkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(walkVertices, 3));
  walkGeometry.setIndex(walkIndices);
  walkGeometry.computeVertexNormals();
  const walkMaterial = new THREE.MeshBasicMaterial({
    color: '#000000', colorWrite: false, depthWrite: false, side: THREE.DoubleSide,
  });
  walkMaterial.name = 'Academic invisible continuous bridge walk surface';
  const walkSurface = prepare(new THREE.Mesh(walkGeometry, walkMaterial), definition.id, 'continuous bridge walking surface');
  walkSurface.name = 'ACADEMIC__BRIDGE_CONTINUOUS_WALK_SURFACE';
  walkSurface.userData.walkable = true;
  walkSurface.userData.academicBridgeWalkSurface = true;
  walkSurface.castShadow = false;
  bridge.add(walkSurface);
  bridge.userData.navBarrierSegments = railBarriers;
  bridge.userData.walkCrossing = {
    start: bridgeStart.toArray(), end: bridgeEnd.toArray(), deckTargets, width: bridgeWidth, archRise: bridgeArchRise,
  };
  canal.add(bridge);

  const bankBarriers: Array<{ start: [number, number, number]; end: [number, number, number]; radius: number }> = [];
  const bankBarrierSegments = 56;
  for (const side of [-1, 1] as const) {
    for (let index = 0; index < bankBarrierSegments; index += 1) {
      const startAlpha = index / bankBarrierSegments;
      const endAlpha = (index + 1) / bankBarrierSegments;
      // Keep the collision opening wider than the visible bridge so WALK's
      // player radius cannot catch the final bank segment on a curved reach.
      if (Math.abs((startAlpha + endAlpha) * 0.5 - bridgeParameter) < 0.052) continue;
      const barrierPoint = (alpha: number) => {
        const point = curve.getPointAt(alpha);
        const direction = curve.getTangentAt(alpha).setY(0).normalize();
        const lateral = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
        return point.addScaledVector(lateral, side * (waterHalfWidth + 0.18)).setY(0.17);
      };
      bankBarriers.push({
        start: barrierPoint(startAlpha).toArray() as [number, number, number],
        end: barrierPoint(endAlpha).toArray() as [number, number, number],
        radius: 0.17,
      });
    }
  }
  const bankCollisionGuide = new THREE.Object3D();
  bankCollisionGuide.name = 'ACADEMIC__BLACKWATER_PRECISE_BANK_COLLISION';
  bankCollisionGuide.userData.districtId = definition.id;
  bankCollisionGuide.userData.navBarrierSegments = bankBarriers;
  bankCollisionGuide.userData.academicCanalCollision = true;
  canal.add(bankCollisionGuide);

  const flowGlintCount = 64;
  const flowGeometry = new THREE.PlaneGeometry(0.22, 0.018);
  flowGeometry.rotateX(-Math.PI * 0.5);
  const flowMaterial = new THREE.MeshBasicMaterial({
    color: '#b4d7d2', transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide,
  });
  flowMaterial.name = 'Academic canal flow glints';
  flowMaterial.userData.excludeSeasonFoliage = true;
  const flowGlints = prepare(new THREE.InstancedMesh(flowGeometry, flowMaterial, flowGlintCount), definition.id, 'water flow detail');
  flowGlints.name = 'ACADEMIC__BLACKWATER_FLOW_GLINTS';
  flowGlints.castShadow = false;
  flowGlints.renderOrder = 3;
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  for (let index = 0; index < flowGlintCount; index += 1) {
    const alpha = THREE.MathUtils.clamp((index + 0.35 + Math.sin(index * 2.71) * 0.28) / flowGlintCount, 0.002, 0.998);
    const point = curve.getPointAt(alpha);
    const direction = curve.getTangentAt(alpha).setY(0).normalize();
    const lateral = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    point.addScaledVector(lateral, Math.sin(index * 4.37) * waterHalfWidth * 0.76).setY(0.025);
    quaternion.setFromAxisAngle(up, Math.atan2(direction.x, direction.z));
    scale.set(0.55 + (index % 5) * 0.22, 1, 0.65 + (index % 4) * 0.14);
    matrix.compose(point, quaternion, scale);
    flowGlints.setMatrixAt(index, matrix);
  }
  flowGlints.instanceMatrix.needsUpdate = true;
  canal.add(flowGlints);

  const reedRecords: Array<{ position: THREE.Vector3; height: number; width: number }> = [];
  for (let cluster = 0; cluster < 36; cluster += 1) {
    const alpha = (cluster + 0.7) / 36;
    if (Math.abs(alpha - bridgeParameter) < 0.052) continue;
    const point = curve.getPointAt(alpha);
    const direction = curve.getTangentAt(alpha).setY(0).normalize();
    const lateral = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    const side = cluster % 2 ? -1 : 1;
    for (let stem = 0; stem < 3; stem += 1) {
      const position = point.clone()
        .addScaledVector(lateral, side * (waterHalfWidth - 0.1 + stem * 0.16))
        .addScaledVector(direction, (stem - 1) * 0.12);
      reedRecords.push({
        position,
        height: 0.48 + ((cluster * 7 + stem * 3) % 9) * 0.045,
        width: 0.022 + ((cluster + stem) % 3) * 0.005,
      });
    }
  }
  const reeds = prepare(new THREE.InstancedMesh(unitCylinder, materials.foliage, reedRecords.length), definition.id, 'riparian reeds');
  reeds.name = 'ACADEMIC__CANAL_REED';
  reeds.userData.riparianPlanting = true;
  reeds.userData.reedStemCount = reedRecords.length;
  reedRecords.forEach((record, index) => {
    quaternion.identity();
    scale.set(record.width, record.height, record.width);
    const position = record.position.clone().setY(record.height * 0.5 + 0.018);
    matrix.compose(position, quaternion, scale);
    reeds.setMatrixAt(index, matrix);
  });
  reeds.instanceMatrix.needsUpdate = true;
  canal.add(reeds);

  const cattailGeometry = new THREE.CapsuleGeometry(0.5, 1.1, 2, 6);
  const cattailRecords = reedRecords.filter((_, index) => index % 2 === 0);
  const cattails = prepare(new THREE.InstancedMesh(cattailGeometry, materials.leaf, cattailRecords.length), definition.id, 'riparian cattail heads');
  cattails.name = 'ACADEMIC__CANAL_CATTAIL_HEAD';
  cattails.userData.riparianPlanting = true;
  cattails.userData.cattailHeadCount = cattailRecords.length;
  cattailRecords.forEach((record, index) => {
    quaternion.identity();
    scale.set(record.width * 1.5, 0.07 + (index % 3) * 0.008, record.width * 1.5);
    const position = record.position.clone().setY(record.height + 0.07);
    matrix.compose(position, quaternion, scale);
    cattails.setMatrixAt(index, matrix);
  });
  cattails.instanceMatrix.needsUpdate = true;
  canal.add(cattails);

  const bankRockCount = 44;
  const bankRocks = prepare(new THREE.InstancedMesh(lowPolyCrown, materials.wetCobble, bankRockCount), definition.id, 'irregular wet river-edge stones');
  bankRocks.name = 'ACADEMIC__BLACKWATER_EDGE_STONE';
  bankRocks.userData.naturalWaterlineDetail = true;
  bankRocks.userData.bankRockCount = bankRockCount;
  for (let index = 0; index < bankRockCount; index += 1) {
    const alpha = (index + 0.45) / bankRockCount;
    if (Math.abs(alpha - bridgeParameter) < 0.045) {
      matrix.makeScale(0, 0, 0);
      bankRocks.setMatrixAt(index, matrix);
      continue;
    }
    const point = curve.getPointAt(alpha);
    const direction = curve.getTangentAt(alpha).setY(0).normalize();
    const lateral = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    const side = index % 2 === 0 ? -1 : 1;
    point
      .addScaledVector(lateral, side * (waterHalfWidth + 0.02 + (index % 4) * 0.035))
      .addScaledVector(direction, Math.sin(index * 3.1) * 0.12)
      .setY(0.052);
    quaternion.setFromAxisAngle(up, index * 1.91);
    const rockSize = 0.1 + (index % 5) * 0.018;
    scale.set(rockSize * (1.1 + (index % 3) * 0.14), 0.07 + (index % 4) * 0.012, rockSize);
    matrix.compose(point, quaternion, scale);
    bankRocks.setMatrixAt(index, matrix);
  }
  bankRocks.instanceMatrix.needsUpdate = true;
  canal.add(bankRocks);

  const leafGeometry = new THREE.CircleGeometry(0.055, 6);
  leafGeometry.rotateX(-Math.PI * 0.5);
  const floatingLeaves = prepare(new THREE.InstancedMesh(leafGeometry, materials.leaf, 24), definition.id, 'floating leaves');
  floatingLeaves.name = 'ACADEMIC__BLACKWATER_FLOATING_LEAVES';
  floatingLeaves.castShadow = false;
  floatingLeaves.renderOrder = 4;
  for (let index = 0; index < 24; index += 1) {
    const alpha = (index + 0.6) / 24;
    const point = curve.getPointAt(alpha);
    const direction = curve.getTangentAt(alpha).setY(0).normalize();
    const lateral = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    point.addScaledVector(lateral, Math.sin(index * 4.71) * waterHalfWidth * 0.72).setY(0.028);
    quaternion.setFromAxisAngle(up, index * 1.73);
    const size = 0.6 + (index % 5) * 0.14;
    scale.set(size, size, size);
    matrix.compose(point, quaternion, scale);
    floatingLeaves.setMatrixAt(index, matrix);
  }
  floatingLeaves.instanceMatrix.needsUpdate = true;
  canal.add(floatingLeaves);

  canal.userData.academicCanal = {
    style: 'historic semi-natural university river with maintained stone edges',
    centerline: Array.from({ length: 33 }, (_, index) => curve.getPointAt(index / 32).toArray()),
    centerlineControlCount: centerlineControls.length,
    waterWidth,
    bankOuterWidth: bankOuterHalfWidth * 2,
    bridgeTangentCoordinate,
    bridgeParameter,
    bridgeRelocatedFromRowingHouse: true,
    slopedBankCount: 2,
    preciseBankBarrierCount: bankBarriers.length,
    flowGlintCount,
    floatingLeafCount: 24,
    reedStemCount: reedRecords.length,
    cattailHeadCount: cattailRecords.length,
    waterlineMossStripCount: 2,
    bankRockCount,
    animatedRippleTexture: true,
  };
  return canal;
}

function createScienceCourtInstruments(
  definition: DistrictDefinition,
  hub: THREE.Vector3,
  tangent: THREE.Vector3,
  radial: THREE.Vector3,
  materials: AcademicMaterials,
) {
  const court = new THREE.Group();
  court.name = `${definition.id}__ACADEMIC_ZONE__OLD_SCIENCE_COURT`;
  court.position.copy(campusPoint(hub, tangent, radial, [41, 17]));
  court.userData.semanticName = 'Old Science Court';
  court.userData.academicFeatureType = 'science court and instruments';
  const paving = prepare(new THREE.Mesh(new THREE.CircleGeometry(10.5, 32), materials.wetCobble), definition.id);
  paving.name = 'ACADEMIC__OLD_SCIENCE_COURT_PAVING';
  paving.rotation.x = -Math.PI * 0.5;
  paving.position.y = 0.025;
  paving.userData.walkable = true;
  court.add(paving);
  const armillary = prepare(new THREE.Mesh(new THREE.TorusKnotGeometry(1.4, 0.08, 64, 8), materials.brass), definition.id);
  armillary.name = 'ACADEMIC__VICTORIAN_ARMILLARY_INSTRUMENT';
  armillary.position.y = 1.75;
  armillary.userData.navObstacle = true;
  court.add(armillary);
  ['ASTRONOMIA', 'MATHEMATICA', 'PHILOSOPHIA NATURALIS'].forEach((inscription, index) => {
    const stone = addBox(court, definition.id, `ACADEMIC__SCIENCE_INSCRIPTION__${inscription}`, [2.8, 0.62, 0.35], index === 1 ? materials.repairedStone : materials.limestone, [-4 + index * 4, 0.31, -7.8], { obstacle: true });
    stone.userData.inscription = inscription;
  });
  return court;
}

function createServiceDetails(
  definition: DistrictDefinition,
  hub: THREE.Vector3,
  tangent: THREE.Vector3,
  radial: THREE.Vector3,
  materials: AcademicMaterials,
) {
  const service = new THREE.Group();
  service.name = `${definition.id}__ACADEMIC_ZONE__SERVICE_ALLEYS`;
  service.position.copy(campusPoint(hub, tangent, radial, [-45, -43]));
  service.userData.semanticName = 'North Service Alleys';
  service.userData.academicFeatureType = 'service and back of house';
  for (let index = 0; index < 8; index += 1) {
    const crate = addBox(service, definition.id, 'ACADEMIC__DELIVERY_CRATE', [0.72, 0.65 + (index % 2) * 0.25, 0.62], materials.oak, [-5 + (index % 4) * 1.15, 0.35, -1.4 + Math.floor(index / 4) * 1.1], { obstacle: true });
    crate.rotation.y = index * 0.2;
  }
  for (let index = 0; index < 4; index += 1) {
    const pipe = prepare(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.4, 8), index % 2 ? materials.copper : materials.iron), definition.id);
    pipe.name = 'ACADEMIC__DRAINPIPE';
    pipe.position.set(2.3 + index * 0.6, 1.7, 0);
    service.add(pipe);
  }
  const chalkDoor = addBox(service, definition.id, 'ACADEMIC__CHALK_MARKED_SERVICE_DOOR', [1.15, 2.2, 0.18], materials.oak, [5.1, 1.1, -0.8], { obstacle: true });
  chalkDoor.userData.academicHiddenDetail = 'Chalk markings on the boiler-house door';
  return service;
}

interface VintageBenchAnchor {
  position: THREE.Vector3;
  facing: THREE.Vector3;
  zone: string;
}

interface VintageBenchTransform {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
}

function createVintageCampusBenches(
  definition: DistrictDefinition,
  districtGroup: THREE.Group,
  hub: THREE.Vector3,
  tangent: THREE.Vector3,
  radial: THREE.Vector3,
  materials: AcademicMaterials,
) {
  const benches = new THREE.Group();
  benches.name = `${definition.id}__ACADEMIC_ZONE__VINTAGE_CAMPUS_BENCHES`;
  benches.userData.semanticName = 'Blackwood Vintage Park Benches';
  benches.userData.academicFeatureType = 'vintage park furniture';

  const anchors: VintageBenchAnchor[] = [];
  districtGroup.children.forEach((park) => {
    if (park.userData.academicPark !== true) return;
    const authoredParkAnchors = park.userData.academicBenchAnchors as number[][] | undefined;
    if (!authoredParkAnchors?.length) return;
    const semanticName = String(park.userData.semanticName ?? 'academic park');
    const parkAnchors = semanticName === ACADEMIC_FOUNTAIN_COURT_NAME
      // The Well now fills the middle of this court. Keep its four benches on
      // the outer paving ring, clear of both the basin and avenue bypass.
      ? [[-0.8, 0, -3], [-0.8, 0, 3], [0.8, 0, -3], [0.8, 0, 3]]
      : authoredParkAnchors.map((anchor) => (
        semanticName === 'Bronze Scholars Memorial Court' && anchor[0] < 0
          ? [anchor[0] + 0.6, anchor[1], anchor[2]]
          : [...anchor]
      ));
    park.updateMatrix();
    parkAnchors.forEach((anchor) => {
      const position = new THREE.Vector3().fromArray(anchor).applyMatrix4(park.matrix);
      position.y = 0.004;
      const facing = park.position.clone().sub(position).setY(0).normalize();
      anchors.push({ position, facing, zone: semanticName });
    });
  });

  const primaryApproach = districtGroup.children.find(
    (object) => object.userData.academicPathRole === 'main-processional'
      && object.userData.processionalSegmentIndex === 0,
  );
  const primaryApproachEndpoints = primaryApproach?.userData.roadEndpoints as {
    start: [number, number, number];
    end: [number, number, number];
  } | undefined;
  if (primaryApproachEndpoints) {
    const start = new THREE.Vector3().fromArray(primaryApproachEndpoints.start);
    const end = new THREE.Vector3().fromArray(primaryApproachEndpoints.end);
    const direction = end.clone().sub(start).setY(0).normalize();
    const normal = new THREE.Vector3(-direction.z, 0, direction.x);
    [0.28, 0.45, 0.64, 0.82].forEach((along, index) => {
      const pathCenter = start.clone().lerp(end, along);
      const position = pathCenter.clone().addScaledVector(normal, index % 2 === 0 ? 0.7 : -0.7);
      position.y = 0;
      anchors.push({
        position,
        facing: pathCenter.sub(position).setY(0).normalize(),
        zone: 'processional avenue',
      });
    });
  }

  const distributedAnchors: ReadonlyArray<{
    position: readonly [number, number];
    target: readonly [number, number];
    zone: string;
    groundY?: number;
  }> = [
    { position: [-5.6, 14.6], target: [0, 9], zone: 'Founders Quadrangle', groundY: 0.004 },
    { position: [6.4, 3.4], target: [0, 9], zone: 'Founders Quadrangle', groundY: 0.004 },
    { position: [-10, -8], target: [0, 0], zone: 'library close' },
    { position: [10, -9], target: [0, 0], zone: 'library close' },
    { position: [35, 20], target: [34, 26], zone: 'Old Science Court', groundY: 0.025 },
    { position: [-18, 48], target: [-18, 55], zone: 'Blackwater canal bank' },
    { position: [20, 48], target: [20, 55], zone: 'Blackwater canal bank' },
    { position: [-51, 18], target: [-44, 9], zone: 'St Anselm Chapel close' },
  ];
  distributedAnchors.forEach((anchor) => {
    const position = campusPoint(hub, tangent, radial, anchor.position);
    const target = campusPoint(hub, tangent, radial, anchor.target);
    position.y = anchor.groundY ?? 0;
    anchors.push({ position, facing: target.sub(position).setY(0).normalize(), zone: anchor.zone });
  });

  const oakTransforms: VintageBenchTransform[] = [];
  const ironTransforms: VintageBenchTransform[] = [];
  const scrollTransforms: VintageBenchTransform[] = [];
  const barrierSegments: Array<{ start: [number, number, number]; end: [number, number, number]; radius: number }> = [];
  const localOffset = new THREE.Vector3();
  const worldPosition = new THREE.Vector3();
  const addTransform = (
    list: VintageBenchTransform[],
    center: THREE.Vector3,
    quaternion: THREE.Quaternion,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    orientation = quaternion,
  ) => {
    localOffset.set(x, y, z).applyQuaternion(quaternion);
    worldPosition.copy(center).add(localOffset);
    list.push({
      position: worldPosition.clone(),
      quaternion: orientation.clone(),
      scale: new THREE.Vector3(sx, sy, sz),
    });
  };

  anchors.forEach((anchor) => {
    const yaw = Math.atan2(anchor.facing.x, anchor.facing.z);
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
    for (let slat = 0; slat < 4; slat += 1) {
      addTransform(oakTransforms, anchor.position, quaternion, 0, 0.046, -0.018 + slat * 0.012, 0.19, 0.006, 0.01);
    }
    for (let slat = 0; slat < 3; slat += 1) {
      addTransform(oakTransforms, anchor.position, quaternion, 0, 0.066 + slat * 0.017, -0.029, 0.19, 0.008, 0.01);
    }
    for (const x of [-0.082, 0.082]) {
      for (const z of [-0.018, 0.018]) {
        addTransform(ironTransforms, anchor.position, quaternion, x, 0.022, z, 0.009, 0.044, 0.009);
      }
      addTransform(ironTransforms, anchor.position, quaternion, x, 0.072, -0.03, 0.009, 0.092, 0.009);
      addTransform(ironTransforms, anchor.position, quaternion, x * 1.16, 0.064, 0, 0.009, 0.009, 0.056);
      const scrollOrientation = quaternion.clone().multiply(
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI * 0.5, 0)),
      );
      addTransform(scrollTransforms, anchor.position, quaternion, x * 1.17, 0.078, -0.028, 1, 1, 1, scrollOrientation);
    }
    addTransform(ironTransforms, anchor.position, quaternion, 0, 0.027, -0.027, 0.17, 0.008, 0.008);

    const barrierStart = new THREE.Vector3(-0.105, 0.045, 0).applyQuaternion(quaternion).add(anchor.position);
    const barrierEnd = new THREE.Vector3(0.105, 0.045, 0).applyQuaternion(quaternion).add(anchor.position);
    barrierSegments.push({ start: barrierStart.toArray(), end: barrierEnd.toArray(), radius: 0.035 });
  });

  const setInstances = (mesh: THREE.InstancedMesh, transforms: readonly VintageBenchTransform[]) => {
    const matrix = new THREE.Matrix4();
    transforms.forEach((transform, index) => {
      matrix.compose(transform.position, transform.quaternion, transform.scale);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  };

  const oakSlats = prepare(new THREE.InstancedMesh(unitBox, materials.oak, oakTransforms.length), definition.id, 'vintage bench oak slats');
  oakSlats.name = 'ACADEMIC__VINTAGE_BENCH_AGED_OAK_SLATS';
  oakSlats.userData.academicVintageBenches = true;
  oakSlats.userData.benchCount = anchors.length;
  setInstances(oakSlats, oakTransforms);

  const ironFrames = prepare(new THREE.InstancedMesh(unitBox, materials.iron, ironTransforms.length), definition.id, 'vintage bench cast-iron frames');
  ironFrames.name = 'ACADEMIC__VINTAGE_BENCH_CAST_IRON_FRAMES';
  ironFrames.userData.academicVintageBenches = true;
  ironFrames.userData.benchCount = anchors.length;
  setInstances(ironFrames, ironTransforms);

  const scrollGeometry = new THREE.TorusGeometry(0.018, 0.0045, 5, 12, Math.PI * 1.45);
  const ironScrolls = prepare(new THREE.InstancedMesh(scrollGeometry, materials.iron, scrollTransforms.length), definition.id, 'vintage bench scrollwork');
  ironScrolls.name = 'ACADEMIC__VINTAGE_BENCH_CAST_IRON_SCROLL_ENDS';
  ironScrolls.userData.academicVintageBenches = true;
  ironScrolls.userData.benchCount = anchors.length;
  setInstances(ironScrolls, scrollTransforms);

  const collisionGuide = new THREE.Object3D();
  collisionGuide.name = 'ACADEMIC__VINTAGE_BENCH_PRECISE_WALK_COLLISION';
  collisionGuide.userData.navBarrierSegments = barrierSegments;
  collisionGuide.userData.academicBenchBarrierCount = barrierSegments.length;
  benches.add(oakSlats, ironFrames, ironScrolls, collisionGuide);
  benches.userData.academicVintageBenchCount = anchors.length;
  benches.userData.benchAnchors = anchors.map((anchor, index) => ({
    id: `blackwood-bench-${String(index + 1).padStart(2, '0')}`,
    position: anchor.position.toArray(),
    facing: anchor.facing.toArray(),
    zone: anchor.zone,
  }));
  return benches;
}

function createCampusConnectorsAndTraces(
  definition: DistrictDefinition,
  districtGroup: THREE.Group,
  hub: THREE.Vector3,
  tangent: THREE.Vector3,
  radial: THREE.Vector3,
  materials: AcademicMaterials,
) {
  const details = new THREE.Group();
  details.name = `${definition.id}__ACADEMIC_ZONE__CONNECTORS_AND_HUMAN_TRACES`;
  details.userData.semanticName = 'Campus Passages, Graveyard, and Student Traces';
  details.userData.academicFeatureType = 'passages, graveyard and implied students';

  const chapelPosition = campusPoint(hub, tangent, radial, [-44, 9]);
  const graveyardCenter = chapelPosition.clone().addScaledVector(tangent, -12).addScaledVector(radial, 1.5);
  for (let index = 0; index < 14; index += 1) {
    const row = Math.floor(index / 5);
    const column = index % 5;
    const tomb = addBox(
      details,
      definition.id,
      'ACADEMIC__PROFESSOR_AND_BENEFACTOR_GRAVESTONE',
      [0.32, 0.56 + (index % 3) * 0.08, 0.14],
      index % 4 === 0 ? materials.repairedStone : materials.limestone,
      [graveyardCenter.x + (column - 2) * 0.72, 0.3, graveyardCenter.z + (row - 1) * 0.82],
      { obstacle: true },
    );
    tomb.rotation.y = 0.05 * (index % 3);
  }
  const chapel = districtGroup.children.find((child) => child.userData.semanticName === 'St Anselm Chapel');
  const chapelThreshold = chapel?.userData.walkAccess?.threshold as [number, number, number] | undefined;
  const chapelRouteStart = chapel?.userData.walkAccess?.routeStart as [number, number, number] | undefined;
  if (chapelThreshold && chapelRouteStart) {
    // The former 307 m diagonal covered passage terminated in an arbitrary
    // patch of lawn. Retain a short historic porch only over the actual
    // entrance apron; its earth floor now comes from the unified path network.
    addSegment(
      details,
      definition.id,
      'ACADEMIC__COVERED_CHAPEL_ENTRANCE_PORCH',
      new THREE.Vector3().fromArray(chapelThreshold),
      new THREE.Vector3().fromArray(chapelRouteStart),
      1.05,
      0.18,
      materials.slate,
      2.35,
    );
  }

  const humanities = districtGroup.children.find((child) => child.userData.semanticName === 'Erasmus Humanities Hall');
  const library = districtGroup.children.find((child) => child.userData.semanticName === 'Cerebrum Externum');
  if (humanities && library) {
    const start = humanities.position.clone();
    const end = library.position.clone();
    const bridge = addSegment(details, definition.id, 'ACADEMIC__HUMANITIES_TO_LIBRARY_UPPER_BRIDGE', start, end, 1.2, 0.36, materials.limestone, 3.25, { walkable: true });
    bridge.userData.academicUpperBridge = true;
    for (const side of [-1, 1]) {
      const lateral = tangent.clone().multiplyScalar(side * 0.55);
      addSegment(details, definition.id, 'ACADEMIC__UPPER_BRIDGE_IRON_BALUSTRADE', start.clone().add(lateral), end.clone().add(lateral), 0.08, 0.85, materials.iron, 3.72);
    }
  }

  const residencePosition = campusPoint(hub, tangent, radial, [43, -36]);
  for (let index = 0; index < 5; index += 1) {
    const bicycle = prepare(new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 6, 16), materials.iron), definition.id);
    bicycle.name = 'ACADEMIC__RESIDENCE_BICYCLE';
    bicycle.position.copy(residencePosition).addScaledVector(tangent, -3 + index * 1.05).addScaledVector(radial, 5.8);
    bicycle.position.y = 0.36;
    bicycle.rotation.y = index * 0.12;
    details.add(bicycle);
  }
  for (let index = 0; index < 6; index += 1) {
    const laundry = addBox(details, definition.id, 'ACADEMIC__SECLUDED_RESIDENCE_LAUNDRY', [0.55, 0.28, 0.025], index % 2 ? materials.plaster : materials.leaf, [residencePosition.x - 1.4 + index * 0.58, 1.42 + (index % 2) * 0.12, residencePosition.z + 2.4]);
    laundry.rotation.y = 0.15;
  }

  const ivyPosition = campusPoint(hub, tangent, radial, [-55, -16]);
  const ivy = addBox(details, definition.id, 'ACADEMIC__SPARSE_HUMANITIES_IVY', [0.12, 2.8, 1.2], materials.moss, [ivyPosition.x, 1.4, ivyPosition.z]);
  ivy.rotation.y = 0.12;
  for (let index = 0; index < 24; index += 1) {
    const leaf = prepare(new THREE.Mesh(new THREE.CircleGeometry(0.16 + (index % 3) * 0.05, 6), materials.leaf), definition.id);
    leaf.name = 'ACADEMIC__FALLEN_LEAVES_AT_WALL';
    leaf.rotation.x = -Math.PI * 0.5;
    leaf.rotation.z = index * 0.7;
    const corner = campusPoint(hub, tangent, radial, [-9 + (index % 8) * 0.42, 13 + Math.floor(index / 8) * 0.34]);
    leaf.position.set(corner.x, 0.035, corner.z);
    details.add(leaf);
  }
  return details;
}

function addHiddenDiscoveries(
  definition: DistrictDefinition,
  hub: THREE.Vector3,
  tangent: THREE.Vector3,
  radial: THREE.Vector3,
  materials: AcademicMaterials,
) {
  const secrets = new THREE.Group();
  secrets.name = `${definition.id}__ACADEMIC_ZONE__HIDDEN_DISCOVERIES`;
  secrets.userData.academicFeatureType = 'hidden details';
  secrets.userData.discoveries = [...ACADEMIC_CAMPUS_HIDDEN_DETAILS];
  const placements: ReadonlyArray<readonly [number, number, string, THREE.Material]> = [
    [-13, 29, 'LOCKED_ARCHIVE_DOOR', materials.oak],
    [14, 11, 'BROKEN_STATUE_WITH_INSCRIPTION', materials.limestone],
    [-34, -2, 'ROOK_ALLEY_BASEMENT_LIGHT', materials.leadedGlass],
    [33, 33, 'BLOCKED_TUNNEL_ENTRANCE', materials.darkness],
    [21, -25, 'ONE_LIT_FELLOWS_OFFICE', materials.leadedGlass],
    [-40, 18, 'RAVEN_ON_PARAPET', materials.iron],
  ];
  placements.forEach(([t, r, name, material], index) => {
    const position = campusPoint(hub, tangent, radial, [t, r]);
    const detail = addBox(secrets, definition.id, `ACADEMIC__${name}`, index === 1 ? [0.8, 1.2, 0.7] : [0.62, 0.62, 0.2], material, [position.x, index === 5 ? 5.8 : 0.35, position.z], { obstacle: index < 2 });
    detail.rotation.y = index * 0.47;
    detail.userData.academicHiddenDetail = ACADEMIC_CAMPUS_HIDDEN_DETAILS[index];
  });
  return secrets;
}

type AcademicPathRole = 'main-processional' | 'entrance-apron' | 'campus-spine' | 'campus-crosswalk';

interface AcademicPathNetworkSegment {
  readonly id: string;
  readonly name: string;
  readonly role: AcademicPathRole;
  readonly start: readonly number[];
  readonly end: readonly number[];
  readonly width: number;
  readonly servesFacilities: readonly string[];
}

/** Build one deliberate circulation graph from the live doorway records. */
function createAcademicEntrancePathNetwork(
  definition: DistrictDefinition,
  districtGroup: THREE.Group,
  hub: THREE.Vector3,
  tangent: THREE.Vector3,
  radial: THREE.Vector3,
  materials: AcademicMaterials,
  processionalPaths: readonly THREE.Mesh[],
) {
  const secondaryWidth = 0.42;
  const paths: THREE.Mesh[] = [];
  const segmentMetadata: AcademicPathNetworkSegment[] = [];
  const facilities = districtGroup.children.filter(
    (child): child is THREE.Group => child instanceof THREE.Group && child.userData.academicFacility === true,
  );
  const facilitiesByName = new Map(facilities.map((building) => [String(building.userData.semanticName), building]));
  const processionalPathNames = processionalPaths.map((path) => path.name);
  const processionalSegmentMetadata: AcademicPathNetworkSegment[] = processionalPaths.map((path, index) => {
    const endpoints = path.userData.roadEndpoints as { start: readonly number[]; end: readonly number[] };
    return {
      id: `PROCESSIONAL_${String(index + 1).padStart(2, '0')}`,
      name: path.name,
      role: 'main-processional',
      start: endpoints.start,
      end: endpoints.end,
      width: Number(path.userData.pathWidthWorldUnits ?? 0.58),
      servesFacilities: ['Blackwood University Great Hall'],
    };
  });
  const servedPathNames = new Map<string, string[]>();
  const names = {
    hall: 'Blackwood University Great Hall',
    ashcroft: 'Cerebrum Externum',
    wren: 'Wren Rare Books Library',
    theoretical: 'Institute for Theoretical Sciences',
    lecture: 'Blackwood Collegiate Lecture Hall',
    archive: 'Scholars Cloister and Archive',
    chapel: 'St Anselm Chapel',
    erasmus: 'Erasmus Humanities Hall',
    observatory: 'Halley Observatory',
    faraday: 'Faraday Natural Philosophy Building',
    dining: 'Founders Dining Hall',
    marlowe: 'Marlowe Student Residences',
    service: 'North Service and Boiler Court',
    boathouse: 'Blackwater Rowing House',
  } as const;
  type FacilityKey = keyof typeof names;
  const keys = Object.keys(names) as FacilityKey[];
  const keyByName = new Map<string, FacilityKey>(keys.map((key) => [names[key], key]));
  const accessPoint = (key: FacilityKey, point: 'threshold' | 'routeStart') => {
    const value = facilitiesByName.get(names[key])?.userData.walkAccess?.[point] as [number, number, number] | undefined;
    if (!value) throw new Error(`Academic path network could not find ${point} for ${names[key]}`);
    return new THREE.Vector3().fromArray(value).setY(0);
  };
  const route = Object.fromEntries(keys.map((key) => [key, accessPoint(key, 'routeStart')])) as Record<FacilityKey, THREE.Vector3>;
  const threshold = Object.fromEntries(keys.map((key) => [key, accessPoint(key, 'threshold')])) as Record<FacilityKey, THREE.Vector3>;
  const campusCoordinates = (point: THREE.Vector3) => {
    const offset = point.clone().sub(hub);
    return { radial: offset.dot(radial), tangent: offset.dot(tangent) };
  };
  const coordinates = Object.fromEntries(keys.map((key) => [key, campusCoordinates(route[key])])) as Record<FacilityKey, { radial: number; tangent: number }>;
  const campusXZ = (radialCoordinate: number, tangentCoordinate: number) => hub.clone()
    .addScaledVector(radial, radialCoordinate)
    .addScaledVector(tangent, tangentCoordinate)
    .setY(0);
  const addNetworkPath = (
    id: string,
    start: THREE.Vector3,
    end: THREE.Vector3,
    role: AcademicPathRole,
    servesFacilities: readonly string[] = [],
  ) => {
    if (start.distanceTo(end) < 0.02) return null;
    const path = addGroundPath(
      districtGroup,
      definition.id,
      `${definition.id}__ACADEMIC_ENTRANCE_PATH__${id}`,
      start,
      end,
      secondaryWidth,
      materials.earthPath,
    );
    path.userData.localCampusRoad = true;
    path.userData.academicCampusRoad = true;
    path.userData.academicEntrancePath = true;
    path.userData.academicPathNetworkSegment = true;
    path.userData.academicPathRole = role;
    path.userData.servesFacilities = [...servesFacilities];
    path.userData.matchesProcessionalStyle = true;
    path.userData.secondaryToProcessional = true;
    path.userData.pathWidthWorldUnits = secondaryWidth;
    paths.push(path);
    servesFacilities.forEach((facilityName) => {
      const current = servedPathNames.get(facilityName) ?? [];
      current.push(path.name);
      servedPathNames.set(facilityName, current);
    });
    segmentMetadata.push({
      id,
      name: path.name,
      role,
      start: start.toArray(),
      end: end.toArray(),
      width: secondaryWidth,
      servesFacilities: [...servesFacilities],
    });
    return path;
  };

  // These aprons eliminate the former 27-31 m gap between each route marker
  // and the real doorway. Great Hall keeps its four stone entrance steps.
  keys.filter((key) => key !== 'hall').forEach((key) => addNetworkPath(
    `APRON_${key.toUpperCase()}`,
    threshold[key],
    route[key],
    'entrance-apron',
    [names[key]],
  ));

  // West Service Walk and the connected Library Walk.
  const westSpineRadial = -28;
  const librarySpineRadial = -5.5;
  const westService = campusXZ(westSpineRadial, coordinates.service.tangent);
  const westErasmus = campusXZ(westSpineRadial, coordinates.erasmus.tangent);
  const westMarlowe = campusXZ(westSpineRadial, coordinates.marlowe.tangent);
  const libraryErasmus = campusXZ(librarySpineRadial, coordinates.erasmus.tangent);
  const libraryAshcroft = campusXZ(librarySpineRadial, coordinates.ashcroft.tangent);
  const libraryWren = campusXZ(librarySpineRadial, coordinates.wren.tangent);
  addNetworkPath('WEST_SERVICE_SPINE_SOUTH', westService, westErasmus, 'campus-spine', [names.service]);
  addNetworkPath('WEST_SERVICE_SPINE_NORTH', westErasmus, westMarlowe, 'campus-spine', [names.marlowe]);
  addNetworkPath('SERVICE_BRANCH', route.service, westService, 'campus-crosswalk', [names.service]);
  addNetworkPath('MARLOWE_BRANCH', route.marlowe, westMarlowe, 'campus-crosswalk', [names.marlowe]);
  addNetworkPath('ERASMUS_WEST_CROSSWALK', westErasmus, route.erasmus, 'campus-crosswalk', [names.erasmus]);
  addNetworkPath('ERASMUS_LIBRARY_CROSSWALK', route.erasmus, libraryErasmus, 'campus-crosswalk', [names.erasmus]);
  addNetworkPath('LIBRARY_SPINE_SOUTH', libraryErasmus, libraryAshcroft, 'campus-spine', [names.ashcroft]);
  addNetworkPath('LIBRARY_SPINE_NORTH', libraryAshcroft, libraryWren, 'campus-spine', [names.wren]);
  addNetworkPath('ASHCROFT_BRANCH', route.ashcroft, libraryAshcroft, 'campus-crosswalk', [names.ashcroft]);
  addNetworkPath('WREN_BRANCH', route.wren, libraryWren, 'campus-crosswalk', [names.wren]);

  // Science Walk uses a small dogleg to clear the Theoretical Sciences block.
  const southScienceRadial = 3.8;
  const northScienceRadial = 5.5;
  const scienceDoglegTangent = -17;
  const chapelScience = campusXZ(southScienceRadial, coordinates.chapel.tangent);
  const theoreticalScience = campusXZ(southScienceRadial, coordinates.theoretical.tangent);
  const scienceDoglegWest = campusXZ(southScienceRadial, scienceDoglegTangent);
  const scienceDoglegEast = campusXZ(northScienceRadial, scienceDoglegTangent);
  const scienceTransverse = campusXZ(northScienceRadial, -8.3);
  const scienceQuadrangle = campusXZ(northScienceRadial, 6.5);
  const scienceLecture = campusXZ(northScienceRadial, coordinates.lecture.tangent);
  const scienceObservatory = campusXZ(northScienceRadial, coordinates.observatory.tangent);
  const scienceFaraday = campusXZ(northScienceRadial, coordinates.faraday.tangent);
  addNetworkPath('SOUTH_SCIENCE_SPINE_CHAPEL', chapelScience, theoreticalScience, 'campus-spine', [names.chapel]);
  addNetworkPath('SOUTH_SCIENCE_SPINE_THEORETICAL', theoreticalScience, scienceDoglegWest, 'campus-spine', [names.theoretical]);
  addNetworkPath('SCIENCE_DOGLEG', scienceDoglegWest, scienceDoglegEast, 'campus-crosswalk');
  addNetworkPath('NORTH_SCIENCE_SPINE_SOUTH', scienceDoglegEast, scienceTransverse, 'campus-spine');
  addNetworkPath('NORTH_SCIENCE_SPINE_QUADRANGLE', scienceTransverse, scienceQuadrangle, 'campus-spine');
  addNetworkPath('NORTH_SCIENCE_SPINE_LECTURE', scienceQuadrangle, scienceLecture, 'campus-spine', [names.lecture]);
  addNetworkPath('NORTH_SCIENCE_SPINE_OBSERVATORY', scienceLecture, scienceObservatory, 'campus-spine', [names.observatory]);
  addNetworkPath('NORTH_SCIENCE_SPINE_FARADAY', scienceObservatory, scienceFaraday, 'campus-spine', [names.observatory, names.faraday]);
  addNetworkPath('CHAPEL_BRANCH', route.chapel, chapelScience, 'campus-crosswalk', [names.chapel]);
  addNetworkPath('THEORETICAL_BRANCH', route.theoretical, theoreticalScience, 'campus-crosswalk', [names.theoretical]);
  addNetworkPath('LECTURE_BRANCH', route.lecture, scienceLecture, 'campus-crosswalk', [names.lecture]);
  addNetworkPath('OBSERVATORY_BRANCH', route.observatory, scienceObservatory, 'campus-crosswalk', [names.observatory]);
  addNetworkPath('FARADAY_BRANCH', route.faraday, scienceFaraday, 'campus-crosswalk', [names.faraday]);

  // South Transverse Walk joins Library Walk, Science Walk, and Dining Hall.
  const transverseLibrary = campusXZ(librarySpineRadial, -8.3);
  const diningTurnRadial = 27;
  const transverseDining = campusXZ(diningTurnRadial, -8.3);
  const diningTurn = campusXZ(diningTurnRadial, coordinates.dining.tangent);
  addNetworkPath('SOUTH_TRANSVERSE_LIBRARY_TO_SCIENCE', transverseLibrary, scienceTransverse, 'campus-crosswalk');
  addNetworkPath('SOUTH_TRANSVERSE_SCIENCE_TO_DINING', scienceTransverse, transverseDining, 'campus-crosswalk', [names.dining]);
  addNetworkPath('DINING_TURN', transverseDining, diningTurn, 'campus-crosswalk', [names.dining]);
  addNetworkPath('DINING_BRANCH', diningTurn, route.dining, 'campus-crosswalk', [names.dining]);

  // East Canal Walk keeps the veteran-oak dogleg, then follows one legible
  // archive approach through the former memorial court. The monumental Well
  // now occupies the photographed western court, so the old two-leg fountain
  // detour would read as an arbitrary path kink here.
  const quadrangleTurn = campusXZ(10, 6.5);
  const oakDogleg = campusXZ(10, 9);
  const archiveEastWalk = campusXZ(12, 9);
  const archiveTurn = campusXZ(12, coordinates.archive.tangent);
  const boathouseEastWalk = campusXZ(coordinates.boathouse.radial, 9);
  addNetworkPath('QUADRANGLE_EDGE', scienceQuadrangle, quadrangleTurn, 'campus-crosswalk');
  addNetworkPath('VETERAN_OAK_DOGLEG', quadrangleTurn, oakDogleg, 'campus-crosswalk');
  addNetworkPath('EAST_CANAL_WALK_ARCHIVE', oakDogleg, archiveEastWalk, 'campus-spine', [names.archive]);
  addNetworkPath('EAST_CANAL_WALK_BOATHOUSE', archiveEastWalk, boathouseEastWalk, 'campus-spine', [names.boathouse]);
  addNetworkPath('ARCHIVE_TURN', archiveEastWalk, archiveTurn, 'campus-crosswalk', [names.archive]);
  addNetworkPath('ARCHIVE_BRANCH', archiveTurn, route.archive, 'campus-crosswalk', [names.archive]);
  addNetworkPath('BOATHOUSE_BRANCH', boathouseEastWalk, route.boathouse, 'campus-crosswalk', [names.boathouse]);

  facilities.forEach((building) => {
    const facilityName = String(building.userData.semanticName);
    const key = keyByName.get(facilityName);
    if (!key) return;
    const isGreatHall = key === 'hall';
    building.userData.academicPathConnection = {
      connected: true,
      endpoint: (isGreatHall ? route.hall : threshold[key]).toArray(),
      endpointType: isGreatHall ? 'processional stair foot' : 'doorway threshold',
      pathNames: isGreatHall
        ? processionalPathNames
        : servedPathNames.get(facilityName) ?? [],
      secondaryWidth,
    };
  });
  districtGroup.userData.academicPathNetwork = {
    authoredFromLiveEntrances: true,
    entranceCount: facilities.length,
    connectedEntranceCount: facilities.length,
    mainPathName: `${definition.id}__ACADEMIC_PROCESSIONAL_ROAD`,
    mainPathNames: processionalPathNames,
    mainSegmentCount: processionalPaths.length,
    mainWidth: 0.58,
    secondaryWidth,
    surfaceMaterial: materials.earthPath.name,
    groundTop: 0.006,
    namedWalks: ['Processional Avenue', 'West Service Walk', 'Library Walk', 'Science Walk', 'South Transverse Walk', 'East Canal Walk'],
    segmentCount: paths.length + processionalPaths.length,
    secondarySegmentCount: paths.length,
    segments: [...processionalSegmentMetadata, ...segmentMetadata],
    removedLegacySpokes: 5,
    removedDisconnectedStubs: 16,
    removedDecorativeCrossStrips: 12,
    removedDiagonalChapelPath: true,
    allTerminalsAreEntrancesOrJunctions: true,
  };
  return paths;
}

/**
 * Adds district-scale zones around the original six-building academic core.
 * Repeated windows, vegetation, columns, and paving share geometry/materials;
 * semantic roots remain separate so navigation, interaction, and export stay editable.
 */
export function buildAcademicDistrictExtension(
  definition: DistrictDefinition,
  districtGroup: THREE.Group,
  hub: THREE.Vector3,
  tangent: THREE.Vector3,
  radial: THREE.Vector3,
): AcademicDistrictBuildResult {
  const materials = createMaterials();
  const facilities: THREE.Group[] = [];
  const features: THREE.Object3D[] = [];
  const localRoads: THREE.Mesh[] = [];
  const extensionRecords = ACADEMIC_CAMPUS_BUILDINGS.filter((record) => !record.existing);

  extensionRecords.forEach((record) => {
    const position = campusPoint(hub, tangent, radial, record.location);
    const building = createBuilding(definition, record, position, facingYaw(position, hub), materials);
    districtGroup.add(building);
    facilities.push(building);
  });

  const primaryHall = districtGroup.children.find((child) => child.userData.academicPrimary === true);
  const primaryRouteStart = primaryHall?.userData.walkAccess?.routeStart as [number, number, number] | undefined;
  const processionalStart = campusPoint(hub, tangent, radial, [0, -54]);
  const processionalEnd = primaryRouteStart
    ? new THREE.Vector3().fromArray(primaryRouteStart)
    : campusPoint(hub, tangent, radial, [0, -5]);
  const processionalBaseName = `${definition.id}__ACADEMIC_PROCESSIONAL_ROAD`;
  const fountainCourt = districtGroup.children.find(
    (child) => child.userData.semanticName === ACADEMIC_FOUNTAIN_COURT_NAME,
  );
  const processionalDirection = processionalEnd.clone().sub(processionalStart).setY(0).normalize();
  const courtCenter = fountainCourt?.position.clone().setY(0);
  const courtProjection = courtCenter
    ? THREE.MathUtils.clamp(
      courtCenter.clone().sub(processionalStart).dot(processionalDirection),
      0,
      processionalStart.distanceTo(processionalEnd),
    )
    : 0;
  const projectedCourtCenter = processionalStart.clone().addScaledVector(processionalDirection, courtProjection);
  const courtOffsetFromAxis = courtCenter?.distanceTo(projectedCourtCenter) ?? Number.POSITIVE_INFINITY;
  const courtLiesOnRoute = Boolean(courtCenter)
    && courtProjection > 3.2
    && courtProjection < processionalStart.distanceTo(processionalEnd) - 3.2
    && courtOffsetFromAxis < 1.6;
  const processionalWaypoints = [processionalStart];

  if (courtCenter && courtLiesOnRoute) {
    // The Well occupies the old straight ceremonial axis. A broad, symmetric
    // crescent preserves that axis at both approaches while keeping the
    // 5.8-metre avenue outside the monument's complete basin footprint.
    const bypassNormal = new THREE.Vector3(-processionalDirection.z, 0, processionalDirection.x);
    if (bypassNormal.dot(tangent) < 0) bypassNormal.negate();
    processionalWaypoints.push(
      projectedCourtCenter.clone().addScaledVector(processionalDirection, -2.3),
      courtCenter.clone().addScaledVector(processionalDirection, -1.2).addScaledVector(bypassNormal, 2.25),
      courtCenter.clone().addScaledVector(processionalDirection, 1.2).addScaledVector(bypassNormal, 2.25),
      projectedCourtCenter.clone().addScaledVector(processionalDirection, 2.3),
    );
  }
  processionalWaypoints.push(processionalEnd);

  const processionalPaths = processionalWaypoints.slice(0, -1).map((start, index) => {
    const path = addGroundPath(
      districtGroup,
      definition.id,
      index === 0 ? processionalBaseName : `${processionalBaseName}__SEGMENT_${String(index + 1).padStart(2, '0')}`,
      start,
      processionalWaypoints[index + 1],
      0.58,
      materials.earthPath,
    );
    path.userData.localCampusRoad = true;
    path.userData.academicCampusRoad = true;
    path.userData.academicEntrancePath = true;
    path.userData.academicPathNetworkSegment = true;
    path.userData.academicPathRole = 'main-processional';
    path.userData.pathWidthWorldUnits = 0.58;
    path.userData.processionalSegmentIndex = index;
    path.userData.processionalSegmentCount = processionalWaypoints.length - 1;
    path.userData.processionalFountainBypass = courtLiesOnRoute;
    path.userData.servesFacility = 'Blackwood University Great Hall';
    path.userData.servesFacilities = ['Blackwood University Great Hall'];
    return path;
  });
  localRoads.push(...processionalPaths);

  const entrancePaths = createAcademicEntrancePathNetwork(
    definition,
    districtGroup,
    hub,
    tangent,
    radial,
    materials,
    processionalPaths,
  );
  localRoads.push(...entrancePaths);
  const leafLitter = createPathLeafLitter(definition, localRoads, materials);
  districtGroup.add(leafLitter);
  features.push(leafLitter);

  const mainGate = createMainGate(definition, hub, tangent, radial, materials);
  const gothicBoundary = createCollegiateGothicBoundary(definition, hub, tangent, radial, materials);
  const vintageBenches = createVintageCampusBenches(definition, districtGroup, hub, tangent, radial, materials);
  const academicTrees = buildAcademicTreeSystem(hub, vintageBenches.userData.benchAnchors);
  academicTrees.traverse((object) => {
    object.userData.districtId = definition.id;
  });
  const canalEdge = createCanalEdge(definition, hub, tangent, radial, materials);
  districtGroup.userData.academicCanal = canalEdge.userData.academicCanal;
  districtGroup.userData.academicGateOpen = true;
  districtGroup.userData.academicGateLightPhase = 'day';
  mainGate.traverse((object) => {
    if (object.userData.academicGateLeaf === true) object.rotation.y = Number(object.userData.openYaw);
    if (object.userData.academicGateCollider === true) object.userData.navObstacle = false;
  });

  [
    mainGate,
    gothicBoundary,
    createCentralQuadrangle(definition, hub, tangent, radial, materials),
    createProfessorsGarden(definition, hub, tangent, radial, materials),
    canalEdge,
    createScienceCourtInstruments(definition, hub, tangent, radial, materials),
    createServiceDetails(definition, hub, tangent, radial, materials),
    createCampusConnectorsAndTraces(definition, districtGroup, hub, tangent, radial, materials),
    vintageBenches,
    academicTrees,
    addHiddenDiscoveries(definition, hub, tangent, radial, materials),
  ].forEach((feature) => {
    districtGroup.add(feature);
    features.push(feature);
  });

  districtGroup.userData.academicMaterialsProcedural = [
    'weathered limestone', 'dark slate', 'old oak', 'tarnished brass', 'oxidized copper',
    'wet cobblestone', 'leaf-strewn earth path', 'leaded glass', 'iron', 'moss', 'aged plaster',
  ];
  districtGroup.userData.academicComponentHierarchy = {
    entrance: ['gatehouses', 'porter lodge', 'wrought-iron leaves', 'notice board', 'processional road'],
    quadrangles: ['central lawn', 'cloisters', 'statue', 'reading gardens', 'second court'],
    scholarship: ['grand library', 'rare books', 'humanities', 'theoretical sciences', 'archive'],
    ceremonial: ['great hall and clock tower', 'chapel nave', 'dining hall'],
    science: ['observatory', 'Victorian physics building', 'instrument court'],
    residential: ['Marlowe residence ranges', 'small courts', 'bicycle and laundry traces'],
    arboretum: ['15 historic species', 'veteran defects', 'asynchronous species wind', 'near/mid/far LOD', 'wet autumn leaf collections'],
    landscape: ['professors garden', 'clipped yew hedges', 'graveyard', 'canal edge', 'reeds and mist', 'vintage park benches', 'historic arboretum'],
    boundary: ['carved stone piers', 'wrought-iron railings', 'pointed arches', 'quatrefoils', 'botanical ironwork', 'biodome garden gates', 'coastal railway gate'],
    service: ['boiler court', 'delivery alleys', 'coal doors', 'maintenance sheds'],
  };
  districtGroup.userData.academicOptimization = {
    sharedProceduralMaterials: true,
    sharedGeometry: true,
    instancingTargets: ['windows', 'cloister columns', 'Gothic fence bays', 'reeds', 'lamps', 'vintage benches', 'tree structural kits', 'tree crown lobes', 'wet fallen leaves'],
    arboretumLod: ['near veteran detail', 'mid silhouettes', 'far district canopy'],
    shadowCastingLights: 0,
    staticBakedLook: 'emissive windows and lantern pools replace per-window lights',
    navigation: 'precise wall and fence segments with explicit gate gaps; decorative detail is non-colliding unless needed',
  };
  districtGroup.userData.academicTreePopulation = academicTrees.userData.academicTreePopulation;
  districtGroup.userData.academicBoundary = gothicBoundary.userData;
  return { facilities, features, localRoads };
}

const ASHCROFT_INSCRIPTION_SURFACE = 'ACADEMIC__ASHCROFT_EDITABLE_DOOR_INSCRIPTION';

interface AshcroftReferenceMaterials {
  weatheredAshlar: THREE.MeshStandardMaterial;
  repairedAshlar: THREE.MeshStandardMaterial;
  wetPlinth: THREE.MeshStandardMaterial;
  slate: THREE.MeshStandardMaterial;
  oak: THREE.MeshStandardMaterial;
  tracery: THREE.MeshStandardMaterial;
  copper: THREE.MeshStandardMaterial;
  amberGlass: THREE.MeshStandardMaterial;
}

function createAshcroftReferenceMaterials(): AshcroftReferenceMaterials {
  const ashlar = getAcademicAshlarTextures('medieval');
  const repair = getAcademicAshlarTextures('repair');
  const slate = getAcademicSlateTextures();
  const oak = getAcademicOakTextures();
  const weatheredAshlar = new THREE.MeshStandardMaterial({
    color: '#817568', map: ashlar.albedo, bumpMap: ashlar.height, bumpScale: 0.048,
    roughness: 0.94, metalness: 0,
  });
  const repairedAshlar = new THREE.MeshStandardMaterial({
    color: '#a69783', map: repair.albedo, bumpMap: repair.height, bumpScale: 0.033,
    roughness: 0.91, metalness: 0,
  });
  const wetPlinth = new THREE.MeshStandardMaterial({
    color: '#4d4842', map: ashlar.albedo, bumpMap: ashlar.height, bumpScale: 0.055,
    roughness: 0.62, metalness: 0.02,
  });
  const slateMaterial = new THREE.MeshStandardMaterial({
    color: '#3c474d', map: slate.albedo, bumpMap: slate.height, bumpScale: 0.045,
    roughness: 0.88, metalness: 0.03,
  });
  const oakMaterial = new THREE.MeshStandardMaterial({
    color: '#38241b', map: oak.albedo, bumpMap: oak.height, bumpScale: 0.028,
    roughness: 0.85, metalness: 0,
  });
  const tracery = new THREE.MeshStandardMaterial({ color: '#171817', roughness: 0.72, metalness: 0.32 });
  const copper = new THREE.MeshStandardMaterial({ color: '#356a62', roughness: 0.68, metalness: 0.7 });
  const amberGlass = new THREE.MeshStandardMaterial({
    color: '#3d1a0b', emissive: '#ff5908', emissiveIntensity: 0.035,
    roughness: 0.24, metalness: 0.08, transparent: true, opacity: 0.92,
  });
  weatheredAshlar.name = 'Ashcroft rain-darkened honey ashlar';
  repairedAshlar.name = 'Ashcroft carved repair stone';
  wetPlinth.name = 'Ashcroft wet lower courses';
  slateMaterial.name = 'Ashcroft charcoal blue slate';
  oakMaterial.name = 'Ashcroft dark carved oak';
  tracery.name = 'Ashcroft black lead tracery';
  copper.name = 'Ashcroft oxidized copper gutters';
  amberGlass.name = 'Ashcroft automatic amber night glass';
  Object.values({ weatheredAshlar, repairedAshlar, wetPlinth, slateMaterial, oakMaterial, tracery, copper, amberGlass })
    .forEach((material) => { material.userData.excludeSeasonFoliage = true; });
  // Preserve the existing object-editor accent contract after replacing the
  // generic academic facade materials with the bespoke reference palette.
  // Accent edits intentionally recolor the library's leaded/illuminated glass.
  amberGlass.userData.isDistrictAccent = true;
  amberGlass.userData.academicNightEmissiveIntensity = 2.2;
  return {
    weatheredAshlar,
    repairedAshlar,
    wetPlinth,
    slate: slateMaterial,
    oak: oakMaterial,
    tracery,
    copper,
    amberGlass,
  };
}

function createLancetGeometry(width: number, height: number) {
  const shoulderY = height * 0.72;
  const shape = new THREE.Shape();
  shape.moveTo(-width * 0.5, 0);
  shape.lineTo(width * 0.5, 0);
  shape.lineTo(width * 0.5, shoulderY);
  shape.quadraticCurveTo(width * 0.46, height * 0.9, 0, height);
  shape.quadraticCurveTo(-width * 0.46, height * 0.9, -width * 0.5, shoulderY);
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 12);
}

function addLancetWindow(
  parent: THREE.Object3D,
  districtId: string,
  x: number,
  bottomY: number,
  z: number,
  width: number,
  height: number,
  materials: AshcroftReferenceMaterials,
) {
  const frame = prepare(new THREE.Mesh(createLancetGeometry(width + 0.3, height + 0.28), materials.repairedAshlar), districtId, 'Ashcroft lancet frame');
  frame.name = 'ACADEMIC__ASHCROFT_CARVED_LANCET_FRAME';
  frame.position.set(x, bottomY - 0.13, z);
  parent.add(frame);

  const glass = prepare(new THREE.Mesh(createLancetGeometry(width, height), materials.amberGlass), districtId, 'Ashcroft amber reading-room window');
  glass.name = 'ACADEMIC__ASHCROFT_TRACERIED_AMBER_WINDOW';
  glass.position.set(x, bottomY, z + 0.014);
  glass.userData.academicReadingLights = true;
  glass.userData.academicNightOrangeLight = true;
  glass.userData.academicNightEmissiveIntensity = 2.2;
  parent.add(glass);

  for (const mullionX of [-width * 0.24, 0, width * 0.24]) {
    addBox(parent, districtId, 'ACADEMIC__ASHCROFT_LEAD_MULLION', [0.035, height * 0.73, 0.026], materials.tracery, [x + mullionX, bottomY + height * 0.365, z + 0.035]);
  }
  addBox(parent, districtId, 'ACADEMIC__ASHCROFT_LEAD_TRANSOM', [width * 0.9, 0.035, 0.026], materials.tracery, [x, bottomY + height * 0.46, z + 0.035]);
  const rose = prepare(new THREE.Mesh(new THREE.TorusGeometry(width * 0.17, 0.025, 6, 18), materials.tracery), districtId, 'Ashcroft tracery rose');
  rose.name = 'ACADEMIC__ASHCROFT_WINDOW_ROSE_TRACERY';
  rose.position.set(x, bottomY + height * 0.76, z + 0.04);
  parent.add(rose);
}

function addPointedPortalFrame(
  parent: THREE.Object3D,
  districtId: string,
  width: number,
  height: number,
  bottomY: number,
  z: number,
  radius: number,
  material: THREE.Material,
) {
  const points = [
    new THREE.Vector3(-width * 0.5, 0, 0),
    new THREE.Vector3(-width * 0.5, height * 0.62, 0),
    new THREE.Vector3(-width * 0.42, height * 0.78, 0),
    new THREE.Vector3(0, height, 0),
    new THREE.Vector3(width * 0.42, height * 0.78, 0),
    new THREE.Vector3(width * 0.5, height * 0.62, 0),
    new THREE.Vector3(width * 0.5, 0, 0),
  ];
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.2);
  const frame = prepare(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, radius, 7, false), material), districtId, 'Ashcroft recessed portal archivolt');
  frame.name = 'ACADEMIC__ASHCROFT_RECESSED_POINTED_PORTAL';
  frame.position.set(0, bottomY, z);
  parent.add(frame);
}

function makeAshcroftInscriptionTexture(text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 192;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = '#a69783';
  context.fillRect(0, 0, canvas.width, canvas.height);
  let seed = 1512;
  for (let index = 0; index < 950; index += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const x = seed % canvas.width;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const y = seed % canvas.height;
    context.fillStyle = index % 4 === 0 ? 'rgba(55,45,37,.12)' : 'rgba(230,217,194,.11)';
    context.fillRect(x, y, 1 + (seed % 4), 1);
  }
  context.strokeStyle = 'rgba(62,48,37,.58)';
  context.lineWidth = 6;
  context.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
  const inscription = text.toLocaleUpperCase();
  let fontSize = 76;
  context.font = `600 ${fontSize}px Georgia, 'Times New Roman', serif`;
  while (fontSize > 36 && context.measureText(inscription).width > canvas.width - 92) {
    fontSize -= 3;
    context.font = `600 ${fontSize}px Georgia, 'Times New Roman', serif`;
  }
  context.fillStyle = '#342920';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(inscription, canvas.width * 0.5, canvas.height * 0.52, canvas.width - 82);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function updateAcademicBuildingInscription(building: THREE.Object3D, value: string) {
  const inscription = value.trim().slice(0, 96);
  building.userData.academicInscription = inscription;
  building.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object.userData.academicInscriptionSurface !== true) return;
    const material = Array.isArray(object.material) ? object.material[0] : object.material;
    if (!(material instanceof THREE.MeshStandardMaterial)) return;
    material.map?.dispose();
    material.map = makeAshcroftInscriptionTexture(inscription);
    material.needsUpdate = true;
    object.userData.academicInscription = inscription;
  });
  return inscription;
}

function buildAshcroftReferenceFacade(
  building: THREE.Group,
  districtId: string,
  width: number,
  depth: number,
  inscription: string,
) {
  const materials = createAshcroftReferenceMaterials();
  const frontZ = depth * 0.5;

  building.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (/MASONRY_WALL|BRICK_CHIMNEYS|COLLEGIATE_TOWER/.test(object.name)) object.material = materials.weatheredAshlar;
    if (/STEEP_SLATE_GABLE|TOWER_SLATE_CAP/.test(object.name)) object.material = materials.slate;
    if (/LIMESTONE_STRING_COURSE|DOOR_LINTEL|GOTHIC_BUTTRESSES/.test(object.name)) object.material = materials.repairedAshlar;
    if (/OPEN_OAK_DOOR/.test(object.name)) object.material = materials.oak;
    if (object.name.includes('LEADED_AMBER_WINDOWS')) {
      object.material = materials.amberGlass;
      object.userData.academicReadingLights = true;
      object.userData.academicNightOrangeLight = true;
      object.userData.academicNightEmissiveIntensity = 2.2;
    }
  });

  const facade = new THREE.Group();
  facade.name = 'ACADEMIC__ASHCROFT_REFERENCE_GOTHIC_FACADE';
  facade.userData.academicReferenceFacade = true;
  facade.userData.referenceImages = ['Oxford Gothic library daylight', 'Oxford Gothic library amber night'];
  building.add(facade);

  addBox(facade, districtId, 'ACADEMIC__ASHCROFT_WET_ASHLAR_PLINTH', [width + 0.26, 0.62, 0.24], materials.wetPlinth, [0, 0.31, frontZ + 0.01]);
  addBox(facade, districtId, 'ACADEMIC__ASHCROFT_COPPER_GUTTER', [width + 0.68, 0.08, 0.11], materials.copper, [0, 4.69, frontZ + 0.06]);

  for (const x of [-4.45, -2.75, 2.75, 4.45]) {
    addLancetWindow(facade, districtId, x, 1.34, frontZ + 0.105, 1.12, 2.52, materials);
  }

  for (const x of [-5.2, -2, 2, 5.2]) {
    addBox(facade, districtId, 'ACADEMIC__ASHCROFT_DEEP_FRONT_BUTTRESS', [0.42, 3.9, 0.62], materials.weatheredAshlar, [x, 1.95, frontZ + 0.26]);
    addBox(facade, districtId, 'ACADEMIC__ASHCROFT_BUTTRESS_REPAIR_BAND', [0.5, 0.18, 0.7], materials.repairedAshlar, [x, 1.35, frontZ + 0.27]);
    const pinnacle = prepare(new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.05, 6), materials.repairedAshlar), districtId, 'Ashcroft carved pinnacle');
    pinnacle.name = 'ACADEMIC__ASHCROFT_BUTTRESS_PINNACLE';
    pinnacle.position.set(x, 4.43, frontZ + 0.26);
    facade.add(pinnacle);
  }

  for (let index = 0; index < 13; index += 1) {
    const x = THREE.MathUtils.lerp(-width * 0.46, width * 0.46, index / 12);
    if (Math.abs(x) < 0.95) continue;
    addBox(facade, districtId, 'ACADEMIC__ASHCROFT_CRENELLATED_EAVE', [0.42, index % 2 === 0 ? 0.42 : 0.24, 0.34], materials.weatheredAshlar, [x, 4.86 + (index % 2 === 0 ? 0.09 : 0), frontZ + 0.055]);
  }

  for (const side of [-1, 1]) {
    const turretX = side * (width * 0.5 - 0.34);
    const shaft = prepare(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.78, 6.15, 8), materials.weatheredAshlar), districtId, 'Ashcroft corner stair turret');
    shaft.name = 'ACADEMIC__ASHCROFT_OCTAGONAL_STAIR_TURRET';
    shaft.position.set(turretX, 3.08, frontZ - 0.1);
    facade.add(shaft);
    for (const y of [1.12, 3.16, 5.18]) {
      const band = prepare(new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.13, 8), materials.repairedAshlar), districtId, 'Ashcroft turret string course');
      band.name = 'ACADEMIC__ASHCROFT_TURRET_STONE_BAND';
      band.position.set(turretX, y, frontZ - 0.1);
      facade.add(band);
    }
    const spire = prepare(new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.35, 8), materials.slate), districtId, 'Ashcroft turret slate spire');
    spire.name = 'ACADEMIC__ASHCROFT_CROCKETED_TURRET_SPIRE';
    spire.position.set(turretX, 7.3, frontZ - 0.1);
    facade.add(spire);
    const finial = prepare(new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.62, 6), materials.repairedAshlar), districtId, 'Ashcroft spire finial');
    finial.name = 'ACADEMIC__ASHCROFT_SPIRE_FINIAL';
    finial.position.set(turretX, 8.78, frontZ - 0.1);
    facade.add(finial);
  }

  const portalShadow = prepare(new THREE.Mesh(createLancetGeometry(2.18, 2.76), new THREE.MeshBasicMaterial({ color: '#090705' })), districtId, 'Ashcroft portal shadow');
  portalShadow.name = 'ACADEMIC__ASHCROFT_DEEP_PORTAL_SHADOW';
  portalShadow.position.set(0, 0.08, frontZ + 0.12);
  facade.add(portalShadow);
  addPointedPortalFrame(facade, districtId, 2.42, 2.95, 0.02, frontZ + 0.19, 0.12, materials.weatheredAshlar);
  addPointedPortalFrame(facade, districtId, 2.09, 2.68, 0.08, frontZ + 0.215, 0.075, materials.repairedAshlar);
  addPointedPortalFrame(facade, districtId, 1.78, 2.4, 0.13, frontZ + 0.24, 0.045, materials.tracery);
  addBox(facade, districtId, 'ACADEMIC__ASHCROFT_CARVED_OAK_LEFT_DOOR', [0.63, 1.72, 0.08], materials.oak, [-0.35, 0.88, frontZ + 0.265]);
  addBox(facade, districtId, 'ACADEMIC__ASHCROFT_CARVED_OAK_RIGHT_DOOR', [0.63, 1.72, 0.08], materials.oak, [0.35, 0.88, frontZ + 0.265]);
  for (const x of [-0.42, -0.18, 0.18, 0.42]) {
    const doorGlow = addBox(facade, districtId, 'ACADEMIC__ASHCROFT_AMBER_DOOR_LIGHT', [0.06, 0.94, 0.028], materials.amberGlass, [x, 0.92, frontZ + 0.312]);
    doorGlow.userData.academicReadingLights = true;
    doorGlow.userData.academicNightOrangeLight = true;
    doorGlow.userData.academicNightEmissiveIntensity = 2.35;
  }

  const inscriptionMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff', map: makeAshcroftInscriptionTexture(inscription), roughness: 0.88, metalness: 0,
  });
  inscriptionMaterial.name = 'Ashcroft editable carved inscription';
  inscriptionMaterial.userData.excludeSeasonFoliage = true;
  const inscriptionSurface = prepare(new THREE.Mesh(new THREE.PlaneGeometry(3.45, 0.44), inscriptionMaterial), districtId, 'Ashcroft editable inscription');
  inscriptionSurface.name = ASHCROFT_INSCRIPTION_SURFACE;
  inscriptionSurface.position.set(0, 3.18, frontZ + 0.322);
  inscriptionSurface.userData.academicInscriptionSurface = true;
  inscriptionSurface.userData.academicInscription = inscription;
  facade.add(inscriptionSurface);

  for (const [index, x] of [-3.55, 0, 3.55].entries()) {
    const light = new THREE.PointLight('#ff7a18', 0, index === 1 ? 8.5 : 6.5, 2.05);
    light.name = index === 1 ? 'ACADEMIC__ASHCROFT_ORANGE_ENTRANCE_LIGHT' : 'ACADEMIC__ASHCROFT_ORANGE_READING_LIGHT';
    light.position.set(x, index === 1 ? 1.38 : 2.45, frontZ + (index === 1 ? 0.85 : 0.18));
    light.visible = false;
    light.userData.academicNightOrangeLight = true;
    light.userData.academicNightLightIntensity = index === 1 ? 1.15 : 0.72;
    facade.add(light);
  }

  building.userData.academicInscription = inscription;
  building.userData.ashcroftReferenceStyle = {
    inspiration: 'weathered Oxford collegiate Gothic library in rain',
    palette: {
      ashlar: '#817568', repairedStone: '#a69783', wetPlinth: '#4d4842',
      slate: '#3c474d', oxidizedCopper: '#356a62', oak: '#38241b', nightAmber: '#ff5908',
    },
    elements: ['broad steep slate roof', 'crenellated eaves', 'octagonal stair turrets', 'crocketed spires', 'deep front buttresses', 'traceried lancet bays', 'recessed pointed portal', 'editable carved inscription'],
    lancetWindowCount: 4,
    automaticNightLighting: true,
  };
}

export function enrichExistingAcademicBuildings(buildings: readonly THREE.Group[], districtId: string) {
  const materials = createMaterials();
  buildings.forEach((building) => {
    const name = String(building.userData.semanticName ?? '');
    const record = academicCampusBuildingByName.get(name);
    if (!record) return;
    building.userData.academicBuildingData = { ...record };
    building.userData.foundingDate = record.founded;
    building.userData.editableHistory = record.history;
    if (record.kind === 'library') {
      building.traverse((object) => {
        if (object instanceof THREE.Mesh && object.name.includes('LEADED_AMBER_WINDOWS')) {
          object.userData.academicReadingLights = true;
        }
      });
    }
    const [width, depth] = (building.userData.footprint ?? record.footprint) as [number, number];
    if (record.id === 'ashcroft-grand-library') {
      buildAshcroftReferenceFacade(building, districtId, width, depth, record.inscription ?? 'CEREBRUM EXTERNUM · FOUNDED MDXII');
      // IslandWorld mounts this expensive authored interior as a streamed
      // package near the entrance instead of constructing it during boot.
      building.userData.cerebrumStreamingConfig = {
        selectableId: academicBuildingSelectableId(record.id),
        width: Math.max(10.8, width - 0.8),
        depth: Math.max(7.2, depth - 0.7),
        quality: 'medium',
        muted: true,
        hideLegacyShell: true,
        preloadDistanceMetres: 60,
        unloadDistanceMetres: 90,
        retentionSeconds: 15,
      };
    }
    const plaque = addBox(building, districtId, `${record.id}__CONFIGURED_BRASS_PLAQUE`, [0.66, 0.3, 0.035], materials.brass, [width * 0.12, 0.68, depth * 0.5 + 0.035]);
    plaque.userData.academicHotspot = record.id;
    if (record.interior && record.id !== 'ashcroft-grand-library') {
      addInterior(building, { ...record, footprint: [width, depth] }, materials, districtId);
    }

    if (record.id === 'blackwood-great-hall') {
      const clockTower = addBox(building, districtId, 'ACADEMIC__PRIMARY_CLOCK_TOWER', [2.8, 7.8, 2.8], materials.limestone, [0, 3.9, -depth * 0.22], { obstacle: true });
      clockTower.userData.academicLandmark = true;
      for (const side of [-1, 1]) {
        const face = prepare(new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.08, 24), materials.plaster), districtId);
        face.name = 'ACADEMIC__CLOCK_FACE';
        face.rotation.x = Math.PI * 0.5;
        face.position.set(0, 6.25, side * (depth * 0.22 + 1.43));
        building.add(face);
      }
      const cap = prepare(new THREE.Mesh(new THREE.ConeGeometry(2.25, 2.4, 4), materials.slate), districtId);
      cap.name = 'ACADEMIC__CLOCK_TOWER_SLATE_SPIRE';
      cap.position.set(0, 9, -depth * 0.22);
      cap.rotation.y = Math.PI * 0.25;
      building.add(cap);
      for (const side of [-1, 1]) {
        const gargoyle = prepare(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.75, 5), materials.limestone), districtId);
        gargoyle.name = 'ACADEMIC__RAINWATER_GARGOYLE';
        gargoyle.rotation.x = Math.PI * 0.5;
        gargoyle.position.set(side * 1.45, 5.2, depth * 0.5 + 0.35);
        building.add(gargoyle);
      }
    }
  });
}
