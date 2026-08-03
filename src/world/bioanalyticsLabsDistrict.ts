import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type BioanalyticsBuildingForm =
  | 'prisma'
  | 'astral'
  | 'atlas'
  | 'nativa'
  | 'proteoform'
  | 'metabolis'
  | 'glycan'
  | 'fragmenta'
  | 'vesicula'
  | 'rheocell'
  | 'chronocellum'
  | 'cryotomos'
  | 'tension'
  | 'automata'
  | 'metron';

export interface BioanalyticsBuildingProgram {
  code: string;
  name: string;
  purpose: string;
  form: BioanalyticsBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
}

export const BIOANALYTICS_BUILDING_PROGRAM: readonly BioanalyticsBuildingProgram[] = [
  { code: 'BA1', name: 'Prisma Cytometrica', purpose: 'Spectral and Image-Enabled Cell Analysis Hall', form: 'prisma', footprintMetres: [120, 90], heightMetres: 62, radialT: 0.15, angularT: 0.62, placementZone: 'Inner public threshold toward Molecular Biology', exteriorMotif: 'three optical wedges, a sheath column, dichroic fins, and sorted pavement markers' },
  { code: 'BA2', name: 'Astral Forge', purpose: 'Ultrafast Mass Spectrometry and Ion-Mobility Center', form: 'astral', footprintMetres: [180, 95], heightMetres: 68, radialT: 0.40, angularT: 0.92, placementZone: 'Southern chemistry interface and central boulevard', exteriorMotif: 'parallel titanium analyser vaults, ion-trajectory ribs, an Ion Axis, and six columns' },
  { code: 'BA3', name: 'Atlas In Situ', purpose: 'Spatial Transcriptomics and Spatial Proteomics Complex', form: 'atlas', footprintMetres: [135, 100], heightMetres: 50, radialT: 0.15, angularT: 0.16, placementZone: 'Inner-western interface with Molecular Biology', exteriorMotif: 'eight offset tissue sections, capture-area tiles, and a coordinate-gridded Atlas Window' },
  { code: 'BA4', name: 'Nativa Helix Observatory', purpose: 'Long-Read DNA and Direct Native-RNA Sequencing Center', form: 'nativa', footprintMetres: [120, 85], heightMetres: 98, radialT: 0.15, angularT: 0.39, placementZone: 'Inner-western sequencing interface', exteriorMotif: 'asymmetric DNA and RNA spines joined by a continuous helical ribbon and pore wall' },
  { code: 'BA5', name: 'Proteoform Cipher House', purpose: 'Single-Molecule Protein Sequencing Institute', form: 'proteoform', footprintMetres: [145, 86], heightMetres: 46, radialT: 0.39, angularT: 0.31, placementZone: 'Central analytical research band', exteriorMotif: 'four cleavage bars, a molecular landing-pad array, and a twelve-ring Iteration Tower' },
  { code: 'BA6', name: 'Metabolis Aerarium', purpose: 'Four-Dimensional Metabolomics and Lipidomics Station', form: 'metabolis', footprintMetres: [125, 125], heightMetres: 74, radialT: 0.63, angularT: 0.82, placementZone: 'Southern chemistry interface', exteriorMotif: 'a circular molecular weather station, five unequal columns, orbital detector, and flux gardens' },
  { code: 'BA7', name: 'Glycan Arbor', purpose: 'Glycomics and Glycoproteoform Laboratory', form: 'glycan', footprintMetres: [120, 100], heightMetres: 60, radialT: 0.86, angularT: 0.92, placementZone: 'Outer-southern chemistry interface', exteriorMotif: 'a non-repeating branched ceramic exoskeleton, drainage nodes, and thirteen standards' },
  { code: 'BA8', name: 'Fragmenta Beacon', purpose: 'Liquid Biopsy, Cell-Free Nucleic Acid and Fragmentomics Tower', form: 'fragmenta', footprintMetres: [95, 95], heightMetres: 150, radialT: 0.84, angularT: 0.22, placementZone: 'Outer-eastern Forensic and Cyberforensic interface', exteriorMotif: 'a transparent-to-opaque tapered beacon wrapped by three broken fragment spirals' },
  { code: 'BA9', name: 'Vesicula Halo Array', purpose: 'Extracellular Vesicle and Biological Nanoparticle Analytics Center', form: 'vesicula', footprintMetres: [150, 125], heightMetres: 50, radialT: 0.84, angularT: 0.46, placementZone: 'Outer-eastern evidence analytics interface', exteriorMotif: 'nine unequal membrane vesicles, tension-supported halos, nanoparticle domes, and ripple pool' },
  { code: 'BA10', name: 'Rheocell Rapids', purpose: 'Cellular Mechanics and Deformability Analytics Institute', form: 'rheocell', footprintMetres: [170, 82], heightMetres: 50, radialT: 0.58, angularT: 0.70, placementZone: 'Central-southern mechanophenotyping band', exteriorMotif: 'a long responsive membrane forced through three structural constrictions beside a variable-flow watercourse' },
  { code: 'BA11', name: 'Chronocellum', purpose: 'Long-Term Living-Cell Imaging Observatory', form: 'chronocellum', footprintMetres: [110, 110], heightMetres: 82, radialT: 0.15, angularT: 0.84, placementZone: 'Inner imaging interface', exteriorMotif: 'eight shifted elliptical time frames beneath two intersecting light-sheet lattices' },
  { code: 'BA12', name: 'CryoTomos Vault', purpose: 'Cryogenic Electron Tomography and In-Situ Structural Analysis Center', form: 'cryotomos', footprintMetres: [145, 120], heightMetres: 94, radialT: 0.68, angularT: 0.08, placementZone: 'Quiet northern recessed plot behind the Calibration Spine', exteriorMotif: 'a buried faceted vault, symbolic electron column, and suspended cryogenic transfer tube' },
  { code: 'BA13', name: 'Molecular Tension Bridge', purpose: 'Single-Molecule Force, Optical Tweezers and Nanofluidics Laboratory', form: 'tension', footprintMetres: [160, 100], heightMetres: 70, radialT: 0.52, angularT: 0.51, placementZone: 'Central crossing over the Calibration Spine', exteriorMotif: 'paired optical-trap towers suspending a capsule and molecular-force line over a pedestrian deck' },
  { code: 'BA14', name: 'Automata Assay Foundry', purpose: 'Autonomous Bioanalytical Systems and Self-Driving Laboratory Center', form: 'automata', footprintMetres: [160, 90], heightMetres: 54, radialT: 0.42, angularT: 0.20, placementZone: 'Northern secured service boundary', exteriorMotif: 'a machine-scaled spine with twelve plug-in assay blocks, cartridge facade, and roof crane rail' },
  { code: 'BA15', name: 'Metron Bio', purpose: 'Bioanalytical Metrology, Reference Materials and Calibration Institute', form: 'metron', footprintMetres: [105, 85], heightMetres: 64, radialT: 0.84, angularT: 0.62, placementZone: 'Outer-eastern traceability interface', exteriorMotif: 'a strict gridded monolith aligned to Analytical Zero and exterior reference artefacts' },
] as const;

const DISTRICT_ID = 'bioanalytics-lab';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
// Preserve every vesicle, detector bead, dome, and landscape marker while
// keeping the complete package inside its Detail triangle contract.
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 20, 12);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_X = new THREE.Vector3(1, 0, 0);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

type BioanalyticsMaterials = ReturnType<typeof createBioanalyticsMaterials>;

function districtMaterial(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ name, color, roughness: 0.58, metalness: 0.16, ...options });
}

