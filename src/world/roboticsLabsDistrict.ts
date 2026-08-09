import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type RoboticsBuildingForm =
  | 'corpus'
  | 'tactus'
  | 'myomer'
  | 'murmuration'
  | 'symbiont'
  | 'magnetotaxis'
  | 'avatar'
  | 'terminus'
  | 'autopoiesis'
  | 'palingenesis';

export interface RoboticsBuildingProgram {
  code: string;
  name: string;
  subtitle: string;
  purpose: string;
  form: RoboticsBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
  operationalMovement: string;
}

export const ROBOTICS_BUILDING_PROGRAM: readonly RoboticsBuildingProgram[] = [
  { code: 'R1', name: 'Corpus Nexus', subtitle: 'Embodied Intelligence and Humanoid Robotics Institute', purpose: 'Whole-body embodied AI, humanoid locomotion, mobile manipulation, robot foundation models, and sim-to-real learning', form: 'corpus', footprintMetres: [128, 96], heightMetres: 176, radialT: 0.12, angularT: 0.08, placementZone: 'OMICS-facing embodied-intelligence gateway', exteriorMotif: 'seven rotated slabs around an inclined spine and articulated titanium exoskeleton above hostile urban terrain', operationalMovement: 'load-transfer signals, camera booms, terrace maintenance cranes, and vertical-locomotion trials' },
  { code: 'R2', name: 'Tactus Hall', subtitle: 'Robotic Skin, Dexterity and Manipulation Laboratory', purpose: 'Robotic hands, multimodal tactile sensing, artificial skin, compliant grasping, in-hand manipulation, and tool use', form: 'tactus', footprintMetres: [182, 92], heightMetres: 54, radialT: 0.88, angularT: 0.11, placementZone: 'sensor-transfer and public contact edge', exteriorMotif: 'a long tapered instrument clad in responsive ceramic sensor tiles above an articulated twenty-four-support canopy', operationalMovement: 'contact-event light constellations, iris manipulators, and load-adjusting canopy supports' },
  { code: 'R3', name: 'Myomer Pavilion', subtitle: 'Soft Robotics, Artificial Muscle and Adaptive Morphology Centre', purpose: 'Pneumatic and hydraulic robots, artificial muscles, variable-stiffness structures, self-healing elastomers, and continuum manipulators', form: 'myomer', footprintMetres: [154, 118], heightMetres: 74, radialT: 0.12, angularT: 0.29, placementZone: 'soft-machine landscape belt', exteriorMotif: 'serpentine translucent membrane lobes, vascular fluid channels, self-repair scars, and variable-stiffness arches', operationalMovement: 'slow pneumatic breathing, load-responsive muscle bundles, and reconfigurable outdoor arches' },
  { code: 'R4', name: 'Murmuration Array', subtitle: 'Swarm Robotics and Collective Autonomy Complex', purpose: 'Decentralized coordination, aerial and terrestrial swarms, collective mapping, emergent construction, and distributed sensing', form: 'murmuration', footprintMetres: [168, 124], heightMetres: 112, radialT: 0.88, angularT: 0.32, placementZone: 'collective-autonomy flight volume', exteriorMotif: 'six equal hexagonal docking towers around an open high-tension-mesh swarm enclosure and Consensus Needle', operationalMovement: 'coordinated drone constellations, shifting machine-readable landmarks, and mobile sensor pods' },
  { code: 'R5', name: 'Symbiont Conservatory', subtitle: 'Biohybrid and Living Robotics Laboratory', purpose: 'Living muscle, neurons, responsive tissues, biological actuators, organism-machine interfaces, and cultivated robots', form: 'symbiont', footprintMetres: [156, 118], heightMetres: 76, radialT: 0.12, angularT: 0.50, placementZone: 'controlled biological interface toward OMICS', exteriorMotif: 'three lens pavilions nested under a branching transparent shell with culture-media tubes and biosafety basins', operationalMovement: 'fluid-front indicators, frame-crawling maintenance robots, incubator lanterns, and aquatic monitors' },
  { code: 'R6', name: 'Magnetotaxis Vault', subtitle: 'Medical Micro- and Nanorobotics Research Centre', purpose: 'Magnetic and acoustic microrobots, targeted delivery, microscale manipulation, soft medical robots, and confined-fluid navigation', form: 'magnetotaxis', footprintMetres: [142, 126], heightMetres: 92, radialT: 0.84, angularT: 0.54, placementZone: 'vibration-isolated microsystems plaza', exteriorMotif: 'a buried black dome surrounded by six monumental copper-banded field arches and four acoustic pylons', operationalMovement: 'drifting field geometry, responsive-liquid calibration, and acoustic interference displays' },
  { code: 'R7', name: 'Avatar Spine', subtitle: 'Telepresence, Haptics and Robotic Embodiment Institute', purpose: 'Remote robotic avatars, full-body teleoperation, haptic feedback, exoskeleton control, shared autonomy, and remote science', form: 'avatar', footprintMetres: [138, 108], heightMetres: 152, radialT: 0.12, angularT: 0.67, placementZone: 'Guest Scientists public interface', exteriorMotif: 'paired leaning dark and translucent towers linked under tension by three sensor-lattice bridges', operationalMovement: 'Echo Armature posture mirroring, synchronized facade silhouettes, and bridge inspection robots' },
  { code: 'R8', name: 'Terminus Range', subtitle: 'Extreme-Environment and Disaster Robotics Facility', purpose: 'Search-and-rescue, subterranean, deep-sea, polar, planetary, and autonomous inspection robotics', form: 'terminus', footprintMetres: [176, 132], heightMetres: 94, radialT: 0.88, angularT: 0.74, placementZone: 'southern heavy-service and hostile-terrain edge', exteriorMotif: 'four scarred armoured hangars around a rearrangeable Failure Canyon and compressed hostile terrain', operationalMovement: 'test-crane traversal, hazard boundaries, wash-down frames, and autonomous endurance routes' },
  { code: 'R9', name: 'Autopoiesis Yard', subtitle: 'Autonomous Construction and Robotic Fabrication Hall', purpose: 'Robotic assembly, large-scale additive manufacturing, autonomous building, voxel construction, and self-climbing machines', form: 'autopoiesis', footprintMetres: [188, 132], heightMetres: 88, radialT: 0.05, angularT: 0.85, placementZone: 'distributed-construction demonstration front', exteriorMotif: 'an open fabrication hall with sliding space-frame roof, interchangeable facade bays, gantries, and unfinished prototypes', operationalMovement: 'bridge-gantry fabrication, rail carriers, climbing maintenance robots, and replaceable building bays' },
  { code: 'R10', name: 'Palingenesis Works', subtitle: 'Modular, Evolutionary and Self-Repairing Robotics Laboratory', purpose: 'Self-reconfiguring robots, modular bodies, autonomous repair, machine ecology, and long-duration adaptive systems', form: 'palingenesis', footprintMetres: [158, 136], heightMetres: 82, radialT: 0.92, angularT: 0.95, placementZone: 'self-repairing terminal court', exteriorMotif: 'twelve mismatched annular modules, exposed scar plates, a circular service rail, Parts Trees, and central sorting tower', operationalMovement: 'facade-module servicing, component exchange, repair-nest traffic, and autonomous parts redistribution' },
] as const;

const DISTRICT_ID = 'robotics-labs';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_20 = new THREE.CylinderGeometry(0.5, 0.5, 1, 20);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 14, 9);
const UNIT_DOME = new THREE.SphereGeometry(0.5, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_X = new THREE.Vector3(1, 0, 0);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

type RoboticsMaterials = ReturnType<typeof createRoboticsMaterials>;

function districtMaterial(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ name, color, roughness: 0.58, metalness: 0.14, ...options });
}

