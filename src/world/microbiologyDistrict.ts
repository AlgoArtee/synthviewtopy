import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';

type MicrobiologyBuildingForm = 'lytic' | 'symbiome' | 'foundry' | 'brine' | 'sentinel';

export interface MicrobiologyBuildingProgram {
  code: string;
  name: string;
  purpose: string;
  form: MicrobiologyBuildingForm;
  footprintMetres: readonly [number, number];
  heightMetres: number;
  radialT: number;
  angularT: number;
  placementZone: string;
  exteriorMotif: string;
}

export const MICROBIOLOGY_BUILDING_PROGRAM: readonly MicrobiologyBuildingProgram[] = [
  {
    code: 'M1',
    name: 'The Lytic Crown',
    purpose: 'Institute for Phage Engineering and Antimicrobial Resistance',
    form: 'lytic',
    footprintMetres: [140, 140],
    heightMetres: 110,
    radialT: 0.30,
    angularT: 0.50,
    placementZone: 'Inner district threshold and Lysis Court',
    exteriorMotif: 'faceted phage geometry and expanding lysis zones',
  },
  {
    code: 'M2',
    name: 'The Symbiome Terraces',
    purpose: 'Center for Microbiome Therapeutics and Engineered Microbial Communities',
    form: 'symbiome',
    footprintMetres: [175, 150],
    heightMetres: 80,
    radialT: 0.24,
    angularT: 0.14,
    placementZone: 'Western garden and water-channel edge',
    exteriorMotif: 'interdependent communities and metabolic networks',
  },
  {
    code: 'M3',
    name: 'The Metabolite Foundry',
    purpose: 'Institute for Microbial Natural Products and Precision Fermentation',
    form: 'foundry',
    footprintMetres: [210, 135],
    heightMetres: 150,
    radialT: 0.24,
    angularT: 0.86,
    placementZone: 'Eastern production and service edge',
    exteriorMotif: 'fermentation vessels and biosynthetic machinery',
  },
  {
    code: 'M4',
    name: 'The Black Brine Observatory',
    purpose: 'Center for Extremophile Microbiology and Astrobiological Systems',
    form: 'brine',
    footprintMetres: [170, 145],
    heightMetres: 92,
    radialT: 0.86,
    angularT: 0.27,
    placementZone: 'Outer mineral ridge and contained basin field',
    exteriorMotif: 'extreme environments and planetary simulation',
  },
  {
    code: 'M5',
    name: 'The One Health Sentinel',
    purpose: 'Center for Emerging Pathogens and Planetary Microbial Surveillance',
    form: 'sentinel',
    footprintMetres: [190, 190],
    heightMetres: 120,
    radialT: 0.83,
    angularT: 0.70,
    placementZone: 'Outer boulevard planetary-surveillance landmark',
    exteriorMotif: 'global surveillance and a protected biological core',
  },
] as const;

const DISTRICT_ID = 'microbiology-labs';
const FLOOR_Y = 0.036;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const UNIT_CYLINDER_24 = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 24, 14);
const UNIT_Y = new THREE.Vector3(0, 1, 0);
const UNIT_X = new THREE.Vector3(1, 0, 0);

type MicrobiologyMaterials = ReturnType<typeof createMicrobiologyMaterials>;

function districtMaterial(
  name: string,
  color: THREE.ColorRepresentation,
  options: THREE.MeshStandardMaterialParameters = {},
) {
  return new THREE.MeshStandardMaterial({
    name,
    color,
    roughness: 0.62,
    metalness: 0.14,
    ...options,
  });
}

function createMicrobiologyMaterials() {
  const paleCeramic = districtMaterial('Microbiology pale antimicrobial ceramic', '#e7ece7', { roughness: 0.72, metalness: 0.03 });
  const pearlCeramic = districtMaterial('Microbiology pearl glazed ceramic', '#cddfd9', { roughness: 0.46, metalness: 0.05 });
  const greenCeramic = districtMaterial('Microbiology symbiome green ceramic', '#75a897', { roughness: 0.58, metalness: 0.04 });
  const amberCeramic = districtMaterial('Microbiology metabolite amber ceramic', '#bc8a53', { roughness: 0.52, metalness: 0.1 });
  const titanium = districtMaterial('Microbiology silver titanium', '#aebcba', { roughness: 0.28, metalness: 0.88 });
  const darkTitanium = districtMaterial('Microbiology dark titanium', '#314047', { roughness: 0.34, metalness: 0.82 });
  const bronzeTitanium = districtMaterial('Microbiology bronze titanium', '#81674e', { roughness: 0.34, metalness: 0.78 });
  const basalt = districtMaterial('Microbiology sterilized basalt foundation', '#111719', { roughness: 0.9, metalness: 0.03 });
  const blackCeramic = districtMaterial('Black Brine sintered black ceramic', '#090d10', { roughness: 0.78, metalness: 0.18 });
  const mineralStone = districtMaterial('Black Brine volcanic mineral stone', '#272423', { roughness: 1, metalness: 0 });
  const iridescentGlass = districtMaterial('Microbiology cyan green violet iridescent glass', '#69cfd0', {
    emissive: '#376d78', emissiveIntensity: 0.25, roughness: 0.08, metalness: 0.16, transparent: true, opacity: 0.56, side: THREE.DoubleSide,
  });
  const smokedGlass = districtMaterial('Microbiology smoked silver glass', '#1b323b', {
    emissive: '#183443', emissiveIntensity: 0.2, roughness: 0.12, metalness: 0.32, transparent: true, opacity: 0.76, side: THREE.DoubleSide,
  });
  const amberGlass = districtMaterial('Metabolite amber scientific glass', '#d99b4f', {
    emissive: '#7b421b', emissiveIntensity: 0.27, roughness: 0.08, metalness: 0.08, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
  });
  const clearGlass = districtMaterial('Microbiology clear environmental glass', '#9ee7df', {
    emissive: '#43877f', emissiveIntensity: 0.18, roughness: 0.06, metalness: 0.02, transparent: true, opacity: 0.38, side: THREE.DoubleSide,
  });
  const palePaving = districtMaterial('Microbiology polished pale pedestrian paving', '#bbc5c0', { roughness: 0.88, metalness: 0.02, side: THREE.DoubleSide });
  const charcoalPaving = districtMaterial('Microbiology charcoal colony plaza paving', '#30383a', { roughness: 0.93, metalness: 0.02, side: THREE.DoubleSide });
  const blackWater = districtMaterial('Microbiology black reflecting water', '#07151a', {
    emissive: '#0c3440', emissiveIntensity: 0.2, roughness: 0.04, metalness: 0.22, transparent: true, opacity: 0.84, side: THREE.DoubleSide,
  });
  const cyanWater = districtMaterial('Microbiology cyan biosensor water', '#2f7d83', {
    emissive: '#2b727c', emissiveIntensity: 0.22, roughness: 0.04, metalness: 0.12, transparent: true, opacity: 0.76, side: THREE.DoubleSide,
  });
  const redMineral = districtMaterial('Black Brine rust-red mineral shelf', '#7d3b2d', { roughness: 0.92, metalness: 0.04 });
  const planting = districtMaterial('Microbiology controlled biosensor planting', '#4f735c', { roughness: 0.98, metalness: 0 });
  const moss = districtMaterial('Symbiome moss and medicinal planting', '#638967', { roughness: 1, metalness: 0 });
  const coldLight = districtMaterial('Microbiology cold-white instrumentation light', '#e9ffff', { emissive: '#c7ffff', emissiveIntensity: 3.5, roughness: 0.12 });
  const cyanLight = districtMaterial('Microbiology cyan communication light', '#72f2d0', { emissive: '#42e8c1', emissiveIntensity: 3.3, roughness: 0.12 });
  const cobaltLight = districtMaterial('Lytic Crown cobalt cycle light', '#559dff', { emissive: '#276aff', emissiveIntensity: 3.4, roughness: 0.12 });
  const amberLight = districtMaterial('Metabolite Foundry amber process light', '#ffd18a', { emissive: '#ff9c31', emissiveIntensity: 3.2, roughness: 0.12 });
  const violetLight = districtMaterial('Black Brine ultraviolet fissure light', '#a671ff', { emissive: '#713bff', emissiveIntensity: 3.6, roughness: 0.12 });
  [coldLight, cyanLight, cobaltLight, amberLight, violetLight].forEach((material) => { material.userData.isDistrictAccent = true; });
  return {
    paleCeramic, pearlCeramic, greenCeramic, amberCeramic, titanium, darkTitanium, bronzeTitanium,
    basalt, blackCeramic, mineralStone, iridescentGlass, smokedGlass, amberGlass, clearGlass,
    palePaving, charcoalPaving, blackWater, cyanWater, redMineral, planting, moss,
    coldLight, cyanLight, cobaltLight, amberLight, violetLight,
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
  const mesh = prepare(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, segments), material), name, obstacle);
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
  mesh.scale.set(direction.length() + 0.12, height, width);
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