function createBioanalyticsMaterials() {
  const basalt = districtMaterial('Bioanalytics vibration-isolated black basalt', '#0a0e11', { roughness: 0.9, metalness: 0.04 });
  const blackConcrete = districtMaterial('Bioanalytics black aggregate concrete', '#171d20', { roughness: 0.96, metalness: 0 });
  const ceramic = districtMaterial('Bioanalytics white technical ceramic', '#eceeeb', { roughness: 0.48, metalness: 0.03 });
  const pearlCeramic = districtMaterial('Bioanalytics pearl-grey technical ceramic', '#cfd5d3', { roughness: 0.54, metalness: 0.05 });
  const titanium = districtMaterial('Bioanalytics pale titanium', '#aeb8ba', { roughness: 0.3, metalness: 0.88 });
  const aluminium = districtMaterial('Bioanalytics anodized aluminium', '#768489', { roughness: 0.34, metalness: 0.82 });
  const darkGlass = districtMaterial('Bioanalytics smoked electrochromic glass', '#10242b', { emissive: '#123b46', emissiveIntensity: 0.18, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.72, side: THREE.DoubleSide });
  const clearGlass = districtMaterial('Bioanalytics controlled transparent glass', '#8fc7cf', { emissive: '#3c7884', emissiveIntensity: 0.22, roughness: 0.05, metalness: 0.05, transparent: true, opacity: 0.42, side: THREE.DoubleSide });
  const membrane = districtMaterial('Vesicula translucent laminated membrane', '#b9d9d7', { emissive: '#4d9296', emissiveIntensity: 0.2, roughness: 0.26, metalness: 0.03, transparent: true, opacity: 0.58, side: THREE.DoubleSide });
  const dichroicCyan = districtMaterial('Bioanalytics dichroic cyan optical coating', '#54d7dc', { emissive: '#1c7f89', emissiveIntensity: 0.46, roughness: 0.16, metalness: 0.55 });
  const dichroicViolet = districtMaterial('Bioanalytics dichroic violet optical coating', '#8e72df', { emissive: '#4e2f9c', emissiveIntensity: 0.42, roughness: 0.16, metalness: 0.58 });
  const dichroicAmber = districtMaterial('Bioanalytics dichroic amber optical coating', '#e2ad62', { emissive: '#8c5521', emissiveIntensity: 0.36, roughness: 0.2, metalness: 0.48 });
  const ruby = districtMaterial('Fragmenta clinical dark ruby glass', '#6d142b', { emissive: '#9d1c42', emissiveIntensity: 0.7, roughness: 0.12, metalness: 0.24 });
  const coldLight = districtMaterial('Bioanalytics narrow diagnostic blue-white light', '#baf8ff', { emissive: '#72e8f5', emissiveIntensity: 2.3, roughness: 0.12, metalness: 0.18 });
  const amberLight = districtMaterial('Bioanalytics narrow diagnostic amber light', '#ffd38c', { emissive: '#ed9b39', emissiveIntensity: 2.1, roughness: 0.14, metalness: 0.1 });
  const greenLight = districtMaterial('Bioanalytics metabolic flux green light', '#8bf2b8', { emissive: '#3dc77d', emissiveIntensity: 2.0, roughness: 0.16, metalness: 0.08 });
  const palePaving = districtMaterial('Analytical Crescent pale calibrated paving', '#b9c2bf', { roughness: 0.93, metalness: 0.03 });
  const darkPaving = districtMaterial('Calibration Spine dark basalt paving', '#252d2f', { roughness: 0.91, metalness: 0.08 });
  const water = districtMaterial('Bioanalytics black reflecting water', '#07181d', { emissive: '#0a2930', emissiveIntensity: 0.12, roughness: 0.04, metalness: 0.18, transparent: true, opacity: 0.82 });
  const planting = districtMaterial('Bioanalytics silver research planting', '#6e8178', { roughness: 0.96, metalness: 0 });
  const darkPlanting = districtMaterial('Bioanalytics dark moss planting', '#233c32', { roughness: 0.98, metalness: 0 });
  [dichroicCyan, dichroicViolet, dichroicAmber, ruby, coldLight, amberLight, greenLight].forEach((material) => { material.userData.isDistrictAccent = true; });
  return { basalt, blackConcrete, ceramic, pearlCeramic, titanium, aluminium, darkGlass, clearGlass, membrane, dichroicCyan, dichroicViolet, dichroicAmber, ruby, coldLight, amberLight, greenLight, palePaving, darkPaving, water, planting, darkPlanting };
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

function box(parent: THREE.Object3D, name: string, size: readonly [number, number, number], material: THREE.Material, position: readonly [number, number, number], obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(UNIT_BOX, material), name, obstacle);
  mesh.scale.set(...size); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function cylinder(parent: THREE.Object3D, name: string, diameter: number, height: number, material: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 24, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(segments <= 12 ? UNIT_CYLINDER_12 : UNIT_CYLINDER_24, material), name, obstacle);
  mesh.scale.set(diameter, height, diameter); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function taperedCylinder(parent: THREE.Object3D, name: string, bottomDiameter: number, topDiameter: number, height: number, material: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 32) {
  const mesh = prepare(new THREE.Mesh(new THREE.CylinderGeometry(topDiameter * 0.5, bottomDiameter * 0.5, height, segments), material), name, obstacle);
  mesh.position.set(...position); parent.add(mesh); return mesh;
}

function ellipse(parent: THREE.Object3D, name: string, diameter: readonly [number, number], height: number, material: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 24) {
  const mesh = prepare(new THREE.Mesh(segments <= 12 ? UNIT_CYLINDER_12 : UNIT_CYLINDER_24, material), name, obstacle);
  mesh.scale.set(diameter[0], height, diameter[1]); mesh.position.set(...position); parent.add(mesh); return mesh;
}

function ellipsoid(parent: THREE.Object3D, name: string, scale: readonly [number, number, number], material: THREE.Material, position: readonly [number, number, number], obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(UNIT_SPHERE, material), name, obstacle);
  mesh.scale.set(...scale); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, material: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0], arc = Math.PI * 2) {
  const key = `${radius.toFixed(3)}|${tube.toFixed(3)}|${arc.toFixed(3)}`;
  let geometry = TORUS_CACHE.get(key);
  if (!geometry) { geometry = new THREE.TorusGeometry(radius, tube, 7, 48, arc); TORUS_CACHE.set(key, geometry); }
  const mesh = prepare(new THREE.Mesh(geometry, material), name); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function pipe(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material, obstacle = false) {
  const direction = end.clone().sub(start);
  const mesh = prepare(new THREE.Mesh(UNIT_CYLINDER_12, material), name, obstacle);
  mesh.scale.set(radius * 2, direction.length(), radius * 2); mesh.position.copy(start).add(end).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(UNIT_Y, direction.normalize()); parent.add(mesh); return mesh;
}

function slabBetween(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, width: number, height: number, material: THREE.Material, obstacle = false) {
  const direction = end.clone().sub(start);
  const mesh = prepare(new THREE.Mesh(UNIT_BOX, material), name, obstacle);
  mesh.scale.set(direction.length() + 0.05, height, width); mesh.position.copy(start).add(end).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(UNIT_X, direction.normalize()); parent.add(mesh); return mesh;
}

function pulse(object: THREE.Object3D, speed: number, phase = 0, minIntensity = 0.35, maxIntensity = 3.8) {
  object.userData.animate = 'bioanalytics-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate(object: THREE.Object3D, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'bioanalytics-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function addBrokenHelix(root: THREE.Object3D, prefix: string, radius: number, height: number, turns: number, segments: number, material: THREE.Material, yBase = 0.4) {
  let realized = 0;
  for (let index = 0; index < segments; index += 1) {
    if ((index + Math.floor(index / 7)) % 6 === 0) continue;
    const t0 = index / segments; const t1 = (index + 0.72) / segments;
    const a0 = t0 * turns * Math.PI * 2; const a1 = t1 * turns * Math.PI * 2;
    const start = new THREE.Vector3(Math.cos(a0) * radius, yBase + t0 * height, Math.sin(a0) * radius);
    const end = new THREE.Vector3(Math.cos(a1) * radius, yBase + t1 * height, Math.sin(a1) * radius);
    const member = pipe(root, `${prefix}_${realized + 1}`, start, end, 0.085, material.clone());
    pulse(member, 0.035 + (realized % 5) * 0.004, realized * 0.47);
    realized += 1;
  }
  return realized;
}

function wedgeGeometry(width: number, height: number, depth: number, shear: number) {
  const vertices = [
    -width / 2, 0, -depth / 2, width / 2, 0, -depth / 2, width / 2, 0, depth / 2, -width / 2, 0, depth / 2,
    -width * 0.36 + shear, height, -depth * 0.42, width * 0.36 + shear, height, -depth * 0.42, width * 0.36 + shear, height, depth * 0.42, -width * 0.36 + shear, height, depth * 0.42,
  ];
  const faces = [[0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7], [0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5], [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7]];
  const positions: number[] = []; faces.forEach((face) => face.forEach((index) => positions.push(vertices[index * 3], vertices[index * 3 + 1], vertices[index * 3 + 2])));
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.computeVertexNormals(); return geometry;
}

function addPrisma(root: THREE.Group, m: BioanalyticsMaterials) {
  box(root, 'BIOANALYTICS__BA1__RECESSED_BASALT_PLINTH', [11.6, 0.55, 8.4], m.basalt, [0, 0.28, 0], true);
  [-1, 0, 1].forEach((offset, index) => {
    const wedge = prepare(new THREE.Mesh(wedgeGeometry(5.3, 5.6 - Math.abs(offset) * 0.4, 7.1, offset * 0.38), index === 1 ? m.ceramic : m.pearlCeramic), `BIOANALYTICS__BA1__OPTICAL_WEDGE_${index + 1}`, true);
    wedge.position.set(offset * 2.35, 0.5, offset * -0.22); wedge.rotation.y = offset * 0.11; root.add(wedge);
  });
  for (let fin = 0; fin < 24; fin += 1) {
    const x = -5.35 + fin * 0.465; const material = [m.dichroicCyan, m.dichroicViolet, m.dichroicAmber][fin % 3];
    box(root, `BIOANALYTICS__BA1__DICHROIC_FIN_${fin + 1}`, [0.07, 4.1 + (fin % 4) * 0.25, 0.55], material, [x, 2.75, 3.72], false, [0, (fin % 7 - 3) * 0.045, 0]);
  }
  for (let row = 0; row < 5; row += 1) for (let col = 0; col < 14; col += 1) cylinder(root, `BIOANALYTICS__BA1__CELL_APERTURE_${row + 1}_${col + 1}`, 0.09 + ((row + col) % 3) * 0.025, 0.055, m.darkGlass, [-4.8 + col * 0.74, 1.25 + row * 0.74, 4.03], false, 12, [Math.PI / 2, 0, 0]);
  cylinder(root, 'BIOANALYTICS__BA1__SHEATH_COLUMN', 2.25, 6.6, m.clearGlass, [0, 3.45, 0.2], false, 32);
  for (let ring = 0; ring < 7; ring += 1) torus(root, `BIOANALYTICS__BA1__SHEATH_FOCUS_RING_${ring + 1}`, 0.92 - ring * 0.08, 0.035, m.coldLight.clone(), [0, 1.0 + ring * 0.75, 0.2]).userData.animate = 'bioanalytics-focus-ring';
  for (let filament = 0; filament < 8; filament += 1) { const angle = filament * Math.PI / 4; pulse(pipe(root, `BIOANALYTICS__BA1__SHEATH_FILAMENT_${filament + 1}`, new THREE.Vector3(Math.cos(angle) * 0.78, 0.75, 0.2 + Math.sin(angle) * 0.78), new THREE.Vector3(0, 5.95, 0.2), 0.025, m.coldLight.clone()), 0.05, filament * 0.7); }
  ellipse(root, 'BIOANALYTICS__BA1__ELLIPTICAL_ENTRANCE_CANOPY', [5.4, 2.2], 0.12, m.titanium, [0, 2.15, 5.25]);
  for (let lane = 0; lane < 5; lane += 1) for (let marker = 0; marker < 7; marker += 1) cylinder(root, `BIOANALYTICS__BA1__SORTING_MARKER_${lane + 1}_${marker + 1}`, 0.18, 0.045, marker > 3 ? m.coldLight : m.titanium, [(lane - 2) * (0.35 + marker * 0.08), 0.08, 5.0 + marker * 0.52], false, 16);
  for (let mast = 0; mast < 2; mast += 1) { pipe(root, `BIOANALYTICS__BA1__CALIBRATION_MAST_${mast + 1}`, new THREE.Vector3(-2.2 + mast * 4.4, 5.6, -1.4), new THREE.Vector3(-2.2 + mast * 4.4, 8.2, -1.4), 0.055, m.titanium); rotate(torus(root, `BIOANALYTICS__BA1__ROTATING_OPTICAL_BAFFLE_${mast + 1}`, 0.58, 0.06, m.aluminium, [-2.2 + mast * 4.4, 7.55, -1.4], [0, 0, Math.PI / 2]), 0.025 + mast * 0.006, 'z'); }
  for (let panel = 0; panel < 12; panel += 1) box(root, `BIOANALYTICS__BA1__REAGENT_CARTRIDGE_PANEL_${panel + 1}`, [0.62, 0.75, 0.08], m.ceramic, [-4.25 + (panel % 6) * 1.7, 1.0 + Math.floor(panel / 6) * 1.0, -4.05]);
}

function addAstral(root: THREE.Group, m: BioanalyticsMaterials) {
  box(root, 'BIOANALYTICS__BA2__MONOLITHIC_BASALT_PLATFORM', [18.4, 0.5, 9.2], m.basalt, [0, 0.25, 0], true);
  [-1, 1].forEach((side, index) => {
    box(root, `BIOANALYTICS__BA2__ANALYSER_VAULT_${index + 1}`, [15.8, 3.2 - index * 0.35, 3.15 - index * 0.4], m.titanium, [0, 2.05, side * 2.45], true, [0, side * 0.012, side * 0.025]);
    ellipsoid(root, `BIOANALYTICS__BA2__TAPERED_VAULT_ROOF_${index + 1}`, [15.2, 1.7 - index * 0.18, 3.0 - index * 0.32], m.aluminium, [0.8, 3.65 - index * 0.15, side * 2.45], false);
    for (let rib = 0; rib < 13; rib += 1) {
      const x = -6.9 + rib * 1.15; const outward = 2.0 + Math.sin(rib / 12 * Math.PI) * 0.85;
      pipe(root, `BIOANALYTICS__BA2__ION_TRAJECTORY_RIB_${index + 1}_${rib + 1}_A`, new THREE.Vector3(x, 0.55, side * 3.78), new THREE.Vector3(x + 0.1, 2.8, side * (3.85 + outward * 0.14)), 0.06, m.pearlCeramic);
      pipe(root, `BIOANALYTICS__BA2__ION_TRAJECTORY_RIB_${index + 1}_${rib + 1}_B`, new THREE.Vector3(x + 0.1, 2.8, side * (3.85 + outward * 0.14)), new THREE.Vector3(x + 0.25, 4.3, side * 3.45), 0.06, m.pearlCeramic);
    }
  });
  box(root, 'BIOANALYTICS__BA2__ION_AXIS_CONDUIT', [16.4, 0.82, 1.05], m.clearGlass, [0, 4.25, 0]);
  for (let point = 0; point < 9; point += 1) { const light = ellipsoid(root, `BIOANALYTICS__BA2__ION_AXIS_PACKET_${point + 1}`, [0.18, 0.18, 0.18], m.coldLight.clone(), [-7.3 + point * 1.8, 4.25, 0]); light.userData.animate = 'bioanalytics-horizontal-scan'; light.userData.baseX = -7.3; light.userData.travel = 14.6; light.userData.speed = 0.018 + point * 0.002; light.userData.phase = point / 9; }
  for (let tower = 0; tower < 6; tower += 1) { const x = -6.4 + tower * 2.55; cylinder(root, `BIOANALYTICS__BA2__CHROMATOGRAPHIC_COLUMN_${tower + 1}`, 0.72, 3.3 + (tower % 2) * 0.5, m.ceramic, [x, 5.55 + (tower % 2) * 0.25, tower % 2 ? 2.45 : -2.45], true, 24); torus(root, `BIOANALYTICS__BA2__COLUMN_CAP_RING_${tower + 1}`, 0.38, 0.055, m.coldLight.clone(), [x, 7.22 + (tower % 2) * 0.5, tower % 2 ? 2.45 : -2.45]); }
  for (let peak = 0; peak < 36; peak += 1) { const height = 0.25 + ((peak * 17) % 11) * 0.16; box(root, `BIOANALYTICS__BA2__MASS_SPECTRUM_ROOF_PEAK_${peak + 1}`, [0.12, height, 0.18], peak % 9 === 0 ? m.coldLight : m.aluminium, [-7.8 + peak * 0.445, 4.9 + height / 2, -0.62]); }
  for (let tick = 0; tick < 28; tick += 1) box(root, `BIOANALYTICS__BA2__NUMERICAL_AXIS_TICK_${tick + 1}`, [0.035, 0.025, 2.2 + (tick % 5) * 0.28], m.titanium, [-8.1 + tick * 0.6, 0.07, 5.15]);
}

function addAtlas(root: THREE.Group, m: BioanalyticsMaterials) {
  ellipse(root, 'BIOANALYTICS__BA3__CELLULAR_LANDSCAPE_DATUM', [13.4, 9.8], 0.1, m.darkPaving, [0, 0.08, 0]);
  for (let layer = 0; layer < 8; layer += 1) {
    const offsetX = Math.sin(layer * 1.7) * 0.46; const offsetZ = Math.cos(layer * 1.23) * 0.32; const width = 11.6 - (layer % 3) * 0.35; const depth = 7.8 - ((layer + 1) % 3) * 0.28;
    box(root, `BIOANALYTICS__BA3__TISSUE_SECTION_${layer + 1}`, [width, 0.46, depth], m.ceramic, [offsetX, 0.55 + layer * 0.56, offsetZ], true, [0, (layer - 3.5) * 0.012, 0]);
    box(root, `BIOANALYTICS__BA3__SECTION_GLASS_GAP_${layer + 1}`, [width * 0.98, 0.11, depth * 0.98], m.darkGlass, [offsetX, 0.83 + layer * 0.56, offsetZ]);
  }
  for (let row = 0; row < 8; row += 1) for (let col = 0; col < 16; col += 1) { const tile = box(root, `BIOANALYTICS__BA3__CAPTURE_TILE_${row + 1}_${col + 1}`, [0.42, 0.38, 0.06], (row + col) % 11 === 0 ? m.dichroicAmber : (row * 3 + col) % 7 === 0 ? m.dichroicCyan : m.pearlCeramic, [-5.0 + col * 0.665, 0.72 + row * 0.54, 4.02]); tile.rotation.y = ((row * 5 + col * 3) % 9 - 4) * 0.02; }
  ellipsoid(root, 'BIOANALYTICS__BA3__ATLAS_WINDOW', [4.4, 2.4, 0.14], m.clearGlass, [0.45, 2.55, 4.18]);
  for (let x = 0; x < 9; x += 1) box(root, `BIOANALYTICS__BA3__ATLAS_COORDINATE_X_${x + 1}`, [0.025, 4.1, 0.04], m.titanium, [-3.3 + x * 0.82, 2.55, 4.31]);
  for (let y = 0; y < 6; y += 1) box(root, `BIOANALYTICS__BA3__ATLAS_COORDINATE_Y_${y + 1}`, [7.2, 0.025, 0.04], m.titanium, [0, 0.85 + y * 0.68, 4.31]);
  for (let marker = 0; marker < 34; marker += 1) pulse(ellipsoid(root, `BIOANALYTICS__BA3__SPATIAL_MARKER_${marker + 1}`, [0.09, 0.09, 0.04], marker % 6 === 0 ? m.amberLight.clone() : m.coldLight.clone(), [-3.2 + ((marker * 13) % 63) / 9, 0.9 + ((marker * 17) % 31) / 10, 4.36]), 0.025, marker * 0.44);
  for (let plate = 0; plate < 4; plate += 1) box(root, `BIOANALYTICS__BA3__MULTIPLEX_CANOPY_PLATE_${plate + 1}`, [9.2 - plate * 0.7, 0.08, 3.0], plate % 2 ? m.titanium : m.pearlCeramic, [-1.2 + plate * 0.8, 5.35 + plate * 0.08, -0.35 + plate * 0.4], false, [0, (plate - 1.5) * 0.09, 0.02]);
  for (let island = 0; island < 8; island += 1) { const angle = island * Math.PI / 4; ellipse(root, `BIOANALYTICS__BA3__CELLULAR_PLANTING_ISLAND_${island + 1}`, [1.2 + (island % 3) * 0.25, 0.75 + (island % 2) * 0.2], 0.1, island % 2 ? m.planting : m.darkPlanting, [Math.cos(angle) * 7.0, 0.08, Math.sin(angle) * 5.6]); }
}

function addNativa(root: THREE.Group, m: BioanalyticsMaterials) {
  box(root, 'BIOANALYTICS__BA4__DNA_SPINE', [4.6, 8.8, 4.6], m.ceramic, [-2.5, 4.45, 0], true);
  box(root, 'BIOANALYTICS__BA4__RNA_SPINE', [3.25, 9.5, 3.6], m.darkGlass, [2.75, 4.8, -0.25], true, [0, 0, -0.065]);
  for (let segment = 0; segment < 56; segment += 1) {
    const t0 = segment / 56; const t1 = (segment + 1) / 56; const angle0 = -Math.PI * 0.65 + t0 * Math.PI * 4.2; const angle1 = -Math.PI * 0.65 + t1 * Math.PI * 4.2; const centerX0 = -2.5 + t0 * 5.25; const centerX1 = -2.5 + t1 * 5.25;
    pipe(root, `BIOANALYTICS__BA4__HELICAL_RIBBON_SEGMENT_${segment + 1}`, new THREE.Vector3(centerX0 + Math.cos(angle0) * 2.9, 0.55 + t0 * 8.5, Math.sin(angle0) * 2.45), new THREE.Vector3(centerX1 + Math.cos(angle1) * 2.9, 0.55 + t1 * 8.5, Math.sin(angle1) * 2.45), 0.11, segment % 2 ? m.aluminium : m.titanium);
  }
  box(root, 'BIOANALYTICS__BA4__PORE_WALL', [10.8, 7.1, 0.28], m.pearlCeramic, [0, 3.7, 3.35], true);
  for (let row = 0; row < 6; row += 1) for (let col = 0; col < 13; col += 1) { const diameter = 0.12 + ((row * 7 + col * 3) % 8) * 0.06; cylinder(root, `BIOANALYTICS__BA4__PORE_OPENING_${row + 1}_${col + 1}`, diameter, 0.05, m.darkGlass, [-4.8 + col * 0.8, 0.9 + row * 1.08, 3.53], false, 16, [Math.PI / 2, 0, 0]); }
  box(root, 'BIOANALYTICS__BA4__IONIC_CURRENT_CHANNEL', [10.9, 0.18, 0.62], m.water, [0, 0.1, 4.1]);
  for (let pulseIndex = 0; pulseIndex < 24; pulseIndex += 1) pulse(box(root, `BIOANALYTICS__BA4__VARIABLE_READ_PULSE_${pulseIndex + 1}`, [0.14 + (pulseIndex % 5) * 0.12, 0.06, 0.08], m.coldLight.clone(), [-5.0 + pulseIndex * 0.43, 4.5, -2.35]), 0.022 + (pulseIndex % 4) * 0.003, pulseIndex * 0.48);
  torus(root, 'BIOANALYTICS__BA4__DNA_RADIAL_CROWN', 2.25, 0.15, m.titanium, [-2.5, 9.1, 0]);
  for (let plate = 0; plate < 5; plate += 1) box(root, `BIOANALYTICS__BA4__RNA_ADAPTIVE_CROWN_PLATE_${plate + 1}`, [3.9 - plate * 0.35, 0.12, 1.15], m.aluminium, [2.75 + (plate - 2) * 0.15, 9.65 + plate * 0.12, -1.1 + plate * 0.52], false, [0, plate * 0.13, 0.02]);
}

function addProteoform(root: THREE.Group, m: BioanalyticsMaterials) {
  box(root, 'BIOANALYTICS__BA5__BLACK_ARRAY_DATUM', [14.3, 0.35, 8.2], m.basalt, [0, 0.2, 0], true);
  for (let bar = 0; bar < 4; bar += 1) box(root, `BIOANALYTICS__BA5__CLEAVAGE_BAR_${bar + 1}`, [3.05, 4.1, 7.25], bar % 2 ? m.pearlCeramic : m.ceramic, [-5.1 + bar * 3.4, 2.3, 0], true);
  for (let cut = 0; cut < 3; cut += 1) box(root, `BIOANALYTICS__BA5__GLAZED_CLEAVAGE_INCISION_${cut + 1}`, [0.32, 4.25, 7.35], m.clearGlass, [-3.4 + cut * 3.4, 2.3, 0]);
  for (let row = 0; row < 9; row += 1) for (let col = 0; col < 24; col += 1) { const disc = cylinder(root, `BIOANALYTICS__BA5__LANDING_PAD_DISC_${row + 1}_${col + 1}`, 0.24 + ((row + col) % 3) * 0.035, 0.06 + ((row * 5 + col) % 4) * 0.02, (row * 7 + col) % 13 === 0 ? m.coldLight.clone() : m.ceramic, [-6.35 + col * 0.55, 0.72 + row * 0.39, 3.68], false, 16, [Math.PI / 2, 0, 0]); if ((row * 7 + col) % 13 === 0) pulse(disc, 0.018, row * 0.5 + col * 0.13); }
  for (let ring = 0; ring < 12; ring += 1) { const iteration = torus(root, `BIOANALYTICS__BA5__ITERATION_TOWER_RING_${ring + 1}`, 1.28, 0.11, ring % 4 === 0 ? m.coldLight.clone() : m.titanium, [-6.15, 0.7 + ring * 0.43, -2.95], [Math.PI / 2, ring * 0.12, 0]); if (ring % 4 === 0) pulse(iteration, 0.02, ring * 0.65); }
  pipe(root, 'BIOANALYTICS__BA5__ITERATION_MAINTENANCE_GANTRY', new THREE.Vector3(-4.72, 0.45, -2.95), new THREE.Vector3(-4.72, 6.15, -2.95), 0.08, m.aluminium);
  for (let row = 0; row < 6; row += 1) for (let col = 0; col < 14; col += 1) cylinder(root, `BIOANALYTICS__BA5__ROOF_SINGLE_MOLECULE_CELL_${row + 1}_${col + 1}`, 0.26, 0.04, m.darkGlass, [-5.0 + col * 0.76, 4.42, -2.25 + row * 0.9], false, 16);
}

function addMetabolis(root: THREE.Group, m: BioanalyticsMaterials) {
  ellipse(root, 'BIOANALYTICS__BA6__MOLECULAR_WEATHER_STATION', [8.5, 8.5], 6.1, m.aluminium, [0, 3.15, 0], true, 32);
  for (let floor = 0; floor < 5; floor += 1) torus(root, `BIOANALYTICS__BA6__INTERFERENCE_SHINGLE_BAND_${floor + 1}`, 4.3, 0.08, [m.dichroicCyan, m.dichroicAmber, m.dichroicViolet][floor % 3], [0, 0.75 + floor * 1.15, 0]);
  const towerData: Array<[number, number, number]> = [[-5.0, -2.0, 5.0], [-3.2, 4.0, 6.0], [0.4, 5.0, 7.0], [4.5, 2.7, 5.7], [4.3, -3.3, 6.5]];
  towerData.forEach(([x, z, height], index) => { cylinder(root, `BIOANALYTICS__BA6__SEPARATION_COLUMN_${index + 1}`, 1.15 + index * 0.08, height, index % 2 ? m.ceramic : m.titanium, [x, height / 2, z], true, 8 + index * 2); rotate(torus(root, `BIOANALYTICS__BA6__WIND_RESPONSE_RING_${index + 1}`, 0.75 + index * 0.05, 0.055, m.coldLight.clone(), [x, height - 0.55, z], [Math.PI / 2, 0, 0]), 0.012 + index * 0.003); });
  torus(root, 'BIOANALYTICS__BA6__ION_MOBILITY_ORBITAL_DETECTOR', 5.65, 0.32, m.titanium, [0, 3.75, 0]);
  for (let scale = 0; scale < 42; scale += 1) { const angle = scale * Math.PI * 2 / 42; box(root, `BIOANALYTICS__BA6__ORBITAL_REFLECTIVE_SCALE_${scale + 1}`, [0.16, 0.05, 0.38], scale % 3 ? m.aluminium : m.dichroicCyan, [Math.cos(angle) * 5.65, 3.45, Math.sin(angle) * 5.65], false, [0, -angle, 0.25]); }
  for (let channel = 0; channel < 8; channel += 1) { const angle = -0.85 + channel * 0.24; slabBetween(root, `BIOANALYTICS__BA6__METABOLIC_GARDEN_CHANNEL_${channel + 1}`, new THREE.Vector3(Math.sin(angle) * 1.8, 0.08, 4.1), new THREE.Vector3(Math.sin(angle) * 5.2, 0.08, 7.2), 0.16, 0.04, channel % 2 ? m.water : m.greenLight); ellipse(root, `BIOANALYTICS__BA6__METABOLIC_GARDEN_BASIN_${channel + 1}`, [1.25, 0.72], 0.09, channel % 2 ? m.planting : m.darkPlanting, [Math.sin(angle) * 5.7, 0.08, 7.55]); }
  for (let boom = 0; boom < 5; boom += 1) pipe(root, `BIOANALYTICS__BA6__ATMOSPHERIC_BOOM_${boom + 1}`, new THREE.Vector3(-2.4 + boom * 1.2, 6.15, 0), new THREE.Vector3(-2.8 + boom * 1.4, 8.0 + (boom % 2) * 0.5, -1.5), 0.045, m.titanium);
}

function addGlycan(root: THREE.Group, m: BioanalyticsMaterials) {
  cylinder(root, 'BIOANALYTICS__BA7__DARK_POLYGONAL_CORE', 8.1, 5.5, m.blackConcrete, [0, 2.8, 0], true, 10);
  cylinder(root, 'BIOANALYTICS__BA7__MILKY_GLASS_FACADE', 7.75, 4.9, m.membrane, [0, 2.85, 0], false, 10);
  for (let support = 0; support < 6; support += 1) {
    const angle = support * Math.PI / 3; const base = new THREE.Vector3(Math.cos(angle) * 5.7, 0.1, Math.sin(angle) * 5.7); const node1 = new THREE.Vector3(Math.cos(angle) * 4.5, 2.0, Math.sin(angle) * 4.5); pipe(root, `BIOANALYTICS__BA7__PRIMARY_BRANCH_${support + 1}`, base, node1, 0.17, m.ceramic, true); ellipsoid(root, `BIOANALYTICS__BA7__PRIMARY_JUNCTION_NODE_${support + 1}`, [0.44, 0.44, 0.44], m.ceramic, node1.toArray() as [number, number, number]);
    for (let branch = 0; branch < 3; branch += 1) { const branchAngle = angle + (branch - 1) * 0.28; const node2 = new THREE.Vector3(Math.cos(branchAngle) * (4.25 + branch * 0.25), 4.05 + branch * 0.28, Math.sin(branchAngle) * (4.25 + branch * 0.25)); pipe(root, `BIOANALYTICS__BA7__SECONDARY_BRANCH_${support + 1}_${branch + 1}`, node1, node2, 0.12, m.ceramic); ellipsoid(root, `BIOANALYTICS__BA7__SECONDARY_JUNCTION_NODE_${support + 1}_${branch + 1}`, [0.3, 0.3, 0.3], branch === 1 ? m.coldLight.clone() : m.ceramic, node2.toArray() as [number, number, number]); for (let twig = 0; twig < 2; twig += 1) { const twigAngle = branchAngle + (twig ? 0.17 : -0.17); const end = new THREE.Vector3(Math.cos(twigAngle) * (5.0 + branch * 0.32), 6.15 + twig * 0.25, Math.sin(twigAngle) * (5.0 + branch * 0.32)); pipe(root, `BIOANALYTICS__BA7__TERTIARY_BRANCH_${support + 1}_${branch + 1}_${twig + 1}`, node2, end, 0.075, m.ceramic); } }
  }
  for (let lobe = 0; lobe < 5; lobe += 1) { const angle = lobe * Math.PI * 2 / 5; ellipse(root, `BIOANALYTICS__BA7__FORKED_ROOF_LOBE_${lobe + 1}`, [3.5, 2.6], 0.3, m.pearlCeramic, [Math.cos(angle) * 2.5, 5.6 + (lobe % 2) * 0.3, Math.sin(angle) * 2.5]); }
  for (let standard = 0; standard < 13; standard += 1) { const angle = standard * Math.PI * 2 / 13; const marker = box(root, `BIOANALYTICS__BA7__CALIBRATION_STONE_${standard + 1}`, [0.65, 0.45 + (standard % 3) * 0.12, 0.65], m.basalt, [Math.cos(angle) * 7.0, 0.25, Math.sin(angle) * 6.0]); marker.rotation.y = angle; }
  torus(root, 'BIOANALYTICS__BA7__AMBER_NODE_ENTRANCE', 1.3, 0.3, m.dichroicAmber, [0, 1.6, 4.05], [0, 0, 0]);
}

function addFragmenta(root: THREE.Group, m: BioanalyticsMaterials) {
  ellipse(root, 'BIOANALYTICS__BA8__BLACK_REFLECTING_BASIN', [9.4, 9.4], 0.13, m.water, [0, 0.08, 0]);
  cylinder(root, 'BIOANALYTICS__BA8__CIRCULAR_FINNED_BASE', 7.3, 2.2, m.darkGlass, [0, 1.2, 0], true, 36);
  taperedCylinder(root, 'BIOANALYTICS__BA8__TAPERED_FRAGMENT_TOWER_LOWER', 5.8, 4.35, 6.2, m.clearGlass, [0, 4.0, 0], true, 36);
  taperedCylinder(root, 'BIOANALYTICS__BA8__TAPERED_FRAGMENT_TOWER_UPPER', 4.35, 2.8, 7.0, m.pearlCeramic, [0, 10.55, 0], true, 36);
  for (let band = 0; band < 3; band += 1) addBrokenHelix(root, `BIOANALYTICS__BA8__BROKEN_FRAGMENT_BAND_${band + 1}_SEGMENT`, 3.2 - band * 0.18, 13.4, 1.55 + band * 0.16, 34, [m.coldLight, m.dichroicViolet, m.dichroicCyan][band], 1.0 + band * 0.28);
  box(root, 'BIOANALYTICS__BA8__CLINICAL_RUBY_DATUM', [0.16, 13.2, 0.12], m.ruby, [0, 7.9, 2.3]);
  for (let fin = 0; fin < 36; fin += 1) { const angle = fin * Math.PI * 2 / 36; const width = 0.12 + ((fin * 7) % 9) * 0.025; box(root, `BIOANALYTICS__BA8__FRAGMENT_LENGTH_FIN_${fin + 1}`, [width, 1.75, 0.35], m.titanium, [Math.cos(angle) * 3.75, 1.15, Math.sin(angle) * 3.75], false, [0, -angle, 0]); }
  for (let bridge = 0; bridge < 4; bridge += 1) { const angle = bridge * Math.PI / 2; slabBetween(root, `BIOANALYTICS__BA8__BASIN_BRIDGE_${bridge + 1}`, new THREE.Vector3(Math.cos(angle) * 3.3, 0.18, Math.sin(angle) * 3.3), new THREE.Vector3(Math.cos(angle) * 5.5, 0.18, Math.sin(angle) * 5.5), 0.72, 0.11, bridge === 1 ? m.ceramic : m.titanium); }
  torus(root, 'BIOANALYTICS__BA8__SUSPENDED_BLADE_CROWN', 2.45, 0.18, m.titanium, [0, 14.8, 0]);
  for (let blade = 0; blade < 18; blade += 1) { const angle = blade * Math.PI * 2 / 18; box(root, `BIOANALYTICS__BA8__CROWN_RADIAL_BLADE_${blade + 1}`, [0.12, 0.35, 2.2], blade % 6 === 0 ? m.coldLight.clone() : m.aluminium, [Math.cos(angle) * 1.25, 14.82, Math.sin(angle) * 1.25], false, [0, -angle, 0]); }
  box(root, 'BIOANALYTICS__BA8__SECURE_COURIER_NEEDLE_CANOPY', [1.2, 0.12, 7.2], m.titanium, [-3.7, 2.15, -4.2], false, [0, 0.25, -0.03]);
}

function addVesicula(root: THREE.Group, m: BioanalyticsMaterials) {
  ellipse(root, 'BIOANALYTICS__BA9__GRAPHITE_ANALYTICS_CORE', [8.6, 7.2], 3.4, m.blackConcrete, [0, 1.75, 0], true, 20);
  const pods: Array<[number, number, number, number, number]> = [[-5.2, -2.8, 3.0, 2.2, 0.2], [-5.4, 1.0, 2.5, 2.8, -0.1], [-3.3, 4.1, 2.3, 2.0, 0.25], [0.2, 4.8, 2.8, 2.5, -0.2], [4.0, 3.8, 3.4, 3.8, 0.1], [5.4, 0.1, 2.6, 2.3, -0.25], [4.8, -3.5, 2.2, 2.0, 0.3], [1.3, -4.7, 2.7, 2.4, -0.12], [-2.3, -4.5, 2.4, 2.1, 0.18]];
  pods.forEach(([x, z, diameter, height, tilt], index) => { ellipsoid(root, `BIOANALYTICS__BA9__VESICLE_POD_${index + 1}`, [diameter, height, diameter * (0.9 + (index % 3) * 0.07)], index % 3 === 0 ? m.clearGlass : m.membrane, [x, height * 0.52 + 0.2, z], true, [tilt, index * 0.3, tilt * 0.4]); const halo = torus(root, `BIOANALYTICS__BA9__VESICLE_HALO_${index + 1}`, diameter * 0.65, 0.06, index % 2 ? m.titanium : m.coldLight.clone(), [x, height * 0.62 + 0.2, z], [Math.PI / 2 + tilt, index * 0.21, tilt]); if (index % 2 === 0) pulse(halo, 0.018, index * 0.8); if (index % 3 === 0) ellipsoid(root, `BIOANALYTICS__BA9__SECONDARY_VESICLE_${index + 1}`, [0.42, 0.42, 0.42], m.membrane, [x + diameter * 0.55, height * 0.9, z - diameter * 0.3]); });
  for (let dome = 0; dome < 42; dome += 1) { const row = Math.floor(dome / 7); const col = dome % 7; ellipsoid(root, `BIOANALYTICS__BA9__NANOPARTICLE_ROOF_DOME_${dome + 1}`, [0.24 + (dome % 3) * 0.05, 0.18, 0.24 + (dome % 3) * 0.05], m.clearGlass, [-2.8 + col * 0.92, 3.55, -2.2 + row * 0.86]); }
  ellipse(root, 'BIOANALYTICS__BA9__RIPPLE_DETECTION_POOL', [4.0, 4.0], 0.08, m.water, [0, 0.07, 7.0]);
  for (let ripple = 0; ripple < 6; ripple += 1) { const ring = torus(root, `BIOANALYTICS__BA9__CONTROLLED_RIPPLE_${ripple + 1}`, 0.4 + ripple * 0.28, 0.025, m.coldLight.clone(), [0, 0.13, 7.0]); ring.userData.animate = 'bioanalytics-ripple'; ring.userData.baseScale = 0.65 + ripple * 0.14; ring.userData.phase = ripple / 6; }
  for (let dock = 0; dock < pods.length; dock += 1) slabBetween(root, `BIOANALYTICS__BA9__MEMBRANE_DOCK_LINK_${dock + 1}`, new THREE.Vector3(pods[dock][0] * 0.45, 1.2, pods[dock][1] * 0.45), new THREE.Vector3(pods[dock][0] * 0.82, 1.2, pods[dock][1] * 0.82), 0.48, 0.24, m.clearGlass);
}

function addRheocell(root: THREE.Group, m: BioanalyticsMaterials) {
  box(root, 'BIOANALYTICS__BA10__FLEXIBLE_MEMBRANE_INNER_BODY', [16.2, 3.9, 6.6], m.membrane, [0, 2.05, 0], true);
  [-5.2, 0, 5.2].forEach((x, frame) => { box(root, `BIOANALYTICS__BA10__CONSTRICTION_FRAME_${frame + 1}_TOP`, [0.55, 0.55, 8.0], m.titanium, [x, 4.45, 0]); box(root, `BIOANALYTICS__BA10__CONSTRICTION_FRAME_${frame + 1}_NORTH`, [0.55, 4.6, 0.55], m.titanium, [x, 2.3, -3.75], true); box(root, `BIOANALYTICS__BA10__CONSTRICTION_FRAME_${frame + 1}_SOUTH`, [0.55, 4.6, 0.55], m.titanium, [x, 2.3, 3.75], true); });
  [-2.7, 2.7].forEach((x, section) => ellipsoid(root, `BIOANALYTICS__BA10__DEFORMED_MEMBRANE_BULGE_${section + 1}`, [5.9, 4.2, 7.2], m.clearGlass, [x, 2.0, 0], false));
  for (let side = -1; side <= 1; side += 2) for (let rib = 0; rib < 17; rib += 1) { const x = -7.6 + rib * 0.95; const stress = 0.35 + Math.abs(Math.sin((x + 5.2) * 0.6)) * 0.65; pipe(root, `BIOANALYTICS__BA10__STRESS_RIB_${side < 0 ? 'N' : 'S'}_${rib + 1}`, new THREE.Vector3(x, 0.25, side * 3.25), new THREE.Vector3(x + Math.sin(rib) * 0.2, 4.0, side * (3.25 + stress)), 0.045, rib % 4 === 0 ? m.coldLight.clone() : m.titanium); }
  const waterPoints = Array.from({ length: 14 }, (_, index) => new THREE.Vector3(-8.4 + index * 1.3, 0.08, 5.15 + Math.sin(index * 0.78) * (index % 3 === 0 ? 0.7 : 0.22)));
  for (let segment = 0; segment < waterPoints.length - 1; segment += 1) slabBetween(root, `BIOANALYTICS__BA10__RHEOLOGICAL_WATERCOURSE_${segment + 1}`, waterPoints[segment], waterPoints[segment + 1], segment % 3 === 0 ? 0.9 : 0.38, 0.06, m.water);
  for (let camera = 0; camera < 5; camera += 1) { box(root, `BIOANALYTICS__BA10__HIGH_SPEED_CAMERA_HOUSING_${camera + 1}`, [1.0, 0.62, 0.8], m.aluminium, [-6.8 + camera * 3.4, 5.1, -1.8], false, [0.12, 0, 0]); cylinder(root, `BIOANALYTICS__BA10__CAMERA_OBJECTIVE_${camera + 1}`, 0.46, 0.25, m.darkGlass, [-6.8 + camera * 3.4, 4.88, -2.2], false, 24, [Math.PI / 2, 0, 0]); }
}

function addChronocellum(root: THREE.Group, m: BioanalyticsMaterials) {
  cylinder(root, 'BIOANALYTICS__BA11__MIRRORED_OPTICAL_CORE', 4.2, 7.1, m.darkGlass, [0, 3.6, 0], true, 32);
  for (let plate = 0; plate < 8; plate += 1) { const x = Math.sin(plate * 0.76) * 0.65; const z = Math.cos(plate * 0.61) * 0.55; const angle = (plate - 3.5) * 0.13; ellipse(root, `BIOANALYTICS__BA11__TIME_FRAME_PLATE_${plate + 1}`, [9.8 - plate * 0.18, 7.1 + (plate % 3) * 0.3], 0.18, m.pearlCeramic, [x, 0.72 + plate * 0.86, z]); const edge = torus(root, `BIOANALYTICS__BA11__TIME_FRAME_EDGE_${plate + 1}`, 3.8, 0.045, m.coldLight.clone(), [x, 0.84 + plate * 0.86, z]); edge.scale.x = 1.25 - plate * 0.015; edge.scale.z = 0.9 + (plate % 3) * 0.04; edge.rotation.y = angle; pulse(edge, 0.014, plate * 0.75); }
  for (let sheet = 0; sheet < 2; sheet += 1) for (let line = 0; line < 13; line += 1) { const offset = -5.0 + line * 0.83; const y = 8.0 + sheet * 0.4; const angle = sheet ? -0.42 : 0.42; const start = new THREE.Vector3(-5.2, y + offset * Math.sin(angle) * 0.25, offset); const end = new THREE.Vector3(5.2, y - offset * Math.sin(angle) * 0.25, offset); pipe(root, `BIOANALYTICS__BA11__LIGHT_SHEET_LATTICE_${sheet + 1}_${line + 1}`, start, end, 0.035, line % 4 === 0 ? m.coldLight : m.titanium); }
  torus(root, 'BIOANALYTICS__BA11__DRY_OPTICAL_ISOLATION_MOAT', 6.25, 0.62, m.basalt, [0, 0.08, 0]);
  for (let bridge = 0; bridge < 4; bridge += 1) { const angle = bridge * Math.PI / 2; slabBetween(root, `BIOANALYTICS__BA11__ROTATED_ACCESS_BRIDGE_${bridge + 1}`, new THREE.Vector3(Math.cos(angle) * 4.1, 0.18, Math.sin(angle) * 4.1), new THREE.Vector3(Math.cos(angle) * 7.1, 0.18, Math.sin(angle) * 7.1), 0.65, 0.12, m.titanium); }
  ellipsoid(root, 'BIOANALYTICS__BA11__CONVEX_VOLUMETRIC_WINDOW', [3.5, 3.0, 0.35], m.clearGlass, [-4.25, 3.4, 0], false, [0, Math.PI / 2, 0]);
}

function addCryotomos(root: THREE.Group, m: BioanalyticsMaterials) {
  ellipse(root, 'BIOANALYTICS__BA12__THERMAL_VIBRATION_DEPRESSION', [14.5, 11.8], 0.22, m.pearlCeramic, [0, -0.04, 0]);
  const vault = prepare(new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), m.basalt), 'BIOANALYTICS__BA12__FACETED_SUBTERRANEAN_VAULT', true); vault.scale.set(7.0, 2.9, 5.0); vault.position.set(-0.8, 1.5, 0.2); root.add(vault);
  for (let aperture = 0; aperture < 8; aperture += 1) box(root, `BIOANALYTICS__BA12__DEEP_RECESSED_APERTURE_${aperture + 1}`, [0.85, 0.16, 0.18], m.darkGlass, [-4.3 + aperture * 1.0, 1.25 + (aperture % 2) * 0.55, 4.25], false, [0, 0, -0.04]);
  cylinder(root, 'BIOANALYTICS__BA12__ELECTRON_COLUMN_TOWER', 3.6, 8.8, m.ceramic, [-1.0, 5.2, -0.5], true, 32);
  for (let buttress = 0; buttress < 3; buttress += 1) { const angle = buttress * Math.PI * 2 / 3; box(root, `BIOANALYTICS__BA12__DARK_COLUMN_BUTTRESS_${buttress + 1}`, [0.72, 7.2, 1.1], m.blackConcrete, [-1.0 + Math.cos(angle) * 2.15, 4.1, -0.5 + Math.sin(angle) * 2.15], true, [0, -angle, 0]); }
  for (let plate = 0; plate < 5; plate += 1) cylinder(root, `BIOANALYTICS__BA12__FROST_CRYSTAL_CROWN_PLATE_${plate + 1}`, 4.0 - plate * 0.35, 0.18, plate % 2 ? m.ceramic : m.pearlCeramic, [-1.0, 9.7 + plate * 0.22, -0.5], false, 12, [0, plate * 0.16, 0]);
  torus(root, 'BIOANALYTICS__BA12__FLOATING_ELECTRON_SHIELD', 2.8, 0.22, m.titanium, [-1.0, 11.0, -0.5]);
  box(root, 'BIOANALYTICS__BA12__PREPARATION_ANNEX', [5.1, 2.7, 4.2], m.blackConcrete, [5.2, 1.4, -1.7], true, [0, -0.08, 0]);
  slabBetween(root, 'BIOANALYTICS__BA12__CRYOGENIC_TRANSFER_TUBE', new THREE.Vector3(0.65, 3.25, -1.1), new THREE.Vector3(4.0, 3.25, -1.6), 1.25, 1.05, m.titanium, true);
  slabBetween(root, 'BIOANALYTICS__BA12__TRANSFER_TUBE_GLASS_DATUM', new THREE.Vector3(0.7, 3.26, -1.1), new THREE.Vector3(3.95, 3.26, -1.58), 0.16, 0.11, m.coldLight.clone());
  for (let bridge = 0; bridge < 2; bridge += 1) slabBetween(root, `BIOANALYTICS__BA12__RESTRICTED_ACCESS_BRIDGE_${bridge + 1}`, new THREE.Vector3(-2.5 + bridge * 5.0, 0.2, 4.0), new THREE.Vector3(-3.5 + bridge * 7.0, 0.2, 7.0), 0.95, 0.16, m.titanium);
  for (let conduit = 0; conduit < 5; conduit += 1) pipe(root, `BIOANALYTICS__BA12__INSULATED_UTILITY_CONDUIT_${conduit + 1}`, new THREE.Vector3(3.2, 0.5 + conduit * 0.32, 0.2), new THREE.Vector3(6.7, 0.5 + conduit * 0.32, 0.2), 0.075, m.ceramic);
}

