import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type GenomicsBuildingForm = 'pangenome' | 'helix' | 'tessera' | 'fabrica' | 'variant';

export interface GenomicsBuildingProgram {
  code: string;
  name: string;
  subtitle: string;
  purpose: string;
  form: GenomicsBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
}

export const GENOMICS_BUILDING_PROGRAM: readonly GenomicsBuildingProgram[] = [
  { code: 'G1', name: 'The Pangenome Confluence', subtitle: 'Atrium Variorum', purpose: 'Population pangenomes, graph references, and complete genome assembly', form: 'pangenome', footprintMetres: [148, 94], heightMetres: 67, radialT: 0.15, angularT: 0.50, placementZone: 'Northern civic threshold facing the Corporate Core', exteriorMotif: 'three branching research ribbons diverging, crossing, and reconnecting above a common basalt substrate' },
  { code: 'G2', name: 'Helix Meridian', subtitle: 'Single-Molecule Sequencing Spire', purpose: 'Long-read sequencing, phased assembly, and complete chromosome reconstruction', form: 'helix', footprintMetres: [86, 60], heightMetres: 112, radialT: 0.43, angularT: 0.15, placementZone: 'Western sequencing interface toward Proteomics', exteriorMotif: 'three offset read-length shafts wrapped by two irregular alignment bands above an isolated podium' },
  { code: 'G3', name: 'Tessera Vitae', subtitle: 'Institute for Spatial and Single-Cell Genomics', purpose: 'Single-cell profiling, spatial multiomics, and in-situ sequencing', form: 'tessera', footprintMetres: [172, 128], heightMetres: 48, radialT: 0.43, angularT: 0.85, placementZone: 'Eastern spatial interface toward Biochemistry and Molecular Biology', exteriorMotif: 'thirty heterogeneous polygonal cells, nuclei skylights, section walls, and vascular bridges' },
  { code: 'G4', name: 'Fabrica Genomica', subtitle: 'Synthetic Chromosome and Genome-Writing Foundry', purpose: 'Synthetic chromosomes, genome-scale rewriting, and programmable rearrangement', form: 'fabrica', footprintMetres: [132, 108], heightMetres: 74, radialT: 0.82, angularT: 0.62, placementZone: 'Controlled southern industrial edge', exteriorMotif: 'six exchangeable chromosome modules beneath an elliptical titanium gantry ring' },
  { code: 'G5', name: 'The Variant Constellation', subtitle: 'AI and Functional Genomics Observatory', purpose: 'Regulatory-variant prediction, perturbation screens, and functional genomics', form: 'variant', footprintMetres: [126, 126], heightMetres: 81, radialT: 0.78, angularT: 0.33, placementZone: 'Computational interface facing the Corporate Core', exteriorMotif: 'a faceted dark observatory within an interrupted translucent research ring and statistical colonnade' },
] as const;

const DISTRICT_ID = 'genomics-labs';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 20, 14);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_X = new THREE.Vector3(1, 0, 0);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

type GenomicsMaterials = ReturnType<typeof createGenomicsMaterials>;

function districtMaterial(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ name, color, roughness: 0.58, metalness: 0.14, ...options });
}

