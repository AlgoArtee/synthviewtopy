import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type SecurityBuildingForm =
  | 'gate'
  | 'command'
  | 'sentinel'
  | 'blackglass'
  | 'forum'
  | 'response'
  | 'aviary'
  | 'robotics'
  | 'mobility'
  | 'clean-gate'
  | 'vault'
  | 'bureau'
  | 'proving'
  | 'court'
  | 'forge';

export interface SecurityBuildingProgram {
  code: string;
  name: string;
  purpose: string;
  form: SecurityBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
}

export const SECURITY_BUILDING_PROGRAM: readonly SecurityBuildingProgram[] = [
  {
    code: 'S1',
    name: 'Porta Aegis',
    purpose: 'Internal Security Gate and Credentialing Hall',
    form: 'gate',
    footprintMetres: [170, 65],
    heightMetres: 19,
    radialT: 0.09,
    angularT: 0.49,
    placementZone: 'Central civic-security core',
  },
  {
    code: 'S2',
    name: 'Praesidium Nexus',
    purpose: 'Security District Command Headquarters',
    form: 'command',
    footprintMetres: [115, 105],
    heightMetres: 54,
    radialT: 0.34,
    angularT: 0.48,
    placementZone: 'Central civic-security core',
  },
  {
    code: 'S3',
    name: 'Sentinel Crown',
    purpose: 'Island Surveillance and Sensor-Fusion Tower',
    form: 'sentinel',
    footprintMetres: [70, 55],
    heightMetres: 132,
    radialT: 0.84,
    angularT: 0.12,
    placementZone: 'Eastern perimeter and Tundra route',
  },
  {
    code: 'S4',
    name: 'Scutum Blackglass',
    purpose: 'Active Cyberdefense Operations Centre',
    form: 'blackglass',
    footprintMetres: [100, 80],
    heightMetres: 24,
    radialT: 0.51,
    angularT: 0.89,
    placementZone: 'Forensics and cyberforensics interface',
  },
  {
    code: 'S5',
    name: 'Forum Meridian',
    purpose: 'Crisis Coordination and Emergency Assembly Centre',
    form: 'forum',
    footprintMetres: [84, 68],
    heightMetres: 19,
    radialT: 0.33,
    angularT: 0.63,
    placementZone: 'Central civic-security core',
  },
  {
    code: 'S6',
    name: 'Celeritas Response Arc',
    purpose: 'Rapid Response, Rescue, and Deployment Station',
    form: 'response',
    footprintMetres: [185, 60],
    heightMetres: 28,
    radialT: 0.55,
    angularT: 0.42,
    placementZone: 'Operational belt',
  },
  {
    code: 'S7',
    name: 'Strix Aviary',
    purpose: 'Autonomous Aerial Patrol and Drone Operations Tower',
    form: 'aviary',
    footprintMetres: [46, 46],
    heightMetres: 60,
    radialT: 0.71,
    angularT: 0.27,
    placementZone: 'Eastern perimeter and Tundra route',
  },
  {
    code: 'S8',
    name: 'Cerberus Yard',
    purpose: 'Autonomous Ground Patrol and Robotic Security Hangar',
    form: 'robotics',
    footprintMetres: [150, 110],
    heightMetres: 24,
    radialT: 0.72,
    angularT: 0.52,
    placementZone: 'Operational belt',
  },
  {
    code: 'S9',
    name: 'Via Custos',
    purpose: 'Protective Mobility and Secure Convoy Depot',
    form: 'mobility',
    footprintMetres: [120, 55],
    heightMetres: 30,
    radialT: 0.50,
    angularT: 0.72,
    placementZone: 'Operational belt',
  },
  {
    code: 'S10',
    name: 'Janus Clean Gate',
    purpose: 'Biosecurity Inspection and Decontamination Complex',
    form: 'clean-gate',
    footprintMetres: [155, 45],
    heightMetres: 20,
    radialT: 0.28,
    angularT: 0.15,
    placementZone: 'Secret Labs and bio-science interface',
  },
  {
    code: 'S11',
    name: 'Custodia Vault',
    purpose: 'Evidence and Chain-of-Custody Repository',
    form: 'vault',
    footprintMetres: [95, 70],
    heightMetres: 17,
    radialT: 0.73,
    angularT: 0.88,
    placementZone: 'Forensics and cyberforensics interface',
  },
  {
    code: 'S12',
    name: 'Silentium Bureau',
    purpose: 'Protective Intelligence and Threat Assessment Centre',
    form: 'bureau',
    footprintMetres: [90, 60],
    heightMetres: 27,
    radialT: 0.39,
    angularT: 0.25,
    placementZone: 'Secret Labs and bio-science interface',
  },
  {
    code: 'S13',
    name: 'Aegis Proving Hall',
    purpose: 'Security Training and Environmental Simulation Complex',
    form: 'proving',
    footprintMetres: [210, 160],
    heightMetres: 35,
    radialT: 0.80,
    angularT: 0.68,
    placementZone: 'Operational belt',
  },
  {
    code: 'S14',
    name: 'Concordia Court',
    purpose: 'Temporary Custody, Interview, and Security Mediation Centre',
    form: 'court',
    footprintMetres: [78, 78],
    heightMetres: 23,
    radialT: 0.38,
    angularT: 0.83,
    placementZone: 'Forensics and cyberforensics interface',
  },
  {
    code: 'S15',
    name: 'Limes Forge',
    purpose: 'Perimeter Systems Fabrication and Maintenance Facility',
    form: 'forge',
    footprintMetres: [180, 70],
    heightMetres: 31,
    radialT: 0.91,
    angularT: 0.46,
    placementZone: 'Eastern coastal perimeter',
  },
] as const;

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const UNIT_TRIANGLE = new THREE.CylinderGeometry(0.5, 0.5, 1, 3);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const FLOOR_Y = 0.036;

type SecurityMaterials = ReturnType<typeof createSecurityMaterials>;

function securityMaterial(
  name: string,
  color: THREE.ColorRepresentation,
  options: THREE.MeshStandardMaterialParameters = {},
) {
  const material = new THREE.MeshStandardMaterial({
    name,
    color,
    roughness: 0.72,
    metalness: 0.12,
    ...options,
  });
  return material;
}

