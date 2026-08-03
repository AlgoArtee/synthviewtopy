import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import {
  DISTRICT_ROAD_RADII,
  ISLAND_SURFACE_Y,
  WALK_EYE_HEIGHT,
  WALK_GRAVITY,
  WALK_JUMP_HOLD_HEIGHT_METRES,
  WALK_JUMP_SPEED,
  WALK_JUMP_TAP_HEIGHT_METRES,
  WALK_JUMP_TAP_SPEED,
  WALK_RADIUS,
  WALK_SPEED,
  WALK_STEP_HEIGHT,
  WALK_TURBO_SPEED,
  metresToWorldUnits,
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
  speedKilometresPerHour: number;
  configuredWalkSpeedKilometresPerHour: number;
  turboEnabled: boolean;
  jumpState: 'grounded' | 'rising' | 'falling';
  jumpHeld: boolean;
  jumpHeightMetres: number;
  jumpHeightRangeMetres: [number, number];
  movementKeys: string[];
  direction: [number, number, number];
  safetyRecoveries: number;
  collisionSpatialIndex: WalkCollisionSpatialIndexSnapshot;
}

export interface WalkCollisionSpatialIndexSnapshot {
  cellSizeWorld: number;
  cellSizeMetres: number;
  occupiedCellCount: number;
  residentCellCount: number;
  residentCandidates: WalkNavigationSpatialCounts;
  totalCandidates: WalkNavigationSpatialCounts;
}

export interface WalkNavigationSpatialCounts {
  walkables: number;
  obstacles: number;
  accessBounds: number;
  underwalkAccessVolumes: number;
  underwalkSurfaces: number;
  barriers: number;
}

interface WalkControllerOptions {
  camera: THREE.PerspectiveCamera;
  element: HTMLElement;
  navigationRoot: THREE.Object3D;
  navigationAuthorityRoots?: () => readonly THREE.Object3D[];
  onLockChange?: (locked: boolean, dragLookActive?: boolean) => void;
  onTurboChange?: (enabled: boolean) => void;
  onInteract?: () => void;
}

