import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';
import { metresToWorldUnits } from '../config/island';
import { buildIndustrialRailway } from './industrialRailway';

const m = metresToWorldUnits;
const FLOOR_Y = m(0.18);
const textureCache = new Map<string, THREE.CanvasTexture>();

type BoxOptions = {
  obstacle?: boolean;
  walkable?: boolean;
  shadows?: boolean;
};

function industrialTexture(kind: 'asphalt' | 'corrugated' | 'brick' | 'concrete' | 'frost') {
  const cached = textureCache.get(kind);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d')!;
  let seed = kind.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0) * 997;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const base = {
    asphalt: '#20292d',
    corrugated: '#3d484b',
    brick: '#5b3028',
    concrete: '#727a7b',
    frost: '#c8d5d8',
  }[kind];
  context.fillStyle = base;
  context.fillRect(0, 0, 256, 256);

  if (kind === 'brick') {
    context.strokeStyle = 'rgba(18, 17, 16, 0.48)';
    context.lineWidth = 2;
    for (let y = 0; y <= 256; y += 24) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(256, y);
      context.stroke();
      const offset = (Math.floor(y / 24) % 2) * 32;
      for (let x = -offset; x < 256; x += 64) {
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x, y + 24);
        context.stroke();
      }
    }
  } else if (kind === 'corrugated') {
    for (let x = 0; x < 256; x += 9) {
      context.fillStyle = x % 18 ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.12)';
      context.fillRect(x, 0, 3, 256);
    }
  } else if (kind === 'asphalt') {
    context.strokeStyle = 'rgba(8, 12, 14, 0.45)';
    context.lineWidth = 2;
    for (let crack = 0; crack < 28; crack += 1) {
      const x = random() * 256;
      const y = random() * 256;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + (random() - 0.5) * 34, y + 8 + random() * 42);
      context.lineTo(x + (random() - 0.5) * 52, y + 28 + random() * 58);
      context.stroke();
    }
  } else if (kind === 'concrete') {
    context.strokeStyle = 'rgba(30, 36, 38, 0.22)';
    for (let line = 1; line < 4; line += 1) {
      context.beginPath();
      context.moveTo(line * 64, 0);
      context.lineTo(line * 64, 256);
      context.stroke();
    }
  } else {
    for (let index = 0; index < 42; index += 1) {
      context.fillStyle = `rgba(235, 247, 249, ${0.08 + random() * 0.18})`;
      context.beginPath();
      context.arc(random() * 256, random() * 256, 2 + random() * 12, 0, Math.PI * 2);
      context.fill();
    }
  }

  for (let index = 0; index < 700; index += 1) {
    const value = random() > 0.5 ? 255 : 0;
    context.fillStyle = `rgba(${value},${value},${value},${0.015 + random() * 0.04})`;
    context.fillRect(random() * 256, random() * 256, 1 + random() * 2, 1 + random() * 5);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === 'brick' ? 5 : 7, kind === 'corrugated' ? 3 : 7);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache.set(kind, texture);
  return texture;
}

function signTexture(title: string, subtitle = '', warning = false) {
  const key = `sign:${title}:${subtitle}:${warning}`;
  const cached = textureCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 256;
  const context = canvas.getContext('2d')!;
  context.fillStyle = warning ? '#d2b33b' : '#d2d5cf';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = warning ? '#151719' : '#4a5151';
  context.lineWidth = 18;
  context.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);
  context.fillStyle = '#171b1d';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '800 76px Arial, sans-serif';
  context.fillText(title, canvas.width / 2, subtitle ? 100 : 128, canvas.width - 56);
  if (subtitle) {
    context.font = '600 34px Arial, sans-serif';
    context.fillText(subtitle, canvas.width / 2, 184, canvas.width - 56);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache.set(key, texture);
  return texture;
}

function material(
  color: THREE.ColorRepresentation,
  options: THREE.MeshStandardMaterialParameters = {},
) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.18, ...options });
}

function addBox(
  parent: THREE.Object3D,
  name: string,
  size: readonly [number, number, number],
  mat: THREE.Material,
  position: readonly [number, number, number],
  options: BoxOptions = {},
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.name = name;
  mesh.position.set(position[0], position[1] + size[1] * 0.5, position[2]);
  mesh.castShadow = options.shadows !== false;
  mesh.receiveShadow = options.shadows !== false;
  if (options.obstacle !== false) mesh.userData.navObstacle = true;
  if (options.walkable) mesh.userData.walkable = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(
  parent: THREE.Object3D,
  name: string,
  radius: number,
  height: number,
  mat: THREE.Material,
  position: readonly [number, number, number],
  radialSegments = 16,
  obstacle = true,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.03, height, radialSegments), mat);
  mesh.name = name;
  mesh.position.set(position[0], position[1] + height * 0.5, position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (obstacle) mesh.userData.navObstacle = true;
  parent.add(mesh);
  return mesh;
}

function addWheel(
  parent: THREE.Object3D,
  name: string,
  radius: number,
  width: number,
  mat: THREE.Material,
  x: number,
  z: number,
  centerY = FLOOR_Y + radius,
) {
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 14), mat);
  wheel.name = name;
  wheel.rotation.x = Math.PI / 2;
  wheel.position.set(x, centerY, z);
  wheel.castShadow = true;
  wheel.userData.navObstacle = true;
  parent.add(wheel);
  return wheel;
}

function addPipe(
  parent: THREE.Object3D,
  name: string,
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  mat: THREE.Material,
) {
  const direction = end.clone().sub(start);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 9), mat);
  pipe.name = name;
  pipe.position.copy(start).add(end).multiplyScalar(0.5);
  pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  pipe.castShadow = true;
  parent.add(pipe);
  return pipe;
}

function addSign(
  parent: THREE.Object3D,
  name: string,
  title: string,
  subtitle: string,
  width: number,
  height: number,
  position: readonly [number, number, number],
  rotationY = 0,
  warning = false,
) {
  const texture = signTexture(title, subtitle, warning);
  const mat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: texture,
    roughness: 0.7,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  sign.name = name;
  sign.position.set(...position);
  sign.rotation.y = rotationY;
  parent.add(sign);
  return sign;
}

function facility(parent: THREE.Group, name: string, x: number, z: number, rotationY = 0) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  parent.add(group);
  return group;
}

function addWindowRow(
  parent: THREE.Object3D,
  prefix: string,
  width: number,
  y: number,
  z: number,
  count: number,
  darkGlass: THREE.Material,
  litGlass: THREE.Material,
  lit = new Set<number>(),
) {
  const cell = width / count;
  for (let index = 0; index < count; index += 1) {
    addBox(
      parent,
      `${prefix}__WINDOW_${index + 1}`,
      [cell * 0.66, m(1.5), m(0.12)],
      lit.has(index) ? litGlass : darkGlass,
      [-width * 0.5 + cell * (index + 0.5), y, z],
      { obstacle: false, shadows: false },
    );
  }
}

function addRoadAndYards(group: THREE.Group, definition: DistrictDefinition, mats: ReturnType<typeof createIndustrialMaterials>) {
  const roadLength = definition.footprint[0] - 0.5;
  const road = addBox(group, 'INDUSTRIAL__CENTRAL_OVERSIZED_ROAD', [roadLength, 0.018, 4.05], mats.asphalt, [0, FLOOR_Y, 0.05], {
    obstacle: false,
    walkable: true,
  });
  road.material = mats.asphalt;
  addBox(group, 'INDUSTRIAL__SECONDARY_ROAD_INTO_FOG', [1.25, 0.016, 5.4], mats.asphalt, [7.1, FLOOR_Y, -3.05], {
    obstacle: false,
    walkable: true,
  });
  addBox(group, 'INDUSTRIAL__UNUSED_PEDESTRIAN_PATH_NORTH', [roadLength - 0.2, 0.022, 0.38], mats.wetConcrete, [0, FLOOR_Y, -2.24], {
    obstacle: false,
    walkable: true,
  });
  addBox(group, 'INDUSTRIAL__UNUSED_PEDESTRIAN_PATH_SOUTH', [roadLength - 0.2, 0.022, 0.38], mats.wetConcrete, [0, FLOOR_Y, 2.34], {
    obstacle: false,
    walkable: true,
  });

  for (let index = 0; index < 13; index += 1) {
    const dash = addBox(
      group,
      `INDUSTRIAL__FADED_LANE_MARKING_${index + 1}`,
      [0.72, 0.006, 0.045],
      mats.fadedPaint,
      [-13.5 + index * 2.2, FLOOR_Y + 0.018, index % 2 ? -1.42 : 1.52],
      { obstacle: false, shadows: false },
    );
    dash.material.transparent = true;
  }
  for (const [index, x, z, sx, sz] of [
    [1, -10.8, 1.42, 0.85, 0.34],
    [2, -3.6, -1.38, 1.05, 0.28],
    [3, 4.8, 1.46, 0.72, 0.24],
    [4, 11.3, -1.34, 0.94, 0.3],
  ] as const) {
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), mats.puddle);
    puddle.name = `INDUSTRIAL__REFLECTIVE_PUDDLE_${index}`;
    puddle.rotation.x = -Math.PI / 2;
    puddle.scale.set(sx, sz, 1);
    puddle.position.set(x, FLOOR_Y + 0.031, z);
    puddle.renderOrder = 5;
    group.add(puddle);
  }
  for (let index = 0; index < 13; index += 1) {
    const weed = addBox(
      group,
      `INDUSTRIAL__WEED_IN_EXPANSION_JOINT_${index + 1}`,
      [m(0.08), m(0.35 + (index % 3) * 0.08), m(0.08)],
      mats.weed,
      [-13.1 + index * 2.12, FLOOR_Y + 0.02, index % 2 ? -2.02 : 2.12],
      { obstacle: false, shadows: false },
    );
    weed.rotation.z = (index % 2 ? -1 : 1) * 0.18;
  }
  for (let index = 0; index < 5; index += 1) {
    addBox(group, `INDUSTRIAL__STORM_DRAIN_${index + 1}`, [0.58, 0.018, 0.13], mats.grate, [-11.6 + index * 5.8, FLOOR_Y + 0.024, 1.96], {
      obstacle: false,
      shadows: false,
    });
  }
}

type ReferenceFactoryBlock = {
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  bays: number;
  floors: number;
  tone: 'mid' | 'dark' | 'light';
  sign?: readonly [title: string, subtitle: string];
  pipeBank?: boolean;
  roofTower?: boolean;
};

