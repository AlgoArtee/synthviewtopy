import * as THREE from 'three';
import type { DistrictDefinition } from '../data/districts';
import { COASTAL_RAIL_INSET, ISLAND_POINTS, metresToWorldUnits } from '../config/island';

const m = metresToWorldUnits;
// The industrial paving tops out at 0.36 m above the district datum. Keep the
// ballast formation just above it so normal depth testing can be used (and the
// railway never bleeds through buildings in Explore mode).
const TRACK_BASE_Y = m(0.38);
const VISUAL_GAUGE_METRES = 1.5;
const MAIN_TRACK_CENTRE_SPACING_METRES = 4.2;

export type TrackCategory = 'main' | 'branch' | 'siding' | 'yard' | 'factory';
export type TrackCondition = 'maintained' | 'worn' | 'stained' | 'rusted' | 'embedded';

export type TrackSegmentConfig = {
  id: string;
  category: TrackCategory;
  controlPoints: Array<[number, number, number]>;
  curve?: 'catmull-rom' | 'cubic-bezier';
  gaugeMetres: number;
  minimumRadiusMetres: number;
  sleeperSpacingMetres: number;
  ballastWidthMetres: number;
  sampleSpacingMetres: number;
  condition: TrackCondition;
  embedded?: boolean;
  deadEnd?: boolean;
  destinationZone?: string;
  startConnection?: string;
  endConnection?: string;
};

export type TurnoutConfig = {
  id: string;
  position: THREE.Vector3;
  heading: number;
  handedness: 'left' | 'right';
  ratio: 6 | 8 | 9 | 12 | 20;
  gaugeMetres: number;
  branchRadiusMetres: number;
  branchLengthMetres: number;
  category: TrackCategory;
};

type TrackConnectionNode = {
  id: string;
  position: THREE.Vector3;
  heading: number;
};

type TurnoutResult = {
  straightRoute: THREE.Vector3[];
  divergingRoute: THREE.Vector3[];
  nodes: {
    entry: TrackConnectionNode;
    straight: TrackConnectionNode;
    diverging: TrackConnectionNode;
  };
};

type RailwayLayout = {
  tracks: TrackSegmentConfig[];
  turnouts: TurnoutConfig[];
  coastalConnection: {
    centre: THREE.Vector3;
    tangent: THREE.Vector3;
    mainTrackCentres: [THREE.Vector3, THREE.Vector3];
  };
};

type SampledTrack = {
  config: TrackSegmentConfig;
  curve: THREE.Curve<THREE.Vector3>;
  points: THREE.Vector3[];
  tangents: THREE.Vector3[];
  length: number;
  minimumRadiusMetres: number;
  sleeperCount: number;
};

type RailwayMaterials = ReturnType<typeof createRailwayMaterials>;

type BuildingClearanceZone = {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export const INDUSTRIAL_RAILWAY_STANDARDS = {
  coordinateScale: '1 world unit = 10 metres',
  gaugeMetres: 1.435,
  visualRailCentreSeparationMetres: VISUAL_GAUGE_METRES,
  sleeperLengthMetres: 2.6,
  sleeperWidthMetres: 0.25,
  sleeperThicknessMetres: 0.18,
  railHeightMetres: 0.17,
  main: {
    trackCentreSpacingMetres: MAIN_TRACK_CENTRE_SPACING_METRES,
    minimumRadiusMetres: 500,
    preferredRadiusMetres: [800, 1500],
    ballastWidthMetres: 4.5,
    sleeperSpacingMetres: 0.6,
    maximumGradient: 0.015,
  },
  branch: {
    turnoutRatio: 12,
    minimumRadiusMetres: 250,
    preferredRadiusMetres: [300, 500],
    ballastWidthMetres: 4,
    maximumGradient: 0.02,
  },
  siding: {
    turnoutRatios: [8, 9],
    minimumRadiusMetres: 150,
    preferredRadiusMetres: [180, 300],
    trackCentreSpacingMetres: [4.5, 5],
    maximumLoadingGradient: 0.005,
  },
  yard: {
    turnoutRatios: [8, 9],
    minimumRadiusMetres: 150,
    trackCentreSpacingMetres: 4.8,
    maximumGradient: 0.0025,
  },
  factory: {
    turnoutRatios: [6, 8],
    minimumRadiusMetres: 80,
    preferredRadiusMetres: [100, 180],
    maximumGradient: 0.025,
  },
} as const;

const BUILDING_CLEARANCE_ZONES: readonly BuildingClearanceZone[] = [
  { id: 'nexus-logistics', minX: -14.8, maxX: -9.4, minZ: -6.1, maxZ: -2.6 },
  { id: 'unit-4b', minX: -14.8, maxX: -9.2, minZ: 2.85, maxZ: 6.1 },
  { id: 'grey-foundry', minX: 9.35, maxX: 14.75, minZ: -6.05, maxZ: -2.6 },
  { id: 'assembly-works', minX: 9.35, maxX: 14.8, minZ: 2.75, maxZ: 6.05 },
  { id: 'north-rear-factory', minX: -3.2, maxX: 3.2, minZ: -8.8, maxZ: -6.35 },
  { id: 'south-rear-factory', minX: -3.0, maxX: 3.4, minZ: 6.3, maxZ: 8.8 },
  { id: 'rail-shed', minX: -9.2, maxX: -5.6, minZ: 2.75, maxZ: 4.55 },
  { id: 'warehouse', minX: 3.4, maxX: 9.0, minZ: 2.42, maxZ: 4.2 },
  { id: 'power-station', minX: 1.0, maxX: 3.4, minZ: -4.9, maxZ: -2.1 },
  { id: 'cold-storage', minX: 6.4, maxX: 9.0, minZ: -4.45, maxZ: -2.55 },
] as const;

const CATEGORY_CLEARANCE_METRES: Readonly<Record<TrackCategory, number>> = {
  main: 3,
  branch: 8,
  siding: 3,
  yard: 3,
  factory: 2.5,
};

function trackMaterial(
  color: THREE.ColorRepresentation,
  roughness: number,
  metalness: number,
  extra: THREE.MeshStandardMaterialParameters = {},
) {
  const value = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    depthTest: true,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    ...extra,
  });
  return value;
}