function createGenomicsMaterials() {
  const basalt = districtMaterial('Genomics dark volcanic-stone foundation', '#080c10', { roughness: 0.94, metalness: 0.02 });
  const charcoal = districtMaterial('Genomics charcoal precision ceramic', '#171d22', { roughness: 0.78, metalness: 0.12 });
  const pearlCeramic = districtMaterial('Genomics pearl-white genomic ceramic', '#ebece7', { roughness: 0.44, metalness: 0.04 });
  const paleCeramic = districtMaterial('Genomics pale mineral ceramic', '#cdd3d1', { roughness: 0.5, metalness: 0.06 });
  const titanium = districtMaterial('Genomics brushed titanium', '#a7b1b4', { roughness: 0.3, metalness: 0.9 });
  const darkTitanium = districtMaterial('Genomics dark mirrored titanium', '#293238', { roughness: 0.22, metalness: 0.9 });
  const darkGlass = districtMaterial('Genomics dark electrochromic laboratory glass', '#10242d', { emissive: '#12333d', emissiveIntensity: 0.22, roughness: 0.07, metalness: 0.16, transparent: true, opacity: 0.72, side: THREE.DoubleSide });
  const clearGlass = districtMaterial('Genomics translucent laboratory glass', '#8ebfc6', { emissive: '#396f78', emissiveIntensity: 0.2, roughness: 0.06, metalness: 0.05, transparent: true, opacity: 0.46, side: THREE.DoubleSide });
  const opalGlass = districtMaterial('Genomics milky genomic glass', '#c8dfe0', { emissive: '#6ea6aa', emissiveIntensity: 0.32, roughness: 0.18, metalness: 0.03, transparent: true, opacity: 0.62, side: THREE.DoubleSide });
  const mesh = districtMaterial('Genomics microscopic-gradient metal mesh', '#66767a', { roughness: 0.42, metalness: 0.78, transparent: true, opacity: 0.54, side: THREE.DoubleSide });
  const spectralWhite = districtMaterial('Genomics spectral white sequence light', '#eaffff', { emissive: '#a9f5ff', emissiveIntensity: 2.4, roughness: 0.1, metalness: 0.08 });
  const baseA = districtMaterial('Genomics adenine cyan wayfinding light', '#70e8ee', { emissive: '#2fb8c0', emissiveIntensity: 2.2, roughness: 0.1, metalness: 0.1 });
  const baseC = districtMaterial('Genomics cytosine violet wayfinding light', '#a88dff', { emissive: '#7357d5', emissiveIntensity: 2.15, roughness: 0.1, metalness: 0.1 });
  const baseG = districtMaterial('Genomics guanine green wayfinding light', '#87edb4', { emissive: '#3fbf7d', emissiveIntensity: 2.1, roughness: 0.1, metalness: 0.1 });
  const baseT = districtMaterial('Genomics thymine amber wayfinding light', '#ffd183', { emissive: '#df8b2d', emissiveIntensity: 2.2, roughness: 0.1, metalness: 0.1 });
  const palePaving = districtMaterial('Base-Pair Promenade pale sequence paving', '#b9c1bf', { roughness: 0.94, metalness: 0.02 });
  const darkPaving = districtMaterial('Base-Pair Promenade dark sequence paving', '#2b3336', { roughness: 0.92, metalness: 0.05 });
  const water = districtMaterial('Genomics shallow black reflecting water', '#07181d', { emissive: '#0a2830', emissiveIntensity: 0.13, roughness: 0.04, metalness: 0.16, transparent: true, opacity: 0.84 });
  const silverGrass = districtMaterial('Genomics controlled silver grass', '#74877e', { roughness: 0.97, metalness: 0 });
  const moss = districtMaterial('Genomics coordinate-garden moss', '#284238', { roughness: 0.98, metalness: 0 });
  [spectralWhite, baseA, baseC, baseG, baseT].forEach((entry) => { entry.userData.isDistrictAccent = true; });
  return { basalt, charcoal, pearlCeramic, paleCeramic, titanium, darkTitanium, darkGlass, clearGlass, opalGlass, mesh, spectralWhite, baseA, baseC, baseG, baseT, palePaving, darkPaving, water, silverGrass, moss };
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

function taperedCylinder(parent: THREE.Object3D, name: string, bottomDiameter: number, topDiameter: number, height: number, segments: number, material: THREE.Material, position: readonly [number, number, number], obstacle = false) {
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

function pulse(object: THREE.Object3D, speed: number, phase = 0, minIntensity = 0.24, maxIntensity = 3.9) {
  object.userData.animate = 'genomics-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate(object: THREE.Object3D, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'genomics-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function pathVolume(parent: THREE.Object3D, prefix: string, points: readonly THREE.Vector3[], width: number, height: number, material: THREE.Material, glass: THREE.Material) {
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]; const end = points[index + 1]; const direction = end.clone().sub(start); const horizontal = direction.clone().setY(0); const normal = new THREE.Vector3(-horizontal.z, 0, horizontal.x).normalize();
    const bodyStart = start.clone().setY(height * 0.5 + 0.42); const bodyEnd = end.clone().setY(height * 0.5 + 0.42);
    slabBetween(parent, `${prefix}_BODY_${index + 1}`, bodyStart, bodyEnd, width, height, material, true);
    for (const side of [-1, 1]) {
      const offset = normal.clone().multiplyScalar(side * (width * 0.5 + 0.035));
      slabBetween(parent, `${prefix}_GENOMIC_GLASS_${index + 1}_${side > 0 ? 'A' : 'B'}`, start.clone().add(offset).setY(2.55), end.clone().add(offset).setY(2.55), 0.07, 1.15, glass);
    }
    const roofStart = start.clone().setY(height + 0.46); const roofEnd = end.clone().setY(height + 0.46);
    pulse(slabBetween(parent, `${prefix}_ROOF_SEQUENCE_LIGHT_${index + 1}`, roofStart, roofEnd, 0.055, 0.055, index % 2 ? material : glass), 0.016 + index * 0.002, index * 0.55);
  }
}

function createPangenomeConfluence(record: GenomicsBuildingProgram, m: GenomicsMaterials) {
  const root = new THREE.Group(); root.name = 'GENOMICS__G1__PANGENOME_CONFLUENCE';
  box(root, 'GENOMICS__G1__COMMON_BASALT_SUBSTRATE', [14.8, 0.42, 9.4], m.basalt, [0, 0.21, 0], true);
  const branches = [
    [new THREE.Vector3(-6.8, 0, 0.2), new THREE.Vector3(-3.8, 0, -1.7), new THREE.Vector3(-0.8, 0, -2.2), new THREE.Vector3(2.4, 0, -1.45), new THREE.Vector3(6.8, 0, -0.15)],
    [new THREE.Vector3(-6.8, 0, 0.2), new THREE.Vector3(-3.5, 0, -0.05), new THREE.Vector3(-0.2, 0, 0.7), new THREE.Vector3(3.0, 0, 0.55), new THREE.Vector3(6.8, 0, -0.15)],
    [new THREE.Vector3(-6.8, 0, 0.2), new THREE.Vector3(-3.6, 0, 1.8), new THREE.Vector3(-0.3, 0, 2.45), new THREE.Vector3(3.2, 0, 1.75), new THREE.Vector3(6.8, 0, -0.15)],
  ];
  branches.forEach((points, index) => pathVolume(root, `GENOMICS__G1__GRAPH_RIBBON_${index + 1}`, points, 1.55, 4.75, index === 1 ? m.paleCeramic : m.pearlCeramic, m.darkGlass));
  ellipse(root, 'GENOMICS__G1__HAPLOTYPE_COURT_BLACK_WATER', [3.4, 1.5], 0.07, m.water, [0.4, 0.48, 1.55]);
  for (let island = 0; island < 5; island += 1) cylinder(root, `GENOMICS__G1__HAPLOTYPE_COURT_PLATFORM_${island + 1}`, 0.55 + (island % 2) * 0.16, 0.09, m.palePaving, [-1.0 + island * 0.62, 0.54, 1.55 + Math.sin(island * 1.7) * 0.38]);
  [[-1.8, 0.2, -0.7], [1.3, 0.8, 1.35], [3.8, -0.3, 0.7]].forEach(([x, z, scale], index) => {
    const bubble = ellipsoid(root, `GENOMICS__G1__VARIANT_BUBBLE_${index + 1}`, [1.05 + scale * 0.12, 0.8, 0.72], m.clearGlass, [x, 3.0 + index * 0.38, z]);
    torus(root, `GENOMICS__G1__VARIANT_BUBBLE_FRAME_${index + 1}`, 0.75, 0.055, m.titanium, bubble.position.toArray() as [number, number, number], [Math.PI / 2, 0, Math.PI / 2]);
  });
  slabBetween(root, 'GENOMICS__G1__TRANSPARENT_CROSSING_BRIDGE', new THREE.Vector3(-1.6, 5.35, -2.0), new THREE.Vector3(1.4, 5.35, 2.2), 0.68, 0.72, m.clearGlass);
  slabBetween(root, 'GENOMICS__G1__OPAQUE_CROSSING_BRIDGE', new THREE.Vector3(0.9, 5.85, -1.9), new THREE.Vector3(3.6, 5.85, 1.6), 0.74, 0.8, m.pearlCeramic);
  box(root, 'GENOMICS__G1__MONUMENTAL_ENTRY_CANTILEVER', [5.0, 0.34, 2.1], m.darkTitanium, [0, 5.15, 4.15]);
  box(root, 'GENOMICS__G1__ENTRY_COORDINATE_WALL_WEST', [0.36, 4.1, 2.15], m.pearlCeramic, [-2.4, 2.5, 3.75], true);
  box(root, 'GENOMICS__G1__ENTRY_COORDINATE_WALL_EAST', [0.36, 4.1, 2.15], m.pearlCeramic, [2.4, 2.5, 3.75], true);
  for (let line = 0; line < 18; line += 1) {
    const x = -2.1 + line * 0.245; const endX = x + Math.sin(line * 1.8) * 0.42;
    pulse(pipe(root, `GENOMICS__G1__CANOPY_BRANCH_LIGHT_${line + 1}`, new THREE.Vector3(x, 4.94, 5.0), new THREE.Vector3(endX, 4.94, 3.25), 0.018, (line % 4 === 0 ? m.baseA : m.spectralWhite).clone()), 0.012 + (line % 4) * 0.002, line * 0.37);
  }
  for (let housing = 0; housing < 8; housing += 1) box(root, `GENOMICS__G1__VARIABLE_SEQUENCE_ROOF_HOUSING_${housing + 1}`, [0.85 + (housing % 4) * 0.42, 0.42, 0.65], housing % 2 ? m.darkGlass : m.titanium, [-5.2 + housing * 1.5, 5.28 + (housing % 3) * 0.08, -0.4 + (housing % 2) * 1.2]);
  const graphNodes = [new THREE.Vector3(3.5, 5.5, -1.6), new THREE.Vector3(4.5, 6.35, -0.8), new THREE.Vector3(5.3, 5.85, 0.2), new THREE.Vector3(4.3, 6.6, 1.2), new THREE.Vector3(5.8, 6.4, 1.6)];
  graphNodes.forEach((node, index) => { ellipsoid(root, `GENOMICS__G1__ELEVATED_GRAPH_NODE_${index + 1}`, [0.12, 0.12, 0.12], m.spectralWhite.clone(), node.toArray() as [number, number, number]); if (index) pipe(root, `GENOMICS__G1__ELEVATED_GRAPH_EDGE_${index}`, graphNodes[index - 1], node, 0.035, m.titanium); if (index > 1) pipe(root, `GENOMICS__G1__ELEVATED_GRAPH_BRANCH_${index - 1}`, graphNodes[index - 2], node, 0.024, m.baseC.clone()); });
  return root;
}

function addAlignmentBand(root: THREE.Object3D, prefix: string, radius: number, yStart: number, yEnd: number, turns: number, phase: number, m: GenomicsMaterials) {
  const points = Array.from({ length: 42 }, (_, index) => {
    const t = index / 41; const angle = phase + t * turns * Math.PI * 2 + Math.sin(t * Math.PI * 3) * 0.18;
    return new THREE.Vector3(Math.cos(angle) * radius, THREE.MathUtils.lerp(yStart, yEnd, t) + Math.sin(t * Math.PI * 2) * 0.18, Math.sin(angle) * radius * 0.72);
  });
  for (let index = 0; index < points.length - 1; index += 1) pipe(root, `${prefix}_${index + 1}`, points[index], points[index + 1], 0.095, m.titanium);
  return points;
}

function createHelixMeridian(record: GenomicsBuildingProgram, m: GenomicsMaterials) {
  const root = new THREE.Group(); root.name = 'GENOMICS__G2__HELIX_MERIDIAN';
  box(root, 'GENOMICS__G2__SEQUENCING_PODIUM', [8.6, 2.35, 5.2], m.charcoal, [0, 1.18, -0.2], true);
  for (let bay = 0; bay < 14; bay += 1) box(root, `GENOMICS__G2__PODIUM_VERTICAL_BAY_${bay + 1}`, [0.38, 1.65, 0.08], bay % 7 === 6 ? m.darkGlass : m.darkTitanium, [-3.75 + bay * 0.58, 1.25, 2.43]);
  for (let utility = 0; utility < 9; utility += 1) cylinder(root, `GENOMICS__G2__SOUTHERN_COOLING_MANIFOLD_${utility + 1}`, 0.38 + (utility % 2) * 0.1, 1.35 + (utility % 3) * 0.25, utility % 2 ? m.titanium : m.charcoal, [-3.5 + utility * 0.87, 2.65, -2.45], false, 12);
  box(root, 'GENOMICS__G2__TOWER_SHADOW_GAP', [4.1, 0.34, 2.5], m.basalt, [0, 2.5, -0.15]);
  pulse(box(root, 'GENOMICS__G2__ISOLATION_GAP_LIGHT', [4.0, 0.055, 2.42], m.spectralWhite.clone(), [0, 2.69, -0.15]), 0.012, 0.4);
  const shafts = [
    { x: -1.15, z: -0.05, width: 1.35, depth: 1.55, height: 8.15, mat: m.titanium, name: 'TITANIUM_READ_SHAFT' },
    { x: 0.2, z: -0.35, width: 1.45, depth: 1.65, height: 7.55, mat: m.darkGlass, name: 'ELECTROCHROMIC_READ_SHAFT' },
    { x: 1.3, z: 0.15, width: 1.18, depth: 1.48, height: 8.55, mat: m.paleCeramic, name: 'CERAMIC_FIN_READ_SHAFT' },
  ];
  shafts.forEach((shaft, shaftIndex) => {
    box(root, `GENOMICS__G2__${shaft.name}`, [shaft.width, shaft.height, shaft.depth], shaft.mat, [shaft.x, 2.75 + shaft.height * 0.5, shaft.z], true);
    for (let blade = 0; blade < 16; blade += 1) {
      const x = shaft.x - shaft.width * 0.44 + (blade / 15) * shaft.width * 0.88;
      box(root, `GENOMICS__G2__VERTICAL_MOIRE_BLADE_${shaftIndex + 1}_${blade + 1}`, [0.026 + (blade % 4) * 0.009, shaft.height * (0.84 + (blade % 3) * 0.05), 0.11 + (blade % 5) * 0.025], m.titanium, [x, 2.8 + shaft.height * 0.5, shaft.z + shaft.depth * 0.52]);
    }
    for (let pore = 0; pore < 4; pore += 1) ellipsoid(root, `GENOMICS__G2__PORE_WINDOW_${shaftIndex + 1}_${pore + 1}`, [0.24, 0.62 + (pore % 2) * 0.18, 0.08], m.opalGlass, [shaft.x + (pore % 2 ? 0.22 : -0.18), 6.1 + pore * 1.2 + shaftIndex * 0.18, shaft.z + shaft.depth * 0.55]);
  });
  const bandA = addAlignmentBand(root, 'GENOMICS__G2__LONG_READ_ALIGNMENT_BAND', 2.05, 3.15, 11.35, 1.18, 0.2, m);
  addAlignmentBand(root, 'GENOMICS__G2__PHASED_ALIGNMENT_BAND', 2.26, 4.2, 8.6, 0.48, 2.4, m);
  pulse(ellipsoid(root, 'GENOMICS__G2__COMPLETE_READ_TERMINUS', [0.27, 0.27, 0.27], m.spectralWhite.clone(), bandA[bandA.length - 1].toArray() as [number, number, number]), 0.01, 0);
  torus(root, 'GENOMICS__G2__SCIENTIFIC_CROWN_FRAME', 1.85, 0.065, m.titanium, [0.1, 11.45, -0.1]);
  for (let mast = 0; mast < 9; mast += 1) pipe(root, `GENOMICS__G2__CROWN_SENSOR_MAST_${mast + 1}`, new THREE.Vector3(-1.45 + mast * 0.36, 11.35, -0.1 + Math.sin(mast) * 0.3), new THREE.Vector3(-1.45 + mast * 0.36, 12.0 + (mast % 4) * 0.27, -0.1 + Math.sin(mast) * 0.3), 0.035, mast % 3 === 0 ? m.spectralWhite.clone() : m.titanium);
  box(root, 'GENOMICS__G2__ENTRY_BLACK_WATER_TRENCH', [3.8, 0.07, 1.05], m.water, [0, 0.09, 3.25]);
  box(root, 'GENOMICS__G2__ENTRY_READ_BRIDGE', [1.25, 0.1, 2.25], m.clearGlass, [0, 0.18, 3.3]);
  for (let signal = 0; signal < 16; signal += 1) pulse(box(root, `GENOMICS__G2__FRAGMENTED_ENTRY_SIGNAL_${signal + 1}`, [0.055, 0.025, signal % 5 === 0 ? 0.28 : 0.1], signal % 4 === 0 ? m.baseT.clone() : m.spectralWhite.clone(), [0, 0.26, 2.35 + signal * 0.12]), 0.018, signal * 0.31);
  for (let signal = 0; signal < 11; signal += 1) {
    const marker = pulse(ellipsoid(root, `GENOMICS__G2__ASCENDING_READ_SIGNAL_${signal + 1}`, [0.06, 0.12, 0.06], (signal % 4 === 0 ? m.baseA : m.spectralWhite).clone(), [-1.65 + (signal % 3) * 1.65, 3.0 + (signal % 5) * 1.3, 0.95]), 0.025, signal * 0.23);
    marker.userData.animate = 'genomics-vertical-read'; marker.userData.baseY = 3.0 + (signal % 5) * 0.35; marker.userData.travel = 7.6; marker.userData.speed = 0.022 + signal * 0.001; marker.userData.phase = signal / 11;
  }
  return root;
}

function createTesseraVitae(record: GenomicsBuildingProgram, m: GenomicsMaterials) {
  const root = new THREE.Group(); root.name = 'GENOMICS__G3__TESSERA_VITAE';
  box(root, 'GENOMICS__G3__CELLULAR_MOSAIC_FOUNDATION', [17.2, 0.26, 12.8], m.basalt, [0, 0.13, 0], true);
  const cellMaterials = [m.pearlCeramic, m.clearGlass, m.paleCeramic, m.mesh, m.darkGlass];
  const roofMaterials = [m.darkGlass, m.paleCeramic, m.water, m.moss, m.opalGlass, m.pearlCeramic];
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 6; column += 1) {
      const index = row * 6 + column;
      const x = -6.6 + column * 2.62 + (row % 2) * 0.52 + Math.sin(index * 1.7) * 0.12;
      const z = -4.5 + row * 2.18 + Math.cos(index * 1.3) * 0.1;
      const diameter = 2.1 + (index % 4) * 0.16;
      const height = 2.15 + (index % 5) * 0.43;
      taperedCylinder(root, `GENOMICS__G3__CELL_MODULE_${String(index + 1).padStart(2, '0')}`, diameter, diameter * (0.9 + (index % 3) * 0.04), height, index % 3 === 0 ? 5 : 6, cellMaterials[index % cellMaterials.length], [x, 0.28 + height * 0.5, z], true);
      pulse(torus(root, `GENOMICS__G3__LUMINOUS_CELL_SEAM_${String(index + 1).padStart(2, '0')}`, diameter * 0.43, 0.027, (index % 4 === 0 ? m.baseA : m.spectralWhite).clone(), [x, 0.3 + height, z]), 0.012 + (index % 5) * 0.0015, index * 0.27);
      cylinder(root, `GENOMICS__G3__ROOF_STATE_${String(index + 1).padStart(2, '0')}`, diameter * 0.64, 0.08, roofMaterials[index % roofMaterials.length], [x, 0.34 + height, z], false, index % 3 === 0 ? 12 : 24);
      if (index % 2 === 0) cylinder(root, `GENOMICS__G3__NUCLEUS_SKYLIGHT_${String(index + 1).padStart(2, '0')}`, 0.38 + (index % 5) * 0.11, 0.13, index % 4 === 0 ? m.opalGlass : m.clearGlass, [x + Math.sin(index) * 0.25, 0.44 + height, z + Math.cos(index) * 0.22]);
      const facadeCount = 3 + (index % 4);
      for (let panel = 0; panel < facadeCount; panel += 1) {
        const angle = (panel / facadeCount) * Math.PI * 2 + index * 0.17;
        box(root, `GENOMICS__G3__HETEROGENEOUS_FACADE_PANEL_${index + 1}_${panel + 1}`, [0.22 + (panel % 3) * 0.12, 0.38 + (panel % 2) * 0.22, 0.05], panel % 3 === 0 ? m.darkGlass : m.titanium, [x + Math.sin(angle) * diameter * 0.49, 0.75 + panel * 0.36, z + Math.cos(angle) * diameter * 0.49], false, [0, angle, 0]);
      }
    }
  }
  const sectionWalls = [
    { x: -3.7, z: 5.1, rotation: 0, width: 7.2 },
    { x: 7.3, z: -0.3, rotation: Math.PI / 2, width: 7.0 },
    { x: 2.3, z: -5.35, rotation: 0, width: 5.8 },
  ];
  const sectionMaterials = [m.clearGlass, m.baseA, m.opalGlass, m.baseC, m.darkGlass, m.baseT];
  sectionWalls.forEach((wall, wallIndex) => {
    for (let band = 0; band < 6; band += 1) box(root, `GENOMICS__G3__SECTION_FACE_${wallIndex + 1}_LAYER_${band + 1}`, [wall.width, 0.34 + (band % 2) * 0.14, 0.11], sectionMaterials[band].clone(), [wall.x, 0.6 + band * 0.55, wall.z], false, [0, wall.rotation, 0]);
  });
  const bridgePairs: readonly [THREE.Vector3, THREE.Vector3][] = [
    [new THREE.Vector3(-5.7, 3.75, -2.2), new THREE.Vector3(-2.6, 3.75, -0.25)],
    [new THREE.Vector3(-0.8, 4.1, 0.0), new THREE.Vector3(2.5, 4.1, 2.15)],
    [new THREE.Vector3(3.9, 3.7, -2.4), new THREE.Vector3(6.7, 3.7, -0.2)],
    [new THREE.Vector3(-3.6, 3.45, 3.1), new THREE.Vector3(-0.7, 3.45, 4.55)],
    [new THREE.Vector3(1.4, 3.85, -4.4), new THREE.Vector3(4.5, 3.85, -2.4)],
  ];
  bridgePairs.forEach(([start, end], index) => {
    slabBetween(root, `GENOMICS__G3__VASCULAR_BRIDGE_${index + 1}`, start, end, 0.48 + (index % 2) * 0.22, 0.52, index % 2 ? m.opalGlass : m.clearGlass);
    const branch = start.clone().lerp(end, 0.18).setY(0.32); pipe(root, `GENOMICS__G3__CAPILLARY_SUPPORT_A_${index + 1}`, branch, start.clone().lerp(end, 0.35), 0.055, m.pearlCeramic, true);
    pipe(root, `GENOMICS__G3__CAPILLARY_SUPPORT_B_${index + 1}`, branch, start.clone().lerp(end, 0.56), 0.055, m.pearlCeramic, true);
  });
  box(root, 'GENOMICS__G3__COORDINATE_COURT', [8.4, 0.08, 2.6], m.palePaving, [0, 0.08, 7.05]);
  for (let grid = 0; grid < 17; grid += 1) {
    box(root, `GENOMICS__G3__COORDINATE_GRID_LONGITUDE_${grid + 1}`, [0.026, 0.025, 2.5], grid % 5 === 0 ? m.baseA.clone() : m.titanium, [-4.0 + grid * 0.5, 0.135, 7.05]);
    if (grid < 7) box(root, `GENOMICS__G3__COORDINATE_GRID_LATITUDE_${grid + 1}`, [8.0, 0.025, 0.026], grid % 3 === 0 ? m.baseC.clone() : m.titanium, [0, 0.135, 5.85 + grid * 0.4]);
  }
  box(root, 'GENOMICS__G3__SPATIAL_LENS_CANTILEVER', [5.2, 0.35, 1.8], m.pearlCeramic, [0, 3.65, 5.65]);
  for (let lens = 0; lens < 28; lens += 1) cylinder(root, `GENOMICS__G3__CANTILEVER_SPATIAL_LENS_${lens + 1}`, 0.12 + (lens % 3) * 0.025, 0.06, lens % 6 === 0 ? m.spectralWhite.clone() : m.darkGlass, [-2.2 + (lens % 8) * 0.62, 3.43, 5.5 + Math.floor(lens / 8) * 0.35], false, 12, [Math.PI / 2, 0, 0]);
  for (let channel = 0; channel < 4; channel += 1) {
    const start = new THREE.Vector3(-4.0 + channel * 2.3, 0.13, 7.45); const joint = new THREE.Vector3(-2.5 + channel * 1.7, 0.13, 6.55); const end = new THREE.Vector3(-3.2 + channel * 2.2, 0.13, 5.7);
    slabBetween(root, `GENOMICS__G3__BRANCHING_WATER_CHANNEL_${channel + 1}_A`, start, joint, 0.14, 0.04, m.water); slabBetween(root, `GENOMICS__G3__BRANCHING_WATER_CHANNEL_${channel + 1}_B`, joint, end, 0.14, 0.04, m.water);
  }
  pipe(root, 'GENOMICS__G3__CALIBRATION_MAST', new THREE.Vector3(0.4, 3.7, 0.3), new THREE.Vector3(0.4, 6.4, 0.3), 0.07, m.pearlCeramic);
  const calibration = new THREE.Group(); calibration.name = 'GENOMICS__G3__ROTATING_CALIBRATION_PLATES'; calibration.position.set(0.4, 5.45, 0.3); root.add(calibration);
  for (let plate = 0; plate < 7; plate += 1) box(calibration, `GENOMICS__G3__CALIBRATION_PLATE_${plate + 1}`, [0.8 - plate * 0.06, 0.08, 0.26], plate % 2 ? m.pearlCeramic : m.basalt, [0, -0.75 + plate * 0.25, 0], false, [0, plate * 0.38, 0]);
  rotate(calibration, 0.035);
  return root;
}

