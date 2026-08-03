import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.AUTHORED_EXTERIOR_SELECTION_OUTPUT ?? 'output/particle-physics-labs-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const buildingId = 'particle-physics-labs__building-the-quantum-silence-pavilion';
const packageId = 'particle-physics-labs';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chrome });
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

const waitUntilReady = async () => {
  await page.waitForFunction(() => Boolean(window.labIsland));
  await page.waitForFunction(() => document.querySelector('#loading-screen')?.classList.contains('done') === true);
  await page.waitForTimeout(300);
};

const waitForPackage = async () => {
  await page.waitForFunction((id) => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => (
    entry.id === id && entry.loadState === 'loaded' && entry.detailResident
  )), packageId);
};

const auditSelection = async () => page.evaluate(({ buildingId, packageId }) => {
  const world = window.labIsland;
  const group = world.objectGroups.get(buildingId);
  const pkg = world.worldStreaming.packages.get(packageId);
  if (!group || !pkg) throw new Error('Authored building or streaming package is unavailable');
  group.updateWorldMatrix(true, true);
  world.refreshSelectionBounds();
  const Box3 = world.selectionBounds.constructor;
  const batchBounds = new Box3();
  let entryCount = 0;
  let currentOwnerCount = 0;

  pkg.runtimeBatches.forEach((record) => record.entries.forEach((entry) => {
    const selectableId = (record.batch.userData.batchSelectableIds ?? [])[entry.instanceId];
    if (entry.semanticOwner.userData.individualSelectableId !== buildingId && selectableId !== buildingId) return;
    if (entry.semanticOwner === group) currentOwnerCount += 1;
    const geometry = entry.source.geometry;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    if (!geometry.boundingBox) return;
    const bounds = geometry.boundingBox.clone()
      .applyMatrix4(entry.localMatrix)
      .applyMatrix4(pkg.detailRoot.matrixWorld);
    if (entryCount === 0) batchBounds.copy(bounds);
    else batchBounds.union(bounds);
    entryCount += 1;
  }));

  return {
    state: world.getObjectState(buildingId),
    selectionCenter: world.selectionBounds.getCenter(world.camera.position.clone()).toArray(),
    selectionSize: world.selectionBounds.getSize(world.camera.position.clone()).toArray(),
    batchCenter: batchBounds.getCenter(world.camera.position.clone()).toArray(),
    batchSize: batchBounds.getSize(world.camera.position.clone()).toArray(),
    entryCount,
    currentOwnerCount,
    transformAttached: world.transformControls.object === group,
  };
}, { buildingId, packageId });

const maxDelta = (left, right) => Math.max(...left.map((value, index) => Math.abs(value - right[index])));

try {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    localStorage.clear();
    const databases = await indexedDB.databases();
    await Promise.all(databases.map(({ name }) => new Promise((resolve) => {
      if (!name) { resolve(); return; }
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = request.onerror = request.onblocked = () => resolve();
    })));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitUntilReady();
  await page.evaluate((id) => window.labIsland.select(id, 'system'), buildingId);
  await waitForPackage();
  await page.evaluate(async (id) => {
    const world = window.labIsland;
    const initial = world.getObjectState(id);
    world.setObjectPosition(id, 'x', initial.position.x - 28);
    world.setObjectPosition(id, 'z', initial.position.z + 14);
    await world.saveProjectToLocalStorage(true);
  }, buildingId);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitUntilReady();
  await page.evaluate((id) => {
    window.labIsland.setMode('edit');
    window.labIsland.select(id, 'system');
  }, buildingId);
  await waitForPackage();
  const restored = await auditSelection();

  await page.evaluate((id) => {
    const world = window.labIsland;
    const group = world.objectGroups.get(id);
    world.transformControls.dispatchEvent({ type: 'dragging-changed', value: true });
    group.position.x += 1.5;
    world.transformControls.dispatchEvent({ type: 'objectChange' });
    world.transformControls.dispatchEvent({ type: 'dragging-changed', value: false });
  }, buildingId);
  await page.waitForTimeout(250);
  const edited = await auditSelection();

  await page.evaluate((center) => {
    const world = window.labIsland;
    const target = world.controls.target.clone().fromArray(center);
    world.cameraTween = null;
    world.camera.up.set(0, 1, 0);
    world.camera.position.set(target.x + 23, target.y + 28, target.z + 25);
    world.camera.lookAt(target);
    world.controls.target.copy(target);
    world.controls.update();
    world.advanceTime(500);
  }, edited.selectionCenter);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUTPUT}/p10-selection-edit-persistence.png` });

  const result = { restored, edited, errors };
  await writeFile(`${OUTPUT}/p10-selection-edit-persistence.json`, `${JSON.stringify(result, null, 2)}\n`);
  if (restored.entryCount === 0 || restored.currentOwnerCount !== restored.entryCount) {
    throw new Error(`Reload retained an orphaned authored-building owner: ${JSON.stringify(restored)}`);
  }
  if (!restored.transformAttached || maxDelta(restored.selectionCenter, restored.batchCenter) > 0.000001) {
    throw new Error(`Reloaded selection is detached from rendered P10: ${JSON.stringify(restored)}`);
  }
  if (maxDelta(restored.selectionSize, restored.batchSize) > 0.08) {
    throw new Error(`Reloaded P10 bounds are inflated: ${JSON.stringify(restored)}`);
  }
  if (Math.abs(edited.state.position.x - restored.state.position.x - 1.5) > 0.000001
    || maxDelta(edited.selectionCenter, edited.batchCenter) > 0.000001) {
    throw new Error(`Edit transform did not move rendered P10 with its selection: ${JSON.stringify({ restored, edited })}`);
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