function addReferenceFactoryBlock(
  group: THREE.Group,
  block: ReferenceFactoryBlock,
  mats: ReturnType<typeof createIndustrialMaterials>,
) {
  const building = facility(group, block.name, block.x, block.z, 0);
  const facade = block.tone === 'dark'
    ? mats.referenceConcreteDark
    : block.tone === 'light'
      ? mats.referenceConcreteLight
      : mats.referenceConcrete;
  const frontDirection = block.z < 0 ? 1 : -1;
  const frontZ = frontDirection * (block.depth * 0.5 + m(0.08));
  addBox(building, `${block.name}__MASS`, [block.width, block.height, block.depth], facade, [0, FLOOR_Y, 0]);
  addBox(building, `${block.name}__ROOF_PARAPET`, [block.width + m(0.35), m(0.65), block.depth + m(0.35)], mats.referenceConcreteDark, [0, FLOOR_Y + block.height, 0]);

  const bayWidth = block.width / block.bays;
  const floorStep = (block.height - m(3.6)) / Math.max(1, block.floors);
  for (let floor = 0; floor < block.floors; floor += 1) {
    const windowBottom = FLOOR_Y + m(2.8) + floor * floorStep;
    for (let bay = 0; bay < block.bays; bay += 1) {
      const lit = floor === 1 && bay === Math.floor(block.bays * 0.62) && block.tone !== 'dark';
      addBox(
        building,
        `${block.name}__STREET_WINDOW_${floor + 1}_${bay + 1}`,
        [bayWidth * 0.62, m(1.55), m(0.12)],
        lit ? mats.litWindow : mats.referenceWindow,
        [-block.width * 0.5 + bayWidth * (bay + 0.5), windowBottom, frontZ],
        { obstacle: false, shadows: false },
      );
    }
  }
  for (let bay = 0; bay <= block.bays; bay += 1) {
    addBox(
      building,
      `${block.name}__FACADE_PILASTER_${bay + 1}`,
      [m(0.38), block.height * 0.93, m(0.28)],
      mats.referenceConcreteDark,
      [-block.width * 0.5 + bayWidth * bay, FLOOR_Y, frontZ],
      { obstacle: false },
    );
  }

  const sideWindowCount = Math.max(2, Math.floor(block.depth / m(8)));
  for (const side of [-1, 1]) {
    for (let index = 0; index < sideWindowCount; index += 1) {
      addBox(
        building,
        `${block.name}__SIDE_WINDOW_${side}_${index + 1}`,
        [m(0.12), m(1.5), m(3.2)],
        mats.referenceWindow,
        [side * (block.width * 0.5 + m(0.07)), FLOOR_Y + block.height * 0.58, -block.depth * 0.32 + index * m(5.2)],
        { obstacle: false, shadows: false },
      );
    }
  }

  addBox(
    building,
    `${block.name}__ROLLUP_DOOR`,
    [m(4.2), m(4.5), m(0.16)],
    mats.rollupDoor,
    [-block.width * 0.28, FLOOR_Y, frontZ + frontDirection * m(0.04)],
    { obstacle: false },
  );
  addBox(
    building,
    `${block.name}__PERSONNEL_DOOR`,
    [m(1.2), m(2.6), m(0.18)],
    mats.darkMetal,
    [block.width * 0.3, FLOOR_Y, frontZ + frontDirection * m(0.05)],
    { obstacle: false },
  );

  if (block.sign) {
    addSign(
      building,
      `${block.name}__SIGN`,
      block.sign[0],
      block.sign[1],
      Math.min(block.width * 0.62, m(13)),
      m(2.15),
      [0, FLOOR_Y + block.height * 0.78, frontZ + frontDirection * m(0.1)],
      frontDirection < 0 ? Math.PI : 0,
    );
  }

  if (block.pipeBank) {
    for (let index = 0; index < 3; index += 1) {
      const x = block.width * 0.3 + index * m(0.72);
      addPipe(
        building,
        `${block.name}__RUSTED_VERTICAL_PIPE_${index + 1}`,
        new THREE.Vector3(x, FLOOR_Y + m(0.4), frontZ + frontDirection * m(0.22)),
        new THREE.Vector3(x, FLOOR_Y + block.height + m(3.5 + index * 0.7), frontZ + frontDirection * m(0.22)),
        m(0.24),
        mats.referenceRust,
      );
    }
  }
  if (block.roofTower) {
    addBox(
      building,
      `${block.name}__ROOF_TOWER`,
      [block.width * 0.24, m(8.5), block.depth * 0.34],
      mats.referenceConcreteDark,
      [block.width * 0.18, FLOOR_Y + block.height + m(0.65), -block.depth * 0.08],
    );
    addCylinder(
      building,
      `${block.name}__BLACK_ROOF_TANK`,
      m(1.35),
      m(2.4),
      mats.soot,
      [block.width * 0.18, FLOOR_Y + block.height + m(9.1), -block.depth * 0.08],
      18,
    );
  }
}

function addIndustrialRailCanyon(
  group: THREE.Group,
  mats: ReturnType<typeof createIndustrialMaterials>,
) {
  const blocks: readonly ReferenceFactoryBlock[] = [
    { name: 'INDUSTRIAL__NEXUS_LOGISTICS_WEST', x: -12.1, z: -4.35, width: 5.2, depth: 3.2, height: 3.25, bays: 9, floors: 5, tone: 'mid', sign: ['NEXUS LOGISTICS', 'EST. 1969'] },
    { name: 'INDUSTRIAL__UNIT_4B_PROCESS_BLOCK', x: -12.0, z: 4.45, width: 5.35, depth: 3.1, height: 3.9, bays: 8, floors: 6, tone: 'dark', sign: ['UNIT 4B', 'HEAVY PROCESS'], pipeBank: true, roofTower: true },
    { name: 'INDUSTRIAL__GREY_FOUNDRY_EAST', x: 12.0, z: -4.32, width: 5.1, depth: 3.15, height: 3.55, bays: 8, floors: 5, tone: 'light', sign: ['GREY FOUNDRY', 'BLDG 118'], roofTower: true },
    { name: 'INDUSTRIAL__ASSEMBLY_WORKS_EAST', x: 12.15, z: 4.38, width: 5.2, depth: 3.2, height: 3.2, bays: 9, floors: 5, tone: 'mid', sign: ['ASSEMBLY WORKS', 'UNIT 120'], pipeBank: true },
    { name: 'INDUSTRIAL__NORTH_REAR_FACTORY', x: 0, z: -7.55, width: 6.2, depth: 2.2, height: 3.05, bays: 10, floors: 5, tone: 'dark', roofTower: true },
    { name: 'INDUSTRIAL__SOUTH_REAR_FACTORY', x: 0.2, z: 7.55, width: 6.1, depth: 2.25, height: 3.45, bays: 10, floors: 5, tone: 'light', pipeBank: true },
  ];
  blocks.forEach((block) => addReferenceFactoryBlock(group, block, mats));

  for (let index = 0; index < 8; index += 1) {
    const x = -12.8 + index * 3.65;
    const side = index % 2 ? 1 : -1;
    addCylinder(group, `INDUSTRIAL__REFERENCE_STREETLIGHT_POST_${index + 1}`, m(0.14), m(9.2), mats.darkMetal, [x, FLOOR_Y, side * 2.02], 10);
    const lamp = addBox(
      group,
      `INDUSTRIAL__REFERENCE_STREETLIGHT_${index + 1}`,
      [m(1.25), m(0.2), m(0.42)],
      index === 3 || index === 6 ? mats.amberLight : mats.darkness,
      [x + m(0.45), FLOOR_Y + m(8.85), side * 2.02],
      { obstacle: false, shadows: false },
    );
    if (index === 3) lamp.userData.animate = 'industrial-flicker';
  }
  const wireY = FLOOR_Y + m(8.9);
  for (let index = 0; index < 7; index += 1) {
    const startX = -12.8 + index * 3.65;
    const endX = startX + 3.65;
    addPipe(group, 'INDUSTRIAL__OVERHEAD_UTILITY_WIRE', new THREE.Vector3(startX, wireY, -2.02), new THREE.Vector3(endX, wireY - m(0.35), -2.02), m(0.035), mats.soot);
  }
  addBox(group, 'INDUSTRIAL__REFERENCE_CHAINLINK_FENCE', [9.2, m(2.4), m(0.08)], mats.fence, [7.7, FLOOR_Y, 2.58], { obstacle: false, shadows: false });

  group.userData.industrialRailExtension = {
    style: 'cold blue-grey concrete factory canyon',
    addedFactoryBlocks: blocks.length,
    railwaySystem: 'spline-based hierarchy generated under INDUSTRIAL__RAILWAY',
  };
  Object.assign(group.userData.industrialDistrict, {
    referencePalette: ['#465158', '#303a3f', '#59646a', '#111b20', '#55342e'],
    addedFactoryBlocks: blocks.length,
  });
}