function createRoboticsMaterials() {
  const ceramic = districtMaterial('Robotics pale ceramic composite', '#deddd5', { roughness: 0.58, metalness: 0.04 });
  const warmCeramic = districtMaterial('Robotics warm repair ceramic', '#b8ad9e', { roughness: 0.7, metalness: 0.04 });
  const concrete = districtMaterial('Robotics fibre reinforced concrete', '#676b6b', { roughness: 0.92, metalness: 0.03 });
  const graphite = districtMaterial('Robotics graphite structural shell', '#151b1e', { roughness: 0.68, metalness: 0.58 });
  const titanium = districtMaterial('Robotics dark titanium exoskeleton', '#252d30', { roughness: 0.34, metalness: 0.9 });
  const silver = districtMaterial('Robotics brushed service alloy', '#aeb8b8', { roughness: 0.28, metalness: 0.9 });
  const copper = districtMaterial('Robotics field-shaping copper alloy', '#a9693d', { roughness: 0.35, metalness: 0.86 });
  const blackGlass = districtMaterial('Robotics graphite photovoltaic glass', '#081317', { emissive: '#102c31', emissiveIntensity: 0.15, roughness: 0.07, metalness: 0.28, transparent: true, opacity: 0.82, side: THREE.DoubleSide });
  const clearGlass = districtMaterial('Robotics transparent safety glass', '#8fbfc3', { emissive: '#245a60', emissiveIntensity: 0.12, roughness: 0.04, metalness: 0.05, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false });
  const membrane = districtMaterial('Robotics reinforced adaptive membrane', '#a9d2c9', { emissive: '#315e59', emissiveIntensity: 0.18, roughness: 0.28, metalness: 0.02, transparent: true, opacity: 0.66, side: THREE.DoubleSide });
  const bioGlass = districtMaterial('Robotics biohybrid fluoropolymer shell', '#c7e2ce', { emissive: '#3b684b', emissiveIntensity: 0.2, roughness: 0.12, metalness: 0.02, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false });
  const water = districtMaterial('Robotics monitored black water', '#071b20', { emissive: '#0d363e', emissiveIntensity: 0.18, roughness: 0.06, metalness: 0.08, transparent: true, opacity: 0.83 });
  const paving = districtMaterial('Kinematic Walk pale machine-readable paving', '#aeb1ab', { roughness: 0.9, metalness: 0.04 });
  const lane = districtMaterial('Kinematic Walk autonomous-machine lane', '#262c2d', { roughness: 0.86, metalness: 0.08 });
  const rubber = districtMaterial('Robotics variable-compliance test rubber', '#313a37', { roughness: 0.96, metalness: 0 });
  const hazard = districtMaterial('Robotics functional hazard amber', '#ff9d52', { emissive: '#d96212', emissiveIntensity: 2.2, roughness: 0.18, metalness: 0.08 });
  const cool = districtMaterial('Robotics active-test cool white', '#eaffff', { emissive: '#a5eeec', emissiveIntensity: 2.5, roughness: 0.08, metalness: 0.04 });
  const cyan = districtMaterial('Robotics machine-state cyan', '#6de0e2', { emissive: '#1ea6ae', emissiveIntensity: 2.35, roughness: 0.08, metalness: 0.06 });
  const violet = districtMaterial('Robotics biohybrid state violet', '#b69af1', { emissive: '#6541bd', emissiveIntensity: 2.1, roughness: 0.08, metalness: 0.05 });
  const red = districtMaterial('Robotics active boundary red', '#ff5c4d', { emissive: '#bd201b', emissiveIntensity: 2.4, roughness: 0.1, metalness: 0.04 });
  [hazard, cool, cyan, violet, red].forEach((material) => { material.userData.isDistrictAccent = true; });
  return { ceramic, warmCeramic, concrete, graphite, titanium, silver, copper, blackGlass, clearGlass, membrane, bioGlass, water, paving, lane, rubber, hazard, cool, cyan, violet, red };
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
  const geometry = segments === 8 ? UNIT_CYLINDER_8 : segments === 12 ? UNIT_CYLINDER_12 : UNIT_CYLINDER_20;
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

function dome(parent: THREE.Object3D, name: string, scale: readonly [number, number, number], material: THREE.Material, position: readonly [number, number, number], obstacle = false) {
  const mesh = prepare(new THREE.Mesh(UNIT_DOME, material), name, obstacle);
  mesh.scale.set(...scale); mesh.position.set(...position); parent.add(mesh); return mesh;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, material: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [0, 0, 0], arc = Math.PI * 2, radialSegments = 8, tubularSegments = 40) {
  const key = `${radius.toFixed(3)}:${tube.toFixed(3)}:${arc.toFixed(3)}:${radialSegments}:${tubularSegments}`;
  let geometry = TORUS_CACHE.get(key);
  if (!geometry) { geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc); TORUS_CACHE.set(key, geometry); }
  const mesh = prepare(new THREE.Mesh(geometry, material), name); mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}

function pipe(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material, obstacle = false) {
  const delta = end.clone().sub(start); const mesh = cylinder(parent, name, radius * 2, delta.length(), material, start.clone().add(end).multiplyScalar(0.5).toArray() as [number, number, number], obstacle, 8);
  mesh.quaternion.setFromUnitVectors(UNIT_Y, delta.normalize()); return mesh;
}

function slabBetween(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, width: number, height: number, material: THREE.Material, obstacle = false) {
  const delta = end.clone().sub(start); const mesh = box(parent, name, [width, height, delta.length()], material, start.clone().add(end).multiplyScalar(0.5).toArray() as [number, number, number], obstacle);
  mesh.quaternion.setFromUnitVectors(UNIT_X, delta.normalize()).multiply(new THREE.Quaternion().setFromAxisAngle(UNIT_Y, Math.PI / 2)); return mesh;
}

function pulse(object: THREE.Object3D, speed: number, phase = 0, minIntensity = 0.2, maxIntensity = 3.8) {
  object.userData.animate = 'robotics-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate(object: THREE.Object3D, speed: number, axis: 'x' | 'y' | 'z' = 'y', operationalPurpose = 'active robotic mechanism') {
  object.userData.animate = 'robotics-rotation'; object.userData.speed = speed; object.userData.axis = axis; object.userData.operationalPurpose = operationalPurpose; return object;
}

function transit(object: THREE.Object3D, path: readonly THREE.Vector3[], speed: number, phase: number, operationalPurpose: string) {
  object.userData.animate = 'robotics-path-transit'; object.userData.path = path.map((point) => point.toArray()); object.userData.speed = speed; object.userData.phase = phase; object.userData.operationalPurpose = operationalPurpose; return object;
}

function createCorpusNexus(_record: RoboticsBuildingProgram, m: RoboticsMaterials) {
  const root = new THREE.Group(); root.name = 'ROBOTICS__R1__CORPUS_NEXUS';
  box(root, 'ROBOTICS__R1__FOUNDATION', [10.8, 0.7, 7.5], m.concrete, [0, 0.35, 0], true);
  box(root, 'ROBOTICS__R1__INCLINED_CENTRAL_SPINE', [1.45, 15.4, 2.1], m.graphite, [0.8, 8.0, -0.2], true, [0, 0, -0.055]);
  for (let level = 0; level < 7; level += 1) {
    const y = 1.7 + level * 2.0; const angle = (level - 3) * 0.055; const width = 8.8 - level * 0.18; const depth = 4.5 + (level % 2) * 0.6;
    box(root, `ROBOTICS__R1__ROTATED_RESEARCH_SLAB_${level + 1}`, [width, 1.25, depth], level % 3 === 1 ? m.ceramic : m.blackGlass, [(level - 3) * 0.18, y, 0], true, [0, angle, 0]);
    box(root, `ROBOTICS__R1__OBSERVATION_BAND_${level + 1}`, [width * 0.78, 0.22, depth + 0.04], m.blackGlass, [(level - 3) * 0.18, y + 0.3, 0], false, [0, angle, 0]);
    for (const side of [-1, 1]) box(root, `ROBOTICS__R1__STAGGERED_TERRACE_${level + 1}_${side < 0 ? 'WEST' : 'EAST'}`, [1.45, 0.12, 3.3], m.silver, [side * (width * 0.54), y - 0.52, level % 2 ? -0.25 : 0.25], false, [0, angle, 0]);
  }
  for (const side of [-1, 1]) {
    const x = side * 5.45;
    for (let segment = 0; segment < 6; segment += 1) {
      const lower = new THREE.Vector3(x + side * (segment % 2) * 0.35, 0.9 + segment * 2.35, 2.7);
      const upper = new THREE.Vector3(x + side * ((segment + 1) % 2) * 0.35, 3.0 + segment * 2.35, 2.45);
      pipe(root, `ROBOTICS__R1__ARTICULATED_EXOSKELETON_MEMBER_${side < 0 ? 'W' : 'E'}_${segment + 1}`, lower, upper, 0.2, m.titanium, true);
      cylinder(root, `ROBOTICS__R1__EXOSKELETON_JOINT_${side < 0 ? 'W' : 'E'}_${segment + 1}`, 0.72, 0.38, m.copper, upper.toArray() as [number, number, number], false, 12, [Math.PI / 2, 0, 0]);
      pulse(ellipsoid(root, `ROBOTICS__R1__LOAD_TRANSFER_LIGHT_${side < 0 ? 'W' : 'E'}_${segment + 1}`, [0.14, 0.14, 0.14], m.cool.clone(), [upper.x, upper.y, upper.z + 0.23]), 0.0065, segment * 0.45 + side);
    }
  }
  for (let portal = 0; portal < 3; portal += 1) {
    box(root, `ROBOTICS__R1__HUMANOID_TEST_PORTAL_${portal + 1}`, [2.2, 2.6, 0.35], m.graphite, [-3.1 + portal * 3.1, 1.45, 3.83], true);
    pulse(box(root, `ROBOTICS__R1__PORTAL_THRESHOLD_${portal + 1}`, [1.75, 0.06, 0.18], m.cool.clone(), [-3.1 + portal * 3.1, 0.13, 4.08]), 0.008, portal * 0.8);
  }
  for (let course = 0; course < 14; course += 1) {
    const x = -6.2 + course * 0.95; const material = [m.paving, m.rubber, m.concrete, m.silver][course % 4];
    box(root, `ROBOTICS__R1__ANTHROPOMORPHIC_TERRAIN_${course + 1}`, [0.72, 0.08 + (course % 3) * 0.09, 1.2 + (course % 2) * 0.42], material, [x, 0.1 + (course % 3) * 0.045, 5.25 + (course % 2) * 0.4]);
  }
  for (let level = 0; level < 6; level += 1) {
    box(root, `ROBOTICS__R1__VERTICAL_LOCOMOTION_BALCONY_${level + 1}`, [2.6, 0.12, 1.1], m.silver, [4.2, 2.2 + level * 2.05, -2.6 + (level % 2) * 0.5]);
    pipe(root, `ROBOTICS__R1__VERTICAL_LOCOMOTION_LADDER_${level + 1}`, new THREE.Vector3(5.0, 1.25 + level * 2.05, -2.2), new THREE.Vector3(5.0, 3.15 + level * 2.05, -2.2), 0.05, m.titanium);
  }
  for (let beacon = 0; beacon < 8; beacon += 1) {
    const angle = beacon / 8 * Math.PI * 2;
    cylinder(root, `ROBOTICS__R1__MOTION_CAPTURE_CROWN_${beacon + 1}`, 0.09, 1.25, m.silver, [Math.cos(angle) * 2.8, 15.4, Math.sin(angle) * 1.6], false, 8);
    pulse(ellipsoid(root, `ROBOTICS__R1__CROWN_BEACON_${beacon + 1}`, [0.12, 0.12, 0.12], m.cool.clone(), [Math.cos(angle) * 2.8, 16.05, Math.sin(angle) * 1.6]), 0.006, beacon * 0.55);
  }
  return root;
}

