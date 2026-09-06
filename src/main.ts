import * as THREE from 'three';
import './style.css';
import { Zip, ZipPassThrough } from 'fflate';
import { biomes, districts } from './data/districts';
import {
  ACADEMIC_CAMPUS_BUILDINGS,
  type AcademicCampusBuilding,
} from './data/academicCampus';
import {
  createAcademicBuildingDefinition,
  createEntryLogisticsBuildingDefinition,
  createWelcomePoolDefinition,
  IslandWorld,
  OBJECT_INTERACTIONS_ENABLED,
  type EditorAssetDefinition,
  type GizmoMode,
  type GraphicsQuality,
  type ImportedDefinition,
  type ObjectState,
  type SceneDefinition,
  type SceneLayer,
  type ViewMode,
  type WeatherMode,
} from './world/IslandWorld';
import { EDITOR_ASSET_CATALOG, type EditorWorkspace } from './world/editorAssets';
import { ENTRY_LOGISTICS_BUILDING_PROGRAM } from './world/entryLogisticsDistrict';

declare global {
  interface Window {
    render_game_to_text: () => string;
    advanceTime: (milliseconds: number) => void;
    labIsland: IslandWorld;
  }
}

const required = <T extends HTMLElement>(selector: string) => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required UI element: ${selector}`);
  return element;
};

interface ProductionOutputSink {
  mode: 'directory' | 'zip';
  packageName: string;
  write: (path: string, data: Blob) => Promise<void>;
  finalize: () => Promise<void>;
}

function downloadBrowserFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function productionPackageName() {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '_');
  return `YouTopy_Production_${timestamp}`;
}

async function createProductionOutputSink(): Promise<ProductionOutputSink> {
  const packageName = productionPackageName();
  const showDirectoryPicker = (window as Window & {
    showDirectoryPicker?: (options?: Record<string, unknown>) => Promise<any>;
  }).showDirectoryPicker;

  if (typeof showDirectoryPicker === 'function') {
    const parent = await showDirectoryPicker.call(window, {
      id: 'youtopy-production-export',
      mode: 'readwrite',
      startIn: 'downloads',
    });
    const packageDirectory = await parent.getDirectoryHandle(packageName, { create: true });
    return {
      mode: 'directory',
      packageName,
      write: async (path, data) => {
        const parts = path.split('/').filter(Boolean);
        const filename = parts.pop();
        if (!filename) throw new Error(`Invalid Production export path: ${path}`);
        let directory = packageDirectory;
        for (const part of parts) {
          directory = await directory.getDirectoryHandle(part, { create: true });
        }
        const file = await directory.getFileHandle(filename, { create: true });
        const writable = await file.createWritable();
        await writable.write(data);
        await writable.close();
      },
      finalize: async () => undefined,
    };
  }

  // Firefox/Safari fallback: stream entries into one ZIP so the browser only
  // needs to approve a single download while all GLBs stay separate inside it.
  const chunks: ArrayBuffer[] = [];
  let archive!: Zip;
  const completed = new Promise<Blob>((resolve, reject) => {
    archive = new Zip((error, data, final) => {
      if (error) {
        reject(error);
        return;
      }
      const chunk = new Uint8Array(data.byteLength);
      chunk.set(data);
      chunks.push(chunk.buffer);
      if (final) resolve(new Blob(chunks, { type: 'application/zip' }));
    });
  });
  return {
    mode: 'zip',
    packageName,
    write: async (path, data) => {
      const entry = new ZipPassThrough(`${packageName}/${path}`);
      archive.add(entry);
      entry.push(new Uint8Array(await data.arrayBuffer()), true);
    },
    finalize: async () => {
      archive.end();
      const blob = await completed;
      downloadBrowserFile(blob, `${packageName}.zip`);
    },
  };
}

const app = required<HTMLElement>('#app');

const syncAppToVisualViewport = () => {
  const visualViewport = window.visualViewport;
  const magnification = Math.max(1, visualViewport?.scale ?? 1);
  const width = visualViewport ? visualViewport.width * magnification : window.innerWidth;
  const height = visualViewport ? visualViewport.height * magnification : window.innerHeight;

  app.style.setProperty('--app-viewport-left', `${visualViewport?.offsetLeft ?? 0}px`);
  app.style.setProperty('--app-viewport-top', `${visualViewport?.offsetTop ?? 0}px`);
  app.style.setProperty('--app-viewport-width', `${width}px`);
  app.style.setProperty('--app-viewport-height', `${height}px`);
  app.style.setProperty('--app-viewport-scale', `${1 / magnification}`);
  app.dataset.viewportMagnification = magnification.toFixed(4);
};

let viewportSyncFrame = 0;
const scheduleAppViewportSync = () => {
  if (viewportSyncFrame) return;
  viewportSyncFrame = window.requestAnimationFrame(() => {
    viewportSyncFrame = 0;
    syncAppToVisualViewport();
  });
};

syncAppToVisualViewport();
window.addEventListener('resize', scheduleAppViewportSync, { passive: true });
window.visualViewport?.addEventListener('resize', scheduleAppViewportSync, { passive: true });
window.visualViewport?.addEventListener('scroll', scheduleAppViewportSync, { passive: true });

const viewport = required<HTMLElement>('#viewport');
const districtList = required<HTMLElement>('#district-list');
const districtSearch = required<HTMLInputElement>('#district-search');
const inspectorTitle = required<HTMLElement>('#inspector-title');
const selectionIndex = required<HTMLElement>('#selection-index');
const emptyInspector = required<HTMLElement>('#empty-inspector');
const inspectorContent = required<HTMLElement>('#inspector-content');
const selectionKind = required<HTMLElement>('#selection-kind');
const selectionDescription = required<HTMLElement>('#selection-description');
const objectNameInput = required<HTMLInputElement>('#object-name');
const objectLabelInput = required<HTMLInputElement>('#object-label');
const objectDescriptionInput = required<HTMLTextAreaElement>('#object-description');
const objectInscriptionField = required<HTMLElement>('#object-inscription-field');
const objectInscriptionInput = required<HTMLInputElement>('#object-inscription');
const selectionRing = required<HTMLElement>('#selection-ring');
const selectionArchetype = required<HTMLElement>('#selection-archetype');
const buildingNavigation = required<HTMLElement>('#building-navigation');
const previousBuildingButton = required<HTMLButtonElement>('#previous-building');
const nextBuildingButton = required<HTMLButtonElement>('#next-building');
const buildingNavigationPosition = required<HTMLElement>('#building-navigation-position');
const positionInputs = {
  x: required<HTMLInputElement>('#pos-x'),
  y: required<HTMLInputElement>('#pos-y'),
  z: required<HTMLInputElement>('#pos-z'),
};
const rotationInput = required<HTMLInputElement>('#rot-y');
const rotationOutput = required<HTMLOutputElement>('#rot-output');
const scaleInput = required<HTMLInputElement>('#scale-uniform');
const scaleOutput = required<HTMLElement>('#scale-output');
const buildingAxisScaleField = required<HTMLElement>('#building-axis-scale');
const axisScaleInputs = {
  x: required<HTMLInputElement>('#scale-x'),
  y: required<HTMLInputElement>('#scale-y'),
  z: required<HTMLInputElement>('#scale-z'),
};
const primaryColorInput = required<HTMLInputElement>('#primary-color');
const secondaryColorInput = required<HTMLInputElement>('#secondary-color');
const accentInput = required<HTMLInputElement>('#accent-color');
const patternTypeSelect = required<HTMLSelectElement>('#pattern-type');
const patternScaleInput = required<HTMLInputElement>('#pattern-scale');
const patternScaleOutput = required<HTMLElement>('#pattern-scale-output');
const visibilityInput = required<HTMLInputElement>('#object-visible');
const collisionInput = required<HTMLInputElement>('#object-collision');
const interactionOptionsContainer = required<HTMLElement>('#interaction-options');
const saveProjectButton = required<HTMLButtonElement>('#save-project');
const refreshProjectButton = required<HTMLButtonElement>('#refresh-project');
const reloadCurrentBuildButton = required<HTMLButtonElement>('#reload-current-build');
const restoreWelcomeDistrictButton = required<HTMLButtonElement>('#restore-welcome-district');
const projectBundleExportButton = required<HTMLButtonElement>('#project-bundle-export');
const projectBundleImportButton = required<HTMLButtonElement>('#project-bundle-import');
const projectBundleInput = required<HTMLInputElement>('#project-bundle-file');
const relinkMissingAssetsButton = required<HTMLButtonElement>('#relink-missing-assets');
const themeToggleButton = required<HTMLButtonElement>('#toggle-theme');
const undoActionButton = required<HTMLButtonElement>('#undo-action');
const envTimeSelect = required<HTMLSelectElement>('#env-time');
const envWeatherSelect = required<HTMLSelectElement>('#env-weather');
const envSeasonSelect = required<HTMLSelectElement>('#env-season');
const atmosphereToggleButton = required<HTMLButtonElement>('#atmosphere-toggle');
const atmosphereMenu = required<HTMLElement>('#atmosphere-menu');
const atmosphereMenuCloseButton = required<HTMLButtonElement>('#atmosphere-menu-close');
const corporatePlazaLightStrengthInput = required<HTMLInputElement>('#corporate-plaza-light-strength');
const corporatePlazaLightStrengthOutput = required<HTMLOutputElement>('#corporate-plaza-light-strength-output');
const envQualitySelect = required<HTMLSelectElement>('#env-quality');
const fullIslandDetailInput = required<HTMLInputElement>('#full-island-detail');
const fullIslandDetailStatus = required<HTMLElement>('#full-island-detail-status');
const fullIslandDetailMonitor = required<HTMLElement>('#full-island-detail-monitor');
const fullIslandStatusChip = required<HTMLButtonElement>('#full-island-status-chip');
const fullIslandStatusChipLabel = required<HTMLElement>('#full-island-status-chip-label');
const fullIslandStatusCard = required<HTMLElement>('#full-island-status-card');
const fullIslandStatusClose = required<HTMLButtonElement>('#full-island-status-close');
const fullIslandStatusProgress = required<HTMLProgressElement>('#full-island-status-progress');
const fullIslandStatusProgressLabel = required<HTMLElement>('#full-island-status-progress-label');
const fullIslandStatusSummary = required<HTMLElement>('#full-island-status-summary');
const fullIslandStatusAnnouncer = required<HTMLElement>('#full-island-status-announcer');
const fullIslandRenderer = required<HTMLElement>('#full-island-renderer');
const fullIslandBackend = required<HTMLElement>('#full-island-backend');
const fullIslandDpr = required<HTMLElement>('#full-island-dpr');
const fullIslandCpuP95 = required<HTMLElement>('#full-island-cpu-p95');
const fullIslandGpuP95 = required<HTMLElement>('#full-island-gpu-p95');
const fullIslandDrawCalls = required<HTMLElement>('#full-island-draw-calls');
const fullIslandTriangles = required<HTMLElement>('#full-island-triangles');
const fullIslandMemory = required<HTMLElement>('#full-island-memory');
const fullIslandFailures = required<HTMLElement>('#full-island-failures');
const fullIslandRetryButton = required<HTMLButtonElement>('#full-island-retry');
const fullIslandLowerQualityButton = required<HTMLButtonElement>('#full-island-lower-quality');
const fullIslandReturnStreamedButton = required<HTMLButtonElement>('#full-island-return-streamed');
const fullIslandSafeSessionButton = required<HTMLButtonElement>('#full-island-safe-session');
const academicAudioButton = required<HTMLButtonElement>('#academic-audio-toggle');
const performanceButton = required<HTMLButtonElement>('#performance-toggle');
const debugButton = required<HTMLButtonElement>('#debug-toggle');
const debugStats = required<HTMLElement>('#debug-stats');
const fountainControlPanel = required<HTMLElement>('#fountain-control-panel');
const fountainControlExit = required<HTMLButtonElement>('#fountain-control-exit');
const fountainControlSummary = required<HTMLElement>('#fountain-control-summary');
const fountainControlState = required<HTMLElement>('#fountain-control-state');
const fountainSceneModeSelect = required<HTMLSelectElement>('#fountain-scene-mode');
const fountainStatueMaterialSelect = required<HTMLSelectElement>('#fountain-statue-material');
const fountainCameraPresetSelect = required<HTMLSelectElement>('#fountain-camera-preset');
const fountainQualitySelect = required<HTMLSelectElement>('#fountain-quality');
const fountainWaterToggle = required<HTMLButtonElement>('#fountain-water-toggle');
const fountainWaterFlow = required<HTMLInputElement>('#fountain-water-flow');
const fountainWaterFlowOutput = required<HTMLOutputElement>('#fountain-water-flow-output');
const fountainInfinityLight = required<HTMLButtonElement>('#fountain-infinity-light');
const fountainCutaway = required<HTMLButtonElement>('#fountain-cutaway');
const fountainGeometryGrid = required<HTMLButtonElement>('#fountain-geometry-grid');
const fountainCameraReset = required<HTMLButtonElement>('#fountain-camera-reset');
const fountainAudioLink = required<HTMLButtonElement>('#fountain-audio-link');
const fountainFullscreenLink = required<HTMLButtonElement>('#fountain-fullscreen-link');
const academicBuildingCard = required<HTMLElement>('#academic-building-card');
const academicBuildingTitle = required<HTMLElement>('#academic-building-title');
const academicBuildingMeta = required<HTMLElement>('#academic-building-meta');
const academicBuildingDescription = required<HTMLElement>('#academic-building-description');
const academicHistoryEditor = required<HTMLTextAreaElement>('#academic-history-editor');
const academicBuildingClose = required<HTMLButtonElement>('#academic-building-close');
const academicHistorySave = required<HTMLButtonElement>('#academic-history-save');
const academicCampusMap = required<HTMLElement>('#academic-campus-map');
const academicMapMarkers = required<HTMLElement>('#academic-map-markers');
const academicMapClose = required<HTMLButtonElement>('#academic-map-close');
const editStudioCollapseButton = required<HTMLButtonElement>('#edit-studio-collapse');
const saveInspectorChangesButton = required<HTMLButtonElement>('#save-inspector-changes');
const walkInteractionMenu = required<HTMLElement>('#walk-interaction-menu');
let pendingCatalogAssetId: string | null = null;
const walkInteractionMenuTitle = required<HTMLElement>('#interaction-menu-title');
const walkInteractionButtonsContainer = required<HTMLElement>('#interaction-menu-buttons');
const walkInteractionMenuCloseButton = required<HTMLButtonElement>('#close-interaction-menu');
const loadingScreen = required<HTMLElement>('#loading-screen');
const loadingStatus = required<HTMLElement>('#loading-status');
const sceneCardTitle = required<HTMLElement>('#scene-card-title');
const sceneCardCopy = required<HTMLElement>('#scene-card-copy');
const toastRegion = required<HTMLElement>('#toast-region');
const atlas = required<HTMLElement>('#atlas-panel');
const inspector = required<HTMLElement>('#inspector-panel');
const importInput = required<HTMLInputElement>('#mesh-file');
const importTrigger = required<HTMLButtonElement>('#import-trigger');
const timeToggle = required<HTMLButtonElement>('#toggle-time');
const walkHud = required<HTMLElement>('#walk-hud');
const walkLookButton = required<HTMLButtonElement>('#walk-look-button');
const walkTurboButton = required<HTMLButtonElement>('#walk-turbo');
const walkSpeedInput = required<HTMLInputElement>('#walk-speed-kmh');
const walkHudCollapseButton = required<HTMLButtonElement>('#walk-hud-collapse');
const walkReadout = required<HTMLElement>('.walk-readout');
const walkStatus = required<HTMLElement>('#walk-status');
const editWorkspacePanel = required<HTMLElement>('#edit-workspace');
const editLandscapeButton = required<HTMLButtonElement>('#edit-landscape');
const editInteriorButton = required<HTMLButtonElement>('#edit-interior');
const assetCategory = required<HTMLSelectElement>('#asset-category');
const assetSearch = required<HTMLInputElement>('#asset-search');
const assetLibrary = required<HTMLElement>('#asset-library');
const addAssetButton = required<HTMLButtonElement>('#add-asset');
const deleteObjectButton = required<HTMLButtonElement>('#delete-object');
const enterInteriorButton = required<HTMLButtonElement>('#enter-interior');
const exitInteriorButton = required<HTMLButtonElement>('#exit-interior');
const editWorkspaceHint = required<HTMLElement>('[data-workspace-hint]');

const academicDistrictDefinition = districts.find(
  (definition) => definition.id === 'academic-libraries-theoretical-labs',
);
if (!academicDistrictDefinition) throw new Error('Academic District definition is missing');
const academicBuildingDefinitions = ACADEMIC_CAMPUS_BUILDINGS.map((record) => (
  createAcademicBuildingDefinition(record, academicDistrictDefinition)
));
const entryLogisticsBuildingDefinitions = ENTRY_LOGISTICS_BUILDING_PROGRAM.map((record) => {
  const district = districts.find((definition) => definition.id === record.districtId);
  if (!district) throw new Error(`Entry/Logistics parent district is missing: ${record.districtId}`);
  return createEntryLogisticsBuildingDefinition(record, district);
});
const entryCommercialDefinition = districts.find((definition) => definition.id === 'entry-commercial');
if (!entryCommercialDefinition) throw new Error('Entry / Commercial District definition is missing');
const welcomePoolDefinition = createWelcomePoolDefinition(entryCommercialDefinition);
const allDefinitions: SceneDefinition[] = [
  ...districts,
  ...academicBuildingDefinitions,
  ...entryLogisticsBuildingDefinitions,
  welcomePoolDefinition,
  ...biomes,
];
let staticEditableGroupCount = allDefinitions.length;
const definitionIndex = new Map<string, number>();
const listButtons = new Map<string, HTMLButtonElement>();
let currentSelection: SceneDefinition | null = null;
let currentMode: ViewMode = 'explore';
let activeGizmo: GizmoMode = 'translate';
let currentEditWorkspace: EditorWorkspace = 'landscape';
let selectedCatalogAssetId: string | null = null;
let assetSourceFilter = 'all';
let dragDepth = 0;
let queuedImportFiles: File[] | null = null;

type FountainSceneMode = 'presentation' | 'courtyard' | 'night';
type FountainStatueMaterial = 'bronze' | 'dark-stone' | 'hybrid';
type FountainCameraPreset = 'hero' | 'low-angle' | 'top-down' | 'side-profile';
type FountainPanelState = {
  sceneMode: FountainSceneMode;
  statueMaterial: FountainStatueMaterial;
  cameraPreset: FountainCameraPreset;
  waterOn: boolean;
  requestedWaterFlow: number;
  waterFlow: number;
  infinityLightOn: boolean;
  cutawayVisible: boolean;
  geometryGridVisible: boolean;
};

const categoryNames: Record<string, string> = {
  core: 'Central landmark',
  bioscience: 'Life science',
  engineering: 'Engineering',
  chemistry: 'Chemistry',
  physics: 'Physics',
  civic: 'Civic & residential',
  commercial: 'Commercial',
  academic: 'Academic',
  'academic-building': 'Academic building',
  'entry-logistics-building': 'Entry / logistics building',
  'entry-logistics-landscape': 'Entry landscape object',
  'authored-exterior-building': 'Authored building',
  security: 'Restricted research',
  environmental: 'Environmental science',
  infrastructure: 'Operations',
  biome: 'Climate biome',
  imported: 'Imported asset',
  editor: 'Design studio asset',
  'authored-interior': 'Authored interior component',
};

const groupOrder = [
  'Core systems',
  'Life sciences',
  'Applied research',
  'Civic campus',
  'Operations & edge',
  'Biome domes',
  'Design studio assets',
  'Imported assets',
] as const;

type AtlasBuildingDefinition = Extract<SceneDefinition, {
  category: 'academic-building' | 'entry-logistics-building' | 'authored-exterior-building';
}>;

const expandedAtlasDistrictIds = new Set<string>();
const atlasReadinessBadges = new Map<string, HTMLElement>();

function isAtlasBuildingDefinition(definition: SceneDefinition): definition is AtlasBuildingDefinition {
  return definition.category === 'academic-building'
    || definition.category === 'entry-logistics-building'
    || definition.category === 'authored-exterior-building';
}

function definitionMatchesAtlasQuery(definition: SceneDefinition, normalizedQuery: string) {
  if (!normalizedQuery) return true;
  return `${definition.name} ${definition.label ?? ''} ${definition.sourceLabel ?? ''} ${definition.description} ${definition.category} ${definition.archetype}`
    .toLowerCase()
    .includes(normalizedQuery);
}

function getAtlasGroup(definition: SceneDefinition): (typeof groupOrder)[number] {
  if (isAtlasBuildingDefinition(definition)) {
    const parent = allDefinitions.find((candidate) => candidate.id === definition.parentDistrictId);
    return parent ? getAtlasGroup(parent) : 'Applied research';
  }
  if (definition.category === 'core') return 'Core systems';
  if (definition.category === 'bioscience') return 'Life sciences';
  if (['engineering', 'chemistry', 'physics'].includes(definition.category)) return 'Applied research';
  if (['civic', 'commercial', 'academic', 'academic-building', 'entry-logistics-landscape'].includes(definition.category)) return 'Civic campus';
  if (['security', 'environmental', 'infrastructure', 'entry-logistics-building'].includes(definition.category)) return 'Operations & edge';
  if (definition.category === 'biome') return 'Biome domes';
  if (definition.category === 'editor') return 'Design studio assets';
  return 'Imported assets';
}

function symbolFor(definition: SceneDefinition) {
  const symbols: Record<string, string> = {
    core: '◉',
    bioscience: 'B',
    engineering: 'E',
    chemistry: 'C',
    physics: 'P',
    civic: 'H',
    commercial: 'M',
    academic: 'A',
    'academic-building': 'B',
    'entry-logistics-building': 'L',
    'entry-logistics-landscape': 'P',
    'authored-exterior-building': 'B',
    security: 'S',
    environmental: 'N',
    infrastructure: 'I',
    biome: '○',
    imported: '+',
    editor: 'D',
  };
  return symbols[definition.category] ?? '·';
}

function escapeHtml(value: string) {
  const element = document.createElement('div');
  element.textContent = value;
  return element.innerHTML;
}

function prioritizeAtlasDefinition(definition: SceneDefinition) {
  const packageId = isAtlasBuildingDefinition(definition) ? definition.parentDistrictId : definition.id;
  fullIslandUiWorld.prioritizeFullIslandPackage?.(packageId);
}

function createAtlasButton(
  definition: SceneDefinition,
  index: number,
  options: { child?: boolean; readinessPackageId?: string } = {},
) {
  const button = document.createElement('button');
  button.className = options.child ? 'district-item district-building-item' : 'district-item';
  button.dataset.id = definition.id;
  button.style.setProperty('--item-accent', definition.accent);
  button.innerHTML = `
    <span class="district-symbol">${escapeHtml(symbolFor(definition))}</span>
    <span class="district-item-copy">
      <strong>${escapeHtml(definition.name)}</strong>
      <small>${escapeHtml(categoryNames[definition.category] ?? definition.category)}</small>
    </span>
    <span class="atlas-row-meta">
      ${options.readinessPackageId ? `<span class="atlas-readiness" data-atlas-package-readiness="${escapeHtml(options.readinessPackageId)}">Proxy</span>` : ''}
      <span class="district-item-index">${String(index).padStart(2, '0')}</span>
    </span>
  `;
  button.addEventListener('click', () => {
    prioritizeAtlasDefinition(definition);
    world.select(definition.id, 'ui');
    if (currentMode === 'explore') {
      world.focus(definition.id);
      syncFountainControlPanel();
    }
  });
  button.addEventListener('dblclick', () => {
    prioritizeAtlasDefinition(definition);
    world.focus(definition.id);
    syncFountainControlPanel();
  });
  return button;
}

function syncAtlasReadiness(snapshot = world.getStreamingSnapshot()) {
  const packageMap = new Map(snapshot.packages.map((pkg) => [pkg.id, pkg]));
  atlasReadinessBadges.forEach((badge, packageId) => {
    const pkg = packageMap.get(packageId);
    if (!pkg) {
      badge.hidden = true;
      return;
    }
    badge.hidden = false;
    let label: string;
    let state: string;
    if (snapshot.fullIslandDetailRequested) {
      state = pkg.lifecyclePhase;
      label = pkg.lifecyclePhase === 'warming-gpu'
        ? 'Warming'
        : pkg.lifecyclePhase === 'building'
          ? 'Building'
          : pkg.lifecyclePhase === 'ready'
            ? 'Ready'
            : pkg.lifecyclePhase === 'error'
              ? 'Error'
              : pkg.lifecyclePhase === 'degraded'
                ? 'Slow'
                : 'Queued';
    } else if (pkg.loadState === 'error') {
      state = 'error';
      label = 'Error';
    } else if (pkg.detailResident && pkg.visualLevel === 'detail') {
      state = 'detail';
      label = 'Detail';
    } else {
      state = pkg.visualLevel;
      label = pkg.visualLevel === 'mid' ? 'Mid' : 'Far';
    }
    badge.dataset.state = state;
    badge.textContent = label;
    badge.title = `${packageId}: ${label}`;
  });
}

function scrollAtlasElementIntoView(element: HTMLElement, behavior: ScrollBehavior = 'auto') {
  const viewportBounds = districtList.getBoundingClientRect();
  const elementBounds = element.getBoundingClientRect();
  let delta = 0;
  if (elementBounds.top < viewportBounds.top) delta = elementBounds.top - viewportBounds.top - 6;
  else if (elementBounds.bottom > viewportBounds.bottom) delta = elementBounds.bottom - viewportBounds.bottom + 6;
  if (delta !== 0) districtList.scrollBy({ top: delta, behavior });
}

function syncAtlasBuildingBrowserMode() {
  atlas.classList.toggle(
    'building-browser-active',
    Boolean(districtList.querySelector('.atlas-expand-toggle[aria-expanded="true"]')),
  );
}

function renderAtlas(query = '') {
  const normalizedQuery = query.trim().toLowerCase();
  const childrenByParent = new Map<string, AtlasBuildingDefinition[]>();
  allDefinitions.forEach((definition) => {
    if (!isAtlasBuildingDefinition(definition)) return;
    const children = childrenByParent.get(definition.parentDistrictId) ?? [];
    children.push(definition);
    childrenByParent.set(definition.parentDistrictId, children);
  });
  type AtlasDistrictEntry = { definition: SceneDefinition; children: AtlasBuildingDefinition[] };
  const grouped = new Map<string, AtlasDistrictEntry[]>();
  groupOrder.forEach((group) => grouped.set(group, []));
  allDefinitions.forEach((definition) => {
    if (isAtlasBuildingDefinition(definition)) return;
    const children = childrenByParent.get(definition.id) ?? [];
    const matchingChildren = normalizedQuery
      ? children.filter((child) => definitionMatchesAtlasQuery(child, normalizedQuery))
      : children;
    if (normalizedQuery && !definitionMatchesAtlasQuery(definition, normalizedQuery) && matchingChildren.length === 0) return;
    grouped.get(getAtlasGroup(definition))!.push({ definition, children: matchingChildren });
  });
  districtList.innerHTML = '';
  listButtons.clear();
  atlasReadinessBadges.clear();
  const streamingPackageIds = new Set(world.getStreamingSnapshot().packages.map((pkg) => pkg.id));
  grouped.forEach((entries, groupName) => {
    if (!entries.length) return;
    const group = document.createElement('section');
    group.className = 'district-group';
    const title = document.createElement('div');
    title.className = 'district-group-title';
    title.innerHTML = `<span>${escapeHtml(groupName)}</span><span>${String(entries.length).padStart(2, '0')}</span>`;
    group.appendChild(title);
    entries.forEach(({ definition, children }) => {
      const index = definitionIndex.get(definition.id) ?? allDefinitions.indexOf(definition) + 1;
      const node = document.createElement('div');
      node.className = 'atlas-district-node';
      node.dataset.districtId = definition.id;
      const row = document.createElement('div');
      row.className = 'atlas-district-row';
      const readinessPackageId = streamingPackageIds.has(definition.id) ? definition.id : undefined;
      const button = createAtlasButton(definition, index, { readinessPackageId });
      if (definition.id === currentSelection?.id) button.classList.add('active');
      listButtons.set(definition.id, button);
      row.appendChild(button);
      const readinessBadge = button.querySelector<HTMLElement>('[data-atlas-package-readiness]');
      if (readinessBadge && readinessPackageId) atlasReadinessBadges.set(readinessPackageId, readinessBadge);
      if (children.length > 0) {
        const childListId = `atlas-buildings-${definition.id}`;
        const autoExpanded = Boolean(normalizedQuery);
        const expanded = autoExpanded || expandedAtlasDistrictIds.has(definition.id);
        const expandButton = document.createElement('button');
        expandButton.type = 'button';
        expandButton.className = 'atlas-expand-toggle';
        expandButton.setAttribute('aria-expanded', String(expanded));
        expandButton.setAttribute('aria-controls', childListId);
        expandButton.setAttribute('aria-label', `${expanded ? 'Collapse' : 'Expand'} ${definition.name} buildings`);
        expandButton.innerHTML = `<span aria-hidden="true">›</span><span class="visually-hidden">${expanded ? 'Collapse' : 'Expand'} buildings</span>`;
        row.appendChild(expandButton);
        const childList = document.createElement('div');
        childList.id = childListId;
        childList.className = 'district-building-list';
        childList.hidden = !expanded;
        children.forEach((child) => {
          const childIndex = definitionIndex.get(child.id) ?? allDefinitions.indexOf(child) + 1;
          const childButton = createAtlasButton(child, childIndex, { child: true });
          if (child.id === currentSelection?.id) childButton.classList.add('active');
          listButtons.set(child.id, childButton);
          childList.appendChild(childButton);
        });
        expandButton.addEventListener('click', () => {
          const open = expandButton.getAttribute('aria-expanded') !== 'true';
          expandButton.setAttribute('aria-expanded', String(open));
          expandButton.setAttribute('aria-label', `${open ? 'Collapse' : 'Expand'} ${definition.name} buildings`);
          const hiddenCopy = expandButton.querySelector<HTMLElement>('.visually-hidden');
          if (hiddenCopy) hiddenCopy.textContent = `${open ? 'Collapse' : 'Expand'} buildings`;
          childList.hidden = !open;
          node.classList.toggle('expanded', open);
          if (open) {
            expandedAtlasDistrictIds.add(definition.id);
            window.requestAnimationFrame(() => {
              const firstBuilding = childList.querySelector<HTMLElement>('.district-building-item');
              if (firstBuilding) scrollAtlasElementIntoView(firstBuilding);
            });
          } else {
            expandedAtlasDistrictIds.delete(definition.id);
          }
          syncAtlasBuildingBrowserMode();
        });
        node.classList.toggle('expanded', expanded);
        node.append(row, childList);
      } else {
        node.appendChild(row);
      }
      group.appendChild(node);
    });
    districtList.appendChild(group);
  });
  if (!districtList.childElementCount) {
    districtList.innerHTML = '<div class="empty-search">No districts or buildings match this search.</div>';
  }
  syncAtlasBuildingBrowserMode();
  syncAtlasReadiness();
}

function previewClassForAsset(category: string, kind: string, workspace: EditorWorkspace) {
  if (workspace === 'interior') return 'asset-preview-interior';
  if (kind === 'building') return 'asset-preview-pavilion';
  if (/tree|veget|garden|canopy/i.test(category)) return 'asset-preview-canopy';
  if (/water/i.test(category)) return 'asset-preview-water';
  return 'asset-preview-terrain';
}

function renderAssetLibrary() {
  const catalog = world.getAssetCatalog(currentEditWorkspace);
  const categories = Array.from(new Set(catalog.map((item) => item.category))).sort();
  const previousCategory = assetCategory.value || 'all';
  assetCategory.innerHTML = [
    '<option value="all">All assets</option>',
    ...categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`),
  ].join('');
  assetCategory.value = categories.includes(previousCategory) ? previousCategory : 'all';
  const query = assetSearch.value.trim().toLowerCase();
  const visible = catalog.filter((item) => {
    if (assetSourceFilter === 'imported') return false;
    if (assetCategory.value !== 'all' && item.category !== assetCategory.value) return false;
    return !query || `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(query);
  });
  if (!visible.some((item) => item.id === selectedCatalogAssetId)) selectedCatalogAssetId = visible[0]?.id ?? null;
  assetLibrary.innerHTML = visible.length
    ? visible
        .map((item) => {
          const selected = item.id === selectedCatalogAssetId;
          const preview = previewClassForAsset(item.category, item.kind, item.workspace);
          return `
            <button class="asset-card${selected ? ' active' : ''}" type="button" role="option"
              aria-selected="${selected}" data-asset-id="${escapeHtml(item.id)}"
              data-asset-category="${escapeHtml(item.category)}" data-asset-source="procedural"
              style="--asset-accent:${escapeHtml(item.accent)}">
              <span class="asset-preview ${preview}" aria-hidden="true"><i></i><i></i><i></i></span>
              <span class="asset-card-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category)} · ${escapeHtml(item.kind)}</small></span>
            </button>`;
        })
        .join('')
    : '<div class="empty-search">No matching procedural assets. Use Import for a custom mesh.</div>';
  assetLibrary.querySelectorAll<HTMLButtonElement>('[data-asset-id]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedCatalogAssetId = button.dataset.assetId ?? null;
      assetLibrary.querySelectorAll<HTMLButtonElement>('[data-asset-id]').forEach((card) => {
        const selected = card === button;
        card.classList.toggle('active', selected);
        card.setAttribute('aria-selected', String(selected));
      });
      refreshEditWorkspaceUI();
    });
  });
  refreshEditWorkspaceUI();
}

function refreshEditWorkspaceUI() {
  const activeInteriorId = world.getActiveInteriorBuildingId();
  const insideInterior = Boolean(activeInteriorId);
  editWorkspacePanel.dataset.activeWorkspace = currentEditWorkspace;
  document.body.classList.toggle('interior-design-active', insideInterior);
  [editLandscapeButton, editInteriorButton].forEach((button) => {
    const active = button.dataset.editWorkspace === currentEditWorkspace;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  enterInteriorButton.hidden = currentEditWorkspace !== 'interior' || insideInterior;
  enterInteriorButton.disabled = !world.canEnterInterior(currentSelection?.id ?? null);
  exitInteriorButton.hidden = !insideInterior;
  deleteObjectButton.disabled = !currentSelection;
  addAssetButton.disabled = !selectedCatalogAssetId || (currentEditWorkspace === 'interior' && !insideInterior);
  editWorkspaceHint.textContent = insideInterior
    ? 'Inside the real building interior — select, move, rotate, elongate, import, add, or delete furnishings.'
    : currentEditWorkspace === 'interior'
      ? 'Select a building and choose Enter Interior. Authored interiors open directly; other buildings use an editable fallback room.'
      : 'Choose an asset, then add and position it anywhere on the island.';
}

function registerDynamicDefinition(definition: SceneDefinition) {
  if (!allDefinitions.some((entry) => entry.id === definition.id)) allDefinitions.push(definition);
  definitionIndex.set(definition.id, allDefinitions.length);
  renderAtlas(districtSearch.value);
}

function unregisterDynamicDefinition(id: string) {
  const index = allDefinitions.findIndex((definition) => definition.id === id);
  if (index >= 0) allDefinitions.splice(index, 1);
  definitionIndex.clear();
  allDefinitions.forEach((definition, definitionIndexValue) => definitionIndex.set(definition.id, definitionIndexValue + 1));
  renderAtlas(districtSearch.value);
  refreshEditWorkspaceUI();
}

function cacheLiveDefinition(definition: SceneDefinition) {
  const index = allDefinitions.findIndex((entry) => entry.id === definition.id);
  if (index >= 0) allDefinitions[index] = definition;
  if (currentSelection?.id === definition.id) currentSelection = definition;
}

function syncDefinitionCacheFromWorld() {
  world.getDefinitions().forEach((definition) => {
    if (definition.category === 'authored-interior') return;
    const index = allDefinitions.findIndex((candidate) => candidate.id === definition.id);
    if (index >= 0) allDefinitions[index] = definition;
    else allDefinitions.push(definition);
  });
  definitionIndex.clear();
  allDefinitions.forEach((definition, index) => definitionIndex.set(definition.id, index + 1));
  staticEditableGroupCount = allDefinitions.filter((definition) => definition.category !== 'imported').length;
  if (currentSelection) currentSelection = world.getDefinition(currentSelection.id);
  renderAtlas(districtSearch.value);
  refreshAcademicCampusMapMetadata();
}

function getBuildingSiblings(definition: SceneDefinition | null) {
  if (!definition || !isAtlasBuildingDefinition(definition)) return [];
  return allDefinitions.filter((candidate): candidate is AtlasBuildingDefinition => (
    isAtlasBuildingDefinition(candidate) && candidate.parentDistrictId === definition.parentDistrictId
  ));
}

function syncBuildingNavigation(definition: SceneDefinition | null) {
  const siblings = getBuildingSiblings(definition);
  const index = definition ? siblings.findIndex((candidate) => candidate.id === definition.id) : -1;
  const visible = index >= 0 && siblings.length > 0;
  buildingNavigation.hidden = !visible;
  if (!visible) {
    buildingNavigationPosition.textContent = 'No building selected';
    previousBuildingButton.disabled = true;
    nextBuildingButton.disabled = true;
    return;
  }
  buildingNavigationPosition.textContent = `Building ${index + 1} of ${siblings.length}`;
  previousBuildingButton.disabled = index === 0;
  nextBuildingButton.disabled = index === siblings.length - 1;
  previousBuildingButton.title = index > 0 ? `Previous: ${siblings[index - 1].name}` : 'First building in this district';
  nextBuildingButton.title = index < siblings.length - 1 ? `Next: ${siblings[index + 1].name}` : 'Last building in this district';
}

function navigateBuilding(offset: -1 | 1) {
  if (!currentSelection || !isAtlasBuildingDefinition(currentSelection)) return;
  const siblings = getBuildingSiblings(currentSelection);
  const index = siblings.findIndex((candidate) => candidate.id === currentSelection?.id);
  const target = siblings[index + offset];
  if (!target) return;
  expandedAtlasDistrictIds.add(target.parentDistrictId);
  if (districtSearch.value) districtSearch.value = '';
  renderAtlas();
  prioritizeAtlasDefinition(target);
  world.select(target.id, 'ui');
  if (currentMode === 'explore') {
    world.focus(target.id);
    syncFountainControlPanel();
  }
}

previousBuildingButton.addEventListener('click', () => navigateBuilding(-1));
nextBuildingButton.addEventListener('click', () => navigateBuilding(1));

function updateInspector(definition: SceneDefinition | null, state?: ObjectState | null) {
  currentSelection = definition;
  if (definition && isAtlasBuildingDefinition(definition) && !districtSearch.value) {
    const wasExpanded = expandedAtlasDistrictIds.has(definition.parentDistrictId);
    expandedAtlasDistrictIds.add(definition.parentDistrictId);
    if (!wasExpanded) renderAtlas();
  }
  document.body.classList.toggle('has-selection', Boolean(definition));
  listButtons.forEach((button, id) => button.classList.toggle('active', id === definition?.id));
  syncBuildingNavigation(definition);
  if (!definition) {
    inspectorTitle.textContent = 'No selection';
    selectionIndex.textContent = '—';
    emptyInspector.hidden = false;
    inspectorContent.hidden = true;
    buildingAxisScaleField.hidden = true;
    sceneCardTitle.textContent = 'Central research campus';
    sceneCardCopy.textContent = `${staticEditableGroupCount} editable scene groups · procedural architecture · Blender-ready GLB`;
    refreshEditWorkspaceUI();
    return;
  }
  const objectState = state ?? world.getObjectState(definition.id);
  inspectorTitle.textContent = definition.name;
  selectionIndex.textContent = `#${String(definitionIndex.get(definition.id) ?? allDefinitions.indexOf(definition) + 1).padStart(2, '0')}`;
  selectionKind.textContent = categoryNames[definition.category] ?? definition.category;
  selectionDescription.textContent = definition.description;
  objectNameInput.value = definition.name;
  objectLabelInput.value = definition.label?.trim() || definition.name;
  objectDescriptionInput.value = definition.description;
  const supportsInscription = definition.category === 'academic-building' && typeof definition.inscription === 'string';
  objectInscriptionField.hidden = !supportsInscription;
  objectInscriptionInput.value = supportsInscription ? definition.inscription ?? '' : '';
  selectionRing.textContent = definition.ring.replace('-', ' ');
  selectionArchetype.textContent = definition.archetype.replaceAll('-', ' ');
  emptyInspector.hidden = true;
  inspectorContent.hidden = false;
  sceneCardTitle.textContent = definition.name;
  buildingAxisScaleField.hidden = definition.category !== 'entry-logistics-building'
    && definition.category !== 'entry-logistics-landscape'
    && definition.category !== 'authored-interior'
    && !(definition.category === 'editor' && definition.workspace === 'interior')
    && !(definition.category === 'imported' && definition.workspace === 'interior');
  sceneCardCopy.textContent = `${categoryNames[definition.category] ?? definition.category} · ${definition.ring.replace('-', ' ')} · editable object group`;
  if (objectState) {
    updateTransformFields(objectState);
    updateCustomizationFields(objectState);
  }
  accentInput.value = definition.accent;
  const listButton = listButtons.get(definition.id);
  if (listButton) scrollAtlasElementIntoView(listButton, 'smooth');
  refreshEditWorkspaceUI();
}

function updateTransformFields(state: ObjectState) {
  positionInputs.x.value = state.position.x.toFixed(2);
  positionInputs.y.value = state.position.y.toFixed(2);
  positionInputs.z.value = state.position.z.toFixed(2);
  rotationInput.value = String(Math.round(state.rotationY));
  rotationOutput.value = `${Math.round(state.rotationY)}°`;
  scaleInput.value = state.scale.toFixed(2);
  scaleOutput.textContent = `${Math.round(state.scale * 100)}%`;
  axisScaleInputs.x.value = (state.scale3D?.x ?? 1).toFixed(2);
  axisScaleInputs.y.value = (state.scale3D?.y ?? 1).toFixed(2);
  axisScaleInputs.z.value = (state.scale3D?.z ?? 1).toFixed(2);
  visibilityInput.checked = state.visible;
}

function updateCustomizationFields(state: ObjectState) {
  primaryColorInput.value = state.primaryColor ?? '#ffffff';
  secondaryColorInput.value = state.secondaryColor ?? '#74858a';
  patternTypeSelect.value = state.patternType ?? 'solid';
  patternScaleInput.value = String(state.patternScale ?? 1.0);
  patternScaleOutput.textContent = `${Math.round((state.patternScale ?? 1.0) * 100)}%`;
  collisionInput.checked = state.collisionEnabled !== false;

  const interactions = state.interactions ?? [];
  interactionOptionsContainer.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = interactions.includes(checkbox.value);
  });
}

