import * as THREE from 'three';

/** The island uses one tenth of a world unit per metre. */
export const CEREBRUM_WORLD_UNITS_PER_METRE = 0.1;
export const CEREBRUM_LIBRARY_ROOT_NAME = 'CEREBRUM_LIBRARY__PROCEDURAL_INTERIOR';
export const CEREBRUM_OCCULTUM_NAME = 'Cerebrum Occultum';

const metres = (value: number) => value * CEREBRUM_WORLD_UNITS_PER_METRE;

export type CerebrumLibraryQuality = 'low' | 'medium' | 'high';
export type CerebrumLibraryLevel = 'ground' | 'upper-gallery' | 'occultum';
export type CerebrumLibrarySurface = 'stone' | 'wood' | 'rug';
export type CerebrumLibraryRoomId =
  | 'entrance-vestibule'
  | 'grand-stair-hall'
  | 'main-reading-room'
  | 'stacks'
  | 'card-catalogue-room'
  | 'librarian-office'
  | 'restricted-archive'
  | 'rare-book-room';

export type CerebrumLibraryHotspotKind =
  | 'door'
  | 'drawer'
  | 'rolling-ladder'
  | 'table-lamp'
  | 'book'
  | 'card-catalogue'
  | 'quiet-mode'
  | 'mute'
  | 'orbit-camera';

export type CerebrumLibraryAction =
  | 'toggle-door'
  | 'toggle-drawer'
  | 'pull-ladder'
  | 'toggle-lamp'
  | 'inspect-book'
  | 'search-card-catalogue'
  | 'toggle-quiet-mode'
  | 'toggle-mute'
  | 'toggle-orbit-camera';

export interface CerebrumLibraryHotspot {
  id: string;
  kind: CerebrumLibraryHotspotKind;
  action: CerebrumLibraryAction;
  label: string;
  roomId: CerebrumLibraryRoomId;
  localPosition: [number, number, number];
  radius: number;
  title?: string;
  description?: string;
}

export interface CerebrumLibraryState {
  quality: CerebrumLibraryQuality;
  navigationLevel: CerebrumLibraryLevel;
  quietMode: boolean;
  muted: boolean;
  orbitCamera: boolean;
  cutawayVisible: boolean;
  doors: Record<string, boolean>;
  drawers: Record<string, boolean>;
  lamps: Record<string, boolean>;
  ladderStop: number;
  inspectedBookId: string | null;
  catalogueRevealed: boolean;
  rareBookDoorUnlocked: boolean;
  rareBookLocation: string | null;
}

export interface CerebrumLibraryInteractionResult {
  handled: boolean;
  hotspotId?: string;
  action?: CerebrumLibraryAction;
  message: string;
  titleCard?: { title: string; subtitle: string; body: string };
  navigationChanged?: boolean;
  suggestedLevel?: CerebrumLibraryLevel;
  state: CerebrumLibraryState;
}

export interface CerebrumLibraryBuildOptions {
  /** Selectable building id propagated to every child. */
  selectableId?: string;
  /** Default is 112 metres, expressed in world units after conversion. */
  width?: number;
  /** Default is 78 metres, expressed in world units after conversion. */
  depth?: number;
  quality?: CerebrumLibraryQuality;
  seed?: number;
  quietMode?: boolean;
  muted?: boolean;
  /** Hide an existing generic editor shell while this authored interior is active. */
  hideLegacyShell?: boolean;
}

export interface CerebrumLibrarySnapshot {
  name: 'Cerebrum Externum';
  undergroundName: 'Cerebrum Occultum';
  coordinateSystem: string;
  dimensionsMetres: { width: number; depth: number; groundHeight: number; undergroundDepth: number };
  rooms: Array<{ id: CerebrumLibraryRoomId; name: string; level: CerebrumLibraryLevel }>;
  state: CerebrumLibraryState;
  activeHotspots: CerebrumLibraryHotspot[];
  counts: {
    hotspots: number;
    books: number;
    shelves: number;
    lamps: number;
    chairs: number;
    windows: number;
    pointLights: number;
    shadowCastingLights: number;
  };
  performance: {
    quality: CerebrumLibraryQuality;
    instancedMeshes: number;
    visibleInstances: number;
    fullInstances: number;
    distantShelfContentsSimplified: boolean;
  };
  navigation: {
    maximumStepRiseWorldUnits: number;
    maximumStepRiseMetres: number;
    controllerStepLimitWorldUnits: number;
    grandStairTreads: number;
    occultumStairTreads: number;
  };
  audio: {
    muted: boolean;
    quietMode: boolean;
    sources: string[];
    currentFootstepSurface: CerebrumLibrarySurface;
  };
}

export interface CerebrumLibraryOrbitPreset {
  target: [number, number, number];
  position: [number, number, number];
  minDistance: number;
  maxDistance: number;
  fov: number;
  cutaway: true;
}

export type CerebrumLibraryCameraPresetId = 'entrance' | 'reading-room' | 'stacks' | 'occultum' | 'rare-book-room' | 'architectural-orbit';

export interface CerebrumLibraryCameraPreset {
  id: CerebrumLibraryCameraPresetId;
  label: string;
  level: CerebrumLibraryLevel;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  cutaway: boolean;
}

interface BarrierSegment {
  start: [number, number, number];
  end: [number, number, number];
  radius: number;
}

interface DynamicDoor {
  pivot: THREE.Group;
  hotspotId: string;
  closedAngle: number;
  openAngle: number;
  barrier: BarrierSegment;
}

interface InteractiveDrawer {
  mesh: THREE.Mesh;
  hotspotId: string;
  closedPosition: THREE.Vector3;
  openOffset: THREE.Vector3;
}

interface InteractiveLamp {
  glow: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  pool: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  hotspotId: string;
}

interface ProceduralAudioRuntime {
  context: AudioContext;
  master: GainNode;
  ambience: GainNode;
  rainSource: AudioBufferSourceNode;
  roomTone: OscillatorNode;
}

interface CerebrumLibraryRuntime {
  root: THREE.Group;
  materials: LibraryMaterials;
  selectableId: string;
  width: number;
  depth: number;
  seed: number;
  state: CerebrumLibraryState;
  hotspots: Map<string, CerebrumLibraryHotspot>;
  hotspotMeshes: Map<string, THREE.Mesh>;
  doors: Map<string, DynamicDoor>;
  drawers: Map<string, InteractiveDrawer>;
  lamps: Map<string, InteractiveLamp>;
  bookCards: Map<string, { title: string; subtitle: string; body: string }>;
  staticBarriers: BarrierSegment[];
  collisionGuide: THREE.Object3D;
  groundNavigation: THREE.Group;
  upperNavigation: THREE.Group;
  occultumNavigation: THREE.Group;
  mediumDetails: THREE.Group;
  highDetails: THREE.Group;
  cutaway: THREE.Group;
  dust: THREE.Points[];
  pointLights: THREE.PointLight[];
  instancedMeshes: THREE.InstancedMesh[];
  audioMarkers: THREE.Object3D[];
  audio?: ProceduralAudioRuntime;
  elapsed: number;
  nextClockTick: number;
  nextPageTurn: number;
  currentFootstepSurface: CerebrumLibrarySurface;
  ladder?: THREE.Group;
  exteriorCutawayTargets: Map<THREE.Object3D, boolean>;
}

interface LibraryMaterials {
  stone: THREE.MeshStandardMaterial;
  paleStone: THREE.MeshStandardMaterial;
  dampStone: THREE.MeshStandardMaterial;
  oak: THREE.MeshStandardMaterial;
  darkOak: THREE.MeshStandardMaterial;
  panel: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  iron: THREE.MeshStandardMaterial;
  greenShade: THREE.MeshStandardMaterial;
  amber: THREE.MeshStandardMaterial;
  coldGlass: THREE.MeshPhysicalMaterial;
  paper: THREE.MeshStandardMaterial;
  parchment: THREE.MeshStandardMaterial;
  leather: THREE.MeshStandardMaterial;
  burgundyRug: THREE.MeshStandardMaterial;
  mutedRug: THREE.MeshStandardMaterial;
  black: THREE.MeshStandardMaterial;
  archiveBox: THREE.MeshStandardMaterial;
  book: THREE.MeshStandardMaterial;
  navigation: THREE.MeshBasicMaterial;
  hotspot: THREE.MeshBasicMaterial;
}

const libraryRuntimes = new WeakMap<THREE.Object3D, CerebrumLibraryRuntime>();
const dummy = new THREE.Object3D();
const RARE_BOOK_LOCATION = 'Cerebrum Occultum · Rare Book Room · Cabinet R-7 · Shelf 3';

const ROOM_DEFINITIONS: CerebrumLibrarySnapshot['rooms'] = [
  { id: 'entrance-vestibule', name: 'Entrance Vestibule', level: 'ground' },
  { id: 'grand-stair-hall', name: 'Grand Stair Hall', level: 'ground' },
  { id: 'main-reading-room', name: 'Main Reading Room', level: 'ground' },
  { id: 'stacks', name: 'The Stacks', level: 'ground' },
  { id: 'card-catalogue-room', name: 'Card Catalogue Room', level: 'ground' },
  { id: 'librarian-office', name: "Librarian's Office", level: 'ground' },
  { id: 'restricted-archive', name: CEREBRUM_OCCULTUM_NAME, level: 'occultum' },
  { id: 'rare-book-room', name: 'Rare Book Room', level: 'occultum' },
];

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function cloneState(state: CerebrumLibraryState): CerebrumLibraryState {
  return {
    ...state,
    doors: { ...state.doors },
    drawers: { ...state.drawers },
    lamps: { ...state.lamps },
  };
}

function createPatternTexture(kind: 'stone' | 'wood' | 'rug', seed: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A 2D canvas context is required for the Cerebrum Library materials.');
  const random = seededRandom(seed);

  if (kind === 'stone') {
    context.fillStyle = '#777269';
    context.fillRect(0, 0, 256, 256);
    context.strokeStyle = 'rgba(38, 35, 31, 0.32)';
    context.lineWidth = 4;
    for (let y = 0; y <= 256; y += 64) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(256, y);
      context.stroke();
      const offset = (y / 64) % 2 ? 32 : 0;
      for (let x = offset; x <= 256; x += 64) {
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x, y + 64);
        context.stroke();
      }
    }
    for (let index = 0; index < 90; index += 1) {
      const shade = 85 + Math.floor(random() * 65);
      context.fillStyle = `rgba(${shade}, ${shade - 4}, ${shade - 9}, ${0.025 + random() * 0.055})`;
      context.fillRect(random() * 256, random() * 256, 2 + random() * 14, 1 + random() * 4);
    }
  } else if (kind === 'wood') {
    context.fillStyle = '#4a2e1b';
    context.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 9) {
      context.strokeStyle = `rgba(151, 104, 61, ${0.07 + random() * 0.12})`;
      context.lineWidth = 1 + random() * 2;
      context.beginPath();
      context.moveTo(0, y + random() * 7);
      context.bezierCurveTo(64, y - 5 + random() * 10, 192, y + random() * 10, 256, y + random() * 7);
      context.stroke();
    }
  } else {
    context.fillStyle = '#542d2a';
    context.fillRect(0, 0, 256, 256);
    context.strokeStyle = '#9b8060';
    context.lineWidth = 5;
    context.strokeRect(12, 12, 232, 232);
    context.lineWidth = 2;
    context.strokeRect(24, 24, 208, 208);
    for (let offset = -256; offset < 512; offset += 36) {
      context.beginPath();
      context.moveTo(offset, 0);
      context.lineTo(offset + 256, 256);
      context.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = `Cerebrum ${kind} pattern`;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === 'stone' ? 8 : kind === 'wood' ? 5 : 2, kind === 'stone' ? 6 : kind === 'wood' ? 3 : 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createTextTexture(
  lines: readonly string[],
  options: { background?: string; foreground?: string; border?: string; font?: string } = {},
) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 384;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A 2D canvas context is required for Cerebrum signage.');
  context.fillStyle = options.background ?? '#d7cfb7';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = options.border ?? '#5d4327';
  context.lineWidth = 18;
  context.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
  context.fillStyle = options.foreground ?? '#211a13';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = options.font ?? '600 50px Georgia, serif';
  const spacing = canvas.height / (lines.length + 1);
  lines.forEach((line, index) => context.fillText(line, canvas.width * 0.5, spacing * (index + 1), canvas.width - 70));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.name = `Cerebrum sign: ${lines.join(' / ')}`;
  return texture;
}

function createMaterials(seed: number): LibraryMaterials {
  const stoneMap = createPatternTexture('stone', seed);
  const woodMap = createPatternTexture('wood', seed + 1);
  const rugMap = createPatternTexture('rug', seed + 2);
  const standard = (name: string, color: string, roughness = 0.78, metalness = 0) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    material.name = name;
    return material;
  };
  const stone = standard('Cerebrum worn stone floor', '#888176', 0.93);
  stone.map = stoneMap;
  const oak = standard('Cerebrum worn oak', '#b48a68', 0.78);
  oak.map = woodMap;
  oak.emissive.set('#160a05');
  oak.emissiveIntensity = 0.07;
  const darkOak = standard('Cerebrum dark old oak', '#755744', 0.82);
  darkOak.map = woodMap;
  darkOak.emissive.set('#1b0e08');
  darkOak.emissiveIntensity = 0.14;
  const burgundyRug = standard('Cerebrum worn burgundy rug', '#5b302f', 0.94);
  burgundyRug.map = rugMap;
  const greenShade = standard('Cerebrum green glass lamp shades', '#214837', 0.32, 0.05);
  greenShade.emissive.set('#163226');
  greenShade.emissiveIntensity = 0.18;
  const amber = standard('Cerebrum restrained amber lamplight', '#c8772b', 0.38);
  amber.emissive.set('#ff6f12');
  amber.emissiveIntensity = 1.22;
  const coldGlass = new THREE.MeshPhysicalMaterial({
    name: 'Cerebrum cool grey leaded window glass', color: '#9caeb3', roughness: 0.23,
    transmission: 0.18, transparent: true, opacity: 0.72, metalness: 0,
  });
  const book = standard('Cerebrum instanced book cloth', '#57443b', 0.88);
  book.vertexColors = true;
  return {
    stone,
    paleStone: standard('Cerebrum pale carved stone', '#a79f92', 0.9),
    dampStone: standard('Cerebrum Occultum damp basement stone', '#484943', 0.98),
    oak,
    darkOak,
    panel: standard('Cerebrum rare room wood panelling', '#24140d', 0.86),
    brass: standard('Cerebrum aged brass', '#a77e35', 0.38, 0.7),
    iron: standard('Cerebrum black iron', '#1c2020', 0.59, 0.72),
    greenShade,
    amber,
    coldGlass,
    paper: standard('Cerebrum scattered paper', '#d8d0b7', 0.92),
    parchment: standard('Cerebrum manuscript parchment', '#bca87c', 0.96),
    leather: standard('Cerebrum leather bindings', '#4a211c', 0.82),
    burgundyRug,
    mutedRug: standard('Cerebrum faded blue runner', '#3f4b52', 0.96),
    black: standard('Cerebrum black clock and laptop finish', '#111313', 0.55, 0.18),
    archiveBox: standard('Cerebrum neutral archival boxes', '#928970', 0.94),
    book,
    // Material visibility only affects WebGL submission; Three's Mesh.raycast
    // still resolves these meshes. Keeping them renderer-invisible removes
    // dozens of zero-colour draw calls without weakening navigation or E-use.
    navigation: new THREE.MeshBasicMaterial({ name: 'Cerebrum invisible navigation surface', visible: false }),
    hotspot: new THREE.MeshBasicMaterial({ name: 'Cerebrum invisible interaction proxy', visible: false }),
  };
}

function prepare<T extends THREE.Object3D>(object: T, runtime: CerebrumLibraryRuntime, name: string) {
  object.name = name;
  object.userData.selectableId = runtime.selectableId;
  object.userData.editorWorkspace = 'interior';
  object.userData.entityKind = 'cerebrum-library-interior';
  object.userData.cerebrumLibrary = true;
  return object;
}

function addBox(
  parent: THREE.Object3D,
  runtime: CerebrumLibraryRuntime,
  name: string,
  size: [number, number, number],
  material: THREE.Material,
  position: [number, number, number],
  options: { obstacle?: boolean; walkable?: boolean; surface?: CerebrumLibrarySurface; detail?: 'medium' | 'high'; cutaway?: boolean } = {},
) {
  const mesh = prepare(new THREE.Mesh(new THREE.BoxGeometry(...size), material), runtime, name);
  mesh.position.set(...position);
  mesh.castShadow = options.detail !== 'high';
  mesh.receiveShadow = true;
  if (options.obstacle) mesh.userData.navObstacle = true;
  if (options.walkable) mesh.userData.walkable = true;
  if (options.surface) mesh.userData.surfaceKind = options.surface;
  if (options.detail) mesh.userData.cerebrumDetailTier = options.detail;
  if (options.cutaway) {
    mesh.userData.editorCutawayCeiling = true;
    mesh.userData.cerebrumCutawayCeiling = true;
    mesh.userData.exportAlways = true;
  }
  parent.add(mesh);
  return mesh;
}

function addCylinder(
  parent: THREE.Object3D,
  runtime: CerebrumLibraryRuntime,
  name: string,
  radius: number,
  height: number,
  material: THREE.Material,
  position: [number, number, number],
  segments = 12,
) {
  const mesh = prepare(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material), runtime, name);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addNavigationFloor(
  parent: THREE.Group,
  runtime: CerebrumLibraryRuntime,
  name: string,
  size: [number, number],
  position: [number, number, number],
) {
  const surface: CerebrumLibrarySurface = parent === runtime.upperNavigation ? 'wood' : 'stone';
  return addBox(parent, runtime, name, [size[0], 0.008, size[1]], runtime.materials.navigation, position, { walkable: true, surface });
}

