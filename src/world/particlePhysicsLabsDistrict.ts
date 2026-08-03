import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type ParticlePhysicsBuildingForm =
  | 'conventus'
  | 'chronos'
  | 'event-loom'
  | 'scalaris'
  | 'chromodynamic'
  | 'oscilla'
  | 'asymmetry'
  | 'noctis'
  | 'symmetria'
  | 'silence'
  | 'lattice'
  | 'amplituhedron'
  | 'renormalization'
  | 'genesis'
  | 'signal-archive';

export interface ParticlePhysicsBuildingProgram {
  code: string;
  name: string;
  purpose: string;
  form: ParticlePhysicsBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
}

export const PARTICLE_PHYSICS_BUILDING_PROGRAM: readonly ParticlePhysicsBuildingProgram[] = [
  { code: 'P1', name: 'Conventus Orbis', purpose: 'Principal scientific convention, symposium, and collaboration forum', form: 'conventus', footprintMetres: [215, 215], heightMetres: 31, radialT: 0.56, angularT: 0.47, placementZone: 'Central interaction zone', exteriorMotif: 'twelve deep hall-scale sectors on one perfect circular titanium ring, four symmetric cardinal interaction nodes, equal elevated bridges, twelve sector-centered V-pylon pairs, and open Interaction Court' },
  { code: 'P2', name: 'Chronos Relay', purpose: 'Global experiment operations, timing synchronization, remote observation shifts, and live collaboration', form: 'chronos', footprintMetres: [105, 92], heightMetres: 72, radialT: 0.58, angularT: 0.06, placementZone: 'Western operational approach', exteriorMotif: 'wave-fin hexagonal operations base and seven subtly rotated timing volumes beneath an optical crown' },
  { code: 'P3', name: 'The Event Loom', purpose: 'Event reconstruction, detector triggers, scientific AI, anomaly detection, and simulation-based inference', form: 'event-loom', footprintMetres: [185, 148], heightMetres: 46, radialT: 0.80, angularT: 0.15, placementZone: 'Computational and operational arc', exteriorMotif: 'two obliquely colliding data wings, sparse signal pixels, translucent event wall, and Trigger Tiers' },
  { code: 'P4', name: 'Scalaris', purpose: 'Precision Higgs measurements, rare decays, self-coupling signatures, and new-physics connections', form: 'scalaris', footprintMetres: [92, 92], heightMetres: 54, radialT: 0.56, angularT: 0.23, placementZone: 'Central interaction zone', exteriorMotif: 'floating pearlescent ceramic cube, displaced symmetry frames, dichroic slit, and one-field error' },
  { code: 'P5', name: 'Chromodynamic Court', purpose: 'Quantum chromodynamics, proton tomography, quark and gluon dynamics, jets, exotic hadrons, and quark-gluon plasma', form: 'chromodynamic', footprintMetres: [170, 150], heightMetres: 32, radialT: 0.56, angularT: 0.73, placementZone: 'Central interaction zone', exteriorMotif: 'three braided ribbed wings around a mist court beneath a force-network canopy' },
  { code: 'P6', name: 'Oscilla', purpose: 'Synthesis of long-baseline, atmospheric, reactor, solar, and astrophysical neutrino observations', form: 'oscilla', footprintMetres: [210, 118], heightMetres: 29, radialT: 0.56, angularT: 0.94, placementZone: 'Central interaction zone toward the Savanna approach', exteriorMotif: 'three shifted translucent volumes with geometric moire screens over black-water basins' },
  { code: 'P7', name: 'The Asymmetry House', purpose: 'Flavour physics, CP violation, rare decays, and matter-antimatter differences', form: 'asymmetry', footprintMetres: [132, 108], heightMetres: 61, radialT: 0.81, angularT: 0.37, placementZone: 'Outer collaborative court', exteriorMotif: 'near-mirror twin towers with controlled differences, off-axis sky prism, and decay-tree canopy' },
  { code: 'P8', name: 'Noctis', purpose: 'Axion, dark-photon, weakly interacting particle, and other low-background dark-sector signal correlation', form: 'noctis', footprintMetres: [118, 118], heightMetres: 19, radialT: 0.37, angularT: 0.08, placementZone: 'Low-signal research garden', exteriorMotif: 'recessed incomplete black ring, roof waves, isolated light wells, and a faint irregular signal trace' },
  { code: 'P9', name: 'Symmetria', purpose: 'Fundamental symmetries, dipole moments, CPT tests, lepton universality, muon properties, and ultra-rare processes', form: 'symmetria', footprintMetres: [190, 190], heightMetres: 43, radialT: 0.36, angularT: 0.31, placementZone: 'Low-signal research garden', exteriorMotif: 'strict cruciform stone plan, calibrated central rings, terminal frames, and one deliberate discontinuity' },
  { code: 'P10', name: 'The Quantum Silence Pavilion', purpose: 'Quantum sensor readout, calibration, and low-noise precision analysis', form: 'silence', footprintMetres: [145, 118], heightMetres: 24, radialT: 0.37, angularT: 0.84, placementZone: 'Low-signal research garden', exteriorMotif: 'six isolated ceramic pavilions beneath a tapered floating roof within a dry vibration moat' },
  { code: 'P11', name: 'The Lattice Citadel', purpose: 'Exascale lattice field calculations, Standard Model predictions, quantum simulation, and large-scale theoretical computation', form: 'lattice', footprintMetres: [190, 135], heightMetres: 58, radialT: 0.82, angularT: 0.61, placementZone: 'Computational and operational arc', exteriorMotif: 'stepped cubic megastructure, warped facade grid, faceted cooling prisms, diagonal ramps, and exposed cooling channel' },
  { code: 'P12', name: 'Amplituhedron House', purpose: 'Scattering amplitudes, quantum geometry, conformal structures, and geometrical field-theory methods', form: 'amplituhedron', footprintMetres: [125, 116], heightMetres: 47, radialT: 0.09, angularT: 0.18, placementZone: 'Northern theory ridge', exteriorMotif: 'intersecting triangular planes, skewed iridescent prisms, sharp cantilevers, and perspective-resolving columns' },
  { code: 'P13', name: 'The Renormalization Tower', purpose: 'Beyond-Standard-Model phenomenology, hidden sectors, compositeness, extra dimensions, and effective field theories', form: 'renormalization', footprintMetres: [98, 94], heightMetres: 116, radialT: 0.11, angularT: 0.46, placementZone: 'Northern theory ridge landmark', exteriorMotif: 'seven migrating regimes, branching structural exoskeleton, luminous scale gaps, and open beacon crown' },
  { code: 'P14', name: 'Genesis Spiral', purpose: 'Particle cosmology, baryogenesis, phase transitions, inflationary particle physics, and relic fields', form: 'genesis', footprintMetres: [165, 155], heightMetres: 42, radialT: 0.09, angularT: 0.74, placementZone: 'Northern theory ridge', exteriorMotif: 'logarithmic expansion from dark core to pale arc, widening bronze ribs, and architectural oculus' },
  { code: 'P15', name: 'The Signal Coast Archive', purpose: 'Multimessenger alerts, particle open data, long-term archives, and protected coastal data links', form: 'signal-archive', footprintMetres: [240, 94], heightMetres: 64, radialT: 0.94, angularT: 0.86, placementZone: 'Fortified Data Coast', exteriorMotif: 'basalt storm barrier, silver wave canopy, paired sentinel towers, cable conduits, and narrow alert wavefront' },
] as const;

const DISTRICT_ID = 'particle-physics-labs';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 12, 8);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_Z = new THREE.Vector3(0, 0, 1);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

type ParticleMaterials = ReturnType<typeof createMaterials>;

function material(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  const result = new THREE.MeshStandardMaterial({ color, roughness: 0.54, metalness: 0.22, ...options });
  result.name = name;
  return result;
}