function addManufacturingHall(group: THREE.Group, mats: ReturnType<typeof createIndustrialMaterials>) {
  const hall = facility(group, 'INDUSTRIAL__MAIN_MANUFACTURING_HALL', -4.7, -3.35, 0);
  const width = 5.2;
  const depth = 2.65;
  const height = 2.05;
  addBox(hall, 'INDUSTRIAL__HALL_BACK_WALL', [width, height, 0.14], mats.corrugated, [0, FLOOR_Y, -depth * 0.5]);
  addBox(hall, 'INDUSTRIAL__HALL_LEFT_WALL', [0.14, height, depth], mats.corrugated, [-width * 0.5, FLOOR_Y, 0]);
  addBox(hall, 'INDUSTRIAL__HALL_RIGHT_WALL', [0.14, height, depth], mats.corrugated, [width * 0.5, FLOOR_Y, 0]);
  addBox(hall, 'INDUSTRIAL__HALL_FRONT_HEADER', [width, 0.62, 0.16], mats.corrugated, [0, FLOOR_Y + 1.43, depth * 0.5]);
  addBox(hall, 'INDUSTRIAL__HALL_FRONT_LEFT', [1.7, 1.43, 0.16], mats.brick, [-1.75, FLOOR_Y, depth * 0.5]);
  addBox(hall, 'INDUSTRIAL__HALL_FRONT_RIGHT', [1.7, 1.43, 0.16], mats.brick, [1.75, FLOOR_Y, depth * 0.5]);
  addBox(hall, 'INDUSTRIAL__HALL_WALKABLE_INTERIOR', [1.7, 0.025, 2.35], mats.darkFloor, [0, FLOOR_Y, 0.1], {
    obstacle: false,
    walkable: true,
  });
  const darkness = addBox(hall, 'INDUSTRIAL__IMPOSSIBLY_DEEP_INTERIOR', [1.66, 1.38, 0.03], mats.darkness, [0, FLOOR_Y + 0.02, -1.08], {
    obstacle: false,
    shadows: false,
  });
  darkness.material.side = THREE.DoubleSide;

  for (let roofIndex = 0; roofIndex < 6; roofIndex += 1) {
    const roof = addBox(
      hall,
      `INDUSTRIAL__SAWTOOTH_ROOF_${roofIndex + 1}`,
      [0.94, 0.11, depth + 0.18],
      roofIndex % 2 ? mats.roof : mats.corrugated,
      [-2.35 + roofIndex * 0.94, FLOOR_Y + height + (roofIndex % 2) * 0.08, 0],
    );
    roof.rotation.z = roofIndex % 2 ? -0.09 : 0.055;
  }
  addWindowRow(hall, 'INDUSTRIAL__HALL_NORTH', 4.65, FLOOR_Y + 1.12, -depth * 0.5 - 0.075, 11, mats.blackGlass, mats.litWindow, new Set([2, 8]));
  addWindowRow(hall, 'INDUSTRIAL__HALL_FRONT', 3.7, FLOOR_Y + 1.12, depth * 0.5 + 0.085, 9, mats.blackGlass, mats.litWindow, new Set([5]));

  for (let index = 0; index < 8; index += 1) {
    const curtain = addBox(
      hall,
      `INDUSTRIAL__PLASTIC_STRIP_CURTAIN_${index + 1}`,
      [0.17, 1.22, 0.018],
      mats.stripCurtain,
      [-0.62 + index * 0.177, FLOOR_Y + 0.12, depth * 0.5 + 0.11],
      { obstacle: false, shadows: false },
    );
    curtain.userData.animate = 'industrial-curtain';
    curtain.userData.phase = index * 0.71;
  }
  const crane = addBox(hall, 'INDUSTRIAL__SUSPENDED_OVERHEAD_CRANE', [4.25, 0.13, 0.18], mats.safetyYellow, [0, FLOOR_Y + 1.5, -0.25]);
  crane.userData.navObstacle = false;
  for (const x of [-0.45, 0.42]) {
    const chain = addPipe(
      hall,
      'INDUSTRIAL__MOTIONLESS_CRANE_CHAIN',
      new THREE.Vector3(x, FLOOR_Y + 1.48, -0.24),
      new THREE.Vector3(x, FLOOR_Y + 0.74, -0.24),
      m(0.018),
      mats.rust,
    );
    chain.userData.animate = x > 0 ? 'industrial-chain' : undefined;
    chain.userData.phase = x > 0 ? 1.4 : 0;
  }
  addBox(hall, 'INDUSTRIAL__INTERIOR_WORKBENCH', [0.82, m(0.9), 0.28], mats.rust, [-1.05, FLOOR_Y, -0.45]);
  for (let index = 0; index < 4; index += 1) {
    addBox(hall, `INDUSTRIAL__INACTIVE_MACHINE_${index + 1}`, [0.35, 0.48, 0.32], mats.machineGreen, [0.52 + index * 0.47, FLOOR_Y, -0.42]);
  }
  addBox(hall, 'INDUSTRIAL__CHAIR_FACING_ENTRANCE', [m(0.65), m(0.95), m(0.65)], mats.rust, [0.15, FLOOR_Y, 0.35]);

  for (let index = 0; index < 3; index += 1) {
    const vent = addCylinder(hall, `INDUSTRIAL__SLOW_ROOF_VENT_${index + 1}`, 0.19, 0.22, mats.metal, [-1.4 + index * 1.35, FLOOR_Y + height + 0.1, -0.35], 16, false);
    const fan = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 6, 20), mats.darkMetal);
    fan.name = `INDUSTRIAL__SLOW_ROOF_FAN_${index + 1}`;
    fan.rotation.x = Math.PI / 2;
    fan.position.set(vent.position.x, FLOOR_Y + height + 0.34, -0.35);
    fan.userData.animate = 'industrial-fan';
    fan.userData.speed = 0.12 + index * 0.025;
    hall.add(fan);
  }
  const flicker = addBox(hall, 'INDUSTRIAL__IRREGULAR_FLICKER_LAMP', [0.34, 0.12, 0.1], mats.litWindow, [1.78, FLOOR_Y + 1.22, depth * 0.5 + 0.17], {
    obstacle: false,
    shadows: false,
  });
  flicker.userData.animate = 'industrial-flicker';
  const hallLight = new THREE.PointLight('#ffd08b', 1.8, 5.5, 2.2);
  hallLight.name = 'INDUSTRIAL__HALL_REMAINING_LIGHT';
  hallLight.position.set(0, FLOOR_Y + 1.15, 0.35);
  hall.add(hallLight);
  addSign(hall, 'INDUSTRIAL__HALL_FADED_COMPANY_LETTERING', 'AET—R RECL—', 'HEAVY INDUSTRIES · UNIT 04', 2.15, 0.46, [0.2, FLOOR_Y + 1.72, depth * 0.5 + 0.09]);
  addSign(hall, 'INDUSTRIAL__REPEATED_ENTRANCE_NUMBER', '04   04', 'AUTHORIZED PERSONNEL', 0.78, 0.26, [1.78, FLOOR_Y + 0.96, depth * 0.5 + 0.1], 0, true);
  for (const [index, x] of [[1, -2.2], [2, 2.2]] as const) {
    addBox(hall, `INDUSTRIAL__SEALED_PERSONNEL_DOOR_${index}`, [m(1.15), m(2.7), m(0.12)], mats.darkMetal, [x, FLOOR_Y, depth * 0.5 + 0.1], { obstacle: false });
  }
  for (let step = 0; step < 9; step += 1) {
    addBox(hall, `INDUSTRIAL__EXTERIOR_EMERGENCY_STAIR_${step + 1}`, [m(1.1), m(0.12), m(0.42)], mats.rust, [-width * 0.5 - 0.08, FLOOR_Y + step * m(0.28), 0.72 - step * m(0.34)], { obstacle: false });
  }
  addPipe(hall, 'INDUSTRIAL__PEELING_YELLOW_SAFETY_RAIL', new THREE.Vector3(-0.92, FLOOR_Y + m(1.1), depth * 0.5 + 0.28), new THREE.Vector3(0.92, FLOOR_Y + m(1.1), depth * 0.5 + 0.28), m(0.04), mats.safetyYellow);
}

function addWarehouse(group: THREE.Group, mats: ReturnType<typeof createIndustrialMaterials>) {
  const warehouse = facility(group, 'INDUSTRIAL__ABANDONED_WAREHOUSE', 6.2, 3.3, Math.PI);
  const width = 5.4;
  const depth = 1.65;
  const height = 1.45;
  addBox(warehouse, 'INDUSTRIAL__WAREHOUSE_BODY', [width, height, depth], mats.concrete, [0, FLOOR_Y, 0]);
  addBox(warehouse, 'INDUSTRIAL__WAREHOUSE_ROOF', [width + 0.12, 0.12, depth + 0.14], mats.roof, [0, FLOOR_Y + height, 0]);
  const bayWidth = 0.41;
  for (let index = 0; index < 11; index += 1) {
    const x = -2.25 + index * 0.45;
    addBox(warehouse, `INDUSTRIAL__DOCK_SEAL_${index + 1}`, [bayWidth, 0.7, 0.095], mats.rubber, [x, FLOOR_Y + 0.19, depth * 0.5 + 0.075], {
      obstacle: false,
      shadows: false,
    });
    const openGap = index === 7 ? m(0.3) : 0;
    addBox(
      warehouse,
      `INDUSTRIAL__LOADING_DOOR_${index + 1}`,
      [bayWidth - 0.08, 0.56 - openGap, 0.04],
      index === 7 ? mats.rollupDoor : mats.rollupDoor,
      [x, FLOOR_Y + 0.26 + openGap, depth * 0.5 + 0.13],
      { obstacle: false, shadows: false },
    );
    if (index !== 5) {
      addSign(
        warehouse,
        `INDUSTRIAL__FADED_BAY_NUMBER_${index + 1}`,
        index === 8 ? '9' : `${index + 1}`,
        '',
        0.17,
        0.12,
        [x, FLOOR_Y + 1.02, depth * 0.5 + 0.155],
      );
    }
  }
  addSign(warehouse, 'INDUSTRIAL__NUMBER_PAINTED_IN_DARKNESS', '08', '', 0.16, 0.11, [0.9, FLOOR_Y + 0.32, depth * 0.5 + 0.16]);
  const securityLight = addBox(warehouse, 'INDUSTRIAL__DAYLIGHT_SECURITY_LIGHT', [0.16, 0.09, 0.11], mats.litWindow, [-2.35, FLOOR_Y + 1.24, depth * 0.5 + 0.18], {
    obstacle: false,
    shadows: false,
  });
  securityLight.userData.animate = 'industrial-flicker';
  for (let index = 0; index < 3; index += 1) {
    addBox(warehouse, `INDUSTRIAL__STACKED_PALLETS_${index + 1}`, [m(1.2), m(0.14), m(1.0)], mats.wood, [1.65, FLOOR_Y + index * m(0.15), 1.22]);
  }
  const wrap = addBox(warehouse, 'INDUSTRIAL__TORN_SHRINK_WRAP', [0.66, 0.58, 0.012], mats.stripCurtain, [1.6, FLOOR_Y + 0.18, 1.38], {
    obstacle: false,
    shadows: false,
  });
  wrap.rotation.z = -0.13;
  wrap.userData.animate = 'industrial-curtain';
  wrap.userData.phase = 2.2;
  const trailer = facility(warehouse, 'INDUSTRIAL__EMPTY_FLATBED_TRAILER_WRONG_ANGLE', -0.6, 1.35, -0.24);
  addBox(trailer, 'INDUSTRIAL__TRAILER_DECK', [m(13.6), m(0.22), m(2.5)], mats.rust, [0, FLOOR_Y + m(0.95), 0]);
  for (const x of [-0.5, 0.48]) for (const z of [-0.1, 0.1]) addWheel(trailer, 'INDUSTRIAL__TRAILER_WHEEL', m(0.52), m(0.24), mats.rubber, x, z);
  addBox(warehouse, 'INDUSTRIAL__DAMAGED_LOADING_RAMP', [0.74, 0.12, 0.62], mats.rust, [-1.65, FLOOR_Y, 1.0]);
  addSign(warehouse, 'INDUSTRIAL__EMPTY_CLIPBOARD', 'SHIFT', '— — —', 0.2, 0.28, [-2.63, FLOOR_Y + 0.65, 1.08], Math.PI / 2);
  for (const [index, x] of [[1, -0.25], [2, 0.05]] as const) {
    const tyreMark = addBox(warehouse, `INDUSTRIAL__TYRE_MARK_TO_SEALED_WALL_${index}`, [m(0.22), m(0.025), 1.65], mats.rubber, [x, FLOOR_Y + 0.01, 1.5], { obstacle: false, shadows: false });
    tyreMark.rotation.y = -0.16;
  }
}

