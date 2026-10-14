import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { LiminetteRoom } from './liminetteRoom';
import { fingerprintScene } from './sceneAudit';

export const COMMUNITY_ROOM_ID = 'lux-umbrarum-community-room';
export const COMMUNITY_ROOM_URL = '/apartments/assets/lux-umbrarum-community-room.glb';
type Rectangle = { shape?: 'rectangle'; minX: number; maxX: number; minZ: number; maxZ: number };
type Ellipse = { shape: 'ellipse' | 'elliptical-sector'; center: [number, number]; radii: [number, number];
  inner?: number; outer?: number; startAngle?: number; endAngle?: number };
type FloorRegion = (Rectangle | Ellipse) & { height: number };
type WalkingRegion = Rectangle | { shape: 'polygon'; points: [number, number][] };
type Layout = {
  id: string; dimensions: number[]; bounds: LiminetteRoom['bounds']; pit: FloorRegion;
  stairs: FloorRegion[]; colliders: { min: [number, number, number]; max: [number, number, number] }[]; features: string[];
  walkable: WalkingRegion[];
};

function onFloor(region: FloorRegion, x: number, z: number): boolean {
  if ('minX' in region) {
    return x >= region.minX && x <= region.maxX && z >= region.minZ && z <= region.maxZ;
  }
  const u = (x - region.center[0]) / region.radii[0];
  const v = -(z - region.center[1]) / region.radii[1];
  const radius = Math.hypot(u, v);
  if (region.shape === 'ellipse') return radius <= 1;
  const angle = (Math.atan2(v, u) * 180 / Math.PI + 360) % 360;
  return radius >= region.inner! && radius <= region.outer! && angle >= region.startAngle! && angle <= region.endAngle!;
}

function inside(region: WalkingRegion, x: number, z: number): boolean {
  if (region.shape !== 'polygon') return x >= region.minX && x <= region.maxX && z >= region.minZ && z <= region.maxZ;
  let included = false;
  for (let i = 0, j = region.points.length - 1; i < region.points.length; j = i++) {
    const [xi, zi] = region.points[i]; const [xj, zj] = region.points[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) included = !included;
  }
  return included;
}