function createChromosomeModule(root: THREE.Object3D, index: number, length: number, y: number, z: number, rotationY: number, m: GenomicsMaterials) {
  const module = new THREE.Group(); module.name = `GENOMICS__G4__CHROMOSOME_MODULE_${index + 1}`; module.position.set(0, y, z); module.rotation.y = rotationY; root.add(module);
  box(module, `GENOMICS__G4__MODULE_BODY_${index + 1}`, [length - 1.25, 1.35, 1.55], m.pearlCeramic, [0, 0, 0], true);
  ellipsoid(module, `GENOMICS__G4__MODULE_TELOMERE_CAP_WEST_${index + 1}`, [0.72, 0.72, 0.82], m.opalGlass, [-(length - 1.25) * 0.5, 0, 0]);
  ellipsoid(module, `GENOMICS__G4__MODULE_TELOMERE_CAP_EAST_${index + 1}`, [0.72, 0.72, 0.82], m.opalGlass, [(length - 1.25) * 0.5, 0, 0]);
  box(module, `GENOMICS__G4__DISPLACED_CENTROMERE_BAND_${index + 1}`, [0.38, 1.43, 1.62], index % 2 ? m.darkGlass : m.darkTitanium, [(-0.8 + (index % 3) * 0.7), 0, 0]);
  for (let panel = 0; panel < 9; panel += 1) box(module, `GENOMICS__G4__REPLACEABLE_MODULE_PANEL_${index + 1}_${panel + 1}`, [0.025, 1.16, 1.35], panel % 4 === 0 ? m.titanium : m.paleCeramic, [-length * 0.36 + panel * length * 0.09, 0, 0]);
}