function addPowerStation(group: THREE.Group, mats: ReturnType<typeof createIndustrialMaterials>) {
  const station = facility(group, 'INDUSTRIAL__BRICK_POWER_STATION', 2.2, -3.5, 0);
  addBox(station, 'INDUSTRIAL__POWER_STATION_BODY', [2.2, 2.65, 2.65], mats.brick, [0, FLOOR_Y, 0]);
  addBox(station, 'INDUSTRIAL__POWER_STATION_PARAPET', [2.32, 0.18, 2.76], mats.rust, [0, FLOOR_Y + 2.65, 0]);
  for (let floor = 0; floor < 3; floor += 1) {
    addWindowRow(station, `INDUSTRIAL__POWER_MULTI_PANE_F${floor + 1}`, 1.82, FLOOR_Y + 0.48 + floor * 0.67, 1.335, 6, mats.blackGlass, mats.litWindow, floor === 1 ? new Set([4]) : new Set());
  }
  for (const [index, x] of [[1, -0.58], [2, 0.58]] as const) {
    const stack = addCylinder(station, `INDUSTRIAL__POWER_SMOKESTACK_${index}`, 0.2, index === 1 ? 3.85 : 4.2, mats.brick, [x, FLOOR_Y + 2.55, -0.42], 20);
    addCylinder(station, `INDUSTRIAL__STACK_CAP_${index}`, 0.24, 0.12, mats.rust, [x, stack.position.y + (index === 1 ? 1.93 : 2.1), -0.42], 20, false);
  }
  for (let index = 0; index < 5; index += 1) {
    const steam = new THREE.Mesh(new THREE.SphereGeometry(0.15 + index * 0.025, 10, 7), mats.mist.clone());
    steam.name = `INDUSTRIAL__THIN_STACK_STEAM_${index + 1}`;
    steam.position.set(0.58 + index * 0.06, FLOOR_Y + 6.88 + index * 0.3, -0.42);
    steam.userData.animate = 'industrial-steam';
    steam.userData.phase = index * 1.1;
    steam.userData.baseY = steam.position.y;
    station.add(steam);
  }
  for (let index = 0; index < 3; index += 1) {
    addBox(station, `INDUSTRIAL__TRANSFORMER_${index + 1}`, [0.52, 0.55, 0.42], mats.machineGreen, [-0.72 + index * 0.72, FLOOR_Y, 1.62]);
    for (let insulator = 0; insulator < 3; insulator += 1) {
      addCylinder(station, 'INDUSTRIAL__CERAMIC_INSULATOR', 0.035, 0.24, mats.ceramic, [-0.84 + index * 0.72 + insulator * 0.12, FLOOR_Y + 0.55, 1.62], 8, false);
    }
  }
  addPipe(station, 'INDUSTRIAL__POWER_EXTERNAL_PIPE', new THREE.Vector3(-1.16, FLOOR_Y + 0.45, 0.8), new THREE.Vector3(-1.16, FLOOR_Y + 2.1, 0.8), 0.07, mats.rust);
  addSign(station, 'INDUSTRIAL__POWER_WARNING_SIGN', 'DANGER', 'LIVE STEAM · 11 kV', 0.58, 0.24, [0.52, FLOOR_Y + 0.52, 1.36], 0, true);
  for (const [index, x, y] of [[1, -0.42, 1.05], [2, 0.1, 1.72], [3, 0.62, 2.15]] as const) {
    addBox(station, `INDUSTRIAL__MISMATCHED_BROKEN_WINDOW_PANEL_${index}`, [0.2, 0.18, 0.025], index === 2 ? mats.metal : mats.wood, [x, FLOOR_Y + y, 1.37], { obstacle: false, shadows: false });
  }
  const silhouette = addBox(station, 'INDUSTRIAL__UNREACHABLE_WINDOW_SILHOUETTE', [m(0.48), m(1.65), m(0.06)], mats.darkness, [-0.62, FLOOR_Y + 1.48, 1.39], { obstacle: false, shadows: false });
  silhouette.rotation.z = 0.04;
  const movingLight = new THREE.PointLight('#ffd39a', 2.1, 4, 2);
  movingLight.name = 'INDUSTRIAL__MOVING_INTERNAL_LIGHT';
  movingLight.position.set(0, FLOOR_Y + 1.35, 1.1);
  movingLight.userData.animate = 'industrial-moving-light';
  station.add(movingLight);
}

function addAdministration(group: THREE.Group, mats: ReturnType<typeof createIndustrialMaterials>) {
  const admin = facility(group, 'INDUSTRIAL__ADMINISTRATION_BUILDING', 2.0, 5.1, Math.PI);
  addBox(admin, 'INDUSTRIAL__ADMIN_CONCRETE_SHELL', [2.55, 1.22, 1.18], mats.concrete, [0, FLOOR_Y, 0]);
  addBox(admin, 'INDUSTRIAL__ADMIN_GLASS_FRONT', [2.28, 0.82, 0.035], mats.cloudyGlass, [0, FLOOR_Y + 0.19, 0.61], { obstacle: false, shadows: false });
  addBox(admin, 'INDUSTRIAL__AUTOMATIC_DOORS_PERMANENTLY_OPEN_LEFT', [0.48, 0.76, 0.03], mats.cloudyGlass, [-0.66, FLOOR_Y + 0.19, 0.64], { obstacle: false, shadows: false });
  addBox(admin, 'INDUSTRIAL__AUTOMATIC_DOORS_PERMANENTLY_OPEN_RIGHT', [0.48, 0.76, 0.03], mats.cloudyGlass, [0.66, FLOOR_Y + 0.19, 0.64], { obstacle: false, shadows: false });
  addBox(admin, 'INDUSTRIAL__DEAD_RECEPTION_DESK', [m(3.4), m(1.0), m(1.0)], mats.darkMetal, [0.08, FLOOR_Y, 0.34]);
  addBox(admin, 'INDUSTRIAL__OVERTURNED_OFFICE_CHAIR', [m(0.65), m(0.95), m(0.65)], mats.rust, [-0.45, FLOOR_Y, 0.22]).rotation.z = 1.18;
  for (let index = 0; index < 3; index += 1) addBox(admin, `INDUSTRIAL__DUSTY_FILING_CABINET_${index + 1}`, [m(0.8), m(1.75), m(0.55)], mats.machineGreen, [0.68 + index * 0.1, FLOOR_Y, -0.32]);
  addSign(admin, 'INDUSTRIAL__ADMINISTRATION_SIGN', 'INDUSTRIAL ADMINISTRATION', 'BUILDING 04 · VISITOR ENTRANCE', 1.85, 0.32, [0, FLOOR_Y + 1.02, 0.625]);
  addSign(admin, 'INDUSTRIAL__STOPPED_ANALOGUE_CLOCK', '11:17', 'EVACUATION CLOCK', 0.34, 0.25, [-0.94, FLOOR_Y + 0.74, 0.645]);
  addSign(admin, 'INDUSTRIAL__FADED_EVACUATION_MAP', 'EVACUATION', 'YOU ARE HERE  →  ?', 0.42, 0.28, [0.94, FLOOR_Y + 0.68, 0.645], 0, true);
  addBox(admin, 'INDUSTRIAL__ONE_CEILING_LIGHT', [m(1.2), m(0.08), m(0.22)], mats.fluorescent, [0.25, FLOOR_Y + 1.05, 0.08], { obstacle: false, shadows: false });
  for (const x of [-1.02, 1.02]) addBox(admin, 'INDUSTRIAL__DEAD_PLANTER', [m(1.2), m(0.75), m(1.2)], mats.concrete, [x, FLOOR_Y, 0.86]);
  addCylinder(admin, 'INDUSTRIAL__EMPTY_FLAGPOLE', 0.035, 2.45, mats.metal, [-1.42, FLOOR_Y, 0.72], 10);
}

function addWaterTreatment(group: THREE.Group, mats: ReturnType<typeof createIndustrialMaterials>) {
  const water = facility(group, 'INDUSTRIAL__WATER_TREATMENT_STRUCTURE', 8.25, 4.15, Math.PI);
  addBox(water, 'INDUSTRIAL__PUMP_HOUSE', [1.86, 1.12, 0.84], mats.concrete, [0, FLOOR_Y, -0.42]);
  for (let index = 0; index < 2; index += 1) {
    addBox(water, `INDUSTRIAL__TREATMENT_BASIN_${index + 1}`, [0.9, 0.34, 1.16], mats.concrete, [-0.53 + index * 1.06, FLOOR_Y, 0.65]);
    const basinWater = addBox(water, `INDUSTRIAL__SLOW_CIRCULATING_DARK_WATER_${index + 1}`, [0.76, 0.018, 1.02], mats.water, [-0.53 + index * 1.06, FLOOR_Y + 0.32, 0.65], { obstacle: false, shadows: false });
    basinWater.userData.animate = 'industrial-water';
    basinWater.userData.phase = index * Math.PI;
  }
  for (let index = 0; index < 4; index += 1) {
    const x = -0.72 + index * 0.48;
    addPipe(water, `INDUSTRIAL__SILVER_PROCESS_PIPE_${index + 1}`, new THREE.Vector3(x, FLOOR_Y + 0.42, -0.06), new THREE.Vector3(x, FLOOR_Y + 1.02, -0.06), 0.045, mats.frostMetal);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 6, 16), mats.valveBlue);
    wheel.name = `INDUSTRIAL__BLUE_VALVE_WHEEL_${index + 1}`;
    wheel.position.set(x, FLOOR_Y + 0.74, 0.02);
    water.add(wheel);
  }
  addBox(water, 'INDUSTRIAL__GRATED_WALKWAY', [2.0, 0.045, 0.34], mats.grate, [0, FLOOR_Y + 0.38, 0.04], { obstacle: false, walkable: true });
  const pump = addCylinder(water, 'INDUSTRIAL__RHYTHMIC_OPERATING_PUMP', 0.18, 0.46, mats.machineGreen, [0.78, FLOOR_Y, -0.05], 14);
  pump.userData.animate = 'industrial-pump';
  pump.userData.baseY = pump.position.y;
  addBox(water, 'INDUSTRIAL__OPEN_MAINTENANCE_DOOR', [0.38, 0.75, 0.035], mats.darkness, [-0.62, FLOOR_Y + 0.02, 0.02], { obstacle: false, shadows: false }).rotation.y = -0.72;
  addBox(water, 'INDUSTRIAL__WET_TRAIL_FROM_DOOR', [0.22, 0.008, 1.8], mats.puddle, [-0.62, FLOOR_Y + 0.03, 0.85], { obstacle: false, shadows: false });
  addSign(water, 'INDUSTRIAL__WATER_WARNING_LABEL', 'BASIN 2', 'CHEMICAL EXPOSURE', 0.54, 0.22, [0.48, FLOOR_Y + 0.72, 0.02], 0, true);
  for (const x of [-1.0, 1.0]) {
    addPipe(water, 'INDUSTRIAL__BASIN_HANDRAIL', new THREE.Vector3(x, FLOOR_Y + 0.48, 0.08), new THREE.Vector3(x, FLOOR_Y + 0.48, 1.26), m(0.04), mats.rust);
    for (const z of [0.12, 0.62, 1.12]) addPipe(water, 'INDUSTRIAL__BASIN_RAIL_POST', new THREE.Vector3(x, FLOOR_Y + 0.34, z), new THREE.Vector3(x, FLOOR_Y + 0.48, z), m(0.035), mats.rust);
  }
  for (let rung = 0; rung < 5; rung += 1) addBox(water, `INDUSTRIAL__LADDER_INTO_DARK_WATER_${rung + 1}`, [m(0.5), m(0.04), m(0.04)], mats.rust, [0.47, FLOOR_Y + 0.1 + rung * m(0.22), 1.2], { obstacle: false, shadows: false });
}