function createSecurityMaterials() {
  const frostWhite = securityMaterial('Aegis frost-white ceramic composite', '#e7edeb', {
    roughness: 0.58,
    metalness: 0.04,
  });
  const paleCeramic = securityMaterial('Aegis pale ceramic armor', '#cbd7d6', {
    roughness: 0.62,
    metalness: 0.06,
  });
  const basalt = securityMaterial('Aegis charcoal basalt-fibre concrete', '#151c20', {
    roughness: 0.9,
    metalness: 0.02,
  });
  const deepBasalt = securityMaterial('Aegis polished black basalt', '#080d10', {
    roughness: 0.5,
    metalness: 0.12,
  });
  const titanium = securityMaterial('Aegis brushed marine-grade titanium', '#8b9ba0', {
    roughness: 0.38,
    metalness: 0.82,
  });
  const darkTitanium = securityMaterial('Aegis dark titanium', '#35444a', {
    roughness: 0.45,
    metalness: 0.7,
  });
  const glass = securityMaterial('Aegis smoked electrochromic glass', '#163e49', {
    emissive: '#143b48',
    emissiveIntensity: 0.38,
    roughness: 0.18,
    metalness: 0.12,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  const clearGlass = securityMaterial('Aegis clear structural glass', '#75bec8', {
    emissive: '#4b9eae',
    emissiveIntensity: 0.24,
    roughness: 0.08,
    metalness: 0.04,
    transparent: true,
    opacity: 0.46,
    side: THREE.DoubleSide,
  });
  const blackGlass = securityMaterial('Scutum black glass composite', '#05090d', {
    roughness: 0.14,
    metalness: 0.46,
  });
  const paving = securityMaterial('Aegis dark stone paving', '#20292c', {
    roughness: 0.96,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });
  const plaza = securityMaterial('Aegis civic basalt paving', '#333d3f', {
    roughness: 0.9,
    metalness: 0.03,
  });
  const blueLight = securityMaterial('Aegis normal-state pale blue light', '#b8f0ff', {
    emissive: '#79dfff',
    emissiveIntensity: 3.2,
    roughness: 0.2,
    metalness: 0.05,
  });
  const amberLight = securityMaterial('Aegis emergency amber light', '#ffb547', {
    emissive: '#ff9d28',
    emissiveIntensity: 3.5,
    roughness: 0.24,
    metalness: 0.05,
  });
  const turquoiseLight = securityMaterial('Janus clinical turquoise light', '#a8ffff', {
    emissive: '#62e7e4',
    emissiveIntensity: 2.7,
    roughness: 0.2,
  });
  const water = securityMaterial('Aegis black reflecting water', '#07171b', {
    emissive: '#123641',
    emissiveIntensity: 0.18,
    roughness: 0.06,
    metalness: 0.22,
    transparent: true,
    opacity: 0.82,
  });
  const moss = securityMaterial('Aegis dark moss roof', '#26392f', {
    roughness: 1,
    metalness: 0,
  });
  const grass = securityMaterial('Aegis silver coastal grass', '#9aaba5', {
    roughness: 0.96,
    metalness: 0.02,
  });
  const warmStone = securityMaterial('Concordia warm-grey stone composite', '#adaea8', {
    roughness: 0.88,
    metalness: 0.02,
  });
  [blueLight, amberLight, turquoiseLight].forEach((material) => {
    material.userData.isDistrictAccent = true;
  });
  return {
    frostWhite,
    paleCeramic,
    basalt,
    deepBasalt,
    titanium,
    darkTitanium,
    glass,
    clearGlass,
    blackGlass,
    paving,
    plaza,
    blueLight,
    amberLight,
    turquoiseLight,
    water,
    moss,
    grass,
    warmStone,
  };
}

function prepare<T extends THREE.Object3D>(object: T, name: string, obstacle = false) {
  object.name = name;
  object.userData.selectableId = 'security';
  object.userData.districtId = 'security';
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
  mesh.scale.set(size[0], size[1], size[2]);
  mesh.position.set(position[0], position[1], position[2]);
  parent.add(mesh);
  return mesh;
}

function cylinder(
  parent: THREE.Object3D,
  name: string,
  radius: number,
  height: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  segments = 24,
  obstacle = false,
) {
  const geometry = segments === 3
    ? UNIT_TRIANGLE
    : segments <= 12
      ? UNIT_CYLINDER_12
      : UNIT_CYLINDER_24;
  const mesh = prepare(new THREE.Mesh(geometry, material), name, obstacle);
  mesh.scale.set(radius * 2, height, radius * 2);
  mesh.position.set(position[0], position[1], position[2]);
  parent.add(mesh);
  return mesh;
}

function ellipse(
  parent: THREE.Object3D,
  name: string,
  radii: readonly [number, number],
  height: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  obstacle = false,
) {
  const mesh = cylinder(parent, name, 0.5, height, material, position, 24, obstacle);
  mesh.scale.set(radii[0] * 2, height, radii[1] * 2);
  return mesh;
}

function torus(
  parent: THREE.Object3D,
  name: string,
  radius: number,
  tube: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = [0, 0, 0],
) {
  const mesh = prepare(new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 6, 24),
    material,
  ), name, false);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  parent.add(mesh);
  return mesh;
}

function beam(
  parent: THREE.Object3D,
  name: string,
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  material: THREE.Material,
) {
  const direction = to.clone().sub(from);
  const mesh = prepare(new THREE.Mesh(UNIT_CYLINDER_12, material), name, false);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.scale.set(radius * 2, direction.length(), radius * 2);
  mesh.quaternion.setFromUnitVectors(UNIT_Y, direction.normalize());
  parent.add(mesh);
  return mesh;
}

