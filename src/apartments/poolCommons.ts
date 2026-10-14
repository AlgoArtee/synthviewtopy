import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { LiminetteRoom } from './liminetteRoom';
import { fingerprintScene } from './sceneAudit';
import { createPoolNavigation, type PoolNavigationLayout } from './poolNavigation';
import { createPoolSplash } from './poolSplash';

export const POOL_COMMONS_ID = 'lux-umbrarum-pool-commons';
export const POOL_COMMONS_URL = '/apartments/assets/lux-umbrarum-pool-commons.glb';
type Rectangle = { minX: number; maxX: number; minZ: number; maxZ: number };
type Seating = { kind: string; position: number[]; forward: number[]; target: number[];
  length?: number; width?: number; suspension?: string };
type Instrument = { id: string; position: string; label: string; unit: string; source: string;
  min?: number; max?: number; value?: number | string; display?: string };
type Layout = PoolNavigationLayout & { id: string; dimensions: number[]; bounds: Rectangle; walkable: Rectangle[];
  pool: Rectangle & { depth: number; waterLevel: number }; features: string[];
  seating: Seating[];
  ceilingArches: number; instruments: Instrument[];
  colliders: { min: [number, number, number]; max: [number, number, number] }[] };

/** A separate, fully authored shared pool hall with an unobstructed deck route. */
export function createPoolCommons(): LiminetteRoom {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d5dfda');
  scene.fog = new THREE.Fog('#dce0d3', 18, 100);
  scene.add(new THREE.HemisphereLight('#fff8e8', '#9b8e76', 1.05));
  scene.add(new THREE.AmbientLight('#fff5df', .24));
  const sun = new THREE.DirectionalLight('#fff0ce', 4.2);
  sun.position.set(-8, 8, -10); sun.target.position.set(0, 0, 2);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 12, bottom: -12, near: .1, far: 40 });
  sun.shadow.bias = -.00012; sun.shadow.normalBias = .022;
  scene.add(sun, sun.target);
  const bounce = new THREE.PointLight('#fff6e5', 24, 22, 2); bounce.position.set(0, 5.7, 0); scene.add(bounce);
  const metadata = { id: POOL_COMMONS_ID, assetUrl: POOL_COMMONS_URL, authoring: 'Blender 5.1',
    state: 'loading' as 'loading' | 'loaded' | 'failed' | 'disposed', dimensions: [21.6, 16.6, 6.4], seating: [] as Seating[],
    poolDepth: 1.6, waterLevel: -.19, waterTime: 0, features: [] as string[],
    ceilingArches: 0, instruments: [] as Instrument[], clockTimeZone: '',
    meshes: 0, triangles: 0, resourcesReleased: false };
  scene.userData.apartment = {
    communityRoom: metadata, floorArea: 358.56,
    location: { residence: 'Lux Umbrarum', district: 'Academic District', space: 'Pool commons' },
    design: { palette: 'Ivory porcelain, natural canvas, aged brass, platinum and aquamarine', reference: 'User-supplied classical indoor pool image, expanded with suspended helix pods',
      materials: 'Embedded Blender-baked porcelain, linen, plaster, oak and aged brass; copper, pearl enamel, platinum and rippling water' },
    outlook: { type: 'Three-dimensional collegiate courtyard with olive trees' },
  };
  const bounds = { minX: -10.7, maxX: 10.7, minZ: -6.82, maxZ: 12.08 };
  const colliders: THREE.Box3[] = [];
  let layout: Layout | undefined, imported: THREE.Object3D | undefined;
  let waterMesh: THREE.Mesh | undefined;
  const clockHands = new Map<string, THREE.Object3D>();
  function updateClock() {
    const now = new Date(), second = now.getSeconds(), minute = now.getMinutes() + second / 60, hour = now.getHours() % 12 + minute / 60;
    for (const [id, angle] of [['hour', hour / 12 * Math.PI * 2], ['minute', minute / 60 * Math.PI * 2], ['second', second / 60 * Math.PI * 2]] as const) {
      const hand = clockHands.get(id);
      if (hand) hand.rotation.x = angle - hand.userData.rest_angle;
    }
    const clock = metadata.instruments.find(instrument => instrument.id === 'time');
    if (clock) clock.value = [now.getHours(), now.getMinutes(), second].map(value => String(value).padStart(2, '0')).join(':');
  }
  let disposed = false;
  const splashes = createPoolSplash(scene);
  const airFog = scene.fog;
  const navigation = createPoolNavigation(() => layout, colliders,
    (x, z, impact) => splashes.trigger(x, z, impact),
    underwater => { scene.fog = underwater ? new THREE.Fog('#4597ac', .15, 10) : airFog; },
    dt => { splashes.update(dt); scene.userData.apartment.splashes = splashes.snapshot(); });
  function release(root: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>(), bitmaps = new Set<ImageBitmap>();
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
        Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); });
      }
    });
    geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose());
    textures.forEach(value => {
      if (typeof ImageBitmap !== 'undefined' && value.source.data instanceof ImageBitmap) bitmaps.add(value.source.data);
      value.dispose();
    });
    bitmaps.forEach(value => value.close()); root.clear(); metadata.resourcesReleased = true;
  }
  const ready = new GLTFLoader().loadAsync(POOL_COMMONS_URL).then(gltf => {
    if (disposed) { release(gltf.scene); return; }
    imported = gltf.scene;
    layout = JSON.parse(gltf.scene.getObjectByName('POOL__Lux_Umbrarum')?.userData.layout_json ?? 'null') as Layout;
    if (!layout || layout.id !== POOL_COMMONS_ID || !Array.isArray(layout.colliders) || !Array.isArray(layout.walkable) || !layout.pool) throw new Error('Pool asset has no valid deck layout.');
    Object.assign(bounds, layout.bounds);
    // The first exported collider was the decorative pool exclusion volume.
    // Navigation now supplies the basin walls and swimming constraints.
    colliders.push(...layout.colliders.slice(1).map(box => new THREE.Box3(new THREE.Vector3(...box.min), new THREE.Vector3(...box.max))));
    metadata.features = layout.features; metadata.dimensions = layout.dimensions; metadata.seating = layout.seating;
    metadata.ceilingArches = layout.ceilingArches; metadata.instruments = layout.instruments;
    metadata.clockTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    for (const id of ['hour', 'minute', 'second']) {
      const hand = gltf.scene.getObjectByName(`POOL__clock_${id}_hand`);
      if (!hand || !Number.isFinite(hand.userData.rest_angle)) throw new Error(`Pool clock is missing its ${id} hand.`);
      clockHands.set(id, hand);
    }
    gltf.scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      object.castShadow = object.name.includes('__interior__'); object.receiveShadow = true;
      metadata.meshes++; metadata.triangles += (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3;
      for (const material of materials) {
        Object.values(material).forEach(value => { if (value instanceof THREE.Texture) value.anisotropy = 8; });
        if (material.name.startsWith('POOL WATER')) {
          waterMesh = object; object.castShadow = false; object.receiveShadow = false;
          if (material instanceof THREE.MeshPhysicalMaterial) {
            material.transmission = .50; material.thickness = .55; material.ior = 1.333;
            material.roughness = .07; material.envMapIntensity = 1.2;
            material.side = THREE.DoubleSide;
          }
          // Exclude water from contact AO while retaining its lighting/reflections.
          object.layers.set(1);
        }
        if (material.name.startsWith('Clear window glass')) object.castShadow = false;
      }
    });
    const interior = gltf.scene.getObjectByName('POOL__interior'), exterior = gltf.scene.getObjectByName('POOL__exterior');
    if (!interior || !exterior || !waterMesh) throw new Error('Pool asset is missing its architecture, garden or water.');
    scene.userData.apartment.audit = { interior: fingerprintScene(interior), exterior: fingerprintScene(exterior) };
    scene.add(gltf.scene); metadata.state = 'loaded'; updateClock();
  }).catch(cause => {
    if (disposed) return;
    metadata.state = 'failed';
    throw new Error(`Unable to load Lux Umbrarum pool commons: ${POOL_COMMONS_URL}`, { cause });
  });
  const view = (id: string, label: string, p: [number, number, number], target: [number, number, number]) =>
    ({ id, label, position: new THREE.Vector3(...p), target: new THREE.Vector3(...target) });
  return {
    scene, bounds, colliders, ready, fieldOfView: 53, navigation, floorHeight: navigation.floorHeight,
    spawn: new THREE.Vector3(-4.3, 1.65, 8.0), lookAt: new THREE.Vector3(.9, 1.3, -2.1),
    viewpoints: [
      view('entrance', 'Pool & sunlit hall', [-4.3, 1.65, 8.0], [.9, 1.3, -2.1]),
      view('water', 'Aquamarine pool', [0, 1.65, 5.15], [0, -.15, 0]),
      view('instruments', 'Time, pressure & air composition', [8.65, 1.65, .05], [10.45, 3.85, -2.95]),
      view('machine', 'Brass diving platform', [6.40, 1.65, 5.12], [7.10, 1.55, 2.45]),
      view('board-access', 'Diving board steps', [6.34, 1.65, 4.85], [6.34, 1.50, 2.45]),
      view('pods', 'Suspended helix pods', [0, 1.65, 5.15], [7.90, 3.00, 7.10]),
      view('windows', 'Arched garden windows', [-3.25, 1.65, -4.40], [-3.40, 3.9, -7]),
      view('reading', 'Poolside reading', [-6.35, 1.65, 4.90], [-7.20, .6, 1.0]),
      view('library', 'Library & marble bust', [4.20, 1.65, -4.30], [10.25, 2.5, -5.95]),
      view('ceiling', 'Coffered ceiling', [0, 1.65, 5.15], [0, 6.2, -.5]),
      view('hallway', 'Dormitory corridor', [-5.5, 1.65, 8.70], [-5.5, 1.65, 12.2]),
    ],
    canWalk(x, z, radius) {
      if (!layout) return false;
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4, px = x + Math.cos(angle) * radius, pz = z + Math.sin(angle) * radius;
        if (!layout.walkable.some(region => px >= region.minX && px <= region.maxX && pz >= region.minZ && pz <= region.maxZ)) return false;
      }
      return true;
    },
    update(time) {
      if (disposed || !waterMesh) return;
      updateClock();
      metadata.waterTime = +time.toFixed(3);
      const position = waterMesh.geometry.getAttribute('position'), normal = waterMesh.geometry.getAttribute('normal');
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i), z = position.getZ(i), a = x * 8 - z * 6 + time * .7, b = x * 11 + z * 9 - time * .55;
        position.setY(i, -.19 + .007 * Math.sin(a) + .004 * Math.sin(b));
        const dx = .056 * Math.cos(a) + .044 * Math.cos(b), dz = -.042 * Math.cos(a) + .036 * Math.cos(b);
        const length = Math.hypot(dx, 1, dz); normal.setXYZ(i, -dx / length, 1 / length, -dz / length);
      }
      position.needsUpdate = true; normal.needsUpdate = true;
    },
    dispose() {
      if (disposed) return;
      disposed = true; metadata.state = 'disposed';
      splashes.dispose();
      if (imported) release(imported);
      clockHands.clear();
      waterMesh = undefined; metadata.resourcesReleased = true;
      scene.traverse(object => { if (object instanceof THREE.Light) object.dispose(); });
      scene.clear(); colliders.length = 0;
    },
  };
}