function createRailwayMaterials() {
  const railMain = trackMaterial('#b4bdbe', 0.18, 0.98, { emissive: '#242b2c', emissiveIntensity: 0.12 });
  const railBranch = trackMaterial('#92999a', 0.28, 0.94, { emissive: '#1a2021', emissiveIntensity: 0.08 });
  const railYard = trackMaterial('#777878', 0.38, 0.88);
  const railFactory = trackMaterial('#665755', 0.52, 0.78);
  const ballastMain = trackMaterial('#4e5557', 0.95, 0.05);
  const ballastBranch = trackMaterial('#343a3c', 0.96, 0.05);
  const ballastYard = trackMaterial('#292e2e', 0.98, 0.04);
  const ballastFactory = trackMaterial('#242728', 0.99, 0.03);
  const embedded = trackMaterial('#555b5c', 0.88, 0.1);
  const sleeperMain = trackMaterial('#56504a', 0.88, 0.12);
  const sleeperBranch = trackMaterial('#433b34', 0.92, 0.1);
  const sleeperYard = trackMaterial('#332c28', 0.96, 0.08);
  const sleeperFactory = trackMaterial('#2d2724', 0.98, 0.06);
  return {
    rail: {
      main: railMain,
      branch: railBranch,
      siding: railYard,
      yard: railYard,
      factory: railFactory,
    } satisfies Record<TrackCategory, THREE.MeshStandardMaterial>,
    ballast: {
      main: ballastMain,
      branch: ballastBranch,
      siding: ballastYard,
      yard: ballastYard,
      factory: ballastFactory,
    } satisfies Record<TrackCategory, THREE.MeshStandardMaterial>,
    sleeper: {
      main: sleeperMain,
      branch: sleeperBranch,
      siding: sleeperYard,
      yard: sleeperYard,
      factory: sleeperFactory,
    } satisfies Record<TrackCategory, THREE.MeshStandardMaterial>,
    embedded,
    darkMetal: new THREE.MeshStandardMaterial({ color: '#20282b', roughness: 0.54, metalness: 0.78 }),
    rust: new THREE.MeshStandardMaterial({ color: '#664039', roughness: 0.82, metalness: 0.5 }),
    safetyYellow: new THREE.MeshStandardMaterial({ color: '#b69939', roughness: 0.72, metalness: 0.26 }),
    signalRed: new THREE.MeshStandardMaterial({ color: '#ff5b49', emissive: '#ff2d1f', emissiveIntensity: 3 }),
    signalGreen: new THREE.MeshStandardMaterial({ color: '#6fffa1', emissive: '#26ff70', emissiveIntensity: 2.4 }),
    lamp: new THREE.MeshStandardMaterial({ color: '#ffd294', emissive: '#ffb85a', emissiveIntensity: 2.2 }),
    container: new THREE.MeshStandardMaterial({ color: '#48565b', roughness: 0.76, metalness: 0.42 }),
    wagon: new THREE.MeshStandardMaterial({ color: '#3b4244', roughness: 0.66, metalness: 0.58 }),
    wheel: new THREE.MeshStandardMaterial({ color: '#161b1d', roughness: 0.58, metalness: 0.72 }),
    gravel: new THREE.MeshStandardMaterial({ color: '#34393a', roughness: 0.98, metalness: 0.02 }),
    concrete: new THREE.MeshStandardMaterial({ color: '#555d5f', roughness: 0.9, metalness: 0.08 }),
    oil: new THREE.MeshStandardMaterial({ color: '#111719', transparent: true, opacity: 0.55, roughness: 0.2, metalness: 0.35, depthWrite: false }),
    weed: new THREE.MeshStandardMaterial({ color: '#3d4937', roughness: 0.95, metalness: 0 }),
  };
}

function asVector(point: readonly [number, number, number]) {
  return new THREE.Vector3(point[0], point[1], point[2]);
}

function asTuple(point: THREE.Vector3): [number, number, number] {
  return [point.x, point.y, point.z];
}

function directionFromHeading(heading: number) {
  return new THREE.Vector3(Math.cos(heading), 0, Math.sin(heading));
}

function horizontalPerpendicular(direction: THREE.Vector3) {
  return new THREE.Vector3(-direction.z, 0, direction.x).normalize();
}

function turnoutRoutes(config: TurnoutConfig): TurnoutResult {
  const direction = directionFromHeading(config.heading);
  const handednessSign = config.handedness === 'left' ? 1 : -1;
  const angle = Math.atan(1 / config.ratio) * handednessSign;
  const length = m(config.branchLengthMetres);
  const radius = m(config.branchRadiusMetres);
  const entry = config.position.clone();
  const straightEnd = entry.clone().addScaledVector(direction, length);
  const perpendicular = horizontalPerpendicular(direction);
  const centre = entry.clone().addScaledVector(perpendicular, radius * handednessSign);
  const radialStart = entry.clone().sub(centre);
  const arcLength = Math.abs(angle) * radius;
  const usableArcLength = Math.min(arcLength, length * 0.78);
  const usableAngle = usableArcLength / radius * handednessSign;
  const arcSamples = Math.max(8, Math.ceil(usableArcLength / m(1.0)));
  const divergingRoute: THREE.Vector3[] = [];
  for (let index = 0; index <= arcSamples; index += 1) {
    const t = index / arcSamples;
    const theta = usableAngle * t;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const rotated = new THREE.Vector3(
      radialStart.x * cos - radialStart.z * sin,
      0,
      radialStart.x * sin + radialStart.z * cos,
    );
    divergingRoute.push(centre.clone().add(rotated).setY(entry.y));
  }
  const achievedHeading = config.heading + usableAngle;
  const achievedDirection = directionFromHeading(achievedHeading);
  const tangentLength = Math.max(0, length - usableArcLength);
  const tangentSamples = Math.max(1, Math.ceil(tangentLength / m(1.0)));
  const arcEnd = divergingRoute[divergingRoute.length - 1];
  for (let index = 1; index <= tangentSamples; index += 1) {
    divergingRoute.push(arcEnd.clone().addScaledVector(achievedDirection, tangentLength * (index / tangentSamples)));
  }
  const branchEnd = divergingRoute[divergingRoute.length - 1];
  return {
    straightRoute: [entry, straightEnd],
    divergingRoute,
    nodes: {
      entry: { id: `${config.id}:entry`, position: entry, heading: config.heading },
      straight: { id: `${config.id}:straight`, position: straightEnd, heading: config.heading },
      diverging: { id: `${config.id}:diverging`, position: branchEnd, heading: achievedHeading },
    },
  };
}

function circularTransitionPoints(
  start: THREE.Vector3,
  heading: number,
  headingChange: number,
  radiusMetres: number,
  sampleSpacingMetres: number,
) {
  const direction = directionFromHeading(heading);
  const turnSign = Math.sign(headingChange) || 1;
  const radius = m(radiusMetres);
  const perpendicular = horizontalPerpendicular(direction);
  const centre = start.clone().addScaledVector(perpendicular, radius * turnSign);
  const radialStart = start.clone().sub(centre);
  const arcLength = Math.abs(headingChange) * radius;
  const sampleCount = Math.max(8, Math.ceil(arcLength / m(sampleSpacingMetres)));
  return Array.from({ length: sampleCount + 1 }, (_, index) => {
    const theta = headingChange * (index / sampleCount);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return centre.clone().add(new THREE.Vector3(
      radialStart.x * cos - radialStart.z * sin,
      0,
      radialStart.x * sin + radialStart.z * cos,
    )).setY(start.y);
  });
}

function coastalConnection(definition: DistrictDefinition) {
  const origin = new THREE.Vector2(definition.position[0], definition.position[2]);
  const perimeter = ISLAND_POINTS.map(([x, z]) => new THREE.Vector2(x * COASTAL_RAIL_INSET, z * COASTAL_RAIL_INSET));
  let selected: { point: THREE.Vector2; tangent: THREE.Vector2 } | null = null;
  for (let index = 0; index < perimeter.length; index += 1) {
    const start = perimeter[index];
    const end = perimeter[(index + 1) % perimeter.length];
    const minZ = Math.min(start.y, end.y);
    const maxZ = Math.max(start.y, end.y);
    if (origin.y < minZ || origin.y > maxZ || Math.abs(end.y - start.y) < 0.0001) continue;
    const t = (origin.y - start.y) / (end.y - start.y);
    const point = start.clone().lerp(end, t);
    if (point.x >= origin.x) continue;
    const tangent = end.clone().sub(start).normalize();
    if (tangent.x < 0) tangent.multiplyScalar(-1);
    if (!selected || point.x > selected.point.x) selected = { point, tangent };
  }
  if (!selected) {
    return {
      centre: new THREE.Vector3(-22, TRACK_BASE_Y, 0),
      tangent: new THREE.Vector3(1, 0, 0),
    };
  }
  return {
    centre: new THREE.Vector3(selected.point.x - origin.x, TRACK_BASE_Y, selected.point.y - origin.y),
    tangent: new THREE.Vector3(selected.tangent.x, 0, selected.tangent.y).normalize(),
  };
}