function createTactusHall(_record: RoboticsBuildingProgram, m: RoboticsMaterials) {
  const root = new THREE.Group(); root.name = 'ROBOTICS__R2__TACTUS_HALL';
  box(root, 'ROBOTICS__R2__RAISED_INSTRUMENT_BODY', [16.8, 3.4, 4.9], m.ceramic, [0, 2.25, -0.3], true);
  for (const side of [-1, 1]) box(root, `ROBOTICS__R2__TAPERED_END_${side < 0 ? 'WEST' : 'EAST'}`, [2.1, 3.0, 4.1], m.warmCeramic, [side * 8.1, 2.25, -0.3], true, [0, side * 0.08, 0]);
  for (let tile = 0; tile < 120; tile += 1) {
    const column = tile % 20; const row = Math.floor(tile / 20); const side = row < 3 ? 1 : -1; const vertical = row % 3;
    const sensor = box(root, `ROBOTICS__R2__PRESSURE_SKIN_TILE_${tile + 1}`, [0.72, 0.72, 0.055], tile % 11 === 0 ? m.warmCeramic : m.ceramic, [-7.25 + column * 0.76, 1.25 + vertical * 0.78, side * 2.18 - 0.3]);
    if (tile % 9 === 0) pulse(sensor, 0.009, tile * 0.21, 0.08, 1.4);
  }
  for (const z of [-2.49, 1.89]) for (const y of [1.55, 2.7]) box(root, `ROBOTICS__R2__BLACK_GLASS_SENSORY_BAND_${z}_${y}`, [14.8, 0.28, 0.08], m.blackGlass, [0, y, z]);
  for (let support = 0; support < 24; support += 1) {
    const x = -8.05 + support * 0.7; const lower = new THREE.Vector3(x, 0.22, 3.45); const upper = new THREE.Vector3(x + (support % 2 ? 0.05 : -0.05), 1.1, 3.25);
    pipe(root, `ROBOTICS__R2__ARTICULATED_CANOPY_SUPPORT_${support + 1}`, lower, upper, 0.055, support % 4 === 0 ? m.copper : m.titanium);
    cylinder(root, `ROBOTICS__R2__CANOPY_JOINT_${support + 1}`, 0.2, 0.12, m.silver, upper.toArray() as [number, number, number], false, 8, [Math.PI / 2, 0, 0]);
  }
  box(root, 'ROBOTICS__R2__ADAPTIVE_PUBLIC_CANOPY', [17.2, 0.12, 2.2], m.silver, [0, 1.15, 3.85], false, [0, 0, -0.008]);
  for (let port = 0; port < 10; port += 1) {
    const x = -6.8 + port * 1.5; cylinder(root, `ROBOTICS__R2__IRIS_MANIPULATOR_PORT_${port + 1}`, 0.42, 0.12, m.graphite, [x, 2.4, 2.22], false, 12, [Math.PI / 2, 0, 0]);
    const shoulder = new THREE.Vector3(x, 2.35, 2.5); const elbow = new THREE.Vector3(x + (port % 2 ? 0.45 : -0.45), 1.85, 3.0); const wrist = new THREE.Vector3(x + (port % 2 ? 0.7 : -0.7), 1.45, 3.55);
    pipe(root, `ROBOTICS__R2__EXTERIOR_MANIPULATOR_UPPER_${port + 1}`, shoulder, elbow, 0.07, m.silver); pipe(root, `ROBOTICS__R2__EXTERIOR_MANIPULATOR_FOREARM_${port + 1}`, elbow, wrist, 0.055, m.titanium);
  }
  box(root, 'ROBOTICS__R2__CONTACT_GARDEN', [16.8, 0.09, 2.5], m.paving, [0, 0.07, 5.2]);
  for (let sample = 0; sample < 28; sample += 1) box(root, `ROBOTICS__R2__CONTACT_SAMPLE_${sample + 1}`, [0.38 + (sample % 3) * 0.08, 0.16 + (sample % 5) * 0.07, 0.38], [m.concrete, m.rubber, m.copper, m.ceramic][sample % 4], [-7.4 + sample * 0.55, 0.18 + (sample % 5) * 0.035, 5.15 + (sample % 2) * 0.55]);
  box(root, 'ROBOTICS__R2__LINEAR_MANIPULATION_POOL', [15.8, 0.1, 0.82], m.water, [0, 0.08, 6.85]);
  return root;
}

function createMyomerPavilion(_record: RoboticsBuildingProgram, m: RoboticsMaterials) {
  const root = new THREE.Group(); root.name = 'ROBOTICS__R3__MYOMER_PAVILION';
  const lobes: readonly [number, number, number, number, number][] = [[-4.7, 2.0, -0.5, 6.2, 3.5], [-1.8, 2.6, 0.4, 7.0, 4.6], [2.0, 2.2, -0.3, 6.8, 3.8], [5.2, 1.7, 0.6, 5.0, 3.0], [0.4, 1.35, 2.9, 8.6, 2.5]];
  lobes.forEach(([x, y, z, width, height], index) => {
    ellipsoid(root, `ROBOTICS__R3__ADAPTIVE_MEMBRANE_LOBE_${index + 1}`, [width, height, 4.2 + (index % 2)], m.membrane, [x, y, z], true);
    for (let channel = 0; channel < 5; channel += 1) pipe(root, `ROBOTICS__R3__VISIBLE_FLUID_CHANNEL_${index + 1}_${channel + 1}`, new THREE.Vector3(x - width * 0.35, 1.1 + channel * 0.55, z + 2.0), new THREE.Vector3(x + width * 0.35, 1.3 + channel * 0.5, z + 2.0), 0.035, channel % 2 ? m.cyan : m.violet);
  });
  box(root, 'ROBOTICS__R3__BLACK_UTILITY_SPINE', [12.5, 1.25, 1.1], m.graphite, [0, 0.75, -3.65], true);
  for (let arch = 0; arch < 8; arch += 1) {
    const x = -7.0 + arch * 2.0; const radius = 1.15 + (arch % 4) * 0.23;
    torus(root, `ROBOTICS__R3__VARIABLE_STIFFNESS_ARCH_${arch + 1}`, radius, 0.12, arch % 3 === 0 ? m.copper : m.titanium, [x, 0.18, 5.25 + (arch % 2) * 0.35], [0, 0, 0], Math.PI, 8, 24);
    pulse(ellipsoid(root, `ROBOTICS__R3__ARCH_PRESSURE_NODE_${arch + 1}`, [0.13, 0.13, 0.13], m.cyan.clone(), [x, radius + 0.2, 5.25 + (arch % 2) * 0.35]), 0.0055, arch * 0.6);
  }
  box(root, 'ROBOTICS__R3__ARTIFICIAL_MUSCLE_CANOPY', [11.8, 0.16, 2.0], m.clearGlass, [0, 2.25, 4.0]);
  for (let bundle = 0; bundle < 12; bundle += 1) {
    const x = -5.3 + bundle * 0.96;
    cylinder(root, `ROBOTICS__R3__ARTIFICIAL_MUSCLE_CYLINDER_${bundle + 1}`, 0.34, 2.1, m.clearGlass, [x, 1.15, 4.0], false, 12);
    for (let fibre = 0; fibre < 3; fibre += 1) pipe(root, `ROBOTICS__R3__BRAIDED_MUSCLE_FIBRE_${bundle + 1}_${fibre + 1}`, new THREE.Vector3(x - 0.07 + fibre * 0.07, 0.15, 3.97), new THREE.Vector3(x + 0.07 - fibre * 0.07, 2.15, 4.03), 0.025, fibre === 1 ? m.violet : m.copper);
  }
  for (let scar = 0; scar < 18; scar += 1) box(root, `ROBOTICS__R3__DATED_SELF_REPAIR_SCAR_${scar + 1}`, [0.4 + (scar % 4) * 0.12, 0.07, 0.18], scar % 3 === 0 ? m.warmCeramic : m.violet, [-5.8 + (scar % 9) * 1.45, 2.1 + Math.floor(scar / 9) * 1.0, 3.05], false, [0, 0, (scar % 5 - 2) * 0.1]);
  return root;
}

