import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.FULL_ISLAND_DETAIL_OUTPUT ?? 'output/full-island-detail';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

const settle = async (milliseconds = 500) => {
  await page.evaluate((duration) => window.labIsland.advanceTime(duration), milliseconds);
  await page.waitForTimeout(180);
};

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_full_island_detail');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getSceneStatistics));
  await page.waitForSelector('#loading-screen', { state: 'hidden' });
  await settle(700);

  const defaultAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const streaming = world.getStreamingSnapshot();
    const packageBudgetViolations = streaming.packages.filter((pkg) => (
      pkg.estimatedCost.drawCalls > 450
      || pkg.estimatedCost.triangles > 250_000
      || pkg.estimatedCost.animationNodes > 150
    ));
    let suppressedMeshes = 0;
    let facilityCount = 0;
    const incompleteFacilities = [];
    world.modelRoot.traverse((object) => {
      if (object.userData.streamingBudgetSuppressed === true) suppressedMeshes += 1;
      if (object.userData.exteriorProgram !== true && object.userData.academicFacility !== true) return;
      facilityCount += 1;
      let authoredMeshCount = 0;
      let representedSourceCount = 0;
      object.traverse((child) => {
        if (!child.isMesh) return;
        if (child.userData.gpuBatchSource === true) authoredMeshCount += 1;
        else if (child.userData.gpuRuntimeBatch === true) {
          representedSourceCount += child.userData.batchSourceNames?.length ?? 1;
        } else {
          authoredMeshCount += 1;
          representedSourceCount += 1;
        }
      });
      if (authoredMeshCount === 0 || representedSourceCount < authoredMeshCount) {
        incompleteFacilities.push({ name: object.name, authoredMeshCount, representedSourceCount });
      }
    });
    return {
      stats: world.getSceneStatistics(),
      streaming,
      packageBudgetViolations,
      suppressedMeshes,
      facilityCount,
      incompleteFacilities,
    };
  });
  if (defaultAudit.streaming.detailPolicy !== 'streamed'
    || defaultAudit.streaming.cacheCapacity !== 8
    || defaultAudit.streaming.loadedPackageCount > 8
    || defaultAudit.suppressedMeshes !== 0
    || defaultAudit.packageBudgetViolations.length
    || defaultAudit.incompleteFacilities.length) {
    throw new Error(`Default complete-building audit failed: ${JSON.stringify(defaultAudit, null, 2)}`);
  }

  await page.evaluate(() => {
    const world = window.labIsland;
    const id = 'forensic-cyberforensic-lab';
    const district = world.objectGroups.get(id);
    world.select(id, 'system');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    district.updateWorldMatrix(true, true);
    const bounds = new world.selectionBounds.constructor().setFromObject(district, true);
    const center = bounds.getCenter(world.camera.position.clone());
    const size = bounds.getSize(world.controls.target.clone());
    world.camera.position.set(
      center.x - Math.max(size.x, 20) * 0.42,
      center.y + Math.max(size.x, size.z) * 0.48,
      center.z + Math.max(size.z, 20) * 0.62,
    );
    world.controls.target.copy(center);
    world.camera.lookAt(center);
    world.camera.updateMatrixWorld(true);
    world.updateWorldStreaming(false, true);
  });
  await page.waitForFunction(() => window.labIsland.getStreamingSnapshot().packages
    .find((pkg) => pkg.id === 'forensic-cyberforensic-lab')?.detailResident === true);
  await settle(700);
  await page.screenshot({ path: `${OUTPUT}/default-close-complete-buildings.png`, fullPage: true });

  await page.locator('#full-island-detail').check({ force: true });
  await page.waitForFunction(() => window.labIsland.getStreamingSnapshot().fullIslandDetailReady === true);
  await settle(1_000);
  const fullAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const stats = world.getSceneStatistics();
    const streaming = stats.streaming;
    let suppressedMeshes = 0;
    let runtimeBatches = 0;
    let batchedSources = 0;
    let selectableBatchMembers = 0;
    world.modelRoot.traverse((object) => {
      if (object.userData.streamingBudgetSuppressed === true) suppressedMeshes += 1;
      if (object.userData.gpuRuntimeBatch === true) {
        runtimeBatches += 1;
        selectableBatchMembers += object.userData.batchSelectableIds?.filter(Boolean).length ?? 0;
      }
      if (object.userData.gpuBatchSource === true) batchedSources += 1;
    });
    world.walkController.refreshNavigation();
    const hiddenSourceCollisionCount = [
      ...world.walkController.walkables,
      ...world.walkController.navigationObstacles.map((entry) => entry?.object).filter(Boolean),
    ].filter((object) => object.userData.gpuBatchSource === true).length;
    return {
      stats,
      representationErrors: streaming.packages.filter((pkg) => (
        Number(pkg.detailResident) + Number(pkg.midVisible) + Number(pkg.farVisible) !== 1
      )).map((pkg) => pkg.id),
      suppressedMeshes,
      runtimeBatches,
      batchedSources,
      selectableBatchMembers,
      hiddenSourceCollisionCount,
      localPreference: localStorage.getItem('youtopy_full_island_detail'),
      projectSchema: world.takeSnapshotPayload().schema,
    };
  });
  if (!fullAudit.stats.streaming.fullIslandDetailRequested
    || !fullAudit.stats.streaming.fullIslandDetailReady
    || fullAudit.stats.streaming.loadedPackageCount !== 41
    || fullAudit.stats.streaming.residentPackageCount !== 41
    || fullAudit.stats.streaming.proxyPackageCount !== 0
    || fullAudit.stats.drawCalls > 5_000
    || fullAudit.stats.triangles > 6_000_000
    || fullAudit.stats.rendererGeometries > 3_500
    || fullAudit.stats.activeAnimationNodes > 250
    || fullAudit.suppressedMeshes !== 0
    || fullAudit.runtimeBatches === 0
    || fullAudit.batchedSources === 0
    || fullAudit.selectableBatchMembers < fullAudit.batchedSources
    || fullAudit.hiddenSourceCollisionCount === 0
    || fullAudit.representationErrors.length
    || fullAudit.localPreference !== 'true'
    || fullAudit.projectSchema !== 'youtopy.lab-island/2.0') {
    throw new Error(`Full-island structural audit failed: ${JSON.stringify(fullAudit, null, 2)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/full-island-ready.png`, fullPage: true });

  const warningAudit = await page.evaluate(() => {
    const world = window.labIsland;
    world.fullIslandReadyAt = 1;
    world.frameSampleWindowStartedAt = 10;
    world.recordFrameTime(45, 11.1);
    world.recordFrameTime(45, 12.2);
    world.recordFrameTime(45, 13.3);
    return {
      checked: document.querySelector('#full-island-detail').checked,
      requested: world.isFullIslandDetail(),
      warning: world.getGpuDetailCapabilities().performanceWarning,
    };
  });
  if (!warningAudit.checked || !warningAudit.requested || !warningAudit.warning) {
    throw new Error(`Slow-frame warning or never-disable behavior failed: ${JSON.stringify(warningAudit)}`);
  }

  await page.locator('#full-island-detail').uncheck({ force: true });
  await page.waitForFunction(() => {
    const streaming = window.labIsland.getStreamingSnapshot();
    return streaming.detailPolicy === 'streamed' && streaming.loadedPackageCount <= 8;
  });
  const offAudit = await page.evaluate(() => ({
    streaming: window.labIsland.getStreamingSnapshot(),
    preference: localStorage.getItem('youtopy_full_island_detail'),
    warning: window.labIsland.getGpuDetailCapabilities().performanceWarning,
  }));
  if (offAudit.streaming.cacheCapacity !== 8
    || offAudit.streaming.fullIslandDetailRequested
    || offAudit.preference !== 'false'
    || offAudit.warning !== null) {
    throw new Error(`Returning to streamed LRU failed: ${JSON.stringify(offAudit, null, 2)}`);
  }

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.labIsland));
  const reloadAudit = await page.evaluate(() => ({
    checked: document.querySelector('#full-island-detail').checked,
    requested: window.labIsland.isFullIslandDetail(),
  }));
  if (reloadAudit.checked || reloadAudit.requested) throw new Error(`Device-local preference reload failed: ${JSON.stringify(reloadAudit)}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);

  const report = { defaultAudit, fullAudit, warningAudit, offAudit, reloadAudit, errors };
  await writeFile(`${OUTPUT}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    default: {
      facilities: defaultAudit.facilityCount,
      suppressedMeshes: defaultAudit.suppressedMeshes,
      packageBudgetViolations: defaultAudit.packageBudgetViolations.length,
    },
    full: {
      drawCalls: fullAudit.stats.drawCalls,
      triangles: fullAudit.stats.triangles,
      rendererGeometries: fullAudit.stats.rendererGeometries,
      loaded: fullAudit.stats.streaming.loadedPackageCount,
      resident: fullAudit.stats.streaming.residentPackageCount,
      proxies: fullAudit.stats.streaming.proxyPackageCount,
      activeAnimationNodes: fullAudit.stats.activeAnimationNodes,
      backend: fullAudit.stats.streaming.gpuBatching.backend,
      runtimeBatches: fullAudit.runtimeBatches,
      batchedSources: fullAudit.batchedSources,
    },
    warning: Boolean(warningAudit.warning),
    streamedAfterToggle: offAudit.streaming.loadedPackageCount,
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
