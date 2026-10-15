import * as THREE from 'three';
import type { RoomNavigation } from './liminetteRoom';

import { CITY_BED, insideCityFootprint, insideCityBalcony } from './osCityLayout';
export { CITY_BED } from './osCityLayout';
export function cityFloorHeight(x: number, z: number) {
  return x >= CITY_BED.minX && x <= CITY_BED.maxX && z >= CITY_BED.minZ && z <= CITY_BED.maxZ ? CITY_BED.height : 0;
}
/** Deliberate climb at the mattress edge, then normal walking on its elevated surface. */
export function createCityNavigation(colliders: THREE.Box3[], guardrails: THREE.Box3[] = []): RoomNavigation {
  const radius = .24, eye = 1.65;
  const rails = new Set(guardrails), railEyeInset = .02;
  let lastJump = false, climbing = false, settling = false, progress = 0, lastPosition = new THREE.Vector3();
  const from = new THREE.Vector3(), to = new THREE.Vector3();
  function nearBed(p: THREE.Vector3) {
    const x = THREE.MathUtils.clamp(p.x, CITY_BED.minX + radius, CITY_BED.maxX - radius);
    return Math.hypot(p.x - x, p.z - CITY_BED.maxZ) < .85 && p.z > CITY_BED.maxZ - .15;
  }
  function clear(x: number, z: number, support: number) {
    // This position is the eye, above the waist-high guard. Allow the head to
    // lean over its cap, but contain it inside the slab. Keep ordinary body
    // clearance at the walls, doorway, planter and balcony's inner edges.
    if (!insideCityFootprint(x, z, radius)
      && !(rails.size && insideCityBalcony(x, z, radius, railEyeInset))) return false;
    for (const box of colliders) {
      if (rails.has(box)) continue;
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
        const moveAxis = (axis: 'x' | 'z', distance: number) => {
          if (!distance) return;
          const start = position[axis];
          const allowed = (fraction: number) => tryMove(axis === 'x' ? start + distance * fraction : position.x, axis === 'z' ? start + distance * fraction : position.z);
          let fraction = 1;
          if (!allowed(1)) {
            // Resolve the remaining safe part of a step instead of stopping a
            // whole frame short of the rail (up to 12cm on a slow frame).
            let low = 0, high = 1;
            for (let i = 0; i < 8; i++) { const mid = (low + high) / 2; if (allowed(mid)) low = mid; else high = mid; }
            fraction = low;
          }
          position[axis] = start + distance * fraction;
        };
        moveAxis('x', dx);moveAxis('z', dz);
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
