import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.AUTHORED_INTERIOR_EDIT_OUTPUT
  ?? 'output/authored-interior-edit';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 1,
});
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForTimeout(1_500);
  await page.click('[data-mode="edit"]');

  const setup = await page.evaluate(async () => {
    const world = window.labIsland;
    const buildingId = 'entry-logistics-building-e2';
    world.setMode('edit');
    world.select(buildingId, 'system');
    world.setEditWorkspace('interior');
    if (!world.enterInterior(buildingId)) throw new Error('Could not enter the Welcome Hall interior in Edit mode');
    world.advanceTime(180);
    const snapshot = world.getTextSnapshot();
    const componentIds = snapshot.edit.activeAuthoredComponentIds;
    if (snapshot.edit.activeInteriorType !== 'authored') {
      throw new Error(`Expected authored interior, received ${snapshot.edit.activeInteriorType}`);
    }
    if (componentIds.length < 8) {
      throw new Error(`Expected editable authored components, received ${componentIds.length}`);
    }
    const interiorInventory = [];
    for (const [candidateBuildingId, candidateInterior] of world.authoredInteriorByBuildingId) {
      world.exitInterior(false);
      world.select(candidateBuildingId, 'system');
      if (!world.enterInterior(candidateBuildingId)) {
        throw new Error(`Could not open authored interior for ${candidateBuildingId}`);
      }
      const candidateSnapshot = world.getTextSnapshot();
      interiorInventory.push({
        buildingId: candidateBuildingId,
        name: candidateInterior.name,
        componentCount: candidateSnapshot.edit.activeAuthoredComponentIds.length,
        type: candidateSnapshot.edit.activeInteriorType,
      });
    }
    const emptyInteriors = interiorInventory.filter((entry) => entry.componentCount === 0);
    if (emptyInteriors.length) {
      throw new Error(`Authored interiors without editable contents: ${emptyInteriors.map((entry) => entry.buildingId).join(', ')}`);
    }
    world.exitInterior(false);
    world.select(buildingId, 'system');
    if (!world.enterInterior(buildingId)) throw new Error('Could not return to Welcome Hall after authored interior inventory');
    const componentId = componentIds.find((id) => (
      /(?:bench|chair|table|desk|kiosk|seat)/i.test(world.getDefinition(id)?.name ?? '')
      && world.getObjectState(id)?.collisionEnabled
    ))
      ?? componentIds.find((id) => world.getObjectState(id)?.collisionEnabled)
      ?? componentIds[0];
    const component = world.objectGroups.get(componentId);
    const definition = world.getDefinition(componentId);
    if (!component || !definition) throw new Error('Authored component registry is incomplete');
    world.select(componentId, 'system');
    const before = world.getObjectState(componentId);
    world.saveUndoState();
    world.setObjectPosition(componentId, 'x', before.position.x + 0.34);
    world.setObjectRotationY(componentId, before.rotationY + 13);
    world.setObjectAxisScale(componentId, 'z', (before.scale3D?.z ?? 1) * 1.22);
    const after = world.getObjectState(componentId);
    await world.saveProjectToLocalStorage();
    return {
      buildingId,
      componentId,
      componentName: definition.name,
      authoredInteriorName: component.parent?.parent?.name ?? component.parent?.name ?? null,
      componentCount: componentIds.length,
      interiorInventory,
      before,
      after,
      axisScaleVisible: !document.querySelector('#building-axis-scale')?.hidden,
      genericFallbackCount: snapshot.counts.generatedInteriorFallbacks,
    };
  });

  if (Math.abs(setup.after.position.x - setup.before.position.x - 0.34) > 0.001) {
    throw new Error('Authored component translation did not apply');
  }
  if (Math.abs(setup.after.rotationY - setup.before.rotationY - 13) > 0.01) {
    throw new Error('Authored component rotation did not apply');
  }
  if ((setup.after.scale3D?.z ?? 0) <= (setup.before.scale3D?.z ?? 1)) {
    throw new Error('Authored component elongation did not apply');
  }
  if (!setup.axisScaleVisible) throw new Error('Per-axis elongation controls are hidden for authored interior objects');

  await page.screenshot({
    path: `${OUTPUT}/authored-interior-edit.png`,
    fullPage: true,
  });

  const persistence = await page.evaluate(async ({ buildingId, componentId, after }) => {
    const world = window.labIsland;
    world.exitInterior(false);
    if (!world.loadProjectFromLocalStorage()) throw new Error('Saved project did not reload');
    const restored = world.getObjectState(componentId);
    if (!restored) throw new Error('Authored component was not restored after project reload');
    world.setMode('edit');
    world.select(buildingId, 'system');
    world.setEditWorkspace('interior');
    if (!world.enterInterior(buildingId)) throw new Error('Could not re-enter authored interior after reload');
    const available = world.getAssetCatalog('interior');
    const catalogItem = available.find((item) => item.id === 'interior-focus-workstation') ?? available[0];
    const added = catalogItem ? world.addCatalogAsset(catalogItem.id) : null;
    if (!added) throw new Error('Could not add a catalog asset to the authored interior');
    const addedGroup = world.objectGroups.get(added.id);
    const activeInterior = world.authoredInteriorByBuildingId.get(buildingId);
    const addedToAuthoredInterior = addedGroup?.parent === activeInterior;
    // Exercise the real Interior Edit -> WALK handoff. It compensates for
    // authored building scale and places the eye at the authoritative floor.
    world.setMode('walk');
    const facility = world.scene.getObjectByName('ENTRY__E2__WELCOME_AND_REGISTRATION_HALL');
    const interior = facility?.getObjectByName('ENTRY__E2__WELCOME_REGISTRATION_INTERIOR');
    if (!facility || !interior) throw new Error('Authored interior disappeared before WALK verification');
    world.advanceTime(180);
    const walkState = world.getObjectState(componentId);
    let componentEffectivelyVisible = true;
    let cursor = world.objectGroups.get(componentId);
    while (cursor) {
      componentEffectivelyVisible &&= cursor.visible;
      cursor = cursor.parent;
    }
    const walkUsesEditedInterior = interior.visible
      && componentEffectivelyVisible
      && Math.abs(walkState.position.x - restored.position.x) < 0.002
      && Math.abs(walkState.rotationY - restored.rotationY) < 0.02;
    world.setMode('edit');
    world.select(buildingId, 'system');
    world.setEditWorkspace('interior');
    if (!world.enterInterior(buildingId)) throw new Error('Could not re-enter interior for deletion test');
    const deleteId = world.getTextSnapshot().edit.activeAuthoredComponentIds
      .find((id) => id !== componentId);
    if (!deleteId) throw new Error('No second authored component available for deletion test');
    world.deleteObject(deleteId);
    await world.saveProjectToLocalStorage();
    const deletionRecorded = JSON.parse(localStorage.getItem('youtopy_saved_project'))
      .editor.deletedAuthoredInteriorComponentIds.includes(deleteId);
    if (!world.loadProjectFromLocalStorage()) throw new Error('Saved deletion did not reload');
    const deletedStayedDeleted = world.getDefinition(deleteId) === null;
    world.setMode('edit');
    world.select(buildingId, 'system');
    world.setEditWorkspace('interior');
    if (!world.enterInterior(buildingId)) throw new Error('Could not re-enter interior after deleted component reload');
    return {
      restored,
      expected: after,
      addedAssetId: added.id,
      addedToAuthoredInterior,
      walkUsesEditedInterior,
      interiorVisibleInWalk: interior.visible,
      componentEffectivelyVisibleInWalk: componentEffectivelyVisible,
      walkState,
      restoredState: restored,
      deletionRecorded,
      deletedStayedDeleted,
      activeInteriorType: world.getTextSnapshot().edit.activeInteriorType,
    };
  }, setup);

  const close = (a, b, tolerance = 0.002) => Math.abs(a - b) <= tolerance;
  if (!close(persistence.restored.position.x, persistence.expected.position.x)) {
    throw new Error('Authored component position did not persist');
  }
  if (!close(persistence.restored.rotationY, persistence.expected.rotationY, 0.02)) {
    throw new Error('Authored component rotation did not persist');
  }
  if (!close(persistence.restored.scale3D.z, persistence.expected.scale3D.z)) {
    throw new Error('Authored component elongation did not persist');
  }
  if (!persistence.addedToAuthoredInterior) throw new Error('Catalog asset was not parented to the authored interior');
  if (!persistence.walkUsesEditedInterior) {
    console.error(JSON.stringify({ setup, persistence }, null, 2));
  }
  if (!persistence.walkUsesEditedInterior) throw new Error('WALK mode did not use the edited authored interior');
  if (!persistence.deletionRecorded || !persistence.deletedStayedDeleted) {
    throw new Error('Authored component deletion did not persist');
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);

  const result = { setup, persistence, errors };
  await writeFile(`${OUTPUT}/audit.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