function trackConfig(
  id: string,
  category: TrackCategory,
  controlPoints: THREE.Vector3[],
  options: Partial<Omit<TrackSegmentConfig, 'id' | 'category' | 'controlPoints'>> = {},
): TrackSegmentConfig {
  const standard = category === 'main'
    ? { minimumRadiusMetres: 500, sleeperSpacingMetres: 0.6, ballastWidthMetres: 4.5, sampleSpacingMetres: 3, condition: 'maintained' as const }
    : category === 'branch'
      ? { minimumRadiusMetres: 250, sleeperSpacingMetres: 0.62, ballastWidthMetres: 4, sampleSpacingMetres: 1.5, condition: 'worn' as const }
      : category === 'factory'
        ? { minimumRadiusMetres: 80, sleeperSpacingMetres: 0.58, ballastWidthMetres: 3.5, sampleSpacingMetres: 0.75, condition: 'rusted' as const }
        : { minimumRadiusMetres: 150, sleeperSpacingMetres: 0.62, ballastWidthMetres: 3.8, sampleSpacingMetres: 1.2, condition: 'stained' as const };
  return {
    id,
    category,
    controlPoints: controlPoints.map(asTuple),
    curve: controlPoints.length === 4 ? 'cubic-bezier' : 'catmull-rom',
    gaugeMetres: INDUSTRIAL_RAILWAY_STANDARDS.gaugeMetres,
    ...standard,
    ...options,
  };
}

export function createIndustrialRailwayConfig(definition: DistrictDefinition): RailwayLayout {
  const connection = coastalConnection(definition);
  const perpendicular = horizontalPerpendicular(connection.tangent);
  const inward = connection.centre.clone().multiplyScalar(-1).normalize();
  const inwardSign = Math.sign(inward.dot(perpendicular)) || 1;
  const halfMainSpacing = m(MAIN_TRACK_CENTRE_SPACING_METRES * 0.5);
  const mainTrackCentres: [THREE.Vector3, THREE.Vector3] = [
    connection.centre.clone().addScaledVector(perpendicular, halfMainSpacing * inwardSign),
    connection.centre.clone().addScaledVector(perpendicular, -halfMainSpacing * inwardSign),
  ];
  const innerMain = mainTrackCentres[0];
  const mainExtent = m(180);
  const tracks: TrackSegmentConfig[] = [
    trackConfig('MAINLINE_INNER', 'main', [
      innerMain.clone().addScaledVector(connection.tangent, -mainExtent),
      innerMain.clone().addScaledVector(connection.tangent, mainExtent),
    ], { startConnection: 'coastal-mainline-west', endConnection: 'coastal-mainline-east' }),
    trackConfig('MAINLINE_OUTER', 'main', [
      mainTrackCentres[1].clone().addScaledVector(connection.tangent, -mainExtent),
      mainTrackCentres[1].clone().addScaledVector(connection.tangent, mainExtent),
    ], { startConnection: 'coastal-mainline-west', endConnection: 'coastal-mainline-east' }),
  ];

  const branchHandedness = connection.tangent.clone().cross(inward).y < 0 ? 'left' : 'right';
  const mainTurnout: TurnoutConfig = {
    id: 'MAINLINE_BRANCH_TURNOUT_1_12',
    position: innerMain.clone().addScaledVector(connection.tangent, -m(140)),
    heading: Math.atan2(connection.tangent.z, connection.tangent.x),
    handedness: branchHandedness,
    ratio: 12,
    gaugeMetres: INDUSTRIAL_RAILWAY_STANDARDS.gaugeMetres,
    branchRadiusMetres: 350,
    branchLengthMetres: 72,
    category: 'branch',
  };
  const mainTurnoutResult = turnoutRoutes(mainTurnout);
  const branchStart = mainTurnoutResult.nodes.diverging.position;
  const branchArc = circularTransitionPoints(
    branchStart,
    mainTurnoutResult.nodes.diverging.heading,
    -mainTurnoutResult.nodes.diverging.heading,
    320,
    1.5,
  );
  const branchArcEnd = branchArc[branchArc.length - 1];
  const branchPoints = [...branchArc];
  for (let x = branchArcEnd.x + 2.5; x < 14.4; x += 2.5) {
    branchPoints.push(new THREE.Vector3(x, TRACK_BASE_Y, branchArcEnd.z));
  }
  branchPoints.push(new THREE.Vector3(14.4, TRACK_BASE_Y, branchArcEnd.z));
  tracks.push(trackConfig('INDUSTRIAL_BRANCH', 'branch', branchPoints, {
    curve: 'catmull-rom',
    startConnection: mainTurnoutResult.nodes.diverging.id,
    endConnection: 'district-east-continuation',
  }));

  const yardTurnoutPositions = [
    new THREE.Vector3(-12.5, TRACK_BASE_Y, -0.78),
    new THREE.Vector3(-8.2, TRACK_BASE_Y, -0.5),
    new THREE.Vector3(-4.4, TRACK_BASE_Y, -0.3),
    new THREE.Vector3(-0.6, TRACK_BASE_Y, -0.1),
    new THREE.Vector3(3.2, TRACK_BASE_Y, 0.08),
  ];
  const yardTurnoutHeadings = [0, 0.055, 0.053, 0.05, 0.02];
  const yardTurnouts = yardTurnoutPositions.map<TurnoutConfig>((position, index) => ({
    id: `YARD_THROAT_TURNOUT_${index + 1}`,
    position,
    heading: yardTurnoutHeadings[index],
    handedness: index === 4 ? 'right' : 'left',
    ratio: index === 0 ? 9 : 8,
    gaugeMetres: INDUSTRIAL_RAILWAY_STANDARDS.gaugeMetres,
    branchRadiusMetres: 180,
    branchLengthMetres: 28,
    category: 'yard',
  }));
  const yardTurnoutResults = yardTurnouts.map(turnoutRoutes);
  const yardStarts = yardTurnoutResults.map((result) => result.nodes.diverging.position);
  const yardEndX = [12.2, 12.4, 12.8, 13.2, 14.4];
  const yardZ = [0.18, 0.66, 1.14, 1.62, -0.3];
  const yardNames = ['ARRIVAL_DEPARTURE', 'CLASSIFICATION_1', 'CLASSIFICATION_2', 'CLASSIFICATION_3', 'RUN_AROUND'];
  yardStarts.forEach((start, index) => {
    const end = new THREE.Vector3(yardEndX[index], TRACK_BASE_Y, yardZ[index]);
    const controlPoints = index === 0
      ? [start, ...yardTurnoutPositions.slice(1), end]
      : [
        start,
        start.clone().addScaledVector(directionFromHeading(yardTurnoutResults[index].nodes.diverging.heading), index === 4 ? 4.2 : 4.8),
        end.clone().add(new THREE.Vector3(index === 4 ? -4.2 : -4.8, 0, 0)),
        end,
      ];
    tracks.push(trackConfig(`YARD_${yardNames[index]}`, 'yard', controlPoints, {
      curve: index === 0 ? 'catmull-rom' : 'cubic-bezier',
      startConnection: yardTurnouts[index].id,
      endConnection: index === 0 || index === 4 ? `YARD_${yardNames[index]}_EAST_CROSSOVER` : undefined,
      deadEnd: index > 0 && index < 4,
    }));
  });

  const sidingTurnouts: TurnoutConfig[] = [
    { id: 'SIDING_WAREHOUSE_TURNOUT', position: new THREE.Vector3(-17.5, TRACK_BASE_Y, -0.9), heading: 0, handedness: 'left', ratio: 9, gaugeMetres: 1.435, branchRadiusMetres: 220, branchLengthMetres: 30, category: 'siding' },
    { id: 'SIDING_TANK_UNLOADING_TURNOUT', position: new THREE.Vector3(1.0, TRACK_BASE_Y, -0.62), heading: 0.015, handedness: 'right', ratio: 9, gaugeMetres: 1.435, branchRadiusMetres: 220, branchLengthMetres: 30, category: 'siding' },
    { id: 'SIDING_CHEMICAL_TURNOUT', position: new THREE.Vector3(-15.0, TRACK_BASE_Y, -0.84), heading: 0, handedness: 'right', ratio: 8, gaugeMetres: 1.435, branchRadiusMetres: 180, branchLengthMetres: 30, category: 'siding' },
  ];
  const sidingDefinitions = [
    { id: 'WAREHOUSE_LOADING', turnout: sidingTurnouts[0], end: new THREE.Vector3(13.7, TRACK_BASE_Y, 2.1), controls: [new THREE.Vector3(-10.0, TRACK_BASE_Y, 0.45), new THREE.Vector3(4.0, TRACK_BASE_Y, 2.05)] },
    { id: 'TANK_UNLOADING', turnout: sidingTurnouts[1], end: new THREE.Vector3(13.5, TRACK_BASE_Y, -1.7), controls: [new THREE.Vector3(6.0, TRACK_BASE_Y, -1.05), new THREE.Vector3(10.2, TRACK_BASE_Y, -1.66)] },
    { id: 'CHEMICAL_LOGISTICS', turnout: sidingTurnouts[2], end: new THREE.Vector3(0.5, TRACK_BASE_Y, -2.2), controls: [new THREE.Vector3(-8.0, TRACK_BASE_Y, -1.4), new THREE.Vector3(-3.0, TRACK_BASE_Y, -2.1)] },
  ];
  sidingDefinitions.forEach(({ id, turnout, end, controls }) => {
    const start = turnoutRoutes(turnout).nodes.diverging.position;
    tracks.push(trackConfig(`SIDING_${id}`, 'siding', [start, controls[0], controls[1], end], {
      startConnection: turnout.id,
      deadEnd: true,
    }));
  });

  const factoryTurnouts: TurnoutConfig[] = [
    { id: 'FACTORY_RAIL_SHED_TURNOUT', position: new THREE.Vector3(-12.0, TRACK_BASE_Y, 2.1), heading: 0, handedness: 'left', ratio: 8, gaugeMetres: 1.435, branchRadiusMetres: 100, branchLengthMetres: 24, category: 'factory' },
    { id: 'FACTORY_COLD_STORAGE_TURNOUT', position: new THREE.Vector3(5.0, TRACK_BASE_Y, -1.5), heading: -0.04, handedness: 'right', ratio: 8, gaugeMetres: 1.435, branchRadiusMetres: 100, branchLengthMetres: 24, category: 'factory' },
    { id: 'FACTORY_POWER_PLANT_TURNOUT', position: new THREE.Vector3(-5.0, TRACK_BASE_Y, -2.0), heading: 0, handedness: 'right', ratio: 6, gaugeMetres: 1.435, branchRadiusMetres: 90, branchLengthMetres: 24, category: 'factory' },
  ];
  const shedStart = turnoutRoutes(factoryTurnouts[0]).nodes.diverging.position;
  const coldStart = turnoutRoutes(factoryTurnouts[1]).nodes.diverging.position;
  const powerStart = turnoutRoutes(factoryTurnouts[2]).nodes.diverging.position;
  tracks.push(
    trackConfig('FACTORY_RAIL_SHED_ACCESS', 'factory', [
      shedStart,
      new THREE.Vector3(-8.6, TRACK_BASE_Y, 2.38),
      new THREE.Vector3(-7.2, TRACK_BASE_Y, 2.5),
      new THREE.Vector3(-5.2, TRACK_BASE_Y, 2.5),
    ], { minimumRadiusMetres: 80, embedded: true, condition: 'embedded', deadEnd: true, destinationZone: 'rail-shed', startConnection: factoryTurnouts[0].id }),
    trackConfig('FACTORY_COLD_STORAGE_SPUR', 'factory', [
      coldStart,
      new THREE.Vector3(9.5, TRACK_BASE_Y, -2.1),
    ], { minimumRadiusMetres: 80, embedded: true, condition: 'embedded', deadEnd: true, destinationZone: 'cold-storage', startConnection: factoryTurnouts[1].id }),
    trackConfig('FACTORY_POWER_PLANT_SPUR', 'factory', [
      powerStart,
      new THREE.Vector3(-1.8, TRACK_BASE_Y, -2.32),
      new THREE.Vector3(-0.6, TRACK_BASE_Y, -2.4),
      new THREE.Vector3(0.6, TRACK_BASE_Y, -2.3),
    ], { minimumRadiusMetres: 80, condition: 'rusted', deadEnd: true, destinationZone: 'power-station', startConnection: factoryTurnouts[2].id }),
  );

  return {
    tracks,
    turnouts: [mainTurnout, ...yardTurnouts, ...sidingTurnouts, ...factoryTurnouts],
    coastalConnection: { centre: connection.centre, tangent: connection.tangent, mainTrackCentres },
  };
}

