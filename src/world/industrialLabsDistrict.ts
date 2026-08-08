import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';
import { metresToWorldUnits } from '../config/island';
import { buildIndustrialDistrict as buildLegacyIndustrialDistrict } from './industrialDistrict';

type IndustrialFacilityForm =
  | 'shift-meridian'
  | 'continuous-works'
  | 'black-kiln'
  | 'vacuum-cathedral'
  | 'loomworks'
  | 'cryogenic'
  | 'additive-yard'
  | 'microfactory-hive'
  | 'biogenic-foundry'
  | 'machine-genesis'
  | 'testing-monolith'
  | 'platform-zero'
  | 'thermal-recovery'
  | 'reclamation'
  | 'building-null';

export interface IndustrialFacilityProgram {
  code: string;
  name: string;
  subtitle: string;
  purpose: string;
  form: IndustrialFacilityForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  productionZone: string;
  exteriorMotif: string;
}

export const INDUSTRIAL_FACILITY_PROGRAM: readonly IndustrialFacilityProgram[] = [
  { code: '01-A', name: 'The Shift Meridian', subtitle: 'Industrial Transit, Credentialing and Personnel Transfer Building', purpose: 'Restricted-zone credentialing, worker transfer, shift release, and enclosed personnel circulation', form: 'shift-meridian', footprintMetres: [200, 48], heightMetres: 14, radialT: 0.12, angularT: 0.08, productionZone: 'Inner credential boundary', exteriorMotif: 'long pale terminal, opaque black glass, aluminium ribs, twelve empty transport bays, three disagreeing clocks, and translucent personnel bridge' },
  { code: '48-CW', name: 'The Continuous Works', subtitle: 'Central Automated Assembly Megahall', purpose: 'Continuous automated assembly and sealed production transfer', form: 'continuous-works', footprintMetres: [700, 90], heightMetres: 48, radialT: 0.89, angularT: 0.50, productionZone: 'Seawall production spine', exteriorMotif: 'colossal forty-eight-bay shed, ceramic lower wall, soot-dark upper plant, sawtooth roof prisms, crane rails, conveyor bridges, and product capsules' },
  { code: '03-EM', name: 'The Black Kiln', subtitle: 'Electromagnetic Foundry and Extreme-Material Production Plant', purpose: 'Electromagnetic foundry work and extreme-material production', form: 'black-kiln', footprintMetres: [118, 96], heightMetres: 80, radialT: 0.88, angularT: 0.29, productionZone: 'Hot-process seawall', exteriorMotif: 'buttressed basalt tower, three external induction rings, glowing structural seams, cooling vessels, transfer conduits, and vitrified slag wall' },
  { code: '04-VC', name: 'The Vacuum Casting Cathedral', subtitle: 'Levitation Casting and Defect-Free Crystal Fabrication Complex', purpose: 'Levitation casting, ultra-pure crystal growth, optical-material production, and vacuum fabrication', form: 'vacuum-cathedral', footprintMetres: [120, 105], heightMetres: 75, radialT: 0.88, angularT: 0.08, productionZone: 'Vacuum process edge', exteriorMotif: 'three mirror vessels, monumental external ribs, pressure rings, symmetric pipe lattice, circular doors, lifting arches, and condensation halo' },
  { code: '05-MW', name: 'The Metamaterial Loomworks', subtitle: 'Programmable Textile, Adaptive Surface and Structural-Weave Factory', purpose: 'Adaptive surfaces, structural weave, conductive filament, and programmable textile production', form: 'loomworks', footprintMetres: [188, 92], heightMetres: 42, radialT: 0.54, angularT: 0.08, productionZone: 'Adaptive production belt', exteriorMotif: 'folded low hall, interwoven adjustable metal ribbons, six tension towers, transfer tubes, tall narrow doors, wound product cores, and roof test membranes' },
  { code: '06-K', name: 'The Cryogenic Forming Plant', subtitle: 'Superconducting Material, Low-Temperature Machining and Shock-Forming Facility', purpose: 'Low-temperature machining, superconducting material work, and magnetic shock forming', form: 'cryogenic', footprintMetres: [154, 108], heightMetres: 38, radialT: 0.12, angularT: 0.50, productionZone: 'Cold-process inner trench', exteriorMotif: 'part-buried insulated white volumes, vacuum-jacketed pipe loops, three frost tanks, five circular transfer ports, magnetic frames, heated paving, and cryogenic fog' },
  { code: '07-AM', name: 'The Additive Megafabrication Yard', subtitle: 'Large-Scale Robotic Printing and Monolithic Component Factory', purpose: 'Large-scale robotic printing and monolithic component fabrication', form: 'additive-yard', footprintMetres: [220, 152], heightMetres: 38, radialT: 0.54, angularT: 0.29, productionZone: 'Open fabrication belt', exteriorMotif: 'floating thin roof on six pylons, six visible gantry printers, layer-built end walls, retractable screens, feedstock silos, and unfinished lattice samples' },
  { code: '08-36', name: 'The Autonomous Microfactory Hive', subtitle: 'Distributed Precision Manufacturing and Self-Reconfiguring Production Cluster', purpose: 'Distributed precision component, electronics, miniature-machine, and production-tool fabrication', form: 'microfactory-hive', footprintMetres: [178, 152], heightMetres: 32, radialT: 0.54, angularT: 0.71, productionZone: 'Reconfigurable production belt', exteriorMotif: 'thirty-six dark hexagonal cells, rail foundations, overhead utility gantries, segmented umbilicals, status glyphs, heat exchangers, fiducials, and service carriers' },
  { code: '09-BG', name: 'The Biogenic Materials Foundry', subtitle: 'Cultivated Structural Material and Living Composite Production Plant', purpose: 'Cultivated structural materials, fungal composites, bacterial cellulose, and self-healing additives', form: 'biogenic-foundry', footprintMetres: [166, 136], heightMetres: 58, radialT: 0.54, angularT: 0.92, productionZone: 'Temperate-forest transition', exteriorMotif: 'scarred self-healing block, twelve amber bioreactor towers, branching vascular pipes, sterile gravel moat, ultraviolet rings, and curing arcade' },
  { code: '10-MG', name: 'The Machine Genesis Hall', subtitle: 'Machine-Tool Fabrication and Autonomous Factory Construction Facility', purpose: 'Machine-tool production and complete autonomous factory construction', form: 'machine-genesis', footprintMetres: [184, 132], heightMetres: 56, radialT: 0.12, angularT: 0.29, productionZone: 'Calibration and commissioning front', exteriorMotif: 'strict datum-grid hall, nested assembly doors, calibration targets, surveyed apron, modular plinths, two empty gantry cranes, and a robot-renewed facade zone' },
  { code: '11-DT', name: 'The Destructive Testing Monolith', subtitle: 'Structural Failure, Impact and Extreme-Environment Validation Complex', purpose: 'Structural failure, impact, blast, drop, and extreme-environment validation', form: 'testing-monolith', footprintMetres: [174, 152], heightMetres: 120, radialT: 0.12, angularT: 0.92, productionZone: 'Isolated western test field', exteriorMotif: 'scarred drop tower, sacrificial panels, buried blast cells, straight impact rail, target wall, instrument pylons, warning perimeter, and evidence plinths' },
  { code: '0', name: 'Platform Zero', subtitle: 'Subterranean Freight Exchange and Autonomous Rail Terminal', purpose: 'Buried freight exchange, autonomous rail dispatch, and sealed material transfer', form: 'platform-zero', footprintMetres: [500, 138], heightMetres: 30, radialT: 0.54, angularT: 0.50, productionZone: 'Central freight interchange', exteriorMotif: 'thin repetitive canopy over twelve tracks, suspended dispatch bridge, numbered-zero platform, autonomous containers, magnetic cranes, fog, and handless central clock' },
  { code: '13-TR', name: 'The Thermal Recovery and Process Power Station', subtitle: 'District Energy, Waste-Heat Capture and Thermal Redistribution Plant', purpose: 'Process power generation, waste-heat recovery, thermal storage, and district redistribution', form: 'thermal-recovery', footprintMetres: [184, 154], heightMetres: 78, radialT: 0.88, angularT: 0.78, productionZone: 'Ocean-wind heat rejection edge', exteriorMotif: 'perforated turbine block, three skeletal cooling towers, glowing mist columns, pipe-organ manifold, radiator field, thermal tanks, and travelling load bands' },
  { code: '14-CL', name: 'The Closed-Loop Reclamation Works', subtitle: 'Material Recovery, Molecular Separation and Industrial Waste Conversion Complex', purpose: 'Closed-loop recovery, molecular separation, solvent treatment, and industrial waste conversion', form: 'reclamation', footprintMetres: [196, 154], heightMetres: 62, radialT: 0.12, angularT: 0.71, productionZone: 'Inner materials-return front', exteriorMotif: 'fortified stepped separator, cyclone skyline, sealed conveyor bridges, wet intake bays, polished output silos, unidentified pipe colours, and mineralized residue blocks' },
  { code: 'Ø', name: 'Building Ø', subtitle: 'Unlisted Manufacturing Facility', purpose: 'Unlisted flexible reserve production asset', form: 'building-null', footprintMetres: [100, 140], heightMetres: 40, radialT: 0.88, angularT: 0.985, productionZone: 'Extreme ocean-facing exclusion cell', exteriorMotif: 'near-seamless grey-black cuboid, no visible services, enormous featureless door, recessed personnel cut, white gravel moat, double sensor line, and pavement symbol Ø' },
] as const;

const DISTRICT_ID = 'industrial-labs';
const FLOOR_Y = metresToWorldUnits(0.36);
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_6 = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
const UNIT_CYLINDER_8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_20 = new THREE.CylinderGeometry(0.5, 0.5, 1, 20);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 10, 7);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_Z = new THREE.Vector3(0, 0, 1);
const torusCache = new Map<string, THREE.TorusGeometry>();
const signCache = new Map<string, THREE.CanvasTexture>();

