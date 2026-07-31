import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type MedicalBuildingForm =
  | 'pathology'
  | 'hemolumen'
  | 'vitrivivarium'
  | 'editorium'
  | 'immunis'
  | 'astra'
  | 'regenera'
  | 'concordia'
  | 'aegis'
  | 'simulacra';

export interface MedicalLabsBuildingProgram {
  code: string;
  name: string;
  purpose: string;
  form: MedicalBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  maturity: 'clinical translation' | 'emerging translation';
}

export const MEDICAL_LABS_BUILDING_PROGRAM: readonly MedicalLabsBuildingProgram[] = [
  {
    code: 'M1',
    name: 'Atlas Pathologica',
    purpose: 'Spatial Pathology and Disease Cartography Institute',
    form: 'pathology',
    footprintMetres: [145, 90],
    heightMetres: 68,
    radialT: 0.12,
    angularT: 0.56,
    placementZone: 'Inner edge near Molecular Biology',
    maturity: 'clinical translation',
  },
  {
    code: 'M2',
    name: 'Hemolumen Spire',
    purpose: 'Liquid Biopsy and Circulating Biomarker Observatory',
    form: 'hemolumen',
    footprintMetres: [105, 82],
    heightMetres: 148,
    radialT: 0.31,
    angularT: 0.12,
    placementZone: 'Western border near Pharmacology',
    maturity: 'clinical translation',
  },
  {
    code: 'M3',
    name: 'Vitrivivarium',
    purpose: 'Patient-Derived Organoid and Organ-on-Chip Foundry',
    form: 'vitrivivarium',
    footprintMetres: [225, 145],
    heightMetres: 54,
    radialT: 0.13,
    angularT: 0.87,
    placementZone: 'Inner edge near Microbiology',
    maturity: 'clinical translation',
  },
  {
    code: 'M4',
    name: 'Editorium Genomicum',
    purpose: 'Genome Surgery and Rare-Disease Therapeutics Complex',
    form: 'editorium',
    footprintMetres: [130, 105],
    heightMetres: 88,
    radialT: 0.43,
    angularT: 0.52,
    placementZone: 'Central Therapeutic Spine',
    maturity: 'clinical translation',
  },
  {
    code: 'M5',
    name: 'Immunis Bastion',
    purpose: 'Engineered Immunity and Living Medicines Center',
    form: 'immunis',
    footprintMetres: [145, 145],
    heightMetres: 70,
    radialT: 0.52,
    angularT: 0.72,
    placementZone: 'Central Therapeutic Spine',
    maturity: 'clinical translation',
  },
  {
    code: 'M6',
    name: 'Astra Theranostica',
    purpose: 'Molecular Imaging and Radiotheranostics Beacon',
    form: 'astra',
    footprintMetres: [185, 115],
    heightMetres: 80,
    radialT: 0.50,
    angularT: 0.29,
    placementZone: 'Western border near Pharmacology',
    maturity: 'clinical translation',
  },
  {
    code: 'M7',
    name: 'Regenera Forge',
    purpose: 'Biofabrication and Regenerative Tissue Works',
    form: 'regenera',
    footprintMetres: [250, 110],
    heightMetres: 70,
    radialT: 0.76,
    angularT: 0.23,
    placementZone: 'Central/eastern production zone',
    maturity: 'emerging translation',
  },
  {
    code: 'M8',
    name: 'Concordia Xenomedica',
    purpose: 'Transplant Compatibility and Xenomedicine Institute',
    form: 'concordia',
    footprintMetres: [195, 155],
    heightMetres: 80,
    radialT: 0.80,
    angularT: 0.62,
    placementZone: 'Outer edge near Security',
    maturity: 'emerging translation',
  },
  {
    code: 'M9',
    name: 'Aegis Phagica',
    purpose: 'Precision Infection, Antimicrobial Resistance and Phage Biobank',
    form: 'aegis',
    footprintMetres: [180, 85],
    heightMetres: 60,
    radialT: 0.71,
    angularT: 0.46,
    placementZone: 'Microbiology-Security junction',
    maturity: 'clinical translation',
  },
  {
    code: 'M10',
    name: 'Clinica Simulacra',
    purpose: 'Patient Digital Twin and Adaptive Treatment Observatory',
    form: 'simulacra',
    footprintMetres: [150, 125],
    heightMetres: 135,
    radialT: 0.84,
    angularT: 0.88,
    placementZone: 'Outer edge near Bioanalytics',
    maturity: 'emerging translation',
  },
] as const;

const DISTRICT_ID = 'medical-labs';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const UNIT_Y = new THREE.Vector3(0, 1, 0);

type MedicalMaterials = ReturnType<typeof createMedicalMaterials>;

function medicalMaterial(
  name: string,
  color: THREE.ColorRepresentation,
  options: THREE.MeshStandardMaterialParameters = {},
) {
  return new THREE.MeshStandardMaterial({
    name,
    color,
    roughness: 0.66,
    metalness: 0.12,
    ...options,
  });
}

