import * as THREE from 'three';

/** Fingerprint rendered geometry and transforms, rather than trusting room labels. */
export function fingerprintScene(root: THREE.Object3D) {
  let geometryHash = 2166136261 >>> 0;
  let appearanceHash = 2166136261 >>> 0;
  let meshes = 0, vertices = 0, instances = 0;
  const mix = (hash: number, value: number) => Math.imul(hash ^ Math.round(value * 10000), 16777619) >>> 0;
  root.updateWorldMatrix(true, true);
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    meshes++;
    const position = object.geometry.getAttribute('position');
    if (position) {
      vertices += position.count;
      geometryHash = mix(geometryHash, position.count);
      for (let i = 0; i < position.count; i++) {
        geometryHash = mix(geometryHash, position.getX(i));
        geometryHash = mix(geometryHash, position.getY(i));
        geometryHash = mix(geometryHash, position.getZ(i));
      }
    }
    object.matrixWorld.elements.forEach(value => { geometryHash = mix(geometryHash, value); });
    if (object instanceof THREE.InstancedMesh) {
      instances += object.count;
      for (let i = 0; i < object.count * 16; i++) geometryHash = mix(geometryHash, object.instanceMatrix.array[i]);
    }
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if ('color' in material && material.color instanceof THREE.Color) {
        for (const value of material.color.toArray()) appearanceHash = mix(appearanceHash, value);
      }
    }
  });
  return { geometry: geometryHash.toString(16).padStart(8, '0'), appearance: appearanceHash.toString(16).padStart(8, '0'), meshes, vertices, instances };
}
