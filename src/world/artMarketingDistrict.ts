import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { DistrictDefinition } from '../data/districts';

type ArtMarketingSide = 'scientific-art' | 'marketing';
type ArtMarketingBuildingForm =
  | 'parallax'
  | 'morphogenesis'
  | 'chromaflux'
  | 'resonance'
  | 'lumen'
  | 'atlas'
  | 'archive'
  | 'null-field'
  | 'signal-house'
  | 'launch-array'
  | 'narrative-engine'
  | 'audience-dynamics'
  | 'identity-works'
  | 'beacon-exchange'
  | 'evidence-commons';

export interface ArtMarketingBuildingProgram {
  code: string;
  name: string;
  subtitle: string;
  purpose: string;
  side: ArtMarketingSide;
  form: ArtMarketingBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorSignature: string;
}

export const SCIENTIFIC_ART_BUILDING_PROGRAM: readonly ArtMarketingBuildingProgram[] = [
  { code: 'SA1', name: 'The Parallax Institute for Scientific Visualization', subtitle: 'Principal Scientific Art Landmark', purpose: 'Scientific visualization, data sculpture, immersive representation, and abstract public interpretation', side: 'scientific-art', form: 'parallax', footprintMetres: [184, 116], heightMetres: 72, radialT: 0.12, angularT: 0.06, placementZone: 'Inner laboratory-facing crescent', exteriorSignature: 'a sheared crescent of smoked glass, rotating dichroic fins, spectrometer roof vanes, and a gravitational-lensing coordinate forecourt' },
  { code: 'SA2', name: 'The Morphogenesis Fabrication Hall', subtitle: 'Algorithmic Sculpture and Robotic Construction', purpose: 'Algorithmic sculpture, computational craft, generative architecture, and large-scale scientific art fabrication', side: 'scientific-art', form: 'morphogenesis', footprintMetres: [196, 128], heightMetres: 48, radialT: 0.38, angularT: 0.17, placementZone: 'Fabrication and service edge', exteriorSignature: 'an asymmetrical ceramic shell with branching structural ribs, rail-borne maintenance robots, reaction-diffusion screens, and a changing fabrication yard' },
  { code: 'SA3', name: 'The Chromaflux Bioart Conservatory', subtitle: 'Living Display Infrastructure', purpose: 'Bioart, living pigments, photobioreactors, contained microbial displays, and wetland interpretation', side: 'scientific-art', form: 'chromaflux', footprintMetres: [172, 132], heightMetres: 44, radialT: 0.12, angularT: 0.32, placementZone: 'Inward wetland court', exteriorSignature: 'seven unequal greenhouse pods, visible biological service modules, pivoting leaf shades, and a bridged wetland channel' },
  { code: 'SA4', name: 'The Resonance Foundry', subtitle: 'Sonification and Experimental Acoustics', purpose: 'Scientific sonification, psychoacoustics, instrument design, auditory data representation, and sound installation art', side: 'scientific-art', form: 'resonance', footprintMetres: [156, 126], heightMetres: 62, radialT: 0.38, angularT: 0.43, placementZone: 'Acoustically shielded fabrication belt', exteriorSignature: 'five offset acoustic volumes, projecting silver baffles, monumental wind instruments, whisper dishes, and a suspended frequency ring' },
  { code: 'SA5', name: 'The Lumen Observatory for Photonic Art', subtitle: 'Photonics Translation Institute', purpose: 'Photonic art, controlled daylight instruments, spectral projection, and atmospheric visual media', side: 'scientific-art', form: 'lumen', footprintMetres: [162, 116], heightMetres: 112, radialT: 0.12, angularT: 0.54, placementZone: 'Electronics-facing photonic boundary', exteriorSignature: 'a matte ceramic research bar crossed by a prism tower, rotating mirrored shutters, public heliostats, and dark-sky directional beams' },
  { code: 'SA6', name: 'The Atlas of Invisible Worlds', subtitle: 'Microscopy and Imaging Gallery', purpose: 'Microscopy, medical imaging, nanoscale landscapes, molecular visualization, and scanning arts', side: 'scientific-art', form: 'atlas', footprintMetres: [168, 122], heightMetres: 78, radialT: 0.38, angularT: 0.71, placementZone: 'Central specimen plaza', exteriorSignature: 'six displaced microscope-slide volumes, relief specimen panels, objective-lens apertures, a pin-shadow data screen, and an enlarged nanoscale landscape' },
  { code: 'SA7', name: 'The Archive of Future Materials', subtitle: 'Conservation and Exposure Archive', purpose: 'Scientific art conservation, experimental pigments, responsive textiles, smart coatings, and technological preservation', side: 'scientific-art', form: 'archive', footprintMetres: [176, 124], heightMetres: 54, radialT: 0.13, angularT: 0.83, placementZone: 'Durable inner archive edge', exteriorSignature: 'a severe geopolymer monolith, permanent material exposure strips, graded titanium mesh, north-light sawteeth, and sparse mineral gardens' },
  { code: 'SA8', name: 'The Null Field Gallery', subtitle: 'Simulation, Silence and Perception Limits', purpose: 'Simulation, cosmology, artificial realities, darkness, silence, and mathematical abstraction', side: 'scientific-art', form: 'null-field', footprintMetres: [158, 112], heightMetres: 38, radialT: 0.28, angularT: 0.94, placementZone: 'Secret-ring interface', exteriorSignature: 'a partially buried nonreflective black monolith, one continuous datum line, a narrowing void entrance, still reflecting water, and near-total night disappearance' },
] as const;

export const MARKETING_BUILDING_PROGRAM: readonly ArtMarketingBuildingProgram[] = [
  { code: 'M1', name: 'Signal House', subtitle: 'Strategy and Institutional Identity', purpose: 'Institutional identity, public campaigns, scientific communication, partnerships, recruitment, and visitor orientation', side: 'marketing', form: 'signal-house', footprintMetres: [172, 112], heightMetres: 104, radialT: 0.85, angularT: 0.06, placementZone: 'Public northern gateway', exteriorSignature: 'a tapered waveform slab, encoded ceramic fins, integrated identity bands, a radial wayfinding plaza, and a rotating communications mast' },
  { code: 'M2', name: 'The Launch Array', subtitle: 'Announcements and Public Demonstrations', purpose: 'Research announcements, prototype unveilings, institutional ceremonies, media events, and public briefings', side: 'marketing', form: 'launch-array', footprintMetres: [188, 142], heightMetres: 46, radialT: 0.85, angularT: 0.23, placementZone: 'Outer ceremonial event field', exteriorSignature: 'a shallow circular dish, rotating aluminum ring panels, eight radial canopies, a retractable luminous membrane, and launch-site camera masts' },
  { code: 'M3', name: 'The Narrative Engine Media Foundry', subtitle: 'Scientific Media Production', purpose: 'Scientific filmmaking, documentary production, animation, research journalism, public explainers, and synthetic capture', side: 'marketing', form: 'narrative-engine', footprintMetres: [182, 128], heightMetres: 86, radialT: 0.85, angularT: 0.37, placementZone: 'Production-facing central belt', exteriorSignature: 'stacked black production boxes around a translucent lantern, exposed camera gantries, a calibration wall, and a stepped media square' },
  { code: 'M4', name: 'The Audience Dynamics Observatory', subtitle: 'Perception and Trust Research', purpose: 'Research into how scientific information is perceived, trusted, rejected, misunderstood, and shared', side: 'marketing', form: 'audience-dynamics', footprintMetres: [184, 136], heightMetres: 58, radialT: 0.85, angularT: 0.50, placementZone: 'Instrumented elliptical plaza', exteriorSignature: 'two observing crescent buildings, responsive electrochromic cells, explicit sensor masts, pressure-lit water bridges, and interference fins' },
  { code: 'M5', name: 'The Prototype Identity Works', subtitle: 'Physical Campaign and Exhibition Systems', purpose: 'Exhibition structures, signage, packaging, product identities, demonstration kits, and limited-edition fabrication', side: 'marketing', form: 'identity-works', footprintMetres: [190, 126], heightMetres: 54, radialT: 0.85, angularT: 0.63, placementZone: 'Flexible materials catalogue edge', exteriorSignature: 'a sawtooth industrial hall with replaceable three-storey material panels, prototype towers, and a screened modular fabrication yard' },
  { code: 'M6', name: 'The Beacon Exchange Tower', subtitle: 'Global Scientific Communications', purpose: 'International media coordination, multilingual deployment, institutional partnerships, event synchronization, and external research networks', side: 'marketing', form: 'beacon-exchange', footprintMetres: [146, 122], heightMetres: 172, radialT: 0.85, angularT: 0.76, placementZone: 'Western orientation landmark', exteriorSignature: 'a pale central shaft wrapped by five offset perforated rings, a directional media membrane, seven radial paths, and a slow-pulse communications mast' },
  { code: 'M7', name: 'The Evidence Commons', subtitle: 'Public Verification and Correction Hall', purpose: 'Public scientific dialogue, claim verification, research transparency, correction notices, campaign ethics, and open data', side: 'marketing', form: 'evidence-commons', footprintMetres: [192, 132], heightMetres: 52, radialT: 0.85, angularT: 0.89, placementZone: 'Civic public-facing terminus', exteriorSignature: 'a calm raised civic hall, stacked evidence columns, provenance bands, a decision-tree canopy, stepped debate plaza, and the Correction Bell' },
] as const;

