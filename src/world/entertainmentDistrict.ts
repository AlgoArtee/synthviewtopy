import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

const FLOOR_Y = 0.008;
const DISTRICT_ID = 'luxury-entertainment';

export type EntertainmentZone = 'outer-northern' | 'art-marketing' | 'residential-quiet' | 'tropical-ecological';

export interface EntertainmentBuildingProgram {
  code: string;
  name: string;
  subtitle: string;
  zone: EntertainmentZone;
  form: string;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  exteriorSignature: string;
}

export const ENTERTAINMENT_BUILDING_PROGRAM: readonly EntertainmentBuildingProgram[] = [
  { code: 'E01', name: 'The Aurelia Crown', subtitle: 'flagship fine-dining landmark', zone: 'art-marketing', form: 'rotating-elliptical-plate-tower', footprintMetres: [104, 82], heightMetres: 72, radialT: 0.61, angularT: 0.08, exteriorSignature: 'five off-axis champagne-titanium ellipses, gold glass, orbital sculptures, reflecting pools, and a floating roof halo' },
  { code: 'E02', name: 'Tidal Glass', subtitle: 'ocean-facing marine dining pavilion', zone: 'outer-northern', form: 'photovoltaic-wave-pavilion', footprintMetres: [138, 82], heightMetres: 32, radialT: 0.84, angularT: 0.90, exteriorSignature: 'one photovoltaic-glass wave, white marine ribs, algae lantern columns, water channels, and mist-projected media' },
  { code: 'E03', name: 'The Helix Table', subtitle: 'experimental gastronomy complex', zone: 'art-marketing', form: 'twin-helical-garden-towers', footprintMetres: [106, 86], heightMetres: 74, radialT: 0.61, angularT: 0.25, exteriorSignature: 'twisting pearl and iridescent towers, spiral promenade, irregular bridges, hydroponic void, roof fins, and luminous mist ring' },
  { code: 'E04', name: 'Ember & Ice', subtitle: 'dual-concept luxury restaurant', zone: 'residential-quiet', form: 'contrasting-courtyard-wings', footprintMetres: [116, 78], heightMetres: 43, radialT: 0.36, angularT: 0.08, exteriorSignature: 'fissured copper volcanic wing, crystalline water-glass wing, diamond portal, thermal courtyard rill, and opposed roof crowns' },
  { code: 'E05', name: 'The Orion Room', subtitle: 'observatory cocktail bar', zone: 'residential-quiet', form: 'obsidian-oval-observatory', footprintMetres: [88, 62], heightMetres: 28, radialT: 0.36, angularT: 0.27, exteriorSignature: 'star-field obsidian oval in black water, faceted dome, tilted orbital ring, bridge approach, and coordinate fins' },
  { code: 'E06', name: 'Velvet Circuit', subtitle: 'cocktail club, jazz venue and salon', zone: 'residential-quiet', form: 'kinetic-ribbon-salon', footprintMetres: [82, 68], heightMetres: 67, radialT: 0.36, angularT: 0.46, exteriorSignature: 'burgundy-to-violet mechanical curtain, star canopy, brass guide line, smoked floating balconies, and acoustic garden wall' },
  { code: 'E07', name: 'Pulse Cathedral', subtitle: 'primary electronic-music venue', zone: 'outer-northern', form: 'acoustic-cathedral-club', footprintMetres: [126, 104], heightMetres: 112, radialT: 0.84, angularT: 0.10, exteriorSignature: 'black central nave, programmable waveform glazing, functional buttresses, monumental blue arch, colonnade, and three beacon spires' },
  { code: 'E08', name: 'Halo Nine', subtitle: 'elevated skyline club', zone: 'outer-northern', form: 'ring-on-slender-tower', footprintMetres: [92, 92], heightMetres: 154, radialT: 0.84, angularT: 0.30, exteriorSignature: 'graphite shaft, rotating electrochromic summit ring, secondary sky halo, nine reflecting pools, and Halo Walk bridge' },
  { code: 'E09', name: 'Eclipse Cabaret', subtitle: 'cabaret, dance and theatrical venue', zone: 'art-marketing', form: 'sphere-and-mechanical-crescent', footprintMetres: [102, 88], heightMetres: 58, radialT: 0.61, angularT: 0.42, exteriorSignature: 'void-black sphere, polished nickel crescent curtain, equatorial light, fan forecourt, holographic moon, and red stair columns' },
  { code: 'E10', name: 'Aurora Grand Cinema', subtitle: 'luxury cinema and premiere venue', zone: 'art-marketing', form: 'streamlined-deco-cinema-palace', footprintMetres: [132, 90], heightMetres: 57, radialT: 0.61, angularT: 0.59, exteriorSignature: 'stepped screening volumes, monumental mirrored arch, aurora fins, shutter canopy, lenticular panels, and event fountain plaza' },
  { code: 'E11', name: 'Horizon Screen Gardens', subtitle: 'luxury open-air cinema', zone: 'tropical-ecological', form: 'terraced-landscape-cinema', footprintMetres: [142, 102], heightMetres: 42, radialT: 0.14, angularT: 0.15, exteriorSignature: 'retractable screen between black towers, landscaped brass-lit terraces, bubble pods, four projection obelisks, and curved glass entrance pavilion' },
  { code: 'E12', name: 'Meridian Pool Palace', subtitle: 'grand covered aquatic terraces', zone: 'tropical-ecological', form: 'triple-transparent-vaults', footprintMetres: [138, 96], heightMetres: 46, radialT: 0.14, angularT: 0.40, exteriorSignature: 'three droplet vaults, titanium ribs, aquatic projection, roof mist oculus, disc bars, water-veiled entrance, and heated promenade' },
  { code: 'E13', name: 'Neon Grotto Aquaclub', subtitle: 'covered lagoon and aquatic nightlife', zone: 'tropical-ecological', form: 'luminous-volcanic-shells', footprintMetres: [124, 94], heightMetres: 41, radialT: 0.14, angularT: 0.65, exteriorSignature: 'rough black interlocking shells, magenta-cobalt fissures, basin bridge, ringed cliff bars, waterfalls, humid ridges, and luminous ecology loop' },
  { code: 'E14', name: 'The Prismarium', subtitle: 'volumetric and holographic theatre', zone: 'art-marketing', form: 'crystalline-shell-suspended-cube', footprintMetres: [94, 86], heightMetres: 61, radialT: 0.61, angularT: 0.76, exteriorSignature: 'dichroic faceted crystal around an apparently unsupported black cube, optical plaza, four projection pylons, and mirrored roof prisms' },
  { code: 'E15', name: 'Synesthesia Hall', subtitle: 'multisensory experimental concert hall', zone: 'art-marketing', form: 'kinetic-waveform-hall', footprintMetres: [126, 82], heightMetres: 51, radialT: 0.61, angularT: 0.92, exteriorSignature: 'fluid waveform roof, responsive overlapping ceramic-metal panels, confined mist channel, depth-aligned sign, mirrored trough canopy, and vibration benches' },
  { code: 'E16', name: 'Zero-G Ballroom', subtitle: 'aerial and orbital performance venue', zone: 'residential-quiet', form: 'suspended-gyroscopic-sphere', footprintMetres: [98, 94], heightMetres: 72, radialT: 0.36, angularT: 0.65, exteriorSignature: 'pearl sphere above a reflecting basin, three slowly rotating titanium rings, coordinate-grid light, four concealed pylons, and twin equatorial bridges' },
  { code: 'E17', name: 'Dream Arcade', subtitle: 'neuroadaptive mixed-reality arcade', zone: 'residential-quiet', form: 'stacked-capsule-cluster', footprintMetres: [100, 82], heightMetres: 86, radialT: 0.36, angularT: 0.82, exteriorSignature: 'irregular chrome, violet, pearl, mirror and blue capsules around a digital waterfall, external tubes, portals, pixel sign, and glitch service tower' },
  { code: 'E18', name: 'Probability Palace', subtitle: 'luxury strategic gaming venue', zone: 'outer-northern', form: 'interlocking-probability-volumes', footprintMetres: [120, 94], heightMetres: 76, radialT: 0.84, angularT: 0.50, exteriorSignature: 'improbable sliding black-glass volumes, champagne probability screens, randomized light lines, mirrored entrance matrix, algorithmic jets, and intersecting frame crown' },
  { code: 'E19', name: 'Chrono Carousel', subtitle: 'kinetic temporal simulation palace', zone: 'outer-northern', form: 'mechanical-orbital-carousel', footprintMetres: [114, 106], heightMetres: 103, radialT: 0.84, angularT: 0.70, exteriorSignature: 'engraved bronze time tower, three mechanical rings with seed capsules, counter-rotating iris pavilion, concentric time tracks, and clock-like amber sign' },
  { code: 'E20', name: 'The Phantom Menagerie', subtitle: 'mixed-reality speculative-life park', zone: 'tropical-ecological', form: 'biological-mirror-landscape', footprintMetres: [142, 88], heightMetres: 43, radialT: 0.14, angularT: 0.90, exteriorSignature: 'low black mirror bar, bioluminescent tears, translucent biome cells, fern wetlands, black-tree holographic emitters, and vegetation-to-digital transition' },
];

type Materials = ReturnType<typeof createMaterials>;

function material(name: string, color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  const value = new THREE.MeshStandardMaterial({ color, roughness: 0.46, metalness: 0.24, ...options });
  value.name = name;
  return value;
}

