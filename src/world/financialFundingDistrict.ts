import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

const DISTRICT_ID = 'financial-funding';
const FLOOR_Y = 0.008;

export type FinancialFundingZone = 'capital-crescent' | 'funding-spine' | 'confluence-grounds';

export interface FinancialFundingBuildingProgram {
  code: string;
  name: string;
  purpose: string;
  zone: FinancialFundingZone;
  form: string;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  exteriorSignature: string;
}

export const FINANCIAL_FUNDING_BUILDING_PROGRAM: readonly FinancialFundingBuildingProgram[] = [
  { code: 'F01', name: 'The Aequitas Exchange', purpose: 'Research securities, institutional bonds, resource contracts, and long-term technology investment', zone: 'capital-crescent', form: 'three-interlocked-slab exchange tower', footprintMetres: [150, 116], heightMetres: 198, radialT: 0.78, angularT: 0.23, exteriorSignature: 'three balancing ledger slabs, elliptical contour plaza, titanium cantilever, transparent partnership pylons, and open artificial-horizon crown' },
  { code: 'F02', name: 'Meridian Research Bank', purpose: 'Project escrow, infrastructure finance, research payroll, and long-duration capital management', zone: 'capital-crescent', form: 'offset monolithic instrument bank', footprintMetres: [185, 112], heightMetres: 48, radialT: 0.43, angularT: 0.19, exteriorSignature: 'grooved basalt lower stratum, floating bronze-glass upper volume, golden shadow incision, reflecting pool, steel world sphere, and photovoltaic fin canopy' },
  { code: 'F03', name: 'Venture Prism', purpose: 'Venture capital, startup financing, prototype showcases, and researcher-commercial meetings', zone: 'capital-crescent', form: 'faceted dichroic crystal tower', footprintMetres: [138, 120], heightMetres: 151, radialT: 0.72, angularT: 0.08, exteriorSignature: 'leaning crystalline facets, black investment-graph seams, empty silhouette fins, transparent showcase podium, fractured canopy, and retractable prototype plinths' },
  { code: 'F04', name: 'Helix Grant House', purpose: 'Public grants, fellowships, emergency research finance, and independent investigator support', zone: 'funding-spine', form: 'paired civic double-helix wings', footprintMetres: [224, 128], heightMetres: 37, radialT: 0.24, angularT: 0.39, exteriorSignature: 'two pale ceramic spiral wings, through-garden, glowing molecular bridges, branching canopy columns, memorial pools, and planted alpine roof ribbons' },
  { code: 'F05', name: 'The Patent Lantern', purpose: 'Patent registration, licensing, technology transfer, open-license coordination, and partnership brokerage', zone: 'funding-spine', form: 'double-skin cylindrical archive lantern', footprintMetres: [126, 126], heightMetres: 88, radialT: 0.60, angularT: 0.37, exteriorSignature: 'luminous milky inner cylinder, perforated technical-notation shell, peeled page entrances, mirrored aperture vanes, water ramp, and ownership-network plaza' },
  { code: 'F06', name: 'Black Swan Risk Tower', purpose: 'Insurance and reinsurance for hazardous research and catastrophic project failure', zone: 'funding-spine', form: 'backward-leaning matte-black risk blade', footprintMetres: [114, 108], heightMetres: 162, radialT: 0.84, angularT: 0.47, exteriorSignature: 'absorptive black leaning blade, shock-wave buttresses, fragmented red probability curves, sunken storm plaza, folded-wing canopy, swan abstraction, and visible weather crown' },
  { code: 'F07', name: 'The Impact Ledger', purpose: 'Climate finance, biodiversity investment, restoration bonds, and social-impact accounting', zone: 'funding-spine', form: 'paired terraced ecological ledgers', footprintMetres: [194, 132], heightMetres: 78, radialT: 0.25, angularT: 0.55, exteriorSignature: 'green and silver setback towers, six micro-landscape terraces, five copper-mesh garden bridges, expressed irrigation, duration displays, and vertical material ledger' },
  { code: 'F08', name: 'Patron Constellation Hall', purpose: 'Philanthropic foundations, scientific patronage, prizes, endowments, and fundraising events', zone: 'capital-crescent', form: 'fissured black constellation dome', footprintMetres: [174, 148], heightMetres: 43, radialT: 0.19, angularT: 0.07, exteriorSignature: 'blue-black titanium dome, curved luminous fissures, satellite volumes and passages, fibre-optic program sky, alabaster crescents, circular pool, and anonymous bronze patron strips' },
  { code: 'F09', name: 'Sovereign Science Fund Forum', purpose: 'Multinational funding agreements, treaty funds, and scientific-development initiatives', zone: 'confluence-grounds', form: 'stone-fin circular assembly forum', footprintMetres: [188, 188], heightMetres: 49, radialT: 0.22, angularT: 0.69, exteriorSignature: 'equal multicolour stone fins around glazed drum, kinetic delegation rings, inward roof aperture, suspended artificial moon, ceremonial avenue, and permanent public debate tables' },
  { code: 'F10', name: 'The Clearing Vault', purpose: 'Transaction clearing, distributed records, identity verification, archives, and high-value data custody', zone: 'funding-spine', form: 'elevated encryption-matrix cube', footprintMetres: [128, 128], heightMetres: 94, radialT: 0.63, angularT: 0.59, exteriorSignature: 'deep metallic cell matrix, electrochromic calculation waves, illuminated cut corners, pale dry moat, four narrow bridges, disguised scanners, and shielded synchronization dish' },
  { code: 'F11', name: 'Astra Confluence Convention Centre', purpose: 'Flagship congresses, funding summits, product presentations, public exhibitions, and international conventions', zone: 'confluence-grounds', form: 'vast open crescent convention landmark', footprintMetres: [305, 194], heightMetres: 58, radialT: 0.49, angularT: 0.77, exteriorSignature: 'open crescent, gravitational-wave photovoltaic roof, permeable fin facade, three immense branching portals, configurable park terraces, and northern luminous roof arc' },
  { code: 'F12', name: 'The Modular Congress Yards', purpose: 'Trade fairs, technology expos, laboratory-equipment exhibitions, and industrial demonstrations', zone: 'confluence-grounds', form: 'six reconfigurable trussed congress halls', footprintMetres: [286, 190], heightMetres: 39, radialT: 0.80, angularT: 0.84, exteriorSignature: 'six halls with sawtooth, barrel, folded, dome, terrace, and technical roofs; exposed trusses and rails; numbered canopy; visible ordered freight court; and rain gardens' },
  { code: 'F13', name: 'The Delegate Spire', purpose: 'Visiting delegation offices, conference chairs, negotiators, and intergovernmental missions', zone: 'confluence-grounds', form: 'restrained torsion delegation tower', footprintMetres: [118, 108], heightMetres: 154, radialT: 0.23, angularT: 0.93, exteriorSignature: 'stacked reversing floor rotations, pale treaty-page fins, restrained identity bands, displaced illuminated colonnade, secure landscape terraces, hovering eastern room, and Alpine-aligned beacon' },
  { code: 'F14', name: 'The Arbitration Basilica', purpose: 'Contract arbitration, IP disputes, funding mediation, ethics hearings, and international scientific-commercial law', zone: 'funding-spine', form: 'repaired-seam civic basilica', footprintMetres: [224, 126], heightMetres: 52, radialT: 0.84, angularT: 0.63, exteriorSignature: 'long pale civic mass, dark visible-repair seams, empty black threshold frame, opposing roof fins and unresolved light gap, formal side gardens, and concentric public rulings forum' },
  { code: 'F15', name: 'Chronos Futures Observatory', purpose: 'Long-range forecasting, roadmaps, prediction markets, scenario modelling, and convention closing sessions', zone: 'capital-crescent', form: 'disc-crowned futures observatory', footprintMetres: [152, 152], heightMetres: 109, radialT: 0.17, angularT: 0.25, exteriorSignature: 'bronze-lined mirrored tower, vast shadow disc, branching underside timelines, long-duration display ring, twelve-domain radial plaza, framed real-sky void, and rotating sensor rings' },
];

function material(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  const value = new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.22, ...options });
  value.name = name;
  return value;
}

function createMaterials() {
  return {
    basalt: material('Finance black basalt', '#11161a', { roughness: 0.94, metalness: 0.06 }),
    graphiteGlass: material('Finance graphite glass', '#172734', { roughness: 0.2, metalness: 0.56 }),
    smokedGlass: material('Finance smoked silver glass', '#445966', { roughness: 0.18, metalness: 0.42 }),
    clearGlass: material('Finance low-iron structural glass', '#a9e8ef', { roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.62, depthWrite: true }),
    milkyGlass: material('Finance milky translucent composite', '#d9f5f2', { roughness: 0.3, metalness: 0.04, emissive: '#8fe9e5', emissiveIntensity: 0.18 }),
    paleStone: material('Finance pale engineered stone', '#d5d5cd', { roughness: 0.84, metalness: 0.02 }),
    ceramic: material('Finance satin ceramic', '#ecebe2', { roughness: 0.64, metalness: 0.04 }),
    titanium: material('Finance brushed titanium', '#a9b5b9', { roughness: 0.3, metalness: 0.9 }),
    darkMetal: material('Finance dark perforated metal', '#20272d', { roughness: 0.46, metalness: 0.86 }),
    blackMetal: material('Finance matte black metal', '#07090c', { roughness: 0.78, metalness: 0.44 }),
    bronze: material('Finance pale bronze', '#aa8152', { roughness: 0.34, metalness: 0.84 }),
    copper: material('Finance weathering copper', '#8f5a3b', { roughness: 0.5, metalness: 0.72 }),
    dichroicBlue: material('Finance dichroic blue violet glass', '#3159a7', { roughness: 0.16, metalness: 0.62, emissive: '#13215c', emissiveIntensity: 0.24 }),
    dichroicCopper: material('Finance dichroic copper green glass', '#648b79', { roughness: 0.17, metalness: 0.62, emissive: '#5d2c45', emissiveIntensity: 0.22 }),
    greenGlass: material('Finance ecological pale green glass', '#779f8c', { roughness: 0.24, metalness: 0.31 }),
    foliage: material('Finance formal dark foliage', '#26483c', { roughness: 0.94, metalness: 0.01 }),
    alpine: material('Finance alpine roof vegetation', '#668262', { roughness: 0.96, metalness: 0.01 }),
    silverGrass: material('Finance silver ornamental grass', '#9eaaa2', { roughness: 0.88, metalness: 0.12 }),
    water: material('Finance reflected water', '#173c4a', { roughness: 0.14, metalness: 0.16, transparent: true, opacity: 0.7, depthWrite: false }),
    goldLight: material('Finance institutional gold light', '#ffd58b', { roughness: 0.18, metalness: 0.03, emissive: '#ff9d2b', emissiveIntensity: 3.2 }),
    whiteLight: material('Finance civic white light', '#e8ffff', { roughness: 0.16, metalness: 0.02, emissive: '#a9edff', emissiveIntensity: 3.1 }),
    cyanLight: material('Finance data cyan light', '#62e8ff', { roughness: 0.14, metalness: 0.03, emissive: '#0bb9e4', emissiveIntensity: 3.8 }),
    violetLight: material('Finance venture violet light', '#ba7eff', { roughness: 0.14, metalness: 0.03, emissive: '#742be1', emissiveIntensity: 3.8 }),
    riskLight: material('Finance risk red orange light', '#ff6b3d', { roughness: 0.16, metalness: 0.03, emissive: '#ee2b09', emissiveIntensity: 4.1 }),
  };
}

