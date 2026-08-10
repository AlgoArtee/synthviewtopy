import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

interface GlobalSourceRecord {
  source: THREE.Mesh;
  originalParent: THREE.Object3D;
  originalIndex: number;
  originalVisible: boolean;
  worldMatrix: THREE.Matrix4;
}

export interface GlobalEnvironmentBatchingStats {
  batchCount: number;
  sourceCount: number;
  triangleCount: number;
  estimatedGeometryBytes: number;
}

export interface GlobalEnvironmentBatchingHandle {
  authorityRoot: THREE.Group;
  batches: readonly THREE.Mesh[];
  stats: GlobalEnvironmentBatchingStats;
  owns(object: THREE.Object3D): boolean;
  mountSources(): () => void;
  dispose(): void;
}

interface Candidate {
  source: THREE.Mesh;
  owner: THREE.Object3D;
  material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial | THREE.MeshBasicMaterial;
}

const MAX_MERGED_SOURCES = 1_024;
const MAX_MERGED_VERTICES = 1_000_000;
const MAX_MERGED_INDICES = 3_000_000;

function parentChainVisible(object: THREE.Object3D, stop: THREE.Object3D) {
  let cursor: THREE.Object3D | null = object;
  while (cursor) {
    if (!cursor.visible) return false;
    if (cursor === stop) return true;
    cursor = cursor.parent;
  }
  return false;
}

function animationOwner(object: THREE.Object3D, stop: THREE.Object3D) {
  let cursor: THREE.Object3D | null = object.parent;
  while (cursor && cursor !== stop) {
    if (typeof cursor.userData.animate === 'string') return cursor;
    cursor = cursor.parent;
  }
  return stop;
}

function attributeSignature(geometry: THREE.BufferGeometry) {
  return Object.entries(geometry.attributes)
    .map(([name, attribute]) => `${name}:${attribute.itemSize}:${Number(attribute.normalized)}:${attribute.array.constructor.name}`)
    .sort()
    .join(',');
}

function scalarTier(value: number) {
  return Math.round(value * 4) / 4;
}

function materialSignature(material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial | THREE.MeshBasicMaterial) {
  const physical = material as THREE.MeshPhysicalMaterial;
  return [
    material.type,
    // Base color and the standard PBR scalar channels are baked into vertex
    // attributes. They intentionally do not fragment otherwise-compatible
    // static global submission groups.
    scalarTier(material.opacity),
    material.transparent,
    scalarTier(Number(physical.transmission ?? 0)),
    material.alphaHash,
    material.side,
    material.depthTest,
    material.depthWrite,
    material.blending,
    material.alphaTest,
    Boolean((material as THREE.MeshStandardMaterial).flatShading ?? false),
    material.wireframe,
    material.vertexColors,
    scalarTier(Number(physical.clearcoat ?? 0)),
    scalarTier(Number(physical.clearcoatRoughness ?? 0)),
    scalarTier(Number(physical.ior ?? 1.5)),
  ].join('|');
}

function hasTexture(material: THREE.Material) {
  const candidate = material as THREE.Material & Record<string, unknown>;
  return ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'aoMap', 'lightMap']
    .some((key) => candidate[key] instanceof THREE.Texture);
}

function nearestSelectableId(object: THREE.Object3D, stop: THREE.Object3D) {
  let cursor: THREE.Object3D | null = object;
  while (cursor) {
    const id = cursor.userData.individualSelectableId ?? cursor.userData.selectableId;
    if (typeof id === 'string') return id;
    if (cursor === stop) break;
    cursor = cursor.parent;
  }
  return '';
}

function geometryBytes(geometry: THREE.BufferGeometry) {
  let bytes = geometry.index?.array.byteLength ?? 0;
  Object.values(geometry.attributes).forEach((attribute) => { bytes += attribute.array.byteLength; });
  return bytes;
}

