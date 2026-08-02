import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type InorganicBuildingForm =
  | 'foundry' | 'catalyst-spire' | 'halide-citadel' | 'framework-ark' | 'leafworks'
  | 'nitrogen-forge' | 'f-block-monastery' | 'lanthanide-refinery' | 'pomo-basilica'
  | 'oxide-terraces' | 'diamond-anvil' | 'thermal-keep' | 'biomineral-conservatory'
  | 'mineral-ramparts' | 'valence-nexus';

export interface InorganicChemistryBuildingProgram {
  code: string;
  name: string;
  purpose: string;
  form: InorganicBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
}

export const INORGANIC_CHEMISTRY_BUILDING_PROGRAM: readonly InorganicChemistryBuildingProgram[] = [
  { code: 'I1', name: 'The Crystal Genome Foundry', purpose: 'Autonomous discovery of high-entropy oxides, carbides, nitrides, borides, intermetallics, metastable crystals, and compositionally complex ceramics', form: 'foundry', footprintMetres: [145, 115], heightMetres: 91, radialT: 0.22, angularT: 0.10, placementZone: 'Valence Avenue mineral terrace', exteriorMotif: 'seven interlocking crystal-system wings, ordered-to-disordered diagrid, synthesis stack, and capsule tubes' },
  { code: 'I2', name: 'The Monatomic Catalyst Spire', purpose: 'Single-atom and dual-atom catalysts, electrocatalytic water splitting, carbon-dioxide conversion, oxygen activation, and hydrogen production', form: 'catalyst-spire', footprintMetres: [76, 76], heightMetres: 138, radialT: 0.18, angularT: 0.30, placementZone: 'Lightweight inner landmark', exteriorMotif: 'three coordination arms suspending a mirror active-centre sphere above radial research wings' },
  { code: 'I3', name: 'The Halide Ion Citadel', purpose: 'Solid-state alkali-metal batteries, halide and mixed-anion electrolytes, ion transport, interface stability, and mechanical failure suppression', form: 'halide-citadel', footprintMetres: [165, 100], heightMetres: 37, radialT: 0.76, angularT: 0.16, placementZone: 'Dry western service court', exteriorMotif: 'four-layer salt-glass fortress with deep thresholds, dry trench, rain canopy, and six desiccant crystals' },
  { code: 'I4', name: 'The Breathing Framework Ark', purpose: 'Metal-organic frameworks, porous coordination networks, selective gas separation, direct air capture, atmospheric water harvesting, and molecular sieving', form: 'framework-ark', footprintMetres: [190, 82], heightMetres: 71, radialT: 0.84, angularT: 0.84, placementZone: 'Desert Dome approach', exteriorMotif: 'porous node-and-strut arch, breathing triangular shutters, six gill towers, atmospheric ducts, and basins' },
  { code: 'I5', name: 'The Solar-Fuels Leafworks', purpose: 'Artificial photosynthesis, photoelectrochemical water splitting, solar hydrogen, carbon-dioxide reduction, and light-driven inorganic catalysis', form: 'leafworks', footprintMetres: [225, 150], heightMetres: 67, radialT: 0.85, angularT: 0.62, placementZone: 'Sun-rich desert perimeter', exteriorMotif: 'five pivoting mineral leaves, photoelectrode fields, water rills, gas-separation towers, and Solar Reaction Gate' },
  { code: 'I6', name: 'The Nitrogen Triple-Bond Forge', purpose: 'Low-energy nitrogen fixation, mechanochemical ammonia synthesis, molecular molybdenum and iron catalysis, plasma activation, and cavitation chemistry', form: 'nitrogen-forge', footprintMetres: [135, 125], heightMetres: 79, radialT: 0.90, angularT: 0.51, placementZone: 'Heavy Stoichiometric Loop court', exteriorMotif: 'three acoustically isolated horizontal reactor drums held by a triple-bond steel exoskeleton' },
  { code: 'I7', name: 'The F-Block Containment Monastery', purpose: 'Actinide chemistry, unusual f-element bonding, nuclear-fuel materials, isotope coordination, separations, and durable waste immobilization', form: 'f-block-monastery', footprintMetres: [195, 155], heightMetres: 76, radialT: 0.88, angularT: 0.27, placementZone: 'Restricted Particle Physics edge', exteriorMotif: 'five nested mineral walls around a single amber Shielded Lantern and enclosed transport rail' },
  { code: 'I8', name: 'The Lanthanide Cascade Refinery', purpose: 'Rare-earth separation, electronic-waste recovery, redox-selective extraction, ionic-liquid processing, magnet recycling, and critical-metal circularity', form: 'lanthanide-refinery', footprintMetres: [270, 85], heightMetres: 42, radialT: 0.73, angularT: 0.39, placementZone: 'Descending outer process terraces', exteriorMotif: 'seventeen progressively refined process towers, cascade columns, magnetic gantries, and sealed conveyors' },
  { code: 'I9', name: 'The Polyoxometalate Basilica', purpose: 'Molecular metal-oxide clusters, multi-electron redox chemistry, water oxidation, molecular energy storage, photocatalysis, and switchable assemblies', form: 'pomo-basilica', footprintMetres: [128, 128], heightMetres: 69, radialT: 0.32, angularT: 0.68, placementZone: 'Crystal Axis ceremonial court', exteriorMotif: 'faceted cobalt polyhedral dome, twelve cluster chapels, molecular rose window, busbars, and redox crown' },
  { code: 'I10', name: 'The Quantum Oxide Terraces', purpose: 'Superconducting oxides, multiferroics, quantum paraelectrics, antiferromagnetic spintronics, topological phases, and strain engineering', form: 'oxide-terraces', footprintMetres: [145, 105], heightMetres: 83, radialT: 0.50, angularT: 0.02, placementZone: 'Vibration-isolated western terrace', exteriorMotif: 'six rotated epitaxial slabs separated by iridescent interfaces above isolated pylons and black-glass moat' },
  { code: 'I11', name: 'The Megabar Diamond-Anvil Tower', purpose: 'High-pressure inorganic synthesis, superhydrides, extreme-state superconductors, planetary materials, and metastable phases', form: 'diamond-anvil', footprintMetres: [98, 98], heightMetres: 162, radialT: 0.50, angularT: 0.22, placementZone: 'Particle Physics transition', exteriorMotif: 'opposed diamond anvils compressed by monumental arches, tension cables, pressure rings, and brilliant compression band' },
  { code: 'I12', name: 'The Molten-Salt Thermal Keep', purpose: 'Molten-salt chemistry, high-temperature electrochemistry, thermal storage, electrorefining, corrosion-resistant materials, and advanced reactor salts', form: 'thermal-keep', footprintMetres: [155, 135], heightMetres: 88, radialT: 0.91, angularT: 0.73, placementZone: 'Hot southeastern service perimeter', exteriorMotif: 'ribbed ceramic fortress with six thermal stacks, glowing shielded conduits, radiator fields, and four ionic silos' },
  { code: 'I13', name: 'The Biomineral Hybrid Conservatory', purpose: 'Bioinorganic chemistry, metalloenzymes, inorganic-microbial hybrids, nitrogenase-inspired catalysis, biomineralization, and metal-sulfur clusters', form: 'biomineral-conservatory', footprintMetres: [175, 95], heightMetres: 45, radialT: 0.08, angularT: 0.92, placementZone: 'Organic Chemistry interface', exteriorMotif: 'white porous mineral-reef shell with metallic veins, deposition panels, hydrothermal gardens, and transition bridge' },
  { code: 'I14', name: 'The Carbon Mineralization Ramparts', purpose: 'Carbon-dioxide mineralization, carbonate curing, geopolymers, low-emission cement, mine-tailings utilization, and permanent carbon storage', form: 'mineral-ramparts', footprintMetres: [325, 65], heightMetres: 38, radialT: 0.97, angularT: 0.95, placementZone: 'Industrial service boundary', exteriorMotif: 'coded experimental mineral strata, direct-air intake towers, erosion channels, and robotic construction rail' },
  { code: 'I15', name: 'The Valence Nexus and Coordination Crown', purpose: 'Coordination chemistry, unusual oxidation states, metal-metal bonds, molecular magnets, low-valent main-group compounds, clusters, and Zintl phases', form: 'valence-nexus', footprintMetres: [175, 175], heightMetres: 58, radialT: 0.25, angularT: 0.52, placementZone: 'Valence Avenue and Crystal Axis intersection', exteriorMotif: 'elevated periodic-block ring with eight ligand pylons around a suspended central-ion sphere and Coordination Crown' },
] as const;

const DISTRICT_ID = 'inorganic-chemistry';
const FLOOR_Y = 0.036;
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const SPHERE = new THREE.SphereGeometry(0.5, 16, 12);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();
const TAPER_CACHE = new Map<string, THREE.CylinderGeometry>();
type InorganicMaterials = ReturnType<typeof createMaterials>;

function material(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  const value = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.25, ...options });
  value.name = name;
  return value;
}