function toast(title: string, message: string, kind: 'normal' | 'error' = 'normal', duration = 3600) {
  const element = document.createElement('div');
  element.className = `toast${kind === 'error' ? ' error' : ''}`;
  element.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;
  toastRegion.appendChild(element);
  window.setTimeout(() => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(-6px)';
    window.setTimeout(() => element.remove(), 220);
  }, duration);
}

function syncAcademicAudioButtons() {
  const muted = world.isAcademicAudioMuted();
  academicAudioButton.setAttribute('aria-pressed', String(!muted));
  const label = academicAudioButton.querySelector<HTMLElement>('.utility-label');
  if (label) label.textContent = muted ? 'Audio muted' : 'Audio on';
}

function getFountainPanelState() {
  const snapshot = world.getTextSnapshot();
  return (snapshot.academicDistrict?.fountain?.state ?? null) as FountainPanelState | null;
}

function setFountainToggleState(button: HTMLButtonElement, active: boolean, onLabel: string, offLabel: string) {
  button.setAttribute('aria-pressed', String(active));
  button.textContent = active ? onLabel : offLabel;
}

function syncFountainControlPanel() {
  if (!OBJECT_INTERACTIONS_ENABLED) {
    fountainControlPanel.hidden = true;
    document.body.classList.remove('fountain-inspection-mode');
    return;
  }
  const inspectionActive = currentMode === 'explore' && world.isAcademicFountainInspectionActive();
  fountainControlPanel.hidden = !inspectionActive;
  document.body.classList.toggle('fountain-inspection-mode', inspectionActive);
  if (!inspectionActive) return;

  const state = getFountainPanelState();
  if (!state) {
    fountainControlPanel.hidden = true;
    document.body.classList.remove('fountain-inspection-mode');
    return;
  }

  const sceneLabels: Record<FountainSceneMode, string> = {
    presentation: 'Museum white',
    courtyard: 'Overcast courtyard',
    night: 'Rainy night',
  };
  const materialLabels: Record<FountainStatueMaterial, string> = {
    bronze: 'Bronze',
    'dark-stone': 'Dark stone',
    hybrid: 'Hybrid',
  };
  const cameraLabels: Record<FountainCameraPreset, string> = {
    hero: 'Hero',
    'low-angle': 'Low angle',
    'top-down': 'Top down',
    'side-profile': 'Side profile',
  };
  const targetFlow = Math.round((state.requestedWaterFlow ?? state.waterFlow) * 100);

  fountainSceneModeSelect.value = state.sceneMode;
  fountainStatueMaterialSelect.value = state.statueMaterial;
  fountainCameraPresetSelect.value = state.cameraPreset;
  fountainQualitySelect.value = world.getGraphicsQuality();
  fountainWaterFlow.value = String(targetFlow);
  fountainWaterFlowOutput.value = `${targetFlow}%`;
  fountainWaterFlowOutput.textContent = `${targetFlow}%`;
  setFountainToggleState(fountainWaterToggle, state.waterOn, 'Water on', 'Water off');
  setFountainToggleState(fountainInfinityLight, state.infinityLightOn, 'Infinity light on', 'Infinity light off');
  setFountainToggleState(fountainCutaway, state.cutawayVisible, 'Cutaway shown', 'Hydraulic cutaway');
  setFountainToggleState(fountainGeometryGrid, state.geometryGridVisible, 'Grid shown', 'Construction grid');

  const audioOn = !world.isAcademicAudioMuted();
  fountainAudioLink.setAttribute('aria-pressed', String(audioOn));
  fountainAudioLink.textContent = audioOn ? 'Audio on' : 'Audio muted';
  fountainFullscreenLink.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
  fountainControlSummary.textContent = `${sceneLabels[state.sceneMode]} · water ${state.waterOn ? `${targetFlow}%` : 'stopped'} · infinity ${state.infinityLightOn ? 'lit' : 'dark'}`;
  fountainControlState.textContent = `${cameraLabels[state.cameraPreset]} · ${materialLabels[state.statueMaterial]} · Flow ${targetFlow}%`;
}