function industrialMaterial(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  const value = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.3, ...options });
  value.name = name;
  return value;
}

function createMaterials() {
  const basalt = industrialMaterial('Industrial matte basalt ceramic', '#171c1f', { roughness: 0.86, metalness: 0.16 });
  const graphite = industrialMaterial('Industrial graphite structure', '#252d31', { roughness: 0.68, metalness: 0.58 });
  const black = industrialMaterial('Acoustic suppression black', '#070a0b', { roughness: 0.92, metalness: 0.14 });
  const pale = industrialMaterial('Pale impact ceramic', '#c8c8c1', { roughness: 0.68, metalness: 0.06 });
  const concrete = industrialMaterial('Board-formed process concrete', '#7d8584', { roughness: 0.9, metalness: 0.03 });
  const concreteDark = industrialMaterial('Salt-darkened process concrete', '#41494b', { roughness: 0.9, metalness: 0.08 });
  const silver = industrialMaterial('Brushed process alloy', '#a5afb0', { roughness: 0.3, metalness: 0.94 });
  const mirror = industrialMaterial('Mirror polished vacuum steel', '#d2dbdc', { roughness: 0.12, metalness: 1 });
  const blackGlass = industrialMaterial('Opaque black credential glass', '#071116', { roughness: 0.18, metalness: 0.5 });
  const smokedGlass = industrialMaterial('Radiation shielding glass', '#172327', { roughness: 0.22, metalness: 0.44, transparent: true, opacity: 0.74 });
  const frost = industrialMaterial('Vacuum insulated frost white', '#e0ecec', { roughness: 0.42, metalness: 0.16 });
  const amberBio = industrialMaterial('Amber grey bioreactor shell', '#8d8066', { roughness: 0.36, metalness: 0.12, transparent: true, opacity: 0.68 });
  const bio = industrialMaterial('Self-healing pale biocomposite', '#a5a48f', { roughness: 0.92, metalness: 0.02 });
  const asphalt = industrialMaterial('Rain-dark production paving', '#20282b', { roughness: 0.94, metalness: 0.08 });
  const gravel = industrialMaterial('Sterile white crushed stone', '#deded5', { roughness: 1, metalness: 0 });
  const rust = industrialMaterial('Heat-weathered alloy', '#684237', { roughness: 0.78, metalness: 0.54 });
  const violet = industrialMaterial('Ultraviolet sterilization light', '#d8c8ff', { emissive: '#8958ff', emissiveIntensity: 2.5, roughness: 0.16, metalness: 0.04 });
  const whiteLight = industrialMaterial('Cold surgical work light', '#ffffff', { emissive: '#dff8ff', emissiveIntensity: 3.1, roughness: 0.12, metalness: 0.02 });
  const amber = industrialMaterial('Permanent amber guidance light', '#ffc276', { emissive: '#ff8b24', emissiveIntensity: 3.4, roughness: 0.14, metalness: 0.04 });
  const red = industrialMaterial('Restricted red warning light', '#ff725e', { emissive: '#ff2817', emissiveIntensity: 3.8, roughness: 0.14, metalness: 0.04 });
  const green = industrialMaterial('Sealed bay green status light', '#9affc6', { emissive: '#20ef83', emissiveIntensity: 3.4, roughness: 0.14, metalness: 0.04 });
  const cyan = industrialMaterial('Cryogenic blue white light', '#dffcff', { emissive: '#5edff5', emissiveIntensity: 2.8, roughness: 0.14, metalness: 0.04 });
  const hot = industrialMaterial('Extreme material seam', '#ffb07c', { emissive: '#ff4517', emissiveIntensity: 3.6, roughness: 0.18, metalness: 0.08 });
  const mist = new THREE.MeshBasicMaterial({ name: 'Industrial process vapour', color: '#c8d9dc', transparent: true, opacity: 0.11, depthWrite: false, side: THREE.DoubleSide });
  [violet, whiteLight, amber, red, green, cyan, hot].forEach((value) => { value.userData.isDistrictAccent = true; });
  return { basalt, graphite, black, pale, concrete, concreteDark, silver, mirror, blackGlass, smokedGlass, frost, amberBio, bio, asphalt, gravel, rust, violet, whiteLight, amber, red, green, cyan, hot, mist };
}

type Materials = ReturnType<typeof createMaterials>;

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

function box(parent: THREE.Object3D, name: string, size: readonly [number, number, number], mat: THREE.Material, position: readonly [number, number, number], obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const value = prepare(new THREE.Mesh(UNIT_BOX, mat), name, obstacle);
  value.scale.set(...size); value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function cylinder(parent: THREE.Object3D, name: string, diameter: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 20, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const geometry = segments === 6 ? UNIT_CYLINDER_6 : segments === 8 ? UNIT_CYLINDER_8 : segments === 12 ? UNIT_CYLINDER_12 : UNIT_CYLINDER_20;
  const value = prepare(new THREE.Mesh(geometry, mat), name, obstacle);
  value.scale.set(diameter, height, diameter); value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function taper(parent: THREE.Object3D, name: string, bottomDiameter: number, topDiameter: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 8) {
  const value = prepare(new THREE.Mesh(new THREE.CylinderGeometry(topDiameter * 0.5, bottomDiameter * 0.5, height, segments), mat), name, obstacle);
  value.position.set(...position); parent.add(value); return value;
}

function sphere(parent: THREE.Object3D, name: string, scale: readonly [number, number, number], mat: THREE.Material, position: readonly [number, number, number], obstacle = false) {
  const value = prepare(new THREE.Mesh(UNIT_SPHERE, mat), name, obstacle);
  value.scale.set(...scale); value.position.set(...position); parent.add(value); return value;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, mat: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0], arc = Math.PI * 2, obstacle = false, radialSegments = 6, tubularSegments = 20) {
  const key = `${radius.toFixed(3)}:${tube.toFixed(3)}:${arc.toFixed(3)}:${radialSegments}:${tubularSegments}`;
  let geometry = torusCache.get(key);
  if (!geometry) { geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc); torusCache.set(key, geometry); }
  const value = prepare(new THREE.Mesh(geometry, mat), name, obstacle);
  value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function pipe(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, radius: number, mat: THREE.Material, obstacle = false) {
  const vector = end.clone().sub(start); const value = prepare(new THREE.Mesh(UNIT_CYLINDER_12, mat), name, obstacle);
  value.position.copy(start).add(end).multiplyScalar(0.5); value.scale.set(radius * 2, vector.length(), radius * 2); value.quaternion.setFromUnitVectors(UNIT_Y, vector.normalize()); parent.add(value); return value;
}

function slabBetween(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, width: number, height: number, mat: THREE.Material, obstacle = false) {
  const vector = end.clone().sub(start); const value = prepare(new THREE.Mesh(UNIT_BOX, mat), name, obstacle);
  value.position.copy(start).add(end).multiplyScalar(0.5); value.scale.set(width, height, vector.length()); value.quaternion.setFromUnitVectors(UNIT_Z, vector.normalize()); parent.add(value); return value;
}

function beacon<T extends THREE.Object3D>(object: T, phase = 0) { object.userData.animate = 'industrial-beacon'; object.userData.phase = phase; return object; }
function rotate<T extends THREE.Object3D>(object: T, speed = 0.08) { object.userData.animate = 'industrial-fan'; object.userData.speed = speed; return object; }

function signTexture(title: string, code: string) {
  const key = `${code}:${title}`; const cached = signCache.get(key); if (cached) return cached;
  const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 256; const context = canvas.getContext('2d')!;
  context.fillStyle = '#111719'; context.fillRect(0, 0, canvas.width, canvas.height); context.strokeStyle = '#d7943c'; context.lineWidth = 12; context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  context.fillStyle = '#f0eee5'; context.textAlign = 'left'; context.textBaseline = 'middle'; context.font = '800 70px Arial, sans-serif'; context.fillText(code, 42, 92, 300);
  context.fillStyle = '#b9c2c2'; context.font = '600 38px Arial, sans-serif'; context.fillText(title.toUpperCase(), 42, 176, 680);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8; signCache.set(key, texture); return texture;
}

function addSign(parent: THREE.Object3D, name: string, title: string, code: string, size: readonly [number, number], position: readonly [number, number, number]) {
  const material = new THREE.MeshStandardMaterial({ name: `Production code ${code}`, map: signTexture(title, code), color: '#ffffff', roughness: 0.6, metalness: 0.08, side: THREE.DoubleSide });
  const sign = prepare(new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material), name); sign.position.set(...position); parent.add(sign); return sign;
}

function vapour(parent: THREE.Object3D, name: string, position: readonly [number, number, number], scale: readonly [number, number, number], m: Materials, phase: number) {
  const value = sphere(parent, name, scale, m.mist.clone(), position); value.userData.animate = 'industrial-steam'; value.userData.baseY = position[1]; value.userData.phase = phase; return value;
}

