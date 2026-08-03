import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type SecretLabForm =
  | 'aion'
  | 'mnemosyne'
  | 'chimaera'
  | 'eve'
  | 'genesis'
  | 'proteus'
  | 'ariadne'
  | 'morphos'
  | 'topos'
  | 'chronos'
  | 'helios'
  | 'orpheus'
  | 'noosphere'
  | 'limen'
  | 'null';

export interface SecretLabBuildingProgram {
  code: string;
  name: string;
  publicMapName: string;
  researchFocus: string;
  form: SecretLabForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  researchBand: 'classified biology' | 'autonomous and quantum systems' | 'high-risk physics and containment';
}

export const SECRET_LABS_BUILDING_PROGRAM: readonly SecretLabBuildingProgram[] = [
  {
    code: 'L1',
    name: 'AION Biostasis and Rejuvenation Institute',
    publicMapName: 'Thermal Physiology Annex',
    researchFocus: 'biological age reversal, organ preservation, suspended metabolism, and extreme cryobiology',
    form: 'aion',
    footprintMetres: [190, 125],
    heightMetres: 27,
    radialT: 0.18,
    angularT: 0.09,
    researchBand: 'classified biology',
  },
  {
    code: 'L2',
    name: 'MNEMOSYNE Neural Continuity Tower',
    publicMapName: 'Neural Systems Archive',
    researchFocus: 'connectomics, brain-computer interfaces, synthetic memory, and consciousness continuity',
    form: 'mnemosyne',
    footprintMetres: [72, 70],
    heightMetres: 105,
    radialT: 0.18,
    angularT: 0.29,
    researchBand: 'classified biology',
  },
  {
    code: 'L3',
    name: 'CHIMAERA Morphogenesis Conservatory',
    publicMapName: 'Developmental Systems Conservatory',
    researchFocus: 'organoids, synthetic embryology, xenobots, and programmable multicellular morphology',
    form: 'chimaera',
    footprintMetres: [155, 125],
    heightMetres: 50,
    radialT: 0.18,
    angularT: 0.50,
    researchBand: 'classified biology',
  },
  {
    code: 'L4',
    name: 'EVE Extra-Uterine Development Ark',
    publicMapName: 'Reproductive Resilience Annex',
    researchFocus: 'artificial gestation, placenta-mimetic systems, and precision developmental physiology',
    form: 'eve',
    footprintMetres: [125, 100],
    heightMetres: 54,
    radialT: 0.18,
    angularT: 0.70,
    researchBand: 'classified biology',
  },
  {
    code: 'L5',
    name: 'GENESIS Genome Assembly Foundry',
    publicMapName: 'Genomic Data Foundry',
    researchFocus: 'whole-genome synthesis, synthetic chromosomes, genetic recoding, and DNA data storage',
    form: 'genesis',
    footprintMetres: [220, 72],
    heightMetres: 42,
    radialT: 0.18,
    angularT: 0.91,
    researchBand: 'classified biology',
  },
  {
    code: 'L6',
    name: 'PROTEUS Autonomous Discovery Foundry',
    publicMapName: 'Automated Materials Warehouse',
    researchFocus: 'self-driving laboratories, robotic experimentation, and machine-led discovery',
    form: 'proteus',
    footprintMetres: [170, 90],
    heightMetres: 48,
    radialT: 0.50,
    angularT: 0.09,
    researchBand: 'autonomous and quantum systems',
  },
  {
    code: 'L7',
    name: 'ARIADNE Swarm Systems Aerarium',
    publicMapName: 'Distributed Sensor Aerarium',
    researchFocus: 'smart dust, microrobotic swarms, distributed sensing, and collective machine behaviour',
    form: 'ariadne',
    footprintMetres: [96, 96],
    heightMetres: 58,
    radialT: 0.50,
    angularT: 0.29,
    researchBand: 'autonomous and quantum systems',
  },
  {
    code: 'L8',
    name: 'MORPHOS Programmable Matter Forge',
    publicMapName: 'Adaptive Materials Engineering Hall',
    researchFocus: 'programmable matter, metamaterials, 4D printing, and self-assembling structures',
    form: 'morphos',
    footprintMetres: [105, 80],
    heightMetres: 40,
    radialT: 0.50,
    angularT: 0.50,
    researchBand: 'autonomous and quantum systems',
  },
  {
    code: 'L9',
    name: 'TOPOS Topological Quantum Bastion',
    publicMapName: 'Cryogenic Computation Centre',
    researchFocus: 'topological qubits, fault-tolerant quantum computation, and secure quantum networks',
    form: 'topos',
    footprintMetres: [150, 150],
    heightMetres: 28,
    radialT: 0.50,
    angularT: 0.70,
    researchBand: 'autonomous and quantum systems',
  },
  {
    code: 'L10',
    name: 'CHRONOS Causality and Precision-Time Observatory',
    publicMapName: 'Precision Metrology Observatory',
    researchFocus: 'optical clocks, quantum synchronization, relativistic metrology, and causality',
    form: 'chronos',
    footprintMetres: [145, 145],
    heightMetres: 102,
    radialT: 0.50,
    angularT: 0.91,
    researchBand: 'autonomous and quantum systems',
  },
  {
    code: 'L11',
    name: 'HELIOS Black-Flux Energy Annex',
    publicMapName: 'Thermal Control Plant',
    researchFocus: 'compact fusion, extreme-field superconductors, high-density storage, and plasma confinement',
    form: 'helios',
    footprintMetres: [175, 165],
    heightMetres: 48,
    radialT: 0.82,
    angularT: 0.09,
    researchBand: 'high-risk physics and containment',
  },
  {
    code: 'L12',
    name: 'ORPHEUS Deep Signal Observatory',
    publicMapName: 'Deep-Space Communications Facility',
    researchFocus: 'anomalous signals, technosignatures, non-human communication, and machine-mediated decoding',
    form: 'orpheus',
    footprintMetres: [150, 145],
    heightMetres: 78,
    radialT: 0.82,
    angularT: 0.29,
    researchBand: 'high-risk physics and containment',
  },
  {
    code: 'L13',
    name: 'NOOSPHERE Synthetic Intelligence Directorate',
    publicMapName: 'Computational Forecasting Archive',
    researchFocus: 'frontier artificial intelligence, machine consciousness, world models, and simulated civilizations',
    form: 'noosphere',
    footprintMetres: [128, 128],
    heightMetres: 45,
    radialT: 0.82,
    angularT: 0.50,
    researchBand: 'high-risk physics and containment',
  },
  {
    code: 'L14',
    name: 'LIMEN Gravitic and Anomalous Physics Laboratory',
    publicMapName: 'Precision Instrumentation Laboratory',
    researchFocus: 'dark matter, quantum gravity, exotic field interactions, and unexplained physical anomalies',
    form: 'limen',
    footprintMetres: [145, 125],
    heightMetres: 92,
    radialT: 0.82,
    angularT: 0.70,
    researchBand: 'high-risk physics and containment',
  },
  {
    code: 'L15',
    name: 'NULL Archive and Black Containment Vault',
    publicMapName: 'Secure Records Archive',
    researchFocus: 'containment of hazardous models, restricted designs, anomalous materials, and failed prototypes',
    form: 'null',
    footprintMetres: [155, 105],
    heightMetres: 42,
    radialT: 0.82,
    angularT: 0.91,
    researchBand: 'high-risk physics and containment',
  },
] as const;

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 24, 14);
const FLOOR_Y = 0.038;

type SecretMaterials = ReturnType<typeof createSecretMaterials>;

function secretMaterial(
  name: string,
  color: THREE.ColorRepresentation,
  options: THREE.MeshStandardMaterialParameters = {},
) {
  return new THREE.MeshStandardMaterial({
    name,
    color,
    roughness: 0.68,
    metalness: 0.12,
    ...options,
  });
}