function curveForConfig(config: TrackSegmentConfig): THREE.Curve<THREE.Vector3> {
  const points = config.controlPoints.map(asVector);
  if (points.length === 2) return new THREE.LineCurve3(points[0], points[1]);
  if (config.curve === 'cubic-bezier' && points.length === 4) {
    return new THREE.CubicBezierCurve3(points[0], points[1], points[2], points[3]);
  }
  return new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.35);
}

function circumradius(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
  const ab = a.distanceTo(b);
  const bc = b.distanceTo(c);
  const ca = c.distanceTo(a);
  const areaTwice = Math.abs((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x));
  if (areaTwice < 1e-7) return Number.POSITIVE_INFINITY;
  return (ab * bc * ca) / (2 * areaTwice);
}

function estimateMinimumRadiusMetres(points: THREE.Vector3[]) {
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 1; index < points.length - 1; index += 1) {
    const radius = circumradius(points[index - 1], points[index], points[index + 1]);
    if (Number.isFinite(radius)) minimum = Math.min(minimum, radius * 10);
  }
  return minimum;
}

function sampleTrack(config: TrackSegmentConfig): SampledTrack {
  const curve = curveForConfig(config);
  const length = curve.getLength();
  const sampleCount = THREE.MathUtils.clamp(Math.ceil(length / m(config.sampleSpacingMetres)), 2, 4096);
  const points = curve.getSpacedPoints(sampleCount);
  const tangents = points.map((_, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    return next.clone().sub(previous).setY(0).normalize();
  });
  return {
    config,
    curve,
    points,
    tangents,
    length,
    minimumRadiusMetres: estimateMinimumRadiusMetres(points),
    sleeperCount: Math.max(2, Math.floor((length * 10) / config.sleeperSpacingMetres)),
  };
}

