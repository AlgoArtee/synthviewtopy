import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import {
  WALK_EYE_HEIGHT,
  WALK_FAST_SPEED,
  WALK_GRAVITY,
  WALK_JUMP_HOLD_HEIGHT_METRES,
  WALK_JUMP_SPEED,
  WALK_JUMP_TAP_HEIGHT_METRES,
  WALK_JUMP_TAP_SPEED,
  WALK_RADIUS,
  WALK_SPEED,
  WALK_STEP_HEIGHT,
  WALK_TURBO_SPEED,
  worldUnitsToMetres,
} from '../config/island';

export interface WalkSnapshot {
  active: boolean;
  pointerLocked: boolean;
  lookMode: 'pointer-lock' | 'drag' | 'idle';
  grounded: boolean;
  positionWorld: [number, number, number];
  positionMetres: [number, number, number];
  groundY: number | null;
  surfaceKind: string;
  roomId: string;
  speedMetresPerSecond: number;
  turboEnabled: boolean;
  jumpState: 'grounded' | 'rising' | 'falling';
  jumpHeld: boolean;
  jumpHeightMetres: number;
  jumpHeightRangeMetres: [number, number];
  movementKeys: string[];
  direction: [number, number, number];
}

interface WalkControllerOptions {
  camera: THREE.PerspectiveCamera;
  element: HTMLElement;
  navigationRoot: THREE.Object3D;
  onLockChange?: (locked: boolean, dragLookActive?: boolean) => void;
  onTurboChange?: (enabled: boolean) => void;
  onInteract?: () => void;
}

function isActuallyVisible(object: THREE.Object3D) {
  let cursor: THREE.Object3D | null = object;
  while (cursor) {
    if (!cursor.visible) return false;
    cursor = cursor.parent;
  }
  return true;
}

interface NavigationBarrierSegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number;
  minY: number;
  maxY: number;
}

export class WalkController {
  readonly pointerControls: PointerLockControls;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly element: HTMLElement;
  private readonly navigationRoot: THREE.Object3D;
  private readonly onLockChange?: (locked: boolean, dragLookActive?: boolean) => void;
  private readonly onTurboChange?: (enabled: boolean) => void;
  private readonly onInteract?: () => void;
  private readonly raycaster = new THREE.Raycaster();
  private readonly walkables: THREE.Object3D[] = [];
  private readonly obstacleBounds: THREE.Box3[] = [];
  private readonly accessBounds: THREE.Box3[] = [];
  private readonly barrierSegments: NavigationBarrierSegment[] = [];
  private readonly keys = new Set<string>();
  private readonly direction = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly move = new THREE.Vector3();
  private readonly candidate = new THREE.Vector3();
  private readonly rayOrigin = new THREE.Vector3();
  private readonly down = new THREE.Vector3(0, -1, 0);
  private readonly lookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private externalIntent = { x: 0, z: 0, sprint: false };
  private active = false;
  private grounded = false;
  private groundY: number | null = null;
  private surfaceKind = 'stone';
  private roomId = 'outside';
  private currentSpeed = 0;
  private turboEnabled = false;
  private dragLookActive = false;
  private lastPointer: { x: number; y: number } | null = null;
  private velocityY = 0;
  private isJumping = false;
  private jumpHeld = false;
  private jumpStartY = 0;
  private jumpPeakHeight = 0;
  public isSitting = false;
  public seatTarget = new THREE.Vector3();

