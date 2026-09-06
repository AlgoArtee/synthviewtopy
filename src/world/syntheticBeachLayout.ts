import * as THREE from 'three';

/** Canonical beach coordinates are campus units relative to the Alpine vertex. */
export const BEACH_SCALE = 6;
export const BEACH_ORIGIN_X = 42;
export const BEACH_ORIGIN_Z = 110;
export const BEACH_SEAWALL_OFFSET = 0.22;

export interface BeachPoint { x: number; z: number }
export interface BeachCoastSample {
  /** Signed metres from the exposed ocean coast: dry/inland < 0, offshore > 0. */
  distance: number;
  /** Metres along the coast, west seawall → ocean front → east seawall. */
  along: number;
  /** Outward unit normal in immersive scene X/Z. */
  normalX: number;
  normalZ: number;
}

export function beachSeawallZ(x: number) {
  return Math.abs(x) / Math.sqrt(3) + BEACH_SEAWALL_OFFSET;
}

/** The only exposed shore: the two landward seawall joins are deliberately absent. */
export const BEACH_OUTER_CURVES: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
  [-30.5, -0.5, -28, -10, -22.5, -16.5],
  [-19.5, -20, -13, -23, -8.5, -20.5],
  [-5.8, -19, -4.8, -19, 0, -19],
  [4.8, -19, 5.8, -19, 8.5, -20.5],
  [13, -23, 19.5, -20, 22.5, -16.5],
  [28, -10, 30.5, -0.5, 29, beachSeawallZ(29)],
];

/** Shape XY stores canonical X/Z; add -ISLAND_RADIUS to Z in the campus scene. */
export function createBeachPerimeter(): THREE.Shape {
  const perimeter = new THREE.Shape();
  perimeter.moveTo(0, beachSeawallZ(0));
  perimeter.lineTo(-29, beachSeawallZ(-29));
  for (const curve of BEACH_OUTER_CURVES) perimeter.bezierCurveTo(...curve);
  perimeter.lineTo(0, beachSeawallZ(0));
  perimeter.closePath();
  return perimeter;
}

export function beachToScene(x: number, z: number, out: BeachPoint = { x: 0, z: 0 }): BeachPoint {
  out.x = BEACH_ORIGIN_X + x * BEACH_SCALE;
  out.z = BEACH_ORIGIN_Z + z * BEACH_SCALE;
  return out;
}

export function sceneToBeach(x: number, z: number, out: BeachPoint = { x: 0, z: 0 }): BeachPoint {
  out.x = (x - BEACH_ORIGIN_X) / BEACH_SCALE;
  out.z = (z - BEACH_ORIGIN_Z) / BEACH_SCALE;
  return out;
}

/** The V-shaped mainland side of the two island joins, rather than exposed shore. */
export function isBeachLandward(sceneX: number, sceneZ: number): boolean {
  return sceneZ >= BEACH_ORIGIN_Z + Math.abs(sceneX - BEACH_ORIGIN_X) / Math.sqrt(3) + BEACH_SEAWALL_OFFSET * BEACH_SCALE;
}

export const BEACH_COAST_BOUNDS = Object.freeze({ minX: -200, minZ: -180, maxX: 284, maxZ: 260 });
/** Texture domain is scene X/Z; Mizu shader p maps to scene (p.y, -p.x). */
export const BEACH_COAST_FIELD_BOUNDS: readonly [number, number, number, number] = [
  BEACH_COAST_BOUNDS.minX, BEACH_COAST_BOUNDS.minZ, BEACH_COAST_BOUNDS.maxX, BEACH_COAST_BOUNDS.maxZ,
];
const CURVE_SUBDIVISIONS = 64;
export const BEACH_COAST_SEGMENT_COUNT = BEACH_OUTER_CURVES.length * CURVE_SUBDIVISIONS;

/** Read-only interleaved scene X/Z samples of the six exposed Beziers. */
export const BEACH_COAST_POINTS = new Float64Array((BEACH_COAST_SEGMENT_COUNT + 1) * 2);
/** Read-only cumulative scene metres, one value per coast point. */
export const BEACH_COAST_LENGTHS = new Float64Array(BEACH_COAST_SEGMENT_COUNT + 1);
const segmentDX = new Float64Array(BEACH_COAST_SEGMENT_COUNT);
const segmentDZ = new Float64Array(BEACH_COAST_SEGMENT_COUNT);
const segmentLengthSquared = new Float64Array(BEACH_COAST_SEGMENT_COUNT);
const coastNormals = new Float64Array(BEACH_COAST_POINTS.length);

