import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type ProteomicsBuildingForm = 'monocell' | 'cartography' | 'basilica' | 'interactome' | 'veil';

export interface ProteomicsBuildingProgram {
  code: string;
  name: string;
  subtitle: string;
  purpose: string;
  form: ProteomicsBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
}

export const PROTEOMICS_BUILDING_PROGRAM: readonly ProteomicsBuildingProgram[] = [
  { code: 'P1', name: 'The Monocell Proteome Array', subtitle: 'Single-Cell and Ultra-Low-Input Proteomics', purpose: 'Ultra-sensitive single-cell preparation, mass analysis, and data-independent acquisition', form: 'monocell', footprintMetres: [92, 68], heightMetres: 58, radialT: 0.18, angularT: 0.50, placementZone: 'Inner research threshold toward the Dark Center', exteriorMotif: 'seven independently illuminated tapered laboratory blades rising from a microplate podium' },
  { code: 'P2', name: 'The Tissue Cartography Hall', subtitle: 'Spatial and Deep Visual Proteomics', purpose: 'Imaging, AI cellular classification, laser microdissection, and spatial protein mapping', form: 'cartography', footprintMetres: [145, 76], heightMetres: 30, radialT: 0.45, angularT: 0.16, placementZone: 'Spatial interface toward Genomics', exteriorMotif: 'a folded tissue section with cellular mosaic facades, false-colour roof terraces, and a segmentation canyon' },
  { code: 'P3', name: 'The Proteoform Resonance Basilica', subtitle: 'Native and Top-Down Proteomics', purpose: 'Intact proteoforms, native complexes, modifications, and higher-order molecular structure', form: 'basilica', footprintMetres: [84, 84], heightMetres: 74, radialT: 0.48, angularT: 0.84, placementZone: 'Monumental centre on the Dark Center radial sightline', exteriorMotif: 'two continuous folded black shells restrained by a tilted analytical ring and coloured modifications' },
  { code: 'P4', name: 'The Interactome Constellation', subtitle: 'Interaction and Structural Proteomics', purpose: 'Protein interactions, transient complexes, cross-linking, and structural interpretation', form: 'interactome', footprintMetres: [126, 108], heightMetres: 40, radialT: 0.82, angularT: 0.68, placementZone: 'Computational Biology interface', exteriorMotif: 'nine heterogeneous faceted nodes joined by bridges, cross-links, and a suspended interaction cloud' },
  { code: 'P5', name: 'The Amino-Pore Sequencing Veil', subtitle: 'Single-Molecule Protein Reading', purpose: 'Experimental nanopore protein reading and AI interpretation of heterogeneous molecular signals', form: 'veil', footprintMetres: [168, 70], heightMetres: 49, radialT: 0.80, angularT: 0.30, placementZone: 'Experimental eastern gate toward Genomics', exteriorMotif: 'paired iridescent porous membrane walls framing a crystalline data prism and monumental primary pore' },
] as const;

const DISTRICT_ID = 'proteomics-labs';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 8, 4);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_X = new THREE.Vector3(1, 0, 0);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

type ProteomicsMaterials = ReturnType<typeof createProteomicsMaterials>;

function districtMaterial(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ name, color, roughness: 0.56, metalness: 0.14, ...options });
}

