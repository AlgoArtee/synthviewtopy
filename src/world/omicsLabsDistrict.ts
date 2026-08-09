import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type OmicsBuildingForm = 'atlas' | 'perturbome' | 'exposome' | 'flux' | 'convergence';

export interface OmicsBuildingProgram {
  code: string;
  name: string;
  subtitle: string;
  purpose: string;
  form: OmicsBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
  continuumStage: string;
}

export const OMICS_BUILDING_PROGRAM: readonly OmicsBuildingProgram[] = [
  { code: 'O1', name: 'The Atlas Loom', subtitle: 'Single-Cell and Spatial Multi-Omics Institute', purpose: 'Single-cell multiomes, spatial molecular mapping, lineage reconstruction, in-situ sequencing, and three-dimensional tissue atlases', form: 'atlas', footprintMetres: [154, 102], heightMetres: 70, radialT: 0.26, angularT: 0.10, placementZone: 'Map gateway at the coordinate-grid threshold', exteriorMotif: 'three asymmetrical tissue ribbons woven around Atlas Court, cut by glass fissures and four breathing cryogenic towers', continuumStage: 'Map' },
  { code: 'O2', name: 'The Perturbome Foundry', subtitle: 'Causal Omics and Functional Screening Complex', purpose: 'CRISPR screens, Perturb-seq, lineage barcoding, combinatorial perturbation, organoid screening, and causal genotype-to-phenotype reconstruction', form: 'perturbome', footprintMetres: [194, 68], heightMetres: 58, radialT: 0.70, angularT: 0.29, placementZone: 'Perturbation and sterile-logistics belt', exteriorMotif: 'replaceable black research cartridges fixed to a silver exoskeleton and cut by the triangular Null Gate', continuumStage: 'Perturb' },
  { code: 'O3', name: 'The Exposome Exchange', subtitle: 'Environmental, Microbiome and Host-Response Observatory', purpose: 'Human and environmental exposomics, microbiome-host interaction, airborne surveillance, wastewater monitoring, and climate-associated molecular response', form: 'exposome', footprintMetres: [136, 124], heightMetres: 61, radialT: 0.29, angularT: 0.49, placementZone: 'Open environmental interface', exteriorMotif: 'an incomplete rising ring with a responsive sampling veil, ecological court, and five tuning-fork intake towers', continuumStage: 'Expose' },
  { code: 'O4', name: 'The Flux Cathedral', subtitle: 'Metabolomics, Lipidomics, Glycomics and Isotope-Tracing Center', purpose: 'Time-resolved metabolomics, lipidomics, glycomics, stable-isotope tracing, flux reconstruction, and mass-spectrometry imaging', form: 'flux', footprintMetres: [132, 124], heightMetres: 112, radialT: 0.70, angularT: 0.69, placementZone: 'Instrument and cryogenic service front', exteriorMotif: 'a tilted hollow analytical ring crossed by smaller trajectories, moving reference loops, and crystalline cooling towers', continuumStage: 'Measure Flux' },
  { code: 'O5', name: 'The Convergence Vault', subtitle: 'Longitudinal Pan-Omics Archive and Biological Digital-Twin Observatory', purpose: 'Pan-omic integration, longitudinal cohorts, biological digital twins, population reference atlases, federated datasets, provenance, and predictive modeling', form: 'convergence', footprintMetres: [182, 118], heightMetres: 64, radialT: 0.30, angularT: 0.94, placementZone: 'Terminal archival ridge', exteriorMotif: 'a partly buried stepped wedge of chronological strata beneath the black Chronome Needle', continuumStage: 'Integrate' },
] as const;

const DISTRICT_ID = 'omics-labs';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_20 = new THREE.CylinderGeometry(0.5, 0.5, 1, 20);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 16, 10);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_X = new THREE.Vector3(1, 0, 0);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

type OmicsMaterials = ReturnType<typeof createOmicsMaterials>;

function districtMaterial(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ name, color, roughness: 0.58, metalness: 0.14, ...options });
}