type Materials = ReturnType<typeof createMaterials>;

function prepare<T extends THREE.Object3D>(object: T, name: string, obstacle = false) {
  object.name = name;
  object.userData.selectableId = DISTRICT_ID;
  object.userData.districtId = DISTRICT_ID;
  object.userData.navObstacle = obstacle;
  if (object instanceof THREE.Mesh) {
    object.castShadow = true;
    object.receiveShadow = true;
  }
  return object;
}

function box(parent: THREE.Object3D, name: string, size: readonly [number, number, number], mat: THREE.Material, position: readonly [number, number, number], obstacle = false, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const value = prepare(new THREE.Mesh(new THREE.BoxGeometry(...size), mat), name, obstacle);
  value.position.set(...position);
  value.rotation.set(...rotation);
  parent.add(value);
  return value;
}

function cylinder(parent: THREE.Object3D, name: string, diameter: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 24, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const value = prepare(new THREE.Mesh(new THREE.CylinderGeometry(diameter * 0.5, diameter * 0.5, height, segments), mat), name, obstacle);
  value.position.set(...position);
  value.rotation.set(...rotation);
  parent.add(value);
  return value;
}

function sphere(parent: THREE.Object3D, name: string, scale: readonly [number, number, number], mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 20) {
  const value = prepare(new THREE.Mesh(new THREE.SphereGeometry(0.5, segments, Math.max(10, Math.floor(segments * 0.6))), mat), name, obstacle);
  value.scale.set(...scale);
  value.position.set(...position);
  parent.add(value);
  return value;
}

function dome(parent: THREE.Object3D, name: string, radius: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false) {
  const value = prepare(new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), mat), name, obstacle);
  value.position.set(...position);
  parent.add(value);
  return value;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, mat: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0], arc = Math.PI * 2, segments = 48) {
  const value = prepare(new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 7, segments, arc), mat), name);
  value.position.set(...position);
  value.rotation.set(...rotation);
  parent.add(value);
  return value;
}

function pipe(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, radius: number, mat: THREE.Material, obstacle = false) {
  const direction = end.clone().sub(start);
  const value = prepare(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 8), mat), name, obstacle);
  value.position.copy(start).add(end).multiplyScalar(0.5);
  value.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  parent.add(value);
  return value;
}

function pulse<T extends THREE.Object3D>(object: T, speed: number, phase = 0, minimum = 0.2, maximum = 3.8) {
  object.userData.animate = 'financial-emissive-pulse';
  object.userData.speed = speed;
  object.userData.phase = phase;
  object.userData.minIntensity = minimum;
  object.userData.maxIntensity = maximum;
  return object;
}

function rotate<T extends THREE.Object3D>(object: T, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'financial-rotation';
  object.userData.speed = speed;
  object.userData.axis = axis;
  return object;
}

