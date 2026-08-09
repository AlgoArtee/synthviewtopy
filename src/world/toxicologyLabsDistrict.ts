import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { DistrictDefinition } from '../data/districts';

type ToxicologyBuildingForm = 'exposoma' | 'mimesis' | 'causality-array' | 'palimpsest' | 'meridian';

export interface ToxicologyBuildingProgram {
  code: string;
  name: string;
  subtitle: string;
  focus: string;
  form: ToxicologyBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  sequence: number;
  exteriorSignature: string;
}

export const TOXICOLOGY_BUILDING_PROGRAM: readonly ToxicologyBuildingProgram[] = [
  { code: 'T1', name: 'EXPOSOMA', subtitle: 'Institute for Total Exposure Cartography', focus: 'Exposomics, biomonitoring, wearable exposure sensors, non-targeted chemical analysis, and lifetime exposure reconstruction', form: 'exposoma', footprintMetres: [154, 92], heightMetres: 29, radialT: 0.15, angularT: 0.12, sequence: 1, exteriorSignature: 'five offset elliptical exposure rings, titanium analytical ribbons, bioindicator forecourt, and an environmental Sampling Crown' },
  { code: 'T2', name: 'MIMESIS', subtitle: 'Human Microphysiology Toxicology Arc', focus: 'Organs-on-chips, human organoids, tissue models, barrier toxicology, developmental neurotoxicity, immunotoxicology, and inhalation testing', form: 'mimesis', footprintMetres: [152, 102], heightMetres: 42, radialT: 0.15, angularT: 0.50, sequence: 2, exteriorSignature: 'three-part crescent with microfluidic facade, capillary colonnade, capillary bridges, roof-slide lanterns, and closed landscape stream' },
  { code: 'T3', name: 'CAUSALITY ARRAY', subtitle: 'Centre for Computational Toxicology and Adverse-Outcome Modelling', focus: 'AI toxicity prediction, read-across, high-throughput screening, mechanistic toxicology, and adverse-outcome pathway construction', form: 'causality-array', footprintMetres: [126, 104], heightMetres: 102, radialT: 0.72, angularT: 0.26, sequence: 3, exteriorSignature: 'three leaning graphite prisms around a triangular void, causal-network facade, 96-port Assay Deck, and Outcome Beacon' },
  { code: 'T4', name: 'PALIMPSEST', subtitle: 'Persistent Contaminants and Mixture Toxicology Vault', focus: 'Persistent pollutants, PFAS, endocrine disruptors, microplastics, nanomaterials, mixtures, bioaccumulation, and long-duration effects', form: 'palimpsest', footprintMetres: [168, 94], heightMetres: 48, radialT: 0.84, angularT: 0.68, sequence: 4, exteriorSignature: 'seven-segment basalt containment bastion, descending Half-Life Wall, dual shell, filtration organ pipes, and recessed sealed docks' },
  { code: 'T5', name: 'MERIDIAN', subtitle: 'Toxicokinetics, Countermeasure and Rapid Response Centre', focus: 'ADME, toxicokinetic modelling, in-vitro-to-in-vivo extrapolation, rapid toxicant identification, countermeasures, and incident support', form: 'meridian', footprintMetres: [144, 116], heightMetres: 68, radialT: 0.15, angularT: 0.96, sequence: 5, exteriorSignature: 'four unequal toxicokinetic wings around the Dose Clock, decay apertures, three response lanes, decontamination blades, drone pads, and Half-Life Circuit' },
] as const;

const DISTRICT_ID = 'toxicology-labs';
const FLOOR_Y = 0.036;
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYLINDER_6 = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
const CYLINDER_8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const SPHERE = new THREE.SphereGeometry(0.5, 12, 8);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

function material(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  const value = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.16, ...options });
  value.name = name;
  return value;
}