let startX = -29;
let startZ = beachSeawallZ(-29);
BEACH_COAST_POINTS[0] = BEACH_ORIGIN_X + startX * BEACH_SCALE;
BEACH_COAST_POINTS[1] = BEACH_ORIGIN_Z + startZ * BEACH_SCALE;
let pointIndex = 1;
for (const [control1X, control1Z, control2X, control2Z, endX, endZ] of BEACH_OUTER_CURVES) {
  for (let step = 1; step <= CURVE_SUBDIVISIONS; step += 1) {
    const t = step / CURVE_SUBDIVISIONS;
    const u = 1 - t;
    const x = u * u * u * startX + 3 * u * u * t * control1X + 3 * u * t * t * control2X + t * t * t * endX;
    const z = u * u * u * startZ + 3 * u * u * t * control1Z + 3 * u * t * t * control2Z + t * t * t * endZ;
    BEACH_COAST_POINTS[pointIndex * 2] = BEACH_ORIGIN_X + x * BEACH_SCALE;
    BEACH_COAST_POINTS[pointIndex * 2 + 1] = BEACH_ORIGIN_Z + z * BEACH_SCALE;
    pointIndex += 1;
  }
  startX = endX;
  startZ = endZ;
}

for (let i = 0; i < BEACH_COAST_SEGMENT_COUNT; i += 1) {
  const dx = BEACH_COAST_POINTS[(i + 1) * 2] - BEACH_COAST_POINTS[i * 2];
  const dz = BEACH_COAST_POINTS[(i + 1) * 2 + 1] - BEACH_COAST_POINTS[i * 2 + 1];
  const length = Math.hypot(dx, dz);
  segmentDX[i] = dx;
  segmentDZ[i] = dz;
  segmentLengthSquared[i] = length * length;
  BEACH_COAST_LENGTHS[i + 1] = BEACH_COAST_LENGTHS[i] + length;
  // This contour winds counter-clockwise in X/Z. Increasing-along tangent is
  // (-normalZ, normalX), also used to rotate the imported coastal wave spectrum.
  coastNormals[i * 2] += dz / length;
  coastNormals[i * 2 + 1] -= dx / length;
  coastNormals[(i + 1) * 2] += dz / length;
  coastNormals[(i + 1) * 2 + 1] -= dx / length;
}
for (let i = 0; i <= BEACH_COAST_SEGMENT_COUNT; i += 1) {
  const length = Math.hypot(coastNormals[i * 2], coastNormals[i * 2 + 1]);
  coastNormals[i * 2] /= length;
  coastNormals[i * 2 + 1] /= length;
}
export const BEACH_COAST_LENGTH = BEACH_COAST_LENGTHS[BEACH_COAST_SEGMENT_COUNT];

function crossesRay(x: number, z: number, ax: number, az: number, bx: number, bz: number): boolean {
  return (az > z) !== (bz > z) && x < (bx - ax) * (z - az) / (bz - az) + ax;
}

/**
 * Exact polygon classification with distance/along measured ONLY against the
 * exposed coast. The two landward closure lines never become foam contours.
 * Reuse `out` in CPU movement loops or while baking an RGBA distance texture.
 */
export function sampleBeachCoast(sceneX: number, sceneZ: number, out: BeachCoastSample = { distance: 0, along: 0, normalX: 0, normalZ: -1 }): BeachCoastSample {
  let closestSquared = Infinity;
  let closestSegment = 0;
  let closestT = 0;
  let inside = false;
  for (let i = 0; i < BEACH_COAST_SEGMENT_COUNT; i += 1) {
    const ax = BEACH_COAST_POINTS[i * 2];
    const az = BEACH_COAST_POINTS[i * 2 + 1];
    const dx = segmentDX[i];
    const dz = segmentDZ[i];
    const t = Math.max(0, Math.min(1, ((sceneX - ax) * dx + (sceneZ - az) * dz) / segmentLengthSquared[i]));
    const distanceX = sceneX - ax - t * dx;
    const distanceZ = sceneZ - az - t * dz;
    const squared = distanceX * distanceX + distanceZ * distanceZ;
    if (squared < closestSquared) {
      closestSquared = squared;
      closestSegment = i;
      closestT = t;
    }
    if (crossesRay(sceneX, sceneZ, ax, az, ax + dx, az + dz)) inside = !inside;
  }
  const midpointZ = BEACH_ORIGIN_Z + beachSeawallZ(0) * BEACH_SCALE;
  const last = BEACH_COAST_SEGMENT_COUNT * 2;
  if (crossesRay(sceneX, sceneZ, BEACH_COAST_POINTS[last], BEACH_COAST_POINTS[last + 1], BEACH_ORIGIN_X, midpointZ)) inside = !inside;
  if (crossesRay(sceneX, sceneZ, BEACH_ORIGIN_X, midpointZ, BEACH_COAST_POINTS[0], BEACH_COAST_POINTS[1])) inside = !inside;
  const i = closestSegment * 2;
  const nx = THREE.MathUtils.lerp(coastNormals[i], coastNormals[i + 2], closestT);
  const nz = THREE.MathUtils.lerp(coastNormals[i + 1], coastNormals[i + 3], closestT);
  const normalLength = Math.hypot(nx, nz);
  out.distance = Math.sqrt(closestSquared) * (inside || isBeachLandward(sceneX, sceneZ) ? -1 : 1);
  out.along = THREE.MathUtils.lerp(BEACH_COAST_LENGTHS[closestSegment], BEACH_COAST_LENGTHS[closestSegment + 1], closestT);
  out.normalX = nx / normalLength;
  out.normalZ = nz / normalLength;
  return out;
}