function createMedicalMaterials() {
  const boneCeramic = medicalMaterial('Medical bone-white sintered ceramic', '#e8e5dc', {
    roughness: 0.7,
    metalness: 0.03,
  });
  const paleCeramic = medicalMaterial('Medical pale mineral ceramic', '#cfd8d5', {
    roughness: 0.62,
    metalness: 0.05,
  });
  const frostedGlass = medicalMaterial('Medical frosted low-iron glass', '#b9d9dc', {
    emissive: '#639aa0',
    emissiveIntensity: 0.18,
    roughness: 0.28,
    metalness: 0.03,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
  });
  const clearGlass = medicalMaterial('Medical clear low-iron glass', '#83c8d1', {
    emissive: '#4a9dab',
    emissiveIntensity: 0.22,
    roughness: 0.08,
    metalness: 0.02,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
  });
  const opalGlass = medicalMaterial('Medical opalescent electrochromic glazing', '#d6eef0', {
    emissive: '#7fbfc8',
    emissiveIntensity: 0.28,
    roughness: 0.18,
    metalness: 0.06,
    transparent: true,
    opacity: 0.66,
    side: THREE.DoubleSide,
  });
  const darkGlass = medicalMaterial('Medical ultradark electrochromic glass', '#09171d', {
    emissive: '#102d38',
    emissiveIntensity: 0.3,
    roughness: 0.12,
    metalness: 0.38,
    transparent: true,
    opacity: 0.84,
  });
  const titanium = medicalMaterial('Medical satin titanium', '#a8b1b1', {
    roughness: 0.34,
    metalness: 0.84,
  });
  const paleSteel = medicalMaterial('Medical pale stainless steel', '#c4cdcb', {
    roughness: 0.3,
    metalness: 0.88,
  });
  const basalt = medicalMaterial('Medical black volcanic stone', '#0c1012', {
    roughness: 0.88,
    metalness: 0.03,
  });
  const polishedBasalt = medicalMaterial('Medical polished basalt composite', '#12191d', {
    roughness: 0.35,
    metalness: 0.22,
  });
  const bronze = medicalMaterial('Medical radiotheranostic bronze alloy', '#7d573b', {
    roughness: 0.42,
    metalness: 0.76,
  });
  const paving = medicalMaterial('Diagnostic Crescent dark mineral paving', '#333a3c', {
    roughness: 0.96,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });
  const lightPaving = medicalMaterial('Medical contour plaza paving', '#9ba6a3', {
    roughness: 0.91,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const blackWater = medicalMaterial('Medical black reflecting water', '#061216', {
    emissive: '#15343c',
    emissiveIntensity: 0.17,
    roughness: 0.05,
    metalness: 0.2,
    transparent: true,
    opacity: 0.86,
    side: THREE.DoubleSide,
  });
  const membrane = medicalMaterial('Medical translucent membrane roof', '#dce8e6', {
    emissive: '#9ebfc0',
    emissiveIntensity: 0.24,
    roughness: 0.36,
    metalness: 0,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  const rubyLight = medicalMaterial('Medical ruby diagnostic light', '#ff5171', {
    emissive: '#ff234f',
    emissiveIntensity: 3.5,
    roughness: 0.18,
  });
  const amberLight = medicalMaterial('Medical amber process light', '#ffc56a', {
    emissive: '#ff9e35',
    emissiveIntensity: 3.1,
    roughness: 0.18,
  });
  const violetLight = medicalMaterial('Medical violet therapeutic light', '#d39aff', {
    emissive: '#a95fff',
    emissiveIntensity: 3.3,
    roughness: 0.18,
  });
  const cyanLight = medicalMaterial('Medical cold cyan diagnostic light', '#aaf5ff', {
    emissive: '#62e5ff',
    emissiveIntensity: 3.4,
    roughness: 0.18,
  });
  const whiteLight = medicalMaterial('Medical ultraviolet-white light', '#f6ffff', {
    emissive: '#c9f8ff',
    emissiveIntensity: 3.2,
    roughness: 0.16,
  });
  const silverPlant = medicalMaterial('Medical silver-white planting', '#b5c2bb', {
    roughness: 0.98,
    metalness: 0.01,
  });
  [rubyLight, amberLight, violetLight, cyanLight, whiteLight].forEach((material) => {
    material.userData.isDistrictAccent = true;
  });
  return {
    boneCeramic,
    paleCeramic,
    frostedGlass,
    clearGlass,
    opalGlass,
    darkGlass,
    titanium,
    paleSteel,
    basalt,
    polishedBasalt,
    bronze,
    paving,
    lightPaving,
    blackWater,
    membrane,
    rubyLight,
    amberLight,
    violetLight,
    cyanLight,
    whiteLight,
    silverPlant,
  };
}

function prepare<T extends THREE.Object3D>(object: T, name: string, obstacle = false) {
  object.name = name;
  object.userData.selectableId = DISTRICT_ID;
  object.userData.districtId = DISTRICT_ID;
  if (object instanceof THREE.Mesh) {
    object.castShadow = true;
    object.receiveShadow = true;
    object.userData.navObstacle = obstacle;
  }
  return object;
}

function box(
  parent: THREE.Object3D,
  name: string,
  size: readonly [number, number, number],
  material: THREE.Material,
  position: readonly [number, number, number],
  obstacle = false,
) {
  const mesh = prepare(new THREE.Mesh(UNIT_BOX, material), name, obstacle);
  mesh.scale.set(...size);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function cylinder(
  parent: THREE.Object3D,
  name: string,
  diameter: number,
  height: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  obstacle = false,
  segments = 24,
) {
  const geometry = segments <= 12 ? UNIT_CYLINDER_12 : UNIT_CYLINDER_24;
  const mesh = prepare(new THREE.Mesh(geometry, material), name, obstacle);
  mesh.scale.set(diameter, height, diameter);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function ellipse(
  parent: THREE.Object3D,
  name: string,
  diameter: readonly [number, number],
  height: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  obstacle = false,
  segments = 48,
) {
  const mesh = prepare(
    new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, segments), material),
    name,
    obstacle,
  );
  mesh.scale.set(diameter[0], height, diameter[1]);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function ellipsoid(
  parent: THREE.Object3D,
  name: string,
  scale: readonly [number, number, number],
  material: THREE.Material,
  position: readonly [number, number, number],
  obstacle = false,
) {
  const mesh = prepare(new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 14), material), name, obstacle);
  mesh.scale.set(...scale);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function torus(
  parent: THREE.Object3D,
  name: string,
  radius: number,
  tube: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = [Math.PI / 2, 0, 0],
  arc = Math.PI * 2,
) {
  const mesh = prepare(new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 48, arc), material), name);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function pipe(
  parent: THREE.Object3D,
  name: string,
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material,
) {
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const direction = end.clone().sub(start);
  const mesh = prepare(new THREE.Mesh(UNIT_CYLINDER_12, material), name);
  mesh.scale.set(radius * 2, direction.length(), radius * 2);
  mesh.position.copy(midpoint);
  mesh.quaternion.setFromUnitVectors(UNIT_Y, direction.normalize());
  parent.add(mesh);
  return mesh;
}

function ringShape(
  parent: THREE.Object3D,
  name: string,
  outer: readonly [number, number],
  inner: readonly [number, number],
  material: THREE.Material,
  position: readonly [number, number, number],
) {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, outer[0], outer[1], 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, inner[0], inner[1], 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const mesh = prepare(new THREE.Mesh(new THREE.ShapeGeometry(shape, 48), material), name);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(...position);
  mesh.userData.walkable = true;
  mesh.userData.navObstacle = false;
  parent.add(mesh);
  return mesh;
}

function addLocalRibbon(
  parent: THREE.Object3D,
  name: string,
  points: readonly THREE.Vector3[],
  width: number,
  material: THREE.Material,
  walkable = true,
) {
  const vertices: number[] = [];
  const indices: number[] = [];
  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const tangent = next.clone().sub(previous).setY(0).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5);
    vertices.push(
      point.x + normal.x, point.y, point.z + normal.z,
      point.x - normal.x, point.y, point.z - normal.z,
    );
    if (index < points.length - 1) {
      const base = index * 2;
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = prepare(new THREE.Mesh(geometry, material), name);
  mesh.userData.walkable = walkable;
  mesh.userData.navObstacle = false;
  mesh.userData.medicalRoute = true;
  parent.add(mesh);
  return mesh;
}

function addAtlasPathologica(root: THREE.Group, materials: MedicalMaterials) {
  ellipse(root, 'MEDICAL__M1__CONTOUR_PLAZA', [18.0, 11.4], 0.06, materials.lightPaving, [0, FLOOR_Y, 0]);
  const layerOffsets = [
    [-0.7, 0.0, 0.4], [-0.2, 0.12, -0.1], [0.5, -0.06, 0.25], [0.1, 0.16, -0.35],
    [0.75, 0.24, 0.05], [1.1, 0.32, -0.2], [1.55, 0.4, 0.15],
  ] as const;
  layerOffsets.forEach(([x, rotation, z], index) => {
    const level = index + 1;
    const width = 14.5 - index * 0.5;
    const depth = 8.8 - index * 0.36;
    const slab = ellipse(
      root,
      `MEDICAL__M1__DISPLACED_TISSUE_SECTION_${level}`,
      [width, depth],
      0.58,
      materials.boneCeramic,
      [x, 0.38 + index * 0.84, z],
      true,
    );
    slab.rotation.y = rotation;
    ellipse(root, `MEDICAL__M1__DARK_SLICE_GAP_${level}`, [width * 0.94, depth * 0.92], 0.16, materials.darkGlass, [x, 0.72 + index * 0.84, z]);
    for (let cell = 0; cell < 12; cell += 1) {
      const angle = (cell / 12) * Math.PI * 2 + index * 0.21;
      const cellMesh = ellipsoid(
        root,
        `MEDICAL__M1__SEGMENTED_TITANIUM_CELL_${level}_${cell + 1}`,
        [0.19 + (cell % 3) * 0.04, 0.12, 0.07],
        cell % 5 === 0 ? materials.cyanLight : materials.titanium,
        [x + Math.cos(angle) * width * 0.48, 0.42 + index * 0.84, z + Math.sin(angle) * depth * 0.48],
      );
      cellMesh.rotation.y = -angle;
    }
  });
  cylinder(root, 'MEDICAL__M1__BIOPSY_NEEDLE_CORE', 1.35, 7.25, materials.basalt, [0.35, 3.62, 0.05], true);
  box(root, 'MEDICAL__M1__MICROTOME_BLADE_CANTILEVER', [7.0, 0.18, 2.0], materials.paleSteel, [-5.5, 1.12, -4.25]);
  box(root, 'MEDICAL__M1__CLINICAL_ENTRANCE_GLASS', [2.7, 1.15, 0.1], materials.clearGlass, [-4.7, 0.64, -3.72]);
  ellipse(root, 'MEDICAL__M1__ILLUMINATED_SLIDE_BASIN', [7.3, 2.35], 0.05, materials.blackWater, [-4.4, FLOOR_Y + 0.03, -6.2]);
  for (let line = 0; line < 7; line += 1) {
    box(root, `MEDICAL__M1__SUBMERGED_SCANNER_LINE_${line + 1}`, [5.8, 0.015, 0.035], materials.cyanLight, [-4.4, FLOOR_Y + 0.07, -6.85 + line * 0.22]);
  }
  const scan = box(root, 'MEDICAL__M1__VERTICAL_LAYER_SCAN', [14.2, 0.04, 0.08], materials.violetLight.clone(), [0.4, 0.86, 0]);
  scan.userData.animate = 'medical-vertical-scan';
  scan.userData.baseY = 0.86;
  scan.userData.travel = 5.2;
  scan.userData.speed = 0.16;
  box(root, 'MEDICAL__M1__REAR_SPECIMEN_DOCK_CANOPY', [11.4, 0.32, 1.8], materials.basalt, [1.0, 0.72, 5.1]);
  for (let dock = 0; dock < 5; dock += 1) {
    cylinder(root, `MEDICAL__M1__TELESCOPING_SPECIMEN_DOCK_${dock + 1}`, 0.7, 1.05, materials.clearGlass, [-3.4 + dock * 2.2, 0.54, 5.0], false, 12).rotation.x = Math.PI / 2;
  }
}

function addHemolumen(root: THREE.Group, materials: MedicalMaterials) {
  ellipse(root, 'MEDICAL__M2__OVAL_PODIUM', [10.5, 8.2], 1.35, materials.polishedBasalt, [0, 0.7, 0], true);
  ellipse(root, 'MEDICAL__M2__FLOATING_PODIUM_CANOPY', [12.2, 9.3], 0.16, materials.paleSteel, [0, 1.48, 0]);
  ellipse(root, 'MEDICAL__M2__PLASMA_COURT', [13.8, 10.4], 0.05, materials.blackWater, [0, FLOOR_Y + 0.02, 1.4]);
  const profiles = [
    [7.4, 2.9], [6.5, 3.1], [5.2, 2.7], [4.1, 2.5], [3.5, 2.25], [4.0, 2.1], [4.9, 1.85],
  ] as const;
  let y = 1.6;
  profiles.forEach(([diameter, height], index) => {
    const segment = ellipse(root, `MEDICAL__M2__DROPLET_DOUBLE_SKIN_SEGMENT_${index + 1}`, [diameter, diameter * 0.78], height, index % 2 ? materials.clearGlass : materials.opalGlass, [0.35 - index * 0.06, y + height * 0.5, 0], true);
    segment.rotation.y = index * 0.035;
    ellipse(root, `MEDICAL__M2__INNER_FLUID_VOLUME_${index + 1}`, [diameter * 0.82, diameter * 0.6], height * 0.9, index < 2 ? materials.darkGlass : materials.frostedGlass, [0.35 - index * 0.06, y + height * 0.5, 0]);
    y += height - 0.08;
  });
  box(root, 'MEDICAL__M2__VERTICAL_ANALYTIC_CLEFT', [0.82, 11.8, 0.7], materials.darkGlass, [-2.25, 7.0, 1.65]);
  box(root, 'MEDICAL__M2__LUMINOUS_INNER_SPINE', [0.34, 11.2, 0.3], materials.rubyLight, [-2.23, 7.05, 1.7]);
  for (let channel = 0; channel < 18; channel += 1) {
    const angle = (channel / 18) * Math.PI * 2;
    pipe(root, `MEDICAL__M2__CAPILLARY_CHANNEL_${channel + 1}`, new THREE.Vector3(Math.cos(angle) * 2.2, 1.8, Math.sin(angle) * 1.7), new THREE.Vector3(Math.cos(angle + 0.28) * 1.8, 12.8, Math.sin(angle + 0.28) * 1.35), 0.025, channel % 4 === 0 ? materials.rubyLight : materials.titanium);
  }
  torus(root, 'MEDICAL__M2__SUSPENDED_OBSERVATION_RING', 2.7, 0.22, materials.darkGlass, [0, 13.2, 0], [Math.PI / 2, 0, 0]);
  for (let fin = 0; fin < 24; fin += 1) {
    const angle = (fin / 24) * Math.PI * 2;
    const finMesh = box(root, `MEDICAL__M2__FRAGMENTED_CROWN_FIN_${fin + 1}`, [0.09, 1.65, 0.35], materials.paleSteel, [Math.cos(angle) * 2.75, 14.4 + (fin % 3) * 0.08, Math.sin(angle) * 2.75]);
    finMesh.rotation.y = -angle;
    finMesh.rotation.z = Math.sin(angle) * 0.17;
  }
  for (let pulse = 0; pulse < 8; pulse += 1) {
    const marker = ellipsoid(root, `MEDICAL__M2__ASCENDING_BIOMARKER_PULSE_${pulse + 1}`, [0.12, 0.12, 0.12], pulse % 3 ? materials.cyanLight : materials.rubyLight, [1.4 + (pulse % 2) * 0.38, 2.1 + pulse * 1.2, -1.1]);
    marker.userData.animate = 'medical-rising-pulse';
    marker.userData.baseY = 2.1;
    marker.userData.travel = 10.8;
    marker.userData.phase = pulse / 8;
    marker.userData.speed = 0.09 + (pulse % 3) * 0.012;
  }
}

function addVitrivivarium(root: THREE.Group, materials: MedicalMaterials) {
  ellipse(root, 'MEDICAL__M3__RECESSED_COLONY_COURT', [24.2, 16.2], 0.07, materials.lightPaving, [0, FLOOR_Y - 0.02, 0]);
  const modules = [
    [-4.2, -1.6, 5.0, 4.0, 2.8], [0.2, -1.1, 5.6, 4.5, 3.2], [4.7, -1.3, 4.7, 3.8, 2.6],
    [-7.4, 1.5, 5.7, 3.5, 2.3], [-2.7, 2.2, 4.5, 4.0, 3.0], [2.0, 2.2, 4.2, 3.8, 2.7],
    [6.7, 2.2, 6.0, 3.5, 2.4], [-7.9, -3.8, 5.5, 3.2, 2.2], [-2.7, -4.2, 4.2, 3.5, 2.5],
    [2.0, -4.3, 4.4, 3.3, 2.35], [7.0, -4.0, 5.8, 3.1, 2.2], [9.1, -0.5, 5.2, 3.0, 2.0],
  ] as const;
  modules.forEach(([x, z, width, depth, height], index) => {
    ellipse(root, `MEDICAL__M3__LENS_MODULE_${index + 1}`, [width, depth], height, index % 3 === 0 ? materials.membrane : materials.frostedGlass, [x, height * 0.5 + 0.08, z], true);
    ellipsoid(root, `MEDICAL__M3__CONCAVE_DOME_GLOW_${index + 1}`, [width * 0.46, 0.34, depth * 0.46], index % 4 === 0 ? materials.amberLight : materials.opalGlass, [x, height + 0.12, z]);
    const ribCount = 8;
    for (let rib = 0; rib < ribCount; rib += 1) {
      const angle = (rib / ribCount) * Math.PI * 2;
      pipe(root, `MEDICAL__M3__WHITE_PROTECTIVE_RIB_${index + 1}_${rib + 1}`, new THREE.Vector3(x + Math.cos(angle) * width * 0.48, 0.1, z + Math.sin(angle) * depth * 0.48), new THREE.Vector3(x + Math.cos(angle) * width * 0.42, height + 0.15, z + Math.sin(angle) * depth * 0.42), 0.035, materials.boneCeramic);
    }
  });
  [[-5.1, -0.1, 0.2, -0.6, 2.0], [-1.3, 0.1, 3.0, 0.4, 2.5], [3.3, 0.4, 7.2, 0.2, 2.1], [-4.5, -2.9, -0.2, -3.2, 1.7]].forEach(([x1, z1, x2, z2, y], index) => {
    pipe(root, `MEDICAL__M3__TUBULAR_INTERMODULE_BRIDGE_${index + 1}`, new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z2), 0.24, materials.clearGlass);
    pipe(root, `MEDICAL__M3__BRIDGE_WHITE_SPINE_${index + 1}`, new THREE.Vector3(x1, y + 0.25, z1), new THREE.Vector3(x2, y + 0.25, z2), 0.045, materials.boneCeramic);
  });
  for (let tower = 0; tower < 4; tower += 1) {
    const x = -5.6 + tower * 3.7;
    const z = tower % 2 ? 0.2 : 0.8;
    const height = 4.8 + tower * 0.35;
    cylinder(root, `MEDICAL__M3__ENVIRONMENTAL_CONTROL_TOWER_${tower + 1}`, 0.9 + tower * 0.08, height, materials.titanium, [x, height * 0.5, z], true, 12);
    const ring = torus(root, `MEDICAL__M3__SLOW_ENVIRONMENT_RING_${tower + 1}`, 0.72 + tower * 0.06, 0.06, tower === 3 ? materials.cyanLight : materials.paleSteel, [x, height * 0.66, z], [Math.PI / 2, 0, 0]);
    ring.userData.animate = 'medical-slow-orbit';
    ring.userData.speed = 0.018 + tower * 0.004;
  }
  torus(root, 'MEDICAL__M3__DISTRICT_VISIBLE_TRANSLUCENT_HALO', 2.2, 0.12, materials.opalGlass, [5.5, 6.2, 0.25], [Math.PI / 2, 0, 0]);
  box(root, 'MEDICAL__M3__SUSPENDED_PIPETTE_ENTRANCE_CANOPY', [8.4, 0.28, 1.15], materials.clearGlass, [0, 2.0, -6.0]);
  ellipse(root, 'MEDICAL__M3__MICROPLATE_STILL_POOL', [7.2, 3.2], 0.05, materials.blackWater, [0, FLOOR_Y + 0.03, -6.2]);
  for (let well = 0; well < 8; well += 1) {
    cylinder(root, `MEDICAL__M3__POOL_WELL_PLATFORM_${well + 1}`, 0.32, 0.07, materials.boneCeramic, [-2.5 + (well % 4) * 1.65, FLOOR_Y + 0.07, -6.6 + Math.floor(well / 4) * 0.9], false, 24);
  }
}

function addEditorium(root: THREE.Group, materials: MedicalMaterials) {
  box(root, 'MEDICAL__M4__DIAGONAL_EDIT_GAP_PLAZA', [15.0, 0.06, 12.0], materials.lightPaving, [0, FLOOR_Y, 0]);
  const blocks = [
    [-3.4, -2.3, 5.6, 4.5, 8.8, -0.07], [3.2, -2.5, 5.1, 4.2, 7.4, 0.08],
    [-3.0, 2.5, 5.0, 4.1, 7.0, 0.05], [3.6, 2.4, 5.7, 4.4, 7.8, -0.06],
  ] as const;
  blocks.forEach(([x, z, width, depth, height, lean], index) => {
    const base = box(root, `MEDICAL__M4__BLACK_CHAMFERED_PLINTH_${index + 1}`, [width, 2.7, depth], materials.polishedBasalt, [x, 1.4, z], true);
    base.rotation.y = Math.PI * 0.04;
    const upper = box(root, `MEDICAL__M4__PALE_CRYSTALLINE_BLOCK_${index + 1}`, [width * 0.86, height - 2.6, depth * 0.82], index % 2 ? materials.opalGlass : materials.boneCeramic, [x + lean * 6, 2.7 + (height - 2.6) * 0.5, z], true);
    upper.rotation.z = lean;
    upper.rotation.y = Math.PI * 0.04;
    for (let slit = 0; slit < 5; slit += 1) {
      box(root, `MEDICAL__M4__RECESSED_WINDOW_SLIT_${index + 1}_${slit + 1}`, [0.14, 1.2, 0.08], materials.darkGlass, [x - width * 0.28 + slit * width * 0.14, 1.42, z + depth * 0.505]);
    }
  });
  const bridgeHeights = [3.4, 5.25, 7.0];
  bridgeHeights.forEach((height, index) => {
    const bridge = box(root, `MEDICAL__M4__EDIT_REPAIR_BRIDGE_${index + 1}`, [6.6, 0.28, 0.95], index === 2 ? materials.clearGlass : materials.paleSteel, [0.2, height, 0]);
    bridge.rotation.y = Math.PI * (0.16 + index * 0.04);
    box(root, `MEDICAL__M4__WARM_METALLIC_BRIDGE_UNDERSIDE_${index + 1}`, [6.4, 0.04, 0.78], materials.amberLight, [0.2, height - 0.17, 0]).rotation.y = bridge.rotation.y;
  });
  const codeMaterials = [materials.cyanLight, materials.violetLight, materials.amberLight, materials.rubyLight];
  for (let band = 0; band < 4; band += 1) {
    const light = box(root, `MEDICAL__M4__FOUR_BASE_CODE_BAND_${band + 1}`, [0.12, 8.0, 0.1], codeMaterials[band].clone(), [-0.72 + band * 0.48, 4.1, 0.1]);
    light.userData.animate = 'medical-emissive-pulse';
    light.userData.phase = band * 1.15;
    light.userData.minIntensity = 0.8;
    light.userData.maxIntensity = 4.2;
    light.userData.speed = 0.28;
  }
  box(root, 'MEDICAL__M4__FOLDED_CLINICAL_CANOPY', [5.4, 0.22, 2.0], materials.membrane, [-4.7, 1.25, 5.0]).rotation.z = -0.06;
  for (let tower = 0; tower < 6; tower += 1) {
    const x = -4.2 + (tower % 3) * 4.2;
    const z = tower < 3 ? -3.3 : 3.3;
    cylinder(root, `MEDICAL__M4__PERFORATED_TECHNICAL_TOWER_${tower + 1}`, 0.72, 1.65 + (tower % 2) * 0.35, materials.paleSteel, [x, 8.55, z], false, 12);
  }
}

function addImmunis(root: THREE.Group, materials: MedicalMaterials) {
  cylinder(root, 'MEDICAL__M5__DRY_MOAT_BLACK_STONE', 17.0, 0.12, materials.basalt, [0, FLOOR_Y, 0], false, 24);
  cylinder(root, 'MEDICAL__M5__INNER_CITADEL_COURT', 14.7, 0.14, materials.lightPaving, [0, FLOOR_Y + 0.02, 0], false, 24);
  for (let wing = 0; wing < 8; wing += 1) {
    const angle = (wing / 8) * Math.PI * 2;
    const height = 4.5 + (wing % 3) * 0.45;
    const plate = box(root, `MEDICAL__M5__OVERLAPPING_PROTECTIVE_PLATE_${wing + 1}`, [5.0, height, 1.25], wing % 2 ? materials.titanium : materials.boneCeramic, [Math.cos(angle) * 5.65, height * 0.5 + 0.1, Math.sin(angle) * 5.65], true);
    plate.rotation.y = -angle;
    plate.rotation.z = Math.sin(angle) * 0.04;
    for (let panel = 0; panel < 6; panel += 1) {
      const hex = cylinder(root, `MEDICAL__M5__ADAPTIVE_HEX_PANEL_${wing + 1}_${panel + 1}`, 0.34, 0.06, panel % 3 === 0 ? materials.cyanLight.clone() : materials.paleSteel, [Math.cos(angle) * 6.31 + Math.cos(angle + Math.PI / 2) * (-1.4 + panel * 0.56), 1.1 + (panel % 2) * 0.72, Math.sin(angle) * 6.31 + Math.sin(angle + Math.PI / 2) * (-1.4 + panel * 0.56)], false, 12);
      hex.rotation.z = Math.PI / 2;
      hex.rotation.y = -angle;
      if (panel % 3 === 0) {
        hex.userData.animate = 'medical-emissive-pulse';
        hex.userData.phase = wing * 0.65 + panel * 0.3;
        hex.userData.minIntensity = 0.2;
        hex.userData.maxIntensity = 3.8;
        hex.userData.speed = 0.22;
      }
    }
  }
  cylinder(root, 'MEDICAL__M5__PROTECTED_LIVING_MEDICINE_LANTERN', 4.6, 7.0, materials.opalGlass, [0, 3.55, 0], true, 24);
  for (let rib = 0; rib < 14; rib += 1) {
    const angle = (rib / 14) * Math.PI * 2;
    pipe(root, `MEDICAL__M5__LANTERN_VERTICAL_RIB_${rib + 1}`, new THREE.Vector3(Math.cos(angle) * 2.28, 0.2, Math.sin(angle) * 2.28), new THREE.Vector3(Math.cos(angle) * 2.28, 7.0, Math.sin(angle) * 2.28), 0.035, rib % 4 === 0 ? materials.darkGlass : materials.titanium);
  }
  cylinder(root, 'MEDICAL__M5__FLOATING_LANTERN_ROOF', 5.5, 0.22, materials.paleSteel, [0, 7.45, 0], false, 24);
  [[-4.6, 7.5], [4.6, 7.5]].forEach(([x, z], index) => {
    const points = [new THREE.Vector3(x, FLOOR_Y + 0.03, z + 3.0), new THREE.Vector3(x * 0.72, 0.36, z + 1.3), new THREE.Vector3(x * 0.38, 0.72, z - 0.1)];
    addLocalRibbon(root, `MEDICAL__M5__CONVERGING_CLINICAL_RAMP_${index + 1}`, points, 1.8, materials.lightPaving);
  });
  pipe(root, 'MEDICAL__M5__Y_CANOPY_BRANCH_LEFT', new THREE.Vector3(0, 3.2, 4.6), new THREE.Vector3(-3.3, 2.2, 7.2), 0.16, materials.boneCeramic);
  pipe(root, 'MEDICAL__M5__Y_CANOPY_BRANCH_RIGHT', new THREE.Vector3(0, 3.2, 4.6), new THREE.Vector3(3.3, 2.2, 7.2), 0.16, materials.boneCeramic);
  pipe(root, 'MEDICAL__M5__Y_CANOPY_STEM', new THREE.Vector3(0, 1.0, 3.7), new THREE.Vector3(0, 3.2, 4.6), 0.18, materials.boneCeramic);
  for (let tower = 0; tower < 3; tower += 1) {
    cylinder(root, `MEDICAL__M5__CRYOGENIC_RECEIVING_TOWER_${tower + 1}`, 0.9, 2.6, materials.titanium, [-5.8 + tower * 1.2, 1.32, -6.5], true, 12);
    cylinder(root, `MEDICAL__M5__VERTICALLY_DOCKED_CELL_CAPSULE_${tower + 1}`, 0.42, 1.5, tower === 1 ? materials.rubyLight : materials.clearGlass, [-5.8 + tower * 1.2, 1.55, -6.5], false, 12);
  }
}

function addAstra(root: THREE.Group, materials: MedicalMaterials) {
  const base = box(root, 'MEDICAL__M6__MASSIVE_SHIELDED_BASE', [18.5, 3.6, 11.5], materials.polishedBasalt, [0, 1.84, 0], true);
  base.scale.x = 18.5;
  box(root, 'MEDICAL__M6__PALE_CLINICAL_FRONTAGE', [8.6, 1.45, 0.45], materials.boneCeramic, [-3.2, 1.25, 5.68]);
  for (let fin = 0; fin < 13; fin += 1) {
    box(root, `MEDICAL__M6__SPECTROMETER_BRONZE_FIN_${fin + 1}`, [0.18, 2.6 + (fin % 4) * 0.22, 0.55], materials.bronze, [-7.8 + fin * 1.28, 1.45, 5.98]);
  }
  cylinder(root, 'MEDICAL__M6__TWELVE_FACET_ISOTOPE_LANTERN', 5.0, 7.7, materials.opalGlass, [1.6, 5.05, 0], true, 12);
  for (let seam = 0; seam < 12; seam += 1) {
    const angle = (seam / 12) * Math.PI * 2;
    pipe(root, `MEDICAL__M6__LANTERN_METALLIC_SEAM_${seam + 1}`, new THREE.Vector3(1.6 + Math.cos(angle) * 2.48, 1.3, Math.sin(angle) * 2.48), new THREE.Vector3(1.6 + Math.cos(angle) * 1.7, 8.9, Math.sin(angle) * 1.7), 0.035, materials.titanium);
  }
  const ring = torus(root, 'MEDICAL__M6__SUSPENDED_DIAGNOSTIC_RING', 3.6, 0.18, materials.violetLight, [1.6, 6.7, 0], [Math.PI / 2, 0, 0]);
  ring.userData.animate = 'medical-slow-orbit';
  ring.userData.speed = 0.026;
  for (let support = 0; support < 4; support += 1) {
    const angle = (support / 4) * Math.PI * 2;
    pipe(root, `MEDICAL__M6__NEAR_INVISIBLE_RING_TRUSS_${support + 1}`, new THREE.Vector3(1.6 + Math.cos(angle) * 2.0, 5.2, Math.sin(angle) * 2.0), new THREE.Vector3(1.6 + Math.cos(angle) * 3.5, 6.7, Math.sin(angle) * 3.5), 0.025, materials.clearGlass);
  }
  ellipse(root, 'MEDICAL__M6__PATIENT_REFLECTING_POOL', [10.5, 2.1], 0.05, materials.blackWater, [-3.3, FLOOR_Y + 0.02, 7.2]);
  box(root, 'MEDICAL__M6__LOW_PATIENT_CANOPY', [6.6, 0.2, 2.25], materials.membrane, [-3.2, 1.4, 5.9]);
  for (let gate = 0; gate < 2; gate += 1) {
    box(root, `MEDICAL__M6__SEQUENTIAL_ISOTOPE_GATE_${gate + 1}`, [3.1, 2.0, 0.16], materials.titanium, [4.8, 1.0, -6.2 - gate * 1.0]);
  }
  for (let stack = 0; stack < 5; stack += 1) {
    cylinder(root, `MEDICAL__M6__BRONZE_FILTER_STACK_${stack + 1}`, 0.65, 1.65 + (stack % 2) * 0.4, materials.bronze, [-5.2 + stack * 2.2, 4.45, -2.8], false, 12);
    torus(root, `MEDICAL__M6__FILTER_SAFETY_BAND_${stack + 1}`, 0.34, 0.045, stack % 2 ? materials.amberLight : materials.violetLight, [-5.2 + stack * 2.2, 5.05, -2.8], [Math.PI / 2, 0, 0]);
  }
}

function addRegenera(root: THREE.Group, materials: MedicalMaterials) {
  box(root, 'MEDICAL__M7__LONGITUDINAL_BIOFABRICATION_HALL', [25.0, 4.2, 11.0], materials.boneCeramic, [0, 2.12, 0], true);
  for (let ridge = 0; ridge < 7; ridge += 1) {
    const roof = box(root, `MEDICAL__M7__STEPPED_SAWTOOTH_RIDGE_${ridge + 1}`, [3.35, 0.34, 10.6], ridge % 2 ? materials.frostedGlass : materials.membrane, [-10.2 + ridge * 3.4, 4.45 + ridge * 0.16, 0]);
    roof.rotation.z = -0.16;
  }
  const spine = box(root, 'MEDICAL__M7__EXTERNAL_SERVICE_SPINE', [23.8, 1.2, 1.3], materials.titanium, [0, 3.35, -6.2]);
  spine.userData.navObstacle = false;
  for (let tower = 0; tower < 6; tower += 1) {
    const diameter = 1.25 + tower * 0.12;
    const height = 5.0 + tower * 0.26;
    cylinder(root, `MEDICAL__M7__TRANSLUCENT_BIOFABRICATION_TOWER_${tower + 1}`, diameter, height, materials.membrane, [-9.6 + tower * 3.85, height * 0.5, -7.2], true, 24);
    for (let level = 0; level < 3; level += 1) {
      const band = torus(root, `MEDICAL__M7__LAYER_PRINT_RING_${tower + 1}_${level + 1}`, diameter * 0.54, 0.055, level === 1 ? materials.cyanLight.clone() : materials.titanium, [-9.6 + tower * 3.85, 1.1 + level * 1.3, -7.2], [Math.PI / 2, 0, 0]);
      if (level === 1) {
        band.userData.animate = 'medical-vertical-scan';
        band.userData.baseY = 0.8;
        band.userData.travel = height - 1.2;
        band.userData.phase = tower / 6;
        band.userData.speed = 0.07;
      }
    }
  }
  for (let gantry = 0; gantry < 2; gantry += 1) {
    const x = -6.5 + gantry * 13.0;
    for (const side of [-1, 1]) box(root, `MEDICAL__M7__GANTRY_${gantry + 1}_LEG_${side < 0 ? 'L' : 'R'}`, [0.35, 5.6, 0.35], materials.paleSteel, [x, 2.8, side * 7.0]);
    box(root, `MEDICAL__M7__OVERHEAD_ROBOTIC_GANTRY_${gantry + 1}`, [0.5, 0.42, 14.2], materials.paleSteel, [x, 5.55, 0]);
  }
  box(root, 'MEDICAL__M7__GROWTH_PLATE_ENTRANCE_CANOPY', [8.8, 0.28, 2.4], materials.membrane, [0, 1.5, 6.2]);
  for (let branch = 0; branch < 7; branch += 1) {
    const start = new THREE.Vector3(0, FLOOR_Y + 0.03, 6.4);
    const end = new THREE.Vector3((branch - 3) * 1.4, FLOOR_Y + 0.03, 10.0 + Math.abs(branch - 3) * 0.35);
    pipe(root, `MEDICAL__M7__VASCULAR_PLANTING_BRANCH_${branch + 1}`, start, end, 0.07, branch % 2 ? materials.silverPlant : materials.cyanLight);
  }
}

function addConcordia(root: THREE.Group, materials: MedicalMaterials) {
  ringShape(root, 'MEDICAL__M8__OUTER_CIVIC_ELLIPSE', [10.2, 8.1], [8.8, 6.7], materials.clearGlass, [0, FLOOR_Y + 0.04, 0]);
  ringShape(root, 'MEDICAL__M8__MIDDLE_CONTAINMENT_RING', [7.9, 6.0], [6.25, 4.45], materials.opalGlass, [0, FLOOR_Y + 0.07, 0]);
  for (let column = 0; column < 28; column += 1) {
    const angle = (column / 28) * Math.PI * 2;
    pipe(root, `MEDICAL__M8__OUTER_RING_WHITE_COLUMN_${column + 1}`, new THREE.Vector3(Math.cos(angle) * 9.45, 0.1, Math.sin(angle) * 7.35), new THREE.Vector3(Math.cos(angle) * 9.45, 2.2, Math.sin(angle) * 7.35), 0.045, materials.boneCeramic);
  }
  for (let rib = 0; rib < 32; rib += 1) {
    const angle = (rib / 32) * Math.PI * 2;
    pipe(root, `MEDICAL__M8__MIDDLE_TITANIUM_RIB_${rib + 1}`, new THREE.Vector3(Math.cos(angle) * 7.3, 0.1, Math.sin(angle) * 5.35), new THREE.Vector3(Math.cos(angle) * 7.3, 4.0, Math.sin(angle) * 5.35), 0.035, materials.titanium);
  }
  ellipsoid(root, 'MEDICAL__M8__ASYMMETRIC_PROTECTED_CORE', [5.8, 7.7, 4.2], materials.boneCeramic, [0.6, 3.7, -0.2], true);
  for (let scale = 0; scale < 36; scale += 1) {
    const angle = (scale / 36) * Math.PI * 2;
    const y = 0.8 + (scale % 6) * 0.85;
    const radiusT = Math.sqrt(Math.max(0.05, 1 - ((y - 3.3) / 4.1) ** 2));
    const tile = box(root, `MEDICAL__M8__OVERLAPPING_CERAMIC_SCALE_${scale + 1}`, [0.65, 0.32, 0.12], scale % 5 === 0 ? materials.paleSteel : materials.paleCeramic, [0.6 + Math.cos(angle) * 2.9 * radiusT, y, -0.2 + Math.sin(angle) * 2.1 * radiusT]);
    tile.rotation.y = -angle;
  }
  torus(root, 'MEDICAL__M8__CONTINUOUS_SENSOR_BELT', 3.3, 0.12, materials.cyanLight, [0.6, 3.7, -0.2], [Math.PI / 2, 0, 0]);
  torus(root, 'MEDICAL__M8__APEX_OPEN_RING', 0.9, 0.13, materials.basalt, [0.6, 7.65, -0.2], [Math.PI / 2, 0, 0]);
  for (let gateway = 0; gateway < 4; gateway += 1) {
    const angle = (gateway / 4) * Math.PI * 2;
    box(root, `MEDICAL__M8__BROAD_RING_GATEWAY_${gateway + 1}`, gateway % 2 ? [2.6, 2.4, 0.18] : [0.18, 2.4, 2.6], materials.clearGlass, [Math.cos(angle) * 9.5, 1.2, Math.sin(angle) * 7.35]);
  }
  ellipse(root, 'MEDICAL__M8__DONOR_WATER_BASIN', [4.8, 1.5], 0.05, materials.blackWater, [-3.0, FLOOR_Y + 0.03, 9.2]);
  ellipse(root, 'MEDICAL__M8__RECIPIENT_WATER_BASIN', [4.8, 1.5], 0.05, materials.blackWater, [3.0, FLOOR_Y + 0.03, 9.2]);
  box(root, 'MEDICAL__M8__JOINING_ILLUMINATED_CHANNEL', [6.2, 0.03, 0.12], materials.cyanLight, [0, FLOOR_Y + 0.055, 9.2]);
  for (let wall = 0; wall < 5; wall += 1) {
    box(root, `MEDICAL__M8__TRANSLUCENT_WIND_LAYER_${wall + 1}`, [0.16, 1.8, 3.0], materials.frostedGlass, [-11.4 + wall * 5.7, 0.9, -7.8 + (wall % 2) * 1.0]).rotation.y = wall * 0.18;
  }
}

function addAegisPhagica(root: THREE.Group, materials: MedicalMaterials) {
  box(root, 'MEDICAL__M9__SUSPENDED_DIAGNOSTIC_BRIDGE', [17.5, 2.8, 5.2], materials.boneCeramic, [0, 4.4, 0], true);
  const pylonXs = [-7.1, 0, 7.1];
  pylonXs.forEach((x, index) => {
    const height = 6.0 - Math.abs(index - 1) * 0.35;
    box(root, `MEDICAL__M9__DARK_ARCHIVE_PYLON_${index + 1}`, [2.55, height, 5.7], materials.basalt, [x, height * 0.5, 0], true);
    for (let buttress = 0; buttress < 3; buttress += 1) {
      const support = box(root, `MEDICAL__M9__PHAGE_GEOMETRY_BUTTRESS_${index + 1}_${buttress + 1}`, [0.42, 3.1, 0.42], materials.polishedBasalt, [x - 0.85 + buttress * 0.85, 1.45, 3.55]);
      support.rotation.x = -0.22 + buttress * 0.22;
    }
    for (let panel = 0; panel < 16; panel += 1) {
      box(root, `MEDICAL__M9__ARCHIVED_STRAIN_PANEL_${index + 1}_${panel + 1}`, [0.24, 0.26, 0.05], panel % 5 === 0 ? materials.whiteLight.clone() : materials.paleSteel, [x - 0.8 + (panel % 4) * 0.53, 0.8 + Math.floor(panel / 4) * 0.82, 2.88]);
    }
  });
  for (let slot = 0; slot < 22; slot += 1) {
    box(root, `MEDICAL__M9__BARCODE_GLAZING_SLOT_${slot + 1}`, [0.12, 1.65 + (slot % 3) * 0.2, 0.08], materials.darkGlass, [-6.0 + slot * 0.58, 4.42, 2.63]);
  }
  const sweep = box(root, 'MEDICAL__M9__REFERENCE_RETRIEVAL_SWEEP', [2.2, 0.06, 0.12], materials.cyanLight.clone(), [-7.0, 4.55, 2.72]);
  sweep.userData.animate = 'medical-horizontal-scan';
  sweep.userData.baseX = -7.0;
  sweep.userData.travel = 14.0;
  sweep.userData.speed = 0.08;
  for (let bay = 0; bay < 6; bay += 1) {
    box(root, `MEDICAL__M9__RAPID_RESPONSE_LAUNCH_BAY_${bay + 1}`, [1.65, 1.15, 1.8], materials.darkGlass, [-6.8 + bay * 2.7, 0.62, -4.0], true);
    const canopy = box(root, `MEDICAL__M9__POLYGONAL_LAUNCH_CANOPY_${bay + 1}`, [1.9, 0.15, 2.1], materials.titanium, [-6.8 + bay * 2.7, 1.35, -4.0]);
    canopy.rotation.z = bay % 2 ? 0.08 : -0.08;
  }
  for (let line = 0; line < 5; line += 1) {
    const route = box(root, `MEDICAL__M9__DRAINED_FORECOURT_LINE_${line + 1}`, [14.5, 0.02, 0.05], materials.whiteLight, [0, FLOOR_Y + 0.04, 4.7 + line * 0.5]);
    route.rotation.y = -0.08 + line * 0.04;
  }
}

function addClinicaSimulacra(root: THREE.Group, materials: MedicalMaterials) {
  cylinder(root, 'MEDICAL__M10__CIRCULAR_SIX_LEVEL_PODIUM', 14.8, 2.6, materials.polishedBasalt, [0, 1.32, 0], true, 48);
  torus(root, 'MEDICAL__M10__CONTINUOUS_MODEL_STATE_RIBBON', 7.45, 0.14, materials.violetLight, [0, 1.55, 0], [Math.PI / 2, 0, 0]);
  cylinder(root, 'MEDICAL__M10__OPEN_CIRCULAR_COURT', 5.2, 2.68, materials.darkGlass, [0, 1.34, 0], false, 48);
  const west = box(root, 'MEDICAL__M10__WESTERN_MECHANISTIC_TOWER', [5.4, 10.0, 5.6], materials.boneCeramic, [-3.8, 7.55, 0], true);
  west.rotation.z = -0.018;
  const east = box(root, 'MEDICAL__M10__EASTERN_ADAPTIVE_DATA_TOWER', [4.6, 11.0, 5.0], materials.darkGlass, [3.6, 8.05, 0.25], true);
  east.rotation.z = 0.018;
  for (let band = 0; band < 10; band += 1) {
    box(root, `MEDICAL__M10__MECHANISTIC_SHADOW_BAND_${band + 1}`, [5.55, 0.13, 0.08], band % 3 === 0 ? materials.cyanLight.clone() : materials.titanium, [-3.8, 3.2 + band * 0.86, 2.84]);
  }
  for (let node = 0; node < 38; node += 1) {
    const x = 1.7 + (node % 6) * 0.76;
    const y = 3.25 + Math.floor(node / 6) * 1.25;
    const point = ellipsoid(root, `MEDICAL__M10__ADAPTIVE_DATA_NODE_${node + 1}`, [0.08, 0.08, 0.05], node % 7 === 0 ? materials.violetLight.clone() : materials.paleSteel, [x, y, 2.81]);
    if (node % 7 === 0) {
      point.userData.animate = 'medical-emissive-pulse';
      point.userData.phase = node * 0.24;
      point.userData.minIntensity = 0.3;
      point.userData.maxIntensity = 3.8;
      point.userData.speed = 0.18;
    }
  }
  const bridgeHeights = [5.0, 8.0, 11.0];
  bridgeHeights.forEach((height, index) => {
    const bridge = box(root, `MEDICAL__M10__ABSTRACTION_SKYBRIDGE_${index + 1}`, [5.0, 0.42, 1.15], index === 0 ? materials.boneCeramic : index === 1 ? materials.frostedGlass : materials.clearGlass, [0, height, 0]);
    bridge.rotation.y = -0.08 + index * 0.08;
    const pulse = box(root, `MEDICAL__M10__BRIDGE_MODEL_PULSE_${index + 1}`, [0.8, 0.055, 0.08], materials.whiteLight.clone(), [-1.7, height - 0.24, 0.58]);
    pulse.userData.animate = 'medical-horizontal-scan';
    pulse.userData.baseX = -1.7;
    pulse.userData.travel = 3.4;
    pulse.userData.phase = index / 3;
    pulse.userData.speed = 0.11;
  });
  const halo = torus(root, 'MEDICAL__M10__COMPUTATIONAL_CROWN_HALO', 6.6, 0.24, materials.whiteLight, [0, 14.3, 0], [Math.PI / 2, 0, 0]);
  halo.scale.z = 0.68;
  for (let support = 0; support < 6; support += 1) {
    const angle = (support / 6) * Math.PI * 2;
    pipe(root, `MEDICAL__M10__CROWN_DIAGONAL_SUPPORT_${support + 1}`, new THREE.Vector3(Math.cos(angle) * 3.5, 12.8, Math.sin(angle) * 2.4), new THREE.Vector3(Math.cos(angle) * 6.3, 14.3, Math.sin(angle) * 4.2), 0.055, materials.paleSteel);
  }
  box(root, 'MEDICAL__M10__BIOANALYTICS_DATA_CONDUIT', [10.0, 0.24, 0.32], materials.clearGlass, [8.5, 9.2, 0.25]);
}

function createBuilding(record: MedicalLabsBuildingProgram, materials: MedicalMaterials) {
  const root = new THREE.Group();
  root.name = `MEDICAL__${record.code}__${record.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  root.userData = {
    selectableId: DISTRICT_ID,
    individualSelectableId: `${DISTRICT_ID}__${record.code.toLowerCase()}`,
    districtId: DISTRICT_ID,
    exteriorProgram: true,
    medicalLabsBuilding: true,
    buildingCode: record.code,
    displayName: record.name,
    purpose: record.purpose,
    placementZone: record.placementZone,
    maturity: record.maturity,
    footprintMetres: [...record.footprintMetres],
    heightMetres: record.heightMetres,
    featureRole: 'building',
    featureTag: record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  };
  switch (record.form) {
    case 'pathology': addAtlasPathologica(root, materials); break;
    case 'hemolumen': addHemolumen(root, materials); break;
    case 'vitrivivarium': addVitrivivarium(root, materials); break;
    case 'editorium': addEditorium(root, materials); break;
    case 'immunis': addImmunis(root, materials); break;
    case 'astra': addAstra(root, materials); break;
    case 'regenera': addRegenera(root, materials); break;
    case 'concordia': addConcordia(root, materials); break;
    case 'aegis': addAegisPhagica(root, materials); break;
    case 'simulacra': addClinicaSimulacra(root, materials); break;
  }
  root.traverse((object) => {
    object.userData.selectableId = DISTRICT_ID;
    object.userData.districtId = DISTRICT_ID;
  });
  return root;
}

function pointInDistrict(
  definition: DistrictDefinition,
  radialT: number,
  angularT: number,
  y = FLOOR_Y,
) {
  const sector = definition.sector!;
  const radialMargin = 5.2;
  const angularMargin = (sector.endAngle - sector.startAngle) * 0.055;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT);
  const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
  return new THREE.Vector3(
    Math.cos(angle) * radius - definition.position[0],
    y,
    Math.sin(angle) * radius - definition.position[2],
  );
}

function arcPoints(
  definition: DistrictDefinition,
  radialT: number,
  startT: number,
  endT: number,
  count: number,
  y = FLOOR_Y,
) {
  return Array.from({ length: count }, (_, index) => (
    pointInDistrict(definition, radialT, THREE.MathUtils.lerp(startT, endT, index / (count - 1)), y)
  ));
}

function addDistrictInfrastructure(
  district: THREE.Group,
  definition: DistrictDefinition,
  materials: MedicalMaterials,
) {
  const infrastructure = new THREE.Group();
  infrastructure.name = 'MEDICAL__ANATOMICAL_CRESCENT_INFRASTRUCTURE';
  const diagnosticCrescent = arcPoints(definition, 0.26, 0.035, 0.965, 86);
  const specimenVein = arcPoints(definition, 0.90, 0.06, 0.94, 74);
  addLocalRibbon(infrastructure, 'MEDICAL__DIAGNOSTIC_CRESCENT', diagnosticCrescent, 1.35, materials.paving);
  addLocalRibbon(infrastructure, 'MEDICAL__DIAGNOSTIC_CRESCENT_CYAN_VEIN', diagnosticCrescent.map((point) => point.clone().setY(FLOOR_Y + 0.015)), 0.055, materials.cyanLight, false);
  const restrictedVein = addLocalRibbon(infrastructure, 'MEDICAL__RESTRICTED_SPECIMEN_VEIN', specimenVein, 0.94, materials.polishedBasalt, false);
  restrictedVein.userData.restrictedAutonomousRoute = true;
  addLocalRibbon(infrastructure, 'MEDICAL__SPECIMEN_VEIN_RUBY_CODE', specimenVein.map((point) => point.clone().setY(FLOOR_Y + 0.016)), 0.045, materials.rubyLight, false);

  const spineAngularT = 0.52;
  const spinePoints = Array.from({ length: 38 }, (_, index) => pointInDistrict(definition, THREE.MathUtils.lerp(0.02, 0.96, index / 37), spineAngularT));
  addLocalRibbon(infrastructure, 'MEDICAL__THERAPEUTIC_SPINE', spinePoints, 1.55, materials.paving);
  addLocalRibbon(infrastructure, 'MEDICAL__THERAPEUTIC_SPINE_VIOLET_LINE', spinePoints.map((point) => point.clone().setY(FLOOR_Y + 0.016)), 0.065, materials.violetLight, false);

  [0.16, 0.31, 0.71, 0.86].forEach((angularT, index) => {
    const points = Array.from({ length: 26 }, (_, pointIndex) => pointInDistrict(definition, THREE.MathUtils.lerp(0.18, 0.91, pointIndex / 25), angularT));
    addLocalRibbon(infrastructure, `MEDICAL__CLINICAL_SERVICE_ROUTE_${index + 1}`, points, index === 1 ? 0.82 : 0.7, materials.lightPaving);
  });

  for (let capsule = 0; capsule < 10; capsule += 1) {
    const point = pointInDistrict(definition, 0.90, 0.09 + capsule * 0.085, 0.24);
    const carrier = ellipsoid(infrastructure, `MEDICAL__SEALED_SPECIMEN_CAPSULE_${capsule + 1}`, [0.42, 0.22, 0.18], capsule % 3 === 0 ? materials.rubyLight : materials.paleSteel, [point.x, point.y, point.z]);
    carrier.userData.chainOfCustody = true;
  }
  district.add(infrastructure);
  return infrastructure;
}

function addDistrictLandscape(
  district: THREE.Group,
  definition: DistrictDefinition,
  materials: MedicalMaterials,
) {
  const landscape = new THREE.Group();
  landscape.name = 'MEDICAL__DIAGNOSTIC_LANDSCAPE';
  for (let tree = 0; tree < 28; tree += 1) {
    const radialT = tree % 2 ? 0.36 : 0.63;
    const angularT = 0.055 + tree / 31;
    const point = pointInDistrict(definition, radialT, angularT, 0);
    cylinder(landscape, `MEDICAL__LOW_WHITE_TREE_BED_${tree + 1}`, 1.1, 0.18, materials.basalt, [point.x, 0.09, point.z], false, 24);
    cylinder(landscape, `MEDICAL__LOW_WHITE_TREE_TRUNK_${tree + 1}`, 0.1, 0.9, materials.paleSteel, [point.x, 0.48, point.z], false, 12);
    ellipsoid(landscape, `MEDICAL__LOW_WHITE_TREE_CANOPY_${tree + 1}`, [0.72, 0.42, 0.72], materials.silverPlant, [point.x, 1.0, point.z]);
  }
  for (let marker = 0; marker < 20; marker += 1) {
    const point = pointInDistrict(definition, marker % 2 ? 0.25 : 0.89, 0.06 + marker / 22, 0);
    cylinder(landscape, `MEDICAL__DIAGNOSTIC_LIGHT_NEEDLE_${marker + 1}`, 0.1, 0.72, materials.titanium, [point.x, 0.36, point.z], false, 12);
    ellipsoid(landscape, `MEDICAL__DIAGNOSTIC_LIGHT_APERTURE_${marker + 1}`, [0.12, 0.12, 0.12], marker % 4 === 0 ? materials.rubyLight : materials.cyanLight, [point.x, 0.78, point.z]);
  }
  district.add(landscape);
  return landscape;
}

export function buildMedicalLabsDistrict(
  district: THREE.Group,
  definition: DistrictDefinition,
) {
  if (!definition.sector) throw new Error('Medical Labs District requires a masterplan sector');
  const materials = createMedicalMaterials();
  const infrastructure = addDistrictInfrastructure(district, definition, materials);
  const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = MEDICAL_LABS_BUILDING_PROGRAM.map((record) => {
    const building = createBuilding(record, materials);
    const position = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y + 0.02);
    building.position.copy(position);
    const worldPosition = position.clone().add(new THREE.Vector3(definition.position[0], 0, definition.position[2]));
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
  district.userData.medicalLabsDistrict = {
    identity: 'The Anatomical Crescent',
    progression: ['disease observation', 'molecular diagnosis', 'experimental treatment', 'protected clinical translation'],
    architecturalLanguage: 'a diagnostic instrument enlarged to urban scale',
    buildingCount: facilities.length,
    buildings: MEDICAL_LABS_BUILDING_PROGRAM.map((record) => ({
      code: record.code,
      name: record.name,
      purpose: record.purpose,
      placementZone: record.placementZone,
      heightMetres: record.heightMetres,
      maturity: record.maturity,
    })),
    skyline: ['Vitrivivarium', 'Atlas Pathologica', 'Editorium Genomicum', 'Immunis Bastion', 'Hemolumen Spire', 'Clinica Simulacra'],
    roads: {
      publicArc: 'MEDICAL__DIAGNOSTIC_CRESCENT',
      radialBoulevard: 'MEDICAL__THERAPEUTIC_SPINE',
      restrictedLogistics: 'MEDICAL__RESTRICTED_SPECIMEN_VEIN',
      clinicalServiceRouteCount: 4,
      publicAndSpecimenTrafficSeparated: true,
    },
    materials: [
      'bone-white sintered ceramic',
      'frosted low-iron glass',
      'satin titanium and pale stainless steel',
      'black volcanic stone',
      'opalescent electrochromic glazing',
      'translucent membrane roofs',
    ],
    lighting: ['ruby', 'amber', 'violet', 'cold cyan'],
    landscape: {
      lowWhiteTrees: 28,
      diagnosticLightNeedles: 20,
      genericHospitalSymbols: 0,
      redCrosses: 0,
    },
    exteriorOnly: true,
    recommendedInteriorSequence: ['Atlas Pathologica', 'Editorium Genomicum', 'Immunis Bastion'],
  };
  district.userData.population = {
    plannedFacilities: MEDICAL_LABS_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: [
      'Diagnostic Crescent',
      'Therapeutic Spine',
      'Specimen Vein',
      'autonomous sample capsules',
      'diagnostic contour plazas',
      'white-tree landscape',
    ],
    realizedFeatureTags: MEDICAL_LABS_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 7,
    radialCoverage: 0.96,
    angularCoverage: 0.93,
    exteriorOnly: true,
    anatomicalCrescent: true,
  };
}