function createMaterials() {
  const basalt = material('Inorganic Chemistry black basalt geopolymer', '#171b1c', { roughness: 0.92, metalness: 0.05 });
  const siliconCarbide = material('Inorganic Chemistry textured silicon carbide', '#24292c', { roughness: 0.78, metalness: 0.3 });
  const zirconia = material('Inorganic Chemistry pale zirconia ceramic', '#deded5', { roughness: 0.48, metalness: 0.04 });
  const saltGlass = material('Inorganic Chemistry salt-like translucent glass ceramic', '#dce7e4', { roughness: 0.22, metalness: 0.06, transparent: true, opacity: 0.72 });
  const cobaltGlass = material('Inorganic Chemistry dark cobalt polyhedral glass', '#132e4b', { roughness: 0.15, metalness: 0.38, transparent: true, opacity: 0.82 });
  const alumina = material('Inorganic Chemistry transparent alumina', '#bfd6d4', { roughness: 0.12, metalness: 0.22, transparent: true, opacity: 0.52 });
  const paleGreenGlass = material('Inorganic Chemistry pale green biomineral glass', '#99bdaa', { roughness: 0.2, metalness: 0.08, transparent: true, opacity: 0.66 });
  const titaniumNitride = material('Inorganic Chemistry titanium nitride laminate', '#9a8140', { roughness: 0.3, metalness: 0.84 });
  const steel = material('Inorganic Chemistry brushed stainless steel', '#9fa9aa', { roughness: 0.28, metalness: 0.9 });
  const darkSteel = material('Inorganic Chemistry dark prestressed alloy', '#30383b', { roughness: 0.4, metalness: 0.82 });
  const mirror = material('Inorganic Chemistry mirror finished active metal', '#d9e1e1', { roughness: 0.08, metalness: 1 });
  const bronze = material('Inorganic Chemistry tungsten bronze alloy', '#66513d', { roughness: 0.38, metalness: 0.78 });
  const copper = material('Inorganic Chemistry controlled copper oxidation', '#8d573d', { roughness: 0.42, metalness: 0.72 });
  const thermalCeramic = material('Inorganic Chemistry red brown thermal ceramic', '#713c2d', { roughness: 0.82, metalness: 0.09 });
  const volcanic = material('Inorganic Chemistry vitrified black paving', '#101315', { roughness: 0.55, metalness: 0.28 });
  const palePaving = material('Inorganic Chemistry pale mineral paving', '#a9aaa1', { roughness: 0.9, metalness: 0.04 });
  const water = material('Inorganic Chemistry closed process water', '#163d49', { roughness: 0.12, metalness: 0.25, transparent: true, opacity: 0.72 });
  const photoCopper = material('Inorganic Chemistry copper violet photoelectrode', '#7e496e', { roughness: 0.15, metalness: 0.68, emissive: '#25102b', emissiveIntensity: 0.4 });
  const photoBlue = material('Inorganic Chemistry blue black photoelectrode', '#243b54', { roughness: 0.13, metalness: 0.72, emissive: '#0b2236', emissiveIntensity: 0.38 });
  const iridescent = material('Inorganic Chemistry iridescent oxide interface', '#6b7999', { roughness: 0.12, metalness: 0.72, emissive: '#27366d', emissiveIntensity: 0.8 });
  const amberLight = material('Inorganic Chemistry amber oxidation state light', '#ffd29a', { emissive: '#ff8b32', emissiveIntensity: 2.6, roughness: 0.12 });
  const violetLight = material('Inorganic Chemistry violet halide node light', '#d2b3ff', { emissive: '#8150ff', emissiveIntensity: 2.6, roughness: 0.12 });
  const cyanLight = material('Inorganic Chemistry cyan lattice node light', '#c5fbff', { emissive: '#3ee0ff', emissiveIntensity: 2.7, roughness: 0.12 });
  const whiteLight = material('Inorganic Chemistry white pressure band light', '#ffffff', { emissive: '#dffcff', emissiveIntensity: 3.2, roughness: 0.08 });
  [amberLight, violetLight, cyanLight, whiteLight].forEach((item) => { item.userData.isDistrictAccent = true; });
  const mineralStrata = [basalt, siliconCarbide, thermalCeramic, zirconia, titaniumNitride, bronze, saltGlass];
  return { basalt, siliconCarbide, zirconia, saltGlass, cobaltGlass, alumina, paleGreenGlass, titaniumNitride, steel, darkSteel, mirror, bronze, copper, thermalCeramic, volcanic, palePaving, water, photoCopper, photoBlue, iridescent, amberLight, violetLight, cyanLight, whiteLight, mineralStrata };
}

function prepare<T extends THREE.Object3D>(object: T, name: string, obstacle = false) {
  object.name = name; object.userData.selectableId = DISTRICT_ID; object.userData.districtId = DISTRICT_ID;
  if (object instanceof THREE.Mesh) { object.castShadow = obstacle && !(object.material instanceof THREE.Material && object.material.transparent); object.receiveShadow = true; object.userData.navObstacle = obstacle; }
  return object;
}

