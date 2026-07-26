import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';
import { metresToWorldUnits, WALK_RADIUS } from '../config/island';
import { getCyberCityBridgeAlignment } from './environment';
import { buildWelcomeRegistrationInterior } from './welcomeRegistrationInterior';

const FLOOR_Y = metresToWorldUnits(0.08);
const DEG = Math.PI / 180;

type Materials = ReturnType<typeof createMaterials>;
type Orientation = 'tangent' | 'radial';

export interface EntryLogisticsBuildingProgramRecord {
  code: string;
  districtId: 'entry-commercial' | 'logistics';
  name: string;
  footprint: readonly [number, number];
  height: number;
  description: string;
}

export const ENTRY_LOGISTICS_BUILDING_PROGRAM: readonly EntryLogisticsBuildingProgramRecord[] = [
  { code: 'E1', districtId: 'entry-commercial', name: 'Bridgehead Tunnel and Island Gate', footprint: [10, 19], height: 4, description: 'The bridge arrival portal and first public threshold into the island.' },
  { code: 'E2', districtId: 'entry-commercial', name: 'Welcome and Registration Hall', footprint: [24, 20], height: 8, description: 'The main visitor reception, registration, and orientation hall.' },
  { code: 'E3', districtId: 'entry-commercial', name: 'Meridian Transit Pavilion', footprint: [20, 12], height: 6, description: 'A public interchange connecting the arrival district to island transit.' },
  { code: 'E4', districtId: 'entry-commercial', name: 'Clearline Glassfront Cafe', footprint: [14, 10], height: 4, description: 'A transparent cafe and terrace on the pedestrian commercial street.' },
  { code: 'E5', districtId: 'entry-commercial', name: 'Ringwalk Galleria Mall', footprint: [36, 16], height: 8, description: 'The district shopping gallery and inner-ring retail anchor.' },
  { code: 'E6', districtId: 'entry-commercial', name: 'The Catwalk Fashion Runway Club', footprint: [27, 15], height: 7, description: 'A fashion venue and evening club facing the entertainment walk.' },
  { code: 'E7', districtId: 'entry-commercial', name: 'Old Circuit Arcade', footprint: [22, 17], height: 7, description: 'A retro entertainment hall in the central evening quarter.' },
  { code: 'E8', districtId: 'entry-commercial', name: 'Bridgeview Arrival Hotel', footprint: [40, 18], height: 10, description: 'The principal visitor hotel overlooking the bridge arrival.' },
  { code: 'E9', districtId: 'entry-commercial', name: 'Dock Market Hall', footprint: [32, 18], height: 8, description: 'A covered market joining the retail street to the eastern quay.' },
  { code: 'E10', districtId: 'entry-commercial', name: 'Island Showcase Pavilion', footprint: [18, 13], height: 5, description: 'A civic exhibition pavilion between registration and transit.' },
  { code: 'E11', districtId: 'entry-commercial', name: 'Beacon Picture House', footprint: [28, 17], height: 8, description: 'A cinema and cultural venue on the pedestrian crescent.' },
  { code: 'E12', districtId: 'entry-commercial', name: 'East Quay Water-Taxi Pavilion', footprint: [20, 10], height: 5, description: 'The waterside passenger pavilion and eastern public transport stop.' },
  { code: 'E13', districtId: 'entry-commercial', name: 'Cityline Orientation Tower', footprint: [7, 7], height: 18, description: 'A compact orientation beacon marking the public quay skyline.' },
  { code: 'L1', districtId: 'logistics', name: 'Skydeck Parking House', footprint: [30, 17], height: 10, description: 'Structured parking at the controlled landside entrance.' },
  { code: 'L2', districtId: 'logistics', name: 'Northfield Airport Terminal', footprint: [40, 16], height: 10, description: 'The compact passenger and operations terminal serving the short runway.' },
  { code: 'L3', districtId: 'logistics', name: 'Airfield Operations and Control Tower', footprint: [8, 8], height: 21, description: 'The airfield control and operations landmark overlooking the apron.' },
  { code: 'L4', districtId: 'logistics', name: 'Aircraft Maintenance Hangar One', footprint: [58, 30], height: 15, description: 'The primary aircraft maintenance hangar at the airside edge.' },
  { code: 'L5', districtId: 'logistics', name: 'Cargo Inspection and Transfer Depot', footprint: [56, 20], height: 8, description: 'A secure cross-dock for cargo inspection and transfer.' },
  { code: 'L6', districtId: 'logistics', name: 'Cold-Chain Distribution Center', footprint: [47, 21], height: 9, description: 'Temperature-controlled storage on the freight service spine.' },
  { code: 'L7', districtId: 'logistics', name: 'Ground Fleet Maintenance Depot', footprint: [35, 25], height: 8, description: 'Maintenance, charging, and washing for the island ground fleet.' },
] as const;

const ENTRY_BUILDINGS = ENTRY_LOGISTICS_BUILDING_PROGRAM.filter((record) => record.districtId === 'entry-commercial').map((record) => record.name);
const LOGISTICS_BUILDINGS = ENTRY_LOGISTICS_BUILDING_PROGRAM.filter((record) => record.districtId === 'logistics').map((record) => record.name);
type RoadMaterials = Pick<
  Materials,
  'asphalt' | 'paving' | 'paleStone' | 'whitePaint' | 'yellowPaint' | 'logisticsConcrete' | 'darkConcrete'
>;
const roadMaterials = new WeakMap<THREE.Group, RoadMaterials>();
const EDITABLE_ROAD_NETWORK_NAME = 'ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK';
const E1_CITY_PORTAL_Z = -6.55;
const E1_CITY_ROUTE_START_Z = -9.5;
const E1_ISLAND_PORTAL_Z = 17.35;
const E1_ISLAND_ROUTE_START_Z = 19.5;
const INNER_RETAIL_COLLECTOR_RADIUS = 318;
const WELCOME_BUILDING_RADIUS = 350;
const WELCOME_FORK_RADIUS = 366;
const WELCOME_FORK_ANGLE = 300;
const ROAD_SURFACE_TOP = metresToWorldUnits(0.34);
const WELCOME_ENTRY_BRANCH_SURFACE_OFFSET = metresToWorldUnits(0.01);
const WELCOME_LOGISTICS_BRANCH_SURFACE_OFFSET = metresToWorldUnits(0.04);
const WELCOME_APRON_SURFACE_OFFSET = metresToWorldUnits(0.03);
const WELCOME_JUNCTION_SURFACE_OFFSET = metresToWorldUnits(0.046);
const ROAD_MARKING_LIFT = metresToWorldUnits(0.005);
const FACILITY_VERTICAL_SCALE = 0.46;
export const ENTRY_LOGISTICS_LAYOUT_REVISION = 5;
export const WELCOME_POOL_SELECTABLE_ID = 'entry-logistics-landscape-welcome-pool';
export const WELCOME_POOL_GROUP_NAME = 'ENTRY__WELCOME_HALF_COVERED_POOL_EDITABLE';

export function entryLogisticsBuildingSelectableId(code: string) {
  return `entry-logistics-building-${code.toLowerCase()}`;
}

function material(
  color: THREE.ColorRepresentation,
  options: THREE.MeshStandardMaterialParameters = {},
) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.68, metalness: 0.16, ...options });
}

function createMaterials() {
  return {
    paleStone: material('#d7d0bf', { roughness: 0.82, metalness: 0.03 }),
    warmStone: material('#b8aa91', { roughness: 0.86, metalness: 0.02 }),
    basalt: material('#252a2c', { roughness: 0.84, metalness: 0.08 }),
    brushedMetal: material('#aeb7b8', { roughness: 0.32, metalness: 0.82 }),
    bronze: material('#8b6542', { roughness: 0.38, metalness: 0.72 }),
    darkBronze: material('#322a28', { roughness: 0.42, metalness: 0.76 }),
    whiteMetal: material('#e3e5df', { roughness: 0.38, metalness: 0.48 }),
    blackSteel: material('#151b1e', { roughness: 0.5, metalness: 0.78 }),
    brick: material('#6f352c', { roughness: 0.88, metalness: 0.02 }),
    creamCeramic: material('#d8ccb4', { roughness: 0.5, metalness: 0.02 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#8fbac2', roughness: 0.12, metalness: 0.08, transparent: true,
      opacity: 0.62, transmission: 0.24, side: THREE.DoubleSide,
    }),
    darkGlass: material('#14252d', { roughness: 0.18, metalness: 0.44 }),
    logisticsConcrete: material('#656d70', { roughness: 0.84, metalness: 0.08 }),
    darkConcrete: material('#383f42', { roughness: 0.88, metalness: 0.06 }),
    galvanized: material('#778286', { roughness: 0.54, metalness: 0.7 }),
    silverPanel: material('#b8c1c2', { roughness: 0.44, metalness: 0.56 }),
    charcoalPanel: material('#30383c', { roughness: 0.7, metalness: 0.34 }),
    paving: material('#8a8982', { roughness: 0.96, metalness: 0.01 }),
    darkPaving: material('#44494a', { roughness: 0.94, metalness: 0.04 }),
    asphalt: material('#252b2e', { roughness: 0.96, metalness: 0.02 }),
    runway: material('#30373a', { roughness: 0.94, metalness: 0.03 }),
    grass: material('#55643f', { roughness: 0.98, metalness: 0 }),
    shrub: material('#293d2d', { roughness: 0.98, metalness: 0 }),
    water: new THREE.MeshPhysicalMaterial({
      color: '#315b67', roughness: 0.12, metalness: 0.2, transparent: true,
      opacity: 0.76, clearcoat: 0.9, side: THREE.DoubleSide,
    }),
    securityGlass: new THREE.MeshPhysicalMaterial({
      color: '#8bb8bc', roughness: 0.2, metalness: 0.12, transparent: true,
      opacity: 0.38, transmission: 0.18, side: THREE.DoubleSide,
    }),
    warmLight: material('#f4c27a', { emissive: '#f0a94c', emissiveIntensity: 2.8, roughness: 0.26 }),
    coolLight: material('#bde6ee', { emissive: '#8fdbea', emissiveIntensity: 3.1, roughness: 0.22 }),
    amberLight: material('#dc8e30', { emissive: '#ff9d31', emissiveIntensity: 3.8, roughness: 0.22 }),
    redLight: material('#9b211d', { emissive: '#ff3a2e', emissiveIntensity: 4.2, roughness: 0.2 }),
    whitePaint: material('#e2e1d6', { roughness: 0.76, metalness: 0.02 }),
    yellowPaint: material('#d1a833', { roughness: 0.78, metalness: 0.02 }),
  };
}

function addBox(
  parent: THREE.Object3D,
  name: string,
  size: readonly [number, number, number],
  mat: THREE.Material,
  position: readonly [number, number, number],
  options: { obstacle?: boolean; walkable?: boolean; castShadow?: boolean } = {},
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.name = name;
  mesh.position.set(position[0], position[1] + size[1] * 0.5, position[2]);
  mesh.castShadow = options.castShadow !== false;
  mesh.receiveShadow = true;
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
  segments = 24,
  obstacle = true,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), mat);
  mesh.name = name;
  mesh.position.set(position[0], position[1] + height * 0.5, position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (obstacle) mesh.userData.navObstacle = true;
  parent.add(mesh);
  return mesh;
}

function addPlane(
  parent: THREE.Object3D,
  name: string,
  width: number,
  depth: number,
  mat: THREE.Material,
  position: readonly [number, number, number],
  rotationY = 0,
  walkable = true,
) {
  const mesh = addBox(parent, name, [width, 0.025, depth], mat, position, { obstacle: false, walkable, castShadow: false });
  mesh.rotation.y = rotationY;
  return mesh;
}

type RoadKind =
  | 'public-vehicle'
  | 'public-white'
  | 'pedestrian'
  | 'promenade'
  | 'freight'
  | 'logistics-landside'
  | 'service-yard'
  | 'airside'
  | 'logistics-platform'
  | 'district-link';
type RoadEndpointType = 'building-threshold' | 'building-route-start' | 'street-junction' | 'bridge-approach';
type RoadPoint = {
  id: string;
  position: THREE.Vector3;
  endpointType: RoadEndpointType;
  buildingCode?: string;
};
type RoadRoute = {
  id: string;
  name: string;
  kind: RoadKind;
  points: readonly RoadPoint[];
  surfaceOffset?: number;
  underBuildingPodium?: boolean;
  widthStart?: number;
  widthEnd?: number;
  logisticsPlatform?: boolean;
  districtTransition?: boolean;
};
type DoorAccess = {
  threshold: RoadPoint;
  routeStart: RoadPoint;
  cityThreshold?: RoadPoint;
  cityRouteStart?: RoadPoint;
  entries?: readonly LogisticsEntranceAccess[];
};

type EntryInteriorLayout = {
  width: number;
  depth: number;
  height: number;
  doorwayWidth: number;
  label: string;
};

type LogisticsDoorSide = 'front' | 'rear' | 'west' | 'east';
type LogisticsDoorSpecification = {
  id: string;
  side: LogisticsDoorSide;
  offset: number;
  width: number;
  role: 'landside' | 'airside' | 'freight' | 'staff';
};
type LogisticsInteriorLayout = {
  width: number;
  depth: number;
  height: number;
  label: string;
  doors: readonly LogisticsDoorSpecification[];
};
type LogisticsEntranceAccess = {
  id: string;
  side: LogisticsDoorSide;
  role: LogisticsDoorSpecification['role'];
  threshold: RoadPoint;
  routeStart: RoadPoint;
  width: number;
};

const ENTRY_INTERIOR_LAYOUTS: Readonly<Record<string, EntryInteriorLayout>> = {
  E2: { width: 13.0, depth: 8.4, height: 4.2, doorwayWidth: 4.5, label: 'Welcome and registration hall' },
  E3: { width: 17.0, depth: 3.5, height: 2.4, doorwayWidth: 3.2, label: 'Transit concourse' },
  E4: { width: 7.6, depth: 4.2, height: 2.5, doorwayWidth: 2.4, label: 'Cafe pavilion' },
  E5: { width: 24.0, depth: 8.6, height: 4.8, doorwayWidth: 3.4, label: 'Galleria concourse' },
  E6: { width: 12.4, depth: 4.5, height: 4.2, doorwayWidth: 2.8, label: 'Runway club foyer' },
  E7: { width: 10.4, depth: 6.3, height: 3.8, doorwayWidth: 2.8, label: 'Arcade hall' },
  E8: { width: 22.0, depth: 7.2, height: 5.4, doorwayWidth: 3.5, label: 'Hotel arrival lobby' },
  E9: { width: 17.2, depth: 8.6, height: 3.2, doorwayWidth: 3.2, label: 'Covered market hall' },
  E10: { width: 10.5, depth: 10.5, height: 2.8, doorwayWidth: 3.0, label: 'Showcase gallery' },
  E11: { width: 9.8, depth: 6.2, height: 3.8, doorwayWidth: 2.8, label: 'Picture house foyer' },
  E12: { width: 15.5, depth: 3.5, height: 2.3, doorwayWidth: 3.2, label: 'Water-taxi waiting room' },
  E13: { width: 4.6, depth: 4.2, height: 3.1, doorwayWidth: 2.0, label: 'Orientation tower lobby' },
};

const LOGISTICS_INTERIOR_LAYOUTS: Readonly<Record<string, LogisticsInteriorLayout>> = {
  L1: {
    width: 21.0, depth: 10.2, height: 5.2, label: 'parking access concourse',
    doors: [
      { id: 'south-lobby', side: 'front', offset: 0, width: 3.4, role: 'landside' },
      { id: 'north-stair', side: 'rear', offset: -7.2, width: 2.4, role: 'staff' },
    ],
  },
  L2: {
    width: 26.4, depth: 8.8, height: 5.6, label: 'northfield terminal hall',
    doors: [
      { id: 'landside-arrivals', side: 'front', offset: 0, width: 4.4, role: 'landside' },
      { id: 'airside-gates', side: 'rear', offset: -5.4, width: 4.2, role: 'airside' },
      { id: 'east-staff', side: 'east', offset: 0.4, width: 2.4, role: 'staff' },
    ],
  },
  L3: {
    width: 9.6, depth: 7.4, height: 5.2, label: 'airfield operations room',
    doors: [
      { id: 'operations-front', side: 'front', offset: 0, width: 2.4, role: 'landside' },
      { id: 'airside-rear', side: 'rear', offset: 1.8, width: 2.2, role: 'airside' },
      { id: 'west-service', side: 'west', offset: -0.8, width: 2.0, role: 'staff' },
    ],
  },
  L4: {
    width: 33.0, depth: 18.5, height: 8.5, label: 'hangar maintenance floor',
    doors: [
      { id: 'service-reception', side: 'front', offset: 0, width: 4.0, role: 'freight' },
      { id: 'aircraft-door', side: 'rear', offset: 0, width: 13.5, role: 'airside' },
      { id: 'east-personnel', side: 'east', offset: -4.2, width: 2.5, role: 'staff' },
    ],
  },
  L5: {
    width: 29.6, depth: 10.6, height: 6.2, label: 'cargo inspection hall',
    doors: [
      { id: 'inspection-entry', side: 'front', offset: 10.5, width: 3.2, role: 'freight' },
      { id: 'north-cross-dock', side: 'rear', offset: -7.2, width: 3.2, role: 'freight' },
      { id: 'west-staff', side: 'west', offset: 0.4, width: 2.4, role: 'staff' },
    ],
  },
  L6: {
    width: 23.2, depth: 14.7, height: 6.2, label: 'cold-chain transfer hall',
    doors: [
      { id: 'south-dock', side: 'front', offset: 0, width: 3.2, role: 'freight' },
      { id: 'north-dock', side: 'rear', offset: 6.0, width: 3.2, role: 'freight' },
      { id: 'west-staff', side: 'west', offset: -1.2, width: 2.4, role: 'staff' },
    ],
  },
  L7: {
    width: 28.2, depth: 13.5, height: 6.2, label: 'ground fleet workshop',
    doors: [
      { id: 'workshop-front', side: 'front', offset: 1.8, width: 4.2, role: 'freight' },
      { id: 'rear-yard', side: 'rear', offset: -7.4, width: 3.2, role: 'freight' },
      { id: 'west-personnel', side: 'west', offset: -1.2, width: 2.4, role: 'staff' },
    ],
  },
};

const DOOR_ACCESS_LOCAL: Readonly<Record<string, {
  threshold: readonly [number, number];
  routeStart: readonly [number, number];
}>> = {
  E1: { threshold: [0, E1_ISLAND_PORTAL_Z], routeStart: [0, E1_ISLAND_ROUTE_START_Z] },
  E2: { threshold: [0, 4.1], routeStart: [0, 6.6] },
  E3: { threshold: [0, 2.0], routeStart: [0, 4.0] },
  E4: { threshold: [2.1, 2.45], routeStart: [2.1, 8.2] },
  E5: { threshold: [0, 5.3], routeStart: [0, 7.2] },
  E6: { threshold: [0, 2.7], routeStart: [0, 24.2] },
  E7: { threshold: [0, 3.7], routeStart: [0, 5.4] },
  E8: { threshold: [0, 4.9], routeStart: [0, 8.4] },
  E9: { threshold: [0, 4.9], routeStart: [0, 6.5] },
  E10: { threshold: [0, 6.85], routeStart: [0, 8.0] },
  E11: { threshold: [0, 3.7], routeStart: [0, 6.4] },
  E12: { threshold: [0, 2.2], routeStart: [0, 20.4] },
  E13: { threshold: [0, 3.55], routeStart: [0, 4.4] },
  L1: { threshold: [0, 6.0], routeStart: [0, 7.0] },
  L2: { threshold: [0, 4.8], routeStart: [0, 7.8] },
  L3: { threshold: [0, 4.15], routeStart: [0, 5.1] },
  L4: { threshold: [0, 10.2], routeStart: [0, 11.5] },
  L5: { threshold: [10.5, 6.1], routeStart: [10.5, 19.2] },
  L6: { threshold: [0, 8.65], routeStart: [0, 9.8] },
  L7: { threshold: [1.8, 7.1], routeStart: [1.8, 16.7] },
};

function roadPoint(
  id: string,
  position: THREE.Vector3,
  endpointType: RoadEndpointType,
  buildingCode?: string,
): RoadPoint {
  position.y = FLOOR_Y;
  return { id, position, endpointType, buildingCode };
}

function facilityPoint(
  districtGroup: THREE.Group,
  facility: THREE.Group,
  code: string,
  suffix: string,
  coordinates: readonly [number, number],
  endpointType: 'building-threshold' | 'building-route-start',
) {
  const world = facility.localToWorld(new THREE.Vector3(coordinates[0], FLOOR_Y, coordinates[1]));
  return roadPoint(`${code.toLowerCase()}-${suffix}`, districtGroup.worldToLocal(world), endpointType, code);
}

function logisticsDoorLocalPoints(
  code: string,
  layout: LogisticsInteriorLayout,
  door: LogisticsDoorSpecification,
) {
  const primary = DOOR_ACCESS_LOCAL[code];
  const roomFrontZ = primary.threshold[1] - 0.08;
  const roomBackZ = roomFrontZ - layout.depth;
  const halfWidth = layout.width * 0.5;
  const apronDepth = door.role === 'airside' || door.role === 'freight' ? 2.8 : 1.8;
  switch (door.side) {
    case 'front':
      return {
        threshold: [door.offset, roomFrontZ + 0.08] as const,
        routeStart: door.id === layout.doors[0].id
          ? primary.routeStart
          : [door.offset, roomFrontZ + apronDepth] as const,
      };
    case 'rear':
      return {
        threshold: [door.offset, roomBackZ - 0.08] as const,
        routeStart: [door.offset, roomBackZ - apronDepth] as const,
      };
    case 'west':
      return {
        threshold: [-halfWidth - 0.08, door.offset] as const,
        routeStart: [-halfWidth - apronDepth, door.offset] as const,
      };
    case 'east':
      return {
        threshold: [halfWidth + 0.08, door.offset] as const,
        routeStart: [halfWidth + apronDepth, door.offset] as const,
      };
  }
}

function facilityDoorAccess(districtGroup: THREE.Group, facility: THREE.Group): DoorAccess {
  const code = String(facility.userData.buildingCode ?? '');
  const specification = DOOR_ACCESS_LOCAL[code];
  if (!specification) throw new Error(`Missing exact door access specification for ${code}`);
  const threshold = facilityPoint(districtGroup, facility, code, 'door', specification.threshold, 'building-threshold');
  const routeStart = facilityPoint(districtGroup, facility, code, 'apron', specification.routeStart, 'building-route-start');
  const access: DoorAccess = { threshold, routeStart };
  if (code === 'E1') {
    access.cityThreshold = facilityPoint(districtGroup, facility, code, 'city-portal', [0, E1_CITY_PORTAL_Z], 'building-threshold');
    access.cityRouteStart = facilityPoint(districtGroup, facility, code, 'city-road-edge', [0, E1_CITY_ROUTE_START_Z], 'building-route-start');
  }
  const logisticsLayout = LOGISTICS_INTERIOR_LAYOUTS[code];
  if (logisticsLayout) {
    access.entries = logisticsLayout.doors.map((door) => {
      const local = logisticsDoorLocalPoints(code, logisticsLayout, door);
      return {
        id: door.id,
        side: door.side,
        role: door.role,
        width: door.width,
        threshold: facilityPoint(
          districtGroup,
          facility,
          code,
          `${door.id}-door`,
          local.threshold,
          'building-threshold',
        ),
        routeStart: facilityPoint(
          districtGroup,
          facility,
          code,
          `${door.id}-apron`,
          local.routeStart,
          'building-route-start',
        ),
      };
    });
  }
  facility.userData.entrancePoint = threshold.position.toArray();
  const walkInterior = code.startsWith('E') || Boolean(logisticsLayout);
  const interiorLayout = ENTRY_INTERIOR_LAYOUTS[code];
  const finishedFloorY = code === 'E2' ? FLOOR_Y + 0.8 : FLOOR_Y + 0.035;
  const runtimeInteriorCenter = facility.userData.runtimeInteriorCenter as readonly [number, number] | undefined;
  const interiorTarget = walkInterior
    ? districtGroup.worldToLocal(facility.localToWorld(new THREE.Vector3(
      specification.threshold[0],
      finishedFloorY,
      runtimeInteriorCenter?.[1] ?? 0,
    )))
    : null;
  facility.userData.walkAccess = {
    accessible: walkInterior,
    coordinateSpace: 'district-local',
    threshold: threshold.position.toArray(),
    routeStart: routeStart.position.toArray(),
    interiorTarget: interiorTarget?.toArray(),
    finishedFloorY: walkInterior ? finishedFloorY : undefined,
    doorwayWidth: code === 'E1'
      ? 7.4
      : interiorLayout?.doorwayWidth ?? logisticsLayout?.doors[0]?.width ?? 2.4,
    exteriorOnly: !walkInterior,
    entries: access.entries?.map((entry) => ({
      id: entry.id,
      side: entry.side,
      role: entry.role,
      width: entry.width,
      threshold: entry.threshold.position.toArray(),
      routeStart: entry.routeStart.position.toArray(),
    })),
    accessibleSides: access.entries ? Array.from(new Set(access.entries.map((entry) => entry.side))) : undefined,
  };
  facility.userData.roadDoorThreshold = threshold.position.toArray();
  facility.userData.roadRouteStart = routeStart.position.toArray();
  return access;
}

