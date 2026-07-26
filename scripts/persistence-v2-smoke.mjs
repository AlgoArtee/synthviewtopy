import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.PERSISTENCE_V2_OUTPUT ?? 'output/persistence-v2';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const E2 = 'entry-logistics-building-e2';
const E4 = 'entry-logistics-building-e4';
const E5 = 'entry-logistics-building-e5';
const POOL = 'entry-logistics-landscape-welcome-pool';

function createTriangleGlb() {
  const json = JSON.stringify({
    asset: { version: '2.0', generator: 'SynthViewTopy persistence v2 smoke' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'PERSISTED_INTERIOR_IMPORT', mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ byteLength: 36 }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36, target: 34962 }],
    accessors: [{
      bufferView: 0,
      componentType: 5126,
      count: 3,
      type: 'VEC3',
      min: [0, 0, 0],
      max: [1, 1, 0],
    }],
  });
  const jsonLength = Math.ceil(Buffer.byteLength(json) / 4) * 4;
  const jsonChunk = Buffer.alloc(jsonLength, 0x20);
  jsonChunk.write(json);
  const binChunk = Buffer.alloc(36);
  new Float32Array(binChunk.buffer, binChunk.byteOffset, 9).set([
    0, 0, 0,
    1, 0, 0,
    0, 1, 0,
  ]);
  const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const glb = Buffer.alloc(totalLength);
  glb.writeUInt32LE(0x46546c67, 0);
  glb.writeUInt32LE(2, 4);
  glb.writeUInt32LE(totalLength, 8);
  glb.writeUInt32LE(jsonChunk.length, 12);
  glb.writeUInt32LE(0x4e4f534a, 16);
  jsonChunk.copy(glb, 20);
  const binHeader = 20 + jsonChunk.length;
  glb.writeUInt32LE(binChunk.length, binHeader);
  glb.writeUInt32LE(0x004e4942, binHeader + 4);
  binChunk.copy(glb, binHeader + 8);
  return glb;
}

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(300_000);
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
  if (message.type() === 'error' || message.type() === 'warning') {
    console.log(`browser-${message.type()}: ${message.text()}`);
  }
});
page.on('pageerror', (error) => errors.push(error.message));

async function waitForReady() {
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForFunction(() => document.querySelector('#loading-screen')?.classList.contains('done'));
  await page.waitForTimeout(250);
}

async function reloadReady() {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForReady();
}

async function waitForProjectInteriorAssets() {
  await page.waitForFunction(() => {
    let loading = 0;
    window.labIsland.scene.traverse((object) => {
      if (object.userData.projectAssetState === 'loading') loading += 1;
    });
    return loading === 0;
  }, null, { timeout: 120_000 });
  await page.waitForTimeout(250);
}

