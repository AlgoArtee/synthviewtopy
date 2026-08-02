import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type MolecularBuildingForm =
  | 'genesis'
  | 'xenocodon'
  | 'protosphere'
  | 'asterion'
  | 'palimpsest'
  | 'symbiogenesis'
  | 'automata'
  | 'darwin'
  | 'morphogen'
  | 'cryptobiosis';

export interface MolecularBiologyBuildingProgram {
  code: string;
  name: string;
  purpose: string;
  form: MolecularBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
}

export const MOLECULAR_BIOLOGY_BUILDING_PROGRAM: readonly MolecularBiologyBuildingProgram[] = [
  {
    code: 'MB1',
    name: 'Genesis Forge',
    purpose: 'Synthetic Genome Fabrication and Minimal-Life Institute',
    form: 'genesis',
    footprintMetres: [115, 76],
    heightMetres: 42,
    radialT: 0.13,
    angularT: 0.50,
    placementZone: 'Inner threshold facing Microbiology and Genomics',
    exteriorMotif: 'complementary curved wings, codon-panel rhythms, and a transparent transcription rift',
  },
  {
    code: 'MB2',
    name: 'Xenocodon Bastion',
    purpose: 'Xenobiology, Orthogonal Genetics and Alternative Biochemistry Facility',
    form: 'xenocodon',
    footprintMetres: [88, 84],
    heightMetres: 58,
    radialT: 0.14,
    angularT: 0.76,
    placementZone: 'Northern boundary adjacent to Security',
    exteriorMotif: 'three chiral black monoliths, exclusion rings, and kinetic containment shutters',
  },
  {
    code: 'MB3',
    name: 'The Protosphere Complex',
    purpose: 'Origins-of-Life and Artificial Protocell Research Centre',
    form: 'protosphere',
    footprintMetres: [132, 98],
    heightMetres: 35,
    radialT: 0.14,
    angularT: 0.14,
    placementZone: 'Southern boundary near Biochemistry',
    exteriorMotif: 'seven translucent protocell volumes settled within a mineral-rich prebiotic basin',
  },
  {
    code: 'MB4',
    name: 'Asterion Exobiology Array',
    purpose: 'Astrobiology and Extraterrestrial Molecular Systems Institute',
    form: 'asterion',
    footprintMetres: [148, 105],
    heightMetres: 51,
    radialT: 0.83,
    angularT: 0.15,
    placementZone: 'Outer edge oriented toward the Tundra and Desert Domes',
    exteriorMotif: 'Mars, ocean-moon, and Titan wings converging beneath a tilted analytical shield',
  },
  {
    code: 'MB5',
    name: 'Palimpsest Tower',
    purpose: 'Epigenetic Programming and Cellular Identity Institute',
    form: 'palimpsest',
    footprintMetres: [67, 63],
    heightMetres: 79,
    radialT: 0.43,
    angularT: 0.42,
    placementZone: 'Central district landmark',
    exteriorMotif: 'a glass core successively concealed by chromatin fins and overwritten metallic ribbons',
  },
  {
    code: 'MB6',
    name: 'Symbiogenesis Arc',
    purpose: 'Organelle Engineering and Engineered Endosymbiosis Centre',
    form: 'symbiogenesis',
    footprintMetres: [136, 83],
    heightMetres: 46,
    radialT: 0.43,
    angularT: 0.26,
    placementZone: 'Southeastern interface with Biochemistry',
    exteriorMotif: 'a dark host crescent permanently integrated with a luminous ovoid and six organelle pods',
  },
  {
    code: 'MB7',
    name: 'Molecular Automata Loom',
    purpose: 'DNA Nanotechnology, Molecular Robotics and Biological Computing Laboratory',
    form: 'automata',
    footprintMetres: [158, 64],
    heightMetres: 39,
    radialT: 0.43,
    angularT: 0.88,
    placementZone: 'Molecular Meridian route toward Bioanalytics',
    exteriorMotif: 'four braided structural bands carrying travelling molecular-computation signals',
  },
  {
    code: 'MB8',
    name: 'The Darwin Engine',
    purpose: 'Continuous Evolution and Adaptive Biodesign Tower',
    form: 'darwin',
    footprintMetres: [72, 70],
    heightMetres: 91,
    radialT: 0.43,
    angularT: 0.64,
    placementZone: 'Central transit route',
    exteriorMotif: 'twelve successively rotated material strata and branching selection paths',
  },
  {
    code: 'MB9',
    name: 'Morphogen Exchange',
    purpose: 'Cellular Signalling and Synthetic Pattern-Formation Institute',
    form: 'morphogen',
    footprintMetres: [124, 94],
    heightMetres: 52,
    radialT: 0.82,
    angularT: 0.49,
    placementZone: 'Outer-central Bioanalytics and Computational Biology link',
    exteriorMotif: 'five unequal gradient wings radiating from a translucent signalling hub',
  },
  {
    code: 'MB10',
    name: 'Cryptobiosis Vault',
    purpose: 'Extremophile Biology, Molecular Preservation and Deep-Time Archive',
    form: 'cryptobiosis',
    footprintMetres: [142, 108],
    heightMetres: 24,
    radialT: 0.83,
    angularT: 0.85,
    placementZone: 'Quiet northeastern corner between Security and the outer ring',
    exteriorMotif: 'a buried dark archive beneath overlapping glacier-like ceramic planes',
  },
] as const;

const DISTRICT_ID = 'molecular-biology-labs';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 22, 14);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_X = new THREE.Vector3(1, 0, 0);
const TORUS_GEOMETRY_CACHE = new Map<string, THREE.TorusGeometry>();

type MolecularMaterials = ReturnType<typeof createMolecularMaterials>;

function districtMaterial(
  name: string,
  color: THREE.ColorRepresentation,
  options: THREE.MeshStandardMaterialParameters = {},
) {
  return new THREE.MeshStandardMaterial({ name, color, roughness: 0.62, metalness: 0.14, ...options });
}

function createMolecularMaterials() {
  const bioceramic = districtMaterial('Molecular Biology satin white bioceramic', '#e7e9e4', { roughness: 0.68, metalness: 0.03 });
  const paleCeramic = districtMaterial('Molecular Biology pale mineral ceramic', '#cdd5d0', { roughness: 0.72, metalness: 0.03 });
  const graphite = districtMaterial('Molecular Biology graphite titanium', '#20282c', { roughness: 0.34, metalness: 0.8 });
  const blackTitanium = districtMaterial('Xenocodon black iridescent titanium ceramic', '#17151d', { roughness: 0.27, metalness: 0.76 });
  const silver = districtMaterial('Molecular Biology brushed silver alloy', '#aeb8b9', { roughness: 0.28, metalness: 0.9 });
  const bronze = districtMaterial('Molecular Biology bronze structural alloy', '#8b6449', { roughness: 0.37, metalness: 0.78 });
  const basalt = districtMaterial('Molecular Biology polished black basalt', '#101416', { roughness: 0.84, metalness: 0.08 });
  const quartz = districtMaterial('Xenocodon pale crushed quartz field', '#d8d3c6', { roughness: 0.98, metalness: 0 });
  const laboratoryGlass = districtMaterial('Molecular Biology pale blue laboratory glass', '#91cbd4', {
    emissive: '#356b78', emissiveIntensity: 0.19, roughness: 0.06, metalness: 0.08, transparent: true, opacity: 0.48, side: THREE.DoubleSide,
  });
  const darkGlass = districtMaterial('Molecular Biology deep shielding glass', '#101d27', {
    emissive: '#142936', emissiveIntensity: 0.16, roughness: 0.1, metalness: 0.26, transparent: true, opacity: 0.78, side: THREE.DoubleSide,
  });
  const membrane = districtMaterial('Protosphere pearlescent translucent membrane', '#c8e5dd', {
    emissive: '#5e8c85', emissiveIntensity: 0.2, roughness: 0.18, metalness: 0.04, transparent: true, opacity: 0.62, side: THREE.DoubleSide,
  });
  const organelle = districtMaterial('Symbiogenesis pearlescent organelle ceramic', '#dbe7c9', {
    emissive: '#708f5c', emissiveIntensity: 0.13, roughness: 0.3, metalness: 0.08,
  });
  const mars = districtMaterial('Asterion iron-rich Mars ceramic', '#7e3f31', { roughness: 0.88, metalness: 0.08 });
  const ice = districtMaterial('Asterion ocean-moon glacial shell', '#dce9ea', { roughness: 0.48, metalness: 0.2 });
  const titanGlass = districtMaterial('Asterion Titan smoked amber glass', '#6f4a2d', {
    emissive: '#5d3217', emissiveIntensity: 0.25, roughness: 0.08, metalness: 0.18, transparent: true, opacity: 0.72, side: THREE.DoubleSide,
  });
  const redMineral = districtMaterial('Protosphere iron-rich mineral shelf', '#814332', { roughness: 0.95, metalness: 0.03 });
  const sulfur = districtMaterial('Protosphere sulfur-yellow mineral shelf', '#b09b45', { roughness: 0.94, metalness: 0.02 });
  const palePaving = districtMaterial('Molecular Meridian pale interaction paving', '#b9c2bd', { roughness: 0.9, metalness: 0.02, side: THREE.DoubleSide });
  const darkPaving = districtMaterial('Molecular Meridian dark molecular paving', '#30383a', { roughness: 0.94, metalness: 0.02, side: THREE.DoubleSide });
  const blackWater = districtMaterial('Molecular Biology reflective black process water', '#071419', {
    emissive: '#0b3440', emissiveIntensity: 0.17, roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.84, side: THREE.DoubleSide,
  });
  const planting = districtMaterial('Molecular Biology controlled fern and moss landscape', '#486451', { roughness: 1, metalness: 0 });
  const palePlanting = districtMaterial('Molecular Biology pale engineered grass', '#829276', { roughness: 1, metalness: 0 });
  const coldLight = districtMaterial('Molecular Biology cold-white transcription light', '#efffff', { emissive: '#c9ffff', emissiveIntensity: 3.4, roughness: 0.1 });
  const circuitLight = districtMaterial('Molecular Meridian information-circuit light', '#72f2ce', { emissive: '#40e8ba', emissiveIntensity: 3.5, roughness: 0.1 });
  const violetLight = districtMaterial('Xenocodon pale-violet containment notation', '#b19aff', { emissive: '#7a58ff', emissiveIntensity: 3.3, roughness: 0.1 });
  const redLight = districtMaterial('Asterion muted Mars process light', '#ff8464', { emissive: '#e3472f', emissiveIntensity: 2.9, roughness: 0.1 });
  const amberLight = districtMaterial('Asterion Titan amber process light', '#ffc27a', { emissive: '#e47a25', emissiveIntensity: 3.0, roughness: 0.1 });
  [coldLight, circuitLight, violetLight, redLight, amberLight].forEach((material) => { material.userData.isDistrictAccent = true; });
  return {
    bioceramic, paleCeramic, graphite, blackTitanium, silver, bronze, basalt, quartz,
    laboratoryGlass, darkGlass, membrane, organelle, mars, ice, titanGlass, redMineral,
    sulfur, palePaving, darkPaving, blackWater, planting, palePlanting, coldLight,
    circuitLight, violetLight, redLight, amberLight,
  };
}