function box(parent: THREE.Object3D, name: string, size: readonly [number, number, number], mat: THREE.Material, position: readonly [number, number, number], obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(BOX, mat), name, obstacle); mesh.scale.set(...size); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function cylinder(parent: THREE.Object3D, name: string, diameter: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 24, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(segments === 12 ? CYLINDER_12 : CYLINDER_24, mat), name, obstacle); mesh.scale.set(diameter, height, diameter); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function taper(parent: THREE.Object3D, name: string, bottom: number, top: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 12, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const ratio = bottom > 0 ? top / bottom : 0; const key = `${ratio.toFixed(2)}:${segments}`; let geometry = TAPER_CACHE.get(key);
  if (!geometry) { geometry = new THREE.CylinderGeometry(ratio * 0.5, 0.5, 1, segments); TAPER_CACHE.set(key, geometry); }
  const mesh = prepare(new THREE.Mesh(geometry, mat), name, obstacle); mesh.scale.set(bottom, height, bottom); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function sphere(parent: THREE.Object3D, name: string, scale: readonly [number, number, number], mat: THREE.Material, position: readonly [number, number, number], obstacle = false) {
  const mesh = prepare(new THREE.Mesh(SPHERE, mat), name, obstacle); mesh.scale.set(...scale); mesh.position.set(...position); parent.add(mesh); return mesh;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, mat: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0], arc = Math.PI * 2, obstacle = false) {
  const key = `${radius.toFixed(3)}:${tube.toFixed(3)}:${arc.toFixed(3)}`; let geometry = TORUS_CACHE.get(key);
  if (!geometry) { geometry = new THREE.TorusGeometry(radius, tube, 8, 40, arc); TORUS_CACHE.set(key, geometry); }
  const mesh = prepare(new THREE.Mesh(geometry, mat), name, obstacle); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function pipe(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, radius: number, mat: THREE.Material, obstacle = false) {
  const vector = end.clone().sub(start); const mesh = prepare(new THREE.Mesh(CYLINDER_12, mat), name, obstacle); mesh.position.copy(start).add(end).multiplyScalar(0.5); mesh.scale.set(radius * 2, vector.length(), radius * 2); mesh.quaternion.setFromUnitVectors(Y_AXIS, vector.normalize()); parent.add(mesh); return mesh;
}

function slabBetween(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, width: number, height: number, mat: THREE.Material, obstacle = false) {
  const vector = end.clone().sub(start); const mesh = prepare(new THREE.Mesh(BOX, mat), name, obstacle); mesh.position.copy(start).add(end).multiplyScalar(0.5); mesh.scale.set(width, height, vector.length()); mesh.quaternion.setFromUnitVectors(Z_AXIS, vector.normalize()); parent.add(mesh); return mesh;
}

function pulse<T extends THREE.Object3D>(object: T, speed: number, phase = 0, minIntensity = 0.18, maxIntensity = 4) { object.userData.animate = 'inorganic-chemistry-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object; }
function rotate<T extends THREE.Object3D>(object: T, speed: number, axis: 'x' | 'y' | 'z' = 'y') { object.userData.animate = 'inorganic-chemistry-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object; }
function breathe<T extends THREE.Object3D>(object: T, phase: number, amplitude = 0.18) { object.userData.animate = 'inorganic-chemistry-breathe'; object.userData.phase = phase; object.userData.amplitude = amplitude; object.userData.baseScale = object.scale.clone(); return object; }
function travel<T extends THREE.Object3D>(object: T, start: THREE.Vector3, end: THREE.Vector3, speed: number, phase = 0) { object.userData.animate = 'inorganic-chemistry-travel'; object.userData.pathStart = start.toArray(); object.userData.pathEnd = end.toArray(); object.userData.speed = speed; object.userData.phase = phase; return object; }

function addMineralPlinth(root: THREE.Group, code: string, width: number, depth: number, mat: InorganicMaterials, style: 'dry' | 'wet' | 'hot' = 'dry') {
  box(root, `INORGCHEM__${code}__VITRIFIED_MINERAL_PLINTH`, [width, 0.22, depth], style === 'hot' ? mat.volcanic : mat.basalt, [0, 0.11, 0], true);
  const channel = style === 'wet' ? mat.water : style === 'hot' ? mat.amberLight : mat.darkSteel;
  box(root, `INORGCHEM__${code}__PERIMETER_CHANNEL_N`, [width + 0.3, 0.045, 0.09], channel, [0, 0.235, -depth * 0.5 - 0.12]);
  box(root, `INORGCHEM__${code}__PERIMETER_CHANNEL_S`, [width + 0.3, 0.045, 0.09], channel, [0, 0.235, depth * 0.5 + 0.12]);
}

function createFoundry(m: InorganicMaterials) {
  const root = new THREE.Group(); root.name = 'INORGCHEM__I1__CRYSTAL_GENOME_FOUNDRY'; addMineralPlinth(root, 'I1', 15.0, 11.8, m);
  for (let wing = 0; wing < 7; wing += 1) { const a = wing * Math.PI * 2 / 7 + 0.18; const length = 7.1 - (wing % 3) * 0.65; const height = 3.0 + wing * 0.42; box(root, `INORGCHEM__I1__CRYSTAL_SYSTEM_WING_${wing + 1}`, [3.2, height, length], m.mineralStrata[wing], [Math.sin(a) * 3.2, 0.24 + height * 0.5, Math.cos(a) * 2.5], true, [0, a, (wing - 3) * 0.018]); }
  for (let node = 0; node < 48; node += 1) { const row = Math.floor(node / 12); const a = (node % 12) * Math.PI / 6 + row * 0.13; const r = 5.5 + row * 0.45; const y = 1.1 + row * 1.25; const n = pulse(sphere(root, `INORGCHEM__I1__DIAGRID_LATTICE_NODE_${node + 1}`, [0.13, 0.13, 0.13], node % 7 ? m.steel : m.cyanLight.clone(), [Math.sin(a) * r, y, Math.cos(a) * r]), 0.008, node * 0.21); if (node >= 30) n.position.x += Math.sin(node * 2.1) * 0.42; }
  for (let bond = 0; bond < 36; bond += 1) { const a = (bond % 12) * Math.PI / 6; const y0 = 1.1 + Math.floor(bond / 12) * 1.25; pipe(root, `INORGCHEM__I1__DIAGRID_BOND_${bond + 1}`, new THREE.Vector3(Math.sin(a) * (5.5 + Math.floor(bond / 12) * 0.45), y0, Math.cos(a) * (5.5 + Math.floor(bond / 12) * 0.45)), new THREE.Vector3(Math.sin(a + Math.PI / 6) * (5.95 + Math.floor(bond / 12) * 0.45), y0 + 1.25, Math.cos(a + Math.PI / 6) * (5.95 + Math.floor(bond / 12) * 0.45)), 0.055, m.darkSteel); }
  taper(root, 'INORGCHEM__I1__FACETED_SYNTHESIS_STACK', 2.2, 1.35, 9.1, m.siliconCarbide, [0, 4.8, 0], true, 8);
  for (let ring = 0; ring < 9; ring += 1) pulse(torus(root, `INORGCHEM__I1__HEAT_RECOVERY_RING_${ring + 1}`, 1.18 - ring * 0.035, 0.075, ring % 3 ? m.steel : m.amberLight.clone(), [0, 1.6 + ring * 0.82, 0]), 0.009, ring * 0.45);
  for (let tube = 0; tube < 7; tube += 1) { const a = tube * Math.PI * 2 / 7; const start = new THREE.Vector3(0, 4.2 + (tube % 2) * 0.4, 0); const end = new THREE.Vector3(Math.sin(a) * 5.5, 3.2 + (tube % 3) * 0.35, Math.cos(a) * 4.4); pipe(root, `INORGCHEM__I1__SAMPLE_TRANSPORT_TUBE_${tube + 1}`, start, end, 0.13, m.alumina); for (let capsule = 0; capsule < 2; capsule += 1) travel(box(root, `INORGCHEM__I1__ROBOTIC_SAMPLE_CAPSULE_${tube + 1}_${capsule + 1}`, [0.34, 0.24, 0.24], capsule ? m.amberLight.clone() : m.cyanLight.clone(), start.toArray() as [number, number, number]), start, end, 0.012 + tube * 0.0005, capsule * 0.5 + tube * 0.1); }
  return root;
}

function createCatalystSpire(m: InorganicMaterials) {
  const root = new THREE.Group(); root.name = 'INORGCHEM__I2__MONATOMIC_CATALYST_SPIRE'; addMineralPlinth(root, 'I2', 8.2, 8.2, m, 'wet');
  for (let wing = 0; wing < 3; wing += 1) { const a = wing * Math.PI * 2 / 3; box(root, `INORGCHEM__I2__RADIAL_RESEARCH_WING_${wing + 1}`, [3.2, 1.35, 6.2], m.siliconCarbide, [Math.sin(a) * 2.35, 0.9, Math.cos(a) * 2.35], true, [0, a, 0]); const base = new THREE.Vector3(Math.sin(a) * 3.2, 1.1, Math.cos(a) * 3.2); const shoulder = new THREE.Vector3(Math.sin(a) * 2.1, 7.2, Math.cos(a) * 2.1); const centre = new THREE.Vector3(Math.sin(a) * 1.45, 8.1, Math.cos(a) * 1.45); pipe(root, `INORGCHEM__I2__COORDINATION_ARM_LOWER_${wing + 1}`, base, shoulder, 0.35, m.darkSteel, true); pipe(root, `INORGCHEM__I2__COORDINATION_ARM_UPPER_${wing + 1}`, shoulder, centre, 0.3, m.darkSteel, true); }
  sphere(root, 'INORGCHEM__I2__SUSPENDED_ACTIVE_ATOMIC_CENTRE', [1.65, 1.65, 1.65], m.mirror, [0, 8.2, 0], true);
  for (let site = 0; site < 24; site += 1) { const a = site * Math.PI * 2 / 24; pulse(sphere(root, `INORGCHEM__I2__SELECTED_ACTIVE_SITE_${site + 1}`, [0.09, 0.09, 0.09], site % 4 ? m.cyanLight.clone() : m.amberLight.clone(), [Math.sin(a) * (site % 2 ? 2.55 : 3.4), 2.2 + (site % 5) * 1.05, Math.cos(a) * (site % 2 ? 2.55 : 3.4)]), 0.015, site * 0.37); }
  cylinder(root, 'INORGCHEM__I2__NEEDLE_MAST', 0.38, 7.1, m.titaniumNitride, [0, 12.35, 0], false, 12); taper(root, 'INORGCHEM__I2__NEEDLE_TIP', 0.6, 0, 2.4, m.steel, [0, 17.1, 0], false, 12);
  const exhaustMaterials = [m.copper, m.darkSteel, m.basalt, m.cobaltGlass, m.steel]; for (let tower = 0; tower < 5; tower += 1) cylinder(root, `INORGCHEM__I2__TRANSITION_METAL_EXHAUST_${tower + 1}`, 0.62, 2.1 + tower * 0.22, exhaustMaterials[tower], [-2.7 + tower * 1.35, 1.35 + tower * 0.11, -3.15], true, 12);
  return root;
}

function createHalideCitadel(m: InorganicMaterials) {
  const root = new THREE.Group(); root.name = 'INORGCHEM__I3__HALIDE_ION_CITADEL'; addMineralPlinth(root, 'I3', 16.8, 10.3, m);
  box(root, 'INORGCHEM__I3__SEALED_STRUCTURAL_CORE', [13.8, 3.5, 7.5], m.basalt, [0, 1.98, -0.2], true);
  for (let layer = 0; layer < 3; layer += 1) { const width = 14.6 + layer * 0.7; const depth = 8.2 + layer * 0.55; const mat = layer === 0 ? m.saltGlass : layer === 1 ? m.zirconia : m.darkSteel; box(root, `INORGCHEM__I3__DEFENSIVE_LAYER_N_${layer + 1}`, [width, 2.8 - layer * 0.22, 0.24], mat, [0, 1.75, -depth * 0.5], layer === 2); box(root, `INORGCHEM__I3__DEFENSIVE_LAYER_S_${layer + 1}`, [width, 2.8 - layer * 0.22, 0.24], mat, [0, 1.75, depth * 0.5], layer === 2); box(root, `INORGCHEM__I3__DEFENSIVE_LAYER_W_${layer + 1}`, [0.24, 2.8 - layer * 0.22, depth], mat, [-width * 0.5, 1.75, 0], layer === 2); box(root, `INORGCHEM__I3__DEFENSIVE_LAYER_E_${layer + 1}`, [0.24, 2.8 - layer * 0.22, depth], mat, [width * 0.5, 1.75, 0], layer === 2); }
  box(root, 'INORGCHEM__I3__OVERHANGING_ANGULAR_RAIN_CANOPY', [17.8, 0.42, 11.1], m.siliconCarbide, [0, 4.1, 0], true, [0, 0, 0.015]);
  for (let seam = 0; seam < 18; seam += 1) pulse(box(root, `INORGCHEM__I3__HALIDE_SEAM_${seam + 1}`, [0.05, 2.35, 0.04], seam % 2 ? m.amberLight.clone() : m.violetLight.clone(), [-7.0 + seam * 0.82, 1.7, 4.28]), 0.007, seam * 0.27);
  for (let tower = 0; tower < 6; tower += 1) { const x = -6.3 + tower * 2.5; taper(root, `INORGCHEM__I3__FACETED_DESICCANT_CRYSTAL_${tower + 1}`, 1.15, 0.55, 2.8 + (tower % 2) * 0.5, m.saltGlass, [x, 5.65 + (tower % 2) * 0.25, 0], true, 6); rotate(torus(root, `INORGCHEM__I3__DESICCANT_REGENERATION_RING_${tower + 1}`, 0.72, 0.08, m.steel, [x, 5.5, 0], [Math.PI / 2, 0, 0]), 0.004 + tower * 0.0003); }
  for (let cut = 0; cut < 3; cut += 1) { const x = -5 + cut * 5; box(root, `INORGCHEM__I3__DEEP_TRIANGULAR_THRESHOLD_${cut + 1}`, [2.0, 2.4, 1.65], m.volcanic, [x, 1.45, 4.7], true); box(root, `INORGCHEM__I3__PRESSURE_GATE_${cut + 1}`, [1.25, 1.9, 0.08], m.alumina, [x, 1.35, 5.56]); }
  return root;
}

function createFrameworkArk(m: InorganicMaterials) {
  const root = new THREE.Group(); root.name = 'INORGCHEM__I4__BREATHING_FRAMEWORK_ARK'; addMineralPlinth(root, 'I4', 19.4, 8.6, m, 'wet');
  box(root, 'INORGCHEM__I4__ARK_WEST_PIER', [4.3, 7.0, 7.6], m.siliconCarbide, [-7.2, 3.7, 0], true); box(root, 'INORGCHEM__I4__ARK_EAST_PIER', [4.3, 7.0, 7.6], m.siliconCarbide, [7.2, 3.7, 0], true); box(root, 'INORGCHEM__I4__POROUS_ARCH_CROWN', [10.8, 2.2, 7.3], m.alumina, [0, 6.55, 0], true);
  const nodes: THREE.Vector3[] = []; for (let row = 0; row < 5; row += 1) for (let column = 0; column < 13; column += 1) { const x = -8.4 + column * 1.4; const y = 1.0 + row * 1.35 + Math.max(0, 4.7 - Math.abs(x) * 0.62); const z = row % 2 ? 3.9 : -3.9; nodes.push(new THREE.Vector3(x, y, z)); pulse(sphere(root, `INORGCHEM__I4__FRAMEWORK_NODE_${row + 1}_${column + 1}`, [0.13, 0.13, 0.13], (row + column) % 7 ? m.steel : m.cyanLight.clone(), [x, y, z]), 0.006, row + column * 0.18); if (column > 0) pipe(root, `INORGCHEM__I4__MOLECULAR_STRUT_${row + 1}_${column}`, nodes[nodes.length - 2], nodes[nodes.length - 1], 0.045, m.steel); }
  for (let shutter = 0; shutter < 72; shutter += 1) { const row = Math.floor(shutter / 18); const col = shutter % 18; const item = box(root, `INORGCHEM__I4__BREATHING_CERAMIC_SHUTTER_${shutter + 1}`, [0.65, 0.52, 0.06], shutter % 5 ? m.zirconia : m.saltGlass, [-8.0 + col * 0.94, 1.15 + row * 1.25, shutter % 2 ? 4.08 : -4.08], false, [0, 0, (shutter % 3 - 1) * 0.35]); breathe(item, shutter * 0.21, 0.2); }
  for (let tower = 0; tower < 6; tower += 1) { const x = -7.5 + tower * 3; cylinder(root, `INORGCHEM__I4__ATMOSPHERIC_GILL_TOWER_${tower + 1}`, 1.0, 4.2 + (tower % 2) * 0.7, m.darkSteel, [x, 9.0 + (tower % 2) * 0.35, 0], true, 12); for (let fin = 0; fin < 5; fin += 1) box(root, `INORGCHEM__I4__CAPTURE_FIN_${tower + 1}_${fin + 1}`, [1.4, 0.08, 1.4], m.titaniumNitride, [x, 7.4 + fin * 0.72, 0]); }
  for (let basin = 0; basin < 7; basin += 1) cylinder(root, `INORGCHEM__I4__CONDENSATION_BASIN_${basin + 1}`, 1.6, 0.09, m.water, [-7.5 + basin * 2.5, 0.29, 5.0], false, 24);
  return root;
}

function createLeafworks(m: InorganicMaterials) {
  const root = new THREE.Group(); root.name = 'INORGCHEM__I5__SOLAR_FUELS_LEAFWORKS'; addMineralPlinth(root, 'I5', 22.8, 15.2, m, 'wet'); box(root, 'INORGCHEM__I5__CENTRAL_LABORATORY_SPINE', [3.1, 3.2, 13.0], m.zirconia, [0, 1.85, 0], true);
  box(root, 'INORGCHEM__I5__CENTRAL_WATER_CHANNEL', [1.0, 0.08, 14.2], m.water, [0, 0.27, 0]);
  for (let leaf = 0; leaf < 5; leaf += 1) { const a = -1.05 + leaf * 0.525; const side = leaf % 2 ? 1 : -1; const pivot = new THREE.Group(); pivot.name = `INORGCHEM__I5__MINERAL_LEAF_PIVOT_${leaf + 1}`; pivot.position.set(0, 3.2 + (leaf % 2) * 0.22, -4.6 + leaf * 2.3); pivot.rotation.y = a; root.add(pivot); box(pivot, `INORGCHEM__I5__FOLDED_PHOTOELECTRODE_LEAF_${leaf + 1}`, [10.2, 0.26, 3.5], leaf % 2 ? m.photoCopper : m.photoBlue, [side * 4.8, 0, 0], true, [0, 0, side * (0.09 + leaf * 0.012)]); box(pivot, `INORGCHEM__I5__WHITE_CERAMIC_LEAF_UNDERSIDE_${leaf + 1}`, [9.8, 0.08, 3.2], m.zirconia, [side * 4.8, -0.19, 0]); rotate(pivot, 0.00035 + leaf * 0.00004, 'z'); box(root, `INORGCHEM__I5__WATER_RILL_${leaf + 1}`, [0.16, 0.045, 8.0], m.water, [side * (1.6 + leaf * 0.55), 0.29, -4.3 + leaf * 2.15], false, [0, a, 0]); cylinder(root, `INORGCHEM__I5__GAS_SEPARATION_TOWER_${leaf + 1}`, 0.9, 6.7, m.alumina, [Math.sin(a) * 9.0, 3.65, Math.cos(a) * 6.5], true, 12); }
  torus(root, 'INORGCHEM__I5__SOLAR_REACTION_GATE', 2.4, 0.28, m.titaniumNitride, [0, 3.0, 8.2], [0, 0, 0], Math.PI * 2, true); cylinder(root, 'INORGCHEM__I5__SOLAR_REACTION_REFLECTING_POOL', 4.6, 0.08, m.water, [0, 0.29, 10.2], false, 24);
  for (let vein = 0; vein < 25; vein += 1) pulse(box(root, `INORGCHEM__I5__CHARGE_TRANSFER_VEIN_${vein + 1}`, [0.045, 0.04, 4.5], vein % 2 ? m.cyanLight.clone() : m.amberLight.clone(), [-8.6 + (vein % 5) * 4.3, 3.4, -4.6 + Math.floor(vein / 5) * 2.3], false, [0, -1.05 + (vein % 5) * 0.525, 0]), 0.009, vein * 0.25);
  return root;
}

function createNitrogenForge(m: InorganicMaterials) {
  const root = new THREE.Group(); root.name = 'INORGCHEM__I6__NITROGEN_TRIPLE_BOND_FORGE'; addMineralPlinth(root, 'I6', 13.9, 12.9, m); box(root, 'INORGCHEM__I6__ACOUSTIC_PROCESS_HALL', [11.8, 4.4, 9.5], m.basalt, [0, 2.5, 0], true);
  for (let block = 0; block < 28; block += 1) box(root, `INORGCHEM__I6__VISIBLE_ISOLATION_BLOCK_${block + 1}`, [0.55, 0.28, 0.55], m.darkSteel, [-5.3 + (block % 7) * 1.75, 0.34, block < 14 ? -5.4 + Math.floor(block / 7) * 10.8 : -5.4 + Math.floor((block - 14) / 7) * 10.8]);
  for (let drum = 0; drum < 3; drum += 1) { const z = -3.0 + drum * 3.0; rotate(cylinder(root, `INORGCHEM__I6__MECHANOCHEMICAL_REACTOR_DRUM_${drum + 1}`, 3.2, 10.5, drum === 1 ? m.bronze : m.siliconCarbide, [0, 4.35, z], true, 24, [0, 0, Math.PI / 2]), 0.0018 + drum * 0.0003, 'x'); for (let bond = 0; bond < 3; bond += 1) pulse(box(root, `INORGCHEM__I6__TRIPLE_BOND_LINE_${drum + 1}_${bond + 1}`, [10.8, 0.08, 0.08], bond === 1 ? m.amberLight.clone() : m.whiteLight.clone(), [0, 6.0 + bond * 0.19, z]), 0.014, drum * 0.6 + bond * 0.18); }
  cylinder(root, 'INORGCHEM__I6__ATMOSPHERIC_INTAKE_MAST', 1.0, 7.9, m.darkSteel, [0, 8.35, -4.5], true, 12); for (let branch = 0; branch < 4; branch += 1) pipe(root, `INORGCHEM__I6__AIR_INTAKE_BRANCH_${branch + 1}`, new THREE.Vector3(0, 12.0, -4.5), new THREE.Vector3(-3 + branch * 2, 14.0 + (branch % 2) * 0.5, -4.5), 0.18, m.steel);
  for (let scrubber = 0; scrubber < 5; scrubber += 1) cylinder(root, `INORGCHEM__I6__MINERAL_SCRUBBER_${scrubber + 1}`, 0.78, 2.2 + (scrubber % 2) * 0.5, m.zirconia, [-4.6 + scrubber * 2.3, 1.35, 5.1], true, 12);
  return root;
}

function createMonastery(m: InorganicMaterials) {
  const root = new THREE.Group(); root.name = 'INORGCHEM__I7__F_BLOCK_CONTAINMENT_MONASTERY'; addMineralPlinth(root, 'I7', 20.0, 16.0, m);
  for (let wall = 0; wall < 5; wall += 1) { const width = 19.2 - wall * 2.5; const depth = 15.2 - wall * 1.9; const height = 2.8 + wall * 0.75; const mat = [m.basalt, m.darkSteel, m.bronze, m.zirconia, m.siliconCarbide][wall]; box(root, `INORGCHEM__I7__NESTED_CONTAINMENT_WALL_N_${wall + 1}`, [width, height, 0.5], mat, [0, 0.24 + height * 0.5, -depth * 0.5], true); box(root, `INORGCHEM__I7__NESTED_CONTAINMENT_WALL_S_${wall + 1}`, [width, height, 0.5], mat, [0, 0.24 + height * 0.5, depth * 0.5], true); box(root, `INORGCHEM__I7__NESTED_CONTAINMENT_WALL_W_${wall + 1}`, [0.5, height, depth], mat, [-width * 0.5, 0.24 + height * 0.5, 0], true); box(root, `INORGCHEM__I7__NESTED_CONTAINMENT_WALL_E_${wall + 1}`, [0.5, height, depth], mat, [width * 0.5, 0.24 + height * 0.5, 0], true); box(root, `INORGCHEM__I7__SLIDING_MINERAL_GATE_${wall + 1}`, [2.4, 1.9 + wall * 0.35, 0.16], m.steel, [0.8 - wall * 0.32, 1.2 + wall * 0.18, depth * 0.5 + 0.28]); }
  box(root, 'INORGCHEM__I7__SHIELDED_LANTERN_TOWER', [5.2, 7.6, 5.2], m.basalt, [0, 4.05, 0], true); for (let band = 0; band < 5; band += 1) pulse(box(root, `INORGCHEM__I7__RADIATION_RESISTANT_AMBER_LANTERN_BAND_${band + 1}`, [5.4, 0.42, 5.4], m.amberLight.clone(), [0, 5.6 + band * 0.62, 0]), 0.005, band * 0.7, 0.12, 2.8);
  box(root, 'INORGCHEM__I7__SHIELDED_TRANSPORT_RAIL', [1.0, 0.34, 18.0], m.darkSteel, [0, 0.5, 0]); box(root, 'INORGCHEM__I7__ENCLOSED_PARTICLE_PHYSICS_BRIDGE', [1.6, 1.15, 7.4], m.alumina, [0, 2.2, -10.7]);
  for (let pylon = 0; pylon < 16; pylon += 1) { const a = pylon * Math.PI * 2 / 16; taper(root, `INORGCHEM__I7__RADIATION_MONITORING_OBELISK_${pylon + 1}`, 0.45, 0.12, 2.3, m.zirconia, [Math.sin(a) * 10.6, 1.4, Math.cos(a) * 8.6], false, 4); pulse(sphere(root, `INORGCHEM__I7__MONITOR_SENSOR_${pylon + 1}`, [0.07, 0.07, 0.07], pylon % 3 ? m.cyanLight.clone() : m.amberLight.clone(), [Math.sin(a) * 10.6, 2.62, Math.cos(a) * 8.6]), 0.007, pylon * 0.3); }
  return root;
}

function createRefinery(m: InorganicMaterials) {
  const root = new THREE.Group(); root.name = 'INORGCHEM__I8__LANTHANIDE_CASCADE_REFINERY'; addMineralPlinth(root, 'I8', 27.4, 8.9, m, 'wet');
  for (let terrace = 0; terrace < 6; terrace += 1) box(root, `INORGCHEM__I8__SEPARATION_TERRACE_${terrace + 1}`, [4.5, 1.2 + terrace * 0.38, 6.8], m.mineralStrata[terrace], [-11.25 + terrace * 4.5, 0.85 + terrace * 0.19, 0], true);
  for (let tower = 0; tower < 17; tower += 1) { const x = -12 + tower * 1.5; const height = 3.0 + (tower % 5) * 0.35; cylinder(root, `INORGCHEM__I8__RARE_EARTH_PROCESS_TOWER_${String(tower + 1).padStart(2, '0')}`, 0.55 + (tower % 4) * 0.08, height, tower < 5 ? m.darkSteel : tower < 11 ? m.zirconia : m.mirror, [x, 2.0 + height * 0.5, -1.5 + (tower % 2) * 3.0], true, tower % 3 ? 12 : 24); pulse(torus(root, `INORGCHEM__I8__SEPARATION_STATE_RING_${tower + 1}`, 0.42, 0.04, tower < 7 ? m.amberLight.clone() : m.cyanLight.clone(), [x, 3.4 + height * 0.45, -1.5 + (tower % 2) * 3.0]), 0.008, tower * 0.28); }
  for (let column = 0; column < 24; column += 1) cylinder(root, `INORGCHEM__I8__EXTRACTION_COLUMN_${column + 1}`, 0.28, 1.5 + (column % 3) * 0.28, m.alumina, [-11.5 + column * 0.98, 1.15, 3.2], false, 12);
  box(root, 'INORGCHEM__I8__SEALED_E_WASTE_CONVEYOR', [23.5, 0.65, 0.8], m.alumina, [0, 3.25, -3.6]); for (let gantry = 0; gantry < 5; gantry += 1) torus(root, `INORGCHEM__I8__MAGNETIC_HORSESHOE_GANTRY_${gantry + 1}`, 1.45, 0.14, m.darkSteel, [-9.5 + gantry * 4.8, 3.1, -3.6], [0, 0, 0], Math.PI, true);
  return root;
}

function createBasilica(m: InorganicMaterials) {
  const root = new THREE.Group(); root.name = 'INORGCHEM__I9__POLYOXOMETALATE_BASILICA'; addMineralPlinth(root, 'I9', 13.4, 13.4, m, 'wet'); cylinder(root, 'INORGCHEM__I9__FACETED_DOME_DRUM', 10.6, 2.4, m.cobaltGlass, [0, 1.45, 0], true, 12); const dome = prepare(new THREE.Mesh(new THREE.SphereGeometry(5.25, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), m.cobaltGlass), 'INORGCHEM__I9__METAL_OXIDE_POLYHEDRAL_DOME', true); dome.position.y = 2.65; root.add(dome);
  for (let chapel = 0; chapel < 12; chapel += 1) { const a = chapel * Math.PI / 6; const geometry = new THREE.CylinderGeometry(1.2 + (chapel % 3) * 0.12, 1.35, 2.1 + (chapel % 4) * 0.28, 4 + chapel % 5); const volume = prepare(new THREE.Mesh(geometry, chapel % 2 ? m.zirconia : m.cobaltGlass), `INORGCHEM__I9__POLYGONAL_CLUSTER_CHAPEL_${chapel + 1}`, true); volume.position.set(Math.sin(a) * 7.0, 1.4, Math.cos(a) * 7.0); volume.rotation.y = a; root.add(volume); pipe(root, `INORGCHEM__I9__ENCLOSED_CHAPEL_BRIDGE_${chapel + 1}`, new THREE.Vector3(Math.sin(a) * 4.8, 1.8, Math.cos(a) * 4.8), new THREE.Vector3(Math.sin(a) * 5.9, 1.8, Math.cos(a) * 5.9), 0.16, m.alumina); }
  for (let node = 0; node < 36; node += 1) { const row = Math.floor(node / 12); const a = (node % 12) * Math.PI / 6; pulse(sphere(root, `INORGCHEM__I9__DOME_POLISHED_NODE_${node + 1}`, [0.12, 0.12, 0.12], node % 4 ? m.steel : m.cyanLight.clone(), [Math.sin(a) * (5.15 - row * 0.75), 3.5 + row * 1.35, Math.cos(a) * (5.15 - row * 0.75)]), 0.007, node * 0.19); }
  for (let ring = 0; ring < 5; ring += 1) torus(root, `INORGCHEM__I9__NESTED_POLYHEDRAL_ROSE_RING_${ring + 1}`, 0.55 + ring * 0.36, 0.08, ring % 2 ? m.steel : m.cobaltGlass, [0, 3.0, 5.42], [0, 0, 0]);
  for (let spire = 0; spire < 3; spire += 1) taper(root, `INORGCHEM__I9__HOLLOW_POLYHEDRAL_CROWN_SPIRE_${spire + 1}`, 0.85, 0.12, 2.8, m.steel, [-1.2 + spire * 1.2, 8.0, 0], false, 4 + spire * 2);
  torus(root, 'INORGCHEM__I9__RING_REFLECTING_POOL', 6.0, 0.35, m.water, [0, 0.28, 0]);
  return root;
}

function createOxideTerraces(m: InorganicMaterials) {
  const root = new THREE.Group(); root.name = 'INORGCHEM__I10__QUANTUM_OXIDE_TERRACES'; addMineralPlinth(root, 'I10', 15.0, 11.0, m); torus(root, 'INORGCHEM__I10__POLISHED_BLACK_GLASS_ISOLATION_MOAT', 6.2, 0.48, m.volcanic, [0, 0.31, 0]);
  for (let pylon = 0; pylon < 4; pylon += 1) box(root, `INORGCHEM__I10__VIBRATION_ISOLATED_PYLON_${pylon + 1}`, [1.0, 6.2, 1.0], m.darkSteel, [pylon < 2 ? -4.8 : 4.8, 3.35, pylon % 2 ? -3.2 : 3.2], true);
  for (let layer = 0; layer < 6; layer += 1) { const slab = box(root, `INORGCHEM__I10__ROTATED_EPITAXIAL_SLAB_${layer + 1}`, [14.2 - layer * 0.45, 0.72, 9.2 - layer * 0.25], layer < 2 ? m.zirconia : layer < 4 ? m.steel : m.siliconCarbide, [0, 1.2 + layer * 1.25, 0], true, [0, (layer - 2.5) * 0.055, 0]); pulse(box(root, `INORGCHEM__I10__IRIDESCENT_LAYER_INTERFACE_${layer + 1}`, [14.35 - layer * 0.45, 0.07, 9.35 - layer * 0.25], m.iridescent.clone(), [0, 1.58 + layer * 1.25, 0], false, [0, (layer - 2.5) * 0.055, 0]), 0.006, layer * 0.7); slab.userData.epitaxialOrientationDegrees = (layer - 2.5) * 3.15; }
  for (let stack = 0; stack < 4; stack += 1) { cylinder(root, `INORGCHEM__I10__CRYOGENIC_SERVICE_STACK_${stack + 1}`, 0.6, 4.0 + stack * 0.4, m.alumina, [-5.8 + stack * 3.8, 7.6, -3.5], true, 24); for (let ring = 0; ring < 3; ring += 1) torus(root, `INORGCHEM__I10__VAPOUR_DEFLECTION_RING_${stack + 1}_${ring + 1}`, 0.48 + ring * 0.1, 0.045, m.steel, [-5.8 + stack * 3.8, 8.4 + ring * 0.52, -3.5]); }
  return root;
}

function createDiamondAnvil(m: InorganicMaterials) {
  const root = new THREE.Group(); root.name = 'INORGCHEM__I11__MEGABAR_DIAMOND_ANVIL_TOWER'; addMineralPlinth(root, 'I11', 10.2, 10.2, m); cylinder(root, 'INORGCHEM__I11__CIRCULAR_ISOLATION_FIELD', 9.2, 0.08, m.volcanic, [0, 0.28, 0], false, 24);
  taper(root, 'INORGCHEM__I11__LOWER_OPPOSED_DIAMOND_ANVIL', 7.5, 2.0, 7.2, m.alumina, [0, 3.9, 0], true, 8); taper(root, 'INORGCHEM__I11__UPPER_OPPOSED_DIAMOND_ANVIL', 2.0, 7.0, 7.5, m.siliconCarbide, [0, 11.25, 0], true, 8); taper(root, 'INORGCHEM__I11__FACETED_SENSOR_CROWN', 6.8, 0.25, 2.2, m.mirror, [0, 16.1, 0], false, 8);
  for (let side = -1; side <= 1; side += 2) { const points = [new THREE.Vector3(side * 5.0, 0.4, 0), new THREE.Vector3(side * 6.2, 5.8, 0), new THREE.Vector3(side * 4.6, 10.8, 0), new THREE.Vector3(side * 2.4, 12.3, 0)]; for (let segment = 0; segment < points.length - 1; segment += 1) pipe(root, `INORGCHEM__I11__COMPRESSION_ARCH_${side < 0 ? 'W' : 'E'}_${segment + 1}`, points[segment], points[segment + 1], 0.42, segment % 2 ? m.zirconia : m.darkSteel, true); for (let cable = 0; cable < 4; cable += 1) pipe(root, `INORGCHEM__I11__TENSION_CABLE_${side < 0 ? 'W' : 'E'}_${cable + 1}`, new THREE.Vector3(side * (4.8 + cable * 0.32), 0.35, -4.3 + cable * 2.8), new THREE.Vector3(side * 2.9, 8.4, 0), 0.055, m.steel); }
  for (let ring = 0; ring < 13; ring += 1) pulse(torus(root, `INORGCHEM__I11__CALIBRATED_PRESSURE_RING_${ring + 1}`, 1.1 + Math.abs(6 - ring) * 0.38, ring === 6 ? 0.2 : 0.075, ring === 6 ? m.whiteLight.clone() : m.cyanLight.clone(), [0, 2.3 + ring * 0.94, 0]), 0.012, Math.abs(6 - ring) * 0.45, ring === 6 ? 1.4 : 0.1, ring === 6 ? 6 : 2.8);
  for (let fracture = 0; fracture < 16; fracture += 1) { const a = fracture * Math.PI / 8; slabBetween(root, `INORGCHEM__I11__FLEXIBLE_RADIAL_FRACTURE_JOINT_${fracture + 1}`, new THREE.Vector3(Math.sin(a) * 1.0, 0.35, Math.cos(a) * 1.0), new THREE.Vector3(Math.sin(a) * 4.7, 0.35, Math.cos(a) * 4.7), 0.04, 0.04, m.steel); }
  return root;
}

function createThermalKeep(m: InorganicMaterials) {
  const root = new THREE.Group(); root.name = 'INORGCHEM__I12__MOLTEN_SALT_THERMAL_KEEP'; addMineralPlinth(root, 'I12', 16.0, 14.0, m, 'hot'); box(root, 'INORGCHEM__I12__THERMAL_KEEP_CORE', [13.8, 6.1, 10.8], m.thermalCeramic, [0, 3.3, 0], true);
  for (let rib = 0; rib < 34; rib += 1) box(root, `INORGCHEM__I12__DEEP_THERMAL_RIB_${rib + 1}`, [0.22, 5.8, 0.52], rib % 5 ? m.basalt : m.bronze, [-6.55 + (rib % 17) * 0.82, 3.3, rib < 17 ? -5.65 : 5.65]);
  for (let stack = 0; stack < 6; stack += 1) { const x = -5.6 + stack * 2.25; cylinder(root, `INORGCHEM__I12__THERMAL_STACK_${stack + 1}`, 1.1, 4.2 + (stack % 2) * 0.7, m.darkSteel, [x, 8.2 + (stack % 2) * 0.35, -1.5 + (stack % 3) * 1.5], true, 12); for (let fin = 0; fin < 4; fin += 1) torus(root, `INORGCHEM__I12__HEAT_EXCHANGE_FIN_${stack + 1}_${fin + 1}`, 0.75 + fin * 0.12, 0.06, m.steel, [x, 7.0 + fin * 0.75, -1.5 + (stack % 3) * 1.5]); }
  for (let conduit = 0; conduit < 8; conduit += 1) { const y = 1.0 + conduit * 0.62; pulse(box(root, `INORGCHEM__I12__SHIELDED_MOLTEN_SALT_CONDUIT_${conduit + 1}`, [14.6, 0.18, 0.18], conduit % 3 ? m.amberLight.clone() : m.darkSteel, [0, y, 5.75]), 0.008, conduit * 0.43, 0.08, 2.2); box(root, `INORGCHEM__I12__TRANSPARENT_CONDUIT_SHIELD_${conduit + 1}`, [14.9, 0.35, 0.08], m.alumina, [0, y, 5.93]); }
  for (let silo = 0; silo < 4; silo += 1) { const x = -5.2 + silo * 3.5; taper(root, `INORGCHEM__I12__FACETED_IONIC_STORAGE_SILO_${silo + 1}`, 2.2, 1.3, 4.0, m.siliconCarbide, [x, 2.3, -7.1], true, 6 + silo); torus(root, `INORGCHEM__I12__SILO_CONTAINMENT_WALL_${silo + 1}`, 1.5, 0.18, m.zirconia, [x, 0.5, -7.1]); pipe(root, `INORGCHEM__I12__ELEVATED_PIPE_BRIDGE_${silo + 1}`, new THREE.Vector3(x, 3.2, -6.0), new THREE.Vector3(x * 0.65, 4.2, -4.8), 0.14, m.steel); }
  for (let radiator = 0; radiator < 28; radiator += 1) box(root, `INORGCHEM__I12__ROOF_RADIATOR_FIN_${radiator + 1}`, [0.12, 1.0, 4.6], m.darkSteel, [-6.4 + (radiator % 14) * 0.98, 6.85, -2.6 + Math.floor(radiator / 14) * 5.2], false, [0, 0, 0.32]);
  return root;
}

function createBiomineralConservatory(m: InorganicMaterials) {
  const root = new THREE.Group(); root.name = 'INORGCHEM__I13__BIOMINERAL_HYBRID_CONSERVATORY'; addMineralPlinth(root, 'I13', 17.9, 9.9, m, 'wet'); box(root, 'INORGCHEM__I13__PALE_GREEN_DIFFUSE_GLASS_ENCLOSURE', [15.6, 4.5, 7.4], m.paleGreenGlass, [0, 2.5, 0], true);
  const ribPoints = Array.from({ length: 44 }, (_, index) => { const side = index % 2 ? 1 : -1; const x = -7.4 + (index % 11) * 1.48; const z = side * 3.85; const y = 0.35 + Math.floor(index / 11) * 1.25; return new THREE.Vector3(x, y, z); }); ribPoints.forEach((point, index) => { const target = new THREE.Vector3(point.x * 0.75 + Math.sin(index) * 0.5, Math.min(5.0, point.y + 1.35 + (index % 3) * 0.45), point.z * 0.75); pipe(root, `INORGCHEM__I13__BRANCHING_POROUS_CERAMIC_RIB_${index + 1}`, point, target, 0.11 + (index % 4) * 0.025, m.zirconia); if (index % 4 === 0) pulse(sphere(root, `INORGCHEM__I13__MINERAL_INCLUSION_${index + 1}`, [0.09, 0.09, 0.09], index % 8 ? m.cyanLight.clone() : m.amberLight.clone(), target.toArray() as [number, number, number]), 0.006, index * 0.25); });
  const veinMats = [m.copper, m.darkSteel, m.cobaltGlass, m.titaniumNitride, m.steel]; for (let vein = 0; vein < 25; vein += 1) pipe(root, `INORGCHEM__I13__METALLOENZYME_VEIN_${vein + 1}`, new THREE.Vector3(-7.2 + (vein % 5) * 3.6, 0.7, vein % 2 ? -3.92 : 3.92), new THREE.Vector3(-6.6 + (vein % 5) * 3.3, 4.5, vein % 2 ? -3.92 : 3.92), 0.035, veinMats[vein % 5]);
  for (let panel = 0; panel < 16; panel += 1) box(root, `INORGCHEM__I13__CONTROLLED_MINERAL_DEPOSITION_PANEL_${panel + 1}`, [0.72, 1.1, 0.08], [m.zirconia, m.thermalCeramic, m.saltGlass, m.basalt][panel % 4], [-6.2 + (panel % 8) * 1.78, 1.2 + Math.floor(panel / 8) * 1.55, 4.03]);
  for (let channel = 0; channel < 7; channel += 1) box(root, `INORGCHEM__I13__EXTERIOR_MINERAL_WATER_CHANNEL_${channel + 1}`, [0.22, 0.06, 4.0], m.water, [-6.0 + channel * 2.0, 0.3, 4.9]);
  box(root, 'INORGCHEM__I13__ORGANIC_CHEMISTRY_TRANSITION_BRIDGE', [3.0, 1.0, 9.5], m.alumina, [0, 3.4, -8.1], false); for (let chimney = 0; chimney < 12; chimney += 1) taper(root, `INORGCHEM__I13__ARTIFICIAL_HYDROTHERMAL_CHIMNEY_${chimney + 1}`, 0.65, 0.18, 1.3 + (chimney % 4) * 0.38, chimney % 3 ? m.basalt : m.titaniumNitride, [-7.0 + chimney * 1.25, 0.9 + (chimney % 4) * 0.19, 5.3], false, 6);
  return root;
}

function createRamparts(m: InorganicMaterials) {
  const root = new THREE.Group(); root.name = 'INORGCHEM__I14__CARBON_MINERALIZATION_RAMPARTS'; addMineralPlinth(root, 'I14', 32.8, 7.0, m);
  for (let course = 0; course < 7; course += 1) { const width = 32.0 - course * 0.9; const depth = 6.2 - course * 0.45; box(root, `INORGCHEM__I14__GEOLOGICAL_STRATUM_${course + 1}`, [width, 0.58, depth], m.mineralStrata[course], [0.28 * course, 0.53 + course * 0.55, -0.12 * course], true); for (let blockIndex = 0; blockIndex < 16; blockIndex += 1) pulse(box(root, `INORGCHEM__I14__CODED_MINERAL_BATCH_${course + 1}_${String(blockIndex + 1).padStart(2, '0')}`, [1.35 + (blockIndex % 3) * 0.12, 0.08, 0.06], course % 2 ? m.cyanLight.clone() : m.amberLight.clone(), [-14.8 + blockIndex * 1.93 + course * 0.2, 0.53 + course * 0.55, 3.15 - course * 0.22]), 0.004, course + blockIndex * 0.1, 0.05, 1.5); }
  for (let tower = 0; tower < 3; tower += 1) { const x = -9.5 + tower * 9.5; box(root, `INORGCHEM__I14__RECTANGULAR_DIRECT_AIR_INTAKE_TOWER_${tower + 1}`, [2.0, 6.2, 2.2], m.darkSteel, [x, 3.4, -3.5], true); for (let fin = 0; fin < 12; fin += 1) box(root, `INORGCHEM__I14__SORBENT_FIN_${tower + 1}_${fin + 1}`, [2.4, 0.08, 2.5], m.zirconia, [x, 0.7 + fin * 0.46, -3.5]); }
  box(root, 'INORGCHEM__I14__ROBOTIC_CONSTRUCTION_TRACK', [31.5, 0.22, 0.34], m.steel, [0, 4.7, 3.8]); for (let arm = 0; arm < 7; arm += 1) { const carriage = box(root, `INORGCHEM__I14__ROBOTIC_GANTRY_CARRIAGE_${arm + 1}`, [0.75, 0.45, 0.75], arm % 2 ? m.cyanLight.clone() : m.amberLight.clone(), [-13.5 + arm * 4.5, 4.7, 3.8]); travel(carriage, new THREE.Vector3(-14.8, 4.7, 3.8), new THREE.Vector3(14.8, 4.7, 3.8), 0.004 + arm * 0.0003, arm / 7); pipe(root, `INORGCHEM__I14__ROBOTIC_GANTRY_ARM_${arm + 1}`, new THREE.Vector3(-13.5 + arm * 4.5, 4.5, 3.8), new THREE.Vector3(-13.5 + arm * 4.5, 2.4, 2.2), 0.1, m.darkSteel); }
  return root;
}

function createValenceNexus(m: InorganicMaterials) {
  const root = new THREE.Group(); root.name = 'INORGCHEM__I15__VALENCE_NEXUS_AND_COORDINATION_CROWN'; addMineralPlinth(root, 'I15', 18.0, 18.0, m);
  const sectorMaterials = [m.zirconia, m.cobaltGlass, m.copper, m.basalt]; for (let sector = 0; sector < 4; sector += 1) torus(root, `INORGCHEM__I15__PERIODIC_BLOCK_RING_SECTOR_${['S', 'P', 'D', 'F'][sector]}`, 7.6, 0.72, sectorMaterials[sector], [0, 5.8, 0], [Math.PI / 2, sector * Math.PI / 2, 0], Math.PI / 2, true);
  sphere(root, 'INORGCHEM__I15__SUSPENDED_CENTRAL_ION_SPHERE', [1.7, 1.7, 1.7], m.mirror, [0, 5.2, 0], true);
  for (let ligand = 0; ligand < 8; ligand += 1) { const a = ligand * Math.PI / 4; const base = new THREE.Vector3(Math.sin(a) * 8.1, 0.25, Math.cos(a) * 8.1); const shoulder = new THREE.Vector3(Math.sin(a) * 5.1, 5.8, Math.cos(a) * 5.1); pipe(root, `INORGCHEM__I15__COORDINATION_LIGAND_PYLON_${ligand + 1}`, base, shoulder, 0.48, ligand < 2 ? m.zirconia : ligand < 4 ? m.cobaltGlass : ligand < 6 ? m.copper : m.basalt, true); const bond = pipe(root, `INORGCHEM__I15__ACTIVE_COORDINATION_BOND_${ligand + 1}`, shoulder, new THREE.Vector3(Math.sin(a) * 1.65, 5.2, Math.cos(a) * 1.65), 0.13, ligand % 3 ? m.cyanLight.clone() : m.amberLight.clone()); pulse(bond, 0.009, ligand * 0.66); }
  for (let bridge = 0; bridge < 4; bridge += 1) { const a = bridge * Math.PI / 2; slabBetween(root, `INORGCHEM__I15__PRINCIPAL_ORBITAL_BRIDGE_${bridge + 1}`, new THREE.Vector3(Math.sin(a) * 7.1, 4.65, Math.cos(a) * 7.1), new THREE.Vector3(Math.sin(a) * 1.6, 4.65, Math.cos(a) * 1.6), 0.75, 0.28, m.alumina); pulse(slabBetween(root, `INORGCHEM__I15__OVERLAPPING_ATOMIC_ORBITAL_LIGHT_${bridge + 1}`, new THREE.Vector3(Math.sin(a) * 6.8, 4.47, Math.cos(a) * 6.8), new THREE.Vector3(Math.sin(a) * 1.8, 4.47, Math.cos(a) * 1.8), 0.12, 0.06, bridge % 2 ? m.violetLight.clone() : m.cyanLight.clone()), 0.008, bridge * 0.8); }
  torus(root, 'INORGCHEM__I15__COORDINATION_CROWN_ANTENNA', 8.2, 0.09, m.steel, [0, 7.1, 0]); for (let marker = 0; marker < 18; marker += 1) { const a = marker * Math.PI / 9; box(root, `INORGCHEM__I15__RADIAL_PERIODIC_TABLE_MARKER_${marker + 1}`, [0.42, 0.04, 4.3], marker % 4 ? m.darkSteel : m.titaniumNitride, [Math.sin(a) * 3.0, 0.29, Math.cos(a) * 3.0], false, [0, a, 0]); }
  return root;
}

function assignMetadata(root: THREE.Group, record: InorganicChemistryBuildingProgram) {
  root.userData.exteriorProgram = true; root.userData.inorganicChemistryBuilding = true; root.userData.buildingCode = record.code; root.userData.buildingName = record.name; root.userData.semanticName = record.name; root.userData.purpose = record.purpose; root.userData.footprintMetres = [...record.footprintMetres]; root.userData.heightMetres = record.heightMetres; root.userData.placementZone = record.placementZone; root.userData.exteriorMotif = record.exteriorMotif; root.userData.featureRole = 'building'; root.userData.featureTag = record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'); root.traverse((object) => { object.userData.selectableId = DISTRICT_ID; object.userData.districtId = DISTRICT_ID; }); return root;
}

function createBuilding(record: InorganicChemistryBuildingProgram, m: InorganicMaterials) {
  const factories: Record<InorganicBuildingForm, (materials: InorganicMaterials) => THREE.Group> = { foundry: createFoundry, 'catalyst-spire': createCatalystSpire, 'halide-citadel': createHalideCitadel, 'framework-ark': createFrameworkArk, leafworks: createLeafworks, 'nitrogen-forge': createNitrogenForge, 'f-block-monastery': createMonastery, 'lanthanide-refinery': createRefinery, 'pomo-basilica': createBasilica, 'oxide-terraces': createOxideTerraces, 'diamond-anvil': createDiamondAnvil, 'thermal-keep': createThermalKeep, 'biomineral-conservatory': createBiomineralConservatory, 'mineral-ramparts': createRamparts, 'valence-nexus': createValenceNexus };
  return assignMetadata(factories[record.form](m), record);
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radialMargin = 8.6; const angularMargin = (sector.endAngle - sector.startAngle) * 0.065; const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT); const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT); return new THREE.Vector3(Math.cos(angle) * radius - definition.position[0], y, Math.sin(angle) * radius - definition.position[2]);
}
function districtArc(definition: DistrictDefinition, radialT: number, startT: number, endT: number, segments: number, y = FLOOR_Y) { return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, radialT, THREE.MathUtils.lerp(startT, endT, index / (segments - 1)), y)); }
function districtSpine(definition: DistrictDefinition, angularT: number, startT: number, endT: number, segments: number, y = FLOOR_Y) { return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, THREE.MathUtils.lerp(startT, endT, index / (segments - 1)), angularT, y)); }
function makeRibbonGeometry(points: readonly THREE.Vector3[], width: number) { const vertices: number[] = []; const indices: number[] = []; points.forEach((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5); vertices.push(point.x + normal.x, point.y, point.z + normal.z, point.x - normal.x, point.y, point.z - normal.z); if (index < points.length - 1) { const base = index * 2; indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); } }); const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry; }
function addRibbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, mat: THREE.Material, walkable = true) { const ribbon = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), mat), name); ribbon.userData.walkable = walkable; ribbon.userData.navObstacle = false; ribbon.userData.inorganicChemistryRoute = true; ribbon.receiveShadow = true; parent.add(ribbon); return ribbon; }
function offsetPath(points: readonly THREE.Vector3[], offset: number) { return points.map((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); return point.clone().add(new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(offset)).setY(FLOOR_Y + 0.027); }); }