function createMaterials() {
  const paleCeramic = material('Toxicology immaculate pale technical ceramic', '#e2e1d8', { roughness: 0.61, metalness: 0.04 });
  const whiteConcrete = material('Toxicology pale ultra-high-performance concrete', '#c8c8bf', { roughness: 0.86, metalness: 0.03 });
  const graphite = material('Toxicology graphite containment metal', '#15191c', { roughness: 0.48, metalness: 0.76 });
  const basalt = material('Toxicology dark basalt armour composite', '#101619', { roughness: 0.88, metalness: 0.13 });
  const titanium = material('Toxicology tensioned satin titanium', '#aeb8b8', { roughness: 0.27, metalness: 0.9 });
  const stainless = material('Toxicology analytical stainless steel', '#c6cfcd', { roughness: 0.22, metalness: 0.94 });
  const weatheredSteel = material('Toxicology weathered containment steel', '#62564b', { roughness: 0.61, metalness: 0.75 });
  const oxidizedCopper = material('Toxicology restrained oxidized copper', '#426d67', { roughness: 0.56, metalness: 0.68 });
  const cobalt = material('Toxicology deep cobalt ceramic', '#263958', { roughness: 0.48, metalness: 0.24 });
  const glass = material('Toxicology low-iron research glass', '#5a777b', { roughness: 0.16, metalness: 0.32, emissive: '#142f33', emissiveIntensity: 0.12, transparent: true, opacity: 0.68, depthWrite: true });
  const graphiteGlass = material('Toxicology electrochromic graphite glass', '#10171d', { roughness: 0.18, metalness: 0.52, emissive: '#111d25', emissiveIntensity: 0.12, transparent: true, opacity: 0.82, depthWrite: true });
  const translucent = material('Toxicology translucent filtration shell', '#b8cbc6', { roughness: 0.25, metalness: 0.12, transparent: true, opacity: 0.62, depthWrite: true });
  const mineralGlass = material('Toxicology mineral-inclusion laminated glass', '#6e7977', { roughness: 0.31, metalness: 0.27, transparent: true, opacity: 0.76, depthWrite: true });
  const paving = material('Dose Response Promenade pale sealed paving', '#a6a69f', { roughness: 0.91, metalness: 0.04 });
  const servicePaving = material('Toxicology non-porous restricted service slab', '#303438', { roughness: 0.88, metalness: 0.12 });
  const blackResin = material('Toxicology polished black causal resin', '#080b0d', { roughness: 0.19, metalness: 0.68 });
  const gravel = material('Toxicology black mineral observation gravel', '#1b2020', { roughness: 0.98, metalness: 0.02 });
  const moss = material('Toxicology monitored moss bioindicator', '#435f49', { roughness: 0.99, metalness: 0 });
  const lichen = material('Toxicology monitored lichen bioindicator', '#718068', { roughness: 0.98, metalness: 0 });
  const wetland = material('Toxicology closed-loop wetland vegetation', '#496b5c', { roughness: 0.97, metalness: 0 });
  const silverGrass = material('Toxicology low silver response grass', '#9ca7a0', { roughness: 0.9, metalness: 0.08 });
  const water = material('Toxicology monitored closed-loop water', '#173842', { roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.78, depthWrite: true });
  const whiteLight = material('Toxicology cold white system light', '#ffffff', { emissive: '#ffffff', emissiveIntensity: 2.5, roughness: 0.08, metalness: 0.04 });
  const amberLight = material('Toxicology limited amber status light', '#ffd28a', { emissive: '#ef841f', emissiveIntensity: 2.35, roughness: 0.1, metalness: 0.04 });
  const redLight = material('Toxicology deep red containment marker', '#bd4640', { emissive: '#b01915', emissiveIntensity: 2.0, roughness: 0.12, metalness: 0.04 });
  const greenLight = material('Toxicology narrow green instrument indicator', '#c4efce', { emissive: '#46aa66', emissiveIntensity: 1.7, roughness: 0.12, metalness: 0.03 });
  const cobaltLight = material('Toxicology cobalt microfluidic node light', '#c3d8ff', { emissive: '#416bbd', emissiveIntensity: 2.05, roughness: 0.12, metalness: 0.03 });
  [whiteLight, amberLight, redLight, greenLight, cobaltLight].forEach((value) => { value.userData.isDistrictAccent = true; });
  return { paleCeramic, whiteConcrete, graphite, basalt, titanium, stainless, weatheredSteel, oxidizedCopper, cobalt, glass, graphiteGlass, translucent, mineralGlass, paving, servicePaving, blackResin, gravel, moss, lichen, wetland, silverGrass, water, whiteLight, amberLight, redLight, greenLight, cobaltLight };
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
  const value = prepare(new THREE.Mesh(BOX, mat), name, obstacle);
  value.scale.set(...size); value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function roundedBox(parent: THREE.Object3D, name: string, size: readonly [number, number, number], radius: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const value = prepare(new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius), mat), name, obstacle);
  value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function cylinder(parent: THREE.Object3D, name: string, diameter: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 24, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const geometry = segments === 6 ? CYLINDER_6 : segments === 8 ? CYLINDER_8 : segments === 12 ? CYLINDER_12 : CYLINDER_24;
  const value = prepare(new THREE.Mesh(geometry, mat), name, obstacle);
  value.scale.set(diameter, height, diameter); value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function taper(parent: THREE.Object3D, name: string, bottomDiameter: number, topDiameter: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 4, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const value = prepare(new THREE.Mesh(new THREE.CylinderGeometry(topDiameter * 0.5, bottomDiameter * 0.5, height, segments), mat), name, obstacle);
  value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function sphere(parent: THREE.Object3D, name: string, scale: readonly [number, number, number], mat: THREE.Material, position: readonly [number, number, number], obstacle = false) {
  const value = prepare(new THREE.Mesh(SPHERE, mat), name, obstacle);
  value.scale.set(...scale); value.position.set(...position); parent.add(value); return value;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, mat: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0], arc = Math.PI * 2, obstacle = false, radialSegments = 6, tubularSegments = 32) {
  const key = `${radius.toFixed(3)}:${tube.toFixed(3)}:${arc.toFixed(3)}:${radialSegments}:${tubularSegments}`;
  let geometry = TORUS_CACHE.get(key);
  if (!geometry) { geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc); TORUS_CACHE.set(key, geometry); }
  const value = prepare(new THREE.Mesh(geometry, mat), name, obstacle);
  value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function pipe(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, radius: number, mat: THREE.Material, obstacle = false) {
  const vector = end.clone().sub(start); const value = prepare(new THREE.Mesh(CYLINDER_12, mat), name, obstacle);
  value.position.copy(start).add(end).multiplyScalar(0.5); value.scale.set(radius * 2, vector.length(), radius * 2); value.quaternion.setFromUnitVectors(Y_AXIS, vector.normalize()); parent.add(value); return value;
}

function slabBetween(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, width: number, height: number, mat: THREE.Material, obstacle = false) {
  const vector = end.clone().sub(start); const value = prepare(new THREE.Mesh(BOX, mat), name, obstacle);
  value.position.copy(start).add(end).multiplyScalar(0.5); value.scale.set(width, height, vector.length()); value.quaternion.setFromUnitVectors(Z_AXIS, vector.normalize()); parent.add(value); return value;
}

function pulse<T extends THREE.Object3D>(object: T, speed: number, phase = 0, minIntensity = 0.06, maxIntensity = 2.5) {
  object.userData.animate = 'toxicology-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate<T extends THREE.Object3D>(object: T, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'toxicology-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function ellipseSegments(parent: THREE.Object3D, prefix: string, radiusX: number, radiusZ: number, y: number, height: number, depth: number, segments: number, mat: THREE.Material, rotationOffset = 0, obstacle = false, start = 0, arc = Math.PI * 2) {
  for (let index = 0; index < segments; index += 1) {
    const a0 = start + arc * index / segments + rotationOffset; const a1 = start + arc * (index + 1) / segments + rotationOffset; const angle = (a0 + a1) * 0.5;
    const x = Math.cos(angle) * radiusX; const z = Math.sin(angle) * radiusZ; const tangentX = -Math.sin(angle) * radiusX; const tangentZ = Math.cos(angle) * radiusZ;
    const length = Math.hypot(tangentX, tangentZ) * arc / segments * 1.07; const rotationY = -Math.atan2(tangentZ, tangentX);
    box(parent, `${prefix}_${index + 1}`, [length, height, depth], mat, [x, y + height * 0.5, z], obstacle, [0, rotationY, 0]);
  }
}

function ribbonGeometry(points: readonly THREE.Vector3[], width: number) {
  const vertices: number[] = []; const indices: number[] = [];
  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5);
    vertices.push(point.x + normal.x, point.y, point.z + normal.z, point.x - normal.x, point.y, point.z - normal.z);
    if (index < points.length - 1) { const base = index * 2; indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); }
  });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function ribbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, mat: THREE.Material, walkable = true) {
  const value = prepare(new THREE.Mesh(ribbonGeometry(points, width), mat), name); value.userData.walkable = walkable; value.userData.navObstacle = false; value.userData.toxicologyRoute = true; value.receiveShadow = true; parent.add(value); return value;
}