function polarRoadPoint(
  districtGroup: THREE.Group,
  id: string,
  radius: number,
  angleDegrees: number,
) {
  const angle = angleDegrees * DEG;
  const worldY = districtGroup.getWorldPosition(new THREE.Vector3()).y + FLOOR_Y;
  return roadPoint(
    id,
    districtGroup.worldToLocal(new THREE.Vector3(Math.cos(angle) * radius, worldY, Math.sin(angle) * radius)),
    'street-junction',
  );
}

function polarArc(
  districtGroup: THREE.Group,
  id: string,
  radius: number,
  angles: readonly number[],
) {
  return angles.map((angle) => polarRoadPoint(districtGroup, `${id}-${String(angle).replace('.', '_')}`, radius, angle));
}

function sampledPolarArc(
  districtGroup: THREE.Group,
  id: string,
  radius: number,
  startAngle: number,
  endAngle: number,
  maximumStepDegrees = 0.5,
) {
  const segmentCount = Math.max(1, Math.ceil(Math.abs(endAngle - startAngle) / maximumStepDegrees));
  const angles = Array.from(
    { length: segmentCount + 1 },
    (_, index) => THREE.MathUtils.lerp(startAngle, endAngle, index / segmentCount),
  );
  return polarArc(districtGroup, id, radius, angles);
}

function sampledRoadCurve(points: readonly RoadPoint[], segmentCount = 48, idPrefix = 'arrival') {
  if (points.length < 3) return [...points];
  const curve = new THREE.CatmullRomCurve3(
    points.map((point) => point.position.clone()),
    false,
    'centripetal',
  );
  return Array.from({ length: segmentCount + 1 }, (_, index) => {
    if (index === 0) return points[0];
    if (index === segmentCount) return points.at(-1)!;
    const position = curve.getPoint(index / segmentCount);
    if (index === 1) {
      const tangent = points[1].position.clone().sub(points[0].position).setY(0).normalize();
      const tangentDistance = points[0].position.distanceTo(position);
      position.copy(points[0].position).addScaledVector(tangent, tangentDistance);
    }
    return roadPoint(`${idPrefix}-curve-${index}`, position, 'street-junction');
  });
}

function accessRoute(
  access: DoorAccess,
  code: string,
  kind: RoadKind,
  options: Pick<RoadRoute, 'widthStart' | 'widthEnd' | 'logisticsPlatform' | 'surfaceOffset'> = {},
): RoadRoute {
  return {
    id: `${code.toLowerCase()}-door-apron`,
    name: `${code} exact doorway apron`,
    kind,
    points: [access.threshold, access.routeStart],
    ...options,
  };
}

function buildEntryRoutes(districtGroup: THREE.Group, access: ReadonlyMap<string, DoorAccess>): RoadRoute[] {
  const routes: RoadRoute[] = [];
  for (const code of ['E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10', 'E11', 'E12', 'E13']) {
    const door = access.get(code);
    if (door) routes.push(accessRoute(door, code, ['E8', 'E12', 'E13'].includes(code) ? 'promenade' : 'pedestrian'));
  }

  const e1 = access.get('E1');
  const e2 = access.get('E2');
  if (e1?.cityThreshold && e1.cityRouteStart) {
    const bridge = getCyberCityBridgeAlignment();
    const bridgePoint = roadPoint(
      'cyber-city-bridge-island-ramp',
      districtGroup.worldToLocal(bridge.islandRampStart.clone()),
      'bridge-approach',
    );
    routes.push({
      id: 'bridge-to-tunnel',
      name: 'Bridge ramp into E1 tunnel',
      kind: 'public-vehicle',
      points: [bridgePoint, e1.cityRouteStart],
    });
    routes.push({
      id: 'e1-tunnel-through-road',
      name: 'Uninterrupted E1 tunnel road',
      kind: 'public-vehicle',
      points: [e1.cityRouteStart, e1.cityThreshold, e1.threshold, e1.routeStart],
    });
  }

  if (e1 && e2) {
    const tunnelExitDirection = e1.routeStart.position.clone().sub(e1.threshold.position).setY(0).normalize();
    const tangentPoint = roadPoint(
      'arrival-tunnel-exit-tangent',
      e1.routeStart.position.clone().addScaledVector(tunnelExitDirection, 12),
      'street-junction',
    );
    const welcomeFork = polarRoadPoint(
      districtGroup,
      'welcome-arrival-fork',
      WELCOME_FORK_RADIUS,
      WELCOME_FORK_ANGLE,
    );
    const arrivalControlPoints = [
      e1.routeStart,
      tangentPoint,
      polarRoadPoint(districtGroup, 'arrival-300-400', 400, WELCOME_FORK_ANGLE),
      polarRoadPoint(districtGroup, 'arrival-300-389', 389, WELCOME_FORK_ANGLE),
      polarRoadPoint(districtGroup, 'arrival-300-378', 378, WELCOME_FORK_ANGLE),
      welcomeFork,
    ];
    routes.push({
      id: 'arrival',
      name: 'Bridge arrival boulevard to Welcome fork',
      kind: 'public-vehicle',
      points: sampledRoadCurve(arrivalControlPoints),
      surfaceOffset: 0,
      underBuildingPodium: false,
    });
    const entryBranchControls = [
      welcomeFork,
      polarRoadPoint(districtGroup, 'entry-branch-367-302_1', 367, 302.1),
      polarRoadPoint(districtGroup, 'entry-branch-354-305_2', 354, 305.2),
      polarRoadPoint(districtGroup, 'entry-branch-340-309', 340, 309),
      polarRoadPoint(districtGroup, 'central-311', 333, 311),
    ];
    routes.push({
      id: 'arrival-entry-branch',
      name: 'Welcome fork to Entry and Commercial',
      kind: 'public-white',
      points: sampledRoadCurve(entryBranchControls, 32, 'entry-branch'),
      surfaceOffset: WELCOME_ENTRY_BRANCH_SURFACE_OFFSET,
    });
    const logisticsBranchControls = [
      welcomeFork,
      polarRoadPoint(districtGroup, 'logistics-branch-367-297_9', 367, 297.9),
      polarRoadPoint(districtGroup, 'logistics-branch-350-296_8', 350, 296.8),
      polarRoadPoint(districtGroup, 'logistics-branch-334-297', 334, 297),
      polarRoadPoint(districtGroup, 'freight-297', 322, 297),
    ];
    routes.push({
      id: 'arrival-logistics-branch',
      name: 'Welcome fork to Logistics',
      kind: 'public-vehicle',
      points: sampledRoadCurve(logisticsBranchControls, 32, 'logistics-branch'),
      surfaceOffset: WELCOME_LOGISTICS_BRANCH_SURFACE_OFFSET,
    });
    routes.push({
      id: 'e2-door-apron',
      name: 'E2 Welcome Hall exact doorway apron',
      kind: 'public-vehicle',
      points: [welcomeFork, e2.threshold],
      surfaceOffset: WELCOME_APRON_SURFACE_OFFSET,
      underBuildingPodium: false,
    });
  }

  routes.push(
    {
      id: 'inner-retail-collector',
      name: 'Inner retail collector',
      kind: 'pedestrian',
      points: sampledPolarArc(districtGroup, 'inner', INNER_RETAIL_COLLECTOR_RADIUS, 313, 330),
    },
    {
      id: 'central-commercial-collector',
      name: 'Central commercial collector',
      kind: 'pedestrian',
      points: sampledPolarArc(districtGroup, 'central', 333, 305, 330),
    },
    {
      id: 'quay-promenade',
      name: 'Outer hotel and quay promenade',
      kind: 'promenade',
      points: sampledPolarArc(districtGroup, 'quay', 369, 314, 330),
    },
  );

  const connectorAssignments: Readonly<Record<string, readonly [number, number, RoadKind]>> = {
    E3: [333, 306.2, 'pedestrian'], E10: [333, 312.3, 'pedestrian'], E4: [333, 318.2, 'pedestrian'],
    E7: [333, 324.2, 'pedestrian'], E11: [333, 327, 'pedestrian'], E5: [INNER_RETAIL_COLLECTOR_RADIUS, 314.2, 'pedestrian'],
    E6: [INNER_RETAIL_COLLECTOR_RADIUS, 322, 'pedestrian'], E9: [INNER_RETAIL_COLLECTOR_RADIUS, 326.4, 'pedestrian'], E8: [369, 315.5, 'promenade'],
    E12: [369, 326.8, 'promenade'],
  };
  Object.entries(connectorAssignments).forEach(([code, [radius, angle, kind]]) => {
    const door = access.get(code);
    if (!door) return;
    routes.push({
      id: `${code.toLowerCase()}-to-collector`,
      name: `${code} apron to shared collector`,
      kind,
      points: [
        door.routeStart,
        polarRoadPoint(
          districtGroup,
          `${radius === INNER_RETAIL_COLLECTOR_RADIUS ? 'inner' : radius === 333 ? 'central' : 'quay'}-${String(angle).replace('.', '_')}`,
          radius,
          angle,
        ),
      ],
    });
  });
  const citylineDoor = access.get('E13');
  if (citylineDoor) {
    const routeStartWorld = districtGroup.localToWorld(citylineDoor.routeStart.position.clone());
    const liveTowerAngle = ((Math.atan2(routeStartWorld.z, routeStartWorld.x) / DEG) + 360) % 360;
    const collectorAngle = THREE.MathUtils.clamp(liveTowerAngle, 314.25, 329.75);
    const collector = polarRoadPoint(
      districtGroup,
      `quay-cityline-live-${collectorAngle.toFixed(2).replace('.', '_')}`,
      369,
      collectorAngle,
    );
    const doorwayOutward = citylineDoor.routeStart.position
      .clone()
      .sub(citylineDoor.threshold.position)
      .setY(0)
      .normalize();
    const collectorDistance = citylineDoor.routeStart.position.distanceTo(collector.position);
    const doorwayTangent = roadPoint(
      'e13-live-doorway-tangent',
      citylineDoor.routeStart.position.clone().addScaledVector(
        doorwayOutward,
        THREE.MathUtils.clamp(collectorDistance * 0.32, 3.4, 8.5),
      ),
      'street-junction',
    );
    routes.push({
      id: 'e13-to-collector',
      name: 'Cityline tower live angled promenade',
      kind: 'promenade',
      points: sampledRoadCurve(
        [citylineDoor.routeStart, doorwayTangent, collector],
        24,
        'cityline-live',
      ),
    });
  }
  for (const angle of [329]) {
    routes.push({
      id: `inner-central-cross-${angle}`,
      name: 'Short inner-to-central cross street',
      kind: 'pedestrian',
      points: [
        polarRoadPoint(districtGroup, `inner-${angle}`, INNER_RETAIL_COLLECTOR_RADIUS, angle),
        polarRoadPoint(districtGroup, `central-${angle}`, 333, angle),
      ],
    });
  }
  for (const angle of [329]) {
    routes.push({
      id: `central-quay-cross-${angle}`,
      name: 'Short central-to-quay cross street',
      kind: angle === 326 ? 'promenade' : 'pedestrian',
      points: [
        polarRoadPoint(districtGroup, `central-${angle}`, 333, angle),
        polarRoadPoint(districtGroup, `quay-${angle}`, 369, angle),
      ],
    });
  }
  for (const angle of [313, 330]) {
    routes.push({
      id: `entry-ring-transition-${angle}`,
      name: 'Tapered civic-road transition to district delimiter',
      kind: 'district-link',
      points: [
        polarRoadPoint(districtGroup, `inner-transition-${angle}`, INNER_RETAIL_COLLECTOR_RADIUS, angle),
        polarRoadPoint(districtGroup, `district-ring-${angle}`, 309.15, angle),
      ],
      widthStart: 3.6,
      widthEnd: 1.55,
      districtTransition: true,
    });
  }
  return routes;
}

function buildLogisticsRoutes(districtGroup: THREE.Group, access: ReadonlyMap<string, DoorAccess>): RoadRoute[] {
  const routes: RoadRoute[] = [];
  const platformWidths: Readonly<Record<string, number>> = {
    L1: 5.8, L2: 8.2, L3: 4.6, L4: 11.5, L5: 6.8, L6: 6.5, L7: 7.2,
  };
  const worldAngleFor = (point: RoadPoint) => {
    const world = districtGroup.localToWorld(point.position.clone());
    const angle = Math.atan2(world.z, world.x) / DEG;
    return angle < 0 ? angle + 360 : angle;
  };
  const corridorPoint = (
    point: RoadPoint,
    radius: number,
    suffix: string,
    angleOffset = 0,
  ) => polarRoadPoint(
    districtGroup,
    `${point.id}-${suffix}`,
    radius,
    worldAngleFor(point) + angleOffset,
  );

  access.forEach((doorAccess, code) => {
    const entries = doorAccess.entries ?? [];
    entries.forEach((entry, index) => {
      const baseWidth = platformWidths[code] ?? 5.5;
      const width = entry.role === 'staff'
        ? Math.max(2.2, entry.width + 0.7)
        : index === 0
          ? baseWidth
          : Math.max(entry.width + 1.8, baseWidth * 0.72);
      routes.push({
        id: `${code.toLowerCase()}-${entry.id}-hardstand`,
        name: `${code} ${entry.role} ${entry.side} entrance hardstand`,
        kind: 'logistics-platform',
        points: [entry.threshold, entry.routeStart],
        widthStart: width,
        widthEnd: width,
        logisticsPlatform: true,
        surfaceOffset: 0.004,
      });

      // The control tower already has secure airside and west-side service access.
      // Its former front-to-ring spur cut diagonally across the airfield composition,
      // so keep the entrance apron without generating that duplicate long connector.
      if (code === 'L3' && entry.side === 'front') return;

      let corridorRadius: number | null = null;
      let corridorKind: RoadKind = 'freight';
      if (entry.role === 'staff') return;
      if (entry.role === 'airside') {
        corridorRadius = 395;
        corridorKind = 'airside';
      } else if (code === 'L2' || code === 'L3' || (code === 'L1' && entry.side !== 'front')) {
        corridorRadius = 368;
        corridorKind = 'logistics-landside';
      } else if (entry.side === 'rear') {
        corridorRadius = 355;
        corridorKind = 'service-yard';
      } else {
        corridorRadius = 322;
        corridorKind = 'freight';
      }
      routes.push({
        id: `${code.toLowerCase()}-${entry.id}-to-corridor`,
        name: `${code} ${entry.role} entrance to shared ${corridorKind} corridor`,
        kind: corridorKind,
        widthStart: code === 'L3' ? 3.2 : undefined,
        widthEnd: code === 'L3' ? 3.2 : undefined,
        surfaceOffset: 0.002,
        points: [
          entry.routeStart,
          corridorPoint(
            entry.routeStart,
            corridorRadius,
            corridorKind,
            code === 'L3'
              ? entry.side === 'front'
                ? 1.8
                : -1.5
              : 0,
          ),
        ],
      });
    });
  });

  routes.push(
    {
      id: 'freight-spine',
      name: 'Controlled westbound freight spine',
      kind: 'freight',
      points: sampledPolarArc(districtGroup, 'freight', 322, 276, 300),
    },
    {
      id: 'secure-yard-collector',
      name: 'Uniform cross-dock and workshop yard collector',
      kind: 'service-yard',
      points: sampledPolarArc(districtGroup, 'secure-yard', 355, 276.5, 295),
    },
    {
      id: 'terminal-arrivals-loop',
      name: 'Northfield passenger arrivals and parking loop',
      kind: 'logistics-landside',
      points: sampledPolarArc(districtGroup, 'terminal-loop', 368, 286, 299),
    },
    {
      id: 'airside-service-lane',
      name: 'Runway-side terminal and hangar service lane',
      kind: 'airside',
      points: sampledPolarArc(districtGroup, 'airside', 395, 278, 294),
    },
    {
      id: 'freight-yard-checkpoint',
      name: 'Controlled freight-to-secure-yard checkpoint',
      kind: 'freight',
      surfaceOffset: 0.002,
      points: [
        polarRoadPoint(districtGroup, 'freight-gate-281_5', 322, 281.5),
        polarRoadPoint(districtGroup, 'secure-yard-gate-281_5', 355, 281.5),
      ],
    },
    {
      id: 'secure-airside-checkpoint',
      name: 'Controlled secure-yard-to-airside checkpoint',
      kind: 'airside',
      surfaceOffset: 0.002,
      points: [
        polarRoadPoint(districtGroup, 'secure-yard-gate-289_2', 355, 289.2),
        polarRoadPoint(districtGroup, 'airside-gate-289_2', 395, 289.2),
      ],
    },
    {
      id: 'parking-passenger-gateway',
      name: 'Curved parking bypass into the passenger loop',
      kind: 'logistics-landside',
      surfaceOffset: 0.001,
      points: sampledRoadCurve([
        polarRoadPoint(districtGroup, 'parking-bypass-in', 322, 299.7),
        polarRoadPoint(districtGroup, 'parking-bypass-apex', 346, 300.15),
        polarRoadPoint(districtGroup, 'passenger-loop-entry', 368, 298.8),
      ], 36, 'parking-bypass'),
    },
  );

  for (const angle of [276, 300]) {
    routes.push({
      id: `logistics-ring-transition-${angle}`,
      name: 'Tapered freight-road transition to district delimiter',
      kind: 'district-link',
      points: [
        polarRoadPoint(districtGroup, `freight-transition-${angle}`, 322, angle),
        polarRoadPoint(districtGroup, `district-ring-${angle}`, 309.15, angle),
      ],
      widthStart: 7.2,
      widthEnd: 1.55,
      districtTransition: true,
      surfaceOffset: 0.001,
    });
  }
  return routes;
}

function roadStyle(kind: RoadKind, mats: RoadMaterials) {
  switch (kind) {
    case 'public-vehicle': return { width: 6.8, surface: mats.asphalt, marking: mats.whitePaint, line: 'dashed-centre' as const };
    case 'public-white': return { width: 5.2, surface: mats.paleStone, marking: mats.paving, line: 'none' as const };
    case 'freight': return { width: 7.2, surface: mats.darkConcrete, marking: mats.yellowPaint, line: 'dashed-centre' as const };
    case 'logistics-landside': return { width: 6.4, surface: mats.logisticsConcrete, marking: mats.whitePaint, line: 'dashed-centre' as const };
    case 'service-yard': return { width: 8.4, surface: mats.logisticsConcrete, marking: mats.yellowPaint, line: 'dashed-centre' as const };
    case 'airside': return { width: 6.0, surface: mats.darkConcrete, marking: mats.yellowPaint, line: 'dashed-centre' as const };
    case 'logistics-platform': return { width: 8.0, surface: mats.logisticsConcrete, marking: mats.yellowPaint, line: 'none' as const };
    case 'district-link': return { width: 1.55, surface: mats.darkConcrete, marking: mats.paving, line: 'none' as const };
    case 'promenade': return { width: 4.2, surface: mats.whitePaint, marking: mats.paving, line: 'none' as const };
    default: return { width: 3.6, surface: mats.paleStone, marking: mats.paving, line: 'none' as const };
  }
}

function roadDecalMaterial(source: THREE.Material, depthPriority: number) {
  const cloned = source.clone();
  cloned.name = `${source.name || source.type}__ENTRY_LOGISTICS_ROAD_DECAL_${depthPriority}`;
  cloned.polygonOffset = true;
  cloned.polygonOffsetFactor = -depthPriority;
  cloned.polygonOffsetUnits = -depthPriority;
  cloned.depthTest = true;
  cloned.depthWrite = true;
  cloned.needsUpdate = true;
  return cloned;
}