function addInfrastructure(district: THREE.Group, definition: DistrictDefinition, m: InorganicMaterials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'INORGCHEM__VALENCE_INFRASTRUCTURE'; const valence = districtArc(definition, 0.46, 0.02, 0.98, 112); addRibbon(infrastructure, 'INORGCHEM__VALENCE_AVENUE', valence, 2.0, m.palePaving); const loop = districtArc(definition, 0.95, 0.03, 0.97, 104); addRibbon(infrastructure, 'INORGCHEM__STOICHIOMETRIC_LOOP', loop, 1.55, m.volcanic); const crystalAxis = districtSpine(definition, 0.49, 0.03, 0.97, 72); addRibbon(infrastructure, 'INORGCHEM__CRYSTAL_AXIS', crystalAxis, 1.0, m.palePaving); const fBlock = districtSpine(definition, 0.24, 0.48, 0.99, 48); addRibbon(infrastructure, 'INORGCHEM__F_BLOCK_PASSAGE', fBlock, 1.2, m.darkSteel);
  [-0.42, 0.42].forEach((offset, index) => pulse(addRibbon(infrastructure, `INORGCHEM__VALENCE_AVENUE_LATTICE_EDGE_${index + 1}`, offsetPath(valence, offset), 0.045, index ? m.cyanLight.clone() : m.amberLight.clone(), false), 0.007, index * 1.2));
  [0.13, 0.35, 0.66, 0.86].forEach((angularT, index) => addRibbon(infrastructure, `INORGCHEM__STRUCTURAL_BOND_SERVICE_LINK_${index + 1}`, districtSpine(definition, angularT, 0.04, 0.96, 58), 0.74, index < 2 ? m.palePaving : m.volcanic));
  for (let court = 0; court < 12; court += 1) { const point = pointInDistrict(definition, court % 2 ? 0.38 : 0.58, 0.055 + court * 0.08, FLOOR_Y); cylinder(infrastructure, `INORGCHEM__COORDINATION_POLYHEDRON_COURT_${court + 1}`, 2.0 + court % 3 * 0.3, 0.07, court % 2 ? m.palePaving : m.volcanic, [point.x, 0.08, point.z], false, 6 + court % 3 * 2); for (let node = 0; node < 4; node += 1) pulse(sphere(infrastructure, `INORGCHEM__COURT_LATTICE_NODE_${court + 1}_${node + 1}`, [0.08, 0.08, 0.08], node % 2 ? m.cyanLight.clone() : m.amberLight.clone(), [point.x + Math.sin(node * Math.PI / 2) * 0.7, 0.14, point.z + Math.cos(node * Math.PI / 2) * 0.7]), 0.006, court + node * 0.4); }
  district.add(infrastructure); return { infrastructure, valence };
}