function createExposoma(m: Materials) {
  const root = new THREE.Group(); root.name = 'TOXICOLOGY__T1__EXPOSOMA';
  const rings = [
    { rx: 7.5, rz: 4.2, y: 0.08, h: 0.62, mat: m.basalt, rotation: -0.08 },
    { rx: 6.95, rz: 3.9, y: 0.68, h: 0.54, mat: m.paleCeramic, rotation: 0.05 },
    { rx: 6.4, rz: 3.6, y: 1.2, h: 0.5, mat: m.whiteConcrete, rotation: -0.045 },
    { rx: 5.86, rz: 3.3, y: 1.68, h: 0.46, mat: m.glass, rotation: 0.075 },
    { rx: 5.34, rz: 3.0, y: 2.12, h: 0.42, mat: m.graphiteGlass, rotation: -0.02 },
  ];
  rings.forEach((ring, index) => {
    const assembly = new THREE.Group(); assembly.name = `TOXICOLOGY__T1__EXPOSURE_TIMESCALE_RING_${index + 1}`; root.add(assembly);
    ellipseSegments(assembly, `${assembly.name}__STRUCTURAL_SEGMENT`, ring.rx, ring.rz, ring.y, ring.h, 0.88, 24, ring.mat, ring.rotation, true);
    ellipseSegments(assembly, `${assembly.name}__NIGHT_OUTLINE`, ring.rx + 0.035, ring.rz + 0.035, ring.y + ring.h * 0.54, 0.055, 0.94, 24, index === 4 ? m.whiteLight : index % 2 ? m.amberLight : m.whiteLight, ring.rotation);
  });
  for (let ribbonIndex = 0; ribbonIndex < 44; ribbonIndex += 1) {
    const angle = ribbonIndex / 44 * Math.PI * 2; const radiusX = 7.78; const radiusZ = 4.46; const x = Math.cos(angle) * radiusX; const z = Math.sin(angle) * radiusZ;
    box(root, `TOXICOLOGY__T1__TENSIONED_TITANIUM_ANALYTICAL_RIBBON_${ribbonIndex + 1}`, [0.07, 2.32 - (ribbonIndex % 5) * 0.1, 0.5], m.titanium, [x, 1.33, z], false, [0, -angle, (ribbonIndex % 7 - 3) * 0.012]);
    if (ribbonIndex % 3 === 0) for (let mark = 0; mark < 4; mark += 1) box(root, `TOXICOLOGY__T1__SPECTRAL_ENGRAVING_${ribbonIndex + 1}_${mark + 1}`, [0.085, 0.025, 0.54], m.graphite, [x, 0.58 + mark * 0.43, z], false, [0, -angle, 0]);
  }
  for (let aperture = 0; aperture < 36; aperture += 1) { const angle = aperture / 36 * Math.PI * 2; sphere(root, `TOXICOLOGY__T1__FACADE_SENSOR_APERTURE_${aperture + 1}`, [0.07, 0.07, 0.04], aperture % 8 ? m.graphite : m.greenLight, [Math.cos(angle) * 7.82, 0.82 + aperture % 4 * 0.37, Math.sin(angle) * 4.5]); }
  for (let band = 0; band < 5; band += 1) torus(root, `TOXICOLOGY__T1__FORECOURT_EXPOSURE_BAND_${band + 1}`, 1.8 + band * 0.62, 0.11, [m.stainless, m.paving, m.graphite, m.whiteConcrete, m.mineralGlass][band], [0, 0.055 + band * 0.004, 6.0], [Math.PI / 2, 0, 0], Math.PI * 2, false, 5, 40);
  for (let tray = 0; tray < 12; tray += 1) { const angle = tray / 12 * Math.PI * 2; box(root, `TOXICOLOGY__T1__REMOVABLE_BIOINDICATOR_TRAY_${tray + 1}`, [1.05, 0.14, 0.62], tray % 2 ? m.moss : m.lichen, [Math.cos(angle) * 4.2, 0.11, 6 + Math.sin(angle) * 2.2], false, [0, -angle, 0]); cylinder(root, `TOXICOLOGY__T1__BIOINDICATOR_TRAY_SENSOR_${tray + 1}`, 0.07, 0.46, tray % 4 ? m.titanium : m.greenLight, [Math.cos(angle) * 4.2 + 0.35, 0.3, 6 + Math.sin(angle) * 2.2], false, 8); }
  for (let channel = 0; channel < 5; channel += 1) { const x = -5.3 + channel * 2.65; box(root, `TOXICOLOGY__T1__MONITORED_RAINWATER_CHANNEL_${channel + 1}`, [0.18, 0.05, 5.2], m.blackResin, [x, 0.045, 5.2]); box(root, `TOXICOLOGY__T1__RAINWATER_MONITORING_GATE_${channel + 1}`, [0.52, 0.36, 0.16], m.stainless, [x, 0.2, 4.5]); }
  for (let pod = 0; pod < 10; pod += 1) { const x = -6.2 + pod * 1.38; cylinder(root, `TOXICOLOGY__T1__RETRACTABLE_SAMPLE_DELIVERY_POD_${pod + 1}`, 0.72, 1.4, pod % 2 ? m.titanium : m.graphite, [x, 0.72, -4.5], true, 12, [Math.PI / 2, 0, 0]); torus(root, `TOXICOLOGY__T1__DELIVERY_POD_STATUS_RING_${pod + 1}`, 0.38, 0.04, pod % 5 ? m.whiteLight : m.amberLight, [x, 0.72, -5.18], [0, 0, 0], Math.PI * 2, false, 5, 20); }
  const crown = new THREE.Group(); crown.name = 'TOXICOLOGY__T1__SAMPLING_CROWN'; crown.position.y = 2.54; root.add(crown);
  for (let instrument = 0; instrument < 32; instrument += 1) { const angle = instrument / 32 * Math.PI * 2; const radius = 2.1 + instrument % 4 * 0.72; const height = 0.46 + instrument % 5 * 0.15; cylinder(crown, `TOXICOLOGY__T1__SAMPLING_CROWN_INSTRUMENT_${instrument + 1}`, 0.12 + instrument % 3 * 0.045, height, instrument % 6 === 0 ? m.whiteLight : m.titanium, [Math.cos(angle) * radius, height * 0.5, Math.sin(angle) * radius * 0.68], false, instrument % 4 ? 8 : 12); if (instrument % 4 === 0) box(crown, `TOXICOLOGY__T1__DIRECTIONAL_AIR_SCOOP_${instrument + 1}`, [0.34, 0.16, 0.48], m.translucent, [Math.cos(angle) * radius, height + 0.1, Math.sin(angle) * radius * 0.68], false, [0, -angle, 0.18]); }
  for (let tower = 0; tower < 4; tower += 1) { const x = -3.6 + tower * 2.4; cylinder(root, `TOXICOLOGY__T1__TRANSLUCENT_EXHAUST_TOWER_${tower + 1}`, 0.92, 3.2 + tower % 2 * 0.45, m.translucent, [x, 4.1 + tower % 2 * 0.225, -1.9], true, 12); for (let ring = 0; ring < 3; ring += 1) torus(root, `TOXICOLOGY__T1__EXHAUST_STATE_RING_${tower + 1}_${ring + 1}`, 0.53, 0.045, ring === 2 && tower === 3 ? m.amberLight : m.whiteLight, [x, 3.0 + ring * 0.72, -1.9], [Math.PI / 2, 0, 0], Math.PI * 2, false, 5, 22); }
  return root;
}

function createMimesis(m: Materials) {
  const root = new THREE.Group(); root.name = 'TOXICOLOGY__T2__MIMESIS';
  const crescentStarts = [0.16, 1.22, 2.28];
  crescentStarts.forEach((start, system) => {
    const part = new THREE.Group(); part.name = `TOXICOLOGY__T2__CRESCENT_SYSTEM_${system + 1}`; root.add(part);
    ellipseSegments(part, `${part.name}__CERAMIC_BASE`, 7.1, 4.3, 0.08, 0.9, 1.15, 9, m.paleCeramic, 0, true, start, 0.88);
    ellipseSegments(part, `${part.name}__RESEARCH_GLASS_BAND`, 7.12, 4.32, 0.96, 1.28, 1.2, 9, m.glass, 0, true, start, 0.88);
    ellipseSegments(part, `${part.name}__VERTEBRAL_ROOF`, 7.0, 4.18, 2.22, 0.52, 1.28, 9, system % 2 ? m.whiteConcrete : m.titanium, 0, false, start, 0.88);
  });
  roundedBox(root, 'TOXICOLOGY__T2__DARK_RESTRICTED_SERVICE_SPINE', [14.5, 2.52, 1.28], 0.18, m.graphite, [0, 1.34, -4.02], true);
  box(root, 'TOXICOLOGY__T2__AIR_MONITORING_ROOF_DECK', [14.72, 0.18, 1.48], m.whiteConcrete, [0, 2.64, -4.02]);
  for (const [deckIndex, z] of [-2.5, 1.2].entries()) {
    box(root, `TOXICOLOGY__T2__ROOF_LANTERN_SUPPORT_DECK_${deckIndex + 1}`, [14.2, 0.22, 0.92], deckIndex === 0 ? m.titanium : m.whiteConcrete, [0, 2.92, z]);
    for (let support = 0; support < 6; support += 1) {
      const x = -6.25 + support * 2.5;
      cylinder(root, `TOXICOLOGY__T2__ROOF_LANTERN_DECK_COLUMN_${deckIndex + 1}_${support + 1}`, 0.16, 2.84, support % 2 ? m.paleCeramic : m.graphite, [x, 1.5, z], true, 8);
      pipe(root, `TOXICOLOGY__T2__ROOF_LANTERN_DIAGONAL_BRACE_${deckIndex + 1}_${support + 1}`, new THREE.Vector3(x, 2.42, z), new THREE.Vector3(x + (support % 2 ? 0.52 : -0.52), 2.88, z), 0.04, m.titanium);
    }
  }
  for (let bridge = 0; bridge < 9; bridge += 1) { const angle = crescentStarts[bridge % 3] + 0.9; const y = 1.18 + Math.floor(bridge / 3) * 0.55; const start = new THREE.Vector3(Math.cos(angle) * 5.6, y, Math.sin(angle) * 3.3); const end = new THREE.Vector3(Math.cos(angle + 0.24) * 5.6, y, Math.sin(angle + 0.24) * 3.3); slabBetween(root, `TOXICOLOGY__T2__TRANSPARENT_CAPILLARY_BRIDGE_${bridge + 1}`, start, end, 0.34, 0.24, m.glass); }
  for (let channel = 0; channel < 36; channel += 1) {
    const x = -6.6 + channel % 12 * 1.2; const baseY = 0.55 + Math.floor(channel / 12) * 0.62; const start = new THREE.Vector3(x, baseY, 4.55); const fork = new THREE.Vector3(x + (channel % 2 ? 0.34 : -0.34), baseY + 0.48, 4.62); const end = new THREE.Vector3(x + (channel % 3 - 1) * 0.45, baseY + 0.9, 4.58);
    pipe(root, `TOXICOLOGY__T2__MICROFLUIDIC_CHANNEL_${channel + 1}_A`, start, fork, 0.025, channel % 5 ? m.cobaltLight : m.oxidizedCopper); pipe(root, `TOXICOLOGY__T2__MICROFLUIDIC_CHANNEL_${channel + 1}_B`, fork, end, 0.03, channel % 5 ? m.cobaltLight : m.oxidizedCopper);
    if (channel % 2 === 0) pulse(sphere(root, `TOXICOLOGY__T2__ILLUMINATED_MEASUREMENT_NODE_${channel + 1}`, [0.12, 0.12, 0.08], (channel % 6 ? m.cobaltLight : m.amberLight).clone(), [fork.x, fork.y, fork.z]), 0.0018, channel * 0.19, 0.04, 1.65);
  }
  for (let column = 0; column < 18; column += 1) { const x = -6.8 + column * 0.8; const base = new THREE.Vector3(x, 0.08, 5.55 + Math.sin(column * 0.7) * 0.18); const joint = new THREE.Vector3(x, 1.34, base.z); pipe(root, `TOXICOLOGY__T2__CAPILLARY_COLUMN_${column + 1}`, base, joint, 0.055, m.paleCeramic, true); for (const side of [-1, 1]) pipe(root, `TOXICOLOGY__T2__BRANCHING_COLUMN_ARM_${column + 1}_${side < 0 ? 'L' : 'R'}`, joint, new THREE.Vector3(x + side * 0.28, 2.05, base.z + 0.1), 0.038, column % 4 ? m.paleCeramic : m.whiteLight); }
  box(root, 'TOXICOLOGY__T2__FIFTY_METRE_CANTILEVER', [14.6, 0.58, 2.1], m.whiteConcrete, [0, 2.28, 5.3], true);
  box(root, 'TOXICOLOGY__T2__REFLECTIVE_LIQUID_UNDERSIDE', [14.2, 0.05, 1.9], m.blackResin, [0, 1.97, 5.3]);
  for (let lantern = 0; lantern < 18; lantern += 1) { const x = -6.5 + lantern % 9 * 1.62; const z = -2.5 + Math.floor(lantern / 9) * 3.7; box(root, `TOXICOLOGY__T2__MICROSCOPE_SLIDE_ROOF_LANTERN_${lantern + 1}`, [1.1, 0.48, 0.44], lantern % 4 ? m.translucent : m.cobalt, [x, 3.2, z], false, [0.18, 0, lantern % 2 ? 0.08 : -0.08]); }
  for (let tower = 0; tower < 8; tower += 1) { const x = -5.8 + tower * 1.66; torus(root, `TOXICOLOGY__T2__AIR_MONITORING_TOWER_BASE_FLANGE_${tower + 1}`, 0.38, 0.06, m.stainless, [x, 2.73, -3.5], [Math.PI / 2, 0, 0], Math.PI * 2, false, 5, 20); cylinder(root, `TOXICOLOGY__T2__REDUNDANT_AIR_MONITORING_TOWER_${tower + 1}`, 0.62, 2.6 + tower % 3 * 0.32, m.translucent, [x, 3.9 + tower % 3 * 0.16, -3.5], true, 8); box(root, `TOXICOLOGY__T2__PRESSURE_STATE_BAND_${tower + 1}`, [0.68, 0.09, 0.68], tower % 5 ? m.whiteLight : m.amberLight, [x, 4.12 + tower % 3 * 0.32, -3.5]); }
  for (let dock = 0; dock < 8; dock += 1) { const x = -6.0 + dock * 1.72; box(root, `TOXICOLOGY__T2__SECONDARY_CONTAINMENT_SHUTTER_${dock + 1}`, [0.68, 1.25, 0.18], m.graphiteGlass, [x, 1.0, -4.68], true); torus(root, `TOXICOLOGY__T2__SEALED_TRANSFER_DOCK_COLLAR_${dock + 1}`, 0.42, 0.11, m.stainless, [x, 1.0, -4.79], [0, 0, 0], Math.PI * 2, true, 7, 20); }
  const streamPoints = Array.from({ length: 48 }, (_, index) => { const t = index / 47; const x = -7.3 + t * 14.6; return new THREE.Vector3(x, 0.052, 6.7 + Math.sin(t * Math.PI * 2) * 0.55); });
  ribbon(root, 'TOXICOLOGY__T2__CLOSED_MICROFLUIDIC_LANDSCAPE_STREAM', streamPoints, 0.62, m.water, false);
  for (let island = 0; island < 7; island += 1) { const point = streamPoints[5 + island * 6]; cylinder(root, `TOXICOLOGY__T2__FLOATING_OBSERVATION_PLATFORM_${island + 1}`, 1.05, 0.1, m.paving, [point.x, 0.13, point.z], false, 24); torus(root, `TOXICOLOGY__T2__PLATFORM_BOUNDARY_LIGHT_${island + 1}`, 0.43, 0.035, island % 3 ? m.whiteLight : m.amberLight, [point.x, 0.2, point.z], [Math.PI / 2, 0, 0], Math.PI * 2, false, 5, 22); }
  return root;
}

