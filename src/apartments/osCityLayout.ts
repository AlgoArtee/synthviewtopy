/** User-selected square sleeping platform and matching north-city alcove, in metres. */
export const CITY_BED_SIZE = 8.55;
export const CITY_BED = {
  minX: -9.80, maxX: -1.25, minZ: -9.46, maxZ: -.91, height: .72,
  width: CITY_BED_SIZE, depth: CITY_BED_SIZE, centerX: -5.525, centerZ: -5.185,
};
export const CITY_WINDOW = {x: CITY_BED.centerX, z: CITY_BED.minZ, width: CITY_BED.width, height: 3.5, sill: 0, frameWidth: .045};
/** Translate the complete authored city with its window, preserving all relative street distances. */
export const CITY_EXTERIOR_OFFSET = {x: CITY_WINDOW.x + 3, z: CITY_WINDOW.z + 3};
/** Raise the residence by eight storeys relative to both city districts.
 * Keep navigation in apartment-local metres and lower the external city roots. */
export const CITY_RESIDENCE_ELEVATION = 24;
/** L-shaped terrace wrapping the bedroom and the north/east bathroom walls. */
export const CITY_BALCONY = { minX: -1.12, maxX: 4.8, minZ: -9.46, maxZ: -.15, elbowX: 1.62, elbowZ: -3.22, area: 46.7034 };
export const CITY_BALCONY_DOOR = { minX: 2.1, maxX: 3.6, z: -.26, height: 2.62 };
export const CITY_KITCHEN_OFFSET_Z = 1.5;
export function insideCityBalcony(x: number, z: number, inset = 0) {
  const b = CITY_BALCONY;
  return x >= b.minX + inset && x <= b.maxX - inset && z >= b.minZ + inset && z <= b.maxZ
    && (x >= b.elbowX + inset || z <= b.elbowZ - inset);
}
export function insideCityFootprint(x: number, z: number, inset = 0) {
  // The living room and balcony overlap through the actual door; wall colliders
  // still contain all other crossings. Avoid an inset seam across the threshold.
  const main = x >= -4.8 + inset && x <= 4.8 - inset && z >= -3 + inset && z <= 6.15 - inset && !(x > 1.4 - inset && z < -.15 + inset);
  const door = x >= CITY_BALCONY_DOOR.minX + inset && x <= CITY_BALCONY_DOOR.maxX - inset && z >= -.65 && z <= .3;
  const alcove = x >= CITY_BED.minX + inset && x <= CITY_BED.maxX - inset && z >= CITY_BED.minZ + inset && z <= CITY_BED.maxZ;
  return main || alcove || insideCityBalcony(x, z, inset) || door;
}

