import * as THREE from 'three';

export type AcademicTreeSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type AcademicTreeQuality = 'low' | 'medium' | 'high';

export type AcademicTreeSpeciesId =
  | 'english-oak'
  | 'european-beech'
  | 'copper-beech'
  | 'linden'
  | 'horse-chestnut'
  | 'london-plane'
  | 'english-yew'
  | 'irish-yew'
  | 'holly'
  | 'cedar-of-lebanon'
  | 'scots-pine'
  | 'hawthorn'
  | 'rowan'
  | 'willow'
  | 'alder';

type BarkFamily = 'fissured' | 'smooth' | 'mottled' | 'fibrous' | 'conifer';
type CrownHabit = 'spreading' | 'rounded' | 'columnar' | 'tiered' | 'conical' | 'drooping' | 'airy';

interface SpeciesProfile {
  id: AcademicTreeSpeciesId;
  label: string;
  botanicalName: string;
  barkFamily: BarkFamily;
  crownHabit: CrownHabit;
  evergreen: boolean;
  baseHeight: number;
  trunkRadius: number;
  crownRadius: number;
  crownDepth: number;
  trunkFraction: number;
  summer: readonly [string, string];
  spring: readonly [string, string];
  winter: readonly [string, string];
  windAmplitude: number;
  windFrequency: number;
}

interface PlacementRow {
  species: AcademicTreeSpeciesId;
  zone: string;
  points: ReadonlyArray<readonly [number, number]>;
}

interface TreeDefects {
  irregularTrunk: number;
  asymmetricalCrown: number;
  exposedRoots: number;
  pruningScars: number;
  hollowSections: number;
  deadSecondaryBranches: number;
  layeredBark: number;
}

export interface AcademicTreeRecord {
  id: string;
  species: AcademicTreeSpeciesId;
  speciesId: AcademicTreeSpeciesId;
  commonName: string;
  botanicalName: string;
  zone: string;
  position: [number, number, number];
  localPoint: [number, number, number];
  coordinateSpace: 'district-local';
  variant: string;
  structuralVariant: string;
  age: number;
  ageClass: string;
  ancient: boolean;
  height: number;
  trunkRadius: number;
  crownAsymmetry: number;
  canopyDensity: number;
  leafRetention: number;
  canopyState: 'full' | 'thinning' | 'nearly-bare';
  moss: number;
  ivy: number;
  deadwood: number;
  lean: [number, number];
  windExposure: number;
  windPhase: number;
  defects: TreeDefects;
  barkFamily: BarkFamily;
  crownHabit: CrownHabit;
  evergreen: boolean;
  architecturalRole: string;
}

interface InstanceDatum {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  color?: THREE.Color;
  treeIndex: number;
  phase: number;
  exposure: number;
  amplitude: number;
  frequency: number;
}

const UP = new THREE.Vector3(0, 1, 0);
const UNIT_TRUNK = new THREE.CylinderGeometry(0.48, 0.62, 1, 7, 3);
const UNIT_BRANCH = new THREE.CylinderGeometry(0.42, 0.56, 1, 6, 2);
const UNIT_ROOT = new THREE.CylinderGeometry(0.16, 0.52, 1, 6, 2);
const CROWN_GEOMETRIES: Record<CrownHabit, THREE.BufferGeometry> = {
  spreading: new THREE.IcosahedronGeometry(0.5, 1),
  rounded: new THREE.DodecahedronGeometry(0.5, 0),
  columnar: new THREE.IcosahedronGeometry(0.5, 1),
  tiered: new THREE.DodecahedronGeometry(0.5, 0),
  conical: new THREE.ConeGeometry(0.5, 1, 8, 3),
  drooping: new THREE.IcosahedronGeometry(0.5, 1),
  airy: new THREE.OctahedronGeometry(0.5, 1),
};
const DETAIL_GEOMETRY = new THREE.IcosahedronGeometry(0.5, 0);
const HOLLOW_GEOMETRY = new THREE.SphereGeometry(0.5, 8, 6);
const LEAF_CLUSTER_GEOMETRY = new THREE.CircleGeometry(0.5, 7);

export const ACADEMIC_AUTUMN_PALETTE = [
  { id: 'dark-green', color: '#26352a' },
  { id: 'olive', color: '#59603a' },
  { id: 'copper', color: '#8a4f32' },
  { id: 'russet', color: '#6f3828' },
  { id: 'ochre', color: '#9a6a2f' },
  { id: 'grey-brown', color: '#615b50' },
  { id: 'muted-gold', color: '#9c8244' },
] as const;

