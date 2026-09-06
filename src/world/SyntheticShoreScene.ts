import * as THREE from 'three';
import { createSyntheticShoreEffects, type ShoreEnvironmentState } from './syntheticShoreEffects';
import { createSyntheticBeachVenues } from './syntheticBeachVenues';
import { createSyntheticBeachAudio } from './syntheticBeachAudio';
import { sampleBeachCoast } from './syntheticBeachLayout';
import { WALK_EYE_HEIGHT_METRES, WALK_GRAVITY, WALK_JUMP_SPEED, WALK_JUMP_TAP_SPEED, WALK_JUMP_TAP_HEIGHT_METRES, WALK_JUMP_HOLD_HEIGHT_METRES, WALK_TURBO_SPEED, worldUnitsToMetres } from '../config/island';

export type SyntheticShoreView = 'ocean' | 'island' | 'pier' | 'club' | 'house';
export type SyntheticShoreSwimmingMode = 'walking' | 'wading' | 'surface-swimming' | 'underwater';

const EYE_HEIGHT = WALK_EYE_HEIGHT_METRES;
// The island uses 10 m per unit; this scene uses metres. Share its physics.
const GRAVITY = worldUnitsToMetres(WALK_GRAVITY);
const JUMP_SPEED = worldUnitsToMetres(WALK_JUMP_SPEED);
const JUMP_TAP_SPEED = worldUnitsToMetres(WALK_JUMP_TAP_SPEED);
const PIER_X = 42;
const PIER_Y = 8;
const STAIR_X = 30.5;
const STAIR_START = 28;
const STAIR_END = 58;
const ANCHOR_Z = -39;
const ANCHOR_RADIUS = 24;
const TAU = Math.PI * 2;
const SWIM_EYE_ABOVE_WATER = 0.60;
const SWIM_FLOOR_CLEARANCE = 0.65;
const SWIM_ENTRY_DEPTH = 1.15;
const SWIM_EXIT_DEPTH = 1.02;

type BoxPlacement = { x: number; y: number; z: number; w: number; h: number; d: number; angle: number };

/** Repeated architecture uses one draw call per material, including pier furniture. */
class ShoreBoxBatch {
  private readonly buckets = new Map<THREE.Material, BoxPlacement[]>();

  add(material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, angle = 0) {
    const bucket = this.buckets.get(material) ?? [];
    if (!this.buckets.has(material)) this.buckets.set(material, bucket);
    bucket.push({ x, y, z, w, h, d, angle });
  }

  finish(parent: THREE.Object3D, prefix: string) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const dummy = new THREE.Object3D();
    let index = 0;
    for (const [material, placements] of this.buckets) {
      const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
      mesh.name = `${prefix} / ${material.name || index++}`;
      for (let i = 0; i < placements.length; i += 1) {
        const p = placements[i];
        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.set(p.w, p.h, p.d);
        dummy.rotation.set(0, p.angle, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      parent.add(mesh);
    }
  }
}

function seeded(index: number) {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function standard(name: string, color: THREE.ColorRepresentation, metalness = 0.3, roughness = 0.5) {
  const material = new THREE.MeshStandardMaterial({ color, metalness, roughness });
  material.name = name;
  return material;
}

function glow(name: string, color: THREE.ColorRepresentation, intensity = 1) {
  const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.3 });
  material.name = name;
  return material;
}

