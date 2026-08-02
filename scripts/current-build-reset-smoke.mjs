import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.env.CURRENT_BUILD_RESET_URL ?? 'http://127.0.0.1:5178/';
const outputDirectory = process.env.CURRENT_BUILD_RESET_OUTPUT ?? 'output/current-build-reset';
const browserCandidates = [
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const executablePath = browserCandidates.find((candidate) => existsSync(candidate));
const hallId = 'entry-logistics-building-e2';

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});
const page = await browser.newPage({ viewport: { width: 1500, height: 960 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(120_000);
const consoleErrors = [];
const pageErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));

async function waitForReady() {
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForFunction(() => document.querySelector('#loading-screen')?.classList.contains('done'));
  await page.waitForTimeout(300);
}

try {
  await page.addInitScript(async () => {
    if (sessionStorage.getItem('current-build-reset-smoke-initialized') === 'true') return;
    sessionStorage.setItem('current-build-reset-smoke-initialized', 'true');
    localStorage.removeItem('youtopy_saved_project');
    await new Promise((resolve) => {
      const request = indexedDB.deleteDatabase('synthviewtopy-projects');
      request.onsuccess = request.onerror = request.onblocked = () => resolve();
    });
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForReady();

  const seeded = await page.evaluate(async (id) => {
    const world = window.labIsland;
    const canonical = world.getObjectState(id);
    const asset = await world.persistence.putAsset(
      new Blob(['retained binary fixture'], { type: 'text/plain' }),
      'retained-fixture.txt',
    );
    world.setObjectPosition(id, 'x', canonical.position.x + 31.25);
    world.setObjectPosition(id, 'z', canonical.position.z - 13.5);
    return {
      canonical,
      moved: world.getObjectState(id),
      assetId: asset.assetId,
    };
  }, hallId);
  await page.locator('#save-project').click();
  await page.waitForFunction(() => {
    const button = document.querySelector('#save-project');
    const persistence = window.labIsland.getPersistenceSnapshot();
    return !button?.disabled && persistence.manualSaveAvailable && persistence.manualSaveRevision >= 1;
  });
  seeded.saved = await page.evaluate((id) => window.labIsland.getObjectState(id), hallId);
  seeded.persistence = await page.evaluate(() => window.labIsland.getPersistenceSnapshot());

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForReady();
  const staleLoad = await page.evaluate((id) => ({
    state: window.labIsland.getObjectState(id),
    persistence: window.labIsland.getPersistenceSnapshot(),
    localMirrorPresent: localStorage.getItem('youtopy_saved_project') !== null,
  }), hallId);

  page.once('dialog', (dialog) => void dialog.accept());
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.locator('#reload-current-build').click(),
  ]);
  await waitForReady();

  const restored = await page.evaluate(async (id) => {
    const world = window.labIsland;
    const button = document.querySelector('#reload-current-build');
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('synthviewtopy-projects');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction(['projects', 'revisions', 'manualProjects', 'assets'], 'readonly');
    const count = (store) => new Promise((resolve, reject) => {
      const request = transaction.objectStore(store).count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const read = (store, key) => new Promise((resolve, reject) => {
      const request = transaction.objectStore(store).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const [projectCount, revisionCount, manualProjectCount, assetCount, manualProject] = await Promise.all([
      count('projects'),
      count('revisions'),
      count('manualProjects'),
      count('assets'),
      read('manualProjects', 'default'),
    ]);
    database.close();
    const hall = world.objectGroups.get(id);
    const point = hall.getWorldPosition(world.camera.position.clone());
    world.camera.position.set(point.x + 44, point.y + 60, point.z + 44);
    world.controls.target.copy(point);
    world.controls.update();
    return {
      state: world.getObjectState(id),
      persistence: world.getPersistenceSnapshot(),
      localMirrorPresent: localStorage.getItem('youtopy_saved_project') !== null,
      stores: {
        projectCount,
        revisionCount,
        manualProjectCount,
        assetCount,
        manualHallState: manualProject?.payload?.objects?.find((object) => object.id === id)?.state ?? null,
      },
      button: {
        present: Boolean(button),
        label: button?.textContent?.replace(/\s+/g, ' ').trim(),
        title: button?.getAttribute('title'),
      },
    };
  }, hallId);
  await page.waitForTimeout(500);
  await page.screenshot({
    path: `${outputDirectory}/registration-hall-current-build.png`,
    fullPage: true,
  });

  await page.locator('#refresh-project').click();
  await page.waitForFunction(({ id, x, z }) => {
    const state = window.labIsland.getObjectState(id);
    const button = document.querySelector('#refresh-project');
    return !button?.disabled
      && Math.abs(state.position.x - x) <= 0.001
      && Math.abs(state.position.z - z) <= 0.001;
  }, { id: hallId, x: seeded.saved.position.x, z: seeded.saved.position.z });
  const manualReload = await page.evaluate((id) => ({
    state: window.labIsland.getObjectState(id),
    persistence: window.labIsland.getPersistenceSnapshot(),
    localMirrorPresent: localStorage.getItem('youtopy_saved_project') !== null,
  }), hallId);

  const near = (a, b, tolerance = 0.001) => Math.abs(a - b) <= tolerance;
  if (!near(staleLoad.state.position.x, seeded.saved.position.x)
    || !near(staleLoad.state.position.z, seeded.saved.position.z)) {
    throw new Error(`Seeded saved override did not load: ${JSON.stringify({ seeded, staleLoad })}`);
  }
  if (!near(restored.state.position.x, seeded.canonical.position.x)
    || !near(restored.state.position.z, seeded.canonical.position.z)) {
    throw new Error(`Current Build did not restore the authored Hall transform: ${JSON.stringify({ seeded, restored })}`);
  }
  if (restored.localMirrorPresent
    || restored.persistence.source !== 'none'
    || restored.persistence.revision !== 0
    || restored.persistence.recoveryRevisionCount !== 0
    || restored.stores.projectCount !== 0
    || restored.stores.revisionCount !== 0
    || restored.stores.manualProjectCount !== 1
    || !restored.persistence.manualSaveAvailable
    || restored.persistence.manualSaveRevision !== seeded.persistence.manualSaveRevision) {
    throw new Error(`Current Build did not clear working state while preserving manual Save: ${JSON.stringify(restored)}`);
  }
  if (!near(restored.stores.manualHallState.position.x, seeded.saved.position.x)
    || !near(restored.stores.manualHallState.position.z, seeded.saved.position.z)) {
    throw new Error(`Manual Save did not retain the moved Hall coordinates: ${JSON.stringify(restored.stores)}`);
  }
  if (restored.stores.assetCount !== 1 || restored.persistence.assetCount !== 1) {
    throw new Error(`Unreferenced imported asset blobs were not retained: ${JSON.stringify(restored)}`);
  }
  if (!restored.button.present
    || !restored.button.label?.includes('Current Build')
    || !restored.button.title?.includes('retain the manual Save')) {
    throw new Error(`Current Build menu action is missing or mislabeled: ${JSON.stringify(restored.button)}`);
  }
  if (!near(manualReload.state.position.x, seeded.saved.position.x)
    || !near(manualReload.state.position.z, seeded.saved.position.z)
    || !manualReload.localMirrorPresent
    || !manualReload.persistence.manualSaveAvailable) {
    throw new Error(`Refresh did not restore the protected moved-building layout: ${JSON.stringify(manualReload)}`);
  }
  if (consoleErrors.length || pageErrors.length) {
    throw new Error(`Browser errors: ${JSON.stringify({ consoleErrors, pageErrors })}`);
  }

  const report = { seeded, staleLoad, currentBuild: restored, manualReload, consoleErrors, pageErrors };
  await writeFile(`${outputDirectory}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