const SPECIES: Record<AcademicTreeSpeciesId, SpeciesProfile> = {
  'english-oak': {
    id: 'english-oak', label: 'Ancient English oak', botanicalName: 'Quercus robur', barkFamily: 'fissured', crownHabit: 'spreading', evergreen: false,
    baseHeight: 3.55, trunkRadius: 0.2, crownRadius: 1.55, crownDepth: 1.75, trunkFraction: 0.46,
    summer: ['#263c2b', '#3f5533'], spring: ['#527442', '#789258'], winter: ['#584d42', '#6b5d4e'], windAmplitude: 0.012, windFrequency: 0.52,
  },
  'european-beech': {
    id: 'european-beech', label: 'European beech', botanicalName: 'Fagus sylvatica', barkFamily: 'smooth', crownHabit: 'rounded', evergreen: false,
    baseHeight: 3.25, trunkRadius: 0.15, crownRadius: 1.28, crownDepth: 1.7, trunkFraction: 0.5,
    summer: ['#25402c', '#49603a'], spring: ['#698452', '#91a66a'], winter: ['#5f554c', '#766657'], windAmplitude: 0.016, windFrequency: 0.64,
  },
  'copper-beech': {
    id: 'copper-beech', label: 'Copper beech', botanicalName: 'Fagus sylvatica f. purpurea', barkFamily: 'smooth', crownHabit: 'rounded', evergreen: false,
    baseHeight: 3.05, trunkRadius: 0.15, crownRadius: 1.35, crownDepth: 1.72, trunkFraction: 0.48,
    summer: ['#34252a', '#563136'], spring: ['#5b343d', '#75404a'], winter: ['#52484a', '#665659'], windAmplitude: 0.015, windFrequency: 0.61,
  },
  linden: {
    id: 'linden', label: 'European linden', botanicalName: 'Tilia x europaea', barkFamily: 'fissured', crownHabit: 'rounded', evergreen: false,
    baseHeight: 2.9, trunkRadius: 0.14, crownRadius: 1.05, crownDepth: 1.48, trunkFraction: 0.52,
    summer: ['#304932', '#50633b'], spring: ['#6e8b50', '#91a865'], winter: ['#5c5046', '#716153'], windAmplitude: 0.022, windFrequency: 0.78,
  },
  'horse-chestnut': {
    id: 'horse-chestnut', label: 'Horse chestnut', botanicalName: 'Aesculus hippocastanum', barkFamily: 'fissured', crownHabit: 'spreading', evergreen: false,
    baseHeight: 3.05, trunkRadius: 0.17, crownRadius: 1.42, crownDepth: 1.64, trunkFraction: 0.47,
    summer: ['#2b432e', '#4e6137'], spring: ['#5f8047', '#86a05c'], winter: ['#5f5147', '#746253'], windAmplitude: 0.017, windFrequency: 0.57,
  },
  'london-plane': {
    id: 'london-plane', label: 'London plane', botanicalName: 'Platanus x acerifolia', barkFamily: 'mottled', crownHabit: 'airy', evergreen: false,
    baseHeight: 3.35, trunkRadius: 0.16, crownRadius: 1.32, crownDepth: 1.62, trunkFraction: 0.54,
    summer: ['#314833', '#59633e'], spring: ['#6b8150', '#8b9b62'], winter: ['#655c51', '#7d705f'], windAmplitude: 0.021, windFrequency: 0.7,
  },
  'english-yew': {
    id: 'english-yew', label: 'English yew', botanicalName: 'Taxus baccata', barkFamily: 'fibrous', crownHabit: 'tiered', evergreen: true,
    baseHeight: 1.95, trunkRadius: 0.16, crownRadius: 0.82, crownDepth: 1.45, trunkFraction: 0.32,
    summer: ['#13251d', '#26372a'], spring: ['#22382a', '#3a4b32'], winter: ['#15261e', '#29372b'], windAmplitude: 0.006, windFrequency: 0.42,
  },
  'irish-yew': {
    id: 'irish-yew', label: 'Irish yew', botanicalName: 'Taxus baccata Fastigiata', barkFamily: 'fibrous', crownHabit: 'columnar', evergreen: true,
    baseHeight: 2.35, trunkRadius: 0.11, crownRadius: 0.55, crownDepth: 1.75, trunkFraction: 0.25,
    summer: ['#13231b', '#263328'], spring: ['#20372a', '#394a34'], winter: ['#15251d', '#27362a'], windAmplitude: 0.005, windFrequency: 0.45,
  },
  holly: {
    id: 'holly', label: 'English holly', botanicalName: 'Ilex aquifolium', barkFamily: 'smooth', crownHabit: 'rounded', evergreen: true,
    baseHeight: 1.45, trunkRadius: 0.075, crownRadius: 0.68, crownDepth: 1.05, trunkFraction: 0.32,
    summer: ['#12281f', '#284032'], spring: ['#244333', '#3b5741'], winter: ['#14271f', '#2b4032'], windAmplitude: 0.008, windFrequency: 0.58,
  },
  'cedar-of-lebanon': {
    id: 'cedar-of-lebanon', label: 'Cedar of Lebanon', botanicalName: 'Cedrus libani', barkFamily: 'conifer', crownHabit: 'tiered', evergreen: true,
    baseHeight: 3.75, trunkRadius: 0.18, crownRadius: 1.68, crownDepth: 2.0, trunkFraction: 0.43,
    summer: ['#24332d', '#3f4c3d'], spring: ['#33483a', '#4f604a'], winter: ['#25342e', '#3e493c'], windAmplitude: 0.007, windFrequency: 0.38,
  },
  'scots-pine': {
    id: 'scots-pine', label: 'Scots pine', botanicalName: 'Pinus sylvestris', barkFamily: 'conifer', crownHabit: 'conical', evergreen: true,
    baseHeight: 3.15, trunkRadius: 0.13, crownRadius: 0.92, crownDepth: 1.55, trunkFraction: 0.52,
    summer: ['#244035', '#415344'], spring: ['#365444', '#526653'], winter: ['#263e35', '#3c4e42'], windAmplitude: 0.009, windFrequency: 0.5,
  },
  hawthorn: {
    id: 'hawthorn', label: 'Common hawthorn', botanicalName: 'Crataegus monogyna', barkFamily: 'fissured', crownHabit: 'spreading', evergreen: false,
    baseHeight: 1.5, trunkRadius: 0.085, crownRadius: 0.76, crownDepth: 1.02, trunkFraction: 0.42,
    summer: ['#29432e', '#50603a'], spring: ['#66854d', '#8da263'], winter: ['#594c43', '#706052'], windAmplitude: 0.024, windFrequency: 0.82,
  },
  rowan: {
    id: 'rowan', label: 'Rowan', botanicalName: 'Sorbus aucuparia', barkFamily: 'smooth', crownHabit: 'airy', evergreen: false,
    baseHeight: 1.82, trunkRadius: 0.08, crownRadius: 0.76, crownDepth: 1.02, trunkFraction: 0.5,
    summer: ['#2f4931', '#56643c'], spring: ['#678750', '#8da366'], winter: ['#5d5248', '#726355'], windAmplitude: 0.032, windFrequency: 1.02,
  },
  willow: {
    id: 'willow', label: 'White willow', botanicalName: 'Salix alba', barkFamily: 'fissured', crownHabit: 'drooping', evergreen: false,
    baseHeight: 2.75, trunkRadius: 0.15, crownRadius: 1.34, crownDepth: 1.95, trunkFraction: 0.43,
    summer: ['#3d543a', '#667051'], spring: ['#6f895d', '#91a374'], winter: ['#62584e', '#77695b'], windAmplitude: 0.041, windFrequency: 1.08,
  },
  alder: {
    id: 'alder', label: 'Common alder', botanicalName: 'Alnus glutinosa', barkFamily: 'fissured', crownHabit: 'airy', evergreen: false,
    baseHeight: 2.18, trunkRadius: 0.105, crownRadius: 0.86, crownDepth: 1.25, trunkFraction: 0.52,
    summer: ['#294331', '#4b5d3e'], spring: ['#5c7b50', '#809568'], winter: ['#5c5249', '#706256'], windAmplitude: 0.027, windFrequency: 0.86,
  },
};