function prepare<T extends THREE.Object3D>(object: T, name: string, obstacle = false) {
  object.name = name;
  object.userData.selectableId = DISTRICT_ID;
  object.userData.districtId = DISTRICT_ID;
  if (object instanceof THREE.Mesh) {
    object.castShadow = obstacle;
    object.receiveShadow = true;
    object.userData.navObstacle = obstacle;
  }
  return object;
}

function box(
  parent: THREE.Object3D,
  name: string,
  size: readonly [number, number, number],
  material: THREE.Material,
  position: readonly [number, number, number],
  obstacle = false,
  rotation: readonly [number, number, number] = [0, 0, 0],
) {
  const mesh = prepare(new THREE.Mesh(UNIT_BOX, material), name, obstacle);
  mesh.scale.set(...size);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function cylinder(
  parent: THREE.Object3D,
  name: string,
  diameter: number,
  height: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  obstacle = false,
  segments = 24,
  rotation: readonly [number, number, number] = [0, 0, 0],
) {
  const geometry = segments <= 12 ? UNIT_CYLINDER_12 : UNIT_CYLINDER_24;
  const mesh = prepare(new THREE.Mesh(geometry, material), name, obstacle);
  mesh.scale.set(diameter, height, diameter);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function ellipse(
  parent: THREE.Object3D,
  name: string,
  diameter: readonly [number, number],
  height: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  obstacle = false,
  segments = 48,
) {
  const mesh = prepare(new THREE.Mesh(segments <= 12 ? UNIT_CYLINDER_12 : UNIT_CYLINDER_24, material), name, obstacle);
  mesh.scale.set(diameter[0], height, diameter[1]);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function ellipsoid(
  parent: THREE.Object3D,
  name: string,
  scale: readonly [number, number, number],
  material: THREE.Material,
  position: readonly [number, number, number],
  obstacle = false,
  rotation: readonly [number, number, number] = [0, 0, 0],
) {
  const mesh = prepare(new THREE.Mesh(UNIT_SPHERE, material), name, obstacle);
  mesh.scale.set(...scale);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function torus(
  parent: THREE.Object3D,
  name: string,
  radius: number,
  tube: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0],
  arc = Math.PI * 2,
) {
  const geometryKey = `${radius.toFixed(4)}|${tube.toFixed(4)}|${arc.toFixed(4)}`;
  let geometry = TORUS_GEOMETRY_CACHE.get(geometryKey);
  if (!geometry) {
    geometry = new THREE.TorusGeometry(radius, tube, 7, 44, arc);
    TORUS_GEOMETRY_CACHE.set(geometryKey, geometry);
  }
  const mesh = prepare(new THREE.Mesh(geometry, material), name);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function pipe(
  parent: THREE.Object3D,
  name: string,
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  obstacle = false,
) {
  const direction = end.clone().sub(start);
  const mesh = prepare(new THREE.Mesh(UNIT_CYLINDER_12, material), name, obstacle);
  mesh.scale.set(radius * 2, direction.length(), radius * 2);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UNIT_Y, direction.normalize());
  parent.add(mesh);
  return mesh;
}

function slabBetween(
  parent: THREE.Object3D,
  name: string,
  start: THREE.Vector3,
  end: THREE.Vector3,
  width: number,
  height: number,
  material: THREE.Material,
  obstacle = true,
) {
  const direction = end.clone().sub(start);
  const mesh = prepare(new THREE.Mesh(UNIT_BOX, material), name, obstacle);
  mesh.scale.set(direction.length() + 0.08, height, width);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UNIT_X, direction.normalize());
  parent.add(mesh);
  return mesh;
}

function tubePath(
  parent: THREE.Object3D,
  name: string,
  points: readonly THREE.Vector3[],
  radius: number,
  material: THREE.Material,
  closed = false,
) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => point.clone()), closed, 'catmullrom', 0.42);
  const mesh = prepare(new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, points.length * 6), radius, 7, closed), material), name);
  parent.add(mesh);
  return mesh;
}

function addRibbon(
  parent: THREE.Object3D,
  name: string,
  points: readonly THREE.Vector3[],
  width: number,
  material: THREE.Material,
  walkable = true,
) {
  const vertices: number[] = [];
  const indices: number[] = [];
  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const tangent = next.clone().sub(previous).setY(0).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5);
    vertices.push(
      point.x + normal.x, point.y, point.z + normal.z,
      point.x - normal.x, point.y, point.z - normal.z,
    );
    if (index < points.length - 1) {
      const base = index * 2;
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = prepare(new THREE.Mesh(geometry, material), name);
  mesh.userData.walkable = walkable;
  mesh.userData.navObstacle = false;
  mesh.userData.molecularRoute = true;
  parent.add(mesh);
  return mesh;
}

