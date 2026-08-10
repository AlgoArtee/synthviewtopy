import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BiomeDefinition } from '../data/districts';
import { BIOME_PLAN_POSITIONS, COASTAL_RAIL_INSET, DISTRICT_ROAD_RADII, ISLAND_POINTS, ISLAND_RADIUS, ISLAND_SURFACE_Y, MASTERPLAN_RESCALE, metresToWorldUnits } from '../config/island';

const PLANTED_SURFACE_Y = ISLAND_SURFACE_Y;
const ROAD_SURFACE_Y = PLANTED_SURFACE_Y + 0.006;
const ROAD_THICKNESS = 0.012;
const ROAD_CENTER_Y = ROAD_SURFACE_Y - ROAD_THICKNESS * 0.5;
const ROAD_MARKING_THICKNESS = 0.003;
const ROAD_MARKING_CENTER_Y = ROAD_SURFACE_Y + ROAD_MARKING_THICKNESS * 0.5;
const RADIAL_ARTERIAL_WIDTH = 1.65;
const RING_CURB_JUNCTION_CLEARANCE = 0.35;
const RING_CURB_JUNCTION_OPENING_WIDTH = RADIAL_ARTERIAL_WIDTH + RING_CURB_JUNCTION_CLEARANCE * 2;
const CENTRAL_PLAZA_RADIUS = DISTRICT_ROAD_RADII[0] - 3.4;
const CENTRAL_TRANSIT_GAP_RADIUS = DISTRICT_ROAD_RADII[0] - 8;
const LEGACY_CENTRAL_PLAZA_Y = 1.835;
const COASTAL_RAIL_SLEEPER_HEIGHT = metresToWorldUnits(0.12);
const COASTAL_RAIL_CENTER_Y = ROAD_SURFACE_Y + metresToWorldUnits(0.14);
const COASTAL_RAIL_HEIGHT = metresToWorldUnits(0.16);
const COASTAL_RAIL_HEAD_Y = COASTAL_RAIL_CENTER_Y + COASTAL_RAIL_HEIGHT * 0.5;
const COASTAL_RAIL_HALF_GAUGE = metresToWorldUnits(1.435 * 0.5);
const COASTAL_TRAIN_WHEEL_RADIUS = metresToWorldUnits(0.46);
const COASTAL_TRAIN_WHEEL_CENTER_Y = metresToWorldUnits(0.5);
const COASTAL_TRAIN_ORIGIN_Y = COASTAL_RAIL_HEAD_Y
  - (COASTAL_TRAIN_WHEEL_CENTER_Y - COASTAL_TRAIN_WHEEL_RADIUS);

function islandShape(scale = 1) {
  const shape = new THREE.Shape();
  ISLAND_POINTS.forEach(([x, z], index) => {
    const px = x * scale;
    const pz = z * scale;
    if (index === 0) shape.moveTo(px, pz);
    else shape.lineTo(px, pz);
  });
  shape.closePath();
  return shape;
}

function makeEllipseCurve(radiusX: number, radiusZ: number, y: number) {
  const points: THREE.Vector3[] = [];
  for (let index = 0; index < 192; index += 1) {
    const angle = (index / 192) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radiusX, y, Math.sin(angle) * radiusZ));
  }
  return new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.12);
}

function ellipseStrip(radiusX: number, radiusZ: number, width: number, y: number, segments = 192) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    positions.push(cos * (radiusX - width * 0.5), y, sin * (radiusZ - width * 0.5));
    positions.push(cos * (radiusX + width * 0.5), y, sin * (radiusZ + width * 0.5));
    uvs.push(index / segments, 0, index / segments, 1);
    if (index < segments) {
      const base = index * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function annularSectorGeometry(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  angleLength: number,
  segments = 192,
) {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const fraction = index / segments;
    const angle = startAngle + fraction * angleLength;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    positions.push(cos * innerRadius, 0, sin * innerRadius);
    positions.push(cos * outerRadius, 0, sin * outerRadius);
    normals.push(0, 1, 0, 0, 1, 0);
    uvs.push(fraction, 0, fraction, 1);
    if (index < segments) {
      const base = index * 2;
      indices.push(base, base + 2, base + 1, base + 2, base + 3, base + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function segmentedRingCurbGeometry(
  radius: number,
  profileRadius: number,
  openingAngles: readonly number[],
  openingWidth: number,
) {
  const fullTurn = Math.PI * 2;
  const normalizedAngles = openingAngles
    .map((angle) => ((angle % fullTurn) + fullTurn) % fullTurn)
    .sort((left, right) => left - right);
  const openingHalfAngle = Math.asin(Math.min(0.99, openingWidth * 0.5 / radius));
  const arcGeometries = normalizedAngles.flatMap((angle, index) => {
    const nextAngle = normalizedAngles[(index + 1) % normalizedAngles.length]
      + (index === normalizedAngles.length - 1 ? fullTurn : 0);
    const arcStart = angle + openingHalfAngle;
    const arcLength = nextAngle - openingHalfAngle - arcStart;
    // Nearby district mouths can legitimately form one wider junction. In
    // that case their angular openings overlap and no curb arc belongs between
    // them; never feed a negative sweep into TorusGeometry.
    if (arcLength <= 0.0001) return [];
    const tubularSegments = Math.max(12, Math.ceil(256 * arcLength / fullTurn));
    const geometry = new THREE.TorusGeometry(radius, profileRadius, 8, tubularSegments, arcLength);
    geometry.rotateZ(arcStart);
    return [geometry];
  });
  const merged = mergeGeometries(arcGeometries, false);
  arcGeometries.forEach((geometry) => geometry.dispose());
  if (!merged) throw new Error('Failed to build segmented arterial-ring curb geometry.');
  return merged;
}

function roadSegment(start: THREE.Vector3, end: THREE.Vector3, width: number, material: THREE.Material, height = 0.1) {
  const distance = start.distanceTo(end);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, distance), material);
  mesh.position.copy(start).lerp(end, 0.5);
  mesh.lookAt(end);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function roadAxisWithCentralGap(
  start: THREE.Vector3,
  end: THREE.Vector3,
  gapRadius: number,
  width: number,
  material: THREE.Material,
  height: number,
) {
  const gapPoint = (source: THREE.Vector3) => {
    const direction = source.clone().setY(0).normalize();
    return direction.multiplyScalar(gapRadius).setY(source.y);
  };
  const segments = [
    roadSegment(start, gapPoint(start), width, material, height),
    roadSegment(gapPoint(end), end, width, material, height),
  ];
  const geometries = segments.map((segment) => {
    segment.updateMatrix();
    const geometry = segment.geometry.clone().applyMatrix4(segment.matrix);
    segment.geometry.dispose();
    return geometry;
  });
  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());
  if (!merged) throw new Error('Failed to create the split radial arterial geometry.');
  const road = new THREE.Mesh(merged, material);
  road.castShadow = true;
  road.receiveShadow = true;
  return road;
}

function smoothTaperedRoadTransition(
  start: THREE.Vector3,
  end: THREE.Vector3,
  startWidth: number,
  endWidth: number,
  material: THREE.Material,
  height = 0.3,
  segments = 24,
) {
  const direction = end.clone().sub(start).setY(0).normalize();
  const normal = new THREE.Vector3(-direction.z, 0, direction.x);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const sections: Array<{
    topLeft: THREE.Vector3;
    topRight: THREE.Vector3;
    bottomLeft: THREE.Vector3;
    bottomRight: THREE.Vector3;
    t: number;
  }> = [];

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const eased = t * t * (3 - 2 * t);
    const centre = start.clone().lerp(end, t);
    centre.y = THREE.MathUtils.lerp(start.y, end.y, eased);
    const halfWidth = THREE.MathUtils.lerp(startWidth, endWidth, eased) * 0.5;
    const left = centre.clone().addScaledVector(normal, halfWidth);
    const right = centre.clone().addScaledVector(normal, -halfWidth);
    sections.push({
      topLeft: left.clone().setY(left.y + height * 0.5),
      topRight: right.clone().setY(right.y + height * 0.5),
      bottomLeft: left.clone().setY(left.y - height * 0.5),
      bottomRight: right.clone().setY(right.y - height * 0.5),
      t,
    });
  }

  const addVertex = (point: THREE.Vector3, u: number, v: number) => {
    positions.push(point.x, point.y, point.z);
    uvs.push(u, v);
    return positions.length / 3 - 1;
  };

  // Each surface owns its edge vertices. The top can therefore smooth along
  // the grade without sharing normals with the underside or vertical skirts.
  const top = sections.map((section) => [
    addVertex(section.topLeft, 0, section.t),
    addVertex(section.topRight, 1, section.t),
  ] as const);
  const bottom = sections.map((section) => [
    addVertex(section.bottomLeft, 0, section.t),
    addVertex(section.bottomRight, 1, section.t),
  ] as const);
  const leftSide = sections.map((section) => [
    addVertex(section.topLeft, 0, section.t),
    addVertex(section.bottomLeft, 1, section.t),
  ] as const);
  const rightSide = sections.map((section) => [
    addVertex(section.topRight, 0, section.t),
    addVertex(section.bottomRight, 1, section.t),
  ] as const);

  for (let index = 0; index < segments; index += 1) {
    const [topLeft, topRight] = top[index];
    const [nextTopLeft, nextTopRight] = top[index + 1];
    const [bottomLeft, bottomRight] = bottom[index];
    const [nextBottomLeft, nextBottomRight] = bottom[index + 1];
    const [leftTop, leftBottom] = leftSide[index];
    const [nextLeftTop, nextLeftBottom] = leftSide[index + 1];
    const [rightTop, rightBottom] = rightSide[index];
    const [nextRightTop, nextRightBottom] = rightSide[index + 1];
    indices.push(
      topLeft, nextTopLeft, topRight,
      nextTopLeft, nextTopRight, topRight,
      bottomLeft, bottomRight, nextBottomLeft,
      nextBottomLeft, bottomRight, nextBottomRight,
      leftTop, leftBottom, nextLeftTop,
      nextLeftTop, leftBottom, nextLeftBottom,
      rightTop, nextRightTop, rightBottom,
      nextRightTop, nextRightBottom, rightBottom,
    );
  }

  const startSection = sections[0];
  const startCap = [
    addVertex(startSection.topLeft, 0, 0),
    addVertex(startSection.topRight, 1, 0),
    addVertex(startSection.bottomLeft, 0, 1),
    addVertex(startSection.bottomRight, 1, 1),
  ];
  const endSection = sections[segments];
  const endCap = [
    addVertex(endSection.topLeft, 0, 0),
    addVertex(endSection.topRight, 1, 0),
    addVertex(endSection.bottomLeft, 0, 1),
    addVertex(endSection.bottomRight, 1, 1),
  ];
  indices.push(
    startCap[0], startCap[1], startCap[2],
    startCap[1], startCap[3], startCap[2],
    endCap[0], endCap[2], endCap[1],
    endCap[1], endCap[2], endCap[3],
  );

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.walkable = true;
  mesh.userData.smoothRoadTransition = true;
  mesh.userData.transitionProfile = 'smoothstep-width-and-grade';
  mesh.userData.startWidth = startWidth;
  mesh.userData.endWidth = endWidth;
  mesh.userData.segmentCount = segments;
  mesh.userData.startTopY = start.y + height * 0.5;
  mesh.userData.endTopY = end.y + height * 0.5;
  return mesh;
}

function beamBetween(start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material, segments = 8) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), segments), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  return mesh;
}