function createMaterials() {
  return {
    blackCeramic: material('Entertainment matte black ceramic', '#07090d', { roughness: 0.76, metalness: 0.12 }),
    obsidian: material('Entertainment polished obsidian glass ceramic', '#090c14', { roughness: 0.18, metalness: 0.52 }),
    titanium: material('Entertainment champagne titanium', '#b98f58', { roughness: 0.28, metalness: 0.86 }),
    darkTitanium: material('Entertainment dark brushed titanium', '#20252d', { roughness: 0.34, metalness: 0.82 }),
    nickel: material('Entertainment polished nickel', '#bbc3ca', { roughness: 0.14, metalness: 0.94 }),
    paleStone: material('Entertainment pale polished stone', '#d8d0c5', { roughness: 0.58, metalness: 0.05 }),
    blackStone: material('Entertainment wet-look black basalt', '#111317', { roughness: 0.32, metalness: 0.18 }),
    whiteCeramic: material('Entertainment pearl white ceramic', '#e7e4df', { roughness: 0.4, metalness: 0.12 }),
    copper: material('Entertainment oxidized copper', '#5a3428', { roughness: 0.67, metalness: 0.64 }),
    burgundy: material('Entertainment burgundy anodized ribbon', '#3b0b22', { roughness: 0.36, metalness: 0.7 }),
    glass: material('Entertainment low-iron smoked glass', '#7fa2b8', { roughness: 0.12, metalness: 0.08, transparent: true, opacity: 0.56, depthWrite: true }),
    goldGlass: material('Entertainment smoked gold glass', '#a87c37', { roughness: 0.16, metalness: 0.18, transparent: true, opacity: 0.62, depthWrite: true }),
    iridescent: material('Entertainment dark iridescent metal', '#302154', { roughness: 0.28, metalness: 0.78, emissive: '#120a28', emissiveIntensity: 0.4 }),
    water: material('Entertainment black reflecting water', '#071b2b', { roughness: 0.12, metalness: 0.08, transparent: true, opacity: 0.66, depthWrite: false }),
    foliage: material('Entertainment luminous foliage', '#174a35', { roughness: 0.88, metalness: 0.02, emissive: '#082817', emissiveIntensity: 0.35 }),
    warm: material('Entertainment warm white architectural neon', '#ffe4ac', { roughness: 0.22, metalness: 0.02, emissive: '#ffb33a', emissiveIntensity: 3.2 }),
    amber: material('Entertainment amber architectural neon', '#ffaf38', { roughness: 0.2, metalness: 0.02, emissive: '#ff7800', emissiveIntensity: 4.2 }),
    cyan: material('Entertainment cyan structural neon', '#55ecff', { roughness: 0.18, metalness: 0.02, emissive: '#00b7e8', emissiveIntensity: 4 }),
    blue: material('Entertainment electric blue structural neon', '#4788ff', { roughness: 0.18, metalness: 0.02, emissive: '#145dff', emissiveIntensity: 4.2 }),
    magenta: material('Entertainment magenta structural neon', '#ff4fd8', { roughness: 0.18, metalness: 0.02, emissive: '#d000a8', emissiveIntensity: 4 }),
    violet: material('Entertainment ultraviolet structural neon', '#a96bff', { roughness: 0.18, metalness: 0.02, emissive: '#6419d8', emissiveIntensity: 4 }),
    red: material('Entertainment crimson structural neon', '#ff4960', { roughness: 0.18, metalness: 0.02, emissive: '#db102d', emissiveIntensity: 4 }),
    green: material('Entertainment bioluminescent green', '#69ffb1', { roughness: 0.2, metalness: 0.02, emissive: '#19a95d', emissiveIntensity: 3.8 }),
  };
}

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
  value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function cylinder(parent: THREE.Object3D, name: string, diameter: number, height: number, mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 20, rotation: readonly [number, number, number] = [0, 0, 0]) {
  const value = prepare(new THREE.Mesh(new THREE.CylinderGeometry(diameter * 0.5, diameter * 0.5, height, segments), mat), name, obstacle);
  value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function ellipsoid(parent: THREE.Object3D, name: string, scale: readonly [number, number, number], mat: THREE.Material, position: readonly [number, number, number], obstacle = false, segments = 18) {
  const value = prepare(new THREE.Mesh(new THREE.SphereGeometry(0.5, segments, Math.max(8, Math.floor(segments * 0.6))), mat), name, obstacle);
  value.scale.set(...scale); value.position.set(...position); parent.add(value); return value;
}

function torus(parent: THREE.Object3D, name: string, radius: number, tube: number, mat: THREE.Material, position: readonly [number, number, number], rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0], arc = Math.PI * 2, segments = 36) {
  const value = prepare(new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 7, segments, arc), mat), name, false);
  value.position.set(...position); value.rotation.set(...rotation); parent.add(value); return value;
}

function pipe(parent: THREE.Object3D, name: string, start: THREE.Vector3, end: THREE.Vector3, radius: number, mat: THREE.Material, obstacle = false) {
  const direction = end.clone().sub(start);
  const value = prepare(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 8), mat), name, obstacle);
  value.position.copy(start).add(end).multiplyScalar(0.5);
  value.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  parent.add(value); return value;
}

function pulse<T extends THREE.Object3D>(object: T, speed: number, phase = 0) {
  object.userData.animate = 'entertainment-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = 0.35; object.userData.maxIntensity = 4.2; return object;
}

