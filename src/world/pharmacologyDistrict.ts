import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type PharmacologyBuildingForm = 'nexus' | 'ternary' | 'scriptorium' | 'vectorium' | 'chronopharm';

export interface PharmacologyBuildingProgram {
  code: string;
  name: string;
  purpose: string;
  form: PharmacologyBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
}

export const PHARMACOLOGY_BUILDING_PROGRAM: readonly PharmacologyBuildingProgram[] = [
  {
    code: 'P1',
    name: 'Pharmakon Nexus',
    purpose: 'Autonomous Drug Design and Experimental Pharmacology Centre',
    form: 'nexus',
    footprintMetres: [150, 95],
    heightMetres: 42,
    radialT: 0.10,
    angularT: 0.50,
    placementZone: 'Inner district threshold',
    exteriorMotif: 'molecular docking and autonomous experimentation',
  },
  {
    code: 'P2',
    name: 'The Ternary Gate',
    purpose: 'Centre for Targeted Protein Degradation and Induced Proximity Pharmacology',
    form: 'ternary',
    footprintMetres: [130, 95],
    heightMetres: 82,
    radialT: 0.37,
    angularT: 0.15,
    placementZone: 'Western edge adjoining Toxicology',
    exteriorMotif: 'induced proximity and ternary complexes',
  },
  {
    code: 'P3',
    name: 'Scriptorium Therapeutica',
    purpose: 'Institute for RNA, Oligonucleotide and Programmable Medicines',
    form: 'scriptorium',
    footprintMetres: [175, 60],
    heightMetres: 34,
    radialT: 0.40,
    angularT: 0.79,
    placementZone: 'Eastern transparent edge facing Medical Labs',
    exteriorMotif: 'encoded and programmable medicines',
  },
  {
    code: 'P4',
    name: 'Vectorium Aegis',
    purpose: 'Precision Drug Delivery and Nanopharmacology Complex',
    form: 'vectorium',
    footprintMetres: [150, 145],
    heightMetres: 58,
    radialT: 0.60,
    angularT: 0.41,
    placementZone: 'Upper-middle research field',
    exteriorMotif: 'membranes, carriers, and targeted delivery',
  },
  {
    code: 'P5',
    name: 'Chronopharm Observatory',
    purpose: 'Centre for Systems Pharmacology, Digital-Twin Therapeutics and PK/PD Modelling',
    form: 'chronopharm',
    footprintMetres: [190, 150],
    heightMetres: 96,
    radialT: 0.86,
    angularT: 0.57,
    placementZone: 'Outer landmark facing the circular boulevard',
    exteriorMotif: 'pharmacokinetics, biological time, and personalised response',
  },
] as const;

const DISTRICT_ID = 'pharmacology-labs';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 24, 14);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_X = new THREE.Vector3(1, 0, 0);

type PharmacologyMaterials = ReturnType<typeof createPharmacologyMaterials>;

function pharmacologyMaterial(
  name: string,
  color: THREE.ColorRepresentation,
  options: THREE.MeshStandardMaterialParameters = {},
) {
  return new THREE.MeshStandardMaterial({
    name,
    color,
    roughness: 0.64,
    metalness: 0.12,
    ...options,
  });
}

function createPharmacologyMaterials() {
  const boneCeramic = pharmacologyMaterial('Pharmacology bone-white responsive ceramic', '#ece9df', {
    roughness: 0.72,
    metalness: 0.03,
  });
  const paleCeramic = pharmacologyMaterial('Pharmacology pale opaline ceramic', '#cfdad5', {
    roughness: 0.62,
    metalness: 0.04,
  });
  const charcoalCeramic = pharmacologyMaterial('Pharmacology charcoal defensive ceramic', '#20272a', {
    roughness: 0.76,
    metalness: 0.08,
  });
  const titanium = pharmacologyMaterial('Pharmacology pale satin titanium', '#aeb9b8', {
    roughness: 0.32,
    metalness: 0.86,
  });
  const darkTitanium = pharmacologyMaterial('Pharmacology folded dark titanium', '#39464b', {
    roughness: 0.4,
    metalness: 0.78,
  });
  const smokedGlass = pharmacologyMaterial('Pharmacology smoked electrochromic glass', '#183239', {
    emissive: '#17343d',
    emissiveIntensity: 0.22,
    roughness: 0.16,
    metalness: 0.28,
    transparent: true,
    opacity: 0.76,
    side: THREE.DoubleSide,
  });
  const clearGlass = pharmacologyMaterial('Pharmacology transparent medical-interface glass', '#9cdbe0', {
    emissive: '#559ba5',
    emissiveIntensity: 0.2,
    roughness: 0.08,
    metalness: 0.02,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
  });
  const opalineGlass = pharmacologyMaterial('Pharmacology opaline sequence glass', '#d8eeee', {
    emissive: '#8bc5c8',
    emissiveIntensity: 0.22,
    roughness: 0.28,
    metalness: 0.02,
    transparent: true,
    opacity: 0.68,
    side: THREE.DoubleSide,
  });
  const crystallineGlass = pharmacologyMaterial('Pharmacology crystalline mediator glass', '#c9f7ff', {
    emissive: '#8eeeff',
    emissiveIntensity: 0.48,
    roughness: 0.06,
    metalness: 0.04,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const membrane = pharmacologyMaterial('Pharmacology iridescent fluoropolymer membrane', '#cfe4df', {
    emissive: '#88afa9',
    emissiveIntensity: 0.18,
    roughness: 0.38,
    metalness: 0,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const photovoltaic = pharmacologyMaterial('Pharmacology black photovoltaic glass', '#071216', {
    emissive: '#112c33',
    emissiveIntensity: 0.16,
    roughness: 0.12,
    metalness: 0.46,
  });
  const basalt = pharmacologyMaterial('Pharmacology dark basalt podium', '#101517', {
    roughness: 0.9,
    metalness: 0.02,
  });
  const polishedBasalt = pharmacologyMaterial('Pharmacology mirror-polished basalt', '#11191c', {
    roughness: 0.22,
    metalness: 0.42,
  });
  const palePaving = pharmacologyMaterial('Dose-Response pale mineral paving', '#aeb7b2', {
    roughness: 0.94,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });
  const darkPaving = pharmacologyMaterial('Dose-Response dark mineral paving', '#343c3d', {
    roughness: 0.97,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });
  const water = pharmacologyMaterial('Pharmacology pharmacokinetic water', '#173f48', {
    emissive: '#245d68',
    emissiveIntensity: 0.2,
    roughness: 0.05,
    metalness: 0.16,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  });
  const pearl = pharmacologyMaterial('Pharmacology pearl payload surface', '#dbe3dd', {
    emissive: '#879a92',
    emissiveIntensity: 0.12,
    roughness: 0.22,
    metalness: 0.18,
  });
  const porousStone = pharmacologyMaterial('Pharmacology porous hydrophobic stone', '#252c2c', {
    roughness: 1,
    metalness: 0,
  });
  const paleAggregate = pharmacologyMaterial('Pharmacology pale hydrophilic glass aggregate', '#b5cbc6', {
    emissive: '#6b948e',
    emissiveIntensity: 0.08,
    roughness: 0.52,
    metalness: 0.12,
  });
  const planting = pharmacologyMaterial('Pharmacology controlled medicinal planting', '#637c69', {
    roughness: 0.98,
    metalness: 0,
  });
  const coldLight = pharmacologyMaterial('Pharmacology cold-white instrumentation light', '#e9ffff', {
    emissive: '#b8f8ff',
    emissiveIntensity: 3.4,
    roughness: 0.14,
  });
  const concentrationLight = pharmacologyMaterial('Pharmacology concentration mint light', '#a8ffd1', {
    emissive: '#63f4aa',
    emissiveIntensity: 3.1,
    roughness: 0.16,
  });
  const amberStatus = pharmacologyMaterial('Pharmacology containment amber status light', '#ffd58a', {
    emissive: '#ffac38',
    emissiveIntensity: 3,
    roughness: 0.16,
  });
  [coldLight, concentrationLight, amberStatus].forEach((material) => {
    material.userData.isDistrictAccent = true;
  });
  return {
    boneCeramic,
    paleCeramic,
    charcoalCeramic,
    titanium,
    darkTitanium,
    smokedGlass,
    clearGlass,
    opalineGlass,
    crystallineGlass,
    membrane,
    photovoltaic,
    basalt,
    polishedBasalt,
    palePaving,
    darkPaving,
    water,
    pearl,
    porousStone,
    paleAggregate,
    planting,
    coldLight,
    concentrationLight,
    amberStatus,
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
  const mesh = prepare(new THREE.Mesh(UNIT_SPHERE, material), name, obstacle);
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
  obstacle = false,
) {
  const direction = end.clone().sub(start);
  const mesh = prepare(new THREE.Mesh(UNIT_CYLINDER_12, material), name, obstacle);
  mesh.scale.set(radius * 2, direction.length(), radius * 2);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UNIT_Y, direction.normalize());
  parent.add(mesh);
  return mesh;
}

function slabBetween(
  parent: THREE.Object3D,
  name: string,
  start: THREE.Vector3,
  end: THREE.Vector3,
  width: number,
  height: number,
  material: THREE.Material,
  obstacle = true,
) {
  const direction = end.clone().sub(start);
  const mesh = prepare(new THREE.Mesh(UNIT_BOX, material), name, obstacle);
  mesh.scale.set(direction.length() + 0.18, height, width);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UNIT_X, direction.normalize());
  parent.add(mesh);
  return mesh;
}

function tubePath(
  parent: THREE.Object3D,
  name: string,
  points: readonly THREE.Vector3[],
  radius: number,
  material: THREE.Material,
  closed = false,
) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => point.clone()), closed, 'catmullrom', 0.42);
  const mesh = prepare(new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, points.length * 6), radius, 8, closed), material), name);
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
  mesh.userData.pharmacologyRoute = true;
  parent.add(mesh);
  return mesh;
}