function createShiftMeridian(m: Materials) {
  const root = new THREE.Group(); root.name = 'INDUSTRIAL_NEW__I01__SHIFT_MERIDIAN';
  box(root, 'INDUSTRIAL_NEW__I01__LONG_PALE_TERMINAL_MASS', [19.5, 3.2, 4.2], m.pale, [0, 1.64, 0], true);
  box(root, 'INDUSTRIAL_NEW__I01__OPAQUE_BLACK_GLASS_BAND', [18.9, 1.05, 0.16], m.blackGlass, [0, 2.05, 2.13]);
  for (let rib = 0; rib < 19; rib += 1) box(root, `INDUSTRIAL_NEW__I01__BRUSHED_ALUMINIUM_RIB_${rib + 1}`, [0.15, 3.35, 0.26], m.silver, [-9 + rib, 1.72, 2.2]);
  box(root, 'INDUSTRIAL_NEW__I01__VAST_CANTILEVERED_TRANSPORT_CANOPY', [20.8, 0.32, 5.8], m.graphite, [0, 3.55, 4.55]);
  for (let bay = 0; bay < 12; bay += 1) {
    const x = -8.8 + bay * 1.6; box(root, `INDUSTRIAL_NEW__I01__EMPTY_WORKER_TRANSPORT_BAY_${bay + 1}`, [1.26, 0.05, 4.8], bay % 2 ? m.concrete : m.concreteDark, [x, 0.08, 4.7]);
    box(root, `INDUSTRIAL_NEW__I01__QUEUE_LINE_${bay + 1}`, [0.035, 0.02, 3.7], m.amber, [x, 0.12, 4.7]);
    beacon(box(root, `INDUSTRIAL_NEW__I01__BOARDING_NUMBER_${bay + 1}`, [0.4, 0.42, 0.08], bay % 3 ? m.whiteLight.clone() : m.amber.clone(), [x, 2.9, 2.42]), bay * 0.42);
  }
  ['A', 'B', 'C', 'C-2', 'D', 'D-NULL'].forEach((code, index) => addSign(root, `INDUSTRIAL_NEW__I01__RECESSED_ENTRANCE_${code}`, code, code, [1.35, 0.48], [-7.5 + index * 3, 1.2, 2.24]));
  for (let clock = 0; clock < 3; clock += 1) { torus(root, `INDUSTRIAL_NEW__I01__DISAGREEING_CLOCK_${clock + 1}`, 0.42, 0.06, m.silver, [-1.1 + clock * 1.1, 2.95, 2.24], [0, 0, 0]); pipe(root, `INDUSTRIAL_NEW__I01__CLOCK_HAND_${clock + 1}`, new THREE.Vector3(-1.1 + clock * 1.1, 2.95, 2.26), new THREE.Vector3(-0.9 + clock * 1.1, 3.15 - clock * 0.08, 2.26), 0.025, m.amber); }
  addSign(root, 'INDUSTRIAL_NEW__I01__SHIFT_STATUS_SPLIT_FLAP', 'SHIFT 05 — NO ARRIVAL', 'SHIFT', [5.8, 0.75], [0, 1.55, 2.26]);
  box(root, 'INDUSTRIAL_NEW__I01__TRANSLUCENT_PERSONNEL_BRIDGE', [7.8, 1.2, 1.25], m.smokedGlass, [12.3, 4.15, -0.8]);
  return root;
}

function createContinuousWorks(m: Materials) {
  const root = new THREE.Group(); root.name = 'INDUSTRIAL_NEW__I02__CONTINUOUS_WORKS';
  box(root, 'INDUSTRIAL_NEW__I02__COLOSSAL_ASSEMBLY_MEGAPHALL_MASS', [30, 6.8, 9.2], m.graphite, [0, 3.44, 0], true);
  box(root, 'INDUSTRIAL_NEW__I02__PALE_IMPACT_CERAMIC_LOWER_FACADE', [30.3, 2.5, 9.45], m.pale, [0, 1.3, 0], true);
  for (let bay = 0; bay < 48; bay += 1) {
    const side = bay < 24 ? 1 : -1; const index = bay % 24; const x = -14.4 + index * 1.25;
    box(root, `INDUSTRIAL_NEW__I02__MONUMENTAL_LOADING_BAY_${bay + 1}`, [0.84, 2.1, 0.16], bay % 7 === 0 ? m.black : m.concreteDark, [x, 1.24, side * 4.82]);
    beacon(box(root, `INDUSTRIAL_NEW__I02__SEALED_LOADING_STATUS_${bay + 1}`, [0.13, 0.13, 0.08], (bay + Math.floor(bay / 5)) % 2 ? m.red.clone() : m.green.clone(), [x + 0.42, 2.7, side * 4.91]), bay * 0.2);
  }
  for (let tooth = 0; tooth < 15; tooth += 1) {
    const x = -14 + tooth * 2; box(root, `INDUSTRIAL_NEW__I02__SAWTOOTH_ROOF_PRISM_${tooth + 1}`, [1.92, 1.0, 9.5], tooth % 2 ? m.smokedGlass : m.blackGlass, [x, 7.28, 0], false, [0, 0, tooth % 2 ? 0.2 : -0.2]);
    cylinder(root, `INDUSTRIAL_NEW__I02__ROOF_EXHAUST_${tooth + 1}`, 0.32, 1.35, m.silver, [x, 8.25, -2.6 + tooth % 3 * 2.6], false, 12);
  }
  for (const x of [-13.5, 13.5]) box(root, `INDUSTRIAL_NEW__I02__CRANE_RAIL_TERMINATING_IN_OPEN_AIR_${x < 0 ? 'WEST' : 'EAST'}`, [7.2, 0.28, 0.28], m.rust, [x + Math.sign(x) * 2.6, 6.15, 0]);
  for (let capsule = 0; capsule < 8; capsule += 1) cylinder(root, `INDUSTRIAL_NEW__I02__MATTE_GREY_PRODUCT_CAPSULE_${capsule + 1}`, 0.75, 1.7, m.concreteDark, [-10.8 + capsule * 3.1, 0.72, 6.15], true, 12, [0, 0, Math.PI / 2]);
  return root;
}

function createBlackKiln(m: Materials) {
  const root = new THREE.Group(); root.name = 'INDUSTRIAL_NEW__I03__BLACK_KILN';
  taper(root, 'INDUSTRIAL_NEW__I03__BUTTRESSED_BASALT_PRODUCTION_TOWER', 9.2, 5.3, 9.2, m.basalt, [0, 4.64, 0], true, 8);
  for (let buttress = 0; buttress < 8; buttress += 1) { const angle = buttress / 8 * Math.PI * 2; box(root, `INDUSTRIAL_NEW__I03__DEFENSIVE_BUTTRESS_${buttress + 1}`, [1.15, 4.4, 2.0], m.graphite, [Math.sin(angle) * 4.0, 2.24, Math.cos(angle) * 4.0], true, [0, angle, 0]); }
  for (let seam = 0; seam < 8; seam += 1) { const angle = seam / 8 * Math.PI * 2; beacon(box(root, `INDUSTRIAL_NEW__I03__GLOWING_THERMAL_SEAM_${seam + 1}`, [0.11, 6.8, 0.12], m.hot.clone(), [Math.sin(angle) * 3.32, 4.1, Math.cos(angle) * 3.32], false, [0, -angle, 0]), seam * 0.8); }
  for (let ring = 0; ring < 3; ring += 1) { const induction = torus(root, `INDUSTRIAL_NEW__I03__ELECTROMAGNETIC_INDUCTION_RING_${ring + 1}`, 5.1 + ring * 0.38, 0.34, ring === 1 ? m.silver : m.graphite, [0, 2.4 + ring * 2.5, 0]); rotate(induction, 0.014 + ring * 0.004); }
  for (let tower = 0; tower < 4; tower += 1) { taper(root, `INDUSTRIAL_NEW__I03__ANGULAR_COOLING_TOWER_${tower + 1}`, 2.2, 1.2, 4.3 + tower * 0.45, m.concreteDark, [-6.2 + tower * 4.1, 2.2 + tower * 0.22, -5.2], true, 8); vapour(root, `INDUSTRIAL_NEW__I03__DESCENDING_WHITE_VAPOUR_${tower + 1}`, [-6.2 + tower * 4.1, 4.5 + tower * 0.45, -5.2], [1.2, 0.55, 1.2], m, tower); }
  for (let block = 0; block < 12; block += 1) box(root, `INDUSTRIAL_NEW__I03__VITRIFIED_SLAG_BLOCK_${block + 1}`, [0.85 + block % 3 * 0.16, 0.75 + block % 2 * 0.22, 0.8], m.blackGlass, [-6.0 + block * 1.05, 0.4 + block % 2 * 0.11, 6.0]);
  addSign(root, 'INDUSTRIAL_NEW__I03__THERMAL_PROCESS_SIGN', 'NON-COMBUSTION FACILITY', '03-EM', [4.6, 0.8], [0, 1.25, 4.67]);
  return root;
}

function createVacuumCathedral(m: Materials) {
  const root = new THREE.Group(); root.name = 'INDUSTRIAL_NEW__I04__VACUUM_CASTING_CATHEDRAL';
  const vessels = [{ x: -4.2, h: 7.1, d: 3.0 }, { x: 0, h: 10.2, d: 3.8 }, { x: 4.2, h: 7.1, d: 3.0 }];
  vessels.forEach((record, index) => {
    cylinder(root, `INDUSTRIAL_NEW__I04__MIRROR_VACUUM_VESSEL_${index + 1}`, record.d, record.h, m.mirror, [record.x, record.h * 0.5 + 0.3, 0], true, 20);
    for (let band = 0; band < 7; band += 1) torus(root, `INDUSTRIAL_NEW__I04__PRESSURE_REINFORCEMENT_BAND_${index + 1}_${band + 1}`, record.d * 0.52, 0.1, m.graphite, [record.x, 0.9 + band * (record.h - 0.8) / 6, 0]);
    torus(root, `INDUSTRIAL_NEW__I04__CIRCULAR_PRESSURE_DOOR_${index + 1}`, record.d * 0.34, 0.11, m.graphite, [record.x, 1.8, record.d * 0.51], [0, 0, 0]);
    for (const side of [-1, 1]) pipe(root, `INDUSTRIAL_NEW__I04__EXTERNAL_CATHEDRAL_RIB_${index + 1}_${side < 0 ? 'L' : 'R'}`, new THREE.Vector3(record.x + side * (record.d * 0.75 + 1.0), 0.2, 0), new THREE.Vector3(record.x + side * record.d * 0.62, record.h + 0.4, 0), 0.18, m.graphite, true);
  });
  for (let level = 0; level < 3; level += 1) { pipe(root, `INDUSTRIAL_NEW__I04__SYMMETRIC_VACUUM_PIPE_WEST_${level + 1}`, new THREE.Vector3(-4.2, 3.0 + level * 1.8, 0), new THREE.Vector3(0, 4.2 + level * 1.8, 0), 0.11, m.silver); pipe(root, `INDUSTRIAL_NEW__I04__SYMMETRIC_VACUUM_PIPE_EAST_${level + 1}`, new THREE.Vector3(0, 4.2 + level * 1.8, 0), new THREE.Vector3(4.2, 3.0 + level * 1.8, 0), 0.11, m.silver); }
  for (const x of [-4.2, 4.2]) { torus(root, `INDUSTRIAL_NEW__I04__RAIL_MOUNTED_LIFTING_ARCH_${x < 0 ? 'WEST' : 'EAST'}`, 2.3, 0.18, m.graphite, [x, 2.35, 5.0], [0, 0, 0], Math.PI); }
  const condensation = beacon(torus(root, 'INDUSTRIAL_NEW__I04__DESCENDING_CONDENSATION_RING', 2.05, 0.08, m.cyan.clone(), [0, 8.1, 0]), 0.6); condensation.userData.condensationCycle = true;
  return root;
}