function rotate<T extends THREE.Object3D>(object: T, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'entertainment-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

const signTextureCache = new Map<string, THREE.CanvasTexture>();

function signTexture(text: string, color: string) {
  const key = `${text}|${color}`;
  const cached = signTextureCache.get(key); if (cached) return cached;
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 256;
  const context = canvas.getContext('2d')!; context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '600 112px Arial, sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.letterSpacing = '9px';
  context.shadowColor = color; context.shadowBlur = 28; context.fillStyle = color; context.fillText(text, 512, 132, 960);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  signTextureCache.set(key, texture); return texture;
}

function sign(parent: THREE.Object3D, name: string, text: string, width: number, height: number, position: readonly [number, number, number], color = '#fff0bd', rotation: readonly [number, number, number] = [0, 0, 0]) {
  const materialValue = new THREE.MeshBasicMaterial({ map: signTexture(text, color), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  materialValue.name = `Entertainment sign ${text}`;
  const value = prepare(new THREE.Mesh(new THREE.PlaneGeometry(width, height), materialValue), name);
  value.position.set(...position); value.rotation.set(...rotation); value.userData.signText = text; value.renderOrder = 8; parent.add(value); return value;
}

function tree(parent: THREE.Object3D, name: string, x: number, z: number, m: Materials, scale = 1) {
  cylinder(parent, `${name}__TRUNK`, 0.22 * scale, 1.8 * scale, m.darkTitanium, [x, 0.9 * scale, z]);
  ellipsoid(parent, `${name}__CROWN`, [1.1 * scale, 1.7 * scale, 1.1 * scale], m.foliage, [x, 2.2 * scale, z]);
}

function facadeLights(parent: THREE.Object3D, prefix: string, width: number, height: number, z: number, mat: THREE.Material, columns: number, rows: number) {
  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
    box(parent, `${prefix}__FACADE_LIGHT_${row + 1}_${column + 1}`, [width / columns * 0.58, 0.08, 0.035], mat, [-width * 0.43 + column * width * 0.86 / Math.max(1, columns - 1), 0.65 + row * height / Math.max(1, rows), z]);
  }
}

function addPool(parent: THREE.Object3D, name: string, width: number, depth: number, position: readonly [number, number, number], m: Materials) {
  return box(parent, name, [width, 0.035, depth], m.water, position);
}

function createAurelia(root: THREE.Group, m: Materials) {
  cylinder(root, 'ENTERTAINMENT__E01__CENTRAL_GOLD_GLASS_CORE', 2.2, 6.2, m.goldGlass, [0, 3.1, 0], true, 24);
  for (let level = 0; level < 5; level += 1) {
    const plate = cylinder(root, `ENTERTAINMENT__E01__ELLIPTICAL_FLOOR_${level + 1}`, 8.5 - level * 0.52, 0.48, level % 2 ? m.goldGlass : m.titanium, [0, 0.72 + level * 1.14, 0], level === 0, 32);
    plate.scale.z = 0.68; plate.rotation.y = level * 0.16;
    const band = torus(root, `ENTERTAINMENT__E01__BREATHING_NEON_BAND_${level + 1}`, (8.5 - level * 0.52) * 0.5, 0.065, m.warm, [0, 0.98 + level * 1.14, 0]);
    band.scale.z = 0.68; band.rotation.y = level * 0.16; pulse(band, 0.42, level * 0.7);
  }
  torus(root, 'ENTERTAINMENT__E01__FLOATING_ROOF_HALO', 3.15, 0.09, m.titanium, [0, 7.05, 0]);
  for (let cable = 0; cable < 8; cable += 1) {
    const angle = cable / 8 * Math.PI * 2; pipe(root, `ENTERTAINMENT__E01__HALO_TENSION_CABLE_${cable + 1}`, new THREE.Vector3(Math.cos(angle) * 2.75, 5.45, Math.sin(angle) * 2.75), new THREE.Vector3(Math.cos(angle) * 3.15, 7.05, Math.sin(angle) * 3.15), 0.018, m.nickel);
  }
  for (let pool = 0; pool < 3; pool += 1) {
    addPool(root, `ENTERTAINMENT__E01__REFLECTING_POOL_${pool + 1}`, 2.1, 1.15, [-2.5 + pool * 2.5, 0.06, 4.35], m);
    torus(root, `ENTERTAINMENT__E01__MOLECULAR_ORBITAL_SCULPTURE_${pool + 1}`, 0.42, 0.055, m.titanium, [-2.5 + pool * 2.5, 0.74, 4.35], [Math.PI * 0.5, pool * 0.7, pool * 0.4]);
  }
  box(root, 'ENTERTAINMENT__E01__CEREMONIAL_STAIR', [5.1, 0.16, 2.8], m.blackStone, [0, 0.08, 3.1]);
  sign(root, 'ENTERTAINMENT__E01__AURELIA_VERTICAL_SIGN', 'AURELIA', 3.3, 0.8, [0, 4.15, 1.13], '#ffb744');
}

function createTidal(root: THREE.Group, m: Materials) {
  box(root, 'ENTERTAINMENT__E02__MARINE_DINING_VOLUME', [10.8, 2.25, 5.6], m.glass, [0, 1.2, 0], true);
  for (let scale = 0; scale < 11; scale += 1) {
    const x = -5.2 + scale * 1.04; const y = 2.55 + Math.sin(scale / 10 * Math.PI) * 1.25;
    box(root, `ENTERTAINMENT__E02__PHOTOVOLTAIC_WAVE_SCALE_${scale + 1}`, [1.18, 0.14, 7.2], scale % 2 ? m.glass : m.nickel, [x, y, -0.15], false, [0, 0, -0.25 + scale * 0.05]);
  }
  for (let rib = 0; rib < 9; rib += 1) {
    const x = -5 + rib * 1.25; const arch = torus(root, `ENTERTAINMENT__E02__WHITE_MARINE_RIB_${rib + 1}`, 2.85, 0.075, m.whiteCeramic, [x, 1.45, 0], [0, Math.PI / 2, 0], Math.PI, 22); arch.scale.y = 0.82;
  }
  for (let column = 0; column < 9; column += 1) cylinder(root, `ENTERTAINMENT__E02__ALGAE_BIOREACTOR_${column + 1}`, 0.36, 2.05, column % 2 ? m.green : m.glass, [-4.2 + column * 1.05, 1.12, -2.92], false, 12);
  for (let channel = 0; channel < 5; channel += 1) addPool(root, `ENTERTAINMENT__E02__STAR_WATER_CHANNEL_${channel + 1}`, 0.42, 3.2, [-4 + channel * 2, 0.055, 4.0], m);
  sign(root, 'ENTERTAINMENT__E02__TIDAL_GLASS_SIGN', 'TIDAL GLASS', 5.8, 0.82, [0, 3.25, 3.12], '#effcff');
}

function createHelix(root: THREE.Group, m: Materials) {
  const towerMaterials = [m.whiteCeramic, m.iridescent];
  for (let strand = 0; strand < 2; strand += 1) for (let floor = 0; floor < 8; floor += 1) {
    const angle = floor * 0.34 + strand * Math.PI; const x = Math.cos(angle) * 1.65; const z = Math.sin(angle) * 1.1;
    cylinder(root, `ENTERTAINMENT__E03__HELIX_STRAND_${strand + 1}_FLOOR_${floor + 1}`, 3.2, 0.72, towerMaterials[strand], [x, 0.48 + floor * 0.76, z], floor === 0, 18);
    if (floor > 0 && floor % 2 === 0) box(root, `ENTERTAINMENT__E03__MIRRORED_BRIDGE_${strand + 1}_${floor + 1}`, [Math.abs(x) * 2 + 0.5, 0.18, 0.72], floor % 4 ? m.cyan : m.magenta, [0, 0.48 + floor * 0.76, z]);
  }
  for (let segment = 0; segment < 30; segment += 1) {
    const angle = segment / 30 * Math.PI * 4; const radius = 3.25; const y = 0.32 + segment * 0.18;
    box(root, `ENTERTAINMENT__E03__SPIRAL_PROMENADE_SEGMENT_${segment + 1}`, [0.72, 0.09, 1.16], m.glass, [Math.cos(angle) * radius, y, Math.sin(angle) * radius], false, [0, -angle, 0]);
  }
  for (let plant = 0; plant < 7; plant += 1) cylinder(root, `ENTERTAINMENT__E03__HYDROPONIC_GARDEN_COLUMN_${plant + 1}`, 0.28, 4.8 - plant * 0.3, plant % 2 ? m.green : m.foliage, [-0.8 + plant * 0.27, 2.4, 0], false, 9);
  for (const side of [-1, 1]) box(root, `ENTERTAINMENT__E03__CURVED_ROOF_FIN_${side > 0 ? 'EAST' : 'WEST'}`, [0.24, 2.2, 1.2], m.nickel, [side * 1.28, 6.4, 0], false, [0, 0, side * -0.32]);
  pulse(torus(root, 'ENTERTAINMENT__E03__LUMINOUS_MIST_RING', 1.75, 0.11, m.violet, [0, 7.1, 0]), 0.34);
  sign(root, 'ENTERTAINMENT__E03__HELIX_SIGN', 'HELIX', 2.6, 0.72, [0, 2.1, 2.72], '#ff4fd8');
}

function createEmberIce(root: THREE.Group, m: Materials) {
  box(root, 'ENTERTAINMENT__E04__EMBER_VOLCANIC_WING', [4.6, 4.2, 6], m.blackStone, [-2.7, 2.1, 0], true, [0, 0.08, 0]);
  box(root, 'ENTERTAINMENT__E04__ICE_CRYSTALLINE_WING', [4.6, 4.2, 6], m.glass, [2.7, 2.1, 0], true, [0, -0.08, 0]);
  for (let fissure = 0; fissure < 8; fissure += 1) box(root, `ENTERTAINMENT__E04__EMBER_FISSURE_${fissure + 1}`, [0.12, 2.8 - fissure % 3 * 0.4, 0.06], fissure % 2 ? m.red : m.amber, [-4.4 + fissure * 0.48, 2.2, 3.04], false, [0, 0, (fissure % 3 - 1) * 0.16]);
  for (let fin = 0; fin < 10; fin += 1) box(root, `ENTERTAINMENT__E04__ICE_MICROPRISM_FIN_${fin + 1}`, [0.14, 3.1, 0.62], fin % 2 ? m.cyan : m.whiteCeramic, [0.85 + fin * 0.42, 2.15, 3.3], false, [0, -0.25, 0]);
  const portal = box(root, 'ENTERTAINMENT__E04__BLACK_DIAMOND_PORTAL', [1.7, 2.6, 0.5], m.obsidian, [0, 1.35, 3.45], false, [0, 0, Math.PI / 4]); portal.userData.entrancePortal = true;
  box(root, 'ENTERTAINMENT__E04__AMBER_PORTAL_EDGE', [0.08, 2.8, 0.08], m.amber, [-0.72, 1.45, 3.76], false, [0, 0, -Math.PI / 4]);
  box(root, 'ENTERTAINMENT__E04__BLUE_PORTAL_EDGE', [0.08, 2.8, 0.08], m.blue, [0.72, 1.45, 3.76], false, [0, 0, Math.PI / 4]);
  addPool(root, 'ENTERTAINMENT__E04__THERMAL_COURTYARD_RILL', 0.38, 5.2, [0, 0.07, -0.2], m);
  for (let chimney = 0; chimney < 4; chimney += 1) cylinder(root, `ENTERTAINMENT__E04__EMBER_CHIMNEY_${chimney + 1}`, 0.34, 1.0 + chimney * 0.22, m.copper, [-4 + chimney * 0.8, 4.7 + chimney * 0.11, -0.8], false, 8);
  ellipsoid(root, 'ENTERTAINMENT__E04__ICE_FROZEN_CLOUD_CROWN', [3.5, 1.15, 2], m.whiteCeramic, [2.7, 4.45, -0.3]);
  sign(root, 'ENTERTAINMENT__E04__DUAL_SIGN', 'EMBER / ICE', 4.6, 0.72, [0, 2.35, 3.85], '#f4f6ff');
}

function createOrion(root: THREE.Group, m: Materials) {
  addPool(root, 'ENTERTAINMENT__E05__OBSIDIAN_REFLECTING_BASIN', 8.4, 5.7, [0, 0.05, 0], m);
  ellipsoid(root, 'ENTERTAINMENT__E05__OBSIDIAN_OVAL', [7.1, 2.5, 4.5], m.obsidian, [0, 1.3, 0], true, 24);
  ellipsoid(root, 'ENTERTAINMENT__E05__FACETED_OBSERVATORY_DOME', [2.2, 1.25, 2.2], m.darkTitanium, [0, 2.85, -0.3], false, 10);
  rotate(torus(root, 'ENTERTAINMENT__E05__TILTED_ORBITAL_RING', 1.55, 0.08, m.nickel, [0, 3.12, -0.3], [0.9, 0.25, 0.2]), 0.025);
  for (let star = 0; star < 48; star += 1) {
    const angle = star * 2.39996; const y = 0.55 + (star % 9) * 0.18; const radius = 3.55 * Math.sqrt(Math.max(0.1, 1 - ((y - 1.3) / 1.25) ** 2));
    ellipsoid(root, `ENTERTAINMENT__E05__FIBRE_OPTIC_STAR_${star + 1}`, [0.055, 0.055, 0.055], star % 7 ? m.warm : m.cyan, [Math.cos(angle) * radius, y, Math.sin(angle) * 2.15 + 2.28]);
  }
  box(root, 'ENTERTAINMENT__E05__SUSPENDED_APPROACH_BRIDGE', [1.15, 0.12, 4.1], m.blackStone, [0, 0.18, 4.5]);
  for (const side of [-1, 1]) box(root, `ENTERTAINMENT__E05__BRIDGE_EDGE_LIGHT_${side > 0 ? 'R' : 'L'}`, [0.035, 0.04, 4.1], m.warm, [side * 0.56, 0.25, 4.5]);
  sign(root, 'ENTERTAINMENT__E05__ORION_NEON_SCULPTURE', 'THE ORION ROOM', 4.2, 0.62, [0, 1.0, 2.42], '#eef7ff');
}

function createVelvet(root: THREE.Group, m: Materials) {
  box(root, 'ENTERTAINMENT__E06__SMOKED_GLASS_SALON', [6.6, 6.2, 5.4], m.glass, [0, 3.1, 0], true);
  for (let ribbon = 0; ribbon < 42; ribbon += 1) {
    const x = -3.36 + ribbon * 0.164; const strip = box(root, `ENTERTAINMENT__E06__KINETIC_VELVET_RIBBON_${ribbon + 1}`, [0.085, 5.9, 0.12], ribbon % 3 ? m.burgundy : m.iridescent, [x, 3.2, 2.78], false, [0, Math.sin(ribbon * 0.7) * 0.42, 0]); strip.userData.kineticFacade = true;
  }
  box(root, 'ENTERTAINMENT__E06__CURVED_STAR_CANOPY', [5.2, 0.24, 2.5], m.burgundy, [0, 1.0, 3.7], false, [-0.1, 0, 0]);
  for (let star = 0; star < 24; star += 1) ellipsoid(root, `ENTERTAINMENT__E06__CANOPY_STAR_${star + 1}`, [0.045, 0.045, 0.045], m.warm, [-2.2 + (star % 8) * 0.63, 0.86, 2.85 + Math.floor(star / 8) * 0.62]);
  for (let balcony = 0; balcony < 4; balcony += 1) box(root, `ENTERTAINMENT__E06__SMOKED_FLOATING_BALCONY_${balcony + 1}`, [1.45, 0.78, 0.95], m.obsidian, [-2.2 + balcony * 1.45, 2.0 + (balcony % 2) * 1.8, 3.05]);
  for (let wall = 0; wall < 8; wall += 1) cylinder(root, `ENTERTAINMENT__E06__ACOUSTIC_GARDEN_WALL_BLOCK_${wall + 1}`, 1.0, 1.35, m.burgundy, [-3.5 + wall, 0.68, -3.2], false, 12, [Math.PI / 2, 0, 0]);
  sign(root, 'ENTERTAINMENT__E06__HANDWRITTEN_NEON_SIGN', 'VELVET CIRCUIT', 5.4, 0.8, [0, 4.45, 2.9], '#ff7caa');
}

function createPulse(root: THREE.Group, m: Materials) {
  box(root, 'ENTERTAINMENT__E07__CENTRAL_NAVE', [6.6, 10.2, 7.4], m.blackCeramic, [0, 5.1, 0], true);
  box(root, 'ENTERTAINMENT__E07__WEST_SIDE_VOLUME', [3.1, 5.4, 8.7], m.blackCeramic, [-4.7, 2.7, 0], true);
  box(root, 'ENTERTAINMENT__E07__EAST_SIDE_VOLUME', [3.1, 5.4, 8.7], m.blackCeramic, [4.7, 2.7, 0], true);
  for (let buttress = 0; buttress < 8; buttress += 1) {
    const x = -5.9 + buttress * 1.68; box(root, `ENTERTAINMENT__E07__ACOUSTIC_BUTTRESS_${buttress + 1}`, [0.62, 6.4 + (buttress % 2) * 1.4, 2.5], m.darkTitanium, [x, 3.2, 0.65], true, [0, 0, (x / 5.9) * -0.08]);
    box(root, `ENTERTAINMENT__E07__RHYTHM_LIGHT_BAR_${buttress + 1}`, [0.08, 4.8, 0.08], m.red, [x, 3.5, 4.46]);
  }
  for (let window = 0; window < 7; window += 1) box(root, `ENTERTAINMENT__E07__PROGRAMMABLE_STAINED_WAVEFORM_${window + 1}`, [0.48, 5.6, 0.09], window % 2 ? m.magenta : m.blue, [-2.45 + window * 0.82, 5.2, 3.76]);
  pipe(root, 'ENTERTAINMENT__E07__POINTED_ARCH_LEFT', new THREE.Vector3(-3.1, 0.5, 4.05), new THREE.Vector3(0, 8.4, 4.05), 0.16, m.darkTitanium);
  pipe(root, 'ENTERTAINMENT__E07__POINTED_ARCH_RIGHT', new THREE.Vector3(3.1, 0.5, 4.05), new THREE.Vector3(0, 8.4, 4.05), 0.16, m.darkTitanium);
  pipe(root, 'ENTERTAINMENT__E07__ELECTRIC_BLUE_ARCH_LEFT', new THREE.Vector3(-2.82, 0.6, 4.15), new THREE.Vector3(0, 7.95, 4.15), 0.055, m.blue);
  pipe(root, 'ENTERTAINMENT__E07__ELECTRIC_BLUE_ARCH_RIGHT', new THREE.Vector3(2.82, 0.6, 4.15), new THREE.Vector3(0, 7.95, 4.15), 0.055, m.blue);
  for (let spire = 0; spire < 3; spire += 1) cylinder(root, `ENTERTAINMENT__E07__DRONE_BEACON_SPIRE_${spire + 1}`, 0.34, 2.5 - spire * 0.3, m.darkTitanium, [-2.1 + spire * 2.1, 11.35, -0.4], false, 6);
  sign(root, 'ENTERTAINMENT__E07__MONUMENTAL_PULSE_SIGN', 'PULSE', 4.4, 1.05, [0, 8.8, 3.86], '#62a6ff');
}

function createHaloNine(root: THREE.Group, m: Materials) {
  cylinder(root, 'ENTERTAINMENT__E08__SLENDER_GRAPHITE_SHAFT', 2.5, 12.2, m.darkTitanium, [0, 6.1, 0], true, 18);
  for (let line = 0; line < 3; line += 1) box(root, `ENTERTAINMENT__E08__VERTICAL_WHITE_SHAFT_LINE_${line + 1}`, [0.055, 10.8, 0.055], m.warm, [Math.cos(line / 3 * Math.PI * 2) * 1.25, 6.3, Math.sin(line / 3 * Math.PI * 2) * 1.25]);
  cylinder(root, 'ENTERTAINMENT__E08__FIXED_INNER_SUMMIT_RING', 7.6, 1.65, m.obsidian, [0, 11.8, 0], false, 36);
  const shell = torus(root, 'ENTERTAINMENT__E08__ROTATING_ELECTROCHROMIC_OUTER_SHELL', 4.25, 0.78, m.glass, [0, 11.8, 0]); rotate(shell, 0.018);
  torus(root, 'ENTERTAINMENT__E08__WHITE_LOWER_ORBIT', 4.7, 0.075, m.warm, [0, 10.96, 0]);
  rotate(torus(root, 'ENTERTAINMENT__E08__MAGENTA_UPPER_ORBIT', 4.45, 0.06, m.magenta, [0, 12.67, 0]), -0.012);
  torus(root, 'ENTERTAINMENT__E08__SECONDARY_SKY_HALO', 3.65, 0.09, m.warm, [0, 15.05, 0]);
  for (let support = 0; support < 6; support += 1) pipe(root, `ENTERTAINMENT__E08__SKY_HALO_SUPPORT_${support + 1}`, new THREE.Vector3(Math.cos(support / 6 * Math.PI * 2) * 2.2, 12.8, Math.sin(support / 6 * Math.PI * 2) * 2.2), new THREE.Vector3(Math.cos(support / 6 * Math.PI * 2) * 3.65, 15.05, Math.sin(support / 6 * Math.PI * 2) * 3.65), 0.025, m.nickel);
  for (let pool = 0; pool < 9; pool += 1) {
    const angle = pool / 9 * Math.PI * 2; addPool(root, `ENTERTAINMENT__E08__REFLECTING_POOL_${pool + 1}`, 0.62, 2.2, [Math.cos(angle) * 5.3, 0.055, Math.sin(angle) * 5.3], m);
  }
  sign(root, 'ENTERTAINMENT__E08__MINIMAL_BASE_SIGN', 'HALO NINE', 2.6, 0.5, [0, 0.72, 1.3], '#f7fbff');
}

function createEclipse(root: THREE.Group, m: Materials) {
  ellipsoid(root, 'ENTERTAINMENT__E09__VOID_BLACK_PERFORMANCE_SPHERE', [5.2, 5.2, 5.2], m.obsidian, [0.6, 2.75, 0], true, 28);
  pulse(torus(root, 'ENTERTAINMENT__E09__WHITE_EQUATOR_LIGHT', 2.62, 0.075, m.warm, [0.6, 2.75, 0], [Math.PI / 2, 0, 0]), 0.28);
  const crescent = torus(root, 'ENTERTAINMENT__E09__POLISHED_NICKEL_CRESCENT_CURTAIN', 3.4, 0.88, m.nickel, [-0.5, 2.9, 0.15], [0, 0, -0.22], Math.PI * 1.45, 48); crescent.scale.y = 1.12;
  for (let thread = 0; thread < 18; thread += 1) {
    const angle = -1.8 + thread / 17 * 3.7; box(root, `ENTERTAINMENT__E09__MECHANICAL_CURTAIN_LIGHT_${thread + 1}`, [0.08, 2.5, 0.08], thread % 3 ? m.red : m.amber, [-0.5 + Math.cos(angle) * 3.35, 2.9 + Math.sin(angle) * 2.2, 0.75]);
  }
  box(root, 'ENTERTAINMENT__E09__SWEEPING_MIRRORED_CANOPY', [5.5, 0.22, 2.7], m.nickel, [0, 0.75, 3.8], false, [-0.1, 0, 0]);
  ellipsoid(root, 'ENTERTAINMENT__E09__HOLOGRAPHIC_ARTIFICIAL_MOON', [1.15, 1.15, 1.15], m.glass, [0, 5.8, 0.4]);
  for (const side of [-1, 1]) cylinder(root, `ENTERTAINMENT__E09__RED_STAIR_COLUMN_${side > 0 ? 'RIGHT' : 'LEFT'}`, 0.72, 4.1, m.red, [side * 4.25, 2.05, -1.8], false, 12);
  sign(root, 'ENTERTAINMENT__E09__CABARET_MARQUEE', 'ECLIPSE CABARET', 5.2, 0.72, [0, 1.05, 4.08], '#ff586d');
}

function createAurora(root: THREE.Group, m: Materials) {
  const widths = [11, 9.4, 7.8, 6.2];
  widths.forEach((width, index) => box(root, `ENTERTAINMENT__E10__STEPPED_SCREENING_VOLUME_${index + 1}`, [width, 1.25, 6.8 - index * 0.35], index % 2 ? m.glass : m.paleStone, [0, 0.65 + index * 1.18, -index * 0.24], index === 0));
  box(root, 'ENTERTAINMENT__E10__CENTRAL_ENTRANCE_TOWER', [3.0, 5.7, 2.4], m.darkTitanium, [0, 2.85, 3.15], false);
  for (let side = -1; side <= 1; side += 2) {
    pipe(root, `ENTERTAINMENT__E10__MONUMENTAL_ARCH_${side > 0 ? 'RIGHT' : 'LEFT'}`, new THREE.Vector3(side * 2.2, 0.4, 4.05), new THREE.Vector3(0, 5.4, 4.05), 0.18, m.nickel);
  }
  for (let fin = 0; fin < 13; fin += 1) box(root, `ENTERTAINMENT__E10__AURORA_LIGHT_FIN_${fin + 1}`, [0.14, 2.2 + (fin % 4) * 0.38, 0.52], [m.green, m.violet, m.cyan, m.magenta][fin % 4], [-5.5 + fin * 0.92, 5.0 + (fin % 4) * 0.18, 1.0]);
  for (let shutter = 0; shutter < 12; shutter += 1) box(root, `ENTERTAINMENT__E10__KINETIC_CANOPY_SHUTTER_${shutter + 1}`, [0.34, 0.09, 3.2], shutter % 2 ? m.nickel : m.glass, [-2.0 + shutter * 0.36, 1.1, 4.8], false, [0, 0, (shutter % 3 - 1) * 0.08]);
  for (let panel = 0; panel < 6; panel += 1) box(root, `ENTERTAINMENT__E10__LENTICULAR_POSTER_PANEL_${panel + 1}`, [1.05, 1.75, 0.08], panel % 2 ? m.iridescent : m.glass, [-4.7 + panel * 1.88, 2.1, 3.48]);
  for (let fountain = 0; fountain < 7; fountain += 1) cylinder(root, `ENTERTAINMENT__E10__FLUSH_EVENT_FOUNTAIN_${fountain + 1}`, 0.16, 0.32 + fountain % 3 * 0.16, m.cyan, [-3.6 + fountain * 1.2, 0.17, 5.5], false, 8);
  sign(root, 'ENTERTAINMENT__E10__AURORA_GRAND_ROOFLINE_SIGN', 'AURORA GRAND', 6.2, 0.8, [0, 5.6, 2.1], '#e8f5ff');
}

function createHorizon(root: THREE.Group, m: Materials) {
  for (const side of [-1, 1]) box(root, `ENTERTAINMENT__E11__RETRACTABLE_SCREEN_TOWER_${side > 0 ? 'RIGHT' : 'LEFT'}`, [0.72, 4.2, 0.86], m.obsidian, [side * 4.8, 2.1, -3.15], true);
  box(root, 'ENTERTAINMENT__E11__RETRACTABLE_PROJECTION_MEMBRANE', [9.55, 3.55, 0.08], m.whiteCeramic, [0, 2.18, -3.15]);
  for (let terrace = 0; terrace < 6; terrace += 1) {
    box(root, `ENTERTAINMENT__E11__LANDSCAPED_VIEWING_TERRACE_${terrace + 1}`, [11.8 - terrace * 0.65, 0.18, 1.38], terrace % 2 ? m.foliage : m.blackStone, [0, 0.1 + terrace * 0.18, -1.65 + terrace * 1.25], false, [-0.04, 0, 0]);
    box(root, `ENTERTAINMENT__E11__BRASS_TERRACE_LIGHT_${terrace + 1}`, [11.3 - terrace * 0.65, 0.045, 0.045], m.warm, [0, 0.22 + terrace * 0.18, -0.98 + terrace * 1.25]);
  }
  for (let pod = 0; pod < 8; pod += 1) {
    const side = pod % 2 ? 1 : -1; ellipsoid(root, `ENTERTAINMENT__E11__GLASS_BUBBLE_POD_${pod + 1}`, [1.3, 0.68, 1.3], [m.amber, m.magenta, m.blue][pod % 3], [side * (5.2 - Math.floor(pod / 2) * 0.22), 0.55 + Math.floor(pod / 2) * 0.16, -0.4 + Math.floor(pod / 2) * 1.95]);
  }
  for (let tower = 0; tower < 4; tower += 1) {
    const x = tower % 2 ? 5.65 : -5.65; const z = tower < 2 ? -0.9 : 4.75; cylinder(root, `ENTERTAINMENT__E11__PROJECTION_OBELISK_${tower + 1}`, 0.52, 3.3, m.obsidian, [x, 1.65, z], false, 4, [0, Math.PI / 4, 0]);
  }
  box(root, 'ENTERTAINMENT__E11__CURVED_ENTRANCE_PAVILION', [8.8, 1.4, 1.55], m.glass, [0, 0.72, 6.3], true);
  sign(root, 'ENTERTAINMENT__E11__HORIZON_SIGN', 'HORIZON SCREEN GARDENS', 7.2, 0.7, [0, 1.48, 7.1], '#edf8ff');
}

function createMeridian(root: THREE.Group, m: Materials) {
  box(root, 'ENTERTAINMENT__E12__CONCEALED_STONE_SERVICE_BASE', [12.2, 1.0, 7.8], m.paleStone, [0, 0.5, 0], true);
  const vaults = [{ x: -3.65, h: 4.6, mat: m.cyan }, { x: 0, h: 5.7, mat: m.blue }, { x: 3.65, h: 4.6, mat: m.glass }];
  vaults.forEach((vault, index) => {
    const shell = ellipsoid(root, `ENTERTAINMENT__E12__TRANSPARENT_DROPLET_VAULT_${index + 1}`, [4.1, vault.h, 7.0], m.glass, [vault.x, 0.7 + vault.h * 0.5, 0], index === 1, 22); shell.scale.y *= 1;
    for (let rib = 0; rib < 6; rib += 1) {
      const angle = -1.15 + rib * 0.46; pipe(root, `ENTERTAINMENT__E12__TITANIUM_VAULT_${index + 1}_RIB_${rib + 1}`, new THREE.Vector3(vault.x + Math.sin(angle) * 1.9, 0.9, -2.8), new THREE.Vector3(vault.x, vault.h + 0.75, Math.cos(angle) * 0.55), 0.055, m.nickel);
    }
    pulse(torus(root, `ENTERTAINMENT__E12__AQUATIC_LIGHT_RING_${index + 1}`, 1.45, 0.07, vault.mat, [vault.x, 2.0 + index * 0.35, 3.2], [0, 0, 0]), 0.24, index);
  });
  torus(root, 'ENTERTAINMENT__E12__MIST_OCULUS', 0.72, 0.08, m.warm, [0, 6.55, 0]);
  for (const side of [-1, 1]) cylinder(root, `ENTERTAINMENT__E12__ROUND_BAR_PAVILION_${side > 0 ? 'RIGHT' : 'LEFT'}`, 2.25, 0.92, m.glass, [side * 5.35, 2.25, 1.15], false, 24, [Math.PI / 2, 0, 0]);
  for (let veil = 0; veil < 3; veil += 1) box(root, `ENTERTAINMENT__E12__ENTRANCE_WATER_VEIL_${veil + 1}`, [0.68, 2.5, 0.04], m.water, [-1.25 + veil * 1.25, 1.35, 4.1]);
  for (let channel = 0; channel < 5; channel += 1) addPool(root, `ENTERTAINMENT__E12__PROMENADE_WATER_CHANNEL_${channel + 1}`, 0.26, 5.1, [-4.8 + channel * 2.4, 0.055, 5.4], m);
  sign(root, 'ENTERTAINMENT__E12__MERIDIAN_WATER_SIGN', 'MERIDIAN', 4.2, 0.72, [0, 1.8, 4.18], '#f5fcff');
}

function createGrotto(root: THREE.Group, m: Materials) {
  const shells = [
    [-2.8, 2.15, -0.8, 3.2], [2.0, 2.35, -0.5, 3.5], [0, 1.85, 2.1, 3.0], [-4.2, 1.6, 2.1, 2.4], [4.1, 1.75, 2.0, 2.5],
  ] as const;
  shells.forEach(([x, y, z, scale], index) => {
    const rock = prepare(new THREE.Mesh(new THREE.DodecahedronGeometry(scale * 0.5, 0), m.blackCeramic), `ENTERTAINMENT__E13__VOLCANIC_SHELL_${index + 1}`, true); rock.scale.set(1.35, 1, 1.12); rock.position.set(x, y, z); root.add(rock);
  });
  for (let fissure = 0; fissure < 15; fissure += 1) {
    const side = fissure % 2 ? 1 : -1; box(root, `ENTERTAINMENT__E13__LUMINOUS_MINERAL_FISSURE_${fissure + 1}`, [0.11, 1.1 + fissure % 4 * 0.38, 0.08], [m.magenta, m.blue, m.violet][fissure % 3], [side * (1.0 + (fissure % 7) * 0.62), 1.4 + fissure % 3 * 0.55, 3.05 - Math.floor(fissure / 7) * 2.3], false, [0, 0, side * (0.12 + fissure % 3 * 0.08)]);
  }
  addPool(root, 'ENTERTAINMENT__E13__DEEP_BLUE_ENTRANCE_BASIN', 5.2, 4.0, [0, 0.05, 4.15], m);
  box(root, 'ENTERTAINMENT__E13__BASIN_APPROACH_BRIDGE', [1.05, 0.14, 4.2], m.blackStone, [0, 0.18, 4.25]);
  for (const side of [-1, 1]) {
    cylinder(root, `ENTERTAINMENT__E13__CLIFF_BAR_${side > 0 ? 'RIGHT' : 'LEFT'}`, 2.3, 0.9, m.glass, [side * 4.35, 1.8, 0.65], false, 24, [Math.PI / 2, 0, 0]);
    torus(root, `ENTERTAINMENT__E13__CLIFF_BAR_NEON_${side > 0 ? 'RIGHT' : 'LEFT'}`, 1.15, 0.08, side > 0 ? m.magenta : m.violet, [side * 4.35, 1.8, 1.1], [0, 0, 0]);
    box(root, `ENTERTAINMENT__E13__CLIFF_WATERFALL_${side > 0 ? 'RIGHT' : 'LEFT'}`, [0.7, 2.5, 0.04], m.water, [side * 5.45, 1.35, 1.1]);
  }
  for (let stone = 0; stone < 16; stone += 1) ellipsoid(root, `ENTERTAINMENT__E13__LUMINOUS_ECOLOGY_STONE_${stone + 1}`, [0.18, 0.11, 0.18], stone % 2 ? m.green : m.violet, [-5.5 + (stone % 8) * 1.55, 0.14, -3.7 + Math.floor(stone / 8) * 7.8]);
  sign(root, 'ENTERTAINMENT__E13__REFLECTED_GROTTO_SIGN', 'NEON GROTTO', 4.8, 0.66, [0, 0.18, 3.9], '#e45cff', [-Math.PI / 2, 0, 0]);
}

function createPrismarium(root: THREE.Group, m: Materials) {
  const shellMaterial = m.glass;
  const shell = prepare(new THREE.Mesh(new THREE.OctahedronGeometry(4.35, 1), shellMaterial), 'ENTERTAINMENT__E14__DICHROIC_CRYSTAL_SHELL', false); shell.scale.set(1.2, 1, 1.0); shell.position.y = 3.8; root.add(shell);
  const edges = prepare(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(4.38, 1)), new THREE.LineBasicMaterial({ color: '#d9f8ff', transparent: true, opacity: 0.8 })), 'ENTERTAINMENT__E14__CRYSTAL_EDGE_NETWORK'); edges.scale.set(1.2, 1, 1); edges.position.y = 3.8; root.add(edges);
  box(root, 'ENTERTAINMENT__E14__APPARENTLY_SUSPENDED_BLACK_CUBE', [3.6, 3.6, 3.6], m.obsidian, [0, 3.8, 0], true, [0.22, 0.35, 0.14]);
  for (let bridge = 0; bridge < 4; bridge += 1) {
    const angle = bridge / 4 * Math.PI * 2; pipe(root, `ENTERTAINMENT__E14__HIDDEN_CUBE_BRIDGE_${bridge + 1}`, new THREE.Vector3(Math.cos(angle) * 1.6, 3.8, Math.sin(angle) * 1.6), new THREE.Vector3(Math.cos(angle) * 4.5, 3.8, Math.sin(angle) * 4.5), 0.14, m.obsidian);
  }
  box(root, 'ENTERTAINMENT__E14__OPTICAL_FORECOURT', [8.4, 0.12, 4.0], m.paleStone, [0, 0.06, 4.4]);
  for (let optic = 0; optic < 36; optic += 1) cylinder(root, `ENTERTAINMENT__E14__FLUSH_OPTICAL_ELEMENT_${optic + 1}`, 0.11, 0.03, [m.cyan, m.magenta, m.amber][optic % 3], [-3.6 + (optic % 9) * 0.9, 0.14, 3.1 + Math.floor(optic / 9) * 0.8], false, 8);
  for (let pylon = 0; pylon < 4; pylon += 1) cylinder(root, `ENTERTAINMENT__E14__HOLOGRAPHIC_PROJECTION_PYLON_${pylon + 1}`, 0.22, 4.8, m.darkTitanium, [pylon % 2 ? 4.65 : -4.65, 2.4, pylon < 2 ? -3.5 : 3.5], false, 7);
  sign(root, 'ENTERTAINMENT__E14__EDGE_LIT_GLASS_SIGN', 'PRISMARIUM', 4.4, 0.72, [0, 1.05, 4.75], '#dffcff');
}