function createMurmurationArray(_record: RoboticsBuildingProgram, m: RoboticsMaterials) {
  const root = new THREE.Group(); root.name = 'ROBOTICS__R4__MURMURATION_ARRAY';
  for (let tower = 0; tower < 6; tower += 1) {
    const angle = tower / 6 * Math.PI * 2; const x = Math.cos(angle) * 5.2; const z = Math.sin(angle) * 4.2; const height = 5.2 + (tower % 3) * 0.7;
    cylinder(root, `ROBOTICS__R4__HEXAGONAL_SWARM_TOWER_${tower + 1}`, 3.1, height, m.graphite, [x, height * 0.5, z], true, 8);
    box(root, `ROBOTICS__R4__MACHINE_READABLE_TOWER_PATTERN_${tower + 1}`, [1.7, 1.2, 0.08], tower % 2 ? m.cool : m.cyan, [x, height * 0.62, z + (z >= 0 ? 1.58 : -1.58)], false, [0, -angle, 0]);
    for (let aperture = 0; aperture < 16; aperture += 1) {
      const apertureAngle = aperture / 16 * Math.PI * 2; const y = 0.8 + (aperture % 4) * 0.95;
      cylinder(root, `ROBOTICS__R4__DOCKING_APERTURE_${tower + 1}_${aperture + 1}`, 0.22 + (aperture % 3) * 0.04, 0.1, aperture % 5 === 0 ? m.hazard : m.blackGlass, [x + Math.cos(apertureAngle) * 1.58, y, z + Math.sin(apertureAngle) * 1.58], false, 8, [Math.PI / 2, 0, apertureAngle]);
    }
  }
  box(root, 'ROBOTICS__R4__MULTI_DOMAIN_TEST_PLAZA', [8.4, 0.12, 7.0], m.lane, [0, 0.08, 0]);
  for (let plate = 0; plate < 36; plate += 1) {
    const column = plate % 6; const row = Math.floor(plate / 6); const x = -3.45 + column * 1.38; const z = -2.85 + row * 1.14;
    box(root, `ROBOTICS__R4__MOVABLE_TRIANGULATED_TEST_PLATE_${plate + 1}`, [1.18, 0.06 + (plate % 4) * 0.025, 0.92], plate % 7 === 0 ? m.silver : m.concrete, [x, 0.17 + (plate % 4) * 0.0125, z], false, [0, (plate % 2) * Math.PI / 6, 0]);
  }
  for (const x of [-5.6, 5.6]) for (const z of [-4.8, 4.8]) {
    const sign = `${x < 0 ? 'W' : 'E'}${z < 0 ? 'N' : 'S'}`; cylinder(root, `ROBOTICS__R4__OPEN_SWARM_VOLUME_MAST_${sign}`, 0.28, 9.6, m.titanium, [x, 4.8, z], true, 8, [0, 0, x * 0.004]);
    for (let ring = 0; ring < 3; ring += 1) torus(root, `ROBOTICS__R4__MAST_MAINTENANCE_RING_${sign}_${ring + 1}`, 0.62, 0.055, m.silver, [x, 2.6 + ring * 2.3, z], [Math.PI / 2, 0, 0], Math.PI * 2, 6, 18);
  }
  for (let wire = 0; wire < 8; wire += 1) pipe(root, `ROBOTICS__R4__HIGH_TENSION_SWARM_MESH_${wire + 1}`, new THREE.Vector3(-5.5 + wire * 1.55, 8.2, -4.75), new THREE.Vector3(-5.5 + wire * 1.55, 8.2, 4.75), 0.012, m.clearGlass);
  const needle = new THREE.Group(); needle.name = 'ROBOTICS__R4__CONSENSUS_NEEDLE'; needle.position.set(0, 0, -6.0); root.add(needle);
  cylinder(needle, 'ROBOTICS__R4__CONSENSUS_NEEDLE_SPINE', 0.22, 11.5, m.titanium, [0, 5.75, 0], true, 8);
  for (let rod = 0; rod < 22; rod += 1) pipe(needle, `ROBOTICS__R4__CONSENSUS_NEEDLE_ROD_${rod + 1}`, new THREE.Vector3(0, 1.2 + rod * 0.43, 0), new THREE.Vector3((rod % 2 ? 1 : -1) * (0.45 + rod % 4 * 0.22), 1.4 + rod * 0.43, (rod % 3 - 1) * 0.35), 0.025, rod % 4 === 0 ? m.cyan : m.silver);
  rotate(needle, 0.012, 'y', 'Consensus Needle atmospheric and timing alignment');
  for (let drone = 0; drone < 24; drone += 1) {
    const angle = drone / 24 * Math.PI * 2; const radius = 2.2 + (drone % 5) * 0.62; const y = 2.2 + (drone % 6) * 0.75;
    const craft = ellipsoid(root, `ROBOTICS__R4__COORDINATED_SWARM_DRONE_${drone + 1}`, [0.22, 0.07, 0.16], m.graphite, [Math.cos(angle) * radius, y, Math.sin(angle) * radius]);
    pulse(ellipsoid(root, `ROBOTICS__R4__DRONE_POSITION_LIGHT_${drone + 1}`, [0.045, 0.045, 0.045], (drone % 4 ? m.cool : m.hazard).clone(), [craft.position.x, y + 0.08, craft.position.z]), 0.012, drone * 0.36);
  }
  return root;
}

function createSymbiontConservatory(_record: RoboticsBuildingProgram, m: RoboticsMaterials) {
  const root = new THREE.Group(); root.name = 'ROBOTICS__R5__SYMBIONT_CONSERVATORY';
  box(root, 'ROBOTICS__R5__STERILE_FOUNDATION', [13.4, 0.55, 9.2], m.ceramic, [0, 0.28, 0], true);
  const pavilions: readonly [number, number, number, number][] = [[-4.0, 0.2, 5.8, 0], [0, -0.8, 6.4, 1], [4.0, 0.45, 5.5, 2]];
  pavilions.forEach(([x, z, width, style], index) => {
    ellipsoid(root, `ROBOTICS__R5__LENS_PAVILION_${index + 1}`, [width, 3.8 + index * 0.3, 4.7], style === 2 ? m.blackGlass : style === 1 ? m.membrane : m.bioGlass, [x, 2.6, z], true);
    for (let rib = 0; rib < 7; rib += 1) torus(root, `ROBOTICS__R5__PAVILION_RIB_${index + 1}_${rib + 1}`, 2.0 + rib * 0.08, 0.055, style === 1 ? m.copper : m.ceramic, [x - 1.2 + rib * 0.4, 0.35, z + 1.8], [0, Math.PI / 2, 0], Math.PI, 6, 18);
  });
  dome(root, 'ROBOTICS__R5__TRANSPARENT_ENVIRONMENTAL_SHELL', [15.0, 8.6, 10.8], m.bioGlass, [0, 0.45, 0], false);
  for (let frame = 0; frame < 16; frame += 1) {
    const angle = frame / 16 * Math.PI * 2; const base = new THREE.Vector3(Math.cos(angle) * 6.6, 0.45, Math.sin(angle) * 4.5); const branch = new THREE.Vector3(Math.cos(angle) * 5.2, 4.0 + (frame % 3) * 0.45, Math.sin(angle) * 3.8);
    pipe(root, `ROBOTICS__R5__BRANCHING_SHELL_FRAME_${frame + 1}`, base, branch, 0.075, m.ceramic);
  }
  for (let tube = 0; tube < 18; tube += 1) {
    const x = -6.2 + tube * 0.73; const height = 2.1 + (tube % 5) * 0.35;
    cylinder(root, `ROBOTICS__R5__CULTURE_MEDIA_TUBE_${tube + 1}`, 0.26, height, m.clearGlass, [x, height * 0.5 + 0.5, 4.1], false, 12);
    pulse(cylinder(root, `ROBOTICS__R5__CULTURE_FLUID_FRONT_${tube + 1}`, 0.16, 0.24 + (tube % 3) * 0.14, tube % 2 ? m.violet.clone() : m.cyan.clone(), [x, 0.75 + (tube % 5) * 0.42, 4.1], false, 12), 0.0045, tube * 0.42, 0.18, 1.8);
  }
  box(root, 'ROBOTICS__R5__BLACK_REFLECTIVE_BIOSAFETY_BASIN', [12.2, 0.11, 2.4], m.water, [0, 0.13, 6.4]);
  box(root, 'ROBOTICS__R5__ENTRY_BRIDGE', [2.0, 0.13, 3.2], m.silver, [0, 0.25, 6.15]);
  for (let arch = 0; arch < 4; arch += 1) torus(root, `ROBOTICS__R5__ULTRAVIOLET_DECONTAMINATION_ARCH_${arch + 1}`, 1.1, 0.07, m.violet, [-5.1 + arch * 3.4, 0.2, -5.0], [0, 0, 0], Math.PI, 6, 20);
  for (let lantern = 0; lantern < 9; lantern += 1) pulse(box(root, `ROBOTICS__R5__INCUBATOR_ROOF_LANTERN_${lantern + 1}`, [0.72, 1.0 + (lantern % 3) * 0.22, 0.72], (lantern % 3 ? m.cool : m.violet).clone(), [-4.8 + lantern * 1.2, 6.0 + (lantern % 3) * 0.2, -0.4 + (lantern % 2) * 0.9]), 0.004, lantern * 0.5, 0.12, 1.4);
  return root;
}