function addLandscape(district: THREE.Group, definition: DistrictDefinition, m: InorganicMaterials) {
  const landscape = new THREE.Group(); landscape.name = 'INORGCHEM__MINERAL_PROCESS_LANDSCAPE'; for (let sample = 0; sample < 36; sample += 1) { const point = pointInDistrict(definition, sample % 2 ? 0.16 : 0.77, 0.025 + Math.floor(sample / 2) * 0.055, FLOOR_Y); taper(landscape, `INORGCHEM__SEALED_MINERAL_SAMPLE_${sample + 1}`, 0.3 + sample % 3 * 0.1, 0.16, 0.55 + sample % 4 * 0.18, m.mineralStrata[sample % m.mineralStrata.length], [point.x, 0.32 + sample % 4 * 0.09, point.z], false, 4 + sample % 5); }
  for (let pylon = 0; pylon < 24; pylon += 1) { const point = pointInDistrict(definition, pylon % 2 ? 0.26 : 0.88, 0.035 + Math.floor(pylon / 2) * 0.085, FLOOR_Y); cylinder(landscape, `INORGCHEM__DISTRICT_GAS_FLOW_PYLON_${pylon + 1}`, 0.08, 0.9 + pylon % 3 * 0.18, m.darkSteel, [point.x, 0.5 + pylon % 3 * 0.09, point.z], false, 12); pulse(sphere(landscape, `INORGCHEM__OXIDATION_STATE_MARKER_${pylon + 1}`, [0.075, 0.075, 0.075], pylon % 3 ? m.cyanLight.clone() : m.amberLight.clone(), [point.x, 1.02 + pylon % 3 * 0.18, point.z]), 0.008, pylon * 0.31); }
  district.add(landscape); return landscape;
}