function crescentVolume(
  parent: THREE.Object3D,
  name: string,
  width: number,
  depth: number,
  height: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  mirrored = false,
  obstacle = true,
) {
  const points: THREE.Vector2[] = [];
  const mirror = mirrored ? -1 : 1;
  const outerStart = -2.28;
  const outerEnd = 2.28;
  for (let index = 0; index <= 28; index += 1) {
    const angle = THREE.MathUtils.lerp(outerStart, outerEnd, index / 28);
    points.push(new THREE.Vector2(mirror * Math.cos(angle) * width * 0.5, Math.sin(angle) * depth * 0.5));
  }
  for (let index = 0; index <= 22; index += 1) {
    const angle = THREE.MathUtils.lerp(outerEnd, outerStart, index / 22);
    points.push(new THREE.Vector2(
      mirror * (Math.cos(angle) * width * 0.31 - width * 0.07),
      Math.sin(angle) * depth * 0.31,
    ));
  }
  const shape = new THREE.Shape(points);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelSize: 0.06,
    bevelThickness: 0.04,
    bevelSegments: 2,
    curveSegments: 24,
  });
  geometry.rotateX(-Math.PI / 2);
  const mesh = prepare(new THREE.Mesh(geometry, material), name, obstacle);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function shapePlate(
  parent: THREE.Object3D,
  name: string,
  points: readonly THREE.Vector2[],
  material: THREE.Material,
  position: readonly [number, number, number],
  walkable = true,
) {
  const mesh = prepare(new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([...points])), material), name);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(...position);
  mesh.userData.walkable = walkable;
  mesh.userData.navObstacle = false;
  parent.add(mesh);
  return mesh;
}

function addPharmakonNexus(root: THREE.Group, materials: PharmacologyMaterials) {
  ellipse(root, 'PHARMACOLOGY__P1__BASALT_PODIUM', [16.4, 10.5], 0.26, materials.basalt, [0, 0.13, 0], true);
  ellipse(root, 'PHARMACOLOGY__P1__GRADIENT_ENTRANCE_PLAZA', [12.6, 6.1], 0.04, materials.palePaving, [0, FLOOR_Y + 0.14, 5.2]);

  for (let level = 0; level < 5; level += 1) {
    const baseY = 0.24 + level * 0.74;
    const rotation = (level - 2) * 0.035;
    const shift = level % 2 === 0 ? -0.22 : 0.22;
    const left = crescentVolume(
      root,
      `PHARMACOLOGY__P1__DOCKING_CRESCENT_LEFT_${level + 1}`,
      8.9 - level * 0.18,
      8.25 - level * 0.12,
      0.58,
      level === 0 ? materials.charcoalCeramic : materials.boneCeramic,
      [-2.42 + shift, baseY, 0],
      false,
    );
    const right = crescentVolume(
      root,
      `PHARMACOLOGY__P1__DOCKING_CRESCENT_RIGHT_${level + 1}`,
      8.9 - level * 0.18,
      8.25 - level * 0.12,
      0.58,
      level === 0 ? materials.charcoalCeramic : materials.boneCeramic,
      [2.42 - shift, baseY, 0],
      true,
    );
    left.rotation.y = rotation;
    right.rotation.y = -rotation;
    if (level < 4) {
      const seamLeft = crescentVolume(root, `PHARMACOLOGY__P1__PHOTOVOLTAIC_SEAM_LEFT_${level + 1}`, 8.72, 8.02, 0.07, materials.photovoltaic, [-2.42 + shift, baseY + 0.61, 0], false, false);
      const seamRight = crescentVolume(root, `PHARMACOLOGY__P1__PHOTOVOLTAIC_SEAM_RIGHT_${level + 1}`, 8.72, 8.02, 0.07, materials.photovoltaic, [2.42 - shift, baseY + 0.61, 0], true, false);
      seamLeft.rotation.y = rotation;
      seamRight.rotation.y = -rotation;
    }
  }

  box(root, 'PHARMACOLOGY__P1__DIAGONAL_BINDING_POCKET', [2.65, 2.05, 0.14], materials.smokedGlass, [0.05, 1.18, 4.15]);
  root.getObjectByName('PHARMACOLOGY__P1__DIAGONAL_BINDING_POCKET')!.rotation.z = -0.24;
  for (const x of [-1.55, 1.55]) {
    box(root, `PHARMACOLOGY__P1__MONUMENTAL_THRESHOLD_JAMB_${x < 0 ? 'WEST' : 'EAST'}`, [0.28, 2.15, 0.42], materials.titanium, [x, 1.2, 4.0]);
  }

  const hexGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
  for (let level = 0; level < 5; level += 1) {
    for (let panel = 0; panel < 14; panel += 1) {
      const x = -6.0 + panel * (12 / 13);
      for (const side of [-1, 1]) {
        const panelMesh = prepare(
          new THREE.Mesh(hexGeometry, level === 0 && side < 0 ? materials.charcoalCeramic : materials.boneCeramic),
          `PHARMACOLOGY__P1__RESPONSIVE_HEX_PANEL_${level + 1}_${side < 0 ? 'REAR' : 'FRONT'}_${panel + 1}`,
        );
        panelMesh.scale.set(0.3, 0.035, 0.25);
        panelMesh.rotation.x = Math.PI / 2;
        const facadeDepth = 3.72 - Math.pow(Math.abs(x) / 6, 1.6) * 1.55;
        const baseRotationY = side * x * 0.05;
        panelMesh.position.set(x, 0.56 + level * 0.74, side * facadeDepth);
        panelMesh.rotation.y = baseRotationY;
        panelMesh.userData.animate = 'pharmacology-facade-ripple';
        panelMesh.userData.baseRotationY = baseRotationY;
        panelMesh.userData.phase = panel * 0.43 + level * 0.9 + (side < 0 ? 1.7 : 0);
        root.add(panelMesh);
      }
    }
  }

  for (let rib = 0; rib < 17; rib += 1) {
    box(root, `PHARMACOLOGY__P1__REAR_TITANIUM_SERVICE_RIB_${rib + 1}`, [0.11, 3.25, 0.2], materials.titanium, [-6.0 + rib * 0.75, 1.8, -4.14]);
  }
  for (let conduit = 0; conduit < 5; conduit += 1) {
    pipe(root, `PHARMACOLOGY__P1__TRANSPARENT_SERVICE_CONDUIT_${conduit + 1}`, new THREE.Vector3(-5.8, 0.55 + conduit * 0.45, -4.35), new THREE.Vector3(5.8, 0.55 + conduit * 0.45, -4.35), 0.055, conduit % 2 ? materials.clearGlass : materials.titanium);
  }

  const ligandField = new THREE.Group();
  ligandField.name = 'PHARMACOLOGY__P1__LIGAND_FIELD';
  ligandField.position.set(0, 0.26, 6.25);
  ellipsoid(ligandField, 'PHARMACOLOGY__P1__LIGAND_BODY_A', [1.25, 0.72, 0.6], materials.titanium, [-1.45, 1.05, 0]);
  ellipsoid(ligandField, 'PHARMACOLOGY__P1__LIGAND_BODY_B', [1.25, 0.72, 0.6], materials.titanium, [1.45, 1.05, 0]);
  const ligand = ellipsoid(ligandField, 'PHARMACOLOGY__P1__STABILISED_LIGAND', [0.26, 0.26, 0.26], materials.concentrationLight.clone(), [0, 1.05, 0]);
  ligand.userData.animate = 'pharmacology-emissive-pulse';
  ligand.userData.minIntensity = 1.8;
  ligand.userData.maxIntensity = 4.4;
  ligand.userData.speed = 0.08;
  pipe(ligandField, 'PHARMACOLOGY__P1__MAGNETIC_SUPPORT', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.82, 0), 0.025, materials.darkTitanium);
  root.add(ligandField);

  for (let ridge = 0; ridge < 5; ridge += 1) {
    const bench = torus(root, `PHARMACOLOGY__P1__MOLECULAR_CONTOUR_SEAT_${ridge + 1}`, 2.2 + ridge * 0.48, 0.09, materials.polishedBasalt, [0, 0.31, 5.5], [Math.PI / 2, 0, 0], Math.PI * 0.55);
    bench.rotation.z = Math.PI * (0.73 + ridge * 0.08);
  }

  for (let fin = 0; fin < 21; fin += 1) {
    const height = 0.22 + (1 - Math.abs(fin - 10) / 10) * 0.64;
    box(root, `PHARMACOLOGY__P1__ENERGY_LANDSCAPE_FIN_${fin + 1}`, [0.08, height, 3.5], fin % 3 === 0 ? materials.photovoltaic : materials.titanium, [-5.2 + fin * 0.52, 4.05 + height * 0.5, -0.15]);
  }
  for (let needle = 0; needle < 7; needle += 1) {
    cylinder(root, `PHARMACOLOGY__P1__HOLLOW_SCRUBBER_NEEDLE_${needle + 1}`, 0.14, 0.9 + (needle % 3) * 0.24, materials.titanium, [-2.1 + needle * 0.7, 4.5 + (needle % 3) * 0.12, -1.5], false, 12);
    torus(root, `PHARMACOLOGY__P1__NEEDLE_SENSOR_RING_${needle + 1}`, 0.09, 0.015, materials.coldLight, [-2.1 + needle * 0.7, 5.0 + (needle % 3) * 0.24, -1.5]);
  }
  for (const x of [-4.1, 3.9]) {
    cylinder(root, `PHARMACOLOGY__P1__DRONE_PAD_${x < 0 ? 'A' : 'B'}`, 1.0, 0.05, materials.photovoltaic, [x, 4.16, -1.1]);
    torus(root, `PHARMACOLOGY__P1__DRONE_PAD_RING_${x < 0 ? 'A' : 'B'}`, 0.36, 0.025, materials.coldLight, [x, 4.2, -1.1]);
  }
}

