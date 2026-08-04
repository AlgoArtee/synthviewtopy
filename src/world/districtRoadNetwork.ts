import * as THREE from 'three';
import {
  DISTRICT_ROAD_RADII,
  ISLAND_SURFACE_Y,
  metresToWorldUnits,
} from '../config/island';
import type { DistrictDefinition } from '../data/districts';

type PointTuple = [number, number, number];
type EndpointKinds = [string, string];

interface RoadRecord {
  mesh: THREE.Mesh;
  id: string;
  roadClass: string;
  centerline: THREE.Vector3[];
  width: number;
  endpointKinds: EndpointKinds;
  generated: boolean;
  connector: boolean;
  ringId?: string;
  planningStrategy?: ConnectorPathPlan['strategy'];
  planningClearance?: number;
  detourWaypointCount?: number;
}

interface DistrictRoadRouteSummary {
  id: string;
  roadId: string;
  name: string;
  roadClass: string;
  width: number;
  length: number;
  pointCount: number;
  centerline: PointTuple[];
  centerlineSpace: 'district-local';
  endpointKinds: EndpointKinds;
  generated: boolean;
  connector: boolean;
  ringId?: string;
  planningStrategy?: ConnectorPathPlan['strategy'];
  planningClearance?: number;
  detourWaypointCount?: number;
}

interface ConnectorObstacle {
  object: THREE.Mesh;
  localBounds: THREE.Box3;
  districtToObject: THREE.Matrix4;
  relativeScale: THREE.Vector3;
  districtBounds: THREE.Box2;
  tiltedLocalUp: boolean;
}

interface BoundaryAnchor {
  record: RoadRecord;
  point: THREE.Vector3;
  world: THREE.Vector3;
  score: number;
}

interface ConnectorPathPlan {
  anchor: BoundaryAnchor;
  worldPoints: THREE.Vector3[];
  strategy: 'direct-visibility' | 'polar-grid-detour';
  planningClearance: number;
  detourWaypointCount: number;
}

export interface FinalizeDistrictRoadNetworkOptions {
  /** Rebuild generated collectors/connectors and refresh authored route metadata. */
  force?: boolean;
}

const ROAD_SURFACE_WORLD_Y = ISLAND_SURFACE_Y + 0.006;
const NETWORK_VERSION = 2;
const MAX_SUMMARY_CENTERLINE_POINTS = 64;
const MAX_MESH_CENTERLINE_POINTS = 64;
const GENERATED_NETWORK_GROUP_NAME = 'DISTRICT_ROADS__GENERATED_NETWORK';
const CONNECTOR_EDGE_CLEARANCE = metresToWorldUnits(1.8);
const CONNECTOR_SMOOTHING_MARGIN = metresToWorldUnits(3.2);
const CONNECTOR_SAMPLE_STEP = metresToWorldUnits(11);
const CONNECTOR_GRID_RADIAL_STEP = metresToWorldUnits(11.5);
const CONNECTOR_DIRECT_ANCHOR_LIMIT = 48;
const CONNECTOR_GRID_ANCHOR_LIMIT = 24;
const CONNECTOR_GOAL_ANGLE_STEPS = 48;

const GENERIC_DISTRICT_IDS = new Set([
  'synthetic-quantum-biosystems',
  'dark-center-lab-megabuilding',
  'corporate-core',
  'toxicology-labs',
  'omics-labs',
  'electronics-microelectronics-labs',
  'robotics-labs',
  'marketing',
  'scientific-art-labs',
  'even-hour-hotel',
  'astronomy-astrobiology-labs',
  'luxury-entertainment',
  'scientist-residential',
  'materials-science-lab',
  'financial-funding',
  'environmental-science-labs',
]);

const EXISTING_NETWORK_EXCEPTIONS = new Map<string, string>([
  [
    'academic-libraries-theoretical-labs',
    'The authored Academic path graph already joins the inner ring and both radial gate roads at the shared road datum.',
  ],
  [
    'entry-commercial',
    'The editable Entry network already contains exact bridge, shared-cell, and ring-delimiter transitions.',
  ],
  [
    'logistics',
    'The editable Logistics network already joins Entry and the inner ring through two typed delimiter links.',
  ],
]);

const ROUTE_FLAG_KEYS = [
  'securityRoad',
  'secretLabRoad',
  'medicalRoute',
  'pharmacologyRoute',
  'microbiologyRoute',
  'molecularRoute',
  'bioanalyticsRoute',
  'forensicRoute',
  'genomicsRoute',
  'proteomicsRoute',
  'computationalBiologyRoute',
  'biochemistryRoute',
  'organicChemistryRoute',
  'inorganicChemistryRoute',
  'particlePhysicsRoute',
] as const;

// Match semantic name tokens, not arbitrary substrings: the previous broad
// `ROAD` alternative also matched the `ROAD` inside `BROAD_SCULPTURAL_STAIR`,
// while `WALK` pulled isolated interior walk surfaces into the street graph.
const ROAD_NAME_PATTERN = /(?:^|__|[-_\s])(?:ROAD|ROUTE|PATH|PROMENADE|SPINE|AVENUE|BOULEVARD|MERIDIAN|CRESCENT|PASSAGE|COLLECTOR|HARDSTAND|APPROACH|WALKWAY|INTERFACE_LINK|SERVICE_LINK|RESEARCH_ARC|PROCESS_ARC)(?=$|__|[-_\s])/i;
const NON_ROUTE_SURFACE_PATTERN = /(?:PLOT|FOUNDATION|PODIUM|ROOF|FLOOR|TERRACE|PLAZA|COURT|LANDSCAPE|BASIN|CHANNEL|POOL|DECK|BRIDGE_DECK)/i;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'road';
}

function tuple(point: THREE.Vector3): PointTuple {
  return [
    Number(point.x.toFixed(4)),
    Number(point.y.toFixed(4)),
    Number(point.z.toFixed(4)),
  ];
}

function compactCenterline(points: readonly THREE.Vector3[], maximum: number) {
  if (points.length <= maximum) return points.map(tuple);
  const compact: PointTuple[] = [];
  for (let index = 0; index < maximum; index += 1) {
    const sourceIndex = Math.round((index / (maximum - 1)) * (points.length - 1));
    compact.push(tuple(points[sourceIndex]));
  }
  return compact;
}

function centerlineLength(points: readonly THREE.Vector3[]) {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += points[index - 1].distanceTo(points[index]);
  }
  return length;
}

function materialFor(mesh: THREE.Mesh) {
  return Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
}

function relativeMatrix(object: THREE.Object3D, district: THREE.Group) {
  return district.matrixWorld.clone().invert().multiply(object.matrixWorld);
}

function parentPointToDistrict(
  mesh: THREE.Mesh,
  district: THREE.Group,
  value: readonly number[],
) {
  const parent = mesh.parent ?? mesh;
  return new THREE.Vector3().fromArray(value as number[]).applyMatrix4(relativeMatrix(parent, district));
}

function meshSurfaceY(mesh: THREE.Mesh, district: THREE.Group) {
  mesh.geometry.computeBoundingBox();
  const bounds = mesh.geometry.boundingBox;
  if (!bounds) return mesh.getWorldPosition(new THREE.Vector3()).applyMatrix4(district.matrixWorld.clone().invert()).y;
  const center = bounds.getCenter(new THREE.Vector3());
  center.y = bounds.max.y;
  return center.applyMatrix4(relativeMatrix(mesh, district)).y;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) * 0.5
    : sorted[middle];
}

function isPairedRibbon(mesh: THREE.Mesh) {
  const data = mesh.userData;
  return data.continuousRoadSurface === true
    || ROUTE_FLAG_KEYS.some((key) => data[key] === true);
}