function createProteomicsMaterials() {
  const graphite = districtMaterial('Proteomics graphite-black structural metal', '#080b10', { roughness: 0.7, metalness: 0.68 });
  const darkTitanium = districtMaterial('Proteomics dark brushed titanium', '#202a34', { roughness: 0.27, metalness: 0.9 });
  const titanium = districtMaterial('Proteomics mirror-polished titanium', '#a8b4bb', { roughness: 0.2, metalness: 0.96 });
  const pearlCeramic = districtMaterial('Proteomics pearl-white technical ceramic', '#eeeae4', { roughness: 0.4, metalness: 0.03 });
  const paleCeramic = districtMaterial('Proteomics satin pale ceramic', '#cbd2d0', { roughness: 0.48, metalness: 0.05 });
  const smokedGlass = districtMaterial('Proteomics smoked laboratory glass', '#102331', { emissive: '#123247', emissiveIntensity: 0.18, roughness: 0.07, metalness: 0.18, transparent: true, opacity: 0.68, side: THREE.DoubleSide });
  const dichroic = districtMaterial('Proteomics cyan-violet dichroic glazing', '#6885b8', { emissive: '#383272', emissiveIntensity: 0.42, roughness: 0.09, metalness: 0.28, transparent: true, opacity: 0.64, side: THREE.DoubleSide });
  const translucent = districtMaterial('Proteomics translucent fibre resin', '#b8d5d3', { emissive: '#477e83', emissiveIntensity: 0.24, roughness: 0.2, transparent: true, opacity: 0.58, side: THREE.DoubleSide });
  const cyan = districtMaterial('Proteomics electric-blue modification light', '#6de7ff', { emissive: '#24bddd', emissiveIntensity: 2.5, roughness: 0.1, metalness: 0.16 });
  const violet = districtMaterial('Proteomics magenta-violet modification light', '#d07cff', { emissive: '#8a35d4', emissiveIntensity: 2.45, roughness: 0.1, metalness: 0.16 });
  const amber = districtMaterial('Proteomics amber modification light', '#ffc25e', { emissive: '#d77a18', emissiveIntensity: 2.4, roughness: 0.12, metalness: 0.14 });
  const signal = districtMaterial('Proteomics analytical signal light', '#eaffff', { emissive: '#b9ffff', emissiveIntensity: 2.8, roughness: 0.08 });
  const palePaving = districtMaterial('Polypeptide Walk elongated pale stone', '#aeb6b4', { roughness: 0.96, metalness: 0.01 });
  const darkPaving = districtMaterial('Proteomics dark mineral court paving', '#252d32', { roughness: 0.95, metalness: 0.04 });
  const water = districtMaterial('Proteomics black reflecting water', '#071923', { emissive: '#0b2936', emissiveIntensity: 0.14, roughness: 0.04, metalness: 0.18, transparent: true, opacity: 0.83 });
  const moss = districtMaterial('Proteomics heterogeneous moss garden', '#2d493b', { roughness: 0.98, metalness: 0 });
  const grass = districtMaterial('Proteomics silver research grass', '#71837b', { roughness: 0.98, metalness: 0 });
  [cyan, violet, amber, signal].forEach((entry) => { entry.userData.isDistrictAccent = true; });
  return { graphite, darkTitanium, titanium, pearlCeramic, paleCeramic, smokedGlass, dichroic, translucent, cyan, violet, amber, signal, palePaving, darkPaving, water, moss, grass };
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
  const radialSegments = radius >= 1 ? 32 : radius >= 0.4 ? 12 : 8;
  const tubularSegments = radius >= 1 ? 6 : radius >= 0.4 ? 4 : 3;
  const key = `${radius.toFixed(3)}|${tube.toFixed(3)}|${arc.toFixed(3)}|${tubularSegments}|${radialSegments}`;
  let geometry = TORUS_CACHE.get(key);
  if (!geometry) { geometry = new THREE.TorusGeometry(radius, tube, tubularSegments, radialSegments, arc); TORUS_CACHE.set(key, geometry); }
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

function pulse(object: THREE.Object3D, speed: number, phase = 0, minIntensity = 0.2, maxIntensity = 4.2) {
  object.userData.animate = 'proteomics-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate(object: THREE.Object3D, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'proteomics-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function signalTravel(object: THREE.Object3D, axis: 'x' | 'y' | 'z', travel: number, speed: number, phase: number) {
  object.userData.animate = 'proteomics-signal-travel'; object.userData.axis = axis; object.userData.travel = travel; object.userData.speed = speed; object.userData.phase = phase;
  object.userData.baseX = object.position.x; object.userData.baseY = object.position.y; object.userData.baseZ = object.position.z; return object;
}

function createMonocellArray(_record: ProteomicsBuildingProgram, m: ProteomicsMaterials) {
  const root = new THREE.Group(); root.name = 'PROTEOMICS__P1__MONOCELL_PROTEOME_ARRAY';
  ellipse(root, 'PROTEOMICS__P1__OVAL_MICROPLATE_PODIUM', [9.2, 6.8], 0.92, m.pearlCeramic, [0, 0.46, 0], true, 24);
  ellipse(root, 'PROTEOMICS__P1__SCULPTED_PODIUM_ROOF', [8.6, 6.2], 0.18, m.paleCeramic, [0, 0.98, 0], false, 24);
  for (let well = 0; well < 96; well += 1) {
    const angle = well / 96 * Math.PI * 2; const ring = well % 3; const rx = 3.7 - ring * 0.26; const rz = 2.72 - ring * 0.2;
    const material = well % 13 === 0 ? m.water : well % 7 === 0 ? m.moss : well % 5 === 0 ? m.smokedGlass : m.darkTitanium;
    ellipsoid(root, `PROTEOMICS__P1__MICROPLATE_WELL_${well + 1}`, [0.08 + (well % 4) * 0.025, 0.045, 0.08 + (well % 3) * 0.022], material, [Math.cos(angle) * rx, 0.57 + ring * 0.16, Math.sin(angle) * rz]);
  }
  const blades = [
    [-2.35, -0.6, 3.1, -0.03], [-1.45, 0.72, 4.15, 0.02], [-0.7, -0.8, 4.85, -0.035], [0.05, 0.35, 5.8, 0], [0.9, -0.55, 5.2, 0.025], [1.65, 0.88, 3.85, -0.02], [2.45, -0.05, 4.5, 0.03],
  ] as const;
  blades.forEach(([x, z, height, lean], blade) => {
    const shell = taperedCylinder(root, `PROTEOMICS__P1__TAPERED_LAB_BLADE_${blade + 1}`, 1.02, 0.72, height, 8, blade % 3 === 0 ? m.pearlCeramic : blade % 3 === 1 ? m.smokedGlass : m.translucent, [x, 1.02 + height * 0.5, z], true);
    shell.rotation.z = lean;
    for (let fin = 0; fin < 12; fin += 1) {
      const a = fin / 12 * Math.PI * 2;
      box(root, `PROTEOMICS__P1__BLADE_VERTICAL_FIN_${blade + 1}_${fin + 1}`, [0.035, height * 0.9, 0.08], fin % 5 === 0 ? m.darkTitanium : m.titanium, [x + Math.cos(a) * 0.48, 1.05 + height * 0.5, z + Math.sin(a) * 0.48], false, [0, -a, lean]);
    }
    for (let channel = 0; channel < 8; channel += 1) {
      const light = pulse(ellipsoid(root, `PROTEOMICS__P1__RISING_CAPILLARY_SIGNAL_${blade + 1}_${channel + 1}`, [0.045, 0.065, 0.045], (blade + channel) % 3 === 0 ? m.cyan.clone() : m.signal.clone(), [x + 0.5, 1.25 + channel * height / 9, z]), 0.012 + blade * 0.0012, channel * 0.51 + blade);
      signalTravel(light, 'y', height * 0.55, 0.015 + blade * 0.001, channel / 8);
    }
    for (let rod = 0; rod < 5; rod += 1) pipe(root, `PROTEOMICS__P1__ELECTROSPRAY_CROWN_${blade + 1}_${rod + 1}`, new THREE.Vector3(x + (rod - 2) * 0.1, 1.1 + height, z), new THREE.Vector3(x + (rod - 2) * 0.14, 1.65 + height + (rod % 2) * 0.16, z), 0.018, m.titanium);
    if (blade % 2 === 0) box(root, `PROTEOMICS__P1__MODIFICATION_CAPSULE_${blade + 1}`, [0.52, 0.36, 0.5], blade % 4 === 0 ? m.amber : m.violet, [x + 0.5, 2.3 + blade * 0.48, z + 0.15]);
  });
  slabBetween(root, 'PROTEOMICS__P1__RECESSED_BRIDGE_HIGH', new THREE.Vector3(-1.45, 4.55, 0.72), new THREE.Vector3(0.9, 4.55, -0.55), 0.46, 0.42, m.smokedGlass);
  slabBetween(root, 'PROTEOMICS__P1__RECESSED_BRIDGE_LOW', new THREE.Vector3(-2.35, 3.15, -0.6), new THREE.Vector3(0.05, 3.15, 0.35), 0.42, 0.38, m.smokedGlass);
  box(root, 'PROTEOMICS__P1__INVERTED_PIPETTE_CANTILEVER', [4.2, 0.3, 2.0], m.graphite, [0, 2.65, 3.4]);
  box(root, 'PROTEOMICS__P1__COMPRESSED_ENTRY_GLASS_WEST', [0.16, 2.3, 1.25], m.smokedGlass, [-1.05, 1.25, 2.7], true, [0, -0.18, 0]);
  box(root, 'PROTEOMICS__P1__COMPRESSED_ENTRY_GLASS_EAST', [0.16, 2.3, 1.25], m.smokedGlass, [1.05, 1.25, 2.7], true, [0, 0.18, 0]);
  const ring = torus(root, 'PROTEOMICS__P1__FLOATING_OVAL_ROOF_RING', 1.2, 0.09, m.titanium, [0.05, 7.2, 0.35], [Math.PI / 2, 0.35, 0.28]); ring.scale.x = 1.45;
  return root;
}

function createTissueCartography(_record: ProteomicsBuildingProgram, m: ProteomicsMaterials) {
  const root = new THREE.Group(); root.name = 'PROTEOMICS__P2__TISSUE_CARTOGRAPHY_HALL';
  box(root, 'PROTEOMICS__P2__NORTH_FOLDED_TISSUE_PLATE', [6.55, 2.05, 6.7], m.paleCeramic, [-4.0, 1.04, 0], true, [0, 0, -0.035]);
  box(root, 'PROTEOMICS__P2__SOUTH_FOLDED_TISSUE_PLATE', [6.55, 2.85, 6.7], m.pearlCeramic, [4.0, 1.44, 0], true, [0, 0, 0.045]);
  box(root, 'PROTEOMICS__P2__SEGMENTATION_PASSAGE_WEST_WALL', [0.16, 2.7, 6.15], m.graphite, [-0.62, 1.35, 0], true);
  box(root, 'PROTEOMICS__P2__SEGMENTATION_PASSAGE_EAST_WALL', [0.16, 2.7, 6.15], m.graphite, [0.62, 1.35, 0], true);
  for (let bridge = 0; bridge < 4; bridge += 1) slabBetween(root, `PROTEOMICS__P2__SEGMENTATION_BRIDGE_${bridge + 1}`, new THREE.Vector3(-0.58, 1.45 + bridge * 0.46, -2.5 + bridge * 1.55), new THREE.Vector3(0.58, 1.45 + bridge * 0.46, -2.35 + bridge * 1.55), 0.42, 0.25, bridge % 2 ? m.smokedGlass : m.titanium);
  const treatments = [m.pearlCeramic, m.translucent, m.smokedGlass, m.titanium, m.paleCeramic, m.dichroic];
  for (let cell = 0; cell < 144; cell += 1) {
    const side = cell % 2 === 0 ? -1 : 1; const local = Math.floor(cell / 2); const col = local % 12; const row = Math.floor(local / 12);
    const x = side < 0 ? -6.95 + col * 0.53 : 0.95 + col * 0.53; const y = 0.38 + row * 0.42 + (col % 3) * 0.035; const z = side < 0 ? 3.42 : 3.42;
    const scale = 0.18 + ((cell * 7) % 5) * 0.025;
    const panel = cylinder(root, `PROTEOMICS__P2__CELLULAR_FACADE_PANEL_${cell + 1}`, scale * 2, 0.12 + (cell % 7) * 0.025, treatments[cell % treatments.length], [x, y, z + (cell % 5) * 0.025], false, cell % 4 === 0 ? 12 : 24, [Math.PI / 2, 0, 0]);
    panel.scale.x *= 1.22;
    pulse(torus(root, `PROTEOMICS__P2__CELL_BOUNDARY_LIGHT_${cell + 1}`, scale, 0.012, (cell % 11 === 0 ? m.violet : m.signal).clone(), [x, y, z + 0.1], [0, 0, 0]), 0.008 + (cell % 5) * 0.001, cell * 0.12);
  }
  for (let tile = 0; tile < 60; tile += 1) {
    const x = -6.7 + (tile % 15) * 0.92; const z = -2.5 + Math.floor(tile / 15) * 1.55; const height = x < 0 ? 2.17 : 2.98;
    box(root, `PROTEOMICS__P2__FALSE_COLOUR_ROOF_TILE_${tile + 1}`, [0.75, 0.07, 1.2], [m.paleCeramic, m.cyan, m.amber, m.violet, m.dichroic][(tile * 3) % 5], [x, height + Math.sin(tile * 1.3) * 0.06, z], false, [0, (tile % 3 - 1) * 0.04, 0]);
  }
  for (let aperture = 0; aperture < 5; aperture += 1) ellipse(root, `PROTEOMICS__P2__MICROSCOPE_APERTURE_${aperture + 1}`, [0.65 + aperture * 0.12, 1.05 + aperture * 0.1], 0.44, m.graphite, [-4.9 + aperture * 2.45, 2.55 + aperture * 0.12, -1.25 + (aperture % 2) * 2.4], false, 24);
  box(root, 'PROTEOMICS__P2__FACETED_CELL_ENTRANCE', [3.0, 2.1, 1.55], m.dichroic, [4.25, 1.22, 3.55]);
  for (let frame = 0; frame < 3; frame += 1) box(root, `PROTEOMICS__P2__MAGNIFICATION_FRAME_${frame + 1}`, [3.45 + frame * 0.45, 0.12, 1.8 + frame * 0.24], [m.graphite, m.titanium, m.pearlCeramic][frame], [4.25, 2.42 + frame * 0.11, 3.45]);
  return root;
}

function createProteoformBasilica(_record: ProteomicsBuildingProgram, m: ProteomicsMaterials) {
  const root = new THREE.Group(); root.name = 'PROTEOMICS__P3__PROTEOFORM_RESONANCE_BASILICA';
  cylinder(root, 'PROTEOMICS__P3__OCTAGONAL_MINERAL_PLINTH', 8.4, 0.42, m.graphite, [0, 0.21, 0], true, 12);
  for (const side of [-1, 1]) {
    for (let layer = 0; layer < 10; layer += 1) {
      const y = 0.7 + layer * 0.55; const x = side * (2.3 - Math.sin(layer / 9 * Math.PI) * 0.72); const z = (layer - 4.5) * 0.08;
      box(root, `PROTEOMICS__P3__FOLDED_SHELL_${side < 0 ? 'WEST' : 'EAST'}_${layer + 1}`, [2.75, 0.72, 6.8 - layer * 0.14], m.graphite, [x, y, z], true, [0, side * (0.06 + layer * 0.008), side * (0.055 - layer * 0.005)]);
    }
  }
  box(root, 'PROTEOMICS__P3__VERTICAL_VOID_SHADOW', [1.28, 5.7, 5.8], m.smokedGlass, [0, 3.05, -0.05]);
  const analyticalRing = torus(root, 'PROTEOMICS__P3__TILTED_ANALYTICAL_RING', 2.3, 0.25, m.darkTitanium, [0, 5.55, 0], [Math.PI / 2 - 0.42, 0.24, 0.14]); analyticalRing.scale.x = 1.18;
  const ringTrack = pulse(torus(root, 'PROTEOMICS__P3__CONTINUOUS_RING_LIGHT_TRACK', 2.3, 0.045, m.cyan.clone(), [0, 5.55, 0], [Math.PI / 2 - 0.42, 0.24, 0.14]), 0.006, 0.25, 0.65, 3.4); ringTrack.scale.x = 1.18;
  const ringAccent = pulse(torus(root, 'PROTEOMICS__P3__MOBILITY_RING_ACCENT_ARC', 2.3, 0.065, m.violet.clone(), [0, 5.55, 0], [Math.PI / 2 - 0.42, 0.24, 0.14], Math.PI * 0.72), 0.009, 1.4, 0.25, 4.1); ringAccent.scale.x = 1.18;
  for (let packet = 0; packet < 18; packet += 1) {
    const a = packet / 18 * Math.PI * 2; const signal = pulse(ellipsoid(root, `PROTEOMICS__P3__RING_MOBILITY_PACKET_${packet + 1}`, [0.07, 0.07, 0.07], (packet % 5 === 0 ? m.violet : m.signal).clone(), [Math.cos(a) * 2.7, 5.55 + Math.sin(a) * 0.82, Math.sin(a) * 2.08]), 0.011 + (packet % 4) * 0.0015, packet * 0.43); signal.rotation.z = 0.42;
  }
  for (let brace = 0; brace < 3; brace += 1) {
    const a = brace / 3 * Math.PI * 2; pipe(root, `PROTEOMICS__P3__EXTERNAL_RING_BRACE_${brace + 1}`, new THREE.Vector3(Math.cos(a) * 2.0, 3.8, Math.sin(a) * 1.8), new THREE.Vector3(Math.cos(a) * 2.65, 5.5 + Math.sin(a) * 0.75, Math.sin(a) * 2.15), 0.18, m.titanium, true);
  }
  const modifications = [m.amber, m.cyan, m.violet, m.titanium];
  for (let mod = 0; mod < 40; mod += 1) {
    const side = mod % 2 ? -1 : 1; const y = 0.9 + (mod % 10) * 0.5; const z = -2.7 + Math.floor(mod / 10) * 1.75; const x = side * (3.35 - Math.sin((mod % 10) / 9 * Math.PI) * 0.5);
    const scale = 0.12 + (mod % 5) * 0.055; ellipsoid(root, `PROTEOMICS__P3__POST_TRANSLATIONAL_MODIFICATION_${mod + 1}`, [scale * (mod % 3 === 0 ? 1.8 : 1), scale, scale * 0.75], modifications[mod % 4], [x, y, z]);
  }
  for (let branch = 0; branch < 8; branch += 1) {
    const x = -3.1 + branch * 0.84; pipe(root, `PROTEOMICS__P3__BRANCHING_REAR_EXOSKELETON_${branch + 1}`, new THREE.Vector3(x, 0.4, -3.25), new THREE.Vector3(x * 0.72, 3.2 + (branch % 3) * 0.5, -3.0), 0.13, m.titanium, true);
  }
  for (let frame = 0; frame < 5; frame += 1) {
    const crown = torus(root, `PROTEOMICS__P3__NESTED_ELLIPTICAL_CROWN_${frame + 1}`, 1.05 - frame * 0.13, 0.04, frame % 2 ? m.titanium : m.signal, [0, 6.25 + frame * 0.22, 0], [Math.PI / 2, frame * 0.28, frame * 0.16]); crown.scale.x = 1.45;
    if (frame === 0) rotate(crown, 0.035, 'y');
  }
  box(root, 'PROTEOMICS__P3__UNINTERRUPTED_VOID_ENTRANCE', [1.3, 4.2, 0.2], m.smokedGlass, [0, 2.15, 3.2]);
  box(root, 'PROTEOMICS__P3__WHITE_COURT_AXIS', [1.05, 0.08, 4.8], m.pearlCeramic, [0, 0.08, 4.05]);
  ellipse(root, 'PROTEOMICS__P3__RING_REFLECTION_BASIN_WEST', [2.6, 1.2], 0.06, m.water, [-2.1, 0.07, 3.7]);
  ellipse(root, 'PROTEOMICS__P3__RING_REFLECTION_BASIN_EAST', [2.6, 1.2], 0.06, m.water, [2.1, 0.07, 3.7]);
  return root;
}

function createInteractome(_record: ProteomicsBuildingProgram, m: ProteomicsMaterials) {
  const root = new THREE.Group(); root.name = 'PROTEOMICS__P4__INTERACTOME_CONSTELLATION';
  box(root, 'PROTEOMICS__P4__SHARED_NETWORK_PLINTH', [11.8, 0.55, 9.8], m.graphite, [0, 0.28, 0], true);
  const nodes = [
    [-3.7, -2.5, 3.4, 2.0, 2.6, m.smokedGlass], [0, -3.0, 2.8, 2.4, 2.1, m.pearlCeramic], [3.65, -2.15, 3.8, 2.0, 2.2, m.dichroic],
    [-4.2, 1.0, 2.5, 2.5, 2.0, m.paleCeramic], [0, 0, 4.0, 2.65, 2.5, m.darkTitanium], [4.1, 1.0, 3.0, 2.1, 2.35, m.smokedGlass],
    [-2.9, 3.25, 2.0, 1.8, 1.6, m.dichroic], [0.3, 3.5, 2.65, 1.9, 1.75, m.pearlCeramic], [3.4, 3.25, 1.8, 1.65, 1.5, m.titanium],
  ] as const;
  const centers: THREE.Vector3[] = [];
  nodes.forEach(([x, z, height, width, depth, material], index) => {
    centers.push(new THREE.Vector3(x, 1.0 + height * 0.54, z));
    const node = taperedCylinder(root, `PROTEOMICS__P4__FACETED_INTERACTION_NODE_${index + 1}`, width, width * (0.78 + (index % 3) * 0.08), height, index === 0 ? 12 : 8, material, [x, 0.55 + height * 0.5, z], true);
    node.scale.z = depth / width; node.rotation.y = index * 0.27; node.rotation.z = index % 2 ? 0.035 : -0.025;
    for (let seam = 0; seam < 8; seam += 1) {
      const a = seam / 8 * Math.PI * 2; pipe(root, `PROTEOMICS__P4__NODE_DIAGONAL_SEAM_${index + 1}_${seam + 1}`, new THREE.Vector3(x + Math.cos(a) * width * 0.44, 0.72, z + Math.sin(a) * depth * 0.44), new THREE.Vector3(x + Math.cos(a + 0.65) * width * 0.34, 0.55 + height * 0.9, z + Math.sin(a + 0.65) * depth * 0.34), 0.025, seam % 4 === 0 ? m.cyan : m.titanium);
    }
  });
  const links = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [3, 6], [4, 7], [5, 8], [6, 7], [7, 8], [0, 4], [2, 4], [4, 6], [4, 8]] as const;
  links.forEach(([a, b], index) => {
    const start = centers[a]; const end = centers[b]; slabBetween(root, `PROTEOMICS__P4__ENCLOSED_INTERACTION_BRIDGE_${index + 1}`, start, end, 0.38 + (index % 3) * 0.08, 0.34, index % 4 === 0 ? m.dichroic : m.smokedGlass);
    pipe(root, `PROTEOMICS__P4__CROSS_LINK_EXOSKELETON_${index + 1}`, start.clone().add(new THREE.Vector3(0, 0.65, 0)), end.clone().add(new THREE.Vector3(0, 0.65, 0)), 0.055, index % 7 === 0 ? m.amber : index % 5 === 0 ? m.cyan : m.titanium);
    pulse(ellipsoid(root, `PROTEOMICS__P4__ACTIVE_LINK_JOINT_${index + 1}`, [0.12, 0.12, 0.12], (index % 4 === 0 ? m.violet : m.signal).clone(), start.clone().lerp(end, 0.5).toArray() as [number, number, number]), 0.012 + index * 0.0004, index * 0.37);
  });
  for (let disc = 0; disc < 96; disc += 1) {
    const a = disc * 2.399963; const radius = 0.22 * Math.sqrt(disc); const y = 3.55 + Math.sin(disc * 1.7) * 0.18;
    const canopyDisc = cylinder(root, `PROTEOMICS__P4__SUSPENDED_MIRROR_DISC_${disc + 1}`, 0.12 + (disc % 4) * 0.025, 0.025, disc % 9 === 0 ? m.cyan : m.titanium, [Math.cos(a) * radius, y, Math.sin(a) * radius], false, 12);
    canopyDisc.rotation.z = Math.PI / 2; if (disc === 0) rotate(canopyDisc, 0.14, 'y');
  }
  for (let marker = 0; marker < 28; marker += 1) {
    const a = marker / 28 * Math.PI * 2; const r = 1.1 + (marker % 5) * 0.33; pulse(ellipsoid(root, `PROTEOMICS__P4__COURT_INTERACTION_MARKER_${marker + 1}`, [0.07, 0.035, 0.07], m.signal.clone(), [Math.cos(a) * r, 0.62, Math.sin(a) * r]), 0.01, marker * 0.29);
  }
  return root;
}

function createSequencingVeil(_record: ProteomicsBuildingProgram, m: ProteomicsMaterials) {
  const root = new THREE.Group(); root.name = 'PROTEOMICS__P5__AMINO_PORE_SEQUENCING_VEIL';
  box(root, 'PROTEOMICS__P5__LINEAR_CANYON_POOL', [14.8, 0.08, 0.55], m.water, [0, 0.08, 0]);
  for (const side of [-1, 1]) {
    for (let segment = 0; segment < 24; segment += 1) {
      if (segment === 11 || segment === 12) continue;
      const x = -8.05 + segment * 0.7; const curve = Math.sin((segment / 23 - 0.5) * Math.PI) * 0.55; const z = side * (1.15 - curve * 0.18);
      box(root, `PROTEOMICS__P5__MEMBRANE_WALL_${side < 0 ? 'NORTH' : 'SOUTH'}_${segment + 1}`, [0.74, 2.2, 0.9], m.graphite, [x, 1.1, z], true, [0, curve * 0.06, 0]);
    }
  }
  for (let pore = 0; pore < 240; pore += 1) {
    const side = pore % 2 ? -1 : 1; const local = Math.floor(pore / 2); const col = local % 30; const row = Math.floor(local / 30); const x = -7.9 + col * 0.545; const y = 0.28 + row * 0.27 + ((pore * 7) % 4) * 0.018;
    const radius = 0.035 + (pore % 11 === 0 ? 0.07 : (pore % 4) * 0.008); const material = pore % 17 === 0 ? m.amber : pore % 13 === 0 ? m.violet : pore % 7 === 0 ? m.cyan : m.signal;
    pulse(torus(root, `PROTEOMICS__P5__INDEPENDENT_MEMBRANE_PORE_${pore + 1}`, radius, 0.012, material.clone(), [x, y, side * 1.62], [0, 0, 0]), 0.007 + (pore % 6) * 0.001, pore * 0.09);
  }
  for (const side of [-1, 1]) {
    const primary = torus(root, `PROTEOMICS__P5__PRIMARY_PORE_${side < 0 ? 'NORTH' : 'SOUTH'}`, 1.5, 0.22, m.titanium, [0, 1.5, side * 1.65], [0, 0, 0]); primary.scale.y = 1;
    for (let plate = 0; plate < 12; plate += 1) {
      const a = plate / 12 * Math.PI * 2; box(root, `PROTEOMICS__P5__ENGINEERED_PORE_PLATE_${side < 0 ? 'NORTH' : 'SOUTH'}_${plate + 1}`, [0.48, 0.16, 0.16], plate % 3 === 0 ? m.dichroic : m.darkTitanium, [Math.cos(a) * 1.22, 1.5 + Math.sin(a) * 1.22, side * 1.7], false, [0, 0, a]);
    }
  }
  box(root, 'PROTEOMICS__P5__PRIMARY_PORE_ENTRY_BRIDGE', [4.1, 0.16, 1.1], m.palePaving, [0, 0.22, 0]);
  const prism = box(root, 'PROTEOMICS__P5__CRYSTALLINE_DATA_PRISM', [1.75, 4.9, 1.75], m.dichroic, [0, 2.45, 0], true, [0, Math.PI / 4, 0]);
  for (let meshLine = 0; meshLine < 28; meshLine += 1) {
    const x = -0.75 + (meshLine % 7) * 0.25; const y = 0.35 + Math.floor(meshLine / 7) * 1.12;
    pulse(pipe(root, `PROTEOMICS__P5__DATA_PRISM_SIGNAL_TRACE_${meshLine + 1}`, new THREE.Vector3(x, y, 0.9), new THREE.Vector3(x + 0.65, y + 0.8, 0.9), 0.018, (meshLine % 5 === 0 ? m.violet : m.signal).clone()), 0.01 + (meshLine % 4) * 0.001, meshLine * 0.21);
  }
  const chainPoints = Array.from({ length: 18 }, (_, index) => new THREE.Vector3(Math.sin(index * 1.3) * 0.38, 0.4 + index * 0.235, 1.02 + Math.cos(index * 0.9) * 0.12));
  chainPoints.slice(1).forEach((point, index) => pipe(root, `PROTEOMICS__P5__IRREGULAR_PROTEIN_CHAIN_${index + 1}`, chainPoints[index], point, 0.055, index % 4 === 0 ? m.amber : m.titanium));
  box(root, 'PROTEOMICS__P5__DATA_PRISM_ROOF_FIN_WEST', [0.12, 1.35, 1.2], m.titanium, [-0.58, 5.35, 0], false, [0, 0, -0.26]);
  box(root, 'PROTEOMICS__P5__DATA_PRISM_ROOF_FIN_EAST', [0.12, 1.35, 1.2], m.titanium, [0.58, 5.35, 0], false, [0, 0, 0.26]);
  pulse(cylinder(root, 'PROTEOMICS__P5__SUSPENDED_ROOF_SIGNAL_CYLINDER', 0.18, 1.25, m.signal.clone(), [0, 5.45, 0], false, 12), 0.012, 0.4);
  for (let bridge = 0; bridge < 3; bridge += 1) box(root, `PROTEOMICS__P5__SECONDARY_PORE_BRIDGE_${bridge + 1}`, [1.0, 0.42, 2.4], m.smokedGlass, [-5.2 + bridge * 5.2, 1.15 + bridge * 0.32, 0]);
  for (let track = 0; track < 12; track += 1) {
    const x = -7.0 + track * 1.28; const signal = pulse(box(root, `PROTEOMICS__P5__CANYON_VERTICAL_SIGNAL_${track + 1}`, [0.035, 0.48, 0.035], (track % 4 === 0 ? m.cyan : m.signal).clone(), [x, 0.42, -0.72]), 0.009, track * 0.4); signalTravel(signal, 'y', 1.35, 0.012 + track * 0.0003, track / 12);
  }
  prism.userData.primaryDataTower = true;
  return root;
}

function assignBuildingMetadata(root: THREE.Group, record: ProteomicsBuildingProgram) {
  root.userData.exteriorProgram = true; root.userData.buildingCode = record.code; root.userData.buildingName = record.name; root.userData.buildingSubtitle = record.subtitle; root.userData.purpose = record.purpose; root.userData.footprintMetres = [...record.footprintMetres]; root.userData.heightMetres = record.heightMetres; root.userData.exteriorMotif = record.exteriorMotif; root.userData.navObstacle = true;
  root.traverse((object) => { object.userData.selectableId = DISTRICT_ID; object.userData.districtId = DISTRICT_ID; }); return root;
}

function createBuilding(record: ProteomicsBuildingProgram, m: ProteomicsMaterials) {
  const factories: Record<ProteomicsBuildingForm, (record: ProteomicsBuildingProgram, materials: ProteomicsMaterials) => THREE.Group> = { monocell: createMonocellArray, cartography: createTissueCartography, basilica: createProteoformBasilica, interactome: createInteractome, veil: createSequencingVeil };
  return assignBuildingMetadata(factories[record.form](record, m), record);
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
  points.forEach((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5); vertices.push(point.x + normal.x, point.y, point.z + normal.z, point.x - normal.x, point.y, point.z - normal.z); if (index < points.length - 1) { const base = index * 2; indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); } });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function addRibbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, material: THREE.Material, walkable = true) {
  const ribbon = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), material), name); ribbon.userData.walkable = walkable; ribbon.userData.navObstacle = false; ribbon.userData.proteomicsRoute = true; ribbon.receiveShadow = true; parent.add(ribbon); return ribbon;
}