function addTernaryGate(root: THREE.Group, materials: PharmacologyMaterials) {
  shapePlate(root, 'PHARMACOLOGY__P2__TRIANGULAR_GATEWAY_PLAZA', [
    new THREE.Vector2(-6.8, -4.5),
    new THREE.Vector2(6.8, -4.5),
    new THREE.Vector2(0, 5.5),
  ], materials.darkPaving, [0, FLOOR_Y, 0]);

  const west = new THREE.Group();
  west.name = 'PHARMACOLOGY__P2__WESTERN_TARGET_TOWER';
  west.position.set(-3.9, 0, 0);
  west.rotation.z = -0.055;
  root.add(west);
  for (let level = 0; level < 8; level += 1) {
    const width = 4.7 - level * 0.14;
    const depth = 6.4 - (level % 3) * 0.18;
    const slab = box(west, `PHARMACOLOGY__P2__WEST_FOLDED_VOLUME_${level + 1}`, [width, 0.92, depth], level % 2 ? materials.charcoalCeramic : materials.darkTitanium, [0.12 * Math.sin(level), 0.5 + level * 0.98, 0], true);
    slab.rotation.y = (level % 2 ? -1 : 1) * (0.025 + level * 0.008);
    for (let fold = 0; fold < 4; fold += 1) {
      const fin = box(west, `PHARMACOLOGY__P2__WEST_PROTEIN_FOLD_${level + 1}_${fold + 1}`, [0.1, 0.82, depth + 0.12], fold === 1 ? materials.smokedGlass : materials.titanium, [-width * 0.38 + fold * width * 0.25, 0.5 + level * 0.98, 0]);
      fin.rotation.z = (fold - 1.5) * 0.08;
    }
  }

  const east = new THREE.Group();
  east.name = 'PHARMACOLOGY__P2__EASTERN_TARGET_TOWER';
  east.position.set(3.6, 0, 0.15);
  east.rotation.z = 0.047;
  root.add(east);
  for (let level = 0; level < 7; level += 1) {
    const width = 3.8 - level * 0.09;
    const depth = 5.7 - (level % 2) * 0.12;
    const slab = box(east, `PHARMACOLOGY__P2__EAST_FOLDED_VOLUME_${level + 1}`, [width, 0.86, depth], level % 2 ? materials.paleCeramic : materials.boneCeramic, [-0.08 * Math.cos(level), 0.48 + level * 0.93, 0], true);
    slab.rotation.y = (level % 2 ? 1 : -1) * (0.018 + level * 0.006);
    for (let fold = 0; fold < 3; fold += 1) {
      const fin = box(east, `PHARMACOLOGY__P2__EAST_PROTEIN_FOLD_${level + 1}_${fold + 1}`, [0.08, 0.76, depth + 0.1], fold === 1 ? materials.clearGlass : materials.titanium, [-width * 0.3 + fold * width * 0.3, 0.48 + level * 0.93, 0]);
      fin.rotation.z = (fold - 1) * 0.04;
    }
  }

  const mediator = box(root, 'PHARMACOLOGY__P2__CRYSTALLINE_MEDIATOR', [4.2, 0.82, 1.65], materials.crystallineGlass, [0, 5.35, 0.05]);
  mediator.rotation.y = 0.04;
  box(root, 'PHARMACOLOGY__P2__MEDIATOR_LUMINOUS_SPINE', [4.35, 0.11, 0.12], materials.coldLight.clone(), [0, 5.35, 0.05]).userData.animate = 'pharmacology-emissive-pulse';
  const spine = root.getObjectByName('PHARMACOLOGY__P2__MEDIATOR_LUMINOUS_SPINE')!;
  spine.userData.minIntensity = 1.5;
  spine.userData.maxIntensity = 4.2;
  spine.userData.speed = 0.06;
  for (let rib = 0; rib < 7; rib += 1) {
    const x = -1.8 + rib * 0.6;
    pipe(root, `PHARMACOLOGY__P2__MEDIATOR_TITANIUM_RIB_${rib + 1}`, new THREE.Vector3(x, 4.92, -0.9), new THREE.Vector3(x + 0.1, 5.78, 0.9), 0.035, materials.titanium);
  }
  for (const side of [-1, 1]) {
    torus(root, `PHARMACOLOGY__P2__ARTICULATED_MEDIATOR_JOINT_${side < 0 ? 'WEST' : 'EAST'}`, 0.46, 0.08, materials.titanium, [side * 2.25, 5.35, 0.04], [0, Math.PI / 2, 0]);
  }

  const pathwayPoints = [
    [new THREE.Vector3(-3.9, FLOOR_Y + 0.02, 4.35), new THREE.Vector3(0, FLOOR_Y + 0.02, 0), new THREE.Vector3(3.6, FLOOR_Y + 0.02, -4.1)],
    [new THREE.Vector3(-3.9, FLOOR_Y + 0.022, 4.35), new THREE.Vector3(-0.55, FLOOR_Y + 0.022, 0), new THREE.Vector3(3.6, FLOOR_Y + 0.022, -4.1)],
    [new THREE.Vector3(-3.9, FLOOR_Y + 0.024, 4.35), new THREE.Vector3(0.55, FLOOR_Y + 0.024, 0), new THREE.Vector3(3.6, FLOOR_Y + 0.024, -4.1)],
  ];
  pathwayPoints.forEach((points, index) => addLocalRibbon(root, `PHARMACOLOGY__P2__TERNARY_PAVEMENT_PATH_${index + 1}`, points, 0.06, index === 1 ? materials.concentrationLight : materials.coldLight, false));

  box(root, 'PHARMACOLOGY__P2__RECESSED_CONTAINMENT_COURT', [6.2, 0.22, 3.3], materials.basalt, [-5.2, 0.11, -4.4], true);
  for (const x of [-7.3, -5.25, -3.2]) {
    const ring = torus(root, `PHARMACOLOGY__P2__ROTARY_LOADING_SEAL_${Math.round((x + 8) * 10)}`, 0.7, 0.12, materials.darkTitanium, [x, 1.05, -2.95], [0, 0, 0]);
    ring.scale.y = 1.08;
    torus(root, `PHARMACOLOGY__P2__LOADING_STATUS_RING_${Math.round((x + 8) * 10)}`, 0.82, 0.035, x === -5.25 ? materials.amberStatus : materials.concentrationLight, [x, 1.05, -2.9], [0, 0, 0]);
  }
  for (let barrier = 0; barrier < 5; barrier += 1) {
    cylinder(root, `PHARMACOLOGY__P2__RETRACTABLE_VEHICLE_BARRIER_${barrier + 1}`, 0.18, 0.75, materials.titanium, [-7.25 + barrier * 0.92, 0.38, -5.85], true, 12);
  }
  for (let conduit = 0; conduit < 3; conduit += 1) {
    const y = 2.1 + conduit * 0.72;
    pipe(root, `PHARMACOLOGY__P2__TOXICOLOGY_ARMOURED_UTILITY_CONDUIT_${conduit + 1}`, new THREE.Vector3(-6.0, y, -1.5 + conduit * 0.35), new THREE.Vector3(-9.0, y + 0.18, -2.8 + conduit * 0.5), 0.18, materials.charcoalCeramic);
    pipe(root, `PHARMACOLOGY__P2__UTILITY_CONDUIT_PYLON_${conduit + 1}`, new THREE.Vector3(-8.15, 0, -2.45 + conduit * 0.5), new THREE.Vector3(-8.15, y, -2.45 + conduit * 0.5), 0.08, materials.titanium);
  }
  box(root, 'PHARMACOLOGY__P2__TRANSPARENT_RESEARCH_BRIDGE', [5.5, 0.5, 0.9], materials.clearGlass, [6.3, 2.9, 0.6]);

  for (const [tower, height, count] of [[west, 8.35, 9], [east, 6.85, 7]] as const) {
    for (let fin = 0; fin < count; fin += 1) {
      const crown = box(tower, `PHARMACOLOGY__P2__FRACTURED_CROWN_FIN_${tower === west ? 'WEST' : 'EAST'}_${fin + 1}`, [0.16, 0.72 + (fin % 3) * 0.24, 1.65], fin % 3 === 0 ? materials.coldLight : materials.titanium, [-1.55 + fin * (3.1 / Math.max(1, count - 1)), height + (fin % 3) * 0.12, 0]);
      crown.rotation.z = (fin - count / 2) * 0.025;
    }
  }
}

