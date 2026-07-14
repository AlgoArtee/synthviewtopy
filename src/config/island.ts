/** Shared plan and navigation constants. One world unit represents ten metres. */
export const WORLD_METRES_PER_UNIT = 10;
export const metresToWorldUnits = (metres: number) => metres / WORLD_METRES_PER_UNIT;
export const worldUnitsToMetres = (worldUnits: number) => worldUnits * WORLD_METRES_PER_UNIT;

/** The planted island surface is 16.1 m above the ocean datum. */
export const ISLAND_SURFACE_Y = metresToWorldUnits(16.1);
/**
 * Keep architecture and walk controls at human scale while tripling the
 * distance between the masterplan's concentric roads.
 */
export const WORLD_EXPANSION = 3;
export const ISLAND_RADIUS = 92 * WORLD_EXPANSION;
export const ISLAND_APOTHEM = (Math.sqrt(3) / 2) * ISLAND_RADIUS;

/** Unwarps the wide perspective sketch into a true top-down masterplan. */
export const PLAN_SCALE_X = 1.2;
export const PLAN_SCALE_Z = 1.8;

/** Dome centres sit just inside the six vertices of the regular hexagon. */
export const BIOME_RING_RADIUS = 76 * WORLD_EXPANSION;
export const BIOME_RING_APOTHEM = (Math.sqrt(3) / 2) * BIOME_RING_RADIUS;

export const BIOME_PLAN_POSITIONS: Readonly<Record<string, readonly [x: number, z: number]>> = {
  'alpine-dome': [0, -BIOME_RING_RADIUS],
  'tundra-dome': [BIOME_RING_APOTHEM, -BIOME_RING_RADIUS / 2],
  'desert-dome': [BIOME_RING_APOTHEM, BIOME_RING_RADIUS / 2],
  'savanna-dome': [0, BIOME_RING_RADIUS],
  'temperate-deciduous-forest-dome': [-BIOME_RING_APOTHEM, BIOME_RING_RADIUS / 2],
  'tropical-rainforest-dome': [-BIOME_RING_APOTHEM, -BIOME_RING_RADIUS / 2],
};

/** Pointy-top regular hexagon, ordered clockwise from the north vertex. */
export const ISLAND_POINTS: ReadonlyArray<readonly [x: number, z: number]> = [
  [0, -ISLAND_RADIUS],
  [ISLAND_APOTHEM, -ISLAND_RADIUS / 2],
  [ISLAND_APOTHEM, ISLAND_RADIUS / 2],
  [0, ISLAND_RADIUS],
  [-ISLAND_APOTHEM, ISLAND_RADIUS / 2],
  [-ISLAND_APOTHEM, -ISLAND_RADIUS / 2],
];

/** Exact road boundaries reconstructed from the five sketch rings after unwarping. */
export const DISTRICT_ROAD_RADII = [14, 21, 29.5, 40, 51.5].map(
  (radius) => radius * WORLD_EXPANSION,
) as readonly number[];

/**
 * WALK uses an average 1.7 m adult as its scale reference. The camera sits at
 * a realistic 1.62 m eye level rather than at the top of the head.
 */
export const WALK_PERSON_HEIGHT_METRES = 1.7;
export const WALK_EYE_HEIGHT_METRES = 1.62;
export const WALK_EYE_HEIGHT = metresToWorldUnits(WALK_EYE_HEIGHT_METRES);
export const WALK_RADIUS = metresToWorldUnits(0.3);
export const WALK_SPEED = metresToWorldUnits(1.4);
export const WALK_FAST_SPEED = metresToWorldUnits(4.5);
export const WALK_STEP_HEIGHT = metresToWorldUnits(0.38);
export const WALK_GRAVITY = metresToWorldUnits(9.81);
export const WALK_JUMP_SPEED = metresToWorldUnits(2.8);
export const WALK_INSPECT_DISTANCE = metresToWorldUnits(4.5);
export const WALK_VERTICAL_FOV = 55;
