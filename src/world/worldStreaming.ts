import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BiomeDefinition, DistrictDefinition } from '../data/districts';
import { ISLAND_SURFACE_Y } from '../config/island';

export type StreamedWorldDefinition = DistrictDefinition | BiomeDefinition;
export type StreamedPackageKind = 'district' | 'biome';
export type StreamingViewMode = 'explore' | 'plan' | 'edit' | 'walk';
export type StreamingLoadState = 'unloaded' | 'loading' | 'loaded' | 'error';
export type StreamingLifecyclePhase = 'queued' | 'building' | 'warming-gpu' | 'ready' | 'error' | 'degraded';
export type StreamingVisualLevel = 'detail' | 'mid' | 'far';
export type StreamingDetailPolicy = 'streamed' | 'full-island';
export type GpuBatchingBackend = 'batched-mesh-multi-draw' | 'instanced-merge-fallback';
export type StreamingPriorityReason = 'selected' | 'visible' | 'nearest' | 'manual' | 'background';
export type RenderImportance = 'mandatory' | 'micro';

export interface StreamingUpdateContext {
  cameraPosition: THREE.Vector3;
  cameraDirection?: THREE.Vector3;
  mode: StreamingViewMode;
  selectedPackageId: string | null;
  interiorPackageId: string | null;
  /** Optional authoritative visibility supplied by a renderer/frustum pass. */
  visiblePackageIds?: readonly string[];
  /** Optional authoritative nearest package supplied by a spatial index. */
  nearestPackageId?: string | null;
  elapsedSeconds?: number;
  force?: boolean;
}

export interface StreamingPackageSnapshot {
  id: string;
  kind: StreamedPackageKind;
  loadState: StreamingLoadState;
  lifecyclePhase: StreamingLifecyclePhase;
  loadProgress: number;
  priorityReason: StreamingPriorityReason;
  priorityScore: number;
  visibleCandidate: boolean;
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
  renderImportance: {
    mandatory: number;
    micro: number;
    visibleMicro: number;
    culledMicro: number;
  };
  batchOccupancy: { capacity: number; active: number; ratio: number };
  degradedReason?: string;
  error?: string;
}

export interface StreamingSnapshot {
  authority: 'web-sandbox';
  strategy: string;
  detailPolicy: StreamingDetailPolicy;
  fullIslandDetailRequested: boolean;
  fullIslandDetailReady: boolean;
  fullIslandDetailProgress: {
    loaded: number;
    total: number;
    percent: number;
    queued: number;
    building: number;
    warmingGpu: number;
    ready: number;
    error: number;
    degraded: number;
    currentPackageId: string | null;
    failedPackageIds: string[];
  };
  fullIslandLifecycle: {
    phase: StreamingLifecyclePhase;
    queued: number;
    building: number;
    warmingGpu: number;
    ready: number;
    error: number;
    degraded: number;
    currentPackageId: string | null;
    failedPackageIds: string[];
  };
  visiblePackageReadiness: { ready: number; total: number; percent: number };
  renderProfile: 'streamed' | 'full-island';
  liveRenderObjectCount: number;
  batchOccupancy: { capacity: number; active: number; ratio: number };
  microdetail: { total: number; visible: number; culled: number };
  collisionResidentCellCount: number;
  navigationResidencyRevision: number;
  detachedAuthoringSourceCount: number;
  normalRenderAuthoredSourceCount: number;
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
    instancedBatchCount: number;
    batchedMeshBatchCount: number;
    mergedBatchCount: number;
    largestBatchInstances: number;
    largestBatchVertices: number;
    largestBatchIndices: number;
    safetyLimits: { instances: number; vertices: number; indices: number };
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
  lifecyclePhase: StreamingLifecyclePhase;
  loadProgress: number;
  priorityReason: StreamingPriorityReason;
  priorityScore: number;
  visibleCandidate: boolean;
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
  runtimeBatches: RuntimeBatchRecord[];
  activationResources: THREE.Mesh[];
  fullIslandDisabledLights: Array<{ light: THREE.Light; originalVisible: boolean }>;
  runtimeAnimationBindings: Map<THREE.Object3D, RuntimeAnimationBinding[]>;
  authorityRoot: THREE.Group;
  authoritySources: RuntimeBatchEntry[];
  authorityMountDepth: number;
  microSources: MicrodetailRecord[];
  renderImportance: StreamingPackageSnapshot['renderImportance'];
  lastRuntimeBatchSyncSeconds: number;
  degradedReason?: string;
  error?: string;
}

interface PackageBatchingStats {
  backend: GpuBatchingBackend;
  batchCount: number;
  batchedSourceCount: number;
  retainedSourceCount: number;
  estimatedGeometryBytes: number;
  estimatedTextureBytes: number;
  instancedBatchCount: number;
  batchedMeshBatchCount: number;
  mergedBatchCount: number;
  largestBatchInstances: number;
  largestBatchVertices: number;
  largestBatchIndices: number;
}

interface RuntimeBatchEntry {
  source: THREE.Mesh;
  semanticOwner: THREE.Object3D;
  visibilityOwner: THREE.Object3D;
  originalParent: THREE.Object3D;
  originalIndex: number;
  sourceToOwner: THREE.Matrix4;
  localMatrix: THREE.Matrix4;
  instanceId: number;
  importance: RenderImportance;
  microVisible: boolean;
  parentVisible: boolean;
  lastMicroChangeSeconds: number;
  animationOwner?: THREE.Object3D;
  /** Original instance within an authored InstancedMesh, when applicable. */
  sourceInstanceId?: number;
  sourceInstanceMatrix?: THREE.Matrix4;
}

interface RuntimeBatchRecord {
  batch: THREE.Mesh;
  entries: RuntimeBatchEntry[];
  kind: 'batched' | 'instanced' | 'merged';
  packageWide: boolean;
  opaque: boolean;
  owner: THREE.Object3D;
  dynamicTransforms: boolean;
  /** Package-wide merged geometry must be rebuilt after an entry-level edit. */
  rebuildRequired: boolean;
}

interface RuntimeAnimationBinding {
  record: RuntimeBatchRecord;
  entry: RuntimeBatchEntry;
}

interface MicrodetailRecord {
  object: THREE.Mesh;
  batchRecord?: RuntimeBatchRecord;
  batchEntry?: RuntimeBatchEntry;
  visible: boolean;
  lastChangeSeconds: number;
}

interface PackageBatchingResult {
  stats: PackageBatchingStats;
  runtimeBatches: RuntimeBatchRecord[];
  runtimeAnimationBindings: Map<THREE.Object3D, RuntimeAnimationBinding[]>;
  authorityRoot: THREE.Group;
  authoritySources: RuntimeBatchEntry[];
  microSources: MicrodetailRecord[];
  renderImportance: StreamingPackageSnapshot['renderImportance'];
}

function collectPackageActivationResources(
  root: THREE.Group,
  runtimeBatches: readonly RuntimeBatchRecord[],
) {
  const resources = new Set<THREE.Mesh>(runtimeBatches.map((record) => record.batch));
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)
      || object.userData.gpuRuntimeBatch === true
      || object.userData.gpuBatchSource === true
      || object.userData.gpuBatchMetadataAnchor === true
      || object.userData.gpuAuthoredMetadataAnchor === true
      || !parentChainVisible(object, root)
      || !object.geometry.getAttribute('position')) return;
    resources.add(object);
  });
  return Array.from(resources);
}

function isRuntimeInteriorDescendant(object: THREE.Object3D, root: THREE.Group) {
  let cursor: THREE.Object3D | null = object.parent;
  while (cursor && cursor !== root) {
    if (cursor.userData.runtimeInterior === true || cursor.userData.authoredEditorInterior === true) return true;
    cursor = cursor.parent;
  }
  return false;
}

function collectFullIslandExteriorLights(root: THREE.Group) {
  const lights: Array<{ light: THREE.Light; originalVisible: boolean }> = [];
  root.traverse((object) => {
    if (!(object instanceof THREE.Light) || isRuntimeInteriorDescendant(object, root)) return;
    lights.push({ light: object, originalVisible: object.visible });
  });
  return lights;
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
  lifecyclePhase: StreamingLifecyclePhase;
  loadProgress: number;
}

const proxyBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
const proxyBiomeGeometry = new THREE.SphereGeometry(0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.52);
const instanceMatrix = new THREE.Matrix4();
const instancePosition = new THREE.Vector3();
const instanceScale = new THREE.Vector3();
const instanceQuaternion = new THREE.Quaternion();
const batchRootInverse = new THREE.Matrix4();
const batchOwnerRelative = new THREE.Matrix4();
const runtimeAnimatedWorld = new THREE.Matrix4();
const runtimeAnimatedOwnerInverse = new THREE.Matrix4();
const legacyInstanceMatrix = new THREE.Matrix4();
const legacyInstanceColor = new THREE.Color();
const legacyEffectiveColor = new THREE.Color();
const microWorldPosition = new THREE.Vector3();
const microWorldScale = new THREE.Vector3();
const hiddenInstanceMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
const MAX_RUNTIME_BATCH_INSTANCES = 768;
const MAX_RUNTIME_BATCH_VERTICES = 65_536;
const MAX_RUNTIME_BATCH_INDICES = 262_144;
const LARGE_IDENTICAL_INSTANCE_THRESHOLD = 96;
const MAX_STATIC_MERGED_INSTANCES = 256;
const MAX_STATIC_MERGED_VERTICES = 131_072;
const MAX_STATIC_MERGED_INDICES = 524_288;
const MAX_CONSOLIDATED_LEGACY_INSTANCES = 8_192;
const FULL_ISLAND_MAX_CONCURRENT_LOADS = 4;

function canonicalBatchScalar(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? Math.round(numeric * 3) / 3 : 0;
}

function resolveRenderImportance(object: THREE.Object3D, root: THREE.Group): RenderImportance {
  let cursor: THREE.Object3D | null = object;
  while (cursor) {
    const tagged = cursor.userData.renderImportance;
    if (tagged === 'micro' || cursor.userData.microDetail === true) return 'micro';
    if (tagged === 'mandatory') return 'mandatory';
    if (cursor === root) break;
    cursor = cursor.parent;
  }
  return 'mandatory';
}

function isOpaqueMaterial(material: THREE.Material) {
  return !material.transparent
    && material.opacity >= 1
    && material.alphaTest <= 0
    && material.blending === THREE.NormalBlending;
}

function parentChainVisible(object: THREE.Object3D, root: THREE.Group) {
  let cursor: THREE.Object3D | null = object.parent;
  while (cursor && cursor !== root) {
    if (!cursor.visible) return false;
    cursor = cursor.parent;
  }
  return true;
}

function objectChainVisible(object: THREE.Object3D, root: THREE.Group) {
  let cursor: THREE.Object3D | null = object;
  while (cursor && cursor !== root) {
    if (!cursor.visible) return false;
    cursor = cursor.parent;
  }
  return cursor === root;
}

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

function reusableGeometrySignature(geometry: THREE.BufferGeometry) {
  const parameters = (geometry as THREE.BufferGeometry & { parameters?: Record<string, unknown> }).parameters;
  if (parameters && Object.keys(parameters).length > 0) {
    const ordered = Object.keys(parameters).sort().map((key) => [key, parameters[key]]);
    return `${geometry.type}|${JSON.stringify(ordered)}|${geometryLayoutSignature(geometry)}`;
  }
  // Custom geometries are not assumed equivalent merely because their
  // attribute layouts match.
  return `${geometry.uuid}|${geometryLayoutSignature(geometry)}`;
}

