import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { DistrictDefinition } from '../data/districts';

type EnvironmentalBuildingForm =
  | 'tellus'
  | 'aeolian'
  | 'hydrological'
  | 'littoral'
  | 'biotic'
  | 'critical-zone'
  | 'carbon-foundry'
  | 'anthropocene'
  | 'resilience'
  | 'gaia-fleetworks';

export interface EnvironmentalBuildingProgram {
  code: string;
  name: string;
  subtitle: string;
  focus: string;
  form: EnvironmentalBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  sequence: number;
  exteriorSignature: string;
}

export const ENVIRONMENTAL_SCIENCE_BUILDING_PROGRAM: readonly EnvironmentalBuildingProgram[] = [
  { code: 'E1', name: 'Tellus Earth Systems Convergence', subtitle: 'Planetary Modelling and Integrated Observation', focus: 'Planetary modelling, environmental digital twins, and integrated Earth observation', form: 'tellus', footprintMetres: [216, 176], heightMetres: 46, radialT: 0.06, angularT: 0.73, sequence: 10, exteriorSignature: 'three incomplete elliptical contour rings around a geological world court and instrumented skeletal globe' },
  { code: 'E2', name: 'Aeolian Atmospheric Observatory', subtitle: 'Atmospheric Chemistry and Cloud Physics', focus: 'Greenhouse gases, aerosols, cloud microphysics, and marine-atmosphere sampling', form: 'aeolian', footprintMetres: [154, 146], heightMetres: 105, radialT: 0.86, angularT: 0.08, sequence: 2, exteriorSignature: 'rounded three-bladed atmospheric tower with five instrument halos, aerostat apron, and calibration mast forest' },
  { code: 'E3', name: 'Hydrological Extremes Institute', subtitle: 'Flood, Drought and Groundwater Systems', focus: 'Floods, droughts, groundwater, isotope hydrology, and watershed prediction', form: 'hydrological', footprintMetres: [208, 172], heightMetres: 44, radialT: 0.58, angularT: 0.22, sequence: 3, exteriorSignature: 'seven descending watershed terraces cut by an artificial ravine, exposed flumes, and a floodable plaza' },
  { code: 'E4', name: 'Littoral Exchange Laboratory', subtitle: 'Ocean-Land Interface Research', focus: 'Coastal dynamics, ocean acidification, marine ecology, and land-sea exchange', form: 'littoral', footprintMetres: [226, 252], heightMetres: 34, radialT: 0.78, angularT: 0.92, sequence: 1, exteriorSignature: 'segmented semi-submerged shoreline crescent, tidal basins, habitat breakwater, research pier, and Exchange Disc' },
  { code: 'E5', name: 'Biotic Continuum Observatory', subtitle: 'Biodiversity and Ecosystem Monitoring', focus: 'Biodiversity genomics, environmental DNA, acoustic ecology, and species migration', form: 'biotic', footprintMetres: [210, 164], heightMetres: 40, radialT: 0.58, angularT: 0.50, sequence: 5, exteriorSignature: 'branching elevated phylogenetic structure, habitat corridors, dome bridges, ecological roof strips, and Biodiversity Mast' },
  { code: 'E6', name: 'Critical Zone and Rhizosphere Institute', subtitle: 'Soil, Roots and Subsurface Ecosystems', focus: 'Soil systems, root ecology, weathering, nutrient cycles, and subsurface microbiology', form: 'critical-zone', footprintMetres: [202, 174], heightMetres: 38, radialT: 0.58, angularT: 0.78, sequence: 4, exteriorSignature: 'partially buried geological terraces, exposed soil-profile court, core towers, boreholes, and instrumented root columns' },
  { code: 'E7', name: 'Carbon Transformation Foundry', subtitle: 'Carbon Removal and Biogeochemical Engineering', focus: 'Direct air capture, mineralization, enhanced weathering, and carbon-cycle engineering', form: 'carbon-foundry', footprintMetres: [218, 176], heightMetres: 48, radialT: 0.31, angularT: 0.92, sequence: 7, exteriorSignature: 'dark mineralized laboratory, six modular capture towers, three mineral silos, exposed pipes, and weathering yard' },
  { code: 'E8', name: 'Anthropocene Forensics Centre', subtitle: 'Emerging Pollutant Source Attribution', focus: 'PFAS, microplastics, nanoplastics, environmental exposomics, and source attribution', form: 'anthropocene', footprintMetres: [196, 148], heightMetres: 36, radialT: 0.31, angularT: 0.62, sequence: 6, exteriorSignature: 'sealed recycled-glass black monolith split by five pathway fissures and crowned by a dense sampler field' },
  { code: 'E9', name: 'Climate Resilience Proving House', subtitle: 'Adaptation Systems Test Complex', focus: 'Flood, heat, drought, wildfire, storm, and infrastructure-failure adaptation', form: 'resilience', footprintMetres: [232, 182], heightMetres: 42, radialT: 0.31, angularT: 0.08, sequence: 8, exteriorSignature: 'reinforced test spine with twelve replaceable facade bays, travelling storm frame, flood plaza, and Heat Canyon' },
  { code: 'E10', name: 'Gaia Field Systems Fleetworks', subtitle: 'Autonomous Observation and Ecosystem Repair', focus: 'Environmental drones, autonomous boats, field robots, sensing networks, and ecosystem restoration', form: 'gaia-fleetworks', footprintMetres: [220, 174], heightMetres: 36, radialT: 0.06, angularT: 0.27, sequence: 9, exteriorSignature: 'low boomerang robotic hangar around a launch court, operational roof, calibration facade, canal door, and communications mast' },
] as const;

const DISTRICT_ID = 'environmental-science-labs';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_6 = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
const UNIT_CYLINDER_8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 12, 8);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_Z = new THREE.Vector3(0, 0, 1);
const TORUS_CACHE = new Map<string, THREE.TorusGeometry>();

function material(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  const value = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.14, ...options });
  value.name = name;
  return value;
}