function createOmicsMaterials() {
  const ivory = districtMaterial('Omics pale ivory cellular ceramic', '#e9e6d9', { roughness: 0.52, metalness: 0.03 });
  const mineral = districtMaterial('Omics pale mineral concrete', '#c8cbc3', { roughness: 0.86, metalness: 0.02 });
  const basalt = districtMaterial('Omics dark geological basalt', '#11171a', { roughness: 0.94, metalness: 0.02 });
  const titaniumBlack = districtMaterial('Omics matte black titanium', '#11161a', { roughness: 0.62, metalness: 0.72 });
  const oxidizedSteel = districtMaterial('Omics oxidized structural steel', '#493f38', { roughness: 0.68, metalness: 0.68 });
  const titanium = districtMaterial('Omics brushed silver titanium', '#9da9ac', { roughness: 0.28, metalness: 0.9 });
  const stainless = districtMaterial('Omics brushed stainless steel', '#bdc5c5', { roughness: 0.24, metalness: 0.94 });
  const whiteUtility = districtMaterial('Omics smooth white utility enclosure', '#e5e8e2', { roughness: 0.37, metalness: 0.08 });
  const darkGlass = districtMaterial('Omics black electrochromic glass', '#0b1a20', { emissive: '#102d35', emissiveIntensity: 0.18, roughness: 0.07, metalness: 0.24, transparent: true, opacity: 0.78, side: THREE.DoubleSide });
  const clearGlass = districtMaterial('Omics transparent sterile sample glass', '#91c7cc', { emissive: '#2d6d72', emissiveIntensity: 0.18, roughness: 0.05, metalness: 0.04, transparent: true, opacity: 0.36, side: THREE.DoubleSide, depthWrite: false });
  const opal = districtMaterial('Omics pale translucent calibration ceramic', '#c7ddda', { emissive: '#6d9998', emissiveIntensity: 0.28, roughness: 0.22, metalness: 0.03, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
  const mesh = districtMaterial('Omics responsive environmental mesh', '#778786', { roughness: 0.48, metalness: 0.7, transparent: true, opacity: 0.54, side: THREE.DoubleSide });
  const cool = districtMaterial('Omics cool-white analytical light', '#efffff', { emissive: '#b9f7f5', emissiveIntensity: 2.4, roughness: 0.08, metalness: 0.06 });
  const cyan = districtMaterial('Omics context cyan signal', '#74e6df', { emissive: '#2ab9b2', emissiveIntensity: 2.4, roughness: 0.09, metalness: 0.08 });
  const amber = districtMaterial('Omics causal amber signal', '#ffc275', { emissive: '#d8781b', emissiveIntensity: 2.35, roughness: 0.09, metalness: 0.08 });
  const violet = districtMaterial('Omics longitudinal violet signal', '#b7a0ff', { emissive: '#7454dc', emissiveIntensity: 2.25, roughness: 0.09, metalness: 0.08 });
  const palePaving = districtMaterial('Omic Continuum pale coordinate paving', '#b8bdb8', { roughness: 0.94, metalness: 0.03 });
  const darkPaving = districtMaterial('Omic Continuum dark chronological paving', '#293135', { roughness: 0.9, metalness: 0.08 });
  const porousPaving = districtMaterial('Omic Continuum porous environmental mineral', '#7d877b', { roughness: 0.98, metalness: 0 });
  const water = districtMaterial('Omics shallow monitoring water', '#0b3338', { emissive: '#0c4145', emissiveIntensity: 0.14, roughness: 0.08, metalness: 0.12, transparent: true, opacity: 0.82 });
  const grass = districtMaterial('Omics coastal ecological grass', '#486a55', { roughness: 0.98, metalness: 0 });
  const soil = districtMaterial('Omics monitored mineral soil', '#685949', { roughness: 0.98, metalness: 0 });
  const gravel = districtMaterial('Omics sterile pale gravel', '#aba89c', { roughness: 0.99, metalness: 0 });
  [cool, cyan, amber, violet].forEach((material) => { material.userData.isDistrictAccent = true; });
  return { ivory, mineral, basalt, titaniumBlack, oxidizedSteel, titanium, stainless, whiteUtility, darkGlass, clearGlass, opal, mesh, cool, cyan, amber, violet, palePaving, darkPaving, porousPaving, water, grass, soil, gravel };
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

function cylinder(parent: THREE.Object3D, name: string, diameter: number, height: number, material: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 20, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const geometry = segments <= 8 ? UNIT_CYLINDER_8 : segments <= 12 ? UNIT_CYLINDER_12 : UNIT_CYLINDER_20;
  const mesh = prepare(new THREE.Mesh(geometry, material), name, obstacle);
  mesh.scale.set(diameter, height, diameter); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function taperedCylinder(parent: THREE.Object3D, name: string, bottomDiameter: number, topDiameter: number, height: number, segments: number, material: THREE.Material, position: readonly [number, number, number], obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(new THREE.CylinderGeometry(topDiameter * 0.5, bottomDiameter * 0.5, height, segments), material), name, obstacle);
  mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function ellipsoid(parent: THREE.Object3D, name: string, scale: readonly [number, number, number], material: THREE.Material, position: readonly [number, number, number], obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mesh = prepare(new THREE.Mesh(UNIT_SPHERE, material), name, obstacle);
  mesh.scale.set(...scale); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, material: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [0, 0, 0], arc = Math.PI * 2, radialSegments = 8, tubularSegments = 56) {
  const key = `${radius.toFixed(3)}|${tube.toFixed(3)}|${arc.toFixed(3)}|${radialSegments}|${tubularSegments}`;
  let geometry = TORUS_CACHE.get(key);
  if (!geometry) { geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc); TORUS_CACHE.set(key, geometry); }
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
  mesh.scale.set(direction.length() + 0.04, height, width); mesh.position.copy(start).add(end).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(UNIT_X, direction.normalize()); parent.add(mesh); return mesh;
}

function pulse(object: THREE.Object3D, speed: number, phase = 0, minIntensity = 0.2, maxIntensity = 3.8) {
  object.userData.animate = 'omics-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate(object: THREE.Object3D, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'omics-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function transit(object: THREE.Object3D, path: readonly THREE.Vector3[], speed: number, phase: number) {
  object.userData.animate = 'omics-sample-transit'; object.userData.path = path.map((point) => point.toArray()); object.userData.speed = speed; object.userData.phase = phase; return object;
}

function makeRibbonGeometry(points: readonly THREE.Vector3[], width: number) {
  const vertices: number[] = []; const indices: number[] = [];
  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)];
    const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5);
    vertices.push(point.x + normal.x, point.y, point.z + normal.z, point.x - normal.x, point.y, point.z - normal.z);
    if (index < points.length - 1) { const base = index * 2; indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); }
  });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function addRibbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, material: THREE.Material, walkable = true) {
  const ribbon = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), material), name); ribbon.userData.walkable = walkable; ribbon.userData.navObstacle = false; ribbon.userData.omicsRoute = true; ribbon.receiveShadow = true; parent.add(ribbon); return ribbon;
}

