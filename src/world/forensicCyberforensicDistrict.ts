import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type ForensicBuildingForm =
  | 'evidentia'
  | 'helix'
  | 'proteomic'
  | 'microbiome'
  | 'thanatoscan'
  | 'ridge'
  | 'isotope'
  | 'nanotrace'
  | 'ecological'
  | 'silicon'
  | 'malware'
  | 'network'
  | 'veritas'
  | 'quantum'
  | 'range';

export interface ForensicBuildingProgram {
  code: string;
  name: string;
  purpose: string;
  form: ForensicBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
}

export const FORENSIC_BUILDING_PROGRAM: readonly ForensicBuildingProgram[] = [
  { code: 'F1', name: 'Evidentia Nexus', purpose: 'Central Evidence Provenance and Chain-of-Custody Institute', form: 'evidentia', footprintMetres: [185, 105], heightMetres: 82, radialT: 0.18, angularT: 0.08, placementZone: 'Northern gateway toward the Security District', exteriorMotif: 'opposed basalt and white-ceramic monoliths divided by an amber provenance canyon' },
  { code: 'F2', name: 'Helix Trace Institute', purpose: 'Forensic Genomics, Epigenetics and Biological Identity Laboratory', form: 'helix', footprintMetres: [145, 115], heightMetres: 106, radialT: 0.12, angularT: 0.34, placementZone: 'Inner edge toward Bioanalytics', exteriorMotif: 'paired elliptical sequencing towers wrapped in variable ceramic nucleotide fins' },
  { code: 'F3', name: 'Proteomic Residue Observatory', purpose: 'Protein, Metabolite and Molecular Trace Analysis Center', form: 'proteomic', footprintMetres: [190, 92], heightMetres: 55, radialT: 0.16, angularT: 0.64, placementZone: 'Inner analytical band', exteriorMotif: 'a broad smoked-glass laboratory beneath a mass-spectrum roofline and droplet canopy' },
  { code: 'F4', name: 'Microbiome Provenance Conservatory', purpose: 'Microbial Forensics and Biological Geolocation Laboratory', form: 'microbiome', footprintMetres: [145, 125], heightMetres: 68, radialT: 0.18, angularT: 0.91, placementZone: 'Eastern academic interface', exteriorMotif: 'overlapping translucent microbial-colony cylinders around a sealed dark core' },
  { code: 'F5', name: 'Thanatoscan Monolith', purpose: 'Virtual Autopsy and Postmortem Imaging Institute', form: 'thanatoscan', footprintMetres: [90, 85], heightMetres: 132, radialT: 0.44, angularT: 0.17, placementZone: 'Quiet northern imaging court', exteriorMotif: 'an eleven-storey black monolith encircled by one ascending white scanning plane' },
  { code: 'F6', name: 'Ridge Morphology Institute', purpose: 'Latent Print, Biometric and Anatomical Identification Laboratory', form: 'ridge', footprintMetres: [145, 120], heightMetres: 54, radialT: 0.43, angularT: 0.37, placementZone: 'Central biometric transition', exteriorMotif: 'three titanium fingerprint-whorl walls enclosing a triangular calibration court' },
  { code: 'F7', name: 'Isotope Geolocation Spire', purpose: 'Stable-Isotope and Elemental Origin Analysis Center', form: 'isotope', footprintMetres: [95, 92], heightMetres: 148, radialT: 0.43, angularT: 0.64, placementZone: 'Southern boundary toward Inorganic Chemistry', exteriorMotif: 'a stratified triangular mineral spire pierced by elemental spectrum cuts' },
  { code: 'F8', name: 'Nanotrace Materials Foundry', purpose: 'Microparticle, Fiber, Fracture and Residue Analysis Complex', form: 'nanotrace', footprintMetres: [185, 125], heightMetres: 62, radialT: 0.43, angularT: 0.80, placementZone: 'Southern materials interface', exteriorMotif: 'five faceted charcoal fragments joined by iridescent residual seams and a technical spine' },
  { code: 'F9', name: 'Ecological Evidence Terraces', purpose: 'Environmental Crime, Wildlife Forensics and eDNA Institute', form: 'ecological', footprintMetres: [210, 140], heightMetres: 44, radialT: 0.69, angularT: 0.08, placementZone: 'Open eastern promenade toward the Academic District', exteriorMotif: 'a calibrated excavated landscape of planted laboratory terraces and visible sampling water' },
  { code: 'F10', name: 'Silicon Autopsy Foundry', purpose: 'Semiconductor, Embedded-System and Hardware Forensics Laboratory', form: 'silicon', footprintMetres: [135, 125], heightMetres: 74, radialT: 0.68, angularT: 0.27, placementZone: 'Cyberforensic threshold', exteriorMotif: 'a black integrated-circuit die crossed by physical copper and silver traces and a white insert' },
  { code: 'F11', name: 'Malware Ecology Containment Tower', purpose: 'Autonomous Malware and Adversarial Code Research Facility', form: 'malware', footprintMetres: [95, 95], heightMetres: 156, radialT: 0.69, angularT: 0.59, placementZone: 'Isolated outer cyberforensic band', exteriorMotif: 'eight separated dark containment blocks held inside a braced titanium exoskeleton' },
  { code: 'F12', name: 'Network Reconstruction Array', purpose: 'Cloud, Network and Distributed-System Forensics Complex', form: 'network', footprintMetres: [170, 135], heightMetres: 126, radialT: 0.69, angularT: 0.88, placementZone: 'Outer distributed-systems plaza', exteriorMotif: 'three graph-latticed towers joined through opal junction nodes and tubular bridges' },
  { code: 'F13', name: 'Veritas Prism', purpose: 'Synthetic Media, Deepfake and Sensor Authenticity Institute', form: 'veritas', footprintMetres: [190, 100], heightMetres: 58, radialT: 0.91, angularT: 0.20, placementZone: 'Public-facing academic edge', exteriorMotif: 'a wedge prism with pixel, waveform, and displaced-frame evidence facades' },
  { code: 'F14', name: 'Quantum Evidence Vault', purpose: 'Cryptographic Provenance and Long-Term Digital Evidence Institute', form: 'quantum', footprintMetres: [150, 140], heightMetres: 32, radialT: 0.91, angularT: 0.39, placementZone: 'Buried outer archive ring', exteriorMotif: 'a seamless twelve-sided black vault behind a dogleg amber continuity bridge' },
  { code: 'F15', name: 'Cyber-Physical Reconstruction Range', purpose: 'Autonomous Vehicle, Robot, IoT and Infrastructure Incident Laboratory', form: 'range', footprintMetres: [230, 175], heightMetres: 72, radialT: 0.88, angularT: 0.71, placementZone: 'Southern outer convergence range', exteriorMotif: 'a reconfigurable crescent hangar, six sensor doors, test court, drone cage, and Forensic Eye' },
] as const;

const DISTRICT_ID = 'forensic-cyberforensic-lab';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 20, 14);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

type ForensicMaterials = ReturnType<typeof createForensicMaterials>;

function material(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ name, color, roughness: 0.62, metalness: 0.14, ...options });
}

