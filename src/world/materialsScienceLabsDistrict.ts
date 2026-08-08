import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { DistrictDefinition } from '../data/districts';

type MaterialsScienceBuildingForm =
  | 'compiler'
  | 'laminaris'
  | 'topologica'
  | 'morphostructure'
  | 'polyphase'
  | 'aegis'
  | 'ceramatrix'
  | 'ion-vault'
  | 'photon-weave'
  | 'porosium'
  | 'symbiomatter'
  | 'vitrimer'
  | 'fourth-form'
  | 'second-life'
  | 'atomic-cartography';

export interface MaterialsScienceBuildingProgram {
  code: string;
  name: string;
  subtitle: string;
  purpose: string;
  form: MaterialsScienceBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
}

export const MATERIALS_SCIENCE_BUILDING_PROGRAM: readonly MaterialsScienceBuildingProgram[] = [
  { code: 'M1', name: 'The Matter Compiler', subtitle: 'Autonomous Materials Discovery Foundry', purpose: 'AI-guided discovery, robotic synthesis, high-throughput experimentation, computational materials design, and closed-loop optimization', form: 'compiler', footprintMetres: [184, 164], heightMetres: 88, radialT: 0.16, angularT: 0.50, placementZone: 'Inner Precision Arc civic anchor', exteriorMotif: 'six interlocking hexagonal blocks around an open void, replaceable material cassettes, robotic transfer slots, cantilevered entry, and circular roof gantry' },
  { code: 'M2', name: 'Laminaris Institute', subtitle: 'Two-Dimensional and Moiré Materials Laboratory', purpose: 'Graphene-class systems, transition-metal dichalcogenides, van der Waals heterostructures, moiré materials, and atomically thin electronics', form: 'laminaris', footprintMetres: [166, 122], heightMetres: 52, radialT: 0.16, angularT: 0.08, placementZone: 'Inner Precision Arc layered-matter edge', exteriorMotif: 'seven ultra-thin floating plates, interference-coated glass, membrane canopy, flexible wind ribbons, and luminous layer edges' },
  { code: 'M3', name: 'Topologica Hall', subtitle: 'Quantum, Superconducting and Spin Materials Institute', purpose: 'Quantum materials, topological phases, superconductors, spintronics, magnetic textures, and strongly correlated matter', form: 'topologica', footprintMetres: [172, 138], heightMetres: 34, radialT: 0.16, angularT: 0.29, placementZone: 'Inner Precision Arc quiet quantum sector', exteriorMotif: 'two graphite crescent wings around an inaccessible void, a continuous twisted metallic ribbon, reflecting basin, and three cryogenic towers' },
  { code: 'M4', name: 'Morphostructure Pavilion', subtitle: 'Programmable and Mechanical Metamaterials Laboratory', purpose: 'Architected matter, auxetic structures, mechanical metamaterials, shape-memory systems, liquid-crystal elastomers, and trainable materials', form: 'morphostructure', footprintMetres: [176, 146], heightMetres: 48, radialT: 0.50, angularT: 0.08, placementZone: 'Central Adaptive Belt western gateway', exteriorMotif: 'five-storey oval inside a reconfigurable cellular exoskeleton, auxetic canopy, metamaterial columns, and articulated roof scales' },
  { code: 'M5', name: 'Polyphase Forge', subtitle: 'High-Entropy and Complex-Concentrated Alloys Center', purpose: 'High-entropy alloys, multi-principal-element systems, refractory alloys, metallic glasses, and compositionally complex nanoparticles', form: 'polyphase', footprintMetres: [190, 148], heightMetres: 66, radialT: 0.84, angularT: 0.08, placementZone: 'Outer Forge Front industrial gateway', exteriorMotif: 'eight rotated ingot-like volumes in distinct metal finishes, exposure strips, triangular entrance, quench towers, and alloy test court' },
  { code: 'M6', name: 'Aegis Bastion', subtitle: 'Extreme-Environment, Fusion and Radiation Materials Laboratory', purpose: 'Fusion, radiation damage, plasma-facing components, hypersonic heating, high-pressure environments, severe corrosion, and long-duration space exposure', form: 'aegis', footprintMetres: [182, 150], heightMetres: 58, radialT: 0.84, angularT: 0.29, placementZone: 'Outer Forge Front astronomy-facing boundary', exteriorMotif: 'three nested technical shells, numbered sacrificial armour fields, zigzag blast-wall approach, circular portal, and shielded test yard' },
  { code: 'M7', name: 'Ceramatrix Works', subtitle: 'Ultrahigh-Temperature Ceramics and Composite Materials Center', purpose: 'Ultrahigh-temperature ceramics, ceramic-matrix composites, thermal barriers, structural ceramics, and woven reinforcement systems', form: 'ceramatrix', footprintMetres: [188, 142], heightMetres: 61, radialT: 0.84, angularT: 0.50, placementZone: 'Outer Forge Front ceramic-production center', exteriorMotif: 'leaning interlocking shell arches, woven ceramic ribs, thermal-tile sawteeth, long ceramic entrance blade, and fracture court' },
  { code: 'M8', name: 'The Ion Vault', subtitle: 'Solid-State Battery and Ionic Materials Institute', purpose: 'Solid electrolytes, ion-conducting ceramics, metal-anode interfaces, multivalent systems, electrochemical materials, and grid-scale storage chemistry', form: 'ion-vault', footprintMetres: [178, 126], heightMetres: 54, radialT: 0.50, angularT: 0.29, placementZone: 'Central Adaptive Belt energy interface', exteriorMotif: 'five offset ceramic cell volumes, dark compression frames, electrochromic bands, transparent bridge entrance, heat channels, and migrating interface light' },
  { code: 'M9', name: 'Photon Weave Institute', subtitle: 'Photonic, Optoelectronic and Wide-Bandgap Materials Laboratory', purpose: 'Photonic materials, optical metasurfaces, transparent electronics, wide-bandgap semiconductors, quantum emitters, and structural colour', form: 'photon-weave', footprintMetres: [148, 126], heightMetres: 78, radialT: 0.16, angularT: 0.71, placementZone: 'Inner Precision Arc optical landmark', exteriorMotif: 'eight-storey prism wrapped in optical fins, triangular corner voids with reflective thread meshes, inverted-prism entry, and heliostat crown' },
  { code: 'M10', name: 'Porosium Towers', subtitle: 'Porous Frameworks, Membranes and Atmospheric Materials Center', purpose: 'Metal-organic frameworks, covalent organic frameworks, selective membranes, gas separation, atmospheric water capture, carbon sorbents, and molecular sieves', form: 'porosium', footprintMetres: [170, 142], heightMetres: 112, radialT: 0.50, angularT: 0.92, placementZone: 'Central Adaptive Belt forest-facing collector', exteriorMotif: 'unequal porous towers with progressively opening cellular exoskeletons, flared collector crowns, condensation columns, and membrane ribbons' },
  { code: 'M11', name: 'Symbiomatter Conservatory', subtitle: 'Living, Biofabricated and Bio-Inspired Materials Laboratory', purpose: 'Mycelium composites, bacterial cellulose, engineered living materials, biomineralization, adaptive bio-composites, and biologically assisted manufacturing', form: 'symbiomatter', footprintMetres: [186, 154], heightMetres: 38, radialT: 0.50, angularT: 0.71, placementZone: 'Forest Transition beside the Temperate Deciduous Forest Dome', exteriorMotif: 'low branching pavilions beneath leaf-vein roofs, replaceable grown wall blocks, monitored living panels, braided arch, and constructed wetlands' },
  { code: 'M12', name: 'Vitrimer House', subtitle: 'Self-Healing, Reprocessable and Adaptive Polymer Institute', purpose: 'Vitrimers, self-healing polymers, reversible networks, recyclable thermosets, soft actuators, and stress-responsive materials', form: 'vitrimer', footprintMetres: [158, 128], heightMetres: 36, radialT: 0.50, angularT: 0.50, placementZone: 'Central Adaptive Belt forest transition', exteriorMotif: 'three continuous rounded volumes under translucent elastomer membranes, visible healed scars, seam entry, responsive polymer alley, and inflated roof ridges' },
  { code: 'M13', name: 'Fourth-Form Foundry', subtitle: 'Additive, Gradient and 4D Manufacturing Center', purpose: 'Multi-material additive manufacturing, large-scale printing, graded materials, embedded electronics, 4D-printed structures, and robotic fabrication', form: 'fourth-form', footprintMetres: [208, 160], heightMetres: 52, radialT: 0.84, angularT: 0.92, placementZone: 'Outer Forge Front freight-oriented fabrication edge', exteriorMotif: 'long hall crossed by a continuous printed branching exoskeleton, coarse-to-fine layer gradient, immense segmented doors, spiral canopy, and mobile gantry printers' },
  { code: 'M14', name: 'Second-Life Materials Exchange', subtitle: 'Circular Materials, Deconstruction and Urban Mining Institute', purpose: 'Material recovery, reversible construction, selective disassembly, critical-material recycling, remanufacturing, and circular product systems', form: 'second-life', footprintMetres: [190, 148], heightMetres: 46, radialT: 0.84, angularT: 0.71, placementZone: 'Outer Forge Front circular-materials yard', exteriorMotif: 'three stepped halls assembled on a strict reuse grid, visible reversible connectors and passports, turbine-blade arch, deconstruction court, and removable roof cassettes' },
  { code: 'M15', name: 'Atomic Cartography Observatory', subtitle: 'Atom-Resolved Characterization and Materials Imaging Center', purpose: 'Electron microscopy, atom-probe techniques, ultrafast characterization, spectroscopy, nanoscale tomography, and in-situ materials observation', form: 'atomic-cartography', footprintMetres: [172, 126], heightMetres: 27, radialT: 0.16, angularT: 0.92, placementZone: 'Inner Precision Arc vibration-isolated eastern end', exteriorMotif: 'low pale instrument-like volume floating above a black isolation base and moat, five independent polished pods, aligned bridge entry, metrology mast, and atomic light grid' },
] as const;

const DISTRICT_ID = 'materials-science-lab';
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
  const value = new THREE.MeshStandardMaterial({ color, roughness: 0.56, metalness: 0.2, ...options });
  value.name = name;
  return value;
}

