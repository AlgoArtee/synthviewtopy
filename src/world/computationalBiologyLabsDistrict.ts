import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type ComputationalBiologyBuildingForm =
  | 'cellularis'
  | 'causa'
  | 'proteus'
  | 'pangenome'
  | 'morphospace'
  | 'regula'
  | 'immunome'
  | 'kinetica'
  | 'aion'
  | 'continuum';

export interface ComputationalBiologyBuildingProgram {
  code: string;
  name: string;
  subtitle: string;
  purpose: string;
  form: ComputationalBiologyBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
}

export const COMPUTATIONAL_BIOLOGY_BUILDING_PROGRAM: readonly ComputationalBiologyBuildingProgram[] = [
  { code: 'C1', name: 'Cellularis Nexus', subtitle: 'AI Virtual Cell and Whole-Cell Modeling Institute', purpose: 'Virtual cells, biological foundation models, mechanistic simulation, perturbation response, and independent benchmarking', form: 'cellularis', footprintMetres: [148, 116], heightMetres: 72, radialT: 0.14, angularT: 0.06, placementZone: 'Angular Robotics interface', exteriorMotif: 'three displaced elliptical shells, a violet-black ovoid, and a severe seventeen-degree Validation Bar' },
  { code: 'C2', name: 'Causa Array', subtitle: 'Causal Perturbation and Counterfactual Biology Center', purpose: 'CRISPR perturbation screens, counterfactual prediction, causal regulatory networks, and uncertainty-aware benchmarks', form: 'causa', footprintMetres: [190, 88], heightMetres: 91, radialT: 0.14, angularT: 0.28, placementZone: 'Cartesian control field beside Robotics', exteriorMotif: 'a horizontal initial-state base crossed by sixteen control and perturbed slabs around a Counterfactual Void' },
  { code: 'C10', name: 'Continuum BioTwin Observatory', subtitle: 'Multiscale Systems Biology and Digital Twin Institute', purpose: 'Personalized, dynamically updated and testable molecular-to-organ biological digital twins', form: 'continuum', footprintMetres: [170, 105], heightMetres: 112, radialT: 0.14, angularT: 0.50, placementZone: 'Central landmark on the Inference Spine', exteriorMotif: 'four incomplete and offset molecular, cellular, tissue, and systems frames linked by selective diagonal bridges' },
  { code: 'C3', name: 'Proteus Fold', subtitle: 'Generative Biomolecular Geometry and Interaction Center', purpose: 'Generative protein, antibody, complex, and functional conformational design', form: 'proteus', footprintMetres: [132, 102], heightMetres: 124, radialT: 0.14, angularT: 0.68, placementZone: 'Folded molecular transition toward Proteomics', exteriorMotif: 'two related folded towers, a conditional interaction bridge, and an irregular molecular contact lattice' },
  { code: 'C4', name: 'Pangenome Meridian', subtitle: 'Graph Genome and Structural Variation Observatory', purpose: 'Graph genome references, phased assemblies, structural variation, and inclusive genomic representation', form: 'pangenome', footprintMetres: [190, 118], heightMetres: 67, radialT: 0.14, angularT: 0.90, placementZone: 'Linear graph interface toward Genomics', exteriorMotif: 'five diverging and reconnecting genome bars with equivalent entrances and a translucent courier line' },
  { code: 'C7', name: 'Immunome Exchange', subtitle: 'Computational Immunology and Molecular Recognition Center', purpose: 'Immune repertoire modeling, receptor-antigen recognition, antibody structure, and therapeutic binder design', form: 'immunome', footprintMetres: [176, 132], heightMetres: 106, radialT: 0.86, angularT: 0.06, placementZone: 'Cellular-recognition interface toward Proteomics', exteriorMotif: 'two imperfectly matched crescent wings facing across Recognition Court behind a diverse Repertoire Fin' },
  { code: 'C5', name: 'Morphospace Atlas', subtitle: 'Spatial Multi-Omics and Virtual Tissue Reconstruction Center', purpose: 'Spatial molecular alignment, cellular neighborhoods, tissue geometry, and virtual tissue reconstruction', form: 'morphospace', footprintMetres: [218, 126], heightMetres: 63, radialT: 0.86, angularT: 0.28, placementZone: 'Spatial transition toward OMICS', exteriorMotif: 'six offset tissue-section plates, a deep Section Break, cellular relief, and a rising Contour Promenade' },
  { code: 'C8', name: 'Kinetica Dynamics Array', subtitle: 'Biomolecular Simulation and Differentiable Biophysics Center', purpose: 'Molecular dynamics, conformational sampling, learned energy models, and motion-aware biomolecular design', form: 'kinetica', footprintMetres: [154, 128], heightMetres: 72, radialT: 0.86, angularT: 0.50, placementZone: 'Outer computational infrastructure belt', exteriorMotif: 'a dark faceted core surrounded by three open warped trajectory ribbons and an exposed cooling cascade' },
  { code: 'C9', name: 'Aion Evolution Engine', subtitle: 'Evolutionary Genomics and Biosphere Computation Complex', purpose: 'Evolutionary foundation models, genomic context, metagenomic inference, and biosphere-scale sequence design', form: 'aion', footprintMetres: [186, 112], heightMetres: 99, radialT: 0.86, angularT: 0.75, placementZone: 'Dark outer anchor toward Astrobiology', exteriorMotif: 'a stratified basalt monolith divided by a branching Phylogenetic Canyon and backed by a porous Thermal Reef' },
  { code: 'C6', name: 'Regula Loom', subtitle: 'Regulatory Genome and Synthetic Control Institute', purpose: 'Long-context regulatory sequence modeling, variant interpretation, and synthetic control-element design', form: 'regula', footprintMetres: [235, 84], heightMetres: 98, radialT: 0.86, angularT: 0.97, placementZone: 'Long genomic edge toward Genomics', exteriorMotif: 'a dark Sequence Plinth carrying three distant veil towers and long-range Enhancer Bridges' },
] as const;

const DISTRICT_ID = 'computational-biology-labs';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const UNIT_CYLINDER_16 = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 10, 6);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_X = new THREE.Vector3(1, 0, 0);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

type ComputationalBiologyMaterials = ReturnType<typeof createComputationalBiologyMaterials>;

function districtMaterial(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ name, color, roughness: 0.56, metalness: 0.14, ...options });
}

