import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.EDIT_ISOLATION_OUTPUT ?? 'output/edit-district-isolation';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

const settle = async (milliseconds = 240) => {
  await page.evaluate((duration) => window.labIsland.advanceTime(duration), milliseconds);
  await page.waitForTimeout(120);
};

const audit = () => page.evaluate(() => {
  const world = window.labIsland;
  const streaming = world.worldStreaming.getSnapshot();
  const compact = JSON.parse(window.render_game_to_text());
  const deep = world.getTextSnapshot();
  const isEffectivelyVisible = (object) => {
    let cursor = object;
    while (cursor) {
      if (!cursor.visible) return false;
      cursor = cursor.parent;
    }
    return Boolean(object);
  };
  const selected = world.selectedId ? world.objectGroups.get(world.selectedId) : null;
  return {
    mode: world.getMode(),
    selectedId: world.selectedId,
    selectedPackageId: world.worldStreaming.findPackageId(selected),
    selectedEffectivelyVisible: isEffectivelyVisible(selected),
    streaming,
    compactStreaming: compact.streaming,
    deepEdit: deep.edit,
    runtimePolicies: deep.runtimePolicies,
    roots: {
      islandShell: world.islandShellRoot.visible,
      transit: world.transitRoot.visible,
      city: world.cityRoot.visible,
      imported: world.importedRoot.visible,
      interiors: world.interiorsRoot.visible,
      ocean: world.ocean.visible,
      sky: world.sky.visible,
    },
    visiblePackageIds: streaming.packages
      .filter((pkg) => pkg.detailResident || pkg.proxyVisible)
      .map((pkg) => pkg.id),
    visibleLabels: Array.from(world.labels.values())
      .filter((record) => !record.anchor.element.classList.contains('label-suppressed'))
      .map((record) => ({
        id: record.id,
        packageId: world.worldStreaming.findPackageId(record.object),
      })),
    userVisibilityIntent: Array.from(world.objectVisibilityIntent.entries())
      .sort(([left], [right]) => left.localeCompare(right)),
    stats: world.getSceneStatistics(),
  };
});

const assertIsolated = (state, expectedPackageId) => {
  const total = state.streaming.totalPackages;
  if (state.mode !== 'edit'
    || state.selectedPackageId !== expectedPackageId
    || !state.selectedEffectivelyVisible
    || !state.streaming.editIsolationActive
    || state.streaming.editIsolationPackageId !== expectedPackageId
    || state.streaming.editIsolationHiddenPackageCount !== total - 1
    || state.streaming.residentPackageCount !== 1
    || state.streaming.proxyPackageCount !== 0
    || state.visiblePackageIds.length !== 1
    || state.visiblePackageIds[0] !== expectedPackageId
    || !state.compactStreaming.editIsolationActive
    || state.compactStreaming.editIsolationPackageId !== expectedPackageId
    || !state.deepEdit.districtIsolationActive
    || state.deepEdit.isolatedPackageId !== expectedPackageId
    || !state.runtimePolicies.editDistrictIsolationActive
    || state.runtimePolicies.editDistrictIsolationPackageId !== expectedPackageId
    || state.visibleLabels.some((label) => label.packageId !== expectedPackageId)
    || Object.entries(state.roots).some(([name, visible]) => name !== 'sky' && visible)
    || !state.roots.sky) {
    throw new Error(`Edit district isolation failed for ${expectedPackageId}: ${JSON.stringify(state, null, 2)}`);
  }
};