function sweptPrismGeometry(
  points: THREE.Vector3[],
  tangents: THREE.Vector3[],
  offsets: number[],
  topWidth: number,
  bottomWidth: number,
  height: number,
  verticalOffset: number,
) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  offsets.forEach((offset) => {
    const startVertex = positions.length / 3;
    points.forEach((point, index) => {
      const perpendicular = horizontalPerpendicular(tangents[index]);
      const centre = point.clone().addScaledVector(perpendicular, offset);
      const bottomLeft = centre.clone().addScaledVector(perpendicular, -bottomWidth * 0.5).setY(point.y + verticalOffset);
      const bottomRight = centre.clone().addScaledVector(perpendicular, bottomWidth * 0.5).setY(point.y + verticalOffset);
      const topLeft = centre.clone().addScaledVector(perpendicular, -topWidth * 0.5).setY(point.y + verticalOffset + height);
      const topRight = centre.clone().addScaledVector(perpendicular, topWidth * 0.5).setY(point.y + verticalOffset + height);
      for (const vertex of [bottomLeft, bottomRight, topLeft, topRight]) positions.push(vertex.x, vertex.y, vertex.z);
      normals.push(0, -1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0);
    });
    for (let index = 0; index < points.length - 1; index += 1) {
      const a = startVertex + index * 4;
      const b = a + 4;
      indices.push(
        a + 2, a + 3, b + 2, a + 3, b + 3, b + 2,
        a, b, a + 1, a + 1, b, b + 1,
        a, a + 2, b, a + 2, b + 2, b,
        a + 1, b + 1, a + 3, a + 3, b + 1, b + 3,
      );
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function renderTrack(parent: THREE.Group, sampled: SampledTrack, materials: RailwayMaterials) {
  const { config, points, tangents } = sampled;
  const group = new THREE.Group();
  group.name = `INDUSTRIAL_RAILWAY__TRACK__${config.id}`;
  group.userData = {
    railwayTrack: true,
    id: config.id,
    category: config.category,
    condition: config.condition,
    minimumRadiusMetres: config.minimumRadiusMetres,
    measuredMinimumRadiusMetres: Number.isFinite(sampled.minimumRadiusMetres) ? Number(sampled.minimumRadiusMetres.toFixed(1)) : null,
    lengthMetres: Math.round(sampled.length * 10),
    sleeperCount: sampled.sleeperCount,
    startConnection: config.startConnection ?? null,
    endConnection: config.endConnection ?? null,
  };
  const ballastWidth = m(config.ballastWidthMetres);
  const ballastHeight = m(config.embedded ? 0.08 : 0.14);
  const ballastGeometry = sweptPrismGeometry(points, tangents, [0], ballastWidth * 0.9, ballastWidth, ballastHeight, 0);
  const ballast = new THREE.Mesh(ballastGeometry, config.embedded ? materials.embedded : materials.ballast[config.category]);
  ballast.name = `${group.name}__${config.embedded ? 'EMBEDDED_BED' : 'BALLAST'}`;
  ballast.receiveShadow = true;
  ballast.renderOrder = 12;
  ballast.userData = { navObstacle: false, walkable: true, railwaySurface: true };
  group.add(ballast);

  const sleeperLength = m(INDUSTRIAL_RAILWAY_STANDARDS.sleeperLengthMetres);
  const sleeperWidth = m(INDUSTRIAL_RAILWAY_STANDARDS.sleeperWidthMetres);
  const sleeperThickness = m(INDUSTRIAL_RAILWAY_STANDARDS.sleeperThicknessMetres);
  const sleepers = new THREE.InstancedMesh(
    new THREE.BoxGeometry(sleeperLength, sleeperThickness, sleeperWidth),
    materials.sleeper[config.category],
    sampled.sleeperCount,
  );
  sleepers.name = `${group.name}__SLEEPERS`;
  sleepers.castShadow = true;
  sleepers.receiveShadow = true;
  sleepers.renderOrder = 12;
  sleepers.userData = { navObstacle: false, railwayInstances: true };
  const sleeper = new THREE.Object3D();
  const localX = new THREE.Vector3(1, 0, 0);
  for (let index = 0; index < sampled.sleeperCount; index += 1) {
    const t = (index + 0.5) / sampled.sleeperCount;
    const point = sampled.curve.getPointAt(t);
    const tangent = sampled.curve.getTangentAt(t).setY(0).normalize();
    const perpendicular = horizontalPerpendicular(tangent);
    sleeper.position.copy(point).setY(point.y + ballastHeight + sleeperThickness * 0.5);
    sleeper.quaternion.setFromUnitVectors(localX, perpendicular);
    sleeper.updateMatrix();
    sleepers.setMatrixAt(index, sleeper.matrix);
  }
  sleepers.instanceMatrix.needsUpdate = true;
  group.add(sleepers);

  const gaugeHalf = m(VISUAL_GAUGE_METRES * 0.5);
  const railHeight = m(INDUSTRIAL_RAILWAY_STANDARDS.railHeightMetres);
  const railWidth = m(0.085);
  const railGeometry = sweptPrismGeometry(
    points,
    tangents,
    [-gaugeHalf, gaugeHalf],
    railWidth,
    railWidth * 0.86,
    railHeight,
    ballastHeight + sleeperThickness * 0.72,
  );
  const rails = new THREE.Mesh(railGeometry, materials.rail[config.category]);
  rails.name = `${group.name}__CONTINUOUS_RAILS`;
  rails.castShadow = true;
  rails.receiveShadow = true;
  rails.renderOrder = 13;
  rails.userData = { navObstacle: false, continuousSplineRails: true };
  group.add(rails);
  parent.add(group);
  return group;
}

function renderTurnout(parent: THREE.Group, config: TurnoutConfig, materials: RailwayMaterials) {
  const result = turnoutRoutes(config);
  const group = new THREE.Group();
  group.name = `INDUSTRIAL_RAILWAY__TURNOUT__${config.id}`;
  const branchConfig = trackConfig(`${config.id}__DIVERGING_ROUTE`, config.category, result.divergingRoute, {
    minimumRadiusMetres: config.branchRadiusMetres,
    ballastWidthMetres: config.category === 'branch' ? 4 : 3.8,
    sleeperSpacingMetres: 0.58,
    sampleSpacingMetres: 0.65,
    startConnection: result.nodes.entry.id,
    endConnection: result.nodes.diverging.id,
  });
  branchConfig.curve = 'catmull-rom';
  renderTrack(group, sampleTrack(branchConfig), materials);

  const bladeLength = Math.max(4, Math.floor(result.divergingRoute.length * 0.42));
  const bladePoints = result.divergingRoute.slice(0, bladeLength);
  const bladeTangents = bladePoints.map((point, index) => {
    const next = bladePoints[Math.min(bladePoints.length - 1, index + 1)];
    const previous = bladePoints[Math.max(0, index - 1)];
    return next.clone().sub(previous).setY(0).normalize();
  });
  const switchBlades = new THREE.Mesh(
    sweptPrismGeometry(bladePoints, bladeTangents, [-m(0.47), m(0.47)], m(0.07), m(0.065), m(0.13), m(0.31)),
    materials.rail[config.category],
  );
  switchBlades.name = `${group.name}__SWITCH_BLADES`;
  switchBlades.renderOrder = 14;
  switchBlades.userData.navObstacle = false;
  group.add(switchBlades);

  const frogIndex = Math.floor(result.divergingRoute.length * 0.72);
  const frogPoint = result.divergingRoute[frogIndex];
  const frog = new THREE.Mesh(new THREE.ConeGeometry(m(0.15), m(0.55), 3), materials.darkMetal);
  frog.name = `${group.name}__CROSSING_FROG`;
  frog.rotation.x = Math.PI / 2;
  frog.rotation.z = config.heading + Math.PI / 2;
  frog.position.copy(frogPoint).setY(frogPoint.y + m(0.26));
  frog.scale.set(1, 0.35, 1);
  frog.userData.navObstacle = false;
  group.add(frog);

  const guardStart = Math.floor(result.divergingRoute.length * 0.58);
  const guardEnd = Math.max(guardStart + 3, Math.floor(result.divergingRoute.length * 0.86));
  const guardPoints = result.divergingRoute.slice(guardStart, guardEnd);
  const guardTangents = guardPoints.map((_, index) => {
    const previous = guardPoints[Math.max(0, index - 1)];
    const next = guardPoints[Math.min(guardPoints.length - 1, index + 1)];
    return next.clone().sub(previous).setY(0).normalize();
  });
  const guardRails = new THREE.Mesh(
    sweptPrismGeometry(guardPoints, guardTangents, [-m(0.47), m(0.47)], m(0.06), m(0.055), m(0.11), m(0.3)),
    materials.darkMetal,
  );
  guardRails.name = `${group.name}__GUARD_RAILS`;
  guardRails.userData.navObstacle = false;
  group.add(guardRails);

  const mechanism = new THREE.Mesh(new THREE.BoxGeometry(m(0.9), m(0.18), m(0.45)), materials.rust);
  mechanism.name = `${group.name}__SWITCH_MECHANISM`;
  const entryDirection = directionFromHeading(config.heading);
  const entryPerpendicular = horizontalPerpendicular(entryDirection);
  mechanism.position.copy(config.position)
    .addScaledVector(entryDirection, m(5.5))
    .addScaledVector(entryPerpendicular, m(config.handedness === 'left' ? -2.0 : 2.0))
    .setY(config.position.y + m(0.2));
  mechanism.rotation.y = -config.heading;
  mechanism.userData.navObstacle = true;
  group.add(mechanism);
  group.userData = {
    turnout: true,
    ratio: config.ratio,
    handedness: config.handedness,
    branchRadiusMetres: config.branchRadiusMetres,
    branchLengthMetres: config.branchLengthMetres,
    nodes: Object.fromEntries(Object.entries(result.nodes).map(([key, node]) => [key, {
      id: node.id,
      position: node.position.toArray(),
      heading: node.heading,
    }])),
  };
  parent.add(group);
  return result;
}

function addBufferStop(parent: THREE.Group, sampled: SampledTrack, materials: RailwayMaterials) {
  const end = sampled.points[sampled.points.length - 1];
  const tangent = sampled.tangents[sampled.tangents.length - 1];
  const perpendicular = horizontalPerpendicular(tangent);
  const group = new THREE.Group();
  group.name = `INDUSTRIAL_RAILWAY__BUFFER_STOP__${sampled.config.id}`;
  group.position.copy(end);
  group.rotation.y = -Math.atan2(tangent.z, tangent.x);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(m(2.8), m(0.25), m(0.22)), materials.rust);
  beam.position.set(0, m(0.62), 0);
  beam.name = `${group.name}__BEAM`;
  const legs = new THREE.InstancedMesh(new THREE.BoxGeometry(m(0.18), m(0.6), m(1.2)), materials.darkMetal, 2);
  legs.name = `${group.name}__INSTANCED_LEGS`;
  const leg = new THREE.Object3D();
  [-m(0.82), m(0.82)].forEach((x, index) => {
    leg.position.set(x, m(0.3), -m(0.35));
    leg.updateMatrix();
    legs.setMatrixAt(index, leg.matrix);
  });
  legs.instanceMatrix.needsUpdate = true;
  const stopBlock = new THREE.Mesh(new THREE.BoxGeometry(m(3.5), m(0.22), m(1.4)), materials.gravel);
  stopBlock.position.set(0, m(0.11), m(0.85));
  for (const item of [beam, legs, stopBlock]) item.userData.navObstacle = true;
  group.add(beam, legs, stopBlock);
  group.userData = { bufferStop: true, safetyDistanceMetres: 8, approachDirection: perpendicular.toArray() };
  parent.add(group);
}

function addServiceCrossings(parent: THREE.Group, materials: RailwayMaterials) {
  for (const [index, x, width] of [[1, 3.35, 0.92], [2, -11.8, 0.72]] as const) {
    const crossing = new THREE.Group();
    crossing.name = `INDUSTRIAL_RAILWAY__SERVICE_ROAD_CROSSING_${index}`;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(width, m(0.1), 4.6), materials.concrete);
    slab.position.set(x, TRACK_BASE_Y + m(0.13), 0.2);
    slab.userData = { navObstacle: false, walkable: true };
    crossing.add(slab);
    for (const z of [-1.92, 2.32]) {
      const warning = new THREE.Mesh(new THREE.BoxGeometry(width, m(0.025), m(0.18)), materials.safetyYellow);
      warning.position.set(x, TRACK_BASE_Y + m(0.2), z);
      warning.userData.navObstacle = false;
      crossing.add(warning);
    }
    crossing.userData = { definedCrossing: true, roadWidthMetres: Math.round(width * 10), gradeSeparated: false };
    parent.add(crossing);
  }
}

function addRailwayProps(parent: THREE.Group, materials: RailwayMaterials, turnoutCount: number) {
  const wagonPositions = [
    new THREE.Vector3(2.8, TRACK_BASE_Y, 0.66),
    new THREE.Vector3(4.15, TRACK_BASE_Y, 0.66),
    new THREE.Vector3(1.6, TRACK_BASE_Y, 1.14),
    new THREE.Vector3(3.0, TRACK_BASE_Y, 1.14),
    new THREE.Vector3(5.25, TRACK_BASE_Y, 1.62),
  ];
  const wagonBodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1.16, m(2.7), m(2.7)), materials.wagon, wagonPositions.length);
  wagonBodies.name = 'INDUSTRIAL_RAILWAY__INSTANCED_FREIGHT_WAGON_BODIES';
  const wheelCount = wagonPositions.length * 4;
  const wheels = new THREE.InstancedMesh(new THREE.CylinderGeometry(m(0.47), m(0.47), m(0.16), 10), materials.wheel, wheelCount);
  wheels.name = 'INDUSTRIAL_RAILWAY__INSTANCED_FREIGHT_WAGON_WHEELS';
  const object = new THREE.Object3D();
  let wheelIndex = 0;
  wagonPositions.forEach((position, index) => {
    object.position.copy(position).setY(position.y + m(0.95));
    object.rotation.set(0, 0, 0);
    object.updateMatrix();
    wagonBodies.setMatrixAt(index, object.matrix);
    for (const x of [-m(3.8), m(3.8)]) {
      for (const z of [-m(1.15), m(1.15)]) {
        object.position.copy(position).add(new THREE.Vector3(x, m(0.48), z));
        object.rotation.set(Math.PI / 2, 0, 0);
        object.updateMatrix();
        wheels.setMatrixAt(wheelIndex, object.matrix);
        wheelIndex += 1;
      }
    }
  });
  wagonBodies.instanceMatrix.needsUpdate = true;
  wheels.instanceMatrix.needsUpdate = true;
  wagonBodies.castShadow = true;
  wheels.castShadow = true;
  wagonBodies.userData.railwayInstances = true;
  wheels.userData.railwayInstances = true;
  parent.add(wagonBodies, wheels);

  const containerPositions = [
    [-13.5, 0, 2.7], [-12.25, 0, 2.7], [-11.0, 0, 2.7],
    [-13.5, 0.27, 2.7], [-12.25, 0.27, 2.7], [-11.0, 0.27, 2.7],
  ] as const;
  const containers = new THREE.InstancedMesh(new THREE.BoxGeometry(1.16, m(2.55), m(2.45)), materials.container, containerPositions.length);
  containers.name = 'INDUSTRIAL_RAILWAY__INSTANCED_STACKED_CONTAINERS';
  containerPositions.forEach(([x, y, z], index) => {
    object.position.set(x, TRACK_BASE_Y + m(1.28) + y, z);
    object.rotation.set(0, -0.02, 0);
    object.updateMatrix();
    containers.setMatrixAt(index, object.matrix);
    containers.setColorAt(index, new THREE.Color(index % 3 === 0 ? '#4b5557' : index % 3 === 1 ? '#5a453e' : '#38484d'));
  });
  containers.instanceMatrix.needsUpdate = true;
  containers.instanceColor!.needsUpdate = true;
  containers.castShadow = true;
  containers.userData.railwayInstances = true;
  parent.add(containers);

  const palletPositions = Array.from({ length: 12 }, (_, index) => new THREE.Vector3(-12.9 + (index % 4) * 0.45, TRACK_BASE_Y, 1.95 + Math.floor(index / 4) * 0.32));
  const pallets = new THREE.InstancedMesh(new THREE.BoxGeometry(m(1.2), m(0.15), m(1.0)), materials.rust, palletPositions.length);
  pallets.name = 'INDUSTRIAL_RAILWAY__INSTANCED_LOADING_PALLETS';
  palletPositions.forEach((position, index) => {
    object.position.copy(position).setY(position.y + m(0.08));
    object.rotation.set(0, (index % 3 - 1) * 0.08, 0);
    object.updateMatrix();
    pallets.setMatrixAt(index, object.matrix);
  });
  pallets.instanceMatrix.needsUpdate = true;
  pallets.userData.railwayInstances = true;
  parent.add(pallets);

  const lightPositions = [-12.8, -8.8, -4.8, -0.8, 3.2, 7.2, 11.2];
  const lightPosts = new THREE.InstancedMesh(new THREE.CylinderGeometry(m(0.07), m(0.09), m(8.5), 8), materials.darkMetal, lightPositions.length);
  const lightHeads = new THREE.InstancedMesh(new THREE.BoxGeometry(m(1.2), m(0.22), m(0.45)), materials.lamp, lightPositions.length);
  lightPosts.name = 'INDUSTRIAL_RAILWAY__INSTANCED_YARD_LIGHT_POSTS';
  lightHeads.name = 'INDUSTRIAL_RAILWAY__INSTANCED_YARD_LIGHT_HEADS';
  lightPositions.forEach((x, index) => {
    object.position.set(x, TRACK_BASE_Y + m(4.25), 2.62);
    object.rotation.set(0, 0, 0);
    object.updateMatrix();
    lightPosts.setMatrixAt(index, object.matrix);
    object.position.set(x, TRACK_BASE_Y + m(8.45), 2.45);
    object.updateMatrix();
    lightHeads.setMatrixAt(index, object.matrix);
  });
  lightPosts.instanceMatrix.needsUpdate = true;
  lightHeads.instanceMatrix.needsUpdate = true;
  lightPosts.userData.railwayInstances = true;
  lightHeads.userData.railwayInstances = true;
  parent.add(lightPosts, lightHeads);

  const cabinets = new THREE.InstancedMesh(new THREE.BoxGeometry(m(0.75), m(1.25), m(0.42)), materials.darkMetal, Math.max(4, Math.ceil(turnoutCount / 2)));
  cabinets.name = 'INDUSTRIAL_RAILWAY__INSTANCED_CABLE_CABINETS';
  for (let index = 0; index < cabinets.count; index += 1) {
    object.position.set(-9.4 + index * 3.4, TRACK_BASE_Y + m(0.63), -2.36);
    object.rotation.set(0, 0.03 * (index % 2 ? -1 : 1), 0);
    object.updateMatrix();
    cabinets.setMatrixAt(index, object.matrix);
  }
  cabinets.instanceMatrix.needsUpdate = true;
  cabinets.userData.railwayInstances = true;
  parent.add(cabinets);

  for (const [index, x, color] of [[1, -12.5, materials.signalGreen], [2, 13.2, materials.signalRed]] as const) {
    const signal = new THREE.Group();
    signal.name = `INDUSTRIAL_RAILWAY__SIGNAL_${index}`;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(m(0.07), m(0.08), m(4.2), 8), materials.darkMetal);
    post.position.set(x, TRACK_BASE_Y + m(2.1), -1.28);
    const head = new THREE.Mesh(new THREE.SphereGeometry(m(0.2), 10, 8), color);
    head.position.set(x, TRACK_BASE_Y + m(4.05), -1.28);
    signal.add(post, head);
    parent.add(signal);
  }

  const crane = new THREE.Group();
  crane.name = 'INDUSTRIAL_RAILWAY__CONTAINER_LOADING_GANTRY';
  for (const x of [-13.8, -9.4]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(m(0.28), m(7.5), m(0.32)), materials.rust);
    leg.position.set(x, TRACK_BASE_Y + m(3.75), 2.68);
    crane.add(leg);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(4.1, m(0.35), m(0.38)), materials.rust);
  beam.position.set(-11.6, TRACK_BASE_Y + m(7.35), 2.68);
  const trolley = new THREE.Mesh(new THREE.BoxGeometry(m(0.8), m(0.45), m(0.62)), materials.safetyYellow);
  trolley.position.set(-11.25, TRACK_BASE_Y + m(7.0), 2.68);
  crane.add(beam, trolley);
  parent.add(crane);

  const drainage = new THREE.Mesh(new THREE.BoxGeometry(24, m(0.08), m(0.28)), materials.darkMetal);
  drainage.name = 'INDUSTRIAL_RAILWAY__YARD_DRAINAGE_CHANNEL';
  drainage.position.set(0, TRACK_BASE_Y + m(0.04), 2.43);
  drainage.userData = { navObstacle: false, walkable: true };
  parent.add(drainage);

  const stains = new THREE.InstancedMesh(new THREE.CircleGeometry(m(1.35), 16), materials.oil, 9);
  stains.name = 'INDUSTRIAL_RAILWAY__INSTANCED_YARD_OIL_STAINS';
  stains.renderOrder = 14;
  for (let index = 0; index < stains.count; index += 1) {
    object.position.set(-8.4 + index * 2.15, TRACK_BASE_Y + m(0.24), 0.5 + (index % 3) * 0.48);
    object.rotation.set(-Math.PI / 2, 0, 0);
    object.scale.set(1.35 + (index % 3) * 0.24, 0.5, 1);
    object.updateMatrix();
    stains.setMatrixAt(index, object.matrix);
  }
  stains.instanceMatrix.needsUpdate = true;
  stains.userData = { navObstacle: false, railwayInstances: true };
  parent.add(stains);
}