function createAtlasLoom(_record: OmicsBuildingProgram, m: OmicsMaterials) {
  const root = new THREE.Group(); root.name = 'OMICS__O1__ATLAS_LOOM';
  box(root, 'OMICS__O1__TISSUE_FOUNDATION', [14.6, 0.3, 9.3], m.basalt, [0, 0.15, 0], true);
  const panelMaterials = [m.ivory, m.mineral, m.ivory, m.opal];
  for (let wing = 0; wing < 3; wing += 1) {
    const zBase = (wing - 1) * 2.55;
    for (let segment = 0; segment < 9; segment += 1) {
      const x = -6.25 + segment * 1.56;
      const phase = segment / 8;
      const curve = Math.sin(phase * Math.PI * (wing === 1 ? 2 : 1) + wing * 0.75) * (wing === 1 ? 0.74 : 0.48);
      const z = zBase + curve;
      const y = 2.34 + (wing === 1 && segment >= 3 && segment <= 5 ? 0.72 : 0);
      const yaw = Math.cos(phase * Math.PI * (wing === 1 ? 2 : 1) + wing * 0.75) * 0.17;
      box(root, `OMICS__O1__WOVEN_TISSUE_WING_${wing + 1}_SEGMENT_${segment + 1}`, [1.72, 4.35, 1.62], m.ivory, [x, y, z], true, [0, yaw, 0]);
      for (let floor = 0; floor < 5; floor += 1) {
        for (const side of [-1, 1]) {
          const depth = 0.825 * side;
          const panel = box(root, `OMICS__O1__VORONOI_CELL_PANEL_${wing + 1}_${segment + 1}_${floor + 1}_${side > 0 ? 'N' : 'S'}`, [1.34 - ((segment + floor) % 3) * 0.08, 0.56, 0.035], panelMaterials[(segment + floor + wing) % panelMaterials.length], [x + Math.sin((floor + segment) * 1.7) * 0.07, 0.78 + floor * 0.76 + (y - 2.34), z + depth], false, [0, yaw, (segment % 3 - 1) * 0.025]);
          if ((segment + floor + wing + side) % 5 === 0) pulse(panel, 0.0045 + wing * 0.0005, segment * 0.31 + floor * 0.22, 0.18, 1.7);
        }
      }
    }
  }
  for (let fissure = 0; fissure < 6; fissure += 1) {
    const x = -5.15 + fissure * 2.05;
    box(root, `OMICS__O1__VERTICAL_GLASS_FISSURE_${fissure + 1}`, [0.22 + (fissure % 2) * 0.08, 4.7, 0.12], m.clearGlass, [x, 2.55, fissure % 2 ? 3.35 : -3.35], false, [0, (fissure % 3 - 1) * 0.12, 0]);
    for (let organelle = 0; organelle < 7; organelle += 1) pulse(ellipsoid(root, `OMICS__O1__TRANSLUCENT_ORGANELLE_SCREEN_${fissure + 1}_${organelle + 1}`, [0.08 + (organelle % 3) * 0.03, 0.18, 0.035], [m.cyan, m.violet, m.cool][organelle % 3].clone(), [x + Math.sin(organelle * 2.2) * 0.08, 0.9 + organelle * 0.55, (fissure % 2 ? 3.27 : -3.27)], false), 0.005, fissure * 0.5 + organelle * 0.3, 0.2, 2.1);
  }
  for (let tower = 0; tower < 4; tower += 1) {
    const x = tower < 2 ? -5.35 : 5.35; const z = tower % 2 ? 2.0 : -2.0;
    cylinder(root, `OMICS__O1__CRYOGENIC_SERVICE_TOWER_${tower + 1}`, 1.02, 6.5, m.titaniumBlack, [x, 3.25, z], true, 20);
    for (let rail = 0; rail < 3; rail += 1) box(root, `OMICS__O1__SERVICE_TOWER_SILVER_RAIL_${tower + 1}_${rail + 1}`, [0.035, 5.7, 0.045], m.titanium, [x + Math.cos(rail * Math.PI * 2 / 3) * 0.51, 3.2, z + Math.sin(rail * Math.PI * 2 / 3) * 0.51]);
    pulse(torus(root, `OMICS__O1__BREATHING_TOWER_VENT_${tower + 1}`, 0.34, 0.055, m.cool.clone(), [x, 6.52, z], [Math.PI / 2, 0, 0], Math.PI * 2, 6, 24), 0.0038, tower * 1.1, 0.15, 1.4);
  }
  for (let line = 0; line < 22; line += 1) {
    box(root, `OMICS__O1__ATLAS_COURT_COORDINATE_X_${line + 1}`, [5.0, 0.025, 0.018], line % 5 === 0 ? m.cyan : m.stainless, [0, 0.34, -1.58 + line * 0.15]);
    box(root, `OMICS__O1__ATLAS_COURT_COORDINATE_Z_${line + 1}`, [0.018, 0.025, 3.2], line % 5 === 0 ? m.cyan : m.stainless, [-2.43 + line * 0.23, 0.342, 0]);
  }
  for (let colony = 0; colony < 14; colony += 1) ellipsoid(root, `OMICS__O1__CELL_COLONY_BENCH_${colony + 1}`, [0.32 + (colony % 4) * 0.07, 0.18, 0.25 + (colony % 3) * 0.06], colony % 5 === 0 ? m.titanium : m.mineral, [-2.0 + (colony % 7) * 0.66, 0.52, -1.15 + Math.floor(colony / 7) * 2.3], colony % 5 !== 0);
  const capillary = Array.from({ length: 15 }, (_, index) => new THREE.Vector3(-2.25 + index * 0.32, 0.355, Math.sin(index * 0.82) * 0.65));
  addRibbon(root, 'OMICS__O1__ATLAS_COURT_CAPILLARY_CHANNEL', capillary, 0.13, m.water);
  for (let frame = 0; frame < 12; frame += 1) {
    const x = -5.5 + frame; box(root, `OMICS__O1__ROOF_OPTICAL_CALIBRATION_FRAME_${frame + 1}`, [0.055, 1.0 + (frame % 3) * 0.22, 0.055], m.titanium, [x, 5.2 + (frame % 3) * 0.11, frame % 2 ? 1.75 : -1.75]);
    box(root, `OMICS__O1__ROOF_OPTICAL_TARGET_${frame + 1}`, [0.42, 0.32, 0.035], frame % 4 === 0 ? m.cool : m.opal, [x, 5.62 + (frame % 3) * 0.22, frame % 2 ? 1.75 : -1.75]);
  }
  box(root, 'OMICS__O1__ELEVATED_CROSSING_BRIDGE', [5.8, 1.1, 1.0], m.ivory, [0, 4.78, 0], true, [0, 0.12, 0]);
  box(root, 'OMICS__O1__ELEVATED_CROSSING_GLASS', [5.35, 0.62, 1.04], m.clearGlass, [0, 4.82, 0], false, [0, 0.12, 0]);
  return root;
}