try {
  await page.addInitScript(() => localStorage.removeItem('youtopy_saved_project'));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForSelector('#loading-screen', { state: 'hidden' });
  await settle(300);

  const baseline = await audit();
  await page.locator('.district-item[data-id="corporate-core"]').click();
  await page.click('.mode[data-mode="edit"]');
  await page.waitForFunction(() => {
    const snapshot = window.labIsland.worldStreaming.getSnapshot();
    return snapshot.editIsolationPackageId === 'corporate-core'
      && snapshot.residentDetailPackages.length === 1
      && snapshot.residentDetailPackages[0] === 'corporate-core';
  });
  await settle(350);
  const corporate = await audit();
  assertIsolated(corporate, 'corporate-core');
  if (JSON.stringify(corporate.userVisibilityIntent) !== JSON.stringify(baseline.userVisibilityIntent)) {
    throw new Error('Runtime Edit isolation changed persisted object visibility intent.');
  }
  const fullIslandDuringEdit = await page.evaluate(() => {
    const world = window.labIsland;
    world.setFullIslandDetail(true);
    world.advanceTime(40);
    const enabled = world.worldStreaming.getSnapshot();
    world.setFullIslandDetail(false);
    world.advanceTime(40);
    const disabled = world.worldStreaming.getSnapshot();
    return { enabled, disabled };
  });
  for (const [phase, snapshot] of Object.entries(fullIslandDuringEdit)) {
    if (!snapshot.editIsolationActive
      || snapshot.editIsolationPackageId !== 'corporate-core'
      || snapshot.residentPackageCount !== 1
      || snapshot.residentDetailPackages[0] !== 'corporate-core'
      || snapshot.proxyPackageCount !== 0) {
      throw new Error(`Edit isolation failed during ${phase} Full Island Detail transition: ${JSON.stringify(snapshot, null, 2)}`);
    }
  }
  await page.evaluate(() => {
    const world = window.labIsland;
    world.cameraTween = null;
    const district = world.objectGroups.get('corporate-core');
    const bounds = new world.selectionBounds.constructor().setFromObject(district, true);
    const center = bounds.getCenter(world.controls.target.clone());
    const size = bounds.getSize(world.camera.position.clone());
    world.controls.target.copy(center);
    world.camera.position.set(center.x + size.x * 0.9, center.y + size.y * 1.25 + 18, center.z + size.z * 1.15);
    world.camera.lookAt(center);
    world.controls.update();
    world.advanceTime(250);
  });
  await page.screenshot({ path: `${OUTPUT}/corporate-core-only.png`, fullPage: true });

  await page.locator('.district-item[data-id="electronics-microelectronics-labs"]').click();
  await page.waitForFunction(() => {
    const snapshot = window.labIsland.worldStreaming.getSnapshot();
    return snapshot.editIsolationPackageId === 'electronics-microelectronics-labs'
      && snapshot.residentDetailPackages.length === 1
      && snapshot.residentDetailPackages[0] === 'electronics-microelectronics-labs';
  });
  await settle(350);
  const electronics = await audit();
  assertIsolated(electronics, 'electronics-microelectronics-labs');
  if (JSON.stringify(electronics.userVisibilityIntent) !== JSON.stringify(baseline.userVisibilityIntent)) {
    throw new Error('Switching isolated districts changed persisted object visibility intent.');
  }
  await page.evaluate(() => {
    const world = window.labIsland;
    world.cameraTween = null;
    const district = world.objectGroups.get('electronics-microelectronics-labs');
    const bounds = new world.selectionBounds.constructor().setFromObject(district, true);
    const center = bounds.getCenter(world.controls.target.clone());
    const size = bounds.getSize(world.camera.position.clone());
    world.controls.target.copy(center);
    world.camera.position.set(center.x + size.x * 0.9, center.y + size.y * 1.25 + 18, center.z + size.z * 1.15);
    world.camera.lookAt(center);
    world.controls.update();
    world.advanceTime(250);
  });
  await page.screenshot({ path: `${OUTPUT}/electronics-only.png`, fullPage: true });

  await page.click('.mode[data-mode="explore"]');
  await settle(300);
  const restored = await audit();
  if (restored.mode !== 'explore'
    || restored.streaming.editIsolationActive
    || restored.streaming.editIsolationPackageId !== null
    || restored.deepEdit.districtIsolationActive
    || restored.runtimePolicies.editDistrictIsolationActive
    || restored.streaming.proxyPackageCount < restored.streaming.totalPackages - 4
    || Object.keys(baseline.roots).some((key) => baseline.roots[key] !== restored.roots[key])
    || JSON.stringify(restored.userVisibilityIntent) !== JSON.stringify(baseline.userVisibilityIntent)) {
    throw new Error(`Exterior restoration after Edit failed: ${JSON.stringify({ baseline, restored }, null, 2)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/explore-restored.png`, fullPage: true });

  const report = { baseline, corporate, electronics, restored, errors };
  await writeFile(`${OUTPUT}/report.json`, JSON.stringify(report, null, 2));
  if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);
  console.log(JSON.stringify({
    corporate: {
      visiblePackages: corporate.visiblePackageIds,
      drawCalls: corporate.stats.drawCalls,
      triangles: corporate.stats.triangles,
      hiddenGlobalObjects: corporate.deepEdit.hiddenGlobalObjectCount,
    },
    electronics: {
      visiblePackages: electronics.visiblePackageIds,
      drawCalls: electronics.stats.drawCalls,
      triangles: electronics.stats.triangles,
    },
    restored: {
      proxies: restored.streaming.proxyPackageCount,
      roots: restored.roots,
    },
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