function createLoomworks(m: Materials) {
  const root = new THREE.Group(); root.name = 'INDUSTRIAL_NEW__I05__METAMATERIAL_LOOMWORKS';
  box(root, 'INDUSTRIAL_NEW__I05__FOLDED_LOOMWORKS_MAIN_HALL', [18.2, 4.4, 8.6], m.concreteDark, [0, 2.24, 0], true);
  for (let fold = 0; fold < 10; fold += 1) box(root, `INDUSTRIAL_NEW__I05__WAVE_ROOF_SEGMENT_${fold + 1}`, [1.86, 0.24, 9.0], fold % 2 ? m.silver : m.graphite, [-8.35 + fold * 1.86, 4.65 + Math.sin(fold * 0.9) * 0.42, 0], false, [0, 0, Math.cos(fold * 0.9) * 0.12]);
  for (let ribbon = 0; ribbon < 24; ribbon += 1) { const x = -8.6 + ribbon * 0.74; const woven = box(root, `INDUSTRIAL_NEW__I05__ADAPTIVE_WOVEN_FACADE_RIBBON_${ribbon + 1}`, [0.22, 4.1, 0.16], ribbon % 4 === 0 ? m.silver : m.graphite, [x, 2.25 + Math.sin(ribbon * 0.7) * 0.18, 4.42], false, [0, (ribbon % 2 ? 1 : -1) * 0.08, (ribbon % 3 - 1) * 0.035]); woven.userData.animate = ribbon % 6 === 0 ? 'industrial-curtain' : undefined; woven.userData.phase = ribbon * 0.4; }
  for (let tower = 0; tower < 6; tower += 1) { const x = -8.0 + tower * 3.2; cylinder(root, `INDUSTRIAL_NEW__I05__TENSION_TOWER_${tower + 1}`, 0.48, 6.1, m.graphite, [x, 3.05, -5.3], true, 8); cylinder(root, `INDUSTRIAL_NEW__I05__SEALED_FILAMENT_DRUM_${tower + 1}`, 1.35, 1.1, tower % 2 ? m.black : m.silver, [x, 5.35, -5.3], false, 12, [Math.PI / 2, 0, 0]); pipe(root, `INDUSTRIAL_NEW__I05__TRANSPARENT_FEED_TUBE_${tower + 1}`, new THREE.Vector3(x, 5.35, -4.65), new THREE.Vector3(x * 0.72, 3.8, -3.7), 0.09, m.smokedGlass); }
  for (let door = 0; door < 20; door += 1) box(root, `INDUSTRIAL_NEW__I05__VERTICAL_SHEET_LOADING_DOOR_${door + 1}`, [0.42, 2.9, 0.12], m.black, [-8.3 + door * 0.87, 1.55, 4.52]);
  for (let core = 0; core < 6; core += 1) cylinder(root, `INDUSTRIAL_NEW__I05__ARMOURED_FINISHED_SHEET_CORE_${core + 1}`, 1.05, 3.0, m.silver, [10.2, 0.7 + core * 0.2, -3.2 + core * 1.25], true, 12, [0, 0, Math.PI / 2]);
  return root;
}

function createCryogenicPlant(m: Materials) {
  const root = new THREE.Group(); root.name = 'INDUSTRIAL_NEW__I06__CRYOGENIC_FORMING_PLANT';
  box(root, 'INDUSTRIAL_NEW__I06__HEATED_DRY_PROCESS_APRON', [17.0, 0.12, 11.0], m.concrete, [0, 0.08, 0]);
  for (let volume = 0; volume < 4; volume += 1) { const x = -5.4 + volume * 3.6; cylinder(root, `INDUSTRIAL_NEW__I06__PART_BURIED_INSULATED_VOLUME_${volume + 1}`, 4.4 - volume % 2 * 0.6, 8.0, m.frost, [x, 2.2 + volume % 2 * 0.45, 0], true, 20, [0, 0, Math.PI / 2]); }
  for (let tank = 0; tank < 3; tank += 1) { const x = -4.2 + tank * 4.2; cylinder(root, `INDUSTRIAL_NEW__I06__CRYOGENIC_STORAGE_TANK_${tank + 1}`, 2.2, 5.8, m.frost, [x, 3.0, -5.1], true, 20); beacon(sphere(root, `INDUSTRIAL_NEW__I06__RED_OBSTRUCTION_LIGHT_${tank + 1}`, [0.12, 0.12, 0.12], m.red.clone(), [x, 6.05, -5.1]), tank * 1.3); vapour(root, `INDUSTRIAL_NEW__I06__CRYOGENIC_FOG_${tank + 1}`, [x, 5.6, -5.1], [1.5, 0.7, 1.5], m, tank); }
  for (let port = 0; port < 5; port += 1) { const x = -5.2 + port * 2.6; torus(root, `INDUSTRIAL_NEW__I06__CIRCULAR_TRANSFER_PORT_${port + 1}`, 0.62, 0.12, m.silver, [x, 1.55, 4.2], [0, 0, 0]); cylinder(root, `INDUSTRIAL_NEW__I06__RETRACTABLE_THERMAL_TUNNEL_${port + 1}`, 1.18, 1.8, m.smokedGlass, [x, 1.55, 5.0], false, 16, [Math.PI / 2, 0, 0]); }
  for (let loop = 0; loop < 7; loop += 1) torus(root, `INDUSTRIAL_NEW__I06__VACUUM_JACKETED_EXPANSION_LOOP_${loop + 1}`, 1.3 + loop * 0.12, 0.09, m.silver, [-7.4 + loop * 2.45, 5.4 + loop % 2 * 0.35, -0.5], [0, 0, 0], Math.PI);
  for (let frame = 0; frame < 4; frame += 1) torus(root, `INDUSTRIAL_NEW__I06__MAGNETIC_FORMING_FRAME_${frame + 1}`, 1.2, 0.18, m.graphite, [-5.4 + frame * 3.6, 1.4, 6.1], [Math.PI / 2, 0, 0], Math.PI * 1.5, true);
  return root;
}

function createAdditiveYard(m: Materials) {
  const root = new THREE.Group(); root.name = 'INDUSTRIAL_NEW__I07__ADDITIVE_MEGAFABRICATION_YARD';
  box(root, 'INDUSTRIAL_NEW__I07__FLOATING_THIN_HANGAR_ROOF', [22, 0.28, 15], m.graphite, [0, 7.15, 0]);
  for (let pylon = 0; pylon < 6; pylon += 1) { const x = pylon < 3 ? -9.4 : 9.4; const z = -5.6 + (pylon % 3) * 5.6; taper(root, `INDUSTRIAL_NEW__I07__CONCRETE_ROOF_PYLON_${pylon + 1}`, 1.3, 0.72, 7.0, m.concrete, [x, 3.55, z], true, 6); }
  for (let gantry = 0; gantry < 6; gantry += 1) { const z = -6.0 + gantry * 2.4; for (const x of [-7.8, 7.8]) box(root, `INDUSTRIAL_NEW__I07__PRINTER_GANTRY_LEG_${gantry + 1}_${x < 0 ? 'W' : 'E'}`, [0.35, 5.4, 0.45], m.silver, [x, 2.75, z], true); box(root, `INDUSTRIAL_NEW__I07__PRINTER_GANTRY_BRIDGE_${gantry + 1}`, [16.0, 0.42, 0.5], m.silver, [0, 5.25, z]); const head = box(root, `INDUSTRIAL_NEW__I07__VERTICAL_PRINTER_HEAD_${gantry + 1}`, [0.62, 3.6, 0.62], m.black, [-4.5 + gantry * 1.8, 3.35, z]); head.userData.animate = 'industrial-pump'; head.userData.baseY = 3.35; }
  for (let layer = 0; layer < 9; layer += 1) box(root, `INDUSTRIAL_NEW__I07__PRINTED_LAYER_WALL_${layer + 1}`, [0.5 + layer * 0.42, 0.25, 6.8], layer % 3 ? m.concreteDark : m.pale, [-10.5, 0.25 + layer * 0.26, 0]);
  for (let silo = 0; silo < 5; silo += 1) { cylinder(root, `INDUSTRIAL_NEW__I07__BEHAVIOURAL_FEEDSTOCK_SILO_${silo + 1}`, 2.1, 5.2 + silo % 2, m.concreteDark, [-7.6 + silo * 3.8, 2.65 + silo % 2 * 0.5, -9.0], true, 12); addSign(root, `INDUSTRIAL_NEW__I07__FEEDSTOCK_BEHAVIOUR_CODE_${silo + 1}`, silo % 2 ? 'FLEXIBLE / CONDUCTIVE' : 'RIGID / TEMPORARY', `07-${silo + 1}`, [2.0, 0.58], [-7.6 + silo * 3.8, 2.4, -7.92]); }
  return root;
}