function addTension(root: THREE.Group, m: BioanalyticsMaterials) {
  [-1, 1].forEach((side, index) => { box(root, `BIOANALYTICS__BA13__OPTICAL_TRAP_TOWER_${index + 1}`, [3.4, 7.2, 3.4], index ? m.aluminium : m.ceramic, [side * 6.0, 3.65, 0], true, [0, side * -0.04, 0]); ellipsoid(root, `BIOANALYTICS__BA13__TRAPPED_BEAD_${index + 1}`, [2.2, 2.2, 2.2], m.clearGlass, [side * 6.0, 8.0, 0]); for (let tick = 0; tick < 12; tick += 1) box(root, `BIOANALYTICS__BA13__DISPLACEMENT_SCALE_${index + 1}_${tick + 1}`, [0.7 + (tick % 4) * 0.16, 0.035, 0.08], tick === 6 ? m.coldLight : m.titanium, [side * 6.0, 0.7 + tick * 0.52, 1.74]); });
  ellipsoid(root, 'BIOANALYTICS__BA13__SUSPENDED_LAB_CAPSULE', [7.5, 1.75, 2.0], m.darkGlass, [0, 5.8, 0], true);
  box(root, 'BIOANALYTICS__BA13__MIRRORED_CAPSULE_UNDERSIDE', [10.8, 0.12, 2.6], m.titanium, [0, 4.95, 0]);
  const forceLine = pipe(root, 'BIOANALYTICS__BA13__LUMINOUS_MOLECULAR_FORCE_LINE', new THREE.Vector3(-6.0, 8.0, 0), new THREE.Vector3(6.0, 8.0, 0), 0.075, m.coldLight.clone()); pulse(forceLine, 0.02, 0);
  for (let cable = 0; cable < 8; cable += 1) { const side = cable < 4 ? -1 : 1; const level = cable % 4; pipe(root, `BIOANALYTICS__BA13__CARBON_TENSION_MEMBER_${cable + 1}`, new THREE.Vector3(side * 5.8, 3.5 + level * 1.3, (level - 1.5) * 0.58), new THREE.Vector3(side * 4.5, 5.8, (level - 1.5) * 0.36), 0.045, m.blackConcrete); }
  box(root, 'BIOANALYTICS__BA13__OPEN_PEDESTRIAN_DECK', [13.8, 0.18, 2.1], m.palePaving, [0, 1.15, 0]);
  box(root, 'BIOANALYTICS__BA13__FORCE_EXTENSION_PAVING_LINE', [12.4, 0.03, 0.12], m.darkGlass, [0, 1.26, 0]);
  for (let sphere = 0; sphere < 6; sphere += 1) { const x = -6.3 + sphere * 2.5; ellipsoid(root, `BIOANALYTICS__BA13__CALIBRATION_SPHERE_${sphere + 1}`, [0.55, 0.55, 0.55], sphere % 2 ? m.titanium : m.basalt, [x, 0.58, 4.1]); }
}

