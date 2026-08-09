import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { DistrictDefinition } from '../data/districts';

type ElectronicsBuildingForm =
  | 'angstrom'
  | 'interposer'
  | 'lumen-weave'
  | 'kelvin-null'
  | 'synaptic-stack'
  | 'spin-orbit'
  | 'aegis-power'
  | 'terahertz'
  | 'adaptive-skin'
  | 'sensorium';

export interface ElectronicsBuildingProgram {
  code: string;
  name: string;
  subtitle: string;
  focus: string;
  form: ElectronicsBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorSignature: string;
}

export const ELECTRONICS_LABS_BUILDING_PROGRAM: readonly ElectronicsBuildingProgram[] = [
  { code: 'EL1', name: 'Fabrica Ångström', subtitle: 'Advanced Logic Foundry', focus: 'Stacked CFET logic, nanosheet and forksheet devices, backside contacting, advanced power delivery, and heterogeneous semiconductor channels', form: 'angstrom', footprintMetres: [218, 126], heightMetres: 66, radialT: 0.10, angularT: 0.03, placementZone: 'Secure inner logic arc', exteriorSignature: 'two immense transistor volumes divided by a dielectric seam, eight structural gate loops, dense forksheet fins, backside copper power delivery, and disciplined white air-handling crowns' },
  { code: 'EL2', name: 'The Interposer Exchange', subtitle: 'Chiplet and 3D Integration Complex', focus: 'Heterogeneous chiplets, advanced packaging, silicon interposers, hybrid bonding, high-bandwidth memory, and high-density interfaces', form: 'interposer', footprintMetres: [194, 152], heightMetres: 82, radialT: 0.90, angularT: 0.03, placementZone: 'Modular packaging edge', exteriorSignature: 'eight heterogeneous chiplet buildings on a routed substrate podium, ribbed data bridges, glass microbump columns, and an asynchronous roofscape' },
  { code: 'EL3', name: 'Lumen Weave Institute', subtitle: 'Photonic and Optoelectronic Circuits', focus: 'Silicon photonics, optical interconnects, integrated lasers, modulation, sensing, and electronic-photonic integration', form: 'lumen-weave', footprintMetres: [176, 132], heightMetres: 58, radialT: 0.06, angularT: 0.28, placementZone: 'Scientific Art-facing photonic edge', exteriorSignature: 'two curved iridescent wings forming an incomplete ring resonator, etched waveguides, a continuous pearlescent ribbon, calibration domes, and black optical pools' },
  { code: 'EL4', name: 'Kelvin Null Center', subtitle: 'Cryogenic Control Electronics', focus: 'Cryogenic CMOS control, low-noise signal generation, qubit readout, calibration, and reduced-wiring quantum interfaces', form: 'kelvin-null', footprintMetres: [142, 136], heightMetres: 94, radialT: 0.86, angularT: 0.28, placementZone: 'Protected cryogenic interface', exteriorSignature: 'three visually separated thermal cylinders, heavy maintenance rings, vacuum-jacketed umbilicals, helium recovery vessels, radiator fins, and a concentric frost plaza' },
  { code: 'EL5', name: 'Synaptic Stack Laboratory', subtitle: 'Neuromorphic and Memristive Electronics', focus: 'Memristors, artificial synapses, analog neural hardware, event-driven computation, and three-dimensional memory-compute integration', form: 'synaptic-stack', footprintMetres: [172, 134], heightMetres: 118, radialT: 0.20, angularT: 0.50, placementZone: 'Central adaptive-compute belt', exteriorSignature: 'three oxide-red dendritic wings beneath a graphite matrix tower, slow electrochromic memory fields, a repeatedly branching canopy, and pressure-responsive pavement nodes' },
  { code: 'EL6', name: 'The Spin-Orbit Vault', subtitle: 'Magnetic Memory and Spintronic Systems', focus: 'MRAM, magnetic tunnel junctions, spin-orbit switching, antiferromagnetic devices, spintronic memristors, and magnetic neural hardware', form: 'spin-orbit', footprintMetres: [154, 142], heightMetres: 52, radialT: 0.78, angularT: 0.50, placementZone: 'Magnetically quiet central domain', exteriorSignature: 'a low ferrite core behind two incomplete domain walls, fixed moiré fins, radial roof fields, tangential entrances, and slowly reorienting plaza stones' },
  { code: 'EL7', name: 'Aegis Power Bastion', subtitle: 'Wide- and Ultra-Wide-Bandgap Electronics', focus: 'Silicon carbide, gallium nitride, gallium oxide, diamond, high-field packaging, thermal management, grid conversion, and pulsed power', form: 'aegis-power', footprintMetres: [204, 148], heightMetres: 72, radialT: 0.78, angularT: 0.73, placementZone: 'Outer-clearance power test boundary', exteriorSignature: 'two heat-sink laboratory bastions around a shielded test canyon, glass-fronted copper busbars, ceramic buttresses, radiator towers, and grounded artificial-tree masts' },
  { code: 'EL8', name: 'The Terahertz Metrology Spire', subtitle: 'RF, Millimeter-Wave and Submillimeter Electronics', focus: 'High-frequency circuits, on-wafer characterization, terahertz calibration, phased arrays, over-the-air measurements, and traceable metrology', form: 'terahertz', footprintMetres: [144, 126], heightMetres: 168, radialT: 0.78, angularT: 0.96, placementZone: 'Perimeter high-frequency clearance', exteriorSignature: 'a faceted square-to-octagonal tower with phased-array crown and needle radome above three black anechoic courts, a surveyed calibration line, and twisting waveguide bridges' },
  { code: 'EL9', name: 'The Adaptive Skin Pavilion', subtitle: 'Flexible, Printed and Biointegrated Electronics', focus: 'Stretchable circuits, organic conductors, electronic skin, flexible neural interfaces, tissue-conformal sensors, and biohybrid devices', form: 'adaptive-skin', footprintMetres: [184, 136], heightMetres: 42, radialT: 0.20, angularT: 0.73, placementZone: 'Soft Scientific Art interface', exteriorSignature: 'a low folded translucent membrane over branching frames, conductive inner meshes, fibre canopies, warm-water basins, bioswales, and protected printed sensor ribbons' },
  { code: 'EL10', name: 'Sensorium Hive', subtitle: 'MEMS, NEMS and In-Sensor Computing Laboratory', focus: 'MEMS and NEMS, multifunctional sensor arrays, event-driven vision, analog edge processing, and devices that sense and compute together', form: 'sensorium', footprintMetres: [188, 148], heightMetres: 62, radialT: 0.20, angularT: 0.96, placementZone: 'Instrumented environmental edge', exteriorSignature: 'twelve modality-specific hexagonal and circular sensing volumes around an open calibration field, a cable-borne sensor canopy, microclimate needles, and branching test paths' },
] as const;

const DISTRICT_ID = 'electronics-microelectronics-labs';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_6 = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
const UNIT_CYLINDER_8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 12, 8);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_Z = new THREE.Vector3(0, 0, 1);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

function material(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  const value = new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.18, ...options });
  value.name = name;
  return value;
}