function bakeMaterialColor(
  geometry: THREE.BufferGeometry,
  material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial | THREE.MeshBasicMaterial,
) {
  const position = geometry.getAttribute('position');
  const existing = geometry.getAttribute('color');
  const colors = new Float32Array(position.count * 3);
  for (let index = 0; index < position.count; index += 1) {
    const offset = index * 3;
    colors[offset] = material.color.r * (existing ? existing.getX(index) : 1);
    colors[offset + 1] = material.color.g * (existing ? existing.getY(index) : 1);
    colors[offset + 2] = material.color.b * (existing ? existing.getZ(index) : 1);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

function bakeStandardMaterialParameters(
  geometry: THREE.BufferGeometry,
  material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial,
) {
  const position = geometry.getAttribute('position');
  const emissive = material.emissive.clone().multiplyScalar(material.emissiveIntensity);
  const emissives = new Float32Array(position.count * 3);
  const roughness = new Float32Array(position.count);
  const metalness = new Float32Array(position.count);
  for (let index = 0; index < position.count; index += 1) {
    const offset = index * 3;
    emissives[offset] = emissive.r;
    emissives[offset + 1] = emissive.g;
    emissives[offset + 2] = emissive.b;
    roughness[index] = material.roughness;
    metalness[index] = material.metalness;
  }
  geometry.setAttribute('batchEmissive', new THREE.BufferAttribute(emissives, 3));
  geometry.setAttribute('batchRoughness', new THREE.BufferAttribute(roughness, 1));
  geometry.setAttribute('batchMetalness', new THREE.BufferAttribute(metalness, 1));
}

function applyBakedStandardMaterialParameters(
  material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial,
) {
  material.emissive.set(0x000000);
  material.emissiveIntensity = 1;
  material.roughness = 1;
  material.metalness = 0;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = [
      'attribute vec3 batchEmissive;',
      'attribute float batchRoughness;',
      'attribute float batchMetalness;',
      'varying vec3 vBatchEmissive;',
      'varying float vBatchRoughness;',
      'varying float vBatchMetalness;',
      shader.vertexShader,
    ].join('\n').replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n vBatchEmissive = batchEmissive;\n vBatchRoughness = batchRoughness;\n vBatchMetalness = batchMetalness;',
    );
    shader.fragmentShader = [
      'varying vec3 vBatchEmissive;',
      'varying float vBatchRoughness;',
      'varying float vBatchMetalness;',
      shader.fragmentShader,
    ].join('\n')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = vBatchRoughness;')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n metalnessFactor = vBatchMetalness;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vBatchEmissive;');
  };
  material.customProgramCacheKey = () => 'global-environment-baked-pbr-v1';
}

/**
 * Batches the static/global island shell and transit collections while moving
 * exact authored leaves into a detached collision/export authority root.
 */