function createCausalityArray(m: Materials) {
  const root = new THREE.Group(); root.name = 'TOXICOLOGY__T3__CAUSALITY_ARRAY';
  const towerPositions = [new THREE.Vector3(-2.45, 0, 1.2), new THREE.Vector3(2.45, 0, 1.2), new THREE.Vector3(0, 0, -2.45)];
  const heights = [8.7, 9.6, 10.1];
  towerPositions.forEach((position, tower) => { const prism = box(root, `TOXICOLOGY__T3__CAUSAL_PRISM_TOWER_${tower + 1}`, [3.0, heights[tower], 3.25], m.graphiteGlass, [position.x, heights[tower] * 0.5 + 0.15, position.z], true, [0, tower * Math.PI * 2 / 3 + 0.12, tower === 0 ? 0.055 : tower === 1 ? -0.055 : 0.04]); prism.userData.causalEvidenceRole = ['chemical-exposure', 'biological-response', 'predicted-outcome'][tower]; for (let band = 0; band < 7; band += 1) box(root, `TOXICOLOGY__T3__PRISM_STRUCTURAL_BAND_${tower + 1}_${band + 1}`, [3.2, 0.09, 3.4], band % 3 ? m.graphite : m.stainless, [position.x, 1.1 + band * 1.15, position.z], false, [0, tower * Math.PI * 2 / 3 + 0.12, 0]); });
  cylinder(root, 'TOXICOLOGY__T3__TRIANGULAR_VOID_REFLECTION_PLANE', 5.6, 0.08, m.blackResin, [0, 0.06, 0], false, 3, [0, Math.PI / 6, 0]);
  for (let bridge = 0; bridge < 6; bridge += 1) { const from = towerPositions[bridge % 3].clone().setY(3.2 + Math.floor(bridge / 3) * 2.5); const to = towerPositions[(bridge + 1) % 3].clone().setY(from.y + (bridge % 2 ? 0.25 : -0.1)); slabBetween(root, `TOXICOLOGY__T3__SUSPENDED_EVIDENCE_BRIDGE_${bridge + 1}`, from, to, 0.48, 0.28, bridge % 2 ? m.glass : m.stainless); }
  const nodes: THREE.Vector3[] = [];
  for (let node = 0; node < 45; node += 1) { const tower = node % 3; const base = towerPositions[tower]; const angle = tower * Math.PI * 2 / 3 + (node % 2 ? 0.28 : -0.28); const radius = 1.78; const position = new THREE.Vector3(base.x + Math.cos(angle) * radius, 0.85 + Math.floor(node / 3) * 0.58, base.z + Math.sin(angle) * radius); nodes.push(position); const size = node % 11 === 0 ? 0.34 : node % 5 === 0 ? 0.24 : 0.14; sphere(root, `TOXICOLOGY__T3__CAUSAL_NETWORK_NODE_${node + 1}`, [size, size, size * 0.55], node % 9 === 0 ? m.amberLight : node % 3 ? m.paleCeramic : m.whiteLight, [position.x, position.y, position.z]); }
  for (let connection = 0; connection < 52; connection += 1) { const start = nodes[connection % nodes.length]; const end = nodes[(connection * 7 + 11) % nodes.length]; if (start.distanceTo(end) < 5.5) pipe(root, `TOXICOLOGY__T3__CAUSAL_NETWORK_CONNECTION_${connection + 1}`, start, end, 0.018, connection % 6 ? m.stainless : m.whiteLight); }
  box(root, 'TOXICOLOGY__T3__ASSAY_DECK', [12.4, 1.82, 4.0], m.paleCeramic, [0, 1.0, -5.3], true);
  for (let panel = 0; panel < 96; panel += 1) { const col = panel % 24; const row = Math.floor(panel / 24); const x = -5.75 + col * 0.5; const y = 0.45 + row * 0.37; box(root, `TOXICOLOGY__T3__ASSAY_TRANSFER_PANEL_${panel + 1}`, [0.36, 0.28, 0.09], panel % 13 === 0 ? m.amberLight : panel % 5 ? m.graphite : m.stainless, [x, y, -7.34]); }
  box(root, 'TOXICOLOGY__T3__ARMOURED_COURIER_TRACK', [12.6, 0.42, 0.7], m.glass, [0, 2.18, -5.3]);
  for (let carrier = 0; carrier < 8; carrier += 1) box(root, `TOXICOLOGY__T3__SEALED_AUTONOMOUS_COURIER_${carrier + 1}`, [0.58, 0.28, 0.48], carrier % 3 ? m.titanium : m.amberLight, [-5.2 + carrier * 1.48, 2.18, -5.3]);
  for (let shell = 0; shell < 9; shell += 1) roundedBox(root, `TOXICOLOGY__T3__INSTRUMENT_COOLING_SHELL_${shell + 1}`, [1.0, 0.6, 1.7], 0.25, m.graphite, [-4.8 + shell * 1.2, 2.62, -5.2], false, [0, 0, -0.08]);
  for (let route = 0; route < 13; route += 1) { const angle = route / 13 * Math.PI * 2; const start = new THREE.Vector3(Math.cos(angle) * 0.7, 0.12, Math.sin(angle) * 0.7); const end = new THREE.Vector3(Math.cos(angle) * (4.3 + route % 3 * 0.8), 0.12, Math.sin(angle) * (4.3 + route % 3 * 0.8)); pipe(root, `TOXICOLOGY__T3__DIRECTED_GRAPH_PATH_${route + 1}`, start, end, 0.055, route % 4 ? m.stainless : m.whiteLight); cylinder(root, `TOXICOLOGY__T3__DIRECTED_GRAPH_STONE_NODE_${route + 1}`, 0.72 + route % 3 * 0.18, 0.1, m.whiteConcrete, [end.x, 0.09, end.z], false, 24); }
  cylinder(root, 'TOXICOLOGY__T3__MOLECULAR_INITIATION_POINT', 2.2, 0.12, m.stainless, [0, 0.1, 5.0], false, 32);
  cylinder(root, 'TOXICOLOGY__T3__MOLECULAR_INITIATION_MIST_COLUMN', 0.18, 2.8, m.translucent, [0, 1.5, 5.0], false, 12);
  cylinder(root, 'TOXICOLOGY__T3__MECHANICAL_CROWN_DISC', 3.0, 0.22, m.titanium, [-2.45, 9.1, 1.2], false, 32);
  for (let needle = 0; needle < 11; needle += 1) cylinder(root, `TOXICOLOGY__T3__ANTENNA_NEEDLE_${needle + 1}`, 0.06, 1.4 + needle % 4 * 0.32, m.stainless, [2.45 + (needle - 5) * 0.14, 10.1 + needle % 4 * 0.16, 1.2], false, 6);
  pulse(sphere(root, 'TOXICOLOGY__T3__OUTCOME_BEACON', [0.72, 0.72, 0.72], m.whiteLight.clone(), [0, 10.85, -2.45]), 0.0016, 0.7, 0.28, 3.5);
  return root;
}

