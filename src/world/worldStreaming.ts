import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BiomeDefinition, DistrictDefinition } from '../data/districts';
import { ISLAND_SURFACE_Y } from '../config/island';

export type StreamedWorldDefinition = DistrictDefinition | BiomeDefinition;
export type StreamedPackageKind = 'district' | 'biome';
export type StreamingViewMode = 'explore' | 'plan' | 'edit' | 'walk';
export type StreamingLoadState = 'unloaded' | 'loading' | 'loaded' | 'error';
export type StreamingVisualLevel = 'detail' | 'mid' | 'far';
export type StreamingDetailPolicy = 'streamed' | 'full-island';
export type GpuBatchingBackend = 'batched-mesh-multi-draw' | 'instanced-merge-fallback';

export interface StreamingUpdateContext {
  cameraPosition: THREE.Vector3;
  cameraDirection?: THREE.Vector3;
  mode: StreamingViewMode;
  selectedPackageId: string | null;
  interiorPackageId: string | null;
  elapsedSeconds?: number;
  force?: boolean;
}

export interface StreamingPackageSnapshot {
  id: string;
  kind: StreamedPackageKind;
  loadState: StreamingLoadState;
  visualLevel: StreamingVisualLevel;
  detailResident: boolean;
  proxyVisible: boolean;
  midVisible: boolean;
  farVisible: boolean;
  pinned: boolean;
  distanceMetres: number;
  estimatedCost: {
    drawCalls: number;
    triangles: number;
    animationNodes: number;
  };
  error?: string;
}

export interface StreamingSnapshot {
  authority: 'web-sandbox';
  strategy: string;
  detailPolicy: StreamingDetailPolicy;
  fullIslandDetailRequested: boolean;
  fullIslandDetailReady: boolean;
  fullIslandDetailProgress: { loaded: number; total: number; percent: number };
  totalPackages: number;
  cacheCapacity: number;
  effectiveCacheCapacity: number;
  loadedPackageCount: number;
  loadedPackages: string[];
  activeDetailLimit: number;
  residentDetailPackages: string[];
  residentPackageCount: number;
  proxyPackageCount: number;
  midPackageCount: number;
  farPackageCount: number;
  gpuBatching: {
    backend: GpuBatchingBackend;
    multiDrawSupported: boolean;
    batchCount: number;
    batchedSourceCount: number;
    retainedSourceCount: number;
    estimatedGeometryBytes: number;
    estimatedTextureBytes: number;
  };
  packages: StreamingPackageSnapshot[];
}

interface StreamingPackage {
  id: string;
  kind: StreamedPackageKind;
  detailEnvelope: THREE.Group;
  detailRoot: THREE.Group;
  midProxy: THREE.Object3D;
  farProxy: THREE.Object3D;
  anchor: THREE.Vector3;
  detailAnchorObjects: THREE.Object3D[];
  loadState: StreamingLoadState;
  visualLevel: StreamingVisualLevel;
  desiredLevel: StreamingVisualLevel;
  detailResident: boolean;
  pinned: boolean;
  distanceMetres: number;
  lastLevelChangeSeconds: number;
  lastUsedSequence: number;
  estimatedCost: StreamingPackageSnapshot['estimatedCost'];
  loadGeneration: number;
  batching: PackageBatchingStats;
  error?: string;
}

interface PackageBatchingStats {
  backend: GpuBatchingBackend;
  batchCount: number;
  batchedSourceCount: number;
  retainedSourceCount: number;
  estimatedGeometryBytes: number;
  estimatedTextureBytes: number;
}

const GPU_PULSE_PROFILES = new Set([
  'medical-emissive-pulse',
  'pharmacology-emissive-pulse',
  'microbiology-emissive-pulse',
  'microbiology-network-signal',
  'molecular-info-pulse',
  'bioanalytics-emissive-pulse',
  'forensic-emissive-pulse',
  'genomics-emissive-pulse',
  'biochemistry-emissive-pulse',
  'organic-chemistry-emissive-pulse',
  'inorganic-chemistry-emissive-pulse',
]);

interface ProductionVisibilityState {
  detailResident: boolean;
  detailEnvelopeVisible: boolean;
  midVisible: boolean;
  farVisible: boolean;
  visualLevel: StreamingVisualLevel;
  loadState: StreamingLoadState;
}

const proxyBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
const proxyBiomeGeometry = new THREE.SphereGeometry(0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.52);
const instanceMatrix = new THREE.Matrix4();
const instancePosition = new THREE.Vector3();
const instanceScale = new THREE.Vector3();
const instanceQuaternion = new THREE.Quaternion();

function textureByteEstimate(texture: THREE.Texture | null | undefined) {
  if (!texture) return 0;
  const image = texture.image as { width?: number; height?: number } | undefined;
  const width = Number(image?.width ?? 0);
  const height = Number(image?.height ?? 0);
  return width > 0 && height > 0 ? Math.round(width * height * 4 * 1.33) : 0;
}

function geometryByteEstimate(geometry: THREE.BufferGeometry) {
  let bytes = geometry.index ? geometry.index.count * geometry.index.array.BYTES_PER_ELEMENT : 0;
  Object.values(geometry.attributes).forEach((attribute) => {
    bytes += attribute.count * attribute.itemSize * attribute.array.BYTES_PER_ELEMENT;
  });
  return bytes;
}

function geometryLayoutSignature(geometry: THREE.BufferGeometry) {
  const attributes = Object.entries(geometry.attributes)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, attribute]) => `${name}:${attribute.itemSize}:${attribute.normalized}:${attribute.array.constructor.name}`)
    .join(',');
  return `${geometry.index ? geometry.index.array.constructor.name : 'non-indexed'}|${attributes}`;
}

function materialBatchSignature(material: THREE.Material) {
  const candidate = material as THREE.Material & Record<string, unknown>;
  const color = candidate.color instanceof THREE.Color ? candidate.color.getHexString() : '';
  const emissive = candidate.emissive instanceof THREE.Color ? candidate.emissive.getHexString() : '';
  const textureKeys = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'aoMap', 'lightMap'] as const;
  const textures = textureKeys.map((key) => {
    const texture = candidate[key];
    return texture instanceof THREE.Texture ? texture.uuid : '';
  }).join(',');
  return [
    material.type,
    color,
    emissive,
    Number(candidate.emissiveIntensity ?? 0),
    Number(candidate.roughness ?? 0),
    Number(candidate.metalness ?? 0),
    material.opacity,
    Number(material.transparent),
    material.side,
    Number(material.depthTest),
    Number(material.depthWrite),
    material.blending,
    material.alphaTest,
    Number(material.vertexColors),
    material.customProgramCacheKey(),
    textures,
  ].join('|');
}

function getBatchOwner(mesh: THREE.Mesh, root: THREE.Group) {
  let cursor: THREE.Object3D | null = mesh.parent;
  while (cursor && cursor !== root) {
    if (
      cursor.userData.exteriorProgram === true
      || cursor.userData.academicFacility === true
      || typeof cursor.userData.individualSelectableId === 'string'
    ) return cursor;
    cursor = cursor.parent;
  }
  return root;
}