function crescent(
  parent: THREE.Object3D,
  name: string,
  width: number,
  depth: number,
  height: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  obstacle = true,
) {
  const points: THREE.Vector2[] = [];
  for (let index = 0; index <= 36; index += 1) {
    const angle = THREE.MathUtils.lerp(-2.24, 2.24, index / 36);
    points.push(new THREE.Vector2(Math.cos(angle) * width * 0.5, Math.sin(angle) * depth * 0.5));
  }
  for (let index = 0; index <= 30; index += 1) {
    const angle = THREE.MathUtils.lerp(2.24, -2.24, index / 30);
    points.push(new THREE.Vector2(Math.cos(angle) * width * 0.28 - width * 0.1, Math.sin(angle) * depth * 0.28));
  }
  const geometry = new THREE.ExtrudeGeometry(new THREE.Shape(points), {
    depth: height, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 2, curveSegments: 18,
  });
  geometry.rotateX(-Math.PI / 2);
  const mesh = prepare(new THREE.Mesh(geometry, material), name, obstacle);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function addGenesisForge(root: THREE.Group, materials: MolecularMaterials) {
  ellipse(root, 'MOLECULAR__MB1__CODON_COURT', [10.8, 7.0], 0.08, materials.palePaving, [0, 0.07, 0]);
  for (let wing = 0; wing < 2; wing += 1) {
    const side = wing === 0 ? -1 : 1;
    const cladding = wing === 0 ? materials.bioceramic : materials.graphite;
    for (let segment = 0; segment < 7; segment += 1) {
      const x = -4.8 + segment * 1.6;
      const z = side * (1.5 + Math.pow(x / 5, 2) * 0.48);
      const angle = side * x * 0.025;
      box(root, `MOLECULAR__MB1__${wing === 0 ? 'PALE' : 'GRAPHITE'}_WING_SEGMENT_${segment + 1}`, [1.72, 3.85, 2.45], cladding, [x, 2.02, z], true, [0, angle, 0]);
      for (let panel = 0; panel < 3; panel += 1) {
        const panelX = x - 0.52 + panel * 0.52;
        const facadeZ = z + side * 1.24;
        box(root, `MOLECULAR__MB1__CODON_PANEL_${wing + 1}_${segment + 1}_${panel + 1}`, [0.34, 2.25, 0.055], panel === 1 ? materials.silver : materials.laboratoryGlass, [panelX, 2.0, facadeZ], false, [0, angle, 0]);
        if ((segment + panel) % 3 === 0) {
          box(root, `MOLECULAR__MB1__TRANSCRIPTION_LIGHT_${wing + 1}_${segment + 1}_${panel + 1}`, [0.26, 0.055, 0.07], materials.coldLight.clone(), [panelX, 3.34, facadeZ + side * 0.04]).userData.animate = 'molecular-info-pulse';
        }
      }
    }
  }
  box(root, 'MOLECULAR__MB1__TRANSCRIPTION_RIFT_GLASS_SPINE', [0.42, 3.92, 4.0], materials.laboratoryGlass, [0, 2.08, 0], true);
  [-2.8, -0.7, 1.65, 3.4].forEach((x, index) => {
    box(root, `MOLECULAR__MB1__OFFSET_CROSS_LINK_${index + 1}`, [1.7, 0.42, 3.25], materials.laboratoryGlass, [x, 1.25 + index * 0.68, 0], true);
  });
  box(root, 'MOLECULAR__MB1__MONUMENTAL_ENTRANCE_CANOPY', [5.0, 0.23, 2.0], materials.silver, [0, 1.12, 4.0], true);
  box(root, 'MOLECULAR__MB1__BLACK_GLASS_MOLECULAR_CLEFT', [2.35, 1.72, 0.18], materials.darkGlass, [0, 0.95, 3.4]);
  for (let light = 0; light < 28; light += 1) {
    const x = -2.2 + (light % 14) * 0.34;
    const z = 3.3 + Math.floor(light / 14) * 0.5;
    cylinder(root, `MOLECULAR__MB1__CANOPY_GENOME_POINT_${light + 1}`, 0.045, 0.04, light % 3 === 0 ? materials.circuitLight : materials.coldLight, [x, 0.985, z], false, 12);
  }
  for (let tower = 0; tower < 4; tower += 1) {
    const x = -4.1 + tower * 2.7;
    cylinder(root, `MOLECULAR__MB1__FABRICATION_SERVICE_TOWER_${tower + 1}`, 0.72, 3.1 + (tower % 2) * 0.5, tower % 2 ? materials.silver : materials.bioceramic, [x, 1.65, -3.1], true, 24);
    for (let pipeIndex = 0; pipeIndex < 3; pipeIndex += 1) {
      cylinder(root, `MOLECULAR__MB1__SERVICE_PIPE_${tower + 1}_${pipeIndex + 1}`, 0.08, 3.25, pipeIndex === 1 ? materials.circuitLight : materials.silver, [x - 0.38 + pipeIndex * 0.38, 1.72, -3.52], false, 12);
    }
  }
  for (let vent = 0; vent < 8; vent += 1) {
    cylinder(root, `MOLECULAR__MB1__PERFORATED_ROOF_VENT_${vent + 1}`, 0.3, 0.8, materials.paleCeramic, [-4.4 + vent * 1.25, 4.25, vent % 2 ? -1.55 : 1.55], false, 12);
  }
}

function addXenocodonBastion(root: THREE.Group, materials: MolecularMaterials) {
  ellipse(root, 'MOLECULAR__MB2__ELEVATED_CONTAINMENT_PLINTH', [8.6, 8.0], 0.34, materials.basalt, [0, 0.2, 0], true, 12);
  [3.7, 3.1, 2.55].forEach((radius, index) => {
    torus(root, `MOLECULAR__MB2__EXCLUSION_ZONE_${index + 1}`, radius, 0.1 + index * 0.025, index === 0 ? materials.quartz : index === 1 ? materials.blackTitanium : materials.silver, [0, 0.4 + index * 0.012, 0]);
  });
  const monoliths = [
    { x: -2.05, z: -0.25, h: 5.2, r: -0.11 },
    { x: 0.05, z: 0.35, h: 5.65, r: 0.08 },
    { x: 2.1, z: -0.18, h: 5.3, r: -0.04 },
  ];
  monoliths.forEach((record, index) => {
    cylinder(root, `MOLECULAR__MB2__CHIRAL_MONOLITH_${index + 1}`, 3.25, record.h, materials.blackTitanium, [record.x, 0.38 + record.h * 0.5, record.z], true, 8, [0, record.r, 0]);
    for (let windowIndex = 0; windowIndex < 6; windowIndex += 1) {
      box(root, `MOLECULAR__MB2__DEEP_SHIELDED_WINDOW_${index + 1}_${windowIndex + 1}`, [1.45, 0.12, 0.08], windowIndex % 2 ? materials.darkGlass : materials.violetLight, [record.x, 1.2 + windowIndex * 0.62, record.z + 1.58], false, [0, record.r, 0]);
    }
  });
  const bridgeStart = new THREE.Vector3(-3.9, 0.52, 3.6);
  const bridgeTurn = new THREE.Vector3(-1.65, 0.66, 2.05);
  const bridgeEnd = new THREE.Vector3(-0.75, 0.76, 1.25);
  slabBetween(root, 'MOLECULAR__MB2__DIAGONAL_SECURITY_BRIDGE_A', bridgeStart, bridgeTurn, 0.62, 0.18, materials.silver, false);
  slabBetween(root, 'MOLECULAR__MB2__DIAGONAL_SECURITY_BRIDGE_B', bridgeTurn, bridgeEnd, 0.62, 0.18, materials.silver, false);
  box(root, 'MOLECULAR__MB2__HEAVY_CANTILEVERED_THRESHOLD', [2.3, 0.3, 1.25], materials.graphite, [-0.7, 1.25, 1.75], true);
  torus(root, 'MOLECULAR__MB2__SECURE_VEHICLE_DOCK_COLLAR', 0.75, 0.18, materials.silver, [3.15, 1.15, 0], [Math.PI / 2, Math.PI / 2, 0]);
  for (let port = 0; port < 3; port += 1) {
    torus(root, `MOLECULAR__MB2__SEALED_TRANSFER_PORT_${port + 1}`, 0.42, 0.1, port === 1 ? materials.violetLight : materials.silver, [-3.0 + port * 3.0, 3.2 + port * 0.45, -1.55], [Math.PI / 2, 0, 0]);
  }
  for (let shutter = 0; shutter < 30; shutter += 1) {
    const x = -3.25 + (shutter % 10) * 0.72;
    const y = 1.0 + Math.floor(shutter / 10) * 1.28;
    const blade = box(root, `MOLECULAR__MB2__KINETIC_SHUTTER_${shutter + 1}`, [0.48, 0.92, 0.07], shutter % 6 === 0 ? materials.violetLight.clone() : materials.graphite, [x, y, -2.0], false);
    blade.userData.animate = 'molecular-kinetic-shutter';
    blade.userData.baseRotationY = 0;
    blade.userData.phase = shutter * 0.38;
  }
  for (let mast = 0; mast < 9; mast += 1) {
    const x = -3.1 + mast * 0.78;
    pipe(root, `MOLECULAR__MB2__ATMOSPHERIC_SENSOR_${mast + 1}`, new THREE.Vector3(x, 5.3 - Math.abs(x) * 0.1, -0.6), new THREE.Vector3(x + (mast % 2 ? 0.15 : -0.15), 6.15 + (mast % 3) * 0.12, -0.6), 0.025, materials.silver);
  }
}

function addProtosphereComplex(root: THREE.Group, materials: MolecularMaterials) {
  ellipse(root, 'MOLECULAR__MB3__PREBIOTIC_BASIN', [12.7, 9.2], 0.16, materials.blackWater, [0, 0.06, 0]);
  const mineralZones = [
    { x: -4.2, z: 2.7, sx: 3.0, sz: 1.7, material: materials.paleCeramic, name: 'LIMESTONE' },
    { x: -3.9, z: -2.5, sx: 2.8, sz: 1.6, material: materials.redMineral, name: 'IRON' },
    { x: 4.2, z: -2.4, sx: 3.0, sz: 1.7, material: materials.basalt, name: 'BASALT' },
    { x: 4.35, z: 2.45, sx: 2.6, sz: 1.45, material: materials.sulfur, name: 'SULFUR' },
  ];
  mineralZones.forEach((zone) => ellipse(root, `MOLECULAR__MB3__${zone.name}_MINERAL_SHELF`, [zone.sx, zone.sz], 0.13, zone.material, [zone.x, 0.18, zone.z]));
  const cells = [
    { x: 0, y: 1.55, z: 0, s: [5.7, 3.2, 4.4] as const, m: materials.membrane, n: 'CENTRAL_FLATTENED_SPHERE' },
    { x: -4.3, y: 1.05, z: 1.3, s: [2.6, 2.0, 2.3] as const, m: materials.laboratoryGlass, n: 'CLEAR_CELL' },
    { x: 4.25, y: 0.92, z: 1.15, s: [2.55, 1.65, 2.2] as const, m: materials.bioceramic, n: 'OPAQUE_CELL' },
    { x: -3.25, y: 0.82, z: -2.55, s: [3.0, 1.45, 1.9] as const, m: materials.organelle, n: 'PEARLESCENT_DROPLET' },
    { x: 3.2, y: 0.9, z: -2.55, s: [3.15, 1.6, 1.8] as const, m: materials.membrane, n: 'TRANSLUCENT_DROPLET' },
    { x: -5.2, y: 0.65, z: -0.8, s: [1.8, 1.25, 1.7] as const, m: materials.paleCeramic, n: 'HEMISPHERE_A' },
    { x: 5.25, y: 0.7, z: -0.65, s: [1.9, 1.35, 1.75] as const, m: materials.laboratoryGlass, n: 'HEMISPHERE_B' },
  ];
  cells.forEach((cell, index) => {
    ellipsoid(root, `MOLECULAR__MB3__PROTOCELL_${index + 1}_${cell.n}`, cell.s, cell.m, [cell.x, cell.y, cell.z], true, [0, index * 0.22, 0]);
    torus(root, `MOLECULAR__MB3__IRIS_SKYLIGHT_${index + 1}`, Math.max(0.32, cell.s[0] * 0.12), 0.07, index % 2 ? materials.silver : materials.coldLight, [cell.x, cell.y + cell.s[1] * 0.48, cell.z], [Math.PI / 2, 0, 0]);
  });
  const links: Array<[number, number]> = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 6]];
  links.forEach(([from, to], index) => {
    const a = cells[from]; const b = cells[to];
    slabBetween(root, `MOLECULAR__MB3__MEMBRANE_JUNCTION_${index + 1}`, new THREE.Vector3(a.x, 1.05 + index * 0.08, a.z), new THREE.Vector3(b.x, 0.95 + index * 0.06, b.z), 0.42, 0.34, materials.laboratoryGlass, true);
  });
  torus(root, 'MOLECULAR__MB3__CIRCULAR_ENTRANCE_RING', 0.9, 0.16, materials.silver, [0, 1.15, 2.25], [0, 0, 0]);
  const walkwayPoints = [new THREE.Vector3(0, 0.35, 5.2), new THREE.Vector3(-0.8, 0.48, 3.8), new THREE.Vector3(0, 0.55, 2.25)];
  for (let index = 0; index < walkwayPoints.length - 1; index += 1) slabBetween(root, `MOLECULAR__MB3__ELEVATED_WHITE_WALKWAY_${index + 1}`, walkwayPoints[index], walkwayPoints[index + 1], 0.78, 0.15, materials.bioceramic, false);
  for (let tower = 0; tower < 8; tower += 1) {
    const angle = tower / 8 * Math.PI * 2;
    cylinder(root, `MOLECULAR__MB3__BASIN_COLLECTION_TOWER_${tower + 1}`, 0.18, 1.05 + (tower % 3) * 0.25, materials.silver, [Math.cos(angle) * 5.4, 0.72, Math.sin(angle) * 3.7], false, 12);
  }
}