function createComputationalBiologyMaterials() {
  const basalt = districtMaterial('Computational Biology black basalt', '#080c10', { roughness: 0.83, metalness: 0.12 });
  const graphite = districtMaterial('Computational Biology graphite titanium', '#202a32', { roughness: 0.34, metalness: 0.86 });
  const titanium = districtMaterial('Computational Biology pale titanium', '#aebbc1', { roughness: 0.22, metalness: 0.92 });
  const ceramic = districtMaterial('Computational Biology pale mineral ceramic', '#e9ebe6', { roughness: 0.46, metalness: 0.03 });
  const concrete = districtMaterial('Computational Biology white UHPC', '#c8cfcc', { roughness: 0.72, metalness: 0.02 });
  const darkGlass = districtMaterial('Computational Biology violet-black electrochromic glass', '#161426', { emissive: '#2c234d', emissiveIntensity: 0.28, roughness: 0.08, metalness: 0.24, transparent: true, opacity: 0.78, side: THREE.DoubleSide });
  const photoGlass = districtMaterial('Computational Biology translucent photovoltaic glass', '#6e909d', { emissive: '#23424c', emissiveIntensity: 0.24, roughness: 0.14, metalness: 0.18, transparent: true, opacity: 0.66, side: THREE.DoubleSide });
  const iridescent = districtMaterial('Computational Biology restrained iridescent metal', '#7b7ca7', { emissive: '#403a72', emissiveIntensity: 0.26, roughness: 0.2, metalness: 0.82 });
  const cool = districtMaterial('Computational Biology cool white calibration light', '#dffcff', { emissive: '#bcefff', emissiveIntensity: 2.7, roughness: 0.08 });
  const cyan = districtMaterial('Computational Biology pale cyan signal', '#7de5ed', { emissive: '#42c7d1', emissiveIntensity: 2.45, roughness: 0.1 });
  const violet = districtMaterial('Computational Biology muted violet signal', '#a88ed5', { emissive: '#6e52ae', emissiveIntensity: 2.35, roughness: 0.1 });
  const amber = districtMaterial('Computational Biology amber calibration marker', '#ffc15f', { emissive: '#c8771d', emissiveIntensity: 2.25, roughness: 0.12 });
  const palePaving = districtMaterial('Inference Spine pale coordinate paving', '#aeb6b4', { roughness: 0.96, metalness: 0.01 });
  const darkPaving = districtMaterial('Computational Biology dark analytical paving', '#242a2d', { roughness: 0.95, metalness: 0.04 });
  const water = districtMaterial('Computational Biology shallow black water', '#071820', { emissive: '#0c2b34', emissiveIntensity: 0.14, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.84 });
  const grass = districtMaterial('Computational Biology controlled research grass', '#667b6d', { roughness: 0.98, metalness: 0 });
  const moss = districtMaterial('Computational Biology experimental moss', '#314c3d', { roughness: 0.99, metalness: 0 });
  [cool, cyan, violet, amber].forEach((material) => { material.userData.isDistrictAccent = true; });
  return { basalt, graphite, titanium, ceramic, concrete, darkGlass, photoGlass, iridescent, cool, cyan, violet, amber, palePaving, darkPaving, water, grass, moss };
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

function cylinder(parent: THREE.Object3D, name: string, diameter: number, height: number, material: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 16, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(segments <= 8 ? UNIT_CYLINDER_8 : UNIT_CYLINDER_16, material), name, obstacle);
  mesh.scale.set(diameter, height, diameter); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function taperedCylinder(parent: THREE.Object3D, name: string, bottomDiameter: number, topDiameter: number, height: number, segments: number, material: THREE.Material, position: readonly [number, number, number], obstacle = false) {
  const mesh = prepare(new THREE.Mesh(new THREE.CylinderGeometry(topDiameter * 0.5, bottomDiameter * 0.5, height, segments), material), name, obstacle);
  mesh.position.set(...position); parent.add(mesh); return mesh;
}

function ellipse(parent: THREE.Object3D, name: string, diameter: readonly [number, number], height: number, material: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 16, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = cylinder(parent, name, 1, height, material, position, obstacle, segments, rotation);
  mesh.scale.x = diameter[0]; mesh.scale.z = diameter[1]; return mesh;
}

function ellipsoid(parent: THREE.Object3D, name: string, scale: readonly [number, number, number], material: THREE.Material, position: readonly [number, number, number], obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(UNIT_SPHERE, material), name, obstacle);
  mesh.scale.set(...scale); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, material: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0], arc = Math.PI * 2) {
  const radialSegments = radius >= 2 ? 32 : 16; const tubularSegments = radius >= 1 ? 6 : 4;
  const key = `${radius.toFixed(3)}|${tube.toFixed(3)}|${arc.toFixed(3)}|${tubularSegments}|${radialSegments}`;
  let geometry = TORUS_CACHE.get(key);
  if (!geometry) { geometry = new THREE.TorusGeometry(radius, tube, tubularSegments, radialSegments, arc); TORUS_CACHE.set(key, geometry); }
  const mesh = prepare(new THREE.Mesh(geometry, material), name); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function pipe(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material, obstacle = false) {
  const direction = end.clone().sub(start); const mesh = prepare(new THREE.Mesh(UNIT_CYLINDER_8, material), name, obstacle);
  mesh.scale.set(radius * 2, direction.length(), radius * 2); mesh.position.copy(start).add(end).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(UNIT_Y, direction.normalize()); parent.add(mesh); return mesh;
}

function slabBetween(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, width: number, height: number, material: THREE.Material, obstacle = false) {
  const direction = end.clone().sub(start); const mesh = prepare(new THREE.Mesh(UNIT_BOX, material), name, obstacle);
  mesh.scale.set(direction.length() + 0.05, height, width); mesh.position.copy(start).add(end).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(UNIT_X, direction.normalize()); parent.add(mesh); return mesh;
}

function pulse(object: THREE.Object3D, speed: number, phase = 0, minIntensity = 0.2, maxIntensity = 4.2) {
  object.userData.animate = 'computational-biology-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate(object: THREE.Object3D, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'computational-biology-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function signalTravel(object: THREE.Object3D, axis: 'x' | 'y' | 'z', travel: number, speed: number, phase: number) {
  object.userData.animate = 'computational-biology-signal-travel'; object.userData.axis = axis; object.userData.travel = travel; object.userData.speed = speed; object.userData.phase = phase;
  object.userData.baseX = object.position.x; object.userData.baseY = object.position.y; object.userData.baseZ = object.position.z; return object;
}

function createCellularis(_record: ComputationalBiologyBuildingProgram, m: ComputationalBiologyMaterials) {
  const root = new THREE.Group(); root.name = 'COMPBIO__C1__CELLULARIS_NEXUS';
  ellipse(root, 'COMPBIO__C1__BASALT_CELLULAR_PLINTH', [13.8, 10.8], 0.5, m.basalt, [0, 0.25, 0], true, 16);
  const shells = [
    { center: [-0.6, 3.5, 0.2] as const, scale: [6.4, 3.4, 5.0] as const, rotation: [0.08, -0.16, 0.04] as const, material: m.photoGlass },
    { center: [0.45, 3.85, -0.25] as const, scale: [5.2, 3.65, 4.1] as const, rotation: [-0.1, 0.25, 0.14] as const, material: m.ceramic },
    { center: [-0.15, 5.45, 0.45] as const, scale: [3.8, 2.25, 3.2] as const, rotation: [0.2, -0.18, -0.1] as const, material: m.iridescent },
  ];
  shells.forEach((shell, index) => {
    const membrane = ellipsoid(root, `COMPBIO__C1__DISPLACED_ELLIPTICAL_SHELL_${index + 1}`, shell.scale, shell.material, shell.center, true, shell.rotation);
    membrane.material = shell.material.clone(); (membrane.material as THREE.MeshStandardMaterial).transparent = true; (membrane.material as THREE.MeshStandardMaterial).opacity = index === 1 ? 0.38 : 0.5;
    for (let fin = 0; fin < 24; fin += 1) {
      const angle = fin / 24 * Math.PI * 2; const rx = shell.scale[0] * 0.5; const rz = shell.scale[2] * 0.5; const height = 1.2 + (fin % 6) * 0.34 + index * 0.24;
      box(root, `COMPBIO__C1__CELL_STATE_CERAMIC_FIN_${index + 1}_${fin + 1}`, [0.07 + (fin % 3) * 0.025, height, 0.22], fin % 7 === 0 ? m.titanium : m.ceramic, [shell.center[0] + Math.cos(angle) * rx, 1.2 + height * 0.5 + index * 0.65, shell.center[2] + Math.sin(angle) * rz], false, [0, -angle, (fin % 5 - 2) * 0.018]);
    }
  });
  ellipsoid(root, 'COMPBIO__C1__VIOLET_BLACK_CENTRAL_OVOID', [3.0, 4.35, 2.65], m.darkGlass, [0.1, 4.55, -0.1], true, [0.08, 0.2, -0.04]);
  box(root, 'COMPBIO__C1__SEVENTEEN_DEGREE_VALIDATION_BAR', [11.1, 1.2, 1.35], m.graphite, [0.4, 3.35, 0], true, [0, 17 * Math.PI / 180, 0]);
  for (let window = 0; window < 12; window += 1) box(root, `COMPBIO__C1__VALIDATION_BAR_BASELINE_WINDOW_${window + 1}`, [0.52, 0.16, 0.04], m.darkGlass, [-4.4 + window * 0.82, 3.42, 0.72 + (-4.4 + window * 0.82) * Math.sin(17 * Math.PI / 180)], false, [0, 17 * Math.PI / 180, 0]);
  box(root, 'COMPBIO__C1__FORTY_TWO_METRE_CANTILEVER_ENTRY', [4.2, 0.32, 2.2], m.ceramic, [-3.7, 2.25, 4.6]);
  box(root, 'COMPBIO__C1__FRAMELESS_DARK_MAIN_THRESHOLD', [2.4, 2.4, 0.18], m.darkGlass, [-3.65, 1.3, 4.75], true);
  ellipse(root, 'COMPBIO__C1__VALIDATION_REFLECTION_BASIN', [4.2, 2.4], 0.06, m.water, [5.1, 0.07, -1.5]);
  for (let plot = 0; plot < 32; plot += 1) {
    const col = plot % 8; const row = Math.floor(plot / 8); const x = -5.25 + col * 1.5; const z = 5.9 + row * 0.72;
    box(root, `COMPBIO__C1__PERTURBATION_GARDEN_PLOT_${plot + 1}`, [1.15, 0.1, 0.5], plot % 7 === 0 ? m.water : plot % 3 === 0 ? m.moss : m.grass, [x, 0.08, z]);
    if (plot % 5 === 0) pulse(cylinder(root, `COMPBIO__C1__UNCERTAINTY_MARKER_${plot + 1}`, 0.08, 0.55, m.amber.clone(), [x, 0.38, z], false, 8), 0.009, plot * 0.31);
  }
  for (let tower = 0; tower < 12; tower += 1) {
    const angle = tower / 12 * Math.PI * 2; const x = Math.cos(angle) * 3.75; const z = Math.sin(angle) * 3.1;
    taperedCylinder(root, `COMPBIO__C1__CONICAL_COOLING_TOWER_${tower + 1}`, 0.7, 0.38, 0.75, 12, m.graphite, [x, 7.15 + (tower % 3) * 0.12, z]);
    pulse(torus(root, `COMPBIO__C1__COOLING_TOWER_RING_${tower + 1}`, 0.3, 0.035, m.cyan.clone(), [x, 7.42 + (tower % 3) * 0.12, z]), 0.007 + tower * 0.0002, tower * 0.47);
  }
  return root;
}

function createCausa(_record: ComputationalBiologyBuildingProgram, m: ComputationalBiologyMaterials) {
  const root = new THREE.Group(); root.name = 'COMPBIO__C2__CAUSA_ARRAY';
  box(root, 'COMPBIO__C2__INITIAL_STATE_HORIZONTAL_BASE', [18.6, 1.15, 7.8], m.basalt, [0, 0.58, 0], true);
  pulse(box(root, 'COMPBIO__C2__STABLE_BASELINE_LIGHT', [18.2, 0.05, 0.06], m.cool.clone(), [0, 1.18, 3.94]), 0.006, 0.1);
  const omitted = new Set([7, 8]);
  for (let slab = 0; slab < 16; slab += 1) {
    if (omitted.has(slab)) continue;
    const row = slab % 2; const column = Math.floor(slab / 2); const x = -7.6 + column * 2.18; const z = row ? -2.05 : 2.05; const control = slab < 4;
    const height = control ? 5.8 + slab * 0.2 : 3.5 + ((slab * 7) % 10) * 0.58;
    const shift = control ? 0 : ((slab % 3) - 1) * 0.24;
    box(root, `COMPBIO__C2__${control ? 'CONTROL' : 'PERTURBED'}_VERTICAL_SLAB_${slab + 1}`, [1.25 + (slab % 3) * 0.12, height, 1.05], control ? m.ceramic : slab % 3 === 0 ? m.iridescent : m.concrete, [x + shift, 1.15 + height * 0.5, z], true, [0, control ? 0 : (slab % 5 - 2) * 0.035, control ? 0 : (slab % 4 - 1.5) * 0.012]);
    for (let module = 0; module < 10; module += 1) {
      const rowY = module % 5; const side = module < 5 ? -1 : 1; const perturb = control ? 0 : Math.max(0, rowY - (slab % 4)) * 0.035;
      box(root, `COMPBIO__C2__PANEL_RESPONSE_MODULE_${slab + 1}_${module + 1}`, [0.22 + perturb, 0.34, 0.08], module % 6 === 0 ? m.cyan : m.darkGlass, [x + shift + side * (0.42 + perturb), 1.55 + rowY * Math.max(0.5, height / 6), z + 0.56], false, [0, 0, control ? 0 : perturb * side]);
    }
  }
  box(root, 'COMPBIO__C2__COUNTERFACTUAL_VOID_FLOOR_APERTURE', [3.4, 0.06, 5.6], m.darkGlass, [0, 1.2, 0]);
  const bridgeMaterials = [m.graphite, m.photoGlass, m.ceramic];
  for (let bridge = 0; bridge < 3; bridge += 1) slabBetween(root, `COMPBIO__C2__COUNTERFACTUAL_BRIDGE_${bridge + 1}`, new THREE.Vector3(-2.1, 2.7 + bridge * 1.15, 2.0), new THREE.Vector3(2.3 + bridge * 0.5, 2.7 + bridge * 1.15, -2.0 + bridge * 0.25), 0.64, 0.28, bridgeMaterials[bridge]);
  for (let basin = 0; basin < 48; basin += 1) {
    const col = basin % 12; const row = Math.floor(basin / 12); const x = -8.25 + col * 1.5; const z = 5.05 + row * 0.7;
    ellipse(root, `COMPBIO__C2__INTERVENTION_BASIN_${basin + 1}`, [0.72, 0.72], 0.12 + (basin % 5) * 0.018, basin % 9 === 0 ? m.water : basin % 4 === 0 ? m.moss : m.grass, [x, 0.09, z], false, 16);
    if (basin % 8 === 0) pipe(root, `COMPBIO__C2__INFERRED_BASIN_RELATION_${basin + 1}`, new THREE.Vector3(x, 0.18, z), new THREE.Vector3(x + 2.8, 0.18, z + 0.7), 0.018, m.titanium);
  }
  box(root, 'COMPBIO__C2__CONTROL_ENTRY_CANOPY', [3.2, 0.2, 2.4], m.ceramic, [-7.5, 2.1, 4.2]);
  box(root, 'COMPBIO__C2__COUNTERFACTUAL_PUBLIC_THRESHOLD', [2.4, 2.0, 0.18], m.darkGlass, [0, 1.55, 4.0], true);
  return root;
}

function createProteus(_record: ComputationalBiologyBuildingProgram, m: ComputationalBiologyMaterials) {
  const root = new THREE.Group(); root.name = 'COMPBIO__C3__PROTEUS_FOLD';
  box(root, 'COMPBIO__C3__SIX_METRE_BASALT_PLINTH', [12.8, 0.6, 9.2], m.basalt, [0, 0.3, 0], true);
  const towerData = [{ x: -3.5, height: 8.9, lean: -1 }, { x: 3.5, height: 12.4, lean: 1 }];
  towerData.forEach(({ x, height, lean }, tower) => {
    for (let layer = 0; layer < 10; layer += 1) {
      const t = layer / 9; const offset = lean * (t < 0.45 ? t * 0.75 : (1 - t) * 0.9); const width = 3.15 - Math.sin(t * Math.PI) * 0.52; const layerHeight = height / 10;
      box(root, `COMPBIO__C3__FOLDED_TOWER_${tower + 1}_PLANE_${layer + 1}`, [width, layerHeight + 0.08, 5.0 - (layer % 3) * 0.28], layer % 4 === 0 ? m.darkGlass : layer % 3 === 0 ? m.titanium : m.ceramic, [x + offset, 0.62 + layerHeight * (layer + 0.5), (layer % 4 - 1.5) * 0.08], true, [0, (layer % 3 - 1) * 0.04, lean * (0.06 - t * 0.08)]);
    }
    const nodes: THREE.Vector3[] = [];
    for (let node = 0; node < 14; node += 1) {
      const angle = node * 2.399963; const y = 1.1 + (node % 7) * height / 8; const point = new THREE.Vector3(x + Math.cos(angle) * (1.7 + (node % 3) * 0.22), y, Math.sin(angle) * 2.5);
      nodes.push(point); pulse(ellipsoid(root, `COMPBIO__C3__CONTACT_LATTICE_NODE_${tower + 1}_${node + 1}`, [0.13 + (node % 4) * 0.035, 0.13, 0.13], node % 5 === 0 ? m.violet.clone() : m.iridescent, point.toArray() as [number, number, number]), 0.008, node * 0.33 + tower);
      if (node > 0) pipe(root, `COMPBIO__C3__CONTACT_LATTICE_LINK_${tower + 1}_${node}`, nodes[node - 1], point, 0.035, node % 4 === 0 ? m.cyan : m.titanium);
    }
  });
  const bridgePoints = [new THREE.Vector3(3.0, 8.5, 0), new THREE.Vector3(1.5, 7.5, 0.4), new THREE.Vector3(0, 6.2, -0.35), new THREE.Vector3(-2.55, 6.6, 0)];
  bridgePoints.slice(1).forEach((point, index) => slabBetween(root, `COMPBIO__C3__FOLDED_INTERACTION_BRIDGE_${index + 1}`, bridgePoints[index], point, 1.15 - index * 0.16, 0.44, index === 2 ? m.photoGlass : m.iridescent));
  pipe(root, 'COMPBIO__C3__CONDITIONAL_BRIDGE_ROD_1', new THREE.Vector3(-2.6, 6.6, -0.5), new THREE.Vector3(-3.1, 6.6, -0.5), 0.045, m.titanium);
  box(root, 'COMPBIO__C3__ENTRANCE_CANYON_REFLECTION', [3.0, 0.06, 7.6], m.water, [0, 0.65, 0]);
  box(root, 'COMPBIO__C3__DUAL_TOWER_DARK_THRESHOLD', [2.3, 2.5, 0.18], m.darkGlass, [0, 1.85, 4.2], true);
  for (let pocket = 0; pocket < 12; pocket += 1) {
    const angle = pocket / 12 * Math.PI * 2; const r = 5.2 + (pocket % 3) * 0.55;
    const cavity = ellipsoid(root, `COMPBIO__C3__BINDING_POCKET_NEGATIVE_${pocket + 1}`, [0.6 + (pocket % 4) * 0.14, 0.35, 0.5 + (pocket % 3) * 0.15], pocket % 3 === 0 ? m.moss : m.basalt, [Math.cos(angle) * r, 0.72, Math.sin(angle) * r]); cavity.rotation.y = angle;
  }
  for (let fin = 0; fin < 7; fin += 1) rotate(box(root, `COMPBIO__C3__KINETIC_CROWN_FIN_${fin + 1}`, [0.15, 1.7, 0.8], fin % 2 ? m.titanium : m.iridescent, [3.5 + (fin - 3) * 0.32, 13.3 + (fin % 2) * 0.2, 0], false, [0, 0, (fin - 3) * 0.08]), 0.012 + fin * 0.001, 'y');
  return root;
}

function createPangenome(_record: ComputationalBiologyBuildingProgram, m: ComputationalBiologyMaterials) {
  const root = new THREE.Group(); root.name = 'COMPBIO__C4__PANGENOME_MERIDIAN';
  const bars = [
    [0, 0, 0, 17.5, 2.4, 1.45, -0.09], [0.2, 2.0, 0, 16.0, 3.5, 1.2, -0.03], [-0.2, -2.1, 0, 18.5, 4.6, 1.3, 0.04], [0.4, 4.0, 0.5, 14.8, 5.5, 1.05, 0.11], [-0.5, -4.0, 0.7, 15.5, 6.2, 1.0, -0.13],
  ] as const;
  bars.forEach(([x, z, lift, length, height, depth, yaw], bar) => {
    box(root, `COMPBIO__C4__GENOME_GRAPH_BAR_${bar + 1}`, [length, height, depth], bar % 2 ? m.concrete : m.ceramic, [x, lift + height * 0.5, z], true, [0, yaw, 0]);
    for (let band = 0; band < 12; band += 1) {
      const px = -length * 0.43 + band * length * 0.078; const branch = band > 4 && band < 9 ? (bar % 2 ? 0.28 : -0.24) : 0;
      pulse(box(root, `COMPBIO__C4__ALTERNATIVE_FACADE_PATH_${bar + 1}_${band + 1}`, [length * 0.055, 0.18, 0.07], band % 5 === 0 ? m.violet.clone() : m.darkGlass, [px, lift + 1.0 + (band % Math.max(2, Math.floor(height))) * 0.48 + branch, z + depth * 0.53], false, [0, yaw, branch * 0.05]), 0.007 + bar * 0.0005, band * 0.29 + bar);
    }
  });
  const junctions = [
    [new THREE.Vector3(-3.8, 3.2, -4.0), new THREE.Vector3(-3.2, 3.2, 4.0)],
    [new THREE.Vector3(0, 4.5, -2.1), new THREE.Vector3(0.4, 4.5, 4.0)],
    [new THREE.Vector3(4.2, 5.5, -4.0), new THREE.Vector3(4.5, 5.5, 2.0)],
  ] as const;
  junctions.forEach(([start, end], index) => slabBetween(root, `COMPBIO__C4__ELEVATED_GRAPH_JUNCTION_${index + 1}`, start, end, 0.72, 0.42, index === 1 ? m.photoGlass : m.graphite));
  cylinder(root, 'COMPBIO__C4__BRANCHING_GRAPH_JUNCTION_PIER', 1.15, 4.0, m.concrete, [0, 2.0, 0], true, 8);
  for (let entrance = 0; entrance < 5; entrance += 1) box(root, `COMPBIO__C4__EQUIVALENT_PUBLIC_ENTRANCE_${entrance + 1}`, [1.25 + entrance * 0.12, 1.8, 0.18], entrance % 2 ? m.titanium : m.darkGlass, [-7.2 + entrance * 3.6, 1.2 + entrance * 0.65, 4.55 - entrance * 1.9], true, [0, (entrance - 2) * 0.07, 0]);
  const courier = Array.from({ length: 17 }, (_, index) => new THREE.Vector3(-8 + index, 4.0 + Math.sin(index * 0.5) * 0.12, -5.0 + index * 0.08));
  courier.slice(1).forEach((point, index) => pipe(root, `COMPBIO__C4__TRANSLUCENT_COURIER_TUBE_${index + 1}`, courier[index], point, 0.14, m.photoGlass));
  for (let capsule = 0; capsule < 4; capsule += 1) signalTravel(ellipsoid(root, `COMPBIO__C4__AUTONOMOUS_COURIER_CAPSULE_${capsule + 1}`, [0.36, 0.16, 0.16], m.graphite, [-7 + capsule * 3.8, 4.0, -4.9]), 'x', 7.5, 0.005 + capsule * 0.0004, capsule * 0.22);
  return root;
}

function createMorphospace(_record: ComputationalBiologyBuildingProgram, m: ComputationalBiologyMaterials) {
  const root = new THREE.Group(); root.name = 'COMPBIO__C5__MORPHOSPACE_ATLAS';
  const plates = [
    [-0.8, 0, 19.6, 10.5, 0.65, -0.06], [0.6, -0.45, 18.4, 11.4, 1.45, 0.04], [-1.0, 0.55, 20.4, 9.7, 2.4, -0.025],
    [1.15, -0.4, 17.8, 10.9, 3.45, 0.055], [-0.35, 0.75, 16.2, 9.4, 4.55, -0.08], [1.25, 0.25, 14.5, 8.2, 5.65, 0.07],
  ] as const;
  plates.forEach(([x, z, width, depth, y, yaw], plate) => {
    box(root, `COMPBIO__C5__OFFSET_TISSUE_SECTION_PLATE_${plate + 1}`, [width, 0.55, depth], plate % 2 ? m.concrete : m.ceramic, [x, y + 0.45, z], true, [0, yaw, 0]);
    box(root, `COMPBIO__C5__DARK_SECTION_GLASS_SEAM_${plate + 1}`, [width * 0.9, 0.18, depth * 0.94], m.darkGlass, [x, y + 0.77, z], false, [0, yaw, 0]);
    for (let cell = 0; cell < 12; cell += 1) {
      const angle = cell / 12 * Math.PI * 2; const px = x + Math.cos(angle) * width * 0.48; const pz = z + Math.sin(angle) * depth * 0.48;
      const relief = cylinder(root, `COMPBIO__C5__CELLULAR_RELIEF_PANEL_${plate + 1}_${cell + 1}`, 0.42 + (cell % 4) * 0.09, 0.12 + (cell % 3) * 0.04, cell % 5 === 0 ? m.photoGlass : m.ceramic, [px, y + 0.78, pz], false, cell % 3 === 0 ? 8 : 16, [Math.PI / 2, 0, -angle]);
      relief.scale.x *= 1.3;
      if (cell % 4 === 0) pulse(ellipsoid(root, `COMPBIO__C5__NEIGHBORHOOD_LENS_${plate + 1}_${cell + 1}`, [0.09, 0.09, 0.09], m.cyan.clone(), [px, y + 0.82, pz]), 0.007, plate + cell * 0.31);
    }
  });
  box(root, 'COMPBIO__C5__SECTION_BREAK_CLEFT', [4.2, 3.6, 8.7], m.darkGlass, [-1.0, 2.45, 4.5], true);
  box(root, 'COMPBIO__C5__DEEPEST_SECTION_THRESHOLD', [2.2, 2.2, 0.18], m.darkGlass, [-1.0, 1.4, 5.55], true);
  for (let vector = 0; vector < 24; vector += 1) {
    const x = -9.0 + (vector % 8) * 2.5; const z = -4.6 + Math.floor(vector / 8) * 1.3; const start = new THREE.Vector3(x, 0.65, z); const end = new THREE.Vector3(x + ((vector % 3) - 1) * 0.8, 2.2 + (vector % 6) * 0.7, z - 0.6);
    pipe(root, `COMPBIO__C5__MECHANICAL_FORCE_VECTOR_${vector + 1}`, start, end, vector % 5 === 0 ? 0.075 : 0.035, vector % 4 === 0 ? m.iridescent : m.titanium);
    if (vector % 4 === 0) cylinder(root, `COMPBIO__C5__FORCE_ATTACHMENT_PLATE_${vector + 1}`, 0.55, 0.08, m.iridescent, end.toArray() as [number, number, number], false, 16, [Math.PI / 2, 0, 0]);
  }
  const contour = Array.from({ length: 28 }, (_, index) => {
    const angle = index / 27 * Math.PI * 1.78 - Math.PI * 0.88; const radiusX = 10.5 + Math.sin(index * 0.9) * 0.35; const radiusZ = 5.9 + Math.cos(index * 0.7) * 0.25;
    return new THREE.Vector3(Math.cos(angle) * radiusX, 0.55 + index * 0.18, Math.sin(angle) * radiusZ);
  });
  contour.slice(1).forEach((point, index) => slabBetween(root, `COMPBIO__C5__CONTOUR_PROMENADE_SEGMENT_${index + 1}`, contour[index], point, 0.72, 0.12, m.palePaving));
  for (let dome = 0; dome < 5; dome += 1) {
    const imaging = ellipsoid(root, `COMPBIO__C5__ROOF_IMAGING_DOME_${dome + 1}`, [0.72 + dome * 0.08, 0.46, 0.72 + dome * 0.08], m.ceramic, [-5.8 + dome * 2.8, 6.4 + (dome % 2) * 0.35, -1.8 + (dome % 3) * 1.8]); imaging.userData.navObstacle = false;
    box(root, `COMPBIO__C5__IMAGING_DOME_APERTURE_${dome + 1}`, [0.25, 0.18, 0.08], m.darkGlass, [-5.8 + dome * 2.8, 6.48 + (dome % 2) * 0.35, -1.05 + (dome % 3) * 1.8]);
  }
  return root;
}

function createRegula(_record: ComputationalBiologyBuildingProgram, m: ComputationalBiologyMaterials) {
  const root = new THREE.Group(); root.name = 'COMPBIO__C6__REGULA_LOOM';
  box(root, 'COMPBIO__C6__SEQUENCE_PLINTH', [22.8, 3.1, 6.6], m.graphite, [0, 1.55, 0], true);
  for (let sequence = 0; sequence < 36; sequence += 1) {
    const x = -10.8 + sequence * 0.62; const y = 0.65 + (sequence % 4) * 0.52;
    box(root, `COMPBIO__C6__SEQUENCE_BLOCK_${sequence + 1}`, [0.44, 0.12, 0.08], sequence % 7 === 0 ? m.amber : m.darkGlass, [x, y, 3.35]);
  }
  const towers = [{ x: -7.4, h: 6.9, density: 0 }, { x: 0, h: 8.3, density: 1 }, { x: 7.5, h: 9.8, density: 2 }];
  towers.forEach(({ x, h, density }, tower) => {
    box(root, `COMPBIO__C6__CONTEXT_CORE_${tower + 1}`, [2.2, h, 3.6], m.photoGlass, [x, 3.1 + h * 0.5, 0], true);
    for (let strip = 0; strip < 28; strip += 1) {
      const side = strip % 2 ? -1 : 1; const local = Math.floor(strip / 2); const y = 3.5 + local * h / 15; const rotation = tower === 2 ? local / 14 * Math.PI / 2 : tower === 0 ? 0 : (local % 5 - 2) * 0.1;
      box(root, `COMPBIO__C6__CONTEXT_VEIL_STRIP_${tower + 1}_${strip + 1}`, [0.08, 0.44 + density * 0.04, 3.95], strip % 7 === 0 ? m.iridescent : m.titanium, [x + side * 1.16, y, 0], false, [rotation * 0.2, 0, rotation]);
    }
    for (let knot = 0; knot < 5; knot += 1) pulse(ellipsoid(root, `COMPBIO__C6__REGULATORY_KNOT_${tower + 1}_${knot + 1}`, [0.18, 0.18, 0.18], knot % 2 ? m.violet.clone() : m.cyan.clone(), [x + (knot % 2 ? -1.2 : 1.2), 4.0 + knot * h / 6, (knot % 3 - 1) * 1.2]), 0.006 + tower * 0.001, knot * 0.6 + tower);
  });
  slabBetween(root, 'COMPBIO__C6__PRIMARY_ENHANCER_BRIDGE', new THREE.Vector3(-6.4, 8.1, 0), new THREE.Vector3(-1.1, 8.9, 0.25), 0.68, 0.34, m.iridescent);
  slabBetween(root, 'COMPBIO__C6__SECONDARY_ENHANCER_BRIDGE', new THREE.Vector3(1.1, 7.2, -0.4), new THREE.Vector3(7.0, 8.2, 0.4), 0.54, 0.3, m.photoGlass);
  pipe(root, 'COMPBIO__C6__ENHANCER_TENSION_CABLE_1', new THREE.Vector3(-5.4, 8.6, 0), new THREE.Vector3(-4.5, 11.0, 0), 0.035, m.titanium);
  pipe(root, 'COMPBIO__C6__ENHANCER_TENSION_CABLE_2', new THREE.Vector3(4.3, 7.7, 0), new THREE.Vector3(4.8, 10.7, 0), 0.035, m.titanium);
  box(root, 'COMPBIO__C6__CENTRAL_REGULATORY_ENTRANCE', [2.5, 2.4, 0.18], m.darkGlass, [0, 1.5, 3.4], true);
  pulse(box(root, 'COMPBIO__C6__HUNDRED_METRE_APPROACH_LIGHT', [0.06, 0.04, 9.8], m.cool.clone(), [0, 0.08, 8.0]), 0.006, 0.4);
  for (let pair = 0; pair < 12; pair += 1) {
    const x = -9.5 + pair * 1.7; const z = 5.0 + (pair % 3) * 0.85;
    cylinder(root, `COMPBIO__C6__DISTANT_REGULATORY_OBJECT_${pair + 1}`, 0.28 + (pair % 4) * 0.09, 0.5, pair % 5 === 0 ? m.water : m.basalt, [x, 0.3, z], false, 8);
    pipe(root, `COMPBIO__C6__LONG_DISTANCE_PAIRING_${pair + 1}`, new THREE.Vector3(x, 0.12, z), new THREE.Vector3(x + (pair % 2 ? 2.2 : -2.2), 0.12, z + 2.2), 0.018, m.titanium);
  }
  return root;
}

function createImmunome(_record: ComputationalBiologyBuildingProgram, m: ComputationalBiologyMaterials) {
  const root = new THREE.Group(); root.name = 'COMPBIO__C7__IMMUNOME_EXCHANGE';
  ellipse(root, 'COMPBIO__C7__RECOGNITION_COURT', [16.2, 11.8], 0.08, m.darkPaving, [0, 0.06, 0]);
  for (const side of [-1, 1]) {
    for (let segment = 0; segment < 16; segment += 1) {
      const t = segment / 15; const angle = -1.02 + t * 2.04; const radius = side < 0 ? 6.6 : 7.2; const x = side * (2.05 + Math.cos(angle) * radius * 0.48); const z = Math.sin(angle) * radius; const height = side < 0 ? 4.2 + t * 3.2 : 4.5 + Math.sin(t * Math.PI) * 1.7;
      box(root, `COMPBIO__C7__${side < 0 ? 'CONCAVE' : 'CONVEX'}_CRESCENT_SEGMENT_${segment + 1}`, [1.4, height, 1.2], segment % 4 === 0 ? m.photoGlass : m.ceramic, [x, 0.25 + height * 0.5, z], true, [0, -angle * 0.52 + (side < 0 ? 0.08 : -0.08), side * 0.02]);
      for (let facet = 0; facet < 3; facet += 1) {
        const projection = ((segment + facet) % 5 === 0 ? 0.24 : 0.05) * side;
        box(root, `COMPBIO__C7__RECOGNITION_FACET_${side < 0 ? 'EAST' : 'WEST'}_${segment + 1}_${facet + 1}`, [0.42, 0.48, 0.16], (segment + facet) % 7 === 0 ? m.cool : m.iridescent, [x - side * (0.74 + projection), 1.1 + facet * Math.max(0.8, height / 4), z], false, [0, -angle * 0.52, (facet - 1) * 0.08]);
      }
    }
  }
  box(root, 'COMPBIO__C7__COMPRESSED_RECOGNITION_THRESHOLD', [1.4, 3.2, 0.22], m.darkGlass, [0, 1.8, 0], true);
  const canopyNodes: THREE.Vector3[] = [];
  for (let node = 0; node < 12; node += 1) {
    const point = new THREE.Vector3(-2.1 + (node % 4) * 1.4, 4.3 + Math.floor(node / 4) * 0.35, -1.5 + Math.floor(node / 4) * 1.5); canopyNodes.push(point);
    ellipsoid(root, `COMPBIO__C7__NONIDENTICAL_CANOPY_JOINT_${node + 1}`, [0.18 + (node % 3) * 0.05, 0.12, 0.18], node % 4 === 0 ? m.violet : m.titanium, point.toArray() as [number, number, number]);
    if (node > 0 && node % 4 !== 0) pipe(root, `COMPBIO__C7__INTERLOCKING_CANOPY_MEMBER_${node}`, canopyNodes[node - 1], point, 0.06, m.titanium);
  }
  box(root, 'COMPBIO__C7__REPERTOIRE_FIN_CORE', [2.4, 10.6, 4.3], m.graphite, [0, 5.3, -5.2], true);
  for (let tile = 0; tile < 48; tile += 1) {
    const col = tile % 6; const row = Math.floor(tile / 6); const x = -1.05 + col * 0.42; const y = 0.85 + row * 1.18;
    pulse(box(root, `COMPBIO__C7__REPERTOIRE_TILE_${tile + 1}`, [0.3 + (tile % 3) * 0.035, 0.72, 0.08], tile % 9 === 0 ? m.cyan.clone() : m.ceramic, [x, y, -3.02]), 0.006 + (tile % 4) * 0.0005, tile * 0.14);
  }
  for (let blade = 0; blade < 5; blade += 1) box(root, `COMPBIO__C7__REPERTOIRE_SENSOR_BLADE_${blade + 1}`, [0.22, 2.1 + blade * 0.18, 0.7], blade % 2 ? m.titanium : m.ceramic, [-0.88 + blade * 0.44, 11.1 + blade * 0.08, -5.2], false, [0, 0, (blade - 2) * 0.08]);
  ellipse(root, 'COMPBIO__C7__EAST_RECOGNITION_POOL', [3.6, 1.6], 0.06, m.water, [-5.6, 0.07, 5.1]);
  ellipse(root, 'COMPBIO__C7__WEST_RECOGNITION_POOL', [3.6, 1.6], 0.06, m.water, [5.6, 0.07, -5.1]);
  for (let pair = 0; pair < 14; pair += 1) {
    const angle = pair / 14 * Math.PI * 2; const r = 7.8 + (pair % 2) * 0.6; const x = Math.cos(angle) * r; const z = Math.sin(angle) * r;
    ellipsoid(root, `COMPBIO__C7__RECOGNITION_GARDEN_PROJECTION_${pair + 1}`, [0.28, 0.42 + (pair % 4) * 0.08, 0.28], pair % 3 === 0 ? m.moss : m.concrete, [x, 0.45, z]);
    torus(root, `COMPBIO__C7__RECOGNITION_GARDEN_POCKET_${pair + 1}`, 0.34 + (pair % 3) * 0.05, 0.08, m.basalt, [x + Math.cos(angle + 0.6) * 0.8, 0.16, z + Math.sin(angle + 0.6) * 0.8]);
  }
  return root;
}

function createKinetica(_record: ComputationalBiologyBuildingProgram, m: ComputationalBiologyMaterials) {
  const root = new THREE.Group(); root.name = 'COMPBIO__C8__KINETICA_DYNAMICS_ARRAY';
  taperedCylinder(root, 'COMPBIO__C8__THIRTY_SIX_PLANE_SIMULATION_CORE', 9.6, 6.4, 7.2, 12, m.graphite, [0, 3.6, 0], true);
  for (let plane = 0; plane < 36; plane += 1) {
    const angle = plane / 36 * Math.PI * 2; const y = 0.7 + (plane % 9) * 0.72; const radius = 3.65 + Math.sin(y * 1.3) * 0.42;
    box(root, `COMPBIO__C8__FACETED_CORE_PLANE_${plane + 1}`, [0.7 + (plane % 4) * 0.12, 0.58, 0.1], plane % 5 === 0 ? m.darkGlass : plane % 3 === 0 ? m.concrete : m.graphite, [Math.cos(angle) * radius, y, Math.sin(angle) * radius], false, [0, -angle, (plane % 5 - 2) * 0.025]);
  }
  for (let ribbon = 0; ribbon < 3; ribbon += 1) {
    const points = Array.from({ length: 30 }, (_, index) => {
      const t = index / 29; const angle = t * Math.PI * (1.45 + ribbon * 0.32) + ribbon * 1.75; const radius = 5.0 + Math.sin(t * Math.PI * 3 + ribbon) * 1.0;
      return new THREE.Vector3(Math.cos(angle) * radius, 0.7 + t * (ribbon === 0 ? 8.1 : ribbon === 1 ? 5.4 : 2.2) + Math.sin(t * Math.PI * 2) * 0.7, Math.sin(angle) * radius);
    });
    points.slice(1).forEach((point, index) => {
      slabBetween(root, `COMPBIO__C8__WARPED_TRAJECTORY_RIBBON_${ribbon + 1}_${index + 1}`, points[index], point, 0.55 + Math.sin(index / 29 * Math.PI) * 0.42, 0.18, ribbon === 1 ? m.ceramic : m.titanium);
      if (index % 3 === 0) pulse(ellipsoid(root, `COMPBIO__C8__TRAJECTORY_LIGHT_POINT_${ribbon + 1}_${index + 1}`, [0.11, 0.11, 0.11], ribbon === 2 ? m.violet.clone() : m.cyan.clone(), point.toArray() as [number, number, number]), 0.006 + ribbon * 0.001, index * 0.27 + ribbon);
    });
  }
  box(root, 'COMPBIO__C8__TRIANGULAR_ENTRY_RECESS', [3.2, 2.7, 0.3], m.ceramic, [0, 1.7, 4.0], true, [0, 0, Math.PI / 12]);
  for (let trajectory = 0; trajectory < 24; trajectory += 1) {
    const x = -7.0 + trajectory * 0.6; const z = 5.1 + Math.sin(trajectory * 0.8) * 1.5;
    pipe(root, `COMPBIO__C8__PLAZA_TRAJECTORY_LINE_${trajectory + 1}`, new THREE.Vector3(x, 0.09, z + 4.0), new THREE.Vector3(x * 0.28, 0.09, 3.7), 0.018, trajectory % 6 === 0 ? m.amber : m.titanium);
  }
  for (let fin = 0; fin < 18; fin += 1) {
    const x = -6.5 + fin * 0.75; const height = 1.2 + (fin % 6) * 0.33;
    box(root, `COMPBIO__C8__COOLING_CASCADE_FIN_${fin + 1}`, [0.18, height, 1.4], fin % 4 === 0 ? m.iridescent : m.graphite, [x, height * 0.5, -5.0]);
    if (fin % 3 === 0) ellipse(root, `COMPBIO__C8__STEPPED_COOLING_BASIN_${fin / 3 + 1}`, [2.0, 1.4], 0.08, m.water, [x, 0.07, -6.2 - (fin % 2) * 0.8]);
  }
  return root;
}

function createAion(_record: ComputationalBiologyBuildingProgram, m: ComputationalBiologyMaterials) {
  const root = new THREE.Group(); root.name = 'COMPBIO__C9__AION_EVOLUTION_ENGINE';
  for (let layer = 0; layer < 12; layer += 1) {
    const y = 0.4 + layer * 0.7; const height = 0.66; const width = 17.8 - layer * 0.28; const leftWidth = width * (0.46 + (layer % 3) * 0.015); const rightWidth = width - leftWidth - (0.55 + layer * 0.08);
    const material = layer < 4 ? m.basalt : layer < 9 ? m.graphite : m.iridescent;
    box(root, `COMPBIO__C9__EVOLUTIONARY_STRATUM_LEFT_${layer + 1}`, [leftWidth, height, 9.8 - layer * 0.18], material, [-width * 0.5 + leftWidth * 0.5, y, 0], true, [0, 0, -0.004 * layer]);
    box(root, `COMPBIO__C9__EVOLUTIONARY_STRATUM_RIGHT_${layer + 1}`, [rightWidth, height, 9.8 - layer * 0.18], material, [width * 0.5 - rightWidth * 0.5, y + layer * 0.03, 0], true, [0, 0, 0.006 * layer]);
    if (layer % 2 === 0) pulse(box(root, `COMPBIO__C9__BRANCHING_WINDOW_STRATUM_${layer + 1}`, [leftWidth * 0.7, 0.11, 0.08], layer < 6 ? m.darkGlass : m.violet.clone(), [-width * 0.25, y + 0.08, 4.95 - layer * 0.09]), 0.0045, layer * 0.48);
  }
  for (let branch = 0; branch < 3; branch += 1) {
    const start = new THREE.Vector3(0, 4.2, 0); const end = new THREE.Vector3((branch - 1) * 3.6, 9.8, (branch % 2 ? 0.8 : -0.8));
    pipe(root, `COMPBIO__C9__PHYLOGENETIC_CANYON_BRANCH_${branch + 1}`, start, end, 0.22, m.darkGlass);
    pulse(pipe(root, `COMPBIO__C9__EVOLUTIONARY_LIGHT_BRANCH_${branch + 1}`, start.clone().add(new THREE.Vector3(0, 0, 0.25)), end.clone().add(new THREE.Vector3(0, 0, 0.25)), 0.05, branch === 1 ? m.cyan.clone() : m.violet.clone()), 0.004 + branch * 0.0005, branch * 1.2);
  }
  slabBetween(root, 'COMPBIO__C9__HEAVY_CERAMIC_CANYON_BRIDGE', new THREE.Vector3(-2.6, 3.4, 0), new THREE.Vector3(2.7, 3.4, 0), 1.0, 0.5, m.ceramic);
  slabBetween(root, 'COMPBIO__C9__TRANSPARENT_CANYON_BRIDGE', new THREE.Vector3(-2.2, 5.5, 0), new THREE.Vector3(2.4, 5.5, 0), 0.55, 0.28, m.photoGlass);
  slabBetween(root, 'COMPBIO__C9__BRANCHING_TRUSS_CANYON_BRIDGE', new THREE.Vector3(-3.2, 7.3, -0.4), new THREE.Vector3(3.0, 7.3, 0.4), 0.42, 0.22, m.titanium);
  box(root, 'COMPBIO__C9__PHYLOGENETIC_ROOT_ENTRANCE', [2.2, 3.1, 0.2], m.darkGlass, [0, 1.8, 4.9], true);
  const rampPoints = Array.from({ length: 18 }, (_, index) => new THREE.Vector3(0, 0.05 + index * 0.015, 14.5 - index * 0.54));
  rampPoints.slice(1).forEach((point, index) => slabBetween(root, `COMPBIO__C9__DEEP_TIME_RAMP_${index + 1}`, rampPoints[index], point, 3.0 - index * 0.045, 0.08, index < 6 ? m.basalt : index < 12 ? m.darkPaving : m.palePaving));
  const habitats = [m.water, m.moss, m.iridescent, m.grass, m.water, m.basalt];
  for (let habitat = 0; habitat < 6; habitat += 1) {
    box(root, `COMPBIO__C9__METAGENOMIC_TERRACE_${habitat + 1}`, [2.4, 0.16, 1.5], habitats[habitat], [-7.0 + habitat * 2.8, 0.11 + habitat * 0.04, -5.8]);
    cylinder(root, `COMPBIO__C9__ENVIRONMENTAL_SENSOR_MAST_${habitat + 1}`, 0.08, 1.25, m.titanium, [-7.0 + habitat * 2.8, 0.75, -5.8], false, 8);
  }
  for (let tower = 0; tower < 18; tower += 1) {
    const angle = tower * 2.399963; const radius = 0.5 * Math.sqrt(tower); const height = 0.6 + (tower % 7) * 0.16;
    const reef = taperedCylinder(root, `COMPBIO__C9__THERMAL_REEF_TOWER_${tower + 1}`, 0.55 + (tower % 3) * 0.12, 0.3, height, 8, tower % 4 === 0 ? m.ceramic : m.concrete, [Math.cos(angle) * radius + 5.8, height * 0.5, Math.sin(angle) * radius - 7.1]);
    for (let pore = 0; pore < 3; pore += 1) torus(root, `COMPBIO__C9__THERMAL_REEF_PORE_${tower + 1}_${pore + 1}`, 0.08 + pore * 0.02, 0.025, m.basalt, [reef.position.x, 0.25 + pore * height / 4, reef.position.z + 0.28], [0, 0, 0]);
  }
  return root;
}

function createContinuum(_record: ComputationalBiologyBuildingProgram, m: ComputationalBiologyMaterials) {
  const root = new THREE.Group(); root.name = 'COMPBIO__C10__CONTINUUM_BIOTWIN_OBSERVATORY';
  box(root, 'COMPBIO__C10__MOLECULAR_PLINTH', [16.8, 0.7, 10.4], m.basalt, [0, 0.35, 0], true, [0, -0.08, 0]);
  for (let module = 0; module < 48; module += 1) {
    const col = module % 12; const row = Math.floor(module / 12); const x = -7.7 + col * 1.4; const z = -4.3 + row * 2.7;
    pulse(box(root, `COMPBIO__C10__MOLECULAR_PLINTH_MODULE_${module + 1}`, [0.56, 0.05, 0.42], module % 9 === 0 ? m.cyan.clone() : module % 5 === 0 ? m.titanium : m.darkGlass, [x, 0.72, z]), 0.006, module * 0.15);
  }
  const ringRadius = 5.8;
  for (let segment = 0; segment < 28; segment += 1) {
    const angle = -Math.PI * 0.78 + segment / 27 * Math.PI * 1.56; const x = Math.cos(angle) * ringRadius; const z = Math.sin(angle) * ringRadius * 0.72;
    box(root, `COMPBIO__C10__INCOMPLETE_CELLULAR_RING_${segment + 1}`, [0.85, 2.1 + (segment % 4) * 0.15, 0.62], segment % 5 === 0 ? m.photoGlass : m.ceramic, [x, 2.0, z], true, [0, -angle, 0]);
    if (segment % 4 === 0) pulse(ellipsoid(root, `COMPBIO__C10__CELLULAR_NEIGHBORHOOD_SIGNAL_${segment + 1}`, [0.13, 0.13, 0.13], m.violet.clone(), [x, 2.2 + (segment % 3) * 0.35, z]), 0.006, segment * 0.32);
  }
  const terraces = [
    { p: [-4.4, 5.1, 0.6] as const, s: [8.4, 0.55, 4.6] as const, r: -0.08 },
    { p: [3.7, 6.6, -1.0] as const, s: [7.2, 0.55, 4.1] as const, r: 0.13 },
    { p: [0.4, 8.1, 2.2] as const, s: [8.8, 0.55, 3.4] as const, r: -0.16 },
  ];
  terraces.forEach(({ p, s, r }, terrace) => {
    box(root, `COMPBIO__C10__TISSUE_FRAME_TERRACE_${terrace + 1}`, s, terrace === 1 ? m.concrete : m.ceramic, p, true, [0, r, 0]);
    box(root, `COMPBIO__C10__TERRACE_ENVIRONMENT_${terrace + 1}`, [s[0] * 0.55, 0.12, s[2] * 0.28], terrace === 0 ? m.moss : terrace === 1 ? m.water : m.grass, [p[0], p[1] + 0.35, p[2]]);
  });
  box(root, 'COMPBIO__C10__FACETED_SYSTEMS_TOWER', [4.6, 11.2, 4.4], m.graphite, [0, 5.95, 0], true, [0, 0.11, 0]);
  for (let band = 0; band < 18; band += 1) {
    const y = 0.9 + band * 0.59; const drift = Math.sin(band * 0.74) * 0.36;
    pulse(box(root, `COMPBIO__C10__TIME_SERIES_FACADE_BAND_${band + 1}`, [4.75, 0.18, 0.08], band % 4 === 0 ? m.photoGlass.clone() : band % 5 === 0 ? m.violet.clone() : m.darkGlass, [drift, y, 2.25], false, [0, 0.11, Math.sin(band * 0.4) * 0.03]), 0.005 + (band % 3) * 0.0004, band * 0.23);
  }
  box(root, 'COMPBIO__C10__REFLECTED_TWIN_TOWER_RECESS', [1.15, 10.4, 0.18], m.darkGlass, [1.2, 5.8, -2.25], false, [0, 0.11, 0]);
  for (let bridge = 0; bridge < 8; bridge += 1) {
    const angle = bridge / 8 * Math.PI * 2 + 0.2; const start = new THREE.Vector3(Math.cos(angle) * 2.2, 4.0 + (bridge % 3) * 1.4, Math.sin(angle) * 2.2); const end = new THREE.Vector3(Math.cos(angle + 0.25) * 5.4, 3.2 + (bridge % 3) * 1.6, Math.sin(angle + 0.25) * 4.2);
    pipe(root, `COMPBIO__C10__SELECTIVE_SCALE_BRIDGE_${bridge + 1}`, start, end, 0.11, bridge % 3 === 0 ? m.iridescent : m.titanium);
    pulse(ellipsoid(root, `COMPBIO__C10__SCALE_ATTACHMENT_LIGHT_${bridge + 1}`, [0.13, 0.13, 0.13], bridge % 2 ? m.cyan.clone() : m.cool.clone(), end.toArray() as [number, number, number]), 0.006, bridge * 0.52);
  }
  box(root, 'COMPBIO__C10__TWIN_GATE_POLISHED_WALL', [0.4, 3.2, 3.0], m.basalt, [-1.3, 1.9, 5.0], true);
  box(root, 'COMPBIO__C10__TWIN_GATE_REFLECTIVE_WALL', [0.4, 3.2, 3.0], m.darkGlass, [1.3, 1.9, 5.0], true);
  box(root, 'COMPBIO__C10__OFFSET_CALIBRATION_FRAME', [3.3, 0.25, 2.1], m.titanium, [0.25, 3.6, 5.0]);
  box(root, 'COMPBIO__C10__STATIC_CALIBRATION_PLAZA', [6.8, 0.08, 4.2], m.darkPaving, [-3.5, 0.08, 7.0]);
  box(root, 'COMPBIO__C10__RESPONSIVE_CALIBRATION_PLAZA', [6.8, 0.08, 4.2], m.water, [3.5, 0.08, 7.0]);
  for (let crown = 0; crown < 9; crown += 1) box(root, `COMPBIO__C10__SYSTEMS_SENSOR_CROWN_${crown + 1}`, [0.12, 1.4 + (crown % 4) * 0.22, 0.7], crown % 3 === 0 ? m.photoGlass : m.titanium, [-1.8 + crown * 0.45, 11.9 + (crown % 2) * 0.2, 0], false, [0, 0, (crown - 4) * 0.035]);
  return root;
}

function assignBuildingMetadata(root: THREE.Group, record: ComputationalBiologyBuildingProgram) {
  root.userData.exteriorProgram = true;
  root.userData.buildingCode = record.code;
  root.userData.buildingName = record.name;
  root.userData.buildingSubtitle = record.subtitle;
  root.userData.purpose = record.purpose;
  root.userData.footprintMetres = [...record.footprintMetres];
  root.userData.heightMetres = record.heightMetres;
  root.userData.placementZone = record.placementZone;
  root.userData.exteriorMotif = record.exteriorMotif;
  root.userData.navObstacle = true;
  root.traverse((object) => { object.userData.selectableId = DISTRICT_ID; object.userData.districtId = DISTRICT_ID; });
  return root;
}

function createBuilding(record: ComputationalBiologyBuildingProgram, materials: ComputationalBiologyMaterials) {
  const factories: Record<ComputationalBiologyBuildingForm, (record: ComputationalBiologyBuildingProgram, materials: ComputationalBiologyMaterials) => THREE.Group> = {
    cellularis: createCellularis,
    causa: createCausa,
    proteus: createProteus,
    pangenome: createPangenome,
    morphospace: createMorphospace,
    regula: createRegula,
    immunome: createImmunome,
    kinetica: createKinetica,
    aion: createAion,
    continuum: createContinuum,
  };
  return assignBuildingMetadata(factories[record.form](record, materials), record);
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radialMargin = 8.6; const angularMargin = (sector.endAngle - sector.startAngle) * 0.055;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT);
  const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
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
  const ribbon = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), material), name); ribbon.userData.walkable = walkable; ribbon.userData.navObstacle = false; ribbon.userData.computationalBiologyRoute = true; ribbon.receiveShadow = true; parent.add(ribbon); return ribbon;
}

