import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SAOPass } from 'three/addons/postprocessing/SAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { biomes, districts, type BiomeDefinition, type DistrictDefinition } from '../data/districts';
import {
  ACADEMIC_CAMPUS_BUILDINGS,
  academicBuildingSelectableId,
  academicCampusBuildingById,
  type AcademicCampusBuilding,
} from '../data/academicCampus';
import {
  ACADEMIC_FOUNTAIN_CAMERA_PRESETS,
  ACADEMIC_FOUNTAIN_CONFIG,
  ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS,
  ACADEMIC_FOUNTAIN_RESTORATION_MODES,
  ACADEMIC_FOUNTAIN_ROOT_NAME,
  ACADEMIC_FOUNTAIN_SCENE_MODES,
  ACADEMIC_FOUNTAIN_STATUE_MATERIALS,
  ACADEMIC_FOUNTAIN_TITLE,
  type AcademicFountainCameraPresetId,
  type AcademicFountainRestorationMode,
  type AcademicFountainSceneMode,
  type AcademicFountainStatueMaterialMode,
} from '../data/academicFountain';
import {
  ISLAND_POINTS,
  ISLAND_RADIUS,
  ISLAND_SURFACE_Y,
  MASTERPLAN_RESCALE,
  WALK_INSPECT_DISTANCE,
  WALK_RADIUS,
  WALK_VERTICAL_FOV,
  WORLD_EXPANSION,
} from '../config/island';
import { WalkController } from './WalkController';
import { AcademicAudioController } from './academicAudio';
import {
  CEREBRUM_LIBRARY_ROOT_NAME,
  configureCerebrumLibraryQuality,
  createCerebrumLibraryInterior,
  disposeCerebrumLibrary,
  getCerebrumLibraryOrbitPreset,
  getCerebrumLibraryRoomAt,
  getCerebrumLibrarySnapshot,
  getCerebrumLibraryState,
  isPointInsideCerebrumLibrary,
  performCerebrumLibraryInteraction,
  resolveCerebrumLibraryHotspot,
  restoreCerebrumLibraryState,
  setCerebrumLibraryCutaway,
  setCerebrumLibraryMuted,
  setCerebrumLibraryOrbitMode,
  setCerebrumLibraryQuietMode,
  updateCerebrumLibrary,
  type CerebrumLibraryHotspot,
  type CerebrumLibraryBuildOptions,
  type CerebrumLibraryInteractionResult,
  type CerebrumLibraryState,
} from './cerebrumLibrary';
import {
  applyAcademicTreeSeason,
  configureAcademicTreeQuality,
  updateAcademicTreeWind,
} from './academicTrees';
import { updateAcademicBuildingInscription } from './academicDistrict';
import {
  adjustAcademicFountainWaterFlow,
  configureAcademicFountainQuality,
  cycleAcademicFountainCameraPreset,
  cycleAcademicFountainRestoration,
  cycleAcademicFountainSceneMode,
  cycleAcademicFountainStatueMaterial,
  disposeAcademicFountain,
  getAcademicFountainCameraPose,
  getAcademicFountainSeatPoint,
  getAcademicFountainState,
  inspectNextAcademicFountainSymbol,
  resetAcademicFountainCameraPreset,
  restoreAcademicFountainRuntimeSnapshot,
  setAcademicFountainWater,
  throwAcademicFountainCoin,
  toggleAcademicFountainCutaway,
  toggleAcademicFountainDebug,
  toggleAcademicFountainEngravings,
  toggleAcademicFountainGeometryGrid,
  toggleAcademicFountainInfinityLight,
  toggleAcademicFountainLanterns,
  toggleAcademicFountainLeaves,
  toggleAcademicFountainRingRotation,
  updateAcademicFountain,
} from './academicFountain';
import { createBiomeModel, createDistrictModel, setModelAccent } from './procedural';
import {
  EDITOR_ASSET_CATALOG,
  createEditorAsset,
  createInteriorShell,
  applyCustomStyles,
  type EditorAssetCatalogItem,
  type EditorWorkspace,
} from './editorAssets';
import {
  createBridgeAndCity,
  createIndustrialPort,
  createIslandShell,
  createOcean,
  createSkyDome,
  createTransitNetwork,
  type SkyDome,
  type WaterSurface,
} from './environment';
import { WorldStreamingManager, isEffectivelyVisible } from './worldStreaming';
import {
  UNREAL_DATA_LAYERS,
  UNREAL_WORLD_MANIFEST_SCHEMA,
  stableUnrealName,
  webMatrixToUnrealRowMajor,
  webPointToUnrealCentimetres,
  type UnrealDataLayerName,
  type UnrealWorldManifest,
} from '../migration/worldManifest';

export type ViewMode = 'explore' | 'plan' | 'edit' | 'walk';
export type GizmoMode = 'translate' | 'rotate' | 'scale';
export type SceneLayer = 'buildings' | 'landscape' | 'labels' | 'transit';
export type GraphicsQuality = 'low' | 'medium' | 'high';
export type WeatherMode =
  | 'clear'
  | 'rain'
  | 'fog'
  | 'storm'
  | 'academic-autumn'
  | 'academic-overcast'
  | 'academic-rainy-dusk'
  | 'academic-foggy-night';

export interface EditorAssetDefinition {
  id: string;
  name: string;
  sourceLabel?: string;
  category: 'editor';
  ring: 'custom';
  position: readonly [number, number, number];
  footprint: readonly [number, number];
  height: number;
  archetype: string;
  accent: string;
  palette: readonly [string, string, string, string];
  description: string;
  workspace: EditorWorkspace;
  assetKind: 'building' | 'prop' | 'interior';
  catalogId: string;
  parentBuildingId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  patternType?: string;
  patternScale?: number;
  collisionEnabled?: boolean;
  interactions?: string[];
}

export interface ImportedDefinition {
  id: string;
  name: string;
  sourceLabel?: string;
  category: 'imported';
  ring: 'custom';
  position: readonly [number, number, number];
  footprint: readonly [number, number];
  height: number;
  archetype: string;
  accent: string;
  palette: readonly [string, string, string, string];
  description: string;
  workspace?: EditorWorkspace;
  parentBuildingId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  patternType?: string;
  patternScale?: number;
  collisionEnabled?: boolean;
  interactions?: string[];
}

export interface AcademicBuildingDefinition {
  id: string;
  name: string;
  sourceLabel: string;
  category: 'academic-building';
  ring: 'academic-district';
  position: readonly [number, number, number];
  footprint: readonly [number, number];
  height: number;
  archetype: string;
  accent: string;
  palette: readonly [string, string, string, string];
  description: string;
  workspace: 'landscape';
  assetKind: 'building';
  parentDistrictId: string;
  academicRecordId: string;
  founded: number;
  zone: string;
  collisionEnabled: boolean;
  interactions: string[];
  inscription?: string;
}

type SceneDefinitionBase =
  | DistrictDefinition
  | BiomeDefinition
  | ImportedDefinition
  | EditorAssetDefinition
  | AcademicBuildingDefinition;

export type SceneDefinition = SceneDefinitionBase & {
  /** User-editable text shown by the floating scene label. */
  label?: string;
};

export interface ObjectMetadata {
  name: string;
  label: string;
  description: string;
  inscription?: string;
}

export function createAcademicBuildingDefinition(
  record: AcademicCampusBuilding,
  district: DistrictDefinition,
  position: readonly [number, number, number] = [record.location[0], 0, record.location[1]],
): AcademicBuildingDefinition {
  return {
    id: academicBuildingSelectableId(record.id),
    name: record.name,
    sourceLabel: `${record.zone} / founded ${record.founded}`,
    category: 'academic-building',
    ring: 'academic-district',
    position,
    footprint: record.footprint,
    height: record.height,
    archetype: `editable-${record.kind}-facility`,
    accent: district.accent,
    palette: district.palette,
    description: `${record.description} Founded in ${record.founded}; ${record.zone}.`,
    workspace: 'landscape',
    assetKind: 'building',
    parentDistrictId: district.id,
    academicRecordId: record.id,
    founded: record.founded,
    zone: record.zone,
    collisionEnabled: true,
    interactions: ['inspect entrance'],
    ...(record.inscription !== undefined ? { inscription: record.inscription } : {}),
  };
}

export interface ObjectState {
  position: { x: number; y: number; z: number };
  rotationY: number;
  scale: number;
  visible: boolean;
  accent: string;
  primaryColor?: string;
  secondaryColor?: string;
  patternType?: string;
  patternScale?: number;
  styleCustomized?: boolean;
  collisionEnabled?: boolean;
  interactions?: string[];
}

interface CameraTween {
  startedAt: number;
  duration: number;
  positionFrom: THREE.Vector3;
  positionTo: THREE.Vector3;
  targetFrom: THREE.Vector3;
  targetTo: THREE.Vector3;
}

interface SavedAcademicFountainStateV2 {
  version: 2;
  environmentOwned: boolean;
  sceneMode: AcademicFountainSceneMode;
  waterOn: boolean;
  waterFlow: number;
  requestedWaterFlow: number;
  sheetFlow: number;
  residualDrip: number;
  infinityLightOn: boolean;
  engravingsHighlighted: boolean;
  cutawayVisible: boolean;
  geometryGridVisible: boolean;
  ringRotating: boolean;
  ringAngle: number;
  statueMaterial: AcademicFountainStatueMaterialMode;
  restorationMode: AcademicFountainRestorationMode;
  cameraPreset: AcademicFountainCameraPresetId;
  quality: GraphicsQuality;
}

interface LabelRecord {
  id: string;
  definition: SceneDefinition;
  anchor: CSS2DObject;
  object: THREE.Object3D;
  labelHeight: number;
}

interface InteriorReturnState {
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  cameraFov: number;
  cameraNear: number;
  minDistance: number;
  maxDistance: number;
  maxPolarAngle: number;
  rootVisibility: Map<THREE.Object3D, boolean>;
}

export interface IslandWorldCallbacks {
  onSelection?: (definition: SceneDefinition | null, source: 'scene' | 'ui' | 'system') => void;
  onTransform?: (definition: SceneDefinition, state: ObjectState) => void;
  onMetadataChange?: (definition: SceneDefinition) => void;
  onImport?: (definition: ImportedDefinition) => void;
  onObjectAdded?: (definition: EditorAssetDefinition) => void;
  onObjectDeleted?: (id: string) => void;
  onEditWorkspaceChange?: (workspace: EditorWorkspace, buildingId: string | null) => void;
  onReady?: () => void;
  onError?: (message: string, error?: unknown) => void;
  onWalkLockChange?: (locked: boolean, dragLookActive?: boolean) => void;
  onWalkTurboChange?: (enabled: boolean) => void;
  onAcademicInteraction?: (result: { title: string; message: string }) => void;
  onCerebrumPresenceChange?: (inside: boolean) => void;
  onImportPlacementChange?: (
    state: 'choosing' | 'chosen' | 'cancelled' | 'cleared',
    position?: readonly [number, number, number],
  ) => void;
  onUndoStackChange?: (canUndo: boolean) => void;
}

const CATEGORY_PRIORITY = new Set(['core', 'biome', 'perimeter', 'commercial']);

function sceneLabel(definition: SceneDefinition) {
  return definition.label?.trim() || definition.name;
}

type CerebrumStreamingPhase = 'unloaded' | 'preloading' | 'loaded' | 'active' | 'retention';

interface CerebrumStreamingConfig extends CerebrumLibraryBuildOptions {
  preloadDistanceMetres: number;
  unloadDistanceMetres: number;
  retentionSeconds: number;
}

interface CerebrumStreamingLifecycle {
  phase: CerebrumStreamingPhase;
  distanceMetres: number;
  mounted: boolean;
  scheduled: boolean;
  lastActiveAt: number;
  mountedAt: number | null;
  unloadCount: number;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function getFileExtension(file: File) {
  return file.name.split('.').pop()?.toLowerCase() ?? '';
}

function cloneMaterial(material: THREE.Material | THREE.Material[]) {
  return Array.isArray(material) ? material.map((entry) => entry.clone()) : material.clone();
}

function isInsideIslandFootprint(x: number, z: number) {
  let inside = false;
  for (let current = 0, previous = ISLAND_POINTS.length - 1; current < ISLAND_POINTS.length; previous = current++) {
    const [currentX, currentZ] = ISLAND_POINTS[current];
    const [previousX, previousZ] = ISLAND_POINTS[previous];
    const crosses = (currentZ > z) !== (previousZ > z);
    const edgeX = ((previousX - currentX) * (z - currentZ)) / (previousZ - currentZ || Number.EPSILON) + currentX;
    if (crosses && x < edgeX) inside = !inside;
  }
  return inside;
}

function createImportPlacementMarker() {
  const marker = new THREE.Group();
  marker.name = 'EDITOR__IMPORT_PLACEMENT_MARKER';
  const cyan = new THREE.MeshBasicMaterial({ color: '#55f5ff', transparent: true, opacity: 0.95, depthTest: false });
  const magenta = new THREE.MeshBasicMaterial({ color: '#ff4ecb', transparent: true, opacity: 0.9, depthTest: false });
  const outer = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.58, 48), cyan);
  outer.rotation.x = -Math.PI / 2;
  outer.renderOrder = 20;
  marker.add(outer);
  const inner = new THREE.Mesh(new THREE.RingGeometry(0.48, 0.58, 32), magenta);
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.02;
  inner.renderOrder = 20;
  marker.add(inner);
  for (const rotation of [0, Math.PI / 2]) {
    const cross = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.035, 0.075), cyan);
    cross.rotation.y = rotation;
    cross.position.y = 0.035;
    cross.renderOrder = 20;
    marker.add(cross);
  }
  const beacon = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.72, 12), magenta);
  beacon.position.y = 0.62;
  beacon.renderOrder = 20;
  marker.add(beacon);
  marker.visible = false;
  marker.userData.editorOnly = true;
  return marker;
}

class PrecipitationSystem {
  points: THREE.Points;
  private readonly particleCount = 2000;
  private readonly boxSize = 250;
  private readonly velocities: number[] = [];
  private readonly drifts: number[] = [];
  private type: 'rain' | 'snow' = 'rain';