function setInstances(
  mesh: THREE.InstancedMesh,
  transforms: readonly { position: THREE.Vector3; scale: THREE.Vector3; rotation?: THREE.Euler; color?: THREE.Color }[],
) {
  transforms.forEach((transform, index) => {
    dummy.position.copy(transform.position);
    dummy.scale.copy(transform.scale);
    dummy.rotation.copy(transform.rotation ?? new THREE.Euler());
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    if (transform.color) mesh.setColorAt(index, transform.color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

function addInstanced(
  parent: THREE.Object3D,
  runtime: CerebrumLibraryRuntime,
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  transforms: readonly { position: THREE.Vector3; scale: THREE.Vector3; rotation?: THREE.Euler; color?: THREE.Color }[],
  lowFraction: number,
  mediumFraction: number,
) {
  const mesh = prepare(new THREE.InstancedMesh(geometry, material, transforms.length), runtime, name);
  setInstances(mesh, transforms);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.userData.cerebrumFullInstanceCount = transforms.length;
  mesh.userData.cerebrumLowInstanceCount = Math.max(1, Math.round(transforms.length * lowFraction));
  mesh.userData.cerebrumMediumInstanceCount = Math.max(1, Math.round(transforms.length * mediumFraction));
  parent.add(mesh);
  runtime.instancedMeshes.push(mesh);
  return mesh;
}

function addLabelPlane(
  parent: THREE.Object3D,
  runtime: CerebrumLibraryRuntime,
  name: string,
  lines: readonly string[],
  size: [number, number],
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
  style: { background?: string; foreground?: string; border?: string; font?: string } = {},
) {
  const material = new THREE.MeshStandardMaterial({ map: createTextTexture(lines, style), roughness: 0.84, metalness: 0, side: THREE.DoubleSide });
  material.name = `${name} material`;
  const mesh = prepare(new THREE.Mesh(new THREE.PlaneGeometry(...size), material), runtime, name);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function addBarrier(runtime: CerebrumLibraryRuntime, start: [number, number, number], end: [number, number, number], radius = 0.052) {
  runtime.staticBarriers.push({ start, end, radius });
}

function syncCollisionGuide(runtime: CerebrumLibraryRuntime) {
  const activeDoorBarriers = Array.from(runtime.doors.values())
    .filter((door) => !runtime.state.doors[door.hotspotId])
    .map((door) => door.barrier);
  runtime.collisionGuide.userData.navBarrierSegments = [...runtime.staticBarriers, ...activeDoorBarriers];
  runtime.collisionGuide.userData.cerebrumBarrierCount = runtime.staticBarriers.length + activeDoorBarriers.length;
  runtime.root.userData.requiresNavigationRefresh = true;
}

function registerHotspot(
  runtime: CerebrumLibraryRuntime,
  parent: THREE.Object3D,
  hotspot: CerebrumLibraryHotspot,
  size: [number, number, number],
) {
  const proxy = prepare(new THREE.Mesh(new THREE.BoxGeometry(...size), runtime.materials.hotspot), runtime, `CEREBRUM__HOTSPOT__${hotspot.id.toUpperCase()}`);
  proxy.position.set(...hotspot.localPosition);
  proxy.userData.cerebrumHotspot = { ...hotspot };
  proxy.userData.cerebrumHotspotId = hotspot.id;
  proxy.userData.cerebrumAction = hotspot.action;
  proxy.userData.interactive = true;
  proxy.renderOrder = 100;
  parent.add(proxy);
  runtime.hotspots.set(hotspot.id, hotspot);
  runtime.hotspotMeshes.set(hotspot.id, proxy);
  return proxy;
}

function findRuntime(object: THREE.Object3D) {
  let cursor: THREE.Object3D | null = object;
  while (cursor) {
    const runtime = libraryRuntimes.get(cursor);
    if (runtime) return runtime;
    cursor = cursor.parent;
  }
  const nested = object.getObjectByName(CEREBRUM_LIBRARY_ROOT_NAME);
  return nested ? libraryRuntimes.get(nested) : undefined;
}

function createRuntime(host: THREE.Group, options: CerebrumLibraryBuildOptions) {
  const existing = host.getObjectByName(CEREBRUM_LIBRARY_ROOT_NAME);
  if (existing) {
    const runtime = findRuntime(existing);
    if (runtime) return runtime;
    existing.removeFromParent();
  }

  const width = THREE.MathUtils.clamp(options.width ?? metres(112), metres(72), metres(128));
  const depth = THREE.MathUtils.clamp(options.depth ?? metres(78), metres(58), metres(92));
  const seed = options.seed ?? 1512;
  const selectableId = options.selectableId ?? String(host.userData.buildingId ?? host.userData.selectableId ?? 'cerebrum-externum');
  const root = new THREE.Group();
  root.name = CEREBRUM_LIBRARY_ROOT_NAME;
  const collisionGuide = new THREE.Object3D();
  const groundNavigation = new THREE.Group();
  const upperNavigation = new THREE.Group();
  const occultumNavigation = new THREE.Group();
  const mediumDetails = new THREE.Group();
  const highDetails = new THREE.Group();
  const cutaway = new THREE.Group();
  collisionGuide.name = 'CEREBRUM__PRECISE_DYNAMIC_COLLISION_GUIDE';
  groundNavigation.name = 'CEREBRUM__GROUND_NAVIGATION_SURFACES';
  upperNavigation.name = 'CEREBRUM__UPPER_GALLERY_NAVIGATION_SURFACES';
  occultumNavigation.name = 'CEREBRUM_OCCULTUM__NAVIGATION_SURFACES';
  mediumDetails.name = 'CEREBRUM__MEDIUM_DETAIL';
  highDetails.name = 'CEREBRUM__HIGH_DETAIL';
  cutaway.name = 'CEREBRUM__CUTAWAY_CEILINGS_AND_ROOF';
  mediumDetails.userData.cerebrumDetailTier = 'medium';
  highDetails.userData.cerebrumDetailTier = 'high';
  cutaway.userData.cerebrumCutawayCeiling = true;
  cutaway.userData.editorCutawayCeiling = true;
  cutaway.userData.exportAlways = true;
  root.add(collisionGuide, groundNavigation, upperNavigation, occultumNavigation, mediumDetails, highDetails, cutaway);

  const state: CerebrumLibraryState = {
    quality: options.quality ?? 'high',
    navigationLevel: 'ground',
    quietMode: options.quietMode ?? false,
    muted: options.muted ?? false,
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
  };
  const materials = createMaterials(seed);
  const runtime: CerebrumLibraryRuntime = {
    root,
    materials,
    selectableId,
    width,
    depth,
    seed,
    state,
    hotspots: new Map(),
    hotspotMeshes: new Map(),
    doors: new Map(),
    drawers: new Map(),
    lamps: new Map(),
    bookCards: new Map(),
    staticBarriers: [],
    collisionGuide,
    groundNavigation,
    upperNavigation,
    occultumNavigation,
    mediumDetails,
    highDetails,
    cutaway,
    dust: [],
    pointLights: [],
    instancedMeshes: [],
    audioMarkers: [],
    elapsed: 0,
    nextClockTick: 1,
    nextPageTurn: 7.5,
    currentFootstepSurface: 'stone',
    exteriorCutawayTargets: new Map(),
  };
  root.userData = {
    selectableId,
    buildingId: selectableId,
    editorWorkspace: 'interior',
    entityKind: 'cerebrum-library-interior',
    cerebrumLibrary: true,
    cerebrumLibraryVersion: 1,
    semanticName: 'Cerebrum Externum',
    undergroundName: CEREBRUM_OCCULTUM_NAME,
    scaleConvention: '0.1 world unit = 1 metre',
    footprint: [width, depth],
    dimensionsMetres: { width: width / 0.1, depth: depth / 0.1, groundHeight: 13.2, undergroundDepth: 7.2 },
    connectedRooms: ROOM_DEFINITIONS.map((room) => ({ ...room })),
    materialPalette: {
      stone: '#888176', paleStone: '#a79f92', dampStone: '#484943', oak: '#b48a68',
      darkOak: '#755744', brass: '#a77e35', lampGreen: '#214837', warmAmber: '#ff851c', coldGlass: '#9caeb3',
    },
    editable: true,
    exportable: true,
    exportAlways: true,
    collisionEnabled: true,
    cutawaySide: 'front-positive-z',
    requiresNavigationRefresh: true,
    performancePlan: {
      instanced: ['books', 'shelves', 'lamp fittings', 'window segments', 'chairs', 'catalogue drawers'],
      simplifiedDistantShelfContents: true,
      shadowCastingLightLimit: 0,
      qualities: ['low', 'medium', 'high'],
    },
    recommendedPostProcessing: { bloom: 'restrained', ambientOcclusion: 'restrained' },
    acousticPlan: ['rain against windows', 'distant page turns', 'quiet room tone', 'occasional clock tick', 'surface-aware footsteps'],
  };
  libraryRuntimes.set(root, runtime);
  host.add(root);

  if (options.hideLegacyShell !== false) {
    host.children.forEach((child) => {
      if (child === root) return;
      child.traverse((legacy) => {
        const genericShellPart = legacy.name.startsWith('INTERIOR_SHELL__');
        const sealingLegacyFloor = legacy.name.endsWith('__WALKABLE_FLOOR');
        if (!genericShellPart && !sealingLegacyFloor) return;
        legacy.userData.cerebrumLegacyVisible = legacy.visible;
        if (sealingLegacyFloor) {
          legacy.userData.cerebrumLegacyWalkable = legacy.userData.walkable === true;
          legacy.userData.walkable = false;
        }
        // Keep the authored exterior walls and roof. Only generic editor-shell
        // parts and the old full floor (which seals the archive stairwell) hide.
        legacy.visible = false;
      });
    });
  }
  const exteriorCutawayPattern = /MASONRY_WALL|STEEP_SLATE_GABLE|LIMESTONE_STRING_COURSE|OPEN_STONE_DOOR_ARCH|OPEN_OAK_DOOR|LEADED_AMBER_WINDOWS|GOTHIC_BUTTRESSES|BRICK_CHIMNEYS|COLLEGIATE_TOWER|TOWER_SLATE_CAP|ASHCROFT_REFERENCE_GOTHIC_FACADE/;
  host.children.forEach((child) => {
    if (child !== root && exteriorCutawayPattern.test(child.name)) runtime.exteriorCutawayTargets.set(child, child.visible);
  });
  host.userData.roomWidth = width;
  host.userData.roomDepth = depth;
  host.userData.roomHeight = metres(13.2);
  host.userData.cerebrumLibraryAuthored = true;
  return runtime;
}

function addWall(
  runtime: CerebrumLibraryRuntime,
  name: string,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
  parent: THREE.Object3D = runtime.root,
) {
  const wall = addBox(parent, runtime, name, size, material, position);
  const [width, height, depth] = size;
  const [x, y, z] = position;
  const bottom = y - height * 0.5;
  const top = y + height * 0.5;
  if (width >= depth) {
    addBarrier(runtime, [x - width * 0.5, bottom, z], [x + width * 0.5, top, z], Math.max(0.012, depth * 0.5));
  } else {
    addBarrier(runtime, [x, bottom, z - depth * 0.5], [x, top, z + depth * 0.5], Math.max(0.012, width * 0.5));
  }
  wall.userData.cerebrumPreciseWallBarrier = true;
  return wall;
}

function addDoor(
  runtime: CerebrumLibraryRuntime,
  options: {
    id: string;
    label: string;
    roomId: CerebrumLibraryRoomId;
    position: [number, number, number];
    width?: number;
    height?: number;
    yaw?: number;
    openAngle?: number;
    material?: THREE.Material;
    title?: string;
    description?: string;
  },
) {
  const width = options.width ?? metres(1.5);
  const height = options.height ?? metres(2.8);
  const yaw = options.yaw ?? 0;
  const pivot = prepare(new THREE.Group(), runtime, `CEREBRUM__DOOR_PIVOT__${options.id.toUpperCase()}`);
  pivot.position.set(...options.position);
  pivot.rotation.y = yaw;
  const leaf = addBox(pivot, runtime, `CEREBRUM__DOOR_LEAF__${options.id.toUpperCase()}`, [width, height, 0.025], options.material ?? runtime.materials.darkOak, [width * 0.5, height * 0.5, 0]);
  leaf.userData.cerebrumInteractiveDoor = options.id;
  for (const x of [width * 0.16, width * 0.5, width * 0.84]) {
    addBox(pivot, runtime, `CEREBRUM__DOOR_CARVED_RAIL__${options.id.toUpperCase()}`, [0.012, height * 0.84, 0.03], runtime.materials.oak, [x, height * 0.5, 0.004]);
  }
  const knob = addCylinder(pivot, runtime, `CEREBRUM__DOOR_BRASS_HANDLE__${options.id.toUpperCase()}`, 0.006, 0.025, runtime.materials.brass, [width * 0.84, height * 0.48, 0.025], 10);
  knob.rotation.x = Math.PI * 0.5;
  runtime.root.add(pivot);
  runtime.state.doors[options.id] = false;
  const tangent = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)).multiplyScalar(width);
  const start = new THREE.Vector3(...options.position);
  // Navigation barriers use the endpoints' Y values as their vertical span
  // while projecting the same endpoints into XZ for the blocking segment.
  // Give the dynamic leaf its full physical height so a closed door cannot be
  // bypassed by jumping, and so the Occultum gate still intersects a walker on
  // the sloped stair that crosses above the basement floor.
  const end = start.clone().add(tangent);
  end.y += height;
  runtime.doors.set(options.id, {
    pivot,
    hotspotId: options.id,
    closedAngle: yaw,
    openAngle: options.openAngle ?? -Math.PI * 0.54,
    barrier: { start: start.toArray(), end: end.toArray(), radius: 0.045 },
  });
  registerHotspot(runtime, runtime.root, {
    id: options.id,
    kind: 'door',
    action: 'toggle-door',
    label: options.label,
    roomId: options.roomId,
    localPosition: [options.position[0] + tangent.x * 0.5, options.position[1] + height * 0.5, options.position[2] + tangent.z * 0.5],
    radius: Math.max(width, height) * 0.7,
    title: options.title,
    description: options.description,
  }, [width, height, 0.25]);
  return pivot;
}

function addPointLight(
  runtime: CerebrumLibraryRuntime,
  name: string,
  position: [number, number, number],
  intensity: number,
  distance: number,
  color = '#ffad55',
) {
  const authoredIntensity = intensity * 1.35;
  const light = prepare(new THREE.PointLight(color, authoredIntensity, distance, 1.6), runtime, name);
  light.position.set(...position);
  light.castShadow = false;
  light.userData.cerebrumOriginalIntensity = authoredIntensity;
  runtime.root.add(light);
  runtime.pointLights.push(light);
  return light;
}

function addAudioMarker(runtime: CerebrumLibraryRuntime, id: string, roomId: CerebrumLibraryRoomId, position: [number, number, number], description: string) {
  const marker = prepare(new THREE.Object3D(), runtime, `CEREBRUM__AUDIO_SOURCE__${id.toUpperCase()}`);
  marker.position.set(...position);
  marker.userData.cerebrumAudioSource = { id, roomId, description, procedural: true };
  runtime.root.add(marker);
  runtime.audioMarkers.push(marker);
  return marker;
}

function addDust(runtime: CerebrumLibraryRuntime, parent: THREE.Object3D, name: string, center: THREE.Vector3, extent: THREE.Vector3, count: number, seed: number) {
  const random = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = center.x + (random() - 0.5) * extent.x;
    positions[index * 3 + 1] = center.y + (random() - 0.5) * extent.y;
    positions[index * 3 + 2] = center.z + (random() - 0.5) * extent.z;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = prepare(new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#e6d3a8', size: 0.006, transparent: true, opacity: 0.22, depthWrite: false })), runtime, name);
  points.userData.cerebrumDust = true;
  parent.add(points);
  runtime.dust.push(points);
  return points;
}

function addLampHotspot(
  runtime: CerebrumLibraryRuntime,
  parent: THREE.Object3D,
  id: string,
  position: [number, number, number],
  roomId: CerebrumLibraryRoomId,
) {
  const glowMaterial = runtime.materials.amber.clone() as THREE.MeshStandardMaterial;
  glowMaterial.name = `Cerebrum individually switched lamp ${id}`;
  const glow = prepare(new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 7), glowMaterial), runtime, `CEREBRUM__INDIVIDUAL_LAMP_GLOW__${id.toUpperCase()}`);
  glow.position.set(...position);
  parent.add(glow);
  // A soft additive pool makes the switch visibly affect the tabletop without
  // increasing the global light count (important in the much larger island).
  const poolMaterial = new THREE.MeshBasicMaterial({
    name: `Cerebrum switched lamp pool ${id}`,
    color: '#ff9f45',
    transparent: true,
    opacity: 0.105,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const pool = prepare(
    new THREE.Mesh(new THREE.CircleGeometry(0.085, 20), poolMaterial),
    runtime,
    `CEREBRUM__INDIVIDUAL_LAMP_POOL__${id.toUpperCase()}`,
  );
  pool.position.set(position[0], position[1] - 0.057, position[2]);
  pool.rotation.x = -Math.PI * 0.5;
  pool.renderOrder = 3;
  parent.add(pool);
  const hotspot: CerebrumLibraryHotspot = {
    id,
    kind: 'table-lamp',
    action: 'toggle-lamp',
    label: 'Switch table lamp',
    roomId,
    localPosition: position,
    radius: 0.11,
  };
  for (const visiblePart of [glow, pool]) {
    visiblePart.userData.cerebrumHotspot = { ...hotspot };
    visiblePart.userData.cerebrumHotspotId = id;
    visiblePart.userData.cerebrumAction = hotspot.action;
    visiblePart.userData.interactive = true;
  }
  runtime.state.lamps[id] = true;
  runtime.lamps.set(id, { glow, pool, hotspotId: id });
  registerHotspot(runtime, parent, hotspot, [0.14, 0.12, 0.14]);
}

function addBookHotspot(
  runtime: CerebrumLibraryRuntime,
  parent: THREE.Object3D,
  id: string,
  position: [number, number, number],
  roomId: CerebrumLibraryRoomId,
  card: { title: string; subtitle: string; body: string },
) {
  const book = addBox(parent, runtime, `CEREBRUM__INSPECTABLE_BOOK__${id.toUpperCase()}`, [0.026, 0.005, 0.038], runtime.materials.leather, position);
  book.rotation.y = (id.length % 5 - 2) * 0.08;
  book.userData.cerebrumBookId = id;
  runtime.bookCards.set(id, card);
  registerHotspot(runtime, parent, {
    id,
    kind: 'book',
    action: 'inspect-book',
    label: `Inspect ${card.title}`,
    roomId,
    localPosition: position,
    radius: 0.09,
    title: card.title,
    description: card.body,
  }, [0.08, 0.07, 0.09]);
}

function addOuterShell(runtime: CerebrumLibraryRuntime) {
  const materials = runtime.materials;
  const width = runtime.width;
  const depth = runtime.depth;
  const halfW = width * 0.5;
  const halfD = depth * 0.5;
  const wall = 0.13;
  const groundHeight = metres(13.2);

  const visualFloor = new THREE.Group();
  visualFloor.name = 'CEREBRUM__GROUND_VISUAL_FLOOR';
  visualFloor.userData.cerebrumGroundOccludingSurface = true;
  runtime.root.add(visualFloor);
  addBox(visualFloor, runtime, 'CEREBRUM__WORN_STONE_GROUND_FLOOR_LEFT', [width * 0.76, 0.035, depth - wall * 2], materials.stone, [-width * 0.12, -0.018, 0], { surface: 'stone' });
  addBox(visualFloor, runtime, 'CEREBRUM__WORN_STONE_GROUND_FLOOR_RIGHT_FRONT', [width * 0.24 - wall, 0.035, depth * 0.69], materials.stone, [width * 0.38, -0.018, depth * 0.155], { surface: 'stone' });
  addBox(visualFloor, runtime, 'CEREBRUM__WORN_STONE_GROUND_FLOOR_RIGHT_REAR_EDGE', [width * 0.07, 0.035, depth * 0.29], materials.stone, [width * 0.465, -0.018, -depth * 0.345], { surface: 'stone' });
  addBox(visualFloor, runtime, 'CEREBRUM__READING_ROOM_WOOD_INSET', [width * 0.58, 0.014, depth * 0.57], materials.oak, [-width * 0.19, 0.008, -depth * 0.08], { surface: 'wood' });

  addWall(runtime, 'CEREBRUM__OUTER_WALL_LEFT', [wall, groundHeight, depth], [-halfW, groundHeight * 0.5, 0], materials.paleStone);
  addWall(runtime, 'CEREBRUM__OUTER_WALL_RIGHT', [wall, groundHeight, depth], [halfW, groundHeight * 0.5, 0], materials.paleStone);
  addWall(runtime, 'CEREBRUM__OUTER_WALL_REAR', [width, groundHeight, wall], [0, groundHeight * 0.5, -halfD], materials.paleStone);
  const entranceWidth = metres(4.4);
  const frontSide = (width - entranceWidth) * 0.5;
  addWall(runtime, 'CEREBRUM__OUTER_WALL_FRONT_LEFT', [frontSide, groundHeight, wall], [-(entranceWidth + frontSide) * 0.5, groundHeight * 0.5, halfD], materials.paleStone);
  addWall(runtime, 'CEREBRUM__OUTER_WALL_FRONT_RIGHT', [frontSide, groundHeight, wall], [(entranceWidth + frontSide) * 0.5, groundHeight * 0.5, halfD], materials.paleStone);
  addWall(runtime, 'CEREBRUM__OUTER_WALL_FRONT_HEADER', [entranceWidth, groundHeight - metres(4.2), wall], [0, metres(4.2) + (groundHeight - metres(4.2)) * 0.5, halfD], materials.paleStone);

  // Dedicated invisible raycast floors let the height-aware walk controller
  // resolve overlapping ground, gallery and archive surfaces without changing visuals.
  addNavigationFloor(runtime.groundNavigation, runtime, 'CEREBRUM__GROUND_NAV_LEFT', [width * 0.76, depth - wall * 2], [-width * 0.12, 0.012, 0]);
  addNavigationFloor(runtime.groundNavigation, runtime, 'CEREBRUM__GROUND_NAV_RIGHT_FRONT', [width * 0.24 - wall, depth * 0.69], [width * 0.38, 0.012, depth * 0.155]);
  addNavigationFloor(runtime.groundNavigation, runtime, 'CEREBRUM__GROUND_NAV_RIGHT_REAR_EDGE', [width * 0.07, depth * 0.29], [width * 0.465, 0.012, -depth * 0.345]);

  addBox(runtime.cutaway, runtime, 'CEREBRUM__CUTAWAY_STONE_CEILING', [width, 0.12, depth], materials.dampStone, [0, groundHeight + 0.06, 0], { cutaway: true });
  for (let index = 0; index < 13; index += 1) {
    const x = THREE.MathUtils.lerp(-halfW * 0.92, halfW * 0.92, index / 12);
    addBox(runtime.cutaway, runtime, 'CEREBRUM__CUTAWAY_HAMMERBEAM_ROOF_RIB', [0.09, 0.18, depth * 0.94], materials.darkOak, [x, groundHeight - 0.03, 0], { cutaway: true });
  }
  runtime.cutaway.visible = false;
}

function buildEntranceVestibule(runtime: CerebrumLibraryRuntime) {
  const materials = runtime.materials;
  const halfD = runtime.depth * 0.5;
  const frontZ = halfD - 0.14;
  const innerZ = halfD - 1.28;
  const room = new THREE.Group();
  room.name = 'CEREBRUM__ROOM__ENTRANCE_VESTIBULE';
  room.userData.cerebrumRoomId = 'entrance-vestibule';
  runtime.root.add(room);

  for (const x of [-1.46, 1.46]) {
    addWall(runtime, `CEREBRUM__VESTIBULE_SIDE_WALL_${x < 0 ? 'WEST' : 'EAST'}`, [0.1, 0.72, frontZ - innerZ], [x, 0.36, (frontZ + innerZ) * 0.5], materials.paleStone, room);
  }
  const doorWidth = metres(2.2);
  const sideWidth = (2.92 - doorWidth) * 0.5;
  addWall(runtime, 'CEREBRUM__VESTIBULE_INNER_WALL_WEST', [sideWidth, 0.72, 0.11], [-(doorWidth + sideWidth) * 0.5, 0.36, innerZ], materials.paleStone, room);
  addWall(runtime, 'CEREBRUM__VESTIBULE_INNER_WALL_EAST', [sideWidth, 0.72, 0.11], [(doorWidth + sideWidth) * 0.5, 0.36, innerZ], materials.paleStone, room);
  addWall(runtime, 'CEREBRUM__VESTIBULE_INNER_HEADER', [doorWidth, 0.34, 0.11], [0, 0.55, innerZ], materials.paleStone, room);
  addDoor(runtime, {
    id: 'vestibule-inner-door', label: 'Open the inner vestibule door', roomId: 'entrance-vestibule',
    position: [-doorWidth * 0.5, 0.012, innerZ + 0.025], width: doorWidth, height: metres(2.8),
    title: 'Inner Vestibule Door', description: 'A heavy oak leaf polished by generations of wet sleeves and book bags.',
  });

  // The exterior double leaves are visibly open but remain selectable.
  for (const side of [-1, 1]) {
    const leaf = addBox(room, runtime, 'CEREBRUM__OPEN_EXTERIOR_OAK_DOOR', [0.085, 0.28, 0.025], materials.darkOak, [side * 0.1, 0.14, frontZ + 0.02]);
    leaf.rotation.y = side * 1.1;
  }

  // Ribbed stone vault: five pointed transverse ribs and two longitudinal ribs.
  for (let index = 0; index < 5; index += 1) {
    const z = THREE.MathUtils.lerp(innerZ + 0.1, frontZ - 0.08, index / 4);
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-1.34, 0.54, z), new THREE.Vector3(0, 1.02, z), new THREE.Vector3(1.34, 0.54, z));
    const rib = prepare(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.035, 7, false), materials.paleStone), runtime, 'CEREBRUM__VESTIBULE_RIBBED_VAULT');
    rib.userData.editorCutawayCeiling = true;
    rib.userData.cerebrumCutawayCeiling = true;
    runtime.cutaway.add(rib);
  }
  for (const x of [-0.68, 0.68]) {
    addBox(runtime.cutaway, runtime, 'CEREBRUM__VESTIBULE_LONGITUDINAL_VAULT_RIB', [0.045, 0.055, frontZ - innerZ], materials.paleStone, [x, 0.78, (frontZ + innerZ) * 0.5], { cutaway: true });
  }

  // Seal set into the stone floor.
  const seal = addCylinder(room, runtime, 'CEREBRUM__UNIVERSITY_SEAL_FLOOR_INLAY', 0.18, 0.006, materials.brass, [0, 0.012, halfD - 0.64], 36);
  seal.userData.surfaceKind = 'stone';
  const sealInset = addCylinder(room, runtime, 'CEREBRUM__UNIVERSITY_SEAL_BLUE_STONE', 0.14, 0.007, materials.mutedRug, [0, 0.016, halfD - 0.64], 36);
  sealInset.userData.universitySeal = 'Cerebrum Externum · Lux Mentis · MDXII';
  const sealCrossA = addBox(room, runtime, 'CEREBRUM__UNIVERSITY_SEAL_OPEN_BOOK', [0.12, 0.003, 0.05], materials.parchment, [0, 0.021, halfD - 0.64]);
  sealCrossA.rotation.y = 0.08;

  // Porter's desk, log book, desk lamp and decades of polished wear.
  addBox(room, runtime, 'CEREBRUM__PORTERS_DESK', [0.18, 0.075, 0.07], materials.oak, [-0.72, 0.0375, halfD - 0.86], { obstacle: true });
  addBox(room, runtime, 'CEREBRUM__PORTERS_DESK_LEATHER_TOP', [0.17, 0.008, 0.065], materials.leather, [-0.72, 0.079, halfD - 0.86]);
  addBox(runtime.highDetails, runtime, 'CEREBRUM__PORTERS_SIGN_IN_SHEET_BRASS', [0.055, 0.022, 0.006], materials.brass, [-0.72, 0.095, halfD - 0.82]);
  addBox(runtime.highDetails, runtime, 'CEREBRUM__PORTERS_DAILY_LOG', [0.035, 0.004, 0.025], materials.paper, [-0.67, 0.085, halfD - 0.86]);

  addLabelPlane(room, runtime, 'CEREBRUM__VESTIBULE_DIRECTIONAL_SIGN', [
    'READING ROOM  ←', 'CARD CATALOGUE  →', 'CEREBRUM OCCULTUM  ↓',
  ], [0.22, 0.13], [1.31, 0.2, halfD - 0.72], [0, -Math.PI * 0.5, 0], { background: '#28231b', foreground: '#d7bd78', border: '#9d7838', font: '600 43px Georgia, serif' });

  // Wet umbrella rack with an irregular set of umbrellas.
  const rack = addCylinder(room, runtime, 'CEREBRUM__WET_UMBRELLA_RACK', 0.055, 0.07, materials.iron, [1.12, 0.035, halfD - 0.28], 18);
  rack.userData.navObstacle = true;
  const umbrellaTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3; rotation: THREE.Euler }> = [];
  for (let index = 0; index < 9; index += 1) {
    const angle = (index / 9) * Math.PI * 2;
    umbrellaTransforms.push({
      position: new THREE.Vector3(1.12 + Math.cos(angle) * 0.032, 0.075, halfD - 0.28 + Math.sin(angle) * 0.032),
      scale: new THREE.Vector3(0.004, 0.11 + (index % 3) * 0.007, 0.004),
      rotation: new THREE.Euler((index % 2 ? 1 : -1) * 0.08, angle, 0),
    });
  }
  addInstanced(room, runtime, 'CEREBRUM__WET_UMBRELLAS', new THREE.CylinderGeometry(1, 1, 1, 7), materials.iron, umbrellaTransforms, 0.55, 0.78);

  // Notice board and overlapping lecture sheets.
  addBox(room, runtime, 'CEREBRUM__LECTURES_AND_READING_GROUP_NOTICE_BOARD', [0.22, 0.14, 0.025], materials.darkOak, [-1.4, 0.18, halfD - 0.5]);
  const notices = [
    ['LECTURE', 'Memory & Measure'], ['READING GROUP', 'The Republic · Tue'], ['SEMINAR', 'Margins & Machines'], ['NOTICE', 'Silence after 20:00'],
  ];
  notices.forEach((lines, index) => {
    const paper = addLabelPlane(runtime.highDetails, runtime, `CEREBRUM__NOTICE_${index + 1}`, lines, [0.06, 0.045], [-1.385, 0.15 + (index % 2) * 0.055, halfD - 0.57 + Math.floor(index / 2) * 0.07], [0, Math.PI * 0.5, (index - 1.5) * 0.035], { background: index % 2 ? '#d5ccb1' : '#ece4ce', foreground: '#34291f', border: '#7f6a4e', font: '600 40px Georgia, serif' });
    paper.userData.noticeCategory = lines[0];
  });

  addPointLight(runtime, 'CEREBRUM__VESTIBULE_BRASS_LAMP_POOL', [0, 0.74, halfD - 0.73], 0.72, 3.2);
  addAudioMarker(runtime, 'rain-at-entrance-windows', 'entrance-vestibule', [0, 0.56, halfD - 0.2], 'Rain tapping on the leaded glass beyond the open portal.');
  addBarrier(runtime, [-0.81, 0.04, halfD - 0.86], [-0.63, 0.04, halfD - 0.86], 0.045);
}