function offsetPath(points: readonly THREE.Vector3[], offset: number, modulation: number, frequency: number) {
  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x); const t = index / Math.max(1, points.length - 1);
    return point.clone().addScaledVector(normal, offset + Math.sin(t * Math.PI * frequency) * modulation).setY(FLOOR_Y + 0.026);
  });
}

function addDistrictInfrastructure(district: THREE.Group, definition: DistrictDefinition, m: ComputationalBiologyMaterials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'COMPBIO__DISTRICT_INFERENCE_INFRASTRUCTURE';
  const inferenceSpine = districtArc(definition, 0.5, 0.02, 0.98, 128);
  addRibbon(infrastructure, 'COMPBIO__INFERENCE_SPINE', inferenceSpine, 3.2, m.palePaving);
  [-0.82, 0, 0.82].forEach((offset, index) => pulse(addRibbon(infrastructure, `COMPBIO__INFERENCE_SPINE_SIGNAL_${index + 1}`, offsetPath(inferenceSpine, offset, 0.06 + index * 0.02, 5 + index), 0.045, [m.cool, m.cyan, m.violet][index].clone(), false), 0.006 + index * 0.0008, index * 0.72));
  [0.08, 0.29, 0.5, 0.71, 0.92].forEach((angularT, index) => {
    const branch = districtSpine(definition, angularT, 0.03, 0.97, 64);
    const fragmented = offsetPath(branch, 0, index < 2 ? 0 : 0.24 + index * 0.05, 2 + index);
    addRibbon(infrastructure, `COMPBIO__BRANCHING_INFERENCE_PATH_${index + 1}`, fragmented, index < 2 ? 1.0 : 0.82, index < 2 ? m.darkPaving : m.palePaving);
    pulse(addRibbon(infrastructure, `COMPBIO__BRANCHING_DATA_CONDUIT_${index + 1}`, offsetPath(fragmented, 0, 0.06, 4 + index), 0.035, index % 2 ? m.violet.clone() : m.cyan.clone(), false), 0.007, index * 0.58);
  });
  for (let line = 0; line < 9; line += 1) {
    const a = districtSpine(definition, 0.025 + line * 0.018, 0.08, 0.33, 18);
    addRibbon(infrastructure, `COMPBIO__ROBOTICS_CARTESIAN_GRID_LINE_${line + 1}`, a, 0.18, line % 3 === 0 ? m.palePaving : m.darkPaving);
  }
  const courier = districtArc(definition, 0.92, 0.04, 0.96, 88, FLOOR_Y + 0.42);
  courier.slice(1).forEach((point, index) => pipe(infrastructure, `COMPBIO__AUTONOMOUS_COURIER_TRACK_${index + 1}`, courier[index], point, 0.055, m.titanium));
  for (let carrier = 0; carrier < 6; carrier += 1) {
    const position = courier[8 + carrier * 13]; const capsule = ellipsoid(infrastructure, `COMPBIO__AUTONOMOUS_COURIER_${carrier + 1}`, [0.28, 0.12, 0.14], carrier % 2 ? m.graphite : m.iridescent, position.toArray() as [number, number, number]);
    capsule.userData.animate = 'computational-biology-path-transit'; capsule.userData.path = courier.map((point) => point.toArray()); capsule.userData.speed = 0.0026 + carrier * 0.00015; capsule.userData.phase = carrier / 6;
  }
  for (let sensor = 0; sensor < 18; sensor += 1) {
    const point = pointInDistrict(definition, sensor % 2 ? 0.06 : 0.95, 0.04 + sensor * 0.052);
    cylinder(infrastructure, `COMPBIO__ENVIRONMENTAL_SENSOR_MAST_${sensor + 1}`, 0.08, 1.2 + (sensor % 4) * 0.18, m.titanium, [point.x, 0.62, point.z], false, 8);
    pulse(ellipsoid(infrastructure, `COMPBIO__SENSOR_CALIBRATION_MARKER_${sensor + 1}`, [0.09, 0.09, 0.09], sensor % 5 === 0 ? m.amber.clone() : m.cool.clone(), [point.x, 1.3 + (sensor % 4) * 0.18, point.z]), 0.006, sensor * 0.38);
  }
  district.add(infrastructure); return { infrastructure, inferenceSpine };
}