const SCIENTIFIC_ART_ID = 'scientific-art-labs';
const MARKETING_ID = 'marketing';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 16, 10);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_Z = new THREE.Vector3(0, 0, 1);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

function material(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  const value = new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.18, ...options });
  value.name = name;
  return value;
}

function createMaterials() {
  const blackTitanium = material('Art Marketing black titanium', '#11171b', { roughness: 0.3, metalness: 0.88 });
  const matteBlack = material('Art Marketing nonreflective black ceramic', '#07090a', { roughness: 0.94, metalness: 0.08 });
  const basalt = material('Art Marketing rough volcanic basalt', '#24282a', { roughness: 1, metalness: 0.02 });
  const lowIronGlass = material('Art Marketing smoked low-iron glass', '#65848e', { roughness: 0.08, metalness: 0.26, transparent: true, opacity: 0.68, depthWrite: true, emissive: '#122d35', emissiveIntensity: 0.1 });
  const pearl = material('Art Marketing pearlescent ceramic', '#dedbd4', { roughness: 0.38, metalness: 0.13, emissive: '#25202a', emissiveIntensity: 0.05 });
  const paleStone = material('Art Marketing pale geopolymer stone', '#bcbcb3', { roughness: 0.9, metalness: 0.03 });
  const aluminum = material('Art Marketing brushed aluminum', '#aeb6b8', { roughness: 0.3, metalness: 0.9 });
  const titaniumMesh = material('Art Marketing perforated titanium mesh', '#6d7679', { roughness: 0.46, metalness: 0.82, side: THREE.DoubleSide });
  const photovoltaic = material('Art Marketing translucent photovoltaic glass', '#18323d', { roughness: 0.2, metalness: 0.58, transparent: true, opacity: 0.82, depthWrite: true });
  const dichroic = material('Art Marketing dichroic interference film', '#7597a5', { roughness: 0.12, metalness: 0.74, emissive: '#283f63', emissiveIntensity: 0.25 });
  const bioGreen = material('Chromaflux living green photobioreactor', '#2f6a52', { roughness: 0.22, metalness: 0.06, emissive: '#143d28', emissiveIntensity: 0.32, transparent: true, opacity: 0.82, depthWrite: true });
  const bioAmber = material('Chromaflux living amber photobioreactor', '#9b6d36', { roughness: 0.22, emissive: '#4f2c0d', emissiveIntensity: 0.36, transparent: true, opacity: 0.82, depthWrite: true });
  const bioViolet = material('Chromaflux living violet photobioreactor', '#664669', { roughness: 0.22, emissive: '#35193c', emissiveIntensity: 0.38, transparent: true, opacity: 0.82, depthWrite: true });
  const oxide = material('Art Marketing controlled oxide material', '#7e4436', { roughness: 0.78, metalness: 0.24 });
  const moss = material('Art Marketing dark living substrate', '#415648', { roughness: 0.98, metalness: 0 });
  const water = material('Art Marketing black reflecting water', '#0a2630', { roughness: 0.06, metalness: 0.32, transparent: true, opacity: 0.76, depthWrite: true });
  const whiteLight = material('Art Marketing narrow neutral light', '#f6ffff', { roughness: 0.08, emissive: '#b7f4ff', emissiveIntensity: 2.6 });
  const cyanLight = material('Art Marketing spectral cyan light', '#b9f8ff', { roughness: 0.08, emissive: '#37cde1', emissiveIntensity: 2.8 });
  const violetLight = material('Art Marketing spectral violet light', '#eadfff', { roughness: 0.08, emissive: '#875ed1', emissiveIntensity: 2.5 });
  const amberLight = material('Art Marketing measured amber light', '#ffe0a6', { roughness: 0.1, emissive: '#d77b20', emissiveIntensity: 2.3 });
  [whiteLight, cyanLight, violetLight, amberLight].forEach((value) => { value.userData.isDistrictAccent = true; });
  return { blackTitanium, matteBlack, basalt, lowIronGlass, pearl, paleStone, aluminum, titaniumMesh, photovoltaic, dichroic, bioGreen, bioAmber, bioViolet, oxide, moss, water, whiteLight, cyanLight, violetLight, amberLight };
}

type Materials = ReturnType<typeof createMaterials>;

function districtIdFromName(name: string) {
  return name.startsWith('ARTMARK__M') ? MARKETING_ID : SCIENTIFIC_ART_ID;
}