function distanceToZone(point: THREE.Vector3, zone: BuildingClearanceZone) {
  const dx = Math.max(zone.minX - point.x, 0, point.x - zone.maxX);
  const dz = Math.max(zone.minZ - point.z, 0, point.z - zone.maxZ);
  return Math.hypot(dx, dz) * 10;
}

function segmentsIntersect(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3) {
  const cross = (p: THREE.Vector3, q: THREE.Vector3, r: THREE.Vector3) => (q.x - p.x) * (r.z - p.z) - (q.z - p.z) * (r.x - p.x);
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  return abC * abD < -1e-6 && cdA * cdB < -1e-6;
}

function validateTracks(sampledTracks: SampledTrack[]) {
  const warnings: string[] = [];
  const invalidTrackIds = new Set<string>();
  sampledTracks.forEach((track) => {
    if (Number.isFinite(track.minimumRadiusMetres) && track.minimumRadiusMetres + 1 < track.config.minimumRadiusMetres) {
      warnings.push(`${track.config.id}: measured radius ${track.minimumRadiusMetres.toFixed(1)} m is below ${track.config.minimumRadiusMetres} m; segment skipped`);
      invalidTrackIds.add(track.config.id);
    }
    const maximumGradient = track.config.category === 'main' ? 0.015 : track.config.category === 'yard' ? 0.0025 : track.config.category === 'factory' ? 0.025 : 0.02;
    for (let index = 0; index < track.points.length - 1; index += 1) {
      const start = track.points[index];
      const end = track.points[index + 1];
      const run = Math.hypot(end.x - start.x, end.z - start.z);
      const gradient = run > 0 ? Math.abs(end.y - start.y) / run : 0;
      if (gradient > maximumGradient + 1e-5) {
        warnings.push(`${track.config.id}: ${(gradient * 100).toFixed(2)}% gradient exceeds ${(maximumGradient * 100).toFixed(2)}%; segment skipped`);
        invalidTrackIds.add(track.config.id);
        break;
      }
    }
    const clearance = CATEGORY_CLEARANCE_METRES[track.config.category];
    for (const zone of BUILDING_CLEARANCE_ZONES) {
      if (zone.id === track.config.destinationZone) continue;
      const minimumDistance = track.points.reduce((minimum, point) => Math.min(minimum, distanceToZone(point, zone)), Number.POSITIVE_INFINITY);
      if (minimumDistance + 0.1 < clearance) {
        warnings.push(`${track.config.id}: ${minimumDistance.toFixed(1)} m clearance to ${zone.id} is below ${clearance} m; segment skipped`);
        invalidTrackIds.add(track.config.id);
        break;
      }
    }
  });
  for (let firstIndex = 0; firstIndex < sampledTracks.length; firstIndex += 1) {
    const first = sampledTracks[firstIndex];
    if (invalidTrackIds.has(first.config.id)) continue;
    for (let secondIndex = firstIndex + 1; secondIndex < sampledTracks.length; secondIndex += 1) {
      const second = sampledTracks[secondIndex];
      if (invalidTrackIds.has(second.config.id)) continue;
      const connected = first.config.startConnection === second.config.endConnection
        || first.config.endConnection === second.config.startConnection
        || first.config.startConnection === second.config.startConnection
        || first.config.endConnection === second.config.endConnection;
      if (connected || first.config.category === 'main' && second.config.category === 'main') continue;
      let intersects = false;
      for (let a = 0; a < first.points.length - 1 && !intersects; a += 1) {
        for (let b = 0; b < second.points.length - 1; b += 1) {
          if (segmentsIntersect(first.points[a], first.points[a + 1], second.points[b], second.points[b + 1])) {
            intersects = true;
            break;
          }
        }
      }
      if (intersects) warnings.push(`${first.config.id} crosses ${second.config.id}; crossing retained only where turnout/crossing geometry is defined`);
    }
  }
  return { warnings, invalidTrackIds };
}