function fountainResultState(result: ReturnType<IslandWorld['performAcademicInteraction']>) {
  if (!('state' in result) || !result.state || typeof result.state !== 'object') return null;
  return result.state as Record<string, unknown>;
}

function runFountainPanelAction(action: string, announce = true) {
  const result = world.performAcademicInteraction(action);
  const state = fountainResultState(result);
  const cameraRequested = state?.cameraRequested;
  if (typeof cameraRequested === 'string') {
    world.focusAcademicFountain(cameraRequested as FountainCameraPreset);
  }
  syncEnvironmentUI();
  syncFountainControlPanel();
  if (announce) toast(result.title, result.message);
  return result;
}

function cycleFountainStateTo(
  key: 'sceneMode' | 'statueMaterial' | 'cameraPreset',
  target: string,
  action: string,
  maximumCycles: number,
) {
  let lastResult: ReturnType<IslandWorld['performAcademicInteraction']> | null = null;
  for (let index = 0; index < maximumCycles; index += 1) {
    const current = getFountainPanelState();
    if (!current || current[key] === target) break;
    lastResult = world.performAcademicInteraction(action);
    syncEnvironmentUI();
    syncFountainControlPanel();
  }
  if (key === 'cameraPreset') world.focusAcademicFountain(target as FountainCameraPreset);
  syncFountainControlPanel();
  if (lastResult) toast(lastResult.title, lastResult.message);
}

