import * as THREE from 'three';

/**
 * Compatibility-only surface for projects saved before Academic interiors were
 * removed. No geometry, controls, audio graph, navigation, or persistence state
 * is constructed by this module.
 */
export const CEREBRUM_WORLD_UNITS_PER_METRE = 0.1;
export const CEREBRUM_LIBRARY_ROOT_NAME = 'CEREBRUM_LIBRARY__REMOVED';
export const CEREBRUM_OCCULTUM_NAME = 'Cerebrum Occultum';

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
  | 'door' | 'drawer' | 'rolling-ladder' | 'table-lamp' | 'book'
  | 'card-catalogue' | 'quiet-mode' | 'mute' | 'orbit-camera';
export type CerebrumLibraryAction =
  | 'toggle-door' | 'toggle-drawer' | 'pull-ladder' | 'toggle-lamp'
  | 'inspect-book' | 'search-card-catalogue' | 'toggle-quiet-mode'
  | 'toggle-mute' | 'toggle-orbit-camera';

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
  selectableId?: string;
  width?: number;
  depth?: number;
  quality?: CerebrumLibraryQuality;
  seed?: number;
  quietMode?: boolean;
  muted?: boolean;
  hideLegacyShell?: boolean;
}

export interface CerebrumLibrarySnapshot {
  available: false;
  phase: 'removed';
  mounted: false;
  dimensionsMetres: { width: 0; depth: 0; groundHeight: 0; undergroundDepth: 0 };
  state: CerebrumLibraryState;
  activeHotspots: [];
  counts: {
    hotspots: 0; books: 0; shelves: 0; lamps: 0; chairs: 0;
    windows: 0; pointLights: 0; shadowCastingLights: 0;
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

export type CerebrumLibraryCameraPresetId =
  | 'entrance' | 'reading-room' | 'stacks' | 'occultum' | 'rare-book-room' | 'architectural-orbit';
export interface CerebrumLibraryCameraPreset {
  id: CerebrumLibraryCameraPresetId;
  label: string;
  level: CerebrumLibraryLevel;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  cutaway: boolean;
}

function removedState(quality: CerebrumLibraryQuality = 'medium'): CerebrumLibraryState {
  return {
    quality,
    navigationLevel: 'ground',
    quietMode: true,
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
  };
}

export function createCerebrumLibraryInterior(_host: THREE.Group, options: CerebrumLibraryBuildOptions = {}) {
  const removed = new THREE.Group();
  removed.name = CEREBRUM_LIBRARY_ROOT_NAME;
  removed.visible = false;
  removed.userData.available = false;
  removed.userData.phase = 'removed';
  removed.userData.state = removedState(options.quality);
  return removed;
}

export const buildCerebrumLibraryInterior = createCerebrumLibraryInterior;
export function resolveCerebrumLibraryHotspot(_object: THREE.Object3D): CerebrumLibraryHotspot | null { return null; }
export function getCerebrumLibraryHotspots(_root: THREE.Object3D): CerebrumLibraryHotspot[] { return []; }
export function getCerebrumLibraryState(root: THREE.Object3D) {
  return (root.userData.state as CerebrumLibraryState | undefined) ?? removedState();
}
export function restoreCerebrumLibraryState(_root: THREE.Object3D, _saved: Partial<CerebrumLibraryState>) {}
export function performCerebrumLibraryInteraction(root: THREE.Object3D, _hotspotId: string): CerebrumLibraryInteractionResult {
  return { handled: false, message: 'Academic interiors have been removed.', state: getCerebrumLibraryState(root) };
}
export function configureCerebrumLibraryQuality(root: THREE.Object3D, quality: CerebrumLibraryQuality) {
  root.userData.state = removedState(quality);
}
export function setCerebrumLibraryNavigationLevel(_root: THREE.Object3D, _level: CerebrumLibraryLevel) {}
export function setCerebrumLibraryCutaway(_root: THREE.Object3D, _visible: boolean) {}
export function setCerebrumLibraryQuietMode(_root: THREE.Object3D, _enabled: boolean) {}
export function setCerebrumLibraryMuted(_root: THREE.Object3D, _muted: boolean) {}
export function setCerebrumLibraryOrbitMode(_root: THREE.Object3D, _enabled: boolean) {}
export function getCerebrumLibraryCameraPreset(
  _root: THREE.Object3D,
  _id: CerebrumLibraryCameraPresetId,
): CerebrumLibraryCameraPreset | null { return null; }
export function getCerebrumLibraryOrbitPreset(_root: THREE.Object3D): CerebrumLibraryOrbitPreset {
  return { target: [0, 0, 0], position: [0, 0, 0], minDistance: 0, maxDistance: 0, fov: 42, cutaway: true };
}
export function isPointInsideCerebrumLibrary(_root: THREE.Object3D, _point: THREE.Vector3, _space: 'world' | 'local' = 'world') { return false; }
export function getCerebrumLibraryRoomAt(_root: THREE.Object3D, _point: THREE.Vector3, _space: 'world' | 'local' = 'world'): CerebrumLibraryRoomId | null { return null; }
export function updateCerebrumLibrary(_root: THREE.Object3D, _deltaSeconds: number, _camera?: THREE.Camera) {}
export function getCerebrumLibrarySnapshot(root: THREE.Object3D): CerebrumLibrarySnapshot {
  return {
    available: false,
    phase: 'removed',
    mounted: false,
    dimensionsMetres: { width: 0, depth: 0, groundHeight: 0, undergroundDepth: 0 },
    state: getCerebrumLibraryState(root),
    activeHotspots: [],
    counts: { hotspots: 0, books: 0, shelves: 0, lamps: 0, chairs: 0, windows: 0, pointLights: 0, shadowCastingLights: 0 },
  };
}
export function notifyCerebrumLibraryFootstep(_root: THREE.Object3D, _surface: CerebrumLibrarySurface) {}
export function disposeCerebrumLibrary(root: THREE.Object3D) { root.removeFromParent(); }