function addAutomata(root: THREE.Group, m: BioanalyticsMaterials) {
  box(root, 'BIOANALYTICS__BA14__AUTONOMOUS_CENTRAL_SPINE', [16.0, 4.6, 3.0], m.pearlCeramic, [0, 2.35, 0], true);
  for (let block = 0; block < 12; block += 1) { const side = block % 2 ? -1 : 1; const column = Math.floor(block / 2); const x = -6.2 + column * 2.5; box(root, `BIOANALYTICS__BA14__PLUG_IN_ASSAY_BLOCK_${block + 1}`, [2.0, 2.65, 2.25], m.ceramic, [x, 1.55, side * 2.85], true); cylinder(root, `BIOANALYTICS__BA14__MECHANICAL_CONNECTION_COLLAR_${block + 1}`, 0.92, 0.38, block % 4 === 0 ? m.coldLight.clone() : m.darkGlass, [x, 1.65, side * 1.62], false, 24, [Math.PI / 2, 0, 0]); }
  for (let collar = 0; collar < 4; collar += 1) cylinder(root, `BIOANALYTICS__BA14__EMPTY_EXPANSION_COLLAR_${collar + 1}`, 1.0, 0.28, m.darkGlass, [-7.3 + collar * 4.85, 3.75, -1.65], false, 24, [Math.PI / 2, 0, 0]);
  pipe(root, 'BIOANALYTICS__BA14__ROOF_MAINTENANCE_RAIL', new THREE.Vector3(-8.0, 5.0, 0), new THREE.Vector3(8.0, 5.0, 0), 0.1, m.titanium);
  for (let crane = 0; crane < 3; crane += 1) { const x = -5.5 + crane * 5.5; pipe(root, `BIOANALYTICS__BA14__ROBOTIC_CRANE_MAST_${crane + 1}`, new THREE.Vector3(x, 5.0, 0), new THREE.Vector3(x, 7.1, 0), 0.09, m.aluminium); const arm = pipe(root, `BIOANALYTICS__BA14__ROBOTIC_CRANE_ARM_${crane + 1}`, new THREE.Vector3(x, 6.85, -1.6), new THREE.Vector3(x, 6.85, 1.6), 0.075, m.aluminium); rotate(arm, 0.012 + crane * 0.002); }
  for (let row = 0; row < 5; row += 1) for (let col = 0; col < 24; col += 1) box(root, `BIOANALYTICS__BA14__SAMPLE_CARTRIDGE_DOOR_${row + 1}_${col + 1}`, [0.48, 0.34, 0.06], (row * 7 + col) % 17 === 0 ? m.coldLight.clone() : m.darkGlass, [-7.2 + col * 0.625, 0.7 + row * 0.58, 1.58]);
  box(root, 'BIOANALYTICS__BA14__AUTOMATED_SAMPLE_CANOPY', [15.5, 0.18, 2.2], m.titanium, [0, 4.25, 2.4]);
  for (let shade = 0; shade < 16; shade += 1) { const panel = box(root, `BIOANALYTICS__BA14__ARTICULATED_PV_SHADE_${shade + 1}`, [0.75, 0.08, 2.4], m.darkGlass, [-7.2 + shade * 0.96, 5.3, -0.2], false, [0, 0, -0.22 + (shade % 4) * 0.12]); panel.userData.animate = 'bioanalytics-pv-adjust'; panel.userData.baseRotationZ = panel.rotation.z; panel.userData.phase = shade * 0.33; }
}