function addScriptorium(root: THREE.Group, materials: PharmacologyMaterials) {
  ellipse(root, 'PHARMACOLOGY__P3__SCRIPTORIUM_PODIUM', [18.2, 6.8], 0.16, materials.palePaving, [0, 0.08, 0], true);
  const ribbonSets = [
    {
      name: 'LOWER', material: materials.boneCeramic, width: 2.05,
      points: [[-8.5, 0.45, -1.5], [-5.5, 0.65, -1.25], [-2.2, 1.05, -0.9], [1.0, 1.45, -1.15], [4.2, 1.85, -1.45], [8.4, 2.15, -1.15]],
    },
    {
      name: 'MIDDLE', material: materials.paleCeramic, width: 1.9,
      points: [[-8.4, 1.45, 0.25], [-5.0, 1.75, 0.55], [-1.5, 2.55, 0.45], [1.4, 2.85, 0.2], [4.7, 2.25, 0.55], [8.3, 1.72, 0.82]],
    },
    {
      name: 'UPPER', material: materials.opalineGlass, width: 1.65,
      points: [[-7.8, 2.45, 1.55], [-4.4, 2.85, 1.25], [-1.2, 3.35, 1.05], [2.0, 3.0, 1.35], [5.1, 2.6, 1.6], [7.8, 2.72, 1.3]],
    },
  ] as const;
  ribbonSets.forEach((ribbon) => {
    const points = ribbon.points.map((point) => new THREE.Vector3(...point));
    for (let segment = 0; segment < points.length - 1; segment += 1) {
      slabBetween(root, `PHARMACOLOGY__P3__${ribbon.name}_ENCODED_RIBBON_${segment + 1}`, points[segment], points[segment + 1], ribbon.width, 0.58, ribbon.material);
      box(root, `PHARMACOLOGY__P3__${ribbon.name}_DARK_READING_GAP_${segment + 1}`, [points[segment].distanceTo(points[segment + 1]) * 0.94, 0.11, ribbon.width * 0.9], materials.smokedGlass, points[segment].clone().add(points[segment + 1]).multiplyScalar(0.5).toArray() as [number, number, number]);
      const gap = root.getObjectByName(`PHARMACOLOGY__P3__${ribbon.name}_DARK_READING_GAP_${segment + 1}`)!;
      gap.quaternion.setFromUnitVectors(UNIT_X, points[segment + 1].clone().sub(points[segment]).normalize());
    }
  });

  const sequenceMaterials = [materials.boneCeramic, materials.opalineGlass, materials.titanium, materials.smokedGlass];
  for (let fin = 0; fin < 64; fin += 1) {
    const x = -8.25 + fin * (16.5 / 63);
    const sequence = (fin * 7 + fin * fin * 3) % 11;
    const height = 0.75 + (sequence % 5) * 0.23 + (Math.abs(x) < 1.6 ? 1.15 : 0);
    const material = sequenceMaterials[(fin * 3 + sequence) % sequenceMaterials.length];
    for (const side of [-1, 1]) {
      const facadeFin = box(root, `PHARMACOLOGY__P3__SEQUENCE_FIN_${side < 0 ? 'MEDICAL' : 'PROMENADE'}_${fin + 1}`, [0.065, height, 0.16], material, [x, height * 0.5 + 0.22, side * 2.72]);
      facadeFin.rotation.z = Math.abs(x) < 1.5 ? -x * 0.035 : 0;
    }
  }

  shapePlate(root, 'PHARMACOLOGY__P3__CLEAVAGE_COURT', [
    new THREE.Vector2(-2.5, 2.2),
    new THREE.Vector2(2.5, 2.2),
    new THREE.Vector2(0, 6.4),
  ], materials.darkPaving, [0, FLOOR_Y + 0.16, 0]);
  box(root, 'PHARMACOLOGY__P3__RECESSED_MESH_ENTRANCE', [3.2, 1.05, 0.15], materials.smokedGlass, [0, 0.78, 2.55]);
  const cleavageStem = [new THREE.Vector3(0, FLOOR_Y + 0.18, 6.15), new THREE.Vector3(0, FLOOR_Y + 0.18, 3.8)];
  addLocalRibbon(root, 'PHARMACOLOGY__P3__CLEAVAGE_WATER_STEM', cleavageStem, 0.22, materials.water, false);
  for (const side of [-1, 1]) {
    addLocalRibbon(root, `PHARMACOLOGY__P3__CLEAVAGE_WATER_BRANCH_${side < 0 ? 'WEST' : 'EAST'}`, [new THREE.Vector3(0, FLOOR_Y + 0.18, 3.8), new THREE.Vector3(side * 1.25, FLOOR_Y + 0.18, 2.7), new THREE.Vector3(side * 2.5, FLOOR_Y + 0.18, 2.2)], 0.18, materials.water, false);
  }

  const sequenceFrame = new THREE.Group();
  sequenceFrame.name = 'PHARMACOLOGY__P3__SEQUENCE_READER_INSTALLATION';
  sequenceFrame.position.set(5.4, 0.22, 4.2);
  box(sequenceFrame, 'PHARMACOLOGY__P3__SEQUENCE_READER_FRAME', [6.0, 0.12, 0.16], materials.titanium, [0, 1.05, 0]);
  for (let rod = 0; rod < 36; rod += 1) {
    const height = 0.25 + ((rod * 5) % 9) * 0.07;
    const glassRod = cylinder(sequenceFrame, `PHARMACOLOGY__P3__SEQUENCE_GLASS_ROD_${rod + 1}`, 0.065, height, rod % 7 === 0 ? materials.coldLight.clone() : materials.crystallineGlass, [-2.8 + rod * 0.16, 0.92 - height * 0.5, 0], false, 12);
    if (rod % 7 === 0) {
      glassRod.userData.animate = 'pharmacology-emissive-pulse';
      glassRod.userData.minIntensity = 0.3;
      glassRod.userData.maxIntensity = 3.8;
      glassRod.userData.speed = 0.035;
      glassRod.userData.phase = rod * 0.6;
    }
  }
  root.add(sequenceFrame);

  for (let tower = 0; tower < 4; tower += 1) {
    const x = -5.4 + tower * 3.55;
    pipe(root, `PHARMACOLOGY__P3__SEQUENCER_EXHAUST_CORE_${tower + 1}`, new THREE.Vector3(x, 2.9, -0.55), new THREE.Vector3(x, 4.1, -0.55), 0.08, materials.titanium);
    for (let ring = 0; ring < 4; ring += 1) {
      torus(root, `PHARMACOLOGY__P3__SEQUENCER_EXHAUST_RING_${tower + 1}_${ring + 1}`, 0.34 + ring * 0.03, 0.035, ring === 3 ? materials.coldLight : materials.titanium, [x, 3.12 + ring * 0.27, -0.55]);
    }
  }
  for (let terrace = 0; terrace < 12; terrace += 1) {
    const x = -7.5 + terrace * 1.3;
    box(root, `PHARMACOLOGY__P3__MEDICINAL_TERRACE_BED_${terrace + 1}`, [1.05, 0.16, 0.62], materials.paleAggregate, [x, 0.24 + (terrace % 3) * 0.18, -3.35]);
    for (let plant = 0; plant < 3; plant += 1) {
      ellipsoid(root, `PHARMACOLOGY__P3__CONTROLLED_MEDICINAL_PLANT_${terrace + 1}_${plant + 1}`, [0.18, 0.24, 0.16], materials.planting, [x - 0.3 + plant * 0.3, 0.48 + (terrace % 3) * 0.18, -3.35]);
    }
  }
}

