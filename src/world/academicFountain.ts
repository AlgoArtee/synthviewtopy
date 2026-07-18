import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  ACADEMIC_FOUNTAIN_CAMERA_PRESETS,
  ACADEMIC_FOUNTAIN_CONFIG,
  ACADEMIC_FOUNTAIN_CONTEXTUAL_INTERACTIONS,
  ACADEMIC_FOUNTAIN_DIMENSIONS_METRES,
  ACADEMIC_FOUNTAIN_HISTORY,
  ACADEMIC_FOUNTAIN_QUALITY_PRESETS,
  ACADEMIC_FOUNTAIN_RESTORATION_MODES,
  ACADEMIC_FOUNTAIN_ROOT_NAME,
  ACADEMIC_FOUNTAIN_SCENE_MODES,
  ACADEMIC_FOUNTAIN_SCIENTIFIC_SYMBOLS,
  ACADEMIC_FOUNTAIN_STATUE_MATERIALS,
  ACADEMIC_FOUNTAIN_TITLE,
  type AcademicFountainCameraPresetId,
  type AcademicFountainQuality,
  type AcademicFountainRestorationMode,
  type AcademicFountainSceneMode,
  type AcademicFountainStatueMaterialMode,
} from '../data/academicFountain';

export type {
  AcademicFountainCameraPresetId,
  AcademicFountainQuality,
  AcademicFountainRestorationMode,
  AcademicFountainSceneMode,
  AcademicFountainStatueMaterialMode,
} from '../data/academicFountain';

export interface AcademicFountainState {
  sceneMode: AcademicFountainSceneMode;
  waterOn: boolean;
  waterFlow: number;
  requestedWaterFlow: number;
  sheetFlow: number;
  residualDrip: number;
  infinityLightOn: boolean;
  engravingsHighlighted: boolean;
  inspectedSymbolIndex: number;
  cutawayVisible: boolean;
  geometryGridVisible: boolean;
  ringRotating: boolean;
  ringAngle: number;
  statueMaterial: AcademicFountainStatueMaterialMode;
  restorationMode: AcademicFountainRestorationMode | 'off';
  cameraPreset: AcademicFountainCameraPresetId;
  debugVisible: boolean;
  quality: AcademicFountainQuality;
  /** Legacy saved-control compatibility; the new monument uses the infinity light. */
  lanternsOn: boolean;
  /** Legacy saved-control compatibility; the contemporary basin has no loose-leaf toggle. */
  floatingLeavesVisible: boolean;
  /** Legacy saved-control compatibility for pre-v2 text snapshots. */
  coinCount: number;
}

export interface AcademicFountainMetadata {
  version: number;
  name: string;
  title: string;
  dedication: string;
  history: string;
  patron: string;
  diameterMetres: number;
  basinWidthMetres: number;
  basinDepthMetres: number;
  centralHeightMetres: number;
  statueHeightMetres: number;
  infinityWidthMetres: number;
  orbitalRingDiameterMetres: number;
  spoutCount: number;
  scholar: string;
  materials: string[];
  symbols: Array<{ id: string; name: string; description: string; placement: string }>;
  sceneModes: Array<{ id: AcademicFountainSceneMode; label: string; description: string }>;
  cameraPresets: Array<{ id: AcademicFountainCameraPresetId; label: string; description: string }>;
  restorationModes: Array<{ id: AcademicFountainRestorationMode; label: string; description: string }>;
  interactions: string[];
  performance: {
    instancedFeatures: string[];
    waterTechnique: string;
    lodLevels: number;
  };
}

type MaterialKey =
  | 'darkLimestone'
  | 'blackMarble'
  | 'wetStone'
  | 'bronze'
  | 'brass'
  | 'copper'
  | 'iron'
  | 'structuralIron'
  | 'glass'
  | 'moss'
  | 'mineral'
  | 'plaza';

interface MaterialSnapshot {
  material: THREE.MeshStandardMaterial;
  weatheredColor: THREE.Color;
  cleanColor: THREE.Color;
  weatheredRoughness: number;
  cleanRoughness: number;
}

interface StatueMeshRecord {
  mesh: THREE.Mesh;
  category: 'robe' | 'skin' | 'accent';
}

interface FountainRuntime {
  root: THREE.Group;
  state: AcademicFountainState;
  materials: Record<MaterialKey, THREE.MeshStandardMaterial>;
  weatherableMaterials: MaterialSnapshot[];
  water: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  channelWater: THREE.InstancedMesh<THREE.BoxGeometry, THREE.MeshPhysicalMaterial>;
  waterSheets: THREE.InstancedMesh<THREE.PlaneGeometry, THREE.MeshPhysicalMaterial>;
  residualDrips: THREE.InstancedMesh<THREE.SphereGeometry, THREE.MeshPhysicalMaterial>;
  infinityGlow: THREE.Mesh<THREE.TubeGeometry, THREE.MeshBasicMaterial>;
  infinityReflection: THREE.Mesh<THREE.TubeGeometry, THREE.MeshBasicMaterial>;
  infinityLight: THREE.PointLight;
  engravingMaterial: THREE.MeshStandardMaterial;
  engravingHalo: THREE.Group;
  constructionGrid: THREE.Group;
  ringPivot: THREE.Group;
  ringTicks: THREE.InstancedMesh;
  statueHigh: THREE.Group;
  statueMedium: THREE.Group;
  statueLow: THREE.Group;
  statueMeshes: StatueMeshRecord[];
  fineDetails: THREE.Group;
  nearDetails: THREE.Group;
  rainAndMist: THREE.Group;
  rain: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  presentation: THREE.Group;
  presentationKey: THREE.SpotLight;
  cutaway: THREE.Group;
  restorationComparison: THREE.Group;
  debug: THREE.Group;
  targetFlow: number;
  rippleEnergy: number;
  lastDebugStatsSecond: number;
  waterSheetTransforms: Array<{ position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }>;
}

export interface AcademicFountainRuntimeSnapshot {
  waterOn: boolean;
  waterFlow: number;
  requestedWaterFlow: number;
  sheetFlow: number;
  residualDrip: number;
  ringRotating: boolean;
  ringAngle: number;
}

const fountainRuntimes = new WeakMap<THREE.Object3D, FountainRuntime>();
const debugStatsAssets = new WeakMap<THREE.Group, { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture }>();
const dummy = new THREE.Object3D();
const WORLD_UNITS_PER_METRE = 0.1;
const metres = (value: number) => value * WORLD_UNITS_PER_METRE;

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function createProceduralSurface(
  name: string,
  base: string,
  dark: string,
  light: string,
  directional = false,
) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d')!;
  const random = seededRandom(name.split('').reduce((sum, character) => sum + character.charCodeAt(0) * 37, 0));
  context.fillStyle = base;
  context.fillRect(0, 0, size, size);
  for (let index = 0; index < 1800; index += 1) {
    context.globalAlpha = 0.025 + random() * 0.11;
    context.fillStyle = random() > 0.54 ? light : dark;
    const width = directional ? 0.5 + random() * 2.2 : 0.6 + random() * 5;
    const height = directional ? 7 + random() * 48 : 0.5 + random() * 4;
    context.fillRect(random() * size, random() * size, width, height);
  }
  context.globalAlpha = 0.18;
  context.strokeStyle = light;
  context.lineWidth = 1;
  for (let line = 0; line < 16; line += 1) {
    context.beginPath();
    const offset = line * 17 + random() * 4;
    context.moveTo(0, offset);
    context.lineTo(size, offset + (random() - 0.5) * 5);
    context.stroke();
  }
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.name = name;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createPlaqueTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 320;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#312b20';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#a88949';
  context.lineWidth = 10;
  context.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
  context.fillStyle = '#d1bd7d';
  context.textAlign = 'center';
  context.font = '700 52px Georgia';
  context.fillText('THE WELL OF INFINITE KNOWLEDGE', 512, 92);
  context.font = '26px Georgia';
  context.fillText('SESHAT · MEASUREMENT · MEMORY · SCHOLARSHIP', 512, 154);
  context.font = 'italic 24px Georgia';
  context.fillText('What is measured may be questioned; what is recorded may be continued.', 512, 214);
  context.font = '19px Georgia';
  context.fillText('BLACKWOOD UNIVERSITY · CONTEMPORARY COMMISSION', 512, 266);
  const texture = new THREE.CanvasTexture(canvas);
  texture.name = 'well-of-infinite-knowledge-inscription';
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function prepare<T extends THREE.Mesh>(mesh: T, selectableId: string, name: string, shadows = true) {
  mesh.name = name;
  mesh.userData.selectableId = selectableId;
  mesh.userData.academicFountainHotspot = true;
  mesh.castShadow = shadows;
  mesh.receiveShadow = shadows;
  return mesh;
}

function mergeParts(parts: Array<{
  geometry: THREE.BufferGeometry;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: THREE.Vector3;
}>) {
  const geometries = parts.map(({ geometry, position, rotation, scale }) => {
    const source = geometry.clone();
    const clone = source.index ? source.toNonIndexed() : source;
    if (clone !== source) source.dispose();
    if (!clone.getAttribute('normal')) clone.computeVertexNormals();
    if (!clone.getAttribute('uv')) {
      const vertexCount = clone.getAttribute('position').count;
      clone.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(vertexCount * 2), 2));
    }
    for (const attributeName of Object.keys(clone.attributes)) {
      if (!['position', 'normal', 'uv'].includes(attributeName)) clone.deleteAttribute(attributeName);
    }
    const quaternion = new THREE.Quaternion().setFromEuler(rotation ?? new THREE.Euler());
    const matrix = new THREE.Matrix4().compose(
      position ?? new THREE.Vector3(),
      quaternion,
      scale ?? new THREE.Vector3(1, 1, 1),
    );
    clone.applyMatrix4(matrix);
    geometry.dispose();
    return clone;
  });
  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());
  if (!merged) throw new Error('Unable to merge Well of Infinite Knowledge geometry');
  return merged;
}

function cylinderBetweenGeometry(start: THREE.Vector3, end: THREE.Vector3, radius: number, segments = 8) {
  const delta = end.clone().sub(start);
  const geometry = new THREE.CylinderGeometry(radius, radius, 1, segments);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
  const matrix = new THREE.Matrix4().compose(
    start.clone().add(end).multiplyScalar(0.5),
    quaternion,
    new THREE.Vector3(1, delta.length(), 1),
  );
  geometry.applyMatrix4(matrix);
  return geometry;
}