function createPerturbomeFoundry(_record: OmicsBuildingProgram, m: OmicsMaterials) {
  const root = new THREE.Group(); root.name = 'OMICS__O2__PERTURBOME_FOUNDRY';
  box(root, 'OMICS__O2__FOUNDRY_BASALT_DATUM', [19.0, 0.32, 6.2], m.basalt, [0, 0.16, 0], true);
  box(root, 'OMICS__O2__CENTRAL_STRUCTURAL_SPINE', [18.2, 4.3, 1.6], m.titaniumBlack, [0, 2.48, 0], true);
  for (let module = 0; module < 12; module += 1) {
    const x = -8.25 + module * 1.5; const side = module % 2 ? 1 : -1; const depth = 2.15 + (module % 4) * 0.18; const z = side * (1.25 + depth * 0.32);
    box(root, `OMICS__O2__REPLACEABLE_RESEARCH_CARTRIDGE_${module + 1}`, [1.34, 3.35 + (module % 3) * 0.38, depth], module % 4 === 0 ? m.oxidizedSteel : m.titaniumBlack, [x, 2.08 + (module % 3) * 0.19, z], true);
    for (let fin = 0; fin < 8; fin += 1) box(root, `OMICS__O2__MOLECULAR_BARCODE_FIN_${module + 1}_${fin + 1}`, [0.065, 3.05, 0.22], fin % 4 === 0 ? m.titanium : m.oxidizedSteel, [x - 0.52 + fin * 0.15, 2.08, z + side * (depth * 0.51)], false, [0, (fin % 3 - 1) * 0.08, 0]);
    pulse(box(root, `OMICS__O2__EXPERIMENTAL_CYCLE_LIGHT_${module + 1}`, [1.0, 0.055, 0.06], m.amber.clone(), [x, 3.55 + (module % 3) * 0.38, z + side * (depth * 0.53)]), 0.007 + (module % 4) * 0.0005, module * 0.58, 0.12, 2.5);
    box(root, `OMICS__O2__ROOF_FILTER_STACK_${module + 1}`, [0.62, 0.75 + (module % 3) * 0.18, 0.7], module % 2 ? m.titanium : m.whiteUtility, [x, 4.15 + (module % 3) * 0.48, z]);
  }
  for (let frame = 0; frame < 13; frame += 1) {
    const x = -9 + frame * 1.5;
    for (const z of [-3.0, 3.0]) box(root, `OMICS__O2__SILVER_EXOSKELETON_POST_${frame + 1}_${z > 0 ? 'N' : 'S'}`, [0.1, 5.0, 0.1], m.titanium, [x, 2.5, z]);
    if (frame < 12) box(root, `OMICS__O2__EXOSKELETON_ROOF_RAIL_${frame + 1}`, [1.5, 0.1, 6.1], m.titanium, [x + 0.75, 4.95, 0]);
  }
  box(root, 'OMICS__O2__NULL_GATE_LEFT_SLAB', [1.05, 5.0, 0.7], m.titaniumBlack, [-1.2, 2.55, -3.0], true, [0, 0, -0.18]);
  box(root, 'OMICS__O2__NULL_GATE_RIGHT_SLAB', [1.05, 5.0, 0.7], m.titaniumBlack, [1.2, 2.55, -3.0], true, [0, 0, 0.18]);
  pulse(box(root, 'OMICS__O2__NULL_GATE_WHITE_FLOOR_LINE', [0.07, 0.03, 3.1], m.cool.clone(), [0, 0.35, -3.9]), 0.004, 0.2, 0.65, 1.7);
  box(root, 'OMICS__O2__SUNKEN_SECURITY_PLAZA', [6.5, 0.08, 2.3], m.gravel, [0, 0.27, -4.3]);
  for (let marker = 0; marker < 14; marker += 1) box(root, `OMICS__O2__SECURITY_CALIBRATION_MARKER_${marker + 1}`, [0.05, 0.025, 0.42], marker % 3 === 0 ? m.amber : m.titanium, [-3.0 + marker * 0.46, 0.32, -4.3]);
  for (let tree = 0; tree < 3; tree += 1) {
    torus(root, `OMICS__O2__SPECIMEN_TREE_CONTAINMENT_RING_${tree + 1}`, 0.42, 0.07, m.stainless, [-2.6 + tree * 2.6, 0.37, -4.25], [Math.PI / 2, 0, 0], Math.PI * 2, 6, 24);
    cylinder(root, `OMICS__O2__SPECIMEN_TREE_${tree + 1}`, 0.12, 1.4, m.oxidizedSteel, [-2.6 + tree * 2.6, 1.05, -4.25], true, 8);
    ellipsoid(root, `OMICS__O2__SPECIMEN_TREE_CROWN_${tree + 1}`, [0.42, 0.55, 0.42], m.grass, [-2.6 + tree * 2.6, 1.82, -4.25]);
  }
  for (let bay = 0; bay < 8; bay += 1) {
    const x = -7.4 + bay * 2.1; box(root, `OMICS__O2__STERILE_LOGISTICS_BAY_${bay + 1}`, [1.45, 1.8, 0.1], m.darkGlass, [x, 1.28, 3.12]);
    box(root, `OMICS__O2__DECONTAMINATION_ARCH_${bay + 1}`, [1.7, 0.12, 0.22], m.stainless, [x, 2.23, 3.25]);
    pulse(cylinder(root, `OMICS__O2__ROBOTIC_COUPLING_POINT_${bay + 1}`, 0.18, 0.3, m.cyan.clone(), [x, 0.5, 3.28], false, 8), 0.006, bay * 0.45, 0.2, 2.0);
  }
  for (let dock = 0; dock < 6; dock += 1) box(root, `OMICS__O2__RETRACTABLE_DRONE_DOCK_${dock + 1}`, [0.7, 0.12, 0.7], dock % 2 ? m.titanium : m.darkGlass, [-5.8 + dock * 2.3, 5.05, 0]);
  return root;
}