function createMagnetotaxisVault(_record: RoboticsBuildingProgram, m: RoboticsMaterials) {
  const root = new THREE.Group(); root.name = 'ROBOTICS__R6__MAGNETOTAXIS_VAULT';
  cylinder(root, 'ROBOTICS__R6__BURIED_ISOLATED_LAB_RING', 10.8, 1.3, m.graphite, [0, 0.65, 0], true, 20);
  dome(root, 'ROBOTICS__R6__MATTE_BLACK_SHALLOW_DOME', [10.0, 3.8, 10.0], m.blackGlass, [0, 0.8, 0], true);
  for (let bearing = 0; bearing < 12; bearing += 1) {
    const angle = bearing / 12 * Math.PI * 2; cylinder(root, `ROBOTICS__R6__SEISMIC_ISOLATION_BEARING_${bearing + 1}`, 0.52, 0.32, bearing % 2 ? m.silver : m.copper, [Math.cos(angle) * 5.1, 0.16, Math.sin(angle) * 5.1], false, 12);
  }
  for (let arch = 0; arch < 6; arch += 1) {
    const rotation = arch / 6 * Math.PI; torus(root, `ROBOTICS__R6__FIELD_SHAPING_ARCH_${arch + 1}`, 6.4, 0.28, m.graphite, [0, 0.28, 0], [0, rotation, 0], Math.PI, 10, 40);
    for (let band = 0; band < 5; band += 1) {
      const t = (band + 1) / 6 * Math.PI; const x = Math.cos(t) * 6.4; const y = Math.sin(t) * 6.4 + 0.28; const local = new THREE.Vector3(x, y, 0).applyAxisAngle(UNIT_Y, rotation);
      torus(root, `ROBOTICS__R6__COPPER_ARCH_BAND_${arch + 1}_${band + 1}`, 0.42, 0.08, band % 2 ? m.copper : m.ceramic, local.toArray() as [number, number, number], [Math.PI / 2, rotation, 0], Math.PI * 2, 6, 16);
    }
  }
  cylinder(root, 'ROBOTICS__R6__RESPONSIVE_LIQUID_BEACON', 1.15, 4.2, m.clearGlass, [0, 4.25, 0], false, 20);
  const calibration = taperedCylinder(root, 'ROBOTICS__R6__DARK_FIELD_CALIBRATION_LIQUID', 0.78, 0.25, 3.5, 20, m.violet, [0, 4.15, 0]);
  rotate(calibration, 0.018, 'y', 'responsive-liquid magnetic field calibration');
  for (let ring = 0; ring < 9; ring += 1) torus(root, `ROBOTICS__R6__PLAZA_FIELD_GEOMETRY_${ring + 1}`, 6.2 + ring * 0.55, 0.035, (ring % 3 ? m.copper : m.cyan).clone(), [0, 0.09 + ring * 0.004, 0], [Math.PI / 2, 0, ring * 0.03], Math.PI * (1.35 + (ring % 3) * 0.2), 6, 48);
  for (let pylon = 0; pylon < 4; pylon += 1) {
    const angle = Math.PI / 4 + pylon * Math.PI / 2; const x = Math.cos(angle) * 8.0; const z = Math.sin(angle) * 8.0;
    cylinder(root, `ROBOTICS__R6__ACOUSTIC_PYLON_${pylon + 1}`, 1.35, 2.7, m.ceramic, [x, 1.35, z], true, 12);
    for (let transducer = 0; transducer < 12; transducer += 1) cylinder(root, `ROBOTICS__R6__ACOUSTIC_TRANSDUCER_${pylon + 1}_${transducer + 1}`, 0.11, 0.08, m.graphite, [x + (transducer % 3 - 1) * 0.26, 0.65 + Math.floor(transducer / 3) * 0.46, z + (z > 0 ? 0.68 : -0.68)], false, 8, [Math.PI / 2, 0, 0]);
  }
  for (let ramp = 0; ramp < 3; ramp += 1) box(root, `ROBOTICS__R6__DOWNWARD_ACCESS_RAMP_${ramp + 1}`, [1.4, 0.12, 4.6], m.lane, [-3.6 + ramp * 3.6, 0.12, 7.0], false, [0.04, 0, 0]);
  return root;
}

function createAvatarSpine(_record: RoboticsBuildingProgram, m: RoboticsMaterials) {
  const root = new THREE.Group(); root.name = 'ROBOTICS__R7__AVATAR_SPINE';
  const towerX = 3.7;
  box(root, 'ROBOTICS__R7__DARK_AVATAR_TOWER', [4.5, 14.0, 5.0], m.graphite, [-towerX, 7.0, 0], true, [0, 0, -0.026]);
  box(root, 'ROBOTICS__R7__TRANSLUCENT_AVATAR_TOWER', [4.5, 14.0, 5.0], m.bioGlass, [towerX, 7.0, 0], true, [0, 0, 0.026]);
  for (let band = 0; band < 12; band += 1) {
    box(root, `ROBOTICS__R7__DARK_TOWER_SIGNAL_BAND_${band + 1}`, [4.1, 0.12, 5.05], band % 4 === 0 ? m.cyan : m.blackGlass, [-towerX, 1.1 + band * 1.05, 0], false, [0, 0, -0.026]);
    box(root, `ROBOTICS__R7__LIGHT_TOWER_SIGNAL_BAND_${band + 1}`, [4.1, 0.12, 5.05], band % 4 === 1 ? m.violet : m.clearGlass, [towerX, 1.1 + band * 1.05, 0], false, [0, 0, 0.026]);
  }
  [4.1, 7.6, 11.1].forEach((height, index) => {
    box(root, `ROBOTICS__R7__TENSION_BRIDGE_${index + 1}`, [4.5, 0.95, 2.1], index % 2 ? m.clearGlass : m.blackGlass, [0, height, 0], false);
    for (let lattice = 0; lattice < 7; lattice += 1) pipe(root, `ROBOTICS__R7__BRIDGE_SENSOR_LATTICE_${index + 1}_${lattice + 1}`, new THREE.Vector3(-2.25 + lattice * 0.75, height - 0.5, 1.1), new THREE.Vector3(-1.9 + lattice * 0.63, height + 0.5, 1.1), 0.025, lattice % 3 === 0 ? m.cyan : m.silver);
  });
  const armature = new THREE.Group(); armature.name = 'ROBOTICS__R7__ECHO_ARMATURE'; armature.position.set(-6.2, 0.3, 2.75); root.add(armature);
  for (let frame = 0; frame < 8; frame += 1) {
    const y = 1.0 + frame * 1.6; box(armature, `ROBOTICS__R7__ECHO_FRAME_${frame + 1}`, [2.4, 0.16, 1.3], frame % 3 === 0 ? m.copper : m.titanium, [(frame % 2 ? 0.35 : -0.35), y, 0], false, [0, frame * 0.11, (frame % 3 - 1) * 0.08]);
    cylinder(armature, `ROBOTICS__R7__ECHO_FRAME_JOINT_${frame + 1}`, 0.42, 0.28, m.silver, [0, y, 0], false, 12, [Math.PI / 2, 0, 0]);
  }
  rotate(armature, 0.007, 'y', 'reduced-scale teleoperator posture mirroring');
  cylinder(root, 'ROBOTICS__R7__EMBODIMENT_COURT_CAMERA_RIG', 10.6, 0.18, m.titanium, [0, 3.2, 5.2], false, 20, [Math.PI / 2, 0, 0]);
  box(root, 'ROBOTICS__R7__EMBODIMENT_COURT', [10.2, 0.08, 6.1], m.lane, [0, 0.08, 5.2]);
  for (let station = 0; station < 10; station += 1) box(root, `ROBOTICS__R7__EXTERIOR_HAPTIC_TEST_STATION_${station + 1}`, [0.65, 1.0 + (station % 4) * 0.32, 0.42], station % 2 ? m.ceramic : m.graphite, [-4.4 + station * 0.98, 0.55 + (station % 4) * 0.16, 7.0], true);
  for (let mast = 0; mast < 2; mast += 1) { cylinder(root, `ROBOTICS__R7__OPTICAL_RELAY_MAST_${mast + 1}`, 0.15, 3.2, m.silver, [mast ? 3.7 : -3.7, 15.6, 0], false, 8); pulse(box(root, `ROBOTICS__R7__LONG_DISTANCE_LINK_LIGHT_${mast + 1}`, [0.46, 0.65, 0.24], m.cool.clone(), [mast ? 3.7 : -3.7, 17.2, 0]), 0.004, mast * 1.5); }
  return root;
}