function createCoastalTrain(index: number, railPath: readonly THREE.Vector3[], totalPathLength: number) {
  const train = new THREE.Group();
  train.name = `COASTAL_RAIL__TRAIN_${index + 1}`;
  const shellColor = ['#b94f35', '#d6c8a7', '#355b67'][index % 3];
  const shell = new THREE.MeshStandardMaterial({ color: shellColor, roughness: 0.52, metalness: 0.48 });
  const dark = new THREE.MeshStandardMaterial({ color: '#172126', roughness: 0.48, metalness: 0.72 });
  const glass = new THREE.MeshStandardMaterial({ color: '#9ad8df', emissive: '#2d6d78', emissiveIntensity: 0.72, roughness: 0.18, metalness: 0.32 });
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: '#111719', roughness: 0.72, metalness: 0.78 });

  const addVehicle = (name: string, z: number, lengthMetres: number, locomotive = false) => {
    const length = metresToWorldUnits(lengthMetres);
    const body = new THREE.Mesh(
      new RoundedBoxGeometry(metresToWorldUnits(3.05), metresToWorldUnits(locomotive ? 3.85 : 3.6), length, 2, metresToWorldUnits(0.22)),
      shell,
    );
    body.name = name;
    body.position.set(0, metresToWorldUnits(2.25), z);
    body.castShadow = true;
    body.receiveShadow = true;
    train.add(body);
    const roof = new THREE.Mesh(
      new RoundedBoxGeometry(metresToWorldUnits(2.88), metresToWorldUnits(0.16), length * 0.88, 2, metresToWorldUnits(0.05)),
      dark,
    );
    roof.position.set(0, metresToWorldUnits(4.2), z);
    train.add(roof);
    const windowCount = locomotive ? 2 : 5;
    for (const side of [-1, 1]) {
      for (let windowIndex = 0; windowIndex < windowCount; windowIndex += 1) {
        const pane = new THREE.Mesh(
          new THREE.PlaneGeometry(metresToWorldUnits(1.35), metresToWorldUnits(0.82)),
          glass,
        );
        pane.name = `${name}__WINDOW`;
        pane.position.set(
          side * metresToWorldUnits(1.535),
          metresToWorldUnits(2.85),
          z - length * 0.33 + (windowIndex / Math.max(1, windowCount - 1)) * length * 0.66,
        );
        pane.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
        train.add(pane);
      }
    }
    for (const wheelZ of [z - length * 0.32, z + length * 0.32]) {
      for (const side of [-1, 1]) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(COASTAL_TRAIN_WHEEL_RADIUS, COASTAL_TRAIN_WHEEL_RADIUS, metresToWorldUnits(0.2), 12),
          wheelMaterial,
        );
        wheel.name = `${name}__WHEEL`;
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(side * COASTAL_RAIL_HALF_GAUGE, COASTAL_TRAIN_WHEEL_CENTER_Y, wheelZ);
        train.add(wheel);
      }
    }
  };

  addVehicle(`COASTAL_RAIL__LOCOMOTIVE_${index + 1}`, 0, 18, true);
  for (let car = 0; car < 3; car += 1) {
    addVehicle(`COASTAL_RAIL__CARRIAGE_${index + 1}_${car + 1}`, -2.0 - car * 2.05, 18.5);
  }
  train.userData = {
    animate: 'coastal-train',
    railPath: railPath.map((point) => [point.x, point.z]),
    totalPathLength,
    phaseDistance: totalPathLength * (index / 3),
    speed: metresToWorldUnits(7.5 + index * 1.2),
    trackOffset: index % 2 ? -0.21 : 0.21,
    trackY: COASTAL_TRAIN_ORIGIN_Y,
    railHeadY: COASTAL_RAIL_HEAD_Y,
    wheelContactY: COASTAL_RAIL_HEAD_Y,
  };
  return train;
}

function hashRandom(seed = 12345) {
  let value = seed >>> 0;
  return () => {
    value = Math.imul(1664525, value) + 1013904223;
    return (value >>> 0) / 4294967296;
  };
}

export function createIslandShell(target: THREE.Group) {
  target.name = 'LANDSCAPE__ISLAND_SHELL';
  const cliffMaterial = new THREE.MeshStandardMaterial({
    color: '#172325',
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  });
  const cliffGeometry = new THREE.ExtrudeGeometry(islandShape(), {
    depth: 4.3,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 1.4,
    bevelThickness: 0.85,
    curveSegments: 2,
  });
  cliffGeometry.rotateX(Math.PI / 2);
  const cliffs = new THREE.Mesh(cliffGeometry, cliffMaterial);
  cliffs.name = 'Island basalt foundation';
  // ExtrudeGeometry's upper bevel reaches 0.85 world units above its origin.
  // Seat that bevel just below the canonical island surface so terrain never
  // buries roads, railway beds, district floors, or WALK-mode access points.
  cliffs.position.y = ISLAND_SURFACE_Y - 0.87;
  cliffs.castShadow = true;
  cliffs.receiveShadow = true;
  cliffs.userData = { exportCategory: 'terrain', editable: true };
  target.add(cliffs);

  const shoreGeometry = new THREE.ShapeGeometry(islandShape(0.993));
  shoreGeometry.rotateX(Math.PI / 2);
  const shore = new THREE.Mesh(
    shoreGeometry,
    new THREE.MeshStandardMaterial({ color: '#8d9278', roughness: 0.92, metalness: 0.02, side: THREE.DoubleSide }),
  );
  shore.name = 'Shoreline shelf';
  shore.position.y = 1.53;
  shore.receiveShadow = true;
  shore.userData.walkable = true;
  target.add(shore);

  const topGeometry = new THREE.ShapeGeometry(islandShape(0.965));
  topGeometry.rotateX(Math.PI / 2);
  const top = new THREE.Mesh(
    topGeometry,
    new THREE.MeshStandardMaterial({ color: '#344c3f', roughness: 0.86, metalness: 0.03, side: THREE.DoubleSide }),
  );
  top.name = 'Island planted surface';
  top.position.y = PLANTED_SURFACE_Y;
  top.receiveShadow = true;
  top.userData.walkable = true;
  target.add(top);

  const exportOcean = new THREE.Mesh(
    new THREE.PlaneGeometry(1800 * MASTERPLAN_RESCALE, 1800 * MASTERPLAN_RESCALE),
    new THREE.MeshPhysicalMaterial({
      color: '#0a3442',
      roughness: 0.18,
      metalness: 0.08,
      clearcoat: 0.8,
      clearcoatRoughness: 0.16,
      transparent: true,
      opacity: 0.92,
    }),
  );
  exportOcean.name = 'Ocean surface — Blender PBR fallback';
  exportOcean.rotation.x = -Math.PI / 2;
  exportOcean.position.y = -2.62;
  exportOcean.receiveShadow = true;
  exportOcean.userData = { exportCategory: 'environment', editable: true, exportFallback: true };
  exportOcean.visible = false;
  target.add(exportOcean);

  const innerPlateau = new THREE.Mesh(
    new THREE.CylinderGeometry(
      DISTRICT_ROAD_RADII[0] - 3,
      DISTRICT_ROAD_RADII[0] - 3,
      ROAD_THICKNESS,
      128,
    ),
    new THREE.MeshPhysicalMaterial({ color: '#182829', roughness: 0.48, metalness: 0.26, clearcoat: 0.32 }),
  );
  innerPlateau.name = 'Central campus plateau';
  innerPlateau.position.y = ROAD_CENTER_Y;
  innerPlateau.receiveShadow = true;
  innerPlateau.userData = {
    walkable: true,
    arterialDatum: true,
    surfaceElevation: ROAD_SURFACE_Y,
    surfaceKind: 'central-arterial-plateau',
  };
  target.add(innerPlateau);

  const coastalBand = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(ISLAND_POINTS.map(([x, z]) => new THREE.Vector3(x * 0.984, 1.68, z * 0.984))),
    new THREE.LineBasicMaterial({ color: '#83c6b8', transparent: true, opacity: 0.38 }),
  );
  coastalBand.name = 'Perimeter light band';
  target.add(coastalBand);

  const random = hashRandom(71126);
  const rockMaterial = new THREE.MeshStandardMaterial({ color: '#263436', roughness: 0.96, flatShading: true });
  const foliageMaterials = [
    new THREE.MeshStandardMaterial({ color: '#2b5a42', roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: '#3f6848', roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: '#52734d', roughness: 0.9 }),
  ];
  const detailGroup = new THREE.Group();
  detailGroup.name = 'Coastal rocks and planting';
  detailGroup.renderOrder = 2;
  const tropicalCenter = new THREE.Vector2(...BIOME_PLAN_POSITIONS['tropical-rainforest-dome']);
  const tropicalInward = tropicalCenter.clone().multiplyScalar(-1).normalize();
  const tropicalEntryStart = tropicalCenter.clone().addScaledVector(tropicalInward, 4.2);
  const tropicalEntryEnd = tropicalCenter.clone().addScaledVector(tropicalInward, 8.4);
  const entrySegment = tropicalEntryEnd.clone().sub(tropicalEntryStart);
  const entryLengthSquared = entrySegment.lengthSq();
  const entryBridgeAlignment = getCyberCityBridgeAlignment();
  const entryArrivalClearanceStart = new THREE.Vector2(
    entryBridgeAlignment.islandRampStart.x,
    entryBridgeAlignment.islandRampStart.z,
  );
  const entryArrivalClearanceEnd = entryArrivalClearanceStart.clone().add(
    new THREE.Vector2(entryBridgeAlignment.direction.x, entryBridgeAlignment.direction.z)
      .multiplyScalar(-70),
  );
  const entryArrivalClearanceSegment = entryArrivalClearanceEnd.clone().sub(entryArrivalClearanceStart);
  const entryArrivalClearanceLengthSquared = entryArrivalClearanceSegment.lengthSq();
  const distanceToTropicalEntry = (x: number, z: number) => {
    const candidate = new THREE.Vector2(x, z);
    const t = THREE.MathUtils.clamp(
      candidate.clone().sub(tropicalEntryStart).dot(entrySegment) / entryLengthSquared,
      0,
      1,
    );
    return candidate.distanceTo(tropicalEntryStart.clone().addScaledVector(entrySegment, t));
  };
  const distanceToEntryArrival = (x: number, z: number) => {
    const candidate = new THREE.Vector2(x, z);
    const t = THREE.MathUtils.clamp(
      candidate.clone().sub(entryArrivalClearanceStart).dot(entryArrivalClearanceSegment)
        / entryArrivalClearanceLengthSquared,
      0,
      1,
    );
    return candidate.distanceTo(
      entryArrivalClearanceStart.clone().addScaledVector(entryArrivalClearanceSegment, t),
    );
  };
  for (let index = 0; index < 120; index += 1) {
    const edgeIndex = Math.floor(random() * ISLAND_POINTS.length);
    const edgeStart = ISLAND_POINTS[edgeIndex];
    const edgeEnd = ISLAND_POINTS[(edgeIndex + 1) % ISLAND_POINTS.length];
    const edgeT = 0.08 + random() * 0.84;
    const inset = 0.84 + random() * 0.08;
    const x = THREE.MathUtils.lerp(edgeStart[0], edgeEnd[0], edgeT) * inset;
    const z = THREE.MathUtils.lerp(edgeStart[1], edgeEnd[1], edgeT) * inset;
    // Keep the Tropical airlock and short human-scale approach free of the
    // deterministic coastal rocks that previously pierced its long ramp.
    if (distanceToTropicalEntry(x, z) < 1.5) continue;
    // The Entry bridge, E1 road tunnel, and the boulevard leading to the
    // Welcome fork must remain an unobstructed civic threshold. Coastal
    // scatter used to place an unnamed low-poly tree inside the tunnel shell.
    if (distanceToEntryArrival(x, z) < 9.5) continue;
    if (index % 3 === 0) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28 + random() * 0.45, 0), rockMaterial);
      rock.position.set(x, 1.8, z);
      rock.scale.y = 0.45 + random() * 0.6;
      rock.rotation.set(random(), random() * Math.PI, random());
      rock.castShadow = true;
      detailGroup.add(rock);
    } else {
      const trunkHeight = 0.62 + random() * 0.25;
      const crownRadius = 0.3 + random() * 0.22;
      // The east coastal edge is the Academic District's railway-side rear
      // strip. Preserve the seeded sequence while omitting its unrelated
      // shell vegetation so the framed precinct is genuinely tree-free.
      if (edgeIndex === 1) continue;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.055, trunkHeight, 6),
        new THREE.MeshStandardMaterial({ color: '#3f3225', roughness: 0.95 }),
      );
      const crown = new THREE.Mesh(
        new THREE.IcosahedronGeometry(crownRadius, 1),
        foliageMaterials[index % foliageMaterials.length],
      );
      trunk.position.set(x, 2.1, z);
      crown.position.set(x, 2.65, z);
      crown.scale.y = 1.35;
      trunk.name = `COASTAL__LANDSCAPE_TREE_TRUNK_${index + 1}`;
      crown.name = `COASTAL__LANDSCAPE_TREE_CANOPY_${index + 1}`;
      trunk.castShadow = crown.castShadow = true;
      detailGroup.add(trunk, crown);
    }
  }
  target.add(detailGroup);

  const seawallMaterial = new THREE.MeshStandardMaterial({ color: '#334449', roughness: 0.62, metalness: 0.45 });
  for (let index = 0; index < ISLAND_POINTS.length; index += 1) {
    const startPoint = ISLAND_POINTS[index];
    const endPoint = ISLAND_POINTS[(index + 1) % ISLAND_POINTS.length];
    const start = new THREE.Vector3(startPoint[0] * 0.99, 1.15, startPoint[1] * 0.99);
    const end = new THREE.Vector3(endPoint[0] * 0.99, 1.15, endPoint[1] * 0.99);
    const rail = beamBetween(start, end, 0.06, seawallMaterial, 8);
    rail.name = `Seawall rail ${index + 1}`;
    target.add(rail);
  }
}

