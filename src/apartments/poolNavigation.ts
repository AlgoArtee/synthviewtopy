import * as THREE from 'three';
import type { RoomNavigation } from './liminetteRoom';

export type PoolRectangle = { minX: number; maxX: number; minZ: number; maxZ: number };
export type PoolNavigationLayout = {
  bounds: PoolRectangle; walkable: PoolRectangle[];
  pool: PoolRectangle & { depth: number; waterLevel: number };
  board: PoolRectangle & { height: number; steps: (PoolRectangle & { height: number })[] };
  ladder: { x: number; z: number; exitX: number; exitZ: number };
};

/** Gravity and surface/underwater swimming confined to this one pool room. */
export function createPoolNavigation(getLayout: () => PoolNavigationLayout | undefined,
  colliders: THREE.Box3[], splash: (x: number, z: number, impact: number) => void,
  waterView: (underwater: boolean) => void, tickEffects: (dt: number) => void): RoomNavigation & { floorHeight: (x: number, z: number) => number } {
  const radius = .24, eyeHeight = 1.65;
  let mode: 'walking' | 'airborne' | 'swimming' | 'climbing' = 'walking';
  let feet = 0, velocityY = 0, previousJump = false, onBoard = false, underwater = false;
  let time = 0, entryAge = 10, plunge = 0, climbingAge = 0, splashCount = 0, lastImpact = 0;
  const momentum = new THREE.Vector3(), climbStart = new THREE.Vector3();
  const point = new THREE.Vector3();
  const inside = (r: PoolRectangle, x: number, z: number, pad = 0) =>
    x >= r.minX + pad && x <= r.maxX - pad && z >= r.minZ + pad && z <= r.maxZ - pad;
  function basin(x: number, z: number, pad = 0) {
    const layout = getLayout();
    // The export includes the coping in its pool exclusion rectangle.
    return !!layout && inside(layout.pool, x, z, .30 + pad);
  }
  function floorHeight(x: number, z: number) {
    const layout = getLayout(); if (!layout) return 0;
    for (const step of layout.board.steps) if (inside(step, x, z)) return step.height;
    if (inside(layout.board, x, z) && feet >= layout.board.height - .24) return layout.board.height;
    return basin(x, z) ? -1.52 : 0;
  }
  function canOccupy(x: number, z: number, proposedFeet: number) {
    const layout = getLayout(); if (!layout || !inside(layout.bounds, x, z, radius)) return false;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, px = x + radius * Math.cos(a), pz = z + radius * Math.sin(a);
      if (!layout.walkable.some(region => inside(region, px, pz))) return false;
    }
    for (const box of colliders) {
      // Board base and access treads are support surfaces beneath the feet.
      // Allow a 20 cm tread plus the cabinet's 5 cm raised rim at the landing.
      if (box.max.y <= proposedFeet + .28 || box.min.y >= proposedFeet + 1.65) continue;
      const dx = x - THREE.MathUtils.clamp(x, box.min.x, box.max.x);
      const dz = z - THREE.MathUtils.clamp(z, box.min.z, box.max.z);
      if (dx * dx + dz * dz < radius * radius) return false;
    }
    return true;
  }
  function beginClimb(position: THREE.Vector3) {
    mode = 'climbing'; climbingAge = 0; climbStart.copy(position); velocityY = 0; momentum.set(0, 0, 0);
  }
  return {
    controls: 'WASD/arrows move or swim; Space jump / climb out at the pool ladder; hold C to dive; walk up the brass steps to the board; drag to look; F fullscreen',
    floorHeight,
    reset(position) {
      feet = position.y - eyeHeight; velocityY = 0; mode = 'walking'; previousJump = false;
      onBoard = false; underwater = false; momentum.set(0, 0, 0); entryAge = 10; waterView(false);
    },
    step(position, intent, dt, jumpHeld, diveHeld) {
      const layout = getLayout(); if (!layout) return;
      time += dt; tickEffects(dt);
      const jump = jumpHeld && !previousJump; previousJump = jumpHeld;
      const water = layout.pool.waterLevel;
      if (mode === 'climbing') {
        climbingAge = Math.min(1, climbingAge + dt / .85);
        const t = climbingAge * climbingAge * (3 - 2 * climbingAge);
        position.set(THREE.MathUtils.lerp(climbStart.x, layout.ladder.exitX, t),
          THREE.MathUtils.lerp(climbStart.y, eyeHeight, t) + .14 * Math.sin(Math.PI * t),
          THREE.MathUtils.lerp(climbStart.z, layout.ladder.exitZ, t));
        if (climbingAge === 1) { mode = 'walking'; feet = 0; }
      } else if (mode === 'swimming') {
        const atLadder = Math.hypot(position.x - layout.ladder.x, position.z - layout.ladder.z) < .92;
        if (jump && atLadder) beginClimb(position);
        else {
          const speed = diveHeld ? 1.45 : 1.85;
          position.x = THREE.MathUtils.clamp(position.x + intent.x * speed * dt, layout.pool.minX + .54, layout.pool.maxX - .54);
          position.z = THREE.MathUtils.clamp(position.z + intent.z * speed * dt, layout.pool.minZ + .54, layout.pool.maxZ - .54);
          entryAge += dt;
          const dip = entryAge < .75 ? plunge * Math.sin(Math.PI * entryAge / .75) : 0;
          const target = diveHeld ? water - .86 : water + .14 - dip + Math.sin(time * 2.2) * .014;
          position.y = THREE.MathUtils.damp(position.y, target, 9, dt);
          feet = -1.38; velocityY = 0; onBoard = false;
        }
      } else {
        const currentFloor = floorHeight(position.x, position.z);
        onBoard = currentFloor === layout.board.height && inside(layout.board, position.x, position.z);
        if (jump && mode === 'walking') {
          velocityY = onBoard ? 5.3 : 4.5; mode = 'airborne'; feet += .002;
          momentum.copy(intent).multiplyScalar(onBoard ? 3.0 : 2.6);
        }
        const dx = mode === 'airborne' ? (intent.lengthSq() ? intent.x * 2.6 : momentum.x) : intent.x * 2.6;
        const dz = mode === 'airborne' ? (intent.lengthSq() ? intent.z * 2.6 : momentum.z) : intent.z * 2.6;
        for (const axis of ['x', 'z'] as const) {
          point.copy(position); point[axis] += (axis === 'x' ? dx : dz) * dt;
          const support = floorHeight(point.x, point.z);
          if (mode === 'walking' && support > feet + .23) continue;
          if (canOccupy(point.x, point.z, mode === 'walking' ? Math.max(feet, support) : feet)) position[axis] = point[axis];
        }
        const support = floorHeight(position.x, position.z);
        if (mode === 'walking') {
          if (support < feet - .24) { mode = 'airborne'; velocityY = 0; momentum.copy(intent).multiplyScalar(2.6); }
          else feet = support;
        }
        if (mode === 'airborne') {
          velocityY -= 9.8 * dt; feet += velocityY * dt;
          if (basin(position.x, position.z) && feet <= water && velocityY < 0) {
            lastImpact = -velocityY; splashCount++; splash(position.x, position.z, lastImpact);
            mode = 'swimming'; entryAge = 0; plunge = THREE.MathUtils.clamp(lastImpact / 16, .12, .50);
            momentum.set(0, 0, 0); velocityY = 0;
          } else if (feet <= support) { feet = support; velocityY = 0; mode = 'walking'; }
        }
        position.y = feet + eyeHeight;
      }
      const submerged = mode === 'swimming' && position.y < water - .055;
      if (submerged !== underwater) { underwater = submerged; waterView(underwater); }
    },
    snapshot() {
      return { mode, feetY: +feet.toFixed(3), verticalVelocity: +velocityY.toFixed(3), onBoard, underwater,
        splashCount, lastImpact: +lastImpact.toFixed(3), climbProgress: +climbingAge.toFixed(3) };
    },
  };
}