function addMetron(root: THREE.Group, m: BioanalyticsMaterials) {
  box(root, 'BIOANALYTICS__BA15__CARTESIAN_GRANITE_PLATFORM', [10.5, 0.4, 8.5], m.basalt, [0, 0.22, 0], true);
  box(root, 'BIOANALYTICS__BA15__SEAMLESS_BLACK_LOWER_MONOLITH', [8.9, 2.1, 6.9], m.blackConcrete, [0, 1.45, 0], true);
  box(root, 'BIOANALYTICS__BA15__WHITE_REFERENCE_MONOLITH', [8.9, 4.2, 6.9], m.ceramic, [0, 4.65, 0], true);
  box(root, 'BIOANALYTICS__BA15__TRANSPARENT_SEPARATION_DATUM', [9.0, 0.18, 7.0], m.clearGlass, [0, 2.62, 0]);
  box(root, 'BIOANALYTICS__BA15__CENTRAL_SHADOW_ENTRANCE', [1.6, 2.3, 0.14], m.darkGlass, [0, 1.3, 3.52]);
  for (let col = 0; col < 10; col += 1) box(root, `BIOANALYTICS__BA15__FACADE_VERTICAL_GRID_${col + 1}`, [0.025, 4.1, 0.035], m.titanium, [-4.0 + col * 0.89, 4.65, 3.48]);
  for (let row = 0; row < 7; row += 1) box(root, `BIOANALYTICS__BA15__FACADE_HORIZONTAL_GRID_${row + 1}`, [8.8, 0.025, 0.035], m.titanium, [0, 2.8 + row * 0.62, 3.48]);
  for (let axis = -5; axis <= 5; axis += 1) { box(root, `BIOANALYTICS__BA15__CARTESIAN_X_${axis + 6}`, [0.025, 0.025, 12.0], axis === 0 ? m.coldLight : m.aluminium, [axis, 0.44, 1.5]); box(root, `BIOANALYTICS__BA15__CARTESIAN_Z_${axis + 6}`, [12.0, 0.025, 0.025], axis === 0 ? m.coldLight : m.aluminium, [0, 0.44, 1.5 + axis]); }
  cylinder(root, 'BIOANALYTICS__BA15__ANALYTICAL_ZERO', 0.75, 0.05, m.coldLight, [0, 0.48, 6.2], false, 32);
  const artefacts: Array<[string, number, number, number]> = [['SPHERE', -4.8, 0.7, -2.7], ['CALIBRATED_BAR', -4.8, 0.65, -0.8], ['STEPPED_BLOCK', -4.8, 0.75, 1.1], ['MATERIAL_PANEL', -4.8, 0.9, 2.8]];
  artefacts.forEach(([name, x, y, z], index) => { box(root, `BIOANALYTICS__BA15__REFERENCE_PLINTH_${index + 1}`, [1.25, 0.35, 1.25], m.basalt, [x, 0.2, z]); if (index === 0) ellipsoid(root, `BIOANALYTICS__BA15__REFERENCE_${name}`, [0.7, 0.7, 0.7], m.titanium, [x, y, z]); else box(root, `BIOANALYTICS__BA15__REFERENCE_${name}`, [0.4 + index * 0.3, 0.45 + index * 0.2, 0.55], m.titanium, [x, y, z]); });
  for (let target = 0; target < 5; target += 1) torus(root, `BIOANALYTICS__BA15__ROOF_CALIBRATION_TARGET_${target + 1}`, 0.45 + target * 0.12, 0.035, target % 2 ? m.darkGlass : m.coldLight, [-2.8 + target * 1.4, 6.8, 0]);
  pipe(root, 'BIOANALYTICS__BA15__CENTRAL_REFERENCE_MAST', new THREE.Vector3(0, 6.75, 0), new THREE.Vector3(0, 10.0, 0), 0.055, m.titanium);
  box(root, 'BIOANALYTICS__BA15__NIGHT_REFERENCE_VERTICAL', [0.12, 6.2, 0.05], m.coldLight.clone(), [0, 3.7, 3.57]);
  box(root, 'BIOANALYTICS__BA15__NIGHT_REFERENCE_HORIZONTAL', [8.8, 0.12, 0.05], m.coldLight.clone(), [0, 2.62, 3.57]);
}

