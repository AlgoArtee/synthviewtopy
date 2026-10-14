import * as THREE from 'three';
import type { RoomNavigation } from './liminetteRoom';

import { CITY_BED, insideCityFootprint } from './osCityLayout';
export { CITY_BED } from './osCityLayout';
export function cityFloorHeight(x: number, z: number) {
  return x >= CITY_BED.minX && x <= CITY_BED.maxX && z >= CITY_BED.minZ && z <= CITY_BED.maxZ ? CITY_BED.height : 0;
}
/** Deliberate climb at the mattress edge, then normal walking on its elevated surface. */
export function createCityNavigation(colliders: THREE.Box3[]): RoomNavigation {
  const radius = .24, eye = 1.65;
  let lastJump = false, climbing = false, settling = false, progress = 0, lastPosition = new THREE.Vector3();
  const from = new THREE.Vector3(), to = new THREE.Vector3();
  function nearBed(p: THREE.Vector3) {
    const x = THREE.MathUtils.clamp(p.x, CITY_BED.minX + radius, CITY_BED.maxX - radius);
    return Math.hypot(p.x - x, p.z - CITY_BED.maxZ) < .85 && p.z > CITY_BED.maxZ - .15;
  }
  function clear(x: number, z: number, support: number) {
    if (!insideCityFootprint(x, z, radius)) return false;
    for (const box of colliders) {
      if (box.max.y < support + .18 || box.min.y > support + 1.8) continue;
      const nx = THREE.MathUtils.clamp(x, box.min.x, box.max.x), nz = THREE.MathUtils.clamp(z, box.min.z, box.max.z);
      if ((nx - x) ** 2 + (nz - z) ** 2 < radius ** 2) return false;
    }
    return true;
  }
  return {
    controls: 'Drag to look; WASD/arrows to walk; Space or Climb bed at the mattress edge; walk off to step down; Room guide for weather and viewpoints',
    reset(position) { climbing = false; settling = false; progress = 0; lastJump = false; lastPosition.copy(position); },
    step(position, direction, dt, jump) {
      if (jump && !lastJump && !climbing && cityFloorHeight(position.x, position.z) === 0 && nearBed(position)) {
        from.copy(position); to.set(THREE.MathUtils.clamp(position.x, CITY_BED.minX + radius + .05, CITY_BED.maxX - radius - .05), eye + CITY_BED.height, CITY_BED.maxZ - .36);
        climbing = true; progress = 0;
      }
      lastJump = jump;
      if (climbing) {
        progress = Math.min(1, progress + dt / .7);
        const t = THREE.MathUtils.smoothstep(progress, 0, 1);
        position.lerpVectors(from, to, t);
        if (progress === 1) climbing = false;
      } else if (direction.lengthSq() > 0) {
        const support = cityFloorHeight(position.x, position.z);
        const dx = direction.x * dt * 2.35, dz = direction.z * dt * 2.35;
        const tryMove = (x: number, z: number) => {
          const next = cityFloorHeight(x, z);
          return next <= support + .2 && clear(x, z, next);
        };
        if (tryMove(position.x + dx, position.z)) position.x += dx;
        if (tryMove(position.x, position.z + dz)) position.z += dz;
        settling = true;
      }
      if (settling && !climbing) {
        const targetHeight=eye+cityFloorHeight(position.x,position.z);
        position.y=THREE.MathUtils.damp(position.y,targetHeight,12,dt);
        if(Math.abs(position.y-targetHeight)<.001){position.y=targetHeight;settling=false;}
      }
      lastPosition.copy(position);
    },
    snapshot: () => ({ mode: climbing ? 'climbing' : cityFloorHeight(lastPosition.x, lastPosition.z) > 0 ? 'on-bed' : 'walking', supportHeight: cityFloorHeight(lastPosition.x, lastPosition.z), canClimbBed: nearBed(lastPosition), climbProgress: progress }),
  };
}
