import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type AstronomyAstrobiologyBuildingForm =
  | 'coronagraph'
  | 'chronos'
  | 'concordance'
  | 'hydrogen'
  | 'heliomagnetic'
  | 'parallax'
  | 'asterion'
  | 'noctis'
  | 'aether'
  | 'cryocean'
  | 'genesis'
  | 'aegis'
  | 'extremis'
  | 'chirality'
  | 'protostellar';

export interface AstronomyAstrobiologyBuildingProgram {
  code: string;
  name: string;
  subtitle: string;
  purpose: string;
  form: AstronomyAstrobiologyBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
}

export const ASTRONOMY_ASTROBIOLOGY_BUILDING_PROGRAM: readonly AstronomyAstrobiologyBuildingProgram[] = [
  { code: 'A1', name: 'The Coronagraph Crown', subtitle: 'Habitable-World Direct-Imaging and Exoplanet Spectroscopy Institute', purpose: 'High-contrast imaging, coronagraphs, starshades, wavefront control, and atmospheric spectroscopy', form: 'coronagraph', footprintMetres: [168, 148], heightMetres: 36, radialT: 0.16, angularT: 0.05, placementZone: 'Western precision-astronomy edge', exteriorMotif: 'black basalt disc, twelve white aperture petals, artificial-eclipse portal, and full-scale starshade canopy' },
  { code: 'A2', name: 'The Chronos Array', subtitle: 'Time-Domain Astronomy and Transient-Sky Laboratory', purpose: 'Rapid identification and follow-up of transient and moving astronomical phenomena', form: 'chronos', footprintMetres: [182, 104], heightMetres: 42, radialT: 0.16, angularT: 0.25, placementZone: 'Western transient-observation band', exteriorMotif: 'seven advancing wedge volumes, kinetic shutters, robotic telescope capsules, and Alert Meridian' },
  { code: 'A3', name: 'Concordance Spire', subtitle: 'Multi-Messenger Astronomy Coordination Center', purpose: 'Combining light, gravitational waves, neutrinos, and cosmic particles', form: 'concordance', footprintMetres: [92, 92], heightMetres: 138, radialT: 0.16, angularT: 0.45, placementZone: 'Central coordination landmark', exteriorMotif: 'four braided triangular shafts around an open void and a suspended convergence ring' },
  { code: 'A4', name: 'Hydrogen Horizon House', subtitle: 'Cosmic Dawn and 21-Centimetre Cosmology Laboratory', purpose: 'Cosmic-dawn neutral-hydrogen instrumentation, interference characterization, and signal extraction', form: 'hydrogen', footprintMetres: [176, 88], heightMetres: 19, radialT: 0.16, angularT: 0.65, placementZone: 'Radio-quiet western-southern edge', exteriorMotif: 'part-buried embankment, 160-metre copper-mesh roof blade, and low calibration antenna field' },
  { code: 'A5', name: 'The Heliomagnetic Bastion', subtitle: 'Stellar Activity, Space Weather and Star–Planet Interaction Institute', purpose: 'Stellar magnetism, flares, coronal activity, radiation environments, and planetary atmospheric effects', form: 'heliomagnetic', footprintMetres: [152, 142], heightMetres: 62, radialT: 0.16, angularT: 0.85, placementZone: 'Southern stellar-physics edge', exteriorMotif: 'circular gold-and-black bastion beneath structural magnetic-field arches and an eclipsed solar tower' },
  { code: 'A6', name: 'The Parallax Foundry', subtitle: 'Space Interferometry, Precision Astrometry and Telescope Metrology Center', purpose: 'Ultra-stable optics, precision alignment, wavefront control, and optical/infrared interferometry', form: 'parallax', footprintMetres: [198, 112], heightMetres: 48, radialT: 0.50, angularT: 0.15, placementZone: 'Material-science transition', exteriorMotif: 'two exact white calibration halls divided by an isolated silver metrology spine' },
  { code: 'A7', name: 'Asterion Shield', subtitle: 'Planetary Defense and Small-Body Dynamics Complex', purpose: 'Near-Earth-object discovery, tracking, risk calculation, reconnaissance, and deflection studies', form: 'asterion', footprintMetres: [164, 132], heightMetres: 67, radialT: 0.50, angularT: 0.35, placementZone: 'Industrial-facing service edge', exteriorMotif: 'layered inclined deflection wall, stepped instrument terraces, impact-crater forecourt, and suspended aggregate' },
  { code: 'A8', name: 'The Noctis Signal Vault', subtitle: 'Technosignature and Anomalous-Signal Research Institute', purpose: 'Technosignature searches and rigorous rejection of terrestrial interference and natural explanations', form: 'noctis', footprintMetres: [126, 108], heightMetres: 46, radialT: 0.50, angularT: 0.55, placementZone: 'Central low-interference zone', exteriorMotif: 'windowless black monolith inside a distorted conductive-mesh cage with a sunken antenna court' },
  { code: 'A9', name: 'The Aether Spectrum Gardens', subtitle: 'Exoplanet Atmosphere and Biosignature Validation Laboratory', purpose: 'Atmospheric retrieval, climate and photochemical modeling, and biosignature validation', form: 'aether', footprintMetres: [158, 132], heightMetres: 55, radialT: 0.50, angularT: 0.75, placementZone: 'Astronomy-to-astrobiology transition', exteriorMotif: 'five misaligned atmospheric shells, spectral barcode fins, eclipse entrance, and planetary landscape cells' },
  { code: 'A10', name: 'The Cryocean Institute', subtitle: 'Ocean-World Habitability and Ice-Shell Exploration Laboratory', purpose: 'Subsurface oceans, ice-water-rock chemistry, plume sampling, and autonomous life-detection systems', form: 'cryocean', footprintMetres: [158, 138], heightMetres: 68, radialT: 0.50, angularT: 0.95, placementZone: 'Forest-facing ocean-world transition', exteriorMotif: 'pressure-split ice plates, buried moon sphere, cryobot mast, black-water channels, and cyan fissures' },
  { code: 'A11', name: 'Genesis Ventworks', subtitle: 'Prebiotic Chemistry and Origins-of-Life Laboratory', purpose: 'Hydrothermal systems, mineral-mediated chemistry, early metabolism, and water-rock interactions', form: 'genesis', footprintMetres: [154, 132], heightMetres: 74, radialT: 0.84, angularT: 0.04, placementZone: 'Eastern experimental-astrobiology band', exteriorMotif: 'mineral chimney cluster, branching patinated pipes, chemical-gradient pools, and a vent-arch entrance' },
  { code: 'A12', name: 'The Aegis Exomaterial Sanctuary', subtitle: 'Extraterrestrial Sample Curation and Planetary-Protection Facility', purpose: 'Secure receipt, quarantine, curation, and contamination-controlled study of returned samples', form: 'aegis', footprintMetres: [166, 118], heightMetres: 43, radialT: 0.88, angularT: 0.25, placementZone: 'Sterile controlled-transfer zone', exteriorMotif: 'three nested sealed shells, sterile aggregate rings, retractable bridge, transfer collars, and status band' },
  { code: 'A13', name: 'The Extremis Analog Ecologies Campus', subtitle: 'Extremophile and Planetary-Environment Simulation Complex', purpose: 'Extreme cold, heat, radiation, acidity, salinity, desiccation, and Mars-analogue ecology', form: 'extremis', footprintMetres: [184, 142], heightMetres: 47, radialT: 0.84, angularT: 0.46, placementZone: 'Forest-facing ecological-gradient zone', exteriorMotif: 'five distinct environmental pods connected by a raised service spine and rover test loop' },
  { code: 'A14', name: 'The Chirality Ark', subtitle: 'Alternative Biochemistry and Synthetic Astrobiology Institute', purpose: 'Protocells, alternative molecular systems, nonstandard solvents, molecular handedness, and biochemical universality', form: 'chirality', footprintMetres: [172, 138], heightMetres: 59, radialT: 0.84, angularT: 0.68, placementZone: 'Eastern synthetic-astrobiology transition', exteriorMotif: 'opposed interlocking crescent volumes, reversed bioceramic scales, and adaptive membrane canopy' },
  { code: 'A15', name: 'The Protostellar Loom', subtitle: 'Planet Formation and Astrochemical Evolution Laboratory', purpose: 'Planet-forming disks, dust, ice, gas, molecular chemistry, and delivery of prebiotic material', form: 'protostellar', footprintMetres: [188, 154], heightMetres: 63, radialT: 0.84, angularT: 0.86, placementZone: 'Astrochemistry bridge toward material science', exteriorMotif: 'dark protostellar core, asymmetric segmented spiral arms, disk-gap landscape, and millimetre receivers' },
] as const;

const DISTRICT_ID = 'astronomy-astrobiology-labs';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 12, 8);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_Z = new THREE.Vector3(0, 0, 1);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

function material(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  const value = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.2, ...options });
  value.name = name;
  return value;
}