function addVectorium(root: THREE.Group, materials: PharmacologyMaterials) {
  ellipse(root, 'PHARMACOLOGY__P4__DARK_CIRCULAR_PODIUM', [12.2, 11.2], 0.24, materials.basalt, [0, 0.12, 0], true);

  const shellPatchA = prepare(new THREE.Mesh(
    new THREE.SphereGeometry(5.8, 32, 16, 0.25, Math.PI * 0.72, Math.PI * 0.13, Math.PI * 0.74),
    materials.membrane,
  ), 'PHARMACOLOGY__P4__MEMBRANE_PATCH_MEDICAL');
  shellPatchA.scale.set(1, 0.82, 0.9);
  shellPatchA.position.y = 3.0;
  root.add(shellPatchA);
  const shellPatchB = prepare(new THREE.Mesh(
    new THREE.SphereGeometry(5.8, 32, 16, Math.PI * 1.15, Math.PI * 0.58, Math.PI * 0.13, Math.PI * 0.74),
    materials.membrane,
  ), 'PHARMACOLOGY__P4__MEMBRANE_PATCH_TOXICOLOGY');
  shellPatchB.scale.set(1, 0.82, 0.9);
  shellPatchB.position.y = 3.0;
  root.add(shellPatchB);

  for (let ring = 0; ring < 9; ring += 1) {
    const y = 0.65 + ring * 0.58;
    const normalized = (y - 3.0) / 2.75;
    const radius = Math.sqrt(Math.max(0.08, 1 - normalized * normalized)) * 5.55;
    const shellRing = torus(root, `PHARMACOLOGY__P4__CONCENTRIC_MEMBRANE_RING_${ring + 1}`, radius, 0.035, materials.titanium, [0, y, 0]);
    shellRing.scale.z = 0.9;
  }
  for (let meridian = 0; meridian < 14; meridian += 1) {
    const shellMeridian = torus(root, `PHARMACOLOGY__P4__DIAGONAL_MEMBRANE_MEMBER_${meridian + 1}`, 5.45, 0.028, meridian % 5 === 0 ? materials.coldLight : materials.titanium, [0, 3.0, 0], [0, meridian * Math.PI / 14, 0], Math.PI * 1.62);
    shellMeridian.scale.y = 0.82;
    shellMeridian.scale.x = 0.94;
  }
  const pore = torus(root, 'PHARMACOLOGY__P4__PROMENADE_CONTROLLED_PORE', 1.5, 0.17, materials.titanium, [0.6, 2.55, 4.75], [0, 0, 0]);
  pore.scale.x = 1.12;
  pore.rotation.z = -0.14;
  const poreLight = torus(root, 'PHARMACOLOGY__P4__PROMENADE_PORE_LIGHT', 1.28, 0.04, materials.concentrationLight.clone(), [0.6, 2.55, 4.82], [0, 0, 0]);
  poreLight.scale.x = 1.12;
  poreLight.rotation.z = -0.14;
  poreLight.userData.animate = 'pharmacology-emissive-pulse';
  poreLight.userData.minIntensity = 0.8;
  poreLight.userData.maxIntensity = 4;
  poreLight.userData.speed = 0.05;

  const podRecords = [
    { p: [-2.7, 1.75, 0.9], s: [2.25, 1.25, 1.5], m: materials.boneCeramic, kind: 'OPAQUE' },
    { p: [2.45, 1.5, 1.2], s: [2.0, 1.05, 1.35], m: materials.titanium, kind: 'RIBBED' },
    { p: [-1.3, 3.55, -1.4], s: [1.7, 1.0, 1.25], m: materials.pearl, kind: 'PEARL' },
    { p: [2.4, 3.45, -1.35], s: [1.6, 0.92, 1.15], m: materials.paleCeramic, kind: 'APERTURE' },
    { p: [0.1, 2.05, -3.0], s: [2.45, 1.2, 1.35], m: materials.smokedGlass, kind: 'BANDED_A' },
    { p: [0.2, 4.45, 1.0], s: [2.2, 1.0, 1.3], m: materials.opalineGlass, kind: 'BANDED_B' },
  ] as const;
  podRecords.forEach((record, index) => {
    const pod = ellipsoid(root, `PHARMACOLOGY__P4__SUSPENDED_RESEARCH_POD_${index + 1}_${record.kind}`, record.s, record.m, record.p, true);
    pod.rotation.y = index * 0.34;
    pipe(root, `PHARMACOLOGY__P4__BRANCHING_POD_COLUMN_${index + 1}`, new THREE.Vector3(record.p[0] * 0.62, 0.24, record.p[2] * 0.62), new THREE.Vector3(record.p[0], Math.max(0.75, record.p[1] - record.s[1] * 0.42), record.p[2]), 0.09, materials.titanium, true);
    if (record.kind === 'RIBBED') {
      for (let rib = 0; rib < 11; rib += 1) {
        torus(root, `PHARMACOLOGY__P4__POD_METALLIC_RIB_${rib + 1}`, 0.72 + Math.sin(rib / 10 * Math.PI) * 0.34, 0.025, materials.darkTitanium, [record.p[0], record.p[1] - 0.72 + rib * 0.145, record.p[2]]);
      }
    } else if (record.kind === 'APERTURE') {
      for (let aperture = 0; aperture < 20; aperture += 1) {
        const angle = aperture * Math.PI * 2 / 20;
        cylinder(root, `PHARMACOLOGY__P4__POD_CIRCULAR_APERTURE_${aperture + 1}`, 0.09, 0.04, aperture % 5 === 0 ? materials.concentrationLight : materials.photovoltaic, [record.p[0] + Math.cos(angle) * 1.28, record.p[1] + Math.sin(angle) * 0.64, record.p[2] + 0.96], false, 12).rotation.x = Math.PI / 2;
      }
    } else if (record.kind.startsWith('BANDED')) {
      for (let band = 0; band < 5; band += 1) {
        torus(root, `PHARMACOLOGY__P4__POD_GLASS_CERAMIC_BAND_${index + 1}_${band + 1}`, 0.82 + band * 0.09, 0.06, band % 2 ? materials.boneCeramic : materials.clearGlass, [record.p[0], record.p[1] - 0.5 + band * 0.25, record.p[2]]);
      }
    }
  });

  const podConnections = [[0, 2], [2, 5], [5, 3], [3, 1], [1, 4], [4, 0]] as const;
  podConnections.forEach(([from, to], index) => {
    const a = podRecords[from];
    const b = podRecords[to];
    pipe(root, `PHARMACOLOGY__P4__ENCLOSED_POD_BRIDGE_${index + 1}`, new THREE.Vector3(...a.p), new THREE.Vector3(...b.p), 0.12, materials.clearGlass);
  });

  const conduitPath = Array.from({ length: 18 }, (_, index) => {
    const angle = index / 18 * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * 4.7, 2.2 + Math.sin(angle * 3) * 0.55, Math.sin(angle) * 4.15);
  });
  tubePath(root, 'PHARMACOLOGY__P4__MICROFLUIDIC_CIRCULATION_NETWORK', conduitPath, 0.065, materials.crystallineGlass, true);
  for (let node = 0; node < 9; node += 1) {
    const point = conduitPath[node * 2];
    ellipsoid(root, `PHARMACOLOGY__P4__MICROFLUIDIC_SWITCH_NODE_${node + 1}`, [0.2, 0.2, 0.2], node % 3 === 0 ? materials.concentrationLight : materials.titanium, point.toArray() as [number, number, number]);
  }
  for (let capsule = 0; capsule < 5; capsule += 1) {
    const carrier = ellipsoid(root, `PHARMACOLOGY__P4__ROBOTIC_TRANSPORT_CAPSULE_${capsule + 1}`, [0.18, 0.1, 0.1], materials.coldLight.clone(), conduitPath[capsule * 3].toArray() as [number, number, number]);
    carrier.userData.animate = 'pharmacology-path-transit';
    carrier.userData.path = conduitPath.map((point) => point.toArray());
    carrier.userData.speed = 0.015 + capsule * 0.002;
    carrier.userData.phase = capsule / 5;
  }

  for (let pylon = 0; pylon < 3; pylon += 1) {
    const x = -2.8 + pylon * 2.8;
    box(root, `PHARMACOLOGY__P4__REINFORCED_ISOLATION_PYLON_${pylon + 1}`, [0.72, 3.2, 0.9], materials.charcoalCeramic, [x, 1.65, -4.65], true);
    box(root, `PHARMACOLOGY__P4__EMERGENCY_ISOLATION_GATE_${pylon + 1}`, [0.48, 1.5, 0.14], materials.amberStatus, [x, 1.3, -5.13]);
  }
  for (let basin = 0; basin < 12; basin += 1) {
    const angle = basin / 12 * Math.PI * 2;
    const x = Math.cos(angle) * 6.8;
    const z = Math.sin(angle) * 6.2;
    ellipse(root, `PHARMACOLOGY__P4__${basin % 3 === 0 ? 'STILL_WATER' : basin % 3 === 1 ? 'HYDROPHILIC_AGGREGATE' : 'HYDROPHOBIC_STONE'}_BASIN_${basin + 1}`, [2.2, 1.3], 0.055, basin % 3 === 0 ? materials.water : basin % 3 === 1 ? materials.paleAggregate : materials.porousStone, [x, FLOOR_Y + 0.02, z]);
    if (basin % 2 === 0) ellipsoid(root, `PHARMACOLOGY__P4__SPHERICAL_LANDSCAPE_SEAT_${basin + 1}`, [0.42, 0.34, 0.42], materials.paleCeramic, [x * 0.92, 0.34, z * 0.92], true);
  }
}

