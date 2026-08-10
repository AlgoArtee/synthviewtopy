import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

const DISTRICT_ID = 'corporate-core';
const FLOOR_Y = 0.008;
const TAU = Math.PI * 2;
const RING_RADIUS = 58;
const COMPLIANCE_WALK_RADIUS = 42;
const PROCESSION_LOOP_RADIUS = 71;

export interface CorporateCoreBuildingProgram {
  code: string;
  name: string;
  purpose: string;
  form: string;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  angle: number;
  radius: number;
  neon: 'cyan' | 'ultraviolet' | 'magenta' | 'amber' | 'green' | 'red' | 'white';
  exteriorSignature: string;
}

const northClockwiseAngle = (index: number) => -Math.PI * 0.5 + index / 20 * TAU;

export const CORPORATE_CORE_BUILDING_PROGRAM: readonly CorporateCoreBuildingProgram[] = [
  { code: 'C01', name: 'The Null Exchange', purpose: 'Research securities, laboratory bonds, prediction contracts, and instruments attached to discoveries that may not yet exist', form: 'inward-leaning twin-slab exchange', footprintMetres: [118, 96], heightMetres: 214, angle: northClockwiseAngle(0), radius: 59, neon: 'cyan', exteriorSignature: 'two mirror-black guillotine slabs, full-height void, upper bridge, digital-rain tickers, black-water bridge, red submerged cracks, and horn antenna frames' },
  { code: 'C02', name: 'The Obsidian Reserve', purpose: 'Central treasury, emergency financing authority, and long-term capital repository', form: 'seven-terrace armored ziggurat', footprintMetres: [142, 126], heightMetres: 112, angle: northClockwiseAngle(1), radius: 60.5, neon: 'amber', exteriorSignature: 'seven basalt vault terraces, pulsing amber strata, floating halo, mirror entrance slab, red alignment line, and four sealed-hand cube monuments' },
  { code: 'C03', name: 'The Black Ledger Authority', purpose: 'Ownership, debt, royalty, influence, liability, and contractual-lineage registry', form: 'layered document monolith', footprintMetres: [96, 92], heightMetres: 198, angle: northClockwiseAngle(2), radius: 58, neon: 'magenta', exteriorSignature: 'forty compressed document layers, severe page cantilevers, magenta floor edges, contract fragments, redacted panels, and a thirty-metre corner wound' },
  { code: 'C04', name: 'The Quantum Clearing House', purpose: 'Escrow, transfer reconciliation, and high-speed transaction verification', form: 'suspended electrochromic cube', footprintMetres: [112, 112], heightMetres: 126, angle: northClockwiseAngle(3), radius: 58.5, neon: 'cyan', exteriorSignature: 'mathematically perfect floating cube, concealed columns, reconfiguring cyan-magenta-red grid, ultraviolet convergence platform, and reset countdown ramp' },
  { code: 'C05', name: 'The Black Index Bureau', purpose: 'Financial, scientific, political, reputational, and institutional ranking', form: 'long inward-curved index blade', footprintMetres: [154, 82], heightMetres: 64, angle: northClockwiseAngle(4), radius: 60, neon: 'green', exteriorSignature: 'concave carbon-fin blade, live green-cyan ranking bars, five renumbering portals, blood-lit reflecting channel, and composite-index mast' },
  { code: 'C06', name: 'The Vanta Venture Spire', purpose: 'Speculative research investment, accelerated commercialization, and hostile acquisition', form: 'rooted triangular needle tower', footprintMetres: [94, 88], heightMetres: 232, angle: northClockwiseAngle(5), radius: 58, neon: 'green', exteriorSignature: 'narrow grooved needle, synthetic root ribs, racing acid-green investment streams, descending failure flashes, arrow forecourt, observation ledges, and unreachable summit light' },
  { code: 'C07', name: 'Covenant Capital House', purpose: 'Multi-decade funding compacts among governments, corporations, alliances, and foundations', form: 'fortified corporate cathedral', footprintMetres: [138, 112], heightMetres: 118, angle: northClockwiseAngle(6), radius: 60, neon: 'ultraviolet', exteriorSignature: 'pointed black hall, four asymmetrical wings, twelve inward pillars, suspended-light banners, scale roof, black-water channels, and mirrored delegates' },
  { code: 'C08', name: 'The Patronage Engine', purpose: 'Private foundations, prestige grants, cultural sponsorship, and anonymous funding', form: 'six-ring rotating capital turbine', footprintMetres: [112, 112], heightMetres: 102, angle: northClockwiseAngle(7), radius: 57.5, neon: 'magenta', exteriorSignature: 'six independently rotating finned rings, spiraling magenta-amber edges, accusatory arcade, intermittent slab entrance, artificial carbon grove, and cold-vapor stack' },
  { code: 'C09', name: 'The Legacy Endowment', purpose: 'Permanent funds, deceased-patron trusts, and century-scale research programs', form: 'three-stage vertical mausoleum', footprintMetres: [106, 98], heightMetres: 174, angle: northClockwiseAngle(8), radius: 59, neon: 'amber', exteriorSignature: 'three granite stages, vascular amber veins, project grave-marker court, monumental arch and suspended circle, beneficiary traces, and candle-fin crown' },
  { code: 'C10', name: 'The Silent Patent Auction', purpose: 'Approved sale of intellectual property, licenses, research claims, prototypes, and unfinished technologies', form: 'faceted mirrored auction polyhedron', footprintMetres: [116, 104], heightMetres: 108, angle: northClockwiseAngle(9), radius: 59.5, neon: 'magenta', exteriorSignature: 'unstable faceted polyhedron, fragmented Megabuilding reflections, state-change panel outlines, hovering lot sign, roof bid columns, triangular entry canyon, and twelve sealed display plinths' },
  { code: 'C11', name: 'Umbra Underwriting Hall', purpose: 'Insurance for hazardous trials, irreplaceable instruments, personnel, prototypes, and synthetic ecosystems', form: 'low armored impact shell', footprintMetres: [148, 112], heightMetres: 72, angle: northClockwiseAngle(10), radius: 60.5, neon: 'cyan', exteriorSignature: 'overlapping titanium shell plates, heavy impact buttresses, blue armor seams, descending storm court, ultraviolet drainage, five risk shields, and lightning-rod network' },
  { code: 'C12', name: 'Catastrophe Bond Tower', purpose: 'Finance for containment failures, environmental collapse, infrastructure loss, and experimental instability', form: 'fractured dual-finish risk tower', footprintMetres: [88, 84], heightMetres: 222, angle: northClockwiseAngle(11), radius: 57.5, neon: 'red', exteriorSignature: 'reflective and matte tower halves split by a living red fault, unidentified risk percentages, disaster-graph wall, fracture doors, asymmetrical antennas, and suspended warning beacon' },
  { code: 'C13', name: 'The Arbitration Basilica', purpose: 'Resolution of ownership, default, jurisdiction, intellectual-property, liability, and intergovernmental disputes', form: 'authoritarian judicial basilica', footprintMetres: [148, 108], heightMetres: 82, angle: northClockwiseAngle(12), radius: 60, neon: 'red', exteriorSignature: 'long volcanic-stone nave, twenty-four square pillars, red legal grid, vast shallow stairs, splitting approach line, unequal geometric scales, and off-center judgment tower' },
  { code: 'C14', name: 'Event Horizon Convention Centre', purpose: 'Global congresses, investor summits, emergency convocations, exhibitions, and consequential announcements', form: 'partially embedded convention torus', footprintMetres: [144, 132], heightMetres: 78, angle: northClockwiseAngle(13), radius: 60.5, neon: 'cyan', exteriorSignature: 'low smoked-glass torus, raised entrance sector, inward carbon ribs, accelerating cyan information band, void plaza, corrupted banner pylons, and orbiting fin crown' },
  { code: 'C15', name: 'Mourningstar Plenary Hall', purpose: 'Keynotes, declarations, awards, leadership transitions, and formal program terminations', form: 'twelve-wing eclipse dome', footprintMetres: [138, 132], heightMetres: 84, angle: northClockwiseAngle(14), radius: 59, neon: 'magenta', exteriorSignature: 'black ceramic dome, twelve radial triangular wings, red thermal seams, district-word pylons, converging amber avenue, equatorial vote sphere, and artificial black-sun crown' },
  { code: 'C16', name: 'Eclipse Expo Galleries', purpose: 'Prototype demonstrations, research showcases, recruitment, funding fairs, and technology exhibitions', form: 'seven-pavilion eclipse canopy', footprintMetres: [148, 132], heightMetres: 62, angle: northClockwiseAngle(15), radius: 60, neon: 'white', exteriorSignature: 'seven unlike black pavilions, vast uneven canopy disc, cold central aperture, category light signs, floating holographic title, concealed red loading portals, and ultraviolet edge' },
  { code: 'C17', name: 'The Funding Crucible', purpose: 'Competitive high-risk capital, grants, sponsorship, and restricted-infrastructure access', form: 'sunken inverted selection pyramid', footprintMetres: [126, 118], heightMetres: 54, angle: northClockwiseAngle(16), radius: 60.5, neon: 'red', exteriorSignature: 'inverted perforated pyramid in a crater, four dark-glass bridges, descending rejected-project light, sponsor-fin crown, and deep circular heartbeat' },
  { code: 'C18', name: 'The Last Prospectus Media House', purpose: 'Official financial press, investor relations, controlled announcements, and emergency explanations', form: 'five folded-page media house', footprintMetres: [122, 102], heightMetres: 118, angle: northClockwiseAngle(17), radius: 58, neon: 'cyan', exteriorSignature: 'five leaning folded black pages, white illuminated margins, canyon media screens, camera-zone terraces, microphone pylons, rotating roof antennas, and self-deleting ticker' },
  { code: 'C19', name: 'Nocturne Delegation Tower', purpose: 'Accommodation for visiting councils, corporate missions, funding committees, and executive delegations', form: 'nine-offset-cylinder delegation tower', footprintMetres: [98, 94], heightMetres: 188, angle: northClockwiseAngle(18), radius: 57.5, neon: 'ultraviolet', exteriorSignature: 'nine misaligned dark cylinders, delegation frequency bands, damaged vertical sign, off-center disc canopy, twenty rigid light flags, opaque skybridges, and targeting-reticle crown' },
  { code: 'C20', name: 'The Crown of Consensus', purpose: 'Treaty announcements, convention closings, collective commitments, and public declarations of unity', form: 'incomplete vertical ceremonial ring', footprintMetres: [142, 112], heightMetres: 148, angle: northClockwiseAngle(19), radius: 60.5, neon: 'ultraviolet', exteriorSignature: 'two obsidian curved wings nearly meeting overhead, interrupted ultraviolet arc, mirror plaza divided unequally, forty inward judicial seats, black podium, and expanding cyan accord rings' },
];

function material(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  const value = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.36, ...options });
  value.name = name;
  return value;
}

function createMaterials() {
  const neon = (name: string, color: THREE.ColorRepresentation, intensity = 4) => material(name, color, { emissive: color, emissiveIntensity: intensity, roughness: 0.14, metalness: 0.08 });
  return {
    basalt: material('Corporate matte light-absorbing basalt', '#050608', { roughness: 0.96, metalness: 0.05 }),
    obsidian: material('Corporate polished obsidian composite', '#090b10', { roughness: 0.14, metalness: 0.78 }),
    ceramic: material('Corporate black ceramic', '#0d0e12', { roughness: 0.72, metalness: 0.18 }),
    carbon: material('Corporate carbon fibre', '#080a0d', { roughness: 0.42, metalness: 0.7 }),
    titanium: material('Corporate blackened titanium', '#11151b', { roughness: 0.3, metalness: 0.94 }),
    glass: material('Corporate smoked black glass', '#090f16', { roughness: 0.12, metalness: 0.72 }),
    concrete: material('Corporate light-absorbing concrete', '#070809', { roughness: 0.9, metalness: 0.08 }),
    mirror: material('Corporate mirror black glass', '#05070b', { roughness: 0.06, metalness: 0.96 }),
    water: material('Corporate perfectly black water', '#010204', { roughness: 0.08, metalness: 0.5, transparent: true, opacity: 0.88, depthWrite: false }),
    cyan: neon('Corporate cold cyan verified light', '#5eeaff'),
    ultraviolet: neon('Corporate ultraviolet authority light', '#9a5cff'),
    magenta: neon('Corporate deep magenta speculative light', '#ff36c9'),
    amber: neon('Corporate funeral amber obligation light', '#ffb34d', 3.5),
    green: neon('Corporate acid green growth light', '#91ff36'),
    red: neon('Corporate arterial red risk light', '#ff243d', 4.5),
    white: neon('Corporate rare binding white light', '#f1ffff', 3.4),
    nightCyan: neon('Corporate high-output night cyan', '#72f6ff', 9.5),
    nightUltraviolet: neon('Corporate high-output night ultraviolet', '#a879ff', 8.8),
    nightMagenta: neon('Corporate high-output night magenta', '#ff55dc', 9.2),
    nightAmber: neon('Corporate high-output night amber', '#ffc66a', 7.8),
    nightGreen: neon('Corporate high-output night green', '#adff5e', 8.4),
    nightRed: neon('Corporate high-output night red', '#ff4d62', 9.4),
    nightWhite: neon('Corporate high-output night white', '#f5ffff', 10),
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
  const value = prepare(new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 14, 0, TAU, 0, Math.PI * 0.5), mat), name, obstacle);
  value.position.set(...position);
  parent.add(value);
  return value;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, mat: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [Math.PI * 0.5, 0, 0], arc = TAU, segments = 56) {
  const value = prepare(new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, segments, arc), mat), name);
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