function pairedRibbonCenterline(mesh: THREE.Mesh, district: THREE.Group) {
  const positions = mesh.geometry.getAttribute('position');
  if (!positions || positions.count < 4 || positions.count % 2 !== 0) return null;
  const matrix = relativeMatrix(mesh, district);
  const left = new THREE.Vector3();
  const right = new THREE.Vector3();
  const centerline: THREE.Vector3[] = [];
  const widths: number[] = [];
  for (let index = 0; index < positions.count; index += 2) {
    left.fromBufferAttribute(positions, index).applyMatrix4(matrix);
    right.fromBufferAttribute(positions, index + 1).applyMatrix4(matrix);
    centerline.push(left.clone().add(right).multiplyScalar(0.5));
    widths.push(left.distanceTo(right));
  }
  return { centerline, width: median(widths) };
}

function explicitCenterline(mesh: THREE.Mesh, district: THREE.Group) {
  const endpoints = mesh.userData.roadEndpoints as {
    start?: readonly number[];
    end?: readonly number[];
  } | undefined;
  const fromPoint = mesh.userData.fromPoint as readonly number[] | undefined;
  const toPoint = mesh.userData.toPoint as readonly number[] | undefined;
  const start = endpoints?.start ?? fromPoint;
  const end = endpoints?.end ?? toPoint;
  if (!start || !end) return null;
  const surfaceY = meshSurfaceY(mesh, district);
  return [
    parentPointToDistrict(mesh, district, start).setY(surfaceY),
    parentPointToDistrict(mesh, district, end).setY(surfaceY),
  ];
}

function boxCenterline(mesh: THREE.Mesh, district: THREE.Group) {
  mesh.geometry.computeBoundingBox();
  const bounds = mesh.geometry.boundingBox;
  if (!bounds) return null;
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const alongX = size.x >= size.z;
  const start = center.clone();
  const end = center.clone();
  start.y = end.y = bounds.max.y;
  if (alongX) {
    start.x = bounds.min.x;
    end.x = bounds.max.x;
  } else {
    start.z = bounds.min.z;
    end.z = bounds.max.z;
  }
  const matrix = relativeMatrix(mesh, district);
  start.applyMatrix4(matrix);
  end.applyMatrix4(matrix);
  const widthStart = center.clone();
  const widthEnd = center.clone();
  widthStart.y = widthEnd.y = bounds.max.y;
  if (alongX) {
    widthStart.z = bounds.min.z;
    widthEnd.z = bounds.max.z;
  } else {
    widthStart.x = bounds.min.x;
    widthEnd.x = bounds.max.x;
  }
  const width = widthStart.applyMatrix4(matrix).distanceTo(widthEnd.applyMatrix4(matrix));
  return { centerline: [start, end], width };
}

function inferredWidth(mesh: THREE.Mesh, fallback: number) {
  const explicit = Number(
    mesh.userData.pathWidthWorldUnits
      ?? mesh.userData.width
      ?? mesh.userData.widthStart,
  );
  return Number.isFinite(explicit) && explicit > 0 ? explicit : fallback;
}

function isWalkableRoadMesh(object: THREE.Object3D): object is THREE.Mesh {
  if (!(object instanceof THREE.Mesh)
    || !object.geometry
    || object.userData.walkable !== true
    || object.userData.roadJunctionCap === true) return false;
  let ancestor = object.parent;
  while (ancestor) {
    if (ancestor.userData.runtimeInterior === true) return false;
    ancestor = ancestor.parent;
  }
  const explicit = object.userData.transitRoad === true
    || object.userData.localCampusRoad === true
    || object.userData.academicCampusRoad === true
    || object.userData.academicBoundaryAccessPath === true
    || object.userData.continuousRoadSurface === true
    || object.userData.entranceLinkedRoad === true
    || object.userData.semanticRoadSegment === true
    || object.userData.districtTransition === true
    || ROUTE_FLAG_KEYS.some((key) => object.userData[key] === true);
  if (explicit) return true;
  return ROAD_NAME_PATTERN.test(object.name) && !NON_ROUTE_SURFACE_PATTERN.test(object.name);
}

function roadClassFor(mesh: THREE.Mesh) {
  const data = mesh.userData;
  const name = mesh.name;
  if (typeof data.roadClass === 'string') return data.roadClass;
  if (data.districtTransition === true) return 'delimiter-connector';
  if (/ACCESS_APPROACH/i.test(name)) return 'pedestrian-spur';
  if (data.academicPathRole === 'entrance-apron') return 'building-approach';
  if (data.academicPathRole === 'main-processional') return 'primary';
  if (data.academicPathRole === 'campus-spine') return 'pedestrian-spine';
  if (data.academicPathRole === 'campus-crosswalk') return 'pedestrian-link';
  if (data.localCampusRoad === true || /(?:BUILDING_APPROACH|DOOR_APRON|HARDSTAND)/i.test(name)) {
    return 'building-approach';
  }
  const routeKind = String(data.routeKind ?? '');
  if (/freight|service|airside|logistics/i.test(routeKind) || /(?:FREIGHT|SERVICE|LOGISTICS|MAINTENANCE|YARD)/i.test(name)) {
    return 'service';
  }
  if (/promenade|pedestrian/i.test(routeKind) || /(?:PROMENADE|WALK|PATH|PEDESTRIAN|PASSAGE)/i.test(name)) {
    return 'pedestrian';
  }
  if (/(?:COLLECTOR|LOOP)/i.test(name)) return 'collector';
  if (/(?:AVENUE|BOULEVARD|MERIDIAN|SPINE|CRESCENT|RESEARCH_ARC|PROCESS_ARC)/i.test(name)) return 'primary';
  return 'local-road';
}

function endpointKindsFor(mesh: THREE.Mesh, roadClass: string): EndpointKinds {
  const fromKind = mesh.userData.fromEndpointType;
  const toKind = mesh.userData.toEndpointType;
  if (typeof fromKind === 'string' && typeof toKind === 'string') return [fromKind, toKind];
  if (mesh.userData.districtTransition === true) return ['internal-network', 'ring-delimiter'];
  if (roadClass === 'building-approach') return ['internal-junction', 'building-entrance'];
  return ['route-end', 'route-end'];
}

function inferRoadGeometry(mesh: THREE.Mesh, district: THREE.Group) {
  const explicit = explicitCenterline(mesh, district);
  if (explicit) {
    const box = boxCenterline(mesh, district);
    return {
      centerline: explicit,
      width: inferredWidth(mesh, box?.width ?? 0.62),
    };
  }
  if (isPairedRibbon(mesh)) {
    const ribbon = pairedRibbonCenterline(mesh, district);
    if (ribbon) return {
      centerline: ribbon.centerline,
      width: inferredWidth(mesh, ribbon.width),
    };
  }
  const box = boxCenterline(mesh, district);
  if (!box) return null;
  return {
    centerline: box.centerline,
    width: inferredWidth(mesh, box.width),
  };
}

function assignRoadMetadata(
  mesh: THREE.Mesh,
  definition: DistrictDefinition,
  id: string,
  roadClass: string,
  centerline: readonly THREE.Vector3[],
  width: number,
  endpointKinds: EndpointKinds,
  generated = false,
) {
  mesh.userData.transitRoad = true;
  mesh.userData.roadId = id;
  mesh.userData.districtId = definition.id;
  mesh.userData.roadClass = roadClass;
  mesh.userData.centerline = compactCenterline(centerline, MAX_MESH_CENTERLINE_POINTS);
  mesh.userData.centerlineSpace = 'district-local';
  mesh.userData.endpointKinds = [...endpointKinds];
  mesh.userData.widthWorldUnits = Number(width.toFixed(4));
  mesh.userData.width = Number(width.toFixed(4));
  mesh.userData.generatedDistrictRoad = generated;
  mesh.userData.navObstacle = false;
}