function setMode(mode: ViewMode) {
  currentMode = mode;
  document.querySelectorAll<HTMLButtonElement>('.mode').forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === mode);
  });
  document.body.classList.toggle('plan-mode', mode === 'plan');
  document.body.classList.toggle('edit-mode', mode === 'edit');
  document.body.classList.toggle('walk-mode', mode === 'walk');
  walkHud.hidden = mode !== 'walk';
  if (!window.matchMedia('(max-width: 760px)').matches) {
    const collapseForView = mode === 'plan' || mode === 'walk';
    atlas.classList.toggle('collapsed', collapseForView);
    required<HTMLButtonElement>('#atlas-collapse').textContent = collapseForView ? '›' : '‹';
  }
  inspector.classList.toggle('hidden-panel', mode === 'walk' || (!currentSelection && mode !== 'edit'));
  world.setMode(mode);
  currentEditWorkspace = world.getEditWorkspace();
  const hints: Record<ViewMode, string> = {
    explore: '<span><b>Drag</b> orbit</span><span><b>Scroll</b> zoom</span><span><b>Click</b> inspect</span>',
    plan: '<span><b>Drag</b> pan</span><span><b>Scroll</b> zoom</span><span><b>Click</b> inspect</span>',
    edit: '<span><b>G / R / S</b> transform</span><span><b>Drag</b> gizmo</span><span><b>Click</b> select</span>',
    walk: '<span><b>WASD</b> move</span><span><b>Space</b> tap / hold jump</span><span><b>Speed</b> set in km/h</span>',
  };
  required<HTMLElement>('#interaction-hint').innerHTML = hints[mode];
  if (mode === 'edit' && currentSelection) toast('Edit mode active', 'Use the gizmo or inspector fields; changes are included in the GLB export.');
  if (mode === 'walk') {
    sceneCardTitle.textContent = 'Human-scale campus walk';
    sceneCardCopy.textContent = '1.62 m eye level · exact user-set walking speed · interiors stream only after entry';
    walkStatus.textContent = 'Human-scale exploration ready';
    walkLookButton.textContent = 'Click to look around';
  }
  refreshEditWorkspaceUI();
  syncFountainControlPanel();
}

function setGizmo(mode: GizmoMode) {
  activeGizmo = mode;
  world.setGizmoMode(mode);
  document.querySelectorAll<HTMLButtonElement>('[data-gizmo]').forEach((button) => {
    button.classList.toggle('active', button.dataset.gizmo === mode);
  });
}

function refreshSelectedState(definition: SceneDefinition, state: ObjectState) {
  if (definition.id !== currentSelection?.id) return;
  const liveDefinition = world.getDefinition(definition.id) ?? definition;
  updateInspector(liveDefinition, state);
}

let worldReadyForFullIslandActivation = false;

const world = new IslandWorld(viewport, {
  onSelection: (definition) => {
    updateInspector(definition);
    inspector.classList.toggle('hidden-panel', currentMode === 'walk' || (!definition && currentMode !== 'edit'));
    if (OBJECT_INTERACTIONS_ENABLED && currentMode === 'walk' && definition) {
      showWalkInteractionMenu(definition);
    }
  },
  onTransform: refreshSelectedState,
  onMetadataChange: (definition) => {
    cacheLiveDefinition(definition);
    renderAtlas(districtSearch.value);
    updateInspector(definition, world.getObjectState(definition.id));
    refreshAcademicCampusMapMetadata();
  },
  onImport: (definition: ImportedDefinition) => {
    registerDynamicDefinition(definition);
  },
  onObjectAdded: (definition: EditorAssetDefinition) => registerDynamicDefinition(definition),
  onObjectDeleted: (id) => unregisterDynamicDefinition(id),
  onEditWorkspaceChange: (workspace, buildingId) => {
    currentEditWorkspace = workspace;
    renderAssetLibrary();
    if (buildingId) {
      sceneCardTitle.textContent = world.getDefinition(buildingId)?.name ?? 'Building interior';
      sceneCardCopy.textContent = 'Interior Design · authored WALK geometry · isolated editable hierarchy';
    }
  },
  onUndoStackChange: (canUndo) => {
    undoActionButton.disabled = !canUndo;
  },
  onPersistenceChange: (snapshot) => {
    const label = saveProjectButton.querySelector<HTMLElement>('.action-label');
    if (label) label.textContent = snapshot.revision > 0 ? `Save · ${snapshot.revision}` : 'Save';
    saveProjectButton.title = snapshot.savedAt
      ? `Latest verified revision ${snapshot.revision} · ${new Date(snapshot.savedAt).toLocaleString()}`
      : 'Save an atomic project revision';
    saveProjectButton.dataset.persistenceStatus = snapshot.lastError ? 'warning' : 'ready';
    const missingCount = snapshot.missingAssetIds.length + Number(snapshot.missingLegacyImportCount ?? 0);
    relinkMissingAssetsButton.hidden = missingCount === 0;
    relinkMissingAssetsButton.title = missingCount
      ? `Relink ${missingCount} missing imported source asset${missingCount === 1 ? '' : 's'}`
      : 'Relink source files that were not stored by an older project';
  },
  onReady: () => {
    // LocalStorage reconstruction is intentionally deferred until after the
    // IslandWorld constructor returns. Synchronize controls here so a saved
    // fountain inspection (including a cold-loaded camera) immediately shows
    // its panel and exact environment state without requiring another click.
    syncEnvironmentUI();
    syncFountainControlPanel();
    syncDefinitionCacheFromWorld();
    loadingStatus.textContent = 'Spatial twin ready';
    window.setTimeout(() => {
      loadingScreen.classList.add('done');
      worldReadyForFullIslandActivation = true;
      applyPersistedFullIslandDetailPreference();
    }, 220);
  },
  onError: (message, error) => {
    console.error(message, error);
    toast('Scene error', message, 'error', 5600);
  },
  onWalkLockChange: (locked, dragLookActive) => {
    document.body.classList.toggle('walk-locked', locked);
    if (locked) {
      walkStatus.textContent = 'Mouse look active';
      walkLookButton.textContent = 'Mouse look active';
    } else if (dragLookActive) {
      walkStatus.textContent = 'Drag or move on the viewport to look around';
      walkLookButton.textContent = 'Drag mouse to look';
    } else {
      walkStatus.textContent = 'Pointer released — click to resume';
      walkLookButton.textContent = 'Resume mouse look';
    }
  },
  onWalkTurboChange: (enabled) => {
    walkTurboButton.classList.toggle('active', enabled);
    walkTurboButton.setAttribute('aria-pressed', String(enabled));
    walkTurboButton.textContent = enabled ? 'Turbo · 12 m/s' : 'Turbo · Off';
  },
  onAcademicInteraction: (result) => toast(result.title, result.message),
  onImportPlacementChange: (state, position) => {
    const choosing = state === 'choosing';
    document.body.classList.toggle('import-placement-active', choosing);
    importTrigger.classList.toggle('active', choosing);
    const label = importTrigger.querySelector<HTMLElement>('.action-label');
    if (label) label.textContent = choosing ? 'Pick location' : 'Import';
    if (choosing) {
      sceneCardTitle.textContent = 'Choose building location';
      sceneCardCopy.textContent = 'Orbit if needed, then click a walkable island surface · Esc cancels';
      return;
    }
    if (state === 'chosen') {
      if (pendingCatalogAssetId) {
        const catalogId = pendingCatalogAssetId;
        pendingCatalogAssetId = null;
        const posVec = position ? new THREE.Vector3(position[0], position[1], position[2]) : undefined;
        world.saveUndoState();
        const definition = world.addCatalogAsset(catalogId, posVec);
        if (definition) {
          toast('Asset placed', `${definition.name} has been placed at selected location.`);
        }
        return;
      }
      sceneCardTitle.textContent = 'Import location selected';
      sceneCardCopy.textContent = position
        ? `X ${position[0].toFixed(1)} · Z ${position[2].toFixed(1)} · choose the GLB or mesh file`
        : 'Choose the GLB or mesh file';
      const queued = queuedImportFiles;
      queuedImportFiles = null;
      if (queued?.length) void handleImport(queued);
      else importInput.click();
      return;
    }
    if (state === 'cancelled' || state === 'cleared') {
      pendingCatalogAssetId = null;
      queuedImportFiles = null;
      sceneCardTitle.textContent = currentSelection?.name ?? 'Central research campus';
      sceneCardCopy.textContent = currentSelection
        ? `${categoryNames[currentSelection.category] ?? currentSelection.category} · editable object group`
        : `${staticEditableGroupCount} editable scene groups · procedural architecture · Blender-ready GLB`;
    }
  },
});

window.labIsland = world;
window.render_game_to_text = () => JSON.stringify(world.getRenderTextSnapshot());
window.advanceTime = (milliseconds: number) => world.advanceTime(milliseconds);
document.body.classList.toggle('object-interactions-disabled', !OBJECT_INTERACTIONS_ENABLED);

const walkSpeedStorageKey = 'youtopy_walk_speed_kmh';
function applyWalkSpeed(value: number, persist = true) {
  const applied = world.setWalkSpeedKilometresPerHour(value);
  walkSpeedInput.value = applied.toFixed(1);
  walkSpeedInput.setAttribute('aria-valuetext', `${applied.toFixed(1)} kilometres per hour`);
  if (persist) localStorage.setItem(walkSpeedStorageKey, String(applied));
  return applied;
}
applyWalkSpeed(Number(localStorage.getItem(walkSpeedStorageKey) ?? walkSpeedInput.value), false);

syncDefinitionCacheFromWorld();
required<HTMLElement>('#district-count').textContent = String(districts.length).padStart(2, '0');
renderAtlas();
renderAssetLibrary();

districtSearch.addEventListener('input', () => renderAtlas(districtSearch.value));

document.querySelectorAll<HTMLButtonElement>('.mode').forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode as ViewMode));
});

[editLandscapeButton, editInteriorButton].forEach((button) => {
  button.addEventListener('click', () => {
    if (currentMode !== 'edit') setMode('edit');
    currentEditWorkspace = button.dataset.editWorkspace as EditorWorkspace;
    world.setEditWorkspace(currentEditWorkspace);
    renderAssetLibrary();
  });
});

assetCategory.addEventListener('change', renderAssetLibrary);
assetSearch.addEventListener('input', renderAssetLibrary);
document.querySelectorAll<HTMLButtonElement>('[data-asset-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    assetSourceFilter = button.dataset.assetFilter ?? 'all';
    document.querySelectorAll<HTMLButtonElement>('[data-asset-filter]').forEach((filterButton) => {
      const active = filterButton === button;
      filterButton.classList.toggle('active', active);
      filterButton.setAttribute('aria-pressed', String(active));
    });
    renderAssetLibrary();
  });
});

addAssetButton.addEventListener('click', () => {
  if (!selectedCatalogAssetId) return;
  const item = EDITOR_ASSET_CATALOG.find((entry) => entry.id === selectedCatalogAssetId);
  if (!item) return;

  if (item.workspace === 'landscape') {
    pendingCatalogAssetId = selectedCatalogAssetId;
    world.beginImportPlacement();
    toast('Select location', `Click on the island surface to place ${item.name}. Esc cancels.`);
  } else {
    world.saveUndoState();
    const definition = world.addCatalogAsset(selectedCatalogAssetId);
    if (!definition) {
      toast('Choose a building first', 'Interior assets can be added after entering a selected building.', 'error');
      return;
    }
    toast('Asset added', `${definition.name} is selected and ready to transform.`);
  }
});

deleteObjectButton.addEventListener('click', () => {
  if (!currentSelection) return;
  const name = currentSelection.name;
  world.saveUndoState();
  if (world.deleteObject(currentSelection.id)) toast('Object deleted', `${name} was removed from the editable scene.`);
});

enterInteriorButton.addEventListener('click', () => {
  if (!currentSelection) return;
  const buildingName = currentSelection.name;
  if (world.enterInterior(currentSelection.id)) {
    currentEditWorkspace = 'interior';
    renderAssetLibrary();
    toast('Interior Design active', `${buildingName} is open as an isolated, editable interior shared with WALK mode.`);
  }
});

exitInteriorButton.addEventListener('click', () => {
  world.exitInterior();
  renderAssetLibrary();
  toast('Returned to island', 'Select another building or continue editing the landscape.');
});

walkLookButton.addEventListener('click', () => world.activateWalkLook());
walkSpeedInput.addEventListener('change', () => {
  world.setWalkTurbo(false);
  applyWalkSpeed(Number(walkSpeedInput.value));
});
walkHudCollapseButton.addEventListener('click', () => {
  const collapsed = walkReadout.classList.toggle('collapsed');
  walkHudCollapseButton.setAttribute('aria-expanded', String(!collapsed));
  walkHudCollapseButton.setAttribute('aria-label', `${collapsed ? 'Expand' : 'Collapse'} WALK controls`);
  walkHudCollapseButton.textContent = collapsed ? '‹' : '›';
});

document.querySelectorAll<HTMLButtonElement>('[data-gizmo]').forEach((button) => {
  button.addEventListener('click', () => setGizmo(button.dataset.gizmo as GizmoMode));
});

Object.entries(positionInputs).forEach(([axis, input]) => {
  input.addEventListener('change', () => {
    if (!currentSelection) return;
    world.saveUndoState();
    world.setObjectPosition(currentSelection.id, axis as 'x' | 'y' | 'z', Number(input.value));
  });
});

const undoOnFocus = () => {
  world.saveUndoState();
};
const metadataInputs = [objectNameInput, objectLabelInput, objectDescriptionInput, objectInscriptionInput] as const;
metadataInputs.forEach((input) => {
  input.addEventListener('focus', undoOnFocus);
  input.addEventListener('input', () => input.setCustomValidity(''));
});

function applyInspectorMetadata() {
  if (!currentSelection) return false;
  const name = objectNameInput.value.trim();
  const label = objectLabelInput.value.trim();
  if (!name) {
    objectNameInput.setCustomValidity('Enter an object name.');
    objectNameInput.reportValidity();
    return false;
  }
  if (!label) {
    objectLabelInput.setCustomValidity('Enter a scene label.');
    objectLabelInput.reportValidity();
    return false;
  }

  const liveDefinition = world.getDefinition(currentSelection.id);
  const description = objectDescriptionInput.value.trim();
  const inscription = liveDefinition?.category === 'academic-building' && typeof liveDefinition.inscription === 'string'
    ? objectInscriptionInput.value.trim()
    : undefined;
  if (liveDefinition
    && liveDefinition.name === name
    && (liveDefinition.label?.trim() || liveDefinition.name) === label
    && liveDefinition.description === description
    && (inscription === undefined || ('inscription' in liveDefinition && liveDefinition.inscription === inscription))) {
    return true;
  }
  return Boolean(world.setObjectMetadata(currentSelection.id, { name, label, description, inscription }));
}

metadataInputs.forEach((input) => input.addEventListener('change', applyInspectorMetadata));
rotationInput.addEventListener('focus', undoOnFocus);
scaleInput.addEventListener('focus', undoOnFocus);
Object.values(axisScaleInputs).forEach((input) => input.addEventListener('focus', undoOnFocus));
accentInput.addEventListener('focus', undoOnFocus);
primaryColorInput.addEventListener('focus', undoOnFocus);
secondaryColorInput.addEventListener('focus', undoOnFocus);
patternScaleInput.addEventListener('focus', undoOnFocus);

rotationInput.addEventListener('input', () => {
  rotationOutput.value = `${Math.round(Number(rotationInput.value))}°`;
  if (currentSelection) world.setObjectRotationY(currentSelection.id, Number(rotationInput.value));
});

scaleInput.addEventListener('input', () => {
  scaleOutput.textContent = `${Math.round(Number(scaleInput.value) * 100)}%`;
  if (currentSelection) world.setObjectScale(currentSelection.id, Number(scaleInput.value));
});