function createPalimpsest(m: Materials) {
  const root = new THREE.Group(); root.name = 'TOXICOLOGY__T4__PALIMPSEST';
  for (let segment = 0; segment < 7; segment += 1) {
    const x = -7.25 + segment * 2.42; const z = (segment % 2 ? 0.26 : -0.18) + Math.abs(segment - 3) * 0.08; const height = 2.45 + segment % 3 * 0.32;
    const group = new THREE.Group(); group.name = `TOXICOLOGY__T4__CONTAINMENT_BASTION_SEGMENT_${segment + 1}`; root.add(group);
    roundedBox(group, `${group.name}__INNER_UHPC_SHELL`, [2.18, height, 7.6], 0.25, m.whiteConcrete, [x, height * 0.5 + 0.08, z], true);
    box(group, `${group.name}__REPLACEABLE_BASALT_ARMOUR`, [2.32, height * 0.78, 7.84], m.basalt, [x, height * 0.48, z - 0.12], true);
    for (let frame = 0; frame < 4; frame += 1) box(group, `${group.name}__EXPOSED_STAINLESS_FRAME_${frame + 1}`, [0.1, height * 0.72, 7.95], m.stainless, [x - 0.92 + frame * 0.62, height * 0.48, z - 0.13]);
    box(group, `${group.name}__DUAL_SHELL_INSPECTION_CUT`, [0.56, height * 0.64, 8.0], m.graphite, [x + 0.65, height * 0.48, z - 0.15]);
    for (let level = 0; level < 3; level += 1) box(group, `${group.name}__GEOLOGICAL_ROOF_STRATUM_${level + 1}`, [2.45, 0.18, 6.8 - level * 0.8], [m.basalt, m.weatheredSteel, m.paleCeramic][(segment + level) % 3], [x, height + 0.12 + level * 0.18, z + level * 0.15]);
  }
  for (let line = 0; line < 40; line += 1) { const x0 = -8.0 + line * 16 / 40; const x1 = -8.0 + (line + 1) * 16 / 40; const y0 = 2.32 - line * 1.72 / 40; const y1 = 2.32 - (line + 1) * 1.72 / 40; pipe(root, `TOXICOLOGY__T4__HALF_LIFE_DESCENDING_LINE_${line + 1}`, new THREE.Vector3(x0, y0, 4.08), new THREE.Vector3(x1, y1, 4.08), 0.035, line % 7 ? m.whiteLight : m.amberLight); }
  ['MINUTES', 'DAYS', 'YEARS', 'DECADES', 'CENTURIES'].forEach((label, index) => { const x = -7.2 + index * 3.6; box(root, `TOXICOLOGY__T4__HALF_LIFE_MARKER_${label}`, [0.06, 0.46, 0.22], m.stainless, [x, 2.05 - index * 0.34, 4.14]); box(root, `TOXICOLOGY__T4__MATERIAL_TIMESCALE_SAMPLE_${label}`, [1.1, 0.7, 0.42], [m.weatheredSteel, m.titanium, m.paleCeramic, m.whiteConcrete, m.basalt][index], [x, 0.42, 4.25]); });
  for (let tower = 0; tower < 7; tower += 1) { const x = -7.25 + tower * 2.42; const height = 3.8 + tower % 3 * 0.38; cylinder(root, `TOXICOLOGY__T4__FILTRATION_TOWER_${tower + 1}`, 1.18, height, m.graphite, [x, 3.1 + height * 0.5, -0.6 + tower % 2 * 0.28], true, 16); for (let cartridge = 0; cartridge < 4; cartridge += 1) torus(root, `TOXICOLOGY__T4__REPLACEABLE_SCRUBBER_CARTRIDGE_RING_${tower + 1}_${cartridge + 1}`, 0.72 + cartridge * 0.06, 0.07, cartridge % 2 ? m.stainless : m.titanium, [x, 2.6 + cartridge * 0.72, -0.6 + tower % 2 * 0.28], [Math.PI / 2, 0, 0], Math.PI * 2, false, 5, 24); torus(root, `TOXICOLOGY__T4__FILTRATION_STATUS_HALO_${tower + 1}`, 0.82, 0.09, tower === 5 ? m.amberLight : m.whiteLight, [x, 3.1 + height - 0.48, -0.6 + tower % 2 * 0.28], [Math.PI / 2, 0, 0], Math.PI * 2, false, 6, 28); }
  for (let window = 0; window < 14; window += 1) { const x = -7.45 + window * 1.15; box(root, `TOXICOLOGY__T4__MINERAL_INCLUSION_MONITORING_WINDOW_${window + 1}`, [0.62, 0.45, 0.12], m.mineralGlass, [x, 1.35 + window % 2 * 0.58, 4.16]); for (let particle = 0; particle < 3; particle += 1) sphere(root, `TOXICOLOGY__T4__TRAPPED_MINERAL_INCLUSION_${window + 1}_${particle + 1}`, [0.055, 0.055, 0.025], particle % 2 ? m.paleCeramic : m.graphite, [x - 0.18 + particle * 0.18, 1.35 + window % 2 * 0.58, 4.24]); }
  for (let dock = 0; dock < 3; dock += 1) { const x = -4.8 + dock * 4.8; box(root, `TOXICOLOGY__T4__RECESSED_SAMPLE_DOCK_${dock + 1}`, [3.0, 2.15, 1.5], m.graphite, [x, 1.2, -4.5], true); box(root, `TOXICOLOGY__T4__COVERED_DOCK_CHANNEL_${dock + 1}`, [3.2, 0.18, 4.2], m.whiteConcrete, [x, 2.55, -6.3], false); for (const side of [-1, 1]) box(root, `TOXICOLOGY__T4__DECONTAMINATION_FRAME_${dock + 1}_${side < 0 ? 'L' : 'R'}`, [0.22, 2.4, 0.3], m.stainless, [x + side * 1.28, 1.22, -6.6], true); box(root, `TOXICOLOGY__T4__DECONTAMINATION_SCANNER_${dock + 1}`, [2.8, 0.22, 0.42], dock === 1 ? m.amberLight : m.whiteLight, [x, 2.42, -6.6]); torus(root, `TOXICOLOGY__T4__CIRCULAR_TRANSFER_PORTAL_${dock + 1}`, 0.72, 0.15, m.stainless, [x, 1.25, -5.28], [0, 0, 0], Math.PI * 2, true, 7, 28); }
  for (let barrier = 0; barrier < 8; barrier += 1) box(root, `TOXICOLOGY__T4__LANDSCAPE_EMERGENCY_SHUTTER_${barrier + 1}`, [0.3, 0.12, 2.4], m.weatheredSteel, [-7.1 + barrier * 2.05, 0.08, -8.0]);
  box(root, 'TOXICOLOGY__T4__PUBLIC_BLACK_GRAVEL_SETBACK', [17.6, 0.08, 3.2], m.gravel, [0, 0.04, 6.0]);
  for (let basin = 0; basin < 10; basin += 1) { const x = -7.2 + basin % 5 * 3.6; const z = 7.8 + Math.floor(basin / 5) * 1.6; box(root, `TOXICOLOGY__T4__CLOSED_LOOP_WETLAND_BASIN_${basin + 1}`, [2.6, 0.12, 1.1], basin % 2 ? m.water : m.wetland, [x, 0.06, z]); cylinder(root, `TOXICOLOGY__T4__BASIN_SAMPLING_PORT_${basin + 1}`, 0.08, 0.52, basin % 4 ? m.titanium : m.greenLight, [x + 0.9, 0.28, z], false, 8); }
  return root;
}