function createTerminusRange(_record: RoboticsBuildingProgram, m: RoboticsMaterials) {
  const root = new THREE.Group(); root.name = 'ROBOTICS__R8__TERMINUS_RANGE';
  const hangars: readonly [number, number, number][] = [[-4.8, -3.6, -0.11], [4.8, -3.6, 0.11], [-4.8, 3.4, 0.08], [4.8, 3.4, -0.08]];
  hangars.forEach(([x, z, tilt], index) => {
    box(root, `ROBOTICS__R8__ARMOURED_HANGAR_${index + 1}`, [7.2, 4.8, 5.2], index % 2 ? m.graphite : m.concrete, [x, 2.4, z], true);
    box(root, `ROBOTICS__R8__SLOPED_HANGAR_ROOF_${index + 1}`, [7.6, 0.6, 5.5], m.titanium, [x, 5.0, z], true, [0, 0, tilt]);
    for (let panel = 0; panel < 9; panel += 1) box(root, `ROBOTICS__R8__SACRIFICIAL_IMPACT_PANEL_${index + 1}_${panel + 1}`, [0.68, 0.75, 0.12], panel % 4 === 0 ? m.warmCeramic : m.silver, [x - 2.75 + panel * 0.68, 1.2 + (panel % 3) * 0.85, z + (z > 0 ? 2.63 : -2.63)], false);
    box(root, `ROBOTICS__R8__SEGMENTED_HANGAR_DOOR_${index + 1}`, [4.6, 3.3, 0.18], m.graphite, [x, 1.8, z + (z > 0 ? -2.68 : 2.68)], true);
    pulse(box(root, `ROBOTICS__R8__FUNCTIONAL_HAZARD_PERIMETER_${index + 1}`, [5.1, 0.08, 0.16], m.hazard.clone(), [x, 0.1, z + (z > 0 ? -2.9 : 2.9)]), 0.01, index * 0.7);
  });
  box(root, 'ROBOTICS__R8__FAILURE_CANYON_FLOOR', [8.6, 0.12, 7.8], m.lane, [0, 0.08, 0]);
  for (let debris = 0; debris < 28; debris += 1) {
    const angle = debris * 2.399; const radius = 1.0 + (debris % 7) * 0.55; const size = 0.45 + (debris % 5) * 0.16;
    box(root, `ROBOTICS__R8__ACTUATED_RUBBLE_BLOCK_${debris + 1}`, [size * 1.3, size, size], debris % 6 === 0 ? m.warmCeramic : m.concrete, [Math.cos(angle) * radius, size * 0.5 + 0.1, Math.sin(angle) * radius], true, [(debris % 3) * 0.12, angle, (debris % 4) * 0.08]);
  }
  for (let pipeIndex = 0; pipeIndex < 12; pipeIndex += 1) cylinder(root, `ROBOTICS__R8__INDUSTRIAL_PIPE_FOREST_${pipeIndex + 1}`, 0.28 + (pipeIndex % 3) * 0.08, 2.4 + (pipeIndex % 5) * 0.7, pipeIndex % 4 === 0 ? m.copper : m.titanium, [-7.2 + pipeIndex * 1.3, 1.2 + (pipeIndex % 5) * 0.35, 7.0], false, 8);
  box(root, 'ROBOTICS__R8__AMPHIBIOUS_TRANSITION_BASIN', [5.4, 0.1, 3.0], m.water, [-5.6, 0.09, -7.0]);
  box(root, 'ROBOTICS__R8__LOOSE_MATERIAL_TRACTION_SLOPE', [5.8, 0.7, 3.2], m.rubber, [5.6, 0.45, -7.0], false, [0.16, 0, 0]);
  const crane = new THREE.Group(); crane.name = 'ROBOTICS__R8__FAILURE_CANYON_RECONFIGURATION_CRANE'; root.add(crane);
  for (const x of [-4.1, 4.1]) cylinder(crane, `ROBOTICS__R8__CRANE_PYLON_${x < 0 ? 'W' : 'E'}`, 0.35, 8.4, m.titanium, [x, 4.2, 0], true, 8);
  box(crane, 'ROBOTICS__R8__CRANE_TRAVERSE', [9.0, 0.38, 0.5], m.hazard, [0, 8.15, 0]);
  rotate(crane, 0.0025, 'y', 'Failure Canyon overhead reconfiguration');
  return root;
}

function createAutopoiesisYard(_record: RoboticsBuildingProgram, m: RoboticsMaterials) {
  const root = new THREE.Group(); root.name = 'ROBOTICS__R9__AUTOPOIESIS_YARD';
  box(root, 'ROBOTICS__R9__OPEN_FABRICATION_FLOOR', [17.6, 0.14, 10.8], m.concrete, [0, 0.08, 0]);
  for (let pylon = 0; pylon < 6; pylon += 1) {
    const x = pylon < 3 ? -8.0 : 8.0; const z = -4.7 + (pylon % 3) * 4.7;
    cylinder(root, `ROBOTICS__R9__SPACE_FRAME_PYLON_${pylon + 1}`, 0.65, 7.8, m.titanium, [x, 3.9, z], true, 8);
  }
  for (let beam = 0; beam < 15; beam += 1) {
    const x = -7.6 + (beam % 5) * 3.8; const z = -4.4 + Math.floor(beam / 5) * 4.4;
    if (beam % 3 === 0) slabBetween(root, `ROBOTICS__R9__SLIDING_ROOF_FRAME_${beam + 1}`, new THREE.Vector3(-8.0, 7.5, z), new THREE.Vector3(8.0, 7.5, z), 0.18, 0.18, m.silver);
    else pipe(root, `ROBOTICS__R9__ROOF_DIAGONAL_${beam + 1}`, new THREE.Vector3(x, 7.35, -5.0), new THREE.Vector3(x + 3.5, 7.35, 5.0), 0.07, m.silver);
  }
  for (let bay = 0; bay < 10; bay += 1) {
    const x = -7.4 + bay * 1.65; const material = [m.clearGlass, m.warmCeramic, m.graphite, m.ceramic][bay % 4];
    box(root, `ROBOTICS__R9__INTERCHANGEABLE_FACADE_BAY_${bay + 1}`, [1.4, 3.6 + (bay % 3) * 0.5, 0.24], material, [x, 1.9 + (bay % 3) * 0.25, 5.25], bay % 4 !== 0);
    for (let socket = 0; socket < 4; socket += 1) cylinder(root, `ROBOTICS__R9__STANDARD_BAY_CONNECTION_${bay + 1}_${socket + 1}`, 0.13, 0.18, m.copper, [x - 0.45 + (socket % 2) * 0.9, 0.7 + Math.floor(socket / 2) * 2.4, 5.42], false, 8, [Math.PI / 2, 0, 0]);
  }
  for (let gantryIndex = 0; gantryIndex < 2; gantryIndex += 1) {
    const z = -2.8 + gantryIndex * 5.5; const gantry = new THREE.Group(); gantry.name = `ROBOTICS__R9__BRIDGE_FABRICATION_GANTRY_${gantryIndex + 1}`; root.add(gantry);
    for (const x of [-7.2, 7.2]) cylinder(gantry, `ROBOTICS__R9__GANTRY_LEG_${gantryIndex + 1}_${x < 0 ? 'W' : 'E'}`, 0.42, 6.5, m.hazard, [x, 3.25, z], true, 8);
    box(gantry, `ROBOTICS__R9__GANTRY_BEAM_${gantryIndex + 1}`, [15.0, 0.55, 0.68], m.titanium, [0, 6.2, z]);
    cylinder(gantry, `ROBOTICS__R9__INTERCHANGEABLE_FABRICATION_HEAD_${gantryIndex + 1}`, 0.68, 1.8, gantryIndex ? m.copper : m.silver, [gantryIndex ? 2.2 : -2.2, 5.0, z], false, 12);
    rotate(gantry, gantryIndex ? -0.0018 : 0.0018, 'y', 'bridge gantry alignment for autonomous fabrication');
  }
  for (let silo = 0; silo < 6; silo += 1) {
    const x = -7.2 + silo * 2.85; taperedCylinder(root, `ROBOTICS__R9__VISIBLE_MATERIAL_SILO_${silo + 1}`, 1.4, 1.1, 3.8 + (silo % 3) * 0.5, 12, silo % 2 ? m.silver : m.warmCeramic, [x, 2.0 + (silo % 3) * 0.25, -6.1], true);
    cylinder(root, `ROBOTICS__R9__SILO_FEED_CONDUIT_${silo + 1}`, 0.18, 2.3, m.copper, [x, 1.2, -4.7], false, 8, [Math.PI / 2, 0, 0]);
  }
  const prototypes: readonly [string, number, number, number][] = [['BRANCHING_BRIDGE', -6.4, 7.2, 2.2], ['EXPOSED_LATTICE_WALL', -3.2, 7.3, 2.8], ['CANTILEVER_STAIR', 0, 7.2, 3.2], ['VOXEL_SHELL', 3.2, 7.3, 2.6], ['CLIMBING_ROBOT_TOWER', 6.4, 7.2, 4.2]];
  prototypes.forEach(([name, x, z, height], index) => box(root, `ROBOTICS__R9__UNFINISHED_AVENUE_${name}`, [2.4, height, 1.3], index % 2 ? m.warmCeramic : m.silver, [x as number, (height as number) * 0.5, z as number], true, [0, index * 0.08, index % 2 ? 0.08 : -0.08]));
  return root;
}