function prepare<T extends THREE.Object3D>(object: T, name: string, obstacle = false, districtId = districtIdFromName(name)) {
  object.name = name;
  object.userData.selectableId = districtId;
  object.userData.districtId = districtId;
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
  const geometry = segments === 8 ? UNIT_CYLINDER_8 : segments === 12 ? UNIT_CYLINDER_12 : UNIT_CYLINDER_24;
  const value = prepare(new THREE.Mesh(geometry, mat), name, obstacle);
  value.scale.set(diameter, height, diameter); value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function taper(parent: THREE.Object3D, name: string, bottomDiameter: number, topDiameter: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 12, rotation: readonly [number, number, number] = [0, 0, 0]) {
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

function pulse<T extends THREE.Object3D>(object: T, speed: number, phase = 0, minIntensity = 0.06, maxIntensity = 2.5) {
  object.userData.animate = 'art-marketing-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate<T extends THREE.Object3D>(object: T, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'art-marketing-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function arcSegments(parent: THREE.Object3D, prefix: string, radiusX: number, radiusZ: number, y: number, height: number, depth: number, count: number, start: number, arc: number, mat: THREE.Material, obstacle = false) {
  for (let index = 0; index < count; index += 1) {
    const a0 = start + arc * index / count; const a1 = start + arc * (index + 1) / count; const angle = (a0 + a1) * 0.5;
    const x = Math.cos(angle) * radiusX; const z = Math.sin(angle) * radiusZ; const tangentX = -Math.sin(angle) * radiusX; const tangentZ = Math.cos(angle) * radiusZ;
    const length = Math.hypot(tangentX, tangentZ) * Math.abs(arc) / count * 1.06; const rotationY = -Math.atan2(tangentZ, tangentX);
    box(parent, `${prefix}_${index + 1}`, [length, height, depth], mat, [x, y + height * 0.5, z], obstacle, [0, rotationY, 0]);
  }
}

function createParallax(m: Materials) {
  const root = new THREE.Group(); root.name = 'ARTMARK__SA1__PARALLAX_INSTITUTE';
  for (let segment = 0; segment < 18; segment += 1) {
    const t = segment / 17; const angle = -1.12 + t * 2.24; const x = Math.sin(angle) * 7.7 + (t - 0.5) * 2.4; const z = Math.cos(angle) * 2.2;
    box(root, `ARTMARK__SA1__SHEARED_CRESCENT_FLOOR_${segment + 1}`, [1.05, 4.6 + t * 2.3, 5.2], segment % 4 === 0 ? m.aluminum : m.lowIronGlass, [x, 2.3 + t * 1.15, z], true, [0, -angle * 0.32, (t - 0.5) * 0.035]);
  }
  for (let fin = 0; fin < 72; fin += 1) {
    const t = fin / 71; const x = -8.6 + t * 17.2; const z = 2.72 - Math.cos((t - 0.5) * Math.PI) * 0.58;
    const value = box(root, `ARTMARK__SA1__ROTATING_DICHROIC_VERTICAL_FIN_${fin + 1}`, [0.07, 4.2 + t * 2.2, 0.46], fin % 3 ? m.dichroic : m.violetLight, [x, 2.45 + t * 1.1, z], false, [0, (fin % 9 - 4) * 0.045, 0]);
    if (fin % 18 === 0) rotate(value, 0.0012 + fin * 0.000002);
  }
  for (let vane = 0; vane < 5; vane += 1) box(root, `ARTMARK__SA1__SPECTROMETER_OPTICAL_ROOF_VANE_${vane + 1}`, [2.7, 0.18, 4.8], vane % 2 ? m.photovoltaic : m.aluminum, [-5.4 + vane * 2.7, 7.2 + vane * 0.26, -0.2], true, [0.08, -0.14 + vane * 0.07, -0.05]);
  for (let grid = 0; grid < 14; grid += 1) pipe(root, `ARTMARK__SA1__GRAVITATIONAL_LENSING_GRID_${grid + 1}`, new THREE.Vector3(-8 + grid * 1.22, 0.05, 4.0 - Math.sin(grid * 0.55) * 0.5), new THREE.Vector3(-8 + grid * 1.22, 0.05, 7.1 + Math.cos(grid * 0.4) * 0.45), 0.035, m.aluminum);
  for (let bench = 0; bench < 5; bench += 1) box(root, `ARTMARK__SA1__GRAPH_FRAGMENT_BENCH_${bench + 1}`, [2.1 + bench * 0.18, 0.42, 0.62], m.paleStone, [-6.2 + bench * 3.1, 0.24, 6.35 - Math.sin(bench) * 0.45], true, [0, (bench - 2) * 0.12, 0]);
  return root;
}

function createMorphogenesis(m: Materials) {
  const root = new THREE.Group(); root.name = 'ARTMARK__SA2__MORPHOGENESIS_FABRICATION_HALL';
  box(root, 'ARTMARK__SA2__LOW_FABRICATION_HALL', [18.2, 3.8, 9.6], m.paleStone, [0, 1.9, 0], true);
  for (let panel = 0; panel < 32; panel += 1) {
    const x = -8.7 + panel % 8 * 2.48; const row = Math.floor(panel / 8); const z = -4.6 + row * 3.06;
    box(root, `ARTMARK__SA2__OPTIMIZED_CERAMIC_SHELL_PANEL_${panel + 1}`, [2.34, 0.22, 2.88], panel % 5 === 0 ? m.dichroic : m.pearl, [x, 4.08 + Math.sin(panel * 0.7) * 0.55, z], true, [0.03 * Math.sin(panel), 0.02 * Math.cos(panel), 0.05 * Math.sin(panel * 0.4)]);
  }
  for (let rib = 0; rib < 12; rib += 1) {
    const x = -8.7 + rib * 1.58; pipe(root, `ARTMARK__SA2__BRANCHING_BIOMIMETIC_RIB_${rib + 1}`, new THREE.Vector3(x, 0.1, -5.0), new THREE.Vector3(x + Math.sin(rib) * 1.1, 5.0 + Math.sin(rib * 0.4), 4.9), 0.16, m.blackTitanium, true);
    if (rib % 3 === 0) rotate(box(root, `ARTMARK__SA2__RAIL_MAINTENANCE_ROBOT_${rib / 3 + 1}`, [0.72, 0.46, 0.5], m.aluminum, [x, 4.8, -0.4]), 0.003);
  }
  for (let screen = 0; screen < 18; screen += 1) box(root, `ARTMARK__SA2__REACTION_DIFFUSION_SCREEN_${screen + 1}`, [0.5 + screen % 3 * 0.22, 2.5 + screen % 4 * 0.4, 0.12], screen % 2 ? m.titaniumMesh : m.blackTitanium, [-8.8 + screen * 1.02, 1.5, 4.92], false, [0, 0, (screen % 3 - 1) * 0.09]);
  for (let artifact = 0; artifact < 10; artifact += 1) {
    const x = -8.0 + artifact * 1.7; const z = 6.0 + (artifact % 3) * 0.9;
    if (artifact % 2) torus(root, `ARTMARK__SA2__UNFINISHED_GENERATIVE_SCULPTURE_${artifact + 1}`, 0.58 + artifact % 3 * 0.16, 0.11, m.oxide, [x, 0.72, z], [Math.PI / 2, artifact * 0.2, 0]);
    else taper(root, `ARTMARK__SA2__PRINTED_BRIDGE_FRAGMENT_${artifact + 1}`, 1.1, 0.38, 1.2 + artifact % 3 * 0.35, m.pearl, [x, 0.65, z], true, 8, [0, artifact * 0.21, Math.PI / 2]);
  }
  return root;
}

function createChromaflux(m: Materials) {
  const root = new THREE.Group(); root.name = 'ARTMARK__SA3__CHROMAFLUX_BIOART_CONSERVATORY';
  const pods = [
    [-5.7, -1.7, 4.8, 3.2, 3.9], [-2.8, 1.2, 3.7, 4.0, 3.4], [0.2, -1.0, 4.2, 3.1, 4.8], [3.2, 1.4, 3.5, 4.5, 3.1], [5.8, -1.2, 4.1, 3.0, 4.0], [-3.9, -4.1, 3.1, 2.8, 3.5], [3.8, -4.0, 3.3, 2.6, 4.2],
  ] as const;
  const bio = [m.bioGreen, m.bioAmber, m.bioViolet];
  pods.forEach(([x, z, sx, sy, sz], index) => {
    sphere(root, `ARTMARK__SA3__CONNECTED_GREENHOUSE_POD_${index + 1}`, [sx, sy, sz], index % 2 ? m.lowIronGlass : m.photovoltaic, [x, sy * 0.52, z], true);
    for (let tubeIndex = 0; tubeIndex < 7; tubeIndex += 1) cylinder(root, `ARTMARK__SA3__VISIBLE_PHOTOBIOREACTOR_${index + 1}_${tubeIndex + 1}`, 0.26, 2.2 + tubeIndex % 3 * 0.4, bio[(index + tubeIndex) % bio.length], [x - 1.25 + tubeIndex * 0.42, 1.25, z + sz * 0.48], false, 12);
    const leaf = box(root, `ARTMARK__SA3__PIVOTING_TRANSLUCENT_LEAF_SHADE_${index + 1}`, [sx * 1.12, 0.12, sz * 0.72], m.pearl, [x, sy + 0.55, z], false, [0.08, index * 0.38, 0.12]);
    if (index === 2) rotate(leaf, 0.0015, 'z');
  });
  torus(root, 'ARTMARK__SA3__CIRCULAR_WETLAND_WATER_CHANNEL', 9.2, 0.52, m.water, [0, 0.06, 0], [Math.PI / 2, 0, 0], Math.PI * 2, false, 8, 64);
  for (let bridge = 0; bridge < 4; bridge += 1) {
    const angle = bridge * Math.PI / 2 + 0.35; const start = new THREE.Vector3(Math.cos(angle) * 7.8, 0.18, Math.sin(angle) * 7.8); const end = new THREE.Vector3(Math.cos(angle) * 10.5, 0.18, Math.sin(angle) * 10.5);
    slabBetween(root, `ARTMARK__SA3__SLENDER_WETLAND_BRIDGE_${bridge + 1}`, start, end, 0.75, 0.14, m.aluminum, false);
    for (let lens = 0; lens < 3; lens += 1) torus(root, `ARTMARK__SA3__HANDRAIL_MAGNIFYING_LENS_${bridge + 1}_${lens + 1}`, 0.18, 0.035, m.lowIronGlass, [THREE.MathUtils.lerp(start.x, end.x, (lens + 1) / 4), 0.78, THREE.MathUtils.lerp(start.z, end.z, (lens + 1) / 4)], [0, angle, 0]);
  }
  return root;
}

function createResonance(m: Materials) {
  const root = new THREE.Group(); root.name = 'ARTMARK__SA4__RESONANCE_FOUNDRY';
  const volumes = [[-5.2, -1.2, 5.2, 5.4], [-2.2, 1.7, 4.4, 7.2], [1.0, -1.1, 5.8, 6.2], [4.3, 1.5, 4.2, 5.0], [6.0, -2.8, 3.4, 4.4]] as const;
  volumes.forEach(([x, z, diameter, height], index) => {
    taper(root, `ARTMARK__SA4__OFFSET_ACOUSTIC_VOLUME_${index + 1}`, diameter, diameter * (0.72 + index % 2 * 0.24), height, index % 2 ? m.blackTitanium : m.basalt, [x, height * 0.5, z], true, 24, [0, 0, index % 2 ? 0.04 : -0.03]);
    for (let baffle = 0; baffle < 7; baffle += 1) box(root, `ARTMARK__SA4__SILVER_ACOUSTIC_BAFFLE_${index + 1}_${baffle + 1}`, [0.18, 1.3 + baffle * 0.16, 1.1], m.aluminum, [x - diameter * 0.52, 1.0 + baffle * 0.62, z - 1.8 + baffle * 0.58], false, [0, (baffle - 3) * 0.13, (index - 2) * 0.03]);
  });
  for (let instrument = 0; instrument < 9; instrument += 1) {
    const x = -7.4 + instrument * 1.85; pipe(root, `ARTMARK__SA4__MONUMENTAL_WIND_INSTRUMENT_${instrument + 1}`, new THREE.Vector3(x, 6.4 + instrument % 3 * 0.4, -2.8), new THREE.Vector3(x + Math.sin(instrument) * 1.0, 8.2 + instrument % 4, 2.8), 0.08 + instrument % 2 * 0.035, instrument % 3 ? m.aluminum : m.dichroic);
  }
  for (let dish = 0; dish < 8; dish += 1) torus(root, `ARTMARK__SA4__FLUSH_WHISPER_DISH_${dish + 1}`, 0.85, 0.12, m.matteBlack, [-7.2 + dish * 2.0, 0.08, 6.0 + Math.sin(dish) * 0.6], [Math.PI / 2, 0, 0], Math.PI * 2, false, 8, 28);
  pulse(torus(root, 'ARTMARK__SA4__SUSPENDED_FREQUENCY_ENTRANCE_RING', 2.2, 0.16, m.whiteLight.clone(), [0, 3.2, 5.25], [0, 0, 0]), 0.002, 0.4, 0.04, 1.4);
  return root;
}

function createLumen(m: Materials) {
  const root = new THREE.Group(); root.name = 'ARTMARK__SA5__LUMEN_OBSERVATORY';
  roundedBox(root, 'ARTMARK__SA5__MATTE_CERAMIC_RESEARCH_BLOCK', [16.2, 3.5, 8.4], 0.5, m.pearl, [0, 1.75, 0], true);
  for (let mark = 0; mark < 18; mark += 1) box(root, `ARTMARK__SA5__PHOTOVOLTAIC_MEASUREMENT_STRIP_${mark + 1}`, [0.2, 2.8, 0.1], m.photovoltaic, [-7.7 + mark * 0.9, 1.8, 4.23]);
  taper(root, 'ARTMARK__SA5__UPRIGHT_OPTICAL_PRISM_TOWER', 4.6, 2.3, 11.2, m.lowIronGlass, [1.8, 5.6, -0.2], true, 6, [0, 0.15, 0]);
  for (let shutter = 0; shutter < 30; shutter += 1) {
    const level = Math.floor(shutter / 6); const angle = shutter % 6 / 6 * Math.PI * 2;
    const value = box(root, `ARTMARK__SA5__ROTATING_MIRRORED_SHUTTER_${shutter + 1}`, [1.15, 0.14, 0.46], m.aluminum, [1.8 + Math.cos(angle) * (1.45 + level * 0.05), 2.2 + level * 1.75, -0.2 + Math.sin(angle) * (1.45 + level * 0.05)], false, [0.1, -angle, 0.08]);
    if (shutter === 11) rotate(value, 0.0018, 'z');
  }
  for (let heliostat = 0; heliostat < 20; heliostat += 1) {
    const row = Math.floor(heliostat / 5); const x = -9.2 + (heliostat % 5) * 2.1; const z = 5.3 + row * 1.3;
    cylinder(root, `ARTMARK__SA5__PUBLIC_HELIOSTAT_STEM_${heliostat + 1}`, 0.16, 1.2, m.blackTitanium, [x, 0.6, z], false, 8);
    box(root, `ARTMARK__SA5__PUBLIC_HELIOSTAT_MIRROR_${heliostat + 1}`, [1.1, 0.08, 0.72], m.aluminum, [x, 1.25, z], false, [-0.38 + row * 0.08, heliostat * 0.19, 0]);
  }
  for (let aperture = 0; aperture < 7; aperture += 1) torus(root, `ARTMARK__SA5__ROOF_DIFFRACTION_APERTURE_${aperture + 1}`, 0.45 + aperture % 3 * 0.16, 0.08, aperture % 2 ? m.matteBlack : m.dichroic, [-6.8 + aperture * 2.0, 3.62, -2.8 + aperture % 2 * 1.8], [Math.PI / 2, 0, 0]);
  return root;
}

function createAtlas(m: Materials) {
  const root = new THREE.Group(); root.name = 'ARTMARK__SA6__ATLAS_OF_INVISIBLE_WORLDS';
  for (let slide = 0; slide < 6; slide += 1) {
    const x = (slide - 2.5) * 0.62; const z = (slide % 2 ? -0.45 : 0.45) * slide;
    roundedBox(root, `ARTMARK__SA6__DISPLACED_MICROSCOPE_SLIDE_${slide + 1}`, [15.2 - slide * 0.45, 0.78, 8.2], 0.24, slide % 2 ? m.pearl : m.lowIronGlass, [x, 0.75 + slide * 1.15, z], true, [0, (slide - 2.5) * 0.026, 0]);
  }
  for (let relief = 0; relief < 72; relief += 1) {
    const col = relief % 18; const row = Math.floor(relief / 18);
    const shape = relief % 3 === 0 ? UNIT_SPHERE : relief % 3 === 1 ? UNIT_CYLINDER_8 : UNIT_BOX;
    const value = prepare(new THREE.Mesh(shape, relief % 7 === 0 ? m.dichroic : m.paleStone), `ARTMARK__SA6__MICROSCOPIC_RELIEF_SAMPLE_${relief + 1}`);
    value.position.set(-7.15 + col * 0.84, 1.15 + row * 1.28, 4.14 + row * 0.08); value.scale.set(0.22 + relief % 4 * 0.05, 0.18 + relief % 3 * 0.06, 0.08); root.add(value);
  }
  for (let aperture = 0; aperture < 8; aperture += 1) torus(root, `ARTMARK__SA6__OBJECTIVE_LENS_APERTURE_${aperture + 1}`, 0.55 + aperture * 0.08, 0.16, m.blackTitanium, [-6.1 + aperture * 1.75, 2.1 + aperture % 3 * 1.35, 4.4], [0, 0, 0]);
  box(root, 'ARTMARK__SA6__MECHANICAL_PIN_DATA_SCREEN_FRAME', [0.4, 4.4, 7.2], m.blackTitanium, [-8.2, 2.2, 0], true);
  for (let pin = 0; pin < 96; pin += 1) {
    const row = Math.floor(pin / 12); const col = pin % 12; const depth = 0.18 + (Math.sin(row * 0.8) + Math.cos(col * 0.7) + 2) * 0.12;
    box(root, `ARTMARK__SA6__SHADOW_DATA_PIN_${pin + 1}`, [depth, 0.26, 0.34], pin % 11 === 0 ? m.aluminum : m.titaniumMesh, [-8.45 - depth * 0.5, 0.55 + row * 0.48, -3.1 + col * 0.56]);
  }
  torus(root, 'ARTMARK__SA6__CRYSTALLOGRAPHIC_REFLECTING_POOL', 5.5, 0.48, m.water, [2.4, 0.06, 7.1], [Math.PI / 2, 0, 0], Math.PI * 2, false, 8, 48);
  return root;
}

function createArchive(m: Materials) {
  const root = new THREE.Group(); root.name = 'ARTMARK__SA7__ARCHIVE_OF_FUTURE_MATERIALS';
  roundedBox(root, 'ARTMARK__SA7__CENTURIES_ARCHIVE_MONOLITH', [17.2, 5.4, 9.6], 0.32, m.paleStone, [0, 2.7, 0], true);
  const panelMaterials = [m.aluminum, m.oxide, m.pearl, m.photovoltaic, m.titaniumMesh, m.lowIronGlass];
  for (let panel = 0; panel < 30; panel += 1) {
    const col = panel % 10; const row = Math.floor(panel / 10);
    box(root, `ARTMARK__SA7__EXPERIMENTAL_MATERIAL_FIELD_${panel + 1}`, [1.45, 1.35, 0.14], panelMaterials[panel % panelMaterials.length], [-7.45 + col * 1.65, 1.1 + row * 1.55, 4.88], false);
  }
  for (let strip = 0; strip < 24; strip += 1) box(root, `ARTMARK__SA7__PERMANENT_WEATHERING_TEST_STRIP_${strip + 1}`, [0.22, 4.6, 0.12], strip % 5 === 0 ? m.oxide : m.aluminum, [-8.1 + strip * 0.7, 2.5, -4.89], false);
  for (let mesh = 0; mesh < 28; mesh += 1) box(root, `ARTMARK__SA7__GRADED_TITANIUM_MESH_BAY_${mesh + 1}`, [0.08 + mesh * 0.006, 5.2, 0.22], m.titaniumMesh, [-8.7 + mesh * 0.64, 2.7, -5.08], false, [0, (mesh - 14) * 0.008, 0]);
  for (let tooth = 0; tooth < 8; tooth += 1) box(root, `ARTMARK__SA7__NORTH_LIGHT_SAWTOOTH_${tooth + 1}`, [1.75, 1.15, 8.8], tooth % 2 ? m.lowIronGlass : m.photovoltaic, [-7.1 + tooth * 2.05, 6.0, 0], true, [0, 0, -0.38]);
  for (let rig = 0; rig < 8; rig += 1) cylinder(root, `ARTMARK__SA7__ROOFTOP_EXPOSURE_RIG_${rig + 1}`, 0.28, 1.2 + rig % 3 * 0.4, m.blackTitanium, [-7.2 + rig * 2.05, 7.0, -1.6 + rig % 2 * 3.2], false, 8);
  return root;
}

function createNullField(m: Materials) {
  const root = new THREE.Group(); root.name = 'ARTMARK__SA8__NULL_FIELD_GALLERY';
  roundedBox(root, 'ARTMARK__SA8__PARTIALLY_BURIED_BLACK_MONOLITH', [15.2, 3.6, 9.8], 0.14, m.matteBlack, [0, 1.45, 0], true);
  for (let datum = 0; datum < 34; datum += 1) {
    const side = datum < 17 ? 1 : -1; const index = datum % 17;
    pulse(box(root, `ARTMARK__SA8__CONTINUOUS_EYE_LEVEL_DATUM_${datum + 1}`, [0.78, 0.05, 0.08], m.whiteLight.clone(), [-6.6 + index * 0.83, 1.62, side * 4.93]), 0.0012, datum * 0.12, 0.03, 0.7);
  }
  box(root, 'ARTMARK__SA8__NARROWING_VOID_ENTRANCE_LEFT', [4.8, 3.3, 0.52], m.matteBlack, [-2.8, 1.65, 5.15], true, [0, -0.16, 0]);
  box(root, 'ARTMARK__SA8__NARROWING_VOID_ENTRANCE_RIGHT', [4.8, 3.3, 0.52], m.matteBlack, [2.8, 1.65, 5.15], true, [0, 0.16, 0]);
  box(root, 'ARTMARK__SA8__STILL_REFLECTING_BASIN', [15.8, 0.08, 5.6], m.water, [0, 0.04, 8.2]);
  for (let bridge = 0; bridge < 3; bridge += 1) box(root, `ARTMARK__SA8__RAILLESS_STEPPING_BRIDGE_${bridge + 1}`, [1.15, 0.12, 5.9], m.blackTitanium, [-4.1 + bridge * 4.1, 0.12, 8.1], false);
  for (let sensor = 0; sensor < 5; sensor += 1) sphere(root, `ARTMARK__SA8__ROOF_SENSOR_HEMISPHERE_${sensor + 1}`, [0.42 + sensor % 2 * 0.18, 0.2, 0.42 + sensor % 2 * 0.18], m.blackTitanium, [-5.8 + sensor * 2.9, 3.35, -1.4 + sensor % 2 * 2.8]);
  return root;
}

function createSignalHouse(m: Materials) {
  const root = new THREE.Group(); root.name = 'ARTMARK__M1__SIGNAL_HOUSE';
  for (let segment = 0; segment < 16; segment += 1) {
    const t = segment / 15; const x = -7.8 + t * 15.6; const z = Math.sin((t - 0.5) * Math.PI) * 1.6; const height = 5.8 + Math.sin(t * Math.PI) * 4.4;
    box(root, `ARTMARK__M1__WAVEFORM_CURVED_SLAB_${segment + 1}`, [1.05, height, 5.4], segment % 4 === 0 ? m.aluminum : m.lowIronGlass, [x, height * 0.5, z], true, [0, (t - 0.5) * 0.22, 0]);
  }
  for (let fin = 0; fin < 48; fin += 1) {
    const t = fin / 47; const height = 5.2 + Math.sin(t * Math.PI) * 4.0;
    box(root, `ARTMARK__M1__ENCODED_CERAMIC_FIN_${fin + 1}`, [0.09, height * 0.76, 0.65], fin % 7 === 0 ? m.dichroic : m.pearl, [-7.9 + t * 15.8, height * 0.52, 3.15 + Math.sin((t - 0.5) * Math.PI) * 1.55], false, [0, (fin % 5 - 2) * 0.035, 0]);
  }
  for (let band = 0; band < 5; band += 1) pulse(box(root, `ARTMARK__M1__MODULAR_IDENTIFICATION_BAND_${band + 1}`, [12.2 - band * 0.6, 0.12, 0.1], band % 2 ? m.cyanLight.clone() : m.whiteLight.clone(), [0, 2.2 + band * 1.45, 4.18]), 0.0016, band * 0.7, 0.03, 1.1);
  for (let ring = 0; ring < 5; ring += 1) rotate(torus(root, `ARTMARK__M1__COMMUNICATIONS_MAST_RING_${ring + 1}`, 0.85 + ring * 0.38, 0.08, ring % 2 ? m.aluminum : m.dichroic, [9.2, 2.2 + ring * 1.15, 0], [Math.PI / 2 + ring * 0.16, 0, 0]), 0.001 + ring * 0.0002, 'z');
  cylinder(root, 'ARTMARK__M1__COMMUNICATIONS_MAST', 0.28, 8.4, m.blackTitanium, [9.2, 4.2, 0], true, 12);
  for (let ray = 0; ray < 12; ray += 1) pipe(root, `ARTMARK__M1__SIGNAL_PLAZA_WAYFINDING_RAY_${ray + 1}`, new THREE.Vector3(0, 0.06, 6.0), new THREE.Vector3(Math.cos(ray / 12 * Math.PI * 2) * 7.8, 0.06, 6 + Math.sin(ray / 12 * Math.PI * 2) * 3.4), 0.04, ray % 3 ? m.aluminum : m.cyanLight);
  return root;
}

function createLaunchArray(m: Materials) {
  const root = new THREE.Group(); root.name = 'ARTMARK__M2__LAUNCH_ARRAY';
  cylinder(root, 'ARTMARK__M2__SHALLOW_CIRCULAR_DISH', 15.8, 1.25, m.blackTitanium, [0, 0.62, 0], true, 24);
  arcSegments(root, 'ARTMARK__M2__ROTATING_ALUMINUM_OUTER_RING_PANEL', 8.35, 8.35, 0.9, 2.3, 0.55, 32, 0, Math.PI * 2, m.aluminum, true);
  for (let arm = 0; arm < 8; arm += 1) {
    const angle = arm / 8 * Math.PI * 2; const start = new THREE.Vector3(Math.cos(angle) * 4.4, 2.05, Math.sin(angle) * 4.4); const end = new THREE.Vector3(Math.cos(angle) * 12.0, 2.55, Math.sin(angle) * 12.0);
    slabBetween(root, `ARTMARK__M2__RADIAL_EVENT_CANOPY_${arm + 1}`, start, end, 2.2, 0.18, arm % 2 ? m.photovoltaic : m.pearl, false);
    cylinder(root, `ARTMARK__M2__DIRECTIONAL_CAMERA_MAST_${arm + 1}`, 0.22, 5.2, m.blackTitanium, [Math.cos(angle) * 12.8, 2.6, Math.sin(angle) * 12.8], true, 8);
    sphere(root, `ARTMARK__M2__ROBOTIC_CAMERA_HEAD_${arm + 1}`, [0.28, 0.22, 0.34], m.aluminum, [Math.cos(angle) * 12.8, 5.35, Math.sin(angle) * 12.8]);
  }
  cylinder(root, 'ARTMARK__M2__RETRACTABLE_TRANSLUCENT_EVENT_MEMBRANE', 9.2, 0.15, m.lowIronGlass, [0, 2.22, 0], false, 32);
  pulse(torus(root, 'ARTMARK__M2__LUMINOUS_LAUNCH_DISC_EDGE', 4.7, 0.1, m.whiteLight.clone(), [0, 2.32, 0]), 0.002, 0.2, 0.05, 1.3);
  for (let mount = 0; mount < 24; mount += 1) {
    const angle = mount / 24 * Math.PI * 2; cylinder(root, `ARTMARK__M2__FLUSH_EVENT_EQUIPMENT_MOUNT_${mount + 1}`, 0.32, 0.08, mount % 4 === 0 ? m.dichroic : m.titaniumMesh, [Math.cos(angle) * 10.5, 0.08, Math.sin(angle) * 10.5], false, 8);
  }
  return root;
}

function createNarrativeEngine(m: Materials) {
  const root = new THREE.Group(); root.name = 'ARTMARK__M3__NARRATIVE_ENGINE_MEDIA_FOUNDRY';
  const boxes = [[-4.8, 1.9, -1.8, 8.4, 3.8, 5.0], [3.5, 2.4, -2.0, 9.8, 4.8, 4.8], [-2.8, 5.2, 0.8, 10.4, 2.2, 4.0], [4.8, 6.2, 1.1, 8.0, 2.5, 4.2], [-5.4, 7.6, -0.5, 6.4, 2.1, 3.8], [2.4, 8.5, -1.1, 7.2, 2.0, 3.6]] as const;
  boxes.forEach(([x, y, z, sx, sy, sz], index) => roundedBox(root, `ARTMARK__M3__SLIDING_BLACK_PRODUCTION_VOLUME_${index + 1}`, [sx, sy, sz], 0.22, m.matteBlack, [x, y, z], true, [0, (index - 2) * 0.025, 0]));
  box(root, 'ARTMARK__M3__TRANSLUCENT_VERTICAL_LANTERN_CORE', [3.2, 11.0, 3.0], m.lowIronGlass, [0, 5.5, 0], true);
  for (let field = 0; field < 11; field += 1) pulse(box(root, `ARTMARK__M3__ABSTRACT_PRODUCTION_DATA_FIELD_${field + 1}`, [2.5, 0.09, 0.06], field % 2 ? m.violetLight.clone() : m.cyanLight.clone(), [0, 1.0 + field * 0.86, 1.53]), 0.0017, field * 0.37, 0.03, 1.1);
  for (let gantry = 0; gantry < 6; gantry += 1) {
    pipe(root, `ARTMARK__M3__EXPOSED_TECHNICAL_GANTRY_${gantry + 1}`, new THREE.Vector3(-8.8, 2.1 + gantry * 1.25, 3.0), new THREE.Vector3(8.8, 2.3 + gantry * 1.25, 3.0), 0.09, m.aluminum);
    box(root, `ARTMARK__M3__ROBOTIC_CAMERA_CARRIAGE_${gantry + 1}`, [0.72, 0.5, 0.48], m.blackTitanium, [-6.8 + gantry * 2.6, 2.5 + gantry * 1.25, 3.0]);
  }
  box(root, 'ARTMARK__M3__MATTE_GREY_CALIBRATION_WALL', [15.8, 7.2, 0.32], m.paleStone, [0, 3.6, -5.0], true);
  for (let step = 0; step < 7; step += 1) box(root, `ARTMARK__M3__STEPPED_MEDIA_SQUARE_${step + 1}`, [14.8 - step * 1.2, 0.12, 0.82], step % 2 ? m.basalt : m.paleStone, [0, 0.06 + step * 0.05, 5.2 + step * 0.75]);
  return root;
}

function createAudienceDynamics(m: Materials) {
  const root = new THREE.Group(); root.name = 'ARTMARK__M4__AUDIENCE_DYNAMICS_OBSERVATORY';
  for (const side of [-1, 1]) {
    for (let segment = 0; segment < 16; segment += 1) {
      const t = segment / 15; const angle = -1.05 + t * 2.1; const x = Math.sin(angle) * 7.1; const z = side * (4.6 + Math.cos(angle) * 1.8);
      box(root, `ARTMARK__M4__${side < 0 ? 'INNER' : 'OUTER'}_OBSERVING_CRESCENT_${segment + 1}`, [1.0, 4.8, 2.5], side < 0 ? m.lowIronGlass : m.aluminum, [x, 2.4, z], true, [0, -angle * side * 0.44, 0]);
    }
  }
  for (let cell = 0; cell < 84; cell += 1) {
    const side = cell < 42 ? -1 : 1; const local = cell % 42; const col = local % 14; const row = Math.floor(local / 14); const t = col / 13; const angle = -0.95 + t * 1.9;
    const x = Math.sin(angle) * 7.15; const z = side * (3.35 + Math.cos(angle) * 1.55);
    pulse(box(root, `ARTMARK__M4__RESPONSIVE_ELECTROCHROMIC_CELL_${cell + 1}`, [0.54, 0.65, 0.08], (cell % 9 === 0 ? m.violetLight : m.lowIronGlass).clone(), [x, 0.9 + row * 1.15, z]), 0.0011 + row * 0.0001, cell * 0.1, 0.02, 0.8);
  }
  for (let mast = 0; mast < 8; mast += 1) {
    const x = -7.2 + mast * 2.05; cylinder(root, `ARTMARK__M4__EXPLICIT_SENSOR_MAST_${mast + 1}`, 0.2, 4.2, m.blackTitanium, [x, 2.1, 0], true, 8);
    pulse(torus(root, `ARTMARK__M4__ACTIVE_SENSING_INDICATOR_RING_${mast + 1}`, 0.42, 0.06, mast % 2 ? m.cyanLight.clone() : m.amberLight.clone(), [x, 3.2, 0], [Math.PI / 2, 0, 0]), 0.0015, mast * 0.4, 0.03, 1.1);
  }
  torus(root, 'ARTMARK__M4__ELLIPTICAL_INTERACTION_WATER_CHANNEL', 8.7, 0.42, m.water, [0, 0.06, 0], [Math.PI / 2, 0, 0], Math.PI * 2, false, 8, 64);
  for (let bridge = 0; bridge < 5; bridge += 1) box(root, `ARTMARK__M4__PRESSURE_LIT_WATER_BRIDGE_${bridge + 1}`, [1.25, 0.12, 3.0], bridge % 2 ? m.pearl : m.aluminum, [-5.6 + bridge * 2.8, 0.15, 0]);
  return root;
}

function createIdentityWorks(m: Materials) {
  const root = new THREE.Group(); root.name = 'ARTMARK__M5__PROTOTYPE_IDENTITY_WORKS';
  box(root, 'ARTMARK__M5__LONG_INDUSTRIAL_FABRICATION_HALL', [18.6, 4.2, 9.8], m.blackTitanium, [0, 2.1, 0], true);
  for (let tooth = 0; tooth < 9; tooth += 1) box(root, `ARTMARK__M5__ASYMMETRIC_SAWTOOTH_ROOF_${tooth + 1}`, [1.85, 1.25, 9.2], tooth % 2 ? m.photovoltaic : m.lowIronGlass, [-8.0 + tooth * 2.0, 4.8, 0], true, [0, 0, -0.42]);
  const panels = [m.aluminum, m.lowIronGlass, m.oxide, m.pearl, m.titaniumMesh, m.photovoltaic, m.moss, m.paleStone, m.dichroic, m.blackTitanium];
  panels.forEach((panelMaterial, index) => box(root, `ARTMARK__M5__INTERCHANGEABLE_MATERIAL_PANEL_${index + 1}`, [1.58, 3.4, 0.18], panelMaterial, [-8.0 + index * 1.78, 2.0, 5.0], false));
  for (let tower = 0; tower < 10; tower += 1) {
    const x = -8.2 + tower * 1.8; const height = 1.8 + tower % 4 * 0.7;
    const value = taper(root, `ARTMARK__M5__FREESTANDING_PROTOTYPE_TOWER_${tower + 1}`, 0.72 + tower % 3 * 0.2, 0.45, height, panels[tower % panels.length], [x, height * 0.5, 7.0 + tower % 2 * 0.8], true, tower % 2 ? 8 : 12, [0, tower * 0.21, 0]);
    if (tower === 6) rotate(value, 0.0014);
  }
  for (let screen = 0; screen < 8; screen += 1) box(root, `ARTMARK__M5__SLIDING_REAR_YARD_SCREEN_${screen + 1}`, [2.1, 3.8, 0.2], m.titaniumMesh, [-8.0 + screen * 2.25, 2.0, -5.2], true);
  return root;
}

function createBeaconExchange(m: Materials) {
  const root = new THREE.Group(); root.name = 'ARTMARK__M6__BEACON_EXCHANGE_TOWER';
  taper(root, 'ARTMARK__M6__PALE_CERAMIC_CENTRAL_SHAFT', 5.2, 3.0, 15.8, m.pearl, [0, 7.9, 0], true, 12);
  for (let ring = 0; ring < 5; ring += 1) {
    const y = 3.0 + ring * 2.65; const x = Math.cos(ring * 1.31) * (0.55 + ring * 0.13); const z = Math.sin(ring * 1.31) * (0.55 + ring * 0.13);
    torus(root, `ARTMARK__M6__OFFSET_PERFORATED_TITANIUM_RING_${ring + 1}`, 3.0 + ring * 0.42, 0.62, m.titaniumMesh, [x, y, z], [Math.PI / 2, 0, ring * 0.08], Math.PI * 2, true, 8, 48);
    for (let brace = 0; brace < 6; brace += 1) {
      const angle = brace / 6 * Math.PI * 2; pipe(root, `ARTMARK__M6__VISIBLE_RING_BRACE_${ring + 1}_${brace + 1}`, new THREE.Vector3(x + Math.cos(angle) * 1.2, y, z + Math.sin(angle) * 1.2), new THREE.Vector3(x + Math.cos(angle) * (3.0 + ring * 0.42), y, z + Math.sin(angle) * (3.0 + ring * 0.42)), 0.07, m.aluminum);
    }
  }
  box(root, 'ARTMARK__M6__WESTERN_DIRECTIONAL_MEDIA_MEMBRANE', [0.18, 10.8, 3.2], m.photovoltaic, [-3.3, 8.4, 0], false);
  cylinder(root, 'ARTMARK__M6__TAPERED_COMMUNICATIONS_MAST', 0.42, 8.0, m.blackTitanium, [0, 19.8, 0], true, 12);
  for (let pulseIndex = 0; pulseIndex < 9; pulseIndex += 1) pulse(torus(root, `ARTMARK__M6__SLOW_VERTICAL_MAST_PULSE_${pulseIndex + 1}`, 0.36, 0.055, m.whiteLight.clone(), [0, 16.3 + pulseIndex * 0.88, 0], [Math.PI / 2, 0, 0]), 0.0008, pulseIndex * 0.55, 0.02, 0.9);
  for (let path = 0; path < 7; path += 1) {
    const angle = path / 7 * Math.PI * 2; slabBetween(root, `ARTMARK__M6__GLOBAL_PARTNER_RADIAL_PATH_${path + 1}`, new THREE.Vector3(Math.cos(angle) * 3.8, 0.08, Math.sin(angle) * 3.8), new THREE.Vector3(Math.cos(angle) * 10.0, 0.08, Math.sin(angle) * 10.0), 0.72, 0.12, path % 2 ? m.paleStone : m.basalt);
  }
  return root;
}

function createEvidenceCommons(m: Materials) {
  const root = new THREE.Group(); root.name = 'ARTMARK__M7__EVIDENCE_COMMONS';
  box(root, 'ARTMARK__M7__RAISED_CIVIC_STONE_PLATFORM', [19.0, 0.55, 12.6], m.paleStone, [0, 0.28, 0], true);
  roundedBox(root, 'ARTMARK__M7__CALM_PUBLIC_VERIFICATION_HALL', [16.8, 4.6, 10.2], 0.28, m.lowIronGlass, [0, 2.85, 0], true);
  for (let column = 0; column < 32; column += 1) {
    const side = Math.floor(column / 8); const index = column % 8; const x = side < 2 ? -7.7 + index * 2.2 : side === 2 ? -9.0 : 9.0; const z = side < 2 ? (side === 0 ? -5.7 : 5.7) : -5.2 + index * 1.48;
    for (let section = 0; section < 3; section += 1) {
      const diameter = 0.55 + section * 0.16; cylinder(root, `ARTMARK__M7__EVIDENCE_STANDARD_COLUMN_${column + 1}_SECTION_${section + 1}`, diameter, 1.25, section === 0 ? m.paleStone : section === 1 ? m.pearl : m.aluminum, [x, 0.9 + section * 1.25, z], true, section === 1 ? 8 : 12);
    }
  }
  for (let band = 0; band < 18; band += 1) box(root, `ARTMARK__M7__PROVENANCE_CITATION_BAND_${band + 1}`, [15.8, 0.06, 0.08], band % 4 === 0 ? m.dichroic : m.aluminum, [0, 1.0 + band * 0.2, 5.16]);
  for (let step = 0; step < 8; step += 1) box(root, `ARTMARK__M7__PUBLIC_DEBATE_PLAZA_STEP_${step + 1}`, [16.8 - step * 1.05, 0.12, 0.72], step % 2 ? m.pearl : m.paleStone, [0, 0.08 + step * 0.05, 7.1 + step * 0.68]);
  for (let branch = 0; branch < 9; branch += 1) pipe(root, `ARTMARK__M7__DECISION_TREE_CANOPY_CABLE_${branch + 1}`, new THREE.Vector3(0, 5.5, 5.0), new THREE.Vector3(-7.2 + branch * 1.8, 4.6, 10.4), 0.045, m.blackTitanium);
  box(root, 'ARTMARK__M7__CORRECTION_BELL_FRAME_LEFT', [0.25, 6.2, 0.25], m.matteBlack, [10.2, 3.1, 5.2], true);
  box(root, 'ARTMARK__M7__CORRECTION_BELL_FRAME_RIGHT', [0.25, 6.2, 0.25], m.matteBlack, [13.2, 3.1, 5.2], true);
  box(root, 'ARTMARK__M7__CORRECTION_BELL_FRAME_CROWN', [3.25, 0.25, 0.25], m.matteBlack, [11.7, 6.1, 5.2], true);
  box(root, 'ARTMARK__M7__SUSPENDED_CORRECTION_ALLOY_PLATE', [2.1, 2.8, 0.18], m.aluminum, [11.7, 3.7, 5.2]);
  return root;
}

function createBuilding(record: ArtMarketingBuildingProgram, materials: Materials) {
  const factories: Record<ArtMarketingBuildingForm, (m: Materials) => THREE.Group> = {
    parallax: createParallax,
    morphogenesis: createMorphogenesis,
    chromaflux: createChromaflux,
    resonance: createResonance,
    lumen: createLumen,
    atlas: createAtlas,
    archive: createArchive,
    'null-field': createNullField,
    'signal-house': createSignalHouse,
    'launch-array': createLaunchArray,
    'narrative-engine': createNarrativeEngine,
    'audience-dynamics': createAudienceDynamics,
    'identity-works': createIdentityWorks,
    'beacon-exchange': createBeaconExchange,
    'evidence-commons': createEvidenceCommons,
  };
  const root = factories[record.form](materials);
  const districtId = record.side === 'scientific-art' ? SCIENTIFIC_ART_ID : MARKETING_ID;
  root.userData.exteriorProgram = true;
  root.userData.buildingCode = record.code;
  root.userData.buildingName = record.name;
  root.userData.buildingSubtitle = record.subtitle;
  root.userData.purpose = record.purpose;
  root.userData.side = record.side;
  root.userData.facilityForm = record.form;
  root.userData.footprintMetres = [...record.footprintMetres];
  root.userData.heightMetres = record.heightMetres;
  root.userData.placementZone = record.placementZone;
  root.userData.exteriorSignature = record.exteriorSignature;
  root.userData.navObstacle = true;
  root.traverse((object) => { object.userData.selectableId = districtId; object.userData.districtId = districtId; });
  return root;
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radialMargin = 7.5; const angularMargin = (sector.endAngle - sector.startAngle) * 0.045;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT);
  const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
  return new THREE.Vector3(Math.cos(angle) * radius - definition.position[0], y, Math.sin(angle) * radius - definition.position[2]);
}

function districtArc(definition: DistrictDefinition, radialT: number, startAngularT: number, endAngularT: number, segments: number, y = FLOOR_Y) {
  return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, radialT, THREE.MathUtils.lerp(startAngularT, endAngularT, index / (segments - 1)), y));
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

function addRibbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, mat: THREE.Material, districtId: string, walkable = true) {
  const value = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), mat), name, false, districtId); value.userData.walkable = walkable; value.userData.navObstacle = false; value.userData.artMarketingRoute = true; parent.add(value); return value;
}