function addDistrictLandscape(district: THREE.Group, definition: DistrictDefinition, m: ComputationalBiologyMaterials) {
  const landscape = new THREE.Group(); landscape.name = 'COMPBIO__VALIDATION_AND_UNCERTAINTY_LANDSCAPE';
  for (let domain = 0; domain < 36; domain += 1) {
    const radialT = domain % 2 ? 0.04 : 0.96; const angularT = 0.035 + Math.floor(domain / 2) * 0.055; const point = pointInDistrict(definition, radialT, angularT); const size = 0.48 + (domain % 5) * 0.11;
    ellipse(landscape, `COMPBIO__CELLULAR_NEIGHBORHOOD_DOMAIN_${domain + 1}`, [size * 1.6, size], 0.1, domain % 7 === 0 ? m.water : domain % 3 === 0 ? m.moss : m.grass, [point.x, 0.08, point.z], false, domain % 4 === 0 ? 8 : 16);
    if (domain % 6 === 0) box(landscape, `COMPBIO__FRACTURED_UNCERTAINTY_BORDER_${domain + 1}`, [size * 1.7, 0.08, 0.05], m.iridescent, [point.x, 0.15, point.z], false, [0, (domain % 5 - 2) * 0.3, 0]);
  }
  for (let exchanger = 0; exchanger < 10; exchanger += 1) {
    const point = pointInDistrict(definition, 0.94, 0.08 + exchanger * 0.09);
    taperedCylinder(landscape, `COMPBIO__DISTRICT_COOLING_EXCHANGER_${exchanger + 1}`, 0.7, 0.42, 1.0 + (exchanger % 4) * 0.22, 8, exchanger % 3 === 0 ? m.ceramic : m.graphite, [point.x, 0.55, point.z]);
    torus(landscape, `COMPBIO__COOLING_EXCHANGER_RIM_${exchanger + 1}`, 0.26, 0.035, m.cyan, [point.x, 1.0 + (exchanger % 4) * 0.22, point.z]);
  }
  district.add(landscape); return landscape;
}