function createPalingenesisWorks(_record: RoboticsBuildingProgram, m: RoboticsMaterials) {
  const root = new THREE.Group(); root.name = 'ROBOTICS__R10__PALINGENESIS_WORKS';
  const claddings = [m.graphite, m.bioGlass, m.ceramic, m.warmCeramic, m.silver, m.blackGlass];
  for (let module = 0; module < 12; module += 1) {
    const angle = module / 12 * Math.PI * 2; const radius = 4.9; const height = 3.9 + (module % 4) * 0.45; const x = Math.cos(angle) * radius; const z = Math.sin(angle) * radius;
    box(root, `ROBOTICS__R10__RECONFIGURABLE_ANNULAR_MODULE_${module + 1}`, [3.0, height, 3.3], claddings[module % claddings.length], [x, height * 0.5, z], true, [0, -angle, 0]);
    box(root, `ROBOTICS__R10__EXPOSED_MECHANICAL_INTERFACE_${module + 1}`, [0.48, 1.1, 3.45], module % 2 ? m.copper : m.titanium, [Math.cos(angle) * 4.55, 1.2, Math.sin(angle) * 4.55], false, [0, -angle, 0]);
    for (let scar = 0; scar < 2; scar += 1) box(root, `ROBOTICS__R10__DOCUMENTED_SCAR_PLATE_${module + 1}_${scar + 1}`, [0.72 + scar * 0.22, 0.42, 0.08], scar ? m.warmCeramic : m.copper, [Math.cos(angle) * 6.55, 1.35 + scar * 0.85, Math.sin(angle) * 6.55], false, [0, -angle, (module % 3 - 1) * 0.12]);
  }
  torus(root, 'ROBOTICS__R10__CIRCULAR_SERVICE_RAIL', 7.2, 0.13, m.titanium, [0, 0.25, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 8, 64);
  const serviceFrame = new THREE.Group(); serviceFrame.name = 'ROBOTICS__R10__ROBOTIC_SERVICE_FRAME'; root.add(serviceFrame);
  for (const side of [-1, 1]) cylinder(serviceFrame, `ROBOTICS__R10__SERVICE_FRAME_LEG_${side < 0 ? 'L' : 'R'}`, 0.28, 5.8, m.hazard, [side * 0.8, 2.9, -7.2], false, 8);
  box(serviceFrame, 'ROBOTICS__R10__SERVICE_FRAME_BRACE', [2.1, 0.32, 0.42], m.titanium, [0, 5.6, -7.2]);
  rotate(serviceFrame, 0.008, 'y', 'circumferential module repair and replacement');
  box(root, 'ROBOTICS__R10__MACHINE_ECOLOGY_COURT', [5.4, 0.08, 5.4], m.lane, [0, 0.08, 0]);
  for (let nest = 0; nest < 12; nest += 1) {
    const angle = nest / 12 * Math.PI * 2; box(root, `ROBOTICS__R10__REPAIR_NEST_${nest + 1}`, [0.9, 0.38, 0.75], nest % 3 === 0 ? m.violet : m.graphite, [Math.cos(angle) * 2.1, 0.23, Math.sin(angle) * 2.1], false, [0, -angle, 0]);
    pulse(cylinder(root, `ROBOTICS__R10__CHARGING_PLINTH_${nest + 1}`, 0.34, 0.22, (nest % 4 ? m.cyan : m.hazard).clone(), [Math.cos(angle) * 2.8, 0.14, Math.sin(angle) * 2.8], false, 8), 0.007, nest * 0.5);
  }
  for (let tree = 0; tree < 8; tree += 1) {
    const angle = tree / 8 * Math.PI * 2 + Math.PI / 8; const x = Math.cos(angle) * 8.4; const z = Math.sin(angle) * 8.4;
    cylinder(root, `ROBOTICS__R10__PARTS_TREE_TRUNK_${tree + 1}`, 0.2, 4.0, m.titanium, [x, 2.0, z], false, 8);
    for (let branch = 0; branch < 5; branch += 1) {
      const y = 0.8 + branch * 0.7; pipe(root, `ROBOTICS__R10__PARTS_TREE_BRANCH_${tree + 1}_${branch + 1}`, new THREE.Vector3(x, y, z), new THREE.Vector3(x + Math.cos(angle + (branch % 2 ? 0.9 : -0.9)) * 0.9, y + 0.25, z + Math.sin(angle + (branch % 2 ? 0.9 : -0.9)) * 0.9), 0.055, m.silver);
      ellipsoid(root, `ROBOTICS__R10__STANDARD_COMPONENT_${tree + 1}_${branch + 1}`, [0.24, 0.15, 0.18], [m.copper, m.cyan, m.warmCeramic][branch % 3], [x + Math.cos(angle + (branch % 2 ? 0.9 : -0.9)) * 0.95, y + 0.25, z + Math.sin(angle + (branch % 2 ? 0.9 : -0.9)) * 0.95]);
    }
  }
  cylinder(root, 'ROBOTICS__R10__CENTRAL_COMPONENT_SORTING_TOWER', 2.0, 7.8, m.graphite, [0, 3.9, 0], true, 12);
  for (let tube = 0; tube < 6; tube += 1) { const angle = tube / 6 * Math.PI * 2; pipe(root, `ROBOTICS__R10__EXTERNAL_COMPONENT_CONVEYOR_${tube + 1}`, new THREE.Vector3(Math.cos(angle) * 1.0, 6.6, Math.sin(angle) * 1.0), new THREE.Vector3(Math.cos(angle) * 4.0, 4.4, Math.sin(angle) * 4.0), 0.11, tube % 2 ? m.clearGlass : m.copper); }
  return root;
}

function assignBuildingMetadata(root: THREE.Group, record: RoboticsBuildingProgram) {
  root.userData.exteriorProgram = true;
  root.userData.buildingCode = record.code;
  root.userData.buildingName = record.name;
  root.userData.semanticName = record.name;
  root.userData.buildingSubtitle = record.subtitle;
  root.userData.purpose = record.purpose;
  root.userData.facilityForm = record.form;
  root.userData.footprintMetres = [...record.footprintMetres];
  root.userData.heightMetres = record.heightMetres;
  root.userData.placementZone = record.placementZone;
  root.userData.exteriorMotif = record.exteriorMotif;
  root.userData.operationalMovement = record.operationalMovement;
  root.userData.description = `${record.subtitle}. ${record.exteriorMotif}. Exterior movement is experimental infrastructure: ${record.operationalMovement}.`;
  root.userData.navObstacle = true;
  root.traverse((object) => { object.userData.selectableId = DISTRICT_ID; object.userData.districtId = DISTRICT_ID; });
  return root;
}

function createBuilding(record: RoboticsBuildingProgram, materials: RoboticsMaterials) {
  const factories: Record<RoboticsBuildingForm, (record: RoboticsBuildingProgram, materials: RoboticsMaterials) => THREE.Group> = {
    corpus: createCorpusNexus,
    tactus: createTactusHall,
    myomer: createMyomerPavilion,
    murmuration: createMurmurationArray,
    symbiont: createSymbiontConservatory,
    magnetotaxis: createMagnetotaxisVault,
    avatar: createAvatarSpine,
    terminus: createTerminusRange,
    autopoiesis: createAutopoiesisYard,
    palingenesis: createPalingenesisWorks,
  };
  return assignBuildingMetadata(factories[record.form](record, materials), record);
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radialMargin = 8.8; const angularMargin = (sector.endAngle - sector.startAngle) * 0.052;
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

function addRibbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, material: THREE.Material, walkable = true) {
  const ribbon = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), material), name); ribbon.userData.walkable = walkable; ribbon.userData.navObstacle = false; ribbon.userData.roboticsRoute = true; ribbon.receiveShadow = true; parent.add(ribbon); return ribbon;
}

function offsetPath(points: readonly THREE.Vector3[], offset: number) {
  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    return point.clone().addScaledVector(normal, offset).setY(FLOOR_Y + 0.018);
  });
}

