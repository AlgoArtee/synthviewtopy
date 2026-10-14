import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const REFERENCE_DESK_URL = '/apartments/assets/liminette-astronomy-desk.glb';

/** Room coordinates are metres, Y up; the exported Blender asset faces +Z. */
export const REFERENCE_DESK_PLACEMENT = Object.freeze({
  // Align the console's north end with the writing desk's front edge.
  position: [3.175, 0, -4.75] as const,
  // Put the back against the east partition; the seated viewer faces +X.
  rotationY: -Math.PI / 2,
  viewpoint: [.475, 1.65, -4.15] as const,
  target: [3.175, 1.05, -4.75] as const,
});

function releaseObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value);
      }
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  textures.forEach(texture => {
    // GLTFLoader decodes embedded maps to ImageBitmaps when supported.
    if (typeof ImageBitmap !== 'undefined' && texture.source.data instanceof ImageBitmap) {
      texture.source.data.close();
    }
    texture.dispose();
  });
  root.clear();
}

export function createReferenceAstronomyDesk() {
  const group = new THREE.Group();
  group.name = 'Liminette reference astronomy desk';
  group.position.set(...REFERENCE_DESK_PLACEMENT.position);
  group.rotation.y = REFERENCE_DESK_PLACEMENT.rotationY;
  group.updateMatrix();
  const metadata = {
    id: 'liminette-reference-astronomy-desk',
    assetUrl: REFERENCE_DESK_URL,
    authoring: 'Blender 5.1',
    state: 'loading' as 'loading' | 'loaded' | 'failed' | 'disposed',
    facing: '-X',
    seatedFacing: '+X',
    rotationY: REFERENCE_DESK_PLACEMENT.rotationY,
    position: [...REFERENCE_DESK_PLACEMENT.position],
    dimensions: { width: 3.5, depth: 1.5, desktopHeight: .85 },
    features: ['sloped orbital console', 'cabinet return', 'CRT terminal', 'keyboard', 'armillary sphere', 'globe', 'books', 'stool'],
    bounds: null as null | { min: number[]; max: number[] },
    meshes: 0,
    triangles: 0,
    resourcesReleased: false,
  };
  group.userData.referenceDesk = metadata;
  let disposed = false;

  const ready = new GLTFLoader().loadAsync(REFERENCE_DESK_URL).then(gltf => {
    if (disposed) {
      releaseObject(gltf.scene);
      metadata.resourcesReleased = true;
      return;
    }
    gltf.scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      metadata.meshes++;
      metadata.triangles += (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) value.anisotropy = 4;
        }
      }
    });
    group.add(gltf.scene);
    group.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(group);
    metadata.bounds = { min: bounds.min.toArray(), max: bounds.max.toArray() };
    metadata.state = 'loaded';
  }).catch(cause => {
    if (disposed) return;
    metadata.state = 'failed';
    throw new Error(`Unable to load Liminette astronomy desk: ${REFERENCE_DESK_URL}`, { cause });
  });

  // Compound collision preserves the knee opening instead of filling the L shape.
  const colliders = [
    new THREE.Box3(new THREE.Vector3(-1.75, 0, -.75), new THREE.Vector3(-1.17, .85, .3)),
    new THREE.Box3(new THREE.Vector3(-1.17, 0, -.75), new THREE.Vector3(.45, 1.4, -.635)),
    new THREE.Box3(new THREE.Vector3(-1.17, .79, -.635), new THREE.Vector3(.45, 1.4, .3)),
    new THREE.Box3(new THREE.Vector3(.45, 0, -.75), new THREE.Vector3(1.75, .85, .75)),
    new THREE.Box3(new THREE.Vector3(-.9, 0, .525), new THREE.Vector3(-.4, .6, 1.025)),
  ].map(box => box.applyMatrix4(group.matrix));

  return {
    group, metadata, colliders, ready,
    dispose() {
      if (disposed) return;
      disposed = true;
      metadata.state = 'disposed';
      releaseObject(group);
      metadata.resourcesReleased = true;
    },
  };
}