function countDrawCalls(root: THREE.Object3D) {
  let count = 0;
  root.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh) count += 1;
  });
  return count;
}

export function buildIndustrialRailway(parent: THREE.Group, definition: DistrictDefinition) {
  const materials = createRailwayMaterials();
  const layout = createIndustrialRailwayConfig(definition);
  const railway = new THREE.Group();
  railway.name = 'INDUSTRIAL__RAILWAY';
  railway.userData = { dedicatedRailwayParent: true, layer: 'district-transit', deterministic: true };
  const mainLine = new THREE.Group();
  mainLine.name = 'INDUSTRIAL_RAILWAY__MAIN_LINE';
  const branch = new THREE.Group();
  branch.name = 'INDUSTRIAL_RAILWAY__INDUSTRIAL_BRANCH';
  const freightYard = new THREE.Group();
  freightYard.name = 'INDUSTRIAL_RAILWAY__FREIGHT_YARD';
  const sidings = new THREE.Group();
  sidings.name = 'INDUSTRIAL_RAILWAY__INDUSTRIAL_SIDINGS';
  const factoryTracks = new THREE.Group();
  factoryTracks.name = 'INDUSTRIAL_RAILWAY__FACTORY_TRACKS';
  const turnouts = new THREE.Group();
  turnouts.name = 'INDUSTRIAL_RAILWAY__TURNOUTS';
  const crossings = new THREE.Group();
  crossings.name = 'INDUSTRIAL_RAILWAY__CROSSINGS';
  const props = new THREE.Group();
  props.name = 'INDUSTRIAL_RAILWAY__RAILWAY_PROPS';
  railway.add(mainLine, branch, freightYard, sidings, factoryTracks, turnouts, crossings, props);

  const sampledTracks = layout.tracks.map(sampleTrack);
  const validation = validateTracks(sampledTracks);
  validation.warnings.forEach((warning) => console.warn(`[IndustrialRailway] ${warning}`));
  const renderedTracks: SampledTrack[] = [];
  sampledTracks.forEach((sampled) => {
    if (validation.invalidTrackIds.has(sampled.config.id)) return;
    const target = sampled.config.category === 'main'
      ? mainLine
      : sampled.config.category === 'branch'
        ? branch
        : sampled.config.category === 'yard'
          ? freightYard
          : sampled.config.category === 'siding'
            ? sidings
            : factoryTracks;
    renderTrack(target, sampled, materials);
    if (sampled.config.deadEnd) addBufferStop(target, sampled, materials);
    renderedTracks.push(sampled);
  });
  layout.turnouts.forEach((turnout) => renderTurnout(turnouts, turnout, materials));
  addServiceCrossings(crossings, materials);
  addRailwayProps(props, materials, layout.turnouts.length);

  const categoryCounts = renderedTracks.reduce<Record<TrackCategory, number>>((counts, track) => {
    counts[track.config.category] += 1;
    return counts;
  }, { main: 0, branch: 0, siding: 0, yard: 0, factory: 0 });
  const totalSleeperInstances = renderedTracks.reduce((sum, track) => sum + track.sleeperCount, 0);
  const totalLengthMetres = Math.round(renderedTracks.reduce((sum, track) => sum + track.length * 10, 0));
  const drawCalls = countDrawCalls(railway);
  railway.userData.railwaySystem = {
    hierarchy: ['MainLine', 'IndustrialBranch', 'FreightYard', 'IndustrialSidings', 'FactoryTracks', 'Turnouts', 'Crossings', 'RailwayProps'],
    categoryCounts,
    configuredTrackCount: layout.tracks.length,
    renderedTrackCount: renderedTracks.length,
    skippedTrackIds: Array.from(validation.invalidTrackIds),
    turnoutCount: layout.turnouts.length,
    bufferStopCount: renderedTracks.filter((track) => track.config.deadEnd).length,
    totalSleeperInstances,
    totalLengthMetres,
    drawCalls,
    performanceTargetMet: drawCalls < 200,
    validationWarnings: validation.warnings,
    coastalConnection: {
      centre: layout.coastalConnection.centre.toArray().map((value) => Number(value.toFixed(3))),
      tangent: layout.coastalConnection.tangent.toArray().map((value) => Number(value.toFixed(3))),
      mainTrackCentreSpacingMetres: MAIN_TRACK_CENTRE_SPACING_METRES,
      continuesAs: 'island coastal double-track railway',
    },
    standards: INDUSTRIAL_RAILWAY_STANDARDS,
  };
  Object.assign(parent.userData.industrialDistrict, {
    railwayHierarchy: categoryCounts,
    railwayTrackCount: renderedTracks.length,
    railwayTurnoutCount: layout.turnouts.length,
    railwayBufferStops: renderedTracks.filter((track) => track.config.deadEnd).length,
    railwayLengthMetres: totalLengthMetres,
    railwayDrawCalls: drawCalls,
    railwayPerformanceTargetMet: drawCalls < 200,
    railwayValidationWarnings: validation.warnings.length,
    railwaySkippedTracks: Array.from(validation.invalidTrackIds),
    railConnection: '1:12 turnout from coastal double-track main line to spline-based industrial branch',
  });
  parent.add(railway);
  return railway;
}