function offsetPath(points: readonly THREE.Vector3[], offset: number, modulation = 0, frequency = 1) {
  return points.map((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x); const t = index / Math.max(1, points.length - 1); return point.clone().addScaledVector(normal, offset + Math.sin(t * Math.PI * frequency) * modulation).setY(FLOOR_Y + 0.022); });
}

function addSharedPublicRealm(district: THREE.Group, definition: DistrictDefinition, side: ArtMarketingSide, m: Materials) {
  const infrastructure = new THREE.Group(); infrastructure.name = side === 'scientific-art' ? 'ARTMARK__SA__SPECTRUM_SPINE_INFRASTRUCTURE' : 'ARTMARK__M__SPECTRUM_SPINE_INFRASTRUCTURE';
  const districtId = side === 'scientific-art' ? SCIENTIFIC_ART_ID : MARKETING_ID;
  const radialT = side === 'scientific-art' ? 0.485 : 0.515;
  const spine = districtArc(definition, radialT, 0.015, 0.985, 128);
  addRibbon(infrastructure, side === 'scientific-art' ? 'ARTMARK__SA__SPECTRUM_SPINE_INNER_HALF' : 'ARTMARK__M__SPECTRUM_SPINE_OUTER_HALF', spine, 2.45, side === 'scientific-art' ? m.basalt : m.paleStone, districtId);
  for (let band = 0; band < 4; band += 1) pulse(addRibbon(infrastructure, `${side === 'scientific-art' ? 'ARTMARK__SA' : 'ARTMARK__M'}__SPECTRUM_DIRECTIONAL_LIGHT_BAND_${band + 1}`, offsetPath(spine, -0.82 + band * 0.54, 0.05, 3 + band), 0.045, (band % 2 ? m.cyanLight : m.violetLight).clone(), districtId, false), 0.0012 + band * 0.0002, band * 0.5, 0.02, 0.8);
  const promenade = districtArc(definition, side === 'scientific-art' ? 0.445 : 0.555, 0.03, 0.97, 112);
  addRibbon(infrastructure, `${side === 'scientific-art' ? 'ARTMARK__SA' : 'ARTMARK__M'}__UNFINISHED_PROMENADE`, promenade, 0.95, m.blackTitanium, districtId);
  for (let module = 0; module < 18; module += 1) {
    const point = promenade[Math.min(promenade.length - 1, 3 + module * 6)]; const mat = [m.pearl, m.aluminum, m.photovoltaic, m.dichroic][module % 4];
    box(infrastructure, `${side === 'scientific-art' ? 'ARTMARK__SA' : 'ARTMARK__M'}__REPLACEABLE_PROMENADE_MODULE_${module + 1}`, [0.54 + module % 3 * 0.18, 0.08, 0.68], mat, [point.x, point.y + 0.04, point.z], false, [0, module * 0.13, 0]);
  }
  const forum = pointInDistrict(definition, side === 'scientific-art' ? 0.472 : 0.528, 0.34, FLOOR_Y + 0.018);
  cylinder(infrastructure, `${side === 'scientific-art' ? 'ARTMARK__SA' : 'ARTMARK__M'}__PRISM_FORUM_HALF`, 13.2, 0.08, side === 'scientific-art' ? m.basalt : m.paleStone, [forum.x, forum.y, forum.z], false, 32);
  for (let prism = 0; prism < 7; prism += 1) {
    const angle = prism / 7 * Math.PI * 2; taper(infrastructure, `${side === 'scientific-art' ? 'ARTMARK__SA' : 'ARTMARK__M'}__PRISM_FORUM_DATA_OBJECT_${prism + 1}`, 0.52, 0.12, 1.2 + prism % 3 * 0.45, prism % 2 ? m.dichroic : m.lowIronGlass, [forum.x + Math.cos(angle) * 4.6, forum.y + 0.65, forum.z + Math.sin(angle) * 4.6], false, 6, [0, angle, 0]);
  }
  const gardenPoints = districtArc(definition, side === 'scientific-art' ? 0.462 : 0.538, 0.53, 0.78, 40);
  gardenPoints.filter((_, index) => index % 4 === 0).forEach((point, index) => {
    cylinder(infrastructure, `${side === 'scientific-art' ? 'ARTMARK__SA' : 'ARTMARK__M'}__TRANSLATION_GARDEN_SENSOR_${index + 1}`, 0.18, 1.6 + index % 3 * 0.4, m.blackTitanium, [point.x, 0.82, point.z], false, 8);
    pulse(torus(infrastructure, `${side === 'scientific-art' ? 'ARTMARK__SA' : 'ARTMARK__M'}__TRANSLATION_GARDEN_RESPONSE_RING_${index + 1}`, 0.44 + index % 2 * 0.12, 0.05, (index % 2 ? m.cyanLight : m.amberLight).clone(), [point.x, 1.45 + index % 3 * 0.4, point.z], [Math.PI / 2, 0, 0]), 0.0015, index * 0.4, 0.02, 0.8);
  });
  district.add(infrastructure); return { infrastructure, spine };
}