function createMeridian(m: Materials) {
  const root = new THREE.Group(); root.name = 'TOXICOLOGY__T5__MERIDIAN';
  const wings = [
    { role: 'ABSORPTION', length: 10.8, angle: 0.12, height: 2.5 },
    { role: 'DISTRIBUTION', length: 9.2, angle: Math.PI * 0.58, height: 3.05 },
    { role: 'METABOLISM', length: 8.2, angle: Math.PI * 1.08, height: 2.75 },
    { role: 'ELIMINATION', length: 7.0, angle: Math.PI * 1.56, height: 2.2 },
  ];
  wings.forEach((wing, wingIndex) => {
    const direction = new THREE.Vector3(Math.cos(wing.angle), 0, Math.sin(wing.angle)); const center = direction.clone().multiplyScalar(wing.length * 0.5 - 0.3);
    const group = new THREE.Group(); group.name = `TOXICOLOGY__T5__TOXICOKINETIC_WING_${wingIndex + 1}_${wing.role}`; root.add(group);
    box(group, `${group.name}__GRAPHITE_UNDERSIDE`, [wing.length, 0.52, 3.15], m.graphite, [center.x, 0.45, center.z], true, [0, -wing.angle, 0]);
    box(group, `${group.name}__PALE_CERAMIC_BODY`, [wing.length * 0.94, wing.height, 2.82], m.paleCeramic, [center.x, 0.7 + wing.height * 0.5, center.z], true, [0, -wing.angle, wingIndex % 2 ? 0.015 : -0.015]);
    for (let aperture = 0; aperture < 24; aperture += 1) { const t = (aperture + 1) / 25; const along = direction.clone().multiplyScalar(t * (wing.length - 1.1)); const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(1.46); const y = 0.95 + (aperture % 4) * wing.height * 0.18; const light = aperture < 4 + wingIndex * 3 ? m.whiteLight : aperture % 7 === 0 ? m.amberLight : m.graphite; sphere(group, `${group.name}__DECAY_APERTURE_${aperture + 1}`, [0.1, 0.1, 0.05], light, [along.x + perpendicular.x, y, along.z + perpendicular.z]); }
    for (let seam = 0; seam < 6; seam += 1) { const along = direction.clone().multiplyScalar((seam + 1) / 7 * wing.length); const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x); pipe(group, `${group.name}__SEALED_MODULAR_JOINT_${seam + 1}`, along.clone().addScaledVector(perpendicular, -1.5).setY(0.62), along.clone().addScaledVector(perpendicular, 1.5).setY(0.62), 0.035, m.stainless); }
  });
  cylinder(root, 'TOXICOLOGY__T5__DOSE_CLOCK_TOWER', 4.2, 6.8, m.whiteConcrete, [0, 3.45, 0], true, 32);
  for (let fin = 0; fin < 40; fin += 1) { const angle = fin / 40 * Math.PI * 2; const radius = 2.36; const height = 4.9 + (fin % 8) * 0.22; box(root, `TOXICOLOGY__T5__DOSE_CLOCK_ROTATING_CERAMIC_FIN_${fin + 1}`, [0.12, height, 0.72], fin % 7 ? m.paleCeramic : m.titanium, [Math.cos(angle) * radius, 1.05 + height * 0.5, Math.sin(angle) * radius], false, [0, -angle, (fin % 5 - 2) * 0.012]); }
  box(root, 'TOXICOLOGY__T5__DOSE_CLOCK_READINESS_LINE', [0.16, 5.45, 0.12], m.whiteLight, [0, 3.62, 2.44]);
  const responseLoop = new THREE.Group(); responseLoop.name = 'TOXICOLOGY__T5__THREE_LANE_RESPONSE_LOOP'; root.add(responseLoop);
  for (let lane = 0; lane < 3; lane += 1) { const z = -6.0 - lane * 1.15; box(responseLoop, `TOXICOLOGY__T5__RESPONSE_LANE_${lane + 1}`, [13.5, 0.08, 0.92], m.servicePaving, [0, 0.04, z]); for (let joint = 0; joint < 13; joint += 1) box(responseLoop, `TOXICOLOGY__T5__SEALED_ROAD_JOINT_${lane + 1}_${joint + 1}`, [0.04, 0.012, 0.84], lane === 1 ? m.amberLight : m.stainless, [-6.0 + joint, 0.088, z]); }
  for (let canopy = 0; canopy < 3; canopy += 1) { const x = -4.8 + canopy * 4.8; const z = -7.15; for (const side of [-1, 1]) box(root, `TOXICOLOGY__T5__DECONTAMINATION_BLADE_PYLON_${canopy + 1}_${side < 0 ? 'L' : 'R'}`, [0.28, 2.65, 0.58], m.graphite, [x + side * 1.4, 1.34, z], true); box(root, `TOXICOLOGY__T5__DECONTAMINATION_CANOPY_${canopy + 1}`, [3.25, 0.24, 2.6], m.paleCeramic, [x, 2.72, z], false, [0, 0, -0.08]); for (let scanner = 0; scanner < 5; scanner += 1) cylinder(root, `TOXICOLOGY__T5__RETRACTABLE_SCANNING_ARRAY_${canopy + 1}_${scanner + 1}`, 0.08, 0.5, scanner % 2 ? m.stainless : m.amberLight, [x - 1.0 + scanner * 0.5, 2.38, z], false, 8); }
  for (let dock = 0; dock < 8; dock += 1) { const x = -5.6 + dock * 1.6; cylinder(root, `TOXICOLOGY__T5__FIELD_LAB_HEXAGONAL_DOCK_${dock + 1}`, 0.9, 0.16, m.graphite, [x, 1.2, -4.6], true, 6, [Math.PI / 2, 0, 0]); }
  for (let pad = 0; pad < 2; pad += 1) { const x = -3.4 + pad * 6.8; cylinder(root, `TOXICOLOGY__T5__ROOF_DRONE_PAD_${pad + 1}`, 2.7, 0.14, m.graphite, [x, 3.7 - pad * 0.35, 3.8], false, 32); torus(root, `TOXICOLOGY__T5__DRONE_GUIDANCE_RING_${pad + 1}`, 0.92, 0.07, pad ? m.amberLight : m.whiteLight, [x, 3.8 - pad * 0.35, 3.8], [Math.PI / 2, 0, 0], Math.PI * 2, false, 6, 28); }
  const mast = new THREE.Group(); mast.name = 'TOXICOLOGY__T5__ROTATING_PLUME_SENSOR_MAST'; mast.position.set(0, 6.9, 0); root.add(mast); cylinder(mast, 'TOXICOLOGY__T5__PLUME_SENSOR_AXIS', 0.18, 2.2, m.stainless, [0, 1.1, 0], false, 8); rotate(torus(mast, 'TOXICOLOGY__T5__SCIENTIFIC_COMPASS_RING', 1.15, 0.09, m.whiteLight, [0, 2.12, 0], [Math.PI / 2, 0, 0], Math.PI * 2, false, 6, 30), 0.018); for (let vane = 0; vane < 4; vane += 1) box(mast, `TOXICOLOGY__T5__METEOROLOGICAL_VANE_${vane + 1}`, [0.09, 0.12, 1.25], vane % 2 ? m.titanium : m.whiteLight, [0, 2.12, 0], false, [0, vane * Math.PI / 2, 0]);
  for (let exhaust = 0; exhaust < 6; exhaust += 1) taper(root, `TOXICOLOGY__T5__ANGLED_REDUNDANT_EXHAUST_${exhaust + 1}`, 0.48, 0.34, 2.4 + exhaust % 2 * 0.45, m.graphite, [-5.5 + exhaust * 2.2, 3.1 + exhaust % 2 * 0.225, -2.9], true, 8, [0.12, 0, exhaust % 2 ? 0.08 : -0.08]);
  torus(root, 'TOXICOLOGY__T5__HALF_LIFE_CIRCUIT', 5.8, 0.11, m.whiteLight, [0, 0.1, 0], [Math.PI / 2, 0, 0], Math.PI * 2, false, 6, 56);
  for (let marker = 0; marker < 24; marker += 1) { const angle = marker / 24 * Math.PI * 2; box(root, `TOXICOLOGY__T5__HALF_LIFE_DECAY_MARKER_${marker + 1}`, [0.1, 0.04, 0.34], marker < 7 ? m.whiteLight : marker < 15 ? m.amberLight : m.graphite, [Math.cos(angle) * 5.8, 0.15, Math.sin(angle) * 5.8], false, [0, -angle, 0]); }
  for (let pylon = 0; pylon < 4; pylon += 1) { const angle = pylon / 4 * Math.PI * 2 + Math.PI / 4; const x = Math.cos(angle) * 6.7; const z = Math.sin(angle) * 6.7; cylinder(root, `TOXICOLOGY__T5__COMPARTMENT_FLUID_PYLON_${pylon + 1}`, 0.5, 3.4, m.graphite, [x, 1.72, z], true, 12); cylinder(root, `TOXICOLOGY__T5__INERT_FLUID_COLUMN_${pylon + 1}`, 0.24, 2.5 - pylon * 0.3, [m.cobaltLight, m.amberLight, m.greenLight, m.whiteLight][pylon], [x, 1.35 - pylon * 0.15, z], false, 12); }
  slabBetween(root, 'TOXICOLOGY__T5__PHARMACOLOGY_ENCLOSED_BRIDGE', new THREE.Vector3(4.0, 3.0, 1.5), new THREE.Vector3(9.5, 3.0, 2.1), 0.9, 0.68, m.glass);
  slabBetween(root, 'TOXICOLOGY__T5__MEDICAL_SECURE_COURIER_BRIDGE', new THREE.Vector3(3.0, 2.45, -2.6), new THREE.Vector3(7.5, 2.45, -4.3), 0.45, 0.34, m.graphiteGlass);
  for (let branch = 0; branch < 6; branch += 1) pipe(root, `TOXICOLOGY__T5__METABOLIC_BRIDGE_SUPPORT_${branch + 1}`, new THREE.Vector3(4.0 + branch * 0.62, 0.12, 1.2 + branch * 0.12), new THREE.Vector3(4.2 + branch * 0.78, 2.65 + branch % 2 * 0.25, 1.55 + branch * 0.1), 0.08, branch % 2 ? m.titanium : m.graphite, true);
  return root;
}

