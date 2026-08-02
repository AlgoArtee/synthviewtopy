import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type OrganicChemistryBuildingForm =
  | 'exchange'
  | 'cathedral'
  | 'prism'
  | 'meridian'
  | 'conservatory'
  | 'chiral-twin'
  | 'catenane'
  | 'loom'
  | 'reforging'
  | 'atlas';

export interface OrganicChemistryBuildingProgram {
  code: string;
  name: string;
  purpose: string;
  form: OrganicChemistryBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
}

export const ORGANIC_CHEMISTRY_BUILDING_PROGRAM: readonly OrganicChemistryBuildingProgram[] = [
  { code: 'O1', name: 'Autocatalytic Synthesis Exchange', purpose: 'Self-driving synthesis, natural-language robotic chemistry, reaction optimization, and continuous-flow discovery', form: 'exchange', footprintMetres: [180, 88], heightMetres: 48, radialT: 0.43, angularT: 0.29, placementZone: 'Central Synthesis Arc', exteriorMotif: 'reconfigurable laboratory circuit board with an external carrier gallery and Decision Mast' },
  { code: 'O2', name: 'Skeletal Editing Cathedral', purpose: 'Single-atom insertion, deletion, replacement, heteroarene reconstruction, and late-stage skeletal editing', form: 'cathedral', footprintMetres: [112, 88], heightMetres: 88, radialT: 0.48, angularT: 0.07, placementZone: 'Dark vertical landmark on the inner-southern approach', exteriorMotif: 'three cut and reassembled basalt masses pierced by aligned molecular voids' },
  { code: 'O3', name: 'Photon-Electron Catalysis Prism', purpose: 'Photoredox chemistry, electroorganic synthesis, radical catalysis, and continuous-flow photoelectrochemistry', form: 'prism', footprintMetres: [150, 86], heightMetres: 44, radialT: 0.48, angularT: 0.96, placementZone: 'Inorganic Chemistry interface', exteriorMotif: 'dichroic triangular prism with four transparent electrosynthesis towers' },
  { code: 'O4', name: 'Meridian Institute for Selective C-H Activation', purpose: 'Site-selective C-H functionalization, remote bond activation, and catalyst-controlled regioselectivity', form: 'meridian', footprintMetres: [112, 82], heightMetres: 74, radialT: 0.82, angularT: 0.70, placementZone: 'Disciplined outer research terrace', exteriorMotif: 'two related towers altered at a few exact facade sites' },
  { code: 'O5', name: 'Chemoenzymatic Cascade Conservatory', purpose: 'Engineered biocatalysts, chemoenzymatic cascades, photoenzymatic radicals, and hybrid enzyme-metal catalysis', form: 'conservatory', footprintMetres: [146, 108], heightMetres: 42, radialT: 0.12, angularT: 0.14, placementZone: 'Biochemistry-facing inner promenade', exteriorMotif: 'five planted terraces descending through visible water and protein-ribbon systems' },
  { code: 'O6', name: 'Chiral Synthesis Twin', purpose: 'Asymmetric catalysis, stereodivergent synthesis, axial chirality, and radical stereocontrol', form: 'chiral-twin', footprintMetres: [152, 102], heightMetres: 58, radialT: 0.55, angularT: 0.78, placementZone: 'Eastern Synthesis Arc court', exteriorMotif: 'non-superimposable paired wings with opposite helicoidal exhausts' },
  { code: 'O7', name: 'Catenane Forum for Molecular Machines', purpose: 'Molecular motors, mechanically interlocked molecules, dynamic cages, and responsive supramolecular systems', form: 'catenane', footprintMetres: [136, 124], heightMetres: 54, radialT: 0.43, angularT: 0.52, placementZone: 'Principal civic plaza', exteriorMotif: 'three structurally interlocked toroidal volumes with distributed kinetic shading' },
  { code: 'O8', name: 'Organic Photonics and Semiconductor Loom', purpose: 'Organic semiconductors, exciton transport, singlet fission, flexible optoelectronics, and organic photovoltaics', form: 'loom', footprintMetres: [240, 78], heightMetres: 40, radialT: 0.86, angularT: 0.43, placementZone: 'Sun-rich desert-facing southern edge', exteriorMotif: 'long folded photovoltaic ribbon terminating in the Exciton Fin' },
  { code: 'O9', name: 'Circular Carbon Reforging Works', purpose: 'Polymer mechanochemistry, selective depolymerization, plastic upcycling, and biomass-derived aromatic chemistry', form: 'reforging', footprintMetres: [182, 122], heightMetres: 56, radialT: 0.86, angularT: 0.18, placementZone: 'Industrial and particle-physics logistics boundary', exteriorMotif: 'two circular production halls, a mechanical tower, silos, and enclosed conveyors' },
  { code: 'O10', name: 'Atlas of Natural Products and Macrocyclic Space', purpose: 'Natural-product synthesis, macrocycles, cyclic peptides, encoded libraries, and chemical-space discovery', form: 'atlas', footprintMetres: [176, 132], heightMetres: 52, radialT: 0.05, angularT: 0.82, placementZone: 'Biochemistry-facing source-ecology landscape', exteriorMotif: 'nested macrocyclic walls surrounding a perforated Chemical-Space Lantern' },
] as const;

const DISTRICT_ID = 'organic-chemistry-labs';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 16, 12);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_Z = new THREE.Vector3(0, 0, 1);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

type OrganicMaterials = ReturnType<typeof createOrganicMaterials>;

function districtMaterial(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.56, metalness: 0.2, ...options });
  material.name = name;
  return material;
}

function createOrganicMaterials() {
  const basalt = districtMaterial('Organic Chemistry carbon-black basalt composite', '#101417', { roughness: 0.9, metalness: 0.08 });
  const blackCeramic = districtMaterial('Organic Chemistry carbon-black technical ceramic', '#171b20', { roughness: 0.7, metalness: 0.22 });
  const whiteStone = districtMaterial('Organic Chemistry white acid-resistant technical stone', '#e9e9e2', { roughness: 0.42, metalness: 0.04 });
  const warmStone = districtMaterial('Organic Chemistry warm-grey macrocycle stone', '#aaa99f', { roughness: 0.72, metalness: 0.04 });
  const steel = districtMaterial('Organic Chemistry brushed stainless steel', '#aeb8bb', { roughness: 0.26, metalness: 0.9 });
  const titanium = districtMaterial('Organic Chemistry dark titanium structure', '#343c43', { roughness: 0.34, metalness: 0.82 });
  const amberGlass = districtMaterial('Organic Chemistry amber laboratory glass', '#9c5d25', { roughness: 0.18, metalness: 0.3, transparent: true, opacity: 0.78 });
  const violetGlass = districtMaterial('Organic Chemistry violet laboratory glass', '#553a78', { roughness: 0.14, metalness: 0.42, transparent: true, opacity: 0.76 });
  const smokeGlass = districtMaterial('Organic Chemistry smoke-tinted laboratory glass', '#1b2a31', { roughness: 0.13, metalness: 0.48, transparent: true, opacity: 0.82 });
  const clearShell = districtMaterial('Organic Chemistry transparent safety shell', '#c8eff0', { roughness: 0.08, metalness: 0.08, transparent: true, opacity: 0.34, side: THREE.DoubleSide });
  const membrane = districtMaterial('Organic Chemistry replaceable fluoropolymer membrane', '#d8e6dc', { roughness: 0.24, metalness: 0.06, transparent: true, opacity: 0.64, side: THREE.DoubleSide });
  const dichroicCopper = districtMaterial('Organic Chemistry copper-violet dichroic photovoltaic surface', '#b65b62', { roughness: 0.13, metalness: 0.68, emissive: '#32122d', emissiveIntensity: 0.45 });
  const dichroicCyan = districtMaterial('Organic Chemistry cyan-silver dichroic photovoltaic surface', '#50b5bd', { roughness: 0.12, metalness: 0.72, emissive: '#10343b', emissiveIntensity: 0.42 });
  const paving = districtMaterial('Organic Chemistry pale containment paving', '#b9bbb4', { roughness: 0.9, metalness: 0.05 });
  const logistics = districtMaterial('Organic Chemistry shielded logistics paving', '#30383c', { roughness: 0.92, metalness: 0.1 });
  const water = districtMaterial('Organic Chemistry monitored neutralization water', '#173944', { roughness: 0.12, metalness: 0.25, transparent: true, opacity: 0.72 });
  const green = districtMaterial('Organic Chemistry controlled source-ecology planting', '#536c50', { roughness: 0.96, metalness: 0 });
  const recycled = [
    districtMaterial('Organic Chemistry recycled polymer ochre', '#8c6544', { roughness: 0.76, metalness: 0.08 }),
    districtMaterial('Organic Chemistry recycled polymer blue', '#3f6470', { roughness: 0.72, metalness: 0.08 }),
    districtMaterial('Organic Chemistry recycled polymer plum', '#675264', { roughness: 0.72, metalness: 0.08 }),
    districtMaterial('Organic Chemistry recycled polymer pale', '#b0aa91', { roughness: 0.76, metalness: 0.06 }),
  ];
  const amberLight = districtMaterial('Organic Chemistry amber reaction-status light', '#ffd19b', { emissive: '#ff8a31', emissiveIntensity: 2.5, roughness: 0.18, metalness: 0.08 });
  const violetLight = districtMaterial('Organic Chemistry violet charge-transfer light', '#d7b8ff', { emissive: '#8f55ff', emissiveIntensity: 2.6, roughness: 0.16, metalness: 0.08 });
  const cyanLight = districtMaterial('Organic Chemistry cyan photon-transfer light', '#c8fdff', { emissive: '#44e6ff', emissiveIntensity: 2.7, roughness: 0.16, metalness: 0.08 });
  [amberLight, violetLight, cyanLight].forEach((material) => { material.userData.isDistrictAccent = true; });
  return { basalt, blackCeramic, whiteStone, warmStone, steel, titanium, amberGlass, violetGlass, smokeGlass, clearShell, membrane, dichroicCopper, dichroicCyan, paving, logistics, water, green, recycled, amberLight, violetLight, cyanLight };
}