function discoverRoads(
  district: THREE.Group,
  definition: DistrictDefinition,
  claimedIds: Set<string>,
) {
  district.updateMatrixWorld(true);
  const records: RoadRecord[] = [];
  const candidates: THREE.Mesh[] = [];
  district.traverse((object) => {
    if (isWalkableRoadMesh(object)) candidates.push(object);
  });
  // Entry/Logistics author a continuous ribbon plus short construction
  // segments for the same route. Prefer the ribbon's full centreline so HLOD
  // and topology consumers receive one route instead of hundreds of overlaps.
  const continuousRouteIds = new Set(candidates
    .filter((mesh) => mesh.userData.continuousRoadSurface === true)
    .map((mesh) => String(mesh.userData.routeId ?? ''))
    .filter(Boolean));
  candidates.forEach((object) => {
    const routeId = String(object.userData.routeId ?? '');
    if (object.userData.continuousRoadSurface !== true
      && object.userData.semanticRoadSegment === true
      && routeId
      && continuousRouteIds.has(routeId)) return;
    const inferred = inferRoadGeometry(object, district);
    if (!inferred || inferred.centerline.length < 2 || inferred.width <= 0.001) return;
    const baseId = String(
      object.userData.roadId
        ?? (routeId ? `${definition.id}__${slugify(routeId)}` : `${definition.id}__${slugify(object.name)}`),
    );
    let id = baseId;
    let suffix = 2;
    while (claimedIds.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }
    claimedIds.add(id);
    const authoredTransitionException = EXISTING_NETWORK_EXCEPTIONS.has(definition.id)
      && object.userData.districtTransition === true;
    const roadClass = authoredTransitionException
      ? 'existing-network-transition'
      : roadClassFor(object);
    const endpointKinds: EndpointKinds = authoredTransitionException
      ? ['existing-network', 'existing-boundary-transition']
      : endpointKindsFor(object, roadClass);
    assignRoadMetadata(
      object,
      definition,
      id,
      roadClass,
      inferred.centerline,
      inferred.width,
      endpointKinds,
      false,
    );
    records.push({
      mesh: object,
      id,
      roadClass,
      centerline: inferred.centerline,
      width: inferred.width,
      endpointKinds,
      generated: false,
      connector: object.userData.districtTransition === true && !authoredTransitionException,
    });
  });
  return records;
}