function createMicrofactoryHive(m: Materials) {
  const root = new THREE.Group(); root.name = 'INDUSTRIAL_NEW__I08__AUTONOMOUS_MICROFACTORY_HIVE';
  box(root, 'INDUSTRIAL_NEW__I08__REINFORCED_RAIL_FOUNDATION', [19.5, 0.25, 15.5], m.concreteDark, [0, 0.14, 0]);
  for (let cell = 0; cell < 36; cell += 1) { const column = cell % 6; const row = Math.floor(cell / 6); const x = -7.75 + column * 3.1 + (row % 2) * 0.6; const z = -6.0 + row * 2.4; const height = 1.9 + (cell % 3) * 0.55; cylinder(root, `INDUSTRIAL_NEW__I08__RECONFIGURABLE_HEX_CELL_${cell + 1}`, 2.35, height, cell % 7 === 0 ? m.concreteDark : m.graphite, [x, 0.28 + height * 0.5, z], true, 6); box(root, `INDUSTRIAL_NEW__I08__MACHINE_VISION_FIDUCIAL_${cell + 1}`, [0.32, 0.32, 0.08], cell % 2 ? m.whiteLight : m.black, [x, 1.1 + height * 0.38, z + 1.2]); const status = beacon(box(root, `INDUSTRIAL_NEW__I08__CELL_STATUS_GLYPH_${cell + 1}`, [0.16, 0.16, 0.09], [m.amber, m.cyan, m.violet][cell % 3].clone(), [x + 0.62, 0.75 + height * 0.4, z + 1.2]), cell * 0.23); status.userData.hiveSymbol = Math.floor(cell / 6); cylinder(root, `INDUSTRIAL_NEW__I08__COMPACT_ROOF_HEAT_EXCHANGER_${cell + 1}`, 0.8, 0.34, m.silver, [x, 0.46 + height, z], false, 8); }
  for (let gantry = 0; gantry < 7; gantry += 1) { const z = -7.1 + gantry * 2.35; box(root, `INDUSTRIAL_NEW__I08__OVERHEAD_SERVICE_GANTRY_${gantry + 1}`, [19.0, 0.32, 0.34], m.silver, [0, 5.0, z]); for (let drop = 0; drop < 6; drop += 1) pipe(root, `INDUSTRIAL_NEW__I08__SEGMENTED_UTILITY_UMBILICAL_${gantry + 1}_${drop + 1}`, new THREE.Vector3(-7.75 + drop * 3.1, 4.84, z), new THREE.Vector3(-7.75 + drop * 3.1 + (gantry % 2 ? 0.5 : -0.5), 2.8, z + (gantry % 2 ? 0.8 : -0.8)), 0.08, drop % 2 ? m.silver : m.rust); }
  return root;
}

function createBiogenicFoundry(m: Materials) {
  const root = new THREE.Group(); root.name = 'INDUSTRIAL_NEW__I09__BIOGENIC_MATERIALS_FOUNDRY';
  cylinder(root, 'INDUSTRIAL_NEW__I09__STERILE_WHITE_GRAVEL_MOAT', 19.5, 0.12, m.gravel, [0, 0.08, 0], false, 20); box(root, 'INDUSTRIAL_NEW__I09__SCARRED_SELF_HEALING_MAIN_BLOCK', [10.5, 5.4, 8.6], m.bio, [0, 2.75, 0], true);
  for (let scar = 0; scar < 15; scar += 1) box(root, `INDUSTRIAL_NEW__I09__HEALED_FACADE_SCAR_${scar + 1}`, [0.12 + scar % 3 * 0.08, 1.1 + scar % 4 * 0.35, 0.08], scar % 2 ? m.pale : m.concrete, [-4.5 + (scar % 8) * 1.3, 1.1 + Math.floor(scar / 8) * 2.0, 4.35], false, [0, 0, (scar % 3 - 1) * 0.22]);
  for (let tower = 0; tower < 12; tower += 1) { const angle = tower / 12 * Math.PI * 2; const x = Math.sin(angle) * 7.2; const z = Math.cos(angle) * 7.2; cylinder(root, `INDUSTRIAL_NEW__I09__AMBER_BIOREACTOR_TOWER_${tower + 1}`, 1.55, 5.2 + tower % 3 * 0.45, m.amberBio, [x, 2.65 + tower % 3 * 0.22, z], true, 16); torus(root, `INDUSTRIAL_NEW__I09__UV_STERILIZATION_RING_${tower + 1}`, 0.82, 0.08, m.violet.clone(), [x, 5.5 + tower % 3 * 0.45, z]); pipe(root, `INDUSTRIAL_NEW__I09__VASCULAR_PROCESS_PIPE_${tower + 1}`, new THREE.Vector3(x, 2.8, z), new THREE.Vector3(x * 0.48, 3.3 + tower % 2, z * 0.48), 0.11, tower % 2 ? m.silver : m.pale); }
  for (let panel = 0; panel < 10; panel += 1) box(root, `INDUSTRIAL_NEW__I09__LIVING_PANEL_CURING_ARCADE_${panel + 1}`, [0.68, 3.0 + panel % 3 * 0.4, 0.25], panel % 2 ? m.bio : m.black, [-6.5 + panel * 1.45, 1.55 + panel % 3 * 0.2, -9.2]);
  box(root, 'INDUSTRIAL_NEW__I09__NARROW_GRATED_ENTRY_BRIDGE', [2.0, 0.16, 5.5], m.graphite, [0, 0.18, 8.6]);
  return root;
}

function createMachineGenesis(m: Materials) {
  const root = new THREE.Group(); root.name = 'INDUSTRIAL_NEW__I10__MACHINE_GENESIS_HALL';
  box(root, 'INDUSTRIAL_NEW__I10__DATUM_GRID_MAIN_HALL_MASS', [18.5, 6.6, 12.2], m.pale, [0, 3.34, 0], true);
  for (let column = 0; column <= 12; column += 1) box(root, `INDUSTRIAL_NEW__I10__THREE_DIMENSIONAL_DATUM_COLUMN_${column + 1}`, [0.16, 6.85, 0.22], m.graphite, [-9.25 + column * 1.54, 3.45, 6.22]);
  for (let level = 0; level < 5; level += 1) box(root, `INDUSTRIAL_NEW__I10__DATUM_LEVEL_${level + 1}`, [18.7, 0.12, 0.22], m.graphite, [0, 0.9 + level * 1.25, 6.22]);
  for (let door = 0; door < 6; door += 1) { const x = -7.6 + door * 3.05; for (let nested = 0; nested < 4; nested += 1) box(root, `INDUSTRIAL_NEW__I10__NESTED_ASSEMBLY_DOOR_${door + 1}_${nested + 1}`, [2.55 - nested * 0.48, 4.8 - nested * 0.85, 0.08], nested % 2 ? m.black : m.concreteDark, [x, 2.55 - nested * 0.05, 6.34 + nested * 0.025]); }
  for (let target = 0; target < 36; target += 1) box(root, `INDUSTRIAL_NEW__I10__CALIBRATION_FIDUCIAL_${target + 1}`, [0.22, 0.22, 0.07], target % 2 ? m.black : m.whiteLight, [-8.4 + target % 12 * 1.52, 0.75 + Math.floor(target / 12) * 1.65, 6.4]);
  for (let crane = 0; crane < 2; crane += 1) { const z = -8.0 + crane * 16.0; for (const x of [-8.4, 8.4]) box(root, `INDUSTRIAL_NEW__I10__GANTRY_CRANE_LEG_${crane + 1}_${x < 0 ? 'W' : 'E'}`, [0.38, 6.2, 0.55], m.silver, [x, 3.15, z], true); const bridge = box(root, `INDUSTRIAL_NEW__I10__EMPTY_GANTRY_LIFTING_FRAME_${crane + 1}`, [17.2, 0.45, 0.68], m.rust, [0, 6.0, z]); bridge.userData.animate = 'industrial-conveyor'; bridge.userData.baseX = 0; }
  box(root, 'INDUSTRIAL_NEW__I10__AUTONOMOUSLY_RENEWED_FACADE_ZONE', [4.2, 5.9, 0.12], m.whiteLight, [6.2, 3.2, -6.17]);
  return root;
}

function createTestingMonolith(m: Materials) {
  const root = new THREE.Group(); root.name = 'INDUSTRIAL_NEW__I11__DESTRUCTIVE_TESTING_MONOLITH';
  box(root, 'INDUSTRIAL_NEW__I11__SCARRED_DROP_TOWER_MASS', [4.6, 13.0, 4.8], m.concreteDark, [-4.8, 6.54, -1.5], true);
  for (let band = 0; band < 18; band += 1) { box(root, `INDUSTRIAL_NEW__I11__VERTICAL_MEASUREMENT_BAND_${band + 1}`, [0.12, 0.6, 0.08], band % 3 ? m.pale : m.rust, [-2.42, 0.55 + band * 0.68, -1.5]); box(root, `INDUSTRIAL_NEW__I11__SACRIFICIAL_DAMAGE_PANEL_${band + 1}`, [1.5, 0.58, 0.12], band % 4 ? m.concrete : m.rust, [-4.8, 0.55 + band * 0.68, 0.96]); }
  for (let chamber = 0; chamber < 3; chamber += 1) taper(root, `INDUSTRIAL_NEW__I11__BLAST_RESISTANT_TEST_CHAMBER_${chamber + 1}`, 5.8, 4.2, 2.6, chamber % 2 ? m.concreteDark : m.graphite, [1.2 + chamber * 4.4, 1.34, -2.8 + chamber % 2 * 4.2], true, 8);
  box(root, 'INDUSTRIAL_NEW__I11__KILOMETRE_SCALE_IMPACT_RAIL', [21.0, 0.16, 0.5], m.silver, [3.8, 0.3, 7.5]); box(root, 'INDUSTRIAL_NEW__I11__REPLACEABLE_TARGET_WALL', [0.65, 5.6, 8.2], m.rust, [14.2, 2.9, 7.5], true);
  for (let pylon = 0; pylon < 10; pylon += 1) { const x = -7.8 + pylon * 2.4; cylinder(root, `INDUSTRIAL_NEW__I11__ARMOURED_INSTRUMENT_PYLON_${pylon + 1}`, 0.36, 4.2, m.graphite, [x, 2.15, pylon % 2 ? 5.0 : 10.0], true, 8); beacon(box(root, `INDUSTRIAL_NEW__I11__COUNTDOWN_PERIMETER_LIGHT_${pylon + 1}`, [0.24, 0.24, 0.24], m.red.clone(), [x, 4.35, pylon % 2 ? 5.0 : 10.0]), pylon * 0.38); }
  for (let evidence = 0; evidence < 8; evidence += 1) { box(root, `INDUSTRIAL_NEW__I11__EVIDENCE_PLINTH_${evidence + 1}`, [1.4, 0.34, 1.4], m.concrete, [-7.5 + evidence * 2.1, 0.2, -7.4]); box(root, `INDUSTRIAL_NEW__I11__FRACTURED_TEST_ARTIFACT_${evidence + 1}`, [1.0, 0.5 + evidence % 3 * 0.35, 0.32], evidence % 2 ? m.rust : m.graphite, [-7.5 + evidence * 2.1, 0.6 + evidence % 3 * 0.17, -7.4], false, [0.2 * (evidence % 3), evidence * 0.8, 0.1]); }
  return root;
}