function createFabricaGenomica(record: GenomicsBuildingProgram, m: GenomicsMaterials) {
  const root = new THREE.Group(); root.name = 'GENOMICS__G4__FABRICA_GENOMICA';
  box(root, 'GENOMICS__G4__BASALT_PLINTH_WEST', [5.75, 3.05, 10.8], m.basalt, [-3.72, 1.53, 0], true);
  box(root, 'GENOMICS__G4__BASALT_PLINTH_EAST', [5.75, 3.05, 10.8], m.basalt, [3.72, 1.53, 0], true);
  box(root, 'GENOMICS__G4__BASALT_PLINTH_REAR', [1.8, 3.05, 3.0], m.basalt, [0, 1.53, -3.9], true);
  for (let incision = 0; incision < 12; incision += 1) box(root, `GENOMICS__G4__DEEP_VERTICAL_WINDOW_CUT_${incision + 1}`, [0.12, 1.55, 0.08], m.darkGlass, [-5.55 + incision * 1.02, 1.55, 5.43]);
  box(root, 'GENOMICS__G4__FORTY_METRE_ENTRY_CLEFT', [1.8, 3.1, 2.35], m.darkGlass, [0, 1.55, 4.35]);
  for (let ceiling = 0; ceiling < 8; ceiling += 1) pulse(box(root, `GENOMICS__G4__FORCED_PERSPECTIVE_ENTRY_LIGHT_${ceiling + 1}`, [0.38 + ceiling * 0.12, 0.045, 0.16], m.spectralWhite.clone(), [0, 2.95, 5.35 - ceiling * 0.27]), 0.014, ceiling * 0.32);
  createChromosomeModule(root, 0, 9.8, 4.1, -2.75, 0, m);
  createChromosomeModule(root, 1, 8.7, 5.35, 0, 0, m);
  createChromosomeModule(root, 2, 10.6, 6.65, 2.75, 0, m);
  createChromosomeModule(root, 3, 8.3, 4.72, -1.35, Math.PI / 2, m);
  createChromosomeModule(root, 4, 9.4, 5.95, 1.25, Math.PI / 2, m);
  createChromosomeModule(root, 5, 7.8, 7.18, 0.1, Math.PI / 2, m);
  const gantry = torus(root, 'GENOMICS__G4__ELLIPTICAL_GANTRY_RING', 4.55, 0.32, m.titanium, [0, 9.15, 0]); gantry.scale.x = 1.35;
  for (const [index, coordinates] of [[0, [-5.4, 0.1, -3.2]], [1, [5.4, 0.1, -3.2]], [2, [-5.4, 0.1, 3.2]], [3, [5.4, 0.1, 3.2]]] as const) pipe(root, `GENOMICS__G4__ANGLED_GANTRY_PYLON_${index + 1}`, new THREE.Vector3(...coordinates), new THREE.Vector3(coordinates[0] * 0.82, 8.95, coordinates[2] * 0.82), 0.16, m.titanium, true);
  for (let carriage = 0; carriage < 4; carriage += 1) {
    const marker = box(root, `GENOMICS__G4__ROBOTIC_GANTRY_CARRIAGE_${carriage + 1}`, [0.75, 0.42, 0.46], carriage === 0 ? m.baseT.clone() : m.darkTitanium, [6.1, 9.25, 0]);
    marker.userData.animate = 'genomics-gantry-carriage'; marker.userData.centerX = 0; marker.userData.centerZ = 0; marker.userData.radiusX = 6.14; marker.userData.radiusZ = 4.55; marker.userData.speed = 0.018 + carriage * 0.002; marker.userData.phase = carriage * Math.PI * 0.5; marker.userData.baseY = 9.25;
  }
  box(root, 'GENOMICS__G4__FREESTANDING_SERVICE_TOWER', [1.05, 8.1, 1.35], m.charcoal, [6.15, 4.05, 0], true);
  for (let lift = 0; lift < 10; lift += 1) box(root, `GENOMICS__G4__SERVICE_TOWER_PLATFORM_${lift + 1}`, [1.35, 0.08, 1.62], lift % 2 ? m.darkTitanium : m.titanium, [6.15, 0.65 + lift * 0.72, 0]);
  for (const side of [-1, 1]) {
    cylinder(root, `GENOMICS__G4__SOUTHERN_UTILITY_TOWER_${side > 0 ? 'EAST' : 'WEST'}`, 1.45, 3.55, m.mesh, [side * 3.3, 1.78, -6.0], true, 24);
    torus(root, `GENOMICS__G4__RADIAL_VENTILATION_CAP_${side > 0 ? 'EAST' : 'WEST'}`, 0.78, 0.14, m.titanium, [side * 3.3, 3.62, -6.0]);
    slabBetween(root, `GENOMICS__G4__RAISED_UTILITY_BRIDGE_${side > 0 ? 'EAST' : 'WEST'}`, new THREE.Vector3(side * 3.3, 3.2, -5.4), new THREE.Vector3(side * 3.3, 3.2, -3.3), 0.6, 0.55, m.charcoal);
  }
  const moat = torus(root, 'GENOMICS__G4__CONTROLLED_REFLECTING_WATERCOURSE', 6.4, 0.38, m.water, [0, 0.08, 0], [Math.PI / 2, 0, -0.25], Math.PI * 1.72); moat.scale.z = 0.86;
  box(root, 'GENOMICS__G4__CONTROLLED_ENTRY_BRIDGE', [1.7, 0.16, 3.2], m.darkPaving, [0, 0.2, 6.0]);
  box(root, 'GENOMICS__G4__TRANSPARENT_VISITOR_PAVILION', [2.4, 1.45, 1.65], m.clearGlass, [-3.2, 0.76, 6.15]);
  return root;
}