function prepare<T extends THREE.Object3D>(object: T, name: string, obstacle = false) {
  object.name = name;
  object.userData.selectableId = DISTRICT_ID;
  object.userData.districtId = DISTRICT_ID;
  if (object instanceof THREE.Mesh) {
    object.castShadow = obstacle && !(object.material instanceof THREE.Material && object.material.transparent);
    object.receiveShadow = true;
    object.userData.navObstacle = obstacle;
  }
  return object;
}

function box(parent: THREE.Object3D, name: string, size: readonly [number, number, number], material: THREE.Material, position: readonly [number, number, number], obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(UNIT_BOX, material), name, obstacle);
  mesh.scale.set(...size); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function cylinder(parent: THREE.Object3D, name: string, diameter: number, height: number, material: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 24, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const geometry = segments === 12 ? UNIT_CYLINDER_12 : UNIT_CYLINDER_24;
  const mesh = prepare(new THREE.Mesh(geometry, material), name, obstacle);
  mesh.scale.set(diameter, height, diameter); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function taperedCylinder(parent: THREE.Object3D, name: string, bottomDiameter: number, topDiameter: number, height: number, material: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 16, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(new THREE.CylinderGeometry(topDiameter * 0.5, bottomDiameter * 0.5, height, segments), material), name, obstacle);
  mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function sphere(parent: THREE.Object3D, name: string, scale: readonly [number, number, number], material: THREE.Material, position: readonly [number, number, number], obstacle = false) {
  const mesh = prepare(new THREE.Mesh(UNIT_SPHERE, material), name, obstacle);
  mesh.scale.set(...scale); mesh.position.set(...position); parent.add(mesh); return mesh;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, material: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0], arc = Math.PI * 2, obstacle = false) {
  const key = `${radius.toFixed(3)}:${tube.toFixed(3)}:${arc.toFixed(3)}`;
  let geometry = TORUS_CACHE.get(key);
  if (!geometry) { geometry = new THREE.TorusGeometry(radius, tube, 8, 40, arc); TORUS_CACHE.set(key, geometry); }
  const mesh = prepare(new THREE.Mesh(geometry, material), name, obstacle);
  mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function pipe(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material, obstacle = false) {
  const vector = end.clone().sub(start);
  const mesh = prepare(new THREE.Mesh(UNIT_CYLINDER_12, material), name, obstacle);
  mesh.position.copy(start).add(end).multiplyScalar(0.5); mesh.scale.set(radius * 2, vector.length(), radius * 2); mesh.quaternion.setFromUnitVectors(UNIT_Y, vector.normalize()); parent.add(mesh); return mesh;
}

function slabBetween(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, width: number, height: number, material: THREE.Material, obstacle = false) {
  const vector = end.clone().sub(start);
  const mesh = prepare(new THREE.Mesh(UNIT_BOX, material), name, obstacle);
  mesh.position.copy(start).add(end).multiplyScalar(0.5); mesh.scale.set(width, height, vector.length()); mesh.quaternion.setFromUnitVectors(UNIT_Z, vector.normalize()); parent.add(mesh); return mesh;
}

function pulse<T extends THREE.Object3D>(object: T, speed: number, phase = 0, minIntensity = 0.2, maxIntensity = 4) {
  object.userData.animate = 'organic-chemistry-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate<T extends THREE.Object3D>(object: T, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'organic-chemistry-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function sway<T extends THREE.Object3D>(object: T, phase: number, amplitude = 0.18) {
  object.userData.animate = 'organic-chemistry-sway'; object.userData.phase = phase; object.userData.amplitude = amplitude; object.userData.baseRotationY = object.rotation.y; return object;
}

function orbit<T extends THREE.Object3D>(object: T, centerX: number, centerZ: number, radiusX: number, radiusZ: number, speed: number, phase = 0) {
  object.userData.animate = 'organic-chemistry-orbit'; object.userData.centerX = centerX; object.userData.centerZ = centerZ; object.userData.radiusX = radiusX; object.userData.radiusZ = radiusZ; object.userData.baseY = object.position.y; object.userData.speed = speed; object.userData.phase = phase; return object;
}

function addContainmentPlinth(root: THREE.Group, code: string, width: number, depth: number, m: OrganicMaterials) {
  box(root, `ORGCHEM__${code}__ELEVATED_CONTAINMENT_PLINTH`, [width, 0.22, depth], m.basalt, [0, 0.11, 0], true);
  const y = 0.235;
  box(root, `ORGCHEM__${code}__DRAINAGE_CHANNEL_NORTH`, [width + 0.35, 0.045, 0.09], m.water, [0, y, -depth * 0.5 - 0.12]);
  box(root, `ORGCHEM__${code}__DRAINAGE_CHANNEL_SOUTH`, [width + 0.35, 0.045, 0.09], m.water, [0, y, depth * 0.5 + 0.12]);
  box(root, `ORGCHEM__${code}__DRAINAGE_CHANNEL_WEST`, [0.09, 0.045, depth], m.water, [-width * 0.5 - 0.12, y, 0]);
  box(root, `ORGCHEM__${code}__DRAINAGE_CHANNEL_EAST`, [0.09, 0.045, depth], m.water, [width * 0.5 + 0.12, y, 0]);
  for (let pylon = 0; pylon < 4; pylon += 1) {
    const x = pylon < 2 ? -width * 0.46 : width * 0.46;
    const z = pylon % 2 ? -depth * 0.43 : depth * 0.43;
    box(root, `ORGCHEM__${code}__REMOTE_FIRE_SUPPRESSION_PYLON_${pylon + 1}`, [0.1, 0.82, 0.1], m.titanium, [x, 0.63, z]);
    pulse(sphere(root, `ORGCHEM__${code}__WIND_STATUS_BEACON_${pylon + 1}`, [0.095, 0.095, 0.095], pylon % 2 ? m.amberLight.clone() : m.cyanLight.clone(), [x, 1.08, z]), 0.009, pylon * 0.7);
  }
}

function createAutocatalyticExchange(m: OrganicMaterials) {
  const root = new THREE.Group(); root.name = 'ORGCHEM__O1__AUTOCATALYTIC_SYNTHESIS_EXCHANGE'; addContainmentPlinth(root, 'O1', 18.6, 9.0, m);
  box(root, 'ORGCHEM__O1__BLACK_TITANIUM_STRUCTURAL_SPINE', [16.8, 4.55, 5.25], m.titanium, [0, 2.5, -0.35], true);
  for (let module = 0; module < 40; module += 1) {
    const level = Math.floor(module / 10); const column = module % 10; const side = module % 2 ? 1 : -1;
    const material = [m.whiteStone, m.amberGlass, m.membrane, m.steel][module % 4];
    const x = -7.4 + column * 1.64; const y = 0.9 + level * 1.03; const z = side * (2.65 + (module % 3) * 0.18) - 0.35;
    box(root, `ORGCHEM__O1__RECONFIGURABLE_FACADE_MODULE_${String(module + 1).padStart(2, '0')}`, [1.28, 0.78, 0.46 + (module % 3) * 0.12], material, [x, y, z]);
    pulse(box(root, `ORGCHEM__O1__MODULE_STATUS_STRIP_${String(module + 1).padStart(2, '0')}`, [0.92, 0.045, 0.035], module % 5 === 0 ? m.amberLight.clone() : m.cyanLight.clone(), [x, y - 0.28, z + side * 0.34]), 0.012, module * 0.21);
  }
  box(root, 'ORGCHEM__O1__TRANSPARENT_EXTERNAL_TRANSPORT_GALLERY', [15.6, 0.7, 0.85], m.clearShell, [0, 4.42, 3.15]);
  for (let node = 0; node < 5; node += 1) torus(root, `ORGCHEM__O1__FLOW_SWITCHING_NODE_${node + 1}`, 0.5, 0.09, m.steel, [-6.2 + node * 3.1, 4.42, 3.15], [0, 0, 0]);
  for (let carrier = 0; carrier < 6; carrier += 1) {
    const item = box(root, `ORGCHEM__O1__AUTONOMOUS_GALLERY_CARRIER_${carrier + 1}`, [0.42, 0.28, 0.3], carrier % 2 ? m.amberLight.clone() : m.cyanLight.clone(), [-6.7 + carrier * 2.5, 4.42, 3.15]);
    orbit(item, 0, 3.15, 7.1, 0.01, 0.026, carrier / 6);
  }
  for (let unit = 0; unit < 12; unit += 1) cylinder(root, `ORGCHEM__O1__ROOF_MECHANICAL_PROCESS_UNIT_${unit + 1}`, 0.52 + (unit % 3) * 0.16, 0.7 + (unit % 4) * 0.22, unit % 2 ? m.steel : m.blackCeramic, [-7.1 + unit * 1.28, 5.25 + (unit % 4) * 0.11, -1.2 + (unit % 3) * 1.05], false, 12);
  cylinder(root, 'ORGCHEM__O1__DECISION_MAST', 0.32, 5.2, m.titanium, [0, 7.45, -0.2], false, 12);
  for (let band = 0; band < 12; band += 1) pulse(torus(root, `ORGCHEM__O1__DECISION_MAST_CAMPAIGN_BAND_${band + 1}`, 0.22, 0.025, band % 3 ? m.cyanLight.clone() : m.amberLight.clone(), [0, 5.2 + band * 0.39, -0.2]), 0.015, band * 0.34);
  box(root, 'ORGCHEM__O1__REACTION_NETWORK_ENTRY_CANTILEVER', [7.2, 0.34, 3.1], m.whiteStone, [0, 3.35, 4.15]);
  for (let route = 0; route < 7; route += 1) slabBetween(root, `ORGCHEM__O1__ENTRY_REACTION_LINE_${route + 1}`, new THREE.Vector3(-2.7 + route * 0.9, 3.14, 2.75), new THREE.Vector3(-3.4 + route * 1.13, 3.14, 5.25), 0.035, 0.035, route % 2 ? m.cyanLight.clone() : m.amberLight.clone());
  return root;
}

function createSkeletalCathedral(m: OrganicMaterials) {
  const root = new THREE.Group(); root.name = 'ORGCHEM__O2__SKELETAL_EDITING_CATHEDRAL'; addContainmentPlinth(root, 'O2', 11.4, 9.0, m);
  box(root, 'ORGCHEM__O2__REASSEMBLED_BASALT_MASS_MAIN', [4.9, 8.8, 6.6], m.blackCeramic, [-0.3, 4.62, -0.45], true, [0, -0.05, 0.018]);
  box(root, 'ORGCHEM__O2__REASSEMBLED_BASALT_MASS_WEST', [2.65, 6.8, 5.3], m.basalt, [-4.1, 3.58, 0.45], true, [0, 0.08, -0.045]);
  box(root, 'ORGCHEM__O2__REASSEMBLED_BASALT_MASS_EAST', [2.4, 7.45, 5.0], m.titanium, [3.65, 3.95, -0.1], true, [0, -0.11, 0.052]);
  for (let fissure = 0; fissure < 18; fissure += 1) {
    const side = fissure % 3 - 1; const y = 0.9 + Math.floor(fissure / 3) * 1.18; const width = 0.08 + (fissure % 5) * 0.035;
    pulse(box(root, `ORGCHEM__O2__AMBER_BOND_FISSURE_${fissure + 1}`, [width, 0.78 + (fissure % 3) * 0.28, 0.05], m.amberLight.clone(), [side * 3.75 + Math.sin(fissure) * 0.45, y, 3.06 - Math.abs(side) * 0.48]), 0.008, fissure * 0.41);
  }
  const voids = [[-0.6, 6.4, 0, 1.25], [3.5, 5.4, 0.1, 0.92], [-3.9, 4.65, 0.45, 0.76]] as const;
  voids.forEach(([x, y, z, radius], index) => torus(root, `ORGCHEM__O2__MOLECULAR_VOID_FRAME_${index + 1}`, radius, 0.2, index === 0 ? m.steel : m.titanium, [x, y, 3.18 + z], [0, 0, 0]));
  for (let bridge = 0; bridge < 4; bridge += 1) slabBetween(root, `ORGCHEM__O2__INSERTED_TRANSFER_BRIDGE_${bridge + 1}`, new THREE.Vector3(-3.0, 3.1 + bridge * 1.05, -0.4), new THREE.Vector3(2.65, 3.35 + bridge * 0.91, -0.1), 0.36, 0.32, bridge % 2 ? m.smokeGlass : m.steel);
  for (let relief = 0; relief < 30; relief += 1) {
    const angle = relief * 0.71; const radius = 0.8 + (relief % 6) * 0.42; const x = Math.cos(angle) * radius; const y = 1.25 + Math.sin(angle) * radius * 0.35 + Math.floor(relief / 10) * 1.4;
    const node = cylinder(root, `ORGCHEM__O2__EDITABLE_FORMULA_NODE_${relief + 1}`, 0.19 + (relief % 4) * 0.05, 0.08, relief % 7 === 0 ? m.amberLight.clone() : m.steel, [x, y, 3.19], false, 12, [Math.PI / 2, 0, 0]);
    if (relief % 5 === 0) rotate(node, 0.08, 'z');
  }
  for (let stack = 0; stack < 3; stack += 1) {
    const x = -2.7 + stack * 2.7; const base = new THREE.Vector3(x - 0.35, 8.2 - stack * 0.65, -1.2); const split = new THREE.Vector3(x + 0.35, 8.2 - stack * 0.65, -1.2); const top = new THREE.Vector3(x, 10.0 - stack * 0.35, -1.2);
    pipe(root, `ORGCHEM__O2__CONVERGENT_EXHAUST_LEFT_${stack + 1}`, base, top, 0.12, m.blackCeramic); pipe(root, `ORGCHEM__O2__CONVERGENT_EXHAUST_RIGHT_${stack + 1}`, split, top, 0.12, m.steel);
  }
  for (let ring = 0; ring < 7; ring += 1) torus(root, `ORGCHEM__O2__DISPLACED_ENTRY_PLAZA_RING_${ring + 1}`, 0.9 + ring * 0.5, 0.035, ring % 3 === 0 ? m.steel : m.paving, [0.25 * (ring % 2), 0.28, 5.1 + 0.12 * ring]);
  return root;
}

function createPhotonElectronPrism(m: OrganicMaterials) {
  const root = new THREE.Group(); root.name = 'ORGCHEM__O3__PHOTON_ELECTRON_CATALYSIS_PRISM'; addContainmentPlinth(root, 'O3', 15.4, 8.8, m);
  const shell = prepare(new THREE.Mesh(new THREE.CylinderGeometry(4.05, 4.05, 13.3, 3), m.smokeGlass), 'ORGCHEM__O3__TRIANGULAR_PHOTOELECTRON_PRISM', true);
  shell.rotation.z = Math.PI / 2; shell.position.set(-0.7, 3.55, -0.5); root.add(shell);
  for (let fin = 0; fin < 60; fin += 1) {
    const x = -6.7 + fin * 0.22; const y = 1.4 + (fin % 3) * 0.19; const z = 3.05 + Math.sin(fin * 0.31) * 0.12;
    const blade = box(root, `ORGCHEM__O3__DICHROIC_LIGHT_HARVESTING_FIN_${fin + 1}`, [0.1, 3.8, 0.42], fin % 2 ? m.dichroicCopper : m.dichroicCyan, [x, y, z], false, [0, (fin % 7 - 3) * 0.045, -0.12]);
    sway(blade, fin * 0.21, 0.06);
  }
  for (let trunk = 0; trunk < 7; trunk += 1) {
    const x = -5.7 + trunk * 1.85; pipe(root, `ORGCHEM__O3__VISIBLE_ENERGY_TRUNK_${trunk + 1}`, new THREE.Vector3(x, 0.6, 3.42), new THREE.Vector3(x + 0.35, 5.45, 2.15), 0.08, trunk % 2 ? m.titanium : m.steel);
  }
  for (let tower = 0; tower < 4; tower += 1) {
    const x = -5.25 + tower * 3.5;
    cylinder(root, `ORGCHEM__O3__TRANSPARENT_ELECTROSYNTHESIS_TOWER_${tower + 1}`, 1.85, 5.2 + tower * 0.38, m.clearShell, [x, 2.9 + tower * 0.19, -4.0], true, 24);
    for (let plate = 0; plate < 5; plate += 1) box(root, `ORGCHEM__O3__PAIRED_ELECTRODE_PLATE_${tower + 1}_${plate + 1}`, [1.22, 0.07, 0.7], plate % 2 ? m.dichroicCopper : m.dichroicCyan, [x, 0.85 + plate * 0.86, -4.0]);
    pulse(box(root, `ORGCHEM__O3__TOWER_CHARGE_STATUS_${tower + 1}`, [0.08, 4.2, 0.06], tower % 2 ? m.violetLight.clone() : m.cyanLight.clone(), [x + 0.88, 2.9, -3.55]), 0.016, tower * 0.6);
  }
  box(root, 'ORGCHEM__O3__ENCLOSED_PARALLEL_PIPE_BRIDGE', [12.4, 0.72, 0.82], m.clearShell, [0, 4.55, -2.75]);
  for (let pipeIndex = 0; pipeIndex < 6; pipeIndex += 1) box(root, `ORGCHEM__O3__PHOTOELECTROCHEMICAL_PIPE_${pipeIndex + 1}`, [11.9, 0.055, 0.055], pipeIndex % 2 ? m.cyanLight.clone() : m.violetLight.clone(), [0, 4.36 + pipeIndex * 0.075, -2.78]);
  for (let collector = 0; collector < 12; collector += 1) {
    const x = -5.5 + (collector % 6) * 2.2; const z = -1.45 + Math.floor(collector / 6) * 1.7;
    const mirror = sphere(root, `ORGCHEM__O3__ROBOTIC_HELIOSTAT_PETAL_${collector + 1}`, [0.68, 0.08, 0.42], collector % 2 ? m.dichroicCyan : m.dichroicCopper, [x, 6.25, z]); rotate(mirror, 0.006 + collector * 0.0002, 'y');
  }
  for (let disk = 0; disk < 18; disk += 1) cylinder(root, `ORGCHEM__O3__ORBITAL_ENTRY_CANOPY_DISK_${disk + 1}`, 0.62 + (disk % 3) * 0.18, 0.07, disk % 2 ? m.amberGlass : m.violetGlass, [-4.4 + (disk % 6) * 1.75, 2.75 + Math.sin(disk) * 0.18, 4.25 + Math.floor(disk / 6) * 0.55], false, 24);
  return root;
}

function createMeridianInstitute(m: OrganicMaterials) {
  const root = new THREE.Group(); root.name = 'ORGCHEM__O4__MERIDIAN_SELECTIVE_C_H_ACTIVATION'; addContainmentPlinth(root, 'O4', 11.6, 8.4, m);
  box(root, 'ORGCHEM__O4__LOW_SELECTIVE_ACTIVATION_BASE', [10.1, 2.0, 5.9], m.titanium, [0, 1.22, -0.1], true);
  box(root, 'ORGCHEM__O4__STRAIGHT_MERIDIAN_TOWER', [3.25, 6.8, 3.7], m.whiteStone, [-2.35, 4.55, -0.6], true);
  const rotated = box(root, 'ORGCHEM__O4__ROTATING_MERIDIAN_TOWER', [3.25, 7.5, 3.7], m.whiteStone, [2.4, 4.9, -0.3], true, [0, 0.22, -0.035]);
  rotated.userData.designRotationDegrees = 40;
  for (let tower = 0; tower < 2; tower += 1) for (let row = 0; row < 8; row += 1) for (let column = 0; column < 4; column += 1) {
    const selected = (tower === 0 && ((row === 2 && column === 1) || (row === 6 && column === 3))) || (tower === 1 && ((row === 1 && column === 2) || (row === 5 && column === 0) || (row === 7 && column === 3)));
    const x = (tower ? 2.4 : -2.35) - 1.15 + column * 0.76; const y = 1.55 + row * 0.73; const z = 1.55;
    box(root, `ORGCHEM__O4__${selected ? 'SELECTIVELY_FUNCTIONALIZED' : 'BLANK'}_FACADE_PANEL_${tower + 1}_${row + 1}_${column + 1}`, [0.55, 0.43, selected ? 0.42 : 0.08], selected ? (row % 2 ? m.amberGlass : m.violetGlass) : m.warmStone, [x, y, z]);
    if (selected) pulse(box(root, `ORGCHEM__O4__SELECTED_SITE_LIGHT_${tower + 1}_${row + 1}_${column + 1}`, [0.36, 0.05, 0.04], row % 2 ? m.amberLight.clone() : m.violetLight.clone(), [x, y, z + 0.24]), 0.01, row + column);
  }
  for (let fin = 0; fin < 22; fin += 1) {
    const tower = fin < 11 ? -1 : 1; const local = fin % 11; const reversed = [3, 7, 9].includes(local); const blade = box(root, `ORGCHEM__O4__${reversed ? 'REVERSED' : 'DIRECTIONAL'}_SOLAR_FIN_${fin + 1}`, [0.12, 4.8, 0.52], reversed ? m.titanium : m.steel, [tower * 4.05, 4.25, -2.05 + local * 0.4], false, [0, reversed ? -0.55 : -0.12 + local * 0.025, 0]); sway(blade, fin * 0.3, reversed ? 0.05 : 0.025);
  }
  slabBetween(root, 'ORGCHEM__O4__TARGETING_MERIDIAN_SEAM', new THREE.Vector3(-4.9, 0.3, 3.15), new THREE.Vector3(3.5, 8.2, 1.8), 0.075, 0.075, m.titanium);
  for (let stack = 0; stack < 9; stack += 1) {
    cylinder(root, `ORGCHEM__O4__UNEQUAL_EXHAUST_NEEDLE_${stack + 1}`, 0.12, 1.1 + (stack % 4) * 0.32, m.steel, [-4.0 + stack, 2.75 + (stack % 4) * 0.16, -1.7], false, 12);
    pulse(torus(root, `ORGCHEM__O4__EXHAUST_WIND_COLLAR_${stack + 1}`, 0.1, 0.022, m.cyanLight.clone(), [-4.0 + stack, 3.1 + (stack % 4) * 0.32, -1.7]), 0.008, stack * 0.4);
  }
  box(root, 'ORGCHEM__O4__DEEP_CENTRAL_ENTRY_RECESS', [2.0, 3.2, 0.38], m.smokeGlass, [0, 1.92, 3.08]);
  taperedCylinder(root, 'ORGCHEM__O4__SUSPENDED_CATALYST_POINTER', 0.5, 0.08, 1.8, m.steel, [0, 3.72, 3.2], false, 12, [0, 0, Math.PI]);
  return root;
}

function createCascadeConservatory(m: OrganicMaterials) {
  const root = new THREE.Group(); root.name = 'ORGCHEM__O5__CHEMOENZYMATIC_CASCADE_CONSERVATORY'; addContainmentPlinth(root, 'O5', 15.0, 11.0, m);
  for (let terrace = 0; terrace < 5; terrace += 1) {
    const width = 13.6 - terrace * 1.5; const depth = 8.8 - terrace * 0.85; const y = 0.75 + terrace * 0.72; const z = -1.0 - terrace * 0.42;
    box(root, `ORGCHEM__O5__DESCENDING_CASCADE_VOLUME_${terrace + 1}`, [width, 1.12, depth], terrace % 2 ? m.membrane : m.whiteStone, [0, y, z], true);
    box(root, `ORGCHEM__O5__BOUNDED_CELLULAR_GREEN_ROOF_${terrace + 1}`, [width * 0.82, 0.08, depth * 0.7], m.green, [0, y + 0.6, z]);
  }
  for (let ribbon = 0; ribbon < 34; ribbon += 1) {
    const side = ribbon % 2 ? 1 : -1; const z = -4.2 + (ribbon % 17) * 0.53; const y = 1.0 + (ribbon % 5) * 0.56; const x = side * (5.7 - Math.floor(ribbon / 17) * 0.65);
    const blade = box(root, `ORGCHEM__O5__PROTEIN_RIBBON_SHADE_${ribbon + 1}`, [0.12, 1.0 + (ribbon % 3) * 0.28, 0.62], ribbon % 5 === 0 ? m.amberGlass : m.membrane, [x, y, z], false, [0.08 * Math.sin(ribbon), side * (0.18 + ribbon * 0.004), 0.22 * Math.cos(ribbon * 0.7)]); sway(blade, ribbon * 0.2, 0.07);
  }
  for (let channel = 0; channel < 8; channel += 1) {
    const x = -5.0 + channel * 1.42; slabBetween(root, `ORGCHEM__O5__VISIBLE_RAINWATER_CASCADE_${channel + 1}`, new THREE.Vector3(x, 4.2 - (channel % 3) * 0.25, -4.8), new THREE.Vector3(x + 0.35, 0.3, 4.65), 0.1, 0.06, m.water);
  }
  for (let sail = 0; sail < 3; sail += 1) {
    const x = -3.1 + sail * 3.1; taperedCylinder(root, `ORGCHEM__O5__COFACTOR_SAIL_${sail + 1}`, 1.05, 0.32, 4.6 + sail * 0.5, m.membrane, [x, 5.55 + sail * 0.25, -3.3], false, 16, [0, 0, sail % 2 ? -0.12 : 0.12]);
    rotate(torus(root, `ORGCHEM__O5__COFACTOR_SAIL_VENT_${sail + 1}`, 0.48, 0.07, m.steel, [x, 7.7 + sail * 0.5, -3.3], [Math.PI / 2, 0, 0]), 0.025 + sail * 0.006, 'y');
  }
  for (let basin = 0; basin < 5; basin += 1) box(root, `ORGCHEM__O5__PLANTED_SETTLING_BASIN_${basin + 1}`, [2.0 - basin * 0.16, 0.08, 0.8], basin % 2 ? m.water : m.green, [-4.2 + basin * 2.1, 0.3, 5.7]);
  for (let plate = 0; plate < 5; plate += 1) box(root, `ORGCHEM__O5__OVERLAPPING_ENTRY_CANOPY_PLATE_${plate + 1}`, [5.6 - plate * 0.55, 0.11, 1.35], plate % 2 ? m.whiteStone : m.membrane, [0, 2.25 + plate * 0.16, 4.15 + plate * 0.38]);
  return root;
}

function createChiralTwin(m: OrganicMaterials) {
  const root = new THREE.Group(); root.name = 'ORGCHEM__O6__CHIRAL_SYNTHESIS_TWIN'; addContainmentPlinth(root, 'O6', 15.6, 10.4, m);
  box(root, 'ORGCHEM__O6__NORTHERN_ENANTIOMER_WING', [6.2, 5.75, 7.4], m.whiteStone, [-4.2, 3.05, -0.35], true, [0, 0.09, -0.025]);
  box(root, 'ORGCHEM__O6__SOUTHERN_ENANTIOMER_WING', [6.2, 5.75, 7.4], m.smokeGlass, [4.2, 3.05, -0.35], true, [0, -0.09, 0.025]);
  for (let wing = 0; wing < 2; wing += 1) for (let fin = 0; fin < 24; fin += 1) {
    const sign = wing ? 1 : -1; const row = Math.floor(fin / 8); const column = fin % 8; const x = sign * (1.5 + column * 0.72); const y = 1.25 + row * 1.55; const z = 3.45 + Math.sin((column / 7) * Math.PI) * 0.55;
    box(root, `ORGCHEM__O6__${wing ? 'RIGHT_HANDED' : 'LEFT_HANDED'}_FACADE_RECESS_${fin + 1}`, [0.45, 0.78, 0.32 + column * 0.03], wing ? (fin % 3 ? m.whiteStone : m.amberGlass) : (fin % 3 ? m.smokeGlass : m.violetGlass), [x, y, z], false, [0, sign * (0.06 + column * 0.025), sign * row * 0.025]);
  }
  for (let step = 0; step < 14; step += 1) {
    const angle = step * 0.52; const y = 0.65 + step * 0.33;
    for (const sign of [-1, 1]) box(root, `ORGCHEM__O6__${sign < 0 ? 'COUNTERCLOCKWISE' : 'CLOCKWISE'}_EXTERNAL_STAIR_${step + 1}`, [1.1, 0.08, 0.38], m.steel, [sign * (6.7 + Math.cos(angle) * 0.48), y, -0.3 + Math.sin(angle) * sign * 1.15], false, [0, -angle * sign, 0]);
  }
  const leftBridge = torus(root, 'ORGCHEM__O6__SMOOTH_CHIRAL_SKYBRIDGE', 3.3, 0.28, m.clearShell, [0, 4.45, -0.5], [0, 0, 0], Math.PI);
  leftBridge.rotation.z = Math.PI;
  slabBetween(root, 'ORGCHEM__O6__ANGULAR_CHIRAL_SKYBRIDGE_LEFT', new THREE.Vector3(-3.1, 3.5, 0.4), new THREE.Vector3(0, 4.1, -0.2), 0.48, 0.42, m.titanium);
  slabBetween(root, 'ORGCHEM__O6__ANGULAR_CHIRAL_SKYBRIDGE_RIGHT', new THREE.Vector3(0, 4.1, -0.2), new THREE.Vector3(3.1, 3.5, 0.4), 0.48, 0.42, m.titanium);
  box(root, 'ORGCHEM__O6__CHIRAL_REFLECTING_CHANNEL', [1.0, 0.06, 8.6], m.water, [0, 0.28, 0.55]);
  for (let seam = 0; seam < 14; seam += 1) slabBetween(root, `ORGCHEM__O6__ZIGZAG_HANDED_SEAM_${seam + 1}`, new THREE.Vector3(seam % 2 ? -0.2 : 0.2, 0.33, -3.5 + seam * 0.55), new THREE.Vector3(seam % 2 ? 0.2 : -0.2, 0.33, -2.95 + seam * 0.55), 0.035, 0.03, m.steel);
  for (const [sign, label] of [[-1, 'LEFT'], [1, 'RIGHT']] as const) {
    for (let turn = 0; turn < 18; turn += 1) {
      const a = turn * 0.52 * sign; const b = (turn + 1) * 0.52 * sign; const baseX = sign * 4.2; const y = 5.8 + turn * 0.18;
      pipe(root, `ORGCHEM__O6__${label}_HELICOIDAL_EXHAUST_${turn + 1}`, new THREE.Vector3(baseX + Math.cos(a) * 0.52, y, -0.6 + Math.sin(a) * 0.52), new THREE.Vector3(baseX + Math.cos(b) * 0.52, y + 0.18, -0.6 + Math.sin(b) * 0.52), 0.06, turn % 4 === 0 ? m.amberLight.clone() : m.steel);
    }
  }
  return root;
}

function createCatenaneForum(m: OrganicMaterials) {
  const root = new THREE.Group(); root.name = 'ORGCHEM__O7__CATENANE_FORUM_MOLECULAR_MACHINES'; addContainmentPlinth(root, 'O7', 14.2, 12.8, m);
  const ringA = torus(root, 'ORGCHEM__O7__BROAD_FLATTENED_CATENANE_RING', 4.1, 0.72, m.titanium, [-1.7, 4.2, 0], [0.2, 0.45, 0.05], Math.PI * 2, true);
  const ringB = torus(root, 'ORGCHEM__O7__VERTICALLY_ELONGATED_CATENANE_RING', 3.65, 0.55, m.steel, [1.9, 4.35, 0.1], [0.05, -0.58, Math.PI / 2], Math.PI * 2, true);
  const ringC = torus(root, 'ORGCHEM__O7__FACETED_TWELVE_SECTION_CATENANE_RING', 3.85, 0.48, m.blackCeramic, [0.2, 4.7, -0.3], [Math.PI / 2, 0.2, 0.3], Math.PI * 2, true);
  [ringA, ringB, ringC].forEach((ring, index) => sway(ring, index * 1.7, 0.018));
  for (let ring = 0; ring < 3; ring += 1) for (let strip = 0; strip < 36; strip += 1) {
    const angle = strip * Math.PI * 2 / 36; const radius = [4.1, 3.65, 3.85][ring]; const centerX = [-1.7, 1.9, 0.2][ring]; const centerY = [4.2, 4.35, 4.7][ring];
    const x = centerX + Math.cos(angle) * radius; const y = centerY + Math.sin(angle) * radius; const z = -0.3 + Math.sin(angle * (ring + 1)) * 0.25;
    const stripObject = box(root, `ORGCHEM__O7__KINETIC_WOVEN_ENVELOPE_${ring + 1}_${strip + 1}`, [0.12, 0.58, 0.22], strip % 5 === 0 ? m.amberGlass : strip % 2 ? m.steel : m.titanium, [x, y, z], false, [0, angle, angle]);
    sway(stripObject, strip * 0.18 + ring, 0.22);
  }
  for (let node = 0; node < 6; node += 1) {
    const angle = node * Math.PI / 3; const x = Math.cos(angle) * 4.7; const z = Math.sin(angle) * 4.7;
    sphere(root, `ORGCHEM__O7__GLAZED_MECHANICAL_NODE_${node + 1}`, [0.85, 0.65, 0.85], m.clearShell, [x, 1.2 + (node % 2) * 2.3, z]);
    rotate(torus(root, `ORGCHEM__O7__VISIBLE_ACTUATOR_GEAR_${node + 1}`, 0.42, 0.1, node % 2 ? m.violetLight.clone() : m.amberLight.clone(), [x, 1.2 + (node % 2) * 2.3, z], [Math.PI / 2, 0, 0]), node % 2 ? 0.07 : -0.06, 'y');
  }
  for (let terrace = 0; terrace < 5; terrace += 1) torus(root, `ORGCHEM__O7__MECHANICAL_BOND_COURT_TERRACE_${terrace + 1}`, 1.3 + terrace * 0.68, 0.11, terrace % 2 ? m.paving : m.water, [0, 0.3 + terrace * 0.012, 0]);
  for (let sculpture = 0; sculpture < 16; sculpture += 1) {
    const angle = sculpture * Math.PI * 2 / 16; const start = new THREE.Vector3(Math.cos(angle) * 5.1, 0.3, Math.sin(angle) * 5.1); const end = new THREE.Vector3(Math.cos(angle + 0.2) * 5.45, 1.25 + (sculpture % 4) * 0.3, Math.sin(angle + 0.2) * 5.45);
    const reed = pipe(root, `ORGCHEM__O7__TENSION_LINKED_REED_SCULPTURE_${sculpture + 1}`, start, end, 0.035, m.steel); sway(reed, sculpture * 0.3, 0.12);
  }
  return root;
}

function createPhotonicsLoom(m: OrganicMaterials) {
  const root = new THREE.Group(); root.name = 'ORGCHEM__O8__ORGANIC_PHOTONICS_SEMICONDUCTOR_LOOM'; addContainmentPlinth(root, 'O8', 24.4, 8.2, m);
  box(root, 'ORGCHEM__O8__LONG_LOW_PHOTONICS_HALL', [22.8, 3.35, 6.7], m.blackCeramic, [-0.4, 1.9, -0.2], true);
  for (let fold = 0; fold < 22; fold += 1) {
    const x = -11.1 + fold * 1.02; const height = 0.35 + (fold % 5) * 0.12;
    const roof = box(root, `ORGCHEM__O8__SAWTOOTH_PHOTOVOLTAIC_ROOF_${fold + 1}`, [0.95, 0.12, 6.6], fold % 2 ? m.dichroicCyan : m.dichroicCopper, [x, 3.6 + height * 0.5, -0.2], false, [0, 0, fold % 2 ? 0.18 : -0.12]); sway(roof, fold * 0.17, 0.012);
  }
  for (let ribbon = 0; ribbon < 96; ribbon += 1) {
    const horizontal = ribbon < 48; const index = ribbon % 48; const material = [m.blackCeramic, m.steel, m.membrane, m.dichroicCopper, m.dichroicCyan][ribbon % 5];
    if (horizontal) box(root, `ORGCHEM__O8__HORIZONTAL_POLYMER_RIBBON_${index + 1}`, [22.2, 0.075 + (index % 3) * 0.035, 0.12], material, [-0.4, 0.55 + index * 0.06, 3.2 + Math.sin(index * 0.5) * 0.12]);
    else {
      const blade = box(root, `ORGCHEM__O8__VERTICAL_POLYMER_RIBBON_${index + 1}`, [0.08 + (index % 4) * 0.025, 2.75, 0.14], material, [-11.0 + index * 0.46, 1.9, 3.28], false, [0, (index % 7 - 3) * 0.035, 0]); sway(blade, index * 0.15, 0.07);
    }
  }
  for (let mast = 0; mast < 16; mast += 1) {
    const x = -9.7 + mast * 1.3; cylinder(root, `ORGCHEM__O8__OPTICAL_TEST_MAST_${mast + 1}`, 0.12, 2.2 + (mast % 4) * 0.45, m.steel, [x, 1.35 + (mast % 4) * 0.225, -4.7], false, 12);
    const panel = box(root, `ORGCHEM__O8__FLEXIBLE_TEST_SURFACE_${mast + 1}`, [0.8, 1.1, 0.08], mast % 2 ? m.dichroicCyan : m.dichroicCopper, [x, 2.2 + (mast % 4) * 0.45, -4.65], false, [0, -0.3 + mast * 0.04, 0]); rotate(panel, 0.004 + mast * 0.0002, 'y');
  }
  box(root, 'ORGCHEM__O8__EXCITON_FIN', [1.15, 7.2, 5.8], m.dichroicCyan, [11.05, 3.85, -0.2], true, [0, -0.08, -0.1]);
  for (let lamella = 0; lamella < 28; lamella += 1) pulse(box(root, `ORGCHEM__O8__EXCITON_FIN_LAMELLA_${lamella + 1}`, [1.35, 0.065, 5.95], lamella % 5 === 0 ? m.cyanLight.clone() : m.steel, [11.05, 0.65 + lamella * 0.24, -0.2], false, [0, 0, (lamella % 7 - 3) * 0.015]), 0.008, lamella * 0.25);
  for (let wave = 0; wave < 24; wave += 1) pulse(box(root, `ORGCHEM__O8__EXCITON_TRANSFER_LIGHT_${wave + 1}`, [0.5, 0.06, 0.04], wave % 2 ? m.violetLight.clone() : m.cyanLight.clone(), [-10.4 + wave * 0.92, 2.15 + Math.sin(wave * 0.65) * 0.55, 3.42]), 0.018, wave * 0.32);
  return root;
}

function createReforgingWorks(m: OrganicMaterials) {
  const root = new THREE.Group(); root.name = 'ORGCHEM__O9__CIRCULAR_CARBON_REFORGING_WORKS'; addContainmentPlinth(root, 'O9', 18.6, 12.6, m);
  cylinder(root, 'ORGCHEM__O9__SILVER_CIRCULAR_PRODUCTION_HALL', 7.0, 3.85, m.steel, [-4.7, 2.12, 0], true, 32);
  cylinder(root, 'ORGCHEM__O9__RECYCLED_COMPOSITE_PRODUCTION_HALL', 7.0, 3.85, m.blackCeramic, [4.7, 2.12, 0], true, 32);
  for (let panel = 0; panel < 48; panel += 1) {
    const angle = panel * Math.PI * 2 / 48; const x = 4.7 + Math.cos(angle) * 3.58; const z = Math.sin(angle) * 3.58;
    box(root, `ORGCHEM__O9__RECYCLED_POLYMER_PANEL_${panel + 1}`, [0.46 + (panel % 3) * 0.1, 0.72 + (panel % 4) * 0.16, 0.1], m.recycled[panel % m.recycled.length], [x, 0.85 + (panel % 3) * 0.92, z], false, [0, -angle + Math.PI / 2, 0]);
    pulse(box(root, `ORGCHEM__O9__PANEL_MAINTENANCE_EDGE_${panel + 1}`, [0.34, 0.035, 0.025], m.amberLight.clone(), [x, 0.55 + (panel % 3) * 0.92, z], false, [0, -angle + Math.PI / 2, 0]), 0.006, panel * 0.18, 0.08, 2.4);
  }
  box(root, 'ORGCHEM__O9__FACETED_REFORGING_TOWER', [4.2, 6.0, 4.2], m.titanium, [0, 3.3, -0.3], true, [0, Math.PI / 4, 0]);
  for (let leg = 0; leg < 4; leg += 1) box(root, `ORGCHEM__O9__MASSIVE_TOWER_LEG_${leg + 1}`, [0.7, 3.2, 0.7], m.basalt, [leg < 2 ? -1.45 : 1.45, 1.75, leg % 2 ? -1.45 : 1.45], true);
  for (let drum = 0; drum < 4; drum += 1) {
    const y = 2.1 + drum * 0.82; cylinder(root, `ORGCHEM__O9__ACOUSTIC_SHELL_PROCESS_DRUM_${drum + 1}`, 1.25, 5.8, m.clearShell, [0, y, -0.2], false, 24, [0, 0, Math.PI / 2]);
    rotate(cylinder(root, `ORGCHEM__O9__MECHANOCHEMICAL_DRUM_${drum + 1}`, 0.72, 5.5, drum % 2 ? m.steel : m.recycled[drum], [0, y, -0.2], false, 12, [0, 0, Math.PI / 2]), 0.12 + drum * 0.025, 'x');
  }
  box(root, 'ORGCHEM__O9__ENCLOSED_FEEDSTOCK_CONVEYOR', [15.4, 0.78, 0.88], m.clearShell, [0, 5.55, -2.65]);
  for (let container = 0; container < 8; container += 1) {
    const item = box(root, `ORGCHEM__O9__CONVEYOR_FEEDSTOCK_CONTAINER_${container + 1}`, [0.55, 0.42, 0.48], container % 2 ? m.recycled[container % 4] : m.steel, [-6.8 + container * 1.9, 5.55, -2.65]); orbit(item, 0, -2.65, 7.0, 0.01, 0.019, container / 8);
  }
  for (let silo = 0; silo < 6; silo += 1) taperedCylinder(root, `ORGCHEM__O9__TRUNCATED_FEEDSTOCK_SILO_${silo + 1}`, 1.35, 0.92, 3.1 + (silo % 3) * 0.45, silo % 2 ? m.steel : m.recycled[silo % 4], [-7.4 + silo * 2.95, 1.9 + (silo % 3) * 0.225, -4.65], true, 16);
  box(root, 'ORGCHEM__O9__WEATHERING_WALL', [15.8, 2.2, 0.28], m.titanium, [0, 1.42, 5.2]);
  for (let sample = 0; sample < 36; sample += 1) box(root, `ORGCHEM__O9__WEATHERING_SAMPLE_${sample + 1}`, [0.34, 0.42, 0.08], m.recycled[sample % 4], [-7.1 + (sample % 18) * 0.84, 0.78 + Math.floor(sample / 18) * 0.75, 5.38], false, [0, 0, (sample % 5 - 2) * 0.03]);
  torus(root, 'ORGCHEM__O9__CIRCULAR_NEUTRALIZATION_BASIN', 2.1, 0.35, m.water, [0, 0.3, 7.0]);
  for (let sensor = 0; sensor < 5; sensor += 1) pulse(torus(root, `ORGCHEM__O9__NEUTRALIZATION_SENSOR_RING_${sensor + 1}`, 0.7 + sensor * 0.28, 0.025, m.amberLight.clone(), [0, 0.34, 7.0]), 0.009, sensor * 0.7);
  return root;
}

function createNaturalProductsAtlas(m: OrganicMaterials) {
  const root = new THREE.Group(); root.name = 'ORGCHEM__O10__NATURAL_PRODUCTS_MACROCYCLIC_ATLAS'; addContainmentPlinth(root, 'O10', 18.0, 13.6, m);
  const loops = [
    { x: -4.3, z: -1.2, r: 3.4, arc: Math.PI * 1.55, y: 1.2 }, { x: 3.8, z: -1.6, r: 3.0, arc: Math.PI * 1.7, y: 1.6 }, { x: -2.6, z: 3.4, r: 2.4, arc: Math.PI * 1.45, y: 1.05 }, { x: 3.4, z: 3.25, r: 2.25, arc: Math.PI * 1.62, y: 1.35 }, { x: 0, z: 0, r: 5.6, arc: Math.PI * 1.35, y: 0.95 },
  ];
  loops.forEach((loop, index) => {
    torus(root, `ORGCHEM__O10__NESTED_MACROCYCLIC_BUILDING_LOOP_${index + 1}`, loop.r, 0.58 + index * 0.07, index % 2 ? m.warmStone : m.whiteStone, [loop.x, loop.y, loop.z], [Math.PI / 2, 0, index * 0.52], loop.arc, true);
    for (let fin = 0; fin < 14; fin += 1) {
      const angle = (fin / 14) * loop.arc + index * 0.52; const x = loop.x + Math.cos(angle) * loop.r; const z = loop.z + Math.sin(angle) * loop.r;
      box(root, `ORGCHEM__O10__CHROMATOGRAM_AMBER_FIN_${index + 1}_${fin + 1}`, [0.1 + (fin % 3) * 0.04, 1.1 + (fin % 4) * 0.28, 0.26], fin % 4 === 0 ? m.amberGlass : m.warmStone, [x, 1.1 + (fin % 4) * 0.14, z], false, [0, -angle, 0]);
    }
  });
  cylinder(root, 'ORGCHEM__O10__CHEMICAL_SPACE_LANTERN', 3.1, 7.1, m.blackCeramic, [0, 3.8, -0.15], true, 32);
  for (let aperture = 0; aperture < 96; aperture += 1) {
    const angle = aperture * 2.399963; const y = 0.65 + (aperture % 16) * 0.4; const radius = 1.58; const light = aperture % 7 === 0 ? m.violetLight.clone() : aperture % 3 === 0 ? m.cyanLight.clone() : m.amberLight.clone();
    pulse(sphere(root, `ORGCHEM__O10__ALGORITHMIC_LANTERN_APERTURE_${aperture + 1}`, [0.045 + (aperture % 4) * 0.012, 0.045 + (aperture % 4) * 0.012, 0.025], light, [Math.cos(angle) * radius, y, -0.15 + Math.sin(angle) * radius]), 0.006 + (aperture % 5) * 0.0005, aperture * 0.19, 0.05, 3.6);
  }
  torus(root, 'ORGCHEM__O10__FLOATING_CHEMICAL_SPACE_SENSOR_RING', 2.55, 0.18, m.steel, [0, 4.9, -0.15]);
  for (let brace = 0; brace < 12; brace += 1) {
    const angle = brace * Math.PI / 6; pipe(root, `ORGCHEM__O10__LANTERN_RADIAL_BRACE_${brace + 1}`, new THREE.Vector3(Math.cos(angle) * 1.65, 4.9, -0.15 + Math.sin(angle) * 1.65), new THREE.Vector3(Math.cos(angle) * 2.5, 4.9, -0.15 + Math.sin(angle) * 2.5), 0.035, m.steel);
  }
  for (let halo = 0; halo < 5; halo += 1) torus(root, `ORGCHEM__O10__NESTED_EXHAUST_HALO_${halo + 1}`, 0.72 + halo * 0.22, 0.07, halo % 2 ? m.titanium : m.steel, [0, 7.4 + halo * 0.18, -0.15]);
  for (let portal = 0; portal < 7; portal += 1) torus(root, `ORGCHEM__O10__CHANGING_MOLECULAR_CAVITY_PORTAL_${portal + 1}`, 1.45 - Math.abs(3 - portal) * 0.14, 0.12, portal % 2 ? m.steel : m.warmStone, [0, 1.75, 6.4 + portal * 0.72], [0, 0, 0]);
  for (let garden = 0; garden < 16; garden += 1) {
    const angle = garden * Math.PI * 2 / 16; const radius = 6.1 + (garden % 2) * 0.75; cylinder(root, `ORGCHEM__O10__SOURCE_ECOLOGY_GARDEN_${garden + 1}`, 0.95 + (garden % 4) * 0.18, 0.12, garden % 3 ? m.green : m.recycled[garden % 4], [Math.cos(angle) * radius, 0.32, Math.sin(angle) * radius], false, garden % 2 ? 12 : 24);
  }
  return root;
}

function assignBuildingMetadata(root: THREE.Group, record: OrganicChemistryBuildingProgram) {
  root.userData.exteriorProgram = true;
  root.userData.organicChemistryBuilding = true;
  root.userData.buildingCode = record.code;
  root.userData.buildingName = record.name;
  root.userData.purpose = record.purpose;
  root.userData.footprintMetres = [...record.footprintMetres];
  root.userData.heightMetres = record.heightMetres;
  root.userData.placementZone = record.placementZone;
  root.userData.exteriorMotif = record.exteriorMotif;
  root.userData.featureRole = 'building';
  root.userData.featureTag = record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  root.traverse((object) => { object.userData.selectableId = DISTRICT_ID; object.userData.districtId = DISTRICT_ID; });
  return root;
}

function createBuilding(record: OrganicChemistryBuildingProgram, m: OrganicMaterials) {
  let root: THREE.Group;
  if (record.form === 'exchange') root = createAutocatalyticExchange(m);
  else if (record.form === 'cathedral') root = createSkeletalCathedral(m);
  else if (record.form === 'prism') root = createPhotonElectronPrism(m);
  else if (record.form === 'meridian') root = createMeridianInstitute(m);
  else if (record.form === 'conservatory') root = createCascadeConservatory(m);
  else if (record.form === 'chiral-twin') root = createChiralTwin(m);
  else if (record.form === 'catenane') root = createCatenaneForum(m);
  else if (record.form === 'loom') root = createPhotonicsLoom(m);
  else if (record.form === 'reforging') root = createReforgingWorks(m);
  else root = createNaturalProductsAtlas(m);
  return assignBuildingMetadata(root, record);
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radialMargin = 8.6; const angularMargin = (sector.endAngle - sector.startAngle) * 0.065;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT);
  const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
  return new THREE.Vector3(Math.cos(angle) * radius - definition.position[0], y, Math.sin(angle) * radius - definition.position[2]);
}

function districtArc(definition: DistrictDefinition, radialT: number, startT: number, endT: number, segments: number, y = FLOOR_Y) {
  return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, radialT, THREE.MathUtils.lerp(startT, endT, index / (segments - 1)), y));
}