Object.entries(axisScaleInputs).forEach(([axis, input]) => {
  input.addEventListener('change', () => {
    if (!currentSelection
      || (currentSelection.category !== 'entry-logistics-building'
        && currentSelection.category !== 'entry-logistics-landscape'
        && currentSelection.category !== 'authored-interior'
        && !(currentSelection.category === 'editor' && currentSelection.workspace === 'interior')
        && !(currentSelection.category === 'imported' && currentSelection.workspace === 'interior'))) return;
    const value = THREE.MathUtils.clamp(Number(input.value), 0.25, 4);
    input.value = value.toFixed(2);
    world.setObjectAxisScale(currentSelection.id, axis as 'x' | 'y' | 'z', value);
  });
});

accentInput.addEventListener('input', () => {
  if (!currentSelection) return;
  world.setObjectAccent(currentSelection.id, accentInput.value);
  listButtons.get(currentSelection.id)?.style.setProperty('--item-accent', accentInput.value);
});

visibilityInput.addEventListener('change', () => {
  if (currentSelection) {
    world.saveUndoState();
    world.setObjectVisible(currentSelection.id, visibilityInput.checked);
  }
});

primaryColorInput.addEventListener('input', () => {
  if (!currentSelection) return;
  world.setObjectColors(currentSelection.id, primaryColorInput.value, secondaryColorInput.value, accentInput.value);
});

secondaryColorInput.addEventListener('input', () => {
  if (!currentSelection) return;
  world.setObjectColors(currentSelection.id, primaryColorInput.value, secondaryColorInput.value, accentInput.value);
});

patternTypeSelect.addEventListener('change', () => {
  if (!currentSelection) return;
  world.saveUndoState();
  world.setObjectPattern(currentSelection.id, patternTypeSelect.value, Number(patternScaleInput.value));
});

patternScaleInput.addEventListener('input', () => {
  patternScaleOutput.textContent = `${Math.round(Number(patternScaleInput.value) * 100)}%`;
  if (!currentSelection) return;
  world.setObjectPattern(currentSelection.id, patternTypeSelect.value, Number(patternScaleInput.value));
});

collisionInput.addEventListener('change', () => {
  if (!currentSelection) return;
  world.saveUndoState();
  world.setObjectCollision(currentSelection.id, collisionInput.checked);
});

interactionOptionsContainer.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((checkbox) => {
  checkbox.addEventListener('change', () => {
    if (!currentSelection) return;
    world.saveUndoState();
    const checkedList: string[] = [];
    interactionOptionsContainer.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((cb) => {
      if (cb.checked) checkedList.push(cb.value);
    });
    world.setObjectInteractions(currentSelection.id, checkedList);
  });
});

saveProjectButton.addEventListener('click', async () => {
  if (currentSelection && !applyInspectorMetadata()) return;
  saveProjectButton.disabled = true;
  try {
    const snapshot = await world.saveProjectToLocalStorage(true);
    toast(
      'Layout Saved',
      `Manual revision ${snapshot.manualSaveRevision} stores all moved building positions and scene edits.`,
    );
  } catch (error) {
    toast('Save failed', error instanceof Error ? error.message : 'The previous recovery revision remains available.', 'error', 5600);
  } finally {
    saveProjectButton.disabled = false;
  }
});

refreshProjectButton.addEventListener('click', async () => {
  refreshProjectButton.disabled = true;
  try {
    if (await world.loadProjectFromPersistentStorage(true)) {
      syncDefinitionCacheFromWorld();
      if (currentSelection) {
        updateInspector(world.getDefinition(currentSelection.id), world.getObjectState(currentSelection.id));
      } else {
        updateInspector(null);
      }
      syncEnvironmentUI();
      syncFountainControlPanel();
      toast('Saved Layout Restored', 'The latest working revision or protected manual Save was restored.');
    } else {
      toast('Load Failed', 'No verified project revision is available.', 'error');
    }
  } catch (error) {
    toast('Refresh failed', error instanceof Error ? error.message : 'The project could not be restored.', 'error', 5600);
  } finally {
    refreshProjectButton.disabled = false;
  }
});

reloadCurrentBuildButton.addEventListener('click', async () => {
  const confirmed = window.confirm(
    'Reload the current authored build? This clears working autosave overrides and recovery revisions. Your last manual Save and imported asset files are retained and can be restored with Refresh.',
  );
  if (!confirmed) return;
  reloadCurrentBuildButton.disabled = true;
  reloadCurrentBuildButton.dataset.resetStatus = 'clearing';
  try {
    await world.clearPersistedProjectForCurrentBuild();
    reloadCurrentBuildButton.dataset.resetStatus = 'reloading';
    toast('Loading Current Build', 'Saved scene overrides were removed. Reloading the authored scene...');
    window.setTimeout(() => window.location.reload(), 250);
  } catch (error) {
    reloadCurrentBuildButton.dataset.resetStatus = 'failed';
    reloadCurrentBuildButton.disabled = false;
    toast(
      'Current build reload failed',
      error instanceof Error ? error.message : 'Saved scene overrides could not be cleared.',
      'error',
      5600,
    );
  }
});

restoreWelcomeDistrictButton.addEventListener('click', async () => {
  restoreWelcomeDistrictButton.disabled = true;
  try {
    const integrity = await world.restoreWelcomeDistrictDefaults();
    syncDefinitionCacheFromWorld();
    updateInspector(null);
    toast(
      'Welcome District Restored',
      `${integrity.entry.present}/${integrity.entry.expected} buildings and the half-covered pool were rebuilt.`,
    );
  } catch (error) {
    toast('Restore failed', error instanceof Error ? error.message : 'The Welcome District could not be restored.', 'error', 5600);
  } finally {
    restoreWelcomeDistrictButton.disabled = false;
  }
});

undoActionButton.addEventListener('click', () => {
  if (world.undo()) {
    syncDefinitionCacheFromWorld();
    if (currentSelection) {
      updateInspector(world.getDefinition(currentSelection.id), world.getObjectState(currentSelection.id));
    } else {
      updateInspector(null);
    }
    syncEnvironmentUI();
    syncFountainControlPanel();
    toast('Action Undone', 'The last customization or transformation step has been reverted.');
  } else {
    toast('Cannot Undo', 'No remaining history steps in the undo stack.', 'error');
  }
});

editStudioCollapseButton.addEventListener('click', () => {
  const collapsed = editWorkspacePanel.classList.toggle('collapsed');
  editStudioCollapseButton.textContent = collapsed ? '▲' : '▼';
});

saveInspectorChangesButton.addEventListener('click', async () => {
  if (!applyInspectorMetadata()) return;
  try {
    const snapshot = await world.saveProjectToLocalStorage(true);
    toast('Changes Saved', `Object changes are stored in verified revision ${snapshot.revision}.`);
  } catch (error) {
    toast('Save failed', error instanceof Error ? error.message : 'Changes could not be persisted.', 'error', 5600);
  }
});

required<HTMLButtonElement>('#focus-selection').addEventListener('click', () => {
  if (currentSelection) {
    world.focus(currentSelection.id);
    syncFountainControlPanel();
  }
});

required<HTMLButtonElement>('#reset-selection').addEventListener('click', () => {
  if (!currentSelection) return;
  world.resetObject(currentSelection.id);
  updateInspector(world.getDefinition(currentSelection.id), world.getObjectState(currentSelection.id));
  toast('Object reset', `${currentSelection.name} restored to its masterplan transform.`);
});

document.querySelectorAll<HTMLButtonElement>('.section-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const section = button.closest('.inspector-section');
    const closed = section?.classList.toggle('closed') ?? false;
    const indicator = button.lastElementChild;
    if (indicator) indicator.textContent = closed ? '+' : '−';
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-layer]').forEach((button) => {
  button.addEventListener('click', () => {
    const visible = button.classList.toggle('active');
    const layer = button.dataset.layer as SceneLayer;
    world.setLayer(layer, visible);
    document.body.classList.toggle('labels-hidden', layer === 'labels' && !visible);
  });
});

timeToggle.addEventListener('click', () => {
  const daylight = !world.isDaylight();
  world.setDaylight(daylight);
  const icon = timeToggle.querySelector<HTMLElement>('.action-icon');
  const label = timeToggle.querySelector<HTMLElement>('.action-label');
  if (icon) icon.textContent = daylight ? '◒' : '☼';
  if (label) label.textContent = daylight ? 'Daylight' : 'Blue hour';
  toast(daylight ? 'Daylight study' : 'Blue-hour study', daylight ? 'Material colors and landscape detail are now emphasized.' : 'Transit light, laboratories, and cyber city glow are now emphasized.');
});

required<HTMLButtonElement>('#home-view').addEventListener('click', () => {
  world.overview();
  world.clearSelection('ui');
  syncFountainControlPanel();
});

required<HTMLButtonElement>('#atlas-collapse').addEventListener('click', () => {
  const collapseButton = required<HTMLButtonElement>('#atlas-collapse');
  if (window.matchMedia('(max-width: 760px)').matches) {
    const open = atlas.classList.toggle('mobile-open');
    collapseButton.textContent = open ? '‹' : '›';
    return;
  }
  const collapsed = atlas.classList.toggle('collapsed');
  collapseButton.textContent = collapsed ? '›' : '‹';
});

importTrigger.addEventListener('click', () => {
  const interiorBuildingId = world.getCurrentInteriorBuildingId();
  if (interiorBuildingId) {
    queuedImportFiles = null;
    if (currentMode !== 'edit') setMode('edit');
    if (!world.enterInterior(interiorBuildingId, true)) {
      toast('Interior import unavailable', 'This building interior could not be opened for editing.', 'error');
      return;
    }
    currentEditWorkspace = 'interior';
    renderAssetLibrary();
    importInput.click();
    return;
  }
  queuedImportFiles = null;
  if (currentMode === 'walk') setMode('edit');
  world.beginImportPlacement();
  toast('Select import location', 'Click the island where the building should be placed. You can orbit and zoom first.');
});
importInput.addEventListener('change', async () => {
  if (!importInput.files?.length) {
    world.cancelImportPlacement();
    return;
  }
  await handleImport(Array.from(importInput.files));
  importInput.value = '';
});
importInput.addEventListener('cancel', () => world.cancelImportPlacement());

projectBundleExportButton.addEventListener('click', async () => {
  projectBundleExportButton.disabled = true;
  try {
    await world.saveProjectToLocalStorage(true);
    await world.exportProjectBundle();
    toast('Project Backup Ready', 'The ZIP contains project state and every persisted imported source asset.');
  } catch (error) {
    toast('Backup failed', error instanceof Error ? error.message : 'The project bundle could not be created.', 'error', 5600);
  } finally {
    projectBundleExportButton.disabled = false;
  }
});

projectBundleImportButton.addEventListener('click', () => projectBundleInput.click());
relinkMissingAssetsButton.addEventListener('click', () => {
  queuedImportFiles = null;
  world.cancelImportPlacement();
  importInput.click();
  toast(
    'Relink Missing Assets',
    'Choose the original files. Matching filenames restore their stable IDs, transforms, building parent, and collision settings.',
  );
});
projectBundleInput.addEventListener('change', async () => {
  const file = projectBundleInput.files?.[0];
  projectBundleInput.value = '';
  if (!file) return;
  projectBundleImportButton.disabled = true;
  loadingStatus.textContent = 'Verifying project bundle and imported assets…';
  loadingScreen.classList.remove('done');
  try {
    const integrity = await world.importProjectBundle(file);
    syncDefinitionCacheFromWorld();
    updateInspector(null);
    toast(
      'Project Restored',
      `${integrity.entry.present}/${integrity.entry.expected} Welcome buildings and all verified assets were loaded.`,
    );
  } catch (error) {
    toast('Project restore failed', error instanceof Error ? error.message : 'The bundle is invalid.', 'error', 5600);
  } finally {
    projectBundleImportButton.disabled = false;
    loadingScreen.classList.add('done');
  }
});

async function handleImport(files: File[]) {
  loadingStatus.textContent = 'Resolving imported mesh hierarchy…';
  loadingScreen.classList.remove('done');
  try {
    const results = await world.importFiles(files);
    if (!results.length) throw new Error('No supported GLB, GLTF, OBJ, or STL file was found.');
    await world.saveProjectToLocalStorage(false);
    toast('Mesh imported', `${results.length} asset${results.length === 1 ? '' : 's'} added to the Imported Assets collection.`);
    if (currentMode !== 'edit') setMode('edit');
  } catch (error) {
    console.error(error);
    toast('Import failed', error instanceof Error ? error.message : 'The selected file could not be parsed.', 'error', 5600);
  } finally {
    loadingScreen.classList.add('done');
  }
}

document.addEventListener('dragenter', (event) => {
  event.preventDefault();
  dragDepth += 1;
  document.body.classList.add('drop-active');
});
document.addEventListener('dragover', (event) => event.preventDefault());
document.addEventListener('dragleave', (event) => {
  event.preventDefault();
  dragDepth -= 1;
  if (dragDepth <= 0) {
    dragDepth = 0;
    document.body.classList.remove('drop-active');
  }
});
document.addEventListener('drop', (event) => {
  event.preventDefault();
  dragDepth = 0;
  document.body.classList.remove('drop-active');
  const files = Array.from(event.dataTransfer?.files ?? []);
  if (!files.length) return;
  const interiorBuildingId = world.getCurrentInteriorBuildingId();
  if (interiorBuildingId) {
    if (currentMode !== 'edit') setMode('edit');
    if (!world.enterInterior(interiorBuildingId, true)) {
      toast('Interior import unavailable', 'This building interior could not be opened for editing.', 'error');
      return;
    }
    currentEditWorkspace = 'interior';
    renderAssetLibrary();
    void handleImport(files);
    return;
  }
  queuedImportFiles = files;
  if (currentMode === 'walk') setMode('edit');
  world.beginImportPlacement();
  toast('Asset ready to place', 'Click a walkable island surface to place the dropped building.');
});

const sceneExportButton = required<HTMLButtonElement>('#export-trigger');
const productionExportButton = required<HTMLButtonElement>('#production-export-trigger');

sceneExportButton.addEventListener('click', async (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  if (event.shiftKey) {
    world.exportProject();
    toast('Project data exported', 'Editable transforms, metadata, and camera state saved as JSON.');
    return;
  }
  const previousText = button.querySelector('span')?.textContent ?? 'Export scene';
  button.disabled = true;
  button.dataset.exportStatus = 'working';
  const label = button.querySelector('span');
  if (label) label.textContent = 'Preparing GLB…';
  try {
    await world.exportGLB();
    button.dataset.exportStatus = 'success';
    toast('Blender-ready GLB exported', 'Import with Blender → File → Import → glTF 2.0. Shift-click Export for project JSON.');
  } catch (error) {
    button.dataset.exportStatus = 'error';
    console.error(error);
    toast('Export failed', error instanceof Error ? error.message : 'The scene could not be serialized.', 'error', 5600);
  } finally {
    button.disabled = false;
    if (label) label.textContent = previousText;
  }
});

async function toggleFullscreen() {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  else await document.exitFullscreen();
}

required<HTMLButtonElement>('#fullscreen-toggle').addEventListener('click', () => void toggleFullscreen());
document.addEventListener('fullscreenchange', syncFountainControlPanel);

document.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement;
  const editingText = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
  if (world.isSyntheticShoreActive()) {
    if (event.key.toLowerCase() === 'f' && !editingText) void toggleFullscreen();
    // The shore owns Escape once ready: it first releases mouse look before
    // returning to the island. During its lazy load there is no scene handler.
    if (event.key === 'Escape' && world.getSyntheticShoreSnapshot().loading) world.exitSyntheticShore();
    return;
  }
  if (event.key === '/' && !editingText) {
    event.preventDefault();
    districtSearch.focus();
    return;
  }
  if (editingText) return;
  if (event.key.toLowerCase() === 'm') {
    event.preventDefault();
    void toggleAcademicAudio();
    return;
  }
  if (event.key.toLowerCase() === 'f') void toggleFullscreen();
  if (event.key === '1') setMode('explore');
  if (event.key === '2') setMode('plan');
  if (event.key === '3') setMode('edit');
  if (event.key === '4') setMode('walk');
  if (event.key.toLowerCase() === 'g' && currentMode === 'edit') setGizmo('translate');
  if (event.key.toLowerCase() === 'r' && currentMode === 'edit') setGizmo('rotate');
  if (event.key.toLowerCase() === 's' && currentMode === 'edit') setGizmo('scale');
  if (event.key.toLowerCase() === 'a' && currentMode === 'edit' && !addAssetButton.disabled) addAssetButton.click();
  if (event.key === 'Delete' && currentMode === 'edit' && !deleteObjectButton.disabled) deleteObjectButton.click();
  if (event.key === 'Escape') {
    if (world.cancelImportPlacement()) {
      queuedImportFiles = null;
      toast('Import cancelled', 'No building was added.');
      return;
    }
    if (world.isAcademicFountainInspectionActive()) {
      world.overview();
      syncFountainControlPanel();
      return;
    }
    world.clearSelection('ui');
  }
  if (event.key === 'Home') {
    world.overview();
    syncFountainControlPanel();
  }
});