/** Standalone Blender-authored common room; all materials travel inside its GLB. */
export function createCommunityRoom(): LiminetteRoom {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#cbd5d0');
  scene.fog = new THREE.Fog('#d7d7c9', 100, 350);
  scene.add(new THREE.HemisphereLight('#fff6df', '#8a7455', .8));
  scene.add(new THREE.AmbientLight('#fff2d8', .3));
  const daylight = new THREE.DirectionalLight('#fff0d4', 3.5);
  daylight.position.set(-3, 8, -12); daylight.target.position.set(0, 0, 1);
  daylight.castShadow = true;
  daylight.shadow.mapSize.set(2048, 2048);
  Object.assign(daylight.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: .1, far: 35 });
  daylight.shadow.bias = -.00015; daylight.shadow.normalBias = .025;
  scene.add(daylight, daylight.target);
  // Warm bounce and the actual lamp positions keep the pit softly illuminated.
  const fill = new THREE.PointLight('#fff1d3', 14, 17, 2); fill.position.set(0, 2.8, 1.3); scene.add(fill);
  for (const [x, y, z] of [[-6.0, 1.16, -2.3], [-2.0, 1.12, -4.2], [4.91, 1.6, -4.1]]) {
    const light = new THREE.PointLight('#ffdb9d', 4.5, 4, 2); light.position.set(x, y, z); scene.add(light);
  }
  const metadata = {
    id: COMMUNITY_ROOM_ID, assetUrl: COMMUNITY_ROOM_URL, authoring: 'Blender 5.1',
    state: 'loading' as 'loading' | 'loaded' | 'failed' | 'disposed',
    dimensions: [14.2, 12.6, 4.15], pitDepth: .54, features: [] as string[],
    meshes: 0, triangles: 0, resourcesReleased: false,
  };
  scene.userData.apartment = {
    communityRoom: metadata, floorArea: 178.92,
    location: { residence: 'Lux Umbrarum', district: 'Academic District', space: 'Community room' },
    design: { palette: 'Warm ivory, honey oak and champagne brass', reference: 'User-supplied community lounge image' },
    outlook: { type: 'Three-dimensional lake, mountains and Gothic collegiate skyline' },
  };
  const bounds = { minX: -6.75, maxX: 6.75, minZ: -4.88, maxZ: 6.88 };
  const colliders: THREE.Box3[] = [];
  let layout: Layout | undefined;
  let disposed = false;
  let imported: THREE.Object3D | undefined;
  function release(root: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    const bitmaps = new Set<ImageBitmap>();
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
        Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); });
      }
    });
    geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose());
    textures.forEach(texture => {
      if (typeof ImageBitmap !== 'undefined' && texture.source.data instanceof ImageBitmap) bitmaps.add(texture.source.data);
      texture.dispose();
    });
    bitmaps.forEach(bitmap => bitmap.close()); root.clear(); metadata.resourcesReleased = true;
  }
  const ready = new GLTFLoader().loadAsync(COMMUNITY_ROOM_URL).then(gltf => {
    if (disposed) { release(gltf.scene); return; }
    imported = gltf.scene;
    const root = gltf.scene.getObjectByName('COMMONS__Lux_Umbrarum');
    layout = JSON.parse(root?.userData.layout_json ?? 'null') as Layout;
    if (!layout || layout.id !== COMMUNITY_ROOM_ID || !Array.isArray(layout.colliders) || !Array.isArray(layout.stairs) || !Array.isArray(layout.walkable)) {
      throw new Error('Community room asset has no valid walking layout.');
    }
    Object.assign(bounds, layout.bounds);
    colliders.push(...layout.colliders.map(box => new THREE.Box3(new THREE.Vector3(...box.min), new THREE.Vector3(...box.max))));
    metadata.features = layout.features;
    gltf.scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = object.name.includes('__interior__'); object.receiveShadow = true;
      metadata.meshes++;
      metadata.triangles += (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        Object.values(material).forEach(value => { if (value instanceof THREE.Texture) value.anisotropy = 8; });
      }
    });
    scene.add(gltf.scene);
    const interior = gltf.scene.getObjectByName('COMMONS__interior');
    const exterior = gltf.scene.getObjectByName('COMMONS__exterior');
    if (!interior || !exterior) throw new Error('Community room is missing its interior or outlook.');
    scene.userData.apartment.audit = { interior: fingerprintScene(interior), exterior: fingerprintScene(exterior) };
    metadata.state = 'loaded';
  }).catch(cause => {
    if (disposed) return;
    metadata.state = 'failed';
    throw new Error(`Unable to load Lux Umbrarum community room: ${COMMUNITY_ROOM_URL}`, { cause });
  });
  const view = (id: string, label: string, p: [number, number, number], target: [number, number, number]) =>
    ({ id, label, position: new THREE.Vector3(...p), target: new THREE.Vector3(...target) });
  return {
    scene, bounds, colliders, ready, fieldOfView: 53,
    spawn: new THREE.Vector3(0, 1.65, 7.8), lookAt: new THREE.Vector3(0, -.4, -4.5),
    viewpoints: [
      view('entrance', 'Conversation pit', [0, 1.65, 7.8], [0, -.4, -4.5]),
      view('music', 'Music & constellation wall', [-5.4, 1.65, -1.7], [-4.25, 2.05, -3.56]),
      view('library', 'Community library', [5.5, 1.65, -1.5], [5.43, 1.8, -3.62]),
      view('outlook', 'Circular window', [0, 1.65, -3.1], [.9, 1.85, -15]),
      view('reading', 'Reading corner', [3.15, 1.65, -2.6], [4.42, .85, -3.45]),
      view('chandeliers', 'Crystal chandeliers', [0, 1.11, 0], [.5, 3.2, -2]),
      view('gallery', 'Terrace & lounge', [-5.95, 1.65, -1.1], [0, .05, 1.6]),
      view('stairs', 'Curved terrace stairs', [-1.45, 1.11, .02], [-1.1, -.15, -1.85]),
      view('west-exit', 'West dormitory corridor', [-6, 1.65, -.95], [-9.45, 1.65, -.95]),
      view('east-exit', 'East dormitory corridor', [6, 1.65, -.95], [9.45, 1.65, -.95]),
    ],
    floorHeight(x, z) {
      if (!layout) return 0;
      const step = layout.stairs.find(region => onFloor(region, x, z));
      return step ? step.height : onFloor(layout.pit, x, z) ? layout.pit.height : 0;
    },
    canWalk(x, z, radius) {
      if (!layout) return false;
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        if (!layout.walkable.some(region => inside(region, x + Math.cos(angle) * radius, z + Math.sin(angle) * radius))) return false;
      }
      return true;
    },
    update() {},
    dispose() {
      if (disposed) return;
      disposed = true; metadata.state = 'disposed';
      if (imported) release(imported);
      metadata.resourcesReleased = true;
      scene.traverse(object => { if (object instanceof THREE.Light) object.dispose(); });
      scene.clear(); colliders.length = 0;
    },
  };
}