function ribbonGeometry(
  points: readonly THREE.Vector3[],
  widthStart: number,
  widthEnd = widthStart,
  closed = false,
) {
  const vertices: number[] = [];
  const indices: number[] = [];
  const pointCount = points.length;
  points.forEach((point, index) => {
    const previous = points[closed
      ? (index - 1 + pointCount) % pointCount
      : Math.max(0, index - 1)];
    const next = points[closed
      ? (index + 1) % pointCount
      : Math.min(pointCount - 1, index + 1)];
    const tangent = next.clone().sub(previous).setY(0);
    if (tangent.lengthSq() < 0.000001) tangent.set(0, 0, 1);
    tangent.normalize();
    const widthT = pointCount <= 1 ? 0 : index / (pointCount - 1);
    const halfWidth = THREE.MathUtils.lerp(widthStart, widthEnd, widthT) * 0.5;
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(halfWidth);
    vertices.push(
      point.x + normal.x, point.y, point.z + normal.z,
      point.x - normal.x, point.y, point.z - normal.z,
    );
  });
  const segmentCount = closed ? pointCount : pointCount - 1;
  for (let index = 0; index < segmentCount; index += 1) {
    const nextIndex = (index + 1) % pointCount;
    const base = index * 2;
    const nextBase = nextIndex * 2;
    indices.push(base, nextBase, base + 1, base + 1, nextBase, nextBase + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function generatedRoadGroup(district: THREE.Group, definition: DistrictDefinition) {
  const existing = district.getObjectByName(GENERATED_NETWORK_GROUP_NAME);
  if (existing instanceof THREE.Group) return existing;
  const group = new THREE.Group();
  group.name = GENERATED_NETWORK_GROUP_NAME;
  group.userData = {
    selectableId: definition.id,
    districtId: definition.id,
    generatedDistrictRoadNetwork: true,
  };
  district.add(group);
  return group;
}

function createJunctionCap(
  parent: THREE.Group,
  definition: DistrictDefinition,
  point: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  id: string,
  kind: string,
) {
  const cap = new THREE.Mesh(new THREE.CircleGeometry(radius, 32), material);
  cap.name = `${definition.id.toUpperCase()}__ROAD_JUNCTION__${slugify(id).toUpperCase()}`;
  cap.rotation.x = -Math.PI * 0.5;
  cap.position.copy(point).add(new THREE.Vector3(0, 0.0004, 0));
  cap.receiveShadow = true;
  cap.userData = {
    selectableId: definition.id,
    transitRoad: true,
    roadId: `${id}__junction`,
    districtId: definition.id,
    roadClass: 'junction',
    centerline: [tuple(point)],
    centerlineSpace: 'district-local',
    endpointKinds: [kind],
    widthWorldUnits: Number((radius * 2).toFixed(4)),
    roadJunctionCap: true,
    generatedDistrictRoad: true,
    walkable: true,
    navObstacle: false,
  };
  parent.add(cap);
  return cap;
}

function createGenericCollector(
  district: THREE.Group,
  definition: DistrictDefinition,
  records: RoadRecord[],
  claimedIds: Set<string>,
) {
  if (!GENERIC_DISTRICT_IDS.has(definition.id)) return null;
  const approaches = records.filter((record) => record.mesh.userData.localCampusRoad === true);
  if (approaches.length < 3) return null;
  const starts = approaches.map((record) => record.centerline[0].clone());
  const center = starts.reduce((sum, point) => sum.add(point), new THREE.Vector3())
    .multiplyScalar(1 / starts.length);
  starts.sort((left, right) => (
    Math.atan2(left.z - center.z, left.x - center.x)
      - Math.atan2(right.z - center.z, right.x - center.x)
  ));
  const curve = new THREE.CatmullRomCurve3(starts, true, 'centripetal', 0.35);
  const divisions = Math.max(40, starts.length * 12);
  // `getPoints` retains the four authored approach knots at exact quarter
  // intervals. Keep a repeated terminal point in metadata so topology/HLOD
  // consumers can recognize the route as closed without reading mesh flags.
  const ribbonCenterline = curve.getPoints(divisions).slice(0, -1);
  const centerline = [...ribbonCenterline, ribbonCenterline[0].clone()];
  const width = median(approaches.map((record) => record.width)) || 0.72;
  const material = materialFor(approaches[0].mesh);
  const parent = generatedRoadGroup(district, definition);
  const mesh = new THREE.Mesh(ribbonGeometry(ribbonCenterline, width, width, true), material);
  mesh.name = `${definition.id}__GENERIC_CAMPUS_COLLECTOR_LOOP`;
  mesh.receiveShadow = true;
  mesh.userData.walkable = true;
  const baseId = `${definition.id}__collector-loop`;
  let id = baseId;
  let suffix = 2;
  while (claimedIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }
  claimedIds.add(id);
  const endpointKinds: EndpointKinds = ['closed-loop', 'closed-loop'];
  assignRoadMetadata(mesh, definition, id, 'collector', centerline, width, endpointKinds, true);
  mesh.userData.genericCollectorLoop = true;
  mesh.userData.closedRoadLoop = true;
  parent.add(mesh);
  starts.forEach((point, index) => {
    createJunctionCap(
      parent,
      definition,
      point,
      Math.max(0.4, width * 0.62),
      material,
      `${id}__approach-${index + 1}`,
      'collector-approach-junction',
    );
  });
  approaches.forEach((record) => {
    record.endpointKinds = ['collector-junction', 'building-entrance'];
    record.mesh.userData.endpointKinds = [...record.endpointKinds];
  });
  return {
    mesh,
    id,
    roadClass: 'collector',
    centerline,
    width,
    endpointKinds,
    generated: true,
    connector: false,
  } satisfies RoadRecord;
}

function ringId(radius: number) {
  return `RING_${radius.toFixed(3)}`;
}

function matchingRoadRadius(radius: number) {
  return DISTRICT_ROAD_RADII.find((candidate) => Math.abs(candidate - radius) < 0.01);
}

function eligibleRingBoundaries(definition: DistrictDefinition) {
  const sector = definition.sector;
  if (!sector) return [];
  const radii: number[] = [];
  if (definition.ring !== 'core') {
    const inner = matchingRoadRadius(sector.innerRadius);
    if (inner !== undefined) radii.push(inner);
  }
  if (definition.ring !== 'perimeter') {
    const outer = matchingRoadRadius(sector.outerRadius);
    if (outer !== undefined) radii.push(outer);
  }
  return radii;
}

function classPenalty(roadClass: string) {
  switch (roadClass) {
    case 'collector': return 0;
    case 'primary': return 0.1;
    case 'local-road': return 0.35;
    case 'service': return 0.5;
    case 'pedestrian-spine': return 0.6;
    case 'pedestrian': return 0.75;
    case 'pedestrian-link': return 0.85;
    case 'building-approach': return 4;
    default: return 1.25;
  }
}

function smootherStep(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function ringRoadWidth(radius: number) {
  const index = DISTRICT_ROAD_RADII.findIndex((candidate) => Math.abs(candidate - radius) < 0.01);
  return index === DISTRICT_ROAD_RADII.length - 1 ? 1.85 : 1.55;
}

function collisionObjectActive(object: THREE.Object3D, district: THREE.Group) {
  let cursor: THREE.Object3D | null = object;
  let sourceObject = true;
  while (cursor) {
    if (cursor.userData.collisionEnabled === false) return false;
    if (!cursor.visible && !(sourceObject && cursor.userData.gpuBatchSource === true)) return false;
    if (cursor === district) break;
    sourceObject = false;
    cursor = cursor.parent;
  }
  return cursor === district;
}

function districtBoundsForLocalBox(bounds: THREE.Box3, matrix: THREE.Matrix4) {
  const result = new THREE.Box2().makeEmpty();
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const point = new THREE.Vector3(x, y, z).applyMatrix4(matrix);
        result.expandByPoint(new THREE.Vector2(point.x, point.z));
      }
    }
  }
  return result;
}

function collectConnectorObstacles(district: THREE.Group) {
  district.updateMatrixWorld(true);
  const districtInverse = district.matrixWorld.clone().invert();
  const obstacles: ConnectorObstacle[] = [];
  district.traverse((object) => {
    if (!(object instanceof THREE.Mesh)
      || object.userData.navObstacle !== true
      || !collisionObjectActive(object, district)) return;
    object.geometry.computeBoundingBox();
    const geometryBounds = object.geometry.boundingBox;
    if (!geometryBounds || geometryBounds.isEmpty()) return;

    // WALK intentionally uses one conservative broad footprint for instanced
    // obstacle fields. Match that policy here; ordinary authored meshes retain
    // their exact rotated local box instead of an oversized world-aligned box.
    if (object instanceof THREE.InstancedMesh) {
      const districtBounds3 = new THREE.Box3().setFromObject(object, true).applyMatrix4(districtInverse);
      if (districtBounds3.isEmpty()) return;
      obstacles.push({
        object,
        localBounds: districtBounds3,
        districtToObject: new THREE.Matrix4(),
        relativeScale: new THREE.Vector3(1, 1, 1),
        districtBounds: new THREE.Box2(
          new THREE.Vector2(districtBounds3.min.x, districtBounds3.min.z),
          new THREE.Vector2(districtBounds3.max.x, districtBounds3.max.z),
        ),
        tiltedLocalUp: false,
      });
      return;
    }

    const objectToDistrict = relativeMatrix(object, district);
    const relativeScale = new THREE.Vector3();
    objectToDistrict.decompose(new THREE.Vector3(), new THREE.Quaternion(), relativeScale);
    obstacles.push({
      object,
      localBounds: geometryBounds.clone(),
      districtToObject: objectToDistrict.clone().invert(),
      relativeScale,
      districtBounds: districtBoundsForLocalBox(geometryBounds, objectToDistrict),
      tiltedLocalUp: Math.abs(
        new THREE.Vector3().setFromMatrixColumn(objectToDistrict, 1).normalize().y,
      ) < 0.98,
    });
  });
  return obstacles;
}

function segmentIntersectsExpandedBox(
  start: THREE.Vector3,
  end: THREE.Vector3,
  bounds: THREE.Box3,
  expandX: number,
  expandZ: number,
) {
  let minimumT = 0;
  let maximumT = 1;
  for (const axis of ['x', 'z'] as const) {
    const minimum = bounds.min[axis] - (axis === 'x' ? expandX : expandZ);
    const maximum = bounds.max[axis] + (axis === 'x' ? expandX : expandZ);
    const origin = start[axis];
    const delta = end[axis] - origin;
    if (Math.abs(delta) < 0.0000001) {
      if (origin < minimum || origin > maximum) return false;
      continue;
    }
    const first = (minimum - origin) / delta;
    const second = (maximum - origin) / delta;
    const near = Math.min(first, second);
    const far = Math.max(first, second);
    minimumT = Math.max(minimumT, near);
    maximumT = Math.min(maximumT, far);
    if (minimumT > maximumT) return false;
  }
  return maximumT >= 0 && minimumT <= 1;
}

function connectorSegmentBlocked(
  start: THREE.Vector3,
  end: THREE.Vector3,
  clearance: number,
  obstacles: readonly ConnectorObstacle[],
) {
  const minimumX = Math.min(start.x, end.x) - clearance;
  const maximumX = Math.max(start.x, end.x) + clearance;
  const minimumZ = Math.min(start.z, end.z) - clearance;
  const maximumZ = Math.max(start.z, end.z) + clearance;
  for (const obstacle of obstacles) {
    if (!obstacle.tiltedLocalUp
      && (maximumX < obstacle.districtBounds.min.x
        || minimumX > obstacle.districtBounds.max.x
        || maximumZ < obstacle.districtBounds.min.y
        || minimumZ > obstacle.districtBounds.max.y)) continue;
    const localStart = start.clone().applyMatrix4(obstacle.districtToObject);
    const localEnd = end.clone().applyMatrix4(obstacle.districtToObject);
    const scaleX = Math.max(0.001, Math.abs(obstacle.relativeScale.x));
    const scaleZ = Math.max(0.001, Math.abs(obstacle.relativeScale.z));
    if (segmentIntersectsExpandedBox(
      localStart,
      localEnd,
      obstacle.localBounds,
      clearance / scaleX,
      clearance / scaleZ,
    )) return true;
  }
  return false;
}

function connectorPathBlocked(
  points: readonly THREE.Vector3[],
  clearance: number,
  obstacles: readonly ConnectorObstacle[],
) {
  for (let index = 1; index < points.length; index += 1) {
    if (connectorSegmentBlocked(points[index - 1], points[index], clearance, obstacles)) return true;
  }
  return false;
}

function taperedConnectorSegmentBlocked(
  start: THREE.Vector3,
  end: THREE.Vector3,
  startClearance: number,
  endClearance: number,
  obstacles: readonly ConnectorObstacle[],
) {
  const divisions = Math.max(1, Math.ceil(start.distanceTo(end) / CONNECTOR_SAMPLE_STEP));
  for (let index = 0; index < divisions; index += 1) {
    const startT = index / divisions;
    const endT = (index + 1) / divisions;
    if (connectorSegmentBlocked(
      start.clone().lerp(end, startT),
      start.clone().lerp(end, endT),
      Math.max(
        THREE.MathUtils.lerp(startClearance, endClearance, startT),
        THREE.MathUtils.lerp(startClearance, endClearance, endT),
      ),
      obstacles,
    )) return true;
  }
  return false;
}

function taperedConnectorPathBlocked(
  points: readonly THREE.Vector3[],
  startWidth: number,
  endWidth: number,
  extraClearance: number,
  obstacles: readonly ConnectorObstacle[],
) {
  const finalIndex = Math.max(1, points.length - 1);
  for (let index = 1; index < points.length; index += 1) {
    const previousClearance = THREE.MathUtils.lerp(
      startWidth,
      endWidth,
      (index - 1) / finalIndex,
    ) * 0.5 + extraClearance;
    const currentClearance = THREE.MathUtils.lerp(
      startWidth,
      endWidth,
      index / finalIndex,
    ) * 0.5 + extraClearance;
    if (taperedConnectorSegmentBlocked(
      points[index - 1],
      points[index],
      previousClearance,
      currentClearance,
      obstacles,
    )) return true;
  }
  return false;
}

function boundaryAnchorCandidates(
  district: THREE.Group,
  records: readonly RoadRecord[],
  radius: number,
) {
  const candidates: BoundaryAnchor[] = [];
  for (const record of records) {
    if (record.connector || record.roadClass === 'junction') continue;
    for (const point of record.centerline) {
      const world = point.clone().applyMatrix4(district.matrixWorld);
      const pointRadius = Math.hypot(world.x, world.z);
      candidates.push({
        record,
        point: point.clone(),
        world,
        score: Math.abs(pointRadius - radius) + classPenalty(record.roadClass),
      });
    }
  }
  candidates.sort((left, right) => left.score - right.score || left.record.id.localeCompare(right.record.id));
  const unique: BoundaryAnchor[] = [];
  for (const candidate of candidates) {
    if (unique.some((existing) => existing.world.distanceToSquared(candidate.world) < 0.04)) continue;
    unique.push(candidate);
    if (unique.length >= CONNECTOR_DIRECT_ANCHOR_LIMIT) break;
  }
  return unique;
}

function unwrapAngle(angle: number, reference: number) {
  return reference + Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));
}