function createMaterials() {
  const basalt = material('Particle Physics graphite basalt', '#11171b', { roughness: 0.92, metalness: 0.08 });
  const blackCeramic = material('Particle Physics near-black technical ceramic', '#0b1015', { roughness: 0.66, metalness: 0.2 });
  const ceramic = material('Particle Physics pale technical ceramic', '#e4e6e2', { roughness: 0.4, metalness: 0.06 });
  const paleStone = material('Particle Physics pale precision stone', '#aeb1aa', { roughness: 0.82, metalness: 0.04 });
  const titanium = material('Particle Physics satin brushed titanium', '#8e989d', { roughness: 0.28, metalness: 0.9 });
  const steel = material('Particle Physics dark stainless steel', '#29323a', { roughness: 0.3, metalness: 0.88 });
  const mirror = material('Particle Physics polished instrument metal', '#c9d1d2', { roughness: 0.08, metalness: 0.98 });
  const smokeGlass = material('Particle Physics smoked electrochromic glass', '#162531', { roughness: 0.12, metalness: 0.5, transparent: true, opacity: 0.78 });
  const dichroic = material('Particle Physics amber-violet dichroic glass', '#8b756f', { roughness: 0.12, metalness: 0.55, emissive: '#3a233e', emissiveIntensity: 0.35, transparent: true, opacity: 0.82 });
  const iridescent = material('Particle Physics iridescent theory glass', '#82999a', { roughness: 0.1, metalness: 0.66, emissive: '#182d34', emissiveIntensity: 0.26, transparent: true, opacity: 0.76 });
  const copper = material('Particle Physics oxidized copper', '#4e625d', { roughness: 0.52, metalness: 0.72 });
  const blueSteel = material('Particle Physics blue-black stainless steel', '#182b3b', { roughness: 0.36, metalness: 0.82 });
  const redCeramic = material('Particle Physics muted red ceramic', '#674646', { roughness: 0.58, metalness: 0.16 });
  const bronze = material('Particle Physics calibrated bronze', '#806448', { roughness: 0.38, metalness: 0.78 });
  const mesh = material('Particle Physics perforated technical mesh', '#768086', { roughness: 0.46, metalness: 0.82, transparent: true, opacity: 0.72 });
  const water = material('Particle Physics black reflecting water', '#091b25', { roughness: 0.08, metalness: 0.4, transparent: true, opacity: 0.78 });
  const gravel = material('Particle Physics black vibration gravel', '#101419', { roughness: 1, metalness: 0 });
  const silverGrass = material('Particle Physics low silver grass', '#68766d', { roughness: 0.96, metalness: 0 });
  const cyanLight = material('Particle Physics cyan data trace', '#d5fbff', { emissive: '#42dcff', emissiveIntensity: 3, roughness: 0.12, metalness: 0.08 });
  const amberLight = material('Particle Physics amber timing trace', '#ffe1ae', { emissive: '#ff9d42', emissiveIntensity: 3, roughness: 0.12, metalness: 0.08 });
  const violetLight = material('Particle Physics violet field trace', '#e0ceff', { emissive: '#9b65ff', emissiveIntensity: 3, roughness: 0.12, metalness: 0.08 });
  [cyanLight, amberLight, violetLight].forEach((value) => { value.userData.isDistrictAccent = true; });
  return { basalt, blackCeramic, ceramic, paleStone, titanium, steel, mirror, smokeGlass, dichroic, iridescent, copper, blueSteel, redCeramic, bronze, mesh, water, gravel, silverGrass, cyanLight, amberLight, violetLight };
}

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
  const value = prepare(new THREE.Mesh(UNIT_BOX, mat), name, obstacle);
  value.scale.set(...size); value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function cylinder(parent: THREE.Object3D, name: string, diameter: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 24, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const geometry = segments === 8 ? UNIT_CYLINDER_8 : segments === 12 ? UNIT_CYLINDER_12 : UNIT_CYLINDER_24;
  const value = prepare(new THREE.Mesh(geometry, mat), name, obstacle);
  value.scale.set(diameter, height, diameter); value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function taper(parent: THREE.Object3D, name: string, bottomDiameter: number, topDiameter: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 8, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const value = prepare(new THREE.Mesh(new THREE.CylinderGeometry(topDiameter * 0.5, bottomDiameter * 0.5, height, segments), mat), name, obstacle);
  value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function sphere(parent: THREE.Object3D, name: string, scale: readonly [number, number, number], mat: THREE.Material, position: readonly [number, number, number], obstacle = false) {
  const value = prepare(new THREE.Mesh(UNIT_SPHERE, mat), name, obstacle);
  value.scale.set(...scale); value.position.set(...position); parent.add(value); return value;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, mat: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0], arc = Math.PI * 2, obstacle = false, radialSegments = 8, tubularSegments = 40) {
  const key = `${radius.toFixed(3)}:${tube.toFixed(3)}:${arc.toFixed(3)}:${radialSegments}:${tubularSegments}`;
  let geometry = TORUS_CACHE.get(key);
  if (!geometry) { geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc); TORUS_CACHE.set(key, geometry); }
  const value = prepare(new THREE.Mesh(geometry, mat), name, obstacle);
  value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function pipe(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, radius: number, mat: THREE.Material, obstacle = false) {
  const vector = end.clone().sub(start);
  const value = prepare(new THREE.Mesh(UNIT_CYLINDER_12, mat), name, obstacle);
  value.position.copy(start).add(end).multiplyScalar(0.5); value.scale.set(radius * 2, vector.length(), radius * 2); value.quaternion.setFromUnitVectors(UNIT_Y, vector.normalize()); parent.add(value); return value;
}

function slabBetween(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, width: number, height: number, mat: THREE.Material, obstacle = false) {
  const vector = end.clone().sub(start);
  const value = prepare(new THREE.Mesh(UNIT_BOX, mat), name, obstacle);
  value.position.copy(start).add(end).multiplyScalar(0.5); value.scale.set(width, height, vector.length()); value.quaternion.setFromUnitVectors(UNIT_Z, vector.normalize()); parent.add(value); return value;
}

interface InstanceTransform { position: readonly [number, number, number]; scale: readonly [number, number, number]; rotation?: readonly [number, number, number]; name?: string }

function instances(parent: THREE.Object3D, name: string, geometry: THREE.BufferGeometry, mat: THREE.Material, transforms: readonly InstanceTransform[], obstacle = false) {
  const value = new THREE.InstancedMesh(geometry, mat, transforms.length);
  const helper = new THREE.Object3D();
  transforms.forEach((transform, index) => {
    helper.position.set(...transform.position); helper.scale.set(...transform.scale); helper.rotation.set(...(transform.rotation ?? [0, 0, 0])); helper.updateMatrix(); value.setMatrixAt(index, helper.matrix);
  });
  prepare(value, name, obstacle);
  value.userData.authoredInstanceCount = transforms.length;
  value.userData.instanceNames = transforms.map((transform, index) => transform.name ?? `${name}_${index + 1}`);
  value.instanceMatrix.needsUpdate = true; value.computeBoundingSphere(); parent.add(value); return value;
}

function pulse<T extends THREE.Object3D>(object: T, speed: number, phase = 0, minIntensity = 0.18, maxIntensity = 4) {
  object.userData.animate = 'particle-physics-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate<T extends THREE.Object3D>(object: T, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'particle-physics-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function addTechnicalPlinth(root: THREE.Group, code: string, width: number, depth: number, m: ParticleMaterials, basin = false) {
  box(root, `PARTICLE__${code}__GRAPHITE_BASALT_PLINTH`, [width, 0.22, depth], m.basalt, [0, 0.11, 0], true);
  if (basin) {
    box(root, `PARTICLE__${code}__REFLECTING_TRENCH_NORTH`, [width + 0.45, 0.04, 0.16], m.water, [0, 0.235, -depth * 0.5 - 0.16]);
    box(root, `PARTICLE__${code}__REFLECTING_TRENCH_SOUTH`, [width + 0.45, 0.04, 0.16], m.water, [0, 0.235, depth * 0.5 + 0.16]);
  }
}

function createConventus(m: ParticleMaterials) {
  const root = new THREE.Group(); root.name = 'PARTICLE__P1__CONVENTUS_ORBIS';
  cylinder(root, 'PARTICLE__P1__INTERACTION_COURT_RADIAL_GRID', 11.5, 0.055, m.paleStone, [0, 0.04, 0], false, 24);
  cylinder(root, 'PARTICLE__P1__INTERACTION_COURT_INNER_SHADOW', 7.6, 0.06, m.basalt, [0, 0.075, 0], false, 24);
  const sectorStep = Math.PI / 6;
  const sectorGap = 0.035;
  const arc = sectorStep - sectorGap;
  const hallTube = 0.165;
  // One uniform plan scale is essential: rotating a non-uniform scale with each
  // arc produces twelve unrelated ellipse fragments instead of one true circle.
  const ringRadius = 9.2;
  const ringVerticalScale = 2.75;
  const lowerBandY = 1.34;
  const ringUndersideY = lowerBandY - hallTube * ringVerticalScale;
  for (let sector = 0; sector < 12; sector += 1) {
    const angle = sector * sectorStep + sectorGap * 0.5;
    const bandData = [
      { y: lowerBandY, material: m.titanium },
      { y: 1.96, material: m.smokeGlass },
      { y: 2.58, material: m.titanium },
    ];
    bandData.forEach((band, bandIndex) => {
      const value = torus(root, `PARTICLE__P1__HALL_SCALE_ARC_SECTOR_${sector + 1}_BAND_${bandIndex + 1}`, 1, hallTube, band.material, [0, band.y, 0], [Math.PI / 2, 0, angle], arc, true, 6, 16);
      value.scale.set(ringRadius, ringRadius, ringVerticalScale);
      value.userData.habitableHallSector = true;
      value.userData.minimumDepthMetres = Number((hallTube * 2 * ringRadius * 10).toFixed(1));
    });
    pulse(torus(root, `PARTICLE__P1__EVENT_PULSE_SECTOR_${sector + 1}`, 1, 0.018, sector % 3 ? m.cyanLight.clone() : m.amberLight.clone(), [0, 3.08, 0], [Math.PI / 2, 0, angle], arc, false, 4, 12), 0.01, sector / 12);
  }
  for (let node = 0; node < 4; node += 1) {
    const angle = node * Math.PI / 2;
    const x = Math.cos(angle) * ringRadius; const z = Math.sin(angle) * ringRadius;
    cylinder(root, `PARTICLE__P1__CARDINAL_INTERACTION_NODE_${node + 1}`, 2.9, 3.0, m.titanium, [x, 1.72, z], true, 12);
    const bridgeLength = ringRadius + 1.1;
    box(root, `PARTICLE__P1__HABITABLE_LUMINOUS_BRIDGE_${node + 1}`, node % 2 ? [2.15, 0.52, bridgeLength] : [bridgeLength, 0.52, 2.15], m.smokeGlass, [x * 0.5, 2.6, z * 0.5], true);
  }
  for (let pylon = 0; pylon < 12; pylon += 1) {
    const angle = pylon * sectorStep + sectorStep * 0.5;
    const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    const baseRadius = ringRadius - 1.85;
    const baseCenter = new THREE.Vector3(Math.cos(angle) * baseRadius, 0.25, Math.sin(angle) * baseRadius);
    const apex = new THREE.Vector3(Math.cos(angle) * ringRadius, ringUndersideY + 0.018, Math.sin(angle) * ringRadius);
    const basaltBase = baseCenter.clone().addScaledVector(tangent, 0.82);
    const polishedBase = baseCenter.clone().addScaledVector(tangent, -0.82);
    pipe(root, `PARTICLE__P1__BASALT_V_PYLON_${pylon + 1}_LEG_A`, basaltBase, apex, 0.28, m.basalt, true);
    pipe(root, `PARTICLE__P1__POLISHED_V_PYLON_${pylon + 1}_LEG_B`, polishedBase, apex, 0.2, m.mirror, true);
    const shoe = box(root, `PARTICLE__P1__V_PYLON_${pylon + 1}_RING_BEARING_SHOE`, [1.85, 0.18, 0.84], m.titanium, [apex.x, ringUndersideY + 0.02, apex.z], true, [0, Math.PI * 0.5 - angle, 0]);
    shoe.userData.ringBearing = true;
  }
  root.userData.conventusOrbisStructure = {
    habitableSectorCount: 12,
    storeysPerSector: 3,
    circularPlan: true,
    ringRadiusMetres: ringRadius * 10,
    minimumSectorDepthMetres: Number((hallTube * 2 * ringRadius * 10).toFixed(1)),
    supportPairCount: 12,
    supportApexRadiusX: ringRadius,
    supportApexRadiusZ: ringRadius,
    cardinalNodeCount: 4,
    cardinalNodeRadiusMetres: ringRadius * 10,
    ringUndersideY: Number(ringUndersideY.toFixed(3)),
    bearingContactY: Number((ringUndersideY + 0.018).toFixed(3)),
  };
  sphere(root, 'PARTICLE__P1__EVENT_SCULPTURE_DARK_INTERACTION_POINT', [0.45, 0.45, 0.45], m.blackCeramic, [0, 0.62, 0]);
  const sculpture = new THREE.Group(); sculpture.name = 'PARTICLE__P1__KINETIC_COLLISION_EVENT_SCULPTURE'; sculpture.position.y = 0.62; root.add(sculpture); rotate(sculpture, 0.006);
  for (let track = 0; track < 28; track += 1) {
    const a = track * 2.39996; const length = 1.5 + (track % 7) * 0.26; const end = new THREE.Vector3(Math.cos(a) * length, 0.2 + (track % 5) * 0.28, Math.sin(a) * length);
    pipe(sculpture, `PARTICLE__P1__KINETIC_EVENT_TRACK_${track + 1}`, new THREE.Vector3(), end, 0.025, track % 4 ? m.titanium : m.cyanLight);
  }
  return root;
}

function createChronos(m: ParticleMaterials) {
  const root = new THREE.Group(); root.name = 'PARTICLE__P2__CHRONOS_RELAY'; addTechnicalPlinth(root, 'P2', 10.9, 9.5, m, true);
  cylinder(root, 'PARTICLE__P2__IRREGULAR_HEXAGON_OPERATIONS_BASE', 9.9, 2.0, m.smokeGlass, [0, 1.2, 0], true, 12, [0, Math.PI / 6, 0]);
  const fins: InstanceTransform[] = [];
  for (let index = 0; index < 42; index += 1) { const side = index < 21 ? -1 : 1; const col = index % 21; fins.push({ position: [-4.75 + col * 0.475, 1.22 + Math.sin(col * 0.65) * 0.18, side * 4.36], scale: [0.075, 1.65 + (col % 4) * 0.16, 0.34], name: `PARTICLE__P2__WAVEFORM_CERAMIC_FIN_${index + 1}` }); }
  instances(root, 'PARTICLE__P2__WAVEFORM_CERAMIC_FIN_FIELD', UNIT_BOX, m.ceramic, fins);
  let y = 2.25;
  for (let level = 0; level < 7; level += 1) {
    const height = 0.72 + (level < 2 ? 0.12 : 0); const size = 3.6 - level * 0.27;
    box(root, `PARTICLE__P2__TIMING_CORRECTION_VOLUME_${level + 1}`, [size, height, size * 0.86], level < 3 ? m.steel : level < 5 ? m.titanium : m.ceramic, [2.35 + level * 0.1, y + height * 0.5, -1.8 + level * 0.06], true, [0, level * 0.018, 0]);
    pulse(box(root, `PARTICLE__P2__LUMINOUS_TIMING_JOINT_${level + 1}`, [size + 0.08, 0.075, size * 0.88], m.cyanLight.clone(), [2.35 + level * 0.1, y, -1.8 + level * 0.06], false, [0, level * 0.018, 0]), 0.011, level * 0.36);
    y += height + 0.075;
  }
  box(root, 'PARTICLE__P2__SYMMETRIC_BLACK_METAL_CROWN', [2.5, 0.32, 2.2], m.blackCeramic, [2.95, 7.28, -1.44], true);
  for (let dome = 0; dome < 4; dome += 1) sphere(root, `PARTICLE__P2__OPTICAL_COMMUNICATION_DOME_${dome + 1}`, [0.28, 0.18, 0.28], m.dichroic, [2.3 + (dome % 2) * 1.1, 7.58, -1.9 + Math.floor(dome / 2) * 0.95]);
  for (let mast = 0; mast < 5; mast += 1) cylinder(root, `PARTICLE__P2__ATOMIC_TIME_MAST_${mast + 1}`, 0.06, 0.75 + mast % 2 * 0.2, m.titanium, [2.2 + mast * 0.37, 7.75 + mast % 2 * 0.1, -1.45], false, 8);
  for (let pillar = 0; pillar < 12; pillar += 1) {
    const x = -4.8 + pillar * 0.87; cylinder(root, `PARTICLE__P2__SYNCHRONIZATION_PILLAR_${pillar + 1}`, 0.18, 1.45, m.mirror, [x, 0.96, 5.4], false, 12);
    pulse(cylinder(root, `PARTICLE__P2__SYNCHRONIZED_LIGHT_BAND_${pillar + 1}`, 0.2, 0.12, m.amberLight.clone(), [x, 0.5 + (pillar % 4) * 0.27, 5.4], false, 12), 0.014, pillar / 12);
  }
  return root;
}

function createEventLoom(m: ParticleMaterials) {
  const root = new THREE.Group(); root.name = 'PARTICLE__P3__EVENT_LOOM'; addTechnicalPlinth(root, 'P3', 19.2, 15.4, m);
  box(root, 'PARTICLE__P3__GRAPHITE_DETECTOR_STREAM_WING', [18.5, 3.2, 4.9], m.basalt, [0, 1.82, 0], true, [0, 0.24, 0]);
  box(root, 'PARTICLE__P3__PALE_PERFORATED_RECONSTRUCTION_WING', [14.8, 2.75, 4.3], m.ceramic, [0.2, 1.6, 0.1], true, [0, -0.62, 0]);
  box(root, 'PARTICLE__P3__COLLISION_INTERSECTION_MASS', [5.4, 4.6, 5.2], m.steel, [0, 2.52, 0], true, [0, -0.12, 0]);
  const pixels: InstanceTransform[] = [];
  for (let row = 0; row < 10; row += 1) for (let col = 0; col < 12; col += 1) pixels.push({ position: [-2.45 + col * 0.45, 0.72 + row * 0.4, 2.66], scale: [0.27, 0.24, 0.09], name: `PARTICLE__P3__RECESSED_SIGNAL_PIXEL_${row + 1}_${col + 1}` });
  instances(root, 'PARTICLE__P3__RECESSED_SIGNAL_PIXEL_FIELD', UNIT_BOX, m.blackCeramic, pixels);
  const litPixels = pixels.filter((_, index) => index % 13 === 0 || index % 17 === 0).map((value, index) => ({ ...value, position: [value.position[0], value.position[1], 2.72] as const, scale: [0.16, 0.14, 0.035] as const, name: `PARTICLE__P3__SPARSE_ACTIVE_SIGNAL_${index + 1}` }));
  pulse(instances(root, 'PARTICLE__P3__SPARSE_ACTIVE_SIGNAL_FIELD', UNIT_BOX, m.cyanLight.clone(), litPixels), 0.017, 0.2);
  for (let recess = 0; recess < 7; recess += 1) box(root, `PARTICLE__P3__DETECTOR_READOUT_RECESS_${recess + 1}`, [2.0 + (recess % 3) * 0.65, 0.16, 0.12], m.smokeGlass, [-7.1 + recess * 2.25, 1.0 + (recess % 3) * 0.72, 3.02 + recess * 0.06]);
  box(root, 'PARTICLE__P3__MONUMENTAL_ABSTRACT_EVENT_DISPLAY', [10.8, 3.5, 0.13], m.smokeGlass, [1.6, 2.15, 6.7], false);
  for (let tier = 0; tier < 4; tier += 1) box(root, `PARTICLE__P3__TRIGGER_TIER_${tier + 1}`, [4.8 + tier * 1.1, 0.36, 2.1 + tier * 0.4], tier % 2 ? m.titanium : m.steel, [0.5 + tier * 0.34, 4.92 + tier * 0.31, -0.4], true, [0, -0.12, -0.035 * tier]);
  return root;
}

function createScalaris(m: ParticleMaterials) {
  const root = new THREE.Group(); root.name = 'PARTICLE__P4__SCALARIS';
  cylinder(root, 'PARTICLE__P4__DARK_REFLECTING_BASIN', 8.8, 0.09, m.water, [0, 0.07, 0], false, 24);
  for (let core = 0; core < 4; core += 1) box(root, `PARTICLE__P4__RECESSED_STRUCTURAL_CORE_${core + 1}`, [0.65, 1.15, 0.65], m.blackCeramic, [core < 2 ? -1.75 : 1.75, 0.65, core % 2 ? -1.75 : 1.75], true);
  box(root, 'PARTICLE__P4__PEARLESCENT_HIGGS_CUBE', [5.4, 5.4, 5.4], m.ceramic, [0, 3.32, 0], true);
  box(root, 'PARTICLE__P4__OFF_CENTER_DICHROIC_FIELD_SLIT', [0.28, 5.15, 0.08], m.dichroic, [0.76, 3.32, 2.73]);
  for (let level = 0; level < 6; level += 1) {
    const offset = level * 0.11;
    const y = 0.62 + level * 0.98;
    box(root, `PARTICLE__P4__DISPLACED_SYMMETRY_FRAME_${level + 1}_N`, [6.25, 0.08, 0.08], m.titanium, [offset, y, -3.12 + offset * 0.2]);
    box(root, `PARTICLE__P4__DISPLACED_SYMMETRY_FRAME_${level + 1}_S`, [6.25, 0.08, 0.08], m.titanium, [offset, y, 3.12 - offset * 0.2]);
    box(root, `PARTICLE__P4__DISPLACED_SYMMETRY_FRAME_${level + 1}_W`, [0.08, 0.08, 6.25], m.titanium, [-3.12 + offset, y, 0]);
    box(root, `PARTICLE__P4__DISPLACED_SYMMETRY_FRAME_${level + 1}_E`, [0.08, 0.08, 6.25], m.titanium, [3.12 + offset, y, 0]);
  }
  box(root, 'PARTICLE__P4__SINGLE_APPROACH_BRIDGE', [1.0, 0.12, 5.2], m.paleStone, [0, 0.16, 5.7], false);
  const columns: InstanceTransform[] = [];
  for (let row = 0; row < 5; row += 1) for (let col = 0; col < 5; col += 1) columns.push({ position: [-4.9 + col * 2.45 + (row === 3 && col === 2 ? 0.04 : 0), 0.36, -4.9 + row * 2.45], scale: [0.32, 0.72, 0.32], name: `PARTICLE__P4__SYMMETRY_FIELD_COLUMN_${row + 1}_${col + 1}` });
  instances(root, 'PARTICLE__P4__SYMMETRY_FIELD_COLUMNS', UNIT_CYLINDER_12, m.paleStone, columns);
  return root;
}

function createChromodynamic(m: ParticleMaterials) {
  const root = new THREE.Group(); root.name = 'PARTICLE__P5__CHROMODYNAMIC_COURT'; addTechnicalPlinth(root, 'P5', 17.7, 15.6, m);
  cylinder(root, 'PARTICLE__P5__DEEP_CIRCULAR_MIST_COURT', 7.1, 0.08, m.gravel, [0, 0.25, 0], false, 24);
  const wingMaterials = [m.copper, m.blueSteel, m.redCeramic];
  for (let wing = 0; wing < 3; wing += 1) {
    const angle = wing * Math.PI * 2 / 3 + 0.16;
    const volume = torus(root, `PARTICLE__P5__BRAIDED_QCD_WING_${wing + 1}`, 5.7, 1.45, wingMaterials[wing], [0, 1.75 + wing * 0.12, 0], [Math.PI / 2, 0, angle], 1.72, true, 10, 24);
    volume.scale.y = 0.88;
    for (let rib = 0; rib < 9; rib += 1) torus(root, `PARTICLE__P5__CONFINEMENT_RIB_${wing + 1}_${rib + 1}`, 4.7 + rib * 0.23, 0.045, m.steel, [0, 2.0 + wing * 0.12, 0], [Math.PI / 2, 0, angle], 1.63, false, 4, 18);
    const entryX = Math.cos(angle + 0.86) * 7.1; const entryZ = Math.sin(angle + 0.86) * 7.1;
    cylinder(root, `PARTICLE__P5__JET_DISTRIBUTION_ENTRY_PLAZA_${wing + 1}`, 3.0, 0.07, wingMaterials[wing], [entryX, 0.28, entryZ], false, 12);
  }
  for (let cable = 0; cable < 24; cable += 1) {
    const a = cable * Math.PI * 2 / 24; const b = a + (cable % 5 + 3) * Math.PI / 12;
    pipe(root, `PARTICLE__P5__FORCE_NETWORK_CABLE_${cable + 1}`, new THREE.Vector3(Math.cos(a) * 5.6, 3.2 + (cable % 3) * 0.12, Math.sin(a) * 5.6), new THREE.Vector3(Math.cos(b) * 3.0, 3.72 + (cable % 4) * 0.12, Math.sin(b) * 3.0), 0.035, m.blackCeramic);
  }
  for (let vent = 0; vent < 16; vent += 1) { const a = vent * Math.PI * 2 / 16; pulse(cylinder(root, `PARTICLE__P5__IRREGULAR_MIST_VENT_${vent + 1}`, 0.16, 0.06, m.cyanLight.clone(), [Math.cos(a) * (1.4 + vent % 3 * 0.55), 0.32, Math.sin(a) * (1.4 + vent % 3 * 0.55)], false, 8), 0.007, vent * 0.37, 0.05, 1.8); }
  return root;
}

function createOscilla(m: ParticleMaterials) {
  const root = new THREE.Group(); root.name = 'PARTICLE__P6__OSCILLA'; addTechnicalPlinth(root, 'P6', 21.8, 12.4, m);
  for (let basin = 0; basin < 4; basin += 1) box(root, `PARTICLE__P6__SHALLOW_BLACK_WATER_BASIN_${basin + 1}`, [20.6, 0.055, 1.55], m.water, [0, 0.25, -4.8 + basin * 3.2]);
  const volumeData = [
    { z: -3.4, y: 1.35, slope: -0.025, intensity: m.smokeGlass },
    { z: 0, y: 1.75, slope: 0.035, intensity: m.paleStone },
    { z: 3.4, y: 1.5, slope: -0.045, intensity: m.smokeGlass },
  ];
  volumeData.forEach((record, index) => {
    box(root, `PARTICLE__P6__NEUTRINO_STATE_VOLUME_${index + 1}`, [20.4, 2.25, 2.4], record.intensity, [0, record.y, record.z], true, [0, 0, record.slope]);
    box(root, `PARTICLE__P6__TRANSLUCENT_INSULATED_GLASS_LAYER_${index + 1}`, [20.5, 1.76, 0.11], m.smokeGlass, [0, record.y, record.z + 1.24], false, [0, 0, record.slope]);
    const diagonals: InstanceTransform[] = [];
    for (let fin = 0; fin < 22; fin += 1) diagonals.push({ position: [-9.8 + fin * 0.93, record.y, record.z + 1.31], scale: [0.055, 1.92, 0.07], rotation: [0, 0, (fin % 2 ? 1 : -1) * (0.28 + index * 0.04)], name: `PARTICLE__P6__MOIRE_SCREEN_${index + 1}_FIN_${fin + 1}` });
    instances(root, `PARTICLE__P6__GEOMETRIC_MOIRE_SCREEN_${index + 1}`, UNIT_BOX, index === 1 ? m.titanium : m.mesh, diagonals);
    pulse(box(root, `PARTICLE__P6__STATE_INTENSITY_LINE_${index + 1}`, [19.8, 0.045, 0.055], [m.cyanLight, m.violetLight, m.amberLight][index].clone(), [0, 0.48 + index * 0.05, record.z + 1.37]), 0.0045, index / 3, 0.15, 2.4);
  });
  box(root, 'PARTICLE__P6__DIAGONAL_ENTRANCE_PIER', [1.35, 0.12, 13.0], m.paleStone, [-2.8, 0.31, 8.6], false, [0, -0.22, 0]);
  for (let strip = 0; strip < 3; strip += 1) box(root, `PARTICLE__P6__EXCHANGING_NEUTRINO_STRIP_${strip + 1}`, [0.055, 0.025, 12.5], [m.cyanLight, m.violetLight, m.amberLight][strip], [-3.2 + strip * 0.4, 0.39, 8.4], false, [0, -0.22 + (strip - 1) * 0.018, 0]);
  return root;
}

function createAsymmetry(m: ParticleMaterials) {
  const root = new THREE.Group(); root.name = 'PARTICLE__P7__ASYMMETRY_HOUSE'; addTechnicalPlinth(root, 'P7', 13.8, 11.4, m, true);
  box(root, 'PARTICLE__P7__WEST_MATTE_CP_TOWER', [4.25, 6.1, 4.2], m.blackCeramic, [-3.2, 3.27, 0], true);
  box(root, 'PARTICLE__P7__EAST_POLISHED_CP_TOWER', [4.25, 6.18, 4.2], m.mirror, [3.2, 3.31, 0], true);
  for (let level = 0; level < 10; level += 1) {
    box(root, `PARTICLE__P7__WEST_ASCENDING_WINDOW_BAND_${level + 1}`, [4.36, 0.11, 0.07], m.smokeGlass, [-3.2, 0.8 + level * 0.52, 2.14], false, [0, 0, 0.035]);
    box(root, `PARTICLE__P7__EAST_ASCENDING_WINDOW_BAND_${level + 1}`, [4.36, 0.11, 0.07], m.smokeGlass, [3.2, 0.82 + level * 0.52, 2.14], false, [0, 0, -0.029]);
  }
  const westBays: InstanceTransform[] = [];
  const eastBays: InstanceTransform[] = [];
  for (let bay = 0; bay < 19; bay += 1) westBays.push({ position: [-5.12 + bay * 0.215, 3.25, 2.2], scale: [0.055, 5.55, 0.08], name: `PARTICLE__P7__WEST_MATTE_FACADE_BAY_${bay + 1}` });
  for (let bay = 0; bay < 20; bay += 1) eastBays.push({ position: [1.22 + bay * 0.208, 3.29, 2.2], scale: [0.055, 5.62, 0.08], name: `PARTICLE__P7__EAST_POLISHED_FACADE_BAY_${bay + 1}` });
  instances(root, 'PARTICLE__P7__WEST_NINETEEN_FACADE_BAYS', UNIT_BOX, m.steel, westBays);
  instances(root, 'PARTICLE__P7__EAST_TWENTY_FACADE_BAYS', UNIT_BOX, m.titanium, eastBays);
  box(root, 'PARTICLE__P7__OFF_AXIS_GLAZED_CONNECTION_PRISM', [6.6, 1.05, 1.5], m.dichroic, [0.18, 4.25, 0.12], true, [0, 0.025, 0]);
  box(root, 'PARTICLE__P7__BENT_REFLECTING_CHANNEL', [0.65, 0.055, 10.8], m.water, [0.16, 0.28, 1.0], false, [0, 0.025, 0]);
  const canopy = new THREE.Group(); canopy.name = 'PARTICLE__P7__DECAY_TREE_ENTRANCE_CANOPY'; root.add(canopy);
  const trunkStart = new THREE.Vector3(0, 2.55, 4.2); const trunkEnd = new THREE.Vector3(0, 2.35, 6.0);
  pipe(canopy, 'PARTICLE__P7__DECAY_TREE_STRUCTURAL_TRUNK', trunkStart, trunkEnd, 0.16, m.titanium, true);
  for (let branch = 0; branch < 12; branch += 1) {
    const tier = Math.floor(branch / 4); const side = branch % 4 - 1.5; const start = new THREE.Vector3(side * 0.35, 2.35 - tier * 0.08, 5.5 + tier * 0.65); const end = new THREE.Vector3(side * (1.25 + tier * 0.7), 2.2 - tier * 0.07, 6.5 + tier * 0.8);
    pipe(canopy, `PARTICLE__P7__DECAY_BRANCH_${branch + 1}`, start, end, 0.07, m.titanium);
    pulse(slabBetween(canopy, `PARTICLE__P7__DECAY_BRANCH_LIGHT_${branch + 1}`, start.clone().setY(start.y + 0.05), end.clone().setY(end.y + 0.05), 0.06, 0.03, branch % 2 ? m.cyanLight.clone() : m.violetLight.clone()), 0.008, branch * 0.24);
  }
  return root;
}

function createNoctis(m: ParticleMaterials) {
  const root = new THREE.Group(); root.name = 'PARTICLE__P8__NOCTIS';
  cylinder(root, 'PARTICLE__P8__ARTIFICIAL_BASALT_DEPRESSION', 14.8, 0.18, m.gravel, [0, 0.09, 0], false, 24);
  const segmentArc = Math.PI * 2 / 14 - 0.045;
  for (let segment = 0; segment < 13; segment += 1) {
    const actual = segment < 2 ? segment : segment + 1;
    const angle = actual * Math.PI * 2 / 14 + 0.022;
    const volume = torus(root, `PARTICLE__P8__BLACK_CONCENTRIC_RING_SEGMENT_${segment + 1}`, 4.85, 1.1, m.blackCeramic, [0, 0.92, 0], [Math.PI / 2, 0, angle], segmentArc, true, 8, 10);
    volume.scale.y = 0.68;
    for (let band = 0; band < 3; band += 1) torus(root, `PARTICLE__P8__MICROTEXTURE_BAND_${segment + 1}_${band + 1}`, 4.2 + band * 0.55, 0.025, m.steel, [0, 0.96 + band * 0.12, 0], [Math.PI / 2, 0, angle], segmentArc, false, 4, 8);
  }
  box(root, 'PARTICLE__P8__ROOF_GAP_SILHOUETTE_BRIDGE', [2.8, 0.25, 1.1], m.steel, [3.9, 1.85, 3.4], true, [0, -Math.PI / 4, 0]);
  for (let well = 0; well < 7; well += 1) { const a = 0.5 + well * 0.78; cylinder(root, `PARTICLE__P8__ISOLATED_REFLECTIVE_LIGHT_WELL_${well + 1}`, 0.42, 0.62 + well % 3 * 0.18, well % 2 ? m.mirror : m.titanium, [Math.cos(a) * (2.2 + well % 2), 1.82, Math.sin(a) * (2.2 + well % 2)], false, 12); }
  pulse(torus(root, 'PARTICLE__P8__FAINT_DARK_SECTOR_SIGNAL_TRACE', 5.65, 0.026, m.violetLight.clone(), [0, 1.15, 0], [Math.PI / 2, 0, 0.4], Math.PI * 1.72, false, 4, 36), 0.0038, 0.31, 0.02, 1.2);
  return root;
}

function createSymmetria(m: ParticleMaterials) {
  const root = new THREE.Group(); root.name = 'PARTICLE__P9__SYMMETRIA'; addTechnicalPlinth(root, 'P9', 19.6, 19.6, m);
  for (let wing = 0; wing < 4; wing += 1) {
    const a = wing * Math.PI / 2; const x = Math.cos(a) * 5.35; const z = Math.sin(a) * 5.35;
    box(root, `PARTICLE__P9__CARDINAL_STONE_WING_${wing + 1}`, wing % 2 ? [5.2, 2.35, 7.6] : [7.6, 2.35, 5.2], m.paleStone, [x, 1.4 + (wing === 1 ? 0.018 : 0), z], true);
    const frameX = Math.cos(a) * 9.0; const frameZ = Math.sin(a) * 9.0;
    if (wing % 2) {
      box(root, `PARTICLE__P9__MONUMENTAL_TERMINAL_FRAME_${wing + 1}_TOP`, [5.8, 0.35, 0.35], m.bronze, [0, 3.2, frameZ]);
      box(root, `PARTICLE__P9__MONUMENTAL_TERMINAL_FRAME_${wing + 1}_L`, [0.35, 3.4, 0.35], m.bronze, [-2.72, 1.65, frameZ], true);
      box(root, `PARTICLE__P9__MONUMENTAL_TERMINAL_FRAME_${wing + 1}_R`, [0.35, 3.4, 0.35], m.bronze, [2.72, 1.65, frameZ], true);
    } else {
      box(root, `PARTICLE__P9__MONUMENTAL_TERMINAL_FRAME_${wing + 1}_TOP`, [0.35, 0.35, 5.8], m.bronze, [frameX, 3.2, 0]);
      box(root, `PARTICLE__P9__MONUMENTAL_TERMINAL_FRAME_${wing + 1}_L`, [0.35, 3.4, 0.35], m.bronze, [frameX, 1.65, -2.72], true);
      box(root, `PARTICLE__P9__MONUMENTAL_TERMINAL_FRAME_${wing + 1}_R`, [0.35, 3.4, 0.35], m.bronze, [frameX, 1.65, 2.72], true);
    }
  }
  cylinder(root, 'PARTICLE__P9__CENTRAL_SYMMETRY_CYLINDER', 5.3, 4.3, m.ceramic, [0, 2.38, 0], true, 24);
  for (let ring = 0; ring < 8; ring += 1) rotate(torus(root, `PARTICLE__P9__CALIBRATED_CONCENTRIC_RING_${ring + 1}`, 2.8 + ring * 0.18, 0.055, ring % 2 ? m.titanium : m.bronze, [0, 1.05 + ring * 0.42, 0], [Math.PI / 2, 0, ring * 0.03]), 0.0002 + ring * 0.00003);
  const garden: InstanceTransform[] = [];
  for (let index = 0; index < 48; index += 1) { const row = Math.floor(index / 12); const col = index % 12; garden.push({ position: [-9.4 + col * 1.7, 0.7 + (index % 3) * 0.12, -9.4 + row * 6.25], scale: [0.08, 1.1 + (index % 3) * 0.24, 0.08], name: `PARTICLE__P9__CALIBRATED_SHADOW_ROD_${index + 1}` }); }
  instances(root, 'PARTICLE__P9__PRECISION_SHADOW_GARDEN', UNIT_CYLINDER_8, m.titanium, garden);
  return root;
}

function createSilence(m: ParticleMaterials) {
  const root = new THREE.Group(); root.name = 'PARTICLE__P10__QUANTUM_SILENCE_PAVILION';
  box(root, 'PARTICLE__P10__DRY_VIBRATION_MOAT_NORTH', [15.2, 0.26, 1.15], m.gravel, [0, 0.13, -6.45]);
  box(root, 'PARTICLE__P10__DRY_VIBRATION_MOAT_SOUTH', [15.2, 0.26, 1.15], m.gravel, [0, 0.13, 6.45]);
  box(root, 'PARTICLE__P10__DRY_VIBRATION_MOAT_WEST', [1.15, 0.26, 11.75], m.gravel, [-7.05, 0.13, 0]);
  box(root, 'PARTICLE__P10__DRY_VIBRATION_MOAT_EAST', [1.15, 0.26, 11.75], m.gravel, [7.05, 0.13, 0]);
  const pavilions: InstanceTransform[] = [];
  for (let row = 0; row < 2; row += 1) for (let col = 0; col < 3; col += 1) pavilions.push({ position: [-4.6 + col * 4.6, 1.05, -2.7 + row * 5.4], scale: [3.55, 1.65, 4.1], name: `PARTICLE__P10__ISOLATED_SENSOR_PAVILION_${row * 3 + col + 1}` });
  instances(root, 'PARTICLE__P10__SIX_ISOLATED_SENSOR_PAVILIONS', UNIT_BOX, m.ceramic, pavilions, true);
  const screens = pavilions.map((value, index) => ({ position: [value.position[0], 1.42, value.position[2] + (index < 3 ? 2.08 : -2.08)] as const, scale: [3.3, 0.76, 0.08] as const, name: `PARTICLE__P10__COPPER_ALLOY_MESH_SCREEN_${index + 1}` }));
  instances(root, 'PARTICLE__P10__VARIABLE_DENSITY_SENSOR_SCREENS', UNIT_BOX, m.copper, screens);
  box(root, 'PARTICLE__P10__ENORMOUS_TAPERED_FLOATING_ROOF', [13.8, 0.18, 11.1], m.steel, [0, 2.5, 0], true);
  box(root, 'PARTICLE__P10__FORTY_CENTIMETRE_TAPERED_ROOF_EDGE_N', [14.5, 0.04, 0.42], m.steel, [0, 2.43, -5.69], true);
  box(root, 'PARTICLE__P10__FORTY_CENTIMETRE_TAPERED_ROOF_EDGE_S', [14.5, 0.04, 0.42], m.steel, [0, 2.43, 5.69], true);
  box(root, 'PARTICLE__P10__FORTY_CENTIMETRE_TAPERED_ROOF_EDGE_W', [0.42, 0.04, 11.0], m.steel, [-7.04, 2.43, 0], true);
  box(root, 'PARTICLE__P10__FORTY_CENTIMETRE_TAPERED_ROOF_EDGE_E', [0.42, 0.04, 11.0], m.steel, [7.04, 2.43, 0], true);
  box(root, 'PARTICLE__P10__NESTED_ROOF_ISOLATION_CUT_1', [11.8, 0.035, 0.055], m.cyanLight, [0, 2.6, -3.8]);
  box(root, 'PARTICLE__P10__NESTED_ROOF_ISOLATION_CUT_2', [8.6, 0.035, 0.055], m.cyanLight, [0, 2.6, 0]);
  box(root, 'PARTICLE__P10__NESTED_ROOF_ISOLATION_CUT_3', [5.4, 0.035, 0.055], m.cyanLight, [0, 2.6, 3.8]);
  pulse(box(root, 'PARTICLE__P10__FLOATING_ROOF_SILENCE_LINE_N', [14.0, 0.035, 0.045], m.violetLight.clone(), [0, 2.34, -5.46]), 0.0028, 0.4, 0.05, 1.3);
  pulse(box(root, 'PARTICLE__P10__FLOATING_ROOF_SILENCE_LINE_S', [14.0, 0.035, 0.045], m.violetLight.clone(), [0, 2.34, 5.46]), 0.0028, 0.4, 0.05, 1.3);
  pulse(box(root, 'PARTICLE__P10__FLOATING_ROOF_SILENCE_LINE_W', [0.045, 0.035, 10.85], m.violetLight.clone(), [-6.83, 2.34, 0]), 0.0028, 0.4, 0.05, 1.3);
  pulse(box(root, 'PARTICLE__P10__FLOATING_ROOF_SILENCE_LINE_E', [0.045, 0.035, 10.85], m.violetLight.clone(), [6.83, 2.34, 0]), 0.0028, 0.4, 0.05, 1.3);
  for (let stack = 0; stack < 5; stack += 1) cylinder(root, `PARTICLE__P10__SCREENED_CRYOGENIC_EXHAUST_${stack + 1}`, 0.34, 0.85, stack % 2 ? m.ceramic : m.mesh, [-3.4 + stack * 1.7, 3.12, 0], false, 12);
  return root;
}

function createLattice(m: ParticleMaterials) {
  const root = new THREE.Group(); root.name = 'PARTICLE__P11__LATTICE_CITADEL'; addTechnicalPlinth(root, 'P11', 19.7, 14.2, m, true);
  const modules: InstanceTransform[] = [];
  const cellsX = 7; const cellsZ = 5;
  for (let z = 0; z < cellsZ; z += 1) for (let x = 0; x < cellsX; x += 1) {
    const edge = Math.min(x, cellsX - 1 - x, z, cellsZ - 1 - z); const levels = 2 + Math.min(3, edge + (x + z) % 2);
    for (let level = 0; level < levels; level += 1) modules.push({ position: [-7.8 + x * 2.6, 0.78 + level * 1.05, -5.2 + z * 2.6], scale: [2.35 + (x - 3) * 0.025, 0.96, 2.35], name: `PARTICLE__P11__LATTICE_MODULE_${x + 1}_${z + 1}_${level + 1}` });
  }
  instances(root, 'PARTICLE__P11__STEPPED_COMPUTATIONAL_LATTICE', UNIT_BOX, m.ceramic, modules, true);
  const facadeCells: InstanceTransform[] = [];
  for (let row = 0; row < 6; row += 1) for (let col = 0; col < 18; col += 1) facadeCells.push({ position: [-8.45 + col * (0.98 + Math.abs(col - 8.5) * 0.004), 0.72 + row * 0.72, 6.55], scale: [0.55, 0.4, 0.08], name: `PARTICLE__P11__WARPED_FACADE_CELL_${row + 1}_${col + 1}` });
  instances(root, 'PARTICLE__P11__WARPED_FACADE_GRID', UNIT_BOX, m.smokeGlass, facadeCells);
  for (let tower = 0; tower < 4; tower += 1) taper(root, `PARTICLE__P11__FACETED_COOLING_PRISM_${tower + 1}`, 2.1, 1.55, 4.2 + tower % 2 * 0.55, m.mesh, [-4.6 + tower * 3.05, 5.65 + tower % 2 * 0.27, -1.3 + tower % 2 * 2.6], true, 8, [0, tower * 0.18, 0]);
  for (let ramp = 0; ramp < 4; ramp += 1) slabBetween(root, `PARTICLE__P11__ENCLOSED_DIAGONAL_CIRCULATION_RAMP_${ramp + 1}`, new THREE.Vector3(-8.8 + ramp * 1.3, 0.4 + ramp * 0.65, 7.0), new THREE.Vector3(4.5 + ramp * 1.1, 3.1 + ramp * 0.52, 7.0), 0.42, 0.24, m.smokeGlass, true);
  box(root, 'PARTICLE__P11__SOUTHERN_COMPUTE_COOLING_CHANNEL', [18.8, 0.07, 0.85], m.water, [0, 0.28, 7.6]);
  for (let pipeIndex = 0; pipeIndex < 8; pipeIndex += 1) torus(root, `PARTICLE__P11__EXPOSED_COOLING_PIPE_ARC_${pipeIndex + 1}`, 0.72 + pipeIndex * 0.02, 0.08, m.mirror, [-7.1 + pipeIndex * 2.05, 0.9, 7.6], [0, Math.PI / 2, 0], Math.PI, false, 6, 12);
  return root;
}

function createAmplituhedron(m: ParticleMaterials) {
  const root = new THREE.Group(); root.name = 'PARTICLE__P12__AMPLITUHEDRON_HOUSE'; addTechnicalPlinth(root, 'P12', 13.2, 12.2, m, true);
  const planes = [
    { size: [10.2, 2.0, 3.2] as const, position: [-1.3, 1.55, -2.6] as const, rotation: [0.18, 0.32, -0.14] as const, mat: m.iridescent },
    { size: [7.4, 3.5, 3.6] as const, position: [2.5, 2.2, 0.1] as const, rotation: [-0.12, -0.48, 0.1] as const, mat: m.ceramic },
    { size: [8.8, 1.7, 4.2] as const, position: [-2.0, 3.45, 1.7] as const, rotation: [0.22, 0.68, 0.12] as const, mat: m.iridescent },
    { size: [6.2, 4.4, 2.4] as const, position: [1.0, 2.5, -0.5] as const, rotation: [0.1, -0.2, -0.18] as const, mat: m.paleStone },
  ];
  planes.forEach((record, index) => box(root, `PARTICLE__P12__INTERSECTING_QUANTUM_GEOMETRY_PLANE_${index + 1}`, record.size, record.mat, record.position, true, record.rotation));
  for (let wedge = 0; wedge < 5; wedge += 1) {
    const value = taper(root, `PARTICLE__P12__SKEWED_TRIANGULAR_PRISM_${wedge + 1}`, 4.2 - wedge * 0.34, 3.0 - wedge * 0.25, 4.0 + wedge * 0.35, wedge % 2 ? m.iridescent : m.ceramic, [-4.2 + wedge * 2.1, 2.2 + wedge * 0.18, -1.6 + (wedge % 3) * 1.7], true, 3, [Math.PI / 2, wedge * 0.36, 0]);
    value.scale.z = 0.72;
  }
  const entranceColumns: InstanceTransform[] = [];
  for (let column = 0; column < 9; column += 1) entranceColumns.push({ position: [-3.4 + column * 0.85, 1.35, 5.35 + Math.sin(column * 1.1) * 0.55], scale: [0.07, 2.7, 0.07], rotation: [(column - 4) * 0.03, 0, (column % 3 - 1) * 0.12], name: `PARTICLE__P12__PERSPECTIVE_RESOLVING_COLUMN_${column + 1}` });
  instances(root, 'PARTICLE__P12__TRIANGULAR_ENTRANCE_VOID_COLUMNS', UNIT_CYLINDER_8, m.titanium, entranceColumns);
  for (let edge = 0; edge < 12; edge += 1) {
    const a = edge * Math.PI * 2 / 12; const start = new THREE.Vector3(Math.cos(a) * 5.8, 0.35 + (edge % 3) * 1.25, Math.sin(a) * 4.7); const end = new THREE.Vector3(Math.cos(a + 0.55) * 4.7, 1.2 + (edge % 4) * 0.85, Math.sin(a + 0.55) * 3.8);
    pulse(pipe(root, `PARTICLE__P12__PARTIAL_WIREFRAME_EDGE_${edge + 1}`, start, end, 0.035, edge % 3 ? m.violetLight.clone() : m.cyanLight.clone()), 0.006, edge * 0.3);
  }
  return root;
}

function createRenormalization(m: ParticleMaterials) {
  const root = new THREE.Group(); root.name = 'PARTICLE__P13__RENORMALIZATION_TOWER'; addTechnicalPlinth(root, 'P13', 10.4, 9.9, m);
  box(root, 'PARTICLE__P13__ROUGH_BASALT_THEORY_PLINTH', [9.6, 1.05, 8.8], m.basalt, [0, 0.74, 0], true);
  let y = 1.28;
  const centers: THREE.Vector3[] = [];
  for (let regime = 0; regime < 7; regime += 1) {
    const height = 1.24 + (regime < 2 ? 0.18 : 0); const sizeX = 7.7 - regime * 0.62; const sizeZ = 6.8 - regime * 0.5; const angle = regime * 0.72; const x = Math.cos(angle) * regime * 0.17; const z = Math.sin(angle) * regime * 0.17;
    const mat = regime < 2 ? m.steel : regime < 4 ? m.titanium : regime < 6 ? m.ceramic : m.paleStone;
    box(root, `PARTICLE__P13__RENORMALIZATION_REGIME_${regime + 1}`, [sizeX, height, sizeZ], mat, [x, y + height * 0.5, z], true, [0, regime * 0.055, 0]);
    pulse(box(root, `PARTICLE__P13__RECESSED_ENERGY_SCALE_GAP_${regime + 1}`, [sizeX + 0.08, 0.085, sizeZ + 0.08], regime % 2 ? m.cyanLight.clone() : m.violetLight.clone(), [x, y, z], false, [0, regime * 0.055, 0]), 0.004, regime / 7, 0.1, 2.5);
    centers.push(new THREE.Vector3(x, y + height * 0.5, z)); y += height + 0.11;
  }
  const branchPoints: THREE.Vector3[] = [new THREE.Vector3(4.3, 0.25, 0.6), new THREE.Vector3(4.0, 3.0, 0.2), new THREE.Vector3(3.2, 5.8, -0.3), new THREE.Vector3(2.0, 8.6, -0.7), new THREE.Vector3(0.8, 10.8, -0.3)];
  for (let index = 0; index < branchPoints.length - 1; index += 1) {
    pipe(root, `PARTICLE__P13__BRANCHING_EXOSKELETON_TRUNK_${index + 1}`, branchPoints[index], branchPoints[index + 1], 0.24 - index * 0.035, m.titanium, true);
    for (let branch = 0; branch < index + 1; branch += 1) pipe(root, `PARTICLE__P13__ENERGY_SCALE_BRANCH_${index + 1}_${branch + 1}`, branchPoints[index + 1], centers[Math.min(centers.length - 1, index + 2)].clone().add(new THREE.Vector3(0, branch * 0.12, branch % 2 ? 1.6 : -1.6)), Math.max(0.045, 0.12 - index * 0.018), m.titanium);
  }
  box(root, 'PARTICLE__P13__OPEN_METALLIC_BEACON_CROWN_TOP', [4.2, 0.16, 0.16], m.titanium, [0, 11.55, 0]);
  for (let corner = 0; corner < 4; corner += 1) box(root, `PARTICLE__P13__OPEN_CROWN_POST_${corner + 1}`, [0.16, 1.55, 0.16], m.titanium, [corner < 2 ? -1.95 : 1.95, 10.85, corner % 2 ? -1.65 : 1.65]);
  rotate(pulse(taper(root, 'PARTICLE__P13__LUMINOUS_POLYHEDRAL_DISTRICT_BEACON', 0.85, 0.15, 1.2, m.violetLight.clone(), [0, 10.9, 0], false, 8), 0.003, 0.5, 0.5, 3), 0.004);
  return root;
}

function createGenesis(m: ParticleMaterials) {
  const root = new THREE.Group(); root.name = 'PARTICLE__P14__GENESIS_SPIRAL'; addTechnicalPlinth(root, 'P14', 17.2, 16.2, m);
  const spiralMaterials = [m.blackCeramic, m.basalt, m.steel, m.titanium, m.paleStone, m.ceramic];
  const points: THREE.Vector3[] = [];
  for (let segment = 0; segment < 14; segment += 1) {
    const t = segment / 13; const angle = 0.65 + t * Math.PI * 1.65; const radius = 1.6 + t * 6.4; const point = new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius); points.push(point);
    const nextAngle = angle + 0.18; const height = 4.0 - t * 2.9;
    box(root, `PARTICLE__P14__EXPANDING_PHASE_SEGMENT_${segment + 1}`, [1.4 + t * 1.2, height, 2.4 + t * 0.8], spiralMaterials[Math.min(5, Math.floor(t * 6))], [point.x, 0.3 + height * 0.5, point.z], true, [0, -nextAngle, 0]);
    pipe(root, `PARTICLE__P14__WIDENING_BRONZE_SPIRAL_RIB_${segment + 1}`, new THREE.Vector3(point.x, 0.42, point.z), new THREE.Vector3(point.x, 0.42 + height, point.z), 0.045 + t * 0.035, m.bronze);
  }
  taper(root, 'PARTICLE__P14__TRUNCATED_EARLY_UNIVERSE_CONE', 6.2, 3.4, 4.2, m.blackCeramic, [points[0].x, 2.42, points[0].z], true, 24);
  torus(root, 'PARTICLE__P14__ARCHITECTURAL_COSMOLOGY_OCULUS', 1.68, 0.16, m.titanium, [points[0].x, 4.56, points[0].z], [Math.PI / 2, 0, 0]);
  cylinder(root, 'PARTICLE__P14__SHALLOW_PHASE_TRANSITION_ARRIVAL_DEPRESSION', 12.5, 0.07, m.paleStone, [1.8, 0.28, -3.4], false, 24);
  for (let ring = 0; ring < 8; ring += 1) pulse(torus(root, `PARTICLE__P14__EXPANDING_RAINWATER_MIST_RING_${ring + 1}`, 1.25 + ring * 0.65, 0.025, ring % 3 ? m.cyanLight.clone() : m.violetLight.clone(), [1.8, 0.34, -3.4]), 0.002 + ring * 0.00025, ring / 8, 0.05, 1.5);
  return root;
}

function createSignalArchive(m: ParticleMaterials) {
  const root = new THREE.Group(); root.name = 'PARTICLE__P15__SIGNAL_COAST_ARCHIVE'; addTechnicalPlinth(root, 'P15', 24.8, 10.2, m);
  box(root, 'PARTICLE__P15__FORTIFIED_BASALT_STORM_BARRIER_BASE', [24.0, 2.6, 7.4], m.basalt, [0, 1.52, 0], true);
  const blocks: InstanceTransform[] = [];
  for (let row = 0; row < 4; row += 1) for (let col = 0; col < 20; col += 1) blocks.push({ position: [-11.42 + col * 1.2 + (row % 2) * 0.25, 0.62 + row * 0.58, 3.76], scale: [1.06, 0.48, 0.32], rotation: [0, (col % 3 - 1) * 0.025, 0], name: `PARTICLE__P15__WIND_DEFLECTING_BASALT_BLOCK_${row + 1}_${col + 1}` });
  instances(root, 'PARTICLE__P15__WIND_DEFLECTING_BASALT_BLOCK_FIELD', UNIT_BOX, m.blackCeramic, blocks);
  box(root, 'PARTICLE__P15__CONTINUOUS_SILVER_GREY_ARCHIVE_GLASS', [22.6, 1.55, 5.8], m.smokeGlass, [0, 3.35, -0.35], true);
  for (let section = 0; section < 12; section += 1) {
    const x = -10.9 + section * 1.98; const y = 4.38 + Math.sin(section * Math.PI / 5.5) * 0.32;
    box(root, `PARTICLE__P15__FROZEN_WAVE_CANOPY_SECTION_${section + 1}`, [2.05, 0.18, 7.2], m.titanium, [x, y, 0], true, [0, 0, Math.cos(section * Math.PI / 5.5) * 0.045]);
    pulse(box(root, `PARTICLE__P15__ALERT_WAVEFRONT_EDGE_${section + 1}`, [2.0, 0.045, 0.05], section % 3 ? m.cyanLight.clone() : m.amberLight.clone(), [x, y + 0.12, 3.62], false, [0, 0, Math.cos(section * Math.PI / 5.5) * 0.045]), 0.012, section / 12);
  }
  for (let tower = 0; tower < 2; tower += 1) {
    const x = tower ? 10.6 : -10.6;
    taper(root, `PARTICLE__P15__${tower ? 'EASTERN' : 'WESTERN'}_SENTINEL_TOWER`, 2.8, 1.7, 6.4 + tower * 0.25, m.titanium, [x, 3.45 + tower * 0.125, -0.2], true, 12);
    for (let fin = 0; fin < 12; fin += 1) { const a = fin * Math.PI * 2 / 12; box(root, `PARTICLE__P15__SENTINEL_VERTICAL_FIN_${tower + 1}_${fin + 1}`, [0.08, 5.6, 0.3], m.mirror, [x + Math.cos(a) * 1.25, 3.4, -0.2 + Math.sin(a) * 1.25], false, [0, -a, 0]); }
    for (let instrument = 0; instrument < 3; instrument += 1) sphere(root, `PARTICLE__P15__SENTINEL_COMPACT_RADOME_${tower + 1}_${instrument + 1}`, [0.34, 0.22, 0.34], tower ? m.dichroic : m.ceramic, [x - 0.6 + instrument * 0.6, 6.85 + tower * 0.25, -0.2]);
  }
  for (let conduit = 0; conduit < 6; conduit += 1) {
    const x = -7.5 + conduit * 3.0;
    pipe(root, `PARTICLE__P15__VISIBLE_DATA_CABLE_CONDUIT_${conduit + 1}_A`, new THREE.Vector3(x, 0.35, 5.0), new THREE.Vector3(x, 1.25, 3.9), 0.14, m.mirror);
    pipe(root, `PARTICLE__P15__VISIBLE_DATA_CABLE_CONDUIT_${conduit + 1}_B`, new THREE.Vector3(x, 1.25, 3.9), new THREE.Vector3(x * 0.92, 1.55, 2.9), 0.14, m.mirror);
  }
  const ePaper: InstanceTransform[] = [];
  for (let band = 0; band < 18; band += 1) ePaper.push({ position: [-10.5 + band * 1.24, 2.0 + (band % 3) * 0.28, -3.76], scale: [0.94, 0.15, 0.045], name: `PARTICLE__P15__ARCHIVE_E_PAPER_BAND_${band + 1}` });
  instances(root, 'PARTICLE__P15__LANDWARD_ARCHIVE_E_PAPER_FIELD', UNIT_BOX, m.ceramic, ePaper);
  return root;
}

function assignMetadata(root: THREE.Group, record: ParticlePhysicsBuildingProgram) {
  root.userData.exteriorProgram = true;
  root.userData.particlePhysicsBuilding = true;
  root.userData.buildingCode = record.code;
  root.userData.buildingName = record.name;
  root.userData.semanticName = record.name;
  root.userData.purpose = record.purpose;
  root.userData.footprintMetres = [...record.footprintMetres];
  root.userData.heightMetres = record.heightMetres;
  root.userData.placementZone = record.placementZone;
  root.userData.exteriorMotif = record.exteriorMotif;
  root.userData.featureRole = 'building';
  root.userData.featureTag = record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  root.traverse((object) => { object.userData.selectableId = DISTRICT_ID; object.userData.districtId = DISTRICT_ID; });
  return root;
}

function createBuilding(record: ParticlePhysicsBuildingProgram, m: ParticleMaterials) {
  const factories: Record<ParticlePhysicsBuildingForm, (materials: ParticleMaterials) => THREE.Group> = {
    conventus: createConventus,
    chronos: createChronos,
    'event-loom': createEventLoom,
    scalaris: createScalaris,
    chromodynamic: createChromodynamic,
    oscilla: createOscilla,
    asymmetry: createAsymmetry,
    noctis: createNoctis,
    symmetria: createSymmetria,
    silence: createSilence,
    lattice: createLattice,
    amplituhedron: createAmplituhedron,
    renormalization: createRenormalization,
    genesis: createGenesis,
    'signal-archive': createSignalArchive,
  };
  return assignMetadata(factories[record.form](m), record);
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!;
  const radialMargin = 8.8;
  const angularMargin = (sector.endAngle - sector.startAngle) * 0.055;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT);
  const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
  return new THREE.Vector3(Math.cos(angle) * radius - definition.position[0], y, Math.sin(angle) * radius - definition.position[2]);
}