function addArcWall(parent: THREE.Object3D, prefix: string, radius: number, start: number, end: number, segments: number, y: number, height: number, material: THREE.Material) {
  for (let index = 0; index < segments; index += 1) {
    const angle = THREE.MathUtils.lerp(start, end, (index + 0.5) / segments); const length = radius * (end - start) / segments * 1.05;
    box(parent, `${prefix}_${index + 1}`, [length, height, 0.42], material, [Math.cos(angle) * radius, y, Math.sin(angle) * radius], true, [0, -angle - Math.PI / 2, 0]);
  }
}

function createVariantConstellation(record: GenomicsBuildingProgram, m: GenomicsMaterials) {
  const root = new THREE.Group(); root.name = 'GENOMICS__G5__VARIANT_CONSTELLATION';
  cylinder(root, 'GENOMICS__G5__FACETED_CORE_FOUNDATION', 6.4, 0.45, m.basalt, [0, 0.23, 0], true, 12);
  taperedCylinder(root, 'GENOMICS__G5__LOWER_FACETED_PRISM', 6.1, 4.9, 3.5, 12, m.darkGlass, [0, 2.0, 0], true);
  taperedCylinder(root, 'GENOMICS__G5__CONSTRICTED_COMPUTE_WAIST', 4.9, 4.8, 1.05, 12, m.darkTitanium, [0, 4.28, 0], true);
  taperedCylinder(root, 'GENOMICS__G5__UPPER_FACETED_PRISM', 4.8, 6.05, 3.55, 12, m.darkGlass, [0, 6.58, 0], true);
  const variants: THREE.Vector3[] = [];
  for (let panel = 0; panel < 52; panel += 1) {
    const band = panel % 8; const angle = panel * 2.399; const radius = 2.65 + Math.sin(panel * 1.37) * 0.22; const y = 0.9 + band * 0.92;
    const position = new THREE.Vector3(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
    const triangle = prepare(new THREE.Mesh(new THREE.CircleGeometry(0.14 + (panel % 4) * 0.035, 3), panel % 11 === 0 ? m.baseC.clone() : panel % 7 === 0 ? m.titanium : m.darkGlass), `GENOMICS__G5__PROJECTING_VARIANT_PANEL_${panel + 1}`);
    triangle.position.copy(position); triangle.lookAt(new THREE.Vector3(0, y, 0)); root.add(triangle);
    if (panel % 7 === 0) { variants.push(position); pulse(triangle, 0.012 + (panel % 5) * 0.002, panel * 0.31); }
  }
  variants.forEach((variant, index) => { if (index) pipe(root, `GENOMICS__G5__REGULATORY_NETWORK_EDGE_${index}`, variants[index - 1], variant, 0.026, index % 3 ? m.baseA.clone() : m.baseC.clone()); });
  addArcWall(root, 'GENOMICS__G5__TRANSLUCENT_RESEARCH_RING_NORTH', 5.15, 0.18, 1.72, 14, 1.65, 3.1, m.opalGlass);
  addArcWall(root, 'GENOMICS__G5__TRANSLUCENT_RESEARCH_RING_SOUTHWEST', 5.15, 2.25, 3.75, 14, 1.65, 3.1, m.opalGlass);
  addArcWall(root, 'GENOMICS__G5__TRANSLUCENT_RESEARCH_RING_SOUTHEAST', 5.15, 4.25, 5.78, 14, 1.65, 3.1, m.opalGlass);
  for (let strip = 0; strip < 48; strip += 1) {
    const angle = strip / 48 * Math.PI * 2; if ([0, 1, 2].some((gap) => Math.abs(Math.atan2(Math.sin(angle - (gap * 2.05 + 0.05)), Math.cos(angle - (gap * 2.05 + 0.05)))) < 0.22)) continue;
    box(root, `GENOMICS__G5__UNEQUAL_BARCODE_STRIP_${strip + 1}`, [0.05 + (strip % 4) * 0.018, 2.5, 0.08], strip % 5 === 0 ? m.clearGlass : m.titanium, [Math.sin(angle) * 5.38, 1.65, Math.cos(angle) * 5.38], false, [0, angle, 0]);
  }
  for (let pylon = 0; pylon < 12; pylon += 1) {
    const angle = pylon / 12 * Math.PI * 2; const start = new THREE.Vector3(Math.sin(angle) * 5.45, 0.2, Math.cos(angle) * 5.45); const endRadius = pylon % 3 === 0 ? 3.45 : 3.85;
    pipe(root, `GENOMICS__G5__LEANING_RESEARCH_PYLON_${pylon + 1}`, start, new THREE.Vector3(Math.sin(angle) * endRadius, 5.1 + (pylon % 4) * 0.22, Math.cos(angle) * endRadius), 0.085, pylon % 4 === 0 ? m.spectralWhite.clone() : m.titanium, true);
  }
  [0.05, 2.1, 4.18].forEach((angle, index) => {
    const start = new THREE.Vector3(Math.sin(angle) * 3.1, 3.0, Math.cos(angle) * 3.1); const end = new THREE.Vector3(Math.sin(angle) * 5.9, 3.0, Math.cos(angle) * 5.9);
    slabBetween(root, `GENOMICS__G5__STRUCTURAL_VARIANT_BRIDGE_${index + 1}`, start, end, 0.82, 0.52, index === 0 ? m.darkGlass : m.clearGlass);
  });
  box(root, 'GENOMICS__G5__MANHATTAN_COLONNADE_PLAZA', [8.8, 0.08, 3.0], m.palePaving, [0, 0.08, 6.65]);
  for (let row = 0; row < 4; row += 1) for (let column = 0; column < 9; column += 1) {
    const index = row * 9 + column; const height = 0.3 + ((index * 7 + column * 3) % 16) * 0.11; const material = index % 13 === 0 ? m.clearGlass : index % 9 === 0 ? m.titanium : m.paleCeramic;
    box(root, `GENOMICS__G5__MANHATTAN_PEAK_${index + 1}`, [0.13, height, 0.13], material, [-3.65 + column * 0.9, 0.14 + height * 0.5, 5.75 + row * 0.62]);
  }
  box(root, 'GENOMICS__G5__BLACK_GLASS_ENTRY_CANOPY', [4.5, 0.28, 1.5], m.darkGlass, [0.7, 3.35, 5.2]);
  for (let star = 0; star < 36; star += 1) pulse(ellipsoid(root, `GENOMICS__G5__CANOPY_POINT_LIGHT_${star + 1}`, [0.035, 0.035, 0.035], (star % 7 === 0 ? m.baseT : m.spectralWhite).clone(), [-1.25 + (star % 9) * 0.48, 3.18, 4.7 + Math.floor(star / 9) * 0.32]), 0.01 + (star % 4) * 0.002, star * 0.22);
  torus(root, 'GENOMICS__G5__CONCAVE_COMPUTE_ROOF_LENS', 2.35, 0.18, m.darkTitanium, [0, 8.42, 0]);
  for (let fin = 0; fin < 12; fin += 1) {
    const angle = fin / 12 * Math.PI * 2; pipe(root, `GENOMICS__G5__OUTWARD_COOLING_FIN_${fin + 1}`, new THREE.Vector3(Math.sin(angle) * 2.15, 8.35, Math.cos(angle) * 2.15), new THREE.Vector3(Math.sin(angle) * 2.85, 9.05 + (fin % 4) * 0.22, Math.cos(angle) * 2.85), 0.055, m.titanium);
  }
  for (let conduit = 0; conduit < 3; conduit += 1) slabBetween(root, `GENOMICS__G5__VISIBLE_DATA_CONDUIT_${conduit + 1}`, new THREE.Vector3(-5.1, 0.42 + conduit * 0.32, -2.2 + conduit * 0.55), new THREE.Vector3(-7.1, 0.42 + conduit * 0.32, -2.8 + conduit * 0.55), 0.34, 0.24, conduit === 1 ? m.baseA.clone() : m.clearGlass);
  return root;
}

function assignBuildingMetadata(root: THREE.Group, record: GenomicsBuildingProgram) {
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

function createBuilding(record: GenomicsBuildingProgram, m: GenomicsMaterials) {
  let root: THREE.Group;
  if (record.form === 'pangenome') root = createPangenomeConfluence(record, m);
  else if (record.form === 'helix') root = createHelixMeridian(record, m);
  else if (record.form === 'tessera') root = createTesseraVitae(record, m);
  else if (record.form === 'fabrica') root = createFabricaGenomica(record, m);
  else root = createVariantConstellation(record, m);
  return assignBuildingMetadata(root, record);
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radialMargin = 7.4; const angularMargin = (sector.endAngle - sector.startAngle) * 0.05;
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
  const ribbon = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), material), name); ribbon.userData.walkable = walkable; ribbon.userData.navObstacle = false; ribbon.userData.genomicsRoute = true; ribbon.receiveShadow = true; parent.add(ribbon); return ribbon;
}