const PLANTING: readonly PlacementRow[] = [
  { species: 'english-oak', zone: 'quadrangles', points: [[-11, 4], [9.6, 6.8], [-12.5, 15.5], [13.5, 17.5], [-12, 31], [12, 33]] },
  { species: 'horse-chestnut', zone: 'quadrangles', points: [[-10.8, 22], [13, 25], [-32, 30], [-13, 42], [22, 38], [-33, 45]] },
  { species: 'linden', zone: 'ceremonial-avenue', points: [[-5.8, -43], [-5.8, -31], [-5.8, -19], [5.8, -37], [5.8, -25], [5.8, -13]] },
  { species: 'london-plane', zone: 'ceremonial-avenue', points: [[-5.8, -37], [-5.8, -25], [-5.8, -13], [5.8, -43], [5.8, -31], [5.8, -19], [5.8, -7]] },
  { species: 'copper-beech', zone: 'libraries-administration', points: [[-31, -20], [-12, -25], [29, -23], [-34, 0], [31, -4]] },
  { species: 'english-yew', zone: 'chapel-graveyard', points: [[-55, 4], [-53, 18], [-47, 22], [-61, 13]] },
  { species: 'irish-yew', zone: 'chapel-graveyard', points: [[-52, 3], [-58, 7], [-58, 16], [-49, 16]] },
  { species: 'holly', zone: 'chapel-graveyard', points: [[-63, 6], [-62, 19], [-45, 26]] },
  { species: 'hawthorn', zone: 'chapel-graveyard', points: [[-65, 12], [-55, 24], [-40, 26], [-39, 2]] },
  { species: 'cedar-of-lebanon', zone: 'professors-garden', points: [[45, -18], [51, -9]] },
  { species: 'scots-pine', zone: 'observatory', points: [[32, 29], [48, 34], [53, 26], [34, 36], [55, 15]] },
  { species: 'willow', zone: 'canal-damp-ground', points: [[-38, 47], [-25, 47], [24, 47], [35, 47], [46, 46]] },
  { species: 'alder', zone: 'canal-damp-ground', points: [[-42, 61], [-30, 61], [-18, 61], [18, 61], [31, 61], [43, 61], [-53, 55], [54, 55]] },
  { species: 'european-beech', zone: 'boundary-secluded-walks', points: [[-82, 62], [-70, 62], [-58, 61], [58, 61], [70, 62], [82, 62], [-38, -48], [38, -48]] },
  { species: 'rowan', zone: 'residential-courtyards', points: [[30, -37], [34, -49], [46, -52], [56, -44], [58, -31], [38, -24]] },
] as const;

const VARIANTS = ['open-grown', 'forked', 'weather-leaning', 'high-crowned'] as const;
interface BarkTextures {
  albedo: THREE.CanvasTexture;
  height: THREE.CanvasTexture;
}

const barkTextureCache = new Map<BarkFamily, BarkTextures>();

function hashUnit(key: string) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

function makeBarkTexture(family: BarkFamily) {
  const cached = barkTextureCache.get(family);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D unavailable for Academic tree bark texture.');
  const colors: Record<BarkFamily, readonly [string, string, string]> = {
    fissured: ['#201912', '#46372b', '#756251'],
    smooth: ['#4a4842', '#76736b', '#9a9588'],
    mottled: ['#596052', '#aaa080', '#554c3d'],
    fibrous: ['#281812', '#553328', '#805640'],
    conifer: ['#2c1c16', '#654133', '#9a6847'],
  };
  const [dark, mid, light] = colors[family];
  context.fillStyle = mid;
  context.fillRect(0, 0, canvas.width, canvas.height);
  let seed = Math.floor(hashUnit(family) * 0xffffffff) >>> 0;
  for (let index = 0; index < 760; index += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const x = (seed & 0xffff) / 0xffff * canvas.width;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const y = (seed & 0xffff) / 0xffff * canvas.height;
    const fissure = family === 'smooth' ? 0.4 : family === 'mottled' ? 1.8 : 0.9;
    const length = 4 + ((seed >>> 16) / 0xffff) * (family === 'fibrous' ? 48 : 25);
    context.strokeStyle = index % 5 === 0 ? light : dark;
    context.globalAlpha = family === 'smooth' ? 0.13 : 0.25;
    context.lineWidth = fissure + (index % 3) * 0.35;
    context.beginPath();
    context.moveTo(x, y);
    context.bezierCurveTo(x + (index % 5) - 2, y + length * 0.3, x - (index % 7) + 3, y + length * 0.72, x + (index % 3) - 1, y + length);
    context.stroke();
  }
  if (family === 'mottled') {
    context.globalAlpha = 0.23;
    for (let index = 0; index < 90; index += 1) {
      context.fillStyle = index % 2 ? '#d0c59f' : '#485041';
      context.beginPath();
      context.ellipse((index * 47) % 128, (index * 83) % 256, 3 + index % 8, 6 + index % 13, index, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.globalAlpha = 1;
  const albedo = new THREE.CanvasTexture(canvas);
  albedo.name = `Academic layered ${family} bark albedo`;
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping;
  albedo.repeat.set(2, 6);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.anisotropy = 4;

  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = canvas.width;
  heightCanvas.height = canvas.height;
  const heightContext = heightCanvas.getContext('2d');
  if (!heightContext) throw new Error('Canvas 2D unavailable for Academic tree bark relief.');
  const source = context.getImageData(0, 0, canvas.width, canvas.height);
  const heightPixels = heightContext.createImageData(canvas.width, canvas.height);
  for (let offset = 0; offset < source.data.length; offset += 4) {
    const value = Math.round(source.data[offset] * 0.25 + source.data[offset + 1] * 0.62 + source.data[offset + 2] * 0.13);
    heightPixels.data[offset] = value;
    heightPixels.data[offset + 1] = value;
    heightPixels.data[offset + 2] = value;
    heightPixels.data[offset + 3] = 255;
  }
  heightContext.putImageData(heightPixels, 0, 0);
  const height = new THREE.CanvasTexture(heightCanvas);
  height.name = `Academic layered ${family} bark height`;
  height.wrapS = height.wrapT = THREE.RepeatWrapping;
  height.repeat.copy(albedo.repeat);
  height.colorSpace = THREE.NoColorSpace;
  height.anisotropy = 4;
  const textures = { albedo, height };
  barkTextureCache.set(family, textures);
  return textures;
}

function treeMaterial(name: string, color: string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.94, metalness: 0, ...options });
  material.name = name;
  material.userData.excludeSeasonFoliage = true;
  return material;
}

function barkMaterial(family: BarkFamily) {
  const textures = makeBarkTexture(family);
  const colors: Record<BarkFamily, string> = {
    fissured: '#665446', smooth: '#8b867b', mottled: '#918977', fibrous: '#654132', conifer: '#79503b',
  };
  const material = treeMaterial(`Academic ${family} layered mapped bark`, colors[family], {
    map: textures.albedo,
    bumpMap: textures.height,
    bumpScale: family === 'smooth' ? 0.018 : 0.045,
  });
  material.userData.barkFamily = family;
  material.userData.layeredBarkTexture = true;
  return material;
}

function windMaterial(name: string, color = '#ffffff') {
  // InstancedMesh supplies USE_INSTANCING_COLOR automatically after setColorAt.
  // Enabling ordinary vertexColors as well would multiply by a nonexistent
  // per-vertex color attribute and render the otherwise valid palette black.
  const material = treeMaterial(name, color, { roughness: 0.98 });
  const uTime = { value: 0 };
  material.userData.windUniforms = { uTime };
  material.userData.windTimeUniform = uTime;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uAcademicTreeTime = uTime;
    shader.vertexShader = `attribute vec4 academicWind;\nuniform float uAcademicTreeTime;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float academicWindMask = smoothstep(-0.35, 0.5, position.y);
       float academicGust = sin(uAcademicTreeTime * academicWind.w + academicWind.x)
         + 0.32 * sin(uAcademicTreeTime * academicWind.w * 0.43 + academicWind.x * 1.73);
       transformed.x += academicGust * academicWind.y * academicWind.z * academicWindMask;
       transformed.z += cos(uAcademicTreeTime * academicWind.w * 0.71 + academicWind.x) * academicWind.y * academicWind.z * academicWindMask * 0.46;`,
    );
  };
  material.customProgramCacheKey = () => 'academic-tree-wind-v1';
  return material;
}

