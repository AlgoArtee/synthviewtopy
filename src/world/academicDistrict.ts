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
  academicCampusBuildingByName,
  type AcademicCampusBuilding,
  type AcademicInteriorKind,
} from '../data/academicCampus';
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

function createMaterials(): AcademicMaterials {
  const limestone = getAcademicAshlarTextures('medieval');
  const repairedStone = getAcademicAshlarTextures('repair');
  const slate = getAcademicSlateTextures();
  const oak = getAcademicOakTextures();
  const earthPath = getAcademicLeafPathTextures();
  const cobbleNoise = makeNoiseTexture(['#252a2b', '#555752']);
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
      color: '#172d32', emissive: '#0c1d22', emissiveIntensity: 0.28, roughness: 0.16, metalness: 0.1,
      clearcoat: 0.78, clearcoatRoughness: 0.12, transparent: true, opacity: 0.86,
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
  canal.userData.academicFeatureType = 'canal, embankment, bridge and reeds';
  const center = campusPoint(hub, tangent, radial, [0, 54]);
  const start = center.clone().addScaledVector(tangent, -48);
  const end = center.clone().addScaledVector(tangent, 48);
  const water = addSegment(canal, definition.id, 'ACADEMIC__BLACKWATER_CANAL', start, end, 7.5, 0.16, materials.water, -0.05);
  water.userData.academicWaterReflection = true;
  for (const side of [-1, 1]) {
    const edgeStart = start.clone().addScaledVector(radial, side * 4.25);
    const edgeEnd = end.clone().addScaledVector(radial, side * 4.25);
    const embankment = addSegment(canal, definition.id, 'ACADEMIC__MOSSY_STONE_EMBANKMENT', edgeStart, edgeEnd, 1.05, 1.4, materials.limestone, 0.36);
    embankment.userData.navObstacle = true;
  }

  const bridgeStart = center.clone().addScaledVector(radial, -5.2);
  const bridgeEnd = center.clone().addScaledVector(radial, 5.2);
  const bridge = addSegment(canal, definition.id, 'ACADEMIC__ARCHED_PEDESTRIAN_BRIDGE', bridgeStart, bridgeEnd, 2.4, 0.22, materials.limestone, 0.64, { walkable: true });
  bridge.userData.walkable = true;
  for (const side of [-1, 1]) {
    const railStart = bridgeStart.clone().addScaledVector(tangent, side * 1.12).setY(1.2);
    const railEnd = bridgeEnd.clone().addScaledVector(tangent, side * 1.12).setY(1.2);
    const rail = addSegment(canal, definition.id, 'ACADEMIC__BRIDGE_IRON_RAIL', railStart, railEnd, 0.09, 0.82, materials.iron, 1.05);
    rail.userData.navObstacle = true;
  }

  for (let index = 0; index < 34; index += 1) {
    const sign = index % 2 ? -1 : 1;
    const reed = prepare(new THREE.Mesh(unitCylinder, materials.moss), definition.id);
    reed.name = 'ACADEMIC__CANAL_REED';
    reed.scale.set(0.04, 0.7 + (index % 5) * 0.13, 0.04);
    reed.position.copy(center)
      .addScaledVector(tangent, -44 + index * 2.65)
      .addScaledVector(radial, sign * (2.6 + (index % 3) * 0.35));
    reed.position.y = reed.scale.y * 0.5;
    canal.add(reed);
  }
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
    const parkAnchors = park.userData.academicBenchAnchors as number[][] | undefined;
    if (!parkAnchors?.length) return;
    park.updateMatrix();
    parkAnchors.forEach((anchor) => {
      const position = new THREE.Vector3().fromArray(anchor).applyMatrix4(park.matrix);
      position.y = 0.004;
      const facing = park.position.clone().sub(position).setY(0).normalize();
      anchors.push({ position, facing, zone: String(park.userData.semanticName ?? 'academic park') });
    });
  });

  const distributedAnchors: ReadonlyArray<{
    position: readonly [number, number];
    target: readonly [number, number];
    zone: string;
    groundY?: number;
  }> = [
    { position: [-0.48, -40.8], target: [0, -40.8], zone: 'processional avenue' },
    { position: [0.48, -32.2], target: [0, -32.2], zone: 'processional avenue' },
    { position: [-0.48, -23.6], target: [0, -23.6], zone: 'processional avenue' },
    { position: [0.48, -15], target: [0, -15], zone: 'processional avenue', groundY: 0.004 },
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
  const library = districtGroup.children.find((child) => child.userData.semanticName === 'Ashcroft Grand Library');
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

type AcademicPathRole = 'entrance-apron' | 'campus-spine' | 'campus-crosswalk';

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
) {
  const secondaryWidth = 0.42;
  const paths: THREE.Mesh[] = [];
  const segmentMetadata: AcademicPathNetworkSegment[] = [];
  const facilities = districtGroup.children.filter(
    (child): child is THREE.Group => child instanceof THREE.Group && child.userData.academicFacility === true,
  );
  const facilitiesByName = new Map(facilities.map((building) => [String(building.userData.semanticName), building]));
  const servedPathNames = new Map<string, string[]>();
  const names = {
    hall: 'Blackwood University Great Hall',
    ashcroft: 'Ashcroft Grand Library',
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

  // East Canal Walk doglegs around a veteran oak and the archive bench.
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
        ? [`${definition.id}__ACADEMIC_PROCESSIONAL_ROAD`]
        : servedPathNames.get(facilityName) ?? [],
      secondaryWidth,
    };
  });
  districtGroup.userData.academicPathNetwork = {
    authoredFromLiveEntrances: true,
    entranceCount: facilities.length,
    connectedEntranceCount: facilities.length,
    mainPathName: `${definition.id}__ACADEMIC_PROCESSIONAL_ROAD`,
    mainWidth: 0.58,
    secondaryWidth,
    surfaceMaterial: materials.earthPath.name,
    groundTop: 0.006,
    namedWalks: ['Processional Avenue', 'West Service Walk', 'Library Walk', 'Science Walk', 'South Transverse Walk', 'East Canal Walk'],
    segmentCount: paths.length + 1,
    secondarySegmentCount: paths.length,
    segments: segmentMetadata,
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
  const processional = addGroundPath(
    districtGroup,
    definition.id,
    `${definition.id}__ACADEMIC_PROCESSIONAL_ROAD`,
    processionalStart,
    processionalEnd,
    0.58,
    materials.earthPath,
  );
  processional.userData.localCampusRoad = true;
  processional.userData.academicCampusRoad = true;
  processional.userData.academicEntrancePath = true;
  processional.userData.academicPathNetworkSegment = true;
  processional.userData.academicPathRole = 'main-processional';
  processional.userData.pathWidthWorldUnits = 0.58;
  processional.userData.servesFacility = 'Blackwood University Great Hall';
  localRoads.push(processional);

  const entrancePaths = createAcademicEntrancePathNetwork(
    definition,
    districtGroup,
    hub,
    tangent,
    radial,
    materials,
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
    createCanalEdge(definition, hub, tangent, radial, materials),
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
    const plaque = addBox(building, districtId, `${record.id}__CONFIGURED_BRASS_PLAQUE`, [0.66, 0.3, 0.035], materials.brass, [width * 0.12, 0.68, depth * 0.5 + 0.035]);
    plaque.userData.academicHotspot = record.id;
    if (record.interior) addInterior(building, { ...record, footprint: [width, depth] }, materials, districtId);

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