function buildGrandStairHall(runtime: CerebrumLibraryRuntime) {
  const materials = runtime.materials;
  const halfD = runtime.depth * 0.5;
  const room = new THREE.Group();
  room.name = 'CEREBRUM__ROOM__GRAND_STAIR_HALL';
  room.userData.cerebrumRoomId = 'grand-stair-hall';
  runtime.root.add(room);
  const stairFront = halfD - 1.56;
  const stepCount = 20;
  const stepDepth = 0.075;
  const stepRise = 0.034;
  const stairWidth = 0.8;
  for (let index = 0; index < stepCount; index += 1) {
    const tread = addBox(room, runtime, `CEREBRUM__GRAND_OAK_STAIR_TREAD_${index + 1}`, [stairWidth, 0.025 + index * stepRise, stepDepth + 0.012], materials.oak, [0, (0.025 + index * stepRise) * 0.5, stairFront - index * stepDepth], { walkable: true, surface: 'wood' });
    tread.userData.cerebrumStairLevel = index >= 9 ? 'upper-gallery' : 'ground';
  }
  addBox(room, runtime, 'CEREBRUM__GRAND_STAIR_CENTRAL_WORN_RUNNER', [0.34, 0.008, stepCount * stepDepth], materials.burgundyRug, [0, 0.029, stairFront - stepCount * stepDepth * 0.5], { surface: 'rug' }).rotation.x = -Math.atan2(stepRise * stepCount, stepDepth * stepCount);

  const balusterTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  for (const side of [-1, 1]) {
    for (let index = 0; index < stepCount; index += 1) {
      balusterTransforms.push({ position: new THREE.Vector3(side * stairWidth * 0.52, 0.08 + index * stepRise, stairFront - index * stepDepth), scale: new THREE.Vector3(0.012, 0.11, 0.012) });
    }
  }
  addInstanced(room, runtime, 'CEREBRUM__CARVED_STAIR_BALUSTERS', new THREE.CylinderGeometry(1, 1, 1, 8), materials.darkOak, balusterTransforms, 0.72, 1);
  for (const side of [-1, 1]) {
    const rail = addBox(room, runtime, 'CEREBRUM__CARVED_STAIR_HANDRAIL', [0.022, 0.02, stepCount * stepDepth * 1.03], materials.oak, [side * stairWidth * 0.52, 0.475, stairFront - stepCount * stepDepth * 0.5]);
    rail.rotation.x = -Math.atan2(stepRise * stepCount, stepDepth * stepCount);
  }

  // Capsule barriers follow the open stair sides at handrail height. The east
  // side stops three treads early so the upper-gallery turn remains traversable.
  const stairBarrierRadius = 0.03;
  const stairBarrierX = stairWidth * 0.52;
  const stairBarrierY = (index: number) => 0.025 + index * stepRise + 0.07;
  const stairBarrierZ = (index: number) => stairFront - index * stepDepth;
  addBarrier(runtime,
    [-stairBarrierX, stairBarrierY(0), stairBarrierZ(0) + stepDepth * 0.5],
    [-stairBarrierX, stairBarrierY(stepCount - 1), stairBarrierZ(stepCount - 1) - stepDepth * 0.5],
    stairBarrierRadius,
  );
  addBarrier(runtime,
    [stairBarrierX, stairBarrierY(0), stairBarrierZ(0) + stepDepth * 0.5],
    [stairBarrierX, stairBarrierY(stepCount - 4), stairBarrierZ(stepCount - 4)],
    stairBarrierRadius,
  );

  // A visible U-shaped upper gallery overlooking the double-height reading room.
  const galleryY = stepCount * stepRise + 0.018;
  const finalTreadTop = 0.025 + (stepCount - 1) * stepRise;
  const finalTreadZ = stairBarrierZ(stepCount - 1);
  const galleryTop = galleryY + 0.025;
  const transitionTop = (finalTreadTop + galleryTop) * 0.5;
  const eastGalleryInnerX = runtime.width * 0.08 - 0.24;
  const transitionMinX = stairWidth * 0.22;
  const transitionMaxX = eastGalleryInnerX + 0.02;
  const transitionCenterZ = finalTreadZ - stepDepth * 0.95;
  const transitionDepth = stepDepth * 1.6;
  addBox(room, runtime, 'CEREBRUM__GRAND_STAIR_GALLERY_TRANSITION_LANDING',
    [transitionMaxX - transitionMinX, transitionTop - finalTreadTop, transitionDepth],
    materials.oak,
    [(transitionMinX + transitionMaxX) * 0.5, finalTreadTop + (transitionTop - finalTreadTop) * 0.5, transitionCenterZ],
    { walkable: true, surface: 'wood' },
  ).userData.cerebrumStairLevel = 'upper-gallery';
  addBox(room, runtime, 'CEREBRUM__UPPER_GALLERY_REAR_WALK', [runtime.width * 0.58, 0.05, 0.5], materials.oak, [-runtime.width * 0.19, galleryY, -runtime.depth * 0.36], { surface: 'wood' });
  addBox(room, runtime, 'CEREBRUM__UPPER_GALLERY_WEST_WALK', [0.48, 0.05, runtime.depth * 0.58], materials.oak, [-runtime.width * 0.46, galleryY, -runtime.depth * 0.08], { surface: 'wood' });
  addBox(room, runtime, 'CEREBRUM__UPPER_GALLERY_EAST_WALK', [0.48, 0.05, runtime.depth * 0.58], materials.oak, [runtime.width * 0.08, galleryY, -runtime.depth * 0.08], { surface: 'wood' });
  addNavigationFloor(runtime.upperNavigation, runtime, 'CEREBRUM__UPPER_GALLERY_NAV_REAR', [runtime.width * 0.58, 0.5], [-runtime.width * 0.19, galleryY + 0.02, -runtime.depth * 0.36]);
  addNavigationFloor(runtime.upperNavigation, runtime, 'CEREBRUM__UPPER_GALLERY_NAV_WEST', [0.48, runtime.depth * 0.58], [-runtime.width * 0.46, galleryY + 0.02, -runtime.depth * 0.08]);
  addNavigationFloor(runtime.upperNavigation, runtime, 'CEREBRUM__UPPER_GALLERY_NAV_EAST', [0.48, runtime.depth * 0.58], [runtime.width * 0.08, galleryY + 0.02, -runtime.depth * 0.08]);
  runtime.upperNavigation.visible = false;

  // Guard the gallery's open inner edge, splitting the east run around the
  // stair landing so collision never seals the only upper-level entrance.
  const galleryBarrierY = galleryTop + 0.07;
  const rearGalleryInnerZ = -runtime.depth * 0.36 + 0.25;
  const galleryFrontZ = -runtime.depth * 0.08 + runtime.depth * 0.29;
  const westGalleryInnerX = -runtime.width * 0.46 + 0.24;
  const landingOpeningMinZ = transitionCenterZ - transitionDepth * 0.72;
  const landingOpeningMaxZ = transitionCenterZ + transitionDepth * 0.72;
  addBarrier(runtime, [westGalleryInnerX, galleryBarrierY, rearGalleryInnerZ], [eastGalleryInnerX, galleryBarrierY, rearGalleryInnerZ], stairBarrierRadius);
  addBarrier(runtime, [westGalleryInnerX, galleryBarrierY, rearGalleryInnerZ], [westGalleryInnerX, galleryBarrierY, galleryFrontZ], stairBarrierRadius);
  addBarrier(runtime, [eastGalleryInnerX, galleryBarrierY, rearGalleryInnerZ], [eastGalleryInnerX, galleryBarrierY, landingOpeningMinZ], stairBarrierRadius);
  addBarrier(runtime, [eastGalleryInnerX, galleryBarrierY, landingOpeningMaxZ], [eastGalleryInnerX, galleryBarrierY, galleryFrontZ], stairBarrierRadius);

  const galleryBalusters: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  for (let index = 0; index < 27; index += 1) {
    galleryBalusters.push({ position: new THREE.Vector3(THREE.MathUtils.lerp(-runtime.width * 0.44, runtime.width * 0.055, index / 26), galleryY + 0.06, -runtime.depth * 0.31), scale: new THREE.Vector3(0.01, 0.11, 0.01) });
  }
  addInstanced(room, runtime, 'CEREBRUM__UPPER_GALLERY_CARVED_BALUSTRADE', new THREE.CylinderGeometry(1, 1, 1, 7), materials.darkOak, galleryBalusters, 0.55, 0.82);

  // Stone arches and librarian portraits frame the stair.
  for (const x of [-1.42, 1.42]) {
    const arch = prepare(new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.075, 8, 24, Math.PI), materials.paleStone), runtime, 'CEREBRUM__GRAND_STAIR_STONE_ARCH');
    arch.position.set(x, 0.62, halfD - 1.48);
    room.add(arch);
  }
  const portraitNames = ['Eleanor Vale · 1508–1541', 'Thomas Ashcroft · 1682–1719', 'Dr. C. Okafor · 1934–1971', 'Miriam Holt · 1971–2006'];
  portraitNames.forEach((name, index) => {
    const side = index % 2 ? 1 : -1;
    addLabelPlane(room, runtime, 'CEREBRUM__PORTRAIT_OF_FORMER_LIBRARIAN', [name, 'Keeper of the Library'], [0.15, 0.22], [side * 1.51, 0.22, halfD - 1.42 - Math.floor(index / 2) * 0.32], [0, side < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, 0], { background: '#30261e', foreground: '#d2b58c', border: '#a27b3f', font: '600 42px Georgia, serif' });
  });

  const tallWindow = addBox(room, runtime, 'CEREBRUM__GRAND_STAIR_TALL_COLD_DAYLIGHT_WINDOW', [0.45, 0.92, 0.035], materials.coldGlass, [0, 0.62, halfD - 2.96]);
  tallWindow.userData.cerebrumColdDaylight = true;
  const coldWindowMaterial = materials.coldGlass.clone();
  coldWindowMaterial.name = 'Cerebrum cold daylight window glow';
  coldWindowMaterial.emissive.set('#8ca8af');
  coldWindowMaterial.emissiveIntensity = 0.22;
  tallWindow.material = coldWindowMaterial;
  for (const x of [-0.15, 0, 0.15]) addBox(room, runtime, 'CEREBRUM__GRAND_STAIR_WINDOW_MULLION', [0.018, 0.94, 0.045], materials.iron, [x, 0.62, halfD - 2.94]);
  const shaftMaterial = new THREE.MeshBasicMaterial({
    name: 'Cerebrum restrained cold daylight volume',
    color: '#b9cbd0',
    transparent: true,
    opacity: 0.045,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const daylightShaft = prepare(
    new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.82, 12, 1, true), shaftMaterial),
    runtime,
    'CEREBRUM__GRAND_STAIR_VISIBLE_COLD_DAYLIGHT_SHAFT',
  );
  daylightShaft.position.set(0, 0.36, halfD - 2.48);
  daylightShaft.rotation.x = -0.44;
  runtime.mediumDetails.add(daylightShaft);
  addPointLight(runtime, 'CEREBRUM__GRAND_STAIR_WARM_LIGHT_BELOW', [-0.95, 0.34, halfD - 1.65], 0.58, 3.1);
  addAudioMarker(runtime, 'grand-stair-clock', 'grand-stair-hall', [1.34, 0.78, halfD - 2.2], 'A restrained mechanical tick, audible only between page turns.');
}