function createPlatformZero(m: Materials) {
  const root = new THREE.Group(); root.name = 'INDUSTRIAL_NEW__I12__PLATFORM_ZERO';
  box(root, 'INDUSTRIAL_NEW__I12__FIVE_HUNDRED_METRE_TERMINAL_CANOPY', [28.0, 0.28, 13.4], m.graphite, [0, 5.4, 0]);
  for (let column = 0; column < 36; column += 1) { const x = -13.2 + column % 18 * 1.55; const z = column < 18 ? -5.8 : 5.8; box(root, `INDUSTRIAL_NEW__I12__REPETITIVE_CANOPY_COLUMN_${column + 1}`, [0.18, 5.2, 0.18], m.concrete, [x, 2.68, z], true); }
  for (let track = 0; track < 12; track += 1) { const z = -5.0 + track * 0.9; box(root, `INDUSTRIAL_NEW__I12__TERMINAL_TRACK_${track + 1}_LEFT_RAIL`, [27.0, 0.09, 0.07], m.silver, [0, 0.18, z - 0.22]); box(root, `INDUSTRIAL_NEW__I12__TERMINAL_TRACK_${track + 1}_RIGHT_RAIL`, [27.0, 0.09, 0.07], m.silver, [0, 0.18, z + 0.22]); }
  box(root, 'INDUSTRIAL_NEW__I12__SUSPENDED_DISPATCH_BRIDGE', [8.2, 1.5, 3.0], m.smokedGlass, [0, 4.0, 0]);
  box(root, 'INDUSTRIAL_NEW__I12__ANACHRONISTIC_PASSENGER_PLATFORM', [18.0, 0.18, 0.72], m.concrete, [-2.5, 0.28, 5.45]); addSign(root, 'INDUSTRIAL_NEW__I12__PLATFORM_ZERO_SIGN', 'PLATFORM', '0', [2.8, 0.9], [5.5, 2.3, 5.84]);
  for (let container = 0; container < 10; container += 1) box(root, `INDUSTRIAL_NEW__I12__MATTE_GREY_UNLABELLED_CONTAINER_${container + 1}`, [2.3 + container % 3 * 0.7, 1.2 + container % 2 * 0.6, 0.7], m.concreteDark, [-11.2 + container * 2.4, 0.76 + container % 2 * 0.3, -3.8 + container % 4 * 2.2], true);
  for (let crane = 0; crane < 4; crane += 1) { const x = -9.5 + crane * 6.3; box(root, `INDUSTRIAL_NEW__I12__OVERHEAD_MAGNETIC_CRANE_${crane + 1}`, [0.5, 0.4, 11.2], m.silver, [x, 4.9, 0]); cylinder(root, `INDUSTRIAL_NEW__I12__ROBOTIC_LOCKING_FRAME_${crane + 1}`, 1.2, 0.35, m.graphite, [x, 3.65, -1.2 + crane % 2 * 2.4], false, 8); }
  torus(root, 'INDUSTRIAL_NEW__I12__NUMBERLESS_CENTRAL_CLOCK', 0.72, 0.08, m.silver, [0, 3.95, 1.56], [0, 0, 0]);
  for (let fog = 0; fog < 8; fog += 1) { const volume = vapour(root, `INDUSTRIAL_NEW__I12__LOW_TERMINAL_FOG_${fog + 1}`, [-11 + fog * 3.1, 0.6, -4.5 + fog % 4 * 3], [2.4, 0.42, 1.2], m, fog * 0.7); volume.userData.animate = 'industrial-ground-mist'; volume.userData.baseX = -11 + fog * 3.1; volume.userData.phase = fog; }
  return root;
}

function createThermalRecovery(m: Materials) {
  const root = new THREE.Group(); root.name = 'INDUSTRIAL_NEW__I13__THERMAL_RECOVERY_STATION';
  box(root, 'INDUSTRIAL_NEW__I13__PERFORATED_TURBINE_BLOCK_MASS', [11.5, 6.4, 9.2], m.graphite, [-3.8, 3.24, 0], true);
  for (let aperture = 0; aperture < 48; aperture += 1) sphere(root, `INDUSTRIAL_NEW__I13__PERFORATED_FACADE_APERTURE_${aperture + 1}`, [0.1, 0.1, 0.04], aperture % 7 === 0 ? m.amber : m.black, [-8.7 + aperture % 8 * 1.4, 0.9 + Math.floor(aperture / 8) * 0.9, 4.64]);
  for (let tower = 0; tower < 3; tower += 1) { const x = 5.5 + tower * 3.3; for (let rib = 0; rib < 10; rib += 1) { const angle = rib / 10 * Math.PI * 2; pipe(root, `INDUSTRIAL_NEW__I13__SKELETAL_COOLING_RIB_${tower + 1}_${rib + 1}`, new THREE.Vector3(x + Math.sin(angle) * 2.1, 0.2, Math.cos(angle) * 2.1), new THREE.Vector3(x + Math.sin(angle) * 0.9, 8.3 + tower * 0.5, Math.cos(angle) * 0.9), 0.1, m.pale); } vapour(root, `INDUSTRIAL_NEW__I13__HORIZONTAL_MIST_COLUMN_${tower + 1}`, [x, 4.6, 0], [1.4, 3.6, 1.4], m, tower * 1.2); }
  for (let pipeIndex = 0; pipeIndex < 9; pipeIndex += 1) pipe(root, `INDUSTRIAL_NEW__I13__PIPE_ORGAN_MANIFOLD_${pipeIndex + 1}`, new THREE.Vector3(-8.6 + pipeIndex * 1.2, 1.1, -4.8), new THREE.Vector3(-8.6 + pipeIndex * 1.2, 7.1 + pipeIndex % 3 * 0.6, -4.8), 0.16, pipeIndex % 2 ? m.silver : m.rust);
  for (let fin = 0; fin < 42; fin += 1) box(root, `INDUSTRIAL_NEW__I13__OCEAN_WIND_RADIATOR_FIN_${fin + 1}`, [0.12, 2.8 + fin % 4 * 0.3, 3.6], fin % 5 ? m.graphite : m.silver, [-10 + fin * 0.48, 1.5 + fin % 4 * 0.15, -7.0]);
  for (let tank = 0; tank < 4; tank += 1) { cylinder(root, `INDUSTRIAL_NEW__I13__THERMAL_STORAGE_TANK_${tank + 1}`, 2.5, 4.8, m.concreteDark, [-7.2 + tank * 4.8, 2.45, 7.0], true, 16); beacon(box(root, `INDUSTRIAL_NEW__I13__TRAVELLING_LOAD_BAND_${tank + 1}`, [2.1, 0.18, 0.1], m.amber.clone(), [-7.2 + tank * 4.8, 1.2 + tank * 0.75, 8.27]), tank * 0.7); }
  return root;
}

function createReclamation(m: Materials) {
  const root = new THREE.Group(); root.name = 'INDUSTRIAL_NEW__I14__CLOSED_LOOP_RECLAMATION_WORKS';
  const steps = [{ size: [19, 3.4, 13] as const, y: 1.74 }, { size: [15.5, 2.5, 10] as const, y: 4.65 }, { size: [11.0, 1.8, 7.2] as const, y: 6.8 }]; steps.forEach((step, index) => box(root, `INDUSTRIAL_NEW__I14__FORTIFIED_SEPARATOR_STEP_${index + 1}`, step.size, index % 2 ? m.concreteDark : m.graphite, [0, step.y, 0], true));
  for (let separator = 0; separator < 9; separator += 1) { const x = -5.6 + separator % 5 * 2.8; const z = -3.2 + Math.floor(separator / 5) * 6.4; taper(root, `INDUSTRIAL_NEW__I14__CYCLONE_SEPARATOR_${separator + 1}`, 1.9, 0.9, 4.1 + separator % 3 * 0.5, separator % 2 ? m.silver : m.concrete, [x, 8.8 + separator % 3 * 0.25, z], true, 12); }
  for (let bay = 0; bay < 6; bay += 1) { const x = -7.6 + bay * 3.05; box(root, `INDUSTRIAL_NEW__I14__WET_RECESSED_INTAKE_BAY_${bay + 1}`, [2.25, 2.5, 0.18], m.black, [x, 1.45, 6.62]); torus(root, `INDUSTRIAL_NEW__I14__VEHICLE_WASH_ARCH_${bay + 1}`, 1.25, 0.11, m.silver, [x, 1.3, 7.3], [0, 0, 0], Math.PI); }
  for (let silo = 0; silo < 5; silo += 1) cylinder(root, `INDUSTRIAL_NEW__I14__POLISHED_RECOVERED_MATERIAL_SILO_${silo + 1}`, 1.8, 4.8 + silo % 2, m.mirror, [-6.0 + silo * 3.0, 2.45 + silo % 2 * 0.5, -8.4], true, 16);
  const pipeMaterials = [m.silver, m.rust, m.cyan, m.violet, m.amber]; for (let pipeIndex = 0; pipeIndex < 15; pipeIndex += 1) pipe(root, `INDUSTRIAL_NEW__I14__UNLISTED_COLOUR_CODED_PIPE_${pipeIndex + 1}`, new THREE.Vector3(-8.7 + pipeIndex * 1.22, 1.2 + pipeIndex % 3, -6.55), new THREE.Vector3(-8.7 + pipeIndex * 1.22, 5.5 + pipeIndex % 4 * 0.45, -6.55), 0.11, pipeMaterials[pipeIndex % pipeMaterials.length]);
  for (let blockIndex = 0; blockIndex < 12; blockIndex += 1) box(root, `INDUSTRIAL_NEW__I14__MINERALIZED_RESIDUE_BLOCK_${blockIndex + 1}`, [1.2, 0.8 + blockIndex % 3 * 0.22, 1.0], blockIndex % 4 ? m.pale : m.smokedGlass, [-8.0 + blockIndex * 1.45, 0.45 + blockIndex % 3 * 0.11, 9.3]);
  return root;
}