function addAsterionArray(root: THREE.Group, materials: MolecularMaterials) {
  box(root, 'MOLECULAR__MB4__CENTRAL_ANALYTICAL_SPINE', [2.15, 3.7, 7.4], materials.graphite, [0, 1.94, -0.25], true);
  const wings = [
    { name: 'MARS', end: new THREE.Vector3(-5.7, 1.3, 0.4), width: 2.75, material: materials.mars, light: materials.redLight },
    { name: 'OCEAN_MOON', end: new THREE.Vector3(5.8, 1.45, 0.0), width: 2.8, material: materials.ice, light: materials.coldLight },
    { name: 'TITAN', end: new THREE.Vector3(3.9, 1.3, 3.35), width: 2.55, material: materials.titanGlass, light: materials.amberLight },
  ];
  wings.forEach((wing, index) => {
    slabBetween(root, `MOLECULAR__MB4__${wing.name}_WING`, new THREE.Vector3(0, 1.3, 0.55), wing.end, wing.width, 2.25, wing.material, true);
    for (let fin = 0; fin < 8; fin += 1) {
      const t = (fin + 1) / 9;
      const point = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 2.55, 0.55), wing.end.clone().setY(2.55), t);
      box(root, `MOLECULAR__MB4__${wing.name}_STRATA_FIN_${fin + 1}`, [0.1, 0.5 + (fin % 3) * 0.17, 0.82], fin % 4 === 0 ? wing.light : materials.silver, point.toArray() as [number, number, number], false, [0, Math.atan2(wing.end.x, wing.end.z), 0]);
    }
  });
  const disc = cylinder(root, 'MOLECULAR__MB4__TILTED_ANALYTICAL_SHIELD_DISC', 5.1, 0.48, materials.silver, [0, 4.55, -2.3], true, 24, [Math.PI / 2 - 0.3, 0, 0.12]);
  disc.userData.animate = 'molecular-disc-drift';
  disc.userData.baseRotationZ = 0.12;
  torus(root, 'MOLECULAR__MB4__TILTED_DISC_LIGHT_RING', 2.48, 0.12, materials.coldLight.clone(), [0, 4.55, -2.08], [0.3, 0, 0.12]).userData.animate = 'molecular-info-pulse';
  for (let rib = 0; rib < 12; rib += 1) {
    const angle = rib / 12 * Math.PI * 2;
    pipe(root, `MOLECULAR__MB4__DISC_TRUSS_RIB_${rib + 1}`, new THREE.Vector3(0, 4.35, -2.05), new THREE.Vector3(Math.cos(angle) * 2.35, 4.35 + Math.sin(angle) * 2.0, -2.1), 0.035, materials.graphite);
  }
  box(root, 'MOLECULAR__MB4__CONVERGENCE_ENTRANCE_RAMP', [3.1, 0.22, 4.1], materials.palePaving, [0, 0.28, 4.1], false, [-0.06, 0, 0]);
  for (let port = 0; port < 5; port += 1) {
    const x = -4.4 + port * 2.2;
    torus(root, `MOLECULAR__MB4__SEALED_SAMPLE_DOCK_${port + 1}`, 0.52, 0.16, materials.silver, [x, 1.35, -4.55], [0, 0, 0]);
    torus(root, `MOLECULAR__MB4__DOCK_STATUS_BAND_${port + 1}`, 0.38, 0.07, port % 3 === 0 ? materials.redLight : port % 3 === 1 ? materials.coldLight : materials.amberLight, [x, 1.35, -4.58], [0, 0, 0]);
  }
  for (let ring = 0; ring < 5; ring += 1) torus(root, `MOLECULAR__MB4__OCEAN_MOON_TOWER_RING_${ring + 1}`, 0.5, 0.08, ring % 2 ? materials.silver : materials.coldLight, [5.25, 2.8 + ring * 0.52, -0.15]);
  for (let vessel = 0; vessel < 4; vessel += 1) ellipsoid(root, `MOLECULAR__MB4__TITAN_PRESSURE_VESSEL_${vessel + 1}`, [1.1, 1.35, 0.7], vessel % 2 ? materials.bronze : materials.titanGlass, [2.0 + vessel * 0.8, 1.55, 2.75 + (vessel % 2) * 0.42], true);
}

