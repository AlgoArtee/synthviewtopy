import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type BiochemistryBuildingForm =
  | 'aminoform'
  | 'cryostratum'
  | 'metabolome'
  | 'vesica'
  | 'evozyme'
  | 'coacervum'
  | 'glycan'
  | 'proteostasis'
  | 'chronocatalysis'
  | 'ferrum';

export interface BiochemistryBuildingProgram {
  code: string;
  name: string;
  subtitle: string;
  purpose: string;
  form: BiochemistryBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
}

export const BIOCHEMISTRY_BUILDING_PROGRAM: readonly BiochemistryBuildingProgram[] = [
  { code: 'B1', name: 'Aminoform Foundry', subtitle: 'Institute for Generative Protein Architecture', purpose: 'AI-guided protein design, novel folds, catalytic proteins, binders, and controlled conformational change', form: 'aminoform', footprintMetres: [165, 120], heightMetres: 48, radialT: 0.08, angularT: 0.14, placementZone: 'Innermost Genomics-facing threshold', exteriorMotif: 'three folded molecular chains enclosing an active-site entrance canyon' },
  { code: 'B2', name: 'Cryostratum', subtitle: 'Native Molecular Machinery Observatory', purpose: 'In-situ cryo-electron tomography of molecular machinery in native cellular environments', form: 'cryostratum', footprintMetres: [150, 105], heightMetres: 43, radialT: 0.12, angularT: 0.98, placementZone: 'Quiet northern boundary adjacent to Molecular Biology', exteriorMotif: 'three nested vitrified shells, a vibration moat, and ringed cryogenic capsule tower' },
  { code: 'B3', name: 'Metabolome Atlas', subtitle: 'Spatial Flux Cartography Hall', purpose: 'Spatial metabolomics and multimodal mass-spectrometry imaging across tissue-scale gradients', form: 'metabolome', footprintMetres: [180, 110], heightMetres: 44, radialT: 0.31, angularT: 0.32, placementZone: 'Long frontage on the Reaction Gradient', exteriorMotif: 'five displaced tissue-section terraces wrapped around the Flux Field' },
  { code: 'B4', name: 'Vesica Genesis', subtitle: 'Synthetic Cell and Protocell Complex', purpose: 'Bottom-up assembly of membranes, pores, cytoskeletons, biochemical compartments, and protocell networks', form: 'vesica', footprintMetres: [150, 125], heightMetres: 42, radialT: 0.34, angularT: 0.84, placementZone: 'Central pedestrian convergence', exteriorMotif: 'seven budding translucent vesicles joined by molecular-pore bridges' },
  { code: 'B5', name: 'Evozyme Loop', subtitle: 'Autonomous Enzyme Evolution Foundry', purpose: 'Closed-loop design-build-test-learn platforms for autonomous enzyme engineering', form: 'evozyme', footprintMetres: [210, 95], heightMetres: 38, radialT: 0.54, angularT: 0, placementZone: 'Southern service corridor toward Organic Chemistry', exteriorMotif: 'four interlocking process loops encircled by an autonomous sample rail' },
  { code: 'B6', name: 'Coacervum', subtitle: 'Biomolecular Condensate Observatory', purpose: 'Dynamic membraneless compartments, phase behavior, gradients, and selective molecular transport', form: 'coacervum', footprintMetres: [155, 115], heightMetres: 30, radialT: 0.55, angularT: 0.63, placementZone: 'Retention-basin site between Vesica Genesis and Metabolome Atlas', exteriorMotif: 'merged liquid masses beneath a perforated rain-and-mist canopy' },
  { code: 'B7', name: 'Glycan Cipher', subtitle: 'Glycoproteome and Post-Translational Code Institute', purpose: 'Deep glycoprofiling and integrated mapping of post-translational modifications', form: 'glycan', footprintMetres: [95, 75], heightMetres: 72, radialT: 0.72, angularT: 0.2, placementZone: 'Narrow site between curving district roads', exteriorMotif: 'a branching tower with sugar-ring exoskeleton and terminal modules' },
  { code: 'B8', name: 'Proteostasis Citadel', subtitle: 'Folding and Molecular Quality-Control Center', purpose: 'Protein folding, chaperone systems, aggregation control, sorting, and degradation', form: 'proteostasis', footprintMetres: [125, 110], heightMetres: 58, radialT: 0.75, angularT: 0.82, placementZone: 'Prominent Reaction Gradient and service-avenue corner', exteriorMotif: 'a protected folding chamber held within two monumental quality-control rings' },
  { code: 'B9', name: 'Chronocatalysis Spire', subtitle: 'Single-Molecule and Ultrafast Reaction Observatory', purpose: 'Single-molecule kinetics and ultrafast structural, photochemical, and electron-transfer dynamics', form: 'chronocatalysis', footprintMetres: [70, 60], heightMetres: 96, radialT: 0.91, angularT: 0.98, placementZone: 'Triangular navigational plot at two converging avenues', exteriorMotif: 'two prismatic reaction-coordinate halves separated by a pulsing vertical slit' },
  { code: 'B10', name: 'Ferrum Vita Forge', subtitle: 'Metallocluster, Redox, and Cell-Free Metabolism Works', purpose: 'Metalloenzymes, electron-transfer systems, and programmable cell-free metabolic cascades', form: 'ferrum', footprintMetres: [280, 135], heightMetres: 82, radialT: 0.9, angularT: 0.47, placementZone: 'Outermost industrial transition to Organic and Inorganic Chemistry', exteriorMotif: 'an industrial biochemical cathedral with cascade halls, redox pipework, and three metallocluster towers' },
] as const;

const DISTRICT_ID = 'biochemistry-labs';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 20, 14);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_Z = new THREE.Vector3(0, 0, 1);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

type BiochemistryMaterials = ReturnType<typeof createBiochemistryMaterials>;

function districtMaterial(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.18, ...options });
  material.name = name;
  return material;
}

function createBiochemistryMaterials() {
  const basalt = districtMaterial('Biochemistry carbon-black basalt substrate', '#101417', { roughness: 0.9, metalness: 0.08 });
  const charcoal = districtMaterial('Biochemistry carbon-black structural ceramic', '#20282b', { roughness: 0.72, metalness: 0.18 });
  const paleCeramic = districtMaterial('Biochemistry pale vitrified laboratory ceramic', '#e7e8e1', { roughness: 0.42, metalness: 0.04 });
  const pearlCeramic = districtMaterial('Biochemistry protein-fold pearlescent ceramic', '#cfd7d3', { roughness: 0.36, metalness: 0.09 });
  const titanium = districtMaterial('Biochemistry satin titanium instrumentation', '#9da9ad', { roughness: 0.28, metalness: 0.82 });
  const iridium = districtMaterial('Biochemistry iridium-coated catalytic steel', '#59646d', { roughness: 0.22, metalness: 0.9 });
  const weatheringSteel = districtMaterial('Biochemistry sealed iron-rich weathering steel', '#5a3429', { roughness: 0.64, metalness: 0.5 });
  const darkGlass = districtMaterial('Biochemistry smoke-grey electrochromic glass', '#172932', { roughness: 0.15, metalness: 0.45, transparent: true, opacity: 0.86 });
  const opalGlass = districtMaterial('Biochemistry blue-white opal cryogenic glass', '#bcdbe2', { roughness: 0.22, metalness: 0.12, transparent: true, opacity: 0.68 });
  const membraneGlass = districtMaterial('Biochemistry translucent synthetic membrane', '#acd7cc', { roughness: 0.18, metalness: 0.06, transparent: true, opacity: 0.54, side: THREE.DoubleSide });
  const mirror = districtMaterial('Biochemistry mirror analytical insert', '#77909b', { roughness: 0.08, metalness: 0.96 });
  const palePaving = districtMaterial('Biochemistry pale mineral reaction paving', '#afb7ad', { roughness: 0.86, metalness: 0.05 });
  const darkPaving = districtMaterial('Biochemistry dark reaction-gradient paving', '#252d2c', { roughness: 0.9, metalness: 0.08 });
  const water = districtMaterial('Biochemistry microfluidic black water', '#102f39', { roughness: 0.12, metalness: 0.28, transparent: true, opacity: 0.76 });
  const moss = districtMaterial('Biochemistry molecular moss field', '#455d43', { roughness: 0.96, metalness: 0 });
  const grass = districtMaterial('Biochemistry silver reaction grass', '#778477', { roughness: 0.94, metalness: 0 });
  const warmLight = districtMaterial('Biochemistry catalytic amber light', '#ffd18a', { emissive: '#ffab45', emissiveIntensity: 2.2, roughness: 0.22, metalness: 0.1 });
  const coldLight = districtMaterial('Biochemistry molecular cold-white light', '#d9fbff', { emissive: '#8de9ff', emissiveIntensity: 2.4, roughness: 0.18, metalness: 0.08 });
  const fluxLight = districtMaterial('Biochemistry metabolic flux light', '#b7f778', { emissive: '#7dde4d', emissiveIntensity: 2.35, roughness: 0.2, metalness: 0.08 });
  [warmLight, coldLight, fluxLight].forEach((material) => { material.userData.isDistrictAccent = true; });
  return { basalt, charcoal, paleCeramic, pearlCeramic, titanium, iridium, weatheringSteel, darkGlass, opalGlass, membraneGlass, mirror, palePaving, darkPaving, water, moss, grass, warmLight, coldLight, fluxLight };
}