function along(start: THREE.Vector3, end: THREE.Vector3, radius: number, treeIndex: number, record: AcademicTreeRecord, color?: THREE.Color): InstanceDatum {
  const direction = end.clone().sub(start);
  const length = Math.max(direction.length(), 0.001);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, direction.normalize());
  return {
    position: start.clone().add(end).multiplyScalar(0.5),
    quaternion,
    scale: new THREE.Vector3(radius * 2, length, radius * 2),
    color,
    treeIndex,
    phase: record.windPhase,
    exposure: record.windExposure,
    amplitude: SPECIES[record.species].windAmplitude,
    frequency: SPECIES[record.species].windFrequency,
  };
}

function datum(position: THREE.Vector3, scale: THREE.Vector3, treeIndex: number, record: AcademicTreeRecord, quaternion = new THREE.Quaternion(), color?: THREE.Color): InstanceDatum {
  return {
    position, scale, quaternion, color, treeIndex,
    phase: record.windPhase, exposure: record.windExposure,
    amplitude: SPECIES[record.species].windAmplitude,
    frequency: SPECIES[record.species].windFrequency,
  };
}

function ageFor(species: AcademicTreeSpeciesId, speciesIndex: number) {
  const bases: Record<AcademicTreeSpeciesId, number> = {
    'english-oak': 430, 'european-beech': 155, 'copper-beech': 118, linden: 270, 'horse-chestnut': 155,
    'london-plane': 135, 'english-yew': 390, 'irish-yew': 130, holly: 125, 'cedar-of-lebanon': 145,
    'scots-pine': 120, hawthorn: 205, rowan: 72, willow: 115, alder: 92,
  };
  return Math.max(34, bases[species] - speciesIndex * (species === 'english-oak' || species === 'english-yew' ? 42 : 11));
}

function makeRecords(hub: THREE.Vector3) {
  const records: AcademicTreeRecord[] = [];
  let globalIndex = 0;
  PLANTING.forEach((row) => {
    row.points.forEach(([tangent, radial], speciesIndex) => {
      const profile = SPECIES[row.species];
      const id = `${row.species}-${String(speciesIndex + 1).padStart(2, '0')}`;
      const random = hashUnit(id);
      const age = ageFor(row.species, speciesIndex);
      const ancient = age >= 180;
      const retentionIndex = profile.evergreen ? 0 : globalIndex % 3;
      const leafRetention = profile.evergreen ? 0.92 - speciesIndex * 0.018 : [0.9, 0.5, 0.18][retentionIndex];
      const canopyState: AcademicTreeRecord['canopyState'] = leafRetention >= 0.72 ? 'full' : leafRetention <= 0.28 ? 'nearly-bare' : 'thinning';
      const variant = VARIANTS[speciesIndex % VARIANTS.length];
      const leanX = (hashUnit(`${id}:lean-x`) - 0.5) * (ancient ? 0.17 : 0.08);
      const leanZ = (hashUnit(`${id}:lean-z`) - 0.5) * (ancient ? 0.17 : 0.08);
      const height = profile.baseHeight * (0.88 + random * 0.22) * (ancient ? 1.08 : 1);
      const defects: TreeDefects = ancient ? {
        irregularTrunk: 0.74 + random * 0.2,
        asymmetricalCrown: 0.68 + hashUnit(`${id}:crown`) * 0.27,
        exposedRoots: 4 + speciesIndex % 3,
        pruningScars: 2 + speciesIndex % 3,
        hollowSections: 1 + speciesIndex % 2,
        deadSecondaryBranches: 2 + speciesIndex % 3,
        layeredBark: 3,
      } : {
        irregularTrunk: 0.16 + random * 0.35,
        asymmetricalCrown: 0.22 + hashUnit(`${id}:crown`) * 0.45,
        exposedRoots: 1 + speciesIndex % 3,
        pruningScars: speciesIndex % 3,
        hollowSections: speciesIndex % 5 === 0 ? 1 : 0,
        deadSecondaryBranches: speciesIndex % 4 === 0 ? 1 : 0,
        layeredBark: 2,
      };
      records.push({
        id,
        species: row.species,
        speciesId: row.species,
        commonName: profile.label,
        botanicalName: profile.botanicalName,
        zone: row.zone,
        position: [hub.x + radial, 0, hub.z + tangent],
        localPoint: [hub.x + radial, 0, hub.z + tangent],
        coordinateSpace: 'district-local',
        variant,
        structuralVariant: variant,
        age,
        ageClass: ancient ? 'ancient-veteran' : age >= 100 ? 'mature' : 'established',
        ancient,
        height,
        trunkRadius: profile.trunkRadius * (0.9 + random * 0.25) * (ancient ? 1.28 : 1),
        crownAsymmetry: defects.asymmetricalCrown,
        canopyDensity: 0.48 + hashUnit(`${id}:density`) * 0.47,
        leafRetention,
        canopyState,
        moss: ancient ? 0.46 + random * 0.32 : 0.08 + random * 0.32,
        ivy: ancient ? 0.24 + random * 0.28 : random * 0.16,
        deadwood: ancient ? 0.34 + random * 0.38 : 0.04 + random * 0.18,
        lean: [leanX, leanZ],
        windExposure: 0.36 + hashUnit(`${id}:exposure`) * 0.64,
        windPhase: hashUnit(`${id}:phase`) * Math.PI * 12,
        defects,
        barkFamily: profile.barkFamily,
        crownHabit: profile.crownHabit,
        evergreen: profile.evergreen,
        architecturalRole: row.zone === 'ceremonial-avenue'
          ? 'frames the Great Hall axis with measured canopy gaps'
          : row.zone === 'libraries-administration'
            ? 'layers dark foliage against warm scholarly windows'
            : row.zone === 'boundary-secluded-walks'
              ? 'forms alternating enclosed and open boundary walks'
              : `anchors the ${row.zone.replaceAll('-', ' ')}`,
      });
      globalIndex += 1;
    });
  });
  return records;
}