function offsetPath(points: readonly THREE.Vector3[], offset: number, modulation: number, frequency: number) {
  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    const t = index / Math.max(1, points.length - 1); return point.clone().addScaledVector(normal, offset + Math.sin(t * Math.PI * frequency) * modulation).setY(FLOOR_Y + 0.027);
  });
}

function addDistrictInfrastructure(district: THREE.Group, definition: DistrictDefinition, m: GenomicsMaterials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'GENOMICS__DISTRICT_CODE_INFRASTRUCTURE';
  const promenade = districtArc(definition, 0.56, 0.025, 0.975, 108); addRibbon(infrastructure, 'GENOMICS__BASE_PAIR_PROMENADE', promenade, 1.75, m.darkPaving);
  const traceMaterials = [m.baseA, m.baseC, m.baseG, m.baseT];
  [-0.36, -0.12, 0.12, 0.36].forEach((offset, index) => pulse(addRibbon(infrastructure, `GENOMICS__BASE_PAIR_TRACE_${index + 1}`, offsetPath(promenade, offset, 0.13 + index * 0.018, 6 + index), 0.042, traceMaterials[index].clone(), false), 0.012 + index * 0.0015, index * 0.8));
  [0.13, 0.38, 0.64, 0.87].forEach((angularT, index) => {
    const spine = districtSpine(definition, angularT, 0.05, 0.95, 56); addRibbon(infrastructure, `GENOMICS__DISTRICT_INTERFACE_LINK_${index + 1}`, spine, 0.72, index % 2 ? m.palePaving : m.darkPaving);
    pulse(addRibbon(infrastructure, `GENOMICS__INTERFACE_SEQUENCE_LINE_${index + 1}`, offsetPath(spine, 0, 0.09, 4 + index), 0.038, traceMaterials[index].clone(), false), 0.014, index * 0.61);
  });
  district.add(infrastructure); return { infrastructure, promenade };
}