function materialBatchSignature(
  material: THREE.Material,
  includeColor = true,
  canonicalizeScalars = false,
) {
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
    includeColor ? color : 'instance-color',
    emissive,
    canonicalizeScalars
      ? canonicalBatchScalar(candidate.emissiveIntensity)
      : Number(candidate.emissiveIntensity ?? 0),
    canonicalizeScalars ? canonicalBatchScalar(candidate.roughness) : Number(candidate.roughness ?? 0),
    canonicalizeScalars ? canonicalBatchScalar(candidate.metalness) : Number(candidate.metalness ?? 0),
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
  let outermostSelectableOwner: THREE.Object3D | undefined;
  while (cursor && cursor !== root) {
    if (
      cursor.userData.exteriorProgram === true
      || cursor.userData.academicFacility === true
      || cursor.userData.authoredExteriorBuilding === true
    ) return cursor;
    // Building IDs are intentionally inherited by descendant groups for
    // selection and persistence. Those descendants are not semantic owners:
    // keep walking so the outermost inherited anchor owns the package manifest.
    if (typeof cursor.userData.individualSelectableId === 'string') outermostSelectableOwner = cursor;
    cursor = cursor.parent;
  }
  return outermostSelectableOwner ?? root;
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

const UNSAFE_RUNTIME_BATCH_ANIMATIONS = new Set([
  'welcome-pool-water',
  'academic-tree-wind',
  'academic-fountain',
  'secret-controlled-vapour',
  'secret-noosphere-shimmer',
  'industrial-moving-light',
  'industrial-flicker',
  'industrial-beacon',
  'industrial-steam',
]);

function findAnimatedAncestor(mesh: THREE.Mesh, root: THREE.Group) {
  let cursor: THREE.Object3D | null = mesh;
  while (cursor) {
    if (typeof cursor.userData.animate === 'string') return cursor;
    if (cursor === root) break;
    cursor = cursor.parent;
  }
  return undefined;
}

function hasUnbatchableAnimatedAncestor(mesh: THREE.Mesh, root: THREE.Group) {
  const owner = findAnimatedAncestor(mesh, root);
  if (!owner) return false;
  return UNSAFE_RUNTIME_BATCH_ANIMATIONS.has(String(owner.userData.animate));
}

function requiresLiveBatchEntries(mesh: THREE.Mesh, root: THREE.Group) {
  let cursor: THREE.Object3D | null = mesh;
  while (cursor) {
    if (
      typeof cursor.userData.animate === 'string'
      || cursor.userData.runtimeTransformAnimation === true
    ) return true;
    if (cursor === root) break;
    cursor = cursor.parent;
  }
  return false;
}

function configureGpuPulseAnimations(root: THREE.Group, sharedTimeUniforms: Map<string, { value: number }>) {
  root.traverse((object) => {
    const profile = String(object.userData.animate ?? '');
    if (!GPU_PULSE_PROFILES.has(profile) || !(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
    if (!(object.material instanceof THREE.MeshStandardMaterial)) return;
    const material = object.material;
    const timeUniform = sharedTimeUniforms.get(profile) ?? { value: 0 };
    sharedTimeUniforms.set(profile, timeUniform);
    const speed = Math.max(0.004, Number(object.userData.speed ?? 0.02));
    const phase = Number(object.userData.phase ?? 0);
    material.userData.gpuPulseTimeUniform = timeUniform;
    material.userData.gpuAnimationProfile = profile;
    material.userData.gpuPulseSpeed = speed;
    material.userData.gpuPulsePhase = phase;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uGpuDetailTime = timeUniform;
      shader.uniforms.uGpuPulseSpeed = { value: speed * Math.PI * 2 };
      shader.uniforms.uGpuPulsePhase = { value: phase };
      shader.fragmentShader = `uniform float uGpuDetailTime;\n${shader.fragmentShader}`.replace(
        'uniform float uGpuDetailTime;',
        'uniform float uGpuDetailTime;\nuniform float uGpuPulseSpeed;\nuniform float uGpuPulsePhase;',
      ).replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float gpuPulseWave = max(0.0, sin(uGpuDetailTime * uGpuPulseSpeed + uGpuPulsePhase));
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
    const highQualityEligible = object.castShadow && !transparentOrEmissive && primaryMass && retainedCasters < 64;
    object.userData.highQualityShadowEligible = highQualityEligible;
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

function collapseCompatibleMergedBatches(records: RuntimeBatchRecord[], root: THREE.Group) {
  const maximumCombinedVertices = 262_144;
  const maximumCombinedIndices = 786_432;
  const candidates = new Map<string, RuntimeBatchRecord[]>();
  const hasMaterialTexture = (material: THREE.Material) => Object.values(material).some((value) => (
    value instanceof THREE.Texture
    || (Array.isArray(value) && value.some((entry) => entry instanceof THREE.Texture))
  ));
  const hasCustomMaterialProgram = (material: THREE.Material) => (
    material.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile
    || material.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey
  );
  const hasCustomRenderHook = (batch: THREE.Mesh) => (
    batch.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender
    || batch.onAfterRender !== THREE.Object3D.prototype.onAfterRender
    || batch.onBeforeShadow !== THREE.Object3D.prototype.onBeforeShadow
    || batch.onAfterShadow !== THREE.Object3D.prototype.onAfterShadow
  );
  const materialCompatibilityKey = (material: THREE.MeshStandardMaterial) => {
    const materialFields = material as THREE.MeshStandardMaterial & {
      defines?: Record<string, unknown>;
      allowOverride?: boolean;
    };
    const serialized = material.toJSON() as unknown as Record<string, unknown>;
    // These channels are baked into normalized vertex attributes below. All
    // remaining serialized fields must match exactly.
    delete serialized.metadata;
    delete serialized.uuid;
    delete serialized.name;
    delete serialized.color;
    delete serialized.emissive;
    delete serialized.emissiveIntensity;
    delete serialized.vertexColors;
    serialized.defines = Object.entries(materialFields.defines ?? {}).sort(([left], [right]) => left.localeCompare(right));
    serialized.clippingPlanes = material.clippingPlanes?.map((plane) => [
      plane.normal.x,
      plane.normal.y,
      plane.normal.z,
      plane.constant,
    ]) ?? null;
    serialized.clipIntersection = material.clipIntersection;
    serialized.clipShadows = material.clipShadows;
    serialized.precision = material.precision;
    serialized.opacity = material.opacity;
    serialized.allowOverride = materialFields.allowOverride;
    const ordered = Object.keys(serialized).sort().reduce<Record<string, unknown>>((result, key) => {
      result[key] = serialized[key];
      return result;
    }, {});
    return JSON.stringify(ordered);
  };
  const normalizedFloat3 = (attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
    const values = new Float32Array(attribute.count * 3);
    for (let index = 0; index < attribute.count; index += 1) {
      const offset = index * 3;
      values[offset] = attribute.getX(index);
      values[offset + 1] = attribute.getY(index);
      values[offset + 2] = attribute.getZ(index);
    }
    return new THREE.BufferAttribute(values, 3);
  };
  const normalizedGeometry = (record: RuntimeBatchRecord) => {
    const source = record.batch.geometry;
    const sourcePosition = source.getAttribute('position');
    const sourceNormal = source.getAttribute('normal');
    if (!sourcePosition || !sourceNormal) return null;
    const material = record.batch.material as THREE.MeshStandardMaterial;
    const existingColor = material.vertexColors ? source.getAttribute('color') : undefined;
    const geometry = source.clone();
    Object.keys(geometry.attributes).forEach((name) => geometry.deleteAttribute(name));
    geometry.setAttribute('position', normalizedFloat3(sourcePosition));
    geometry.setAttribute('normal', normalizedFloat3(sourceNormal));
    const colors = new Float32Array(sourcePosition.count * 3);
    for (let vertex = 0; vertex < sourcePosition.count; vertex += 1) {
      const offset = vertex * 3;
      colors[offset] = (existingColor?.getX(vertex) ?? 1) * material.color.r;
      colors[offset + 1] = (existingColor?.getY(vertex) ?? 1) * material.color.g;
      colors[offset + 2] = (existingColor?.getZ(vertex) ?? 1) * material.color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const emissive = material.emissive.clone().multiplyScalar(material.emissiveIntensity);
    const emissiveValues = new Float32Array(sourcePosition.count * 3);
    for (let offset = 0; offset < emissiveValues.length; offset += 3) {
      emissiveValues[offset] = emissive.r;
      emissiveValues[offset + 1] = emissive.g;
      emissiveValues[offset + 2] = emissive.b;
    }
    geometry.setAttribute('batchEmissive', new THREE.BufferAttribute(emissiveValues, 3));
    const sourceIndex = source.getIndex();
    const indexCount = sourceIndex?.count ?? sourcePosition.count;
    const indices = new Uint32Array(indexCount);
    if (sourceIndex) {
      for (let index = 0; index < indexCount; index += 1) indices[index] = sourceIndex.getX(index);
    } else {
      for (let index = 0; index < indexCount; index += 1) indices[index] = index;
    }
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.clearGroups();
    geometry.setDrawRange(0, indexCount);
    return geometry;
  };
  records.forEach((record) => {
    if (record.kind !== 'merged'
      || !record.opaque
      || !record.packageWide
      || record.dynamicTransforms
      || record.rebuildRequired
      || record.entries.some((entry) => entry.importance === 'micro')
      || Array.isArray(record.batch.material)
      || !(record.batch.material instanceof THREE.MeshStandardMaterial)
      || record.batch.material.userData.gpuPulseTimeUniform !== undefined
      || typeof record.batch.material.userData.gpuAnimationProfile === 'string'
      || hasMaterialTexture(record.batch.material)
      || hasCustomMaterialProgram(record.batch.material)
      || hasCustomRenderHook(record.batch)
      || record.batch.customDepthMaterial !== undefined
      || record.batch.customDistanceMaterial !== undefined
      || !record.batch.geometry.getAttribute('position')
      || !record.batch.geometry.getAttribute('normal')
      || Object.keys(record.batch.geometry.morphAttributes).length > 0
      || record.batch.geometry.drawRange.start !== 0
      || (record.batch.geometry.drawRange.count !== Number.POSITIVE_INFINITY
        && record.batch.geometry.drawRange.count < (
          record.batch.geometry.getIndex()?.count
          ?? record.batch.geometry.getAttribute('position')?.count
          ?? 0
        ))) return;
    const material = record.batch.material;
    const key = [
      record.owner.uuid,
      Number(record.packageWide),
      materialCompatibilityKey(material),
      material.customProgramCacheKey(),
      record.batch.renderOrder,
      record.batch.layers.mask,
      Number(record.batch.castShadow),
      Number(record.batch.receiveShadow),
      Number(record.batch.frustumCulled),
      Number(record.batch.visible),
      Number(record.batch.userData.highQualityShadowEligible === true),
      Number(record.batch.matrixAutoUpdate),
      Number(record.batch.matrixWorldAutoUpdate),
      record.batch.matrix.elements.join(','),
    ].join('|');
    const group = candidates.get(key) ?? [];
    group.push(record);
    candidates.set(key, group);
  });

  const collapse = (group: RuntimeBatchRecord[]) => {
    if (group.length < 2) return;
    const owner = group[0].owner;
    const transformed = group.map(normalizedGeometry);
    if (transformed.some((geometry) => geometry === null)) {
      transformed.forEach((geometry) => geometry?.dispose());
      return;
    }
    const compatibleGeometries = transformed.filter(
      (geometry): geometry is THREE.BufferGeometry => geometry !== null,
    );
    const geometry = mergeGeometries(compatibleGeometries, false);
    compatibleGeometries.forEach((entry) => entry.dispose());
    if (!geometry) return;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const sourceMaterial = group[0].batch.material as THREE.MeshStandardMaterial;
    const material = sourceMaterial.clone();
    material.userData = { ...sourceMaterial.userData, packageMergedEmissiveAttribute: true };
    material.color.set(0xffffff);
    material.vertexColors = true;
    material.emissive.set(0x000000);
    material.emissiveIntensity = 1;
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = `attribute vec3 batchEmissive;\nvarying vec3 vBatchEmissive;\n${shader.vertexShader}`
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n vBatchEmissive = batchEmissive;');
      shader.fragmentShader = `varying vec3 vBatchEmissive;\n${shader.fragmentShader}`
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vBatchEmissive;');
    };
    material.customProgramCacheKey = () => 'package-merged-emissive-attribute-v1';
    material.needsUpdate = true;
    const batch = new THREE.Mesh(geometry, material);
    batch.name = `${root.name}__GPU_SUPER_MERGED_BATCH_${THREE.MathUtils.generateUUID().slice(0, 8)}`;
    batch.castShadow = group[0].batch.castShadow;
    batch.receiveShadow = group[0].batch.receiveShadow;
    batch.renderOrder = group[0].batch.renderOrder;
    batch.layers.mask = group[0].batch.layers.mask;
    batch.frustumCulled = group[0].batch.frustumCulled;
    batch.visible = group[0].batch.visible;
    batch.position.copy(group[0].batch.position);
    batch.quaternion.copy(group[0].batch.quaternion);
    batch.scale.copy(group[0].batch.scale);
    batch.matrix.copy(group[0].batch.matrix);
    batch.matrixAutoUpdate = group[0].batch.matrixAutoUpdate;
    batch.matrixWorldAutoUpdate = group[0].batch.matrixWorldAutoUpdate;
    batch.userData = {
      ...group[0].batch.userData,
      gpuRuntimeBatch: true,
      exportExcluded: true,
      packageSuperMergedBatch: true,
      batchSelectableIds: group.flatMap((record) => record.batch.userData.batchSelectableIds ?? []),
      batchSemanticIds: group.flatMap((record) => record.batch.userData.batchSemanticIds ?? []),
      batchSourceNames: group.flatMap((record) => record.batch.userData.batchSourceNames ?? []),
      batchRenderImportance: group.flatMap((record) => record.batch.userData.batchRenderImportance ?? []),
    };
    const triangleRanges: Array<{ start: number; end: number; selectableId: string; semanticId: string; sourceName: string }> = [];
    let triangleOffset = 0;
    group.forEach((record) => {
      const ranges = record.batch.userData.batchTriangleRanges as typeof triangleRanges | undefined;
      if (ranges?.length) {
        ranges.forEach((range) => triangleRanges.push({
          ...range,
          start: range.start + triangleOffset,
          end: range.end + triangleOffset,
        }));
      }
      triangleOffset += Math.floor((
        record.batch.geometry.getIndex()?.count
        ?? record.batch.geometry.getAttribute('position')?.count
        ?? 0
      ) / 3);
    });
    batch.userData.batchTriangleRanges = triangleRanges;
    batch.userData.batchedTriangleCount = triangleOffset;
    owner.add(batch);
    const entries = group.flatMap((record) => record.entries);
    entries.forEach((entry, index) => {
      entry.instanceId = index;
      entry.source.userData.batchedInto = batch.name;
      entry.source.userData.batchedInstanceId = index;
    });
    const replacement: RuntimeBatchRecord = {
      batch,
      entries,
      kind: 'merged',
      packageWide: true,
      opaque: true,
      owner,
      dynamicTransforms: false,
      rebuildRequired: false,
    };
    const firstIndex = Math.min(...group.map((record) => records.indexOf(record)));
    group.forEach((record) => {
      const index = records.indexOf(record);
      if (index >= 0) records.splice(index, 1);
      record.batch.removeFromParent();
      record.batch.geometry.dispose();
      const materials = Array.isArray(record.batch.material) ? record.batch.material : [record.batch.material];
      materials.forEach((entry) => entry.dispose());
    });
    records.splice(Math.max(0, firstIndex), 0, replacement);
  };

  candidates.forEach((group) => {
    let segment: RuntimeBatchRecord[] = [];
    let vertexCount = 0;
    let indexCount = 0;
    const flush = () => {
      collapse(segment);
      segment = [];
      vertexCount = 0;
      indexCount = 0;
    };
    group.forEach((record) => {
      const nextVertices = record.batch.geometry.getAttribute('position')?.count ?? 0;
      const nextIndices = record.batch.geometry.getIndex()?.count ?? nextVertices;
      if (segment.length > 0 && (
        vertexCount + nextVertices > maximumCombinedVertices
        || indexCount + nextIndices > maximumCombinedIndices
      )) flush();
      segment.push(record);
      vertexCount += nextVertices;
      indexCount += nextIndices;
    });
    flush();
  });
}

function batchStaticPackageMeshes(root: THREE.Group, backend: GpuBatchingBackend): PackageBatchingResult {
  root.updateWorldMatrix(true, true);
  type Candidate = {
    mesh: THREE.Mesh;
    semanticOwner: THREE.Object3D;
    localOwner: THREE.Object3D;
    material: THREE.Material;
    materialKey: string;
    commonKey: string;
    fallbackKey: string;
    identicalKey: string;
    importance: RenderImportance;
    usesInstanceColor: boolean;
    requiresLiveEntryUpdates: boolean;
    animationOwner?: THREE.Object3D;
  };
  type CandidateGroup = {
    owner: THREE.Object3D;
    material: THREE.Material;
    meshes: THREE.Mesh[];
    packageWide: boolean;
    importance: RenderImportance;
    usesInstanceColor: boolean;
    requiresLiveEntryUpdates: boolean;
  };
  type LegacyInstancedCandidate = {
    source: THREE.InstancedMesh;
    semanticOwner: THREE.Object3D;
    material: THREE.Material;
    supportsInstanceColor: boolean;
  };

  const eligible: Candidate[] = [];
  const legacyInstancedGroups = new Map<string, LegacyInstancedCandidate[]>();
  const retainedTextures = new Set<THREE.Texture>();
  let retainedSourceCount = 0;
  let mandatoryCount = 0;
  let microCount = 0;

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (object.userData.gpuRuntimeBatch === true
      || object.userData.gpuBatchMetadataAnchor === true
      || object.userData.gpuAuthoredMetadataAnchor === true) return;
    retainedSourceCount += 1;
    const importance = resolveRenderImportance(object, root);
    if (importance === 'micro') microCount += 1;
    else mandatoryCount += 1;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      const candidate = material as THREE.Material & Record<string, unknown>;
      ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'aoMap', 'lightMap'].forEach((key) => {
        const texture = candidate[key];
        if (texture instanceof THREE.Texture) retainedTextures.add(texture);
      });
    });
    if (object instanceof THREE.InstancedMesh) {
      const material = Array.isArray(object.material) ? null : object.material;
      const supportedSharedGpuPulse = Boolean(
        material
        && typeof material.userData.gpuAnimationProfile === 'string'
        && material.userData.gpuPulseTimeUniform !== undefined
      );
      const customShader = !supportedSharedGpuPulse && Boolean(material && (
        material.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile
        || material.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey
      ));
      const eligibleLegacySource = Boolean(
        material
        && object.count > 0
        && object.visible
        && parentChainVisible(object, root)
        && object.children.length === 0
        && resolveRenderImportance(object, root) === 'mandatory'
        && !findAnimatedAncestor(object, root)
        && !requiresLiveBatchEntries(object, root)
        && !(material instanceof THREE.ShaderMaterial)
        && !(material instanceof THREE.RawShaderMaterial)
        && !customShader
        && !object.customDepthMaterial
        && !object.customDistanceMaterial
        && object.userData.exportFallback !== true
        && object.userData.editorOnly !== true
        && object.userData.authoredInteriorComponent !== true
      );
      if (eligibleLegacySource && material) {
        const semanticOwner = getBatchOwner(object, root);
        const materialColor = (material as THREE.Material & { color?: THREE.Color }).color;
        const supportsInstanceColor = materialColor instanceof THREE.Color;
        // Multi-draw can place heterogeneous compatible geometries in one
        // BatchedMesh. Keep geometry in the fallback key because the
        // InstancedMesh backend still requires one identical geometry, but do
        // not fragment WebGL2 packages merely because their authored helper
        // geometries have different dimensions.
        const key = [
          backend === 'batched-mesh-multi-draw' ? 'heterogeneous' : reusableGeometrySignature(object.geometry),
          geometryLayoutSignature(object.geometry),
          materialBatchSignature(material, !supportsInstanceColor, true),
          Number(object.castShadow),
          Number(object.receiveShadow),
          object.renderOrder,
          object.layers.mask,
        ].join('|');
        const group = legacyInstancedGroups.get(key) ?? [];
        group.push({ source: object, semanticOwner, material, supportsInstanceColor });
        legacyInstancedGroups.set(key, group);
      }
      return;
    }
    if (
      object instanceof THREE.BatchedMesh
      || object instanceof THREE.SkinnedMesh
      || !object.visible
      || !parentChainVisible(object, root)
      || object.children.length > 0
      || hasUnbatchableAnimatedAncestor(object, root)
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
    const usesInstanceColor = (
      object.material instanceof THREE.MeshStandardMaterial
      || object.material instanceof THREE.MeshPhysicalMaterial
    ) && !object.material.vertexColors;
    // Base colour is per-instance data for compatible standard/physical
    // materials; emissive, texture, shadow, and animation fields stay in the
    // canonical key and therefore never cross an unsafe render behavior.
    const materialKey = materialBatchSignature(object.material, !usesInstanceColor, true);
    const commonKey = [
      materialKey,
      geometryLayoutSignature(object.geometry),
      Number(object.castShadow),
      object.renderOrder,
      object.layers.mask,
      String(object.userData.animationProfile ?? object.userData.gpuAnimationProfile ?? ''),
    ].join('|');
    const fallbackKey = [
      materialBatchSignature(object.material, true),
      geometryLayoutSignature(object.geometry),
      Number(object.castShadow),
      Number(object.receiveShadow),
      object.renderOrder,
      object.layers.mask,
      String(object.userData.animationProfile ?? object.userData.gpuAnimationProfile ?? ''),
      importance,
    ].join('|');
    const animationOwner = findAnimatedAncestor(object, root);
    eligible.push({
      mesh: object,
      semanticOwner,
      localOwner: object.parent ?? semanticOwner,
      material: object.material,
      materialKey,
      commonKey,
      fallbackKey,
      identicalKey: `${commonKey}|${object.geometry.uuid}`,
      importance,
      usesInstanceColor,
      requiresLiveEntryUpdates: importance === 'micro' || requiresLiveBatchEntries(object, root),
      animationOwner,
    });
  });

  const candidates = new Map<string, CandidateGroup>();
  if (backend === 'batched-mesh-multi-draw') {
    const commonGroups = new Map<string, Candidate[]>();
    eligible.forEach((candidate) => {
      const group = commonGroups.get(candidate.commonKey) ?? [];
      group.push(candidate);
      commonGroups.set(candidate.commonKey, group);
    });
    commonGroups.forEach((group, commonKey) => {
      const byGeometry = new Map<string, Candidate[]>();
      group.forEach((candidate) => {
        const geometryGroup = byGeometry.get(candidate.mesh.geometry.uuid) ?? [];
        geometryGroup.push(candidate);
        byGeometry.set(candidate.mesh.geometry.uuid, geometryGroup);
      });
      const heterogeneous: Candidate[] = [];
      byGeometry.forEach((geometryGroup, geometryId) => {
        if (geometryGroup.length < LARGE_IDENTICAL_INSTANCE_THRESHOLD) {
          heterogeneous.push(...geometryGroup);
          return;
        }
        const first = geometryGroup[0];
        candidates.set(`instance|${commonKey}|${geometryId}`, {
          owner: root,
          material: first.material,
          meshes: geometryGroup.map((candidate) => candidate.mesh),
          packageWide: true,
          importance: first.importance,
          usesInstanceColor: first.usesInstanceColor,
          requiresLiveEntryUpdates: geometryGroup.some((candidate) => candidate.requiresLiveEntryUpdates),
        });
      });
      if (heterogeneous.length) {
        const first = heterogeneous[0];
        candidates.set(`package|${commonKey}`, {
          owner: root,
          material: first.material,
          meshes: heterogeneous.map((candidate) => candidate.mesh),
          packageWide: true,
          importance: first.importance,
          usesInstanceColor: first.usesInstanceColor,
          requiresLiveEntryUpdates: heterogeneous.some((candidate) => candidate.requiresLiveEntryUpdates),
        });
      }
    });
  } else {
    const identicalCounts = new Map<string, number>();
    eligible.forEach((candidate) => {
      identicalCounts.set(candidate.identicalKey, (identicalCounts.get(candidate.identicalKey) ?? 0) + 1);
    });
    eligible.forEach((candidate) => {
      const identicalAcrossPackage = (identicalCounts.get(candidate.identicalKey) ?? 0) >= 2;
      const packageWide = identicalAcrossPackage;
      const groupKey = identicalAcrossPackage
        ? `instance|${candidate.identicalKey}`
        : `owner|${candidate.localOwner.uuid}|${candidate.fallbackKey}`;
      const owner = packageWide ? root : candidate.localOwner;
      const group = candidates.get(groupKey) ?? {
        owner,
        material: candidate.material,
        meshes: [],
        packageWide,
        importance: candidate.importance,
        usesInstanceColor: identicalAcrossPackage && candidate.usesInstanceColor,
        requiresLiveEntryUpdates: candidate.requiresLiveEntryUpdates,
      };
      group.meshes.push(candidate.mesh);
      group.requiresLiveEntryUpdates ||= candidate.requiresLiveEntryUpdates;
      candidates.set(groupKey, group);
    });
  }

  let batchIndex = 0;
  let batchedSourceCount = 0;
  let estimatedGeometryBytes = 0;
  const runtimeBatches: RuntimeBatchRecord[] = [];
  const microSources: MicrodetailRecord[] = [];
  const makeMetadata = (meshes: THREE.Mesh[]) => ({
    selectableIds: meshes.map((mesh) => resolveSourceSelectableId(mesh, getBatchOwner(mesh, root), root)),
    semanticIds: meshes.map((mesh) => String(mesh.userData.semanticId ?? mesh.userData.featureTag ?? mesh.name)),
    sourceNames: meshes.map((mesh) => mesh.name),
    importance: meshes.map((mesh) => resolveRenderImportance(mesh, root)),
  });
  const markSources = (meshes: THREE.Mesh[], batch: THREE.Mesh, instanceIds?: number[]) => {
    meshes.forEach((mesh, index) => {
      mesh.visible = false;
      mesh.userData.gpuBatchSource = true;
      mesh.userData.batchedInto = batch.name;
      mesh.userData.batchedInstanceId = instanceIds?.[index] ?? index;
      mesh.userData.renderImportance = resolveRenderImportance(mesh, root);
      delete mesh.userData.streamingBudgetSuppressed;
    });
    batchedSourceCount += meshes.length;
  };

  const segmentedCandidates: Array<CandidateGroup & { preferMerged: boolean }> = [];
  candidates.forEach((group) => {
    const expandedVertices = group.meshes.reduce(
      (sum, mesh) => sum + (mesh.geometry.getAttribute('position')?.count ?? 0),
      0,
    );
    const expandedIndices = group.meshes.reduce(
      (sum, mesh) => sum + (mesh.geometry.index?.count ?? 0),
      0,
    );
    const preferMerged = backend !== 'batched-mesh-multi-draw' || (
      !group.requiresLiveEntryUpdates
      && group.meshes.length <= MAX_STATIC_MERGED_INSTANCES
      && expandedVertices <= MAX_STATIC_MERGED_VERTICES
      && expandedIndices <= MAX_STATIC_MERGED_INDICES
    );
    let meshes: THREE.Mesh[] = [];
    let vertexCount = 0;
    let indexCount = 0;
    const geometryIds = new Set<string>();
    const flush = () => {
      if (meshes.length) segmentedCandidates.push({ ...group, meshes, preferMerged });
      meshes = [];
      vertexCount = 0;
      indexCount = 0;
      geometryIds.clear();
    };
    group.meshes.forEach((mesh) => {
      const newGeometry = !geometryIds.has(mesh.geometry.uuid);
      const nextVertices = (preferMerged || newGeometry) ? (mesh.geometry.getAttribute('position')?.count ?? 0) : 0;
      const nextIndices = (preferMerged || newGeometry) ? (mesh.geometry.index?.count ?? 0) : 0;
      const maximumInstances = preferMerged ? MAX_STATIC_MERGED_INSTANCES : MAX_RUNTIME_BATCH_INSTANCES;
      const maximumVertices = preferMerged ? MAX_STATIC_MERGED_VERTICES : MAX_RUNTIME_BATCH_VERTICES;
      const maximumIndices = preferMerged ? MAX_STATIC_MERGED_INDICES : MAX_RUNTIME_BATCH_INDICES;
      const exceedsSafetyLimit = meshes.length > 0 && (
        meshes.length >= maximumInstances
        || vertexCount + nextVertices > maximumVertices
        || indexCount + nextIndices > maximumIndices
      );
      if (exceedsSafetyLimit) flush();
      meshes.push(mesh);
      if (preferMerged || !geometryIds.has(mesh.geometry.uuid)) {
        geometryIds.add(mesh.geometry.uuid);
        vertexCount += mesh.geometry.getAttribute('position')?.count ?? 0;
        indexCount += mesh.geometry.index?.count ?? 0;
      }
    });
    flush();
  });

  segmentedCandidates.forEach(({ owner, material: sourceMaterial, meshes, packageWide, usesInstanceColor, preferMerged }) => {
    if (meshes.length < 2) return;
    const ownerInverse = owner.matrixWorld.clone().invert();
    const metadata = makeMetadata(meshes);
    const localMatrices = meshes.map((mesh) => {
      mesh.updateWorldMatrix(true, false);
      return new THREE.Matrix4().multiplyMatrices(ownerInverse, mesh.matrixWorld);
    });
    if (localMatrices.some((matrix) => matrix.determinant() < 0)) return;

    const material = sourceMaterial.clone();
    material.userData = { ...sourceMaterial.userData };
    material.onBeforeCompile = sourceMaterial.onBeforeCompile;
    material.customProgramCacheKey = sourceMaterial.customProgramCacheKey;
    if (backend === 'batched-mesh-multi-draw' && material instanceof THREE.MeshStandardMaterial) {
      material.roughness = canonicalBatchScalar(material.roughness);
      material.metalness = canonicalBatchScalar(material.metalness);
      material.emissiveIntensity = canonicalBatchScalar(material.emissiveIntensity);
    }
    const firstSourceColor = (meshes[0].material as THREE.Material & { color?: THREE.Color }).color;
    const applyInstanceColors = usesInstanceColor && firstSourceColor instanceof THREE.Color && meshes.some((mesh) => {
      const color = (mesh.material as THREE.Material & { color?: THREE.Color }).color;
      return color instanceof THREE.Color && !color.equals(firstSourceColor);
    });
    if (applyInstanceColors) {
      const colorMaterial = material as THREE.Material & { color?: THREE.Color };
      colorMaterial.color?.set(0xffffff);
    }
    const opaque = isOpaqueMaterial(material);
    let batch: THREE.Mesh;
    let kind: RuntimeBatchRecord['kind'];
    let instanceIds: number[] | undefined;
    if (meshes.every((mesh) => mesh.geometry === meshes[0].geometry)) {
      const instancedMesh = new THREE.InstancedMesh(meshes[0].geometry, material, meshes.length);
      localMatrices.forEach((matrix, index) => {
        instancedMesh.setMatrixAt(index, matrix);
        const color = (meshes[index].material as THREE.Material & { color?: THREE.Color }).color;
        if (applyInstanceColors && color) instancedMesh.setColorAt(index, color);
      });
      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
      instancedMesh.computeBoundingBox();
      instancedMesh.computeBoundingSphere();
      estimatedGeometryBytes += geometryByteEstimate(meshes[0].geometry);
      batch = instancedMesh;
      kind = 'instanced';
    } else if (backend === 'batched-mesh-multi-draw' && !preferMerged) {
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
        const color = (mesh.material as THREE.Material & { color?: THREE.Color }).color;
        if (applyInstanceColors && color) batchedMesh.setColorAt(instanceId, color);
        return instanceId;
      });
      batchedMesh.perObjectFrustumCulled = true;
      batchedMesh.sortObjects = !opaque;
      batchedMesh.computeBoundingBox();
      batchedMesh.computeBoundingSphere();
      batch = batchedMesh;
      kind = 'batched';
    } else {
      // Small and medium immutable groups avoid BatchedMesh's per-batch
      // matrices/indirect/color textures. Runtime edits rebuild these static
      // merged records atomically; microdetail and animated records never use
      // this path.
      const transformed = meshes.map((mesh, index) => {
        const geometry = mesh.geometry.clone().applyMatrix4(localMatrices[index]);
        if (applyInstanceColors) {
          const color = (mesh.material as THREE.Material & { color?: THREE.Color }).color;
          const position = geometry.getAttribute('position');
          if (color instanceof THREE.Color && position) {
            const colors = new Float32Array(position.count * 3);
            for (let offset = 0; offset < colors.length; offset += 3) {
              colors[offset] = color.r;
              colors[offset + 1] = color.g;
              colors[offset + 2] = color.b;
            }
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
          }
        }
        return geometry;
      });
      const merged = mergeGeometries(transformed, false);
      transformed.forEach((geometry) => geometry.dispose());
      if (!merged) { material.dispose(); return; }
      if (applyInstanceColors && 'vertexColors' in material) {
        (material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial).vertexColors = true;
        material.needsUpdate = true;
      }
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
      merged.computeBoundingBox();
      merged.computeBoundingSphere();
      batch.userData.batchTriangleRanges = triangleRanges;
      estimatedGeometryBytes += geometryByteEstimate(merged);
      kind = 'merged';
    }

    batch.name = `${root.name}__GPU_STATIC_BATCH_${++batchIndex}`;
    const highQualityShadowEligible = meshes.some((mesh) => mesh.userData.highQualityShadowEligible === true);
    batch.castShadow = highQualityShadowEligible;
    batch.receiveShadow = meshes.some((mesh) => mesh.receiveShadow);
    batch.renderOrder = meshes[0].renderOrder;
    batch.layers.mask = meshes[0].layers.mask;
    batch.userData.selectableId = metadata.selectableIds[0] || root.userData.selectableId;
    batch.userData.gpuRuntimeBatch = true;
    batch.userData.exportExcluded = true;
    batch.userData.batchSelectableIds = metadata.selectableIds;
    batch.userData.batchSemanticIds = metadata.semanticIds;
    batch.userData.batchSourceNames = metadata.sourceNames;
    batch.userData.batchRenderImportance = metadata.importance;
    batch.userData.packageWideBatch = packageWide;
    batch.userData.highQualityShadowEligible = highQualityShadowEligible;
    batch.userData.batchedTriangleCount = Math.round(meshes.reduce((sum, mesh) => {
      const position = mesh.geometry.getAttribute('position');
      return sum + (mesh.geometry.index?.count ?? position?.count ?? 0) / 3;
    }, 0));
    batch.userData.gpuBatchingBackend = backend;
    batch.userData.exportSemanticMetadata = true;
    owner.add(batch);
    const resolvedInstanceIds = instanceIds ?? meshes.map((_, index) => index);
    const entries = meshes.map((mesh, index): RuntimeBatchEntry => {
      const semanticOwner = getBatchOwner(mesh, root);
      const originalParent = mesh.parent ?? semanticOwner;
      const sourceToOwner = new THREE.Matrix4().multiplyMatrices(semanticOwner.matrixWorld.clone().invert(), mesh.matrixWorld);
      return {
        source: mesh,
        semanticOwner,
        visibilityOwner: originalParent,
        originalParent,
        originalIndex: originalParent.children.indexOf(mesh),
        sourceToOwner,
        localMatrix: localMatrices[index].clone(),
        instanceId: resolvedInstanceIds[index],
        importance: metadata.importance[index],
        microVisible: true,
        parentVisible: true,
        lastMicroChangeSeconds: Number.NEGATIVE_INFINITY,
        animationOwner: findAnimatedAncestor(mesh, root),
      };
    });
    const dynamicTransforms = entries.some((entry) => Boolean(entry.animationOwner));
    const runtimeRecord: RuntimeBatchRecord = {
      batch,
      entries,
      kind,
      packageWide,
      opaque,
      owner,
      dynamicTransforms,
      rebuildRequired: false,
    };
    if (dynamicTransforms) {
      // The dynamic entries update their GPU matrices directly. Avoid an
      // expensive aggregate-bound rebuild every frame; BatchedMesh retains
      // its per-object culling and packages still provide the broad phase.
      batch.frustumCulled = false;
      batch.userData.runtimeTransformBatch = true;
    }
    runtimeBatches.push(runtimeRecord);
    entries.forEach((entry) => {
      if (entry.importance === 'micro') {
        microSources.push({
          object: entry.source,
          batchRecord: runtimeRecord,
          batchEntry: entry,
          visible: true,
          lastChangeSeconds: Number.NEGATIVE_INFINITY,
        });
      }
    });
    markSources(meshes, batch, instanceIds);
  });

  type LegacyInstanceReference = {
    candidate: LegacyInstancedCandidate;
    sourceInstanceId: number;
  };
  legacyInstancedGroups.forEach((group) => {
    if (group.length < 2) return;
    const references: LegacyInstanceReference[] = [];
    group.forEach((candidate) => {
      for (let sourceInstanceId = 0; sourceInstanceId < candidate.source.count; sourceInstanceId += 1) {
        references.push({ candidate, sourceInstanceId });
      }
    });
    const outputBatchNames: string[] = [];
    const segments: LegacyInstanceReference[][] = [];
    let pending: LegacyInstanceReference[] = [];
    let pendingVertices = 0;
    let pendingIndices = 0;
    const pendingGeometrySignatures = new Set<string>();
    const flushSegment = () => {
      if (pending.length) segments.push(pending);
      pending = [];
      pendingVertices = 0;
      pendingIndices = 0;
      pendingGeometrySignatures.clear();
    };
    references.forEach((reference) => {
      const geometry = reference.candidate.source.geometry;
      const geometrySignature = reusableGeometrySignature(geometry);
      const newGeometry = !pendingGeometrySignatures.has(geometrySignature);
      const nextVertices = newGeometry ? (geometry.getAttribute('position')?.count ?? 0) : 0;
      const nextIndices = newGeometry ? (geometry.index?.count ?? nextVertices) : 0;
      if (pending.length > 0 && (
        pending.length >= MAX_CONSOLIDATED_LEGACY_INSTANCES
        || pendingVertices + nextVertices > MAX_RUNTIME_BATCH_VERTICES
        || pendingIndices + nextIndices > MAX_RUNTIME_BATCH_INDICES
      )) flushSegment();
      pending.push(reference);
      if (newGeometry) {
        pendingGeometrySignatures.add(geometrySignature);
        pendingVertices += nextVertices;
        pendingIndices += nextIndices;
      }
    });
    flushSegment();
    segments.forEach((segment) => {
      if (!segment.length) return;
      const first = segment[0].candidate;
      const material = first.material.clone();
      material.userData = { ...first.material.userData };
      if (material instanceof THREE.MeshStandardMaterial) {
        material.roughness = canonicalBatchScalar(material.roughness);
        material.metalness = canonicalBatchScalar(material.metalness);
        material.emissiveIntensity = canonicalBatchScalar(material.emissiveIntensity);
      }
      const applyInstanceColors = first.supportsInstanceColor;
      if (applyInstanceColors) {
        (material as THREE.Material & { color?: THREE.Color }).color?.set(0xffffff);
      }
      const geometrySignatures = new Set(segment.map(({ candidate }) => reusableGeometrySignature(candidate.source.geometry)));
      const heterogeneous = geometrySignatures.size > 1;
      let batch: THREE.InstancedMesh | THREE.BatchedMesh;
      let batchKind: RuntimeBatchRecord['kind'];
      const batchedGeometryIds = new Map<string, number>();
      if (backend === 'batched-mesh-multi-draw' && heterogeneous) {
        const geometries = new Map<string, THREE.BufferGeometry>();
        segment.forEach(({ candidate }) => {
          const signature = reusableGeometrySignature(candidate.source.geometry);
          if (!geometries.has(signature)) geometries.set(signature, candidate.source.geometry);
        });
        const maximumVertices = Array.from(geometries.values()).reduce(
          (sum, geometry) => sum + (geometry.getAttribute('position')?.count ?? 0),
          0,
        );
        const maximumIndices = Array.from(geometries.values()).reduce(
          (sum, geometry) => sum + (geometry.index?.count ?? geometry.getAttribute('position')?.count ?? 0),
          0,
        );
        const batched = new THREE.BatchedMesh(segment.length, maximumVertices, maximumIndices, material);
        geometries.forEach((geometry, signature) => {
          batchedGeometryIds.set(signature, batched.addGeometry(geometry));
          estimatedGeometryBytes += geometryByteEstimate(geometry);
        });
        batched.perObjectFrustumCulled = true;
        batched.sortObjects = !isOpaqueMaterial(material);
        batch = batched;
        batchKind = 'batched';
      } else {
        batch = new THREE.InstancedMesh(first.source.geometry, material, segment.length);
        batchKind = 'instanced';
        estimatedGeometryBytes += geometryByteEstimate(first.source.geometry);
      }
      batch.name = `${root.name}__GPU_LEGACY_INSTANCE_BATCH_${++batchIndex}`;
      outputBatchNames.push(batch.name);
      const rootInverse = root.matrixWorld.clone().invert();
      const selectableIds: string[] = [];
      const semanticIds: string[] = [];
      const sourceNames: string[] = [];
      const sourceInstanceIds: number[] = [];
      const entries: RuntimeBatchEntry[] = [];
      const sourceMetadata = new Map<THREE.InstancedMesh, {
        originalParent: THREE.Object3D;
        originalIndex: number;
        sourceToOwner: THREE.Matrix4;
      }>();
      segment.forEach(({ candidate, sourceInstanceId }, outputInstanceId) => {
        const { source, semanticOwner } = candidate;
        source.updateWorldMatrix(true, false);
        source.getMatrixAt(sourceInstanceId, legacyInstanceMatrix);
        const sourceInstanceMatrix = legacyInstanceMatrix.clone();
        const localMatrix = new THREE.Matrix4()
          .multiplyMatrices(rootInverse, source.matrixWorld)
          .multiply(sourceInstanceMatrix);
        let resolvedInstanceId = outputInstanceId;
        if (batch instanceof THREE.BatchedMesh) {
          const geometrySignature = reusableGeometrySignature(source.geometry);
          resolvedInstanceId = batch.addInstance(batchedGeometryIds.get(geometrySignature)!);
        }
        batch.setMatrixAt(resolvedInstanceId, localMatrix);
        if (applyInstanceColors) {
          const baseColor = (source.material as THREE.Material & { color?: THREE.Color }).color;
          legacyEffectiveColor.copy(baseColor instanceof THREE.Color ? baseColor : legacyInstanceColor.set(0xffffff));
          if (source.instanceColor) {
            source.getColorAt(sourceInstanceId, legacyInstanceColor);
            legacyEffectiveColor.multiply(legacyInstanceColor);
          }
          batch.setColorAt(resolvedInstanceId, legacyEffectiveColor);
        }
        const cached = sourceMetadata.get(source) ?? (() => {
          const originalParent = source.parent ?? semanticOwner;
          const metadata = {
            originalParent,
            originalIndex: originalParent.children.indexOf(source),
            sourceToOwner: new THREE.Matrix4().multiplyMatrices(
              semanticOwner.matrixWorld.clone().invert(),
              source.matrixWorld,
            ),
          };
          sourceMetadata.set(source, metadata);
          return metadata;
        })();
        const selectableId = resolveSourceSelectableId(source, semanticOwner, root);
        const semanticId = String(source.userData.semanticId ?? source.userData.featureTag ?? source.name);
        selectableIds.push(selectableId);
        semanticIds.push(semanticId);
        sourceNames.push(source.name);
        sourceInstanceIds.push(sourceInstanceId);
        entries.push({
          source,
          semanticOwner,
          visibilityOwner: cached.originalParent,
          originalParent: cached.originalParent,
          originalIndex: cached.originalIndex,
          sourceToOwner: cached.sourceToOwner.clone(),
          localMatrix,
          instanceId: resolvedInstanceId,
          sourceInstanceId,
          sourceInstanceMatrix,
          importance: 'mandatory',
          microVisible: true,
          parentVisible: true,
          lastMicroChangeSeconds: Number.NEGATIVE_INFINITY,
        });
      });
      if (batch instanceof THREE.InstancedMesh) {
        batch.instanceMatrix.needsUpdate = true;
        if (batch.instanceColor) batch.instanceColor.needsUpdate = true;
      }
      batch.computeBoundingBox();
      batch.computeBoundingSphere();
      const highQualityShadowEligible = segment.some(({ candidate }) => candidate.source.userData.highQualityShadowEligible === true);
      batch.castShadow = highQualityShadowEligible;
      batch.receiveShadow = first.source.receiveShadow;
      batch.renderOrder = first.source.renderOrder;
      batch.layers.mask = first.source.layers.mask;
      batch.userData.selectableId = selectableIds[0] || root.userData.selectableId;
      batch.userData.gpuRuntimeBatch = true;
      batch.userData.exportExcluded = true;
      batch.userData.packageWideBatch = true;
      batch.userData.legacyInstancedConsolidation = true;
      batch.userData.legacyHeterogeneousConsolidation = heterogeneous;
      batch.userData.batchSelectableIds = selectableIds;
      batch.userData.batchSemanticIds = semanticIds;
      batch.userData.batchSourceNames = sourceNames;
      batch.userData.batchSourceInstanceIds = sourceInstanceIds;
      batch.userData.batchRenderImportance = entries.map(() => 'mandatory');
      batch.userData.highQualityShadowEligible = highQualityShadowEligible;
      batch.userData.batchedTriangleCount = Math.round(segment.reduce((sum, { candidate }) => {
        const geometry = candidate.source.geometry;
        return sum + (geometry.index?.count ?? geometry.getAttribute('position')?.count ?? 0) / 3;
      }, 0));
      batch.userData.gpuBatchingBackend = backend;
      batch.userData.exportSemanticMetadata = true;
      root.add(batch);
      runtimeBatches.push({
        batch,
        entries,
        kind: batchKind,
        packageWide: true,
        opaque: isOpaqueMaterial(material),
        owner: root,
        dynamicTransforms: false,
        rebuildRequired: false,
      });
    });
    group.forEach(({ source }) => {
      source.visible = false;
      source.userData.gpuBatchSource = true;
      source.userData.batchedInto = outputBatchNames[0] ?? '';
      source.userData.batchedIntoBatches = outputBatchNames;
      source.userData.renderImportance = 'mandatory';
      source.userData.legacyInstancedSource = true;
      delete source.userData.streamingBudgetSuppressed;
    });
    batchedSourceCount += group.length;
  });

  // The first pass keeps material/emissive distinctions conservative while it
  // captures exact source metadata. Collapse the compatible immutable records
  // afterwards by baking those remaining per-record colours into attributes.
  // This preserves authored appearance and semantics while reducing package
  // submission; mandatory architecture is never removed to satisfy the cap.
  collapseCompatibleMergedBatches(runtimeBatches, root);

  const runtimeAnimationBindings = new Map<THREE.Object3D, RuntimeAnimationBinding[]>();
  runtimeBatches.forEach((record) => record.entries.forEach((entry) => {
    if (!entry.animationOwner) return;
    const bindings = runtimeAnimationBindings.get(entry.animationOwner) ?? [];
    bindings.push({ record, entry });
    runtimeAnimationBindings.set(entry.animationOwner, bindings);
  }));

  // Explicit micro tags that were unsafe to batch are managed directly. An
  // initially hidden source is never adopted, so editor/cutaway intent wins.
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)
      || object.userData.gpuRuntimeBatch === true
      || object.userData.gpuBatchSource === true
      || !object.visible
      || resolveRenderImportance(object, root) !== 'micro') return;
    object.userData.renderImportance = 'micro';
    microSources.push({ object, visible: true, lastChangeSeconds: Number.NEGATIVE_INFINITY });
  });

  // Older editor/audit consumers discover representation metadata by walking
  // each facility. Keep one zero-geometry, non-rendered semantic anchor per
  // facility while the real draw batch remains package-wide.
  const runtimeSourcesByOwner = new Map<THREE.Object3D, RuntimeBatchEntry[]>();
  root.traverse((object) => {
    if (object === root) return;
    if (object.userData.exteriorProgram === true
      || object.userData.academicFacility === true
      || object.userData.authoredExteriorBuilding === true
      || (typeof object.userData.facilityForm === 'string' && typeof object.userData.individualSelectableId === 'string')) {
      runtimeSourcesByOwner.set(object, []);
    }
  });
  const runtimeBatchByEntry = new Map<RuntimeBatchEntry, RuntimeBatchRecord>();
  runtimeBatches.forEach((record) => {
    record.entries.forEach((entry) => {
      runtimeBatchByEntry.set(entry, record);
      if (entry.semanticOwner === root) return;
      const entries = runtimeSourcesByOwner.get(entry.semanticOwner) ?? [];
      entries.push(entry);
      runtimeSourcesByOwner.set(entry.semanticOwner, entries);
    });
  });
  runtimeSourcesByOwner.forEach((entries, owner) => {
    const ownerSelectableId = String(owner.userData.individualSelectableId ?? owner.userData.selectableId ?? '');
    const selectableIds = entries.map((entry) => resolveSourceSelectableId(entry.source, entry.semanticOwner, root));
    const sourceNames = entries.map((entry) => entry.source.name);
    const batchNames = entries.map((entry) => runtimeBatchByEntry.get(entry)?.batch.name ?? '');
    const semanticIds = entries.map((entry) => String(
      entry.source.userData.semanticId ?? entry.source.userData.featureTag ?? entry.source.name,
    ));
    const renderImportance = entries.map((entry) => entry.importance);
    const anchor = new THREE.Group();
    anchor.name = `${owner.name || owner.uuid}__GPU_BATCH_METADATA`;
    anchor.visible = false;
    anchor.frustumCulled = false;
    anchor.userData.gpuRuntimeBatch = true;
    anchor.userData.gpuBatchMetadataAnchor = true;
    anchor.userData.exportExcluded = true;
    anchor.userData.selectableId = ownerSelectableId;
    anchor.userData.semanticOwnerName = owner.name;
    anchor.userData.batchSourceNames = sourceNames;
    anchor.userData.batchNames = batchNames;
    anchor.userData.batchSelectableIds = selectableIds;
    anchor.userData.batchSemanticIds = semanticIds;
    anchor.userData.batchRenderImportance = renderImportance;
    anchor.userData.manifestVersion = 1;
    owner.add(anchor);
    const authoredAnchor = new THREE.Group();
    authoredAnchor.name = `${owner.name || owner.uuid}__AUTHORITY_METADATA`;
    authoredAnchor.visible = false;
    authoredAnchor.frustumCulled = false;
    authoredAnchor.userData.gpuAuthoredMetadataAnchor = true;
    authoredAnchor.userData.exportExcluded = true;
    owner.add(authoredAnchor);
  });

  root.updateWorldMatrix(true, true);
  const authoredOwners = new Set<THREE.Object3D>(runtimeSourcesByOwner.keys());
  runtimeBatches.forEach((record) => record.entries.forEach((entry) => authoredOwners.add(entry.semanticOwner)));
  authoredOwners.add(root);
  authoredOwners.forEach((owner) => {
    const worldBounds = new THREE.Box3().setFromObject(owner, true);
    if (worldBounds.isEmpty()) return;
    owner.userData.authoredWorldBounds = worldBounds.clone();
    owner.userData.authoredLocalBounds = worldBounds.clone().applyMatrix4(owner.matrixWorld.clone().invert());
    owner.userData.authoredBoundsVersion = 1;
  });

  const authorityRoot = new THREE.Group();
  authorityRoot.name = `${root.name}__DETACHED_AUTHORING_AUTHORITY`;
  // Detached roots are not render-traversed, so they can remain visible for
  // collision systems that intentionally honor ancestor visibility.
  authorityRoot.visible = true;
  authorityRoot.matrixAutoUpdate = false;
  authorityRoot.matrix.identity();
  authorityRoot.matrixWorld.identity();
  authorityRoot.userData.packageOwnedAuthorityRoot = true;
  authorityRoot.userData.exportExcluded = true;
  const authoritySources: RuntimeBatchEntry[] = [];
  const detachedSourceObjects = new Set<THREE.Mesh>();
  runtimeBatches.forEach((record) => record.entries.forEach((entry) => {
    if (detachedSourceObjects.has(entry.source)) return;
    detachedSourceObjects.add(entry.source);
    authoritySources.push(entry);
  }));
  authoritySources.forEach((entry) => {
    authorityRoot.add(entry.source);
    entry.source.matrixWorldAutoUpdate = false;
    entry.source.matrixWorld.multiplyMatrices(entry.semanticOwner.matrixWorld, entry.sourceToOwner);
    entry.source.matrixWorldNeedsUpdate = false;
  });

  const stats: PackageBatchingStats = {
    backend,
    batchCount: runtimeBatches.length,
    batchedSourceCount,
    retainedSourceCount,
    estimatedGeometryBytes,
    estimatedTextureBytes: Array.from(retainedTextures).reduce((sum, texture) => sum + textureByteEstimate(texture), 0),
    instancedBatchCount: runtimeBatches.filter((record) => record.kind === 'instanced').length,
    batchedMeshBatchCount: runtimeBatches.filter((record) => record.kind === 'batched').length,
    mergedBatchCount: runtimeBatches.filter((record) => record.kind === 'merged').length,
    largestBatchInstances: runtimeBatches.reduce((maximum, record) => Math.max(maximum, record.entries.length), 0),
    largestBatchVertices: runtimeBatches.reduce((maximum, record) => Math.max(
      maximum,
      record.batch.geometry.getAttribute('position')?.count ?? 0,
    ), 0),
    largestBatchIndices: runtimeBatches.reduce((maximum, record) => Math.max(maximum, record.batch.geometry.index?.count ?? 0), 0),
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
  return {
    stats,
    runtimeBatches,
    runtimeAnimationBindings,
    authorityRoot,
    authoritySources,
    microSources,
    renderImportance: {
      mandatory: mandatoryCount,
      micro: microCount,
      visibleMicro: microSources.length,
      culledMicro: Math.max(0, microCount - microSources.length),
    },
  };
}