function isActuallyVisible(object: THREE.Object3D) {
  let cursor: THREE.Object3D | null = object;
  let sourceObject = true;
  while (cursor) {
    // GPU-batched visual sources stay hidden to avoid double rendering, but
    // their exact authored meshes remain the WALK collision authority.
    if (!cursor.visible && !(sourceObject && cursor.userData.gpuBatchSource === true)) return false;
    sourceObject = false;
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

interface UnderwalkSurface {
  object: THREE.Mesh;
  bounds: THREE.Box3;
}

interface NavigationAccessVolume {
  object: THREE.Mesh;
  localBounds: THREE.Box3;
  allowUnderwalk: boolean;
}

interface NavigationObstacle {
  object: THREE.Mesh;
  localBounds: THREE.Box3;
  inverseWorldMatrix: THREE.Matrix4;
  worldScale: THREE.Vector3;
  circularFootprint: boolean;
  roundedFootprintRadius: number;
}

type NavigationSpatialCandidateKind =
  | 'walkables'
  | 'obstacles'
  | 'accessBounds'
  | 'underwalkAccessVolumes'
  | 'underwalkSurfaces'
  | 'barriers';
type NavigationSpatialCell = Partial<Record<NavigationSpatialCandidateKind, number[]>>;
type NavigationSpatialBuckets = Record<NavigationSpatialCandidateKind, number[]>;
type NavigationSpatialCounts = WalkNavigationSpatialCounts;

const createNavigationSpatialBuckets = (): NavigationSpatialBuckets => ({
  walkables: [],
  obstacles: [],
  accessBounds: [],
  underwalkAccessVolumes: [],
  underwalkSurfaces: [],
  barriers: [],
});

const createNavigationSpatialCounts = (): NavigationSpatialCounts => ({
  walkables: 0,
  obstacles: 0,
  accessBounds: 0,
  underwalkAccessVolumes: 0,
  underwalkSurfaces: 0,
  barriers: 0,
});

const MAX_GROUNDED_DROP = WALK_STEP_HEIGHT + 0.006;
const NAVIGATION_LAYER_EPSILON = 0.003;
const NAVIGATION_SPATIAL_CELL_SIZE_METRES = 80;
const NAVIGATION_SPATIAL_CELL_SIZE = metresToWorldUnits(NAVIGATION_SPATIAL_CELL_SIZE_METRES);
const NAVIGATION_SPATIAL_MAX_CELLS_PER_CANDIDATE = 512;

export class WalkController {
  readonly pointerControls: PointerLockControls;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly element: HTMLElement;
  private readonly navigationRoot: THREE.Object3D;
  private readonly navigationAuthorityRoots?: () => readonly THREE.Object3D[];
  private readonly onLockChange?: (locked: boolean, dragLookActive?: boolean) => void;
  private readonly onTurboChange?: (enabled: boolean) => void;
  private readonly onInteract?: () => void;
  private readonly raycaster = new THREE.Raycaster();
  private readonly walkables: THREE.Object3D[] = [];
  private readonly underwalkSurfaces: UnderwalkSurface[] = [];
  private readonly obstacleBounds: THREE.Box3[] = [];
  // `obstacleBounds` remains the cheap broad phase (and is intentionally kept
  // for legacy diagnostics). The aligned entry below is the narrow phase that
  // prevents a rotated mesh's world AABB corners from becoming invisible WALK
  // blockers on district roads.
  private readonly navigationObstacles: Array<NavigationObstacle | null> = [];
  private readonly accessBounds: THREE.Box3[] = [];
  private readonly underwalkAccessVolumes: NavigationAccessVolume[] = [];
  private readonly barrierSegments: NavigationBarrierSegment[] = [];
  // Cells store indices into the arrays above; those arrays remain the exact
  // authored authority and retain their existing browser-test accessibility.
  private readonly navigationSpatialCells = new Map<string, NavigationSpatialCell>();
  private readonly globalSpatialCandidates = createNavigationSpatialBuckets();
  private readonly spatialQueryScratch = createNavigationSpatialBuckets();
  private readonly spatialQuerySeen: Record<NavigationSpatialCandidateKind, Set<number>> = {
    walkables: new Set(),
    obstacles: new Set(),
    accessBounds: new Set(),
    underwalkAccessVolumes: new Set(),
    underwalkSurfaces: new Set(),
    barriers: new Set(),
  };
  private readonly indexedSpatialCounts = createNavigationSpatialCounts();
  private readonly residentSpatialCandidates = createNavigationSpatialCounts();
  private readonly walkableQueryObjects: THREE.Object3D[] = [];
  private residentSpatialCellCount = 0;
  private readonly keys = new Set<string>();
  private readonly direction = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly move = new THREE.Vector3();
  private readonly candidate = new THREE.Vector3();
  private readonly rayOrigin = new THREE.Vector3();
  private readonly down = new THREE.Vector3(0, -1, 0);
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly lookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly lastSafePosition = new THREE.Vector3();
  private readonly accessLocalBottom = new THREE.Vector3();
  private readonly accessLocalTop = new THREE.Vector3();
  private readonly accessWorldScale = new THREE.Vector3();
  private readonly obstacleLocalBottom = new THREE.Vector3();
  private readonly obstacleLocalTop = new THREE.Vector3();
  private externalIntent = { x: 0, z: 0, sprint: false };
  private active = false;
  private grounded = false;
  private groundY: number | null = null;
  private surfaceKind = 'stone';
  private roomId = 'outside';
  private currentSpeed = 0;
  private walkSpeed = WALK_SPEED;
  private turboEnabled = false;
  private dragLookActive = false;
  private lastPointer: { x: number; y: number } | null = null;
  private velocityY = 0;
  private isJumping = false;
  private jumpHeld = false;
  private jumpStartY = 0;
  private jumpPeakHeight = 0;
  private lastSafeGroundY: number | null = null;
  private safetyRecoveries = 0;
  public isSitting = false;
  public seatTarget = new THREE.Vector3();

  constructor(options: WalkControllerOptions) {
    this.camera = options.camera;
    this.element = options.element;
    this.navigationRoot = options.navigationRoot;
    this.navigationAuthorityRoots = options.navigationAuthorityRoots;
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
      // Last-resort exterior recovery stays terrain-derived as well. This
      // anchor is intentionally separate from the caller's preferred base so
      // a temporarily hidden or obstructed route cannot strand WALK.
      pt = this.findNearestWalkable(0, DISTRICT_ROAD_RADII[0]);
    }
    if (!pt) {
      // Navigation should always provide a visible surface. If scene loading
      // is interrupted, use the canonical island ground datum—not the former
      // hard-coded eye-height value—so the camera can never start underground.
      pt = { x: 0, y: ISLAND_SURFACE_Y, z: DISTRICT_ROAD_RADII[0] };
    }

    this.groundY = pt.y;
    this.sampleGround(pt.x, pt.z, { spawnSearch: true, trackSurface: true });
    this.grounded = true;
    this.velocityY = 0;
    this.isJumping = false;
    this.jumpHeld = false;
    this.jumpPeakHeight = 0;
    this.camera.position.set(pt.x, this.groundY + WALK_EYE_HEIGHT, pt.z);
    this.rememberSafePosition();

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
    this.lastSafeGroundY = null;
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

  setWalkSpeedKilometresPerHour(kilometresPerHour: number) {
    const safeKilometresPerHour = THREE.MathUtils.clamp(
      Number.isFinite(kilometresPerHour) ? kilometresPerHour : 6.5,
      0.5,
      120,
    );
    this.walkSpeed = metresToWorldUnits(safeKilometresPerHour / 3.6);
    return this.getWalkSpeedKilometresPerHour();
  }

  getWalkSpeedKilometresPerHour() {
    return Number((worldUnitsToMetres(this.walkSpeed) * 3.6).toFixed(1));
  }

  private spatialCellCoordinate(value: number) {
    return Math.floor(value / NAVIGATION_SPATIAL_CELL_SIZE);
  }

  private spatialCellKey(cellX: number, cellZ: number) {
    return `${cellX},${cellZ}`;
  }

  private addSpatialBounds(
    kind: NavigationSpatialCandidateKind,
    index: number,
    bounds: THREE.Box3,
    padding = 0,
  ) {
    const minimumX = bounds.min.x - padding;
    const maximumX = bounds.max.x + padding;
    const minimumZ = bounds.min.z - padding;
    const maximumZ = bounds.max.z + padding;
    if (
      bounds.isEmpty()
      || !Number.isFinite(minimumX)
      || !Number.isFinite(maximumX)
      || !Number.isFinite(minimumZ)
      || !Number.isFinite(maximumZ)
    ) {
      this.globalSpatialCandidates[kind].push(index);
      return;
    }
    const minimumCellX = this.spatialCellCoordinate(minimumX);
    const maximumCellX = this.spatialCellCoordinate(maximumX);
    const minimumCellZ = this.spatialCellCoordinate(minimumZ);
    const maximumCellZ = this.spatialCellCoordinate(maximumZ);
    const coveredCellCount = (maximumCellX - minimumCellX + 1)
      * (maximumCellZ - minimumCellZ + 1);
    // Island terrain and complete ring-road meshes cover most of the map.
    // Keeping these few broad surfaces in a global bucket avoids creating
    // tens of thousands of mostly empty cell records while every local
    // collider and walkable still benefits from the 80-metre hash.
    if (coveredCellCount > NAVIGATION_SPATIAL_MAX_CELLS_PER_CANDIDATE) {
      this.globalSpatialCandidates[kind].push(index);
      return;
    }
    for (let cellX = minimumCellX; cellX <= maximumCellX; cellX += 1) {
      for (let cellZ = minimumCellZ; cellZ <= maximumCellZ; cellZ += 1) {
        const key = this.spatialCellKey(cellX, cellZ);
        let cell = this.navigationSpatialCells.get(key);
        if (!cell) {
          cell = {};
          this.navigationSpatialCells.set(key, cell);
        }
        const bucket = cell[kind] ?? [];
        bucket.push(index);
        cell[kind] = bucket;
      }
    }
  }

  private currentNavigationSpatialCounts(): NavigationSpatialCounts {
    return {
      walkables: this.walkables.length,
      obstacles: this.obstacleBounds.length,
      accessBounds: this.accessBounds.length,
      underwalkAccessVolumes: this.underwalkAccessVolumes.length,
      underwalkSurfaces: this.underwalkSurfaces.length,
      barriers: this.barrierSegments.length,
    };
  }

  private rebuildNavigationSpatialIndex() {
    this.navigationSpatialCells.clear();
    (Object.keys(this.globalSpatialCandidates) as NavigationSpatialCandidateKind[])
      .forEach((kind) => {
        this.globalSpatialCandidates[kind].length = 0;
        this.spatialQueryScratch[kind].length = 0;
        this.spatialQuerySeen[kind].clear();
        this.residentSpatialCandidates[kind] = 0;
      });
    this.residentSpatialCellCount = 0;

    this.walkables.forEach((walkable, index) => {
      const bounds = new THREE.Box3().setFromObject(walkable, true);
      this.addSpatialBounds('walkables', index, bounds);
    });
    this.obstacleBounds.forEach((bounds, index) => {
      this.addSpatialBounds('obstacles', index, bounds, WALK_RADIUS);
    });
    this.accessBounds.forEach((bounds, index) => {
      this.addSpatialBounds('accessBounds', index, bounds);
    });
    this.underwalkAccessVolumes.forEach((volume, index) => {
      const bounds = new THREE.Box3().setFromObject(volume.object, true);
      this.addSpatialBounds('underwalkAccessVolumes', index, bounds);
    });
    this.underwalkSurfaces.forEach((surface, index) => {
      this.addSpatialBounds('underwalkSurfaces', index, surface.bounds, WALK_RADIUS);
    });
    this.barrierSegments.forEach((barrier, index) => {
      const padding = barrier.radius + WALK_RADIUS;
      const bounds = new THREE.Box3(
        new THREE.Vector3(
          Math.min(barrier.start.x, barrier.end.x) - padding,
          barrier.minY,
          Math.min(barrier.start.z, barrier.end.z) - padding,
        ),
        new THREE.Vector3(
          Math.max(barrier.start.x, barrier.end.x) + padding,
          barrier.maxY,
          Math.max(barrier.start.z, barrier.end.z) + padding,
        ),
      );
      this.addSpatialBounds('barriers', index, bounds);
    });

    Object.assign(this.indexedSpatialCounts, this.currentNavigationSpatialCounts());
  }

  private ensureNavigationSpatialIndexCurrent() {
    // Keep the hot movement path allocation-free while still detecting the
    // direct array push/pop operations used by public browser regressions.
    const changed = this.walkables.length !== this.indexedSpatialCounts.walkables
      || this.obstacleBounds.length !== this.indexedSpatialCounts.obstacles
      || this.accessBounds.length !== this.indexedSpatialCounts.accessBounds
      || this.underwalkAccessVolumes.length !== this.indexedSpatialCounts.underwalkAccessVolumes
      || this.underwalkSurfaces.length !== this.indexedSpatialCounts.underwalkSurfaces
      || this.barrierSegments.length !== this.indexedSpatialCounts.barriers;
    if (changed) this.rebuildNavigationSpatialIndex();
  }

  private queryNavigationSpatialIndices(
    kind: NavigationSpatialCandidateKind,
    x: number,
    z: number,
    padding = 0,
  ) {
    this.ensureNavigationSpatialIndexCurrent();
    const result = this.spatialQueryScratch[kind];
    const seen = this.spatialQuerySeen[kind];
    result.length = 0;
    seen.clear();
    let residentCellCount = 0;
    const minimumCellX = this.spatialCellCoordinate(x - padding);
    const maximumCellX = this.spatialCellCoordinate(x + padding);
    const minimumCellZ = this.spatialCellCoordinate(z - padding);
    const maximumCellZ = this.spatialCellCoordinate(z + padding);
    for (let cellX = minimumCellX; cellX <= maximumCellX; cellX += 1) {
      for (let cellZ = minimumCellZ; cellZ <= maximumCellZ; cellZ += 1) {
        const cell = this.navigationSpatialCells.get(this.spatialCellKey(cellX, cellZ));
        if (!cell) continue;
        residentCellCount += 1;
        cell[kind]?.forEach((index) => {
          if (seen.has(index)) return;
          seen.add(index);
          result.push(index);
        });
      }
    }
    this.globalSpatialCandidates[kind].forEach((index) => {
      if (seen.has(index)) return;
      seen.add(index);
      result.push(index);
    });
    // Preserve the former global-array ordering for overlapping surfaces and
    // for the barrier selected as the movement-slide authority.
    result.sort((left, right) => left - right);
    this.residentSpatialCellCount = residentCellCount;
    this.residentSpatialCandidates[kind] = result.length;
    return result;
  }

  getNavigationSpatialIndexSnapshot(): WalkCollisionSpatialIndexSnapshot {
    this.ensureNavigationSpatialIndexCurrent();
    return {
      cellSizeWorld: NAVIGATION_SPATIAL_CELL_SIZE,
      cellSizeMetres: NAVIGATION_SPATIAL_CELL_SIZE_METRES,
      occupiedCellCount: this.navigationSpatialCells.size,
      residentCellCount: this.residentSpatialCellCount,
      residentCandidates: { ...this.residentSpatialCandidates },
      totalCandidates: this.currentNavigationSpatialCounts(),
    };
  }

  refreshNavigation() {
    this.walkables.length = 0;
    this.underwalkSurfaces.length = 0;
    this.obstacleBounds.length = 0;
    this.navigationObstacles.length = 0;
    this.accessBounds.length = 0;
    this.underwalkAccessVolumes.length = 0;
    this.barrierSegments.length = 0;
    this.navigationRoot.updateMatrixWorld(true);
    const inspectNavigationObject = (child: THREE.Object3D) => {
      if (child.userData.navAccess && child instanceof THREE.Mesh) {
        const bounds = new THREE.Box3().setFromObject(child, true);
        if (!bounds.isEmpty()) this.accessBounds.push(bounds);
        if (child.userData.allowUnderwalk === true) {
          child.geometry.computeBoundingBox();
          const localBounds = child.geometry.boundingBox?.clone();
          if (localBounds && !localBounds.isEmpty()) {
            this.underwalkAccessVolumes.push({
              object: child,
              localBounds,
              allowUnderwalk: true,
            });
          }
        }
      }
      if (!isActuallyVisible(child)) return;
      if (child.userData.walkable && child instanceof THREE.Mesh) {
        this.walkables.push(child);
        if (child.userData.preventUnderwalk === true) {
          const bounds = new THREE.Box3().setFromObject(child, true);
          if (!bounds.isEmpty()) this.underwalkSurfaces.push({ object: child, bounds });
        }
      }
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
        if (!bounds.isEmpty()) {
          this.obstacleBounds.push(bounds);
          // Instanced meshes need per-instance transforms and retain the broad
          // phase until an authored instance collider is supplied. Ordinary
          // district meshes use their own local footprint, including their
          // actual rotation, instead of the oversized world-aligned bounds.
          if (child instanceof THREE.InstancedMesh) {
            this.navigationObstacles.push(null);
          } else {
            child.geometry.computeBoundingBox();
            const localBounds = child.geometry.boundingBox?.clone();
            if (!localBounds || localBounds.isEmpty()) {
              this.navigationObstacles.push(null);
            } else {
              const localUp = new THREE.Vector3().setFromMatrixColumn(child.matrixWorld, 1).normalize();
              const upright = Math.abs(localUp.y) > 0.98;
              const circularFootprint = upright && [
                'CylinderGeometry',
                'ConeGeometry',
                'SphereGeometry',
                'IcosahedronGeometry',
                'OctahedronGeometry',
                'DodecahedronGeometry',
              ].includes(child.geometry.type);
              const geometryParameters = (child.geometry as THREE.BufferGeometry & {
                parameters?: { radius?: number };
              }).parameters;
              const roundedFootprintRadius = upright && child.geometry.type === 'RoundedBoxGeometry'
                ? Math.max(0, Number(geometryParameters?.radius) || 0)
                : 0;
              this.navigationObstacles.push({
                object: child,
                localBounds,
                inverseWorldMatrix: child.matrixWorld.clone().invert(),
                worldScale: child.getWorldScale(new THREE.Vector3()),
                circularFootprint,
                roundedFootprintRadius,
              });
            }
          }
        }
      }
    };
    this.navigationRoot.traverse(inspectNavigationObject);
    this.navigationAuthorityRoots?.().forEach((root) => root.traverse(inspectNavigationObject));
    this.rebuildNavigationSpatialIndex();
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
      // The WALK speed field is authoritative for ordinary movement. Keeping
      // it independent of keyboard modifiers makes an entered km/h value
      // predictable and suitable for accessibility or scale checks.
      const speed = this.turboEnabled ? WALK_TURBO_SPEED : this.walkSpeed;
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
    if (!this.isJumping) {
      const fellThroughLayer = sampledGround === null
        || (
          this.groundY !== null
          && sampledGround < this.groundY - MAX_GROUNDED_DROP
        );
      const recoveryGround = sampledGround ?? this.groundY;
      const insideRaisedSurface = recoveryGround !== null && this.findUnderwalkSurface(
        this.camera.position.x,
        this.camera.position.z,
        recoveryGround,
        recoveryGround + 0.015,
        recoveryGround + WALK_EYE_HEIGHT,
      ) !== null;
      if (fellThroughLayer || insideRaisedSurface) {
        this.restoreLastSafePosition();
        return;
      }
    }
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

    if (!this.isJumping && this.grounded && this.groundY !== null) {
      const insideRaisedSurface = this.findUnderwalkSurface(
        this.camera.position.x,
        this.camera.position.z,
        this.groundY,
        this.groundY + 0.015,
        this.groundY + WALK_EYE_HEIGHT,
      ) !== null;
      if (insideRaisedSurface) {
        this.restoreLastSafePosition();
      } else {
        this.rememberSafePosition();
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
      speedKilometresPerHour: Number((worldUnitsToMetres(this.currentSpeed) * 3.6).toFixed(1)),
      configuredWalkSpeedKilometresPerHour: this.getWalkSpeedKilometresPerHour(),
      turboEnabled: this.turboEnabled,
      jumpState: !this.isJumping ? 'grounded' : this.velocityY > 0 ? 'rising' : 'falling',
      jumpHeld: this.jumpHeld,
      jumpHeightMetres: Number(worldUnitsToMetres(this.jumpPeakHeight).toFixed(2)),
      jumpHeightRangeMetres: [WALK_JUMP_TAP_HEIGHT_METRES, WALK_JUMP_HOLD_HEIGHT_METRES],
      movementKeys: Array.from(this.keys).sort(),
      direction: this.direction.toArray().map((value) => Number(value.toFixed(3))) as [number, number, number],
      safetyRecoveries: this.safetyRecoveries,
      collisionSpatialIndex: this.getNavigationSpatialIndexSnapshot(),
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
    const walkableIndices = this.queryNavigationSpatialIndices('walkables', x, z);
    this.walkableQueryObjects.length = 0;
    walkableIndices.forEach((index) => {
      const walkable = this.walkables[index];
      if (walkable) this.walkableQueryObjects.push(walkable);
    });
    const intersections = this.raycaster.intersectObjects(this.walkableQueryObjects, false);
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
    const insideAccess = this.isInsideNavigationAccess(x, z, bodyBottom, bodyTop);
    return !this.collidesWithObstacle(x, z, bodyBottom, bodyTop, insideAccess)
      && !this.collidesWithBarrier(x, z, bodyBottom, bodyTop)
      && this.findUnderwalkSurface(x, z, ground, bodyBottom, bodyTop) === null;
  }

  private collidesWithObstacle(
    x: number,
    z: number,
    bodyBottom: number,
    bodyTop: number,
    insideAccess = false,
  ) {
    return this.findObstacleCollisionIndex(x, z, bodyBottom, bodyTop, insideAccess) >= 0;
  }

  private findObstacleCollisionIndex(
    x: number,
    z: number,
    bodyBottom: number,
    bodyTop: number,
    insideAccess = false,
  ) {
    if (insideAccess) return -1;
    const obstacleIndices = this.queryNavigationSpatialIndices('obstacles', x, z);
    for (const index of obstacleIndices) {
      const bounds = this.obstacleBounds[index];
      if (!bounds) continue;
      const broadPhaseHit = x >= bounds.min.x - WALK_RADIUS
        && x <= bounds.max.x + WALK_RADIUS
        && z >= bounds.min.z - WALK_RADIUS
        && z <= bounds.max.z + WALK_RADIUS
        && bodyTop >= bounds.min.y
        && bodyBottom <= bounds.max.y;
      if (!broadPhaseHit) continue;

      const obstacle = this.navigationObstacles[index];
      // Synthetic test obstacles and unsupported instanced colliders retain
      // the conservative box behavior; authored district meshes take the
      // precise local-footprint path below.
      if (!obstacle) return index;
      this.obstacleLocalBottom
        .set(x, bodyBottom, z)
        .applyMatrix4(obstacle.inverseWorldMatrix);
      this.obstacleLocalTop
        .set(x, bodyTop, z)
        .applyMatrix4(obstacle.inverseWorldMatrix);
      const radiusX = WALK_RADIUS / Math.max(0.001, Math.abs(obstacle.worldScale.x));
      const radiusY = WALK_RADIUS / Math.max(0.001, Math.abs(obstacle.worldScale.y));
      const radiusZ = WALK_RADIUS / Math.max(0.001, Math.abs(obstacle.worldScale.z));
      const { localBounds } = obstacle;

      if (!this.localBodySegmentIntersectsBounds(
        this.obstacleLocalBottom,
        this.obstacleLocalTop,
        localBounds,
        radiusX,
        radiusY,
        radiusZ,
      )) continue;

      if (obstacle.circularFootprint) {
        const centerX = (localBounds.min.x + localBounds.max.x) * 0.5;
        const centerZ = (localBounds.min.z + localBounds.max.z) * 0.5;
        const extentX = (localBounds.max.x - localBounds.min.x) * 0.5 + radiusX;
        const extentZ = (localBounds.max.z - localBounds.min.z) * 0.5 + radiusZ;
        const localX = (this.obstacleLocalBottom.x + this.obstacleLocalTop.x) * 0.5;
        const localZ = (this.obstacleLocalBottom.z + this.obstacleLocalTop.z) * 0.5;
        const normalizedX = (localX - centerX) / Math.max(0.001, extentX);
        const normalizedZ = (localZ - centerZ) / Math.max(0.001, extentZ);
        if (normalizedX * normalizedX + normalizedZ * normalizedZ <= 1) return index;
        continue;
      }
      if (obstacle.roundedFootprintRadius > 0) {
        const centerX = (localBounds.min.x + localBounds.max.x) * 0.5;
        const centerZ = (localBounds.min.z + localBounds.max.z) * 0.5;
        const halfX = (localBounds.max.x - localBounds.min.x) * 0.5;
        const halfZ = (localBounds.max.z - localBounds.min.z) * 0.5;
        const cornerRadius = Math.min(obstacle.roundedFootprintRadius, halfX, halfZ);
        const coreHalfX = Math.max(0, halfX - cornerRadius);
        const coreHalfZ = Math.max(0, halfZ - cornerRadius);
        const localX = (this.obstacleLocalBottom.x + this.obstacleLocalTop.x) * 0.5;
        const localZ = (this.obstacleLocalBottom.z + this.obstacleLocalTop.z) * 0.5;
        const cornerX = Math.max(0, Math.abs(localX - centerX) - coreHalfX);
        const cornerZ = Math.max(0, Math.abs(localZ - centerZ) - coreHalfZ);
        const normalizedX = cornerX / Math.max(0.001, cornerRadius + radiusX);
        const normalizedZ = cornerZ / Math.max(0.001, cornerRadius + radiusZ);
        if (normalizedX * normalizedX + normalizedZ * normalizedZ <= 1) return index;
        continue;
      }
      return index;
    }
    return -1;
  }

  private localBodySegmentIntersectsBounds(
    start: THREE.Vector3,
    end: THREE.Vector3,
    bounds: THREE.Box3,
    radiusX: number,
    radiusY: number,
    radiusZ: number,
  ) {
    let minimumT = 0;
    let maximumT = 1;
    const intersectsAxis = (origin: number, target: number, minimum: number, maximum: number) => {
      const delta = target - origin;
      if (Math.abs(delta) < 0.000001) return origin >= minimum && origin <= maximum;
      let entry = (minimum - origin) / delta;
      let exit = (maximum - origin) / delta;
      if (entry > exit) [entry, exit] = [exit, entry];
      minimumT = Math.max(minimumT, entry);
      maximumT = Math.min(maximumT, exit);
      return minimumT <= maximumT;
    };
    return intersectsAxis(start.x, end.x, bounds.min.x - radiusX, bounds.max.x + radiusX)
      && intersectsAxis(start.y, end.y, bounds.min.y - radiusY, bounds.max.y + radiusY)
      && intersectsAxis(start.z, end.z, bounds.min.z - radiusZ, bounds.max.z + radiusZ);
  }

  private isInsideNavigationAccess(x: number, z: number, bodyBottom: number, bodyTop: number) {
    const accessIndices = this.queryNavigationSpatialIndices('accessBounds', x, z);
    return accessIndices.some(
      (index) => {
        const bounds = this.accessBounds[index];
        return Boolean(bounds) && (
          x >= bounds.min.x + WALK_RADIUS
          && x <= bounds.max.x - WALK_RADIUS
          && z >= bounds.min.z + WALK_RADIUS
          && z <= bounds.max.z - WALK_RADIUS
          && bodyTop >= bounds.min.y
          && bodyBottom <= bounds.max.y
        );
      },
    );
  }

  private isInsideAccessVolume(
    volume: NavigationAccessVolume,
    x: number,
    z: number,
    bodyBottom: number,
    bodyTop: number,
  ) {
    const { object, localBounds } = volume;
    object.updateWorldMatrix(true, false);
    this.accessLocalBottom.set(x, bodyBottom, z);
    object.worldToLocal(this.accessLocalBottom);
    this.accessLocalTop.set(x, bodyTop, z);
    object.worldToLocal(this.accessLocalTop);
    object.getWorldScale(this.accessWorldScale);
    const localRadiusX = WALK_RADIUS / Math.max(0.001, Math.abs(this.accessWorldScale.x));
    const localRadiusZ = WALK_RADIUS / Math.max(0.001, Math.abs(this.accessWorldScale.z));
    return this.accessLocalBottom.x >= localBounds.min.x + localRadiusX
      && this.accessLocalBottom.x <= localBounds.max.x - localRadiusX
      && this.accessLocalBottom.z >= localBounds.min.z + localRadiusZ
      && this.accessLocalBottom.z <= localBounds.max.z - localRadiusZ
      && this.accessLocalTop.y >= localBounds.min.y
      && this.accessLocalBottom.y <= localBounds.max.y;
  }

  private findUnderwalkSurface(
    x: number,
    z: number,
    ground: number,
    bodyBottom: number,
    bodyTop: number,
  ) {
    const underwalkAccessIndices = this.queryNavigationSpatialIndices(
      'underwalkAccessVolumes',
      x,
      z,
    );
    const insideUnderwalkAccess = underwalkAccessIndices.some(
      (index) => {
        const volume = this.underwalkAccessVolumes[index];
        return Boolean(volume) && this.isInsideAccessVolume(volume, x, z, bodyBottom, bodyTop);
      },
    );
    if (insideUnderwalkAccess) return null;
    const sampleOffset = WALK_RADIUS * 0.78;
    const samples: readonly (readonly [number, number])[] = [
      [0, 0],
      [sampleOffset, 0],
      [-sampleOffset, 0],
      [0, sampleOffset],
      [0, -sampleOffset],
    ];
    const surfaceIndices = this.queryNavigationSpatialIndices('underwalkSurfaces', x, z);
    for (const index of surfaceIndices) {
      const surface = this.underwalkSurfaces[index];
      if (!surface) continue;
      const { bounds, object } = surface;
      if (
        x < bounds.min.x - WALK_RADIUS
        || x > bounds.max.x + WALK_RADIUS
        || z < bounds.min.z - WALK_RADIUS
        || z > bounds.max.z + WALK_RADIUS
        || bodyTop <= bounds.min.y + NAVIGATION_LAYER_EPSILON
        || bodyBottom >= bounds.max.y - NAVIGATION_LAYER_EPSILON
        || bounds.max.y <= ground + NAVIGATION_LAYER_EPSILON
      ) {
        continue;
      }
      for (const [offsetX, offsetZ] of samples) {
        const sampleX = x + offsetX;
        const sampleZ = z + offsetZ;
        if (
          sampleX < bounds.min.x
          || sampleX > bounds.max.x
          || sampleZ < bounds.min.z
          || sampleZ > bounds.max.z
        ) {
          continue;
        }
        this.rayOrigin.set(sampleX, bounds.max.y + 0.05, sampleZ);
        this.raycaster.set(this.rayOrigin, this.down);
        this.raycaster.near = 0;
        this.raycaster.far = Math.max(0.1, bounds.max.y - bounds.min.y + 0.1);
        const topHit = this.raycaster.intersectObject(object, false)[0];
        if (!topHit || topHit.point.y <= ground + NAVIGATION_LAYER_EPSILON) continue;

        this.rayOrigin.set(sampleX, bounds.min.y - 0.05, sampleZ);
        this.raycaster.set(this.rayOrigin, this.up);
        this.raycaster.near = 0;
        this.raycaster.far = Math.max(0.1, bounds.max.y - bounds.min.y + 0.1);
        const bottomHit = this.raycaster.intersectObject(object, false)[0];
        const bottomY = bottomHit?.point.y ?? bounds.min.y;
        if (
          topHit.point.y - bottomY > NAVIGATION_LAYER_EPSILON
          && bottomY < bodyTop - NAVIGATION_LAYER_EPSILON
          && topHit.point.y > bodyBottom + NAVIGATION_LAYER_EPSILON
        ) {
          return object;
        }
      }
    }
    return null;
  }

  private collidesWithBarrier(x: number, z: number, bodyBottom: number, bodyTop: number) {
    return this.findBarrierCollision(x, z, bodyBottom, bodyTop) !== null;
  }

  private findBarrierCollision(x: number, z: number, bodyBottom: number, bodyTop: number) {
    const barrierIndices = this.queryNavigationSpatialIndices('barriers', x, z);
    for (const index of barrierIndices) {
      const barrier = this.barrierSegments[index];
      if (!barrier || bodyTop < barrier.minY || bodyBottom > barrier.maxY) continue;
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
      if (dx * dx + dz * dz <= clearance * clearance) return barrier;
    }
    return null;
  }

  private canTraverseGroundTransition(nextGround: number) {
    if (this.groundY === null) return true;
    const rise = nextGround - this.groundY;
    if (rise > WALK_STEP_HEIGHT) {
      if (!this.isJumping) return false;
      const airborneFeetY = this.camera.position.y - WALK_EYE_HEIGHT;
      if (airborneFeetY + 0.002 < nextGround) return false;
    }
    if (!this.isJumping && -rise > MAX_GROUNDED_DROP) return false;
    return true;
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
    if (!this.canTraverseGroundTransition(nextGround)) return;
    const { bodyBottom, bodyTop } = this.getMovementBodyRange(nextGround);
    const insideAccess = this.isInsideNavigationAccess(
      this.candidate.x,
      this.candidate.z,
      bodyBottom,
      bodyTop,
    );
    if (this.findUnderwalkSurface(
      this.candidate.x,
      this.candidate.z,
      nextGround,
      bodyBottom,
      bodyTop,
    )) return;
    if (this.collidesWithObstacle(
      this.candidate.x,
      this.candidate.z,
      bodyBottom,
      bodyTop,
      insideAccess,
    )) return;
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
    if (!this.canTraverseGroundTransition(nextGround)) return;
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
      if (!this.canTraverseGroundTransition(nextGround)) return;
      ({ bodyBottom, bodyTop } = this.getMovementBodyRange(nextGround));
    }

    const insideAccess = this.isInsideNavigationAccess(
      this.candidate.x,
      this.candidate.z,
      bodyBottom,
      bodyTop,
    );
    if (this.findUnderwalkSurface(
      this.candidate.x,
      this.candidate.z,
      nextGround,
      bodyBottom,
      bodyTop,
    )) return;
    if (
      this.collidesWithObstacle(
        this.candidate.x,
        this.candidate.z,
        bodyBottom,
        bodyTop,
        insideAccess,
      )
      || this.collidesWithBarrier(this.candidate.x, this.candidate.z, bodyBottom, bodyTop)
    ) return;
    this.camera.position.x = this.candidate.x;
    this.camera.position.z = this.candidate.z;
    this.groundY = nextGround;
  }

  private rememberSafePosition() {
    if (this.groundY === null) return;
    this.lastSafePosition.set(
      this.camera.position.x,
      this.groundY + WALK_EYE_HEIGHT,
      this.camera.position.z,
    );
    this.lastSafeGroundY = this.groundY;
  }

  private restoreLastSafePosition() {
    if (this.lastSafeGroundY === null) {
      const fallback = this.findNearestWalkable(0, DISTRICT_ROAD_RADII[0]);
      if (!fallback) return;
      this.lastSafeGroundY = fallback.y;
      this.lastSafePosition.set(fallback.x, fallback.y + WALK_EYE_HEIGHT, fallback.z);
    }
    this.camera.position.copy(this.lastSafePosition);
    this.groundY = this.lastSafeGroundY;
    this.grounded = true;
    this.velocityY = 0;
    this.isJumping = false;
    this.jumpHeld = false;
    this.currentSpeed = 0;
    this.safetyRecoveries += 1;
    this.sampleGround(
      this.camera.position.x,
      this.camera.position.z,
      { spawnSearch: true, trackSurface: true },
    );
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
      'Space',
    ]);
    if (movementCodes.has(event.code)) {
      event.preventDefault();
      this.keys.add(event.code);
    }
    if (event.code === 'Space' && !event.repeat) {
      this.jumpHeld = true;
      this.triggerJump();
    }
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