export function createTransitNetwork(target: THREE.Group, biomes: readonly BiomeDefinition[]) {
  const biomeMap = new Map(biomes.map((biome) => [biome.id, biome]));
  const axes: ReadonlyArray<[string, string]> = [
    ['alpine-dome', 'savanna-dome'],
    ['tropical-rainforest-dome', 'desert-dome'],
    ['temperate-deciduous-forest-dome', 'tundra-dome'],
  ];
  const radialAxes = axes.map(([startId, endId], index) => {
    const startBiome = biomeMap.get(startId)!;
    const endBiome = biomeMap.get(endId)!;
    return {
      roadId: `arterial-radial-axis-${index + 1}`,
      startId,
      endId,
      start: new THREE.Vector3(startBiome.position[0], ROAD_CENTER_Y, startBiome.position[2]),
      end: new THREE.Vector3(endBiome.position[0], ROAD_CENTER_Y, endBiome.position[2]),
    };
  });
  const fullTurn = Math.PI * 2;
  const spokeIntersectionAngles = radialAxes
    .flatMap(({ start, end }) => [Math.atan2(start.z, start.x), Math.atan2(end.z, end.x)])
    .map((angle) => ((angle % fullTurn) + fullTurn) % fullTurn)
    .sort((left, right) => left - right);
  const ringRoadIds = DISTRICT_ROAD_RADII.map((_, index) => `arterial-ring-${index + 1}`);
  const radialRoadIds = radialAxes.map(({ roadId }) => roadId);
  target.name = 'INFRASTRUCTURE__TRANSIT_NETWORK';
  target.userData.masterplan = {
    islandRadius: ISLAND_RADIUS,
    districtRoadRadii: [...DISTRICT_ROAD_RADII],
    biomeRingRadius: Math.hypot(...BIOME_PLAN_POSITIONS['alpine-dome']),
    districtDelimiterModel: 'shared-ring-roads-and-six-spokes',
    districtRingRoadCount: DISTRICT_ROAD_RADII.length,
    radialRoadRayCount: 6,
    arterialRoadCount: ringRoadIds.length + radialRoadIds.length,
    arterialRoadIds: [...ringRoadIds, ...radialRoadIds],
    arterialSurfaceY: ROAD_SURFACE_Y,
    radialRoadWidth: RADIAL_ARTERIAL_WIDTH,
    ringCurbJunctionOpeningWidth: RING_CURB_JUNCTION_OPENING_WIDTH,
    spokeIntersectionAngles: [...spokeIntersectionAngles],
    centralRoadGapRadius: CENTRAL_TRANSIT_GAP_RADIUS,
    centralBlackRingRoadsRemoved: true,
  };
  const roadMaterial = new THREE.MeshPhysicalMaterial({
    color: '#142429',
    emissive: '#09181b',
    emissiveIntensity: 0.35,
    roughness: 0.76,
    metalness: 0.15,
    clearcoat: 0.12,
    side: THREE.DoubleSide,
    // Roads are thin ground-level world geometry and participate normally in
    // the Walk depth buffer. Explore treats them as a terrain decal layer;
    // buildings and biome objects are explicitly drawn after that layer.
    depthTest: false,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const laneMaterial = new THREE.MeshStandardMaterial({
    color: '#58ddd1',
    emissive: '#58ddd1',
    emissiveIntensity: 2.7,
    roughness: 0.2,
    metalness: 0.35,
    depthTest: false,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const curbMaterial = new THREE.MeshStandardMaterial({
    color: '#d0ddd8',
    emissive: '#264b49',
    emissiveIntensity: 0.45,
    roughness: 0.58,
    metalness: 0.28,
    depthTest: false,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  roadMaterial.userData.groundRoadDepthMode = true;
  laneMaterial.userData.groundRoadDepthMode = true;
  curbMaterial.userData.groundRoadDepthMode = true;
  DISTRICT_ROAD_RADII.forEach((radius, index) => {
    const width = index === DISTRICT_ROAD_RADII.length - 1 ? 1.85 : 1.55;
    const roadId = ringRoadIds[index];
    const centerlineSampleCount = 64;
    const centerline = Array.from({ length: centerlineSampleCount + 1 }, (_, sampleIndex) => {
      const angle = sampleIndex / centerlineSampleCount * fullTurn;
      return [Math.cos(angle) * radius, ROAD_SURFACE_Y, Math.sin(angle) * radius];
    });
    const ringGeometry = new THREE.RingGeometry(radius - width * 0.5, radius + width * 0.5, 256);
    ringGeometry.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(ringGeometry, roadMaterial);
    road.name = `District boundary ring road ${index + 1}`;
    road.position.y = ROAD_SURFACE_Y;
    road.renderOrder = 1;
    road.receiveShadow = true;
    road.userData = {
      walkable: true,
      districtDelimiter: true,
      roadType: 'ring',
      transitRoad: true,
      roadId,
      roadClass: 'arterial-ring',
      roadWidth: width,
      width,
      ringRadius: radius,
      centerlineType: 'ring',
      centerlineRadius: radius,
      centerlineY: ROAD_SURFACE_Y,
      centerline,
      junctionCount: spokeIntersectionAngles.length,
      junctionAngles: [...spokeIntersectionAngles],
    };
    target.add(road);
    const guideRadius = 0.045;
    const guideVerticalScale = 0.08;
    const guide = new THREE.Mesh(new THREE.TorusGeometry(radius, guideRadius, 8, 256), laneMaterial);
    guide.name = `Autonomous transit guide ${index + 1}`;
    guide.rotation.x = Math.PI / 2;
    guide.scale.z = guideVerticalScale;
    guide.position.y = ROAD_SURFACE_Y + guideRadius * guideVerticalScale;
    guide.renderOrder = 1;
    guide.userData = { transitGuide: true, roadId: `${roadId}-guide`, parentRoadId: roadId };
    target.add(guide);
    for (const curbOffset of [-width * 0.5, width * 0.5]) {
      const curbRadius = radius + curbOffset;
      const curbRadiusProfile = 0.04;
      const curbVerticalScale = 0.15;
      const curb = new THREE.Mesh(
        segmentedRingCurbGeometry(
          curbRadius,
          curbRadiusProfile,
          spokeIntersectionAngles,
          RING_CURB_JUNCTION_OPENING_WIDTH,
        ),
        curbMaterial,
      );
      curb.name = `Ring road ${index + 1} curb ${curbOffset < 0 ? 'inner' : 'outer'}`;
      curb.rotation.x = Math.PI / 2;
      curb.scale.z = curbVerticalScale;
      curb.position.y = ROAD_SURFACE_Y + curbRadiusProfile * curbVerticalScale;
      curb.renderOrder = 1;
      curb.userData = {
        transitCurb: true,
        parentRoadId: roadId,
        curbSide: curbOffset < 0 ? 'inner' : 'outer',
        curbRadius,
        curbProfileRadius: curbRadiusProfile,
        junctionOpeningCount: spokeIntersectionAngles.length,
        junctionOpeningAngles: [...spokeIntersectionAngles],
        junctionOpeningWidth: RING_CURB_JUNCTION_OPENING_WIDTH,
      };
      target.add(curb);
    }
    const pod = new THREE.Mesh(
      new RoundedBoxGeometry(0.6, 0.22, 0.28, 2, 0.08),
      new THREE.MeshStandardMaterial({ color: '#d9efe9', emissive: '#58ddd1', emissiveIntensity: 0.55, metalness: 0.5, roughness: 0.26 }),
    );
    pod.name = `Transit pod ${index + 1}`;
    pod.userData = { animate: 'ring-pod', ringX: radius, ringZ: radius, speed: 0.05 + index * 0.009, phase: index * 1.2 };
    pod.castShadow = true;
    target.add(pod);
  });

  // A continuous double-track railway replaces the former coastal express
  // road along all six island sides.
  const railPath = ISLAND_POINTS.map(([x, z]) => new THREE.Vector3(x * COASTAL_RAIL_INSET, ROAD_SURFACE_Y, z * COASTAL_RAIL_INSET));
  const railSegmentLengths = railPath.map((point, index) => point.distanceTo(railPath[(index + 1) % railPath.length]));
  const totalRailLength = railSegmentLengths.reduce((sum, value) => sum + value, 0);
  const ballastMaterial = new THREE.MeshStandardMaterial({
    color: '#343737',
    roughness: 0.96,
    metalness: 0.06,
    depthTest: true,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const sleeperMaterial = new THREE.MeshStandardMaterial({ color: '#493a2d', roughness: 0.9, metalness: 0.08 });
  const railMaterial = new THREE.MeshStandardMaterial({ color: '#a6afb0', roughness: 0.26, metalness: 0.94 });
  const signalMaterial = new THREE.MeshStandardMaterial({ color: '#ff5d48', emissive: '#ff2d1f', emissiveIntensity: 3.2, roughness: 0.22 });
  ballastMaterial.userData.physicalRailSurface = true;
  railPath.forEach((pathPoint, index) => {
    const nextPoint = railPath[(index + 1) % railPath.length];
    const start = new THREE.Vector3(pathPoint.x, ROAD_CENTER_Y, pathPoint.z);
    const end = new THREE.Vector3(nextPoint.x, ROAD_CENTER_Y, nextPoint.z);
    const direction = nextPoint.clone().sub(pathPoint);
    direction.y = 0;
    const segmentLength = direction.length();
    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    const railBed = roadSegment(start, end, 1.18, ballastMaterial, ROAD_THICKNESS);
    railBed.name = `Hexagonal coastal rail bed ${index + 1}`;
    railBed.userData = {
      walkable: true,
      districtDelimiter: true,
      roadType: 'perimeter-rail',
      physicalDepth: true,
    };
    target.add(railBed);

    const sleeperSpacing = 0.72;
    const sleepersPerTrack = Math.max(2, Math.floor(segmentLength / sleeperSpacing));
    const sleeperGeometry = new THREE.BoxGeometry(metresToWorldUnits(2.55), COASTAL_RAIL_SLEEPER_HEIGHT, metresToWorldUnits(0.26));
    const sleepers = new THREE.InstancedMesh(sleeperGeometry, sleeperMaterial, sleepersPerTrack * 2);
    sleepers.name = `Coastal railway sleepers ${index + 1}`;
    sleepers.castShadow = true;
    sleepers.receiveShadow = true;
    const sleeperQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.atan2(direction.x, direction.z), 0));
    let sleeperInstance = 0;
    for (const trackOffset of [-0.21, 0.21]) {
      for (let sleeperIndex = 0; sleeperIndex < sleepersPerTrack; sleeperIndex += 1) {
        const t = (sleeperIndex + 0.5) / sleepersPerTrack;
        const position = pathPoint.clone().lerp(nextPoint, t).addScaledVector(perpendicular, trackOffset);
        position.y = ROAD_SURFACE_Y + metresToWorldUnits(0.06);
        const matrix = new THREE.Matrix4().compose(position, sleeperQuaternion, new THREE.Vector3(1, 1, 1));
        sleepers.setMatrixAt(sleeperInstance, matrix);
        sleeperInstance += 1;
      }
    }
    sleepers.instanceMatrix.needsUpdate = true;
    target.add(sleepers);

    for (const trackOffset of [-0.21, 0.21]) {
      for (const gaugeOffset of [-COASTAL_RAIL_HALF_GAUGE, COASTAL_RAIL_HALF_GAUGE]) {
        const offset = trackOffset + gaugeOffset;
        const railStart = pathPoint.clone().addScaledVector(perpendicular, offset);
        const railEnd = nextPoint.clone().addScaledVector(perpendicular, offset);
        railStart.y = railEnd.y = COASTAL_RAIL_CENTER_Y;
        const rail = roadSegment(railStart, railEnd, metresToWorldUnits(0.09), railMaterial, COASTAL_RAIL_HEIGHT);
        rail.name = `Coastal steel rail ${index + 1}`;
        rail.castShadow = true;
        target.add(rail);
      }
    }

    const signalPost = beamBetween(
      pathPoint.clone().lerp(nextPoint, 0.18).addScaledVector(perpendicular, 0.68).setY(ROAD_SURFACE_Y),
      pathPoint.clone().lerp(nextPoint, 0.18).addScaledVector(perpendicular, 0.68).setY(ROAD_SURFACE_Y + metresToWorldUnits(4.2)),
      metresToWorldUnits(0.07),
      railMaterial,
      8,
    );
    signalPost.name = `Coastal railway signal post ${index + 1}`;
    const signal = new THREE.Mesh(new THREE.SphereGeometry(metresToWorldUnits(0.18), 10, 8), signalMaterial);
    signal.name = `Coastal railway signal light ${index + 1}`;
    signal.position.copy(signalPost.position).setY(ROAD_SURFACE_Y + metresToWorldUnits(4.05));
    target.add(signalPost, signal);
  });
  for (let trainIndex = 0; trainIndex < 3; trainIndex += 1) {
    target.add(createCoastalTrain(trainIndex, railPath, totalRailLength));
  }
  target.userData.coastalRail = {
    trackCount: 2,
    sectionCount: railPath.length,
    trainCount: 3,
    totalLengthMetres: Math.round(totalRailLength * 10),
    railHeadY: COASTAL_RAIL_HEAD_Y,
    trainOriginY: COASTAL_TRAIN_ORIGIN_Y,
    wheelContactY: COASTAL_RAIL_HEAD_Y,
    trackGaugeMetres: 1.435,
    physicalDepth: true,
  };

  radialAxes.forEach(({ roadId, startId, endId, start, end }, index) => {
    const centerlineStart = [start.x, ROAD_SURFACE_Y, start.z];
    const centerlineEnd = [end.x, ROAD_SURFACE_Y, end.z];
    const startGap = start.clone().setY(0).normalize().multiplyScalar(CENTRAL_TRANSIT_GAP_RADIUS).setY(ROAD_SURFACE_Y);
    const endGap = end.clone().setY(0).normalize().multiplyScalar(CENTRAL_TRANSIT_GAP_RADIUS).setY(ROAD_SURFACE_Y);
    const road = roadAxisWithCentralGap(
      start,
      end,
      CENTRAL_TRANSIT_GAP_RADIUS,
      RADIAL_ARTERIAL_WIDTH,
      roadMaterial,
      ROAD_THICKNESS,
    );
    road.name = `Radial district boundary road ${index + 1}`;
    road.renderOrder = 1;
    road.userData = {
      walkable: true,
      districtDelimiter: true,
      roadType: 'radial',
      transitRoad: true,
      roadId,
      roadClass: 'arterial-radial-axis',
      roadWidth: RADIAL_ARTERIAL_WIDTH,
      width: RADIAL_ARTERIAL_WIDTH,
      axisIndex: index + 1,
      axisBiomeIds: [startId, endId],
      centerlineType: 'segment',
      centerlineStart,
      centerlineEnd,
      centerlineY: ROAD_SURFACE_Y,
      centerline: [centerlineStart, startGap.toArray(), endGap.toArray(), centerlineEnd],
      centerlineSegments: [
        [centerlineStart, startGap.toArray()],
        [endGap.toArray(), centerlineEnd],
      ],
      centralGapRadius: CENTRAL_TRANSIT_GAP_RADIUS,
      centralBlackRingClearance: true,
      ringIntersectionRadii: [...DISTRICT_ROAD_RADII],
    };
    target.add(road);
    const guide = roadAxisWithCentralGap(
      new THREE.Vector3(start.x, ROAD_MARKING_CENTER_Y, start.z),
      new THREE.Vector3(end.x, ROAD_MARKING_CENTER_Y, end.z),
      CENTRAL_TRANSIT_GAP_RADIUS,
      0.08,
      laneMaterial,
      ROAD_MARKING_THICKNESS,
    );
    guide.name = `Biome axis light ${index + 1}`;
    guide.renderOrder = 1;
    guide.userData = { transitGuide: true, roadId: `${roadId}-guide`, parentRoadId: roadId };
    target.add(guide);
  });

  const plazaMaterial = new THREE.MeshPhysicalMaterial({
    color: '#162125',
    roughness: 0.28,
    metalness: 0.52,
    clearcoat: 0.72,
    clearcoatRoughness: 0.18,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(CENTRAL_PLAZA_RADIUS, 128), plazaMaterial);
  plaza.name = 'Corporate Core futuristic plaza';
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = ROAD_SURFACE_Y;
  plaza.receiveShadow = true;
  plaza.userData = {
    walkable: true,
    arterialDatum: true,
    surfaceElevation: ROAD_SURFACE_Y,
    connectedArterialRoadIds: [...radialRoadIds],
  };
  target.add(plaza);

  const plazaElevationDelta = ROAD_SURFACE_Y - LEGACY_CENTRAL_PLAZA_Y;

  for (const [radius, color] of [[18, '#35d8ff'], [28, '#ff4ecb'], [37, '#62f5ff']] as const) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.095, 8, 160),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3.2, roughness: 0.18, metalness: 0.3 }),
    );
    ring.name = `Corporate plaza luminous orbit ${radius}`;
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.92 + plazaElevationDelta;
    target.add(ring);
  }
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const radius = index % 2 ? 33 : 23;
    const beacon = new THREE.Mesh(
      new RoundedBoxGeometry(0.22, 1.4, 0.22, 2, 0.05),
      new THREE.MeshStandardMaterial({
        color: '#26383d', emissive: index % 3 === 0 ? '#ff4ecb' : '#35d8ff', emissiveIntensity: 2.1,
        roughness: 0.26, metalness: 0.74,
      }),
    );
    beacon.name = `Corporate plaza data beacon ${index + 1}`;
    beacon.position.set(Math.cos(angle) * radius, 2.55 + plazaElevationDelta, Math.sin(angle) * radius);
    target.add(beacon);
  }
  // Restore the original six luminous plaza platforms as public-realm objects.
  // They are not buildings, facilities, or roads and remain independent of the
  // retired core-campus placeholders.
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2 + Math.PI / 6;
    const platform = new THREE.Group();
    platform.name = `Corporate plaza light platform ${index + 1}`;
    platform.userData.centralLightPlatform = true;
    platform.userData.publicRealmObject = true;
    platform.userData.exteriorProgram = false;
    platform.userData.navObstacle = false;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.7, 0.24, 32), plazaMaterial);
    base.name = `${platform.name} base`;
    base.position.y = 1.98;
    base.userData.walkable = true;
    base.userData.navObstacle = false;
    const canopy = new THREE.Mesh(
      new THREE.CylinderGeometry(2.7, 2.35, 0.22, 32),
      new THREE.MeshPhysicalMaterial({ color: '#394950', roughness: 0.24, metalness: 0.72, clearcoat: 0.55 }),
    );
    canopy.name = `${platform.name} canopy`;
    canopy.position.y = 4.75;
    canopy.userData.navObstacle = false;
    platform.add(base, canopy);
    for (let column = 0; column < 3; column += 1) {
      const columnAngle = (column / 3) * Math.PI * 2;
      const support = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.65, 8), plazaMaterial);
      support.name = `${platform.name} support ${column + 1}`;
      support.position.set(Math.cos(columnAngle) * 2.05, 3.38, Math.sin(columnAngle) * 2.05);
      support.userData.navObstacle = false;
      platform.add(support);
    }
    const hologramColor = index % 2 ? '#ff4ecb' : '#35d8ff';
    const hologram = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 1.25, 2.2, 24, 1, true),
      new THREE.MeshStandardMaterial({
        color: hologramColor, emissive: hologramColor, emissiveIntensity: 2.6,
        transparent: true, opacity: 0.28, roughness: 0.12, metalness: 0.18, side: THREE.DoubleSide,
      }),
    );
    hologram.name = `${platform.name} holographic light`;
    hologram.position.y = 3.25;
    hologram.userData.navObstacle = false;
    platform.add(hologram);
    platform.position.set(Math.cos(angle) * 31, plazaElevationDelta, Math.sin(angle) * 31);
    platform.rotation.y = -angle;
    target.add(platform);
  }
}