function createMaterials() {
  const frame = material('Matter Crescent dark structural frame', '#12191d', { roughness: 0.68, metalness: 0.66 });
  const graphite = material('Graphite technical ceramic', '#242a2d', { roughness: 0.76, metalness: 0.18 });
  const black = material('Light-absorbing black mineral composite', '#090d0e', { roughness: 0.86, metalness: 0.12 });
  const pale = material('Pale mineral ceramic', '#d5d3c9', { roughness: 0.62, metalness: 0.05 });
  const ivory = material('Ivory ion-conducting ceramic', '#e5dfcf', { roughness: 0.5, metalness: 0.04 });
  const silver = material('Brushed satin alloy', '#aeb7b7', { roughness: 0.28, metalness: 0.94 });
  const chromium = material('Dark chromium alloy plate', '#394148', { roughness: 0.25, metalness: 0.92 });
  const oxidized = material('Blue-black oxidized metal', '#233748', { roughness: 0.48, metalness: 0.78 });
  const copper = material('Stable copper-brown alloy', '#765042', { roughness: 0.45, metalness: 0.76 });
  const ceramic = material('Ultrahigh-temperature ceramic', '#b8afa0', { roughness: 0.82, metalness: 0.08 });
  const scorched = material('Scorched refractory tile', '#3b302b', { roughness: 0.9, metalness: 0.14 });
  const glass = material('Interference-coated research glass', '#506776', { roughness: 0.14, metalness: 0.46, transparent: true, opacity: 0.72 });
  const violetGlass = material('Localized violet interference glass', '#695f7d', { roughness: 0.13, metalness: 0.5, transparent: true, opacity: 0.68 });
  const membrane = material('Responsive translucent polymer membrane', '#829a9b', { roughness: 0.28, metalness: 0.05, transparent: true, opacity: 0.54 });
  const bioComposite = material('Pale biofabricated composite', '#9d9b78', { roughness: 0.9, metalness: 0.01 });
  const mycelium = material('Fibrous mycelium block', '#c4b99b', { roughness: 1, metalness: 0 });
  const living = material('Contained living-material panel', '#506f55', { roughness: 0.96, metalness: 0 });
  const reusedBrick = material('Recovered masonry cassette', '#775b50', { roughness: 0.92, metalness: 0.03 });
  const structuralColour = material('Structural-colour optical surface', '#6686a0', { roughness: 0.2, metalness: 0.64, emissive: '#182c3e', emissiveIntensity: 0.18 });
  const water = material('Still black process water', '#081b20', { roughness: 0.08, metalness: 0.38, transparent: true, opacity: 0.84 });
  const paving = material('Matter Crescent pale mineral paving', '#bdb9ad', { roughness: 0.94, metalness: 0.02 });
  const gravel = material('Dark graded technical gravel', '#242626', { roughness: 1, metalness: 0 });
  const grass = material('Silver technical grass', '#87928c', { roughness: 0.98, metalness: 0.02 });
  const whiteLight = material('Material passport white light', '#ffffff', { emissive: '#ffffff', emissiveIntensity: 2.8, roughness: 0.12, metalness: 0.02 });
  const amber = material('Extreme-material amber warning line', '#ffd4a0', { emissive: '#ff841f', emissiveIntensity: 2.7, roughness: 0.14, metalness: 0.06 });
  const cyan = material('Ionic and photonic cyan interface light', '#d8fbff', { emissive: '#33d7ef', emissiveIntensity: 2.8, roughness: 0.12, metalness: 0.05 });
  const violet = material('Moiré violet edge light', '#e5d6ff', { emissive: '#7b54e8', emissiveIntensity: 2.5, roughness: 0.14, metalness: 0.05 });
  const greenLight = material('Living-material warm green signal', '#dbf3cb', { emissive: '#62b65a', emissiveIntensity: 2.1, roughness: 0.18, metalness: 0.02 });
  [whiteLight, amber, cyan, violet, greenLight].forEach((value) => { value.userData.isDistrictAccent = true; });
  return { frame, graphite, black, pale, ivory, silver, chromium, oxidized, copper, ceramic, scorched, glass, violetGlass, membrane, bioComposite, mycelium, living, reusedBrick, structuralColour, water, paving, gravel, grass, whiteLight, amber, cyan, violet, greenLight };
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

function pulse<T extends THREE.Object3D>(object: T, speed: number, phase = 0, minIntensity = 0.12, maxIntensity = 3.2) {
  object.userData.animate = 'materials-science-emissive-pulse'; object.userData.speed = speed; object.userData.phase = phase; object.userData.minIntensity = minIntensity; object.userData.maxIntensity = maxIntensity; return object;
}

function rotate<T extends THREE.Object3D>(object: T, speed: number, axis: 'x' | 'y' | 'z' = 'y') {
  object.userData.animate = 'materials-science-rotation'; object.userData.speed = speed; object.userData.axis = axis; return object;
}

function createMatterCompiler(m: Materials) {
  const root = new THREE.Group(); root.name = 'MATTER__M1__MATTER_COMPILER';
  cylinder(root, 'MATTER__M1__PHASE_DIAGRAM_HEXAGONAL_PLINTH', 17.2, 0.28, m.paving, [0, 0.14, 0], false, 6);
  const heights = [4.1, 5.5, 7.8, 6.6, 4.8, 7.1];
  const cassetteMaterials = [m.silver, m.ceramic, m.structuralColour, m.glass, m.copper, m.oxidized];
  for (let block = 0; block < 6; block += 1) {
    const angle = block / 6 * Math.PI * 2 + Math.PI / 6; const x = Math.sin(angle) * 4.8; const z = Math.cos(angle) * 4.8; const height = heights[block];
    cylinder(root, `MATTER__M1__INTERLOCKING_HEXAGONAL_BLOCK_${block + 1}`, 6.2, height, block % 2 ? m.graphite : m.frame, [x, 0.28 + height * 0.5, z], true, 6, [0, angle, 0]);
    for (let face = 0; face < 6; face += 1) {
      const faceAngle = face / 6 * Math.PI * 2 + angle; const faceX = x + Math.sin(faceAngle) * 3.15; const faceZ = z + Math.cos(faceAngle) * 3.15;
      for (let row = 0; row < Math.max(3, Math.floor(height / 0.72)); row += 1) {
        const panel = box(root, `MATTER__M1__REPLACEABLE_MATERIAL_CASSETTE_${block + 1}_${face + 1}_${row + 1}`, [1.7, 0.52, 0.1], cassetteMaterials[(block + face + row) % cassetteMaterials.length], [faceX, 0.72 + row * 0.68, faceZ], false, [0, -faceAngle, 0]);
        panel.userData.materialPassport = true;
        pulse(box(root, `MATTER__M1__MATERIAL_PASSPORT_LINE_${block + 1}_${face + 1}_${row + 1}`, [1.42, 0.025, 0.025], m.whiteLight.clone(), [faceX + Math.cos(faceAngle) * 0.02, 0.49 + row * 0.68, faceZ - Math.sin(faceAngle) * 0.02], false, [0, -faceAngle, 0]), 0.0042, (block * 6 + face + row) * 0.12, 0.02, 1.4);
      }
    }
    if (block % 2 === 0) {
      box(root, `MATTER__M1__ROBOTIC_TRANSFER_APERTURE_${block + 1}`, [1.05, Math.min(height - 0.8, 4.8), 0.18], m.black, [x + Math.sin(angle) * 3.22, 0.45 + Math.min(height - 0.8, 4.8) * 0.5, z + Math.cos(angle) * 3.22], false, [0, -angle, 0]);
      slabBetween(root, `MATTER__M1__ARTICULATED_LOADING_BRIDGE_${block + 1}`, new THREE.Vector3(x + Math.sin(angle) * 3.3, 1.1, z + Math.cos(angle) * 3.3), new THREE.Vector3(x + Math.sin(angle) * 5.2, 0.55, z + Math.cos(angle) * 5.2), 0.7, 0.12, m.silver);
    }
  }
  box(root, 'MATTER__M1__DARK_METAL_CANTILEVERED_ENTRANCE_SLAB', [9.8, 0.42, 4.2], m.chromium, [0, 3.45, 8.0], false, [0, 0, -0.035]);
  for (const x of [-3.2, 3.2]) {
    pipe(root, `MATTER__M1__BRANCHING_LATTICE_COLUMN_${x < 0 ? 'WEST' : 'EAST'}_A`, new THREE.Vector3(x, 0.2, 8.6), new THREE.Vector3(x * 0.72, 3.25, 7.15), 0.14, m.frame, true);
    pipe(root, `MATTER__M1__BRANCHING_LATTICE_COLUMN_${x < 0 ? 'WEST' : 'EAST'}_B`, new THREE.Vector3(x, 0.2, 8.6), new THREE.Vector3(x * 1.18, 3.25, 8.65), 0.14, m.frame, true);
  }
  pulse(box(root, 'MATTER__M1__CANTILEVER_UNDERSIDE_LIGHT', [8.8, 0.06, 0.06], m.whiteLight.clone(), [0, 3.19, 9.92]), 0.0038, 0.3, 0.08, 2.4);
  box(root, 'MATTER__M1__RECESSED_MAIN_ENTRANCE', [3.4, 2.6, 0.22], m.glass, [0, 1.58, 7.0]);
  torus(root, 'MATTER__M1__ROOF_GANTRY_CRANE_RING', 3.25, 0.22, m.silver, [0, 8.36, 0]);
  const gantry = rotate(new THREE.Group(), 0.035); gantry.name = 'MATTER__M1__ROBOTIC_MAINTENANCE_GANTRY'; root.add(gantry);
  for (let unit = 0; unit < 4; unit += 1) { const angle = unit / 4 * Math.PI * 2; box(gantry, `MATTER__M1__MAINTENANCE_UNIT_${unit + 1}`, [0.75, 0.42, 0.48], m.frame, [Math.sin(angle) * 3.25, 8.52, Math.cos(angle) * 3.25], false, [0, angle, 0]); }
  return root;
}

function createLaminaris(m: Materials) {
  const root = new THREE.Group(); root.name = 'MATTER__M2__LAMINARIS_INSTITUTE';
  box(root, 'MATTER__M2__DARK_RECESSED_STRUCTURAL_CORE', [5.2, 4.8, 5.0], m.frame, [0, 2.42, -0.3], true);
  const plateMaterials = [m.black, m.graphite, m.chromium, m.black, m.oxidized, m.graphite, m.black];
  for (let layer = 0; layer < 7; layer += 1) {
    const width = 16.2 - layer * 1.15; const depth = 11.5 - layer * 0.58; const angle = (layer - 3) * 0.045; const y = 0.48 + layer * 0.79;
    box(root, `MATTER__M2__FLOATING_ATOMIC_PLATE_${layer + 1}`, [width, 0.17, depth], plateMaterials[layer], [(layer % 2 ? 1 : -1) * layer * 0.18, y, -layer * 0.12], false, [0, angle, (layer % 2 ? 1 : -1) * 0.012]);
    pulse(box(root, `MATTER__M2__LUMINOUS_LAYER_EDGE_${layer + 1}`, [width * 0.92, 0.035, 0.05], (layer % 3 === 0 ? m.violet : m.cyan).clone(), [(layer % 2 ? 1 : -1) * layer * 0.18, y, depth * 0.5 - layer * 0.12], false, [0, angle, 0]), 0.0046, layer * 0.63, 0.02, 2.1);
    if (layer < 6) box(root, `MATTER__M2__INTERFERENCE_GLASS_LAYER_${layer + 1}`, [7.2 - layer * 0.45, 0.52, 4.7 - layer * 0.25], layer % 2 ? m.violetGlass : m.glass, [0, y + 0.39, -0.28], false, [0, angle * 0.5, 0]);
  }
  for (let ribbon = 0; ribbon < 12; ribbon += 1) box(root, `MATTER__M2__FLEXIBLE_WIND_CONTROL_RIBBON_${ribbon + 1}`, [0.055, 4.4, 0.22], ribbon % 4 === 0 ? m.silver : m.frame, [-6.5 + ribbon * 1.18, 2.8, -2.4 + (ribbon % 3) * 2.1], false, [0, (ribbon % 3 - 1) * 0.05, (ribbon % 2 ? 1 : -1) * 0.025]);
  box(root, 'MATTER__M2__HORIZONTAL_INCISED_ENTRANCE', [6.8, 0.95, 0.22], m.black, [0, 0.85, 5.78]);
  box(root, 'MATTER__M2__NARROW_ENTRANCE_BRIDGE', [2.0, 0.14, 4.6], m.paving, [0, 0.2, 7.2]);
  for (let membrane = 0; membrane < 18; membrane += 1) slabBetween(root, `MATTER__M2__OVERLAPPING_METALLIC_MEMBRANE_${membrane + 1}`, new THREE.Vector3(-3.8 + membrane * 0.44, 1.95 + Math.sin(membrane * 0.7) * 0.12, 4.55), new THREE.Vector3(-3.2 + membrane * 0.35, 2.35 + Math.cos(membrane * 0.5) * 0.12, 7.1), 0.14, 0.035, membrane % 3 ? m.silver : m.violetGlass);
  return root;
}

function createTopologica(m: Materials) {
  const root = new THREE.Group(); root.name = 'MATTER__M3__TOPOLOGICA_HALL';
  box(root, 'MATTER__M3__BLACK_REFLECTING_BASIN', [8.2, 0.08, 12.8], m.water, [0, 0.08, 0]);
  for (const side of [-1, 1]) {
    for (let segment = 0; segment < 11; segment += 1) {
      const t = segment / 10; const angle = -1.16 + t * 2.32; const x = side * (4.0 + Math.cos(angle) * 2.2); const z = Math.sin(angle) * 5.1; const h = 2.5 + Math.sin(t * Math.PI) * 0.9;
      box(root, `MATTER__M3__GRAPHITE_CRESCENT_${side < 0 ? 'WEST' : 'EAST'}_${segment + 1}`, [2.25, h, 2.15], m.graphite, [x, 0.18 + h * 0.5, z], true, [0, -side * angle * 0.72, 0]);
      for (let fin = 0; fin < 3; fin += 1) box(root, `MATTER__M3__MAGNETIC_CONTROL_FIN_${side < 0 ? 'WEST' : 'EAST'}_${segment + 1}_${fin + 1}`, [0.12, h * 0.82, 0.52 + fin * 0.18], m.frame, [x + side * 1.18, 0.34 + h * 0.46, z + (fin - 1) * 0.62], false, [0, -side * angle * 0.72, 0]);
    }
  }
  const ribbonPoints = Array.from({ length: 29 }, (_, index) => { const t = index / 28; const angle = t * Math.PI * 2; return new THREE.Vector3(Math.sin(angle) * 7.0, 3.4 + Math.sin(angle * 0.5) * 1.0, Math.cos(angle) * 5.8); });
  ribbonPoints.slice(1).forEach((point, index) => {
    slabBetween(root, `MATTER__M3__CONTINUOUS_MOBIUS_METAL_RIBBON_${index + 1}`, ribbonPoints[index], point, 0.72, 0.16, m.silver);
    pulse(pipe(root, `MATTER__M3__MOBIUS_EDGE_LIGHT_${index + 1}`, ribbonPoints[index].clone().add(new THREE.Vector3(0, 0.12, 0)), point.clone().add(new THREE.Vector3(0, 0.12, 0)), 0.028, m.violet.clone()), 0.0035, index * 0.19, 0.02, 1.7);
  });
  box(root, 'MATTER__M3__STILL_BASIN_ENTRANCE_BRIDGE', [1.5, 0.16, 7.0], m.paving, [0, 0.22, 5.0]);
  box(root, 'MATTER__M3__BRIGHT_GAP_DOORWAY', [2.0, 2.4, 0.18], m.whiteLight, [0, 1.35, 6.15]);
  for (let tower = 0; tower < 3; tower += 1) {
    const x = -2.4 + tower * 2.4; cylinder(root, `MATTER__M3__RIBBED_CRYOGENIC_SERVICE_TOWER_${tower + 1}`, 1.25, 5.0 + tower * 0.62, m.silver, [x, 2.5 + tower * 0.31, -6.3], true, 12);
    for (let rib = 0; rib < 8; rib += 1) torus(root, `MATTER__M3__CRYOGENIC_INSULATION_RIB_${tower + 1}_${rib + 1}`, 0.68, 0.055, m.frame, [x, 0.6 + rib * 0.57, -6.3]);
    pipe(root, `MATTER__M3__CRYOGENIC_PIPE_BRIDGE_${tower + 1}`, new THREE.Vector3(x, 3.3, -5.7), new THREE.Vector3(x * 0.55, 2.8, -3.7), 0.11, m.silver);
  }
  return root;
}

function createMorphostructure(m: Materials) {
  const root = new THREE.Group(); root.name = 'MATTER__M4__MORPHOSTRUCTURE_PAVILION';
  const shell = cylinder(root, 'MATTER__M4__FIVE_STOREY_OVAL_STRUCTURAL_SHELL', 11.8, 4.4, m.graphite, [0, 2.28, 0], true, 24); shell.scale.x = 1.42;
  const levels = [0.65, 1.48, 2.31, 3.14, 3.97];
  levels.forEach((y, level) => {
    const ring = torus(root, `MATTER__M4__CELLULAR_EXOSKELETON_RING_${level + 1}`, 6.42 - level * 0.08, 0.1, level % 2 ? m.silver : m.frame, [0, y, 0]); ring.scale.x = 1.42;
  });
  for (let cell = 0; cell < 72; cell += 1) {
    const segment = cell % 18; const level = Math.floor(cell / 18); const angle = segment / 18 * Math.PI * 2; const nextAngle = (segment + (level % 2 ? 1 : -1)) / 18 * Math.PI * 2; const radius = 6.42;
    const start = new THREE.Vector3(Math.sin(angle) * radius * 1.42, levels[level], Math.cos(angle) * radius);
    const end = new THREE.Vector3(Math.sin(nextAngle) * radius * 1.42, levels[level + 1], Math.cos(nextAngle) * radius);
    pipe(root, `MATTER__M4__RECONFIGURABLE_CELL_MEMBER_${cell + 1}`, start, end, cell % 9 === 0 ? 0.12 : 0.075, cell % 7 === 0 ? m.structuralColour : m.silver);
  }
  for (let fin = 0; fin < 24; fin += 1) {
    const angle = fin / 24 * Math.PI * 2; const x = Math.sin(angle) * 8.8; const z = Math.cos(angle) * 6.3;
    const scale = box(root, `MATTER__M4__ARTICULATED_ROOF_SCALE_${fin + 1}`, [1.3, 0.16, 2.2], fin % 5 === 0 ? m.structuralColour : m.chromium, [x, 5.0 + (fin % 3) * 0.08, z], false, [0, angle, (fin % 2 ? 1 : -1) * 0.18]);
    if (fin === 0) rotate(scale, 0.004, 'z');
  }
  for (let member = 0; member < 16; member += 1) { const x = -4.8 + member * 0.64; pipe(root, `MATTER__M4__AUXETIC_ENTRANCE_CANOPY_MEMBER_${member + 1}`, new THREE.Vector3(x, 2.25 + Math.abs(x) * 0.06, 5.0), new THREE.Vector3(x * 1.18, 2.55, 8.1), 0.075, member % 4 ? m.silver : m.cyan); }
  box(root, 'MATTER__M4__RECESSED_DYNAMIC_ENTRANCE', [3.2, 2.35, 0.2], m.glass, [0, 1.35, 5.95]);
  for (let column = 0; column < 7; column += 1) { const x = -5.1 + column * 1.7; const value = taper(root, `MATTER__M4__METAMATERIAL_TEST_COLUMN_${column + 1}`, 0.75, column % 2 ? 0.36 : 0.94, 2.1 + column % 3 * 0.24, column % 3 === 0 ? m.structuralColour : m.silver, [x, 1.05, 9.0], false, 6, [0, column * 0.28, 0]); value.userData.programmableGeometry = true; }
  return root;
}

function createPolyphase(m: Materials) {
  const root = new THREE.Group(); root.name = 'MATTER__M5__POLYPHASE_FORGE';
  const metals = [m.silver, m.chromium, m.oxidized, m.copper, m.graphite, m.silver, m.scorched, m.chromium];
  for (let ingot = 0; ingot < 8; ingot += 1) {
    const col = ingot % 4; const row = Math.floor(ingot / 4); const x = -6.0 + col * 4.0; const z = -2.4 + row * 4.5; const height = 3.7 + (ingot % 4) * 0.65;
    taper(root, `MATTER__M5__INTERLOCKED_METALLURGICAL_PHASE_${ingot + 1}`, 5.0, 4.1, height, metals[ingot], [x, 0.18 + height * 0.5, z], true, 4, [0, ingot * 0.11 + Math.PI / 4, (ingot % 2 ? 1 : -1) * 0.025]);
    pulse(box(root, `MATTER__M5__GLOWING_PHASE_SEAM_${ingot + 1}`, [0.065, height * 0.86, 3.6], (ingot % 3 ? m.amber : m.violet).clone(), [x + 2.15, 0.45 + height * 0.43, z], false, [0, ingot * 0.11, 0]), 0.0032, ingot * 0.46, 0.02, 1.7);
    for (let strip = 0; strip < 4; strip += 1) box(root, `MATTER__M5__WEATHERING_EXPOSURE_STRIP_${ingot + 1}_${strip + 1}`, [0.24, height * 0.62, 0.08], [m.copper, m.oxidized, m.silver, m.scorched][strip], [x - 1.55 + strip * 0.92, 0.55 + height * 0.31, z + 2.08], false, [0, 0, 0]);
  }
  box(root, 'MATTER__M5__WEST_SLOPING_ENTRANCE_MASS', [4.3, 5.1, 2.4], m.chromium, [-2.6, 2.55, 7.0], true, [0, 0.1, -0.26]);
  box(root, 'MATTER__M5__EAST_SLOPING_ENTRANCE_MASS', [4.3, 5.1, 2.4], m.oxidized, [2.6, 2.55, 7.0], true, [0, -0.1, 0.26]);
  box(root, 'MATTER__M5__TALL_TRIANGULAR_ENTRY_VOID', [1.6, 4.2, 0.28], m.black, [0, 2.18, 8.22]);
  for (let channel = 0; channel < 7; channel += 1) box(root, `MATTER__M5__EXTERIOR_COOLING_CASCADE_${channel + 1}`, [0.34, 0.06, 5.4 - channel * 0.55], channel % 2 ? m.water : m.silver, [5.3, 0.12 + channel * 0.055, 7.2 + channel * 0.28]);
  for (let tower = 0; tower < 3; tower += 1) {
    const x = -4.2 + tower * 4.2; cylinder(root, `MATTER__M5__QUENCH_TOWER_${tower + 1}`, 2.0, 6.8 + tower * 0.75, m.chromium, [x, 3.4 + tower * 0.375, -6.3], true, 12);
    for (let shield = 0; shield < 6; shield += 1) box(root, `MATTER__M5__QUENCH_SHIELD_FIN_${tower + 1}_${shield + 1}`, [0.15, 4.8, 0.75], shield % 2 ? m.silver : m.oxidized, [x + Math.sin(shield / 6 * Math.PI * 2) * 1.08, 3.4, -6.3 + Math.cos(shield / 6 * Math.PI * 2) * 1.08], false, [0, shield / 6 * Math.PI * 2, 0]);
  }
  for (let coupon = 0; coupon < 9; coupon += 1) box(root, `MATTER__M5__OVERSIZED_ALLOY_COUPON_${coupon + 1}`, [0.5 + coupon % 3 * 0.25, 1.3 + coupon % 4 * 0.42, 0.18], metals[coupon % metals.length], [-7.0 + coupon * 1.75, 0.65 + coupon % 4 * 0.21, 11.0], false, [0, (coupon % 3 - 1) * 0.18, 0]);
  return root;
}

function createAegisBastion(m: Materials) {
  const root = new THREE.Group(); root.name = 'MATTER__M6__AEGIS_BASTION';
  taper(root, 'MATTER__M6__INNERMOST_SHIELDED_MASS', 11.2, 9.8, 4.6, m.black, [0, 2.45, -0.5], true, 4, [0, Math.PI / 4, 0]);
  taper(root, 'MATTER__M6__RIBBED_SECONDARY_SHELL', 14.8, 12.4, 4.0, m.frame, [0, 2.15, -0.5], true, 4, [0, Math.PI / 4, 0]);
  for (let wall = 0; wall < 4; wall += 1) {
    const angle = wall / 4 * Math.PI * 2 + Math.PI / 4; const x = Math.sin(angle) * 6.8; const z = Math.cos(angle) * 6.8;
    box(root, `MATTER__M6__SLOPING_OUTER_ARMOUR_FIELD_${wall + 1}`, [9.2, 4.5, 0.46], m.ceramic, [x, 2.42, z], true, [0, -angle, wall % 2 ? 0.18 : -0.18]);
    for (let tile = 0; tile < 18; tile += 1) {
      const col = tile % 6; const row = Math.floor(tile / 6); box(root, `MATTER__M6__NUMBERED_EXPOSURE_TILE_${wall + 1}_${tile + 1}`, [1.12, 0.88, 0.12], tile % 7 === 0 ? m.scorched : tile % 5 === 0 ? m.oxidized : m.pale, [x + Math.cos(angle) * (-3.4 + col * 1.36), 1.1 + row * 1.02, z - Math.sin(angle) * (-3.4 + col * 1.36)], false, [0, -angle, wall % 2 ? 0.18 : -0.18]);
    }
  }
  const zigzag = [new THREE.Vector3(-5.8, 0.5, 11.2), new THREE.Vector3(3.8, 0.5, 9.5), new THREE.Vector3(-3.2, 0.5, 7.7), new THREE.Vector3(0, 0.5, 6.0)];
  zigzag.slice(1).forEach((point, index) => slabBetween(root, `MATTER__M6__ANGLED_BLAST_WALL_${index + 1}`, zigzag[index], point, 0.55, 2.2, index % 2 ? m.graphite : m.ceramic, true));
  box(root, 'MATTER__M6__ZIGZAG_ENTRANCE_PATH', [1.25, 0.12, 8.0], m.paving, [0, 0.18, 8.6]);
  torus(root, 'MATTER__M6__DEEPLY_RECESSED_CIRCULAR_DOOR', 1.3, 0.32, m.scorched, [0, 1.75, 6.38], [0, 0, 0]);
  box(root, 'MATTER__M6__PORTAL_DARK_CORE', [1.95, 2.25, 0.22], m.black, [0, 1.5, 6.4]);
  for (let gantry = 0; gantry < 4; gantry += 1) {
    const x = -6.6 + gantry * 4.4; box(root, `MATTER__M6__SHIELDED_TEST_GANTRY_BEAM_${gantry + 1}`, [2.8, 0.28, 0.3], m.chromium, [x, 3.2, -9.0]);
    for (const side of [-1, 1]) box(root, `MATTER__M6__TEST_GANTRY_LEG_${gantry + 1}_${side < 0 ? 'W' : 'E'}`, [0.26, 3.2, 0.3], m.frame, [x + side * 1.2, 1.6, -9.0], true);
    pulse(cylinder(root, `MATTER__M6__HEAT_FLUX_EMITTER_${gantry + 1}`, 0.72, 1.4, m.amber.clone(), [x, 2.15, -8.7], false, 12, [Math.PI / 2, 0, 0]), 0.0028, gantry * 0.8, 0.02, 1.8);
  }
  box(root, 'MATTER__M6__TILTING_ROOF_EXPOSURE_PLATFORM', [9.4, 0.32, 2.1], m.silver, [0, 5.2, -0.4], false, [0.08, 0, 0.04]);
  for (let line = 0; line < 12; line += 1) pulse(box(root, `MATTER__M6__AMBER_SAFETY_BOUNDARY_${line + 1}`, [0.05, 0.04, 1.25], m.amber.clone(), [-7.8 + line * 1.42, 0.1, 12.2]), 0.0025, line * 0.21, 0.02, 0.9);
  return root;
}

function createCeramatrix(m: Materials) {
  const root = new THREE.Group(); root.name = 'MATTER__M7__CERAMATRIX_WORKS';
  box(root, 'MATTER__M7__DARK_KILN_HALL', [16.4, 4.3, 10.8], m.frame, [0, 2.3, -0.4], true);
  for (let arch = 0; arch < 7; arch += 1) {
    const x = -7.2 + arch * 2.4; const lean = (arch - 3) * 0.035;
    const archRing = torus(root, `MATTER__M7__INTERLOCKING_CERAMIC_SHELL_ARCH_${arch + 1}`, 5.4, 0.58, arch < 3 ? m.ceramic : m.pale, [x, 0.3, -0.4], [0, Math.PI / 2 + lean, 0], Math.PI, true, 8, 28); archRing.scale.y = 0.94;
    box(root, `MATTER__M7__ARCH_BUTTRESS_WEST_${arch + 1}`, [0.9, 3.1, 0.9], arch < 3 ? m.ceramic : m.pale, [x, 1.55, -5.75], true, [0, 0, lean]);
    box(root, `MATTER__M7__ARCH_BUTTRESS_EAST_${arch + 1}`, [0.9, 3.1, 0.9], arch < 3 ? m.ceramic : m.pale, [x, 1.55, 4.95], true, [0, 0, -lean]);
  }
  for (let weave = 0; weave < 30; weave += 1) {
    const x = -7.4 + weave % 15 * 1.06; const y = 0.8 + Math.floor(weave / 15) * 1.65;
    pipe(root, `MATTER__M7__WOVEN_CERAMIC_FACADE_RIB_${weave + 1}`, new THREE.Vector3(x, y, 5.05), new THREE.Vector3(x + (weave % 2 ? 1.1 : -1.1), y + 1.45, 5.25), 0.12, weave % 5 === 0 ? m.scorched : m.pale);
  }
  for (let prism = 0; prism < 10; prism += 1) box(root, `MATTER__M7__THERMAL_TILE_SAWTOOTH_PRISM_${prism + 1}`, [1.25, 1.35, 7.4], prism % 3 === 0 ? m.scorched : m.ceramic, [-6.8 + prism * 1.5, 5.2 + (prism % 2) * 0.12, -0.6], false, [0, 0, prism % 2 ? -0.35 : 0.35]);
  box(root, 'MATTER__M7__TWENTY_METRE_CERAMIC_ENTRANCE_BLADE', [10.2, 0.55, 3.2], m.pale, [0, 4.2, 7.2], false, [0, 0, -0.04]);
  box(root, 'MATTER__M7__POLISHED_BLADE_UNDERSIDE', [9.5, 0.08, 2.8], m.black, [0, 3.88, 7.2]);
  for (let door = 0; door < 7; door += 1) box(root, `MATTER__M7__NARROW_COMPONENT_DOOR_${door + 1}`, [1.05, 2.8, 0.18], door % 2 ? m.glass : m.black, [-3.6 + door * 1.2, 1.55, 5.45]);
  for (let panel = 0; panel < 8; panel += 1) {
    box(root, `MATTER__M7__FRACTURE_COURT_FRAME_${panel + 1}`, [1.65, 2.25, 0.16], m.frame, [-6.3 + panel * 1.8, 1.18, 9.8]);
    box(root, `MATTER__M7__RETAINED_TESTED_CERAMIC_PANEL_${panel + 1}`, [1.28, 1.82, 0.12], panel % 3 === 0 ? m.scorched : m.ceramic, [-6.3 + panel * 1.8, 1.18, 9.92], false, [0, 0, (panel % 3 - 1) * 0.08]);
  }
  for (let tower = 0; tower < 4; tower += 1) cylinder(root, `MATTER__M7__SLENDER_VAPOUR_EXHAUST_${tower + 1}`, 0.6, 3.6 + tower * 0.45, m.silver, [-5.4 + tower * 3.6, 6.5 + tower * 0.22, -2.0], false, 12);
  return root;
}

function createIonVault(m: Materials) {
  const root = new THREE.Group(); root.name = 'MATTER__M8__ION_VAULT';
  const offsets = [-1.2, 0.9, -0.4, 1.2, -0.8];
  for (let cell = 0; cell < 5; cell += 1) {
    const width = 15.8 - cell * 0.52; const y = 0.55 + cell * 1.08;
    box(root, `MATTER__M8__SOLID_STATE_CELL_VOLUME_${cell + 1}`, [width, 0.82, 8.0], cell % 2 ? m.pale : m.ivory, [offsets[cell], y, -0.4 + (cell % 2 ? 0.18 : -0.18)], true);
    pulse(box(root, `MATTER__M8__IONIC_INTERFACE_SEAM_${cell + 1}`, [width * 0.94, 0.045, 0.08], m.cyan.clone(), [offsets[cell], y + 0.47, 3.63 + (cell % 2 ? 0.18 : -0.18)]), 0.0045, cell * 1.2, 0.02, 2.4);
    box(root, `MATTER__M8__ELECTROCHROMIC_STRIP_${cell + 1}`, [width * 0.62, 0.18, 0.09], cell % 2 ? m.glass : m.black, [offsets[cell], y + 0.14, 3.69 + (cell % 2 ? 0.18 : -0.18)]);
  }
  for (let frame = 0; frame < 6; frame += 1) box(root, `MATTER__M8__DARK_COMPRESSION_FRAME_${frame + 1}`, [0.48, 6.0, 9.1], m.frame, [-7.7 + frame * 3.05, 3.0, -0.4], true, [0, 0, (frame % 2 ? 1 : -1) * 0.035]);
  box(root, 'MATTER__M8__TRANSPARENT_BRIDGE_ENTRANCE', [3.0, 1.35, 5.2], m.glass, [0, 1.0, 5.1]);
  box(root, 'MATTER__M8__BRIDGE_WALKWAY', [2.4, 0.16, 5.7], m.paving, [0, 0.24, 5.35]);
  for (const side of [-1, 1]) box(root, `MATTER__M8__HEAT_MANAGEMENT_WATER_CHANNEL_${side < 0 ? 'WEST' : 'EAST'}`, [1.05, 0.08, 6.8], m.water, [side * 2.15, 0.1, 5.3]);
  for (let wall = 0; wall < 4; wall += 1) box(root, `MATTER__M8__ISOLATED_LOADING_COURT_WALL_${wall + 1}`, [0.42, 2.7, 3.8], m.graphite, [-6.4 + wall * 4.25, 1.35, -6.1], true);
  for (let vent = 0; vent < 4; vent += 1) cylinder(root, `MATTER__M8__EMERGENCY_EXHAUST_TOWER_${vent + 1}`, 1.0, 3.1 + vent % 2 * 0.65, vent % 2 ? m.silver : m.ceramic, [-6.4 + vent * 4.25, 6.6 + vent % 2 * 0.32, -4.0], false, 12);
  for (let plane = 0; plane < 5; plane += 1) box(root, `MATTER__M8__DETACHED_SOLAR_CONTROL_PLANE_${plane + 1}`, [3.0, 0.18, 5.6], plane % 2 ? m.silver : m.graphite, [-6.0 + plane * 3.0, 6.5 + plane % 2 * 0.12, -0.4], false, [0.08, 0, plane % 2 ? 0.12 : -0.12]);
  return root;
}

function createPhotonWeave(m: Materials) {
  const root = new THREE.Group(); root.name = 'MATTER__M9__PHOTON_WEAVE_INSTITUTE';
  taper(root, 'MATTER__M9__EIGHT_STOREY_PRISMATIC_CORE', 10.8, 9.4, 7.4, m.black, [0, 3.82, -0.3], true, 6, [0, Math.PI / 6, 0]);
  const opticalMaterials = [m.silver, m.structuralColour, m.violetGlass, m.glass];
  for (let fin = 0; fin < 96; fin += 1) {
    const side = Math.floor(fin / 24); const along = fin % 24; const t = along / 23; let x = 0; let z = 0; let angle = 0;
    if (side === 0) { x = -5.1 + t * 10.2; z = 4.75; angle = Math.sin(t * Math.PI * 2) * 0.16; }
    else if (side === 1) { x = 5.1; z = 4.75 - t * 10.1; angle = Math.PI / 2 + Math.sin(t * Math.PI * 2) * 0.16; }
    else if (side === 2) { x = 5.1 - t * 10.2; z = -5.35; angle = Math.PI + Math.sin(t * Math.PI * 2) * 0.16; }
    else { x = -5.1; z = -5.35 + t * 10.1; angle = -Math.PI / 2 + Math.sin(t * Math.PI * 2) * 0.16; }
    box(root, `MATTER__M9__MICROTEXTURED_OPTICAL_FIN_${fin + 1}`, [0.09, 6.8 + (fin % 5) * 0.1, 0.68], opticalMaterials[fin % opticalMaterials.length], [x, 3.65, z], false, [0, angle, (fin % 3 - 1) * 0.018]);
    if (fin % 8 === 0) pulse(box(root, `MATTER__M9__TRAVELLING_PHOTON_LINE_${fin / 8 + 1}`, [0.035, 5.8, 0.04], (fin % 16 ? m.cyan : m.violet).clone(), [x, 3.65, z + 0.4], false, [0, angle, 0]), 0.006, fin * 0.08, 0.01, 2.4);
  }
  for (let corner = 0; corner < 4; corner += 1) {
    const sx = corner < 2 ? -1 : 1; const sz = corner % 2 ? -1 : 1; const cornerRoot = new THREE.Group(); cornerRoot.name = `MATTER__M9__TRIANGULAR_CORNER_VOID_${corner + 1}`; cornerRoot.position.set(sx * 5.15, 0, sz * 5.05 - 0.3); root.add(cornerRoot);
    for (let thread = 0; thread < 10; thread += 1) pipe(cornerRoot, `MATTER__M9__REFLECTIVE_THREAD_${corner + 1}_${thread + 1}`, new THREE.Vector3(0, 0.45 + thread * 0.65, -0.65), new THREE.Vector3(-sx * (0.75 + thread % 3 * 0.2), 1.0 + thread * 0.54, 0.65), 0.022, thread % 4 === 0 ? m.structuralColour : m.silver);
  }
  taper(root, 'MATTER__M9__DEEP_INVERTED_ENTRY_PRISM', 5.2, 1.2, 2.6, m.frame, [0, 1.7, 5.9], false, 3, [Math.PI, 0, 0]);
  pulse(box(root, 'MATTER__M9__INVERTED_PRISM_LUMINOUS_EDGE', [4.7, 0.06, 0.08], m.cyan.clone(), [0, 3.05, 6.0]), 0.004, 0.4, 0.04, 2.2);
  box(root, 'MATTER__M9__MATTE_BLACK_MINERAL_FORECOURT', [8.0, 0.1, 4.5], m.black, [0, 0.1, 7.7]);
  for (let channel = 0; channel < 5; channel += 1) box(root, `MATTER__M9__MIRRORED_FORECOURT_CHANNEL_${channel + 1}`, [0.065, 0.03, 4.0], m.silver, [-2.8 + channel * 1.4, 0.17, 7.7]);
  cylinder(root, 'MATTER__M9__OPTICAL_SENSOR_MAST', 0.28, 4.6, m.silver, [0, 10.0, -0.3], false, 12);
  const petals = rotate(new THREE.Group(), 0.025); petals.name = 'MATTER__M9__HELIOSTAT_PETAL_CROWN'; petals.position.set(0, 7.75, -0.3); root.add(petals);
  for (let petal = 0; petal < 12; petal += 1) { const angle = petal / 12 * Math.PI * 2; box(petals, `MATTER__M9__INDEPENDENT_HELIOSTAT_PETAL_${petal + 1}`, [1.75, 0.12, 0.7], petal % 3 ? m.silver : m.structuralColour, [Math.sin(angle) * 2.7, 0.3 + petal % 2 * 0.18, Math.cos(angle) * 2.7], false, [0, -angle, (petal % 2 ? 1 : -1) * 0.14]); }
  return root;
}

function createPorosium(m: Materials) {
  const root = new THREE.Group(); root.name = 'MATTER__M10__POROSIUM_TOWERS';
  const towers = [{ x: -3.4, height: 10.8, width: 5.6 }, { x: 3.6, height: 7.5, width: 5.0 }];
  towers.forEach((tower, towerIndex) => {
    taper(root, `MATTER__M10__POROUS_TOWER_CORE_${towerIndex + 1}`, tower.width, tower.width * 0.88, tower.height, towerIndex ? m.graphite : m.frame, [tower.x, 0.22 + tower.height * 0.5, -0.8], true, 8);
    for (let row = 0; row < 9; row += 1) {
      const y = 0.75 + row * (tower.height - 1.2) / 8; const poreRadius = 0.18 + row * 0.055;
      for (let col = 0; col < 5; col += 1) {
        const x = tower.x - 1.85 + col * 0.92;
        torus(root, `MATTER__M10__DEEP_CELLULAR_PORE_${towerIndex + 1}_${row + 1}_${col + 1}`, poreRadius + (col % 2) * 0.04, 0.055, col % 4 === 0 ? m.cyan : m.silver, [x, y, 2.02], [0, 0, 0], Math.PI * 2, false, 5, 16);
        torus(root, `MATTER__M10__SEA_FILTER_PORE_${towerIndex + 1}_${row + 1}_${col + 1}`, poreRadius * 0.72, 0.045, m.chromium, [x, y, -3.62], [0, 0, 0], Math.PI * 2, false, 5, 16);
      }
    }
    taper(root, `MATTER__M10__FLARED_ATMOSPHERIC_COLLECTOR_${towerIndex + 1}`, tower.width * 0.74, tower.width * 1.46, 2.2, towerIndex ? m.silver : m.pale, [tower.x, tower.height + 1.15, -0.8], false, 8);
    for (let cage = 0; cage < 8; cage += 1) { const angle = cage / 8 * Math.PI * 2; pipe(root, `MATTER__M10__MOLECULAR_CAGE_CROWN_MEMBER_${towerIndex + 1}_${cage + 1}`, new THREE.Vector3(tower.x + Math.sin(angle) * tower.width * 0.35, tower.height + 0.2, -0.8 + Math.cos(angle) * tower.width * 0.35), new THREE.Vector3(tower.x + Math.sin(angle) * tower.width * 0.64, tower.height + 2.2, -0.8 + Math.cos(angle) * tower.width * 0.64), 0.09, m.silver); }
  });
  box(root, 'MATTER__M10__LOW_MEMBRANE_CONNECTOR', [5.2, 2.2, 6.0], m.membrane, [0.1, 1.35, -0.8], true);
  for (let ribbon = 0; ribbon < 9; ribbon += 1) box(root, `MATTER__M10__TENSIONED_MEMBRANE_RIBBON_${ribbon + 1}`, [0.12, 1.55, 6.4], ribbon % 3 === 0 ? m.violetGlass : m.silver, [-2.1 + ribbon * 0.55, 1.45, -0.8], false, [0, (ribbon - 4) * 0.035, (ribbon % 2 ? 1 : -1) * 0.05]);
  for (let column = 0; column < 7; column += 1) {
    const x = -5.7 + column * 1.9; cylinder(root, `MATTER__M10__ATMOSPHERIC_TEST_COLUMN_${column + 1}`, 0.72 + column % 3 * 0.12, 3.2 + column % 4 * 0.55, column % 2 ? m.glass : m.membrane, [x, 1.6 + column % 4 * 0.275, 7.2], false, 8);
    pipe(root, `MATTER__M10__VISIBLE_CONDENSATION_CHANNEL_${column + 1}`, new THREE.Vector3(x, 2.7 + column % 4 * 0.35, 7.65), new THREE.Vector3(x + (column % 2 ? 0.6 : -0.6), 0.15, 8.2), 0.045, m.cyan);
    cylinder(root, `MATTER__M10__CONDENSATION_BASIN_${column + 1}`, 1.2, 0.08, m.water, [x + (column % 2 ? 0.6 : -0.6), 0.09, 8.2], false, 12);
  }
  for (let cell = 0; cell < 14; cell += 1) { const angle = cell / 14 * Math.PI * 2; pipe(root, `MATTER__M10__NESTED_OCTAHEDRAL_CANOPY_CELL_${cell + 1}`, new THREE.Vector3(Math.sin(angle) * 3.3, 2.7, 4.9 + Math.cos(angle) * 1.4), new THREE.Vector3(Math.sin(angle + 0.45) * 3.7, 3.8, 6.5 + Math.cos(angle + 0.45) * 1.6), 0.075, cell % 3 ? m.silver : m.cyan); }
  return root;
}

function createSymbiomatter(m: Materials) {
  const root = new THREE.Group(); root.name = 'MATTER__M11__SYMBIOMATTER_CONSERVATORY';
  const pavilionCenters = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-5.8, 0, -2.6), new THREE.Vector3(5.7, 0, -2.3), new THREE.Vector3(-4.0, 0, 4.2), new THREE.Vector3(4.2, 0, 4.0)];
  pavilionCenters.forEach((center, pavilion) => {
    const height = 2.2 + pavilion % 3 * 0.55;
    cylinder(root, `MATTER__M11__BIOFABRICATED_PAVILION_${pavilion + 1}`, 6.1 - pavilion % 2 * 0.6, height, pavilion % 2 ? m.bioComposite : m.mycelium, [center.x, 0.18 + height * 0.5, center.z], true, 8, [0, pavilion * 0.18, 0]);
    const roofY = height + 0.35;
    for (let vein = 0; vein < 10; vein += 1) { const angle = vein / 10 * Math.PI * 2; pipe(root, `MATTER__M11__LEAF_VEIN_ROOF_RIB_${pavilion + 1}_${vein + 1}`, new THREE.Vector3(center.x, roofY, center.z), new THREE.Vector3(center.x + Math.sin(angle) * (3.7 + vein % 2 * 0.5), roofY - 0.22, center.z + Math.cos(angle) * (2.6 + vein % 3 * 0.32)), 0.09, vein % 4 === 0 ? m.greenLight : m.frame); }
    for (let block = 0; block < 12; block += 1) { const angle = block / 12 * Math.PI * 2; const mat = block % 4 === 0 ? m.living : block % 3 === 0 ? m.mycelium : m.bioComposite; box(root, `MATTER__M11__REMOVABLE_GROWN_WALL_BLOCK_${pavilion + 1}_${block + 1}`, [1.0, 0.72, 0.16], mat, [center.x + Math.sin(angle) * 3.08, 0.72 + block % 2 * 0.78, center.z + Math.cos(angle) * 3.08], false, [0, -angle, 0]); }
  });
  pavilionCenters.slice(1).forEach((center, index) => slabBetween(root, `MATTER__M11__BRANCHING_COVERED_WALK_${index + 1}`, new THREE.Vector3(0, 0.22, 0), new THREE.Vector3(center.x, 0.22, center.z), 1.0, 0.14, m.paving));
  for (let panel = 0; panel < 18; panel += 1) {
    const x = -7.3 + panel % 9 * 1.82; const y = 0.65 + Math.floor(panel / 9) * 0.95;
    box(root, `MATTER__M11__SEALED_LIVING_TEST_PANEL_${panel + 1}`, [1.32, 0.76, 0.12], panel % 3 === 0 ? m.living : panel % 3 === 1 ? m.bioComposite : m.mycelium, [x, y, 6.75]);
    pulse(box(root, `MATTER__M11__LIVING_PANEL_MONITOR_${panel + 1}`, [0.16, 0.08, 0.04], m.greenLight.clone(), [x + 0.48, y - 0.25, 6.84]), 0.0028, panel * 0.23, 0.03, 1.2);
  }
  for (let braid = 0; braid < 3; braid += 1) { const points = Array.from({ length: 13 }, (_, index) => { const t = index / 12; const angle = Math.PI * t; return new THREE.Vector3(-2.8 + t * 5.6 + Math.sin(t * Math.PI * 4 + braid * 2.1) * 0.12, 0.25 + Math.sin(angle) * (3.0 + braid * 0.12), 7.25 + braid * 0.14); }); points.slice(1).forEach((point, index) => pipe(root, `MATTER__M11__BRAIDED_BIOCOMPOSITE_ENTRY_${braid + 1}_${index + 1}`, points[index], point, 0.11, braid === 1 ? m.frame : m.bioComposite)); }
  for (let basin = 0; basin < 6; basin += 1) { const x = -6.2 + basin * 2.5; cylinder(root, `MATTER__M11__CONSTRUCTED_WETLAND_BASIN_${basin + 1}`, 2.0, 0.1, basin % 2 ? m.water : m.living, [x, 0.08, 9.6 + basin % 2 * 0.8], false, 12); }
  return root;
}