function createExposomeExchange(_record: OmicsBuildingProgram, m: OmicsMaterials) {
  const root = new THREE.Group(); root.name = 'OMICS__O3__EXPOSOME_EXCHANGE';
  const courtFoundation = cylinder(root, 'OMICS__O3__ENVIRONMENTAL_COURT_FOUNDATION', 11.7, 0.22, m.basalt, [0, 0.11, 0], false, 20);
  courtFoundation.userData.walkable = true;
  const start = THREE.MathUtils.degToRad(38); const span = THREE.MathUtils.degToRad(284);
  for (let segment = 0; segment < 24; segment += 1) {
    const t = segment / 23; const angle = start + t * span; const radius = 4.75; const x = Math.cos(angle) * radius; const z = Math.sin(angle) * radius;
    const height = 1.8 + t * 3.45 + Math.sin(t * Math.PI * 2) * 0.22;
    box(root, `OMICS__O3__RISING_INCOMPLETE_RING_SEGMENT_${segment + 1}`, [1.42, height, 1.4], segment % 5 === 0 ? m.mineral : m.darkGlass, [x, 0.25 + height * 0.5, z], true, [0, -angle, 0]);
    box(root, `OMICS__O3__RESPONSIVE_SAMPLING_VEIL_${segment + 1}`, [1.18, height * 0.88, 0.055], segment % 4 === 0 ? m.opal : m.mesh, [Math.cos(angle) * 5.56, 0.35 + height * 0.5, Math.sin(angle) * 5.56], false, [0, -angle, (segment % 3 - 1) * 0.025]);
    for (let plate = 0; plate < 4; plate += 1) pulse(box(root, `OMICS__O3__ENVIRONMENTAL_COLLECTION_PLATE_${segment + 1}_${plate + 1}`, [0.18, 0.24, 0.035], [m.cyan, m.cool, m.amber, m.violet][plate].clone(), [Math.cos(angle) * 5.63 + Math.cos(angle + Math.PI / 2) * (-0.38 + plate * 0.25), 0.8 + plate * height * 0.2, Math.sin(angle) * 5.63 + Math.sin(angle + Math.PI / 2) * (-0.38 + plate * 0.25)], false, [0, -angle, 0]), 0.0035 + plate * 0.0004, segment * 0.2 + plate, 0.12, 1.5);
    if (segment % 2 === 0) box(root, `OMICS__O3__ROBOTIC_SAMPLING_RAIL_${segment + 1}`, [1.35, 0.06, 0.08], m.titanium, [Math.cos(angle) * 5.35, 1.0 + height * 0.52, Math.sin(angle) * 5.35], false, [0, -angle, 0]);
  }
  const bandMaterials = [m.grass, m.soil, m.water, m.basalt, m.gravel, m.porousPaving, m.mineral];
  const bandNames = ['COASTAL_GRASS', 'MINERAL_SOIL', 'FRESHWATER', 'EXPOSED_ROCK', 'DRY_GRAVEL', 'SHADED_FOREST_FLOOR', 'WETLAND_SUBSTRATE'];
  for (let band = 0; band < 7; band += 1) box(root, `OMICS__O3__ECOLOGICAL_BAND_${bandNames[band]}`, [0.82, 0.11, 6.8 - Math.abs(3 - band) * 0.34], bandMaterials[band], [-2.64 + band * 0.88, 0.30, 0]);
  for (let walkway = 0; walkway < 3; walkway += 1) {
    const z = -2.2 + walkway * 2.2; box(root, `OMICS__O3__RAISED_ENVIRONMENTAL_WALKWAY_${walkway + 1}`, [7.4, 0.13, 0.55], m.stainless, [0, 0.68, z]);
    for (let probe = 0; probe < 10; probe += 1) pulse(cylinder(root, `OMICS__O3__WALKWAY_PARTICLE_PROBE_${walkway + 1}_${probe + 1}`, 0.08, 0.25, (probe % 3 ? m.cyan : m.amber).clone(), [-3.35 + probe * 0.74, 0.49, z], false, 8), 0.005, walkway + probe * 0.28, 0.16, 1.7);
  }
  for (let tower = 0; tower < 5; tower += 1) {
    const x = -4.4 + tower * 2.2; const z = 5.4;
    taperedCylinder(root, `OMICS__O3__ATMOSPHERIC_INTAKE_SHELL_${tower + 1}`, 0.58, 0.34, 6.3 + tower * 0.14, 8, m.titaniumBlack, [x, 3.35 + tower * 0.07, z], true);
    for (const side of [-1, 1]) cylinder(root, `OMICS__O3__TUNING_FORK_INTAKE_${tower + 1}_${side > 0 ? 'A' : 'B'}`, 0.13, 1.5, m.stainless, [x + side * 0.19, 6.48 + tower * 0.14, z], false, 8);
    rotate(torus(root, `OMICS__O3__WIND_ALIGNMENT_ASSEMBLY_${tower + 1}`, 0.29, 0.045, m.cyan, [x, 5.95 + tower * 0.14, z], [Math.PI / 2, 0, 0], Math.PI * 2, 6, 24), 0.012 + tower * 0.001);
  }
  for (let intake = 0; intake < 5; intake += 1) {
    const x = -3.8 + intake * 1.9; const startPoint = new THREE.Vector3(x, 0.42, 4.45); const endPoint = new THREE.Vector3(x, 0.18, 6.45);
    pipe(root, `OMICS__O3__SEAWATER_INTAKE_${intake + 1}`, startPoint, endPoint, 0.14, m.clearGlass);
    for (let shell = 0; shell < 4; shell += 1) torus(root, `OMICS__O3__PERFORATED_TITANIUM_INTAKE_SHELL_${intake + 1}_${shell + 1}`, 0.22, 0.035, m.titanium, [x, 0.2 + shell * 0.035, 5.0 + shell * 0.42], [Math.PI / 2, 0, 0], Math.PI * 2, 6, 20);
  }
  for (let terrace = 0; terrace < 10; terrace += 1) box(root, `OMICS__O3__CLIMATE_CALIBRATION_TERRACE_${terrace + 1}`, [0.72, 0.07, 0.95], [m.basalt, m.ivory, m.grass, m.water, m.opal][terrace % 5], [-4.05 + terrace * 0.9, 4.65 + (terrace % 3) * 0.28, -1.0 + (terrace % 2) * 2]);
  box(root, 'OMICS__O3__LIFTED_MEMBRANE_ENTRANCE', [5.0, 0.12, 1.7], m.mesh, [0, 2.25, -5.25], false, [0.3, 0, 0]);
  for (let mist = 0; mist < 18; mist += 1) pulse(ellipsoid(root, `OMICS__O3__ENTRANCE_MIST_POINT_${mist + 1}`, [0.06, 0.08, 0.06], m.cool.clone(), [-2.15 + (mist % 9) * 0.54, 0.48 + Math.floor(mist / 9) * 0.18, -5.62], false), 0.004, mist * 0.28, 0.08, 1.1);
  return root;
}