function addChronopharm(root: THREE.Group, materials: PharmacologyMaterials) {
  const profile = new THREE.Shape();
  profile.moveTo(-6.0, 0);
  profile.lineTo(-4.7, 0);
  profile.bezierCurveTo(-4.0, 0.15, -3.6, 3.4, -2.25, 7.25);
  profile.bezierCurveTo(-1.75, 8.75, -1.0, 9.55, -0.15, 9.6);
  profile.bezierCurveTo(1.2, 9.45, 1.9, 7.1, 3.0, 5.1);
  profile.bezierCurveTo(4.05, 3.25, 5.15, 1.45, 6.2, 0.65);
  profile.lineTo(6.2, 0);
  profile.closePath();
  const towerGeometry = new THREE.ExtrudeGeometry(profile, {
    depth: 4.7,
    bevelEnabled: true,
    bevelSize: 0.08,
    bevelThickness: 0.08,
    bevelSegments: 3,
    curveSegments: 48,
  });
  towerGeometry.translate(0, 0, -2.35);
  const tower = prepare(new THREE.Mesh(towerGeometry, materials.smokedGlass), 'PHARMACOLOGY__P5__CONCENTRATION_TIME_TOWER', true);
  tower.position.y = 0.22;
  root.add(tower);
  ellipse(root, 'PHARMACOLOGY__P5__CRESCENT_BASALT_PODIUM', [12.8, 7.2], 0.32, materials.basalt, [0, 0.16, 0], true);

  const profileHeight = (x: number) => {
    if (x < -4.7) return 0.35;
    if (x < -0.15) {
      const t = (x + 4.7) / 4.55;
      return 0.45 + Math.pow(t, 1.35) * 9.15;
    }
    const t = (x + 0.15) / 6.35;
    return 9.6 * Math.pow(Math.max(0, 1 - t), 0.72) + t * 0.35;
  };
  for (let fin = 0; fin < 31; fin += 1) {
    const x = -5.65 + fin * (11.45 / 30);
    const height = Math.max(0.5, profileHeight(x) - 0.2);
    const depth = 0.08 + ((fin * 7) % 5) * 0.025;
    box(root, `PHARMACOLOGY__P5__COMPUTER_CONTROLLED_VERTICAL_FIN_${fin + 1}`, [0.075, height, depth], fin % 6 === 0 ? materials.coldLight : materials.titanium, [x, 0.28 + height * 0.5, 2.43]);
  }
  const facadeBandHeights = [0.72, 1.12, 1.5, 1.86, 2.2, 2.55, 2.92, 3.35, 3.86, 4.46, 5.18, 6.05, 7.08, 8.22, 9.05];
  facadeBandHeights.forEach((height, index) => {
    const width = Math.max(1.6, 11.3 - height * 0.62);
    box(root, `PHARMACOLOGY__P5__EXPONENTIAL_HALF_LIFE_BAND_${index + 1}`, [width, 0.075, 0.11], index % 2 ? materials.paleCeramic : materials.titanium, [0.05 - height * 0.07, height + 0.22, 2.48]);
  });
  const tracePoints = [
    new THREE.Vector3(-5.8, 0.7, 2.55),
    new THREE.Vector3(-4.5, 0.9, 2.55),
    new THREE.Vector3(-3.4, 3.6, 2.55),
    new THREE.Vector3(-2.25, 7.4, 2.55),
    new THREE.Vector3(-0.2, 9.85, 2.55),
    new THREE.Vector3(1.5, 8.0, 2.55),
    new THREE.Vector3(3.1, 5.2, 2.55),
    new THREE.Vector3(4.7, 2.7, 2.55),
    new THREE.Vector3(6.0, 0.95, 2.55),
  ];
  const trace = tubePath(root, 'PHARMACOLOGY__P5__LUMINOUS_CONCENTRATION_TIME_TRACE', tracePoints, 0.065, materials.concentrationLight.clone());
  trace.userData.animate = 'pharmacology-emissive-pulse';
  trace.userData.minIntensity = 0.45;
  trace.userData.maxIntensity = 4.3;
  trace.userData.speed = 0.045;

  const doseDialCenter = new THREE.Vector3(0, FLOOR_Y + 0.18, 7.75);
  for (let sector = 0; sector < 24; sector += 1) {
    const start = sector / 24 * Math.PI * 2;
    const end = (sector + 0.82) / 24 * Math.PI * 2;
    const points = [new THREE.Vector2(Math.cos(start) * 0.7, Math.sin(start) * 0.7)];
    for (let step = 0; step <= 5; step += 1) {
      const angle = THREE.MathUtils.lerp(start, end, step / 5);
      points.push(new THREE.Vector2(Math.cos(angle) * 4.7, Math.sin(angle) * 4.7));
    }
    points.push(new THREE.Vector2(Math.cos(end) * 0.7, Math.sin(end) * 0.7));
    shapePlate(root, `PHARMACOLOGY__P5__DOSE_DIAL_SECTOR_${sector + 1}`, points, sector % 3 === 0 ? materials.palePaving : sector % 3 === 1 ? materials.darkPaving : materials.paleAggregate, doseDialCenter.toArray() as [number, number, number]);
  }
  pipe(root, 'PHARMACOLOGY__P5__INCLINED_SCIENTIFIC_SUNDIAL_MAST', new THREE.Vector3(0, 0.22, 7.75), new THREE.Vector3(1.4, 5.25, 7.15), 0.12, materials.titanium, true);
  const programmedMarker = ellipsoid(root, 'PHARMACOLOGY__P5__PROGRAMMED_THERAPEUTIC_TIME_MARKER', [0.18, 0.18, 0.18], materials.coldLight.clone(), [4.0, 0.28, 7.75]);
  programmedMarker.userData.animate = 'pharmacology-orbit';
  programmedMarker.userData.centerX = 0;
  programmedMarker.userData.centerZ = 7.75;
  programmedMarker.userData.baseY = 0.28;
  programmedMarker.userData.orbitRadius = 4.0;
  programmedMarker.userData.speed = 0.045;
  for (let curve = 0; curve < 7; curve += 1) {
    const wall = torus(root, `PHARMACOLOGY__P5__ENGRAVED_CONCENTRATION_CURVE_WALL_${curve + 1}`, 4.95 + curve * 0.11, 0.06, curve % 2 ? materials.basalt : materials.titanium, [0, 0.32 + curve * 0.02, 7.75], [Math.PI / 2, 0, 0], Math.PI * 0.34);
    wall.rotation.z = 1.05 + curve * 0.22;
  }

  const terraceRecords = [
    [1.7, 6.7, 2.3, materials.porousStone],
    [3.0, 4.7, 2.6, materials.planting],
    [4.2, 3.0, 2.9, materials.paleAggregate],
    [5.2, 1.65, 3.15, materials.planting],
  ] as const;
  terraceRecords.forEach(([x, y, z, material], index) => {
    box(root, `PHARMACOLOGY__P5__SIMULATION_TERRACE_${index + 1}`, [2.3, 0.16, 1.35], material, [x, y, z]);
    box(root, `PHARMACOLOGY__P5__TERRACE_WIND_BARRIER_${index + 1}`, [2.3, 0.72, 0.06], materials.clearGlass, [x, y + 0.44, z + 0.68]);
    pipe(root, `PHARMACOLOGY__P5__CAGED_MAINTENANCE_STAIR_${index + 1}`, new THREE.Vector3(x - 1.0, Math.max(0.25, y - 1.15), z - 0.55), new THREE.Vector3(x - 1.0, y, z - 0.55), 0.035, materials.titanium);
  });
  for (let capsule = 0; capsule < 7; capsule += 1) {
    box(root, `PHARMACOLOGY__P5__PROJECTING_SIMULATION_CAPSULE_${capsule + 1}`, [0.75, 0.46, 0.55], capsule % 2 ? materials.clearGlass : materials.opalineGlass, [-2.9 + capsule * 1.28, 1.2 + (capsule % 3) * 0.82, -2.6]);
  }

  box(root, 'PHARMACOLOGY__P5__MEDICAL_TRANSLATION_BRIDGE', [5.6, 0.52, 0.88], materials.clearGlass, [8.7, 3.45, 0.6]);
  root.getObjectByName('PHARMACOLOGY__P5__MEDICAL_TRANSLATION_BRIDGE')!.rotation.y = -0.08;
  box(root, 'PHARMACOLOGY__P5__TOXICOLOGY_PROTECTED_BRIDGE', [4.0, 0.68, 1.0], materials.charcoalCeramic, [-7.85, 2.65, -0.25]);
  for (let shell = 0; shell < 2; shell += 1) {
    box(root, `PHARMACOLOGY__P5__TOXICOLOGY_BRIDGE_DOUBLE_SHELL_${shell + 1}`, [4.15, 0.08, 1.15 + shell * 0.18], materials.darkTitanium, [-7.85, 2.98 + shell * 0.1, -0.25]);
  }
  pipe(root, 'PHARMACOLOGY__P5__SUBROAD_AUTOMATED_LOGISTICS_CONDUIT', new THREE.Vector3(1.0, 0.2, -2.6), new THREE.Vector3(1.0, -0.65, -6.8), 0.24, materials.photovoltaic);

  for (let ring = 0; ring < 4; ring += 1) {
    const crown = torus(root, `PHARMACOLOGY__P5__BIOLOGICAL_CYCLE_CROWN_RING_${ring + 1}`, 1.5 + ring * 0.18, 0.05, ring === 3 ? materials.coldLight : materials.titanium, [-0.2 + ring * 0.12, 10.45 + ring * 0.12, 0], [Math.PI / 2 + ring * 0.08, ring * 0.13, 0]);
    crown.scale.z = 0.62;
    if (ring === 3) {
      crown.userData.animate = 'pharmacology-orbit-spin';
      crown.userData.speed = 0.018;
    }
  }
}