function buildMainReadingRoom(runtime: CerebrumLibraryRuntime) {
  const materials = runtime.materials;
  const room = new THREE.Group();
  room.name = 'CEREBRUM__ROOM__MAIN_READING_ROOM';
  room.userData.cerebrumRoomId = 'main-reading-room';
  room.userData.doubleHeight = true;
  room.userData.visualRhythm = 'strict bays with measured irregularities in chairs, papers, shades, and bindings';
  runtime.root.add(room);
  const random = seededRandom(runtime.seed + 100);
  const minX = -runtime.width * 0.47;
  const maxX = runtime.width * 0.12;
  const minZ = -runtime.depth * 0.35;
  const maxZ = runtime.depth * 0.28;

  // Stone columns set the room's architectural rhythm.
  const columnTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  for (const x of [minX + 0.32, maxX - 0.24]) {
    for (let index = 0; index < 6; index += 1) {
      columnTransforms.push({ position: new THREE.Vector3(x, 0.45, THREE.MathUtils.lerp(minZ, maxZ, index / 5)), scale: new THREE.Vector3(0.12, 0.9, 0.12) });
    }
  }
  addInstanced(room, runtime, 'CEREBRUM__READING_ROOM_STONE_COLUMNS', new THREE.CylinderGeometry(1, 1, 1, 12), materials.paleStone, columnTransforms, 0.66, 1);

  // Human-scale four-metre tables repeat across the monumental hall. Their
  // small deterministic offsets keep the rhythm strict without looking cloned.
  const tablePositions: THREE.Vector3[] = [];
  const tableTopTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  const tableLegTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  const tableColumns = 12;
  const tableRows = 7;
  for (let column = 0; column < tableColumns; column += 1) {
    for (let row = 0; row < tableRows; row += 1) {
      const x = THREE.MathUtils.lerp(minX + 0.65, maxX - 0.65, column / (tableColumns - 1)) + (row % 2 ? 0.012 : -0.008);
      const z = THREE.MathUtils.lerp(minZ + 0.52, maxZ - 0.52, row / (tableRows - 1)) + ((column % 3) - 1) * 0.008;
      const width = 0.12 + ((column + row) % 3) * 0.004;
      const depth = 0.4 + ((column * 3 + row) % 4) * 0.006;
      tablePositions.push(new THREE.Vector3(x, 0.074, z));
      tableTopTransforms.push({ position: new THREE.Vector3(x, 0.074, z), scale: new THREE.Vector3(width, 0.008, depth) });
      for (const legX of [-0.04, 0.04]) {
        for (const legZ of [-0.15, 0.15]) tableLegTransforms.push({ position: new THREE.Vector3(x + legX, 0.035, z + legZ), scale: new THREE.Vector3(0.018, 0.07, 0.018) });
      }
      addBarrier(runtime, [x, 0.04, z - depth * 0.5], [x, 0.04, z + depth * 0.5], 0.075);
    }
  }
  addInstanced(room, runtime, 'CEREBRUM__LONG_OAK_READING_TABLES', new THREE.BoxGeometry(1, 1, 1), materials.oak, tableTopTransforms, 0.55, 0.82);
  addInstanced(room, runtime, 'CEREBRUM__READING_TABLE_TRESTLES', new THREE.BoxGeometry(1, 1, 1), materials.darkOak, tableLegTransforms, 0.42, 0.72);

  const chairSeatTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3; rotation: THREE.Euler }> = [];
  const chairBackTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3; rotation: THREE.Euler }> = [];
  tablePositions.forEach((table, tableIndex) => {
    for (const side of [-1, 1]) {
      for (let seat = 0; seat < 3; seat += 1) {
        const occupiedGap = (tableIndex * 7 + seat * 3 + (side > 0 ? 1 : 0)) % 19 === 0;
        if (occupiedGap) continue;
        const seatZ = table.z - 0.13 + seat * 0.13 + (random() - 0.5) * 0.008;
        const yaw = (random() - 0.5) * 0.08;
        chairSeatTransforms.push({ position: new THREE.Vector3(table.x + side * 0.105, 0.045, seatZ), scale: new THREE.Vector3(0.045, 0.008, 0.045), rotation: new THREE.Euler(0, yaw, 0) });
        chairBackTransforms.push({ position: new THREE.Vector3(table.x + side * 0.126, 0.073, seatZ), scale: new THREE.Vector3(0.008, 0.058, 0.045), rotation: new THREE.Euler(0, yaw, 0) });
      }
    }
  });
  addInstanced(room, runtime, 'CEREBRUM__OAK_READING_CHAIR_SEATS', new THREE.BoxGeometry(1, 1, 1), materials.darkOak, chairSeatTransforms, 0.55, 0.82);
  addInstanced(room, runtime, 'CEREBRUM__OAK_READING_CHAIR_BACKS', new THREE.BoxGeometry(1, 1, 1), materials.darkOak, chairBackTransforms, 0.55, 0.82);

  // Green-shaded brass lamps are instanced; six glows retain individual switches.
  const lampStemTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  const lampShadeTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  const lampPositions: Array<[number, number, number]> = [];
  tablePositions.forEach((table) => {
    for (const offset of [-0.12, 0.12]) {
      const z = table.z + offset;
      lampStemTransforms.push({ position: new THREE.Vector3(table.x, 0.105, z), scale: new THREE.Vector3(0.006, 0.06, 0.006) });
      lampShadeTransforms.push({ position: new THREE.Vector3(table.x, 0.137, z), scale: new THREE.Vector3(0.035, 0.022, 0.03) });
      lampPositions.push([table.x, 0.136, z]);
    }
  });
  addInstanced(room, runtime, 'CEREBRUM__BRASS_TABLE_LAMP_FITTINGS', new THREE.CylinderGeometry(1, 1, 1, 10), materials.brass, lampStemTransforms, 0.58, 0.8);
  addInstanced(room, runtime, 'CEREBRUM__GREEN_SHADED_TABLE_LAMPS', new THREE.CylinderGeometry(0.7, 1, 1, 12, 1, true), materials.greenShade, lampShadeTransforms, 0.58, 0.8);
  lampPositions.slice(0, 6).forEach((position, index) => addLampHotspot(runtime, room, `reading-lamp-${index + 1}`, position, 'main-reading-room'));

  // Tall leaded windows with cool grey daylight.
  const windowTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3; rotation: THREE.Euler }> = [];
  for (let index = 0; index < 7; index += 1) {
    windowTransforms.push({ position: new THREE.Vector3(-runtime.width * 0.494, 0.65, THREE.MathUtils.lerp(minZ, maxZ, index / 6)), scale: new THREE.Vector3(0.035, 0.92, 0.42), rotation: new THREE.Euler(0, 0, 0) });
  }
  addInstanced(room, runtime, 'CEREBRUM__TALL_LEADED_COOL_GREY_WINDOWS', new THREE.BoxGeometry(1, 1, 1), materials.coldGlass, windowTransforms, 0.72, 1);

  // Worn rugs soften the room without hiding its stone/wood floor.
  const rugs = [
    { x: minX + 1.1, z: -0.05, w: 0.62, d: 1.75, material: materials.burgundyRug },
    { x: minX + 3.25, z: 0.06, w: 0.58, d: 1.6, material: materials.mutedRug },
    { x: maxX - 0.55, z: -0.08, w: 0.54, d: 1.7, material: materials.burgundyRug },
  ];
  rugs.forEach((rug, index) => addBox(room, runtime, `CEREBRUM__WORN_READING_RUG_${index + 1}`, [rug.w, 0.003, rug.d], rug.material, [rug.x, 0.0175, rug.z], { walkable: true, surface: 'rug' }));

  // Wall and gallery shelving plus hundreds of differently coloured bindings.
  const shelfTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3; rotation: THREE.Euler }> = [];
  const shelfUprightTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3; rotation: THREE.Euler }> = [];
  const bookTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3; color: THREE.Color }> = [];
  const bindingPalette = ['#49312a', '#243d3a', '#5b4830', '#3e354c', '#62342b', '#263443', '#756139'];
  const shelfRuns = [
    { x0: minX + 0.45, x1: maxX - 0.45, z: minZ - 0.18, yaw: 0 },
    { x0: minX + 0.45, x1: maxX - 0.45, z: maxZ + 0.2, yaw: 0 },
  ];
  shelfRuns.forEach((run, runIndex) => {
    for (let bay = 0; bay < 12; bay += 1) {
      const x = THREE.MathUtils.lerp(run.x0, run.x1, bay / 11);
      for (let level = 0; level < 5; level += 1) shelfTransforms.push({ position: new THREE.Vector3(x, 0.045 + level * 0.072, run.z), scale: new THREE.Vector3(0.46, 0.01, 0.08), rotation: new THREE.Euler() });
      shelfUprightTransforms.push(
        { position: new THREE.Vector3(x - 0.225, 0.19, run.z), scale: new THREE.Vector3(0.015, 0.38, 0.08), rotation: new THREE.Euler() },
        { position: new THREE.Vector3(x + 0.225, 0.19, run.z), scale: new THREE.Vector3(0.015, 0.38, 0.08), rotation: new THREE.Euler() },
      );
      for (let level = 0; level < 4; level += 1) {
        for (let volume = 0; volume < 28; volume += 1) {
          const h = 0.022 + random() * 0.013;
          bookTransforms.push({
            position: new THREE.Vector3(x - 0.205 + volume * 0.015, 0.05 + level * 0.072 + h * 0.5, run.z + (runIndex ? -0.012 : 0.012)),
            scale: new THREE.Vector3(0.008 + random() * 0.004, h, 0.025 + random() * 0.005),
            color: new THREE.Color(bindingPalette[Math.floor(random() * bindingPalette.length)]),
          });
        }
      }
    }
  });
  addInstanced(room, runtime, 'CEREBRUM__READING_ROOM_INSTANCED_SHELVES', new THREE.BoxGeometry(1, 1, 1), materials.darkOak, shelfTransforms, 0.68, 0.88);
  addInstanced(room, runtime, 'CEREBRUM__READING_ROOM_INSTANCED_SHELF_UPRIGHTS', new THREE.BoxGeometry(1, 1, 1), materials.darkOak, shelfUprightTransforms, 0.68, 0.88);
  addInstanced(room, runtime, 'CEREBRUM__READING_ROOM_HUNDREDS_OF_BOOKS', new THREE.BoxGeometry(1, 1, 1), materials.book, bookTransforms, 0.28, 0.66);

  // Rolling ladder on the rear shelf.
  const ladder = prepare(new THREE.Group(), runtime, 'CEREBRUM__ROLLING_LIBRARY_LADDER');
  ladder.position.set(minX + 1.15, 0.02, minZ + 0.04);
  for (const side of [-1, 1]) addBox(ladder, runtime, 'CEREBRUM__ROLLING_LADDER_SIDE_RAIL', [0.012, 0.38, 0.012], materials.oak, [side * 0.05, 0.19, 0]);
  for (let index = 0; index < 8; index += 1) addBox(ladder, runtime, 'CEREBRUM__ROLLING_LADDER_RUNG', [0.1, 0.008, 0.012], materials.brass, [0, 0.045 + index * 0.045, 0]);
  for (const side of [-1, 1]) {
    const wheel = addCylinder(ladder, runtime, 'CEREBRUM__ROLLING_LADDER_WHEEL', 0.012, 0.008, materials.iron, [side * 0.05, 0.012, 0], 12);
    wheel.rotation.z = Math.PI * 0.5;
  }
  room.add(ladder);
  runtime.ladder = ladder;
  registerHotspot(runtime, ladder, {
    id: 'reading-room-rolling-ladder', kind: 'rolling-ladder', action: 'pull-ladder', label: 'Pull rolling ladder along shelf', roomId: 'main-reading-room',
    localPosition: [0, 0.2, 0], radius: 0.25,
  }, [0.16, 0.42, 0.14]);

  // Individual study carrels at the quieter western edge.
  for (let index = 0; index < 5; index += 1) {
    const z = THREE.MathUtils.lerp(minZ + 0.32, maxZ - 0.32, index / 4);
    addBox(room, runtime, 'CEREBRUM__INDIVIDUAL_STUDY_CARREL', [0.09, 0.075, 0.07], materials.darkOak, [minX + 0.42, 0.0375, z], { obstacle: true });
    addBox(room, runtime, 'CEREBRUM__CARREL_WRITING_SURFACE', [0.075, 0.008, 0.06], materials.oak, [minX + 0.42, 0.079, z]);
  }

  // Clocks and lived-in study objects.
  for (const position of [[minX + 0.95, 0.24, minZ + 0.02], [maxX - 0.45, 0.26, maxZ + 0.18]] as Array<[number, number, number]>) {
    const clock = addCylinder(room, runtime, 'CEREBRUM__READING_ROOM_CLOCK', 0.035, 0.012, materials.black, position, 24);
    clock.rotation.x = Math.PI * 0.5;
    clock.userData.clockTick = true;
  }
  tablePositions.forEach((table, tableIndex) => {
    if (tableIndex % 3 !== 0) return;
    for (let item = 0; item < 3; item += 1) {
      const x = table.x + (random() - 0.5) * 0.065;
      const z = table.z + (random() - 0.5) * 0.32;
      const isLaptop = item % 3 === 0;
      const object = addBox(runtime.highDetails, runtime, isLaptop ? 'CEREBRUM__CLOSED_STUDENT_LAPTOP' : item % 2 ? 'CEREBRUM__SCATTERED_NOTEBOOK' : 'CEREBRUM__SCATTERED_PAPER', [isLaptop ? 0.045 : 0.03, isLaptop ? 0.006 : 0.003, isLaptop ? 0.03 : 0.04], isLaptop ? materials.black : item % 2 ? materials.leather : materials.paper, [x, 0.078 + tableIndex * 0.000002, z], { detail: 'high' });
      object.rotation.y = (random() - 0.5) * 0.5;
    }
  });
  const pencilTransforms = tablePositions.filter((_, index) => index % 2 === 0).flatMap((table) => Array.from({ length: 2 }, (_, index) => ({
    position: new THREE.Vector3(table.x + (index - 0.5) * 0.025, 0.079, table.z + (random() - 0.5) * 0.28),
    scale: new THREE.Vector3(0.0015, 0.018, 0.0015), rotation: new THREE.Euler(Math.PI * 0.5, (random() - 0.5) * 1.4, 0),
  })));
  addInstanced(runtime.highDetails, runtime, 'CEREBRUM__SCATTERED_PENCILS', new THREE.CylinderGeometry(1, 1, 1, 6), materials.brass, pencilTransforms, 0.18, 0.6);

  // Hammer-beam ceiling silhouette remains available for non-cutaway presentations.
  for (let index = 0; index < 11; index += 1) {
    const z = THREE.MathUtils.lerp(minZ, maxZ, index / 10);
    addBox(runtime.cutaway, runtime, 'CEREBRUM__READING_ROOM_HAMMERBEAM', [maxX - minX, 0.085, 0.08], materials.darkOak, [(minX + maxX) * 0.5, 1.08 + (index % 2) * 0.035, z], { cutaway: true });
  }

  addBookHotspot(runtime, room, 'book-memory-and-measure', [tablePositions[0].x - 0.025, 0.079, tablePositions[0].z + 0.1], 'main-reading-room', {
    title: 'Memory and Measure', subtitle: 'Ada Mercer · 1897', body: 'A pencilled reader has compared mnemonic architecture to the shelving plan of Ashcroft before its renaming.',
  });
  addBookHotspot(runtime, room, 'book-atlas-of-quiet-machines', [tablePositions[4].x + 0.025, 0.079, tablePositions[4].z - 0.1], 'main-reading-room', {
    title: 'Atlas of Quiet Machines', subtitle: 'Ivo Sen · 1962', body: 'Measured drawings of calculating instruments, rebound in dark green cloth after a laboratory flood.',
  });
  addPointLight(runtime, 'CEREBRUM__READING_ROOM_AMBER_POOL_WEST', [minX + 1.75, 0.58, -0.15], 0.82, 3.8);
  addPointLight(runtime, 'CEREBRUM__READING_ROOM_AMBER_POOL_EAST', [maxX - 0.75, 0.58, -0.15], 0.76, 3.6);
  addAudioMarker(runtime, 'distant-page-turns', 'main-reading-room', [(minX + maxX) * 0.5, 0.28, -0.2], 'Sparse, irregular page turns from no single identifiable table.');
  addAudioMarker(runtime, 'quiet-reading-room-tone', 'main-reading-room', [(minX + maxX) * 0.5, 0.62, 0], 'Low room tone shaped by stone, timber and occupied cloth surfaces.');
}