function createVitrimer(m: Materials) {
  const root = new THREE.Group(); root.name = 'MATTER__M12__VITRIMER_HOUSE';
  const volumes = [{ x: -4.3, z: -0.8, w: 7.2, d: 8.6, h: 3.0 }, { x: 0, z: -0.2, w: 8.0, d: 10.2, h: 3.6 }, { x: 4.4, z: -1.0, w: 7.0, d: 8.2, h: 2.8 }];
  volumes.forEach((volume, index) => {
    roundedBox(root, `MATTER__M12__MOULDED_CONTINUOUS_VOLUME_${index + 1}`, [volume.w, volume.h, volume.d], 1.2, m.graphite, [volume.x, 0.22 + volume.h * 0.5, volume.z], true);
    roundedBox(root, `MATTER__M12__TRANSLUCENT_ELASTOMER_RAINSCREEN_${index + 1}`, [volume.w + 0.24, volume.h + 0.24, volume.d + 0.24], 1.26, m.membrane, [volume.x, 0.22 + volume.h * 0.5, volume.z]);
  });
  for (let scar = 0; scar < 28; scar += 1) {
    const volume = volumes[scar % volumes.length]; const x = volume.x - volume.w * 0.4 + (scar % 7) * volume.w * 0.13; const y = 0.65 + Math.floor(scar / 7) * 0.62; const z = volume.z + volume.d * 0.51 + 0.14;
    pulse(pipe(root, `MATTER__M12__HEALED_DAMAGE_SCAR_${scar + 1}`, new THREE.Vector3(x, y, z), new THREE.Vector3(x + 0.55 + scar % 3 * 0.18, y + (scar % 2 ? 0.38 : -0.28), z), 0.028, m.violet.clone()), 0.0032, scar * 0.24, 0.02, 2.0);
  }
  box(root, 'MATTER__M12__PULLED_SEAM_ENTRANCE_LEFT', [3.1, 3.0, 0.5], m.membrane, [-2.0, 1.65, 5.35], false, [0, -0.16, -0.08]);
  box(root, 'MATTER__M12__PULLED_SEAM_ENTRANCE_RIGHT', [3.1, 3.0, 0.5], m.membrane, [2.0, 1.65, 5.35], false, [0, 0.16, 0.08]);
  box(root, 'MATTER__M12__DEEP_WHITE_SEAM_THRESHOLD', [2.0, 2.55, 0.22], m.whiteLight, [0, 1.48, 5.25]);
  roundedBox(root, 'MATTER__M12__FLEXIBLE_ENTRY_CANOPY', [6.2, 0.24, 3.6], 0.12, m.membrane, [0, 3.45, 6.6], false, [0.08, 0, 0]);
  for (let panel = 0; panel < 10; panel += 1) {
    box(root, `MATTER__M12__RESPONSIVE_POLYMER_TEST_FRAME_${panel + 1}`, [1.2, 2.25, 0.12], m.frame, [-7.0 + panel * 1.55, 1.18, -6.8]);
    const sample = box(root, `MATTER__M12__SOLAR_STRESS_POLYMER_PANEL_${panel + 1}`, [0.9, 1.88, 0.08], panel % 3 === 0 ? m.structuralColour : panel % 2 ? m.membrane : m.violetGlass, [-7.0 + panel * 1.55, 1.18, -6.68], false, [0, 0, (panel % 3 - 1) * 0.1]); if (panel === 0) rotate(sample, 0.003, 'z');
  }
  for (let ridge = 0; ridge < 7; ridge += 1) { const inflated = sphere(root, `MATTER__M12__INFLATED_ROOF_RIDGE_${ridge + 1}`, [0.9, 0.28, 3.3], ridge % 2 ? m.membrane : m.graphite, [-4.8 + ridge * 1.6, 4.0 + ridge % 2 * 0.18, -0.4]); inflated.rotation.z = ridge % 2 ? 0.06 : -0.06; }
  return root;
}