function createMaterials() {
  const basalt = material('Astronomy polished volcanic basalt', '#10151b', { roughness: 0.84, metalness: 0.12 });
  const black = material('Astronomy light-absorbing black ceramic', '#080d14', { roughness: 0.72, metalness: 0.18 });
  const graphite = material('Astronomy graphite technical panel', '#1a222b', { roughness: 0.62, metalness: 0.42 });
  const white = material('Astronomy non-reflective white ceramic', '#dfe3df', { roughness: 0.48, metalness: 0.06 });
  const ice = material('Astrobiology frosted ice ceramic', '#cfe1e2', { roughness: 0.3, metalness: 0.12, transparent: true, opacity: 0.9 });
  const titanium = material('Astronomy satin titanium', '#9da8aa', { roughness: 0.3, metalness: 0.9 });
  const silver = material('Astronomy precision silver metal', '#c4ced0', { roughness: 0.16, metalness: 0.98 });
  const copper = material('Astronomy oxidized copper mesh', '#566d67', { roughness: 0.58, metalness: 0.72 });
  const bronze = material('Astrobiology patinated bronze', '#7a6850', { roughness: 0.48, metalness: 0.76 });
  const gold = material('Heliomagnetic glare-free gold ceramic', '#a48c59', { roughness: 0.56, metalness: 0.62 });
  const rust = material('Astrobiology simulated regolith', '#854c3b', { roughness: 0.94, metalness: 0.02 });
  const sulfur = material('Astrobiology acidic mineral composite', '#a18d4c', { roughness: 0.86, metalness: 0.04 });
  const salt = material('Astrobiology crystalline saline ceramic', '#d9ddd2', { roughness: 0.3, metalness: 0.16 });
  const glass = material('Astronomy smoked electrochromic glass', '#17293a', { roughness: 0.12, metalness: 0.44, transparent: true, opacity: 0.78 });
  const aerogel = material('Astrobiology translucent aerogel', '#9eb9b5', { roughness: 0.18, metalness: 0.12, transparent: true, opacity: 0.66 });
  const iridescent = material('Astrobiology polarizing bioceramic', '#89989d', { roughness: 0.22, metalness: 0.58, emissive: '#1b2930', emissiveIntensity: 0.2 });
  const mesh = material('Astronomy conductive electromagnetic mesh', '#788388', { roughness: 0.42, metalness: 0.86, transparent: true, opacity: 0.68 });
  const water = material('Astrobiology black experimental water', '#071b25', { roughness: 0.1, metalness: 0.38, transparent: true, opacity: 0.82 });
  const gravel = material('Astronomy dark radio-quiet gravel', '#171b1c', { roughness: 1, metalness: 0 });
  const paleAggregate = material('Astrobiology sterile pale aggregate', '#bfc0b8', { roughness: 0.96, metalness: 0 });
  const red = material('Astronomy shielded red maintenance light', '#ff9a91', { emissive: '#ff2b20', emissiveIntensity: 2.8, roughness: 0.18, metalness: 0.06 });
  const amber = material('Astronomy amber calibration trace', '#ffd8a0', { emissive: '#ff8a28', emissiveIntensity: 2.8, roughness: 0.16, metalness: 0.08 });
  const cyan = material('Astrobiology cyan subsurface trace', '#d7fcff', { emissive: '#42dff5', emissiveIntensity: 2.8, roughness: 0.16, metalness: 0.08 });
  const whiteLight = material('Astronomy rejected-signal white trace', '#ffffff', { emissive: '#ffffff', emissiveIntensity: 2.5, roughness: 0.12, metalness: 0 });
  [red, amber, cyan, whiteLight].forEach((value) => { value.userData.isDistrictAccent = true; });
  return { basalt, black, graphite, white, ice, titanium, silver, copper, bronze, gold, rust, sulfur, salt, glass, aerogel, iridescent, mesh, water, gravel, paleAggregate, red, amber, cyan, whiteLight };
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

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, mat: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0], arc = Math.PI * 2, obstacle = false, radialSegments = 6, tubularSegments = 36) {
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

function pulse<T extends THREE.Object3D>(object: T, speed: number, phase = 0, minIntensity = 0.16, maxIntensity = 3.4) {
  object.userData.animate = 'astronomy-astrobiology-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate<T extends THREE.Object3D>(object: T, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'astronomy-astrobiology-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function createCoronagraph(m: Materials) {
  const root = new THREE.Group(); root.name = 'ASTRO__A1__CORONAGRAPH_CROWN';
  cylinder(root, 'ASTRO__A1__POLISHED_BASALT_DISC_PLINTH', 15.2, 0.42, m.basalt, [0, 0.21, 0], true, 24);
  cylinder(root, 'ASTRO__A1__MATTE_BLACK_CIRCULAR_CITADEL', 10.2, 3.0, m.black, [0, 1.82, 0], true, 24);
  for (let petal = 0; petal < 12; petal += 1) {
    const angle = petal / 12 * Math.PI * 2; const radius = 6.25; const x = Math.cos(angle) * radius; const z = Math.sin(angle) * radius;
    box(root, `ASTRO__A1__APERTURE_PETAL_${petal + 1}`, [3.8, 0.34, 2.3], petal % 2 ? m.white : m.white.clone(), [x, 3.7 + (petal % 3) * 0.08, z], false, [0, -angle, (petal % 2 ? 1 : -1) * 0.08]);
    box(root, `ASTRO__A1__LIGHT_ABSORBING_PETAL_UNDERSIDE_${petal + 1}`, [3.5, 0.08, 2.05], m.black, [x, 3.51 + (petal % 3) * 0.08, z], false, [0, -angle, 0]);
  }
  for (let rib = 0; rib < 18; rib += 1) { const angle = rib * 2.399963; box(root, `ASTRO__A1__WAVEFRONT_CONTROL_RIB_${rib + 1}`, [0.08, 2.0 + (rib % 4) * 0.25, 0.12], m.silver, [Math.cos(angle) * 5.12, 1.75, Math.sin(angle) * 5.12], false, [0, -angle, (rib % 5 - 2) * 0.08]); }
  cylinder(root, 'ASTRO__A1__ARTIFICIAL_ECLIPSE_PORTAL_DISC', 2.2, 0.16, m.black, [0, 2.05, 5.16], false, 24, [Math.PI / 2, 0, 0]);
  pulse(torus(root, 'ASTRO__A1__SPECTRAL_ECLIPSE_RING', 1.18, 0.08, m.cyan.clone(), [0, 2.05, 5.27], [0, 0, 0]), 0.0045, 0.4);
  const shadeCenter = new THREE.Vector3(0, 3.0, 10.1);
  cylinder(root, 'ASTRO__A1__STARSHADE_CENTRAL_CANOPY', 1.6, 0.18, m.black, shadeCenter.toArray() as [number, number, number], false, 24);
  for (let petal = 0; petal < 16; petal += 1) { const angle = petal / 16 * Math.PI * 2; const start = shadeCenter.clone().add(new THREE.Vector3(Math.cos(angle) * 0.65, 0, Math.sin(angle) * 0.65)); const end = shadeCenter.clone().add(new THREE.Vector3(Math.cos(angle) * 4.1, -0.18, Math.sin(angle) * 4.1)); slabBetween(root, `ASTRO__A1__STARSHADE_TAPERED_PETAL_${petal + 1}`, start, end, 0.62, 0.12, m.white); }
  for (let mast = 0; mast < 4; mast += 1) { const angle = mast / 4 * Math.PI * 2 + Math.PI / 4; pipe(root, `ASTRO__A1__CARBON_COMPOSITE_STARSHADE_MAST_${mast + 1}`, new THREE.Vector3(Math.cos(angle) * 2.6, 0.1, 10.1 + Math.sin(angle) * 2.6), shadeCenter.clone().add(new THREE.Vector3(Math.cos(angle) * 1.6, 0, Math.sin(angle) * 1.6)), 0.05, m.graphite); }
  for (let turret = 0; turret < 3; turret += 1) rotate(cylinder(root, `ASTRO__A1__RETRACTABLE_CALIBRATION_TURRET_${turret + 1}`, 0.8, 0.9, m.titanium, [-2.2 + turret * 2.2, 4.3, -0.6], false, 12), 0.004 + turret * 0.001);
  return root;
}

function createChronos(m: Materials) {
  const root = new THREE.Group(); root.name = 'ASTRO__A2__CHRONOS_ARRAY';
  box(root, 'ASTRO__A2__GRAPHITE_SEQUENCE_PLINTH', [18.0, 0.34, 9.8], m.basalt, [0, 0.17, 0], true);
  for (let frame = 0; frame < 7; frame += 1) {
    const x = -7.0 + frame * 2.25; const z = -1.0 + frame * 0.34; const h = 3.2 + frame * 0.18;
    box(root, `ASTRO__A2__OFFSET_TIME_FRAME_${frame + 1}`, [3.6, h, 7.1], frame % 2 ? m.graphite : m.black, [x, 0.35 + h * 0.5, z], true, [0, -0.06 * frame, (frame - 3) * 0.008]);
    for (let fin = 0; fin < 8; fin += 1) box(root, `ASTRO__A2__INDEPENDENT_SHUTTER_FIN_${frame + 1}_${fin + 1}`, [0.08, h * 0.82, 0.72], fin % 3 ? m.titanium : m.glass, [x - 1.82, 0.45 + h * 0.5, z - 2.7 + fin * 0.76], false, [0, frame * 0.05 + (fin % 3 - 1) * 0.12, 0]);
    const capsule = sphere(root, `ASTRO__A2__ROBOTIC_TELESCOPE_CAPSULE_${frame + 1}`, [0.72, 0.95, 0.72], m.black, [x, 4.0 + frame * 0.18, z]); capsule.rotation.z = (frame - 3) * 0.12; rotate(capsule, 0.003 + frame * 0.0004);
    box(root, `ASTRO__A2__CAPSULE_DIAGONAL_SEAM_${frame + 1}`, [1.2, 0.06, 0.08], m.silver, [x, 4.0 + frame * 0.18, z + 0.72], false, [0, 0, 0.46]);
  }
  pulse(box(root, 'ASTRO__A2__ALERT_MERIDIAN', [17.4, 0.08, 0.12], m.amber.clone(), [0, 1.3, 4.0]), 0.008, 0.1);
  for (let pylon = 0; pylon < 13; pylon += 1) { const x = -7.8 + pylon * 1.3; const h = 0.55 + (pylon % 5) * 0.22; cylinder(root, `ASTRO__A2__TIMESTAMP_PYLON_${pylon + 1}`, 0.12, h, pylon % 4 ? m.titanium : m.amber, [x, h * 0.5, 6.2 + (pylon % 2) * 0.45], false, 8); }
  for (let conduit = 0; conduit < 5; conduit += 1) pipe(root, `ASTRO__A2__EXPOSED_DATA_CONDUIT_${conduit + 1}`, new THREE.Vector3(-6 + conduit * 3, 0.5, -4.8), new THREE.Vector3(-6 + conduit * 3, 0.1, -7.0), 0.12, conduit % 2 ? m.titanium : m.black);
  return root;
}

function createConcordance(m: Materials) {
  const root = new THREE.Group(); root.name = 'ASTRO__A3__CONCORDANCE_SPIRE';
  cylinder(root, 'ASTRO__A3__RECESSED_CONCORDANCE_COURT', 9.0, 0.22, m.basalt, [0, 0.05, 0], false, 24);
  const shaftMaterials = [m.glass, m.titanium, m.white, m.mesh];
  for (let shaft = 0; shaft < 4; shaft += 1) {
    const baseAngle = shaft / 4 * Math.PI * 2;
    for (let section = 0; section < 8; section += 1) { const y = 0.7 + section * 1.75; const angle = baseAngle + Math.sin(section / 7 * Math.PI) * 0.52; const radius = 2.0 + Math.cos(section / 7 * Math.PI) * 0.25; taper(root, `ASTRO__A3__MESSENGER_SHAFT_${shaft + 1}_SECTION_${section + 1}`, 1.65, 1.35, 1.9, shaftMaterials[shaft], [Math.cos(angle) * radius, y + 0.95, Math.sin(angle) * radius], true, 3, [0, -angle + Math.PI / 2, (shaft % 2 ? 1 : -1) * 0.025]); }
  }
  torus(root, 'ASTRO__A3__SUSPENDED_CONVERGENCE_RING', 4.6, 0.34, m.titanium, [0, 10.2, 0], [Math.PI / 2, 0, 0], Math.PI * 2, false, 8, 48);
  pulse(torus(root, 'ASTRO__A3__CONVERGENCE_INDICATOR_SEQUENCE', 4.74, 0.07, m.red.clone(), [0, 10.2, 0]), 0.0038, 0.3);
  for (let cable = 0; cable < 12; cable += 1) { const angle = cable / 12 * Math.PI * 2; pipe(root, `ASTRO__A3__RING_TENSION_CABLE_${cable + 1}`, new THREE.Vector3(Math.cos(angle) * 4.6, 10.2, Math.sin(angle) * 4.6), new THREE.Vector3(Math.cos(angle) * 2.0, 12.9, Math.sin(angle) * 2.0), 0.025, m.silver); }
  for (let mast = 0; mast < 7; mast += 1) { const angle = mast / 7 * Math.PI * 2; const value = cylinder(root, `ASTRO__A3__DIRECTIONAL_COMMUNICATIONS_MAST_${mast + 1}`, 0.09, 2.0 + mast % 3 * 0.35, m.titanium, [Math.cos(angle) * 1.6, 15.4 + mast % 3 * 0.18, Math.sin(angle) * 1.6], false, 8); value.rotation.z = (mast % 3 - 1) * 0.12; }
  const approachMats = [m.silver, m.gravel, m.aerogel, m.black];
  for (let path = 0; path < 4; path += 1) { const angle = path / 4 * Math.PI * 2; slabBetween(root, `ASTRO__A3__MESSENGER_APPROACH_${path + 1}`, new THREE.Vector3(Math.cos(angle) * 3.4, 0.08, Math.sin(angle) * 3.4), new THREE.Vector3(Math.cos(angle) * 7.0, 0.08, Math.sin(angle) * 7.0), 1.1, 0.08, approachMats[path]); }
  return root;
}

function createHydrogen(m: Materials) {
  const root = new THREE.Group(); root.name = 'ASTRO__A4__HYDROGEN_HORIZON_HOUSE';
  box(root, 'ASTRO__A4__RADIO_QUIET_EMBANKMENT', [17.4, 1.3, 8.0], m.gravel, [0, 0.65, 0], true, [0, 0, -0.02]);
  box(root, 'ASTRO__A4__ONE_HUNDRED_SIXTY_METRE_ROOF_BLADE', [16.0, 0.34, 2.0], m.copper, [0, 1.55, -0.3], true, [0, 0, -0.035]);
  for (let slot = 0; slot < 9; slot += 1) box(root, `ASTRO__A4__DEEPLY_RECESSED_OBSERVATION_SLOT_${slot + 1}`, [1.0, 0.16, 0.12], m.black, [-6.8 + slot * 1.7, 0.95, 4.02]);
  for (let screen = 0; screen < 5; screen += 1) box(root, `ASTRO__A4__CONDUCTIVE_THRESHOLD_SCREEN_${screen + 1}`, [4.0 - screen * 0.22, 2.0, 0.08], screen % 2 ? m.mesh : m.copper, [0, 1.05, 4.5 + screen * 0.45], false);
  for (let antenna = 0; antenna < 36; antenna += 1) { const col = antenna % 12; const row = Math.floor(antenna / 12); const x = -7.7 + col * 1.4; const z = -6.2 - row * 1.15; box(root, `ASTRO__A4__CALIBRATION_BLADE_ANTENNA_${antenna + 1}`, [0.06, 0.85 + (antenna % 4) * 0.12, 0.42], m.bronze, [x, 0.45, z], false, [0, (antenna % 5 - 2) * 0.12, (antenna % 3 - 1) * 0.05]); }
  for (let trench = 0; trench < 3; trench += 1) box(root, `ASTRO__A4__STONE_LINED_COOLING_TRENCH_${trench + 1}`, [4.5, 0.12, 0.42], m.basalt, [-5.2 + trench * 5.2, 0.08, -3.9]);
  for (let point = 0; point < 12; point += 1) pulse(cylinder(root, `ASTRO__A4__GROUND_LEVEL_RED_EMERGENCY_POINT_${point + 1}`, 0.08, 0.04, m.red.clone(), [-7.7 + point * 1.4, 0.08, 5.9], false, 8), 0.003, point * 0.35, 0.05, 1.1);
  return root;
}

function createHeliomagnetic(m: Materials) {
  const root = new THREE.Group(); root.name = 'ASTRO__A5__HELIOMAGNETIC_BASTION';
  cylinder(root, 'ASTRO__A5__CIRCULAR_STELLAR_CORE', 13.4, 3.8, m.black, [0, 2.0, 0], true, 24);
  for (let panel = 0; panel < 28; panel += 1) { const angle = panel / 28 * Math.PI; const x = Math.cos(angle) * 6.75; const z = Math.sin(angle) * 6.75; box(root, `ASTRO__A5__TILTING_GOLD_HEAT_PANEL_${panel + 1}`, [0.75, 2.8, 0.18], m.gold, [x, 2.0, z], false, [0, -angle, Math.sin(panel * 0.8) * 0.04]); }
  for (let arch = 0; arch < 7; arch += 1) { const loop = torus(root, `ASTRO__A5__MAGNETIC_FIELD_ARCH_${arch + 1}`, 5.0 + arch * 0.42, 0.11, m.titanium, [0, 3.6 + arch * 0.12, 0], [0, arch * 0.18, 0], Math.PI, false, 8, 36); loop.rotation.z = Math.PI * 0.5; }
  cylinder(root, 'ASTRO__A5__SOLAR_OBSERVATION_TOWER', 2.6, 5.2, m.graphite, [0, 6.4, 0], true, 24);
  cylinder(root, 'ASTRO__A5__SUSPENDED_SOLAR_OCCULTER', 2.2, 0.14, m.black, [0, 9.4, 0], false, 24);
  for (let arm = 0; arm < 3; arm += 1) { const angle = arm / 3 * Math.PI * 2; pipe(root, `ASTRO__A5__OCCULTER_SUPPORT_ARM_${arm + 1}`, new THREE.Vector3(Math.cos(angle) * 1.2, 8.8, Math.sin(angle) * 1.2), new THREE.Vector3(Math.cos(angle) * 0.85, 9.4, Math.sin(angle) * 0.85), 0.04, m.titanium); }
  for (let yard = 0; yard < 6; yard += 1) { const angle = -1.0 + yard * 0.4; const loop = torus(root, `ASTRO__A5__SOUTH_CALIBRATION_ARC_${yard + 1}`, 1.8 + yard * 0.22, 0.08, yard % 2 ? m.gold : m.titanium, [-5.0 + yard * 2.0, 1.8, 7.6], [0, angle, 0], Math.PI, false, 6, 24); loop.rotation.z = Math.PI * 0.5; }
  for (let marker = 0; marker < 14; marker += 1) pulse(cylinder(root, `ASTRO__A5__LOW_AMBER_FIELD_POINT_${marker + 1}`, 0.08, 0.05, m.amber.clone(), [-6.5 + marker, 0.09, 5.9], false, 8), 0.0035, marker * 0.28, 0.04, 1.2);
  return root;
}

function createParallax(m: Materials) {
  const root = new THREE.Group(); root.name = 'ASTRO__A6__PARALLAX_FOUNDRY';
  box(root, 'ASTRO__A6__WEST_PRECISION_HALL', [18.8, 4.2, 3.55], m.white, [0, 2.2, -3.15], true);
  box(root, 'ASTRO__A6__EAST_PRECISION_HALL', [18.8, 4.2, 3.55], m.white, [0, 2.2, 3.15], true);
  for (let line = 0; line < 22; line += 1) { const x = -9.0 + line * 0.86; box(root, `ASTRO__A6__ENGRAVED_CALIBRATION_GRID_${line + 1}`, [0.025, 3.7, 0.05], line % 5 ? m.titanium : m.black, [x, 2.3, 4.94]); }
  pipe(root, 'ASTRO__A6__ISOLATED_METROLOGY_SPINE', new THREE.Vector3(-9.5, 5.35, 0), new THREE.Vector3(9.5, 5.35, 0), 0.36, m.silver);
  for (let pylon = 0; pylon < 8; pylon += 1) { const x = -8.4 + pylon * 2.4; cylinder(root, `ASTRO__A6__INDEPENDENT_ISOLATION_PYLON_${pylon + 1}`, 0.34, 4.7, m.graphite, [x, 2.45, 0], true, 8); cylinder(root, `ASTRO__A6__VISIBLE_VIBRATION_DAMPER_${pylon + 1}`, 0.58, 0.22, m.bronze, [x, 4.72, 0], false, 12); }
  box(root, 'ASTRO__A6__ANGLED_DARK_ENTRY_BRIDGE', [5.8, 0.55, 1.5], m.black, [0, 2.0, 0], true, [0, 0.16, 0]);
  pulse(box(root, 'ASTRO__A6__LONGITUDINAL_REFERENCE_LINE', [24.0, 0.05, 0.07], m.whiteLight.clone(), [0, 0.08, 0]), 0.0028, 0.2, 0.04, 1.0);
  for (let tower = 0; tower < 3; tower += 1) { const x = -6 + tower * 6; box(root, `ASTRO__A6__FLOATING_CALIBRATION_PLATFORM_${tower + 1}`, [2.4, 0.22, 2.0], m.black, [x, 4.48, tower % 2 ? 3.1 : -3.1]); rotate(cylinder(root, `ASTRO__A6__TELESCOPE_CALIBRATION_TOWER_${tower + 1}`, 1.0, 1.7, m.silver, [x, 5.45, tower % 2 ? 3.1 : -3.1], false, 12), 0.003 + tower * 0.0005); }
  return root;
}

function createAsterion(m: Materials) {
  const root = new THREE.Group(); root.name = 'ASTRO__A7__ASTERION_SHIELD';
  for (let layer = 0; layer < 7; layer += 1) box(root, `ASTRO__A7__INCLINED_DEFLECTION_LAYER_${layer + 1}`, [15.2 - layer * 0.35, 0.72, 6.2 - layer * 0.22], layer % 3 === 0 ? m.basalt : layer % 3 === 1 ? m.graphite : m.black, [0, 0.45 + layer * 0.68, -1.8 + layer * 0.22], true, [-0.18, 0, 0]);
  for (let terrace = 0; terrace < 4; terrace += 1) { box(root, `ASTRO__A7__STEPPED_INSTRUMENT_TERRACE_${terrace + 1}`, [12.0 - terrace * 1.8, 0.28, 2.0], m.graphite, [0, 5.0 + terrace * 0.5, -2.2 + terrace * 0.55], true); rotate(cylinder(root, `ASTRO__A7__RAPID_SURVEY_TURRET_${terrace + 1}`, 0.9, 1.2, terrace % 2 ? m.titanium : m.black, [-4.0 + terrace * 2.7, 5.8 + terrace * 0.5, -2.2 + terrace * 0.55], false, 12), 0.004 + terrace * 0.0006); }
  cylinder(root, 'ASTRO__A7__IMPACT_CRATER_STORMWATER_BASIN', 10.8, 0.18, m.gravel, [0, 0.04, 6.1], false, 24);
  for (let line = 0; line < 6; line += 1) { const angle = -0.8 + line * 0.28; pulse(slabBetween(root, `ASTRO__A7__RECALCULATED_TRAJECTORY_${line + 1}`, new THREE.Vector3(Math.cos(angle) * 4.8, 0.16, 6.1 + Math.sin(angle) * 4.8), new THREE.Vector3(-2.5 + line, 1.0 + line * 0.55, 0.3), 0.055, 0.04, m.amber.clone()), 0.004 + line * 0.0003, line * 0.44); }
  const aggregate = new THREE.Group(); aggregate.name = 'ASTRO__A7__SUSPENDED_IRREGULAR_AGGREGATE'; aggregate.position.set(0, 2.7, 6.1); root.add(aggregate);
  for (let facet = 0; facet < 24; facet += 1) { const angle = facet * 2.399963; const radius = 0.4 * Math.sqrt(facet); sphere(aggregate, `ASTRO__A7__MINERAL_METALLIC_FACET_${facet + 1}`, [0.35 + facet % 4 * 0.09, 0.28 + facet % 3 * 0.08, 0.38], facet % 3 === 0 ? m.titanium : facet % 3 === 1 ? m.basalt : m.bronze, [Math.cos(angle) * radius, Math.sin(facet) * 0.65, Math.sin(angle) * radius]); }
  for (let cable = 0; cable < 4; cable += 1) { const angle = cable / 4 * Math.PI * 2; pipe(root, `ASTRO__A7__AGGREGATE_TENSION_CABLE_${cable + 1}`, new THREE.Vector3(Math.cos(angle) * 1.7, 3.3, 6.1 + Math.sin(angle) * 1.7), new THREE.Vector3(Math.cos(angle) * 4.0, 6.6, 6.1 + Math.sin(angle) * 4.0), 0.018, m.silver); }
  box(root, 'ASTRO__A7__REINFORCED_REAR_SERVICE_LANE', [5.0, 0.1, 9.0], m.graphite, [0, 0.08, -7.0]);
  return root;
}

function createNoctis(m: Materials) {
  const root = new THREE.Group(); root.name = 'ASTRO__A8__NOCTIS_SIGNAL_VAULT';
  box(root, 'ASTRO__A8__LIGHT_ABSORBING_MONOLITH', [10.4, 5.8, 8.0], m.black, [0, 3.0, 0], true);
  const cageCorners = [[-6, -4.9], [6, -4.4], [5.6, 4.8], [-5.5, 5.2]] as const;
  cageCorners.forEach(([x, z], index) => cylinder(root, `ASTRO__A8__DISTORTED_CAGE_POST_${index + 1}`, 0.16, 7.0, m.titanium, [x, 3.5, z], true, 8));
  for (let level = 0; level < 4; level += 1) { const y = 0.8 + level * 1.8; cageCorners.forEach(([x, z], index) => { const next = cageCorners[(index + 1) % cageCorners.length]; pipe(root, `ASTRO__A8__CONDUCTIVE_CAGE_RAIL_${level + 1}_${index + 1}`, new THREE.Vector3(x, y, z), new THREE.Vector3(next[0], y, next[1]), 0.07, m.mesh); }); }
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
  primes.forEach((prime, index) => { const row = index % 4; const column = Math.floor(index / 4); box(root, `ASTRO__A8__PRIME_SEQUENCE_APERTURE_${prime}`, [0.12, 0.28 + row * 0.05, 0.5], m.whiteLight, [5.23, 1.1 + row * 1.05, -2.2 + column * 2.1]); });
  box(root, 'ASTRO__A8__OFF_CENTER_COMPRESSED_CANOPY', [2.2, 0.28, 7.0], m.black, [-2.8, 2.8, 6.8], true);
  cylinder(root, 'ASTRO__A8__SUNKEN_ANTENNA_COURT', 8.0, 0.18, m.gravel, [0, -0.02, -7.0], false, 24);
  for (let dish = 0; dish < 5; dish += 1) { const angle = dish / 5 * Math.PI * 2; const mast = cylinder(root, `ASTRO__A8__STEERABLE_ANTENNA_MAST_${dish + 1}`, 0.16, 1.3 + dish * 0.12, m.titanium, [Math.cos(angle) * 2.6, 0.68, -7 + Math.sin(angle) * 2.6], false, 8); const receiver = cylinder(root, `ASTRO__A8__RADIO_OPTICAL_RECEIVER_${dish + 1}`, 1.0 + dish * 0.08, 0.18, m.silver, [mast.position.x, 1.45 + dish * 0.12, mast.position.z], false, 12, [0.35, angle, 0]); rotate(receiver, 0.002 + dish * 0.0003); }
  for (let wall = 0; wall < 4; wall += 1) { const angle = wall / 4 * Math.PI * 2; box(root, `ASTRO__A8__INCLINED_ABSORBER_WALL_${wall + 1}`, [4.3, 1.7, 0.28], m.graphite, [Math.cos(angle) * 4.4, 0.8, -7 + Math.sin(angle) * 4.4], true, [0.2, -angle, 0]); }
  pulse(torus(root, 'ASTRO__A8__REJECTED_SIGNAL_TRACE', 5.3, 0.045, m.whiteLight.clone(), [0, 0.12, 0]), 0.0025, 0.7, 0.01, 1.1);
  return root;
}

function createAether(m: Materials) {
  const root = new THREE.Group(); root.name = 'ASTRO__A9__AETHER_SPECTRUM_GARDENS';
  const shellMaterials = [m.basalt, m.titanium, m.aerogel, m.white, m.iridescent];
  for (let shell = 0; shell < 5; shell += 1) {
    const value = cylinder(root, `ASTRO__A9__ATMOSPHERIC_ELLIPTICAL_SHELL_${shell + 1}`, 11.8 - shell * 0.65, 0.75, shellMaterials[shell], [(shell - 2) * 0.38, 0.5 + shell * 0.78, (shell % 2 ? 1 : -1) * 0.32], true, 24);
    value.scale.z = 0.66 + shell * 0.035; value.rotation.z = (shell - 2) * 0.025;
  }
  for (let fin = 0; fin < 72; fin += 1) {
    const angle = fin / 72 * Math.PI * 2; const radius = 6.15 + (fin % 5) * 0.04; const height = 2.6 + (fin % 9) * 0.24;
    box(root, `ASTRO__A9__SPECTRAL_BARCODE_FIN_${fin + 1}`, [0.045 + (fin % 7 === 0 ? 0.08 : 0), height, 0.34], fin % 11 === 0 ? m.black : fin % 6 === 0 ? m.aerogel : m.titanium, [Math.cos(angle) * radius, 0.3 + height * 0.5, Math.sin(angle) * radius * 0.78], false, [0, -angle, 0]);
  }
  cylinder(root, 'ASTRO__A9__ENTRANCE_ECLIPSE_DISC', 2.5, 0.18, m.black, [0, 2.05, 5.4], false, 24, [Math.PI / 2, 0, 0]);
  pulse(torus(root, 'ASTRO__A9__ILLUMINATED_ATMOSPHERE_RECESS', 1.42, 0.09, m.cyan.clone(), [0, 2.05, 5.52], [0, 0, 0]), 0.004, 0.5);
  const cellMaterials = [m.rust, m.salt, m.water, m.gravel, m.sulfur, m.paleAggregate, m.basalt, m.copper];
  for (let cell = 0; cell < 16; cell += 1) {
    const col = cell % 8; const row = Math.floor(cell / 8); const x = -7.7 + col * 2.2; const z = 7.1 + row * 1.55;
    cylinder(root, `ASTRO__A9__SEALED_PLANETARY_LANDSCAPE_CELL_${cell + 1}`, 1.55, 0.14, cellMaterials[cell % cellMaterials.length], [x, 0.08, z], false, 12);
    if (cell % 3 === 0) sphere(root, `ASTRO__A9__LOW_ENVIRONMENTAL_MEMBRANE_${cell + 1}`, [0.75, 0.24, 0.75], m.aerogel, [x, 0.25, z]);
  }
  for (let channel = 0; channel < 7; channel += 1) { const z = 6.35 + channel * 0.44; slabBetween(root, `ASTRO__A9__ATMOSPHERIC_CIRCULATION_CHANNEL_${channel + 1}`, new THREE.Vector3(-8.4, 0.09, z), new THREE.Vector3(8.4, 0.09, z + Math.sin(channel) * 0.8), 0.08, 0.04, m.water); }
  for (let collector = 0; collector < 12; collector += 1) { const angle = collector / 12 * Math.PI * 2; cylinder(root, `ASTRO__A9__CONDENSATION_COLLECTOR_${collector + 1}`, 0.12, 0.9, m.silver, [Math.cos(angle) * 4.8, 4.4, Math.sin(angle) * 3.7], false, 8); }
  return root;
}

function createCryocean(m: Materials) {
  const root = new THREE.Group(); root.name = 'ASTRO__A10__CRYOCEAN_INSTITUTE';
  box(root, 'ASTRO__A10__SUBGLACIAL_BLACK_BASE', [15.4, 2.2, 11.8], m.black, [0, 1.1, 0], true);
  const plates = [
    [-4.9, 3.0, -3.0, 6.0, 5.2, -0.12], [0.2, 3.35, -3.3, 5.2, 4.8, 0.08], [4.9, 3.1, -2.7, 5.1, 5.4, 0.16],
    [-4.3, 2.8, 2.2, 6.8, 4.1, 0.05], [1.0, 3.4, 2.4, 5.3, 4.5, -0.1], [5.4, 2.85, 2.6, 4.2, 4.0, 0.14],
  ] as const;
  plates.forEach(([x, y, z, w, d, r], index) => {
    box(root, `ASTRO__A10__PRESSURE_SPLIT_ICE_PLATE_${index + 1}`, [w, 0.65, d], index % 2 ? m.ice : m.white, [x, y, z], true, [r * 0.3, r, r * 0.18]);
    pulse(box(root, `ASTRO__A10__CYAN_SUBSURFACE_FISSURE_${index + 1}`, [Math.max(2.4, w * 0.65), 0.1, 0.08], m.cyan.clone(), [x, y - 0.36, z + d * 0.5], false, [0, r, 0]), 0.0035, index * 0.5, 0.06, 1.8);
  });
  sphere(root, 'ASTRO__A10__PARTIALLY_BURIED_ICY_MOON_VOLUME', [3.5, 3.5, 3.5], m.ice, [0, 3.25, 0], true);
  for (let ridge = 0; ridge < 9; ridge += 1) torus(root, `ASTRO__A10__ICY_MOON_LINEAR_RIDGE_${ridge + 1}`, 2.8 + ridge * 0.055, 0.035, m.titanium, [0, 3.25, 0], [0, ridge * 0.35, ridge * 0.13], Math.PI * 1.2, false, 5, 24);
  cylinder(root, 'ASTRO__A10__CRYOBOT_TEST_MAST', 1.5, 7.2, m.titanium, [-6.2, 3.7, 4.2], true, 16);
  for (let frame = 0; frame < 6; frame += 1) torus(root, `ASTRO__A10__CRYOBOT_SKELETAL_FRAME_${frame + 1}`, 1.05 + frame * 0.04, 0.06, m.graphite, [-6.2, 1.2 + frame * 1.05, 4.2], [Math.PI / 2, 0, 0], Math.PI * 2, false, 6, 20);
  cylinder(root, 'ASTRO__A10__IRIS_TEST_SHAFT_COVER', 3.0, 0.22, m.graphite, [-6.0, 0.14, 8.0], false, 24);
  for (let iris = 0; iris < 10; iris += 1) { const angle = iris / 10 * Math.PI * 2; box(root, `ASTRO__A10__IRIS_COVER_SEGMENT_${iris + 1}`, [1.1, 0.12, 0.45], m.titanium, [-6 + Math.cos(angle) * 0.9, 0.28, 8 + Math.sin(angle) * 0.9], false, [0, -angle, 0]); }
  for (let channel = 0; channel < 6; channel += 1) box(root, `ASTRO__A10__BLACK_WATER_FORECOURT_CHANNEL_${channel + 1}`, [0.22, 0.08, 7.0], m.water, [-4.2 + channel * 1.7, 0.08, 7.0 + (channel % 2) * 0.5]);
  for (let barrier = 0; barrier < 16; barrier += 1) sphere(root, `ASTRO__A10__TRANSLUCENT_APRON_BARRIER_${barrier + 1}`, [0.18, 0.55, 0.18], m.ice, [-7.5 + barrier, 0.55, 10.3]);
  return root;
}

function createGenesis(m: Materials) {
  const root = new THREE.Group(); root.name = 'ASTRO__A11__GENESIS_VENTWORKS';
  box(root, 'ASTRO__A11__FRACTURED_BLACK_BASALT_BASE', [15.0, 1.0, 11.0], m.basalt, [0, 0.5, 0], true);
  const chimneys = [
    [-4.8, -2.4, 6.8], [-1.6, -2.8, 4.8], [2.0, -2.1, 7.6], [5.0, -1.5, 5.5], [-3.5, 2.0, 4.1], [0.2, 2.6, 6.0], [4.2, 2.4, 3.8],
  ] as const;
  chimneys.forEach(([x, z, h], index) => {
    taper(root, `ASTRO__A11__MINERAL_CHIMNEY_${index + 1}`, 1.8 + index % 3 * 0.3, 0.75 + index % 2 * 0.22, h, index % 3 ? m.basalt : m.graphite, [x, 1 + h * 0.5, z], true, 8, [0, index * 0.2, (index % 3 - 1) * 0.04]);
    for (let rib = 0; rib < 5; rib += 1) torus(root, `ASTRO__A11__PRECIPITATED_MINERAL_RIB_${index + 1}_${rib + 1}`, 0.55 + rib * 0.08, 0.06, rib < 3 ? m.salt : m.sulfur, [x, 1.8 + rib * h / 7, z], [Math.PI / 2, 0, 0], Math.PI * 1.55, false, 5, 18);
  });
  for (let conduit = 0; conduit < 12; conduit += 1) { const a = chimneys[conduit % chimneys.length]; const b = chimneys[(conduit + 2) % chimneys.length]; pipe(root, `ASTRO__A11__BRANCHING_BRONZE_CERAMIC_PIPE_${conduit + 1}`, new THREE.Vector3(a[0], 1.5 + conduit % 4 * 0.8, a[1]), new THREE.Vector3(b[0], 1.2 + (conduit + 1) % 4 * 0.75, b[1]), 0.08, conduit % 2 ? m.bronze : m.copper); }
  for (let pool = 0; pool < 9; pool += 1) { const x = -7.0 + pool * 1.75; const z = 6.7 + (pool % 3) * 0.75; cylinder(root, `ASTRO__A11__CHEMICAL_GRADIENT_POOL_${pool + 1}`, 1.4 + pool % 2 * 0.4, 0.12, [m.water, m.sulfur, m.copper][pool % 3], [x, 0.08, z], false, 16); cylinder(root, `ASTRO__A11__CHEMISTRY_SENSOR_ROD_${pool + 1}`, 0.07, 1.1, m.titanium, [x, 0.6, z], false, 8); }
  box(root, 'ASTRO__A11__BASALT_CAUSEWAY', [2.4, 0.16, 10.0], m.basalt, [0, 0.14, 8.0]);
  pipe(root, 'ASTRO__A11__BRANCHING_MINERAL_BUTTRESS_LEFT', new THREE.Vector3(-2.0, 0.2, 4.8), new THREE.Vector3(0, 3.8, 3.7), 0.28, m.salt, true);
  pipe(root, 'ASTRO__A11__BRANCHING_MINERAL_BUTTRESS_RIGHT', new THREE.Vector3(2.0, 0.2, 4.8), new THREE.Vector3(0, 3.8, 3.7), 0.28, m.salt, true);
  for (let glow = 0; glow < 7; glow += 1) pulse(cylinder(root, `ASTRO__A11__VENT_BASE_AMBER_GLOW_${glow + 1}`, 0.32, 0.08, m.amber.clone(), [chimneys[glow][0], 0.9, chimneys[glow][1]], false, 8), 0.003, glow * 0.55, 0.04, 1.5);
  return root;
}

function createAegis(m: Materials) {
  const root = new THREE.Group(); root.name = 'ASTRO__A12__AEGIS_EXOMATERIAL_SANCTUARY';
  box(root, 'ASTRO__A12__OUTER_SEALED_WHITE_SHELL', [15.8, 3.7, 10.6], m.white, [0, 2.0, 0], true);
  box(root, 'ASTRO__A12__SECOND_SILVER_CONTAINMENT_SHELL', [13.5, 4.15, 8.4], m.silver, [0, 2.25, 0], true);
  box(root, 'ASTRO__A12__INNER_PALE_GOLD_CURATION_SHELL', [9.6, 4.65, 6.2], m.gold, [0, 2.55, 0], true);
  for (let recess = 0; recess < 5; recess += 1) box(root, `ASTRO__A12__DEEP_HORIZONTAL_SHELL_RECESS_${recess + 1}`, [14.0, 0.16, 0.18], m.black, [0, 0.9 + recess * 0.66, 5.39]);
  for (let zone = 0; zone < 4; zone += 1) torus(root, `ASTRO__A12__STERILE_MAINTENANCE_ZONE_${zone + 1}`, 5.7 + zone * 0.9, 0.22, zone % 2 ? m.paleAggregate : m.white, [0, 0.05, 0], [Math.PI / 2, 0, 0], Math.PI * 2, false, 6, 48);
  box(root, 'ASTRO__A12__DRY_RECESSED_BUFFER_TRENCH', [6.0, 0.35, 2.0], m.basalt, [0, -0.04, 6.2]);
  box(root, 'ASTRO__A12__RETRACTABLE_PRIMARY_BRIDGE', [2.2, 0.18, 5.0], m.silver, [0, 0.12, 6.1]);
  for (let port = 0; port < 3; port += 1) { const z = -3.0 + port * 3; torus(root, `ASTRO__A12__ROBOTIC_TRANSFER_DOCKING_COLLAR_${port + 1}`, 0.8, 0.16, m.titanium, [-8.0, 1.6, z], [0, 0, Math.PI / 2], Math.PI * 2, false, 8, 24); box(root, `ASTRO__A12__OVERLAPPING_TRANSFER_SHUTTER_${port + 1}`, [0.22, 1.7, 1.0], m.white, [-8.2, 1.6, z], false, [0, 0, port % 2 ? 0.3 : -0.3]); }
  for (let monitor = 0; monitor < 9; monitor += 1) { const angle = monitor / 9 * Math.PI * 2; cylinder(root, `ASTRO__A12__PARTICULATE_WEATHER_MONITOR_${monitor + 1}`, 0.09, 1.3 + monitor % 3 * 0.2, m.titanium, [Math.cos(angle) * 4.2, 5.2, Math.sin(angle) * 2.5], false, 8); }
  pulse(torus(root, 'ASTRO__A12__PERIMETER_STATUS_BAND', 7.2, 0.075, m.whiteLight.clone(), [0, 3.25, 0], [Math.PI / 2, 0, 0]), 0.0028, 0.1, 0.08, 1.2);
  return root;
}

function createExtremis(m: Materials) {
  const root = new THREE.Group(); root.name = 'ASTRO__A13__EXTREMIS_ANALOG_ECOLOGIES_CAMPUS';
  box(root, 'ASTRO__A13__RAISED_ENVIRONMENTAL_SERVICE_SPINE', [17.6, 1.0, 2.0], m.graphite, [0, 4.8, 0], true);
  const pods = [
    { x: -7.0, z: -2.8, mat: m.white, shape: 'CRYOSPHERE', scale: [3.0, 2.6, 3.8] as const },
    { x: -3.5, z: 2.8, mat: m.rust, shape: 'REGOLITH', scale: [3.3, 2.3, 3.3] as const },
    { x: 0, z: -2.8, mat: m.sulfur, shape: 'ACIDIC_GEOCHEMISTRY', scale: [3.1, 3.0, 3.6] as const },
    { x: 3.5, z: 2.8, mat: m.salt, shape: 'HYPERSALINE', scale: [3.4, 2.4, 3.2] as const },
    { x: 7.0, z: -2.8, mat: m.black, shape: 'RADIATION', scale: [3.0, 2.8, 3.5] as const },
  ];
  pods.forEach(({ x, z, mat, shape, scale }, index) => {
    const pod = sphere(root, `ASTRO__A13__${shape}_POD`, scale, mat, [x, scale[1] * 0.5 + 0.2, z], true); pod.rotation.z = (index - 2) * 0.04;
    box(root, `ASTRO__A13__${shape}_TRANSFER_NECK`, [1.2, 1.4, Math.abs(z) - 0.4], m.aerogel, [x, 3.7, z * 0.5]);
    for (let fin = 0; fin < (shape === 'RADIATION' ? 7 : 3); fin += 1) box(root, `ASTRO__A13__${shape}_SHIELD_OR_SENSOR_${fin + 1}`, [0.16, 2.4 + fin * 0.08, 3.8], index === 4 ? m.titanium : mat, [x - 1.6 + fin * 0.5, 1.8, z], false, [0, 0, (fin - 3) * 0.045]);
  });
  const terrainMaterials = [m.ice, m.rust, m.basalt, m.salt, m.gravel];
  pods.forEach(({ x, z }, index) => cylinder(root, `ASTRO__A13__OUTDOOR_ANALOG_LANDSCAPE_${index + 1}`, 4.3, 0.1, terrainMaterials[index], [x, 0.07, z + (z < 0 ? -3.5 : 3.5)], false, 16));
  for (let rail = 0; rail < 8; rail += 1) pipe(root, `ASTRO__A13__EXPOSED_UTILITY_RAIL_${rail + 1}`, new THREE.Vector3(-8.5 + rail * 2.4, 4.15, -0.8), new THREE.Vector3(-8.5 + rail * 2.4, 4.15, 0.8), 0.06, rail % 2 ? m.copper : m.titanium);
  const roverPath: THREE.Vector3[] = [];
  for (let point = 0; point < 32; point += 1) { const angle = point / 32 * Math.PI * 2; roverPath.push(new THREE.Vector3(Math.cos(angle) * 10.0, 0.18, Math.sin(angle) * 7.8)); }
  roverPath.forEach((point, index) => { if (index < roverPath.length - 1) pipe(root, `ASTRO__A13__LOOPED_ROVER_TEST_ROUTE_${index + 1}`, point, roverPath[index + 1], 0.07, m.titanium); });
  for (let rover = 0; rover < 4; rover += 1) { const position = roverPath[rover * 8]; const vehicle = box(root, `ASTRO__A13__AUTONOMOUS_ANALOG_ROVER_${rover + 1}`, [0.8, 0.35, 1.0], rover % 2 ? m.white : m.graphite, position.toArray() as [number, number, number]); sphere(root, `ASTRO__A13__ROVER_SENSOR_DOME_${rover + 1}`, [0.18, 0.18, 0.18], m.glass, [position.x, 0.48, position.z]); vehicle.userData.animate = 'astronomy-astrobiology-rotation'; vehicle.userData.speed = 0; }
  return root;
}

function createChirality(m: Materials) {
  const root = new THREE.Group(); root.name = 'ASTRO__A14__CHIRALITY_ARK';
  for (const handedness of [-1, 1]) {
    for (let segment = 0; segment < 24; segment += 1) {
      const t = segment / 23; const angle = -1.2 + t * 2.4; const radius = 6.0; const x = handedness * (1.2 + Math.cos(angle) * radius * 0.72); const z = Math.sin(angle) * radius; const y = 1.0 + t * 3.4 + (handedness > 0 ? Math.sin(t * Math.PI) * 1.2 : 0);
      box(root, `ASTRO__A14__${handedness < 0 ? 'LEFT_HANDED' : 'RIGHT_HANDED'}_CRESCENT_SEGMENT_${segment + 1}`, [1.55, 1.25, 1.25], segment % 5 === 0 ? m.iridescent : m.white, [x, y, z], true, [0, -angle * 0.62, handedness * (0.04 + t * 0.02)]);
      for (let scale = 0; scale < 3; scale += 1) box(root, `ASTRO__A14__REVERSED_BIOCERAMIC_SCALE_${handedness < 0 ? 'L' : 'R'}_${segment + 1}_${scale + 1}`, [0.48, 0.36, 0.08], scale === 1 ? m.iridescent : m.salt, [x - handedness * 0.82, y - 0.38 + scale * 0.38, z], false, [0, -angle * 0.62, handedness * 0.12]);
    }
  }
  box(root, 'ASTRO__A14__TRANSLUCENT_CELLULAR_MEMBRANE', [5.4, 0.16, 8.8], m.aerogel, [0, 5.0, 0], false, [0, 0, 0.08]);
  for (let rib = 0; rib < 9; rib += 1) pipe(root, `ASTRO__A14__PNEUMATIC_MEMBRANE_RIB_${rib + 1}`, new THREE.Vector3(-2.5 + rib * 0.62, 4.85 + Math.sin(rib / 8 * Math.PI) * 0.4, -4.2), new THREE.Vector3(-2.5 + rib * 0.62, 5.15 + Math.sin(rib / 8 * Math.PI) * 0.4, 4.2), 0.045, m.titanium);
  torus(root, 'ASTRO__A14__OUTER_LIPID_LOOP', 8.4, 0.22, m.paleAggregate, [0, 0.05, 0]);
  torus(root, 'ASTRO__A14__INNER_LIPID_LOOP', 6.8, 0.18, m.iridescent, [0, 0.06, 0]);
  for (let platform = 0; platform < 10; platform += 1) { const angle = platform / 10 * Math.PI * 2; cylinder(root, `ASTRO__A14__CIRCULAR_RESEARCH_PLATFORM_${platform + 1}`, 1.25, 0.2, m.silver, [Math.cos(angle) * 8.4, 0.14, Math.sin(angle) * 8.4], false, 16); }
  pulse(torus(root, 'ASTRO__A14__COUNTER_ROTATING_POLARIZED_TRACE_LEFT', 6.1, 0.045, m.cyan.clone(), [0, 2.2, 0], [0, 0, 0], Math.PI * 1.4), 0.003, 0.1);
  pulse(torus(root, 'ASTRO__A14__COUNTER_ROTATING_POLARIZED_TRACE_RIGHT', 6.5, 0.045, m.amber.clone(), [0, 2.6, 0], [0, Math.PI, 0], Math.PI * 1.4), 0.003, Math.PI);
  return root;
}

function createProtostellar(m: Materials) {
  const root = new THREE.Group(); root.name = 'ASTRO__A15__PROTOSTELLAR_LOOM';
  cylinder(root, 'ASTRO__A15__DARK_PROTOSTELLAR_CORE', 5.4, 6.2, m.graphite, [0, 3.2, 0], true, 24);
  for (let rib = 0; rib < 22; rib += 1) { const angle = rib / 22 * Math.PI * 2; box(root, `ASTRO__A15__CORE_GRAPHITE_RIB_${rib + 1}`, [0.1, 5.4, 0.28], m.black, [Math.cos(angle) * 2.72, 3.25, Math.sin(angle) * 2.72], false, [0, -angle, 0]); }
  pulse(torus(root, 'ASTRO__A15__DAYLIGHT_CORE_HALO', 2.75, 0.06, m.whiteLight.clone(), [0, 6.0, 0]), 0.002, 0.2, 0.03, 0.7);
  for (let arm = 0; arm < 2; arm += 1) {
    const segments = arm === 0 ? 34 : 28;
    for (let segment = 0; segment < segments; segment += 1) {
      const t = segment / (segments - 1); const angle = (arm ? Math.PI : 0) + t * Math.PI * 1.35; const radius = 2.8 + t * (arm ? 7.0 : 8.4); const x = Math.cos(angle) * radius; const z = Math.sin(angle) * radius; const y = 0.65 + (arm ? 1.4 : 2.6) * t;
      box(root, `ASTRO__A15__${arm ? 'ICE_RICH' : 'DUST_RICH'}_SPIRAL_SEGMENT_${segment + 1}`, [1.2 + t * 0.8, 0.72, 1.0 + t * 0.35], arm ? (segment % 4 === 0 ? m.ice : m.white) : (segment % 4 === 0 ? m.bronze : m.graphite), [x, y, z], true, [0, -angle, (arm ? -1 : 1) * 0.03]);
    }
  }
  for (let ring = 0; ring < 7; ring += 1) torus(root, `ASTRO__A15__PLANET_FORMING_LANDSCAPE_BAND_${ring + 1}`, 3.9 + ring, 0.17 + ring % 2 * 0.06, [m.gravel, m.paleAggregate, m.ice, m.bronze][ring % 4], [0, 0.04, 0]);
  for (let planet = 0; planet < 7; planet += 1) { const angle = planet * 2.399963; const radius = 4.8 + planet * 0.85; sphere(root, `ASTRO__A15__FORMING_PLANET_CLEARING_${planet + 1}`, [0.38 + planet % 3 * 0.14, 0.38 + planet % 3 * 0.14, 0.38 + planet % 3 * 0.14], planet % 2 ? m.basalt : m.salt, [Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius]); }
  for (let receiver = 0; receiver < 5; receiver += 1) { const angle = -0.4 + receiver * 0.22; const x = 4.0 + receiver * 1.25; const z = -5.0 - receiver * 0.6; rotate(cylinder(root, `ASTRO__A15__MILLIMETRE_RECEIVER_BOWL_${receiver + 1}`, 1.1, 0.2, m.silver, [x, 2.6 + receiver * 0.15, z], false, 16, [0.35, angle, 0]), 0.002 + receiver * 0.0002); cylinder(root, `ASTRO__A15__RECEIVER_ISOLATION_TOWER_${receiver + 1}`, 0.25, 2.4, m.graphite, [x, 1.2, z], false, 8); }
  box(root, 'ASTRO__A15__COMET_SHAPED_MATERIALS_BERM', [1.8, 0.45, 10.0], m.paleAggregate, [-6.1, 0.2, 3.4], false, [0, -0.55, 0]);
  return root;
}

function assignBuildingMetadata(root: THREE.Group, record: AstronomyAstrobiologyBuildingProgram) {
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

function createBuilding(record: AstronomyAstrobiologyBuildingProgram, materials: Materials) {
  const factories: Record<AstronomyAstrobiologyBuildingForm, (materials: Materials) => THREE.Group> = {
    coronagraph: createCoronagraph,
    chronos: createChronos,
    concordance: createConcordance,
    hydrogen: createHydrogen,
    heliomagnetic: createHeliomagnetic,
    parallax: createParallax,
    asterion: createAsterion,
    noctis: createNoctis,
    aether: createAether,
    cryocean: createCryocean,
    genesis: createGenesis,
    aegis: createAegis,
    extremis: createExtremis,
    chirality: createChirality,
    protostellar: createProtostellar,
  };
  return assignBuildingMetadata(factories[record.form](materials), record);
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

function addRibbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, mat: THREE.Material, walkable = true) {
  const value = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), mat), name); value.userData.walkable = walkable; value.userData.navObstacle = false; value.userData.astronomyAstrobiologyRoute = true; value.receiveShadow = true; parent.add(value); return value;
}