function prepare<T extends THREE.Object3D>(object: T, name: string, obstacle = false) {
  object.name = name;
  object.userData.selectableId = DISTRICT_ID;
  object.userData.districtId = DISTRICT_ID;
  if (object instanceof THREE.Mesh) {
    // Only the structural masses participate in the island-wide shadow pass.
    // Hundreds of tiny molecular lights, fins, rings, and landscape markers
    // retain full visible detail without duplicating their draw cost in the
    // sun shadow map.
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

function taperedCylinder(parent: THREE.Object3D, name: string, bottomDiameter: number, topDiameter: number, height: number, segments: number, material: THREE.Material, position: readonly [number, number, number], obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(new THREE.CylinderGeometry(topDiameter * 0.5, bottomDiameter * 0.5, height, segments), material), name, obstacle);
  mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function ellipsoid(parent: THREE.Object3D, name: string, scale: readonly [number, number, number], material: THREE.Material, position: readonly [number, number, number], obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(UNIT_SPHERE, material), name, obstacle);
  mesh.scale.set(...scale); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, material: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0], arc = Math.PI * 2) {
  const key = `${radius.toFixed(3)}:${tube.toFixed(3)}:${arc.toFixed(3)}`;
  let geometry = TORUS_CACHE.get(key);
  if (!geometry) { geometry = new THREE.TorusGeometry(radius, tube, 8, 32, arc); TORUS_CACHE.set(key, geometry); }
  const mesh = prepare(new THREE.Mesh(geometry, material), name);
  mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function pipe(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material, obstacle = false) {
  const vector = end.clone().sub(start); const mesh = prepare(new THREE.Mesh(UNIT_CYLINDER_12, material), name, obstacle);
  mesh.position.copy(start).add(end).multiplyScalar(0.5); mesh.scale.set(radius * 2, vector.length(), radius * 2); mesh.quaternion.setFromUnitVectors(UNIT_Y, vector.normalize()); parent.add(mesh); return mesh;
}

function slabBetween(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, width: number, height: number, material: THREE.Material, obstacle = false) {
  const vector = end.clone().sub(start); const mesh = prepare(new THREE.Mesh(UNIT_BOX, material), name, obstacle);
  mesh.position.copy(start).add(end).multiplyScalar(0.5); mesh.scale.set(width, height, vector.length()); mesh.quaternion.setFromUnitVectors(UNIT_Z, vector.normalize()); parent.add(mesh); return mesh;
}

function pulse(object: THREE.Object3D, speed: number, phase = 0, minIntensity = 0.25, maxIntensity = 4) {
  object.userData.animate = 'biochemistry-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate(object: THREE.Object3D, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'biochemistry-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function pathVolume(parent: THREE.Object3D, prefix: string, points: readonly THREE.Vector3[], width: number, height: number, material: THREE.Material, jointMaterial: THREE.Material) {
  points.slice(0, -1).forEach((point, index) => slabBetween(parent, `${prefix}_SEGMENT_${index + 1}`, point, points[index + 1], width, height, material, true));
  points.forEach((point, index) => ellipsoid(parent, `${prefix}_FOLD_${index + 1}`, [width * 0.58, height * 0.53, width * 0.58], index % 2 ? material : jointMaterial, point.toArray() as [number, number, number], true));
}

function createAminoformFoundry(record: BiochemistryBuildingProgram, m: BiochemistryMaterials) {
  const root = new THREE.Group(); root.name = 'BIOCHEM__B1__AMINOFORM_FOUNDRY';
  box(root, 'BIOCHEM__B1__BASALT_SUBSTRATE_WEST', [5.1, 0.45, 9.4], m.basalt, [-5.4, 0.23, 0], true, [0, 0.12, 0]);
  box(root, 'BIOCHEM__B1__BASALT_SUBSTRATE_EAST', [5.1, 0.45, 9.4], m.basalt, [5.4, 0.23, 0], true, [0, -0.12, 0]);
  box(root, 'BIOCHEM__B1__BASALT_SUBSTRATE_REAR', [5.4, 0.45, 6.6], m.basalt, [0, 0.23, -2.4], true);
  const alpha = [new THREE.Vector3(-6.2, 2.2, -3.2), new THREE.Vector3(-4.5, 3.6, -1.5), new THREE.Vector3(-5.1, 4.1, 1.1), new THREE.Vector3(-3.1, 3.5, 3.3)];
  const beta = [new THREE.Vector3(5.9, 2.1, -3.1), new THREE.Vector3(4.2, 3.5, -1.6), new THREE.Vector3(4.9, 3.8, 1.0), new THREE.Vector3(2.9, 3.25, 3.4)];
  const loop = [new THREE.Vector3(-2.0, 2.3, -3.8), new THREE.Vector3(0.1, 4.0, -2.4), new THREE.Vector3(2.2, 3.35, -0.7), new THREE.Vector3(0.8, 3.0, 1.4)];
  pathVolume(root, 'BIOCHEM__B1__ALPHA_HELIX_CHAIN', alpha, 1.95, 3.7, m.paleCeramic, m.pearlCeramic);
  pathVolume(root, 'BIOCHEM__B1__BETA_SHEET_CHAIN', beta, 1.88, 3.25, m.pearlCeramic, m.paleCeramic);
  pathVolume(root, 'BIOCHEM__B1__DISORDERED_LOOP_CHAIN', loop, 2.05, 3.0, m.paleCeramic, m.darkGlass);
  for (let turn = 0; turn < 18; turn += 1) {
    const angle = turn * 0.72; const x = -4.65 + Math.cos(angle) * 1.17; const y = 1.25 + turn * 0.18; const z = -0.15 + Math.sin(angle) * 1.17;
    slabBetween(root, `BIOCHEM__B1__ALPHA_BACKBONE_BOND_${turn + 1}`, new THREE.Vector3(x, y, z), new THREE.Vector3(-4.65 + Math.cos(angle + 0.72) * 1.17, y + 0.18, -0.15 + Math.sin(angle + 0.72) * 1.17), 0.12, 0.12, turn % 4 === 0 ? m.coldLight.clone() : m.titanium);
  }
  for (let sheet = 0; sheet < 8; sheet += 1) box(root, `BIOCHEM__B1__FOLDED_BETA_PLATE_${sheet + 1}`, [3.7, 0.16, 1.08], sheet % 2 ? m.paleCeramic : m.pearlCeramic, [3.8 + (sheet % 2) * 0.42, 1.15 + sheet * 0.39, -2.8 + sheet * 0.72], false, [0.05 * (sheet % 3 - 1), -0.18 + sheet * 0.045, 0.03 * (sheet % 2 ? 1 : -1)]);
  for (let panel = 0; panel < 54; panel += 1) {
    const side = panel % 2 ? 1 : -1; const row = Math.floor(panel / 9); const column = panel % 9;
    box(root, `BIOCHEM__B1__RESIDUE_CONTACT_FIN_${panel + 1}`, [0.055, 0.45 + (panel % 3) * 0.12, 0.24], panel % 7 === 0 ? m.darkGlass : m.titanium, [side * (3.1 + row * 0.5), 1.1 + column * 0.38, 3.85 - row * 0.45], false, [0, side * 0.16, 0]);
  }
  for (let site = 0; site < 6; site += 1) pulse(ellipsoid(root, `BIOCHEM__B1__ENGINEERED_ACTIVE_SITE_${site + 1}`, [0.52 + site * 0.04, 0.34, 0.12], m.warmLight.clone(), [-2.8 + site * 1.12, 2.0 + (site % 3) * 0.72, 4.22]), 0.013, site * 0.7);
  const ligand = ellipsoid(root, 'BIOCHEM__B1__SUSPENDED_TITANIUM_LIGAND', [0.72, 0.42, 0.5], m.titanium, [0, 3.72, 4.2]);
  for (let bond = 0; bond < 5; bond += 1) pipe(root, `BIOCHEM__B1__LIGAND_TENSION_BOND_${bond + 1}`, ligand.position, new THREE.Vector3(-2.2 + bond * 1.1, 4.65, 3.25), 0.025, m.iridium);
  slabBetween(root, 'BIOCHEM__B1__HIGH_MOLECULAR_BOND_BRIDGE', new THREE.Vector3(-3.6, 5.15, -0.8), new THREE.Vector3(3.8, 5.0, -0.2), 0.42, 0.45, m.titanium);
  for (let unit = 0; unit < 7; unit += 1) ellipsoid(root, `BIOCHEM__B1__RIBBED_DOMAIN_COOLER_${unit + 1}`, [0.55 + (unit % 3) * 0.12, 0.3, 0.42], unit % 2 ? m.iridium : m.charcoal, [-4.5 + unit * 1.5, 4.85 + (unit % 2) * 0.22, -2.2 + (unit % 3) * 0.55]);
  box(root, 'BIOCHEM__B1__BINDING_POCKET_ENTRY', [2.35, 2.9, 0.28], m.darkGlass, [0, 1.72, 5.25]);
  for (let residue = 0; residue < 18; residue += 1) pulse(box(root, `BIOCHEM__B1__AMINO_SEQUENCE_MARK_${residue + 1}`, [0.12 + (residue % 4) * 0.06, 0.025, 0.08], residue % 5 === 0 ? m.warmLight.clone() : m.coldLight.clone(), [-4.4 + residue * 0.52, 0.08, 6.15 + Math.sin(residue * 0.9) * 0.22]), 0.01, residue * 0.24);
  return root;
}

function createCryostratum(record: BiochemistryBuildingProgram, m: BiochemistryMaterials) {
  const root = new THREE.Group(); root.name = 'BIOCHEM__B2__CRYOSTRATUM';
  for (const [name, x, z, sx, sz] of [['NORTH', 0, -5.6, 15.8, 0.48], ['SOUTH', 0, 5.6, 15.8, 0.48], ['WEST', -8.1, 0, 0.48, 10.8], ['EAST', 8.1, 0, 0.48, 10.8]] as const) box(root, `BIOCHEM__B2__VIBRATION_BLACK_WATER_${name}`, [sx, 0.08, sz], m.water, [x, 0.06, z]);
  box(root, 'BIOCHEM__B2__DARK_OUTER_SPECIMEN_SHELL', [14.8, 2.25, 9.8], m.charcoal, [0, 1.15, 0], true);
  box(root, 'BIOCHEM__B2__VITRIFIED_MIDDLE_SHELL', [12.9, 2.65, 8.25], m.opalGlass, [0.15, 1.55, -0.12], true);
  box(root, 'BIOCHEM__B2__PALE_INNER_CELLULAR_SHELL', [10.8, 3.0, 6.75], m.paleCeramic, [-0.25, 1.85, 0.08], true);
  box(root, 'BIOCHEM__B2__FLOATING_THERMAL_CANOPY', [14.4, 0.22, 9.45], m.pearlCeramic, [0, 3.48, 0]);
  for (let aperture = 0; aperture < 9; aperture += 1) pulse(ellipsoid(root, `BIOCHEM__B2__TOMOGRAPHY_TILT_WINDOW_${aperture + 1}`, [0.48, 0.48, 0.09], aperture % 3 === 0 ? m.coldLight.clone() : m.darkGlass, [-5.1 + aperture * 1.28, 1.65 + Math.sin(aperture * 0.7) * 0.18, 4.94]), 0.008, aperture * 0.65, 0.18, 3.2);
  const tower = ellipsoid(root, 'BIOCHEM__B2__CRYOGENIC_CAPSULE_TOWER', [1.65, 4.3, 1.65], m.opalGlass, [1.0, 4.25, -0.6], true);
  for (let ring = 0; ring < 11; ring += 1) torus(root, `BIOCHEM__B2__CAPSULE_HORIZONTAL_RING_${ring + 1}`, 1.72 - Math.abs(5 - ring) * 0.055, 0.075, ring % 3 === 0 ? m.coldLight.clone() : m.titanium, [1.0, 1.05 + ring * 0.61, -0.6]);
  for (let shaft = 0; shaft < 4; shaft += 1) {
    const x = -1.55 + shaft * 1.02;
    pipe(root, `BIOCHEM__B2__SILVER_CRYOGENIC_EXHAUST_${shaft + 1}`, new THREE.Vector3(x, 3.25, -2.35), new THREE.Vector3(x + 0.12, 6.45 + shaft * 0.22, -2.35), 0.12, m.titanium);
    pulse(ellipsoid(root, `BIOCHEM__B2__VAPOUR_BEACON_${shaft + 1}`, [0.18, 0.38, 0.18], m.coldLight.clone(), [x + 0.12, 6.62 + shaft * 0.22, -2.35]), 0.007, shaft * 1.1, 0.12, 2.5);
  }
  for (let vessel = 0; vessel < 8; vessel += 1) cylinder(root, `BIOCHEM__B2__SCREENED_CRYOGENIC_VESSEL_${vessel + 1}`, 0.6, 1.35 + (vessel % 3) * 0.25, vessel % 2 ? m.titanium : m.iridium, [-5.0 + vessel * 1.35, 1.25, -4.25], false, 12);
  box(root, 'BIOCHEM__B2__DIFFRACTION_ENTRY_BRIDGE', [1.45, 0.12, 3.1], m.opalGlass, [0, 0.16, 6.45]);
  for (let fringe = 0; fringe < 14; fringe += 1) box(root, `BIOCHEM__B2__BRIDGE_INTERFERENCE_FRINGE_${fringe + 1}`, [1.3, 0.025, 0.035], fringe % 4 === 0 ? m.coldLight.clone() : m.titanium, [0, 0.24, 5.05 + fringe * 0.22]);
  tower.userData.cryogenicIsolation = true;
  return root;
}

function createMetabolomeAtlas(record: BiochemistryBuildingProgram, m: BiochemistryMaterials) {
  const root = new THREE.Group(); root.name = 'BIOCHEM__B3__METABOLOME_ATLAS';
  box(root, 'BIOCHEM__B3__BASALT_TISSUE_SUBSTRATE', [18.2, 0.34, 10.8], m.basalt, [0, 0.17, 0], true);
  for (let slice = 0; slice < 17; slice += 1) {
    const t = slice / 16; const angle = THREE.MathUtils.lerp(-0.84, 0.84, t); const radius = 8.1; const x = Math.sin(angle) * radius; const z = 3.9 - Math.cos(angle) * radius * 0.45; const terraceCount = 2 + Math.round((1 - Math.abs(t - 0.5) * 2) * 3);
    for (let terrace = 0; terrace < terraceCount; terrace += 1) {
      const width = 1.55 + terrace * 0.18; const height = 0.68; const y = 0.55 + terrace * 0.72;
      box(root, `BIOCHEM__B3__DISPLACED_TISSUE_SLICE_${slice + 1}_${terrace + 1}`, [width, height, 4.2 - terrace * 0.2], terrace % 3 === 0 ? m.paleCeramic : terrace % 3 === 1 ? m.opalGlass : m.darkGlass, [x + terrace * 0.08 * Math.cos(angle), y, z - terrace * 0.1], true, [0, -angle, 0]);
    }
    for (let pixel = 0; pixel < 6; pixel += 1) pulse(box(root, `BIOCHEM__B3__ANALYTICAL_PIXEL_${slice + 1}_${pixel + 1}`, [0.28 + (pixel % 3) * 0.09, 0.22 + (pixel % 2) * 0.12, 0.06], pixel % 5 === 0 ? m.fluxLight.clone() : pixel % 3 === 0 ? m.warmLight.clone() : m.darkGlass, [x + Math.sin(pixel * 1.7) * 0.5, 0.72 + pixel * 0.5, z + 2.15], false, [0, -angle, 0]), 0.012 + (slice % 4) * 0.001, slice * 0.31 + pixel * 0.19);
  }
  cylinder(root, 'BIOCHEM__B3__FLUX_FIELD_PLAZA', 7.6, 0.09, m.palePaving, [0, 0.08, 5.05], false, 32);
  for (let node = 0; node < 16; node += 1) {
    const angle = node * Math.PI * 2 / 16; const radius = 1.0 + (node % 4) * 0.62;
    cylinder(root, `BIOCHEM__B3__FLUX_FIELD_NODE_${node + 1}`, 0.24 + (node % 3) * 0.06, 0.07, node % 4 === 0 ? m.fluxLight.clone() : m.titanium, [Math.cos(angle) * radius, 0.16, 5.05 + Math.sin(angle) * radius], false, 12);
  }
  for (let tower = 0; tower < 3; tower += 1) {
    const x = -4.6 + tower * 4.6;
    cylinder(root, `BIOCHEM__B3__ANALYTICAL_SERVICE_TOWER_${tower + 1}`, 1.05, 5.0 + tower * 0.45, tower === 1 ? m.iridium : m.titanium, [x, 2.55 + tower * 0.22, -4.65], true, 12);
    for (let mark = 0; mark < 11; mark += 1) pulse(box(root, `BIOCHEM__B3__TOWER_SPECTRAL_MARK_${tower + 1}_${mark + 1}`, [0.62 - tower * 0.08, 0.055 + (mark % 3) * 0.025, 0.08], tower === 0 ? m.fluxLight.clone() : tower === 1 ? m.warmLight.clone() : m.coldLight.clone(), [x, 0.72 + mark * 0.39, -4.08]), 0.01, tower * 1.1 + mark * 0.18);
  }
  slabBetween(root, 'BIOCHEM__B3__REFLECTIVE_TERRACE_SKYBRIDGE', new THREE.Vector3(-4.2, 4.3, -0.8), new THREE.Vector3(4.0, 4.6, -0.4), 0.55, 0.42, m.mirror);
  return root;
}

function createVesicaGenesis(record: BiochemistryBuildingProgram, m: BiochemistryMaterials) {
  const root = new THREE.Group(); root.name = 'BIOCHEM__B4__VESICA_GENESIS';
  const vesicles = [
    [0, 3.0, 0, 3.6, 3.15, 3.4], [-4.4, 2.25, -1.2, 2.4, 2.2, 2.25], [4.35, 2.15, -1.35, 2.25, 2.05, 2.2], [-3.9, 1.8, 3.2, 1.85, 1.7, 1.75], [3.75, 1.75, 3.25, 1.8, 1.65, 1.75], [-5.0, 1.55, -4.0, 1.55, 1.4, 1.5], [4.85, 1.6, -3.85, 1.6, 1.45, 1.55],
  ] as const;
  vesicles.forEach(([x, y, z, sx, sy, sz], index) => {
    cylinder(root, `BIOCHEM__B4__DARK_VESICLE_COLLAR_${index + 1}`, sx * 1.05, 0.42, m.basalt, [x, 0.23, z], true, 24);
    ellipsoid(root, `BIOCHEM__B4__TRANSLUCENT_VESICLE_${index + 1}`, [sx, sy, sz], index === 0 ? m.membraneGlass : m.opalGlass, [x, y, z], true);
    for (let lipid = 0; lipid < 10; lipid += 1) {
      const angle = lipid * Math.PI * 2 / 10; const px = x + Math.cos(angle) * sx * 0.86; const pz = z + Math.sin(angle) * sz * 0.86;
      pipe(root, `BIOCHEM__B4__LIPID_BILAYER_ELEMENT_${index + 1}_${lipid + 1}`, new THREE.Vector3(px, y - sy * 0.65, pz), new THREE.Vector3(px, y + sy * 0.65, pz), 0.035, lipid % 3 === 0 ? m.coldLight.clone() : m.titanium);
    }
  });
  vesicles.slice(1).forEach(([x, y, z], index) => {
    const end = new THREE.Vector3(x * 0.65, y + 0.2, z * 0.65); const start = new THREE.Vector3(x * 0.22, 2.7, z * 0.22);
    slabBetween(root, `BIOCHEM__B4__MOLECULAR_PORE_BRIDGE_${index + 1}`, start, end, 0.62, 0.65, m.darkGlass);
    const mid = start.clone().lerp(end, 0.52); torus(root, `BIOCHEM__B4__RADIAL_PORE_FRAME_${index + 1}`, 0.52, 0.09, m.iridium, mid.toArray() as [number, number, number], [0, Math.atan2(end.x - start.x, end.z - start.z), Math.PI / 2]);
  });
  cylinder(root, 'BIOCHEM__B4__SIGNALLING_REFLECTING_POOL', 7.8, 0.08, m.water, [0, 0.06, 6.0], false, 32);
  for (let disc = 0; disc < 9; disc += 1) {
    const z = 3.8 + disc * 0.52; cylinder(root, `BIOCHEM__B4__POOL_APPROACH_DISC_${disc + 1}`, 0.78, 0.09, m.palePaving, [Math.sin(disc * 0.9) * 0.35, 0.12, z], false, 24);
    pulse(torus(root, `BIOCHEM__B4__SIGNAL_RIPPLE_${disc + 1}`, 0.42 + (disc % 3) * 0.08, 0.025, m.coldLight.clone(), [Math.sin(disc * 0.9) * 0.35, 0.18, z]), 0.009, disc * 0.55);
  }
  taperedCylinder(root, 'BIOCHEM__B4__POLARIZING_SENSOR_AXIS', 0.42, 0.16, 2.0, 12, m.opalGlass, [0, 6.65, 0]);
  return root;
}

function createEvozymeLoop(record: BiochemistryBuildingProgram, m: BiochemistryMaterials) {
  const root = new THREE.Group(); root.name = 'BIOCHEM__B5__EVOZYME_LOOP';
  box(root, 'BIOCHEM__B5__AUTONOMOUS_FOUNDRY_SUBSTRATE', [21.2, 0.38, 9.5], m.basalt, [0, 0.19, 0], true);
  const loops = [{ name: 'DESIGN', x: -6.1, z: -2.15 }, { name: 'BUILD', x: 1.6, z: -2.15 }, { name: 'TEST', x: 5.55, z: 2.0 }, { name: 'LEARN', x: -2.2, z: 2.0 }];
  loops.forEach((loop, index) => {
    const width = 7.0; const depth = 3.7; const height = 2.35 + index * 0.26; const material = index === 3 ? m.mirror : index === 2 ? m.pearlCeramic : m.paleCeramic;
    box(root, `BIOCHEM__B5__${loop.name}_LOOP_NORTH`, [width, height, 0.75], material, [loop.x, 0.45 + height * 0.5, loop.z - depth * 0.5], true);
    box(root, `BIOCHEM__B5__${loop.name}_LOOP_SOUTH`, [width, height, 0.75], material, [loop.x, 0.45 + height * 0.5, loop.z + depth * 0.5], true);
    box(root, `BIOCHEM__B5__${loop.name}_LOOP_WEST`, [0.75, height, depth - 0.75], material, [loop.x - width * 0.5, 0.45 + height * 0.5, loop.z], true);
    box(root, `BIOCHEM__B5__${loop.name}_LOOP_EAST`, [0.75, height, depth - 0.75], material, [loop.x + width * 0.5, 0.45 + height * 0.5, loop.z], true);
    cylinder(root, `BIOCHEM__B5__${loop.name}_CIRCULAR_SKYLIGHT`, 2.05, 0.16, index % 2 ? m.opalGlass : m.darkGlass, [loop.x, 0.58 + height, loop.z], false, 32);
    for (let bay = 0; bay < 9; bay += 1) box(root, `BIOCHEM__B5__${loop.name}_MODULAR_FACADE_BAY_${bay + 1}`, [0.42, 1.2 + (bay % 3) * 0.24, 0.08], bay % 4 === 0 ? m.darkGlass : m.titanium, [loop.x - 2.9 + bay * 0.72, 1.2, loop.z + depth * 0.52]);
  });
  const rail = [new THREE.Vector3(-9.4, 3.65, -4.15), new THREE.Vector3(9.3, 3.65, -4.15), new THREE.Vector3(9.3, 3.65, 4.15), new THREE.Vector3(-9.4, 3.65, 4.15), new THREE.Vector3(-9.4, 3.65, -4.15)];
  rail.slice(0, -1).forEach((point, index) => slabBetween(root, `BIOCHEM__B5__ELEVATED_SAMPLE_RAIL_${index + 1}`, point, rail[index + 1], 0.16, 0.18, m.iridium));
  for (let tower = 0; tower < 4; tower += 1) {
    const point = rail[tower]; cylinder(root, `BIOCHEM__B5__TRANSPARENT_TRANSFER_TOWER_${tower + 1}`, 0.85, 3.8, m.opalGlass, [point.x, 1.95, point.z], true, 12);
    const flash = pulse(ellipsoid(root, `BIOCHEM__B5__VERTICAL_CAPSULE_FLASH_${tower + 1}`, [0.19, 0.35, 0.19], m.warmLight.clone(), [point.x, 0.72, point.z]), 0.025, tower * 0.23);
    flash.userData.animate = 'biochemistry-vertical-transit'; flash.userData.baseY = 0.72; flash.userData.travel = 2.65; flash.userData.speed = 0.025; flash.userData.phase = tower * 0.24;
  }
  for (let carrier = 0; carrier < 8; carrier += 1) {
    const capsule = ellipsoid(root, `BIOCHEM__B5__SEALED_SAMPLE_CARRIER_${carrier + 1}`, [0.32, 0.22, 0.5], carrier % 2 ? m.coldLight.clone() : m.warmLight.clone(), rail[0].toArray() as [number, number, number]);
    capsule.userData.animate = 'biochemistry-path-transit'; capsule.userData.path = rail.map((point) => point.toArray()); capsule.userData.speed = 0.0045 + carrier * 0.00015; capsule.userData.phase = carrier / 8;
  }
  torus(root, 'BIOCHEM__B5__FEEDBACK_RECONNECTION_PORTAL', 2.05, 0.28, m.titanium, [0, 2.4, 4.82], [0, 0, 0]);
  for (let blade = 0; blade < 34; blade += 1) {
    const x = -4.2 + blade * 0.255; const panel = box(root, `BIOCHEM__B5__KINETIC_ENTRY_BLADE_${blade + 1}`, [0.055, 2.25, 0.28], blade % 6 === 0 ? m.warmLight.clone() : m.titanium, [x, 2.5, 4.48]);
    panel.userData.animate = 'biochemistry-kinetic-blade'; panel.userData.baseRotationY = 0; panel.userData.phase = blade * 0.24;
  }
  return root;
}

function createCoacervum(record: BiochemistryBuildingProgram, m: BiochemistryMaterials) {
  const root = new THREE.Group(); root.name = 'BIOCHEM__B6__COACERVUM';
  box(root, 'BIOCHEM__B6__DROPLET_SUBSTRATE', [15.6, 0.28, 10.9], m.basalt, [0, 0.14, 0], true);
  const masses = [[-3.8, 1.7, -1.1, 3.8, 1.75, 3.0], [0, 2.1, -0.5, 4.25, 2.15, 3.4], [3.9, 1.65, 0.1, 3.25, 1.65, 2.8], [-1.7, 1.4, 2.5, 3.6, 1.35, 2.5], [2.2, 1.25, 2.65, 2.7, 1.2, 2.2]] as const;
  masses.forEach(([x, y, z, sx, sy, sz], index) => {
    ellipsoid(root, `BIOCHEM__B6__MERGED_CONDENSATE_MASS_${index + 1}`, [sx, sy, sz], index < 2 ? m.opalGlass : index === 4 ? m.darkGlass : m.pearlCeramic, [x, y, z], true);
    for (let bead = 0; bead < 7; bead += 1) pulse(ellipsoid(root, `BIOCHEM__B6__DENSE_PHASE_MICROBEAD_${index + 1}_${bead + 1}`, [0.12 + (bead % 2) * 0.05, 0.12, 0.12], bead % 3 === 0 ? m.fluxLight.clone() : m.coldLight.clone(), [x + Math.sin(bead * 2.1) * sx * 0.62, y + Math.cos(bead * 1.2) * sy * 0.45, z + Math.cos(bead * 1.9) * sz * 0.62]), 0.007 + index * 0.001, bead * 0.58 + index);
  });
  for (let satellite = 0; satellite < 4; satellite += 1) ellipsoid(root, `BIOCHEM__B6__PHASE_SEPARATED_SATELLITE_${satellite + 1}`, [0.72 + satellite * 0.15, 0.58 + satellite * 0.08, 0.68 + satellite * 0.12], satellite % 2 ? m.darkGlass : m.opalGlass, [-6.3 + satellite * 4.25, 0.85 + satellite * 0.12, -4.25 + (satellite % 2) * 0.5], true);
  const canopyY = 4.0;
  for (let panel = 0; panel < 16; panel += 1) {
    const angle = panel * Math.PI * 2 / 16; const radius = panel % 2 ? 4.9 : 3.65; const x = Math.cos(angle) * radius; const z = 4.8 + Math.sin(angle) * radius * 0.42;
    cylinder(root, `BIOCHEM__B6__SUSPENDED_CANOPY_APERTURE_RING_${panel + 1}`, 1.15 + (panel % 4) * 0.18, 0.11, panel % 3 === 0 ? m.opalGlass : m.titanium, [x, canopyY, z], false, 24);
    if (panel % 3 === 0) pipe(root, `BIOCHEM__B6__IRREGULAR_CANOPY_COLUMN_${panel + 1}`, new THREE.Vector3(x, 0.18, z), new THREE.Vector3(x + Math.sin(panel) * 0.25, canopyY - 0.08, z), 0.045, m.titanium, true);
  }
  cylinder(root, 'BIOCHEM__B6__RETENTION_DROPLET_BASIN', 7.2, 0.07, m.water, [-4.8, 0.06, 5.1], false, 32);
  for (let sphere = 0; sphere < 12; sphere += 1) {
    const marker = pulse(ellipsoid(root, `BIOCHEM__B6__FLOATING_METALLIC_CONDENSATE_${sphere + 1}`, [0.18 + (sphere % 3) * 0.05, 0.18, 0.18], sphere % 4 === 0 ? m.fluxLight.clone() : m.mirror, [-7.3 + (sphere % 6) * 0.9, 0.22, 4.35 + Math.floor(sphere / 6) * 1.05]), 0.006, sphere * 0.71);
    marker.userData.animate = 'biochemistry-phase-drift'; marker.userData.baseX = marker.position.x; marker.userData.baseZ = marker.position.z; marker.userData.phase = sphere * 0.53;
  }
  pipe(root, 'BIOCHEM__B6__OBSERVATION_MAST', new THREE.Vector3(0, 3.5, -0.35), new THREE.Vector3(0, 6.15, -0.35), 0.11, m.iridium);
  for (let ring = 0; ring < 7; ring += 1) torus(root, `BIOCHEM__B6__DISSOLVING_MAST_RING_${ring + 1}`, 0.72 - ring * 0.07, 0.05 - ring * 0.004, ring % 2 ? m.titanium : m.coldLight.clone(), [0, 5.2 + ring * 0.2, -0.35]);
  return root;
}

function createGlycanCipher(record: BiochemistryBuildingProgram, m: BiochemistryMaterials) {
  const root = new THREE.Group(); root.name = 'BIOCHEM__B7__GLYCAN_CIPHER';
  box(root, 'BIOCHEM__B7__BASALT_BRANCHING_BASE', [8.6, 0.42, 6.8], m.basalt, [0, 0.21, 0], true);
  box(root, 'BIOCHEM__B7__SMOKE_GLASS_CENTRAL_TRUNK', [3.4, 6.35, 3.2], m.darkGlass, [0, 3.5, 0], true);
  for (let level = 0; level < 10; level += 1) {
    const radius = 2.05 + (level % 3) * 0.16; torus(root, `BIOCHEM__B7__SUGAR_RING_EXOSKELETON_${level + 1}`, radius, 0.095, level % 3 === 0 ? m.pearlCeramic : m.titanium, [0, 0.72 + level * 0.62, 0]);
    for (let node = 0; node < 6; node += 1) ellipsoid(root, `BIOCHEM__B7__PEARLESCENT_RING_NODE_${level + 1}_${node + 1}`, [0.16, 0.16, 0.16], node % 3 === 0 ? m.coldLight.clone() : m.pearlCeramic, [Math.cos(node * Math.PI / 3) * radius, 0.72 + level * 0.62, Math.sin(node * Math.PI / 3) * radius]);
  }
  const branches = [{ y: 2.0, side: -1, z: 0.45 }, { y: 3.1, side: 1, z: -0.35 }, { y: 4.15, side: -1, z: -0.5 }, { y: 5.25, side: 1, z: 0.4 }, { y: 6.2, side: -1, z: 0.2 }];
  branches.forEach((branch, index) => {
    const start = new THREE.Vector3(branch.side * 1.45, branch.y, branch.z); const joint = new THREE.Vector3(branch.side * 3.15, branch.y + 0.28, branch.z + (index % 2 ? 0.8 : -0.8)); const end = new THREE.Vector3(branch.side * 4.35, branch.y + 0.72, branch.z + (index % 2 ? 1.35 : -1.35));
    slabBetween(root, `BIOCHEM__B7__PRIMARY_GLYCAN_BRANCH_${index + 1}`, start, joint, 0.72, 0.78, m.pearlCeramic, true);
    slabBetween(root, `BIOCHEM__B7__SECONDARY_GLYCAN_BRANCH_${index + 1}`, joint, end, 0.58, 0.62, m.titanium, true);
    taperedCylinder(root, `BIOCHEM__B7__TERMINAL_GLYCAN_MODULE_${index + 1}`, 1.65, 1.35, 1.25, index % 2 ? 5 : 6, m.paleCeramic, end.toArray() as [number, number, number], true, [Math.PI / 2, 0, 0]);
    pulse(ellipsoid(root, `BIOCHEM__B7__TERMINAL_MODIFICATION_LIGHT_${index + 1}`, [0.2, 0.2, 0.2], index % 2 ? m.warmLight.clone() : m.fluxLight.clone(), [end.x, end.y, end.z + 0.72]), 0.009, index * 0.8);
  });
  for (let fin = 0; fin < 18; fin += 1) box(root, `BIOCHEM__B7__BRANCHING_CROWN_FIN_${fin + 1}`, [0.08, 1.05 + (fin % 4) * 0.18, 0.24], fin % 4 === 0 ? m.coldLight.clone() : m.titanium, [-2.0 + fin * 0.235, 7.1 + (fin % 3) * 0.08, 0], false, [0, fin * 0.17, 0]);
  pipe(root, 'BIOCHEM__B7__STACKED_RING_ANTENNA', new THREE.Vector3(0, 6.55, 0), new THREE.Vector3(0, 8.05, 0), 0.09, m.iridium);
  return root;
}

function createProteostasisCitadel(record: BiochemistryBuildingProgram, m: BiochemistryMaterials) {
  const root = new THREE.Group(); root.name = 'BIOCHEM__B8__PROTEOSTASIS_CITADEL';
  cylinder(root, 'BIOCHEM__B8__HEAVY_BASALT_FOLDING_BASE', 11.2, 0.48, m.basalt, [0, 0.24, 0], true, 32);
  cylinder(root, 'BIOCHEM__B8__PROTECTED_FOLDING_CHAMBER', 5.4, 5.8, m.pearlCeramic, [0, 3.3, 0], true, 24);
  for (let panel = 0; panel < 28; panel += 1) {
    const angle = panel * Math.PI * 2 / 28; const ordered = panel / 27; const radius = 2.76; const width = 0.42 - ordered * 0.12;
    box(root, `BIOCHEM__B8__ORDERING_FOLD_PANEL_${panel + 1}`, [width, 1.25 + ordered * 1.6, 0.18], panel < 14 ? m.iridium : m.paleCeramic, [Math.cos(angle) * radius, 1.25 + (panel % 4) * 0.62, Math.sin(angle) * radius], false, [0.08 * Math.sin(panel), -angle, panel < 14 ? 0.16 * Math.sin(panel * 1.7) : 0]);
  }
  torus(root, 'BIOCHEM__B8__HEAVY_LOWER_CHAPERONE_RING', 4.6, 0.48, m.charcoal, [0, 2.05, 0]);
  const upperRing = torus(root, 'BIOCHEM__B8__PALE_UPPER_QUALITY_RING', 3.85, 0.28, m.titanium, [0, 5.2, 0]); rotate(upperRing, 0.018);
  for (let bridge = 0; bridge < 8; bridge += 1) {
    const angle = bridge * Math.PI * 2 / 8; pipe(root, `BIOCHEM__B8__RADIAL_CHAMBER_BRIDGE_${bridge + 1}`, new THREE.Vector3(Math.cos(angle) * 2.65, bridge % 2 ? 5.2 : 2.05, Math.sin(angle) * 2.65), new THREE.Vector3(Math.cos(angle) * (bridge % 2 ? 3.85 : 4.6), bridge % 2 ? 5.2 : 2.05, Math.sin(angle) * (bridge % 2 ? 3.85 : 4.6)), 0.15, m.titanium, true);
    const louver = box(root, `BIOCHEM__B8__REGULATING_RING_LOUVER_${bridge + 1}`, [1.25, 0.12, 0.42], bridge % 2 ? m.coldLight.clone() : m.paleCeramic, [Math.cos(angle) * 3.85, 4.95, Math.sin(angle) * 3.85], false, [0, -angle, 0]);
    louver.userData.animate = 'biochemistry-kinetic-blade'; louver.userData.baseRotationY = -angle; louver.userData.phase = bridge * 0.72;
  }
  const wings = [{ x: -4.8, z: 3.3, mat: m.mirror, name: 'FOLDING_STABILIZATION' }, { x: 4.8, z: 3.3, mat: m.charcoal, name: 'RECOGNITION_SORTING' }, { x: 0, z: -5.1, mat: m.iridium, name: 'DEGRADATION_RECYCLING' }];
  wings.forEach((wing, index) => box(root, `BIOCHEM__B8__${wing.name}_WING`, [4.1, 2.05, 3.5], wing.mat, [wing.x, 1.25, wing.z], true, [0, index === 2 ? 0 : index ? -0.35 : 0.35, 0]));
  box(root, 'BIOCHEM__B8__MIDHEIGHT_ORDER_TRANSITION_BAND', [5.65, 0.34, 5.65], m.darkGlass, [0, 3.35, 0]);
  cylinder(root, 'BIOCHEM__B8__SUSPENDED_CHAMBER_CAP', 5.9, 0.28, m.paleCeramic, [0, 6.35, 0], false, 32);
  return root;
}

function createChronocatalysisSpire(record: BiochemistryBuildingProgram, m: BiochemistryMaterials) {
  const root = new THREE.Group(); root.name = 'BIOCHEM__B9__CHRONOCATALYSIS_SPIRE';
  box(root, 'BIOCHEM__B9__BLACK_OPTICAL_PODIUM', [6.8, 0.72, 5.8], m.basalt, [0, 0.36, 0], true);
  box(root, 'BIOCHEM__B9__REACTION_COORDINATE_HALF_WEST', [2.25, 8.8, 2.3], m.charcoal, [-1.38, 5.05, 0], true, [0, 0, -0.035]);
  box(root, 'BIOCHEM__B9__REACTION_COORDINATE_HALF_EAST', [2.25, 8.8, 2.3], m.mirror, [1.38, 5.05, 0], true, [0, 0, 0.035]);
  box(root, 'BIOCHEM__B9__MIRRORED_VERTICAL_REACTION_SLIT', [0.48, 8.5, 2.38], m.darkGlass, [0, 5.15, 0]);
  for (let band = 0; band < 18; band += 1) {
    const t = band / 17; const y = 1.15 + Math.pow(t, 0.68) * 8.15; const width = 2.12 - Math.abs(t - 0.52) * 0.4;
    pulse(box(root, `BIOCHEM__B9__LOGARITHMIC_TIME_BAND_WEST_${band + 1}`, [width, 0.055, 0.09], band % 4 === 0 ? m.warmLight.clone() : m.titanium, [-1.38, y, 1.2]), 0.019, band * 0.22);
    box(root, `BIOCHEM__B9__LOGARITHMIC_TIME_BAND_EAST_${band + 1}`, [width, 0.055, 0.09], m.iridium, [1.38, y, 1.2]);
  }
  for (let fin = 0; fin < 20; fin += 1) {
    const side = fin % 2 ? 1 : -1; const level = Math.floor(fin / 2); const y = 1.3 + Math.pow(level / 9, 0.72) * 7.4;
    box(root, `BIOCHEM__B9__LOGARITHMIC_OPTICAL_FIN_${fin + 1}`, [0.12 + level * 0.018, 0.48 + level * 0.05, 1.35], fin % 5 === 0 ? m.coldLight.clone() : m.titanium, [side * 2.58, y, 0], false, [0, 0, side * (0.08 + level * 0.008)]);
  }
  [2.1, 3.5, 5.25, 7.35].forEach((y, index) => slabBetween(root, `BIOCHEM__B9__TRANSPARENT_STATE_BRIDGE_${index + 1}`, new THREE.Vector3(-0.48, y, 0), new THREE.Vector3(0.48, y, 0), 0.82, 0.22, m.opalGlass));
  taperedCylinder(root, 'BIOCHEM__B9__CROWN_CAP_WEST', 2.25, 0.7, 1.2, 4, m.charcoal, [-1.55, 10.02, 0], true, [0, 0, -0.14]);
  taperedCylinder(root, 'BIOCHEM__B9__CROWN_CAP_EAST', 2.25, 0.7, 1.2, 4, m.mirror, [1.55, 10.02, 0], true, [0, 0, 0.14]);
  const crystal = pulse(taperedCylinder(root, 'BIOCHEM__B9__SUSPENDED_TRANSITION_CRYSTAL', 0.85, 0.18, 1.65, 6, m.coldLight.clone(), [0, 10.25, 0]), 0.03, 0.2, 0.8, 5.2); rotate(crystal, 0.08);
  for (let cable = 0; cable < 4; cable += 1) pipe(root, `BIOCHEM__B9__CRYSTAL_TENSION_CABLE_${cable + 1}`, new THREE.Vector3(0, 10.25, 0), new THREE.Vector3(cable % 2 ? 2.1 : -2.1, 10.55, cable < 2 ? 0.72 : -0.72), 0.022, m.titanium);
  box(root, 'BIOCHEM__B9__TRANSITION_STATE_PLAZA_LINE', [0.12, 0.025, 7.2], m.titanium, [0, 0.1, 6.0]);
  pulse(cylinder(root, 'BIOCHEM__B9__TRANSITION_STATE_NODE', 0.72, 0.07, m.warmLight.clone(), [0, 0.14, 3.8], false, 24), 0.012, 0.3);
  return root;
}

function createFerrumVitaForge(record: BiochemistryBuildingProgram, m: BiochemistryMaterials) {
  const root = new THREE.Group(); root.name = 'BIOCHEM__B10__FERRUM_VITA_FORGE';
  box(root, 'BIOCHEM__B10__IRON_RICH_FORGE_SUBSTRATE', [28.2, 0.48, 13.4], m.basalt, [0, 0.24, 0], true);
  box(root, 'BIOCHEM__B10__INDUSTRIAL_CATHEDRAL_MAIN_HALL', [20.5, 4.85, 6.4], m.weatheringSteel, [-1.6, 2.82, 0], true);
  for (let bay = 0; bay < 18; bay += 1) {
    box(root, `BIOCHEM__B10__MAIN_HALL_VERTICAL_RIB_${bay + 1}`, [0.16, 4.35, 0.28], bay % 5 === 0 ? m.warmLight.clone() : m.iridium, [-11.2 + bay * 1.12, 2.95, 3.28]);
    if (bay < 17) box(root, `BIOCHEM__B10__CONTAINED_AMBER_ENERGY_BAY_${bay + 1}`, [0.52, 2.5 + (bay % 3) * 0.32, 0.08], bay % 4 === 0 ? m.warmLight.clone() : m.darkGlass, [-10.62 + bay * 1.12, 2.55, 3.34]);
  }
  for (let ridge = 0; ridge < 6; ridge += 1) box(root, `BIOCHEM__B10__METALLOPROTEIN_ROOF_RIDGE_${ridge + 1}`, [3.1, 0.45 + ridge * 0.08, 6.7], ridge % 2 ? m.charcoal : m.weatheringSteel, [-9.2 + ridge * 3.05, 5.35 + (ridge % 3) * 0.24, 0]);
  const towerSpecs = [{ x: -9.4, z: -4.1, h: 6.5 }, { x: 0.2, z: -4.4, h: 7.4 }, { x: 10.1, z: -3.9, h: 8.2 }];
  towerSpecs.forEach((tower, index) => {
    cylinder(root, `BIOCHEM__B10__METALLOCLUSTER_CORE_${index + 1}`, 2.05, tower.h, index === 2 ? m.darkGlass : m.iridium, [tower.x, tower.h * 0.5 + 0.48, tower.z], true, 12);
    const cageY = tower.h + 0.4;
    const nodes: THREE.Vector3[] = [];
    for (let node = 0; node < 8; node += 1) {
      const angle = node * Math.PI * 2 / 8; const point = new THREE.Vector3(tower.x + Math.cos(angle) * 1.65, cageY + (node % 2 ? 0.72 : -0.45), tower.z + Math.sin(angle) * 1.65); nodes.push(point);
      pulse(ellipsoid(root, `BIOCHEM__B10__CLUSTER_NODE_${index + 1}_${node + 1}`, [0.22, 0.22, 0.22], node % 3 === 0 ? m.warmLight.clone() : m.titanium, point.toArray() as [number, number, number]), 0.014, index * 1.2 + node * 0.28);
    }
    nodes.forEach((point, node) => { pipe(root, `BIOCHEM__B10__POLYHEDRAL_CAGE_EDGE_${index + 1}_${node + 1}`, point, nodes[(node + 1) % nodes.length], 0.07, m.titanium); pipe(root, `BIOCHEM__B10__COORDINATING_LIGAND_${index + 1}_${node + 1}`, point, new THREE.Vector3(tower.x, cageY + 0.15, tower.z), 0.045, m.iridium); });
    pulse(ellipsoid(root, `BIOCHEM__B10__SUSPENDED_CATALYTIC_ATOM_${index + 1}`, [0.42, 0.42, 0.42], m.warmLight.clone(), [tower.x, cageY + 0.15, tower.z]), 0.02, index * 0.9, 0.4, 5);
  });
  const cascades = [-9.2, -3.4, 2.4, 8.2];
  cascades.forEach((x, index) => {
    box(root, `BIOCHEM__B10__CELL_FREE_CASCADE_HALL_${index + 1}`, [4.8, 2.0 + index * 0.24, 3.2], index < 2 ? m.charcoal : m.weatheringSteel, [x, 1.35 + index * 0.12, 5.0], true);
    cylinder(root, `BIOCHEM__B10__COFACTOR_INSPECTION_MODULE_${index + 1}`, 0.95, 0.72, index % 2 ? m.mirror : m.titanium, [x + 2.55, 2.45 + index * 0.2, 5.0], false, 24, [Math.PI / 2, 0, 0]);
    if (index < cascades.length - 1) pipe(root, `BIOCHEM__B10__ENCLOSED_CASCADE_PIPE_${index + 1}`, new THREE.Vector3(x + 2.4, 2.7 + index * 0.2, 5.0), new THREE.Vector3(cascades[index + 1] - 2.4, 2.9 + index * 0.2, 5.0), 0.19, index % 2 ? m.titanium : m.iridium);
  });
  for (let stack = 0; stack < 9; stack += 1) {
    const x = -9.5 + stack * 2.35; cylinder(root, `BIOCHEM__B10__HEAT_RECOVERY_STACK_${stack + 1}`, 0.65 + (stack % 3) * 0.12, 1.6 + (stack % 4) * 0.42, stack % 2 ? m.titanium : m.iridium, [x, 6.0 + (stack % 4) * 0.2, -0.6 + (stack % 3) * 0.7], false, 12);
  }
  torus(root, 'BIOCHEM__B10__CATALYTIC_ENTRY_ARCH', 2.45, 0.42, m.iridium, [0, 2.7, 3.55], [0, 0, 0], Math.PI);
  const core = ellipsoid(root, 'BIOCHEM__B10__SUSPENDED_ACTIVE_SITE_CORE', [0.62, 0.62, 0.62], m.charcoal, [0, 3.0, 3.72]);
  for (let ligand = 0; ligand < 7; ligand += 1) pipe(root, `BIOCHEM__B10__ACTIVE_SITE_LIGAND_${ligand + 1}`, core.position, new THREE.Vector3(Math.cos(ligand * Math.PI * 2 / 7) * 1.55, 3.0 + Math.sin(ligand) * 0.35, 3.72 + Math.sin(ligand * Math.PI * 2 / 7) * 1.3), 0.07, ligand % 2 ? m.titanium : m.warmLight.clone());
  for (let line = 0; line < 2; line += 1) slabBetween(root, `BIOCHEM__B10__REDOX_COURT_PATH_${line + 1}`, new THREE.Vector3(line ? 0.35 : -0.35, 0.08, 9.2), new THREE.Vector3(line ? -0.45 : 0.45, 0.08, 3.6), 0.17, 0.04, line ? m.iridium : m.weatheringSteel);
  return root;
}

function assignBuildingMetadata(root: THREE.Group, record: BiochemistryBuildingProgram) {
  root.userData.exteriorProgram = true;
  root.userData.buildingCode = record.code;
  root.userData.buildingName = record.name;
  root.userData.buildingSubtitle = record.subtitle;
  root.userData.purpose = record.purpose;
  root.userData.footprintMetres = [...record.footprintMetres];
  root.userData.heightMetres = record.heightMetres;
  root.userData.exteriorMotif = record.exteriorMotif;
  root.userData.navObstacle = true;
  root.traverse((object) => { object.userData.selectableId = DISTRICT_ID; object.userData.districtId = DISTRICT_ID; });
  return root;
}

function createBuilding(record: BiochemistryBuildingProgram, m: BiochemistryMaterials) {
  let root: THREE.Group;
  if (record.form === 'aminoform') root = createAminoformFoundry(record, m);
  else if (record.form === 'cryostratum') root = createCryostratum(record, m);
  else if (record.form === 'metabolome') root = createMetabolomeAtlas(record, m);
  else if (record.form === 'vesica') root = createVesicaGenesis(record, m);
  else if (record.form === 'evozyme') root = createEvozymeLoop(record, m);
  else if (record.form === 'coacervum') root = createCoacervum(record, m);
  else if (record.form === 'glycan') root = createGlycanCipher(record, m);
  else if (record.form === 'proteostasis') root = createProteostasisCitadel(record, m);
  else if (record.form === 'chronocatalysis') root = createChronocatalysisSpire(record, m);
  else root = createFerrumVitaForge(record, m);
  return assignBuildingMetadata(root, record);
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radialMargin = 8.2; const angularMargin = (sector.endAngle - sector.startAngle) * 0.075;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT); const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
  return new THREE.Vector3(Math.cos(angle) * radius - definition.position[0], y, Math.sin(angle) * radius - definition.position[2]);
}

function districtArc(definition: DistrictDefinition, radialT: number, startAngularT: number, endAngularT: number, segments: number, y = FLOOR_Y) {
  return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, radialT, THREE.MathUtils.lerp(startAngularT, endAngularT, index / (segments - 1)), y));
}