function meshAt(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, name: string) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function arcRibbon(radius: number, width: number, start: number, end: number, segments = 48) {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = THREE.MathUtils.lerp(start, end, i / segments);
    for (const r of [radius - width / 2, radius + width / 2]) {
      positions.push(Math.sin(angle) * r, 0, -Math.cos(angle) * r);
    }
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * The shore is an independent, disposable scene rendered by IslandWorld's existing
 * renderer. Its metre-based navigation and vista proxies keep the island's large
 * simulation, controls and GPU resources out of this scene's render/update path.
 */
export class SyntheticShoreScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(62, 1, 0.08, 18000);
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly effects: ReturnType<typeof createSyntheticShoreEffects>;
  private readonly venues: ReturnType<typeof createSyntheticBeachVenues>;
  private readonly audio = createSyntheticBeachAudio();
  private readonly ambient = new THREE.HemisphereLight();
  private readonly sunlight = new THREE.DirectionalLight();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pickPoint = new THREE.Vector2();
  private pointerStartX = 0;
  private pointerStartY = 0;
  private interactionListener: (() => void) | null = null;
  private nearbyHotspotId: string | null = null;
  private activeHotspotId: string | null = null;
  private interactionMessage = '';
  private readonly keys = new Set<string>();
  private readonly navigationDirection = new THREE.Vector3();
  private readonly navigationRight = new THREE.Vector3();
  private readonly destination = new THREE.Vector3();
  private readonly navigationFrom = new THREE.Vector3();
  private readonly swimVelocity = new THREE.Vector3();
  private readonly swimIntent = new THREE.Vector3();
  private readonly direction = new THREE.Vector3();
  private readonly euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly previousTouchAction: string;
  private readonly previousCursor: string;
  private readonly previousTabIndex: number;
  private pointerId: number | null = null;
  private pointerX = 0;
  private pointerY = 0;
  private disposed = false;
  private exiting = false;
  private view: SyntheticShoreView = 'ocean';
  private surface = 'silver sand';
  private moving = false;
  private elapsed = 0;
  private groundY = 0;
  private velocityY = 0;
  private grounded = true;
  private jumpHeld = false;
  private jumpStartY = 0;
  private jumpPeakHeight = 0;
  private swimming = false;
  private underwater = false;
  private standingFromSwim = false;
  private localWaterHeight = 0;
  private localWaterDepth = 0;
  private movementHudElapsed = 0;
  private walkSpeedKilometresPerHour = 6.5;
  private turboEnabled = false;
  private pointerWasLocked = false;
  private pointerLockPending = false;
  private dragLookFallback = false;
  private fallbackPointerReady = false;
  private lastUnlockAt = -Infinity;
  private readonly onExit: () => void;

  constructor(renderer: THREE.WebGLRenderer, onExit: () => void, movement?: { speedKilometresPerHour: number; turboEnabled: boolean }) {
    this.onExit = onExit;
    this.renderer = renderer;
    this.canvas = renderer.domElement;
    if (movement) {
      this.walkSpeedKilometresPerHour = movement.speedKilometresPerHour;
      this.turboEnabled = movement.turboEnabled;
    }
    this.previousTouchAction = this.canvas.style.touchAction;
    this.previousCursor = this.canvas.style.cursor;
    this.previousTabIndex = this.canvas.tabIndex;
    this.canvas.style.touchAction = 'none';
    this.canvas.style.cursor = 'grab';
    this.canvas.tabIndex = 0;
    this.scene.name = 'Synthetic shore / Alpine oceanfront';
    this.scene.background = new THREE.Color('#80b9d1');
    this.scene.fog = new THREE.FogExp2('#83adbf', 0.00022);
    this.ambient.groundColor.set('#516c77');
    this.scene.add(this.ambient, this.sunlight);
    this.effects = createSyntheticShoreEffects();
    this.scene.add(this.effects.group);
    this.venues = createSyntheticBeachVenues((x, z) => this.groundHeight(x, z));
    this.scene.add(this.venues.group);
    try {
      const saved = JSON.parse(localStorage.getItem('synthetic-shore-environment-v1') ?? 'null');
      if (saved && typeof saved === 'object') this.effects.setEnvironment(saved);
    } catch { /* Optional view preferences must never block the scene. */ }
    this.applyLighting();
    this.buildPier();
    this.buildIslandVista();
    this.buildCityVista();
    this.buildBeachFurniture();
    this.setView('ocean');
    const size = renderer.getSize(new THREE.Vector2());
    this.resize(size.x, size.y);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('lostpointercapture', this.onPointerUp);
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
    this.canvas.addEventListener('blur', this.onBlur);
    document.addEventListener('mousemove', this.onLockedMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('pointerlockerror', this.onPointerLockError, true);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    this.canvas.focus({ preventScroll: true });
  }

  private groundHeight(x: number, z: number) {
    return this.effects.groundHeight(x, z);
  }

  private buildPier() {
    const group = new THREE.Group();
    group.name = 'ANCHOR / observation pier and beach stair';
    const batch = new ShoreBoxBatch();
    const titanium = standard('satin titanium', '#d5e2e4', 0.62, 0.34);
    const deck = standard('graphite ceramic deck', '#647a80', 0.35, 0.63);
    const underside = standard('deep blue structural steel', '#203e4b', 0.6, 0.42);
    const cyan = glow('glacial cyan guidance', '#8bebee', 1.8);
    const dark = standard('inset deck seams', '#344f58', 0.4, 0.7);
    const glass = new THREE.MeshPhysicalMaterial({ color: '#94dadd', transparent: true, opacity: 0.17, metalness: 0, roughness: 0.12, depthWrite: false, side: THREE.DoubleSide });
    glass.name = 'transparent safety glass';

    // The stem extends from the Alpine corner to an ocean-facing anchor head.
    batch.add(underside, PIER_X, PIER_Y - 0.63, 28, 9.4, 1.1, 188);
    batch.add(deck, PIER_X, PIER_Y - 0.09, 28, 9, 0.18, 188);
    for (const side of [-1, 1]) {
      batch.add(titanium, PIER_X + side * 4.52, PIER_Y, 28, 0.28, 0.22, 188);
      batch.add(cyan, PIER_X + side * 4.53, PIER_Y + 0.13, 28, 0.08, 0.035, 188);
    }
    for (let z = -63; z <= 120; z += 3.5) {
      batch.add(dark, PIER_X, PIER_Y + 0.006, z, 8.6, 0.015, 0.026);
      for (const side of [-1, 1]) {
        // A generous opening allows the stair landing to join the stem.
        if (side === -1 && z > 53 && z < 62) continue;
        batch.add(titanium, PIER_X + side * 4.28, PIER_Y + 0.59, z, 0.06, 1.18, 0.09);
      }
    }
    for (const side of [-1, 1]) {
      for (const [start, end] of side === -1 ? [[-61, 53], [62, 121]] : [[-61, 121]]) {
        batch.add(glass, PIER_X + side * 4.28, PIER_Y + 0.6, (start + end) / 2, 0.035, 1.04, end - start);
        batch.add(titanium, PIER_X + side * 4.28, PIER_Y + 1.18, (start + end) / 2, 0.09, 0.08, end - start);
      }
    }
    for (let z = -58; z < 120; z += 20) {
      for (const side of [-1, 1]) {
        batch.add(underside, PIER_X + side * 3.5, 2.8, z, 0.75, 10, 1.1);
        batch.add(titanium, PIER_X + side * 3.5, 1, z, 0.84, 1.4, 1.2);
        batch.add(cyan, PIER_X + side * 3.91, PIER_Y - 1, z, 0.045, 0.45, 0.62);
      }
    }
    // Broad crescent head: a physical anchor shape, with both flukes turned inland.
    const arcStart = -Math.PI * 0.64;
    const arcEnd = Math.PI * 0.64;
    meshAt(group, arcRibbon(ANCHOR_RADIUS, 8, arcStart, arcEnd), deck, PIER_X, PIER_Y, ANCHOR_Z, 'Anchor observation crescent');
    const edge = new THREE.MeshStandardMaterial({ color: '#284651', side: THREE.DoubleSide, roughness: 0.6 });
    for (const radius of [20, 28]) {
      meshAt(group, arcRibbon(radius, 0.3, arcStart, arcEnd), titanium, PIER_X, PIER_Y + 0.04, ANCHOR_Z, 'Crescent silver rim');
      meshAt(group, arcRibbon(radius, 0.08, arcStart, arcEnd), cyan, PIER_X, PIER_Y + 0.2, ANCHOR_Z, 'Crescent continuous light');
      for (let i = 0; i < 33; i += 1) {
        const angle = THREE.MathUtils.lerp(arcStart, arcEnd, i / 32);
        if (radius === 20 && Math.abs(angle) < 0.24) continue;
        const x = PIER_X + Math.sin(angle) * radius;
        const z = ANCHOR_Z - Math.cos(angle) * radius;
        batch.add(titanium, x, PIER_Y + 0.58, z, 0.055, 1.16, 0.075, -angle);
      }
      for (const [start, end] of radius === 20 ? [[arcStart, -0.24], [0.24, arcEnd]] : [[arcStart, arcEnd]]) {
        const curve = new THREE.CatmullRomCurve3(Array.from({ length: 65 }, (_, index) => {
          const angle = THREE.MathUtils.lerp(start, end, index / 64);
          return new THREE.Vector3(PIER_X + Math.sin(angle) * radius, PIER_Y + 1.16, ANCHOR_Z - Math.cos(angle) * radius);
        }));
        meshAt(group, new THREE.TubeGeometry(curve, 72, 0.047, 5, false), titanium, 0, 0, 0, 'Crescent safety handrail');
      }
      // The thin fascia makes the deck substantial from the waterline.
      const points: number[] = [];
      const indices: number[] = [];
      for (let i = 0; i <= 64; i += 1) {
        const angle = THREE.MathUtils.lerp(arcStart, arcEnd, i / 64);
        const x = PIER_X + Math.sin(angle) * radius;
        const z = ANCHOR_Z - Math.cos(angle) * radius;
        points.push(x, PIER_Y, z, x, PIER_Y - 0.8, z);
        if (i < 64) { const k = i * 2; indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      meshAt(group, geometry, edge, 0, 0, 0, 'Anchor curved fascia');
    }
    for (let index = 0; index < 8; index += 1) {
      const angle = THREE.MathUtils.lerp(arcStart, arcEnd, index / 7);
      batch.add(underside, PIER_X + Math.sin(angle) * ANCHOR_RADIUS, 2.5, ANCHOR_Z - Math.cos(angle) * ANCHOR_RADIUS, 0.85, 10.5, 1.1, -angle);
    }

    const bottom = this.groundHeight(STAIR_X, STAIR_START);
    const count = 36;
    const tread = (STAIR_END - STAIR_START) / count;
    for (let i = 0; i < count; i += 1) {
      const top = THREE.MathUtils.lerp(bottom, PIER_Y, (i + 1) / count);
      const z = STAIR_START + (i + 0.5) * tread;
      batch.add(titanium, STAIR_X, top - 0.14, z, 5.4, 0.28, tread + 0.035);
      batch.add(deck, STAIR_X, top + 0.01, z + 0.07, 4.95, 0.025, tread - 0.14);
      batch.add(cyan, STAIR_X, top - 0.03, z - tread / 2 + 0.022, 4.8, 0.05, 0.035);
    }
    batch.add(deck, 34.5, PIER_Y - 0.14, 60, 14.5, 0.28, 4);
    for (const side of [-1, 1]) {
      const railPoints: THREE.Vector3[] = [];
      for (let i = 0; i <= 12; i += 1) {
        const z = THREE.MathUtils.lerp(STAIR_START, STAIR_END, i / 12);
        const y = THREE.MathUtils.lerp(bottom, PIER_Y, i / 12);
        batch.add(titanium, STAIR_X + side * 2.55, y + 0.57, z, 0.06, 1.14, 0.06);
        railPoints.push(new THREE.Vector3(STAIR_X + side * 2.55, y + 1.14, z));
      }
      meshAt(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPoints), 16, 0.055, 6, false), titanium, 0, 0, 0, 'Continuous stair handrail');
      batch.add(underside, STAIR_X + side * 2.1, 3.9, 52, 0.22, 7, 0.22);
    }
    // A gently rising landward continuation meets the island seawall at 16 m.
    const ramp = meshAt(group, new THREE.BoxGeometry(9, 0.5, 309), deck, PIER_X, 12, 275.5, 'Alpine mainland approach');
    ramp.rotation.x = -Math.atan2(8, 309);
    for (let z = 150; z < 430; z += 45) {
      const y = 8 + (z - 121) / 309 * 8;
      for (const side of [-1, 1]) {
        batch.add(underside, PIER_X + side * 3.5, y / 2 - 0.5, z, 0.8, y + 1, 1.2);
        batch.add(titanium, PIER_X + side * 4.2, y + 0.6, z, 0.07, 1.2, 0.07);
      }
    }
    batch.finish(group, 'Anchor pier');
    this.makeSign(group, 'ANCHOR', 'OBSERVATORY / 01', 39, PIER_Y + 2.1, -30, 2.3, true);
    this.makeSign(group, 'SYNTHETIC SHORE', 'SILVER SANDS · ALPINE OCEANFRONT', 24.5, 4.7, 31.5, 3.6, true);
    this.makeSign(group, 'LAB ISLAND', 'CONTINUE TO RETURN', PIER_X, PIER_Y + 2.4, 106, 2.4, true);
    this.scene.add(group);
  }

  private buildCityVista() {
    const group = new THREE.Group();
    group.name = 'Cyber city / eastern half of the horizon';
    const batch = new ShoreBoxBatch();
    const palette = [standard('distant petrol glass', '#193f53', 0.55, 0.35), standard('distant midnight glass', '#183644', 0.55, 0.35), standard('distant steel blue', '#35586a', 0.5, 0.4)];
    const cyan = glow('skyline cyan', '#80cbd6', 0.45);
    const pink = glow('skyline pale lilac', '#c6a9d4', 0.55);
    const white = glow('skyline warm white', '#d0d8b2', 0.5);
    const neon = [cyan, pink, white];
    const foundation = standard('city seawall', '#365663', 0.18, 0.8);
    batch.add(foundation, 1550, -0.5, -1060, 3050, 5, 270);
    for (let i = 0; i < 166; i += 1) {
      const column = i % 83;
      const row = Math.floor(i / 83);
      const x = 58 + column * 33 + seeded(i * 3) * 16;
      const z = -950 - row * 175 - seeded(i + 22) * 80;
      const width = 18 + seeded(i + 14) * 23;
      const height = 45 + Math.pow(seeded(i + 4), 1.8) * 235 + (row ? 55 : 0);
      const depth = 22 + seeded(i + 2) * 26;
      const material = palette[i % palette.length];
      batch.add(material, x, height / 2, z, width, height, depth);
      if (i % 3 === 0) batch.add(material, x + width * 0.16, height + 9, z + 4, width * 0.55, 18, depth * 0.62);
      if (i % 7 === 0) batch.add(material, x, height + 18, z, 1.7, 36, 1.7);
      for (let band = 0; band < 3; band += 1) {
        const y = height * (0.25 + band * 0.24);
        batch.add(neon[(i + band) % 3], x, y, z + depth / 2 + 0.04, width * (band === 2 ? 0.78 : 0.95), 0.5, 0.08);
      }
      if (i % 4 === 0) batch.add(cyan, x + width * 0.31, height * 0.42, z + depth / 2 + 0.06, 0.5, height * 0.68, 0.1);
    }
    // Continue around the eastern side only: looking back naturally puts the city
    // to the island's left, as in the supplied reverse-view reference.
    for (let i = 0; i < 55; i += 1) {
      const angle = THREE.MathUtils.lerp(-0.52, 0.83, i / 54);
      const x = 1650 * Math.cos(angle);
      const z = 1650 * Math.sin(angle) + 150;
      const height = 65 + seeded(i + 304) * 170;
      batch.add(palette[i % 3], x, height / 2, z, 34 + seeded(i) * 22, height, 37, -angle);
      batch.add(neon[i % 3], x, height * 0.65, z, 36, 0.7, 38, -angle);
    }
    batch.finish(group, 'Instanced cyber skyline');
    this.scene.add(group);
  }

  private buildIslandVista() {
    const group = new THREE.Group();
    group.name = 'Lab Island / hexagonal vista from Alpine shore';
    const batch = new ShoreBoxBatch();
    const base = standard('island marine foundation', '#3c5960', 0.35, 0.74);
    const landscaping = standard('island planted surface', '#8ba9a2', 0.05, 0.98);
    const pale = standard('laboratory ceramic', '#b3c8c9', 0.3, 0.47);
    const ink = standard('laboratory graphite', '#294d58', 0.45, 0.46);
    const glazing = standard('laboratory glass', '#538493', 0.55, 0.25);
    const cyan = glow('lab cyan', '#b2f1e9', 0.75);
    const radius = 450;
    // The Alpine corner joins the same two seawall edges as the beach outline.
    const centerZ = 560;
    const shape = new THREE.Shape();
    for (let i = 0; i <= 6; i += 1) {
      const angle = i / 6 * TAU;
      const x = Math.sin(angle) * radius;
      const z = centerZ - Math.cos(angle) * radius;
      if (i === 0) shape.moveTo(x, -z); else shape.lineTo(x, -z);
    }
    const foundation = meshAt(group, new THREE.ExtrudeGeometry(shape, { depth: 17, bevelEnabled: false, steps: 1 }), base, 0, -1, 0, 'Hexagonal island sea defence');
    foundation.rotation.x = -Math.PI / 2;
    const surface = meshAt(group, new THREE.ShapeGeometry(shape), landscaping, 0, 16.04, 0, 'Planted hexagonal island surface');
    surface.rotation.x = -Math.PI / 2;
    const edgePoints = Array.from({ length: 7 }, (_, i) => {
      const angle = i / 6 * TAU;
      return new THREE.Vector3(Math.sin(angle) * radius, 16.4, centerZ - Math.cos(angle) * radius);
    });
    const edge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(edgePoints), new THREE.LineBasicMaterial({ color: '#c2e9e3' }));
    edge.name = 'Illuminated hexagonal perimeter';
    group.add(edge);

    const districts = [pale, ink, glazing];
    for (let ring = 0; ring < 5; ring += 1) {
      const r = 88 + ring * 57;
      const count = 23 + ring * 16;
      const road = meshAt(group, new THREE.RingGeometry(r - 3, r + 3, 112), ink, 0, 16.11, centerZ, 'Concentric research campus boulevard');
      road.rotation.x = -Math.PI / 2;
      for (let i = 0; i < count; i += 1) {
        const angle = (i + 0.5) / count * TAU;
        const x = Math.sin(angle) * (r + 15);
        const z = centerZ - Math.cos(angle) * (r + 15);
        const index = ring * 93 + i;
        const height = 8 + seeded(index + 16) * 22;
        const width = 7 + seeded(index + 61) * 11;
        const depth = 7 + seeded(index + 36) * 13;
        batch.add(districts[index % 3], x, 16 + height / 2, z, width, height, depth, -angle);
        batch.add(cyan, x, 16 + height * 0.76, z, width + 0.12, 0.32, depth + 0.12, -angle);
        if (index % 5 === 0) batch.add(glazing, x, 17 + height, z, width * 0.4, 2, depth * 0.55, -angle);
      }
    }
    // Six biome domes retain the actual masterplan order viewed from Alpine.
    const biomeColors = ['#bce9ee', '#cedde3', '#d5bd86', '#bad191', '#a5c3a1', '#79cbbb'];
    for (let index = 0; index < 6; index += 1) {
      const angle = index / 6 * TAU;
      const x = Math.sin(angle) * 365;
      const z = centerZ - Math.cos(angle) * 365;
      const r = index === 0 ? 37 : 38;
      const domeMaterial = new THREE.MeshPhysicalMaterial({ color: biomeColors[index], transparent: true, opacity: 0.42, metalness: 0.06, roughness: 0.22, side: THREE.DoubleSide, depthWrite: false });
      const dome = meshAt(group, new THREE.SphereGeometry(r, 28, 14, 0, TAU, 0, Math.PI / 2), domeMaterial, x, 16.3, z, index === 0 ? 'Alpine biosphere / glacial dome' : `Biome biosphere ${index + 1}`);
      dome.scale.y = 0.9;
      const frameGeometry = new THREE.WireframeGeometry(new THREE.SphereGeometry(r + 0.1, 18, 9, 0, TAU, 0, Math.PI / 2));
      const frame = new THREE.LineSegments(frameGeometry, new THREE.LineBasicMaterial({ color: index === 0 ? '#e0fbff' : '#b1d1cc', transparent: true, opacity: 0.6 }));
      frame.position.copy(dome.position);
      frame.scale.y = 0.9;
      group.add(frame);
      const rim = meshAt(group, new THREE.TorusGeometry(r, 0.8, 5, 56), pale, x, 17, z, 'Biome pressure ring');
      rim.rotation.x = Math.PI / 2;
      if (index < 2) {
        for (let peak = 0; peak < 5; peak += 1) {
          const height = 10 + seeded(peak + index * 30) * 17;
          meshAt(group, new THREE.ConeGeometry(6 + seeded(peak + 2) * 7, height, 5), pale, x + (peak - 2) * 9, 16 + height / 2, z + Math.sin(peak * 3) * 9, 'Alpine snow peak');
        }
      } else {
        const planting = standard(`biome planting ${index}`, biomeColors[index], 0, 1);
        for (let tree = 0; tree < 11; tree += 1) {
          const treeAngle = tree * 2.4;
          const r0 = 5 + seeded(tree + 7) * 17;
          meshAt(group, new THREE.ConeGeometry(2.5, 7 + seeded(tree) * 8, 5), planting, x + Math.cos(treeAngle) * r0, 22, z + Math.sin(treeAngle) * r0, 'Biome canopy');
        }
      }
    }
    // Recognizable central megastructure behind the low-rise campus.
    batch.add(ink, 0, 44, centerZ, 97, 56, 78);
    batch.add(glazing, 0, 83, centerZ + 12, 53, 78, 47);
    batch.add(ink, -31, 76, centerZ + 8, 20, 99, 27);
    batch.add(ink, 36, 72, centerZ + 16, 17, 95, 29);
    for (let floor = 0; floor < 9; floor += 1) batch.add(cyan, 0, 25 + floor * 10, centerZ - 24, 66, 0.8, 1);
    // The eastern transit bridge remains at the side of the view.
    batch.add(pale, 560, 20, centerZ + 65, 380, 2.3, 9, -0.35);
    for (let i = 0; i < 10; i += 1) batch.add(ink, 410 + i * 32, 9, centerZ + 10 + i * 11.7, 3, 24, 3);
    batch.finish(group, 'Instanced island vista');
    this.makeSign(group, 'ALPINE BIOSPHERE', 'LAB ISLAND / RESEARCH CAMPUS', 0, 35, centerZ - 406, 17, true);
    group.position.x = PIER_X;
    this.scene.add(group);
  }

  private buildBeachFurniture() {
    const group = new THREE.Group();
    group.name = 'Silver shore / quiet beach furniture';
    const batch = new ShoreBoxBatch();
    const titanium = standard('beach brushed titanium', '#d2e0e2', 0.65, 0.4);
    const dark = standard('beach graphite insets', '#314f5b', 0.3, 0.65);
    const cyan = glow('shoreline low guidance', '#8bdbdd', 0.8);
    // Keep the central sea view open, with only small reflective stones near water.
    const stoneMaterial = standard('polished silver mineral', '#afbbbf', 0.7, 0.28);
    const stoneGeometry = new THREE.DodecahedronGeometry(1, 0);
    const stones = new THREE.InstancedMesh(stoneGeometry, stoneMaterial, 36);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 36; i += 1) {
      const x = (seeded(i + 507) - 0.5) * 160;
      const z = 0.5 + seeded(i + 809) * 35;
      const size = 0.025 + Math.pow(seeded(i + 111), 4) * 0.4;
      dummy.position.set(x, this.groundHeight(x, z) + size * 0.15, z);
      dummy.scale.set(size * 1.7, size * 0.55, size);
      dummy.rotation.set(i, i * 0.7, i * 0.3);
      dummy.updateMatrix();
      stones.setMatrixAt(i, dummy.matrix);
    }
    stones.computeBoundingSphere();
    stones.name = 'Silver mineral pebbles';
    group.add(stones);
    for (const x of [-43, -25, 14, 66, 82]) {
      const z = 44 + seeded(x + 203) * 9;
      if (this.venues.groundHeight(x, z) !== null) continue;
      const y = this.groundHeight(x, z);
      batch.add(titanium, x, y + 0.46, z, 3.7, 0.16, 1.05);
      batch.add(dark, x, y + 0.55, z, 3.3, 0.07, 0.8);
      for (const side of [-1, 1]) batch.add(titanium, x + side * 1.4, y + 0.22, z, 0.16, 0.44, 0.7);
      batch.add(cyan, x, y + 0.42, z - 0.53, 3.3, 0.04, 0.03);
    }
    for (let i = 0; i < 16; i += 1) {
      const x = -83 + i * 11;
      const z = 65 + Math.sin(i * 0.7) * 4;
      if (this.venues.groundHeight(x, z) !== null) continue;
      const y = this.groundHeight(x, z);
      batch.add(titanium, x, y + 0.5, z, 0.13, 1, 0.13);
      batch.add(cyan, x, y + 0.95, z, 0.17, 0.13, 0.17);
    }
    batch.finish(group, 'Instanced beach furniture');
    this.scene.add(group);
  }

  private makeSign(parent: THREE.Object3D, title: string, subtitle: string, x: number, y: number, z: number, width: number, faceOcean: boolean) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = 'rgba(17, 44, 54, 0.92)';
    context.fillRect(0, 0, 1024, 256);
    context.fillStyle = '#a9eef0';
    context.fillRect(0, 0, 8, 256);
    context.font = '500 64px system-ui, sans-serif';
    context.fillStyle = '#e9f8f6';
    context.fillText(title, 48, 116);
    context.font = '400 23px monospace';
    context.fillStyle = '#a5c4ca';
    context.fillText(subtitle, 50, 178);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sign = meshAt(parent, new THREE.PlaneGeometry(width, width / 4), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, toneMapped: false }), x, y, z, title);
    // A default plane faces +Z. Ocean-facing signage looks toward -Z.
    sign.rotation.y = faceOcean ? Math.PI : 0;
  }

  setView(view: SyntheticShoreView) {
    if (this.disposed) return;
    this.view = view;
    this.keys.clear();
    this.activeHotspotId = null;
    this.interactionMessage = '';
    if (view === 'island') {
      this.camera.position.set(-4, this.groundHeight(-4, 12) + EYE_HEIGHT, 12);
      this.camera.lookAt(42, 45, 560);
    } else if (view === 'pier') {
      this.camera.position.set(-5, this.groundHeight(-5, 7) + EYE_HEIGHT, 7);
      this.camera.lookAt(32, 5.8, 41);
    } else if (view === 'club') {
      this.camera.position.set(-48, (this.venues.groundHeight(-48, 32) ?? this.groundHeight(-48, 32)) + EYE_HEIGHT, 32);
      this.camera.lookAt(-48, 5, 49);
    } else if (view === 'house') {
      this.camera.position.set(68, (this.venues.groundHeight(68, 45) ?? this.groundHeight(68, 45)) + EYE_HEIGHT, 45);
      this.camera.lookAt(68, 5.5, 62);
    } else {
      this.camera.position.set(0, this.groundHeight(0, 18) + EYE_HEIGHT, 18);
      this.camera.lookAt(0, 10, -160);
    }
    this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.groundY = this.camera.position.y - EYE_HEIGHT;
    this.grounded = true;
    this.velocityY = 0;
    this.jumpHeld = false;
    this.jumpPeakHeight = 0;
    this.swimming = false;
    this.underwater = false;
    this.standingFromSwim = false;
    this.swimVelocity.set(0, 0, 0);
    this.localWaterHeight = this.effects.waterHeight(this.camera.position.x, this.camera.position.z, this.elapsed);
    this.localWaterDepth = Math.max(0, this.localWaterHeight - this.groundY);
    this.effects.setUnderwater(false);
    this.applyLighting();
    this.surface = this.venues.groundHeight(this.camera.position.x, this.camera.position.z) === null ? 'silver sand' : 'beach pavilion';
    this.moving = false;
    this.effects.update(this.camera, this.elapsed);
    this.refreshNearbyHotspot();
    this.interactionListener?.();
  }

  getEnvironment() { return this.effects.getEnvironment(); }

  setEnvironment(patch: Partial<ShoreEnvironmentState>) {
    const state = this.effects.setEnvironment(patch);
    this.applyLighting();
    try { localStorage.setItem('synthetic-shore-environment-v1', JSON.stringify(state)); } catch { /* Storage is optional. */ }
    return state;
  }

  private applyLighting() {
    const light = this.effects.getLighting();
    (this.scene.background as THREE.Color).set(light.background);
    const fog = this.scene.fog as THREE.FogExp2;
    fog.color.set(light.fogColor);
    fog.density = light.fogDensity;
    this.ambient.color.set(light.ambientColor);
    this.ambient.intensity = light.ambientIntensity;
    this.sunlight.color.set(light.sunColor);
    this.sunlight.intensity = light.sunIntensity;
    this.sunlight.position.fromArray(light.sunPosition);
  }

  setInteractionListener(listener: (() => void) | null) {
    this.interactionListener = listener;
    listener?.();
  }

  private refreshNearbyHotspot() {
    let nearest: string | null = null;
    let distance = Infinity;
    for (const hotspot of this.venues.hotspots) {
      const candidate = Math.hypot(hotspot.position.x - this.camera.position.x, hotspot.position.z - this.camera.position.z);
      if (candidate <= hotspot.radius && candidate < distance) { nearest = hotspot.id; distance = candidate; }
    }
    const active = this.venues.hotspots.find(h => h.id === this.activeHotspotId);
    const activeOutOfRange = !!active && Math.hypot(active.position.x - this.camera.position.x, active.position.z - this.camera.position.z) > active.radius;
    if (nearest !== this.nearbyHotspotId || activeOutOfRange) {
      this.nearbyHotspotId = nearest;
      if (activeOutOfRange) this.activeHotspotId = null;
      this.interactionListener?.();
    }
  }

  openNearbyInteraction(hotspotId?: string) {
    this.refreshNearbyHotspot();
    const picked = this.venues.hotspots.find(h => h.id === hotspotId);
    this.activeHotspotId = picked
      ? (Math.hypot(picked.position.x - this.camera.position.x, picked.position.z - this.camera.position.z) <= picked.radius ? picked.id : null)
      : this.nearbyHotspotId;
    if (this.activeHotspotId) this.releaseMouseLook();
    this.keys.clear();
    this.interactionMessage = this.activeHotspotId ? '' : 'Walk closer to the beach bar, DJ booth, or house.';
    this.interactionListener?.();
  }

  closeInteraction() {
    this.activeHotspotId = null;
    this.interactionListener?.();
    this.canvas.focus({ preventScroll: true });
  }

  getInteractionState() {
    return {
      nearby: this.venues.hotspots.find(h => h.id === this.nearbyHotspotId) ?? null,
      active: this.venues.hotspots.find(h => h.id === this.activeHotspotId) ?? null,
      message: this.interactionMessage,
      venues: this.venues.getSnapshot(),
      audio: this.audio.getSnapshot(),
    };
  }

  async performVenueAction(actionId: string) {
    const active = this.venues.hotspots.find(h => h.id === this.activeHotspotId);
    if (!active || !active.actions.some(action => action.id === actionId)) return;
    this.refreshNearbyHotspot();
    if (this.activeHotspotId !== active.id) return;
    const doorOpen = this.venues.getSnapshot().house.doorOpen;
    const inDoorway = Math.abs(this.camera.position.x - 68) < 2.6 && Math.abs(this.camera.position.z - 51) < 1;
    const byOpenDoor = Math.abs(this.camera.position.x - 65.95) < 0.8 && Math.abs(this.camera.position.z - 53.05) < 2.5;
    if (actionId === 'toggle-house-door' && (doorOpen ? inDoorway : byOpenDoor)) {
      this.interactionMessage = 'Step clear of the doorway before closing the door.';
      if (!doorOpen) this.interactionMessage = 'Step clear of the door before opening it.';
      this.interactionListener?.();
      return;
    }
    const result = this.venues.perform(actionId);
    this.interactionMessage = result.message;
    if (actionId === 'toggle-music') {
      try { await this.audio.setPlaying(!this.audio.getSnapshot().playing); }
      catch { this.interactionMessage = 'Music could not start. Press Play to try again.'; }
    }
    if (actionId === 'track-tidal' || actionId === 'track-orbital') this.audio.selectTrack(actionId === 'track-tidal' ? 'tidal' : 'orbital');
    if (!this.disposed) this.interactionListener?.();
  }

  setMusicVolume(volume: number) {
    this.audio.setVolume(volume);
    this.interactionListener?.();
  }

  setMusicTrack(track: 'tidal' | 'orbital') {
    this.audio.selectTrack(track);
    this.interactionListener?.();
  }

  getMovementState() {
    return {
      eyeHeightMetres: EYE_HEIGHT,
      configuredWalkSpeedKilometresPerHour: this.walkSpeedKilometresPerHour,
      turboEnabled: this.turboEnabled,
      speedKilometresPerHour: this.swimming ? Number((this.swimVelocity.length() * 3.6).toFixed(1)) : this.moving ? (this.turboEnabled ? worldUnitsToMetres(WALK_TURBO_SPEED) * 3.6 : this.walkSpeedKilometresPerHour) : 0,
      grounded: this.grounded,
      groundY: this.groundY,
      jumpState: this.swimming ? 'swimming' : this.grounded ? 'grounded' : this.velocityY > 0 ? 'rising' : 'falling',
      jumpHeld: this.jumpHeld,
      jumpHeightMetres: Number(this.jumpPeakHeight.toFixed(2)),
      jumpHeightRangeMetres: [WALK_JUMP_TAP_HEIGHT_METRES, WALK_JUMP_HOLD_HEIGHT_METRES],
      pointerLocked: document.pointerLockElement === this.canvas,
      lookMode: document.pointerLockElement === this.canvas ? 'pointer-lock' : this.pointerId !== null || this.dragLookFallback ? 'drag' : 'idle',
      swimming: this.getSwimmingState(),
    };
  }

  getSwimmingState() {
    const mode: SyntheticShoreSwimmingMode = this.swimming
      ? this.underwater ? 'underwater' : 'surface-swimming'
      : this.localWaterDepth > 0.08 && this.surface === 'silver sand' ? 'wading' : 'walking';
    return {
      mode,
      swimming: this.swimming,
      underwater: this.underwater,
      depthMetres: Number(Math.max(0, this.localWaterHeight - this.camera.position.y).toFixed(2)),
      waterDepthMetres: Number(this.localWaterDepth.toFixed(2)),
      waterHeightMetres: Number(this.localWaterHeight.toFixed(3)),
      floorHeightMetres: Number(this.groundY.toFixed(3)),
      floorClearanceMetres: Number((this.camera.position.y - this.groundY).toFixed(3)),
      buoyancy: this.swimming && this.underwater ? 'neutral' : this.swimming ? 'surface' : 'standing',
      controls: { dive: 'Ctrl / Q', ascend: 'Space / E', swimming: 'WASD / arrows; look to steer underwater' },
    };
  }

  setWalkSpeedKilometresPerHour(speed: number) {
    this.walkSpeedKilometresPerHour = THREE.MathUtils.clamp(Number.isFinite(speed) ? speed : 6.5, 0.5, 120);
    this.interactionListener?.();
  }

  setTurboEnabled(enabled: boolean) {
    this.turboEnabled = enabled;
    this.interactionListener?.();
  }

  requestMouseLook() {
    if (this.disposed || document.pointerLockElement === this.canvas || this.pointerLockPending) return;
    this.closeInteraction();
    this.canvas.focus({ preventScroll: true });
    this.pointerLockPending = true;
    try {
      if (!this.canvas.requestPointerLock) { this.onPointerLockError(); return; }
      const result = this.canvas.requestPointerLock() as Promise<void> | undefined;
      result?.then(() => { if (this.disposed && document.pointerLockElement === this.canvas) document.exitPointerLock(); }, () => this.onPointerLockError());
    } catch { this.onPointerLockError(); }
  }

  private releaseMouseLook() {
    this.dragLookFallback = false;
    this.fallbackPointerReady = false;
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }

  private releaseJump() {
    this.jumpHeld = false;
    if (!this.swimming && !this.grounded && this.velocityY > JUMP_TAP_SPEED) this.velocityY = JUMP_TAP_SPEED;
  }

  resize(width: number, height: number) {
    if (this.disposed || width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /** The vista's solid island hexagon; the surrounding ocean stays traversable. */
  private insideIslandWall(x: number, z: number) {
    const offsetX = Math.abs(x - 42);
    return offsetX < 450 * Math.sqrt(3) / 2 + 0.2
      && z > 110 + offsetX / Math.sqrt(3) - 0.15
      && z < 1010 - offsetX / Math.sqrt(3) + 0.15;
  }

  /** Continuous sand/seabed, with physical venue, stair, seawall and pier barriers. */
  private navigationHeight(x: number, z: number, from: THREE.Vector3): { y: number; surface: string } | null {
    const fromGround = from.y - EYE_HEIGHT;
    if (Math.abs(x - STAIR_X) < 2.38 && z >= STAIR_START - 0.4 && z <= STAIR_END) {
      const bottom = this.groundHeight(STAIR_X, STAIR_START);
      const y = THREE.MathUtils.lerp(bottom, PIER_Y, THREE.MathUtils.clamp((z - STAIR_START) / (STAIR_END - STAIR_START), 0, 1));
      if (Math.abs(y - fromGround) < 0.65) return { y, surface: 'pier stairs' };
    }
    const stem = Math.abs(x - PIER_X) < 4.03 && z >= -66 && z <= 122;
    const landing = x >= STAIR_X - 2.38 && x <= PIER_X && z >= STAIR_END && z < 61.7;
    const dx = x - PIER_X;
    const dz = z - ANCHOR_Z;
    const radius = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, -dz);
    const head = radius >= 20.3 && radius <= 27.7 && Math.abs(angle) <= Math.PI * 0.64;
    if ((stem || landing || head) && fromGround > PIER_Y - 0.65) return { y: PIER_Y, surface: 'anchor pier' };
    if (this.insideIslandWall(x, z)) return null;
    if (this.venues.blocksMovement(x, z)) return null;
    const venueGround = this.venues.groundHeight(x, z);
    const y = venueGround ?? this.groundHeight(x, z);
    // Railings prevent stepping off the deck, and stair sides prevent climbing
    // directly through the upper treads from the sand beneath them.
    if ((!this.swimming || venueGround !== null) && Math.abs(fromGround - y) > 0.7
      || Math.abs(x - STAIR_X) < 2.8 && z > STAIR_START + 1 && z < STAIR_END) return null;
    return { y, surface: venueGround === null ? 'silver sand' : 'beach pavilion' };
  }

  private moveHorizontally(dx: number, dz: number, swimming: boolean) {
    const subdivisions = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.16));
    for (let step = 0; step < subdivisions; step += 1) {
      this.navigationFrom.copy(this.camera.position);
      this.navigationFrom.y = this.groundY + EYE_HEIGHT;
      this.destination.copy(this.camera.position);
      this.destination.x += dx / subdivisions;
      this.destination.z += dz / subdivisions;
      let surface = this.navigationHeight(this.destination.x, this.destination.z, this.navigationFrom);
      if (!surface) {
        const nextZ = this.destination.z;
        this.destination.z = this.camera.position.z;
        surface = this.navigationHeight(this.destination.x, this.destination.z, this.navigationFrom);
        if (!surface) {
          this.destination.x = this.camera.position.x;
          this.destination.z = nextZ;
          surface = this.navigationHeight(this.destination.x, this.destination.z, this.navigationFrom);
        }
      }
      if (surface) {
        this.groundY = surface.y;
        this.camera.position.set(this.destination.x,
          !swimming && this.grounded ? surface.y + EYE_HEIGHT : this.camera.position.y, this.destination.z);
        this.surface = surface.surface;
      }
    }
  }

  /** MizuTopia's surface buoyancy and neutral underwater exploration, in metres. */
  private updateSwimming(dt: number, forward: number, sideways: number) {
    const wantsDive = this.keys.has('ControlLeft') || this.keys.has('ControlRight') || this.keys.has('KeyQ');
    const wantsAscend = this.keys.has('Space') || this.keys.has('KeyE');
    const vertical = Number(wantsAscend) - Number(wantsDive);
    const fast = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const baseSpeed = this.turboEnabled ? worldUnitsToMetres(WALK_TURBO_SPEED) : this.walkSpeedKilometresPerHour / 3.6;
    const speed = baseSpeed * (this.underwater ? 7.8 / 9.5 : 1) * (fast ? 1.8 : 1);
    this.camera.getWorldDirection(this.navigationDirection);
    if (!this.underwater) this.navigationDirection.y = 0;
    this.navigationDirection.normalize();
    this.navigationRight.crossVectors(this.navigationDirection, this.up).normalize();
    this.swimIntent.copy(this.navigationDirection).multiplyScalar(forward).addScaledVector(this.navigationRight, sideways);
    if (this.swimIntent.lengthSq() > 1) this.swimIntent.normalize();
    this.swimIntent.multiplyScalar(speed);
    this.swimIntent.y += vertical * (fast ? 9 : 5.8);
    const horizontalBlend = 1 - Math.exp(-dt * (forward || sideways ? 3.2 : 4.8));
    const verticalBlend = 1 - Math.exp(-dt * (vertical || Math.abs(this.swimIntent.y) > 0.05 ? 3.8 : 1.7));
    this.swimVelocity.x += (this.swimIntent.x - this.swimVelocity.x) * horizontalBlend;
    this.swimVelocity.z += (this.swimIntent.z - this.swimVelocity.z) * horizontalBlend;
    this.velocityY += (this.swimIntent.y - this.velocityY) * verticalBlend;
    if (wantsDive) {
      this.velocityY *= Math.exp(-dt * 0.3);
    } else if (this.underwater && this.camera.position.y < this.localWaterHeight - 0.08) {
      // Stop gently at the current depth after input ends, rather than forcing
      // a return to the surface every time the visitor releases Dive.
      if (!vertical && Math.abs(this.swimIntent.y) < 0.05) this.velocityY *= Math.exp(-dt * 3.5);
    } else if (this.camera.position.y > this.localWaterHeight + SWIM_EYE_ABOVE_WATER + 2.5) {
      this.velocityY -= GRAVITY * dt;
    } else {
      this.velocityY += (this.localWaterHeight + SWIM_EYE_ABOVE_WATER - this.camera.position.y) * 16 * dt;
      if (!vertical) this.velocityY *= Math.exp(-dt * 3.5);
    }
    this.moveHorizontally(this.swimVelocity.x * dt, this.swimVelocity.z * dt, true);
    this.localWaterHeight = this.effects.waterHeight(this.camera.position.x, this.camera.position.z, this.elapsed);
    this.localWaterDepth = Math.max(0, this.localWaterHeight - this.groundY);
    this.camera.position.y += this.velocityY * dt;
    if (this.camera.position.y < this.groundY + SWIM_FLOOR_CLEARANCE) {
      this.camera.position.y = this.groundY + SWIM_FLOOR_CLEARANCE;
      this.velocityY = Math.max(0, this.velocityY);
    }
    // Ordinary waves must never push a surface swimmer underwater. Diving is
    // an explicit action; once submerged, neutral buoyancy is maintained.
    if (!wantsDive && !this.underwater && this.camera.position.y < this.localWaterHeight + 0.4) {
      this.camera.position.y = this.localWaterHeight + 0.4;
      this.velocityY = Math.max(0, this.velocityY);
    }
    if (this.camera.position.y > this.localWaterHeight + SWIM_EYE_ABOVE_WATER && wantsAscend) {
      this.camera.position.y = this.localWaterHeight + SWIM_EYE_ABOVE_WATER;
      this.velocityY = Math.min(0, this.velocityY);
    }
    this.swimVelocity.y = this.velocityY;
    this.moving = !!(forward || sideways || vertical) || this.swimVelocity.lengthSq() > 0.01;
    if (this.localWaterDepth <= SWIM_EXIT_DEPTH || this.surface !== 'silver sand') {
      this.swimming = false;
      this.standingFromSwim = true;
      this.velocityY = 0;
      this.swimVelocity.set(0, 0, 0);
    }
  }

  update(delta: number, elapsed: number) {
    if (this.disposed || this.exiting) return;
    const dt = Math.min(Math.max(delta, 0), 0.05);
    this.elapsed = elapsed;
    const forward = Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
    const sideways = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
    this.moving = !!(forward || sideways);
    this.localWaterHeight = this.effects.waterHeight(this.camera.position.x, this.camera.position.z, elapsed);
    this.localWaterDepth = Math.max(0, this.localWaterHeight - this.groundY);
    if (!this.swimming && this.surface === 'silver sand' && this.localWaterDepth > SWIM_ENTRY_DEPTH) {
      this.swimming = true;
      this.grounded = false;
      this.standingFromSwim = false;
      this.jumpHeld = false;
      this.swimVelocity.set(0, 0, 0);
    }
    if (this.swimming) {
      this.updateSwimming(dt, forward, sideways);
    } else if (this.moving) {
      this.camera.getWorldDirection(this.navigationDirection);
      this.navigationDirection.y = 0;
      this.navigationDirection.normalize();
      this.navigationRight.crossVectors(this.navigationDirection, this.up).normalize();
      const speed = this.turboEnabled ? worldUnitsToMetres(WALK_TURBO_SPEED) : this.walkSpeedKilometresPerHour / 3.6;
      const distance = speed * dt / Math.max(1, Math.hypot(forward, sideways));
      this.moveHorizontally((this.navigationDirection.x * forward + this.navigationRight.x * sideways) * distance,
        (this.navigationDirection.z * forward + this.navigationRight.z * sideways) * distance, false);
      if (this.surface === 'anchor pier' && this.camera.position.z > 118) this.exit();
    }
    if (this.standingFromSwim) {
      const target = this.groundY + EYE_HEIGHT;
      this.camera.position.y += (target - this.camera.position.y) * (1 - Math.exp(-dt * 14));
      if (Math.abs(this.camera.position.y - target) < 0.025) {
        this.camera.position.y = target;
        this.grounded = true;
        this.standingFromSwim = false;
      }
    } else if (!this.grounded && !this.swimming) {
      this.velocityY -= GRAVITY * dt;
      this.camera.position.y += this.velocityY * dt;
      this.jumpPeakHeight = Math.max(this.jumpPeakHeight, this.camera.position.y - this.jumpStartY);
      if (this.camera.position.y <= this.groundY + EYE_HEIGHT) {
        this.camera.position.y = this.groundY + EYE_HEIGHT;
        this.velocityY = 0;
        this.grounded = true;
        this.jumpHeld = false;
      }
    }
    if (!this.disposed && !this.exiting) {
      this.localWaterHeight = this.effects.waterHeight(this.camera.position.x, this.camera.position.z, elapsed);
      this.localWaterDepth = Math.max(0, this.localWaterHeight - this.groundY);
      const submerged = this.underwater
        ? this.camera.position.y < this.localWaterHeight + 0.08
        : this.swimming && this.camera.position.y < this.localWaterHeight - 0.12;
      if (submerged !== this.underwater) {
        this.underwater = submerged;
        this.effects.setUnderwater(submerged);
        this.applyLighting();
        this.interactionListener?.();
      }
      this.effects.update(this.camera, elapsed);
      this.venues.update(elapsed, this.audio.getSnapshot().playing);
      this.refreshNearbyHotspot();
      this.effects.renderReflection(this.renderer, this.scene, this.camera, elapsed);
      this.movementHudElapsed += dt;
      if (this.movementHudElapsed >= 0.25) {
        this.movementHudElapsed = 0;
        this.interactionListener?.();
      }
    }
  }

  getSnapshot() {
    this.camera.getWorldDirection(this.direction);
    return {
      active: !this.disposed && !this.exiting,
      scene: 'synthetic-shore',
      view: this.view,
      position: this.camera.position.toArray(),
      direction: this.direction.toArray(),
      surface: this.surface,
      moving: this.moving,
      movement: this.getMovementState(),
      swimming: this.getSwimmingState(),
      coast: sampleBeachCoast(this.camera.position.x, this.camera.position.z),
      dragging: this.pointerId !== null,
      elapsed: this.elapsed,
      cygnusX1: this.effects.getCygnusState(),
      environment: this.effects.getEnvironment(),
      interactions: this.getInteractionState(),
      landmarks: { pier: [PIER_X, PIER_Y, ANCHOR_Z], stairs: [STAIR_X, STAIR_START, STAIR_END], island: [42, 16, 560], citySide: 'right', oceanSide: 'left', cygnusX1: true },
    };
  }

  private exit() {
    if (this.exiting || this.disposed) return;
    this.exiting = true;
    this.keys.clear();
    this.onExit();
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (this.disposed || event.button !== 0) return;
    if (document.pointerLockElement === this.canvas) {
      if (this.nearbyHotspotId) this.openNearbyInteraction();
      return;
    }
    this.pointerId = event.pointerId;
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
    this.pointerStartX = event.clientX;
    this.pointerStartY = event.clientY;
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.style.cursor = 'grabbing';
    this.canvas.focus({ preventScroll: true });
    event.preventDefault();
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (this.disposed || document.pointerLockElement === this.canvas || (this.pointerId !== event.pointerId && !this.dragLookFallback)) return;
    if (this.dragLookFallback && !this.fallbackPointerReady) {
      this.pointerX = event.clientX;
      this.pointerY = event.clientY;
      this.fallbackPointerReady = true;
      return;
    }
    this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.euler.y -= (event.clientX - this.pointerX) * 0.002;
    this.euler.x = THREE.MathUtils.clamp(this.euler.x - (event.clientY - this.pointerY) * 0.002, -1.42, 1.42);
    this.euler.z = 0;
    this.camera.quaternion.setFromEuler(this.euler);
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (this.pointerId !== event.pointerId) return;
    const clicked = event.type === 'pointerup' && Math.hypot(event.clientX - this.pointerStartX, event.clientY - this.pointerStartY) < 5;
    this.pointerId = null;
    this.canvas.style.cursor = 'grab';
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
    if (clicked) {
      const rect = this.canvas.getBoundingClientRect();
      this.pickPoint.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
      this.raycaster.setFromCamera(this.pickPoint, this.camera);
      const hit = this.raycaster.intersectObject(this.venues.group, true)[0];
      if (hit) {
        let object: THREE.Object3D | null = hit.object;
        while (object && !object.userData.beachHotspotId) object = object.parent;
        if (object) this.openNearbyInteraction(object.userData.beachHotspotId as string);
      }
      if (!this.activeHotspotId) this.requestMouseLook();
    }
  };

  private readonly onLockedMouseMove = (event: MouseEvent) => {
    if (this.disposed || document.pointerLockElement !== this.canvas) return;
    this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.euler.y -= event.movementX * 0.002;
    this.euler.x = THREE.MathUtils.clamp(this.euler.x - event.movementY * 0.002, -1.42, 1.42);
    this.camera.quaternion.setFromEuler(this.euler);
  };

  private readonly onPointerLockChange = () => {
    const locked = document.pointerLockElement === this.canvas;
    if (!locked && this.pointerWasLocked) { this.lastUnlockAt = performance.now(); this.onBlur(); }
    this.pointerWasLocked = locked;
    this.pointerLockPending = false;
    this.dragLookFallback = false;
    if (this.disposed) { if (locked) document.exitPointerLock(); return; }
    this.interactionListener?.();
  };

  private readonly onPointerLockError = (event?: Event) => {
    if (this.disposed) return;
    event?.stopImmediatePropagation();
    if (!this.pointerLockPending) return;
    this.pointerLockPending = false;
    this.dragLookFallback = true;
    this.fallbackPointerReady = false;
    this.interactionListener?.();
  };

  private readonly onContextMenu = (event: Event) => event.preventDefault();

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (this.disposed || event.metaKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
    if (event.code === 'Escape') {
      event.preventDefault();
      if (document.pointerLockElement === this.canvas || this.dragLookFallback) { this.releaseMouseLook(); this.onBlur(); return; }
      if (performance.now() - this.lastUnlockAt < 180) return;
      if (this.activeHotspotId) { this.closeInteraction(); return; }
      this.exit(); return;
    }
    if (event.code === 'KeyE' && this.swimming && !this.nearbyHotspotId) {
      this.keys.add(event.code); event.preventDefault(); return;
    }
    if (event.code === 'KeyE' && this.surface === 'anchor pier' && this.camera.position.z > 91) { this.exit(); return; }
    if (event.code === 'KeyE' && !event.repeat) { event.preventDefault(); this.openNearbyInteraction(); return; }
    if (event.code === 'Space') {
      event.preventDefault();
      this.keys.add(event.code);
      if (this.swimming) return;
      if (!event.repeat && this.grounded) {
        this.jumpHeld = true;
        this.grounded = false;
        this.velocityY = JUMP_SPEED;
        this.jumpStartY = this.camera.position.y;
        this.jumpPeakHeight = 0;
      }
      return;
    }
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyQ', 'ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
      this.keys.add(event.code);
      event.preventDefault();
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent) => { this.keys.delete(event.code); if (event.code === 'Space') this.releaseJump(); };
  private readonly onBlur = () => { this.keys.clear(); this.moving = false; this.releaseJump(); };
  private readonly onVisibilityChange = () => { if (document.hidden) this.onBlur(); };

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.releaseMouseLook();
    this.interactionListener = null;
    this.audio.dispose();
    this.venues.dispose();
    this.keys.clear();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('lostpointercapture', this.onPointerUp);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    this.canvas.removeEventListener('blur', this.onBlur);
    document.removeEventListener('mousemove', this.onLockedMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('pointerlockerror', this.onPointerLockError, true);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    if (this.pointerId !== null && this.canvas.hasPointerCapture(this.pointerId)) this.canvas.releasePointerCapture(this.pointerId);
    this.pointerId = null;
    this.canvas.style.touchAction = this.previousTouchAction;
    this.canvas.style.cursor = this.previousCursor;
    this.canvas.tabIndex = this.previousTabIndex;
    this.effects.group.removeFromParent();
    this.effects.dispose();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    this.scene.traverse(object => {
      const renderable = object as THREE.Mesh;
      if (renderable.geometry) geometries.add(renderable.geometry);
      if (renderable.material) {
        for (const material of Array.isArray(renderable.material) ? renderable.material : [renderable.material]) materials.add(material);
      }
      if (object instanceof THREE.InstancedMesh) object.dispose();
    });
    for (const material of materials) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      material.dispose();
    }
    for (const geometry of geometries) geometry.dispose();
    for (const texture of textures) texture.dispose();
    this.scene.clear();
  }
}