function setInstances(
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  entries: readonly InstanceDatum[],
  component: string,
  wind = false,
) {
  const instanceGeometry = wind ? geometry.clone() : geometry;
  if (wind) {
    const values = new Float32Array(entries.length * 4);
    entries.forEach((entry, index) => {
      values[index * 4] = entry.phase;
      values[index * 4 + 1] = entry.exposure;
      values[index * 4 + 2] = entry.amplitude;
      values[index * 4 + 3] = entry.frequency;
    });
    instanceGeometry.setAttribute('academicWind', new THREE.InstancedBufferAttribute(values, 4));
  }
  const mesh = new THREE.InstancedMesh(instanceGeometry, material, entries.length);
  mesh.name = name;
  mesh.userData.academicTreeComponent = component;
  mesh.userData.academicTreeInstanceTreeIndices = entries.map((entry) => entry.treeIndex);
  mesh.userData.academicTreeWind = wind;
  if (wind) {
    mesh.userData.animate = 'academic-tree-wind';
    mesh.userData.windAnimated = true;
  }
  const matrix = new THREE.Matrix4();
  entries.forEach((entry, index) => {
    matrix.compose(entry.position, entry.quaternion, entry.scale);
    mesh.setMatrixAt(index, matrix);
    if (entry.color) mesh.setColorAt(index, entry.color);
  });
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) {
    mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    mesh.instanceColor.needsUpdate = true;
  }
  mesh.computeBoundingSphere();
  mesh.castShadow = component.includes('trunk') || component.includes('branch');
  mesh.receiveShadow = true;
  return mesh;
}

function seasonColor(record: AcademicTreeRecord, season: AcademicTreeSeason, instanceIndex: number) {
  const profile = SPECIES[record.species];
  if (season === 'autumn') {
    const baseIndex = profile.evergreen
      ? Math.floor(hashUnit(`${record.id}:evergreen-autumn`) * 2)
      : Math.floor(hashUnit(`${record.id}:autumn`) * ACADEMIC_AUTUMN_PALETTE.length);
    // Keep each crown visually coherent; an occasional adjacent tone gives
    // natural within-tree variation without making every lobe a different hue.
    const paletteIndex = profile.evergreen
      ? baseIndex
      : (baseIndex + (instanceIndex % 5 === 0 ? 1 : 0)) % ACADEMIC_AUTUMN_PALETTE.length;
    return ACADEMIC_AUTUMN_PALETTE[paletteIndex].color;
  }
  const pair = season === 'spring' ? profile.spring : season === 'winter' ? profile.winter : profile.summer;
  return pair[instanceIndex % pair.length];
}

function addSeasonColors(mesh: THREE.InstancedMesh, entries: readonly InstanceDatum[], records: readonly AcademicTreeRecord[]) {
  const seasons: AcademicTreeSeason[] = ['spring', 'summer', 'autumn', 'winter'];
  const colors = Object.fromEntries(seasons.map((season) => [season, entries.map((entry, index) => seasonColor(records[entry.treeIndex], season, index))]));
  mesh.userData.academicTreeSeasonColors = colors;
  mesh.userData.academicTreeFoliage = true;
}