function candidateGoalAngles(
  anchor: BoundaryAnchor,
  definition: DistrictDefinition,
  radius: number,
  clearance: number,
) {
  const sector = definition.sector!;
  const angularMargin = Math.asin(Math.min(0.45, clearance / Math.max(1, radius)));
  const minimum = sector.startAngle + angularMargin;
  const maximum = sector.endAngle - angularMargin;
  const anchorAngle = THREE.MathUtils.clamp(
    unwrapAngle(Math.atan2(anchor.world.z, anchor.world.x), sector.centerAngle),
    minimum,
    maximum,
  );
  const span = Math.max(0, maximum - minimum);
  const angles: number[] = [];
  const add = (angle: number) => {
    const clamped = THREE.MathUtils.clamp(angle, minimum, maximum);
    if (!angles.some((candidate) => Math.abs(candidate - clamped) < 0.000001)) angles.push(clamped);
  };
  add(anchorAngle);
  for (let step = 1; step <= CONNECTOR_GOAL_ANGLE_STEPS; step += 1) {
    const offset = (step / CONNECTOR_GOAL_ANGLE_STEPS) * span;
    add(anchorAngle - offset);
    add(anchorAngle + offset);
  }
  add(sector.centerAngle);
  return angles;
}

function exactRingPoint(radius: number, angle: number) {
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    ROAD_SURFACE_WORLD_Y,
    Math.sin(angle) * radius,
  );
}

function findDirectConnectorPath(
  district: THREE.Group,
  definition: DistrictDefinition,
  anchors: readonly BoundaryAnchor[],
  radius: number,
  targetWidth: number,
  obstacles: readonly ConnectorObstacle[],
) {
  const districtInverse = district.matrixWorld.clone().invert();
  for (const anchor of anchors) {
    const startWidth = THREE.MathUtils.clamp(anchor.record.width, 0.58, 3.2);
    const startClearance = startWidth * 0.5 + CONNECTOR_EDGE_CLEARANCE;
    const endClearance = targetWidth * 0.5 + CONNECTOR_EDGE_CLEARANCE;
    const clearance = Math.max(startClearance, endClearance);
    const localStart = anchor.world.clone().applyMatrix4(districtInverse);
    for (const angle of candidateGoalAngles(anchor, definition, radius, clearance)) {
      const goal = exactRingPoint(radius, angle);
      const localGoal = goal.clone().applyMatrix4(districtInverse);
      if (taperedConnectorSegmentBlocked(
        localStart,
        localGoal,
        startClearance,
        endClearance,
        obstacles,
      )) continue;
      return {
        anchor,
        worldPoints: [anchor.world.clone(), goal],
        strategy: 'direct-visibility',
        planningClearance: Math.max(startClearance, endClearance),
        detourWaypointCount: 0,
      } satisfies ConnectorPathPlan;
    }
  }
  return null;
}

interface HeapEntry {
  index: number;
  score: number;
  order: number;
}

function pushHeap(heap: HeapEntry[], entry: HeapEntry) {
  heap.push(entry);
  let index = heap.length - 1;
  while (index > 0) {
    const parent = Math.floor((index - 1) * 0.5);
    const parentEntry = heap[parent];
    if (parentEntry.score < entry.score
      || (parentEntry.score === entry.score && parentEntry.order <= entry.order)) break;
    heap[index] = parentEntry;
    index = parent;
  }
  heap[index] = entry;
}

function popHeap(heap: HeapEntry[]) {
  if (!heap.length) return null;
  const first = heap[0];
  const last = heap.pop()!;
  if (!heap.length) return first;
  let index = 0;
  while (true) {
    const left = index * 2 + 1;
    const right = left + 1;
    if (left >= heap.length) break;
    let child = left;
    if (right < heap.length) {
      const leftEntry = heap[left];
      const rightEntry = heap[right];
      if (rightEntry.score < leftEntry.score
        || (rightEntry.score === leftEntry.score && rightEntry.order < leftEntry.order)) child = right;
    }
    const childEntry = heap[child];
    if (childEntry.score > last.score
      || (childEntry.score === last.score && childEntry.order >= last.order)) break;
    heap[index] = childEntry;
    index = child;
  }
  heap[index] = last;
  return first;
}