function addDistrictLandscape(district: THREE.Group, definition: DistrictDefinition, m: GenomicsMaterials) {
  const landscape = new THREE.Group(); landscape.name = 'GENOMICS__COORDINATE_RESEARCH_LANDSCAPE';
  for (let patch = 0; patch < 26; patch += 1) {
    const point = pointInDistrict(definition, patch % 2 ? 0.29 : 0.9, 0.055 + Math.floor(patch / 2) * 0.073, FLOOR_Y);
    const diameter = 1.15 + (patch % 4) * 0.22; ellipse(landscape, `GENOMICS__ASYMMETRIC_SEQUENCE_GARDEN_${patch + 1}`, [diameter, 0.62 + (patch % 3) * 0.2], 0.09, patch % 3 === 0 ? m.moss : m.silverGrass, [point.x, 0.08, point.z]);
    if (patch % 2 === 0) { cylinder(landscape, `GENOMICS__ENVIRONMENTAL_COORDINATE_MAST_${patch + 1}`, 0.11, 0.85 + (patch % 4) * 0.2, m.titanium, [point.x, 0.45, point.z], false, 12); pulse(ellipsoid(landscape, `GENOMICS__COORDINATE_MAST_STATUS_${patch + 1}`, [0.08, 0.08, 0.08], (patch % 4 === 0 ? m.baseT : m.spectralWhite).clone(), [point.x, 0.96 + (patch % 4) * 0.2, point.z]), 0.018, patch * 0.29); }
  }
  for (let channel = 0; channel < 5; channel += 1) {
    const points = districtSpine(definition, 0.08 + channel * 0.205, 0.25, 0.42, 18); addRibbon(landscape, `GENOMICS__SHIFTING_WATER_CHANNEL_${channel + 1}`, offsetPath(points, 0, 0.25, 2 + channel), 0.18, m.water, false);
  }
  district.add(landscape); return landscape;
}