type DistrictRoadRouteMetadata = {
  width?: number;
  roadClass?: string;
  endpointKinds?: readonly string[];
  centerline?: readonly (readonly number[])[];
};

type DistrictRoadNetworkMetadata = {
  existingNetworkException?: boolean;
  routes?: readonly DistrictRoadRouteMetadata[];
};

/**
 * Open the ornamental ring curbs at every live district-street mouth. This is
 * called after district generation but before global batching, so curb
 * geometry and the connector graph use exactly the same junction angles.
 */
export function configureDistrictRingJunctions(
  transitNetwork: THREE.Group,
  districtGroups: Iterable<THREE.Group>,
) {
  const spokeAngles = Array.isArray(transitNetwork.userData.masterplan?.spokeIntersectionAngles)
    ? transitNetwork.userData.masterplan.spokeIntersectionAngles as number[]
    : [];
  const rings = transitNetwork.children
    .filter((object): object is THREE.Mesh => (
      object instanceof THREE.Mesh
      && object.userData.roadType === 'ring'
      && Number.isFinite(object.userData.ringRadius)
    ))
    .map((road) => ({
      roadId: String(road.userData.roadId),
      radius: Number(road.userData.ringRadius),
      width: Number(road.userData.width),
      angles: [...spokeAngles],
      openingWidth: RING_CURB_JUNCTION_OPENING_WIDTH,
    }));
  const point = new THREE.Vector3();
  for (const district of districtGroups) {
    const network = district.userData.districtRoadNetwork as DistrictRoadNetworkMetadata | undefined;
    if (!network?.routes?.length) continue;
    district.updateWorldMatrix(true, false);
    for (const route of network.routes) {
      if (!Array.isArray(route.centerline) || route.centerline.length < 2) continue;
      const routeWidth = Number(route.width);
      for (const [endpointIndex, raw] of [route.centerline[0], route.centerline.at(-1)].entries()) {
        if (!raw || raw.length < 3) continue;
        point.set(Number(raw[0]), Number(raw[1]), Number(raw[2])).applyMatrix4(district.matrixWorld);
        const radius = Math.hypot(point.x, point.z);
        rings.forEach((ring) => {
          const overlapTolerance = ring.width * 0.5
              + (Number.isFinite(routeWidth) ? routeWidth * 0.5 : 0)
              + 0.04;
          if (Math.abs(radius - ring.radius) > overlapTolerance) return;
          const endpointKind = String(route.endpointKinds?.[endpointIndex] ?? '').toLowerCase();
          const roadClass = String(route.roadClass ?? '').toLowerCase();
          if (!roadClass.includes('connector')
            && !roadClass.includes('transition')
            && !endpointKind.includes('ring')
            && !endpointKind.includes('boundary')
            && network.existingNetworkException !== true) return;
          ring.angles.push(Math.atan2(point.z, point.x));
          if (Number.isFinite(routeWidth)) {
            ring.openingWidth = Math.max(
              ring.openingWidth,
              routeWidth + RING_CURB_JUNCTION_CLEARANCE * 2,
            );
          }
        });
      }
    }
  }

  rings.forEach((ring) => {
    const fullTurn = Math.PI * 2;
    const normalized = ring.angles
      .map((angle) => ((angle % fullTurn) + fullTurn) % fullTurn)
      .sort((left, right) => left - right)
      .filter((angle, index, values) => (
        index === 0 || Math.abs(angle - values[index - 1]) * ring.radius > 0.08
      ));
    transitNetwork.traverse((object) => {
      if (!(object instanceof THREE.Mesh)
        || object.userData.transitCurb !== true
        || object.userData.parentRoadId !== ring.roadId) return;
      const replacement = segmentedRingCurbGeometry(
        Number(object.userData.curbRadius),
        Number(object.userData.curbProfileRadius ?? 0.04),
        normalized,
        ring.openingWidth,
      );
      object.geometry.dispose();
      object.geometry = replacement;
      object.userData.junctionOpeningCount = normalized.length;
      object.userData.junctionOpeningAngles = [...normalized];
      object.userData.junctionOpeningWidth = ring.openingWidth;
      object.userData.districtJunctionOpenings = true;
    });
  });
  transitNetwork.userData.masterplan.districtJunctionCurbOpeningCount = rings.reduce(
    (sum, ring) => sum + Math.max(0, ring.angles.length - spokeAngles.length),
    0,
  );
}

