import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const facilities = [
  ['blackwood-great-hall', 'Blackwood University Great Hall'],
  ['ashcroft-grand-library', 'Cerebrum Externum'],
  ['wren-rare-books', 'Wren Rare Books Library'],
  ['institute-theoretical-sciences', 'Institute for Theoretical Sciences'],
  ['blackwood-lecture-hall', 'Blackwood Collegiate Lecture Hall'],
  ['scholars-cloister-archive', 'Scholars Cloister and Archive'],
  ['st-anselm-chapel', 'St Anselm Chapel'],
  ['erasmus-humanities-hall', 'Erasmus Humanities Hall'],
  ['halley-observatory', 'Halley Observatory'],
  ['faraday-physics-building', 'Faraday Natural Philosophy Building'],
  ['founders-dining-hall', 'Founders Dining Hall'],
  ['marlowe-residences', 'Marlowe Student Residences'],
  ['north-service-yard', 'North Service and Boiler Court'],
  ['blackwater-boathouse', 'Blackwater Rowing House'],
].map(([recordId, name]) => ({ id: `academic-building-${recordId}`, name }));

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

try {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  try {
    await page.waitForFunction(
      () => Boolean(window.labIsland?.getDefinition('academic-building-blackwood-great-hall')),
      undefined,
      // Interval polling remains reliable when the dense island's initial
      // software-rendered frame occupies the animation loop for a long time.
      { timeout: 120_000, polling: 500 },
    );
  } catch (error) {
    const diagnostics = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      readyState: document.readyState,
      hasLabIsland: Boolean(window.labIsland),
      academicDefinition: window.labIsland?.getDefinition('academic-building-blackwood-great-hall') ?? null,
      registeredAcademicIds: window.labIsland
        ? Array.from(window.labIsland.objectGroups.keys()).filter((id) => id.startsWith('academic-building-'))
        : [],
      loadingStatus: document.querySelector('#loading-status')?.textContent ?? null,
      bodyText: document.body.innerText.slice(0, 500),
    }));
    throw new Error(`Academic editor did not initialize: ${consoleErrors.join('\n') || error.message}\n${JSON.stringify(diagnostics)}`);
  }
  await page.locator('.mode[data-mode="edit"]').click();

  const audit = await page.evaluate((expected) => {
    const world = window.labIsland;
    const results = expected.map(({ id, name }) => {
      const definition = world.getDefinition(id);
      const group = world.objectGroups.get(id);
      world.select(id, 'system');
      const taggedIds = new Set();
      group?.traverse((child) => taggedIds.add(child.userData.selectableId));
      return {
        id,
        expectedName: name,
        actualName: definition?.name ?? null,
        category: definition?.category ?? null,
        registered: Boolean(group),
        editable: group?.userData.editable === true,
        tagCount: taggedIds.size,
        onlyOwnSelectionTag: taggedIds.size === 1 && taggedIds.has(id),
        gizmoAttached: world.transformControls.object === group,
        selectedId: world.getTextSnapshot().selected?.id ?? null,
      };
    });
    return {
      results,
      atlasIds: Array.from(document.querySelectorAll('[data-id^="academic-building-"]'))
        .map((element) => element.getAttribute('data-id')),
      labelCount: document.querySelectorAll('.academic-building-label').length,
      mode: world.getTextSnapshot().mode,
    };
  }, facilities);

  const failures = audit.results.filter((result) => (
    result.actualName !== result.expectedName
    || result.category !== 'academic-building'
    || !result.registered
    || !result.editable
    || !result.onlyOwnSelectionTag
    || !result.gizmoAttached
    || result.selectedId !== result.id
  ));
  if (failures.length) throw new Error(`Facility registration failures: ${JSON.stringify(failures, null, 2)}`);
  if (new Set(audit.atlasIds).size !== facilities.length) {
    throw new Error(`Expected ${facilities.length} Academic Atlas entries, found ${new Set(audit.atlasIds).size}`);
  }
  if (audit.labelCount !== facilities.length) {
    throw new Error(`Expected ${facilities.length} Academic edit labels, found ${audit.labelCount}`);
  }
  if (audit.mode !== 'edit') throw new Error(`Expected edit mode, found ${audit.mode}`);

  const metadataTarget = facilities[1];
  const renamedMetadata = {
    name: 'Cerebrum Knowledge Commons',
    label: 'Cerebrum Commons',
    description: 'A renewed library of lancet windows, deep buttresses, and collaborative amber reading rooms.',
  };
  await page.locator(`[data-id="${metadataTarget.id}"]`).click();
  await page.locator('#object-name').fill(renamedMetadata.name);
  await page.locator('#object-label').fill(renamedMetadata.label);
  await page.locator('#object-description').fill(renamedMetadata.description);
  await page.locator('#save-inspector-changes').click();
  await page.locator('#district-search').fill(renamedMetadata.label);
  const matchingAtlasEntries = await page.locator(`[data-id="${metadataTarget.id}"]`).count();
  await page.locator('#district-search').fill('');

  const metadataAudit = await page.evaluate(({ id, expected }) => {
    const world = window.labIsland;
    const definition = world.getDefinition(id);
    const saved = JSON.parse(localStorage.getItem('youtopy_saved_project') ?? '{}');
    const savedDefinition = saved.objects?.find((object) => object.id === id);
    const label = document.querySelector(`[data-label-id="${id}"]`);
    const atlas = document.querySelector(`[data-id="${id}"]`);
    const group = world.objectGroups.get(id);
    const snapshot = world.getTextSnapshot().selected;
    const campusMarker = document.querySelector('[data-academic-building-id="ashcroft-grand-library"]');
    return {
      definition,
      savedDefinition,
      labelText: label?.textContent ?? null,
      atlasName: atlas?.querySelector('strong')?.textContent ?? null,
      inspectorTitle: document.querySelector('#inspector-title')?.textContent ?? null,
      inspectorDescription: document.querySelector('#selection-description')?.textContent ?? null,
      groupMetadata: group ? {
        displayName: group.userData.displayName,
        displayLabel: group.userData.displayLabel,
        description: group.userData.description,
      } : null,
      campusMapName: campusMarker?.querySelector('span')?.textContent ?? null,
      snapshot,
      idStable: definition?.id === id && world.objectGroups.has(id),
      expected,
    };
  }, { id: metadataTarget.id, expected: renamedMetadata });
  const metadataMatches = (value) => value
    && value.name === renamedMetadata.name
    && value.label === renamedMetadata.label
    && value.description === renamedMetadata.description;
  if (!metadataMatches(metadataAudit.definition)
    || !metadataMatches(metadataAudit.savedDefinition)
    || !metadataMatches(metadataAudit.snapshot)
    || metadataAudit.labelText !== renamedMetadata.label
    || metadataAudit.atlasName !== renamedMetadata.name
    || metadataAudit.inspectorTitle !== renamedMetadata.name
    || metadataAudit.inspectorDescription !== renamedMetadata.description
    || !metadataAudit.idStable
    || matchingAtlasEntries !== 1
    || metadataAudit.groupMetadata?.displayName !== renamedMetadata.name
    || metadataAudit.groupMetadata?.displayLabel !== renamedMetadata.label
    || metadataAudit.groupMetadata?.description !== renamedMetadata.description
    || metadataAudit.campusMapName !== renamedMetadata.name) {
    throw new Error(`Metadata editing failed: ${JSON.stringify({ metadataAudit, matchingAtlasEntries }, null, 2)}`);
  }

  const academicCardMetadata = await page.evaluate(() => {
    document.querySelector('[data-academic-building-id="ashcroft-grand-library"]')?.click();
    const result = {
      title: document.querySelector('#academic-building-title')?.textContent ?? null,
      description: document.querySelector('#academic-building-description')?.textContent ?? null,
    };
    document.querySelector('#academic-building-close')?.click();
    document.querySelector('#inspector-content')?.scrollTo(0, 0);
    return result;
  });
  if (academicCardMetadata.title !== renamedMetadata.name
    || academicCardMetadata.description !== renamedMetadata.description) {
    throw new Error(`Academic card metadata is stale: ${JSON.stringify(academicCardMetadata, null, 2)}`);
  }

  await fs.mkdir('output/playwright', { recursive: true });
  await page.screenshot({ path: 'output/playwright/object-metadata-edit.png', fullPage: true });
  await page.locator('#refresh-project').click();
  const reloadMetadata = await page.evaluate((id) => window.labIsland.getDefinition(id), metadataTarget.id);
  if (!metadataMatches(reloadMetadata)) {
    throw new Error(`Metadata save/reload failed: ${JSON.stringify(reloadMetadata, null, 2)}`);
  }

  await page.evaluate(({ id, edited }) => {
    const world = window.labIsland;
    world.saveUndoState();
    world.setObjectMetadata(id, {
      name: `${edited.name} Annex`,
      label: `${edited.label} Annex`,
      description: `${edited.description} Annex test.`,
    });
  }, { id: metadataTarget.id, edited: renamedMetadata });
  await page.locator('#undo-action').click();
  const undoMetadata = await page.evaluate((id) => window.labIsland.getDefinition(id), metadataTarget.id);
  if (!metadataMatches(undoMetadata)) {
    throw new Error(`Metadata undo failed: ${JSON.stringify(undoMetadata, null, 2)}`);
  }

  await page.evaluate((id) => {
    window.labIsland.setObjectMetadata(id, {
      name: 'Cerebrum Externum',
      label: 'Cerebrum Externum',
      description: 'A monumental library of lancet windows, deep buttresses, and amber reading rooms. Founded in 1512; Library Court.',
    });
    localStorage.removeItem('youtopy_saved_project');
  }, metadataTarget.id);

  const targetId = facilities[8].id;
  const originalState = await page.evaluate((id) => window.labIsland.getObjectState(id), targetId);
  await page.evaluate((id) => {
    const world = window.labIsland;
    const before = world.getObjectState(id);
    if (!before) throw new Error(`Missing state for ${id}`);
    world.saveUndoState();
    world.setObjectPosition(id, 'x', before.position.x + 1.25);
    world.setObjectRotationY(id, before.rotationY + 17);
    world.setObjectScale(id, 1.12);
    world.setObjectVisible(id, false);
    world.setObjectCollision(id, false);
  }, targetId);
  const editedState = await page.evaluate((id) => window.labIsland.getObjectState(id), targetId);
  if (!editedState || !originalState) throw new Error('Academic transform state is unavailable');
  if (Math.abs(editedState.position.x - originalState.position.x - 1.25) > 0.001) throw new Error('Position edit did not apply');
  if (Math.abs(editedState.rotationY - originalState.rotationY - 17) > 0.001) throw new Error('Rotation edit did not apply');
  if (Math.abs(editedState.scale - 1.12) > 0.001) throw new Error('Scale edit did not apply');
  if (editedState.visible !== false || editedState.collisionEnabled !== false) throw new Error('Visibility/collision edit did not apply');

  const undoRestored = await page.evaluate(({ id, original }) => {
    const world = window.labIsland;
    if (!world.undo()) return false;
    const restored = world.getObjectState(id);
    return Boolean(restored)
      && Math.abs(restored.position.x - original.position.x) < 0.001
      && Math.abs(restored.rotationY - original.rotationY) < 0.001
      && Math.abs(restored.scale - original.scale) < 0.001
      && restored.visible === original.visible
      && restored.collisionEnabled === original.collisionEnabled;
  }, { id: targetId, original: originalState });
  if (!undoRestored) throw new Error('Undo did not restore the Academic building state');

  const accentPersistence = await page.evaluate(({ target, sibling }) => {
    const world = window.labIsland;
    const accentColors = (id) => {
      const colors = new Set();
      world.objectGroups.get(id)?.traverse((child) => {
        if (!child.material) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (material.userData.isDistrictAccent && material.color) colors.add(material.color.getHexString());
        });
      });
      return [...colors];
    };
    const siblingBefore = accentColors(sibling);
    world.setObjectAccent(target, '#d946ef');
    const payload = world.takeSnapshotPayload();
    if (!world.loadProject(payload)) return { loaded: false };
    return {
      loaded: true,
      targetDefinitionAccent: world.getDefinition(target)?.accent ?? null,
      siblingDefinitionAccent: world.getDefinition(sibling)?.accent ?? null,
      targetColors: accentColors(target),
      siblingBefore,
      siblingAfter: accentColors(sibling),
    };
  }, { target: facilities[1].id, sibling: facilities[2].id });
  if (!accentPersistence.loaded
    || accentPersistence.targetDefinitionAccent !== '#d946ef'
    || !accentPersistence.targetColors?.includes('d946ef')
    || JSON.stringify(accentPersistence.siblingBefore) !== JSON.stringify(accentPersistence.siblingAfter)
    || accentPersistence.siblingDefinitionAccent === '#d946ef') {
    throw new Error(`Accent isolation/persistence failed: ${JSON.stringify(accentPersistence, null, 2)}`);
  }

  const walkEntranceRouting = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    const facility = world.objectGroups.get('academic-building-ashcroft-grand-library');
    if (!district || !facility) return { available: false };
    const footprint = facility.userData.footprint;
    facility.updateWorldMatrix(true, false);
    const stand = facility.localToWorld(facility.position.clone().set(footprint[0] * 0.25, 0.162, footprint[1] * 0.5 + 0.25));
    const target = facility.localToWorld(facility.position.clone().set(footprint[0] * 0.25, 0.3, footprint[1] * 0.5 + 0.01));
    world.setMode('walk');
    world.camera.position.copy(stand);
    world.camera.lookAt(target);
    world.walkController.groundY = stand.y - 0.162;
    world.walkController.grounded = true;
    world.inspectFromWalkView();
    return {
      available: true,
      selectedId: world.getTextSnapshot().selected?.id ?? null,
      hotspotName: world.getActiveAcademicHotspot()?.name ?? null,
    };
  });
  if (!walkEntranceRouting.available
    || walkEntranceRouting.selectedId !== 'academic-libraries-theoretical-labs'
    || walkEntranceRouting.hotspotName !== 'Cerebrum Externum') {
    throw new Error(`WALK entrance routing failed: ${JSON.stringify(walkEntranceRouting, null, 2)}`);
  }

  await page.evaluate((id) => {
    const world = window.labIsland;
    world.setMode('edit');
    world.focus(id);
  }, facilities[1].id);
  await page.waitForTimeout(1100);
  await page.evaluate(() => window.labIsland.clearSelection('system'));
  const viewport = await page.locator('#viewport').boundingBox();
  if (!viewport) throw new Error('Viewport bounds are unavailable');
  await page.mouse.click(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2);
  const rayPicked = await page.evaluate(() => window.labIsland.getTextSnapshot().selected?.id ?? null);
  if (rayPicked !== facilities[1].id) {
    throw new Error(`Expected centre-ray scene pick ${facilities[1].id}, found ${rayPicked}`);
  }

  await fs.mkdir('output/playwright', { recursive: true });
  await page.screenshot({ path: 'output/playwright/academic-building-edit.png', fullPage: true });
  if (consoleErrors.length) throw new Error(`Browser errors: ${consoleErrors.join('\n')}`);

  console.log(JSON.stringify({
    editableAcademicBuildings: facilities.length,
    atlasEntries: new Set(audit.atlasIds).size,
    editLabels: audit.labelCount,
    metadataEditing: {
      targetId: metadataTarget.id,
      name: renamedMetadata.name,
      label: renamedMetadata.label,
      savedAndReloaded: true,
      undoRestored: true,
      stableId: metadataAudit.idStable,
    },
    transformsVerified: ['position', 'rotation', 'scale', 'visibility', 'collision'],
    undoRestored,
    accentPersistence,
    walkEntranceRouting,
    rayPicked,
    consoleErrors,
  }, null, 2));
} finally {
  await browser.close();
}