function addBoilerHouse(group: THREE.Group, mats: ReturnType<typeof createIndustrialMaterials>) {
  const boiler = facility(group, 'INDUSTRIAL__BOILER_HOUSE', -0.6, -4.65, 0.035);
  addBox(boiler, 'INDUSTRIAL__BOILER_HEAT_CLADDING', [1.35, 2.52, 1.32], mats.heatMetal, [0, FLOOR_Y, 0]);
  for (let index = 0; index < 7; index += 1) addBox(boiler, `INDUSTRIAL__BOILER_LOUVRE_${index + 1}`, [0.82, 0.07, 0.07], mats.darkMetal, [0, FLOOR_Y + 0.62 + index * 0.13, 0.68], { obstacle: false, shadows: false });
  addCylinder(boiler, 'INDUSTRIAL__OVERSIZED_EXHAUST_STACK', 0.27, 3.65, mats.soot, [0, FLOOR_Y + 2.45, -0.18], 18);
  addPipe(boiler, 'INDUSTRIAL__THICK_INSULATED_PIPE', new THREE.Vector3(-0.72, FLOOR_Y + 0.54, 0.2), new THREE.Vector3(-0.72, FLOOR_Y + 2.05, 0.2), 0.11, mats.frostMetal);
  addBox(boiler, 'INDUSTRIAL__FURNACE_OBSERVATION_GLOW', [0.38, 0.34, 0.035], mats.furnace, [0.28, FLOOR_Y + 0.48, 0.69], { obstacle: false, shadows: false });
  const gauge = new THREE.Mesh(new THREE.CircleGeometry(0.17, 24), mats.gauge);
  gauge.name = 'INDUSTRIAL__ABNORMAL_PRESSURE_GAUGE';
  gauge.position.set(-0.34, FLOOR_Y + 1.68, 0.71);
  boiler.add(gauge);
  const beacon = addCylinder(boiler, 'INDUSTRIAL__FLASHING_BOILER_BEACON', 0.07, 0.13, mats.redLight, [0.48, FLOOR_Y + 2.54, 0.34], 12, false);
  beacon.userData.animate = 'industrial-beacon';
  beacon.userData.phase = 0.2;
  addSign(boiler, 'INDUSTRIAL__BOILER_WARNING', 'WARNING', 'BOILER AREA', 0.5, 0.22, [-0.3, FLOOR_Y + 0.25, 0.7], 0, true);
  addBox(boiler, 'INDUSTRIAL__BOILER_MAINTENANCE_PLATFORM', [1.55, m(0.18), 0.52], mats.grate, [0, FLOOR_Y + 1.42, 0.3], { obstacle: false, walkable: true });
  for (const x of [-0.72, 0.72]) addPipe(boiler, 'INDUSTRIAL__PLATFORM_HANDRAIL', new THREE.Vector3(x, FLOOR_Y + 1.45, 0.02), new THREE.Vector3(x, FLOOR_Y + 1.95, 0.02), m(0.04), mats.rust);
}

function addRailMaintenance(group: THREE.Group, mats: ReturnType<typeof createIndustrialMaterials>) {
  const rail = facility(group, 'INDUSTRIAL__RAIL_MAINTENANCE_SHED', -7.4, 3.65, Math.PI);
  const width = 3.5;
  const depth = 1.7;
  addBox(rail, 'INDUSTRIAL__RAIL_SHED_BACK', [width, 1.58, 0.12], mats.corrugated, [0, FLOOR_Y, -depth * 0.5]);
  addBox(rail, 'INDUSTRIAL__RAIL_SHED_LEFT', [0.14, 1.58, depth], mats.brick, [-width * 0.5, FLOOR_Y, 0]);
  addBox(rail, 'INDUSTRIAL__RAIL_SHED_RIGHT', [0.14, 1.58, depth], mats.brick, [width * 0.5, FLOOR_Y, 0]);
  addBox(rail, 'INDUSTRIAL__RAIL_SHED_ROOF', [width + 0.12, 0.15, depth + 0.16], mats.roof, [0, FLOOR_Y + 1.58, 0]);
  addSign(rail, 'INDUSTRIAL__RAIL_SHED_SIGN', 'SHED 3', 'EST. 1952', 1.05, 0.3, [0, FLOOR_Y + 1.38, depth * 0.5 + 0.04]);
  addBox(rail, 'INDUSTRIAL__TRACK_BLOCK_AHEAD', [0.55, 0.28, 0.48], mats.safetyYellow, [-0.3, FLOOR_Y, -0.58]);
  addBox(rail, 'INDUSTRIAL__NEATLY_PLACED_RAIL_TOOLS', [0.68, 0.05, 0.18], mats.metal, [-0.95, FLOOR_Y + 0.02, 0.62], { obstacle: false });
  const lantern = addCylinder(rail, 'INDUSTRIAL__WORKER_LANTERN_WITHOUT_WORKER', 0.09, 0.22, mats.amberLight, [-0.55, FLOOR_Y + 0.03, 0.72], 10, false);
  lantern.userData.animate = 'industrial-flicker';
  for (const x of [-1.45, 1.45]) addBox(rail, 'INDUSTRIAL__OVERHEAD_MAINTENANCE_GANTRY_LEG', [m(0.18), 1.35, m(0.18)], mats.rust, [x, FLOOR_Y, -0.05]);
  addBox(rail, 'INDUSTRIAL__OVERHEAD_MAINTENANCE_GANTRY', [3.05, m(0.18), m(0.22)], mats.rust, [0, FLOOR_Y + 1.32, -0.05], { obstacle: false });
  addBox(rail, 'INDUSTRIAL__MANUAL_TRACK_SWITCH', [m(0.9), m(0.12), m(0.4)], mats.rust, [-1.22, FLOOR_Y + 0.01, 0.55], { obstacle: false });
  for (const [index, x] of [[1, -0.4], [2, 0.2]] as const) {
    const oil = new THREE.Mesh(new THREE.CircleGeometry(0.25, 20), mats.puddle);
    oil.name = `INDUSTRIAL__RAIL_OIL_STAIN_${index}`;
    oil.rotation.x = -Math.PI / 2;
    oil.scale.set(1.2, 0.45, 1);
    oil.position.set(x, FLOOR_Y + 0.025, -0.58);
    rail.add(oil);
  }
}

function addColdStorage(group: THREE.Group, mats: ReturnType<typeof createIndustrialMaterials>) {
  const cold = facility(group, 'INDUSTRIAL__COLD_STORAGE_FACILITY', 7.7, -3.5, 0);
  addBox(cold, 'INDUSTRIAL__COLD_STORAGE_WHITE_SHELL', [2.45, 1.65, 1.72], mats.coldPanel, [0, FLOOR_Y, 0]);
  addBox(cold, 'INDUSTRIAL__COLD_STORAGE_BLUE_TRIM', [2.52, 0.12, 1.78], mats.valveBlue, [0, FLOOR_Y + 1.65, 0]);
  for (let index = 0; index < 4; index += 1) {
    addBox(cold, `INDUSTRIAL__COLD_LOADING_BAY_${index + 1}`, [0.42, 0.62, 0.055], index === 2 ? mats.mist : mats.rubber, [-0.78 + index * 0.52, FLOOR_Y + 0.18, 0.89], { obstacle: false, shadows: false });
  }
  for (let index = 0; index < 3; index += 1) {
    const compressor = addBox(cold, `INDUSTRIAL__REFRIGERATION_COMPRESSOR_${index + 1}`, [0.52, 0.34, 0.32], mats.darkMetal, [-0.62 + index * 0.62, FLOOR_Y + 1.66, -0.22], { obstacle: false });
    const fan = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.024, 6, 18), mats.frostMetal);
    fan.name = `INDUSTRIAL__REFRIGERATION_FAN_${index + 1}`;
    fan.position.set(compressor.position.x, FLOOR_Y + 2.02, -0.22);
    fan.rotation.x = Math.PI / 2;
    fan.userData.animate = 'industrial-fan';
    fan.userData.speed = 0.34 + index * 0.05;
    cold.add(fan);
  }
  addPipe(cold, 'INDUSTRIAL__FROST_COVERED_EXTERNAL_PIPE', new THREE.Vector3(-1.28, FLOOR_Y + 0.32, -0.45), new THREE.Vector3(-1.28, FLOOR_Y + 1.72, -0.45), 0.07, mats.frostMetal);
  for (let index = 0; index < 8; index += 1) {
    const icicle = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.18 + (index % 3) * 0.05, 7), mats.frost);
    icicle.name = `INDUSTRIAL__IMPOSSIBLE_ICICLE_${index + 1}`;
    icicle.position.set(-1.05 + index * 0.3, FLOOR_Y + 1.61, 0.92);
    cold.add(icicle);
  }
  for (let index = 0; index < 5; index += 1) {
    const mist = new THREE.Mesh(new THREE.SphereGeometry(0.18 + index * 0.035, 10, 7), mats.mist.clone());
    mist.name = `INDUSTRIAL__COLD_DOCK_MIST_${index + 1}`;
    mist.position.set(0.28 + index * 0.14, FLOOR_Y + 0.22 + index * 0.05, 1.08 + index * 0.09);
    mist.userData.animate = 'industrial-steam';
    mist.userData.phase = index * 0.8;
    mist.userData.baseY = mist.position.y;
    cold.add(mist);
  }
  const truck = facility(cold, 'INDUSTRIAL__REFRIGERATED_TRUCK_ENGINE_RUNNING', 0.45, 1.45, 0);
  addBox(truck, 'INDUSTRIAL__REFRIGERATED_TRUCK_BOX', [m(8.5), m(3.2), m(2.5)], mats.coldPanel, [-0.2, FLOOR_Y + m(0.8), 0]);
  addBox(truck, 'INDUSTRIAL__REFRIGERATED_TRUCK_CAB', [m(3.4), m(2.6), m(2.45)], mats.coldPanel, [0.48, FLOOR_Y + m(0.8), 0]);
  for (const x of [-0.46, 0.42]) for (const z of [-0.1, 0.1]) addWheel(truck, 'INDUSTRIAL__TRUCK_WHEEL', m(0.52), m(0.24), mats.rubber, x, z);
  truck.userData.animate = 'industrial-truck-vibration';
  truck.userData.baseY = truck.position.y;
  addBox(cold, 'INDUSTRIAL__OPEN_COLD_SERVICE_DOOR', [0.36, 0.72, 0.04], mats.fluorescent, [-0.96, FLOOR_Y + 0.08, 0.9], { obstacle: false, shadows: false });
  for (const [index, x] of [[1, 0.18], [2, 0.43]] as const) addBox(cold, `INDUSTRIAL__TYRE_TRACKS_ENTERING_FOG_ONLY_${index}`, [m(0.22), m(0.025), 1.65], mats.rubber, [x, FLOOR_Y + 0.01, 1.55], { obstacle: false, shadows: false });
  addBox(cold, 'INDUSTRIAL__CONDENSATION_STAIN', [0.72, 0.012, 0.35], mats.puddle, [-0.5, FLOOR_Y + 0.02, 1.02], { obstacle: false, shadows: false });
}