function batchRepeatedDetails(district: THREE.Group) {
  const roots = [...district.children];
  let batchCount = 0;
  let authoredInstanceCount = 0;
  roots.forEach((batchRoot) => {
    batchRoot.updateWorldMatrix(true, true);
    const rootInverse = batchRoot.matrixWorld.clone().invert();
    const groups = new Map<string, THREE.Mesh[]>();
    const barrierSegments: Array<{ start: [number, number, number]; end: [number, number, number]; radius: number }> = [];
    batchRoot.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh || !object.geometry || object.children.length > 0) return;
      if (object.userData.walkable === true) return;
      if (['inorganic-chemistry-breathe', 'inorganic-chemistry-rotation', 'inorganic-chemistry-travel'].includes(object.userData.animate)) return;
      let ancestor = object.parent;
      while (ancestor && ancestor !== batchRoot) {
        if (ancestor.userData.animate) return;
        ancestor = ancestor.parent;
      }
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (materials.length !== 1 || !materials[0]) return;
      const materialValue = materials[0] as THREE.Material & { color?: THREE.Color; emissive?: THREE.Color; roughness?: number; metalness?: number };
      const materialKey = [materialValue.type, materialValue.name, materialValue.color?.getHexString(), materialValue.emissive?.getHexString(), materialValue.roughness, materialValue.metalness, materialValue.opacity, materialValue.transparent, materialValue.side, materialValue.depthWrite].join(':');
      const animationKey = object.userData.animate === 'inorganic-chemistry-emissive-pulse'
        ? `${object.userData.animate}:${object.userData.speed}:${object.userData.minIntensity}:${object.userData.maxIntensity}`
        : 'static';
      const key = `${object.geometry.uuid}|${materialKey}|${object.castShadow}|${object.receiveShadow}|${object.userData.navObstacle === true}|${animationKey}`;
      const group = groups.get(key) ?? [];
      group.push(object);
      groups.set(key, group);
    });
    let rootBatchIndex = 0;
    groups.forEach((objects) => {
      if (objects.length < 2) return;
      const first = objects[0];
      const instances = new THREE.InstancedMesh(first.geometry, first.material, objects.length);
      rootBatchIndex += 1;
      instances.name = `INORGCHEM__${batchRoot.name.replace(/^INORGCHEM__/, '')}__DETAIL_BATCH_${rootBatchIndex}`;
      instances.castShadow = first.castShadow;
      instances.receiveShadow = first.receiveShadow;
      instances.frustumCulled = false;
      instances.userData = {
        selectableId: DISTRICT_ID,
        districtId: DISTRICT_ID,
        inorganicChemistryDetailBatch: true,
        authoredInstanceCount: objects.length,
        instanceNames: objects.map((object) => object.name),
      };
      if (first.userData.animate === 'inorganic-chemistry-emissive-pulse') {
        instances.userData.animate = first.userData.animate;
        instances.userData.speed = first.userData.speed;
        instances.userData.phase = first.userData.phase;
        instances.userData.minIntensity = first.userData.minIntensity;
        instances.userData.maxIntensity = first.userData.maxIntensity;
        instances.userData.authoredAnimationCount = objects.length;
      }
      objects.forEach((object, index) => {
        object.updateWorldMatrix(true, false);
        const relativeMatrix = rootInverse.clone().multiply(object.matrixWorld);
        instances.setMatrixAt(index, relativeMatrix);
        if (object.userData.navObstacle === true) {
          object.geometry.computeBoundingBox();
          const bounds = object.geometry.boundingBox;
          if (bounds) {
            const center = bounds.getCenter(new THREE.Vector3()).applyMatrix4(relativeMatrix);
            const size = bounds.getSize(new THREE.Vector3());
            const axes = [
              new THREE.Vector3().setFromMatrixColumn(relativeMatrix, 0).multiplyScalar(size.x),
              new THREE.Vector3().setFromMatrixColumn(relativeMatrix, 1).multiplyScalar(size.y),
              new THREE.Vector3().setFromMatrixColumn(relativeMatrix, 2).multiplyScalar(size.z),
            ].map((axis) => ({ axis, horizontal: Math.hypot(axis.x, axis.z) })).sort((left, right) => right.horizontal - left.horizontal);
            const longest = axes[0];
            const second = axes[1];
            const direction = longest.axis.clone().setY(0).normalize();
            const elongated = longest.horizontal > Math.max(0.001, second.horizontal) * 1.45;
            const halfLength = elongated ? Math.max(0, longest.horizontal * 0.5 - second.horizontal * 0.5) : 0;
            const radius = Math.max(0.06, (elongated ? second.horizontal : longest.horizontal) * 0.5);
            const corners = [];
            for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) corners.push(new THREE.Vector3(x, y, z).applyMatrix4(relativeMatrix));
            const minY = Math.min(...corners.map((corner) => corner.y));
            const maxY = Math.max(...corners.map((corner) => corner.y));
            const start = center.clone().addScaledVector(direction, -halfLength); start.y = minY + radius;
            const end = center.clone().addScaledVector(direction, halfLength); end.y = maxY - radius;
            barrierSegments.push({ start: start.toArray(), end: end.toArray(), radius });
          }
        }
      });
      instances.instanceMatrix.needsUpdate = true;
      objects.forEach((object) => object.removeFromParent());
      batchRoot.add(instances);
      batchCount += 1;
      authoredInstanceCount += objects.length;
    });
    if (barrierSegments.length > 0) {
      const collision = new THREE.Group();
      collision.name = `INORGCHEM__${batchRoot.name.replace(/^INORGCHEM__/, '')}__BATCHED_COLLISION`;
      collision.userData = { selectableId: DISTRICT_ID, districtId: DISTRICT_ID, navBarrierSegments: barrierSegments, inorganicChemistryBatchedCollision: true };
      batchRoot.add(collision);
    }
  });
  district.userData.inorganicChemistryBatching = { batchCount, authoredInstanceCount };
}

