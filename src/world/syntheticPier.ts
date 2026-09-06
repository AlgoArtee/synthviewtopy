import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ISLAND_RADIUS, ISLAND_SURFACE_Y, metresToWorldUnits } from '../config/island';
import { beachSeawallZ, createBeachPerimeter } from './syntheticBeachLayout';

export const SYNTHETIC_PIER_ID = 'synthetic-pier';
export const SYNTHETIC_PIER_ENTRY = new THREE.Vector3(0, ISLAND_SURFACE_Y, -ISLAND_RADIUS + 2);

const DECK_Y = ISLAND_SURFACE_Y;
const SHORE_Y = 0.12;
const STEM_HALF_WIDTH = 1.3;
// Match the immersive shore: a side landing feeds a flight running parallel
// to the pier, with the high end inland and the foot toward the ocean.
const STAIR_X = -3.8;
const STAIR_TOP_Z = -ISLAND_RADIUS - 7;
const LANDING_DEPTH = 0.8;
const STAIR_WIDTH = 0.78;
const STAIR_COUNT = 84;
const STAIR_TREAD = metresToWorldUnits(0.35);
const STAIR_BOTTOM_Z = STAIR_TOP_Z - STAIR_COUNT * STAIR_TREAD;

export function disposeSyntheticPier(root: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    if (object instanceof THREE.InstancedMesh) object.dispose();
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  root.clear();
  root.removeFromParent();
}

type Barrier = { start: [number, number, number]; end: [number, number, number]; radius: number };

function identify<T extends THREE.Object3D>(object: T, name: string, walkable = false): T {
  object.name = `SYNTHETIC_PIER__${name}`;
  Object.assign(object.userData, {
    selectableId: SYNTHETIC_PIER_ID,
    syntheticPier: true,
    navObstacle: false,
    walkable,
    navWalkable: walkable,
    surfaceKind: 'metal',
  });
  return object;
}

function boxGeometry(width: number, height: number, depth: number, x: number, y: number, z: number) {
  return new THREE.BoxGeometry(width, height, depth).translate(x, y, z);
}

function beamGeometry(start: THREE.Vector3, end: THREE.Vector3, width: number, height = width) {
  const direction = end.clone().sub(start);
  const geometry = new THREE.BoxGeometry(width, height, direction.length());
  const transform = new THREE.Matrix4().compose(
    start.clone().lerp(end, 0.5),
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.normalize()),
    new THREE.Vector3(1, 1, 1),
  );
  return geometry.applyMatrix4(transform);
}

function mergedMesh(parts: THREE.BufferGeometry[], material: THREE.Material, name: string) {
  const geometry = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!geometry) throw new Error(`Unable to build synthetic pier ${name}.`);
  const mesh = identify(new THREE.Mesh(geometry, material), name);
  mesh.receiveShadow = true;
  return mesh;
}

function ribbonEdges(points: THREE.Vector3[], width: number) {
  const left: THREE.Vector3[] = [];
  const right: THREE.Vector3[] = [];
  points.forEach((point, index) => {
    const tangent = points[Math.min(points.length - 1, index + 1)].clone()
      .sub(points[Math.max(0, index - 1)]).setY(0).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width * 0.5);
    left.push(point.clone().add(normal));
    right.push(point.clone().sub(normal));
  });
  return { left, right };
}

function extrudedDeck(points: THREE.Vector3[], width: number, thickness: number) {
  const edges = ribbonEdges(points, width);
  const outline = [...edges.left, ...edges.right.slice().reverse()];
  const shape = new THREE.Shape(outline.map((point) => new THREE.Vector2(point.x, point.z)));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, steps: 1 });
  // Shape XY stores plan XZ; extruding downward preserves the island datum.
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, DECK_Y, 0);
  return geometry;
}