function wedgeGeometry(width: number, height: number, depth: number, rearHeight = 0.2) {
  const hw = width * 0.5;
  const hd = depth * 0.5;
  const y0 = 0;
  const y1 = height;
  const yr = Math.min(height, rearHeight);
  const positions = new Float32Array([
    -hw, y0, -hd, hw, y0, -hd, hw, y0, hd, -hw, y0, hd,
    -hw, yr, -hd, hw, yr, -hd, hw, y1, hd, -hw, y1, hd,
  ]);
  const indices = [
    0, 2, 1, 0, 3, 2,
    4, 5, 6, 4, 6, 7,
    0, 1, 5, 0, 5, 4,
    3, 7, 6, 3, 6, 2,
    0, 4, 7, 0, 7, 3,
    1, 2, 6, 1, 6, 5,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addVerticalFins(
  parent: THREE.Object3D,
  prefix: string,
  count: number,
  width: number,
  facadeY: number,
  facadeZ: number,
  height: number,
  material: THREE.Material,
  depth = 0.16,
) {
  for (let index = 0; index < count; index += 1) {
    const t = count <= 1 ? 0.5 : index / (count - 1);
    const fin = box(
      parent,
      `${prefix}__FACADE_FIN_${index + 1}`,
      [0.075, height, depth],
      material,
      [(t - 0.5) * width, facadeY, facadeZ],
      false,
    );
    fin.rotation.y = (t - 0.5) * 0.34;
  }
}

function addPortaAegis(parent: THREE.Group, materials: SecurityMaterials) {
  const width = 17;
  const depth = 6.5;
  const wingWidth = 6.1;
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.name = `SECURITY__S1__${side < 0 ? 'WEST' : 'EAST'}_CURVED_WING`;
    wing.position.x = side * 5.35;
    wing.rotation.y = side * -0.09;
    box(wing, `${wing.name}__BASALT_BASE`, [wingWidth, 0.22, depth], materials.deepBasalt, [0, 0.11, 0], true);
    box(wing, `${wing.name}__GLASS_HALL`, [wingWidth, 1.36, depth * 0.86], materials.glass, [0, 0.9, 0], true);
    box(wing, `${wing.name}__CERAMIC_ARMOR`, [wingWidth * 1.02, 0.46, depth * 0.93], materials.frostWhite, [0, 1.72, -0.04], false);
    addVerticalFins(wing, wing.name, 9, wingWidth * 0.88, 0.9, depth * 0.45, 1.38, materials.titanium, 0.13);
    parent.add(wing);
  }
  const roof = box(parent, 'SECURITY__S1__ELEVATED_SHIELD_ROOF', [17.8, 0.28, 7.2], materials.frostWhite, [0, 2.08, -0.08]);
  roof.rotation.z = 0.018;
  box(parent, 'SECURITY__S1__CENTRAL_LUMINOUS_RIDGE', [5.3, 0.09, 0.12], materials.blueLight, [0, 2.3, 0]);
  box(parent, 'SECURITY__S1__PORTAL_CEILING', [4.3, 0.16, 6.7], materials.titanium, [0, 1.76, 0]);
  for (let lane = 0; lane < 6; lane += 1) {
    const x = -1.72 + lane * 0.69;
    box(parent, `SECURITY__S1__PORTAL_LANE_${lane + 1}`, [0.035, 0.025, 7.8], materials.blueLight, [x, FLOOR_Y + 0.03, 0]);
    for (const z of [-1.7, 0, 1.7]) {
      box(parent, `SECURITY__S1__RETRACTABLE_PYLON_${lane + 1}_${z}`, [0.12, 0.48, 0.12], materials.darkTitanium, [x + 0.28, 0.24, z]);
    }
  }
  for (let arch = 0; arch < 3; arch += 1) {
    const z = -1.9 + arch * 1.9;
    box(parent, `SECURITY__S1__INSPECTION_ARCH_${arch + 1}_TOP`, [4.15, 0.09, 0.11], materials.titanium, [0, 1.42, z]);
    for (const x of [-2.02, 2.02]) {
      box(parent, `SECURITY__S1__INSPECTION_ARCH_${arch + 1}_SIDE_${x}`, [0.09, 1.38, 0.11], materials.titanium, [x, 0.72, z]);
    }
  }
  for (const x of [-7.7, 7.7]) {
    box(parent, `SECURITY__S1__IDENTITY_PYLON_${x}`, [0.34, 1.55, 0.34], materials.deepBasalt, [x, 0.78, 3.9], true);
    box(parent, `SECURITY__S1__IDENTITY_DISPLAY_${x}`, [0.22, 0.72, 0.03], materials.blueLight, [x, 0.92, 4.08]);
  }
}

function addPraesidiumNexus(parent: THREE.Group, materials: SecurityMaterials) {
  const plates = [
    { radius: 5.7, y: 0.62, h: 1.15, scaleZ: 0.9, rotation: 0 },
    { radius: 4.8, y: 1.72, h: 1.12, scaleZ: 0.88, rotation: 0.11 },
    { radius: 4.0, y: 2.86, h: 1.15, scaleZ: 0.86, rotation: -0.08 },
  ];
  plates.forEach((plate, index) => {
    const shell = cylinder(
      parent,
      `SECURITY__S2__ELLIPTICAL_SHIELD_PLATE_${index + 1}`,
      plate.radius,
      plate.h,
      index === 0 ? materials.basalt : index === 1 ? materials.glass : materials.paleCeramic,
      [0, plate.y, 0],
      24,
      index === 0,
    );
    shell.scale.z *= plate.scaleZ;
    shell.rotation.y = plate.rotation;
    const rim = cylinder(
      parent,
      `SECURITY__S2__TITANIUM_PLATE_RIM_${index + 1}`,
      plate.radius * 1.025,
      0.08,
      materials.titanium,
      [0, plate.y + plate.h * 0.51, 0],
    );
    rim.scale.z *= plate.scaleZ;
    rim.rotation.y = plate.rotation;
  });
  [Math.PI * 0.08, Math.PI * 0.78, Math.PI * 1.36].forEach((angle, index) => {
    const wing = box(
      parent,
      `SECURITY__S2__RADIAL_COMMAND_WING_${index + 1}`,
      [2.8, 0.82, 5.5],
      index === 1 ? materials.paleCeramic : materials.basalt,
      [Math.sin(angle) * 3.4, 0.47, Math.cos(angle) * 3.4],
      true,
    );
    wing.rotation.y = angle;
  });
  box(parent, 'SECURITY__S2__HOVERING_ENTRANCE_CANTILEVER', [5.2, 0.19, 2.5], materials.frostWhite, [0, 1.22, 5.1]);
  box(parent, 'SECURITY__S2__VERTICAL_ENTRANCE_CUT', [0.42, 2.7, 0.08], materials.blueLight, [0, 1.72, 5.64]);
  const lantern = cylinder(parent, 'SECURITY__S2__COMMAND_LANTERN', 0.72, 1.2, materials.clearGlass, [0, 4.08, 0], 12);
  lantern.rotation.y = Math.PI / 4;
  torus(parent, 'SECURITY__S2__LANTERN_AMBER_EMERGENCY_RING', 0.78, 0.055, materials.amberLight, [0, 4.63, 0], [Math.PI / 2, 0, 0]);
}

function addSentinelCrown(parent: THREE.Group, materials: SecurityMaterials) {
  ellipse(parent, 'SECURITY__S3__LANDSCAPED_BERM', [3.6, 2.8], 0.52, materials.moss, [0, 0.26, 0], true);
  const base = cylinder(parent, 'SECURITY__S3__TRIANGULAR_BASE', 2.35, 1.25, materials.deepBasalt, [0, 0.78, 0], 3, true);
  base.rotation.y = Math.PI / 6;
  const lower = cylinder(parent, 'SECURITY__S3__LOWER_TRIANGULAR_SHAFT', 1.42, 4.1, materials.basalt, [0, 3.35, 0], 3, false);
  lower.rotation.y = Math.PI / 6;
  const waist = cylinder(parent, 'SECURITY__S3__NARROW_SENSOR_WAIST', 0.82, 3.7, materials.blackGlass, [0, 7.2, 0], 3, false);
  waist.rotation.y = Math.PI / 6;
  const upper = cylinder(parent, 'SECURITY__S3__EXPANDED_CROWN_SHAFT', 1.2, 2.1, materials.darkTitanium, [0, 10.05, 0], 3, false);
  upper.rotation.y = Math.PI / 6;
  [10.72, 11.2, 11.67].forEach((y, index) => {
    cylinder(
      parent,
      `SECURITY__S3__CROWN_SENSOR_RING_${index + 1}`,
      1.72 - index * 0.12,
      index === 1 ? 0.16 : 0.34,
      index === 1 ? materials.titanium : materials.glass,
      [0, y, 0],
      24,
    );
  });
  for (let corner = 0; corner < 3; corner += 1) {
    const angle = Math.PI / 6 + corner * Math.PI * 2 / 3;
    box(
      parent,
      `SECURITY__S3__PALE_TITANIUM_EDGE_${corner + 1}`,
      [0.07, 9.8, 0.07],
      materials.blueLight,
      [Math.cos(angle) * 1.05, 6.15, Math.sin(angle) * 1.05],
    );
  }
  box(parent, 'SECURITY__S3__SENSOR_MAST', [0.12, 2.2, 0.12], materials.titanium, [0, 13.0, 0]);
  for (let balcony = 0; balcony < 3; balcony += 1) {
    const angle = balcony * Math.PI * 2 / 3;
    box(
      parent,
      `SECURITY__S3__DRONE_BALCONY_${balcony + 1}`,
      [0.72, 0.08, 0.36],
      materials.darkTitanium,
      [Math.sin(angle) * 1.65, 10.45, Math.cos(angle) * 1.65],
    ).rotation.y = angle;
  }
}

function addScutumBlackglass(parent: THREE.Group, materials: SecurityMaterials) {
  const planes = [
    { x: -2.65, z: 0.1, w: 4.6, d: 7.5, h: 2.25, r: -0.1 },
    { x: 2.15, z: -0.05, w: 4.4, d: 7.8, h: 2.42, r: 0.13 },
    { x: 0.2, z: -2.6, w: 5.5, d: 2.6, h: 2.18, r: -0.04 },
  ];
  planes.forEach((plane, index) => {
    const mass = box(
      parent,
      `SECURITY__S4__FOLDED_BLACKGLASS_PLANE_${index + 1}`,
      [plane.w, plane.h, plane.d],
      materials.blackGlass,
      [plane.x, plane.h * 0.5, plane.z],
      true,
    );
    mass.rotation.y = plane.r;
    const joint = box(
      parent,
      `${mass.name}__SILVER_JOINT`,
      [plane.w * 0.82, 0.055, 0.055],
      materials.blueLight,
      [
        plane.x + Math.sin(plane.r) * (plane.d * 0.5 + 0.04),
        plane.h * 0.72,
        plane.z + Math.cos(plane.r) * (plane.d * 0.5 + 0.04),
      ],
    );
    joint.rotation.y = plane.r;
  });
  box(parent, 'SECURITY__S4__ENTRANCE_FISSURE', [0.2, 1.68, 0.08], materials.blueLight, [0, 0.86, 4.06]);
  box(parent, 'SECURITY__S4__PRECISION_ENTRY_BRIDGE', [1.4, 0.08, 3.1], materials.titanium, [0, 0.08, 5.48]);
  box(parent, 'SECURITY__S4__DRY_GLASS_GRAVEL_MOAT', [7.8, 0.06, 1.28], materials.deepBasalt, [0, 0.03, 4.55]);
  for (let point = 0; point < 18; point += 1) {
    const x = -3.5 + (point % 9) * 0.88;
    const z = 4.15 + Math.floor(point / 9) * 0.58;
    cylinder(parent, `SECURITY__S4__FIBRE_OPTIC_GRAVEL_POINT_${point + 1}`, 0.025, 0.025, materials.blueLight, [x, 0.08, z], 12);
  }
  box(parent, 'SECURITY__S4__ARMORED_DATA_SPINE', [5.4, 0.42, 0.52], materials.titanium, [4.7, 1.4, -2.2]);
}

function addForumMeridian(parent: THREE.Group, materials: SecurityMaterials) {
  const base = ellipse(parent, 'SECURITY__S5__TRANSPARENT_OVAL_BASE', [4.2, 3.4], 1.24, materials.clearGlass, [0, 0.65, 0], true);
  base.userData.navObstacle = true;
  for (let petal = 0; petal < 12; petal += 1) {
    const angle = petal * Math.PI / 6;
    const roofPetal = box(
      parent,
      `SECURITY__S5__CERAMIC_ROOF_PETAL_${petal + 1}`,
      [2.25, 0.18, 3.55],
      petal % 2 ? materials.paleCeramic : materials.frostWhite,
      [Math.sin(angle) * 1.78, 1.45 + (petal % 3) * 0.025, Math.cos(angle) * 1.42],
    );
    roofPetal.rotation.y = angle;
    roofPetal.rotation.x = 0.035;
  }
  cylinder(parent, 'SECURITY__S5__RAISED_COMMUNICATION_DRUM', 0.82, 0.95, materials.clearGlass, [0, 1.88, 0], 24);
  torus(parent, 'SECURITY__S5__COMMUNICATION_AMBER_RING', 0.88, 0.045, materials.amberLight, [0, 2.28, 0], [Math.PI / 2, 0, 0]);
  for (let entrance = 0; entrance < 4; entrance += 1) {
    const angle = entrance * Math.PI / 2;
    const canopy = box(
      parent,
      `SECURITY__S5__FUNCTIONAL_ENTRY_CANOPY_${entrance + 1}`,
      [1.55, 0.08, 1.35],
      entrance === 0 ? materials.amberLight : entrance === 1 ? materials.blueLight : entrance === 2 ? materials.turquoiseLight : materials.frostWhite,
      [Math.sin(angle) * 4.15, 1.08, Math.cos(angle) * 3.35],
    );
    canopy.rotation.y = angle;
  }
}

function addCeleritasResponseArc(parent: THREE.Group, materials: SecurityMaterials) {
  const segmentCount = 9;
  for (let segment = 0; segment < segmentCount; segment += 1) {
    const t = segment / (segmentCount - 1);
    const x = (t - 0.5) * 16.4;
    const z = Math.cos((t - 0.5) * Math.PI) * -1.25;
    const height = 1.85 + Math.sin(t * Math.PI) * 0.52;
    const shell = box(
      parent,
      `SECURITY__S6__CRESCENT_DEPLOYMENT_SEGMENT_${segment + 1}`,
      [2.05, height, 4.9],
      segment % 2 ? materials.paleCeramic : materials.frostWhite,
      [x, height * 0.5, z],
      true,
    );
    shell.rotation.y = (t - 0.5) * -0.23;
    const facadeBand = box(
      parent,
      `${shell.name}__BLACKGLASS_UPPER_BAND`,
      [1.82, 0.31, 0.08],
      materials.glass,
      [
        x + Math.sin(shell.rotation.y) * 2.5,
        height * 0.64,
        z + Math.cos(shell.rotation.y) * 2.5,
      ],
    );
    facadeBand.rotation.y = shell.rotation.y;
  }
  for (let portal = 0; portal < 14; portal += 1) {
    const t = portal / 13;
    const x = (t - 0.5) * 15.3;
    const z = 1.45 - Math.cos((t - 0.5) * Math.PI) * 1.05;
    box(parent, `SECURITY__S6__DEPLOYMENT_PORTAL_${portal + 1}`, [0.78, 0.82, 0.08], materials.darkTitanium, [x, 0.44, z + 1.15]);
    box(parent, `SECURITY__S6__PORTAL_LIGHT_${portal + 1}`, [0.035, 0.9, 0.035], materials.blueLight, [x - 0.44, 0.47, z + 1.2]);
  }
  box(parent, 'SECURITY__S6__CONTINUOUS_DEPLOYMENT_CANOPY', [17.6, 0.15, 1.2], materials.titanium, [0, 1.34, 3.0]);
  box(parent, 'SECURITY__S6__CENTRAL_DISPATCH_TOWER', [1.45, 2.8, 1.6], materials.darkTitanium, [0, 1.4, -0.9]);
  box(parent, 'SECURITY__S6__DISPATCH_LIGHT_SPINE', [0.09, 2.65, 0.08], materials.blueLight, [0, 1.45, 0.0]);
}

function addStrixAviary(parent: THREE.Group, materials: SecurityMaterials) {
  cylinder(parent, 'SECURITY__S7__DARK_RIBBED_BASE', 2.3, 1.7, materials.basalt, [0, 0.85, 0], 24, true);
  cylinder(parent, 'SECURITY__S7__DRONE_CELL_CORE', 1.82, 3.45, materials.blackGlass, [0, 3.25, 0], 24, false);
  for (let ring = 0; ring < 5; ring += 1) {
    const y = 2.0 + ring * 0.72;
    for (let cell = 0; cell < 12; cell += 1) {
      const angle = cell * Math.PI / 6 + (ring % 2) * Math.PI / 12;
      const active = (ring * 5 + cell) % 11 === 0;
      const shutter = box(
        parent,
        `SECURITY__S7__DRONE_CELL_${ring + 1}_${cell + 1}`,
        [0.44, 0.28, 0.06],
        active ? materials.blueLight : materials.darkTitanium,
        [Math.sin(angle) * 1.86, y, Math.cos(angle) * 1.86],
      );
      shutter.rotation.y = angle;
    }
  }
  for (let index = 0; index < 12; index += 1) {
    const a0 = index * Math.PI / 6;
    const a1 = a0 + Math.PI / 3;
    beam(
      parent,
      `SECURITY__S7__AVIARY_DIAGONAL_LATTICE_${index + 1}`,
      new THREE.Vector3(Math.sin(a0) * 2.22, 1.65, Math.cos(a0) * 2.22),
      new THREE.Vector3(Math.sin(a1) * 2.22, 5.15, Math.cos(a1) * 2.22),
      0.055,
      materials.titanium,
    );
  }
  torus(parent, 'SECURITY__S7__TITANIUM_ROOF_RING', 2.4, 0.14, materials.titanium, [0, 5.25, 0], [Math.PI / 2, 0, 0]);
  box(parent, 'SECURITY__S7__NAVIGATION_MAST', [0.11, 1.25, 0.11], materials.titanium, [0, 5.92, 0]);
}

function addCerberusYard(parent: THREE.Group, materials: SecurityMaterials) {
  const halls = [
    { name: 'SAWTOOTH', x: -4.75, z: -2.65, w: 5.3, d: 4.8, h: 1.82 },
    { name: 'ARCHED', x: 4.7, z: -2.6, w: 5.2, d: 4.9, h: 2.0 },
    { name: 'PLATED', x: 0, z: 3.65, w: 10.5, d: 3.1, h: 1.72 },
  ];
  halls.forEach((hall, hallIndex) => {
    box(parent, `SECURITY__S8__${hall.name}_HALL`, [hall.w, hall.h, hall.d], materials.basalt, [hall.x, hall.h * 0.5, hall.z], true);
    if (hallIndex === 0) {
      for (let tooth = 0; tooth < 6; tooth += 1) {
        const roof = box(parent, `SECURITY__S8__SAWTOOTH_ROOF_${tooth + 1}`, [0.82, 0.12, hall.d * 0.94], materials.blackGlass, [hall.x - 2.05 + tooth * 0.82, hall.h + 0.14, hall.z]);
        roof.rotation.z = 0.18;
      }
    } else if (hallIndex === 1) {
      for (let rib = 0; rib < 5; rib += 1) {
        torus(parent, `SECURITY__S8__ARCHED_ROOF_RIB_${rib + 1}`, hall.d * 0.46, 0.06, materials.titanium, [hall.x - 2 + rib, hall.h, hall.z], [0, Math.PI / 2, 0]);
      }
    } else {
      for (let plate = 0; plate < 6; plate += 1) {
        const roof = box(parent, `SECURITY__S8__OVERLAPPING_ROOF_PLATE_${plate + 1}`, [2.1, 0.13, 3.35], plate % 2 ? materials.paleCeramic : materials.titanium, [-4.4 + plate * 1.75, hall.h + 0.08, hall.z]);
        roof.rotation.z = (plate % 2 ? 1 : -1) * 0.035;
      }
    }
  });
  for (let portal = 0; portal < 22; portal += 1) {
    const row = portal < 11 ? -1 : 1;
    const local = portal % 11;
    box(
      parent,
      `SECURITY__S8__ROBOTIC_VEHICLE_PORTAL_${portal + 1}`,
      [0.72 + (portal % 4 === 0 ? 0.34 : 0), 0.7, 0.07],
      materials.darkTitanium,
      [-5 + local, 0.4, row < 0 ? -5.08 : 5.24],
    );
  }
  box(parent, 'SECURITY__S8__CENTRAL_TEST_YARD', [8.8, 0.035, 4.4], materials.paving, [0, FLOOR_Y, 0]);
  for (let rig = 0; rig < 8; rig += 1) {
    const x = -3.4 + (rig % 4) * 2.25;
    const z = -1.3 + Math.floor(rig / 4) * 2.55;
    const ramp = box(parent, `SECURITY__S8__CONFIGURABLE_TEST_RIG_${rig + 1}`, [1.15, 0.18 + (rig % 3) * 0.1, 0.72], rig % 2 ? materials.titanium : materials.deepBasalt, [x, 0.1, z]);
    ramp.rotation.x = (rig % 2 ? 1 : -1) * 0.09;
  }
  for (let arch = 0; arch < 4; arch += 1) {
    torus(parent, `SECURITY__S8__CHARGING_ARCH_${arch + 1}`, 0.9, 0.07, materials.titanium, [-3 + arch * 2, 0.45, 0], [0, Math.PI / 2, 0]);
  }
}

function addViaCustos(parent: THREE.Group, materials: SecurityMaterials) {
  const tiers = [
    { y: 0.48, w: 10.2, d: 4.2, h: 0.96 },
    { y: 1.4, w: 11.1, d: 4.7, h: 0.9 },
    { y: 2.31, w: 12, d: 5.2, h: 0.92 },
  ];
  tiers.forEach((tier, index) => {
    box(
      parent,
      `SECURITY__S9__STREAMLINED_WEDGE_TIER_${index + 1}`,
      [tier.w, tier.h, tier.d],
      index === 0 ? materials.basalt : index === 1 ? materials.darkTitanium : materials.titanium,
      [0, tier.y, 0],
      index === 0,
    );
  });
  for (let fin = 0; fin < 28; fin += 1) {
    const x = -5.65 + fin * 0.42;
    box(parent, `SECURITY__S9__PERFORATED_SCREEN_FIN_${fin + 1}`, [0.08, 1.88, 0.12], materials.paleCeramic, [x, 1.72, 2.66]);
  }
  box(parent, 'SECURITY__S9__RECESSED_ARRIVAL_CANTILEVER', [8.8, 0.18, 2.1], materials.frostWhite, [0, 2.03, 3.2]);
  for (let lane = 0; lane < 3; lane += 1) {
    box(parent, `SECURITY__S9__PROTECTED_TRANSFER_LANE_${lane + 1}`, [2.1, 0.035, 4.1], materials.paving, [-2.35 + lane * 2.35, FLOOR_Y, 4.1]);
    box(parent, `SECURITY__S9__TRANSFER_PLANTER_${lane + 1}`, [0.24, 0.34, 3.5], materials.deepBasalt, [-3.45 + lane * 2.35, 0.17, 4.1]);
  }
  torus(parent, 'SECURITY__S9__SCREENED_SPIRAL_RAMP', 1.55, 0.07, materials.blueLight, [-3.15, 1.42, 0], [Math.PI / 2, 0, 0]);
  box(parent, 'SECURITY__S9__SHARP_ROOF_VISOR', [12.8, 0.16, 6.0], materials.frostWhite, [0, 2.88, -0.15]);
}

function addJanusCleanGate(parent: THREE.Group, materials: SecurityMaterials) {
  for (const side of [-1, 1]) {
    box(parent, `SECURITY__S10__SEALED_CERAMIC_WING_${side < 0 ? 'WEST' : 'EAST'}`, [6.2, 1.72, 1.72], materials.frostWhite, [side * 4.02, 0.86, 0], true);
    box(parent, `SECURITY__S10__DARK_BASALT_DATUM_${side}`, [6.25, 0.18, 1.8], materials.basalt, [side * 4.02, 0.09, 0], true);
  }
  box(parent, 'SECURITY__S10__TRANSPARENT_CENTRAL_SPINE', [2.1, 1.64, 4.45], materials.clearGlass, [0, 0.88, 0], true);
  for (let brace = 0; brace < 5; brace += 1) {
    const x = -0.84 + brace * 0.42;
    const diagonal = box(parent, `SECURITY__S10__SPINE_TITANIUM_BRACE_${brace + 1}`, [0.055, 1.9, 0.06], materials.titanium, [x, 0.92, 2.28]);
    diagonal.rotation.z = brace % 2 ? 0.22 : -0.22;
  }
  for (let portal = 0; portal < 6; portal += 1) {
    const x = -5.0 + portal * 2;
    torus(parent, `SECURITY__S10__PEDESTRIAN_STATUS_PORTAL_${portal + 1}`, 0.48, 0.075, portal === 4 ? materials.amberLight : materials.turquoiseLight, [x, 0.62, 0.9]);
    box(parent, `SECURITY__S10__PORTAL_RECESS_${portal + 1}`, [0.78, 1.02, 0.08], materials.glass, [x, 0.58, 0.93]);
  }
  for (let tunnel = 0; tunnel < 3; tunnel += 1) {
    const x = 5.1 + tunnel * 1.32;
    torus(parent, `SECURITY__S10__VEHICLE_INSPECTION_ARCH_${tunnel + 1}`, 0.62, 0.11, materials.frostWhite, [x, 0.66, -1.22]);
  }
  for (let scrubber = 0; scrubber < 4; scrubber += 1) {
    const x = -4.8 + scrubber * 3.2;
    cylinder(parent, `SECURITY__S10__TRANSLUCENT_SCRUBBER_LANTERN_${scrubber + 1}`, 0.24, 1.0, materials.clearGlass, [x, 2.12, 0], 12);
  }
  for (const x of [-5.3, 5.3]) {
    box(parent, `SECURITY__S10__SEALED_GLASS_GARDEN_${x}`, [2.8, 1.1, 1.25], materials.clearGlass, [x, 0.57, -2.3]);
    box(parent, `SECURITY__S10__GARDEN_MOSS_BED_${x}`, [2.55, 0.12, 1.0], materials.moss, [x, 0.12, -2.3]);
  }
}

function addCustodiaVault(parent: THREE.Group, materials: SecurityMaterials) {
  const wedge = prepare(new THREE.Mesh(wedgeGeometry(9.5, 2.25, 7, 0.28), materials.deepBasalt), 'SECURITY__S11__EMERGING_BASALT_VAULT_WEDGE', true);
  wedge.position.z = -0.2;
  parent.add(wedge);
  const roof = prepare(new THREE.Mesh(wedgeGeometry(9.15, 2.34, 6.75, 0.34), materials.moss), 'SECURITY__S11__LANDSCAPED_SLOPED_ROOF');
  roof.position.set(0, 0.04, -0.28);
  roof.scale.set(0.98, 0.96, 0.98);
  parent.add(roof);
  box(parent, 'SECURITY__S11__MONUMENTAL_ENTRANCE_SEAM', [0.09, 1.82, 0.08], materials.titanium, [0.72, 1.12, 3.33]);
  for (let slot = 0; slot < 4; slot += 1) {
    box(parent, `SECURITY__S11__RECESSED_AMBER_SLOT_${slot + 1}`, [1.2 + slot * 0.28, 0.045, 0.06], materials.amberLight, [-2.6 + slot * 1.72, 0.58 + slot * 0.34, 3.38]);
  }
  box(parent, 'SECURITY__S11__BLACK_REFLECTING_POOL', [8.8, 0.06, 1.4], materials.water, [0, 0.03, 4.25]);
  torus(parent, 'SECURITY__S11__CUSTODY_LOOP_SCULPTURE_A', 0.72, 0.09, materials.titanium, [-0.45, 2.25, -0.35], [0, 0.45, 0]);
  torus(parent, 'SECURITY__S11__CUSTODY_LOOP_SCULPTURE_B', 0.72, 0.09, materials.titanium, [0.45, 2.25, -0.35], [0, -0.45, 0]);
}

function addSilentiumBureau(parent: THREE.Group, materials: SecurityMaterials) {
  box(parent, 'SECURITY__S12__LOWER_DIPLOMATIC_VOLUME', [7.8, 1.45, 5.35], materials.glass, [-0.55, 0.74, -0.25], true);
  box(parent, 'SECURITY__S12__UPPER_CANTILEVERED_VOLUME', [8.9, 1.25, 5.75], materials.paleCeramic, [0.42, 1.92, 0.15]);
  box(parent, 'SECURITY__S12__CENTRAL_GLAZED_CONNECTION', [1.2, 2.48, 5.95], materials.clearGlass, [0, 1.24, 0]);
  addVerticalFins(parent, 'SECURITY__S12', 36, 8.5, 1.42, 3.05, 2.52, materials.frostWhite, 0.12);
  box(parent, 'SECURITY__S12__SHALLOW_REFLECTING_POOL', [5.4, 0.06, 1.15], materials.water, [0, 0.03, 4.15]);
  box(parent, 'SECURITY__S12__NARROW_STONE_ENTRY_BRIDGE', [1.45, 0.08, 2.4], materials.warmStone, [0, 0.07, 4.02]);
  for (let sculpture = 0; sculpture < 5; sculpture += 1) {
    const x = -3.4 + sculpture * 1.7;
    beam(
      parent,
      `SECURITY__S12__NETWORK_SCULPTURE_${sculpture + 1}`,
      new THREE.Vector3(x, 0.12, -3.6),
      new THREE.Vector3(x + (sculpture % 2 ? 0.42 : -0.35), 1.02, -3.35),
      0.045,
      materials.titanium,
    );
  }
}

function addAegisProvingHall(parent: THREE.Group, materials: SecurityMaterials) {
  const blocks = [
    [-6.6, -4.2, 6.3, 5.4, 1.72, materials.glass],
    [0.1, -4.4, 6.2, 5.0, 2.05, materials.warmStone],
    [6.7, -3.7, 5.5, 6.0, 1.82, materials.darkTitanium],
    [-5.2, 3.6, 7.8, 5.2, 2.28, materials.paleCeramic],
    [3.7, 3.8, 9.0, 5.5, 1.65, materials.basalt],
  ] as const;
  blocks.forEach(([x, z, w, d, h, material], index) => {
    box(parent, `SECURITY__S13__RECONFIGURABLE_BLOCK_${index + 1}`, [w, h, d], material, [x, h * 0.5, z], true);
    for (let panel = 0; panel < 6; panel += 1) {
      box(
        parent,
        `SECURITY__S13__ROTATING_FACADE_PANEL_${index + 1}_${panel + 1}`,
        [w / 6 - 0.08, h * 0.72, 0.08],
        [materials.glass, materials.paleCeramic, materials.darkTitanium, materials.warmStone][(index + panel) % 4],
        [x - w * 0.5 + w / 12 + panel * w / 6, h * 0.48, z + d * 0.5 + 0.05],
      );
    }
  });
  box(parent, 'SECURITY__S13__UNIFYING_TITANIUM_ROOF_SPINE', [20.2, 0.24, 1.0], materials.titanium, [0, 2.48, 0]);
  const towerProfiles = [
    materials.glass,
    materials.warmStone,
    materials.darkTitanium,
    materials.paleCeramic,
    materials.titanium,
    materials.deepBasalt,
    materials.blackGlass,
  ];
  for (let tower = 0; tower < 7; tower += 1) {
    const x = -8.4 + tower * 2.8;
    const z = tower % 2 ? -1.1 : 1.1;
    const height = 2.5 + (tower % 4) * 0.42;
    const shaft = box(parent, `SECURITY__S13__TRAINING_TOWER_${tower + 1}`, [1.25, height, 1.45], towerProfiles[tower], [x, height * 0.5, z], true);
    shaft.rotation.y = (tower - 3) * 0.025;
  }
  box(parent, 'SECURITY__S13__ABSTRACT_URBAN_TRAINING_YARD', [17.4, 0.035, 3.0], materials.paving, [0, FLOOR_Y, 7.0]);
  for (let object = 0; object < 12; object += 1) {
    const x = -7.5 + (object % 6) * 3.0;
    const z = 6.1 + Math.floor(object / 6) * 1.55;
    box(parent, `SECURITY__S13__MOVABLE_STREET_OBJECT_${object + 1}`, [0.55 + (object % 3) * 0.28, 0.45 + (object % 4) * 0.22, 0.42], object % 2 ? materials.titanium : materials.warmStone, [x, 0.35, z]);
  }
}

function addConcordiaCourt(parent: THREE.Group, materials: SecurityMaterials) {
  const shell = box(parent, 'SECURITY__S14__ROTATED_WARM_STONE_SHELL', [7.8, 2.25, 7.8], materials.warmStone, [0, 1.12, 0], true);
  shell.rotation.y = Math.PI / 4;
  for (let face = 0; face < 4; face += 1) {
    const angle = face * Math.PI / 2 + Math.PI / 4;
    for (let fin = 0; fin < 8; fin += 1) {
      const tangent = (fin - 3.5) * 0.62;
      const x = Math.sin(angle) * 3.93 + Math.cos(angle) * tangent;
      const z = Math.cos(angle) * 3.93 - Math.sin(angle) * tangent;
      const blade = box(parent, `SECURITY__S14__DAYLIGHT_FIN_${face + 1}_${fin + 1}`, [0.1, 1.55, 0.36], materials.paleCeramic, [x, 1.12, z]);
      blade.rotation.y = angle;
    }
  }
  cylinder(parent, 'SECURITY__S14__CIRCULAR_ROOF_GARDEN', 2.82, 0.38, materials.moss, [0, 2.43, 0], 24);
  torus(parent, 'SECURITY__S14__TRANSPARENT_ACOUSTIC_SCREEN', 2.96, 0.06, materials.clearGlass, [0, 2.72, 0], [Math.PI / 2, 0, 0]);
  box(parent, 'SECURITY__S14__ENTRY_CANTILEVER', [3.0, 0.14, 2.2], materials.paleCeramic, [0, 1.55, 4.8]);
  box(parent, 'SECURITY__S14__QUIET_LINEAR_POOL', [5.3, 0.06, 1.0], materials.water, [0, 0.03, 5.2]);
  box(parent, 'SECURITY__S14__WIDE_STONE_BRIDGE', [1.8, 0.08, 1.7], materials.warmStone, [0, 0.08, 5.2]);
}

function addLimesForge(parent: THREE.Group, materials: SecurityMaterials) {
  const terraces = [
    { y: 0.58, w: 18, d: 7, h: 1.16 },
    { y: 1.52, w: 16.4, d: 6.2, h: 0.88 },
    { y: 2.3, w: 14.6, d: 5.3, h: 0.72 },
  ];
  terraces.forEach((terrace, index) => {
    box(
      parent,
      `SECURITY__S15__STEPPED_COASTAL_TERRACE_${index + 1}`,
      [terrace.w, terrace.h, terrace.d],
      index === 0 ? materials.deepBasalt : index === 1 ? materials.basalt : materials.darkTitanium,
      [0, terrace.y, -index * 0.28],
      index === 0,
    );
  });
  for (let buttress = 0; buttress < 9; buttress += 1) {
    const x = -8 + buttress * 2;
    box(parent, `SECURITY__S15__WAVE_BUTTRESS_${buttress + 1}`, [0.28, 2.55, 1.2], materials.darkTitanium, [x, 1.26, -3.35]);
  }
  for (let door = 0; door < 6; door += 1) {
    const x = -6.9 + door * 2.75;
    box(parent, `SECURITY__S15__PERIMETER_SYSTEMS_DOOR_${door + 1}`, [1.75, 1.24, 0.08], materials.paleCeramic, [x, 0.72, 3.56]);
    box(parent, `SECURITY__S15__DOOR_MAP_RELIEF_${door + 1}`, [1.2, 0.06, 0.03], materials.amberLight, [x, 0.86, 3.63]);
  }
  beam(
    parent,
    'SECURITY__S15__LANDWARD_MAINTENANCE_GANTRY',
    new THREE.Vector3(-8.6, 1.62, 4.02),
    new THREE.Vector3(8.6, 1.62, 4.02),
    0.1,
    materials.titanium,
  );
  box(parent, 'SECURITY__S15__PERIMETER_TEST_YARD', [16.8, 0.035, 3.8], materials.paving, [0, FLOOR_Y, 5.75]);
  for (let platform = 0; platform < 10; platform += 1) {
    const x = -7.2 + (platform % 5) * 3.6;
    const z = 4.85 + Math.floor(platform / 5) * 1.75;
    box(parent, `SECURITY__S15__NUMBERED_TEST_PLATFORM_${platform + 1}`, [1.25, 0.08, 1.0], materials.deepBasalt, [x, 0.08, z]);
    box(parent, `SECURITY__S15__PERIMETER_PROTOTYPE_${platform + 1}`, [0.14 + (platform % 3) * 0.08, 0.72 + (platform % 4) * 0.26, 0.14], platform % 2 ? materials.titanium : materials.amberLight, [x, 0.52, z]);
  }
}

function createBuilding(
  record: SecurityBuildingProgram,
  materials: SecurityMaterials,
) {
  const building = new THREE.Group();
  building.name = `SECURITY__${record.code}__${record.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  building.userData = {
    selectableId: 'security',
    districtId: 'security',
    exteriorProgram: true,
    securityBuilding: true,
    buildingCode: record.code,
    displayName: record.name,
    purpose: record.purpose,
    placementZone: record.placementZone,
    footprintMetres: [...record.footprintMetres],
    heightMetres: record.heightMetres,
    featureRole: 'building',
    featureTag: record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  };
  switch (record.form) {
    case 'gate': addPortaAegis(building, materials); break;
    case 'command': addPraesidiumNexus(building, materials); break;
    case 'sentinel': addSentinelCrown(building, materials); break;
    case 'blackglass': addScutumBlackglass(building, materials); break;
    case 'forum': addForumMeridian(building, materials); break;
    case 'response': addCeleritasResponseArc(building, materials); break;
    case 'aviary': addStrixAviary(building, materials); break;
    case 'robotics': addCerberusYard(building, materials); break;
    case 'mobility': addViaCustos(building, materials); break;
    case 'clean-gate': addJanusCleanGate(building, materials); break;
    case 'vault': addCustodiaVault(building, materials); break;
    case 'bureau': addSilentiumBureau(building, materials); break;
    case 'proving': addAegisProvingHall(building, materials); break;
    case 'court': addConcordiaCourt(building, materials); break;
    case 'forge': addLimesForge(building, materials); break;
  }
  building.traverse((object) => {
    object.userData.selectableId = 'security';
    object.userData.districtId = 'security';
  });
  return building;
}

function pointInDistrict(
  definition: DistrictDefinition,
  radialT: number,
  angularT: number,
  y = FLOOR_Y,
) {
  const sector = definition.sector!;
  const radialMargin = 4.2;
  const angularMargin = (sector.endAngle - sector.startAngle) * 0.055;
  const radius = THREE.MathUtils.lerp(
    sector.innerRadius + radialMargin,
    sector.outerRadius - radialMargin,
    radialT,
  );
  const angle = THREE.MathUtils.lerp(
    sector.startAngle + angularMargin,
    sector.endAngle - angularMargin,
    angularT,
  );
  return new THREE.Vector3(
    Math.cos(angle) * radius - definition.position[0],
    y,
    Math.sin(angle) * radius - definition.position[2],
  );
}

function makeRibbonGeometry(points: readonly THREE.Vector3[], width: number) {
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
  return geometry;
}

function addRibbon(
  parent: THREE.Group,
  name: string,
  points: readonly THREE.Vector3[],
  width: number,
  material: THREE.Material,
  walkable = true,
) {
  const ribbon = prepare(new THREE.Mesh(makeRibbonGeometry(points, width), material), name);
  ribbon.userData.walkable = walkable;
  ribbon.userData.navObstacle = false;
  ribbon.userData.securityRoad = true;
  ribbon.receiveShadow = true;
  parent.add(ribbon);
  return ribbon;
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

function addRoadNetwork(
  district: THREE.Group,
  definition: DistrictDefinition,
  materials: SecurityMaterials,
) {
  const roads = new THREE.Group();
  roads.name = 'SECURITY__AEGIS_ARC_ROAD_NETWORK';
  roads.userData.selectableId = definition.id;
  const mainArc = arcPoints(definition, 0.20, 0.04, 0.96, 70);
  const operationalArc = arcPoints(definition, 0.68, 0.05, 0.95, 70);
  const perimeterArc = arcPoints(definition, 0.88, 0.08, 0.92, 58);
  addRibbon(roads, 'SECURITY__MAIN_CURVED_BOULEVARD', mainArc, 1.28, materials.paving);
  addRibbon(roads, 'SECURITY__OPERATIONAL_SERVICE_ARC', operationalArc, 1.52, materials.paving);
  addRibbon(roads, 'SECURITY__PERIMETER_MAINTENANCE_ARC', perimeterArc, 0.94, materials.paving);
  for (const [name, points] of [
    ['SECURITY__MAIN_BOULEVARD_INNER_LIGHT_SEAM', arcPoints(definition, 0.19, 0.04, 0.96, 70, FLOOR_Y + 0.014)],
    ['SECURITY__MAIN_BOULEVARD_OUTER_LIGHT_SEAM', arcPoints(definition, 0.21, 0.04, 0.96, 70, FLOOR_Y + 0.014)],
    ['SECURITY__OPERATIONAL_ARC_GUIDANCE_SEAM', arcPoints(definition, 0.68, 0.05, 0.95, 70, FLOOR_Y + 0.014)],
  ] as const) {
    addRibbon(roads, name, points, 0.055, materials.blueLight, false);
  }
  [0.18, 0.48, 0.78].forEach((angularT, index) => {
    const points = Array.from({ length: 26 }, (_, pointIndex) => (
      pointInDistrict(definition, THREE.MathUtils.lerp(0.04, 0.91, pointIndex / 25), angularT)
    ));
    addRibbon(roads, `SECURITY__RADIAL_SERVICE_ROUTE_${index + 1}`, points, index === 1 ? 1.32 : 0.9, materials.paving);
    addRibbon(
      roads,
      `SECURITY__RADIAL_ROUTE_LIGHT_SEAM_${index + 1}`,
      points.map((point) => point.clone().setY(FLOOR_Y + 0.014)),
      0.045,
      materials.blueLight,
      false,
    );
  });
  district.add(roads);
  return roads;
}

function addDistrictLandscape(
  district: THREE.Group,
  definition: DistrictDefinition,
  materials: SecurityMaterials,
) {
  const landscape = new THREE.Group();
  landscape.name = 'SECURITY__LOW_TRANSPARENT_LANDSCAPE';
  const plazaRecords = [
    { code: 'S1', radialT: 0.16, angularT: 0.49, radii: [7.8, 4.4] as const },
    { code: 'S2', radialT: 0.34, angularT: 0.48, radii: [7.4, 6.5] as const },
    { code: 'S5', radialT: 0.33, angularT: 0.63, radii: [6.5, 5.4] as const },
  ];
  plazaRecords.forEach((record) => {
    const point = pointInDistrict(definition, record.radialT, record.angularT, FLOOR_Y - 0.01);
    const plaza = ellipse(
      landscape,
      `SECURITY__${record.code}__CIVIC_SECURITY_PLAZA`,
      record.radii,
      0.04,
      materials.plaza,
      [point.x, point.y, point.z],
    );
    plaza.userData.walkable = true;
    plaza.userData.navObstacle = false;
  });
  for (let index = 0; index < 22; index += 1) {
    const angularT = 0.07 + index / 25;
    const radialT = index % 2 ? 0.245 : 0.375;
    const point = pointInDistrict(definition, radialT, angularT, 0);
    const tree = new THREE.Group();
    tree.name = `SECURITY__HIGH_CANOPY_TREE_${index + 1}`;
    tree.position.copy(point);
    cylinder(tree, `${tree.name}__SILVER_TRUNK`, 0.07, 1.25, materials.titanium, [0, 0.63, 0], 12, true);
    const canopy = prepare(new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), materials.grass), `${tree.name}__OPEN_CANOPY`);
    canopy.scale.set(0.72, 0.42, 0.72);
    canopy.position.y = 1.45;
    tree.add(canopy);
    landscape.add(tree);
  }
  for (let index = 0; index < 16; index += 1) {
    const angularT = 0.08 + index / 18;
    const point = pointInDistrict(definition, index % 2 ? 0.58 : 0.78, angularT, 0);
    const planter = new THREE.Group();
    planter.name = `SECURITY__GEOMETRIC_BASALT_PLANTER_${index + 1}`;
    planter.position.copy(point);
    box(planter, `${planter.name}__SHELL`, [1.3, 0.24, 0.46], materials.deepBasalt, [0, 0.12, 0], true);
    for (let grass = 0; grass < 7; grass += 1) {
      const blade = box(
        planter,
        `${planter.name}__SILVER_GRASS_${grass + 1}`,
        [0.025, 0.34 + (grass % 3) * 0.08, 0.025],
        materials.grass,
        [-0.48 + grass * 0.16, 0.33, 0],
      );
      blade.rotation.z = (grass - 3) * 0.035;
    }
    landscape.add(planter);
  }
  for (let pylon = 0; pylon < 18; pylon += 1) {
    const point = pointInDistrict(definition, pylon % 2 ? 0.28 : 0.7, 0.08 + pylon / 20, 0);
    box(landscape, `SECURITY__SCULPTURAL_LIGHT_PYLON_${pylon + 1}`, [0.12, 0.78, 0.12], materials.darkTitanium, [point.x, 0.39, point.z], true);
    box(landscape, `SECURITY__PYLON_PALE_BLUE_LIGHT_${pylon + 1}`, [0.07, 0.28, 0.07], materials.blueLight, [point.x, 0.64, point.z]);
  }
  district.add(landscape);
  return landscape;
}

export function buildSecurityDistrict(
  district: THREE.Group,
  definition: DistrictDefinition,
) {
  if (!definition.sector) throw new Error('Security District requires a masterplan sector');
  const materials = createSecurityMaterials();
  const roads = addRoadNetwork(district, definition, materials);
  const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = SECURITY_BUILDING_PROGRAM.map((record) => {
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
  district.userData.securityDistrict = {
    identity: 'The Aegis Arc',
    architecturalLanguage: 'overlapping shield plates following the concentric island roads',
    buildingCount: facilities.length,
    buildings: SECURITY_BUILDING_PROGRAM.map((record) => ({
      code: record.code,
      name: record.name,
      purpose: record.purpose,
      placementZone: record.placementZone,
      heightMetres: record.heightMetres,
    })),
    skyline: ['Praesidium Nexus', 'Sentinel Crown'],
    roads: {
      mainBoulevard: 'SECURITY__MAIN_CURVED_BOULEVARD',
      operationalArc: 'SECURITY__OPERATIONAL_SERVICE_ARC',
      perimeterArc: 'SECURITY__PERIMETER_MAINTENANCE_ARC',
      radialRouteCount: 3,
      embeddedGuidanceLighting: true,
    },
    materials: [
      'frost-white ceramic composite',
      'charcoal basalt-fibre concrete',
      'marine-grade titanium',
      'smoked electrochromic glass',
      'dark stone paving',
    ],
    lighting: {
      normal: 'muted white and pale blue',
      emergency: 'thin amber route lines',
      immediateDanger: 'red reserved and normally absent',
    },
    landscape: {
      transparentSightLines: true,
      highCanopyTrees: 22,
      geometricPlanters: 16,
      lightPylons: 18,
      denseShrubs: 0,
    },
    exteriorOnly: true,
    recommendedInteriorSequence: ['Porta Aegis', 'Praesidium Nexus'],
  };
  district.userData.population = {
    plannedFacilities: SECURITY_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: [
      'Aegis Arc boulevard',
      'operational service arc',
      'perimeter maintenance arc',
      'emergency assembly plazas',
      'black reflecting pools',
      'transparent security landscape',
    ],
    realizedFeatureTags: SECURITY_BUILDING_PROGRAM.map((record) => (
      record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    )),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: roads.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 6,
    radialCoverage: 0.91,
    angularCoverage: 0.89,
    exteriorOnly: true,
    aegisArc: true,
  };
}