function createSecretMaterials() {
  const blackBasalt = secretMaterial('Secret Labs honed black basalt', '#080b0e', {
    roughness: 0.88,
    metalness: 0.02,
  });
  const porousBlack = secretMaterial('NULL porous ultrablack ceramic', '#010203', {
    roughness: 1,
    metalness: 0,
  });
  const graphite = secretMaterial('Secret Labs graphite ceramic', '#151a20', {
    roughness: 0.63,
    metalness: 0.14,
  });
  const paleBioceramic = secretMaterial('Secret Labs seamless pale bioceramic', '#e8ece8', {
    roughness: 0.52,
    metalness: 0.03,
  });
  const pearlBioceramic = new THREE.MeshPhysicalMaterial({
    name: 'CHIMAERA pearlescent bioceramic',
    color: '#dce8e3',
    roughness: 0.32,
    metalness: 0.08,
    clearcoat: 0.62,
    clearcoatRoughness: 0.22,
    iridescence: 0.42,
    iridescenceIOR: 1.3,
  });
  const titanium = secretMaterial('Secret Labs brushed titanium', '#9da8aa', {
    roughness: 0.32,
    metalness: 0.9,
  });
  const mirrored = new THREE.MeshPhysicalMaterial({
    name: 'Secret Labs mirrored titanium',
    color: '#c8d2d2',
    roughness: 0.08,
    metalness: 1,
    clearcoat: 0.8,
  });
  const copper = secretMaterial('Secret Labs copper-alloy network', '#8e5b3d', {
    roughness: 0.38,
    metalness: 0.86,
    emissive: '#5a2412',
    emissiveIntensity: 0.18,
  });
  const ultradarkGlass = new THREE.MeshPhysicalMaterial({
    name: 'Secret Labs ultradark electrochromic glass',
    color: '#07141b',
    emissive: '#0a2630',
    emissiveIntensity: 0.32,
    roughness: 0.12,
    metalness: 0.18,
    transmission: 0.08,
    transparent: true,
    opacity: 0.86,
    side: THREE.DoubleSide,
  });
  const cryogenicGlass = new THREE.MeshPhysicalMaterial({
    name: 'AION opaque cryogenic glass',
    color: '#b9d0d3',
    emissive: '#bcefff',
    emissiveIntensity: 0.72,
    roughness: 0.25,
    metalness: 0.08,
    transparent: true,
    opacity: 0.82,
  });
  const translucent = new THREE.MeshPhysicalMaterial({
    name: 'Secret Labs translucent structural polymer',
    color: '#d6e8e5',
    emissive: '#b8dcd8',
    emissiveIntensity: 0.18,
    roughness: 0.28,
    metalness: 0.02,
    transmission: 0.36,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  const whiteLight = secretMaterial('Secret Labs calibrated cold-white illumination', '#e9ffff', {
    emissive: '#d6ffff',
    emissiveIntensity: 5.4,
    roughness: 0.18,
    metalness: 0,
  });
  const cyanLight = secretMaterial('Secret Labs controlled cyan illumination', '#72dfe0', {
    emissive: '#39d7dc',
    emissiveIntensity: 3.2,
    roughness: 0.24,
    metalness: 0.12,
  });
  const redLight = secretMaterial('Secret Labs restrained red perimeter marker', '#ab1c28', {
    emissive: '#d3152a',
    emissiveIntensity: 3.5,
    roughness: 0.38,
    metalness: 0.18,
  });
  const amberLight = secretMaterial('Secret Labs functional amber status light', '#d69d3e', {
    emissive: '#e38b24',
    emissiveIntensity: 2.7,
    roughness: 0.34,
    metalness: 0.12,
  });
  const blackWater = new THREE.MeshPhysicalMaterial({
    name: 'Secret Labs still black water',
    color: '#02090d',
    roughness: 0.08,
    metalness: 0.2,
    transmission: 0.04,
    transparent: true,
    opacity: 0.9,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    side: THREE.DoubleSide,
  });
  const paving = secretMaterial('Secret Labs pale calibration paving', '#aeb6b4', {
    roughness: 0.9,
    metalness: 0.02,
  });
  const darkPaving = secretMaterial('Secret Labs dark technical paving', '#1d2427', {
    roughness: 0.92,
    metalness: 0.03,
  });
  const gravel = secretMaterial('Secret Labs pale ceramic gravel', '#d2d3ca', {
    roughness: 0.98,
    metalness: 0,
  });
  const silverGrass = secretMaterial('Secret Labs silver landscape grass', '#9da49a', {
    roughness: 0.92,
    metalness: 0.12,
  });
  const mesh = secretMaterial('Secret Labs fine containment mesh', '#7d8989', {
    roughness: 0.46,
    metalness: 0.82,
    transparent: true,
    opacity: 0.38,
    wireframe: true,
    side: THREE.DoubleSide,
  });
  const vapour = new THREE.MeshBasicMaterial({
    name: 'Secret Labs controlled environmental vapour',
    color: '#c9e6e7',
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return {
    blackBasalt,
    porousBlack,
    graphite,
    paleBioceramic,
    pearlBioceramic,
    titanium,
    mirrored,
    copper,
    ultradarkGlass,
    cryogenicGlass,
    translucent,
    whiteLight,
    cyanLight,
    redLight,
    amberLight,
    blackWater,
    paving,
    darkPaving,
    gravel,
    silverGrass,
    mesh,
    vapour,
  };
}

function prepare<T extends THREE.Object3D>(object: T, name: string, obstacle = false) {
  object.name = name;
  object.userData.selectableId = 'secret-labs';
  if (obstacle) object.userData.navObstacle = true;
  if (object instanceof THREE.Mesh) {
    object.castShadow = true;
    object.receiveShadow = true;
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
) {
  const object = prepare(new THREE.Mesh(UNIT_BOX, material), name, obstacle);
  object.scale.set(size[0], size[1], size[2]);
  object.position.set(position[0], position[1] + size[1] * 0.5, position[2]);
  parent.add(object);
  return object;
}

function cylinder(
  parent: THREE.Object3D,
  name: string,
  diameter: readonly [number, number],
  height: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  obstacle = false,
  segments = 32,
) {
  const geometry = segments === 24 ? UNIT_CYLINDER : new THREE.CylinderGeometry(0.5, 0.5, 1, segments);
  const object = prepare(new THREE.Mesh(geometry, material), name, obstacle);
  object.scale.set(diameter[0], height, diameter[1]);
  object.position.set(position[0], position[1] + height * 0.5, position[2]);
  parent.add(object);
  return object;
}

function ellipsoid(
  parent: THREE.Object3D,
  name: string,
  size: readonly [number, number, number],
  material: THREE.Material,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = [0, 0, 0],
  obstacle = false,
) {
  const object = prepare(new THREE.Mesh(UNIT_SPHERE, material), name, obstacle);
  object.scale.set(size[0], size[1], size[2]);
  object.position.set(...position);
  object.rotation.set(...rotation);
  parent.add(object);
  return object;
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
  const delta = end.clone().sub(start);
  const object = prepare(
    new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 10), material),
    name,
    obstacle,
  );
  object.position.copy(start).add(end).multiplyScalar(0.5);
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  parent.add(object);
  return object;
}

function torus(
  parent: THREE.Object3D,
  name: string,
  majorRadius: number,
  tubeRadius: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = [0, 0, 0],
  arc = Math.PI * 2,
  segments = 64,
) {
  const object = prepare(
    new THREE.Mesh(new THREE.TorusGeometry(majorRadius, tubeRadius, 10, segments, arc), material),
    name,
  );
  object.position.set(...position);
  object.rotation.set(...rotation);
  parent.add(object);
  return object;
}

function ellipseRing(
  parent: THREE.Object3D,
  name: string,
  outer: readonly [number, number],
  inner: readonly [number, number],
  material: THREE.Material,
  position: readonly [number, number, number],
) {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, outer[0], outer[1], 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, inner[0], inner[1], 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const object = prepare(new THREE.Mesh(new THREE.ShapeGeometry(shape, 64), material), name);
  object.rotation.x = -Math.PI / 2;
  object.position.set(...position);
  object.receiveShadow = true;
  object.userData.walkable = false;
  object.userData.navObstacle = false;
  parent.add(object);
  return object;
}

function extrudedEllipseRing(
  parent: THREE.Object3D,
  name: string,
  outer: readonly [number, number],
  inner: readonly [number, number],
  height: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  obstacle = false,
) {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, outer[0], outer[1], 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, inner[0], inner[1], 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.08,
    bevelThickness: 0.08,
    curveSegments: 64,
  });
  const object = prepare(new THREE.Mesh(geometry, material), name, obstacle);
  object.rotation.x = -Math.PI / 2;
  object.position.set(...position);
  parent.add(object);
  return object;
}

function labRoot(record: SecretLabBuildingProgram) {
  const root = new THREE.Group();
  root.name = `SECRET__${record.code}__${record.name.split(' ')[0]}`;
  root.userData = {
    selectableId: 'secret-labs',
    individualSelectableId: `secret-labs__${record.code.toLowerCase()}`,
    exteriorProgram: true,
    buildingCode: record.code,
    displayName: record.name,
    publicMapName: record.publicMapName,
    researchFocus: record.researchFocus,
    researchBand: record.researchBand,
    heightMetres: record.heightMetres,
    footprintMetres: [...record.footprintMetres],
  };
  return root;
}

function addCalibrationPlate(
  parent: THREE.Object3D,
  code: string,
  position: readonly [number, number, number],
  materials: SecretMaterials,
) {
  box(parent, `SECRET__${code}__ALPHANUMERIC_PAVEMENT_PLATE`, [0.8, 0.022, 0.24], materials.graphite, position);
  for (let mark = 0; mark < 5; mark += 1) {
    box(
      parent,
      `SECRET__${code}__CALIBRATION_MARK_${mark + 1}`,
      [0.045 + (mark % 2) * 0.04, 0.008, 0.12],
      materials.whiteLight,
      [position[0] - 0.28 + mark * 0.14, position[1] + 0.024, position[2]],
    );
  }
}

function addMist(
  parent: THREE.Object3D,
  name: string,
  position: readonly [number, number, number],
  scale: readonly [number, number, number],
  materials: SecretMaterials,
  phase: number,
) {
  const mist = ellipsoid(parent, name, scale, materials.vapour, position);
  mist.userData.animate = 'secret-controlled-vapour';
  // Atmospheric vapour is decorative microdetail, never architecture. The
  // runtime may screen-size cull it in distant full-island views and restores
  // it for the selected/nearest package with hysteresis.
  mist.userData.renderImportance = 'micro';
  mist.userData.microDetail = true;
  mist.userData.baseY = position[1];
  mist.userData.phase = phase;
  return mist;
}

function addAion(root: THREE.Group, materials: SecretMaterials) {
  ellipseRing(root, 'SECRET__L1__BLACK_WATER_MOAT', [10.2, 7.0], [8.95, 5.75], materials.blackWater, [0, FLOOR_Y + 0.018, 0]);
  ellipseRing(root, 'SECRET__L1__PALE_MOAT_EDGE', [10.45, 7.25], [10.15, 6.95], materials.paving, [0, FLOOR_Y, 0]);
  const rings = [
    { outer: [8.9, 5.2] as const, inner: [7.65, 4.18] as const, height: 0.92, y: 0.12 },
    { outer: [7.28, 3.84] as const, inner: [6.02, 2.95] as const, height: 1.22, y: 0.12 },
    { outer: [5.68, 2.62] as const, inner: [4.22, 1.72] as const, height: 1.55, y: 0.12 },
  ];
  rings.forEach((ring, index) => {
    extrudedEllipseRing(
      root,
      `SECRET__L1__CONCENTRIC_BIOCERAMIC_ELLIPSE_${index + 1}`,
      ring.outer,
      ring.inner,
      ring.height,
      materials.paleBioceramic,
      [0, ring.y, 0],
      true,
    );
    const band = torus(
      root,
      `SECRET__L1__CRYOGENIC_GLASS_BAND_${index + 1}`,
      ring.outer[0],
      0.055,
      materials.cryogenicGlass,
      [0, ring.y + ring.height * 0.63, 0],
      [Math.PI / 2, 0, 0],
    );
    band.scale.z = ring.outer[1] / ring.outer[0];
  });
  ellipsoid(root, 'SECRET__L1__RAISED_CENTRAL_BIOCERAMIC_ELLIPSE', [7.5, 2.25, 3.1], materials.paleBioceramic, [0, 1.15, 0], [0, 0, 0], true);
  ellipseRing(root, 'SECRET__L1__OUTER_GEOMETRIC_VAPOUR_CHANNEL', [7.58, 4.1], [7.32, 3.88], materials.blackWater, [0, FLOOR_Y + 0.025, 0]);
  ellipseRing(root, 'SECRET__L1__INNER_GEOMETRIC_VAPOUR_CHANNEL', [5.96, 2.9], [5.72, 2.68], materials.blackWater, [0, FLOOR_Y + 0.026, 0]);
  for (let channel = 0; channel < 18; channel += 1) {
    const angle = (channel / 18) * Math.PI * 2;
    const x = Math.cos(angle) * 8.86;
    const z = Math.sin(angle) * 5.15;
    pipe(
      root,
      `SECRET__L1__SILVER_THERMAL_CAPILLARY_${channel + 1}`,
      new THREE.Vector3(x, 0.45, z),
      new THREE.Vector3(x * 0.96, 1.05 + (channel % 3) * 0.14, z * 0.96),
      0.035,
      materials.titanium,
    );
  }
  box(root, 'SECRET__L1__OFFSET_PALE_BRIDGE', [1.1, 0.12, 6.2], materials.paleBioceramic, [4.2, FLOOR_Y + 0.02, 7.0], false).rotation.y = -0.14;
  box(root, 'SECRET__L1__RECESSED_BLANK_WALL_PORTAL', [1.2, 0.92, 0.09], materials.ultradarkGlass, [3.3, 0.18, 4.82]);
  for (let cone = 0; cone < 5; cone += 1) {
    const object = prepare(
      new THREE.Mesh(new THREE.ConeGeometry(0.28 + cone * 0.035, 0.9 + cone * 0.1, 20), materials.mirrored),
      `SECRET__L1__MIRRORED_ATMOSPHERIC_CONE_${cone + 1}`,
    );
    object.position.set(-1.4 + cone * 0.7, 2.42 + cone * 0.08, (cone % 2 ? -0.45 : 0.35));
    root.add(object);
  }
  for (let vapour = 0; vapour < 7; vapour += 1) {
    addMist(root, `SECRET__L1__GEOMETRIC_COLD_VAPOUR_${vapour + 1}`, [-5.4 + vapour * 1.8, 0.18, 4.45], [1.5, 0.18, 0.55], materials, vapour * 0.8);
  }
  addCalibrationPlate(root, 'L1', [4.9, FLOOR_Y + 0.01, 8.2], materials);
}

function addMnemosyne(root: THREE.Group, materials: SecretMaterials) {
  cylinder(root, 'SECRET__L2__BLACK_STONE_SIGNAL_PLAZA', [8.2, 8.2], 0.12, materials.blackBasalt, [0, FLOOR_Y, 0]);
  for (let ring = 0; ring < 7; ring += 1) {
    torus(root, `SECRET__L2__PLAZA_SIGNAL_WAVE_${ring + 1}`, 0.75 + ring * 0.43, 0.018, materials.titanium, [0, 0.17, 0], [Math.PI / 2, 0, 0]);
  }
  const left = new THREE.Group();
  left.name = 'SECRET__L2__CORTICAL_TOWER_LEFT';
  left.position.x = -0.45;
  root.add(left);
  const right = new THREE.Group();
  right.name = 'SECRET__L2__CORTICAL_TOWER_RIGHT';
  right.position.x = 0.45;
  root.add(right);
  [left, right].forEach((half, side) => {
    const direction = side === 0 ? -1 : 1;
    const tower = box(half, `SECRET__L2__GRAPHITE_TOWER_HALF_${side + 1}`, [2.55, 10.5, 3.4], materials.graphite, [direction * 0.12, 0.12, 0], true);
    tower.rotation.z = direction * -0.018;
    for (let ridge = 0; ridge < 13; ridge += 1) {
      const y = 0.55 + ridge * 0.72;
      const z = Math.sin(ridge * 1.7 + side) * 1.35;
      box(
        half,
        `SECRET__L2__CORTICAL_FACADE_RIDGE_${side + 1}_${ridge + 1}`,
        [2.72, 0.18, 0.26],
        ridge % 4 === 0 ? materials.ultradarkGlass : materials.blackBasalt,
        [direction * 0.12, y, z],
      ).rotation.z = direction * (ridge % 3 - 1) * 0.025;
    }
    for (let branch = 0; branch < 10; branch += 1) {
      const x = direction * (1.42 + (branch % 2) * 0.04);
      const y0 = 0.8 + branch * 0.86;
      pipe(
        half,
        `SECRET__L2__COPPER_NEURAL_BRANCH_${side + 1}_${branch + 1}`,
        new THREE.Vector3(x, y0, -1.72),
        new THREE.Vector3(x + direction * (branch % 3) * 0.09, y0 + 0.72, -1.74),
        0.025,
        materials.copper,
      );
    }
  });
  box(root, 'SECRET__L2__CONTINUOUS_ILLUMINATED_VOID', [0.38, 10.35, 3.48], materials.whiteLight, [0, 0.18, 0]);
  box(root, 'SECRET__L2__RETRACTABLE_TRENCH_BRIDGE', [1.05, 0.13, 4.2], materials.titanium, [0, 0.13, 3.75]);
  for (let sensor = 0; sensor < 8; sensor += 1) {
    cylinder(root, `SECRET__L2__PLAZA_SENSOR_COLUMN_${sensor + 1}`, [0.09, 0.09], 0.85, materials.titanium, [Math.cos(sensor * Math.PI / 4) * 3.25, 0.16, Math.sin(sensor * Math.PI / 4) * 3.25], false, 12);
    ellipsoid(root, `SECRET__L2__SENSOR_SPHERE_${sensor + 1}`, [0.16, 0.16, 0.16], materials.mirrored, [Math.cos(sensor * Math.PI / 4) * 3.25, 1.05, Math.sin(sensor * Math.PI / 4) * 3.25]);
  }
  for (let needle = 0; needle < 28; needle += 1) {
    const side = needle % 2 ? -1 : 1;
    pipe(
      root,
      `SECRET__L2__ASYMMETRIC_ANTENNA_NEEDLE_${needle + 1}`,
      new THREE.Vector3(side * (0.35 + (needle % 7) * 0.16), 10.62, -1.2 + (needle % 5) * 0.56),
      new THREE.Vector3(side * (0.38 + (needle % 7) * 0.16), 11.15 + (needle % 4) * 0.13, -1.2 + (needle % 5) * 0.56),
      0.014,
      materials.titanium,
    );
  }
  addCalibrationPlate(root, 'L2', [2.6, FLOOR_Y + 0.01, 4.4], materials);
}

function addChimaera(root: THREE.Group, materials: SecretMaterials) {
  const pods = [
    [-4.6, 1.6, -1.8, 2.8, 3.1, 2.3, -0.18],
    [-2.2, 2.05, 1.8, 3.6, 4.1, 2.8, 0.12],
    [0.2, 2.45, -1.5, 4.4, 4.9, 3.4, -0.08],
    [3.2, 1.75, 2.2, 3.2, 3.5, 2.4, 0.2],
    [5.0, 1.35, -1.2, 2.5, 2.7, 2.2, -0.16],
    [-0.7, 1.45, 3.7, 2.7, 2.9, 2.1, 0.16],
    [3.2, 1.15, -4.0, 2.1, 2.3, 1.8, -0.2],
  ] as const;
  pods.forEach(([x, y, z, sx, sy, sz, rz], index) => {
    ellipsoid(root, `SECRET__L3__PEARLESCENT_MORPHOGENESIS_POD_${index + 1}`, [sx, sy, sz], materials.pearlBioceramic, [x, y, z], [0, 0, rz], true);
    for (let rib = 0; rib < 4; rib += 1) {
      const object = torus(
        root,
        `SECRET__L3__POD_STRUCTURAL_RIB_${index + 1}_${rib + 1}`,
        sx * (0.18 + rib * 0.018),
        0.035,
        rib % 2 ? materials.titanium : materials.translucent,
        [x, y - sy * 0.08 + rib * 0.14, z],
        [Math.PI / 2, 0, rz],
      );
      object.scale.z = sz / sx;
    }
  });
  const bridgePairs = [[0, 1], [1, 2], [2, 3], [2, 5], [2, 6], [3, 4]] as const;
  bridgePairs.forEach(([a, b], index) => {
    const start = new THREE.Vector3(pods[a][0], pods[a][1] + 0.6, pods[a][2]);
    const end = new THREE.Vector3(pods[b][0], pods[b][1] + 0.7, pods[b][2]);
    pipe(root, `SECRET__L3__CURVED_EXTERNAL_BRIDGE_${index + 1}`, start, end, 0.18, materials.translucent);
  });
  const canopy = new THREE.Group();
  canopy.name = 'SECRET__L3__FLOATING_PROTECTIVE_MESH_CANOPY';
  for (let strand = 0; strand < 11; strand += 1) {
    const x = -7 + strand * 1.4;
    pipe(canopy, `SECRET__L3__CANOPY_FIBRE_${strand + 1}`, new THREE.Vector3(x, 5.15 + Math.sin(strand) * 0.25, -5.5), new THREE.Vector3(x + Math.sin(strand * 1.6) * 0.6, 5.45 + Math.cos(strand) * 0.3, 5.7), 0.025, materials.titanium);
  }
  for (let strand = 0; strand < 8; strand += 1) {
    const z = -5.2 + strand * 1.5;
    pipe(canopy, `SECRET__L3__CANOPY_CROSS_FIBRE_${strand + 1}`, new THREE.Vector3(-7.2, 5.25, z), new THREE.Vector3(7.2, 5.55 + Math.sin(strand) * 0.2, z + 0.3), 0.018, materials.titanium);
  }
  root.add(canopy);
  for (const x of [-7.1, 7.1]) {
    for (const z of [-5.4, 5.4]) pipe(root, 'SECRET__L3__ANGLED_CANOPY_PYLON', new THREE.Vector3(x, 0.1, z), new THREE.Vector3(x * 0.93, 5.3, z * 0.93), 0.055, materials.titanium);
  }
  ellipseRing(root, 'SECRET__L3__REFLECTIVE_WATER_TERRACES', [8.2, 6.4], [6.9, 5.2], materials.blackWater, [0, FLOOR_Y + 0.02, 0]);
  addCalibrationPlate(root, 'L3', [-6.2, FLOOR_Y + 0.01, 5.8], materials);
}

function addEve(root: THREE.Group, materials: SecretMaterials) {
  ellipseRing(root, 'SECRET__L4__OVAL_REFLECTION_POOL', [6.0, 4.6], [0.1, 0.1], materials.blackWater, [0, FLOOR_Y + 0.01, 0]);
  const vessel = ellipsoid(root, 'SECRET__L4__SUSPENDED_DEVELOPMENT_ARK', [9.5, 4.0, 4.9], materials.translucent, [0, 3.65, 0], [0, 0, 0], true);
  vessel.userData.symbolicForm = 'opaque vessel suspended above its reflection';
  for (const x of [-5.25, 5.25]) {
    const tower = box(root, `SECRET__L4__INWARD_LEANING_SUPPORT_TOWER_${x < 0 ? 'WEST' : 'EAST'}`, [1.55, 5.3, 4.2], materials.paleBioceramic, [x, 0.08, 0], true);
    tower.rotation.z = x < 0 ? -0.035 : 0.035;
    box(root, 'SECRET__L4__ELEVATED_OPAQUE_ACCESS_BRIDGE', [4.4, 0.48, 1.0], materials.paleBioceramic, [x < 0 ? -8.1 : 5.25, 2.75, 0]);
    for (let conduit = 0; conduit < 3; conduit += 1) {
      pipe(
        root,
        `SECRET__L4__UMBILICAL_CONDUIT_${x < 0 ? 'W' : 'E'}_${conduit + 1}`,
        new THREE.Vector3(x * 0.93, 1.2 + conduit * 1.25, -1.1 + conduit * 1.1),
        new THREE.Vector3(x * 0.72, 2.25 + conduit * 0.62, -1.1 + conduit * 1.1),
        0.12,
        materials.titanium,
      );
    }
  }
  for (let rib = 0; rib < 8; rib += 1) {
    torus(root, `SECRET__L4__SUBSURFACE_REINFORCEMENT_RIB_${rib + 1}`, 1.65, 0.035, materials.titanium, [-3.4 + rib * 0.96, 3.65, 0], [0, Math.PI / 2, 0]);
  }
  for (let petal = 0; petal < 7; petal += 1) {
    const fin = box(root, `SECRET__L4__FLUSH_HUMIDITY_VANE_${petal + 1}`, [0.18, 0.65, 1.25], materials.titanium, [-2.7 + petal * 0.9, 5.5, 0]);
    fin.rotation.z = (petal - 3) * 0.045;
  }
  addCalibrationPlate(root, 'L4', [5.4, FLOOR_Y + 0.01, 5.0], materials);
}

function addGenesis(root: THREE.Group, materials: SecretMaterials) {
  box(root, 'SECRET__L5__BLACK_CERAMIC_GLASS_CORE', [21.5, 3.8, 6.4], materials.ultradarkGlass, [0, 0.12, 0], true);
  for (let step = 0; step < 30; step += 1) {
    const t0 = step / 30;
    const t1 = (step + 1) / 30;
    for (const strand of [0, Math.PI]) {
      const p0 = new THREE.Vector3(
        -10.8 + t0 * 21.6,
        2.05 + Math.sin(t0 * Math.PI * 4 + strand) * 1.35,
        Math.cos(t0 * Math.PI * 4 + strand) * 3.5,
      );
      const p1 = new THREE.Vector3(
        -10.8 + t1 * 21.6,
        2.05 + Math.sin(t1 * Math.PI * 4 + strand) * 1.35,
        Math.cos(t1 * Math.PI * 4 + strand) * 3.5,
      );
      pipe(root, `SECRET__L5__STRUCTURAL_DOUBLE_HELIX_${strand === 0 ? 'A' : 'B'}_${step + 1}`, p0, p1, 0.13, materials.paleBioceramic);
    }
  }
  for (let vent = 0; vent < 13; vent += 1) {
    cylinder(root, `SECRET__L5__ORGAN_PIPE_EXHAUST_${vent + 1}`, [0.26, 0.26], 0.9 + (vent % 4) * 0.18, materials.paleBioceramic, [-8.7 + vent * 1.45, 3.9, -1.3], false, 12);
  }
  for (let gate = 0; gate < 11; gate += 1) {
    box(root, `SECRET__L5__UNREADABLE_CODE_GATE_STRIP_${gate + 1}`, [0.13, 2.65 - (gate % 3) * 0.25, 0.08], gate % 2 ? materials.titanium : materials.whiteLight, [10.78, 0.46 + (gate % 3) * 0.12, -2.35 + gate * 0.47]);
  }
  for (const z of [-4.4, 4.4]) {
    box(root, 'SECRET__L5__STRAIGHT_PROCESS_ROAD', [21.8, 0.055, 1.05], materials.darkPaving, [0, FLOOR_Y, z]);
    for (let guide = 0; guide < 13; guide += 1) box(root, 'SECRET__L5__RECESSED_TRANSPORT_GUIDE', [0.62, 0.025, 0.04], materials.cyanLight, [-9 + guide * 1.5, FLOOR_Y + 0.06, z]);
  }
  addCalibrationPlate(root, 'L5', [-10.1, FLOOR_Y + 0.01, 4.8], materials);
}

function addProteus(root: THREE.Group, materials: SecretMaterials) {
  box(root, 'SECRET__L6__HEAVY_PALE_AUTOMATED_PLINTH', [16.7, 1.35, 8.8], materials.paleBioceramic, [0, 0.1, 0], true);
  const frame = new THREE.Group();
  frame.name = 'SECRET__L6__GUNMETAL_RECONFIGURABLE_EXOSKELETON';
  for (const x of [-7.7, -3.9, 0, 3.9, 7.7]) {
    for (const z of [-3.8, 3.8]) pipe(frame, 'SECRET__L6__VERTICAL_GANTRY_TRUSS', new THREE.Vector3(x, 1.4, z), new THREE.Vector3(x, 5.05, z), 0.1, materials.graphite);
    pipe(frame, 'SECRET__L6__OVERHEAD_RESEARCH_RAIL', new THREE.Vector3(x, 4.85, -3.8), new THREE.Vector3(x, 4.85, 3.8), 0.09, materials.titanium);
  }
  for (const z of [-3.8, 3.8]) pipe(frame, 'SECRET__L6__LONGITUDINAL_GANTRY', new THREE.Vector3(-8.0, 4.85, z), new THREE.Vector3(8.0, 4.85, z), 0.12, materials.graphite);
  root.add(frame);
  const moduleMaterials = [materials.ultradarkGlass, materials.paleBioceramic, materials.titanium, materials.graphite, materials.translucent];
  for (let module = 0; module < 22; module += 1) {
    const x = -7.2 + (module % 6) * 2.8;
    const z = -2.9 + Math.floor(module / 6) * 1.85;
    const y = 1.55 + (module % 3) * 0.65;
    if (module % 4 === 1) {
      cylinder(root, `SECRET__L6__SEALED_RESEARCH_CAPSULE_${module + 1}`, [1.2, 1.2], 1.4, moduleMaterials[module % moduleMaterials.length], [x, y, z], false, 20);
    } else {
      box(root, `SECRET__L6__INSERTED_RESEARCH_MODULE_${module + 1}`, [1.75, 1.0 + (module % 3) * 0.3, 1.35], moduleMaterials[module % moduleMaterials.length], [x, y, z]);
    }
  }
  for (let bay = 0; bay < 7; bay += 1) {
    box(root, `SECRET__L6__SEGMENTED_LOADING_APERTURE_${bay + 1}`, [1.55, 1.05, 0.08], materials.ultradarkGlass, [-5.8 + bay * 1.92, 0.22, 4.45]);
    for (let plate = 0; plate < 5; plate += 1) box(root, `SECRET__L6__OVERLAPPING_SHUTTER_PLATE_${bay + 1}_${plate + 1}`, [1.48, 0.16, 0.05], materials.graphite, [-5.8 + bay * 1.92, 0.28 + plate * 0.18, 4.52]);
  }
  const command = box(root, 'SECRET__L6__SLOPED_CORNER_COMMAND_TOWER', [2.2, 5.0, 2.2], materials.ultradarkGlass, [7.1, 1.4, -3.2], true);
  command.rotation.z = -0.06;
  const sensor = cylinder(root, 'SECRET__L6__ROTATING_OPTICAL_CLUSTER', [1.0, 1.0], 0.45, materials.titanium, [7.1, 6.15, -3.2], false, 12);
  sensor.userData.animate = 'secret-sensor-sweep';
  sensor.userData.speed = 0.11;
  addCalibrationPlate(root, 'L6', [-7.4, FLOOR_Y + 0.01, 5.2], materials);
}

function addAriadne(root: THREE.Group, materials: SecretMaterials) {
  cylinder(root, 'SECRET__L7__OPAQUE_GRAPHITE_INNER_CYLINDER', [7.2, 7.2], 5.8, materials.graphite, [0, 0.1, 0], true, 48);
  for (let band = 0; band < 5; band += 1) torus(root, `SECRET__L7__VENTILATION_BAND_${band + 1}`, 3.62, 0.07, band % 2 ? materials.ultradarkGlass : materials.titanium, [0, 0.85 + band * 0.88, 0], [Math.PI / 2, 0, 0]);
  [8.2, 9.2, 10.3].forEach((diameter, index) => {
    const shell = cylinder(root, `SECRET__L7__CONCENTRIC_CONTAINMENT_MESH_${index + 1}`, [diameter, diameter], 6.1 + index * 0.22, materials.mesh, [0, 0.05, 0], false, 32 + index * 8);
    shell.userData.navObstacle = false;
  });
  const points: number[] = [];
  for (let particle = 0; particle < 540; particle += 1) {
    const angle = particle * 2.399963;
    const radius = 3.7 + ((particle * 37) % 160) / 160 * 1.25;
    points.push(Math.cos(angle) * radius, 0.35 + ((particle * 53) % 480) / 100, Math.sin(angle) * radius);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const pointMaterial = new THREE.PointsMaterial({
    name: 'ARIADNE autonomous swarm glints',
    color: '#c8f3ef',
    size: 0.045,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  const swarm = prepare(new THREE.Points(geometry, pointMaterial), 'SECRET__L7__CONTAINED_AUTONOMOUS_SWARM');
  swarm.userData.animate = 'secret-swarm-orbit';
  swarm.userData.speed = 0.07;
  root.add(swarm);
  for (let chimney = 0; chimney < 14; chimney += 1) {
    const angle = chimney * Math.PI * 2 / 14;
    const start = new THREE.Vector3(Math.cos(angle) * 2.75, 5.82, Math.sin(angle) * 2.75);
    const end = new THREE.Vector3(Math.cos(angle) * 3.1, 6.75, Math.sin(angle) * 3.1);
    pipe(root, `SECRET__L7__INCLINED_FILTER_CHIMNEY_${chimney + 1}`, start, end, 0.08, materials.titanium);
  }
  const entrance = new THREE.Group();
  entrance.name = 'SECRET__L7__OFFSET_TRIPLE_AIRLOCK';
  entrance.rotation.y = 0.25;
  for (let gate = 0; gate < 3; gate += 1) {
    box(entrance, `SECRET__L7__SUCCESSIVE_EXTERIOR_GATE_${gate + 1}`, [1.65, 1.5, 0.22], materials.graphite, [-0.35 + gate * 0.35, 0.08, 4.7 + gate * 0.75], true);
    addMist(entrance, `SECRET__L7__AIR_CURTAIN_${gate + 1}`, [-0.35 + gate * 0.35, 0.95, 4.58 + gate * 0.75], [1.2, 1.3, 0.14], materials, gate);
  }
  root.add(entrance);
  addCalibrationPlate(root, 'L7', [4.8, FLOOR_Y + 0.01, 5.3], materials);
}

function addMorphos(root: THREE.Group, materials: SecretMaterials) {
  box(root, 'SECRET__L8__PROGRAMMABLE_MATTER_CORE', [10.4, 3.8, 7.9], materials.graphite, [0, 0.1, 0], true);
  const triangleGeometry = new THREE.BufferGeometry();
  triangleGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.5, -0.5, 0,
    0.5, -0.5, 0,
    0, 0.5, 0,
  ], 3));
  triangleGeometry.computeVertexNormals();
  const panelMaterial = secretMaterial('MORPHOS independently actuated charcoal panel', '#252c31', {
    roughness: 0.4,
    metalness: 0.58,
    side: THREE.DoubleSide,
  });
  const silverPanelMaterial = secretMaterial('MORPHOS reflective panel underside', '#aeb8ba', {
    roughness: 0.16,
    metalness: 0.96,
    side: THREE.DoubleSide,
  });
  const panelRoot = new THREE.Group();
  panelRoot.name = 'SECRET__L8__ACTUATED_TRIANGULAR_FACADE';
  const faces = [
    { axis: 'front', cols: 18, rows: 7, width: 10.3, height: 3.75, z: 3.97 },
    { axis: 'back', cols: 18, rows: 7, width: 10.3, height: 3.75, z: -3.97 },
    { axis: 'left', cols: 13, rows: 7, width: 7.8, height: 3.75, z: -5.22 },
    { axis: 'right', cols: 13, rows: 7, width: 7.8, height: 3.75, z: 5.22 },
  ] as const;
  let panelIndex = 0;
  faces.forEach((face, faceIndex) => {
    for (let row = 0; row < face.rows; row += 1) {
      for (let column = 0; column < face.cols; column += 1) {
        panelIndex += 1;
        const panel = prepare(
          new THREE.Mesh(triangleGeometry, panelIndex % 11 === 0 ? silverPanelMaterial : panelMaterial),
          `SECRET__L8__ACTUATED_PANEL_${panelIndex}`,
        );
        const u = (column + 0.5) / face.cols - 0.5;
        const y = 0.28 + (row + 0.5) / face.rows * face.height;
        const lift = (Math.sin(column * 1.7 + row * 0.9 + faceIndex) + 1) * 0.055;
        panel.scale.set(face.width / face.cols * 0.96, face.height / face.rows * 0.92, 1);
        if (face.axis === 'front' || face.axis === 'back') {
          panel.position.set(u * face.width, y, face.z + (face.axis === 'front' ? lift : -lift));
          panel.rotation.y = face.axis === 'front' ? 0 : Math.PI;
        } else {
          panel.position.set(face.axis === 'left' ? -5.23 - lift : 5.23 + lift, y, u * face.width);
          panel.rotation.y = face.axis === 'left' ? -Math.PI / 2 : Math.PI / 2;
        }
        panel.rotation.z = ((column + row) % 2 ? 1 : -1) * Math.PI / 2;
        panel.userData.panelPhase = column * 0.3 + row * 0.7 + faceIndex;
        panelRoot.add(panel);
      }
    }
  });
  root.add(panelRoot);
  for (let roofRow = 0; roofRow < 6; roofRow += 1) {
    for (let roofColumn = 0; roofColumn < 12; roofColumn += 1) {
      const panel = prepare(
        new THREE.Mesh(triangleGeometry, (roofColumn + roofRow) % 9 === 0 ? silverPanelMaterial : panelMaterial),
        `SECRET__L8__ROOF_ACTUATED_PANEL_${roofRow + 1}_${roofColumn + 1}`,
      );
      panel.scale.set(0.82, 0.66, 1);
      panel.rotation.set(-Math.PI / 2, 0, ((roofColumn + roofRow) % 2 ? 1 : -1) * Math.PI / 2);
      panel.position.set(-4.7 + roofColumn * 0.85, 4.06 + Math.sin(roofColumn * 0.8 + roofRow) * 0.05, -3.25 + roofRow * 1.3);
      panelRoot.add(panel);
    }
  }
  box(root, 'SECRET__L8__FOLDED_TRIANGULAR_ENTRANCE', [2.2, 2.2, 0.1], materials.ultradarkGlass, [0, 0.16, 4.02]);
  const canopy = box(root, 'SECRET__L8__RAISED_PANEL_PORTAL_CANOPY', [3.6, 0.18, 2.3], materials.titanium, [0, 2.25, 4.0]);
  canopy.rotation.x = -0.16;
  ellipsoid(root, 'SECRET__L8__ADAPTIVE_PLATE_BOULDER', [1.6, 1.25, 1.35], materials.titanium, [-6.6, 0.78, 3.8]);
  const lattice = new THREE.Group();
  lattice.name = 'SECRET__L8__RAIN_RESPONSIVE_TEST_LATTICE';
  for (let level = 0; level < 6; level += 1) {
    const radius = 0.85 - level * 0.08;
    torus(lattice, `SECRET__L8__LATTICE_LEVEL_${level + 1}`, radius, 0.035, materials.titanium, [6.7, 0.6 + level * 0.55, 3.5], [Math.PI / 2, 0, 0]);
  }
  root.add(lattice);
  addCalibrationPlate(root, 'L8', [5.7, FLOOR_Y + 0.01, 5.2], materials);
}

function addTopos(root: THREE.Group, materials: SecretMaterials) {
  box(root, 'SECRET__L9__SQUARE_DRY_MOAT_OUTER', [15.3, 0.72, 15.3], materials.blackBasalt, [0, -0.48, 0]);
  box(root, 'SECRET__L9__PALE_CERAMIC_MOAT_FLOOR', [13.8, 0.08, 13.8], materials.gravel, [0, -0.5, 0]);
  box(root, 'SECRET__L9__MASSIVE_SLOPED_BASALT_PLINTH', [12.5, 0.72, 12.5], materials.blackBasalt, [0, 0.08, 0], true);
  box(root, 'SECRET__L9__UNINTERRUPTED_WHITE_QUANTUM_BAND', [12.15, 0.52, 12.15], materials.paleBioceramic, [0, 0.8, 0], true);
  box(root, 'SECRET__L9__DARK_CRYOGENIC_UPPER_LAYER', [11.8, 0.62, 11.8], materials.graphite, [0, 1.34, 0], true);
  for (const side of [-1, 1]) {
    box(root, `SECRET__L9__COLD_LIGHT_SEAM_X_${side}`, [12.25, 0.055, 0.055], materials.whiteLight, [0, 1.25, side * 6.1]);
    box(root, `SECRET__L9__COLD_LIGHT_SEAM_Z_${side}`, [0.055, 0.055, 12.25], materials.whiteLight, [side * 6.1, 1.25, 0]);
  }
  for (let fin = 0; fin < 22; fin += 1) {
    const edge = fin % 4;
    const offset = -5 + Math.floor(fin / 4) * 2.0;
    const position: [number, number, number] = edge === 0
      ? [offset, 1.95, -5.75]
      : edge === 1
        ? [5.75, 1.95, offset]
        : edge === 2
          ? [offset, 1.95, 5.75]
          : [-5.75, 1.95, offset];
    box(root, `SECRET__L9__DARK_COOLING_FIN_${fin + 1}`, edge % 2 ? [0.16, 0.85, 1.1] : [1.1, 0.85, 0.16], materials.graphite, position);
  }
  for (const [corner, x, z] of [[1, -7.2, -7.2], [2, 7.2, -7.2], [3, -7.2, 7.2], [4, 7.2, 7.2]] as const) {
    box(root, `SECRET__L9__DETACHED_CORNER_TOWER_${corner}`, [1.6, 2.35 + corner * 0.12, 1.6], corner % 2 ? materials.graphite : materials.paleBioceramic, [x, 0.08, z], true);
    pipe(root, `SECRET__L9__OVERHEAD_SHIELDED_CONDUIT_${corner}`, new THREE.Vector3(x * 0.9, 2.0, z * 0.9), new THREE.Vector3(x * 0.7, 2.0, z * 0.7), 0.18, materials.titanium);
  }
  for (let segment = 0; segment < 5; segment += 1) {
    box(root, `SECRET__L9__INDEPENDENT_BRIDGE_SEGMENT_${segment + 1}`, [1.35, 0.15, 2.25], materials.paleBioceramic, [0, 0.12, 6.6 + segment * 2.3]);
  }
  for (const [x, z] of [[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]] as const) {
    pipe(root, 'SECRET__L9__ROOF_FRAME_PYLON', new THREE.Vector3(x, 1.95, z), new THREE.Vector3(x * 0.62, 4.2, z * 0.62), 0.09, materials.titanium);
  }
  torus(root, 'SECRET__L9__QUANTUM_NETWORK_CIRCULAR_FRAME', 3.2, 0.14, materials.titanium, [0, 4.2, 0], [Math.PI / 2, 0, 0]);
  const device = box(root, 'SECRET__L9__CIRCUMFERENCE_TIMING_DEVICE', [0.34, 0.2, 0.18], materials.whiteLight, [3.2, 4.12, 0]);
  device.userData.animate = 'secret-horizontal-orbit';
  device.userData.orbitRadius = 3.2;
  device.userData.baseY = 4.22;
  device.userData.phase = 0;
  device.userData.speed = 0.18;
  addCalibrationPlate(root, 'L9', [7.3, FLOOR_Y + 0.01, 10.2], materials);
}

function addChronos(root: THREE.Group, materials: SecretMaterials) {
  cylinder(root, 'SECRET__L10__DARK_CENTRAL_REFLECTION_POOL', [8.6, 8.6], 0.08, materials.blackWater, [0, FLOOR_Y, 0], false, 64);
  torus(root, 'SECRET__L10__BLACK_STONE_CRESCENT_BASE', 5.3, 0.9, materials.blackBasalt, [0, 0.5, 0], [Math.PI / 2, 0, 0], Math.PI * 1.38, 72).rotation.z = -Math.PI * 0.2;
  const ringAssembly = new THREE.Group();
  ringAssembly.name = 'SECRET__L10__MONUMENTAL_TILTED_TIME_RING';
  ringAssembly.rotation.z = THREE.MathUtils.degToRad(23);
  torus(ringAssembly, 'SECRET__L10__BRUSHED_TITANIUM_ARCHITECTURAL_RING', 5.25, 0.58, materials.titanium, [0, 5.3, 0], [0, 0, 0], Math.PI * 2, 96);
  for (let strip = 0; strip < 14; strip += 1) {
    const angle = strip * Math.PI * 2 / 14;
    const marker = box(
      ringAssembly,
      `SECRET__L10__DARK_MIRRORED_TRACKING_STRIP_${strip + 1}`,
      [0.24, 0.62, 0.1],
      materials.ultradarkGlass,
      [Math.cos(angle) * 5.25, 5.3 + Math.sin(angle) * 5.25 - 0.31, 0.54],
    );
    marker.rotation.z = angle;
  }
  const point = ellipsoid(ringAssembly, 'SECRET__L10__CONSTANT_RATE_WHITE_TIME_POINT', [0.22, 0.22, 0.22], materials.whiteLight, [5.25, 5.3, 0]);
  point.userData.animate = 'secret-vertical-orbit';
  point.userData.orbitRadius = 5.25;
  point.userData.centerY = 5.3;
  point.userData.phase = 0;
  point.userData.speed = 0.16;
  root.add(ringAssembly);
  for (let meridian = 0; meridian < 24; meridian += 1) {
    const angle = meridian * Math.PI * 2 / 24;
    pipe(
      root,
      `SECRET__L10__PLAZA_MERIDIAN_${meridian + 1}`,
      new THREE.Vector3(Math.cos(angle) * 5.1, FLOOR_Y + 0.035, Math.sin(angle) * 5.1),
      new THREE.Vector3(Math.cos(angle) * 8.2, FLOOR_Y + 0.035, Math.sin(angle) * 8.2),
      0.018,
      meridian % 6 === 0 ? materials.whiteLight : materials.titanium,
    );
  }
  torus(root, 'SECRET__L10__VIBRATION_ISOLATION_TRENCH', 8.3, 0.22, materials.blackBasalt, [0, FLOOR_Y + 0.02, 0], [Math.PI / 2, 0, 0]);
  box(root, 'SECRET__L10__ANGLED_SEAM_ENTRANCE', [1.4, 1.7, 0.12], materials.ultradarkGlass, [-3.15, 0.18, 0.2]).rotation.z = THREE.MathUtils.degToRad(23);
  addCalibrationPlate(root, 'L10', [6.2, FLOOR_Y + 0.01, 6.4], materials);
}

function addHelios(root: THREE.Group, materials: SecretMaterials) {
  cylinder(root, 'SECRET__L11__ARMOURED_REFRACTORY_DRUM', [14.5, 14.5], 4.8, materials.graphite, [0, 0.1, 0], true, 48);
  const beltMaterials = [materials.titanium, materials.copper, materials.paleBioceramic];
  for (let belt = 0; belt < 6; belt += 1) {
    torus(root, `SECRET__L11__TOROIDAL_MAGNETIC_HOUSING_${belt + 1}`, 7.32, 0.26, beltMaterials[belt % 3], [0, 0.72 + belt * 0.68, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 72);
  }
  for (let rib = 0; rib < 18; rib += 1) {
    const angle = rib * Math.PI * 2 / 18;
    box(root, `SECRET__L11__VERTICAL_COOLING_RIB_${rib + 1}`, [0.18, 4.3, 0.52], rib % 3 === 0 ? materials.paleBioceramic : materials.titanium, [Math.cos(angle) * 7.15, 0.3, Math.sin(angle) * 7.15]).rotation.y = -angle;
  }
  cylinder(root, 'SECRET__L11__RECESSED_ROOF_CRATER', [9.2, 9.2], 0.38, materials.blackBasalt, [0, 4.55, 0], false, 48);
  cylinder(root, 'SECRET__L11__CENTRAL_BLACK_REACTOR_CAP', [2.8, 2.8], 0.52, materials.porousBlack, [0, 4.65, 0], false, 32);
  for (let plate = 0; plate < 12; plate += 1) {
    const angle = plate * Math.PI * 2 / 12;
    const object = box(root, `SECRET__L11__SPIRAL_SHIELDING_PLATE_${plate + 1}`, [3.2, 0.12, 1.0], materials.graphite, [Math.cos(angle) * 3.5, 5.08, Math.sin(angle) * 3.5]);
    object.rotation.y = -angle + 0.28;
  }
  box(root, 'SECRET__L11__ARMOURED_WESTERN_ACCESS_PASSAGE', [8.3, 2.3, 2.5], materials.blackBasalt, [-10.6, 0.1, 0], true);
  for (let gate = 0; gate < 4; gate += 1) box(root, `SECRET__L11__PASSAGE_SEGMENTED_GATE_${gate + 1}`, [0.12, 1.72, 2.1], materials.titanium, [-14.0 + gate * 2.2, 0.35, 0]);
  for (let pylon = 0; pylon < 6; pylon += 1) {
    const angle = pylon * Math.PI * 2 / 6;
    const x = Math.cos(angle) * 9.8;
    const z = Math.sin(angle) * 9.8;
    box(root, `SECRET__L11__DETACHED_POWER_PYLON_${pylon + 1}`, [0.45, 4.6, 0.45], materials.titanium, [x, 0.05, z], true);
    pipe(root, `SECRET__L11__HEAVY_UNDERGROUND_CABLE_${pylon + 1}`, new THREE.Vector3(x, 3.9, z), new THREE.Vector3(x * 0.78, 0.22, z * 0.78), 0.12, materials.graphite);
  }
  for (let mist = 0; mist < 10; mist += 1) {
    const angle = mist * Math.PI * 2 / 10;
    addMist(root, `SECRET__L11__BASE_COOLANT_MIST_${mist + 1}`, [Math.cos(angle) * 7.7, 0.35, Math.sin(angle) * 7.7], [1.35, 0.35, 0.7], materials, mist * 0.5);
  }
  addCalibrationPlate(root, 'L11', [-13.8, FLOOR_Y + 0.01, 2.2], materials);
}

function addOrpheus(root: THREE.Group, materials: SecretMaterials) {
  const tower = prepare(
    new THREE.Mesh(new THREE.CylinderGeometry(1.55, 2.15, 7.8, 3), materials.porousBlack),
    'SECRET__L12__ULTRADARK_TRIANGULAR_OBELISK',
    true,
  );
  tower.position.y = 3.98;
  tower.rotation.y = Math.PI / 6;
  root.add(tower);
  for (let prong = 0; prong < 3; prong += 1) {
    const angle = prong * Math.PI * 2 / 3 + Math.PI / 6;
    pipe(root, `SECRET__L12__PHOTONIC_CROWN_PRONG_${prong + 1}`, new THREE.Vector3(Math.cos(angle) * 0.65, 7.65, Math.sin(angle) * 0.65), new THREE.Vector3(Math.cos(angle) * 1.05, 9.0, Math.sin(angle) * 1.05), 0.12, materials.graphite);
  }
  const lattice = new THREE.Group();
  lattice.name = 'SECRET__L12__SUSPENDED_PHOTONIC_SENSOR_LATTICE';
  for (let edge = 0; edge < 6; edge += 1) {
    const a = edge * Math.PI / 3;
    const b = (edge + 1) * Math.PI / 3;
    pipe(lattice, `SECRET__L12__CROWN_LATTICE_EDGE_${edge + 1}`, new THREE.Vector3(Math.cos(a) * 0.68, 8.55, Math.sin(a) * 0.68), new THREE.Vector3(Math.cos(b) * 0.68, 8.55, Math.sin(b) * 0.68), 0.025, materials.mirrored);
  }
  root.add(lattice);
  for (let plate = 0; plate < 96; plate += 1) {
    const angle = plate * 0.53;
    const radius = 2.8 + plate * 0.064;
    const width = 0.25 + (plate % 4) * 0.08;
    const object = box(
      root,
      `SECRET__L12__LOGARITHMIC_MIRROR_PLATE_${plate + 1}`,
      [width, 0.045, width * 0.74],
      materials.mirrored,
      [Math.cos(angle) * radius, 0.12 + (plate % 5) * 0.03, Math.sin(angle) * radius],
    );
    object.rotation.y = -angle + Math.sin(plate * 1.2) * 0.4;
    object.rotation.z = Math.sin(plate * 0.7) * 0.14;
  }
  for (let channel = 0; channel < 8; channel += 1) {
    box(root, `SECRET__L12__SILVER_SURFACE_WATER_CHANNEL_${channel + 1}`, [15.0, 0.025, 0.055], materials.titanium, [0, FLOOR_Y + 0.02, -6.2 + channel * 1.75]).rotation.y = channel % 2 ? 0.12 : -0.12;
  }
  box(root, 'SECRET__L12__BERM_HIDDEN_DESCENDING_PATH', [1.2, 0.08, 5.2], materials.darkPaving, [-6.0, -0.2, 4.8]).rotation.z = -0.07;
  box(root, 'SECRET__L12__SEAMLESS_BERM_GATE', [1.6, 1.35, 0.1], materials.titanium, [-6.35, 0.1, 2.3]);
  addCalibrationPlate(root, 'L12', [-7.3, FLOOR_Y + 0.01, 6.8], materials);
}

function addNoosphere(root: THREE.Group, materials: SecretMaterials) {
  cylinder(root, 'SECRET__L13__PALE_CERAMIC_CRATER', [12.8, 12.8], 1.25, materials.paleBioceramic, [0, -0.72, 0], true, 64);
  cylinder(root, 'SECRET__L13__CONTINUOUS_BLACK_WATER_RING', [10.6, 10.6], 0.07, materials.blackWater, [0, FLOOR_Y + 0.01, 0], false, 64);
  cylinder(root, 'SECRET__L13__SPHERE_ISOLATION_VOID', [8.8, 8.8], 0.09, materials.blackBasalt, [0, FLOOR_Y + 0.03, 0], false, 64);
  const sphereMaterial = new THREE.MeshPhysicalMaterial({
    name: 'NOOSPHERE computational dark mirror facets',
    color: '#101d26',
    emissive: '#102c3b',
    emissiveIntensity: 0.4,
    roughness: 0.12,
    metalness: 0.8,
    clearcoat: 0.9,
  });
  const sphere = prepare(new THREE.Mesh(new THREE.IcosahedronGeometry(4.1, 3), sphereMaterial), 'SECRET__L13__HALF_SUNK_MIRRORED_SPHERE', true);
  sphere.position.y = 0.12;
  sphere.userData.animate = 'secret-noosphere-shimmer';
  root.add(sphere);
  for (let terrace = 0; terrace < 4; terrace += 1) {
    ellipseRing(root, `SECRET__L13__DESCENDING_CRATER_TERRACE_${terrace + 1}`, [6.5 - terrace * 0.55, 6.5 - terrace * 0.55], [6.15 - terrace * 0.55, 6.15 - terrace * 0.55], terrace % 2 ? materials.paving : materials.paleBioceramic, [0, 0.07 + terrace * 0.06, 0]);
  }
  box(root, 'SECRET__L13__RAILLESS_TRANSLUCENT_STONE_BRIDGE', [1.0, 0.12, 7.2], materials.translucent, [0, 0.15, 5.8]);
  for (let facet = 0; facet < 6; facet += 1) {
    const object = box(root, `SECRET__L13__SUBDIVIDING_ENTRANCE_FACET_${facet + 1}`, [0.62, 0.52, 0.08], materials.ultradarkGlass, [-0.95 + facet * 0.38, 0.5 + Math.abs(2.5 - facet) * 0.18, 3.92]);
    object.rotation.z = (facet - 2.5) * 0.12;
  }
  for (let fibre = 0; fibre < 18; fibre += 1) {
    const angle = fibre * Math.PI * 2 / 18;
    torus(root, `SECRET__L13__SUBMERGED_CITY_GRID_${fibre + 1}`, 4.55 + (fibre % 3) * 0.18, 0.012, fibre % 5 === 0 ? materials.whiteLight : materials.cyanLight, [0, 0.16, 0], [Math.PI / 2, 0, angle], Math.PI * (0.12 + (fibre % 4) * 0.04), 18).rotation.z = angle;
  }
  for (let marker = 0; marker < 16; marker += 1) {
    const angle = marker * Math.PI * 2 / 16;
    cylinder(root, `SECRET__L13__LOW_EXCLUSION_FIELD_MARKER_${marker + 1}`, [0.09, 0.09], 0.22, materials.titanium, [Math.cos(angle) * 6.1, 0.1, Math.sin(angle) * 6.1], false, 8);
  }
  addCalibrationPlate(root, 'L13', [5.2, FLOOR_Y + 0.01, 7.1], materials);
}

function wedgeGeometry(width: number, height: number, depth: number, lean: number) {
  const bottom = [
    [-width * 0.5, 0, -depth * 0.5],
    [width * 0.5, 0, -depth * 0.5],
    [width * 0.5, 0, depth * 0.5],
    [-width * 0.5, 0, depth * 0.5],
  ];
  const top = [
    [-width * 0.36 + lean, height, -depth * 0.38],
    [width * 0.36 + lean, height, -depth * 0.38],
    [width * 0.36 + lean, height, depth * 0.38],
    [-width * 0.36 + lean, height, depth * 0.38],
  ];
  const vertices = [...bottom, ...top];
  const faces = [
    [0, 2, 1], [0, 3, 2],
    [4, 5, 6], [4, 6, 7],
    [0, 1, 5], [0, 5, 4],
    [1, 2, 6], [1, 6, 5],
    [2, 3, 7], [2, 7, 6],
    [3, 0, 4], [3, 4, 7],
  ];
  const positions: number[] = [];
  faces.forEach((face) => face.forEach((index) => positions.push(...vertices[index])));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function addLimen(root: THREE.Group, materials: SecretMaterials) {
  box(root, 'SECRET__L14__EXTRAORDINARILY_FLAT_PALE_PLAZA', [15.0, 0.08, 13.0], materials.paving, [0, FLOOR_Y, 0]);
  const west = prepare(new THREE.Mesh(wedgeGeometry(4.7, 9.2, 5.0, -0.72), materials.titanium), 'SECRET__L14__WEST_METAMATERIAL_MONOLITH', true);
  west.position.set(-3.0, 0.12, 0);
  west.rotation.z = -0.025;
  root.add(west);
  const east = prepare(new THREE.Mesh(wedgeGeometry(4.7, 9.2, 5.0, 0.72), materials.titanium), 'SECRET__L14__EAST_METAMATERIAL_MONOLITH', true);
  east.position.set(3.0, 0.12, 0);
  east.rotation.z = 0.025;
  root.add(east);
  for (let prism = 0; prism < 28; prism += 1) {
    const side = prism % 2 ? -1 : 1;
    box(root, `SECRET__L14__MICROPRISM_PANEL_${prism + 1}`, [0.08, 0.62, 0.85], prism % 4 === 0 ? materials.mirrored : materials.translucent, [side * (5.0 - (prism % 7) * 0.18), 0.55 + Math.floor(prism / 4) * 1.15, -1.75 + (prism % 4) * 1.15]);
  }
  box(root, 'SECRET__L14__SUSPENDED_TWO_THIRDS_BRIDGE', [3.2, 0.42, 1.0], materials.titanium, [-1.6, 6.18, 0]);
  cylinder(root, 'SECRET__L14__DEEP_ANOMALOUS_SHAFT', [4.0, 4.0], 0.22, materials.porousBlack, [0, -0.12, 0], false, 40);
  for (let line = 0; line < 9; line += 1) {
    const x = -1.8 + line * 0.45;
    pipe(root, `SECRET__L14__SHAFT_STRUCTURAL_LATTICE_${line + 1}`, new THREE.Vector3(x, 0.12, -1.8), new THREE.Vector3(x, 0.12, 1.8), 0.035, materials.graphite);
  }
  for (let line = 0; line < 9; line += 1) {
    const z = -1.8 + line * 0.45;
    pipe(root, `SECRET__L14__SHAFT_CROSS_LATTICE_${line + 1}`, new THREE.Vector3(-1.8, 0.13, z), new THREE.Vector3(1.8, 0.13, z), 0.035, materials.graphite);
  }
  for (let channel = 0; channel < 10; channel += 1) {
    box(root, `SECRET__L14__PRECISION_LEVEL_WATER_CHANNEL_${channel + 1}`, [14.2, 0.022, 0.055], materials.blackWater, [0, FLOOR_Y + 0.06, -5.4 + channel * 1.2]);
  }
  for (let pillar = 0; pillar < 28; pillar += 1) {
    const angle = pillar * 2.399963;
    const radius = 5.2 + (pillar % 4) * 0.7;
    box(root, `SECRET__L14__BLACK_RANGING_PILLAR_${pillar + 1}`, [0.16, 0.82 + (pillar % 3) * 0.18, 0.16], materials.blackBasalt, [Math.cos(angle) * radius, 0.12, Math.sin(angle) * radius]);
    box(root, `SECRET__L14__OPTICAL_REFLECTOR_${pillar + 1}`, [0.12, 0.12, 0.03], materials.whiteLight, [Math.cos(angle) * radius, 0.78 + (pillar % 3) * 0.18, Math.sin(angle) * radius]);
  }
  box(root, 'SECRET__L14__TALL_UNMARKED_WEST_PORTAL', [0.85, 3.1, 0.08], materials.ultradarkGlass, [-5.32, 0.18, 1.0]);
  addMist(root, 'SECRET__L14__SHAFT_TRAPPED_VAPOUR', [0, 1.3, 0], [2.8, 1.8, 2.8], materials, 1.4);
  addCalibrationPlate(root, 'L14', [-6.3, FLOOR_Y + 0.01, 5.5], materials);
}

function addNull(root: THREE.Group, materials: SecretMaterials) {
  box(root, 'SECRET__L15__EXCAVATION_BLACK_GRAVEL_FLOOR', [16.5, 0.08, 11.2], materials.darkPaving, [0, -1.2, 0]);
  for (let terrace = 0; terrace < 4; terrace += 1) {
    const sizeX = 17.2 - terrace * 0.7;
    const sizeZ = 12.0 - terrace * 0.7;
    const y = -0.96 + terrace * 0.28;
    box(root, `SECRET__L15__LAYERED_RETAINING_TERRACE_NORTH_${terrace + 1}`, [sizeX, 0.26, 0.38], materials.blackBasalt, [0, y, -sizeZ * 0.5]);
    box(root, `SECRET__L15__LAYERED_RETAINING_TERRACE_SOUTH_${terrace + 1}`, [sizeX, 0.26, 0.38], materials.blackBasalt, [0, y, sizeZ * 0.5]);
    box(root, `SECRET__L15__LAYERED_RETAINING_TERRACE_WEST_${terrace + 1}`, [0.38, 0.26, sizeZ], materials.blackBasalt, [-sizeX * 0.5, y, 0]);
    box(root, `SECRET__L15__LAYERED_RETAINING_TERRACE_EAST_${terrace + 1}`, [0.38, 0.26, sizeZ], materials.blackBasalt, [sizeX * 0.5, y, 0]);
  }
  box(root, 'SECRET__L15__SUNK_ULTRABLACK_CONTAINMENT_MONOLITH', [13.5, 4.2, 6.8], materials.porousBlack, [0, -1.2, 0], true);
  box(root, 'SECRET__L15__UNIFORM_WHITE_VERTICAL_SLIT', [0.28, 3.0, 0.08], materials.whiteLight, [0, -0.1, 3.43]);
  for (let segment = 0; segment < 6; segment += 1) {
    box(root, `SECRET__L15__SEPARATED_HIGH_WALLED_BRIDGE_SEGMENT_${segment + 1}`, [1.1, 0.13, 0.72], materials.graphite, [0, -1.02 + segment * 0.14, 4.0 + segment * 0.82]);
    for (const x of [-0.56, 0.56]) box(root, `SECRET__L15__BRIDGE_VIEW_BLOCKING_WALL_${segment + 1}_${x < 0 ? 'L' : 'R'}`, [0.1, 1.0, 0.72], materials.graphite, [x, -0.98 + segment * 0.14, 4.0 + segment * 0.82]);
  }
  for (const [side, x] of [['WEST', -7.6], ['EAST', 7.6]] as const) {
    const guard = new THREE.Group();
    guard.name = `SECRET__L15__PALE_${side}_GUARD_PAVILION`;
    guard.position.set(x, -0.2, 2.2);
    guard.rotation.y = x < 0 ? 0.18 : -0.18;
    box(guard, `SECRET__L15__${side}_GUARD_SHELL`, [2.2, 1.25, 2.1], materials.paleBioceramic, [0, 0, 0], true);
    box(guard, `SECRET__L15__${side}_OBSERVATION_BAND`, [2.05, 0.28, 0.08], materials.ultradarkGlass, [0, 0.62, 1.06]);
    for (let aperture = 0; aperture < 3; aperture += 1) box(guard, `SECRET__L15__${side}_DRONE_APERTURE_${aperture + 1}`, [0.35, 0.22, 0.06], materials.porousBlack, [-0.55 + aperture * 0.55, 0.2, 1.1]);
    root.add(guard);
  }
  pipe(root, 'SECRET__L15__CONCEALED_SENSOR_NEEDLE_MAST', new THREE.Vector3(0, 0.1, -4.5), new THREE.Vector3(0, 9.6, -4.5), 0.055, materials.titanium);
  for (let marker = 0; marker < 12; marker += 1) {
    const x = -7.4 + (marker % 6) * 3.0;
    const z = marker < 6 ? -5.1 : 5.1;
    cylinder(root, `SECRET__L15__SPARSE_RED_PERIMETER_MARKER_${marker + 1}`, [0.09, 0.09], 0.25, materials.redLight, [x, FLOOR_Y, z], false, 8);
  }
  addCalibrationPlate(root, 'L15', [7.2, FLOOR_Y + 0.01, 5.8], materials);
}

function createBuilding(record: SecretLabBuildingProgram, materials: SecretMaterials) {
  const root = labRoot(record);
  switch (record.form) {
    case 'aion': addAion(root, materials); break;
    case 'mnemosyne': addMnemosyne(root, materials); break;
    case 'chimaera': addChimaera(root, materials); break;
    case 'eve': addEve(root, materials); break;
    case 'genesis': addGenesis(root, materials); break;
    case 'proteus': addProteus(root, materials); break;
    case 'ariadne': addAriadne(root, materials); break;
    case 'morphos': addMorphos(root, materials); break;
    case 'topos': addTopos(root, materials); break;
    case 'chronos': addChronos(root, materials); break;
    case 'helios': addHelios(root, materials); break;
    case 'orpheus': addOrpheus(root, materials); break;
    case 'noosphere': addNoosphere(root, materials); break;
    case 'limen': addLimen(root, materials); break;
    case 'null': addNull(root, materials); break;
  }
  return root;
}

function pointInDistrict(
  definition: DistrictDefinition,
  radialT: number,
  angularT: number,
  y = FLOOR_Y,
) {
  if (!definition.sector) return new THREE.Vector3(0, y, 0);
  const { innerRadius, outerRadius, startAngle, endAngle } = definition.sector;
  const radialMargin = 0.065;
  const angularMargin = 0.045;
  const radius = THREE.MathUtils.lerp(
    innerRadius,
    outerRadius,
    THREE.MathUtils.lerp(radialMargin, 1 - radialMargin, radialT),
  );
  const angle = THREE.MathUtils.lerp(
    startAngle,
    endAngle,
    THREE.MathUtils.lerp(angularMargin, 1 - angularMargin, angularT),
  );
  return new THREE.Vector3(
    Math.cos(angle) * radius - definition.position[0],
    y,
    Math.sin(angle) * radius - definition.position[2],
  );
}

function makeRibbonGeometry(points: readonly THREE.Vector3[], width: number) {
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
  return geometry;
}

function addRibbon(
  parent: THREE.Object3D,
  name: string,
  points: readonly THREE.Vector3[],
  width: number,
  material: THREE.Material,
) {
  const ribbon = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), material), name);
  ribbon.userData.walkable = true;
  ribbon.userData.navObstacle = false;
  ribbon.userData.secretLabRoad = true;
  ribbon.receiveShadow = true;
  parent.add(ribbon);
  return ribbon;
}