function districtSpine(definition: DistrictDefinition, angularT: number, startT: number, endT: number, segments: number, y = FLOOR_Y) {
  return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, THREE.MathUtils.lerp(startT, endT, index / (segments - 1)), angularT, y));
}

function makeRibbonGeometry(points: readonly THREE.Vector3[], width: number) {
  const vertices: number[] = []; const indices: number[] = [];
  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5);
    vertices.push(point.x + normal.x, point.y, point.z + normal.z, point.x - normal.x, point.y, point.z - normal.z);
    if (index < points.length - 1) { const base = index * 2; indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); }
  });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function addRibbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, material: THREE.Material, walkable = true) {
  const ribbon = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), material), name); ribbon.userData.walkable = walkable; ribbon.userData.navObstacle = false; ribbon.userData.organicChemistryRoute = true; ribbon.receiveShadow = true; parent.add(ribbon); return ribbon;
}

function offsetPath(points: readonly THREE.Vector3[], offset: number, modulation = 0) {
  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x); const t = index / Math.max(1, points.length - 1);
    return point.clone().addScaledVector(normal, offset + Math.sin(t * Math.PI * 6) * modulation).setY(FLOOR_Y + 0.027);
  });
}

function addDistrictInfrastructure(district: THREE.Group, definition: DistrictDefinition, m: OrganicMaterials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'ORGCHEM__SYNTHESIS_ARC_INFRASTRUCTURE';
  const synthesisArc = districtArc(definition, 0.47, 0.02, 0.98, 112); addRibbon(infrastructure, 'ORGCHEM__SYNTHESIS_ARC', synthesisArc, 1.85, m.logistics);
  const promenade = districtArc(definition, 0.10, 0.03, 0.97, 96); addRibbon(infrastructure, 'ORGCHEM__BIOCHEMISTRY_RESEARCH_PROMENADE', promenade, 0.82, m.paving);
  const logisticsRoad = districtArc(definition, 0.94, 0.04, 0.96, 96); addRibbon(infrastructure, 'ORGCHEM__SHIELDED_OUTER_LOGISTICS_ROAD', logisticsRoad, 1.42, m.logistics);
  [-0.34, 0, 0.34].forEach((offset, index) => pulse(addRibbon(infrastructure, `ORGCHEM__REACTION_SCHEME_METALLIC_LINE_${index + 1}`, offsetPath(synthesisArc, offset, index === 1 ? 0.09 : 0.04), 0.045, [m.amberLight, m.steel, m.violetLight][index].clone(), false), 0.011 + index * 0.001, index * 0.8));
  [0.16, 0.39, 0.62, 0.85].forEach((angularT, index) => {
    const spine = districtSpine(definition, angularT, 0.035, 0.965, 58); addRibbon(infrastructure, `ORGCHEM__CONTROLLED_SERVICE_LINK_${index + 1}`, spine, index % 2 ? 0.92 : 0.76, index < 2 ? m.paving : m.logistics);
    pulse(addRibbon(infrastructure, `ORGCHEM__SERVICE_LINK_STATUS_BAND_${index + 1}`, offsetPath(spine, 0), 0.038, index < 2 ? m.cyanLight.clone() : m.amberLight.clone(), false), 0.012, index * 0.7);
  });
  for (let node = 0; node < 9; node += 1) {
    const point = pointInDistrict(definition, node % 2 ? 0.4 : 0.55, 0.06 + node * 0.11, FLOOR_Y);
    cylinder(infrastructure, `ORGCHEM__CATALYST_COURTYARD_${node + 1}`, 2.5 + (node % 3) * 0.35, 0.075, node % 2 ? m.paving : m.logistics, [point.x, FLOOR_Y + 0.04, point.z], false, 24);
    for (let marker = 0; marker < 4; marker += 1) pulse(cylinder(infrastructure, `ORGCHEM__CATALYST_NODE_${node + 1}_${marker + 1}`, 0.14, 0.06, marker % 2 ? m.violetLight.clone() : m.amberLight.clone(), [point.x + Math.cos(marker * Math.PI / 2) * 0.78, FLOOR_Y + 0.1, point.z + Math.sin(marker * Math.PI / 2) * 0.78], false, 12), 0.009, node + marker * 0.4);
  }
  district.add(infrastructure); return { infrastructure, synthesisArc };
}