try {
  console.log('persistence-v2: opening clean project');
  await page.addInitScript(async () => {
    if (sessionStorage.getItem('persistence-v2-test-initialized') === 'true') return;
    sessionStorage.setItem('persistence-v2-test-initialized', 'true');
    localStorage.clear();
    await new Promise((resolve) => {
      const request = indexedDB.deleteDatabase('synthviewtopy-projects');
      request.onsuccess = request.onerror = request.onblocked = () => resolve();
    });
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForReady();

  console.log('persistence-v2: seeding corrupted v1 visibility');
  const seeded = await page.evaluate(({ e4, pool }) => {
    const world = window.labIsland;
    const payload = world.takeSnapshotPayload();
    payload.schema = 'youtopy.lab-island/1.0';
    delete payload.assets;
    delete payload.editor.deletedObjectIds;
    for (const object of payload.objects) {
      object.state.visible = true;
      delete object.state.visibilityIntent;
      delete object.state.effectiveVisible;
      if (
        /^entry-logistics-building-e(?:[1-9]|1[0-3])$/.test(object.id)
        || object.id === pool
      ) object.state.visible = false;
      if (object.id === e4) object.state.position.x += 1.234;
    }
    localStorage.setItem('youtopy_saved_project', JSON.stringify(payload));
    return {
      expectedE4X: payload.objects.find((object) => object.id === e4).state.position.x,
      hiddenCount: payload.objects.filter((object) => object.state.visible === false).length,
    };
  }, { e4: E4, pool: POOL });
  await reloadReady();
  await page.waitForFunction(() => window.labIsland.getTextSnapshot().persistence.revision >= 1);

  console.log('persistence-v2: checking migration');
  const migrated = await page.evaluate(({ e4 }) => {
    const world = window.labIsland;
    world.setMode('explore');
    world.advanceTime(120);
    const state = world.getTextSnapshot();
    const saved = JSON.parse(localStorage.getItem('youtopy_saved_project'));
    const savedE4 = saved.objects.find((object) => object.id === e4);
    return {
      schema: saved.schema,
      canonical: state.canonicalIntegrity,
      e4: world.getObjectState(e4),
      savedE4State: savedE4.state,
      legacyBackup: Boolean(localStorage.getItem('youtopy_saved_project_v1_backup')),
      persistence: state.persistence,
    };
  }, { e4: E4 });
  if (migrated.schema !== 'youtopy.lab-island/2.0'
    || migrated.canonical.entry.present !== 13
    || migrated.canonical.entry.effectivelyVisibleIds.length !== 13
    || !migrated.canonical.welcomePool.present
    || !migrated.canonical.welcomePool.effectivelyVisible
    || Math.abs(migrated.e4.position.x - seeded.expectedE4X) > 1e-6
    || migrated.savedE4State.visibilityIntent !== 'visible'
    || 'visible' in migrated.savedE4State
    || !migrated.legacyBackup) {
    throw new Error(`Legacy migration failed: ${JSON.stringify({ seeded, migrated }, null, 2)}`);
  }

  const modeSaveResults = [];
  for (const scenario of ['plan', 'interior-edit', 'walk-exterior', 'walk-interior']) {
    console.log(`persistence-v2: save/reload ${scenario}`);
    const result = await page.evaluate(async ({ scenario, e2 }) => {
      const world = window.labIsland;
      if (scenario === 'plan') world.setMode('plan');
      if (scenario === 'interior-edit') {
        world.setMode('edit');
        world.select(e2, 'system');
        world.setEditWorkspace('interior');
        if (!world.enterInterior(e2)) throw new Error('Could not enter E2 Interior Edit');
      }
      if (scenario === 'walk-exterior') {
        if (world.getActiveInteriorBuildingId()) world.exitInterior(false);
        world.setMode('explore');
        world.setMode('walk');
      }
      if (scenario === 'walk-interior') {
        world.setMode('edit');
        world.select(e2, 'system');
        world.setEditWorkspace('interior');
        if (!world.enterInterior(e2)) throw new Error('Could not prepare E2 Interior WALK');
        world.setMode('walk');
      }
      world.advanceTime(120);
      await world.saveProjectToLocalStorage(true);
      const payload = JSON.parse(localStorage.getItem('youtopy_saved_project'));
      const snapshot = world.getTextSnapshot();
      const canonicalStates = payload.objects
        .filter((object) => /^entry-logistics-building-e(?:[1-9]|1[0-3])$/.test(object.id))
        .map((object) => object.state);
      return {
        scenario,
        mode: snapshot.mode,
        activeViewPolicy: snapshot.runtimePolicies.activeViewPolicy,
        canonicalStateCount: canonicalStates.length,
        allExplicitVisible: canonicalStates.every((state) => (
          state.visibilityIntent === 'visible' && !('visible' in state) && !('effectiveVisible' in state)
        )),
      };
    }, { scenario, e2: E2 });
    if (result.canonicalStateCount !== 13 || !result.allExplicitVisible) {
      throw new Error(`Runtime mode leaked into persistence: ${JSON.stringify(result)}`);
    }
    const expectedPolicy = scenario === 'interior-edit'
      ? 'edit-interior'
      : scenario === 'walk-interior'
        ? 'walk-interior'
        : `${result.mode}-exterior`;
    if (result.activeViewPolicy !== expectedPolicy) {
      throw new Error(`Wrong active visibility policy: ${JSON.stringify({ result, expectedPolicy })}`);
    }
    modeSaveResults.push(result);
    await page.screenshot({
      path: `${OUTPUT}/${scenario}.png`,
      fullPage: true,
    });
    await waitForProjectInteriorAssets();
    await reloadReady();
    const restored = await page.evaluate(() => {
      const world = window.labIsland;
      world.setMode('explore');
      world.advanceTime(100);
      return world.getTextSnapshot().canonicalIntegrity;
    });
    if (
      restored.entry.present !== 13
      || restored.entry.effectivelyVisibleIds.length !== 13
      || !restored.welcomePool.effectivelyVisible
    ) throw new Error(`Exterior did not recover after ${scenario}: ${JSON.stringify(restored)}`);
  }

  const explicitIntent = await page.evaluate(async ({ e4, e5 }) => {
    const world = window.labIsland;
    world.setObjectVisible(e4, false);
    world.deleteObject(e5);
    await world.saveProjectToLocalStorage(true);
    await world.loadProjectFromPersistentStorage();
    return {
      e4: world.getObjectState(e4),
      e5Present: Boolean(world.getDefinition(e5)),
      deletedIds: JSON.parse(localStorage.getItem('youtopy_saved_project')).editor.deletedObjectIds,
    };
  }, { e4: E4, e5: E5 });
  if (explicitIntent.e4.visibilityIntent !== 'hidden'
    || explicitIntent.e5Present
    || !explicitIntent.deletedIds.includes(E5)) {
    throw new Error(`Explicit visibility/deletion intent did not persist: ${JSON.stringify(explicitIntent)}`);
  }

  const defaultsRestored = await page.evaluate(async () => {
    const integrity = await window.labIsland.restoreWelcomeDistrictDefaults();
    window.labIsland.setMode('explore');
    window.labIsland.advanceTime(120);
    return integrity;
  });
  if (defaultsRestored.entry.present !== 13
    || defaultsRestored.entry.userHiddenIds.length
    || !defaultsRestored.welcomePool.present) {
    throw new Error(`Welcome defaults did not restore: ${JSON.stringify(defaultsRestored)}`);
  }

  await page.evaluate(() => {
    const world = window.labIsland;
    world.setMode('explore');
    world.focus('entry-commercial');
    world.advanceTime(1200);
  });
  await page.screenshot({ path: `${OUTPUT}/welcome-restored-explore.png`, fullPage: true });

  console.log('persistence-v2: importing interior GLB');
  await page.evaluate(({ e2 }) => {
    const world = window.labIsland;
    world.setMode('edit');
    world.select(e2, 'system');
    world.setEditWorkspace('interior');
    if (!world.enterInterior(e2)) throw new Error('Could not open E2 for persistence import');
  }, { e2: E2 });
  const chooserPromise = page.waitForEvent('filechooser');
  await page.click('#import-trigger');
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: 'persistent-interior-triangle.glb',
    mimeType: 'model/gltf-binary',
    buffer: createTriangleGlb(),
  });
  await page.waitForFunction(() => window.labIsland.getTextSnapshot().selected?.category === 'imported');
  const importedId = await page.evaluate(async () => {
    const world = window.labIsland;
    const id = world.getTextSnapshot().selected.id;
    await world.saveProjectToLocalStorage(true);
    return id;
  });
  await reloadReady();
  await page.waitForFunction((id) => Boolean(window.labIsland.getDefinition(id)), importedId);
  const importRestored = await page.evaluate(({ id, e2 }) => {
    const world = window.labIsland;
    const definition = world.getDefinition(id);
    const group = world.objectGroups.get(id);
    world.setMode('edit');
    world.select(e2, 'system');
    world.setEditWorkspace('interior');
    world.enterInterior(e2);
    world.advanceTime(80);
    return {
      definition,
      present: Boolean(group),
      parent: group?.parent?.name ?? null,
      effectivelyVisible: world.getObjectState(id)?.effectiveVisible,
      persistence: world.getTextSnapshot().persistence,
    };
  }, { id: importedId, e2: E2 });
  if (!importRestored.present
    || importRestored.definition?.parentBuildingId !== E2
    || !importRestored.definition?.assetId
    || !importRestored.effectivelyVisible
    || importRestored.persistence.assetCount < 1) {
    throw new Error(`Imported binary did not survive reload: ${JSON.stringify(importRestored, null, 2)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/interior-import-restored.png`, fullPage: true });
  await waitForProjectInteriorAssets();

  console.log('persistence-v2: corrupting current revision');
  await page.evaluate(async () => {
    const request = indexedDB.open('synthviewtopy-projects');
    const database = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction('projects', 'readwrite');
    const store = transaction.objectStore('projects');
    const current = await new Promise((resolve, reject) => {
      const read = store.get('default');
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
    });
    current.checksum = 'corrupted-for-recovery-test';
    store.put(current);
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
  await reloadReady();
  const recovered = await page.evaluate(() => window.labIsland.getTextSnapshot().persistence);
  if (recovered.source !== 'recovery' || recovered.recoveryRevisionCount < 1) {
    throw new Error(`Last-known-good recovery failed: ${JSON.stringify(recovered)}`);
  }

  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  const report = {
    seeded,
    migrated,
    modeSaveResults,
    explicitIntent,
    defaultsRestored,
    importedId,
    importRestored,
    recovered,
    errors,
  };
  await writeFile(`${OUTPUT}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    migratedSchema: migrated.schema,
    entryBuildings: migrated.canonical.entry.present,
    poolVisible: migrated.canonical.welcomePool.effectivelyVisible,
    preservedE4X: migrated.e4.position.x,
    modeScenarios: modeSaveResults.map((entry) => entry.scenario),
    importedAssetRestored: importRestored.present,
    recoverySource: recovered.source,
    errors: errors.length,
  }, null, 2));
} finally {
  await browser.close();
}