function createFluxCathedral(_record: OmicsBuildingProgram, m: OmicsMaterials) {
  const root = new THREE.Group(); root.name = 'OMICS__O4__FLUX_CATHEDRAL';
  const ringCenterY = 5.95;
  cylinder(root, 'OMICS__O4__VIBRATION_ISOLATED_STONE_PLINTH', 12.0, 0.7, m.basalt, [0, 0.35, 0], true, 20);
  box(root, 'OMICS__O4__PLINTH_GEOLOGICAL_SEAM_1', [11.2, 0.06, 0.05], m.titanium, [0, 0.25, -5.72]);
  box(root, 'OMICS__O4__PLINTH_GEOLOGICAL_SEAM_2', [11.2, 0.06, 0.05], m.titanium, [0, 0.52, -5.72]);
  torus(root, 'OMICS__O4__TILTED_HOLLOW_ANALYTICAL_RING', 4.55, 0.92, m.stainless, [0, ringCenterY, 0], [0.08, 0, 0.08], Math.PI * 2, 10, 72);
  torus(root, 'OMICS__O4__BLACK_GLASS_ANALYTICAL_BAND', 4.55, 0.57, m.darkGlass, [0, ringCenterY, -0.8], [0.08, 0, 0.08], Math.PI * 2, 8, 72);
  pulse(torus(root, 'OMICS__O4__MUTED_INNER_RING_GLOW', 3.7, 0.09, m.cool.clone(), [0, ringCenterY, -0.86], [0.08, 0, 0.08], Math.PI * 2, 6, 72), 0.0028, 0.4, 0.55, 1.55);
  for (let fin = 0; fin < 96; fin += 1) {
    const angle = fin * Math.PI * 2 / 96 + 0.08; const radius = 4.62; const x = Math.cos(angle) * radius; const y = ringCenterY + Math.sin(angle) * radius;
    box(root, `OMICS__O4__CHROMATOGRAPHIC_FACADE_FIN_${fin + 1}`, [0.055, 0.92 + (fin % 5) * 0.07, 0.34], fin % 8 === 0 ? m.opal : m.titanium, [x, y, -0.92], false, [0, 0, angle]);
  }
  const trajectorySpecs: Array<[number, number, number, number]> = [[2.1, -2.6, 3.0, -0.42], [1.75, 2.55, 3.15, 0.46], [1.45, 0, 1.8, 0.92]];
  trajectorySpecs.forEach(([radius, x, y, rotation], index) => {
    torus(root, `OMICS__O4__INTERSECTING_ANALYTICAL_TRAJECTORY_${index + 1}`, radius, 0.43, [m.ivory, m.darkGlass, m.stainless][index], [x, y, 0.25 + index * 0.2], [0.1, rotation, rotation * 0.4], Math.PI * 2, 8, 48);
    pulse(torus(root, `OMICS__O4__TRAJECTORY_REFERENCE_LOOP_${index + 1}`, radius, 0.055, [m.cyan, m.amber, m.violet][index].clone(), [x, y, -0.2], [0.1, rotation, rotation * 0.4], Math.PI * 2, 6, 48), 0.004 + index * 0.0007, index * 1.5, 0.3, 2.3);
  });
  for (let aperture = 0; aperture < 18; aperture += 1) {
    const angle = -Math.PI * 0.83 + aperture * Math.PI * 1.66 / 17 + 0.08;
    box(root, `OMICS__O4__HORIZONTAL_CONTROLLED_APERTURE_${aperture + 1}`, [0.65, 0.08, 0.05], m.darkGlass, [Math.cos(angle) * 4.6, ringCenterY + Math.sin(angle) * 4.6, -1.03], false, [0, 0, angle + Math.PI / 2]);
  }
  const dryBasin = torus(root, 'OMICS__O4__DRY_REACTION_BASIN', 2.25, 0.12, m.mineral, [0, 0.76, -5.4], [Math.PI / 2, 0, 0], Math.PI * 2, 6, 48); dryBasin.userData.walkable = true;
  box(root, 'OMICS__O4__ENTRANCE_BRIDGE', [1.25, 0.14, 4.2], m.stainless, [0, 0.88, -3.9]);
  for (let contour = 0; contour < 7; contour += 1) torus(root, `OMICS__O4__REACTION_CONTOUR_${contour + 1}`, 0.45 + contour * 0.27, 0.025, contour % 2 ? m.amber : m.titanium, [0, 0.79 + contour * 0.002, -5.4], [Math.PI / 2, 0, 0], Math.PI * 2, 5, 32);
  for (let vessel = 0; vessel < 7; vessel += 1) {
    const x = -5.2 + vessel * 1.1; const z = 4.75;
    taperedCylinder(root, `OMICS__O4__CRYOGENIC_SERVICE_MONOLITH_${vessel + 1}`, 0.72, 0.55, 1.75 + (vessel % 3) * 0.32, 12, m.whiteUtility, [x, 1.22 + (vessel % 3) * 0.16, z], true);
    pipe(root, `OMICS__O4__INSULATED_INSTRUMENT_COUPLING_${vessel + 1}`, new THREE.Vector3(x, 0.8, z - 0.2), new THREE.Vector3(x * 0.45, 1.25, 2.8), 0.07, m.stainless);
  }
  for (let tower = 0; tower < 6; tower += 1) {
    const x = -4.6 + tower * 1.84; const z = 5.75;
    taperedCylinder(root, `OMICS__O4__CRYSTALLINE_COOLING_TOWER_${tower + 1}`, 0.95, 0.62, 3.1 + (tower % 2) * 0.45, 6, tower % 2 ? m.titanium : m.opal, [x, 2.2 + (tower % 2) * 0.225, z], true, [0, tower * 0.17, 0]);
    pulse(box(root, `OMICS__O4__COOLING_VAPOR_GLOW_${tower + 1}`, [0.45, 0.06, 0.45], m.cool.clone(), [x, 3.82 + (tower % 2) * 0.45, z]), 0.003, tower * 0.8, 0.08, 1.25);
  }
  rotate(torus(root, 'OMICS__O4__ROOF_MAINTENANCE_TRACK', 5.2, 0.08, m.titanium, [0, ringCenterY, 0.6], [0.08, 0, 0.08], Math.PI * 2, 6, 72), 0.004, 'z');
  return root;
}

function createConvergenceVault(_record: OmicsBuildingProgram, m: OmicsMaterials) {
  const root = new THREE.Group(); root.name = 'OMICS__O5__CONVERGENCE_VAULT';
  box(root, 'OMICS__O5__BURIED_ARCHIVE_RIDGE', [17.8, 1.25, 10.8], m.basalt, [0, 0.62, 0.35], true);
  for (let level = 0; level < 5; level += 1) {
    const width = 17.0 - level * 1.35; const depth = 9.8 - level * 1.05; const y = 1.0 + level * 0.88;
    box(root, `OMICS__O5__STEPPED_MINERAL_TERRACE_${level + 1}`, [width, 0.82, depth], m.mineral, [0.25 + level * 0.18, y, 0.4 + level * 0.33], true);
    box(root, `OMICS__O5__ELECTROCHROMIC_TIME_STRATUM_${level + 1}`, [width + 0.08, 0.16, depth + 0.08], m.darkGlass, [0.25 + level * 0.18, y + 0.48, 0.4 + level * 0.33]);
    pulse(box(root, `OMICS__O5__TERRACE_EDGE_VALIDATION_LIGHT_${level + 1}`, [width * 0.82, 0.045, 0.06], [m.cool, m.violet, m.cyan][level % 3].clone(), [0.25 + level * 0.18, y + 0.52, -depth * 0.5 + 0.4 + level * 0.33]), 0.003 + level * 0.00035, level * 1.1, 0.12, 1.7);
  }
  for (let groove = 0; groove < 64; groove += 1) {
    const level = groove % 5; const width = 15.9 - level * 1.35; const z = -4.15 + level * 0.85 + Math.floor(groove / 5) * 0.055; const gap = groove % 11 === 0;
    box(root, `OMICS__O5__CHRONOLOGICAL_CONCRETE_GROOVE_${groove + 1}${gap ? '_MISSING_DATA' : ''}`, [gap ? width * 0.42 : width, 0.022, 0.025], gap ? m.violet : m.titanium, [gap ? -width * 0.23 : 0.2, 1.42 + level * 0.88, z]);
  }
  box(root, 'OMICS__O5__CHRONOME_NEEDLE', [1.08, 7.6, 1.08], m.darkGlass, [1.1, 7.2, 1.25], true);
  for (let band = 0; band < 36; band += 1) pulse(box(root, `OMICS__O5__CHRONOME_TIME_BAND_${band + 1}`, [1.14, 0.035, 1.14], [m.cool, m.violet, m.cyan][band % 3].clone(), [1.1, 3.52 + band * 0.205, 1.25]), 0.0022 + (band % 4) * 0.0002, band * 0.31, 0.05, 1.4);
  for (let tower = 0; tower < 4; tower += 1) {
    const x = tower < 2 ? -7.6 : 7.6; const z = tower % 2 ? 3.85 : -3.85;
    taperedCylinder(root, `OMICS__O5__WHITE_UTILITY_TOWER_${tower + 1}`, 1.25, 1.0, 4.25, 12, m.whiteUtility, [x, 2.55, z], true);
    pipe(root, `OMICS__O5__ARMORED_UNDERGROUND_CHANNEL_${tower + 1}`, new THREE.Vector3(x, 0.42, z), new THREE.Vector3(x * 0.55, 0.38, z * 0.45), 0.12, m.titaniumBlack);
  }
  for (let column = 0; column < 14; column += 1) {
    const x = -6.2 + column * 0.95; const yaw = column % 2 ? 0 : Math.PI / 2;
    box(root, `OMICS__O5__PERSPECTIVE_COLONNADE_SLAB_${column + 1}`, [0.16, 3.1, 0.78], m.mineral, [x, 1.92, -5.45], true, [0, yaw, 0]);
  }
  box(root, 'OMICS__O5__SEAMLESS_BLACK_ENTRANCE_WALL', [3.2, 2.25, 0.18], m.darkGlass, [0, 1.45, -5.1], true);
  for (let marker = 0; marker < 36; marker += 1) {
    const x = -6.4 + (marker % 12) * 1.14; const z = -3.5 + Math.floor(marker / 12) * 1.0; const height = 0.65 + ((marker * 7) % 11) * 0.12;
    box(root, `OMICS__O5__REFERENCE_GARDEN_VARIABLE_MARKER_${marker + 1}`, [0.07, height, 0.07], marker % 9 === 0 ? m.violet : m.titanium, [x, 0.62 + height * 0.5, z]);
  }
  for (let fin = 0; fin < 32; fin += 1) {
    const x = -7.7 + fin * 0.49; const depth = 0.45 + (fin % 6) * 0.15;
    box(root, `OMICS__O5__NORTH_THERMAL_STRATA_FIN_${fin + 1}`, [0.12, 3.8, depth], m.titaniumBlack, [x, 2.5, 5.1 + depth * 0.5], true);
  }
  for (let panel = 0; panel < 18; panel += 1) box(root, `OMICS__O5__SOUTH_PHOTOVOLTAIC_MEMBRANE_${panel + 1}`, [0.7, 0.06, 0.9], m.darkGlass, [-5.9 + (panel % 9) * 1.45, 5.18 + Math.floor(panel / 9) * 0.45, -1.15 + Math.floor(panel / 9) * 1.1], false, [-0.12, 0, 0]);
  return root;
}