function addPalimpsestTower(root: THREE.Group, materials: MolecularMaterials) {
  [3.15, 2.55, 1.95].forEach((radius, index) => torus(root, `MOLECULAR__MB5__SUNKEN_PLAZA_TERRACE_${index + 1}`, radius, 0.32, index === 0 ? materials.palePaving : index === 1 ? materials.basalt : materials.silver, [0, 0.08 + index * 0.04, 0]));
  box(root, 'MOLECULAR__MB5__PALE_BLUE_GLASS_CORE', [3.35, 7.55, 3.05], materials.laboratoryGlass, [0, 3.88, 0], true);
  const finCount = 44;
  for (let fin = 0; fin < finCount; fin += 1) {
    const side = fin % 4;
    const offset = Math.floor(fin / 4);
    const t = offset / Math.ceil(finCount / 4);
    const spread = -1.52 + t * 3.04;
    const open = side === 1 ? t : 1 - t;
    let x = 0; let z = 0; let rotationY = 0;
    if (side === 0) { x = spread; z = 1.72; }
    if (side === 1) { x = 1.85; z = spread; rotationY = Math.PI / 2; }
    if (side === 2) { x = -spread; z = -1.72; }
    if (side === 3) { x = -1.85; z = -spread; rotationY = Math.PI / 2; }
    const blade = box(root, `MOLECULAR__MB5__CHROMATIN_FIN_${fin + 1}`, [0.08, 6.8 - open * 1.1, 0.5], materials.bioceramic, [x, 3.72, z], false, [0, rotationY, 0]);
    if (fin % 7 === 0) {
      blade.userData.animate = 'molecular-kinetic-shutter';
      blade.userData.baseRotationY = rotationY;
      blade.userData.phase = fin * 0.4;
    }
  }
  [1.45, 2.7, 4.15, 5.55, 6.75].forEach((height, band) => {
    const points: THREE.Vector3[] = [];
    for (let index = 0; index < 13; index += 1) {
      const angle = index / 12 * Math.PI * 2;
      const radius = 2.15 + Math.sin(angle * 3 + band) * 0.38;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, height + Math.sin(angle * 2) * 0.18, Math.sin(angle) * radius));
    }
    tubePath(root, `MOLECULAR__MB5__OVERWRITTEN_METALLIC_RIBBON_${band + 1}`, points, 0.14, band % 2 ? materials.graphite : materials.silver, true);
  });
  for (let plane = 0; plane < 5; plane += 1) box(root, `MOLECULAR__MB5__OVERLAPPING_ENTRANCE_PLANE_${plane + 1}`, [2.65 - plane * 0.28, 1.3 + plane * 0.08, 0.11], plane % 2 ? materials.darkGlass : materials.bioceramic, [-0.7 + plane * 0.35, 0.8, 2.12 + plane * 0.22], false, [0, (plane - 2) * 0.08, 0]);
  for (let mark = 0; mark < 14; mark += 1) box(root, `MOLECULAR__MB5__EPIGENETIC_MEMORY_MARK_${mark + 1}`, [0.08, 0.28 + (mark % 3) * 0.12, 0.09], materials.coldLight.clone(), [1.72, 0.85 + mark * 0.45, -0.65], false).userData.animate = 'molecular-info-pulse';
  for (let crown = 0; crown < 10; crown += 1) {
    const angle = crown / 10 * Math.PI * 2;
    pipe(root, `MOLECULAR__MB5__OPEN_RIBBON_CROWN_${crown + 1}`, new THREE.Vector3(Math.cos(angle) * 1.75, 7.45, Math.sin(angle) * 1.75), new THREE.Vector3(Math.cos(angle + 0.22) * 2.25, 8.45 + (crown % 2) * 0.25, Math.sin(angle + 0.22) * 2.25), 0.07, crown % 2 ? materials.silver : materials.graphite);
  }
}

function addSymbiogenesisArc(root: THREE.Group, materials: MolecularMaterials) {
  ellipse(root, 'MOLECULAR__MB6__PAIRED_BIOLOGICAL_LANDSCAPE', [12.9, 7.8], 0.1, materials.darkPaving, [0, 0.05, 0]);
  ellipse(root, 'MOLECULAR__MB6__SHADED_FERN_ZONE', [5.5, 3.0], 0.12, materials.planting, [-3.5, 0.15, 1.4]);
  ellipse(root, 'MOLECULAR__MB6__SUNLIT_MINERAL_ZONE', [5.5, 3.0], 0.12, materials.palePlanting, [3.5, 0.15, 1.4]);
  crescent(root, 'MOLECULAR__MB6__DARK_HOST_CRESCENT', 9.2, 6.9, 3.65, materials.graphite, [-0.8, 0.25, -0.35], true);
  ellipsoid(root, 'MOLECULAR__MB6__LUMINOUS_ORGANELLE_OVOID', [5.0, 4.7, 4.0], materials.organelle, [1.45, 2.75, -0.05], true, [0, 0, -0.08]);
  for (let band = 0; band < 4; band += 1) torus(root, `MOLECULAR__MB6__OVOID_GLAZING_BAND_${band + 1}`, 1.55 + band * 0.08, 0.08, band % 2 ? materials.laboratoryGlass : materials.coldLight, [1.45, 1.55 + band * 0.78, -0.05], [Math.PI / 2, 0, 0]);
  for (let rib = 0; rib < 22; rib += 1) {
    const angle = THREE.MathUtils.lerp(-2.1, 2.1, rib / 21);
    const x = -0.8 + Math.cos(angle) * 4.7;
    const z = -0.35 + Math.sin(angle) * 3.4;
    pipe(root, `MOLECULAR__MB6__HOST_VERTICAL_RIB_${rib + 1}`, new THREE.Vector3(x, 0.25, z), new THREE.Vector3(x, 3.6 - Math.abs(angle) * 0.35, z), 0.055, rib % 5 === 0 ? materials.silver : materials.basalt);
  }
  const podMaterials = [materials.silver, materials.darkGlass, materials.bronze, materials.bioceramic, materials.laboratoryGlass, materials.basalt];
  for (let pod = 0; pod < 6; pod += 1) {
    const angle = THREE.MathUtils.lerp(-2.05, 2.05, pod / 5);
    const x = -0.8 + Math.cos(angle) * 5.25;
    const z = -0.35 + Math.sin(angle) * 3.65;
    ellipsoid(root, `MOLECULAR__MB6__SPECIALIZED_ORGANELLE_POD_${pod + 1}`, [1.55, 0.92, 0.78], podMaterials[pod], [x, 2.15 + (pod % 2) * 0.48, z], true, [0, -angle, 0]);
    for (let conduit = 0; conduit < 3; conduit += 1) pipe(root, `MOLECULAR__MB6__EXCHANGE_CONDUIT_${pod + 1}_${conduit + 1}`, new THREE.Vector3(x, 2.0 + conduit * 0.18, z), new THREE.Vector3(1.1, 1.65 + conduit * 0.28, -0.05), 0.035, conduit === 1 ? materials.circuitLight : materials.silver);
  }
  tubePath(root, 'MOLECULAR__MB6__CURVED_ENTRANCE_BRIDGE', [new THREE.Vector3(0, 0.35, 4.15), new THREE.Vector3(0.8, 0.42, 3.15), new THREE.Vector3(0.65, 0.5, 2.25)], 0.42, materials.palePaving);
  box(root, 'MOLECULAR__MB6__PHOTOVOLTAIC_HOST_CANOPY_WEST', [5.1, 0.22, 3.9], materials.darkGlass, [-3.05, 4.15, -0.4], true);
  box(root, 'MOLECULAR__MB6__PHOTOVOLTAIC_HOST_CANOPY_EAST', [1.8, 0.22, 1.35], materials.darkGlass, [3.7, 4.15, -1.65], true);
}