function districtArc(definition: DistrictDefinition, radialT: number, startT: number, endT: number, segments: number, y = FLOOR_Y) {
  return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, radialT, THREE.MathUtils.lerp(startT, endT, index / (segments - 1)), y));
}

function districtSpine(definition: DistrictDefinition, angularT: number, startT: number, endT: number, segments: number, y = FLOOR_Y) {
  return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, THREE.MathUtils.lerp(startT, endT, index / (segments - 1)), angularT, y));
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

function addRibbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, mat: THREE.Material, walkable = true) {
  const ribbon = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), mat), name);
  ribbon.userData.walkable = walkable; ribbon.userData.navObstacle = false; ribbon.userData.particlePhysicsRoute = true; ribbon.receiveShadow = true; parent.add(ribbon); return ribbon;
}

function offsetPath(points: readonly THREE.Vector3[], offset: number) {
  return points.map((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); return point.clone().add(new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(offset)).setY(FLOOR_Y + 0.025); });
}

function addInfrastructure(district: THREE.Group, definition: DistrictDefinition, m: ParticleMaterials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'PARTICLE__DISTRICT_EVENT_INFRASTRUCTURE';
  const eventPromenade = districtArc(definition, 0.56, 0.02, 0.98, 120); addRibbon(infrastructure, 'PARTICLE__EVENT_TRACK_PROMENADE', eventPromenade, 1.9, m.paleStone);
  const theoryRidge = districtArc(definition, 0.10, 0.02, 0.98, 108); addRibbon(infrastructure, 'PARTICLE__THEORY_RIDGE_PATH', theoryRidge, 1.15, m.paleStone);
  const dataCoast = districtArc(definition, 0.94, 0.02, 0.98, 108); addRibbon(infrastructure, 'PARTICLE__DATA_COAST_SERVICE_ROAD', dataCoast, 1.65, m.basalt);
  const probabilitySpine = districtSpine(definition, 0.48, 0.03, 0.97, 82); addRibbon(infrastructure, 'PARTICLE__PROBABILITY_FIELD_SPINE', probabilitySpine, 1.05, m.paleStone);
  [-0.52, 0.52].forEach((offset, index) => pulse(addRibbon(infrastructure, `PARTICLE__EVENT_TRACK_TRACE_${index + 1}`, offsetPath(eventPromenade, offset), 0.04, index ? m.cyanLight.clone() : m.violetLight.clone(), false), 0.008, index * 0.5));
  [0.15, 0.34, 0.68, 0.86].forEach((angularT, index) => addRibbon(infrastructure, `PARTICLE__CURVED_OPERATIONAL_LINK_${index + 1}`, districtSpine(definition, angularT, 0.04, 0.96, 62), 0.74, index < 2 ? m.paleStone : m.basalt));
  for (let plaza = 0; plaza < 8; plaza += 1) {
    const point = pointInDistrict(definition, plaza % 2 ? 0.46 : 0.65, 0.08 + plaza * 0.12);
    cylinder(infrastructure, `PARTICLE__INTERACTION_PLAZA_${plaza + 1}`, 2.6 + plaza % 3 * 0.35, 0.06, plaza % 2 ? m.paleStone : m.basalt, [point.x, 0.075, point.z], false, 24);
    for (let track = 0; track < 5; track += 1) { const a = track * Math.PI * 2 / 5 + plaza * 0.23; slabBetween(infrastructure, `PARTICLE__PLAZA_EVENT_TRACK_${plaza + 1}_${track + 1}`, point.clone().setY(0.12), point.clone().add(new THREE.Vector3(Math.cos(a) * (1.2 + track * 0.16), 0.12, Math.sin(a) * (1.2 + track * 0.16))), 0.035, 0.025, track % 2 ? m.titanium : m.bronze); }
  }
  for (let diagram = 0; diagram < 10; diagram += 1) {
    const point = pointInDistrict(definition, 0.26 + (diagram % 3) * 0.2, 0.06 + diagram * 0.09);
    const joint = point.clone().add(new THREE.Vector3(0, 0.02, 0));
    slabBetween(infrastructure, `PARTICLE__FEYNMAN_RAIN_CHANNEL_${diagram + 1}_IN`, joint.clone().add(new THREE.Vector3(-1.25, 0, -0.7)), joint, 0.07, 0.025, m.water);
    slabBetween(infrastructure, `PARTICLE__FEYNMAN_RAIN_CHANNEL_${diagram + 1}_OUT_A`, joint, joint.clone().add(new THREE.Vector3(1.1, 0, -0.85)), 0.07, 0.025, m.water);
    slabBetween(infrastructure, `PARTICLE__FEYNMAN_RAIN_CHANNEL_${diagram + 1}_OUT_B`, joint, joint.clone().add(new THREE.Vector3(1.1, 0, 0.85)), 0.07, 0.025, m.water);
  }
  district.add(infrastructure); return { infrastructure, eventPromenade };
}