function taperedGeometry(width: number, depth: number, height: number, topScale = 0.78, shearX = 0, shearZ = 0) {
  const x = width * 0.5;
  const z = depth * 0.5;
  const tx = x * topScale;
  const tz = z * topScale;
  const vertices = new Float32Array([
    -x, 0, -z, x, 0, -z, x, 0, z, -x, 0, z,
    -tx + shearX, height, -tz + shearZ, tx + shearX, height, -tz + shearZ,
    tx + shearX, height, tz + shearZ, -tx + shearX, height, tz + shearZ,
  ]);
  const indices = [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function tapered(parent: THREE.Object3D, name: string, width: number, depth: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, topScale = 0.78, shearX = 0, shearZ = 0) {
  const value = prepare(new THREE.Mesh(taperedGeometry(width, depth, height, topScale, shearX, shearZ), mat), name, obstacle);
  value.position.set(...position);
  parent.add(value);
  return value;
}

const signTextureCache = new Map<string, THREE.CanvasTexture>();

function signTexture(text: string, color: string) {
  const key = `${text}|${color}`;
  const cached = signTextureCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext('2d')!;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '600 88px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowColor = color;
  context.shadowBlur = 24;
  context.fillStyle = color;
  context.fillText(text, 512, 132, 960);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  signTextureCache.set(key, texture);
  return texture;
}

function sign(parent: THREE.Object3D, name: string, text: string, width: number, position: readonly [number, number, number], color = '#dff9ff') {
  const mat = new THREE.MeshBasicMaterial({ map: signTexture(text, color), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  mat.name = `Finance integrated sign ${text}`;
  const value = prepare(new THREE.Mesh(new THREE.PlaneGeometry(width, Math.max(0.38, width * 0.16)), mat), name);
  value.position.set(...position);
  value.renderOrder = 8;
  value.userData.signText = text;
  parent.add(value);
  return value;
}

function tree(parent: THREE.Object3D, name: string, x: number, z: number, m: Materials, scale = 1) {
  cylinder(parent, `${name}__TRUNK`, 0.2 * scale, 1.65 * scale, m.darkMetal, [x, 0.825 * scale, z]);
  sphere(parent, `${name}__DARK_LEAVED_CROWN`, [1.05 * scale, 1.65 * scale, 1.05 * scale], m.foliage, [x, 2 * scale, z]);
}

function addAequitas(root: THREE.Group, m: Materials) {
  cylinder(root, 'FINANCE__F01__ELLIPTICAL_BASALT_PLAZA', 12.8, 0.12, m.paleStone, [0, 0.06, 0], false, 48).scale.z = 0.68;
  for (let ring = 0; ring < 6; ring += 1) {
    const contour = torus(root, `FINANCE__F01__TOPOGRAPHIC_PLAZA_RING_${ring + 1}`, 2.8 + ring * 0.72, 0.045, ring % 2 ? m.basalt : m.titanium, [0, 0.14 + ring * 0.002, 0]);
    contour.scale.z = 0.68;
  }
  const left = tapered(root, 'FINANCE__F01__GRAPHITE_BALANCE_SLAB', 4.5, 4.2, 17.2, m.graphiteGlass, [-2.3, 0.14, 0], true, 0.86, 0.45, 0);
  left.rotation.z = -0.035;
  const right = tapered(root, 'FINANCE__F01__CERAMIC_BALANCE_SLAB', 4.2, 4, 16.3, m.ceramic, [2.15, 0.14, 0.15], true, 0.9, -0.34, 0);
  right.rotation.z = 0.045;
  tapered(root, 'FINANCE__F01__TRANSPARENT_LEDGER_CORE', 3.5, 4.8, 18.5, m.clearGlass, [0, 0.14, -0.1], true, 0.82, 0.12, 0);
  for (let level = 0; level < 17; level += 1) {
    const band = box(root, `FINANCE__F01__LEDGER_DATA_BAND_${level + 1}`, [3.65 + (level % 3) * 0.22, 0.055, 4.88], level % 4 ? m.cyanLight : m.goldLight, [0.15 + level * 0.006, 0.72 + level * 0.96, -0.08]);
    pulse(band, 0.11 + (level % 5) * 0.012, level * 0.42, 0.18, 4.1);
  }
  box(root, 'FINANCE__F01__FORTY_METRE_TITANIUM_CANTILEVER', [4.8, 0.34, 3.6], m.titanium, [0, 1.28, 3.45]);
  for (let pylon = 0; pylon < 4; pylon += 1) {
    const x = pylon < 2 ? -3.2 : 3.2;
    const z = pylon % 2 ? 3.85 : 2.55;
    for (let blockIndex = 0; blockIndex < 5; blockIndex += 1) {
      box(root, `FINANCE__F01__PARTNERSHIP_PYLON_${pylon + 1}_SYMBOL_BLOCK_${blockIndex + 1}`, [0.52, 0.48, 0.52], m.clearGlass, [x, 0.4 + blockIndex * 0.52, z]);
      const symbol = [m.goldLight, m.cyanLight, m.whiteLight, m.violetLight, m.riskLight][blockIndex];
      sphere(root, `FINANCE__F01__PARTNERSHIP_SYMBOL_${pylon + 1}_${blockIndex + 1}`, [0.14, 0.14, 0.14], symbol, [x, 0.4 + blockIndex * 0.52, z]);
    }
  }
  for (const x of [-2.2, 2.2]) box(root, `FINANCE__F01__OPEN_CROWN_VERTICAL_${x < 0 ? 'WEST' : 'EAST'}`, [0.28, 2.1, 4.6], m.titanium, [x, 18.55, 0]);
  for (const z of [-2.15, 2.15]) box(root, `FINANCE__F01__OPEN_CROWN_RAIL_${z < 0 ? 'NORTH' : 'SOUTH'}`, [4.7, 0.26, 0.28], m.titanium, [0, 19.45, z]);
  pulse(box(root, 'FINANCE__F01__ARTIFICIAL_HORIZON', [4.35, 0.075, 0.11], m.whiteLight, [0, 18.6, 0]), 0.08, 0, 1.4, 4.2);
  sign(root, 'FINANCE__F01__INTEGRATED_SIGN', 'AEQUITAS', 3.4, [0, 1.72, 4.83]);
}

function addMeridian(root: THREE.Group, m: Materials) {
  box(root, 'FINANCE__F02__MACHINED_BASALT_MONOLITH', [14.8, 2.5, 7.7], m.basalt, [0, 1.25, -0.2], true);
  box(root, 'FINANCE__F02__GOLDEN_SHADOW_INCISION', [14.25, 0.18, 7.82], m.goldLight, [0.35, 2.68, -0.2]);
  box(root, 'FINANCE__F02__FLOATING_BRONZE_GLASS_VOLUME', [14.2, 2.35, 7.5], m.smokedGlass, [0.45, 3.94, -0.2], true);
  for (let groove = 0; groove < 28; groove += 1) box(root, `FINANCE__F02__MEASUREMENT_GROOVE_${groove + 1}`, [0.035, 1.95, 0.06], groove % 7 ? m.darkMetal : m.goldLight, [-6.7 + groove * 0.5, 1.28, 3.68]);
  for (let fissure = 0; fissure < 5; fissure += 1) box(root, `FINANCE__F02__AMBER_GLASS_FISSURE_${fissure + 1}`, [0.13, 2.1 + fissure * 0.15, 0.08], m.goldLight, [-5.4 + fissure * 2.7, 1.38, 3.72]);
  box(root, 'FINANCE__F02__RECTANGULAR_REFLECTING_POOL', [9.8, 0.035, 2.35], m.water, [0, 0.045, 5.55]);
  sphere(root, 'FINANCE__F02__LEVITATING_STEEL_WORLD', [1.25, 1.25, 1.25], m.titanium, [0, 0.82, 5.55]);
  for (let fin = 0; fin < 24; fin += 1) box(root, `FINANCE__F02__PHOTOVOLTAIC_BRONZE_FIN_${fin + 1}`, [0.42, 0.12, 8.2], fin % 2 ? m.bronze : m.darkMetal, [-6.9 + fin * 0.6, 5.25 + Math.sin(fin * 0.3) * 0.08, -0.15], false, [0, 0, (fin - 12) * 0.006]);
  sign(root, 'FINANCE__F02__INTEGRATED_SIGN', 'MERIDIAN RESEARCH BANK', 5.2, [0, 3.85, 3.63], '#ffd69b');
}

function addVenturePrism(root: THREE.Group, m: Materials) {
  box(root, 'FINANCE__F03__TRANSPARENT_SHOWCASE_PODIUM', [11.4, 2.35, 7.8], m.clearGlass, [0, 1.18, 0.4], true);
  const facetA = tapered(root, 'FINANCE__F03__DICHROIC_CRYSTAL_FACET_BLUE', 6.4, 5.2, 13.2, m.dichroicBlue, [-0.5, 2.22, -0.2], true, 0.58, 0.82, -0.25);
  facetA.rotation.z = -0.035;
  const facetB = tapered(root, 'FINANCE__F03__DICHROIC_CRYSTAL_FACET_COPPER_GREEN', 4.9, 5.6, 12.2, m.dichroicCopper, [1.1, 2.22, 0.05], true, 0.64, -0.55, 0.38);
  facetB.rotation.z = 0.045;
  for (let seam = 0; seam < 11; seam += 1) {
    const y = 3.1 + seam * 1.02;
    pipe(root, `FINANCE__F03__INVESTMENT_GRAPH_SEAM_${seam + 1}`, new THREE.Vector3(-3 + (seam % 3) * 0.4, y, 2.72), new THREE.Vector3(2.8 - (seam % 4) * 0.32, y + 0.68, 2.72), 0.035, m.blackMetal);
  }
  for (let fin = 0; fin < 5; fin += 1) {
    const blade = tapered(root, `FINANCE__F03__EMPTY_SILHOUETTE_FIN_${fin + 1}`, 0.22, 2.3, 7 + fin * 0.8, fin % 2 ? m.dichroicCopper : m.dichroicBlue, [-3.6 + fin * 1.75, 5 + fin * 0.36, -0.65], false, 0.2, (fin - 2) * 0.2, 0);
    blade.rotation.z = (fin - 2) * 0.06;
  }
  for (let canopy = 0; canopy < 9; canopy += 1) box(root, `FINANCE__F03__OVERLAPPING_TRIANGULAR_CANOPY_${canopy + 1}`, [2.2 + canopy % 3 * 0.45, 0.12, 2.1], canopy % 2 ? m.titanium : m.darkMetal, [-4.2 + canopy * 1.05, 2.58 + canopy % 2 * 0.18, 3.55], false, [0.08 * (canopy % 3 - 1), (canopy - 4) * 0.13, (canopy % 2 ? 1 : -1) * 0.09]);
  pulse(box(root, 'FINANCE__F03__ILLUMINATED_ENTRANCE_FRACTURE', [0.09, 0.04, 5.3], m.violetLight, [0, 0.14, 4.55]), 0.16, 0.2, 0.3, 4.4);
  for (let plinth = 0; plinth < 6; plinth += 1) {
    const x = -4.5 + plinth * 1.8;
    box(root, `FINANCE__F03__RETRACTABLE_PROTOTYPE_PLINTH_${plinth + 1}`, [1.2, 0.24, 1.2], m.basalt, [x, 0.12, 5.8]);
    sphere(root, `FINANCE__F03__PROTOTYPE_DISPLAY_${plinth + 1}`, [0.62, 0.34 + plinth % 2 * 0.16, 0.62], plinth % 2 ? m.titanium : m.dichroicCopper, [x, 0.48, 5.8]);
  }
  sign(root, 'FINANCE__F03__INTEGRATED_SIGN', 'VENTURE PRISM', 4, [0, 1.52, 4.34], '#d49aff');
}

function addHelix(root: THREE.Group, m: Materials) {
  for (const side of [-1, 1]) {
    for (let segment = 0; segment < 13; segment += 1) {
      const t = segment / 12;
      const z = -6.1 + t * 12.2;
      const x = side * (3.1 + Math.sin(t * Math.PI * 2) * 1.45);
      const nextT = Math.min(1, (segment + 1) / 12);
      const nextX = side * (3.1 + Math.sin(nextT * Math.PI * 2) * 1.45);
      const angle = Math.atan2(nextX - x, 1.02);
      box(root, `FINANCE__F04__CERAMIC_HELIX_WING_${side < 0 ? 'WEST' : 'EAST'}_${segment + 1}`, [3.35, 2.65, 1.18], m.ceramic, [x, 1.35, z], true, [0, angle, 0]);
      box(root, `FINANCE__F04__ALPINE_ROOF_RIBBON_${side < 0 ? 'WEST' : 'EAST'}_${segment + 1}`, [3.05, 0.16, 1.02], m.alpine, [x, 2.75, z], false, [0, angle, 0]);
    }
  }
  for (let bridgeIndex = 0; bridgeIndex < 4; bridgeIndex += 1) {
    const z = -4.2 + bridgeIndex * 2.8;
    const xOffset = Math.sin((bridgeIndex / 3) * Math.PI * 2) * 1.45;
    pulse(box(root, `FINANCE__F04__MOLECULAR_BOND_BRIDGE_${bridgeIndex + 1}`, [6.2 - Math.abs(xOffset) * 0.4, 0.42, 0.9], m.milkyGlass, [0, 2.75, z]), 0.1, bridgeIndex * 0.8, 0.2, 2.8);
  }
  for (let columnIndex = 0; columnIndex < 12; columnIndex += 1) {
    const side = columnIndex % 2 ? 1 : -1;
    const z = -5.4 + Math.floor(columnIndex / 2) * 2.15;
    const base = new THREE.Vector3(side * 5.3, 0.1, z);
    const joint = new THREE.Vector3(side * 5.05, 1.4, z);
    pipe(root, `FINANCE__F04__BRANCHING_CANOPY_COLUMN_${columnIndex + 1}`, base, joint, 0.075, m.ceramic);
    pipe(root, `FINANCE__F04__BRANCHING_CANOPY_COLUMN_${columnIndex + 1}_A`, joint, new THREE.Vector3(side * 5.65, 2.4, z - 0.5), 0.055, m.ceramic);
    pipe(root, `FINANCE__F04__BRANCHING_CANOPY_COLUMN_${columnIndex + 1}_B`, joint, new THREE.Vector3(side * 4.65, 2.4, z + 0.5), 0.055, m.ceramic);
  }
  box(root, 'FINANCE__F04__PUBLIC_THROUGH_GARDEN', [4.8, 0.08, 12.8], m.alpine, [0, 0.04, 0]);
  for (let poolIndex = 0; poolIndex < 6; poolIndex += 1) box(root, `FINANCE__F04__OVERLOOKED_RESEARCH_MEMORIAL_POOL_${poolIndex + 1}`, [1.1, 0.035, 1.45], m.water, [5.35, 0.05, -5 + poolIndex * 2]);
  sign(root, 'FINANCE__F04__INTEGRATED_SIGN', 'HELIX GRANT HOUSE', 4.8, [0, 1.8, 6.68]);
}

function addPatentLantern(root: THREE.Group, m: Materials) {
  cylinder(root, 'FINANCE__F05__LUMINOUS_INNER_ARCHIVE', 7.25, 8.1, m.milkyGlass, [0, 4.05, 0], true, 40);
  for (let panel = 0; panel < 28; panel += 1) {
    const angle = panel / 28 * Math.PI * 2;
    const peel = panel === 6 || panel === 7 || panel === 8 || panel === 20 ? 1.25 : 0;
    const radius = 4.25 + peel;
    const plate = box(root, `FINANCE__F05__PERFORATED_NOTATION_PANEL_${panel + 1}`, [0.78, 7.5, 0.16], m.darkMetal, [Math.cos(angle) * radius, 4.08, Math.sin(angle) * radius], false, [0, -angle, panel === 7 ? -0.14 : 0]);
    plate.userData.perforatedTechnicalNotation = true;
    plate.userData.symbolFamilies = ['circuits', 'molecules', 'mechanisms', 'equations', 'seeds', 'waves', 'historical patents'];
    for (let cut = 0; cut < 3; cut += 1) {
      const light = sphere(root, `FINANCE__F05__TECHNICAL_SYMBOL_APERTURE_${panel + 1}_${cut + 1}`, [0.11, 0.11, 0.08], cut % 2 ? m.goldLight : m.cyanLight, [Math.cos(angle) * (radius + 0.1), 1.65 + cut * 2.35 + (panel % 3) * 0.15, Math.sin(angle) * (radius + 0.1)]);
      pulse(light, 0.07 + cut * 0.012, panel * 0.25 + cut);
    }
  }
  box(root, 'FINANCE__F05__PROCESSIONAL_RAMP', [3.4, 0.12, 5.8], m.paleStone, [0, 0.06, 5.3]);
  for (const side of [-1, 1]) box(root, `FINANCE__F05__DARK_WATER_STRIP_${side < 0 ? 'WEST' : 'EAST'}`, [0.62, 0.035, 5.8], m.water, [side * 2.05, 0.045, 5.3]);
  torus(root, 'FINANCE__F05__ROOF_APERTURE', 2.1, 0.22, m.titanium, [0, 8.35, 0]);
  for (let vane = 0; vane < 12; vane += 1) {
    const angle = vane / 12 * Math.PI * 2;
    const plate = box(root, `FINANCE__F05__ADJUSTABLE_MIRRORED_VANE_${vane + 1}`, [1.7, 0.08, 0.5], m.titanium, [Math.cos(angle) * 2.7, 8.52, Math.sin(angle) * 2.7], false, [0.1, -angle, 0.18]);
    plate.userData.daylightRedirector = true;
  }
  for (let network = 0; network < 12; network += 1) {
    const angle = network / 12 * Math.PI * 2;
    pipe(root, `FINANCE__F05__OWNERSHIP_NETWORK_LINE_${network + 1}`, new THREE.Vector3(Math.cos(angle) * 4.8, 0.12, Math.sin(angle) * 4.8), new THREE.Vector3(Math.cos(angle + (network % 2 ? 0.4 : -0.35)) * 6.25, 0.12, Math.sin(angle + (network % 2 ? 0.4 : -0.35)) * 6.25), 0.035, m.bronze);
  }
  sign(root, 'FINANCE__F05__INTEGRATED_SIGN', 'PATENT LANTERN', 3.8, [0, 2.1, 4.24], '#ffe1a5');
}

function addBlackSwan(root: THREE.Group, m: Materials) {
  cylinder(root, 'FINANCE__F06__SUNKEN_RISK_PLAZA', 10.6, 0.22, m.basalt, [0, -0.11, 0], false, 48);
  for (let drain = 0; drain < 16; drain += 1) {
    const angle = drain / 16 * Math.PI * 2;
    pipe(root, `FINANCE__F06__RADIAL_STORM_DRAIN_${drain + 1}`, new THREE.Vector3(Math.cos(angle) * 1.8, 0.02, Math.sin(angle) * 1.8), new THREE.Vector3(Math.cos(angle) * 5.1, 0.02, Math.sin(angle) * 5.1), 0.035, m.titanium);
  }
  const tower = tapered(root, 'FINANCE__F06__MATTE_BLACK_LEANING_RISK_BLADE', 5.3, 4.4, 15.6, m.blackMetal, [-0.4, 0.1, -0.5], true, 0.52, 0, -2.15);
  tower.rotation.x = -0.055;
  for (let buttress = 0; buttress < 9; buttress += 1) {
    const angle = -Math.PI * 0.92 + buttress / 8 * Math.PI * 0.84;
    const inner = new THREE.Vector3(Math.cos(angle) * 1.8, 0.1, 1.6 + Math.sin(angle) * 1.35);
    const outer = new THREE.Vector3(Math.cos(angle) * (4.6 + buttress % 2 * 0.55), 0.1, 1.6 + Math.sin(angle) * (4.2 + buttress % 2 * 0.55));
    pipe(root, `FINANCE__F06__FROZEN_SHOCK_WAVE_BUTTRESS_${buttress + 1}`, outer, inner.clone().setY(4.2 - Math.abs(buttress - 4) * 0.32), 0.17, m.blackMetal, true);
  }
  for (let segment = 0; segment < 14; segment += 1) {
    const y = 2.2 + segment * 0.83;
    const x = Math.sin(segment * 0.82) * 1.55;
    const width = 0.55 + (segment % 4) * 0.28;
    pulse(box(root, `FINANCE__F06__FRAGMENTED_PROBABILITY_CURVE_${segment + 1}`, [width, 0.07, 0.07], m.riskLight, [x, y, 2.18 - y * 0.025], false, [0, 0, Math.cos(segment * 0.75) * 0.18]), 0.08 + (segment % 3) * 0.015, segment * 0.6, 0.1, 4.3);
  }
  const wing = box(root, 'FINANCE__F06__HEAVY_FOLDED_WING_CANOPY', [5.4, 0.38, 3.5], m.blackMetal, [0.35, 1.05, 3.8], false, [-0.12, 0, 0]);
  box(wing, 'FINANCE__F06__CLINICAL_WHITE_CANOPY_UNDERSIDE', [5.0, 0.06, 3.15], m.whiteLight, [0, -0.22, 0]);
  torus(root, 'FINANCE__F06__ABSTRACT_SWAN_NECK', 0.72, 0.08, m.titanium, [-3.5, 0.88, 4.15], [0, Math.PI * 0.5, 0], Math.PI * 1.35, 28);
  box(root, 'FINANCE__F06__ABSTRACT_SWAN_WING', [1.25, 0.09, 0.5], m.titanium, [-3.0, 0.7, 4.15], false, [0, -0.22, 0.36]);
  box(root, 'FINANCE__F06__BLADE_OBSERVATION_CROWN', [3.4, 0.42, 4.2], m.graphiteGlass, [-2.25, 15.35, -0.55], false, [0, 0, -0.08]);
  for (let sensor = 0; sensor < 7; sensor += 1) pipe(root, `FINANCE__F06__VISIBLE_WEATHER_SENSOR_${sensor + 1}`, new THREE.Vector3(-3.5 + sensor * 0.45, 15.58, -0.7), new THREE.Vector3(-3.5 + sensor * 0.45, 16.15 + sensor % 3 * 0.26, -0.7), 0.025, m.titanium);
  sign(root, 'FINANCE__F06__INTEGRATED_SIGN', 'BLACK SWAN RISK', 4.2, [0, 1.56, 4.12], '#ff7954');
}

function addImpactLedger(root: THREE.Group, m: Materials) {
  const towerXs = [-4.2, 4.2];
  towerXs.forEach((towerX, towerIndex) => {
    for (let terrace = 0; terrace < 6; terrace += 1) {
      const width = 6.1 - terrace * 0.55;
      const depth = 7.2 - terrace * 0.38;
      const height = 1.22;
      const xShift = towerIndex ? -terrace * 0.16 : terrace * 0.16;
      box(root, `FINANCE__F07__${towerIndex ? 'SMOKY_SILVER' : 'PALE_GREEN'}_TERRACE_${terrace + 1}`, [width, height, depth], towerIndex ? m.smokedGlass : m.greenGlass, [towerX + xShift, 0.61 + terrace * 1.24, -terrace * 0.1], true);
      const gardenMaterials = [m.water, m.foliage, m.silverGrass, m.alpine, m.paleStone, m.foliage];
      box(root, `FINANCE__F07__MICRO_LANDSCAPE_${towerIndex + 1}_${terrace + 1}`, [Math.max(1, width - 0.4), 0.12, 1.05], gardenMaterials[terrace], [towerX + xShift, 1.29 + terrace * 1.24, depth * 0.5 - terrace * 0.19 - 0.55]);
      box(root, `FINANCE__F07__EXPRESSED_IRRIGATION_CHANNEL_${towerIndex + 1}_${terrace + 1}`, [0.06, 1.1, 0.06], m.titanium, [towerX + xShift + width * 0.42, 0.62 + terrace * 1.24, depth * 0.5 - terrace * 0.19]);
    }
  });
  for (let bridge = 0; bridge < 5; bridge += 1) {
    const y = 1.85 + bridge * 1.24;
    box(root, `FINANCE__F07__GLASS_GARDEN_BRIDGE_${bridge + 1}`, [5.3, 0.42, 1.15], m.clearGlass, [0, y, -1.15 + (bridge % 2) * 2.3]);
    for (let meshLine = 0; meshLine < 5; meshLine += 1) pipe(root, `FINANCE__F07__COPPER_RIVER_MESH_${bridge + 1}_${meshLine + 1}`, new THREE.Vector3(-2.5, y + 0.25, -1.62 + (bridge % 2) * 2.3 + meshLine * 0.2), new THREE.Vector3(2.5, y + 0.25 + Math.sin(meshLine) * 0.12, -1.62 + (bridge % 2) * 2.3 + meshLine * 0.2), 0.025, m.copper);
  }
  box(root, 'FINANCE__F07__PUBLIC_DURATION_PROMENADE', [12.9, 0.1, 2.1], m.paleStone, [0, 0.05, 4.7]);
  for (let display = 0; display < 8; display += 1) {
    const ring = torus(root, `FINANCE__F07__RESTORATION_DURATION_DISPLAY_${display + 1}`, 0.42, 0.055, display % 2 ? m.cyanLight : m.goldLight, [-5.25 + display * 1.5, 0.13, 4.7]);
    ring.userData.durationYears = 12 + display * 17;
  }
  const ledgerMaterials = [m.titanium, m.clearGlass, m.alpine, m.paleStone, m.darkMetal, m.ceramic];
  for (let panel = 0; panel < 6; panel += 1) {
    const materialPanel = box(root, `FINANCE__F07__MATERIAL_LEDGER_PANEL_${panel + 1}`, [0.85, 0.92, 0.12], ledgerMaterials[panel], [-2.25 + panel * 0.9, 0.6, 3.7]);
    materialPanel.userData.environmentalCostDisclosed = true;
  }
  sign(root, 'FINANCE__F07__INTEGRATED_SIGN', 'IMPACT LEDGER', 4, [0, 1.36, 3.76]);
}

function addPatronHall(root: THREE.Group, m: Materials) {
  cylinder(root, 'FINANCE__F08__PARTIAL_CIRCULAR_POOL', 14.1, 0.04, m.water, [0, 0.035, 0], false, 48);
  cylinder(root, 'FINANCE__F08__DOME_ISLAND', 11.7, 0.12, m.basalt, [0, 0.08, 0], false, 48);
  dome(root, 'FINANCE__F08__BLUE_BLACK_TITANIUM_DOME', 5.15, m.blackMetal, [0, 0.15, 0], true);
  for (let panel = 0; panel < 9; panel += 1) {
    const angle = panel / 9 * Math.PI * 2;
    const fibre = pulse(sphere(root, `FINANCE__F08__FUNDED_PROGRAM_STAR_${panel + 1}`, [0.13, 0.13, 0.13], panel % 3 ? m.whiteLight : m.goldLight, [Math.cos(angle) * (2.5 + panel % 2), 3.9 + Math.sin(angle * 2) * 0.7, Math.sin(angle) * (2.5 + panel % 2)]), 0.045 + panel * 0.003, panel * 0.6, 0.25, 4.2);
    fibre.userData.accumulatedProgramLight = true;
  }
  for (let fissure = 0; fissure < 5; fissure += 1) {
    const angle = -1.1 + fissure * 0.55;
    torus(root, `FINANCE__F08__CURVED_GLASS_FISSURE_${fissure + 1}`, 4.95, 0.075, m.cyanLight, [0, 0.18, 0], [Math.PI * 0.5, angle, 0], Math.PI * 0.48, 32);
  }
  for (let satellite = 0; satellite < 5; satellite += 1) {
    const angle = satellite / 5 * Math.PI * 2 + 0.2;
    const radius = 7.4;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    cylinder(root, `FINANCE__F08__SATELLITE_VOLUME_${satellite + 1}`, 2.45, 1.35, satellite % 2 ? m.graphiteGlass : m.darkMetal, [x, 0.72, z], true, 24);
    pipe(root, `FINANCE__F08__ENCLOSED_CONSTELLATION_PASSAGE_${satellite + 1}`, new THREE.Vector3(Math.cos(angle) * 4.75, 0.82, Math.sin(angle) * 4.75), new THREE.Vector3(Math.cos(angle) * 6.25, 0.82, Math.sin(angle) * 6.25), 0.28, m.clearGlass);
  }
  for (const side of [-1, 1]) {
    const crescent = torus(root, `FINANCE__F08__ALABASTER_ENTRANCE_CRESCENT_${side < 0 ? 'WEST' : 'EAST'}`, 2.25, 0.18, m.milkyGlass, [side * 1.25, 1.15, 4.95], [0, 0, side * Math.PI * 0.5], Math.PI * 0.72, 30);
    pulse(crescent, 0.055, side, 0.35, 2.8);
  }
  for (let strip = 0; strip < 12; strip += 1) box(root, `FINANCE__F08__ANONYMOUS_BRONZE_PATRON_STRIP_${strip + 1}`, [0.62, 0.035, 0.08], m.bronze, [-4.1 + strip * 0.75, 0.14, 6.0]);
  sign(root, 'FINANCE__F08__INTEGRATED_SIGN', 'PATRON CONSTELLATION HALL', 5.6, [0, 1.62, 5.0], '#ffe1aa');
}

function addSovereignForum(root: THREE.Group, m: Materials) {
  cylinder(root, 'FINANCE__F09__LOW_GLAZED_ASSEMBLY_DRUM', 11.2, 2.8, m.clearGlass, [0, 1.4, 0], true, 42);
  const stonePalette = ['#e4e1d8', '#899293', '#4d5554', '#8a4d3a', '#677467', '#bd9c78'];
  const partnerStoneMaterials = stonePalette.map((color, index) => material(
    `Finance partner-region stone ${index + 1}`,
    color,
    { roughness: 0.86, metalness: 0.03 },
  ));
  for (let fin = 0; fin < 24; fin += 1) {
    const angle = fin / 24 * Math.PI * 2;
    const finMat = partnerStoneMaterials[fin % partnerStoneMaterials.length];
    box(root, `FINANCE__F09__EQUAL_PARTNER_STONE_FIN_${fin + 1}`, [0.48, 4.5, 1.35], finMat, [Math.cos(angle) * 6.8, 2.25, Math.sin(angle) * 6.8], true, [0, -angle + fin * 0.012, 0]);
  }
  cylinder(root, 'FINANCE__F09__INWARD_SLOPING_ROOF', 10.5, 0.28, m.titanium, [0, 2.92, 0], false, 40);
  torus(root, 'FINANCE__F09__ROOF_LIGHT_APERTURE', 1.28, 0.13, m.whiteLight, [0, 3.08, 0]);
  pulse(cylinder(root, 'FINANCE__F09__VERTICAL_LIGHT_BEAM', 0.13, 4.1, m.whiteLight, [0, 5.05, 0]), 0.06, 0, 1.2, 4.3);
  cylinder(root, 'FINANCE__F09__SUSPENDED_ARTIFICIAL_MOON', 3.2, 0.16, m.titanium, [0, 7.15, 0], false, 36);
  box(root, 'FINANCE__F09__CEREMONIAL_AVENUE', [4.8, 0.1, 8.8], m.paleStone, [0, 0.05, 9.35]);
  for (let pole = 0; pole < 10; pole += 1) {
    const side = pole % 2 ? 1 : -1;
    const z = 5.7 + Math.floor(pole / 2) * 1.8;
    cylinder(root, `FINANCE__F09__KINETIC_DELEGATION_POLE_${pole + 1}`, 0.12, 3.2, m.titanium, [side * 3.3, 1.6, z]);
    const ring = rotate(torus(root, `FINANCE__F09__KINETIC_DELEGATION_RING_${pole + 1}`, 0.55, 0.06, pole % 3 ? m.cyanLight : m.goldLight, [side * 3.3, 2.65 + pole % 3 * 0.25, z], [Math.PI * 0.5, pole * 0.3, 0]), 0.016 * side, pole % 2 ? 'z' : 'x');
    ring.userData.windResponsive = true;
  }
  for (let table = 0; table < 5; table += 1) box(root, `FINANCE__F09__PERMANENT_PUBLIC_DEBATE_TABLE_${table + 1}`, [3.2, 0.18, 0.8], m.paleStone, [-5.2 + table * 2.6, 0.56, -7.2]);
  sign(root, 'FINANCE__F09__INTEGRATED_SIGN', 'SOVEREIGN SCIENCE FUND FORUM', 6, [0, 1.74, 5.62], '#edfaff');
}

function addClearingVault(root: THREE.Group, m: Materials) {
  box(root, 'FINANCE__F10__PALE_DRY_MOAT', [12.5, 0.16, 12.5], m.paleStone, [0, 0.01, 0]);
  box(root, 'FINANCE__F10__RECESSED_BASE', [7.4, 1.0, 7.4], m.basalt, [0, 0.5, 0], true);
  box(root, 'FINANCE__F10__ELEVATED_CUBE_CORE', [8.2, 7.9, 8.2], m.blackMetal, [0, 4.95, 0], true);
  for (let corner = 0; corner < 4; corner += 1) {
    const x = corner < 2 ? -4.02 : 4.02;
    const z = corner % 2 ? -4.02 : 4.02;
    pulse(box(root, `FINANCE__F10__ILLUMINATED_CUT_CORNER_${corner + 1}`, [0.28, 7.6, 0.28], m.whiteLight, [x, 4.95, z]), 0.05, corner * 0.8, 0.8, 3.6);
  }
  for (let face = 0; face < 4; face += 1) {
    for (let row = 0; row < 6; row += 1) {
      for (let column = 0; column < 6; column += 1) {
        const offset = -3.25 + column * 1.3;
        const y = 1.78 + row * 1.27;
        const frontBack = face < 2;
        const positive = face % 2 === 0;
        const position: [number, number, number] = frontBack ? [offset, y, positive ? 4.18 : -4.18] : [positive ? 4.18 : -4.18, y, offset];
        const cell = box(root, `FINANCE__F10__ENCRYPTION_CELL_${face + 1}_${row + 1}_${column + 1}`, frontBack ? [1.05, 0.92, 0.18] : [0.18, 0.92, 1.05], (row + column + face) % 5 ? m.smokedGlass : m.graphiteGlass, position);
        cell.userData.electrochromicState = (row + column + face) % 3;
        if ((row * 6 + column + face) % 8 === 0) pulse(cell, 0.035 + face * 0.004, row * 0.5 + column * 0.2, 0.1, 1.6);
      }
    }
  }
  for (let bridge = 0; bridge < 4; bridge += 1) {
    const angle = bridge * Math.PI * 0.5;
    box(root, `FINANCE__F10__CONTROLLED_MOAT_BRIDGE_${bridge + 1}`, bridge % 2 ? [6, 0.14, 1.05] : [1.05, 0.14, 6], m.titanium, [Math.cos(angle) * 4.75, 0.16, Math.sin(angle) * 4.75]);
  }
  box(root, 'FINANCE__F10__DISGUISED_SCANNING_FRAME_TOP', [2.35, 0.18, 0.18], m.titanium, [0, 2.3, 6.45]);
  for (const x of [-1.08, 1.08]) box(root, `FINANCE__F10__DISGUISED_SCANNING_FRAME_${x < 0 ? 'WEST' : 'EAST'}`, [0.18, 2.25, 0.18], m.titanium, [x, 1.18, 6.45]);
  dome(root, 'FINANCE__F10__TRANSPARENT_GEODESIC_DISH_SHIELD', 1.15, m.clearGlass, [0, 9.02, 0]);
  rotate(torus(root, 'FINANCE__F10__SYNCHRONIZATION_DISH', 0.72, 0.1, m.titanium, [0, 9.38, 0], [Math.PI * 0.35, 0, 0]), 0.012, 'y');
  sign(root, 'FINANCE__F10__INTEGRATED_SIGN', 'CLEARING VAULT', 3.8, [0, 1.62, 4.28]);
}

function addAstraConfluence(root: THREE.Group, m: Materials) {
  for (let segment = 0; segment < 19; segment += 1) {
    const t = segment / 18;
    const angle = THREE.MathUtils.lerp(-1.08, 1.08, t);
    const radius = 11.2;
    const x = Math.sin(angle) * radius;
    const z = -Math.cos(angle) * radius + 5.2;
    const crest = 3.4 + Math.pow(1 - Math.abs(t - 0.5) * 2, 1.5) * 2.4;
    box(root, `FINANCE__F11__TRANSPARENT_CRESCENT_BAY_${segment + 1}`, [2.5, crest - 0.4, 5.4], m.clearGlass, [x, (crest - 0.4) * 0.5, z], true, [0, angle, 0]);
    const roof = box(root, `FINANCE__F11__GRAVITATIONAL_WAVE_ROOF_${segment + 1}`, [2.72, 0.28, 5.85], segment % 4 ? m.titanium : m.graphiteGlass, [x, crest, z], false, [Math.sin((t - 0.5) * Math.PI) * 0.08, angle, 0]);
    roof.userData.photovoltaicGlass = segment % 4 === 0;
    for (let fin = 0; fin < 3; fin += 1) box(root, `FINANCE__F11__PERMEABLE_VERTICAL_FIN_${segment + 1}_${fin + 1}`, [0.1, crest - 0.7, 0.46], fin % 2 ? m.titanium : m.milkyGlass, [x + Math.cos(angle) * (fin - 1) * 0.65, (crest - 0.7) * 0.5, z + Math.sin(angle) * (fin - 1) * 0.65 + 2.75], false, [0, angle, 0]);
  }
  for (let portal = 0; portal < 3; portal += 1) {
    const x = -8 + portal * 8;
    box(root, `FINANCE__F11__IMMENSE_ENTRANCE_PORTAL_TOP_${portal + 1}`, [5.2, 0.38, 3.8 + (portal === 1 ? 3.5 : 0)], m.titanium, [x, 4.25 + (portal === 1 ? 0.8 : 0), 11.2 + (portal === 1 ? 1.4 : 0)], false, [-0.08, 0, 0]);
    for (const side of [-1, 1]) {
      const base = new THREE.Vector3(x + side * 2, 0, 10.4);
      const joint = new THREE.Vector3(x + side * 1.75, 2.3, 10.9);
      pipe(root, `FINANCE__F11__BRANCHING_PORTAL_COLUMN_${portal + 1}_${side < 0 ? 'WEST' : 'EAST'}_TRUNK`, base, joint, 0.11, m.ceramic);
      pipe(root, `FINANCE__F11__BRANCHING_PORTAL_COLUMN_${portal + 1}_${side < 0 ? 'WEST' : 'EAST'}_BRANCH`, joint, new THREE.Vector3(x + side * 2.5, 4.15 + (portal === 1 ? 0.8 : 0), 11.2), 0.08, m.ceramic);
    }
  }
  for (let terrace = 0; terrace < 5; terrace += 1) box(root, `FINANCE__F11__CONFIGURABLE_CONVENTION_PARK_TERRACE_${terrace + 1}`, [24 - terrace * 2.2, 0.12, 2.1], terrace % 2 ? m.paleStone : m.alpine, [0, 0.06 + terrace * 0.1, 14.5 + terrace * 1.7]);
  const arc = torus(root, 'FINANCE__F11__NORTHERN_LUMINOUS_ROOF_ARC', 11.45, 0.11, m.whiteLight, [0, 5.76, 5.2], [Math.PI * 0.5, 0, 0], Math.PI * 1.2, 72);
  arc.scale.z = 0.46;
  pulse(arc, 0.045, 0, 1.4, 4.4);
  sign(root, 'FINANCE__F11__CENTRAL_EVENT_SIGN', 'ASTRA CONFLUENCE', 6.4, [0, 3.08, 10.95]);
}

function addCongressYards(root: THREE.Group, m: Materials) {
  const hallPositions: readonly [number, number][] = [[-8.8, -5.4], [0, -5.4], [8.8, -5.4], [-8.8, 5.4], [0, 5.4], [8.8, 5.4]];
  hallPositions.forEach(([x, z], index) => {
    const hall = prepare(new THREE.Group(), `FINANCE__F12__RECONFIGURABLE_HALL_${index + 1}`);
    hall.position.set(x, 0, z);
    root.add(hall);
    box(hall, `FINANCE__F12__HALL_${index + 1}_ENVELOPE`, [7.2, 2.9 + (index % 3) * 0.35, 7.4], index % 2 ? m.smokedGlass : m.darkMetal, [0, 1.5 + (index % 3) * 0.175, 0], true);
    for (const side of [-1, 1]) for (let frame = -1; frame <= 1; frame += 1) {
      box(hall, `FINANCE__F12__HALL_${index + 1}_EXTERNAL_TRUSS_${side < 0 ? 'WEST' : 'EAST'}_${frame + 2}`, [0.18, 3.7, 0.18], index % 3 === 0 ? m.ceramic : index % 3 === 1 ? m.blackMetal : m.titanium, [side * 3.68, 1.85, frame * 2.5]);
      pipe(hall, `FINANCE__F12__HALL_${index + 1}_DIAGONAL_TRUSS_${side < 0 ? 'WEST' : 'EAST'}_${frame + 2}`, new THREE.Vector3(side * 3.7, 0.25, frame * 2.5 - 1.1), new THREE.Vector3(side * 3.7, 3.4, frame * 2.5 + 1.1), 0.07, m.titanium);
    }
    if (index === 0) {
      for (let tooth = 0; tooth < 6; tooth += 1) box(hall, `FINANCE__F12__SAWTOOTH_ROOF_${tooth + 1}`, [1.22, 0.22, 7.6], tooth % 2 ? m.titanium : m.clearGlass, [-3.05 + tooth * 1.22, 3.45 + (tooth % 2) * 0.32, 0], false, [0, 0, tooth % 2 ? 0.22 : -0.22]);
    } else if (index === 1) {
      const barrel = cylinder(hall, 'FINANCE__F12__BARREL_VAULT_ROOF', 7.3, 7.6, m.titanium, [0, 3.15, 0], false, 28, [Math.PI * 0.5, 0, 0]);
      barrel.scale.y = 0.16;
    } else if (index === 2) {
      for (let fold = 0; fold < 4; fold += 1) box(hall, `FINANCE__F12__FOLDED_PLATE_ROOF_${fold + 1}`, [2.2, 0.2, 7.7], fold % 2 ? m.clearGlass : m.titanium, [-2.7 + fold * 1.8, 3.65, 0], false, [0, 0, fold % 2 ? 0.16 : -0.16]);
    } else if (index === 3) {
      dome(hall, 'FINANCE__F12__SHALLOW_DOME_ROOF', 4.2, m.titanium, [0, 3.25, 0]);
      hall.getObjectByName('FINANCE__F12__SHALLOW_DOME_ROOF')!.scale.y = 0.28;
    } else if (index === 4) {
      for (let step = 0; step < 3; step += 1) box(hall, `FINANCE__F12__STEPPED_TERRACE_ROOF_${step + 1}`, [7.4 - step * 1.1, 0.28, 7.6 - step * 1.1], step === 2 ? m.alpine : m.titanium, [0, 3.25 + step * 0.28, 0]);
    } else {
      box(hall, 'FINANCE__F12__FLAT_TECHNICAL_DECK', [7.5, 0.24, 7.7], m.darkMetal, [0, 3.54, 0]);
      for (let unit = 0; unit < 5; unit += 1) box(hall, `FINANCE__F12__TECHNICAL_DECK_UNIT_${unit + 1}`, [0.82, 0.42, 1.25], m.titanium, [-2.4 + unit * 1.2, 3.86, 0]);
    }
    sign(hall, `FINANCE__F12__OVERSIZED_HALL_NUMBER_${index + 1}`, `${index + 1}`, 1.45, [0, 2.15, 3.76], '#ffffff');
  });
  box(root, 'FINANCE__F12__ORDERED_CENTRAL_SERVICE_COURT', [17.4, 0.09, 3.2], m.basalt, [0, 0.045, 0]);
  for (let lane = 0; lane < 4; lane += 1) box(root, `FINANCE__F12__ROBOTIC_FREIGHT_LANE_${lane + 1}`, [16.2, 0.03, 0.16], lane % 2 ? m.cyanLight : m.goldLight, [0, 0.11, -1.2 + lane * 0.8]);
  box(root, 'FINANCE__F12__SIX_HALL_PEDESTRIAN_CANOPY', [25.4, 0.28, 2.1], m.milkyGlass, [0, 4.4, 0]);
  for (let frame = 0; frame < 13; frame += 1) box(root, `FINANCE__F12__BRIGHT_CANOPY_FRAME_${frame + 1}`, [0.14, 4.4, 2.3], frame % 2 ? m.ceramic : m.titanium, [-12 + frame * 2, 2.2, 0]);
  for (let garden = 0; garden < 8; garden += 1) box(root, `FINANCE__F12__PERIMETER_RAIN_GARDEN_${garden + 1}`, [2.4, 0.16, 0.82], garden % 2 ? m.alpine : m.water, [-10.5 + garden * 3, 0.08, garden % 2 ? 9.9 : -9.9]);
}

function addDelegateSpire(root: THREE.Group, m: Materials) {
  box(root, 'FINANCE__F13__LOW_DELEGATION_PAVILION', [10.8, 1.8, 8.5], m.paleStone, [0, 0.9, 0], true);
  for (let floor = 0; floor < 16; floor += 1) {
    const band = Math.floor(floor / 4);
    const direction = band % 2 ? -1 : 1;
    const local = floor % 4;
    const angle = direction * local * 0.035 + band * 0.04;
    const plate = box(root, `FINANCE__F13__ROTATED_TREATY_FLOOR_${floor + 1}`, [5.5, 0.78, 5.0], floor % 4 === 3 ? m.clearGlass : m.smokedGlass, [0, 2.2 + floor * 0.78, 0], true, [0, angle, 0]);
    plate.userData.rotationReversesEveryEightLevels = true;
    if (floor % 4 === 3) pulse(plate, 0.055, floor * 0.45, 0.08, 1.5);
  }
  for (let fin = 0; fin < 12; fin += 1) {
    const angle = fin / 12 * Math.PI * 2;
    const height = 8.4 + (fin % 5) * 1.05;
    box(root, `FINANCE__F13__PALE_TREATY_PAGE_FIN_${fin + 1}`, [0.28, height, 0.75], m.ceramic, [Math.cos(angle) * 3.05, 2.1 + height * 0.5, Math.sin(angle) * 3.05], false, [0, -angle, 0]);
  }
  for (let pillar = 0; pillar < 18; pillar += 1) {
    const angle = pillar / 18 * Math.PI * 2;
    const radius = 6.2 + (pillar % 3 - 1) * 0.35;
    pulse(cylinder(root, `FINANCE__F13__DISPLACED_ILLUMINATED_PILLAR_${pillar + 1}`, 0.18, 2.45, m.whiteLight, [Math.cos(angle) * radius, 1.23, Math.sin(angle) * radius]), 0.04, pillar * 0.25, 0.35, 2.2);
  }
  box(root, 'FINANCE__F13__HOVERING_EASTERN_ROOM', [4.4, 1.9, 4.2], m.clearGlass, [3.8, 14.35, 0], false);
  for (const z of [-1.65, 1.65]) pipe(root, `FINANCE__F13__EDGE_LIT_HOVER_SUPPORT_${z < 0 ? 'NORTH' : 'SOUTH'}`, new THREE.Vector3(2.5, 12.85, z), new THREE.Vector3(2.5, 13.4, z), 0.05, m.whiteLight);
  pulse(cylinder(root, 'FINANCE__F13__ALPINE_ALIGNED_BEACON', 0.12, 3.7, m.whiteLight, [0, 16.25, 0]), 0.04, 0, 1.4, 4.4);
  sign(root, 'FINANCE__F13__INTEGRATED_SIGN', 'DELEGATE SPIRE', 4, [0, 1.18, 4.28]);
}

function addArbitrationBasilica(root: THREE.Group, m: Materials) {
  box(root, 'FINANCE__F14__HIGH_CENTRAL_CIVIC_VOLUME', [12.5, 4.8, 7.8], m.paleStone, [0, 2.4, -0.5], true);
  for (const side of [-1, 1]) box(root, `FINANCE__F14__LOWER_SIDE_VOLUME_${side < 0 ? 'WEST' : 'EAST'}`, [5.2, 3.15, 7.2], m.ceramic, [side * 8.65, 1.58, -0.5], true);
  for (let seam = 0; seam < 15; seam += 1) {
    const x = -10.8 + seam * 1.55;
    pipe(root, `FINANCE__F14__VISIBLE_REPAIR_SEAM_${seam + 1}`, new THREE.Vector3(x, 0.35, 3.42), new THREE.Vector3(x + Math.sin(seam) * 0.7, 2.2 + (seam % 4) * 0.7, 3.42), 0.045 + (seam % 3) * 0.012, seam % 4 ? m.darkMetal : m.bronze);
  }
  box(root, 'FINANCE__F14__BROAD_STAIR_AND_RAMP', [10.5, 0.18, 4.1], m.paleStone, [0, 0.09, 5.25]);
  for (const x of [-3.2, 3.2]) box(root, `FINANCE__F14__ENTRY_WATER_CHANNEL_${x < 0 ? 'WEST' : 'EAST'}`, [0.55, 0.035, 4.4], m.water, [x, 0.12, 5.35]);
  for (const x of [-4.25, 4.25]) box(root, `FINANCE__F14__EMPTY_THRESHOLD_FRAME_${x < 0 ? 'WEST' : 'EAST'}`, [0.35, 5.2, 0.42], m.blackMetal, [x, 2.6, 4.42]);
  box(root, 'FINANCE__F14__EMPTY_THRESHOLD_FRAME_TOP', [8.85, 0.35, 0.42], m.blackMetal, [0, 5.02, 4.42]);
  for (const side of [-1, 1]) {
    const fin = box(root, `FINANCE__F14__OPPOSING_ROOF_FIN_${side < 0 ? 'WEST' : 'EAST'}`, [5.75, 0.28, 6.9], m.titanium, [side * 3.15, 5.15, -0.35], false, [0, 0, side * -0.13]);
    fin.userData.unresolvedGap = true;
  }
  pulse(box(root, 'FINANCE__F14__UNBRIDGED_WHITE_LIGHT_GAP', [0.18, 0.08, 7.0], m.whiteLight, [0, 5.72, -0.35]), 0.05, 0, 1.1, 3.8);
  for (let buttress = 0; buttress < 8; buttress += 1) for (const side of [-1, 1]) box(root, `FINANCE__F14__DEEP_SIDE_BUTTRESS_${side < 0 ? 'WEST' : 'EAST'}_${buttress + 1}`, [0.45, 3.2, 0.85], m.paleStone, [side * 11.45, 1.6, -3.0 + buttress * 0.82], true);
  for (let ring = 0; ring < 7; ring += 1) torus(root, `FINANCE__F14__PUBLIC_RULINGS_FORUM_RING_${ring + 1}`, 1.4 + ring * 0.62, 0.04, ring % 2 ? m.basalt : m.titanium, [0, 0.05, -8.1]);
  sign(root, 'FINANCE__F14__INTEGRATED_SIGN', 'ARBITRATION BASILICA', 5.4, [0, 2.62, 3.48]);
}

function addChronos(root: THREE.Group, m: Materials) {
  cylinder(root, 'FINANCE__F15__BRONZE_LINED_MIRRORED_TOWER', 6.3, 8.9, m.graphiteGlass, [0, 4.45, 0], true, 36);
  for (let line = 0; line < 28; line += 1) {
    const angle = line / 28 * Math.PI * 2;
    box(root, `FINANCE__F15__BRONZE_VERTICAL_TIME_LINE_${line + 1}`, [0.08, 8.45, 0.12], m.bronze, [Math.cos(angle) * 3.13, 4.45, Math.sin(angle) * 3.13], false, [0, -angle, 0]);
  }
  cylinder(root, 'FINANCE__F15__WIDE_FUTURES_DISC', 13.8, 0.7, m.darkMetal, [0, 9.05, 0], false, 48);
  torus(root, 'FINANCE__F15__LONG_DURATION_DISPLAY_BAND', 6.85, 0.16, m.cyanLight, [0, 9.06, 0], [Math.PI * 0.5, 0, 0]);
  for (let timeline = 0; timeline < 24; timeline += 1) {
    const angle = timeline / 24 * Math.PI * 2;
    const inner = 1.65 + timeline % 3 * 0.38;
    const outer = 5.8 - timeline % 4 * 0.28;
    const branch = pipe(root, `FINANCE__F15__BRANCHING_UNDERSIDE_TIMELINE_${timeline + 1}`, new THREE.Vector3(Math.cos(angle) * inner, 8.66, Math.sin(angle) * inner), new THREE.Vector3(Math.cos(angle + Math.sin(timeline) * 0.16) * outer, 8.66, Math.sin(angle + Math.sin(timeline) * 0.16) * outer), 0.045, timeline % 3 ? m.whiteLight : m.goldLight);
    pulse(branch, 0.05 + timeline % 4 * 0.006, timeline * 0.35, 0.18, 3.8);
  }
  torus(root, 'FINANCE__F15__REAL_SKY_ENTRANCE_VOID', 1.52, 0.28, m.titanium, [0, 9.05, 3.1], [Math.PI * 0.5, 0, 0]);
  for (let domain = 0; domain < 12; domain += 1) {
    const angle = domain / 12 * Math.PI * 2;
    pipe(root, `FINANCE__F15__FUTURE_DOMAIN_PATH_${domain + 1}`, new THREE.Vector3(Math.cos(angle) * 3.8, 0.06, Math.sin(angle) * 3.8), new THREE.Vector3(Math.cos(angle) * 8.2, 0.06, Math.sin(angle) * 8.2), 0.12, m.paleStone);
    pipe(root, `FINANCE__F15__BRANCHING_BRONZE_PATH_LINE_${domain + 1}`, new THREE.Vector3(Math.cos(angle) * 3.8, 0.15, Math.sin(angle) * 3.8), new THREE.Vector3(Math.cos(angle + (domain % 2 ? 0.08 : -0.08)) * 8.2, 0.15, Math.sin(angle + (domain % 2 ? 0.08 : -0.08)) * 8.2), 0.035, m.bronze);
  }
  for (let ring = 0; ring < 3; ring += 1) rotate(torus(root, `FINANCE__F15__ROTATING_SENSOR_RING_${ring + 1}`, 1.3 + ring * 0.5, 0.08, ring === 1 ? m.whiteLight : m.titanium, [0, 10.25 + ring * 0.36, 0], [ring * 0.72, ring * 0.55, ring * 0.38]), (ring + 1) * (ring % 2 ? -0.009 : 0.006), ['x', 'y', 'z'][ring] as 'x' | 'y' | 'z');
  sign(root, 'FINANCE__F15__INTEGRATED_SIGN', 'CHRONOS FUTURES', 4.4, [0, 2.0, 3.18]);
}

const BUILDERS: Readonly<Record<string, (root: THREE.Group, materials: Materials) => void>> = {
  F01: addAequitas,
  F02: addMeridian,
  F03: addVenturePrism,
  F04: addHelix,
  F05: addPatentLantern,
  F06: addBlackSwan,
  F07: addImpactLedger,
  F08: addPatronHall,
  F09: addSovereignForum,
  F10: addClearingVault,
  F11: addAstraConfluence,
  F12: addCongressYards,
  F13: addDelegateSpire,
  F14: addArbitrationBasilica,
  F15: addChronos,
};

function createBuilding(record: FinancialFundingBuildingProgram, materials: Materials) {
  const root = prepare(new THREE.Group(), `FINANCE__${record.code}__${record.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`);
  BUILDERS[record.code](root, materials);
  root.userData.exteriorProgram = true;
  root.userData.featureRole = 'building';
  root.userData.buildingCode = record.code;
  root.userData.buildingName = record.name;
  root.userData.semanticName = record.name;
  root.userData.buildingPurpose = record.purpose;
  root.userData.placementZone = record.zone;
  root.userData.facilityForm = record.form;
  root.userData.footprintMetres = [...record.footprintMetres];
  root.userData.heightMetres = record.heightMetres;
  root.userData.exteriorSignature = record.exteriorSignature;
  root.userData.exteriorOnly = true;
  root.userData.navObstacle = true;
  root.traverse((object) => {
    object.userData.selectableId = DISTRICT_ID;
    object.userData.districtId = DISTRICT_ID;
  });
  return root;
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!;
  const radius = THREE.MathUtils.lerp(sector.innerRadius, sector.outerRadius, radialT);
  const angle = THREE.MathUtils.lerp(sector.startAngle, sector.endAngle, angularT);
  return new THREE.Vector3(Math.cos(angle) * radius - definition.position[0], y, Math.sin(angle) * radius - definition.position[2]);
}

function districtArc(definition: DistrictDefinition, radialT: number, startAngularT: number, endAngularT: number, segments: number, y = FLOOR_Y) {
  return Array.from({ length: segments + 1 }, (_, index) => pointInDistrict(definition, radialT, THREE.MathUtils.lerp(startAngularT, endAngularT, index / segments), y));
}

function ribbonGeometry(points: readonly THREE.Vector3[], width: number) {
  const positions: number[] = [];
  const indices: number[] = [];
  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const tangent = next.clone().sub(previous).setY(0).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5);
    positions.push(point.x + normal.x, point.y, point.z + normal.z, point.x - normal.x, point.y, point.z - normal.z);
    if (index < points.length - 1) {
      const offset = index * 2;
      indices.push(offset, offset + 2, offset + 1, offset + 2, offset + 3, offset + 1);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function ribbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, mat: THREE.Material, walkable = true) {
  const value = prepare(new THREE.Mesh(ribbonGeometry(points, width), mat), name);
  value.userData.walkable = walkable;
  value.userData.navObstacle = false;
  value.userData.financialRoute = true;
  parent.add(value);
  return value;
}

function nearestPoint(points: readonly THREE.Vector3[], target: THREE.Vector3) {
  return points.reduce((nearest, point) => point.distanceToSquared(target) < nearest.distanceToSquared(target) ? point : nearest, points[0]);
}

function addPublicRealm(district: THREE.Group, definition: DistrictDefinition, facilities: readonly THREE.Group[], materials: Materials) {
  const infrastructure = prepare(new THREE.Group(), 'FINANCE__DISTRICT_CIRCULATORY_NETWORK');
  const landscape = prepare(new THREE.Group(), 'FINANCE__COORDINATED_PUBLIC_REALM');
  const capital = districtArc(definition, 0.48, 0.035, 0.335, 34, FLOOR_Y + 0.014);
  const spine = districtArc(definition, 0.48, 0.325, 0.675, 38, FLOOR_Y + 0.014);
  const confluence = districtArc(definition, 0.48, 0.665, 0.965, 34, FLOOR_Y + 0.014);
  ribbon(infrastructure, 'FINANCE__CAPITAL_CRESCENT_PROMENADE', capital, 1.75, materials.basalt);
  ribbon(infrastructure, 'FINANCE__FUNDING_SPINE_PROMENADE', spine, 1.9, materials.paleStone);
  ribbon(infrastructure, 'FINANCE__CONFLUENCE_GROUNDS_PROMENADE', confluence, 2.25, materials.paleStone);
  for (const [index, join] of [[0, [capital[capital.length - 1], spine[0]]], [1, [spine[spine.length - 1], confluence[0]]]] as const) {
    ribbon(infrastructure, `FINANCE__ZONE_CONFLUENCE_LINK_${index + 1}`, join, 2.0, materials.titanium);
  }
  const allPromenade = [...capital, ...spine, ...confluence];
  FINANCIAL_FUNDING_BUILDING_PROGRAM.forEach((record, index) => {
    const facility = facilities[index];
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(facility.quaternion).setY(0).normalize();
    const entrance = facility.position.clone().addScaledVector(forward, record.footprintMetres[1] / 20 + 0.6).setY(FLOOR_Y + 0.018);
    const promenadePoint = nearestPoint(allPromenade, entrance).clone();
    const bend = promenadePoint.clone().lerp(entrance, 0.56);
    bend.addScaledVector(new THREE.Vector3(-forward.z, 0, forward.x), (index % 2 ? 1 : -1) * 0.42);
    ribbon(infrastructure, `FINANCE__${record.code}__EXACT_PEDESTRIAN_APPROACH`, [promenadePoint, bend, entrance], record.zone === 'confluence-grounds' ? 1.15 : 0.86, materials.paleStone);
    ribbon(infrastructure, `FINANCE__${record.code}__ILLUMINATED_PAVING_SEAM`, [promenadePoint.clone().setY(FLOOR_Y + 0.038), bend.clone().setY(FLOOR_Y + 0.038), entrance.clone().setY(FLOOR_Y + 0.038)], 0.05, record.zone === 'capital-crescent' ? materials.violetLight : record.zone === 'funding-spine' ? materials.goldLight : materials.whiteLight, false);
  });
  const transitStart = pointInDistrict(definition, 0.12, 0.965, FLOOR_Y + 0.018);
  const transitEnd = pointInDistrict(definition, 0.92, 0.965, FLOOR_Y + 0.018);
  ribbon(infrastructure, 'FINANCE__DIRECT_CONVENTION_TRANSIT_LINE', [transitStart, transitStart.clone().lerp(transitEnd, 0.5), transitEnd], 1.1, materials.graphiteGlass);
  for (let canopy = 0; canopy < 13; canopy += 1) {
    const point = transitStart.clone().lerp(transitEnd, canopy / 12);
    box(infrastructure, `FINANCE__ENCLOSED_MOVING_WALKWAY_CANOPY_${canopy + 1}`, [1.45, 0.14, 1.9], canopy % 3 ? materials.clearGlass : materials.titanium, [point.x, 2.2, point.z]);
    for (const side of [-1, 1]) pipe(infrastructure, `FINANCE__MOVING_WALKWAY_SUPPORT_${canopy + 1}_${side < 0 ? 'WEST' : 'EAST'}`, new THREE.Vector3(point.x + side * 0.65, FLOOR_Y, point.z), new THREE.Vector3(point.x + side * 0.65, 2.12, point.z), 0.045, materials.titanium);
  }
  for (let lamp = 0; lamp < 42; lamp += 1) {
    const angularT = 0.04 + lamp / 41 * 0.92;
    const side = lamp % 2 ? 1 : -1;
    const point = pointInDistrict(definition, 0.48 + side * 0.035, angularT, FLOOR_Y);
    cylinder(landscape, `FINANCE__THIN_VERTICAL_STREET_LIGHT_${lamp + 1}`, 0.075, 2.75, materials.titanium, [point.x, 1.38, point.z]);
    pulse(box(landscape, `FINANCE__DOWNLIGHT_SEAM_${lamp + 1}`, [0.16, 0.08, 0.16], lamp % 3 ? materials.whiteLight : materials.goldLight, [point.x, 2.76, point.z]), 0.035, lamp * 0.2, 0.35, 2.8);
  }
  for (let grove = 0; grove < 30; grove += 1) {
    const angularT = 0.055 + grove / 29 * 0.89;
    const side = grove % 2 ? 1 : -1;
    const point = pointInDistrict(definition, 0.48 + side * 0.072, angularT, FLOOR_Y);
    tree(landscape, `FINANCE__FORMAL_GROVE_TREE_${grove + 1}`, point.x, point.z, materials, 0.52 + grove % 3 * 0.07);
  }
  for (let garden = 0; garden < 12; garden += 1) {
    const point = pointInDistrict(definition, 0.43, 0.06 + garden / 11 * 0.88, FLOOR_Y + 0.02);
    box(landscape, `FINANCE__LINEAR_RAIN_GARDEN_${garden + 1}`, [1.45, 0.1, 0.58], garden % 3 ? materials.silverGrass : materials.water, [point.x, point.y, point.z]);
  }
  infrastructure.userData.circulation = {
    capitalCrescent: 'curved promenade toward Luxury and Entertainment',
    fundingSpine: 'civic funding and governance route',
    confluenceGrounds: 'wide convention promenade toward Entry and Logistics',
    directConventionTransit: true,
    enclosedMovingWalkway: true,
    exactBuildingApproaches: 15,
    accessibleRoutesIntegrated: true,
  };
  landscape.userData.publicRealm = {
    formalGroveTrees: 30,
    thinVerticalStreetLights: 42,
    linearRainGardens: 12,
    palette: 'pale engineered stone, black basalt, smoked glass, titanium, bronze, ceramic, translucent composites, and controlled media',
    darkSkyLighting: true,
    alpineVisualConnection: true,
  };
  district.add(infrastructure, landscape);
  return { infrastructure, landscape };
}

export function buildFinancialFundingDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Financial / Funding / Convention district requires a bounded sector');
  const materials = createMaterials();
  const facilities = FINANCIAL_FUNDING_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials);
    building.position.copy(pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02));
    const worldPosition = building.position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2]));
    const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize();
    building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = {
      radius: Math.hypot(worldPosition.x, worldPosition.z),
      angle: Math.atan2(worldPosition.z, worldPosition.x),
      normalizedRadial: record.radialT,
      normalizedAngular: record.angularT,
    };
    district.add(building);
    return building;
  });
  const publicRealm = addPublicRealm(district, definition, facilities, materials);
  const buildings = FINANCIAL_FUNDING_BUILDING_PROGRAM.map((record) => ({
    code: record.code,
    name: record.name,
    purpose: record.purpose,
    zone: record.zone,
    form: record.form,
    footprintMetres: record.footprintMetres,
    heightMetres: record.heightMetres,
    exteriorSignature: record.exteriorSignature,
  }));
  const zones = {
    capitalCrescent: FINANCIAL_FUNDING_BUILDING_PROGRAM.filter((record) => record.zone === 'capital-crescent').map((record) => record.name),
    fundingSpine: FINANCIAL_FUNDING_BUILDING_PROGRAM.filter((record) => record.zone === 'funding-spine').map((record) => record.name),
    confluenceGrounds: FINANCIAL_FUNDING_BUILDING_PROGRAM.filter((record) => record.zone === 'confluence-grounds').map((record) => record.name),
  };
  district.userData.financialFundingDistrict = {
    name: 'Financial / Funding / Convention District',
    buildingCount: facilities.length,
    buildings,
    zones,
    circulation: publicRealm.infrastructure.userData.circulation,
    publicRealm: publicRealm.landscape.userData.publicRealm,
    signatureSystems: {
      aequitasLedgerBands: 17,
      patentNotationPanels: 28,
      sovereignPartnerFins: 24,
      clearingEncryptionCells: 144,
      astraCrescentBays: 19,
      congressHalls: 6,
      delegateTorsionFloors: 16,
      chronosFutureDomains: 12,
    },
    lightingProtocol: 'gold and white civic funding light; cold silver, violet, and blue private-capital light; restrained media; convention roof arcs; reflected water; dark planted terraces',
    architecturalIntent: 'finance as the island circulation system rather than its ruling ideology, with visible tension among public science, private capital, political influence, and uncertain futures',
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: FINANCIAL_FUNDING_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: ['Capital Crescent promenade', 'Funding Spine promenade', 'Confluence Grounds promenade', 'direct convention transit line', 'enclosed moving walkway', 'formal grove', 'linear rain gardens', 'fifteen exact building approaches'],
    realizedFeatureTags: FINANCIAL_FUNDING_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: publicRealm.infrastructure.children.length + publicRealm.landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 19,
    radialCoverage: 0.95,
    angularCoverage: 0.96,
    exteriorOnly: true,
    financialCirculatoryNarrative: true,
    threeZoneMasterplan: true,
    conventionTransitIntegrated: true,
  };
}