function addRecyclingHall(group: THREE.Group, mats: ReturnType<typeof createIndustrialMaterials>) {
  const recycling = facility(group, 'INDUSTRIAL__RECYCLING_SORTING_HALL', -3.1, 4.35, Math.PI);
  addBox(recycling, 'INDUSTRIAL__RECYCLING_BACK', [2.0, 1.32, 0.1], mats.corrugated, [0, FLOOR_Y, -0.72]);
  addBox(recycling, 'INDUSTRIAL__RECYCLING_LEFT', [0.11, 1.32, 1.5], mats.corrugated, [-1.0, FLOOR_Y, 0]);
  addBox(recycling, 'INDUSTRIAL__RECYCLING_RIGHT', [0.11, 1.32, 1.5], mats.corrugated, [1.0, FLOOR_Y, 0]);
  addBox(recycling, 'INDUSTRIAL__RECYCLING_ROOF', [2.08, 0.11, 1.58], mats.roof, [0, FLOOR_Y + 1.32, 0]);
  const conveyor = addBox(recycling, 'INDUSTRIAL__EMPTY_RECYCLING_CONVEYOR', [1.55, 0.14, 0.42], mats.rubber, [0, FLOOR_Y + 0.46, 0.05], { obstacle: false });
  conveyor.userData.animate = 'industrial-conveyor';
  conveyor.userData.baseX = conveyor.position.x;
  for (let index = 0; index < 4; index += 1) addBox(recycling, `INDUSTRIAL__COMPACTED_MATERIAL_BALE_${index + 1}`, [m(1.2), m(1.1), m(0.9)], mats.cardboard, [-0.36 + index * 0.24, FLOOR_Y, -0.45]);
  for (let index = 0; index < 3; index += 1) addBox(recycling, `INDUSTRIAL__EMPTY_SORTING_STATION_${index + 1}`, [m(1.1), m(0.95), m(0.8)], mats.metal, [-0.28 + index * 0.28, FLOOR_Y, 0.5]);
  addBox(recycling, 'INDUSTRIAL__STATIONARY_LOADER', [m(4.8), m(2.8), m(2.2)], mats.safetyYellow, [0.7, FLOOR_Y, -0.02]);
  for (let index = 0; index < 3; index += 1) addBox(recycling, `INDUSTRIAL__HANGING_WORK_GLOVE_${index + 1}`, [m(0.12), m(0.28), m(0.05)], mats.safetyYellow, [-0.18 + index * 0.18, FLOOR_Y + 0.75, 0.76], { obstacle: false, shadows: false });
  const panel = addBox(recycling, 'INDUSTRIAL__SORTING_CONTROL_PANEL', [0.3, 0.44, 0.16], mats.machineGreen, [-0.82, FLOOR_Y, 0.43]);
  const blink = addCylinder(recycling, 'INDUSTRIAL__SORTING_PANEL_BLINK', 0.035, 0.05, mats.redLight, [-0.82, FLOOR_Y + 0.46, 0.5], 10, false);
  blink.rotation.x = Math.PI / 2;
  blink.userData.animate = 'industrial-beacon';
  panel.userData.navObstacle = true;
  for (let index = 0; index < 3; index += 1) addBox(recycling, `INDUSTRIAL__SPARSE_SORTING_BIN_${index + 1}`, [m(1.2), m(1.25), m(1.0)], mats.machineGreen, [-0.6 + index * 0.6, FLOOR_Y, -0.62]);
  const netting = addBox(recycling, 'INDUSTRIAL__TORN_PROTECTIVE_NETTING', [1.65, 0.72, m(0.03)], mats.fence, [0, FLOOR_Y + 0.48, 0.73], { obstacle: false, shadows: false });
  netting.rotation.z = -0.06;
}

function addSilos(group: THREE.Group, mats: ReturnType<typeof createIndustrialMaterials>) {
  const silos = facility(group, 'INDUSTRIAL__STORAGE_SILOS', 4.9, -4.65, 0);
  const positions = [-0.78, -0.25, 0.3, 0.83];
  positions.forEach((x, index) => {
    addCylinder(silos, `INDUSTRIAL__STORAGE_SILO_${index + 1}`, 0.29, 3.05 + (index % 2) * 0.28, mats.silo, [x, FLOOR_Y, 0], 20);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.28, 20), mats.roof);
    cap.name = `INDUSTRIAL__SILO_ROOF_${index + 1}`;
    cap.position.set(x, FLOOR_Y + 3.19 + (index % 2) * 0.28, 0);
    silos.add(cap);
    for (let rung = 0; rung < 13; rung += 1) addBox(silos, `INDUSTRIAL__SILO_LADDER_RUNG_${index + 1}_${rung + 1}`, [0.18, 0.018, 0.025], mats.rust, [x, FLOOR_Y + 0.28 + rung * 0.2, 0.31], { obstacle: false, shadows: false });
    for (let cage = 0; cage < 6; cage += 1) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(m(0.42), m(0.025), 5, 14, Math.PI), mats.rust);
      hoop.name = `INDUSTRIAL__SILO_LADDER_CAGE_${index + 1}_${cage + 1}`;
      hoop.position.set(x, FLOOR_Y + 0.7 + cage * 0.38, 0.31);
      silos.add(hoop);
    }
    if (index !== 2) addSign(silos, `INDUSTRIAL__SILO_ID_${index + 1}`, index === 0 ? '04' : index === 1 ? '07' : '09', 'SILO', 0.28, 0.34, [x, FLOOR_Y + 1.45, 0.305]);
    const vent = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 18), mats.darkMetal);
    vent.name = `INDUSTRIAL__SLOW_SILO_ROOF_VENT_${index + 1}`;
    vent.position.set(x, FLOOR_Y + 3.4 + (index % 2) * 0.28, 0);
    vent.rotation.x = Math.PI / 2;
    vent.userData.animate = 'industrial-fan';
    vent.userData.speed = 0.09;
    silos.add(vent);
  });
  addBox(silos, 'INDUSTRIAL__RUSTED_SILO_CATWALK', [2.08, 0.08, 0.34], mats.grate, [0.03, FLOOR_Y + 2.6, 0], { obstacle: false, walkable: true });
  addPipe(silos, 'INDUSTRIAL__SILO_TRANSFER_PIPE', new THREE.Vector3(-1.02, FLOOR_Y + 2.82, -0.35), new THREE.Vector3(1.1, FLOOR_Y + 2.82, -0.35), 0.065, mats.rust);
  addBox(silos, 'INDUSTRIAL__DARK_OPEN_ACCESS_HATCH', [0.25, 0.38, 0.025], mats.darkness, [0.3, FLOOR_Y + 0.2, 0.32], { obstacle: false, shadows: false });
  const chain = addPipe(silos, 'INDUSTRIAL__UNEXPLAINED_SWINGING_CHAIN', new THREE.Vector3(0.92, FLOOR_Y + 2.58, 0.22), new THREE.Vector3(0.92, FLOOR_Y + 1.68, 0.22), 0.014, mats.rust);
  chain.userData.animate = 'industrial-chain';
  chain.userData.phase = 0.7;
}

function addSecurityCheckpoint(group: THREE.Group, mats: ReturnType<typeof createIndustrialMaterials>) {
  const security = facility(group, 'INDUSTRIAL__SECURITY_CHECKPOINT', -0.6, 5.3, Math.PI);
  addBox(security, 'INDUSTRIAL__SECURITY_BOOTH_SHELL', [m(4.2), m(2.9), m(3.2)], mats.concrete, [0, FLOOR_Y, 0]);
  addBox(security, 'INDUSTRIAL__DIRTY_SECURITY_WINDOWS', [m(3.5), m(1.45), m(0.08)], mats.cloudyGlass, [0, FLOOR_Y + m(1.1), m(1.62)], { obstacle: false, shadows: false });
  addBox(security, 'INDUSTRIAL__SECURITY_DESK', [m(2.4), m(0.9), m(0.8)], mats.wood, [0, FLOOR_Y, m(0.9)]);
  for (let index = 0; index < 6; index += 1) {
    const screenMat = index === 4 ? mats.liveScreen : mats.darkness;
    addBox(security, index === 4 ? 'INDUSTRIAL__IMPOSSIBLE_LIVE_SURVEILLANCE_SCREEN' : `INDUSTRIAL__INACTIVE_CRT_SCREEN_${index + 1}`, [m(0.52), m(0.42), m(0.24)], screenMat, [-0.09 + (index % 3) * 0.09, FLOOR_Y + 0.17 + Math.floor(index / 3) * 0.055, 0.145], { obstacle: false, shadows: false });
  }
  addCylinder(security, 'INDUSTRIAL__EMPTY_SECURITY_MUG', m(0.05), m(0.1), mats.ceramic, [0.08, FLOOR_Y + m(0.9), 0.08], 12, false);
  addBox(security, 'INDUSTRIAL__ANALOGUE_RADIO', [m(0.28), m(0.18), m(0.14)], mats.darkMetal, [-0.08, FLOOR_Y + m(0.9), 0.08], { obstacle: false });
  addSign(security, 'INDUSTRIAL__BLANK_VISITOR_LOG', 'VISITORS', '— BLANK PAGE —', m(0.6), m(0.34), [0, FLOOR_Y + m(0.96), 0.15]);
  addBox(security, 'INDUSTRIAL__GUARD_COAT_ON_EMPTY_CHAIR', [m(0.55), m(0.9), m(0.08)], mats.soot, [0.12, FLOOR_Y + m(0.25), -0.08], { obstacle: false });
  addCylinder(security, 'INDUSTRIAL__OPEN_GATE_POST', 0.045, 1.0, mats.safetyYellow, [-0.68, FLOOR_Y, 0.65], 8);
  addBox(security, 'INDUSTRIAL__RAISED_BARRIER_ARM', [1.8, 0.08, 0.08], mats.safetyYellow, [-0.68, FLOOR_Y + 0.98, 0.65], { obstacle: false }).rotation.z = Math.PI / 2.5;
  addSign(security, 'INDUSTRIAL__VISITORS_REPORT_TO_SECURITY_SIGN', 'ALL VISITORS', 'REPORT TO SECURITY', 0.86, 0.32, [-1.08, FLOOR_Y + 0.65, 0.42], Math.PI / 2, true);
  const camera = addBox(security, 'INDUSTRIAL__CAMERA_POINTING_AT_VIEWER', [m(0.32), m(0.14), m(0.14)], mats.darkMetal, [0.18, FLOOR_Y + 0.31, 0.18], { obstacle: false });
  camera.userData.animate = 'industrial-camera';
  camera.userData.baseRotationY = 0;
}