function addLandscape(district: THREE.Group, definition: DistrictDefinition, m: ParticleMaterials) {
  const landscape = new THREE.Group(); landscape.name = 'PARTICLE__LOW_SIGNAL_AND_DATA_COAST_LANDSCAPE';
  const grasses: InstanceTransform[] = [];
  for (let index = 0; index < 96; index += 1) { const point = pointInDistrict(definition, index % 2 ? 0.31 : 0.72, 0.025 + Math.floor(index / 2) * 0.02); grasses.push({ position: [point.x, 0.24 + (index % 4) * 0.04, point.z], scale: [0.045, 0.38 + (index % 4) * 0.08, 0.045], rotation: [0, index * 0.7, (index % 3 - 1) * 0.13], name: `PARTICLE__SILVER_GRASS_STEM_${index + 1}` }); }
  instances(landscape, 'PARTICLE__LOW_SILVER_GRASS_FIELD', UNIT_CYLINDER_8, m.silverGrass, grasses);
  const lightPoints: InstanceTransform[] = [];
  for (let index = 0; index < 72; index += 1) { const point = pointInDistrict(definition, 0.34 + (index % 4) * 0.15, 0.03 + Math.floor(index / 4) * 0.053); lightPoints.push({ position: [point.x, 0.08, point.z], scale: [0.08, 0.035, 0.08], name: `PARTICLE__FIBRE_OPTIC_GROUND_POINT_${index + 1}` }); }
  pulse(instances(landscape, 'PARTICLE__FIBRE_OPTIC_GROUND_FIELD', UNIT_SPHERE, m.cyanLight.clone(), lightPoints), 0.0042, 0.2, 0.08, 1.8);
  const barrierPoints = districtArc(definition, 0.99, 0.03, 0.97, 28);
  for (let index = 0; index < barrierPoints.length - 1; index += 1) {
    if (index === 8 || index === 18) continue;
    slabBetween(landscape, `PARTICLE__DATA_COAST_STORM_BARRIER_${index + 1}`, barrierPoints[index], barrierPoints[index + 1], 0.58, 0.8 + (index % 3) * 0.12, m.basalt, true);
  }
  district.add(landscape); return landscape;
}