function buildStacks(runtime: CerebrumLibraryRuntime) {
  const materials = runtime.materials;
  const room = new THREE.Group();
  room.name = 'CEREBRUM__ROOM__LABYRINTHINE_STACKS';
  room.userData.cerebrumRoomId = 'stacks';
  room.userData.atmosphere = 'orderly at the threshold, subtly disorienting after successive additions';
  room.userData.additionPeriods = [1582, 1731, 1888, 1956, 1997];
  runtime.root.add(room);
  const random = seededRandom(runtime.seed + 220);
  const minX = runtime.width * 0.16;
  const maxX = runtime.width * 0.47;
  const minZ = -runtime.depth * 0.34;
  const maxZ = runtime.depth * 0.27;

  const shelfTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3; rotation: THREE.Euler }> = [];
  const shelfUprightTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3; rotation: THREE.Euler }> = [];
  const books: Array<{ position: THREE.Vector3; scale: THREE.Vector3; rotation: THREE.Euler; color: THREE.Color }> = [];
  const palette = ['#46342c', '#34443b', '#6b5435', '#533132', '#2d394a', '#705f43', '#40364b'];
  const shelfRecords: Array<{ x: number; z: number; length: number; yaw: number; period: number }> = [];

  // Closely spaced historic runs create genuinely narrow 1.3-1.6 m aisles.
  // Their lengths and alignments drift by period, and one run is omitted to
  // preserve a legible landing around the Occultum stair aperture.
  const primaryRunCount = 15;
  const occultumStairX = runtime.width * 0.365;
  for (let aisle = 0; aisle < primaryRunCount; aisle += 1) {
    const x = THREE.MathUtils.lerp(minX + 0.22, maxX - 0.22, aisle / (primaryRunCount - 1));
    if (Math.abs(x - occultumStairX) < 0.17) continue;
    const laterAddition = aisle >= 9;
    shelfRecords.push({
      x,
      z: -0.15 + ((aisle * 7) % 5 - 2) * 0.022,
      length: 3.12 - (aisle % 4) * 0.075,
      yaw: laterAddition ? ((aisle % 3) - 1) * 0.018 : 0,
      period: aisle < 5 ? 1731 : aisle < 9 ? 1888 : 1956,
    });
  }
  shelfRecords.push(
    { x: maxX - 0.22, z: minZ + 0.48, length: 1.8, yaw: Math.PI * 0.5, period: 1956 },
    { x: maxX - 0.56, z: maxZ - 0.42, length: 1.5, yaw: Math.PI * 0.5, period: 1956 },
    { x: minX + 0.62, z: minZ + 0.26, length: 1.35, yaw: Math.PI * 0.5 + 0.035, period: 1997 },
    { x: minX + 1.4, z: maxZ - 0.17, length: 1.2, yaw: Math.PI * 0.5 - 0.045, period: 1997 },
  );

  shelfRecords.forEach((shelf, shelfIndex) => {
    const bays = Math.max(3, Math.round(shelf.length / 0.2));
    const along = new THREE.Vector3(Math.sin(shelf.yaw), 0, Math.cos(shelf.yaw));
    const across = new THREE.Vector3(Math.cos(shelf.yaw), 0, -Math.sin(shelf.yaw));
    for (let bay = 0; bay < bays; bay += 1) {
      const offset = THREE.MathUtils.lerp(-shelf.length * 0.5, shelf.length * 0.5, bays === 1 ? 0.5 : bay / (bays - 1));
      const center = new THREE.Vector3(shelf.x, 0, shelf.z).addScaledVector(along, offset);
      for (let level = 0; level < 5; level += 1) {
        shelfTransforms.push({ position: new THREE.Vector3(center.x, 0.045 + level * 0.072, center.z), scale: new THREE.Vector3(0.075, 0.01, 0.14), rotation: new THREE.Euler(0, shelf.yaw, 0) });
      }
      // Full-height cross frames make each run read as tall shelving from both
      // first person and the cutaway orbit, rather than as floating plank layers.
      shelfUprightTransforms.push({
        position: new THREE.Vector3(center.x, 0.19, center.z),
        scale: new THREE.Vector3(0.08, 0.38, 0.015),
        rotation: new THREE.Euler(0, shelf.yaw, 0),
      });
      for (const side of [-1, 1]) {
        for (let level = 0; level < 4; level += 1) {
          const volumesPerBay = 6;
          for (let volume = 0; volume < volumesPerBay; volume += 1) {
            const bookHeight = 0.021 + random() * 0.014;
            const volumeOffset = THREE.MathUtils.lerp(-0.055, 0.055, volume / (volumesPerBay - 1));
            const position = center.clone()
              .addScaledVector(along, volumeOffset)
              .addScaledVector(across, side * 0.022);
            position.y = 0.05 + level * 0.072 + bookHeight * 0.5;
            books.push({
              position,
              scale: new THREE.Vector3(0.007 + random() * 0.003, bookHeight, 0.023 + random() * 0.007),
              rotation: new THREE.Euler(0, shelf.yaw + Math.PI * 0.5, (random() - 0.5) * 0.045),
              color: new THREE.Color(palette[Math.floor(random() * palette.length)]),
            });
          }
        }
      }
    }
    const axis = new THREE.Vector3(Math.sin(shelf.yaw), 0, Math.cos(shelf.yaw)).multiplyScalar(shelf.length * 0.5);
    addBarrier(runtime,
      [shelf.x - axis.x, 0.09, shelf.z - axis.z],
      [shelf.x + axis.x, 0.09, shelf.z + axis.z],
      shelf.period >= 1956 ? 0.042 : 0.046,
    );
  });
  const shelves = addInstanced(room, runtime, 'CEREBRUM__STACKS_INSTANCED_TALL_SHELVING', new THREE.BoxGeometry(1, 1, 1), materials.oak, shelfTransforms, 0.72, 0.9);
  shelves.userData.cerebrumStructuralInstances = true;
  const uprights = addInstanced(room, runtime, 'CEREBRUM__STACKS_INSTANCED_FULL_HEIGHT_UPRIGHTS', new THREE.BoxGeometry(1, 1, 1), materials.darkOak, shelfUprightTransforms, 1, 1);
  uprights.userData.cerebrumStructuralInstances = true;
  addInstanced(room, runtime, 'CEREBRUM__STACKS_INSTANCED_BOOK_CONTENTS', new THREE.BoxGeometry(1, 1, 1), materials.book, books, 0.18, 0.54);

  const periodLabels = [
    { label: ['A–D', '1731 range'], x: minX + 0.32, z: maxZ + 0.02 },
    { label: ['E–H', '1888 range'], x: minX + 1.5, z: maxZ + 0.02 },
    { label: ['J–M', '1956 annex'], x: maxX - 0.22, z: minZ + 0.48 },
    { label: ['N–R', '1997 infill'], x: minX + 0.62, z: minZ + 0.26 },
  ];
  periodLabels.forEach((record, index) => addLabelPlane(runtime.mediumDetails, runtime, `CEREBRUM__STACKS_SHELF_LABEL_${index + 1}`, record.label, [0.1, 0.052], [record.x, 0.36, record.z], [0, index < 2 ? 0 : Math.PI * 0.5, 0], { background: '#ece0bd', foreground: '#2c241a', border: '#8c713c', font: '600 50px Georgia, serif' }));

  // Uneven repair plates and runners betray different construction periods.
  const floorTiles: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  const stairOpening = {
    minX: runtime.width * 0.365 - 0.14,
    maxX: runtime.width * 0.365 + 0.14,
    minZ: -runtime.depth * 0.46 + 0.1,
    maxZ: -runtime.depth * 0.17 + 0.1,
  };
  for (let xIndex = 0; xIndex < 7; xIndex += 1) {
    for (let zIndex = 0; zIndex < 10; zIndex += 1) {
      const x = THREE.MathUtils.lerp(minX, maxX, xIndex / 6);
      const z = THREE.MathUtils.lerp(minZ, maxZ, zIndex / 9);
      const overlapsOccultumStair = x + 0.225 > stairOpening.minX
        && x - 0.225 < stairOpening.maxX
        && z + 0.18 > stairOpening.minZ
        && z - 0.18 < stairOpening.maxZ;
      if (overlapsOccultumStair) continue;
      floorTiles.push({
        position: new THREE.Vector3(x, 0.0015 + ((xIndex * 5 + zIndex * 3) % 4) * 0.00035, z),
        scale: new THREE.Vector3(0.45, 0.003, 0.36),
      });
    }
  }
  addInstanced(room, runtime, 'CEREBRUM__STACKS_SLIGHTLY_UNEVEN_FLOOR_REPAIRS', new THREE.BoxGeometry(1, 1, 1), materials.stone, floorTiles, 0.42, 0.74);
  for (const position of [[minX + 0.76, 0.0225, minZ + 0.65], [maxX - 0.7, 0.0225, 0.2], [minX + 1.55, 0.0225, maxZ - 0.5]] as Array<[number, number, number]>) {
    addBox(room, runtime, 'CEREBRUM__STACKS_OAK_STEP_STOOL', [0.05, 0.045, 0.045], materials.oak, position, { obstacle: true });
  }

  // Emissive pools suggest many lamps while only one local PointLight is used.
  const poolTransforms = Array.from({ length: 11 }, (_, index) => ({
    position: new THREE.Vector3(THREE.MathUtils.lerp(minX + 0.15, maxX - 0.15, (index * 7 % 11) / 10), 0.42, THREE.MathUtils.lerp(minZ + 0.15, maxZ - 0.15, (index * 3 % 11) / 10)),
    scale: new THREE.Vector3(0.018, 0.02, 0.018),
  }));
  addInstanced(room, runtime, 'CEREBRUM__STACKS_SMALL_POOLS_OF_WARM_LIGHT', new THREE.SphereGeometry(1, 8, 6), materials.amber, poolTransforms, 0.45, 0.72);
  addPointLight(runtime, 'CEREBRUM__STACKS_SINGLE_BOUNDED_WARM_LIGHT', [maxX - 0.85, 0.56, -0.2], 0.43, 2.5);
  addAudioMarker(runtime, 'muffled-stack-room-tone', 'stacks', [(minX + maxX) * 0.5, 0.48, 0], 'A darker, cloth-damped continuation of the main reading-room ambience.');

  addBookHotspot(runtime, room, 'book-shelfmarks-of-the-north-range', [minX + 0.33, 0.278, maxZ - 0.05], 'stacks', {
    title: 'Shelfmarks of the North Range', subtitle: 'Library working copy · 1958', body: 'Its pasted corrections explain why G follows J in one narrow aisle and point toward the old catalogue room.',
  });
}

function buildCardCatalogueRoom(runtime: CerebrumLibraryRuntime) {
  const materials = runtime.materials;
  const room = new THREE.Group();
  room.name = 'CEREBRUM__ROOM__CARD_CATALOGUE';
  room.userData.cerebrumRoomId = 'card-catalogue-room';
  runtime.root.add(room);
  const minX = runtime.width * 0.16;
  const maxX = runtime.width * 0.47;
  const minZ = runtime.depth * 0.29;
  const maxZ = runtime.depth * 0.47;

  const cabinetPositions: THREE.Vector3[] = [];
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 12; column += 1) {
      cabinetPositions.push(new THREE.Vector3(THREE.MathUtils.lerp(minX + 0.28, maxX - 0.28, column / 11), 0.08, THREE.MathUtils.lerp(minZ + 0.2, maxZ - 0.22, row / 3)));
    }
  }
  cabinetPositions.forEach((position) => addBox(room, runtime, 'CEREBRUM__CARD_CATALOGUE_CABINET', [0.12, 0.16, 0.07], materials.oak, position.toArray() as [number, number, number], { obstacle: true }));
  const drawerFronts: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  cabinetPositions.forEach((cabinet) => {
    for (let row = 0; row < 6; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        drawerFronts.push({ position: new THREE.Vector3(cabinet.x - 0.042 + column * 0.028, 0.02 + row * 0.024, cabinet.z + 0.038), scale: new THREE.Vector3(0.024, 0.018, 0.006) });
      }
    }
  });
  addInstanced(room, runtime, 'CEREBRUM__ROWS_OF_SMALL_WOODEN_CATALOGUE_DRAWERS', new THREE.BoxGeometry(1, 1, 1), materials.darkOak, drawerFronts, 0.32, 0.68);

  // One real drawer is pulled independently from its instanced neighbours.
  const selectedCabinet = cabinetPositions[3];
  const selectedDrawer = addBox(room, runtime, 'CEREBRUM__INTERACTIVE_CATALOGUE_DRAWER_R7', [0.024, 0.018, 0.055], materials.darkOak, [selectedCabinet.x + 0.014, 0.092, selectedCabinet.z + 0.045]);
  runtime.state.drawers['catalogue-drawer-r7'] = false;
  runtime.drawers.set('catalogue-drawer-r7', {
    mesh: selectedDrawer,
    hotspotId: 'catalogue-drawer-r7',
    closedPosition: selectedDrawer.position.clone(),
    openOffset: new THREE.Vector3(0, 0, 0.035),
  });
  registerHotspot(runtime, room, {
    id: 'catalogue-drawer-r7', kind: 'drawer', action: 'toggle-drawer', label: 'Open catalogue drawer R–7', roomId: 'card-catalogue-room',
    localPosition: selectedDrawer.position.toArray(), radius: 0.18,
  }, [0.05, 0.04, 0.09]);

  addBox(room, runtime, 'CEREBRUM__CARD_CATALOGUE_REFERENCE_DESK', [0.22, 0.075, 0.09], materials.oak, [(minX + maxX) * 0.5, 0.0375, minZ - 0.2], { obstacle: true });
  const catalogueTables: Array<{ name: string; x: number }> = [
    { name: 'WEST', x: minX + 0.65 },
    { name: 'EAST', x: maxX - 0.65 },
  ];
  catalogueTables.forEach((table) => {
    addBox(room, runtime, `CEREBRUM__CARD_CATALOGUE_LARGE_TABLE_${table.name}`, [0.24, 0.008, 0.12], materials.oak, [table.x, 0.074, maxZ + 0.05], { obstacle: true });
    for (const xOffset of [-0.09, 0.09]) for (const zOffset of [-0.04, 0.04]) addBox(room, runtime, 'CEREBRUM__CARD_CATALOGUE_TABLE_LEG', [0.012, 0.07, 0.012], materials.darkOak, [table.x + xOffset, 0.035, maxZ + 0.05 + zOffset]);
  });

  const globeStand = addCylinder(room, runtime, 'CEREBRUM__REFERENCE_GLOBE_STAND', 0.01, 0.1, materials.brass, [maxX - 0.36, 0.05, minZ - 0.16], 12);
  globeStand.userData.navObstacle = true;
  const globe = prepare(new THREE.Mesh(new THREE.SphereGeometry(0.035, 18, 12), new THREE.MeshStandardMaterial({ color: '#49636a', roughness: 0.76 })), runtime, 'CEREBRUM__REFERENCE_GLOBE');
  globe.position.set(maxX - 0.36, 0.125, minZ - 0.16);
  globe.rotation.z = 0.24;
  room.add(globe);
  const globeRing = prepare(new THREE.Mesh(new THREE.TorusGeometry(0.041, 0.004, 7, 22), materials.brass), runtime, 'CEREBRUM__REFERENCE_GLOBE_MERIDIAN');
  globeRing.position.copy(globe.position);
  globeRing.rotation.y = 0.28;
  room.add(globeRing);

  for (const side of [-1, 1]) {
    const ladder = prepare(new THREE.Group(), runtime, 'CEREBRUM__CARD_CATALOGUE_FILING_LADDER');
    ladder.position.set(side < 0 ? minX + 0.24 : maxX - 0.24, 0.02, minZ + 0.12);
    for (const x of [-0.03, 0.03]) addBox(ladder, runtime, 'CEREBRUM__FILING_LADDER_RAIL', [0.006, 0.24, 0.006], materials.oak, [x, 0.12, 0]);
    for (let rung = 0; rung < 7; rung += 1) addBox(ladder, runtime, 'CEREBRUM__FILING_LADDER_RUNG', [0.06, 0.004, 0.006], materials.brass, [0, 0.025 + rung * 0.033, 0]);
    ladder.rotation.z = side * 0.09;
    room.add(ladder);
  }

  const maps = [
    ['MAP OF THE', 'OLD NORTH RANGE'], ['CATALOGUE PLAN', 'REVISED 1888'], ['CEREBRUM OCCULTUM', 'AUTHORIZED STAFF'],
  ];
  maps.forEach((lines, index) => addLabelPlane(room, runtime, `CEREBRUM__FRAMED_REFERENCE_MAP_${index + 1}`, lines, [0.15, 0.1], [THREE.MathUtils.lerp(minX + 0.45, maxX - 0.45, index / 2), 0.22, maxZ + 0.28], [0, Math.PI, 0], { background: '#cbbf9c', foreground: '#4a3827', border: '#614424', font: '600 44px Georgia, serif' }));

  registerHotspot(runtime, room, {
    id: 'card-catalogue-search', kind: 'card-catalogue', action: 'search-card-catalogue', label: 'Search for the fictional rare book', roomId: 'card-catalogue-room',
    localPosition: [(minX + maxX) * 0.5, 0.085, minZ - 0.15], radius: 0.28,
    title: 'Card Catalogue', description: 'Cross-indexed by author, subject, donor and former shelfmark.',
  }, [0.28, 0.12, 0.16]);
  addDust(runtime, runtime.mediumDetails, 'CEREBRUM__CARD_CATALOGUE_SOFT_DUST_PARTICLES', new THREE.Vector3((minX + maxX) * 0.5, 0.2, (minZ + maxZ) * 0.5), new THREE.Vector3(maxX - minX, 0.35, maxZ - minZ), 170, runtime.seed + 330);
}

function buildLibrarianOffice(runtime: CerebrumLibraryRuntime) {
  const materials = runtime.materials;
  const room = new THREE.Group();
  room.name = 'CEREBRUM__ROOM__LIBRARIANS_OFFICE';
  room.userData.cerebrumRoomId = 'librarian-office';
  room.userData.inhabitedForDecades = true;
  runtime.root.add(room);
  const minX = -runtime.width * 0.47;
  const maxX = -runtime.width * 0.16;
  const minZ = runtime.depth * 0.29;
  const maxZ = runtime.depth * 0.47;

  // Partition with an openable office door and a small interior window.
  const officeDoorWidth = 0.24;
  const officeDoorHingeX = -runtime.width * 0.28 - officeDoorWidth * 0.5;
  const westPartitionWidth = officeDoorHingeX - minX;
  const eastPartitionStart = officeDoorHingeX + officeDoorWidth;
  const eastPartitionWidth = maxX - eastPartitionStart;
  addWall(runtime, 'CEREBRUM__OFFICE_READING_ROOM_PARTITION_WEST', [westPartitionWidth, 0.82, 0.1], [minX + westPartitionWidth * 0.5, 0.41, minZ], materials.panel, room);
  addWall(runtime, 'CEREBRUM__OFFICE_READING_ROOM_PARTITION_EAST', [eastPartitionWidth, 0.82, 0.1], [eastPartitionStart + eastPartitionWidth * 0.5, 0.41, minZ], materials.panel, room);
  addDoor(runtime, {
    id: 'librarian-office-door', label: "Open the librarian's office", roomId: 'librarian-office',
    position: [officeDoorHingeX, 0.012, minZ], width: officeDoorWidth, height: 0.27,
    description: 'The frosted lower panel carries a small hand-painted PRIVATE sign.',
  });
  addBox(room, runtime, 'CEREBRUM__OFFICE_INTERIOR_WINDOW_OVER_READING_ROOM', [0.22, 0.12, 0.025], materials.coldGlass, [minX + 0.7, 0.21, minZ - 0.055]);
  for (const x of [minX + 0.63, minX + 0.7, minX + 0.77]) addBox(room, runtime, 'CEREBRUM__OFFICE_INTERIOR_WINDOW_MULLION', [0.008, 0.12, 0.03], materials.iron, [x, 0.21, minZ - 0.076]);

  // Crowded shelves with books, files, boxes and personal objects.
  const shelfTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  const shelfUprightTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  const officeBooks: Array<{ position: THREE.Vector3; scale: THREE.Vector3; color: THREE.Color }> = [];
  const random = seededRandom(runtime.seed + 470);
  const officeShelfBays = 25;
  for (let bay = 0; bay < officeShelfBays; bay += 1) {
    const x = THREE.MathUtils.lerp(minX + 0.16, maxX - 0.16, bay / (officeShelfBays - 1));
    shelfUprightTransforms.push({ position: new THREE.Vector3(x - 0.058, 0.185, maxZ + 0.22), scale: new THREE.Vector3(0.012, 0.37, 0.045) });
    for (let level = 0; level < 5; level += 1) {
      shelfTransforms.push({ position: new THREE.Vector3(x, 0.045 + level * 0.07, maxZ + 0.22), scale: new THREE.Vector3(0.12, 0.009, 0.045) });
      for (let book = 0; book < 12; book += 1) {
        const height = 0.02 + random() * 0.012;
        officeBooks.push({ position: new THREE.Vector3(x - 0.052 + book * 0.0095, 0.05 + level * 0.07 + height * 0.5, maxZ + 0.205), scale: new THREE.Vector3(0.006 + random() * 0.002, height, 0.025), color: new THREE.Color(['#4d3028', '#31463f', '#665334', '#3c3447'][Math.floor(random() * 4)]) });
      }
    }
  }
  addInstanced(room, runtime, 'CEREBRUM__OFFICE_CROWDED_SHELVES', new THREE.BoxGeometry(1, 1, 1), materials.darkOak, shelfTransforms, 0.66, 0.86);
  addInstanced(room, runtime, 'CEREBRUM__OFFICE_CROWDED_SHELF_UPRIGHTS', new THREE.BoxGeometry(1, 1, 1), materials.darkOak, shelfUprightTransforms, 0.66, 0.86);
  addInstanced(room, runtime, 'CEREBRUM__OFFICE_DECADES_OF_BOOKS_AND_FILES', new THREE.BoxGeometry(1, 1, 1), materials.book, officeBooks, 0.24, 0.62);

  // Fireplace and mantel with no exaggerated flame or supernatural treatment.
  addBox(room, runtime, 'CEREBRUM__OFFICE_STONE_FIREPLACE', [0.25, 0.22, 0.08], materials.paleStone, [minX + 0.55, 0.11, maxZ - 0.15], { obstacle: true });
  addBox(room, runtime, 'CEREBRUM__OFFICE_FIREPLACE_OPENING', [0.14, 0.12, 0.012], materials.black, [minX + 0.55, 0.085, maxZ - 0.195]);
  addBox(room, runtime, 'CEREBRUM__OFFICE_FIREPLACE_LOW_EMBERS', [0.08, 0.01, 0.025], materials.amber, [minX + 0.55, 0.025, maxZ - 0.202]);
  const officeDeskX = maxX - 0.72;
  const officeDeskZ = (minZ + maxZ) * 0.5;
  addBox(room, runtime, 'CEREBRUM__OFFICE_CROWDED_WRITING_DESK', [0.22, 0.008, 0.1], materials.oak, [officeDeskX, 0.074, officeDeskZ], { obstacle: true });
  for (const xOffset of [-0.085, 0.085]) for (const zOffset of [-0.035, 0.035]) addBox(room, runtime, 'CEREBRUM__OFFICE_WRITING_DESK_LEG', [0.012, 0.07, 0.012], materials.darkOak, [officeDeskX + xOffset, 0.035, officeDeskZ + zOffset]);
  addLampHotspot(runtime, room, 'librarian-desk-lamp', [officeDeskX, 0.13, officeDeskZ - 0.025], 'librarian-office');
  const notes = ['DONOR LETTERS', 'CATALOGUING NOTES', 'REPAIR QUOTATIONS', 'UNANSWERED CORRESPONDENCE'];
  notes.forEach((name, index) => {
    const note = addBox(runtime.highDetails, runtime, `CEREBRUM__OFFICE_${name.replace(/ /g, '_')}`, [0.03, 0.003, 0.025], index % 2 ? materials.parchment : materials.paper, [officeDeskX - 0.04 + (index % 2) * 0.08, 0.0805 + index * 0.0001, officeDeskZ - 0.025 + Math.floor(index / 2) * 0.05], { detail: 'high' });
    note.rotation.y = (index - 1.5) * 0.09;
  });
  addCylinder(runtime.highDetails, runtime, 'CEREBRUM__OFFICE_PERSONAL_TEA_MUG', 0.006, 0.012, materials.paleStone, [officeDeskX + 0.07, 0.086, officeDeskZ + 0.025], 14);
  const photograph = addLabelPlane(runtime.highDetails, runtime, 'CEREBRUM__OFFICE_FADED_PERSONAL_PHOTOGRAPH', ['SUMMER STAFF', '1987'], [0.05, 0.04], [maxX - 0.38, 0.16, maxZ + 0.195], [0, Math.PI, -0.05], { background: '#8d826f', foreground: '#332d26', border: '#4c3c2c', font: '600 45px Georgia, serif' });
  photograph.userData.personalObject = true;
  addBookHotspot(runtime, room, 'book-office-accession-ledger', [officeDeskX + 0.035, 0.081, officeDeskZ + 0.02], 'librarian-office', {
    title: 'Accession Ledger, 1984–1991', subtitle: 'Office copy · annotated', body: 'Coffee rings overlap careful notes about a missing folio transferred to Cerebrum Occultum under shelfmark R-7.',
  });
}