function addDistrictSafetyLandscape(district: THREE.Group, definition: DistrictDefinition, m: OrganicMaterials) {
  const landscape = new THREE.Group(); landscape.name = 'ORGCHEM__MONITORED_SAFETY_LANDSCAPE';
  for (let basin = 0; basin < 12; basin += 1) {
    const point = pointInDistrict(definition, basin % 2 ? 0.27 : 0.75, 0.06 + Math.floor(basin / 2) * 0.17, FLOOR_Y);
    cylinder(landscape, `ORGCHEM__DISTRICT_NEUTRALIZATION_BASIN_${basin + 1}`, 0.8 + (basin % 3) * 0.22, 0.08, basin % 3 ? m.green : m.water, [point.x, 0.08, point.z], false, 24);
  }
  for (let beacon = 0; beacon < 18; beacon += 1) {
    const point = pointInDistrict(definition, beacon % 2 ? 0.34 : 0.83, 0.045 + Math.floor(beacon / 2) * 0.105, FLOOR_Y);
    cylinder(landscape, `ORGCHEM__DISTRICT_WIND_DIRECTION_BEACON_${beacon + 1}`, 0.08, 0.9 + (beacon % 3) * 0.18, m.titanium, [point.x, 0.5 + (beacon % 3) * 0.09, point.z], false, 12);
    pulse(sphere(landscape, `ORGCHEM__DISTRICT_EMERGENCY_LIGHT_${beacon + 1}`, [0.08, 0.08, 0.08], beacon % 3 ? m.cyanLight.clone() : m.amberLight.clone(), [point.x, 1.02 + (beacon % 3) * 0.18, point.z]), 0.008, beacon * 0.34);
  }
  for (let store = 0; store < 7; store += 1) {
    const point = pointInDistrict(definition, 0.97, 0.09 + store * 0.135, FLOOR_Y);
    const storage = cylinder(landscape, `ORGCHEM__PARTIALLY_BURIED_SOLVENT_STORAGE_${store + 1}`, 1.3, 0.62, m.steel, [point.x, 0.18, point.z], true, 24, [0, 0, Math.PI / 2]); storage.userData.partiallyBuried = true;
  }
  district.add(landscape); return landscape;
}