export function buildParticlePhysicsLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Particle Physics Labs District requires a masterplan sector');
  const materials = createMaterials();
  const { infrastructure, eventPromenade } = addInfrastructure(district, definition, materials);
  const landscape = addLandscape(district, definition, materials);
  const facilities = PARTICLE_PHYSICS_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials);
    const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02);
    building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2]));
    const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize();
    building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT };
    district.add(building); return building;
  });
  facilities.forEach((facility, index) => {
    const record = PARTICLE_PHYSICS_BUILDING_PROGRAM[index];
    const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, record.footprintMetres[1] / 20 + 0.8);
    const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const routePoint = eventPromenade.reduce((closest, point) => point.distanceToSquared(entrance) < closest.distanceToSquared(entrance) ? point : closest, eventPromenade[0]);
    const approach = [routePoint.clone(), routePoint.clone().lerp(entrance, 0.52), entrance];
    const road = addRibbon(infrastructure, `PARTICLE__BUILDING_APPROACH_${record.code}`, approach, 0.76, index === 7 || index === 8 || index === 9 ? materials.gravel : index >= 11 && index <= 13 ? materials.paleStone : materials.basalt);
    pulse(addRibbon(infrastructure, `PARTICLE__BUILDING_APPROACH_TRACE_${record.code}`, offsetPath(approach, 0.24), 0.035, [materials.cyanLight, materials.violetLight, materials.amberLight][index % 3].clone(), false), 0.007, index * 0.23);
    road.userData.servesBuilding = record.name;
  });
  district.userData.particlePhysicsLabsDistrict = {
    identity: 'Particle Physics Labs District',
    mapLabel: 'Particle Physics Labs',
    architecturalLanguage: 'detector-derived layered shells, graphite basalt, pale technical ceramic, brushed titanium, dark stainless steel, selective dichroic glass, event tracks, probability fields, symmetry breaking, interference, and curved spacetime',
    buildingCount: facilities.length,
    buildings: PARTICLE_PHYSICS_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, purpose: record.purpose, placementZone: record.placementZone, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorMotif: record.exteriorMotif })),
    zones: {
      centralInteraction: ['Conventus Orbis', 'Scalaris', 'Chromodynamic Court', 'Oscilla', 'The Asymmetry House'],
      computationalOperational: ['Chronos Relay', 'The Event Loom', 'The Lattice Citadel', 'The Signal Coast Archive'],
      lowSignalGarden: ['Noctis', 'Symmetria', 'The Quantum Silence Pavilion'],
      northernTheoryRidge: ['Amplituhedron House', 'The Renormalization Tower', 'Genesis Spiral'],
    },
    circulation: { primaryPromenade: 'PARTICLE__EVENT_TRACK_PROMENADE', theoryRidge: 'PARTICLE__THEORY_RIDGE_PATH', dataCoast: 'PARTICLE__DATA_COAST_SERVICE_ROAD', probabilitySpine: 'PARTICLE__PROBABILITY_FIELD_SPINE', operationalLinks: 4, exactBuildingApproaches: 15 },
    performance: { sharedPrimitiveGeometries: true, instancedFacadeFields: true, lowSegmentCurves: true, broadDecorativeLightingOnly: false },
    lightingLanguage: 'fine linear traces, isolated pulses, sparse signals, synchronized sequences, and slowly changing data patterns',
    exclusions: ['accelerator equipment', 'beam hall', 'magnet hall', 'accelerator access building'],
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: PARTICLE_PHYSICS_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: ['Event Track Promenade', 'Theory Ridge Path', 'Data Coast Service Road', 'Probability Field Spine', 'Interaction Plazas', 'Feynman Rain Channels', 'Fibre-Optic Ground Field', 'Data Coast Storm Barrier'],
    realizedFeatureTags: PARTICLE_PHYSICS_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 23,
    radialCoverage: 0.99,
    angularCoverage: 0.98,
    exteriorOnly: true,
    surfaceFacilitiesOnly: true,
    performanceAuthored: true,
  };
}