function createCargoShip(name: string, color: string, length: number) {
  const ship = new THREE.Group();
  ship.name = name;
  const hullMaterial = new THREE.MeshPhysicalMaterial({ color: '#111a20', roughness: 0.34, metalness: 0.66, clearcoat: 0.3 });
  const deckMaterial = new THREE.MeshStandardMaterial({ color: '#68767a', roughness: 0.48, metalness: 0.62 });
  const neonMaterial = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3.4, roughness: 0.18 });
  const hull = new THREE.Mesh(new RoundedBoxGeometry(4.2, 1.4, length, 3, 0.5), hullMaterial);
  hull.position.y = 0.25;
  hull.scale.set(1, 1, 1);
  ship.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(2.05, 5.2, 4), hullMaterial);
  bow.rotation.x = -Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.position.set(0, 0.25, -length * 0.5 - 2.2);
  ship.add(bow);
  const bridge = new THREE.Mesh(new RoundedBoxGeometry(3.2, 2.2, 3.4, 2, 0.22), deckMaterial);
  bridge.position.set(0, 1.75, length * 0.33);
  ship.add(bridge);
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const container = new THREE.Mesh(
        new RoundedBoxGeometry(1.05, 0.72, 2.4, 1, 0.05),
        new THREE.MeshStandardMaterial({
          color: (row + column) % 3 === 0 ? color : (row + column) % 2 ? '#9b493b' : '#45616a',
          roughness: 0.58,
          metalness: 0.42,
        }),
      );
      container.position.set((column - 1) * 1.15, 1.22 + row * 0.76, -length * 0.12 + (row % 2) * 2.6);
      ship.add(container);
    }
  }
  const runningLight = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.08, 0.1), neonMaterial);
  runningLight.position.set(0, 1.1, length * 0.45);
  ship.add(runningLight);
  ship.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return ship;
}