function buildCerebrumOccultum(runtime: CerebrumLibraryRuntime) {
  const materials = runtime.materials;
  const archive = new THREE.Group();
  archive.name = 'CEREBRUM_OCCULTUM__RESTRICTED_ARCHIVE';
  archive.userData.cerebrumRoomId = 'restricted-archive';
  archive.userData.semanticName = CEREBRUM_OCCULTUM_NAME;
  archive.userData.atmosphere = 'controlled institutional restriction; mystery through access, age, and low light only';
  archive.userData.supernaturalEffects = false;
  runtime.root.add(archive);
  const basementY = -metres(7.2);
  const ceilingY = basementY + metres(4.2);
  const minX = -runtime.width * 0.47;
  const maxX = runtime.width * 0.47;
  const minZ = -runtime.depth * 0.46;
  const maxZ = runtime.depth * 0.16;

  // A real stair occupies the aperture deliberately left in both legacy and authored floors.
  const stairX = runtime.width * 0.365;
  const stairStartZ = -runtime.depth * 0.17;
  // Keep the lowest tread and the player capsule clear of the rear wall's
  // inward face; the former value embedded the stair foot in masonry.
  const stairEndZ = minZ + 0.18;
  const stepCount = 22;
  for (let index = 0; index < stepCount; index += 1) {
    const progress = index / (stepCount - 1);
    const topY = THREE.MathUtils.lerp(-0.005, basementY + 0.025, progress);
    const depth = Math.abs(stairEndZ - stairStartZ) / stepCount + 0.016;
    const step = addBox(archive, runtime, `CEREBRUM_OCCULTUM__DESCENDING_STONE_STEP_${index + 1}`, [0.18, 0.035, depth], materials.dampStone, [stairX, topY - 0.017, THREE.MathUtils.lerp(stairStartZ, stairEndZ, progress)], { walkable: true, surface: 'stone' });
    step.userData.cerebrumLevelTransition = true;
    step.userData.cerebrumStepProgress = progress;
  }
  for (const side of [-1, 1]) {
    const rail = addBox(archive, runtime, 'CEREBRUM_OCCULTUM__STAIR_IRON_HANDRAIL', [0.01, 0.01, Math.abs(stairEndZ - stairStartZ)], materials.iron, [stairX + side * 0.105, -0.25, (stairStartZ + stairEndZ) * 0.5]);
    rail.rotation.x = -Math.atan2(Math.abs(basementY), Math.abs(stairEndZ - stairStartZ));
    addBarrier(runtime, [stairX + side * 0.105, -0.02, stairStartZ], [stairX + side * 0.105, basementY + 0.03, stairEndZ], 0.018);
  }

  addBox(archive, runtime, 'CEREBRUM_OCCULTUM__BASEMENT_STONE_FLOOR', [maxX - minX, 0.045, maxZ - minZ], materials.dampStone, [(minX + maxX) * 0.5, basementY - 0.022, (minZ + maxZ) * 0.5], { surface: 'stone' });
  addNavigationFloor(runtime.occultumNavigation, runtime, 'CEREBRUM_OCCULTUM__ARCHIVE_NAVIGATION', [maxX - minX, maxZ - minZ], [(minX + maxX) * 0.5, basementY + 0.012, (minZ + maxZ) * 0.5]);
  runtime.occultumNavigation.visible = false;

  addWall(runtime, 'CEREBRUM_OCCULTUM__REAR_BASEMENT_WALL', [maxX - minX, ceilingY - basementY, 0.14], [(minX + maxX) * 0.5, (basementY + ceilingY) * 0.5, minZ], materials.dampStone, archive);
  addWall(runtime, 'CEREBRUM_OCCULTUM__WEST_BASEMENT_WALL', [0.14, ceilingY - basementY, maxZ - minZ], [minX, (basementY + ceilingY) * 0.5, (minZ + maxZ) * 0.5], materials.dampStone, archive);
  addWall(runtime, 'CEREBRUM_OCCULTUM__EAST_BASEMENT_WALL', [0.14, ceilingY - basementY, maxZ - minZ], [maxX, (basementY + ceilingY) * 0.5, (minZ + maxZ) * 0.5], materials.dampStone, archive);
  addWall(runtime, 'CEREBRUM_OCCULTUM__FRONT_BASEMENT_WALL', [maxX - minX, ceilingY - basementY, 0.14], [(minX + maxX) * 0.5, (basementY + ceilingY) * 0.5, maxZ], materials.dampStone, archive);
  addBox(runtime.cutaway, runtime, 'CEREBRUM_OCCULTUM__CUTAWAY_BASEMENT_CEILING', [maxX - minX, 0.12, maxZ - minZ], materials.dampStone, [(minX + maxX) * 0.5, ceilingY, (minZ + maxZ) * 0.5], { cutaway: true });

  // Iron gate at the foot of the stair, with individually modelled bars.
  const gateZ = stairEndZ + 0.18;
  const gateWidth = 0.3;
  const gateHingeX = stairX - gateWidth * 0.5;
  const gateWallHeight = ceilingY - basementY;
  const gateClearance = 0.38;
  const gateWestWidth = gateHingeX - minX;
  const gateEastStart = gateHingeX + gateWidth;
  const gateEastWidth = maxX - gateEastStart;
  addWall(runtime, 'CEREBRUM_OCCULTUM__GATE_PARTITION_WEST', [gateWestWidth, gateWallHeight, 0.1], [minX + gateWestWidth * 0.5, (basementY + ceilingY) * 0.5, gateZ], materials.dampStone, archive);
  addWall(runtime, 'CEREBRUM_OCCULTUM__GATE_PARTITION_EAST', [gateEastWidth, gateWallHeight, 0.1], [gateEastStart + gateEastWidth * 0.5, (basementY + ceilingY) * 0.5, gateZ], materials.dampStone, archive);
  addWall(runtime, 'CEREBRUM_OCCULTUM__GATE_PARTITION_HEADER', [gateWidth, gateWallHeight - gateClearance, 0.1], [stairX, basementY + gateClearance + (gateWallHeight - gateClearance) * 0.5, gateZ], materials.dampStone, archive);
  addBarrier(runtime, [minX, basementY + 0.05, gateZ], [gateHingeX, basementY + 0.05, gateZ], 0.05);
  addBarrier(runtime, [gateEastStart, basementY + 0.05, gateZ], [maxX, basementY + 0.05, gateZ], 0.05);
  const gatePivot = addDoor(runtime, {
    id: 'occultum-iron-gate', label: `Open the iron gate to ${CEREBRUM_OCCULTUM_NAME}`, roomId: 'restricted-archive',
    position: [gateHingeX, basementY + 0.012, gateZ], width: gateWidth, height: 0.32,
    material: materials.iron, openAngle: Math.PI * 0.52,
    title: CEREBRUM_OCCULTUM_NAME, description: 'An institutional iron gate with a staff lock and a century of inventory scratches.',
  });
  gatePivot.traverse((object) => { object.userData.cerebrumRestrictedAccess = true; });
  for (let index = 0; index < 9; index += 1) {
    addBox(gatePivot, runtime, 'CEREBRUM_OCCULTUM__IRON_GATE_VERTICAL_BAR', [0.005, 0.32, 0.014], materials.iron, [0.02 + index * (gateWidth - 0.04) / 8, 0.16, 0.012]);
  }

  // Compact archive shelving and neutral boxes, deliberately denser than upstairs.
  const random = seededRandom(runtime.seed + 580);
  const shelfTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  const shelfUprightTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  const boxTransforms: Array<{ position: THREE.Vector3; scale: THREE.Vector3 }> = [];
  const shelfRecords: Array<{ x: number; z: number; length: number }> = [];
  const archiveShelfMinZ = gateZ + 0.2;
  const archiveShelfMaxZ = maxZ - 0.34;
  for (let row = 0; row < 15; row += 1) {
    shelfRecords.push({ x: 0.3 + row * 0.24, z: (archiveShelfMinZ + archiveShelfMaxZ) * 0.5, length: archiveShelfMaxZ - archiveShelfMinZ });
  }
  shelfRecords.forEach((shelf) => {
    const bays = Math.max(4, Math.round(shelf.length / 0.14));
    for (let bay = 0; bay < bays; bay += 1) {
      const z = THREE.MathUtils.lerp(archiveShelfMinZ, archiveShelfMaxZ, bay / Math.max(1, bays - 1));
      for (let level = 0; level < 5; level += 1) {
        shelfTransforms.push({ position: new THREE.Vector3(shelf.x, basementY + 0.045 + level * 0.072, z), scale: new THREE.Vector3(0.075, 0.01, 0.14) });
        for (let box = 0; box < 3; box += 1) {
          const boxHeight = 0.021 + random() * 0.01;
          boxTransforms.push({ position: new THREE.Vector3(shelf.x, basementY + 0.05 + level * 0.072 + boxHeight * 0.5, z - 0.045 + box * 0.045), scale: new THREE.Vector3(0.028 + random() * 0.006, boxHeight, 0.035) });
        }
      }
      shelfUprightTransforms.push({ position: new THREE.Vector3(shelf.x, basementY + 0.18, z), scale: new THREE.Vector3(0.08, 0.36, 0.012) });
    }
    addBarrier(runtime, [shelf.x, basementY + 0.09, archiveShelfMinZ - 0.04], [shelf.x, basementY + 0.09, archiveShelfMaxZ + 0.04], 0.045);
  });
  addInstanced(archive, runtime, 'CEREBRUM_OCCULTUM__COMPACT_INSTANCED_SHELVING', new THREE.BoxGeometry(1, 1, 1), materials.iron, shelfTransforms, 0.72, 0.9);
  addInstanced(archive, runtime, 'CEREBRUM_OCCULTUM__COMPACT_SHELF_UPRIGHTS', new THREE.BoxGeometry(1, 1, 1), materials.iron, shelfUprightTransforms, 0.72, 0.9);
  addInstanced(archive, runtime, 'CEREBRUM_OCCULTUM__INSTANCED_ARCHIVAL_BOXES', new THREE.BoxGeometry(1, 1, 1), materials.archiveBox, boxTransforms, 0.25, 0.64);

  // Manuscript cabinets, a controlled reading lectern, and restrained dim light.
  for (let index = 0; index < 4; index += 1) {
    const cabinetZ = minZ + 0.48 + index * 0.62;
    addBox(archive, runtime, 'CEREBRUM_OCCULTUM__MANUSCRIPT_CABINET', [0.16, 0.18, 0.07], materials.darkOak, [-0.1, basementY + 0.09, cabinetZ], { obstacle: true });
    addBox(archive, runtime, 'CEREBRUM_OCCULTUM__MANUSCRIPT_CABINET_BRASS_LABEL', [0.04, 0.014, 0.005], materials.brass, [-0.1, basementY + 0.105, cabinetZ + 0.038]);
  }
  addBox(archive, runtime, 'CEREBRUM_OCCULTUM__READING_LECTERN_PEDESTAL', [0.025, 0.095, 0.025], materials.darkOak, [maxX - 0.72, basementY + 0.0475, maxZ - 0.52]);
  const lectern = addBox(archive, runtime, 'CEREBRUM_OCCULTUM__READING_LECTERN', [0.09, 0.008, 0.06], materials.oak, [maxX - 0.72, basementY + 0.1, maxZ - 0.52], { obstacle: true });
  lectern.rotation.x = -0.16;
  addBox(archive, runtime, 'CEREBRUM_OCCULTUM__LECTERN_MANUSCRIPT_CRADLE', [0.065, 0.004, 0.045], materials.parchment, [maxX - 0.72, basementY + 0.106, maxZ - 0.525]);
  const archiveLightPositions = Array.from({ length: 5 }, (_, aisle) => (
    Array.from({ length: 3 }, (_, pool) => new THREE.Vector3(
      0.42 + aisle * 0.72,
      ceilingY - 0.04,
      THREE.MathUtils.lerp(archiveShelfMinZ + 0.52, archiveShelfMaxZ - 0.52, pool / 2),
    ))
  )).flat();
  const archiveLampTransforms = archiveLightPositions.map((position) => ({ position, scale: new THREE.Vector3(0.022, 0.02, 0.022) }));
  addInstanced(archive, runtime, 'CEREBRUM_OCCULTUM__CONTROLLED_DIM_CEILING_LIGHTS', new THREE.SphereGeometry(1, 8, 6), materials.amber, archiveLampTransforms, 0.5, 0.75);
  const archivePoolMaterial = new THREE.MeshBasicMaterial({
    name: 'Cerebrum Occultum controlled amber floor pools',
    color: '#ff8d35',
    transparent: true,
    opacity: 0.11,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  addInstanced(
    archive,
    runtime,
    'CEREBRUM_OCCULTUM__CONTROLLED_DIM_AMBER_FLOOR_POOLS',
    new THREE.CircleGeometry(1, 20),
    archivePoolMaterial,
    archiveLightPositions.map((position) => ({
      position: new THREE.Vector3(position.x, basementY + 0.004, position.z),
      scale: new THREE.Vector3(0.18, 0.12, 1),
      rotation: new THREE.Euler(-Math.PI * 0.5, 0, 0),
    })),
    0.5,
    0.75,
  );

  // The locked inner door leads to the rare-book room; the catalogue supplies its key context.
  const divisionX = -0.55;
  const rareDoorWidth = 0.3;
  const rareDoorCenterZ = (minZ + maxZ) * 0.5;
  const rareDoorHingeZ = rareDoorCenterZ + rareDoorWidth * 0.5;
  const rareOpeningMinZ = rareDoorCenterZ - rareDoorWidth * 0.5;
  const rareOpeningMaxZ = rareDoorCenterZ + rareDoorWidth * 0.5;
  const rareNorthWidth = rareOpeningMinZ - minZ;
  const rareSouthWidth = maxZ - rareOpeningMaxZ;
  addWall(runtime, 'CEREBRUM_OCCULTUM__RARE_ROOM_DIVISION_NORTH', [0.12, ceilingY - basementY, rareNorthWidth], [divisionX, (basementY + ceilingY) * 0.5, minZ + rareNorthWidth * 0.5], materials.dampStone, archive);
  addWall(runtime, 'CEREBRUM_OCCULTUM__RARE_ROOM_DIVISION_SOUTH', [0.12, ceilingY - basementY, rareSouthWidth], [divisionX, (basementY + ceilingY) * 0.5, rareOpeningMaxZ + rareSouthWidth * 0.5], materials.dampStone, archive);
  addWall(runtime, 'CEREBRUM_OCCULTUM__RARE_ROOM_DOOR_HEADER', [0.12, ceilingY - basementY - 0.28, rareDoorWidth], [divisionX, basementY + 0.28 + (ceilingY - basementY - 0.28) * 0.5, rareDoorCenterZ], materials.dampStone, archive);
  addBarrier(runtime, [divisionX, basementY + 0.05, minZ], [divisionX, basementY + 0.05, rareOpeningMinZ], 0.06);
  addBarrier(runtime, [divisionX, basementY + 0.05, rareOpeningMaxZ], [divisionX, basementY + 0.05, maxZ], 0.06);
  addDoor(runtime, {
    id: 'rare-book-inner-door', label: 'Try the locked rare-book room door', roomId: 'restricted-archive',
    position: [divisionX, basementY + 0.012, rareDoorHingeZ], width: rareDoorWidth, height: 0.28, yaw: Math.PI * 0.5,
    material: materials.darkOak, openAngle: -Math.PI * 0.5,
    title: 'Rare Book Room', description: 'The inner lock accepts a shelfmark authorization from the card catalogue.',
  });

  buildRareBookRoom(runtime, { minX, maxX: divisionX - 0.08, minZ, maxZ, floorY: basementY, ceilingY });
  addAudioMarker(runtime, 'occultum-controlled-room-tone', 'restricted-archive', [2.2, basementY + 0.28, -1.1], 'Ventilation and remote building resonance; deliberately no supernatural sound design.');
}

function buildRareBookRoom(
  runtime: CerebrumLibraryRuntime,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; floorY: number; ceilingY: number },
) {
  const materials = runtime.materials;
  const room = new THREE.Group();
  room.name = 'CEREBRUM_OCCULTUM__RARE_BOOK_ROOM';
  room.userData.cerebrumRoomId = 'rare-book-room';
  room.userData.restrictedArchivePart = true;
  runtime.root.add(room);
  const centerX = (bounds.minX + bounds.maxX) * 0.5;
  const centerZ = (bounds.minZ + bounds.maxZ) * 0.5;

  // Dark panels cover the stone but preserve readable construction joints.
  for (let bay = 0; bay < 9; bay += 1) {
    const x = THREE.MathUtils.lerp(bounds.minX + 0.28, bounds.maxX - 0.28, bay / 8);
    addBox(room, runtime, 'CEREBRUM_OCCULTUM__RARE_ROOM_DARK_WOOD_PANEL', [0.48, 0.37, 0.055], materials.panel, [x, bounds.floorY + 0.24, bounds.minZ + 0.1]);
  }
  for (let bay = 0; bay < 7; bay += 1) {
    const z = THREE.MathUtils.lerp(bounds.minZ + 0.35, bounds.maxZ - 0.35, bay / 6);
    addBox(room, runtime, 'CEREBRUM_OCCULTUM__RARE_ROOM_WEST_PANEL', [0.055, 0.37, 0.48], materials.panel, [bounds.minX + 0.1, bounds.floorY + 0.24, z]);
  }

  // Glass-front cabinets with leather-bound volumes.
  const cabinetCount = 24;
  const cabinetRecords = Array.from({ length: cabinetCount }, (_, index) => ({ x: THREE.MathUtils.lerp(bounds.minX + 0.18, bounds.maxX - 0.18, index / (cabinetCount - 1)), z: bounds.minZ + 0.18 }));
  const rareBooks: Array<{ position: THREE.Vector3; scale: THREE.Vector3; color: THREE.Color }> = [];
  cabinetRecords.forEach((cabinet, cabinetIndex) => {
    addBox(room, runtime, 'CEREBRUM_OCCULTUM__GLASS_FRONT_RARE_BOOK_CABINET', [0.12, 0.24, 0.07], materials.darkOak, [cabinet.x, bounds.floorY + 0.12, cabinet.z], { obstacle: true });
    addBox(room, runtime, 'CEREBRUM_OCCULTUM__RARE_CABINET_GLASS_DOOR', [0.108, 0.21, 0.004], materials.coldGlass, [cabinet.x, bounds.floorY + 0.125, cabinet.z + 0.037]);
    for (let shelf = 0; shelf < 5; shelf += 1) {
      for (let volume = 0; volume < 10; volume += 1) {
        const height = 0.02 + ((cabinetIndex + volume + shelf) % 4) * 0.003;
        rareBooks.push({
          position: new THREE.Vector3(cabinet.x - 0.05 + volume * 0.011, bounds.floorY + 0.018 + shelf * 0.043 + height * 0.5, cabinet.z + 0.018),
          scale: new THREE.Vector3(0.006 + ((volume + shelf) % 3) * 0.001, height, 0.025),
          color: new THREE.Color(['#54231f', '#2f4237', '#594127', '#272d42'][((cabinetIndex * 3 + volume) % 4)]),
        });
      }
    }
  });
  addInstanced(room, runtime, 'CEREBRUM_OCCULTUM__LEATHER_BOUND_RARE_BOOKS', new THREE.BoxGeometry(1, 1, 1), materials.book, rareBooks, 0.32, 0.72);

  // Heavy curtains cover former light wells rather than implying a view underground.
  for (const x of [bounds.minX + 0.72, bounds.maxX - 0.72]) {
    addBox(room, runtime, 'CEREBRUM_OCCULTUM__HEAVY_LIGHTWELL_CURTAIN', [0.28, 0.36, 0.025], materials.burgundyRug, [x, bounds.floorY + 0.22, bounds.maxZ - 0.12]);
    for (const offset of [-0.09, -0.03, 0.03, 0.09]) addBox(runtime.highDetails, runtime, 'CEREBRUM_OCCULTUM__CURTAIN_FOLD', [0.008, 0.34, 0.03], materials.leather, [x + offset, bounds.floorY + 0.22, bounds.maxZ - 0.135], { detail: 'high' });
  }

  // Central table, display cases, reading stands and the open facsimile.
  addBox(room, runtime, 'CEREBRUM_OCCULTUM__RARE_ROOM_CENTRAL_TABLE', [0.42, 0.008, 0.18], materials.darkOak, [centerX, bounds.floorY + 0.074, centerZ], { obstacle: true });
  for (const xOffset of [-0.17, 0.17]) for (const zOffset of [-0.065, 0.065]) addBox(room, runtime, 'CEREBRUM_OCCULTUM__RARE_ROOM_CENTRAL_TABLE_LEG', [0.014, 0.07, 0.014], materials.darkOak, [centerX + xOffset, bounds.floorY + 0.035, centerZ + zOffset]);
  addBox(room, runtime, 'CEREBRUM_OCCULTUM__OPEN_FACSIMILE_LEFT_PAGE', [0.055, 0.003, 0.075], materials.parchment, [centerX - 0.03, bounds.floorY + 0.0805, centerZ]);
  const rightPage = addBox(room, runtime, 'CEREBRUM_OCCULTUM__OPEN_FACSIMILE_RIGHT_PAGE', [0.055, 0.003, 0.075], materials.parchment, [centerX + 0.03, bounds.floorY + 0.0805, centerZ]);
  rightPage.rotation.z = -0.035;
  for (const side of [-1, 1]) {
    addBox(room, runtime, 'CEREBRUM_OCCULTUM__GLASS_MANUSCRIPT_DISPLAY_CASE', [0.18, 0.08, 0.1], materials.darkOak, [centerX + side * 1.75, bounds.floorY + 0.04, centerZ + 0.25], { obstacle: true });
    addBox(room, runtime, 'CEREBRUM_OCCULTUM__DISPLAY_CASE_GLASS_TOP', [0.17, 0.035, 0.09], materials.coldGlass, [centerX + side * 1.75, bounds.floorY + 0.0975, centerZ + 0.25]);
    addBox(room, runtime, 'CEREBRUM_OCCULTUM__RARE_BOOK_READING_STAND_PEDESTAL', [0.022, 0.095, 0.022], materials.darkOak, [centerX + side * 1.72, bounds.floorY + 0.0475, centerZ - 0.65]);
    const stand = addBox(room, runtime, 'CEREBRUM_OCCULTUM__RARE_BOOK_READING_STAND', [0.08, 0.008, 0.05], materials.oak, [centerX + side * 1.72, bounds.floorY + 0.1, centerZ - 0.65]);
    stand.rotation.x = -0.16;
  }

  // Exactly one ornate ceiling light supplies the rare room.
  const ornate = prepare(new THREE.Group(), runtime, 'CEREBRUM_OCCULTUM__ONE_ORNATE_CEILING_LIGHT');
  ornate.position.set(centerX, bounds.ceilingY - 0.08, centerZ);
  for (let ring = 0; ring < 3; ring += 1) {
    const torus = prepare(new THREE.Mesh(new THREE.TorusGeometry(0.05 + ring * 0.018, 0.004, 7, 22), materials.brass), runtime, 'CEREBRUM_OCCULTUM__ORNATE_LIGHT_BRASS_RING');
    torus.rotation.x = Math.PI * 0.5;
    torus.position.y = -ring * 0.035;
    ornate.add(torus);
  }
  const warmCore = prepare(new THREE.Mesh(new THREE.SphereGeometry(0.025, 14, 9), materials.amber), runtime, 'CEREBRUM_OCCULTUM__ORNATE_LIGHT_AMBER_CORE');
  warmCore.position.y = -0.08;
  ornate.add(warmCore);
  room.add(ornate);
  addPointLight(runtime, 'CEREBRUM_OCCULTUM__RARE_ROOM_SINGLE_ORNATE_LIGHT_POOL', [centerX, bounds.ceilingY - 0.16, centerZ], 0.64, 3.5);

  addBookHotspot(runtime, room, 'rare-book-de-motu-memoriae', [centerX, bounds.floorY + 0.082, centerZ], 'rare-book-room', {
    title: 'De Motu Memoriae', subtitle: 'Facsimile of the 1512 Vale manuscript', body: 'A scholarly facsimile opened to a diagram of memory as a sequence of rooms. The original remains secured in Cabinet R-7.',
  });
  addLabelPlane(room, runtime, 'CEREBRUM_OCCULTUM__RARE_ROOM_ACCESS_PLAQUE', ['RARE BOOK ROOM', 'AUTHORIZED READERS'], [0.14, 0.07], [bounds.maxX - 0.075, bounds.floorY + 0.19, centerZ], [0, -Math.PI * 0.5, 0], { background: '#241a14', foreground: '#c49b55', border: '#8d6738', font: '600 48px Georgia, serif' });
}

function addSystemControls(runtime: CerebrumLibraryRuntime) {
  const materials = runtime.materials;
  const z = runtime.depth * 0.5 - 0.3;
  addLabelPlane(runtime.root, runtime, 'CEREBRUM__VISIBLE_AUDIO_AND_QUIET_CONTROL_PLAQUE', ['AUDIO  ·  QUIET', 'MUTE     ORBIT'], [0.46, 0.21], [1.36, 0.29, z], [0, -Math.PI * 0.5, 0], { background: '#201b16', foreground: '#d0aa60', border: '#8b6c35', font: '600 42px Georgia, serif' });
  addBox(runtime.root, runtime, 'CEREBRUM__VISIBLE_MUTE_CONTROL', [0.045, 0.08, 0.08], materials.brass, [1.33, 0.2, z - 0.13]);
  addBox(runtime.root, runtime, 'CEREBRUM__VISIBLE_QUIET_MODE_CONTROL', [0.045, 0.08, 0.08], materials.brass, [1.33, 0.34, z - 0.13]);
  const controls: Array<{ id: string; kind: CerebrumLibraryHotspotKind; action: CerebrumLibraryAction; label: string; y: number }> = [
    { id: 'library-mute-control', kind: 'mute', action: 'toggle-mute', label: 'Mute or restore library audio', y: 0.2 },
    { id: 'library-quiet-mode-control', kind: 'quiet-mode', action: 'toggle-quiet-mode', label: 'Toggle optional quiet mode', y: 0.34 },
    { id: 'library-orbit-camera-control', kind: 'orbit-camera', action: 'toggle-orbit-camera', label: 'Toggle architectural orbit camera', y: 0.48 },
  ];
  controls.forEach((control) => registerHotspot(runtime, runtime.root, {
    id: control.id, kind: control.kind, action: control.action, label: control.label, roomId: 'entrance-vestibule',
    localPosition: [1.33, control.y, z - 0.13], radius: 0.22,
  }, [0.16, 0.12, 0.16]));
}

function buildRoomConnectors(runtime: CerebrumLibraryRuntime) {
  const materials = runtime.materials;
  const divideX = runtime.width * 0.145;
  const doorHalf = 0.36;
  const rearZ = -runtime.depth * 0.36;
  const frontZ = runtime.depth * 0.28;
  // Reading room and stacks share two generous stone arches rather than one
  // borderless hall, keeping the sequence of connected rooms legible.
  const wallSegments = [
    { z0: rearZ, z1: -1.3 },
    { z0: -0.58, z1: 0.54 },
    { z0: 1.25, z1: frontZ },
  ];
  wallSegments.forEach((segment, index) => addWall(runtime, `CEREBRUM__READING_TO_STACKS_PARTITION_${index + 1}`, [0.11, 0.83, segment.z1 - segment.z0], [divideX, 0.415, (segment.z0 + segment.z1) * 0.5], materials.paleStone));
  for (const z of [-0.94, 0.895]) {
    const arch = prepare(new THREE.Mesh(new THREE.TorusGeometry(doorHalf, 0.065, 8, 22, Math.PI), materials.paleStone), runtime, 'CEREBRUM__CONNECTED_ROOM_STONE_ARCH');
    arch.position.set(divideX, 0.4, z);
    arch.rotation.y = Math.PI * 0.5;
    runtime.root.add(arch);
  }

  // Card catalogue and stacks are divided around a broad, signed opening.
  const stackMinX = runtime.width * 0.16;
  const stackMaxX = runtime.width * 0.47;
  const openingCenter = (stackMinX + stackMaxX) * 0.5;
  const openingWidth = 0.7;
  const leftWidth = openingCenter - openingWidth * 0.5 - stackMinX;
  const rightWidth = stackMaxX - openingCenter - openingWidth * 0.5;
  addWall(runtime, 'CEREBRUM__STACKS_TO_CATALOGUE_PARTITION_LEFT', [leftWidth, 0.76, 0.1], [stackMinX + leftWidth * 0.5, 0.38, frontZ], materials.paleStone);
  addWall(runtime, 'CEREBRUM__STACKS_TO_CATALOGUE_PARTITION_RIGHT', [rightWidth, 0.76, 0.1], [openingCenter + openingWidth * 0.5 + rightWidth * 0.5, 0.38, frontZ], materials.paleStone);
  addWall(runtime, 'CEREBRUM__STACKS_TO_CATALOGUE_ARCH_HEADER', [openingWidth, 0.32, 0.1], [openingCenter, 0.6, frontZ], materials.paleStone);
  addLabelPlane(runtime.root, runtime, 'CEREBRUM__CARD_CATALOGUE_DIRECTIONAL_ARCH_SIGN', ['CARD CATALOGUE', 'REFERENCE · MAPS'], [0.54, 0.22], [openingCenter, 0.63, frontZ - 0.06], [0, 0, 0], { background: '#231d17', foreground: '#d2b471', border: '#806432', font: '600 44px Georgia, serif' });
}

function applyStateToVisuals(runtime: CerebrumLibraryRuntime, instant = false) {
  runtime.doors.forEach((door, id) => {
    const target = door.closedAngle + (runtime.state.doors[id] ? door.openAngle : 0);
    door.pivot.rotation.y = instant ? target : THREE.MathUtils.lerp(door.pivot.rotation.y, target, 0.22);
  });
  runtime.drawers.forEach((drawer, id) => {
    const target = drawer.closedPosition.clone().addScaledVector(drawer.openOffset, runtime.state.drawers[id] ? 1 : 0);
    drawer.mesh.position.lerp(target, instant ? 1 : 0.2);
  });
  runtime.lamps.forEach((lamp, id) => {
    const on = runtime.state.lamps[id] !== false;
    lamp.glow.visible = on;
    lamp.glow.material.emissiveIntensity = on ? 1.55 : 0;
    lamp.pool.visible = on && runtime.state.quality !== 'low';
    lamp.pool.material.opacity = on ? 0.105 : 0;
  });
  if (runtime.ladder) {
    const minX = -runtime.width * 0.47;
    const stops = [minX + 1.15, minX + 2.75, minX + 4.35];
    runtime.ladder.position.x = instant ? stops[runtime.state.ladderStop] : THREE.MathUtils.lerp(runtime.ladder.position.x, stops[runtime.state.ladderStop], 0.18);
  }
}

/**
 * Builds and attaches the complete connected Cerebrum Externum interior.
 * Calling it repeatedly on the same host is idempotent.
 */
export function createCerebrumLibraryInterior(host: THREE.Group, options: CerebrumLibraryBuildOptions = {}) {
  const runtime = createRuntime(host, options);
  if (runtime.root.userData.cerebrumBuildComplete) return runtime.root;
  addOuterShell(runtime);
  buildEntranceVestibule(runtime);
  buildGrandStairHall(runtime);
  buildMainReadingRoom(runtime);
  buildStacks(runtime);
  buildCardCatalogueRoom(runtime);
  buildLibrarianOffice(runtime);
  buildCerebrumOccultum(runtime);
  buildRoomConnectors(runtime);
  addSystemControls(runtime);

  runtime.root.userData.cerebrumBuildComplete = true;
  runtime.root.userData.interactions = Array.from(new Set(Array.from(runtime.hotspots.values()).map((hotspot) => hotspot.action)));
  runtime.root.userData.interactionHotspotIds = Array.from(runtime.hotspots.keys());
  runtime.root.userData.walkableLevelStrategy = 'all stacked navigation layers registered; height-aware ground sampling follows continuous stairs';
  runtime.root.userData.navigationMetrics = {
    maximumStepRiseWorldUnits: 0.034,
    maximumStepRiseMetres: 0.34,
    controllerStepLimitWorldUnits: 0.038,
    grandStairTreads: 20,
    occultumStairTreads: 22,
  };
  runtime.root.userData.roomResolver = 'getCerebrumLibraryRoomAt';
  runtime.root.userData.insideResolver = 'isPointInsideCerebrumLibrary';
  runtime.root.traverse((object) => {
    object.userData.selectableId ??= runtime.selectableId;
    object.userData.editorWorkspace ??= 'interior';
    object.userData.entityKind ??= 'cerebrum-library-interior';
    object.userData.cerebrumLibrary = true;
  });
  syncCollisionGuide(runtime);
  applyStateToVisuals(runtime, true);
  configureCerebrumLibraryQuality(runtime.root, runtime.state.quality);
  setCerebrumLibraryNavigationLevel(runtime.root, 'ground');
  // Normal Explore/WALK starts with the complete roof and exterior envelope.
  // The architectural orbit explicitly enables the cutaway when requested.
  setCerebrumLibraryCutaway(runtime.root, false);
  setCerebrumLibraryQuietMode(runtime.root, runtime.state.quietMode);
  setCerebrumLibraryMuted(runtime.root, runtime.state.muted);
  return runtime.root;
}

/** Alias retained for integrations that prefer a build verb. */
export const buildCerebrumLibraryInterior = createCerebrumLibraryInterior;

export function resolveCerebrumLibraryHotspot(object: THREE.Object3D): CerebrumLibraryHotspot | null {
  let cursor: THREE.Object3D | null = object;
  while (cursor) {
    const hotspot = cursor.userData.cerebrumHotspot as CerebrumLibraryHotspot | undefined;
    if (hotspot) return { ...hotspot, localPosition: [...hotspot.localPosition] };
    cursor = cursor.parent;
  }
  return null;
}

export function getCerebrumLibraryHotspots(rootOrChild: THREE.Object3D): CerebrumLibraryHotspot[] {
  const runtime = findRuntime(rootOrChild);
  if (!runtime) return [] as CerebrumLibraryHotspot[];
  runtime.root.updateWorldMatrix(true, true);
  return Array.from(runtime.hotspots.values()).map((hotspot) => {
    const proxy = runtime.hotspotMeshes.get(hotspot.id);
    if (!proxy) return { ...hotspot, localPosition: [...hotspot.localPosition] as [number, number, number] };
    const local = runtime.root.worldToLocal(proxy.getWorldPosition(new THREE.Vector3()));
    return { ...hotspot, localPosition: local.toArray() as [number, number, number] };
  });
}

export function getCerebrumLibraryState(rootOrChild: THREE.Object3D) {
  const runtime = findRuntime(rootOrChild);
  return runtime ? cloneState(runtime.state) : null;
}

export function restoreCerebrumLibraryState(rootOrChild: THREE.Object3D, saved: Partial<CerebrumLibraryState>) {
  const runtime = findRuntime(rootOrChild);
  if (!runtime) return false;
  if (saved.quality === 'low' || saved.quality === 'medium' || saved.quality === 'high') runtime.state.quality = saved.quality;
  if (saved.navigationLevel === 'ground' || saved.navigationLevel === 'upper-gallery' || saved.navigationLevel === 'occultum') runtime.state.navigationLevel = saved.navigationLevel;
  if (typeof saved.quietMode === 'boolean') runtime.state.quietMode = saved.quietMode;
  if (typeof saved.muted === 'boolean') runtime.state.muted = saved.muted;
  if (typeof saved.orbitCamera === 'boolean') runtime.state.orbitCamera = saved.orbitCamera;
  if (typeof saved.cutawayVisible === 'boolean') runtime.state.cutawayVisible = saved.cutawayVisible;
  Object.keys(runtime.state.doors).forEach((id) => {
    if (typeof saved.doors?.[id] === 'boolean') runtime.state.doors[id] = saved.doors[id];
  });
  Object.keys(runtime.state.drawers).forEach((id) => {
    if (typeof saved.drawers?.[id] === 'boolean') runtime.state.drawers[id] = saved.drawers[id];
  });
  Object.keys(runtime.state.lamps).forEach((id) => {
    if (typeof saved.lamps?.[id] === 'boolean') runtime.state.lamps[id] = saved.lamps[id];
  });
  runtime.state.ladderStop = THREE.MathUtils.clamp(Math.round(saved.ladderStop ?? runtime.state.ladderStop), 0, 2);
  runtime.state.inspectedBookId = typeof saved.inspectedBookId === 'string' ? saved.inspectedBookId : null;
  runtime.state.catalogueRevealed = saved.catalogueRevealed === true;
  runtime.state.rareBookDoorUnlocked = saved.rareBookDoorUnlocked === true || runtime.state.catalogueRevealed;
  runtime.state.rareBookLocation = runtime.state.catalogueRevealed ? RARE_BOOK_LOCATION : null;
  applyStateToVisuals(runtime, true);
  syncCollisionGuide(runtime);
  configureCerebrumLibraryQuality(runtime.root, runtime.state.quality);
  setCerebrumLibraryNavigationLevel(runtime.root, runtime.state.navigationLevel);
  setCerebrumLibraryCutaway(runtime.root, runtime.state.cutawayVisible);
  setCerebrumLibraryQuietMode(runtime.root, runtime.state.quietMode);
  setCerebrumLibraryMuted(runtime.root, runtime.state.muted);
  setCerebrumLibraryOrbitMode(runtime.root, runtime.state.orbitCamera);
  return true;
}

export function performCerebrumLibraryInteraction(rootOrChild: THREE.Object3D, hotspotId: string): CerebrumLibraryInteractionResult {
  const runtime = findRuntime(rootOrChild);
  const unavailable = (message: string): CerebrumLibraryInteractionResult => ({ handled: false, message, state: runtime ? cloneState(runtime.state) : {
    quality: 'high', navigationLevel: 'ground', quietMode: false, muted: true, orbitCamera: false, cutawayVisible: true,
    doors: {}, drawers: {}, lamps: {}, ladderStop: 0, inspectedBookId: null, catalogueRevealed: false, rareBookDoorUnlocked: false, rareBookLocation: null,
  } });
  if (!runtime) return unavailable('Cerebrum Externum is not attached to this object.');
  const hotspot = runtime.hotspots.get(hotspotId);
  if (!hotspot) return unavailable(`Unknown library hotspot: ${hotspotId}.`);
  let message = hotspot.label;
  let titleCard: CerebrumLibraryInteractionResult['titleCard'];
  let navigationChanged = false;
  let suggestedLevel: CerebrumLibraryLevel | undefined;

  switch (hotspot.action) {
    case 'toggle-door': {
      if (hotspotId === 'rare-book-inner-door' && !runtime.state.rareBookDoorUnlocked) {
        return {
          handled: true, hotspotId, action: hotspot.action,
          message: 'The inner door remains locked. Its brass plate asks for an authorized shelfmark; the card catalogue may provide one.',
          titleCard: { title: 'Restricted', subtitle: 'Rare Book Room · inner door', body: 'No alarm or uncanny effect—only a precise lock, a staff keyway, and institutional procedure.' },
          state: cloneState(runtime.state),
        };
      }
      runtime.state.doors[hotspotId] = !runtime.state.doors[hotspotId];
      navigationChanged = true;
      if (hotspotId === 'rare-book-inner-door') runtime.state.rareBookDoorUnlocked = true;
      if (hotspotId === 'occultum-iron-gate' && runtime.state.doors[hotspotId]) suggestedLevel = 'occultum';
      message = `${runtime.state.doors[hotspotId] ? 'Opened' : 'Closed'} ${hotspot.label.toLowerCase().replace(/^open /, '')}.`;
      syncCollisionGuide(runtime);
      break;
    }
    case 'toggle-drawer': {
      runtime.state.drawers[hotspotId] = !runtime.state.drawers[hotspotId];
      message = runtime.state.drawers[hotspotId]
        ? 'Drawer R–7 slides out. A clipped cross-reference reads: “Vale, E. · De Motu Memoriae · OCC/R-7/3”.'
        : 'Drawer R–7 closes with a soft wooden click.';
      break;
    }
    case 'pull-ladder':
      runtime.state.ladderStop = (runtime.state.ladderStop + 1) % 3;
      message = `The rolling ladder travels along its brass rail to bay ${runtime.state.ladderStop + 1}.`;
      break;
    case 'toggle-lamp':
      runtime.state.lamps[hotspotId] = !runtime.state.lamps[hotspotId];
      message = `${runtime.state.lamps[hotspotId] ? 'Lit' : 'Extinguished'} the individual green-shaded table lamp.`;
      break;
    case 'inspect-book': {
      runtime.state.inspectedBookId = hotspotId;
      titleCard = runtime.bookCards.get(hotspotId);
      message = titleCard ? `Inspecting “${titleCard.title}”.` : 'The selected book has no catalogue card.';
      break;
    }
    case 'search-card-catalogue':
      runtime.state.catalogueRevealed = true;
      runtime.state.rareBookDoorUnlocked = true;
      runtime.state.rareBookLocation = RARE_BOOK_LOCATION;
      titleCard = {
        title: 'De Motu Memoriae', subtitle: 'Fictional rare-book location revealed',
        body: `${RARE_BOOK_LOCATION}. Authorization slip OCC/R-7/3 has been issued for the inner door.`,
      };
      message = `The cross-index resolves to ${RARE_BOOK_LOCATION}.`;
      break;
    case 'toggle-quiet-mode':
      setCerebrumLibraryQuietMode(runtime.root, !runtime.state.quietMode);
      message = runtime.state.quietMode ? 'Quiet mode enabled: nonessential UI is suppressed and room audio is minimized.' : 'Quiet mode disabled.';
      break;
    case 'toggle-mute':
      setCerebrumLibraryMuted(runtime.root, !runtime.state.muted);
      message = runtime.state.muted ? 'Library audio muted.' : 'Library audio restored.';
      break;
    case 'toggle-orbit-camera':
      setCerebrumLibraryOrbitMode(runtime.root, !runtime.state.orbitCamera);
      message = runtime.state.orbitCamera ? 'Architectural orbit-camera mode enabled.' : 'Returned to first-person exploration mode.';
      break;
  }
  applyStateToVisuals(runtime);
  return { handled: true, hotspotId, action: hotspot.action, message, titleCard, navigationChanged, suggestedLevel, state: cloneState(runtime.state) };
}

export function configureCerebrumLibraryQuality(rootOrChild: THREE.Object3D, quality: CerebrumLibraryQuality) {
  const runtime = findRuntime(rootOrChild);
  if (!runtime) return false;
  runtime.state.quality = quality;
  runtime.mediumDetails.visible = quality !== 'low';
  // Medium keeps the authored room dressing and labelled/dust detail group;
  // High adds the dense scattered paper, pencil, laptop, and personal-object
  // layer. This makes the quality choice reduce draw calls, not merely counts.
  runtime.highDetails.visible = quality === 'high';
  runtime.dust.forEach((dust) => { dust.visible = quality !== 'low'; });
  runtime.instancedMeshes.forEach((mesh) => {
    const full = Number(mesh.userData.cerebrumFullInstanceCount ?? mesh.count);
    if (mesh.userData.cerebrumStructuralInstances) mesh.count = full;
    else if (quality === 'low') mesh.count = Number(mesh.userData.cerebrumLowInstanceCount ?? Math.ceil(full * 0.35));
    else if (quality === 'medium') mesh.count = Number(mesh.userData.cerebrumMediumInstanceCount ?? Math.ceil(full * 0.7));
    else mesh.count = full;
    mesh.instanceMatrix.needsUpdate = true;
  });
  runtime.pointLights.forEach((light, index) => {
    const original = Number(light.userData.cerebrumOriginalIntensity ?? light.intensity);
    light.visible = quality !== 'low' || index < 3;
    light.intensity = quality === 'low' ? original * 0.72 : quality === 'medium' ? original * 0.9 : original;
  });
  runtime.lamps.forEach((lamp, id) => {
    lamp.pool.visible = runtime.state.lamps[id] !== false && quality !== 'low';
  });
  runtime.root.userData.graphicsQuality = quality;
  return true;
}

export function setCerebrumLibraryNavigationLevel(rootOrChild: THREE.Object3D, level: CerebrumLibraryLevel) {
  const runtime = findRuntime(rootOrChild);
  if (!runtime) return false;
  runtime.state.navigationLevel = level;
  // All three raycast layers stay registered. WalkController resolves stacked
  // floors relative to the current feet height, so hiding a destination layer
  // would make the continuous stair/gallery route disappear before arrival.
  runtime.groundNavigation.visible = true;
  runtime.upperNavigation.visible = true;
  runtime.occultumNavigation.visible = true;
  runtime.root.userData.activeInteriorLevel = level;
  return true;
}

export function setCerebrumLibraryCutaway(rootOrChild: THREE.Object3D, cutawayVisible: boolean) {
  const runtime = findRuntime(rootOrChild);
  if (!runtime) return false;
  runtime.state.cutawayVisible = cutawayVisible;
  runtime.cutaway.visible = !cutawayVisible;
  runtime.exteriorCutawayTargets.forEach((originalVisible, object) => {
    object.visible = cutawayVisible ? false : originalVisible;
  });
  runtime.root.userData.cutawayVisible = cutawayVisible;
  return true;
}

export function setCerebrumLibraryQuietMode(rootOrChild: THREE.Object3D, enabled: boolean) {
  const runtime = findRuntime(rootOrChild);
  if (!runtime) return false;
  runtime.state.quietMode = enabled;
  runtime.root.userData.suppressNonessentialUi = enabled;
  runtime.root.userData.soundMix = enabled ? 'minimal' : 'inhabited-library';
  if (runtime.audio) runtime.audio.master.gain.setTargetAtTime(runtime.state.muted ? 0 : enabled ? 0.035 : 0.22, runtime.audio.context.currentTime, 0.035);
  return true;
}

export function setCerebrumLibraryMuted(rootOrChild: THREE.Object3D, muted: boolean) {
  const runtime = findRuntime(rootOrChild);
  if (!runtime) return false;
  runtime.state.muted = muted;
  runtime.root.userData.audioMuted = muted;
  if (runtime.audio) runtime.audio.master.gain.setTargetAtTime(muted ? 0 : runtime.state.quietMode ? 0.035 : 0.22, runtime.audio.context.currentTime, 0.025);
  return true;
}

export function setCerebrumLibraryOrbitMode(rootOrChild: THREE.Object3D, enabled: boolean) {
  const runtime = findRuntime(rootOrChild);
  if (!runtime) return false;
  runtime.state.orbitCamera = enabled;
  runtime.root.userData.cameraMode = enabled ? 'architectural-orbit' : 'first-person';
  if (enabled) setCerebrumLibraryCutaway(runtime.root, true);
  return true;
}

export function getCerebrumLibraryCameraPreset(
  rootOrChild: THREE.Object3D,
  id: CerebrumLibraryCameraPresetId,
  coordinateSpace: 'local' | 'world' = 'local',
): CerebrumLibraryCameraPreset | null {
  const runtime = findRuntime(rootOrChild);
  if (!runtime) return null;
  const w = runtime.width;
  const d = runtime.depth;
  const basementY = -metres(7.2);
  const definitions: Record<CerebrumLibraryCameraPresetId, CerebrumLibraryCameraPreset> = {
    entrance: { id: 'entrance', label: 'Entrance Vestibule', level: 'ground', position: [0, 0.24, d * 0.43], target: [0, 0.25, d * 0.2], fov: 56, cutaway: true },
    'reading-room': { id: 'reading-room', label: 'Main Reading Room', level: 'ground', position: [-w * 0.34, 0.28, d * 0.24], target: [-w * 0.23, 0.34, -d * 0.18], fov: 58, cutaway: true },
    stacks: { id: 'stacks', label: 'Labyrinthine Stacks', level: 'ground', position: [w * 0.22, 0.25, d * 0.2], target: [w * 0.4, 0.32, -d * 0.2], fov: 62, cutaway: true },
    occultum: { id: 'occultum', label: CEREBRUM_OCCULTUM_NAME, level: 'occultum', position: [w * 0.4, basementY + 0.22, -d * 0.39], target: [w * 0.16, basementY + 0.25, -d * 0.1], fov: 58, cutaway: true },
    'rare-book-room': { id: 'rare-book-room', label: 'Rare Book Room', level: 'occultum', position: [-w * 0.37, basementY + 0.25, d * 0.04], target: [-w * 0.24, basementY + 0.28, -d * 0.14], fov: 54, cutaway: true },
    'architectural-orbit': { id: 'architectural-orbit', label: 'Architectural Orbit', level: runtime.state.navigationLevel, position: [w * 0.7, Math.max(w, d) * 0.48, d * 0.76], target: [0, 0.16, -d * 0.04], fov: 48, cutaway: true },
  };
  const preset = definitions[id];
  if (coordinateSpace === 'local') return { ...preset, position: [...preset.position], target: [...preset.target] };
  runtime.root.updateWorldMatrix(true, false);
  const position = runtime.root.localToWorld(new THREE.Vector3(...preset.position)).toArray() as [number, number, number];
  const target = runtime.root.localToWorld(new THREE.Vector3(...preset.target)).toArray() as [number, number, number];
  return { ...preset, position, target };
}

export function getCerebrumLibraryOrbitPreset(rootOrChild: THREE.Object3D): CerebrumLibraryOrbitPreset {
  const preset = getCerebrumLibraryCameraPreset(rootOrChild, 'architectural-orbit', 'world');
  const runtime = findRuntime(rootOrChild);
  if (!preset || !runtime) throw new Error('Cerebrum Externum is not attached to this object.');
  return {
    target: preset.target,
    position: preset.position,
    minDistance: Math.max(runtime.width, runtime.depth) * 0.28,
    maxDistance: Math.max(runtime.width, runtime.depth) * 2.2,
    fov: preset.fov,
    cutaway: true,
  };
}

export function isPointInsideCerebrumLibrary(
  rootOrChild: THREE.Object3D,
  point: THREE.Vector3 | readonly [number, number, number],
  coordinateSpace: 'local' | 'world' = 'world',
) {
  const runtime = findRuntime(rootOrChild);
  if (!runtime) return false;
  const local = point instanceof THREE.Vector3 ? point.clone() : new THREE.Vector3(...point);
  if (coordinateSpace === 'world') {
    runtime.root.updateWorldMatrix(true, false);
    runtime.root.worldToLocal(local);
  }
  return Math.abs(local.x) <= runtime.width * 0.5 + 0.12
    && Math.abs(local.z) <= runtime.depth * 0.5 + 0.12
    && local.y >= -metres(7.5)
    && local.y <= metres(13.8);
}

export function getCerebrumLibraryRoomAt(
  rootOrChild: THREE.Object3D,
  point: THREE.Vector3 | readonly [number, number, number],
  coordinateSpace: 'local' | 'world' = 'world',
): CerebrumLibraryRoomId | null {
  const runtime = findRuntime(rootOrChild);
  if (!runtime) return null;
  const local = point instanceof THREE.Vector3 ? point.clone() : new THREE.Vector3(...point);
  if (coordinateSpace === 'world') {
    runtime.root.updateWorldMatrix(true, false);
    runtime.root.worldToLocal(local);
  }
  if (!isPointInsideCerebrumLibrary(runtime.root, local, 'local')) return null;
  if (local.y < -0.22) return local.x < -0.55 ? 'rare-book-room' : 'restricted-archive';
  if (local.z > runtime.depth * 0.285) {
    if (local.x < -runtime.width * 0.15) return 'librarian-office';
    if (local.x > runtime.width * 0.15) return 'card-catalogue-room';
    return 'entrance-vestibule';
  }
  if (Math.abs(local.x) < runtime.width * 0.15 && local.z > runtime.depth * 0.11) return 'grand-stair-hall';
  if (local.x > runtime.width * 0.145) return 'stacks';
  return 'main-reading-room';
}

function playTick(runtime: CerebrumLibraryRuntime) {
  const audio = runtime.audio;
  if (!audio || runtime.state.muted) return;
  const oscillator = audio.context.createOscillator();
  const gain = audio.context.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = 1240;
  const volume = runtime.state.quietMode ? 0.005 : 0.016;
  gain.gain.setValueAtTime(volume, audio.context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.context.currentTime + 0.035);
  oscillator.connect(gain).connect(audio.ambience);
  oscillator.start();
  oscillator.stop(audio.context.currentTime + 0.04);
}

function playNoiseBurst(runtime: CerebrumLibraryRuntime, duration: number, frequency: number, volume: number) {
  const audio = runtime.audio;
  if (!audio || runtime.state.muted) return;
  const samples = Math.max(1, Math.floor(audio.context.sampleRate * duration));
  const buffer = audio.context.createBuffer(1, samples, audio.context.sampleRate);
  const channel = buffer.getChannelData(0);
  const random = seededRandom(runtime.seed + Math.floor(runtime.elapsed * 1000));
  for (let index = 0; index < samples; index += 1) {
    const envelope = Math.sin(Math.PI * index / samples);
    channel[index] = (random() * 2 - 1) * envelope;
  }
  const source = audio.context.createBufferSource();
  const filter = audio.context.createBiquadFilter();
  const gain = audio.context.createGain();
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = 0.8;
  gain.gain.value = volume * (runtime.state.quietMode ? 0.18 : 1);
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(audio.ambience);
  source.start();
}

export function updateCerebrumLibrary(rootOrChild: THREE.Object3D, deltaSeconds: number, camera?: THREE.Camera) {
  const runtime = findRuntime(rootOrChild);
  if (!runtime) return false;
  const delta = THREE.MathUtils.clamp(deltaSeconds, 0, 0.1);
  runtime.elapsed += delta;
  applyStateToVisuals(runtime);
  runtime.dust.forEach((dust, index) => {
    dust.rotation.y += delta * (0.004 + index * 0.001);
    dust.position.y = Math.sin(runtime.elapsed * 0.13 + index) * 0.004;
  });

  if (camera) {
    const cameraWorld = camera.getWorldPosition(new THREE.Vector3());
    if (isPointInsideCerebrumLibrary(runtime.root, cameraWorld, 'world')) {
      const localCamera = runtime.root.worldToLocal(cameraWorld.clone());
      const floorEstimate = localCamera.y - metres(1.62);
      let inferred = runtime.state.navigationLevel;
      if (floorEstimate < -0.24) inferred = 'occultum';
      else if (floorEstimate > 0.42) inferred = 'upper-gallery';
      else if (runtime.state.navigationLevel !== 'ground' && floorEstimate > -0.12 && floorEstimate < 0.26) inferred = 'ground';
      if (inferred !== runtime.state.navigationLevel) setCerebrumLibraryNavigationLevel(runtime.root, inferred);
    }
  }

  if (runtime.elapsed >= runtime.nextClockTick) {
    playTick(runtime);
    runtime.nextClockTick += 4;
  }
  if (runtime.elapsed >= runtime.nextPageTurn) {
    playNoiseBurst(runtime, 0.42, 1800, 0.018);
    runtime.nextPageTurn += 8.5 + (Math.floor(runtime.elapsed) % 7) * 1.4;
  }
  return true;
}

function instanceCountMatching(runtime: CerebrumLibraryRuntime, pattern: RegExp, full = true) {
  return runtime.instancedMeshes.reduce((total, mesh) => pattern.test(mesh.name)
    ? total + Number(full ? mesh.userData.cerebrumFullInstanceCount ?? mesh.count : mesh.count)
    : total, 0);
}

export function getCerebrumLibrarySnapshot(rootOrChild: THREE.Object3D): CerebrumLibrarySnapshot {
  const runtime = findRuntime(rootOrChild);
  if (!runtime) throw new Error('Cerebrum Externum is not attached to this object.');
  let individualBooks = 0;
  let individualLamps = 0;
  runtime.root.traverse((object) => {
    if (object.userData.cerebrumBookId) individualBooks += 1;
    if (object.name.includes('INDIVIDUAL_LAMP_GLOW')) individualLamps += 1;
  });
  const fullInstances = runtime.instancedMeshes.reduce((total, mesh) => total + Number(mesh.userData.cerebrumFullInstanceCount ?? mesh.count), 0);
  const visibleInstances = runtime.instancedMeshes.reduce((total, mesh) => total + (mesh.visible ? mesh.count : 0), 0);
  return {
    name: 'Cerebrum Externum',
    undergroundName: CEREBRUM_OCCULTUM_NAME,
    coordinateSystem: 'Interior-local coordinates; +X east, +Y up, +Z toward the main entrance; 0.1 world unit equals 1 metre.',
    dimensionsMetres: { width: runtime.width / 0.1, depth: runtime.depth / 0.1, groundHeight: 13.2, undergroundDepth: 7.2 },
    rooms: ROOM_DEFINITIONS.map((room) => ({ ...room })),
    state: cloneState(runtime.state),
    activeHotspots: getCerebrumLibraryHotspots(runtime.root),
    counts: {
      hotspots: runtime.hotspots.size,
      books: instanceCountMatching(runtime, /BOOK|BOOKS|BINDING/) + individualBooks,
      shelves: instanceCountMatching(runtime, /SHELV|SHELF/),
      lamps: instanceCountMatching(runtime, /LAMP|LIGHT/) + individualLamps,
      chairs: instanceCountMatching(runtime, /CHAIR/),
      windows: instanceCountMatching(runtime, /WINDOW/) + 2,
      pointLights: runtime.pointLights.length,
      shadowCastingLights: runtime.pointLights.filter((light) => light.castShadow).length,
    },
    performance: {
      quality: runtime.state.quality,
      instancedMeshes: runtime.instancedMeshes.length,
      visibleInstances,
      fullInstances,
      distantShelfContentsSimplified: runtime.state.quality !== 'high',
    },
    navigation: {
      maximumStepRiseWorldUnits: 0.034,
      maximumStepRiseMetres: 0.34,
      controllerStepLimitWorldUnits: 0.038,
      grandStairTreads: 20,
      occultumStairTreads: 22,
    },
    audio: {
      muted: runtime.state.muted,
      quietMode: runtime.state.quietMode,
      sources: runtime.audioMarkers.map((marker) => String(marker.userData.cerebrumAudioSource.id)),
      currentFootstepSurface: runtime.currentFootstepSurface,
    },
  };
}

export async function resumeCerebrumLibraryAudio(rootOrChild: THREE.Object3D) {
  const runtime = findRuntime(rootOrChild);
  if (!runtime || typeof window === 'undefined') return false;
  if (!runtime.audio) {
    const WindowAudioContext = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!WindowAudioContext) return false;
    const context = new WindowAudioContext();
    const master = context.createGain();
    const ambience = context.createGain();
    master.gain.value = runtime.state.muted ? 0 : runtime.state.quietMode ? 0.035 : 0.22;
    ambience.gain.value = 1;
    ambience.connect(master).connect(context.destination);

    const duration = 3;
    const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
    const channel = buffer.getChannelData(0);
    const random = seededRandom(runtime.seed + 900);
    let low = 0;
    for (let index = 0; index < channel.length; index += 1) {
      low = low * 0.975 + (random() * 2 - 1) * 0.025;
      channel[index] = low * 0.28 + (random() * 2 - 1) * 0.045;
    }
    const rainSource = context.createBufferSource();
    const rainFilter = context.createBiquadFilter();
    const rainGain = context.createGain();
    rainSource.buffer = buffer;
    rainSource.loop = true;
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 820;
    rainGain.gain.value = 0.16;
    rainSource.connect(rainFilter).connect(rainGain).connect(ambience);
    rainSource.start();

    const roomTone = context.createOscillator();
    const toneFilter = context.createBiquadFilter();
    const toneGain = context.createGain();
    roomTone.type = 'sine';
    roomTone.frequency.value = 47;
    toneFilter.type = 'lowpass';
    toneFilter.frequency.value = 105;
    toneGain.gain.value = 0.012;
    roomTone.connect(toneFilter).connect(toneGain).connect(ambience);
    roomTone.start();
    runtime.audio = { context, master, ambience, rainSource, roomTone };
  }
  await runtime.audio.context.resume();
  return true;
}