function createMaterials() {
  const graphite = material('Electronics graphite technical ceramic', '#1b2023', { roughness: 0.78, metalness: 0.22 });
  const black = material('Electronics light-absorbing black glass ceramic', '#070b0d', { roughness: 0.28, metalness: 0.58 });
  const blackGlass = material('Electronics anti-reflective black research glass', '#081117', { roughness: 0.08, metalness: 0.42, emissive: '#071a22', emissiveIntensity: 0.12, transparent: true, opacity: 0.84, depthWrite: true });
  const porcelain = material('Electronics pale technical porcelain', '#d9d8d0', { roughness: 0.54, metalness: 0.08 });
  const whiteCeramic = material('Electronics white dielectric ceramic', '#eeece4', { roughness: 0.44, metalness: 0.06 });
  const titanium = material('Electronics satin titanium', '#aab3b6', { roughness: 0.27, metalness: 0.92 });
  const steel = material('Electronics frosted stainless steel', '#b8c1c1', { roughness: 0.38, metalness: 0.86 });
  const copper = material('Electronics oxidized copper service alloy', '#8b593e', { roughness: 0.42, metalness: 0.82 });
  const oxideRed = material('Electronics deep oxide-red neural ceramic', '#6d3027', { roughness: 0.8, metalness: 0.12 });
  const ferrite = material('Electronics ferrite-grain magnetic ceramic', '#111719', { roughness: 0.65, metalness: 0.5 });
  const photonic = material('Electronics iridescent photonic coating', '#72899e', { roughness: 0.18, metalness: 0.72, emissive: '#253f5b', emissiveIntensity: 0.22 });
  const violetPhotonic = material('Electronics violet-grey photonic panel', '#655f7a', { roughness: 0.2, metalness: 0.65, emissive: '#2a2440', emissiveIntensity: 0.2 });
  const lowIronGlass = material('Electronics low-iron photonic glass', '#8fb4bc', { roughness: 0.08, metalness: 0.18, emissive: '#1c424b', emissiveIntensity: 0.11, transparent: true, opacity: 0.62, depthWrite: true });
  const membrane = material('Electronics translucent fluoropolymer membrane', '#b9d0cd', { roughness: 0.28, metalness: 0.04, transparent: true, opacity: 0.64, depthWrite: true, side: THREE.DoubleSide });
  const conductive = material('Electronics flexible conductive mesh', '#30383a', { roughness: 0.38, metalness: 0.78 });
  const photovoltaic = material('Electronics blue-black photovoltaic field', '#10232e', { roughness: 0.2, metalness: 0.66 });
  const paving = material('Signal Spine pale technical stone', '#c4c1b5', { roughness: 0.93, metalness: 0.02 });
  const servicePaving = material('Electronics dark service paving', '#2c3030', { roughness: 0.94, metalness: 0.07 });
  const basalt = material('Electronics black basalt gravel', '#242625', { roughness: 1, metalness: 0 });
  const moss = material('Electronics clipped dark moss', '#3f5345', { roughness: 0.98, metalness: 0 });
  const grass = material('Electronics clipped silver grass', '#7f8b85', { roughness: 0.98, metalness: 0.01 });
  const water = material('Electronics black calibration water', '#092028', { roughness: 0.08, metalness: 0.32, transparent: true, opacity: 0.82, depthWrite: true });
  const cold = material('Electronics cold-white diagnostic light', '#efffff', { emissive: '#9eeaff', emissiveIntensity: 2.6, roughness: 0.1, metalness: 0.04 });
  const cyan = material('Electronics optical cyan signal', '#bff9ff', { emissive: '#31cce5', emissiveIntensity: 2.8, roughness: 0.1, metalness: 0.05 });
  const violet = material('Electronics photonic violet signal', '#eee0ff', { emissive: '#8b62dc', emissiveIntensity: 2.5, roughness: 0.12, metalness: 0.05 });
  const amber = material('Electronics temporary amber diagnostic', '#ffe2b0', { emissive: '#e47e21', emissiveIntensity: 2.35, roughness: 0.14, metalness: 0.05 });
  const red = material('Electronics high-field emergency route light', '#ff8170', { emissive: '#d52c21', emissiveIntensity: 2.6, roughness: 0.12, metalness: 0.04 });
  [cold, cyan, violet, amber, red].forEach((value) => { value.userData.isDistrictAccent = true; });
  return { graphite, black, blackGlass, porcelain, whiteCeramic, titanium, steel, copper, oxideRed, ferrite, photonic, violetPhotonic, lowIronGlass, membrane, conductive, photovoltaic, paving, servicePaving, basalt, moss, grass, water, cold, cyan, violet, amber, red };
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

function roundedBox(parent: THREE.Object3D, name: string, size: readonly [number, number, number], radius: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const value = prepare(new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius), mat), name, obstacle);
  value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function cylinder(parent: THREE.Object3D, name: string, diameter: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 24, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const geometry = segments === 6 ? UNIT_CYLINDER_6 : segments === 8 ? UNIT_CYLINDER_8 : segments === 12 ? UNIT_CYLINDER_12 : UNIT_CYLINDER_24;
  const value = prepare(new THREE.Mesh(geometry, mat), name, obstacle);
  value.scale.set(diameter, height, diameter); value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function taper(parent: THREE.Object3D, name: string, bottomDiameter: number, topDiameter: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 8, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const value = prepare(new THREE.Mesh(new THREE.CylinderGeometry(topDiameter * 0.5, bottomDiameter * 0.5, height, segments), mat), name, obstacle);
  value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function sphere(parent: THREE.Object3D, name: string, scale: readonly [number, number, number], mat: THREE.Material, position: readonly [number, number, number], obstacle = false) {
  const value = prepare(new THREE.Mesh(UNIT_SPHERE, mat), name, obstacle);
  value.scale.set(...scale); value.position.set(...position); parent.add(value); return value;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, mat: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0], arc = Math.PI * 2, obstacle = false, radialSegments = 6, tubularSegments = 40) {
  const key = `${radius.toFixed(3)}:${tube.toFixed(3)}:${arc.toFixed(3)}:${radialSegments}:${tubularSegments}`;
  let geometry = TORUS_CACHE.get(key);
  if (!geometry) { geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc); TORUS_CACHE.set(key, geometry); }
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

function arcSegments(parent: THREE.Object3D, prefix: string, radiusX: number, radiusZ: number, y: number, height: number, depth: number, segments: number, start: number, arc: number, mat: THREE.Material, obstacle = false, rotationOffset = 0) {
  for (let index = 0; index < segments; index += 1) {
    const a0 = start + arc * index / segments + rotationOffset; const a1 = start + arc * (index + 1) / segments + rotationOffset; const angle = (a0 + a1) * 0.5;
    const x = Math.cos(angle) * radiusX; const z = Math.sin(angle) * radiusZ; const tangentX = -Math.sin(angle) * radiusX; const tangentZ = Math.cos(angle) * radiusZ;
    const length = Math.hypot(tangentX, tangentZ) * arc / segments * 1.07; const rotationY = -Math.atan2(tangentZ, tangentX);
    box(parent, `${prefix}_${index + 1}`, [length, height, depth], mat, [x, y + height * 0.5, z], obstacle, [0, rotationY, 0]);
  }
}

function pulse<T extends THREE.Object3D>(object: T, speed: number, phase = 0, minIntensity = 0.08, maxIntensity = 2.6) {
  object.userData.animate = 'electronics-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate<T extends THREE.Object3D>(object: T, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'electronics-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function createAngstrom(m: Materials) {
  const root = new THREE.Group(); root.name = 'ELECTRONICS__EL1__FABRICA_ANGSTROM';
  box(root, 'ELECTRONICS__EL1__BACKSIDE_POWER_TRENCH', [20.2, 0.48, 10.6], m.black, [0, 0.24, 0], false);
  box(root, 'ELECTRONICS__EL1__LOWER_N_TYPE_LOGIC_VOLUME', [18.4, 3.0, 8.7], m.graphite, [0, 2.0, 0], true);
  pulse(box(root, 'ELECTRONICS__EL1__RAZOR_THIN_DIELECTRIC_SEAM', [18.7, 0.22, 8.84], m.cyan.clone(), [0, 3.62, 0]), 0.0016, 0.2, 0.05, 1.2);
  box(root, 'ELECTRONICS__EL1__UPPER_P_TYPE_LOGIC_VOLUME', [17.8, 2.72, 8.2], m.porcelain, [0, 5.09, 0], true);
  box(root, 'ELECTRONICS__EL1__CONTINUOUS_NORTHERN_OBSERVATION_STRIP', [16.6, 0.34, 0.12], m.blackGlass, [0, 5.25, 4.16]);
  for (let gate = 0; gate < 8; gate += 1) {
    const x = -8.75 + gate * 2.5;
    box(root, `ELECTRONICS__EL1__STRUCTURAL_GATE_LOOP_${gate + 1}_WEST_LEG`, [0.24, 6.9, 0.34], m.titanium, [x, 3.45, -4.62], true);
    box(root, `ELECTRONICS__EL1__STRUCTURAL_GATE_LOOP_${gate + 1}_EAST_LEG`, [0.24, 6.9, 0.34], m.titanium, [x, 3.45, 4.62], true);
    box(root, `ELECTRONICS__EL1__STRUCTURAL_GATE_LOOP_${gate + 1}_CROWN`, [0.24, 0.34, 9.58], m.titanium, [x, 6.74, 0], true);
  }
  for (let fin = 0; fin < 22; fin += 1) {
    const x = -8.6 + fin / 21 * 17.2; const density = fin > 13 ? 0.42 : 0.68;
    box(root, `ELECTRONICS__EL1__FORKSHEET_DIELECTRIC_FIN_${fin + 1}`, [0.1, 4.9 + fin % 4 * 0.32, density], fin % 5 ? m.whiteCeramic : m.photonic, [x, 3.56, -4.48], false, [0, fin > 13 ? 0.18 : 0, 0]);
  }
  for (let channel = 0; channel < 8; channel += 1) {
    const x = -7.7 + channel * 2.2;
    pipe(root, `ELECTRONICS__EL1__BACKSIDE_COPPER_POWER_CHANNEL_${channel + 1}`, new THREE.Vector3(x, 0.18, -5.7), new THREE.Vector3(x, 0.18, 5.45), 0.18, m.copper, true);
    box(root, `ELECTRONICS__EL1__POWER_ROUTE_BLACK_GLASS_CROSSING_${channel + 1}`, [0.75, 0.12, 1.45], m.blackGlass, [x, 0.32, 5.05]);
  }
  for (let crown = 0; crown < 8; crown += 1) {
    const x = -7.6 + crown * 2.18;
    roundedBox(root, `ELECTRONICS__EL1__WHITE_AIR_HANDLING_CROWN_${crown + 1}`, [1.28, 0.82 + crown % 3 * 0.16, 1.58], 0.12, m.whiteCeramic, [x, 7.08 + crown % 3 * 0.08, crown % 2 ? 1.65 : -1.65], true);
    cylinder(root, `ELECTRONICS__EL1__LOW_VACUUM_EXHAUST_${crown + 1}`, 0.28, 0.8, m.steel, [x + 0.42, 7.88, crown % 2 ? 1.65 : -1.65], true, 8);
  }
  for (let bed = 0; bed < 10; bed += 1) box(root, `ELECTRONICS__EL1__RECTANGULAR_DARK_MOSS_ISLAND_${bed + 1}`, [1.35, 0.11, 0.62], bed % 2 ? m.moss : m.grass, [-8.1 + bed * 1.8, 0.1, 6.0 + bed % 2 * 0.62], false);
  return root;
}

function createInterposer(m: Materials) {
  const root = new THREE.Group(); root.name = 'ELECTRONICS__EL2__INTERPOSER_EXCHANGE';
  box(root, 'ELECTRONICS__EL2__SILICON_CARBIDE_SUBSTRATE_PODIUM', [17.4, 1.4, 11.6], m.graphite, [0, 0.7, 0], true);
  const blocks = [
    [-5.9, -2.8, 3.5, 3.2, m.titanium], [-1.9, -2.8, 4.8, 3.3, m.blackGlass], [2.25, -2.8, 3.9, 3.4, m.porcelain], [6.05, -2.8, 5.5, 2.9, m.violetPhotonic],
    [-5.5, 2.1, 5.2, 3.4, m.copper], [-1.35, 2.25, 3.7, 3.7, m.photonic], [3.05, 2.05, 5.8, 3.6, m.steel], [6.35, 2.25, 4.3, 2.7, m.lowIronGlass],
  ] as const;
  blocks.forEach(([x, z, height, width, mat], index) => {
    const block = new THREE.Group(); block.name = `ELECTRONICS__EL2__SPECIALIZED_CHIPLET_VOLUME_${index + 1}`; root.add(block);
    box(block, `${block.name}__PRIMARY_RESEARCH_BLOCK`, [width, height, 3.3], mat, [x, 1.4 + height * 0.5, z], true);
    for (let bay = 0; bay < 5; bay += 1) box(block, `${block.name}__ALIGNMENT_BAY_${bay + 1}`, [width * 0.12, 0.18, 0.14], bay === index % 5 ? m.cyan : m.black, [x - width * 0.34 + bay * width * 0.17, 1.8 + bay % 2 * 0.5, z + 1.68]);
    roundedBox(block, `${block.name}__ROOF_PROCESS_HOUSING`, [width * 0.54, 0.55, 1.2], 0.1, index % 2 ? m.whiteCeramic : m.graphite, [x, 1.72 + height, z], true);
  });
  const bridgePairs = [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 7], [1, 5], [2, 6]] as const;
  bridgePairs.forEach(([a, b], index) => {
    const start = new THREE.Vector3(blocks[a][0], 4.25 + index % 2 * 0.42, blocks[a][1]); const end = new THREE.Vector3(blocks[b][0], 4.25 + index % 2 * 0.42, blocks[b][1]);
    slabBetween(root, `ELECTRONICS__EL2__RIBBED_DATA_LINK_BRIDGE_${index + 1}`, start, end, 1.05, 0.72, index % 3 ? m.graphite : m.lowIronGlass);
    for (let rib = 1; rib < 5; rib += 1) { const point = start.clone().lerp(end, rib / 5); cylinder(root, `ELECTRONICS__EL2__BRIDGE_BUNDLE_RIB_${index + 1}_${rib}`, 1.22, 0.1, m.titanium, [point.x, point.y, point.z], false, 8, [Math.PI / 2, 0, 0]); }
  });
  for (let bump = 0; bump < 28; bump += 1) {
    const x = -7.7 + bump / 27 * 15.4;
    cylinder(root, `ELECTRONICS__EL2__GLASS_MICROBUMP_COLUMN_${bump + 1}`, 0.18, 3.8 + bump % 4 * 0.28, m.lowIronGlass, [x, 3.3, 5.76], false, 8);
    pulse(sphere(root, `ELECTRONICS__EL2__MICROBUMP_DIAGNOSTIC_${bump + 1}`, [0.11, 0.11, 0.11], (bump % 6 ? m.cold : m.violet).clone(), [x, 5.18 + bump % 4 * 0.14, 5.76]), 0.0014, bump * 0.31, 0.02, 1.4);
  }
  for (let trace = 0; trace < 16; trace += 1) box(root, `ELECTRONICS__EL2__UNINTERRUPTED_COPPER_SUBSTRATE_TRACE_${trace + 1}`, [0.08, 0.025, 10.6], trace % 5 ? m.copper : m.cyan, [-7.4 + trace * 0.98, 1.42, 0], false, [0, trace % 2 ? 0.1 : -0.1, 0]);
  for (let component = 0; component < 12; component += 1) cylinder(root, `ELECTRONICS__EL2__CARRIER_FORECOURT_COMPONENT_${component + 1}`, 0.9 + component % 3 * 0.35, 0.18 + component % 2 * 0.18, [m.paving, m.water, m.moss][component % 3], [-7 + component * 1.28, 0.12, 7.1 + component % 2 * 0.65], false, component % 3 === 1 ? 24 : 8);
  return root;
}

function createLumenWeave(m: Materials) {
  const root = new THREE.Group(); root.name = 'ELECTRONICS__EL3__LUMEN_WEAVE_INSTITUTE';
  const west = new THREE.Group(); west.name = 'ELECTRONICS__EL3__WEST_PHOTONIC_RING_WING'; root.add(west);
  const east = new THREE.Group(); east.name = 'ELECTRONICS__EL3__EAST_PHOTONIC_RING_WING'; root.add(east);
  arcSegments(west, 'ELECTRONICS__EL3__WEST_CURVED_GLASS_SEGMENT', 6.1, 4.75, 0.32, 3.5, 1.95, 13, Math.PI * 0.16, Math.PI * 0.72, m.lowIronGlass, true);
  arcSegments(east, 'ELECTRONICS__EL3__EAST_CURVED_GLASS_SEGMENT', 6.1, 4.75, 0.32, 3.5, 1.95, 13, Math.PI * 1.12, Math.PI * 0.72, m.lowIronGlass, true);
  for (let fin = 0; fin < 36; fin += 1) {
    const angle = Math.PI * 0.12 + fin / 35 * Math.PI * 1.76; const x = Math.cos(angle) * 7.05; const z = Math.sin(angle) * 5.55;
    box(root, `ELECTRONICS__EL3__NANOSTRUCTURED_IRIDESCENT_FIN_${fin + 1}`, [0.1, 4.0, 0.62], fin % 4 ? m.photonic : m.violetPhotonic, [x, 2.28, z], false, [0, -angle, (fin % 5 - 2) * 0.012]);
  }
  for (let guide = 0; guide < 8; guide += 1) {
    const radius = 3.1 + guide * 0.42;
    pulse(torus(root, `ELECTRONICS__EL3__ETCHED_OPTICAL_WAVEGUIDE_${guide + 1}`, radius, 0.045, (guide % 3 ? m.cyan : m.violet).clone(), [0, 1.25 + guide % 3 * 0.74, 0], [Math.PI / 2, 0, 0], Math.PI * (1.3 + guide % 2 * 0.24), false, 5, 48), 0.0015 + guide * 0.00008, guide * 0.48, 0.01, 1.55);
    torus(root, `ELECTRONICS__EL3__RING_RESONATOR_FRAME_${guide + 1}`, 0.48 + guide % 3 * 0.16, 0.07, m.titanium, [-5.2 + guide * 1.48, 2.35 + guide % 2 * 0.7, 4.76], [Math.PI / 2, 0, 0], Math.PI * 2, false, 6, 24);
  }
  slabBetween(root, 'ELECTRONICS__EL3__UPPER_LOOP_CLOSING_GLASS_BRIDGE', new THREE.Vector3(-3.5, 4.25, -3.3), new THREE.Vector3(3.5, 4.25, -3.3), 1.15, 0.82, m.lowIronGlass);
  arcSegments(root, 'ELECTRONICS__EL3__CONTINUOUS_PEARLESCENT_RIBBON', 7.6, 6.15, 3.65, 0.28, 0.82, 34, Math.PI * 0.05, Math.PI * 1.9, m.porcelain, false);
  for (let dome = 0; dome < 3; dome += 1) { const x = -4.1 + dome * 4.2; sphere(root, `ELECTRONICS__EL3__TRANSLUCENT_CALIBRATION_DOME_${dome + 1}`, [1.25, 0.72, 1.25], m.membrane, [x, 4.3 + dome % 2 * 0.5, dome === 1 ? 1.4 : -0.8]); for (let ring = 0; ring < 4; ring += 1) torus(root, `ELECTRONICS__EL3__DOME_CONCENTRIC_ETCH_${dome + 1}_${ring + 1}`, 0.32 + ring * 0.22, 0.025, m.titanium, [x, 4.45 + dome % 2 * 0.5, dome === 1 ? 2.58 : 0.38], [Math.PI / 2, 0, 0], Math.PI * 2, false, 4, 20); }
  for (let pool = 0; pool < 6; pool += 1) box(root, `ELECTRONICS__EL3__BLACK_OPTICAL_TEST_POOL_${pool + 1}`, [2.0 + pool % 2, 0.08, 0.78], m.water, [-6.5 + pool * 2.55, 0.06, 6.35 + pool % 2 * 0.72], false, [0, pool % 2 ? 0.18 : -0.12, 0]);
  return root;
}

function createKelvinNull(m: Materials) {
  const root = new THREE.Group(); root.name = 'ELECTRONICS__EL4__KELVIN_NULL_CENTER';
  cylinder(root, 'ELECTRONICS__EL4__OUTER_THERMAL_BOUNDARY', 12.8, 2.5, m.steel, [0, 1.35, 0], true, 24);
  cylinder(root, 'ELECTRONICS__EL4__SECOND_BLACK_THERMAL_BOUNDARY', 8.8, 4.3, m.blackGlass, [0, 2.5, 0], true, 24);
  cylinder(root, 'ELECTRONICS__EL4__INNER_VACUUM_FLASK_TOWER', 4.3, 8.2, m.porcelain, [0, 4.65, 0], true, 24);
  torus(root, 'ELECTRONICS__EL4__OUTER_SHELL_COLD_GAP', 6.62, 0.11, m.cold, [0, 2.64, 0]);
  torus(root, 'ELECTRONICS__EL4__SECOND_SHELL_COLD_GAP', 4.58, 0.1, m.cold, [0, 4.72, 0]);
  for (let ring = 0; ring < 3; ring += 1) torus(root, `ELECTRONICS__EL4__HEAVY_EXTERNAL_STRUCTURAL_RING_${ring + 1}`, 6.85 - ring * 1.34, 0.17, ring === 1 ? m.graphite : m.titanium, [0, 2.4 + ring * 2.0, 0], [Math.PI / 2, 0, 0], Math.PI * 2, true, 8, 44);
  for (let umbilical = 0; umbilical < 12; umbilical += 1) { const angle = umbilical / 12 * Math.PI * 2; const radius = 5.55; pipe(root, `ELECTRONICS__EL4__VACUUM_JACKETED_UMBILICAL_${umbilical + 1}`, new THREE.Vector3(Math.cos(angle) * radius, 0.4, Math.sin(angle) * radius), new THREE.Vector3(Math.cos(angle) * (radius - 1.5), 6.7, Math.sin(angle) * (radius - 1.5)), 0.1, umbilical % 4 ? m.steel : m.copper, true); pulse(sphere(root, `ELECTRONICS__EL4__UMBILICAL_DIAGNOSTIC_${umbilical + 1}`, [0.1, 0.12, 0.1], (umbilical % 5 ? m.cold : m.cyan).clone(), [Math.cos(angle) * radius, 2.0 + umbilical % 4, Math.sin(angle) * radius]), 0.0012, umbilical * 0.44, 0.02, 1.2); }
  for (let vessel = 0; vessel < 8; vessel += 1) { const x = -5.5 + vessel * 1.55; cylinder(root, `ELECTRONICS__EL4__HELIUM_RECOVERY_VESSEL_${vessel + 1}`, 0.88, 3.5 + vessel % 3 * 0.55, m.whiteCeramic, [x, 1.8 + vessel % 3 * 0.275, -7.0], true, 12); }
  for (let fin = 0; fin < 18; fin += 1) box(root, `ELECTRONICS__EL4__BLACK_HEAT_REJECTION_RADIATOR_FIN_${fin + 1}`, [0.12, 2.8 + fin % 4 * 0.25, 1.8], m.graphite, [-5.1 + fin * 0.6, 1.42 + fin % 4 * 0.125, 7.0], true, [0, 0.08, 0]);
  for (let plaza = 0; plaza < 6; plaza += 1) torus(root, `ELECTRONICS__EL4__CONCENTRIC_THERMAL_PLAZA_RING_${plaza + 1}`, 7.3 + plaza * 0.55, 0.18, [m.paving, m.porcelain, m.servicePaving][plaza % 3], [0, 0.03 + plaza * 0.003, 0]);
  arcSegments(root, 'ELECTRONICS__EL4__TANGENTIAL_ENTRANCE_WALL', 7.8, 7.8, 0.04, 2.1, 0.36, 7, Math.PI * 0.03, Math.PI * 0.34, m.graphite, true);
  return root;
}

function createSynapticStack(m: Materials) {
  const root = new THREE.Group(); root.name = 'ELECTRONICS__EL5__SYNAPTIC_STACK_LABORATORY';
  const arms = [{ angle: 0.08, length: 11.4 }, { angle: Math.PI * 0.7, length: 9.8 }, { angle: Math.PI * 1.34, length: 9.0 }];
  arms.forEach((arm, armIndex) => { const direction = new THREE.Vector3(Math.cos(arm.angle), 0, Math.sin(arm.angle)); const center = direction.clone().multiplyScalar(arm.length * 0.42); box(root, `ELECTRONICS__EL5__DENDRITIC_BASE_WING_${armIndex + 1}`, [arm.length, 2.25, 3.65], m.oxideRed, [center.x, 1.18, center.z], true, [0, -arm.angle, 0]); for (let tile = 0; tile < 22; tile += 1) { const point = direction.clone().multiplyScalar(0.6 + tile / 21 * (arm.length - 1.6)); const normal = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(1.86); box(root, `ELECTRONICS__EL5__VARIABLE_DEPTH_NEURAL_TILE_${armIndex + 1}_${tile + 1}`, [0.28 + tile % 3 * 0.08, 0.36 + tile % 4 * 0.08, 0.12], tile % 6 ? m.oxideRed : m.graphite, [point.x + normal.x, 0.72 + tile % 4 * 0.34, point.z + normal.z], false, [0, -arm.angle, 0]); } });
  box(root, 'ELECTRONICS__EL5__GRAPHITE_MATRIX_TOWER_CORE', [5.5, 10.8, 5.0], m.blackGlass, [0, 6.1, 0], true);
  for (let column = 0; column < 12; column += 1) { const edge = column % 4; const offset = -2.45 + Math.floor(column / 4) * 2.45; const x = edge < 2 ? (edge ? 2.9 : -2.9) : offset; const z = edge < 2 ? offset : (edge === 2 ? -2.65 : 2.65); box(root, `ELECTRONICS__EL5__MATRIX_GRAPHITE_COLUMN_${column + 1}`, [0.22, 12.2, 0.22], m.graphite, [x, 6.15, z], true); }
  for (let plate = 0; plate < 11; plate += 1) box(root, `ELECTRONICS__EL5__MATRIX_HORIZONTAL_PLATE_${plate + 1}`, [6.3, 0.15, 5.8], plate % 3 ? m.porcelain : m.titanium, [0, 1.1 + plate * 1.06, 0], false);
  for (let panel = 0; panel < 48; panel += 1) { const face = panel % 4; const row = Math.floor(panel / 4) % 6; const column = Math.floor(panel / 24); const x = face < 2 ? (face ? 2.78 : -2.78) : -1.25 + column * 2.5; const z = face < 2 ? -1.25 + column * 2.5 : (face === 2 ? -2.53 : 2.53); pulse(box(root, `ELECTRONICS__EL5__ELECTROCHROMIC_MEMORY_PANEL_${panel + 1}`, face < 2 ? [0.08, 0.64, 1.7] : [1.7, 0.64, 0.08], [m.violet, m.cyan, m.cold, m.black][(panel + row) % 4].clone(), [x, 2.2 + row * 1.35, z]), 0.00065 + panel % 5 * 0.00006, panel * 0.21, 0.01, 0.62); }
  const branchStart = new THREE.Vector3(0, 3.1, 4.7); for (let level = 0; level < 4; level += 1) { const count = 2 ** level; for (let branch = 0; branch < count; branch += 1) { const spread = (branch - (count - 1) * 0.5) * (7.2 / count); pipe(root, `ELECTRONICS__EL5__BRANCHING_ENTRANCE_CANOPY_${level + 1}_${branch + 1}`, branchStart.clone().add(new THREE.Vector3(spread * 0.45, -level * 0.42, level * 1.65)), branchStart.clone().add(new THREE.Vector3(spread, -(level + 1) * 0.42, (level + 1) * 1.65)), 0.13 / (1 + level * 0.22), level % 2 ? m.titanium : m.graphite, true); } }
  for (let plate = 0; plate < 10; plate += 1) box(root, `ELECTRONICS__EL5__THIN_ROOF_COOLING_PLATE_${plate + 1}`, [5.8 - plate * 0.24, 0.1, 4.8], plate % 2 ? m.titanium : m.graphite, [0, 12.0 + plate * 0.18, 0]);
  return root;
}

function createSpinOrbit(m: Materials) {
  const root = new THREE.Group(); root.name = 'ELECTRONICS__EL6__SPIN_ORBIT_VAULT';
  cylinder(root, 'ELECTRONICS__EL6__FERRITE_CORE_VAULT', 10.4, 3.6, m.ferrite, [0, 1.9, 0], true, 24);
  arcSegments(root, 'ELECTRONICS__EL6__INNER_INCOMPLETE_DOMAIN_WALL', 7.2, 7.2, 0.05, 2.25, 0.52, 24, Math.PI * 0.1, Math.PI * 1.58, m.titanium, true);
  arcSegments(root, 'ELECTRONICS__EL6__OUTER_INCOMPLETE_DOMAIN_WALL', 8.75, 8.75, 0.05, 1.72, 0.46, 22, Math.PI * 1.02, Math.PI * 1.52, m.graphite, true);
  for (let fin = 0; fin < 72; fin += 1) { const angle = fin / 72 * Math.PI * 2; const radius = 5.32; const height = 2.25 + Math.sin(angle * 7) * 0.55; pulse(box(root, `ELECTRONICS__EL6__MOIRE_MAGNETIC_FACADE_FIN_${fin + 1}`, [0.1, height, 0.58], (fin % 11 ? m.titanium : m.cyan).clone(), [Math.cos(angle) * radius, 1.2 + height * 0.5, Math.sin(angle) * radius], false, [0, -angle + Math.sin(angle * 5) * 0.18, 0]), 0.00085, fin * 0.17, 0.01, 0.7); }
  for (let segment = 0; segment < 16; segment += 1) { const angle = segment / 16 * Math.PI * 2; const mat = [m.photovoltaic, m.porcelain, m.moss, m.graphite][segment % 4]; box(root, `ELECTRONICS__EL6__ALTERNATING_RADIAL_ROOF_SEGMENT_${segment + 1}`, [0.72, 0.1, 4.4], mat, [Math.cos(angle) * 2.5, 3.78, Math.sin(angle) * 2.5], false, [0, -angle, 0]); }
  torus(root, 'ELECTRONICS__EL6__BROKEN_CIRCULAR_MAINTENANCE_RAIL', 5.55, 0.08, m.titanium, [0, 4.02, 0], [Math.PI / 2, 0, 0], Math.PI * 1.72, false, 6, 52);
  for (let mast = 0; mast < 2; mast += 1) { const x = mast ? 5.0 : -5.0; cylinder(root, `ELECTRONICS__EL6__NONMETALLIC_MAGNETOMETER_MAST_${mast + 1}`, 0.32, 5.6, m.porcelain, [x, 4.0, 0], true, 8); sphere(root, `ELECTRONICS__EL6__MAGNETOMETER_SHELL_${mast + 1}`, [0.44, 0.65, 0.44], m.membrane, [x, 7.0, 0]); }
  for (let line = 0; line < 7; line += 1) torus(root, `ELECTRONICS__EL6__PLAZA_DOMAIN_BOUNDARY_${line + 1}`, 6.1 + line * 0.46, 0.045, line % 3 ? m.titanium : m.cyan, [0, 0.05, 0], [Math.PI / 2, 0, 0], Math.PI * (0.7 + line * 0.1), false, 4, 34);
  for (let stone = 0; stone < 12; stone += 1) { const angle = stone / 12 * Math.PI * 2; rotate(cylinder(root, `ELECTRONICS__EL6__COMPUTER_ROTATED_DOMAIN_STONE_${stone + 1}`, 0.72, 0.16, stone % 2 ? m.porcelain : m.graphite, [Math.cos(angle) * 7.9, 0.1, Math.sin(angle) * 7.9], false, 12), stone % 2 ? 0.00018 : -0.00016); }
  return root;
}

function createAegisPower(m: Materials) {
  const root = new THREE.Group(); root.name = 'ELECTRONICS__EL7__AEGIS_POWER_BASTION';
  for (const side of [-1, 1]) {
    const z = side * 4.55;
    box(root, `ELECTRONICS__EL7__${side < 0 ? 'NORTH' : 'SOUTH'}_GRAPHITE_LAB_BASE`, [17.8, 2.6, 4.4], m.graphite, [0, 1.4, z], true);
    box(root, `ELECTRONICS__EL7__${side < 0 ? 'NORTH' : 'SOUTH'}_PALE_POWER_LAB_UPPER`, [17.1, 2.9, 4.05], m.porcelain, [0, 4.05, z], true);
    for (let fin = 0; fin < 30; fin += 1) { const x = -8.25 + fin * 0.57; box(root, `ELECTRONICS__EL7__HEAT_SINK_CERAMIC_FIN_${side < 0 ? 'N' : 'S'}_${fin + 1}`, [0.12, 3.35, 0.72], m.whiteCeramic, [x, 4.3, z + side * 2.3], false); }
    for (let buttress = 0; buttress < 2; buttress += 1) taper(root, `ELECTRONICS__EL7__TRIANGULAR_GROUNDING_BUTTRESS_${side < 0 ? 'N' : 'S'}_${buttress + 1}`, 2.6, 0.55, 5.8, m.whiteCeramic, [buttress ? 8.25 : -8.25, 2.95, z], true, 3, [0, Math.PI / 2, 0]);
  }
  for (let bar = 0; bar < 7; bar += 1) { const y = 1.05 + bar * 0.62; box(root, `ELECTRONICS__EL7__OVERSIZED_COPPER_BUSBAR_${bar + 1}`, [15.4, 0.22, 0.16], m.copper, [0, y, -6.82], false); for (let insulator = 0; insulator < 6; insulator += 1) cylinder(root, `ELECTRONICS__EL7__CERAMIC_BUSBAR_INSULATOR_${bar + 1}_${insulator + 1}`, 0.28, 0.46, m.whiteCeramic, [-6.4 + insulator * 2.55, y, -6.98], false, 8, [Math.PI / 2, 0, 0]); }
  box(root, 'ELECTRONICS__EL7__HIGH_VOLTAGE_TEST_COURT', [16.2, 0.12, 4.0], m.servicePaving, [0, 0.08, 0]);
  for (let rail = 0; rail < 6; rail += 1) box(root, `ELECTRONICS__EL7__SHIELDED_EQUIPMENT_RAIL_${rail + 1}`, [15.6, 0.06, 0.08], rail % 2 ? m.titanium : m.copper, [0, 0.16, -1.55 + rail * 0.62]);
  for (let screen = 0; screen < 8; screen += 1) { const x = -7.1 + screen * 2.05; box(root, `ELECTRONICS__EL7__RETRACTABLE_FARADAY_SCREEN_${screen + 1}`, [0.18, 2.2, 3.2], screen % 2 ? m.conductive : m.blackGlass, [x, 1.16, 0], true); }
  for (let bridge = 0; bridge < 3; bridge += 1) slabBetween(root, `ELECTRONICS__EL7__ELEVATED_SHIELDED_BRIDGE_${bridge + 1}`, new THREE.Vector3(-5.6 + bridge * 5.6, 5.45, -4.55), new THREE.Vector3(-5.6 + bridge * 5.6, 5.45, 4.55), 1.2, 0.78, bridge === 1 ? m.blackGlass : m.graphite);
  for (let tower = 0; tower < 8; tower += 1) { const x = -7.3 + tower * 2.08; cylinder(root, `ELECTRONICS__EL7__ROOF_RADIATOR_TOWER_${tower + 1}`, 0.95, 2.2 + tower % 3 * 0.4, m.graphite, [x, 6.1 + tower % 3 * 0.2, tower % 2 ? 4.55 : -4.55], true, 8); torus(root, `ELECTRONICS__EL7__FLUID_COOLING_LOOP_${tower + 1}`, 0.72, 0.08, m.copper, [x, 7.15 + tower % 3 * 0.4, tower % 2 ? 4.55 : -4.55], [0, 0, 0], Math.PI * 2, false, 6, 24); }
  for (let mast = 0; mast < 3; mast += 1) { const x = -5 + mast * 5; cylinder(root, `ELECTRONICS__EL7__GROUNDED_ARTIFICIAL_TREE_MAST_${mast + 1}`, 0.26, 9.0 + mast * 0.7, m.titanium, [x, 4.55 + mast * 0.35, -7.4], true, 8); for (let branch = 0; branch < 5; branch += 1) pipe(root, `ELECTRONICS__EL7__GROUNDING_CONDUCTOR_BRANCH_${mast + 1}_${branch + 1}`, new THREE.Vector3(x, 7.0 + branch * 0.55, -7.4), new THREE.Vector3(x + (branch - 2) * 0.55, 8.2 + branch * 0.48, -7.4), 0.06, m.copper); }
  return root;
}

function createTerahertz(m: Materials) {
  const root = new THREE.Group(); root.name = 'ELECTRONICS__EL8__TERAHERTZ_METROLOGY_SPIRE';
  box(root, 'ELECTRONICS__EL8__SHIELDED_METROLOGY_BASE', [13.2, 2.4, 10.5], m.graphite, [0, 1.25, 0], true);
  taper(root, 'ELECTRONICS__EL8__SQUARE_LOWER_SPIRE', 5.4, 4.9, 5.2, m.steel, [0, 4.9, 0], true, 4, [0, Math.PI / 4, 0]);
  taper(root, 'ELECTRONICS__EL8__CUT_CORNER_MIDDLE_SPIRE', 4.9, 3.8, 5.4, m.porcelain, [0, 10.2, 0], true, 8, [0, Math.PI / 8, 0]);
  taper(root, 'ELECTRONICS__EL8__ELONGATED_OCTAGONAL_UPPER_SPIRE', 3.8, 2.8, 4.5, m.steel, [0, 15.15, 0], true, 8, [0, Math.PI / 8, 0]);
  for (let facet = 0; facet < 72; facet += 1) { const level = Math.floor(facet / 12); const angle = facet % 12 / 12 * Math.PI * 2; const radius = 2.75 - level * 0.18; box(root, `ELECTRONICS__EL8__TRIANGULAR_SHIELDING_FACET_${facet + 1}`, [0.42, 0.48 + facet % 3 * 0.18, 0.08], facet % 7 ? m.titanium : m.blackGlass, [Math.cos(angle) * radius, 3.4 + level * 2.25, Math.sin(angle) * radius], false, [0, -angle, (facet % 5 - 2) * 0.025]); }
  for (let panel = 0; panel < 16; panel += 1) { const angle = panel / 16 * Math.PI * 2; rotate(box(root, `ELECTRONICS__EL8__SLOW_ROTATING_ANTENNA_PANEL_${panel + 1}`, [0.58, 0.75, 0.1], panel % 4 ? m.photonic : m.violetPhotonic, [Math.cos(angle) * 2.05, 14.2 + panel % 4 * 0.75, Math.sin(angle) * 2.05], false, [0, -angle, 0]), panel % 2 ? 0.00008 : -0.00007); }
  for (let ring = 0; ring < 2; ring += 1) { torus(root, `ELECTRONICS__EL8__DARK_PHASED_ARRAY_RING_${ring + 1}`, 1.65 - ring * 0.18, 0.34, m.black, [0, 17.75 + ring * 0.82, 0]); }
  pulse(torus(root, 'ELECTRONICS__EL8__VISIBLE_FREQUENCY_SWEEP_BAND', 1.56, 0.09, m.cyan.clone(), [0, 18.12, 0]), 0.0022, 0.4, 0.03, 1.8);
  taper(root, 'ELECTRONICS__EL8__TRUNCATED_NEEDLE_RADOME', 2.75, 0.34, 3.8, m.membrane, [0, 20.4, 0], false, 16);
  const courts = [[-5.1, 4.8], [5.1, 4.8], [0, -5.6]] as const;
  courts.forEach(([cx, cz], court) => { box(root, `ELECTRONICS__EL8__ANECHOIC_MEASUREMENT_COURT_${court + 1}`, [5.2, 0.08, 4.0], m.black, [cx, 0.08, cz]); for (let wedge = 0; wedge < 18; wedge += 1) { const angle = wedge / 18 * Math.PI * 2; taper(root, `ELECTRONICS__EL8__ARCHITECTURAL_ANECHOIC_WEDGE_${court + 1}_${wedge + 1}`, 0.72, 0.06, 1.55, m.black, [cx + Math.cos(angle) * 2.3, 0.84, cz + Math.sin(angle) * 1.7], true, 4, [Math.PI / 2, 0, -angle]); } });
  box(root, 'ELECTRONICS__EL8__SURVEYED_HUNDRED_METRE_CALIBRATION_LINE', [0.16, 0.035, 10.8], m.cold, [0, 0.15, 6.4]);
  for (let marker = 0; marker < 18; marker += 1) cylinder(root, `ELECTRONICS__EL8__CALIBRATION_INSTRUMENT_PEDESTAL_${marker + 1}`, 0.24, 0.58 + marker % 3 * 0.2, marker % 5 ? m.titanium : m.cyan, [marker % 2 ? 0.46 : -0.46, 0.32 + marker % 3 * 0.1, 1.2 + marker * 0.6], false, 8);
  for (let bridge = 0; bridge < 2; bridge += 1) { const z = bridge ? -2.2 : 2.2; slabBetween(root, `ELECTRONICS__EL8__TWISTING_WAVEGUIDE_SKYBRIDGE_${bridge + 1}`, new THREE.Vector3(2.0, 7.2 + bridge, z), new THREE.Vector3(7.5, 7.2 + bridge, z + (bridge ? -1.6 : 1.6)), 0.78, 0.65, bridge ? m.blackGlass : m.porcelain); }
  return root;
}

function createAdaptiveSkin(m: Materials) {
  const root = new THREE.Group(); root.name = 'ELECTRONICS__EL9__ADAPTIVE_SKIN_PAVILION';
  const folds = [{ x: -4.8, z: 0.6, sx: 7.8, sy: 2.8, sz: 8.2, rz: -0.16 }, { x: 0, z: -0.2, sx: 8.6, sy: 3.5, sz: 9.1, rz: 0.08 }, { x: 4.8, z: 0.7, sx: 7.6, sy: 2.6, sz: 7.8, rz: 0.18 }];
  folds.forEach((fold, index) => { roundedBox(root, `ELECTRONICS__EL9__PEARLESCENT_FOLDED_BASE_${index + 1}`, [fold.sx, fold.sy, fold.sz], 1.2, m.porcelain, [fold.x, 1.45 + fold.sy * 0.1, fold.z], true, [0, fold.rz, index % 2 ? 0.08 : -0.06]); sphere(root, `ELECTRONICS__EL9__THERMORESPONSIVE_MEMBRANE_FIELD_${index + 1}`, [fold.sx * 0.58, fold.sy * 0.72, fold.sz * 0.58], m.membrane, [fold.x, 3.0 + index * 0.12, fold.z], false); });
  for (let branch = 0; branch < 28; branch += 1) { const angle = -Math.PI * 0.8 + branch / 27 * Math.PI * 1.6; const start = new THREE.Vector3(Math.sin(angle) * 2.2, 1.1, Math.cos(angle) * 2.0); const end = new THREE.Vector3(Math.sin(angle) * (7.3 + branch % 3), 3.0 + branch % 5 * 0.22, Math.cos(angle) * 5.2); pipe(root, `ELECTRONICS__EL9__FINE_BRANCHING_MEMBRANE_FRAME_${branch + 1}`, start, end, 0.055 + branch % 4 * 0.012, branch % 5 ? m.titanium : m.conductive, true); }
  for (let mesh = 0; mesh < 18; mesh += 1) { const x = -7.2 + mesh * 0.84; box(root, `ELECTRONICS__EL9__INNER_CONDUCTIVE_MESH_STRIP_${mesh + 1}`, [0.07, 2.5 + mesh % 4 * 0.22, 7.2], mesh % 4 ? m.conductive : m.photovoltaic, [x, 2.6, 0], false, [0, mesh % 2 ? 0.08 : -0.08, 0]); }
  for (let canopy = 0; canopy < 3; canopy += 1) { const x = -5 + canopy * 5; for (let fibre = 0; fibre < 10; fibre += 1) { const start = new THREE.Vector3(x + (fibre - 4.5) * 0.22, 3.2, 3.7); const end = new THREE.Vector3(x + (fibre - 4.5) * 0.55, 2.4 + fibre % 3 * 0.2, 9.2); pipe(root, `ELECTRONICS__EL9__CONDUCTIVE_FIBRE_CANOPY_${canopy + 1}_${fibre + 1}`, start, end, 0.045, fibre % 3 ? m.porcelain : m.conductive); } cylinder(root, `ELECTRONICS__EL9__FIBRE_CONFORMING_CERAMIC_COLUMN_${canopy + 1}`, 0.58, 3.1, m.whiteCeramic, [x, 1.58, 8.5], true, 24); torus(root, `ELECTRONICS__EL9__CONFORMAL_FIBRE_LOOP_${canopy + 1}`, 0.52, 0.06, m.conductive, [x, 2.25, 8.5], [Math.PI / 2, 0, 0]); }
  for (let basin = 0; basin < 6; basin += 1) roundedBox(root, `ELECTRONICS__EL9__WARM_WATER_TRIAL_BASIN_${basin + 1}`, [2.1, 0.1, 0.8], 0.22, m.water, [-6.8 + basin * 2.7, 0.07, -5.6 - basin % 2 * 0.65]);
  for (let ribbon = 0; ribbon < 8; ribbon += 1) box(root, `ELECTRONICS__EL9__PROTECTED_PRINTED_SENSOR_RIBBON_${ribbon + 1}`, [0.16, 0.025, 8.5], ribbon % 2 ? m.cyan : m.violet, [-5.6 + ribbon * 1.6, 0.08, 6.2], false, [0, ribbon % 2 ? 0.12 : -0.12, 0]);
  return root;
}

function createSensorium(m: Materials) {
  const root = new THREE.Group(); root.name = 'ELECTRONICS__EL10__SENSORIUM_HIVE';
  for (let cell = 0; cell < 12; cell += 1) {
    const angle = cell / 12 * Math.PI * 2; const radius = 6.6 + cell % 3 * 0.5; const x = Math.cos(angle) * radius; const z = Math.sin(angle) * radius; const height = 2.6 + cell % 5 * 0.48; const segments = cell % 2 ? 24 : 6;
    const group = new THREE.Group(); group.name = `ELECTRONICS__EL10__SENSING_MODALITY_VOLUME_${cell + 1}`; root.add(group);
    cylinder(group, `${group.name}__PRIMARY_HIVE_BUILDING`, 3.4 + cell % 3 * 0.35, height, [m.graphite, m.porcelain, m.photonic, m.titanium][cell % 4], [x, 0.2 + height * 0.5, z], true, segments, [0, -angle, 0]);
    if (cell % 6 === 0) for (let aperture = 0; aperture < 18; aperture += 1) sphere(group, `${group.name}__PRESSURE_DIAPHRAGM_PERFORATION_${aperture + 1}`, [0.07, 0.07, 0.04], aperture % 5 ? m.black : m.cyan, [x + Math.cos(angle) * 1.75, 0.8 + aperture % 6 * 0.42, z + Math.sin(angle) * 1.75]);
    else if (cell % 6 === 1) for (let plate = 0; plate < 12; plate += 1) box(group, `${group.name}__CAPACITIVE_COMB_PLATE_${plate + 1}`, [3.7, 0.08, 0.38], plate % 2 ? m.titanium : m.cyan, [x, 0.55 + plate * 0.32, z], false, [0, -angle, 0]);
    else if (cell % 6 === 2) for (let aperture = 0; aperture < 24; aperture += 1) pulse(sphere(group, `${group.name}__EVENT_CAMERA_APERTURE_${aperture + 1}`, [0.08, 0.08, 0.05], (aperture % 7 ? m.black : m.violet).clone(), [x + Math.cos(angle) * 1.78, 0.65 + aperture % 8 * 0.42, z + Math.sin(angle) * 1.78]), 0.0016, aperture * 0.25, 0.01, 1.2);
    else if (cell % 6 === 3) for (let rib = 0; rib < 14; rib += 1) box(group, `${group.name}__PIEZOELECTRIC_CERAMIC_RIB_${rib + 1}`, [0.12, height * 0.82, 0.48], rib % 3 ? m.whiteCeramic : m.cyan, [x + Math.cos(angle + (rib - 6.5) * 0.12) * 1.78, 0.45 + height * 0.41, z + Math.sin(angle + (rib - 6.5) * 0.12) * 1.78], false, [0, -angle - (rib - 6.5) * 0.12, 0]);
    else if (cell % 6 === 4) for (let horn = 0; horn < 8; horn += 1) taper(group, `${group.name}__ACOUSTIC_CALIBRATION_HORN_${horn + 1}`, 0.72, 0.18, 1.1, horn % 2 ? m.graphite : m.titanium, [x + Math.cos(angle) * 1.8, 0.7 + horn * 0.42, z + Math.sin(angle) * 1.8], false, 8, [Math.PI / 2, 0, -angle]);
    else for (let band = 0; band < 8; band += 1) torus(group, `${group.name}__FLEXIBLE_ANTENNA_BAND_${band + 1}`, 1.78, 0.045, band % 3 ? m.copper : m.cyan, [x, 0.7 + band * 0.48, z]);
  }
  cylinder(root, 'ELECTRONICS__EL10__OPEN_CALIBRATION_FIELD', 10.0, 0.1, m.servicePaving, [0, 0.07, 0], false, 24);
  for (let target = 0; target < 16; target += 1) { const angle = target / 16 * Math.PI * 2; const radius = 1.8 + target % 3 * 1.1; cylinder(root, `ELECTRONICS__EL10__ROTATING_CALIBRATION_TARGET_${target + 1}`, 0.55, 0.16 + target % 4 * 0.25, [m.whiteCeramic, m.black, m.cyan, m.violet][target % 4], [Math.cos(angle) * radius, 0.12 + target % 4 * 0.125, Math.sin(angle) * radius], false, target % 2 ? 8 : 24); }
  for (let cable = 0; cable < 7; cable += 1) { const x = -4.2 + cable * 1.4; pipe(root, `ELECTRONICS__EL10__CABLE_BORNE_SENSOR_CANOPY_${cable + 1}`, new THREE.Vector3(x, 4.7, -5.0), new THREE.Vector3(x + (cable % 2 ? 1.2 : -1.2), 5.2, 5.0), 0.045, m.titanium); for (let carrier = 0; carrier < 3; carrier += 1) { const point = new THREE.Vector3(x, 4.7, -5).lerp(new THREE.Vector3(x + (cable % 2 ? 1.2 : -1.2), 5.2, 5), (carrier + 1) / 4); pulse(sphere(root, `ELECTRONICS__EL10__AUTONOMOUS_SENSOR_CARRIER_${cable + 1}_${carrier + 1}`, [0.14, 0.09, 0.18], (carrier % 2 ? m.cyan : m.cold).clone(), [point.x, point.y, point.z]), 0.0014, cable + carrier * 0.4, 0.02, 1.25); } }
  for (let needle = 0; needle < 10; needle += 1) { const angle = needle / 10 * Math.PI * 2 + 0.18; const radius = 9.1 + needle % 2 * 0.65; cylinder(root, `ELECTRONICS__EL10__MICROCLIMATE_NEEDLE_${needle + 1}`, 0.22, 4.2 + needle % 4 * 0.7, m.titanium, [Math.cos(angle) * radius, 2.15 + needle % 4 * 0.35, Math.sin(angle) * radius], true, 8); for (let sensor = 0; sensor < 4; sensor += 1) box(root, `ELECTRONICS__EL10__NEEDLE_REFERENCE_SENSOR_${needle + 1}_${sensor + 1}`, [0.48, 0.08, 0.16], sensor % 2 ? m.cold : m.cyan, [Math.cos(angle) * radius, 1.7 + sensor * 0.75, Math.sin(angle) * radius], false, [0, -angle + sensor * 0.4, 0]); }
  return root;
}

function assignBuildingMetadata(root: THREE.Group, record: ElectronicsBuildingProgram) {
  root.userData.exteriorProgram = true;
  root.userData.buildingCode = record.code;
  root.userData.buildingName = record.name;
  root.userData.buildingSubtitle = record.subtitle;
  root.userData.purpose = record.focus;
  root.userData.footprintMetres = [...record.footprintMetres];
  root.userData.heightMetres = record.heightMetres;
  root.userData.placementZone = record.placementZone;
  root.userData.exteriorMotif = record.exteriorSignature;
  root.userData.navObstacle = true;
  root.traverse((object) => { object.userData.selectableId = DISTRICT_ID; object.userData.districtId = DISTRICT_ID; });
  return root;
}

function createBuilding(record: ElectronicsBuildingProgram, materials: Materials) {
  const factories: Record<ElectronicsBuildingForm, (materials: Materials) => THREE.Group> = {
    angstrom: createAngstrom,
    interposer: createInterposer,
    'lumen-weave': createLumenWeave,
    'kelvin-null': createKelvinNull,
    'synaptic-stack': createSynapticStack,
    'spin-orbit': createSpinOrbit,
    'aegis-power': createAegisPower,
    terahertz: createTerahertz,
    'adaptive-skin': createAdaptiveSkin,
    sensorium: createSensorium,
  };
  return assignBuildingMetadata(factories[record.form](materials), record);
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radialMargin = 5.5; const angularMargin = (sector.endAngle - sector.startAngle) * 0.075;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT);
  const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
  return new THREE.Vector3(Math.cos(angle) * radius - definition.position[0], y, Math.sin(angle) * radius - definition.position[2]);
}