  constructor() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * this.boxSize;
      positions[i * 3 + 1] = Math.random() * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.boxSize;
      this.velocities.push(18 + Math.random() * 12);
      this.drifts.push(Math.random() * 2 * Math.PI);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.5, 'rgba(230, 245, 255, 0.5)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 0.6,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.points = new THREE.Points(geometry, material);
    this.points.visible = false;
  }

  setType(type: 'rain' | 'snow') {
    this.type = type;
    const mat = this.points.material as THREE.PointsMaterial;
    if (type === 'rain') {
      mat.size = 0.5;
      mat.color.set('#cbe4f9');
      for (let i = 0; i < this.particleCount; i++) {
        this.velocities[i] = 20 + Math.random() * 15;
      }
    } else {
      mat.size = 0.8;
      mat.color.set('#ffffff');
      for (let i = 0; i < this.particleCount; i++) {
        this.velocities[i] = 2.5 + Math.random() * 2;
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  update(delta: number, playerPos: THREE.Vector3, elapsed: number) {
    if (!this.points.visible) return;
    const positions = this.points.geometry.attributes.position.array as Float32Array;
    const isRain = this.type === 'rain';

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3 + 1] -= this.velocities[i] * delta;

      if (!isRain) {
        positions[i * 3] += Math.sin(elapsed + this.drifts[i]) * 1.5 * delta;
        positions[i * 3 + 2] += Math.cos(elapsed + this.drifts[i]) * 1.5 * delta;
      }

      if (positions[i * 3 + 1] < playerPos.y - 12) {
        positions[i * 3 + 1] = playerPos.y + 75;
      }

      const dx = positions[i * 3] - playerPos.x;
      const dz = positions[i * 3 + 2] - playerPos.z;
      const halfSize = this.boxSize / 2;
      if (dx > halfSize) positions[i * 3] -= this.boxSize;
      else if (dx < -halfSize) positions[i * 3] += this.boxSize;

      if (dz > halfSize) positions[i * 3 + 2] -= this.boxSize;
      else if (dz < -halfSize) positions[i * 3 + 2] += this.boxSize;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}

export class IslandWorld {
  readonly scene = new THREE.Scene();
  readonly renderer: THREE.WebGLRenderer;
  readonly labelRenderer: CSS2DRenderer;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly transformControls: TransformControls;
  readonly walkController: WalkController;
  private readonly composer: EffectComposer;
  private readonly renderPass: RenderPass;
  private readonly saoPass: SAOPass;
  private readonly bloomPass: UnrealBloomPass;
  private readonly outputPass: OutputPass;
  readonly modelRoot = new THREE.Group();
  readonly architectureRoot = new THREE.Group();
  readonly landscapeRoot = new THREE.Group();
  readonly transitRoot = new THREE.Group();
  readonly cityRoot = new THREE.Group();
  readonly importedRoot = new THREE.Group();
  readonly interiorsRoot = new THREE.Group();
  readonly presentationRoot = new THREE.Group();
  readonly debugRoot = new THREE.Group();
  private readonly worldStreaming = new WorldStreamingManager();

  private readonly container: HTMLElement;
  private readonly callbacks: IslandWorldCallbacks;
  public readonly objectGroups = new Map<string, THREE.Group>();
  private readonly definitions = new Map<string, SceneDefinition>();
  private readonly undoStack: string[] = [];
  private readonly initialTransforms = new Map<
    string,
    { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3; visible: boolean; accent: string }
  >();
  private readonly labels = new Map<string, LabelRecord>();
  private readonly labelRoot = new THREE.Group();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly selectionBox: THREE.Box3Helper;
  private readonly selectionBounds = new THREE.Box3();
  private readonly clock = new THREE.Clock();
  private readonly sky: SkyDome;
  private readonly ocean: WaterSurface;
  private readonly hemisphere: THREE.HemisphereLight;
  private readonly sun: THREE.DirectionalLight;
  private readonly pointerDown = new THREE.Vector2();
  private readonly animatedObjects: THREE.Object3D[] = [];
  private readonly academicInteriorIsolation = new Map<THREE.Object3D, boolean>();
  private readonly exteriorHighDetailIsolation = new Map<THREE.Object3D, boolean>();
  private readonly interiorGroups = new Map<string, THREE.Group>();
  private readonly interiorAssetIds = new Map<string, Set<string>>();
  private readonly importPlacementMarker = createImportPlacementMarker();
  private importPlacementChoosing = false;
  private importPlacement: THREE.Vector3 | null = null;
  private selectedId: string | null = null;
  private hoveredId: string | null = null;
  private mode: ViewMode = 'explore';
  private editWorkspace: EditorWorkspace = 'landscape';
  private activeInteriorBuildingId: string | null = null;
  private interiorReturnState: InteriorReturnState | null = null;
  private generatedAssetSequence = 0;
  private dayTarget = 0;
  private dayMix = 0;
  private activeTimeOfDay: 'sunrise' | 'noon' | 'sunset' | 'night' = 'noon';
  private activeWeather: WeatherMode = 'clear';
  private activeSeason: 'summer' | 'spring' | 'autumn' | 'winter' = 'summer';
  private graphicsQuality: GraphicsQuality = 'medium';
  private debugMode = false;
  private activeAcademicHotspot: AcademicCampusBuilding | null = null;
  private activeAcademicFountainHotspot = false;
  private activeCerebrumHotspot: CerebrumLibraryHotspot | null = null;
  private cachedCerebrumLibraryState: CerebrumLibraryState | null = null;
  private cancelScheduledCerebrumLoad: (() => void) | null = null;
  private cerebrumStreaming: CerebrumStreamingLifecycle = {
    phase: 'unloaded',
    distanceMetres: Number.POSITIVE_INFINITY,
    mounted: false,
    scheduled: false,
    lastActiveAt: 0,
    mountedAt: null,
    unloadCount: 0,
  };
  private cerebrumLibraryInspectionActive = false;
  private cerebrumLibraryPresence = false;
  private academicFountainInspectionActive = false;
  private academicFountainEnvironmentOwned = false;
  private applyingAcademicFountainEnvironment = false;
  private readonly academicAudio = new AcademicAudioController();
  private readonly precipitation: PrecipitationSystem;
  private lightningFlashTime = 0;
  private elapsed = 0;
  private cameraTween: CameraTween | null = null;
  private draggingGizmo = false;
  private disposed = false;
  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, callbacks: IslandWorldCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.scene.name = 'YouTopy Lab Island Spatial Twin';
    this.scene.background = new THREE.Color('#07131b');
    this.scene.fog = new THREE.FogExp2('#102632', 0.00115 / MASTERPLAN_RESCALE);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
      logarithmicDepthBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.setAttribute('aria-label', 'Editable 3D model of the YouTopy Lab Island');
    this.container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.className = 'label-layer';
    this.labelRenderer.domElement.setAttribute('aria-hidden', 'true');
    this.container.appendChild(this.labelRenderer.domElement);

    // The masterplan is large, but overview cameras never approach geometry closer
    // than several world units. A tighter clip range keeps flush road markings from
    // disappearing into the campus plateau because of depth-buffer precision.
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.65, 1800 * MASTERPLAN_RESCALE);
    this.camera.position.set(
      390 * MASTERPLAN_RESCALE,
      305 * MASTERPLAN_RESCALE,
      420 * MASTERPLAN_RESCALE,
    );
    this.camera.lookAt(0, 2, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 2, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 980 * MASTERPLAN_RESCALE;
    this.controls.maxPolarAngle = Math.PI * 0.485;
    this.controls.screenSpacePanning = false;
    this.controls.zoomToCursor = true;

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.saoPass = new SAOPass(this.scene, this.camera, new THREE.Vector2(960, 540));
    this.saoPass.params.saoBias = 0.28;
    this.saoPass.params.saoIntensity = 0.075;
    this.saoPass.params.saoScale = 1.1;
    this.saoPass.params.saoKernelRadius = 22;
    this.saoPass.params.saoMinResolution = 0.001;
    this.saoPass.params.saoBlur = true;
    this.saoPass.params.saoBlurRadius = 5;
    this.saoPass.params.saoBlurStdDev = 2.2;
    this.saoPass.params.saoBlurDepthCutoff = 0.018;
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(960, 540), 0.055, 0.22, 1.08);
    this.outputPass = new OutputPass();
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.saoPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.outputPass);

    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    const transformHelper = this.transformControls.getHelper();
    transformHelper.name = 'EDITOR__TRANSFORM_GIZMO';
    transformHelper.visible = false;
    this.scene.add(transformHelper);
    this.transformControls.setSize(0.72);
    this.transformControls.addEventListener('dragging-changed', (event: { value: unknown }) => {
      this.draggingGizmo = Boolean(event.value);
      this.controls.enabled = this.mode !== 'walk' && !this.draggingGizmo;
      if (this.draggingGizmo && this.selectedId) {
        this.saveUndoState();
        const group = this.objectGroups.get(this.selectedId);
        if (group) {
          if (!group.userData.lastSafePosition) {
            group.userData.lastSafePosition = new THREE.Vector3();
          }
          group.userData.lastSafePosition.copy(group.position);
        }
      }
    });
    this.transformControls.addEventListener('objectChange', () => {
      const definition = this.getSelectedDefinition();
      if (definition) {
        const group = this.objectGroups.get(definition.id);
        const collisionEnabled = group?.userData.collisionEnabled !== false && (definition as any).collisionEnabled !== false;

        // 1. Interior Wall Clamping
        const defAny = definition as any;
        if (group && collisionEnabled && defAny.workspace === 'interior' && this.activeInteriorBuildingId) {
          const interior = this.interiorGroups.get(this.activeInteriorBuildingId);
          if (interior) {
            const W = Number(interior.userData.roomWidth) || 8;
            const D = Number(interior.userData.roomDepth) || 6;
            const fw = defAny.footprint ? defAny.footprint[0] : 0.2;
            const fd = defAny.footprint ? defAny.footprint[1] : 0.2;
            const minX = -W * 0.5 + fw * 0.5;
            const maxX = W * 0.5 - fw * 0.5;
            const minZ = -D * 0.5 + fd * 0.5;
            const maxZ = D * 0.5 - fd * 0.5;
            group.position.x = THREE.MathUtils.clamp(group.position.x, minX, maxX);
            group.position.z = THREE.MathUtils.clamp(group.position.z, minZ, maxZ);
            group.position.y = 0.012; // Snap to floor
          }
        }

        // 2. Overlap collision check with other objects in the same root
        if (group && collisionEnabled) {
          const parent = group.parent;
          if (parent) {
            const selectedBox = new THREE.Box3().setFromObject(group);
            const parentSelectableId = group.userData.parentSelectableId as string | undefined;
            let intersects = false;
            for (const child of parent.children) {
              if (child === group || child.name === 'EDITOR__TRANSFORM_GIZMO' || child.name === 'EDITOR__SELECTION_BOUNDS') continue;
              
              // Only check objects that have collisions enabled
              const childId = child.userData.selectableId;
              // Academic buildings are nested inside the selectable district.
              // Ignore roads, lawns, and other parent-owned dressing while still
              // preventing one individually editable facility crossing another.
              if (parentSelectableId && childId === parentSelectableId) continue;
              if (childId) {
                const childDef = this.definitions.get(childId);
                if (childDef && (childDef as any).collisionEnabled === false) continue;
              }
              
              const childBox = new THREE.Box3().setFromObject(child);
              if (selectedBox.intersectsBox(childBox)) {
                intersects = true;
                break;
              }
            }
            if (intersects) {
              if (group.userData.lastSafePosition) {
                group.position.copy(group.userData.lastSafePosition);
              }
            } else {
              if (!group.userData.lastSafePosition) {
                group.userData.lastSafePosition = new THREE.Vector3();
              }
              group.userData.lastSafePosition.copy(group.position);
            }
          }
        }

        this.syncInteriorTransform(definition.id);
        this.callbacks.onTransform?.(definition, this.getObjectState(definition.id)!);
      }
      this.refreshSelectionBounds();
      this.updateLabels(true);
      this.walkController?.refreshNavigation();
    });

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const roomEnvironment = new RoomEnvironment();
    this.scene.environment = pmremGenerator.fromScene(roomEnvironment, 0.035).texture;
    roomEnvironment.dispose();
    pmremGenerator.dispose();

    this.modelRoot.name = 'LAB_ISLAND__EXPORT_ROOT';
    this.architectureRoot.name = 'COLLECTION__DISTRICT_ARCHITECTURE';
    this.landscapeRoot.name = 'COLLECTION__TERRAIN_AND_BIOMES';
    this.transitRoot.name = 'COLLECTION__TRANSIT_AND_BRIDGE';
    this.cityRoot.name = 'COLLECTION__DISTANT_CYBERPUNK_CITY';
    this.importedRoot.name = 'COLLECTION__IMPORTED_ASSETS';
    this.interiorsRoot.name = 'COLLECTION__EDITABLE_INTERIORS';
    // Terrain renders first, then flush road graphics, then buildings and
    // imported meshes so road markings never bleed through architecture.
    this.architectureRoot.renderOrder = 2;
    this.importedRoot.renderOrder = 2;
    this.presentationRoot.name = 'PRESENTATION_ONLY__DO_NOT_EXPORT';
    this.debugRoot.name = 'DEBUG__COLLISIONS_LIGHTS_AND_STATS';
    this.debugRoot.visible = false;
    this.labelRoot.name = 'EDITOR__LABELS';
    this.modelRoot.userData = {
      project: 'YouTopy Lab Island',
      sourceSketch: 'YT_LabIsland_Ideas1.png',
      units: '10 metres per world unit',
      coordinateSystem: 'X east, Y up, Z south',
      blenderImport: 'File > Import > glTF 2.0',
    };
    this.modelRoot.add(
      this.landscapeRoot,
      this.architectureRoot,
      this.transitRoot,
      this.cityRoot,
      this.importedRoot,
      this.interiorsRoot,
    );
    this.presentationRoot.add(this.worldStreaming.vistaRoot, this.debugRoot);
    this.scene.add(this.modelRoot, this.presentationRoot, this.labelRoot);

    this.precipitation = new PrecipitationSystem();
    this.ocean = createOcean();
    this.sky = createSkyDome();
    this.presentationRoot.add(this.ocean, this.sky, this.importPlacementMarker, this.precipitation.points);

    this.hemisphere = new THREE.HemisphereLight('#9ecbd4', '#17241f', 1.55);
    this.hemisphere.name = 'Blue-hour hemisphere light';
    this.scene.add(this.hemisphere);
    this.sun = new THREE.DirectionalLight('#ffd9be', 3.6);
    this.sun.name = 'Low-angle island sun';
    this.sun.position.set(-180, 310, 170).multiplyScalar(MASTERPLAN_RESCALE);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -335 * MASTERPLAN_RESCALE;
    this.sun.shadow.camera.right = 335 * MASTERPLAN_RESCALE;
    this.sun.shadow.camera.top = 335 * MASTERPLAN_RESCALE;
    this.sun.shadow.camera.bottom = -335 * MASTERPLAN_RESCALE;
    this.sun.shadow.camera.near = 4;
    this.sun.shadow.camera.far = 560 * MASTERPLAN_RESCALE;
    this.sun.shadow.bias = -0.00018;
    this.scene.add(this.sun);
    const rimLight = new THREE.DirectionalLight('#5be8ff', 0.95);
    rimLight.position.set(70, 26, -62);
    rimLight.name = 'Cyber city rim light';
    this.scene.add(rimLight);

    createIslandShell(this.landscapeRoot);
    createTransitNetwork(this.transitRoot, biomes);
    createIndustrialPort(this.transitRoot);
    createBridgeAndCity(this.transitRoot, this.cityRoot);
    this.createDistrictsAndBiomes();

    this.selectionBox = new THREE.Box3Helper(this.selectionBounds, new THREE.Color('#b7f34b'));
    this.selectionBox.name = 'EDITOR__SELECTION_BOUNDS';
    this.selectionBox.visible = false;
    this.scene.add(this.selectionBox);

    this.walkController = new WalkController({
      camera: this.camera,
      element: this.renderer.domElement,
      navigationRoot: this.modelRoot,
      onLockChange: (locked, dragLookActive) => this.callbacks.onWalkLockChange?.(locked, dragLookActive),
      onTurboChange: (enabled) => this.callbacks.onWalkTurboChange?.(enabled),
      onInteract: () => this.inspectFromWalkView(),
    });
    this.syncAcademicGateForTime(true);

    this.updateWorldStreaming(false, true);
    this.refreshAnimatedObjects();

    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('dblclick', this.onDoubleClick);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    this.resize();
    this.updateLabels(true);
    this.renderer.setAnimationLoop(this.animate);
    // Saved-project reconstruction can invoke UI callbacks. Defer it until the
    // constructor has returned so main.ts has assigned the public `world`
    // binding; a synchronous cold boot previously triggered its temporal-dead-
    // zone and could leave one of the 41 static scene groups unregistered.
    window.setTimeout(() => {
      try {
        this.loadProjectFromLocalStorage();
      } catch (e) {
        console.error('Error loading saved project on init', e);
      }
    }, 0);
    window.setTimeout(() => this.callbacks.onReady?.(), 560);
  }

  private createDistrictsAndBiomes() {
    districts.forEach((definition) => {
      const { group, labelHeight } = createDistrictModel(definition);
      group.traverse((child) => {
        if (child instanceof THREE.Group) child.renderOrder = Math.max(child.renderOrder, 2);
      });
      this.worldStreaming.register(definition, 'district', group, this.architectureRoot);
      this.registerSelectable(definition, group, labelHeight, false);
      if (definition.id === 'academic-libraries-theoretical-labs') {
        this.registerAcademicBuildingSelectables(definition, group);
      }
    });
    biomes.forEach((definition) => {
      const { group, labelHeight } = createBiomeModel(definition);
      group.traverse((child) => {
        if (child instanceof THREE.Group) child.renderOrder = Math.max(child.renderOrder, 2);
      });
      this.worldStreaming.register(definition, 'biome', group, this.landscapeRoot);
      this.registerSelectable(definition, group, labelHeight, true);
    });
  }

  private registerAcademicBuildingSelectables(definition: DistrictDefinition, districtGroup: THREE.Group) {
    const facilities = new Map<string, THREE.Group>();
    districtGroup.traverse((object) => {
      if (!(object instanceof THREE.Group) || object.userData.academicFacility !== true) return;
      const record = object.userData.academicBuildingData as AcademicCampusBuilding | undefined;
      if (record) facilities.set(record.id, object);
    });

    ACADEMIC_CAMPUS_BUILDINGS.forEach((record) => {
      const facility = facilities.get(record.id);
      if (!facility) {
        console.warn(`Academic facility is not editable because its scene group is missing: ${record.name}`);
        return;
      }
      const selectableId = academicBuildingSelectableId(record.id);
      facility.userData.selectableId = selectableId;
      facility.userData.parentSelectableId = definition.id;
      facility.userData.editable = true;
      facility.userData.workspace = 'landscape';
      facility.userData.collisionEnabled = true;
      facility.userData.interactions ??= ['inspect entrance'];
      facility.traverse((child) => {
        child.userData.selectableId = selectableId;
      });
      const facilityDefinition = createAcademicBuildingDefinition(
        record,
        definition,
        [facility.position.x, facility.position.y, facility.position.z],
      );
      this.registerSelectable(facilityDefinition, facility, record.height + 2.5, false);
    });
  }

  private registerSelectable(
    definition: SceneDefinition,
    group: THREE.Group,
    labelHeight: number,
    biome: boolean,
    showLabel = true,
  ) {
    this.definitions.set(definition.id, definition);
    this.objectGroups.set(definition.id, group);
    group.userData.displayName = definition.name;
    group.userData.displayLabel = sceneLabel(definition);
    group.userData.description = definition.description;
    this.initialTransforms.set(definition.id, {
      position: group.position.clone(),
      quaternion: group.quaternion.clone(),
      scale: group.scale.clone(),
      visible: group.visible,
      accent: definition.accent,
    });
    if (!showLabel) return;
    const element = document.createElement('div');
    element.className = `district-label${biome ? ' biome-label' : ''}${definition.category === 'academic-building' ? ' academic-building-label' : ''}`;
    element.textContent = sceneLabel(definition);
    element.dataset.labelId = definition.id;
    element.style.setProperty('--label-accent', definition.accent);
    const anchor = new CSS2DObject(element);
    anchor.name = `LABEL__${definition.id}`;
    this.labelRoot.add(anchor);
    this.labels.set(definition.id, { id: definition.id, definition, anchor, object: group, labelHeight });
    this.updateSingleLabel(this.labels.get(definition.id)!);
  }

  private updateSingleLabel(record: LabelRecord) {
    const position = new THREE.Vector3(0, record.labelHeight, 0);
    record.object.localToWorld(position);
    record.anchor.position.copy(position);
  }

  private updateLabels(force = false) {
    this.labels.forEach((record) => {
      this.updateSingleLabel(record);
      const element = record.anchor.element as HTMLElement;
      if (!record.object.visible) {
        element.classList.add('label-suppressed');
        return;
      }
      const distance = this.camera.position.distanceTo(record.anchor.position);
      const priority =
        record.definition.id === this.selectedId ||
        (this.mode !== 'walk' && (record.definition.category === 'core' || record.definition.category === 'biome'));
      const distanceThreshold = this.mode === 'walk' ? 10 : this.mode === 'edit' ? 52 : 42;
      const visible = record.definition.category === 'academic-building'
        ? this.mode === 'edit' && (priority || distance < distanceThreshold)
        : this.mode === 'plan' || priority || distance < distanceThreshold;
      element.classList.toggle('label-suppressed', !visible);
      if (force || visible) {
        const distanceOpacity = THREE.MathUtils.clamp(1.25 - distance / 150, 0.38, 1);
        element.style.opacity = record.definition.id === this.selectedId ? '1' : String(distanceOpacity);
      }
    });
  }

  private onPointerDown = (event: PointerEvent) => {
    this.pointerDown.set(event.clientX, event.clientY);
  };

  private onPointerUp = (event: PointerEvent) => {
    if (this.draggingGizmo) return;
    const distance = this.pointerDown.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
    if (distance > 5) return;
    if (this.importPlacementChoosing) {
      const placement = this.pickImportPlacement(event);
      if (!placement) return;
      this.importPlacementChoosing = false;
      this.importPlacement = placement.clone();
      this.updateImportPlacementMarker(placement);
      this.renderer.domElement.style.cursor = 'crosshair';
      this.callbacks.onImportPlacementChange?.('chosen', placement.toArray());
      return;
    }
    if (this.mode === 'walk') return;
    const id = this.pick(event);
    if (id) this.select(id, 'scene');
    else if (this.mode !== 'edit') this.clearSelection('scene');
  };

  private onPointerMove = (event: PointerEvent) => {
    if (this.importPlacementChoosing) {
      const placement = this.pickImportPlacement(event);
      if (placement) this.updateImportPlacementMarker(placement);
      this.renderer.domElement.style.cursor = placement ? 'crosshair' : 'not-allowed';
      return;
    }
    if (this.mode === 'walk') {
      this.renderer.domElement.style.cursor = this.walkController.pointerControls.isLocked ? 'none' : 'crosshair';
      return;
    }
    if (this.draggingGizmo) return;
    const id = this.pick(event);
    if (id === this.hoveredId) return;
    this.hoveredId = id;
    this.renderer.domElement.style.cursor = id ? 'pointer' : this.controls.enabled ? 'grab' : 'default';
  };

  private onDoubleClick = (event: MouseEvent) => {
    if (this.mode === 'walk') return;
    const id = this.pick(event);
    if (id) {
      this.select(id, 'scene');
      this.focus(id);
    }
  };

  private inspectFromWalkView() {
    this.activeAcademicHotspot = null;
    this.activeAcademicFountainHotspot = false;
    this.activeCerebrumHotspot = null;
    // The main gate is a broad threshold, so requiring the centre ray to hit a
    // thin iron bar makes the advertised E interaction unreliable. At night,
    // prioritize the gate by physical proximity and operate it with one key
    // press; all other WALK interactions retain the normal inspect/menu flow.
    const academicDistrict = this.objectGroups.get('academic-libraries-theoretical-labs');
    if (this.mode === 'walk'
      && this.activeTimeOfDay === 'night'
      && academicDistrict?.userData.academicGateOpen !== true
      && this.isAcademicMainGateNearby()) {
      const result = this.performAcademicInteraction('open main gate');
      this.callbacks.onAcademicInteraction?.({ title: result.title, message: result.message });
      return;
    }
    // The plaque and spouts sit on a low, broad octagon. Treat E as a nearby
    // courtyard interaction so the user does not have to hit a thin plaque or
    // water stream with the exact centre pixel.
    if (this.mode === 'walk' && academicDistrict && this.isAcademicFountainNearby()) {
      this.activeAcademicFountainHotspot = true;
      this.select('academic-libraries-theoretical-labs', 'scene');
      return;
    }
    this.pointer.set(0, 0);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.raycaster.far = WALK_INSPECT_DISTANCE;
    const cerebrumRoot = this.getCerebrumLibraryRoot();
    const insideCerebrum = Boolean(
      cerebrumRoot && isPointInsideCerebrumLibrary(cerebrumRoot, this.camera.position, 'world'),
    );
    const cerebrumExteriorEnvelopePattern = /MASONRY_WALL|STEEP_SLATE_GABLE|LIMESTONE_STRING_COURSE|OPEN_STONE_DOOR_ARCH|OPEN_OAK_DOOR|LEADED_AMBER_WINDOWS|GOTHIC_BUTTRESSES|BRICK_CHIMNEYS|COLLEGIATE_TOWER|TOWER_SLATE_CAP|ASHCROFT_REFERENCE_GOTHIC_FACADE/;
    const intersections = this.raycaster.intersectObjects(
      [this.architectureRoot, this.landscapeRoot, this.importedRoot, this.interiorsRoot],
      true,
    );
    for (const intersection of intersections) {
      if (!isEffectivelyVisible(intersection.object)) continue;
      const cerebrumHotspot = resolveCerebrumLibraryHotspot(intersection.object);
      let object: THREE.Object3D | null = intersection.object;
      let academicBuilding: AcademicCampusBuilding | null = null;
      let academicFountain = false;
      let selectableId: string | null = null;
      let cerebrumExteriorEnvelope = false;
      while (object) {
        if (cerebrumExteriorEnvelopePattern.test(object.name)) cerebrumExteriorEnvelope = true;
        if (object.userData.academicBuildingData) {
          academicBuilding = object.userData.academicBuildingData as AcademicCampusBuilding;
        } else if (typeof object.userData.academicHotspot === 'string') {
          academicBuilding = academicCampusBuildingById.get(object.userData.academicHotspot) ?? academicBuilding;
        }
        if (object.userData.academicFountainHotspot === true) academicFountain = true;
        if (!selectableId && typeof object.userData.selectableId === 'string') selectableId = object.userData.selectableId;
        object = object.parent;
      }
      if (selectableId) {
        if (cerebrumHotspot) {
          this.activeCerebrumHotspot = cerebrumHotspot;
          this.activeAcademicHotspot = academicCampusBuildingById.get('ashcroft-grand-library') ?? academicBuilding;
          this.select(academicBuildingSelectableId('ashcroft-grand-library'), 'scene');
          return;
        }
        // The legacy exterior facade overlaps the authored walkable volume in
        // a few places. From inside Cerebrum, skip only those envelope hits so
        // the next interior hotspot can resolve; authored interior walls still
        // stop inspection and prevent through-wall interactions.
        if (insideCerebrum && cerebrumExteriorEnvelope) continue;
        this.activeAcademicHotspot = academicBuilding;
        this.activeAcademicFountainHotspot = academicFountain;
        // Academic facilities are individual editor targets, but WALK entrance
        // inspection is still coordinated by the district interaction menu so
        // plaques, histories, the gate, chapel bell, and campus map retain the
        // established context-sensitive flow.
        this.select(academicBuilding ? 'academic-libraries-theoretical-labs' : selectableId, 'scene');
        return;
      }
    }
  }

  private pick(event: MouseEvent | PointerEvent) {
    this.activeAcademicHotspot = null;
    this.activeAcademicFountainHotspot = false;
    this.activeCerebrumHotspot = null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.far = Infinity;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersections = this.raycaster.intersectObjects(
      [
        this.architectureRoot,
        this.landscapeRoot,
        this.importedRoot,
        this.interiorsRoot,
        this.worldStreaming.vistaRoot,
      ],
      true,
    );
    for (const intersection of intersections) {
      if (!isEffectivelyVisible(intersection.object)) continue;
      let object: THREE.Object3D | null = intersection.object;
      let academicBuilding: AcademicCampusBuilding | null = null;
      let academicFountain = false;
      let selectableId: string | null = null;
      while (object) {
        if (object.userData.academicBuildingData) {
          academicBuilding = object.userData.academicBuildingData as AcademicCampusBuilding;
        } else if (typeof object.userData.academicHotspot === 'string') {
          academicBuilding = academicCampusBuildingById.get(object.userData.academicHotspot) ?? academicBuilding;
        }
        if (object.userData.academicFountainHotspot === true) academicFountain = true;
        if (!selectableId && typeof object.userData.selectableId === 'string') selectableId = object.userData.selectableId;
        object = object.parent;
      }
      if (selectableId) {
        this.activeAcademicHotspot = academicBuilding;
        this.activeAcademicFountainHotspot = academicFountain;
        return selectableId;
      }
    }
    return null;
  }

  private pickImportPlacement(event: MouseEvent | PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.far = Infinity;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersections = this.raycaster.intersectObjects(
      [this.transitRoot, this.architectureRoot, this.landscapeRoot],
      true,
    );
    const surface = intersections.find(
      (intersection) => isEffectivelyVisible(intersection.object) && intersection.object.userData.walkable,
    );
    if (surface) return surface.point;
    const islandPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -ISLAND_SURFACE_Y);
    const fallback = this.raycaster.ray.intersectPlane(islandPlane, new THREE.Vector3());
    return fallback && isInsideIslandFootprint(fallback.x, fallback.z) ? fallback : null;
  }

  private updateImportPlacementMarker(position: THREE.Vector3) {
    this.importPlacementMarker.position.copy(position);
    this.importPlacementMarker.position.y += 0.08;
    this.importPlacementMarker.visible = true;
  }

  private getCerebrumLibraryHost() {
    return this.objectGroups.get(academicBuildingSelectableId('ashcroft-grand-library')) ?? null;
  }

  private getCerebrumStreamingConfig(): CerebrumStreamingConfig | null {
    const value = this.getCerebrumLibraryHost()?.userData.cerebrumStreamingConfig as
      | Partial<CerebrumStreamingConfig>
      | undefined;
    if (!value) return null;
    return {
      ...value,
      selectableId: value.selectableId ?? academicBuildingSelectableId('ashcroft-grand-library'),
      width: Number(value.width) || 10.8,
      depth: Number(value.depth) || 7.2,
      quality: value.quality === 'low' || value.quality === 'medium' || value.quality === 'high'
        ? value.quality
        : this.graphicsQuality,
      muted: true,
      hideLegacyShell: value.hideLegacyShell !== false,
      preloadDistanceMetres: Number(value.preloadDistanceMetres) || 60,
      unloadDistanceMetres: Number(value.unloadDistanceMetres) || 90,
      retentionSeconds: Number(value.retentionSeconds) || 15,
    };
  }

  private getCerebrumEntranceWorldPosition(target = new THREE.Vector3()) {
    const host = this.getCerebrumLibraryHost();
    const config = this.getCerebrumStreamingConfig();
    if (!host || !config) return null;
    host.updateWorldMatrix(true, false);
    return target.set(0, 0.18, (config.depth ?? 7.2) * 0.5 + 0.2).applyMatrix4(host.matrixWorld);
  }

  private cloneCerebrumState(state: CerebrumLibraryState): CerebrumLibraryState {
    return {
      ...state,
      doors: { ...state.doors },
      drawers: { ...state.drawers },
      lamps: { ...state.lamps },
    };
  }

  private ensureCerebrumLibraryMounted(reason: 'proximity' | 'walk' | 'orbit' | 'interaction' | 'editing') {
    const existing = this.getCerebrumLibraryRoot();
    if (existing) {
      this.cerebrumStreaming.mounted = true;
      this.cerebrumStreaming.scheduled = false;
      this.cerebrumStreaming.phase = this.cerebrumLibraryPresence || this.cerebrumLibraryInspectionActive
        ? 'active'
        : 'loaded';
      return existing;
    }
    const host = this.getCerebrumLibraryHost();
    const config = this.getCerebrumStreamingConfig();
    if (!host || !config) return null;
    this.cancelScheduledCerebrumLoad?.();
    this.cancelScheduledCerebrumLoad = null;
    this.cerebrumStreaming.scheduled = false;

    const root = createCerebrumLibraryInterior(host, {
      selectableId: config.selectableId,
      width: config.width,
      depth: config.depth,
      quality: this.graphicsQuality,
      muted: true,
      hideLegacyShell: config.hideLegacyShell,
    });
    root.userData.streamingPackage = 'cerebrum-externum';
    root.userData.streamingLoadReason = reason;
    root.userData.streamingLoadedAt = this.elapsed;
    if (this.cachedCerebrumLibraryState) {
      restoreCerebrumLibraryState(root, this.cachedCerebrumLibraryState);
    }
    configureCerebrumLibraryQuality(root, this.graphicsQuality);
    setCerebrumLibraryMuted(root, true);
    const mountedState = getCerebrumLibraryState(root);
    if (mountedState) this.cachedCerebrumLibraryState = this.cloneCerebrumState(mountedState);
    this.cerebrumStreaming = {
      ...this.cerebrumStreaming,
      phase: reason === 'walk' || reason === 'orbit' ? 'active' : 'loaded',
      mounted: true,
      scheduled: false,
      mountedAt: this.elapsed,
    };
    this.refreshAnimatedObjects();
    this.walkController?.refreshNavigation();
    return root;
  }

  private scheduleCerebrumLibraryLoad() {
    if (this.cancelScheduledCerebrumLoad || this.getCerebrumLibraryRoot()) return;
    this.cerebrumStreaming.phase = 'preloading';
    this.cerebrumStreaming.scheduled = true;
    let cancelled = false;
    const load = () => {
      if (cancelled) return;
      this.cancelScheduledCerebrumLoad = null;
      this.cerebrumStreaming.scheduled = false;
      const config = this.getCerebrumStreamingConfig();
      if (config && this.cerebrumStreaming.distanceMetres <= config.unloadDistanceMetres) {
        this.ensureCerebrumLibraryMounted('proximity');
      } else {
        this.cerebrumStreaming.phase = 'unloaded';
      }
    };
    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(load, { timeout: 650 });
      this.cancelScheduledCerebrumLoad = () => {
        cancelled = true;
        window.cancelIdleCallback(handle);
        this.cancelScheduledCerebrumLoad = null;
        this.cerebrumStreaming.scheduled = false;
      };
    } else {
      const handle = globalThis.setTimeout(load, 0);
      this.cancelScheduledCerebrumLoad = () => {
        cancelled = true;
        globalThis.clearTimeout(handle);
        this.cancelScheduledCerebrumLoad = null;
        this.cerebrumStreaming.scheduled = false;
      };
    }
  }

  private unmountCerebrumLibrary() {
    const root = this.getCerebrumLibraryRoot();
    if (!root || this.cerebrumLibraryPresence || this.cerebrumLibraryInspectionActive) return false;
    const state = getCerebrumLibraryState(root);
    if (state) this.cachedCerebrumLibraryState = this.cloneCerebrumState(state);
    this.activeCerebrumHotspot = null;
    disposeCerebrumLibrary(root);
    this.cerebrumStreaming = {
      ...this.cerebrumStreaming,
      phase: 'unloaded',
      mounted: false,
      scheduled: false,
      mountedAt: null,
      unloadCount: this.cerebrumStreaming.unloadCount + 1,
    };
    this.restoreAcademicExteriorAfterInterior();
    this.refreshAnimatedObjects();
    this.walkController.refreshNavigation();
    this.callbacks.onCerebrumPresenceChange?.(false);
    return true;
  }

  private updateCerebrumStreamingLifecycle() {
    const entrance = this.getCerebrumEntranceWorldPosition();
    const config = this.getCerebrumStreamingConfig();
    if (!entrance || !config) return;
    this.cerebrumStreaming.distanceMetres = this.camera.position.distanceTo(entrance) * 10;
    const root = this.getCerebrumLibraryRoot();
    if (!root) {
      if (this.cerebrumStreaming.distanceMetres <= config.preloadDistanceMetres) {
        this.scheduleCerebrumLibraryLoad();
      } else if (this.cerebrumStreaming.scheduled
        && this.cerebrumStreaming.distanceMetres > config.unloadDistanceMetres) {
        this.cancelScheduledCerebrumLoad?.();
        this.cerebrumStreaming.phase = 'unloaded';
      }
      return;
    }

    this.cerebrumStreaming.mounted = true;
    const active = this.cerebrumLibraryPresence || this.cerebrumLibraryInspectionActive;
    if (active) {
      this.cerebrumStreaming.phase = 'active';
      this.cerebrumStreaming.lastActiveAt = this.elapsed;
      return;
    }
    const retainedFor = this.elapsed - this.cerebrumStreaming.lastActiveAt;
    const shouldRetain = retainedFor < config.retentionSeconds;
    this.cerebrumStreaming.phase = shouldRetain ? 'retention' : 'loaded';
    if (!shouldRetain && this.cerebrumStreaming.distanceMetres > config.unloadDistanceMetres) {
      this.unmountCerebrumLibrary();
    }
  }

  private isolateAcademicExteriorForInterior() {
    if (this.academicInteriorIsolation.size) return false;
    const district = this.objectGroups.get('academic-libraries-theoretical-labs');
    const libraryHost = this.getCerebrumLibraryHost();
    if (!district || !libraryHost) return false;
    const retainedPath = new Set<THREE.Object3D>();
    let cursor: THREE.Object3D | null = libraryHost;
    while (cursor && cursor !== district) {
      retainedPath.add(cursor);
      cursor = cursor.parent;
    }
    retainedPath.add(district);

    const isolate = (parent: THREE.Object3D) => {
      if (parent === libraryHost) return;
      parent.children.forEach((child) => {
        if (retainedPath.has(child)) isolate(child);
        else {
          this.academicInteriorIsolation.set(child, child.visible);
          child.visible = false;
        }
      });
    };
    isolate(district);
    return this.academicInteriorIsolation.size > 0;
  }

  private restoreAcademicExteriorAfterInterior() {
    if (!this.academicInteriorIsolation.size) return false;
    this.academicInteriorIsolation.forEach((visible, object) => {
      object.visible = visible;
    });
    this.academicInteriorIsolation.clear();
    return true;
  }

  private isolateExteriorHighDetailRoots() {
    if (this.exteriorHighDetailIsolation.size) return false;
    [this.landscapeRoot, this.transitRoot, this.cityRoot, this.importedRoot, this.interiorsRoot]
      .forEach((root) => {
        this.exteriorHighDetailIsolation.set(root, root.visible);
        root.visible = false;
      });
    return true;
  }

  private restoreExteriorHighDetailRoots() {
    if (!this.exteriorHighDetailIsolation.size) return false;
    this.exteriorHighDetailIsolation.forEach((visible, root) => {
      root.visible = visible;
    });
    this.exteriorHighDetailIsolation.clear();
    return true;
  }

  private updateWorldStreaming(interiorActive: boolean, force = false) {
    // Medium's local amber pools do not need a second shadow-map render of the
    // entire authored library. High retains the optional shadow treatment;
    // exterior Medium keeps the established global policy.
    this.renderer.shadowMap.enabled = interiorActive
      ? this.graphicsQuality === 'high'
      : this.graphicsQuality !== 'low';
    const selectedObject = this.selectedId ? this.objectGroups.get(this.selectedId) : null;
    const selectedPackageId = this.worldStreaming.findPackageId(selectedObject);
    const changed = this.worldStreaming.update({
      cameraPosition: this.camera.position,
      mode: this.mode,
      selectedPackageId,
      interiorPackageId: interiorActive ? 'academic-libraries-theoretical-labs' : null,
      force,
    });
    const isolationChanged = interiorActive
      ? this.isolateAcademicExteriorForInterior()
      : this.restoreAcademicExteriorAfterInterior();
    const exteriorIsolationChanged = interiorActive
      ? this.isolateExteriorHighDetailRoots()
      : this.restoreExteriorHighDetailRoots();
    if ((changed || isolationChanged || exteriorIsolationChanged) && this.walkController) {
      this.walkController.refreshNavigation();
    }
  }

  private animate = (time: number) => {
    if (this.disposed) return;
    // Preserve battery/GPU time when the browser tab is not active. The next
    // visible frame is clamped below, so simulations do not jump forward.
    if (document.hidden) return;
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed = time / 1000;
    this.update(delta);
    this.render();
  };

  private update(delta: number) {
    if (this.mode === 'walk') this.walkController.update(delta);
    else this.controls.update(delta);
    this.updateCerebrumStreamingLifecycle();
    const cerebrumRoot = this.getCerebrumLibraryRoot();
    const insideCerebrum = Boolean(
      cerebrumRoot && isPointInsideCerebrumLibrary(cerebrumRoot, this.camera.position, 'world'),
    );
    if (insideCerebrum !== this.cerebrumLibraryPresence) {
      this.cerebrumLibraryPresence = insideCerebrum;
      this.callbacks.onCerebrumPresenceChange?.(insideCerebrum);
    }
    this.updateWorldStreaming(insideCerebrum || this.cerebrumLibraryInspectionActive);
    this.retryPendingAcademicGateClose();
    this.ocean.material.uniforms.uTime.value = this.elapsed;
    let targetDayMix = 0;
    const targetSkyTop = new THREE.Color('#071827');
    const targetSkyHorizon = new THREE.Color('#9b5f6c');
    const targetSkyBottom = new THREE.Color('#1a3036');
    let targetSunIntensity = 3.6;
    const targetSunColor = new THREE.Color('#ffd9be');
    const targetSunPos = new THREE.Vector3(-180, 310, 170).multiplyScalar(MASTERPLAN_RESCALE);
    let targetHemiIntensity = 1.55;
    const targetHemiSky = new THREE.Color('#9ecbd4');
    const targetHemiGround = new THREE.Color('#17241f');
    const targetFogColor = new THREE.Color('#102632');
    let targetFogDensity = 0.00115 / MASTERPLAN_RESCALE;
    let targetExposure = 1.08;

    if (this.activeTimeOfDay === 'noon') {
      targetDayMix = 1;
      targetSkyTop.set('#162a45');
      targetSkyHorizon.set('#64a3be');
      targetSkyBottom.set('#a8cbdc');
      targetSunIntensity = 5.2;
      targetSunColor.set('#ffffff');
      targetSunPos.set(-50, 350, 50).multiplyScalar(MASTERPLAN_RESCALE);
      targetHemiIntensity = 2.55;
      targetHemiSky.set('#bee4eb');
      targetHemiGround.set('#2f3e3a');
      targetFogColor.set('#99b9bf');
      targetFogDensity = 0.0006 / MASTERPLAN_RESCALE;
      targetExposure = 1.22;
    } else if (this.activeTimeOfDay === 'sunrise') {
      targetDayMix = 0;
      targetSkyTop.set('#1a2639');
      targetSkyHorizon.set('#ffa67e');
      targetSkyBottom.set('#ffe6a3');
      targetSunIntensity = 3.8;
      targetSunColor.set('#ffc8a0');
      targetSunPos.set(-240, 80, 100).multiplyScalar(MASTERPLAN_RESCALE);
      targetHemiIntensity = 2.4;
      targetHemiSky.set('#ffd8c0');
      targetHemiGround.set('#1b2025');
      targetFogColor.set('#fcd2b8');
      targetFogDensity = 0.0018 / MASTERPLAN_RESCALE;
      targetExposure = 1.15;
    } else if (this.activeTimeOfDay === 'sunset') {
      targetDayMix = 0;
      targetSkyTop.set('#0b0e24');
      targetSkyHorizon.set('#ff5e62');
      targetSkyBottom.set('#ff9966');
      targetSunIntensity = 3.2;
      targetSunColor.set('#ff5c20');
      targetSunPos.set(240, 60, -120).multiplyScalar(MASTERPLAN_RESCALE);
      targetHemiIntensity = 2.2;
      targetHemiSky.set('#ff9670');
      targetHemiGround.set('#181822');
      targetFogColor.set('#e2725b');
      targetFogDensity = 0.0011 / MASTERPLAN_RESCALE;
      targetExposure = 1.1;
    } else { // night
      targetDayMix = 0;
      targetSkyTop.set('#02040a');
      targetSkyHorizon.set('#061021');
      targetSkyBottom.set('#03070f');
      targetSunIntensity = 0.85;
      targetSunColor.set('#8ab0ff');
      targetSunPos.set(-150, 220, 150).multiplyScalar(MASTERPLAN_RESCALE);
      targetHemiIntensity = 0.9;
      targetHemiSky.set('#0c1630');
      targetHemiGround.set('#04070a');
      targetFogColor.set('#050912');
      targetFogDensity = 0.0008 / MASTERPLAN_RESCALE;
      targetExposure = 1.05;
    }

    if (this.activeWeather === 'academic-autumn') {
      targetFogColor.set('#667074');
      targetFogDensity = this.mode === 'walk' ? 0.0075 : 0.0024;
      targetSunIntensity *= 0.32;
      targetHemiIntensity *= 1.08;
      targetSkyTop.set('#202832');
      targetSkyHorizon.set('#68737a');
      targetSkyBottom.set('#899195');
      targetSunColor.set('#c7d0d7');
      targetExposure = 1.02;
    } else if (this.activeWeather === 'academic-overcast') {
      targetFogColor.set('#7a8588');
      targetFogDensity = this.mode === 'walk' ? 0.0045 : 0.00155;
      targetSunIntensity *= 0.45;
      targetHemiIntensity *= 1.18;
      targetSkyTop.set('#35414a');
      targetSkyHorizon.set('#7a898d');
      targetSkyBottom.set('#a5acad');
      targetExposure = 1.1;
    } else if (this.activeWeather === 'academic-rainy-dusk') {
      targetFogColor.set('#39464e');
      targetFogDensity = this.mode === 'walk' ? 0.008 : 0.0027;
      targetSunIntensity *= 0.28;
      targetHemiIntensity *= 0.86;
      targetSkyTop.set('#111a25');
      targetSkyHorizon.set('#3c4b56');
      targetSkyBottom.set('#59646a');
      targetExposure = 1.02;
    } else if (this.activeWeather === 'academic-foggy-night') {
      targetFogColor.set('#18232a');
      targetFogDensity = this.mode === 'walk' ? 0.019 : 0.0065;
      targetSunIntensity *= 0.1;
      targetHemiIntensity *= 0.72;
      targetSkyTop.set('#03070c');
      targetSkyHorizon.set('#101b23');
      targetSkyBottom.set('#172229');
      targetExposure = 0.98;
    } else if (this.activeWeather === 'fog') {
      targetFogColor.lerp(new THREE.Color('#cad5d6'), 0.8);
      targetFogDensity = this.mode === 'walk' ? 0.024 : 0.008;
      targetSunIntensity *= 0.15;
      targetHemiIntensity *= 1.25;
    } else if (this.activeWeather === 'rain') {
      targetFogColor.lerp(new THREE.Color('#4c5b63'), 0.75);
      targetFogDensity = this.mode === 'walk' ? 0.006 : 0.0022;
      targetSunIntensity *= 0.6;
      targetSkyTop.lerp(new THREE.Color('#101a24'), 0.85);
      targetSkyHorizon.lerp(new THREE.Color('#384c56'), 0.85);
      targetSkyBottom.lerp(new THREE.Color('#4c5d68'), 0.85);
    } else if (this.activeWeather === 'storm') {
      targetFogColor.lerp(new THREE.Color('#222830'), 0.9);
      targetFogDensity = this.mode === 'walk' ? 0.009 : 0.003;
      targetSunIntensity *= 0.25;
      targetSkyTop.lerp(new THREE.Color('#080d14'), 0.9);
      targetSkyHorizon.lerp(new THREE.Color('#1c232d'), 0.9);
      targetSkyBottom.lerp(new THREE.Color('#242c38'), 0.9);
    }

    if (insideCerebrum || this.cerebrumLibraryInspectionActive) {
      targetSunIntensity *= 0.12;
      targetHemiIntensity *= 0.24;
      targetExposure = this.getCerebrumLibraryState()?.quietMode ? 0.92 : 1.02;
      targetFogDensity = Math.min(targetFogDensity, 0.00045);
    }

    const rate = 3.6;
    this.dayMix = THREE.MathUtils.damp(this.dayMix, targetDayMix, rate, delta);
    this.sky.material.uniforms.uDayMix.value = this.dayMix;
    this.sky.material.uniforms.uTop.value.lerp(targetSkyTop, delta * rate);
    this.sky.material.uniforms.uHorizon.value.lerp(targetSkyHorizon, delta * rate);
    this.sky.material.uniforms.uBottom.value.lerp(targetSkyBottom, delta * rate);
    this.sky.material.uniforms.uSunDir.value.copy(this.sun.position).normalize();
    this.sky.material.uniforms.uIsNight.value = (this.activeTimeOfDay === 'night') ? 1.0 : 0.0;

    this.ocean.material.uniforms.uNight.value = 1 - this.dayMix;

    this.hemisphere.intensity = THREE.MathUtils.damp(this.hemisphere.intensity, targetHemiIntensity, rate, delta);
    this.hemisphere.color.lerp(targetHemiSky, delta * rate);
    this.hemisphere.groundColor.lerp(targetHemiGround, delta * rate);

    this.sun.intensity = THREE.MathUtils.damp(this.sun.intensity, targetSunIntensity, rate, delta);
    this.sun.color.lerp(targetSunColor, delta * rate);
    this.sun.position.lerp(targetSunPos, delta * rate);

    let exposure = THREE.MathUtils.damp(this.renderer.toneMappingExposure, targetExposure, rate, delta);

    const fog = this.scene.fog as THREE.FogExp2;
    fog.color.lerp(targetFogColor, delta * rate);
    fog.density = THREE.MathUtils.damp(fog.density, targetFogDensity, rate, delta);
    this.scene.background = fog.color;

    if (this.activeWeather === 'storm') {
      if (this.lightningFlashTime > 0) {
        this.lightningFlashTime -= delta;
        if (this.lightningFlashTime <= 0) {
          this.lightningFlashTime = 0;
        }
        exposure = 3.8;
        fog.color.set('#ffffff');
        this.sun.intensity = 12.0;
        this.sun.color.set('#ffffff');
      } else if (Math.random() < 0.004) {
        this.lightningFlashTime = 0.08 + Math.random() * 0.12;
      }
    }
    this.renderer.toneMappingExposure = exposure;

    const precipitationWeather = this.activeWeather === 'rain'
      || this.activeWeather === 'storm'
      || this.activeWeather === 'academic-rainy-dusk'
      || this.activeWeather === 'academic-autumn';
    this.precipitation.points.visible = precipitationWeather && !insideCerebrum;
    const playerPos = this.mode === 'walk' ? this.camera.position : this.controls.target;
    this.precipitation.update(delta, playerPos, this.elapsed);

    this.animatedObjects.forEach((object) => {
      if (!isEffectivelyVisible(object)) {
        if (object.userData.animate === 'academic-fountain') {
          this.academicAudio.setFountain(0, Number.POSITIVE_INFINITY);
        }
        return;
      }
      if (object.userData.animate === 'ring-pod') {
        const angle = this.elapsed * Number(object.userData.speed) + Number(object.userData.phase);
        const rx = Number(object.userData.ringX);
        const rz = Number(object.userData.ringZ);
        object.position.set(Math.cos(angle) * rx, 2.15, Math.sin(angle) * rz);
        object.rotation.y = -angle;
      } else if (object.userData.animate === 'coastal-train') {
        const path = object.userData.railPath as Array<[number, number]>;
        const totalLength = Number(object.userData.totalPathLength);
        let distance = (this.elapsed * Number(object.userData.speed) + Number(object.userData.phaseDistance)) % totalLength;
        let segmentIndex = 0;
        let segmentLength = 0;
        for (; segmentIndex < path.length; segmentIndex += 1) {
          const [x1, z1] = path[segmentIndex];
          const [x2, z2] = path[(segmentIndex + 1) % path.length];
          segmentLength = Math.hypot(x2 - x1, z2 - z1);
          if (distance <= segmentLength) break;
          distance -= segmentLength;
        }
        const [x1, z1] = path[segmentIndex % path.length];
        const [x2, z2] = path[(segmentIndex + 1) % path.length];
        const t = segmentLength > 0 ? distance / segmentLength : 0;
        const dx = x2 - x1;
        const dz = z2 - z1;
        const inverseLength = 1 / Math.max(0.0001, Math.hypot(dx, dz));
        const trackOffset = Number(object.userData.trackOffset);
        object.position.set(
          THREE.MathUtils.lerp(x1, x2, t) - dz * inverseLength * trackOffset,
          Number(object.userData.trackY),
          THREE.MathUtils.lerp(z1, z2, t) + dx * inverseLength * trackOffset,
        );
        object.rotation.y = Math.atan2(dx, dz);
      } else if (object.userData.animate === 'quantum-core') {
        object.rotation.y += delta * 0.55;
        object.rotation.x += delta * 0.22;
        const pulse = 1 + Math.sin(this.elapsed * 2.1) * 0.06;
        object.scale.setScalar(pulse);
      } else if (object.userData.animate === 'industrial-fan') {
        object.rotation.y += delta * Number(object.userData.speed ?? 0.18);
      } else if (object.userData.animate === 'industrial-curtain') {
        object.rotation.z = Math.sin(this.elapsed * 0.72 + Number(object.userData.phase ?? 0)) * 0.035;
      } else if (object.userData.animate === 'industrial-chain') {
        object.rotation.z = Math.sin(this.elapsed * 0.31 + Number(object.userData.phase ?? 0)) * 0.025;
      } else if (object.userData.animate === 'industrial-pump') {
        object.position.y = Number(object.userData.baseY) + Math.sin(this.elapsed * 4.2) * 0.006;
      } else if (object.userData.animate === 'industrial-water') {
        object.position.y += Math.sin(this.elapsed * 0.9 + Number(object.userData.phase ?? 0)) * delta * 0.0012;
      } else if (object.userData.animate === 'industrial-moving-light') {
        object.position.x = Math.sin(this.elapsed * 0.26) * 0.72;
        if (object instanceof THREE.Light) object.intensity = 1.45 + Math.sin(this.elapsed * 0.43) * 0.55;
      } else if (object.userData.animate === 'industrial-flicker') {
        const flicker = Math.sin(this.elapsed * 13.7) * Math.sin(this.elapsed * 4.31) > -0.24 ? 1 : 0.08;
        if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial) {
          object.material.emissiveIntensity = 0.35 + flicker * 3.2;
        }
      } else if (object.userData.animate === 'industrial-beacon') {
        const pulse = Math.sin(this.elapsed * 4.6 + Number(object.userData.phase ?? 0)) > 0.6 ? 1 : 0.16;
        if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial) {
          object.material.emissiveIntensity = 0.25 + pulse * 4.4;
        }
        object.scale.setScalar(0.96 + pulse * 0.09);
      } else if (object.userData.animate === 'industrial-steam') {
        const phase = Number(object.userData.phase ?? 0);
        object.position.y = Number(object.userData.baseY) + ((this.elapsed * 0.055 + phase * 0.08) % 0.34);
        object.position.x += Math.sin(this.elapsed * 0.32 + phase) * delta * 0.006;
        if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshBasicMaterial) {
          object.material.opacity = 0.045 + (0.5 + 0.5 * Math.sin(this.elapsed * 0.6 + phase)) * 0.08;
        }
      } else if (object.userData.animate === 'industrial-conveyor') {
        object.position.x = Number(object.userData.baseX) + ((this.elapsed * 0.018) % 0.08);
      } else if (object.userData.animate === 'industrial-truck-vibration') {
        object.position.y = Number(object.userData.baseY) + Math.sin(this.elapsed * 17) * 0.002;
      } else if (object.userData.animate === 'industrial-camera') {
        object.rotation.y = Number(object.userData.baseRotationY) + Math.sin(this.elapsed * 0.22) * 0.18;
      } else if (object.userData.animate === 'industrial-ground-mist') {
        object.position.x = Number(object.userData.baseX) + Math.sin(this.elapsed * 0.11 + Number(object.userData.phase ?? 0)) * 0.28;
      } else if (object.userData.animate === 'academic-tree-wind') {
        updateAcademicTreeWind(object, this.elapsed);
      } else if (object.userData.animate === 'academic-fountain') {
        const distance = object.getWorldPosition(new THREE.Vector3()).distanceTo(this.camera.position);
        updateAcademicFountain(object, this.elapsed, delta, distance);
        this.academicAudio.setFountain(getAcademicFountainState(object)?.waterFlow ?? 0, distance);
      }
    });

    if (cerebrumRoot) {
      updateCerebrumLibrary(cerebrumRoot, delta, this.camera);
      const roomId = getCerebrumLibraryRoomAt(cerebrumRoot, this.camera.position, 'world');
      const walkState = this.walkController.getSnapshot();
      const roomName = roomId ?? (insideCerebrum ? walkState.roomId : null);
      this.walkController.setRoomContext(insideCerebrum ? roomName : null);
      const windowProximity = roomName && /vestibule|reading|stair|catalogue|office/i.test(roomName) ? 0.72 : 0.16;
      this.academicAudio.setLibraryContext({
        inside: insideCerebrum,
        roomId: roomName,
        windowProximity,
        surface: walkState.surfaceKind,
        speed: this.mode === 'walk' ? walkState.speedMetresPerSecond / 10 : 0,
        quiet: getCerebrumLibraryState(cerebrumRoot)?.quietMode ?? false,
      });
    } else {
      this.walkController.setRoomContext(null);
      this.academicAudio.setLibraryContext({ inside: false, speed: 0 });
    }

    if (this.cameraTween && this.mode !== 'walk') {
      const now = performance.now();
      const linear = THREE.MathUtils.clamp((now - this.cameraTween.startedAt) / this.cameraTween.duration, 0, 1);
      const eased = 1 - Math.pow(1 - linear, 3);
      this.camera.position.lerpVectors(this.cameraTween.positionFrom, this.cameraTween.positionTo, eased);
      this.controls.target.lerpVectors(this.cameraTween.targetFrom, this.cameraTween.targetTo, eased);
      if (linear >= 1) this.cameraTween = null;
    }
    this.refreshSelectionBounds();
    this.updateLabels();
  }

  private render() {
    const library = this.getCerebrumLibraryRoot();
    const libraryView = Boolean(
      library
      && (this.cerebrumLibraryInspectionActive
        || isPointInsideCerebrumLibrary(library, this.camera.position, 'world')),
    );
    // Full-scene SAO/bloom is intentionally a High-quality feature. The
    // default Medium tier keeps the large island responsive while local
    // emissive lamps still provide the library's restrained glow.
    if (libraryView && this.graphicsQuality === 'high') this.composer.render();
    else this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  private resize() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.labelRenderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private refreshSelectionBounds() {
    if (!this.selectedId) {
      this.selectionBox.visible = false;
      return;
    }
    const group = this.objectGroups.get(this.selectedId);
    if (!group || !group.visible) {
      this.selectionBox.visible = false;
      return;
    }
    this.selectionBounds.setFromObject(group, true);
    this.selectionBox.box = this.selectionBounds;
    this.selectionBox.visible = true;
  }

  private animateCamera(position: THREE.Vector3, target: THREE.Vector3, duration = 1100) {
    this.cameraTween = {
      startedAt: performance.now(),
      duration,
      positionFrom: this.camera.position.clone(),
      positionTo: position.clone(),
      targetFrom: this.controls.target.clone(),
      targetTo: target.clone(),
    };
  }

  select(id: string, source: 'scene' | 'ui' | 'system' = 'ui') {
    const definition = this.definitions.get(id);
    const group = this.objectGroups.get(id);
    if (!definition || !group) return;
    if (
      this.activeInteriorBuildingId &&
      !(
        ((definition.category === 'editor' && definition.workspace === 'interior') ||
          (definition.category === 'imported' && definition.workspace === 'interior')) &&
        definition.parentBuildingId === this.activeInteriorBuildingId
      )
    ) {
      return;
    }
    if (this.selectedId) {
      const previousLabel = this.labels.get(this.selectedId)?.anchor.element;
      previousLabel?.classList.remove('selected');
    }
    this.selectedId = id;
    this.updateWorldStreaming(this.cerebrumLibraryPresence || this.cerebrumLibraryInspectionActive, true);
    const label = this.labels.get(id)?.anchor.element;
    label?.classList.add('selected');
    this.refreshSelectionBounds();
    if (this.mode === 'edit') {
      this.transformControls.attach(group);
      this.transformControls.getHelper().visible = true;
    }
    this.callbacks.onSelection?.(definition, source);
  }

  clearSelection(source: 'scene' | 'ui' | 'system' = 'ui') {
    if (this.selectedId) this.labels.get(this.selectedId)?.anchor.element.classList.remove('selected');
    this.selectedId = null;
    this.selectionBox.visible = false;
    this.transformControls.detach();
    this.transformControls.getHelper().visible = false;
    this.updateWorldStreaming(this.cerebrumLibraryPresence || this.cerebrumLibraryInspectionActive, true);
    this.callbacks.onSelection?.(null, source);
  }

  setMode(mode: ViewMode) {
    const previousMode = this.mode;
    // Fountain top-down inspection uses a Z-axis up vector. Every normal
    // world mode starts from canonical Y-up so that orbit, plan, and WALK
    // controls cannot inherit a rolled camera.
    this.camera.up.set(0, 1, 0);
    this.setAcademicFountainInspectionControls(false);
    this.setCerebrumLibraryInspectionControls(false);
    if (this.activeInteriorBuildingId && mode !== 'edit') this.exitInterior(false);
    if (previousMode === 'walk' && mode !== 'walk') {
      this.walkController.exit();
      const forward = this.camera.getWorldDirection(new THREE.Vector3());
      this.controls.target.copy(this.camera.position).addScaledVector(forward, 12);
      this.camera.fov = mode === 'plan' ? 34 : 42;
      this.camera.near = 0.65;
      this.camera.updateProjectionMatrix();
      this.renderer.domElement.style.cursor = 'grab';
    }
    this.mode = mode;
    this.setGroundRoadDepthMode(mode === 'walk');
    this.controls.enabled = mode !== 'walk';
    this.controls.enableRotate = mode !== 'plan' && mode !== 'walk';
    this.controls.enablePan = true;
    this.transformControls.detach();
    this.transformControls.getHelper().visible = false;
    if (mode === 'walk') {
      this.cameraTween = null;
      this.clearSelection('system');
      const preservedDirection = this.camera.getWorldDirection(new THREE.Vector3());
      const preferredSpawn = this.camera.position.clone();
      const focusedSpawn = this.controls.target.clone();
      this.camera.fov = WALK_VERTICAL_FOV;
      this.camera.near = 0.015;
      this.camera.updateProjectionMatrix();
      this.walkController.enter(preferredSpawn, preservedDirection, focusedSpawn);
      this.renderer.domElement.style.cursor = 'crosshair';
    } else if (mode === 'plan') {
      this.camera.fov = 34;
      this.camera.updateProjectionMatrix();
      this.animateCamera(
        new THREE.Vector3(0, 940 * MASTERPLAN_RESCALE, 0.1),
        new THREE.Vector3(0, 0, 0),
        1050,
      );
    } else if (mode === 'edit') {
      this.cameraTween = null;
      if (this.selectedId) {
        const group = this.objectGroups.get(this.selectedId);
        if (group) {
          this.transformControls.attach(group);
          this.transformControls.getHelper().visible = true;
        }
      }
    } else {
      this.cameraTween = null;
    }
    this.updateLabels(true);
  }

  private setGroundRoadDepthMode(walkDepth: boolean) {
    const updated = new Set<THREE.Material>();
    this.modelRoot.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (!material.userData.groundRoadDepthMode || updated.has(material)) return;
        updated.add(material);
        material.depthTest = walkDepth;
        material.depthWrite = walkDepth;
        material.needsUpdate = true;
      });
    });
  }

  getMode() {
    return this.mode;
  }

  setGizmoMode(mode: GizmoMode) {
    this.transformControls.setMode(mode);
  }

  getEditWorkspace() {
    return this.editWorkspace;
  }

  getAssetCatalog(workspace: EditorWorkspace = this.editWorkspace): readonly EditorAssetCatalogItem[] {
    return EDITOR_ASSET_CATALOG.filter((item) => item.workspace === workspace);
  }

  getActiveInteriorBuildingId() {
    return this.activeInteriorBuildingId;
  }

  setEditWorkspace(workspace: EditorWorkspace) {
    if (workspace === 'landscape' && this.activeInteriorBuildingId) this.exitInterior();
    this.editWorkspace = workspace;
    this.callbacks.onEditWorkspaceChange?.(workspace, this.activeInteriorBuildingId);
  }

  canEnterInterior(id = this.selectedId) {
    if (!id) return false;
    const definition = this.definitions.get(id);
    if (!definition) return false;
    if (definition.category === 'biome') return true;
    if (definition.category === 'editor') return definition.assetKind === 'building';
    if (definition.category === 'imported') {
      return definition.workspace !== 'interior' && definition.footprint[0] >= 2;
    }
    return true;
  }

  addCatalogAsset(catalogId: string, customPosition?: THREE.Vector3): EditorAssetDefinition | null {
    const item = EDITOR_ASSET_CATALOG.find((entry) => entry.id === catalogId);
    if (!item || item.workspace !== this.editWorkspace) return null;
    if (item.workspace === 'interior' && !this.activeInteriorBuildingId) return null;

    this.generatedAssetSequence += 1;
    const id = `editor-${slugify(item.id)}-${this.generatedAssetSequence.toString(36)}`;
    const group = createEditorAsset(item, id);
    group.name = `${item.workspace === 'interior' ? 'INTERIOR_ASSET' : 'LANDSCAPE_ASSET'}__${slugify(item.name)}`;
    group.userData.editable = true;
    group.userData.catalogId = item.id;
    group.userData.workspace = item.workspace;

    const defaultInteractions = (() => {
      const list: string[] = [];
      const lid = item.id;
      if (lid.includes('chair') || lid.includes('bench') || lid.includes('sofa') || lid.includes('desk') || lid.includes('workstation')) {
        list.push('sit');
      }
      if (lid.includes('sofa') || lid.includes('chair') || lid.includes('pod')) {
        list.push('sleep');
      }
      if (lid.includes('microscope') || lid.includes('sequencer') || lid.includes('centrifuge') || lid.includes('dispenser') || lid.includes('bench') || lid.includes('lab') || lid.includes('tower')) {
        list.push('research');
        list.push('analyze');
      }
      if (lid.includes('lamp') || lid.includes('gate') || lid.includes('spire') || lid.includes('rack') || lid.includes('console') || lid.includes('sequencer') || lid.includes('dispenser') || lid.includes('canopy')) {
        list.push('power');
      }
      if (lid.includes('shower') || lid.includes('dome') || lid.includes('cabinet') || lid.includes('airlock')) {
        list.push('decontaminate');
      }
      return list.length ? list : ['research'];
    })();

    group.userData.primaryColor = '#ffffff';
    group.userData.secondaryColor = '#74858a';
    group.userData.patternType = 'solid';
    group.userData.patternScale = 1.0;
    group.userData.collisionEnabled = true;
    group.userData.interactions = defaultInteractions;

    applyCustomStyles(group, '#ffffff', '#74858a', item.accent, 'solid', 1.0);

    let parentBuildingId: string | undefined;
    if (item.workspace === 'interior') {
      parentBuildingId = this.activeInteriorBuildingId ?? undefined;
      if (!parentBuildingId) return null;
      const interior = this.ensureInterior(parentBuildingId);
      if (!interior) return null;
      const placed = this.interiorAssetIds.get(parentBuildingId)?.size ?? 0;
      const width = Number(interior.userData.roomWidth) || 8;
      const depth = Number(interior.userData.roomDepth) || 6;
      const columns = 4;
      const column = placed % columns;
      const row = Math.floor(placed / columns) % 3;
      group.position.set(
        THREE.MathUtils.lerp(-width * 0.31, width * 0.31, column / (columns - 1)),
        0.012,
        THREE.MathUtils.lerp(-depth * 0.24, depth * 0.2, row / 2),
      );
      interior.add(group);
    } else {
      if (customPosition) {
        group.position.copy(customPosition);
        group.position.y = ISLAND_SURFACE_Y + 0.04;
      } else {
        const selected = this.selectedId ? this.objectGroups.get(this.selectedId) : null;
        const base = selected?.getWorldPosition(new THREE.Vector3()) ?? new THREE.Vector3(0, ISLAND_SURFACE_Y, 20);
        const angle = this.generatedAssetSequence * 2.39996;
        const radius = 3.8 + (this.generatedAssetSequence % 4) * 1.25;
        group.position.set(
          base.x + Math.cos(angle) * radius,
          ISLAND_SURFACE_Y + 0.04,
          base.z + Math.sin(angle) * radius,
        );
      }
      (item.kind === 'building' ? this.architectureRoot : this.landscapeRoot).add(group);
    }

    const definition: EditorAssetDefinition = {
      id,
      name: item.name,
      sourceLabel: `Design Studio / ${item.category}`,
      category: 'editor',
      ring: 'custom',
      position: [group.position.x, group.position.y, group.position.z],
      footprint: item.footprint,
      height: item.height,
      archetype: item.kind === 'building' ? 'Editable building' : item.workspace === 'interior' ? 'Interior object' : 'Landscape object',
      accent: item.accent,
      palette: ['#10191b', '#26383b', '#d6e1de', item.accent],
      description: item.description,
      workspace: item.workspace,
      assetKind: item.kind,
      catalogId: item.id,
      parentBuildingId,
      primaryColor: '#ffffff',
      secondaryColor: '#74858a',
      patternType: 'solid',
      patternScale: 1.0,
      collisionEnabled: true,
      interactions: defaultInteractions,
    };
    this.registerSelectable(definition, group, item.height + 0.8, false, item.workspace === 'landscape');
    if (parentBuildingId) {
      const ids = this.interiorAssetIds.get(parentBuildingId) ?? new Set<string>();
      ids.add(id);
      this.interiorAssetIds.set(parentBuildingId, ids);
    }
    this.walkController.refreshNavigation();
    this.callbacks.onObjectAdded?.(definition);
    this.select(id, 'system');
    this.focus(id);
    this.applySeasonColors(this.activeSeason);
    return definition;
  }

  deleteObject(id = this.selectedId) {
    if (!id || !this.definitions.has(id)) return false;
    if (this.activeInteriorBuildingId === id) this.exitInterior();
    const interiorAssets = Array.from(this.interiorAssetIds.get(id) ?? []);
    interiorAssets.forEach((assetId) => this.unregisterObject(assetId));
    const interior = this.interiorGroups.get(id);
    if (interior) {
      interior.removeFromParent();
      this.interiorGroups.delete(id);
      this.interiorAssetIds.delete(id);
    }
    this.unregisterObject(id);
    this.walkController.refreshNavigation();
    return true;
  }

  enterInterior(id = this.selectedId) {
    if (!id || !this.canEnterInterior(id)) return false;
    if (this.mode !== 'edit') this.setMode('edit');
    if (this.activeInteriorBuildingId && this.activeInteriorBuildingId !== id) this.exitInterior();
    const interior = this.ensureInterior(id);
    if (!interior) return false;

    if (!this.interiorReturnState) {
      const isolatedRoots = [
        this.landscapeRoot,
        this.architectureRoot,
        this.transitRoot,
        this.cityRoot,
        this.importedRoot,
        this.presentationRoot,
        this.labelRoot,
      ];
      this.interiorReturnState = {
        cameraPosition: this.camera.position.clone(),
        cameraTarget: this.controls.target.clone(),
        cameraFov: this.camera.fov,
        cameraNear: this.camera.near,
        minDistance: this.controls.minDistance,
        maxDistance: this.controls.maxDistance,
        maxPolarAngle: this.controls.maxPolarAngle,
        rootVisibility: new Map(isolatedRoots.map((root) => [root, root.visible])),
      };
      isolatedRoots.forEach((root) => {
        root.userData.editorIsolationRestoreVisible = root.visible;
        root.visible = false;
      });
    }

    this.editWorkspace = 'interior';
    this.activeInteriorBuildingId = id;
    this.interiorsRoot.children.forEach((child) => {
      child.visible = child === interior;
    });
    interior.traverse((child) => {
      if (child.userData.editorCutawayCeiling || child.name.includes('INTERIOR_SHELL__CEILING_BEAM')) {
        child.userData.editorCutawayCeiling = true;
        child.visible = false;
      }
    });
    this.clearSelection('system');
    this.cameraTween = null;
    this.camera.fov = 52;
    this.camera.near = 0.02;
    this.camera.updateProjectionMatrix();
    this.controls.minDistance = 0.28;
    this.controls.maxDistance = 24;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    interior.updateMatrixWorld(true);
    const depth = Number(interior.userData.roomDepth) || 7;
    const roomHeight = Number(interior.userData.roomHeight) || 0.5;
    const target = interior.localToWorld(new THREE.Vector3(0, roomHeight * 0.34, -depth * 0.04));
    const position = interior.localToWorld(new THREE.Vector3(0, roomHeight * 1.28, depth * 0.52));
    this.camera.position.copy(position);
    this.controls.target.copy(target);
    this.controls.update();
    this.callbacks.onEditWorkspaceChange?.('interior', id);
    this.updateLabels(true);
    return true;
  }

  exitInterior(restoreCamera = true) {
    const activeId = this.activeInteriorBuildingId;
    if (!activeId) return;
    const active = this.interiorGroups.get(activeId);
    if (active) {
      active.visible = false;
      active.traverse((child) => {
        if (child.userData.editorCutawayCeiling) child.visible = true;
      });
    }
    if (this.selectedId) this.clearSelection('system');
    const saved = this.interiorReturnState;
    if (saved) {
      saved.rootVisibility.forEach((visible, root) => {
        root.visible = visible;
        delete root.userData.editorIsolationRestoreVisible;
      });
      this.camera.fov = saved.cameraFov;
      this.camera.near = saved.cameraNear;
      this.camera.updateProjectionMatrix();
      this.controls.minDistance = saved.minDistance;
      this.controls.maxDistance = saved.maxDistance;
      this.controls.maxPolarAngle = saved.maxPolarAngle;
      if (restoreCamera) {
        this.camera.position.copy(saved.cameraPosition);
        this.controls.target.copy(saved.cameraTarget);
        this.controls.update();
      }
    }
    this.activeInteriorBuildingId = null;
    this.interiorReturnState = null;
    this.callbacks.onEditWorkspaceChange?.(this.editWorkspace, null);
  }

  private ensureInterior(buildingId: string) {
    const existing = this.interiorGroups.get(buildingId);
    if (existing) return existing;
    const definition = this.definitions.get(buildingId);
    if (!definition || !this.canEnterInterior(buildingId)) return null;
    const biomeInterior = definition.category === 'biome';
    const width = biomeInterior ? 5.8 : THREE.MathUtils.clamp(definition.footprint[0] * 0.76, 4.8, 12);
    const depth = biomeInterior ? 4.6 : THREE.MathUtils.clamp(definition.footprint[1] * 0.76, 4.5, 10);
    const interior = createInteriorShell(buildingId, width, depth, definition.accent);
    interior.name = `INTERIOR__${slugify(definition.name)}`;
    interior.userData.buildingId = buildingId;
    interior.userData.roomWidth = width;
    interior.userData.roomDepth = depth;
    interior.userData.exportAlways = true;
    if (definition.category === 'biome') {
      interior.userData.biomeLaboratory = true;
      interior.userData.labType = 'Biome field laboratory';
      const fixturePlacements = [
        { id: 'interior-wet-lab-bench', x: -1.35, z: -0.65, rotation: 0 },
        { id: 'interior-biosafety-cabinet', x: 1.45, z: -1.4, rotation: 0 },
        { id: 'interior-holo-microscope', x: 0.15, z: 0.25, rotation: Math.PI * 0.5 },
        { id: 'interior-cryo-freezer', x: 1.55, z: 1.35, rotation: Math.PI },
        { id: 'interior-focus-workstation', x: -1.35, z: 1.25, rotation: Math.PI },
      ];
      fixturePlacements.forEach((placement) => {
        const item = EDITOR_ASSET_CATALOG.find((entry) => entry.id === placement.id);
        if (!item) return;
        const fixture = createEditorAsset(item, buildingId);
        fixture.name = `BIOME_LAB_DEFAULT__${slugify(item.name)}`;
        fixture.position.set(placement.x, 0.012, placement.z);
        fixture.rotation.y = placement.rotation;
        fixture.scale.setScalar(item.id === 'interior-wet-lab-bench' ? 1.85 : 1.7);
        fixture.traverse((child) => {
          child.userData.selectableId = buildingId;
          child.userData.biomeLabFixture = true;
          child.userData.editorWorkspace = 'interior';
        });
        interior.add(fixture);
      });
      interior.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          const typed = material as THREE.MeshStandardMaterial;
          if (material.name.includes('PALE') && typed.color) typed.color.set('#25363b');
          if (material.name.includes('SHELL') && typed.color) typed.color.set('#52656b');
          if (material.name.includes('DARK') && typed.color) typed.color.set('#0b151b');
        });
      });
    }
    interior.visible = false;
    this.interiorsRoot.add(interior);
    this.interiorGroups.set(buildingId, interior);
    this.interiorAssetIds.set(buildingId, new Set());
    this.syncInteriorTransform(buildingId);
    return interior;
  }

  private syncInteriorTransform(buildingId: string) {
    const building = this.objectGroups.get(buildingId);
    const interior = this.interiorGroups.get(buildingId);
    if (!building || !interior) return;
    building.updateWorldMatrix(true, false);
    building.getWorldPosition(interior.position);
    building.getWorldQuaternion(interior.quaternion);
    building.getWorldScale(interior.scale);
    interior.updateMatrixWorld(true);
  }

  private unregisterObject(id: string, notifyUi = true) {
    const definition = this.definitions.get(id);
    const group = this.objectGroups.get(id);
    if (!definition || !group) return;
    if (this.selectedId === id) this.clearSelection('system');
    const label = this.labels.get(id);
    if (label) {
      label.anchor.removeFromParent();
      label.anchor.element.remove();
      this.labels.delete(id);
    }
    const fountain = group.getObjectByName(ACADEMIC_FOUNTAIN_ROOT_NAME);
    if (fountain) disposeAcademicFountain(fountain);
    const library = group.getObjectByName(CEREBRUM_LIBRARY_ROOT_NAME);
    if (library) disposeCerebrumLibrary(library);
    group.removeFromParent();
    this.objectGroups.delete(id);
    this.definitions.delete(id);
    this.initialTransforms.delete(id);
    if ('parentBuildingId' in definition && definition.parentBuildingId) {
      this.interiorAssetIds.get(definition.parentBuildingId)?.delete(id);
    }
    if (notifyUi) this.callbacks.onObjectDeleted?.(id);
  }

  focus(id: string) {
    if (this.mode === 'walk') return;
    this.setAcademicFountainInspectionControls(false);
    this.setCerebrumLibraryInspectionControls(false);
    this.camera.up.set(0, 1, 0);
    const object = this.objectGroups.get(id);
    if (!object) return;
    const box = new THREE.Box3().setFromObject(object, true);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z, this.activeInteriorBuildingId ? 0.55 : 4);
    if (this.mode === 'plan') {
      this.animateCamera(new THREE.Vector3(center.x, Math.max(45, radius * 7), center.z + 0.01), center, 820);
      return;
    }
    const viewDirection = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
    const distance = THREE.MathUtils.clamp(
      radius * 2.7,
      this.activeInteriorBuildingId ? 1.8 : 11,
      this.activeInteriorBuildingId ? 12 : 38,
    );
    const destination = center.clone().addScaledVector(viewDirection, distance);
    destination.y = Math.max(destination.y, center.y + radius * (this.activeInteriorBuildingId ? 0.65 : 1.15));
    this.animateCamera(destination, center, 820);
  }

  overview() {
    this.setAcademicFountainInspectionControls(false);
    this.setCerebrumLibraryInspectionControls(false);
    this.camera.up.set(0, 1, 0);
    const plan = this.mode === 'plan';
    if (!plan) this.setMode('explore');
    this.cameraTween = null;
    this.camera.fov = plan ? 34 : 42;
    this.camera.near = 0.65;
    this.camera.updateProjectionMatrix();
    this.animateCamera(
      plan
        ? new THREE.Vector3(0, 940 * MASTERPLAN_RESCALE, 0.1)
        : new THREE.Vector3(
            390 * MASTERPLAN_RESCALE,
            305 * MASTERPLAN_RESCALE,
            420 * MASTERPLAN_RESCALE,
          ),
      plan
        ? new THREE.Vector3(0, 0, 0)
        : new THREE.Vector3(0, 2, -18 * MASTERPLAN_RESCALE),
      1050,
    );
  }

  setLayer(layer: SceneLayer, visible: boolean) {
    let affectedRoot: THREE.Object3D | null = null;
    if (layer === 'buildings') {
      affectedRoot = this.architectureRoot;
      this.worldStreaming.setLayerEnabled('district', visible);
    }
    if (layer === 'landscape') {
      affectedRoot = this.landscapeRoot;
      this.worldStreaming.setLayerEnabled('biome', visible);
    }
    if (layer === 'transit') affectedRoot = this.transitRoot;
    if (affectedRoot) affectedRoot.visible = visible;
    if (layer === 'labels') this.labelRoot.visible = visible;
    if (!visible && affectedRoot && this.selectedId) {
      const selected = this.objectGroups.get(this.selectedId);
      let cursor: THREE.Object3D | null = selected ?? null;
      while (cursor && cursor !== affectedRoot) cursor = cursor.parent;
      if (cursor === affectedRoot) this.clearSelection('system');
    }
  }

  setDaylight(daylight: boolean) {
    if (!this.applyingAcademicFountainEnvironment) this.academicFountainEnvironmentOwned = false;
    this.dayTarget = daylight ? 1 : 0;
    this.activeTimeOfDay = daylight ? 'noon' : 'night';
    this.syncAcademicGateForTime();
  }

  isDaylight() {
    return this.activeTimeOfDay === 'noon' || this.activeTimeOfDay === 'sunrise';
  }

  setTimeOfDay(time: 'sunrise' | 'noon' | 'sunset' | 'night') {
    if (!this.applyingAcademicFountainEnvironment) this.academicFountainEnvironmentOwned = false;
    this.activeTimeOfDay = time;
    this.dayTarget = time === 'noon' ? 1 : 0;
    this.syncAcademicGateForTime();
  }

  getTimeOfDay() {
    return this.activeTimeOfDay;
  }

  setWeather(weather: WeatherMode) {
    if (!this.applyingAcademicFountainEnvironment) this.academicFountainEnvironmentOwned = false;
    this.activeWeather = weather;
    if (weather === 'academic-autumn') {
      this.activeTimeOfDay = 'sunset';
      this.dayTarget = 0;
      this.activeSeason = 'autumn';
      this.applySeasonColors('autumn');
    } else if (weather === 'academic-overcast') {
      this.activeTimeOfDay = 'noon';
      this.dayTarget = 1;
    } else if (weather === 'academic-rainy-dusk') {
      this.activeTimeOfDay = 'sunset';
      this.dayTarget = 0;
      this.activeSeason = 'autumn';
      this.applySeasonColors('autumn');
    } else if (weather === 'academic-foggy-night') {
      this.activeTimeOfDay = 'night';
      this.dayTarget = 0;
    }
    if (weather === 'rain' || weather === 'storm' || weather === 'academic-rainy-dusk' || weather === 'academic-autumn') {
      this.precipitation.points.visible = true;
      this.precipitation.setType(this.activeSeason === 'winter' ? 'snow' : 'rain');
    } else {
      this.precipitation.points.visible = false;
    }
    this.academicAudio.setWeather(weather);
    this.syncAcademicGateForTime();
  }

  private refreshAnimatedObjects() {
    this.animatedObjects.length = 0;
    this.modelRoot.traverse((child) => {
      if (child.userData.animate) this.animatedObjects.push(child);
    });
  }

  getWeather() {
    return this.activeWeather;
  }

  getActiveAcademicHotspot() {
    if (!this.activeAcademicHotspot) return null;
    const record = this.activeAcademicHotspot;
    const definition = this.definitions.get(academicBuildingSelectableId(record.id));
    const defaultDescription = `${record.description} Founded in ${record.founded}; ${record.zone}.`;
    return {
      ...record,
      name: definition?.name ?? record.name,
      description: definition?.description === defaultDescription
        ? record.description
        : definition?.description ?? record.description,
    };
  }

  private getCerebrumLibraryRoot() {
    return this.objectGroups
      .get(academicBuildingSelectableId('ashcroft-grand-library'))
      ?.getObjectByName(CEREBRUM_LIBRARY_ROOT_NAME) ?? null;
  }

  getCerebrumLibraryState(): CerebrumLibraryState | null {
    const root = this.getCerebrumLibraryRoot();
    const mounted = root ? getCerebrumLibraryState(root) : null;
    if (mounted) {
      this.cachedCerebrumLibraryState = this.cloneCerebrumState(mounted);
      return mounted;
    }
    return this.cachedCerebrumLibraryState
      ? this.cloneCerebrumState(this.cachedCerebrumLibraryState)
      : null;
  }

  getActiveCerebrumLibraryHotspot() {
    return this.activeCerebrumHotspot ? { ...this.activeCerebrumHotspot } : null;
  }

  isInsideCerebrumLibrary() {
    const root = this.getCerebrumLibraryRoot();
    return Boolean(root && isPointInsideCerebrumLibrary(root, this.camera.position, 'world'));
  }

  isCerebrumLibraryInspectionActive() {
    return this.cerebrumLibraryInspectionActive;
  }

  setCerebrumQuietMode(enabled: boolean) {
    const root = this.ensureCerebrumLibraryMounted('interaction');
    if (!root) return false;
    setCerebrumLibraryQuietMode(root, enabled);
    this.academicAudio.setQuietMode(enabled);
    return getCerebrumLibraryState(root)?.quietMode === enabled;
  }

  performCerebrumLibraryInteraction(hotspotId: string): CerebrumLibraryInteractionResult {
    const root = this.ensureCerebrumLibraryMounted('interaction');
    if (!root) {
      return {
        handled: false,
        message: 'Cerebrum Externum is not currently mounted in the Academic District.',
        state: {
          quality: this.graphicsQuality,
          navigationLevel: 'ground',
          quietMode: false,
          muted: true,
          orbitCamera: false,
          cutawayVisible: false,
          doors: {},
          drawers: {},
          lamps: {},
          ladderStop: 0,
          inspectedBookId: null,
          catalogueRevealed: false,
          rareBookDoorUnlocked: false,
          rareBookLocation: null,
        },
      };
    }
    const result = performCerebrumLibraryInteraction(root, hotspotId);
    if (result.navigationChanged) this.walkController.refreshNavigation();
    if (result.action === 'toggle-quiet-mode') this.academicAudio.setQuietMode(result.state.quietMode);
    if (result.action === 'toggle-mute') void this.setAcademicAudioMuted(result.state.muted);
    return result;
  }

  private getAcademicFountainRoot() {
    return this.objectGroups
      .get('academic-libraries-theoretical-labs')
      ?.getObjectByName(ACADEMIC_FOUNTAIN_ROOT_NAME) ?? null;
  }

  private applyAcademicFountainSceneEnvironment(sceneMode: AcademicFountainSceneMode) {
    this.applyingAcademicFountainEnvironment = true;
    try {
      if (sceneMode === 'night') {
        this.setWeather('academic-rainy-dusk');
        this.setTimeOfDay('night');
      } else {
        this.setWeather('academic-overcast');
        this.setTimeOfDay('noon');
      }
      this.academicFountainEnvironmentOwned = true;
    } finally {
      this.applyingAcademicFountainEnvironment = false;
    }
  }

  private serializeAcademicFountainState(): SavedAcademicFountainStateV2 | null {
    const fountain = this.getAcademicFountainRoot();
    const state = fountain ? getAcademicFountainState(fountain) : null;
    if (!state) return null;

    const restorationMode = ACADEMIC_FOUNTAIN_RESTORATION_MODES.some(
      (mode) => mode.id === state.restorationMode,
    )
      ? state.restorationMode as AcademicFountainRestorationMode
      : ACADEMIC_FOUNTAIN_RESTORATION_MODES[0].id;

    return {
      version: 2,
      environmentOwned: this.academicFountainEnvironmentOwned,
      sceneMode: state.sceneMode,
      waterOn: state.waterOn,
      waterFlow: THREE.MathUtils.clamp(state.waterFlow, 0, 1),
      requestedWaterFlow: THREE.MathUtils.clamp(state.requestedWaterFlow, 0, 1),
      sheetFlow: THREE.MathUtils.clamp(state.sheetFlow, 0, 1),
      residualDrip: THREE.MathUtils.clamp(state.residualDrip, 0, 1),
      infinityLightOn: state.infinityLightOn,
      engravingsHighlighted: state.engravingsHighlighted,
      cutawayVisible: state.cutawayVisible,
      geometryGridVisible: state.geometryGridVisible,
      ringRotating: state.ringRotating,
      ringAngle: state.ringAngle,
      statueMaterial: state.statueMaterial,
      restorationMode,
      cameraPreset: state.cameraPreset,
      quality: state.quality,
    };
  }

  private serializeCerebrumLibraryState(): CerebrumLibraryState | null {
    const state = this.getCerebrumLibraryState();
    if (!state) return null;
    return {
      ...state,
      muted: true,
      doors: { ...state.doors },
      drawers: { ...state.drawers },
      lamps: { ...state.lamps },
    };
  }

  private restoreCerebrumLibraryRuntime(savedValue: unknown) {
    if (!savedValue || typeof savedValue !== 'object') return false;
    const root = this.getCerebrumLibraryRoot();
    const initial = root ? getCerebrumLibraryState(root) : this.cachedCerebrumLibraryState;
    const saved = savedValue as Partial<CerebrumLibraryState>;
    const quality: GraphicsQuality = saved.quality === 'low' || saved.quality === 'medium' || saved.quality === 'high'
      ? saved.quality
      : this.graphicsQuality;
    if (!initial) {
      this.cachedCerebrumLibraryState = {
        quality,
        navigationLevel: saved.navigationLevel === 'upper-gallery' || saved.navigationLevel === 'occultum'
          ? saved.navigationLevel
          : 'ground',
        quietMode: saved.quietMode === true,
        muted: true,
        orbitCamera: false,
        cutawayVisible: false,
        doors: { ...(saved.doors ?? {}) },
        drawers: { ...(saved.drawers ?? {}) },
        lamps: { ...(saved.lamps ?? {}) },
        ladderStop: THREE.MathUtils.clamp(Math.round(saved.ladderStop ?? 0), 0, 2),
        inspectedBookId: typeof saved.inspectedBookId === 'string' ? saved.inspectedBookId : null,
        catalogueRevealed: saved.catalogueRevealed === true,
        rareBookDoorUnlocked: saved.rareBookDoorUnlocked === true || saved.catalogueRevealed === true,
        rareBookLocation: typeof saved.rareBookLocation === 'string' ? saved.rareBookLocation : null,
      };
      this.academicAudio.setQuietMode(this.cachedCerebrumLibraryState.quietMode);
      void this.academicAudio.setMuted(true);
      return true;
    }
    const restored: CerebrumLibraryState = {
      ...initial,
      ...saved,
      quality,
      muted: true,
      orbitCamera: false,
      cutawayVisible: false,
      doors: { ...initial.doors, ...(saved.doors ?? {}) },
      drawers: { ...initial.drawers, ...(saved.drawers ?? {}) },
      lamps: { ...initial.lamps, ...(saved.lamps ?? {}) },
    };
    this.cachedCerebrumLibraryState = this.cloneCerebrumState(restored);
    if (root) {
      restoreCerebrumLibraryState(root, restored);
      configureCerebrumLibraryQuality(root, quality);
    }
    this.academicAudio.setQuietMode(restored.quietMode);
    void this.academicAudio.setMuted(true);
    if (root) setCerebrumLibraryMuted(root, true);
    this.walkController.refreshNavigation();
    return true;
  }

  private serializeCameraState() {
    return {
      position: this.camera.position.toArray(),
      target: this.controls.target.toArray(),
      up: this.camera.up.toArray(),
      fieldOfView: this.camera.fov,
      near: this.camera.near,
    };
  }

  private restoreAcademicFountainState(savedValue: unknown) {
    if (!savedValue || typeof savedValue !== 'object') return false;
    const saved = savedValue as Partial<SavedAcademicFountainStateV2>;
    if (saved.version !== 2) return false;

    const fountain = this.getAcademicFountainRoot();
    const initialState = fountain ? getAcademicFountainState(fountain) : null;
    if (!fountain || !initialState) return false;

    const sceneMode = ACADEMIC_FOUNTAIN_SCENE_MODES.some((mode) => mode.id === saved.sceneMode)
      ? saved.sceneMode as AcademicFountainSceneMode
      : initialState.sceneMode;
    const statueMaterial = ACADEMIC_FOUNTAIN_STATUE_MATERIALS.some((mode) => mode.id === saved.statueMaterial)
      ? saved.statueMaterial as AcademicFountainStatueMaterialMode
      : initialState.statueMaterial;
    const restorationMode = ACADEMIC_FOUNTAIN_RESTORATION_MODES.some((mode) => mode.id === saved.restorationMode)
      ? saved.restorationMode as AcademicFountainRestorationMode
      : initialState.restorationMode === 'off'
        ? ACADEMIC_FOUNTAIN_RESTORATION_MODES[0].id
        : initialState.restorationMode;
    const cameraPreset = ACADEMIC_FOUNTAIN_CAMERA_PRESETS.some((preset) => preset.id === saved.cameraPreset)
      ? saved.cameraPreset as AcademicFountainCameraPresetId
      : initialState.cameraPreset;
    const requestedWaterFlow = typeof saved.requestedWaterFlow === 'number'
      && Number.isFinite(saved.requestedWaterFlow)
      ? THREE.MathUtils.clamp(saved.requestedWaterFlow, 0, 1)
      : initialState.requestedWaterFlow;
    const waterOn = typeof saved.waterOn === 'boolean' ? saved.waterOn : initialState.waterOn;
    const savedFlow = (value: unknown, fallback: number) => (
      typeof value === 'number' && Number.isFinite(value)
        ? THREE.MathUtils.clamp(value, 0, 1)
        : fallback
    );
    // Version-2 saves created before these visual fields existed restore to a
    // stable settled state instead of replaying the default 72% startup flow.
    const waterFlow = savedFlow(saved.waterFlow, waterOn ? requestedWaterFlow : 0);
    const sheetFlow = savedFlow(saved.sheetFlow, waterFlow);
    const residualDrip = savedFlow(saved.residualDrip, 0);
    const ringRotating = typeof saved.ringRotating === 'boolean'
      ? saved.ringRotating
      : initialState.ringRotating;
    const ringAngle = typeof saved.ringAngle === 'number' && Number.isFinite(saved.ringAngle)
      ? saved.ringAngle
      : 0;
    const quality: GraphicsQuality = saved.quality === 'low'
      || saved.quality === 'medium'
      || saved.quality === 'high'
      ? saved.quality
      : this.graphicsQuality;

    for (let attempts = 0; attempts < ACADEMIC_FOUNTAIN_SCENE_MODES.length; attempts += 1) {
      const state = getAcademicFountainState(fountain);
      if (!state || state.sceneMode === sceneMode) break;
      cycleAcademicFountainSceneMode(fountain);
    }
    for (let attempts = 0; attempts < ACADEMIC_FOUNTAIN_STATUE_MATERIALS.length; attempts += 1) {
      const state = getAcademicFountainState(fountain);
      if (!state || state.statueMaterial === statueMaterial) break;
      cycleAcademicFountainStatueMaterial(fountain);
    }
    for (let attempts = 0; attempts < ACADEMIC_FOUNTAIN_RESTORATION_MODES.length; attempts += 1) {
      const state = getAcademicFountainState(fountain);
      if (!state || state.restorationMode === restorationMode) break;
      cycleAcademicFountainRestoration(fountain);
    }
    resetAcademicFountainCameraPreset(fountain);
    for (let attempts = 0; attempts < ACADEMIC_FOUNTAIN_CAMERA_PRESETS.length; attempts += 1) {
      const state = getAcademicFountainState(fountain);
      if (!state || state.cameraPreset === cameraPreset) break;
      cycleAcademicFountainCameraPreset(fountain);
    }

    let state = getAcademicFountainState(fountain)!;
    if (typeof saved.infinityLightOn === 'boolean' && state.infinityLightOn !== saved.infinityLightOn) {
      toggleAcademicFountainInfinityLight(fountain);
    }
    state = getAcademicFountainState(fountain)!;
    if (typeof saved.engravingsHighlighted === 'boolean'
      && state.engravingsHighlighted !== saved.engravingsHighlighted) {
      toggleAcademicFountainEngravings(fountain);
    }
    state = getAcademicFountainState(fountain)!;
    if (typeof saved.cutawayVisible === 'boolean' && state.cutawayVisible !== saved.cutawayVisible) {
      toggleAcademicFountainCutaway(fountain);
    }
    state = getAcademicFountainState(fountain)!;
    if (typeof saved.geometryGridVisible === 'boolean'
      && state.geometryGridVisible !== saved.geometryGridVisible) {
      toggleAcademicFountainGeometryGrid(fountain);
    }
    this.setGraphicsQuality(quality);
    restoreAcademicFountainRuntimeSnapshot(fountain, {
      waterOn,
      waterFlow,
      requestedWaterFlow,
      sheetFlow,
      residualDrip,
      ringRotating,
      ringAngle,
    });

    const restoredState = getAcademicFountainState(fountain)!;
    if (saved.environmentOwned === true) {
      this.applyAcademicFountainSceneEnvironment(restoredState.sceneMode);
    } else {
      this.academicFountainEnvironmentOwned = false;
    }
    return true;
  }

  getActiveAcademicFountainHotspot() {
    return this.activeAcademicFountainHotspot && this.isAcademicFountainNearby();
  }

  isAcademicFountainNearby() {
    const fountain = this.getAcademicFountainRoot();
    if (!fountain) return false;
    const center = fountain.getWorldPosition(new THREE.Vector3());
    const interactionRange = WALK_INSPECT_DISTANCE + 0.5;
    return Math.hypot(this.camera.position.x - center.x, this.camera.position.z - center.z) <= interactionRange;
  }

  private setAcademicFountainInspectionControls(active: boolean, presetId?: AcademicFountainCameraPresetId) {
    this.academicFountainInspectionActive = active;
    if (active) {
      this.controls.minDistance = ACADEMIC_FOUNTAIN_CONFIG.orbit.minimumDistanceMetres * 0.1;
      this.controls.maxDistance = ACADEMIC_FOUNTAIN_CONFIG.orbit.maximumDistanceMetres * 0.1;
      const topDown = presetId === 'top-down';
      // The authored plan view uses Z-up while looking almost exactly down the
      // world's Y axis. Normal courtyard polar limits would push it into an
      // unwanted oblique view on the next OrbitControls update.
      this.controls.minPolarAngle = topDown ? 0 : ACADEMIC_FOUNTAIN_CONFIG.orbit.minimumPolarAngle;
      this.controls.maxPolarAngle = topDown ? Math.PI : ACADEMIC_FOUNTAIN_CONFIG.orbit.maximumPolarAngle;
      this.controls.enableRotate = !topDown;
      return;
    }
    if (this.activeInteriorBuildingId) return;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 980 * MASTERPLAN_RESCALE;
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI * 0.485;
    this.controls.enableRotate = this.mode !== 'plan' && this.mode !== 'walk';
  }

  isAcademicFountainInspectionActive() {
    return this.academicFountainInspectionActive;
  }

  focusAcademicFountain(presetId?: AcademicFountainCameraPresetId) {
    const fountain = this.getAcademicFountainRoot();
    if (!fountain || this.mode === 'walk') return false;
    const pose = getAcademicFountainCameraPose(fountain, presetId);
    this.setAcademicFountainInspectionControls(true, pose.id);
    this.camera.up.copy(pose.up);
    this.camera.fov = pose.fieldOfView;
    this.camera.near = 0.02;
    this.camera.updateProjectionMatrix();
    this.animateCamera(pose.position, pose.target, 820);
    return true;
  }

  private setCerebrumLibraryInspectionControls(active: boolean) {
    const root = this.getCerebrumLibraryRoot();
    this.cerebrumLibraryInspectionActive = active && Boolean(root);
    if (root) {
      setCerebrumLibraryCutaway(root, this.cerebrumLibraryInspectionActive);
      setCerebrumLibraryOrbitMode(root, this.cerebrumLibraryInspectionActive);
    }
    if (this.cerebrumLibraryInspectionActive && root) {
      const preset = getCerebrumLibraryOrbitPreset(root);
      this.controls.minDistance = preset.minDistance;
      this.controls.maxDistance = preset.maxDistance;
      this.controls.minPolarAngle = 0.06;
      this.controls.maxPolarAngle = Math.PI * 0.49;
      this.controls.enableRotate = true;
      return;
    }
    if (this.activeInteriorBuildingId || this.academicFountainInspectionActive) return;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 980 * MASTERPLAN_RESCALE;
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI * 0.485;
    this.controls.enableRotate = this.mode !== 'plan' && this.mode !== 'walk';
    this.updateWorldStreaming(this.cerebrumLibraryPresence, true);
  }

  focusCerebrumLibrary() {
    const root = this.ensureCerebrumLibraryMounted('orbit');
    if (!root || this.mode === 'walk') return false;
    const preset = getCerebrumLibraryOrbitPreset(root);
    this.setAcademicFountainInspectionControls(false);
    this.setCerebrumLibraryInspectionControls(true);
    this.cerebrumStreaming.lastActiveAt = this.elapsed;
    this.updateWorldStreaming(true, true);
    this.camera.up.set(0, 1, 0);
    this.camera.fov = preset.fov;
    this.camera.near = 0.015;
    this.camera.updateProjectionMatrix();
    this.animateCamera(
      new THREE.Vector3().fromArray(preset.position),
      new THREE.Vector3().fromArray(preset.target),
      820,
    );
    return true;
  }

  enterCerebrumLibraryWalk() {
    const root = this.ensureCerebrumLibraryMounted('walk');
    if (!root) return false;
    if (this.mode !== 'walk') this.setMode('walk');
    this.setCerebrumLibraryInspectionControls(false);
    root.updateWorldMatrix(true, false);
    const snapshot = getCerebrumLibrarySnapshot(root);
    const depth = snapshot.dimensionsMetres.depth * 0.1;
    const spawn = root.localToWorld(new THREE.Vector3(0, 0.035, depth * 0.5 - 0.72));
    const direction = new THREE.Vector3(0, -0.035, -1).transformDirection(root.matrixWorld).normalize();
    this.walkController.refreshNavigation();
    this.walkController.enter(spawn, direction, spawn);
    this.cerebrumLibraryPresence = true;
    this.cerebrumStreaming.phase = 'active';
    this.cerebrumStreaming.lastActiveAt = this.elapsed;
    this.updateWorldStreaming(true, true);
    this.callbacks.onCerebrumPresenceChange?.(true);
    return true;
  }

  isAcademicMainGateNearby() {
    const district = this.objectGroups.get('academic-libraries-theoretical-labs');
    const gate = district?.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_ZONE__MAIN_ENTRANCE');
    if (!gate) return false;
    const interactionRange = WALK_INSPECT_DISTANCE * 1.35;
    const collider = gate.getObjectByName('ACADEMIC__MAIN_GATE_CLOSED_COLLIDER');
    if (collider) {
      collider.updateWorldMatrix(true, false);
      const bounds = new THREE.Box3().setFromObject(collider, true);
      const dx = this.camera.position.x < bounds.min.x
        ? bounds.min.x - this.camera.position.x
        : this.camera.position.x > bounds.max.x
          ? this.camera.position.x - bounds.max.x
          : 0;
      const dz = this.camera.position.z < bounds.min.z
        ? bounds.min.z - this.camera.position.z
        : this.camera.position.z > bounds.max.z
          ? this.camera.position.z - bounds.max.z
          : 0;
      return Math.hypot(dx, dz) <= interactionRange;
    }
    const gatePosition = gate.getWorldPosition(new THREE.Vector3());
    return Math.hypot(this.camera.position.x - gatePosition.x, this.camera.position.z - gatePosition.z)
      <= interactionRange;
  }

  private applyAcademicGateOpen(open: boolean, refreshNavigation = true) {
    const district = this.objectGroups.get('academic-libraries-theoretical-labs');
    if (!district) return false;
    if (!open && district.userData.collisionEnabled !== false && this.walkController?.getSnapshot().active) {
      const collider = district.getObjectByName('ACADEMIC__MAIN_GATE_CLOSED_COLLIDER');
      if (collider) {
        collider.updateWorldMatrix(true, false);
        const occupiedGateBounds = new THREE.Box3().setFromObject(collider, true).expandByScalar(WALK_RADIUS);
        if (occupiedGateBounds.containsPoint(this.camera.position)) {
          district.userData.academicGateClosePending = true;
          return false;
        }
      }
    }
    district.userData.academicGateOpen = open;
    district.traverse((object) => {
      if (object.userData.academicGateLeaf === true) {
        object.rotation.y = Number(object.userData[open ? 'openYaw' : 'closedYaw']);
      }
      if (object.userData.academicGateCollider === true) {
        object.userData.navObstacle = district.userData.collisionEnabled !== false && !open;
      }
    });
    district.userData.academicGateClosePending = false;
    if (refreshNavigation) this.walkController?.refreshNavigation();
    return true;
  }

  private retryPendingAcademicGateClose() {
    if (this.activeTimeOfDay !== 'night') return;
    const district = this.objectGroups.get('academic-libraries-theoretical-labs');
    if (!district?.userData.academicGateClosePending) return;
    this.applyAcademicGateOpen(false);
  }

  private syncAcademicGateForTime(forceDefault = false) {
    const district = this.objectGroups.get('academic-libraries-theoretical-labs');
    if (!district) return;
    const lightPhase = this.activeTimeOfDay === 'night' ? 'night' : 'day';
    const previousPhase = district.userData.academicGateLightPhase as 'day' | 'night' | undefined;
    if (forceDefault || lightPhase === 'day' || previousPhase !== lightPhase) {
      this.applyAcademicGateOpen(lightPhase === 'day', false);
    }
    district.userData.academicGateLightPhase = lightPhase;
    this.syncAcademicNightLighting();
    this.walkController?.refreshNavigation();
  }

  private syncAcademicNightLighting() {
    const district = this.objectGroups.get('academic-libraries-theoretical-labs');
    if (!district) return;
    const enabled = this.activeTimeOfDay === 'night' && district.userData.academicReadingLightsOn !== false;
    const materials = new Set<THREE.MeshStandardMaterial>();
    district.traverse((object) => {
      if (object.userData.academicNightOrangeLight !== true) return;
      if (object instanceof THREE.Light) {
        object.visible = enabled;
        object.intensity = enabled ? Number(object.userData.academicNightLightIntensity ?? 0.8) : 0;
        return;
      }
      if (!(object instanceof THREE.Mesh)) return;
      const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
      meshMaterials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial) materials.add(material);
      });
    });
    materials.forEach((material) => {
      const target = Number(material.userData.academicNightEmissiveIntensity ?? 2.2);
      material.emissiveIntensity = enabled ? target : 0.035;
      material.needsUpdate = true;
    });
    district.userData.ashcroftNightLightsOn = enabled;
    district.userData.cerebrumNightLightsOn = enabled;
  }

  private performWellOfInfiniteKnowledgeInteraction(action: string) {
    const fountain = this.getAcademicFountainRoot();
    if (!fountain || (!this.isAcademicFountainNearby() && !this.academicFountainInspectionActive)) {
      return {
        title: 'Fountain Out of Reach',
        message: `Stand beside ${ACADEMIC_FOUNTAIN_TITLE} to use its architectural control panel.`,
        state: { available: false },
      };
    }
    const metadata = fountain.userData.academicFountain as {
      name: string;
      dedication: string;
      history: string;
    };
    const current = getAcademicFountainState(fountain)!;

    if (action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.readPlaque) {
      return { title: metadata.name, message: `${metadata.dedication} ${metadata.history}`, state: { ...current } };
    }
    if (action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.toggleWater) {
      const state = setAcademicFountainWater(fountain, !current.waterOn)!;
      return {
        title: state.waterOn ? 'Measured Water System Starting' : 'Measured Water System Stopping',
        message: state.waterOn
          ? 'Thin sheets and radial channels strengthen gradually toward the selected flow.'
          : 'Sheets weaken before the channels settle; residual drops and dark wet stone remain.',
        state: { ...state },
      };
    }
    if (action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.increaseWaterFlow
      || action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.decreaseWaterFlow) {
      const amount = action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.increaseWaterFlow ? 0.1 : -0.1;
      const state = adjustAcademicFountainWaterFlow(fountain, amount)!;
      return {
        title: `Water Flow ${Math.round(state.requestedWaterFlow * 100)}%`,
        message: 'The hydraulic system adjusts channel and sheet flow progressively rather than changing abruptly.',
        state: { ...state },
      };
    }
    if (action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.toggleInfinityLight) {
      const state = toggleAcademicFountainInfinityLight(fountain)!;
      return {
        title: state.infinityLightOn ? 'Infinity Inlay Lit' : 'Infinity Inlay Dark',
        message: state.infinityLightOn
          ? 'A restrained amber architectural line reveals the faceted loop.'
          : 'The structural blackened-bronze loop remains legible without its internal inlay.',
        state: { ...state },
      };
    }
    if (action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.highlightEngravings) {
      const state = toggleAcademicFountainEngravings(fountain)!;
      return {
        title: state.engravingsHighlighted ? 'Scientific Engravings Highlighted' : 'Engraving Highlight Removed',
        message: 'Coordinate axes, solstice markers, network pins, and measured orbital ticks remain integrated into the architecture.',
        state: { ...state },
      };
    }
    if (action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.describeNextSymbol) {
      const symbol = inspectNextAcademicFountainSymbol(fountain)!;
      return { title: symbol.name, message: `${symbol.description} Placement: ${symbol.placement}.`, state: { ...current, symbol: symbol.name } };
    }
    if (action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.toggleCutaway) {
      const state = toggleAcademicFountainCutaway(fountain)!;
      return {
        title: state.cutawayVisible ? 'Hydraulic Cutaway Shown' : 'Hydraulic Cutaway Hidden',
        message: state.cutawayVisible
          ? 'The reservoir, pressure riser, return pipes, channels, and hidden drainage are exposed as a technical diagram.'
          : 'The subsurface system is concealed again.',
        state: { ...state },
      };
    }
    if (action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.toggleGeometryGrid) {
      const state = toggleAcademicFountainGeometryGrid(fountain)!;
      return {
        title: state.geometryGridVisible ? 'Construction Grid Shown' : 'Construction Grid Hidden',
        message: 'The composition resolves into coordinate axes, measured circles, offsets, and architectural alignments.',
        state: { ...state },
      };
    }
    if (action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.toggleRingRotation) {
      const state = toggleAcademicFountainRingRotation(fountain)!;
      return {
        title: state.ringRotating ? 'Orbital Ring Inspection Running' : 'Orbital Ring Inspection Paused',
        message: 'The structurally supported ring rotates only for slow design inspection.',
        state: { ...state },
      };
    }
    if (action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.cycleStatueMaterial) {
      const state = cycleAcademicFountainStatueMaterial(fountain)!;
      const mode = ACADEMIC_FOUNTAIN_STATUE_MATERIALS.find((entry) => entry.id === state.statueMaterial)!;
      return { title: mode.label, message: mode.description, state: { ...state } };
    }
    if (action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.cycleRestorationView) {
      const state = cycleAcademicFountainRestoration(fountain)!;
      const mode = ACADEMIC_FOUNTAIN_RESTORATION_MODES.find((entry) => entry.id === state.restorationMode)
        ?? ACADEMIC_FOUNTAIN_RESTORATION_MODES[0];
      return { title: mode.label, message: mode.description, state: { ...state } };
    }
    if (action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.cycleSceneMode) {
      const state = cycleAcademicFountainSceneMode(fountain)!;
      const sceneMode = ACADEMIC_FOUNTAIN_SCENE_MODES.find((entry) => entry.id === state.sceneMode)!;
      this.applyAcademicFountainSceneEnvironment(state.sceneMode);
      return { title: sceneMode.label, message: sceneMode.description, state: { ...state } };
    }
    if (action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.cycleCameraPreset) {
      const state = cycleAcademicFountainCameraPreset(fountain)!;
      const preset = ACADEMIC_FOUNTAIN_CAMERA_PRESETS.find((entry) => entry.id === state.cameraPreset)!;
      return { title: preset.label, message: preset.description, state: { ...state, cameraRequested: state.cameraPreset } };
    }
    if (action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.resetCamera) {
      const state = resetAcademicFountainCameraPreset(fountain)!;
      return { title: 'Hero Camera Restored', message: 'The camera returns to the complete ceremonial composition.', state: { ...state, cameraRequested: 'hero' } };
    }
    if (action === ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.toggleDebug) {
      const state = toggleAcademicFountainDebug(fountain)!;
      return {
        title: state.debugVisible ? 'Fountain Debug View Shown' : 'Fountain Debug View Hidden',
        message: 'Collision boundaries, water paths, construction geometry, lights, and live scene statistics are exposed for inspection.',
        state: { ...state },
      };
    }
    return {
      title: 'Orbit Inspection Ready',
      message: 'Explore mode frames Seshat, the infinity sculpture, orbital ring, platforms, and basin in the selected camera view.',
      state: { ...current, orbitRequested: true, cameraRequested: current.cameraPreset },
    };
  }

  performAcademicInteraction(action: string) {
    const district = this.objectGroups.get('academic-libraries-theoretical-labs');
    if (!district) return { title: 'Academic District', message: 'The district is unavailable.' };
    const legacyFountainActionMap: Record<string, string> = {
      'throw fountain coin': ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.describeNextSymbol,
      'sit on fountain rim': ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.orbit,
      'toggle fountain lanterns': ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.toggleInfinityLight,
      'inspect fountain symbols': ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.describeNextSymbol,
      'cycle fountain restoration': ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.cycleRestorationView,
      'toggle fountain leaves': ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS.toggleGeometryGrid,
    };
    const normalizedAction = legacyFountainActionMap[action] ?? action;
    const contemporaryFountainActions = new Set<string>(Object.values(ACADEMIC_FOUNTAIN_INTERACTION_ACTIONS));
    if (contemporaryFountainActions.has(normalizedAction)) {
      return this.performWellOfInfiniteKnowledgeInteraction(normalizedAction);
    }
    const fountainActions = new Set([
      'read fountain plaque',
      'toggle fountain water',
      'throw fountain coin',
      'sit on fountain rim',
      'toggle fountain lanterns',
      'inspect fountain symbols',
      'cycle fountain restoration',
      'toggle fountain cutaway',
      'toggle fountain leaves',
      'orbit fountain',
    ]);
    if (fountainActions.has(action)) {
      const fountain = this.getAcademicFountainRoot();
      if (!fountain || !this.isAcademicFountainNearby()) {
        return {
          title: 'Fountain Out of Reach',
          message: `Stand beside ${ACADEMIC_FOUNTAIN_TITLE} to use its architectural control panel.`,
          state: { available: false },
        };
      }
      const metadata = fountain.userData.academicFountain as {
        name: string;
        dedication: string;
        history: string;
        eras: Record<string, string>;
      };
      const current = getAcademicFountainState(fountain)!;
      if (action === 'read fountain plaque') {
        return { title: `${metadata.name} · 1486`, message: `${metadata.dedication}. ${metadata.history}`, state: { ...current } };
      }
      if (action === 'toggle fountain water') {
        const state = setAcademicFountainWater(fountain, !current.waterOn)!;
        return {
          title: state.waterOn ? 'Fountain Flow Restored' : 'Maintenance Valve Closing',
          message: state.waterOn
            ? 'The four raven spouts resume their quiet fall into the dark basin.'
            : 'The streams weaken gradually; residual drops and wet mineral channels remain.',
          state: { ...state },
        };
      }
      if (action === 'throw fountain coin') {
        const state = throwAcademicFountainCoin(fountain)!;
        return { title: 'Coin Cast', message: 'A small localized splash opens into a fading ring beneath the scholar.', state: { ...state } };
      }
      if (action === 'sit on fountain rim') {
        const seat = getAcademicFountainSeatPoint(fountain, this.camera.position);
        if (seat) {
          this.walkController.seatTarget.copy(seat).add(new THREE.Vector3(0, 0.12, 0));
          this.walkController.isSitting = true;
        }
        return { title: 'Seated at the Basin', message: 'The polished rim is cold and damp. Move with WASD or the arrow keys to stand.', state: { seated: Boolean(seat) } };
      }
      if (action === 'toggle fountain lanterns') {
        const state = toggleAcademicFountainLanterns(fountain)!;
        return { title: state.lanternsOn ? 'Court Lanterns Lit' : 'Court Lanterns Extinguished', message: state.lanternsOn ? 'Restrained amber light returns to the wet stones.' : 'The court settles back into blue-grey shadow.', state: { ...state } };
      }
      if (action === 'inspect fountain symbols') {
        const symbol = inspectNextAcademicFountainSymbol(fountain)!;
        return { title: symbol.name, message: symbol.description, state: { symbol: symbol.name } };
      }
      if (action === 'cycle fountain restoration') {
        const state = cycleAcademicFountainRestoration(fountain)!;
        return {
          title: state.restorationMode === 'off' ? 'Restoration Overlay Off' : `${state.restorationMode[0].toUpperCase()}${state.restorationMode.slice(1)} Fabric Highlighted`,
          message: state.restorationMode === 'off' ? 'The fountain returns to its normal weathered appearance.' : metadata.eras[state.restorationMode],
          state: { ...state },
        };
      }
      if (action === 'toggle fountain cutaway') {
        const state = toggleAcademicFountainCutaway(fountain)!;
        return { title: state.cutawayVisible ? 'Hydraulic Cutaway Shown' : 'Hydraulic Cutaway Hidden', message: state.cutawayVisible ? 'The basin, central riser, overflow pipe, drain, and underground cistern are visible as a conservation diagram.' : 'The subsurface conservation diagram is closed.', state: { ...state } };
      }
      if (action === 'toggle fountain leaves') {
        const state = toggleAcademicFountainLeaves(fountain)!;
        return { title: state.floatingLeavesVisible ? 'Autumn Leaves Added' : 'Basin Leaves Cleared', message: state.floatingLeavesVisible ? 'Wet copper and olive leaves drift back across the dark water.' : 'The floating leaves have been removed from the basin.', state: { ...state } };
      }
      return { title: 'Orbit Inspection Ready', message: 'Explore mode now frames the fountain for close orbit inspection.', state: { orbitRequested: true } };
    }
    if (action === 'open main gate') {
      if (this.activeTimeOfDay !== 'night') {
        this.applyAcademicGateOpen(true);
        return {
          title: 'Main Gate Open for Daylight',
          message: 'The porter keeps the Blackwood gate open from sunrise through the evening.',
          state: { gateOpen: true },
        };
      }
      const open = district.userData.academicGateOpen !== true;
      const changed = this.applyAcademicGateOpen(open);
      if (!changed && !open) {
        return {
          title: 'Main Gate Held Open',
          message: 'The porter waits for the threshold to clear before closing the gate.',
          state: { gateOpen: true },
        };
      }
      return {
        title: open ? 'Main Gate Opened' : 'Main Gate Closed',
        message: open ? 'The wrought-iron leaves swing inward toward the porter\'s lodge.' : 'The gate leaves meet beneath the Blackwood crest.',
        state: { gateOpen: open },
      };
    }
    if (action === 'toggle reading-room lights') {
      const on = district.userData.academicReadingLightsOn !== false;
      district.userData.academicReadingLightsOn = !on;
      const materials = new Set<THREE.MeshStandardMaterial>();
      district.traverse((object) => {
        if (!(object instanceof THREE.Mesh) || object.userData.academicReadingLights !== true) return;
        const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
        meshMaterials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial) materials.add(material);
        });
      });
      materials.forEach((material) => {
        material.userData.academicOriginalEmissive ??= material.emissiveIntensity || 1.1;
        material.emissiveIntensity = on ? 0.02 : Number(material.userData.academicOriginalEmissive);
        material.needsUpdate = true;
      });
      this.syncAcademicNightLighting();
      return {
        title: on ? 'Reading Rooms Dimmed' : 'Reading Rooms Lit',
        message: on ? 'Cerebrum Externum and Wren settle into deep shadow.' : 'Selected leaded windows regain their restrained amber glow.',
        state: { readingLightsOn: !on },
      };
    }
    if (action === 'ring chapel bell') {
      const audible = this.academicAudio.ringBell();
      district.userData.chapelBellRings = Number(district.userData.chapelBellRings ?? 0) + 1;
      return {
        title: 'St Anselm Bell',
        message: audible ? 'A low three-tone bell rolls over the wet quadrangles.' : 'The bell moves silently while campus audio is muted.',
        state: { rings: district.userData.chapelBellRings, audible },
      };
    }
    const hotspot = this.getActiveAcademicHotspot();
    if (action === 'inspect entrance' && hotspot) {
      return {
        title: `${hotspot.name} · ${hotspot.founded}`,
        message: hotspot.history,
        building: hotspot,
      };
    }
    return {
      title: 'Blackwood Academic District',
      message: 'A road-bounded university district of quadrangles, libraries, old science courts, residences, gardens, and canal service edges.',
      building: hotspot,
    };
  }

  setAcademicFountainWaterFlow(requestedFlow: number) {
    const fountain = this.getAcademicFountainRoot();
    if (!fountain || (!this.isAcademicFountainNearby() && !this.academicFountainInspectionActive)) {
      return {
        title: 'Fountain Out of Reach',
        message: `Stand beside ${ACADEMIC_FOUNTAIN_TITLE} to calibrate its hydraulic system.`,
        state: { available: false },
      };
    }
    const target = THREE.MathUtils.clamp(requestedFlow, 0, 1);
    let state = getAcademicFountainState(fountain)!;
    if (target > 0 && !state.waterOn) state = setAcademicFountainWater(fountain, true)!;
    state = adjustAcademicFountainWaterFlow(fountain, target - state.requestedWaterFlow)!;
    if (target === 0 && state.waterOn) state = setAcademicFountainWater(fountain, false)!;
    return {
      title: target === 0 ? 'Measured Water System Stopping' : `Water Flow ${Math.round(target * 100)}%`,
      message: target === 0
        ? 'Sheets weaken before the channels settle; residual drops and dark wet stone remain.'
        : 'The hydraulic system moves progressively toward the exact selected channel and sheet flow.',
      state: { ...state },
    };
  }

  async setAcademicAudioMuted(muted: boolean) {
    await this.academicAudio.setMuted(muted);
    const root = this.getCerebrumLibraryRoot();
    if (root) setCerebrumLibraryMuted(root, muted);
    return this.academicAudio.isMuted();
  }

  isAcademicAudioMuted() {
    return this.academicAudio.isMuted();
  }

  setGraphicsQuality(quality: GraphicsQuality) {
    this.graphicsQuality = quality;
    const pixelRatio = quality === 'low' ? 1 : quality === 'medium' ? 1.35 : 1.8;
    const effectivePixelRatio = Math.min(window.devicePixelRatio, pixelRatio);
    this.renderer.setPixelRatio(effectivePixelRatio);
    // Post effects are softly blurred by design, so a sub-native target keeps
    // High quality usable even in this very large procedural scene.
    this.composer.setPixelRatio(quality === 'high' ? Math.min(window.devicePixelRatio, 0.75) : 0.5);
    this.renderer.shadowMap.enabled = quality !== 'low';
    this.sun.castShadow = quality === 'high';
    const precipitationMaterial = this.precipitation.points.material as THREE.PointsMaterial;
    precipitationMaterial.size = quality === 'low' ? 0.035 : 0.05;
    this.saoPass.enabled = quality === 'high';
    this.saoPass.params.saoIntensity = 0.095;
    this.saoPass.params.saoKernelRadius = 14;
    this.bloomPass.enabled = quality === 'high';
    this.bloomPass.strength = 0.075;
    this.bloomPass.radius = 0.24;
    this.bloomPass.threshold = 1.02;
    const academic = this.objectGroups.get('academic-libraries-theoretical-labs');
    if (academic) {
      configureAcademicTreeQuality(academic, quality);
      const fountain = academic.getObjectByName(ACADEMIC_FOUNTAIN_ROOT_NAME);
      if (fountain) configureAcademicFountainQuality(fountain, quality);
      const library = academic.getObjectByName(CEREBRUM_LIBRARY_ROOT_NAME);
      if (library) configureCerebrumLibraryQuality(library, quality);
    }
    this.resize();
  }

  getGraphicsQuality() {
    return this.graphicsQuality;
  }

  getStreamingSnapshot() {
    return {
      ...this.worldStreaming.getSnapshot(),
      cerebrumExternum: {
        ...this.cerebrumStreaming,
        distanceMetres: Number.isFinite(this.cerebrumStreaming.distanceMetres)
          ? Number(this.cerebrumStreaming.distanceMetres.toFixed(1))
          : -1,
        preloadDistanceMetres: this.getCerebrumStreamingConfig()?.preloadDistanceMetres ?? 60,
        unloadDistanceMetres: this.getCerebrumStreamingConfig()?.unloadDistanceMetres ?? 90,
        retentionSeconds: this.getCerebrumStreamingConfig()?.retentionSeconds ?? 15,
        stateCached: this.cachedCerebrumLibraryState !== null,
      },
    };
  }

  /**
   * One-way bootstrap contract for the staged Unreal migration. This is not a
   * production publish path: Unreal Editor becomes authoritative after import,
   * and browser sandbox edits are never merged back into that world.
   */
  createUnrealBootstrapManifest(): UnrealWorldManifest {
    this.modelRoot.updateWorldMatrix(true, true);
    const packages = this.worldStreaming.getSnapshot().packages.map((pkg) => ({
      id: pkg.id,
      kind: pkg.kind,
      exteriorHighLayer: 'ExteriorHigh' as const,
      exteriorHlodLayer: 'ExteriorHLOD' as const,
    }));
    const entities = Array.from(this.definitions.values())
      .filter((definition) => definition.category !== 'editor' && definition.category !== 'imported')
      .flatMap((definition) => {
        const group = this.objectGroups.get(definition.id);
        if (!group) return [];
        group.updateWorldMatrix(true, true);
        const bounds = new THREE.Box3().setFromObject(group, true);
        if (bounds.isEmpty()) bounds.setFromCenterAndSize(group.getWorldPosition(new THREE.Vector3()), new THREE.Vector3());
        const packageId = this.worldStreaming.findPackageId(group);
        const cerebrum = definition.category === 'academic-building'
          && definition.academicRecordId === 'ashcroft-grand-library';
        const dataLayers: UnrealDataLayerName[] = cerebrum
          ? [...UNREAL_DATA_LAYERS]
          : ['ExteriorHigh', 'ExteriorHLOD'];
        const interactionArchetypes = cerebrum
          ? ['door', 'drawer', 'lamp', 'book', 'catalogue', 'rolling-ladder', 'editable-inscription']
          : 'interactions' in definition
            ? [...(definition.interactions ?? [])]
            : [];
        return [{
          id: definition.id,
          name: definition.name,
          label: sceneLabel(definition),
          description: definition.description,
          ...('inscription' in definition && typeof definition.inscription === 'string'
            ? { inscription: definition.inscription }
            : {}),
          entityType: definition.category,
          parentPackageId: packageId,
          source: {
            authority: 'web-sandbox' as const,
            disposition: 'bootstrap-placeholder-only' as const,
          },
          transform: {
            webMatrixColumnMajor: group.matrixWorld.elements.map((value) => Number(value.toFixed(6))),
            unrealMatrixRowMajorCentimetres: webMatrixToUnrealRowMajor(group.matrixWorld),
          },
          bounds: {
            webMin: bounds.min.toArray() as [number, number, number],
            webMax: bounds.max.toArray() as [number, number, number],
            unrealMinCentimetres: webPointToUnrealCentimetres(bounds.min),
            unrealMaxCentimetres: webPointToUnrealCentimetres(bounds.max),
          },
          asset: {
            placeholderGlb: `Assets/Placeholders/${definition.id}.glb`,
            stableActorName: stableUnrealName(definition.id),
          },
          streaming: {
            dataLayers,
            ...(cerebrum ? {
              levelInstance: 'LI_CerebrumExternum',
              preloadDistanceMetres: 60,
              unloadDistanceMetres: 90,
              retentionSeconds: 15,
            } : {}),
          },
          interactionArchetypes,
          persistentStateKey: `entity:${definition.id}`,
        }];
      });
    return {
      schema: UNREAL_WORLD_MANIFEST_SCHEMA,
      generatedAt: new Date().toISOString(),
      productionAuthority: 'unreal-editor',
      sourceAuthority: 'web-sandbox',
      importPolicy: 'bootstrap-only-no-roundtrip',
      coordinateSystem: {
        web: '+X east, +Y up, +Z south; 1 unit = 10 metres',
        unreal: '+X east, +Y south, +Z up; centimetres',
        mapping: 'Unreal X = Web X * 1000; Unreal Y = Web Z * 1000; Unreal Z = Web Y * 1000',
      },
      dataLayers: UNREAL_DATA_LAYERS,
      packages,
      entities,
    };
  }

  downloadUnrealBootstrapManifest(filename = 'world.manifest.json') {
    const manifest = this.createUnrealBootstrapManifest();
    downloadBlob(
      new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' }),
      filename,
    );
  }

  async createUnrealPlaceholderGlb(entityId: string) {
    if (entityId === academicBuildingSelectableId('ashcroft-grand-library')) {
      this.ensureCerebrumLibraryMounted('editing');
    }
    const source = this.objectGroups.get(entityId);
    if (!source) throw new Error(`Cannot export unknown bootstrap entity: ${entityId}`);
    source.updateWorldMatrix(true, true);
    const clone = source.clone(true);
    clone.name = stableUnrealName(entityId);
    // Geometry stays entity-local; the manifest owns authoritative world
    // placement so Unreal never applies the source transform twice.
    clone.position.set(0, 0, 0);
    clone.quaternion.identity();
    clone.scale.set(1, 1, 1);
    clone.updateMatrixWorld(true);
    clone.userData.stableEntityId = entityId;
    clone.userData.sourceAuthority = 'web-sandbox';
    clone.userData.sourceDisposition = 'bootstrap-placeholder-only';
    clone.traverse((object) => {
      if (object.userData.exportAlways || object.userData.exportFallback) object.visible = true;
      if (object.userData.editorCutawayCeiling) object.visible = true;
      if (object.userData.academicTreeLodLevel) {
        object.visible = object.userData.academicTreeLodLevel === 'near';
      }
      if (object.userData.streamingProxy) object.visible = false;
    });
    const exporter = new GLTFExporter();
    const result = await exporter.parseAsync(clone, {
      binary: true,
      onlyVisible: true,
      trs: true,
      maxTextureSize: 2048,
      includeCustomExtensions: true,
    });
    if (!(result instanceof ArrayBuffer)) throw new Error('Bootstrap GLB exporter returned text instead of binary data.');
    return result;
  }

  async downloadUnrealPlaceholderGlb(entityId: string) {
    const result = await this.createUnrealPlaceholderGlb(entityId);
    downloadBlob(
      new Blob([result], { type: 'model/gltf-binary' }),
      `${entityId}.glb`,
    );
  }

  getSceneStatistics() {
    const geometries = new Set<string>();
    let visibleMeshes = 0;
    let triangles = 0;
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !isEffectivelyVisible(object)) return;
      visibleMeshes += 1;
      geometries.add(object.geometry.uuid);
      const position = object.geometry.getAttribute('position');
      const instanceMultiplier = object instanceof THREE.InstancedMesh ? object.count : 1;
      triangles += (object.geometry.index ? object.geometry.index.count / 3 : (position?.count ?? 0) / 3)
        * instanceMultiplier;
    });
    return {
      visibleMeshes,
      geometries: geometries.size,
      triangles: Math.round(triangles),
      drawCalls: this.renderer.info.render.calls,
      textureCount: this.renderer.info.memory.textures,
      quality: this.graphicsQuality,
      streaming: this.getStreamingSnapshot(),
      migration: {
        manifestSchema: UNREAL_WORLD_MANIFEST_SCHEMA,
        productionAuthority: 'unreal-editor',
        browserEdits: 'sandbox-only; no production roundtrip',
        coordinateMapping: 'UE X=Web X*1000, UE Y=Web Z*1000, UE Z=Web Y*1000',
      },
    };
  }

  private rebuildDebugVisualization() {
    this.debugRoot.traverse((object) => {
      if (object === this.debugRoot) return;
      const geometry = (object as THREE.Mesh).geometry;
      if (geometry) geometry.dispose();
      const rawMaterial = (object as THREE.Mesh).material;
      const materials = Array.isArray(rawMaterial) ? rawMaterial : rawMaterial ? [rawMaterial] : [];
      materials.forEach((material) => material.dispose());
    });
    this.debugRoot.clear();
    const academic = this.objectGroups.get('academic-libraries-theoretical-labs');
    if (!academic) return;
    academic.updateMatrixWorld(true);
    let boxCount = 0;
    academic.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || object.userData.navObstacle !== true || boxCount >= 160) return;
      const bounds = new THREE.Box3().setFromObject(object, true);
      if (bounds.isEmpty()) return;
      const helper = new THREE.Box3Helper(bounds, '#76ff7a');
      helper.name = 'DEBUG__COLLISION_BOUNDARY';
      helper.userData.debugHelper = true;
      this.debugRoot.add(helper);
      boxCount += 1;
    });
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Light) || object === this.hemisphere) return;
      const position = object.getWorldPosition(new THREE.Vector3());
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 8, 6),
        new THREE.MeshBasicMaterial({ color: '#60e8ff', wireframe: true, depthTest: false }),
      );
      marker.name = 'DEBUG__LIGHT_POSITION';
      marker.position.copy(position);
      marker.renderOrder = 999;
      this.debugRoot.add(marker);
    });
  }

  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
    if (enabled) this.rebuildDebugVisualization();
    this.debugRoot.visible = enabled;
    return this.debugMode;
  }

  isDebugMode() {
    return this.debugMode;
  }

  setSeason(season: 'spring' | 'summer' | 'autumn' | 'winter') {
    this.activeSeason = season;
    if (this.activeWeather === 'rain' || this.activeWeather === 'storm') {
      this.precipitation.setType(season === 'winter' ? 'snow' : 'rain');
    }
    this.applySeasonColors(season);
  }

  getSeason() {
    return this.activeSeason;
  }

  applySeasonColors(season: 'spring' | 'summer' | 'autumn' | 'winter') {
    const isFoliage = (material: any, name: string) => {
      if (material?.userData?.excludeSeasonFoliage === true) return false;
      const n = name.toUpperCase();
      if (n.includes('FOLIAGE') || n.includes('LEAF_LITTER') || n.includes('FALLEN_LEAF') || n.includes('VEGETATION') || n.includes('PLANT') || n.includes('TREE')) return true;
      if (material && material.name && material.name.toUpperCase().includes('FOLIAGE')) return true;
      if (material && material.color) {
        const c = material.color;
        if (c.g > c.r * 1.08 && c.g > c.b * 1.08 && c.r < 0.6) return true;
      }
      return false;
    };

    const isLandscape = (node: THREE.Object3D) => {
      let p: THREE.Object3D | null = node;
      while (p) {
        if (p === this.landscapeRoot) return true;
        p = p.parent;
      }
      return false;
    };

    const stableSeasonVariant = (node: THREE.Object3D, material: THREE.Material) => {
      if (Number.isInteger(material.userData.seasonVariant)) return Number(material.userData.seasonVariant);
      const path: string[] = [];
      let current: THREE.Object3D | null = node;
      while (current) {
        const parent: THREE.Object3D | null = current.parent;
        if (parent === this.architectureRoot || parent === this.landscapeRoot || parent === this.transitRoot || parent === this.cityRoot) {
          path.push(current.name);
          break;
        }
        path.push(`${current.name}:${parent?.children.indexOf(current) ?? 0}`);
        current = parent;
      }
      const key = `${material.name}|${path.reverse().join('/')}`;
      let hash = 2166136261;
      for (let index = 0; index < key.length; index += 1) {
        hash ^= key.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      const variant = (hash >>> 0) % 3;
      material.userData.seasonVariant = variant;
      return variant;
    };

    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            if (mat.userData.originalColor === undefined) {
              mat.userData.originalColor = mat.color.clone();
            }

            if (isFoliage(mat, child.name)) {
              if (season === 'spring') {
                const idx = stableSeasonVariant(child, mat);
                if (idx === 0) mat.color.set('#ffb7c5');
                else if (idx === 1) mat.color.set('#78e08f');
                else mat.color.set('#b8e994');
              } else if (season === 'summer') {
                mat.color.copy(mat.userData.originalColor);
              } else if (season === 'autumn') {
                const idx = stableSeasonVariant(child, mat);
                if (idx === 0) mat.color.set('#7b3f2c');
                else if (idx === 1) mat.color.set('#9a662b');
                else mat.color.set('#642b2c');
              } else if (season === 'winter') {
                mat.color.set('#f1f2f6');
              }
            }

            if (season === 'winter') {
              if (isLandscape(child) && (child.name.includes('basalt') || child.name.includes('shelf') || child.name.includes('surface') || child.name.includes('plateau') || child.name.includes('rock') || child.name.includes('foundation') || child.name.includes('SHELL'))) {
                mat.color.set('#f5f6fa');
              }
            } else {
              if (isLandscape(child) && (child.name.includes('basalt') || child.name.includes('shelf') || child.name.includes('surface') || child.name.includes('plateau') || child.name.includes('rock') || child.name.includes('foundation') || child.name.includes('SHELL'))) {
                if (mat.userData.originalColor) mat.color.copy(mat.userData.originalColor);
              }
            }
          }
        });
      }
    });
    applyAcademicTreeSeason(this.scene, season);
  }

  getDefinition(id: string) {
    return this.definitions.get(id) ?? null;
  }

  getSelectedDefinition() {
    return this.selectedId ? this.definitions.get(this.selectedId) ?? null : null;
  }

  setObjectMetadata(id: string, metadata: ObjectMetadata) {
    const definition = this.definitions.get(id);
    const group = this.objectGroups.get(id);
    if (!definition || !group) return null;

    const name = metadata.name.trim().slice(0, 120);
    const labelText = metadata.label.trim().slice(0, 120);
    const description = metadata.description.trim().slice(0, 800);
    const inscription = definition.category === 'academic-building' && typeof definition.inscription === 'string'
      ? (metadata.inscription ?? definition.inscription).trim().slice(0, 96)
      : undefined;
    if (!name || !labelText) return null;

    const replacement = {
      ...definition,
      name,
      label: labelText,
      description,
      ...(inscription !== undefined ? { inscription } : {}),
    } as SceneDefinition;
    this.definitions.set(id, replacement);

    // Preserve the stable technical name and selectable ID while making the
    // edited display metadata available to JSON and GLB exports.
    group.userData.displayName = name;
    group.userData.displayLabel = labelText;
    group.userData.description = description;
    if (inscription !== undefined) updateAcademicBuildingInscription(group, inscription);

    const label = this.labels.get(id);
    if (label) {
      label.definition = replacement;
      label.anchor.element.textContent = labelText;
    }
    this.callbacks.onMetadataChange?.(replacement);
    return replacement;
  }

  getObjectState(id: string): ObjectState | null {
    const group = this.objectGroups.get(id);
    const definition = this.definitions.get(id);
    if (!group || !definition) return null;
    const styleCustomized = definition.category === 'editor'
      || definition.category === 'imported'
      || group.userData.styleCustomized === true;
    return {
      position: { x: group.position.x, y: group.position.y, z: group.position.z },
      rotationY: THREE.MathUtils.radToDeg(group.rotation.y),
      scale: (group.scale.x + group.scale.y + group.scale.z) / 3,
      visible: group.visible,
      accent: definition.accent,
      ...(styleCustomized ? {
        primaryColor: group.userData.primaryColor ?? (definition as any).primaryColor ?? '#ffffff',
        secondaryColor: group.userData.secondaryColor ?? (definition as any).secondaryColor ?? '#74858a',
        patternType: group.userData.patternType ?? (definition as any).patternType ?? 'solid',
        patternScale: group.userData.patternScale ?? (definition as any).patternScale ?? 1.0,
      } : {}),
      styleCustomized,
      collisionEnabled: group.userData.collisionEnabled !== false && (definition as any).collisionEnabled !== false,
      interactions: group.userData.interactions ?? (definition as any).interactions ?? [],
    };
  }

  setObjectPosition(id: string, axis: 'x' | 'y' | 'z', value: number) {
    const group = this.objectGroups.get(id);
    if (!group || !Number.isFinite(value)) return;
    group.position[axis] = value;
    this.walkController.refreshNavigation();
    this.notifyTransform(id);
  }

  setObjectRotationY(id: string, degrees: number) {
    const group = this.objectGroups.get(id);
    if (!group || !Number.isFinite(degrees)) return;
    group.rotation.y = THREE.MathUtils.degToRad(degrees);
    this.walkController.refreshNavigation();
    this.notifyTransform(id);
  }

  setObjectScale(id: string, scale: number) {
    const group = this.objectGroups.get(id);
    if (!group || !Number.isFinite(scale)) return;
    group.scale.setScalar(scale);
    this.walkController.refreshNavigation();
    this.notifyTransform(id);
  }

  setObjectVisible(id: string, visible: boolean) {
    const group = this.objectGroups.get(id);
    if (!group) return;
    group.visible = visible;
    this.walkController.refreshNavigation();
    this.refreshSelectionBounds();
    this.updateLabels(true);
  }

  private isolateAcademicAccentMaterials(definition: SceneDefinition, group: THREE.Group) {
    if (definition.category === 'academic-building' && group.userData.academicAccentMaterialsIsolated !== true) {
      const replacements = new Map<THREE.Material, THREE.Material>();
      group.traverse((child) => {
        if (!(child instanceof THREE.Mesh || child instanceof THREE.LineSegments)) return;
        const replace = (material: THREE.Material) => {
          if (!material.userData.isDistrictAccent) return material;
          let replacement = replacements.get(material);
          if (!replacement) {
            replacement = material.clone();
            replacements.set(material, replacement);
          }
          return replacement;
        };
        child.material = Array.isArray(child.material)
          ? child.material.map(replace)
          : replace(child.material);
      });
      group.userData.academicAccentMaterialsIsolated = true;
    }
  }

  setObjectAccent(id: string, color: string) {
    const group = this.objectGroups.get(id);
    const definition = this.definitions.get(id);
    if (!group || !definition) return;
    this.isolateAcademicAccentMaterials(definition, group);
    setModelAccent(group, color);
    if (group.userData.styleCustomized === true || definition.category === 'editor' || definition.category === 'imported') {
      const primary = group.userData.primaryColor ?? '#ffffff';
      const secondary = group.userData.secondaryColor ?? '#74858a';
      applyCustomStyles(group, primary, secondary, color, group.userData.patternType, group.userData.patternScale);
    }
    const replacement = { ...definition, accent: color } as SceneDefinition;
    this.definitions.set(id, replacement);
    const label = this.labels.get(id);
    label?.anchor.element.style.setProperty('--label-accent', color);
    if (label) label.definition = replacement;
    this.callbacks.onTransform?.(replacement, this.getObjectState(id)!);
    this.walkController.refreshNavigation();
  }

  setObjectColors(id: string, primary: string, secondary: string, accent: string) {
    const group = this.objectGroups.get(id);
    const definition = this.definitions.get(id);
    if (!group || !definition) return;

    group.userData.primaryColor = primary;
    group.userData.secondaryColor = secondary;
    group.userData.accent = accent;
    group.userData.styleCustomized = true;

    applyCustomStyles(group, primary, secondary, accent, group.userData.patternType, group.userData.patternScale);

    const replacement = {
      ...definition,
      accent,
      primaryColor: primary,
      secondaryColor: secondary,
    } as SceneDefinition;
    this.definitions.set(id, replacement);

    const label = this.labels.get(id);
    label?.anchor.element.style.setProperty('--label-accent', accent);
    if (label) label.definition = replacement;

    this.callbacks.onTransform?.(replacement, this.getObjectState(id)!);
  }

  setObjectPattern(id: string, pattern: string, scale: number) {
    const group = this.objectGroups.get(id);
    const definition = this.definitions.get(id);
    if (!group || !definition) return;

    group.userData.patternType = pattern;
    group.userData.patternScale = scale;
    group.userData.styleCustomized = true;

    applyCustomStyles(group, group.userData.primaryColor ?? '#ffffff', group.userData.secondaryColor ?? '#74858a', definition.accent, pattern, scale);

    const replacement = {
      ...definition,
      patternType: pattern,
      patternScale: scale,
    } as SceneDefinition;
    this.definitions.set(id, replacement);

    this.callbacks.onTransform?.(replacement, this.getObjectState(id)!);
  }

  setObjectCollision(id: string, enabled: boolean) {
    const group = this.objectGroups.get(id);
    const definition = this.definitions.get(id);
    if (!group || !definition) return;

    group.userData.collisionEnabled = enabled;

    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.userData.originalNavObstacle === undefined) {
          child.userData.originalNavObstacle = child.userData.navObstacle || false;
        }
        child.userData.navObstacle = enabled ? child.userData.originalNavObstacle : false;
      }
    });
    if (id === 'academic-libraries-theoretical-labs') {
      this.applyAcademicGateOpen(group.userData.academicGateOpen === true, false);
    }

    const replacement = {
      ...definition,
      collisionEnabled: enabled,
    } as SceneDefinition;
    this.definitions.set(id, replacement);

    this.walkController.refreshNavigation();
    this.callbacks.onTransform?.(replacement, this.getObjectState(id)!);
  }

  setObjectInteractions(id: string, list: string[]) {
    const group = this.objectGroups.get(id);
    const definition = this.definitions.get(id);
    if (!group || !definition) return;

    group.userData.interactions = list;

    const replacement = {
      ...definition,
      interactions: list,
    } as SceneDefinition;
    this.definitions.set(id, replacement);

    this.callbacks.onTransform?.(replacement, this.getObjectState(id)!);
  }

  saveProjectToLocalStorage() {
    const objects = Array.from(this.definitions.values()).map((definition) => ({
      ...definition,
      state: this.getObjectState(definition.id),
    }));
    const payload = {
      schema: 'youtopy.lab-island/1.0',
      masterplan: { worldExpansion: WORLD_EXPANSION },
      exportedAt: new Date().toISOString(),
      objects,
      editor: {
        workspace: this.editWorkspace,
        daylight: this.isDaylight(),
        timeOfDay: this.activeTimeOfDay,
        weather: this.activeWeather,
        season: this.activeSeason,
        academicFountain: this.serializeAcademicFountainState(),
        cerebrumLibrary: this.serializeCerebrumLibraryState(),
        camera: this.serializeCameraState(),
      },
    };
    localStorage.setItem('youtopy_saved_project', JSON.stringify(payload));
  }

  loadProjectFromLocalStorage(): boolean {
    const raw = localStorage.getItem('youtopy_saved_project');
    if (!raw) return false;
    try {
      const payload = JSON.parse(raw);
      return this.loadProject(payload);
    } catch (e) {
      console.error('Failed to parse saved project from LocalStorage', e);
      return false;
    }
  }

  rebuildStaticDistrictsAndBiomes() {
    const mountedLibrary = this.getCerebrumLibraryRoot();
    const mountedLibraryState = mountedLibrary ? getCerebrumLibraryState(mountedLibrary) : null;
    if (mountedLibraryState) this.cachedCerebrumLibraryState = this.cloneCerebrumState(mountedLibraryState);
    this.cancelScheduledCerebrumLoad?.();
    this.cancelScheduledCerebrumLoad = null;
    this.restoreAcademicExteriorAfterInterior();
    this.restoreExteriorHighDetailRoots();
    const toRemove = ACADEMIC_CAMPUS_BUILDINGS.map((record) => academicBuildingSelectableId(record.id));
    districts.forEach((d) => toRemove.push(d.id));
    biomes.forEach((b) => toRemove.push(b.id));

    toRemove.forEach((id) => {
      // Static reconstruction replaces the same canonical 41 definitions.
      // Do not report them as user deletions or the Atlas will splice every
      // district/biome from its own definition list during Save/Refresh.
      this.unregisterObject(id, false);
    });

    this.createDistrictsAndBiomes();
    this.cerebrumStreaming = {
      ...this.cerebrumStreaming,
      phase: 'unloaded',
      mounted: false,
      scheduled: false,
      mountedAt: null,
    };
    this.updateWorldStreaming(false, true);
    this.syncAcademicGateForTime(true);
    this.refreshAnimatedObjects();
    const academic = this.objectGroups.get('academic-libraries-theoretical-labs');
    if (academic) {
      configureAcademicTreeQuality(academic, this.graphicsQuality);
      const fountain = academic.getObjectByName(ACADEMIC_FOUNTAIN_ROOT_NAME);
      if (fountain) configureAcademicFountainQuality(fountain, this.graphicsQuality);
      const library = academic.getObjectByName(CEREBRUM_LIBRARY_ROOT_NAME);
      if (library) configureCerebrumLibraryQuality(library, this.graphicsQuality);
    }
  }

  loadProject(payload: any): boolean {
    if (!payload || payload.schema !== 'youtopy.lab-island/1.0') return false;
    const savedWorldExpansion = Number(payload.masterplan?.worldExpansion) || 3;
    const savedLayoutScale = WORLD_EXPANSION / savedWorldExpansion;

    this.rebuildStaticDistrictsAndBiomes();

    // 1. Clear any editor/imported dynamic assets
    const dynamicIds = Array.from(this.definitions.keys()).filter((id) => id.startsWith('editor-') || id.startsWith('imported-'));
    dynamicIds.forEach((id) => this.unregisterObject(id));

    this.interiorGroups.forEach((group) => {
      group.removeFromParent();
    });
    this.interiorGroups.clear();
    this.interiorAssetIds.clear();

    const defaultInteractionsHelper = (lid: string) => {
      const list: string[] = [];
      if (lid.includes('chair') || lid.includes('bench') || lid.includes('sofa') || lid.includes('desk') || lid.includes('workstation')) {
        list.push('sit');
      }
      if (lid.includes('sofa') || lid.includes('chair') || lid.includes('pod')) {
        list.push('sleep');
      }
      if (lid.includes('microscope') || lid.includes('sequencer') || lid.includes('centrifuge') || lid.includes('dispenser') || lid.includes('bench') || lid.includes('lab') || lid.includes('tower')) {
        list.push('research');
        list.push('analyze');
      }
      if (lid.includes('lamp') || lid.includes('gate') || lid.includes('spire') || lid.includes('rack') || lid.includes('console') || lid.includes('sequencer') || lid.includes('dispenser') || lid.includes('canopy')) {
        list.push('power');
      }
      if (lid.includes('shower') || lid.includes('dome') || lid.includes('cabinet') || lid.includes('airlock')) {
        list.push('decontaminate');
      }
      return list.length ? list : ['research'];
    };

    // 2. Load objects
    payload.objects.forEach((obj: any) => {
      const id = obj.id;
      const state = obj.state;

      if (id.startsWith('editor-')) {
        const catalogId = obj.catalogId;
        const item = EDITOR_ASSET_CATALOG.find((entry) => entry.id === catalogId);
        if (item) {
          const group = createEditorAsset(item, id);
          group.name = `${item.workspace === 'interior' ? 'INTERIOR_ASSET' : 'LANDSCAPE_ASSET'}__${slugify(item.name)}`;
          group.userData.editable = true;
          group.userData.catalogId = item.id;
          group.userData.workspace = item.workspace;

          if (state) {
            const layoutScale = item.workspace === 'landscape' ? savedLayoutScale : 1;
            group.position.set(
              state.position.x * layoutScale,
              state.position.y,
              state.position.z * layoutScale,
            );
            group.rotation.y = THREE.MathUtils.degToRad(state.rotationY);
            group.scale.setScalar(state.scale);
            group.visible = state.visible;
          }

          const primaryColor = state?.primaryColor ?? obj.primaryColor ?? '#ffffff';
          const secondaryColor = state?.secondaryColor ?? obj.secondaryColor ?? '#74858a';
          const patternType = state?.patternType ?? obj.patternType ?? 'solid';
          const patternScale = state?.patternScale ?? obj.patternScale ?? 1.0;
          const collisionEnabled = state?.collisionEnabled !== false && obj.collisionEnabled !== false;
          const interactions = state?.interactions ?? obj.interactions ?? defaultInteractionsHelper(item.id);

          group.userData.primaryColor = primaryColor;
          group.userData.secondaryColor = secondaryColor;
          group.userData.patternType = patternType;
          group.userData.patternScale = patternScale;
          group.userData.collisionEnabled = collisionEnabled;
          group.userData.interactions = interactions;

          applyCustomStyles(group, primaryColor, secondaryColor, state?.accent ?? obj.accent, patternType, patternScale);

          group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.userData.originalNavObstacle = child.userData.navObstacle || false;
              child.userData.navObstacle = collisionEnabled ? child.userData.originalNavObstacle : false;
            }
          });

          if (item.workspace === 'interior') {
            const parentId = obj.parentBuildingId;
            if (parentId) {
              const interior = this.ensureInterior(parentId);
              if (interior) {
                interior.add(group);
                const ids = this.interiorAssetIds.get(parentId) ?? new Set<string>();
                ids.add(id);
                this.interiorAssetIds.set(parentId, ids);
              }
            }
          } else {
            (item.kind === 'building' ? this.architectureRoot : this.landscapeRoot).add(group);
          }

          const definition: EditorAssetDefinition = {
            ...obj,
            primaryColor,
            secondaryColor,
            patternType,
            patternScale,
            collisionEnabled,
            interactions,
          };
          this.registerSelectable(definition, group, item.height + 0.8, false, item.workspace === 'landscape');
        }
      } else if (id.startsWith('imported-')) {
        // Skip recreating base64 imported models for LocalStorage context, but preserve definition if needed
      } else {
        const group = this.objectGroups.get(id);
        const definition = this.definitions.get(id);
        if (group && definition) {
          if (state) {
            group.position.set(
              state.position.x * savedLayoutScale,
              state.position.y,
              state.position.z * savedLayoutScale,
            );
            group.rotation.y = THREE.MathUtils.degToRad(state.rotationY);
            group.scale.setScalar(state.scale);
            group.visible = state.visible;
          }

          // Prior saves wrote fallback editor swatches into every untouched procedural
          // district. Only replay styles that were explicitly customized. Top-level
          // style fields preserve compatibility with genuinely customized legacy saves.
          const hasLegacyStyleFields = (
            obj.primaryColor !== undefined
            || obj.secondaryColor !== undefined
            || obj.patternType !== undefined
            || obj.patternScale !== undefined
          );
          const legacyPrimaryColor = String(state?.primaryColor ?? obj.primaryColor ?? '#ffffff').toLowerCase();
          const legacySecondaryColor = String(state?.secondaryColor ?? obj.secondaryColor ?? '#74858a').toLowerCase();
          const legacyPatternType = state?.patternType ?? obj.patternType ?? 'solid';
          const legacyPatternScale = Number(state?.patternScale ?? obj.patternScale ?? 1);
          const syntheticLegacyFallback = legacyPrimaryColor === '#ffffff'
            && legacySecondaryColor === '#74858a'
            && legacyPatternType === 'solid'
            && legacyPatternScale === 1;
          const legacyCustomizedStyle = state?.styleCustomized === undefined
            && hasLegacyStyleFields
            && !syntheticLegacyFallback;
          const styleCustomized = state?.styleCustomized === true || legacyCustomizedStyle;
          const primaryColor = styleCustomized ? state?.primaryColor ?? obj.primaryColor : undefined;
          const secondaryColor = styleCustomized ? state?.secondaryColor ?? obj.secondaryColor : undefined;
          const patternType = styleCustomized ? state?.patternType ?? obj.patternType : undefined;
          const patternScale = styleCustomized ? state?.patternScale ?? obj.patternScale : undefined;
          const collisionEnabled = state?.collisionEnabled !== false && obj.collisionEnabled !== false;
          const interactions = state?.interactions ?? obj.interactions ?? [];

          if (styleCustomized) {
            group.userData.primaryColor = primaryColor;
            group.userData.secondaryColor = secondaryColor;
            group.userData.patternType = patternType;
            group.userData.patternScale = patternScale;
          } else {
            delete group.userData.primaryColor;
            delete group.userData.secondaryColor;
            delete group.userData.patternType;
            delete group.userData.patternScale;
          }
          group.userData.styleCustomized = styleCustomized;
          group.userData.collisionEnabled = collisionEnabled;
          group.userData.interactions = interactions;

          const accent = state?.accent ?? obj.accent;
          if (styleCustomized) {
            applyCustomStyles(group, primaryColor, secondaryColor, accent, patternType, patternScale);
          } else if (String(accent).toLowerCase() !== String(definition.accent).toLowerCase()) {
            this.isolateAcademicAccentMaterials(definition, group);
            setModelAccent(group, accent);
          }

          group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.userData.originalNavObstacle = child.userData.navObstacle || false;
              child.userData.navObstacle = collisionEnabled ? child.userData.originalNavObstacle : false;
            }
          });

          const savedName = typeof obj.name === 'string' && obj.name.trim()
            ? obj.name.trim().slice(0, 120)
            : definition.name;
          const savedLabel = typeof obj.label === 'string' && obj.label.trim()
            ? obj.label.trim().slice(0, 120)
            : undefined;
          const savedDescription = typeof obj.description === 'string'
            ? obj.description.trim().slice(0, 800)
            : definition.description;
          const savedInscription = definition.category === 'academic-building' && typeof definition.inscription === 'string'
            ? (typeof obj.inscription === 'string' ? obj.inscription : definition.inscription).trim().slice(0, 96)
            : undefined;
          const replacement = {
            ...definition,
            name: savedName,
            label: savedLabel,
            description: savedDescription,
            ...(savedInscription !== undefined ? { inscription: savedInscription } : {}),
            accent,
            ...(styleCustomized ? { primaryColor, secondaryColor, patternType, patternScale } : {}),
            collisionEnabled,
            interactions,
          } as SceneDefinition;
          this.definitions.set(id, replacement);

          const label = this.labels.get(id);
          label?.anchor.element.style.setProperty('--label-accent', accent);
          if (label) {
            label.definition = replacement;
            label.anchor.element.textContent = sceneLabel(replacement);
          }
          group.userData.displayName = savedName;
          group.userData.displayLabel = sceneLabel(replacement);
          group.userData.description = savedDescription;
          if (savedInscription !== undefined) updateAcademicBuildingInscription(group, savedInscription);
        }
      }
    });

    if (payload.editor) {
      if (payload.editor.weather !== undefined) {
        this.setWeather(payload.editor.weather);
      }
      if (payload.editor.season !== undefined) {
        this.setSeason(payload.editor.season);
      }
      // Academic weather presets can imply a time of day. Restore the user's
      // explicit time selection last so independent weather/time combinations
      // round-trip exactly and the gate follows that final light phase.
      if (payload.editor.timeOfDay !== undefined) {
        this.setTimeOfDay(payload.editor.timeOfDay);
      } else if (payload.editor.daylight !== undefined) {
        this.setDaylight(payload.editor.daylight);
      }
      if (payload.editor.camera) {
        const cam = payload.editor.camera;
        this.camera.position.fromArray(cam.position);
        this.controls.target.fromArray(cam.target);
        this.camera.position.x *= savedLayoutScale;
        this.camera.position.z *= savedLayoutScale;
        this.controls.target.x *= savedLayoutScale;
        this.controls.target.z *= savedLayoutScale;
        const fountain = this.getAcademicFountainRoot();
        if (fountain) {
          const center = fountain.getWorldPosition(new THREE.Vector3());
          const closeToFountain = this.camera.position.distanceTo(center)
            <= ACADEMIC_FOUNTAIN_CONFIG.orbit.maximumDistanceMetres * 0.1 + 0.35
            && this.controls.target.distanceTo(center) <= 1.25;
          if (closeToFountain) {
            const savedPreset = payload.editor.academicFountain?.cameraPreset;
            const presetId = ACADEMIC_FOUNTAIN_CAMERA_PRESETS.some((preset) => preset.id === savedPreset)
              ? savedPreset as AcademicFountainCameraPresetId
              : undefined;
            const pose = getAcademicFountainCameraPose(fountain, presetId);
            this.setAcademicFountainInspectionControls(true, pose.id);
            // Legacy saves persisted position and target only. Infer the
            // inspection projection so a top-down preset does not reload with
            // Y-up and the global overview clipping plane.
            if (!Array.isArray(cam.up)) this.camera.up.copy(pose.up);
            if (!Number.isFinite(Number(cam.fieldOfView))) this.camera.fov = pose.fieldOfView;
            if (!Number.isFinite(Number(cam.near))) this.camera.near = 0.02;
          } else {
            this.setAcademicFountainInspectionControls(false);
          }
        }
        if (Array.isArray(cam.up) && cam.up.length >= 3) this.camera.up.fromArray(cam.up);
        if (Number.isFinite(Number(cam.fieldOfView))) this.camera.fov = Number(cam.fieldOfView);
        if (Number.isFinite(Number(cam.near))) this.camera.near = Math.max(0.001, Number(cam.near));
        this.camera.updateProjectionMatrix();
        this.controls.update();
      }
      this.restoreAcademicFountainState(payload.editor.academicFountain);
      this.restoreCerebrumLibraryRuntime(payload.editor.cerebrumLibrary);
    }

    this.applySeasonColors(this.activeSeason);
    this.walkController.refreshNavigation();
    this.clearSelection('ui');
    return true;
  }

  takeSnapshotPayload() {
    return {
      schema: 'youtopy.lab-island/1.0',
      masterplan: { worldExpansion: WORLD_EXPANSION },
      exportedAt: new Date().toISOString(),
      objects: Array.from(this.definitions.values()).map((definition) => ({
        ...definition,
        state: this.getObjectState(definition.id),
      })),
      editor: {
        workspace: this.editWorkspace,
        daylight: this.isDaylight(),
        timeOfDay: this.activeTimeOfDay,
        weather: this.activeWeather,
        season: this.activeSeason,
        academicFountain: this.serializeAcademicFountainState(),
        cerebrumLibrary: this.serializeCerebrumLibraryState(),
        camera: this.serializeCameraState(),
      },
    };
  }

  saveUndoState() {
    const payloadStr = JSON.stringify(this.takeSnapshotPayload());
    if (this.undoStack.length === 0 || this.undoStack[this.undoStack.length - 1] !== payloadStr) {
      this.undoStack.push(payloadStr);
      if (this.undoStack.length > 50) {
        this.undoStack.shift();
      }
      this.callbacks.onUndoStackChange?.(true);
    }
  }

  undo() {
    if (this.undoStack.length === 0) return false;
    const prevStr = this.undoStack.pop()!;
    try {
      const payload = JSON.parse(prevStr);
      this.loadProject(payload);
      this.callbacks.onUndoStackChange?.(this.undoStack.length > 0);
      return true;
    } catch (e) {
      console.error('Failed to undo', e);
      return false;
    }
  }

  resetObject(id: string) {
    const group = this.objectGroups.get(id);
    const initial = this.initialTransforms.get(id);
    if (!group || !initial) return;
    group.position.copy(initial.position);
    group.quaternion.copy(initial.quaternion);
    group.scale.copy(initial.scale);
    group.visible = initial.visible;
    setModelAccent(group, initial.accent);
    const definition = this.definitions.get(id);
    if (definition && definition.accent !== initial.accent) {
      const replacement = { ...definition, accent: initial.accent } as SceneDefinition;
      this.definitions.set(id, replacement);
      const label = this.labels.get(id);
      if (label) {
        label.definition = replacement;
        label.anchor.element.style.setProperty('--label-accent', initial.accent);
      }
    }
    this.notifyTransform(id);
    this.walkController.refreshNavigation();
  }

  private notifyTransform(id: string) {
    this.syncInteriorTransform(id);
    this.refreshSelectionBounds();
    this.updateLabels(true);
    const definition = this.definitions.get(id);
    const state = this.getObjectState(id);
    if (definition && state) this.callbacks.onTransform?.(definition, state);
  }

  beginImportPlacement() {
    if (this.activeInteriorBuildingId) return false;
    this.importPlacementChoosing = true;
    this.importPlacement = null;
    this.importPlacementMarker.visible = false;
    this.clearSelection('system');
    this.renderer.domElement.style.cursor = 'crosshair';
    this.callbacks.onImportPlacementChange?.('choosing');
    return true;
  }

  cancelImportPlacement() {
    if (!this.importPlacementChoosing && !this.importPlacement) return false;
    this.importPlacementChoosing = false;
    this.importPlacement = null;
    this.importPlacementMarker.visible = false;
    this.renderer.domElement.style.cursor = this.mode === 'walk' ? 'crosshair' : 'grab';
    this.callbacks.onImportPlacementChange?.('cancelled');
    return true;
  }

  private clearImportPlacement() {
    this.importPlacementChoosing = false;
    this.importPlacement = null;
    this.importPlacementMarker.visible = false;
    this.renderer.domElement.style.cursor = this.mode === 'walk' ? 'crosshair' : 'grab';
    this.callbacks.onImportPlacementChange?.('cleared');
  }

  getImportPlacementState() {
    return {
      choosing: this.importPlacementChoosing,
      position: this.importPlacement?.toArray() ?? null,
    };
  }

  async importFiles(files: readonly File[]) {
    if (!files.length) return [];
    const objectUrls = new Map<string, string>();
    files.forEach((file) => objectUrls.set(file.name.toLowerCase(), URL.createObjectURL(file)));
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => {
      const filename = decodeURIComponent(url).split('/').pop()?.toLowerCase() ?? '';
      return objectUrls.get(filename) ?? url;
    });
    const imported: ImportedDefinition[] = [];
    try {
      for (const file of files) {
        const extension = getFileExtension(file);
        if (!['glb', 'gltf', 'obj', 'stl'].includes(extension)) continue;
        let object: THREE.Object3D;
        if (extension === 'glb' || extension === 'gltf') {
          const loader = new GLTFLoader(manager);
          const result = await loader.loadAsync(objectUrls.get(file.name.toLowerCase())!);
          object = result.scene;
          object.animations = result.animations;
        } else if (extension === 'obj') {
          const loader = new OBJLoader(manager);
          object = loader.parse(await file.text());
        } else {
          const loader = new STLLoader(manager);
          const geometry = loader.parse(await file.arrayBuffer());
          geometry.computeVertexNormals();
          object = new THREE.Mesh(
            geometry,
            new THREE.MeshPhysicalMaterial({ color: '#cbd5d2', roughness: 0.4, metalness: 0.22 }),
          );
        }
        const definition = this.addImportedObject(object, file.name, imported.length);
        imported.push(definition);
      }
    } finally {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      this.clearImportPlacement();
    }
    return imported;
  }

  private addImportedObject(object: THREE.Object3D, filename: string, placementIndex = 0) {
    const interiorBuildingId = this.activeInteriorBuildingId;
    const interiorTarget = interiorBuildingId ? this.ensureInterior(interiorBuildingId) : null;
    const safeName = slugify(filename) || 'mesh';
    const id = `imported-${safeName}-${Date.now().toString(36)}-${this.importedRoot.children.length + 1}`;
    const wrapper = new THREE.Group();
    wrapper.name = `IMPORTED__${safeName}`;
    wrapper.renderOrder = 2;
    wrapper.userData = {
      selectableId: id,
      type: 'imported',
      originalFilename: filename,
      editable: true,
    };
    object.name ||= safeName;
    object.traverse((child) => {
      child.userData.selectableId = id;
      if (child instanceof THREE.Group) child.renderOrder = Math.max(child.renderOrder, 2);
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = cloneMaterial(child.material);
        child.userData.navObstacle = true;
      }
    });
    wrapper.add(object);
    object.updateMatrixWorld(true);
    let bounds = new THREE.Box3().setFromObject(object, true);
    const size = bounds.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
    const fitScale = THREE.MathUtils.clamp((interiorTarget ? 1.15 : 8) / maxDimension, 0.001, 50);
    object.scale.multiplyScalar(fitScale);
    object.updateMatrixWorld(true);
    bounds = new THREE.Box3().setFromObject(object, true);
    const center = bounds.getCenter(new THREE.Vector3());
    object.position.x -= center.x;
    object.position.z -= center.z;
    object.position.y -= bounds.min.y;
    if (interiorTarget) {
      const placed = this.interiorAssetIds.get(interiorBuildingId!)?.size ?? 0;
      const width = Number(interiorTarget.userData.roomWidth) || 8;
      const depth = Number(interiorTarget.userData.roomDepth) || 6;
      wrapper.position.set(
        THREE.MathUtils.lerp(-width * 0.3, width * 0.3, (placed % 4) / 3),
        0.012,
        THREE.MathUtils.lerp(-depth * 0.23, depth * 0.18, (Math.floor(placed / 4) % 3) / 2),
      );
      interiorTarget.add(wrapper);
    } else {
      if (this.importPlacement) {
        const angle = placementIndex * 2.39996;
        const radius = placementIndex === 0 ? 0 : 4 + Math.floor(placementIndex / 6) * 2.5;
        wrapper.position.set(
          this.importPlacement.x + Math.cos(angle) * radius,
          this.importPlacement.y + 0.04,
          this.importPlacement.z + Math.sin(angle) * radius,
        );
      } else {
        const selectedGroup = this.selectedId ? this.objectGroups.get(this.selectedId) : null;
        if (selectedGroup) {
          const selectedPosition = selectedGroup.getWorldPosition(new THREE.Vector3());
          wrapper.position.set(selectedPosition.x + 2.5, ISLAND_SURFACE_Y + 0.04, selectedPosition.z + 2.5);
        } else {
          wrapper.position.set(0, ISLAND_SURFACE_Y + 0.04, 18);
        }
      }
      this.importedRoot.add(wrapper);
    }
    wrapper.updateMatrixWorld(true);
    const finalBounds = new THREE.Box3().setFromObject(wrapper, true);
    const finalSize = finalBounds.getSize(new THREE.Vector3());
    const definition: ImportedDefinition = {
      id,
      name: filename.replace(/\.[^.]+$/, ''),
      sourceLabel: filename,
      category: 'imported',
      ring: 'custom',
      position: [wrapper.position.x, wrapper.position.y, wrapper.position.z],
      footprint: [Math.max(finalSize.x, 1), Math.max(finalSize.z, 1)],
      height: Math.max(finalSize.y, 1),
      archetype: `Imported ${filename.split('.').pop()?.toUpperCase() ?? 'mesh'} asset`,
      accent: '#b7f34b',
      palette: ['#11181a', '#344246', '#c9d3d0', '#b7f34b'],
      description: `Editable mesh imported from ${filename}; its hierarchy and PBR materials are preserved for re-export${interiorTarget ? ' inside this building' : ''}.`,
      workspace: interiorTarget ? 'interior' : 'landscape',
      parentBuildingId: interiorBuildingId ?? undefined,
    };
    this.registerSelectable(definition, wrapper, Math.max(finalSize.y + 1.5, 3), false, !interiorTarget);
    if (interiorBuildingId) {
      const ids = this.interiorAssetIds.get(interiorBuildingId) ?? new Set<string>();
      ids.add(id);
      this.interiorAssetIds.set(interiorBuildingId, ids);
    }
    this.walkController.refreshNavigation();
    this.callbacks.onImport?.(definition);
    this.select(id, 'system');
    this.focus(id);
    return definition;
  }

  async exportGLB(filename = 'YouTopy_Lab_Island.glb') {
    this.modelRoot.updateMatrixWorld(true);
    const exporter = new GLTFExporter();
    const exportRoot = this.modelRoot.clone(true);
    exportRoot.name = 'LAB_ISLAND__BLENDER_EXPORT';
    exportRoot.traverse((child) => {
      if (child.userData.exportFallback) child.visible = true;
      if (child.userData.exportAlways) child.visible = true;
      if (child.userData.editorCutawayCeiling) child.visible = true;
      if (typeof child.userData.editorIsolationRestoreVisible === 'boolean') {
        child.visible = child.userData.editorIsolationRestoreVisible;
        delete child.userData.editorIsolationRestoreVisible;
      }
      const academicTreeLodLevel = child.userData.academicTreeLodLevel as string | undefined;
      if (academicTreeLodLevel) child.visible = academicTreeLodLevel === 'near';
      if (child.name === 'WELL__NEAR_DETAIL_LOD') child.visible = true;
      if (child.name === 'WELL__ORBITAL_RING_ENGRAVED_TICKS') child.visible = true;
      if (child.name === 'WELL__SESHAT_HIGH_DETAIL_ORIGINAL_SCULPTURE') child.visible = true;
      if (child.name === 'WELL__SESHAT_MEDIUM_DETAIL_SCULPTURE' || child.name === 'WELL__SESHAT_LONG_DISTANCE_SILHOUETTE') {
        child.visible = false;
      }
      if (
        child.name === 'WELL__MUSEUM_WHITE_PRESENTATION_ENVIRONMENT'
        || child.name === 'WELL__DEBUG_LIGHTS_COLLISIONS_WATER_PATHS_AND_STATS'
        || child.name === 'WELL__INTERNAL_WATER_SYSTEM_CUTAWAY'
        || child.name === 'WELL__CLEAN_WEATHERED_RESTORATION_COMPARISON'
      ) child.visible = false;
      if (child instanceof THREE.Mesh && child.name === 'WELL__DARK_REFLECTIVE_POLYGONAL_WATER') {
        // GLTFExporter deliberately skips ShaderMaterial. Give the Blender
        // clone an equivalent bounded PBR water surface while the live scene
        // retains its efficient animated shader.
        child.material = new THREE.MeshPhysicalMaterial({
          name: 'Well export green-black reflective water',
          color: '#152826',
          roughness: 0.12,
          metalness: 0,
          transmission: 0.18,
          transparent: true,
          opacity: 0.9,
          clearcoat: 0.28,
        });
      }
    });
    const exportSun = this.sun.clone();
    exportSun.name = 'Blender Sun';
    exportSun.castShadow = true;
    exportSun.target.position.set(0, 0, -1);
    exportSun.add(exportSun.target);
    exportRoot.add(exportSun);
    const result = await exporter.parseAsync(exportRoot, {
      binary: true,
      onlyVisible: true,
      trs: true,
      maxTextureSize: 2048,
      includeCustomExtensions: true,
    });
    if (!(result instanceof ArrayBuffer)) throw new Error('GLB exporter returned an unexpected text payload.');
    downloadBlob(new Blob([result], { type: 'model/gltf-binary' }), filename);
  }

  exportProject(filename = 'YouTopy_Lab_Island.project.json') {
    const objects = Array.from(this.definitions.values()).map((definition) => ({
      ...definition,
      state: this.getObjectState(definition.id),
    }));
    const payload = {
      schema: 'youtopy.lab-island/1.0',
      masterplan: { worldExpansion: WORLD_EXPANSION },
      exportedAt: new Date().toISOString(),
      units: '10 metres per world unit',
      coordinateSystem: { x: 'east', y: 'up', z: 'south' },
      sourceSketch: 'YT_LabIsland_Ideas1.png',
      objects,
      editor: {
        mode: this.mode,
        workspace: this.editWorkspace,
        activeInteriorBuildingId: this.activeInteriorBuildingId,
        daylight: this.isDaylight(),
        timeOfDay: this.activeTimeOfDay,
        weather: this.activeWeather,
        season: this.activeSeason,
        academicFountain: this.serializeAcademicFountainState(),
        cerebrumLibrary: this.serializeCerebrumLibraryState(),
        camera: this.serializeCameraState(),
      },
      blender: {
        import: 'File > Import > glTF 2.0',
        primaryExchangeFile: 'YouTopy_Lab_Island.glb',
      },
    };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), filename);
  }

  getTextSnapshot() {
    const selected = this.getSelectedDefinition();
    const selectedGroup = selected ? this.objectGroups.get(selected.id) : undefined;
    const industrialDistrict = this.objectGroups.get('industrial-labs')?.userData.industrialDistrict ?? null;
    const academicGroup = this.objectGroups.get('academic-libraries-theoretical-labs');
    let cellViolations = 0;
    const boundedDistricts = districts.filter((definition) => Boolean(this.objectGroups.get(definition.id)?.userData.districtCell)).length;
    const populatedDistricts = districts.filter((definition) => {
      const population = this.objectGroups.get(definition.id)?.userData.population;
      return Number(population?.realizedFacilityCount) >= 1 && Number(population?.realizedObjectCount) >= 2;
    }).length;
    const distinctDistricts = districts.filter((definition) => this.objectGroups.get(definition.id)?.userData.population?.distinct === true).length;
    districts.forEach((definition) => {
      const group = this.objectGroups.get(definition.id);
      group?.traverse((child) => {
        const anchor = child.userData.sectorAnchor;
        if (!anchor) return;
        if (
          Number(anchor.normalizedRadial) < -0.0001
          || Number(anchor.normalizedRadial) > 1.0001
          || Number(anchor.normalizedAngular) < -0.0001
          || Number(anchor.normalizedAngular) > 1.0001
        ) cellViolations += 1;
      });
    });
    const filledBiomeDomes = biomes.filter((definition) => this.objectGroups.get(definition.id)?.userData.biomeEcologyPlan?.filled === true).length;
    const visibleLabels = Array.from(this.labels.values()).filter(
      (label) => !(label.anchor.element as HTMLElement).classList.contains('label-suppressed'),
    );
    return {
      application: 'YouTopy Lab Island spatial editor',
      contentAuthority: 'web-sandbox; Unreal Editor owns production content',
      coordinateSystem: 'origin at central megabuilding; +X east, +Y up, +Z south; 1 unit = 10 metres',
      mode: this.mode,
      environment: this.isDaylight() ? 'daylight' : 'blue-hour',
      atmosphere: {
        timeOfDay: this.activeTimeOfDay,
        weather: this.activeWeather,
        season: this.activeSeason,
        graphicsQuality: this.graphicsQuality,
        audioMuted: this.academicAudio.isMuted(),
        debugMode: this.debugMode,
      },
      masterplan: {
        worldExpansion: WORLD_EXPANSION,
        islandRadiusWorldUnits: ISLAND_RADIUS,
        islandRadiusMetres: ISLAND_RADIUS * 10,
      },
      streaming: this.getStreamingSnapshot(),
      counts: {
        districts: districts.length,
        biomes: biomes.length,
        importedAssets: this.importedRoot.children.length,
        editorAssets: Array.from(this.definitions.values()).filter((definition) => definition.category === 'editor').length,
        authoredInteriors: this.interiorGroups.size,
      },
      planning: {
        boundedDistricts,
        populatedDistricts,
        distinctDistricts,
        filledBiomeDomes,
        cellViolations,
      },
      edit: {
        workspace: this.editWorkspace,
        activeInteriorBuildingId: this.activeInteriorBuildingId,
        availableAssets: this.getAssetCatalog().map((item) => item.id),
      },
      importPlacement: this.getImportPlacementState(),
      industrialDistrict,
      academicDistrict: academicGroup ? {
        precinct: academicGroup.userData.academicPrecinct ?? null,
        componentHierarchy: academicGroup.userData.academicComponentHierarchy ?? null,
        materials: academicGroup.userData.academicMaterialsProcedural ?? [],
        optimization: academicGroup.userData.academicOptimization ?? null,
        treePopulation: academicGroup.userData.academicTreePopulation ?? null,
        pathNetwork: academicGroup.userData.academicPathNetwork ?? null,
        canal: academicGroup.userData.academicCanal ?? null,
        fountain: (() => {
          const fountain = academicGroup.getObjectByName(ACADEMIC_FOUNTAIN_ROOT_NAME);
          return fountain ? {
            mounted: fountain.parent !== null && fountain.userData.fountainMounted === true,
            visible: fountain.visible && fountain.parent?.visible !== false,
            rootName: fountain.name,
            version: Number(fountain.userData.fountainVersion ?? 0),
            worldPosition: fountain.getWorldPosition(new THREE.Vector3()).toArray().map((value) => Number(value.toFixed(3))),
            parentCourt: fountain.parent?.name ?? null,
            childCount: fountain.children.length,
            debugStats: fountain.userData.fountainDebugStats ?? null,
            metadata: fountain.userData.academicFountain ?? null,
            state: getAcademicFountainState(fountain),
            nearby: this.isAcademicFountainNearby(),
          } : null;
        })(),
        cerebrumExternum: (() => {
          const library = this.getCerebrumLibraryRoot();
          const streaming = this.getStreamingSnapshot().cerebrumExternum;
          if (!library) {
            return {
              name: 'Cerebrum Externum',
              undergroundName: 'Cerebrum Occultum',
              mounted: false,
              streaming,
              state: this.getCerebrumLibraryState(),
              inside: false,
              architecturalOrbitActive: false,
              activeHotspot: null,
              ambience: this.academicAudio.getLibrarySnapshot(),
            };
          }
          return {
            ...getCerebrumLibrarySnapshot(library),
            mounted: true,
            streaming,
            inside: this.isInsideCerebrumLibrary(),
            architecturalOrbitActive: this.cerebrumLibraryInspectionActive,
            activeHotspot: this.getActiveCerebrumLibraryHotspot(),
            ambience: this.academicAudio.getLibrarySnapshot(),
          };
        })(),
        gateOpen: academicGroup.userData.academicGateOpen === true,
        vintageBenchCount: Number(
          academicGroup.getObjectByName('academic-libraries-theoretical-labs__ACADEMIC_ZONE__VINTAGE_CAMPUS_BENCHES')
            ?.userData.academicVintageBenchCount ?? 0,
        ),
        readingLightsOn: academicGroup.userData.academicReadingLightsOn !== false,
        ashcroftNightLightsOn: academicGroup.userData.ashcroftNightLightsOn === true,
        cerebrumNightLightsOn: academicGroup.userData.cerebrumNightLightsOn === true,
        chapelBellRings: Number(academicGroup.userData.chapelBellRings ?? 0),
        activeHotspot: this.getActiveAcademicHotspot(),
      } : null,
      selected: selected
        ? {
            id: selected.id,
            name: selected.name,
            label: sceneLabel(selected),
            description: selected.description,
            ...(selected.category === 'academic-building' && typeof selected.inscription === 'string'
              ? { inscription: selected.inscription, referenceStyle: selectedGroup?.userData.ashcroftReferenceStyle ?? null }
              : {}),
            category: selected.category,
            state: this.getObjectState(selected.id),
            districtCell: selectedGroup?.userData.districtCell ?? null,
            population: selectedGroup?.userData.population ?? null,
            biomeEcologyPlan: selectedGroup?.userData.biomeEcologyPlan ?? null,
          }
        : null,
      visibleLabels: visibleLabels.map((label) => sceneLabel(label.definition)),
      camera: {
        position: this.camera.position.toArray().map((value) => Number(value.toFixed(2))),
        target: this.controls.target.toArray().map((value) => Number(value.toFixed(2))),
      },
      walk: {
        ...this.walkController.getSnapshot(),
        nearbyDistricts: Array.from(this.objectGroups.entries())
          .filter(([, group]) => group.getWorldPosition(new THREE.Vector3()).distanceTo(this.camera.position) <= 12)
          .map(([id]) => this.definitions.get(id)?.name)
          .filter((name): name is string => Boolean(name)),
      },
    };
  }

  activateWalkLook() {
    this.walkController.requestPointerLock();
  }

  setWalkIntent(x: number, z: number, sprint = false) {
    this.walkController.setMoveIntent(x, z, sprint);
  }

  setWalkTurbo(enabled: boolean) {
    this.walkController.setTurboEnabled(enabled);
  }

  toggleWalkTurbo() {
    return this.walkController.toggleTurbo();
  }

  getWalkTurboEnabled() {
    return this.walkController.isTurboEnabled();
  }

  advanceTime(milliseconds: number) {
    const steps = Math.max(1, Math.round(milliseconds / (1000 / 60)));
    for (let index = 0; index < steps; index += 1) {
      this.elapsed += 1 / 60;
      this.update(1 / 60);
    }
    this.render();
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.cancelScheduledCerebrumLoad?.();
    this.cancelScheduledCerebrumLoad = null;
    this.restoreAcademicExteriorAfterInterior();
    this.restoreExteriorHighDetailRoots();
    const fountain = this.getAcademicFountainRoot();
    if (fountain) disposeAcademicFountain(fountain);
    const library = this.getCerebrumLibraryRoot();
    if (library) disposeCerebrumLibrary(library);
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('dblclick', this.onDoubleClick);
    this.controls.dispose();
    this.walkController.dispose();
    this.transformControls.dispose();
    this.academicAudio.dispose();
    this.saoPass.dispose();
    this.bloomPass.dispose();
    this.composer.dispose();
    this.worldStreaming.dispose();
    this.renderer.dispose();
    this.labelRenderer.domElement.remove();
    this.renderer.domElement.remove();
  }
}