export function buildGenomicsLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Genomics Labs District requires a masterplan sector');
  const materials = createGenomicsMaterials(); const { infrastructure, promenade } = addDistrictInfrastructure(district, definition, materials); const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = GENOMICS_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials); const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02); building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT }; district.add(building); return building;
  });
  facilities.forEach((facility, index) => {
    const record = GENOMICS_BUILDING_PROGRAM[index]; const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, record.footprintMetres[1] / 20 + 0.8); const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const routePoint = promenade.reduce((closest, point) => point.distanceToSquared(entrance) < closest.distanceToSquared(entrance) ? point : closest, promenade[0]); const approachPoints = [routePoint.clone(), routePoint.clone().lerp(entrance, 0.52), entrance];
    addRibbon(infrastructure, `GENOMICS__BUILDING_APPROACH_${record.code}`, approachPoints, 0.78, materials.palePaving); pulse(addRibbon(infrastructure, `GENOMICS__BUILDING_APPROACH_SEQUENCE_${record.code}`, approachPoints.map((point) => point.clone().setY(FLOOR_Y + 0.027)), 0.04, [materials.baseA, materials.baseC, materials.baseG, materials.baseT, materials.spectralWhite][index].clone(), false), 0.014, index * 0.52);
  });
  district.userData.genomicsLabsDistrict = {
    identity: 'Genomics Labs District', architecturalLanguage: 'pangenome graphs, parallel alignments, chromatin territories, cellular mosaics, and structural rearrangements expressed through dark basalt, pearl genomic ceramic, brushed titanium, electrochromic glass, and spectral illumination', buildingCount: facilities.length,
    buildings: GENOMICS_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, subtitle: record.subtitle, purpose: record.purpose, placementZone: record.placementZone, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorMotif: record.exteriorMotif })),
    landmarks: { civicCenter: 'The Pangenome Confluence', verticalMarker: 'Helix Meridian', spatialLandscape: 'Tessera Vitae', industrialEdge: 'Fabrica Genomica', computationalInterface: 'The Variant Constellation' },
    circulation: { primaryWalk: 'GENOMICS__BASE_PAIR_PROMENADE', spectralSequenceTraces: 4, controlledInterfaceLinks: 4, exactBuildingApproaches: 5 },
    signatureSystems: { graphRibbonBranches: 3, helixReadShafts: 3, tesseraCellModules: 30, chromosomeModules: 6, variantCoreFacets: 12, advertisingDisplays: false },
    materials: ['dark volcanic stone', 'pearl-white genomic ceramic', 'brushed titanium', 'electrochromic laboratory glass', 'spectral sequence illumination'], landscape: { asymmetricCoordinateGardens: 26, environmentalMasts: 13, shiftingWaterChannels: 5 }, exteriorOnly: true,
  };
  district.userData.population = { plannedFacilities: GENOMICS_BUILDING_PROGRAM.map((record) => record.name), plannedObjects: ['Base-Pair Promenade', 'Spectral Sequence Traces', 'Coordinate Research Landscape', 'Genomic Water Channels', 'Environmental Sampling Masts'], realizedFeatureTags: GENOMICS_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')), realizedFacilityCount: facilities.length, realizedObjectCount: infrastructure.children.length + landscape.children.length, distinct: true, asymmetricCampus: true, localRoadCount: 10, radialCoverage: 0.92, angularCoverage: 0.94, exteriorOnly: true, genomicCodeLandscape: true };
}