function createSynesthesia(root: THREE.Group, m: Materials) {
  for (let bay = 0; bay < 14; bay += 1) {
    const x = -5.75 + bay * 0.88; const peak = 2.5 + (Math.sin(bay * 0.85) + 1) * 1.2;
    box(root, `ENTERTAINMENT__E15__WAVEFORM_HALL_BAY_${bay + 1}`, [0.98, peak, 6.5], bay % 2 ? m.whiteCeramic : m.nickel, [x, peak * 0.5, 0], true, [0, 0, Math.sin(bay * 0.7) * 0.04]);
    for (let panel = 0; panel < 5; panel += 1) {
      const face = box(root, `ENTERTAINMENT__E15__RESPONSIVE_PANEL_${bay + 1}_${panel + 1}`, [0.72, 0.48, 0.08], [m.cyan, m.amber, m.magenta, m.violet][(bay + panel) % 4], [x, 0.65 + panel * 0.62, 3.3], false, [0, Math.sin((bay + panel) * 0.9) * 0.22, 0]); face.userData.kineticFacade = true;
    }
  }
  addPool(root, 'ENTERTAINMENT__E15__CONFINED_MIST_CHANNEL', 11.6, 0.46, [0, 0.055, 4.15], m);
  box(root, 'ENTERTAINMENT__E15__MIRRORED_TROUGH_CANOPY', [5.4, 0.24, 2.0], m.nickel, [0, 1.0, 3.75], false, [-0.14, 0, 0]);
  for (let bench = 0; bench < 6; bench += 1) box(root, `ENTERTAINMENT__E15__VIBRATION_BENCH_${bench + 1}`, [1.35, 0.34, 0.55], bench % 2 ? m.glass : m.darkTitanium, [-4.4 + bench * 1.75, 0.2, 5.0]);
  sign(root, 'ENTERTAINMENT__E15__DEPTH_ALIGNED_SIGN', 'SYNESTHESIA', 5.2, 0.72, [0, 1.2, 4.1], '#ee84ff');
}