function createFourthForm(m: Materials) {
  const root = new THREE.Group(); root.name = 'MATTER__M13__FOURTH_FORM_FOUNDRY';
  box(root, 'MATTER__M13__LONG_ADDITIVE_FABRICATION_HALL', [19.6, 4.4, 11.6], m.graphite, [0, 2.35, -0.7], true);
  for (let layer = 0; layer < 32; layer += 1) { const y = 0.45 + layer * 0.12; box(root, `MATTER__M13__VISIBLE_PRINT_LAYER_${layer + 1}`, [18.7 - layer * 0.04, 0.035, 0.08], layer < 11 ? m.ceramic : layer < 22 ? m.silver : m.pale, [0, y, 5.14]); }
  const roots = [-8.2, -4.1, 0, 4.1, 8.2];
  roots.forEach((x, index) => {
    const trunk = new THREE.Vector3(x, 0.12, index % 2 ? -5.9 : 5.2); const crown = new THREE.Vector3(x * 0.58, 5.9 + index % 2 * 0.5, -0.8);
    pipe(root, `MATTER__M13__PRINTED_ROOT_SUPPORT_${index + 1}`, trunk, crown, 0.28 - index % 2 * 0.04, index % 2 ? m.silver : m.ceramic, true);
    for (let branch = 0; branch < 4; branch += 1) pipe(root, `MATTER__M13__CONTINUOUS_TOOLPATH_BRANCH_${index + 1}_${branch + 1}`, crown, new THREE.Vector3(-8.2 + (index * 4 + branch) % 5 * 4.1, 6.15 + branch % 2 * 0.25, -4.7 + branch * 3.0), 0.12, branch % 3 === 0 ? m.cyan : m.silver);
  });
  for (let door = 0; door < 3; door += 1) {
    const x = -6.0 + door * 6.0; box(root, `MATTER__M13__IMMENSE_SEGMENTED_FREIGHT_DOOR_${door + 1}`, [4.8, 3.6, 0.18], m.frame, [x, 1.95, -6.55]);
    for (let rib = 0; rib < 9; rib += 1) box(root, `MATTER__M13__DOOR_PRINT_RIB_${door + 1}_${rib + 1}`, [0.12, 3.35, 0.12], door % 2 ? m.silver : m.ceramic, [x - 1.9 + rib * 0.48, 1.95, -6.68], false, [0, 0, (rib % 3 - 1) * 0.04]);
  }
  const spiralPoints = Array.from({ length: 25 }, (_, index) => { const t = index / 24; const angle = t * Math.PI * 4; const radius = 0.5 + t * 3.6; return new THREE.Vector3(Math.sin(angle) * radius, 3.7 + t * 0.65, 5.6 + Math.cos(angle) * radius * 0.52); });
  spiralPoints.slice(1).forEach((point, index) => pulse(pipe(root, `MATTER__M13__MULTIMATERIAL_SPIRAL_CANOPY_${index + 1}`, spiralPoints[index], point, 0.11 + index % 4 * 0.015, (index % 5 === 0 ? m.cyan : index % 3 === 0 ? m.violet : m.silver).clone()), 0.0038, index * 0.22, 0.03, 1.8));
  for (let rail = 0; rail < 4; rail += 1) box(root, `MATTER__M13__MOBILE_PRINTER_RAIL_${rail + 1}`, [0.16, 0.1, 10.0], m.silver, [-6.0 + rail * 4.0, 0.12, 10.2]);
  for (let printer = 0; printer < 3; printer += 1) {
    const x = -4.0 + printer * 4.0; box(root, `MATTER__M13__GANTRY_PRINTER_BEAM_${printer + 1}`, [3.4, 0.28, 0.28], m.frame, [x, 3.0, 10.2]);
    for (const side of [-1, 1]) box(root, `MATTER__M13__GANTRY_PRINTER_LEG_${printer + 1}_${side < 0 ? 'W' : 'E'}`, [0.25, 3.0, 0.25], m.frame, [x + side * 1.45, 1.5, 10.2]);
    taper(root, `MATTER__M13__DEPOSITION_NOZZLE_${printer + 1}`, 0.38, 0.1, 0.9, m.copper, [x, 2.25, 10.2], false, 8);
  }
  for (let silo = 0; silo < 5; silo += 1) cylinder(root, `MATTER__M13__RAW_MATERIAL_SILO_${silo + 1}`, 1.25, 3.5 + silo % 2 * 0.7, silo % 2 ? m.silver : m.ceramic, [-6.0 + silo * 3.0, 6.4 + silo % 2 * 0.35, -1.5], false, 12);
  return root;
}