function offsetPath(points: readonly THREE.Vector3[], offset: number, modulation = 0, frequency = 1) {
  return points.map((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x); const t = index / Math.max(1, points.length - 1); return point.clone().addScaledVector(normal, offset + Math.sin(t * Math.PI * frequency) * modulation).setY(FLOOR_Y + 0.026); });
}

function addDistrictInfrastructure(district: THREE.Group, definition: DistrictDefinition, m: Materials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'ASTRO__DISTRICT_ECLIPTIC_INFRASTRUCTURE';
  const eclipticWalk = districtArc(definition, 0.50, 0.02, 0.98, 128);
  addRibbon(infrastructure, 'ASTRO__ECLIPTIC_WALK', eclipticWalk, 2.8, m.basalt);
  for (let orbit = 0; orbit < 4; orbit += 1) pulse(addRibbon(infrastructure, `ASTRO__ECLIPTIC_INLAID_ORBIT_${orbit + 1}`, offsetPath(eclipticWalk, -0.84 + orbit * 0.56, 0.06, 3 + orbit), 0.045, orbit % 2 ? m.titanium : m.amber.clone(), false), 0.003 + orbit * 0.0004, orbit * 0.62, 0.03, 1.4);
  [0.10, 0.30, 0.50, 0.70, 0.90].forEach((angularT, index) => addRibbon(infrastructure, `ASTRO__ECLIPTIC_CROSSING_${index + 1}`, districtSpine(definition, angularT, 0.03, 0.97, 64), 0.92, index % 2 ? m.gravel : m.basalt));
  const court = pointInDistrict(definition, 0.50, 0.655, FLOOR_Y + 0.018);
  cylinder(infrastructure, 'ASTRO__ORRERY_COURT', 12.0, 0.08, m.basalt, [court.x, court.y, court.z], false, 24);
  for (let system = 0; system < 7; system += 1) torus(infrastructure, `ASTRO__ORRERY_PLANETARY_SYSTEM_${system + 1}`, 1.2 + system * 0.62, 0.035, system % 3 === 0 ? m.gold : m.titanium, [court.x, court.y + 0.06, court.z], [Math.PI / 2, 0, system * 0.13], Math.PI * 2, false, 5, 28);
  sphere(infrastructure, 'ASTRO__ORRERY_PRIMARY_STAR', [0.34, 0.12, 0.34], m.whiteLight, [court.x, court.y + 0.12, court.z]);
  for (let catalogue = 0; catalogue < 24; catalogue += 1) { const angle = catalogue / 24 * Math.PI * 2; cylinder(infrastructure, `ASTRO__HISTORICAL_STAR_CATALOGUE_MARKER_${catalogue + 1}`, 0.07, 0.05, catalogue % 5 === 0 ? m.red : m.titanium, [court.x + Math.cos(angle) * 5.6, court.y + 0.08, court.z + Math.sin(angle) * 5.6], false, 8); }
  const service = districtArc(definition, 0.97, 0.04, 0.96, 96); addRibbon(infrastructure, 'ASTRO__DARK_SKY_SERVICE_ROUTE', service, 1.15, m.gravel);
  for (let light = 0; light < 30; light += 1) { const point = service[Math.min(service.length - 1, light * 3)]; pulse(cylinder(infrastructure, `ASTRO__SHIELDED_RED_SERVICE_LIGHT_${light + 1}`, 0.08, 0.04, m.red.clone(), [point.x, point.y + 0.04, point.z], false, 8), 0.0024, light * 0.24, 0.02, 0.8); }
  district.add(infrastructure); return { infrastructure, eclipticWalk };
}