function createZeroG(root: THREE.Group, m: Materials) {
  addPool(root, 'ENTERTAINMENT__E16__CIRCULAR_REFLECTING_BASIN', 9.0, 8.5, [0, 0.05, 0], m);
  ellipsoid(root, 'ENTERTAINMENT__E16__SUSPENDED_PEARL_SPHERE', [6.4, 6.4, 6.4], m.whiteCeramic, [0, 4.15, 0], true, 28);
  const ringRotations: readonly (readonly [number, number, number])[] = [[0.2, 0.1, 0.7], [0.9, 0.4, -0.25], [1.15, -0.45, 0.35]];
  [m.cyan, m.violet, m.warm].forEach((mat, index) => rotate(torus(root, `ENTERTAINMENT__E16__GYROSCOPIC_RING_${index + 1}`, 4.0 + index * 0.28, 0.15, mat, [0, 4.15, 0], ringRotations[index], Math.PI * 2, 48), (index + 1) * (index % 2 ? -0.008 : 0.006), ['x', 'y', 'z'][index] as 'x' | 'y' | 'z'));
  for (let longitude = 0; longitude < 8; longitude += 1) torus(root, `ENTERTAINMENT__E16__COORDINATE_GRID_${longitude + 1}`, 3.22, 0.025, m.blue, [0, 4.15, 0], [Math.PI / 2, longitude / 8 * Math.PI, 0], Math.PI * 2, 28);
  for (let pylon = 0; pylon < 4; pylon += 1) {
    const angle = pylon / 4 * Math.PI * 2 + Math.PI / 4; pipe(root, `ENTERTAINMENT__E16__CONCEALED_SUPPORT_PYLON_${pylon + 1}`, new THREE.Vector3(Math.cos(angle) * 2.65, 0.2, Math.sin(angle) * 2.65), new THREE.Vector3(Math.cos(angle) * 2.25, 2.5, Math.sin(angle) * 2.25), 0.18, m.darkTitanium, true);
  }
  for (const side of [-1, 1]) box(root, `ENTERTAINMENT__E16__EQUATORIAL_ENTRY_BRIDGE_${side > 0 ? 'RIGHT' : 'LEFT'}`, [1.1, 0.18, 4.1], m.glass, [side * 3.85, 4.05, 0], false, [0, Math.PI / 2, 0]);
  sign(root, 'ENTERTAINMENT__E16__ROTATING_RING_SIGN', 'ZERO-G', 2.8, 0.6, [0, 6.8, 3.4], '#f4fbff');
}