function setRuntimeBatchEntryVisible(record: RuntimeBatchRecord, entry: RuntimeBatchEntry, visible: boolean) {
  const combinedVisible = visible && entry.parentVisible && entry.microVisible;
  if (record.kind === 'batched' && record.batch instanceof THREE.BatchedMesh) {
    record.batch.setVisibleAt(entry.instanceId, combinedVisible);
  } else if (record.kind === 'instanced' && record.batch instanceof THREE.InstancedMesh) {
    record.batch.setMatrixAt(entry.instanceId, combinedVisible ? entry.localMatrix : hiddenInstanceMatrix);
    record.batch.instanceMatrix.needsUpdate = true;
  } else if (record.kind === 'merged') {
    if (record.packageWide) {
      // A package-wide merge has no per-entry visibility channel. Surface the
      // required rebuild instead of hiding/showing unrelated architecture.
      record.rebuildRequired = true;
      record.batch.userData.runtimeBatchRebuildRequired = true;
    } else {
      // Fallback merges are scoped to one immediate authored parent and one
      // importance class, so parent visibility remains exact for the batch.
      record.batch.visible = record.entries.some((candidate) => candidate.parentVisible && candidate.microVisible);
    }
  }
}

function syncRuntimeBatches(pkg: StreamingPackage) {
  pkg.detailRoot.updateWorldMatrix(true, true);
  batchRootInverse.copy(pkg.detailRoot.matrixWorld).invert();
  pkg.runtimeBatches.forEach((record) => {
    record.entries.forEach((entry) => {
      entry.semanticOwner.updateWorldMatrix(true, false);
      entry.source.matrixWorld.multiplyMatrices(entry.semanticOwner.matrixWorld, entry.sourceToOwner);
      entry.source.matrixWorldNeedsUpdate = false;
    });
    if (!record.packageWide) return;
    let recordDirty = false;
    record.entries.forEach((entry) => {
      batchOwnerRelative.multiplyMatrices(batchRootInverse, entry.semanticOwner.matrixWorld);
      instanceMatrix.multiplyMatrices(batchOwnerRelative, entry.sourceToOwner);
      if (entry.sourceInstanceMatrix) instanceMatrix.multiply(entry.sourceInstanceMatrix);
      if (!entry.localMatrix.equals(instanceMatrix)) {
        entry.localMatrix.copy(instanceMatrix);
        if (record.kind === 'batched' && record.batch instanceof THREE.BatchedMesh) {
          record.batch.setMatrixAt(entry.instanceId, entry.localMatrix);
        } else if (record.kind === 'instanced' && record.batch instanceof THREE.InstancedMesh) {
          record.batch.setMatrixAt(
            entry.instanceId,
            entry.parentVisible && entry.microVisible ? entry.localMatrix : hiddenInstanceMatrix,
          );
          record.batch.instanceMatrix.needsUpdate = true;
        } else if (record.kind === 'merged') {
          record.rebuildRequired = true;
          record.batch.userData.runtimeBatchRebuildRequired = true;
        }
        recordDirty = true;
      }
      const nextParentVisible = objectChainVisible(entry.visibilityOwner, pkg.detailRoot);
      if (nextParentVisible !== entry.parentVisible) {
        entry.parentVisible = nextParentVisible;
        setRuntimeBatchEntryVisible(record, entry, true);
        recordDirty = true;
      }
    });
    if (recordDirty && record.kind === 'batched' && record.batch instanceof THREE.BatchedMesh) {
      record.batch.computeBoundingBox();
      record.batch.computeBoundingSphere();
    } else if (recordDirty && record.kind === 'instanced' && record.batch instanceof THREE.InstancedMesh) {
      record.batch.computeBoundingBox();
      record.batch.computeBoundingSphere();
    }
  });
  const authoredOwners = new Set<THREE.Object3D>([pkg.detailRoot]);
  pkg.authoritySources.forEach((entry) => authoredOwners.add(entry.semanticOwner));
  authoredOwners.forEach((owner) => {
    const localBounds = owner.userData.authoredLocalBounds as THREE.Box3 | undefined;
    if (!(localBounds instanceof THREE.Box3)) return;
    const worldBounds = owner.userData.authoredWorldBounds instanceof THREE.Box3
      ? owner.userData.authoredWorldBounds as THREE.Box3
      : new THREE.Box3();
    worldBounds.copy(localBounds).applyMatrix4(owner.matrixWorld);
    owner.userData.authoredWorldBounds = worldBounds;
  });
  const rebuildRequired = pkg.runtimeBatches.some((record) => record.rebuildRequired);
  pkg.detailRoot.userData.runtimeBatchRebuildRequired = rebuildRequired;
  return rebuildRequired;
}