function assignBuildingMetadata(root: THREE.Group, record: ToxicologyBuildingProgram) {
  root.userData.exteriorProgram = true;
  root.userData.buildingCode = record.code;
  root.userData.buildingName = record.name;
  root.userData.buildingSubtitle = record.subtitle;
  root.userData.purpose = record.focus;
  root.userData.footprintMetres = [...record.footprintMetres];
  root.userData.heightMetres = record.heightMetres;
  root.userData.scientificSequence = record.sequence;
  root.userData.exteriorMotif = record.exteriorSignature;
  root.userData.navObstacle = true;
  root.traverse((object) => { object.userData.selectableId = DISTRICT_ID; object.userData.districtId = DISTRICT_ID; });
  return root;
}

function createBuilding(record: ToxicologyBuildingProgram, materials: Materials) {
  const factories: Record<ToxicologyBuildingForm, (materials: Materials) => THREE.Group> = { exposoma: createExposoma, mimesis: createMimesis, 'causality-array': createCausalityArray, palimpsest: createPalimpsest, meridian: createMeridian };
  return assignBuildingMetadata(factories[record.form](materials), record);
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radialMargin = 8.5; const angularMargin = (sector.endAngle - sector.startAngle) * 0.16;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT);
  const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
  return new THREE.Vector3(Math.cos(angle) * radius - definition.position[0], y, Math.sin(angle) * radius - definition.position[2]);
}

function districtArc(definition: DistrictDefinition, radialT: number, startAngularT: number, endAngularT: number, segments: number, y = FLOOR_Y) {
  return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, radialT, THREE.MathUtils.lerp(startAngularT, endAngularT, index / (segments - 1)), y));
}

function nearestPoint(points: readonly THREE.Vector3[], target: THREE.Vector3) {
  return points.reduce((closest, point) => point.distanceToSquared(target) < closest.distanceToSquared(target) ? point : closest, points[0]);
}