function addAutomataLoom(root: THREE.Group, materials: MolecularMaterials) {
  box(root, 'MOLECULAR__MB7__LOGIC_PLAZA', [15.2, 0.1, 5.8], materials.darkPaving, [0, 0.06, 0]);
  const bandPaths = [
    [new THREE.Vector3(-7.5, 1.0, -1.65), new THREE.Vector3(-2.4, 1.0, -0.8), new THREE.Vector3(2.5, 1.0, -1.45), new THREE.Vector3(7.5, 1.0, -0.55)],
    [new THREE.Vector3(-7.5, 1.1, 1.55), new THREE.Vector3(-2.2, 1.1, 0.75), new THREE.Vector3(2.4, 1.1, 1.45), new THREE.Vector3(7.5, 1.1, 0.6)],
    [new THREE.Vector3(-7.5, 2.45, -0.45), new THREE.Vector3(-2.5, 3.25, 1.15), new THREE.Vector3(2.5, 2.5, -1.0), new THREE.Vector3(7.5, 3.2, 0.45)],
    [new THREE.Vector3(-7.5, 3.0, 0.5), new THREE.Vector3(-2.3, 2.35, -1.1), new THREE.Vector3(2.6, 3.25, 1.05), new THREE.Vector3(7.5, 2.4, -0.4)],
  ];
  bandPaths.forEach((path, band) => {
    for (let segment = 0; segment < path.length - 1; segment += 1) slabBetween(root, `MOLECULAR__MB7__BRAIDED_STRUCTURAL_BAND_${band + 1}_${segment + 1}`, path[segment], path[segment + 1], band < 2 ? 1.25 : 0.68, band < 2 ? 1.75 : 0.52, band % 2 ? materials.graphite : materials.bioceramic, band < 2);
    tubePath(root, `MOLECULAR__MB7__TRAVELLING_LOGIC_SIGNAL_${band + 1}`, path.map((point) => point.clone().setY(point.y + 0.4)), 0.07, materials.circuitLight.clone()).userData.animate = 'molecular-info-pulse';
  });
  for (let frame = 0; frame < 18; frame += 1) {
    const x = -7.2 + frame * 0.84;
    pipe(root, `MOLECULAR__MB7__EXPOSED_DIAGONAL_BRACE_${frame + 1}`, new THREE.Vector3(x, 0.25, -2.2), new THREE.Vector3(x + (frame % 2 ? 0.65 : -0.65), 3.55, 2.1), 0.04, materials.silver);
    box(root, `MOLECULAR__MB7__INTERCHANGEABLE_PANEL_${frame + 1}`, [0.55, 0.55, 0.08], frame % 4 === 0 ? materials.laboratoryGlass : frame % 4 === 1 ? materials.bioceramic : frame % 4 === 2 ? materials.graphite : materials.silver, [x, 1.45 + (frame % 3) * 0.58, frame % 2 ? -2.15 : 2.15], false);
  }
  box(root, 'MOLECULAR__MB7__SHELTERED_PUBLIC_PASSAGE', [8.0, 0.12, 1.1], materials.palePaving, [0, 0.18, 0], false);
  for (let node = 0; node < 16; node += 1) cylinder(root, `MOLECULAR__MB7__PASSAGE_CEILING_NODE_${node + 1}`, 0.1, 0.1, node % 3 ? materials.coldLight : materials.circuitLight, [-3.7 + node * 0.5, 2.7 + Math.sin(node) * 0.25, 0], false, 12);
  for (let tower = 0; tower < 4; tower += 1) {
    const x = -5.6 + tower * 3.7;
    for (let stack = 0; stack < 5; stack += 1) torus(root, `MOLECULAR__MB7__STACKED_FRAME_TOWER_${tower + 1}_${stack + 1}`, 0.42, 0.055, stack % 2 ? materials.silver : materials.circuitLight, [x, 3.0 + stack * 0.4, -1.55], [Math.PI / 2, 0, 0]);
  }
}

function addDarwinEngine(root: THREE.Group, materials: MolecularMaterials) {
  const strataMaterials = [materials.basalt, materials.graphite, materials.paleCeramic, materials.silver, materials.bioceramic, materials.laboratoryGlass];
  for (let level = 0; level < 12; level += 1) {
    const width = 5.6 - level * 0.19;
    const depth = 5.3 - level * 0.17;
    const y = 0.45 + level * 0.68;
    const rotation = (level * 4.5 * Math.PI) / 180;
    box(root, `MOLECULAR__MB8__EVOLUTIONARY_STRATUM_${level + 1}`, [width, 0.62, depth], strataMaterials[Math.min(strataMaterials.length - 1, Math.floor(level / 2))], [0, y, 0], true, [0, rotation, 0]);
    for (let fin = 0; fin < 5; fin += 1) {
      box(root, `MOLECULAR__MB8__ADAPTIVE_SHADE_${level + 1}_${fin + 1}`, [0.42, 0.3 + level * 0.018, 0.08], level > 7 && fin % 2 === 0 ? materials.circuitLight.clone() : materials.silver, [-1.7 + fin * 0.85, y, depth * 0.51], false, [0, rotation + (level > 5 ? fin * 0.04 : 0), 0]);
    }
  }
  for (let ramp = 0; ramp < 7; ramp += 1) torus(root, `MOLECULAR__MB8__BRANCHING_SELECTION_RAMP_${ramp + 1}`, 3.0 + (ramp % 2) * 0.25, 0.16, ramp % 3 === 0 ? materials.palePaving : materials.silver, [0, 1.2 + ramp * 0.88, 0], [Math.PI / 2, 0, ramp * 0.14], Math.PI * (1.1 + (ramp % 2) * 0.35));
  for (let vessel = 0; vessel < 7; vessel += 1) {
    const angle = THREE.MathUtils.lerp(-1.1, 1.1, vessel / 6);
    const x = Math.sin(angle) * 3.45;
    const z = Math.cos(angle) * 3.45;
    cylinder(root, `MOLECULAR__MB8__CONTINUOUS_CULTURE_COLUMN_${vessel + 1}`, 0.62, 2.45, materials.laboratoryGlass, [x, 1.35, z], true, 24);
    torus(root, `MOLECULAR__MB8__SELECTION_STATUS_BAND_${vessel + 1}`, 0.32, 0.065, vessel % 3 === 0 ? materials.circuitLight : materials.coldLight, [x, 0.45, z]);
  }
  for (let branch = 0; branch < 12; branch += 1) {
    const angle = branch / 12 * Math.PI * 2;
    pipe(root, `MOLECULAR__MB8__PHYLOGENETIC_CROWN_BRANCH_${branch + 1}`, new THREE.Vector3(Math.cos(angle) * 1.2, 8.45, Math.sin(angle) * 1.2), new THREE.Vector3(Math.cos(angle + (branch % 2 ? 0.2 : -0.2)) * 2.4, 9.2 + (branch % 3) * 0.22, Math.sin(angle + (branch % 2 ? 0.2 : -0.2)) * 2.4), 0.055, branch % 3 === 0 ? materials.circuitLight : materials.silver);
  }
}

function addMorphogenExchange(root: THREE.Group, materials: MolecularMaterials) {
  ellipse(root, 'MOLECULAR__MB9__REACTION_DIFFUSION_PLAZA', [11.9, 9.0], 0.1, materials.palePaving, [0, 0.06, 0]);
  cylinder(root, 'MOLECULAR__MB9__TRANSLUCENT_POLYGONAL_SIGNAL_HUB', 3.8, 5.05, materials.laboratoryGlass, [0, 2.62, 0], true, 6);
  const endpoints = [
    new THREE.Vector3(-5.6, 1.1, -1.2), new THREE.Vector3(-3.5, 1.2, 3.6),
    new THREE.Vector3(0.3, 1.0, 4.2), new THREE.Vector3(4.0, 1.15, 3.25),
    new THREE.Vector3(5.55, 1.25, -1.35),
  ];
  const wingMaterials = [materials.graphite, materials.bioceramic, materials.paleCeramic, materials.silver, materials.darkGlass];
  endpoints.forEach((end, wing) => {
    slabBetween(root, `MOLECULAR__MB9__GRADIENT_WING_${wing + 1}`, new THREE.Vector3(0, 1.15, 0.4), end, 1.65 + wing * 0.09, 1.8 + wing * 0.13, wingMaterials[wing], true);
    for (let marker = 0; marker < 9; marker += 1) {
      const t = (marker + 1) / 10;
      const point = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 2.35, 0.4), end.clone().setY(2.35), t);
      const size = 0.36 + t * 0.24;
      box(root, `MOLECULAR__MB9__WING_GRADIENT_MARKER_${wing + 1}_${marker + 1}`, [size, 0.5 + t * 0.45, 0.07], marker > 5 ? materials.laboratoryGlass : marker > 2 ? materials.silver : materials.graphite, point.toArray() as [number, number, number], false, [0, Math.atan2(end.x, end.z), 0]);
    }
  });
  for (let tile = 0; tile < 42; tile += 1) {
    const level = Math.floor(tile / 7);
    const around = tile % 7;
    const angle = around / 7 * Math.PI * 2;
    box(root, `MOLECULAR__MB9__HEX_CONCENTRATION_TILE_${tile + 1}`, [0.5, 0.42, 0.06], level > 3 ? materials.laboratoryGlass : level > 1 ? materials.paleCeramic : materials.bioceramic, [Math.sin(angle) * 1.93, 0.65 + level * 0.72, Math.cos(angle) * 1.93], false, [0, angle, 0]);
  }
  for (let canopy = 0; canopy < 5; canopy += 1) {
    const angle = canopy / 5 * Math.PI * 2 + 0.25;
    const base = new THREE.Vector3(Math.sin(angle) * 4.4, 0.2, Math.cos(angle) * 3.5);
    const top = base.clone().setY(2.65);
    pipe(root, `MOLECULAR__MB9__RECEPTOR_CANOPY_TRUNK_${canopy + 1}`, base, top, 0.09, materials.silver);
    for (let branch = 0; branch < 4; branch += 1) {
      const branchAngle = angle + (branch - 1.5) * 0.42;
      pipe(root, `MOLECULAR__MB9__RECEPTOR_CANOPY_BRANCH_${canopy + 1}_${branch + 1}`, top, new THREE.Vector3(base.x + Math.sin(branchAngle) * 1.6, 3.0, base.z + Math.cos(branchAngle) * 1.6), 0.045, branch % 2 ? materials.circuitLight : materials.silver);
    }
  }
  addRibbon(root, 'MOLECULAR__MB9__SIGNAL_WATER_CHANNEL', [new THREE.Vector3(0, 0.15, 5.0), new THREE.Vector3(0, 0.15, 3.0), new THREE.Vector3(0, 0.15, 1.8)], 0.42, materials.blackWater, false);
  for (let pylon = 0; pylon < 8; pylon += 1) {
    const angle = pylon / 8 * Math.PI * 2;
    const x = Math.sin(angle) * 5.1; const z = Math.cos(angle) * 4.0;
    for (let ring = 0; ring < 4; ring += 1) torus(root, `MOLECULAR__MB9__SIGNAL_PYLON_${pylon + 1}_RING_${ring + 1}`, 0.3, 0.055, ring === pylon % 4 ? materials.circuitLight.clone() : materials.laboratoryGlass, [x, 0.6 + ring * 0.38, z]).userData.animate = 'molecular-info-pulse';
  }
}