function createDream(root: THREE.Group, m: Materials) {
  const capsuleMaterials = [m.nickel, m.iridescent, m.whiteCeramic, m.obsidian, m.glass];
  for (let capsule = 0; capsule < 12; capsule += 1) {
    const level = Math.floor(capsule / 4); const angle = capsule % 4 / 4 * Math.PI * 2 + level * 0.45;
    const value = ellipsoid(root, `ENTERTAINMENT__E17__DREAM_CAPSULE_${capsule + 1}`, [3.6, 1.55, 2.2], capsuleMaterials[capsule % capsuleMaterials.length], [Math.cos(angle) * (2.5 + level * 0.25), 1.1 + level * 2.35, Math.sin(angle) * 2.2], capsule < 4, 18); value.rotation.set(0.15 * (capsule % 3 - 1), -angle + Math.PI / 2, 0.16 * (capsule % 2 ? 1 : -1));
  }
  for (let bridge = 0; bridge < 8; bridge += 1) {
    const angle = bridge / 8 * Math.PI * 2; pipe(root, `ENTERTAINMENT__E17__LUMINOUS_CAPSULE_BRIDGE_${bridge + 1}`, new THREE.Vector3(Math.cos(angle) * 1.2, 2.3 + (bridge % 3) * 1.6, Math.sin(angle) * 1.2), new THREE.Vector3(Math.cos(angle) * 3.2, 2.3 + (bridge % 3) * 1.6, Math.sin(angle) * 2.5), 0.13, bridge % 2 ? m.cyan : m.magenta);
  }
  for (let particle = 0; particle < 34; particle += 1) box(root, `ENTERTAINMENT__E17__DIGITAL_WATERFALL_PARTICLE_${particle + 1}`, [0.035, 0.3 + particle % 4 * 0.12, 0.035], [m.cyan, m.violet, m.magenta][particle % 3], [-0.6 + (particle % 7) * 0.2, 0.6 + (particle * 0.73) % 7.0, -0.4 + (particle % 5) * 0.18]);
  for (let portal = 0; portal < 3; portal += 1) torus(root, `ENTERTAINMENT__E17__LUMINOUS_ENTRY_PORTAL_${portal + 1}`, 0.9 + portal * 0.08, 0.15, [m.cyan, m.magenta, m.violet][portal], [-2.2 + portal * 2.2, 1.2, 3.65], [0, 0, 0]);
  box(root, 'ENTERTAINMENT__E17__GLITCH_SERVICE_TOWER', [1.65, 6.8, 1.7], m.nickel, [4.15, 3.4, -2.1], true);
  sign(root, 'ENTERTAINMENT__E17__PIXEL_CASCADE_SIGN', 'DREAM ARCADE', 4.5, 0.74, [0, 7.9, 0.5], '#78e9ff');
}