  constructor(options: WalkControllerOptions) {
    this.camera = options.camera;
    this.element = options.element;
    this.navigationRoot = options.navigationRoot;
    this.onLockChange = options.onLockChange;
    this.onTurboChange = options.onTurboChange;
    this.onInteract = options.onInteract;
    this.pointerControls = new PointerLockControls(this.camera, this.element);
    this.pointerControls.addEventListener('lock', () => {
      this.dragLookActive = false;
      this.lastPointer = null;
      this.onLockChange?.(true, false);
    });
    this.pointerControls.addEventListener('unlock', () => {
      this.keys.clear();
      this.dragLookActive = false;
      this.lastPointer = null;
      this.onLockChange?.(false, false);
    });
    this.element.addEventListener('pointerdown', this.onPointerDown);
    this.element.addEventListener('pointermove', this.onPointerMove);
    this.element.addEventListener('pointerleave', this.onPointerLeave);
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp, { passive: false });
    window.addEventListener('blur', this.clearInput);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    document.addEventListener('pointerlockerror', this.onPointerLockError, { capture: true });
  }

  private findNearestWalkable(x: number, z: number): { x: number; y: number; z: number } | null {
    const gy = this.sampleGround(x, z, { spawnSearch: true });
    if (gy !== null && this.isSpawnClear(x, z, gy)) {
      return { x, y: gy, z };
    }

    const steps = 8;
    const angleSteps = 12;
    for (let r = 1; r <= steps; r++) {
      const radius = r * 0.75;
      for (let a = 0; a < angleSteps; a++) {
        const angle = (a / angleSteps) * Math.PI * 2;
        const cx = x + Math.cos(angle) * radius;
        const cz = z + Math.sin(angle) * radius;
        const cy = this.sampleGround(cx, cz, { spawnSearch: true });
        if (cy !== null && this.isSpawnClear(cx, cz, cy)) {
          return { x: cx, y: cy, z: cz };
        }
      }
    }

    const bridgeSpawn = new THREE.Vector3(0, 1.82, 44);
    const bgy = this.sampleGround(bridgeSpawn.x, bridgeSpawn.z, { spawnSearch: true });
    if (bgy !== null) {
      return { x: bridgeSpawn.x, y: bgy, z: bridgeSpawn.z };
    }
    return null;
  }

  enter(
    preferredSpawn = new THREE.Vector3(0, 0, 44),
    lookDirection?: THREE.Vector3,
    fallbackSpawn?: THREE.Vector3,
  ) {
    this.active = true;
    this.keys.clear();
    this.externalIntent = { x: 0, z: 0, sprint: false };
    this.dragLookActive = false;
    this.lastPointer = null;
    this.refreshNavigation();

    let pt = this.findNearestWalkable(preferredSpawn.x, preferredSpawn.z);
    if (!pt && fallbackSpawn) {
      pt = this.findNearestWalkable(fallbackSpawn.x, fallbackSpawn.z);
    }
    if (!pt) {
      pt = { x: 0, y: 1.82, z: 44 };
    }

    this.groundY = pt.y;
    this.sampleGround(pt.x, pt.z, { spawnSearch: true, trackSurface: true });
    this.grounded = true;
    this.velocityY = 0;
    this.isJumping = false;
    this.jumpHeld = false;
    this.jumpPeakHeight = 0;
    this.camera.position.set(pt.x, this.groundY + WALK_EYE_HEIGHT, pt.z);

    if (lookDirection && lookDirection.lengthSq() > 0.0001) {
      this.direction.copy(lookDirection);
      this.direction.y = THREE.MathUtils.clamp(this.direction.y, -0.3, 0.3);
      this.direction.normalize();
      this.camera.lookAt(this.camera.position.clone().add(this.direction));
    } else {
      this.camera.lookAt(0, this.groundY + WALK_EYE_HEIGHT * 0.85, 0);
    }
  }

  exit() {
    this.active = false;
    this.keys.clear();
    this.externalIntent = { x: 0, z: 0, sprint: false };
    this.currentSpeed = 0;
    this.velocityY = 0;
    this.isJumping = false;
    this.jumpHeld = false;
    this.jumpPeakHeight = 0;
    this.dragLookActive = false;
    this.lastPointer = null;
    if (this.pointerControls.isLocked) this.pointerControls.unlock();
  }

  requestPointerLock() {
    if (!this.active || this.pointerControls.isLocked) return;
    this.enableDragLook();
    if (typeof (this.element as HTMLElement & { requestPointerLock?: unknown }).requestPointerLock !== 'function') return;
    try {
      this.pointerControls.lock();
    } catch {
      this.enableDragLook();
    }
  }

  setMoveIntent(x: number, z: number, sprint = false) {
    this.externalIntent = {
      x: THREE.MathUtils.clamp(x, -1, 1),
      z: THREE.MathUtils.clamp(z, -1, 1),
      sprint,
    };
  }

  setTurboEnabled(enabled: boolean) {
    if (this.turboEnabled === enabled) return;
    this.turboEnabled = enabled;
    this.onTurboChange?.(enabled);
  }

  toggleTurbo() {
    this.setTurboEnabled(!this.turboEnabled);
    return this.turboEnabled;
  }

  isTurboEnabled() {
    return this.turboEnabled;
  }

  refreshNavigation() {
    this.walkables.length = 0;
    this.obstacleBounds.length = 0;
    this.accessBounds.length = 0;
    this.barrierSegments.length = 0;
    this.navigationRoot.updateMatrixWorld(true);
    this.navigationRoot.traverse((child) => {
      if (child.userData.navAccess && child instanceof THREE.Mesh) {
        const bounds = new THREE.Box3().setFromObject(child, true);
        if (!bounds.isEmpty()) this.accessBounds.push(bounds);
      }
      if (!isActuallyVisible(child)) return;
      if (child.userData.walkable && child instanceof THREE.Mesh) this.walkables.push(child);
      let collisionOwner: THREE.Object3D | null = child;
      let collisionEnabled = true;
      while (collisionOwner && collisionOwner !== this.navigationRoot) {
        if (collisionOwner.userData.collisionEnabled === false) {
          collisionEnabled = false;
          break;
        }
        collisionOwner = collisionOwner.parent;
      }
      const authoredBarrierSegments = child.userData.navBarrierSegments as Array<{
        start: [number, number, number];
        end: [number, number, number];
        radius: number;
      }> | undefined;
      if (collisionEnabled && authoredBarrierSegments?.length) {
        const parentMatrix = child.parent?.matrixWorld ?? new THREE.Matrix4();
        const worldScale = child.parent?.getWorldScale(new THREE.Vector3()) ?? new THREE.Vector3(1, 1, 1);
        const radiusScale = Math.max(Math.abs(worldScale.x), Math.abs(worldScale.z));
        authoredBarrierSegments.forEach((segment) => {
          const start = new THREE.Vector3().fromArray(segment.start).applyMatrix4(parentMatrix);
          const end = new THREE.Vector3().fromArray(segment.end).applyMatrix4(parentMatrix);
          const radius = segment.radius * radiusScale;
          this.barrierSegments.push({
            start,
            end,
            radius,
            minY: Math.min(start.y, end.y) - radius,
            maxY: Math.max(start.y, end.y) + radius,
          });
        });
      }
      if (collisionEnabled && child.userData.navObstacle && child instanceof THREE.Mesh) {
        const bounds = new THREE.Box3().setFromObject(child, true);
        if (!bounds.isEmpty()) this.obstacleBounds.push(bounds);
      }
    });
  }

  update(delta: number) {
    if (!this.active) return;
    const keyX = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
    const keyZ = Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
    const inputX = THREE.MathUtils.clamp(keyX + this.externalIntent.x, -1, 1);
    const inputZ = THREE.MathUtils.clamp(keyZ + this.externalIntent.z, -1, 1);

    if (this.isSitting && (Math.abs(inputX) > 0.01 || Math.abs(inputZ) > 0.01)) {
      this.isSitting = false;
    }

    if (this.isSitting) {
      this.currentSpeed = 0;
      this.camera.position.copy(this.seatTarget);
    } else {
      const sprinting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.externalIntent.sprint;
      const speed = this.turboEnabled ? WALK_TURBO_SPEED : sprinting ? WALK_FAST_SPEED : WALK_SPEED;
      this.currentSpeed = Math.hypot(inputX, inputZ) > 0 ? speed : 0;

      if (this.currentSpeed > 0) {
        this.camera.getWorldDirection(this.direction);
        this.direction.y = 0;
        if (this.direction.lengthSq() < 0.0001) this.direction.set(0, 0, -1);
        this.direction.normalize();
        this.right.crossVectors(this.direction, this.camera.up).normalize();
        this.move.copy(this.direction).multiplyScalar(inputZ).addScaledVector(this.right, inputX);
        if (this.move.lengthSq() > 1) this.move.normalize();
        this.move.multiplyScalar(speed * delta);
        this.tryAxisMove(this.move.x, 0);
        this.tryAxisMove(0, this.move.z);
      }
    }

    const sampledGround = this.sampleGround(this.camera.position.x, this.camera.position.z, { trackSurface: true });
    const targetY = (sampledGround !== null ? sampledGround : (this.groundY !== null ? this.groundY : 0)) + WALK_EYE_HEIGHT;
    
    if (this.isJumping) {
      this.velocityY -= WALK_GRAVITY * delta;
      this.camera.position.y += this.velocityY * delta;
      this.jumpPeakHeight = Math.max(this.jumpPeakHeight, this.camera.position.y - this.jumpStartY);
      
      if (this.camera.position.y <= targetY) {
        this.camera.position.y = targetY;
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpHeld = false;
        this.grounded = sampledGround !== null;
        if (sampledGround !== null) this.groundY = sampledGround;
      } else {
        this.grounded = false;
      }
    } else {
      if (sampledGround !== null) {
        this.groundY = sampledGround;
        this.grounded = true;
        this.camera.position.y = THREE.MathUtils.damp(
          this.camera.position.y,
          targetY,
          18,
          delta,
        );
      } else {
        this.grounded = false;
      }
    }
  }

  setRoomContext(roomId: string | null) {
    this.roomId = roomId?.trim() || 'outside';
  }

  getSnapshot(): WalkSnapshot {
    this.camera.getWorldDirection(this.direction);
    const position = this.camera.position.toArray() as [number, number, number];
    return {
      active: this.active,
      pointerLocked: this.pointerControls.isLocked,
      lookMode: this.pointerControls.isLocked ? 'pointer-lock' : this.dragLookActive ? 'drag' : 'idle',
      grounded: this.grounded,
      positionWorld: position.map((value) => Number(value.toFixed(3))) as [number, number, number],
      positionMetres: position.map((value) => Number(worldUnitsToMetres(value).toFixed(1))) as [number, number, number],
      groundY: this.groundY === null ? null : Number(this.groundY.toFixed(3)),
      surfaceKind: this.surfaceKind,
      roomId: this.roomId,
      speedMetresPerSecond: Number(worldUnitsToMetres(this.currentSpeed).toFixed(1)),
      turboEnabled: this.turboEnabled,
      jumpState: !this.isJumping ? 'grounded' : this.velocityY > 0 ? 'rising' : 'falling',
      jumpHeld: this.jumpHeld,
      jumpHeightMetres: Number(worldUnitsToMetres(this.jumpPeakHeight).toFixed(2)),
      jumpHeightRangeMetres: [WALK_JUMP_TAP_HEIGHT_METRES, WALK_JUMP_HOLD_HEIGHT_METRES],
      movementKeys: Array.from(this.keys).sort(),
      direction: this.direction.toArray().map((value) => Number(value.toFixed(3))) as [number, number, number],
    };
  }

  dispose() {
    this.exit();
    this.pointerControls.dispose();
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointerleave', this.onPointerLeave);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.clearInput);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    document.removeEventListener('pointerlockerror', this.onPointerLockError, { capture: true });
  }

  private sampleGround(
    x: number,
    z: number,
    options: { spawnSearch?: boolean; trackSurface?: boolean } = {},
  ) {
    const feetY = this.camera.position.y - WALK_EYE_HEIGHT;
    const originY = options.spawnSearch || this.groundY === null
      ? 40
      : Math.max(feetY, this.groundY) + WALK_STEP_HEIGHT + 0.012;
    this.rayOrigin.set(x, originY, z);
    this.raycaster.set(this.rayOrigin, this.down);
    this.raycaster.near = 0;
    this.raycaster.far = 80;
    const intersections = this.raycaster.intersectObjects(this.walkables, false);
    const hit = intersections[0];
    if (!hit) return null;
    if (options.trackSurface) {
      this.surfaceKind = 'stone';
      this.roomId = 'outside';
      let cursor: THREE.Object3D | null = hit.object;
      while (cursor) {
        const kind = cursor.userData.surfaceKind;
        if (typeof kind === 'string' && kind.length) {
          this.surfaceKind = kind;
        }
        const roomId = cursor.userData.libraryRoom;
        if (typeof roomId === 'string' && roomId.length) this.roomId = roomId;
        cursor = cursor.parent;
      }
    }
    return hit.point.y;
  }

  private isSpawnClear(x: number, z: number, ground: number) {
    const bodyBottom = ground + 0.015;
    const bodyTop = ground + WALK_EYE_HEIGHT;
    const insideAccess = this.accessBounds.some(
      (bounds) =>
        x >= bounds.min.x + WALK_RADIUS &&
        x <= bounds.max.x - WALK_RADIUS &&
        z >= bounds.min.z + WALK_RADIUS &&
        z <= bounds.max.z - WALK_RADIUS &&
        bodyTop >= bounds.min.y &&
        bodyBottom <= bounds.max.y,
    );
    const hitsObstacle = this.obstacleBounds.some(
      (bounds) =>
        !insideAccess &&
        x >= bounds.min.x - WALK_RADIUS &&
        x <= bounds.max.x + WALK_RADIUS &&
        z >= bounds.min.z - WALK_RADIUS &&
        z <= bounds.max.z + WALK_RADIUS &&
        bodyTop >= bounds.min.y &&
        bodyBottom <= bounds.max.y,
    );
    return !hitsObstacle && !this.collidesWithBarrier(x, z, bodyBottom, bodyTop);
  }

  private collidesWithBarrier(x: number, z: number, bodyBottom: number, bodyTop: number) {
    return this.findBarrierCollision(x, z, bodyBottom, bodyTop) !== null;
  }

  private findBarrierCollision(x: number, z: number, bodyBottom: number, bodyTop: number) {
    return this.barrierSegments.find((barrier) => {
      if (bodyTop < barrier.minY || bodyBottom > barrier.maxY) return false;
      const abX = barrier.end.x - barrier.start.x;
      const abZ = barrier.end.z - barrier.start.z;
      const lengthSquared = abX * abX + abZ * abZ;
      const along = lengthSquared > 0
        ? THREE.MathUtils.clamp(
          ((x - barrier.start.x) * abX + (z - barrier.start.z) * abZ) / lengthSquared,
          0,
          1,
        )
        : 0;
      const closestX = barrier.start.x + abX * along;
      const closestZ = barrier.start.z + abZ * along;
      const dx = x - closestX;
      const dz = z - closestZ;
      const clearance = WALK_RADIUS + barrier.radius;
      return dx * dx + dz * dz <= clearance * clearance;
    }) ?? null;
  }

  private canTraverseGroundRise(nextGround: number) {
    if (this.groundY === null || nextGround - this.groundY <= WALK_STEP_HEIGHT) return true;
    if (!this.isJumping) return false;
    const airborneFeetY = this.camera.position.y - WALK_EYE_HEIGHT;
    return airborneFeetY + 0.002 >= nextGround;
  }

  private getMovementBodyRange(nextGround: number) {
    if (this.isJumping) {
      const airborneFeetY = this.camera.position.y - WALK_EYE_HEIGHT;
      return { bodyBottom: airborneFeetY + 0.015, bodyTop: this.camera.position.y };
    }
    return { bodyBottom: nextGround + 0.015, bodyTop: nextGround + WALK_EYE_HEIGHT };
  }

  private tryAxisMove(dx: number, dz: number) {
    if (!dx && !dz) return;
    this.candidate.copy(this.camera.position);
    this.candidate.x += dx;
    this.candidate.z += dz;
    const nextGround = this.sampleGround(this.candidate.x, this.candidate.z);
    if (nextGround === null) return;
    if (!this.canTraverseGroundRise(nextGround)) return;
    const { bodyBottom, bodyTop } = this.getMovementBodyRange(nextGround);
    const insideAccess = this.accessBounds.some(
      (bounds) =>
        this.candidate.x >= bounds.min.x + WALK_RADIUS &&
        this.candidate.x <= bounds.max.x - WALK_RADIUS &&
        this.candidate.z >= bounds.min.z + WALK_RADIUS &&
        this.candidate.z <= bounds.max.z - WALK_RADIUS &&
        bodyTop >= bounds.min.y &&
        bodyBottom <= bounds.max.y,
    );
    const collides = this.obstacleBounds.some(
      (bounds) =>
        !insideAccess &&
        this.candidate.x >= bounds.min.x - WALK_RADIUS &&
        this.candidate.x <= bounds.max.x + WALK_RADIUS &&
        this.candidate.z >= bounds.min.z - WALK_RADIUS &&
        this.candidate.z <= bounds.max.z + WALK_RADIUS &&
        bodyTop >= bounds.min.y &&
        bodyBottom <= bounds.max.y,
    );
    if (collides) return;
    const barrier = this.findBarrierCollision(this.candidate.x, this.candidate.z, bodyBottom, bodyTop);
    if (barrier) {
      this.tryBarrierSlide(dx, dz, barrier);
      return;
    }
    this.camera.position.x = this.candidate.x;
    this.camera.position.z = this.candidate.z;
    this.groundY = nextGround;
  }

  private tryBarrierSlide(dx: number, dz: number, barrier: NavigationBarrierSegment) {
    const tangentX = barrier.end.x - barrier.start.x;
    const tangentZ = barrier.end.z - barrier.start.z;
    const tangentLength = Math.hypot(tangentX, tangentZ);
    if (tangentLength < 0.000001) return;
    const normalizedX = tangentX / tangentLength;
    const normalizedZ = tangentZ / tangentLength;
    const projectedDistance = dx * normalizedX + dz * normalizedZ;
    if (Math.abs(projectedDistance) < 0.000001) return;

    this.candidate.copy(this.camera.position);
    this.candidate.x += normalizedX * projectedDistance;
    this.candidate.z += normalizedZ * projectedDistance;
    let nextGround = this.sampleGround(this.candidate.x, this.candidate.z);
    if (nextGround === null) return;
    if (!this.canTraverseGroundRise(nextGround)) return;
    let { bodyBottom, bodyTop } = this.getMovementBodyRange(nextGround);

    const touchingBarrier = this.findBarrierCollision(this.candidate.x, this.candidate.z, bodyBottom, bodyTop);
    if (touchingBarrier) {
      const abX = touchingBarrier.end.x - touchingBarrier.start.x;
      const abZ = touchingBarrier.end.z - touchingBarrier.start.z;
      const lengthSquared = abX * abX + abZ * abZ;
      const along = lengthSquared > 0
        ? THREE.MathUtils.clamp(
          ((this.candidate.x - touchingBarrier.start.x) * abX
            + (this.candidate.z - touchingBarrier.start.z) * abZ) / lengthSquared,
          0,
          1,
        )
        : 0;
      const closestX = touchingBarrier.start.x + abX * along;
      const closestZ = touchingBarrier.start.z + abZ * along;
      let normalX = this.candidate.x - closestX;
      let normalZ = this.candidate.z - closestZ;
      const distance = Math.hypot(normalX, normalZ);
      if (distance < 0.000001) {
        normalX = -normalizedZ;
        normalZ = normalizedX;
      } else {
        normalX /= distance;
        normalZ /= distance;
      }
      const clearance = WALK_RADIUS + touchingBarrier.radius + 0.0001;
      const correction = Math.max(0, clearance - distance);
      this.candidate.x += normalX * correction;
      this.candidate.z += normalZ * correction;
      nextGround = this.sampleGround(this.candidate.x, this.candidate.z);
      if (nextGround === null) return;
      if (!this.canTraverseGroundRise(nextGround)) return;
      ({ bodyBottom, bodyTop } = this.getMovementBodyRange(nextGround));
    }

    const insideAccess = this.accessBounds.some(
      (bounds) =>
        this.candidate.x >= bounds.min.x + WALK_RADIUS
        && this.candidate.x <= bounds.max.x - WALK_RADIUS
        && this.candidate.z >= bounds.min.z + WALK_RADIUS
        && this.candidate.z <= bounds.max.z - WALK_RADIUS
        && bodyTop >= bounds.min.y
        && bodyBottom <= bounds.max.y,
    );
    const hitsObstacle = this.obstacleBounds.some(
      (bounds) =>
        !insideAccess
        && this.candidate.x >= bounds.min.x - WALK_RADIUS
        && this.candidate.x <= bounds.max.x + WALK_RADIUS
        && this.candidate.z >= bounds.min.z - WALK_RADIUS
        && this.candidate.z <= bounds.max.z + WALK_RADIUS
        && bodyTop >= bounds.min.y
        && bodyBottom <= bounds.max.y,
    );
    if (hitsObstacle || this.collidesWithBarrier(this.candidate.x, this.candidate.z, bodyBottom, bodyTop)) return;
    this.camera.position.x = this.candidate.x;
    this.camera.position.z = this.candidate.z;
    this.groundY = nextGround;
  }

  private enableDragLook() {
    if (!this.active || this.pointerControls.isLocked) return;
    this.dragLookActive = true;
    this.lastPointer = null;
    this.onLockChange?.(false, true);
  }

  private onPointerDown = (event: PointerEvent) => {
    if (!this.active || event.button !== 0 || this.pointerControls.isLocked) return;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.requestPointerLock();
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.active || !this.dragLookActive || this.pointerControls.isLocked) return;
    if (!this.lastPointer) {
      this.lastPointer = { x: event.clientX, y: event.clientY };
      return;
    }
    const deltaX = event.clientX - this.lastPointer.x;
    const deltaY = event.clientY - this.lastPointer.y;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    if (!deltaX && !deltaY) return;
    this.lookEuler.setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.lookEuler.y -= deltaX * 0.002;
    this.lookEuler.x = THREE.MathUtils.clamp(this.lookEuler.x - deltaY * 0.002, -1.42, 1.42);
    this.camera.quaternion.setFromEuler(this.lookEuler);
  };

  private onPointerLeave = () => {
    this.lastPointer = null;
  };

  private onPointerLockError = (event: Event) => {
    event.stopImmediatePropagation();
    this.enableDragLook();
  };

  private triggerJump() {
    if (!this.active || this.isSitting) return;
    if (this.grounded && !this.isJumping) {
      this.velocityY = WALK_JUMP_SPEED;
      this.isJumping = true;
      this.jumpStartY = this.camera.position.y;
      this.jumpPeakHeight = 0;
    }
  }

  private releaseJump() {
    this.jumpHeld = false;
    if (this.isJumping && this.velocityY > WALK_JUMP_TAP_SPEED) {
      this.velocityY = WALK_JUMP_TAP_SPEED;
    }
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (!this.active) return;
    const target = event.target as HTMLElement | null;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    const movementCodes = new Set([
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ShiftLeft',
      'ShiftRight',
      'Space',
      'KeyT',
    ]);
    if (movementCodes.has(event.code)) {
      event.preventDefault();
      this.keys.add(event.code);
    }
    if (event.code === 'Space' && !event.repeat) {
      this.jumpHeld = true;
      this.triggerJump();
    }
    if (event.code === 'KeyT' && !event.repeat) this.toggleTurbo();
    if (event.code === 'KeyE' && !event.repeat) this.onInteract?.();
  };

  private onKeyUp = (event: KeyboardEvent) => {
    if (!this.active) return;
    this.keys.delete(event.code);
    if (event.code === 'Space') this.releaseJump();
  };

  private clearInput = () => {
    this.keys.clear();
    this.releaseJump();
  };

  private onVisibilityChange = () => {
    if (document.hidden) this.clearInput();
  };
}