function createSecondLife(m: Materials) {
  const root = new THREE.Group(); root.name = 'MATTER__M14__SECOND_LIFE_MATERIALS_EXCHANGE';
  const panelMaterials = [m.silver, m.oxidized, m.reusedBrick, m.structuralColour, m.ceramic, m.copper];
  for (let hall = 0; hall < 3; hall += 1) {
    const width = 7.0; const height = 3.0 + hall * 0.72; const x = -5.2 + hall * 5.2; const z = -1.4 + hall * 0.7;
    box(root, `MATTER__M14__REUSED_STRUCTURAL_FRAME_HALL_${hall + 1}`, [width, height, 10.4], m.frame, [x, 0.2 + height * 0.5, z], true);
    for (let col = 0; col < 5; col += 1) for (let row = 0; row < 4; row += 1) {
      const panel = box(root, `MATTER__M14__RECLAIMED_FACADE_PANEL_${hall + 1}_${row + 1}_${col + 1}`, [1.15, 0.62 + row * 0.06, 0.12], panelMaterials[(hall * 5 + row + col) % panelMaterials.length], [x - 2.45 + col * 1.22, 0.65 + row * 0.74, z + 5.25]); panel.userData.reusePassport = true;
      pulse(box(root, `MATTER__M14__ILLUMINATED_REUSE_TAG_${hall + 1}_${row + 1}_${col + 1}`, [0.13, 0.07, 0.04], m.whiteLight.clone(), [x - 2.0 + col * 1.22, 0.42 + row * 0.74, z + 5.34]), 0.0022, (hall * 20 + row * 5 + col) * 0.11, 0.03, 1.0);
    }
    for (let bolt = 0; bolt < 18; bolt += 1) cylinder(root, `MATTER__M14__VISIBLE_REVERSIBLE_BOLT_${hall + 1}_${bolt + 1}`, 0.13, 0.12, m.silver, [x - 3.0 + bolt % 6 * 1.2, 0.48 + Math.floor(bolt / 6) * 1.1, z + 5.39], false, 8, [Math.PI / 2, 0, 0]);
    for (let cassette = 0; cassette < 6; cassette += 1) box(root, `MATTER__M14__REMOVABLE_ROOF_CASSETTE_${hall + 1}_${cassette + 1}`, [1.0, 0.16, 8.8], panelMaterials[(hall + cassette) % panelMaterials.length], [x - 2.5 + cassette, height + 0.28, z], false, [0, 0, cassette % 2 ? 0.03 : -0.03]);
  }
  for (let blade = 0; blade < 11; blade += 1) { const t = blade / 10; const angle = Math.PI * t; box(root, `MATTER__M14__RETIRED_TURBINE_BLADE_ARCH_${blade + 1}`, [0.55, 3.8, 0.18], blade % 2 ? m.silver : m.oxidized, [Math.cos(angle) * 3.4, 0.3 + Math.sin(angle) * 2.9, 6.9], false, [0, 0, angle - Math.PI / 2]); }
  for (let rail = 0; rail < 2; rail += 1) box(root, `MATTER__M14__DECONSTRUCTION_CRANE_RAIL_${rail + 1}`, [0.24, 0.22, 10.0], m.silver, [-4.2 + rail * 8.4, 4.6, -7.8]);
  box(root, 'MATTER__M14__DECONSTRUCTION_OVERHEAD_CRANE', [9.0, 0.36, 0.5], m.copper, [0, 4.6, -7.8]);
  for (let rack = 0; rack < 7; rack += 1) { const x = -6.0 + rack * 2.0; box(root, `MATTER__M14__VERTICAL_RECOVERED_COMPONENT_RACK_${rack + 1}`, [1.3, 2.8, 0.5], m.frame, [x, 1.4, -9.4]); for (let beam = 0; beam < 4; beam += 1) box(root, `MATTER__M14__RECOVERED_BEAM_${rack + 1}_${beam + 1}`, [1.1, 0.18, 0.32], panelMaterials[(rack + beam) % panelMaterials.length], [x, 0.5 + beam * 0.64, -9.4]); }
  for (let tower = 0; tower < 4; tower += 1) { const x = tower < 2 ? -7.2 : 7.2; const z = tower % 2 ? -8.6 : -5.7; cylinder(root, `MATTER__M14__PERFORATED_SORTING_TOWER_${tower + 1}`, 1.45, 4.6, tower % 2 ? m.oxidized : m.chromium, [x, 2.3, z], true, 8); for (let pore = 0; pore < 7; pore += 1) torus(root, `MATTER__M14__SORTING_TOWER_WASTE_PORE_${tower + 1}_${pore + 1}`, 0.15 + pore % 3 * 0.04, 0.035, m.silver, [x, 0.65 + pore * 0.52, z + 0.75], [0, 0, 0], Math.PI * 2, false, 5, 12); }
  return root;
}