function addCryptobiosisVault(root: THREE.Group, materials: MolecularMaterials) {
  ellipse(root, 'MOLECULAR__MB10__THERMAL_PERIMETER_TRENCH', [13.8, 10.2], 0.2, materials.blackWater, [0, 0.06, 0]);
  ellipse(root, 'MOLECULAR__MB10__BLACK_STONE_ARCHIVE_MASS', [11.8, 8.4], 1.7, materials.basalt, [0, 0.9, -0.3], true, 12);
  const planes = [
    { x: -3.9, y: 1.25, z: -0.6, sx: 5.4, sy: 0.45, sz: 8.3, rz: -0.17, ry: -0.08 },
    { x: -1.2, y: 1.55, z: -0.45, sx: 4.6, sy: 0.5, sz: 8.6, rz: 0.12, ry: 0.06 },
    { x: 1.4, y: 1.62, z: -0.15, sx: 4.9, sy: 0.5, sz: 8.4, rz: -0.13, ry: -0.05 },
    { x: 4.0, y: 1.28, z: -0.4, sx: 5.1, sy: 0.45, sz: 8.0, rz: 0.18, ry: 0.08 },
  ];
  planes.forEach((plane, index) => box(root, `MOLECULAR__MB10__GLACIAL_CERAMIC_PLANE_${index + 1}`, [plane.sx, plane.sy, plane.sz], index % 2 ? materials.paleCeramic : materials.bioceramic, [plane.x, plane.y, plane.z], true, [0, plane.ry, plane.rz]));
  box(root, 'MOLECULAR__MB10__ZERO_GATE_LEFT_WALL', [2.15, 2.65, 0.55], materials.bioceramic, [-1.55, 1.35, 4.15], true, [0, 0, -0.18]);
  box(root, 'MOLECULAR__MB10__ZERO_GATE_RIGHT_WALL', [2.15, 2.65, 0.55], materials.bioceramic, [1.55, 1.35, 4.15], true, [0, 0, 0.18]);
  box(root, 'MOLECULAR__MB10__ZERO_GATE_BLACK_VOID', [1.5, 2.25, 0.12], materials.darkGlass, [0, 1.15, 4.05]);
  box(root, 'MOLECULAR__MB10__DEEP_TIME_BASALT_PLAZA', [7.2, 0.12, 2.8], materials.basalt, [0, 0.15, 4.0], false);
  for (let epoch = 0; epoch < 13; epoch += 1) {
    const z = 5.18 - Math.pow(epoch / 12, 1.7) * 2.25;
    box(root, `MOLECULAR__MB10__DEEP_TIME_INTERVAL_${epoch + 1}`, [4.8 - epoch * 0.2, 0.04, 0.035], epoch % 4 === 0 ? materials.coldLight : materials.silver, [0, 0.23, z]);
  }
  for (let tower = 0; tower < 5; tower += 1) {
    const x = -4.4 + tower * 2.2;
    cylinder(root, `MOLECULAR__MB10__CRYOGENIC_EXHAUST_TOWER_${tower + 1}`, 0.9, 1.65 + (tower % 2) * 0.25, materials.silver, [x, 2.35, -3.2], true, 24);
    for (let cage = 0; cage < 4; cage += 1) pipe(root, `MOLECULAR__MB10__EXHAUST_CAGE_${tower + 1}_${cage + 1}`, new THREE.Vector3(x - 0.48 + cage * 0.32, 1.5, -3.2), new THREE.Vector3(x - 0.48 + cage * 0.32, 3.25, -3.2), 0.025, materials.bioceramic);
  }
  for (let door = 0; door < 6; door += 1) {
    const x = -5.1 + door * 2.05;
    torus(root, `MOLECULAR__MB10__ARCHIVE_TRANSFER_DOOR_${door + 1}`, 0.48, 0.14, materials.silver, [x, 0.95, -4.35], [0, 0, 0]);
    box(root, `MOLECULAR__MB10__ARCHIVE_STATUS_INDICATOR_${door + 1}`, [0.45, 0.07, 0.07], door % 3 === 0 ? materials.circuitLight : materials.coldLight, [x, 0.95, -4.46]);
  }
  box(root, 'MOLECULAR__MB10__MOLECULAR_CLOCK_BLADE', [0.42, 4.5, 0.78], materials.graphite, [0, 2.35, -0.75], true);
  for (let tick = 0; tick < 18; tick += 1) box(root, `MOLECULAR__MB10__CLOCK_INTERVAL_${tick + 1}`, [0.48, 0.035, 0.82], tick === 8 ? materials.coldLight.clone() : materials.silver, [0, 0.35 + tick * 0.24, -0.75], false);
}

