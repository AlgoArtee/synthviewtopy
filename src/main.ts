import * as THREE from 'three';
import './style.css';
import { biomes, districts } from './data/districts';
import {
  ACADEMIC_CAMPUS_BUILDINGS,
  type AcademicCampusBuilding,
} from './data/academicCampus';
import {
  IslandWorld,
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

const viewport = required<HTMLElement>('#viewport');
const districtList = required<HTMLElement>('#district-list');
const districtSearch = required<HTMLInputElement>('#district-search');
const inspectorTitle = required<HTMLElement>('#inspector-title');
const selectionIndex = required<HTMLElement>('#selection-index');
const emptyInspector = required<HTMLElement>('#empty-inspector');
const inspectorContent = required<HTMLElement>('#inspector-content');
const selectionKind = required<HTMLElement>('#selection-kind');
const selectionDescription = required<HTMLElement>('#selection-description');
const selectionRing = required<HTMLElement>('#selection-ring');
const selectionArchetype = required<HTMLElement>('#selection-archetype');
const positionInputs = {
  x: required<HTMLInputElement>('#pos-x'),
  y: required<HTMLInputElement>('#pos-y'),
  z: required<HTMLInputElement>('#pos-z'),
};
const rotationInput = required<HTMLInputElement>('#rot-y');
const rotationOutput = required<HTMLOutputElement>('#rot-output');
const scaleInput = required<HTMLInputElement>('#scale-uniform');
const scaleOutput = required<HTMLElement>('#scale-output');
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
const themeToggleButton = required<HTMLButtonElement>('#toggle-theme');
const undoActionButton = required<HTMLButtonElement>('#undo-action');
const envTimeSelect = required<HTMLSelectElement>('#env-time');
const envWeatherSelect = required<HTMLSelectElement>('#env-weather');
const envSeasonSelect = required<HTMLSelectElement>('#env-season');
const envQualitySelect = required<HTMLSelectElement>('#env-quality');
const academicAudioButton = required<HTMLButtonElement>('#academic-audio-toggle');
const debugButton = required<HTMLButtonElement>('#debug-toggle');
const debugStats = required<HTMLElement>('#debug-stats');
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

const allDefinitions: SceneDefinition[] = [...districts, ...biomes];
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

const categoryNames: Record<string, string> = {
  core: 'Central landmark',
  bioscience: 'Life science',
  engineering: 'Engineering',
  chemistry: 'Chemistry',
  physics: 'Physics',
  civic: 'Civic & residential',
  commercial: 'Commercial',
  academic: 'Academic',
  security: 'Restricted research',
  environmental: 'Environmental science',
  infrastructure: 'Operations',
  biome: 'Climate biome',
  imported: 'Imported asset',
  editor: 'Design studio asset',
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

function getAtlasGroup(definition: SceneDefinition) {
  if (definition.category === 'core') return 'Core systems';
  if (definition.category === 'bioscience') return 'Life sciences';
  if (['engineering', 'chemistry', 'physics'].includes(definition.category)) return 'Applied research';
  if (['civic', 'commercial', 'academic'].includes(definition.category)) return 'Civic campus';
  if (['security', 'environmental', 'infrastructure'].includes(definition.category)) return 'Operations & edge';
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

function createAtlasButton(definition: SceneDefinition, index: number) {
  const button = document.createElement('button');
  button.className = 'district-item';
  button.dataset.id = definition.id;
  button.style.setProperty('--item-accent', definition.accent);
  button.innerHTML = `
    <span class="district-symbol">${escapeHtml(symbolFor(definition))}</span>
    <span class="district-item-copy">
      <strong>${escapeHtml(definition.name)}</strong>
      <small>${escapeHtml(categoryNames[definition.category] ?? definition.category)}</small>
    </span>
    <span class="district-item-index">${String(index).padStart(2, '0')}</span>
  `;
  button.addEventListener('click', () => {
    world.select(definition.id, 'ui');
    if (currentMode === 'explore') world.focus(definition.id);
  });
  button.addEventListener('dblclick', () => world.focus(definition.id));
  return button;
}

function renderAtlas(query = '') {
  const normalizedQuery = query.trim().toLowerCase();
  const grouped = new Map<string, SceneDefinition[]>();
  groupOrder.forEach((group) => grouped.set(group, []));
  allDefinitions.forEach((definition) => {
    const haystack = `${definition.name} ${definition.sourceLabel ?? ''} ${definition.category} ${definition.archetype}`.toLowerCase();
    if (normalizedQuery && !haystack.includes(normalizedQuery)) return;
    grouped.get(getAtlasGroup(definition))!.push(definition);
  });
  districtList.innerHTML = '';
  listButtons.clear();
  grouped.forEach((definitions, groupName) => {
    if (!definitions.length) return;
    const group = document.createElement('section');
    group.className = 'district-group';
    const title = document.createElement('div');
    title.className = 'district-group-title';
    title.innerHTML = `<span>${escapeHtml(groupName)}</span><span>${String(definitions.length).padStart(2, '0')}</span>`;
    group.appendChild(title);
    definitions.forEach((definition) => {
      const index = definitionIndex.get(definition.id) ?? allDefinitions.indexOf(definition) + 1;
      const button = createAtlasButton(definition, index);
      if (definition.id === currentSelection?.id) button.classList.add('active');
      listButtons.set(definition.id, button);
      group.appendChild(button);
    });
    districtList.appendChild(group);
  });
  if (!districtList.childElementCount) {
    districtList.innerHTML = '<div class="empty-search">No districts match this search.</div>';
  }
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
    ? 'Inside building — add, select, move, rotate, scale, import, or delete furnishings.'
    : currentEditWorkspace === 'interior'
      ? 'Select a building, choose Enter Interior, then furnish its editable room.'
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

function updateInspector(definition: SceneDefinition | null, state?: ObjectState | null) {
  currentSelection = definition;
  document.body.classList.toggle('has-selection', Boolean(definition));
  listButtons.forEach((button, id) => button.classList.toggle('active', id === definition?.id));
  if (!definition) {
    inspectorTitle.textContent = 'No selection';
    selectionIndex.textContent = '—';
    emptyInspector.hidden = false;
    inspectorContent.hidden = true;
    sceneCardTitle.textContent = 'Central research campus';
    sceneCardCopy.textContent = '41 editable zones · procedural architecture · Blender-ready GLB';
    refreshEditWorkspaceUI();
    return;
  }
  const objectState = state ?? world.getObjectState(definition.id);
  inspectorTitle.textContent = definition.name;
  selectionIndex.textContent = `#${String(definitionIndex.get(definition.id) ?? allDefinitions.indexOf(definition) + 1).padStart(2, '0')}`;
  selectionKind.textContent = categoryNames[definition.category] ?? definition.category;
  selectionDescription.textContent = definition.description;
  selectionRing.textContent = definition.ring.replace('-', ' ');
  selectionArchetype.textContent = definition.archetype.replaceAll('-', ' ');
  emptyInspector.hidden = true;
  inspectorContent.hidden = false;
  sceneCardTitle.textContent = definition.name;
  sceneCardCopy.textContent = `${categoryNames[definition.category] ?? definition.category} · ${definition.ring.replace('-', ' ')} · editable object group`;
  if (objectState) {
    updateTransformFields(objectState);
    updateCustomizationFields(objectState);
  }
  accentInput.value = definition.accent;
  const listButton = listButtons.get(definition.id);
  listButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    walk: '<span><b>WASD</b> move</span><span><b>Space</b> tap / hold jump</span><span><b>T</b> bike turbo</span><span><b>E</b> interact</span>',
  };
  required<HTMLElement>('#interaction-hint').innerHTML = hints[mode];
  if (mode === 'edit' && currentSelection) toast('Edit mode active', 'Use the gizmo or inspector fields; changes are included in the GLB export.');
  if (mode === 'walk') {
    sceneCardTitle.textContent = 'Human-scale campus walk';
    sceneCardCopy.textContent = '1.62 m eye level for a 1.7 m adult · variable-height Space jump · T toggles 12 m/s bike-speed turbo';
    walkStatus.textContent = 'Human-scale exploration ready';
    walkLookButton.textContent = 'Click to look around';
  }
  refreshEditWorkspaceUI();
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

const world = new IslandWorld(viewport, {
  onSelection: (definition) => {
    updateInspector(definition);
    inspector.classList.toggle('hidden-panel', currentMode === 'walk' || (!definition && currentMode !== 'edit'));
    if (currentMode === 'walk' && definition) {
      showWalkInteractionMenu(definition);
    }
  },
  onTransform: refreshSelectedState,
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
      sceneCardCopy.textContent = 'Interior Design · isolated editable room · GLB-ready hierarchy';
    }
  },
  onUndoStackChange: (canUndo) => {
    undoActionButton.disabled = !canUndo;
  },
  onReady: () => {
    loadingStatus.textContent = 'Spatial twin ready';
    window.setTimeout(() => loadingScreen.classList.add('done'), 220);
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
        : '41 editable zones · procedural architecture · Blender-ready GLB';
    }
  },
});

window.labIsland = world;
window.render_game_to_text = () => JSON.stringify(world.getTextSnapshot());
window.advanceTime = (milliseconds: number) => world.advanceTime(milliseconds);

allDefinitions.forEach((definition, index) => definitionIndex.set(definition.id, index + 1));
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
    toast('Interior Design active', `${buildingName} is open as an isolated, editable interior.`);
  }
});