function createAtomicCartography(m: Materials) {
  const root = new THREE.Group(); root.name = 'MATTER__M15__ATOMIC_CARTOGRAPHY_OBSERVATORY';
  roundedBox(root, 'MATTER__M15__BROAD_ISOLATED_INSTRUMENT_PLINTH', [17.2, 0.44, 11.8], 0.8, m.paving, [0, 0.22, -0.4]);
  roundedBox(root, 'MATTER__M15__VIBRATION_ISOLATION_MOAT', [16.0, 0.12, 10.6], 0.72, m.water, [0, 0.48, -0.4]);
  roundedBox(root, 'MATTER__M15__RECESSED_BLACK_FLOATING_BASE', [14.2, 0.82, 8.9], 0.7, m.black, [0, 0.87, -0.4], true);
  roundedBox(root, 'MATTER__M15__PALE_ATOM_RESOLVED_MAIN_VOLUME', [13.6, 2.55, 8.3], 1.25, m.pale, [0, 2.0, -0.4], true);
  const podPositions = [-5.0, -2.5, 0, 2.5, 5.0];
  podPositions.forEach((x, pod) => {
    const capsule = roundedBox(root, `MATTER__M15__POLISHED_INSTRUMENT_POD_${pod + 1}`, [1.55, 2.15, 2.6], 0.68, pod % 2 ? m.chromium : m.glass, [x, 2.1 + pod % 2 * 0.22, -5.45], true);
    capsule.userData.independentFoundation = true;
    box(root, `MATTER__M15__FLEXIBLE_ENCLOSED_POD_BRIDGE_${pod + 1}`, [1.0, 0.75, 2.0], m.membrane, [x, 2.12, -3.95]);
  });
  box(root, 'MATTER__M15__LONG_ISOLATION_MOAT_ENTRY_BRIDGE', [1.4, 0.16, 7.0], m.paving, [0, 0.66, 6.0]);
  box(root, 'MATTER__M15__ALIGNED_METROLOGY_ENTRY_FRAME', [4.5, 3.8, 0.34], m.frame, [0, 2.3, 5.15]);
  box(root, 'MATTER__M15__PRECISE_RECESSED_ENTRANCE', [2.1, 2.4, 0.18], m.glass, [0, 1.85, 3.83]);
  for (let axis = 0; axis < 9; axis += 1) box(root, `MATTER__M15__CONVERGING_MEASUREMENT_AXIS_${axis + 1}`, [0.035, 0.025, 6.0 - axis * 0.24], axis % 2 ? m.silver : m.whiteLight, [-1.8 + axis * 0.45, 0.77, 7.2 - axis * 0.12], false, [0, (axis - 4) * 0.035, 0]);
  for (let atom = 0; atom < 56; atom += 1) { const col = atom % 14; const row = Math.floor(atom / 14); pulse(sphere(root, `MATTER__M15__ATOMIC_FACADE_LIGHT_${atom + 1}`, [0.055, 0.055, 0.025], (atom % 11 === 0 ? m.cyan : m.whiteLight).clone(), [-5.8 + col * 0.9, 1.25 + row * 0.55, 3.78]), 0.0026, atom * 0.2, 0.01, atom % 11 === 0 ? 2.0 : 0.8); }
  cylinder(root, 'MATTER__M15__METROLOGY_REFERENCE_MAST', 0.22, 4.2, m.silver, [5.2, 5.3, -0.4], false, 12);
  for (let target = 0; target < 5; target += 1) { const angle = target / 5 * Math.PI * 2; sphere(root, `MATTER__M15__REFERENCE_REFLECTOR_${target + 1}`, [0.18, 0.18, 0.18], target % 2 ? m.whiteLight : m.cyan, [5.2 + Math.sin(angle) * 0.7, 7.2 + Math.cos(angle) * 0.45, -0.4 + Math.cos(angle) * 0.7]); }
  return root;
}