function createBuilding(record: MolecularBiologyBuildingProgram, materials: MolecularMaterials) {
  const root = new THREE.Group();
  root.name = `MOLECULAR__${record.code}__${record.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  root.userData = {
    selectableId: DISTRICT_ID,
    individualSelectableId: `${DISTRICT_ID}__${record.code.toLowerCase()}`,
    districtId: DISTRICT_ID,
    exteriorProgram: true,
    molecularBiologyBuilding: true,
    buildingCode: record.code,
    displayName: record.name,
    purpose: record.purpose,
    placementZone: record.placementZone,
    exteriorMotif: record.exteriorMotif,
    footprintMetres: [...record.footprintMetres],
    heightMetres: record.heightMetres,
    featureRole: 'building',
    featureTag: record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  };
  switch (record.form) {
    case 'genesis': addGenesisForge(root, materials); break;
    case 'xenocodon': addXenocodonBastion(root, materials); break;
    case 'protosphere': addProtosphereComplex(root, materials); break;
    case 'asterion': addAsterionArray(root, materials); break;
    case 'palimpsest': addPalimpsestTower(root, materials); break;
    case 'symbiogenesis': addSymbiogenesisArc(root, materials); break;
    case 'automata': addAutomataLoom(root, materials); break;
    case 'darwin': addDarwinEngine(root, materials); break;
    case 'morphogen': addMorphogenExchange(root, materials); break;
    case 'cryptobiosis': addCryptobiosisVault(root, materials); break;
  }
  root.traverse((object) => {
    object.userData.selectableId = DISTRICT_ID;
    object.userData.districtId = DISTRICT_ID;
  });
  return root;
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!;
  const radialMargin = 7.0;
  const angularMargin = (sector.endAngle - sector.startAngle) * 0.055;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT);
  const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
  return new THREE.Vector3(
    Math.cos(angle) * radius - definition.position[0],
    y,
    Math.sin(angle) * radius - definition.position[2],
  );
}

function districtArc(definition: DistrictDefinition, radialT: number, startAngularT: number, endAngularT: number, segments: number, y = FLOOR_Y) {
  return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, radialT, THREE.MathUtils.lerp(startAngularT, endAngularT, index / (segments - 1)), y));
}

function districtSpine(definition: DistrictDefinition, angularT: number, startRadialT: number, endRadialT: number, segments: number, y = FLOOR_Y) {
  return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, THREE.MathUtils.lerp(startRadialT, endRadialT, index / (segments - 1)), angularT, y));
}

function addDistrictInfrastructure(district: THREE.Group, definition: DistrictDefinition, materials: MolecularMaterials) {
  const infrastructure = new THREE.Group();
  infrastructure.name = 'MOLECULAR__DISTRICT_SYSTEMS';
  const routes = [
    { name: 'MOLECULAR__MOLECULAR_MERIDIAN', points: districtSpine(definition, 0.50, 0.02, 0.98, 72), width: 1.6, material: materials.palePaving },
    { name: 'MOLECULAR__INNER_PAIRED_INTERACTION_ARC', points: districtArc(definition, 0.24, 0.06, 0.94, 64), width: 1.25, material: materials.darkPaving },
    { name: 'MOLECULAR__MIDDLE_TRIPLET_INTERACTION_ARC', points: districtArc(definition, 0.52, 0.06, 0.94, 64), width: 1.35, material: materials.palePaving },
    { name: 'MOLECULAR__OUTER_PAIRED_INTERACTION_ARC', points: districtArc(definition, 0.80, 0.06, 0.94, 64), width: 1.4, material: materials.darkPaving },
  ] as const;
  routes.forEach((route, index) => {
    addRibbon(infrastructure, route.name, route.points, route.width, route.material);
    const signal = addRibbon(infrastructure, `MOLECULAR__PAVEMENT_INFORMATION_LINE_${index + 1}`, route.points.map((point) => point.clone().setY(FLOOR_Y + 0.024)), 0.055, materials.circuitLight.clone(), false);
    signal.userData.animate = 'molecular-info-pulse';
    signal.userData.phase = index * 1.2;
  });
  const branchAngulars = [0.22, 0.50, 0.78];
  branchAngulars.forEach((angularT, index) => {
    const points = districtSpine(definition, angularT, 0.24, 0.80, 38);
    addRibbon(infrastructure, `MOLECULAR__TRIPLET_BRANCH_${index + 1}`, points, 0.72, materials.palePaving);
    const signal = addRibbon(infrastructure, `MOLECULAR__TRIPLET_BRANCH_SIGNAL_${index + 1}`, points.map((point) => point.clone().setY(FLOOR_Y + 0.024)), 0.045, materials.circuitLight.clone(), false);
    signal.userData.animate = 'molecular-info-pulse';
    signal.userData.phase = 0.65 + index * 0.8;
  });
  [
    { r: 0.24, a: 0.50 }, { r: 0.52, a: 0.22 }, { r: 0.52, a: 0.50 },
    { r: 0.52, a: 0.78 }, { r: 0.80, a: 0.50 },
  ].forEach((plaza, index) => {
    const point = pointInDistrict(definition, plaza.r, plaza.a, FLOOR_Y + 0.03);
    cylinder(infrastructure, `MOLECULAR__INTERACTION_PLAZA_${index + 1}`, 4.3, 0.08, index % 2 ? materials.darkPaving : materials.palePaving, point.toArray() as [number, number, number], false, 6);
    for (let node = 0; node < 6; node += 1) {
      const angle = node / 6 * Math.PI * 2;
      cylinder(infrastructure, `MOLECULAR__PLAZA_BINDING_NODE_${index + 1}_${node + 1}`, 0.18, 0.08, node % 3 === 0 ? materials.circuitLight : materials.silver, [point.x + Math.cos(angle) * 1.45, FLOOR_Y + 0.1, point.z + Math.sin(angle) * 1.45], false, 12);
    }
  });
  district.add(infrastructure);
  return infrastructure;
}

function addDistrictLandscape(district: THREE.Group, definition: DistrictDefinition, materials: MolecularMaterials) {
  const landscape = new THREE.Group();
  landscape.name = 'MOLECULAR__DISTRIBUTED_RESEARCH_LANDSCAPE';
  for (let cluster = 0; cluster < 24; cluster += 1) {
    const row = Math.floor(cluster / 8);
    const angularT = 0.09 + (cluster % 8) * 0.117;
    const radialT = [0.34, 0.65, 0.93][row];
    const point = pointInDistrict(definition, radialT, angularT, FLOOR_Y);
    ellipse(landscape, `MOLECULAR__ENGINEERED_LANDSCAPE_PATCH_${cluster + 1}`, [1.55 + (cluster % 3) * 0.25, 0.72], 0.1, cluster % 4 === 0 ? materials.redMineral : cluster % 4 === 1 ? materials.planting : cluster % 4 === 2 ? materials.palePlanting : materials.quartz, [point.x, 0.1, point.z]);
    for (let sensor = 0; sensor < 2; sensor += 1) {
      cylinder(landscape, `MOLECULAR__LANDSCAPE_SENSOR_${cluster + 1}_${sensor + 1}`, 0.08, 0.55 + sensor * 0.22, materials.silver, [point.x - 0.32 + sensor * 0.64, 0.38 + sensor * 0.11, point.z], false, 12);
      ellipsoid(landscape, `MOLECULAR__LANDSCAPE_SENSOR_NODE_${cluster + 1}_${sensor + 1}`, [0.11, 0.11, 0.11], cluster % 5 === 0 ? materials.circuitLight : materials.coldLight, [point.x - 0.32 + sensor * 0.64, 0.72 + sensor * 0.22, point.z]);
    }
  }
  district.add(landscape);
  return landscape;
}

export function buildMolecularBiologyDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Molecular Biology Labs District requires a masterplan sector');
  const materials = createMolecularMaterials();
  const infrastructure = addDistrictInfrastructure(district, definition, materials);
  const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = MOLECULAR_BIOLOGY_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials);
    const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02);
    building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2]));
    const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize();
    building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = {
      radius: Math.hypot(worldPosition.x, worldPosition.z),
      angle: Math.atan2(worldPosition.z, worldPosition.x),
      normalizedRadial: record.radialT,
      normalizedAngular: record.angularT,
    };
    district.add(building);
    return building;
  });

  facilities.forEach((facility, index) => {
    const record = MOLECULAR_BIOLOGY_BUILDING_PROGRAM[index];
    const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, record.footprintMetres[1] / 20 + 0.65);
    const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const routeRadialT = record.radialT < 0.3 ? 0.24 : record.radialT < 0.67 ? 0.52 : 0.80;
    const routePoint = pointInDistrict(definition, routeRadialT, record.angularT, FLOOR_Y + 0.012);
    const midpoint = routePoint.clone().lerp(entrance, 0.5);
    const approachPoints = [routePoint, midpoint, entrance];
    addRibbon(infrastructure, `MOLECULAR__BUILDING_APPROACH_${record.code}`, approachPoints, 0.72, materials.palePaving);
    const signal = addRibbon(infrastructure, `MOLECULAR__BUILDING_APPROACH_SIGNAL_${record.code}`, approachPoints.map((point) => point.clone().setY(FLOOR_Y + 0.028)), 0.04, materials.circuitLight.clone(), false);
    signal.userData.animate = 'molecular-info-pulse';
    signal.userData.phase = index * 0.43;
  });

  district.userData.molecularBiologyDistrict = {
    identity: 'Molecular Biology Labs District',
    architecturalLanguage: 'complementary molecular pairing, codon modules, membrane pores, regulatory layers, folded systems, mineral environments, and distributed information light',
    buildingCount: facilities.length,
    buildings: MOLECULAR_BIOLOGY_BUILDING_PROGRAM.map((record) => ({
      code: record.code,
      name: record.name,
      purpose: record.purpose,
      placementZone: record.placementZone,
      heightMetres: record.heightMetres,
      exteriorMotif: record.exteriorMotif,
    })),
    skyline: {
      lowMolecularLandscapes: ['The Protosphere Complex', 'Molecular Automata Loom', 'Cryptobiosis Vault'],
      midRiseIntegratedComplexes: ['Genesis Forge', 'Asterion Exobiology Array', 'Symbiogenesis Arc', 'Morphogen Exchange'],
      verticalLandmarks: ['Xenocodon Bastion', 'Palimpsest Tower', 'The Darwin Engine'],
    },
    circulation: {
      primaryWalk: 'MOLECULAR__MOLECULAR_MERIDIAN',
      hierarchy: ['Molecular Meridian', 'paired interaction arcs', 'triplet interaction branches', 'short exact building approaches'],
      majorRouteCount: 7,
      interactionPlazas: 5,
      exactBuildingApproaches: 10,
      embeddedInformationLines: 17,
      directCrossSiteDiagonals: 0,
    },
    responsiveSystems: {
      kineticIonChannelScreens: true,
      travellingTranscriptionLight: true,
      animatedObjects: true,
      advertisingDisplays: false,
    },
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: MOLECULAR_BIOLOGY_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: ['Molecular Meridian', 'Interaction Plazas', 'Embedded Information Circuit', 'Mineral and Engineered Landscapes', 'Atmospheric Sensor Network'],
    realizedFeatureTags: MOLECULAR_BIOLOGY_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 17,
    radialCoverage: 0.96,
    angularCoverage: 0.94,
    exteriorOnly: true,
    distributedMolecularCircuit: true,
  };
}