function resolveSourceSelectableId(mesh: THREE.Mesh, owner: THREE.Object3D, root: THREE.Group) {
  return String(
    owner.userData.individualSelectableId
      ?? owner.userData.selectableId
      ?? mesh.userData.individualSelectableId
      ?? mesh.userData.selectableId
      ?? root.userData.selectableId
      ?? '',
  );
}

function hasAnimatedAncestor(mesh: THREE.Mesh, root: THREE.Group) {
  let cursor: THREE.Object3D | null = mesh;
  while (cursor) {
    if (typeof cursor.userData.animate === 'string') return true;
    if (cursor === root) break;
    cursor = cursor.parent;
  }
  return false;
}

function configureGpuPulseAnimations(root: THREE.Group) {
  root.traverse((object) => {
    const profile = String(object.userData.animate ?? '');
    if (!GPU_PULSE_PROFILES.has(profile) || !(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
    if (!(object.material instanceof THREE.MeshStandardMaterial)) return;
    const material = object.material;
    const timeUniform = { value: 0 };
    const speed = Math.max(0.004, Number(object.userData.speed ?? 0.02));
    const phase = Number(object.userData.phase ?? 0);
    material.userData.gpuPulseTimeUniform = timeUniform;
    material.userData.gpuAnimationProfile = profile;
    material.userData.gpuPulseSpeed = speed;
    material.userData.gpuPulsePhase = phase;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uGpuDetailTime = timeUniform;
      shader.fragmentShader = `uniform float uGpuDetailTime;\n${shader.fragmentShader}`.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float gpuPulseWave = max(0.0, sin(uGpuDetailTime * ${(speed * Math.PI * 2).toFixed(6)} + ${phase.toFixed(6)}));
        totalEmissiveRadiance *= mix(0.38, 1.72, gpuPulseWave * gpuPulseWave * gpuPulseWave);`,
      );
    };
    material.customProgramCacheKey = () => `gpu-pulse:${profile}`;
    material.needsUpdate = true;
    object.userData.gpuAnimationProfile = profile;
    object.userData.cpuAnimationSuppressed = true;
    delete object.userData.animate;
  });
}

function applyProxyMetadata(object: THREE.Object3D, definition: StreamedWorldDefinition, level: 'mid' | 'far') {
  object.userData.selectableId = definition.id;
  object.userData.streamingProxy = true;
  object.userData.streamingHlod = true;
  object.userData.streamingVisualLevel = level;
  object.userData.exportExcluded = true;
  object.castShadow = false;
  object.receiveShadow = false;
}

function makeProxyMaterial(
  definition: StreamedWorldDefinition,
  colorIndex: number,
  level: 'mid' | 'far',
  emissive = false,
) {
  const color = new THREE.Color(definition.palette[colorIndex] ?? definition.accent);
  return new THREE.MeshStandardMaterial({
    name: `${definition.name} ${level} HLOD${emissive ? ' accent' : ''}`,
    color,
    emissive: emissive ? color : new THREE.Color(0x000000),
    emissiveIntensity: emissive ? (level === 'far' ? 0.72 : 0.42) : 0,
    roughness: emissive ? 0.36 : 0.76,
    metalness: emissive ? 0.2 : 0.06,
    transparent: false,
    fog: true,
  });
}

function makeDistrictMidProxy(definition: StreamedWorldDefinition) {
  const root = new THREE.Group();
  root.name = `STREAMING_MID_HLOD__${definition.id.toUpperCase().replaceAll('-', '_')}`;
  root.position.set(definition.position[0], ISLAND_SURFACE_Y, definition.position[2]);
  applyProxyMetadata(root, definition, 'mid');

  const podiumMaterial = makeProxyMaterial(definition, 0, 'mid');
  const podium = new THREE.Mesh(proxyBoxGeometry, podiumMaterial);
  const podiumHeight = Math.max(0.24, definition.height * 0.1);
  podium.position.y = podiumHeight * 0.5;
  podium.scale.set(definition.footprint[0] * 0.8, podiumHeight, definition.footprint[1] * 0.78);
  applyProxyMetadata(podium, definition, 'mid');
  root.add(podium);

  // All recognizable building masses share one draw call. Per-instance color
  // keeps authored district palettes without cloning materials.
  const massProfiles = [
    [-0.27, -0.08, 0.3, 0.48, 0.7, 1],
    [0.03, 0.07, 0.34, 0.38, 1, 2],
    [0.3, -0.1, 0.22, 0.42, 0.61, 1],
    [-0.06, -0.31, 0.27, 0.2, 0.48, 3],
    [0.08, 0.31, 0.44, 0.18, 0.39, 2],
  ] as const;
  const masses = new THREE.InstancedMesh(proxyBoxGeometry, makeProxyMaterial(definition, 1, 'mid'), massProfiles.length);
  masses.name = `${root.name}__BATCHED_MASSES`;
  massProfiles.forEach(([x, z, width, depth, height, colorIndex], index) => {
    const h = Math.max(0.55, definition.height * 0.72 * height);
    instancePosition.set(definition.footprint[0] * x, podiumHeight + h * 0.5, definition.footprint[1] * z);
    instanceScale.set(
      Math.max(0.55, definition.footprint[0] * width),
      h,
      Math.max(0.55, definition.footprint[1] * depth),
    );
    instanceMatrix.compose(instancePosition, instanceQuaternion, instanceScale);
    masses.setMatrixAt(index, instanceMatrix);
    masses.setColorAt(index, new THREE.Color(definition.palette[colorIndex] ?? definition.accent));
  });
  masses.instanceMatrix.needsUpdate = true;
  if (masses.instanceColor) masses.instanceColor.needsUpdate = true;
  masses.userData.instanceSemanticIds = massProfiles.map((_, index) => `${definition.id}:mid-mass:${index + 1}`);
  applyProxyMetadata(masses, definition, 'mid');
  root.add(masses);

  const bands = new THREE.InstancedMesh(proxyBoxGeometry, makeProxyMaterial(definition, 3, 'mid', true), 3);
  bands.name = `${root.name}__BATCHED_EMISSIVE_BANDS`;
  massProfiles.slice(0, 3).forEach(([x, z, width, depth, height], index) => {
    const h = Math.max(0.55, definition.height * 0.72 * height);
    instancePosition.set(
      definition.footprint[0] * x,
      podiumHeight + h * (0.34 + index * 0.14),
      definition.footprint[1] * z + Math.max(0.55, definition.footprint[1] * depth) * 0.51,
    );
    instanceScale.set(Math.max(0.25, definition.footprint[0] * width * 0.68), Math.max(0.035, h * 0.045), 0.03);
    instanceMatrix.compose(instancePosition, instanceQuaternion, instanceScale);
    bands.setMatrixAt(index, instanceMatrix);
  });
  bands.instanceMatrix.needsUpdate = true;
  bands.userData.instanceSemanticIds = [1, 2, 3].map((index) => `${definition.id}:mid-accent:${index}`);
  applyProxyMetadata(bands, definition, 'mid');
  root.add(bands);
  root.userData.estimatedDrawCalls = 3;
  return root;
}

function makeBiomeMidProxy(definition: StreamedWorldDefinition) {
  const root = new THREE.Group();
  root.name = `STREAMING_MID_HLOD__${definition.id.toUpperCase().replaceAll('-', '_')}`;
  root.position.set(definition.position[0], ISLAND_SURFACE_Y, definition.position[2]);
  applyProxyMetadata(root, definition, 'mid');
  const shell = new THREE.Mesh(proxyBiomeGeometry, makeProxyMaterial(definition, 0, 'mid'));
  shell.position.y = definition.height * 0.25;
  shell.scale.set(definition.footprint[0], definition.height * 1.9, definition.footprint[1]);
  applyProxyMetadata(shell, definition, 'mid');
  root.add(shell);
  root.userData.estimatedDrawCalls = 1;
  return root;
}

function makeFarProxy(definition: StreamedWorldDefinition, kind: StreamedPackageKind) {
  const root = new THREE.Group();
  root.name = `STREAMING_FAR_HLOD__${definition.id.toUpperCase().replaceAll('-', '_')}`;
  root.position.set(definition.position[0], ISLAND_SURFACE_Y, definition.position[2]);
  applyProxyMetadata(root, definition, 'far');
  const geometry = kind === 'biome' ? proxyBiomeGeometry : proxyBoxGeometry;
  const silhouette = new THREE.Mesh(geometry, makeProxyMaterial(definition, 0, 'far'));
  if (kind === 'biome') {
    silhouette.position.y = definition.height * 0.22;
    silhouette.scale.set(definition.footprint[0], definition.height * 1.55, definition.footprint[1]);
  } else {
    const height = Math.max(0.65, definition.height * 0.54);
    silhouette.position.y = height * 0.5;
    silhouette.scale.set(definition.footprint[0] * 0.72, height, definition.footprint[1] * 0.7);
  }
  applyProxyMetadata(silhouette, definition, 'far');
  root.add(silhouette);
  if (kind === 'district') {
    const accent = new THREE.Mesh(proxyBoxGeometry, makeProxyMaterial(definition, 3, 'far', true));
    accent.position.set(0, Math.max(0.25, definition.height * 0.34), definition.footprint[1] * 0.36);
    accent.scale.set(definition.footprint[0] * 0.46, 0.06, 0.03);
    applyProxyMetadata(accent, definition, 'far');
    root.add(accent);
  }
  root.userData.estimatedDrawCalls = kind === 'district' ? 2 : 1;
  return root;
}

function estimatePackageCost(root: THREE.Object3D): StreamingPackageSnapshot['estimatedCost'] {
  let drawCalls = 0;
  let triangles = 0;
  let animationNodes = 0;
  root.traverse((object) => {
    let cursor: THREE.Object3D | null = object;
    let visible = true;
    while (cursor && cursor !== root.parent) {
      if (!cursor.visible) { visible = false; break; }
      if (cursor === root) break;
      cursor = cursor.parent;
    }
    if (!visible) return;
    if (typeof object.userData.animate === 'string') animationNodes += 1;
    if (!(object instanceof THREE.Mesh)) return;
    const drawMaterials = Array.isArray(object.material) ? object.material : [object.material];
    drawCalls += drawMaterials.length;
    const position = object.geometry.getAttribute('position');
    const baseTriangles = object.geometry.index ? object.geometry.index.count / 3 : (position?.count ?? 0) / 3;
    triangles += Number(object.userData.batchedTriangleCount ?? (baseTriangles * (object instanceof THREE.InstancedMesh ? object.count : 1)));
  });
  return {
    drawCalls,
    triangles: Math.round(triangles),
    animationNodes,
  };
}

function enforcePackageAnimationBudget(root: THREE.Object3D, maximumNodes = 150) {
  let retained = 0;
  root.traverse((object) => {
    if (typeof object.userData.animate !== 'string') return;
    if (retained < maximumNodes) {
      retained += 1;
      return;
    }
    object.userData.gpuAnimationProfile = object.userData.animate;
    object.userData.cpuAnimationSuppressed = true;
    delete object.userData.animate;
  });
  root.userData.cpuAnimationBudget = maximumNodes;
  root.userData.cpuAnimationNodes = retained;
}

function enforcePackageShadowPolicy(root: THREE.Object3D) {
  let retainedCasters = 0;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const transparentOrEmissive = materials.some((material) => {
      const standard = material as THREE.MeshStandardMaterial;
      return material.transparent || material.opacity < 1 || Number(standard.emissiveIntensity ?? 0) > 0;
    });
    const primaryMass = /BUILDING|MASS|HALL|TOWER|WAREHOUSE|HEADQUARTERS|TREE|VEGETATION|VEHICLE|TRUCK|ROVER/i.test(object.name);
    if (transparentOrEmissive || !primaryMass || retainedCasters >= 64) {
      object.castShadow = false;
      return;
    }
    if (object.castShadow) retainedCasters += 1;
  });
  root.userData.shadowPolicy = {
    primaryOpaqueOnly: true,
    maximumCasters: 64,
    activeCasters: retainedCasters,
  };
}

function batchStaticPackageMeshes(root: THREE.Group, backend: GpuBatchingBackend): PackageBatchingStats {
  root.updateWorldMatrix(true, true);
  const candidates = new Map<string, { owner: THREE.Object3D; material: THREE.Material; meshes: THREE.Mesh[] }>();
  const canonicalMaterials = new Map<string, THREE.Material>();
  const retainedTextures = new Set<THREE.Texture>();
  let retainedSourceCount = 0;

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    retainedSourceCount += 1;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      const candidate = material as THREE.Material & Record<string, unknown>;
      ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'aoMap', 'lightMap'].forEach((key) => {
        const texture = candidate[key];
        if (texture instanceof THREE.Texture) retainedTextures.add(texture);
      });
    });
    if (
      object instanceof THREE.InstancedMesh
      || object instanceof THREE.BatchedMesh
      || object instanceof THREE.SkinnedMesh
      || !object.visible
      || object.children.length > 0
      || hasAnimatedAncestor(object, root)
      || object.morphTargetInfluences
      || Array.isArray(object.material)
      || object.material instanceof THREE.ShaderMaterial
      || object.material instanceof THREE.RawShaderMaterial
      || object.customDepthMaterial
      || object.customDistanceMaterial
      || object.userData.exportFallback === true
      || object.userData.editorOnly === true
      || object.userData.authoredInteriorComponent === true
    ) return;

    const semanticOwner = getBatchOwner(object, root);
    // Keep a runtime batch under the source mesh's immediate parent. This
    // preserves every authored parent visibility/LOD/cutaway switch while the
    // material and semantic registries still canonicalize at facility scope.
    const owner = root.userData.selectableId === 'academic-libraries-theoretical-labs'
      ? object.parent ?? root
      : semanticOwner;
    const materialKey = materialBatchSignature(object.material);
    const canonicalKey = `${semanticOwner.uuid}|${materialKey}`;
    const material = canonicalMaterials.get(canonicalKey) ?? object.material;
    if (!canonicalMaterials.has(canonicalKey)) canonicalMaterials.set(canonicalKey, material);
    else object.material = material;
    const key = [
      owner.uuid,
      materialKey,
      geometryLayoutSignature(object.geometry),
      Number(object.castShadow),
      Number(object.receiveShadow),
      object.renderOrder,
      object.layers.mask,
      String(object.userData.animationProfile ?? ''),
    ].join('|');
    const group = candidates.get(key) ?? { owner, material, meshes: [] as THREE.Mesh[] };
    group.meshes.push(object);
    candidates.set(key, group);
  });

  let batchIndex = 0;
  let batchedSourceCount = 0;
  let estimatedGeometryBytes = 0;
  const makeMetadata = (meshes: THREE.Mesh[]) => ({
    selectableIds: meshes.map((mesh) => resolveSourceSelectableId(mesh, getBatchOwner(mesh, root), root)),
    semanticIds: meshes.map((mesh) => String(mesh.userData.semanticId ?? mesh.userData.featureTag ?? mesh.name)),
    sourceNames: meshes.map((mesh) => mesh.name),
  });
  const markSources = (meshes: THREE.Mesh[], batch: THREE.Mesh, instanceIds?: number[]) => {
    meshes.forEach((mesh, index) => {
      mesh.visible = false;
      mesh.userData.gpuBatchSource = true;
      mesh.userData.batchedInto = batch.name;
      mesh.userData.batchedInstanceId = instanceIds?.[index] ?? index;
      delete mesh.userData.streamingBudgetSuppressed;
    });
    batchedSourceCount += meshes.length;
  };

  candidates.forEach(({ owner, material, meshes }) => {
    if (meshes.length < 2) return;
    const ownerInverse = owner.matrixWorld.clone().invert();
    const metadata = makeMetadata(meshes);
    const localMatrices = meshes.map((mesh) => {
      mesh.updateWorldMatrix(true, false);
      return new THREE.Matrix4().multiplyMatrices(ownerInverse, mesh.matrixWorld);
    });
    if (localMatrices.some((matrix) => matrix.determinant() < 0)) return;

    let batch: THREE.Mesh;
    let instanceIds: number[] | undefined;
    if (backend === 'batched-mesh-multi-draw') {
      const uniqueGeometries = new Map<string, THREE.BufferGeometry>();
      meshes.forEach((mesh) => uniqueGeometries.set(mesh.geometry.uuid, mesh.geometry));
      const geometries = Array.from(uniqueGeometries.values());
      const vertexCount = geometries.reduce((sum, geometry) => sum + (geometry.getAttribute('position')?.count ?? 0), 0);
      const indexCount = geometries.reduce((sum, geometry) => sum + (geometry.index?.count ?? 0), 0);
      const batchedMesh = new THREE.BatchedMesh(meshes.length, vertexCount, indexCount, material);
      const geometryIds = new Map<string, number>();
      geometries.forEach((geometry) => {
        geometryIds.set(geometry.uuid, batchedMesh.addGeometry(geometry));
        estimatedGeometryBytes += geometryByteEstimate(geometry);
      });
      instanceIds = meshes.map((mesh, index) => {
        const instanceId = batchedMesh.addInstance(geometryIds.get(mesh.geometry.uuid)!);
        batchedMesh.setMatrixAt(instanceId, localMatrices[index]);
        return instanceId;
      });
      batchedMesh.perObjectFrustumCulled = true;
      batchedMesh.sortObjects = true;
      batchedMesh.computeBoundingBox();
      batchedMesh.computeBoundingSphere();
      batch = batchedMesh;
    } else if (meshes.every((mesh) => mesh.geometry === meshes[0].geometry)) {
      const instancedMesh = new THREE.InstancedMesh(meshes[0].geometry, material, meshes.length);
      localMatrices.forEach((matrix, index) => instancedMesh.setMatrixAt(index, matrix));
      instancedMesh.instanceMatrix.needsUpdate = true;
      estimatedGeometryBytes += geometryByteEstimate(meshes[0].geometry);
      batch = instancedMesh;
    } else {
      const transformed = meshes.map((mesh, index) => mesh.geometry.clone().applyMatrix4(localMatrices[index]));
      const merged = mergeGeometries(transformed, false);
      transformed.forEach((geometry) => geometry.dispose());
      if (!merged) return;
      const triangleRanges: Array<{ start: number; end: number; selectableId: string; semanticId: string; sourceName: string }> = [];
      let triangleOffset = 0;
      meshes.forEach((mesh, index) => {
        const position = mesh.geometry.getAttribute('position');
        const triangles = Math.floor((mesh.geometry.index?.count ?? position?.count ?? 0) / 3);
        triangleRanges.push({
          start: triangleOffset,
          end: triangleOffset + triangles,
          selectableId: metadata.selectableIds[index],
          semanticId: metadata.semanticIds[index],
          sourceName: metadata.sourceNames[index],
        });
        triangleOffset += triangles;
      });
      batch = new THREE.Mesh(merged, material);
      batch.userData.batchTriangleRanges = triangleRanges;
      estimatedGeometryBytes += geometryByteEstimate(merged);
    }

    batch.name = `${root.name}__GPU_STATIC_BATCH_${++batchIndex}`;
    batch.castShadow = meshes[0].castShadow;
    batch.receiveShadow = meshes[0].receiveShadow;
    batch.renderOrder = meshes[0].renderOrder;
    batch.layers.mask = meshes[0].layers.mask;
    batch.userData.selectableId = metadata.selectableIds[0] || root.userData.selectableId;
    batch.userData.gpuRuntimeBatch = true;
    batch.userData.exportExcluded = true;
    batch.userData.batchSelectableIds = metadata.selectableIds;
    batch.userData.batchSemanticIds = metadata.semanticIds;
    batch.userData.batchSourceNames = metadata.sourceNames;
    batch.userData.batchedTriangleCount = Math.round(meshes.reduce((sum, mesh) => {
      const position = mesh.geometry.getAttribute('position');
      return sum + (mesh.geometry.index?.count ?? position?.count ?? 0) / 3;
    }, 0));
    batch.userData.gpuBatchingBackend = backend;
    batch.userData.exportSemanticMetadata = true;
    owner.add(batch);
    markSources(meshes, batch, instanceIds);
  });

  const stats: PackageBatchingStats = {
    backend,
    batchCount: batchIndex,
    batchedSourceCount,
    retainedSourceCount,
    estimatedGeometryBytes,
    estimatedTextureBytes: Array.from(retainedTextures).reduce((sum, texture) => sum + textureByteEstimate(texture), 0),
  };
  root.userData.gpuBatching = {
    enabled: true,
    ...stats,
    semanticMetadataPreserved: true,
    sourceGeometryPreserved: true,
    productionExportRestoresSources: true,
  };
  root.userData.detailRenderBudget = {
    maximumDrawCalls: 450,
    maximumTriangles: 250_000,
    suppressedMeshes: 0,
    enforcement: 'gpu-batching-only',
    completeAuthoredExteriorRequired: true,
  };
  return stats;
}

/**
 * Runtime exterior streaming. Stable detail roots stay in the scene graph for
 * editor identity and persistence, while only a bounded set is GPU-resident.
 * Mid and far HLODs are runtime-only and cost at most three and two calls.
 */
export class WorldStreamingManager {
  readonly vistaRoot = new THREE.Group();
  readonly cacheCapacity = 8;
  private readonly packages = new Map<string, StreamingPackage>();
  private readonly loadedPackageIds = new Set<string>();
  private districtLayerEnabled = true;
  private biomeLayerEnabled = true;
  private lastCameraPosition = new THREE.Vector3(Number.POSITIVE_INFINITY, 0, 0);
  private lastMode: StreamingViewMode | null = null;
  private lastSelectedPackageId: string | null = null;
  private lastInteriorPackageId: string | null = null;
  private productionVisibilityState: Map<string, ProductionVisibilityState> | null = null;
  private readonly detailAnchorWorld = new THREE.Vector3();
  private adaptiveDetailPenalty = 0;
  private usageSequence = 0;
  private activeDetailLimit = 0;
  private lastElapsedSeconds = 0;
  private detailPolicy: StreamingDetailPolicy = 'streamed';
  private batchingBackend: GpuBatchingBackend = 'instanced-merge-fallback';
  private multiDrawSupported = false;
  private fullIslandLoadQueue: string[] = [];
  private fullIslandLoadPumpActive = false;
  private lastUpdateContext: StreamingUpdateContext | null = null;
  private readonly gpuAnimatedMaterials = new Set<THREE.Material>();

  constructor() {
    this.vistaRoot.name = 'STREAMING__EXTERIOR_VISTA_PROXIES';
    this.vistaRoot.userData.exportExcluded = true;
    this.vistaRoot.renderOrder = 1;
  }

  setGpuBatchingCapabilities(multiDrawSupported: boolean) {
    if (this.packages.size > 0) return false;
    this.multiDrawSupported = multiDrawSupported;
    this.batchingBackend = multiDrawSupported ? 'batched-mesh-multi-draw' : 'instanced-merge-fallback';
    return true;
  }

  register(
    definition: StreamedWorldDefinition,
    kind: StreamedPackageKind,
    detailRoot: THREE.Group,
    parent: THREE.Group,
  ) {
    this.unregister(definition.id);
    const detailEnvelope = new THREE.Group();
    detailEnvelope.name = `STREAMING_ENVELOPE__${definition.id.toUpperCase().replaceAll('-', '_')}`;
    detailEnvelope.userData.streamingPackageId = definition.id;
    detailEnvelope.userData.streamingPackageKind = kind;
    detailEnvelope.userData.stableStreamingAnchor = true;
    detailEnvelope.add(detailRoot);
    detailEnvelope.visible = false;
    parent.add(detailEnvelope);

    configureGpuPulseAnimations(detailRoot);
    enforcePackageAnimationBudget(detailRoot);
    enforcePackageShadowPolicy(detailRoot);
    const batching = batchStaticPackageMeshes(detailRoot, this.batchingBackend);
    detailRoot.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (material.userData.gpuPulseTimeUniform) this.gpuAnimatedMaterials.add(material);
      });
    });

    const midProxy = kind === 'district' ? makeDistrictMidProxy(definition) : makeBiomeMidProxy(definition);
    const farProxy = makeFarProxy(definition, kind);
    this.vistaRoot.add(midProxy, farProxy);
    detailRoot.updateMatrixWorld(true);
    const detailAnchorObjects: THREE.Object3D[] = [];
    detailRoot.traverse((object) => {
      if (!(object instanceof THREE.Group)) return;
      if (object.userData.exteriorProgram !== true && object.userData.academicFacility !== true) return;
      detailAnchorObjects.push(object);
    });
    this.packages.set(definition.id, {
      id: definition.id,
      kind,
      detailEnvelope,
      detailRoot,
      midProxy,
      farProxy,
      anchor: new THREE.Vector3(definition.position[0], ISLAND_SURFACE_Y, definition.position[2]),
      detailAnchorObjects,
      loadState: 'unloaded',
      visualLevel: 'far',
      desiredLevel: 'far',
      detailResident: false,
      pinned: false,
      distanceMetres: Number.POSITIVE_INFINITY,
      lastLevelChangeSeconds: Number.NEGATIVE_INFINITY,
      lastUsedSequence: 0,
      estimatedCost: estimatePackageCost(detailRoot),
      loadGeneration: 0,
      batching,
    });
    midProxy.visible = false;
    farProxy.visible = this.packageLayerEnabled(this.packages.get(definition.id)!);
    return detailEnvelope;
  }

  private unregister(id: string) {
    const previous = this.packages.get(id);
    if (!previous) return;
    previous.detailEnvelope.removeFromParent();
    previous.midProxy.removeFromParent();
    previous.farProxy.removeFromParent();
    for (const proxy of [previous.midProxy, previous.farProxy]) {
      proxy.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
    }
    this.loadedPackageIds.delete(id);
    this.packages.delete(id);
  }

  findPackageId(object: THREE.Object3D | null | undefined) {
    let cursor: THREE.Object3D | null = object ?? null;
    while (cursor) {
      if (typeof cursor.userData.streamingPackageId === 'string') return cursor.userData.streamingPackageId as string;
      if (typeof cursor.userData.selectableId === 'string' && this.packages.has(cursor.userData.selectableId)) {
        return cursor.userData.selectableId as string;
      }
      cursor = cursor.parent;
    }
    return null;
  }

  setLayerEnabled(kind: StreamedPackageKind, enabled: boolean) {
    if (kind === 'district') this.districtLayerEnabled = enabled;
    else this.biomeLayerEnabled = enabled;
    this.reconcileVisibility();
  }

  setAdaptiveDetailPenalty(penalty: number) {
    this.adaptiveDetailPenalty = THREE.MathUtils.clamp(Math.round(penalty), 0, 2);
  }

  refreshPackageEstimates() {
    this.packages.forEach((pkg) => {
      pkg.estimatedCost = estimatePackageCost(pkg.detailRoot);
    });
  }

  updateGpuAnimations(elapsedSeconds: number) {
    this.gpuAnimatedMaterials.forEach((material) => {
      const uniform = material.userData.gpuPulseTimeUniform as { value: number } | undefined;
      if (uniform) uniform.value = elapsedSeconds;
    });
  }

  setFullIslandDetail(enabled: boolean) {
    const nextPolicy: StreamingDetailPolicy = enabled ? 'full-island' : 'streamed';
    if (this.detailPolicy === nextPolicy) return this.isFullIslandDetail();
    this.detailPolicy = nextPolicy;
    this.fullIslandLoadQueue.length = 0;
    this.fullIslandLoadPumpActive = false;
    if (enabled) {
      this.packages.forEach((pkg) => {
        pkg.desiredLevel = 'detail';
        if (pkg.loadState === 'unloaded') this.fullIslandLoadQueue.push(pkg.id);
        if (pkg.loadState === 'loaded') pkg.visualLevel = 'detail';
      });
      this.activeDetailLimit = this.packages.size;
      this.pumpFullIslandLoadQueue();
      this.reconcileVisibility();
    } else {
      this.packages.forEach((pkg) => {
        if (pkg.loadState === 'loading') this.cancelPackageLoad(pkg);
      });
      if (this.lastUpdateContext) {
        this.lastCameraPosition.set(Number.POSITIVE_INFINITY, 0, 0);
        this.update({ ...this.lastUpdateContext, force: true });
      } else {
        this.evictLoadedPackages(new Set());
        this.reconcileVisibility();
      }
    }
    return this.isFullIslandDetail();
  }

  isFullIslandDetail() {
    return this.detailPolicy === 'full-island';
  }

  private packageLayerEnabled(pkg: StreamingPackage) {
    return pkg.kind === 'district' ? this.districtLayerEnabled : this.biomeLayerEnabled;
  }

  private detailLimit(mode: StreamingViewMode) {
    if (this.detailPolicy === 'full-island') return this.packages.size;
    if (mode === 'plan') return 0;
    if (mode === 'edit') return 1;
    const base = mode === 'walk' ? 5 : 3;
    return Math.max(1, base - this.adaptiveDetailPenalty);
  }

  private reconcileVisibility() {
    let changed = false;
    this.packages.forEach((pkg) => {
      const layerEnabled = this.packageLayerEnabled(pkg);
      const detail = layerEnabled && pkg.visualLevel === 'detail' && pkg.loadState === 'loaded';
      const mid = layerEnabled && pkg.visualLevel === 'mid' && !detail;
      const far = layerEnabled && !detail && !mid;
      if (pkg.detailEnvelope.visible !== detail) { pkg.detailEnvelope.visible = detail; changed = true; }
      if (pkg.midProxy.visible !== mid) { pkg.midProxy.visible = mid; changed = true; }
      if (pkg.farProxy.visible !== far) { pkg.farProxy.visible = far; changed = true; }
      pkg.detailResident = detail;
    });
    return changed;
  }

  private markLoaded(pkg: StreamingPackage) {
    pkg.loadState = 'loaded';
    pkg.error = undefined;
    pkg.lastUsedSequence = ++this.usageSequence;
    this.loadedPackageIds.add(pkg.id);
  }

  private schedulePackageLoad(pkg: StreamingPackage) {
    if (pkg.loadState === 'loading' || pkg.loadState === 'loaded') return;
    pkg.loadState = 'loading';
    pkg.error = undefined;
    const generation = ++pkg.loadGeneration;
    const resources: THREE.Object3D[] = [];
    pkg.detailRoot.traverse((object) => resources.push(object));
    let cursor = 0;
    const buildSlice = () => {
      if (generation !== pkg.loadGeneration || (this.detailPolicy === 'streamed' && pkg.desiredLevel === 'far')) {
        pkg.loadState = 'unloaded';
        if (this.detailPolicy === 'full-island') this.pumpFullIslandLoadQueue();
        return;
      }
      try {
        const startedAt = performance.now();
        while (cursor < resources.length && performance.now() - startedAt < 8) {
          // Accessing package-owned resources here deliberately warms object
          // metadata in bounded slices. Future authored packages can replace
          // this descriptor activation with their asynchronous detail factory.
          const object = resources[cursor++];
          if (object instanceof THREE.Mesh) object.geometry.getAttribute('position');
        }
        if (cursor < resources.length) {
          globalThis.setTimeout(buildSlice, 0);
          return;
        }
        if (generation !== pkg.loadGeneration) return;
        this.markLoaded(pkg);
        if (pkg.desiredLevel === 'detail') {
          pkg.visualLevel = 'detail';
          pkg.lastLevelChangeSeconds = this.lastElapsedSeconds;
        }
        const protectedIds = new Set(
          Array.from(this.packages.values()).filter((candidate) => candidate.pinned || candidate.desiredLevel === 'detail').map((candidate) => candidate.id),
        );
        this.evictLoadedPackages(protectedIds);
        this.reconcileVisibility();
        if (this.detailPolicy === 'full-island') this.pumpFullIslandLoadQueue();
      } catch (error) {
        pkg.loadState = 'error';
        pkg.error = error instanceof Error ? error.message : 'Unable to activate package detail.';
        pkg.visualLevel = 'mid';
        this.reconcileVisibility();
        if (this.detailPolicy === 'full-island') this.pumpFullIslandLoadQueue();
      }
    };
    globalThis.setTimeout(buildSlice, 0);
  }

  private cancelPackageLoad(pkg: StreamingPackage) {
    if (pkg.loadState !== 'loading') return;
    pkg.loadGeneration += 1;
    pkg.loadState = 'unloaded';
  }

  private pumpFullIslandLoadQueue() {
    if (this.detailPolicy !== 'full-island' || this.fullIslandLoadPumpActive) return;
    if (Array.from(this.packages.values()).some((pkg) => pkg.loadState === 'loading')) return;
    let next: StreamingPackage | undefined;
    while (this.fullIslandLoadQueue.length && !next) {
      const id = this.fullIslandLoadQueue.shift()!;
      const pkg = this.packages.get(id);
      if (pkg?.loadState === 'unloaded') next = pkg;
    }
    if (!next) {
      const missing = Array.from(this.packages.values()).find((pkg) => pkg.loadState === 'unloaded');
      if (!missing) return;
      next = missing;
    }
    this.fullIslandLoadPumpActive = true;
    this.schedulePackageLoad(next);
    this.fullIslandLoadPumpActive = false;
  }

  private evictLoadedPackages(protectedIds: ReadonlySet<string>) {
    if (this.detailPolicy === 'full-island') return;
    while (this.loadedPackageIds.size > this.cacheCapacity) {
      const candidate = Array.from(this.loadedPackageIds)
        .map((id) => this.packages.get(id))
        .filter((pkg): pkg is StreamingPackage => Boolean(pkg) && !protectedIds.has(pkg!.id) && !pkg!.pinned)
        .sort((a, b) => a.lastUsedSequence - b.lastUsedSequence)[0];
      if (!candidate) break;
      this.loadedPackageIds.delete(candidate.id);
      candidate.loadState = 'unloaded';
      candidate.visualLevel = candidate.desiredLevel === 'detail' ? 'mid' : candidate.desiredLevel;
      candidate.detailResident = false;
      candidate.detailRoot.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        // dispose() releases renderer-side buffers while retaining CPU geometry
        // and stable object identities for cheap, persistence-safe remounts.
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
    }
  }

  simulateLoadError(id: string, message = 'Simulated package load failure') {
    const pkg = this.packages.get(id);
    if (!pkg) return false;
    this.loadedPackageIds.delete(id);
    pkg.loadState = 'error';
    pkg.error = message;
    pkg.visualLevel = pkg.desiredLevel === 'far' ? 'far' : 'mid';
    this.reconcileVisibility();
    return true;
  }

  retryPackage(id: string) {
    const pkg = this.packages.get(id);
    if (!pkg) return false;
    pkg.loadState = 'unloaded';
    this.schedulePackageLoad(pkg);
    return true;
  }

  /**
   * Promote an already-authored package before a synchronous interaction such
   * as Edit -> WALK places the camera inside it. Existing packages keep their
   * CPU scene graph while unloaded, so this is an atomic proxy/detail swap;
   * future asynchronous factories can await readiness before calling it.
   */
  ensurePackageResident(object: THREE.Object3D | null | undefined, elapsedSeconds = this.lastElapsedSeconds) {
    const id = this.findPackageId(object);
    const pkg = id ? this.packages.get(id) : null;
    if (!pkg) return false;
    if (pkg.loadState === 'loading') pkg.loadGeneration += 1;
    if (pkg.loadState !== 'loaded') this.markLoaded(pkg);
    pkg.error = undefined;
    pkg.pinned = true;
    pkg.desiredLevel = 'detail';
    pkg.visualLevel = 'detail';
    pkg.lastLevelChangeSeconds = elapsedSeconds;
    pkg.lastUsedSequence = ++this.usageSequence;
    this.evictLoadedPackages(new Set([pkg.id]));
    this.reconcileVisibility();
    return true;
  }

  update(context: StreamingUpdateContext) {
    if (this.productionVisibilityState) return false;
    this.lastUpdateContext = {
      ...context,
      cameraPosition: context.cameraPosition.clone(),
      cameraDirection: context.cameraDirection?.clone(),
    };
    const elapsedSeconds = context.elapsedSeconds ?? this.lastElapsedSeconds;
    if (this.detailPolicy === 'full-island') {
      this.lastCameraPosition.copy(context.cameraPosition);
      this.lastMode = context.mode;
      this.lastSelectedPackageId = context.selectedPackageId;
      this.lastInteriorPackageId = context.interiorPackageId;
      this.lastElapsedSeconds = elapsedSeconds;
      this.activeDetailLimit = this.packages.size;
      this.packages.forEach((pkg) => {
        pkg.pinned = context.selectedPackageId === pkg.id || context.interiorPackageId === pkg.id;
        pkg.distanceMetres = Math.round(Math.hypot(
          context.cameraPosition.x - pkg.anchor.x,
          context.cameraPosition.z - pkg.anchor.z,
        ) * 10);
        pkg.desiredLevel = 'detail';
        if (pkg.loadState === 'loaded') {
          pkg.visualLevel = 'detail';
          pkg.lastUsedSequence = ++this.usageSequence;
        } else if (pkg.loadState === 'error' && pkg.pinned) {
          pkg.loadState = 'unloaded';
          this.fullIslandLoadQueue.unshift(pkg.id);
        }
      });
      this.pumpFullIslandLoadQueue();
      return this.reconcileVisibility();
    }
    const movedEnough = this.lastCameraPosition.distanceToSquared(context.cameraPosition) > 0.25;
    const contextChanged = context.force
      || movedEnough
      || context.mode !== this.lastMode
      || context.selectedPackageId !== this.lastSelectedPackageId
      || context.interiorPackageId !== this.lastInteriorPackageId;
    if (!contextChanged) return this.reconcileVisibility();

    this.lastCameraPosition.copy(context.cameraPosition);
    this.lastMode = context.mode;
    this.lastSelectedPackageId = context.selectedPackageId;
    this.lastInteriorPackageId = context.interiorPackageId;
    this.lastElapsedSeconds = elapsedSeconds;
    const altitude = Math.max(0, context.cameraPosition.y - ISLAND_SURFACE_Y);
    // Detail radii are world units (10 metres each). Keeping a roughly
    // 350-450 metre incoming radius prevents adjacent heavy campuses from
    // needlessly overlapping Detail while every facility in the package the
    // user is actually approaching remains complete.
    const detailRadius = context.mode === 'walk' ? 52 : context.mode === 'edit' ? 55 : 42;
    const candidates: StreamingPackage[] = [];

    this.packages.forEach((pkg) => {
      let horizontalWorldUnits = Math.hypot(context.cameraPosition.x - pkg.anchor.x, context.cameraPosition.z - pkg.anchor.z);
      pkg.detailAnchorObjects.forEach((object) => {
        object.getWorldPosition(this.detailAnchorWorld);
        horizontalWorldUnits = Math.min(horizontalWorldUnits, Math.hypot(
          context.cameraPosition.x - this.detailAnchorWorld.x,
          context.cameraPosition.z - this.detailAnchorWorld.z,
        ));
      });
      pkg.distanceMetres = horizontalWorldUnits * 10;
      pkg.pinned = context.selectedPackageId === pkg.id || context.interiorPackageId === pkg.id;
      const isOverview = context.mode === 'plan' || (context.mode !== 'walk' && altitude > 115);
      const detailThreshold = pkg.visualLevel === 'detail' ? detailRadius * 1.15 : detailRadius * 0.85;
      const closeEnough = horizontalWorldUnits <= detailThreshold;
      if (this.packageLayerEnabled(pkg) && (pkg.pinned || (!isOverview && closeEnough))) candidates.push(pkg);
      const midBoundary = detailRadius * 2.2;
      const midThreshold = pkg.visualLevel === 'mid' ? midBoundary * 1.15 : midBoundary * 0.85;
      pkg.desiredLevel = horizontalWorldUnits <= midThreshold && context.mode !== 'plan' ? 'mid' : 'far';
    });

    this.activeDetailLimit = this.detailLimit(context.mode);
    candidates.sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.distanceMetres - b.distanceMetres);
    const desiredDetail = new Set(candidates.slice(0, this.activeDetailLimit).map((pkg) => pkg.id));
    candidates.filter((pkg) => pkg.pinned).forEach((pkg) => desiredDetail.add(pkg.id));
    const protectedIds = new Set(desiredDetail);

    this.packages.forEach((pkg) => {
      if (desiredDetail.has(pkg.id)) {
        pkg.desiredLevel = 'detail';
        if (pkg.loadState === 'error') {
          // Focusing an errored package retries it. Until then the mid proxy
          // remains visible, so a failed build never creates a scene hole.
          if (pkg.pinned) this.retryPackage(pkg.id);
        } else if (pkg.loadState !== 'loaded') {
          this.schedulePackageLoad(pkg);
        } else {
          pkg.lastUsedSequence = ++this.usageSequence;
        }
      }
      if (!desiredDetail.has(pkg.id) && pkg.desiredLevel === 'far' && pkg.loadState === 'loading') this.cancelPackageLoad(pkg);
      let nextLevel = pkg.desiredLevel;
      if (nextLevel === 'detail' && pkg.loadState !== 'loaded') nextLevel = 'mid';
      const dwellComplete = elapsedSeconds - pkg.lastLevelChangeSeconds >= 0.75;
      if (context.force || pkg.pinned || dwellComplete) {
        if (pkg.visualLevel !== nextLevel) {
          pkg.visualLevel = nextLevel;
          pkg.lastLevelChangeSeconds = elapsedSeconds;
        }
      }
    });
    // Warm packages just beyond the detail boundary, plus packages in the
    // camera's forward travel cone. Prefetch never changes the visible HLOD.
    this.packages.forEach((pkg) => {
      if (pkg.loadState !== 'unloaded' || context.mode === 'plan') return;
      const distance = pkg.distanceMetres / 10;
      const withinPrefetchRing = distance <= detailRadius * 1.25;
      let inForwardCone = false;
      if (context.cameraDirection && distance <= detailRadius * 1.8) {
        const toPackageX = pkg.anchor.x - context.cameraPosition.x;
        const toPackageZ = pkg.anchor.z - context.cameraPosition.z;
        const magnitude = Math.hypot(toPackageX, toPackageZ) || 1;
        inForwardCone = (toPackageX * context.cameraDirection.x + toPackageZ * context.cameraDirection.z) / magnitude > 0.82;
      }
      if (withinPrefetchRing || inForwardCone) this.schedulePackageLoad(pkg);
    });
    this.evictLoadedPackages(protectedIds);
    return this.reconcileVisibility();
  }

  beginProductionExport() {
    if (this.productionVisibilityState) throw new Error('A Production export is already preparing streamed world packages.');
    this.productionVisibilityState = new Map();
    this.packages.forEach((pkg) => {
      this.productionVisibilityState!.set(pkg.id, {
        detailResident: pkg.detailResident,
        detailEnvelopeVisible: pkg.detailEnvelope.visible,
        midVisible: pkg.midProxy.visible,
        farVisible: pkg.farProxy.visible,
        visualLevel: pkg.visualLevel,
        loadState: pkg.loadState,
      });
      pkg.loadState = 'loaded';
      pkg.visualLevel = 'detail';
      pkg.detailResident = true;
      pkg.detailEnvelope.visible = true;
      pkg.midProxy.visible = false;
      pkg.farProxy.visible = false;
    });
    let restored = false;
    return () => {
      if (restored) return;
      restored = true;
      const states = this.productionVisibilityState;
      this.productionVisibilityState = null;
      states?.forEach((state, id) => {
        const pkg = this.packages.get(id);
        if (!pkg) return;
        pkg.detailResident = state.detailResident;
        pkg.detailEnvelope.visible = state.detailEnvelopeVisible;
        pkg.midProxy.visible = state.midVisible;
        pkg.farProxy.visible = state.farVisible;
        pkg.visualLevel = state.visualLevel;
        pkg.loadState = state.loadState;
      });
    };
  }

  getSnapshot(): StreamingSnapshot {
    const packages = Array.from(this.packages.values());
    const loaded = this.loadedPackageIds.size;
    const total = packages.length;
    const gpuBatching = packages.reduce((summary, pkg) => ({
      batchCount: summary.batchCount + pkg.batching.batchCount,
      batchedSourceCount: summary.batchedSourceCount + pkg.batching.batchedSourceCount,
      retainedSourceCount: summary.retainedSourceCount + pkg.batching.retainedSourceCount,
      estimatedGeometryBytes: summary.estimatedGeometryBytes + pkg.batching.estimatedGeometryBytes,
      estimatedTextureBytes: summary.estimatedTextureBytes + pkg.batching.estimatedTextureBytes,
    }), { batchCount: 0, batchedSourceCount: 0, retainedSourceCount: 0, estimatedGeometryBytes: 0, estimatedTextureBytes: 0 });
    return {
      authority: 'web-sandbox' as const,
      strategy: this.detailPolicy === 'full-island'
        ? 'progressive full-island GPU detail with per-object frustum culling'
        : 'bounded detail LRU with detail, batched mid HLOD, and far silhouette levels',
      detailPolicy: this.detailPolicy,
      fullIslandDetailRequested: this.detailPolicy === 'full-island',
      fullIslandDetailReady: this.detailPolicy === 'full-island' && loaded === total && packages.every((pkg) => pkg.visualLevel === 'detail'),
      fullIslandDetailProgress: {
        loaded,
        total,
        percent: total ? Math.round(loaded / total * 100) : 100,
      },
      totalPackages: total,
      cacheCapacity: this.detailPolicy === 'full-island' ? total : this.cacheCapacity,
      effectiveCacheCapacity: this.detailPolicy === 'full-island' ? total : this.cacheCapacity,
      loadedPackageCount: loaded,
      loadedPackages: Array.from(this.loadedPackageIds),
      activeDetailLimit: this.activeDetailLimit,
      residentDetailPackages: packages.filter((pkg) => pkg.detailResident).map((pkg) => pkg.id),
      residentPackageCount: packages.filter((pkg) => pkg.detailResident).length,
      proxyPackageCount: packages.filter((pkg) => pkg.midProxy.visible || pkg.farProxy.visible).length,
      midPackageCount: packages.filter((pkg) => pkg.midProxy.visible).length,
      farPackageCount: packages.filter((pkg) => pkg.farProxy.visible).length,
      gpuBatching: {
        backend: this.batchingBackend,
        multiDrawSupported: this.multiDrawSupported,
        ...gpuBatching,
      },
      packages: packages.map((pkg): StreamingPackageSnapshot => ({
        id: pkg.id,
        kind: pkg.kind,
        loadState: pkg.loadState,
        visualLevel: pkg.visualLevel,
        detailResident: pkg.detailResident,
        proxyVisible: pkg.midProxy.visible || pkg.farProxy.visible,
        midVisible: pkg.midProxy.visible,
        farVisible: pkg.farProxy.visible,
        pinned: pkg.pinned,
        distanceMetres: Number.isFinite(pkg.distanceMetres) ? Math.round(pkg.distanceMetres) : -1,
        estimatedCost: pkg.estimatedCost,
        ...(pkg.error ? { error: pkg.error } : {}),
      })),
    };
  }

  dispose() {
    const materials = new Set<THREE.Material>();
    this.vistaRoot.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.forEach((material) => materials.add(material));
    });
    materials.forEach((material) => material.dispose());
    this.vistaRoot.clear();
    this.loadedPackageIds.clear();
    this.gpuAnimatedMaterials.clear();
    this.packages.clear();
  }
}

export function isEffectivelyVisible(object: THREE.Object3D) {
  let cursor: THREE.Object3D | null = object;
  while (cursor) {
    if (!cursor.visible) return false;
    cursor = cursor.parent;
  }
  return true;
}