function createMaterials() {
  const stoneTexture = createProceduralSurface('well-dark-limestone-grain', '#343937', '#151a19', '#68706b', true);
  const marbleTexture = createProceduralSurface('well-black-marble-veins', '#171a1c', '#060708', '#72746d');
  const wetTexture = createProceduralSurface('well-rain-darkened-stone', '#292f2e', '#101514', '#59645f', true);
  const plazaTexture = createProceduralSurface('well-wet-plaza-slabs', '#3f4341', '#1d2422', '#6f716a');
  const darkLimestone = new THREE.MeshStandardMaterial({ name: 'Well weathered dark limestone', map: stoneTexture, bumpMap: stoneTexture, bumpScale: 0.014, color: '#4b514e', roughness: 0.88, metalness: 0.02 });
  const blackMarble = new THREE.MeshStandardMaterial({ name: 'Well charcoal veined marble', map: marbleTexture, bumpMap: marbleTexture, bumpScale: 0.007, color: '#24282a', roughness: 0.34, metalness: 0.03 });
  const wetStone = new THREE.MeshStandardMaterial({ name: 'Well wet black stone', map: wetTexture, bumpMap: wetTexture, bumpScale: 0.009, color: '#303936', roughness: 0.36, metalness: 0.02 });
  const bronze = new THREE.MeshStandardMaterial({ name: 'Well patinated bronze', color: '#365c54', roughness: 0.55, metalness: 0.78 });
  const brass = new THREE.MeshStandardMaterial({ name: 'Well tarnished brass', color: '#9d7c3d', roughness: 0.44, metalness: 0.84 });
  const copper = new THREE.MeshStandardMaterial({ name: 'Well oxidized copper', color: '#326d67', roughness: 0.61, metalness: 0.72 });
  const iron = new THREE.MeshStandardMaterial({ name: 'Well blackened engraved iron', color: '#202321', roughness: 0.53, metalness: 0.82 });
  const structuralIron = new THREE.MeshStandardMaterial({ name: 'Well light-absorbing structural iron', color: '#0b0e0d', roughness: 0.78, metalness: 0.48 });
  const glass = new THREE.MeshStandardMaterial({ name: 'Well smoked diagram glass', color: '#334247', roughness: 0.2, metalness: 0.02, transparent: true, opacity: 0.7 });
  const moss = new THREE.MeshStandardMaterial({ name: 'Well restrained joint moss', color: '#344234', roughness: 1, metalness: 0 });
  const mineral = new THREE.MeshStandardMaterial({ name: 'Well pale mineral deposit', color: '#b2b4a6', roughness: 0.9, metalness: 0 });
  const plaza = new THREE.MeshStandardMaterial({ name: 'Well wet geometric plaza', map: plazaTexture, bumpMap: plazaTexture, bumpScale: 0.01, color: '#4f5350', roughness: 0.5, metalness: 0.01 });
  const materials = { darkLimestone, blackMarble, wetStone, bronze, brass, copper, iron, structuralIron, glass, moss, mineral, plaza };
  const snapshots: MaterialSnapshot[] = [
    { material: darkLimestone, weatheredColor: new THREE.Color('#4b514e'), cleanColor: new THREE.Color('#626965'), weatheredRoughness: 0.88, cleanRoughness: 0.68 },
    { material: blackMarble, weatheredColor: new THREE.Color('#24282a'), cleanColor: new THREE.Color('#303538'), weatheredRoughness: 0.34, cleanRoughness: 0.24 },
    { material: wetStone, weatheredColor: new THREE.Color('#303936'), cleanColor: new THREE.Color('#4a504d'), weatheredRoughness: 0.36, cleanRoughness: 0.31 },
    { material: bronze, weatheredColor: new THREE.Color('#365c54'), cleanColor: new THREE.Color('#735b32'), weatheredRoughness: 0.55, cleanRoughness: 0.38 },
    { material: brass, weatheredColor: new THREE.Color('#9d7c3d'), cleanColor: new THREE.Color('#c8a75d'), weatheredRoughness: 0.44, cleanRoughness: 0.3 },
    { material: copper, weatheredColor: new THREE.Color('#326d67'), cleanColor: new THREE.Color('#7d5736'), weatheredRoughness: 0.61, cleanRoughness: 0.4 },
    { material: iron, weatheredColor: new THREE.Color('#202321'), cleanColor: new THREE.Color('#343736'), weatheredRoughness: 0.53, cleanRoughness: 0.38 },
    { material: structuralIron, weatheredColor: new THREE.Color('#0b0e0d'), cleanColor: new THREE.Color('#252927'), weatheredRoughness: 0.78, cleanRoughness: 0.58 },
  ];
  return { materials, snapshots };
}

function basinPoints() {
  const rawPoints = [
    new THREE.Vector2(-0.78, -0.23),
    new THREE.Vector2(-0.58, -0.52),
    new THREE.Vector2(-0.18, -0.63),
    new THREE.Vector2(0.29, -0.58),
    new THREE.Vector2(0.69, -0.33),
    new THREE.Vector2(0.8, 0.06),
    new THREE.Vector2(0.61, 0.46),
    new THREE.Vector2(0.18, 0.62),
    new THREE.Vector2(-0.32, 0.58),
    new THREE.Vector2(-0.72, 0.29),
  ];
  const xScale = ACADEMIC_FOUNTAIN_DIMENSIONS_METRES.basinWidth / 15.8;
  const zScale = ACADEMIC_FOUNTAIN_DIMENSIONS_METRES.basinDepth / 12.5;
  return rawPoints.map((point) => new THREE.Vector2(point.x * xScale, point.y * zScale));
}