function createForensicMaterials() {
  const anthracite = material('Forensic anthracite technical ceramic', '#151a1e', { roughness: 0.88, metalness: 0.04 });
  const basalt = material('Forensic volcanic black basalt', '#080b0e', { roughness: 0.93, metalness: 0.02 });
  const whiteCeramic = material('Forensic white technical ceramic', '#e5e8e5', { roughness: 0.46, metalness: 0.04 });
  const paleCeramic = material('Forensic pale reflective ceramic', '#cdd4d2', { roughness: 0.38, metalness: 0.08 });
  const titanium = material('Forensic satin titanium', '#929da0', { roughness: 0.32, metalness: 0.88 });
  const darkSteel = material('Forensic dark stainless steel', '#303b40', { roughness: 0.4, metalness: 0.82 });
  const smokedGlass = material('Forensic electrochromic smoked glass', '#10242d', { emissive: '#123643', emissiveIntensity: 0.22, roughness: 0.08, metalness: 0.16, transparent: true, opacity: 0.68, side: THREE.DoubleSide });
  const opalGlass = material('Chainline translucent opal glass', '#a8d6d7', { emissive: '#579ea5', emissiveIntensity: 0.35, roughness: 0.13, metalness: 0.04, transparent: true, opacity: 0.58, side: THREE.DoubleSide });
  const mesh = material('Forensic fine conductive mesh', '#536166', { roughness: 0.44, metalness: 0.78, transparent: true, opacity: 0.48, side: THREE.DoubleSide });
  const copper = material('Hardware-forensic copper trace metal', '#a66a3e', { emissive: '#5d2d12', emissiveIntensity: 0.28, roughness: 0.34, metalness: 0.86 });
  const violet = material('Forensic ultraviolet-violet evidence light', '#ae8cff', { emissive: '#7452d8', emissiveIntensity: 2.35, roughness: 0.12, metalness: 0.12 });
  const cyan = material('Forensic subdued-cyan evidence light', '#7fe3ed', { emissive: '#36aab8', emissiveIntensity: 2.2, roughness: 0.12, metalness: 0.1 });
  const coolWhite = material('Forensic cool-white verification light', '#e8ffff', { emissive: '#b8f5ff', emissiveIntensity: 2.45, roughness: 0.1, metalness: 0.08 });
  const amber = material('Forensic verified-evidence amber light', '#ffc675', { emissive: '#e58624', emissiveIntensity: 2.5, roughness: 0.12, metalness: 0.12 });
  const dormantRed = material('Forensic dormant containment-red indicator', '#3b1217', { emissive: '#2b080d', emissiveIntensity: 0.08, roughness: 0.34, metalness: 0.28 });
  const paving = material('Evidence Line anthracite calibrated paving', '#394145', { roughness: 0.94, metalness: 0.04 });
  const palePaving = material('Forensic pale specimen promenade paving', '#aeb8b5', { roughness: 0.92, metalness: 0.03 });
  const water = material('Forensic shallow black reflecting water', '#07151a', { emissive: '#09242b', emissiveIntensity: 0.14, roughness: 0.04, metalness: 0.16, transparent: true, opacity: 0.84 });
  const silverGrass = material('Forensic controlled silver grass', '#7f9188', { roughness: 0.96, metalness: 0.04 });
  const moss = material('Forensic dark monitored moss', '#263b34', { roughness: 0.98, metalness: 0 });
  const mineral = material('Forensic calibrated mineral aggregate', '#6d6962', { roughness: 0.97, metalness: 0.02 });
  const photobioreactor = material('Forensic reference-culture green-blue glass', '#52bfa8', { emissive: '#238c7a', emissiveIntensity: 1.35, roughness: 0.12, metalness: 0.04, transparent: true, opacity: 0.72 });
  [violet, cyan, coolWhite, amber, copper, photobioreactor].forEach((entry) => { entry.userData.isDistrictAccent = true; });
  return { anthracite, basalt, whiteCeramic, paleCeramic, titanium, darkSteel, smokedGlass, opalGlass, mesh, copper, violet, cyan, coolWhite, amber, dormantRed, paving, palePaving, water, silverGrass, moss, mineral, photobioreactor };
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

function box(parent: THREE.Object3D, name: string, size: readonly [number, number, number], mat: THREE.Material, position: readonly [number, number, number], obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(UNIT_BOX, mat), name, obstacle);
  mesh.scale.set(...size); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function cylinder(parent: THREE.Object3D, name: string, diameter: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 24, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(segments <= 12 ? UNIT_CYLINDER_12 : UNIT_CYLINDER_24, mat), name, obstacle);
  mesh.scale.set(diameter, height, diameter); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function ellipse(parent: THREE.Object3D, name: string, diameter: readonly [number, number], height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 24) {
  const mesh = prepare(new THREE.Mesh(segments <= 12 ? UNIT_CYLINDER_12 : UNIT_CYLINDER_24, mat), name, obstacle);
  mesh.scale.set(diameter[0], height, diameter[1]); mesh.position.set(...position); parent.add(mesh); return mesh;
}

function sphere(parent: THREE.Object3D, name: string, scale: readonly [number, number, number], mat: THREE.Material, position: readonly [number, number, number], obstacle = false) {
  const mesh = prepare(new THREE.Mesh(UNIT_SPHERE, mat), name, obstacle);
  mesh.scale.set(...scale); mesh.position.set(...position); parent.add(mesh); return mesh;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, mat: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0], arc = Math.PI * 2) {
  const key = `${radius.toFixed(3)}|${tube.toFixed(3)}|${arc.toFixed(3)}`;
  let geometry = TORUS_CACHE.get(key);
  if (!geometry) { geometry = new THREE.TorusGeometry(radius, tube, 7, 48, arc); TORUS_CACHE.set(key, geometry); }
  const mesh = prepare(new THREE.Mesh(geometry, mat), name); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function pipe(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, radius: number, mat: THREE.Material, obstacle = false) {
  const direction = end.clone().sub(start);
  const mesh = prepare(new THREE.Mesh(UNIT_CYLINDER_12, mat), name, obstacle);
  mesh.scale.set(radius * 2, direction.length(), radius * 2); mesh.position.copy(start).add(end).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(UNIT_Y, direction.normalize()); parent.add(mesh); return mesh;
}

function pulse(object: THREE.Object3D, speed: number, phase = 0, minIntensity = 0.28, maxIntensity = 3.5) {
  object.userData.animate = 'forensic-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate(object: THREE.Object3D, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'forensic-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function wedgeGeometry(width: number, height: number, depth: number, topScale = 0.7, shearX = 0) {
  const vertices = [
    -width / 2, 0, -depth / 2, width / 2, 0, -depth / 2, width / 2, 0, depth / 2, -width / 2, 0, depth / 2,
    -width * topScale / 2 + shearX, height, -depth * topScale / 2, width * topScale / 2 + shearX, height, -depth * topScale / 2, width * topScale / 2 + shearX, height, depth * topScale / 2, -width * topScale / 2 + shearX, height, depth * topScale / 2,
  ];
  const faces = [[0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7], [0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5], [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7]];
  const positions: number[] = []; faces.forEach((face) => face.forEach((index) => positions.push(vertices[index * 3], vertices[index * 3 + 1], vertices[index * 3 + 2])));
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.computeVertexNormals(); return geometry;
}

function addArcSegments(parent: THREE.Object3D, prefix: string, centerX: number, centerZ: number, radius: number, start: number, end: number, segments: number, height: number, thickness: number, mat: THREE.Material, y: number, obstacle = false) {
  for (let index = 0; index < segments; index += 1) {
    const angle = THREE.MathUtils.lerp(start, end, (index + 0.5) / segments);
    const length = radius * (end - start) / segments * 1.05;
    box(parent, `${prefix}_${index + 1}`, [length, height, thickness], mat, [centerX + Math.cos(angle) * radius, y, centerZ + Math.sin(angle) * radius], obstacle, [0, -angle - Math.PI / 2, 0]);
  }
}

function addEvidentia(root: THREE.Group, m: ForensicMaterials) {
  box(root, 'FORENSIC__F1__BASALT_EVIDENCE_PLATFORM', [18.5, 0.5, 10.5], m.basalt, [0, 0.25, 0], true);
  box(root, 'FORENSIC__F1__PHYSICAL_OBJECT_MONOLITH', [7.5, 8.2, 8.6], m.basalt, [-4.65, 4.6, 0], true, [0, 0, -0.025]);
  box(root, 'FORENSIC__F1__DIGITAL_RECORD_MONOLITH', [7.5, 8.2, 8.6], m.paleCeramic, [4.65, 4.6, 0], true, [0, 0, 0.025]);
  [-3.55, -2.8, -1.85, 1.85, 2.8, 3.55].forEach((x, index) => pulse(box(root, `FORENSIC__F1__PROVENANCE_BAR_${index + 1}`, [0.11, 7.1 - (index % 3) * 0.55, 0.06], m.amber.clone(), [x, 4.55, 4.34]), 0.015 + index * 0.002, index * 0.6));
  [2.35, 4.4, 6.55].forEach((y, index) => {
    box(root, `FORENSIC__F1__IRREGULAR_GLASS_BRIDGE_${index + 1}`, [3.25, 0.52, 1.05], m.smokedGlass, [(index - 1) * 0.35, y, -0.7 + index * 0.6]);
    box(root, `FORENSIC__F1__BRIDGE_AMBER_EDGE_${index + 1}`, [3.25, 0.055, 1.1], m.amber, [(index - 1) * 0.35, y - 0.27, -0.7 + index * 0.6]);
  });
  box(root, 'FORENSIC__F1__FOLDED_EVIDENCE_LABEL_CANOPY', [7.4, 0.22, 2.45], m.whiteCeramic, [0, 2.65, 5.05], false, [0.04, 0, 0]);
  box(root, 'FORENSIC__F1__CANOPY_VERIFICATION_EDGE', [7.6, 0.06, 2.55], m.amber, [0, 2.54, 5.05]);
  for (let rib = 0; rib < 6; rib += 1) box(root, `FORENSIC__F1__INTEGRATED_SCANNING_RIB_${rib + 1}`, [0.16, 2.45, 0.3], rib % 2 ? m.titanium : m.darkSteel, [-2.55 + rib * 1.02, 1.35, 4.7]);
  box(root, 'FORENSIC__F1__SEALED_VEHICLE_DESCENT', [6.8, 0.18, 6.2], m.paving, [-5.65, -0.05, -5.1], false, [-0.06, 0, 0]);
  [-1, 1].forEach((side, index) => box(root, `FORENSIC__F1__VEHICLE_RAMP_BASALT_WALL_${index + 1}`, [0.42, 1.35, 6.4], m.basalt, [-5.65 + side * 3.5, 0.45, -5.1], true));
  const sculpture = new THREE.Group(); sculpture.name = 'FORENSIC__F1__FINGERPRINT_DNA_HASH_SCULPTURE'; sculpture.position.set(0, 0, 9.2); root.add(sculpture);
  for (let plate = 0; plate < 42; plate += 1) { const t = plate / 41; const x = (t - 0.5) * 14.5; const y = 0.8 + Math.sin(t * Math.PI) * 2.5; const z = Math.sin(t * Math.PI * 5) * (0.25 + Math.sin(t * Math.PI) * 0.55); box(sculpture, `FORENSIC__F1__SUSPENDED_GLASS_PLATE_${plate + 1}`, [0.08, 1.25 + Math.sin(t * Math.PI) * 0.9, 0.5], plate % 7 === 0 ? m.amber : m.opalGlass, [x, y, z], false, [0, t * 0.65 - 0.32, 0]); }
  pipe(root, 'FORENSIC__F1__TIME_REFERENCE_MAST', new THREE.Vector3(0, 8.75, -1.2), new THREE.Vector3(0, 13.0, -1.2), 0.07, m.titanium);
  const crown = prepare(new THREE.Mesh(new THREE.OctahedronGeometry(1.05, 0), m.opalGlass), 'FORENSIC__F1__FACETED_COMMUNICATIONS_CROWN'); crown.position.set(0, 11.8, -1.2); root.add(crown);
}

function addHelix(root: THREE.Group, m: ForensicMaterials) {
  ellipse(root, 'FORENSIC__F2__BLACK_ANALYTICAL_PLATFORM', [14.5, 11.5], 0.48, m.basalt, [0, 0.25, 0], true, 32);
  [-1, 1].forEach((side, towerIndex) => {
    const x = side * 2.8;
    const z = side * -0.75;
    ellipse(root, `FORENSIC__F2__ELLIPTICAL_SEQUENCE_TOWER_${towerIndex + 1}`, [6.3, 4.5], 10.4, m.opalGlass, [x, 5.45, z], true, 32);
    for (let fin = 0; fin < 34; fin += 1) { const angle = fin / 34 * Math.PI * 2; const depth = 0.18 + ((fin * 7) % 6) * 0.035; box(root, `FORENSIC__F2__NUCLEOTIDE_FIN_${towerIndex + 1}_${fin + 1}`, [0.11, 8.9, depth], fin % 9 === 0 ? m.coolWhite : m.whiteCeramic, [x + Math.cos(angle) * 3.25, 5.35, z + Math.sin(angle) * 2.35], false, [0, -angle, 0]); }
    for (let cone = 0; cone < 2; cone += 1) { const exhaust = prepare(new THREE.Mesh(new THREE.ConeGeometry(0.52, 1.35, 20), m.paleCeramic), `FORENSIC__F2__PEARLESCENT_EXHAUST_${towerIndex + 1}_${cone + 1}`); exhaust.position.set(x + (cone ? 1.05 : -1.05), 11.0, z); root.add(exhaust); }
  });
  [3.15, 6.1, 8.6].forEach((y, index) => box(root, `FORENSIC__F2__HELIX_COURT_BRIDGE_${index + 1}`, [5.0, 0.34, 0.7], m.smokedGlass, [0, y, (index - 1) * 0.85], false, [0, (index - 1) * 0.08, 0]));
  box(root, 'FORENSIC__F2__SUSPENDED_SEQUENCE_CANOPY', [6.4, 0.18, 2.4], m.titanium, [0, 2.4, 5.5]);
  for (let row = 0; row < 4; row += 1) for (let col = 0; col < 11; col += 1) { const x = -2.75 + col * 0.55 + (row % 2) * 0.27; const cell = cylinder(root, `FORENSIC__F2__NANOPORE_CANOPY_CELL_${row + 1}_${col + 1}`, 0.18, 0.045, (row * 11 + col) % 7 === 0 ? m.amber.clone() : m.coolWhite.clone(), [x, 2.28, 4.75 + row * 0.43], false, 12); cell.rotation.x = Math.PI / 2; pulse(cell, 0.025, row * 1.1 + col * 0.17); }
  for (let pair = 0; pair < 6; pair += 1) { box(root, `FORENSIC__F2__BASE_PAIR_PLANTING_A_${pair + 1}`, [1.35, 0.08, 0.45], m.silverGrass, [-5.3, 0.12, -4.0 + pair * 1.35]); box(root, `FORENSIC__F2__BASE_PAIR_PLANTING_B_${pair + 1}`, [1.35, 0.08, 0.45], m.silverGrass, [5.3, 0.12, -4.0 + pair * 1.35]); }
  for (let port = 0; port < 4; port += 1) cylinder(root, `FORENSIC__F2__SEALED_CARTRIDGE_PORT_${port + 1}`, 1.15, 0.55, m.paleCeramic, [-3.0 + port * 2.0, 2.1 + (port % 2) * 1.2, -5.0], false, 24, [Math.PI / 2, 0, 0]);
}

function addProteomic(root: THREE.Group, m: ForensicMaterials) {
  box(root, 'FORENSIC__F3__MASS_ANALYSIS_BASE', [19.0, 0.46, 9.2], m.basalt, [0, 0.24, 0], true);
  box(root, 'FORENSIC__F3__SMOKED_GLASS_LABORATORY', [17.4, 3.5, 7.4], m.smokedGlass, [0, 2.05, 0], true);
  for (let peak = 0; peak < 40; peak += 1) { const peakHeight = 0.35 + ((peak * 19) % 13) * 0.22; box(root, `FORENSIC__F3__MASS_SPECTRUM_PEAK_${peak + 1}`, [0.15, peakHeight, 7.0], peak % 11 === 0 ? m.coolWhite : m.darkSteel, [-8.4 + peak * 0.43, 3.8 + peakHeight / 2, 0]); box(root, `FORENSIC__F3__SPECTRUM_FACADE_FIN_${peak + 1}`, [0.07, 3.0 + peakHeight * 0.18, 0.32], peak % 9 === 0 ? m.amber : m.titanium, [-8.4 + peak * 0.43, 2.0, 3.83]); }
  const canopy = sphere(root, 'FORENSIC__F3__FLATTENED_DROPLET_CANOPY', [4.4, 0.18, 2.25], m.opalGlass, [0, 2.25, 5.3]); canopy.rotation.x = 0.04;
  cylinder(root, 'FORENSIC__F3__TRANSPARENT_DRAINAGE_COLUMN', 0.62, 2.2, m.opalGlass, [0, 1.15, 5.3], false, 24);
  for (let ring = 0; ring < 6; ring += 1) torus(root, `FORENSIC__F3__DRAINAGE_MEASUREMENT_RING_${ring + 1}`, 0.34, 0.035, m.cyan.clone(), [0, 0.35 + ring * 0.34, 5.3]);
  for (let capsule = 0; capsule < 5; capsule += 1) sphere(root, `FORENSIC__F3__VIBRATION_ISOLATED_ROOF_CAPSULE_${capsule + 1}`, [1.2 + (capsule % 2) * 0.25, 0.55, 0.72], m.whiteCeramic, [-6.0 + capsule * 3.0, 5.3 + (capsule % 2) * 0.25, -1.1 + (capsule % 3) * 1.1]);
  for (let trace = 0; trace < 12; trace += 1) box(root, `FORENSIC__F3__CHROMATOGRAPHIC_PAVEMENT_TRACE_${trace + 1}`, [0.035, 0.025, 3.2 + (trace % 4) * 0.7], trace % 5 === 0 ? m.amber : m.titanium, [-4.4 + trace * 0.8, 0.49, 5.4 + (trace % 3) * 0.32], false, [0, (trace - 5.5) * 0.035, 0]);
}

function addMicrobiome(root: THREE.Group, m: ForensicMaterials) {
  cylinder(root, 'FORENSIC__F4__SEALED_DARK_CENTRAL_CORE', 6.4, 6.6, m.anthracite, [0, 3.5, 0], true, 32);
  const colonies = [[-3.5, 0.2, 5.2, 5.8], [3.2, -0.5, 4.5, 6.6], [-0.8, 3.3, 4.2, 5.1], [0.8, -3.6, 5.0, 4.2], [4.1, 3.0, 3.4, 4.6]] as const;
  colonies.forEach(([x, z, diameter, height], index) => {
    cylinder(root, `FORENSIC__F4__TRANSLUCENT_COLONY_CYLINDER_${index + 1}`, diameter, height, m.opalGlass, [x, height / 2 + 0.25, z], true, 32);
    for (let band = 0; band < 5; band += 1) torus(root, `FORENSIC__F4__CELLULAR_MEMBRANE_RING_${index + 1}_${band + 1}`, diameter * 0.5 + 0.04, 0.035, m.mesh, [x, 0.8 + band * (height - 0.8) / 5, z]);
  });
  for (let column = 0; column < 6; column += 1) { const x = -5.5 + column * 2.2; cylinder(root, `FORENSIC__F4__REFERENCE_PHOTOBIOREACTOR_${column + 1}`, 0.58, 3.3 + (column % 2) * 0.5, m.photobioreactor, [x, 1.75 + (column % 2) * 0.25, 6.1], false, 24); torus(root, `FORENSIC__F4__BIOREACTOR_CASING_${column + 1}`, 0.34, 0.04, m.titanium, [x, 3.35 + (column % 2) * 0.5, 6.1]); }
  for (let vestibule = 0; vestibule < 3; vestibule += 1) { const angle = -0.9 + vestibule * 0.9; const x = Math.sin(angle) * 5.8; const z = Math.cos(angle) * 5.8; sphere(root, `FORENSIC__F4__ISOLATION_VESTIBULE_${vestibule + 1}`, [1.2, 1.05, 1.8], m.paleCeramic, [x, 1.3, z]); torus(root, `FORENSIC__F4__VESTIBULE_STATUS_BAND_${vestibule + 1}`, 0.72, 0.05, vestibule === 2 ? m.amber : m.coolWhite, [x, 1.35, z], [Math.PI / 2, 0, 0]); }
  for (let ring = 0; ring < 4; ring += 1) torus(root, `FORENSIC__F4__COLONY_PAVEMENT_RING_${ring + 1}`, 5.5 + ring * 1.2, 0.055, ring % 2 ? m.titanium : m.palePaving, [0, 0.08, 0]);
  for (let mast = 0; mast < 8; mast += 1) { const angle = mast / 8 * Math.PI * 2; pipe(root, `FORENSIC__F4__FLAGELLA_AIR_MONITOR_${mast + 1}`, new THREE.Vector3(Math.cos(angle) * 2.3, 6.5, Math.sin(angle) * 2.3), new THREE.Vector3(Math.cos(angle) * 3.8, 8.3 + (mast % 2) * 0.5, Math.sin(angle) * 3.8), 0.045, m.titanium); }
}

function addThanatoscan(root: THREE.Group, m: ForensicMaterials) {
  box(root, 'FORENSIC__F5__MATTE_BLACK_ELEVEN_STOREY_MONOLITH', [8.4, 13.2, 7.8], m.basalt, [0, 6.8, 0], true);
  for (let segment = 0; segment < 24; segment += 1) { const side = Math.floor(segment / 6); const local = segment % 6; const height = 1.0 + segment * 0.46; let position: [number, number, number]; let size: [number, number, number]; if (side === 0) { position = [-3.45 + local * 1.38, height, 3.94]; size = [1.28, 0.13, 0.07]; } else if (side === 1) { position = [4.24, height, 3.25 - local * 1.3]; size = [0.07, 0.13, 1.2]; } else if (side === 2) { position = [3.45 - local * 1.38, height, -3.94]; size = [1.28, 0.13, 0.07]; } else { position = [-4.24, height, -3.25 + local * 1.3]; size = [0.07, 0.13, 1.2]; } pulse(box(root, `FORENSIC__F5__ASCENDING_SCANNING_BAND_${segment + 1}`, size, m.coolWhite.clone(), position), 0.007, segment * 0.14, 0.8, 3.0); }
  for (let floor = 0; floor < 5; floor += 1) for (let aperture = 0; aperture < 3; aperture += 1) box(root, `FORENSIC__F5__UPPER_RECESSED_APERTURE_${floor + 1}_${aperture + 1}`, [1.45, 0.12, 0.07], m.smokedGlass, [-2.0 + aperture * 2.0, 8.1 + floor * 0.85, 3.95]);
  [-1, 1].forEach((side, index) => { const buttress = prepare(new THREE.Mesh(wedgeGeometry(1.8, 4.2, 3.0, 0.28, side * 0.4), m.anthracite), `FORENSIC__F5__SHIELDING_BUTTRESS_${index + 1}`, true); buttress.position.set(side * 3.2, 0.35, 2.4); root.add(buttress); });
  box(root, 'FORENSIC__F5__PRECISION_WHITE_ENTRANCE_CANOPY', [5.6, 0.14, 1.75], m.whiteCeramic, [0, 2.35, 4.8]);
  box(root, 'FORENSIC__F5__RECTANGULAR_REFLECTING_POOL', [8.2, 0.08, 4.2], m.water, [0, 0.08, 7.0]);
  for (let step = 0; step < 6; step += 1) box(root, `FORENSIC__F5__DARK_POOL_STEPPING_PLATFORM_${step + 1}`, [1.0, 0.12, 0.7], m.anthracite, [-3.0 + step * 1.25, 0.16, 6.4 + step * 0.32]);
  torus(root, 'FORENSIC__F5__ROOF_CALIBRATION_HALO', 2.65, 0.12, m.titanium, [0, 13.9, 0]);
}

function addRidge(root: THREE.Group, m: ForensicMaterials) {
  ellipse(root, 'FORENSIC__F6__BIOMETRIC_CALIBRATION_DATUM', [14.5, 12.0], 0.12, m.paving, [0, 0.08, 0], false, 32);
  const walls = [[-1.7, -0.7, 5.6, -1.2, 1.15], [1.7, -0.7, 5.6, 1.99, 4.34], [0, 2.1, 5.2, 3.9, 6.0]] as const;
  walls.forEach(([cx, cz, radius, start, end], wallIndex) => {
    addArcSegments(root, `FORENSIC__F6__FINGERPRINT_WALL_${wallIndex + 1}`, cx, cz, radius, start, end, 18, 5.4 - wallIndex * 0.25, 0.48, wallIndex === 0 ? m.paleCeramic : wallIndex === 1 ? m.titanium : m.darkSteel, 2.85, true);
    addArcSegments(root, `FORENSIC__F6__ELECTROCHROMIC_RIDGE_GAP_${wallIndex + 1}`, cx, cz, radius - 0.32, start, end, 18, 4.5, 0.1, m.smokedGlass, 2.85);
  });
  torus(root, 'FORENSIC__F6__PERFORATED_CIRCULAR_CANOPY', 2.25, 0.22, m.titanium, [0, 4.2, 4.0]);
  for (let point = 0; point < 48; point += 1) { const angle = point / 48 * Math.PI * 2; cylinder(root, `FORENSIC__F6__CANOPY_LIGHT_POINT_${point + 1}`, 0.07, 0.04, point % 9 === 0 ? m.amber : m.coolWhite, [Math.cos(angle) * (0.8 + (point % 3) * 0.55), 4.0, 4.0 + Math.sin(angle) * (0.8 + (point % 3) * 0.55)], false, 8); }
  for (let line = 0; line < 14; line += 1) torus(root, `FORENSIC__F6__PRESSURE_CONTOUR_${line + 1}`, 1.2 + line * 0.34, 0.025, line % 5 === 0 ? m.cyan : m.titanium, [0, 0.18, 4.0], [Math.PI / 2, 0, 0], Math.PI * (1.0 + (line % 3) * 0.22));
  box(root, 'FORENSIC__F6__LIDAR_CALIBRATION_PLATFORM', [3.8, 0.32, 3.0], m.palePaving, [-5.0, 0.2, -4.0]);
  for (let column = 0; column < 5; column += 1) cylinder(root, `FORENSIC__F6__MEASURED_CALIBRATION_COLUMN_${column + 1}`, 0.35 + column * 0.06, 2.4 + column * 0.55, column % 2 ? m.whiteCeramic : m.anthracite, [-6.0 + column * 0.62, 1.25 + column * 0.27, -4.0], false, 12);
  torus(root, 'FORENSIC__F6__ROOFTOP_RANGING_RING', 2.8, 0.18, m.darkSteel, [0, 6.1, 0]);
}

function addIsotope(root: THREE.Group, m: ForensicMaterials) {
  const base = prepare(new THREE.Mesh(new THREE.CylinderGeometry(5.0, 5.9, 1.2, 6), m.basalt), 'FORENSIC__F7__FRACTURED_MINERAL_BASE', true); base.position.y = 0.65; base.rotation.y = Math.PI / 6; root.add(base);
  const strataMaterials = [m.basalt, m.mineral, m.darkSteel, m.titanium, m.paleCeramic, m.opalGlass];
  for (let stratum = 0; stratum < 18; stratum += 1) { const radius = 4.3 - stratum * 0.14; const height = 0.68; const layer = prepare(new THREE.Mesh(new THREE.CylinderGeometry(radius - 0.08, radius, height, 3), strataMaterials[Math.min(strataMaterials.length - 1, Math.floor(stratum / 3))]), `FORENSIC__F7__GEOLOGICAL_STRATUM_${stratum + 1}`, true); layer.position.set((stratum / 17) * 0.75, 1.45 + stratum * 0.7, 0); layer.rotation.y = Math.PI / 6 + stratum * 0.006; root.add(layer); }
  for (let cut = 0; cut < 9; cut += 1) pulse(box(root, `FORENSIC__F7__ELEMENTAL_SPECTRUM_CUT_${cut + 1}`, [0.07, 7.0 + (cut % 3) * 1.6, 0.08], cut % 3 === 0 ? m.violet.clone() : cut % 3 === 1 ? m.amber.clone() : m.coolWhite.clone(), [-2.8 + cut * 0.7, 6.4, 2.7 + Math.abs(cut - 4) * 0.08]), 0.012, cut * 0.42);
  const canopy = prepare(new THREE.Mesh(wedgeGeometry(5.6, 0.35, 3.2, 0.15, 1.8), m.titanium), 'FORENSIC__F7__CRYSTAL_POINT_ENTRANCE_CANOPY'); canopy.position.set(0, 2.3, 5.0); root.add(canopy);
  pipe(root, 'FORENSIC__F7__ENVIRONMENTAL_CALIBRATION_MAST', new THREE.Vector3(6.2, 0.2, -1.8), new THREE.Vector3(6.2, 12.4, -1.8), 0.08, m.titanium);
  for (let instrument = 0; instrument < 7; instrument += 1) { const y = 2.0 + instrument * 1.35; box(root, `FORENSIC__F7__MAST_SAMPLER_${instrument + 1}`, [0.8 + (instrument % 2) * 0.25, 0.22, 0.45], instrument % 3 === 0 ? m.opalGlass : m.darkSteel, [6.2, y, -1.8], false, [0, instrument * 0.55, 0]); }
  const samples = [m.basalt, m.paleCeramic, m.mineral, m.smokedGlass, m.darkSteel, m.whiteCeramic]; samples.forEach((sample, index) => { box(root, `FORENSIC__F7__REFERENCE_MINERAL_FRAME_${index + 1}`, [1.4, 0.18, 1.15], m.anthracite, [-5.5 + index * 2.2, 0.12, 6.2]); const specimen = prepare(new THREE.Mesh(new THREE.DodecahedronGeometry(0.42 + (index % 3) * 0.08, 0), sample), `FORENSIC__F7__REFERENCE_MINERAL_${index + 1}`); specimen.position.set(-5.5 + index * 2.2, 0.6, 6.2); root.add(specimen); });
  box(root, 'FORENSIC__F7__CHAINLINE_MIDHEIGHT_DOCK', [5.5, 0.45, 0.75], m.opalGlass, [3.8, 7.4, 0]);
}

function addNanotrace(root: THREE.Group, m: ForensicMaterials) {
  box(root, 'FORENSIC__F8__STAINLESS_TECHNICAL_SPINE', [18.0, 2.8, 1.2], m.titanium, [0, 2.0, -3.3], true);
  const fragments = [[-6.5, 0.6, 5.0, 5.0, 4.2, -0.3], [-3.2, -0.4, 4.8, 6.0, 4.7, 0.18], [0, 0.4, 5.4, 5.5, 4.4, -0.12], [3.5, -0.3, 4.7, 6.4, 4.5, 0.24], [6.6, 0.5, 4.3, 5.2, 4.1, -0.2]] as const;
  fragments.forEach(([x, z, width, height, depth, shear], index) => { const volume = prepare(new THREE.Mesh(wedgeGeometry(width, height, depth, 0.7, shear), m.anthracite), `FORENSIC__F8__CRYSTALLINE_FRAGMENT_${index + 1}`, true); volume.position.set(x, 0.45, z); volume.rotation.y = (index - 2) * 0.13; root.add(volume); for (let seam = 0; seam < 4; seam += 1) pulse(box(root, `FORENSIC__F8__IRIDESCENT_RESIDUAL_SEAM_${index + 1}_${seam + 1}`, [0.065, height * 0.72, depth * 0.72], [m.violet, m.cyan, m.coolWhite][(index + seam) % 3].clone(), [x - width * 0.32 + seam * width * 0.21, 0.8 + height * 0.42, z + depth * 0.38], false, [0, (index - 2) * 0.13, (seam - 1.5) * 0.08]), 0.01 + seam * 0.002, index + seam * 0.4); for (let aperture = 0; aperture < 3; aperture += 1) box(root, `FORENSIC__F8__MICROSCOPE_SLIDE_APERTURE_${index + 1}_${aperture + 1}`, [1.2, 0.26, 0.08], m.smokedGlass, [x, 1.55 + aperture * 1.1, z + depth * 0.52], false, [0, (index - 2) * 0.13, (aperture - 1) * 0.18]); });
  for (let cartridge = 0; cartridge < 5; cartridge += 1) box(root, `FORENSIC__F8__AIR_HANDLER_CARTRIDGE_${cartridge + 1}`, [2.1, 1.0, 1.5], cartridge % 2 ? m.darkSteel : m.whiteCeramic, [-6.2 + cartridge * 3.1, 4.2, -3.3]);
  box(root, 'FORENSIC__F8__OPTICAL_FIELD_CANOPY', [7.0, 0.18, 2.4], m.mesh, [0, 2.5, 6.3]);
  for (let point = 0; point < 52; point += 1) cylinder(root, `FORENSIC__F8__CANOPY_OPTICAL_POINT_${point + 1}`, 0.055, 0.025, point % 11 === 0 ? m.amber : m.coolWhite, [-3.1 + (point % 13) * 0.52, 2.38, 5.65 + Math.floor(point / 13) * 0.43], false, 8);
  [-1, 1].forEach((side, index) => box(root, `FORENSIC__F8__RECONSTRUCTION_COURT_WALL_${index + 1}`, [0.42, 4.2, 10.0], m.anthracite, [side * 8.7, 2.2, 1.2], true));
}

function addEcological(root: THREE.Group, m: ForensicMaterials) {
  const terraces = [[20.0, 12.5, 0.2], [17.0, 10.2, 0.75], [14.0, 8.2, 1.3], [11.0, 6.2, 1.85]] as const;
  terraces.forEach(([width, depth, y], index) => { box(root, `FORENSIC__F9__CALIBRATED_EVIDENCE_TERRACE_${index + 1}`, [width, 0.42, depth], index % 2 ? m.palePaving : m.mineral, [0, y, -index * 0.55], true); box(root, `FORENSIC__F9__TRANSPARENT_LAB_FRONT_${index + 1}`, [width * 0.82, 1.05, 0.12], m.smokedGlass, [0, y + 0.72, depth * 0.5 - index * 0.55]); });
  const beds = [m.water, m.mineral, m.moss, m.silverGrass, m.palePaving, m.water];
  beds.forEach((bed, index) => box(root, `FORENSIC__F9__REFERENCE_ENVIRONMENT_${index + 1}`, [2.4, 0.12, 3.0], bed, [-7.2 + (index % 3) * 7.2, 2.25 + Math.floor(index / 3) * -0.56, -2.8 + Math.floor(index / 3) * 5.4]));
  for (let tower = 0; tower < 4; tower += 1) { cylinder(root, `FORENSIC__F9__SOIL_CORE_TOWER_${tower + 1}`, 1.4, 5.2 + tower * 0.45, m.opalGlass, [-7.2 + tower * 4.8, 4.1 + tower * 0.22, -4.1], false, 24); for (let layer = 0; layer < 6; layer += 1) torus(root, `FORENSIC__F9__SOIL_STRATUM_${tower + 1}_${layer + 1}`, 0.7, 0.08, [m.basalt, m.mineral, m.paleCeramic][layer % 3], [-7.2 + tower * 4.8, 1.8 + layer * 0.65, -4.1]); }
  for (let fin = 0; fin < 12; fin += 1) box(root, `FORENSIC__F9__ADJUSTABLE_MESH_SCREEN_${fin + 1}`, [0.12, 4.8, 1.25], fin % 3 === 0 ? m.opalGlass : m.mesh, [-9.0 + fin * 1.64, 4.7, 4.7], false, [0, (fin % 4 - 1.5) * 0.08, 0]);
  for (let leaf = 0; leaf < 10; leaf += 1) box(root, `FORENSIC__F9__LEAF_PHOTOVOLTAIC_SURFACE_${leaf + 1}`, [2.0, 0.09, 1.1], m.smokedGlass, [-7.2 + (leaf % 5) * 3.6, 4.6 + Math.floor(leaf / 5) * 0.6, -1.0 + Math.floor(leaf / 5) * 2.0], false, [0.18, (leaf - 4.5) * 0.04, 0]);
  for (let channel = 0; channel < 4; channel += 1) { box(root, `FORENSIC__F9__VISIBLE_SAMPLING_CHANNEL_${channel + 1}`, [0.28, 0.08, 12.0], m.water, [-5.4 + channel * 3.6, 2.4, 0]); for (let gate = 0; gate < 3; gate += 1) box(root, `FORENSIC__F9__TRANSPARENT_MEASUREMENT_GATE_${channel + 1}_${gate + 1}`, [0.8, 0.75, 0.08], m.opalGlass, [-5.4 + channel * 3.6, 2.78, -4.2 + gate * 4.2]); }
}

function addSilicon(root: THREE.Group, m: ForensicMaterials) {
  box(root, 'FORENSIC__F10__INTEGRATED_CIRCUIT_DIE', [12.8, 7.4, 11.8], m.anthracite, [0, 3.9, 0], true);
  for (let col = 0; col < 11; col += 1) for (let row = 0; row < 6; row += 1) box(root, `FORENSIC__F10__PROCESSOR_FACADE_MODULE_${row + 1}_${col + 1}`, [0.82, 0.72, 0.09], (row + col) % 9 === 0 ? m.smokedGlass : m.darkSteel, [-5.1 + col * 1.02, 1.2 + row * 1.05, 5.96]);
  for (let trace = 0; trace < 18; trace += 1) { const vertical = trace % 3 === 0; box(root, `FORENSIC__F10__PHYSICAL_CIRCUIT_TRACE_${trace + 1}`, vertical ? [0.1, 5.7, 0.12] : [3.0 + (trace % 4), 0.1, 0.12], trace % 2 ? m.copper : m.titanium, vertical ? [-5.2 + trace * 0.58, 3.7, 6.05] : [-3.8 + (trace % 5) * 1.8, 1.0 + Math.floor(trace / 5) * 1.55, 6.05]); }
  box(root, 'FORENSIC__F10__WHITE_ANALYTICAL_INSERT', [7.4, 3.6, 5.4], m.whiteCeramic, [6.1, 4.8, -0.4], true);
  box(root, 'FORENSIC__F10__INSERT_LOWER_EDGE_LIGHT', [7.5, 0.12, 5.5], m.coolWhite, [6.1, 2.95, -0.4]);
  for (let line = 0; line < 16; line += 1) { box(root, `FORENSIC__F10__CONDUCTIVE_VEIL_VERTICAL_${line + 1}`, [0.025, 7.0, 0.04], m.mesh, [-6.0 + line * 0.8, 3.9, 6.18]); if (line < 10) box(root, `FORENSIC__F10__CONDUCTIVE_VEIL_HORIZONTAL_${line + 1}`, [12.2, 0.025, 0.04], m.mesh, [0, 0.7 + line * 0.72, 6.18]); }
  torus(root, 'FORENSIC__F10__WAFER_SEGMENT_CANOPY', 3.1, 0.28, m.titanium, [0, 2.45, 7.3], [Math.PI / 2, 0, 0], Math.PI * 1.25);
  for (let band = 0; band < 7; band += 1) box(root, `FORENSIC__F10__ANTISTATIC_GROUNDING_BAND_${band + 1}`, [6.2, 0.04, 0.08], band % 2 ? m.copper : m.titanium, [0, 0.14, 7.0 + band * 0.58]);
  torus(root, 'FORENSIC__F10__ROOF_WAFER_SCULPTURE', 3.2, 0.12, m.copper, [0, 7.85, 0]);
  for (let pod = 0; pod < 6; pod += 1) box(root, `FORENSIC__F10__SHIELDED_ROOF_PROBE_${pod + 1}`, [0.65, 1.0 + (pod % 3) * 0.42, 0.65], pod % 2 ? m.titanium : m.whiteCeramic, [-4.5 + pod * 1.8, 8.0 + (pod % 3) * 0.2, -3.2]);
}

function addMalware(root: THREE.Group, m: ForensicMaterials) {
  ellipse(root, 'FORENSIC__F11__DARK_GRAVEL_CONTAINMENT_MOAT', [9.5, 9.5], 0.16, m.basalt, [0, 0.1, 0], false, 32);
  for (let level = 0; level < 8; level += 1) { const y = 1.1 + level * 1.75; const x = Math.sin(level * 1.3) * 0.38; const z = Math.cos(level * 1.1) * 0.3; const block = box(root, `FORENSIC__F11__ISOLATED_LAB_BLOCK_${level + 1}`, [6.2, 1.28, 5.8], m.anthracite, [x, y, z], true, [0, (level - 3.5) * 0.035, 0]); block.userData.containmentLevel = level + 1; const bandMat = level === 5 ? m.dormantRed : m.coolWhite.clone(); const band = box(root, `FORENSIC__F11__ISOLATION_BAND_${level + 1}`, [6.4, 0.1, 6.0], bandMat, [x, y - 0.72, z]); if (level !== 5) pulse(band, 0.008, level * 0.5, 0.45, 2.3); for (let shutter = 0; shutter < 4; shutter += 1) box(root, `FORENSIC__F11__EM_SHUTTER_${level + 1}_${shutter + 1}`, [1.15, 0.48, 0.08], m.darkSteel, [x - 1.9 + shutter * 1.25, y, z + 2.94]); }
  [-1, 1].forEach((xSide) => [-1, 1].forEach((zSide) => pipe(root, `FORENSIC__F11__EXOSKELETON_COLUMN_${xSide}_${zSide}`, new THREE.Vector3(xSide * 3.8, 0.3, zSide * 3.6), new THREE.Vector3(xSide * 3.8, 15.3, zSide * 3.6), 0.16, m.darkSteel, true)));
  for (let level = 0; level < 7; level += 1) { const y0 = 0.5 + level * 2.05; pipe(root, `FORENSIC__F11__DIAGONAL_BRACE_A_${level + 1}`, new THREE.Vector3(-3.8, y0, 3.6), new THREE.Vector3(3.8, y0 + 1.65, 3.6), 0.11, m.titanium); pipe(root, `FORENSIC__F11__DIAGONAL_BRACE_B_${level + 1}`, new THREE.Vector3(3.8, y0, -3.6), new THREE.Vector3(-3.8, y0 + 1.65, -3.6), 0.11, m.titanium); }
  [-1, 1].forEach((side, index) => box(root, `FORENSIC__F11__MOAT_ACCESS_BRIDGE_${index + 1}`, [2.0, 0.18, 3.2], m.palePaving, [side * 2.3, 0.22, 5.9]));
  sphere(root, 'FORENSIC__F11__PROTECTIVE_SHELL_CANOPY', [3.2, 0.35, 1.8], m.darkSteel, [0, 1.9, 5.2]);
  sphere(root, 'FORENSIC__F11__ISOLATED_CHAINLINE_DOCK', [1.45, 1.1, 1.45], m.opalGlass, [5.3, 5.9, 0]);
  for (let mast = 0; mast < 4; mast += 1) pipe(root, `FORENSIC__F11__SHIELDED_ANTENNA_MAST_${mast + 1}`, new THREE.Vector3(-2.4 + (mast % 2) * 4.8, 14.9, -2.2 + Math.floor(mast / 2) * 4.4), new THREE.Vector3(-2.4 + (mast % 2) * 4.8, 18.0, -2.2 + Math.floor(mast / 2) * 4.4), 0.07, m.titanium);
}

function addNetwork(root: THREE.Group, m: ForensicMaterials) {
  const towers = [[-5.3, 2.2, 8.8, -0.08], [4.9, 2.5, 11.8, 0.06], [0, -4.2, 9.8, 0.02]] as const;
  towers.forEach(([x, z, height, rotation], index) => { box(root, `FORENSIC__F12__ANALYTICAL_LAYER_TOWER_${index + 1}`, [4.2, height, 4.0], m.smokedGlass, [x, height / 2 + 0.25, z], true, [0, rotation, 0]); for (let row = 0; row < 9; row += 1) for (let col = 0; col < 5; col += 1) { const branch = row > 4 && (col + row + index) % 3 === 0; box(root, `FORENSIC__F12__GRAPH_LATTICE_${index + 1}_${row + 1}_${col + 1}`, [branch ? 1.05 : 0.68, 0.045, 0.07], branch ? m.cyan.clone() : m.titanium, [x - 1.45 + col * 0.72, 1.0 + row * (height - 1.4) / 9, z + 2.04], false, [0, rotation, branch ? 0.38 : 0]); } });
  const connections = [[0, 1, 6.8], [1, 2, 7.9], [2, 0, 6.0]] as const;
  connections.forEach(([from, to, y], index) => { const start = new THREE.Vector3(towers[from][0], y, towers[from][1]); const end = new THREE.Vector3(towers[to][0], y + 0.3, towers[to][1]); pipe(root, `FORENSIC__F12__TUBULAR_NETWORK_BRIDGE_${index + 1}`, start, end, 0.42, m.opalGlass); const midpoint = start.clone().add(end).multiplyScalar(0.5); sphere(root, `FORENSIC__F12__OPAL_JUNCTION_NODE_${index + 1}`, [1.0, 1.0, 1.0], m.opalGlass, midpoint.toArray() as [number, number, number]); });
  for (let channel = 0; channel < 5; channel += 1) { const start = new THREE.Vector3(-6.2 + channel * 2.8, 0.1, 6.8); const end = new THREE.Vector3((channel - 2) * 0.8, 0.1, -0.5 - channel * 0.5); pipe(root, `FORENSIC__F12__PLAZA_PACKET_WATER_CHANNEL_${channel + 1}`, start, end, 0.11, m.water); for (let packet = 0; packet < 4; packet += 1) { const point = start.clone().lerp(end, (packet + 1) / 5); pulse(sphere(root, `FORENSIC__F12__PACKET_LIGHT_${channel + 1}_${packet + 1}`, [0.09, 0.05, 0.09], m.cyan.clone(), point.toArray() as [number, number, number]), 0.025, channel + packet * 0.3); } }
  pipe(root, 'FORENSIC__F12__BROAD_FIBER_CONDUIT', new THREE.Vector3(-8.0, 0.25, -5.2), new THREE.Vector3(0, 2.2, 0), 0.38, m.darkSteel);
  for (let mast = 0; mast < 6; mast += 1) pipe(root, `FORENSIC__F12__ATOMIC_TIMING_MAST_${mast + 1}`, new THREE.Vector3(-5.0 + mast * 2.0, 10.5 + (mast % 3), 2.2 - (mast % 2) * 6.4), new THREE.Vector3(-5.0 + mast * 2.0, 13.2 + (mast % 3), 2.2 - (mast % 2) * 6.4), 0.05, m.titanium);
}

function addVeritas(root: THREE.Group, m: ForensicMaterials) {
  const prism = prepare(new THREE.Mesh(wedgeGeometry(18.5, 5.8, 9.2, 0.35, -3.0), m.paleCeramic), 'FORENSIC__F13__THREE_MEDIA_WEDGE_PRISM', true); prism.position.y = 0.35; prism.rotation.z = Math.PI / 2; prism.scale.set(0.56, 1, 1); root.add(prism);
  for (let row = 0; row < 8; row += 1) for (let col = 0; col < 16; col += 1) { const size = 0.22 + col * 0.018; box(root, `FORENSIC__F13__PIXEL_SENSOR_TILE_${row + 1}_${col + 1}`, [size, 0.42, 0.06], (row + col) % 13 === 0 ? m.violet : (row + col) % 7 === 0 ? m.smokedGlass : m.whiteCeramic, [-7.4 + col * 0.82, 1.0 + row * 0.56, 4.67]); }
  for (let fin = 0; fin < 36; fin += 1) { const height = 0.35 + (Math.sin(fin / 35 * Math.PI * 5) + 1) * 0.55; box(root, `FORENSIC__F13__AUDIO_WAVEFORM_FIN_${fin + 1}`, [0.12, height, 0.85], fin % 8 === 0 ? m.cyan.clone() : m.darkSteel, [-8.4 + fin * 0.48, 3.6 + height / 2, -4.7]); }
  for (let frame = 0; frame < 12; frame += 1) box(root, `FORENSIC__F13__DISPLACED_VIDEO_FRAME_${frame + 1}`, [1.35, 3.8, 0.09], m.opalGlass, [-7.0 + frame * 1.22, 2.5 + (frame % 3) * 0.2, -4.55 + frame * 0.06], false, [0, (frame - 5.5) * 0.018, 0]);
  torus(root, 'FORENSIC__F13__CAMERA_IRIS_PORTAL', 2.2, 0.28, m.darkSteel, [-9.2, 2.8, 0], [0, Math.PI / 2, 0]);
  for (let blade = 0; blade < 12; blade += 1) { const angle = blade / 12 * Math.PI * 2; box(root, `FORENSIC__F13__ARCHITECTURAL_IRIS_BLADE_${blade + 1}`, [1.45, 0.38, 0.12], m.titanium, [-9.05, 2.8 + Math.sin(angle) * 1.55, Math.cos(angle) * 1.55], false, [angle, 0, 0.35]); }
  box(root, 'FORENSIC__F13__PROVENANCE_MEDIA_WALL', [7.5, 3.0, 0.16], m.smokedGlass, [2.0, 1.75, 6.2]);
  for (let mark = 0; mark < 24; mark += 1) box(root, `FORENSIC__F13__MEDIA_CALIBRATION_MARK_${mark + 1}`, [0.2 + (mark % 4) * 0.16, 0.08, 0.05], [m.coolWhite, m.violet, m.cyan][mark % 3], [-1.0 + (mark % 8) * 0.82, 0.7 + Math.floor(mark / 8) * 0.65, 6.32]);
  for (let sphereIndex = 0; sphereIndex < 5; sphereIndex += 1) sphere(root, `FORENSIC__F13__MIRRORED_REFERENCE_SPHERE_${sphereIndex + 1}`, [0.55 + sphereIndex * 0.08, 0.55 + sphereIndex * 0.08, 0.55 + sphereIndex * 0.08], sphereIndex % 2 ? m.titanium : m.smokedGlass, [-6.0 + sphereIndex * 3.0, 0.7, 7.8]);
  sphere(root, 'FORENSIC__F13__SKY_CALIBRATION_DOME', [2.4, 1.2, 2.4], m.opalGlass, [4.5, 6.3, 0]);
}

function addQuantum(root: THREE.Group, m: ForensicMaterials) {
  const vault = prepare(new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.8, 3.2, 12), m.basalt), 'FORENSIC__F14__TWELVE_SIDED_ARCHIVE_VAULT', true); vault.position.y = 1.0; vault.rotation.y = Math.PI / 12; root.add(vault);
  torus(root, 'FORENSIC__F14__INNER_LANDSCAPE_RING', 8.6, 0.38, m.moss, [0, 0.12, 0]); torus(root, 'FORENSIC__F14__OUTER_LANDSCAPE_RING', 10.4, 0.48, m.silverGrass, [0, 0.12, 0]);
  for (let point = 0; point < 84; point += 1) { const angle = ((point * 47) % 84) / 84 * Math.PI * 2; const y = 0.55 + ((point * 31) % 18) * 0.12; const radius = 7.65; const optical = sphere(root, `FORENSIC__F14__REFERENCE_SEQUENCE_POINT_${point + 1}`, [0.045, 0.045, 0.045], point % 11 === 0 ? m.amber.clone() : m.coolWhite.clone(), [Math.cos(angle) * radius, y, Math.sin(angle) * radius]); pulse(optical, 0.006, point * 0.31, 0.05, point % 11 === 0 ? 2.8 : 0.75); }
  box(root, 'FORENSIC__F14__BLACK_WATER_BASIN', [12.5, 0.08, 8.2], m.water, [0, 0.08, 9.1]);
  const bridgePoints = [new THREE.Vector3(-6.5, 0.2, 13.0), new THREE.Vector3(-2.0, 0.2, 10.5), new THREE.Vector3(2.4, 0.2, 10.5), new THREE.Vector3(4.2, 0.2, 6.9)];
  for (let index = 0; index < bridgePoints.length - 1; index += 1) { pipe(root, `FORENSIC__F14__DOGLEG_ACCESS_BRIDGE_${index + 1}`, bridgePoints[index], bridgePoints[index + 1], 0.52, m.palePaving); const left = bridgePoints[index].clone().add(new THREE.Vector3(0, 0.35, 0)); const right = bridgePoints[index + 1].clone().add(new THREE.Vector3(0, 0.35, 0)); pulse(pipe(root, `FORENSIC__F14__AMBER_CONTINUITY_RAIL_${index + 1}`, left, right, 0.045, m.amber.clone()), 0.008, index * 0.7); }
  [[-9, -7], [9, -7], [-9, 5], [9, 5]].forEach(([x, z], index) => { box(root, `FORENSIC__F14__INDEPENDENT_SERVICE_PYLON_${index + 1}`, [1.2, 4.4, 1.2], m.whiteCeramic, [x, 2.2, z], true); box(root, `FORENSIC__F14__PYLON_OPTICAL_LINK_${index + 1}`, [0.12, 1.5, 0.08], index % 2 ? m.cyan : m.amber, [x, 2.8, z + 0.62]); });
  ellipse(root, 'FORENSIC__F14__ROOF_CENTRAL_DEPRESSION', [5.5, 5.5], 0.32, m.water, [0, 2.72, 0], false, 32);
  pipe(root, 'FORENSIC__F14__TIME_REFERENCE_MAST', new THREE.Vector3(0, 2.8, 0), new THREE.Vector3(0, 8.2, 0), 0.055, m.titanium);
  sphere(root, 'FORENSIC__F14__ISOLATED_TRANSFER_PAVILION', [1.8, 1.4, 1.8], m.opalGlass, [-9.6, 1.5, 0]);
  box(root, 'FORENSIC__F14__ENCLOSED_TRANSFER_BRIDGE', [4.2, 0.7, 0.8], m.opalGlass, [-6.8, 1.55, 0]);
}