function createMaterials() {
  const paleCeramic = material('Environmental pale photocatalytic ceramic', '#d7d9d1', { roughness: 0.72, metalness: 0.04 });
  const mineralConcrete = material('Mineralized industrial-waste concrete', '#9d9a8d', { roughness: 0.91, metalness: 0.03 });
  const darkBasalt = material('Dark basalt composite', '#17201e', { roughness: 0.88, metalness: 0.12 });
  const blackGlassCeramic = material('Recycled-glass black forensic ceramic', '#0a1011', { roughness: 0.38, metalness: 0.56 });
  const titanium = material('Salt-resistant satin titanium', '#aab5b3', { roughness: 0.26, metalness: 0.9 });
  const weatheredSteel = material('Weathered scientific steel', '#6d5545', { roughness: 0.69, metalness: 0.72 });
  const glass = material('Bird-safe electrochromic research glass', '#4c6b6a', { roughness: 0.2, metalness: 0.46, emissive: '#0d2523', emissiveIntensity: 0.08 });
  const fluoropolymer = material('Translucent fluoropolymer instrument shield', '#b8d3cb', { roughness: 0.31, metalness: 0.08, transparent: true, opacity: 0.66, depthWrite: true });
  const rammedEarth = material('Instrumented rammed mineral earth', '#766451', { roughness: 0.98, metalness: 0 });
  const clay = material('Dark critical-zone clay composite', '#403830', { roughness: 0.97, metalness: 0.01 });
  const carbonate = material('Pale carbonate research concrete', '#c7c1ad', { roughness: 0.86, metalness: 0.02 });
  const vegetation = material('Monitored transect vegetation', '#4d6850', { roughness: 0.98, metalness: 0 });
  const wetland = material('Instrumented wetland vegetation', '#557966', { roughness: 0.97, metalness: 0.01 });
  const soil = material('Climate-controlled soil plot', '#4b4033', { roughness: 1, metalness: 0 });
  const water = material('Monitored environmental water', '#183c45', { roughness: 0.12, metalness: 0.28, transparent: true, opacity: 0.78, depthWrite: true });
  const paving = material('Pale permeable transect paving', '#b7b5a8', { roughness: 0.94, metalness: 0.02 });
  const porous = material('Dark porous utility concrete', '#303735', { roughness: 0.93, metalness: 0.08 });
  const photovoltaic = material('Blue-black photovoltaic membrane', '#182d39', { roughness: 0.24, metalness: 0.62 });
  const amber = material('Wildlife-safe amber instrument light', '#ffd59b', { emissive: '#ff861f', emissiveIntensity: 2.25, roughness: 0.14, metalness: 0.05 });
  const cyan = material('Hydrological cyan gauge light', '#d7fbff', { emissive: '#35cbe5', emissiveIntensity: 2.45, roughness: 0.12, metalness: 0.05 });
  const green = material('Biosphere green status light', '#d6efce', { emissive: '#66b562', emissiveIntensity: 1.85, roughness: 0.16, metalness: 0.03 });
  const white = material('Calibration white instrument light', '#ffffff', { emissive: '#ffffff', emissiveIntensity: 2.35, roughness: 0.1, metalness: 0.03 });
  [amber, cyan, green, white].forEach((value) => { value.userData.isDistrictAccent = true; });
  return { paleCeramic, mineralConcrete, darkBasalt, blackGlassCeramic, titanium, weatheredSteel, glass, fluoropolymer, rammedEarth, clay, carbonate, vegetation, wetland, soil, water, paving, porous, photovoltaic, amber, cyan, green, white };
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

function roundedBox(parent: THREE.Object3D, name: string, size: readonly [number, number, number], radius: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const value = prepare(new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius), mat), name, obstacle);
  value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function cylinder(parent: THREE.Object3D, name: string, diameter: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 24, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const geometry = segments === 6 ? UNIT_CYLINDER_6 : segments === 8 ? UNIT_CYLINDER_8 : segments === 12 ? UNIT_CYLINDER_12 : UNIT_CYLINDER_24;
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

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, mat: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0], arc = Math.PI * 2, obstacle = false, radialSegments = 6, tubularSegments = 32) {
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

function pulse<T extends THREE.Object3D>(object: T, speed: number, phase = 0, minIntensity = 0.08, maxIntensity = 2.4) {
  object.userData.animate = 'environmental-science-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate<T extends THREE.Object3D>(object: T, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'environmental-science-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function arcBoxes(parent: THREE.Object3D, prefix: string, radiusX: number, radiusZ: number, start: number, arc: number, count: number, height: number, depth: number, mat: THREE.Material, y: number, obstacle = false) {
  for (let index = 0; index < count; index += 1) {
    const t0 = start + arc * index / count; const t1 = start + arc * (index + 1) / count; const t = (t0 + t1) * 0.5;
    const x = Math.cos(t) * radiusX; const z = Math.sin(t) * radiusZ;
    const tangentX = -Math.sin(t) * radiusX; const tangentZ = Math.cos(t) * radiusZ;
    const length = Math.hypot(tangentX, tangentZ) * arc / count * 1.06; const rotationY = -Math.atan2(tangentZ, tangentX);
    box(parent, `${prefix}_${index + 1}`, [length, height, depth], mat, [x, y + height * 0.5, z], obstacle, [0, rotationY, 0]);
  }
}

function createTellus(m: Materials) {
  const root = new THREE.Group(); root.name = 'ENVSCI__E1__TELLUS_EARTH_SYSTEMS_CONVERGENCE';
  const rings = [
    { rx: 10.2, rz: 7.7, height: 2.6, y: 0.1, start: 0.34, arc: Math.PI * 1.58 },
    { rx: 7.35, rz: 5.35, height: 3.55, y: 0.1, start: 2.0, arc: Math.PI * 1.56 },
    { rx: 4.55, rz: 3.25, height: 4.45, y: 0.1, start: 0.55, arc: Math.PI * 1.48 },
  ];
  rings.forEach((ring, index) => {
    arcBoxes(root, `ENVSCI__E1__CONTOUR_RING_${index + 1}_CERAMIC_SEGMENT`, ring.rx, ring.rz, ring.start, ring.arc, 22 - index * 3, ring.height, 1.05, index === 1 ? m.carbonate : m.paleCeramic, ring.y, true);
    arcBoxes(root, `ENVSCI__E1__ELECTROCHROMIC_LONGITUDE_BAND_${index + 1}`, ring.rx + 0.04, ring.rz + 0.04, ring.start, ring.arc, 22 - index * 3, 0.42, 1.11, m.glass, ring.y + ring.height * 0.5, false);
    for (let fin = 0; fin < 12; fin += 1) {
      const angle = ring.start + ring.arc * (fin + 0.5) / 12; const x = Math.cos(angle) * (ring.rx + 0.58); const z = Math.sin(angle) * (ring.rz + 0.58);
      box(root, `ENVSCI__E1__LONGITUDE_SOLAR_FIN_${index + 1}_${fin + 1}`, [0.09, ring.height * (0.72 + fin % 3 * 0.07), 0.85], m.titanium, [x, ring.y + ring.height * 0.51, z], false, [0, -angle, 0]);
    }
  });
  cylinder(root, 'ENVSCI__E1__GEOLOGICAL_WORLD_COURT', 7.0, 0.1, m.darkBasalt, [0, 0.16, 0], false, 48);
  const globe = new THREE.Group(); globe.name = 'ENVSCI__E1__INSTRUMENTED_SKELETAL_GLOBE'; globe.position.set(0, 3.2, 0);
  torus(globe, 'ENVSCI__E1__GLOBE_EQUATOR', 1.65, 0.055, m.titanium, [0, 0, 0], [Math.PI / 2, 0, 0], Math.PI * 2, false, 5, 40);
  torus(globe, 'ENVSCI__E1__GLOBE_PRIME_MERIDIAN', 1.65, 0.055, m.titanium, [0, 0, 0], [0, 0, 0], Math.PI * 2, false, 5, 40);
  torus(globe, 'ENVSCI__E1__GLOBE_ORBITAL_RING', 1.9, 0.035, m.white, [0, 0, 0], [0.15, 0.62, 0.3], Math.PI * 2, false, 5, 40);
  for (let sensor = 0; sensor < 12; sensor += 1) { const angle = sensor / 12 * Math.PI * 2; sphere(globe, `ENVSCI__E1__GLOBE_SENSOR_${sensor + 1}`, [0.09, 0.09, 0.09], sensor % 3 ? m.white : m.cyan, [Math.cos(angle) * 1.65, Math.sin(angle * 2) * 0.62, Math.sin(angle) * 1.65]); }
  root.add(globe);
  box(root, 'ENVSCI__E1__BRASS_MERIDIAN', [0.08, 0.025, 8.8], m.weatheredSteel, [0, 0.23, 0]);
  for (let station = 0; station < 24; station += 1) { const angle = station / 24 * Math.PI * 2; const radius = 5.5 + station % 3 * 1.7; cylinder(root, `ENVSCI__E1__ROOF_OBSERVATION_STATION_${station + 1}`, 0.18, 0.55 + station % 4 * 0.12, station % 4 ? m.titanium : m.white, [Math.cos(angle) * radius, 4.72 + station % 2 * 0.12, Math.sin(angle) * radius], false, 8); }
  for (let surface = 0; surface < 7; surface += 1) box(root, `ENVSCI__E1__REMOTE_SENSING_REFERENCE_SURFACE_${surface + 1}`, [1.55, 0.08, 1.35], [m.soil, m.paving, m.water, m.darkBasalt, m.carbonate, m.vegetation, m.photovoltaic][surface], [-5.2 + surface * 1.75, 0.08, 9.0]);
  return root;
}

function createAeolian(m: Materials) {
  const root = new THREE.Group(); root.name = 'ENVSCI__E2__AEOLIAN_ATMOSPHERIC_OBSERVATORY';
  for (let wedge = 0; wedge < 3; wedge += 1) roundedBox(root, `ENVSCI__E2__AERODYNAMIC_BASE_WEDGE_${wedge + 1}`, [8.4, 1.65, 4.4], 0.42, wedge === 1 ? m.paleCeramic : m.mineralConcrete, [Math.sin(wedge / 3 * Math.PI * 2) * 3.1, 0.92, Math.cos(wedge / 3 * Math.PI * 2) * 2.4], true, [0, wedge / 3 * Math.PI * 2, 0]);
  for (let blade = 0; blade < 3; blade += 1) {
    const angle = blade / 3 * Math.PI * 2; roundedBox(root, `ENVSCI__E2__ROUNDED_TOWER_BLADE_${blade + 1}`, [1.65, 10.5, 1.05], 0.48, m.paleCeramic, [Math.sin(angle) * 0.38, 6.0, Math.cos(angle) * 0.38], true, [0, angle, 0]);
    box(root, `ENVSCI__E2__PROTECTED_SAMPLING_SEAM_${blade + 1}`, [0.11, 9.2, 0.16], m.darkBasalt, [Math.sin(angle) * 0.92, 6.0, Math.cos(angle) * 0.92], false, [0, angle, 0]);
  }
  [2.75, 4.35, 6.05, 7.8, 10.25].forEach((height, index) => {
    const halo = rotate(torus(root, `ENVSCI__E2__INSTRUMENT_HALO_${index + 1}`, 1.45 + index * 0.18, 0.08, m.titanium, [0, height, 0], [Math.PI / 2, 0, 0], Math.PI * 2, false, 6, 36), 0.018 + index * 0.004);
    halo.userData.instrumentLevel = ['pollen', 'aerosol', 'greenhouse-gas', 'cloud-microphysics', 'turbulence'][index];
    for (let arm = 0; arm < 6; arm += 1) { const angle = arm / 6 * Math.PI * 2; pipe(root, `ENVSCI__E2__HALO_SENSOR_OUTRIGGER_${index + 1}_${arm + 1}`, new THREE.Vector3(Math.sin(angle) * 1.2, height, Math.cos(angle) * 1.2), new THREE.Vector3(Math.sin(angle) * (2.0 + index * 0.18), height, Math.cos(angle) * (2.0 + index * 0.18)), 0.035, arm % 2 ? m.titanium : m.white); }
  });
  cylinder(root, 'ENVSCI__E2__SUMMIT_LIDAR_MAST', 0.22, 2.0, m.titanium, [0, 11.9, 0], false, 12);
  pulse(cylinder(root, 'ENVSCI__E2__VERTICAL_LIDAR_BEAM', 0.035, 3.7, m.cyan.clone(), [0, 14.6, 0], false, 8), 0.0016, 0.3, 0.02, 1.2);
  rotate(torus(root, 'ENVSCI__E2__CURVED_WIND_VANE_RING', 1.05, 0.055, m.weatheredSteel, [0, 12.65, 0], [0, 0, 0], Math.PI * 1.72, false, 5, 28), 0.035, 'y');
  cylinder(root, 'ENVSCI__E2__DARK_POROUS_AEROSTAT_APRON', 10.6, 0.08, m.porous, [0, 0.07, -8.2], false, 48);
  for (let zone = 0; zone < 3; zone += 1) torus(root, `ENVSCI__E2__AEROSTAT_LAUNCH_ZONE_${zone + 1}`, 1.2 + zone * 1.25, 0.045, zone % 2 ? m.white : m.amber, [0, 0.13, -8.2], [Math.PI / 2, 0, 0], Math.PI * 2, false, 5, 32);
  for (let mast = 0; mast < 16; mast += 1) { const angle = mast / 16 * Math.PI * 2; const radius = 6.5 + mast % 3 * 1.6; const height = 1.7 + mast % 5 * 0.72; cylinder(root, `ENVSCI__E2__CALIBRATION_MAST_${mast + 1}`, 0.11, height, m.titanium, [Math.cos(angle) * radius, height * 0.5, Math.sin(angle) * radius], false, 8); torus(root, `ENVSCI__E2__CALIBRATION_CUP_${mast + 1}`, 0.25, 0.035, m.white, [Math.cos(angle) * radius, height + 0.08, Math.sin(angle) * radius], [Math.PI / 2, 0, 0], Math.PI * 2, false, 5, 16); }
  return root;
}

function createHydrological(m: Materials) {
  const root = new THREE.Group(); root.name = 'ENVSCI__E3__HYDROLOGICAL_EXTREMES_INSTITUTE';
  for (let terrace = 0; terrace < 7; terrace += 1) {
    const width = 18.8 - terrace * 1.05; const depth = 2.65; const height = 4.1 - terrace * 0.48; const z = -7.8 + terrace * 2.55;
    box(root, `ENVSCI__E3__WATERSHED_TERRACE_${terrace + 1}`, [width, height, depth], terrace < 3 ? m.mineralConcrete : m.darkBasalt, [0, height * 0.5, z], true);
    box(root, `ENVSCI__E3__HISTORIC_FLOOD_LEVEL_${terrace + 1}`, [width + 0.18, 0.055, 0.08], m.titanium, [0, 0.75 + terrace * 0.26, z + depth * 0.51]);
    box(root, `ENVSCI__E3__EXPOSED_ROOF_FLUME_${terrace + 1}`, [0.42, 0.12, depth * 0.9], m.water, [-3.5 + terrace * 1.1, height + 0.08, z]);
  }
  box(root, 'ENVSCI__E3__CENTRAL_ARTIFICIAL_RAVINE', [3.0, 0.14, 18.2], m.water, [0, 0.08, 0]);
  for (let bridge = 0; bridge < 4; bridge += 1) box(root, `ENVSCI__E3__GLASS_BOTTOM_RAVINE_BRIDGE_${bridge + 1}`, [4.1, 0.15, 1.1], bridge % 2 ? m.glass : m.paving, [0, 1.15 + bridge % 2 * 0.18, -6.0 + bridge * 4.0]);
  for (let arch = 0; arch < 4; arch += 1) torus(root, `ENVSCI__E3__DEEP_CONCRETE_RAVINE_ARCH_${arch + 1}`, 1.25, 0.24, m.carbonate, [0, 1.2, -6.0 + arch * 4.0], [0, 0, 0], Math.PI, true, 6, 20);
  box(root, 'ENVSCI__E3__FLOODABLE_PERMEABLE_FORECOURT', [14.8, 0.09, 5.2], m.paving, [0, 0.055, 11.0]);
  for (let gauge = 0; gauge < 9; gauge += 1) { cylinder(root, `ENVSCI__E3__FLOOD_PLAZA_GAUGE_${gauge + 1}`, 0.13, 1.0 + gauge % 3 * 0.34, m.titanium, [-6.0 + gauge * 1.5, 0.5 + gauge % 3 * 0.17, 10.8], false, 8); pulse(box(root, `ENVSCI__E3__GAUGE_LEVEL_LIGHT_${gauge + 1}`, [0.2, 0.05, 0.05], m.cyan.clone(), [-6.0 + gauge * 1.5, 0.4 + gauge % 3 * 0.22, 10.72]), 0.0024, gauge * 0.25, 0.02, 1.1); }
  for (let well = 0; well < 7; well += 1) { const x = -8.6 + well * 2.8; cylinder(root, `ENVSCI__E3__GROUNDWATER_WELL_${well + 1}`, 0.58, 1.2 + well % 3 * 0.38, m.fluoropolymer, [x, 0.6 + well % 3 * 0.19, -10.2], false, 16); cylinder(root, `ENVSCI__E3__WELL_PRESSURE_INDICATOR_${well + 1}`, 0.14, 0.32, well % 2 ? m.cyan : m.white, [x, 1.35 + well % 3 * 0.38, -10.2], false, 8); }
  for (let pipeIndex = 0; pipeIndex < 7; pipeIndex += 1) pipe(root, `ENVSCI__E3__DISTINCT_CATCHMENT_DISCHARGE_${pipeIndex + 1}`, new THREE.Vector3(-7.2 + pipeIndex * 2.4, 1.1, 7.6), new THREE.Vector3(-7.2 + pipeIndex * 2.4, 0.22, 14.6), 0.075, m.titanium);
  return root;
}

function createLittoral(m: Materials) {
  const root = new THREE.Group(); root.name = 'ENVSCI__E4__LITTORAL_EXCHANGE_LABORATORY';
  arcBoxes(root, 'ENVSCI__E4__SEGMENTED_MINERAL_CONCRETE_CRESCENT_PLINTH', 9.2, 6.4, 0.12, Math.PI * 1.7, 24, 1.45, 2.15, m.mineralConcrete, 0, true);
  arcBoxes(root, 'ENVSCI__E4__TITANIUM_AND_RECESSED_GLASS_CRESCENT', 8.9, 6.15, 0.18, Math.PI * 1.58, 22, 2.2, 1.72, m.glass, 1.42, true);
  for (let fin = 0; fin < 24; fin += 1) { const angle = 0.18 + Math.PI * 1.58 * (fin + 0.5) / 24; box(root, `ENVSCI__E4__SALT_RESISTANT_CERAMIC_FIN_${fin + 1}`, [0.11, 2.8, 0.95], fin % 2 ? m.paleCeramic : m.titanium, [Math.cos(angle) * 9.15, 2.1, Math.sin(angle) * 6.45], false, [0, -angle, 0]); }
  slabBetween(root, 'ENVSCI__E4__HEAVY_RESEARCH_PIER', new THREE.Vector3(0, 0.35, -2.0), new THREE.Vector3(0, 0.35, -18.2), 1.65, 0.38, m.mineralConcrete, true);
  slabBetween(root, 'ENVSCI__E4__OPEN_METAL_PIER_EXTENSION', new THREE.Vector3(0, 0.58, -18.2), new THREE.Vector3(0, 0.58, -23.2), 1.05, 0.16, m.titanium);
  cylinder(root, 'ENVSCI__E4__ROTATING_EXCHANGE_DISC', 5.5, 0.35, m.titanium, [0, 0.72, -23.2], false, 48);
  const discRing = rotate(torus(root, 'ENVSCI__E4__EXCHANGE_DISC_SENSOR_RAIL', 2.45, 0.08, m.white, [0, 1.0, -23.2], [Math.PI / 2, 0, 0], Math.PI * 2, false, 6, 40), 0.012);
  discRing.userData.sensorOrientationExperiment = true;
  cylinder(root, 'ENVSCI__E4__EXCHANGE_DISC_MAST', 0.2, 3.2, m.titanium, [0, 2.25, -23.2], false, 12);
  for (let arm = 0; arm < 8; arm += 1) { const angle = arm / 8 * Math.PI * 2; pipe(root, `ENVSCI__E4__ARTICULATED_DEPTH_SENSOR_ARM_${arm + 1}`, new THREE.Vector3(Math.sin(angle) * 1.8, 1.1, -23.2 + Math.cos(angle) * 1.8), new THREE.Vector3(Math.sin(angle) * 2.8, 0.1, -23.2 + Math.cos(angle) * 2.8), 0.04, m.titanium); }
  for (let basin = 0; basin < 6; basin += 1) { const x = 7.6 + (basin % 2) * 2.1; const z = -6.8 + Math.floor(basin / 2) * 4.2; box(root, `ENVSCI__E4__TIDAL_BASIN_${basin + 1}`, [1.75, 0.22, 3.45], m.water, [x, 0.08, z]); box(root, `ENVSCI__E4__TIDAL_BASIN_CONTROL_WALL_${basin + 1}`, [2.05, 0.65, 0.18], basin % 2 ? m.glass : m.darkBasalt, [x, 0.32, z - 1.7]); }
  for (let module = 0; module < 11; module += 1) { const x = -10.6 - module % 3 * 1.4; const z = -9.8 + module * 1.55; roundedBox(root, `ENVSCI__E4__FRAGMENTED_HABITAT_BREAKWATER_${module + 1}`, [1.55, 1.05 + module % 3 * 0.28, 1.2], 0.2, module % 2 ? m.mineralConcrete : m.carbonate, [x, 0.32, z], true, [0, module * 0.43, 0]); torus(root, `ENVSCI__E4__BREAKWATER_HABITAT_CAVITY_${module + 1}`, 0.24, 0.05, m.darkBasalt, [x, 0.65, z + 0.62], [0, 0, 0], Math.PI * 2, false, 5, 14); }
  return root;
}

function createBiotic(m: Materials) {
  const root = new THREE.Group(); root.name = 'ENVSCI__E5__BIOTIC_CONTINUUM_OBSERVATORY';
  box(root, 'ENVSCI__E5__ELEVATED_PHYLOGENETIC_SPINE', [4.2, 2.2, 15.6], m.glass, [0, 3.2, 0], true);
  const branches = [
    [new THREE.Vector3(-1.2, 3.2, -5.2), new THREE.Vector3(-9.4, 3.0, -9.0)],
    [new THREE.Vector3(1.2, 3.2, -1.5), new THREE.Vector3(9.8, 3.15, -5.0)],
    [new THREE.Vector3(-1.2, 3.2, 2.2), new THREE.Vector3(-9.6, 2.9, 6.2)],
    [new THREE.Vector3(1.2, 3.2, 5.8), new THREE.Vector3(9.2, 3.1, 9.0)],
  ];
  branches.forEach(([start, end], index) => { slabBetween(root, `ENVSCI__E5__BRANCHING_ECOLOGICAL_WING_${index + 1}`, start, end, 3.15, 2.05, index % 2 ? m.paleCeramic : m.glass, true); slabBetween(root, `ENVSCI__E5__DETACHED_PERFORATED_SENSOR_SCREEN_${index + 1}`, start.clone().add(new THREE.Vector3(0, 0.15, 0.15)), end.clone().add(new THREE.Vector3(0, 0.15, 0.15)), 3.45, 0.18, m.titanium); });
  for (let pier = 0; pier < 18; pier += 1) { const z = -7.0 + pier % 9 * 1.75; const x = pier < 9 ? -1.65 : 1.65; cylinder(root, `ENVSCI__E5__SLENDER_HABITAT_CLEARANCE_PIER_${pier + 1}`, 0.22, 2.1, pier % 2 ? m.darkBasalt : m.mineralConcrete, [x, 1.05, z], true, 8); }
  slabBetween(root, 'ENVSCI__E5__RAINFOREST_RESEARCH_BRIDGE', new THREE.Vector3(-8.6, 3.15, -8.5), new THREE.Vector3(-14.2, 3.6, -13.2), 1.25, 1.1, m.fluoropolymer);
  slabBetween(root, 'ENVSCI__E5__TEMPERATE_RESEARCH_BRIDGE', new THREE.Vector3(-8.6, 3.0, 6.0), new THREE.Vector3(-14.2, 3.2, 12.4), 1.25, 1.1, m.fluoropolymer);
  for (let strip = 0; strip < 10; strip += 1) box(root, `ENVSCI__E5__ECOLOGICAL_ROOF_STRIP_${strip + 1}`, [0.55, 0.14, 13.8], [m.vegetation, m.wetland, m.soil, m.carbonate][strip % 4], [-1.55 + strip * 0.34, 4.42, 0]);
  cylinder(root, 'ENVSCI__E5__BIODIVERSITY_MAST', 1.05, 4.0, m.darkBasalt, [5.8, 4.1, 1.2], true, 12);
  [3.2, 4.35, 5.55, 6.8].forEach((height, index) => { torus(root, `ENVSCI__E5__BIODIVERSITY_PLATFORM_${index + 1}`, 1.15 + index * 0.17, 0.12, m.titanium, [5.8, height, 1.2], [Math.PI / 2, 0, 0], Math.PI * 2, false, 6, 28); for (let sensor = 0; sensor < 5; sensor += 1) { const angle = sensor / 5 * Math.PI * 2; sphere(root, `ENVSCI__E5__BIODIVERSITY_SENSOR_${index + 1}_${sensor + 1}`, [0.1, 0.1, 0.1], sensor % 2 ? m.amber : m.green, [5.8 + Math.cos(angle) * (1.2 + index * 0.17), height + 0.15, 1.2 + Math.sin(angle) * (1.2 + index * 0.17)]); } });
  return root;
}

function createCriticalZone(m: Materials) {
  const root = new THREE.Group(); root.name = 'ENVSCI__E6__CRITICAL_ZONE_AND_RHIZOSPHERE_INSTITUTE';
  const layers = [m.darkBasalt, m.rammedEarth, m.carbonate, m.clay, m.mineralConcrete];
  for (let terrace = 0; terrace < 5; terrace += 1) { const width = 18.6 - terrace * 1.6; const depth = 3.1; const height = 1.0 + terrace * 0.55; const z = -6.6 + terrace * 2.7; box(root, `ENVSCI__E6__GEOLOGICAL_TERRACE_${terrace + 1}`, [width, height, depth], layers[terrace], [0, height * 0.5 - 0.28, z], true); for (let band = 0; band < 3; band += 1) box(root, `ENVSCI__E6__EXPOSED_SOIL_PROFILE_BAND_${terrace + 1}_${band + 1}`, [width + 0.12, 0.22, 0.12], layers[(terrace + band + 1) % layers.length], [0, 0.12 + band * 0.27, z + depth * 0.52]); }
  box(root, 'ENVSCI__E6__SUNKEN_STRATIFIED_RESEARCH_COURT', [13.8, 0.08, 5.2], m.porous, [0, -0.3, 8.4]);
  for (let core = 0; core < 6; core += 1) { const height = 3.0 + core % 3 * 0.75; cylinder(root, `ENVSCI__E6__GEOLOGICAL_CORE_TOWER_${core + 1}`, 1.0 + core % 2 * 0.22, height, [m.darkBasalt, m.carbonate, m.rammedEarth][core % 3], [-5.0 + core * 2.0, height * 0.5 - 0.25, 8.2], true, 16); for (let tick = 0; tick < 5; tick += 1) box(root, `ENVSCI__E6__CORE_DEPTH_SCALE_${core + 1}_${tick + 1}`, [0.52, 0.045, 0.04], m.white, [-5.0 + core * 2.0, 0.35 + tick * 0.5, 8.72]); }
  for (let bore = 0; bore < 8; bore += 1) { const x = -8.4 + bore * 2.4; cylinder(root, `ENVSCI__E6__BOREHOLE_INSTALLATION_${bore + 1}`, 0.28, 0.9 + bore % 3 * 0.26, m.titanium, [x, 0.45 + bore % 3 * 0.13, 13.2], false, 12); torus(root, `ENVSCI__E6__BOREHOLE_COLLAR_${bore + 1}`, 0.3, 0.055, bore % 2 ? m.amber : m.green, [x, 0.92 + bore % 3 * 0.26, 13.2], [Math.PI / 2, 0, 0], Math.PI * 2, false, 5, 16); }
  for (let column = 0; column < 6; column += 1) { const x = -5.8 + column * 2.3; cylinder(root, `ENVSCI__E6__TRANSPARENT_SOIL_PLANT_COLUMN_${column + 1}`, 0.82, 3.4 + column % 2 * 0.6, m.fluoropolymer, [x, 3.0 + column % 2 * 0.3, -1.8], false, 20); pulse(box(root, `ENVSCI__E6__ROOT_MONITORING_LIGHT_${column + 1}`, [0.08, 2.2, 0.08], m.green.clone(), [x + 0.43, 2.8, -1.8]), 0.0018, column * 0.38, 0.02, 0.8); }
  for (let slab = 0; slab < 8; slab += 1) box(root, `ENVSCI__E6__STRATIGRAPHY_GARDEN_SLAB_${slab + 1}`, [0.48 + slab % 3 * 0.18, 2.0 + slab % 4 * 0.45, 0.35], layers[slab % layers.length], [-7.2 + slab * 2.05, 1.0 + slab % 4 * 0.225, -10.1], false, [0, (slab - 4) * 0.07, 0]);
  return root;
}

function createCarbonFoundry(m: Materials) {
  const root = new THREE.Group(); root.name = 'ENVSCI__E7__CARBON_TRANSFORMATION_FOUNDRY';
  box(root, 'ENVSCI__E7__MINERALIZED_MAIN_LABORATORY_BLOCK', [19.2, 4.0, 7.2], m.darkBasalt, [0, 2.0, 3.5], true);
  for (let panel = 0; panel < 14; panel += 1) box(root, `ENVSCI__E7__CARBON_STORED_FACADE_PANEL_${panel + 1}`, [1.08, 1.35, 0.14], panel % 3 ? m.mineralConcrete : m.carbonate, [-8.3 + panel * 1.28, 1.9 + panel % 2 * 0.22, 7.15]);
  for (let tower = 0; tower < 6; tower += 1) { const x = -8.0 + tower * 3.2; const z = -5.4; const height = 4.0; const towerRoot = new THREE.Group(); towerRoot.name = `ENVSCI__E7__MODULAR_DIRECT_AIR_CAPTURE_TOWER_${tower + 1}`; towerRoot.position.set(x, 0, z); for (let leg = 0; leg < 4; leg += 1) box(towerRoot, `ENVSCI__E7__CAPTURE_LATTICE_${tower + 1}_${leg + 1}`, [0.14, height, 0.14], m.paleCeramic, [leg < 2 ? -0.7 : 0.7, height * 0.5, leg % 2 ? -0.62 : 0.62]); for (let cassette = 0; cassette < 6; cassette += 1) box(towerRoot, `ENVSCI__E7__REPLACEABLE_CAPTURE_CASSETTE_${tower + 1}_${cassette + 1}`, [1.2, 0.34 + tower % 3 * 0.08, 0.18], cassette % 2 ? m.fluoropolymer : m.titanium, [0, 0.55 + cassette * 0.56, 0], false, [0, tower * 0.17, cassette % 2 ? 0.08 : -0.08]); rotate(torus(towerRoot, `ENVSCI__E7__CAPTURE_DRUM_${tower + 1}`, 0.6, 0.12, m.titanium, [0, 2.15, 0], [0, 0, 0], Math.PI * 2, false, 6, 24), 0.025 + tower * 0.003, 'x'); root.add(towerRoot); }
  for (let silo = 0; silo < 3; silo += 1) { const x = -5.4 + silo * 5.4; cylinder(root, `ENVSCI__E7__MINERALIZATION_SILO_${silo + 1}`, 3.1, 5.6 + silo * 0.55, silo % 2 ? m.titanium : m.darkBasalt, [x, 2.8 + silo * 0.275, -10.2], true, 20); torus(root, `ENVSCI__E7__SILO_PERFORATED_SCREEN_${silo + 1}`, 1.62, 0.08, m.paleCeramic, [x, 4.4 + silo * 0.55, -10.2], [Math.PI / 2, 0, 0], Math.PI * 2, false, 6, 24); }
  for (let line = 0; line < 7; line += 1) pipe(root, `ENVSCI__E7__VISIBLE_PROCESS_LINE_${line + 1}`, new THREE.Vector3(-8.2 + line * 2.7, 3.8, 0.1), new THREE.Vector3(-5.4 + line % 3 * 5.4, 4.2 + line % 2 * 0.5, -8.8), 0.09, line % 2 ? m.titanium : m.weatheredSteel);
  for (let bed = 0; bed < 10; bed += 1) box(root, `ENVSCI__E7__BASALT_WEATHERING_BED_${bed + 1}`, [1.35, 0.35, 2.2], bed % 2 ? m.darkBasalt : m.soil, [-8.4 + bed * 1.85, 0.18, 9.3]);
  cylinder(root, 'ENVSCI__E7__EMISSIONS_ACCOUNTING_MAST', 0.28, 7.2, m.titanium, [10.4, 3.6, 1.2], false, 12);
  for (let metric = 0; metric < 4; metric += 1) pulse(box(root, `ENVSCI__E7__NET_CARBON_LEDGER_${metric + 1}`, [1.45, 0.24, 0.12], [m.green, m.amber, m.white, m.cyan][metric].clone(), [10.4, 2.1 + metric * 0.55, 1.05]), 0.0015, metric * 0.7, 0.03, 1.25);
  return root;
}

function createAnthropocene(m: Materials) {
  const root = new THREE.Group(); root.name = 'ENVSCI__E8__ANTHROPOCENE_FORENSICS_CENTRE';
  roundedBox(root, 'ENVSCI__E8__SEALED_BLACK_RECYCLED_GLASS_MONOLITH', [18.2, 3.7, 9.6], 0.35, m.blackGlassCeramic, [0, 1.9, 0], true);
  for (let fissure = 0; fissure < 5; fissure += 1) { const x = -6.4 + fissure * 3.2; box(root, `ENVSCI__E8__ENVIRONMENTAL_PATHWAY_FISSURE_${fissure + 1}`, [0.36, 3.35, 0.16], fissure % 2 ? m.glass : m.paleCeramic, [x, 1.9, 4.88]); for (let transfer = 0; transfer < 3; transfer += 1) pulse(sphere(root, `ENVSCI__E8__SEALED_SAMPLE_TRANSFER_${fissure + 1}_${transfer + 1}`, [0.08, 0.08, 0.04], [m.white, m.cyan, m.amber, m.green, m.white][fissure].clone(), [x, 0.9 + transfer * 0.82, 4.98]), 0.002, fissure * 0.31 + transfer * 0.2, 0.02, 0.9); }
  for (let band = 0; band < 6; band += 1) box(root, `ENVSCI__E8__CONTAMINATION_CONTROL_FORECOURT_BAND_${band + 1}`, [16.4 - band * 1.65, 0.06, 1.0], [m.paving, m.porous, m.titanium, m.glass, m.paleCeramic, m.carbonate][band], [0, 0.04 + band * 0.004, 6.0 + band * 0.92]);
  for (let bay = 0; bay < 7; bay += 1) { const x = -7.5 + bay * 2.5; box(root, `ENVSCI__E8__SEALED_SAMPLE_RECEIVING_BAY_${bay + 1}`, [1.8, 1.6, 0.65], m.darkBasalt, [x, 1.05, -5.1], true); box(root, `ENVSCI__E8__INDEPENDENT_RECEIVING_CANOPY_${bay + 1}`, [2.1, 0.14, 1.35], m.titanium, [x, 2.0, -5.35]); }
  for (let row = 0; row < 6; row += 1) for (let col = 0; col < 12; col += 1) { const x = -7.7 + col * 1.4; const z = -3.4 + row * 1.25; cylinder(root, `ENVSCI__E8__SAMPLER_CROWN_COLLECTOR_${row + 1}_${col + 1}`, 0.18 + (row + col) % 3 * 0.04, 0.65 + (row * 12 + col) % 4 * 0.12, (row + col) % 4 ? m.titanium : m.white, [x, 4.05 + (row * 12 + col) % 4 * 0.06, z], false, 8); }
  box(root, 'ENVSCI__E8__RECTANGULAR_EXHAUST_TOWER', [2.0, 7.0, 2.0], m.blackGlassCeramic, [-10.1, 3.5, -2.2], true);
  for (let ring = 0; ring < 5; ring += 1) torus(root, `ENVSCI__E8__REDUNDANT_EXHAUST_SAMPLING_RING_${ring + 1}`, 1.2, 0.07, ring % 2 ? m.titanium : m.white, [-10.1, 2.0 + ring * 1.15, -2.2], [Math.PI / 2, 0, 0], Math.PI * 2, false, 5, 24);
  for (let cell = 0; cell < 12; cell += 1) box(root, `ENVSCI__E8__PARTITIONED_SOURCE_WATER_CELL_${cell + 1}`, [1.3, 0.18, 2.2], m.water, [-7.5 + cell * 1.36, 0.06, -7.3]);
  return root;
}

function createResilience(m: Materials) {
  const root = new THREE.Group(); root.name = 'ENVSCI__E9__CLIMATE_RESILIENCE_PROVING_HOUSE';
  box(root, 'ENVSCI__E9__REINFORCED_TEST_SPINE', [22.0, 3.4, 4.2], m.darkBasalt, [0, 1.7, 0], true);
  const bayMaterials = [m.weatheredSteel, m.mineralConcrete, m.paleCeramic, m.titanium, m.carbonate, m.rammedEarth];
  for (let bay = 0; bay < 12; bay += 1) { const x = -9.9 + bay * 1.8; box(root, `ENVSCI__E9__REPLACEABLE_FACADE_TEST_BAY_${bay + 1}`, [1.55, 2.7 + bay % 3 * 0.28, 0.42], bayMaterials[bay % bayMaterials.length], [x, 1.55 + bay % 3 * 0.14, 2.34], true, [0, 0, bay % 4 === 0 ? 0.045 : 0]); cylinder(root, `ENVSCI__E9__VISIBLE_LIFTING_LUG_${bay + 1}`, 0.16, 0.45, m.titanium, [x, 3.35 + bay % 3 * 0.28, 2.36], false, 8, [Math.PI / 2, 0, 0]); }
  for (let pylon = 0; pylon < 2; pylon += 1) { const x = pylon ? 8.6 : -8.6; torus(root, `ENVSCI__E9__CURVED_STORM_FRAME_PYLON_${pylon + 1}`, 4.0, 0.3, m.weatheredSteel, [x, 3.8, -6.4], [0, 0, 0], Math.PI, true, 8, 26); }
  box(root, 'ENVSCI__E9__TRAVELLING_STORM_SIMULATOR_RAIL', [19.2, 0.18, 0.28], m.titanium, [0, 0.12, -10.0]);
  for (let fan = 0; fan < 8; fan += 1) { const x = -7.7 + fan * 2.2; torus(root, `ENVSCI__E9__STORM_WALL_FAN_${fan + 1}`, 0.62, 0.12, m.titanium, [x, 3.3 + fan % 2 * 1.35, -6.4], [0, 0, 0], Math.PI * 2, false, 6, 24); const blades = rotate(new THREE.Group(), 0.06 + fan * 0.003, 'z'); blades.name = `ENVSCI__E9__STORM_FAN_ROTOR_${fan + 1}`; blades.position.set(x, 3.3 + fan % 2 * 1.35, -6.35); for (let blade = 0; blade < 5; blade += 1) box(blades, `ENVSCI__E9__STORM_FAN_BLADE_${fan + 1}_${blade + 1}`, [0.08, 0.9, 0.05], m.paleCeramic, [0, 0.38, 0], false, [0, 0, blade / 5 * Math.PI * 2]); root.add(blades); }
  box(root, 'ENVSCI__E9__FLOODABLE_URBAN_PLAZA', [18.5, 0.08, 6.2], m.water, [0, 0.04, 7.4]);
  for (let escape = 0; escape < 3; escape += 1) box(root, `ENVSCI__E9__RAISED_FLOOD_ESCAPE_PATH_${escape + 1}`, [1.15, 0.22, 6.4], m.paving, [-6.0 + escape * 6.0, 0.16, 7.4]);
  box(root, 'ENVSCI__E9__HEAT_CANYON_DARK_WALL', [9.2, 3.3, 0.45], m.blackGlassCeramic, [-5.3, 1.65, -11.0]);
  box(root, 'ENVSCI__E9__HEAT_CANYON_PALE_WALL', [9.2, 3.3, 0.45], m.paleCeramic, [5.3, 1.65, -11.0]);
  for (let sensor = 0; sensor < 9; sensor += 1) cylinder(root, `ENVSCI__E9__HEAT_CANYON_SENSOR_${sensor + 1}`, 0.1, 1.5, sensor % 2 ? m.amber : m.white, [-8.0 + sensor * 2.0, 0.75, -9.0], false, 8);
  return root;
}

function createGaia(m: Materials) {
  const root = new THREE.Group(); root.name = 'ENVSCI__E10__GAIA_FIELD_SYSTEMS_FLEETWORKS';
  box(root, 'ENVSCI__E10__NORTHERN_BOOMERANG_HANGAR_ARM', [7.6, 2.9, 15.8], m.darkBasalt, [-5.2, 1.45, -1.0], true, [0, -0.52, 0]);
  box(root, 'ENVSCI__E10__SOUTHERN_BOOMERANG_HANGAR_ARM', [7.6, 2.9, 15.8], m.darkBasalt, [5.2, 1.45, -1.0], true, [0, 0.52, 0]);
  box(root, 'ENVSCI__E10__PROTECTED_LAUNCH_COURT', [9.8, 0.08, 10.2], m.porous, [0, 0.05, 4.0]);
  for (let door = 0; door < 12; door += 1) { const x = -8.2 + door * 1.48; box(root, `ENVSCI__E10__INDEPENDENT_FOLDING_HANGAR_DOOR_${door + 1}`, [1.18, 2.25, 0.16], door % 2 ? m.titanium : m.glass, [x, 1.25, 8.8], true, [0, (door - 5.5) * 0.025, 0]); }
  for (let pad = 0; pad < 8; pad += 1) { const x = -7.2 + pad % 4 * 4.8; const z = -5.8 + Math.floor(pad / 4) * 3.8; cylinder(root, `ENVSCI__E10__ROOF_DRONE_LANDING_PAD_${pad + 1}`, 2.2, 0.12, m.photovoltaic, [x, 3.1, z], false, 24); torus(root, `ENVSCI__E10__LANDING_PAD_GUIDE_${pad + 1}`, 0.75, 0.06, pad % 2 ? m.green : m.amber, [x, 3.18, z], [Math.PI / 2, 0, 0], Math.PI * 2, false, 5, 24); }
  for (let aperture = 0; aperture < 16; aperture += 1) box(root, `ENVSCI__E10__SENSOR_DRONE_LAUNCH_APERTURE_${aperture + 1}`, [0.48, 0.45, 0.65], m.blackGlassCeramic, [-9.1 + aperture % 8 * 0.82, 1.4 + Math.floor(aperture / 8) * 0.78, -7.0 + aperture % 3 * 0.22], false, [0, -0.52, 0]);
  for (let lane = 0; lane < 4; lane += 1) { box(root, `ENVSCI__E10__PHOTOVOLTAIC_CHARGING_CANOPY_${lane + 1}`, [2.0, 0.14, 5.8], m.photovoltaic, [6.4 + lane * 1.25, 2.1, 5.0 - lane * 0.6], false, [0, 0.52, 0]); for (let plate = 0; plate < 3; plate += 1) box(root, `ENVSCI__E10__INDUCTIVE_CHARGING_PLATE_${lane + 1}_${plate + 1}`, [1.1, 0.04, 1.25], m.cyan, [5.2 + lane * 1.25, 0.05, 3.2 + plate * 1.5 - lane * 0.6]); }
  const mast = new THREE.Group(); mast.name = 'ENVSCI__E10__MULTI_BAND_COMMUNICATIONS_MAST'; mast.position.set(0, 0, 3.2);
  for (let leg = 0; leg < 3; leg += 1) { const angle = leg / 3 * Math.PI * 2; pipe(mast, `ENVSCI__E10__COMMUNICATION_MAST_LEG_${leg + 1}`, new THREE.Vector3(Math.sin(angle) * 1.4, 0, Math.cos(angle) * 1.4), new THREE.Vector3(0, 6.1, 0), 0.11, m.titanium); }
  [3.0, 4.4, 5.65].forEach((height, index) => rotate(torus(mast, `ENVSCI__E10__ROTATING_ANTENNA_RING_${index + 1}`, 1.1 + index * 0.3, 0.07, index % 2 ? m.white : m.titanium, [0, height, 0], [Math.PI / 2, 0, 0], Math.PI * 2, false, 5, 30), 0.025 + index * 0.008));
  sphere(mast, 'ENVSCI__E10__OFF_CENTER_RADOME', [0.75, 0.75, 0.75], m.fluoropolymer, [0.45, 6.4, -0.1]); root.add(mast);
  const calibrationMaterials = [m.white, m.blackGlassCeramic, m.carbonate, m.weatheredSteel, m.vegetation, m.photovoltaic];
  for (let row = 0; row < 4; row += 1) for (let col = 0; col < 8; col += 1) box(root, `ENVSCI__E10__REMOTE_SENSING_CALIBRATION_PANEL_${row + 1}_${col + 1}`, [0.82, 0.56, 0.08], calibrationMaterials[(row * 8 + col) % calibrationMaterials.length], [-3.0 + col * 0.88, 0.8 + row * 0.63, -8.85]);
  for (let silo = 0; silo < 6; silo += 1) cylinder(root, `ENVSCI__E10__NATIVE_SEED_DISPENSER_${silo + 1}`, 0.8, 2.2 + silo % 3 * 0.35, silo % 2 ? m.weatheredSteel : m.carbonate, [-10.2 + silo * 1.55, 1.1 + silo % 3 * 0.175, 9.3], true, 12);
  box(root, 'ENVSCI__E10__AMPHIBIOUS_VEHICLE_CANAL', [2.2, 0.16, 10.8], m.water, [8.5, 0.03, -6.6]);
  return root;
}

function assignBuildingMetadata(root: THREE.Group, record: EnvironmentalBuildingProgram) {
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

function createBuilding(record: EnvironmentalBuildingProgram, materials: Materials) {
  const factories: Record<EnvironmentalBuildingForm, (materials: Materials) => THREE.Group> = {
    tellus: createTellus,
    aeolian: createAeolian,
    hydrological: createHydrological,
    littoral: createLittoral,
    biotic: createBiotic,
    'critical-zone': createCriticalZone,
    'carbon-foundry': createCarbonFoundry,
    anthropocene: createAnthropocene,
    resilience: createResilience,
    'gaia-fleetworks': createGaia,
  };
  return assignBuildingMetadata(factories[record.form](materials), record);
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radialMargin = 10.5; const angularMargin = (sector.endAngle - sector.startAngle) * 0.22;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT);
  const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
  return new THREE.Vector3(Math.cos(angle) * radius - definition.position[0], y, Math.sin(angle) * radius - definition.position[2]);
}

function districtSpine(definition: DistrictDefinition, angularT: number, startRadialT: number, endRadialT: number, segments: number, y = FLOOR_Y) {
  return Array.from({ length: segments }, (_, index) => pointInDistrict(definition, THREE.MathUtils.lerp(startRadialT, endRadialT, index / (segments - 1)), angularT, y));
}

function makeRibbonGeometry(points: readonly THREE.Vector3[], width: number) {
  const vertices: number[] = []; const indices: number[] = [];
  points.forEach((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5); vertices.push(point.x + normal.x, point.y, point.z + normal.z, point.x - normal.x, point.y, point.z - normal.z); if (index < points.length - 1) { const base = index * 2; indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); } });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function addRibbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, mat: THREE.Material, walkable = true) {
  const value = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), mat), name); value.userData.walkable = walkable; value.userData.navObstacle = false; value.userData.environmentalScienceRoute = true; value.receiveShadow = true; parent.add(value); return value;
}