function createTreeLevels(records: readonly AcademicTreeRecord[]) {
  const near = new THREE.Group();
  near.name = 'ACADEMIC__ARBORETUM_LOD_NEAR_VETERAN_DETAIL';
  near.userData.academicTreeLodLevel = 'near';
  near.userData.academicTreeLodTier = 'near';
  const mid = new THREE.Group();
  mid.name = 'ACADEMIC__ARBORETUM_LOD_MID_SILHOUETTES';
  mid.userData.academicTreeLodLevel = 'mid';
  mid.userData.academicTreeLodTier = 'mid';
  const far = new THREE.Group();
  far.name = 'ACADEMIC__ARBORETUM_LOD_FAR_CANOPY';
  far.userData.academicTreeLodLevel = 'far';
  far.userData.academicTreeLodTier = 'far';

  const barkMaterials = Object.fromEntries((['fissured', 'smooth', 'mottled', 'fibrous', 'conifer'] as BarkFamily[]).map((family) => [family, barkMaterial(family)])) as Record<BarkFamily, THREE.MeshStandardMaterial>;
  const branchMaterials = Object.fromEntries((['fissured', 'smooth', 'mottled', 'fibrous', 'conifer'] as BarkFamily[]).map((family) => {
    const material = windMaterial(`Academic wind-bent ${family} secondary branches`, `#${barkMaterials[family].color.getHexString()}`);
    material.map = barkMaterials[family].map;
    material.bumpMap = barkMaterials[family].bumpMap;
    material.bumpScale = barkMaterials[family].bumpScale;
    return [family, material];
  })) as Record<BarkFamily, THREE.MeshStandardMaterial>;
  const foliageMaterial = windMaterial('Academic species foliage with asynchronous wind');
  const mossMaterial = treeMaterial('Academic veteran-tree moss', '#31402f');
  const ivyMaterial = treeMaterial('Academic restrained climbing ivy', '#23362b');
  const deadwoodMaterial = treeMaterial('Academic silvered deadwood', '#6b6155');
  const hollowMaterial = treeMaterial('Academic tree hollows and old pruning scars', '#17130f');

  const nearTrunks = new Map<BarkFamily, InstanceDatum[]>();
  const nearBranches = new Map<BarkFamily, InstanceDatum[]>();
  const midTrunks = new Map<BarkFamily, InstanceDatum[]>();
  const farTrunks = new Map<BarkFamily, InstanceDatum[]>();
  const nearCrowns = new Map<CrownHabit, InstanceDatum[]>();
  const midCrowns = new Map<CrownHabit, InstanceDatum[]>();
  const farCrowns = new Map<CrownHabit, InstanceDatum[]>();
  const roots: InstanceDatum[] = [];
  const moss: InstanceDatum[] = [];
  const ivy: InstanceDatum[] = [];
  const deadwood: InstanceDatum[] = [];
  const hollows: InstanceDatum[] = [];
  const mapPush = <K,>(map: Map<K, InstanceDatum[]>, key: K, value: InstanceDatum) => {
    const list = map.get(key) ?? [];
    list.push(value);
    map.set(key, list);
  };

  records.forEach((record, treeIndex) => {
    const profile = SPECIES[record.species];
    const x = record.position[0];
    const z = record.position[2];
    const base = new THREE.Vector3(x, 0.008, z);
    const trunkHeight = record.height * profile.trunkFraction;
    const lean = new THREE.Vector3(record.lean[0] * record.height, 0, record.lean[1] * record.height);
    const fork = record.variant === 'forked' ? 0.09 : 0;
    const middle = base.clone().add(new THREE.Vector3(lean.x * 0.38 + fork, trunkHeight * 0.52, lean.z * 0.38));
    const top = base.clone().add(new THREE.Vector3(lean.x, trunkHeight, lean.z));
    mapPush(nearTrunks, record.barkFamily, along(base, middle, record.trunkRadius * 1.08, treeIndex, record));
    mapPush(nearTrunks, record.barkFamily, along(middle, top, record.trunkRadius * 0.79, treeIndex, record));
    mapPush(midTrunks, record.barkFamily, along(base, top, record.trunkRadius, treeIndex, record));
    mapPush(farTrunks, record.barkFamily, along(base, top, record.trunkRadius * 0.92, treeIndex, record));

    const branchCount = Math.max(3, Math.round(3 + record.canopyDensity * 3));
    for (let branchIndex = 0; branchIndex < branchCount; branchIndex += 1) {
      const angle = branchIndex / branchCount * Math.PI * 2 + record.windPhase * 0.21;
      const start = base.clone().lerp(top, 0.58 + (branchIndex % 3) * 0.1);
      const spread = profile.crownRadius * (0.36 + (branchIndex % 2) * 0.18);
      const end = start.clone().add(new THREE.Vector3(Math.cos(angle) * spread, 0.25 + (branchIndex % 3) * 0.12, Math.sin(angle) * spread));
      mapPush(nearBranches, record.barkFamily, along(start, end, record.trunkRadius * (0.3 - branchIndex * 0.018), treeIndex, record));
    }
    const deadCount = Math.max(record.defects.deadSecondaryBranches, Math.round(record.deadwood * 3));
    for (let branchIndex = 0; branchIndex < deadCount; branchIndex += 1) {
      const angle = branchIndex * 2.27 + record.windPhase;
      const start = base.clone().lerp(top, 0.62 + branchIndex * 0.04);
      const end = start.clone().add(new THREE.Vector3(Math.cos(angle) * profile.crownRadius * 0.42, 0.18, Math.sin(angle) * profile.crownRadius * 0.42));
      deadwood.push(along(start, end, record.trunkRadius * 0.13, treeIndex, record));
    }
    const rootCount = Math.max(2, record.defects.exposedRoots);
    for (let rootIndex = 0; rootIndex < rootCount; rootIndex += 1) {
      const angle = rootIndex / rootCount * Math.PI * 2 + record.windPhase * 0.12;
      const length = record.trunkRadius * (2.25 + (rootIndex % 3) * 0.52);
      const end = base.clone().add(new THREE.Vector3(Math.cos(angle) * length, -0.006, Math.sin(angle) * length));
      roots.push(along(base.clone().add(new THREE.Vector3(0, 0.04, 0)), end, record.trunkRadius * 0.27, treeIndex, record));
    }

    const lobeCount = Math.max(2, Math.round(2 + record.canopyDensity * 3 + record.leafRetention * 2));
    const crownCenter = top.clone().add(new THREE.Vector3(lean.x * 0.18, profile.crownDepth * 0.34, lean.z * 0.18));
    for (let lobeIndex = 0; lobeIndex < lobeCount; lobeIndex += 1) {
      const angle = lobeIndex / lobeCount * Math.PI * 2 + record.windPhase * 0.09;
      const asymmetry = 0.16 + record.crownAsymmetry * 0.22;
      const ring = lobeIndex === 0 ? 0 : profile.crownRadius * (0.1 + (lobeIndex % 3) * 0.07);
      const vertical = ((lobeIndex % 3) - 1) * profile.crownDepth * 0.16;
      const retentionScale = 0.58 + record.leafRetention * 0.42;
      const position = crownCenter.clone().add(new THREE.Vector3(Math.cos(angle) * ring * (1 + asymmetry), vertical, Math.sin(angle) * ring * (0.8 - asymmetry * 0.18)));
      const scale = new THREE.Vector3(
        profile.crownRadius * retentionScale * (0.72 + (lobeIndex % 2) * 0.18),
        profile.crownDepth * retentionScale * (0.46 + (lobeIndex % 3) * 0.08),
        profile.crownRadius * retentionScale * (0.58 + ((lobeIndex + 1) % 3) * 0.09),
      );
      if (profile.crownHabit === 'columnar') scale.set(profile.crownRadius * 0.7, profile.crownDepth * 0.72, profile.crownRadius * 0.62);
      if (profile.crownHabit === 'drooping') scale.y *= 1.22;
      if (profile.crownHabit === 'tiered') scale.y *= 0.7;
      const color = new THREE.Color(seasonColor(record, 'summer', lobeIndex));
      mapPush(nearCrowns, record.crownHabit, datum(position, scale, treeIndex, record, new THREE.Quaternion().setFromEuler(new THREE.Euler(0.08 * (lobeIndex % 2), angle * 0.14, 0.05)), color));
    }
    const midScale = new THREE.Vector3(profile.crownRadius * (1.12 + record.crownAsymmetry * 0.2), profile.crownDepth * 0.88, profile.crownRadius * 0.9).multiplyScalar(0.72 + record.leafRetention * 0.25);
    mapPush(midCrowns, record.crownHabit, datum(crownCenter, midScale, treeIndex, record, new THREE.Quaternion(), new THREE.Color(seasonColor(record, 'summer', treeIndex))));
    const farScale = new THREE.Vector3(profile.crownRadius * 1.08, profile.crownDepth * 0.82, profile.crownRadius * 0.86).multiplyScalar(0.76 + record.leafRetention * 0.18);
    mapPush(farCrowns, record.crownHabit, datum(crownCenter, farScale, treeIndex, record, new THREE.Quaternion(), new THREE.Color(seasonColor(record, 'summer', treeIndex + 3))));

    if (record.moss > 0.12) {
      moss.push(datum(base.clone().add(new THREE.Vector3(record.trunkRadius * 0.55, 0.12, 0)), new THREE.Vector3(record.trunkRadius * 1.45, 0.18 + record.moss * 0.2, record.trunkRadius * 0.75), treeIndex, record));
    }
    if (record.ivy > 0.08) {
      ivy.push(datum(base.clone().add(new THREE.Vector3(-record.trunkRadius * 0.55, trunkHeight * 0.34, record.trunkRadius * 0.35)), new THREE.Vector3(0.08 + record.ivy * 0.16, trunkHeight * Math.min(0.38, record.ivy), 0.07), treeIndex, record, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, record.windPhase, 0))));
    }
    const hollowCount = record.defects.hollowSections + Math.min(2, record.defects.pruningScars);
    for (let detailIndex = 0; detailIndex < hollowCount; detailIndex += 1) {
      const angle = record.windPhase + detailIndex * 2.4;
      hollows.push(datum(
        base.clone().add(new THREE.Vector3(Math.sin(angle) * record.trunkRadius * 0.82, trunkHeight * (0.26 + detailIndex * 0.15), Math.cos(angle) * record.trunkRadius * 0.82)),
        new THREE.Vector3(record.trunkRadius * 0.62, record.trunkRadius * (0.72 + detailIndex * 0.12), record.trunkRadius * 0.16),
        treeIndex,
        record,
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angle, 0)),
      ));
    }
  });

  const addBarkBatches = (group: THREE.Group, batches: Map<BarkFamily, InstanceDatum[]>, geometry: THREE.BufferGeometry, role: string, materials: Record<BarkFamily, THREE.Material>, wind = false) => {
    batches.forEach((entries, family) => {
      group.add(setInstances(`ACADEMIC__${role.toUpperCase().replaceAll(' ', '_')}__${family.toUpperCase()}`, geometry, materials[family], entries, role, wind));
    });
  };
  addBarkBatches(near, nearTrunks, UNIT_TRUNK, 'near irregular trunk segments', barkMaterials);
  addBarkBatches(near, nearBranches, UNIT_BRANCH, 'near secondary branches', branchMaterials, true);
  addBarkBatches(mid, midTrunks, UNIT_TRUNK, 'mid trunk silhouettes', barkMaterials);
  addBarkBatches(far, farTrunks, UNIT_TRUNK, 'far trunk silhouettes', barkMaterials);

  const addCrowns = (group: THREE.Group, batches: Map<CrownHabit, InstanceDatum[]>, tier: string) => {
    batches.forEach((entries, habit) => {
      const mesh = setInstances(`ACADEMIC__${tier.toUpperCase()}_${habit.toUpperCase()}_CANOPY_LOBES`, CROWN_GEOMETRIES[habit], foliageMaterial, entries, `${tier} canopy foliage`, true);
      mesh.castShadow = tier === 'near';
      mesh.userData.academicTreeCanopyShadow = tier === 'near';
      addSeasonColors(mesh, entries, records);
      group.add(mesh);
    });
  };
  addCrowns(near, nearCrowns, 'near');
  addCrowns(mid, midCrowns, 'mid');
  addCrowns(far, farCrowns, 'far');

  near.add(
    setInstances('ACADEMIC__EXPOSED_ROOT_FLARES', UNIT_ROOT, barkMaterials.fissured, roots, 'exposed roots'),
    setInstances('ACADEMIC__SILVERED_DEAD_SECONDARY_BRANCHES', UNIT_BRANCH, deadwoodMaterial, deadwood, 'dead secondary branches'),
    setInstances('ACADEMIC__VETERAN_TREE_MOSS_PATCHES', DETAIL_GEOMETRY, mossMaterial, moss, 'moss patches'),
    setInstances('ACADEMIC__RESTRAINED_IVY_STRANDS', DETAIL_GEOMETRY, ivyMaterial, ivy, 'restrained ivy'),
    setInstances('ACADEMIC__HOLLOWS_AND_PRUNING_SCARS', HOLLOW_GEOMETRY, hollowMaterial, hollows, 'hollows and pruning scars'),
  );
  return { near, mid, far };
}