export function createIndustrialPort(target: THREE.Group) {
  const port = new THREE.Group();
  port.name = 'INFRASTRUCTURE__ALPINE_LOGISTICS_PORT';
  const deckMaterial = new THREE.MeshPhysicalMaterial({ color: '#253238', roughness: 0.42, metalness: 0.68, clearcoat: 0.24 });
  const steelMaterial = new THREE.MeshStandardMaterial({ color: '#56666b', roughness: 0.36, metalness: 0.78 });
  const orange = new THREE.MeshStandardMaterial({ color: '#ffaa55', emissive: '#ff7b35', emissiveIntensity: 2.6, roughness: 0.22 });
  const iceBlue = new THREE.MeshStandardMaterial({ color: '#bdebff', emissive: '#5edcff', emissiveIntensity: 2.8, roughness: 0.18 });

  const quayCenter = new THREE.Vector3(34 * MASTERPLAN_RESCALE, -0.35, -ISLAND_RADIUS * 0.97);
  const quay = new THREE.Mesh(new RoundedBoxGeometry(34, 1.5, 12, 3, 0.45), deckMaterial);
  quay.name = 'Cold-chain cargo quay';
  quay.position.copy(quayCenter);
  quay.userData.walkable = true;
  port.add(quay);
  for (const x of [-13, -4, 5, 14]) {
    const pier = new THREE.Mesh(new RoundedBoxGeometry(3.2, 0.8, 34, 2, 0.2), deckMaterial);
    pier.name = 'Industrial ship pier';
    pier.position.set(quayCenter.x + x, -1.0, quayCenter.z - 18);
    pier.userData.walkable = true;
    port.add(pier);
  }
  const accessStart = new THREE.Vector3(24 * MASTERPLAN_RESCALE, 1.83, -ISLAND_RADIUS * 0.86);
  const accessEnd = new THREE.Vector3(34 * MASTERPLAN_RESCALE, 0.25, quayCenter.z + 5);
  const accessRoad = roadSegment(accessStart, accessEnd, 4.6, deckMaterial, 0.35);
  accessRoad.name = 'Logistics district port access ramp';
  accessRoad.userData.walkable = true;
  port.add(accessRoad);
  for (const x of [-10, 0, 10]) {
    const crane = new THREE.Group();
    crane.name = `Autonomous gantry crane ${x / 10 + 2}`;
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.55, 9, 0.55), steelMaterial);
      leg.position.set(side * 3.2, 4.1, 0);
      crane.add(leg);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.55, 0.65), steelMaterial);
    beam.position.y = 8.45;
    const trolley = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.5, 0.8, 2, 0.1), orange);
    trolley.position.set(0.9, 7.95, 0);
    crane.add(beam, trolley);
    crane.position.set(quayCenter.x + x, -0.2, quayCenter.z - 4.5);
    port.add(crane);
  }
  const coldStore = new THREE.Mesh(new RoundedBoxGeometry(10, 5.8, 7.5, 3, 0.32), deckMaterial);
  coldStore.name = 'Alpine Dome cold-preservation transfer vault';
  coldStore.position.set(quayCenter.x - 20, 3, quayCenter.z + 1);
  port.add(coldStore);
  for (let level = 0; level < 4; level += 1) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(10.1, 0.08, 0.08), iceBlue);
    strip.position.set(coldStore.position.x, 1.1 + level * 1.25, coldStore.position.z + 3.78);
    port.add(strip);
  }

  const ships = [
    { x: 20 * MASTERPLAN_RESCALE, z: -ISLAND_RADIUS - 42, rotation: 0.03, length: 23, color: '#ff8b45', name: 'Cargo vessel Asterion' },
    { x: 49 * MASTERPLAN_RESCALE, z: -ISLAND_RADIUS - 46, rotation: -0.04, length: 27, color: '#42e7ff', name: 'Refrigerated vessel Borealis' },
    { x: 81 * MASTERPLAN_RESCALE, z: -ISLAND_RADIUS - 34, rotation: 0.13, length: 19, color: '#ff4ecb', name: 'Autonomous feeder vessel Nyx' },
  ];
  ships.forEach((specification) => {
    const ship = createCargoShip(specification.name, specification.color, specification.length);
    ship.position.set(specification.x, -1.95, specification.z);
    ship.rotation.y = specification.rotation;
    port.add(ship);
  });
  const portGlow = new THREE.PointLight('#5edcff', 16, 70, 2);
  portGlow.position.set(quayCenter.x, 8, quayCenter.z - 6);
  portGlow.name = 'Alpine logistics port cold-chain glow';
  port.add(portGlow);
  target.add(port);
}

function createBridgeCable(
  target: THREE.Group,
  points: THREE.Vector3[],
  material: THREE.Material,
  name: string,
) {
  const curve = new THREE.CatmullRomCurve3(points);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.045, 6, false), material);
  cable.name = name;
  target.add(cable);
}

export interface CyberCityBridgeAlignment {
  bridgeStart: THREE.Vector3;
  bridgeEnd: THREE.Vector3;
  direction: THREE.Vector3;
  islandRampStart: THREE.Vector3;
}

/**
 * One shared source of truth for the city bridge and the Entry District gate.
 * The island ramp's top surface is flush with the authored E1 tunnel road.
 */
export function getCyberCityBridgeAlignment(): CyberCityBridgeAlignment {
  const bridgeStart = new THREE.Vector3(
    (ISLAND_POINTS[0][0] + ISLAND_POINTS[1][0]) * 0.48,
    3.05,
    (ISLAND_POINTS[0][1] + ISLAND_POINTS[1][1]) * 0.48,
  );
  const coastEdge = new THREE.Vector3(
    ISLAND_POINTS[1][0] - ISLAND_POINTS[0][0],
    0,
    ISLAND_POINTS[1][1] - ISLAND_POINTS[0][1],
  );
  const direction = new THREE.Vector3(coastEdge.z, 0, -coastEdge.x).normalize();
  if (direction.dot(bridgeStart) < 0) direction.multiplyScalar(-1);
  // The red reference crosses the water perpendicular to the north-east
  // island edge and lands just inside the Cyber City seawall. Keeping this
  // as a radial shoreline normal prevents the former long diagonal crossing.
  const citySeawallLandingRadius = ISLAND_RADIUS + 348;
  const bridgeEnd = direction.clone().multiplyScalar(citySeawallLandingRadius);
  bridgeEnd.y = 5.2;
  const e1RoadTopY = ISLAND_SURFACE_Y + metresToWorldUnits(0.34);
  const islandRampStart = bridgeStart.clone().addScaledVector(direction, -9);
  islandRampStart.y = e1RoadTopY - 0.15;
  return { bridgeStart, bridgeEnd, direction, islandRampStart };
}