function roadRibbonGeometry(
  points: readonly RoadPoint[],
  widthStart: number,
  elevation: number,
  widthEnd = widthStart,
) {
  const positions: number[] = [];
  const indices: number[] = [];
  points.forEach((point, index) => {
    const t = points.length <= 1 ? 0 : index / (points.length - 1);
    const halfWidth = THREE.MathUtils.lerp(widthStart, widthEnd, t) * 0.5;
    const current = point.position;
    const previous = points[Math.max(0, index - 1)].position;
    const next = points[Math.min(points.length - 1, index + 1)].position;
    const incoming = current.clone().sub(previous).setY(0);
    const outgoing = next.clone().sub(current).setY(0);
    if (incoming.lengthSq() < 0.000001) incoming.copy(outgoing);
    if (outgoing.lengthSq() < 0.000001) outgoing.copy(incoming);
    incoming.normalize();
    outgoing.normalize();
    const incomingNormal = new THREE.Vector3(incoming.z, 0, -incoming.x);
    const outgoingNormal = new THREE.Vector3(outgoing.z, 0, -outgoing.x);
    const miter = incomingNormal.clone().add(outgoingNormal);
    if (miter.lengthSq() < 0.000001) miter.copy(outgoingNormal);
    miter.normalize();
    const miterScale = halfWidth / Math.max(0.45, Math.abs(miter.dot(outgoingNormal)));
    const offset = miter.multiplyScalar(miterScale);
    positions.push(
      current.x + offset.x, elevation, current.z + offset.z,
      current.x - offset.x, elevation, current.z - offset.z,
    );
    if (index < points.length - 1) {
      const vertex = index * 2;
      indices.push(vertex, vertex + 1, vertex + 2, vertex + 1, vertex + 3, vertex + 2);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function dashedRoadMarkingGeometry(
  points: readonly RoadPoint[],
  width: number,
  elevation: number,
  trimStart: number,
  trimEnd: number,
  dashLength = 0.38,
  gapLength = 0.26,
) {
  const positions: number[] = [];
  const indices: number[] = [];
  const cumulative = [0];
  for (let index = 1; index < points.length; index += 1) {
    cumulative.push(cumulative[index - 1] + points[index].position.distanceTo(points[index - 1].position));
  }
  const totalLength = cumulative.at(-1) ?? 0;
  const sampleAt = (distance: number) => {
    const clamped = THREE.MathUtils.clamp(distance, 0, totalLength);
    let segmentIndex = 0;
    while (segmentIndex < cumulative.length - 2 && cumulative[segmentIndex + 1] < clamped) {
      segmentIndex += 1;
    }
    const segmentStart = cumulative[segmentIndex];
    const segmentEnd = cumulative[segmentIndex + 1] ?? segmentStart;
    const progress = segmentEnd - segmentStart < 0.000001
      ? 0
      : (clamped - segmentStart) / (segmentEnd - segmentStart);
    return points[segmentIndex].position.clone().lerp(points[segmentIndex + 1].position, progress);
  };
  const usableStart = Math.min(trimStart, totalLength);
  const usableEnd = Math.max(usableStart, totalLength - trimEnd);
  let dashCount = 0;
  for (let cursor = usableStart; cursor < usableEnd - 0.05; cursor += dashLength + gapLength) {
    const dashEnd = Math.min(cursor + dashLength, usableEnd);
    const start = sampleAt(cursor);
    const end = sampleAt(dashEnd);
    const direction = end.clone().sub(start).setY(0);
    if (direction.lengthSq() < 0.000001) continue;
    direction.normalize();
    const normal = new THREE.Vector3(direction.z, 0, -direction.x).multiplyScalar(width * 0.5);
    const vertex = positions.length / 3;
    positions.push(
      start.x + normal.x, elevation, start.z + normal.z,
      start.x - normal.x, elevation, start.z - normal.z,
      end.x + normal.x, elevation, end.z + normal.z,
      end.x - normal.x, elevation, end.z - normal.z,
    );
    indices.push(vertex, vertex + 1, vertex + 2, vertex + 1, vertex + 3, vertex + 2);
    dashCount += 1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData.dashCount = dashCount;
  geometry.userData.dashLengthMetres = dashLength * 10;
  geometry.userData.gapLengthMetres = gapLength * 10;
  return geometry;
}

function roadMarkingClearance(route: RoadRoute) {
  if (route.id === 'arrival') return { start: 0.55, end: 4.75 };
  if (route.id === 'arrival-logistics-branch') return { start: 4.75, end: 0.75 };
  return { start: 0.75, end: 0.75 };
}

function addContinuousRoadRibbon(
  network: THREE.Group,
  districtId: string,
  route: RoadRoute,
  mats: RoadMaterials,
  depthPriority: number,
) {
  const style = roadStyle(route.kind, mats);
  const widthStart = route.widthStart ?? style.width;
  const widthEnd = route.widthEnd ?? widthStart;
  const roadTop = ROAD_SURFACE_TOP + (route.surfaceOffset ?? 0);
  const surface = new THREE.Mesh(
    roadRibbonGeometry(route.points, widthStart, roadTop, widthEnd),
    roadDecalMaterial(style.surface, depthPriority),
  );
  surface.name = `${districtId.toUpperCase()}__${route.id.toUpperCase()}__CONTINUOUS_SURFACE`;
  surface.receiveShadow = true;
  surface.renderOrder = 1;
  surface.userData = {
    selectableId: districtId,
    continuousRoadSurface: true,
    routeId: route.id,
    routeKind: route.kind,
    widthStart,
    widthEnd,
    surfaceOffset: route.surfaceOffset ?? 0,
    surfaceElevation: roadTop,
    ownedRoadMaterial: true,
    terrainDepthBias: true,
    logisticsPlatform: route.logisticsPlatform === true,
    districtTransition: route.districtTransition === true,
    walkable: true,
    navObstacle: false,
  };
  network.add(surface);

  if (style.line === 'dashed-centre' && route.id !== 'e2-door-apron') {
    const clearance = roadMarkingClearance(route);
    const markingGeometry = dashedRoadMarkingGeometry(
      route.points,
      0.04,
      roadTop + ROAD_MARKING_LIFT,
      clearance.start,
      clearance.end,
    );
    const marking = new THREE.Mesh(
      markingGeometry,
      roadDecalMaterial(style.marking, depthPriority + 1),
    );
    marking.name = `${surface.name}__DASHED_CENTRELINE`;
    marking.renderOrder = 2;
    marking.userData = {
      selectableId: districtId,
      continuousRoadMarking: true,
      roadMarking: true,
      routeId: route.id,
      routeKind: route.kind,
      roadMarkingPattern: 'dashed-centreline',
      dashCount: markingGeometry.userData.dashCount,
      dashLengthMetres: markingGeometry.userData.dashLengthMetres,
      gapLengthMetres: markingGeometry.userData.gapLengthMetres,
      markingElevation: roadTop + ROAD_MARKING_LIFT,
      markingLiftMetres: ROAD_MARKING_LIFT * 10,
      occlusionSafeSurfaceDecal: true,
      startClearanceMetres: clearance.start * 10,
      endClearanceMetres: clearance.end * 10,
      ownedRoadMaterial: true,
      terrainDepthBias: true,
      navObstacle: false,
    };
    network.add(marking);
  }
}

function addWelcomeForkJunction(
  network: THREE.Group,
  districtGroup: THREE.Group,
  districtId: string,
  mats: RoadMaterials,
) {
  const fork = polarRoadPoint(
    districtGroup,
    'welcome-arrival-fork-cap',
    WELCOME_FORK_RADIUS,
    WELCOME_FORK_ANGLE,
  );
  const cap = new THREE.Mesh(
    new THREE.CircleGeometry(4.35, 48),
    roadDecalMaterial(mats.asphalt, 1_000),
  );
  cap.name = `${districtId.toUpperCase()}__WELCOME_FORK__CLEAN_JUNCTION_CAP`;
  cap.rotation.x = -Math.PI * 0.5;
  cap.position.set(
    fork.position.x,
    ROAD_SURFACE_TOP + WELCOME_JUNCTION_SURFACE_OFFSET,
    fork.position.z,
  );
  cap.receiveShadow = true;
  cap.renderOrder = 3;
  cap.userData = {
    selectableId: districtId,
    welcomeForkJunction: true,
    coversCoplanarOverlap: true,
    surfaceOffset: WELCOME_JUNCTION_SURFACE_OFFSET,
    surfaceElevation: ROAD_SURFACE_TOP + WELCOME_JUNCTION_SURFACE_OFFSET,
    connectedRoutes: [
      'arrival',
      'arrival-entry-branch',
      'arrival-logistics-branch',
      'e2-door-apron',
    ],
    ownedRoadMaterial: true,
    terrainDepthBias: true,
    walkable: true,
    navObstacle: false,
    surfaceKind: 'asphalt',
  };
  network.add(cap);
}

function addTunnelSidewalks(
  network: THREE.Group,
  districtId: string,
  access: DoorAccess,
  mats: Pick<Materials, 'paleStone'>,
) {
  if (!access.cityRouteStart) return;
  const end = access.routeStart.position;
  const tunnelDirection = end.clone().sub(access.cityRouteStart.position).setY(0).normalize();
  const start = (access.cityThreshold?.position ?? access.cityRouteStart.position)
    .clone()
    .addScaledVector(tunnelDirection, 2.65);
  const delta = end.clone().sub(start).setY(0);
  const length = delta.length();
  const direction = delta.clone().normalize();
  const lateral = new THREE.Vector3(direction.z, 0, -direction.x);
  const centre = start.clone().lerp(end, 0.5);
  const rotation = Math.atan2(delta.x, delta.z);
  for (const side of [-1, 1]) {
    const position = centre.clone().addScaledVector(lateral, side * 3.7);
    const sidewalk = addPlane(
      network,
      `${districtId.toUpperCase()}__E1__TUNNEL_SIDEWALK_${side < 0 ? 'WEST' : 'EAST'}`,
      0.58,
      length,
      mats.paleStone,
      [position.x, FLOOR_Y + 0.022, position.z],
      rotation,
    );
    sidewalk.userData = {
      ...sidewalk.userData,
      selectableId: districtId,
      tunnelSidewalk: true,
      side: side < 0 ? 'west' : 'east',
      surfaceKind: 'stone',
      walkable: true,
      navObstacle: false,
    };
  }
}

function addRoadSegment(
  network: THREE.Group,
  districtId: string,
  route: RoadRoute,
  startPoint: RoadPoint,
  endPoint: RoadPoint,
  segmentIndex: number,
  mats: RoadMaterials,
) {
  const start = startPoint.position;
  const end = endPoint.position;
  const delta = end.clone().sub(start);
  const length = delta.length();
  if (length < 0.05) return 0;
  const style = roadStyle(route.kind, mats);
  const routeProgress = route.points.length <= 1 ? 0 : segmentIndex / (route.points.length - 1);
  const routeWidth = THREE.MathUtils.lerp(
    route.widthStart ?? style.width,
    route.widthEnd ?? route.widthStart ?? style.width,
    routeProgress,
  );
  const surfaceOffset = route.surfaceOffset ?? 0;
  const centre: [number, number, number] = [
    (start.x + end.x) * 0.5,
    ROAD_SURFACE_TOP - 0.025 + surfaceOffset,
    (start.z + end.z) * 0.5,
  ];
  const rotation = Math.atan2(delta.x, delta.z);
  const road = addPlane(
    network,
    `${districtId.toUpperCase()}__${route.id.toUpperCase()}__${startPoint.id.toUpperCase()}_${endPoint.id.toUpperCase()}`,
    routeWidth,
    length,
    style.surface,
    centre,
    rotation,
  );
  road.visible = false;
  road.renderOrder = 1;
  road.userData = {
    ...road.userData,
    selectableId: districtId,
    entranceLinkedRoad: true,
    routeId: route.id,
    routeName: route.name,
    routeKind: route.kind,
    fromPointId: startPoint.id,
    toPointId: endPoint.id,
    fromEndpointType: startPoint.endpointType,
    toEndpointType: endPoint.endpointType,
    fromBuilding: startPoint.buildingCode,
    toBuilding: endPoint.buildingCode,
    fromPoint: start.toArray(),
    toPoint: end.toArray(),
    segmentIndex,
    surfaceOffset,
    underBuildingPodium: route.underBuildingPodium === true,
    logisticsPlatform: route.logisticsPlatform === true,
    districtTransition: route.districtTransition === true,
    semanticRoadSegment: true,
  };
  return 1;
}

/** Rebuilds roads from the current editable building entrances. */
export function refreshEntryLogisticsRoadNetwork(districtGroup: THREE.Group) {
  const mats = roadMaterials.get(districtGroup);
  if (!mats) return;
  const previous = districtGroup.getObjectByName(EDITABLE_ROAD_NETWORK_NAME);
  if (previous) {
    previous.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      if (object.userData.ownedRoadMaterial === true) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((roadMaterial) => roadMaterial.dispose());
      }
    });
    previous.removeFromParent();
  }

  districtGroup.updateMatrixWorld(true);

  const facilities = new Map<string, THREE.Group>();
  districtGroup.traverse((object) => {
    if (object instanceof THREE.Group && object.userData.exteriorProgram === true) {
      facilities.set(String(object.userData.buildingCode), object);
    }
  });
  const accessPoints = new Map<string, DoorAccess>();
  facilities.forEach((facility, code) => accessPoints.set(code, facilityDoorAccess(districtGroup, facility)));
  const entryDistrict = districtGroup.name.includes('entry-commercial');
  const routes = entryDistrict
    ? buildEntryRoutes(districtGroup, accessPoints)
    : buildLogisticsRoutes(districtGroup, accessPoints);
  const districtId = entryDistrict ? 'entry-commercial' : 'logistics';
  const network = new THREE.Group();
  network.name = EDITABLE_ROAD_NETWORK_NAME;
  network.userData = {
    selectableId: districtId,
    dynamicRoadNetwork: true,
    entranceLinked: true,
    doorToDoor: true,
    publicFreightSeparated: true,
  };

  let segmentCount = 0;
  const districtDepthBase = entryDistrict ? 500 : 100;
  routes.forEach((route, routeIndex) => {
    route.points.slice(0, -1).forEach((startPoint, index) => {
      const endPoint = route.points[index + 1];
      segmentCount += addRoadSegment(
        network,
        districtId,
        route,
        startPoint,
        endPoint,
        index + 1,
        mats,
      );
    });
    addContinuousRoadRibbon(
      network,
      districtId,
      route,
      mats,
      districtDepthBase + routeIndex * 2,
    );
  });
  if (entryDistrict) {
    addWelcomeForkJunction(network, districtGroup, districtId, mats);
    const e1Access = accessPoints.get('E1');
    if (e1Access) addTunnelSidewalks(network, districtId, e1Access, mats);
  }
  network.traverse((object) => {
    object.userData.selectableId ??= districtId;
    object.userData.navObstacle = false;
  });
  const logisticsEntranceCount = entryDistrict
    ? facilities.size
    : Array.from(accessPoints.values()).reduce((sum, value) => sum + (value.entries?.length ?? 1), 0);
  const logisticsPlatformCount = routes.filter((route) => route.logisticsPlatform).length;
  network.userData.routeCount = entryDistrict ? 5 : 4;
  network.userData.branchCount = routes.length;
  network.userData.segmentCount = segmentCount;
  network.userData.buildingThresholdCount = facilities.size;
  network.userData.buildingEntranceCount = logisticsEntranceCount;
  network.userData.entranceApronCount = entryDistrict ? facilities.size : logisticsPlatformCount;
  network.userData.sharedStreetCount = entryDistrict ? 5 : 4;
  network.userData.bridgeTunnelAligned = entryDistrict;
  network.userData.continuousSurfaceCount = routes.length;
  network.userData.districtTransitionCount = routes.filter((route) => route.districtTransition).length;
  network.userData.logisticsPlatformCount = logisticsPlatformCount;
  network.userData.surfacePalette = entryDistrict
    ? ['white civic paving', 'dark arrival asphalt', 'grey district-ring transitions']
    : [
      'light-grey passenger loop',
      'medium-grey building hardstands',
      'dark-grey freight and airside concrete',
      'yellow operational guide markings',
    ];
  network.userData.uniformContinuousRibbons = true;
  districtGroup.add(network);

  const program = districtGroup.userData.entryLogisticsProgram;
  if (program) {
    program.roadNetwork = {
      layout: 'entrance-linked hierarchy',
      dynamic: true,
      routeCount: entryDistrict ? 5 : 4,
      branchCount: routes.length,
      segmentCount,
      buildingAccessCount: facilities.size,
      buildingThresholdCount: facilities.size,
      buildingEntranceCount: logisticsEntranceCount,
      doorToDoor: true,
      bridgeTunnelAligned: entryDistrict,
      hierarchy: districtId === 'entry-commercial'
        ? ['bridge and tunnel arrival boulevard', 'white civic collectors', 'tapered district-ring transitions', 'quay promenade']
        : [
          'light-grey passenger arrivals loop',
          'dark-grey westbound freight spine',
          'uniform secure-yard collector',
          'runway-side airside service lane',
          'twenty multi-side entrance hardstands',
          'two tapered district-ring transitions',
        ],
      continuousSurfaceCount: routes.length,
      districtTransitionCount: routes.filter((route) => route.districtTransition).length,
      logisticsPlatformCount: routes.filter((route) => route.logisticsPlatform).length,
    };
  }
}

function signMaterial(title: string, subtitle: string, dark = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext('2d')!;
  context.fillStyle = dark ? '#151b1e' : '#d7d0bf';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = dark ? '#9aa8aa' : '#8b6542';
  context.lineWidth = 12;
  context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = dark ? '#d8e2e1' : '#282522';
  context.font = '700 70px Arial, sans-serif';
  context.fillText(title, canvas.width / 2, subtitle ? 102 : 128, canvas.width - 54);
  if (subtitle) {
    context.font = '500 34px Arial, sans-serif';
    context.fillText(subtitle, canvas.width / 2, 184, canvas.width - 72);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
}

function addSign(
  parent: THREE.Object3D,
  name: string,
  title: string,
  subtitle: string,
  size: readonly [number, number],
  position: readonly [number, number, number],
  dark = false,
) {
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), signMaterial(title, subtitle, dark));
  sign.name = name;
  sign.position.set(...position);
  sign.userData.navObstacle = false;
  parent.add(sign);
  return sign;
}

function localPolar(definition: DistrictDefinition, radius: number, angleDegrees: number) {
  const angle = angleDegrees * DEG;
  return new THREE.Vector3(
    Math.cos(angle) * radius - definition.position[0],
    0,
    Math.sin(angle) * radius - definition.position[2],
  );
}

function tagFacility(
  facility: THREE.Group,
  definition: DistrictDefinition,
  code: string,
  displayName: string,
  radius: number,
  angleDegrees: number,
) {
  const sector = definition.sector!;
  const angle = angleDegrees * DEG;
  const selectableId = entryLogisticsBuildingSelectableId(code);
  facility.userData = {
    ...facility.userData,
    selectableId,
    individualSelectableId: selectableId,
    parentSelectableId: definition.id,
    districtId: definition.id,
    featureRole: 'building',
    featureTag: displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    buildingCode: code,
    displayName,
    exteriorProgram: true,
    sectorAnchor: {
      radius,
      angle,
      normalizedRadial: (radius - sector.innerRadius) / (sector.outerRadius - sector.innerRadius),
      normalizedAngular: (angle - sector.startAngle) / (sector.endAngle - sector.startAngle),
    },
  };
  facility.traverse((child) => {
    child.userData.selectableId = selectableId;
    child.userData.individualSelectableId = selectableId;
    child.userData.parentSelectableId = definition.id;
    child.userData.districtId = definition.id;
    child.userData.buildingCode = code;
    child.userData.featureTag = facility.userData.featureTag;
    child.userData.featureRole ??= 'building';
  });
}

function placeFacility(
  definition: DistrictDefinition,
  code: string,
  displayName: string,
  radius: number,
  angleDegrees: number,
  orientation: Orientation,
  build: (facility: THREE.Group) => void,
) {
  const facility = new THREE.Group();
  facility.name = `${definition.id === 'entry-commercial' ? 'ENTRY' : 'LOGISTICS'}__${code}__${displayName.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  facility.position.copy(localPolar(definition, radius, angleDegrees));
  const angle = angleDegrees * DEG;
  facility.rotation.y = orientation === 'tangent' ? -angle - Math.PI / 2 : Math.PI / 2 - angle;
  build(facility);
  // The masterplan is horizontally expanded, while architecture remains at
  // human scale. The authored dimensions above deliberately use generous plan
  // footprints; compress only the vertical axis to realistic floor heights.
  facility.scale.y = FACILITY_VERTICAL_SCALE;
  facility.userData.verticalScale = FACILITY_VERTICAL_SCALE;
  facility.userData.editorBaseScale = [1, FACILITY_VERTICAL_SCALE, 1] as const;
  tagFacility(facility, definition, code, displayName, radius, angleDegrees);
  return facility;
}

function alignBridgeheadTunnelWithCyberCity(
  facility: THREE.Group,
  definition: DistrictDefinition,
) {
  const bridge = getCyberCityBridgeAlignment();
  // Local -Z is the city-facing tunnel direction. Its road edge is pinned to
  // the bridge ramp, so moving E1 later produces only one explicit connector.
  facility.rotation.y = Math.atan2(-bridge.direction.x, -bridge.direction.z);
  const centreWorld = bridge.islandRampStart.clone().addScaledVector(bridge.direction, -9.5);
  facility.position.set(
    centreWorld.x - definition.position[0],
    0,
    centreWorld.z - definition.position[2],
  );
  facility.userData.bridgeAligned = true;
  facility.userData.bridgeApproachWorld = bridge.islandRampStart.toArray();
  facility.userData.citySightlineWorld = bridge.bridgeEnd.toArray();
  facility.userData.cityFacingLocalAxis = [0, 0, -1];
  facility.userData.sectorBoundaryRole = 'bridge threshold between Logistics and Entry';
}

function addWindowRhythm(
  parent: THREE.Object3D,
  prefix: string,
  count: number,
  span: number,
  y: number,
  z: number,
  height: number,
  mat: THREE.Material,
) {
  for (let index = 0; index < count; index += 1) {
    const x = count === 1 ? 0 : -span * 0.5 + (span * index) / (count - 1);
    addBox(parent, `${prefix}__WINDOW_${index + 1}`, [Math.max(0.18, span / count * 0.58), height, 0.055], mat, [x, y, z], { obstacle: false, castShadow: false });
  }
}

function addVerticalFins(
  parent: THREE.Object3D,
  prefix: string,
  count: number,
  span: number,
  y: number,
  z: number,
  height: number,
  mat: THREE.Material,
) {
  for (let index = 0; index < count; index += 1) {
    const x = -span * 0.5 + (span * index) / Math.max(1, count - 1);
    addBox(parent, `${prefix}__FIN_${index + 1}`, [0.08, height, 0.28], mat, [x, y, z], { obstacle: false });
  }
}

function addBeamBetween(
  parent: THREE.Object3D,
  name: string,
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  mat: THREE.Material,
) {
  const direction = end.clone().sub(start);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 8),
    mat,
  );
  beam.name = name;
  beam.position.copy(start).add(end).multiplyScalar(0.5);
  beam.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  beam.castShadow = true;
  beam.userData.navObstacle = false;
  parent.add(beam);
  return beam;
}

function addGroundedDnaColumn(
  parent: THREE.Object3D,
  name: string,
  position: readonly [number, number],
  height: number,
  mat: THREE.Material,
) {
  const column = new THREE.Group();
  column.name = name;
  column.position.set(position[0], 0, position[1]);
  column.userData.dnaShapedColumn = true;
  column.userData.grounded = true;
  column.userData.groundTouchY = 0;
  column.userData.height = height;
  parent.add(column);

  const turns = 2.75;
  const radius = 0.18;
  const pointCount = 56;
  const strandPoints = (phase: number) => Array.from({ length: pointCount }, (_, index) => {
    const t = index / (pointCount - 1);
    const angle = phase + t * Math.PI * 2 * turns;
    return new THREE.Vector3(
      Math.cos(angle) * radius,
      t * height,
      Math.sin(angle) * radius,
    );
  });
  const westPoints = strandPoints(0);
  const eastPoints = strandPoints(Math.PI);
  [westPoints, eastPoints].forEach((points, strandIndex) => {
    const strand = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        72,
        0.045,
        7,
        false,
      ),
      mat,
    );
    strand.name = `${name}__STRAND_${strandIndex + 1}`;
    strand.castShadow = true;
    strand.userData.navObstacle = false;
    column.add(strand);
  });
  for (let rungIndex = 1; rungIndex <= 8; rungIndex += 1) {
    const pointIndex = Math.round((rungIndex / 9) * (pointCount - 1));
    addBeamBetween(
      column,
      `${name}__BASE_PAIR_${rungIndex}`,
      westPoints[pointIndex],
      eastPoints[pointIndex],
      0.026,
      mat,
    );
  }
  return column;
}

function addWelcomeTableSet(
  parent: THREE.Object3D,
  index: number,
  position: readonly [number, number],
  rotationY: number,
  mats: Materials,
) {
  const set = new THREE.Group();
  set.name = `ENTRY__WELCOME_POOL_TABLE_SET_${index}`;
  set.position.set(position[0], 0, position[1]);
  set.rotation.y = rotationY;
  set.userData.poolFurniture = true;
  parent.add(set);

  addCylinder(
    set,
    `${set.name}__PEDESTAL`,
    0.008,
    0.075,
    mats.whiteMetal,
    [0, FLOOR_Y, 0],
    10,
  );
  addCylinder(
    set,
    `${set.name}__TABLETOP`,
    0.06,
    0.007,
    mats.whiteMetal,
    [0, FLOOR_Y + 0.075, 0],
    24,
  );
  for (let chairIndex = 0; chairIndex < 3; chairIndex += 1) {
    const angle = chairIndex * Math.PI * 2 / 3;
    const chair = new THREE.Group();
    chair.name = `${set.name}__CHAIR_${chairIndex + 1}`;
    chair.position.set(Math.cos(angle) * 0.115, 0, Math.sin(angle) * 0.115);
    chair.rotation.y = -angle + Math.PI * 0.5;
    chair.userData.poolFurniture = true;
    set.add(chair);
    addBox(
      chair,
      `${chair.name}__SEAT`,
      [0.05, 0.006, 0.048],
      mats.whiteMetal,
      [0, FLOOR_Y + 0.043, 0],
      { obstacle: true },
    );
    addBox(
      chair,
      `${chair.name}__BACK`,
      [0.05, 0.055, 0.007],
      mats.whiteMetal,
      [0, FLOOR_Y + 0.045, 0.021],
      { obstacle: true },
    );
    for (const x of [-0.18, 0.18]) {
      for (const z of [-0.015, 0.015]) {
        addCylinder(
          chair,
          `${chair.name}__LEG_${x < 0 ? 'WEST' : 'EAST'}_${z < 0 ? 'FRONT' : 'REAR'}`,
          0.0025,
          0.043,
          mats.whiteMetal,
          [x * 0.1, FLOOR_Y, z],
          6,
        );
      }
    }
  }
  set.userData.humanScaleMetres = {
    tableHeight: 0.82,
    tableDiameter: 1.2,
    chairSeatHeight: 0.49,
    chairOverallHeight: 1.08,
  };
}

function addCafeTerraceTableSet(
  parent: THREE.Object3D,
  index: number,
  position: readonly [number, number],
  mats: Materials,
  withUmbrella: boolean,
) {
  const set = new THREE.Group();
  set.name = `ENTRY__E4__TERRACE_TABLE_SET_${index}`;
  set.position.set(position[0], 0, position[1]);
  set.userData.cafeTerraceFurniture = true;
  parent.add(set);

  const tableHeightMetres = 0.75;
  const tableDiameterMetres = 0.9;
  const chairSeatHeightMetres = 0.46;
  const chairOverallHeightMetres = 0.94;
  const tabletopThickness = metresToWorldUnits(0.06) / FACILITY_VERTICAL_SCALE;
  const tableHeight = metresToWorldUnits(tableHeightMetres) / FACILITY_VERTICAL_SCALE;
  const pedestalHeight = tableHeight - tabletopThickness;
  addCylinder(
    set,
    `ENTRY__E4__TABLE_PEDESTAL_${index}`,
    metresToWorldUnits(0.055),
    pedestalHeight,
    mats.darkBronze,
    [0, FLOOR_Y, 0],
    10,
    false,
  );
  addCylinder(
    set,
    `ENTRY__E4__TERRACE_TABLE_${index}`,
    metresToWorldUnits(tableDiameterMetres * 0.5),
    tabletopThickness,
    mats.darkBronze,
    [0, FLOOR_Y + pedestalHeight, 0],
    24,
    false,
  );

  const seatWidth = metresToWorldUnits(0.46);
  const seatDepth = metresToWorldUnits(0.44);
  const seatThickness = metresToWorldUnits(0.05) / FACILITY_VERTICAL_SCALE;
  const seatBase = metresToWorldUnits(chairSeatHeightMetres - 0.05) / FACILITY_VERTICAL_SCALE;
  const backBase = metresToWorldUnits(0.42) / FACILITY_VERTICAL_SCALE;
  const backHeight = metresToWorldUnits(chairOverallHeightMetres - 0.42) / FACILITY_VERTICAL_SCALE;
  const chairOffset = metresToWorldUnits(1.05);
  for (let chairIndex = 0; chairIndex < 4; chairIndex += 1) {
    const angle = chairIndex * Math.PI * 0.5;
    const chair = new THREE.Group();
    chair.name = `ENTRY__E4__TERRACE_TABLE_${index}__CHAIR_${chairIndex + 1}`;
    chair.position.set(Math.cos(angle) * chairOffset, 0, Math.sin(angle) * chairOffset);
    chair.rotation.y = -angle + Math.PI * 0.5;
    chair.userData.cafeTerraceChair = true;
    set.add(chair);
    addBox(
      chair,
      `${chair.name}__SEAT`,
      [seatWidth, seatThickness, seatDepth],
      mats.creamCeramic,
      [0, FLOOR_Y + seatBase, 0],
      { obstacle: false },
    );
    addBox(
      chair,
      `${chair.name}__BACK`,
      [seatWidth, backHeight, metresToWorldUnits(0.045)],
      mats.creamCeramic,
      [0, FLOOR_Y + backBase, seatDepth * 0.42],
      { obstacle: false },
    );
    for (const x of [-0.18, 0.18]) {
      for (const z of [-0.16, 0.16]) {
        addCylinder(
          chair,
          `${chair.name}__LEG_${x < 0 ? 'WEST' : 'EAST'}_${z < 0 ? 'FRONT' : 'REAR'}`,
          metresToWorldUnits(0.018),
          seatBase,
          mats.brushedMetal,
          [x * seatWidth, FLOOR_Y, z * seatDepth],
          6,
          false,
        );
      }
    }
  }

  if (withUmbrella) {
    const mastHeight = metresToWorldUnits(2.35) / FACILITY_VERTICAL_SCALE;
    const canopyHeight = metresToWorldUnits(0.24) / FACILITY_VERTICAL_SCALE;
    addCylinder(
      set,
      `ENTRY__E4__UMBRELLA_MAST_${index}`,
      metresToWorldUnits(0.035),
      mastHeight,
      mats.brushedMetal,
      [0, FLOOR_Y, 0],
      8,
      false,
    );
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(metresToWorldUnits(1.25), canopyHeight, 24),
      mats.paleStone,
    );
    canopy.name = `ENTRY__E4__CIRCULAR_UMBRELLA_${index}`;
    canopy.position.set(0, FLOOR_Y + mastHeight - canopyHeight * 0.5, 0);
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    canopy.userData.navObstacle = false;
    set.add(canopy);
  }

  set.userData.humanScaleMetres = {
    tableHeight: tableHeightMetres,
    tableDiameter: tableDiameterMetres,
    chairCount: 4,
    chairSeatHeight: chairSeatHeightMetres,
    chairOverallHeight: chairOverallHeightMetres,
    umbrellaHeight: withUmbrella ? 2.35 : null,
    umbrellaDiameter: withUmbrella ? 2.5 : null,
  };
}

function createRippledDiscGeometry(
  radius: number,
  radialSegments = 12,
  angularSegments = 64,
) {
  const positions: number[] = [0, 0, 0];
  const uvs: number[] = [0.5, 0.5];
  const indices: number[] = [];
  for (let ring = 1; ring <= radialSegments; ring += 1) {
    const ringRadius = radius * ring / radialSegments;
    for (let segment = 0; segment < angularSegments; segment += 1) {
      const angle = segment * Math.PI * 2 / angularSegments;
      const x = Math.cos(angle) * ringRadius;
      const y = Math.sin(angle) * ringRadius;
      positions.push(x, y, 0);
      uvs.push(0.5 + x / (radius * 2), 0.5 + y / (radius * 2));
    }
  }
  for (let segment = 0; segment < angularSegments; segment += 1) {
    indices.push(
      0,
      1 + segment,
      1 + (segment + 1) % angularSegments,
    );
  }
  for (let ring = 2; ring <= radialSegments; ring += 1) {
    const innerStart = 1 + (ring - 2) * angularSegments;
    const outerStart = 1 + (ring - 1) * angularSegments;
    for (let segment = 0; segment < angularSegments; segment += 1) {
      const next = (segment + 1) % angularSegments;
      indices.push(
        innerStart + segment,
        outerStart + segment,
        innerStart + next,
        innerStart + next,
        outerStart + segment,
        outerStart + next,
      );
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function addSawtoothRoof(parent: THREE.Object3D, prefix: string, count: number, width: number, depth: number, y: number, mat: THREE.Material) {
  for (let index = 0; index < count; index += 1) {
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(depth * 0.32, depth * 0.32, width / count, 3), mat);
    roof.name = `${prefix}__SAWTOOTH_${index + 1}`;
    roof.rotation.z = Math.PI / 2;
    roof.position.set(-width * 0.5 + width * (index + 0.5) / count, y, 0);
    roof.scale.z = 0.58;
    roof.castShadow = true;
    parent.add(roof);
  }
}

function addCurvedBlocks(
  parent: THREE.Object3D,
  prefix: string,
  count: number,
  totalWidth: number,
  depth: number,
  heights: readonly number[],
  body: THREE.Material,
  glass: THREE.Material,
) {
  for (let index = 0; index < count; index += 1) {
    const t = count === 1 ? 0 : index / (count - 1) - 0.5;
    const x = t * totalWidth;
    const z = Math.abs(t) * Math.abs(t) * depth * 0.55;
    const segmentWidth = totalWidth / count * 1.12;
    const height = heights[index % heights.length];
    const segment = addBox(parent, `${prefix}__SEGMENT_${index + 1}`, [segmentWidth, height, depth], index % 2 ? glass : body, [x, FLOOR_Y, z]);
    segment.rotation.y = -t * 0.32;
  }
}

function addPublicLandscape(group: THREE.Group, definition: DistrictDefinition, mats: Materials) {
  const welcomeLandscape = new THREE.Group();
  welcomeLandscape.name = 'ENTRY__WELCOME_LANDSCAPE';
  welcomeLandscape.position.copy(localPolar(definition, WELCOME_BUILDING_RADIUS, WELCOME_FORK_ANGLE));
  welcomeLandscape.rotation.y = -WELCOME_FORK_ANGLE * DEG - Math.PI / 2 + Math.PI;
  welcomeLandscape.userData.welcomeLandscapeRadius = WELCOME_BUILDING_RADIUS;
  welcomeLandscape.userData.roadForkRadius = WELCOME_FORK_RADIUS;
  welcomeLandscape.userData.clearOfRoadFork = true;
  group.add(welcomeLandscape);

  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(13.2, 13.2, 0.02, 48), mats.paving);
  plaza.name = 'ENTRY__WELCOME_OVAL_ARRIVAL_PLAZA';
  plaza.scale.z = 0.62;
  plaza.position.y = FLOOR_Y + 0.005;
  plaza.receiveShadow = true;
  plaza.userData.walkable = true;
  plaza.userData.navObstacle = false;
  welcomeLandscape.add(plaza);

  const arrivalLoop = new THREE.Group();
  arrivalLoop.name = 'ENTRY__WELCOME_VEHICLE_LOOP';
  arrivalLoop.userData.walkable = true;
  arrivalLoop.userData.navObstacle = false;
  arrivalLoop.userData.accessPointCount = 4;
  arrivalLoop.userData.accessDirections = ['front', 'east', 'rear', 'west'];
  const openingAngle = 18 * DEG;
  const arcLength = Math.PI * 0.5 - openingAngle;
  for (let index = 0; index < 4; index += 1) {
    const arc = new THREE.Mesh(
      new THREE.RingGeometry(
        10.15,
        11.0,
        20,
        1,
        openingAngle * 0.5 + index * Math.PI * 0.5,
        arcLength,
      ),
      mats.asphalt,
    );
    arc.name = `ENTRY__WELCOME_VEHICLE_LOOP_ARC_${index + 1}`;
    arc.rotation.x = -Math.PI * 0.5;
    arc.scale.y = 0.63;
    arc.position.y = FLOOR_Y + 0.022;
    arc.receiveShadow = true;
    arc.userData.walkable = true;
    arc.userData.navObstacle = false;
    arrivalLoop.add(arc);
  }
  welcomeLandscape.add(arrivalLoop);

  const accessPavers = [
    { name: 'FRONT', position: [0, 7.0] as const, size: [2.7, 4.6] as const },
    { name: 'REAR', position: [0, -7.0] as const, size: [2.7, 4.6] as const },
    { name: 'EAST', position: [11.0, 0] as const, size: [4.6, 2.7] as const },
    { name: 'WEST', position: [-11.0, 0] as const, size: [4.6, 2.7] as const },
  ];
  accessPavers.forEach((access) => {
    const paver = addPlane(
      welcomeLandscape,
      `ENTRY__WELCOME_LOOP_ACCESS_${access.name}`,
      access.size[0],
      access.size[1],
      mats.paleStone,
      [access.position[0], FLOOR_Y + 0.008, access.position[1]],
    );
    paver.userData.welcomeLoopAccess = access.name.toLowerCase();
  });

  const poolCentre = new THREE.Vector2(-14.4, -4.2);
  const poolFeature = new THREE.Group();
  poolFeature.name = WELCOME_POOL_GROUP_NAME;
  poolFeature.position
    .set(poolCentre.x, 0, poolCentre.y)
    .applyEuler(welcomeLandscape.rotation)
    .add(welcomeLandscape.position);
  poolFeature.rotation.copy(welcomeLandscape.rotation);
  poolFeature.userData = {
    selectableId: WELCOME_POOL_SELECTABLE_ID,
    individualSelectableId: WELCOME_POOL_SELECTABLE_ID,
    parentSelectableId: definition.id,
    districtId: definition.id,
    featureRole: 'landscape',
    featureTag: 'welcome-half-covered-pool',
    displayName: 'Welcome Half-Covered Pool',
    editable: true,
    workspace: 'landscape',
    collisionEnabled: true,
    interactions: [],
    editorBaseScale: [1, 1, 1] as const,
    poolSide: 'left',
    halfCovered: true,
    roofCoverageRatio: 0.5,
  };
  group.add(poolFeature);

  const poolWaterRadius = 0.9;
  const poolEllipseScale = 0.68;
  const poolDeck = new THREE.Mesh(
    new THREE.CylinderGeometry(1.32, 1.32, 0.024, 56),
    mats.paleStone,
  );
  poolDeck.name = 'ENTRY__WELCOME_POOL_WHITE_TERRACE_DECK';
  poolDeck.scale.z = 0.76;
  poolDeck.position.y = FLOOR_Y + 0.006;
  poolDeck.receiveShadow = true;
  poolDeck.userData.walkable = true;
  poolDeck.userData.navObstacle = false;
  poolFeature.add(poolDeck);

  const poolBasin = new THREE.Mesh(
    new THREE.RingGeometry(0.91, 1.03, 56),
    mats.whiteMetal,
  );
  poolBasin.name = 'ENTRY__WELCOME_POOL_WHITE_BASIN';
  poolBasin.rotation.x = -Math.PI * 0.5;
  poolBasin.scale.y = poolEllipseScale;
  poolBasin.position.y = FLOOR_Y + 0.045;
  poolBasin.castShadow = true;
  poolBasin.receiveShadow = true;
  poolBasin.userData.navObstacle = true;
  poolBasin.userData.poolBasin = true;
  poolFeature.add(poolBasin);

  const waterMaterial = mats.water.clone();
  waterMaterial.color.set('#20bdc4');
  waterMaterial.opacity = 0.88;
  waterMaterial.roughness = 0.16;
  waterMaterial.metalness = 0.08;
  waterMaterial.clearcoat = 0.72;
  const pool = new THREE.Mesh(createRippledDiscGeometry(poolWaterRadius), waterMaterial);
  pool.name = 'ENTRY__WELCOME_REFLECTING_POOL';
  pool.rotation.x = -Math.PI * 0.5;
  pool.scale.y = poolEllipseScale;
  pool.position.y = FLOOR_Y + 0.055;
  pool.receiveShadow = true;
  pool.userData.navObstacle = false;
  pool.userData.animate = 'welcome-pool-water';
  pool.userData.waveTime = 0;
  pool.userData.waveAmplitude = 0.006;
  pool.userData.waveRadius = poolWaterRadius;
  pool.userData.poolSide = 'left';
  pool.userData.smallWaves = true;
  pool.userData.humanScaleMetres = {
    length: 18,
    width: 12.24,
    maximumWaveHeight: 0.06,
  };
  poolFeature.add(pool);

  const halfRoof = new THREE.Mesh(
    new THREE.CylinderGeometry(1.08, 1.08, 0.055, 48, 1, false, Math.PI * 0.5, Math.PI),
    mats.whiteMetal,
  );
  halfRoof.name = 'ENTRY__WELCOME_POOL_HALF_ELLIPSE_ROOF';
  halfRoof.scale.z = 0.72;
  halfRoof.position.y = FLOOR_Y + 0.37;
  halfRoof.castShadow = true;
  halfRoof.receiveShadow = true;
  halfRoof.userData.navObstacle = false;
  halfRoof.userData.poolCover = true;
  halfRoof.userData.coverageRatio = 0.5;
  poolFeature.add(halfRoof);

  const roofSupports = [
    [-0.9, 0],
    [0.9, 0],
    [-0.64, -0.55],
    [0.64, -0.55],
  ] as const;
  roofSupports.forEach(([x, z], index) => {
    const support = addCylinder(
      poolFeature,
      `ENTRY__WELCOME_POOL_ROOF_SUPPORT_${index + 1}`,
      0.025,
      0.37,
      mats.whiteMetal,
      [x, FLOOR_Y, z],
      10,
    );
    support.userData.poolCoverSupport = true;
  });

  addWelcomeTableSet(poolFeature, 1, [1.36, 0.62], 0.2, mats);
  addWelcomeTableSet(poolFeature, 2, [0, 1.25], -0.45, mats);
  addWelcomeTableSet(poolFeature, 3, [-1.36, 0.62], 0.75, mats);
  poolFeature.userData.poolTableCount = 3;
  poolFeature.userData.poolChairCount = 9;
  poolFeature.traverse((object) => {
    object.userData.selectableId = WELCOME_POOL_SELECTABLE_ID;
    object.userData.individualSelectableId = WELCOME_POOL_SELECTABLE_ID;
    object.userData.parentSelectableId = definition.id;
    object.userData.districtId = definition.id;
  });

  for (let spoke = -3; spoke <= 3; spoke += 1) {
    const strip = addPlane(
      welcomeLandscape,
      `ENTRY__RADIAL_PAVING_LINE_${spoke + 4}`,
      0.22,
      14,
      spoke % 2 ? mats.paleStone : mats.darkPaving,
      [spoke * 1.1, FLOOR_Y + 0.006, -13.5],
      -0.14 + spoke * 0.02,
    );
    strip.userData.publicArrivalRoute = true;
  }
}

function buildBridgeheadTunnel(facility: THREE.Group, mats: Materials) {
  addBox(
    facility,
    'ENTRY__E1__WEST_BASALT_PORTAL_PIER',
    [2.1, 3.6, 2.2],
    mats.basalt,
    [-4.5, FLOOR_Y, -5.4],
    { obstacle: false },
  );
  addBox(
    facility,
    'ENTRY__E1__EAST_BASALT_PORTAL_PIER',
    [2.1, 3.6, 2.2],
    mats.basalt,
    [4.5, FLOOR_Y, -5.4],
    { obstacle: false },
  );
  addBox(
    facility,
    'ENTRY__E1__BASALT_PORTAL_HEADER',
    [11.1, 1.25, 2.2],
    mats.basalt,
    [0, FLOOR_Y + 3.35, -5.4],
    { obstacle: false },
  );
  const arch = new THREE.Mesh(new THREE.TorusGeometry(4.15, 0.22, 8, 32, Math.PI), mats.brushedMetal);
  arch.name = 'ENTRY__E1__STAINLESS_MECHANICAL_ARCH_RIB';
  arch.scale.y = 0.62;
  arch.position.set(0, FLOOR_Y + 2.3, E1_CITY_PORTAL_Z);
  facility.add(arch);
  for (const x of [-5.7, 5.7]) {
    addBox(facility, `ENTRY__E1__ILLUMINATED_PYLON_${x < 0 ? 'WEST' : 'EAST'}`, [0.5, 4.8, 0.5], mats.coolLight, [x, FLOOR_Y, -5.8]);
  }
  const tunnelCentreZ = (E1_CITY_PORTAL_Z + E1_ISLAND_PORTAL_Z) * 0.5;
  const tunnelLength = E1_ISLAND_PORTAL_Z - E1_CITY_PORTAL_Z;
  addBox(
    facility,
    'ENTRY__E1__PLANTED_ACOUSTIC_RIDGE',
    [17, 1.2, tunnelLength],
    mats.grass,
    [0, FLOOR_Y + 3.8, tunnelCentreZ],
    { obstacle: false },
  );
  for (const x of [-4.75, 4.75]) {
    addBox(
      facility,
      `ENTRY__E1__LONG_TUNNEL_SIDEWALL_${x < 0 ? 'WEST' : 'EAST'}`,
      [1.35, 3.35, tunnelLength],
      mats.basalt,
      [x, FLOOR_Y, tunnelCentreZ],
      { obstacle: false },
    );
  }
  // Rotating long wall meshes makes their world-axis AABBs overlap the open
  // center lane. WALK therefore uses local edge segments instead of those
  // coarse boxes: narrow portal clearances at the city threshold, followed by
  // the full-width tunnel walls. This keeps W-key travel centered while still
  // preventing players from passing through either visible wall.
  const collisionY = FLOOR_Y + 0.1;
  facility.userData.navBarrierSegments = [
    { start: [-3.45, collisionY, -6.5], end: [-3.45, collisionY, -4.3], radius: 0.055 },
    { start: [3.45, collisionY, -6.5], end: [3.45, collisionY, -4.3], radius: 0.055 },
    { start: [-4.075, collisionY, -4.3], end: [-4.075, collisionY, E1_ISLAND_PORTAL_Z], radius: 0.055 },
    { start: [4.075, collisionY, -4.3], end: [4.075, collisionY, E1_ISLAND_PORTAL_Z], radius: 0.055 },
  ];
  for (let index = 0; index < 15; index += 1) {
    addCylinder(
      facility,
      `ENTRY__E1__RIDGE_SHRUB_${index + 1}`,
      0.36 + (index % 3) * 0.12,
      0.6 + (index % 2) * 0.3,
      mats.shrub,
      [-6.5 + (index % 9) * 1.6, FLOOR_Y + 5.0, -3.8 + Math.floor(index / 5) * 7.8 + (index % 3) * 1.15],
      10,
      false,
    );
  }
  addBox(
    facility,
    'ENTRY__E1__ISLAND_SIDE_PALE_PORTAL',
    [10.8, 0.52, 0.55],
    mats.paleStone,
    [0, FLOOR_Y + 3.35, E1_ISLAND_PORTAL_Z - 0.25],
    { obstacle: false },
  );
  const gateSign = addSign(facility, 'ENTRY__E1__YOUTOPY_GATE_LETTERING', 'YOUTOPY', 'ISLAND GATE', [6.8, 1.15], [0, FLOOR_Y + 4.35, -6.65], true);
  gateSign.rotation.y = Math.PI;
  facility.userData.tunnelSightline = {
    cityFacingAxis: [0, 0, -1],
    clearWidth: 7.4,
    clearHeight: 3.35,
    tunnelLength,
    cityPortalZ: E1_CITY_PORTAL_Z,
    islandPortalZ: E1_ISLAND_PORTAL_Z,
    opaqueClosure: false,
  };
}

function buildWelcomeHall(facility: THREE.Group, mats: Materials) {
  const base = addCylinder(facility, 'ENTRY__E2__ELLIPTICAL_PALE_STONE_BASE', 6.5, 0.8, mats.paleStone, [0, FLOOR_Y, 0], 48);
  base.scale.z = 0.68;
  base.userData.navObstacle = false;
  base.userData.walkable = true;
  base.userData.preventUnderwalk = true;
  base.userData.surfaceKind = 'stone';
  base.userData.libraryRoom = 'welcome-registration-hall';

  const glassRadiusX = 6.1;
  const glassRadiusZ = 3.9;
  const doorwayHalfWidth = 2.35;
  const glassPanelCount = 40;
  const glassPanelStep = Math.PI * 2 / glassPanelCount;
  for (let index = 0; index < glassPanelCount; index += 1) {
    const angle = index * glassPanelStep;
    const nextAngle = (index + 1) * glassPanelStep;
    const midpoint = angle + glassPanelStep * 0.5;
    const x = Math.cos(midpoint) * glassRadiusX;
    const z = Math.sin(midpoint) * glassRadiusZ;
    if (z > glassRadiusZ * 0.76 && Math.abs(x) < doorwayHalfWidth + 0.2) continue;
    const tangentX = -glassRadiusX * Math.sin(midpoint);
    const tangentZ = glassRadiusZ * Math.cos(midpoint);
    const tangentLength = Math.hypot(tangentX, tangentZ);
    const chordStart = new THREE.Vector2(
      Math.cos(angle) * glassRadiusX,
      Math.sin(angle) * glassRadiusZ,
    );
    const chordEnd = new THREE.Vector2(
      Math.cos(nextAngle) * glassRadiusX,
      Math.sin(nextAngle) * glassRadiusZ,
    );
    const panel = addBox(
      facility,
      `ENTRY__E2__TRANSPARENT_GLASS_DRUM_PANEL_${index + 1}`,
      [chordStart.distanceTo(chordEnd) * 1.04, 2.7, 0.11],
      mats.glass,
      [x, FLOOR_Y + 0.8, z],
      { obstacle: false },
    );
    panel.rotation.y = Math.atan2(-tangentZ / tangentLength, tangentX / tangentLength);
  }

  const roof = addCylinder(facility, 'ENTRY__E2__FLOATING_ELLIPTICAL_ROOF', 7.6, 0.2, mats.whiteMetal, [0, FLOOR_Y + 3.55, 0], 48);
  roof.scale.z = 0.69;
  roof.rotation.x = -0.035;
  roof.userData.navObstacle = false;
  const dnaColumnAngles = [18, 32, 46, 60, 120, 134, 148, 162];
  dnaColumnAngles.forEach((angleDegrees, index) => {
    const angle = angleDegrees * DEG;
    addGroundedDnaColumn(
      facility,
      `ENTRY__E2__WHITE_DNA_COLUMN_${index + 1}`,
      [Math.cos(angle) * 6.68, Math.sin(angle) * 4.22],
      FLOOR_Y + 3.52,
      mats.whitePaint,
    );
  });
  addBox(facility, 'ENTRY__E2__DEEP_ENTRANCE_CANOPY', [5.4, 0.18, 3.2], mats.bronze, [0, FLOOR_Y + 2.65, 4.55]);
  addBox(facility, 'ENTRY__E2__DIGITAL_INFORMATION_BAND', [11.8, 0.24, 0.1], mats.warmLight, [0, FLOOR_Y + 3.25, 4.05], { obstacle: false });

  const stairCount = 11;
  const stairDepth = 0.36;
  const stairWidth = 4.85;
  const staircaseOuterEdge = 7.45;
  const roadTopLocal = (
    ROAD_SURFACE_TOP + WELCOME_APRON_SURFACE_OFFSET
  ) / FACILITY_VERTICAL_SCALE;
  const finishedFloorLocal = FLOOR_Y + 0.8;
  const stairRiseLocal = (finishedFloorLocal - roadTopLocal) / stairCount;
  const staircase = new THREE.Group();
  staircase.name = 'ENTRY__E2__WHITE_ENTRY_STAIRCASE';
  staircase.userData.walkableStaircase = true;
  staircase.userData.stepCount = stairCount;
  staircase.userData.worldRiserHeight = stairRiseLocal * FACILITY_VERTICAL_SCALE;
  staircase.userData.startsAtRoadTop = ROAD_SURFACE_TOP + WELCOME_APRON_SURFACE_OFFSET;
  staircase.userData.endsAtFinishedFloor = finishedFloorLocal * FACILITY_VERTICAL_SCALE;
  facility.add(staircase);
  for (let index = 0; index < stairCount; index += 1) {
    const stepTop = roadTopLocal + stairRiseLocal * (index + 1);
    const step = addBox(
      staircase,
      `ENTRY__E2__WHITE_ENTRY_STEP_${index + 1}`,
      [stairWidth, stepTop, stairDepth],
      mats.whiteMetal,
      [0, 0, staircaseOuterEdge - (index + 0.5) * stairDepth],
      { obstacle: false, walkable: true },
    );
    step.userData.stairStep = index + 1;
    step.userData.stepTopLocal = stepTop;
    step.userData.riserWorld = stairRiseLocal * FACILITY_VERTICAL_SCALE;
    step.userData.surfaceKind = 'stone';
  }

  // Keep the white steps as the visible construction, but give WALK one
  // continuous shallow surface. This removes the tiny tread-edge gaps through
  // which the ground ray could otherwise select terrain below the podium.
  const staircaseInnerEdge = staircaseOuterEdge - stairCount * stairDepth;
  const navigationOuterEdge = staircaseOuterEdge + 0.25;
  const navigationInnerEdge = staircaseInnerEdge - 0.25;
  const stairNavigationGeometry = new THREE.BufferGeometry();
  stairNavigationGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([
      -stairWidth * 0.5, roadTopLocal + 0.002, navigationOuterEdge,
      stairWidth * 0.5, roadTopLocal + 0.002, navigationOuterEdge,
      stairWidth * 0.5, finishedFloorLocal + 0.002, navigationInnerEdge,
      -stairWidth * 0.5, finishedFloorLocal + 0.002, navigationInnerEdge,
    ], 3),
  );
  stairNavigationGeometry.setIndex([0, 2, 1, 0, 3, 2]);
  stairNavigationGeometry.computeVertexNormals();
  const stairNavigationSurface = new THREE.Mesh(
    stairNavigationGeometry,
    new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0,
      colorWrite: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  stairNavigationSurface.name = 'ENTRY__E2__CONTINUOUS_STAIR_NAVIGATION_SURFACE';
  stairNavigationSurface.userData.walkable = true;
  stairNavigationSurface.userData.navObstacle = false;
  stairNavigationSurface.userData.surfaceKind = 'stone';
  stairNavigationSurface.userData.navigationRiseWorld = (
    finishedFloorLocal - roadTopLocal
  ) * FACILITY_VERTICAL_SCALE;
  staircase.add(stairNavigationSurface);

  // This invisible volume is not a collider. It identifies the one deliberate
  // route through the raised podium so the global under-walk guard can reject
  // every other lower-layer position beneath the Hall without blocking the
  // visible staircase or its continuous navigation surface.
  const stairAccessDepth = navigationOuterEdge - navigationInnerEdge;
  const stairAccess = addBox(
    staircase,
    'ENTRY__E2__STAIRCASE_NAVIGATION_ACCESS',
    [
      stairWidth + WALK_RADIUS * 2,
      2.8,
      stairAccessDepth + WALK_RADIUS * 2,
    ],
    mats.paleStone,
    [
      0,
      roadTopLocal - 0.05,
      (navigationOuterEdge + navigationInnerEdge) * 0.5,
    ],
    { obstacle: false, castShadow: false },
  );
  stairAccess.visible = false;
  stairAccess.userData.navAccess = true;
  stairAccess.userData.allowUnderwalk = true;
  stairAccess.userData.accessKind = 'welcome-hall-staircase';

  for (const side of [-1, 1]) {
    const leaf = addBox(
      facility,
      `ENTRY__E2__AUTOMATIC_SLIDING_DOOR_${side < 0 ? 'WEST' : 'EAST'}`,
      [1.0, 2.42, 0.08],
      mats.glass,
      [side * 2.88, FLOOR_Y + 0.8, glassRadiusZ + 0.035],
      { obstacle: false, castShadow: false },
    );
    leaf.userData.open = true;
    leaf.userData.slidClearOfDoorway = true;
    addBox(
      facility,
      `ENTRY__E2__DOOR_FRAME_${side < 0 ? 'WEST' : 'EAST'}`,
      [0.14, 2.7, 0.16],
      mats.whiteMetal,
      [side * doorwayHalfWidth, FLOOR_Y + 0.8, glassRadiusZ + 0.02],
      { obstacle: false },
    );
  }
  addBox(
    facility,
    'ENTRY__E2__DOOR_HEADER',
    [doorwayHalfWidth * 2 + 0.14, 0.16, 0.16],
    mats.whiteMetal,
    [0, FLOOR_Y + 3.36, glassRadiusZ + 0.02],
    { obstacle: false },
  );
  const doorThreshold = addPlane(
    facility,
    'ENTRY__E2__WELCOME_DOOR_THRESHOLD',
    doorwayHalfWidth * 2 - 0.2,
    1.25,
    mats.paleStone,
    [0, FLOOR_Y + 0.77, glassRadiusZ + 0.35],
  );
  doorThreshold.userData.welcomeDoor = true;

  const collisionGuide = new THREE.Group();
  collisionGuide.name = 'ENTRY__E2__PRECISE_ELLIPTICAL_WALL_COLLISION';
  const barrierSegments: Array<{ start: [number, number, number]; end: [number, number, number]; radius: number }> = [];
  const collisionY = FLOOR_Y + 0.82;
  for (let index = 0; index < glassPanelCount; index += 1) {
    const angle = index * glassPanelStep;
    const nextAngle = (index + 1) * glassPanelStep;
    const midpoint = angle + glassPanelStep * 0.5;
    const midpointX = Math.cos(midpoint) * glassRadiusX;
    const midpointZ = Math.sin(midpoint) * glassRadiusZ;
    if (midpointZ > glassRadiusZ * 0.76 && Math.abs(midpointX) < doorwayHalfWidth + 0.2) continue;
    barrierSegments.push({
      start: [Math.cos(angle) * glassRadiusX, collisionY, Math.sin(angle) * glassRadiusZ],
      end: [Math.cos(nextAngle) * glassRadiusX, collisionY, Math.sin(nextAngle) * glassRadiusZ],
      radius: 0.055,
    });
  }
  collisionGuide.userData.navBarrierSegments = barrierSegments;
  collisionGuide.userData.doorwayGapWidth = doorwayHalfWidth * 2 - 0.2;
  facility.add(collisionGuide);

  // The glass-wall collision begins above the podium. These two lower,
  // precise elliptical rings keep a 1.7 m WALK body out of the base while
  // preserving the opening aligned with the staircase and clear door.
  const podiumCollision = new THREE.Group();
  podiumCollision.name = 'ENTRY__E2__PRECISE_PODIUM_COLLISION';
  const podiumBarrierSegments: Array<{
    start: [number, number, number];
    end: [number, number, number];
    radius: number;
  }> = [];
  const podiumRadiusX = 6.45;
  const podiumRadiusZ = 4.38;
  const stairOpeningRightAngle = Math.acos((stairWidth * 0.5) / podiumRadiusX);
  const stairOpeningLeftAngle = Math.PI - stairOpeningRightAngle;
  const podiumAngles = Array.from(
    new Set([
      ...Array.from({ length: glassPanelCount }, (_, index) => index * glassPanelStep),
      stairOpeningRightAngle,
      stairOpeningLeftAngle,
    ].map((angle) => Number(angle.toFixed(12)))),
  ).sort((a, b) => a - b);
  for (const barrierY of [FLOOR_Y + 0.23, FLOOR_Y + 0.5]) {
    for (let index = 0; index < podiumAngles.length; index += 1) {
      const angle = podiumAngles[index];
      const nextAngle = index === podiumAngles.length - 1
        ? podiumAngles[0] + Math.PI * 2
        : podiumAngles[index + 1];
      const midpoint = (angle + nextAngle) * 0.5;
      if (midpoint > stairOpeningRightAngle && midpoint < stairOpeningLeftAngle) continue;
      podiumBarrierSegments.push({
        start: [Math.cos(angle) * podiumRadiusX, barrierY, Math.sin(angle) * podiumRadiusZ],
        end: [Math.cos(nextAngle) * podiumRadiusX, barrierY, Math.sin(nextAngle) * podiumRadiusZ],
        radius: 0.055,
      });
    }
  }
  podiumCollision.userData.navBarrierSegments = podiumBarrierSegments;
  podiumCollision.userData.stairOpeningWidth = stairWidth;
  podiumCollision.userData.preventsUnderPodiumAccess = true;
  facility.add(podiumCollision);

  const interior = buildWelcomeRegistrationInterior(facility, {
    floorY: FLOOR_Y + 0.8,
    verticalScale: FACILITY_VERTICAL_SCALE,
    frontDoorZ: glassRadiusZ,
  });
  const legacyInteriorDirectory = addSign(
    interior,
    'ENTRY__E2__INTERIOR_WELCOME_DIRECTORY',
    'WELCOME',
    'REGISTRATION  ·  ORIENTATION',
    [3.2, 0.36],
    [0, FLOOR_Y + 1.42, -3.55],
    true,
  );
  legacyInteriorDirectory.visible = false;
  legacyInteriorDirectory.removeFromParent();
  facility.userData.footprint = [13.0, 8.4];
  facility.userData.accessibleInWalk = true;
  facility.userData.authoredInterior = true;
  facility.userData.welcomeDoorCount = 1;
  facility.userData.welcomeDnaColumnCount = dnaColumnAngles.length;
  facility.userData.welcomeEntryStairCount = stairCount;
}

function usePreciseEntryExteriorCollision(facility: THREE.Group, code: string) {
  const preciseCollisionGuide = `ENTRY__${code}__PRECISE_INTERIOR_WALL_COLLISION`;
  const disabledAggregateObstacles: string[] = [];
  facility.traverse((object) => {
    if (object === facility || object.userData.navObstacle !== true) return;
    object.userData.navObstacle = false;
    object.userData.aggregateCollisionDisabled = true;
    object.userData.preciseCollisionGuide = preciseCollisionGuide;
    disabledAggregateObstacles.push(object.name);
  });
  facility.userData.entryExteriorCollisionPolicy = 'precise-doorway-barriers';
  facility.userData.preciseExteriorCollisionGuide = preciseCollisionGuide;
  facility.userData.disabledAggregateExteriorObstacles = disabledAggregateObstacles;
  facility.userData.disabledAggregateExteriorObstacleCount = disabledAggregateObstacles.length;
  facility.userData.aggregateExteriorObstacleCount = 0;
}

function buildTransitPavilion(facility: THREE.Group, mats: Materials) {
  addBox(facility, 'ENTRY__E3__TRANSIT_GLASS_WINDSCREEN', [18, 2.2, 3.8], mats.glass, [0, FLOOR_Y, 0]);
  for (let index = 0; index < 5; index += 1) {
    const x = -7.2 + index * 3.6;
    const roof = addBox(facility, `ENTRY__E3__WING_ROOF_PANEL_${index + 1}`, [4.2, 0.18, 7.4], mats.whiteMetal, [x, FLOOR_Y + 2.55 + Math.abs(index - 2) * 0.28, 0]);
    roof.rotation.z = (index - 2) * 0.025;
    addCylinder(facility, `ENTRY__E3__IRREGULAR_WHITE_COLUMN_${index + 1}`, 0.13, 2.5, mats.whiteMetal, [x + (index % 2 ? 0.65 : -0.45), FLOOR_Y, 0.7], 10);
  }
  for (let index = 0; index < 7; index += 1) addBox(facility, `ENTRY__E3__PHOTOVOLTAIC_BAND_${index + 1}`, [1.5, 0.06, 4.6], mats.darkGlass, [-6 + index * 2, FLOOR_Y + 3.5 + Math.abs(index - 3) * 0.12, -0.15], { obstacle: false });
  for (let index = 0; index < 5; index += 1) addBox(facility, `ENTRY__E3__ROUTE_PYLON_${index + 1}`, [0.34, 1.8, 0.34], mats.coolLight, [-7.2 + index * 3.6, FLOOR_Y, 2.65], { obstacle: false });
  usePreciseEntryExteriorCollision(facility, 'E3');
}

function buildCafe(facility: THREE.Group, mats: Materials) {
  const serviceWall = addBox(
    facility,
    'ENTRY__E4__FLUTED_CERAMIC_SERVICE_WALL',
    [8.4, 2.7, 1.2],
    mats.creamCeramic,
    [0, FLOOR_Y, -2.4],
    { obstacle: false },
  );
  const glassPavilion = addBox(
    facility,
    'ENTRY__E4__LOW_IRON_GLASS_PAVILION',
    [8.4, 2.65, 4.8],
    mats.glass,
    [0, FLOOR_Y, 0],
    { obstacle: false },
  );
  const cafeRoof = addBox(
    facility,
    'ENTRY__E4__HOVERING_BRONZE_ROOF',
    [9.4, 0.14, 5.8],
    mats.darkBronze,
    [0, FLOOR_Y + 2.65, 0],
    { obstacle: false },
  );
  for (const shell of [serviceWall, glassPavilion, cafeRoof]) {
    shell.userData.aggregateCollisionDisabled = true;
    shell.userData.preciseCollisionGuide = 'ENTRY__E4__PRECISE_INTERIOR_WALL_COLLISION';
  }
  facility.userData.cafeUsesPreciseDoorwayCollision = true;
  facility.userData.cafeAggregateObstacleCount = 0;
  addPlane(facility, 'ENTRY__E4__OPEN_CAFE_TERRACE', 11.2, 5.5, mats.paleStone, [0, FLOOR_Y + 0.01, 5.0]);
  const terraceTablePositions = [
    [-3.7, 3.75], [3.7, 3.75],
    [-3.7, 5.15], [3.7, 5.15],
    [-3.7, 6.55], [3.7, 6.55],
  ] as const;
  terraceTablePositions.forEach((position, index) => {
    addCafeTerraceTableSet(
      facility,
      index + 1,
      position,
      mats,
      index === 0 || index === 3 || index === 4,
    );
  });
  facility.userData.cafeTerraceTableCount = 6;
  facility.userData.cafeTerraceChairCount = 24;
  facility.userData.cafeTerraceHumanScale = true;
  facility.userData.cafeCentralAisleWidthMetres = 50;
  const planterHeight = metresToWorldUnits(0.46) / FACILITY_VERTICAL_SCALE;
  const planterPositions = [
    [-5.05, 3.0], [-5.05, 4.45], [-5.05, 5.9], [-5.05, 7.15],
    [5.05, 3.0], [5.05, 4.45], [5.05, 5.9], [5.05, 7.15],
  ] as const;
  planterPositions.forEach(([x, z], index) => {
    const planter = addBox(
      facility,
      `ENTRY__E4__HERB_PLANTER_${index + 1}`,
      [metresToWorldUnits(0.42), planterHeight, metresToWorldUnits(1.15)],
      mats.darkBronze,
      [x, FLOOR_Y, z],
      { obstacle: false },
    );
    planter.userData.perimeterPlanter = true;
    planter.userData.clearOfCafeDoor = true;
    for (let herbIndex = 0; herbIndex < 3; herbIndex += 1) {
      const herbHeightMetres = 0.24 + herbIndex * 0.05;
      const herb = addCylinder(
        facility,
        `ENTRY__E4__PLANTER_GRASS_${index + 1}_${herbIndex + 1}`,
        metresToWorldUnits(0.12 + herbIndex * 0.015),
        metresToWorldUnits(herbHeightMetres) / FACILITY_VERTICAL_SCALE,
        mats.shrub,
        [x, FLOOR_Y + planterHeight, z + (herbIndex - 1) * metresToWorldUnits(0.32)],
        10,
        false,
      );
      herb.userData.perimeterPlanter = true;
      herb.userData.clearOfCafeDoor = true;
    }
  });
  facility.userData.cafePerimeterPlanterCount = planterPositions.length;
  facility.userData.cafePlantersNonBlocking = true;
  const wordmark = addSign(
    facility,
    'ENTRY__E4__CAFE_WORDMARK',
    'CLEARLINE',
    'CAFE',
    [2.6, 0.58],
    [-2.7, FLOOR_Y + 2.0, 2.48],
  );
  wordmark.userData.clearOfCafeDoor = true;
  wordmark.userData.facadeMount = 'west of entrance';
  facility.userData.cafeWordmarkClearOfDoor = true;
}

function buildMall(facility: THREE.Group, mats: Materials) {
  addCurvedBlocks(facility, 'ENTRY__E5__RINGWALK_GALLERIA', 7, 25, 8.4, [4.6, 5.0, 5.4, 5.7, 5.4, 5.0, 4.4], mats.paleStone, mats.glass);
  for (const x of [-8.2, 0, 8.2]) {
    addBox(facility, `ENTRY__E5__VERTICAL_GLASS_ATRIUM_${x + 9}`, [2.2, 5.8, 8.8], mats.glass, [x, FLOOR_Y, 0.8]);
  }
  addBox(facility, 'ENTRY__E5__CONTINUOUS_GROUND_CANOPY', [26.5, 0.18, 2.4], mats.bronze, [0, FLOOR_Y + 1.45, 5.25]);
  for (let index = 0; index < 5; index += 1) addBox(facility, `ENTRY__E5__CURVED_MECHANICAL_SCREEN_${index + 1}`, [3.6, 0.8, 0.16], mats.brushedMetal, [-8 + index * 4, FLOOR_Y + 5.8 - Math.abs(index - 2) * 0.28, -1.0], { obstacle: false });
  for (const x of [-8.2, 8.2]) addSign(facility, `ENTRY__E5__SUSPENDED_ENTRANCE_SIGN_${x < 0 ? 'WEST' : 'EAST'}`, 'RINGWALK', 'GALLERIA', [4.2, 0.85], [x, FLOOR_Y + 3.1, 5.26], true);
  facility.children.forEach((object) => {
    if (
      object.name.startsWith('ENTRY__E5__RINGWALK_GALLERIA__SEGMENT_')
      || object.name.startsWith('ENTRY__E5__VERTICAL_GLASS_ATRIUM_')
      || object.name === 'ENTRY__E5__CONTINUOUS_GROUND_CANOPY'
    ) {
      object.userData.hideWhenRuntimeInteriorVisible = true;
    }
  });
  usePreciseEntryExteriorCollision(facility, 'E5');
}

function buildFashionClub(facility: THREE.Group, mats: Materials) {
  const clubVolume = addBox(
    facility,
    'ENTRY__E6__BLACK_STAINLESS_CLUB_VOLUME',
    [13.5, 4.8, 5.2],
    mats.blackSteel,
    [0, FLOOR_Y, 0],
    { obstacle: false },
  );
  addWindowRhythm(facility, 'ENTRY__E6__SMOKED_GLASS', 12, 11.7, FLOOR_Y + 0.55, 2.64, 3.6, mats.darkGlass);
  for (let index = 0; index < 15; index += 1) {
    const x = -6.3 + index * 0.9;
    const fin = addBox(facility, `ENTRY__E6__FOLDED_FACADE_WAVE_${index + 1}`, [0.11, 4.5, 0.42], index % 3 ? mats.darkBronze : mats.warmLight, [x, FLOOR_Y + 0.15, 2.82], { obstacle: false });
    fin.rotation.y = Math.sin(index * 0.9) * 0.22;
  }
  addPlane(facility, 'ENTRY__E6__ILLUMINATED_EXTERIOR_RUNWAY', 3.1, 22, mats.darkPaving, [0, FLOOR_Y + 0.03, 13.2]);
  for (const x of [-1.42, 1.42]) addBox(facility, `ENTRY__E6__RUNWAY_LIGHT_STRIP_${x < 0 ? 'WEST' : 'EAST'}`, [0.08, 0.035, 22], mats.warmLight, [x, FLOOR_Y + 0.06, 13.2], { obstacle: false, castShadow: false });
  const clubCanopy = addBox(
    facility,
    'ENTRY__E6__LIGHTING_TRUSS_CANOPY',
    [7.2, 0.25, 3.2],
    mats.blackSteel,
    [0, FLOOR_Y + 4.0, 4.15],
    { obstacle: false },
  );
  for (const shell of [clubVolume, clubCanopy]) {
    shell.userData.aggregateCollisionDisabled = true;
    shell.userData.preciseCollisionGuide = 'ENTRY__E6__PRECISE_INTERIOR_WALL_COLLISION';
  }
  facility.userData.fashionClubUsesPreciseDoorwayCollision = true;
  facility.userData.fashionClubAggregateObstacleCount = 0;
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(7.8, 2.8, 0.2)), new THREE.LineBasicMaterial({ color: '#f4c27a' }));
  frame.name = 'ENTRY__E6__TILTED_ILLUMINATED_ROOF_FRAME';
  frame.position.set(2.1, FLOOR_Y + 6.0, -0.5);
  frame.rotation.z = -0.16;
  facility.add(frame);
}

function buildArcade(facility: THREE.Group, mats: Materials) {
  addBox(facility, 'ENTRY__E7__WEATHERED_RED_BRICK_SHELL', [11.5, 4.3, 7.2], mats.brick, [0, FLOOR_Y, 0]);
  addBox(facility, 'ENTRY__E7__PRESSED_METAL_CANOPY', [12.1, 0.22, 2.0], mats.darkBronze, [0, FLOOR_Y + 2.0, 4.2]);
  for (let index = 0; index < 7; index += 1) {
    const x = -4.5 + index * 1.5;
    addCylinder(facility, `ENTRY__E7__ARCADE_BULB_${index + 1}`, 0.07, 0.08, mats.warmLight, [x, FLOOR_Y + 2.16, 5.24], 10, false).rotation.x = Math.PI / 2;
  }
  addWindowRhythm(facility, 'ENTRY__E7__UPPER_ARCHED', 6, 9.2, FLOOR_Y + 2.6, 3.64, 1.1, mats.creamCeramic);
  for (let index = 0; index < 4; index += 1) addBox(facility, `ENTRY__E7__BROAD_ARCH_OPENING_${index + 1}`, [1.8, 1.75, 0.12], mats.darkGlass, [-4.3 + index * 2.85, FLOOR_Y + 0.2, 3.66], { obstacle: false });
  const blade = addSign(facility, 'ENTRY__E7__VERTICAL_ARCADE_SIGN', 'A R C A D E', 'OLD CIRCUIT', [5.3, 1.0], [5.9, FLOOR_Y + 4.8, 3.1], true);
  blade.rotation.z = Math.PI / 2;
  addBox(facility, 'ENTRY__E7__ROOF_WATER_TANK', [2.2, 1.0, 2.0], mats.darkBronze, [-2.8, FLOOR_Y + 4.3, -1.0]);
  usePreciseEntryExteriorCollision(facility, 'E7');
}

function buildHotel(facility: THREE.Group, mats: Materials) {
  addCurvedBlocks(facility, 'ENTRY__E8__BRIDGEVIEW_CRESCENT', 7, 24, 7.4, [3.8, 5.4, 6.8, 8.2, 6.8, 5.4, 3.8], mats.warmStone, mats.darkGlass);
  const baseDoorWidth = 4.1;
  const baseWingWidth = (25 - baseDoorWidth) * 0.5;
  for (const side of [-1, 1]) {
    const baseWing = addBox(
      facility,
      `ENTRY__E8__PALE_STONE_BASE_${side < 0 ? 'WEST' : 'EAST'}_WING`,
      [baseWingWidth, 1.8, 8.0],
      mats.paleStone,
      [side * (baseDoorWidth * 0.5 + baseWingWidth * 0.5), FLOOR_Y, 0.7],
    );
    baseWing.userData.hotelEntranceOpening = true;
    baseWing.userData.hideWhenRuntimeInteriorVisible = true;
  }
  addVerticalFins(facility, 'ENTRY__E8__BRONZE_VERTICAL', 23, 22, FLOOR_Y + 1.8, 4.76, 5.4, mats.bronze);
  for (let index = 0; index < 9; index += 1) addBox(facility, `ENTRY__E8__CITY_BALCONY_${index + 1}`, [1.6, 0.1, 0.72], mats.brushedMetal, [-9.6 + index * 2.4, FLOOR_Y + 3.0 + (index % 3) * 1.1, 5.0], { obstacle: false });
  const canopy = addBox(
    facility,
    'ENTRY__E8__POLISHED_DROP_OFF_CANOPY',
    [9.2, 0.22, 4.0],
    mats.brushedMetal,
    [0, FLOOR_Y + 2.2, 6.2],
    { obstacle: false },
  );
  canopy.userData.clearWalkApproach = true;
  addBox(facility, 'ENTRY__E8__ILLUMINATED_CROWN', [9.5, 0.2, 0.25], mats.warmLight, [0, FLOOR_Y + 8.15, -1.4], { obstacle: false });
  facility.children.forEach((object) => {
    if (object.name.startsWith('ENTRY__E8__BRIDGEVIEW_CRESCENT__SEGMENT_')) {
      object.userData.hideWhenRuntimeInteriorVisible = true;
    }
  });
  usePreciseEntryExteriorCollision(facility, 'E8');
}

function buildMarket(facility: THREE.Group, mats: Materials) {
  addBox(facility, 'ENTRY__E9__DOCK_MARKET_BRICK_HALL', [19, 3.2, 9.6], mats.brick, [0, FLOOR_Y, 0]);
  addSawtoothRoof(facility, 'ENTRY__E9__MARKET', 6, 19, 9.6, FLOOR_Y + 3.55, mats.blackSteel);
  addWindowRhythm(facility, 'ENTRY__E9__MULTIPANE', 10, 16.5, FLOOR_Y + 0.7, 4.84, 1.6, mats.glass);
  for (let index = 0; index < 5; index += 1) {
    addBox(facility, `ENTRY__E9__SLIDING_MARKET_DOOR_${index + 1}`, [2.5, 2.25, 0.13], mats.darkGlass, [-7.2 + index * 3.6, FLOOR_Y, 4.86], { obstacle: false });
    const awning = addBox(facility, `ENTRY__E9__STRIPED_RETRACTABLE_AWNING_${index + 1}`, [2.8, 0.12, 1.5], index % 2 ? mats.paleStone : mats.brick, [-7.2 + index * 3.6, FLOOR_Y + 2.25, 5.5], { obstacle: false });
    awning.rotation.x = -0.18;
  }
  addBox(facility, 'ENTRY__E9__CLOCK_TOWER', [3.0, 7.0, 3.0], mats.brick, [7.2, FLOOR_Y, -2.8]);
  for (const side of [3.81, -3.81]) addSign(facility, `ENTRY__E9__CLOCK_FACE_${side > 0 ? 'SOUTH' : 'NORTH'}`, '12', 'DOCK MARKET', [2.0, 1.25], [7.2, FLOOR_Y + 5.5, side]);
  usePreciseEntryExteriorCollision(facility, 'E9');
}

function buildShowcase(facility: THREE.Group, mats: Materials) {
  const shell = addCylinder(facility, 'ENTRY__E10__LOW_CIRCULAR_SHOWCASE_SHELL', 6.8, 2.4, mats.whiteMetal, [0, FLOOR_Y, 0], 48);
  shell.userData.hideWhenRuntimeInteriorVisible = true;
  addBox(facility, 'ENTRY__E10__PUBLIC_GLASS_ENTRANCE', [3.2, 2.05, 0.16], mats.darkGlass, [0, FLOOR_Y + 0.12, 6.84], { obstacle: false });
  addBox(facility, 'ENTRY__E10__PUBLIC_ENTRANCE_CANOPY', [4.4, 0.16, 1.8], mats.brushedMetal, [0, FLOOR_Y + 2.15, 7.35], { obstacle: false });
  for (let index = 0; index < 6; index += 1) {
    const angle = index / 6 * Math.PI * 2;
    const arc = new THREE.Mesh(new THREE.TorusGeometry(5.4 + (index % 2) * 0.45, 0.32, 8, 24, Math.PI * 0.72), index % 2 ? mats.paleStone : mats.whiteMetal);
    arc.name = `ENTRY__E10__OVERLAPPING_MOLECULAR_ARC_${index + 1}`;
    arc.rotation.x = Math.PI / 2;
    arc.rotation.z = angle;
    arc.position.y = FLOOR_Y + 1.5 + (index % 2) * 0.34;
    arc.userData.navObstacle = false;
    arc.userData.hideWhenRuntimeInteriorVisible = true;
    facility.add(arc);
  }
  const lantern = addCylinder(facility, 'ENTRY__E10__CENTRAL_GLASS_LANTERN', 2.0, 2.3, mats.glass, [0, FLOOR_Y + 2.4, 0], 28);
  lantern.scale.y = 0.72;
  lantern.userData.hideWhenRuntimeInteriorVisible = true;

  const channelRadius = 7.4;
  const entranceGapDegrees = 64;
  const gapHalfAngle = entranceGapDegrees * DEG * 0.5;
  const channelStartAngle = Math.PI * 0.5 + gapHalfAngle;
  const channelEndAngle = Math.PI * 2.5 - gapHalfAngle;
  const channelPointCount = 65;
  const channelPoints = Array.from({ length: channelPointCount }, (_, index) => {
    const angle = THREE.MathUtils.lerp(channelStartAngle, channelEndAngle, index / (channelPointCount - 1));
    return new THREE.Vector3(
      Math.cos(angle) * channelRadius,
      FLOOR_Y + 0.08,
      Math.sin(angle) * channelRadius,
    );
  });
  const channel = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(channelPoints),
      96,
      0.34,
      8,
      false,
    ),
    mats.water,
  );
  channel.name = 'ENTRY__E10__C_SHAPED_WATER_CHANNEL';
  channel.userData.navObstacle = false;
  channel.userData.hideWhenRuntimeInteriorVisible = true;
  channel.userData.entranceGapDegrees = entranceGapDegrees;
  channel.userData.entranceGapWidth = 2 * channelRadius * Math.sin(gapHalfAngle);
  channel.userData.entranceDirection = [0, 0, 1];
  channel.userData.clearOfPublicEntrance = true;
  facility.add(channel);

  const collisionGuide = new THREE.Group();
  collisionGuide.name = 'ENTRY__E10__PRECISE_WATER_CHANNEL_COLLISION';
  collisionGuide.userData.navBarrierSegments = channelPoints.slice(1).map((point, index) => ({
    start: [channelPoints[index].x, FLOOR_Y + 0.1, channelPoints[index].z],
    end: [point.x, FLOOR_Y + 0.1, point.z],
    radius: 0.34,
  }));
  collisionGuide.userData.entranceGapDegrees = entranceGapDegrees;
  collisionGuide.userData.clearOfPublicEntrance = true;
  facility.add(collisionGuide);
  usePreciseEntryExteriorCollision(facility, 'E10');
}

function addGalleriaInteriorRoute(
  interior: THREE.Group,
  floorY: number,
  roomBackZ: number,
  roomFrontZ: number,
  roomCenterZ: number,
  roomId: string,
  mats: Materials,
) {
  const wallHeight = 4.34;
  const doorwayWidth = 2.8;
  const doorwayBackZ = roomCenterZ - doorwayWidth * 0.5;
  const doorwayFrontZ = roomCenterZ + doorwayWidth * 0.5;
  const partitionXs = [-7.4, 7.4];
  const barrierSegments: Array<{
    start: [number, number, number];
    end: [number, number, number];
    radius: number;
  }> = [];

  const route = addPlane(
    interior,
    'ENTRY__E5__INTERIOR_CONTINUOUS_GALLERY_ROUTE',
    22.9,
    1.75,
    mats.paving,
    [0, floorY + 0.018, roomCenterZ],
  );
  route.userData.connectedGalleryRoute = true;
  route.userData.galleryZones = ['west gallery', 'central gallery', 'east gallery'];
  route.userData.libraryRoom = roomId;

  partitionXs.forEach((x, partitionIndex) => {
    const side = partitionIndex === 0 ? 'WEST' : 'EAST';
    const backDepth = doorwayBackZ - roomBackZ;
    const frontDepth = roomFrontZ - doorwayFrontZ;
    addBox(
      interior,
      `ENTRY__E5__INTERIOR_${side}_PARTITION_BACK`,
      [0.16, wallHeight, backDepth],
      mats.warmStone,
      [x, floorY, roomBackZ + backDepth * 0.5],
      { obstacle: false },
    );
    addBox(
      interior,
      `ENTRY__E5__INTERIOR_${side}_PARTITION_FRONT`,
      [0.16, wallHeight, frontDepth],
      mats.warmStone,
      [x, floorY, doorwayFrontZ + frontDepth * 0.5],
      { obstacle: false },
    );
    for (const z of [doorwayBackZ, doorwayFrontZ]) {
      addBox(
        interior,
        `ENTRY__E5__INTERIOR_${side}_DOOR_JAMB_${z < roomCenterZ ? 'BACK' : 'FRONT'}`,
        [0.24, 3.2, 0.18],
        mats.darkBronze,
        [x, floorY, z],
        { obstacle: false },
      );
    }
    addBox(
      interior,
      `ENTRY__E5__INTERIOR_${side}_DOOR_HEADER`,
      [0.24, 0.28, doorwayWidth + 0.18],
      mats.darkBronze,
      [x, floorY + 3.2, roomCenterZ],
      { obstacle: false },
    );
    for (const face of [-1, 1]) {
      const directionSign = addSign(
        interior,
        `ENTRY__E5__INTERIOR_${side}_OPEN_GALLERY_DOOR_SIGN_${face < 0 ? 'WEST_FACE' : 'EAST_FACE'}`,
        side === 'WEST' ? '\u2190 GALLERY 01' : 'GALLERY 03 \u2192',
        'OPEN PASSAGE',
        [2.2, 0.56],
        [x + face * 0.14, floorY + 2.66, roomCenterZ],
        true,
      );
      directionSign.rotation.y = face < 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      directionSign.renderOrder = 7;
      const signMaterials = Array.isArray(directionSign.material)
        ? directionSign.material
        : [directionSign.material];
      signMaterials.forEach((material) => {
        material.side = THREE.FrontSide;
        material.needsUpdate = true;
      });
    }

    for (const barrierY of [FLOOR_Y + 0.1, FLOOR_Y + 0.34]) {
      barrierSegments.push(
        {
          start: [x, barrierY, roomBackZ],
          end: [x, barrierY, doorwayBackZ],
          radius: 0.09,
        },
        {
          start: [x, barrierY, doorwayFrontZ],
          end: [x, barrierY, roomFrontZ],
          radius: 0.09,
        },
      );
    }
  });

  const collisionGuide = new THREE.Group();
  collisionGuide.name = 'ENTRY__E5__PRECISE_INTERNAL_GALLERY_COLLISION';
  collisionGuide.userData.navBarrierSegments = barrierSegments;
  collisionGuide.userData.internalDoorCount = partitionXs.length;
  collisionGuide.userData.internalDoorwayWidth = doorwayWidth;
  interior.add(collisionGuide);
  interior.userData.galleryZones = ['west gallery', 'central gallery', 'east gallery'];
  interior.userData.internalDoorCount = partitionXs.length;
  interior.userData.connectedInternalRoute = true;
}

function buildPictureHouse(facility: THREE.Group, mats: Materials) {
  addBox(facility, 'ENTRY__E11__STREAMLINE_MODERNE_BODY', [10.5, 4.2, 7.2], mats.creamCeramic, [-0.5, FLOOR_Y, 0]);
  addCylinder(facility, 'ENTRY__E11__ROUNDED_CORNER_VOLUME', 3.6, 4.2, mats.creamCeramic, [4.6, FLOOR_Y, 0], 28);
  addBox(facility, 'ENTRY__E11__GLOWING_GLASS_BLOCK_TOWER', [2.3, 7.0, 2.3], mats.coolLight, [2.9, FLOOR_Y, -1.4]);
  for (let index = 0; index < 4; index += 1) addBox(facility, `ENTRY__E11__HORIZONTAL_METAL_BAND_${index + 1}`, [11.2, 0.1, 0.18], mats.brushedMetal, [-0.2, FLOOR_Y + 0.85 + index * 0.82, 3.66], { obstacle: false });
  addBox(facility, 'ENTRY__E11__PROJECTING_MARQUEE', [8.0, 0.24, 3.3], mats.bronze, [0.5, FLOOR_Y + 2.2, 4.6]);
  const blade = addSign(facility, 'ENTRY__E11__BEACON_BLADE_SIGN', 'BEACON', 'PICTURE HOUSE', [5.1, 1.0], [5.2, FLOOR_Y + 5.2, 3.7], true);
  blade.rotation.z = Math.PI / 2;
  usePreciseEntryExteriorCollision(facility, 'E11');
}

function buildWaterTaxi(facility: THREE.Group, mats: Materials) {
  addBox(facility, 'ENTRY__E12__ELONGATED_GLASS_QUAY_PAVILION', [17.5, 2.1, 4.2], mats.glass, [0, FLOOR_Y, 0]);
  const roofA = addBox(facility, 'ENTRY__E12__GULL_WING_ROOF_CITY_SIDE', [18.8, 0.18, 3.1], mats.bronze, [0, FLOOR_Y + 2.2, 1.6]);
  roofA.rotation.x = -0.11;
  const roofB = addBox(facility, 'ENTRY__E12__GULL_WING_ROOF_ISLAND_SIDE', [18.8, 0.18, 3.1], mats.bronze, [0, FLOOR_Y + 2.2, -1.6]);
  roofB.rotation.x = 0.11;
  for (let index = 0; index < 9; index += 1) addCylinder(facility, `ENTRY__E12__SLENDER_QUAY_COLUMN_${index + 1}`, 0.09, 2.15, mats.whiteMetal, [-8 + index * 2, FLOOR_Y, 2.2], 10);
  addPlane(facility, 'ENTRY__E12__COVERED_FLOATING_DOCK_WALKWAY', 3.0, 18, mats.darkPaving, [0, FLOOR_Y + 0.02, 11.4]);
  addCylinder(facility, 'ENTRY__E12__NAVIGATION_BEACON_MAST', 0.14, 9.2, mats.brushedMetal, [10.6, FLOOR_Y, 0], 12);
  addCylinder(facility, 'ENTRY__E12__MAST_NAVIGATION_LIGHT', 0.34, 0.28, mats.redLight, [10.6, FLOOR_Y + 9.2, 0], 12, false);
  usePreciseEntryExteriorCollision(facility, 'E12');
}

function buildOrientationTower(facility: THREE.Group, mats: Materials) {
  addCylinder(facility, 'ENTRY__E13__DARK_TRIANGULAR_STONE_BASE', 3.5, 1.1, mats.basalt, [0, FLOOR_Y, 0], 3);
  addBox(facility, 'ENTRY__E13__ORIENTATION_LOBBY_DOOR', [1.8, 2.25, 0.14], mats.darkGlass, [0, FLOOR_Y + 0.2, 3.52], { obstacle: false });
  const shaft = addCylinder(facility, 'ENTRY__E13__TAPERING_TRIANGULAR_TOWER', 3.1, 12.8, mats.darkGlass, [0, FLOOR_Y + 1.1, 0], 3);
  shaft.scale.set(1, 1, 0.84);
  for (let index = 0; index < 9; index += 1) {
    const angle = index / 9 * Math.PI * 2;
    addBox(facility, `ENTRY__E13__VERTICAL_FIN_${index + 1}`, [0.12, 11.8, 0.24], mats.bronze, [Math.cos(angle) * 2.75, FLOOR_Y + 1.6, Math.sin(angle) * 2.15], { obstacle: false });
  }
  for (let level = 0; level < 4; level += 1) addBox(facility, `ENTRY__E13__CITY_FACING_TERRACE_${level + 1}`, [4.8 - level * 0.35, 0.16, 1.4], mats.brushedMetal, [0, FLOOR_Y + 4.2 + level * 2.1, 2.3]);
  const lantern = addCylinder(facility, 'ENTRY__E13__TRANSPARENT_UPPER_LANTERN', 2.15, 2.0, mats.glass, [0, FLOOR_Y + 13.9, 0], 3);
  lantern.scale.z = 0.84;
  addBox(facility, 'ENTRY__E13__VERTICAL_ILLUMINATED_MARKER', [0.18, 14.0, 0.18], mats.warmLight, [0, FLOOR_Y + 1.1, 2.75], { obstacle: false });
  addCylinder(facility, 'ENTRY__E13__LOW_INTENSITY_BEACON_MAST', 0.08, 3.2, mats.brushedMetal, [0, FLOOR_Y + 15.9, 0], 8, false);
  usePreciseEntryExteriorCollision(facility, 'E13');
}

function addEntryWalkInterior(facility: THREE.Group, code: string, mats: Materials) {
  const layout = ENTRY_INTERIOR_LAYOUTS[code];
  const door = DOOR_ACCESS_LOCAL[code];
  if (!layout || !door) return;

  const roomFrontZ = door.threshold[1] - 0.08;
  const roomBackZ = roomFrontZ - layout.depth;
  const roomCenterZ = (roomFrontZ + roomBackZ) * 0.5;
  const roomId = `entry-${code.toLowerCase()}-${layout.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const floorY = FLOOR_Y + 0.035;
  const doorwayX = door.threshold[0];
  const halfWidth = layout.width * 0.5;
  const doorwayHalfWidth = layout.doorwayWidth * 0.5;
  const frontLeftEnd = Math.max(-halfWidth, doorwayX - doorwayHalfWidth);
  const frontRightStart = Math.min(halfWidth, doorwayX + doorwayHalfWidth);

  const interior = new THREE.Group();
  interior.name = `ENTRY__${code}__AUTHORED_WALK_INTERIOR`;
  interior.userData.runtimeInterior = true;
  interior.userData.entryDistrictInterior = true;
  interior.userData.roomId = roomId;
  interior.visible = false;
  facility.add(interior);

  const floor = addPlane(
    interior,
    `ENTRY__${code}__INTERIOR_WALKABLE_FLOOR`,
    layout.width - 0.28,
    layout.depth - 0.24,
    code === 'E10' ? mats.darkPaving : mats.paleStone,
    [0, floorY, roomCenterZ],
  );
  floor.userData.surfaceKind = code === 'E9'
    ? 'market stone'
    : code === 'E10'
      ? 'charcoal terrazzo'
      : 'terrazzo';
  floor.userData.libraryRoom = roomId;

  if (code !== 'E10') {
    const centralAisleDepth = Math.max(1.8, layout.depth - 0.5);
    const aisle = addPlane(
      interior,
      `ENTRY__${code}__INTERIOR_CLEAR_CENTRAL_AISLE`,
      Math.min(2.2, layout.doorwayWidth - 0.25),
      centralAisleDepth,
      mats.whiteMetal,
      [doorwayX * 0.35, floorY + 0.012, roomCenterZ + 0.08],
    );
    aisle.userData.surfaceKind = 'light terrazzo';
    aisle.userData.libraryRoom = roomId;
  }

  addBox(
    interior,
    `ENTRY__${code}__INTERIOR_REAR_WAYFINDING_WALL`,
    [layout.width - 0.18, layout.height - 0.18, 0.12],
    code === 'E6' || code === 'E7' ? mats.blackSteel : mats.darkBronze,
    [0, floorY, roomBackZ + 0.16],
    { obstacle: false },
  );
  for (const side of [-1, 1]) {
    addBox(
      interior,
      `ENTRY__${code}__INTERIOR_SIDE_WALL_${side < 0 ? 'WEST' : 'EAST'}`,
      [0.12, layout.height - 0.18, layout.depth - 0.18],
      mats.warmStone,
      [side * (halfWidth - 0.06), floorY, roomCenterZ],
      { obstacle: false },
    );
  }
  const frontWallMaterial = code === 'E6' || code === 'E7' ? mats.blackSteel : mats.warmStone;
  const frontLeftWidth = frontLeftEnd + halfWidth;
  const frontRightWidth = halfWidth - frontRightStart;
  if (frontLeftWidth > 0.02) {
    const frontWest = addBox(
      interior,
      `ENTRY__${code}__INTERIOR_FRONT_WALL_WEST`,
      [frontLeftWidth, layout.height - 0.18, 0.14],
      frontWallMaterial,
      [-halfWidth + frontLeftWidth * 0.5, floorY, roomFrontZ - 0.04],
      { obstacle: false },
    );
    frontWest.userData.frontWallWithDoor = true;
  }
  if (frontRightWidth > 0.02) {
    const frontEast = addBox(
      interior,
      `ENTRY__${code}__INTERIOR_FRONT_WALL_EAST`,
      [frontRightWidth, layout.height - 0.18, 0.14],
      frontWallMaterial,
      [frontRightStart + frontRightWidth * 0.5, floorY, roomFrontZ - 0.04],
      { obstacle: false },
    );
    frontEast.userData.frontWallWithDoor = true;
  }
  const doorOpeningHeight = Math.min(2.35, Math.max(1.85, layout.height - 0.32));
  const frontHeaderHeight = Math.max(0.16, layout.height - doorOpeningHeight - 0.06);
  const frontHeader = addBox(
    interior,
    `ENTRY__${code}__INTERIOR_FRONT_DOOR_HEADER`,
    [layout.doorwayWidth, frontHeaderHeight, 0.14],
    frontWallMaterial,
    [doorwayX, floorY + doorOpeningHeight, roomFrontZ - 0.04],
    { obstacle: false },
  );
  frontHeader.userData.frontWallWithDoor = true;
  for (const side of [-1, 1]) {
    const jamb = addBox(
      interior,
      `ENTRY__${code}__INTERIOR_FRONT_DOOR_JAMB_${side < 0 ? 'WEST' : 'EAST'}`,
      [0.16, doorOpeningHeight, 0.2],
      mats.brushedMetal,
      [doorwayX + side * doorwayHalfWidth, floorY, roomFrontZ - 0.08],
      { obstacle: false },
    );
    jamb.userData.openDoorway = true;
    jamb.userData.frontWallWithDoor = true;
  }
  addBox(
    interior,
    `ENTRY__${code}__INTERIOR_CEILING`,
    [layout.width - 0.16, 0.12, layout.depth - 0.16],
    mats.whiteMetal,
    [0, floorY + layout.height - 0.12, roomCenterZ],
    { obstacle: false },
  );
  addBox(
    interior,
    `ENTRY__${code}__INTERIOR_REAR_LIGHT_BAND`,
    [Math.min(layout.width * 0.56, 7.2), 0.1, 0.08],
    mats.coolLight,
    [0, floorY + Math.min(1.28, layout.height * 0.54), roomBackZ + 0.24],
    { obstacle: false, castShadow: false },
  );
  if (layout.width >= 7.2) {
    for (const side of [-1, 1]) {
      addBox(
        interior,
        `ENTRY__${code}__INTERIOR_SIDE_BENCH_${side < 0 ? 'WEST' : 'EAST'}`,
        [Math.min(2.4, layout.width * 0.18), 0.42, 0.58],
        mats.bronze,
        [side * (halfWidth - 1.25), floorY, roomCenterZ - layout.depth * 0.08],
        { obstacle: true },
      );
    }
  }
  const directory = addSign(
    interior,
    `ENTRY__${code}__INTERIOR_DIRECTORY`,
    code,
    layout.label.toUpperCase(),
    [Math.min(4.8, layout.width * 0.56), 0.72],
    [0, floorY + Math.min(1.18, layout.height * 0.48), roomBackZ + 0.25],
    true,
  );
  directory.renderOrder = 6;
  const directoryMaterials = Array.isArray(directory.material) ? directory.material : [directory.material];
  directoryMaterials.forEach((entry) => {
    entry.depthTest = false;
    entry.needsUpdate = true;
  });
  if (layout.width < 7.2) {
    for (const side of [-1, 1]) {
      addBox(
        interior,
        `ENTRY__${code}__INTERIOR_ORIENTATION_PLINTH_${side < 0 ? 'WEST' : 'EAST'}`,
        [0.34, 0.74, 0.34],
        mats.brushedMetal,
        [side * (halfWidth - 0.62), floorY, roomCenterZ - 0.1],
        { obstacle: true },
      );
      addBox(
        interior,
        `ENTRY__${code}__INTERIOR_ORIENTATION_LIGHT_${side < 0 ? 'WEST' : 'EAST'}`,
        [0.24, 0.18, 0.06],
        mats.coolLight,
        [side * (halfWidth - 0.62), floorY + 0.72, roomCenterZ + 0.08],
        { obstacle: false, castShadow: false },
      );
    }
  }
  if (code === 'E5') {
    addGalleriaInteriorRoute(interior, floorY, roomBackZ, roomFrontZ, roomCenterZ, roomId, mats);
  }

  const portalMask = addBox(
    facility,
    `ENTRY__${code}__CLEAR_WALK_ENTRY_PORTAL`,
    [layout.doorwayWidth, 2.35, 0.09],
    mats.darkGlass,
    [doorwayX, FLOOR_Y + 0.02, door.threshold[1] + 0.045],
    { obstacle: false, castShadow: false },
  );
  portalMask.userData.openDoorway = true;
  for (const side of [-1, 1]) {
    const parkedLeaf = addBox(
      facility,
      `ENTRY__${code}__OPEN_DOOR_LEAF_${side < 0 ? 'WEST' : 'EAST'}`,
      [0.1, 2.18, layout.doorwayWidth * 0.42],
      mats.glass,
      [doorwayX + side * (doorwayHalfWidth + 0.07), FLOOR_Y + 0.04, door.threshold[1] - 0.18],
      { obstacle: false, castShadow: false },
    );
    parkedLeaf.userData.open = true;
    parkedLeaf.userData.slidClearOfDoorway = true;
  }
  const threshold = addPlane(
    facility,
    `ENTRY__${code}__WALK_ENTRY_THRESHOLD`,
    layout.doorwayWidth,
    1.15,
    mats.whiteMetal,
    [doorwayX, floorY + 0.005, door.threshold[1] + 0.16],
  );
  threshold.userData.surfaceKind = 'entry threshold';

  const accessMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const portalAccessBackZ = roomFrontZ - 1.5;
  const portalAccessFrontZ = code === 'E8'
    ? door.routeStart[1] + 0.35
    : roomFrontZ + 1.3;
  const portalAccess = new THREE.Mesh(
    new THREE.BoxGeometry(
      layout.doorwayWidth - 0.16,
      layout.height,
      portalAccessFrontZ - portalAccessBackZ,
    ),
    accessMaterial,
  );
  portalAccess.name = `ENTRY__${code}__DOOR_NAV_ACCESS`;
  portalAccess.position.set(
    doorwayX,
    FLOOR_Y + layout.height * 0.5,
    (portalAccessFrontZ + portalAccessBackZ) * 0.5,
  );
  portalAccess.visible = false;
  portalAccess.userData.navAccess = true;
  portalAccess.userData.approachProtected = code === 'E8';
  portalAccess.userData.approachDepth = portalAccessFrontZ - portalAccessBackZ;
  facility.add(portalAccess);
  const roomAccess = new THREE.Mesh(
    new THREE.BoxGeometry(layout.width - 0.34, layout.height, layout.depth - 0.26),
    accessMaterial,
  );
  roomAccess.name = `ENTRY__${code}__ROOM_NAV_ACCESS`;
  roomAccess.position.set(0, FLOOR_Y + layout.height * 0.5, roomCenterZ);
  roomAccess.visible = false;
  roomAccess.userData.navAccess = true;
  facility.add(roomAccess);

  const barrierSegments: Array<{
    start: [number, number, number];
    end: [number, number, number];
    radius: number;
  }> = [];
  for (const barrierY of [FLOOR_Y + 0.1, FLOOR_Y + 0.34]) {
    barrierSegments.push(
      { start: [-halfWidth, barrierY, roomBackZ], end: [halfWidth, barrierY, roomBackZ], radius: 0.075 },
      { start: [-halfWidth, barrierY, roomBackZ], end: [-halfWidth, barrierY, roomFrontZ], radius: 0.075 },
      { start: [halfWidth, barrierY, roomBackZ], end: [halfWidth, barrierY, roomFrontZ], radius: 0.075 },
    );
    if (frontLeftEnd > -halfWidth) {
      barrierSegments.push({
        start: [-halfWidth, barrierY, roomFrontZ],
        end: [frontLeftEnd, barrierY, roomFrontZ],
        radius: 0.075,
      });
    }
    if (frontRightStart < halfWidth) {
      barrierSegments.push({
        start: [frontRightStart, barrierY, roomFrontZ],
        end: [halfWidth, barrierY, roomFrontZ],
        radius: 0.075,
      });
    }
  }
  const collisionGuide = new THREE.Group();
  collisionGuide.name = `ENTRY__${code}__PRECISE_INTERIOR_WALL_COLLISION`;
  collisionGuide.userData.navBarrierSegments = barrierSegments;
  collisionGuide.userData.doorwayGapWidth = layout.doorwayWidth;
  collisionGuide.userData.entryInteriorRoom = roomId;
  facility.add(collisionGuide);

  facility.userData.footprint = [layout.width, layout.depth];
  facility.userData.runtimeInteriorCenter = [0, roomCenterZ];
  facility.userData.runtimeInteriorHeight = layout.height;
  facility.userData.accessibleInWalk = true;
  facility.userData.authoredInterior = true;
  facility.userData.entryInteriorRoomId = roomId;
  facility.userData.entryInteriorDoorwayWidth = layout.doorwayWidth;
}

function wallSegmentsAroundOpenings(
  minimum: number,
  maximum: number,
  openings: readonly { center: number; width: number }[],
) {
  const clipped = openings
    .map((opening) => ({
      start: Math.max(minimum, opening.center - opening.width * 0.5),
      end: Math.min(maximum, opening.center + opening.width * 0.5),
    }))
    .filter((opening) => opening.end > opening.start)
    .sort((left, right) => left.start - right.start);
  const merged: Array<{ start: number; end: number }> = [];
  clipped.forEach((opening) => {
    const previous = merged.at(-1);
    if (previous && opening.start <= previous.end) previous.end = Math.max(previous.end, opening.end);
    else merged.push({ ...opening });
  });
  const solids: Array<{ start: number; end: number }> = [];
  let cursor = minimum;
  merged.forEach((opening) => {
    if (opening.start > cursor + 0.02) solids.push({ start: cursor, end: opening.start });
    cursor = Math.max(cursor, opening.end);
  });
  if (cursor < maximum - 0.02) solids.push({ start: cursor, end: maximum });
  return solids;
}

function addLogisticsWalkInterior(facility: THREE.Group, code: string, mats: Materials) {
  const layout = LOGISTICS_INTERIOR_LAYOUTS[code];
  const primary = DOOR_ACCESS_LOCAL[code];
  if (!layout || !primary) return;

  const exteriorObjects = [...facility.children];
  const disabledAggregateObstacles: string[] = [];
  exteriorObjects.forEach((object) => {
    object.userData.hideWhenRuntimeInteriorVisible = true;
    object.traverse((descendant) => {
      if (descendant.userData.navObstacle !== true) return;
      descendant.userData.navObstacle = false;
      descendant.userData.aggregateCollisionDisabled = true;
      descendant.userData.preciseCollisionGuide = `LOGISTICS__${code}__PRECISE_MULTI_DOOR_COLLISION`;
      disabledAggregateObstacles.push(descendant.name);
    });
  });

  const roomFrontZ = primary.threshold[1] - 0.08;
  const roomBackZ = roomFrontZ - layout.depth;
  const roomCenterZ = (roomFrontZ + roomBackZ) * 0.5;
  const halfWidth = layout.width * 0.5;
  const floorY = FLOOR_Y + 0.035;
  const roomId = `logistics-${code.toLowerCase()}-${layout.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  const interior = new THREE.Group();
  interior.name = `LOGISTICS__${code}__AUTHORED_WALK_INTERIOR`;
  interior.userData.runtimeInterior = true;
  interior.userData.logisticsDistrictInterior = true;
  interior.userData.roomId = roomId;
  interior.visible = false;
  facility.add(interior);

  const floor = addPlane(
    interior,
    `LOGISTICS__${code}__INTERIOR_WALKABLE_FLOOR`,
    layout.width - 0.22,
    layout.depth - 0.22,
    code === 'L2' ? mats.paleStone : mats.logisticsConcrete,
    [0, floorY, roomCenterZ],
  );
  floor.userData.surfaceKind = code === 'L2' ? 'airport terrazzo' : 'sealed logistics concrete';
  floor.userData.libraryRoom = roomId;

  const centralLane = addPlane(
    interior,
    `LOGISTICS__${code}__INTERIOR_CLEAR_CIRCULATION_LANE`,
    Math.min(layout.width * 0.46, code === 'L4' ? 11.5 : 5.2),
    layout.depth - 0.65,
    code === 'L2' ? mats.whiteMetal : mats.darkPaving,
    [0, floorY + 0.012, roomCenterZ],
  );
  centralLane.userData.surfaceKind = 'clear logistics circulation lane';
  centralLane.userData.libraryRoom = roomId;

  const wallMaterial = code === 'L2' ? mats.silverPanel : mats.charcoalPanel;
  const wallHeight = layout.height - 0.18;
  const sideDoors = (side: LogisticsDoorSide) => layout.doors
    .filter((door) => door.side === side)
    .map((door) => ({ center: door.offset, width: door.width }));
  const frontSolids = wallSegmentsAroundOpenings(-halfWidth, halfWidth, sideDoors('front'));
  const rearSolids = wallSegmentsAroundOpenings(-halfWidth, halfWidth, sideDoors('rear'));
  const westSolids = wallSegmentsAroundOpenings(roomBackZ, roomFrontZ, sideDoors('west'));
  const eastSolids = wallSegmentsAroundOpenings(roomBackZ, roomFrontZ, sideDoors('east'));

  const addHorizontalWall = (
    side: 'front' | 'rear',
    z: number,
    solids: readonly { start: number; end: number }[],
  ) => solids.forEach((segment, index) => {
    addBox(
      interior,
      `LOGISTICS__${code}__INTERIOR_${side.toUpperCase()}_WALL_${index + 1}`,
      [segment.end - segment.start, wallHeight, 0.14],
      wallMaterial,
      [(segment.start + segment.end) * 0.5, floorY, z],
      { obstacle: false },
    );
  });
  const addVerticalWall = (
    side: 'west' | 'east',
    x: number,
    solids: readonly { start: number; end: number }[],
  ) => solids.forEach((segment, index) => {
    addBox(
      interior,
      `LOGISTICS__${code}__INTERIOR_${side.toUpperCase()}_WALL_${index + 1}`,
      [0.14, wallHeight, segment.end - segment.start],
      wallMaterial,
      [x, floorY, (segment.start + segment.end) * 0.5],
      { obstacle: false },
    );
  });
  addHorizontalWall('front', roomFrontZ, frontSolids);
  addHorizontalWall('rear', roomBackZ, rearSolids);
  addVerticalWall('west', -halfWidth, westSolids);
  addVerticalWall('east', halfWidth, eastSolids);

  addBox(
    interior,
    `LOGISTICS__${code}__INTERIOR_CEILING`,
    [layout.width - 0.14, 0.12, layout.depth - 0.14],
    code === 'L4' ? mats.galvanized : mats.silverPanel,
    [0, floorY + layout.height - 0.12, roomCenterZ],
    { obstacle: false },
  );
  for (const x of [-layout.width * 0.28, 0, layout.width * 0.28]) {
    addBox(
      interior,
      `LOGISTICS__${code}__INTERIOR_CEILING_LIGHT_${String(x).replace('.', '_')}`,
      [Math.min(4.8, layout.width * 0.2), 0.06, 0.12],
      mats.coolLight,
      [x, floorY + layout.height - 0.17, roomCenterZ],
      { obstacle: false, castShadow: false },
    );
  }

  const barrierSegments: Array<{
    start: [number, number, number];
    end: [number, number, number];
    radius: number;
  }> = [];
  const pushHorizontalBarriers = (
    z: number,
    solids: readonly { start: number; end: number }[],
    y: number,
  ) => solids.forEach((segment) => barrierSegments.push({
    start: [segment.start, y, z],
    end: [segment.end, y, z],
    radius: 0.08,
  }));
  const pushVerticalBarriers = (
    x: number,
    solids: readonly { start: number; end: number }[],
    y: number,
  ) => solids.forEach((segment) => barrierSegments.push({
    start: [x, y, segment.start],
    end: [x, y, segment.end],
    radius: 0.08,
  }));

  const accessMaterial = new THREE.MeshBasicMaterial({ visible: false });
  layout.doors.forEach((door, index) => {
    const local = logisticsDoorLocalPoints(code, layout, door);
    const [thresholdX, thresholdZ] = local.threshold;
    const [routeX, routeZ] = local.routeStart;
    const outward = door.side === 'front'
      ? new THREE.Vector2(0, 1)
      : door.side === 'rear'
        ? new THREE.Vector2(0, -1)
        : door.side === 'west'
          ? new THREE.Vector2(-1, 0)
          : new THREE.Vector2(1, 0);
    const innerX = thresholdX - outward.x * 1.5;
    const innerZ = thresholdZ - outward.y * 1.5;
    const accessMinX = Math.min(routeX, innerX);
    const accessMaxX = Math.max(routeX, innerX);
    const accessMinZ = Math.min(routeZ, innerZ);
    const accessMaxZ = Math.max(routeZ, innerZ);
    const accessVolume = new THREE.Mesh(
      new THREE.BoxGeometry(
        door.side === 'front' || door.side === 'rear'
          ? door.width - 0.14
          : Math.max(0.25, accessMaxX - accessMinX),
        layout.height,
        door.side === 'west' || door.side === 'east'
          ? door.width - 0.14
          : Math.max(0.25, accessMaxZ - accessMinZ),
      ),
      accessMaterial,
    );
    accessVolume.name = `LOGISTICS__${code}__${door.id.toUpperCase()}_NAV_ACCESS`;
    accessVolume.position.set(
      (accessMinX + accessMaxX) * 0.5,
      FLOOR_Y + layout.height * 0.5,
      (accessMinZ + accessMaxZ) * 0.5,
    );
    accessVolume.visible = false;
    accessVolume.userData.navAccess = true;
    accessVolume.userData.entranceSide = door.side;
    accessVolume.userData.entranceRole = door.role;
    facility.add(accessVolume);

    const portal = addBox(
      facility,
      `LOGISTICS__${code}__${door.id.toUpperCase()}_OPEN_ENTRY`,
      door.side === 'front' || door.side === 'rear'
        ? [door.width, Math.min(4.5, layout.height - 0.45), 0.1]
        : [0.1, Math.min(4.5, layout.height - 0.45), door.width],
      mats.darkGlass,
      [
        thresholdX,
        FLOOR_Y + 0.04,
        thresholdZ,
      ],
      { obstacle: false, castShadow: false },
    );
    portal.userData.openDoorway = true;
    portal.userData.entranceSide = door.side;
    portal.userData.entranceRole = door.role;
    portal.userData.hideWhenRuntimeInteriorVisible = true;

    const threshold = addPlane(
      facility,
      `LOGISTICS__${code}__${door.id.toUpperCase()}_WALK_THRESHOLD`,
      door.side === 'front' || door.side === 'rear' ? door.width : 1.35,
      door.side === 'front' || door.side === 'rear' ? 1.35 : door.width,
      door.role === 'airside' || door.role === 'freight' ? mats.yellowPaint : mats.whitePaint,
      [
        (thresholdX + routeX) * 0.5,
        floorY + 0.006 + index * 0.0004,
        (thresholdZ + routeZ) * 0.5,
      ],
    );
    threshold.userData.surfaceKind = `${door.role} entry threshold`;
    threshold.userData.entranceSide = door.side;
    threshold.userData.navObstacle = false;
  });

  for (const barrierY of [FLOOR_Y + 0.1, FLOOR_Y + 0.34]) {
    pushHorizontalBarriers(roomFrontZ, frontSolids, barrierY);
    pushHorizontalBarriers(roomBackZ, rearSolids, barrierY);
    pushVerticalBarriers(-halfWidth, westSolids, barrierY);
    pushVerticalBarriers(halfWidth, eastSolids, barrierY);
  }
  const collisionGuide = new THREE.Group();
  collisionGuide.name = `LOGISTICS__${code}__PRECISE_MULTI_DOOR_COLLISION`;
  collisionGuide.userData.navBarrierSegments = barrierSegments;
  collisionGuide.userData.doorwayGapCount = layout.doors.length;
  collisionGuide.userData.accessibleSides = Array.from(new Set(layout.doors.map((door) => door.side)));
  collisionGuide.userData.logisticsInteriorRoom = roomId;
  facility.add(collisionGuide);

  const roomAccess = new THREE.Mesh(
    new THREE.BoxGeometry(layout.width - 0.3, layout.height, layout.depth - 0.3),
    accessMaterial,
  );
  roomAccess.name = `LOGISTICS__${code}__ROOM_NAV_ACCESS`;
  roomAccess.position.set(0, FLOOR_Y + layout.height * 0.5, roomCenterZ);
  roomAccess.visible = false;
  roomAccess.userData.navAccess = true;
  facility.add(roomAccess);

  const primaryDoor = layout.doors[0];
  const directory = addSign(
    interior,
    `LOGISTICS__${code}__INTERIOR_DIRECTORY`,
    code,
    layout.label.toUpperCase(),
    [Math.min(5.8, layout.width * 0.48), 0.86],
    [
      THREE.MathUtils.clamp(primaryDoor.offset, -halfWidth + 3.1, halfWidth - 3.1),
      floorY + Math.min(3.6, layout.height * 0.66),
      roomFrontZ - 0.11,
    ],
    true,
  );
  directory.rotation.y = Math.PI;
  directory.renderOrder = 6;
  const rearDirectorySegment = [...rearSolids]
    .sort((left, right) => (right.end - right.start) - (left.end - left.start))[0];
  if (rearDirectorySegment && rearDirectorySegment.end - rearDirectorySegment.start > 1.5) {
    const rearDirectory = addSign(
      interior,
      `LOGISTICS__${code}__INTERIOR_REAR_DIRECTORY`,
      code,
      layout.label.toUpperCase(),
      [Math.min(4.8, rearDirectorySegment.end - rearDirectorySegment.start - 0.24), 0.72],
      [
        (rearDirectorySegment.start + rearDirectorySegment.end) * 0.5,
        floorY + Math.min(3.4, layout.height * 0.62),
        roomBackZ + 0.11,
      ],
      true,
    );
    rearDirectory.renderOrder = 6;
  }

  facility.userData.footprint = [layout.width, layout.depth];
  facility.userData.runtimeInteriorCenter = [0, roomCenterZ];
  facility.userData.runtimeInteriorHeight = layout.height;
  facility.userData.accessibleInWalk = true;
  facility.userData.authoredInterior = true;
  facility.userData.logisticsInteriorRoomId = roomId;
  facility.userData.logisticsEntranceCount = layout.doors.length;
  facility.userData.logisticsAccessibleSides = Array.from(new Set(layout.doors.map((door) => door.side)));
  facility.userData.logisticsExteriorCollisionPolicy = 'precise-multi-door-barriers';
  facility.userData.disabledAggregateExteriorObstacles = disabledAggregateObstacles;
  facility.userData.disabledAggregateExteriorObstacleCount = disabledAggregateObstacles.length;
}

function runwayTextMaterial(text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d')!;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#f2f2e9';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '900 310px Arial, sans-serif';
  context.fillText(text, canvas.width * 0.5, canvas.height * 0.53, canvas.width * 0.88);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function addRunwayDesignator(
  parent: THREE.Object3D,
  name: string,
  text: string,
  x: number,
  rotationZ: number,
) {
  const marking = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), runwayTextMaterial(text));
  marking.name = name;
  marking.rotation.x = -Math.PI / 2;
  marking.rotation.z = rotationZ;
  marking.position.set(x, FLOOR_Y + 0.075, 0);
  marking.renderOrder = 4;
  marking.userData.navObstacle = false;
  marking.userData.runwayDesignator = text;
  parent.add(marking);
  return marking;
}

function addParkedRegionalAircraft(
  parent: THREE.Object3D,
  name: string,
  position: readonly [number, number],
  rotationY: number,
  mats: Materials,
) {
  const aircraft = new THREE.Group();
  aircraft.name = name;
  aircraft.position.set(position[0], FLOOR_Y + 0.03, position[1]);
  aircraft.rotation.y = rotationY;
  aircraft.userData.aircraftType = 'short-field twin turboprop';
  aircraft.userData.parked = true;
  parent.add(aircraft);

  const fuselage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.43, 0.55, 6.4, 18),
    mats.whiteMetal,
  );
  fuselage.name = `${name}__FUSELAGE`;
  fuselage.rotation.z = Math.PI / 2;
  fuselage.position.y = 1.05;
  fuselage.userData.navObstacle = false;
  aircraft.add(fuselage);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.46, 18, 10), mats.whiteMetal);
  nose.name = `${name}__NOSE`;
  nose.scale.x = 1.35;
  nose.position.set(3.2, 1.05, 0);
  nose.userData.navObstacle = false;
  aircraft.add(nose);
  addBox(aircraft, `${name}__MAIN_WING`, [1.2, 0.12, 7.4], mats.silverPanel, [0.35, 1.08, 0], { obstacle: false });
  addBox(aircraft, `${name}__TAILPLANE`, [1.25, 0.1, 2.8], mats.silverPanel, [-2.55, 1.18, 0], { obstacle: false });
  addBox(aircraft, `${name}__VERTICAL_TAIL`, [1.45, 1.25, 0.12], mats.silverPanel, [-2.65, 1.08, 0], { obstacle: false });
  for (const side of [-1, 1]) {
    const engine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.32, 1.3, 14),
      mats.charcoalPanel,
    );
    engine.name = `${name}__ENGINE_${side < 0 ? 'PORT' : 'STARBOARD'}`;
    engine.rotation.z = Math.PI / 2;
    engine.position.set(0.65, 0.96, side * 1.75);
    engine.userData.navObstacle = false;
    aircraft.add(engine);
    addBox(
      aircraft,
      `${name}__PROPELLER_${side < 0 ? 'PORT' : 'STARBOARD'}`,
      [0.06, 0.12, 1.9],
      mats.blackSteel,
      [1.36, 0.96, side * 1.75],
      { obstacle: false },
    );
    addCylinder(
      aircraft,
      `${name}__MAIN_GEAR_${side < 0 ? 'PORT' : 'STARBOARD'}`,
      0.08,
      0.72,
      mats.blackSteel,
      [0.15, 0.02, side * 1.35],
      10,
      false,
    );
  }
  addCylinder(aircraft, `${name}__NOSE_GEAR`, 0.065, 0.62, mats.blackSteel, [2.1, 0.02, 0], 10, false);
  for (let index = 0; index < 7; index += 1) {
    addBox(
      aircraft,
      `${name}__CABIN_WINDOW_${index + 1}_PORT`,
      [0.08, 0.22, 0.05],
      mats.darkGlass,
      [-1.7 + index * 0.52, 1.2, 0.51],
      { obstacle: false, castShadow: false },
    );
    addBox(
      aircraft,
      `${name}__CABIN_WINDOW_${index + 1}_STARBOARD`,
      [0.08, 0.22, 0.05],
      mats.darkGlass,
      [-1.7 + index * 0.52, 1.2, -0.51],
      { obstacle: false, castShadow: false },
    );
  }
  return aircraft;
}

function addLogisticsLandscape(group: THREE.Group, definition: DistrictDefinition, mats: Materials) {
  const runway = placeFacility(definition, 'AIRFIELD', 'Northfield short runway', 404, 286, 'tangent', (facility) => {
    addPlane(facility, 'LOGISTICS__RUNWAY_GRADED_SHOULDER', 132, 7.2, mats.logisticsConcrete, [0, FLOOR_Y, 0]);
    addPlane(facility, 'LOGISTICS__NORTHFIELD_RUNWAY', 120, 5.2, mats.runway, [0, FLOOR_Y + 0.02, 0]);
    for (const x of [-64.5, 64.5]) {
      addPlane(facility, `LOGISTICS__RUNWAY_BLAST_PAD_${x < 0 ? '09' : '27'}`, 8.0, 5.2, mats.darkConcrete, [x, FLOOR_Y + 0.015, 0]);
      for (let stripe = -2; stripe <= 2; stripe += 1) {
        const blast = addPlane(
          facility,
          `LOGISTICS__RUNWAY_BLAST_PAD_CHEVRON_${x < 0 ? '09' : '27'}_${stripe + 3}`,
          0.34,
          4.4,
          mats.yellowPaint,
          [x + stripe * 1.25, FLOOR_Y + 0.052, 0],
          stripe * 0.02 + (x < 0 ? -0.5 : 0.5),
        );
        blast.userData.runwayBlastPadMarking = true;
      }
    }
    for (let index = 0; index < 15; index += 1) {
      addPlane(
        facility,
        `LOGISTICS__RUNWAY_DASHED_CENTRELINE_${index + 1}`,
        3.8,
        0.16,
        mats.whitePaint,
        [-49 + index * 7, FLOOR_Y + 0.055, 0],
      );
    }
    for (const end of [-1, 1]) {
      const thresholdX = end * 55.0;
      for (let bar = 0; bar < 8; bar += 1) {
        addPlane(
          facility,
          `LOGISTICS__RUNWAY_${end < 0 ? '09' : '27'}_THRESHOLD_BAR_${bar + 1}`,
          2.2,
          0.28,
          mats.whitePaint,
          [thresholdX, FLOOR_Y + 0.055, -2.03 + bar * 0.58],
        );
      }
      for (const z of [-1.2, 1.2]) {
        addPlane(
          facility,
          `LOGISTICS__RUNWAY_${end < 0 ? '09' : '27'}_AIMING_POINT_${z < 0 ? 'NORTH' : 'SOUTH'}`,
          5.0,
          0.42,
          mats.whitePaint,
          [end * 35, FLOOR_Y + 0.056, z],
        );
      }
      for (const distance of [25, 29, 43]) {
        for (const z of [-1.55, 1.55]) {
          addPlane(
            facility,
            `LOGISTICS__RUNWAY_${end < 0 ? '09' : '27'}_TOUCHDOWN_${distance}_${z < 0 ? 'NORTH' : 'SOUTH'}`,
            2.1,
            0.18,
            mats.whitePaint,
            [end * distance, FLOOR_Y + 0.056, z],
          );
        }
      }
    }
    addRunwayDesignator(facility, 'LOGISTICS__RUNWAY_DESIGNATOR_09', '09', -48.5, -Math.PI / 2);
    addRunwayDesignator(facility, 'LOGISTICS__RUNWAY_DESIGNATOR_27', '27', 48.5, Math.PI / 2);

    for (let index = 0; index <= 30; index += 1) {
      const x = -60 + index * 4;
      for (const z of [-2.85, 2.85]) {
        const light = addCylinder(
          facility,
          `LOGISTICS__RUNWAY_EDGE_LIGHT_${index + 1}_${z < 0 ? 'NORTH' : 'SOUTH'}`,
          0.055,
          0.12,
          index < 3 || index > 27 ? mats.amberLight : mats.coolLight,
          [x, FLOOR_Y + 0.02, z],
          8,
          false,
        );
        light.userData.runwayEdgeLight = true;
      }
    }
    for (const end of [-1, 1]) {
      for (let lightIndex = 0; lightIndex < 7; lightIndex += 1) {
        const light = addCylinder(
          facility,
          `LOGISTICS__RUNWAY_END_LIGHT_${end < 0 ? '09' : '27'}_${lightIndex + 1}`,
          0.06,
          0.13,
          mats.redLight,
          [end * 60.1, FLOOR_Y + 0.02, -2.25 + lightIndex * 0.75],
          8,
          false,
        );
        light.userData.runwayEndLight = true;
      }
    }

    addPlane(facility, 'LOGISTICS__PARALLEL_TAXIWAY', 112, 3.2, mats.darkConcrete, [0, FLOOR_Y + 0.012, 9.4]);
    addPlane(facility, 'LOGISTICS__PARALLEL_TAXIWAY_CENTRELINE', 108, 0.1, mats.yellowPaint, [0, FLOOR_Y + 0.052, 9.4]);
    for (const [connectorIndex, x] of [-43, 0, 43].entries()) {
      addPlane(
        facility,
        `LOGISTICS__RUNWAY_TAXIWAY_CONNECTOR_${connectorIndex + 1}`,
        3.2,
        6.8,
        mats.darkConcrete,
        [x, FLOOR_Y + 0.014, 5.9],
      );
      addPlane(
        facility,
        `LOGISTICS__RUNWAY_TAXIWAY_CONNECTOR_${connectorIndex + 1}_CENTRELINE`,
        0.1,
        6.7,
        mats.yellowPaint,
        [x, FLOOR_Y + 0.054, 5.9],
      );
      addPlane(
        facility,
        `LOGISTICS__RUNWAY_HOLD_SHORT_BAR_${connectorIndex + 1}`,
        2.7,
        0.18,
        mats.yellowPaint,
        [x, FLOOR_Y + 0.059, 7.25],
      );
      addPlane(
        facility,
        `LOGISTICS__RUNWAY_HOLD_SHORT_BAR_${connectorIndex + 1}_SECONDARY`,
        2.7,
        0.08,
        mats.yellowPaint,
        [x, FLOOR_Y + 0.06, 7.58],
      );
    }

    const aprons = [
      { name: 'HANGAR', x: -43, width: 32, depth: 9.5 },
      { name: 'OPERATIONS', x: 0, width: 20, depth: 8.0 },
      { name: 'TERMINAL', x: 42, width: 30, depth: 10.5 },
    ] as const;
    aprons.forEach((apron) => {
      addPlane(
        facility,
        `LOGISTICS__${apron.name}_AIRCRAFT_APRON`,
        apron.width,
        apron.depth,
        mats.logisticsConcrete,
        [apron.x, FLOOR_Y + 0.008, 15.2],
      );
      for (const offset of [-0.28, 0.28]) {
        addPlane(
          facility,
          `LOGISTICS__${apron.name}_APRON_EDGE_${offset < 0 ? 'NORTH' : 'SOUTH'}`,
          apron.width - 1.2,
          0.08,
          mats.yellowPaint,
          [apron.x, FLOOR_Y + 0.056, 15.2 + offset * apron.depth],
        );
      }
    });
    for (const [standIndex, standX] of [34, 43, 52].entries()) {
      addPlane(
        facility,
        `LOGISTICS__TERMINAL_STAND_${standIndex + 1}_LEAD_IN`,
        0.1,
        7.2,
        mats.yellowPaint,
        [standX, FLOOR_Y + 0.06, 14.6],
      );
      addPlane(
        facility,
        `LOGISTICS__TERMINAL_STAND_${standIndex + 1}_STOP_BAR`,
        1.9,
        0.1,
        mats.yellowPaint,
        [standX, FLOOR_Y + 0.061, 17.4],
      );
    }
    addParkedRegionalAircraft(facility, 'LOGISTICS__NORTHFIELD_PARKED_TURBOPROP', [43, 15.3], 0, mats);

    for (const side of [-1, 1]) {
      for (let index = 0; index < 4; index += 1) {
        const papi = addCylinder(
          facility,
          `LOGISTICS__PAPI_${side < 0 ? '09' : '27'}_${index + 1}`,
          0.08,
          0.12,
          index < 2 ? mats.whitePaint : mats.redLight,
          [side * 30 + (index - 1.5) * 0.35, FLOOR_Y + 0.02, -4.15],
          8,
          false,
        );
        papi.userData.precisionApproachPathIndicator = true;
      }
    }
    addCylinder(facility, 'LOGISTICS__AIRFIELD_WINDSOCK_MAST', 0.06, 4.5, mats.galvanized, [-8, FLOOR_Y, 15.8], 10, false);
    const windsock = new THREE.Mesh(new THREE.ConeGeometry(0.44, 1.8, 14, 1, true), mats.amberLight);
    windsock.name = 'LOGISTICS__AIRFIELD_WINDSOCK';
    windsock.rotation.z = -Math.PI / 2;
    windsock.position.set(-7.1, FLOOR_Y + 4.0, 15.8);
    windsock.userData.navObstacle = false;
    facility.add(windsock);

    facility.userData.airfieldSpecification = {
      runwayLengthWorldUnits: 120,
      runwayWidthWorldUnits: 5.2,
      runwayDesignators: ['09', '27'],
      parallelTaxiway: true,
      taxiwayConnectorCount: 3,
      apronCount: 3,
      terminalStandCount: 3,
      parkedAircraftCount: 1,
      papiEnds: 2,
      edgeLightPairs: 31,
      approachOverWater: true,
    };
  });
  runway.userData.featureRole = 'infrastructure';
  runway.userData.featureTag = 'northfield-short-runway';
  runway.userData.exteriorProgram = false;
  runway.traverse((object) => {
    delete object.userData.individualSelectableId;
    delete object.userData.parentSelectableId;
    object.userData.selectableId = definition.id;
  });
  group.add(runway);
}

function buildParking(facility: THREE.Group, mats: Materials) {
  addBox(facility, 'LOGISTICS__L1__PARKING_CONCRETE_FRAME', [22, 8.2, 11.5], mats.darkConcrete, [0, FLOOR_Y, 0]);
  for (let floor = 0; floor < 6; floor += 1) {
    addBox(facility, `LOGISTICS__L1__OPEN_PARKING_LEVEL_${floor + 1}`, [22.2, 0.18, 11.8], mats.logisticsConcrete, [0, FLOOR_Y + floor * 1.32, 0]);
    addBox(facility, `LOGISTICS__L1__EXPANDED_METAL_SCREEN_${floor + 1}`, [19.5, 0.72, 0.12], mats.blackSteel, [0, FLOOR_Y + floor * 1.32 + 0.32, 5.96], { obstacle: false });
  }
  addBox(facility, 'LOGISTICS__L1__WIRED_GLASS_STAIR_TOWER', [3.0, 9.2, 3.0], mats.securityGlass, [-9.5, FLOOR_Y, -4.0]);
  addBox(facility, 'LOGISTICS__L1__RIBBED_CONCRETE_STAIR_TOWER', [3.0, 9.2, 3.0], mats.logisticsConcrete, [9.5, FLOOR_Y, 4.0]);
  for (let level = 0; level < 6; level += 1) {
    const ramp = new THREE.Mesh(new THREE.TorusGeometry(6.5, 0.42, 8, 32, Math.PI * 1.55), mats.galvanized);
    ramp.name = `LOGISTICS__L1__EXPOSED_SPIRAL_RAMP_${level + 1}`;
    ramp.rotation.x = Math.PI / 2;
    ramp.position.set(-13.2, FLOOR_Y + 0.8 + level * 1.25, 0);
    facility.add(ramp);
  }
  for (const x of [-9.8, 9.8]) for (const z of [-4.9, 4.9]) addCylinder(facility, `LOGISTICS__L1__RED_AVIATION_LIGHT_${x}_${z}`, 0.12, 0.22, mats.redLight, [x, FLOOR_Y + 8.35, z], 8, false);
  addSign(facility, 'LOGISTICS__L1__PAINTED_LEVEL_NUMBER', '06', 'SKYDECK', [4.2, 1.4], [0, FLOOR_Y + 6.9, 5.98], true);
}

function buildTerminal(facility: THREE.Group, mats: Materials) {
  addBox(facility, 'LOGISTICS__L2__TERMINAL_DARK_STONE_BASE', [27, 0.75, 9.5], mats.basalt, [0, FLOOR_Y, 0]);
  addBox(facility, 'LOGISTICS__L2__TERMINAL_GLASS_AND_ALUMINUM_BODY', [27, 3.0, 9.2], mats.glass, [0, FLOOR_Y + 0.75, 0]);
  for (let index = 0; index < 7; index += 1) {
    const roof = addBox(facility, `LOGISTICS__L2__WING_ROOF_PANEL_${index + 1}`, [4.5, 0.2, 13], mats.silverPanel, [-12 + index * 4, FLOOR_Y + 3.75 + Math.abs(index - 3) * 0.15, 0]);
    roof.rotation.z = (index - 3) * 0.018;
  }
  addBox(facility, 'LOGISTICS__L2__CITY_FACING_CANTILEVER_CANOPY', [20, 0.22, 3.2], mats.silverPanel, [0, FLOOR_Y + 2.4, 6.1]);
  addWindowRhythm(facility, 'LOGISTICS__L2__AIRFIELD_LOUVER', 15, 24, FLOOR_Y + 1.2, -4.66, 1.25, mats.darkGlass);
  for (let index = 0; index < 9; index += 1) addBox(facility, `LOGISTICS__L2__ROOF_SOLAR_STRIP_${index + 1}`, [2.1, 0.06, 6.0], mats.darkGlass, [-10.4 + index * 2.6, FLOOR_Y + 4.65, -0.4], { obstacle: false });
  addSign(facility, 'LOGISTICS__L2__NORTHFIELD_CANOPY_LETTERS', 'NORTHFIELD', 'AIRPORT', [8.5, 1.0], [0, FLOOR_Y + 3.0, 7.73], true);
}

function buildControlTower(facility: THREE.Group, mats: Materials) {
  addBox(facility, 'LOGISTICS__L3__OPERATIONS_BASE', [10.5, 2.4, 8.2], mats.darkConcrete, [0, FLOOR_Y, 0]);
  addBox(facility, 'LOGISTICS__L3__REINFORCED_CONTROL_SHAFT', [3.0, 10.8, 3.0], mats.logisticsConcrete, [0, FLOOR_Y + 2.4, 0]);
  addWindowRhythm(facility, 'LOGISTICS__L3__SHAFT_VERTICAL', 3, 1.8, FLOOR_Y + 4.2, 1.53, 6.0, mats.darkGlass);
  addCylinder(facility, 'LOGISTICS__L3__FACETED_HEXAGONAL_CONTROL_CAB', 3.4, 2.6, mats.darkGlass, [0, FLOOR_Y + 13.2, 0], 6);
  const balcony = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.13, 6, 24), mats.blackSteel);
  balcony.name = 'LOGISTICS__L3__EXTERNAL_SERVICE_BALCONY';
  balcony.rotation.x = Math.PI / 2;
  balcony.position.y = FLOOR_Y + 13.35;
  facility.add(balcony);
  addCylinder(facility, 'LOGISTICS__L3__COMMUNICATIONS_MAST', 0.1, 4.8, mats.galvanized, [0, FLOOR_Y + 15.8, 0], 8, false);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(1.2, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.galvanized);
  dish.name = 'LOGISTICS__L3__RADAR_ARRAY';
  dish.rotation.z = Math.PI / 2;
  dish.position.set(0, FLOOR_Y + 19.0, 0);
  facility.add(dish);
  addSign(facility, 'LOGISTICS__L3__WHITE_TOWER_NUMERALS', '03', 'AIRFIELD OPS', [3.2, 1.1], [0, FLOOR_Y + 2.0, 4.12], true);
}

function buildHangar(facility: THREE.Group, mats: Materials) {
  addBox(facility, 'LOGISTICS__L4__GALVANIZED_HANGAR_VOLUME', [34, 8.0, 20], mats.galvanized, [0, FLOOR_Y, 0]);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(10.1, 10.1, 34, 24, 1, false, 0, Math.PI), mats.silverPanel);
  roof.name = 'LOGISTICS__L4__SHALLOW_BARREL_VAULT_ROOF';
  roof.rotation.z = Math.PI / 2;
  roof.position.y = FLOOR_Y + 8.0;
  roof.scale.z = 0.34;
  facility.add(roof);
  addBox(facility, 'LOGISTICS__L4__CONTINUOUS_TRANSLUCENT_DAYLIGHT_BAND', [34.2, 1.1, 0.15], mats.securityGlass, [0, FLOOR_Y + 6.8, 10.08], { obstacle: false });
  for (let index = 0; index < 7; index += 1) {
    addBox(facility, `LOGISTICS__L4__SEGMENTED_SLIDING_DOOR_${index + 1}`, [4.3, 6.2, 0.18], index % 2 ? mats.charcoalPanel : mats.silverPanel, [-13.5 + index * 4.5, FLOOR_Y, 10.1], { obstacle: false });
    addSign(facility, `LOGISTICS__L4__OVERSIZED_DOOR_NUMBER_${index + 1}`, `0${index + 1}`, 'HANGAR ONE', [2.4, 0.85], [-13.5 + index * 4.5, FLOOR_Y + 4.8, 10.22], true);
  }
  for (let index = 0; index < 5; index += 1) addCylinder(facility, `LOGISTICS__L4__ROOF_EXHAUST_COWL_${index + 1}`, 0.42, 2.2, mats.charcoalPanel, [-11 + index * 5.5, FLOOR_Y + 9.8, -1.8], 12);
  for (const x of [-15.5, -10.5, 10.5, 15.5]) addCylinder(facility, `LOGISTICS__L4__PROTECTIVE_BOLLARD_${x}`, 0.16, 1.1, mats.yellowPaint, [x, FLOOR_Y, 11.2], 10);
}

function buildCargoDepot(facility: THREE.Group, mats: Materials) {
  addBox(facility, 'LOGISTICS__L5__CHARCOAL_CROSS_DOCK_WAREHOUSE', [31, 4.8, 12], mats.charcoalPanel, [0, FLOOR_Y, 0]);
  for (const z of [-6.08, 6.08]) {
    for (let index = 0; index < 9; index += 1) {
      const x = -13.2 + index * 3.3;
      addBox(facility, `LOGISTICS__L5__LOADING_BAY_${z < 0 ? 'N' : 'S'}_${index + 1}`, [2.35, 2.4, 0.18], mats.darkGlass, [x, FLOOR_Y + 0.35, z], { obstacle: false });
      addBox(facility, `LOGISTICS__L5__GALVANIZED_CANOPY_${z < 0 ? 'N' : 'S'}_${index + 1}`, [2.8, 0.12, 1.6], mats.galvanized, [x, FLOOR_Y + 3.0, z + Math.sign(z) * 0.75], { obstacle: false });
    }
  }
  addBox(facility, 'LOGISTICS__L5__GLAZED_ADMINISTRATION_BLOCK', [7.0, 8.0, 8.0], mats.darkGlass, [11.5, FLOOR_Y, -1.5]);
  addBox(facility, 'LOGISTICS__L5__MULTILANE_INSPECTION_CANOPY', [18, 0.4, 8.0], mats.galvanized, [-5.0, FLOOR_Y + 4.1, 12.0]);
  for (let lane = 0; lane < 4; lane += 1) addBox(facility, `LOGISTICS__L5__OVERHEAD_SCANNER_${lane + 1}`, [0.35, 3.5, 6.2], mats.coolLight, [-11 + lane * 4.0, FLOOR_Y + 0.3, 12], { obstacle: false });
  addPlane(facility, 'LOGISTICS__L5__WEIGHBRIDGE', 3.4, 14, mats.brushedMetal, [10.5, FLOOR_Y + 0.03, 12.0]);
}

function buildColdChain(facility: THREE.Group, mats: Materials) {
  addBox(facility, 'LOGISTICS__L6__INSULATED_SILVER_WHITE_BLOCK', [24, 7.8, 13], mats.silverPanel, [0, FLOOR_Y, 0]);
  for (let column = 0; column <= 12; column += 1) addBox(facility, `LOGISTICS__L6__PANEL_VERTICAL_JOINT_${column + 1}`, [0.045, 7.5, 0.09], mats.brushedMetal, [-12 + column * 2, FLOOR_Y + 0.15, 6.56], { obstacle: false });
  for (let row = 0; row <= 4; row += 1) addBox(facility, `LOGISTICS__L6__PANEL_HORIZONTAL_JOINT_${row + 1}`, [23.8, 0.045, 0.09], mats.brushedMetal, [0, FLOOR_Y + 0.5 + row * 1.7, 6.56], { obstacle: false });
  addBox(facility, 'LOGISTICS__L6__ADMINISTRATION_WINDOW_STRIP', [8.5, 1.2, 0.12], mats.darkGlass, [7.0, FLOOR_Y + 4.8, 6.58], { obstacle: false });
  for (let index = 0; index < 5; index += 1) {
    const x = -9 + index * 4.5;
    addBox(facility, `LOGISTICS__L6__PROJECTING_DOCK_FRAME_${index + 1}`, [3.4, 3.0, 2.4], mats.charcoalPanel, [x, FLOOR_Y + 0.35, 7.4]);
    addBox(facility, `LOGISTICS__L6__DOCK_STATUS_MARKER_${index + 1}`, [0.18, 0.46, 0.18], index % 2 ? mats.amberLight : mats.coolLight, [x + 1.4, FLOOR_Y + 3.0, 8.65], { obstacle: false });
  }
  addBox(facility, 'LOGISTICS__L6__BLUE_WHITE_IDENTITY_LINE', [24.2, 0.12, 0.14], mats.coolLight, [0, FLOOR_Y + 7.65, 6.62], { obstacle: false });
  for (let index = 0; index < 6; index += 1) addBox(facility, `LOGISTICS__L6__SCREENED_ROOF_CONDENSER_${index + 1}`, [2.4, 1.4, 2.0], mats.charcoalPanel, [-8.5 + index * 3.4, FLOOR_Y + 7.8, -1.2], { obstacle: true });
}

function buildFleetDepot(facility: THREE.Group, mats: Materials) {
  addBox(facility, 'LOGISTICS__L7__GROUND_FLEET_MAINTENANCE_BODY', [29, 4.8, 14], mats.galvanized, [0, FLOOR_Y, 0]);
  addSawtoothRoof(facility, 'LOGISTICS__L7__DEPOT', 7, 29, 14, FLOOR_Y + 5.2, mats.charcoalPanel);
  for (let index = 0; index < 8; index += 1) {
    const x = -12.2 + index * 3.5;
    addBox(facility, `LOGISTICS__L7__OVERSIZED_SERVICE_DOOR_${index + 1}`, [2.7, 3.3, 0.18], mats.darkGlass, [x, FLOOR_Y + 0.25, 7.08], { obstacle: false });
    addBox(facility, `LOGISTICS__L7__BAY_STATUS_STRIP_${index + 1}`, [2.5, 0.12, 0.12], index % 3 ? mats.coolLight : mats.amberLight, [x, FLOOR_Y + 3.75, 7.2], { obstacle: false });
  }
  addBox(facility, 'LOGISTICS__L7__CHARGING_AND_FUEL_CANOPY', [18, 0.28, 7.0], mats.galvanized, [-4.5, FLOOR_Y + 4.0, 12.8]);
  for (let index = 0; index < 6; index += 1) addBox(facility, `LOGISTICS__L7__CANOPY_PHOTOVOLTAIC_PANEL_${index + 1}`, [2.5, 0.08, 4.8], mats.darkGlass, [-11 + index * 2.7, FLOOR_Y + 4.3, 12.8], { obstacle: false });
  addBox(facility, 'LOGISTICS__L7__SCREENED_EXTERNAL_WASH_BAY', [8.0, 3.5, 7.5], mats.logisticsConcrete, [11.5, FLOOR_Y, 12.5]);
  addPlane(facility, 'LOGISTICS__L7__STORMWATER_TREATMENT_BASIN', 15, 4.0, mats.water, [5, FLOOR_Y + 0.03, -10.0], 0, false).userData.navObstacle = true;
}

function finishProgramGroup(group: THREE.Group, definition: DistrictDefinition, buildingNames: readonly string[], zone: 'entry' | 'logistics') {
  const facilities: string[] = [];
  let interiorsAuthored = 0;
  group.traverse((object) => {
    if (!object.userData.individualSelectableId) object.userData.selectableId = definition.id;
    if (object.userData.exteriorProgram === true) {
      facilities.push(String(object.userData.displayName));
      if (object.userData.authoredInterior === true) interiorsAuthored += 1;
    }
  });
  group.userData.entryLogisticsProgram = {
    zone,
    siteBoundary: {
      sectorStartDegrees: zone === 'entry' ? 300 : 270,
      sectorEndDegrees: zone === 'entry' ? 330 : 300,
      innerRadiusWorldUnits: definition.sector?.innerRadius,
      outerRadiusWorldUnits: definition.sector?.outerRadius,
      source: 'supplied red-line northern perimeter map',
    },
    plannedBuildings: [...buildingNames],
    realizedBuildings: facilities,
    realizedBuildingCount: facilities.length,
    interiorsAuthored,
    publicFreightSeparation: true,
    alpineViewCorridorProtected: zone === 'entry',
  };
}

export function buildEntryCommercialDistrict(group: THREE.Group, definition: DistrictDefinition) {
  const mats = createMaterials();
  roadMaterials.set(group, mats);
  addPublicLandscape(group, definition, mats);
  const bridgehead = placeFacility(definition, 'E1', ENTRY_BUILDINGS[0], 397, 304.5, 'radial', (facility) => buildBridgeheadTunnel(facility, mats));
  alignBridgeheadTunnelWithCyberCity(bridgehead, definition);
  const welcomeHall = placeFacility(
    definition,
    'E2',
    ENTRY_BUILDINGS[1],
    WELCOME_BUILDING_RADIUS,
    WELCOME_FORK_ANGLE,
    'tangent',
    (facility) => buildWelcomeHall(facility, mats),
  );
  welcomeHall.rotation.y += Math.PI;
  welcomeHall.userData.forkMedian = true;
  welcomeHall.userData.forkBranches = ['Entry and Commercial', 'Logistics'];
  const facilities = [
    bridgehead,
    welcomeHall,
    placeFacility(definition, 'E3', ENTRY_BUILDINGS[2], 346, 306.2, 'tangent', (facility) => buildTransitPavilion(facility, mats)),
    placeFacility(definition, 'E4', ENTRY_BUILDINGS[3], 362, 318.2, 'tangent', (facility) => buildCafe(facility, mats)),
    placeFacility(definition, 'E5', ENTRY_BUILDINGS[4], 326, 314.2, 'tangent', (facility) => buildMall(facility, mats)),
    placeFacility(definition, 'E6', ENTRY_BUILDINGS[5], 341, 322.0, 'tangent', (facility) => buildFashionClub(facility, mats)),
    placeFacility(definition, 'E7', ENTRY_BUILDINGS[6], 358, 324.2, 'tangent', (facility) => buildArcade(facility, mats)),
    placeFacility(definition, 'E8', ENTRY_BUILDINGS[7], 392, 315.5, 'tangent', (facility) => buildHotel(facility, mats)),
    placeFacility(definition, 'E9', ENTRY_BUILDINGS[8], 329, 326.4, 'tangent', (facility) => buildMarket(facility, mats)),
    placeFacility(definition, 'E10', ENTRY_BUILDINGS[9], 356, 312.3, 'tangent', (facility) => buildShowcase(facility, mats)),
    placeFacility(definition, 'E11', ENTRY_BUILDINGS[10], 347, 327.0, 'tangent', (facility) => buildPictureHouse(facility, mats)),
    placeFacility(definition, 'E12', ENTRY_BUILDINGS[11], 402, 326.8, 'tangent', (facility) => buildWaterTaxi(facility, mats)),
    placeFacility(definition, 'E13', ENTRY_BUILDINGS[12], 381, 326.0, 'tangent', (facility) => buildOrientationTower(facility, mats)),
  ];
  bridgehead.userData.accessibleInWalk = true;
  facilities.slice(2).forEach((facility) => {
    addEntryWalkInterior(facility, String(facility.userData.buildingCode), mats);
  });
  group.add(...facilities);
  finishProgramGroup(group, definition, ENTRY_BUILDINGS, 'entry');
  refreshEntryLogisticsRoadNetwork(group);
}

export function buildLogisticsDistrict(group: THREE.Group, definition: DistrictDefinition) {
  const mats = createMaterials();
  roadMaterials.set(group, mats);
  addLogisticsLandscape(group, definition, mats);
  const facilities = [
    placeFacility(definition, 'L1', LOGISTICS_BUILDINGS[0], 348, 297.0, 'tangent', (facility) => buildParking(facility, mats)),
    placeFacility(definition, 'L2', LOGISTICS_BUILDINGS[1], 384, 292.0, 'tangent', (facility) => buildTerminal(facility, mats)),
    placeFacility(definition, 'L3', LOGISTICS_BUILDINGS[2], 391, 286.5, 'tangent', (facility) => buildControlTower(facility, mats)),
    placeFacility(definition, 'L4', LOGISTICS_BUILDINGS[3], 378, 278.8, 'tangent', (facility) => buildHangar(facility, mats)),
    placeFacility(definition, 'L5', LOGISTICS_BUILDINGS[4], 344, 286.5, 'tangent', (facility) => buildCargoDepot(facility, mats)),
    placeFacility(definition, 'L6', LOGISTICS_BUILDINGS[5], 344, 293.2, 'tangent', (facility) => buildColdChain(facility, mats)),
    placeFacility(definition, 'L7', LOGISTICS_BUILDINGS[6], 344, 276.7, 'tangent', (facility) => buildFleetDepot(facility, mats)),
  ];
  facilities.forEach((facility) => {
    addLogisticsWalkInterior(facility, String(facility.userData.buildingCode), mats);
  });
  group.add(...facilities);
  finishProgramGroup(group, definition, LOGISTICS_BUILDINGS, 'logistics');
  refreshEntryLogisticsRoadNetwork(group);
}