function districtSpine(definition: DistrictDefinition, angularT: number, startRadialT: number, endRadialT: number, segments: number, y = FLOOR_Y) {
  return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, THREE.MathUtils.lerp(startRadialT, endRadialT, index / (segments - 1)), angularT, y));
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
  const ribbon = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), material), name); ribbon.userData.walkable = walkable; ribbon.userData.navObstacle = false; ribbon.userData.biochemistryRoute = true; ribbon.receiveShadow = true; parent.add(ribbon); return ribbon;
}

function offsetPath(points: readonly THREE.Vector3[], offset: number, modulation: number, frequency: number) {
  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x); const t = index / Math.max(1, points.length - 1);
    return point.clone().addScaledVector(normal, offset + Math.sin(t * Math.PI * frequency) * modulation).setY(FLOOR_Y + 0.027);
  });
}

function addDistrictInfrastructure(district: THREE.Group, definition: DistrictDefinition, m: BiochemistryMaterials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'BIOCHEM__REACTION_GRADIENT_INFRASTRUCTURE';
  const reactionGradient = districtArc(definition, 0.5, 0.02, 0.98, 112); addRibbon(infrastructure, 'BIOCHEM__REACTION_GRADIENT', reactionGradient, 1.85, m.darkPaving);
  [-0.27, 0, 0.27].forEach((offset, index) => pulse(addRibbon(infrastructure, `BIOCHEM__REACTION_FLUX_TRACE_${index + 1}`, offsetPath(reactionGradient, offset, 0.08 + index * 0.03, 5 + index), 0.045, [m.coldLight, m.fluxLight, m.warmLight][index].clone(), false), 0.011 + index * 0.001, index * 0.8));
  [0.12, 0.37, 0.63, 0.88].forEach((angularT, index) => {
    const spine = districtSpine(definition, angularT, 0.03, 0.97, 58); addRibbon(infrastructure, `BIOCHEM__DISTRICT_INTERFACE_LINK_${index + 1}`, spine, 0.76, index < 2 ? m.palePaving : m.darkPaving);
    pulse(addRibbon(infrastructure, `BIOCHEM__INTERFACE_REACTION_SIGNAL_${index + 1}`, offsetPath(spine, 0, 0.07, 3 + index), 0.038, index < 2 ? m.coldLight.clone() : m.warmLight.clone(), false), 0.013, index * 0.61);
  });
  const utilitySpine = districtArc(definition, 0.965, 0.04, 0.96, 96); addRibbon(infrastructure, 'BIOCHEM__OUTER_UTILITY_SPINE', utilitySpine, 0.92, m.charcoal);
  for (let plaza = 0; plaza < 8; plaza += 1) {
    const point = pointInDistrict(definition, plaza % 2 ? 0.43 : 0.58, 0.075 + plaza * 0.122, FLOOR_Y);
    cylinder(infrastructure, `BIOCHEM__CIRCULAR_REACTION_PLAZA_${plaza + 1}`, 3.1 + (plaza % 3) * 0.35, 0.07, plaza < 4 ? m.palePaving : m.darkPaving, [point.x, FLOOR_Y + 0.04, point.z], false, 24);
    for (let node = 0; node < 6; node += 1) pulse(cylinder(infrastructure, `BIOCHEM__PLAZA_MOLECULAR_NODE_${plaza + 1}_${node + 1}`, 0.16, 0.06, node % 3 === 0 ? m.fluxLight.clone() : m.titanium, [point.x + Math.cos(node * Math.PI / 3) * 1.05, FLOOR_Y + 0.1, point.z + Math.sin(node * Math.PI / 3) * 1.05], false, 12), 0.009, plaza + node * 0.4);
  }
  district.add(infrastructure); return { infrastructure, reactionGradient };
}