function addKinematicWalk(district: THREE.Group, definition: DistrictDefinition, m: RoboticsMaterials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'ROBOTICS__KINEMATIC_WALK_INFRASTRUCTURE';
  const walk = districtArc(definition, 0.49, 0.015, 0.985, 132);
  const inboundLane = offsetPath(walk, -3.0); const outboundLane = offsetPath(walk, 3.0);
  addRibbon(infrastructure, 'ROBOTICS__KINEMATIC_WALK', walk, 3.4, m.paving);
  addRibbon(infrastructure, 'ROBOTICS__AUTONOMOUS_MACHINE_LANE_INBOUND', inboundLane, 1.12, m.lane);
  addRibbon(infrastructure, 'ROBOTICS__AUTONOMOUS_MACHINE_LANE_OUTBOUND', outboundLane, 1.12, m.lane);
  pulse(addRibbon(infrastructure, 'ROBOTICS__INDUCTION_CHARGING_STRIP_INBOUND', offsetPath(walk, -3.0), 0.09, m.cyan.clone(), false), 0.006, 0);
  pulse(addRibbon(infrastructure, 'ROBOTICS__INDUCTION_CHARGING_STRIP_OUTBOUND', offsetPath(walk, 3.0), 0.09, m.hazard.clone(), false), 0.006, 1.2);
  for (let marker = 0; marker < 48; marker += 1) {
    const pathIndex = 3 + marker * 2; const point = walk[Math.min(pathIndex, walk.length - 2)]; const next = walk[Math.min(pathIndex + 1, walk.length - 1)]; const heading = Math.atan2(next.x - point.x, next.z - point.z);
    box(infrastructure, `ROBOTICS__MACHINE_READABLE_FIDUCIAL_${marker + 1}`, [0.42, 0.025, 0.42], marker % 6 === 0 ? m.hazard : m.graphite, [point.x, FLOOR_Y + 0.028, point.z], false, [0, heading + (marker % 4) * Math.PI / 2, 0]);
  }
  for (let refuge = 0; refuge < 8; refuge += 1) {
    const pathIndex = 9 + refuge * 16; const base = walk[Math.min(pathIndex, walk.length - 2)]; const previous = walk[Math.max(0, pathIndex - 1)]; const next = walk[Math.min(walk.length - 1, pathIndex + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x); const point = base.clone().addScaledVector(normal, refuge % 2 ? 5.0 : -5.0);
    const pad = box(infrastructure, `ROBOTICS__HUMAN_MACHINE_REFUGE_${refuge + 1}`, [2.2, 0.06, 1.45], m.paving, [point.x, FLOOR_Y + 0.03, point.z]); pad.userData.walkable = true;
    for (const side of [-1, 1]) cylinder(infrastructure, `ROBOTICS__REFUGE_BOLLARD_${refuge + 1}_${side < 0 ? 'L' : 'R'}`, 0.12, 0.85, m.titanium, [point.x + normal.x * side * 0.75, 0.46, point.z + normal.z * side * 0.75], false, 8);
  }
  for (let signal = 0; signal < 10; signal += 1) {
    const pathIndex = 6 + signal * 13; const base = walk[Math.min(pathIndex, walk.length - 2)]; const previous = walk[Math.max(0, pathIndex - 1)]; const next = walk[Math.min(walk.length - 1, pathIndex + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x); const point = base.clone().addScaledVector(normal, signal % 2 ? 4.15 : -4.15);
    cylinder(infrastructure, `ROBOTICS__ROBOT_HEIGHT_TRAFFIC_SIGNAL_${signal + 1}`, 0.09, 0.65, m.titanium, [point.x, 0.35, point.z], false, 8);
    pulse(box(infrastructure, `ROBOTICS__TRAFFIC_SIGNAL_STATE_${signal + 1}`, [0.2, 0.28, 0.12], (signal % 3 ? m.cyan : m.red).clone(), [point.x, 0.72, point.z]), 0.008, signal * 0.4);
  }
  for (let carrier = 0; carrier < 6; carrier += 1) {
    const path = carrier % 2 ? inboundLane : outboundLane; const point = path[Math.floor(carrier / 6 * path.length)];
    transit(ellipsoid(infrastructure, `ROBOTICS__AUTONOMOUS_MACHINE_CARRIER_${carrier + 1}`, [0.62, 0.22, 0.38], carrier % 2 ? m.graphite : m.silver, [point.x, FLOOR_Y + 0.24, point.z]), path, 0.0023 + carrier * 0.00012, carrier / 6, 'district logistics and active test-platform circulation');
  }
  district.add(infrastructure); return { infrastructure, walk };
}

function addDistrictLandscape(district: THREE.Group, definition: DistrictDefinition, m: RoboticsMaterials) {
  const landscape = new THREE.Group(); landscape.name = 'ROBOTICS__ACTIVE_TEST_LANDSCAPE';
  for (let station = 0; station < 24; station += 1) {
    const radialT = station % 2 ? 0.04 : 0.96; const angularT = 0.04 + Math.floor(station / 2) * 0.082; const point = pointInDistrict(definition, radialT, angularT); const material = [m.rubber, m.concrete, m.paving, m.lane][station % 4];
    box(landscape, `ROBOTICS__STANDARDIZED_TEST_SURFACE_${station + 1}`, [1.2 + (station % 3) * 0.34, 0.08 + (station % 4) * 0.025, 1.0 + (station % 2) * 0.35], material, [point.x, 0.08 + (station % 4) * 0.0125, point.z], false, [0, (station % 5 - 2) * 0.18, 0]);
  }
  for (let sensor = 0; sensor < 16; sensor += 1) {
    const point = pointInDistrict(definition, sensor % 2 ? 0.08 : 0.92, 0.03 + sensor * 0.06);
    cylinder(landscape, `ROBOTICS__DISTRICT_OBSERVATION_SENSOR_${sensor + 1}`, 0.08, 1.05 + (sensor % 4) * 0.18, m.silver, [point.x, 0.55 + (sensor % 4) * 0.09, point.z], false, 8);
    pulse(ellipsoid(landscape, `ROBOTICS__OBSERVATION_SENSOR_STATE_${sensor + 1}`, [0.09, 0.09, 0.09], (sensor % 5 ? m.cool : m.hazard).clone(), [point.x, 1.13 + (sensor % 4) * 0.18, point.z]), 0.006, sensor * 0.33);
  }
  district.add(landscape); return landscape;
}

export function buildRoboticsLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Robotics Labs District requires a masterplan sector');
  const materials = createRoboticsMaterials();
  const { infrastructure, walk } = addKinematicWalk(district, definition, materials);
  const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = ROBOTICS_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials); const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02); building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT };
    district.add(building); return building;
  });
  facilities.forEach((facility, index) => {
    const record = ROBOTICS_BUILDING_PROGRAM[index]; const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, Math.min(7.2, record.footprintMetres[1] / 18 + 0.9)); const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const routePoint = walk.reduce((closest, point) => point.distanceToSquared(entrance) < closest.distanceToSquared(entrance) ? point : closest, walk[0]); const approachPoints = [routePoint.clone(), routePoint.clone().lerp(entrance, 0.52), entrance];
    addRibbon(infrastructure, `ROBOTICS__BUILDING_APPROACH_${record.code}`, approachPoints, 0.95, materials.paving);
    pulse(addRibbon(infrastructure, `ROBOTICS__BUILDING_APPROACH_GUIDANCE_${record.code}`, approachPoints.map((point) => point.clone().setY(FLOOR_Y + 0.028)), 0.045, [materials.cool, materials.cyan, materials.hazard, materials.violet][index % 4].clone(), false), 0.0065, index * 0.47);
  });
  district.userData.roboticsLabsDistrict = {
    identity: 'Robotics Labs District',
    architecturalLanguage: 'architecture behaves robotically through functional test infrastructure, adaptive skins, replaceable modules, active docking, responsive structures, and exterior machine circulation without figurative robot ornament',
    buildingCount: facilities.length,
    buildings: ROBOTICS_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, subtitle: record.subtitle, purpose: record.purpose, placementZone: record.placementZone, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorMotif: record.exteriorMotif, operationalMovement: record.operationalMovement })),
    landmarks: { embodiedIntelligence: 'Corpus Nexus', tactileManipulation: 'Tactus Hall', softRobotics: 'Myomer Pavilion', swarmAutonomy: 'Murmuration Array', biohybridRobotics: 'Symbiont Conservatory', microrobotics: 'Magnetotaxis Vault', telepresence: 'Avatar Spine', extremeEnvironments: 'Terminus Range', roboticConstruction: 'Autopoiesis Yard', selfRepair: 'Palingenesis Works' },
    circulation: { primaryAxis: 'ROBOTICS__KINEMATIC_WALK', pedestrianWidthMetres: 34, autonomousMachineLanes: 2, inductionChargingStrips: 2, machineReadableFiducials: 48, robotHeightTrafficSignals: 10, humanRefuges: 8, exactBuildingApproaches: 10 },
    signatureSystems: { corpusSlabs: 7, tactileSkinTiles: 120, articulatedCanopySupports: 24, myomerLobes: 5, variableStiffnessArches: 8, swarmTowers: 6, dockingApertures: 96, coordinatedDrones: 24, symbiontPavilions: 3, cultureMediaTubes: 18, fieldShapingArches: 6, avatarBridges: 3, armouredHangars: 4, fabricationGantries: 2, reconfigurableModules: 12, partsTrees: 8, autonomousCarriers: 6 },
    materials: ['pale ceramic composite', 'graphite photovoltaic glass', 'dark titanium', 'brushed service alloy', 'field-shaping copper', 'adaptive translucent membrane', 'biohybrid fluoropolymer', 'scarred fibre-reinforced concrete'],
    lighting: ['cool-white active-test state', 'cyan machine guidance', 'functional hazard amber', 'biohybrid violet', 'active-boundary red'],
    operationalRule: 'movement replaces ornament; every animated element represents testing, calibration, logistics, maintenance, sensing, or structural response',
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: ROBOTICS_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: ['Kinematic Walk', 'Autonomous Machine Lanes', 'Induction Charging Strips', 'Machine-Readable Fiducials', 'Robot-Height Traffic Signals', 'Human Refuges', 'Active Test Landscape', 'District Observation Sensors'],
    realizedFeatureTags: ROBOTICS_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 13,
    radialCoverage: 0.96,
    angularCoverage: 0.97,
    exteriorOnly: true,
    kinematicWalkNarrative: true,
    movementIsFunctional: true,
  };
}