export function buildOrganicChemistryLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Organic Chemistry Labs District requires a masterplan sector');
  const materials = createOrganicMaterials(); const { infrastructure, synthesisArc } = addDistrictInfrastructure(district, definition, materials); const landscape = addDistrictSafetyLandscape(district, definition, materials);
  const facilities = ORGANIC_CHEMISTRY_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials); const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02); building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT }; district.add(building); return building;
  });
  facilities.forEach((facility, index) => {
    const record = ORGANIC_CHEMISTRY_BUILDING_PROGRAM[index]; const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, record.footprintMetres[1] / 20 + 0.8); const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const routePoint = synthesisArc.reduce((closest, point) => point.distanceToSquared(entrance) < closest.distanceToSquared(entrance) ? point : closest, synthesisArc[0]); const approach = [routePoint.clone(), routePoint.clone().lerp(entrance, 0.5), entrance];
    addRibbon(infrastructure, `ORGCHEM__BUILDING_APPROACH_${record.code}`, approach, 0.78, index === 4 || index === 9 ? materials.paving : materials.logistics);
    pulse(addRibbon(infrastructure, `ORGCHEM__BUILDING_APPROACH_STATUS_${record.code}`, approach.map((point) => point.clone().setY(FLOOR_Y + 0.027)), 0.038, index < 4 ? materials.cyanLight.clone() : index < 7 ? materials.violetLight.clone() : materials.amberLight.clone(), false), 0.012, index * 0.45);
  });
  district.userData.organicChemistryLabsDistrict = {
    identity: 'The Molecular Synthesis Quarter',
    architecturalLanguage: 'carbon-black ceramic and basalt composite, white acid-resistant technical stone, amber/violet/smoke laboratory glass, brushed steel, dark titanium, dichroic photovoltaics, fluoropolymer membranes, and visible safety-shell utilities',
    buildingCount: facilities.length,
    buildings: ORGANIC_CHEMISTRY_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, purpose: record.purpose, placementZone: record.placementZone, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorMotif: record.exteriorMotif })),
    progression: ['selective bond activation', 'single-atom skeletal editing', 'autonomous synthesis', 'photoelectrochemistry', 'stereochemical control', 'molecular motion', 'programmable photonic materials', 'chemoenzymatic cascades', 'natural-product chemical space', 'circular carbon economies'],
    silhouette: { darkVerticalMonument: 'Skeletal Editing Cathedral', pairedTwist: 'Chiral Synthesis Twin', interlockedCivicLandmark: 'Catenane Forum for Molecular Machines', luminousEdge: 'Photon-Electron Catalysis Prism', southernHorizon: 'Organic Photonics and Semiconductor Loom', industrialAnchor: 'Circular Carbon Reforging Works' },
    circulation: { primaryBoulevard: 'ORGCHEM__SYNTHESIS_ARC', innerPromenade: 'ORGCHEM__BIOCHEMISTRY_RESEARCH_PROMENADE', shieldedLogisticsRoad: 'ORGCHEM__SHIELDED_OUTER_LOGISTICS_ROAD', controlledServiceLinks: 4, exactBuildingApproaches: 10, reactionSchemeLines: 3 },
    safetySystems: { elevatedContainmentPlinths: 10, perimeterDrainageChannels: 40, remoteFireSuppressionPylons: 40, windDirectionBeacons: 18, partiallyBuriedSolventStores: 7, districtNeutralizationBasins: 12 },
    signatureSystems: { exchangeFacadeModules: 40, prismDichroicFins: 60, electrosynthesisTowers: 4, conservatoryTerraces: 5, catenaneRings: 3, loomPhotovoltaicLengthMetres: 240, recycledPolymerPanels: 48, lanternApertures: 96 },
    materials: ['carbon-black ceramic and basalt composite', 'white acid-resistant technical stone', 'amber, violet, and smoke-tinted laboratory glass', 'brushed stainless steel and dark titanium', 'dichroic photovoltaic surfaces', 'replaceable fluoropolymer membranes'],
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: ORGANIC_CHEMISTRY_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: ['Synthesis Arc', 'Biochemistry Research Promenade', 'Shielded Logistics Road', 'Catalyst Courtyards', 'Neutralization Basins', 'Solvent Storage Compounds', 'Wind Beacons'],
    realizedFeatureTags: ORGANIC_CHEMISTRY_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 17,
    radialCoverage: 0.94,
    angularCoverage: 0.96,
    exteriorOnly: true,
    molecularSynthesisQuarter: true,
  };
}