function addDistrictLandscape(district: THREE.Group, definition: DistrictDefinition, m: BiochemistryMaterials) {
  const landscape = new THREE.Group(); landscape.name = 'BIOCHEM__MOLECULAR_REACTION_LANDSCAPE';
  for (let patch = 0; patch < 30; patch += 1) {
    const point = pointInDistrict(definition, patch % 2 ? 0.2 : 0.84, 0.045 + Math.floor(patch / 2) * 0.065, FLOOR_Y); const diameter = 0.9 + (patch % 5) * 0.18;
    cylinder(landscape, `BIOCHEM__SEQUENCE_FIELD_${patch + 1}`, diameter, 0.08, patch % 4 === 0 ? m.moss : patch % 4 === 1 ? m.grass : patch % 4 === 2 ? m.palePaving : m.darkPaving, [point.x, 0.08, point.z], false, patch % 3 === 0 ? 12 : 24);
    if (patch % 3 === 0) ellipsoid(landscape, `BIOCHEM__MOLECULAR_SIDE_CHAIN_STONE_${patch + 1}`, [0.22 + (patch % 4) * 0.05, 0.18, 0.2], patch % 2 ? m.titanium : m.pearlCeramic, [point.x + 0.42, 0.22, point.z - 0.2]);
  }
  for (let channel = 0; channel < 6; channel += 1) {
    const points = districtSpine(definition, 0.06 + channel * 0.176, 0.35, 0.61, 22); addRibbon(landscape, `BIOCHEM__MICROFLUIDIC_WATER_CHANNEL_${channel + 1}`, offsetPath(points, 0, 0.18, 2 + channel), 0.2, m.water, false);
  }
  for (let mast = 0; mast < 14; mast += 1) {
    const point = pointInDistrict(definition, mast % 2 ? 0.28 : 0.79, 0.075 + Math.floor(mast / 2) * 0.14, FLOOR_Y);
    pipe(landscape, `BIOCHEM__ENVIRONMENTAL_REACTION_SAMPLER_${mast + 1}`, point.clone().setY(0.1), point.clone().setY(0.9 + (mast % 4) * 0.22), 0.045, m.titanium);
    pulse(ellipsoid(landscape, `BIOCHEM__SAMPLER_STATUS_NODE_${mast + 1}`, [0.09, 0.09, 0.09], mast < 7 ? m.coldLight.clone() : m.warmLight.clone(), [point.x, 0.95 + (mast % 4) * 0.22, point.z]), 0.012, mast * 0.33);
  }
  district.add(landscape); return landscape;
}