function createProbability(root: THREE.Group, m: Materials) {
  const volumes = [
    [[7.6, 2.3, 6.2], [0, 1.15, 0], 0.06], [[6.2, 2.0, 5.4], [-2.1, 3.0, -0.5], -0.16], [[6.6, 2.1, 5.0], [2.2, 4.55, 0.4], 0.18], [[5.2, 1.7, 4.6], [-1.0, 6.1, -0.2], -0.08],
  ] as const;
  volumes.forEach(([size, position, rotation], index) => box(root, `ENTERTAINMENT__E18__IMPROBABLE_SLIDING_VOLUME_${index + 1}`, size, index % 2 ? m.glass : m.obsidian, position, true, [0, rotation, 0]));
  for (let screen = 0; screen < 26; screen += 1) {
    const x = -3.7 + (screen % 13) * 0.62; const y = 0.75 + Math.floor(screen / 13) * 2.15; box(root, `ENTERTAINMENT__E18__PROBABILITY_SCREEN_STRIP_${screen + 1}`, [0.18 + (screen % 4) * 0.05, 1.35, 0.08], m.titanium, [x, y, 3.25], false, [0, (screen % 3 - 1) * 0.18, 0]);
  }
  for (let line = 0; line < 12; line += 1) pulse(box(root, `ENTERTAINMENT__E18__RANDOMIZED_LIGHT_LINE_${line + 1}`, [0.055, 1.0 + (line * 1.7) % 4.6, 0.06], [m.green, m.warm, m.amber][line % 3], [-3.4 + line * 0.62, 2.2, 3.4]), 0.3 + line * 0.012, line);
  box(root, 'ENTERTAINMENT__E18__CANTILEVERED_ENTRANCE_BLOCK', [7.2, 1.5, 3.1], m.blackCeramic, [0, 2.15, 4.0]);
  for (let light = 0; light < 20; light += 1) ellipsoid(root, `ENTERTAINMENT__E18__MIRRORED_MATRIX_LIGHT_${light + 1}`, [0.05, 0.05, 0.05], light % 3 ? m.warm : m.green, [-2.8 + (light % 10) * 0.62, 1.36, 3.1 + Math.floor(light / 10) * 0.6]);
  for (let jet = 0; jet < 18; jet += 1) cylinder(root, `ENTERTAINMENT__E18__ALGORITHMIC_FOUNTAIN_JET_${jet + 1}`, 0.08, 0.16 + (jet * 7 % 9) * 0.08, m.cyan, [-4.3 + (jet % 9) * 1.08, 0.08, 5.55 + Math.floor(jet / 9) * 0.65], false, 6);
  for (let frame = 0; frame < 3; frame += 1) rotate(torus(root, `ENTERTAINMENT__E18__INTERSECTING_RECTANGULAR_CROWN_FRAME_${frame + 1}`, 2.0 + frame * 0.32, 0.08, frame % 2 ? m.warm : m.titanium, [0, 7.4, 0], [Math.PI / 2, frame * 0.7, frame * 0.35], Math.PI * 2, 4), 0.012 * (frame + 1));
  sign(root, 'ENTERTAINMENT__E18__ALIGNED_PERFORATION_SIGN', 'PROBABILITY PALACE', 6.2, 0.68, [0, 3.0, 5.58], '#f5d690');
}

function createChrono(root: THREE.Group, m: Materials) {
  cylinder(root, 'ENTERTAINMENT__E19__ENGRAVED_TIME_TOWER', 3.8, 9.0, m.copper, [0, 4.5, 0], true, 24);
  for (let marking = 0; marking < 28; marking += 1) {
    const angle = marking / 28 * Math.PI * 2; box(root, `ENTERTAINMENT__E19__CHRONOLOGICAL_MARKING_${marking + 1}`, [0.08, 0.52, 0.08], [m.amber, m.cyan, m.red][marking % 3], [Math.cos(angle) * 1.94, 0.6 + (marking % 12) * 0.64, Math.sin(angle) * 1.94], false, [0, -angle, 0]);
  }
  const ringRotations: readonly (readonly [number, number, number])[] = [[Math.PI / 2, 0, 0], [0.55, 0.3, 0.55], [1.05, -0.4, -0.35]];
  ringRotations.forEach((rotation, index) => {
    const ring = rotate(torus(root, `ENTERTAINMENT__E19__MECHANICAL_TIME_RING_${index + 1}`, 4.5 + index * 0.55, 0.18, m.darkTitanium, [0, 5.3, 0], rotation, Math.PI * 2, 54), (index + 1) * (index % 2 ? -0.006 : 0.004), ['x', 'y', 'z'][index] as 'x' | 'y' | 'z'); ring.userData.everyHourAlignment = true;
    for (let capsule = 0; capsule < 7; capsule += 1) {
      const angle = capsule / 7 * Math.PI * 2; const seed = ellipsoid(root, `ENTERTAINMENT__E19__TIME_RING_${index + 1}_SEED_CAPSULE_${capsule + 1}`, [0.74, 0.42, 0.42], m.obsidian, [Math.cos(angle) * (4.5 + index * 0.55), 5.3 + Math.sin(angle) * (4.5 + index * 0.55), 0]); seed.rotation.z = angle;
    }
  });
  cylinder(root, 'ENTERTAINMENT__E19__CIRCULAR_BASE_PAVILION', 10.5, 1.3, m.darkTitanium, [0, 0.65, 0], true, 32);
  for (let plate = 0; plate < 14; plate += 1) box(root, `ENTERTAINMENT__E19__MECHANICAL_IRIS_PLATE_${plate + 1}`, [2.9, 0.14, 1.1], plate % 2 ? m.copper : m.nickel, [Math.cos(plate / 14 * Math.PI * 2) * 2.0, 1.38, Math.sin(plate / 14 * Math.PI * 2) * 2.0], false, [0, -plate / 14 * Math.PI * 2, 0]);
  for (let track = 0; track < 3; track += 1) torus(root, `ENTERTAINMENT__E19__CONCENTRIC_TIME_TRACK_${track + 1}`, 3.8 + track * 0.72, 0.055, [m.amber, m.warm, m.cyan][track], [0, 0.16, 4.1]);
  sign(root, 'ENTERTAINMENT__E19__RAILWAY_CLOCK_SIGN', 'CHRONO CAROUSEL', 5.8, 0.75, [0, 2.05, 5.05], '#ffc05d');
}

function createPhantom(root: THREE.Group, m: Materials) {
  box(root, 'ENTERTAINMENT__E20__LOW_BLACK_MIRROR_STRUCTURE', [12.6, 3.25, 6.4], m.obsidian, [0, 1.63, 0], true);
  for (let opening = 0; opening < 10; opening += 1) box(root, `ENTERTAINMENT__E20__BIOLUMINESCENT_FACADE_TEAR_${opening + 1}`, [0.16 + opening % 3 * 0.07, 1.4 + opening % 4 * 0.35, 0.08], [m.green, m.cyan, m.violet][opening % 3], [-5.2 + opening * 1.16, 1.55, 3.25], false, [0, 0, (opening % 3 - 1) * 0.16]);
  const shellScales = [[3.2, 2.4, 2.7], [2.5, 2.9, 2.5], [3.1, 2.1, 2.4], [2.2, 2.6, 2.0]] as const;
  shellScales.forEach((scale, index) => ellipsoid(root, `ENTERTAINMENT__E20__TRANSLUCENT_BIOME_CELL_${index + 1}`, scale, index % 2 ? m.glass : m.whiteCeramic, [-4.3 + index * 2.85, 3.25 + index % 2 * 0.3, -0.4 + index % 3 * 0.4], false, 16));
  for (let fern = 0; fern < 18; fern += 1) tree(root, `ENTERTAINMENT__E20__LUMINOUS_FERN_TREE_${fern + 1}`, -6.1 + (fern % 9) * 1.52, -4.1 + Math.floor(fern / 9) * 8.3, m, 0.34 + fern % 3 * 0.08);
  for (let wetland = 0; wetland < 5; wetland += 1) addPool(root, `ENTERTAINMENT__E20__LUMINOUS_WETLAND_POOL_${wetland + 1}`, 1.8, 0.95, [-4.7 + wetland * 2.35, 0.05, 4.55], m);
  for (let emitter = 0; emitter < 5; emitter += 1) {
    cylinder(root, `ENTERTAINMENT__E20__BLACK_TREE_HOLOGRAPHIC_EMITTER_${emitter + 1}`, 0.28, 4.2, m.blackCeramic, [-5.0 + emitter * 2.5, 2.1, -3.55], false, 7);
    ellipsoid(root, `ENTERTAINMENT__E20__EMITTER_CROWN_${emitter + 1}`, [0.8, 1.0, 0.8], m.foliage, [-5.0 + emitter * 2.5, 4.45, -3.55]);
  }
  ellipsoid(root, 'ENTERTAINMENT__E20__HOLOGRAPHIC_AIR_WHALE', [5.6, 1.2, 1.6], m.glass, [0, 7.0, -0.6]);
  sign(root, 'ENTERTAINMENT__E20__ULTRAVIOLET_HANDWRITTEN_SIGN', 'PHANTOM MENAGERIE', 6.1, 0.74, [0, 2.55, 3.33], '#c681ff');
}