function offsetPath(points: readonly THREE.Vector3[], offset: number, modulation: number, frequency: number) {
  return points.map((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x); const t = index / Math.max(1, points.length - 1); return point.clone().addScaledVector(normal, offset + Math.sin(t * Math.PI * frequency) * modulation).setY(FLOOR_Y + 0.027); });
}

function addDistrictInfrastructure(district: THREE.Group, definition: DistrictDefinition, m: ProteomicsMaterials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'PROTEOMICS__DISTRICT_FOLDED_INFRASTRUCTURE';
  const walk = districtArc(definition, 0.56, 0.025, 0.975, 108); addRibbon(infrastructure, 'PROTEOMICS__POLYPEPTIDE_WALK', walk, 1.72, m.palePaving);
  [-0.38, 0, 0.38].forEach((offset, index) => pulse(addRibbon(infrastructure, `PROTEOMICS__MOLECULAR_BACKBONE_LIGHT_${index + 1}`, offsetPath(walk, offset, 0.1 + index * 0.03, 7 + index), 0.045, [m.cyan, m.signal, m.violet][index].clone(), false), 0.011 + index * 0.0015, index * 0.75));
  [0.13, 0.38, 0.64, 0.87].forEach((angularT, index) => { const spine = districtSpine(definition, angularT, 0.05, 0.95, 56); addRibbon(infrastructure, `PROTEOMICS__SIDE_CHAIN_PATH_${index + 1}`, offsetPath(spine, 0, 0.2, 3 + index), 0.75, index % 2 ? m.darkPaving : m.palePaving); pulse(addRibbon(infrastructure, `PROTEOMICS__SIDE_CHAIN_SIGNAL_${index + 1}`, offsetPath(spine, 0, 0.08, 5 + index), 0.035, [m.amber, m.cyan, m.violet, m.signal][index].clone(), false), 0.013, index * 0.63); });
  district.add(infrastructure); return { infrastructure, walk };
}