productionExportButton.addEventListener('click', async () => {
  const label = productionExportButton.querySelector('span');
  const previousText = label?.textContent ?? 'Production';
  productionExportButton.dataset.exportStatus = 'working';
  productionExportButton.disabled = true;
  sceneExportButton.disabled = true;
  if (label) label.textContent = 'Choose folder…';

  try {
    // Chromium writes directly to a chosen folder. Other browsers receive one
    // ZIP containing the same directory tree and separate GLBs.
    const sink = await createProductionOutputSink();
    if (label) label.textContent = 'Loading world…';
    const summary = await world.exportProductionPackage(sink.write, (progress) => {
      if (!label) return;
      if (progress.phase === 'loading') {
        label.textContent = 'Loading world…';
      } else if (progress.phase === 'finalizing') {
        label.textContent = 'Writing manifest…';
      } else {
        label.textContent = `${progress.completed}/${progress.total} GLBs`;
      }
    });
    await sink.finalize();
    productionExportButton.dataset.exportStatus = 'success';
    const destination = sink.mode === 'directory'
      ? `Saved in ${sink.packageName}.`
      : `Downloaded ${sink.packageName}.zip.`;
    toast(
      'Production package exported',
      `${summary.assetCount} world-positioned Blender GLBs plus manifest and batch importer. ${destination}`,
      'normal',
      7200,
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      productionExportButton.dataset.exportStatus = 'idle';
      toast('Production export cancelled', 'No export folder was written.');
    } else {
      productionExportButton.dataset.exportStatus = 'error';
      console.error(error);
      toast(
        'Production export failed',
        error instanceof Error ? error.message : 'The Production package could not be serialized.',
        'error',
        7200,
      );
    }
  } finally {
    productionExportButton.disabled = false;
    sceneExportButton.disabled = false;
    if (label) label.textContent = previousText;
  }
});

let currentAcademicBuilding: AcademicCampusBuilding | null = null;

function editableAcademicHistory(record: AcademicCampusBuilding) {
  return localStorage.getItem(`blackwood-history:${record.id}`) ?? record.history;
}

function academicBuildingDisplayContent(record: AcademicCampusBuilding) {
  const definition = world.getDefinition(`academic-building-${record.id}`);
  const defaultDescription = `${record.description} Founded in ${record.founded}; ${record.zone}.`;
  return {
    name: definition?.name ?? record.name,
    description: definition?.description === defaultDescription
      ? record.description
      : definition?.description ?? record.description,
  };
}

function showAcademicBuildingCard(record: AcademicCampusBuilding) {
  currentAcademicBuilding = record;
  const display = academicBuildingDisplayContent(record);
  academicBuildingTitle.textContent = display.name;
  academicBuildingMeta.textContent = `Founded ${record.founded} · ${record.zone} · ${record.kind}`;
  academicBuildingDescription.textContent = display.description;
  academicHistoryEditor.value = editableAcademicHistory(record);
  academicCampusMap.hidden = true;
  academicBuildingCard.hidden = false;
  academicHistoryEditor.focus();
}

function showAcademicCampusMap() {
  academicBuildingCard.hidden = true;
  academicCampusMap.hidden = false;
}

ACADEMIC_CAMPUS_BUILDINGS.forEach((record) => {
  const marker = document.createElement('button');
  marker.type = 'button';
  marker.className = 'academic-map-marker';
  marker.dataset.academicBuildingId = record.id;
  marker.style.left = `${8 + ((record.location[0] + 55) / 110) * 84}%`;
  marker.style.top = `${92 - ((record.location[1] + 55) / 110) * 84}%`;
  marker.title = `${record.name} · founded ${record.founded}`;
  marker.setAttribute('aria-label', marker.title);
  const label = document.createElement('span');
  label.textContent = record.name;
  marker.appendChild(label);
  marker.addEventListener('click', () => showAcademicBuildingCard(record));
  academicMapMarkers.appendChild(marker);
});

function refreshAcademicCampusMapMetadata() {
  ACADEMIC_CAMPUS_BUILDINGS.forEach((record) => {
    const marker = academicMapMarkers.querySelector<HTMLButtonElement>(`[data-academic-building-id="${record.id}"]`);
    if (!marker) return;
    const display = academicBuildingDisplayContent(record);
    marker.title = `${display.name} · founded ${record.founded}`;
    marker.setAttribute('aria-label', marker.title);
    const label = marker.querySelector('span');
    if (label) label.textContent = display.name;
  });
}

academicBuildingClose.addEventListener('click', () => {
  academicBuildingCard.hidden = true;
});
academicMapClose.addEventListener('click', () => {
  academicCampusMap.hidden = true;
});
academicHistorySave.addEventListener('click', () => {
  if (!currentAcademicBuilding) return;
  localStorage.setItem(`blackwood-history:${currentAcademicBuilding.id}`, academicHistoryEditor.value.trim());
  const display = academicBuildingDisplayContent(currentAcademicBuilding);
  toast('History saved', `${display.name}'s fictional history is stored in this browser.`);
});

function showWalkInteractionMenu(definition: SceneDefinition) {
  if (!OBJECT_INTERACTIONS_ENABLED) {
    walkInteractionMenu.hidden = true;
    return;
  }
  if (world.walkController?.pointerControls.isLocked) {
    world.walkController.pointerControls.unlock();
  }

  const state = world.getObjectState(definition.id);
  const rawList = state?.interactions ?? [];
  const academicHotspot = definition.id === 'academic-libraries-theoretical-labs'
    ? world.getActiveAcademicHotspot()
    : null;
  const academicFountainHotspot = definition.id === 'academic-libraries-theoretical-labs'
    && world.getActiveAcademicFountainHotspot();
  const academicSnapshot = definition.id === 'academic-libraries-theoretical-labs'
    ? world.getTextSnapshot()
    : null;
  const fountainInteractions: string[] = academicSnapshot?.academicDistrict?.fountain?.metadata?.interactions ?? [];
  const interactions: string[] = (academicFountainHotspot
      ? fountainInteractions
      : rawList.length ? rawList : ['examine']).filter(
    (action) => action !== 'open main gate' || definition.id !== 'academic-libraries-theoretical-labs' || world.isAcademicMainGateNearby(),
  );
  const gateActionLabel = academicSnapshot?.atmosphere.timeOfDay !== 'night'
    ? 'Main gate open for daylight'
    : academicSnapshot?.academicDistrict?.gateOpen
      ? 'Close main gate'
      : 'Open main gate';
  walkInteractionMenuTitle.textContent = academicFountainHotspot
    ? academicSnapshot?.academicDistrict?.fountain?.metadata?.name ?? 'The Well of Infinite Knowledge'
    : academicHotspot?.name ?? definition.name;
  walkInteractionButtonsContainer.innerHTML = '';

  interactions.forEach((act) => {
    const btn = document.createElement('button');
    btn.className = 'interaction-menu-btn';
    btn.textContent = act === 'sit' ? 'Sit down'
      : act === 'sleep' ? 'Sleep / Rest'
      : act === 'research' ? 'Research'
      : act === 'analyze' ? 'Analyze samples'
      : act === 'power' ? 'Power toggle'
      : act === 'decontaminate' ? 'Decontaminate'
      : act === 'inspect entrance' ? `Inspect ${academicHotspot?.name ?? 'nearest entrance'}`
      : act === 'open main gate' ? gateActionLabel
      : act === 'ring chapel bell' ? 'Ring St Anselm bell'
      : act === 'toggle reading-room lights' ? 'Toggle reading-room lights'
      : act === 'campus map' ? 'Open campus map'
      : act === 'read fountain plaque' ? 'Read monument dedication'
      : act === 'toggle fountain water' ? (academicSnapshot?.academicDistrict?.fountain?.state?.waterOn ? 'Stop measured water system' : 'Start measured water system')
      : act === 'increase fountain water flow' ? 'Increase water flow'
      : act === 'decrease fountain water flow' ? 'Decrease water flow'
      : act === 'toggle infinity lighting' ? 'Toggle infinity-loop light'
      : act === 'highlight scientific engravings' ? 'Highlight scientific engravings'
      : act === 'describe next scientific symbol' ? 'Describe next scientific symbol'
      : act === 'toggle fountain cutaway' ? 'Toggle hydraulic cutaway'
      : act === 'toggle fountain geometry grid' ? 'Toggle construction grid'
      : act === 'toggle orbital ring rotation' ? 'Start / pause ring inspection'
      : act === 'cycle Seshat material' ? 'Cycle Seshat material'
      : act === 'cycle fountain restoration view' ? 'Cycle restoration comparison'
      : act === 'cycle fountain scene mode' ? 'Cycle presentation / courtyard / night'
      : act === 'cycle fountain camera preset' ? 'Next camera preset'
      : act === 'reset fountain camera' ? 'Reset hero camera'
      : act === 'toggle fountain debug view' ? 'Toggle fountain debug view'
      : act === 'orbit fountain' ? 'Open orbit inspection'
      : act;
    btn.addEventListener('click', () => {
      triggerWalkInteraction(definition, act);
      walkInteractionMenu.hidden = true;
      world.clearSelection('ui');
    });
    walkInteractionButtonsContainer.appendChild(btn);
  });

  walkInteractionMenu.hidden = false;
}

function triggerWalkInteraction(definition: SceneDefinition, action: string) {
  if (!OBJECT_INTERACTIONS_ENABLED) return;
  const group = world.objectGroups.get(definition.id);
  if (!group) return;

  if (definition.id === 'academic-libraries-theoretical-labs') {
    if (action === 'campus map') {
      showAcademicCampusMap();
      return;
    }
    const result = world.performAcademicInteraction(action);
    if (result.state && 'cameraRequested' in result.state && typeof result.state.cameraRequested === 'string') {
      setMode('explore');
      world.focusAcademicFountain(result.state.cameraRequested as 'hero' | 'low-angle' | 'top-down' | 'side-profile');
    }
    syncEnvironmentUI();
    syncFountainControlPanel();
    if (action === 'inspect entrance' && 'building' in result && result.building) showAcademicBuildingCard(result.building);
    else toast(result.title, result.message);
    return;
  }

  if (action === 'sit' || action === 'sleep') {
    let seatPos = new THREE.Vector3();
    let seatFound = false;

    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.surfaceKind === 'seat') {
        child.getWorldPosition(seatPos);
        seatFound = true;
      }
    });

    if (!seatFound) {
      group.getWorldPosition(seatPos);
      seatPos.y += definition.height * 0.4;
    }

    const cameraTargetYOffset = action === 'sleep' ? 0.25 : 0.42;
    seatPos.y += cameraTargetYOffset;

    world.walkController.seatTarget.copy(seatPos);
    world.walkController.isSitting = true;

    toast(
      action === 'sit' ? 'Sitting Down' : 'Resting',
      `You are now ${action === 'sit' ? 'seated' : 'resting'} on ${definition.name}. Press WASD / Arrow keys to stand up.`
    );
  } else if (action === 'power') {
    let isOff = false;
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial && mat.emissive) {
            if (mat.userData.originalEmissiveIntensity === undefined) {
              mat.userData.originalEmissiveIntensity = mat.emissiveIntensity;
            }
            mat.emissiveIntensity = mat.emissiveIntensity > 0 ? 0 : mat.userData.originalEmissiveIntensity;
            isOff = mat.emissiveIntensity === 0;
            mat.needsUpdate = true;
          }
        });
      }
    });
    toast('Power Grid Toggle', `${definition.name} systems are now ${isOff ? 'OFF' : 'ON'}.`);
  } else if (action === 'research' || action === 'analyze') {
    const reports = [
      "Analyzing quantum state... Coherence stable at 99.8%.",
      "Scanning molecular structures... Polymer chains aligned successfully.",
      "Calibrating telemetry grids... Atmospheric radiation within standard deviations.",
      "Processing sample array... 82% organic content, bio-markers identified.",
      "Running micro-simulation... Catalyst accelerates reaction rate by 4.2x.",
      "Mapping cellular pathways... Active mitochondria detected in tundra-specimen.",
      "Synthesizing compounds... Target bio-agent isolated.",
    ];
    const report = reports[Math.floor(Math.random() * reports.length)];
    toast(action === 'research' ? 'Research Log' : 'Sample Analysis', `${definition.name}: ${report}`);

    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial && mat.emissive) {
            const original = mat.emissiveIntensity;
            mat.emissiveIntensity = original * 3.5;
            mat.needsUpdate = true;
            setTimeout(() => {
              mat.emissiveIntensity = original;
              mat.needsUpdate = true;
            }, 600);
          }
        });
      }
    });
  } else if (action === 'decontaminate') {
    toast('Decontamination Wash', `Wash cycle initiated on ${definition.name}. Stay clear!`);
    let flashes = 0;
    const interval = setInterval(() => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial && mat.emissive) {
              if (mat.userData.originalEmissiveIntensity === undefined) {
                mat.userData.originalEmissiveIntensity = mat.emissiveIntensity;
              }
              mat.emissiveIntensity = flashes % 2 === 0 ? 6.0 : 0.0;
              mat.needsUpdate = true;
            }
          });
        }
      });
      flashes++;
      if (flashes >= 6) {
        clearInterval(interval);
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial && mat.emissive) {
                mat.emissiveIntensity = mat.userData.originalEmissiveIntensity ?? 1.8;
                mat.needsUpdate = true;
              }
            });
          }
        });
        toast('Wash Complete', `Decontamination cycle on ${definition.name} finished successfully.`);
      }
    }, 300);
  } else {
    toast('Object Inspected', `Examinated ${definition.name}: ${definition.description}`);
  }
}

walkInteractionMenuCloseButton.addEventListener('click', () => {
  walkInteractionMenu.hidden = true;
  world.clearSelection('ui');
});

themeToggleButton.addEventListener('click', () => {
  const cleanTech = document.body.classList.toggle('theme-cleantech');
  localStorage.setItem('youtopy_theme', cleanTech ? 'cleantech' : 'cybertech');
  updateThemeUI(cleanTech);
  world.setTimeOfDay(cleanTech ? 'noon' : 'night');
  syncEnvironmentUI();
  const icon = timeToggle.querySelector<HTMLElement>('.action-icon');
  const label = timeToggle.querySelector<HTMLElement>('.action-label');
  if (icon) icon.textContent = cleanTech ? '◒' : '☼';
  if (label) label.textContent = cleanTech ? 'Daylight' : 'Blue hour';
  toast(
    cleanTech ? 'Clean Tech' : 'Cyber Tech',
    cleanTech ? 'Futuristic light minimalism with electric blue accents active.' : 'Cyber Tech dark city mode active.'
  );
});

function updateThemeUI(cleanTech: boolean) {
  const icon = themeToggleButton.querySelector<HTMLElement>('.action-icon');
  const label = themeToggleButton.querySelector<HTMLElement>('.action-label');
  if (icon) icon.textContent = cleanTech ? '◒' : '◐';
  if (label) label.textContent = cleanTech ? 'Clean Tech' : 'Cyber Tech';
}

function syncEnvironmentUI() {
  envTimeSelect.value = world.getTimeOfDay();
  envWeatherSelect.value = world.getWeather();
  envSeasonSelect.value = world.getSeason();
  const plazaLightPercent = Math.round(world.getCorporateCorePlazaLightStrength() * 100);
  corporatePlazaLightStrengthInput.value = String(plazaLightPercent);
  corporatePlazaLightStrengthOutput.value = `${plazaLightPercent}%`;
  corporatePlazaLightStrengthOutput.textContent = `${plazaLightPercent}%`;
  envQualitySelect.value = world.getGraphicsQuality();
}