exitInteriorButton.addEventListener('click', () => {
  world.exitInterior();
  renderAssetLibrary();
  toast('Returned to island', 'Select another building or continue editing the landscape.');
});

walkLookButton.addEventListener('click', () => world.activateWalkLook());
walkTurboButton.addEventListener('click', () => world.toggleWalkTurbo());
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
rotationInput.addEventListener('focus', undoOnFocus);
scaleInput.addEventListener('focus', undoOnFocus);
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

saveProjectButton.addEventListener('click', () => {
  world.saveProjectToLocalStorage();
  toast('Project Saved', 'Changes to layout, colors, patterns, and behaviors saved to LocalStorage.');
});

refreshProjectButton.addEventListener('click', () => {
  if (world.loadProjectFromLocalStorage()) {
    if (currentSelection) {
      updateInspector(world.getDefinition(currentSelection.id), world.getObjectState(currentSelection.id));
    } else {
      updateInspector(null);
    }
    syncEnvironmentUI();
    toast('Project Reloaded', 'Successfully loaded from the last saved state.');
  } else {
    toast('Load Failed', 'No saved project found in LocalStorage.', 'error');
  }
});

undoActionButton.addEventListener('click', () => {
  if (world.undo()) {
    if (currentSelection) {
      updateInspector(world.getDefinition(currentSelection.id), world.getObjectState(currentSelection.id));
    } else {
      updateInspector(null);
    }
    syncEnvironmentUI();
    toast('Action Undone', 'The last customization or transformation step has been reverted.');
  } else {
    toast('Cannot Undo', 'No remaining history steps in the undo stack.', 'error');
  }
});