function projectedObjectPixels(object: THREE.Object3D, camera: THREE.Camera, viewportHeightPixels: number) {
  const mesh = object as THREE.Mesh;
  if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
  const localRadius = mesh.geometry.boundingSphere?.radius ?? 0;
  object.getWorldPosition(microWorldPosition);
  object.getWorldScale(microWorldScale);
  const radius = localRadius * Math.max(microWorldScale.x, microWorldScale.y, microWorldScale.z);
  if (radius <= 0 || viewportHeightPixels <= 0) return 0;
  if (camera instanceof THREE.PerspectiveCamera) {
    const distance = Math.max(camera.near, camera.position.distanceTo(microWorldPosition));
    return radius * 2 * viewportHeightPixels / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) * distance);
  }
  if (camera instanceof THREE.OrthographicCamera) {
    return radius * 2 * viewportHeightPixels * camera.zoom / Math.max(0.0001, camera.top - camera.bottom);
  }
  return Number.POSITIVE_INFINITY;
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
  private residentPackageIdsByPriority: string[] = [];
  private navigationResidencyRevision = 0;
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
  private fullIslandSwapScheduled = false;
  private readonly fullIslandReadySwapQueue: Array<() => void> = [];
  private currentFullIslandPackageId: string | null = null;
  private prioritySequence = 0;
  private readonly manualPackagePriorities = new Map<string, number>();
  private lastUpdateContext: StreamingUpdateContext | null = null;
  private readonly lastVisiblePackageIds: string[] = [];
  private readonly gpuPulseTimeUniforms = new Map<string, { value: number }>();
  private readonly highQualityShadowPackageIds = new Set<string>();
  private gpuWarmupHandler: ((
    packageId: string,
    detailRoot: THREE.Group,
    onWarmStart: () => void,
  ) => void | Promise<void>) | null = null;

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

  /**
   * Optional renderer integration used to compile shaders or render an
   * offscreen warm-up scene. Atomic Detail activation waits for this callback
   * and one subsequent frame boundary.
   */
  setGpuWarmupHandler(handler: ((
    packageId: string,
    detailRoot: THREE.Group,
    onWarmStart: () => void,
  ) => void | Promise<void>) | null) {
    this.gpuWarmupHandler = handler;
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

    configureGpuPulseAnimations(detailRoot, this.gpuPulseTimeUniforms);
    enforcePackageAnimationBudget(detailRoot);
    enforcePackageShadowPolicy(detailRoot);
    const batching = batchStaticPackageMeshes(detailRoot, this.batchingBackend);
    const fullIslandDisabledLights = collectFullIslandExteriorLights(detailRoot);
    if (this.detailPolicy === 'full-island') {
      fullIslandDisabledLights.forEach(({ light }) => { light.visible = false; });
    }
    detailRoot.userData.runtimeBatchRebuildRequired = false;

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
      lifecyclePhase: 'queued',
      loadProgress: 0,
      priorityReason: 'background',
      priorityScore: 0,
      visibleCandidate: false,
      visualLevel: 'far',
      desiredLevel: 'far',
      detailResident: false,
      pinned: false,
      distanceMetres: Number.POSITIVE_INFINITY,
      lastLevelChangeSeconds: Number.NEGATIVE_INFINITY,
      lastUsedSequence: 0,
      estimatedCost: estimatePackageCost(detailRoot),
      loadGeneration: 0,
      batching: batching.stats,
      runtimeBatches: batching.runtimeBatches,
      activationResources: collectPackageActivationResources(detailRoot, batching.runtimeBatches),
      fullIslandDisabledLights,
      runtimeAnimationBindings: batching.runtimeAnimationBindings,
      authorityRoot: batching.authorityRoot,
      authoritySources: batching.authoritySources,
      authorityMountDepth: 0,
      microSources: batching.microSources,
      renderImportance: batching.renderImportance,
      lastRuntimeBatchSyncSeconds: Number.NEGATIVE_INFINITY,
    });
    midProxy.visible = false;
    farProxy.visible = this.packageLayerEnabled(this.packages.get(definition.id)!);
    return detailEnvelope;
  }

  private unregister(id: string) {
    const previous = this.packages.get(id);
    if (!previous) return;
    previous.loadGeneration += 1;
    if (previous.detailResident || previous.pinned) this.navigationResidencyRevision += 1;
    // Return authority leaves permanently before releasing the package record,
    // so re-registering the same authored root cannot lose geometry.
    this.mountPackageAuthoritySources(id);
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
    this.manualPackagePriorities.delete(id);
    this.packages.delete(id);
    this.fullIslandLoadQueue = this.fullIslandLoadQueue.filter((packageId) => packageId !== id);
    this.refreshCurrentFullIslandPackageId();
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

  /** Limit expensive High-quality shadows to the selected/nearest packages. */
  setHighQualityShadowPackages(ids: readonly string[]) {
    this.highQualityShadowPackageIds.clear();
    ids.forEach((id) => { if (this.packages.has(id)) this.highQualityShadowPackageIds.add(id); });
    this.packages.forEach((pkg) => {
      const enabled = this.highQualityShadowPackageIds.has(pkg.id);
      pkg.runtimeBatches.forEach((record) => {
        record.batch.castShadow = enabled && record.batch.userData.highQualityShadowEligible === true;
      });
    });
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
    this.gpuPulseTimeUniforms.forEach((uniform) => { uniform.value = elapsedSeconds; });
  }

  /** Cached detached transform-animation owners for the package scheduler. */
  getRuntimeAnimatedObjects(): THREE.Object3D[] {
    const objects: THREE.Object3D[] = [];
    this.packages.forEach((pkg) => {
      pkg.runtimeAnimationBindings.forEach((_bindings, object) => {
        object.userData.runtimeAnimationPackageId = pkg.id;
        object.userData.runtimeBatchedAnimation = true;
        objects.push(object);
      });
    });
    return objects;
  }

  /**
   * Upload only matrices whose CPU animation ran this tick. This is indexed by
   * package and animation owner, so the hot path never performs an ancestry or
   * all-package scan.
   */
  syncRuntimeAnimatedObjects(objects: readonly THREE.Object3D[]) {
    const dirtyRecords = new Set<RuntimeBatchRecord>();
    objects.forEach((animationOwner) => {
      const packageId = animationOwner.userData.runtimeAnimationPackageId;
      if (typeof packageId !== 'string') return;
      const pkg = this.packages.get(packageId);
      if (!pkg?.detailResident) return;
      const bindings = pkg.runtimeAnimationBindings.get(animationOwner);
      if (!bindings?.length) return;
      animationOwner.updateWorldMatrix(true, false);
      bindings.forEach(({ record, entry }) => {
        record.owner.updateWorldMatrix(true, false);
        entry.originalParent.updateWorldMatrix(true, false);
        entry.source.updateMatrix();
        runtimeAnimatedWorld.multiplyMatrices(entry.originalParent.matrixWorld, entry.source.matrix);
        runtimeAnimatedOwnerInverse.copy(record.owner.matrixWorld).invert();
        instanceMatrix.multiplyMatrices(runtimeAnimatedOwnerInverse, runtimeAnimatedWorld);
        entry.localMatrix.copy(instanceMatrix);
        entry.source.matrixWorld.copy(runtimeAnimatedWorld);
        entry.source.matrixWorldNeedsUpdate = false;
        if (record.kind === 'batched' && record.batch instanceof THREE.BatchedMesh) {
          record.batch.setMatrixAt(entry.instanceId, entry.localMatrix);
        } else if (record.kind === 'instanced' && record.batch instanceof THREE.InstancedMesh) {
          record.batch.setMatrixAt(
            entry.instanceId,
            entry.parentVisible && entry.microVisible ? entry.localMatrix : hiddenInstanceMatrix,
          );
          record.batch.instanceMatrix.needsUpdate = true;
        }
        dirtyRecords.add(record);
      });
    });
    // Dynamic records intentionally skip aggregate bounding-box work. Their
    // package is the broad phase; BatchedMesh still culls each member.
    return dirtyRecords.size;
  }

  /**
   * Reconcile package-wide batch transforms after an authored anchor edit.
   * Static merged records are rebuilt immediately for a package-specific call;
   * callers can inspect `packageRuntimeBatchesNeedRebuild` before scheduling a
   * broader edit transaction.
   */
  syncPackageRuntimeBatches(id?: string) {
    if (id) {
      const pkg = this.packages.get(id);
      if (!pkg) return false;
      const rebuildRequired = syncRuntimeBatches(pkg);
      pkg.lastRuntimeBatchSyncSeconds = this.lastElapsedSeconds;
      return rebuildRequired ? this.rebuildPackageRuntimeBatches(id) : true;
    }
    const rebuildIds: string[] = [];
    this.packages.forEach((pkg) => {
      if (syncRuntimeBatches(pkg)) rebuildIds.push(pkg.id);
      pkg.lastRuntimeBatchSyncSeconds = this.lastElapsedSeconds;
    });
    return rebuildIds.every((packageId) => this.rebuildPackageRuntimeBatches(packageId));
  }

  packageRuntimeBatchesNeedRebuild(id: string) {
    const pkg = this.packages.get(id);
    return Boolean(pkg?.runtimeBatches.some((record) => record.rebuildRequired));
  }

  getPackagesRequiringRuntimeBatchRebuild(): readonly string[] {
    return Array.from(this.packages.values())
      .filter((pkg) => pkg.runtimeBatches.some((record) => record.rebuildRequired))
      .map((pkg) => pkg.id);
  }

  /** Infrequent Edit path: rebuild one package after material/geometry edits. */
  rebuildPackageRuntimeBatches(id: string) {
    const pkg = this.packages.get(id);
    if (!pkg || pkg.authorityMountDepth !== 0) return false;
    const restoreOldAuthority = this.mountPackageAuthoritySources(id);
    if (!restoreOldAuthority) return false;
    const oldRecords = pkg.runtimeBatches;
    const oldBatches = new Set(oldRecords.map((record) => record.batch));
    const oldMetadata: THREE.Object3D[] = [];
    pkg.detailRoot.traverse((object) => {
      if (object.userData.gpuBatchMetadataAnchor === true || object.userData.gpuAuthoredMetadataAnchor === true) {
        oldMetadata.push(object);
      }
    });
    pkg.authoritySources.forEach((entry) => {
      entry.source.visible = true;
      delete entry.source.userData.gpuBatchSource;
      delete entry.source.userData.batchedInto;
      delete entry.source.userData.batchedInstanceId;
    });
    try {
      const rebuilt = batchStaticPackageMeshes(pkg.detailRoot, this.batchingBackend);
      oldRecords.forEach((record) => {
        record.batch.removeFromParent();
        if (record.kind !== 'instanced') record.batch.geometry.dispose();
        const materials = Array.isArray(record.batch.material) ? record.batch.material : [record.batch.material];
        materials.forEach((material) => material.dispose());
      });
      oldMetadata.forEach((object) => object.removeFromParent());
      pkg.batching = rebuilt.stats;
      pkg.runtimeBatches = rebuilt.runtimeBatches;
      pkg.activationResources = collectPackageActivationResources(pkg.detailRoot, rebuilt.runtimeBatches);
      pkg.runtimeAnimationBindings = rebuilt.runtimeAnimationBindings;
      pkg.authorityRoot = rebuilt.authorityRoot;
      pkg.authoritySources = rebuilt.authoritySources;
      pkg.microSources = rebuilt.microSources;
      pkg.renderImportance = rebuilt.renderImportance;
      pkg.estimatedCost = estimatePackageCost(pkg.detailRoot);
      restoreOldAuthority();
      syncRuntimeBatches(pkg);
      pkg.detailRoot.userData.runtimeBatchRebuildRequired = false;
      this.setHighQualityShadowPackages(Array.from(this.highQualityShadowPackageIds));
      this.navigationResidencyRevision += 1;
      this.reconcileVisibility();
      return true;
    } catch (error) {
      // Remove any partial new batches, restore the proven representation, and
      // leave the edited authored leaves safely detached again.
      const partial: THREE.Object3D[] = [];
      pkg.detailRoot.traverse((object) => {
        if (object.userData.gpuRuntimeBatch === true && !oldBatches.has(object as THREE.Mesh)) partial.push(object);
        else if ((object.userData.gpuBatchMetadataAnchor === true || object.userData.gpuAuthoredMetadataAnchor === true)
          && !oldMetadata.includes(object)) partial.push(object);
      });
      partial.forEach((object) => {
        object.removeFromParent();
        if (!(object instanceof THREE.Mesh) || object.userData.gpuBatchMetadataAnchor === true || object.userData.gpuAuthoredMetadataAnchor === true) return;
        if (!(object instanceof THREE.InstancedMesh)) object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      oldRecords.forEach((record) => {
        record.entries.forEach((entry) => {
          entry.source.visible = false;
          entry.source.userData.gpuBatchSource = true;
          entry.source.userData.batchedInto = record.batch.name;
          entry.source.userData.batchedInstanceId = entry.instanceId;
        });
      });
      restoreOldAuthority();
      pkg.detailRoot.userData.runtimeBatchRebuildRequired = oldRecords.some((record) => record.rebuildRequired);
      pkg.error = error instanceof Error ? error.message : 'Unable to rebuild package GPU batches.';
      return false;
    }
  }

  /** Detached exact geometry roots for WALK/navigation broad-phase building. */
  getNavigationAuthorityRoots(): readonly THREE.Group[] {
    const roots: THREE.Group[] = [];
    this.packages.forEach((pkg) => {
      // WALK collision must become resident before an atomic proxy/detail GPU
      // swap completes. Authored collider records already exist while a nearby
      // package is queued/building/warming, so include every package requested
      // at Detail as well as currently resident or pinned packages.
      if (!pkg.detailResident && !pkg.pinned && pkg.desiredLevel !== 'detail') return;
      syncRuntimeBatches(pkg);
      roots.push(pkg.authorityRoot);
    });
    return roots;
  }

  /**
   * Temporarily restore one package's authored leaves to their exact original
   * hierarchy for Edit/export. The returned closure safely supports nesting.
   */
  mountPackageAuthoritySources(id: string): (() => void) | null {
    const pkg = this.packages.get(id);
    if (!pkg) return null;
    pkg.authorityMountDepth += 1;
    if (pkg.authorityMountDepth === 1) {
      const byParent = new Map<THREE.Object3D, RuntimeBatchEntry[]>();
      pkg.authoritySources.forEach((entry) => {
        const entries = byParent.get(entry.originalParent) ?? [];
        entries.push(entry);
        byParent.set(entry.originalParent, entries);
      });
      byParent.forEach((entries, parent) => {
        entries.sort((left, right) => left.originalIndex - right.originalIndex).forEach((entry) => {
          parent.add(entry.source);
          const currentIndex = parent.children.indexOf(entry.source);
          if (currentIndex >= 0) parent.children.splice(currentIndex, 1);
          parent.children.splice(THREE.MathUtils.clamp(entry.originalIndex, 0, parent.children.length), 0, entry.source);
          entry.source.matrixWorldAutoUpdate = true;
          entry.source.updateMatrixWorld(true);
        });
      });
    }
    let restored = false;
    return () => {
      if (restored) return;
      restored = true;
      pkg.authorityMountDepth = Math.max(0, pkg.authorityMountDepth - 1);
      if (pkg.authorityMountDepth !== 0) return;
      pkg.authoritySources.forEach((entry) => {
        pkg.authorityRoot.add(entry.source);
        entry.source.matrixWorldAutoUpdate = false;
        entry.semanticOwner.updateWorldMatrix(true, false);
        entry.source.matrixWorld.multiplyMatrices(entry.semanticOwner.matrixWorld, entry.sourceToOwner);
        entry.source.matrixWorldNeedsUpdate = false;
      });
    };
  }

  /** Restore all package authority leaves; intended for complete exterior export. */
  mountAllAuthoritySources(): () => void {
    const restores = Array.from(this.packages.keys())
      .map((id) => this.mountPackageAuthoritySources(id))
      .filter((restore): restore is () => void => Boolean(restore));
    let restored = false;
    return () => {
      if (restored) return;
      restored = true;
      for (let index = restores.length - 1; index >= 0; index -= 1) restores[index]();
    };
  }

  /**
   * Cull only explicitly tagged micro detail. The two thresholds and dwell
   * avoid visible oscillation; mandatory architecture never enters this path.
   */
  updateMicrodetailVisibility(camera: THREE.Camera, viewportHeightPixels: number, elapsedSeconds = this.lastElapsedSeconds) {
    let nearestId = this.lastUpdateContext?.nearestPackageId ?? null;
    if (!nearestId) {
      nearestId = Array.from(this.packages.values())
        .sort((left, right) => left.distanceMetres - right.distanceMetres)[0]?.id ?? null;
    }
    this.packages.forEach((pkg) => {
      const forceVisible = pkg.id === this.lastSelectedPackageId || pkg.id === nearestId;
      let visibleMicro = 0;
      pkg.microSources.forEach((record) => {
        const pixels = forceVisible ? Number.POSITIVE_INFINITY : projectedObjectPixels(record.object, camera, viewportHeightPixels);
        let desired = record.visible;
        if (pixels < 0.75) desired = false;
        else if (pixels > 0.9) desired = true;
        if (desired !== record.visible && (forceVisible || elapsedSeconds - record.lastChangeSeconds >= 0.25)) {
          record.visible = desired;
          record.lastChangeSeconds = elapsedSeconds;
          if (record.batchEntry && record.batchRecord) {
            record.batchEntry.microVisible = desired;
            record.batchEntry.lastMicroChangeSeconds = elapsedSeconds;
            setRuntimeBatchEntryVisible(record.batchRecord, record.batchEntry, true);
          } else {
            record.object.visible = desired;
          }
        }
        if (record.visible) visibleMicro += 1;
      });
      pkg.renderImportance.visibleMicro = visibleMicro;
      pkg.renderImportance.culledMicro = Math.max(0, pkg.renderImportance.micro - visibleMicro);
    });
  }

  setFullIslandDetail(enabled: boolean) {
    const nextPolicy: StreamingDetailPolicy = enabled ? 'full-island' : 'streamed';
    if (this.detailPolicy === nextPolicy) return this.isFullIslandDetail();
    this.detailPolicy = nextPolicy;
    this.packages.forEach((pkg) => this.setPackageExteriorLightsForFullIsland(pkg, enabled));
    this.fullIslandLoadQueue.length = 0;
    this.fullIslandLoadPumpActive = false;
    this.currentFullIslandPackageId = null;
    if (enabled) {
      this.packages.forEach((pkg) => {
        pkg.desiredLevel = 'detail';
        if (pkg.loadState === 'unloaded') this.setLifecycle(pkg, 'queued', 0);
        if (pkg.loadState === 'loaded') {
          if (pkg.lifecyclePhase !== 'degraded') this.setLifecycle(pkg, 'ready', 1);
          pkg.visualLevel = 'detail';
        }
      });
      this.activeDetailLimit = this.packages.size;
      if (this.lastUpdateContext) this.updateFullIslandPriorities(this.lastUpdateContext);
      else this.rebuildFullIslandLoadQueue();
      this.pumpFullIslandLoadQueue();
      this.reconcileVisibility();
    } else {
      this.packages.forEach((pkg) => {
        if (pkg.loadState === 'loading') this.cancelPackageLoad(pkg);
      });
      this.manualPackagePriorities.clear();
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

  private setPackageExteriorLightsForFullIsland(pkg: StreamingPackage, fullIsland: boolean) {
    pkg.fullIslandDisabledLights.forEach(({ light, originalVisible }) => {
      light.visible = fullIsland ? false : originalVisible;
    });
  }

  private detailLimit(mode: StreamingViewMode) {
    if (this.detailPolicy === 'full-island') return this.packages.size;
    if (mode === 'plan') return 0;
    if (mode === 'edit') return 1;
    const base = mode === 'walk' ? 5 : 3;
    return Math.max(1, base - this.adaptiveDetailPenalty);
  }

  private setLifecycle(pkg: StreamingPackage, phase: StreamingLifecyclePhase, progress = pkg.loadProgress) {
    pkg.lifecyclePhase = phase;
    pkg.loadProgress = THREE.MathUtils.clamp(progress, 0, 1);
    if (phase === 'queued') {
      pkg.loadState = 'unloaded';
      this.loadedPackageIds.delete(pkg.id);
    } else if (phase === 'building' || phase === 'warming-gpu') {
      pkg.loadState = 'loading';
      this.loadedPackageIds.delete(pkg.id);
    } else if (phase === 'ready' || phase === 'degraded') {
      pkg.loadState = 'loaded';
      pkg.loadProgress = 1;
      this.loadedPackageIds.add(pkg.id);
    } else {
      pkg.loadState = 'error';
      this.loadedPackageIds.delete(pkg.id);
    }
  }

  private rebuildFullIslandLoadQueue() {
    if (this.detailPolicy !== 'full-island') return;
    this.fullIslandLoadQueue = Array.from(this.packages.values())
      .filter((pkg) => pkg.lifecyclePhase === 'queued')
      .sort((left, right) => right.priorityScore - left.priorityScore || left.distanceMetres - right.distanceMetres)
      .map((pkg) => pkg.id);
  }

  private refreshCurrentFullIslandPackageId() {
    this.currentFullIslandPackageId = Array.from(this.packages.values())
      .filter((pkg) => pkg.lifecyclePhase === 'building' || pkg.lifecyclePhase === 'warming-gpu')
      .sort((left, right) => right.priorityScore - left.priorityScore || left.distanceMetres - right.distanceMetres)[0]?.id ?? null;
  }

  private updateFullIslandPriorities(context: StreamingUpdateContext) {
    const visibleIds = context.visiblePackageIds ? new Set(context.visiblePackageIds) : null;
    let nearestId = context.nearestPackageId ?? null;
    if (!nearestId) {
      nearestId = Array.from(this.packages.values())
        .sort((left, right) => left.distanceMetres - right.distanceMetres)[0]?.id ?? null;
    }
    this.packages.forEach((pkg) => {
      let visibleCandidate = visibleIds?.has(pkg.id) ?? false;
      if (!visibleIds && context.cameraDirection) {
        const toX = pkg.anchor.x - context.cameraPosition.x;
        const toZ = pkg.anchor.z - context.cameraPosition.z;
        const magnitude = Math.hypot(toX, toZ) || 1;
        visibleCandidate = (toX * context.cameraDirection.x + toZ * context.cameraDirection.z) / magnitude > 0.15;
      }
      pkg.visibleCandidate = visibleCandidate;
      const manualSequence = this.manualPackagePriorities.get(pkg.id);
      if (context.selectedPackageId === pkg.id || context.interiorPackageId === pkg.id) {
        pkg.priorityReason = 'selected';
        pkg.priorityScore = 1_000_000 - pkg.distanceMetres;
      } else if (manualSequence !== undefined) {
        pkg.priorityReason = 'manual';
        pkg.priorityScore = 900_000 + manualSequence;
      } else if (visibleCandidate) {
        pkg.priorityReason = 'visible';
        pkg.priorityScore = 700_000 - pkg.distanceMetres;
      } else if (nearestId === pkg.id) {
        pkg.priorityReason = 'nearest';
        pkg.priorityScore = 500_000 - pkg.distanceMetres;
      } else {
        pkg.priorityReason = 'background';
        pkg.priorityScore = -pkg.distanceMetres;
      }
    });
    this.rebuildFullIslandLoadQueue();
    this.preemptFullIslandLoadForPriority();
  }

  private preemptFullIslandLoadForPriority() {
    const next = this.packages.get(this.fullIslandLoadQueue[0]);
    const active = Array.from(this.packages.values())
      .filter((pkg) => pkg.lifecyclePhase === 'building')
      .sort((left, right) => left.priorityScore - right.priorityScore || right.distanceMetres - left.distanceMetres)[0];
    if (!active || !next) return;
    const urgent = next.priorityReason === 'selected' || next.priorityReason === 'manual';
    if (!urgent || next.priorityScore <= active.priorityScore + 100_000 || active.loadProgress >= 0.85) return;
    this.cancelPackageLoad(active);
    this.rebuildFullIslandLoadQueue();
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
    this.residentPackageIdsByPriority = Array.from(this.packages.values())
      .filter((pkg) => pkg.detailResident)
      .sort((left, right) => Number(right.pinned) - Number(left.pinned)
        || right.priorityScore - left.priorityScore
        || left.distanceMetres - right.distanceMetres)
      .map((pkg) => pkg.id);
    if (changed) this.navigationResidencyRevision += 1;
    return changed;
  }

  /** Monotonic signal for collision/navigation residency changes. */
  getNavigationResidencyRevision() {
    return this.navigationResidencyRevision;
  }

  /** Cached order for animation scheduling; does not allocate a snapshot. */
  getResidentPackageIdsByPriority(): readonly string[] {
    return this.residentPackageIdsByPriority;
  }

  private markLoaded(pkg: StreamingPackage) {
    pkg.error = undefined;
    pkg.degradedReason = this.batchingBackend === 'instanced-merge-fallback'
      ? 'WEBGL_multi_draw unavailable; using the instanced and merged fallback.'
      : undefined;
    // A safe fallback is still fully usable Detail, not a failed lifecycle.
    // Capability degradation remains explicit telemetry on the package.
    this.setLifecycle(pkg, 'ready', 1);
    pkg.lastUsedSequence = ++this.usageSequence;
    this.refreshCurrentFullIslandPackageId();
  }

  private enqueuePackageReadySwap(finish: () => void) {
    const scheduleFrame = (callback: () => void) => {
      const hidden = typeof globalThis.document !== 'undefined' && globalThis.document.hidden;
      if (!hidden && typeof globalThis.requestAnimationFrame === 'function') {
        globalThis.requestAnimationFrame(() => callback());
      } else {
        globalThis.setTimeout(callback, 16);
      }
    };
    if (this.detailPolicy !== 'full-island') {
      scheduleFrame(finish);
      return;
    }
    this.fullIslandReadySwapQueue.push(finish);
    if (this.fullIslandSwapScheduled) return;
    const drain = () => {
      this.fullIslandSwapScheduled = false;
      this.fullIslandReadySwapQueue.shift()?.();
      if (!this.fullIslandReadySwapQueue.length) return;
      this.fullIslandSwapScheduled = true;
      scheduleFrame(drain);
    };
    this.fullIslandSwapScheduled = true;
    scheduleFrame(drain);
  }

  private schedulePackageLoad(pkg: StreamingPackage) {
    if (pkg.loadState === 'loading' || pkg.loadState === 'loaded') return;
    this.setLifecycle(pkg, 'building', 0.02);
    pkg.error = undefined;
    const generation = ++pkg.loadGeneration;
    if (this.detailPolicy === 'full-island') this.refreshCurrentFullIslandPackageId();
    const resources = pkg.activationResources;
    let cursor = 0;
    const fail = (error: unknown) => {
      if (generation !== pkg.loadGeneration) return;
      this.setLifecycle(pkg, 'error', pkg.loadProgress);
      pkg.error = error instanceof Error ? error.message : 'Unable to activate package detail.';
      pkg.visualLevel = pkg.desiredLevel === 'far' ? 'far' : 'mid';
      this.refreshCurrentFullIslandPackageId();
      this.reconcileVisibility();
      if (this.detailPolicy === 'full-island') this.pumpFullIslandLoadQueue();
    };
    const completeAfterFrameBoundary = () => {
      const finish = () => {
        if (generation !== pkg.loadGeneration) return;
        try {
          syncRuntimeBatches(pkg);
          pkg.lastRuntimeBatchSyncSeconds = this.lastElapsedSeconds;
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
          fail(error);
        }
      };
      this.enqueuePackageReadySwap(finish);
    };
    const warmGpu = () => {
      if (generation !== pkg.loadGeneration) return;
      // Touch runtime batch buffers before the renderer callback so compile or
      // offscreen warm-up can upload complete geometry in a bounded phase.
      pkg.runtimeBatches.forEach((record) => {
        record.batch.geometry.getAttribute('position');
        const materials = Array.isArray(record.batch.material) ? record.batch.material : [record.batch.material];
        materials.forEach((material) => material.customProgramCacheKey());
      });
      try {
        const onWarmStart = () => {
          if (generation !== pkg.loadGeneration) return;
          this.setLifecycle(pkg, 'warming-gpu', 0.9);
          this.refreshCurrentFullIslandPackageId();
        };
        const warmup = this.gpuWarmupHandler
          ? this.gpuWarmupHandler(pkg.id, pkg.detailRoot, onWarmStart)
          : (onWarmStart(), undefined);
        Promise.resolve(warmup)
          .then(completeAfterFrameBoundary)
          .catch(fail);
      } catch (error) {
        fail(error);
      }
    };
    const buildSlice = () => {
      if (generation !== pkg.loadGeneration) return;
      if (this.detailPolicy === 'streamed' && pkg.desiredLevel === 'far') {
        this.setLifecycle(pkg, 'queued', 0);
        this.refreshCurrentFullIslandPackageId();
        return;
      }
      try {
        const startedAt = performance.now();
        while (cursor < resources.length && performance.now() - startedAt < 4) {
          // Accessing package-owned resources here deliberately warms object
          // metadata in bounded slices. Future authored packages can replace
          // this descriptor activation with their asynchronous detail factory.
          const object = resources[cursor++];
          if (object instanceof THREE.Mesh) object.geometry.getAttribute('position');
        }
        pkg.loadProgress = resources.length ? Math.min(0.85, cursor / resources.length * 0.85) : 0.85;
        if (cursor < resources.length) {
          globalThis.setTimeout(buildSlice, 0);
          return;
        }
        if (generation !== pkg.loadGeneration) return;
        warmGpu();
      } catch (error) {
        fail(error);
      }
    };
    globalThis.setTimeout(buildSlice, 0);
  }

  private cancelPackageLoad(pkg: StreamingPackage) {
    if (pkg.loadState !== 'loading') return;
    pkg.loadGeneration += 1;
    this.setLifecycle(pkg, 'queued', 0);
    this.refreshCurrentFullIslandPackageId();
  }

  private pumpFullIslandLoadQueue() {
    if (this.detailPolicy !== 'full-island' || this.fullIslandLoadPumpActive) return;
    const activeCount = Array.from(this.packages.values()).filter(
      (pkg) => pkg.lifecyclePhase === 'building' || pkg.lifecyclePhase === 'warming-gpu',
    ).length;
    if (activeCount >= FULL_ISLAND_MAX_CONCURRENT_LOADS) return;
    this.rebuildFullIslandLoadQueue();
    this.fullIslandLoadPumpActive = true;
    try {
      let availableSlots = FULL_ISLAND_MAX_CONCURRENT_LOADS - activeCount;
      while (availableSlots > 0) {
        let next: StreamingPackage | undefined;
        while (this.fullIslandLoadQueue.length && !next) {
          const id = this.fullIslandLoadQueue.shift()!;
          const pkg = this.packages.get(id);
          if (pkg?.lifecyclePhase === 'queued') next = pkg;
        }
        if (!next) break;
        this.schedulePackageLoad(next);
        availableSlots -= 1;
      }
      this.refreshCurrentFullIslandPackageId();
    } finally {
      this.fullIslandLoadPumpActive = false;
    }
  }

  private evictLoadedPackages(protectedIds: ReadonlySet<string>) {
    if (this.detailPolicy === 'full-island') return;
    while (this.loadedPackageIds.size > this.cacheCapacity) {
      const candidate = Array.from(this.loadedPackageIds)
        .map((id) => this.packages.get(id))
        .filter((pkg): pkg is StreamingPackage => Boolean(pkg) && !protectedIds.has(pkg!.id) && !pkg!.pinned)
        .sort((a, b) => a.lastUsedSequence - b.lastUsedSequence)[0];
      if (!candidate) break;
      this.setLifecycle(candidate, 'queued', 0);
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
    if (pkg.loadState === 'loading') pkg.loadGeneration += 1;
    this.setLifecycle(pkg, 'error', pkg.loadProgress);
    pkg.error = message;
    pkg.visualLevel = pkg.desiredLevel === 'far' ? 'far' : 'mid';
    this.reconcileVisibility();
    return true;
  }

  retryPackage(id: string) {
    const pkg = this.packages.get(id);
    if (!pkg) return false;
    if (pkg.loadState === 'loading') pkg.loadGeneration += 1;
    pkg.error = undefined;
    pkg.degradedReason = undefined;
    this.setLifecycle(pkg, 'queued', 0);
    if (this.detailPolicy === 'full-island') {
      this.manualPackagePriorities.set(id, ++this.prioritySequence);
      if (this.lastUpdateContext) this.updateFullIslandPriorities(this.lastUpdateContext);
      else this.rebuildFullIslandLoadQueue();
      this.pumpFullIslandLoadQueue();
    } else {
      this.schedulePackageLoad(pkg);
    }
    return true;
  }

  retryFullIslandDetail() {
    if (this.detailPolicy !== 'full-island') return false;
    let retried = false;
    this.packages.forEach((pkg) => {
      if (pkg.lifecyclePhase !== 'error') return;
      pkg.error = undefined;
      this.setLifecycle(pkg, 'queued', 0);
      retried = true;
    });
    if (this.lastUpdateContext) this.updateFullIslandPriorities(this.lastUpdateContext);
    else this.rebuildFullIslandLoadQueue();
    this.pumpFullIslandLoadQueue();
    return retried;
  }

  prioritizeFullIslandPackage(id: string) {
    const pkg = this.packages.get(id);
    if (!pkg) return false;
    this.manualPackagePriorities.set(id, ++this.prioritySequence);
    if (pkg.lifecyclePhase === 'error') {
      pkg.error = undefined;
      this.setLifecycle(pkg, 'queued', 0);
    }
    if (this.lastUpdateContext) this.updateFullIslandPriorities(this.lastUpdateContext);
    else {
      pkg.priorityReason = 'manual';
      pkg.priorityScore = 900_000 + this.prioritySequence;
      this.rebuildFullIslandLoadQueue();
    }
    this.pumpFullIslandLoadQueue();
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
    if (context.visiblePackageIds !== this.lastVisiblePackageIds) {
      this.lastVisiblePackageIds.length = 0;
      if (context.visiblePackageIds) this.lastVisiblePackageIds.push(...context.visiblePackageIds);
    }
    if (!this.lastUpdateContext) {
      this.lastUpdateContext = {
        ...context,
        cameraPosition: context.cameraPosition.clone(),
        cameraDirection: context.cameraDirection?.clone(),
        visiblePackageIds: this.lastVisiblePackageIds,
      };
    } else {
      this.lastUpdateContext.cameraPosition.copy(context.cameraPosition);
      if (context.cameraDirection) {
        if (this.lastUpdateContext.cameraDirection) this.lastUpdateContext.cameraDirection.copy(context.cameraDirection);
        else this.lastUpdateContext.cameraDirection = context.cameraDirection.clone();
      } else {
        this.lastUpdateContext.cameraDirection = undefined;
      }
      this.lastUpdateContext.mode = context.mode;
      this.lastUpdateContext.selectedPackageId = context.selectedPackageId;
      this.lastUpdateContext.interiorPackageId = context.interiorPackageId;
      this.lastUpdateContext.nearestPackageId = context.nearestPackageId;
      this.lastUpdateContext.visiblePackageIds = this.lastVisiblePackageIds;
      this.lastUpdateContext.elapsedSeconds = context.elapsedSeconds;
      this.lastUpdateContext.force = context.force;
    }
    const elapsedSeconds = context.elapsedSeconds ?? this.lastElapsedSeconds;
    if (this.detailPolicy === 'full-island') {
      this.lastCameraPosition.copy(context.cameraPosition);
      this.lastMode = context.mode;
      this.lastSelectedPackageId = context.selectedPackageId;
      this.lastInteriorPackageId = context.interiorPackageId;
      this.lastElapsedSeconds = elapsedSeconds;
      this.activeDetailLimit = this.packages.size;
      const newlyPinnedPackages: StreamingPackage[] = [];
      this.packages.forEach((pkg) => {
        const wasPinned = pkg.pinned;
        pkg.pinned = context.selectedPackageId === pkg.id || context.interiorPackageId === pkg.id;
        if (!wasPinned && pkg.pinned) newlyPinnedPackages.push(pkg);
        pkg.distanceMetres = Math.round(Math.hypot(
          context.cameraPosition.x - pkg.anchor.x,
          context.cameraPosition.z - pkg.anchor.z,
        ) * 10);
        pkg.desiredLevel = 'detail';
        if (pkg.loadState === 'loaded') {
          pkg.visualLevel = 'detail';
          pkg.lastUsedSequence = ++this.usageSequence;
        } else if (pkg.loadState === 'error' && pkg.pinned) {
          pkg.error = undefined;
          this.setLifecycle(pkg, 'queued', 0);
        }
      });
      this.updateFullIslandPriorities(context);
      newlyPinnedPackages.forEach((pkg) => {
        syncRuntimeBatches(pkg);
        pkg.lastRuntimeBatchSyncSeconds = elapsedSeconds;
      });
      if (context.force) {
        this.packages.forEach((pkg) => {
          syncRuntimeBatches(pkg);
          pkg.lastRuntimeBatchSyncSeconds = elapsedSeconds;
        });
      }
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
    const newlyPinnedPackages: StreamingPackage[] = [];

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
      const wasPinned = pkg.pinned;
      pkg.pinned = context.selectedPackageId === pkg.id || context.interiorPackageId === pkg.id;
      if (!wasPinned && pkg.pinned) newlyPinnedPackages.push(pkg);
      pkg.visibleCandidate = false;
      pkg.priorityReason = pkg.pinned ? 'selected' : 'background';
      pkg.priorityScore = pkg.pinned ? 1_000_000 - pkg.distanceMetres : -pkg.distanceMetres;
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
    candidates.forEach((pkg, index) => {
      if (!pkg.pinned) pkg.priorityReason = index === 0 ? 'nearest' : 'visible';
      pkg.visibleCandidate = true;
      if (!pkg.pinned) pkg.priorityScore = (index === 0 ? 500_000 : 300_000) - pkg.distanceMetres;
    });
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
    newlyPinnedPackages.forEach((pkg) => {
      syncRuntimeBatches(pkg);
      pkg.lastRuntimeBatchSyncSeconds = elapsedSeconds;
    });
    if (context.force) {
      this.packages.forEach((pkg) => {
        syncRuntimeBatches(pkg);
        pkg.lastRuntimeBatchSyncSeconds = elapsedSeconds;
      });
    }
    return this.reconcileVisibility();
  }

  beginProductionExport() {
    if (this.productionVisibilityState) throw new Error('A Production export is already preparing streamed world packages.');
    const restoreAuthoritySources = this.mountAllAuthoritySources();
    this.productionVisibilityState = new Map();
    this.packages.forEach((pkg) => {
      this.setPackageExteriorLightsForFullIsland(pkg, false);
      this.productionVisibilityState!.set(pkg.id, {
        detailResident: pkg.detailResident,
        detailEnvelopeVisible: pkg.detailEnvelope.visible,
        midVisible: pkg.midProxy.visible,
        farVisible: pkg.farProxy.visible,
        visualLevel: pkg.visualLevel,
        loadState: pkg.loadState,
        lifecyclePhase: pkg.lifecyclePhase,
        loadProgress: pkg.loadProgress,
      });
      this.setLifecycle(pkg, 'ready', 1);
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
        pkg.lifecyclePhase = state.lifecyclePhase;
        pkg.loadProgress = state.loadProgress;
        if (state.loadState === 'loaded') this.loadedPackageIds.add(id);
        else this.loadedPackageIds.delete(id);
        this.setPackageExteriorLightsForFullIsland(pkg, this.detailPolicy === 'full-island');
      });
      restoreAuthoritySources();
    };
  }

  getSnapshot(): StreamingSnapshot {
    const packages = Array.from(this.packages.values());
    const loaded = this.loadedPackageIds.size;
    const total = packages.length;
    const failedPackageIds = packages.filter((pkg) => pkg.lifecyclePhase === 'error').map((pkg) => pkg.id);
    const lifecycleCounts = packages.reduce((counts, pkg) => {
      if (pkg.lifecyclePhase === 'warming-gpu') counts.warmingGpu += 1;
      else counts[pkg.lifecyclePhase] += 1;
      return counts;
    }, { queued: 0, building: 0, warmingGpu: 0, ready: 0, error: 0, degraded: 0 });
    const lifecyclePhase: StreamingLifecyclePhase = lifecycleCounts.error > 0 ? 'error'
      : lifecycleCounts.warmingGpu > 0 ? 'warming-gpu'
        : lifecycleCounts.building > 0 ? 'building'
          : lifecycleCounts.queued > 0 ? 'queued'
            : lifecycleCounts.degraded > 0 ? 'degraded'
              : 'ready';
    const visiblePackages = packages.filter((pkg) => pkg.visibleCandidate || pkg.pinned);
    const visibleReady = visiblePackages.filter((pkg) => pkg.loadState === 'loaded' && pkg.visualLevel === 'detail').length;
    const batchCapacity = packages.reduce((sum, pkg) => sum + pkg.runtimeBatches.reduce((entrySum, record) => entrySum + record.entries.length, 0), 0);
    const batchActive = packages.reduce((sum, pkg) => sum + (pkg.detailResident ? pkg.runtimeBatches.reduce((entrySum, record) => (
      entrySum + record.entries.filter((entry) => entry.parentVisible && entry.microVisible).length
    ), 0) : 0), 0);
    const microTotal = packages.reduce((sum, pkg) => sum + pkg.renderImportance.micro, 0);
    const microVisible = packages.reduce((sum, pkg) => sum + (pkg.detailResident ? pkg.renderImportance.visibleMicro : 0), 0);
    const collisionResidentCellCount = packages.reduce((sum, pkg) => {
      if (!pkg.detailResident) return sum;
      return sum + Number(
        pkg.detailRoot.userData.collisionResidentCellCount
        ?? pkg.detailRoot.userData.walkCollisionCellCount
        ?? 0,
      );
    }, 0);
    const detachedAuthoringSourceCount = packages.reduce((sum, pkg) => (
      sum + pkg.authoritySources.filter((entry) => entry.source.parent === pkg.authorityRoot).length
    ), 0);
    const normalRenderAuthoredSourceCount = packages.reduce((sum, pkg) => (
      sum + pkg.authoritySources.filter((entry) => entry.source.parent !== pkg.authorityRoot).length
    ), 0);
    const liveRenderObjectCount = packages.reduce((sum, pkg) => {
      if (!pkg.detailResident) return sum;
      return sum + pkg.batching.batchCount + Math.max(0, pkg.batching.retainedSourceCount - pkg.batching.batchedSourceCount);
    }, packages.filter((pkg) => pkg.midProxy.visible || pkg.farProxy.visible).length);
    const gpuBatching = packages.reduce((summary, pkg) => ({
      batchCount: summary.batchCount + pkg.batching.batchCount,
      batchedSourceCount: summary.batchedSourceCount + pkg.batching.batchedSourceCount,
      retainedSourceCount: summary.retainedSourceCount + pkg.batching.retainedSourceCount,
      estimatedGeometryBytes: summary.estimatedGeometryBytes + pkg.batching.estimatedGeometryBytes,
      estimatedTextureBytes: summary.estimatedTextureBytes + pkg.batching.estimatedTextureBytes,
      instancedBatchCount: summary.instancedBatchCount + pkg.batching.instancedBatchCount,
      batchedMeshBatchCount: summary.batchedMeshBatchCount + pkg.batching.batchedMeshBatchCount,
      mergedBatchCount: summary.mergedBatchCount + pkg.batching.mergedBatchCount,
      largestBatchInstances: Math.max(summary.largestBatchInstances, pkg.batching.largestBatchInstances),
      largestBatchVertices: Math.max(summary.largestBatchVertices, pkg.batching.largestBatchVertices),
      largestBatchIndices: Math.max(summary.largestBatchIndices, pkg.batching.largestBatchIndices),
    }), {
      batchCount: 0,
      batchedSourceCount: 0,
      retainedSourceCount: 0,
      estimatedGeometryBytes: 0,
      estimatedTextureBytes: 0,
      instancedBatchCount: 0,
      batchedMeshBatchCount: 0,
      mergedBatchCount: 0,
      largestBatchInstances: 0,
      largestBatchVertices: 0,
      largestBatchIndices: 0,
    });
    return {
      authority: 'web-sandbox' as const,
      strategy: this.detailPolicy === 'full-island'
        ? 'progressive full-island GPU detail with per-object frustum culling'
        : 'bounded detail LRU with detail, batched mid HLOD, and far silhouette levels',
      detailPolicy: this.detailPolicy,
      fullIslandDetailRequested: this.detailPolicy === 'full-island',
      fullIslandDetailReady: this.detailPolicy === 'full-island'
        && loaded === total
        && packages.every((pkg) => pkg.visualLevel === 'detail' && (pkg.lifecyclePhase === 'ready' || pkg.lifecyclePhase === 'degraded')),
      fullIslandDetailProgress: {
        loaded,
        total,
        percent: total ? Math.round(loaded / total * 100) : 100,
        ...lifecycleCounts,
        currentPackageId: this.currentFullIslandPackageId,
        failedPackageIds,
      },
      fullIslandLifecycle: {
        phase: lifecyclePhase,
        ...lifecycleCounts,
        currentPackageId: this.currentFullIslandPackageId,
        failedPackageIds,
      },
      visiblePackageReadiness: {
        ready: visibleReady,
        total: visiblePackages.length,
        percent: visiblePackages.length ? Math.round(visibleReady / visiblePackages.length * 100) : 100,
      },
      renderProfile: this.detailPolicy === 'full-island' ? 'full-island' : 'streamed',
      liveRenderObjectCount,
      batchOccupancy: {
        capacity: batchCapacity,
        active: batchActive,
        ratio: batchCapacity ? batchActive / batchCapacity : 1,
      },
      microdetail: {
        total: microTotal,
        visible: microVisible,
        culled: Math.max(0, microTotal - microVisible),
      },
      collisionResidentCellCount,
      navigationResidencyRevision: this.navigationResidencyRevision,
      detachedAuthoringSourceCount,
      normalRenderAuthoredSourceCount,
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
        safetyLimits: {
          instances: MAX_RUNTIME_BATCH_INSTANCES,
          vertices: MAX_RUNTIME_BATCH_VERTICES,
          indices: MAX_RUNTIME_BATCH_INDICES,
        },
      },
      packages: packages.map((pkg): StreamingPackageSnapshot => ({
        id: pkg.id,
        kind: pkg.kind,
        loadState: pkg.loadState,
        lifecyclePhase: pkg.lifecyclePhase,
        loadProgress: Number(pkg.loadProgress.toFixed(3)),
        priorityReason: pkg.priorityReason,
        priorityScore: Math.round(pkg.priorityScore),
        visibleCandidate: pkg.visibleCandidate,
        visualLevel: pkg.visualLevel,
        detailResident: pkg.detailResident,
        proxyVisible: pkg.midProxy.visible || pkg.farProxy.visible,
        midVisible: pkg.midProxy.visible,
        farVisible: pkg.farProxy.visible,
        pinned: pkg.pinned,
        distanceMetres: Number.isFinite(pkg.distanceMetres) ? Math.round(pkg.distanceMetres) : -1,
        estimatedCost: pkg.estimatedCost,
        renderImportance: { ...pkg.renderImportance },
        batchOccupancy: (() => {
          const capacity = pkg.runtimeBatches.reduce((sum, record) => sum + record.entries.length, 0);
          const active = pkg.detailResident
            ? pkg.runtimeBatches.reduce((sum, record) => sum + record.entries.filter((entry) => entry.parentVisible && entry.microVisible).length, 0)
            : 0;
          return { capacity, active, ratio: capacity ? active / capacity : 1 };
        })(),
        ...(pkg.degradedReason ? { degradedReason: pkg.degradedReason } : {}),
        ...(pkg.error ? { error: pkg.error } : {}),
      })),
    };
  }

  dispose() {
    // Preserve caller-owned authored hierarchies even when the runtime manager
    // is torn down permanently.
    this.packages.forEach((pkg) => {
      if (pkg.authorityMountDepth === 0) this.mountPackageAuthoritySources(pkg.id);
    });
    const materials = new Set<THREE.Material>();
    this.vistaRoot.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.forEach((material) => materials.add(material));
    });
    materials.forEach((material) => material.dispose());
    this.vistaRoot.clear();
    this.loadedPackageIds.clear();
    this.gpuPulseTimeUniforms.clear();
    this.manualPackagePriorities.clear();
    this.highQualityShadowPackageIds.clear();
    this.residentPackageIdsByPriority = [];
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