function createBuilding(record: EntertainmentBuildingProgram, m: Materials) {
  const root = new THREE.Group(); root.name = `ENTERTAINMENT__${record.code}__${record.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
  switch (record.code) {
    case 'E01': createAurelia(root, m); break;
    case 'E02': createTidal(root, m); break;
    case 'E03': createHelix(root, m); break;
    case 'E04': createEmberIce(root, m); break;
    case 'E05': createOrion(root, m); break;
    case 'E06': createVelvet(root, m); break;
    case 'E07': createPulse(root, m); break;
    case 'E08': createHaloNine(root, m); break;
    case 'E09': createEclipse(root, m); break;
    case 'E10': createAurora(root, m); break;
    case 'E11': createHorizon(root, m); break;
    case 'E12': createMeridian(root, m); break;
    case 'E13': createGrotto(root, m); break;
    case 'E14': createPrismarium(root, m); break;
    case 'E15': createSynesthesia(root, m); break;
    case 'E16': createZeroG(root, m); break;
    case 'E17': createDream(root, m); break;
    case 'E18': createProbability(root, m); break;
    case 'E19': createChrono(root, m); break;
    case 'E20': createPhantom(root, m); break;
  }
  root.userData.exteriorProgram = true; root.userData.buildingCode = record.code; root.userData.buildingName = record.name; root.userData.semanticName = record.name;
  root.userData.buildingSubtitle = record.subtitle; root.userData.placementZone = record.zone; root.userData.facilityForm = record.form; root.userData.footprintMetres = [...record.footprintMetres]; root.userData.heightMetres = record.heightMetres;
  root.userData.exteriorSignature = record.exteriorSignature; root.userData.exteriorOnly = true; root.userData.navObstacle = true;
  root.traverse((object) => { object.userData.selectableId = DISTRICT_ID; object.userData.districtId = DISTRICT_ID; });
  return root;
}

function pointInDistrict(definition: DistrictDefinition, radialT: number, angularT: number, y = FLOOR_Y) {
  const sector = definition.sector!; const radius = THREE.MathUtils.lerp(sector.innerRadius, sector.outerRadius, radialT); const angle = THREE.MathUtils.lerp(sector.startAngle, sector.endAngle, angularT);
  return new THREE.Vector3(Math.cos(angle) * radius - definition.position[0], y, Math.sin(angle) * radius - definition.position[2]);
}

function districtArc(definition: DistrictDefinition, radialT: number, startAngularT: number, endAngularT: number, segments: number, y = FLOOR_Y) {
  return Array.from({ length: segments + 1 }, (_, index) => pointInDistrict(definition, radialT, THREE.MathUtils.lerp(startAngularT, endAngularT, index / segments), y));
}

function ribbonGeometry(points: readonly THREE.Vector3[], width: number) {
  const positions: number[] = []; const indices: number[] = [];
  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5);
    positions.push(point.x + normal.x, point.y, point.z + normal.z, point.x - normal.x, point.y, point.z - normal.z);
    if (index < points.length - 1) { const offset = index * 2; indices.push(offset, offset + 2, offset + 1, offset + 2, offset + 3, offset + 1); }
  });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function ribbon(parent: THREE.Object3D, name: string, points: readonly THREE.Vector3[], width: number, mat: THREE.Material, walkable = true) {
  const value = prepare(new THREE.Mesh(ribbonGeometry(points, width), mat), name); value.userData.walkable = walkable; value.userData.navObstacle = false; value.userData.entertainmentRoute = true; parent.add(value); return value;
}

function nearestPoint(points: readonly THREE.Vector3[], target: THREE.Vector3) {
  return points.reduce((nearest, point) => point.distanceToSquared(target) < nearest.distanceToSquared(target) ? point : nearest, points[0]);
}

function addPublicRealm(district: THREE.Group, definition: DistrictDefinition, facilities: readonly THREE.Group[], m: Materials) {
  const infrastructure = prepare(new THREE.Group(), 'ENTERTAINMENT__LUMINOUS_CRESCENT_INFRASTRUCTURE');
  const landscape = prepare(new THREE.Group(), 'ENTERTAINMENT__LUMINOUS_CRESCENT_PUBLIC_REALM');
  const boulevard = districtArc(definition, 0.49, 0.035, 0.965, 92, FLOOR_Y + 0.014);
  ribbon(infrastructure, 'ENTERTAINMENT__LUMEN_BOULEVARD', boulevard, 1.65, m.blackStone);
  ribbon(infrastructure, 'ENTERTAINMENT__LUMEN_BOULEVARD_CHAMPAGNE_EDGE', boulevard.map((point) => point.clone().setY(FLOOR_Y + 0.029)), 0.085, m.titanium, false);
  ENTERTAINMENT_BUILDING_PROGRAM.forEach((record, index) => {
    const facility = facilities[index]; const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(facility.quaternion).setY(0).normalize(); const entrance = facility.position.clone().addScaledVector(forward, record.footprintMetres[1] / 20 + 0.55).setY(FLOOR_Y + 0.016);
    const boulevardPoint = nearestPoint(boulevard, entrance).clone(); const bend = boulevardPoint.clone().lerp(entrance, 0.55); bend.addScaledVector(new THREE.Vector3(-forward.z, 0, forward.x), (index % 2 ? 1 : -1) * 0.35);
    ribbon(infrastructure, `ENTERTAINMENT__${record.code}__LUMEN_APPROACH`, [boulevardPoint, bend, entrance], 0.78, m.paleStone);
    ribbon(infrastructure, `ENTERTAINMENT__${record.code}__GUIDANCE_LINE`, [boulevardPoint.clone().setY(FLOOR_Y + 0.032), bend.clone().setY(FLOOR_Y + 0.032), entrance.clone().setY(FLOOR_Y + 0.032)], 0.045, record.zone === 'residential-quiet' ? m.warm : index % 2 ? m.cyan : m.magenta, false);
  });
  const haloCodes = ['E07', 'E08', 'E18', 'E19']; const haloFacilities = haloCodes.map((code) => facilities[ENTERTAINMENT_BUILDING_PROGRAM.findIndex((record) => record.code === code)]);
  haloFacilities.slice(0, -1).forEach((startFacility, index) => {
    const endFacility = haloFacilities[index + 1]; const start = startFacility.position.clone().setY(4.75); const end = endFacility.position.clone().setY(4.75); const direction = end.clone().sub(start).setY(0).normalize(); const normal = new THREE.Vector3(-direction.z, 0, direction.x);
    const points = [start.clone(), start.clone().lerp(end, 0.5), end.clone()]; ribbon(infrastructure, `ENTERTAINMENT__HALO_WALK_SEGMENT_${index + 1}`, points, 0.88, m.glass);
    for (const side of [-1, 1]) pipe(infrastructure, `ENTERTAINMENT__HALO_WALK_SEGMENT_${index + 1}_RAIL_${side > 0 ? 'R' : 'L'}`, start.clone().addScaledVector(normal, side * 0.43).add(new THREE.Vector3(0, 0.62, 0)), end.clone().addScaledVector(normal, side * 0.43).add(new THREE.Vector3(0, 0.62, 0)), 0.035, m.nickel);
    for (let support = 1; support <= 3; support += 1) { const point = start.clone().lerp(end, support / 4); pipe(infrastructure, `ENTERTAINMENT__HALO_WALK_SEGMENT_${index + 1}_SUPPORT_${support}`, point.clone().setY(FLOOR_Y), point, 0.08, m.darkTitanium); }
  });
  for (let treeIndex = 0; treeIndex < 32; treeIndex += 1) {
    const angularT = 0.045 + treeIndex / 31 * 0.91; const side = treeIndex % 2 ? 1 : -1; const point = pointInDistrict(definition, 0.49 + side * 0.034, angularT, FLOOR_Y); tree(landscape, `ENTERTAINMENT__LUMINOUS_BOULEVARD_TREE_${treeIndex + 1}`, point.x, point.z, m, 0.48 + treeIndex % 3 * 0.06);
  }
  for (let pool = 0; pool < 12; pool += 1) { const point = pointInDistrict(definition, 0.455, 0.08 + pool / 11 * 0.84, FLOOR_Y + 0.01); addPool(landscape, `ENTERTAINMENT__BOULEVARD_REFLECTING_POOL_${pool + 1}`, 1.25, 0.42, [point.x, point.y, point.z], m); }
  infrastructure.userData.circulation = { lumenBoulevard: 'curved walkable primary route', haloWalk: 'three open-air elevated bridge segments linking four skyline landmarks', buildingApproaches: 20, accessibleRoutesIntegrated: true };
  landscape.userData.publicRealm = { luminousTrees: 32, reflectingPools: 12, paving: 'wet-look black basalt with champagne-metal edge', tropicalTransition: true, residentialDarkSkyEdge: true };
  district.add(infrastructure, landscape); return { infrastructure, landscape };
}

export function buildEntertainmentDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Luxury / Entertainment district requires a bounded sector');
  const materials = createMaterials();
  const facilities = ENTERTAINMENT_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials); building.position.copy(pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02));
    const worldPosition = building.position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: record.radialT, normalizedAngular: record.angularT };
    district.add(building); return building;
  });
  const publicRealm = addPublicRealm(district, definition, facilities, materials);
  const buildings = ENTERTAINMENT_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, subtitle: record.subtitle, zone: record.zone, form: record.form, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorSignature: record.exteriorSignature }));
  const zones = {
    outerNorthern: ENTERTAINMENT_BUILDING_PROGRAM.filter((record) => record.zone === 'outer-northern').map((record) => record.name),
    artMarketing: ENTERTAINMENT_BUILDING_PROGRAM.filter((record) => record.zone === 'art-marketing').map((record) => record.name),
    residentialQuiet: ENTERTAINMENT_BUILDING_PROGRAM.filter((record) => record.zone === 'residential-quiet').map((record) => record.name),
    tropicalEcological: ENTERTAINMENT_BUILDING_PROGRAM.filter((record) => record.zone === 'tropical-ecological').map((record) => record.name),
  };
  district.userData.entertainmentDistrict = {
    name: 'The Luminous Crescent', buildingCount: facilities.length, buildings, zones,
    circulation: publicRealm.infrastructure.userData.circulation,
    publicRealm: publicRealm.landscape.userData.publicRealm,
    signatureSystems: { aureliaEllipticalFloors: 5, tidalWaveScales: 11, helixPromenadeSegments: 30, velvetKineticRibbons: 42, pulseAcousticButtresses: 8, haloReflectingPools: 9, synesthesiaResponsivePanels: 70, dreamCapsules: 12, chronoTimeRings: 3, phantomBiomeCells: 4 },
    architecturalPalette: ['champagne titanium', 'black ceramic', 'polished stone', 'low-iron glass', 'electrochromic walls', 'structural neon', 'wet-look black paving', 'reflecting water', 'kinetic metal screens'],
    lightingProtocol: 'integrated structural neon; retractable or restrained daylight media; warm downward-directed residential edge; localized ecological and dark-sky shields',
    acousticProtocol: 'large clubs on the outer north boundary; acoustic buttresses, landscape buffers, directional lighting, and quiet inner venues protect guest, residential, and ecological neighbors',
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: ENTERTAINMENT_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: ['Lumen Boulevard', 'Halo Walk', 'luminous tree allée', 'reflecting pool chain', 'twenty exact building approaches'],
    realizedFeatureTags: ENTERTAINMENT_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length, realizedObjectCount: publicRealm.infrastructure.children.length + publicRealm.landscape.children.length,
    distinct: true, asymmetricCampus: true, localRoadCount: 24, radialCoverage: 0.96, angularCoverage: 0.96, exteriorOnly: true, luminousCrescentNarrative: true, lumenBoulevardWalkable: true, haloWalkOpenAir: true,
  };
}