function addDistrictLandscape(district: THREE.Group, definition: DistrictDefinition, m: Materials) {
  const landscape = new THREE.Group(); landscape.name = 'ASTRO__DARK_SKY_EXPERIMENTAL_LANDSCAPE';
  for (let boulder = 0; boulder < 48; boulder += 1) { const radialT = boulder % 2 ? 0.03 : 0.97; const angularT = 0.025 + Math.floor(boulder / 2) * 0.041; const point = pointInDistrict(definition, radialT, angularT); sphere(landscape, `ASTRO__BASALT_BOUNDARY_BOULDER_${boulder + 1}`, [0.35 + boulder % 4 * 0.12, 0.24 + boulder % 3 * 0.09, 0.38 + boulder % 5 * 0.08], m.basalt, [point.x, 0.23, point.z]); }
  for (let station = 0; station < 15; station += 1) { const point = pointInDistrict(definition, station % 2 ? 0.29 : 0.73, 0.045 + station * 0.064); cylinder(landscape, `ASTRO__ATMOSPHERIC_MONITORING_STATION_${station + 1}`, 0.12, 1.4 + station % 4 * 0.22, m.titanium, [point.x, 0.72, point.z], false, 8); sphere(landscape, `ASTRO__ATMOSPHERIC_SENSOR_HEAD_${station + 1}`, [0.18, 0.18, 0.18], station % 5 === 0 ? m.cyan : m.glass, [point.x, 1.48 + station % 4 * 0.22, point.z]); }
  district.add(landscape); return landscape;
}

export function buildAstronomyAstrobiologyLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Astronomy / Astrobiology Labs District requires a masterplan sector');
  const materials = createMaterials();
  const { infrastructure, eclipticWalk } = addDistrictInfrastructure(district, definition, materials);
  const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = ASTRONOMY_ASTROBIOLOGY_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials); const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02); building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT };
    district.add(building); return building;
  });
  facilities.forEach((facility, index) => {
    const record = ASTRONOMY_ASTROBIOLOGY_BUILDING_PROGRAM[index]; const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, Math.min(7.2, record.footprintMetres[1] / 20 + 0.7)); const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const routePoint = eclipticWalk.reduce((closest, point) => point.distanceToSquared(entrance) < closest.distanceToSquared(entrance) ? point : closest, eclipticWalk[0]); const approach = [routePoint.clone(), routePoint.clone().lerp(entrance, 0.52), entrance];
    addRibbon(infrastructure, `ASTRO__BUILDING_APPROACH_${record.code}`, approach, 0.82, index < 8 ? materials.basalt : index < 12 ? materials.paleAggregate : materials.gravel);
    pulse(addRibbon(infrastructure, `ASTRO__BUILDING_APPROACH_RED_GUIDE_${record.code}`, offsetPath(approach, 0.24), 0.035, materials.red.clone(), false), 0.0034, index * 0.31, 0.02, 1.0);
  });
  district.userData.astronomyAstrobiologyLabsDistrict = {
    identity: 'Astronomy / Astrobiology Labs District',
    mapLabel: 'Astronomy & Astrobiology Labs',
    architecturalLanguage: 'dark-sky scientific architecture, optically black ceramic, pale non-reflective shells, precision metals, exposed calibration machinery, planetary analogue landscapes, and restrained shielded signals',
    buildingCount: facilities.length,
    buildings: ASTRONOMY_ASTROBIOLOGY_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, subtitle: record.subtitle, purpose: record.purpose, placementZone: record.placementZone, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorMotif: record.exteriorMotif })),
    zones: {
      precisionAstronomyAndDefense: ['The Coronagraph Crown', 'The Chronos Array', 'Hydrogen Horizon House', 'The Heliomagnetic Bastion', 'The Parallax Foundry', 'Asterion Shield'],
      astronomicalDataAndSignals: ['Concordance Spire', 'The Noctis Signal Vault', 'The Aether Spectrum Gardens'],
      experimentalAstrobiology: ['The Cryocean Institute', 'Genesis Ventworks', 'The Aegis Exomaterial Sanctuary', 'The Extremis Analog Ecologies Campus', 'The Chirality Ark', 'The Protostellar Loom'],
    },
    circulation: { primaryPromenade: 'ASTRO__ECLIPTIC_WALK', publicCourt: 'ASTRO__ORRERY_COURT', radialCrossings: 5, darkSkyServiceRoute: true, exactBuildingApproaches: 15 },
    darkSkyProtocol: { shieldedGroundLights: true, redMaintenanceIllumination: true, electrochromicGlazing: true, upwardAdvertisingLight: false, observingBlackoutReady: true },
    signatureSystems: { coronagraphPetals: 12, chronosFrames: 7, messengerShafts: 4, hydrogenCalibrationAntennas: 36, magneticFieldArches: 7, atmosphericShells: 5, cryoceanIcePlates: 6, extremisPods: 5, chiralityCrescents: 2, protostellarArms: 2 },
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: ASTRONOMY_ASTROBIOLOGY_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: ['Ecliptic Walk', 'Orrery Court', 'Dark-Sky Service Route', 'Orbital Inlays', 'Star Catalogue Markers', 'Atmospheric Monitoring Stations'],
    realizedFeatureTags: ASTRONOMY_ASTROBIOLOGY_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 21,
    radialCoverage: 0.97,
    angularCoverage: 0.98,
    exteriorOnly: true,
    eclipticWalkNarrative: true,
    darkSkyCompliant: true,
  };
}