editStudioCollapseButton.addEventListener('click', () => {
  const collapsed = editWorkspacePanel.classList.toggle('collapsed');
  editStudioCollapseButton.textContent = collapsed ? '▲' : '▼';
});

saveInspectorChangesButton.addEventListener('click', () => {
  world.saveProjectToLocalStorage();
  toast('Changes Saved', 'Object customizations and placement saved to LocalStorage.');
});

required<HTMLButtonElement>('#focus-selection').addEventListener('click', () => {
  if (currentSelection) world.focus(currentSelection.id);
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
  if (world.getActiveInteriorBuildingId()) {
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

async function handleImport(files: File[]) {
  loadingStatus.textContent = 'Resolving imported mesh hierarchy…';
  loadingScreen.classList.remove('done');
  try {
    const results = await world.importFiles(files);
    if (!results.length) throw new Error('No supported GLB, GLTF, OBJ, or STL file was found.');
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
  if (world.getActiveInteriorBuildingId()) {
    void handleImport(files);
    return;
  }
  queuedImportFiles = files;
  if (currentMode === 'walk') setMode('edit');
  world.beginImportPlacement();
  toast('Asset ready to place', 'Click a walkable island surface to place the dropped building.');
});

required<HTMLButtonElement>('#export-trigger').addEventListener('click', async (event) => {
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

document.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement;
  const editingText = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
  if (event.key === '/' && !editingText) {
    event.preventDefault();
    districtSearch.focus();
    return;
  }
  if (editingText) return;
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
    world.clearSelection('ui');
  }
  if (event.key === 'Home') world.overview();
});

let currentAcademicBuilding: AcademicCampusBuilding | null = null;

function editableAcademicHistory(record: AcademicCampusBuilding) {
  return localStorage.getItem(`blackwood-history:${record.id}`) ?? record.history;
}

function showAcademicBuildingCard(record: AcademicCampusBuilding) {
  currentAcademicBuilding = record;
  academicBuildingTitle.textContent = record.name;
  academicBuildingMeta.textContent = `Founded ${record.founded} · ${record.zone} · ${record.kind}`;
  academicBuildingDescription.textContent = record.description;
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

academicBuildingClose.addEventListener('click', () => {
  academicBuildingCard.hidden = true;
});
academicMapClose.addEventListener('click', () => {
  academicCampusMap.hidden = true;
});
academicHistorySave.addEventListener('click', () => {
  if (!currentAcademicBuilding) return;
  localStorage.setItem(`blackwood-history:${currentAcademicBuilding.id}`, academicHistoryEditor.value.trim());
  toast('History saved', `${currentAcademicBuilding.name}'s fictional history is stored in this browser.`);
});

function showWalkInteractionMenu(definition: SceneDefinition) {
  if (world.walkController?.pointerControls.isLocked) {
    world.walkController.pointerControls.unlock();
  }

  const state = world.getObjectState(definition.id);
  const rawList = state?.interactions ?? [];

  const academicHotspot = definition.id === 'academic-libraries-theoretical-labs'
    ? world.getActiveAcademicHotspot()
    : null;
  const interactions = (rawList.length ? rawList : ['examine']).filter(
    (action) => action !== 'open main gate' || definition.id !== 'academic-libraries-theoretical-labs' || world.isAcademicMainGateNearby(),
  );
  const academicSnapshot = definition.id === 'academic-libraries-theoretical-labs'
    ? world.getTextSnapshot()
    : null;
  const gateActionLabel = academicSnapshot?.atmosphere.timeOfDay !== 'night'
    ? 'Main gate open for daylight'
    : academicSnapshot?.academicDistrict?.gateOpen
      ? 'Close main gate'
      : 'Open main gate';
  walkInteractionMenuTitle.textContent = academicHotspot?.name ?? definition.name;
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
  const group = world.objectGroups.get(definition.id);
  if (!group) return;

  if (definition.id === 'academic-libraries-theoretical-labs') {
    if (action === 'campus map') {
      showAcademicCampusMap();
      return;
    }
    const result = world.performAcademicInteraction(action);
    if (action === 'inspect entrance' && result.building) showAcademicBuildingCard(result.building);
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
  envQualitySelect.value = world.getGraphicsQuality();
}

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
  toast('Graphics quality', `${envQualitySelect.options[envQualitySelect.selectedIndex].text} quality is active.`);
});

academicAudioButton.addEventListener('click', async () => {
  const muted = await world.setAcademicAudioMuted(!world.isAcademicAudioMuted());
  academicAudioButton.setAttribute('aria-pressed', String(!muted));
  const label = academicAudioButton.querySelector<HTMLElement>('.utility-label');
  if (label) label.textContent = muted ? 'Audio muted' : 'Audio on';
  toast(muted ? 'Campus audio muted' : 'Campus audio enabled', muted ? 'Ambient wind, rain, and bell audio are off.' : 'Quiet synthesized wind and weather ambience is active.');
});

function refreshDebugStats() {
  const stats = world.getSceneStatistics();
  debugStats.textContent = [
    'ACADEMIC DEBUG',
    `quality       ${stats.quality}`,
    `visible mesh  ${stats.visibleMeshes.toLocaleString()}`,
    `geometries    ${stats.geometries.toLocaleString()}`,
    `triangles     ${stats.triangles.toLocaleString()}`,
    `draw calls    ${stats.drawCalls.toLocaleString()}`,
    `textures      ${stats.textureCount.toLocaleString()}`,
    'green = collision · cyan = light',
  ].join('\n');
}

debugButton.addEventListener('click', () => {
  const enabled = world.setDebugMode(!world.isDebugMode());
  debugButton.setAttribute('aria-pressed', String(enabled));
  debugStats.hidden = !enabled;
  if (enabled) refreshDebugStats();
  toast(enabled ? 'Academic debug enabled' : 'Academic debug disabled', enabled ? 'Collision bounds, light positions, and scene statistics are visible.' : 'Debug helpers are hidden.');
});

world.setGraphicsQuality(envQualitySelect.value as GraphicsQuality);

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

window.addEventListener('beforeunload', () => world.dispose(), { once: true });
setGizmo(activeGizmo);