function assignBuildingMetadata(root: THREE.Group, record: MaterialsScienceBuildingProgram) {
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

function createBuilding(record: MaterialsScienceBuildingProgram, materials: Materials) {
  const factories: Record<MaterialsScienceBuildingForm, (materials: Materials) => THREE.Group> = {
    compiler: createMatterCompiler,
    laminaris: createLaminaris,
    topologica: createTopologica,
    morphostructure: createMorphostructure,
    polyphase: createPolyphase,
    aegis: createAegisBastion,
    ceramatrix: createCeramatrix,
    'ion-vault': createIonVault,
    'photon-weave': createPhotonWeave,
    porosium: createPorosium,
    symbiomatter: createSymbiomatter,
    vitrimer: createVitrimer,
    'fourth-form': createFourthForm,
    'second-life': createSecondLife,
    'atomic-cartography': createAtomicCartography,
  };
  return assignBuildingMetadata(factories[record.form](materials), record);
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
  const value = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), mat), name); value.userData.walkable = walkable; value.userData.navObstacle = false; value.userData.materialsScienceRoute = true; value.receiveShadow = true; parent.add(value); return value;
}

function offsetPath(points: readonly THREE.Vector3[], offset: number, modulation = 0, frequency = 1) {
  return points.map((point, index) => { const previous = points[Math.max(0, index - 1)]; const next = points[Math.min(points.length - 1, index + 1)]; const tangent = next.clone().sub(previous).setY(0).normalize(); const normal = new THREE.Vector3(-tangent.z, 0, tangent.x); const t = index / Math.max(1, points.length - 1); return point.clone().addScaledVector(normal, offset + Math.sin(t * Math.PI * frequency) * modulation).setY(FLOOR_Y + 0.026); });
}