function addRibbon(
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
  mesh.userData.microbiologyRoute = true;
  parent.add(mesh);
  return mesh;
}

function crescent(
  parent: THREE.Object3D,
  name: string,
  width: number,
  depth: number,
  height: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  obstacle = true,
) {
  const points: THREE.Vector2[] = [];
  for (let index = 0; index <= 32; index += 1) {
    const angle = THREE.MathUtils.lerp(-2.18, 2.18, index / 32);
    points.push(new THREE.Vector2(Math.cos(angle) * width * 0.5, Math.sin(angle) * depth * 0.5));
  }
  for (let index = 0; index <= 28; index += 1) {
    const angle = THREE.MathUtils.lerp(2.18, -2.18, index / 28);
    points.push(new THREE.Vector2(Math.cos(angle) * width * 0.29 - width * 0.08, Math.sin(angle) * depth * 0.29));
  }
  const shape = new THREE.Shape(points);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.035,
    bevelSegments: 2,
    curveSegments: 20,
  });
  geometry.rotateX(-Math.PI / 2);
  const mesh = prepare(new THREE.Mesh(geometry, material), name, obstacle);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function annularVolume(
  parent: THREE.Object3D,
  name: string,
  outerRadius: number,
  innerRadius: number,
  height: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  obstacle = true,
) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 64 });
  geometry.rotateX(-Math.PI / 2);
  const mesh = prepare(new THREE.Mesh(geometry, material), name, obstacle);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function wedgeVolume(
  parent: THREE.Object3D,
  name: string,
  width: number,
  frontHeight: number,
  rearHeight: number,
  depth: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  obstacle = true,
) {
  const shape = new THREE.Shape([
    new THREE.Vector2(-width * 0.5, 0),
    new THREE.Vector2(width * 0.5, 0),
    new THREE.Vector2(width * 0.5, rearHeight),
    new THREE.Vector2(-width * 0.5, frontHeight),
  ]);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
  geometry.translate(0, 0, -depth * 0.5);
  const mesh = prepare(new THREE.Mesh(geometry, material), name, obstacle);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function pulse(object: THREE.Object3D, speed: number, phase = 0, minIntensity = 0.45, maxIntensity = 3.8) {
  object.userData.animate = 'microbiology-emissive-pulse';
  object.userData.speed = speed;
  object.userData.phase = phase;
  object.userData.minIntensity = minIntensity;
  object.userData.maxIntensity = maxIntensity;
  return object;
}

function addLyticCrown(root: THREE.Group, materials: MicrobiologyMaterials) {
  cylinder(root, 'MICROBIOLOGY__M1__HEXAGONAL_BASALT_FOUNDATION', 14.6, 0.34, materials.basalt, [0, 0.17, 0], true, 12);
  for (let arm = 0; arm < 6; arm += 1) {
    const angle = arm / 6 * Math.PI * 2;
    const armGroup = new THREE.Group();
    armGroup.name = `MICROBIOLOGY__M1__RADIAL_LAB_ARM_${arm + 1}`;
    armGroup.rotation.y = angle;
    root.add(armGroup);
    box(armGroup, `MICROBIOLOGY__M1__FIVE_STOREY_PLINTH_ARM_${arm + 1}`, [4.0, 4.75, 5.6], materials.paleCeramic, [0, 2.55, 4.05], true);
    box(armGroup, `MICROBIOLOGY__M1__SMOKED_WINDOW_BAND_${arm + 1}`, [3.5, 0.46, 0.08], materials.smokedGlass, [0, 3.05, 6.88]);
    for (let panel = 0; panel < 14; panel += 1) {
      const column = panel % 7;
      const row = Math.floor(panel / 7);
      const diameter = 0.12 + column * 0.018;
      const disc = cylinder(armGroup, `MICROBIOLOGY__M1__LYSIS_PERFORATION_${arm + 1}_${panel + 1}`, diameter, 0.035, panel % 5 === 0 ? materials.cobaltLight : materials.darkTitanium, [-1.45 + column * 0.48, 1.35 + row * 1.55, 6.94], false, 12);
      disc.rotation.x = Math.PI / 2;
    }
  }

  cylinder(root, 'MICROBIOLOGY__M1__CENTRAL_CAPSID_CORE', 5.5, 10.6, materials.smokedGlass, [0, 5.65, 0], true, 6);
  for (let wing = 0; wing < 6; wing += 1) {
    const angle = wing / 6 * Math.PI * 2;
    const group = new THREE.Group();
    group.name = `MICROBIOLOGY__M1__FACETED_CROWN_WING_${wing + 1}`;
    group.rotation.y = angle;
    root.add(group);
    const volume = box(group, `MICROBIOLOGY__M1__OUTWARD_LEANING_WING_${wing + 1}`, [2.45, 9.7, 2.15], wing % 2 ? materials.smokedGlass : materials.darkTitanium, [0, 6.15, 1.8], true);
    volume.rotation.x = -0.035;
    box(group, `MICROBIOLOGY__M1__TITANIUM_EDGE_FIN_${wing + 1}`, [0.18, 10.1, 0.46], materials.titanium, [1.22, 6.15, 2.38]);
    for (let level = 0; level < 7; level += 1) {
      const x = ((level * 5 + wing * 3) % 9 - 4) * 0.18;
      box(group, `MICROBIOLOGY__M1__IRREGULAR_MUTATION_WINDOW_${wing + 1}_${level + 1}`, [0.62, 0.18, 0.08], level % 3 === 0 ? materials.cobaltLight : materials.iridescentGlass, [x, 2.35 + level * 1.12, 2.92]);
    }
  }

  ellipse(root, 'MICROBIOLOGY__M1__LYSIS_COURT', [13.8, 8.0], 0.06, materials.charcoalPaving, [0, FLOOR_Y, 10.0]);
  ellipse(root, 'MICROBIOLOGY__M1__BLACK_REFLECTING_BASIN', [9.8, 4.6], 0.05, materials.blackWater, [0, FLOOR_Y + 0.03, 10.0]);
  box(root, 'MICROBIOLOGY__M1__STRAIGHT_BASIN_BRIDGE', [2.0, 0.12, 7.0], materials.palePaving, [0, 0.12, 10.0]);
  for (let ring = 0; ring < 5; ring += 1) {
    const marker = torus(root, `MICROBIOLOGY__M1__EXPANDING_LYSIS_RING_${ring + 1}`, 1.2 + ring * 0.8, 0.045, ring % 2 ? materials.cobaltLight.clone() : materials.paleCeramic, [0, 0.09, 10.0]);
    if (ring % 2) pulse(marker, 0.025, ring * 0.8, 0.25, 3.4);
  }
  const entrance = wedgeVolume(root, 'MICROBIOLOGY__M1__TRIANGULAR_ENTRANCE_VOID', 3.0, 0.3, 3.4, 0.22, materials.smokedGlass, [0, 0.45, 6.94], false);
  entrance.rotation.x = 0;
  for (let plate = 0; plate < 30; plate += 1) {
    const column = plate % 10;
    const row = Math.floor(plate / 10);
    const hex = cylinder(root, `MICROBIOLOGY__M1__KINETIC_HEX_PLATE_${plate + 1}`, 0.28, 0.035, plate % 6 === 0 ? materials.cobaltLight.clone() : materials.titanium, [-2.0 + column * 0.44, 4.05 + row * 0.36, 7.03], false, 6);
    hex.rotation.x = Math.PI / 2;
    if (plate % 6 === 0) pulse(hex, 0.02, plate * 0.4);
  }

  for (let column = 0; column < 4; column += 1) {
    const x = -8.0 + column * 1.15;
    cylinder(root, `MICROBIOLOGY__M1__ENVIRONMENTAL_TEST_COLUMN_${column + 1}`, 0.72, 3.5, materials.clearGlass, [x, 2.0, 0.8]);
    cylinder(root, `MICROBIOLOGY__M1__TEST_COLUMN_FLUID_${column + 1}`, 0.48, 2.85, column % 2 ? materials.cyanWater : materials.amberGlass, [x, 1.82, 0.8]);
    for (let bubble = 0; bubble < 3; bubble += 1) {
      const particle = ellipsoid(root, `MICROBIOLOGY__M1__TEST_COLUMN_BUBBLE_${column + 1}_${bubble + 1}`, [0.09, 0.09, 0.09], materials.coldLight, [x, 0.55 + bubble * 0.7, 0.8]);
      particle.userData.animate = 'microbiology-column-current';
      particle.userData.baseY = 0.48;
      particle.userData.travel = 2.55;
      particle.userData.speed = 0.025 + bubble * 0.004;
      particle.userData.phase = (column * 3 + bubble) / 12;
    }
  }
  for (let frame = 0; frame < 7; frame += 1) {
    box(root, `MICROBIOLOGY__M1__ANTIMICROBIAL_SURFACE_FRAME_${frame + 1}`, [0.72, 1.65, 0.12], frame % 3 === 0 ? materials.titanium : frame % 3 === 1 ? materials.paleCeramic : materials.darkTitanium, [4.1 + frame * 0.76, 1.1, -3.8]);
  }
  for (let vent = 0; vent < 6; vent += 1) {
    const angle = vent / 6 * Math.PI * 2;
    const x = Math.cos(angle) * 2.15;
    const z = Math.sin(angle) * 2.15;
    const tower = cylinder(root, `MICROBIOLOGY__M1__SCULPTURAL_VENTILATION_TOWER_${vent + 1}`, 0.52, 2.3, materials.titanium, [x, 12.05, z], false, 6);
    tower.scale.x = 0.75;
  }
  const crownRing = torus(root, 'MICROBIOLOGY__M1__DISTANT_IDENTITY_CROWN_RING', 2.85, 0.09, materials.cobaltLight.clone(), [0, 11.15, 0]);
  pulse(crownRing, 0.04, 0, 1.2, 4.3);
  for (let sensor = 0; sensor < 9; sensor += 1) {
    const angle = sensor / 9 * Math.PI * 2;
    pipe(root, `MICROBIOLOGY__M1__AIRBORNE_PARTICLE_SENSOR_${sensor + 1}`, new THREE.Vector3(Math.cos(angle) * 0.5, 11.0, Math.sin(angle) * 0.5), new THREE.Vector3(Math.cos(angle) * 1.45, 13.2 + (sensor % 3) * 0.35, Math.sin(angle) * 1.45), 0.035, materials.titanium);
  }
}

function addSymbiomeTerraces(root: THREE.Group, materials: MicrobiologyMaterials) {
  ellipse(root, 'MICROBIOLOGY__M2__COMMENSAL_GARDEN_FOUNDATION', [17.2, 15.0], 0.18, materials.palePaving, [0, 0.09, 0], true);
  const records = [
    { name: 'BOULEVARD', angle: 0, shift: [0, 0, -3.5] as const, levels: 8, material: materials.pearlCeramic },
    { name: 'WATER', angle: 2.12, shift: [-3.2, 0, 2.0] as const, levels: 5, material: materials.greenCeramic },
    { name: 'GARDEN', angle: -2.12, shift: [3.2, 0, 2.0] as const, levels: 4, material: materials.paleCeramic },
  ];
  records.forEach((record, buildingIndex) => {
    const building = new THREE.Group();
    building.name = `MICROBIOLOGY__M2__${record.name}_CRESCENT`;
    building.rotation.y = record.angle;
    building.position.set(record.shift[0], record.shift[1], record.shift[2]);
    root.add(building);
    for (let level = 0; level < record.levels; level += 1) {
      const volume = crescent(building, `MICROBIOLOGY__M2__${record.name}_TERRACE_LEVEL_${level + 1}`, 8.6 - level * 0.27, 7.4 - level * 0.2, 0.72, level % 3 === 2 ? materials.iridescentGlass : record.material, [0.12 * level, 0.22 + level * 0.76, 0], true);
      volume.rotation.y = (level - record.levels * 0.5) * 0.012;
      for (let bed = 0; bed < 3; bed += 1) {
        box(building, `MICROBIOLOGY__M2__${record.name}_CONTROLLED_TERRACE_BED_${level + 1}_${bed + 1}`, [1.05, 0.14, 0.46], bed === 1 ? materials.moss : materials.planting, [-1.45 + bed * 1.45, 0.98 + level * 0.76, 2.65 - level * 0.09]);
      }
    }
    for (let fin = 0; fin < 18; fin += 1) {
      const x = -3.35 + fin * (6.7 / 17);
      const height = 1.6 + ((fin * 5 + buildingIndex * 3) % 7) * 0.34;
      const facadeFin = box(building, `MICROBIOLOGY__M2__${record.name}_NETWORK_FIN_${fin + 1}`, [0.06, height, 0.18], fin % 5 === 0 ? materials.cyanLight.clone() : materials.titanium, [x, 0.48 + height * 0.5, 3.35]);
      facadeFin.rotation.z = Math.sin(fin * 1.7) * 0.08;
      if (fin % 5 === 0) pulse(facadeFin, 0.025, fin * 0.45);
    }
    for (let window = 0; window < 5; window += 1) {
      const observation = torus(building, `MICROBIOLOGY__M2__${record.name}_CULTURE_PLATE_WINDOW_${window + 1}`, 0.3 + window * 0.045, 0.06, window % 2 ? materials.iridescentGlass : materials.cyanLight, [-2.8 + window * 1.4, 1.45 + (window % 3) * 0.92, 3.5], [0, 0, 0]);
      observation.scale.x = 1 + (window % 2) * 0.35;
    }
  });

  ellipse(root, 'MICROBIOLOGY__M2__CENTRAL_COMMENSAL_POOL', [4.8, 4.8], 0.07, materials.cyanWater, [0, 0.22, 0]);
  for (let column = 0; column < 7; column += 1) {
    const angle = column / 7 * Math.PI * 2;
    cylinder(root, `MICROBIOLOGY__M2__WATER_FILM_SENSOR_COLUMN_${column + 1}`, 0.25, 1.2 + (column % 3) * 0.32, materials.titanium, [Math.cos(angle) * 1.45, 0.85 + (column % 3) * 0.16, Math.sin(angle) * 1.45], false, 12);
  }
  const gardenPaths = [0, Math.PI * 2 / 3, Math.PI * 4 / 3];
  gardenPaths.forEach((angle, index) => addRibbon(root, `MICROBIOLOGY__M2__BRANCHING_GARDEN_PATH_${index + 1}`, [
    new THREE.Vector3(Math.cos(angle) * 1.7, 0.25, Math.sin(angle) * 1.7),
    new THREE.Vector3(Math.cos(angle + 0.14) * 4.1, 0.25, Math.sin(angle + 0.14) * 4.1),
    new THREE.Vector3(Math.cos(angle) * 7.2, 0.25, Math.sin(angle) * 7.2),
  ], 0.62, materials.charcoalPaving));

  const podRecords = [
    [-3.0, 0.9, 1.4, materials.moss], [3.25, 0.85, 1.25, materials.cyanWater],
    [-1.9, 0.82, -3.15, materials.amberCeramic], [2.0, 0.88, -3.1, materials.planting],
  ] as const;
  podRecords.forEach(([x, y, z, innerMaterial], index) => {
    ellipsoid(root, `MICROBIOLOGY__M2__SEALED_ECOSYSTEM_DROPLET_${index + 1}`, [1.15, 1.45, 1.05], materials.clearGlass, [x, y + 0.55, z], true);
    ellipsoid(root, `MICROBIOLOGY__M2__ECOSYSTEM_ASSEMBLAGE_${index + 1}`, [0.7, 0.28, 0.62], innerMaterial, [x, y, z]);
  });
  for (let dome = 0; dome < 3; dome += 1) {
    const domeMesh = ellipsoid(root, `MICROBIOLOGY__M2__ROOFTOP_CULTIVATION_DOME_${dome + 1}`, [1.0, 0.8, 1.0], materials.clearGlass, [-2.3 + dome * 2.3, 7.25 - dome * 0.25, -3.7]);
    domeMesh.scale.y *= 0.65;
    for (let cell = 0; cell < 6; cell += 1) torus(root, `MICROBIOLOGY__M2__DOME_SHADING_CELL_${dome + 1}_${cell + 1}`, 0.2 + cell * 0.085, 0.025, materials.titanium, [-2.3 + dome * 2.3, 7.15 - dome * 0.25, -3.7], [Math.PI / 2, cell * 0.25, 0]);
  }
  for (let channel = 0; channel < 5; channel += 1) {
    pipe(root, `MICROBIOLOGY__M2__VISIBLE_RAINWATER_CHANNEL_${channel + 1}`, new THREE.Vector3(-5.2 + channel * 2.6, 5.8 - (channel % 2) * 1.3, -2.9), new THREE.Vector3(-5.2 + channel * 2.6, 0.28, -4.7), 0.045, materials.titanium);
  }
}

function addMetaboliteFoundry(root: THREE.Group, materials: MicrobiologyMaterials) {
  box(root, 'MICROBIOLOGY__M3__FOUNDRY_BASALT_FOUNDATION', [21.0, 0.3, 13.5], materials.basalt, [0, 0.15, 0], true);
  box(root, 'MICROBIOLOGY__M3__TRANSPARENT_CATHEDRAL_HALL', [16.0, 8.8, 6.3], materials.amberGlass, [0, 4.65, 0], true);
  for (let bay = 0; bay < 13; bay += 1) {
    const x = -7.75 + bay * (15.5 / 12);
    box(root, `MICROBIOLOGY__M3__EXPOSED_HALL_RIB_${bay + 1}`, [0.12, 9.1, 6.6], materials.titanium, [x, 4.7, 0]);
    const leftRoof = slabBetween(root, `MICROBIOLOGY__M3__FOLDED_ROOF_LEFT_${bay + 1}`, new THREE.Vector3(x, 8.85, -3.2), new THREE.Vector3(x, 10.2, 0), 0.12, 0.11, materials.darkTitanium, false);
    const rightRoof = slabBetween(root, `MICROBIOLOGY__M3__FOLDED_ROOF_RIGHT_${bay + 1}`, new THREE.Vector3(x, 10.2, 0), new THREE.Vector3(x, 8.85, 3.2), 0.12, 0.11, materials.darkTitanium, false);
    leftRoof.userData.roofRib = true;
    rightRoof.userData.roofRib = true;
  }
  for (let vessel = 0; vessel < 8; vessel += 1) {
    const x = -6.2 + vessel * 1.78;
    cylinder(root, `MICROBIOLOGY__M3__VISIBLE_FERMENTATION_VESSEL_${vessel + 1}`, 1.05, 5.4 + (vessel % 3) * 0.65, vessel % 2 ? materials.titanium : materials.amberCeramic, [x, 3.1 + (vessel % 3) * 0.32, 0], false, 24);
    torus(root, `MICROBIOLOGY__M3__VESSEL_STATUS_RING_${vessel + 1}`, 0.58, 0.05, vessel % 3 === 0 ? materials.amberLight.clone() : materials.darkTitanium, [x, 5.0, 0]);
  }

  const towers = [
    { x: -8.4, z: -4.5, h: 10.0, material: materials.titanium, label: 'STAINLESS' },
    { x: -8.4, z: 4.5, h: 12.0, material: materials.bronzeTitanium, label: 'THERMAL' },
    { x: 8.4, z: -4.5, h: 13.5, material: materials.clearGlass, label: 'TRANSLUCENT' },
    { x: 8.4, z: 4.5, h: 15.0, material: materials.blackCeramic, label: 'BLACK_CERAMIC' },
  ];
  towers.forEach((tower, towerIndex) => {
    cylinder(root, `MICROBIOLOGY__M3__${tower.label}_PRODUCTION_TOWER`, 3.75, tower.h, tower.material, [tower.x, tower.h * 0.5 + 0.3, tower.z], true, 32);
    for (let level = 0; level < 7; level += 1) {
      const y = 1.2 + level * ((tower.h - 1.2) / 7);
      torus(root, `MICROBIOLOGY__M3__${tower.label}_SERVICE_PLATFORM_${level + 1}`, 2.08, 0.09, level % 3 === 0 ? materials.amberLight : materials.darkTitanium, [tower.x, y, tower.z]);
    }
    for (let pipeIndex = 0; pipeIndex < 4; pipeIndex += 1) {
      const angle = (pipeIndex + 0.5) / 4 * Math.PI * 2;
      pipe(root, `MICROBIOLOGY__M3__${tower.label}_EXPOSED_PIPE_${pipeIndex + 1}`, new THREE.Vector3(tower.x + Math.cos(angle) * 2.0, 0.45, tower.z + Math.sin(angle) * 2.0), new THREE.Vector3(tower.x + Math.cos(angle) * 2.0, tower.h - 0.2, tower.z + Math.sin(angle) * 2.0), 0.08 + pipeIndex * 0.012, pipeIndex % 2 ? materials.cyanLight : materials.titanium);
    }
    const bridgeZ = tower.z < 0 ? -2.65 : 2.65;
    const bridgeX = tower.x < 0 ? -5.25 : 5.25;
    box(root, `MICROBIOLOGY__M3__ELEVATED_PROCESS_BRIDGE_${towerIndex + 1}`, [3.0, 0.62, 1.0], materials.clearGlass, [bridgeX, 5.2 + towerIndex * 0.35, bridgeZ]);
  });

  box(root, 'MICROBIOLOGY__M3__POINTED_ENTRY_CANOPY', [8.2, 0.24, 4.6], materials.amberGlass, [0, 3.3, 5.2]);
  root.getObjectByName('MICROBIOLOGY__M3__POINTED_ENTRY_CANOPY')!.rotation.x = -0.16;
  for (let stair = 0; stair < 8; stair += 1) {
    box(root, `MICROBIOLOGY__M3__CONCENTRATION_GRADIENT_STEP_${stair + 1}`, [7.0 - stair * 0.35, 0.12, 0.62], stair % 2 ? materials.charcoalPaving : materials.palePaving, [0, 0.06 + stair * 0.12, 8.0 - stair * 0.52]);
  }
  for (let link = 0; link < 12; link += 1) {
    const x = -5.5 + link;
    const chain = ellipsoid(root, `MICROBIOLOGY__M3__METABOLITE_SPINE_LINK_${link + 1}`, [0.48, 0.26, 0.28], link % 3 === 0 ? materials.amberLight.clone() : link % 2 ? materials.titanium : materials.iridescentGlass, [x, 1.15 + Math.sin(link * 0.7) * 0.4, 9.1]);
    chain.rotation.z = link * 0.4;
    if (link % 3 === 0) pulse(chain, 0.035, link * 0.4);
  }
  for (let line = 0; line < 5; line += 1) {
    pipe(root, `MICROBIOLOGY__M3__REAR_COLOR_CODED_PIPE_${line + 1}`, new THREE.Vector3(-7.5, 1.1 + line * 0.48, -3.5), new THREE.Vector3(7.5, 1.1 + line * 0.48, -3.5), 0.06, line % 3 === 0 ? materials.amberLight : line % 3 === 1 ? materials.cyanLight : materials.titanium);
  }
  for (let condenser = 0; condenser < 8; condenser += 1) {
    box(root, `MICROBIOLOGY__M3__ROOF_HEAT_RECOVERY_ARRAY_${condenser + 1}`, [1.25, 0.38, 0.82], materials.darkTitanium, [-5.2 + condenser * 1.5, 9.42, -1.45 + (condenser % 2) * 2.9]);
  }
  for (const x of [-1.2, 1.2]) {
    pipe(root, `MICROBIOLOGY__M3__BRANCHED_EXHAUST_TRUNK_${x < 0 ? 'WEST' : 'EAST'}`, new THREE.Vector3(x, 9.0, 0), new THREE.Vector3(x, 13.0, 0), 0.19, materials.titanium);
    for (let branch = 0; branch < 3; branch += 1) pipe(root, `MICROBIOLOGY__M3__EXHAUST_BRANCH_${x < 0 ? 'WEST' : 'EAST'}_${branch + 1}`, new THREE.Vector3(x, 12.0, 0), new THREE.Vector3(x + (branch - 1) * 1.1, 14.0, (branch % 2 ? 1 : -1) * 0.8), 0.11, materials.titanium);
  }
}

function addBlackBrineObservatory(root: THREE.Group, materials: MicrobiologyMaterials) {
  ellipse(root, 'MICROBIOLOGY__M4__ARTIFICIAL_MINERAL_RIDGE', [18.0, 13.5], 1.0, materials.mineralStone, [0, 0.05, 0], true);
  wedgeVolume(root, 'MICROBIOLOGY__M4__BROAD_BLACK_MONOLITH', 11.5, 5.8, 8.5, 8.2, materials.blackCeramic, [-1.5, 0.45, -0.6], true);
  wedgeVolume(root, 'MICROBIOLOGY__M4__BURIED_PRESSURE_BLOCK', 8.5, 2.8, 4.2, 6.0, materials.darkTitanium, [3.8, 0.25, 3.8], true);
  box(root, 'MICROBIOLOGY__M4__THERMAL_CHIMNEY', [3.1, 10.4, 3.2], materials.blackCeramic, [3.7, 5.5, -3.1], true);
  box(root, 'MICROBIOLOGY__M4__CHIMNEY_LUMINOUS_FISSURE', [0.18, 9.8, 3.26], materials.violetLight.clone(), [3.72, 5.6, -3.1]);
  pulse(root.getObjectByName('MICROBIOLOGY__M4__CHIMNEY_LUMINOUS_FISSURE')!, 0.018, 0, 0.35, 4.5);
  box(root, 'MICROBIOLOGY__M4__DEEP_ANGULAR_ENTRANCE_CUT', [3.1, 4.3, 0.25], materials.smokedGlass, [-2.2, 2.4, 3.58]);
  for (let wall = 0; wall < 2; wall += 1) {
    const side = wall ? 1 : -1;
    const canyonWall = box(root, `MICROBIOLOGY__M4__DESCENDING_ENTRANCE_CANYON_${wall + 1}`, [0.7, 4.8, 8.5], materials.mineralStone, [-2.2 + side * 2.2, 2.0, 6.9], true);
    canyonWall.rotation.z = side * 0.08;
  }
  torus(root, 'MICROBIOLOGY__M4__PRESSURE_LOCK_DOOR_RING', 1.35, 0.16, materials.coldLight, [-2.2, 1.75, 3.42], [0, 0, 0]);
  cylinder(root, 'MICROBIOLOGY__M4__FACETED_PRESSURE_LOCK_DOOR', 2.4, 0.22, materials.darkTitanium, [-2.2, 1.75, 3.4], false, 12).rotation.x = Math.PI / 2;

  const podRecords = [
    { p: [-7.2, 2.0, -3.8] as const, s: [1.6, 1.45, 1.6] as const, material: materials.titanium, kind: 'CRYOGENIC' },
    { p: [-7.9, 1.8, 1.0] as const, s: [1.45, 1.7, 1.45] as const, material: materials.blackCeramic, kind: 'THERMAL' },
    { p: [-6.0, 1.7, 4.5] as const, s: [1.7, 1.35, 1.35] as const, material: materials.darkTitanium, kind: 'PRESSURE' },
    { p: [7.2, 1.75, 2.4] as const, s: [1.5, 1.6, 1.5] as const, material: materials.amberGlass, kind: 'HYPERSALINE' },
    { p: [7.1, 2.0, -3.0] as const, s: [1.55, 1.55, 1.55] as const, material: materials.paleCeramic, kind: 'RADIATION' },
  ];
  podRecords.forEach((record, index) => {
    ellipsoid(root, `MICROBIOLOGY__M4__${record.kind}_TEST_POD_${index + 1}`, record.s, record.material, record.p, true);
    torus(root, `MICROBIOLOGY__M4__${record.kind}_OBSERVATION_WINDOW_${index + 1}`, 0.42, 0.09, index === 3 ? materials.amberLight : materials.coldLight, [record.p[0], record.p[1], record.p[2] + record.s[2] * 0.5], [0, 0, 0]);
    pipe(root, `MICROBIOLOGY__M4__SEALED_BRIDGE_TUBE_${index + 1}`, new THREE.Vector3(record.p[0] * 0.62, record.p[1], record.p[2] * 0.62), new THREE.Vector3(record.p[0], record.p[1], record.p[2]), 0.26, materials.clearGlass);
  });

  const basins = [
    { p: [-5.0, 7.3] as const, d: [5.2, 3.3] as const, material: materials.blackWater, name: 'BLACK' },
    { p: [0.8, 8.0] as const, d: [4.8, 3.0] as const, material: materials.cyanWater, name: 'TURQUOISE' },
    { p: [6.0, 7.1] as const, d: [4.6, 3.4] as const, material: materials.redMineral, name: 'RUST_RED' },
  ];
  basins.forEach((basin, index) => {
    ellipse(root, `MICROBIOLOGY__M4__${basin.name}_BRINE_BASIN`, basin.d, 0.08, basin.material, [basin.p[0], FLOOR_Y, basin.p[1]]);
    for (let shelf = 0; shelf < 4; shelf += 1) torus(root, `MICROBIOLOGY__M4__${basin.name}_MINERAL_SHELF_${shelf + 1}`, 0.55 + shelf * 0.33, 0.08, index === 2 ? materials.redMineral : materials.paleCeramic, [basin.p[0] + (shelf - 1.5) * 0.45, 0.13 + shelf * 0.04, basin.p[1]]);
  });
  for (let platform = 0; platform < 5; platform += 1) {
    const y = 2.0 + platform * 1.45;
    box(root, `MICROBIOLOGY__M4__THERMAL_SENSOR_PLATFORM_${platform + 1}`, [1.65, 0.14, 1.25], materials.darkTitanium, [3.7, y, -4.4]);
    pipe(root, `MICROBIOLOGY__M4__PLATFORM_SENSOR_MAST_${platform + 1}`, new THREE.Vector3(3.7, y, -4.4), new THREE.Vector3(3.7 + (platform % 2 ? 0.5 : -0.5), y + 1.1, -4.4), 0.035, materials.titanium);
  }
  const tracker = torus(root, 'MICROBIOLOGY__M4__ROTATING_PLANETARY_INSTRUMENT', 1.25, 0.14, materials.titanium, [-0.8, 10.0, -0.6], [Math.PI / 2, 0.35, 0]);
  tracker.userData.animate = 'microbiology-rotation';
  tracker.userData.speed = 0.018;
}

function addOneHealthSentinel(root: THREE.Group, materials: MicrobiologyMaterials) {
  ellipse(root, 'MICROBIOLOGY__M5__OVAL_GLOBAL_GRID_PLAZA', [20.0, 13.0], 0.12, materials.palePaving, [0, 0.06, 3.5], true);
  annularVolume(root, 'MICROBIOLOGY__M5__SEVEN_STOREY_OUTER_RING', 9.5, 6.3, 7.0, materials.iridescentGlass, [0, 0.28, 0], true);
  for (let band = 0; band < 7; band += 1) {
    torus(root, `MICROBIOLOGY__M5__OUTER_RING_CERAMIC_BAND_${band + 1}`, 8.05, 1.58, band % 3 === 0 ? materials.paleCeramic : band % 3 === 1 ? materials.iridescentGlass : materials.titanium, [0, 0.8 + band * 0.96, 0]);
  }
  for (let fin = 0; fin < 64; fin += 1) {
    const angle = fin / 64 * Math.PI * 2;
    const radius = 9.62;
    const facadeFin = box(root, `MICROBIOLOGY__M5__PRECISE_VERTICAL_MULLION_${fin + 1}`, [0.08, 6.65, 0.23], fin % 8 === 0 ? materials.cyanLight.clone() : materials.titanium, [Math.cos(angle) * radius, 3.72, Math.sin(angle) * radius]);
    facadeFin.rotation.y = -angle;
    if (fin % 8 === 0) pulse(facadeFin, 0.022, fin * 0.22, 0.22, 3.9);
  }

  const coreX = 1.1;
  cylinder(root, 'MICROBIOLOGY__M5__OPAQUE_CONTAINMENT_CORE', 5.8, 12.0, materials.paleCeramic, [coreX, 6.28, 0], true, 48);
  for (let window = 0; window < 9; window += 1) {
    const angle = window / 9 * Math.PI * 2;
    box(root, `MICROBIOLOGY__M5__CORE_PROTECTED_WINDOW_${window + 1}`, [0.8, 0.16, 0.08], materials.smokedGlass, [coreX + Math.cos(angle) * 2.92, 7.0 + (window % 3) * 1.25, Math.sin(angle) * 2.92]);
    root.getObjectByName(`MICROBIOLOGY__M5__CORE_PROTECTED_WINDOW_${window + 1}`)!.rotation.y = -angle;
  }
  box(root, 'MICROBIOLOGY__M5__DARK_VERTICAL_SERVICE_BAND', [1.05, 10.5, 0.28], materials.darkTitanium, [coreX - 2.75, 5.5, 0]);
  cylinder(root, 'MICROBIOLOGY__M5__DARK_MONITORING_CROWN', 8.2, 2.0, materials.smokedGlass, [coreX, 12.35, 0], true, 48);
  const roofRing = torus(root, 'MICROBIOLOGY__M5__OPERATIONAL_ROOFLINE_RING', 4.15, 0.08, materials.coldLight.clone(), [coreX, 13.35, 0]);
  pulse(roofRing, 0.016, 0, 0.8, 4.2);

  for (let bridge = 0; bridge < 4; bridge += 1) {
    const angle = bridge / 4 * Math.PI * 2;
    const start = new THREE.Vector3(coreX + Math.cos(angle) * 2.8, 5.2, Math.sin(angle) * 2.8);
    const end = new THREE.Vector3(Math.cos(angle) * 6.9, 5.2, Math.sin(angle) * 6.9);
    slabBetween(root, `MICROBIOLOGY__M5__ENCLOSED_CORE_BRIDGE_${bridge + 1}`, start, end, 1.0, 0.76, materials.clearGlass);
  }
  const portalNames = ['HUMAN_HEALTH', 'ANIMAL_HEALTH', 'ENVIRONMENTAL_SYSTEMS', 'PLANETARY_SURVEILLANCE'];
  portalNames.forEach((name, portal) => {
    const angle = portal / 4 * Math.PI * 2;
    const position = new THREE.Vector3(Math.cos(angle) * 9.8, 2.8, Math.sin(angle) * 9.8);
    const portalGlass = box(root, `MICROBIOLOGY__M5__${name}_ENTRANCE_PORTAL`, [2.5, 5.1, 0.24], materials.clearGlass, position.toArray() as [number, number, number]);
    portalGlass.rotation.y = -angle;
    const canopyEnd = new THREE.Vector3(Math.cos(angle) * 10.6, 5.0 + portal * 0.14, Math.sin(angle) * 10.6);
    slabBetween(root, `MICROBIOLOGY__M5__${name}_SAMPLING_CANOPY`, new THREE.Vector3(Math.cos(angle) * 8.7, 5.0, Math.sin(angle) * 8.7), canopyEnd, 2.25 - portal * 0.2, 0.18, portal % 2 ? materials.titanium : materials.paleCeramic, false);
  });

  const landscapeMaterials = [materials.cyanWater, materials.charcoalPaving, materials.planting, materials.mineralStone];
  const landscapeNames = ['CONSTRUCTED_WETLAND', 'URBAN_DRAINAGE', 'AGRICULTURAL_SOIL', 'WOODLAND_DECOMPOSITION'];
  for (let sector = 0; sector < 4; sector += 1) {
    const angle = sector / 4 * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(angle) * 9.6;
    const z = Math.sin(angle) * 9.6;
    ellipse(root, `MICROBIOLOGY__M5__${landscapeNames[sector]}_SAMPLING_GARDEN`, [3.2, 2.4], 0.1, landscapeMaterials[sector], [x, 0.12, z]);
    for (let pylon = 0; pylon < 5; pylon += 1) {
      const offset = (pylon - 2) * 0.72;
      cylinder(root, `MICROBIOLOGY__M5__${landscapeNames[sector]}_SAMPLING_PYLON_${pylon + 1}`, 0.16, 0.95 + (pylon % 2) * 0.32, materials.titanium, [x + Math.cos(angle + Math.PI / 2) * offset, 0.55, z + Math.sin(angle + Math.PI / 2) * offset], false, 12);
    }
  }
  ellipse(root, 'MICROBIOLOGY__M5__ELLIPTICAL_MIST_WATER_FEATURE', [8.8, 1.8], 0.05, materials.cyanWater, [0, 0.16, 10.7]);
  for (let nozzle = 0; nozzle < 18; nozzle += 1) {
    const x = -4.6 + nozzle * (9.2 / 17);
    cylinder(root, `MICROBIOLOGY__M5__MIST_NOZZLE_${nozzle + 1}`, 0.06, 0.1 + (nozzle % 4) * 0.08, nozzle % 5 === 0 ? materials.cyanLight : materials.titanium, [x, 0.23, 10.7], false, 12);
  }
  for (let mast = 0; mast < 12; mast += 1) {
    const angle = mast / 12 * Math.PI * 2;
    pipe(root, `MICROBIOLOGY__M5__AIR_SAMPLING_MAST_${mast + 1}`, new THREE.Vector3(coreX + Math.cos(angle) * 3.0, 13.1, Math.sin(angle) * 3.0), new THREE.Vector3(coreX + Math.cos(angle) * 3.35, 15.0 + (mast % 3) * 0.3, Math.sin(angle) * 3.35), 0.035, materials.titanium);
  }
  const monitor = torus(root, 'MICROBIOLOGY__M5__PLANETARY_BIOLOGICAL_MONITOR', 1.3, 0.14, materials.titanium, [coreX, 14.4, 0], [Math.PI / 2, 0.3, 0]);
  monitor.userData.animate = 'microbiology-rotation';
  monitor.userData.speed = 0.014;
}

function createBuilding(record: MicrobiologyBuildingProgram, materials: MicrobiologyMaterials) {
  const root = new THREE.Group();
  root.name = `MICROBIOLOGY__${record.code}__${record.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  root.userData = {
    selectableId: DISTRICT_ID,
    individualSelectableId: `${DISTRICT_ID}__${record.code.toLowerCase()}`,
    districtId: DISTRICT_ID,
    exteriorProgram: true,
    microbiologyBuilding: true,
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
    case 'lytic': addLyticCrown(root, materials); break;
    case 'symbiome': addSymbiomeTerraces(root, materials); break;
    case 'foundry': addMetaboliteFoundry(root, materials); break;
    case 'brine': addBlackBrineObservatory(root, materials); break;
    case 'sentinel': addOneHealthSentinel(root, materials); break;
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
  const radialMargin = 5.8;
  const angularMargin = (sector.endAngle - sector.startAngle) * 0.06;
  const radius = THREE.MathUtils.lerp(sector.innerRadius + radialMargin, sector.outerRadius - radialMargin, radialT);
  const angle = THREE.MathUtils.lerp(sector.startAngle + angularMargin, sector.endAngle - angularMargin, angularT);
  return new THREE.Vector3(
    Math.cos(angle) * radius - definition.position[0],
    y,
    Math.sin(angle) * radius - definition.position[2],
  );
}

function districtArc(
  definition: DistrictDefinition,
  radialT: number,
  startAngularT: number,
  endAngularT: number,
  segments: number,
  y = FLOOR_Y,
) {
  return Array.from({ length: segments }, (_, index) => (
    pointInDistrict(
      definition,
      radialT,
      THREE.MathUtils.lerp(startAngularT, endAngularT, index / (segments - 1)),
      y,
    )
  ));
}

function districtSpine(
  definition: DistrictDefinition,
  angularT: number,
  startRadialT: number,
  endRadialT: number,
  segments: number,
  y = FLOOR_Y,
) {
  return Array.from({ length: segments }, (_, index) => (
    pointInDistrict(
      definition,
      THREE.MathUtils.lerp(startRadialT, endRadialT, index / (segments - 1)),
      angularT,
      y,
    )
  ));
}

function addDistrictInfrastructure(
  district: THREE.Group,
  definition: DistrictDefinition,
  materials: MicrobiologyMaterials,
) {
  const infrastructure = new THREE.Group();
  infrastructure.name = 'MICROBIOLOGY__DISTRICT_SYSTEMS';
  const roadHierarchy = [
    {
      name: 'MICROBIOLOGY__INNER_COLONY_ARC',
      points: districtArc(definition, 0.045, 0.10, 0.90, 64),
      width: 1.55,
      material: materials.charcoalPaving,
    },
    {
      name: 'MICROBIOLOGY__WEST_RESEARCH_SPINE',
      points: districtSpine(definition, 0.30, 0.045, 0.56, 42),
      width: 1.28,
      material: materials.palePaving,
    },
    {
      name: 'MICROBIOLOGY__EAST_RESEARCH_SPINE',
      points: districtSpine(definition, 0.70, 0.045, 0.56, 42),
      width: 1.28,
      material: materials.palePaving,
    },
    {
      name: 'MICROBIOLOGY__OUTER_RESEARCH_ARC',
      points: districtArc(definition, 0.56, 0.28, 0.72, 40),
      width: 1.42,
      material: materials.charcoalPaving,
    },
  ] as const;

  roadHierarchy.forEach((route, index) => {
    addRibbon(infrastructure, route.name, route.points, route.width, route.material);
    const communicationLine = addRibbon(
      infrastructure,
      `MICROBIOLOGY__INTERBUILDING_COMMUNICATION_LINK_${index + 1}`,
      route.points.map((point) => point.clone().setY(FLOOR_Y + 0.022)),
      0.055,
      materials.cyanLight.clone(),
      false,
    );
    communicationLine.userData.animate = 'microbiology-network-signal';
    communicationLine.userData.speed = 0.026 + index * 0.002;
    communicationLine.userData.phase = index * 1.15;
  });

  [0.255, 0.745].forEach((angularT, channel) => {
    const points = districtSpine(definition, angularT, 0.13, 0.51, 32, FLOOR_Y + 0.012);
    addRibbon(
      infrastructure,
      `MICROBIOLOGY__SHALLOW_RESEARCH_WATER_CHANNEL_${channel + 1}`,
      points,
      0.27,
      channel === 0 ? materials.blackWater : materials.cyanWater,
      false,
    );
  });

  const plazas = [
    { radialT: 0.045, angularT: 0.50, material: materials.palePaving },
    { radialT: 0.56, angularT: 0.30, material: materials.charcoalPaving },
    { radialT: 0.56, angularT: 0.70, material: materials.charcoalPaving },
  ];
  plazas.forEach((plaza, index) => {
    const point = pointInDistrict(definition, plaza.radialT, plaza.angularT, FLOOR_Y + 0.03);
    ellipse(infrastructure, `MICROBIOLOGY__COLONY_PLAZA_${index + 1}`, [4.1, 4.1], 0.06, plaza.material, point.toArray() as [number, number, number]);
    for (let ring = 0; ring < 2; ring += 1) {
      torus(
        infrastructure,
        `MICROBIOLOGY__COLONY_PLAZA_RING_${index + 1}_${ring + 1}`,
        0.7 + ring * 0.7,
        0.035,
        ring === 1 ? materials.cyanLight : materials.titanium,
        [point.x, FLOOR_Y + 0.07, point.z],
      );
    }
  });
  district.add(infrastructure);
  return infrastructure;
}

function addDistrictLandscape(
  district: THREE.Group,
  definition: DistrictDefinition,
  materials: MicrobiologyMaterials,
) {
  const landscape = new THREE.Group();
  landscape.name = 'MICROBIOLOGY__BIOSENSOR_LANDSCAPE';
  for (let garden = 0; garden < 24; garden += 1) {
    const radialT = 0.06 + (garden % 8) * 0.12;
    const angularT = garden % 2 ? 0.30 - Math.floor(garden / 8) * 0.04 : 0.70 + Math.floor(garden / 8) * 0.04;
    const point = pointInDistrict(definition, radialT, angularT, FLOOR_Y);
    ellipse(landscape, `MICROBIOLOGY__BIOSENSOR_GARDEN_${garden + 1}`, [1.9, 0.9], 0.14, garden % 3 === 0 ? materials.moss : materials.planting, [point.x, 0.1, point.z]);
    for (let sensor = 0; sensor < 2; sensor += 1) {
      cylinder(landscape, `MICROBIOLOGY__GARDEN_SENSOR_PYLON_${garden + 1}_${sensor + 1}`, 0.1, 0.62 + sensor * 0.2, materials.titanium, [point.x - 0.38 + sensor * 0.76, 0.35 + sensor * 0.1, point.z], false, 12);
      ellipsoid(landscape, `MICROBIOLOGY__GARDEN_SENSOR_NODE_${garden + 1}_${sensor + 1}`, [0.11, 0.11, 0.11], garden % 4 === 0 ? materials.cyanLight : materials.coldLight, [point.x - 0.38 + sensor * 0.76, 0.72 + sensor * 0.2, point.z]);
    }
  }
  district.add(landscape);
  return landscape;
}

export function buildMicrobiologyDistrict(
  district: THREE.Group,
  definition: DistrictDefinition,
) {
  if (!definition.sector) throw new Error('Microbiology Labs District requires a masterplan sector');
  const materials = createMicrobiologyMaterials();
  const infrastructure = addDistrictInfrastructure(district, definition, materials);
  const landscape = addDistrictLandscape(district, definition, materials);
  const facilities = MICROBIOLOGY_BUILDING_PROGRAM.map((record) => {
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
    const entranceLocal = new THREE.Vector3(0, FLOOR_Y + 0.012, Number(facility.userData.footprintMetres?.[1] ?? 100) / 20 + 0.8);
    const entrance = entranceLocal.applyQuaternion(facility.quaternion).add(facility.position);
    const record = MICROBIOLOGY_BUILDING_PROGRAM[index];
    const isOuterFacility = record.radialT > 0.6;
    const routeAngularT = isOuterFacility
      ? THREE.MathUtils.clamp(record.angularT, 0.30, 0.70)
      : record.angularT;
    const routePoint = pointInDistrict(
      definition,
      isOuterFacility ? 0.56 : 0.045,
      routeAngularT,
      FLOOR_Y + 0.01,
    );
    const midpoint = routePoint.clone().lerp(entrance, 0.5);
    addRibbon(
      infrastructure,
      `MICROBIOLOGY__BUILDING_APPROACH_${record.code}`,
      [routePoint, midpoint, entrance],
      0.72,
      materials.palePaving,
    );
  });

  district.userData.microbiologyDistrict = {
    identity: 'Microbiology Labs District',
    progression: ['microbial conflict', 'community ecology', 'biochemical production', 'extreme life', 'planetary surveillance'],
    architecturalLanguage: 'abstract microbial colonies, biofilms, phage geometry, symbiotic networks, fermentation gradients, and monitored ecosystems',
    buildingCount: facilities.length,
    buildings: MICROBIOLOGY_BUILDING_PROGRAM.map((record) => ({
      code: record.code,
      name: record.name,
      purpose: record.purpose,
      placementZone: record.placementZone,
      heightMetres: record.heightMetres,
      exteriorMotif: record.exteriorMotif,
    })),
    skyline: ['The Lytic Crown', 'The Symbiome Terraces', 'The Metabolite Foundry', 'The Black Brine Observatory', 'The One Health Sentinel'],
    circulation: {
      primaryWalk: 'MICROBIOLOGY__INNER_COLONY_ARC',
      hierarchy: ['inner colony arc', 'paired research spines', 'outer research arc', 'short building approaches'],
      majorRouteCount: 4,
      colonyPlazas: 3,
      shallowWaterChannels: 2,
      exactBuildingApproaches: 5,
      directCrossSiteDiagonals: 0,
      publicAndResearchInfrastructureLegible: true,
    },
    materials: [
      'pale antimicrobial ceramic',
      'silver titanium',
      'cyan-green-violet-amber iridescent glass',
      'sterilized basalt',
      'perforated cellular facades',
      'controlled rooftop ecology',
      'cyan microbial communication light',
    ],
    responsiveSystems: {
      slowArchitecturalMotion: true,
      activeResearchColumns: 4,
      interbuildingCommunicationLinks: 4,
      planetaryAndAtmosphericSensors: true,
      advertisingDisplays: false,
    },
    exteriorOnly: true,
  };
  district.userData.population = {
    plannedFacilities: MICROBIOLOGY_BUILDING_PROGRAM.map((record) => record.name),
    plannedObjects: [
      'Microbial Communication Network', 'Colony Plazas', 'Biosensor Gardens',
      'Shallow Research Water Channels', 'Environmental Sampling Pylons',
    ],
    realizedFeatureTags: MICROBIOLOGY_BUILDING_PROGRAM.map((record) => record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    realizedFacilityCount: facilities.length,
    realizedObjectCount: infrastructure.children.length + landscape.children.length,
    distinct: true,
    asymmetricCampus: true,
    localRoadCount: 9,
    radialCoverage: 0.93,
    angularCoverage: 0.90,
    exteriorOnly: true,
    microbialSystemsLandscape: true,
  };
}