export function batchGlobalEnvironmentGeometry(scopes: readonly THREE.Group[]): GlobalEnvironmentBatchingHandle {
  scopes.forEach((scope) => scope.updateWorldMatrix(true, true));
  const scopeSet = new Set<THREE.Object3D>(scopes);
  const groups = new Map<string, Candidate[]>();
  scopes.forEach((scope) => {
    scope.traverse((object) => {
      if (!(object instanceof THREE.Mesh)
        || object instanceof THREE.InstancedMesh
        || object instanceof THREE.BatchedMesh
        || object instanceof THREE.SkinnedMesh
        || object.children.length > 0
        || !parentChainVisible(object, scope)
        || Array.isArray(object.material)
        || !(
          object.material instanceof THREE.MeshStandardMaterial
          || object.material instanceof THREE.MeshPhysicalMaterial
          || object.material instanceof THREE.MeshBasicMaterial
        )
        || hasTexture(object.material)
        || object.morphTargetInfluences
        || object.customDepthMaterial
        || object.customDistanceMaterial
        || object.userData.exportFallback === true
        || object.userData.editorOnly === true
        || object.userData.authoredInteriorComponent === true
        || object.userData.gpuRuntimeBatch === true
        || object.userData.gpuBatchSource === true) return;
      const owner = animationOwner(object, scope);
      const key = [
        owner.uuid,
        materialSignature(object.material),
        Number(object.userData.smoothTransparencyBatch === true),
        attributeSignature(object.geometry),
        Number(object.castShadow),
        object.renderOrder,
        object.layers.mask,
      ].join('|');
      const candidates = groups.get(key) ?? [];
      candidates.push({ source: object, owner, material: object.material });
      groups.set(key, candidates);
    });
  });

  const authorityRoot = new THREE.Group();
  authorityRoot.name = 'DETACHED__GLOBAL_ENVIRONMENT_AUTHORITY';
  authorityRoot.visible = true;
  authorityRoot.matrixAutoUpdate = false;
  authorityRoot.matrix.identity();
  authorityRoot.matrixWorld.identity();
  authorityRoot.userData.packageOwnedAuthorityRoot = true;
  authorityRoot.userData.globalEnvironmentAuthority = true;
  authorityRoot.userData.exportExcluded = true;
  const sourceRecords: GlobalSourceRecord[] = [];
  const batches: THREE.Mesh[] = [];
  let triangleCount = 0;
  let estimatedGeometryBytes = 0;

  groups.forEach((candidates) => {
    if (candidates.length < 2) return;
    let segment: Candidate[] = [];
    let vertices = 0;
    let indices = 0;
    const flush = () => {
      if (segment.length < 2) {
        segment = [];
        vertices = 0;
        indices = 0;
        return;
      }
      const owner = segment[0].owner;
      owner.updateWorldMatrix(true, false);
      const ownerInverse = owner.matrixWorld.clone().invert();
      const transformed = segment.map(({ source, material }) => {
        source.updateWorldMatrix(true, false);
        const local = new THREE.Matrix4().multiplyMatrices(ownerInverse, source.matrixWorld);
        const authoredClone = source.geometry.clone().applyMatrix4(local);
        // Static runtime copies use one non-indexed layout so compatible
        // indexed and non-indexed authoring primitives can share a draw. The
        // exact indexed originals stay detached for collision/edit/export.
        const geometry = authoredClone.index ? authoredClone.toNonIndexed() : authoredClone;
        if (geometry !== authoredClone) authoredClone.dispose();
        // A few legacy custom geometries expose an undefined index instead of
        // BufferGeometry's normal null sentinel. Normalize the sentinel so the
        // merge utility does not misclassify an otherwise non-indexed buffer.
        geometry.setIndex(null);
        bakeMaterialColor(geometry, material);
        if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
          bakeStandardMaterialParameters(geometry, material);
        }
        return geometry;
      });
      const merged = mergeGeometries(transformed, false);
      transformed.forEach((geometry) => geometry.dispose());
      if (!merged) {
        segment = [];
        vertices = 0;
        indices = 0;
        return;
      }
      merged.computeBoundingBox();
      merged.computeBoundingSphere();
      const material = segment[0].material.clone();
      const smoothTransparencyBatch = segment.every(({ source }) => source.userData.smoothTransparencyBatch === true);
      material.color.set(0xffffff);
      if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
        applyBakedStandardMaterialParameters(material);
      }
      material.vertexColors = true;
      const physical = material as THREE.MeshPhysicalMaterial;
      if (material.transparent || material.opacity < 1 || Number(physical.transmission ?? 0) > 0) {
        physical.transmission = 0;
        if (smoothTransparencyBatch) {
          material.transparent = true;
          material.alphaHash = false;
          material.depthWrite = false;
        } else {
          material.transparent = false;
          material.alphaHash = true;
          material.depthWrite = true;
          material.opacity = THREE.MathUtils.clamp(material.opacity, 0.34, 0.92);
        }
      }
      material.needsUpdate = true;
      const batch = new THREE.Mesh(merged, material);
      batch.name = `${owner.name || 'GLOBAL'}__GPU_ENVIRONMENT_BATCH_${batches.length + 1}`;
      batch.castShadow = segment.some(({ source }) => source.castShadow);
      batch.receiveShadow = segment.some(({ source }) => source.receiveShadow);
      batch.renderOrder = segment[0].source.renderOrder;
      batch.layers.mask = segment[0].source.layers.mask;
      batch.userData.gpuRuntimeBatch = true;
      batch.userData.globalEnvironmentBatch = true;
      batch.userData.smoothTransparencyBatch = smoothTransparencyBatch;
      batch.userData.exportExcluded = true;
      batch.userData.batchSourceNames = segment.map(({ source }) => source.name);
      batch.userData.batchSelectableIds = segment.map(({ source }) => nearestSelectableId(source, owner));
      batch.userData.batchSemanticIds = segment.map(({ source }) => String(source.userData.semanticId ?? source.name));
      const triangleRanges: Array<{ start: number; end: number; selectableId: string; semanticId: string; sourceName: string }> = [];
      let triangleOffset = 0;
      segment.forEach(({ source }) => {
        const triangles = Math.floor((source.geometry.index?.count ?? source.geometry.getAttribute('position')?.count ?? 0) / 3);
        const selectableId = nearestSelectableId(source, owner);
        triangleRanges.push({
          start: triangleOffset,
          end: triangleOffset + triangles,
          selectableId,
          semanticId: String(source.userData.semanticId ?? source.name),
          sourceName: source.name,
        });
        triangleOffset += triangles;
      });
      batch.userData.batchTriangleRanges = triangleRanges;
      batch.userData.batchedTriangleCount = triangleOffset;
      batch.userData.exportSemanticMetadata = true;
      owner.add(batch);
      batches.push(batch);
      triangleCount += triangleOffset;
      estimatedGeometryBytes += geometryBytes(merged);
      segment.forEach(({ source }) => {
        source.updateWorldMatrix(true, false);
        sourceRecords.push({
          source,
          originalParent: source.parent!,
          originalIndex: source.parent!.children.indexOf(source),
          originalVisible: source.visible,
          worldMatrix: source.matrixWorld.clone(),
        });
      });
      segment = [];
      vertices = 0;
      indices = 0;
    };
    candidates.forEach((candidate) => {
      const positionCount = candidate.source.geometry.getAttribute('position')?.count ?? 0;
      const nextVertices = candidate.source.geometry.index?.count ?? positionCount;
      const nextIndices = candidate.source.geometry.index?.count ?? nextVertices;
      if (segment.length > 0 && (
        segment.length >= MAX_MERGED_SOURCES
        || vertices + nextVertices > MAX_MERGED_VERTICES
        || indices + nextIndices > MAX_MERGED_INDICES
      )) flush();
      segment.push(candidate);
      vertices += nextVertices;
      indices += nextIndices;
    });
    flush();
  });

  // Each source is adopted by at most one group. Capture the exact world
  // matrix before detaching so WALK collision remains independent of rendering.
  sourceRecords.forEach((record) => {
    authorityRoot.add(record.source);
    record.source.visible = false;
    record.source.userData.gpuBatchSource = true;
    record.source.userData.globalEnvironmentSource = true;
    record.source.matrixWorldAutoUpdate = false;
    record.source.matrixWorld.copy(record.worldMatrix);
    record.source.matrixWorldNeedsUpdate = false;
  });

  let mountDepth = 0;
  const mountSources = () => {
    mountDepth += 1;
    if (mountDepth === 1) {
      batches.forEach((batch) => { batch.visible = false; });
      const byParent = new Map<THREE.Object3D, GlobalSourceRecord[]>();
      sourceRecords.forEach((record) => {
        const entries = byParent.get(record.originalParent) ?? [];
        entries.push(record);
        byParent.set(record.originalParent, entries);
      });
      byParent.forEach((records, parent) => {
        records.sort((left, right) => left.originalIndex - right.originalIndex).forEach((record) => {
          parent.add(record.source);
          const current = parent.children.indexOf(record.source);
          if (current >= 0) parent.children.splice(current, 1);
          parent.children.splice(THREE.MathUtils.clamp(record.originalIndex, 0, parent.children.length), 0, record.source);
          record.source.visible = record.originalVisible;
          record.source.matrixWorldAutoUpdate = true;
          record.source.updateWorldMatrix(true, false);
        });
      });
    }
    let restored = false;
    return () => {
      if (restored) return;
      restored = true;
      mountDepth = Math.max(0, mountDepth - 1);
      if (mountDepth !== 0) return;
      sourceRecords.forEach((record) => {
        record.source.updateWorldMatrix(true, false);
        record.worldMatrix.copy(record.source.matrixWorld);
        authorityRoot.add(record.source);
        record.source.visible = false;
        record.source.matrixWorldAutoUpdate = false;
        record.source.matrixWorld.copy(record.worldMatrix);
        record.source.matrixWorldNeedsUpdate = false;
      });
      batches.forEach((batch) => { batch.visible = true; });
    };
  };

  return {
    authorityRoot,
    batches,
    stats: {
      batchCount: batches.length,
      sourceCount: sourceRecords.length,
      triangleCount,
      estimatedGeometryBytes,
    },
    owns: (object) => {
      let cursor: THREE.Object3D | null = object;
      while (cursor) {
        if (scopeSet.has(cursor)) return true;
        cursor = cursor.parent;
      }
      return false;
    },
    mountSources,
    dispose: () => {
      const restore = mountSources();
      restore();
      batches.forEach((batch) => {
        batch.removeFromParent();
        batch.geometry.dispose();
        const materials = Array.isArray(batch.material) ? batch.material : [batch.material];
        materials.forEach((material) => material.dispose());
      });
    },
  };
}