export function createBridgeAndCity(bridgeTarget: THREE.Group, cityTarget: THREE.Group) {
  bridgeTarget.name = 'INFRASTRUCTURE__CYBER_CITY_BRIDGE';
  cityTarget.name = 'HORIZON__CYBERPUNK_CITY';
  // Exact midpoint of the northeast hex side, between Alpine and Tundra.
  const { bridgeStart, bridgeEnd, direction, islandRampStart } = getCyberCityBridgeAlignment();
  const normal = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
  const deckMaterial = new THREE.MeshStandardMaterial({ color: '#1c282e', roughness: 0.48, metalness: 0.58 });
  const metalMaterial = new THREE.MeshStandardMaterial({ color: '#4b6068', roughness: 0.34, metalness: 0.76 });
  const cyan = new THREE.MeshStandardMaterial({ color: '#4af3ed', emissive: '#4af3ed', emissiveIntensity: 2.8, roughness: 0.2 });
  const magenta = new THREE.MeshStandardMaterial({ color: '#ff4ecb', emissive: '#ff4ecb', emissiveIntensity: 2.5, roughness: 0.2 });
  bridgeTarget.userData.bridgeStart = bridgeStart.toArray();
  bridgeTarget.userData.bridgeEnd = bridgeEnd.toArray();
  bridgeTarget.userData.islandRampStart = islandRampStart.toArray();
  bridgeTarget.userData.entryTunnelAlignment = 'shared exact centerline';
  bridgeTarget.userData.bridgePlacement = 'perpendicular E1-to-western-city-seawall crossing';
  bridgeTarget.userData.referenceAlignment = 'direct red-marked crossing';

  const leftStart = bridgeStart.clone().addScaledVector(normal, 1.2);
  const leftEnd = bridgeEnd.clone().addScaledVector(normal, 1.2);
  const rightStart = bridgeStart.clone().addScaledVector(normal, -1.2);
  const rightEnd = bridgeEnd.clone().addScaledVector(normal, -1.2);
  const leftDeck = roadSegment(leftStart, leftEnd, 2.1, deckMaterial, 0.34);
  const rightDeck = roadSegment(rightStart, rightEnd, 2.1, deckMaterial, 0.34);
  leftDeck.name = 'Bridge inbound deck';
  rightDeck.name = 'Bridge outbound deck';
  leftDeck.userData.walkable = true;
  rightDeck.userData.walkable = true;
  bridgeTarget.add(leftDeck, rightDeck);

  const islandRampBridgeEnd = bridgeStart.clone();
  islandRampBridgeEnd.y += 0.02;
  const islandRamp = smoothTaperedRoadTransition(
    islandRampStart,
    islandRampBridgeEnd,
    6.8,
    5.1,
    deckMaterial,
    0.3,
    24,
  );
  islandRamp.name = 'Bridge island approach smooth transition';
  bridgeTarget.add(islandRamp);
  bridgeTarget.userData.islandRoadTransition = {
    profile: 'smoothstep-width-and-grade',
    tunnelWidth: 6.8,
    bridgeWidth: 5.1,
    segmentCount: 24,
    tunnelTopY: islandRamp.userData.startTopY,
    bridgeTopY: islandRamp.userData.endTopY,
  };

  for (const offset of [-2.35, 0, 2.35]) {
    const laneStart = bridgeStart.clone().addScaledVector(normal, offset);
    const laneEnd = bridgeEnd.clone().addScaledVector(normal, offset);
    laneStart.y += 0.25;
    laneEnd.y += 0.25;
    const strip = roadSegment(laneStart, laneEnd, offset === 0 ? 0.08 : 0.045, offset === 0 ? magenta : cyan, 0.035);
    strip.name = 'Bridge illuminated guide';
    bridgeTarget.add(strip);
  }

  const pylonTs = [0.18, 0.4, 0.62, 0.84];
  pylonTs.forEach((t, pylonIndex) => {
    const center = bridgeStart.clone().lerp(bridgeEnd, t);
    const deckY = center.y;
    for (const side of [-1, 1]) {
      const base = center.clone().addScaledVector(normal, side * 2.55);
      const tower = new THREE.Mesh(new RoundedBoxGeometry(0.48, 11.5, 0.48, 2, 0.1), metalMaterial);
      tower.position.set(base.x, deckY + 5.55, base.z);
      tower.castShadow = true;
      tower.name = `Bridge pylon ${pylonIndex + 1}.${side > 0 ? 1 : 2}`;
      bridgeTarget.add(tower);
      const pylonLight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.8, 0.18), pylonIndex % 2 ? magenta : cyan);
      pylonLight.position.copy(tower.position).addScaledVector(normal, -side * 0.28);
      bridgeTarget.add(pylonLight);
    }
    const crossStart = center.clone().addScaledVector(normal, -2.7);
    const crossEnd = center.clone().addScaledVector(normal, 2.7);
    crossStart.y = crossEnd.y = deckY + 10.2;
    bridgeTarget.add(beamBetween(crossStart, crossEnd, 0.18, metalMaterial, 8));
  });

  for (const side of [-1, 1]) {
    const sideOffset = normal.clone().multiplyScalar(side * 2.6);
    const points = [bridgeStart, ...pylonTs.map((t) => bridgeStart.clone().lerp(bridgeEnd, t)), bridgeEnd].map((point, index, values) => {
      const result = point.clone().add(sideOffset);
      result.y += index === 0 || index === values.length - 1 ? 1.2 : 10.3;
      return result;
    });
    createBridgeCable(bridgeTarget, points, metalMaterial, `Bridge main cable ${side > 0 ? 'east' : 'west'}`);
    for (let index = 1; index < 18; index += 1) {
      const t = index / 18;
      const base = bridgeStart.clone().lerp(bridgeEnd, t).add(sideOffset);
      base.y += 0.25;
      const peakFactor = Math.abs(Math.sin(t * Math.PI * 2));
      const top = base.clone();
      top.y += 2 + peakFactor * 7.2;
      bridgeTarget.add(beamBetween(base, top, 0.018, metalMaterial, 5));
    }
  }

  const random = hashRandom(20260711);
  const cityCenter = new THREE.Vector3(
    405 * MASTERPLAN_RESCALE,
    0.12,
    -420 * MASTERPLAN_RESCALE,
  );
  const cityRotation = -0.16;
  const cityHorizonCenterAngle = Math.atan2(cityCenter.z, cityCenter.x);
  const originalCityHorizonSpan = THREE.MathUtils.degToRad(190);
  const originalCityHorizonStart = cityHorizonCenterAngle - originalCityHorizonSpan * 0.5;
  const cityHorizonEnd = cityHorizonCenterAngle + originalCityHorizonSpan * 0.5;
  // The Alpine Dome sits on the -Z radial axis. Keep the city only from that
  // axis toward the bridge/right side, leaving the entire western horizon open.
  const cityHorizonStart = -Math.PI * 0.5;
  const cityHorizonSpan = cityHorizonEnd - cityHorizonStart;
  const cityHorizonSpanDegrees = THREE.MathUtils.radToDeg(cityHorizonSpan);
  const removedCityArcDegrees = THREE.MathUtils.radToDeg(cityHorizonStart - originalCityHorizonStart);
  const cityHorizonInnerRadius = ISLAND_RADIUS + 330;
  // Extend beyond the ocean plane's farthest square corner so even elevated
  // views can never reveal a second strip of water behind the city.
  const cityHorizonOuterRadius = 2600;
  const cityGroundY = ISLAND_SURFACE_Y - 0.15;

  // The city remains a literal world boundary on the retained side, while the
  // horizon west of the Alpine Dome is intentionally open ocean and sky.
  const worldEndMainland = new THREE.Mesh(
    annularSectorGeometry(
      cityHorizonInnerRadius,
      cityHorizonOuterRadius,
      cityHorizonStart,
      cityHorizonSpan,
      256,
    ),
    new THREE.MeshBasicMaterial({ color: '#0d1419' }),
  );
  worldEndMainland.name = 'WORLD_END__CYBER_CITY_MAINLAND';
  worldEndMainland.position.y = cityGroundY;
  worldEndMainland.receiveShadow = true;
  worldEndMainland.userData = {
    worldBoundary: true,
    oceanBeyondCity: false,
    horizonSpanDegrees: Number(cityHorizonSpanDegrees.toFixed(1)),
    cutoffBiome: 'alpine-dome',
    westernCityRemoved: true,
  };
  cityTarget.add(worldEndMainland);

  const seaWallSegments = Math.round(128 * cityHorizonSpan / originalCityHorizonSpan);
  const seaWallArcWidth = (cityHorizonInnerRadius * cityHorizonSpan / seaWallSegments) * 1.04;
  const seaWallHeight = cityGroundY + 2.62;
  const seaWallGeometry = new THREE.BoxGeometry(seaWallArcWidth, seaWallHeight, 18);
  const seaWallMaterial = new THREE.MeshStandardMaterial({ color: '#172027', roughness: 0.88, metalness: 0.18 });
  const seaWall = new THREE.InstancedMesh(seaWallGeometry, seaWallMaterial, seaWallSegments);
  seaWall.name = 'WORLD_END__CYBER_CITY_SEAWALL';
  const instanceMatrix = new THREE.Matrix4();
  const instancePosition = new THREE.Vector3();
  const instanceQuaternion = new THREE.Quaternion();
  const instanceScale = new THREE.Vector3(1, 1, 1);
  const instanceEuler = new THREE.Euler();
  for (let index = 0; index < seaWallSegments; index += 1) {
    const angle = cityHorizonStart + ((index + 0.5) / seaWallSegments) * cityHorizonSpan;
    instancePosition.set(
      Math.cos(angle) * (cityHorizonInnerRadius + 9),
      cityGroundY - seaWallHeight * 0.5,
      Math.sin(angle) * (cityHorizonInnerRadius + 9),
    );
    instanceEuler.set(0, -angle - Math.PI * 0.5, 0);
    instanceQuaternion.setFromEuler(instanceEuler);
    instanceMatrix.compose(instancePosition, instanceQuaternion, instanceScale);
    seaWall.setMatrixAt(index, instanceMatrix);
  }
  seaWall.instanceMatrix.needsUpdate = true;
  cityTarget.add(seaWall);

  const cityBase = new THREE.Mesh(
    new RoundedBoxGeometry(
      168 * MASTERPLAN_RESCALE,
      3.2,
      74 * MASTERPLAN_RESCALE,
      5,
      8,
    ),
    new THREE.MeshStandardMaterial({ color: '#111a22', roughness: 0.82, metalness: 0.12 }),
  );
  cityBase.name = 'Cyberpunk mainland foundation';
  cityBase.position.copy(cityCenter);
  cityBase.rotation.y = cityRotation;
  cityBase.userData.walkable = true;
  cityTarget.add(cityBase);
  cityTarget.userData.skylineLength = Number((cityHorizonInnerRadius * cityHorizonSpan).toFixed(1));
  cityTarget.userData.skylineArcDegrees = Number(cityHorizonSpanDegrees.toFixed(1));
  cityTarget.userData.removedSkylineArcDegrees = Number(removedCityArcDegrees.toFixed(1));
  cityTarget.userData.skylineCutoffAngleDegrees = -90;
  cityTarget.userData.skylineCutoffBiome = 'alpine-dome';
  cityTarget.userData.westernCityRemoved = true;
  cityTarget.userData.worldBoundaryOuterRadius = cityHorizonOuterRadius;
  cityTarget.userData.oceanBeyondCity = false;
  cityTarget.userData.worldBoundary = true;
  cityTarget.userData.cityCenter = cityCenter.toArray();

  const cityRampOffset = new THREE.Vector3(
    -73 * MASTERPLAN_RESCALE,
    1.78,
    23 * MASTERPLAN_RESCALE,
  ).applyAxisAngle(new THREE.Vector3(0, 1, 0), cityRotation);
  const cityRampEnd = cityCenter.clone().add(cityRampOffset);
  const cityRamp = roadSegment(bridgeEnd, cityRampEnd, 5.1, deckMaterial, 0.3);
  cityRamp.name = 'Bridge cyber city approach ramp';
  cityRamp.userData.walkable = true;
  bridgeTarget.add(cityRamp);

  const cityMaterials = [
    new THREE.MeshStandardMaterial({ color: '#101820', roughness: 0.34, metalness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: '#17202c', roughness: 0.28, metalness: 0.65 }),
    new THREE.MeshStandardMaterial({ color: '#0b1118', roughness: 0.38, metalness: 0.62 }),
  ];
  const neonMaterials = [cyan, magenta, new THREE.MeshStandardMaterial({ color: '#b8f34b', emissive: '#b8f34b', emissiveIntensity: 2.3 })];
  const bridgeheadTowerCount = 96;
  const bridgeheadCountsByStyle = cityMaterials.map((_, style) => (
    Math.floor((bridgeheadTowerCount + cityMaterials.length - 1 - style) / cityMaterials.length)
  ));
  const bridgeheadTowers = cityMaterials.map((material, style) => {
    const instances = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, bridgeheadCountsByStyle[style]);
    instances.name = `CYBER_CITY__BRIDGEHEAD_FACADE_BATCH_${style + 1}`;
    instances.castShadow = false;
    instances.receiveShadow = true;
    instances.userData.instanceSemanticIds = [] as string[];
    return instances;
  });
  const bridgeheadNeon = neonMaterials.map((material, style) => {
    const instances = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, bridgeheadCountsByStyle[style]);
    instances.name = `CYBER_CITY__BRIDGEHEAD_NEON_BATCH_${style + 1}`;
    instances.castShadow = false;
    instances.receiveShadow = false;
    instances.userData.instanceSemanticIds = [] as string[];
    return instances;
  });
  const bridgeheadAntennaCount = Math.ceil(bridgeheadTowerCount / 9);
  const bridgeheadAntennas = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1, 1, 1, 6),
    metalMaterial,
    bridgeheadAntennaCount,
  );
  bridgeheadAntennas.name = 'CYBER_CITY__BRIDGEHEAD_ANTENNA_BATCH';
  bridgeheadAntennas.castShadow = false;
  bridgeheadAntennas.userData.instanceSemanticIds = [] as string[];
  const bridgeheadStyleIndices = [0, 0, 0];
  let antennaIndex = 0;
  for (let index = 0; index < bridgeheadTowerCount; index += 1) {
    const localX = (random() * 2 - 1) * 77 * MASTERPLAN_RESCALE;
    const localZ = (random() * 2 - 1) * 31 * MASTERPLAN_RESCALE;
    const rotatedX = localX * Math.cos(cityRotation) - localZ * Math.sin(cityRotation);
    const rotatedZ = localX * Math.sin(cityRotation) + localZ * Math.cos(cityRotation);
    const x = cityCenter.x + rotatedX;
    const z = cityCenter.z + rotatedZ;
    const centerBias = 1 - Math.min(1, Math.abs(localX) / (77 * MASTERPLAN_RESCALE));
    const width = 1.1 + random() * 2.8;
    const depth = 1.1 + random() * 2.6;
    const height = 6 + Math.pow(random(), 1.55) * 54 + centerBias * 12;
    const style = index % cityMaterials.length;
    const slot = bridgeheadStyleIndices[style]++;
    const rotationY = random() * Math.PI;
    instancePosition.set(x, cityCenter.y + 1.6 + height * 0.5, z);
    instanceEuler.set(0, rotationY, 0);
    instanceQuaternion.setFromEuler(instanceEuler);
    instanceScale.set(width, height, depth);
    instanceMatrix.compose(instancePosition, instanceQuaternion, instanceScale);
    bridgeheadTowers[style].setMatrixAt(slot, instanceMatrix);
    (bridgeheadTowers[style].userData.instanceSemanticIds as string[])[slot] = `cyber-city:tower:${index + 1}`;

    instancePosition.y = cityCenter.y + 1.6 + height * (0.22 + random() * 0.62);
    instanceScale.set(width * (0.45 + random() * 0.35), Math.max(0.08, height * 0.018), depth * 1.012);
    instanceMatrix.compose(instancePosition, instanceQuaternion, instanceScale);
    bridgeheadNeon[style].setMatrixAt(slot, instanceMatrix);
    (bridgeheadNeon[style].userData.instanceSemanticIds as string[])[slot] = `cyber-city:neon:${index + 1}`;
    if (index % 9 === 0) {
      const antennaHeight = 4 + random() * 5;
      instancePosition.set(x, cityCenter.y + 1.6 + height + antennaHeight * 0.5, z);
      instanceScale.set(0.05, antennaHeight, 0.05);
      instanceMatrix.compose(instancePosition, instanceQuaternion, instanceScale);
      bridgeheadAntennas.setMatrixAt(antennaIndex, instanceMatrix);
      (bridgeheadAntennas.userData.instanceSemanticIds as string[])[antennaIndex] = `cyber-city:antenna:${index + 1}`;
      antennaIndex += 1;
    }
  }
  [...bridgeheadTowers, ...bridgeheadNeon, bridgeheadAntennas].forEach((instances) => {
    instances.instanceMatrix.needsUpdate = true;
    cityTarget.add(instances);
  });

  // Dense instanced silhouettes continue the bridgehead cluster from the
  // Alpine radial toward the east. Preserve the established tower density
  // while omitting the requested western 51-degree portion of the city.
  const horizonTowerCount = Math.round(420 * cityHorizonSpan / originalCityHorizonSpan);
  const horizonMaterials = cityMaterials.map((material) => material.clone());
  const horizonNeonMaterials = neonMaterials.map((material) => material.clone());
  const countsByStyle = horizonMaterials.map((_, style) => (
    Math.floor((horizonTowerCount + horizonMaterials.length - 1 - style) / horizonMaterials.length)
  ));
  const horizonTowers = horizonMaterials.map((material, style) => {
    const instances = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, countsByStyle[style]);
    instances.name = `WORLD_END__CYBER_CITY_TOWERS_${style + 1}`;
    instances.castShadow = false;
    instances.receiveShadow = true;
    instances.userData.instanceCount = countsByStyle[style];
    return instances;
  });
  const horizonNeon = horizonNeonMaterials.map((material, style) => {
    const instances = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, countsByStyle[style]);
    instances.name = `WORLD_END__CYBER_CITY_NEON_${style + 1}`;
    instances.userData.instanceCount = countsByStyle[style];
    return instances;
  });
  const styleIndices = [0, 0, 0];
  for (let index = 0; index < horizonTowerCount; index += 1) {
    const style = index % horizonMaterials.length;
    const slot = styleIndices[style]++;
    const angleFraction = (index + 0.5) / horizonTowerCount;
    const angleJitter = (random() - 0.5) * (cityHorizonSpan / horizonTowerCount) * 0.72;
    const angle = cityHorizonStart + angleFraction * cityHorizonSpan + angleJitter;
    const depthBand = index % 4;
    const radius = cityHorizonInnerRadius + 34 + depthBand * 48 + random() * 34;
    const centerBias = 1 - Math.min(1, Math.abs(angle - cityHorizonCenterAngle) / (cityHorizonSpan * 0.5));
    const width = 5 + random() * 8.5;
    const depth = 6 + random() * 11;
    const height = 20 + Math.pow(random(), 1.55) * 88 + centerBias * 18;
    instancePosition.set(
      Math.cos(angle) * radius,
      cityGroundY + height * 0.5,
      Math.sin(angle) * radius,
    );
    instanceEuler.set(0, -angle + (random() - 0.5) * 0.38, 0);
    instanceQuaternion.setFromEuler(instanceEuler);
    instanceScale.set(width, height, depth);
    instanceMatrix.compose(instancePosition, instanceQuaternion, instanceScale);
    horizonTowers[style].setMatrixAt(slot, instanceMatrix);

    instancePosition.y = cityGroundY + height * (0.3 + random() * 0.5);
    instanceScale.set(width * 1.025, Math.max(0.22, height * 0.009), depth * 1.025);
    instanceMatrix.compose(instancePosition, instanceQuaternion, instanceScale);
    horizonNeon[style].setMatrixAt(slot, instanceMatrix);
  }
  [...horizonTowers, ...horizonNeon].forEach((instances) => {
    instances.instanceMatrix.needsUpdate = true;
    cityTarget.add(instances);
  });
  cityTarget.userData.bridgeheadTowerCount = bridgeheadTowerCount;
  cityTarget.userData.horizonTowerCount = horizonTowerCount;
  cityTarget.userData.towerCount = bridgeheadTowerCount + horizonTowerCount;

  cityTarget.userData.bridgeheadDrawCalls = 7;
  cityTarget.userData.atmosphericGlow = 'emissive-instance-materials-and-global-rim-light';
}