function setAtmosphereMenuOpen(open: boolean) {
  atmosphereMenu.hidden = !open;
  atmosphereToggleButton.setAttribute('aria-expanded', String(open));
}

atmosphereToggleButton.addEventListener('click', () => {
  const open = atmosphereMenu.hidden;
  if (open) syncEnvironmentUI();
  setAtmosphereMenuOpen(open);
});

atmosphereMenuCloseButton.addEventListener('click', () => setAtmosphereMenuOpen(false));

document.addEventListener('pointerdown', (event) => {
  if (atmosphereMenu.hidden) return;
  const target = event.target;
  if (!(target instanceof Node) || atmosphereMenu.contains(target) || atmosphereToggleButton.contains(target)) return;
  setAtmosphereMenuOpen(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !atmosphereMenu.hidden) setAtmosphereMenuOpen(false);
});

fountainSceneModeSelect.addEventListener('change', () => {
  cycleFountainStateTo('sceneMode', fountainSceneModeSelect.value, 'cycle fountain scene mode', 3);
});

fountainStatueMaterialSelect.addEventListener('change', () => {
  cycleFountainStateTo('statueMaterial', fountainStatueMaterialSelect.value, 'cycle Seshat material', 3);
});

fountainCameraPresetSelect.addEventListener('change', () => {
  cycleFountainStateTo('cameraPreset', fountainCameraPresetSelect.value, 'cycle fountain camera preset', 4);
});

fountainWaterToggle.addEventListener('click', () => {
  runFountainPanelAction('toggle fountain water');
});

document.querySelectorAll<HTMLButtonElement>('[data-fountain-flow]').forEach((button) => {
  button.addEventListener('click', () => {
    const increase = button.dataset.fountainFlow === '1';
    runFountainPanelAction(increase ? 'increase fountain water flow' : 'decrease fountain water flow');
  });
});

fountainWaterFlow.addEventListener('input', () => {
  fountainWaterFlowOutput.value = `${fountainWaterFlow.value}%`;
  fountainWaterFlowOutput.textContent = `${fountainWaterFlow.value}%`;
});

fountainWaterFlow.addEventListener('change', () => {
  const target = Number(fountainWaterFlow.value) / 100;
  const result = world.setAcademicFountainWaterFlow(target);
  syncEnvironmentUI();
  syncFountainControlPanel();
  toast(result.title, result.message);
});

fountainInfinityLight.addEventListener('click', () => {
  runFountainPanelAction('toggle infinity lighting');
});

fountainCutaway.addEventListener('click', () => {
  runFountainPanelAction('toggle fountain cutaway');
});

fountainGeometryGrid.addEventListener('click', () => {
  runFountainPanelAction('toggle fountain geometry grid');
});

fountainCameraReset.addEventListener('click', () => {
  runFountainPanelAction('reset fountain camera');
});

fountainQualitySelect.addEventListener('change', () => {
  envQualitySelect.value = fountainQualitySelect.value;
  envQualitySelect.dispatchEvent(new Event('change'));
  syncFountainControlPanel();
});

fountainAudioLink.addEventListener('click', () => {
  academicAudioButton.click();
  window.setTimeout(syncFountainControlPanel, 0);
});

fountainFullscreenLink.addEventListener('click', () => {
  required<HTMLButtonElement>('#fullscreen-toggle').click();
});

fountainControlExit.addEventListener('click', () => {
  world.overview();
  syncFountainControlPanel();
});

envTimeSelect.addEventListener('change', () => {
  world.saveUndoState();
  world.setTimeOfDay(envTimeSelect.value as any);
  toast('Time of Day Changed', `Atmospheric lighting morphing to ${envTimeSelect.options[envTimeSelect.selectedIndex].text}.`);
});

envWeatherSelect.addEventListener('change', () => {
  world.saveUndoState();
  world.setWeather(envWeatherSelect.value as WeatherMode);
  syncEnvironmentUI();
  toast('Weather Shifted', `Atmospheric particles and fog density adjusting to ${envWeatherSelect.options[envWeatherSelect.selectedIndex].text}.`);
});

envSeasonSelect.addEventListener('change', () => {
  world.saveUndoState();
  world.setSeason(envSeasonSelect.value as any);
  toast('Season Transition', `Foliage colors and ground conditions shifting to ${envSeasonSelect.options[envSeasonSelect.selectedIndex].text}.`);
});

envQualitySelect.addEventListener('change', () => {
  world.setGraphicsQuality(envQualitySelect.value as GraphicsQuality);
  syncFountainControlPanel();
  toast('Graphics quality', `${envQualitySelect.options[envQualitySelect.selectedIndex].text} quality is active.`);
});

corporatePlazaLightStrengthInput.addEventListener('input', () => {
  const percent = Number(corporatePlazaLightStrengthInput.value);
  corporatePlazaLightStrengthOutput.value = `${percent}%`;
  corporatePlazaLightStrengthOutput.textContent = `${percent}%`;
  world.setCorporateCorePlazaLightStrength(percent / 100);
});

corporatePlazaLightStrengthInput.addEventListener('change', () => {
  const percent = Number(corporatePlazaLightStrengthInput.value);
  toast('Corporate plaza lights', `All twenty stadium-light stanchions are set to ${percent}% strength.`);
});

const legacyFullIslandDetailStorageKey = 'youtopy_full_island_detail';
const devicePerformancePreferencesStorageKey = 'youtopy_device_preferences';
const safeStreamedSessionStorageKey = 'youtopy_full_island_safe_streamed_session';

interface DevicePerformancePreferences {
  version: number;
  fullIslandDetail: boolean;
  [key: string]: unknown;
}

interface FullIslandLifecycleTelemetry {
  phase?: string;
  queued?: number;
  building?: number;
  warmingGpu?: number;
  ready?: number;
  error?: number;
  degraded?: number;
  currentPackageId?: string | null;
  failedPackageIds?: string[];
}

type FullIslandStreamingTelemetry = ReturnType<IslandWorld['getStreamingSnapshot']> & {
  fullIslandLifecycle?: FullIslandLifecycleTelemetry;
  fullIslandDetailProgress: ReturnType<IslandWorld['getStreamingSnapshot']>['fullIslandDetailProgress'] & FullIslandLifecycleTelemetry;
  visiblePackageReadiness?: { ready: number; total: number; percent: number };
  renderProfile?: string;
  liveRenderObjectCount?: number;
  batchOccupancy?: { capacity: number; active: number; ratio: number };
  microdetail?: {
    mandatory?: number;
    micro?: number;
    visibleMicro?: number;
    culledMicro?: number;
    total?: number;
    visible?: number;
    culled?: number;
  };
  collisionResidentCellCount?: number;
};

type FullIslandSceneStatistics = ReturnType<IslandWorld['getSceneStatistics']> & {
  frameTiming?: {
    cpuP50Ms?: number;
    cpuP95Ms?: number;
    gpuP50Ms?: number | null;
    gpuP95Ms?: number | null;
    hoverPickP95Ms?: number;
    bottleneck?: string;
    targetFps?: number;
  };
  renderer?: {
    reverseDepthBuffer?: boolean;
    transmissionPassActive?: boolean;
    recoveryPhase?: string;
    shaderProgramCount?: number;
  };
};

type FullIslandUiWorld = IslandWorld & {
  retryFullIslandDetail?: () => boolean | void;
  retryPackage?: (id: string) => boolean | void;
  prioritizeFullIslandPackage?: (id: string) => boolean | void;
};

const fullIslandUiWorld = world as FullIslandUiWorld;