function addRange(root: THREE.Group, m: ForensicMaterials) {
  addArcSegments(root, 'FORENSIC__F15__CRESCENT_HANGAR_MODULE', 0, 1.8, 10.6, -2.75, -0.38, 18, 6.6, 2.5, m.anthracite, 3.55, true);
  for (let rib = 0; rib < 19; rib += 1) { const angle = THREE.MathUtils.lerp(-2.75, -0.38, rib / 18); pipe(root, `FORENSIC__F15__MASSIVE_STRUCTURAL_RIB_${rib + 1}`, new THREE.Vector3(Math.cos(angle) * 9.2, 0.25, 1.8 + Math.sin(angle) * 9.2), new THREE.Vector3(Math.cos(angle) * 12.0, 7.6 + (rib % 3) * 0.2, 1.8 + Math.sin(angle) * 12.0), 0.18, m.darkSteel, true); }
  for (let door = 0; door < 6; door += 1) { const angle = THREE.MathUtils.lerp(-2.5, -0.62, door / 5); const x = Math.cos(angle) * 9.15; const z = 1.8 + Math.sin(angle) * 9.15; const panel = box(root, `FORENSIC__F15__SENSOR_SLIDING_DOOR_${door + 1}`, [3.0, 4.2, 0.18], door % 2 ? m.titanium : m.paleCeramic, [x, 2.35, z], false, [0, -angle - Math.PI / 2, 0]); panel.userData.sensorPattern = ['LiDAR targets', 'machine-vision grid', 'radar geometry', 'thermal calibration', 'position markers', 'multispectral standard'][door]; for (let mark = 0; mark < 8; mark += 1) { const mx = x + Math.cos(angle + Math.PI / 2) * (-1.1 + mark * 0.31); const mz = z + Math.sin(angle + Math.PI / 2) * (-1.1 + mark * 0.31); box(root, `FORENSIC__F15__DOOR_SENSOR_MARK_${door + 1}_${mark + 1}`, [0.12, 0.12 + (mark % 3) * 0.12, 0.06], [m.coolWhite, m.cyan, m.amber][(door + mark) % 3], [mx, 1.0 + (mark % 4) * 0.78, mz], false, [0, -angle - Math.PI / 2, 0]); } }
  box(root, 'FORENSIC__F15__FORENSIC_EYE_TOWER', [2.1, 10.8, 2.1], m.basalt, [0, 5.5, 2.0], true);
  rotate(torus(root, 'FORENSIC__F15__ROTATING_FORENSIC_EYE', 3.1, 0.28, m.titanium, [0, 10.7, 2.0], [Math.PI / 2, 0, 0]), 0.006);
  for (let sensor = 0; sensor < 16; sensor += 1) { const angle = sensor / 16 * Math.PI * 2; sphere(root, `FORENSIC__F15__EYE_SENSOR_${sensor + 1}`, [0.18, 0.18, 0.28], sensor % 5 === 0 ? m.amber : m.smokedGlass, [Math.cos(angle) * 3.1, 10.7, 2.0 + Math.sin(angle) * 3.1]); }
  const roadLoop = [[-6, -2], [-2, -5], [4, -4.5], [7, -1], [5, 3], [0, 4.8], [-5, 3.4], [-6, -2]] as const; for (let segment = 0; segment < roadLoop.length - 1; segment += 1) pipe(root, `FORENSIC__F15__CONFIGURABLE_ROAD_LOOP_${segment + 1}`, new THREE.Vector3(roadLoop[segment][0], 0.12, roadLoop[segment][1]), new THREE.Vector3(roadLoop[segment + 1][0], 0.12, roadLoop[segment + 1][1]), 0.42, m.paving);
  for (let rail = 0; rail < 2; rail += 1) box(root, `FORENSIC__F15__COMPACT_RAIL_SEGMENT_${rail + 1}`, [9.0, 0.1, 0.09], m.titanium, [0, 0.16, -6.4 + rail * 0.65]);
  box(root, 'FORENSIC__F15__SEALED_WATER_DAMAGE_BASIN', [5.0, 0.12, 3.3], m.water, [-6.5, 0.1, 5.8]);
  const cage = new THREE.Group(); cage.name = 'FORENSIC__F15__NETTED_DRONE_TEST_VOLUME'; cage.position.set(8.2, 0, 5.2); root.add(cage); [-1, 1].forEach((x) => [-1, 1].forEach((z) => pipe(cage, `FORENSIC__F15__DRONE_CAGE_ARCH_${x}_${z}`, new THREE.Vector3(x * 2.7, 0.2, z * 2.2), new THREE.Vector3(x * 1.8, 8.6, z * 1.5), 0.11, m.paleCeramic))); for (let line = 0; line < 9; line += 1) box(cage, `FORENSIC__F15__CONDUCTIVE_CAGE_MESH_${line + 1}`, [5.4, 0.035, 4.4], m.mesh, [0, 0.5 + line * 0.9, 0]);
  for (let gantry = 0; gantry < 4; gantry += 1) { const x = -8.0 + gantry * 2.4; pipe(root, `FORENSIC__F15__SHIELDED_GANTRY_COLUMN_${gantry + 1}_A`, new THREE.Vector3(x, 0.2, -7.5), new THREE.Vector3(x, 5.8, -7.5), 0.14, m.darkSteel); pipe(root, `FORENSIC__F15__SHIELDED_GANTRY_COLUMN_${gantry + 1}_B`, new THREE.Vector3(x + 1.8, 0.2, -7.5), new THREE.Vector3(x + 1.8, 5.8, -7.5), 0.14, m.darkSteel); box(root, `FORENSIC__F15__GANTRY_BEAM_${gantry + 1}`, [2.1, 0.28, 0.35], m.titanium, [x + 0.9, 5.8, -7.5]); }
}