export function buildInorganicChemistryLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Inorganic Chemistry Labs District requires a masterplan sector'); const materials = createMaterials(); const { infrastructure, valence } = addInfrastructure(district, definition, materials); const landscape = addLandscape(district, definition, materials);
  const facilities = INORGANIC_CHEMISTRY_BUILDING_PROGRAM.map((record) => { const building = createBuilding(record, materials); const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02); building.position.copy(position); const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z); building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT }; district.add(building); return building; });
  facilities.forEach((facility, index) => { const record = INORGANIC_CHEMISTRY_BUILDING_PROGRAM[index]; const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, record.footprintMetres[1] / 20 + 0.8); const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position); const routePoint = valence.reduce((closest, point) => point.distanceToSquared(entrance) < closest.distanceToSquared(entrance) ? point : closest, valence[0]); const approach = [routePoint.clone(), routePoint.clone().lerp(entrance, 0.5), entrance]; const approachRoad = addRibbon(infrastructure, `INORGCHEM__BUILDING_APPROACH_${record.code}`, approach, 0.76, index === 4 || index === 8 || index === 12 || index === 14 ? materials.palePaving : materials.volcanic); const statusMaterial = index < 5 ? materials.cyanLight.clone() : index < 10 ? materials.violetLight.clone() : materials.amberLight.clone(); const status = prepare(new THREE.Mesh(approachRoad.geometry, statusMaterial), `INORGCHEM__BUILDING_APPROACH_STATUS_${record.code}`); status.position.y = 0.015; infrastructure.add(status); pulse(status, 0.009, index * 0.41); });
  batchRepeatedDetails(district);
  district.userData.inorganicChemistryLabsDistrict = { identity: 'Inorganic Chemistry Labs District', mapLabel: 'Anorg Chem District', architecturalLanguage: 'crystal lattices, coordination polyhedra, pressure vessels, ceramic fortresses, exposed elemental strata, controlled oxidation, vitrification, metallic grain, and salt-like translucency', buildingCount: facilities.length, buildings: INORGANIC_CHEMISTRY_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, purpose: record.purpose, placementZone: record.placementZone, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorMotif: record.exteriorMotif })), interfaces: { organicChemistry: ['The Monatomic Catalyst Spire', 'The Biomineral Hybrid Conservatory'], particlePhysics: ['The F-Block Containment Monastery', 'The Megabar Diamond-Anvil Tower'], desertDome: ['The Breathing Framework Ark', 'The Solar-Fuels Leafworks', 'The Carbon Mineralization Ramparts'] }, circulation: { publicBoulevard: 'INORGCHEM__VALENCE_AVENUE', heavyServiceLoop: 'INORGCHEM__STOICHIOMETRIC_LOOP', pedestrianSpine: 'INORGCHEM__CRYSTAL_AXIS', restrictedRoute: 'INORGCHEM__F_BLOCK_PASSAGE', structuralServiceLinks: 4, exactBuildingApproaches: 15 }, signatureSystems: { crystalSystemWings: 7, activeCentreSpheres: 1, desiccantTowers: 6, atmosphericGillTowers: 6, mineralLeaves: 5, mechanochemicalDrums: 3, containmentWalls: 5, rareEarthTowers: 17, clusterChapels: 12, epitaxialSlabs: 6, calibratedPressureRings: 13, thermalStacks: 6, mineralStrata: 7, ligandPylons: 8 }, lightingLanguage: 'selective lattice nodes, oxidation-state markings, structural bonds, pressure rings, gas-flow channels, and crystal edges only', exteriorOnly: true };
  district.userData.population = { plannedFacilities: INORGANIC_CHEMISTRY_BUILDING_PROGRAM.map((record) => record.name), plannedObjects: ['Valence Avenue', 'Stoichiometric Loop', 'Crystal Axis', 'F-Block Passage', 'Coordination Polyhedron Courts', 'Sealed Mineral Samples', 'Gas-Flow Pylons'], realizedFeatureTags: INORGANIC_CHEMISTRY_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')), realizedFacilityCount: facilities.length, realizedObjectCount: infrastructure.children.length + landscape.children.length, distinct: true, asymmetricCampus: true, localRoadCount: 23, radialCoverage: 0.95, angularCoverage: 0.97, exteriorOnly: true, mineralLatticeDistrict: true };
}