interface WetLeafContextSpec {
  context: string;
  anchors: THREE.Vector3[];
  clustersPerAnchor: number;
}

function benchPositions(input: unknown, hub: THREE.Vector3) {
  if (!Array.isArray(input)) return [];
  return input.flatMap((entry) => {
    const position = (entry as { position?: unknown })?.position;
    if (!Array.isArray(position) || position.length < 3) return [];
    return [new THREE.Vector3(Number(position[0]) - hub.x, 0.008, Number(position[2]) - hub.z)];
  });
}

function createWetLeaves(hub: THREE.Vector3, benchAnchors: unknown) {
  const root = new THREE.Group();
  root.name = 'ACADEMIC__AUTUMN_WET_FALLEN_LEAF_COLLECTIONS';
  root.userData.academicTreeAutumnLeaves = true;
  const local = (t: number, r: number) => new THREE.Vector3(r, 0.008, t);
  const exposedRootPoints = [
    ...PLANTING.find((row) => row.species === 'english-oak')!.points,
    ...PLANTING.find((row) => row.species === 'english-yew')!.points,
  ];
  const contexts: WetLeafContextSpec[] = [
    { context: 'walls', anchors: [local(-9, 13), local(-8.4, 13.4), local(27, -23), local(-43, 10)], clustersPerAnchor: 8 },
    { context: 'drains', anchors: [local(-45, -40.7), local(-45, -40.1), local(-45, -39.5), local(-45, -38.9)], clustersPerAnchor: 7 },
    { context: 'benches', anchors: benchPositions(benchAnchors, hub), clustersPerAnchor: 5 },
    { context: 'exposed-roots', anchors: exposedRootPoints.map(([t, r]) => local(t, r)), clustersPerAnchor: 8 },
    { context: 'cloisters', anchors: [-7.65, 7.65].flatMap((t) => [2, 9, 16].map((r) => local(t, r))), clustersPerAnchor: 6 },
    { context: 'bicycle-racks', anchors: [40, 41.05, 42.1, 43.15, 44.2].map((t) => local(t, -30.2)), clustersPerAnchor: 7 },
  ];
  const material = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.34,
    metalness: 0.02,
    clearcoat: 0.48,
    clearcoatRoughness: 0.22,
  });
  material.name = 'Academic rain-darkened autumn leaf clusters';
  material.userData.excludeSeasonFoliage = true;
  material.userData.wetAutumnLeaves = true;
  contexts.forEach((context, contextIndex) => {
    const entries: InstanceDatum[] = [];
    context.anchors.forEach((anchor, anchorIndex) => {
      for (let index = 0; index < context.clustersPerAnchor; index += 1) {
        const phase = hashUnit(`${context.context}:${anchorIndex}:${index}`) * Math.PI * 2;
        const radius = 0.06 + (index % 4) * 0.035;
        const position = anchor.clone().add(new THREE.Vector3(Math.cos(phase) * radius, index * 0.0003, Math.sin(phase) * radius * 0.62));
        const recordStub = {
          windPhase: phase, windExposure: 0, species: 'english-oak',
        } as AcademicTreeRecord;
        entries.push(datum(
          position,
          new THREE.Vector3(0.045 + (index % 3) * 0.018, 0.02 + (index % 2) * 0.01, 1),
          contextIndex,
          recordStub,
          new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI * 0.5, 0, phase)),
          new THREE.Color(ACADEMIC_AUTUMN_PALETTE[(contextIndex + index) % ACADEMIC_AUTUMN_PALETTE.length].color),
        ));
      }
    });
    const mesh = setInstances(`ACADEMIC__WET_FALLEN_LEAVES__${context.context.toUpperCase().replaceAll('-', '_')}`, LEAF_CLUSTER_GEOMETRY, material, entries, 'wet fallen leaf clusters');
    mesh.userData.wetLeafContext = context.context;
    mesh.userData.academicAutumnOnly = true;
    mesh.userData.academicTreeFullInstanceCount = entries.length;
    mesh.userData.academicTreeSeasonVisible = false;
    root.add(mesh);
  });
  root.userData.wetLeafContexts = contexts.map((context) => ({ context: context.context, count: context.anchors.length * context.clustersPerAnchor, wet: true }));
  return root;
}

