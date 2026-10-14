import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const REFERENCE_LIBRARY_URL = '/apartments/assets/liminette-ivory-library.glb';
export const REFERENCE_LIBRARY_PLACEMENT = { position: [-10.91, 0, -4.8] as const, rotationY: Math.PI / 2 };

function release(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); });
    }
  });
  geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose());
  textures.forEach(item => {
    if (typeof ImageBitmap !== 'undefined' && item.source.data instanceof ImageBitmap) item.source.data.close();
    item.dispose();
  });
  root.clear();
}

/** Replacement library corner; the original room remains the structural shell. */
export function createReferenceLibrary() {
  const group = new THREE.Group(); group.name = 'Liminette ivory reference library';
  group.position.set(...REFERENCE_LIBRARY_PLACEMENT.position); group.rotation.y = REFERENCE_LIBRARY_PLACEMENT.rotationY; group.updateMatrix();
  const metadata = {
    id: 'liminette-ivory-library', assetUrl: REFERENCE_LIBRARY_URL, authoring: 'Blender 5.1',
    state: 'loading' as 'loading' | 'loaded' | 'failed' | 'disposed',
    position: [...REFERENCE_LIBRARY_PLACEMENT.position], rotationY: REFERENCE_LIBRARY_PLACEMENT.rotationY,
    features: [] as string[], meshes: 0, triangles: 0, bounds: null as null | { min: number[]; max: number[] },
    resourcesReleased: false, sofaLobes: 6, realWindowApertures: 1,
    sofa: null as null | { dimensions: number[]; localCenter: number[]; viewingDistance: number; screenHorizontalAngleDegrees: number },
    blanket: null as null | { width: number; drapedLength: number; thickness: number; raisedCablePairs: number },
    windowFinish: 'walnut and brass', ceilingFinish: 'ivory',
  };
  group.userData.referenceLibrary = metadata;
  let disposed = false;
  const ready = new GLTFLoader().loadAsync(REFERENCE_LIBRARY_URL).then(gltf => {
    if (disposed) { release(gltf.scene); metadata.resourcesReleased = true; return; }
    const root = gltf.scene.getObjectByName('LIBRARY__Liminette');
    if (!root?.userData.layout_json) { release(gltf.scene); throw new Error('Missing library layout metadata'); }
    const layout = JSON.parse(root.userData.layout_json); metadata.features = layout.features;
    metadata.realWindowApertures = layout.realWindowApertures;
    metadata.sofa = layout.sofa; metadata.blanket = layout.blanket;
    gltf.scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = object.receiveShadow = true; metadata.meshes++;
      metadata.triangles += (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3;
      for (const mat of Array.isArray(object.material) ? object.material : [object.material]) {
        Object.values(mat).forEach(value => { if (value instanceof THREE.Texture) value.anisotropy = 4; });
        // Opal lamps and valve filaments emit light without casting opaque shadows.
        if (mat.name.includes('diffuser') || mat.name.includes('filament') || mat.name.startsWith('Clear library window')) object.castShadow = false;
      }
    });
    group.add(gltf.scene); group.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(group); metadata.bounds = { min: box.min.toArray(), max: box.max.toArray() }; metadata.state = 'loaded';
  }).catch(cause => {
    if (disposed) return;
    metadata.state = 'failed'; throw new Error(`Unable to load Liminette ivory library: ${REFERENCE_LIBRARY_URL}`, { cause });
  });
  // Separate footprints leave both sofa approaches and the gap to the fireplace open.
  const colliders = [
    [-2.73, .25, 2.12, .57, 4.95], [2.65, .25, 1.89, .57, 4.95],
    [-2.28, .88, .81, .85, 3.68], [0, .25, 3.12, .80, 4.01],
    [0, 4.85, 4.66, 2.22, 1.32], [4.0, 2.21, .42, 4.5, 5.2], [2.97, .90, .9, .65, .88],
    [-3.46, 3.04, 1.46, .80, 1.41], [3.35, 4.02, .66, .60, .90],
  ].map(([x,z,w,d,h]) => new THREE.Box3(new THREE.Vector3(x-w/2,0,z-d/2),new THREE.Vector3(x+w/2,h,z+d/2)).applyMatrix4(group.matrix));
  return { group, metadata, colliders, ready, dispose() {
    if (disposed) return; disposed = true; metadata.state = 'disposed'; release(group); group.removeFromParent(); metadata.resourcesReleased = true;
  } };
}