function addMaintenanceTunnel(group: THREE.Group, mats: ReturnType<typeof createIndustrialMaterials>) {
  const tunnel = facility(group, 'INDUSTRIAL__MAINTENANCE_TUNNEL_ENTRANCE', -8.7, -7.15, Math.PI / 2);
  addBox(tunnel, 'INDUSTRIAL__TUNNEL_RETAINING_WALL', [1.7, 1.15, 0.38], mats.concrete, [0, FLOOR_Y, -0.32]);
  addBox(tunnel, 'INDUSTRIAL__TUNNEL_DARK_PORTAL', [0.95, 0.82, 0.04], mats.darkness, [0, FLOOR_Y + 0.02, -0.12], { obstacle: false, shadows: false });
  const ramp = addBox(tunnel, 'INDUSTRIAL__DESCENDING_TUNNEL_RAMP', [0.92, 0.08, 1.55], mats.asphalt, [0, FLOOR_Y - 0.12, 0.68], { obstacle: false, walkable: true });
  ramp.rotation.x = -0.12;
  addBox(tunnel, 'INDUSTRIAL__TUNNEL_HAZARD_HEADER', [1.12, 0.16, 0.09], mats.hazard, [0, FLOOR_Y + 0.86, -0.08], { obstacle: false });
  for (let index = 0; index < 4; index += 1) addBox(tunnel, `INDUSTRIAL__OLD_TUNNEL_FLUORESCENT_${index + 1}`, [0.34, 0.045, 0.08], index === 3 ? mats.darkness : mats.fluorescent, [0, FLOOR_Y + 0.7, 0.15 + index * 0.32], { obstacle: false, shadows: false });
  addPipe(tunnel, 'INDUSTRIAL__UTILITY_PIPE_UNDERGROUND', new THREE.Vector3(-0.36, FLOOR_Y + 0.28, -0.04), new THREE.Vector3(-0.36, FLOOR_Y + 0.28, 1.4), 0.045, mats.rust);
  addBox(tunnel, 'INDUSTRIAL__TUNNEL_DRAINAGE_CHANNEL', [0.12, 0.04, 1.52], mats.grate, [0.37, FLOOR_Y - 0.06, 0.68], { obstacle: false });
  addSign(tunnel, 'INDUSTRIAL__TUNNEL_SIGN', 'MAINTENANCE TUNNEL 4', 'AUTHORIZED PERSONNEL ONLY', 1.08, 0.3, [0, FLOOR_Y + 1.02, -0.1], 0, true);
  addBox(tunnel, 'INDUSTRIAL__MAINTENANCE_TROLLEY', [m(1.2), m(0.85), m(0.7)], mats.machineGreen, [-0.68, FLOOR_Y, 0.38]);
  for (let index = 0; index < 6; index += 1) {
    const footprint = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.17), mats.footprint);
    footprint.name = `INDUSTRIAL__FOOTPRINT_ENTERING_TUNNEL_${index + 1}`;
    footprint.rotation.x = -Math.PI / 2;
    footprint.rotation.z = index % 2 ? 0.12 : -0.12;
    footprint.position.set(index % 2 ? 0.12 : -0.12, FLOOR_Y + 0.035 - index * 0.012, 1.12 - index * 0.22);
    tunnel.add(footprint);
  }
}

function addDistrictInfrastructure(group: THREE.Group, mats: ReturnType<typeof createIndustrialMaterials>) {
  const bridgeY = FLOOR_Y + 1.72;
  for (const x of [-3.0, 0.1, 3.2]) {
    addBox(group, 'INDUSTRIAL__PIPE_BRIDGE_SUPPORT', [0.11, 1.62, 0.11], mats.rust, [x, FLOOR_Y, -1.78]);
  }
  for (const z of [-1.86, -1.7, -1.54]) addPipe(group, 'INDUSTRIAL__OVERHEAD_PIPE_BRIDGE', new THREE.Vector3(-3.05, bridgeY, z), new THREE.Vector3(3.25, bridgeY, z), 0.055, z > -1.7 ? mats.frostMetal : mats.rust);
  addBox(group, 'INDUSTRIAL__FENCED_MAINTENANCE_CORRIDOR', [4.5, 0.65, 0.035], mats.fence, [2.7, FLOOR_Y, -4.12], { obstacle: false, shadows: false });
  for (let index = 0; index < 4; index += 1) {
    addCylinder(group, `INDUSTRIAL__SODIUM_STREETLIGHT_POST_${index + 1}`, 0.035, 1.34, mats.darkMetal, [-6.0 + index * 4.05, FLOOR_Y, index % 2 ? 1.92 : -1.82], 8);
    const lamp = addBox(group, `INDUSTRIAL__SODIUM_STREETLIGHT_${index + 1}`, [0.24, 0.1, 0.14], index === 2 ? mats.amberLight : mats.darkness, [-6.0 + index * 4.05, FLOOR_Y + 1.3, index % 2 ? 1.92 : -1.82], { obstacle: false, shadows: false });
    if (index === 2) lamp.userData.animate = 'industrial-flicker';
  }
  const warning = addCylinder(group, 'INDUSTRIAL__MALFUNCTIONING_AMBER_WARNING_LIGHT', 0.08, 0.15, mats.amberLight, [0.55, FLOOR_Y + 0.82, 1.72], 12, false);
  addCylinder(group, 'INDUSTRIAL__WARNING_LIGHT_POST', 0.035, 0.82, mats.rust, [0.55, FLOOR_Y, 1.72], 8);
  warning.userData.animate = 'industrial-beacon';
  warning.userData.phase = 1.7;
  for (const [index, x, z] of [[1, -0.3, 1.66], [2, 2.7, -1.58], [3, -4.1, 1.62]] as const) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(m(0.18), m(0.72), 12), mats.safetyOrange);
    cone.name = `INDUSTRIAL__ABANDONED_TRAFFIC_CONE_${index}`;
    cone.position.set(x, FLOOR_Y + m(0.36), z);
    cone.rotation.z = index === 2 ? 0.62 : 0;
    group.add(cone);
  }

  const pickup = facility(group, 'INDUSTRIAL__OLD_MAINTENANCE_PICKUP', -4.7, 2.02, 0.04);
  addBox(pickup, 'INDUSTRIAL__PICKUP_BODY', [m(5.3), m(0.95), m(2.0)], mats.machineGreen, [0, FLOOR_Y + m(0.45), 0]);
  addBox(pickup, 'INDUSTRIAL__PICKUP_CAB', [m(2.2), m(1.25), m(1.9)], mats.machineGreen, [0.16, FLOOR_Y + m(1.4), 0]);
  const van = facility(group, 'INDUSTRIAL__PARKED_UTILITY_VAN', 2.35, -2.02, -0.04);
  addBox(van, 'INDUSTRIAL__UTILITY_VAN_BODY', [m(5.4), m(2.3), m(2.0)], mats.coldPanel, [0, FLOOR_Y + m(0.45), 0]);
  const forklift = facility(group, 'INDUSTRIAL__ABANDONED_FORKLIFT', -1.35, 2.02, -0.18);
  addBox(forklift, 'INDUSTRIAL__FORKLIFT_BODY', [m(3.1), m(1.1), m(1.5)], mats.safetyYellow, [0, FLOOR_Y + m(0.35), 0]);
  addBox(forklift, 'INDUSTRIAL__FORKLIFT_MAST', [m(0.18), m(2.35), m(1.6)], mats.darkMetal, [0.18, FLOOR_Y + m(0.2), 0]);
  addBox(forklift, 'INDUSTRIAL__FORKLIFT_TINES', [m(1.25), m(0.08), m(0.16)], mats.darkMetal, [0.28, FLOOR_Y + m(0.12), 0]);
  for (let index = 0; index < 3; index += 1) addCylinder(group, `INDUSTRIAL__GAS_CYLINDER_${index + 1}`, m(0.14), m(1.4), mats.valveBlue, [6.95 + index * m(0.36), FLOOR_Y, 1.45], 10);
  addBox(group, 'INDUSTRIAL__PADLOCKED_GAS_CYLINDER_CAGE', [m(1.5), m(1.75), m(0.7)], mats.fence, [7.1, FLOOR_Y, 1.45], { obstacle: false, shadows: false });

  const farVehicle = facility(group, 'INDUSTRIAL__DISTANT_VEHICLE_HEADLIGHTS', 5.48, -4.3, 0);
  for (const x of [-0.13, 0.13]) {
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 7), mats.fluorescent);
    light.name = 'INDUSTRIAL__DISTANT_HEADLIGHT';
    light.position.set(x, FLOOR_Y + 0.18, 0);
    farVehicle.add(light);
  }

  const traces = facility(group, 'INDUSTRIAL__PERSONAL_TRACES', -0.2, 1.02, 0);
  const railing = addPipe(traces, 'INDUSTRIAL__PERSONAL_TRACE_RAILING', new THREE.Vector3(-0.6, FLOOR_Y + 0.62, 0), new THREE.Vector3(0.6, FLOOR_Y + 0.62, 0), 0.035, mats.rust);
  railing.userData.navObstacle = false;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(m(0.16), 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.safetyYellow);
  helmet.name = 'INDUSTRIAL__HARD_HAT_ON_RAILING';
  helmet.position.set(0.25, FLOOR_Y + 0.72, 0);
  traces.add(helmet);
  addBox(traces, 'INDUSTRIAL__REFLECTIVE_JACKET_ON_HOOK', [m(0.55), m(0.75), m(0.05)], mats.safetyOrange, [-0.25, FLOOR_Y + 0.5, 0.02], { obstacle: false, shadows: false });
  addBox(traces, 'INDUSTRIAL__OPEN_LUNCH_CONTAINER', [m(0.3), m(0.08), m(0.22)], mats.metal, [0.52, FLOOR_Y + 0.42, 0.08], { obstacle: false });
  addSign(traces, 'INDUSTRIAL__EMPLOYEE_ID_ON_WET_ASPHALT', 'D. CHEN', 'UNIT 4', m(0.42), m(0.26), [-0.58, FLOOR_Y + 0.04, 0.18], 0.1);
  addBox(traces, 'INDUSTRIAL__DROPPED_FLASHLIGHT', [m(0.28), m(0.06), m(0.06)], mats.darkMetal, [0.62, FLOOR_Y + 0.04, 0.28], { obstacle: false });
  addBox(traces, 'INDUSTRIAL__WORK_BOOTS_AT_PERSONNEL_ENTRANCE', [m(0.58), m(0.22), m(0.34)], mats.soot, [-0.48, FLOOR_Y + 0.02, -0.14], { obstacle: false });

  const directionalMarking = addSign(
    group,
    'INDUSTRIAL__FADED_DIRECTIONAL_ARROW',
    '← RAIL   PROCESS →',
    'ASSEMBLY POINT C',
    1.45,
    0.34,
    [0.15, FLOOR_Y + 0.035, 1.7],
    0,
    true,
  );
  directionalMarking.rotation.x = -Math.PI / 2;

  for (let index = 0; index < 6; index += 1) {
    const mist = new THREE.Mesh(new THREE.SphereGeometry(0.42 + index * 0.06, 12, 8), mats.mist.clone());
    mist.name = `INDUSTRIAL__GROUND_MIST_${index + 1}`;
    mist.scale.set(2.2, 0.28, 0.72);
    mist.position.set(-6.2 + index * 2.45, FLOOR_Y + 0.16, index % 2 ? -0.25 : 0.3);
    mist.userData.animate = 'industrial-ground-mist';
    mist.userData.phase = index * 0.9;
    mist.userData.baseX = mist.position.x;
    group.add(mist);
  }
}