function createShape(points: THREE.Vector2[], scale = 1) {
  const shape = new THREE.Shape();
  points.forEach((point, index) => {
    const x = point.x * scale;
    const y = point.y * scale;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  return shape;
}

function createWaterMaterial() {
  return new THREE.ShaderMaterial({
    name: 'Well engineered green-black water shader',
    transparent: true,
    depthWrite: true,
    uniforms: {
      uTime: { value: 0 },
      uFlow: { value: 0.72 },
      uRipple: { value: 0.35 },
      uQuality: { value: 0.65 },
      uBase: { value: new THREE.Color('#122522') },
      uHighlight: { value: new THREE.Color('#70827b') },
    },
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform float uFlow;
      uniform float uRipple;
      uniform float uQuality;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        vUv = uv;
        vec3 p = position;
        float engineered = sin(uv.x * 51.0 + uTime * 0.42) * cos(uv.y * 37.0 - uTime * 0.31);
        float orbital = sin(length(uv - vec2(0.5)) * 78.0 - uTime * 0.5) * uRipple;
        vWave = (engineered * 0.0013 * uFlow + orbital * 0.0008) * uQuality;
        p.z += vWave;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform float uFlow;
      uniform vec3 uBase;
      uniform vec3 uHighlight;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        float precisionLines = sin(vUv.x * 63.0 + uTime * 0.18) * sin(vUv.y * 47.0 - uTime * 0.14);
        float glint = clamp(0.12 + precisionLines * 0.055 * uFlow + abs(vWave) * 38.0, 0.04, 0.44);
        vec3 color = mix(uBase, uHighlight, glint);
        gl_FragColor = vec4(color, 0.91);
      }
    `,
  });
}

function createModernPlaza(root: THREE.Group, selectableId: string, materials: Record<MaterialKey, THREE.MeshStandardMaterial>) {
  const outerRadius = 1.68;
  const plazaShape = new THREE.Shape();
  plazaShape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
  const basinHole = new THREE.Path();
  basinPoints().slice().reverse().forEach((point, index) => {
    const x = point.x * 1.025;
    const z = point.y * 1.025;
    if (index === 0) basinHole.moveTo(x, z);
    else basinHole.lineTo(x, z);
  });
  basinHole.closePath();
  plazaShape.holes.push(basinHole);

  const plaza = prepare(new THREE.Mesh(new THREE.ShapeGeometry(plazaShape, 64), materials.plaza), selectableId, 'WELL__DARK_GEOMETRIC_PLAZA_SLABS');
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.012;
  plaza.userData.walkable = true;
  root.add(plaza);

  const details = new THREE.Group();
  details.name = 'WELL__PLAZA_BRASS_LINES_AND_DRAINAGE';
  const expansionLines = prepare(new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.004, 0.66), materials.brass, 12), selectableId, 'WELL__PLAZA_BRASS_EXPANSION_LINES', false);
  for (let index = 0; index < 12; index += 1) {
    const angle = index * Math.PI / 6;
    dummy.position.set(Math.sin(angle) * 1.14, 0.017, Math.cos(angle) * 1.14);
    dummy.rotation.set(0, angle, 0);
    dummy.scale.set(index % 3 === 0 ? 1.2 : 0.65, 1, 1);
    dummy.updateMatrix();
    expansionLines.setMatrixAt(index, dummy.matrix);
  }
  expansionLines.instanceMatrix.needsUpdate = true;
  const drainage = prepare(new THREE.Mesh(new THREE.RingGeometry(1.48, 1.515, 96), materials.iron), selectableId, 'WELL__INTEGRATED_PLAZA_DRAINAGE_RING', false);
  drainage.rotation.x = -Math.PI / 2;
  drainage.position.y = 0.018;
  details.add(expansionLines, drainage);
  root.add(details);
  return details;
}

function createFountainBasin(root: THREE.Group, selectableId: string, materials: Record<MaterialKey, THREE.MeshStandardMaterial>) {
  const points = basinPoints();
  const floor = prepare(new THREE.Mesh(new THREE.ShapeGeometry(createShape(points, 0.91)), materials.blackMarble), selectableId, 'WELL__SUNKEN_POLYGONAL_BASIN_FLOOR');
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.018;
  root.add(floor);

  const edgeShape = createShape(points, 1);
  const hole = new THREE.Path();
  points.slice().reverse().forEach((point, index) => {
    const x = point.x * 0.9;
    const y = point.y * 0.9;
    if (index === 0) hole.moveTo(x, y);
    else hole.lineTo(x, y);
  });
  hole.closePath();
  edgeShape.holes.push(hole);
  const edgeGeometry = new THREE.ExtrudeGeometry(edgeShape, { depth: 0.055, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1 });
  edgeGeometry.rotateX(-Math.PI / 2);
  const edge = prepare(new THREE.Mesh(edgeGeometry, materials.wetStone), selectableId, 'WELL__BLACK_STONE_MEASUREMENT_EDGE');
  edge.position.y = 0.025;
  root.add(edge);

  const waterMaterial = createWaterMaterial();
  const water = prepare(new THREE.Mesh(new THREE.ShapeGeometry(createShape(points, 0.87)), waterMaterial), selectableId, 'WELL__DARK_REFLECTIVE_POLYGONAL_WATER', false);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.008;
  root.add(water);

  const channelMaterial = new THREE.MeshPhysicalMaterial({ name: 'Well controlled radial channel water', color: '#203b37', roughness: 0.14, metalness: 0, transparent: true, opacity: 0.72, clearcoat: 0.24, depthWrite: true });
  const channelWater = prepare(new THREE.InstancedMesh(new THREE.BoxGeometry(0.026, 0.01, 0.43), channelMaterial, 8), selectableId, 'WELL__EIGHT_RADIAL_WATER_CHANNELS', false);
  const poolGeometry = new THREE.BoxGeometry(0.16, 0.012, 0.16);
  const pools = prepare(new THREE.InstancedMesh(poolGeometry, channelMaterial, 4), selectableId, 'WELL__CHANNEL_REFLECTING_POOLS', false);
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI / 4;
    dummy.position.set(Math.sin(angle) * 0.43, 0.016, Math.cos(angle) * 0.43);
    dummy.rotation.set(0, angle, 0);
    dummy.scale.set(index % 2 ? 0.76 : 1, 1, 1);
    dummy.updateMatrix();
    channelWater.setMatrixAt(index, dummy.matrix);
    if (index % 2 === 0) {
      dummy.position.set(Math.sin(angle) * 0.68, 0.016, Math.cos(angle) * 0.68);
      dummy.rotation.set(0, angle * 0.5, 0);
      dummy.scale.set(1, 1, 0.76);
      dummy.updateMatrix();
      pools.setMatrixAt(index / 2, dummy.matrix);
    }
  }
  channelWater.instanceMatrix.needsUpdate = true;
  pools.instanceMatrix.needsUpdate = true;
  root.add(channelWater, pools);
  return { water, channelWater, pools };
}

function createFloatingPlatforms(root: THREE.Group, selectableId: string, materials: Record<MaterialKey, THREE.MeshStandardMaterial>) {
  const platforms = prepare(new THREE.InstancedMesh(new THREE.BoxGeometry(0.32, 0.055, 0.125), materials.blackMarble, 7), selectableId, 'WELL__FLOATING_CEREMONIAL_PLATFORMS');
  const supports = prepare(new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.09, 0.08), materials.iron, 7), selectableId, 'WELL__CONCEALED_PLATFORM_SUPPORTS');
  const positions = [
    [-0.2, 0.72, -0.14],
    [0.1, 0.63, 0.1],
    [-0.08, 0.55, -0.18],
    [0.15, 0.47, 0.04],
    [-0.12, 0.39, -0.08],
    [0.08, 0.32, 0.12],
    [0, 0.27, 0],
  ];
  positions.forEach(([x, z, rotation], index) => {
    dummy.position.set(x, 0.105 + Math.min(index, 3) * 0.006, z);
    dummy.rotation.set(0, rotation, 0);
    dummy.scale.set(1 - index * 0.025, 1, index % 2 ? 0.9 : 1);
    dummy.updateMatrix();
    platforms.setMatrixAt(index, dummy.matrix);
    dummy.position.y = 0.05;
    dummy.rotation.set(0, rotation, 0);
    dummy.scale.set(0.8, 1, 0.72);
    dummy.updateMatrix();
    supports.setMatrixAt(index, dummy.matrix);
  });
  platforms.instanceMatrix.needsUpdate = true;
  supports.instanceMatrix.needsUpdate = true;
  platforms.userData.walkable = true;
  root.add(supports, platforms);

  // A single invisible, raycastable support deck bridges the deliberately
  // narrow water gaps so WALK never falls through to the court mesh beneath.
  // The visible unequal slabs remain the only rendered walking surface.
  const routeMaterial = new THREE.MeshBasicMaterial({ name: 'Well hidden accessible platform support', transparent: true, opacity: 0, depthWrite: false });
  const routeGuide = prepare(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.012, 0.56), routeMaterial), selectableId, 'WELL__HIDDEN_WALKABLE_PLATFORM_ROUTE', false);
  routeGuide.position.set(-0.055, 0.111, 0.52);
  routeGuide.rotation.y = -0.055;
  routeGuide.userData.walkable = true;
  root.add(routeGuide);

  const ramp = prepare(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.028, 0.62), materials.plaza), selectableId, 'WELL__INTEGRATED_ACCESSIBLE_RAMP');
  ramp.position.set(-0.19, 0.064, 1.0);
  ramp.rotation.x = -ACADEMIC_FOUNTAIN_DIMENSIONS_METRES.accessibleRampMaximumSlope;
  ramp.rotation.y = -0.14;
  ramp.userData.walkable = true;
  root.add(ramp);
}

function createCentralPlinth(root: THREE.Group, selectableId: string, materials: Record<MaterialKey, THREE.MeshStandardMaterial>) {
  const stoneGeometry = mergeParts([
    { geometry: new THREE.BoxGeometry(0.48, 0.14, 0.38), position: new THREE.Vector3(-0.02, 0.17, 0.01), rotation: new THREE.Euler(0, -0.08, 0) },
    { geometry: new THREE.BoxGeometry(0.36, 0.18, 0.3), position: new THREE.Vector3(0.07, 0.31, -0.03), rotation: new THREE.Euler(0, 0.1, 0) },
    { geometry: new THREE.BoxGeometry(0.2, 0.27, 0.22), position: new THREE.Vector3(-0.03, 0.48, 0.02), rotation: new THREE.Euler(0, -0.04, 0) },
  ]);
  const stone = prepare(new THREE.Mesh(stoneGeometry, materials.darkLimestone), selectableId, 'WELL__OFFSET_DARK_LIMESTONE_PLINTH');
  const marbleGeometry = mergeParts([
    { geometry: new THREE.BoxGeometry(0.58, 0.055, 0.24), position: new THREE.Vector3(0.08, 0.255, -0.08), rotation: new THREE.Euler(0, 0.18, 0) },
    { geometry: new THREE.BoxGeometry(0.32, 0.05, 0.42), position: new THREE.Vector3(-0.1, 0.39, 0.06), rotation: new THREE.Euler(0, -0.12, 0) },
    { geometry: new THREE.BoxGeometry(0.42, 0.04, 0.18), position: new THREE.Vector3(0.11, 0.56, 0.02), rotation: new THREE.Euler(0, 0.08, 0) },
  ]);
  const marble = prepare(new THREE.Mesh(marbleGeometry, materials.blackMarble), selectableId, 'WELL__CANTILEVERED_BLACK_MARBLE_PLANES');
  root.add(stone, marble);

  const inlays = prepare(new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.004, 0.34), materials.brass, 6), selectableId, 'WELL__PLINTH_BRASS_MEASUREMENT_INLAYS');
  for (let index = 0; index < 6; index += 1) {
    const angle = index * Math.PI / 3 + 0.12;
    dummy.position.set(Math.sin(angle) * 0.19, 0.265 + (index % 2) * 0.135, Math.cos(angle) * 0.13);
    dummy.rotation.set(0, angle, index % 2 ? Math.PI / 2 : 0);
    dummy.scale.set(1, 1, 0.68 + (index % 3) * 0.15);
    dummy.updateMatrix();
    inlays.setMatrixAt(index, dummy.matrix);
  }
  inlays.instanceMatrix.needsUpdate = true;
  root.add(inlays);
  return inlays;
}

function createSeshatVariant(
  selectableId: string,
  detail: 'high' | 'medium' | 'low',
  materials: Record<MaterialKey, THREE.MeshStandardMaterial>,
  records: StatueMeshRecord[],
) {
  const group = new THREE.Group();
  group.name = `WELL__SESHAT_${detail.toUpperCase()}_LOD`;
  const robeParts: Parameters<typeof mergeParts>[0] = [
    { geometry: new THREE.ConeGeometry(0.18, 0.5, detail === 'low' ? 4 : 6), position: new THREE.Vector3(0, 0.78, 0), rotation: new THREE.Euler(0, Math.PI / 4, 0) },
    { geometry: new THREE.BoxGeometry(0.24, 0.2, 0.14), position: new THREE.Vector3(0, 0.99, 0), rotation: new THREE.Euler(0, 0.03, 0) },
  ];
  if (detail !== 'low') {
    [-0.105, -0.052, 0, 0.052, 0.105].forEach((x, index) => {
      robeParts.push({
        geometry: new THREE.BoxGeometry(index === 2 ? 0.035 : 0.027, 0.43, 0.025),
        position: new THREE.Vector3(x, 0.76, 0.145 - Math.abs(x) * 0.2),
        rotation: new THREE.Euler(0, 0, (index - 2) * 0.035),
      });
    });
    robeParts.push(
      { geometry: new THREE.BoxGeometry(0.34, 0.045, 0.19), position: new THREE.Vector3(0, 0.58, 0.01) },
      { geometry: new THREE.BoxGeometry(0.29, 0.035, 0.16), position: new THREE.Vector3(0, 0.9, 0.015), rotation: new THREE.Euler(0, 0, -0.03) },
    );
  }
  const robe = prepare(new THREE.Mesh(mergeParts(robeParts), materials.darkLimestone), selectableId, `WELL__SESHAT_${detail.toUpperCase()}_GEOMETRIC_ROBES`);
  robe.userData.statueCategory = 'robe';
  records.push({ mesh: robe, category: 'robe' });
  group.add(robe);

  if (detail !== 'low') {
    const skinParts: Parameters<typeof mergeParts>[0] = [
      { geometry: new THREE.CylinderGeometry(0.04, 0.045, 0.06, detail === 'high' ? 10 : 7), position: new THREE.Vector3(0, 1.105, 0) },
      { geometry: new THREE.SphereGeometry(0.073, detail === 'high' ? 16 : 9, detail === 'high' ? 12 : 7), position: new THREE.Vector3(0, 1.18, 0), scale: new THREE.Vector3(0.86, 1.08, 0.9) },
    ];
    if (detail === 'high') {
      skinParts.push(
        { geometry: new THREE.ConeGeometry(0.012, 0.036, 5), position: new THREE.Vector3(0, 1.181, 0.071), rotation: new THREE.Euler(Math.PI / 2, 0, 0) },
        { geometry: new THREE.BoxGeometry(0.034, 0.006, 0.008), position: new THREE.Vector3(-0.027, 1.2, 0.066), rotation: new THREE.Euler(0, 0, 0.08) },
        { geometry: new THREE.BoxGeometry(0.034, 0.006, 0.008), position: new THREE.Vector3(0.027, 1.2, 0.066), rotation: new THREE.Euler(0, 0, -0.08) },
      );
    }
    const skin = prepare(new THREE.Mesh(mergeParts(skinParts), materials.blackMarble), selectableId, `WELL__SESHAT_${detail.toUpperCase()}_CALM_SEVERE_FACE`);
    skin.userData.statueCategory = 'skin';
    records.push({ mesh: skin, category: 'skin' });
    group.add(skin);

    const armParts: Parameters<typeof mergeParts>[0] = [];
    [-1, 1].forEach((side) => {
      armParts.push(
        { geometry: cylinderBetweenGeometry(new THREE.Vector3(side * 0.105, 1.02, 0), new THREE.Vector3(side * 0.17, 1.16, 0.005), 0.03, detail === 'high' ? 10 : 7) },
        { geometry: cylinderBetweenGeometry(new THREE.Vector3(side * 0.17, 1.16, 0.005), new THREE.Vector3(side * 0.19, 1.32, 0.008), 0.026, detail === 'high' ? 10 : 7) },
        { geometry: new THREE.SphereGeometry(0.032, detail === 'high' ? 12 : 8, detail === 'high' ? 8 : 6), position: new THREE.Vector3(side * 0.19, 1.32, 0.008), scale: new THREE.Vector3(0.82, 1.08, 0.82) },
      );
    });
    armParts.push(
      { geometry: new THREE.TorusGeometry(0.115, 0.01, 6, detail === 'high' ? 32 : 18), position: new THREE.Vector3(0, 1.2, -0.045) },
      { geometry: new THREE.OctahedronGeometry(0.055, detail === 'high' ? 1 : 0), position: new THREE.Vector3(0, 1.29, -0.044), rotation: new THREE.Euler(0, 0, Math.PI / 4), scale: new THREE.Vector3(0.72, 1.15, 0.34) },
    );
    if (detail === 'high') {
      for (let index = 0; index < 8; index += 1) {
        const angle = index * Math.PI / 4;
        armParts.push({ geometry: cylinderBetweenGeometry(
          new THREE.Vector3(Math.sin(angle) * 0.07, 1.2 + Math.cos(angle) * 0.07, -0.046),
          new THREE.Vector3(Math.sin(angle) * 0.13, 1.2 + Math.cos(angle) * 0.13, -0.046),
          0.004,
          5,
        ) });
      }
    }
    const accent = prepare(new THREE.Mesh(mergeParts(armParts), materials.bronze), selectableId, `WELL__SESHAT_${detail.toUpperCase()}_RAISED_ARMS_AND_CELESTIAL_HEADPIECE`);
    accent.userData.statueCategory = 'accent';
    records.push({ mesh: accent, category: 'accent' });
    group.add(accent);
  } else {
    // The long-distance representation remains a complete, authoritative
    // silhouette: head, raised arms, hands, and scholarly rosette continue to
    // visibly support the infinity sculpture instead of leaving it floating.
    const silhouetteParts: Parameters<typeof mergeParts>[0] = [
      { geometry: new THREE.CylinderGeometry(0.04, 0.045, 0.06, 6), position: new THREE.Vector3(0, 1.105, 0) },
      { geometry: new THREE.SphereGeometry(0.073, 7, 5), position: new THREE.Vector3(0, 1.18, 0), scale: new THREE.Vector3(0.86, 1.08, 0.9) },
      { geometry: new THREE.TorusGeometry(0.115, 0.012, 5, 14), position: new THREE.Vector3(0, 1.2, -0.045) },
      { geometry: new THREE.OctahedronGeometry(0.055, 0), position: new THREE.Vector3(0, 1.29, -0.044), rotation: new THREE.Euler(0, 0, Math.PI / 4), scale: new THREE.Vector3(0.72, 1.15, 0.34) },
    ];
    [-1, 1].forEach((side) => {
      silhouetteParts.push(
        { geometry: cylinderBetweenGeometry(new THREE.Vector3(side * 0.105, 1.02, 0), new THREE.Vector3(side * 0.17, 1.16, 0.005), 0.032, 6) },
        { geometry: cylinderBetweenGeometry(new THREE.Vector3(side * 0.17, 1.16, 0.005), new THREE.Vector3(side * 0.19, 1.32, 0.008), 0.028, 6) },
        { geometry: new THREE.SphereGeometry(0.034, 6, 4), position: new THREE.Vector3(side * 0.19, 1.32, 0.008) },
      );
    });
    const silhouette = prepare(new THREE.Mesh(mergeParts(silhouetteParts), materials.bronze), selectableId, 'WELL__SESHAT_LOW_COMPLETE_HEAD_ARMS_HANDS_AND_ROSETTE');
    silhouette.userData.statueCategory = 'accent';
    records.push({ mesh: silhouette, category: 'accent' });
    group.add(silhouette);
  }
  return group;
}

class InfinityCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    const angle = t * Math.PI * 2;
    return target.set(Math.sin(angle) * 0.245, 1.39 + Math.sin(angle * 2) * 0.115, -0.012 + Math.cos(angle) * 0.018);
  }
}

class InfinityReflectionCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    const angle = t * Math.PI * 2;
    return target.set(Math.sin(angle) * 0.245, 0.011, 0.055 + Math.sin(angle * 2) * 0.12);
  }
}

function createInfinitySculpture(root: THREE.Group, selectableId: string, materials: Record<MaterialKey, THREE.MeshStandardMaterial>) {
  const curve = new InfinityCurve();
  const infinity = prepare(new THREE.Mesh(new THREE.TubeGeometry(curve, 112, 0.033, 7, true), materials.structuralIron), selectableId, 'WELL__STRUCTURAL_BLACKENED_BRONZE_INFINITY');
  const glowMaterial = new THREE.MeshBasicMaterial({ name: 'Well restrained internal amber line', color: '#ffc970', transparent: true, opacity: 0.62, toneMapped: false });
  const glowCurve = new InfinityCurve();
  const infinityGlow = prepare(new THREE.Mesh(new THREE.TubeGeometry(glowCurve, 112, 0.006, 5, true), glowMaterial), selectableId, 'WELL__INFINITY_INTEGRATED_AMBER_LIGHT', false);
  infinityGlow.position.z = 0.035;
  const reflectionMaterial = new THREE.MeshBasicMaterial({ name: 'Well restrained infinity water reflection', color: '#d5aa68', transparent: true, opacity: 0.08, depthWrite: false, toneMapped: true });
  const infinityReflection = prepare(new THREE.Mesh(new THREE.TubeGeometry(new InfinityReflectionCurve(), 80, 0.004, 4, true), reflectionMaterial), selectableId, 'WELL__INFINITY_SUBTLE_WATER_REFLECTION', false);
  const markers = prepare(new THREE.InstancedMesh(new THREE.BoxGeometry(0.016, 0.005, 0.038), materials.brass, 18), selectableId, 'WELL__INFINITY_MATHEMATICAL_MARKERS');
  for (let index = 0; index < 18; index += 1) {
    const point = curve.getPoint(index / 18);
    dummy.position.copy(point).add(new THREE.Vector3(0, 0, -0.028));
    dummy.rotation.set(0, 0, index * Math.PI / 9);
    dummy.scale.set(index % 3 === 0 ? 1.3 : 0.7, 1, 1);
    dummy.updateMatrix();
    markers.setMatrixAt(index, dummy.matrix);
  }
  markers.instanceMatrix.needsUpdate = true;
  const light = new THREE.PointLight('#ffc16a', 0.16, 1.4, 2);
  light.name = 'WELL__INFINITY_ARCHITECTURAL_LIGHT';
  light.position.set(0, 1.35, 0.08);
  light.castShadow = false;
  root.add(infinity, infinityGlow, infinityReflection, markers, light);
  return { infinityGlow, infinityReflection, infinityLight: light, markers };
}

function createOrbitalRing(root: THREE.Group, selectableId: string, materials: Record<MaterialKey, THREE.MeshStandardMaterial>) {
  const pivot = new THREE.Group();
  pivot.name = 'WELL__TILTED_ORBITAL_RING_PIVOT';
  pivot.position.y = 0.97;
  pivot.rotation.set(0.48, 0.18, -0.34);
  const ring = prepare(new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.018, 8, 88, Math.PI * 1.68), materials.structuralIron), selectableId, 'WELL__BROKEN_ASTROLABE_RING');
  ring.rotation.z = Math.PI * 0.13;
  const ticks = prepare(new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.038, 0.012), materials.brass, 28), selectableId, 'WELL__ORBITAL_RING_ENGRAVED_TICKS');
  for (let index = 0; index < 28; index += 1) {
    const angle = (index / 34) * Math.PI * 2 + 0.18;
    dummy.position.set(Math.cos(angle) * 0.43, Math.sin(angle) * 0.43, 0);
    dummy.rotation.set(0, 0, angle);
    dummy.scale.set(index % 7 === 0 ? 1.5 : 0.75, 1, 1);
    dummy.updateMatrix();
    ticks.setMatrixAt(index, dummy.matrix);
  }
  ticks.instanceMatrix.needsUpdate = true;
  pivot.add(ring, ticks);
  root.add(pivot);

  const supportGeometry = mergeParts([
    { geometry: cylinderBetweenGeometry(new THREE.Vector3(-0.22, 0.24, -0.12), new THREE.Vector3(-0.37, 0.92, 0.02), 0.014, 8) },
    { geometry: cylinderBetweenGeometry(new THREE.Vector3(0.24, 0.26, -0.08), new THREE.Vector3(0.36, 0.86, -0.12), 0.014, 8) },
    { geometry: cylinderBetweenGeometry(new THREE.Vector3(0.03, 0.2, 0.19), new THREE.Vector3(0.08, 0.77, 0.38), 0.012, 8) },
  ]);
  const supports = prepare(new THREE.Mesh(supportGeometry, materials.structuralIron), selectableId, 'WELL__ORBITAL_RING_STRUCTURAL_COLUMNS');
  root.add(supports);
  root.updateMatrixWorld(true);
  pivot.attach(supports);
  return { ringPivot: pivot, ringTicks: ticks };
}

function createWaterSheets(root: THREE.Group, selectableId: string) {
  const material = new THREE.MeshPhysicalMaterial({ name: 'Well thin engineered water sheets', color: '#5b7770', transparent: true, opacity: 0.58, roughness: 0.12, transmission: 0.22, depthWrite: false, side: THREE.DoubleSide });
  const sheets = prepare(new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.34, 1, 6), material, 4), selectableId, 'WELL__THIN_PLINTH_WATER_SHEETS', false);
  const transforms = [
    { position: new THREE.Vector3(0.04, 0.39, 0.206), rotation: new THREE.Euler(0, 0, 0), scale: new THREE.Vector3(1, 1, 1) },
    { position: new THREE.Vector3(-0.206, 0.38, -0.02), rotation: new THREE.Euler(0, Math.PI / 2, 0), scale: new THREE.Vector3(0.8, 0.86, 1) },
    { position: new THREE.Vector3(0.207, 0.43, 0.04), rotation: new THREE.Euler(0, -Math.PI / 2, 0), scale: new THREE.Vector3(0.72, 0.7, 1) },
    { position: new THREE.Vector3(-0.03, 0.47, -0.118), rotation: new THREE.Euler(0, Math.PI, 0), scale: new THREE.Vector3(0.58, 0.52, 1) },
  ];
  transforms.forEach((transform, index) => {
    dummy.position.copy(transform.position);
    dummy.rotation.copy(transform.rotation);
    dummy.scale.copy(transform.scale);
    dummy.updateMatrix();
    sheets.setMatrixAt(index, dummy.matrix);
  });
  sheets.instanceMatrix.needsUpdate = true;

  const drips = prepare(new THREE.InstancedMesh(new THREE.SphereGeometry(0.008, 6, 5), material, 14), selectableId, 'WELL__RESIDUAL_WATER_DRIPS', false);
  for (let index = 0; index < 14; index += 1) {
    const side = index % 4;
    const angle = side * Math.PI / 2;
    dummy.position.set(Math.sin(angle) * (0.19 + (index % 3) * 0.01), 0.2 + (index % 5) * 0.045, Math.cos(angle) * (0.19 + (index % 3) * 0.01));
    dummy.scale.set(0.72, 1.6, 0.72);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    drips.setMatrixAt(index, dummy.matrix);
  }
  drips.instanceMatrix.needsUpdate = true;
  root.add(sheets, drips);
  return { waterSheets: sheets, residualDrips: drips, waterSheetTransforms: transforms };
}

function createScientificEngravings(root: THREE.Group, selectableId: string, materials: Record<MaterialKey, THREE.MeshStandardMaterial>) {
  const group = new THREE.Group();
  group.name = 'WELL__SCIENTIFIC_AND_ARCHITECTURAL_ENGRAVINGS';
  const engravingMaterial = materials.brass.clone();
  engravingMaterial.name = 'Well interactive scientific engraving brass';
  const constructionLines = prepare(new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.006, 1.55), engravingMaterial, 8), selectableId, 'WELL__COORDINATE_AND_SOLSTICE_LINES', false);
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI / 4;
    dummy.position.set(0, 0.032, 0);
    dummy.rotation.set(0, angle, 0);
    dummy.scale.set(index % 2 ? 0.52 : 0.72, 1, 1);
    dummy.updateMatrix();
    constructionLines.setMatrixAt(index, dummy.matrix);
  }
  constructionLines.instanceMatrix.needsUpdate = true;

  const pins = prepare(new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.014, 8), engravingMaterial, 32), selectableId, 'WELL__CONSTELLATION_KNOWLEDGE_NETWORK_PINS', false);
  const random = seededRandom(0x5e5a7);
  for (let index = 0; index < 32; index += 1) {
    const angle = (index / 32) * Math.PI * 2 + random() * 0.08;
    const radius = 0.91 + (index % 4) * 0.07;
    dummy.position.set(Math.cos(angle) * radius, 0.04, Math.sin(angle) * radius);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(index % 5 === 0 ? 1.4 : 0.75, 1, index % 5 === 0 ? 1.4 : 0.75);
    dummy.updateMatrix();
    pins.setMatrixAt(index, dummy.matrix);
  }
  pins.instanceMatrix.needsUpdate = true;

  const plaqueMaterial = new THREE.MeshStandardMaterial({ name: 'Well engraved university plaque', map: createPlaqueTexture(), color: '#b29355', roughness: 0.47, metalness: 0.68 });
  const plaque = prepare(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.17, 0.018), plaqueMaterial), selectableId, 'WELL__TITLE_AND_DEDICATION_PLAQUE');
  plaque.position.set(-0.78, 0.18, 0.63);
  plaque.rotation.y = 0.42;
  plaque.userData.fountainPlaque = true;
  const post = prepare(new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.33, 0.025), materials.iron), selectableId, 'WELL__PLAQUE_POST');
  post.position.set(-0.78, 0.08, 0.63);
  post.rotation.y = 0.42;

  const halo = new THREE.Group();
  halo.name = 'WELL__ENGRAVING_HIGHLIGHT_HALO';
  const haloMaterial = new THREE.MeshBasicMaterial({ name: 'Well engraving inspection highlight', color: '#f3bf61', transparent: true, opacity: 0.42, depthWrite: false, toneMapped: false });
  const haloRing = prepare(new THREE.Mesh(new THREE.RingGeometry(0.82, 0.85, 64), haloMaterial), selectableId, 'WELL__ENGRAVING_HIGHLIGHT_RING', false);
  haloRing.rotation.x = -Math.PI / 2;
  haloRing.position.y = 0.078;
  halo.add(haloRing);
  halo.visible = false;
  group.add(constructionLines, pins, plaque, post, halo);
  root.add(group);
  return { engravings: group, engravingMaterial, engravingHalo: halo };
}

function createGeometryGrid(root: THREE.Group, selectableId: string, materials: Record<MaterialKey, THREE.MeshStandardMaterial>) {
  const group = new THREE.Group();
  group.name = 'WELL__UNDERLYING_GEOMETRIC_CONSTRUCTION_GRID';
  group.visible = false;
  const lineMaterial = new THREE.LineBasicMaterial({ name: 'Well construction grid', color: '#d6b361', transparent: true, opacity: 0.72, depthTest: false });
  const vertices: number[] = [];
  for (let index = -10; index <= 10; index += 1) {
    const offset = index * 0.1;
    vertices.push(-1.1, 0.085, offset, 1.1, 0.085, offset, offset, 0.085, -1.1, offset, 0.085, 1.1);
  }
  for (let radiusIndex = 1; radiusIndex <= 5; radiusIndex += 1) {
    const radius = radiusIndex * 0.18;
    for (let segment = 0; segment < 48; segment += 1) {
      const a = segment / 48 * Math.PI * 2;
      const b = (segment + 1) / 48 * Math.PI * 2;
      vertices.push(Math.cos(a) * radius, 0.086, Math.sin(a) * radius, Math.cos(b) * radius, 0.086, Math.sin(b) * radius);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const lines = new THREE.LineSegments(geometry, lineMaterial);
  lines.name = 'WELL__GRID_AXES_ORBITS_AND_CONSTRUCTION_LINES';
  lines.userData.selectableId = selectableId;
  lines.renderOrder = 760;
  group.add(lines);
  root.add(group);
  return group;
}

function createWeatheringDetails(root: THREE.Group, selectableId: string, materials: Record<MaterialKey, THREE.MeshStandardMaterial>) {
  const group = new THREE.Group();
  group.name = 'WELL__FINE_WEATHERING_AND_SURFACE_DETAILS';
  const moss = prepare(new THREE.InstancedMesh(new THREE.BoxGeometry(0.085, 0.009, 0.018), materials.moss, 18), selectableId, 'WELL__MOSS_IN_SHADED_JOINTS', false);
  const mineral = prepare(new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.16, 0.012), materials.mineral, 14), selectableId, 'WELL__PALE_MINERAL_WATER_STREAKS', false);
  for (let index = 0; index < 18; index += 1) {
    const angle = index / 18 * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * 0.73, 0.079, Math.sin(angle) * 0.52);
    dummy.rotation.set(0, -angle, 0);
    dummy.scale.set(0.6 + (index % 4) * 0.16, 1, 1);
    dummy.updateMatrix();
    moss.setMatrixAt(index, dummy.matrix);
  }
  for (let index = 0; index < 14; index += 1) {
    const angle = index / 14 * Math.PI * 2;
    dummy.position.set(Math.sin(angle) * 0.205, 0.39 + (index % 3) * 0.045, Math.cos(angle) * 0.205);
    dummy.rotation.set(0, angle, 0);
    dummy.scale.set(0.65 + (index % 4) * 0.1, 0.65 + (index % 5) * 0.08, 1);
    dummy.updateMatrix();
    mineral.setMatrixAt(index, dummy.matrix);
  }
  moss.instanceMatrix.needsUpdate = true;
  mineral.instanceMatrix.needsUpdate = true;
  group.add(moss, mineral);
  root.add(group);
  return group;
}

function createSceneEnvironment(root: THREE.Group, selectableId: string) {
  const presentation = new THREE.Group();
  presentation.name = 'WELL__MUSEUM_WHITE_PRESENTATION_ENVIRONMENT';
  presentation.visible = false;
  const white = new THREE.MeshStandardMaterial({ name: 'Well museum white cyclorama', color: '#f3f3f0', roughness: 0.92, side: THREE.BackSide });
  const whiteFloor = white.clone();
  whiteFloor.name = 'Well museum white two-sided floor';
  whiteFloor.side = THREE.DoubleSide;
  // The studio floor masks the surrounding autumn court but leaves the full
  // polygonal basin open. A solid disc sat above the recessed water and hid
  // the channels in the top-down presentation camera.
  const floorShape = new THREE.Shape();
  floorShape.absarc(0, 0, 2.55, 0, Math.PI * 2, false);
  const basinOpening = new THREE.Path();
  basinPoints().slice().reverse().forEach((point, index) => {
    const x = point.x * 1.03;
    const z = point.y * 1.03;
    if (index === 0) basinOpening.moveTo(x, z);
    else basinOpening.lineTo(x, z);
  });
  basinOpening.closePath();
  floorShape.holes.push(basinOpening);
  const floor = prepare(new THREE.Mesh(new THREE.ShapeGeometry(floorShape, 64), whiteFloor), selectableId, 'WELL__MUSEUM_WHITE_FLOOR', false);
  floor.rotation.x = -Math.PI / 2;
  // Sit just above the host court so the white presentation floor reliably
  // masks the autumn plaza instead of disappearing beneath it.
  floor.position.y = 0.026;
  floor.receiveShadow = true;
  const wall = prepare(new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 2.9, 64, 1, true, Math.PI * 0.12, Math.PI * 1.76), white), selectableId, 'WELL__MUSEUM_WHITE_CYCLORAMA', false);
  wall.position.y = 1.28;
  const fill = new THREE.HemisphereLight('#ffffff', '#c6c6c2', 2.2);
  fill.name = 'WELL__PRESENTATION_SOFT_STUDIO_LIGHT';
  const presentationKey = new THREE.SpotLight('#fffaf0', 2.4, 6, Math.PI * 0.22, 0.58, 1.1);
  presentationKey.name = 'WELL__PRESENTATION_SHADOW_KEY';
  presentationKey.position.set(1.35, 2.35, 1.55);
  presentationKey.target.position.set(0, 0.52, 0);
  presentationKey.castShadow = true;
  presentationKey.shadow.bias = -0.00018;
  presentationKey.shadow.normalBias = 0.015;
  presentationKey.shadow.mapSize.set(1024, 1024);
  presentation.add(floor, wall, fill, presentationKey, presentationKey.target);
  root.add(presentation);

  const rainAndMist = new THREE.Group();
  rainAndMist.name = 'WELL__LOCAL_RAIN_AND_LOW_MIST';
  rainAndMist.visible = false;
  const rainPositions = new Float32Array(120 * 3);
  const random = seededRandom(0x1f1a17e);
  for (let index = 0; index < 120; index += 1) {
    rainPositions[index * 3] = (random() - 0.5) * 2.5;
    rainPositions[index * 3 + 1] = 0.1 + random() * 2;
    rainPositions[index * 3 + 2] = (random() - 0.5) * 2.2;
  }
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rain = new THREE.Points(rainGeometry, new THREE.PointsMaterial({ name: 'Well fine rain', color: '#9cafb7', size: 0.008, transparent: true, opacity: 0.38, depthWrite: false }));
  rain.name = 'WELL__FINE_RAIN_POINTS';
  const mistMaterial = new THREE.MeshBasicMaterial({ name: 'Well low basin mist', color: '#7f9291', transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide });
  const mist = prepare(new THREE.Mesh(new THREE.RingGeometry(0.42, 0.94, 64), mistMaterial), selectableId, 'WELL__LOW_CONTROLLED_MIST', false);
  mist.rotation.x = -Math.PI / 2;
  mist.position.y = 0.105;
  rainAndMist.add(rain, mist);
  root.add(rainAndMist);
  return { presentation, presentationKey, rainAndMist, rain };
}

function createCutaway(root: THREE.Group, selectableId: string) {
  const group = new THREE.Group();
  group.name = 'WELL__INTERNAL_WATER_SYSTEM_CUTAWAY';
  group.visible = false;
  const water = new THREE.MeshBasicMaterial({ name: 'Well cutaway reservoir water', color: '#4d8e85', transparent: true, opacity: 0.42, depthTest: false });
  const pipe = new THREE.MeshBasicMaterial({ name: 'Well cutaway brass pipework', color: '#d09d4c', transparent: true, opacity: 0.9, depthTest: false });
  const reservoir = prepare(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.24, 16, 1, true), water), selectableId, 'WELL__UNDERGROUND_RECIRCULATION_RESERVOIR', false);
  reservoir.position.y = -0.14;
  const riser = prepare(new THREE.Mesh(cylinderBetweenGeometry(new THREE.Vector3(0, -0.22, 0), new THREE.Vector3(0, 0.48, 0), 0.018, 8), pipe), selectableId, 'WELL__CENTRAL_PRESSURE_RISER', false);
  const radialPipes = prepare(new THREE.InstancedMesh(new THREE.CylinderGeometry(0.01, 0.01, 0.72, 7), pipe, 8), selectableId, 'WELL__EIGHT_RADIAL_RETURN_PIPES', false);
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI / 4;
    dummy.position.set(Math.sin(angle) * 0.35, -0.08, Math.cos(angle) * 0.35);
    dummy.rotation.set(Math.PI / 2, 0, -angle);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    radialPipes.setMatrixAt(index, dummy.matrix);
  }
  radialPipes.instanceMatrix.needsUpdate = true;
  group.add(reservoir, riser, radialPipes);
  root.add(group);
  return group;
}

function createRestorationComparison(
  root: THREE.Group,
  selectableId: string,
  sources: THREE.Object3D[],
) {
  const group = new THREE.Group();
  group.name = 'WELL__CLEAN_WEATHERED_RESTORATION_COMPARISON';
  group.visible = false;
  const dividerMaterial = new THREE.MeshBasicMaterial({ name: 'Well restoration comparison divider', color: '#e4cf8a', transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
  const divider = prepare(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.75), dividerMaterial), selectableId, 'WELL__RESTORATION_SPLIT_PLANE', false);
  divider.position.set(0.82, 0.8, 0);
  divider.rotation.y = Math.PI / 2;

  // A physically separate, cleaned conservation reference uses the same
  // structural geometry as the live monument. The live original remains on
  // the weathered side, making this a real side-by-side comparison rather
  // than a token material swatch.
  const cleanReference = new THREE.Group();
  cleanReference.name = 'WELL__CLEAN_RESTORED_MONUMENT_REFERENCE';
  cleanReference.position.set(1.45, 0.02, -0.08);
  cleanReference.scale.setScalar(0.56);
  sources.forEach((source) => {
    const clone = source.clone(true);
    clone.traverse((object) => {
      object.name = `${object.name || 'WELL_PART'}__CLEAN_RESTORED`;
      delete object.userData.selectableId;
      delete object.userData.navObstacle;
      delete object.userData.walkable;
      if (!(object instanceof THREE.Mesh)) return;
      const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
      const cleanMaterials = sourceMaterials.map((sourceMaterial) => {
        const clean = sourceMaterial.clone();
        clean.name = `${sourceMaterial.name || 'Well material'} clean restoration reference`;
        if (clean instanceof THREE.MeshStandardMaterial) {
          clean.color.lerp(new THREE.Color(clean.metalness > 0.45 ? '#c4aa72' : '#8b918d'), 0.42);
          clean.roughness = Math.max(0.24, clean.roughness - 0.2);
          clean.map = null;
          clean.bumpMap = null;
          clean.roughnessMap = null;
          clean.metalnessMap = null;
          clean.normalMap = null;
        }
        return clean;
      });
      object.material = Array.isArray(object.material) ? cleanMaterials : cleanMaterials[0];
      object.castShadow = false;
    });
    cleanReference.add(clone);
  });
  cleanReference.userData.restorationComparisonSide = 'newly commissioned clean reference';

  const makeLabel = (label: string, position: THREE.Vector3) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 112;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#171916';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#a88749';
    context.lineWidth = 8;
    context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    context.fillStyle = '#e3d7b8';
    context.font = '600 38px Georgia, serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const labelMaterial = new THREE.MeshBasicMaterial({ name: `Well ${label} restoration label`, map: texture, side: THREE.DoubleSide, toneMapped: false });
    const plate = prepare(new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.16), labelMaterial), selectableId, `WELL__${label.replace(/\W+/g, '_').toUpperCase()}_RESTORATION_LABEL`, false);
    plate.position.copy(position);
    plate.rotation.x = -Math.PI / 2;
    return plate;
  };
  group.add(
    divider,
    cleanReference,
    makeLabel('WEATHERED ORIGINAL', new THREE.Vector3(-0.45, 0.115, 0.86)),
    makeLabel('CLEAN REFERENCE', new THREE.Vector3(1.45, 0.115, 0.76)),
  );
  root.add(group);
  return group;
}

function createDebugView(root: THREE.Group, selectableId: string, infinityLight: THREE.PointLight) {
  const group = new THREE.Group();
  group.name = 'WELL__DEBUG_LIGHTS_COLLISIONS_WATER_PATHS_AND_STATS';
  group.visible = false;
  const collisionMaterial = new THREE.LineBasicMaterial({ name: 'Well debug collision lines', color: '#ff4c4c', depthTest: false });
  const waterPathMaterial = new THREE.LineBasicMaterial({ name: 'Well debug water paths', color: '#35d6ff', depthTest: false });
  const collisionPoints = basinPoints();
  const collisionVertices: number[] = [];
  collisionPoints.forEach((point, index) => {
    const next = collisionPoints[(index + 1) % collisionPoints.length];
    collisionVertices.push(point.x, 0.18, point.y, next.x, 0.18, next.y);
  });
  const collisionGeometry = new THREE.BufferGeometry();
  collisionGeometry.setAttribute('position', new THREE.Float32BufferAttribute(collisionVertices, 3));
  const collisionLines = new THREE.LineSegments(collisionGeometry, collisionMaterial);
  collisionLines.name = 'WELL__DEBUG_COLLISION_PERIMETER';
  collisionLines.userData.selectableId = selectableId;
  const flowVertices: number[] = [];
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI / 4;
    flowVertices.push(0, 0.2, 0, Math.sin(angle) * 0.72, 0.08, Math.cos(angle) * 0.72);
  }
  const flowGeometry = new THREE.BufferGeometry();
  flowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(flowVertices, 3));
  const flowLines = new THREE.LineSegments(flowGeometry, waterPathMaterial);
  flowLines.name = 'WELL__DEBUG_WATER_PATHS';
  flowLines.userData.selectableId = selectableId;
  const lightMarkerMaterial = new THREE.MeshBasicMaterial({ name: 'Well debug light marker', color: '#ffcf63', wireframe: true, depthTest: false });
  const lightMarker = prepare(new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 7), lightMarkerMaterial), selectableId, 'WELL__DEBUG_INFINITY_LIGHT_MARKER', false);
  lightMarker.position.copy(infinityLight.position);

  const statsCanvas = document.createElement('canvas');
  statsCanvas.width = 640;
  statsCanvas.height = 240;
  const statsTexture = new THREE.CanvasTexture(statsCanvas);
  statsTexture.colorSpace = THREE.SRGBColorSpace;
  const stats = new THREE.Sprite(new THREE.SpriteMaterial({ map: statsTexture, transparent: true, depthTest: false, toneMapped: false }));
  stats.name = 'WELL__DEBUG_LIVE_SCENE_STATISTICS';
  stats.position.set(-0.93, 1.45, 0.02);
  stats.scale.set(0.95, 0.36, 1);
  debugStatsAssets.set(group, { canvas: statsCanvas, texture: statsTexture });
  group.add(collisionLines, flowLines, lightMarker, stats);
  root.add(group);
  return group;
}

function updateDebugStatsReadout(debug: THREE.Group, values: { meshCount: number; instancedMeshCount: number; pointLightCount: number; triangleCount: number }) {
  const assets = debugStatsAssets.get(debug);
  const canvas = assets?.canvas;
  const texture = assets?.texture;
  const context = canvas?.getContext('2d');
  if (!canvas || !texture || !context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(10, 15, 15, 0.92)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#b08b4f';
  context.lineWidth = 6;
  context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
  context.fillStyle = '#efe7cf';
  context.font = '600 38px Georgia, serif';
  context.fillText('WELL / LIVE SCENE STATISTICS', 30, 58);
  context.font = '30px ui-monospace, monospace';
  context.fillStyle = '#bfc8bf';
  context.fillText(`MESH ${values.meshCount}   INSTANCED ${values.instancedMeshCount}`, 30, 124);
  context.fillText(`LIGHT ${values.pointLightCount}   TRI ${values.triangleCount.toLocaleString()}`, 30, 178);
  texture.needsUpdate = true;
}

function collectFountainStats(root: THREE.Object3D, visibleOnly = false) {
  let meshCount = 0;
  let instancedMeshCount = 0;
  let pointLightCount = 0;
  let triangleCount = 0;
  const isActuallyVisible = (object: THREE.Object3D) => {
    let cursor: THREE.Object3D | null = object;
    while (cursor) {
      if (!cursor.visible) return false;
      if (cursor === root) return true;
      cursor = cursor.parent;
    }
    return false;
  };
  root.traverse((object) => {
    if (visibleOnly && !isActuallyVisible(object)) return;
    if (object instanceof THREE.Mesh) {
      meshCount += 1;
      if (object instanceof THREE.InstancedMesh) instancedMeshCount += 1;
      const indexCount = object.geometry.index?.count ?? object.geometry.getAttribute('position')?.count ?? 0;
      triangleCount += Math.floor(indexCount / 3) * (object instanceof THREE.InstancedMesh ? object.count : 1);
    }
    if (object instanceof THREE.PointLight) pointLightCount += 1;
  });
  return { meshCount, instancedMeshCount, pointLightCount, triangleCount };
}

function updateDebugCollisionView(
  debug: THREE.Group,
  segments: Array<{ start: number[]; end: number[]; radius: number }>,
) {
  const collisionLines = debug.getObjectByName('WELL__DEBUG_COLLISION_PERIMETER');
  if (!(collisionLines instanceof THREE.LineSegments)) return;
  const vertices = segments.flatMap((segment) => [...segment.start, ...segment.end]);
  collisionLines.geometry.dispose();
  collisionLines.geometry = new THREE.BufferGeometry();
  collisionLines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  collisionLines.name = 'WELL__DEBUG_ACTUAL_BASIN_APPROACH_AND_PLINTH_COLLISIONS';
}

function applyStatueMaterial(runtime: FountainRuntime) {
  const definition = ACADEMIC_FOUNTAIN_STATUE_MATERIALS.find((entry) => entry.id === runtime.state.statueMaterial)!;
  const lookup: Record<string, THREE.MeshStandardMaterial> = {
    'patinated-bronze': runtime.materials.bronze,
    'black-marble': runtime.materials.blackMarble,
    'weathered-dark-limestone': runtime.materials.darkLimestone,
    'tarnished-brass': runtime.materials.brass,
    'engraved-metal': runtime.materials.iron,
  };
  runtime.statueMeshes.forEach(({ mesh, category }) => {
    const materialId = category === 'robe' ? definition.robeMaterial : category === 'skin' ? definition.skinMaterial : definition.accentMaterial;
    mesh.material = lookup[materialId] ?? runtime.materials.darkLimestone;
  });
}

function applyRestoration(runtime: FountainRuntime) {
  const mode = runtime.state.restorationMode;
  runtime.weatherableMaterials.forEach((snapshot) => {
    const clean = mode === 'clean';
    snapshot.material.color.copy(clean ? snapshot.cleanColor : snapshot.weatheredColor);
    snapshot.material.roughness = clean ? snapshot.cleanRoughness : snapshot.weatheredRoughness;
    snapshot.material.needsUpdate = true;
  });
  runtime.restorationComparison.visible = mode === 'comparison';
  runtime.fineDetails.visible = mode !== 'clean' && runtime.state.quality === 'high';
}

function applySceneMode(runtime: FountainRuntime) {
  const mode = runtime.state.sceneMode;
  const definition = ACADEMIC_FOUNTAIN_SCENE_MODES.find((entry) => entry.id === mode)
    ?? ACADEMIC_FOUNTAIN_SCENE_MODES[1];
  runtime.presentation.visible = definition.isolateMonument;
  runtime.presentationKey.intensity = definition.isolateMonument ? definition.keyLightIntensity : 0;
  runtime.rainAndMist.visible = (definition.rain || definition.mist) && runtime.state.quality !== 'low';
  runtime.infinityLight.intensity = runtime.state.infinityLightOn
    ? definition.infinityLightIntensity
    : 0;
  runtime.infinityGlow.material.opacity = runtime.state.infinityLightOn
    ? mode === 'night' ? 0.82 : mode === 'presentation' ? 0.26 : 0.34
    : 0.025;
  const reflectionQuality = runtime.state.quality === 'high' ? 1 : runtime.state.quality === 'medium' ? 0.58 : 0;
  runtime.infinityReflection.material.opacity = (mode === 'night' ? 0.15 : mode === 'presentation' ? 0.055 : 0.085) * reflectionQuality;
  runtime.materials.plaza.roughness = THREE.MathUtils.lerp(0.78, 0.42, definition.wetness);
  runtime.materials.wetStone.roughness = THREE.MathUtils.lerp(0.58, 0.3, definition.wetness);
}

function getRuntime(root: THREE.Object3D) {
  return fountainRuntimes.get(root) ?? null;
}

function syncHydraulicVisuals(runtime: FountainRuntime) {
  runtime.water.material.uniforms.uFlow.value = runtime.state.waterFlow;
  runtime.water.material.uniforms.uRipple.value = runtime.rippleEnergy;
  runtime.channelWater.material.opacity = 0.16 + runtime.state.waterFlow * 0.66;
  runtime.waterSheets.material.opacity = 0.08 + runtime.state.sheetFlow * 0.56;
  const animateDetailedWater = runtime.state.quality !== 'low';
  runtime.waterSheets.visible = animateDetailedWater && runtime.state.sheetFlow > 0.015;
  runtime.residualDrips.visible = animateDetailedWater
    && !runtime.state.waterOn
    && runtime.state.residualDrip > 0.015;
  if (!animateDetailedWater) return;

  runtime.waterSheetTransforms.forEach((transform, index) => {
    dummy.position.copy(transform.position);
    dummy.rotation.copy(transform.rotation);
    dummy.scale.copy(transform.scale);
    dummy.scale.y *= Math.max(0.025, runtime.state.sheetFlow);
    dummy.position.y += (1 - runtime.state.sheetFlow) * 0.13;
    dummy.updateMatrix();
    runtime.waterSheets.setMatrixAt(index, dummy.matrix);
  });
  runtime.waterSheets.instanceMatrix.needsUpdate = true;
}

export function createWellOfInfiniteKnowledge(selectableId: string) {
  const root = new THREE.Group();
  root.name = ACADEMIC_FOUNTAIN_ROOT_NAME;
  root.userData.selectableId = selectableId;
  root.userData.academicFountainHotspot = true;
  root.userData.animate = 'academic-fountain';
  root.userData.fountainMounted = true;
  root.userData.fountainVersion = ACADEMIC_FOUNTAIN_CONFIG.version;
  root.userData.alwaysVisibleCore = true;
  // Geometry is authored with comfortable modelling proportions, then
  // compressed only vertically to the configured 10.8 m civic silhouette.
  // Horizontal dimensions remain the exact 14 x 11.6 m basin footprint.
  root.scale.set(1, 0.7, 1);

  const { materials, snapshots } = createMaterials();
  const plazaDetails = createModernPlaza(root, selectableId, materials);
  const { water, channelWater, pools } = createFountainBasin(root, selectableId, materials);
  createFloatingPlatforms(root, selectableId, materials);
  const plinthInlays = createCentralPlinth(root, selectableId, materials);

  const statueMeshes: StatueMeshRecord[] = [];
  const statueHigh = createSeshatVariant(selectableId, 'high', materials, statueMeshes);
  const statueMedium = createSeshatVariant(selectableId, 'medium', materials, statueMeshes);
  const statueLow = createSeshatVariant(selectableId, 'low', materials, statueMeshes);
  statueHigh.name = 'WELL__SESHAT_HIGH_DETAIL_ORIGINAL_SCULPTURE';
  statueMedium.name = 'WELL__SESHAT_MEDIUM_DETAIL_SCULPTURE';
  statueLow.name = 'WELL__SESHAT_LONG_DISTANCE_SILHOUETTE';
  statueHigh.visible = false;
  statueMedium.visible = true;
  statueLow.visible = false;
  root.add(statueHigh, statueMedium, statueLow);

  const { infinityGlow, infinityReflection, infinityLight, markers: infinityMarkers } = createInfinitySculpture(root, selectableId, materials);
  const { ringPivot, ringTicks } = createOrbitalRing(root, selectableId, materials);
  const { waterSheets, residualDrips, waterSheetTransforms } = createWaterSheets(root, selectableId);
  const { engravings, engravingMaterial, engravingHalo } = createScientificEngravings(root, selectableId, materials);
  const constructionGrid = createGeometryGrid(root, selectableId, materials);
  const fineDetails = createWeatheringDetails(root, selectableId, materials);
  fineDetails.userData.exportAlways = true;
  const { presentation, presentationKey, rainAndMist, rain } = createSceneEnvironment(root, selectableId);
  const cutaway = createCutaway(root, selectableId);
  const restorationSources = [
    root.getObjectByName('WELL__BLACK_STONE_MEASUREMENT_EDGE'),
    root.getObjectByName('WELL__OFFSET_DARK_LIMESTONE_PLINTH'),
    root.getObjectByName('WELL__CANTILEVERED_BLACK_MARBLE_PLANES'),
    statueMedium,
    root.getObjectByName('WELL__STRUCTURAL_BLACKENED_BRONZE_INFINITY'),
    ringPivot,
  ].filter((object): object is THREE.Object3D => object instanceof THREE.Object3D);
  const restorationComparison = createRestorationComparison(root, selectableId, restorationSources);
  const debug = createDebugView(root, selectableId, infinityLight);

  // Close-range conservation and water details share a single distance gate.
  // This keeps the full-island overview comfortably within its draw-call
  // budget while preserving every authored detail at courtyard scale.
  const nearDetails = new THREE.Group();
  nearDetails.name = 'WELL__NEAR_DETAIL_LOD';
  root.add(nearDetails);
  nearDetails.add(
    pools,
    plazaDetails,
    plinthInlays,
    infinityMarkers,
    infinityReflection,
    waterSheets,
    residualDrips,
    engravings,
    fineDetails,
  );

  const state: AcademicFountainState = {
    ...ACADEMIC_FOUNTAIN_CONFIG.defaultState,
    waterFlow: ACADEMIC_FOUNTAIN_CONFIG.defaultState.waterFlow,
    requestedWaterFlow: ACADEMIC_FOUNTAIN_CONFIG.defaultState.waterFlow,
    sheetFlow: ACADEMIC_FOUNTAIN_CONFIG.defaultState.waterFlow,
    residualDrip: 0,
    inspectedSymbolIndex: -1,
    debugVisible: false,
    ringAngle: 0,
    lanternsOn: true,
    floatingLeavesVisible: false,
    coinCount: 0,
  };
  const metadata: AcademicFountainMetadata = {
    version: ACADEMIC_FOUNTAIN_CONFIG.version,
    name: ACADEMIC_FOUNTAIN_TITLE,
    title: ACADEMIC_FOUNTAIN_TITLE,
    dedication: ACADEMIC_FOUNTAIN_CONFIG.dedication,
    history: ACADEMIC_FOUNTAIN_HISTORY,
    patron: ACADEMIC_FOUNTAIN_CONFIG.patron,
    diameterMetres: ACADEMIC_FOUNTAIN_DIMENSIONS_METRES.basinWidth,
    basinWidthMetres: ACADEMIC_FOUNTAIN_DIMENSIONS_METRES.basinWidth,
    basinDepthMetres: ACADEMIC_FOUNTAIN_DIMENSIONS_METRES.basinDepth,
    centralHeightMetres: ACADEMIC_FOUNTAIN_DIMENSIONS_METRES.totalHeight,
    statueHeightMetres: ACADEMIC_FOUNTAIN_DIMENSIONS_METRES.statueHeight,
    infinityWidthMetres: ACADEMIC_FOUNTAIN_DIMENSIONS_METRES.infinityWidth,
    orbitalRingDiameterMetres: ACADEMIC_FOUNTAIN_DIMENSIONS_METRES.orbitalRingDiameter,
    spoutCount: 0,
    scholar: 'An original contemporary Seshat, patron of writing, measurement, architecture, mathematics, memory, and scientific documentation',
    materials: ACADEMIC_FOUNTAIN_CONFIG.materials.map((material) => material.label),
    symbols: ACADEMIC_FOUNTAIN_SCIENTIFIC_SYMBOLS.map((symbol) => ({ ...symbol })),
    sceneModes: ACADEMIC_FOUNTAIN_SCENE_MODES.map(({ id, label, description }) => ({ id, label, description })),
    cameraPresets: ACADEMIC_FOUNTAIN_CAMERA_PRESETS.map(({ id, label, description }) => ({ id, label, description })),
    restorationModes: ACADEMIC_FOUNTAIN_RESTORATION_MODES.map(({ id, label, description }) => ({ id, label, description })),
    interactions: [...ACADEMIC_FOUNTAIN_CONTEXTUAL_INTERACTIONS],
    performance: {
      instancedFeatures: ['radial channels', 'reflecting pools', 'floating platforms', 'hidden supports', 'measurement inlays', 'orbital ticks', 'infinity markers', 'water sheets', 'residual drips', 'coordinate lines', 'knowledge-network pins', 'moss joints', 'mineral streaks', 'cutaway pipes'],
      waterTechnique: 'single bounded procedural mirror-water shader plus instanced channels, sheets, residual drips, and quality-scaled ripple motion',
      lodLevels: 3,
    },
  };
  root.userData.academicFountain = metadata;
  root.userData.academicFountainState = state;
  root.userData.fountainSeatPoints = [
    [-0.92, 0.12, 0.28],
    [0.91, 0.12, -0.25],
  ];
  const points = basinPoints();
  const southernCorner = points[7];
  const southernLeft = points[8];
  const accessOpeningRightX = 0.1;
  const accessOpeningAlpha = (southernCorner.x - accessOpeningRightX) / (southernCorner.x - southernLeft.x);
  const accessOpeningRight = southernCorner.clone().lerp(southernLeft, accessOpeningAlpha);
  const perimeterBarriers = points.flatMap((point, index) => {
    const next = points[(index + 1) % points.length];
    // Only a 3.8 m opening remains at the southern platform approach. The
    // former two-edge omission left an 8.5 m gap into the water.
    if (index === 7) {
      return [{ start: [point.x, 0.14, point.y], end: [accessOpeningRight.x, 0.14, accessOpeningRight.y], radius: 0.052 }];
    }
    return [{ start: [point.x, 0.14, point.y], end: [next.x, 0.14, next.y], radius: 0.052 }];
  });
  const approachSideBarriers = [
    { start: [southernLeft.x, 0.14, southernLeft.y], end: [-0.4, 0.14, 0.25], radius: 0.045 },
    { start: [accessOpeningRight.x, 0.14, accessOpeningRight.y], end: [0.36, 0.14, 0.25], radius: 0.045 },
  ];
  const plinthFootprint = [
    new THREE.Vector2(-0.33, -0.25),
    new THREE.Vector2(0.34, -0.25),
    new THREE.Vector2(0.34, 0.24),
    new THREE.Vector2(-0.33, 0.24),
  ];
  const plinthBarriers = plinthFootprint.map((point, index) => {
    const next = plinthFootprint[(index + 1) % plinthFootprint.length];
    return { start: [point.x, 0.22, point.y], end: [next.x, 0.22, next.y], radius: 0.055 };
  });
  root.userData.navBarrierSegments = [...perimeterBarriers, ...approachSideBarriers, ...plinthBarriers];
  updateDebugCollisionView(debug, root.userData.navBarrierSegments);

  const runtime: FountainRuntime = {
    root,
    state,
    materials,
    weatherableMaterials: snapshots,
    water,
    channelWater,
    waterSheets,
    residualDrips,
    infinityGlow,
    infinityReflection,
    infinityLight,
    engravingMaterial,
    engravingHalo,
    constructionGrid,
    ringPivot,
    ringTicks,
    statueHigh,
    statueMedium,
    statueLow,
    statueMeshes,
    fineDetails,
    nearDetails,
    rainAndMist,
    rain,
    presentation,
    presentationKey,
    cutaway,
    restorationComparison,
    debug,
    targetFlow: state.requestedWaterFlow,
    rippleEnergy: 0.35,
    lastDebugStatsSecond: -1,
    waterSheetTransforms,
  };
  fountainRuntimes.set(root, runtime);
  applyStatueMaterial(runtime);
  applyRestoration(runtime);
  applySceneMode(runtime);
  const debugStats = collectFountainStats(root);
  root.userData.fountainDebugStats = debugStats;
  updateDebugStatsReadout(debug, debugStats);
  return root;
}

// Retain the previous factory name as a compatibility alias for callers and
// older exported project metadata while constructing the new monument.
export const createAcademicGothicFountain = createWellOfInfiniteKnowledge;

export function getAcademicFountainState(root: THREE.Object3D) {
  return getRuntime(root)?.state ?? null;
}

/**
 * Restore runtime values without replaying UI actions. New saves can resume a
 * partially settled hydraulic system and an inspected ring angle exactly;
 * callers provide normalized legacy fallbacks for fields older saves omitted.
 */
export function restoreAcademicFountainRuntimeSnapshot(
  root: THREE.Object3D,
  snapshot: AcademicFountainRuntimeSnapshot,
) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  const clampFlow = (value: number) => THREE.MathUtils.clamp(Number.isFinite(value) ? value : 0, 0, 1);
  const requestedWaterFlow = clampFlow(snapshot.requestedWaterFlow);
  runtime.state.requestedWaterFlow = requestedWaterFlow;
  runtime.state.waterOn = Boolean(snapshot.waterOn) && requestedWaterFlow > 0.001;
  runtime.state.waterFlow = clampFlow(snapshot.waterFlow);
  runtime.state.sheetFlow = clampFlow(snapshot.sheetFlow);
  runtime.state.residualDrip = clampFlow(snapshot.residualDrip);
  runtime.targetFlow = runtime.state.waterOn ? requestedWaterFlow : 0;
  runtime.state.ringRotating = Boolean(snapshot.ringRotating);
  runtime.state.ringAngle = Number.isFinite(snapshot.ringAngle) ? snapshot.ringAngle : 0;
  runtime.ringPivot.rotation.y = 0.18 + runtime.state.ringAngle;
  syncHydraulicVisuals(runtime);
  return runtime.state;
}

export function setAcademicFountainWater(root: THREE.Object3D, on: boolean) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  if (on) {
    // Zero is the explicit stopped state. Starting from zero resumes the
    // configured ceremonial flow and updates the reported/requested value too;
    // every positive 1-100% setting otherwise remains exact with no hidden
    // visual floor.
    if (runtime.state.requestedWaterFlow <= 0.001) {
      runtime.state.requestedWaterFlow = ACADEMIC_FOUNTAIN_CONFIG.defaultState.waterFlow;
    }
    runtime.state.waterOn = true;
    runtime.targetFlow = runtime.state.requestedWaterFlow;
  } else {
    runtime.state.waterOn = false;
    runtime.targetFlow = 0;
    runtime.state.residualDrip = 1;
  }
  runtime.rippleEnergy = Math.max(runtime.rippleEnergy, on ? 0.55 : 0.3);
  return runtime.state;
}

export function adjustAcademicFountainWaterFlow(root: THREE.Object3D, amount: number) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  runtime.state.requestedWaterFlow = THREE.MathUtils.clamp(runtime.state.requestedWaterFlow + amount, 0, 1);
  runtime.state.waterOn = runtime.state.requestedWaterFlow > 0.001;
  runtime.targetFlow = runtime.state.requestedWaterFlow;
  if (!runtime.state.waterOn) runtime.state.residualDrip = 1;
  return runtime.state;
}

export function toggleAcademicFountainInfinityLight(root: THREE.Object3D) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  runtime.state.infinityLightOn = !runtime.state.infinityLightOn;
  runtime.state.lanternsOn = runtime.state.infinityLightOn;
  applySceneMode(runtime);
  return runtime.state;
}

export function toggleAcademicFountainEngravings(root: THREE.Object3D) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  runtime.state.engravingsHighlighted = !runtime.state.engravingsHighlighted;
  runtime.engravingHalo.visible = runtime.state.engravingsHighlighted;
  runtime.engravingMaterial.emissive.set(runtime.state.engravingsHighlighted ? '#9d6722' : '#000000');
  runtime.engravingMaterial.emissiveIntensity = runtime.state.engravingsHighlighted ? 1.2 : 0;
  return runtime.state;
}

export function inspectNextAcademicFountainSymbol(root: THREE.Object3D) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  runtime.state.inspectedSymbolIndex = (runtime.state.inspectedSymbolIndex + 1) % ACADEMIC_FOUNTAIN_SCIENTIFIC_SYMBOLS.length;
  return ACADEMIC_FOUNTAIN_SCIENTIFIC_SYMBOLS[runtime.state.inspectedSymbolIndex];
}

export function toggleAcademicFountainCutaway(root: THREE.Object3D) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  runtime.state.cutawayVisible = !runtime.state.cutawayVisible;
  runtime.cutaway.visible = runtime.state.cutawayVisible;
  return runtime.state;
}

export function toggleAcademicFountainGeometryGrid(root: THREE.Object3D) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  runtime.state.geometryGridVisible = !runtime.state.geometryGridVisible;
  runtime.constructionGrid.visible = runtime.state.geometryGridVisible;
  return runtime.state;
}

export function toggleAcademicFountainRingRotation(root: THREE.Object3D) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  runtime.state.ringRotating = !runtime.state.ringRotating;
  return runtime.state;
}

export function cycleAcademicFountainStatueMaterial(root: THREE.Object3D) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  const modes: AcademicFountainStatueMaterialMode[] = ['bronze', 'dark-stone', 'hybrid'];
  runtime.state.statueMaterial = modes[(modes.indexOf(runtime.state.statueMaterial) + 1) % modes.length];
  applyStatueMaterial(runtime);
  return runtime.state;
}

export function cycleAcademicFountainRestoration(root: THREE.Object3D) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  const modes: AcademicFountainRestorationMode[] = ['weathered', 'clean', 'comparison'];
  const currentIndex = modes.indexOf(runtime.state.restorationMode as AcademicFountainRestorationMode);
  runtime.state.restorationMode = modes[(Math.max(-1, currentIndex) + 1) % modes.length];
  applyRestoration(runtime);
  return runtime.state;
}

export function cycleAcademicFountainSceneMode(root: THREE.Object3D) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  const modes: AcademicFountainSceneMode[] = ['presentation', 'courtyard', 'night'];
  runtime.state.sceneMode = modes[(modes.indexOf(runtime.state.sceneMode) + 1) % modes.length];
  applySceneMode(runtime);
  return runtime.state;
}

export function cycleAcademicFountainCameraPreset(root: THREE.Object3D) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  const presets: AcademicFountainCameraPresetId[] = ['hero', 'low-angle', 'top-down', 'side-profile'];
  runtime.state.cameraPreset = presets[(presets.indexOf(runtime.state.cameraPreset) + 1) % presets.length];
  return runtime.state;
}

export function resetAcademicFountainCameraPreset(root: THREE.Object3D) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  runtime.state.cameraPreset = 'hero';
  return runtime.state;
}

export function toggleAcademicFountainDebug(root: THREE.Object3D) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  runtime.state.debugVisible = !runtime.state.debugVisible;
  runtime.debug.visible = runtime.state.debugVisible;
  return runtime.state;
}

export function getAcademicFountainCameraPose(root: THREE.Object3D, presetId?: AcademicFountainCameraPresetId) {
  const runtime = getRuntime(root);
  const id = presetId ?? runtime?.state.cameraPreset ?? 'hero';
  const preset = ACADEMIC_FOUNTAIN_CAMERA_PRESETS.find((entry) => entry.id === id) ?? ACADEMIC_FOUNTAIN_CAMERA_PRESETS[0];
  root.updateMatrixWorld(true);
  const origin = root.getWorldPosition(new THREE.Vector3());
  const orientation = root.getWorldQuaternion(new THREE.Quaternion());
  const position = new THREE.Vector3(...preset.positionMetres)
    .multiplyScalar(WORLD_UNITS_PER_METRE)
    .applyQuaternion(orientation)
    .add(origin);
  const target = new THREE.Vector3(...preset.targetMetres)
    .multiplyScalar(WORLD_UNITS_PER_METRE)
    .applyQuaternion(orientation)
    .add(origin);
  return {
    id: preset.id,
    label: preset.label,
    position,
    target,
    up: new THREE.Vector3(...preset.up),
    fieldOfView: preset.fieldOfView,
  };
}

// Compatibility affordances retained for old saved interaction lists.
export function throwAcademicFountainCoin(root: THREE.Object3D) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  runtime.rippleEnergy = 1;
  runtime.state.coinCount += 1;
  return runtime.state;
}

export function toggleAcademicFountainLeaves(root: THREE.Object3D) {
  const runtime = getRuntime(root);
  if (!runtime) return null;
  runtime.state.floatingLeavesVisible = !runtime.state.floatingLeavesVisible;
  return runtime.state;
}

export function toggleAcademicFountainLanterns(root: THREE.Object3D) {
  return toggleAcademicFountainInfinityLight(root);
}

export function configureAcademicFountainQuality(root: THREE.Object3D, quality: AcademicFountainQuality) {
  const runtime = getRuntime(root);
  if (!runtime) return;
  runtime.state.quality = quality;
  const preset = ACADEMIC_FOUNTAIN_QUALITY_PRESETS.find((entry) => entry.id === quality)
    ?? ACADEMIC_FOUNTAIN_QUALITY_PRESETS[1];
  runtime.water.material.uniforms.uQuality.value = quality === 'low' ? 0 : quality === 'medium' ? 0.62 : 1;
  runtime.infinityReflection.visible = quality !== 'low';
  runtime.fineDetails.visible = quality === 'high' && runtime.state.restorationMode !== 'clean';
  runtime.rainAndMist.visible = runtime.state.sceneMode === 'night' && quality !== 'low';
  const configureShadow = (light: THREE.SpotLight | THREE.PointLight, enabled: boolean, size: number) => {
    const shadow = light.shadow;
    const resolutionChanged = shadow.mapSize.x !== size || shadow.mapSize.y !== size;
    if (resolutionChanged || !enabled) {
      shadow.map?.dispose();
      shadow.map = null;
      shadow.mapPass?.dispose();
      shadow.mapPass = null;
    }
    shadow.mapSize.set(size, size);
    light.castShadow = enabled;
  };
  configureShadow(runtime.presentationKey, preset.shadowCastingLights > 0, preset.shadowMapSize);
  configureShadow(runtime.infinityLight, preset.shadowCastingLights > 1, Math.min(1024, preset.shadowMapSize));
  applySceneMode(runtime);
  syncHydraulicVisuals(runtime);
}

export function updateAcademicFountain(root: THREE.Object3D, elapsed: number, delta: number, distanceToCamera: number) {
  const runtime = getRuntime(root);
  if (!runtime || !root.visible) return;
  const response = 1 - Math.exp(-delta * (runtime.state.waterOn ? 0.95 : 0.55));
  runtime.state.waterFlow = THREE.MathUtils.lerp(runtime.state.waterFlow, runtime.targetFlow, response);
  runtime.state.sheetFlow = THREE.MathUtils.lerp(runtime.state.sheetFlow, runtime.targetFlow, 1 - Math.exp(-delta * 0.72));
  if (!runtime.state.waterOn) runtime.state.residualDrip = Math.max(0, runtime.state.residualDrip - delta / ACADEMIC_FOUNTAIN_CONFIG.water.residualDripSeconds);
  else runtime.state.residualDrip = THREE.MathUtils.lerp(runtime.state.residualDrip, 0.14, 1 - Math.exp(-delta * 0.8));
  runtime.rippleEnergy = Math.max(0.06, runtime.rippleEnergy - delta / ACADEMIC_FOUNTAIN_CONFIG.water.rippleSettleSeconds);

  if (runtime.state.quality !== 'low') runtime.water.material.uniforms.uTime.value = elapsed;
  syncHydraulicVisuals(runtime);

  const useLow = runtime.state.quality === 'low' || distanceToCamera > 13;
  const useHigh = runtime.state.quality === 'high' && distanceToCamera < 4.5;
  const showNearDetails = runtime.state.quality !== 'low' && distanceToCamera < 18;
  runtime.statueHigh.visible = useHigh;
  runtime.statueMedium.visible = !useHigh && !useLow;
  runtime.statueLow.visible = useLow;
  runtime.nearDetails.visible = showNearDetails;
  runtime.ringTicks.visible = showNearDetails;
  runtime.fineDetails.visible = showNearDetails && runtime.state.quality === 'high' && distanceToCamera < 5 && runtime.state.restorationMode !== 'clean';

  if (runtime.state.ringRotating && runtime.state.quality !== 'low') {
    runtime.state.ringAngle += delta * 0.08;
    runtime.ringPivot.rotation.y = 0.18 + runtime.state.ringAngle;
  }
  if (runtime.rainAndMist.visible) {
    const positions = runtime.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let index = 0; index < positions.count; index += 1) {
      let y = positions.getY(index) - delta * (0.75 + (index % 5) * 0.08);
      if (y < 0.05) y = 1.4 + (index % 11) * 0.07;
      positions.setY(index, y);
    }
    positions.needsUpdate = true;
  }
  if (runtime.debug.visible) {
    const currentSecond = Math.floor(elapsed);
    if (currentSecond !== runtime.lastDebugStatsSecond) {
      runtime.lastDebugStatsSecond = currentSecond;
      updateDebugStatsReadout(runtime.debug, collectFountainStats(root, true));
    }
  }
}

export function getAcademicFountainSeatPoint(root: THREE.Object3D, reference: THREE.Vector3) {
  const points = (root.userData.fountainSeatPoints as number[][] | undefined) ?? [];
  if (!points.length) return null;
  root.updateMatrixWorld(true);
  return points
    .map((point) => new THREE.Vector3().fromArray(point).applyMatrix4(root.matrixWorld))
    .sort((a, b) => a.distanceToSquared(reference) - b.distanceToSquared(reference))[0];
}

/** Release the Well's generated geometries, materials, render targets, and textures. */
export function disposeAcademicFountain(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points || object instanceof THREE.Sprite) {
      if ('geometry' in object && object.geometry instanceof THREE.BufferGeometry) geometries.add(object.geometry);
      const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
      sourceMaterials.forEach((material) => materials.add(material));
    }
    if (object instanceof THREE.Light && 'shadow' in object) {
      const shadow = (object as THREE.PointLight).shadow;
      shadow?.map?.dispose();
      shadow?.mapPass?.dispose();
    }
  });
  materials.forEach((material) => {
    Object.values(material).forEach((value) => {
      if (value instanceof THREE.Texture) textures.add(value);
    });
    if (material instanceof THREE.ShaderMaterial) {
      Object.values(material.uniforms).forEach((uniform) => {
        if (uniform.value instanceof THREE.Texture) textures.add(uniform.value);
      });
    }
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  fountainRuntimes.delete(root);
  root.removeFromParent();
}