export function buildAcademicTreeSystem(hub: THREE.Vector3, benchAnchors?: unknown) {
  const root = new THREE.Group();
  root.name = 'ACADEMIC__PROCEDURAL_HISTORIC_ARBORETUM';
  root.position.copy(hub);
  root.userData.academicTreeSystem = true;
  const records = makeRecords(new THREE.Vector3());
  // Records and instance transforms are authored relative to this root; expose
  // district-local coordinates in metadata for editing and deterministic tests.
  records.forEach((record) => {
    record.position[0] += hub.x;
    record.position[1] += hub.y;
    record.position[2] += hub.z;
    record.localPoint = [...record.position];
  });

  const instanceRecords = records.map((record) => ({
    ...record,
    position: [record.position[0] - hub.x, record.position[1] - hub.y, record.position[2] - hub.z] as [number, number, number],
  }));
  const { near, mid, far } = createTreeLevels(instanceRecords);
  const lod = new THREE.LOD();
  lod.name = 'ACADEMIC__ARBORETUM_THREE_TIER_LOD';
  lod.userData.academicTreeLod = true;
  lod.addLevel(near, 0);
  lod.addLevel(mid, 70);
  lod.addLevel(far, 140);
  root.add(lod);

  const wetLeaves = createWetLeaves(hub, benchAnchors);
  root.add(wetLeaves);
  const collisionGuide = new THREE.Object3D();
  collisionGuide.name = 'ACADEMIC__TREE_TRUNK_PRECISE_WALK_COLLISION';
  collisionGuide.userData.academicTreeCollisionGuide = true;
  collisionGuide.userData.navBarrierSegments = instanceRecords.map((record) => ({
    start: [record.position[0], 0.02, record.position[2]],
    end: [record.position[0], Math.max(1.15, record.height * 0.58), record.position[2]],
    radius: Math.max(0.065, record.trunkRadius * 1.12),
  }));
  root.add(collisionGuide);

  const speciesCounts = Object.fromEntries((Object.keys(SPECIES) as AcademicTreeSpeciesId[]).map((species) => [species, records.filter((record) => record.species === species).length]));
  const windProfiles = Object.fromEntries((Object.values(SPECIES)).map((profile) => [profile.id, {
    id: `${profile.id}-wind`, species: profile.id, speciesId: profile.id,
    amplitude: profile.windAmplitude, frequency: profile.windFrequency,
    movement: profile.crownHabit === 'drooping' ? 'flexible drooping response' : profile.evergreen ? 'restrained evergreen response' : 'broadleaf response',
  }]));
  const summary = {
    count: records.length,
    treeCount: records.length,
    totalTrees: records.length,
    speciesCount: Object.keys(SPECIES).length,
    speciesIds: Object.keys(SPECIES),
    speciesCounts,
    requiredZoneSpecies: Object.fromEntries(PLANTING.map((row) => [row.zone, [...(PLANTING.filter((item) => item.zone === row.zone).map((item) => item.species))]])),
    proceduralControls: ['age', 'canopy-density', 'leaf-retention', 'moss', 'ivy', 'deadwood', 'lean', 'wind-exposure'],
    structuralVariants: [...VARIANTS],
    autumnPalette: ACADEMIC_AUTUMN_PALETTE.map((entry) => ({ ...entry })),
    wetLeafContexts: wetLeaves.userData.wetLeafContexts,
    lodTiers: ['near', 'mid', 'far'],
    windProfiles,
    windPhases: records.map((record) => record.windPhase),
    instancing: { enabled: true, structuralRoles: ['trunks', 'roots', 'branches', 'canopy lobes', 'defects', 'moss', 'ivy', 'fallen leaves'] },
    preciseBarrierCount: records.length,
    canopyStates: {
      full: records.filter((record) => record.canopyState === 'full').length,
      thinning: records.filter((record) => record.canopyState === 'thinning').length,
      nearlyBare: records.filter((record) => record.canopyState === 'nearly-bare').length,
    },
    barkTextureFamilies: ['fissured', 'smooth', 'mottled', 'fibrous', 'conifer'],
  };
  root.userData.treeRecords = records;
  root.userData.academicTreePopulation = summary;
  root.userData.proceduralControls = summary.proceduralControls;
  root.userData.structuralVariants = summary.structuralVariants;
  root.userData.autumnPalette = summary.autumnPalette;
  root.userData.wetLeafContexts = summary.wetLeafContexts;
  root.userData.lodTiers = summary.lodTiers;
  root.userData.windProfiles = summary.windProfiles;
  root.userData.windPhases = summary.windPhases;
  root.userData.windTime = 0;
  applyAcademicTreeSeason(root, 'summer');
  configureAcademicTreeQuality(root, 'medium');
  return root;
}

export function applyAcademicTreeSeason(root: THREE.Object3D, season: AcademicTreeSeason) {
  const color = new THREE.Color();
  root.traverse((object) => {
    if (object instanceof THREE.InstancedMesh && object.userData.academicTreeSeasonColors) {
      const colors = object.userData.academicTreeSeasonColors[season] as string[] | undefined;
      colors?.forEach((value, index) => object.setColorAt(index, color.set(value)));
      if (object.instanceColor) object.instanceColor.needsUpdate = true;
      object.userData.academicTreeActiveSeason = season;
    }
    if (object.userData.academicAutumnOnly === true) {
      object.userData.academicTreeSeasonVisible = season === 'autumn';
      object.visible = object.userData.academicTreeSeasonVisible === true && object.userData.academicTreeQualityVisible !== false;
    }
    if (object.userData.academicTreeSystem === true) object.userData.activeSeason = season;
  });
}

export function configureAcademicTreeQuality(root: THREE.Object3D, quality: AcademicTreeQuality) {
  // The arboretum spans roughly 110 units from its hub. Medium/high keep the
  // veteran-detail tier available even beside the remote boundary beeches;
  // the overview still resolves to the compact far tier.
  const distances = quality === 'high' ? [0, 140, 220] : quality === 'low' ? [0, 65, 115] : [0, 125, 190];
  root.traverse((object) => {
    if (object instanceof THREE.LOD && object.userData.academicTreeLod === true) {
      object.levels.forEach((level, index) => { level.distance = distances[index] ?? distances[distances.length - 1]; });
    }
    if (object instanceof THREE.InstancedMesh && object.userData.academicTreeFullInstanceCount) {
      const full = Number(object.userData.academicTreeFullInstanceCount);
      object.count = quality === 'high' ? full : quality === 'medium' ? Math.max(1, Math.ceil(full * 0.7)) : Math.max(1, Math.ceil(full * 0.38));
      object.userData.academicTreeQualityVisible = true;
      object.visible = object.userData.academicTreeSeasonVisible === true;
    }
    if (object.userData.academicTreeSystem === true) object.userData.graphicsQuality = quality;
  });
}

export function updateAcademicTreeWind(object: THREE.Object3D, time: number) {
  const mesh = object as THREE.Mesh;
  const materials = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
  materials.forEach((material) => {
    const uniforms = material.userData.windUniforms as { uTime?: { value: number } } | undefined;
    if (uniforms?.uTime) uniforms.uTime.value = time;
  });
  let cursor: THREE.Object3D | null = object;
  while (cursor && cursor.userData.academicTreeSystem !== true) cursor = cursor.parent;
  if (cursor) cursor.userData.windTime = time;
}