export function buildBiochemistryLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Biochemistry Labs District requires a masterplan sector');
  const materials = createBiochemistryMaterials(); const { infrastructure, reactionGradient } = addDistrictInfrastructure(district, definition, materials); const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = BIOCHEMISTRY_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials); const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02); building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT }; district.add(building); return building;
  });
  facilities.forEach((facility, index) => {
    const record = BIOCHEMISTRY_BUILDING_PROGRAM[index]; const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, record.footprintMetres[1] / 20 + 0.85); const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const routePoint = reactionGradient.reduce((closest, point) => point.distanceToSquared(entrance) < closest.distanceToSquared(entrance) ? point : closest, reactionGradient[0]); const approachPoints = [routePoint.clone(), routePoint.clone().lerp(entrance, 0.5), entrance];
    addRibbon(infrastructure, `BIOCHEM__BUILDING_APPROACH_${record.code}`, approachPoints, 0.78, index < 5 ? materials.palePaving : materials.darkPaving);
    pulse(addRibbon(infrastructure, `BIOCHEM__BUILDING_APPROACH_SIGNAL_${record.code}`, approachPoints.map((point) => point.clone().setY(FLOOR_Y + 0.027)), 0.04, index < 3 ? materials.coldLight.clone() : index < 7 ? materials.fluxLight.clone() : materials.warmLight.clone(), false), 0.013, index * 0.47);
  });
  district.userData.biochemistryLabsDistrict = {
    identity: 'Biochemistry Labs District', architecturalLanguage: 'a molecular-to-industrial Reaction Gradient expressed through carbon-black basalt, pale vitrified ceramic, satin titanium, iridium-coated steel, smoke-grey electrochromic glass, visible utility spines, and catalytic light', buildingCount: facilities.length,
    buildings: BIOCHEMISTRY_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, subtitle: record.subtitle, purpose: record.purpose, placementZone: record.placementZone, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorMotif: record.exteriorMotif })),
    progression: ['sequence and protein form', 'native molecular machinery', 'spatial metabolic flux', 'synthetic compartments', 'autonomous enzyme evolution', 'phase behavior', 'post-translational modification', 'proteostasis', 'reaction dynamics', 'engineered metabolism'],
    landmarks: { innerThreshold: 'Aminoform Foundry', quietObservatory: 'Cryostratum', civicLandscape: 'Metabolome Atlas and Vesica Genesis', verticalMarker: 'Chronocatalysis Spire', industrialEdge: 'Ferrum Vita Forge' },
    circulation: { primaryWalk: 'BIOCHEM__REACTION_GRADIENT', molecularFluxTraces: 3, controlledInterfaceLinks: 4, outerUtilitySpine: 'BIOCHEM__OUTER_UTILITY_SPINE', exactBuildingApproaches: 10 },
    signatureSystems: { aminoformChains: 3, cryogenicShells: 3, metabolomeTerraces: 5, syntheticVesicles: 7, evozymeLoops: 4, condensateMasses: 5, glycanBranches: 5, proteostasisRings: 2, reactionCoordinateHalves: 2, metalloclusterTowers: 3, advertisingDisplays: false },
    materials: ['carbon-black basalt', 'pale vitrified ceramic', 'satin titanium', 'iridium-coated steel', 'smoke-grey electrochromic glass', 'catalytic amber and molecular cold-white light'], landscape: { sequenceFields: 30, reactionPlazas: 8, microfluidicWaterChannels: 6, environmentalSamplers: 14 }, exteriorOnly: true,
  };
  district.userData.population = { plannedFacilities: BIOCHEMISTRY_BUILDING_PROGRAM.map((record) => record.name), plannedObjects: ['Reaction Gradient', 'Molecular Flux Traces', 'Outer Utility Spine', 'Circular Reaction Plazas', 'Microfluidic Water Channels', 'Environmental Reaction Samplers'], realizedFeatureTags: BIOCHEMISTRY_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')), realizedFacilityCount: facilities.length, realizedObjectCount: infrastructure.children.length + landscape.children.length, distinct: true, asymmetricCampus: true, localRoadCount: 16, radialCoverage: 0.94, angularCoverage: 0.96, exteriorOnly: true, reactionGradientNarrative: true };
}