function createBuilding(record: ForensicBuildingProgram, materials: ForensicMaterials) {
  const root = new THREE.Group();
  root.name = `FORENSIC__${record.code}__${record.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  root.userData = { selectableId: DISTRICT_ID, individualSelectableId: `${DISTRICT_ID}__${record.code.toLowerCase()}`, districtId: DISTRICT_ID, exteriorProgram: true, forensicBuilding: true, buildingCode: record.code, displayName: record.name, purpose: record.purpose, placementZone: record.placementZone, exteriorMotif: record.exteriorMotif, footprintMetres: [...record.footprintMetres], heightMetres: record.heightMetres, featureRole: 'building', featureTag: record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') };
  switch (record.form) {
    case 'evidentia': addEvidentia(root, materials); break;
    case 'helix': addHelix(root, materials); break;
    case 'proteomic': addProteomic(root, materials); break;
    case 'microbiome': addMicrobiome(root, materials); break;
    case 'thanatoscan': addThanatoscan(root, materials); break;
    case 'ridge': addRidge(root, materials); break;
    case 'isotope': addIsotope(root, materials); break;
    case 'nanotrace': addNanotrace(root, materials); break;
    case 'ecological': addEcological(root, materials); break;
    case 'silicon': addSilicon(root, materials); break;
    case 'malware': addMalware(root, materials); break;
    case 'network': addNetwork(root, materials); break;
    case 'veritas': addVeritas(root, materials); break;
    case 'quantum': addQuantum(root, materials); break;
    case 'range': addRange(root, materials); break;
  }
  root.traverse((object) => { object.userData.selectableId = DISTRICT_ID; object.userData.districtId = DISTRICT_ID; });
  return root;
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radialMargin = 7.6; const angularMargin = (sector.endAngle - sector.startAngle) * 0.052;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT); const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
  return new THREE.Vector3(Math.cos(angle) * radius - definition.position[0], y, Math.sin(angle) * radius - definition.position[2]);
}

function arcPoints(definition: DistrictDefinition, radialT: number, startT: number, endT: number, count: number, y = FLOOR_Y) { return Array.from({ length: count }, (_, index) => pointInDistrict(definition, radialT, THREE.MathUtils.lerp(startT, endT, index / (count - 1)), y)); }
function radialPoints(definition: DistrictDefinition, angularT: number, startT: number, endT: number, count: number, y = FLOOR_Y) { return Array.from({ length: count }, (_, index) => pointInDistrict(definition, THREE.MathUtils.lerp(startT, endT, index / (count - 1)), angularT, y)); }

function makeRibbonGeometry(points: readonly THREE.Vector3[], width: number) {
  const vertices: number[] = []; const indices: number[] = [];
  points.forEach((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5); vertices.push(point.x + normal.x, point.y, point.z + normal.z, point.x - normal.x, point.y, point.z - normal.z); if (index < points.length - 1) { const base = index * 2; indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); } });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function addRibbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, mat: THREE.Material, walkable = true) {
  const ribbon = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), mat), name); ribbon.userData.walkable = walkable; ribbon.userData.navObstacle = false; ribbon.userData.forensicRoute = true; ribbon.receiveShadow = true; parent.add(ribbon); return ribbon;
}

function addChainlineTube(parent: THREE.Object3D, points: readonly THREE.Vector3[], m: ForensicMaterials) {
  for (let index = 0; index < points.length - 1; index += 1) pipe(parent, `FORENSIC__CHAINLINE_OPAL_TUBE_${index + 1}`, points[index], points[index + 1], 0.24, m.opalGlass);
  points.filter((_, index) => index % 7 === 0).forEach((point, index) => { pipe(parent, `FORENSIC__CHAINLINE_TITANIUM_PYLON_${index + 1}`, point.clone().setY(FLOOR_Y), point.clone(), 0.08, m.titanium, true); box(parent, `FORENSIC__CHAINLINE_PYLON_FOOT_${index + 1}`, [0.8, 0.18, 0.8], m.basalt, [point.x, 0.1, point.z], true); });
}

function addDistrictInfrastructure(district: THREE.Group, definition: DistrictDefinition, m: ForensicMaterials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'FORENSIC__DISTRICT_EVIDENCE_INFRASTRUCTURE';
  const evidenceLine = arcPoints(definition, 0.49, 0.025, 0.975, 108); addRibbon(infrastructure, 'FORENSIC__EVIDENCE_LINE_BOULEVARD', evidenceLine, 1.7, m.paving);
  const leftTrace = evidenceLine.map((point, index) => { const previous = evidenceLine[Math.max(0, index - 1)]; const next = evidenceLine[Math.min(evidenceLine.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x); return point.clone().addScaledVector(normal, 0.19 + Math.sin(index / 107 * Math.PI * 8) * 0.13).setY(FLOOR_Y + 0.028); });
  const rightTrace = evidenceLine.map((point, index) => point.clone().multiplyScalar(2).sub(leftTrace[index]).setY(FLOOR_Y + 0.029));
  pulse(addRibbon(infrastructure, 'FORENSIC__EVIDENCE_LINE_SIGNATURE_TRACE_A', leftTrace, 0.055, m.amber.clone(), false), 0.012, 0);
  pulse(addRibbon(infrastructure, 'FORENSIC__EVIDENCE_LINE_SIGNATURE_TRACE_B', rightTrace, 0.055, m.cyan.clone(), false), 0.012, 1.4);
  const serviceArc = arcPoints(definition, 0.75, 0.035, 0.965, 96); const service = addRibbon(infrastructure, 'FORENSIC__SEALED_SERVICE_ARC', serviceArc, 1.05, m.palePaving); service.userData.restrictedServiceRoute = true;
  [0.16, 0.38, 0.62, 0.85].forEach((angularT, index) => { const route = radialPoints(definition, angularT, 0.06, 0.94, 56); addRibbon(infrastructure, `FORENSIC__CONTROLLED_EVIDENCE_LINK_${index + 1}`, route, 0.74, index % 2 ? m.palePaving : m.paving); const drain = addRibbon(infrastructure, `FORENSIC__EXPOSED_SAMPLING_DRAIN_${index + 1}`, route.map((point) => point.clone().setY(FLOOR_Y + 0.026)), 0.075, m.water, false); drain.userData.environmentalSampling = true; });
  const chainline = arcPoints(definition, 0.64, 0.04, 0.96, 72, 6.8); addChainlineTube(infrastructure, chainline, m);
  for (let capsule = 0; capsule < 10; capsule += 1) { const marker = sphere(infrastructure, `FORENSIC__CHAINLINE_HERMETIC_CAPSULE_${capsule + 1}`, [0.34, 0.25, 0.25], m.amber.clone(), chainline[0].toArray() as [number, number, number]); marker.userData.animate = 'forensic-path-transit'; marker.userData.path = chainline.map((point) => point.toArray()); marker.userData.speed = 0.0045 + capsule * 0.00035; marker.userData.phase = capsule / 10; marker.userData.chainOfCustodyCourier = true; }
  for (let marker = 0; marker < 22; marker += 1) { const point = evidenceLine[Math.floor((marker + 0.5) / 22 * (evidenceLine.length - 1))]; box(infrastructure, `FORENSIC__EMBEDDED_SAMPLE_HASH_MARKER_${marker + 1}`, [0.7, 0.025, 0.18], marker % 3 === 0 ? m.amber : m.titanium, [point.x, FLOOR_Y + 0.035, point.z], false, [0, marker * 0.37, 0]); }
  district.add(infrastructure); return { infrastructure, evidenceLine, serviceArc };
}

function addDistrictLandscape(district: THREE.Group, definition: DistrictDefinition, m: ForensicMaterials) {
  const landscape = new THREE.Group(); landscape.name = 'FORENSIC__CONTROLLED_LOW_ANALYTICAL_LANDSCAPE';
  for (let patch = 0; patch < 28; patch += 1) { const point = pointInDistrict(definition, patch % 2 ? 0.31 : 0.83, 0.05 + Math.floor(patch / 2) * 0.067, FLOOR_Y); ellipse(landscape, `FORENSIC__LOW_PLANTING_BASIN_${patch + 1}`, [1.6 + (patch % 3) * 0.25, 0.72 + (patch % 4) * 0.13], 0.1, patch % 3 === 0 ? m.moss : m.silverGrass, [point.x, 0.09, point.z]); for (let blade = 0; blade < 5; blade += 1) box(landscape, `FORENSIC__SILVER_GRASS_BLADE_${patch + 1}_${blade + 1}`, [0.025, 0.35 + (blade % 3) * 0.12, 0.025], m.silverGrass, [point.x - 0.35 + blade * 0.18, 0.3, point.z], false, [0, 0, (blade - 2) * 0.05]); }
  for (let tree = 0; tree < 14; tree += 1) { const point = pointInDistrict(definition, tree % 2 ? 0.24 : 0.88, 0.09 + tree / 16, FLOOR_Y); cylinder(landscape, `FORENSIC__PRECISELY_TRIMMED_TREE_TRUNK_${tree + 1}`, 0.12, 1.25, m.darkSteel, [point.x, 0.65, point.z], false, 12); const crown = prepare(new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 1), m.moss), `FORENSIC__PRECISELY_TRIMMED_TREE_CROWN_${tree + 1}`); crown.position.set(point.x, 1.65, point.z); crown.scale.set(0.78, 1.05, 0.78); landscape.add(crown); }
  for (let pool = 0; pool < 5; pool += 1) { const point = pointInDistrict(definition, 0.57 + (pool % 2) * 0.13, 0.12 + pool * 0.19, FLOOR_Y); box(landscape, `FORENSIC__SHALLOW_REFLECTIVE_WATER_${pool + 1}`, [3.8 + (pool % 2) * 1.2, 0.06, 1.2], m.water, [point.x, 0.07, point.z], false, [0, -pool * 0.12, 0]); }
  district.add(landscape); return landscape;
}

export function buildForensicCyberforensicDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Forensic / Cyberforensic Labs District requires a masterplan sector');
  const materials = createForensicMaterials(); const { infrastructure, evidenceLine, serviceArc } = addDistrictInfrastructure(district, definition, materials); const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = FORENSIC_BUILDING_PROGRAM.map((record) => { const building = createBuilding(record, materials); const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02); building.position.copy(position); const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z); building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT }; district.add(building); return building; });
  facilities.forEach((facility, index) => { const record = FORENSIC_BUILDING_PROGRAM[index]; const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, record.footprintMetres[1] / 20 + 0.7); const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position); const route = record.radialT < 0.62 ? evidenceLine : serviceArc; const routePoint = route.reduce((closest, point) => point.distanceToSquared(entrance) < closest.distanceToSquared(entrance) ? point : closest, route[0]); const approachPoints = [routePoint.clone(), routePoint.clone().lerp(entrance, 0.52), entrance]; addRibbon(infrastructure, `FORENSIC__BUILDING_APPROACH_${record.code}`, approachPoints, 0.74, materials.palePaving); const verified = pulse(addRibbon(infrastructure, `FORENSIC__BUILDING_APPROACH_VERIFICATION_${record.code}`, approachPoints.map((point) => point.clone().setY(FLOOR_Y + 0.026)), 0.035, index % 5 === 0 ? materials.amber.clone() : materials.coolWhite.clone(), false), 0.014, index * 0.39); verified.userData.chainOfCustodyVerified = true; });
  district.userData.forensicCyberforensicDistrict = {
    identity: 'Forensic / Cyberforensic Labs District', architecturalLanguage: 'persistent signatures expressed as analytical monoliths, biological traces, material spectra, circuit paths, and isolated graph structures', buildingCount: facilities.length,
    buildings: FORENSIC_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, purpose: record.purpose, placementZone: record.placementZone, heightMetres: record.heightMetres, exteriorMotif: record.exteriorMotif })),
    interfaces: { northernSecurity: ['Evidentia Nexus', 'Thanatoscan Monolith'], innerBioanalytics: ['Helix Trace Institute', 'Proteomic Residue Observatory'], southernInorganicChemistry: ['Isotope Geolocation Spire', 'Nanotrace Materials Foundry', 'Cyber-Physical Reconstruction Range'], easternAcademic: ['Microbiome Provenance Conservatory', 'Ecological Evidence Terraces', 'Veritas Prism'] },
    circulation: { centralBoulevard: 'FORENSIC__EVIDENCE_LINE_BOULEVARD', illuminatedSignatureTraces: 2, restrictedServiceArc: 'FORENSIC__SEALED_SERVICE_ARC', controlledEvidenceLinks: 4, exactBuildingApproaches: 15 },
    chainline: { elevatedSealedCourier: true, opalTubeSegments: 71, titaniumPylons: 11, hermeticCapsules: 10, verifiedEvidenceAmberPulses: true },
    materials: ['anthracite technical ceramic', 'volcanic basalt', 'satin titanium', 'dark stainless steel', 'white technical ceramic', 'electrochromic smoked glass', 'translucent opal glass', 'conductive mesh', 'limited hardware-forensic copper'],
    lighting: { primary: ['cool white', 'ultraviolet violet', 'subdued cyan', 'verified-evidence amber'], redPolicy: 'reserved exclusively for active isolation, contamination, or electromagnetic containment' },
    landscape: { lowAndControlled: true, silverGrassBeds: 28, trimmedTrees: 14, shallowReflectingPools: 5, exposedSamplingDrains: 4, visualObstruction: false },
    evidenceLifecycle: ['evidence enters', 'fragments are isolated', 'signatures are extracted', 'events are reconstructed', 'provenance is preserved'], exteriorOnly: true,
  };
  district.userData.population = { plannedFacilities: FORENSIC_BUILDING_PROGRAM.map((record) => record.name), plannedObjects: ['Evidence Line', 'Chainline', 'sealed service arc', 'controlled evidence links', 'exposed sampling drains', 'controlled analytical landscape'], realizedFeatureTags: FORENSIC_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')), realizedFacilityCount: facilities.length, realizedObjectCount: infrastructure.children.length + landscape.children.length, distinct: true, asymmetricCampus: true, localRoadCount: 21, radialCoverage: 0.94, angularCoverage: 0.95, exteriorOnly: true, persistentSignatureSystem: true };
}