function districtSpine(definition: DistrictDefinition, angularT: number, startRadialT: number, endRadialT: number, segments: number, y = FLOOR_Y) {
  return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, THREE.MathUtils.lerp(startRadialT, endRadialT, index / (segments - 1)), angularT, y));
}

function districtArc(definition: DistrictDefinition, radialT: number, startAngularT: number, endAngularT: number, segments: number, y = FLOOR_Y) {
  return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, radialT, THREE.MathUtils.lerp(startAngularT, endAngularT, index / (segments - 1)), y));
}

function ribbonGeometry(points: readonly THREE.Vector3[], width: number) {
  const vertices: number[] = []; const indices: number[] = [];
  points.forEach((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5); vertices.push(point.x + normal.x, point.y, point.z + normal.z, point.x - normal.x, point.y, point.z - normal.z); if (index < points.length - 1) { const base = index * 2; indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); } });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function ribbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, mat: THREE.Material, walkable = true) {
  const value = prepare(new THREE.Mesh(ribbonGeometry(points, width), mat), name); value.userData.walkable = walkable; value.userData.navObstacle = false; value.userData.electronicsRoute = true; value.receiveShadow = true; parent.add(value); return value;
}

function offsetPath(points: readonly THREE.Vector3[], offset: number, y = FLOOR_Y + 0.025) {
  return points.map((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); return point.clone().add(new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(offset)).setY(y); });
}