export function buildComputationalBiologyLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Computational Biology Labs District requires a masterplan sector');
  const materials = createComputationalBiologyMaterials();
  const { infrastructure, inferenceSpine } = addDistrictInfrastructure(district, definition, materials);
  const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = COMPUTATIONAL_BIOLOGY_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials); const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02); building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT };
    district.add(building); return building;
  });
  facilities.forEach((facility, index) => {
    const record = COMPUTATIONAL_BIOLOGY_BUILDING_PROGRAM[index]; const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, Math.min(6.8, record.footprintMetres[1] / 22 + 0.8)); const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const routePoint = inferenceSpine.reduce((closest, point) => point.distanceToSquared(entrance) < closest.distanceToSquared(entrance) ? point : closest, inferenceSpine[0]); const approachPoints = [routePoint.clone(), routePoint.clone().lerp(entrance, 0.48), entrance];
    addRibbon(infrastructure, `COMPBIO__BUILDING_APPROACH_${record.code}`, approachPoints, 0.9, materials.palePaving);
    pulse(addRibbon(infrastructure, `COMPBIO__BUILDING_APPROACH_SIGNAL_${record.code}`, approachPoints.map((point) => point.clone().setY(FLOOR_Y + 0.027)), 0.04, [materials.cool, materials.cyan, materials.violet, materials.amber][index % 4].clone(), false), 0.007, index * 0.47);
  });
  district.userData.computationalBiologyLabsDistrict = {
    identity: 'Computational Biology Labs District',
    architecturalLanguage: 'graph structures, nested scales, changing facade states, branching circulation, folded molecular surfaces, cellular neighborhoods, spatial coordinates, evolutionary strata, and visible validation',
    buildingCount: facilities.length,
    buildings: COMPUTATIONAL_BIOLOGY_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, subtitle: record.subtitle, purpose: record.purpose, placementZone: record.placementZone, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorMotif: record.exteriorMotif })),
    landmarks: { virtualCell: 'Cellularis Nexus', causalArray: 'Causa Array', biomolecularFold: 'Proteus Fold', graphGenome: 'Pangenome Meridian', spatialTissue: 'Morphospace Atlas', regulatoryGrammar: 'Regula Loom', immuneRecognition: 'Immunome Exchange', molecularDynamics: 'Kinetica Dynamics Array', evolutionaryArchive: 'Aion Evolution Engine', digitalTwin: 'Continuum BioTwin Observatory' },
    circulation: { primaryAxis: 'COMPBIO__INFERENCE_SPINE', widthMetres: 32, cartesianGridLines: 9, branchingPaths: 5, exactBuildingApproaches: 10, autonomousCourierTrack: true },
    signatureSystems: { cellularShells: 3, validationBars: 1, causalSlabs: 16, pangenomeBars: 5, tissueSections: 6, contextVeilTowers: 3, recognitionCrescents: 2, trajectoryRibbons: 3, thermalReefTowers: 18, biologicalScales: 4 },
    materials: ['pale mineral ceramic', 'white ultra-high-performance concrete', 'graphite titanium', 'black basalt', 'translucent photovoltaic glass', 'restrained iridescent metal'],
    lighting: ['cool white', 'pale cyan', 'muted violet', 'amber calibration markers'],
    landscape: { validationDomains: 36, districtCoolingExchangers: 10, perturbationPlots: 32, interventionBasins: 48, exposedDataConduits: true },
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: COMPUTATIONAL_BIOLOGY_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: ['Inference Spine', 'Branching Inference Paths', 'District Data Conduits', 'Autonomous Courier Track', 'Validation and Uncertainty Landscape', 'District Cooling Exchangers'],
    realizedFeatureTags: COMPUTATIONAL_BIOLOGY_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 16,
    radialCoverage: 0.94,
    angularCoverage: 0.96,
    exteriorOnly: true,
    inferenceSpineNarrative: true,
  };
}