function createBuildingNull(m: Materials) {
  const root = new THREE.Group(); root.name = 'INDUSTRIAL_NEW__I15__BUILDING_NULL';
  box(root, 'INDUSTRIAL_NEW__I15__STERILE_WHITE_GRAVEL_EXCLUSION_MOAT', [20.0, 0.12, 22.0], m.gravel, [0, 0.08, 0]);
  box(root, 'INDUSTRIAL_NEW__I15__NEAR_SEAMLESS_GREY_BLACK_CUBOID_MASS', [12.0, 5.2, 15.0], m.basalt, [0, 2.64, 0], true);
  for (let panel = 0; panel < 18; panel += 1) box(root, `INDUSTRIAL_NEW__I15__FINE_JOINT_CERAMIC_PANEL_${panel + 1}`, [3.8, 1.62, 0.035], panel % 3 ? m.graphite : m.basalt, [-4.0 + panel % 3 * 4.0, 0.9 + Math.floor(panel / 3) % 3 * 1.72, 7.52]);
  box(root, 'INDUSTRIAL_NEW__I15__THIRTY_METRE_FEATURELESS_MAIN_DOOR', [8.0, 4.35, 0.06], m.black, [1.0, 2.25, 7.57]); box(root, 'INDUSTRIAL_NEW__I15__HANDLELESS_PERSONNEL_CUT', [0.72, 2.4, 0.12], m.black, [-4.7, 1.24, 7.6]);
  for (let line = 0; line < 2; line += 1) for (let pylon = 0; pylon < 22; pylon += 1) { const angle = pylon / 22 * Math.PI * 2; const radiusX = 8.2 + line * 1.5; const radiusZ = 9.6 + line * 1.5; cylinder(root, `INDUSTRIAL_NEW__I15__SENSOR_BOUNDARY_${line + 1}_${pylon + 1}`, 0.18, 1.9, m.graphite, [Math.sin(angle) * radiusX, 0.98, Math.cos(angle) * radiusZ], true, 8); beacon(sphere(root, `INDUSTRIAL_NEW__I15__SENSOR_APERTURE_${line + 1}_${pylon + 1}`, [0.1, 0.1, 0.1], line ? m.red.clone() : m.whiteLight.clone(), [Math.sin(angle) * radiusX, 1.95, Math.cos(angle) * radiusZ]), line * 0.8 + pylon * 0.13); }
  addSign(root, 'INDUSTRIAL_NEW__I15__PAVEMENT_SYMBOL_NULL', ' ', 'Ø', [4.0, 1.4], [0, 0.08, 11.25]).rotation.x = -Math.PI / 2;
  for (let conduit = 0; conduit < 7; conduit += 1) pipe(root, `INDUSTRIAL_NEW__I15__BURIED_APPROACHING_UTILITY_${conduit + 1}`, new THREE.Vector3(-8 + conduit * 2.7, 0.12, -12), new THREE.Vector3(-4.8 + conduit * 1.6, 0.12, -7.8), 0.11, conduit % 2 ? m.silver : m.graphite);
  return root;
}

function assignFacilityMetadata(root: THREE.Group, record: IndustrialFacilityProgram) {
  root.userData.exteriorProgram = true; root.userData.buildingCode = record.code; root.userData.buildingName = record.name; root.userData.semanticName = record.name; root.userData.buildingSubtitle = record.subtitle; root.userData.purpose = record.purpose; root.userData.footprintMetres = [...record.footprintMetres]; root.userData.heightMetres = record.heightMetres; root.userData.productionZone = record.productionZone; root.userData.exteriorMotif = record.exteriorMotif; root.userData.navObstacle = true;
  root.traverse((object) => { object.userData.selectableId = DISTRICT_ID; object.userData.districtId = DISTRICT_ID; }); return root;
}

function createFacility(record: IndustrialFacilityProgram, m: Materials) {
  const factories: Record<IndustrialFacilityForm, (materials: Materials) => THREE.Group> = {
    'shift-meridian': createShiftMeridian, 'continuous-works': createContinuousWorks, 'black-kiln': createBlackKiln, 'vacuum-cathedral': createVacuumCathedral, loomworks: createLoomworks, cryogenic: createCryogenicPlant, 'additive-yard': createAdditiveYard, 'microfactory-hive': createMicrofactoryHive, 'biogenic-foundry': createBiogenicFoundry, 'machine-genesis': createMachineGenesis, 'testing-monolith': createTestingMonolith, 'platform-zero': createPlatformZero, 'thermal-recovery': createThermalRecovery, reclamation: createReclamation, 'building-null': createBuildingNull,
  };
  return assignFacilityMetadata(factories[record.form](m), record);
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radialMargin = 11; const angularMargin = (sector.endAngle - sector.startAngle) * 0.05;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT); const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
  return new THREE.Vector3(Math.cos(angle) * radius - definition.position[0], y, Math.sin(angle) * radius - definition.position[2]);
}

function districtArc(definition: DistrictDefinition, radialT: number, segments = 144) { return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, radialT, index / (segments - 1))); }
function districtSpine(definition: DistrictDefinition, angularT: number, segments = 72) { return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, index / (segments - 1), angularT)); }

function ribbonGeometry(points: readonly THREE.Vector3[], width: number) {
  const vertices: number[] = []; const indices: number[] = [];
  points.forEach((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5); vertices.push(point.x + normal.x, point.y, point.z + normal.z, point.x - normal.x, point.y, point.z - normal.z); if (index < points.length - 1) { const base = index * 2; indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); } });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function addRibbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, mat: THREE.Material, walkable = true) { const value = prepare(new THREE.Mesh(ribbonGeometry(points, width), mat), name); value.userData.walkable = walkable; value.userData.navObstacle = false; value.userData.industrialRoute = true; parent.add(value); return value; }
function offsetPath(points: readonly THREE.Vector3[], offset: number) { return points.map((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); return point.clone().add(new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(offset)).setY(FLOOR_Y + 0.035); }); }

function orientToIsland(building: THREE.Group, definition: DistrictDefinition) {
  const worldPosition = building.position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z);
}

function addMasterplanInfrastructure(district: THREE.Group, definition: DistrictDefinition, m: Materials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'INDUSTRIAL_NEW__DISTRICT_PRODUCTION_INFRASTRUCTURE';
  const credentialRoad = districtArc(definition, 0.22); const productionRoad = districtArc(definition, 0.54); const seawallRoad = districtArc(definition, 0.86);
  addRibbon(infrastructure, 'INDUSTRIAL_NEW__SHIFT_CREDENTIAL_ROUTE', credentialRoad, 3.4, m.asphalt); addRibbon(infrastructure, 'INDUSTRIAL_NEW__PRODUCTION_MERIDIAN', productionRoad, 4.8, m.asphalt); addRibbon(infrastructure, 'INDUSTRIAL_NEW__SEA_WALL_SERVICE_LOOP', seawallRoad, 3.8, m.asphalt);
  [credentialRoad, productionRoad, seawallRoad].forEach((road, index) => { const guideA = addRibbon(infrastructure, `INDUSTRIAL_NEW__AMBER_GUIDANCE_STRIP_${index + 1}_A`, offsetPath(road, index === 1 ? -1.75 : -1.2), 0.08, m.amber.clone(), false); const guideB = addRibbon(infrastructure, `INDUSTRIAL_NEW__AMBER_GUIDANCE_STRIP_${index + 1}_B`, offsetPath(road, index === 1 ? 1.75 : 1.2), 0.08, m.amber.clone(), false); guideA.userData.animate = 'industrial-flicker'; guideB.userData.animate = 'industrial-flicker'; });
  [0.08, 0.29, 0.50, 0.71, 0.92].forEach((angularT, index) => { const crossing = districtSpine(definition, angularT); addRibbon(infrastructure, `INDUSTRIAL_NEW__CLASSIFIED_PRODUCTION_CROSSING_${index + 1}`, crossing, 2.2, index % 2 ? m.concreteDark : m.asphalt); addRibbon(infrastructure, `INDUSTRIAL_NEW__CROSSING_AMBER_GUIDE_${index + 1}`, offsetPath(crossing, 0.68), 0.055, m.amber.clone(), false); });
  district.add(infrastructure); return { infrastructure, credentialRoad, productionRoad, seawallRoad };
}