function addDistrictLandscape(district: THREE.Group, definition: DistrictDefinition, m: ProteomicsMaterials) {
  const landscape = new THREE.Group(); landscape.name = 'PROTEOMICS__HETEROGENEOUS_CELL_GARDENS';
  for (let island = 0; island < 36; island += 1) {
    const point = pointInDistrict(definition, island % 2 ? 0.29 : 0.9, 0.045 + Math.floor(island / 2) * 0.053, FLOOR_Y); const diameter = 0.72 + (island % 6) * 0.14;
    ellipse(landscape, `PROTEOMICS__INDIVIDUAL_CELL_GARDEN_${island + 1}`, [diameter, diameter * (0.72 + (island % 4) * 0.08)], 0.1, island % 5 === 0 ? m.water : island % 3 === 0 ? m.moss : m.grass, [point.x, 0.08, point.z]);
    if (island % 4 === 0) { cylinder(landscape, `PROTEOMICS__SPECIMEN_TREE_TRUNK_${island + 1}`, 0.12, 0.9, m.darkTitanium, [point.x, 0.53, point.z], false, 12); ellipsoid(landscape, `PROTEOMICS__SPECIMEN_TREE_CANOPY_${island + 1}`, [0.42, 0.62, 0.42], m.moss, [point.x, 1.15, point.z]); torus(landscape, `PROTEOMICS__CIRCULAR_SPECIMEN_BENCH_${island + 1}`, 0.65, 0.08, m.palePaving, [point.x, 0.22, point.z]); }
  }
  district.add(landscape); return landscape;
}