function frustumGeometry(bottomWidth: number, bottomDepth: number, topWidth: number, topDepth: number, height: number, shearX = 0, shearZ = 0) {
  const bx = bottomWidth * 0.5;
  const bz = bottomDepth * 0.5;
  const tx = topWidth * 0.5;
  const tz = topDepth * 0.5;
  const vertices = new Float32Array([
    -bx, 0, -bz, bx, 0, -bz, bx, 0, bz, -bx, 0, bz,
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

function frustum(parent: THREE.Object3D, name: string, bottom: readonly [number, number], top: readonly [number, number], height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, shear: readonly [number, number] = [0, 0]) {
  const value = prepare(new THREE.Mesh(frustumGeometry(bottom[0], bottom[1], top[0], top[1], height, shear[0], shear[1]), mat), name, obstacle);
  value.position.set(...position);
  parent.add(value);
  return value;
}

function ringSurface(parent: THREE.Object3D, name: string, innerRadius: number, outerRadius: number, mat: THREE.Material, center: THREE.Vector3, y = FLOOR_Y) {
  const value = prepare(new THREE.Mesh(new THREE.RingGeometry(innerRadius, outerRadius, 160), mat), name);
  value.rotation.x = -Math.PI * 0.5;
  value.position.set(center.x, y, center.z);
  value.userData.walkable = true;
  value.userData.navObstacle = false;
  parent.add(value);
  return value;
}

function pulse<T extends THREE.Object3D>(object: T, speed: number, phase = 0, minimum = 0.2, maximum = 4) {
  object.userData.animate = 'corporate-emissive-pulse';
  object.userData.speed = speed;
  object.userData.phase = phase;
  object.userData.minIntensity = minimum;
  object.userData.maxIntensity = maximum;
  return object;
}

function corporateNightLight<T extends THREE.Object3D>(object: T, kind: string) {
  object.userData.corporateNightLight = true;
  object.userData.corporateNightLightKind = kind;
  object.userData.navObstacle = false;
  if (object instanceof THREE.Mesh) {
    object.castShadow = false;
    object.receiveShadow = false;
  }
  return object;
}

function rotate<T extends THREE.Object3D>(object: T, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'corporate-rotation';
  object.userData.speed = speed;
  object.userData.axis = axis;
  return object;
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
  context.font = '600 82px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowColor = color;
  context.shadowBlur = 20;
  context.fillStyle = color;
  context.fillText(text, 512, 132, 970);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  signTextureCache.set(key, texture);
  return texture;
}

function sign(parent: THREE.Object3D, name: string, text: string, width: number, position: readonly [number, number, number], color = '#efffff', rotation: readonly [number, number, number] = [0, 0, 0]) {
  const mat = new THREE.MeshBasicMaterial({ map: signTexture(text, color), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  mat.name = `Corporate integrated declaration ${text}`;
  const value = prepare(new THREE.Mesh(new THREE.PlaneGeometry(width, Math.max(0.4, width * 0.17)), mat), name);
  value.position.set(...position);
  value.rotation.set(...rotation);
  value.renderOrder = 9;
  value.userData.signText = text;
  parent.add(value);
  return value;
}

function neonFor(record: CorporateCoreBuildingProgram, m: Materials) {
  return m[record.neon];
}

function highOutputNeonFor(record: CorporateCoreBuildingProgram, m: Materials) {
  const palette = {
    cyan: m.nightCyan,
    ultraviolet: m.nightUltraviolet,
    magenta: m.nightMagenta,
    amber: m.nightAmber,
    green: m.nightGreen,
    red: m.nightRed,
    white: m.nightWhite,
  } as const;
  return palette[record.neon];
}

function addNullExchange(root: THREE.Group, m: Materials) {
  box(root, 'CORPORATE__C01__BLACK_WATER_BASIN', [5.6, 0.12, 5.4], m.water, [0, 0.04, 4]);
  box(root, 'CORPORATE__C01__UNRAILED_APPROACH_BRIDGE', [1.25, 0.18, 6.2], m.obsidian, [0, 0.18, 4.1]);
  for (const x of [-0.42, 0.42]) pulse(box(root, `CORPORATE__C01__SUBMERGED_RED_CRACK_${x < 0 ? 'WEST' : 'EAST'}`, [0.06, 0.025, 5.5], m.red, [x, 0.13, 4.1]), 0.08, x * 4, 0.4, 4.8);
  const left = frustum(root, 'CORPORATE__C01__WEST_GUILLOTINE_SLAB', [4.25, 4.3], [3.4, 3.7], 20.8, m.mirror, [-3.1, 0.1, -0.2], true, [0.82, 0]);
  const right = frustum(root, 'CORPORATE__C01__EAST_GUILLOTINE_SLAB', [4.25, 4.3], [3.4, 3.7], 20.8, m.ceramic, [3.1, 0.1, -0.2], true, [-0.82, 0]);
  left.rotation.z = -0.025;
  right.rotation.z = 0.025;
  box(root, 'CORPORATE__C01__UPPER_ENCLOSED_BRIDGE', [4.45, 1.5, 3.4], m.glass, [0, 18.8, -0.2], true);
  for (let ticker = 0; ticker < 22; ticker += 1) {
    const side = ticker % 2 ? -1 : 1;
    const line = box(root, `CORPORATE__C01__CYAN_DIGITAL_RAIN_${ticker + 1}`, [0.045, 7.2 + ticker % 5, 0.055], m.cyan, [side * (1.55 + ticker % 11 * 0.22), 5.1 + ticker % 4 * 2.7, 2.02]);
    pulse(line, 0.11 + ticker % 7 * 0.009, ticker * 0.31, 0.1, 4.5);
  }
  sign(root, 'CORPORATE__C01__VOID_SIGN', 'NULL EXCHANGE', 4.8, [0, 12.6, 2.15], '#a76aff', [0, 0, Math.PI * 0.5]);
  for (const x of [-2.55, 2.55]) {
    pipe(root, `CORPORATE__C01__HORN_ANTENNA_${x < 0 ? 'WEST' : 'EAST'}_A`, new THREE.Vector3(x, 20.5, -0.5), new THREE.Vector3(x * 1.18, 23.2, -0.8), 0.11, m.titanium);
    pipe(root, `CORPORATE__C01__HORN_ANTENNA_${x < 0 ? 'WEST' : 'EAST'}_B`, new THREE.Vector3(x * 1.18, 23.2, -0.8), new THREE.Vector3(x * 1.38, 23.2, 0.3), 0.11, m.titanium);
  }
}

function addObsidianReserve(root: THREE.Group, m: Materials) {
  for (let level = 0; level < 7; level += 1) {
    const width = 13.2 - level * 1.25;
    const depth = 11.4 - level * 1.05;
    const stage = box(root, `CORPORATE__C02__BASALT_VAULT_TERRACE_${level + 1}`, [width, 1.55, depth], level % 2 ? m.concrete : m.basalt, [0, 0.78 + level * 1.48, -level * 0.15], true);
    stage.userData.oversizedMasonry = true;
    pulse(box(root, `CORPORATE__C02__AMBER_CAPITAL_STRATUM_${level + 1}`, [width + 0.12, 0.08, depth + 0.12], m.amber, [0, 1.49 + level * 1.48, -level * 0.15]), 0.035, level * 0.55, 0.16, 3.2);
  }
  box(root, 'CORPORATE__C02__PROJECTING_MIRROR_ENTRANCE_SLAB', [8.3, 0.55, 5.1], m.mirror, [0, 2.15, 5.35]);
  box(root, 'CORPORATE__C02__RED_ALIGNMENT_TRAIL', [0.09, 0.035, 7.4], m.red, [0, 0.15, 5.8]);
  pulse(torus(root, 'CORPORATE__C02__FLOATING_TREASURY_HALO', 2.1, 0.12, m.amber, [0, 12.4, -0.7], [Math.PI * 0.5, 0, 0]), 0.03, 1.2, 0.4, 3.8);
  for (const [index, x, z] of [[1, -5.5, 4.4], [2, 5.5, 4.4], [3, -5.5, -4.4], [4, 5.5, -4.4]] as const) {
    sphere(root, `CORPORATE__C02__SEALED_HAND_${index}`, [1.05, 1.6, 0.8], m.basalt, [x, 1.1, z]);
    const cube = box(root, `CORPORATE__C02__FEATURELESS_CAPITAL_CUBE_${index}`, [0.9, 0.9, 0.9], m.obsidian, [x, 2.05, z]);
    pulse(box(root, `CORPORATE__C02__GREEN_CUBE_SEAM_${index}`, [0.96, 0.06, 0.96], m.green, [x, 2.05, z + 0.48]), 0.05, index, 0.12, 3.5);
    cube.userData.monumentalSculpture = true;
  }
  sign(root, 'CORPORATE__C02__MIST_PROJECTION_SIGN', 'OBSIDIAN RESERVE', 6.2, [0, 3.3, 7.95], '#efffff');
}

function addBlackLedger(root: THREE.Group, m: Materials) {
  for (let layer = 0; layer < 40; layer += 1) {
    const extension = layer % 11 === 0 ? 2.1 : layer % 7 === 0 ? 1.05 : 0;
    const width = 7.2 + extension;
    const depth = 6.8 + (layer % 5 === 0 ? 0.8 : 0);
    box(root, `CORPORATE__C03__COMPRESSED_LEDGER_PAGE_${layer + 1}`, [width, 0.43, depth], layer % 3 ? m.concrete : m.glass, [extension * (layer % 2 ? -0.3 : 0.3), 0.27 + layer * 0.47, 0], true);
    if (layer % 2 === 0) pulse(box(root, `CORPORATE__C03__MAGENTA_PAGE_EDGE_${layer + 1}`, [width + 0.08, 0.035, depth + 0.08], m.magenta, [extension * (layer % 2 ? -0.3 : 0.3), 0.49 + layer * 0.47, 0]), 0.045, layer * 0.19, 0.05, 3.2);
  }
  box(root, 'CORPORATE__C03__THIRTY_METRE_CORNER_WOUND', [0.42, 3.1, 0.32], m.red, [-3.66, 1.65, 3.46]);
  for (let clause = 0; clause < 7; clause += 1) box(root, `CORPORATE__C03__CYAN_CONTRACT_FRAGMENT_${clause + 1}`, [1.1 + clause % 3 * 0.5, 0.08, 0.05], m.cyan, [-2.6 + clause * 0.82, 3.1 + clause % 2 * 0.55, 3.55]);
  sign(root, 'CORPORATE__C03__AUTHORITY_SIGN', 'ALL ACCOUNTS REMAIN OPEN', 6.9, [0, 13.2, 3.58], '#eaffff', [0, 0, Math.PI * 0.5]);
  sign(root, 'CORPORATE__C03__TRANSFER_SIGN', 'LIABILITY TRANSFERRED', 5.4, [0, 6.4, 3.6], '#72efff');
  for (let tablet = 0; tablet < 18; tablet += 1) box(root, `CORPORATE__C03__OBSOLETE_COMPANY_TABLET_${tablet + 1}`, [0.75, 0.07, 1.05], tablet % 4 ? m.basalt : m.obsidian, [-4.5 + tablet % 9 * 1.1, 0.05, 4.4 + Math.floor(tablet / 9) * 1.2]);
}

function addQuantumClearing(root: THREE.Group, m: Materials) {
  cylinder(root, 'CORPORATE__C04__RECESSED_TRANSACTION_BASE', 6.3, 1.3, m.basalt, [0, -0.35, 0], true, 32);
  for (const [index, x, z] of [[1, -3.7, -3.7], [2, 3.7, -3.7], [3, -3.7, 3.7], [4, 3.7, 3.7]] as const) cylinder(root, `CORPORATE__C04__CONCEALED_MIRROR_COLUMN_${index}`, 0.55, 4.2, m.mirror, [x, 2.1, z], true, 12);
  box(root, 'CORPORATE__C04__SUSPENDED_ELECTROCHROMIC_CUBE', [10.2, 10.2, 10.2], m.glass, [0, 8.7, 0], true);
  for (let line = 0; line < 9; line += 1) {
    const mat = line % 5 === 0 ? m.red : line % 2 ? m.magenta : m.cyan;
    pulse(box(root, `CORPORATE__C04__LIVE_TRANSACTION_GRID_VERTICAL_${line + 1}`, [0.055, 9.8, 0.08], mat, [-4.5 + line * 1.12, 8.7, 5.14]), 0.08 + line * 0.004, line * 0.33, 0.08, 4.5);
    pulse(box(root, `CORPORATE__C04__LIVE_TRANSACTION_GRID_HORIZONTAL_${line + 1}`, [9.8, 0.055, 0.08], line % 3 ? m.cyan : m.magenta, [0, 4.2 + line * 1.12, 5.14]), 0.07, line * 0.42, 0.08, 4.2);
  }
  cylinder(root, 'CORPORATE__C04__OBSERVER_PLATFORM', 2.4, 0.14, m.obsidian, [0, 0.12, 1.2], false, 36);
  for (let ring = 0; ring < 5; ring += 1) pulse(torus(root, `CORPORATE__C04__RESPONSIVE_ULTRAVIOLET_RING_${ring + 1}`, 1.6 + ring * 0.72, 0.055, m.ultraviolet, [0, 0.15, 1.2]), 0.05 + ring * 0.008, ring * 0.7, 0.08, 3.6);
  box(root, 'CORPORATE__C04__DESCENDING_ENTRY_RAMP', [2.1, 0.15, 4.6], m.titanium, [0, 0.05, 4.3], false, [-0.04, 0, 0]);
  sign(root, 'CORPORATE__C04__INTERMITTENT_SIGN', 'QUANTUM CLEARING HOUSE', 6.6, [0, 10.2, 5.15], '#65efff');
  sign(root, 'CORPORATE__C04__RESET_COUNTDOWN', '00:00:08', 2.5, [0, 2.1, 4.85], '#ff3049');
}

function addBlackIndex(root: THREE.Group, m: Materials) {
  for (let segment = 0; segment < 13; segment += 1) {
    const x = -7.1 + segment * 1.18;
    const z = -0.018 * x * x;
    const height = 3.7 + (1 - Math.abs(segment - 6) / 7) * 2.8;
    box(root, `CORPORATE__C05__CURVED_INDEX_BLADE_SEGMENT_${segment + 1}`, [1.28, height, 5.2], segment % 3 ? m.glass : m.carbon, [x, height * 0.5, z], true, [0, -x * 0.018, 0]);
    box(root, `CORPORATE__C05__CARBON_RANKING_FIN_${segment + 1}`, [0.1, height + 0.45, 5.55], m.carbon, [x - 0.54, height * 0.5, z]);
    const rankHeight = 0.7 + segment % 5 * 0.92;
    pulse(box(root, `CORPORATE__C05__LIVE_RANKING_BAR_${segment + 1}`, [0.09, rankHeight, 0.06], segment % 2 ? m.green : m.cyan, [x, rankHeight * 0.5 + 0.25, z + 2.64]), 0.06, segment * 0.5, 0.08, 4.1);
  }
  box(root, 'CORPORATE__C05__BLOOD_LIT_REFLECTING_CHANNEL', [14.7, 0.08, 0.62], m.water, [0, 0.06, 3.25]);
  for (let bar = 0; bar < 12; bar += 1) pulse(box(root, `CORPORATE__C05__SUBMERGED_RED_INDEX_BAR_${bar + 1}`, [0.65, 0.025, 0.5], m.red, [-6.4 + bar * 1.16, 0.11, 3.25]), 0.07, bar * 0.4, 0.05, 3.8);
  for (let portal = 0; portal < 5; portal += 1) {
    box(root, `CORPORATE__C05__RENUMBERING_PORTAL_${portal + 1}`, [1.2, 2.2, 0.3], m.obsidian, [-5.1 + portal * 2.55, 1.15, 2.74]);
    sign(root, `CORPORATE__C05__PORTAL_NUMERAL_${portal + 1}`, `${(portal * 7 + 3) % 9}`, 0.7, [-5.1 + portal * 2.55, 2.2, 2.91], '#a776ff');
  }
  cylinder(root, 'CORPORATE__C05__COMPOSITE_INDEX_MAST', 0.15, 5.2, m.titanium, [0, 8.8, -0.6], false, 10);
  sign(root, 'CORPORATE__C05__COMPOSITE_INDEX_SIGN', '742.6', 2.2, [0, 11.2, -0.48], '#9aff50');
}

function addVanta(root: THREE.Group, m: Materials) {
  cylinder(root, 'CORPORATE__C06__TRIANGULAR_VENTURE_BASE', 8.6, 1.5, m.basalt, [0, 0.75, 0], true, 3, [0, Math.PI / 6, 0]);
  frustum(root, 'CORPORATE__C06__IMPOSSIBLY_NARROW_NEEDLE', [5.4, 5.1], [0.72, 0.72], 20.8, m.ceramic, [0, 1.3, -0.3], true, [0.2, -0.15]);
  for (let groove = 0; groove < 14; groove += 1) box(root, `CORPORATE__C06__VERTICAL_REFERENCE_ERASING_GROOVE_${groove + 1}`, [0.055, 16.5 - groove % 4, 0.08], groove % 4 ? m.obsidian : m.green, [-2.15 + groove * 0.33, 9.6, 2.12]);
  for (let rib = 0; rib < 9; rib += 1) {
    const angle = rib / 9 * TAU;
    const start = new THREE.Vector3(Math.cos(angle) * 4.2, 0.2, Math.sin(angle) * 4.2);
    const end = new THREE.Vector3(Math.cos(angle) * 1.2, 6.4, Math.sin(angle) * 1.2 - 0.3);
    pipe(root, `CORPORATE__C06__SYNTHETIC_ROOT_RIB_${rib + 1}`, start, end, 0.14, m.titanium, true);
    pulse(pipe(root, `CORPORATE__C06__ACID_INVESTMENT_STREAM_${rib + 1}`, start.clone().add(new THREE.Vector3(0, 0.04, 0)), end.clone().add(new THREE.Vector3(0, 0.04, 0)), 0.045, rib % 4 ? m.green : m.red), 0.12 + rib * 0.009, rib * 0.61, 0.03, 4.7);
  }
  for (let deck = 0; deck < 3; deck += 1) box(root, `CORPORATE__C06__CANTILEVERED_OBSERVATION_PLATFORM_${deck + 1}`, [3.6 - deck * 0.5, 0.22, 2.1], m.obsidian, [deck % 2 ? -1.2 : 1.2, 9.4 + deck * 4.1, 1.5]);
  box(root, 'CORPORATE__C06__SUMMIT_NEEDLE', [0.18, 5.2, 0.18], m.titanium, [0.2, 24.7, -0.45]);
  pulse(box(root, 'CORPORATE__C06__UNREACHED_SUMMIT_LIGHT', [0.24, 0.55, 0.24], m.green, [0.2, 26.8, -0.45]), 0.1, 0, 0.02, 4.8);
  sign(root, 'CORPORATE__C06__DIAGONAL_BASE_SIGN', 'VANTA VENTURE', 5.7, [0, 2.6, 3.05], '#ff3bca', [0, 0, -0.16]);
}

function addCovenant(root: THREE.Group, m: Materials) {
  box(root, 'CORPORATE__C07__FORTIFIED_CATHEDRAL_HALL', [7.8, 8.8, 8.2], m.basalt, [0, 4.4, -0.3], true);
  frustum(root, 'CORPORATE__C07__STEEPLY_POINTED_ROOF', [8.4, 8.8], [0.2, 7.2], 4.1, m.titanium, [0, 8.6, -0.3], true);
  for (const [index, x, z, sx, sz] of [[1, -5.2, 0, 4.8, 4.2], [2, 5.2, -0.4, 4.8, 4.2], [3, -2.1, -5, 4.6, 4.5], [4, 2.4, 4.8, 4.8, 4.2]] as const) box(root, `CORPORATE__C07__ASYMMETRICAL_COVENANT_WING_${index}`, [sx, 3.4, sz], m.ceramic, [x, 1.7, z], true);
  for (let pillar = 0; pillar < 12; pillar += 1) {
    const x = -5.45 + pillar * 0.99;
    const column = box(root, `CORPORATE__C07__INWARD_LEANING_PILLAR_${pillar + 1}`, [0.48, 6.8, 0.62], m.concrete, [x, 3.4, 4.25], true, [0, 0, x * -0.006]);
    if (pillar % 2 === 0) pulse(box(root, `CORPORATE__C07__SUSPENDED_LIGHT_BANNER_${pillar + 1}`, [0.12, 3.7, 0.06], pillar % 4 ? m.ultraviolet : m.amber, [x + 0.45, 4.1, 4.61]), 0.04, pillar * 0.6, 0.1, 3.5);
    column.userData.tribunalPillar = true;
  }
  for (const x of [-4.3, -1.45, 1.45, 4.3]) box(root, `CORPORATE__C07__BLACK_WATER_APPROACH_${x}`, [1.05, 0.05, 7.5], m.water, [x, 0.05, 5.7]);
  for (let figure = 0; figure < 13; figure += 1) {
    const angle = figure / 13 * TAU;
    const x = Math.cos(angle) * 3.25;
    const z = 7.7 + Math.sin(angle) * 2.15;
    cylinder(root, `CORPORATE__C07__FEATURELESS_SIGNATORY_${figure + 1}`, 0.38, 1.55, m.basalt, [x, 0.82, z], false, 8);
    sphere(root, `CORPORATE__C07__MIRRORED_IDENTITY_HEAD_${figure + 1}`, [0.52, 0.52, 0.52], m.mirror, [x, 1.82, z]);
  }
  sign(root, 'CORPORATE__C07__HOUSE_SIGN', 'COVENANT CAPITAL HOUSE', 6.7, [0, 7.4, 4.58], '#efffff');
  sign(root, 'CORPORATE__C07__PERMANENT_TERMS_WARNING', 'TERMS SURVIVE THEIR AUTHORS', 5.6, [0, 6.35, 4.6], '#ff2c42');
}

function addPatronage(root: THREE.Group, m: Materials) {
  cylinder(root, 'CORPORATE__C08__CENTRAL_PATRONAGE_CORE', 4.2, 10.4, m.obsidian, [0, 5.2, 0], true, 32);
  for (let ring = 0; ring < 6; ring += 1) {
    const assembly = prepare(new THREE.Group(), `CORPORATE__C08__ROTATING_CAPITAL_RING_${ring + 1}`);
    cylinder(assembly, `CORPORATE__C08__RING_SHELL_${ring + 1}`, 7.8 - ring * 0.52, 1.34, ring % 2 ? m.carbon : m.ceramic, [0, 0, 0], true, 36);
    torus(assembly, `CORPORATE__C08__SPIRAL_NEON_EDGE_${ring + 1}`, (7.8 - ring * 0.52) * 0.5, 0.075, ring % 2 ? m.magenta : m.amber, [0, 0.62, 0]);
    for (let fin = 0; fin < 12; fin += 1) {
      const angle = fin / 12 * TAU;
      box(assembly, `CORPORATE__C08__TURBINE_FIN_${ring + 1}_${fin + 1}`, [0.12, 1.5, 0.52], m.titanium, [Math.cos(angle) * (3.9 - ring * 0.26), 0, Math.sin(angle) * (3.9 - ring * 0.26)], false, [0, -angle, 0]);
    }
    assembly.position.y = 1.25 + ring * 1.48;
    rotate(assembly, (ring % 2 ? -1 : 1) * (0.0014 + ring * 0.0002));
    root.add(assembly);
  }
  cylinder(root, 'CORPORATE__C08__FLARED_ARCADE_COLLAR', 10.8, 0.8, m.carbon, [0, 1.15, 0], false, 36);
  for (let column = 0; column < 10; column += 1) {
    const angle = column / 10 * TAU;
    cylinder(root, `CORPORATE__C08__ACCUSATORY_ARCADE_COLUMN_${column + 1}`, 0.62, 2.2, m.basalt, [Math.cos(angle) * 4.35, 1.1, Math.sin(angle) * 4.35], true, 7);
  }
  for (let tree = 0; tree < 9; tree += 1) {
    const angle = tree / 9 * TAU;
    const x = Math.cos(angle) * 6.35;
    const z = Math.sin(angle) * 6.35;
    cylinder(root, `CORPORATE__C08__CARBON_TREE_TRUNK_${tree + 1}`, 0.18, 1.8, m.carbon, [x, 0.9, z]);
    sphere(root, `CORPORATE__C08__METALLIC_GRANT_CANOPY_${tree + 1}`, [1.3, 1.65, 1.3], tree % 3 ? m.titanium : m.magenta, [x, 2.25, z]);
  }
  cylinder(root, 'CORPORATE__C08__COLD_VAPOR_STACK', 1.25, 3.8, m.concrete, [0, 11.7, 0], true, 16);
  sign(root, 'CORPORATE__C08__APPLICATION_SIGN', 'APPLICATIONS ARE ALWAYS OPEN', 6.5, [0, 3.45, 5.45], '#efffff');
  sign(root, 'CORPORATE__C08__SELECTION_WARNING', 'SELECTION IS NOT', 4.2, [0, 2.58, 5.46], '#ff2b43');
}

function addLegacy(root: THREE.Group, m: Materials) {
  const stages = [[10.2, 8.4, 5.4], [7.8, 6.8, 5.6], [5.7, 5.5, 5.9]] as const;
  let y = 0;
  stages.forEach(([width, depth, height], index) => {
    box(root, `CORPORATE__C09__MAUSOLEUM_STAGE_${index + 1}`, [width, height, depth], index % 2 ? m.obsidian : m.basalt, [0, y + height * 0.5, -index * 0.25], true);
    y += height;
  });
  for (let vein = 0; vein < 16; vein += 1) {
    const x = -4.5 + vein * 0.6;
    pulse(pipe(root, `CORPORATE__C09__AMBER_GRANITE_VEIN_${vein + 1}`, new THREE.Vector3(x, 0.4, 4.23), new THREE.Vector3(x + Math.sin(vein) * 0.8, 5.2 + vein % 5 * 2.3, 4.23 - Math.min(vein, 7) * 0.02), 0.035, m.amber), 0.028, vein * 0.44, 0.06, 2.6);
  }
  for (let marker = 0; marker < 20; marker += 1) box(root, `CORPORATE__C09__PROJECT_GRAVE_MARKER_${marker + 1}`, [0.62, 0.45 + marker % 3 * 0.15, 0.22], marker % 5 === 0 ? m.red : m.concrete, [-5.2 + marker % 10 * 1.15, 0.24, 5.4 + Math.floor(marker / 10) * 1.05]);
  for (const x of [-2.2, 2.2]) box(root, `CORPORATE__C09__MONUMENTAL_ARCH_JAMB_${x < 0 ? 'WEST' : 'EAST'}`, [0.55, 5.2, 0.7], m.basalt, [x, 2.6, 4.48], true);
  box(root, 'CORPORATE__C09__MONUMENTAL_ARCH_LINTEL', [5, 0.55, 0.7], m.basalt, [0, 5, 4.48], true);
  pulse(torus(root, 'CORPORATE__C09__SUSPENDED_ENDOWMENT_CIRCLE', 1.4, 0.1, m.amber, [0, 3.2, 4.85], [0, 0, 0]), 0.018, 0, 0.1, 2.8);
  for (let fin = 0; fin < 18; fin += 1) box(root, `CORPORATE__C09__FUNERARY_CANDLE_FIN_${fin + 1}`, [0.18, 1.4 + fin % 3 * 0.35, 0.32], fin % 4 ? m.titanium : m.white, [-4.45 + fin * 0.52, 17.7 + fin % 3 * 0.17, -0.5]);
  sign(root, 'CORPORATE__C09__CARVED_NAME', 'LEGACY ENDOWMENT', 6.1, [0, 10.1, 3.45], '#f2ffff');
  sign(root, 'CORPORATE__C09__CONTINUITY_COUNTER', 'MODEL HORIZON 1487 YEARS', 5.2, [0, 8.95, 3.47], '#b17aff');
}

function addPatentAuction(root: THREE.Group, m: Materials) {
  const auctionGeometry = new THREE.IcosahedronGeometry(5.6, 0);
  const auctionElementCount = auctionGeometry.index?.count ?? auctionGeometry.getAttribute('position').count;
  for (let offset = 0, face = 0; offset < auctionElementCount; offset += 3, face += 1) {
    auctionGeometry.addGroup(offset, 3, face % 3);
  }
  const polyhedron = prepare(new THREE.Mesh(auctionGeometry, [m.mirror, m.carbon, m.obsidian]), 'CORPORATE__C10__FACETED_AUCTION_POLYHEDRON', true);
  polyhedron.userData.primaryAuctionMass = true;
  polyhedron.scale.set(1, 1.05, 0.9);
  polyhedron.position.set(0, 5.9, -0.6);
  polyhedron.rotation.set(0.13, 0.28, -0.08);
  root.add(polyhedron);
  for (let panel = 0; panel < 15; panel += 1) {
    const angle = panel / 15 * TAU;
    const mat = panel % 5 === 0 ? m.red : panel % 2 ? m.magenta : m.cyan;
    pulse(box(root, `CORPORATE__C10__AUCTION_STATE_PANEL_${panel + 1}`, [0.06, 2 + panel % 4 * 0.55, 0.08], mat, [Math.cos(angle) * 5.15, 5.7 + Math.sin(panel * 1.7) * 2.4, Math.sin(angle) * 4.55], false, [0, -angle, angle * 0.08]), 0.045, panel * 0.5, 0.02, 3.7);
  }
  for (let lot = 0; lot < 12; lot += 1) {
    const angle = lot / 12 * TAU;
    cylinder(root, `CORPORATE__C10__SEALED_LOT_PLINTH_${lot + 1}`, 0.95, 1.05, m.basalt, [Math.cos(angle) * 7.0, 0.53, Math.sin(angle) * 6.1], true, 8);
    box(root, `CORPORATE__C10__OPAQUE_LOT_COVER_${lot + 1}`, [0.68, 0.62, 0.68], m.obsidian, [Math.cos(angle) * 7.0, 1.35, Math.sin(angle) * 6.1]);
  }
  for (let bid = 0; bid < 7; bid += 1) pulse(box(root, `CORPORATE__C10__ROOF_BID_COLUMN_${bid + 1}`, [0.16, 1.2 + bid * 0.7, 0.16], bid % 3 ? m.magenta : m.cyan, [-2.4 + bid * 0.8, 11.2 + bid * 0.35, -0.4]), 0.055, bid, 0.08, 4.2);
  for (const x of [-1.45, 1.45]) frustum(root, `CORPORATE__C10__TRIANGULAR_ENTRY_CANYON_${x < 0 ? 'WEST' : 'EAST'}`, [2.4, 5.2], [0.9, 3.2], 4.2, m.carbon, [x * 1.55, 0, 4.8], true, [x * -0.2, -0.6]);
  sign(root, 'CORPORATE__C10__HOVERING_AUCTION_SIGN', 'SILENT PATENT AUCTION', 6.7, [0, 10.5, 5.25], '#efffff');
  sign(root, 'CORPORATE__C10__HOVERING_LOT_SIGN', 'LOT 0000 / RESTRICTED', 4.7, [0, 9.3, 5.3], '#ff39c7');
}

function addUmbra(root: THREE.Group, m: Materials) {
  for (const side of [-1, 1]) {
    const shell = sphere(root, `CORPORATE__C11__ARMORED_UNDERWRITING_SHELL_${side < 0 ? 'WEST' : 'EAST'}`, [5.4, 6.6, 10.2], m.titanium, [side * 4, 0.25, -0.8], true, 32);
    shell.userData.impactShell = true;
    shell.userData.delimiterPassageSide = side < 0 ? 'west' : 'east';
  }
  for (let plate = 0; plate < 13; plate += 1) {
    const z = -4.7 + plate * 0.78;
    const width = 13.4 - Math.abs(plate - 6) * 0.55;
    box(root, `CORPORATE__C11__OVERLAPPING_TITANIUM_PLATE_${plate + 1}`, [width, 0.28, 1.0], plate % 2 ? m.titanium : m.carbon, [0, 4.7 - Math.abs(plate - 6) * 0.34, z], false, [0.03 * Math.sin(plate), 0, 0]);
    pulse(box(root, `CORPORATE__C11__BLUE_ARMOR_SEAM_${plate + 1}`, [width - 0.25, 0.045, 0.05], m.cyan, [0, 4.52 - Math.abs(plate - 6) * 0.34, z + 0.52]), 0.045, plate * 0.36, 0.06, 3.3);
  }
  for (const side of [-1, 1]) for (let buttress = 0; buttress < 6; buttress += 1) frustum(root, `CORPORATE__C11__IMPACT_BUTTRESS_${side < 0 ? 'WEST' : 'EAST'}_${buttress + 1}`, [1.15, 2.2], [0.45, 1.25], 3.7, m.basalt, [side * (5.9 + buttress * 0.12), 0, -3.5 + buttress * 1.35], true, [side * -0.2, 0]);
  box(root, 'CORPORATE__C11__DESCENDING_INSURANCE_FORECOURT', [10.2, 0.16, 6.4], m.concrete, [0, 0.04, 5.3], false, [-0.035, 0, 0]);
  for (let channel = 0; channel < 9; channel += 1) {
    const angle = -0.7 + channel / 8 * 1.4;
    pipe(root, `CORPORATE__C11__ULTRAVIOLET_DRAINAGE_CHANNEL_${channel + 1}`, new THREE.Vector3(0, 0.1, 3.2), new THREE.Vector3(Math.sin(angle) * 6.8, 0.1, 8.5), 0.055, m.ultraviolet);
  }
  const shieldPositions = [-6.2, -3.8, 3.2, 5.4, 7.2];
  for (let shield = 0; shield < 5; shield += 1) {
    const x = shieldPositions[shield];
    box(root, `CORPORATE__C11__MONUMENTAL_RISK_SHIELD_${shield + 1}`, [1.35, 2.4, 0.28], m.basalt, [x, 1.2, 7.3], true, [0, 0, (shield - 2) * 0.04]);
    pulse(box(root, `CORPORATE__C11__INSURED_DISTRICT_MAP_${shield + 1}`, [0.75, 0.72, 0.04], shield % 2 ? m.cyan : m.red, [x, 1.45, 7.46]), 0.035, shield, 0.06, 3.4);
  }
  for (let rod = 0; rod < 8; rod += 1) cylinder(root, `CORPORATE__C11__LIGHTNING_CAPTURE_ROD_${rod + 1}`, 0.08, 3.2 - Math.abs(rod - 3.5) * 0.25, m.titanium, [-5.2 + rod * 1.5, 6.8 - Math.abs(rod - 3.5) * 0.18, -0.8], false, 8);
  sign(root, 'CORPORATE__C11__UNDERWRITING_SIGN', 'UMBRA UNDERWRITING', 7.1, [0, 3.4, 5.3], '#61eaff');
  sign(root, 'CORPORATE__C11__COVERAGE_WARNING', 'SURVIVAL IS NOT COVERAGE', 5.3, [0, 2.4, 5.35], '#ff2942');
}

function addCatastrophe(root: THREE.Group, m: Materials) {
  box(root, 'CORPORATE__C12__REFLECTIVE_RISK_HALF', [3.65, 20.7, 6.8], m.mirror, [-1.88, 10.35, 0], true);
  box(root, 'CORPORATE__C12__ABSORPTIVE_RISK_HALF', [3.65, 20.7, 6.8], m.concrete, [1.88, 10.35, 0], true);
  const fault: THREE.Vector3[] = [new THREE.Vector3(0, 0.1, 3.45)];
  for (let point = 1; point <= 13; point += 1) fault.push(new THREE.Vector3((point % 2 ? -1 : 1) * (0.18 + point % 3 * 0.09), point * 1.58, 3.45));
  for (let segment = 0; segment < fault.length - 1; segment += 1) pulse(pipe(root, `CORPORATE__C12__LIVING_RED_FAULT_${segment + 1}`, fault[segment], fault[segment + 1], 0.095, m.red), 0.075, segment * 0.48, 0.35, 4.9);
  for (let branch = 0; branch < 7; branch += 1) {
    const y = 3 + branch * 2.5;
    pipe(root, `CORPORATE__C12__RISK_MODEL_BRANCH_${branch + 1}`, new THREE.Vector3(branch % 2 ? -0.18 : 0.18, y, 3.46), new THREE.Vector3((branch % 2 ? -1 : 1) * (1.2 + branch % 3 * 0.4), y + 0.8, 3.46), 0.055, m.red);
    sign(root, `CORPORATE__C12__UNIDENTIFIED_PERCENTAGE_${branch + 1}`, `${3 + branch * 7}.${branch}%`, 1.25, [(branch % 2 ? -1 : 1) * 2.1, y + 0.9, 3.53], '#ffb44e');
  }
  torus(root, 'CORPORATE__C12__HISTORICAL_DISASTER_GRAPH_WALL', 5.1, 0.5, m.basalt, [0, 0.45, 0]);
  for (let spike = 0; spike < 12; spike += 1) {
    const angle = spike / 12 * TAU;
    pulse(box(root, `CORPORATE__C12__DISASTER_WAVEFORM_SPIKE_${spike + 1}`, [0.08, 0.6 + spike % 4 * 0.5, 0.08], spike % 4 ? m.amber : m.red, [Math.cos(angle) * 5.1, 0.9 + spike % 4 * 0.25, Math.sin(angle) * 5.1]), 0.05, spike * 0.4, 0.05, 4.2);
  }
  for (const side of [-1, 1]) pipe(root, `CORPORATE__C12__ASYMMETRICAL_ANTENNA_${side < 0 ? 'WEST' : 'EAST'}`, new THREE.Vector3(side * 1.5, 20.7, 0), new THREE.Vector3(side * 3.6, 24.1, -0.5), 0.12, m.titanium);
  pipe(root, 'CORPORATE__C12__SUSPENDED_BEACON_CABLE', new THREE.Vector3(-3.6, 24.1, -0.5), new THREE.Vector3(3.6, 24.1, -0.5), 0.035, m.titanium);
  pulse(sphere(root, 'CORPORATE__C12__SUSPENDED_WARNING_BEACON', [0.42, 0.42, 0.42], m.red, [0, 24.1, -0.5]), 0.09, 0, 0.5, 5);
  sign(root, 'CORPORATE__C12__FRACTURED_TOWER_SIGN', 'CATASTROPHE BOND TOWER', 6.7, [0, 17.3, 3.55], '#f1ffff');
}

function addArbitration(root: THREE.Group, m: Materials) {
  box(root, 'CORPORATE__C13__VOLCANIC_STONE_NAVE', [12.4, 6.7, 8.6], m.basalt, [0, 3.35, -0.7], true);
  for (let pillar = 0; pillar < 24; pillar += 1) {
    const x = -6.3 + pillar * 0.55;
    box(root, `CORPORATE__C13__COLOSSAL_SQUARE_PILLAR_${pillar + 1}`, [0.36, 5.8, 0.6], m.concrete, [x, 2.9, 3.88], true);
  }
  for (let grid = 0; grid < 11; grid += 1) {
    box(root, `CORPORATE__C13__RED_LEGAL_GRID_VERTICAL_${grid + 1}`, [0.045, 6.3, 0.04], m.red, [-5.5 + grid * 1.1, 3.35, 4.2]);
    if (grid < 7) box(root, `CORPORATE__C13__RED_LEGAL_GRID_HORIZONTAL_${grid + 1}`, [11.8, 0.045, 0.04], m.red, [0, 0.5 + grid * 0.88, 4.2]);
  }
  for (let stair = 0; stair < 9; stair += 1) box(root, `CORPORATE__C13__MONUMENTAL_SHALLOW_STAIR_${stair + 1}`, [14.6 - stair * 0.45, 0.14, 0.72], m.concrete, [0, 0.07 + stair * 0.11, 4.8 + stair * 0.62]);
  pipe(root, 'CORPORATE__C13__CENTRAL_APPROACH_LINE', new THREE.Vector3(0, 0.23, 10.2), new THREE.Vector3(0, 0.92, 6.7), 0.08, m.white);
  pipe(root, 'CORPORATE__C13__CONFLICTING_ROUTE_A', new THREE.Vector3(0, 0.92, 6.7), new THREE.Vector3(-2.3, 1.15, 5.1), 0.08, m.red);
  pipe(root, 'CORPORATE__C13__CONFLICTING_ROUTE_B', new THREE.Vector3(0, 0.92, 6.7), new THREE.Vector3(2.3, 1.15, 5.1), 0.08, m.ultraviolet);
  for (const side of [-1, 1]) {
    cylinder(root, `CORPORATE__C13__GEOMETRIC_SCALE_POST_${side < 0 ? 'A' : 'B'}`, 0.22, 3.4, m.titanium, [side * 5.25, 2.6, 7.8], false, 8);
    pipe(root, `CORPORATE__C13__UNEQUAL_SCALE_ARM_${side < 0 ? 'A' : 'B'}`, new THREE.Vector3(side * 7, 4.0 + side * 0.35, 7.8), new THREE.Vector3(side * 3.6, 4.0 - side * 0.35, 7.8), 0.12, m.titanium);
    sign(root, `CORPORATE__C13__SCALE_VALUE_${side < 0 ? 'A' : 'B'}`, `${side < 0 ? 'A 47' : 'B 53'}`, 1.65, [side * 5.25, 1.4, 8.0], '#ff3048');
  }
  box(root, 'CORPORATE__C13__OFF_CENTER_JUDGMENT_TOWER', [2.1, 5.2, 2.1], m.obsidian, [3.9, 9.3, -1.3], true);
  for (let strip = 0; strip < 4; strip += 1) box(root, `CORPORATE__C13__CARDINAL_AMBER_STRIP_${strip + 1}`, [0.12, 2.6, 0.06], m.amber, [3.2 + strip * 0.48, 10, -0.22]);
  sign(root, 'CORPORATE__C13__BASILICA_SIGN', 'ARBITRATION BASILICA', 6.3, [0, 5.5, 4.25], '#efffff');
  sign(root, 'CORPORATE__C13__CONSENT_INSCRIPTION', 'CONSENT IS RECORDED', 5.2, [0, 4.6, 4.27], '#9a64ff');
}

function addEventHorizon(root: THREE.Group, m: Materials) {
  torus(root, 'CORPORATE__C14__PARTIALLY_EMBEDDED_CONVENTION_TORUS', 5.1, 2.15, m.glass, [0, 1.25, 0], [Math.PI * 0.5, 0, 0], TAU, 72);
  box(root, 'CORPORATE__C14__RAISED_ENTRANCE_SECTOR', [5.4, 6.8, 4.3], m.carbon, [0, 3.4, 3.55], true, [-0.08, 0, 0]);
  for (let rib = 0; rib < 22; rib += 1) {
    const angle = rib / 22 * TAU;
    pipe(root, `CORPORATE__C14__GRAVITATIONAL_CARBON_RIB_${rib + 1}`, new THREE.Vector3(Math.cos(angle) * 3.5, 0.3, Math.sin(angle) * 3.5), new THREE.Vector3(Math.cos(angle) * 6.75, 1.7, Math.sin(angle) * 6.75), 0.1, m.carbon);
  }
  pulse(torus(root, 'CORPORATE__C14__ACCELERATING_CYAN_INFORMATION_BAND', 6.15, 0.095, m.cyan, [0, 1.55, 0]), 0.085, 0, 0.25, 4.3);
  cylinder(root, 'CORPORATE__C14__CENTRAL_VOID_PLAZA', 6.6, 0.08, m.obsidian, [0, 0.04, 0], false, 48);
  cylinder(root, 'CORPORATE__C14__RAIN_FILLED_CENTRAL_DEPRESSION', 2.5, 0.05, m.water, [0, 0.08, 0], false, 40);
  for (let pylon = 0; pylon < 10; pylon += 1) {
    const angle = pylon / 10 * TAU;
    box(root, `CORPORATE__C14__CORRUPTED_EVENT_BANNER_PYLON_${pylon + 1}`, [0.28, 4.1, 0.28], m.titanium, [Math.cos(angle) * 7.3, 2.05, Math.sin(angle) * 7.3]);
    pulse(box(root, `CORPORATE__C14__LIGHT_BANNER_${pylon + 1}`, [0.55, 2.4, 0.06], pylon % 3 ? m.ultraviolet : m.cyan, [Math.cos(angle) * 7.15, 2.5, Math.sin(angle) * 7.15], false, [0, -angle, 0]), 0.04, pylon, 0.08, 3.6);
  }
  for (let fin = 0; fin < 36; fin += 1) {
    const angle = fin / 36 * TAU;
    box(root, `CORPORATE__C14__DARK_CROWN_FIN_${fin + 1}`, [0.12, 1.2 + fin % 4 * 0.18, 0.45], fin % 7 ? m.carbon : m.cyan, [Math.cos(angle) * 5.55, 4.0, Math.sin(angle) * 5.55], false, [0, -angle, 0]);
  }
  sign(root, 'CORPORATE__C14__EVENT_HORIZON_SIGN', 'EVENT HORIZON', 6.6, [0, 6.3, 5.74], '#efffff');
  sign(root, 'CORPORATE__C14__CONVENTION_SUBTITLE', 'CONVENTION CENTRE', 4.2, [0, 5.35, 5.76], '#69eaff');
}

function addMourningstar(root: THREE.Group, m: Materials) {
  dome(root, 'CORPORATE__C15__BLACK_SUN_DOME', 5.8, m.ceramic, [0, 0.1, 0], true);
  for (let seam = 0; seam < 5; seam += 1) pulse(torus(root, `CORPORATE__C15__THERMAL_DOME_SEAM_${seam + 1}`, 1.35 + seam * 0.85, 0.055, m.red, [0, 0.18 + seam * 0.35, 0], [Math.PI * 0.5, 0, 0]), 0.035, seam * 0.7, 0.08, 3.5);
  for (let wing = 0; wing < 12; wing += 1) {
    const angle = wing / 12 * TAU;
    const pavilion = cylinder(root, `CORPORATE__C15__TRIANGULAR_DISTRICT_WING_${wing + 1}`, 6.2, 0.7, m.carbon, [Math.cos(angle) * 5.8, 0.35, Math.sin(angle) * 5.8], true, 3, [0, -angle + Math.PI / 6, 0]);
    pavilion.scale.z = 0.42;
    box(root, `CORPORATE__C15__CONCLUSION_PYLON_${wing + 1}`, [0.3, 3.1, 0.3], m.titanium, [Math.cos(angle) * 8.7, 1.55, Math.sin(angle) * 8.7]);
    pulse(box(root, `CORPORATE__C15__DISTRICT_WORD_LIGHT_${wing + 1}`, [0.38, 1.8, 0.06], m.cyan, [Math.cos(angle) * 8.55, 1.8, Math.sin(angle) * 8.55], false, [0, -angle, 0]), 0.04, wing * 0.5, 0.08, 3.2);
  }
  for (let line = 0; line < 5; line += 1) {
    const startX = -2.4 + line * 1.2;
    pipe(root, `CORPORATE__C15__CONVERGING_AMBER_AVENUE_${line + 1}`, new THREE.Vector3(startX, 0.15, 11.2), new THREE.Vector3(startX * 0.18, 0.15, 5.7), 0.075, m.amber);
  }
  cylinder(root, 'CORPORATE__C15__VOTE_SPHERE_BASIN', 4.3, 0.15, m.water, [0, 0.08, 7.2], false, 36);
  sphere(root, 'CORPORATE__C15__MONUMENTAL_VOTE_SPHERE', [2.5, 2.5, 2.5], m.obsidian, [0, 2.8, 7.2], true, 28);
  rotate(torus(root, 'CORPORATE__C15__ROTATING_EQUATORIAL_VOTE_LINE', 1.28, 0.075, m.red, [0, 2.8, 7.2], [Math.PI * 0.5, 0, 0]), 0.003, 'z');
  cylinder(root, 'CORPORATE__C15__BLUNT_DOME_SPIRE', 1.1, 2.6, m.basalt, [0, 7, 0], true, 12);
  torus(root, 'CORPORATE__C15__ARTIFICIAL_BLACK_SUN_RING', 1.15, 0.13, m.white, [0, 8.15, 0]);
  sign(root, 'CORPORATE__C15__MOURNINGSTAR_SIGN', 'MOURNINGSTAR', 6.2, [0, 4.25, 4.3], '#ff3acb');
}

function addEclipseExpo(root: THREE.Group, m: Materials) {
  const forms = ['CUBE', 'WEDGE', 'CYLINDER', 'PYRAMID', 'FOLDED_SLAB', 'DRUM', 'VAULT'] as const;
  for (let pavilion = 0; pavilion < 7; pavilion += 1) {
    const angle = pavilion / 7 * TAU;
    const x = Math.cos(angle) * 4.1;
    const z = Math.sin(angle) * 3.7;
    const mat = pavilion % 2 ? m.carbon : m.ceramic;
    if (pavilion === 2 || pavilion === 5) cylinder(root, `CORPORATE__C16__${forms[pavilion]}_PAVILION_${pavilion + 1}`, 3.2, 3.2 + pavilion % 3, mat, [x, 1.6 + pavilion % 3 * 0.5, z], true, pavilion === 2 ? 28 : 10);
    else if (pavilion === 1 || pavilion === 3) frustum(root, `CORPORATE__C16__${forms[pavilion]}_PAVILION_${pavilion + 1}`, [3.5, 3], [1.5 + pavilion % 2, 1.4], 3.5 + pavilion % 2, mat, [x, 0, z], true, [pavilion === 1 ? 0.7 : 0, 0]);
    else box(root, `CORPORATE__C16__${forms[pavilion]}_PAVILION_${pavilion + 1}`, [3.25, 3.1 + pavilion % 3, 2.8], mat, [x, 1.55 + pavilion % 3 * 0.5, z], true, [0, -angle, pavilion === 4 ? -0.18 : 0]);
    const light = [m.cyan, m.magenta, m.green, m.amber, m.red, m.cyan, m.ultraviolet][pavilion];
    box(root, `CORPORATE__C16__CATEGORY_LIGHT_${pavilion + 1}`, [0.12, 2.5, 0.06], light, [x, 2.6, z + 1.55]);
  }
  const canopy = prepare(new THREE.Mesh(new THREE.RingGeometry(2.0, 7.8, 64), m.mirror), 'CORPORATE__C16__SUSPENDED_ECLIPSE_CANOPY');
  canopy.rotation.x = -Math.PI * 0.5;
  canopy.position.y = 6.2;
  root.add(canopy);
  torus(root, 'CORPORATE__C16__COLD_ARTIFICIAL_DAYLIGHT_APERTURE', 2.0, 0.16, m.white, [0, 6.2, 0]);
  torus(root, 'CORPORATE__C16__ULTRAVIOLET_CANOPY_EDGE', 7.8, 0.1, m.ultraviolet, [0, 6.2, 0]);
  for (let portal = 0; portal < 7; portal += 1) {
    const angle = portal / 7 * TAU;
    box(root, `CORPORATE__C16__CONCEALED_LOADING_PORTAL_${portal + 1}`, [1.4, 2.0, 0.18], m.obsidian, [Math.cos(angle) * 7.2, 1, Math.sin(angle) * 6.7], true, [0, -angle, 0]);
    box(root, `CORPORATE__C16__ACTIVE_RED_PORTAL_OUTLINE_${portal + 1}`, [1.55, 0.06, 0.05], m.red, [Math.cos(angle) * 7.2, 2.02, Math.sin(angle) * 6.7], false, [0, -angle, 0]);
  }
  sign(root, 'CORPORATE__C16__FLOATING_EXPO_SIGN', 'ECLIPSE EXPO', 5.8, [0, 7.7, 0], '#efffff');
}

function addFundingCrucible(root: THREE.Group, m: Materials) {
  torus(root, 'CORPORATE__C17__BLACK_CRATER_RETAINING_WALL', 6.0, 0.72, m.basalt, [0, 0.15, 0]);
  const crucible = frustum(root, 'CORPORATE__C17__SUNKEN_INVERTED_SELECTION_PYRAMID', [3.0, 3.0], [10.4, 10.4], 4.6, m.carbon, [0, -4.1, 0], true);
  crucible.userData.sunkenArchitecture = true;
  for (let perforation = 0; perforation < 42; perforation += 1) {
    const angle = perforation / 42 * TAU;
    const radius = 2.0 + perforation % 5 * 0.7;
    pulse(box(root, `CORPORATE__C17__PERFORATED_PROJECT_LIGHT_${perforation + 1}`, [0.055, 0.42, 0.055], perforation % 3 ? m.magenta : m.cyan, [Math.cos(angle) * radius, -2.8 + perforation % 7 * 0.55, Math.sin(angle) * radius]), 0.08, perforation * 0.24, 0.02, 4.2);
  }
  for (let bridge = 0; bridge < 4; bridge += 1) {
    const angle = bridge / 4 * TAU;
    const center = new THREE.Vector3(Math.cos(angle) * 4.3, 0.35, Math.sin(angle) * 4.3);
    const value = box(root, `CORPORATE__C17__SUSPENDED_DARK_GLASS_BRIDGE_${bridge + 1}`, [1.4, 0.18, 8.2], m.glass, [center.x, center.y, center.z], false, [0, -angle, 0]);
    value.userData.walkable = true;
    box(root, `CORPORATE__C17__BRIDGE_RED_UNDERLIGHT_${bridge + 1}`, [0.16, 0.05, 8.0], m.red, [center.x, 0.24, center.z], false, [0, -angle, 0]);
  }
  for (let fin = 0; fin < 18; fin += 1) {
    const angle = fin / 18 * TAU;
    box(root, `CORPORATE__C17__SPONSOR_CROWN_FIN_${fin + 1}`, [0.24, 3.3, 0.6], fin % 5 ? m.titanium : m.red, [Math.cos(angle) * 6.8, 1.65, Math.sin(angle) * 6.8], false, [0, -angle, 0]);
  }
  pulse(cylinder(root, 'CORPORATE__C17__DEEP_HEARTBEAT', 1.55, 0.3, m.red, [0, -3.7, 0], false, 28), 0.65, 0, 0.1, 5.2);
  sign(root, 'CORPORATE__C17__CRUCIBLE_DECLARATION', 'SUBMIT / DEFEND / SURVIVE', 6.5, [0, 2.4, 6.45], '#ff334b');
}

function addLastProspectus(root: THREE.Group, m: Materials) {
  // Preserve the 210-degree legacy delimiter as one of the media canyons.
  const pagePositions = [-9.0, -3.8, -1.2, 2.2, 5.2];
  for (let page = 0; page < 5; page += 1) {
    const x = pagePositions[page];
    const height = 9.4 + page % 3 * 2.2;
    box(root, `CORPORATE__C18__FOLDED_BLACK_PAGE_${page + 1}`, [2.65, height, 6.7], page % 2 ? m.glass : m.basalt, [x, height * 0.5, -Math.abs(page - 2) * 0.35], true, [0, (page - 2) * -0.08, (page - 2) * 0.055]);
    box(root, `CORPORATE__C18__ILLUMINATED_PAGE_MARGIN_${page + 1}`, [0.08, height + 0.2, 0.08], m.white, [x + 1.35, height * 0.5, 3.0 - Math.abs(page - 2) * 0.35]);
    if (page < 4) pulse(box(root, `CORPORATE__C18__CONTROLLED_MEDIA_SCREEN_${page + 1}`, [1.9, 4.4, 0.08], page % 3 ? m.cyan : m.red, [x + 1.15, 4.2, 3.15 - Math.abs(page - 2) * 0.35], false, [0, (page - 2) * -0.08, 0]), 0.035, page, 0.08, 3.2);
  }
  for (let terrace = 0; terrace < 6; terrace += 1) box(root, `CORPORATE__C18__PRESS_FORECOURT_TERRACE_${terrace + 1}`, [11.5 - terrace * 1.0, 0.12, 0.8], m.concrete, [0, 0.06 + terrace * 0.08, 4.6 + terrace * 0.68]);
  for (let zone = 0; zone < 9; zone += 1) box(root, `CORPORATE__C18__MAGENTA_CAMERA_POSITION_${zone + 1}`, [0.08, 0.04, 1.6], m.magenta, [-4.4 + zone * 1.1, 0.35, 6.2 + zone % 2 * 0.45]);
  for (let pylon = 0; pylon < 5; pylon += 1) cylinder(root, `CORPORATE__C18__BROADCAST_UNIT_PYLON_${pylon + 1}`, 0.3, 2.6, m.titanium, [-4 + pylon * 2, 1.3, 8], false, 10);
  for (let array = 0; array < 3; array += 1) rotate(box(root, `CORPORATE__C18__ROTATING_ROOF_ANTENNA_${array + 1}`, [3.4, 0.22, 1.6], m.carbon, [-3 + array * 3, 13.2 - Math.abs(array - 1) * 1.5, -0.5]), 0.002 + array * 0.0006);
  pulse(box(root, 'CORPORATE__C18__SELF_DELETING_BASE_TICKER', [10.8, 0.18, 0.08], m.cyan, [0, 0.55, 3.45]), 0.05, 0, 0.03, 3.4);
  sign(root, 'CORPORATE__C18__PROSPECTUS_SIGN', 'THE LAST PROSPECTUS', 7.0, [0, 9.6, 3.58], '#69eaff');
  sign(root, 'CORPORATE__C18__INCIDENT_CAPTION', 'STATEMENT PENDING', 5.0, [0, 6.0, 3.62], '#ff2c44');
}

function addNocturne(root: THREE.Group, m: Materials) {
  let y = 0;
  for (let volume = 0; volume < 9; volume += 1) {
    const height = 1.85 + volume % 3 * 0.18;
    const x = Math.sin(volume * 1.7) * 0.62;
    const z = Math.cos(volume * 1.3) * 0.5;
    cylinder(root, `CORPORATE__C19__OFFSET_DELEGATION_VOLUME_${volume + 1}`, 6.1 - volume * 0.08, height, volume % 2 ? m.glass : m.obsidian, [x, y + height * 0.5, z], true, 32);
    pulse(torus(root, `CORPORATE__C19__DELEGATION_FREQUENCY_BAND_${volume + 1}`, (6.1 - volume * 0.08) * 0.5, 0.075, [m.cyan, m.magenta, m.amber, m.green, m.ultraviolet][volume % 5], [x, y + height - 0.08, z]), 0.035 + volume * 0.003, volume * 0.6, 0.1, 3.5);
    y += height;
  }
  cylinder(root, 'CORPORATE__C19__OFF_CENTER_DISC_CANOPY', 8.3, 0.45, m.carbon, [0, 1.2, 4.4], false, 36);
  cylinder(root, 'CORPORATE__C19__OFF_CENTER_CANOPY_COLUMN', 0.5, 3.6, m.titanium, [-2.3, 1.8, 4.4], true, 12);
  for (let flag = 0; flag < 20; flag += 1) {
    const angle = flag / 20 * TAU;
    const x = Math.cos(angle) * 7.1;
    const z = Math.sin(angle) * 6.5;
    cylinder(root, `CORPORATE__C19__FLAGLESS_POLE_${flag + 1}`, 0.08, 3.6, m.titanium, [x, 1.8, z], false, 8);
    const flagMat = [m.cyan, m.magenta, m.amber, m.green, m.ultraviolet][flag % 5];
    box(root, `CORPORATE__C19__RIGID_LIGHT_FLAG_${flag + 1}`, [0.9, 2.4, 0.035], flagMat, [x + Math.cos(angle) * 0.45, 2.4, z + Math.sin(angle) * 0.45], false, [0, -angle, 0]);
  }
  for (let bridge = 0; bridge < 3; bridge += 1) {
    const angle = -0.48 + bridge * 0.48;
    box(root, `CORPORATE__C19__OPAQUE_SKYBRIDGE_${bridge + 1}`, [1.35, 1.25, 7.5], m.glass, [Math.sin(angle) * 3.5, 7 + bridge * 3.6, Math.cos(angle) * 3.5], true, [0, -angle, 0]);
  }
  cylinder(root, 'CORPORATE__C19__TARGETING_RETICLE_CROWN', 8, 0.38, m.carbon, [0.2, y + 0.2, 0], false, 36);
  pulse(torus(root, 'CORPORATE__C19__RED_RETICLE_LIGHT', 4, 0.11, m.red, [0.2, y + 0.22, 0]), 0.08, 0, 0.2, 4.6);
  sign(root, 'CORPORATE__C19__DAMAGED_NOCTURNE_SIGN', 'N O C T U R N E', 5.7, [0, 10.6, 3.2], '#efffff', [0, 0, Math.PI * 0.5]);
  sign(root, 'CORPORATE__C19__DELEGATION_SUBTITLE', 'DELEGATION TOWER', 4.2, [0, 2.0, 3.35], '#ff2d45');
}

function addConsensusCrown(root: THREE.Group, m: Materials) {
  for (const side of [-1, 1]) {
    for (let segment = 0; segment < 9; segment += 1) {
      const t = segment / 8;
      const x = side * (6.1 - t * 4.9);
      const y = 0.9 + t * 13.1;
      const z = -0.8 + Math.sin(t * Math.PI) * 0.6;
      const tilt = side * (-0.1 - t * 0.34);
      box(root, `CORPORATE__C20__${side < 0 ? 'WEST' : 'EAST'}_CURVED_OBSIDIAN_WING_${segment + 1}`, [2.1, 2.6, 5.3], segment % 2 ? m.obsidian : m.ceramic, [x, y, z], true, [0, 0, tilt]);
      pulse(box(root, `CORPORATE__C20__${side < 0 ? 'WEST' : 'EAST'}_INTERRUPTED_ULTRAVIOLET_ARC_${segment + 1}`, [0.1, 2.25, 0.08], m.ultraviolet, [x - side * 1.08, y, 1.9], false, [0, 0, tilt]), 0.04, segment * 0.42 + side, 0.12, 3.8);
    }
  }
  cylinder(root, 'CORPORATE__C20__BLACK_MIRROR_CONSENSUS_PLAZA', 11.4, 0.1, m.mirror, [0, 0.05, 1.5], false, 48);
  box(root, 'CORPORATE__C20__UNEQUAL_RED_DIVISION', [0.08, 0.035, 11.1], m.red, [0.7, 0.12, 1.5]);
  for (let seat = 0; seat < 40; seat += 1) {
    const angle = seat / 40 * TAU;
    const x = Math.cos(angle) * 5.2;
    const z = 1.5 + Math.sin(angle) * 5.2;
    box(root, `CORPORATE__C20__INWARD_JUDICIAL_SEAT_${seat + 1}`, [0.55, 0.48, 0.72], m.basalt, [x, 0.28, z], false, [0, -angle - Math.PI * 0.5, 0]);
  }
  cylinder(root, 'CORPORATE__C20__FEATURELESS_BLACK_PODIUM', 1.3, 1.55, m.basalt, [0, 0.78, 1.5], true, 20);
  for (let ring = 0; ring < 5; ring += 1) pulse(torus(root, `CORPORATE__C20__EXPANDING_ACCORD_RING_${ring + 1}`, 1.1 + ring * 0.72, 0.065, m.cyan, [0, 0.13, 1.5]), 0.05 + ring * 0.006, ring * 0.65, 0.05, 4.0);
  sign(root, 'CORPORATE__C20__CROWN_SIGN', 'CROWN OF CONSENSUS', 6.7, [0, 10.2, 2.05], '#f2ffff');
  sign(root, 'CORPORATE__C20__COMPLIANCE_FLICKER', 'CONSENSUS / COMPLIANCE', 5.8, [0, 8.9, 2.07], '#a66dff');
}

const BUILDERS: readonly ((root: THREE.Group, materials: Materials) => void)[] = [
  addNullExchange,
  addObsidianReserve,
  addBlackLedger,
  addQuantumClearing,
  addBlackIndex,
  addVanta,
  addCovenant,
  addPatronage,
  addLegacy,
  addPatentAuction,
  addUmbra,
  addCatastrophe,
  addArbitration,
  addEventHorizon,
  addMourningstar,
  addEclipseExpo,
  addFundingCrucible,
  addLastProspectus,
  addNocturne,
  addConsensusCrown,
];

function createBuilding(record: CorporateCoreBuildingProgram, index: number, materials: Materials) {
  const root = prepare(new THREE.Group(), `CORPORATE__${record.code}__${record.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`);
  BUILDERS[index](root, materials);
  root.userData.exteriorProgram = true;
  root.userData.featureRole = 'building';
  root.userData.buildingCode = record.code;
  root.userData.buildingName = record.name;
  root.userData.semanticName = record.name;
  root.userData.buildingPurpose = record.purpose;
  root.userData.facilityForm = record.form;
  root.userData.footprintMetres = [...record.footprintMetres];
  root.userData.heightMetres = record.heightMetres;
  root.userData.exteriorSignature = record.exteriorSignature;
  root.userData.exteriorOnly = true;
  root.userData.centralBuildingPreserved = true;
  root.userData.navObstacle = true;
  root.traverse((object) => {
    object.userData.selectableId = DISTRICT_ID;
    object.userData.districtId = DISTRICT_ID;
  });
  return root;
}

function worldPointToDistrictLocal(definition: DistrictDefinition, radius: number, angle: number, y = FLOOR_Y) {
  return new THREE.Vector3(
    Math.cos(angle) * radius - definition.position[0],
    y,
    Math.sin(angle) * radius - definition.position[2],
  );
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
  value.userData.corporateRoute = true;
  parent.add(value);
  return value;
}

function addPublicRealm(district: THREE.Group, definition: DistrictDefinition, facilities: readonly THREE.Group[], materials: Materials) {
  const infrastructure = prepare(new THREE.Group(), 'CORPORATE__BLACK_RING_CIRCULATION');
  const landscape = prepare(new THREE.Group(), 'CORPORATE__TRIBUNAL_PUBLIC_REALM');
  const center = new THREE.Vector3(-definition.position[0], 0, -definition.position[2]);
  ringSurface(infrastructure, 'CORPORATE__COMPLIANCE_WALK', COMPLIANCE_WALK_RADIUS - 1.4, COMPLIANCE_WALK_RADIUS + 1.4, materials.basalt, center, FLOOR_Y + 0.014);
  ringSurface(infrastructure, 'CORPORATE__PROCESSION_LOOP', PROCESSION_LOOP_RADIUS - 3.3, PROCESSION_LOOP_RADIUS + 3.3, materials.glass, center, FLOOR_Y + 0.012);
  for (const offset of [-2.15, 0, 2.15]) {
    const line = torus(infrastructure, `CORPORATE__PROCESSION_NEON_LANE_${offset}`, PROCESSION_LOOP_RADIUS + offset, 0.07, offset === 0 ? materials.ultraviolet : materials.cyan, [center.x, FLOOR_Y + 0.06, center.z]);
    line.userData.emergencyColor = '#ff243d';
    pulse(line, 0.025 + Math.abs(offset) * 0.003, offset, 0.45, 3.8);
  }
  for (const offset of [-0.9, 0.9]) torus(infrastructure, `CORPORATE__COMPLIANCE_CYAN_SEAM_${offset}`, COMPLIANCE_WALK_RADIUS + offset, 0.055, materials.cyan, [center.x, FLOOR_Y + 0.055, center.z]);
  CORPORATE_CORE_BUILDING_PROGRAM.forEach((record, index) => {
    const building = facilities[index];
    const inward = new THREE.Vector3(-Math.cos(record.angle), 0, -Math.sin(record.angle));
    const entrance = building.position.clone().addScaledVector(inward, record.footprintMetres[1] / 20 + 0.55).setY(FLOOR_Y + 0.025);
    const compliance = worldPointToDistrictLocal(definition, COMPLIANCE_WALK_RADIUS, record.angle, FLOOR_Y + 0.025);
    const bend = compliance.clone().lerp(entrance, 0.55);
    bend.addScaledVector(new THREE.Vector3(-inward.z, 0, inward.x), (index % 2 ? 1 : -1) * 0.35);
    ribbon(infrastructure, `CORPORATE__${record.code}__EXACT_INWARD_APPROACH`, [compliance, bend, entrance], 0.92, materials.basalt);
    ribbon(infrastructure, `CORPORATE__${record.code}__NEON_APPROACH_LINE`, [compliance.clone().setY(FLOOR_Y + 0.065), bend.clone().setY(FLOOR_Y + 0.065), entrance.clone().setY(FLOOR_Y + 0.065)], 0.055, neonFor(record, materials), false);
  });
  const declarations = [
    'CAPITAL SEEKS CONTINUITY',
    'DISCOVERY CREATES OBLIGATION',
    'ACCESS IS A FINANCIAL CONDITION',
    'ALL MODELS EVENTUALLY CONVERGE',
    'THE FUTURE HAS ALREADY BEEN ALLOCATED',
    'NO LIABILITY EXPIRES HERE',
  ];
  for (let declaration = 0; declaration < declarations.length; declaration += 1) {
    const angle = -Math.PI * 0.5 + declaration / declarations.length * TAU;
    const point = worldPointToDistrictLocal(definition, 46.8, angle, FLOOR_Y);
    const root = prepare(new THREE.Group(), `CORPORATE__FLOATING_DECLARATION_${declaration + 1}`);
    root.position.copy(point);
    root.rotation.y = -angle - Math.PI * 0.5;
    sign(root, `CORPORATE__DECLARATION_TEXT_${declaration + 1}`, declarations[declaration], 5.4, [0, 2.5, 0], declaration % 2 ? '#9e65ff' : '#6cecff');
    landscape.add(root);
  }
  for (let seat = 0; seat < 48; seat += 1) {
    const angle = seat / 48 * TAU;
    const point = worldPointToDistrictLocal(definition, 39.2, angle, FLOOR_Y);
    const value = box(landscape, `CORPORATE__INWARD_FACING_COMPLIANCE_SEAT_${seat + 1}`, [0.72, 0.42, 0.42], materials.concrete, [point.x, 0.23, point.z], false, [0, -angle - Math.PI * 0.5, 0]);
    value.userData.facesMegabuilding = true;
  }
  for (let gate = 0; gate < 8; gate += 1) {
    const angle = gate / 8 * TAU + Math.PI / 8;
    const point = worldPointToDistrictLocal(definition, 35.8, angle, FLOOR_Y);
    box(landscape, `CORPORATE__SEALED_CENTRAL_ACCESS_GATE_${gate + 1}`, [2.6, 3.0, 0.42], materials.obsidian, [point.x, 1.5, point.z], true, [0, -angle - Math.PI * 0.5, 0]);
    pulse(box(landscape, `CORPORATE__CENTRAL_GATE_CYAN_CONVERGENCE_${gate + 1}`, [1.8, 0.08, 0.06], gate % 4 === 0 ? materials.red : materials.cyan, [point.x, 1.55, point.z], false, [0, -angle - Math.PI * 0.5, 0]), 0.04, gate * 0.7, 0.08, 3.6);
  }
  infrastructure.userData.circulation = {
    complianceWalk: 'narrow inner promenade with cyan convergence lines and all seating facing the central Megabuilding',
    processionLoop: 'wide outer ceremonial route with illuminated subsurface lanes and emergency red reversal protocol',
    exactBuildingApproaches: 20,
    conventionalStreetlights: 0,
    centralBuildingModified: false,
    accessibleRoutesIntegrated: true,
  };
  landscape.userData.publicRealm = {
    inwardFacingSeats: 48,
    sealedCentralAccessGates: 8,
    floatingDeclarations: declarations,
    palette: 'exclusively black architecture distinguished by texture; neon is the only chromatic element',
    advertisingPermitted: false,
    darkCircuitBoardReading: true,
  };
  district.add(infrastructure, landscape);
  return { infrastructure, landscape };
}

function addCorporateNightLighting(
  district: THREE.Group,
  definition: DistrictDefinition,
  facilities: readonly THREE.Group[],
  materials: Materials,
) {
  const lighting = prepare(new THREE.Group(), 'CORPORATE__HIGH_OUTPUT_NIGHT_LIGHTING_NETWORK');
  lighting.userData.publicRealmObject = true;
  lighting.userData.navObstacle = false;
  const highOutputPalette = [
    materials.nightCyan,
    materials.nightUltraviolet,
    materials.nightMagenta,
    materials.nightAmber,
    materials.nightGreen,
    materials.nightRed,
    materials.nightWhite,
  ] as const;

  const outerPylonCount = 80;
  const pointLightStride = 5;
  for (let index = 0; index < outerPylonCount; index += 1) {
    const angle = index / outerPylonCount * TAU + Math.PI / outerPylonCount;
    const point = worldPointToDistrictLocal(definition, 75.6, angle, FLOOR_Y);
    const pole = corporateNightLight(cylinder(
      lighting,
      `CORPORATE__OUTER_PROMENADE_LIGHT_PYLON_${index + 1}`,
      0.1,
      2.7,
      materials.titanium,
      [point.x, 1.36, point.z],
      false,
      8,
    ), 'outer-promenade-pylon');
    pole.userData.publicRealmObject = true;
    const lampMaterial = highOutputPalette[index % highOutputPalette.length];
    const lantern = corporateNightLight(cylinder(
      lighting,
      `CORPORATE__OUTER_PROMENADE_NEON_LANTERN_${index + 1}`,
      0.18,
      1.65,
      lampMaterial,
      [point.x, 2.55, point.z],
      false,
      8,
    ), 'outer-promenade-neon-lantern');
    lantern.userData.publicRealmObject = true;
    if (index % pointLightStride === 0) {
      const color = lampMaterial.emissive.clone();
      const localLight = corporateNightLight(prepare(
        new THREE.PointLight(color, 58, 22, 1.8),
        `CORPORATE__LOCAL_NIGHT_ILLUMINATION_${index / pointLightStride + 1}`,
      ), 'local-point-light');
      localLight.position.set(point.x, 3.15, point.z);
      localLight.castShadow = false;
      localLight.userData.publicRealmObject = true;
      lighting.add(localLight);
    }
  }

  const complianceShardCount = 60;
  for (let index = 0; index < complianceShardCount; index += 1) {
    const angle = index / complianceShardCount * TAU;
    const radius = 46.2 + index % 2 * 0.85;
    const point = worldPointToDistrictLocal(definition, radius, angle, FLOOR_Y);
    const height = 1.25 + index % 4 * 0.22;
    const shard = corporateNightLight(box(
      lighting,
      `CORPORATE__INNER_COMPLIANCE_NEON_SHARD_${index + 1}`,
      [0.09, height, 0.09],
      highOutputPalette[(index + 2) % highOutputPalette.length],
      [point.x, height * 0.5 + 0.03, point.z],
      false,
      [0, -angle, (index % 3 - 1) * 0.08],
    ), 'inner-compliance-neon-shard');
    shard.userData.publicRealmObject = true;
  }

  CORPORATE_CORE_BUILDING_PROGRAM.forEach((record, index) => {
    const building = facilities[index];
    const width = record.footprintMetres[0] / 10;
    const depth = record.footprintMetres[1] / 10;
    const height = record.heightMetres / 10;
    const facadeMaterial = highOutputNeonFor(record, materials);
    const bladeHeight = THREE.MathUtils.clamp(height * 0.56, 3.2, 12.5);
    for (const side of [-1, 1]) {
      corporateNightLight(box(
        building,
        `CORPORATE__${record.code}__HIGH_OUTPUT_FACADE_BLADE_${side < 0 ? 'LEFT' : 'RIGHT'}`,
        [0.11, bladeHeight, 0.11],
        facadeMaterial,
        [side * width * 0.38, 0.85 + bladeHeight * 0.5, depth * 0.48],
      ), 'building-facade-blade');
    }
    for (let band = 0; band < 3; band += 1) {
      const y = Math.min(height - 0.35, 2.1 + band * Math.max(1.15, (height - 2.8) / 3));
      corporateNightLight(box(
        building,
        `CORPORATE__${record.code}__HIGH_OUTPUT_FACADE_THRESHOLD_${band + 1}`,
        [width * 0.66, 0.085, 0.12],
        band === 1 ? materials.nightWhite : facadeMaterial,
        [0, y, depth * 0.485],
      ), 'building-facade-threshold');
    }
    corporateNightLight(cylinder(
      building,
      `CORPORATE__${record.code}__ROOF_AUTHORITY_BEACON_MAST`,
      0.11,
      1.75,
      materials.titanium,
      [0, height + 0.88, 0],
      false,
      8,
    ), 'roof-beacon-mast');
    corporateNightLight(sphere(
      building,
      `CORPORATE__${record.code}__ROOF_AUTHORITY_BEACON`,
      [0.42, 0.42, 0.42],
      facadeMaterial,
      [0, height + 1.82, 0],
      false,
      12,
    ), 'roof-authority-beacon');
    corporateNightLight(torus(
      building,
      `CORPORATE__${record.code}__ROOF_NEON_HALO`,
      0.72,
      0.07,
      index % 4 === 0 ? materials.nightWhite : facadeMaterial,
      [0, height + 1.82, 0],
    ), 'roof-neon-halo');
  });

  const plazaStadiumLightBaseIntensity = 1100;
  const plazaStadiumLightStrength = 1;
  const plazaCenter = new THREE.Vector3(-definition.position[0], FLOOR_Y + 0.18, -definition.position[2]);
  CORPORATE_CORE_BUILDING_PROGRAM.forEach((record, index) => {
    const point = worldPointToDistrictLocal(definition, 50.4, record.angle, FLOOR_Y);
    const rig = prepare(new THREE.Group(), `CORPORATE__${record.code}__PLAZA_STADIUM_LIGHT_RIG`);
    rig.position.copy(point);
    rig.rotation.y = -record.angle - Math.PI * 0.5;
    rig.userData.corporatePlazaStadiumLightRig = true;
    rig.userData.buildingCode = record.code;
    rig.userData.publicRealmObject = true;
    rig.userData.navObstacle = false;

    corporateNightLight(cylinder(
      rig,
      `CORPORATE__${record.code}__PLAZA_STADIUM_LIGHT_MAST`,
      0.22,
      4.8,
      materials.titanium,
      [0, 2.4, 0],
      false,
      10,
    ), 'plaza-stadium-light-mast');
    corporateNightLight(box(
      rig,
      `CORPORATE__${record.code}__PLAZA_STADIUM_LIGHT_CROSSBAR`,
      [2.25, 0.18, 0.22],
      materials.titanium,
      [0, 4.72, 0],
    ), 'plaza-stadium-light-crossbar');

    for (const [lampIndex, offset] of [-0.76, 0, 0.76].entries()) {
      corporateNightLight(box(
        rig,
        `CORPORATE__${record.code}__PLAZA_STADIUM_LIGHT_HOUSING_${lampIndex + 1}`,
        [0.56, 0.36, 0.5],
        materials.titanium,
        [offset, 4.72, 0.08],
        false,
        [0.24, 0, 0],
      ), 'plaza-stadium-light-housing');
      corporateNightLight(box(
        rig,
        `CORPORATE__${record.code}__PLAZA_STADIUM_LIGHT_LENS_${lampIndex + 1}`,
        [0.4, 0.23, 0.04],
        index % 5 === 0 && lampIndex === 1 ? highOutputNeonFor(record, materials) : materials.nightWhite,
        [offset, 4.64, 0.34],
        false,
        [0.24, 0, 0],
      ), 'plaza-stadium-light-lens');
    }

    const target = prepare(new THREE.Object3D(), `CORPORATE__${record.code}__PLAZA_STADIUM_LIGHT_TARGET`);
    target.position.copy(plazaCenter);
    target.userData.publicRealmObject = true;
    target.userData.navObstacle = false;
    lighting.add(target);

    const stadiumLight = corporateNightLight(prepare(
      new THREE.SpotLight('#f4ffff', plazaStadiumLightBaseIntensity, 82, 0.48, 0.62, 1.35),
      `CORPORATE__${record.code}__PLAZA_STADIUM_SPOTLIGHT`,
    ), 'plaza-stadium-spotlight');
    stadiumLight.position.set(0, 4.62, 0.38);
    stadiumLight.target = target;
    stadiumLight.castShadow = false;
    stadiumLight.userData.corporatePlazaStadiumLight = true;
    stadiumLight.userData.fullIslandDetailLightEssential = true;
    stadiumLight.userData.corporatePlazaStadiumLightBaseIntensity = plazaStadiumLightBaseIntensity;
    stadiumLight.userData.corporatePlazaStadiumLightStrength = plazaStadiumLightStrength;
    stadiumLight.userData.buildingCode = record.code;
    stadiumLight.userData.publicRealmObject = true;
    rig.add(stadiumLight);
    lighting.add(rig);
  });

  lighting.userData.nightLighting = {
    outerPromenadePylons: outerPylonCount,
    outerPromenadeNeonLanterns: outerPylonCount,
    innerComplianceNeonShards: complianceShardCount,
    buildingFacadeBlades: facilities.length * 2,
    buildingFacadeThresholds: facilities.length * 3,
    rooftopAuthorityBeacons: facilities.length,
    rooftopNeonHalos: facilities.length,
    localPointLights: outerPylonCount / pointLightStride,
    plazaStadiumLightRigs: facilities.length,
    plazaStadiumSpotlights: facilities.length,
    plazaStadiumLampLenses: facilities.length * 3,
    plazaStadiumLightBaseIntensity,
    plazaStadiumLightStrength,
    emissiveElements: outerPylonCount + complianceShardCount + facilities.length * 10,
    nonBlocking: true,
    shadowCasting: false,
    nighttimeIntent: 'very bright high-output cyan, ultraviolet, magenta, amber, green, red, and binding-white corporate illumination',
  };
  district.add(lighting);
  return lighting;
}

export function buildCorporateCoreDistrict(district: THREE.Group, definition: DistrictDefinition) {
  const materials = createMaterials();
  const facilities = CORPORATE_CORE_BUILDING_PROGRAM.map((record, index) => {
    const building = createBuilding(record, index, materials);
    building.position.copy(worldPointToDistrictLocal(definition, record.radius, record.angle, FLOOR_Y + 0.02));
    const inward = new THREE.Vector3(-Math.cos(record.angle), 0, -Math.sin(record.angle));
    building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.ringAnchor = {
      radius: record.radius,
      angle: record.angle,
      clockwiseIndex: index + 1,
      facesCentralMegabuilding: true,
    };
    district.add(building);
    return building;
  });
  const publicRealm = addPublicRealm(district, definition, facilities, materials);
  const nightLighting = addCorporateNightLighting(district, definition, facilities, materials);
  const buildings = CORPORATE_CORE_BUILDING_PROGRAM.map((record) => ({
    code: record.code,
    name: record.name,
    purpose: record.purpose,
    form: record.form,
    footprintMetres: record.footprintMetres,
    heightMetres: record.heightMetres,
    neon: record.neon,
    exteriorSignature: record.exteriorSignature,
  }));
  district.userData.corporateCoreDistrict = {
    name: 'Corporate Core — The Black Ring',
    buildingCount: facilities.length,
    buildings,
    clockwiseOrder: buildings.map((building) => building.name),
    circulation: publicRealm.infrastructure.userData.circulation,
    publicRealm: publicRealm.landscape.userData.publicRealm,
    nightLighting: nightLighting.userData.nightLighting,
    signatureSystems: {
      nullExchangeTickerLines: 22,
      obsidianReserveTerraces: 7,
      blackLedgerLayers: 40,
      indexBladeSegments: 13,
      covenantPillars: 12,
      patronageRotatingRings: 6,
      patentDisplayPlinths: 12,
      arbitrationPillars: 24,
      mourningstarWings: 12,
      eclipsePavilions: 7,
      nocturneVolumes: 9,
      consensusSeats: 40,
    },
    neonHierarchy: {
      cyan: 'public information, verified transactions, convention navigation',
      ultraviolet: 'executive authority, restricted funding, high-level access',
      magenta: 'speculative capital, active bidding, venture investment',
      amber: 'long-term obligations, endowments, ceremonial functions',
      green: 'growth projections, active investment streams, favorable assessments',
      red: 'disputes, risk, terminations, liability, emergencies',
      white: 'final declarations, binding decisions, official names',
    },
    architecturalIntent: 'an almost continuous tribunal of black architecture watching the central Megabuilding like a circuit around an inaccessible processor',
    centralBuildingPreserved: true,
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: buildings.map((building) => building.name),
    plannedObjects: ['Compliance Walk', 'Procession Loop', 'twenty exact inward approaches', 'subsurface neon lane hierarchy', 'inward-facing tribunal seating', 'sealed central access gates', 'floating corporate declarations', 'high-output night lighting network'],
    realizedFeatureTags: buildings.map((building) => building.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: publicRealm.infrastructure.children.length + publicRealm.landscape.children.length,
    distinct: true,
    asymmetricCampus: false,
    localRoadCount: 22,
    skybridgeCount: 0,
    sealedSkybridgeTransferRingCount: 0,
    radialCoverage: 1,
    angularCoverage: 1,
    exteriorOnly: true,
    blackRingNarrative: true,
    fullClockwiseRing: true,
    centralBuildingPreserved: true,
    highOutputNightLighting: nightLighting.userData.nightLighting,
  };
}