function safeStorageRead(kind: 'local' | 'session', key: string) {
  try {
    return (kind === 'local' ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function safeStorageWrite(kind: 'local' | 'session', key: string, value: string) {
  try {
    (kind === 'local' ? window.localStorage : window.sessionStorage).setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeStorageRemove(kind: 'local' | 'session', key: string) {
  try {
    (kind === 'local' ? window.localStorage : window.sessionStorage).removeItem(key);
  } catch {
    // Storage can be blocked in privacy-restricted or embedded browser contexts.
  }
}

function readDevicePerformancePreferences(): DevicePerformancePreferences {
  const saved = safeStorageRead('local', devicePerformancePreferencesStorageKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object' && typeof parsed.fullIslandDetail === 'boolean') {
        return {
          ...parsed,
          version: typeof parsed.version === 'number' ? parsed.version : 1,
          fullIslandDetail: parsed.fullIslandDetail,
        };
      }
    } catch {
      // Fall through to the legacy boolean migration.
    }
  }
  const migrated = safeStorageRead('local', legacyFullIslandDetailStorageKey) === 'true';
  const preferences: DevicePerformancePreferences = { version: 1, fullIslandDetail: migrated };
  safeStorageWrite('local', devicePerformancePreferencesStorageKey, JSON.stringify(preferences));
  return preferences;
}

let fullIslandDevicePreferences = readDevicePerformancePreferences();
let fullIslandSafeStreamedSession = fullIslandDevicePreferences.fullIslandDetail
  && safeStorageRead('session', safeStreamedSessionStorageKey) === 'true';
let fullIslandContextRecoveryPhase: 'ready' | 'lost' | 'recovering' = 'ready';
let fullIslandRecoveryResetTimer = 0;
let lastFullIslandAnnouncementKey = '';

function saveFullIslandDetailPreference(enabled: boolean) {
  fullIslandDevicePreferences = {
    ...fullIslandDevicePreferences,
    version: Math.max(1, Number(fullIslandDevicePreferences.version) || 1),
    fullIslandDetail: enabled,
  };
  safeStorageWrite('local', devicePerformancePreferencesStorageKey, JSON.stringify(fullIslandDevicePreferences));
  // Keep the legacy value synchronized for rollback to an older build.
  safeStorageWrite('local', legacyFullIslandDetailStorageKey, String(enabled));
}

function applyPersistedFullIslandDetailPreference() {
  if (!worldReadyForFullIslandActivation) return;
  world.setFullIslandDetail(fullIslandDevicePreferences.fullIslandDetail && !fullIslandSafeStreamedSession);
  syncFullIslandDetailUI();
}

function finiteTelemetryNumber(...values: unknown[]) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function formatTelemetryCount(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number).toLocaleString() : '—';
}

function formatTelemetryMilliseconds(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? `${number.toFixed(1)} ms` : 'Unavailable';
}

function formatEstimatedMemory(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Unavailable';
  return bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(2)} GB`
    : `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

function readFullIslandLifecycle(streaming: FullIslandStreamingTelemetry) {
  const progress = streaming.fullIslandDetailProgress;
  const lifecycle = streaming.fullIslandLifecycle ?? progress;
  const total = Math.max(1, Math.round(finiteTelemetryNumber(progress.total, streaming.totalPackages, 41)));
  const ready = Math.min(total, Math.max(0, Math.round(finiteTelemetryNumber(lifecycle.ready, progress.ready, progress.loaded))));
  const failedPackageIds = Array.isArray(lifecycle.failedPackageIds)
    ? lifecycle.failedPackageIds
    : Array.isArray(progress.failedPackageIds) ? progress.failedPackageIds : [];
  const error = Math.max(failedPackageIds.length, Math.round(finiteTelemetryNumber(lifecycle.error, progress.error)));
  return {
    phase: String(lifecycle.phase ?? progress.phase ?? ''),
    total,
    ready,
    queued: Math.round(finiteTelemetryNumber(lifecycle.queued, progress.queued)),
    building: Math.round(finiteTelemetryNumber(lifecycle.building, progress.building)),
    warmingGpu: Math.round(finiteTelemetryNumber(lifecycle.warmingGpu, progress.warmingGpu)),
    error,
    currentPackageId: lifecycle.currentPackageId ?? progress.currentPackageId ?? null,
    failedPackageIds,
  };
}

function announceFullIslandMilestone(state: string, ready: number, total: number, errors: number) {
  const progressMilestone = state === 'loading'
    ? Math.min(100, Math.floor((ready / Math.max(1, total)) * 4) * 25)
    : 0;
  const key = state === 'loading' ? `${state}-${progressMilestone}` : `${state}-${errors}`;
  if (key === lastFullIslandAnnouncementKey) return;
  lastFullIslandAnnouncementKey = key;
  fullIslandStatusAnnouncer.textContent = state === 'loading'
    ? `Full Island Detail loading: ${ready} of ${total} packages ready.`
    : state === 'warming'
      ? 'Full Island Detail is warming GPU resources.'
      : state === 'ready'
        ? `Full Island Detail ready: all ${total} packages are available.`
        : state === 'slow'
          ? 'Full Island Detail is ready, but performance is below its target.'
          : state === 'error'
            ? `Full Island Detail encountered ${errors} package ${errors === 1 ? 'error' : 'errors'}.`
            : state === 'recovering'
              ? 'The renderer is recovering Full Island Detail after a graphics context interruption.'
              : fullIslandSafeStreamedSession
                ? 'Streamed detail is active for this browser session.'
                : 'Streamed detail is active.';
}

function syncFullIslandDetailUI(sceneStats?: FullIslandSceneStatistics) {
  const streaming = world.getStreamingSnapshot() as FullIslandStreamingTelemetry;
  const capabilities = world.getGpuDetailCapabilities() as ReturnType<IslandWorld['getGpuDetailCapabilities']> & {
    recoveryPhase?: string;
  };
  const lifecycle = readFullIslandLifecycle(streaming);
  const rendererRecoveryPhase = sceneStats?.renderer?.recoveryPhase ?? capabilities.recoveryPhase ?? fullIslandContextRecoveryPhase;
  const recovering = rendererRecoveryPhase === 'lost' || rendererRecoveryPhase === 'recovering';
  const warming = lifecycle.phase === 'warming-gpu' || lifecycle.warmingGpu > 0;
  const slow = lifecycle.phase === 'degraded' || Boolean(capabilities.performanceWarning);
  const requested = streaming.fullIslandDetailRequested;
  const ready = streaming.fullIslandDetailReady || lifecycle.phase === 'ready';
  let state = 'streamed';
  let chipLabel = fullIslandSafeStreamedSession ? 'Safe session' : 'Streamed';
  if (requested) {
    if (recovering) {
      state = 'recovering';
      chipLabel = 'Recovering';
    } else if (lifecycle.error > 0 || lifecycle.phase === 'error') {
      state = 'error';
      chipLabel = 'Error';
    } else if (slow) {
      state = 'slow';
      chipLabel = 'Slow';
    } else if (ready) {
      state = 'ready';
      chipLabel = 'Ready';
    } else if (warming) {
      state = 'warming';
      chipLabel = 'Warming GPU';
    } else {
      state = 'loading';
      chipLabel = `Loading ${lifecycle.ready}/${lifecycle.total}`;
    }
  }

  fullIslandDetailMonitor.dataset.state = state;
  fullIslandStatusChipLabel.textContent = chipLabel;
  fullIslandStatusChip.title = `Full Island Detail: ${chipLabel}`;
  fullIslandDetailInput.checked = requested;
  fullIslandDetailStatus.classList.toggle('warning', state === 'slow' || state === 'error');
  fullIslandDetailStatus.title = `${capabilities.renderer} · ${capabilities.batchingBackend} · physical VRAM is not exposed by the browser`;
  if (capabilities.performanceWarning) {
    fullIslandDetailStatus.textContent = capabilities.performanceWarning;
  } else if (fullIslandSafeStreamedSession && !requested) {
    fullIslandDetailStatus.textContent = 'Streamed for this browser session · device preference preserved';
  } else if (requested && !ready) {
    const activePackage = lifecycle.currentPackageId ? ` · ${lifecycle.currentPackageId}` : '';
    fullIslandDetailStatus.textContent = `${warming ? 'Warming GPU' : 'Loading complete detail'} ${lifecycle.ready}/${lifecycle.total}${activePackage}`;
  } else if (ready) {
    fullIslandDetailStatus.textContent = `${streaming.residentPackageCount}/${streaming.totalPackages} resident · GPU frustum culling active`;
  } else {
    fullIslandDetailStatus.textContent = `${capabilities.multiDrawSupported ? 'Multi-draw batching' : 'Instanced/merged batching'} · streamed detail`;
  }

  fullIslandStatusProgress.max = lifecycle.total;
  fullIslandStatusProgress.value = requested ? lifecycle.ready : 0;
  fullIslandStatusProgress.textContent = requested
    ? `${lifecycle.ready} of ${lifecycle.total}`
    : 'Full Island Detail inactive';
  fullIslandStatusProgressLabel.textContent = requested
    ? `${lifecycle.ready} of ${lifecycle.total} packages ready`
    : 'Full Island Detail inactive';
  fullIslandStatusSummary.textContent = state === 'error'
    ? `${lifecycle.error} package ${lifecycle.error === 1 ? 'failed' : 'failures'}; proxies remain available. Retry when ready.`
    : state === 'slow'
      ? capabilities.performanceWarning ?? 'Full detail remains active while Medium quality adapts expensive rendering work.'
      : state === 'recovering'
        ? 'Preserving selection and edits while GPU resources are restored in camera-priority order.'
        : state === 'ready'
          ? `All ${lifecycle.total} packages are resident at Detail level with GPU frustum culling.`
          : state === 'warming'
            ? `Preparing GPU resources${lifecycle.currentPackageId ? ` for ${lifecycle.currentPackageId}` : ''} before the atomic proxy swap.`
            : state === 'loading'
              ? `Building package detail${lifecycle.currentPackageId ? ` for ${lifecycle.currentPackageId}` : ''}; each proxy remains until its detail is ready.`
              : fullIslandSafeStreamedSession
                ? 'The device preference is preserved; streamed Detail/Mid/Far rendering is active for this session only.'
                : 'Streamed Detail/Mid/Far rendering and the bounded package cache are active.';

  fullIslandRenderer.textContent = capabilities.renderer;
  fullIslandBackend.textContent = capabilities.batchingBackend;
  const estimatedBytes = streaming.gpuBatching.estimatedGeometryBytes + streaming.gpuBatching.estimatedTextureBytes;
  fullIslandMemory.textContent = formatEstimatedMemory(estimatedBytes);
  fullIslandFailures.hidden = lifecycle.failedPackageIds.length === 0;
  fullIslandFailures.textContent = lifecycle.failedPackageIds.length > 0
    ? `Failed: ${lifecycle.failedPackageIds.join(', ')}`
    : '';
  fullIslandRetryButton.disabled = lifecycle.error === 0
    || (typeof fullIslandUiWorld.retryFullIslandDetail !== 'function' && typeof fullIslandUiWorld.retryPackage !== 'function');
  fullIslandLowerQualityButton.disabled = world.getGraphicsQuality() === 'low';
  fullIslandReturnStreamedButton.disabled = !requested && !fullIslandSafeStreamedSession;
  fullIslandSafeSessionButton.hidden = !fullIslandDevicePreferences.fullIslandDetail;
  fullIslandSafeSessionButton.disabled = fullIslandSafeStreamedSession && !requested;
  fullIslandSafeSessionButton.textContent = fullIslandSafeStreamedSession && !requested
    ? 'Safe session active'
    : 'Streamed this session';

  if (sceneStats) {
    const cpuP95 = sceneStats.frameTiming?.cpuP95Ms ?? sceneStats.frameTimeMs.p95;
    const gpuP95 = sceneStats.frameTiming?.gpuP95Ms;
    fullIslandDpr.textContent = `${sceneStats.effectivePixelRatio.toFixed(2)}×`;
    fullIslandCpuP95.textContent = formatTelemetryMilliseconds(cpuP95);
    fullIslandGpuP95.textContent = formatTelemetryMilliseconds(gpuP95);
    fullIslandDrawCalls.textContent = formatTelemetryCount(sceneStats.drawCalls);
    fullIslandTriangles.textContent = formatTelemetryCount(sceneStats.triangles);
  }
  syncAtlasReadiness(streaming);
  announceFullIslandMilestone(state, lifecycle.ready, lifecycle.total, lifecycle.error);
}

function setFullIslandStatusCardOpen(open: boolean) {
  fullIslandStatusCard.hidden = !open;
  fullIslandStatusChip.setAttribute('aria-expanded', String(open));
  if (open) syncFullIslandDetailUI(world.getSceneStatistics() as FullIslandSceneStatistics);
}

fullIslandStatusChip.addEventListener('click', () => {
  setFullIslandStatusCardOpen(fullIslandStatusCard.hidden);
});

fullIslandStatusClose.addEventListener('click', () => {
  setFullIslandStatusCardOpen(false);
  fullIslandStatusChip.focus();
});

document.addEventListener('pointerdown', (event) => {
  if (!fullIslandStatusCard.hidden && !fullIslandDetailMonitor.contains(event.target as Node)) {
    setFullIslandStatusCardOpen(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !fullIslandStatusCard.hidden) {
    setFullIslandStatusCardOpen(false);
    fullIslandStatusChip.focus();
  }
});

fullIslandDetailInput.addEventListener('change', () => {
  fullIslandSafeStreamedSession = false;
  safeStorageRemove('session', safeStreamedSessionStorageKey);
  const enabled = world.setFullIslandDetail(fullIslandDetailInput.checked);
  saveFullIslandDetailPreference(enabled);
  syncFullIslandDetailUI(fullIslandStatusCard.hidden ? undefined : world.getSceneStatistics() as FullIslandSceneStatistics);
  toast(
    enabled ? 'Full island detail loading' : 'Streamed detail restored',
    enabled
      ? 'All 41 exterior packages will load progressively and remain resident. The setting will never be disabled automatically.'
      : 'The eight-package LRU and normal Detail/Mid/Far streaming limits are active again.',
  );
});

fullIslandRetryButton.addEventListener('click', () => {
  const streaming = world.getStreamingSnapshot() as FullIslandStreamingTelemetry;
  const failedIds = readFullIslandLifecycle(streaming).failedPackageIds;
  let retryStarted = false;
  if (typeof fullIslandUiWorld.retryFullIslandDetail === 'function') {
    retryStarted = fullIslandUiWorld.retryFullIslandDetail() !== false;
  } else if (typeof fullIslandUiWorld.retryPackage === 'function') {
    failedIds.forEach((id) => {
      retryStarted = fullIslandUiWorld.retryPackage?.(id) !== false || retryStarted;
    });
  }
  toast(
    retryStarted ? 'Retrying Full Island Detail' : 'Retry unavailable',
    retryStarted ? 'Failed packages have returned to the prioritized build queue.' : 'No retryable package is currently available.',
    retryStarted ? 'normal' : 'error',
  );
  syncFullIslandDetailUI(fullIslandStatusCard.hidden ? undefined : world.getSceneStatistics() as FullIslandSceneStatistics);
});

fullIslandLowerQualityButton.addEventListener('click', () => {
  const current = world.getGraphicsQuality();
  const next: GraphicsQuality = current === 'high' ? 'medium' : 'low';
  world.setGraphicsQuality(next);
  envQualitySelect.value = next;
  syncFountainControlPanel();
  toast('Graphics quality lowered', `${next === 'medium' ? 'Medium adaptive' : 'Low'} quality is active; Full Island Detail remains enabled.`);
  syncFullIslandDetailUI(world.getSceneStatistics() as FullIslandSceneStatistics);
});

fullIslandReturnStreamedButton.addEventListener('click', () => {
  fullIslandSafeStreamedSession = false;
  safeStorageRemove('session', safeStreamedSessionStorageKey);
  saveFullIslandDetailPreference(false);
  world.setFullIslandDetail(false);
  syncFullIslandDetailUI(world.getSceneStatistics() as FullIslandSceneStatistics);
  toast('Streamed detail restored', 'The eight-package LRU and normal Detail/Mid/Far streaming limits are active again.');
});

fullIslandSafeSessionButton.addEventListener('click', () => {
  fullIslandSafeStreamedSession = true;
  safeStorageWrite('session', safeStreamedSessionStorageKey, 'true');
  world.setFullIslandDetail(false);
  syncFullIslandDetailUI(world.getSceneStatistics() as FullIslandSceneStatistics);
  toast('Streamed safe session', 'Full Island Detail is off for this browser session only. Your device preference is preserved.');
});

const rendererCanvas = viewport.querySelector('canvas');
rendererCanvas?.addEventListener('webglcontextlost', () => {
  fullIslandContextRecoveryPhase = 'lost';
  window.clearTimeout(fullIslandRecoveryResetTimer);
  syncFullIslandDetailUI();
});
rendererCanvas?.addEventListener('webglcontextrestored', () => {
  fullIslandContextRecoveryPhase = 'recovering';
  window.clearTimeout(fullIslandRecoveryResetTimer);
  fullIslandRecoveryResetTimer = window.setTimeout(() => {
    fullIslandContextRecoveryPhase = 'ready';
    syncFullIslandDetailUI();
  }, 5000);
  syncFullIslandDetailUI();
});

async function toggleAcademicAudio() {
  const muted = await world.setAcademicAudioMuted(!world.isAcademicAudioMuted());
  syncAcademicAudioButtons();
  syncFountainControlPanel();
  toast(
    muted ? 'Campus audio muted' : 'Campus audio enabled',
    muted
      ? 'Ambient wind, window rain, page turns, clocks, footsteps, and bells are off.'
      : 'Restrained exterior campus ambience is active.',
  );
}

academicAudioButton.addEventListener('click', () => void toggleAcademicAudio());

function refreshPerformanceStats(sceneStats?: FullIslandSceneStatistics) {
  const stats = sceneStats ?? world.getSceneStatistics() as FullIslandSceneStatistics;
  const streaming = stats.streaming as FullIslandStreamingTelemetry;
  const lifecycle = readFullIslandLifecycle(streaming);
  const cpuP50 = stats.frameTiming?.cpuP50Ms ?? stats.frameTimeMs.p50;
  const cpuP95 = stats.frameTiming?.cpuP95Ms ?? stats.frameTimeMs.p95;
  const gpuP50 = stats.frameTiming?.gpuP50Ms;
  const gpuP95 = stats.frameTiming?.gpuP95Ms;
  const estimatedBytes = streaming.gpuBatching.estimatedGeometryBytes + streaming.gpuBatching.estimatedTextureBytes;
  const rendererInfo = stats.renderer;
  debugStats.textContent = [
    'PERFORMANCE HUD · ZERO GEOMETRY',
    `quality       ${stats.quality} @ ${stats.effectivePixelRatio.toFixed(2)}x`,
    `CPU p50/95    ${cpuP50.toFixed(1)} / ${cpuP95.toFixed(1)} ms`,
    `GPU p50/95    ${formatTelemetryMilliseconds(gpuP50)} / ${formatTelemetryMilliseconds(gpuP95)}`,
    `bottleneck    ${stats.frameTiming?.bottleneck ?? 'CPU timing only'}`,
    `target        ${stats.frameTiming?.targetFps ?? 60} FPS`,
    `visible mesh  ${stats.visibleMeshes.toLocaleString()}`,
    `geometries    ${stats.geometries.toLocaleString()}`,
    `triangles     ${stats.triangles.toLocaleString()}`,
    `draw calls    ${stats.drawCalls.toLocaleString()}`,
    `textures      ${stats.textureCount.toLocaleString()}`,
    `stream loaded ${stats.streaming.loadedPackageCount}/${stats.streaming.cacheCapacity}`,
    `detail policy ${stats.streaming.detailPolicy}`,
    `stream detail ${stats.streaming.residentDetailPackages.length}/${stats.streaming.activeDetailLimit}`,
    `GPU batches   ${stats.streaming.gpuBatching.batchCount.toLocaleString()} / ${stats.streaming.gpuBatching.batchedSourceCount.toLocaleString()} sources`,
    `GPU backend   ${stats.streaming.gpuBatching.backend}`,
    `GPU estimate  ${formatEstimatedMemory(estimatedBytes)}`,
    `renderer      ${stats.gpuDetail.renderer}`,
    `full phase    ${lifecycle.phase || (streaming.fullIslandDetailReady ? 'ready' : streaming.detailPolicy)}`,
    `full ready    ${lifecycle.ready}/${lifecycle.total} · errors ${lifecycle.error}`,
    `visible ready ${streaming.visiblePackageReadiness ? `${streaming.visiblePackageReadiness.ready}/${streaming.visiblePackageReadiness.total}` : 'unavailable'}`,
    `live objects  ${formatTelemetryCount(streaming.liveRenderObjectCount)}`,
    `batch slots   ${streaming.batchOccupancy ? `${streaming.batchOccupancy.active.toLocaleString()}/${streaming.batchOccupancy.capacity.toLocaleString()} (${Math.round(streaming.batchOccupancy.ratio * 100)}%)` : 'unavailable'}`,
    `micro detail  ${streaming.microdetail ? `${formatTelemetryCount(streaming.microdetail.visibleMicro ?? streaming.microdetail.visible)} visible / ${formatTelemetryCount(streaming.microdetail.culledMicro ?? streaming.microdetail.culled)} culled` : 'unavailable'}`,
    `collision     ${streaming.collisionResidentCellCount?.toLocaleString() ?? 'unavailable'} resident cells`,
    `transmission  ${rendererInfo ? (rendererInfo.transmissionPassActive ? 'active' : 'off') : 'unavailable'}`,
    `depth buffer  ${rendererInfo ? (rendererInfo.reverseDepthBuffer ? 'reverse' : 'standard') : 'unavailable'}`,
    `shaders       ${rendererInfo?.shaderProgramCount?.toLocaleString() ?? 'unavailable'}`,
    `hover pick    ${formatTelemetryMilliseconds(stats.frameTiming?.hoverPickP95Ms)}`,
    `mid / far     ${stats.streaming.midPackageCount} / ${stats.streaming.farPackageCount}`,
    `animations    ${stats.activeAnimationNodes}`,
    `helpers       ${world.isDebugMode() ? 'collision/light visible' : 'off (separate control)'}`,
  ].join('\n');
}

performanceButton.addEventListener('click', () => {
  const visible = debugStats.hidden;
  debugStats.hidden = !visible;
  performanceButton.setAttribute('aria-pressed', String(visible));
  if (visible) refreshPerformanceStats();
  toast(visible ? 'Performance HUD visible' : 'Performance HUD hidden', visible ? 'Renderer statistics are visible without adding debug geometry.' : 'Performance statistics are hidden.');
});

debugButton.addEventListener('click', () => {
  const enabled = world.setDebugMode(!world.isDebugMode());
  debugButton.setAttribute('aria-pressed', String(enabled));
  if (!debugStats.hidden) refreshPerformanceStats();
  toast(enabled ? 'Academic helpers enabled' : 'Academic helpers disabled', enabled ? 'Collision bounds and light positions are visible. Performance statistics remain independently controlled.' : 'Collision and light helpers are hidden.');
});

world.setGraphicsQuality(envQualitySelect.value as GraphicsQuality);
applyPersistedFullIslandDetailPreference();
const gpuDetailUiInterval = window.setInterval(() => {
  if (document.hidden || world.isSyntheticShoreActive()) return;
  const needsSceneStatistics = !fullIslandStatusCard.hidden || !debugStats.hidden;
  const sceneStats = needsSceneStatistics ? world.getSceneStatistics() as FullIslandSceneStatistics : undefined;
  syncFullIslandDetailUI(sceneStats);
  if (!debugStats.hidden) refreshPerformanceStats(sceneStats);
}, 1000);

required<HTMLButtonElement>('#locate-synthetic-shore').addEventListener('click', () => {
  setMode('explore');
  world.focusSyntheticPier();
  toast('Synthetic Shore', 'Click the anchor pier to visit the beach, or approach its entrance in Walk.');
});

const savedTheme = localStorage.getItem('youtopy_theme');
if (savedTheme === 'cleantech') {
  document.body.classList.add('theme-cleantech');
  updateThemeUI(true);
  world.setTimeOfDay('noon');
  const icon = timeToggle.querySelector<HTMLElement>('.action-icon');
  const label = timeToggle.querySelector<HTMLElement>('.action-label');
  if (icon) icon.textContent = '◒';
  if (label) label.textContent = 'Daylight';
} else {
  updateThemeUI(false);
  world.setTimeOfDay('night');
}
syncEnvironmentUI();
syncAcademicAudioButtons();

window.addEventListener('beforeunload', () => {
  window.clearInterval(gpuDetailUiInterval);
  window.clearTimeout(fullIslandRecoveryResetTimer);
  world.dispose();
}, { once: true });
setGizmo(activeGizmo);