function arcPoints(
  definition: DistrictDefinition,
  radialT: number,
  startT: number,
  endT: number,
  count: number,
  y = FLOOR_Y,
) {
  return Array.from({ length: count }, (_, index) => pointInDistrict(
    definition,
    radialT,
    THREE.MathUtils.lerp(startT, endT, index / Math.max(1, count - 1)),
    y,
  ));
}

function addDistrictInfrastructure(
  district: THREE.Group,
  definition: DistrictDefinition,
  materials: SecretMaterials,
) {
  const infrastructure = new THREE.Group();
  infrastructure.name = 'SECRET__DISTRICT_CONTROLLED_SCIENTIFIC_GRADIENT';
  const bandRecords = [
    ['BIOLOGICAL_ARC', 0.07, materials.paving],
    ['AUTONOMOUS_QUANTUM_ARC', 0.36, materials.darkPaving],
    ['HIGH_RISK_CONTAINMENT_ARC', 0.68, materials.blackBasalt],
  ] as const;
  bandRecords.forEach(([name, radialT, material]) => {
    addRibbon(infrastructure, `SECRET__${name}`, arcPoints(definition, radialT, 0.035, 0.965, 84), 1.05, material);
    addRibbon(infrastructure, `SECRET__${name}__CONTROLLED_LIGHT_SEAM`, arcPoints(definition, radialT, 0.035, 0.965, 84, FLOOR_Y + 0.018), 0.038, radialT < 0.4 ? materials.whiteLight : radialT < 0.7 ? materials.cyanLight : materials.redLight);
  });
  for (const angularT of [0.09, 0.29, 0.50, 0.70, 0.91]) {
    const points = Array.from({ length: 36 }, (_, index) => pointInDistrict(definition, 0.06 + index / 35 * 0.88, angularT));
    addRibbon(infrastructure, `SECRET__RADIAL_PROCESS_ROUTE_${Math.round(angularT * 100)}`, points, 0.72, materials.darkPaving);
  }
  for (let marker = 0; marker < 30; marker += 1) {
    const point = pointInDistrict(definition, marker % 3 === 0 ? 0.07 : marker % 3 === 1 ? 0.36 : 0.68, 0.04 + marker / 32);
    cylinder(infrastructure, `SECRET__SENSOR_FIELD_COLUMN_${marker + 1}`, [0.08, 0.08], 0.62 + (marker % 4) * 0.1, materials.titanium, [point.x, FLOOR_Y, point.z], false, 8);
    ellipsoid(infrastructure, `SECRET__SENSOR_FIELD_APERTURE_${marker + 1}`, [0.12, 0.12, 0.12], marker % 5 === 0 ? materials.whiteLight : materials.ultradarkGlass, [point.x, 0.72 + (marker % 4) * 0.1, point.z]);
  }
  district.add(infrastructure);
  return infrastructure;
}