function assignBuildingMetadata(root: THREE.Group, record: OmicsBuildingProgram) {
  root.userData.exteriorProgram = true;
  root.userData.buildingCode = record.code;
  root.userData.buildingName = record.name;
  root.userData.buildingSubtitle = record.subtitle;
  root.userData.purpose = record.purpose;
  root.userData.footprintMetres = [...record.footprintMetres];
  root.userData.heightMetres = record.heightMetres;
  root.userData.placementZone = record.placementZone;
  root.userData.exteriorMotif = record.exteriorMotif;
  root.userData.continuumStage = record.continuumStage;
  root.userData.navObstacle = true;
  root.traverse((object) => { object.userData.selectableId = DISTRICT_ID; object.userData.districtId = DISTRICT_ID; });
  return root;
}

function createBuilding(record: OmicsBuildingProgram, materials: OmicsMaterials) {
  const factories: Record<OmicsBuildingForm, (record: OmicsBuildingProgram, materials: OmicsMaterials) => THREE.Group> = {
    atlas: createAtlasLoom,
    perturbome: createPerturbomeFoundry,
    exposome: createExposomeExchange,
    flux: createFluxCathedral,
    convergence: createConvergenceVault,
  };
  return assignBuildingMetadata(factories[record.form](record, materials), record);
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radialMargin = 7.8; const angularMargin = (sector.endAngle - sector.startAngle) * 0.045;
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

function addOmicContinuum(infrastructure: THREE.Group, definition: DistrictDefinition, m: OmicsMaterials) {
  const continuum = districtArc(definition, 0.5, 0.025, 0.975, 151);
  addRibbon(infrastructure, 'OMICS__OMIC_CONTINUUM', continuum, 2.8, m.palePaving);
  const stageMaterials = [m.stainless, m.titaniumBlack, m.porousPaving, m.amber, m.darkPaving];
  const stageNames = ['MAP_COORDINATE_GRID', 'PERTURB_BARCODE_INLAY', 'EXPOSE_POROUS_GRADIENT', 'MEASURE_FLUX_REACTION_LINE', 'INTEGRATE_CHRONOLOGICAL_BAND'];
  for (let stage = 0; stage < 5; stage += 1) {
    const start = stage * 30; const points = continuum.slice(start, start + 31).map((point) => point.clone().setY(FLOOR_Y + 0.018));
    addRibbon(infrastructure, `OMICS__CONTINUUM_STAGE_${stage + 1}_${stageNames[stage]}`, points, stage === 2 ? 2.45 : 2.25, stageMaterials[stage]);
    for (let mark = 0; mark < 9; mark += 1) {
      const point = points[2 + mark * 3]; const previous = points[Math.max(0, 1 + mark * 3)]; const next = points[Math.min(points.length - 1, 3 + mark * 3)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
      const length = stage === 1 ? 1.65 - (mark % 3) * 0.28 : stage === 4 ? 2.0 : 1.25;
      slabBetween(infrastructure, `OMICS__${stageNames[stage]}_${mark + 1}`, point.clone().addScaledVector(normal, -length * 0.5), point.clone().addScaledVector(normal, length * 0.5), 0.04 + (stage === 4 ? mark * 0.006 : 0), 0.025, stage === 3 ? m.amber : stage === 2 ? m.cyan : m.titanium);
    }
  }
  return continuum;
}

function addVisibleSampleTransit(infrastructure: THREE.Group, facilities: readonly THREE.Group[], m: OmicsMaterials) {
  const path: THREE.Vector3[] = [];
  facilities.forEach((facility, index) => {
    const elevated = facility.position.clone().setY(4.55 + (index % 2) * 0.55);
    if (index > 0) {
      const previous = path[path.length - 1];
      for (let step = 1; step <= 12; step += 1) path.push(previous.clone().lerp(elevated, step / 12).setY(4.55 + Math.sin(step / 12 * Math.PI) * 0.65 + (index % 2) * 0.35));
    } else path.push(elevated);
  });
  for (let index = 0; index < path.length - 1; index += 1) {
    pipe(infrastructure, `OMICS__TRANSPARENT_SAMPLE_TRANSIT_TUBE_${index + 1}`, path[index], path[index + 1], 0.18, m.clearGlass);
    for (const lane of [-0.11, 0, 0.11]) pipe(infrastructure, `OMICS__TEMPERATURE_CONTROLLED_TRANSIT_CHANNEL_${index + 1}_${lane < 0 ? 'COLD' : lane > 0 ? 'AMBIENT' : 'CRYO'}`, path[index].clone().add(new THREE.Vector3(0, lane, 0)), path[index + 1].clone().add(new THREE.Vector3(0, lane, 0)), 0.028, lane === 0 ? m.cool : lane < 0 ? m.cyan : m.violet);
  }
  for (let pylon = 0; pylon < path.length; pylon += 6) cylinder(infrastructure, `OMICS__SAMPLE_TRANSIT_PYLON_${pylon / 6 + 1}`, 0.16, path[pylon].y - FLOOR_Y, m.titanium, [path[pylon].x, (path[pylon].y + FLOOR_Y) * 0.5, path[pylon].z], true, 8);
  for (let capsule = 0; capsule < 10; capsule += 1) {
    const position = path[Math.floor(capsule * path.length / 10)];
    transit(ellipsoid(infrastructure, `OMICS__AUTONOMOUS_CRYOGENIC_CAPSULE_${capsule + 1}`, [0.07, 0.04, 0.04], capsule % 3 === 0 ? m.amber : m.cool, [position.x, position.y, position.z]), path, 0.0024 + capsule * 0.00012, capsule / 10);
  }
  return path;
}

function addDistrictLandscape(district: THREE.Group, definition: DistrictDefinition, m: OmicsMaterials) {
  const landscape = new THREE.Group(); landscape.name = 'OMICS__DISTRICT_CONTEXT_AND_CALIBRATION_LANDSCAPE';
  for (let sensor = 0; sensor < 20; sensor += 1) {
    const point = pointInDistrict(definition, sensor % 2 ? 0.04 : 0.96, 0.04 + sensor * 0.048);
    cylinder(landscape, `OMICS__ENVIRONMENTAL_CALIBRATION_MAST_${sensor + 1}`, 0.09, 0.9 + (sensor % 4) * 0.17, m.titanium, [point.x, 0.48 + (sensor % 4) * 0.085, point.z], false, 8);
    pulse(ellipsoid(landscape, `OMICS__CALIBRATION_SIGNAL_${sensor + 1}`, [0.1, 0.1, 0.1], [m.cool, m.cyan, m.amber, m.violet][sensor % 4].clone(), [point.x, 0.96 + (sensor % 4) * 0.17, point.z]), 0.0045, sensor * 0.32, 0.12, 1.6);
  }
  for (let hatch = 0; hatch < 15; hatch += 1) {
    const point = pointInDistrict(definition, 0.48 + Math.sin(hatch * 1.7) * 0.08, 0.05 + hatch * 0.063);
    cylinder(landscape, `OMICS__STERILE_SAMPLE_TRANSFER_HATCH_${hatch + 1}`, 0.48, 0.08, hatch % 3 === 0 ? m.stainless : m.titaniumBlack, [point.x, 0.08, point.z], false, 12);
    pulse(torus(landscape, `OMICS__SAMPLE_HATCH_STATUS_RING_${hatch + 1}`, 0.2, 0.025, (hatch % 2 ? m.cyan : m.amber).clone(), [point.x, 0.125, point.z], [Math.PI / 2, 0, 0], Math.PI * 2, 5, 18), 0.005, hatch * 0.4, 0.1, 1.8);
  }
  district.add(landscape); return landscape;
}

export function buildOmicsLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Omics Labs District requires a masterplan sector');
  const materials = createOmicsMaterials();
  const infrastructure = new THREE.Group(); infrastructure.name = 'OMICS__DISTRICT_INTEGRATION_INFRASTRUCTURE'; district.add(infrastructure);
  const continuum = addOmicContinuum(infrastructure, definition, materials);
  const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = OMICS_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials); const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02); building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT };
    district.add(building); return building;
  });
  facilities.forEach((facility, index) => {
    const record = OMICS_BUILDING_PROGRAM[index]; const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, -Math.min(6.2, record.footprintMetres[1] / 22 + 0.8)); const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const routePoint = nearestPoint(continuum, entrance); const approachPoints = [routePoint.clone(), routePoint.clone().lerp(entrance, 0.48), entrance];
    addRibbon(infrastructure, `OMICS__BUILDING_APPROACH_${record.code}`, approachPoints, 1.05, index === 2 ? materials.porousPaving : index === 4 ? materials.darkPaving : materials.palePaving);
    pulse(addRibbon(infrastructure, `OMICS__BUILDING_APPROACH_STAGE_SIGNAL_${record.code}`, approachPoints.map((point) => point.clone().setY(FLOOR_Y + 0.028)), 0.045, [materials.cool, materials.amber, materials.cyan, materials.violet, materials.cool][index].clone(), false), 0.006, index * 0.62, 0.16, 2.1);
  });
  const sampleTransitPath = addVisibleSampleTransit(infrastructure, facilities, materials);
  district.userData.omicsLabsDistrict = {
    identity: 'Omics Labs District',
    scientificSequence: ['Map', 'Perturb', 'Expose', 'Measure Flux', 'Integrate'],
    architecturalLanguage: 'integration, causality, time, biological context, exposed scientific infrastructure, and restrained operational signals',
    buildingCount: facilities.length,
    buildings: OMICS_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, subtitle: record.subtitle, purpose: record.purpose, placementZone: record.placementZone, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorMotif: record.exteriorMotif, continuumStage: record.continuumStage })),
    circulation: { primaryRoute: 'OMICS__OMIC_CONTINUUM', stages: 5, exactBuildingApproaches: 5, sampleTransitPathPoints: sampleTransitPath.length, transparentElevatedTransit: true },
    signatureSystems: { atlasWings: 3, atlasFacadeCells: 270, cryogenicServiceTowers: 4, perturbationModules: 12, barcodeFins: 96, exposomeRingSegments: 24, atmosphericIntakeTowers: 5, ecologicalBands: 7, chromatographicFins: 96, crystallineCoolingTowers: 6, chronologicalGrooves: 64, chronomeBands: 36, thermalStrataFins: 32, autonomousCapsules: 10 },
    materials: ['pale ivory cellular ceramic', 'matte black titanium', 'responsive metallic sampling mesh', 'brushed stainless steel', 'pale mineral concrete', 'black electrochromic glass'],
    lighting: ['cool-white analytical', 'causal amber', 'context cyan', 'longitudinal violet'],
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: OMICS_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: ['Omic Continuum', 'Transparent Autonomous Sample Transit', 'Environmental Calibration Masts', 'Sterile Sample Transfer Hatches', 'Stage-Specific Paving'],
    realizedFeatureTags: OMICS_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 6,
    radialCoverage: 0.94,
    angularCoverage: 0.96,
    exteriorOnly: true,
    omicContinuumNarrative: true,
  };
}