function findPolarGridPath(
  district: THREE.Group,
  definition: DistrictDefinition,
  anchor: BoundaryAnchor,
  radius: number,
  targetWidth: number,
  obstacles: readonly ConnectorObstacle[],
  smoothingMargin: number,
) {
  const sector = definition.sector!;
  const startWidth = THREE.MathUtils.clamp(anchor.record.width, 0.58, 3.2);
  const startClearance = startWidth * 0.5 + CONNECTOR_EDGE_CLEARANCE + smoothingMargin;
  const targetClearance = targetWidth * 0.5 + CONNECTOR_EDGE_CLEARANCE + smoothingMargin;
  const planningClearance = Math.max(startClearance, targetClearance);
  const angularMargin = Math.asin(
    Math.min(0.45, planningClearance / Math.max(1, Math.min(radius, sector.outerRadius))),
  );
  const angleMinimum = sector.startAngle + angularMargin;
  const angleMaximum = sector.endAngle - angularMargin;
  const radialMinimum = Math.max(planningClearance, sector.innerRadius + planningClearance);
  const radialMaximum = sector.outerRadius - planningClearance;
  if (angleMaximum <= angleMinimum || radialMaximum <= radialMinimum) return null;

  const radialCount = Math.max(2, Math.ceil(
    (radialMaximum - radialMinimum) / CONNECTOR_GRID_RADIAL_STEP,
  ) + 1);
  const middleRadius = (radialMinimum + radialMaximum) * 0.5;
  const angularStep = THREE.MathUtils.clamp(
    CONNECTOR_GRID_RADIAL_STEP / Math.max(1, middleRadius),
    0.0045,
    0.018,
  );
  const angularCount = Math.max(2, Math.ceil((angleMaximum - angleMinimum) / angularStep) + 1);
  const nodeCount = radialCount * angularCount;
  const radialAt = (index: number) => THREE.MathUtils.lerp(
    radialMinimum,
    radialMaximum,
    index / (radialCount - 1),
  );
  const angleAt = (index: number) => THREE.MathUtils.lerp(
    angleMinimum,
    angleMaximum,
    index / (angularCount - 1),
  );
  const anchorRadius = Math.hypot(anchor.world.x, anchor.world.z);
  const clearanceAtRadius = (nodeRadius: number) => {
    const progress = smootherStep(1 - THREE.MathUtils.clamp(
      Math.abs(nodeRadius - radius) / Math.max(0.001, Math.abs(anchorRadius - radius)),
      0,
      1,
    ));
    return THREE.MathUtils.lerp(startWidth, targetWidth, progress) * 0.5
      + CONNECTOR_EDGE_CLEARANCE
      + smoothingMargin;
  };
  const nodeWorldPoint = (index: number) => {
    const radialIndex = Math.floor(index / angularCount);
    const angularIndex = index % angularCount;
    const nodeRadius = radialAt(radialIndex);
    const gradeProgress = smootherStep(1 - THREE.MathUtils.clamp(
      Math.abs(nodeRadius - radius) / Math.max(0.001, Math.abs(anchorRadius - radius)),
      0,
      1,
    ));
    return new THREE.Vector3(
      Math.cos(angleAt(angularIndex)) * nodeRadius,
      THREE.MathUtils.lerp(anchor.world.y, ROAD_SURFACE_WORLD_Y, gradeProgress),
      Math.sin(angleAt(angularIndex)) * nodeRadius,
    );
  };
  const districtInverse = district.matrixWorld.clone().invert();
  const nodeLocalPoint = (index: number) => nodeWorldPoint(index).applyMatrix4(districtInverse);
  const safeMemo = new Int8Array(nodeCount);
  const nodeSafe = (index: number) => {
    if (safeMemo[index] !== 0) return safeMemo[index] > 0;
    const point = nodeLocalPoint(index);
    const radialIndex = Math.floor(index / angularCount);
    const safe = !connectorSegmentBlocked(
      point,
      point,
      clearanceAtRadius(radialAt(radialIndex)),
      obstacles,
    );
    safeMemo[index] = safe ? 1 : -1;
    return safe;
  };

  const costs = new Float64Array(nodeCount);
  costs.fill(Number.POSITIVE_INFINITY);
  const parents = new Int32Array(nodeCount);
  parents.fill(-2);
  const closed = new Uint8Array(nodeCount);
  const heap: HeapEntry[] = [];
  let order = 0;
  const anchorAngle = THREE.MathUtils.clamp(
    unwrapAngle(Math.atan2(anchor.world.z, anchor.world.x), sector.centerAngle),
    angleMinimum,
    angleMaximum,
  );
  const nearestRadial = THREE.MathUtils.clamp(Math.round(
    ((anchorRadius - radialMinimum) / (radialMaximum - radialMinimum)) * (radialCount - 1),
  ), 0, radialCount - 1);
  const nearestAngular = THREE.MathUtils.clamp(Math.round(
    ((anchorAngle - angleMinimum) / (angleMaximum - angleMinimum)) * (angularCount - 1),
  ), 0, angularCount - 1);
  const anchorLocal = anchor.world.clone().applyMatrix4(districtInverse);
  for (let radialOffset = -2; radialOffset <= 2; radialOffset += 1) {
    const radialIndex = nearestRadial + radialOffset;
    if (radialIndex < 0 || radialIndex >= radialCount) continue;
    for (let angularOffset = -2; angularOffset <= 2; angularOffset += 1) {
      const angularIndex = nearestAngular + angularOffset;
      if (angularIndex < 0 || angularIndex >= angularCount) continue;
      const index = radialIndex * angularCount + angularIndex;
      if (!nodeSafe(index)) continue;
      const local = nodeLocalPoint(index);
      if (connectorSegmentBlocked(
        anchorLocal,
        local,
        Math.max(startClearance, clearanceAtRadius(radialAt(radialIndex))),
        obstacles,
      )) continue;
      const cost = anchor.world.distanceTo(nodeWorldPoint(index));
      if (cost >= costs[index]) continue;
      costs[index] = cost;
      parents[index] = -1;
      pushHeap(heap, {
        index,
        score: cost + Math.abs(radialAt(radialIndex) - radius),
        order: order += 1,
      });
    }
  }
  if (!heap.length) return null;

  const targetIsInner = Math.abs(radius - sector.innerRadius) < Math.abs(radius - sector.outerRadius);
  const targetRadialIndex = targetIsInner ? 0 : radialCount - 1;
  const neighbourOffsets = [
    [-1, 0], [0, -1], [0, 1], [1, 0],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ] as const;
  let goalIndex = -1;
  let goalPoint: THREE.Vector3 | null = null;
  while (heap.length) {
    const entry = popHeap(heap)!;
    const current = entry.index;
    if (closed[current]) continue;
    closed[current] = 1;
    const radialIndex = Math.floor(current / angularCount);
    const angularIndex = current % angularCount;
    const currentWorld = nodeWorldPoint(current);
    if (radialIndex === targetRadialIndex) {
      const candidateGoal = exactRingPoint(radius, angleAt(angularIndex));
      const candidateLocal = candidateGoal.clone().applyMatrix4(districtInverse);
      if (!connectorSegmentBlocked(
        currentWorld.clone().applyMatrix4(districtInverse),
        candidateLocal,
        Math.max(clearanceAtRadius(radialAt(radialIndex)), targetClearance),
        obstacles,
      )) {
        goalIndex = current;
        goalPoint = candidateGoal;
        break;
      }
    }
    for (const [radialOffset, angularOffset] of neighbourOffsets) {
      const nextRadial = radialIndex + radialOffset;
      const nextAngular = angularIndex + angularOffset;
      if (nextRadial < 0 || nextRadial >= radialCount
        || nextAngular < 0 || nextAngular >= angularCount) continue;
      const next = nextRadial * angularCount + nextAngular;
      if (closed[next] || !nodeSafe(next)) continue;
      const nextWorld = nodeWorldPoint(next);
      if (connectorSegmentBlocked(
        currentWorld.clone().applyMatrix4(districtInverse),
        nextWorld.clone().applyMatrix4(districtInverse),
        Math.max(clearanceAtRadius(radialAt(radialIndex)), clearanceAtRadius(radialAt(nextRadial))),
        obstacles,
      )) continue;
      const nextCost = costs[current] + currentWorld.distanceTo(nextWorld);
      if (nextCost >= costs[next] - 0.0000001) continue;
      costs[next] = nextCost;
      parents[next] = current;
      pushHeap(heap, {
        index: next,
        score: nextCost + Math.abs(radialAt(nextRadial) - radius),
        order: order += 1,
      });
    }
  }
  if (goalIndex < 0 || !goalPoint) return null;

  const reversed: THREE.Vector3[] = [];
  let cursor = goalIndex;
  while (cursor >= 0) {
    reversed.push(nodeWorldPoint(cursor));
    cursor = parents[cursor];
  }
  reversed.reverse();
  return [anchor.world.clone(), ...reversed, goalPoint];
}