function addDistrictInfrastructure(district: THREE.Group, definition: DistrictDefinition, m: Materials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'TOXICOLOGY__DISTRICT_INFRASTRUCTURE'; district.add(infrastructure);
  const promenade = districtArc(definition, 0.035, 0.02, 0.98, 176, FLOOR_Y + 0.004);
  ribbon(infrastructure, 'TOXICOLOGY__DOSE_RESPONSE_PROMENADE', promenade, 2.35, m.paving, true);
  const promenadeLight = districtArc(definition, 0.035, 0.02, 0.98, 176, FLOOR_Y + 0.026);
  pulse(ribbon(infrastructure, 'TOXICOLOGY__DOSE_RESPONSE_LIGHT_CURVE', promenadeLight, 0.08, m.whiteLight.clone(), false), 0.0014, 0.2, 0.18, 1.55);
  const serviceRoad = districtArc(definition, 0.965, 0.025, 0.975, 176, FLOOR_Y - 0.015);
  ribbon(infrastructure, 'TOXICOLOGY__RESTRICTED_OUTER_SERVICE_ROAD', serviceRoad, 3.45, m.servicePaving, false);
  const sampleLane = districtArc(definition, 0.875, 0.03, 0.97, 168, FLOOR_Y - 0.006);
  ribbon(infrastructure, 'TOXICOLOGY__SEALED_SAMPLE_COURIER_LANE', sampleLane, 0.82, m.graphite, false);
  const emergencyLane = districtArc(definition, 0.78, 0.58, 0.98, 88, FLOOR_Y - 0.002);
  ribbon(infrastructure, 'TOXICOLOGY__MERIDIAN_EMERGENCY_ACCESS_AVENUE', emergencyLane, 2.65, m.servicePaving, false);
  for (let station = 0; station < 24; station += 1) { const index = Math.floor((station + 0.5) / 24 * (promenade.length - 1)); const point = promenade[index]; const previous = promenade[Math.max(0, index - 1)]; const next = promenade[Math.min(promenade.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x); const base = point.clone().addScaledVector(normal, station % 2 ? 1.5 : -1.5); cylinder(infrastructure, `TOXICOLOGY__PROMENADE_INSTRUMENT_PYLON_${station + 1}`, 0.1, 1.05, m.graphite, [base.x, 0.54, base.z], false, 8); pulse(box(infrastructure, `TOXICOLOGY__PROMENADE_STATUS_LIGHT_${station + 1}`, [0.12, 0.1, 0.1], (station % 7 ? m.whiteLight : m.amberLight).clone(), [base.x, 1.08, base.z]), 0.0015, station * 0.22, 0.05, 1.45); }
  for (let tower = 0; tower < 12; tower += 1) { const index = Math.floor((tower + 0.5) / 12 * (serviceRoad.length - 1)); const point = serviceRoad[index]; cylinder(infrastructure, `TOXICOLOGY__INDEPENDENT_AIR_HANDLING_TOWER_${tower + 1}`, 0.72, 3.2 + tower % 4 * 0.4, m.graphite, [point.x, 1.62 + tower % 4 * 0.2, point.z], true, 12); torus(infrastructure, `TOXICOLOGY__AIR_HANDLING_STATUS_HALO_${tower + 1}`, 0.46, 0.055, tower % 6 ? m.whiteLight : m.amberLight, [point.x, 3.0 + tower % 4 * 0.4, point.z], [Math.PI / 2, 0, 0], Math.PI * 2, false, 5, 22); }
  for (let gate = 0; gate < 5; gate += 1) { const point = serviceRoad[Math.floor((gate + 0.5) / 5 * (serviceRoad.length - 1))]; box(infrastructure, `TOXICOLOGY__WASTE_TRANSFER_ISOLATION_GATE_${gate + 1}`, [2.2, 0.12, 1.2], m.weatheredSteel, [point.x, FLOOR_Y + 0.05, point.z]); for (const side of [-1, 1]) cylinder(infrastructure, `TOXICOLOGY__WASTE_GATE_MONITOR_${gate + 1}_${side < 0 ? 'L' : 'R'}`, 0.1, 1.2, side < 0 ? m.titanium : m.redLight, [point.x + side * 1.2, 0.6, point.z], false, 8); }
  return { infrastructure, promenade, serviceRoad };
}

function addDistrictLandscape(district: THREE.Group, definition: DistrictDefinition, m: Materials) {
  const landscape = new THREE.Group(); landscape.name = 'TOXICOLOGY__CONTROLLED_MONITORING_LANDSCAPE'; district.add(landscape);
  for (let garden = 0; garden < 20; garden += 1) { const point = pointInDistrict(definition, 0.28 + garden % 4 * 0.13, 0.08 + Math.floor(garden / 4) / 4 * 0.84, FLOOR_Y + 0.012); box(landscape, `TOXICOLOGY__BIOINDICATOR_GARDEN_TRAY_${garden + 1}`, [1.4 + garden % 3 * 0.35, 0.14, 0.85], garden % 3 === 0 ? m.lichen : garden % 3 === 1 ? m.moss : m.silverGrass, [point.x, point.y, point.z], false, [0, garden * 0.21, 0]); cylinder(landscape, `TOXICOLOGY__BIOINDICATOR_SENSOR_${garden + 1}`, 0.07, 0.62, garden % 5 ? m.titanium : m.greenLight, [point.x + 0.55, 0.32, point.z + 0.2], false, 8); }
  for (let basin = 0; basin < 12; basin += 1) { const point = pointInDistrict(definition, 0.66, 0.08 + basin / 11 * 0.84, FLOOR_Y + 0.008); box(landscape, `TOXICOLOGY__CLOSED_LOOP_MONITORING_BASIN_${basin + 1}`, [2.0, 0.1, 1.05], basin % 2 ? m.water : m.wetland, [point.x, point.y, point.z], false, [0, basin * 0.16, 0]); }
  for (let target = 0; target < 10; target += 1) { const point = pointInDistrict(definition, 0.56, 0.08 + target / 9 * 0.84, FLOOR_Y + 0.02); cylinder(landscape, `TOXICOLOGY__PERIMETER_EXPOSURE_SENSOR_${target + 1}`, 0.1, 1.4 + target % 3 * 0.2, target % 4 ? m.stainless : m.whiteLight, [point.x, 0.7 + target % 3 * 0.1, point.z], false, 8); }
  return landscape;
}

export function buildToxicologyLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Toxicology Labs District requires a masterplan sector');
  const materials = createMaterials();
  const { infrastructure, promenade } = addDistrictInfrastructure(district, definition, materials);
  const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = TOXICOLOGY_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials); const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02); building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT };
    district.add(building); return building;
  });
  facilities.forEach((facility, index) => {
    const record = TOXICOLOGY_BUILDING_PROGRAM[index]; const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, Math.min(7.2, record.footprintMetres[1] / 20 + 0.9)); const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const routePoint = nearestPoint(promenade, entrance).clone().setY(FLOOR_Y + 0.012); const radialDogleg = routePoint.clone().lerp(entrance, 0.5); radialDogleg.x += index % 2 ? 0.34 : -0.34;
    ribbon(infrastructure, `TOXICOLOGY__BUILDING_APPROACH_${record.code}`, [routePoint, radialDogleg, entrance], 0.92, materials.paving, true);
    pulse(ribbon(infrastructure, `TOXICOLOGY__BUILDING_APPROACH_DOSE_LINE_${record.code}`, [routePoint, radialDogleg, entrance].map((point) => point.clone().setY(FLOOR_Y + 0.028)), 0.045, (index === 3 ? materials.amberLight : materials.whiteLight).clone(), false), 0.0017, index * 0.43, 0.05, 1.1);
  });
  district.userData.toxicologyLabsDistrict = {
    identity: 'Toxicology Labs District — Dose, Mechanism and Countermeasure',
    mapLabel: 'Toxicology Labs',
    architecturalLanguage: 'immaculate ceramic scientific instruments, graphite containment structures, visible filtration, compartmentalized sample logistics, and limited status lighting without radioactive-lime spectacle',
    buildingCount: facilities.length,
    buildings: TOXICOLOGY_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, subtitle: record.subtitle, focus: record.focus, scientificSequence: record.sequence, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorSignature: record.exteriorSignature })),
    scientificSequence: [...TOXICOLOGY_BUILDING_PROGRAM].sort((left, right) => left.sequence - right.sequence).map((record) => record.name),
    functionalSequence: ['detect exposure', 'model causality', 'reproduce human effects', 'investigate persistent mixtures', 'develop countermeasures'],
    circulation: { primaryRoute: 'TOXICOLOGY__DOSE_RESPONSE_PROMENADE', restrictedOuterServiceRoad: 'TOXICOLOGY__RESTRICTED_OUTER_SERVICE_ROAD', sealedSampleCourierLane: 'TOXICOLOGY__SEALED_SAMPLE_COURIER_LANE', emergencyAccessAvenue: 'TOXICOLOGY__MERIDIAN_EMERGENCY_ACCESS_AVENUE', exactBuildingApproaches: 5, publicServiceSeparation: true },
    signatureSystems: { exposomaExposureRings: 5, exposomaSamplingInstruments: 32, mimesisCrescentSystems: 3, mimesisCapillaryColumns: 18, causalityPrismTowers: 3, causalityAssayPorts: 96, palimpsestVaultSegments: 7, palimpsestFiltrationTowers: 7, meridianToxicokineticWings: 4, meridianDecontaminationCanopies: 3 },
    containmentLandscape: { bioindicatorGardens: 20, monitoringBasins: 12, perimeterExposureSensors: 10, independentAirHandlingTowers: 12, wasteIsolationGates: 5 },
    lightingProtocol: { normal: 'cold white', maintenance: 'limited amber', containment: 'deep red perimeter markers', instrumentGreenOnly: true, radioactiveLimeWash: false },
    neighbourInterfaces: { pharmacologyBridge: 'TOXICOLOGY__T5__PHARMACOLOGY_ENCLOSED_BRIDGE', medicalCourierBridge: 'TOXICOLOGY__T5__MEDICAL_SECURE_COURIER_BRIDGE', omicsEvidenceInterface: true },
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: TOXICOLOGY_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: ['Dose–Response Promenade', 'restricted outer service road', 'sealed sample courier lane', 'Meridian emergency access avenue', 'bioindicator gardens', 'closed-loop monitoring basins', 'independent air-handling towers', 'waste-transfer isolation gates', 'sample delivery docks', 'decontamination frames'],
    realizedFeatureTags: TOXICOLOGY_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 9,
    radialCoverage: 0.96,
    angularCoverage: 0.96,
    exteriorOnly: true,
    doseMechanismCountermeasureNarrative: true,
    publicServiceSeparation: true,
    humanRelevantMethods: true,
  };
}
