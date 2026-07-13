/** Shared plan and navigation constants. One world unit represents ten metres. */
export const ISLAND_SURFACE_Y = 1.72;
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

export const WALK_EYE_HEIGHT = 0.18;
export const WALK_RADIUS = 0.055;
export const WALK_SPEED = 0.62;
export const WALK_FAST_SPEED = 1.45;