function addApproachesAndSkyline(infrastructure: THREE.Group, facilities: readonly THREE.Group[], definition: DistrictDefinition, m: Materials, routeSets: readonly THREE.Vector3[][]) {
  facilities.forEach((facility, index) => { const record = INDUSTRIAL_FACILITY_PROGRAM[index]; const entrance = new THREE.Vector3(0, FLOOR_Y + 0.03, Math.min(8.0, record.footprintMetres[1] / 20 + 0.8)).applyQuaternion(facility.quaternion).add(facility.position); const route = routeSets[record.radialT < 0.3 ? 0 : record.radialT > 0.7 ? 2 : 1]; const routePoint = route.reduce((closest, point) => point.distanceToSquared(entrance) < closest.distanceToSquared(entrance) ? point : closest, route[0]); const approach = [routePoint.clone(), routePoint.clone().lerp(entrance, 0.48), entrance]; addRibbon(infrastructure, `INDUSTRIAL_NEW__EXACT_FACILITY_APPROACH_${record.code.replace('Ø', 'NULL')}`, approach, 1.15, index % 3 ? m.concrete : m.asphalt); addRibbon(infrastructure, `INDUSTRIAL_NEW__FACILITY_APPROACH_GUIDE_${record.code.replace('Ø', 'NULL')}`, offsetPath(approach, 0.32), 0.05, m.amber.clone(), false); });
  const linkedPairs: readonly [number, number, string][] = [[1, 2, 'WORKS_TO_KILN'], [2, 3, 'KILN_TO_VACUUM'], [1, 12, 'WORKS_TO_POWER'], [5, 12, 'CRYO_TO_POWER'], [7, 14, 'HIVE_TO_NULL'], [13, 2, 'RECLAMATION_TO_KILN'], [11, 1, 'PLATFORM_TO_WORKS']];
  linkedPairs.forEach(([a, b, code], index) => { const start = facilities[a].position.clone().setY(7.8 + index % 3 * 0.8); const end = facilities[b].position.clone().setY(7.8 + index % 3 * 0.8); slabBetween(infrastructure, `INDUSTRIAL_NEW__ENCLOSED_CONVEYOR_BRIDGE_${code}`, start, end, 1.25, 1.1, index % 2 ? m.graphite : m.smokedGlass); const length = start.distanceTo(end); const supports = Math.max(1, Math.floor(length / 14)); for (let support = 1; support <= supports; support += 1) { const p = start.clone().lerp(end, support / (supports + 1)); pipe(infrastructure, `INDUSTRIAL_NEW__CONVEYOR_PYLON_${code}_${support}`, new THREE.Vector3(p.x, FLOOR_Y, p.z), new THREE.Vector3(p.x, p.y - 0.6, p.z), 0.18, m.concreteDark, true); } });
  for (let rack = 0; rack < 18; rack += 1) { const point = pointInDistrict(definition, 0.66, 0.04 + rack / 19 * 0.92, FLOOR_Y); const next = pointInDistrict(definition, 0.66, 0.04 + (rack + 0.72) / 19 * 0.92, FLOOR_Y); pipe(infrastructure, `INDUSTRIAL_NEW__ELEVATED_PROCESS_PIPE_RACK_${rack + 1}_A`, point.clone().setY(5.9), next.clone().setY(5.9), 0.13, rack % 3 ? m.silver : m.rust); pipe(infrastructure, `INDUSTRIAL_NEW__ELEVATED_PROCESS_PIPE_RACK_${rack + 1}_B`, point.clone().setY(6.35), next.clone().setY(6.35), 0.11, rack % 2 ? m.graphite : m.cyan); pipe(infrastructure, `INDUSTRIAL_NEW__PIPE_RACK_SUPPORT_${rack + 1}`, point, point.clone().setY(5.7), 0.14, m.graphite, true); }
}

function buildRelocatedLegacyAnnex(district: THREE.Group, definition: DistrictDefinition) {
  const legacy = new THREE.Group(); legacy.name = 'INDUSTRIAL__LEGACY_AUTOMATIC_WORKS_ANNEX'; legacy.userData.industrialDistrict = {};
  buildLegacyIndustrialDistrict(legacy, definition);
  const railway = legacy.getObjectByName('INDUSTRIAL__RAILWAY'); if (railway) { legacy.remove(railway); district.add(railway); }
  const legacyIndustrialMetadata = { ...(legacy.userData.industrialDistrict ?? {}) }; const legacyRailExtension = { ...(legacy.userData.industrialRailExtension ?? {}) };
  const railSystem = railway?.userData.railwaySystem; const coastal = railSystem?.coastalConnection; if (Array.isArray(coastal?.centre) && Array.isArray(coastal?.tangent)) { const [x, , z] = coastal.centre; const [tx, , tz] = coastal.tangent; const length = Math.hypot(tx, tz) || 1; const px = -tz / length; const pz = tx / length; const offset = metresToWorldUnits(Number(coastal.mainTrackCentreSpacingMetres ?? 5.2)) * 0.5; legacyRailExtension.connectionPoints = [[x + px * offset, z + pz * offset], [x - px * offset, z - pz * offset]]; }
  legacy.userData.exteriorProgram = true; legacy.userData.buildingCode = 'LEGACY-04'; legacy.userData.buildingName = 'Legacy Automatic Works Annex'; legacy.userData.semanticName = 'Legacy Automatic Works Annex'; legacy.userData.buildingSubtitle = 'Relocated evacuated production and maintenance complex'; legacy.userData.purpose = 'Preserved earlier industrial plant, automatic utilities, rail maintenance, cold storage, and staff traces'; legacy.userData.productionZone = 'Relocated historic works cell'; legacy.userData.exteriorMotif = 'rain-darkened factory canyon, evacuated halls, active refrigeration, legacy boiler plant, rail maintenance, silos, and automatic warning systems'; legacy.userData.preservedExistingBuilding = true; legacy.userData.navObstacle = true;
  legacy.position.copy(pointInDistrict(definition, 0.34, 0.985, FLOOR_Y)); legacy.scale.setScalar(0.42); orientToIsland(legacy, definition); legacy.userData.relocatedFrom = [0, 0, 0]; legacy.userData.relocatedScale = 0.42; district.add(legacy);
  return { legacy, railway, legacyIndustrialMetadata, legacyRailExtension };
}

export function buildIndustrialLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Industrial District Labs requires a masterplan sector');
  const m = createMaterials(); const { legacy, railway, legacyIndustrialMetadata, legacyRailExtension } = buildRelocatedLegacyAnnex(district, definition); const routes = addMasterplanInfrastructure(district, definition, m);
  const facilities = INDUSTRIAL_FACILITY_PROGRAM.map((record) => { const building = createFacility(record, m); building.position.copy(pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02)); orientToIsland(building, definition); const worldPosition = building.position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT }; district.add(building); return building; });
  addApproachesAndSkyline(routes.infrastructure, facilities, definition, m, [routes.credentialRoad, routes.productionRoad, routes.seawallRoad]);
  const names = INDUSTRIAL_FACILITY_PROGRAM.map((record) => record.name);
  district.userData.industrialRailExtension = { ...legacyRailExtension, relocatedLegacyAnnex: true, coastalRailwayPreserved: Boolean(railway) };
  district.userData.industrialDistrict = {
    ...legacyIndustrialMetadata,
    identity: 'Industrial District — The Works Below the Ring', mapLabel: 'Industrial District Labs', atmosphere: 'classified production landscape with permanent work lighting, amber road guidance, horizontal steam, sealed loading signals, and continuous autonomous machinery', status: 'operational between shifts; employee routes remain empty', buildingCount: facilities.length, preservedLegacyBuildingCount: 1,
    facilities: names,
    buildings: INDUSTRIAL_FACILITY_PROGRAM.map((record) => ({ code: record.code, name: record.name, subtitle: record.subtitle, purpose: record.purpose, productionZone: record.productionZone, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorMotif: record.exteriorMotif })),
    zones: { credentialBoundary: ['The Shift Meridian', 'The Machine Genesis Hall'], productionBelt: ['The Metamaterial Loomworks', 'The Additive Megafabrication Yard', 'Platform Zero', 'The Autonomous Microfactory Hive', 'The Biogenic Materials Foundry'], seawallWorks: ['The Vacuum Casting Cathedral', 'The Black Kiln', 'The Continuous Works', 'The Thermal Recovery and Process Power Station', 'Building Ø'], controlledProcessFront: ['The Cryogenic Forming Plant', 'The Closed-Loop Reclamation Works', 'The Destructive Testing Monolith'], preservedAnnex: ['Legacy Automatic Works Annex'] },
    circulation: { credentialRoute: 'INDUSTRIAL_NEW__SHIFT_CREDENTIAL_ROUTE', productionMeridian: 'INDUSTRIAL_NEW__PRODUCTION_MERIDIAN', seawallServiceLoop: 'INDUSTRIAL_NEW__SEA_WALL_SERVICE_LOOP', classifiedCrossings: 5, exactBuildingApproaches: 15, buriedFreightConnection: true, aboveGroundSecondaryRailway: true },
    signatureSystems: { shiftBays: 12, continuousWorksLoadingBays: 48, inductionRings: 3, vacuumVessels: 3, loomTensionTowers: 6, cryogenicPorts: 5, additiveGantryPrinters: 6, microfactoryCells: 36, bioreactorTowers: 12, machineGenesisDoors: 6, destructiveDropTowerMetres: 120, platformTracks: 12, thermalCoolingTowers: 3, reclamationSeparators: 9, buildingNullSensorPylons: 44 },
    legacyAnnex: { name: legacy.userData.buildingName, preserved: true, relocated: true, scale: legacy.userData.relocatedScale, position: legacy.position.toArray() },
    exteriorOnly: true,
  };
  district.userData.population = { plannedFacilities: names, plannedObjects: ['Production Meridian', 'Shift Credential Route', 'Seawall Service Loop', 'Platform Zero rail fan', 'Elevated process pipe racks', 'Enclosed conveyor bridges', 'Amber guidance strips', 'Legacy Automatic Works Annex'], realizedFeatureTags: names.map((name) => name.toLowerCase().replace(/ø/g, 'null').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')), realizedFacilityCount: facilities.length + 1, realizedObjectCount: routes.infrastructure.children.length, distinct: true, asymmetricCampus: true, localRoadCount: 23, radialCoverage: 0.97, angularCoverage: 0.98, exteriorOnly: true, preservedLegacyBuilding: true, classifiedProductionLandscape: true };
}
