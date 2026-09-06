import * as THREE from 'three';
import { createSyntheticShoreEffects } from './syntheticShoreEffects';

export type SyntheticShoreView = 'ocean' | 'island' | 'pier';

const EYE_HEIGHT = 1.7;
const PIER_X = 42;
const PIER_Y = 8;
const STAIR_X = 30.5;
const STAIR_START = 28;
const STAIR_END = 58;
const ANCHOR_Z = -39;
const ANCHOR_RADIUS = 24;
const TAU = Math.PI * 2;

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
  private readonly keys = new Set<string>();
  private readonly navigationDirection = new THREE.Vector3();
  private readonly navigationRight = new THREE.Vector3();
  private readonly destination = new THREE.Vector3();
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
  private readonly onExit: () => void;

  constructor(renderer: THREE.WebGLRenderer, onExit: () => void) {
    this.onExit = onExit;
    this.renderer = renderer;
    this.canvas = renderer.domElement;
    this.previousTouchAction = this.canvas.style.touchAction;
    this.previousCursor = this.canvas.style.cursor;
    this.previousTabIndex = this.canvas.tabIndex;
    this.canvas.style.touchAction = 'none';
    this.canvas.style.cursor = 'grab';
    this.canvas.tabIndex = 0;
    this.scene.name = 'Synthetic shore / Alpine oceanfront';
    this.scene.background = new THREE.Color('#80b9d1');
    this.scene.fog = new THREE.FogExp2('#83adbf', 0.00022);
    this.scene.add(new THREE.HemisphereLight('#e6f9ff', '#516c77', 2.25));
    const sunlight = new THREE.DirectionalLight('#fff8e9', 2.4);
    sunlight.position.set(-200, 400, -260);
    this.scene.add(sunlight);
    this.effects = createSyntheticShoreEffects();
    this.scene.add(this.effects.group);
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
    // Keep the full island far enough behind the beach that the Alpine dome,
    // five other biospheres and core read as a campus panorama at eye level.
    const centerZ = 850;
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
    const shieldMaterial = new THREE.MeshPhysicalMaterial({ color: '#bfdce0', transparent: true, opacity: 0.24, roughness: 0.3, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
    const shield = meshAt(group, new THREE.SphereGeometry(220, 24, 12, 0, TAU, 0, Math.PI / 2), shieldMaterial, 0, 16, centerZ + 90, 'Central atmospheric shield');
    shield.scale.y = 0.87;
    // The eastern transit bridge remains at the side of the view.
    batch.add(pale, 560, 20, centerZ + 65, 380, 2.3, 9, -0.35);
    for (let i = 0; i < 10; i += 1) batch.add(ink, 410 + i * 32, 9, centerZ + 10 + i * 11.7, 3, 24, 3);
    batch.finish(group, 'Instanced island vista');
    this.makeSign(group, 'ALPINE BIOSPHERE', 'LAB ISLAND / RESEARCH CAMPUS', 0, 35, centerZ - 406, 17, true);
    group.scale.x = 1.3;
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
      const y = this.groundHeight(x, z);
      batch.add(titanium, x, y + 0.46, z, 3.7, 0.16, 1.05);
      batch.add(dark, x, y + 0.55, z, 3.3, 0.07, 0.8);
      for (const side of [-1, 1]) batch.add(titanium, x + side * 1.4, y + 0.22, z, 0.16, 0.44, 0.7);
      batch.add(cyan, x, y + 0.42, z - 0.53, 3.3, 0.04, 0.03);
    }
    for (let i = 0; i < 16; i += 1) {
      const x = -83 + i * 11;
      const z = 65 + Math.sin(i * 0.7) * 4;
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
    if (view === 'island') {
      this.camera.position.set(-4, this.groundHeight(-4, 12) + EYE_HEIGHT, 12);
      this.camera.lookAt(0, 58, 850);
    } else if (view === 'pier') {
      this.camera.position.set(-5, this.groundHeight(-5, 7) + EYE_HEIGHT, 7);
      this.camera.lookAt(32, 5.8, 41);
    } else {
      this.camera.position.set(0, this.groundHeight(0, 18) + EYE_HEIGHT, 18);
      this.camera.lookAt(0, 10, -160);
    }
    this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.surface = 'silver sand';
    this.moving = false;
    this.effects.update(this.camera, this.elapsed);
  }

  resize(width: number, height: number) {
    if (this.disposed || width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /** Return null for water/rail edges; walkable deck height is continuous on stairs. */
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
    if (x < -94 || x > 94 || z < 0.8 || z > 84) return null;
    const y = this.groundHeight(x, z);
    // Railings prevent stepping off the deck, and stair sides prevent climbing
    // directly through the upper treads from the sand beneath them.
    if (fromGround > y + 0.7 || (Math.abs(x - STAIR_X) < 2.8 && z > STAIR_START + 1 && z < STAIR_END)) return null;
    return { y, surface: 'silver sand' };
  }

  update(delta: number, elapsed: number) {
    if (this.disposed || this.exiting) return;
    const dt = Math.min(Math.max(delta, 0), 0.05);
    this.elapsed = elapsed;
    const leftLook = this.keys.has('KeyQ') ? 1 : 0;
    const rightLook = this.keys.has('KeyE') ? 1 : 0;
    if (leftLook || rightLook) {
      this.euler.y += (leftLook - rightLook) * dt * 1.25;
      this.camera.quaternion.setFromEuler(this.euler);
    }
    const forward = Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
    const sideways = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
    this.moving = !!(forward || sideways);
    if (this.moving) {
      this.camera.getWorldDirection(this.navigationDirection);
      this.navigationDirection.y = 0;
      this.navigationDirection.normalize();
      this.navigationRight.crossVectors(this.navigationDirection, this.up).normalize();
      const speed = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 5.5 : 2.1;
      const distance = speed * dt / Math.max(1, Math.hypot(forward, sideways));
      this.destination.copy(this.camera.position).addScaledVector(this.navigationDirection, forward * distance).addScaledVector(this.navigationRight, sideways * distance);
      let surface = this.navigationHeight(this.destination.x, this.destination.z, this.camera.position);
      if (!surface) {
        // Sliding along a railing/beach bound remains responsive at an angle.
        const nextZ = this.destination.z;
        this.destination.z = this.camera.position.z;
        surface = this.navigationHeight(this.destination.x, this.destination.z, this.camera.position);
        if (!surface) {
          this.destination.x = this.camera.position.x;
          this.destination.z = nextZ;
          surface = this.navigationHeight(this.destination.x, this.destination.z, this.camera.position);
        }
      }
      if (surface) {
        this.camera.position.set(this.destination.x, surface.y + EYE_HEIGHT, this.destination.z);
        this.surface = surface.surface;
      }
      if (this.surface === 'anchor pier' && this.camera.position.z > 118) this.exit();
    }
    if (!this.disposed && !this.exiting) {
      this.effects.update(this.camera, elapsed);
      this.effects.renderReflection(this.renderer, this.scene, this.camera, elapsed);
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
      dragging: this.pointerId !== null,
      elapsed: this.elapsed,
      cygnusX1: this.effects.getCygnusState(),
      landmarks: { pier: [PIER_X, PIER_Y, ANCHOR_Z], stairs: [STAIR_X, STAIR_START, STAIR_END], island: [0, 16, 850], citySide: 'right', oceanSide: 'left', cygnusX1: true },
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
    this.pointerId = event.pointerId;
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.style.cursor = 'grabbing';
    this.canvas.focus({ preventScroll: true });
    event.preventDefault();
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (this.pointerId !== event.pointerId || this.disposed) return;
    this.euler.y -= (event.clientX - this.pointerX) * 0.0026;
    this.euler.x = THREE.MathUtils.clamp(this.euler.x - (event.clientY - this.pointerY) * 0.0026, -1.25, 1.25);
    this.euler.z = 0;
    this.camera.quaternion.setFromEuler(this.euler);
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (this.pointerId !== event.pointerId) return;
    this.pointerId = null;
    this.canvas.style.cursor = 'grab';
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
  };

  private readonly onContextMenu = (event: Event) => event.preventDefault();

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (this.disposed || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
    if (event.code === 'Escape') { event.preventDefault(); this.exit(); return; }
    if (event.code === 'KeyE' && this.surface === 'anchor pier' && this.camera.position.z > 91) { this.exit(); return; }
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
      this.keys.add(event.code);
      event.preventDefault();
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent) => this.keys.delete(event.code);
  private readonly onBlur = () => { this.keys.clear(); this.moving = false; };

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.keys.clear();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('lostpointercapture', this.onPointerUp);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
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