function buildSide(district: THREE.Group, definition: DistrictDefinition, side: ArtMarketingSide) {
  if (!definition.sector) throw new Error('Scientific Art and Marketing District requires a masterplan sector');
  const materials = createMaterials(); const districtId = side === 'scientific-art' ? SCIENTIFIC_ART_ID : MARKETING_ID;
  const program = side === 'scientific-art' ? SCIENTIFIC_ART_BUILDING_PROGRAM : MARKETING_BUILDING_PROGRAM;
  const { infrastructure, spine } = addSharedPublicRealm(district, definition, side, materials);
  const facilities = program.map((record) => {
    const building = createBuilding(record, materials); const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02); building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const radial = worldPosition.clone().setY(0).normalize(); const entranceDirection = side === 'scientific-art' ? radial : radial.multiplyScalar(-1);
    building.rotation.y = Math.atan2(entranceDirection.x, entranceDirection.z);
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT };
    district.add(building); return building;
  });
  facilities.forEach((facility, index) => {
    const record = program[index]; const entrance = new THREE.Vector3(0, FLOOR_Y + 0.012, Math.min(7.2, record.footprintMetres[1] / 20 + 0.8)).applyQuaternion(facility.quaternion).add(facility.position);
    const routePoint = spine.reduce((closest, point) => point.distanceToSquared(entrance) < closest.distanceToSquared(entrance) ? point : closest, spine[0]); const tangent = entrance.clone().sub(routePoint); const corner = routePoint.clone().lerp(entrance, 0.56).add(new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar((index % 2 ? 1 : -1) * 0.45));
    const approach = [routePoint.clone(), corner, entrance];
    addRibbon(infrastructure, `ARTMARK__${record.code}__BUILDING_APPROACH`, approach, 0.86, index % 3 === 0 ? materials.pearl : side === 'scientific-art' ? materials.basalt : materials.paleStone, districtId);
    pulse(addRibbon(infrastructure, `ARTMARK__${record.code}__BUILDING_APPROACH_GUIDE`, offsetPath(approach, 0.25), 0.035, (index % 2 ? materials.cyanLight : materials.violetLight).clone(), districtId, false), 0.0014, index * 0.42, 0.02, 0.8);
  });
  const buildings = program.map((record) => ({ code: record.code, name: record.name, subtitle: record.subtitle, purpose: record.purpose, placementZone: record.placementZone, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorSignature: record.exteriorSignature }));
  const circulation = { primaryRoute: side === 'scientific-art' ? 'ARTMARK__SA__SPECTRUM_SPINE_INNER_HALF' : 'ARTMARK__M__SPECTRUM_SPINE_OUTER_HALF', sharedBoulevard: 'Spectrum Spine', prismForum: true, translationGarden: true, unfinishedPromenade: true, exactBuildingApproaches: facilities.length };
  const sharedMetadata = { identity: 'Scientific Art and Marketing District', translationRole: 'scientific work becomes images, objects, experiences, narratives, and identities before moving outward to public audiences', totalBuildingCount: 15, scientificArtBuildingCount: 8, marketingBuildingCount: 7, commonPalette: ['black titanium', 'low-iron glass', 'pearlescent ceramic', 'brushed aluminum', 'translucent photovoltaic panels', 'dichroic films', 'pale geopolymer stone'], integratedMediaRule: 'media surfaces are directional, brightness-limited, abstract, and architecturally integrated', exteriorOnly: true };
  if (side === 'scientific-art') {
    district.userData.scientificArtLabsDistrict = { ...sharedMetadata, side: 'Scientific Art', buildingCount: facilities.length, buildings, circulation, architecturalLanguage: 'experimental, irregular, materially expressive, optically ambiguous, and laboratory-facing', signatureSystems: { parallaxDichroicFins: 72, morphogenesisShellPanels: 32, chromafluxPods: 7, resonanceVolumes: 5, lumenMirroredShutters: 30, atlasSlides: 6, archiveWeatheringStrips: 24, nullDatumSegments: 34 } };
  } else {
    district.userData.marketingDistrict = { ...sharedMetadata, side: 'Marketing', buildingCount: facilities.length, buildings, circulation, architecturalLanguage: 'legible, civic, public-facing, media-literate, and resistant to billboard architecture', signatureSystems: { signalWaveSegments: 16, launchRadialCanopies: 8, narrativeProductionVolumes: 6, audienceResponsiveCells: 84, identityMaterialPanels: 10, beaconOffsetRings: 5, evidenceColumns: 32 } };
  }
  district.userData.artMarketingTranslationDistrict = sharedMetadata;
  district.userData.population = {
    plannedFacilities: program.map((record) => record.name),
    plannedObjects: ['Spectrum Spine', 'Prism Forum', 'Translation Garden', 'Unfinished Promenade', 'Directional Media Bands', 'Exact Building Approaches'],
    realizedFeatureTags: program.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: facilities.length + 2,
    radialCoverage: side === 'scientific-art' ? 0.49 : 0.93,
    angularCoverage: 0.98,
    exteriorOnly: true,
    artMarketingTranslationNarrative: true,
    spectrumSpineWalkable: true,
    sharedPublicRealm: true,
  };
}

export function buildScientificArtLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  buildSide(district, definition, 'scientific-art');
}

export function buildMarketingDistrict(district: THREE.Group, definition: DistrictDefinition) {
  buildSide(district, definition, 'marketing');
}