function createBuilding(record: BioanalyticsBuildingProgram, materials: BioanalyticsMaterials) {
  const root = new THREE.Group(); root.name = `BIOANALYTICS__${record.code}__${record.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  root.userData = { selectableId: DISTRICT_ID, individualSelectableId: `${DISTRICT_ID}__${record.code.toLowerCase()}`, districtId: DISTRICT_ID, exteriorProgram: true, bioanalyticsBuilding: true, buildingCode: record.code, displayName: record.name, purpose: record.purpose, placementZone: record.placementZone, exteriorMotif: record.exteriorMotif, footprintMetres: [...record.footprintMetres], heightMetres: record.heightMetres, featureRole: 'building', featureTag: record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') };
  switch (record.form) {
    case 'prisma': addPrisma(root, materials); break; case 'astral': addAstral(root, materials); break; case 'atlas': addAtlas(root, materials); break; case 'nativa': addNativa(root, materials); break; case 'proteoform': addProteoform(root, materials); break; case 'metabolis': addMetabolis(root, materials); break; case 'glycan': addGlycan(root, materials); break; case 'fragmenta': addFragmenta(root, materials); break; case 'vesicula': addVesicula(root, materials); break; case 'rheocell': addRheocell(root, materials); break; case 'chronocellum': addChronocellum(root, materials); break; case 'cryotomos': addCryotomos(root, materials); break; case 'tension': addTension(root, materials); break; case 'automata': addAutomata(root, materials); break; case 'metron': addMetron(root, materials); break;
  }
  root.traverse((object) => { object.userData.selectableId = DISTRICT_ID; object.userData.districtId = DISTRICT_ID; }); return root;
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radialMargin = 7.2; const angularMargin = (sector.endAngle - sector.startAngle) * 0.048;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT); const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
  return new THREE.Vector3(Math.cos(angle) * radius - definition.position[0], y, Math.sin(angle) * radius - definition.position[2]);
}

function districtArc(definition: DistrictDefinition, radialT: number, startAngularT: number, endAngularT: number, segments: number, y = FLOOR_Y) { return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, radialT, THREE.MathUtils.lerp(startAngularT, endAngularT, index / (segments - 1)), y)); }
function districtSpine(definition: DistrictDefinition, angularT: number, startRadialT: number, endRadialT: number, segments: number, y = FLOOR_Y) { return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, THREE.MathUtils.lerp(startRadialT, endRadialT, index / (segments - 1)), angularT, y)); }

function makeRibbonGeometry(points: readonly THREE.Vector3[], width: number) {
  const vertices: number[] = []; const indices: number[] = [];
  points.forEach((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5); vertices.push(point.x + normal.x, point.y, point.z + normal.z, point.x - normal.x, point.y, point.z - normal.z); if (index < points.length - 1) { const base = index * 2; indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); } });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function addRibbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, material: THREE.Material, walkable = true) {
  const ribbon = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), material), name); ribbon.userData.walkable = walkable; ribbon.userData.navObstacle = false; ribbon.userData.bioanalyticsRoute = true; ribbon.receiveShadow = true; parent.add(ribbon); return ribbon;
}

function addDistrictInfrastructure(district: THREE.Group, definition: DistrictDefinition, m: BioanalyticsMaterials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'BIOANALYTICS__DISTRICT_MEASUREMENT_NETWORK';
  const crescentPoints = districtArc(definition, 0.46, 0.035, 0.965, 92); addRibbon(infrastructure, 'BIOANALYTICS__ANALYTICAL_CRESCENT', crescentPoints, 1.7, m.palePaving); const crescentLight = addRibbon(infrastructure, 'BIOANALYTICS__ANALYTICAL_CRESCENT_DIAGNOSTIC_LINE', crescentPoints.map((point) => point.clone().setY(FLOOR_Y + 0.026)), 0.055, m.coldLight.clone(), false); pulse(crescentLight, 0.018, 0);
  const calibrationPoints = districtArc(definition, 0.70, 0.035, 0.965, 92); const calibration = addRibbon(infrastructure, 'BIOANALYTICS__CALIBRATION_SPINE', calibrationPoints, 1.22, m.darkPaving, false); calibration.userData.restrictedServiceRoute = true; const calibrationLight = addRibbon(infrastructure, 'BIOANALYTICS__CALIBRATION_SPINE_STATUS_LINE', calibrationPoints.map((point) => point.clone().setY(FLOOR_Y + 0.026)), 0.045, m.amberLight.clone(), false); pulse(calibrationLight, 0.015, 1.2);
  [0.10, 0.35, 0.60, 0.86].forEach((angularT, index) => { const points = districtSpine(definition, angularT, 0.08, 0.92, 52); addRibbon(infrastructure, `BIOANALYTICS__CONTROLLED_INTERFACE_LINK_${index + 1}`, points, 0.7, index % 2 ? m.palePaving : m.darkPaving); const conduit = addRibbon(infrastructure, `BIOANALYTICS__VISIBLE_VASCULAR_UTILITY_${index + 1}`, points.map((point) => point.clone().setY(FLOOR_Y + 0.035)), 0.038, index % 2 ? m.coldLight.clone() : m.amberLight.clone(), false); pulse(conduit, 0.016 + index * 0.002, index * 0.7); });
  for (let vehicle = 0; vehicle < 8; vehicle += 1) { const marker = ellipsoid(infrastructure, `BIOANALYTICS__AUTONOMOUS_SAMPLE_VEHICLE_${vehicle + 1}`, [0.38, 0.2, 0.58], vehicle % 3 === 0 ? m.coldLight.clone() : m.titanium, calibrationPoints[0].toArray() as [number, number, number]); marker.userData.animate = 'bioanalytics-path-transit'; marker.userData.path = calibrationPoints.map((point) => point.toArray()); marker.userData.speed = 0.006 + vehicle * 0.0007; marker.userData.phase = vehicle / 8; }
  district.add(infrastructure); return infrastructure;
}

function addDistrictLandscape(district: THREE.Group, definition: DistrictDefinition, m: BioanalyticsMaterials) {
  const landscape = new THREE.Group(); landscape.name = 'BIOANALYTICS__CALIBRATED_RESEARCH_LANDSCAPE';
  for (let patch = 0; patch < 30; patch += 1) { const row = patch % 2; const point = pointInDistrict(definition, row ? 0.31 : 0.78, 0.055 + Math.floor(patch / 2) * 0.063, FLOOR_Y); ellipse(landscape, `BIOANALYTICS__MEASUREMENT_GARDEN_${patch + 1}`, [1.45 + (patch % 3) * 0.28, 0.72 + (patch % 4) * 0.14], 0.1, patch % 2 ? m.planting : m.darkPlanting, [point.x, 0.09, point.z]); cylinder(landscape, `BIOANALYTICS__ENVIRONMENTAL_SAMPLING_MAST_${patch + 1}`, 0.12, 0.75 + (patch % 4) * 0.15, m.titanium, [point.x, 0.45, point.z], false, 12); pulse(ellipsoid(landscape, `BIOANALYTICS__SAMPLING_MAST_STATUS_${patch + 1}`, [0.1, 0.1, 0.1], patch % 5 === 0 ? m.amberLight.clone() : m.coldLight.clone(), [point.x, 0.85 + (patch % 4) * 0.15, point.z]), 0.02, patch * 0.33); }
  district.add(landscape); return landscape;
}

export function buildBioanalyticsLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Bioanalytics Labs District requires a masterplan sector');
  const materials = createBioanalyticsMaterials(); const infrastructure = addDistrictInfrastructure(district, definition, materials); const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = BIOANALYTICS_BUILDING_PROGRAM.map((record) => { const building = createBuilding(record, materials); const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02); building.position.copy(position); const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z); building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT }; district.add(building); return building; });
  facilities.forEach((facility, index) => { const record = BIOANALYTICS_BUILDING_PROGRAM[index]; const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, record.footprintMetres[1] / 20 + 0.65); const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position); const routeRadialT = record.radialT < 0.58 ? 0.46 : 0.70; const routePoint = pointInDistrict(definition, routeRadialT, record.angularT, FLOOR_Y + 0.012); const approachPoints = [routePoint, routePoint.clone().lerp(entrance, 0.5), entrance]; addRibbon(infrastructure, `BIOANALYTICS__BUILDING_APPROACH_${record.code}`, approachPoints, 0.72, materials.palePaving); const status = addRibbon(infrastructure, `BIOANALYTICS__BUILDING_APPROACH_STATUS_${record.code}`, approachPoints.map((point) => point.clone().setY(FLOOR_Y + 0.026)), 0.035, index % 4 === 0 ? materials.amberLight.clone() : materials.coldLight.clone(), false); pulse(status, 0.017, index * 0.41); });
  district.userData.bioanalyticsLabsDistrict = {
    identity: 'Bioanalytics Labs District', architecturalLanguage: 'instrument-scale prisms, flow cells, detector arrays, columns, microscope objectives, microfluidic channels, and force diagrams over vibration-isolated basalt', buildingCount: facilities.length,
    buildings: BIOANALYTICS_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, purpose: record.purpose, placementZone: record.placementZone, heightMetres: record.heightMetres, exteriorMotif: record.exteriorMotif })),
    interfaces: { westernBiology: ['Atlas In Situ', 'Nativa Helix Observatory', 'Chronocellum', 'Prisma Cytometrica'], southernChemistry: ['Astral Forge', 'Metabolis Aerarium', 'Glycan Arbor'], easternEvidence: ['Fragmenta Beacon', 'Vesicula Halo Array', 'Metron Bio'], northernSecurity: ['Automata Assay Foundry', 'CryoTomos Vault'], centralCrossing: 'Molecular Tension Bridge' },
    landmarks: { publicGateway: 'Prisma Cytometrica', mechanicalAnchor: 'Astral Forge', easternBeacon: 'Fragmenta Beacon' },
    circulation: { primaryWalk: 'BIOANALYTICS__ANALYTICAL_CRESCENT', restrictedServiceRoute: 'BIOANALYTICS__CALIBRATION_SPINE', controlledInterfaceLinks: 4, exactBuildingApproaches: 15, autonomousSampleVehicles: 8, visibleUtilityGalleries: true },
    responsiveSystems: { diagnosticPulseLighting: true, opticalBaffles: true, autonomousSampleTransit: true, kineticCalibrationElements: true, advertisingDisplays: false }, exteriorOnly: true,
  };
  district.userData.population = { plannedFacilities: BIOANALYTICS_BUILDING_PROGRAM.map((record) => record.name), plannedObjects: ['Analytical Crescent', 'Calibration Spine', 'Visible Vascular Utility Galleries', 'Autonomous Sample Vehicles', 'Calibrated Research Landscape'], realizedFeatureTags: BIOANALYTICS_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')), realizedFacilityCount: facilities.length, realizedObjectCount: infrastructure.children.length + landscape.children.length, distinct: true, asymmetricCampus: true, localRoadCount: 21, radialCoverage: 0.95, angularCoverage: 0.92, exteriorOnly: true, measurementEngineeringDistrict: true };
}