function createIndustrialMaterials() {
  const corrugatedTexture = industrialTexture('corrugated');
  const brickTexture = industrialTexture('brick');
  const asphaltTexture = industrialTexture('asphalt');
  const concreteTexture = industrialTexture('concrete');
  const frostTexture = industrialTexture('frost');
  const railWet = material('#aab2b4', { emissive: '#242a2c', emissiveIntensity: 0.16, roughness: 0.18, metalness: 0.98, depthTest: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
  const railBallast = material('#20272a', { map: asphaltTexture, bumpMap: asphaltTexture, bumpScale: 0.02, roughness: 0.88, metalness: 0.1, depthTest: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const railSleeper = material('#3b312a', { roughness: 0.9, metalness: 0.16, depthTest: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 });
  for (const railMaterial of [railWet, railBallast, railSleeper]) {
    railMaterial.userData.groundRoadDepthMode = true;
  }
  return {
    asphalt: material('#1c252a', { map: asphaltTexture, bumpMap: asphaltTexture, bumpScale: 0.018, roughness: 0.68, metalness: 0.14 }),
    wetConcrete: material('#4f5a5e', { map: concreteTexture, bumpMap: concreteTexture, bumpScale: 0.012, roughness: 0.54, metalness: 0.12 }),
    concrete: material('#4d585c', { map: concreteTexture, bumpMap: concreteTexture, bumpScale: 0.016, roughness: 0.75, metalness: 0.08 }),
    corrugated: material('#354147', { map: corrugatedTexture, bumpMap: corrugatedTexture, bumpScale: 0.025, roughness: 0.64, metalness: 0.38 }),
    brick: material('#4b302c', { map: brickTexture, bumpMap: brickTexture, bumpScale: 0.026, roughness: 0.82, metalness: 0.02 }),
    roof: material('#242c2f', { roughness: 0.72, metalness: 0.5 }),
    darkMetal: material('#1a2225', { roughness: 0.5, metalness: 0.72 }),
    metal: material('#778184', { roughness: 0.44, metalness: 0.76 }),
    frostMetal: material('#aebec1', { map: frostTexture, bumpMap: frostTexture, bumpScale: 0.01, roughness: 0.42, metalness: 0.6 }),
    rust: material('#6f3a28', { roughness: 0.84, metalness: 0.46 }),
    heatMetal: material('#503b34', { roughness: 0.58, metalness: 0.62 }),
    soot: material('#111719', { roughness: 0.92, metalness: 0.22 }),
    blackGlass: material('#071217', { roughness: 0.2, metalness: 0.38 }),
    cloudyGlass: new THREE.MeshPhysicalMaterial({ color: '#5a7478', roughness: 0.34, metalness: 0.08, transparent: true, opacity: 0.52, transmission: 0.12, side: THREE.DoubleSide }),
    litWindow: material('#e7b46e', { color: '#d7a45f', emissive: '#d2934a', emissiveIntensity: 2.4, roughness: 0.28 }),
    fluorescent: material('#dceef0', { emissive: '#dceef0', emissiveIntensity: 3.6, roughness: 0.18 }),
    amberLight: material('#d78a2d', { emissive: '#ff9e32', emissiveIntensity: 4.2, roughness: 0.2 }),
    redLight: material('#9f211b', { emissive: '#ff372a', emissiveIntensity: 4.5, roughness: 0.22 }),
    greenLight: material('#1b6c4c', { emissive: '#45ffab', emissiveIntensity: 4.3, roughness: 0.22 }),
    liveScreen: material('#547b78', { emissive: '#7bbab5', emissiveIntensity: 1.5, roughness: 0.36 }),
    furnace: material('#8c2e14', { emissive: '#ff4b18', emissiveIntensity: 4.8, roughness: 0.28 }),
    darkness: material('#010405', { roughness: 1, metalness: 0 }),
    rollupDoor: material('#4d5657', { map: corrugatedTexture, bumpMap: corrugatedTexture, bumpScale: 0.02, roughness: 0.66, metalness: 0.52 }),
    rubber: material('#090c0d', { roughness: 0.94, metalness: 0 }),
    wood: material('#594634', { roughness: 0.9, metalness: 0.02 }),
    machineGreen: material('#374b43', { roughness: 0.7, metalness: 0.48 }),
    coldPanel: material('#687379', { map: frostTexture, roughness: 0.42, metalness: 0.28 }),
    frost: material('#d8e4e5', { emissive: '#b9d5d8', emissiveIntensity: 0.22, roughness: 0.38 }),
    safetyYellow: material('#9f7c24', { roughness: 0.74, metalness: 0.26 }),
    safetyOrange: material('#b54e20', { roughness: 0.72, metalness: 0.08 }),
    fadedPaint: material('#a9a58d', { transparent: true, opacity: 0.48, roughness: 0.8 }),
    hazard: material('#b28d21', { map: signTexture('////', '', true), roughness: 0.68, metalness: 0.2 }),
    valveBlue: material('#285c70', { roughness: 0.5, metalness: 0.52 }),
    silo: material('#747c7c', { map: concreteTexture, bumpMap: concreteTexture, bumpScale: 0.014, roughness: 0.68, metalness: 0.24 }),
    ceramic: material('#c5beb0', { roughness: 0.34, metalness: 0.02 }),
    gauge: material('#c0bba8', { emissive: '#5b1b12', emissiveIntensity: 0.35, roughness: 0.48, side: THREE.DoubleSide }),
    darkFloor: material('#171d1f', { roughness: 0.78, metalness: 0.24 }),
    water: new THREE.MeshPhysicalMaterial({ color: '#0b252d', roughness: 0.18, metalness: 0.26, transparent: true, opacity: 0.82, clearcoat: 0.8 }),
    puddle: new THREE.MeshPhysicalMaterial({ color: '#172b31', roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.72, clearcoat: 1, side: THREE.DoubleSide }),
    stripCurtain: new THREE.MeshPhysicalMaterial({ color: '#9daeb0', roughness: 0.32, metalness: 0.02, transparent: true, opacity: 0.28, transmission: 0.2, side: THREE.DoubleSide }),
    mist: new THREE.MeshBasicMaterial({ color: '#aabcc2', transparent: true, opacity: 0.095, depthWrite: false, side: THREE.DoubleSide }),
    grate: material('#30393a', { map: corrugatedTexture, roughness: 0.62, metalness: 0.72 }),
    rail: material('#343b3c', { roughness: 0.34, metalness: 0.86 }),
    railWet,
    railBallast,
    railSleeper,
    referenceConcrete: material('#465158', { map: concreteTexture, bumpMap: concreteTexture, bumpScale: 0.018, roughness: 0.82, metalness: 0.08 }),
    referenceConcreteDark: material('#303a3f', { map: concreteTexture, bumpMap: concreteTexture, bumpScale: 0.02, roughness: 0.86, metalness: 0.08 }),
    referenceConcreteLight: material('#59646a', { map: concreteTexture, bumpMap: concreteTexture, bumpScale: 0.015, roughness: 0.78, metalness: 0.08 }),
    referenceWindow: material('#111b20', { roughness: 0.22, metalness: 0.42 }),
    referenceRust: material('#55342e', { roughness: 0.82, metalness: 0.48 }),
    fence: material('#596263', { transparent: true, opacity: 0.48, roughness: 0.52, metalness: 0.66, wireframe: true }),
    weed: material('#374532', { roughness: 0.94, metalness: 0 }),
    cardboard: material('#75664e', { roughness: 0.94, metalness: 0 }),
    footprint: material('#232a2b', { transparent: true, opacity: 0.42, roughness: 0.88, side: THREE.DoubleSide }),
  };
}

export function buildIndustrialDistrict(group: THREE.Group, definition: DistrictDefinition) {
  const mats = createIndustrialMaterials();
  group.userData.industrialDistrict = {
    atmosphere: 'overcast twilight after rain',
    status: 'evacuated; automatic infrastructure remains operational',
    centralRoadMetres: Math.round(definition.footprint[0] * 10),
    facilities: [
      'main manufacturing hall',
      'abandoned warehouse',
      'brick power station',
      'industrial administration',
      'water treatment',
      'boiler house',
      'rail maintenance shed',
      'cold storage',
      'recycling hall',
      'storage silos',
      'security checkpoint',
      'maintenance tunnel',
    ],
  };
  addRoadAndYards(group, definition, mats);
  addIndustrialRailCanyon(group, mats);
  addManufacturingHall(group, mats);
  addWarehouse(group, mats);
  addPowerStation(group, mats);
  addAdministration(group, mats);
  addWaterTreatment(group, mats);
  addBoilerHouse(group, mats);
  addRailMaintenance(group, mats);
  addColdStorage(group, mats);
  addRecyclingHall(group, mats);
  addSilos(group, mats);
  addSecurityCheckpoint(group, mats);
  addMaintenanceTunnel(group, mats);
  addDistrictInfrastructure(group, mats);
  buildIndustrialRailway(group, definition);
}