function addDistrictInfrastructure(district: THREE.Group, definition: DistrictDefinition, m: Materials) {
  const infrastructure = new THREE.Group(); infrastructure.name = 'MATTER__DISTRICT_MATTER_CRESCENT_INFRASTRUCTURE';
  const matterCrescent = districtArc(definition, 0.34, 0.02, 0.98, 128);
  addRibbon(infrastructure, 'MATTER__MATTER_CRESCENT', matterCrescent, 2.65, m.paving);
  for (let composition = 0; composition < 4; composition += 1) pulse(addRibbon(infrastructure, `MATTER__COMPOSITIONAL_LIGHT_BAND_${composition + 1}`, offsetPath(matterCrescent, -0.84 + composition * 0.56, 0.06, 4 + composition), 0.045, [m.whiteLight, m.cyan, m.violet, m.amber][composition].clone(), false), 0.0035 + composition * 0.0004, composition * 0.72, 0.02, 1.5);
  const adaptiveArc = districtArc(definition, 0.67, 0.025, 0.975, 112);
  addRibbon(infrastructure, 'MATTER__ADAPTIVE_BELT_ROUTE', adaptiveArc, 1.1, m.gravel);
  const forgeRoute = districtArc(definition, 0.97, 0.03, 0.97, 96);
  addRibbon(infrastructure, 'MATTER__OUTER_FORGE_FREIGHT_ROUTE', forgeRoute, 1.45, m.graphite);
  [0.07, 0.285, 0.50, 0.715, 0.93].forEach((angularT, index) => {
    const crossing = districtSpine(definition, angularT, 0.03, 0.97, 72);
    addRibbon(infrastructure, `MATTER__CRYSTAL_AXIS_CROSSING_${index + 1}`, crossing, 0.92, index % 2 ? m.gravel : m.paving);
    pulse(addRibbon(infrastructure, `MATTER__CRYSTAL_AXIS_GUIDE_${index + 1}`, offsetPath(crossing, 0.18), 0.032, (index % 2 ? m.cyan : m.whiteLight).clone(), false), 0.003, index * 0.58, 0.02, 1.0);
  });
  const compilerCenter = pointInDistrict(definition, 0.16, 0.50, FLOOR_Y + 0.012);
  cylinder(infrastructure, 'MATTER__PHASE_DIAGRAM_PLAZA', 19.0, 0.08, m.paving, [compilerCenter.x, compilerCenter.y, compilerCenter.z], false, 6);
  for (let triangle = 0; triangle < 6; triangle += 1) {
    const angle = triangle / 6 * Math.PI * 2; const center = new THREE.Vector3(compilerCenter.x + Math.sin(angle) * 6.8, compilerCenter.y + 0.06, compilerCenter.z + Math.cos(angle) * 6.8);
    const vertices = [0, 1, 2].map((corner) => center.clone().add(new THREE.Vector3(Math.sin(angle + corner / 3 * Math.PI * 2) * 1.25, 0, Math.cos(angle + corner / 3 * Math.PI * 2) * 1.25)));
    for (let edge = 0; edge < 3; edge += 1) pulse(pipe(infrastructure, `MATTER__COMPOSITIONAL_TRIANGLE_${triangle + 1}_${edge + 1}`, vertices[edge], vertices[(edge + 1) % 3], 0.035, (triangle % 2 ? m.violet : m.cyan).clone()), 0.0034, triangle * 0.5 + edge * 0.17, 0.02, 1.3);
  }
  district.add(infrastructure); return { infrastructure, matterCrescent, adaptiveArc, forgeRoute };
}

function addDistrictLandscape(district: THREE.Group, definition: DistrictDefinition, m: Materials) {
  const landscape = new THREE.Group(); landscape.name = 'MATTER__EXPERIMENTAL_MATERIAL_LANDSCAPE';
  for (let specimen = 0; specimen < 34; specimen += 1) {
    const radialT = specimen % 2 ? 0.03 : 0.96; const angularT = 0.025 + Math.floor(specimen / 2) * 0.057; const point = pointInDistrict(definition, radialT, angularT);
    box(landscape, `MATTER__LONG_TERM_EXPOSURE_FRAME_${specimen + 1}`, [0.85, 1.35 + specimen % 4 * 0.22, 0.14], m.frame, [point.x, 0.68 + specimen % 4 * 0.11, point.z], false, [0, specimen * 0.31, 0]);
    box(landscape, `MATTER__WEATHERING_SPECIMEN_${specimen + 1}`, [0.58, 1.02 + specimen % 3 * 0.2, 0.08], [m.copper, m.oxidized, m.ceramic, m.bioComposite, m.structuralColour][specimen % 5], [point.x, 0.68 + specimen % 3 * 0.1, point.z + 0.1], false, [0, specimen * 0.31, 0]);
  }
  for (let grass = 0; grass < 40; grass += 1) {
    const point = pointInDistrict(definition, grass % 2 ? 0.24 : 0.76, 0.025 + Math.floor(grass / 2) * 0.047);
    for (let blade = 0; blade < 3; blade += 1) box(landscape, `MATTER__SILVER_GRASS_BLADE_${grass + 1}_${blade + 1}`, [0.035, 0.42 + blade * 0.09, 0.025], blade % 2 ? m.grass : m.silver, [point.x + (blade - 1) * 0.08, 0.22 + blade * 0.045, point.z], false, [0, grass * 0.7, (blade - 1) * 0.08]);
  }
  district.add(landscape); return landscape;
}

export function buildMaterialsScienceLabsDistrict(district: THREE.Group, definition: DistrictDefinition) {
  if (!definition.sector) throw new Error('Materials Science Labs District requires a masterplan sector');
  const materials = createMaterials();
  const { infrastructure, matterCrescent, adaptiveArc, forgeRoute } = addDistrictInfrastructure(district, definition, materials);
  const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = MATERIALS_SCIENCE_BUILDING_PROGRAM.map((record) => {
    const placementRadialT = record.radialT < 0.3 ? 0.08 : record.radialT > 0.7 ? 0.92 : record.radialT;
    const placementAngularT = record.radialT > 0.3 && record.radialT < 0.7 && record.code !== 'M4'
      ? record.angularT - 0.06
      : record.angularT;
    const building = createBuilding(record, materials); const position = pointInDistrict(definition, placementRadialT, placementAngularT, FLOOR_Y + 0.02); building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2])); const inward = worldPosition.clone().multiplyScalar(-1).setY(0).normalize(); building.rotation.y = Math.atan2(inward.x, inward.z);
    building.userData.sectorAnchor = { radius: Math.hypot(worldPosition.x, worldPosition.z), angle: Math.atan2(worldPosition.z, worldPosition.x), normalizedRadial: placementRadialT, normalizedAngular: placementAngularT };
    district.add(building); return building;
  });
  facilities.forEach((facility, index) => {
    const record = MATERIALS_SCIENCE_BUILDING_PROGRAM[index]; const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, Math.min(9.0, record.footprintMetres[1] / 20 + 0.8)); const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const route = record.radialT > 0.68 ? forgeRoute : record.radialT > 0.40 ? adaptiveArc : matterCrescent;
    const routePoint = route.reduce((closest, point) => point.distanceToSquared(entrance) < closest.distanceToSquared(entrance) ? point : closest, route[0]); const approach = [routePoint.clone(), routePoint.clone().lerp(entrance, 0.48), entrance];
    addRibbon(infrastructure, `MATTER__BUILDING_APPROACH_${record.code}`, approach, 0.86, index < 5 ? materials.paving : index < 10 ? materials.gravel : materials.paving);
    pulse(addRibbon(infrastructure, `MATTER__BUILDING_APPROACH_PASSPORT_${record.code}`, offsetPath(approach, 0.24), 0.035, [materials.whiteLight, materials.cyan, materials.violet, materials.amber, materials.greenLight][index % 5].clone(), false), 0.0036, index * 0.37, 0.02, 1.2);
  });
  district.userData.materialsScienceLabsDistrict = {
    identity: 'Material Science Labs District — The Matter Crescent',
    mapLabel: 'Materials Science Labs',
    architecturalLanguage: 'a physical catalogue of possible matter using dark structural frames, pale mineral paving, replaceable alloy and ceramic cassettes, responsive polymers, porous membranes, bio-derived composites, precise luminous passports, and exposed scientific infrastructure',
    buildingCount: facilities.length,
    buildings: MATERIALS_SCIENCE_BUILDING_PROGRAM.map((record) => ({ code: record.code, name: record.name, subtitle: record.subtitle, purpose: record.purpose, placementZone: record.placementZone, footprintMetres: record.footprintMetres, heightMetres: record.heightMetres, exteriorMotif: record.exteriorMotif })),
    zones: {
      innerPrecisionArc: ['The Matter Compiler', 'Laminaris Institute', 'Topologica Hall', 'Photon Weave Institute', 'Atomic Cartography Observatory'],
      centralAdaptiveBelt: ['Morphostructure Pavilion', 'The Ion Vault', 'Porosium Towers', 'Vitrimer House'],
      outerForgeFront: ['Polyphase Forge', 'Aegis Bastion', 'Ceramatrix Works', 'Fourth-Form Foundry', 'Second-Life Materials Exchange'],
      forestTransition: ['Porosium Towers', 'Symbiomatter Conservatory', 'Vitrimer House'],
    },
    circulation: { primaryPromenade: 'MATTER__MATTER_CRESCENT', adaptiveBeltRoute: 'MATTER__ADAPTIVE_BELT_ROUTE', forgeFreightRoute: 'MATTER__OUTER_FORGE_FREIGHT_ROUTE', phaseDiagramPlaza: true, crystallographicCrossings: 5, exactBuildingApproaches: 15 },
    signatureSystems: { compilerHexBlocks: 6, laminarPlates: 7, topologicalCrescents: 2, morphostructureCellMembers: 72, polyphaseVolumes: 8, aegisShells: 3, ceramatrixArches: 7, ionCellVolumes: 5, photonOpticalFins: 96, porousTowerCount: 2, symbiomatterPavilions: 5, vitrimerVolumes: 3, fourthFormGantryPrinters: 3, secondLifeHalls: 3, atomicInstrumentPods: 5 },
    materialPassportGrid: true,
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: MATERIALS_SCIENCE_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: ['Matter Crescent', 'Phase Diagram Plaza', 'Adaptive Belt Route', 'Outer Forge Freight Route', 'Crystallographic Crossings', 'Exposure Specimen Fields', 'Silver Grass Landscape'],
    realizedFeatureTags: MATERIALS_SCIENCE_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 23,
    radialCoverage: 0.97,
    angularCoverage: 0.98,
    exteriorOnly: true,
    matterCrescentNarrative: true,
    circularMaterialLifecycle: true,
  };
}