export function notifyCerebrumLibraryFootstep(rootOrChild: THREE.Object3D, surface: CerebrumLibrarySurface) {
  const runtime = findRuntime(rootOrChild);
  if (!runtime) return false;
  runtime.currentFootstepSurface = surface;
  runtime.root.userData.lastFootstepSurface = surface;
  const profile = surface === 'stone'
    ? { duration: 0.055, frequency: 1160, volume: 0.035 }
    : surface === 'wood'
      ? { duration: 0.075, frequency: 520, volume: 0.028 }
      : { duration: 0.09, frequency: 210, volume: 0.016 };
  playNoiseBurst(runtime, profile.duration, profile.frequency, profile.volume);
  return true;
}

export function disposeCerebrumLibrary(rootOrChild: THREE.Object3D) {
  const runtime = findRuntime(rootOrChild);
  if (!runtime) return false;
  if (runtime.audio) {
    try { runtime.audio.rainSource.stop(); } catch { /* already stopped */ }
    try { runtime.audio.roomTone.stop(); } catch { /* already stopped */ }
    void runtime.audio.context.close();
  }
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  runtime.root.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.InstancedMesh)) return;
    geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
    objectMaterials.forEach((material) => materials.add(material));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => {
    const map = (material as THREE.MeshStandardMaterial).map;
    map?.dispose();
    material.dispose();
  });
  const host = runtime.root.parent;
  runtime.root.removeFromParent();
  libraryRuntimes.delete(runtime.root);
  host?.children.forEach((child) => child.traverse((legacy) => {
    if ('cerebrumLegacyVisible' in legacy.userData) {
      legacy.visible = legacy.userData.cerebrumLegacyVisible !== false;
      delete legacy.userData.cerebrumLegacyVisible;
    }
    if ('cerebrumLegacyWalkable' in legacy.userData) {
      legacy.userData.walkable = legacy.userData.cerebrumLegacyWalkable === true;
      delete legacy.userData.cerebrumLegacyWalkable;
    }
  }));
  return true;
}