export function buildProteomicsLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Proteomics Labs District requires a masterplan sector');
  const materials = createProteomicsMaterials(); const { infrastructure, walk } = addDistrictInfrastructure(district, definition, materials); const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = PROTEOMICS_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials); const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02); building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT }; district.add(building); return building;
  });
  facilities.forEach((facility, index) => {
    const record = PROTEOMICS_BUILDING_PROGRAM[index]; const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, record.footprintMetres[1] / 20 + 0.8); const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const routePoint = walk.reduce((closest, point) => point.distanceToSquared(entrance) < closest.distanceToSquared(entrance) ? point : closest, walk[0]); const approachPoints = [routePoint.clone(), routePoint.clone().lerp(entrance, 0.52), entrance];
    addRibbon(infrastructure, `PROTEOMICS__BUILDING_APPROACH_${record.code}`, approachPoints, 0.8, materials.palePaving); pulse(addRibbon(infrastructure, `PROTEOMICS__BUILDING_APPROACH_SIGNAL_${record.code}`, approachPoints.map((point) => point.clone().setY(FLOOR_Y + 0.027)), 0.04, [materials.cyan, materials.violet, materials.amber, materials.signal, materials.dichroic][index].clone(), false), 0.014, index * 0.52);
  });
  district.userData.proteomicsLabsDistrict = {
    identity: 'Proteomics Labs District', architecturalLanguage: 'folds, knots, cavities, branching assemblies, porous membranes, and appended molecular modifications expressed through pearl ceramic, dark titanium, smoked glass, dichroic glazing, and sparse analytical signals', buildingCount: facilities.length,
    buildings: PROTEOMICS_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, subtitle: record.subtitle, purpose: record.purpose, placementZone: record.placementZone, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorMotif: record.exteriorMotif })),
    landmarks: { verticalArray: 'The Monocell Proteome Array', spatialMap: 'The Tissue Cartography Hall', monumentalCenter: 'The Proteoform Resonance Basilica', networkJunction: 'The Interactome Constellation', experimentalGate: 'The Amino-Pore Sequencing Veil' },
    circulation: { primaryWalk: 'PROTEOMICS__POLYPEPTIDE_WALK', molecularBackboneLights: 3, branchingSideChainPaths: 4, exactBuildingApproaches: 5 },
    signatureSystems: { monocellBlades: 7, cartographyCellPanels: 144, proteoformModifications: 40, interactomeNodes: 9, membranePores: 240, advertisingDisplays: false },
    materials: ['pearl-white technical ceramic', 'dark titanium and graphite metal', 'smoked laboratory glass', 'cyan-violet dichroic glazing', 'amber, magenta, and electric-blue modifications'], landscape: { heterogeneousCellGardens: 36, specimenTreeIslands: 9, foldedRouteFurniture: true }, exteriorOnly: true,
  };
  district.userData.population = { plannedFacilities: PROTEOMICS_BUILDING_PROGRAM.map((record) => record.name), plannedObjects: ['Polypeptide Walk', 'Molecular Backbone Lights', 'Side-Chain Paths', 'Heterogeneous Cell Gardens', 'Specimen Tree Islands'], realizedFeatureTags: PROTEOMICS_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')), realizedFacilityCount: facilities.length, realizedObjectCount: infrastructure.children.length + landscape.children.length, distinct: true, asymmetricCampus: true, localRoadCount: 10, radialCoverage: 0.92, angularCoverage: 0.94, exteriorOnly: true, foldedProteinLandscape: true };
}