function simplifyConnectorPath(
  district: THREE.Group,
  points: readonly THREE.Vector3[],
  targetRadius: number,
  startWidth: number,
  targetWidth: number,
  extraClearance: number,
  obstacles: readonly ConnectorObstacle[],
) {
  if (points.length <= 2) return points.map((point) => point.clone());
  const districtInverse = district.matrixWorld.clone().invert();
  const local = points.map((point) => point.clone().applyMatrix4(districtInverse));
  const anchorRadius = Math.hypot(points[0].x, points[0].z);
  const clearanceAt = (point: THREE.Vector3) => {
    const progress = smootherStep(1 - THREE.MathUtils.clamp(
      Math.abs(Math.hypot(point.x, point.z) - targetRadius)
        / Math.max(0.001, Math.abs(anchorRadius - targetRadius)),
      0,
      1,
    ));
    return THREE.MathUtils.lerp(startWidth, targetWidth, progress) * 0.5 + extraClearance;
  };
  const simplified = [points[0].clone()];
  let index = 0;
  while (index < points.length - 1) {
    let next = points.length - 1;
    while (next > index + 1
      && connectorSegmentBlocked(
        local[index],
        local[next],
        Math.max(clearanceAt(points[index]), clearanceAt(points[next])),
        obstacles,
      )) next -= 1;
    simplified.push(points[next].clone());
    index = next;
  }
  return simplified;
}

function roundedConnectorPath(points: readonly THREE.Vector3[]) {
  if (points.length <= 2) return points.map((point) => point.clone());
  const result = [points[0].clone()];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const incomingLength = previous.distanceTo(current);
    const outgoingLength = current.distanceTo(next);
    const rounding = Math.min(
      metresToWorldUnits(8),
      incomingLength * 0.28,
      outgoingLength * 0.28,
    );
    if (rounding < 0.03) {
      result.push(current.clone());
      continue;
    }
    const entry = current.clone().lerp(previous, rounding / incomingLength);
    const exit = current.clone().lerp(next, rounding / outgoingLength);
    result.push(entry);
    for (let step = 1; step <= 5; step += 1) {
      const t = step / 5;
      const oneMinusT = 1 - t;
      result.push(new THREE.Vector3(
        oneMinusT * oneMinusT * entry.x + 2 * oneMinusT * t * current.x + t * t * exit.x,
        0,
        oneMinusT * oneMinusT * entry.z + 2 * oneMinusT * t * current.z + t * t * exit.z,
      ));
    }
  }
  result.push(points[points.length - 1].clone());
  return result;
}

function sampleAndGradeConnectorPath(
  points: readonly THREE.Vector3[],
  startY: number,
) {
  const planarLength = points.slice(1).reduce((length, point, index) => (
    length + Math.hypot(point.x - points[index].x, point.z - points[index].z)
  ), 0);
  const stepLength = Math.min(
    CONNECTOR_SAMPLE_STEP,
    Math.max(0.08, planarLength / 13),
  );
  const sampled = [points[0].clone()];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const segmentLength = Math.hypot(current.x - previous.x, current.z - previous.z);
    const divisions = Math.max(1, Math.ceil(segmentLength / stepLength));
    for (let step = 1; step <= divisions; step += 1) {
      sampled.push(previous.clone().lerp(current, step / divisions));
    }
  }
  const cumulative = [0];
  for (let index = 1; index < sampled.length; index += 1) {
    cumulative.push(cumulative[index - 1] + Math.hypot(
      sampled[index].x - sampled[index - 1].x,
      sampled[index].z - sampled[index - 1].z,
    ));
  }
  const total = cumulative[cumulative.length - 1] || 1;
  sampled.forEach((point, index) => {
    point.y = THREE.MathUtils.lerp(startY, ROAD_SURFACE_WORLD_Y, smootherStep(cumulative[index] / total));
  });
  sampled[0].y = startY;
  sampled[sampled.length - 1].y = ROAD_SURFACE_WORLD_Y;
  return sampled;
}

function findObstacleAwareConnectorPath(
  district: THREE.Group,
  definition: DistrictDefinition,
  records: readonly RoadRecord[],
  radius: number,
  targetWidth: number,
  obstacles: readonly ConnectorObstacle[],
) {
  const anchors = boundaryAnchorCandidates(district, records, radius);
  const direct = findDirectConnectorPath(
    district,
    definition,
    anchors,
    radius,
    targetWidth,
    obstacles,
  );
  if (direct) return direct;

  const districtInverse = district.matrixWorld.clone().invert();
  for (const smoothingMargin of [
    CONNECTOR_SMOOTHING_MARGIN,
    CONNECTOR_SMOOTHING_MARGIN * 0.5,
    0,
  ]) {
    for (const anchor of anchors.slice(0, CONNECTOR_GRID_ANCHOR_LIMIT)) {
      const startWidth = THREE.MathUtils.clamp(anchor.record.width, 0.58, 3.2);
      const raw = findPolarGridPath(
        district,
        definition,
        anchor,
        radius,
        targetWidth,
        obstacles,
        smoothingMargin,
      );
      if (!raw) continue;
      const planningClearance = Math.max(startWidth, targetWidth) * 0.5
        + CONNECTOR_EDGE_CLEARANCE
        + smoothingMargin;
      const simplified = simplifyConnectorPath(
        district,
        raw,
        radius,
        startWidth,
        targetWidth,
        CONNECTOR_EDGE_CLEARANCE + smoothingMargin,
        obstacles,
      );
      const candidates = [roundedConnectorPath(simplified), simplified, raw];
      for (const candidate of candidates) {
        const graded = sampleAndGradeConnectorPath(candidate, anchor.world.y);
        const local = graded.map((point) => point.clone().applyMatrix4(districtInverse));
        if (taperedConnectorPathBlocked(
          local,
          startWidth,
          targetWidth,
          CONNECTOR_EDGE_CLEARANCE,
          obstacles,
        )) continue;
        return {
          anchor,
          worldPoints: graded,
          strategy: 'polar-grid-detour',
          planningClearance,
          detourWaypointCount: Math.max(0, simplified.length - 2),
        } satisfies ConnectorPathPlan;
      }
    }
  }
  return null;
}