function nearestPoint(points: readonly THREE.Vector3[], target: THREE.Vector3) {
  return points.reduce((closest, point) => point.distanceToSquared(target) < closest.distanceToSquared(target) ? point : closest, points[0]);
}

function addDistrictInfrastructure(district: THREE.Group, definition: DistrictDefinition, m: Materials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'ELECTRONICS__DISTRICT_INFRASTRUCTURE'; district.add(infrastructure);
  const signalSpine = districtArc(definition, 0.5, 0.015, 0.985, 156);
  ribbon(infrastructure, 'ELECTRONICS__SIGNAL_SPINE', signalSpine, 3.0, m.paving, true);
  const traceDefs = [
    { name: 'POWER', offset: -1.05, mat: m.copper }, { name: 'DATA', offset: -0.52, mat: m.cyan }, { name: 'TIMING', offset: 0, mat: m.cold }, { name: 'COOLING', offset: 0.52, mat: m.titanium }, { name: 'OPTICAL', offset: 1.05, mat: m.violet },
  ];
  traceDefs.forEach((trace, index) => pulse(ribbon(infrastructure, `ELECTRONICS__SIGNAL_SPINE_${trace.name}_TRACE`, offsetPath(signalSpine, trace.offset), 0.07, trace.mat.clone(), false), 0.00125 + index * 0.00012, index * 0.52, 0.02, 1.25));
  const serviceArc = districtArc(definition, 0.965, 0.02, 0.98, 168, FLOOR_Y - 0.035);
  ribbon(infrastructure, 'ELECTRONICS__BACKSIDE_POWER_DELIVERY_SERVICE_ARC', serviceArc, 2.6, m.servicePaving, false);
  const materialArc = districtArc(definition, 0.875, 0.03, 0.97, 156, FLOOR_Y - 0.015);
  ribbon(infrastructure, 'ELECTRONICS__AUTOMATED_MATERIAL_TRANSFER_ARC', materialArc, 0.78, m.graphite, false);
  for (let cut = 0; cut < 10; cut += 1) {
    const index = Math.floor((cut + 0.5) / 10 * (signalSpine.length - 1)); const point = signalSpine[index]; const previous = signalSpine[Math.max(0, index - 1)]; const next = signalSpine[Math.min(signalSpine.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x); const cutPoint = point.clone().addScaledVector(normal, cut % 2 ? 1.08 : -1.08); const rotationY = -Math.atan2(tangent.z, tangent.x);
    box(infrastructure, `ELECTRONICS__GLASS_COVERED_UTILITY_UNDERCROFT_CUT_${cut + 1}`, [2.2, 0.08, 0.62], m.blackGlass, [cutPoint.x, FLOOR_Y + 0.04, cutPoint.z], false, [0, rotationY, 0]);
    for (let carrier = 0; carrier < 4; carrier += 1) { const carrierPoint = cutPoint.clone().addScaledVector(tangent, -0.66 + carrier * 0.44); pulse(box(infrastructure, `ELECTRONICS__UNDERCROFT_MOVING_SERVICE_CARRIER_${cut + 1}_${carrier + 1}`, [0.28, 0.12, 0.14], (carrier % 2 ? m.cyan : m.amber).clone(), [carrierPoint.x, FLOOR_Y - 0.08, carrierPoint.z], false, [0, rotationY, 0]), 0.0015, cut + carrier * 0.4, 0.02, 0.9); }
  }
  for (let pad = 0; pad < 10; pad += 1) { const point = signalSpine[Math.floor((pad + 0.5) / 10 * (signalSpine.length - 1))]; cylinder(infrastructure, `ELECTRONICS__ENLARGED_BOND_PAD_PLAZA_${pad + 1}`, 3.35, 0.018, pad % 2 ? m.titanium : m.copper, [point.x, FLOOR_Y + 0.009, point.z], false, 24); torus(infrastructure, `ELECTRONICS__BOND_PAD_DIAGNOSTIC_RING_${pad + 1}`, 1.45, 0.045, pad % 3 ? m.cold : m.cyan, [point.x, FLOOR_Y + 0.026, point.z]); }
  for (let station = 0; station < 18; station += 1) { const index = Math.floor((station + 0.5) / 18 * (signalSpine.length - 1)); const point = signalSpine[index]; const previous = signalSpine[Math.max(0, index - 1)]; const next = signalSpine[Math.min(signalSpine.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x); const base = point.clone().addScaledVector(normal, station % 2 ? 2.0 : -2.0); cylinder(infrastructure, `ELECTRONICS__SIGNAL_SPINE_DIAGNOSTIC_PYLON_${station + 1}`, 0.12, 1.15, m.titanium, [base.x, 0.58, base.z], false, 8); pulse(box(infrastructure, `ELECTRONICS__SIGNAL_SPINE_STATUS_LIGHT_${station + 1}`, [0.14, 0.1, 0.08], [m.cold, m.cyan, m.violet, m.amber][station % 4].clone(), [base.x, 1.18, base.z]), 0.0016, station * 0.31, 0.02, 1.1); }
  return { infrastructure, signalSpine };
}

function addDistrictLandscape(district: THREE.Group, definition: DistrictDefinition, m: Materials) {
  const landscape = new THREE.Group(); landscape.name = 'ELECTRONICS__SPARSE_TECHNICAL_LANDSCAPE'; district.add(landscape);
  for (let bed = 0; bed < 28; bed += 1) { const point = pointInDistrict(definition, bed % 2 ? 0.34 : 0.66, 0.05 + Math.floor(bed / 2) / 13 * 0.9, FLOOR_Y + 0.012); box(landscape, `ELECTRONICS__BASALT_MOSS_COMPONENT_BED_${bed + 1}`, [1.9 + bed % 4 * 0.35, 0.12, 0.82], [m.basalt, m.moss, m.grass][bed % 3], [point.x, point.y, point.z], false, [0, bed * 0.18, 0]); }
  for (let channel = 0; channel < 10; channel += 1) { const point = pointInDistrict(definition, 0.5, 0.08 + channel / 9 * 0.84, FLOOR_Y + 0.01); box(landscape, `ELECTRONICS__THIN_REFLECTING_COOLING_CHANNEL_${channel + 1}`, [3.2, 0.07, 0.42], m.water, [point.x, point.y, point.z], false, [0, channel % 2 ? 0.22 : -0.16, 0]); }
  for (let marker = 0; marker < 24; marker += 1) { const point = pointInDistrict(definition, marker % 2 ? 0.22 : 0.78, 0.06 + Math.floor(marker / 2) / 11 * 0.88); box(landscape, `ELECTRONICS__ALIGNMENT_FIDUCIAL_${marker + 1}`, [0.42, 0.025, 0.42], marker % 4 ? m.porcelain : m.cyan, [point.x, FLOOR_Y + 0.02, point.z], false, [0, marker * Math.PI / 8, 0]); }
  return landscape;
}

export function buildElectronicsLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Electronics / Micro-Electronics Labs District requires a masterplan sector');
  const materials = createMaterials();
  const { infrastructure, signalSpine } = addDistrictInfrastructure(district, definition, materials);
  const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = ELECTRONICS_LABS_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials); const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02); building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT };
    district.add(building); return building;
  });
  facilities.forEach((facility, index) => {
    const record = ELECTRONICS_LABS_BUILDING_PROGRAM[index]; const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, Math.min(8.6, record.footprintMetres[1] / 20 + 0.9)); const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const routePoint = nearestPoint(signalSpine, entrance).clone().setY(FLOOR_Y + 0.012); const dogleg = routePoint.clone().lerp(entrance, 0.52); dogleg.x += index % 2 ? 0.34 : -0.34;
    ribbon(infrastructure, `ELECTRONICS__BUILDING_APPROACH_${record.code}`, [routePoint, dogleg, entrance], 0.96, materials.paving, true);
    pulse(ribbon(infrastructure, `ELECTRONICS__BUILDING_SIGNAL_TRACE_${record.code}`, offsetPath([routePoint, dogleg, entrance], index % 2 ? 0.28 : -0.28), 0.05, [materials.copper, materials.cyan, materials.cold, materials.violet][index % 4].clone(), false), 0.0016, index * 0.39, 0.02, 1.0);
  });
  district.userData.electronicsLabsDistrict = {
    identity: 'Electronics / Micro-Electronics Labs District — The Signal Spine',
    mapLabel: 'Electronics / Micro-Electronics Labs',
    architecturalLanguage: 'graphite ceramic, pale technical porcelain, titanium, oxidized copper, black glass, controlled photonic coatings, and translucent fluoropolymer enlarged into a semiconductor ecosystem rather than applied motherboard ornament',
    buildingCount: facilities.length,
    buildings: ELECTRONICS_LABS_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, subtitle: record.subtitle, focus: record.focus, placementZone: record.placementZone, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorSignature: record.exteriorSignature })),
    technologicalProgression: ['soft and photonic systems', 'sensing and neuromorphic systems', 'spintronic and chiplet integration', 'advanced logic and cryogenic control', 'power electronics and high-frequency metrology'],
    circulation: { primaryRoute: 'ELECTRONICS__SIGNAL_SPINE', signalTraceTypes: ['power', 'data', 'timing', 'cooling', 'optical'], bondPadPlazas: 10, utilityUndercroftCuts: 10, backsideServiceArc: 'ELECTRONICS__BACKSIDE_POWER_DELIVERY_SERVICE_ARC', automatedMaterialTransferArc: 'ELECTRONICS__AUTOMATED_MATERIAL_TRANSFER_ARC', exactBuildingApproaches: 10 },
    signatureSystems: { angstromGateLoops: 8, angstromForksheetFins: 22, interposerChiplets: 8, interposerMicrobumps: 28, lumenCurvedWingSegments: 26, kelvinThermalShells: 3, synapticDendriticWings: 3, spinOrbitMoireFins: 72, aegisHeatSinkFins: 60, terahertzShieldingFacets: 72, adaptiveMembraneFields: 3, sensoriumSensingVolumes: 12 },
    lightingProtocol: { diagnosticColorOnly: true, broadFacadeWash: false, animatedOpticalTraffic: true, emergencyRoutesRedOnly: true, normalStateRestrained: true },
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: ELECTRONICS_LABS_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: ['Signal Spine', 'power/data/timing/cooling/optical traces', 'bond-pad plazas', 'glass-covered utility undercroft cuts', 'backside power-delivery service arc', 'automated material transfer arc', 'basalt and moss component beds', 'reflecting cooling channels', 'alignment fiducials'],
    realizedFeatureTags: ELECTRONICS_LABS_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 13,
    radialCoverage: 0.97,
    angularCoverage: 0.93,
    exteriorOnly: true,
    semiconductorEcosystemNarrative: true,
    backsideUtilitySeparation: true,
    signalSpineWalkable: true,
  };
}