export function buildSecretLabsDistrict(
  district: THREE.Group,
  definition: DistrictDefinition,
) {
  if (!definition.sector) throw new Error('Secret Labs District requires a masterplan sector');
  const materials = createSecretMaterials();
  const infrastructure = addDistrictInfrastructure(district, definition, materials);
  const facilities = SECRET_LABS_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials);
    const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02);
    building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2]));
    const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize();
    building.rotation.y = Math.atan2(inward.x, inward.z);
    const radius = Math.hypot(worldPosition.x, worldPosition.z);
    const angle = definition.sector!.centerAngle + Math.atan2(
      Math.sin(Math.atan2(worldPosition.z, worldPosition.x) - definition.sector!.centerAngle),
      Math.cos(Math.atan2(worldPosition.z, worldPosition.x) - definition.sector!.centerAngle),
    );
    building.userData.sectorAnchor = {
      radius,
      angle,
      normalizedRadial: (radius - definition.sector!.innerRadius) / (definition.sector!.outerRadius - definition.sector!.innerRadius),
      normalizedAngular: (angle - definition.sector!.startAngle) / (definition.sector!.endAngle - definition.sector!.startAngle),
    };
    district.add(building);
    return building;
  });
  district.userData.secretLabsDistrict = {
    identity: 'The Secret Labs Scientific Gradient',
    architecturalIntent: 'unlimited research funding, extreme confidentiality, precise environmental control, and no public accountability',
    buildingCount: facilities.length,
    buildings: SECRET_LABS_BUILDING_PROGRAM.map((record) => ({
      code: record.code,
      name: record.name,
      publicMapName: record.publicMapName,
      researchFocus: record.researchFocus,
      researchBand: record.researchBand,
      footprintMetres: record.footprintMetres,
      heightMetres: record.heightMetres,
    })),
    researchBands: {
      medicalInterface: ['L1', 'L2', 'L3', 'L4', 'L5'],
      centralAutonomousSystems: ['L6', 'L7', 'L8', 'L9', 'L10'],
      securityInterface: ['L11', 'L12', 'L13', 'L14', 'L15'],
    },
    skyline: ['MNEMOSYNE Neural Continuity Tower', 'CHRONOS tilted ring', 'ORPHEUS obelisk', 'LIMEN paired monoliths'],
    commonPalette: [
      'black basalt',
      'pale bioceramic',
      'brushed titanium',
      'carbon composite',
      'ultradark glass',
      'translucent structural polymer',
      'controlled illumination',
    ],
    conventionalLogos: false,
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: SECRET_LABS_BUILDING_PROGRAM.map((record) => record.name),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + facilities.reduce((sum, facility) => sum + facility.children.length, 0),
    existingRichCampus: true,
    distinct: true,
    secretScientificGradient: true,
    exteriorOnly: true,
  };
}