function createRingConnector(
  district: THREE.Group,
  definition: DistrictDefinition,
  records: RoadRecord[],
  radius: number,
  claimedIds: Set<string>,
  obstacles: readonly ConnectorObstacle[],
) {
  const targetWidth = ringRoadWidth(radius);
  const plan = findObstacleAwareConnectorPath(
    district,
    definition,
    records,
    radius,
    targetWidth,
    obstacles,
  );
  if (!plan) return null;
  const { anchor } = plan;
  const startWidth = THREE.MathUtils.clamp(anchor.record.width, 0.58, 3.2);
  const districtInverse = district.matrixWorld.clone().invert();
  const gradedWorldPoints = plan.strategy === 'direct-visibility'
    ? sampleAndGradeConnectorPath(plan.worldPoints, anchor.world.y)
    : plan.worldPoints;
  const centerline = gradedWorldPoints.map((point) => point.clone().applyMatrix4(districtInverse));
  centerline[0].copy(anchor.point);
  centerline[centerline.length - 1].copy(
    gradedWorldPoints[gradedWorldPoints.length - 1].clone().applyMatrix4(districtInverse),
  );
  const idBase = `${definition.id}__${ringId(radius).toLowerCase()}-connector`;
  let id = idBase;
  let suffix = 2;
  while (claimedIds.has(id)) {
    id = `${idBase}-${suffix}`;
    suffix += 1;
  }
  claimedIds.add(id);
  const material = materialFor(anchor.record.mesh);
  const mesh = new THREE.Mesh(ribbonGeometry(centerline, startWidth, targetWidth), material);
  mesh.name = `${definition.id.toUpperCase()}__${ringId(radius)}__GRADED_CONNECTOR`;
  mesh.receiveShadow = true;
  mesh.userData.walkable = true;
  const endpointKinds: EndpointKinds = ['internal-network', `ring-delimiter:${ringId(radius)}`];
  assignRoadMetadata(
    mesh,
    definition,
    id,
    'delimiter-connector',
    centerline,
    (startWidth + targetWidth) * 0.5,
    endpointKinds,
    true,
  );
  mesh.userData.districtTransition = true;
  mesh.userData.connectedRingId = ringId(radius);
  mesh.userData.connectedRingRadius = radius;
  mesh.userData.gradedConnector = true;
  mesh.userData.gradeProfile = 'smootherstep';
  mesh.userData.obstacleAwareConnector = true;
  mesh.userData.connectorPlanningStrategy = plan.strategy;
  mesh.userData.connectorPlanningClearance = Number(plan.planningClearance.toFixed(4));
  mesh.userData.connectorDetourWaypointCount = plan.detourWaypointCount;
  mesh.userData.connectorObstacleCount = obstacles.length;
  mesh.userData.startElevation = centerline[0].y;
  mesh.userData.endElevation = centerline[centerline.length - 1].y;
  mesh.userData.widthStart = startWidth;
  mesh.userData.widthEnd = targetWidth;
  const parent = generatedRoadGroup(district, definition);
  parent.add(mesh);
  createJunctionCap(
    parent,
    definition,
    centerline[0],
    Math.max(0.42, startWidth * 0.58),
    material,
    `${id}__internal`,
    'internal-network-junction',
  );
  createJunctionCap(
    parent,
    definition,
    centerline[centerline.length - 1],
    Math.max(0.62, targetWidth * 0.58),
    material,
    `${id}__ring`,
    `ring-delimiter:${ringId(radius)}`,
  );
  return {
    mesh,
    id,
    roadClass: 'delimiter-connector',
    centerline,
    width: (startWidth + targetWidth) * 0.5,
    endpointKinds,
    generated: true,
    connector: true,
    ringId: ringId(radius),
    planningStrategy: plan.strategy,
    planningClearance: plan.planningClearance,
    detourWaypointCount: plan.detourWaypointCount,
  } satisfies RoadRecord;
}

function routeSummary(record: RoadRecord): DistrictRoadRouteSummary {
  return {
    id: record.id,
    roadId: record.id,
    name: record.mesh.name,
    roadClass: record.roadClass,
    width: Number(record.width.toFixed(4)),
    length: Number(centerlineLength(record.centerline).toFixed(3)),
    pointCount: record.centerline.length,
    centerline: compactCenterline(record.centerline, MAX_SUMMARY_CENTERLINE_POINTS),
    centerlineSpace: 'district-local',
    endpointKinds: [...record.endpointKinds],
    generated: record.generated,
    connector: record.connector,
    ...(record.ringId ? { ringId: record.ringId } : {}),
    ...(record.planningStrategy ? { planningStrategy: record.planningStrategy } : {}),
    ...(record.planningClearance !== undefined
      ? { planningClearance: Number(record.planningClearance.toFixed(4)) }
      : {}),
    ...(record.detourWaypointCount !== undefined
      ? { detourWaypointCount: record.detourWaypointCount }
      : {}),
  };
}

function removeGeneratedRoadNetwork(district: THREE.Group) {
  let generated = district.getObjectByName(GENERATED_NETWORK_GROUP_NAME);
  while (generated) {
    generated.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    generated.removeFromParent();
    generated = district.getObjectByName(GENERATED_NETWORK_GROUP_NAME);
  }
  delete district.userData.districtRoadNetwork;
}

/**
 * Normalizes every authored district road into one serializable route model,
 * then adds only the missing collector and delimiter connections. Authored
 * road meshes, names, materials, and building approaches remain untouched.
 */
export function finalizeDistrictRoadNetwork(
  district: THREE.Group,
  definition: DistrictDefinition,
  options: FinalizeDistrictRoadNetworkOptions = {},
) {
  if (!definition.sector) return;
  if (!options.force && district.userData.districtRoadNetwork?.version === NETWORK_VERSION) return;
  if (options.force) removeGeneratedRoadNetwork(district);
  district.updateMatrixWorld(true);
  const claimedIds = new Set<string>();
  const records = discoverRoads(district, definition, claimedIds);
  const collector = createGenericCollector(district, definition, records, claimedIds);
  if (collector) records.push(collector);
  district.updateMatrixWorld(true);
  const connectorObstacles = collectConnectorObstacles(district);

  const exceptionReason = EXISTING_NETWORK_EXCEPTIONS.get(definition.id);
  const connectedRingIds: string[] = [];
  if (exceptionReason) {
    const existingRadius = matchingRoadRadius(definition.sector.innerRadius)
      ?? matchingRoadRadius(definition.sector.outerRadius);
    if (existingRadius !== undefined) connectedRingIds.push(ringId(existingRadius));
  } else {
    eligibleRingBoundaries(definition).forEach((radius) => {
      district.updateMatrixWorld(true);
      const connector = createRingConnector(
        district,
        definition,
        records,
        radius,
        claimedIds,
        connectorObstacles,
      );
      if (!connector) return;
      records.push(connector);
      connectedRingIds.push(connector.ringId!);
    });
  }

  const connectorCount = records.filter((record) => record.connector).length;
  const sharedCell = {
    index: definition.sector.sharedCellIndex,
    count: definition.sector.sharedCellCount,
    connectionMode: definition.sector.sharedCellCount > 1
      ? 'shared-ring-backbone'
      : 'independent-cell',
    backboneRingIds: connectedRingIds,
  };
  district.userData.districtRoadNetwork = {
    version: NETWORK_VERSION,
    districtId: definition.id,
    centerlineSpace: 'district-local',
    routeCount: records.length,
    connectorCount,
    ringConnectorCount: records.filter((record) => record.connector && record.ringId).length,
    genericCollectorLoop: collector !== null,
    genericCollectorRoadId: collector?.id ?? null,
    connectedRingIds,
    sharedCell,
    sharedCellBackbone: definition.sector.sharedCellCount > 1,
    existingNetworkException: Boolean(exceptionReason),
    connectorException: Boolean(exceptionReason),
    exceptionReason: exceptionReason ?? null,
    roadSurfaceWorldY: ROAD_SURFACE_WORLD_Y,
    connectorObstacleCount: connectorObstacles.length,
    obstacleAwareConnectorCount: records.filter((record) => (
      record.connector && record.planningStrategy !== undefined
    )).length,
    detouredConnectorCount: records.filter((record) => (
      record.connector && record.planningStrategy === 'polar-grid-detour'
    )).length,
    routes: records.map(routeSummary),
  };
}