function offsetPath(points: readonly THREE.Vector3[], offset: number, y = FLOOR_Y + 0.025) {
  return points.map((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); return point.clone().add(new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(offset)).setY(y); });
}

function addDistrictInfrastructure(district: THREE.Group, definition: DistrictDefinition, m: Materials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'ENVSCI__LIVING_TRANSECT_INFRASTRUCTURE';
  const transect = districtSpine(definition, 0.5, 0.015, 0.985, 156);
  addRibbon(infrastructure, 'ENVSCI__TRANSECT_WALK', transect, 2.4, m.paving);
  addRibbon(infrastructure, 'ENVSCI__RECESSED_AUTONOMOUS_UTILITY_ROUTE', offsetPath(transect, -3.6, FLOOR_Y - 0.06), 1.55, m.porous, false);
  addRibbon(infrastructure, 'ENVSCI__VISIBLE_STORMWATER_CHANNEL', offsetPath(transect, 1.35), 0.42, m.water, false);
  const elevatedNorth = offsetPath(transect.slice(18, 137), -1.45, 0.74); const elevatedSouth = offsetPath(transect.slice(18, 137), 1.45, 0.74);
  addRibbon(infrastructure, 'ENVSCI__COVERED_RESEARCH_WALKWAY_NORTH', elevatedNorth, 0.72, m.titanium, false);
  addRibbon(infrastructure, 'ENVSCI__COVERED_RESEARCH_WALKWAY_SOUTH', elevatedSouth, 0.72, m.titanium, false);
  for (let support = 0; support < 24; support += 1) { const index = Math.floor(support / 23 * (elevatedNorth.length - 1)); [elevatedNorth[index], elevatedSouth[index]].forEach((point, side) => cylinder(infrastructure, `ENVSCI__ELEVATED_WALKWAY_PIER_${side + 1}_${support + 1}`, 0.12, 0.72, m.darkBasalt, [point.x, 0.36, point.z], true, 8)); }
  for (let station = 0; station < 18; station += 1) {
    const index = Math.floor((station + 0.5) / 18 * (transect.length - 1)); const point = transect[index];
    const previous = transect[Math.max(0, index - 1)]; const next = transect[Math.min(transect.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize();
    const gaugePoint = point.clone().add(new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(station % 2 ? 1.65 : -1.65));
    cylinder(infrastructure, `ENVSCI__TRANSECT_DATA_GAUGE_${station + 1}`, 0.12, 1.15, m.titanium, [gaugePoint.x, 0.58, gaugePoint.z], false, 8);
    pulse(box(infrastructure, `ENVSCI__TRANSECT_STATUS_LIGHT_${station + 1}`, [0.14, 0.08, 0.06], [m.amber, m.cyan, m.green][station % 3].clone(), [gaugePoint.x, 1.18, gaugePoint.z]), 0.0018, station * 0.25, 0.02, 0.75);
  }
  district.add(infrastructure); return { infrastructure, transect };
}

function addDistrictLandscape(district: THREE.Group, definition: DistrictDefinition, m: Materials) {
  const landscape = new THREE.Group(); landscape.name = 'ENVSCI__INSTRUMENTED_EXPERIMENTAL_LANDSCAPE';
  const bands = [
    { radial: 0.84, mat: m.wetland, prefix: 'SALT_TOLERANT_COASTAL_PLOT' },
    { radial: 0.68, mat: m.water, prefix: 'INSTRUMENTED_WETLAND_BASIN' },
    { radial: 0.50, mat: m.vegetation, prefix: 'LONG_TERM_ECOLOGICAL_OBSERVATION_ZONE' },
    { radial: 0.34, mat: m.soil, prefix: 'CLIMATE_CONTROLLED_SOIL_PLOT' },
    { radial: 0.16, mat: m.darkBasalt, prefix: 'MINERAL_WEATHERING_BED' },
  ];
  bands.forEach((band, bandIndex) => { for (let plot = 0; plot < 8; plot += 1) { const angularT = 0.31 + plot / 7 * 0.38; const point = pointInDistrict(definition, band.radial, angularT, FLOOR_Y + 0.012); box(landscape, `ENVSCI__${band.prefix}_${plot + 1}`, [2.8 + plot % 3 * 0.35, 0.12 + (bandIndex === 1 ? 0.03 : 0), 1.9], band.mat, [point.x, point.y, point.z], false, [0, plot * 0.21, 0]); if (bandIndex < 4) cylinder(landscape, `ENVSCI__PLOT_SENSOR_${bandIndex + 1}_${plot + 1}`, 0.08, 0.72, plot % 2 ? m.titanium : m.white, [point.x + 1.15, 0.36, point.z + 0.68], false, 8); } });
  for (let collector = 0; collector < 24; collector += 1) { const point = pointInDistrict(definition, collector % 2 ? 0.42 : 0.58, 0.27 + Math.floor(collector / 2) / 11 * 0.46); cylinder(landscape, `ENVSCI__AEROSOL_DEPOSITION_COLLECTOR_${collector + 1}`, 0.19, 0.9 + collector % 4 * 0.22, m.titanium, [point.x, 0.45 + collector % 4 * 0.11, point.z], false, 8); }
  for (let target = 0; target < 12; target += 1) { const point = pointInDistrict(definition, 0.11, 0.30 + target / 11 * 0.40); box(landscape, `ENVSCI__SATELLITE_DRONE_CALIBRATION_TARGET_${target + 1}`, [1.0, 0.04, 1.0], [m.white, m.blackGlassCeramic, m.carbonate, m.photovoltaic][target % 4], [point.x, FLOOR_Y + 0.018, point.z], false, [0, target * 0.18, 0]); }
  district.add(landscape); return landscape;
}

export function buildEnvironmentalScienceLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Environmental Science Labs District requires a masterplan sector');
  const materials = createMaterials();
  const { infrastructure, transect } = addDistrictInfrastructure(district, definition, materials);
  const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = ENVIRONMENTAL_SCIENCE_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials); const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02); building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT };
    district.add(building); return building;
  });
  facilities.forEach((facility, index) => {
    const record = ENVIRONMENTAL_SCIENCE_BUILDING_PROGRAM[index]; const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, Math.min(10.5, record.footprintMetres[1] / 20 + 1.0)); const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const routePoint = transect.reduce((closest, point) => point.distanceToSquared(entrance) < closest.distanceToSquared(entrance) ? point : closest, transect[0]); const dogleg = routePoint.clone().lerp(entrance, 0.52); dogleg.x += index % 2 ? 0.35 : -0.35;
    addRibbon(infrastructure, `ENVSCI__BUILDING_APPROACH_${record.code}`, [routePoint, dogleg, entrance], 0.92, materials.paving);
    pulse(addRibbon(infrastructure, `ENVSCI__BUILDING_APPROACH_GAUGE_${record.code}`, offsetPath([routePoint, dogleg, entrance], index % 2 ? 0.27 : -0.27), 0.04, [materials.cyan, materials.amber, materials.green, materials.white][index % 4].clone(), false), 0.0022, index * 0.37, 0.02, 0.9);
  });
  district.userData.environmentalScienceLabsDistrict = {
    identity: 'Environmental Science Labs District — The Living Transect',
    mapLabel: 'Environmental Science Labs',
    architecturalLanguage: 'buildings as enlarged scientific instruments operating across ocean, atmosphere, water, soil, ecosystems, contaminants, carbon, climate adaptation, robotics, and planetary modelling',
    buildingCount: facilities.length,
    buildings: ENVIRONMENTAL_SCIENCE_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, subtitle: record.subtitle, focus: record.focus, scientificSequence: record.sequence, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorSignature: record.exteriorSignature })),
    scientificSequence: [...ENVIRONMENTAL_SCIENCE_BUILDING_PROGRAM].sort((left, right) => left.sequence - right.sequence).map((record) => record.name),
    circulation: { primaryRoute: 'ENVSCI__TRANSECT_WALK', coveredResearchWalkways: 2, recessedUtilityRoute: 'ENVSCI__RECESSED_AUTONOMOUS_UTILITY_ROUTE', visibleStormwaterChannel: true, exactBuildingApproaches: 10 },
    signatureSystems: { tellusContourRings: 3, aeolianInstrumentHalos: 5, hydrologicalTerraces: 7, littoralTidalBasins: 6, bioticBranches: 4, criticalZoneCoreTowers: 6, carbonCaptureTowers: 6, anthropocenePathwayFissures: 5, resilienceFacadeBays: 12, gaiaLandingPads: 8 },
    landscapes: { coastalPlots: 8, wetlandBasins: 8, ecologicalObservationZones: 8, soilPlots: 8, mineralWeatheringBeds: 8, aerosolCollectors: 24, calibrationTargets: 12 },
    darkSkyProtocol: { wildlifeSafeLighting: true, shieldedLowLevelLighting: true, upwardAdvertisingLight: false, activeInstrumentLightsOnly: true },
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: ENVIRONMENTAL_SCIENCE_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: ['Transect Walk', 'covered elevated research walkways', 'recessed utility route', 'instrumented wetlands', 'climate-controlled soil plots', 'atmospheric sensor fields', 'long-term ecological observation zones', 'mineral weathering beds', 'aerosol collectors', 'satellite calibration targets'],
    realizedFeatureTags: ENVIRONMENTAL_SCIENCE_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 13,
    radialCoverage: 0.97,
    angularCoverage: 0.69,
    exteriorOnly: true,
    livingTransectNarrative: true,
    westToEastScientificSequence: true,
    darkSkyCompliant: true,
  };
}
