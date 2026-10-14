/** Expand the square about its apartment-facing edge, preserving the mall/chip axis. */
export const CITY_PLAZA_SCALE = 1.3;
export const plazaX = (x: number) => 8 + (x - 8) * CITY_PLAZA_SCALE;
export const plazaZ = (z: number) => -5 + (z + 5) * CITY_PLAZA_SCALE;

/** Shared by pavement traces, chip contacts and their travelling light packets. */
export const CITY_CIRCUIT_COLORS = ['#168aff', '#48b3ff', '#ff389f', '#ff79c7'] as const;