export interface WaterSurface extends THREE.Mesh {
  material: THREE.ShaderMaterial;
}

export function createOcean(): WaterSurface {
  const geometry = new THREE.PlaneGeometry(
    1800 * MASTERPLAN_RESCALE,
    1800 * MASTERPLAN_RESCALE,
    224,
    224,
  );
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#06151f') },
      uShallow: { value: new THREE.Color('#174e5a') },
      uNight: { value: 1 },
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorld;
      varying float vWave;
      void main() {
        vec3 p = position;
        float wave = sin(p.x * 0.115 + uTime * 0.54) * 0.18;
        wave += sin(p.y * 0.17 - uTime * 0.38) * 0.11;
        wave += sin((p.x + p.y) * 0.055 + uTime * 0.26) * 0.08;
        p.z += wave;
        vec4 world = modelMatrix * vec4(p, 1.0);
        vWorld = world.xyz;
        vWave = wave;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform float uNight;
      varying vec3 vWorld;
      varying float vWave;
      void main() {
        float bands = sin(vWorld.x * 0.16 + vWorld.z * 0.11) * 0.5 + 0.5;
        float glint = smoothstep(0.82, 1.0, bands + vWave * 0.8);
        vec3 color = mix(uDeep, uShallow, 0.2 + vWave * 0.5);
        color += vec3(0.22, 0.55, 0.58) * glint * (0.06 + uNight * 0.08);
        float alpha = 0.985;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: false,
    side: THREE.DoubleSide,
  });
  const ocean = new THREE.Mesh(geometry, material) as WaterSurface;
  ocean.name = 'Animated ocean surface (presentation)';
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -2.55;
  ocean.receiveShadow = true;
  return ocean;
}

export interface SkyDome extends THREE.Mesh {
  material: THREE.ShaderMaterial;
}

export function createSkyDome(): SkyDome {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color('#071827') },
      uHorizon: { value: new THREE.Color('#9b5f6c') },
      uBottom: { value: new THREE.Color('#1a3036') },
      uDayMix: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uIsNight: { value: 0.0 },
    },
    vertexShader: `varying vec3 vPosition; void main(){ vPosition = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 uTop;
      uniform vec3 uHorizon;
      uniform vec3 uBottom;
      uniform float uDayMix;
      uniform vec3 uSunDir;
      uniform float uIsNight;
      varying vec3 vPosition;
      void main(){
        float h = normalize(vPosition).y * 0.5 + 0.5;
        vec3 dusk = h < 0.48 ? mix(uBottom, uHorizon, h / 0.48) : mix(uHorizon, uTop, (h - 0.48) / 0.52);
        vec3 day = mix(vec3(0.64, 0.78, 0.82), vec3(0.16, 0.42, 0.62), smoothstep(0.1, 0.9, h));

        vec3 dir = normalize(vPosition);
        float sunDot = max(0.0, dot(dir, uSunDir));

        // Sun disk
        float sunSize = 0.9995;
        float sunGlow = 0.96;
        float sunDisk = smoothstep(sunSize, sunSize + 0.0003, sunDot);
        float glowVal = pow(smoothstep(sunGlow, 1.0, sunDot), 6.0) * 1.6;

        vec3 sunColor = vec3(1.0, 0.95, 0.85);
        if (uDayMix < 0.5) {
          if (uIsNight > 0.5) {
            sunColor = vec3(0.68, 0.82, 1.0);
          } else {
            sunColor = mix(vec3(1.0, 0.42, 0.12), vec3(1.0, 0.8, 0.6), sunDot * sunDot);
          }
        }

        vec3 skyColor = mix(dusk, day, uDayMix);
        vec3 finalColor = skyColor + sunColor * (sunDisk * 2.5 + glowVal);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1400 * MASTERPLAN_RESCALE, 44, 24),
    material,
  ) as SkyDome;
  sky.name = 'Atmospheric sky (presentation)';
  return sky;
}