function createBuilding(record: PharmacologyBuildingProgram, materials: PharmacologyMaterials) {
  const root = new THREE.Group();
  root.name = `PHARMACOLOGY__${record.code}__${record.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  root.userData = {
    selectableId: DISTRICT_ID,
    individualSelectableId: `${DISTRICT_ID}__${record.code.toLowerCase()}`,
    districtId: DISTRICT_ID,
    exteriorProgram: true,
    pharmacologyBuilding: true,
    buildingCode: record.code,
    displayName: record.name,
    purpose: record.purpose,
    placementZone: record.placementZone,
    exteriorMotif: record.exteriorMotif,
    footprintMetres: [...record.footprintMetres],
    heightMetres: record.heightMetres,
    featureRole: 'building',
    featureTag: record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  };
  switch (record.form) {
    case 'nexus': addPharmakonNexus(root, materials); break;
    case 'ternary': addTernaryGate(root, materials); break;
    case 'scriptorium': addScriptorium(root, materials); break;
    case 'vectorium': addVectorium(root, materials); break;
    case 'chronopharm': addChronopharm(root, materials); break;
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
  const radialMargin = 5.4;
  const angularMargin = (sector.endAngle - sector.startAngle) * 0.055;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT);
  const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
  return new THREE.Vector3(
    Math.cos(angle) * radius - definition.position[0],
    y,
    Math.sin(angle) * radius - definition.position[2],
  );
}

function addDistrictInfrastructure(
  district: THREE.Group,
  definition: DistrictDefinition,
  materials: PharmacologyMaterials,
) {
  const infrastructure = new THREE.Group();
  infrastructure.name = 'PHARMACOLOGY__DOSE_RESPONSE_INFRASTRUCTURE';

  const promenade = Array.from({ length: 64 }, (_, index) => pointInDistrict(definition, 0.01 + index / 63 * 0.97, 0.5, FLOOR_Y));
  addLocalRibbon(infrastructure, 'PHARMACOLOGY__DOSE_RESPONSE_PROMENADE', promenade, 2.05, materials.palePaving);
  addLocalRibbon(infrastructure, 'PHARMACOLOGY__PROMENADE_INSTRUMENTATION_SEAM', promenade.map((point) => point.clone().setY(FLOOR_Y + 0.018)), 0.07, materials.concentrationLight, false);

  for (let light = 0; light < 74; light += 1) {
    const normalized = 1 - Math.pow(1 - light / 73, 1.9);
    const center = pointInDistrict(definition, 0.02 + normalized * 0.94, 0.5, FLOOR_Y + 0.028);
    const side = light % 2 ? -1 : 1;
    const angle = definition.sector!.centerAngle;
    const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    center.addScaledVector(tangent, side * (0.45 + (light % 3) * 0.19));
    cylinder(infrastructure, `PHARMACOLOGY__CONCENTRATION_LIGHT_POINT_${light + 1}`, 0.035, 0.008, light % 9 === 0 ? materials.coldLight : materials.concentrationLight, center.toArray() as [number, number, number], false, 12);
  }

  for (let branch = 0; branch < 4; branch += 1) {
    const side = branch % 2 ? 1 : -1;
    const startRadial = 0.18 + Math.floor(branch / 2) * 0.31;
    const points = Array.from({ length: 28 }, (_, index) => {
      const t = index / 27;
      const radialT = startRadial + t * 0.26;
      const curve = Math.sin(t * Math.PI) * (0.12 + branch * 0.012) * side;
      return pointInDistrict(definition, radialT, 0.5 + curve, FLOOR_Y + 0.012);
    });
    const channel = addLocalRibbon(infrastructure, `PHARMACOLOGY__PHARMACOKINETIC_WATER_BRANCH_${branch + 1}`, points, 0.34, materials.water, false);
    channel.userData.concentrationTimeCurve = branch < 2 ? 'rapid-rise-peak-decay' : 'delayed-distribution-decay';
  }

  const toxicologyRoute = Array.from({ length: 48 }, (_, index) => pointInDistrict(definition, 0.04 + index / 47 * 0.92, 0.07, FLOOR_Y));
  const medicalRoute = Array.from({ length: 48 }, (_, index) => pointInDistrict(definition, 0.04 + index / 47 * 0.92, 0.93, FLOOR_Y));
  const service = addLocalRibbon(infrastructure, 'PHARMACOLOGY__TOXICOLOGY_SHIELDED_SERVICE_ROUTE', toxicologyRoute, 1.05, materials.basalt, false);
  service.userData.restrictedContainmentRoute = true;
  addLocalRibbon(infrastructure, 'PHARMACOLOGY__MEDICAL_TRANSLATION_WALK', medicalRoute, 1.15, materials.palePaving);
  addLocalRibbon(infrastructure, 'PHARMACOLOGY__MEDICAL_TRANSLATION_GLASS_EDGE', medicalRoute.map((point) => point.clone().setY(FLOOR_Y + 0.016)), 0.055, materials.coldLight, false);
  district.add(infrastructure);
  return infrastructure;
}

function addDistrictLandscape(
  district: THREE.Group,
  definition: DistrictDefinition,
  materials: PharmacologyMaterials,
) {
  const landscape = new THREE.Group();
  landscape.name = 'PHARMACOLOGY__MOLECULAR_RECOGNITION_LANDSCAPE';
  for (let planter = 0; planter < 24; planter += 1) {
    const medicalSide = planter >= 10;
    const angularT = medicalSide ? 0.73 + (planter - 10) * 0.014 : 0.16 + planter * 0.014;
    const radialT = 0.11 + (planter % 7) * 0.12;
    const point = pointInDistrict(definition, radialT, angularT, FLOOR_Y);
    ellipse(landscape, `PHARMACOLOGY__${medicalSide ? 'PALE_MEDICINAL' : 'BASALT_CONTAINMENT'}_PLANTER_${planter + 1}`, [1.6, 0.72], 0.18, medicalSide ? materials.paleAggregate : materials.basalt, [point.x, 0.09, point.z]);
    for (let plant = 0; plant < 3; plant += 1) {
      ellipsoid(landscape, `PHARMACOLOGY__CONTROLLED_LOW_PLANT_${planter + 1}_${plant + 1}`, [0.22, 0.3, 0.22], materials.planting, [point.x - 0.38 + plant * 0.38, 0.34, point.z]);
    }
  }
  for (let needle = 0; needle < 18; needle += 1) {
    const point = pointInDistrict(definition, 0.08 + (needle % 9) * 0.105, needle % 2 ? 0.25 : 0.68, FLOOR_Y);
    cylinder(landscape, `PHARMACOLOGY__SCIENTIFIC_LIGHT_NEEDLE_${needle + 1}`, 0.09, 0.82, materials.titanium, [point.x, 0.41, point.z], false, 12);
    ellipsoid(landscape, `PHARMACOLOGY__LIGHT_NEEDLE_SENSOR_${needle + 1}`, [0.12, 0.12, 0.12], needle % 3 ? materials.concentrationLight : materials.coldLight, [point.x, 0.87, point.z]);
  }
  district.add(landscape);
  return landscape;
}

export function buildPharmacologyDistrict(
  district: THREE.Group,
  definition: DistrictDefinition,
) {
  if (!definition.sector) throw new Error('Pharmacology Labs District requires a masterplan sector');
  const materials = createPharmacologyMaterials();
  const infrastructure = addDistrictInfrastructure(district, definition, materials);
  const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = PHARMACOLOGY_BUILDING_PROGRAM.map((record) => {
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

  facilities.forEach((facility, index) => {
    const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, Number(facility.userData.footprintMetres?.[1] ?? 80) / 20 + 0.7);
    const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const promenadePoint = pointInDistrict(definition, PHARMACOLOGY_BUILDING_PROGRAM[index].radialT, 0.5, FLOOR_Y + 0.01);
    const midpoint = promenadePoint.clone().add(entrance).multiplyScalar(0.5);
    midpoint.x += (index % 2 ? -1 : 1) * 0.35;
    addLocalRibbon(infrastructure, `PHARMACOLOGY__BUILDING_APPROACH_${PHARMACOLOGY_BUILDING_PROGRAM[index].code}`, [promenadePoint, midpoint, entrance], 0.72, index === 2 ? materials.palePaving : materials.darkPaving);
  });

  district.userData.pharmacologyDistrict = {
    identity: 'The Therapeutic Gradient',
    progression: ['molecular recognition', 'induced proximity', 'programmable medicines', 'targeted delivery', 'patient-specific pharmacokinetics'],
    architecturalLanguage: 'receptor binding, dose response, membrane transport, and concentration-time control enlarged to urban scale',
    buildingCount: facilities.length,
    buildings: PHARMACOLOGY_BUILDING_PROGRAM.map((record) => ({
      code: record.code,
      name: record.name,
      purpose: record.purpose,
      placementZone: record.placementZone,
      heightMetres: record.heightMetres,
      exteriorMotif: record.exteriorMotif,
    })),
    skyline: ['Pharmakon Nexus', 'The Ternary Gate', 'Scriptorium Therapeutica', 'Vectorium Aegis', 'Chronopharm Observatory'],
    circulation: {
      primaryPromenade: 'PHARMACOLOGY__DOSE_RESPONSE_PROMENADE',
      concentrationLightCount: 74,
      pharmacokineticWaterBranches: 4,
      toxicologyServiceEdge: 'PHARMACOLOGY__TOXICOLOGY_SHIELDED_SERVICE_ROUTE',
      medicalTranslationEdge: 'PHARMACOLOGY__MEDICAL_TRANSLATION_WALK',
      publicAndContainmentTrafficSeparated: true,
    },
    materials: [
      'bone-white responsive ceramic',
      'pale satin titanium',
      'smoked electrochromic glass',
      'dark basalt',
      'black photovoltaic glass',
      'iridescent fluoropolymer membrane',
      'cold-white and mint instrumentation light',
    ],
    responsiveSystems: {
      facadePanels: 140,
      microfluidicCapsules: 5,
      slowArchitecturalMotion: true,
      advertisingDisplays: false,
    },
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: PHARMACOLOGY_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: [
      'Dose-Response Promenade',
      'Ligand Field',
      'pharmacokinetic water branches',
      'microfluidic capsule network',
      'Dose Dial plaza',
    ],
    realizedFeatureTags: PHARMACOLOGY_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 8,
    radialCoverage: 0.93,
    angularCoverage: 0.91,
    exteriorOnly: true,
    therapeuticGradient: true,
  };
}