function silverSandGeometry() {
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const segments = 192;
  const rings = 14;
  const coastZ = (x: number) => -ISLAND_RADIUS + beachSeawallZ(x);
  // The campus and immersive beach now use the same connected shallow outline.
  const perimeter = createBeachPerimeter();
  const boundary = perimeter.getSpacedPoints(segments);
  for (const point of boundary) point.y -= ISLAND_RADIUS;
  const center = new THREE.Vector2(0, -ISLAND_RADIUS - 3.5);
  for (let ring = 0; ring <= rings; ring += 1) {
    const radius = ring / rings;
    for (let point = 0; point <= segments; point += 1) {
      const shorePoint = boundary[point];
      const x = THREE.MathUtils.lerp(center.x, shorePoint.x, radius);
      const z = THREE.MathUtils.lerp(center.y, shorePoint.y, radius);
      const seawallEdge = Math.abs(shorePoint.y - coastZ(shorePoint.x)) < 0.28;
      const edgeSlope = seawallEdge ? 0 : THREE.MathUtils.smoothstep(radius, 0.93, 1);
      const ripple = Math.sin(x * 1.4 + z * 0.36) * Math.sin(z * 0.47 - x * 0.15);
      const centerRelief = 0.007 * ripple * (1 - THREE.MathUtils.smoothstep(radius, 0.7, 0.94));
      positions.push(x, SHORE_Y + centerRelief - edgeSlope * 0.17, z);
      uvs.push((x + 30) / 60, (z + ISLAND_RADIUS + 24) / 42);
      const duneTone = 0.79 + ripple * 0.095;
      const wetTone = 1 - edgeSlope * 0.34;
      colors.push(duneTone * wetTone * 0.91, duneTone * wetTone * 0.97, duneTone * wetTone);
      if (ring < rings && point < segments) {
        const a = ring * (segments + 1) + point;
        const b = a + segments + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** The campus-scale gateway. The immersive shore is loaded by IslandWorld. */
export function createSyntheticPier(): THREE.Group {
  const root = identify(new THREE.Group(), 'ANCHOR_GATEWAY');
  // Let each walkable surface retain its own metal/sand footstep material.
  delete root.userData.surfaceKind;
  Object.assign(root.userData, {
    scenePortal: 'synthetic-shore',
    title: 'Synthetic Shore',
    description: 'Anchor pier · silver beach · Cygnus X-1',
    entryPosition: SYNTHETIC_PIER_ENTRY.toArray(),
    approachBounds: { min: [-2.2, DECK_Y - 0.5, -ISLAND_RADIUS - 0.5], max: [2.2, DECK_Y + 0.7, -ISLAND_RADIUS + 4.5] },
    shorelinePosition: [STAIR_X, SHORE_Y, STAIR_BOTTOM_Z - 0.3],
    stairLayout: { direction: 'parallel-to-pier', top: [STAIR_X, DECK_Y, STAIR_TOP_Z], bottom: [STAIR_X, SHORE_Y, STAIR_BOTTOM_Z], landingDepth: LANDING_DEPTH },
    permanentEnvironment: true,
  });

  const platinum = new THREE.MeshStandardMaterial({ color: '#b8ccd2', roughness: 0.38, metalness: 0.65 });
  const structure = new THREE.MeshStandardMaterial({ color: '#142c38', roughness: 0.47, metalness: 0.78 });
  const railMaterial = new THREE.MeshStandardMaterial({ color: '#b8d4df', roughness: 0.22, metalness: 0.84 });
  const cyan = new THREE.MeshStandardMaterial({ color: '#9ffff4', emissive: '#38e6eb', emissiveIntensity: 2.1, roughness: 0.3 });
  const violet = new THREE.MeshStandardMaterial({ color: '#c8b7ff', emissive: '#9371ee', emissiveIntensity: 1.7 });
  const sand = new THREE.MeshStandardMaterial({ color: '#b9c3cc', roughness: 0.86, metalness: 0.17, vertexColors: true });
  sand.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSilverPosition;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSilverPosition = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vSilverPosition;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec2 grainCell = floor(vSilverPosition.xz * 54.0);
      float grain = fract(sin(dot(grainCell, vec2(127.1, 311.7))) * 43758.5453);
      float sparkle = smoothstep(0.984, 1.0, grain);
      float dune = sin(vSilverPosition.x * 2.7 + vSilverPosition.z * 1.1);
      diffuseColor.rgb *= 0.76 + grain * 0.20 + dune * 0.035;
      diffuseColor.rgb += vec3(0.17, 0.20, 0.24) * sparkle;`);
  };
  sand.customProgramCacheKey = () => 'synthetic-pier-silver-sand-v2';

  const mainDeck = identify(new THREE.Mesh(
    boxGeometry(STEM_HALF_WIDTH * 2, 0.24, 32, 0, DECK_Y - 0.12, -ISLAND_RADIUS - 14), platinum,
  ), 'STEM_DECK', true);
  mainDeck.castShadow = true;
  mainDeck.receiveShadow = true;
  root.add(mainDeck);

  const crownCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-9, DECK_Y, -ISLAND_RADIUS - 24),
    new THREE.Vector3(-7.5, DECK_Y, -ISLAND_RADIUS - 27),
    new THREE.Vector3(-4.3, DECK_Y, -ISLAND_RADIUS - 29.3),
    new THREE.Vector3(0, DECK_Y, -ISLAND_RADIUS - 30),
    new THREE.Vector3(4.3, DECK_Y, -ISLAND_RADIUS - 29.3),
    new THREE.Vector3(7.5, DECK_Y, -ISLAND_RADIUS - 27),
    new THREE.Vector3(9, DECK_Y, -ISLAND_RADIUS - 24),
  ]);
  const crownPoints = crownCurve.getPoints(44);
  const crown = identify(new THREE.Mesh(extrudedDeck(crownPoints, 2.2, 0.24), platinum), 'CURVED_ANCHOR_HEAD', true);
  crown.receiveShadow = true;
  crown.castShadow = true;
  root.add(crown);

  const shore = identify(new THREE.Mesh(silverSandGeometry(), sand), 'SILVER_SHORE_APRON', true);
  shore.userData.surfaceKind = 'sand';
  shore.receiveShadow = true;
  root.add(shore);

  const metalParts: THREE.BufferGeometry[] = [];
  const cyanParts: THREE.BufferGeometry[] = [];
  const violetParts: THREE.BufferGeometry[] = [];
  const railParts: THREE.BufferGeometry[] = [];
  const barriers: Barrier[] = [];
  const railHeight = metresToWorldUnits(1.1);

  const addRail = (start: THREE.Vector3, end: THREE.Vector3, barrier = true) => {
    const railStart = start.clone().add(new THREE.Vector3(0, railHeight, 0));
    const railEnd = end.clone().add(new THREE.Vector3(0, railHeight, 0));
    railParts.push(beamGeometry(railStart, railEnd, 0.012, 0.014));
    cyanParts.push(beamGeometry(start.clone().add(new THREE.Vector3(0, 0.018, 0)), end.clone().add(new THREE.Vector3(0, 0.018, 0)), 0.018, 0.01));
    const postCount = Math.max(1, Math.ceil(start.distanceTo(end) / 0.45));
    for (let index = 0; index <= postCount; index += 1) {
      const point = start.clone().lerp(end, index / postCount);
      railParts.push(boxGeometry(0.012, railHeight, 0.012, point.x, point.y + railHeight * 0.5, point.z));
    }
    if (barrier) {
      barriers.push({ start: start.clone().add(new THREE.Vector3(0, 0.08, 0)).toArray(), end: end.clone().add(new THREE.Vector3(0, 0.08, 0)).toArray(), radius: 0.025 });
    }
  };

  const railX = STEM_HALF_WIDTH - 0.035;
  addRail(new THREE.Vector3(railX, DECK_Y, -ISLAND_RADIUS + 1.9), new THREE.Vector3(railX, DECK_Y, -ISLAND_RADIUS - 28.8));
  // The opening spans the connecting landing, with no rail collider across it.
  addRail(new THREE.Vector3(-railX, DECK_Y, -ISLAND_RADIUS + 1.9), new THREE.Vector3(-railX, DECK_Y, STAIR_TOP_Z + LANDING_DEPTH + 0.04));
  addRail(new THREE.Vector3(-railX, DECK_Y, STAIR_TOP_Z - 0.04), new THREE.Vector3(-railX, DECK_Y, -ISLAND_RADIUS - 28.8));

  const crownEdges = ribbonEdges(crownPoints, 2.12);
  for (const edge of [crownEdges.left, crownEdges.right]) {
    for (let index = 0; index < edge.length - 1; index += 1) {
      const midpoint = edge[index].clone().lerp(edge[index + 1], 0.5);
      // The inner crown opens onto the stem instead of fencing off the anchor head.
      if (edge === crownEdges.left && Math.abs(midpoint.x) < STEM_HALF_WIDTH + 0.2) continue;
      addRail(edge[index], edge[index + 1]);
    }
  }
  addRail(crownEdges.left[0], crownEdges.right[0]);
  addRail(crownEdges.left[crownPoints.length - 1], crownEdges.right[crownPoints.length - 1]);

  for (let index = 0; index < 30; index += 1) {
    const z = -ISLAND_RADIUS + 1 - index;
    metalParts.push(boxGeometry(2.48, 0.004, 0.009, 0, DECK_Y + 0.002, z));
    cyanParts.push(boxGeometry(0.025, 0.009, 0.24, 0, DECK_Y + 0.005, z));
  }
  // A light structural spine and pylons keep the silhouette legible from orbit.
  metalParts.push(boxGeometry(0.75, 0.2, 31.5, 0, DECK_Y - 0.31, -ISLAND_RADIUS - 14));
  for (const zOffset of [3, 10, 18, 26]) {
    for (const x of [-0.94, 0.94]) {
      metalParts.push(boxGeometry(0.22, DECK_Y + 0.4, 0.28, x, (DECK_Y - 0.4) * 0.5, -ISLAND_RADIUS - zOffset));
    }
  }
  for (const x of [-6.4, 6.4]) {
    metalParts.push(boxGeometry(0.28, DECK_Y + 0.4, 0.34, x, (DECK_Y - 0.4) * 0.5, -ISLAND_RADIUS - 28));
  }

  const stairRise = (DECK_Y - SHORE_Y) / STAIR_COUNT;
  const landingOuterX = STAIR_X - STAIR_WIDTH * 0.5;
  const landingInnerX = -STEM_HALF_WIDTH + 0.06;
  const topLanding = identify(new THREE.Mesh(boxGeometry(
    landingInnerX - landingOuterX, 0.07, LANDING_DEPTH,
    (landingInnerX + landingOuterX) * 0.5, DECK_Y - 0.035, STAIR_TOP_Z + LANDING_DEPTH * 0.5,
  ), platinum), 'PIER_TO_STAIR_LANDING', true);
  topLanding.receiveShadow = true;
  root.add(topLanding);
  // Enclose the landing's exposed edges; leave the pier and stair mouths open.
  addRail(new THREE.Vector3(landingOuterX + 0.025, DECK_Y, STAIR_TOP_Z + LANDING_DEPTH - 0.025), new THREE.Vector3(-railX, DECK_Y, STAIR_TOP_Z + LANDING_DEPTH - 0.025));
  addRail(new THREE.Vector3(landingOuterX + 0.025, DECK_Y, STAIR_TOP_Z), new THREE.Vector3(landingOuterX + 0.025, DECK_Y, STAIR_TOP_Z + LANDING_DEPTH - 0.025));
  addRail(new THREE.Vector3(STAIR_X + STAIR_WIDTH * 0.5 - 0.025, DECK_Y, STAIR_TOP_Z), new THREE.Vector3(-railX, DECK_Y, STAIR_TOP_Z));
  const steps = identify(new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), platinum, STAIR_COUNT), 'SILVER_DESCENDING_STAIRS', true);
  const transform = new THREE.Object3D();
  for (let index = 0; index < STAIR_COUNT; index += 1) {
    const top = DECK_Y - (index + 1) * stairRise;
    const z = STAIR_TOP_Z - (index + 0.5) * STAIR_TREAD;
    transform.position.set(STAIR_X, top - 0.035, z);
    transform.scale.set(STAIR_WIDTH, 0.07, STAIR_TREAD + 0.0003);
    transform.updateMatrix();
    steps.setMatrixAt(index, transform.matrix);
    cyanParts.push(boxGeometry(STAIR_WIDTH - 0.04, 0.004, 0.005, STAIR_X, top + 0.002, z - STAIR_TREAD * 0.4));
  }
  steps.instanceMatrix.needsUpdate = true;
  steps.computeBoundingBox();
  steps.computeBoundingSphere();
  Object.assign(steps.userData, { stairCount: STAIR_COUNT, riserWorld: stairRise, treadWorld: STAIR_TREAD });
  steps.receiveShadow = true;
  root.add(steps);

  const stairNavGeometry = new THREE.BufferGeometry();
  stairNavGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    STAIR_X - STAIR_WIDTH * 0.5, DECK_Y + 0.001, STAIR_TOP_Z + 0.003,
    STAIR_X + STAIR_WIDTH * 0.5, DECK_Y + 0.001, STAIR_TOP_Z + 0.003,
    STAIR_X + STAIR_WIDTH * 0.5, SHORE_Y + 0.001, STAIR_BOTTOM_Z - 0.003,
    STAIR_X - STAIR_WIDTH * 0.5, SHORE_Y + 0.001, STAIR_BOTTOM_Z - 0.003,
  ], 3));
  stairNavGeometry.setIndex([0, 1, 2, 0, 2, 3]);
  stairNavGeometry.computeVertexNormals();
  const stairNav = identify(new THREE.Mesh(stairNavGeometry, new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0, colorWrite: false, depthWrite: false, side: THREE.DoubleSide,
  })), 'CONTINUOUS_STAIR_NAVIGATION', true);
  stairNav.userData.navigationOnly = true;
  root.add(stairNav);
  for (const side of [-1, 1]) {
    const x = STAIR_X + side * (STAIR_WIDTH * 0.5 - 0.025);
    addRail(new THREE.Vector3(x, DECK_Y, STAIR_TOP_Z), new THREE.Vector3(x, SHORE_Y, STAIR_BOTTOM_Z));
  }

  const landing = identify(new THREE.Mesh(boxGeometry(1.05, 0.07, 0.7, STAIR_X, SHORE_Y - 0.035, STAIR_BOTTOM_Z - 0.3), platinum), 'BEACH_LANDING', true);
  landing.receiveShadow = true;
  root.add(landing);

  // Low paired beacons announce the portal without creating point-light passes.
  for (const side of [-1, 1]) {
    const x = side * 1.14;
    metalParts.push(boxGeometry(0.16, 0.47, 0.26, x, DECK_Y + 0.235, -ISLAND_RADIUS - 0.5));
    violetParts.push(boxGeometry(0.018, 0.37, 0.27, x - side * 0.07, DECK_Y + 0.265, -ISLAND_RADIUS - 0.5));
    cyanParts.push(boxGeometry(0.17, 0.014, 0.28, x, DECK_Y + 0.475, -ISLAND_RADIUS - 0.5));
  }
  const structuralMesh = mergedMesh(metalParts, structure, 'BATCHED_STRUCTURE_AND_DECK_SEAMS');
  structuralMesh.castShadow = true;
  const railMesh = mergedMesh(railParts, railMaterial, 'BATCHED_RAILINGS');
  railMesh.userData.navBarrierSegments = barriers;
  root.add(structuralMesh, railMesh, mergedMesh(cyanParts, cyan, 'BATCHED_CYAN_GUIDANCE'), mergedMesh(violetParts, violet, 'BATCHED_VIOLET_BEACONS'));
  root.updateMatrixWorld(true);
  return root;
}
