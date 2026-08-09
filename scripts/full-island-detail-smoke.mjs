import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.FULL_ISLAND_DETAIL_OUTPUT ?? 'output/full-island-detail';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_PACKAGE_COUNT = 41;
const TARGET_BUILDING_COUNT = 298;

const percentile = (samples, fraction) => {
  if (!samples.length) return 0;
  const sorted = [...samples].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
};

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
    localStorage.removeItem('youtopy_device_preferences');
    sessionStorage.removeItem('youtopy_full_island_safe_streamed_session');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(
    window.labIsland?.getSceneStatistics
    && window.labIsland?.getStreamingSnapshot
    && window.render_game_to_text,
  ));
  await page.waitForSelector('#loading-screen', { state: 'hidden' });
  await page.evaluate(() => {
    const world = window.labIsland;
    world.setMode('explore');
    world.setGraphicsQuality('medium');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    world.overview();
  });
  await settle(700);

  const defaultAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const stats = world.getSceneStatistics();
    const streaming = stats.streaming;
    const packageBudgetViolations = streaming.packages.filter((pkg) => (
      pkg.estimatedCost.drawCalls > 450
      || pkg.estimatedCost.triangles > 250_000
      || pkg.estimatedCost.animationNodes > 150
    ));
    let suppressedMeshes = 0;
    let liveAuthoredSources = 0;
    world.scene.traverse((object) => {
      if (object.userData.streamingBudgetSuppressed === true) suppressedMeshes += 1;
      if (object.userData.gpuBatchSource === true) liveAuthoredSources += 1;
    });
    return {
      stats,
      packageBudgetViolations,
      suppressedMeshes,
      liveAuthoredSources,
      representationErrors: streaming.packages.filter((pkg) => (
        Number(pkg.detailResident) + Number(pkg.midVisible) + Number(pkg.farVisible) !== 1
      )).map((pkg) => pkg.id),
    };
  });
  if (defaultAudit.stats.streaming.detailPolicy !== 'streamed'
    || defaultAudit.stats.streaming.totalPackages !== TARGET_PACKAGE_COUNT
    || defaultAudit.stats.streaming.cacheCapacity !== 8
    || defaultAudit.stats.streaming.effectiveCacheCapacity !== 8
    || defaultAudit.stats.streaming.loadedPackageCount > 8
    || defaultAudit.stats.drawCalls > 1_500
    || defaultAudit.stats.activeAnimationNodes > 250
    || defaultAudit.stats.rendererGeometries > 3_500
    || defaultAudit.stats.streaming.normalRenderAuthoredSourceCount !== 0
    || !(defaultAudit.stats.streaming.detachedAuthoringSourceCount > 0)
    || defaultAudit.suppressedMeshes !== 0
    || defaultAudit.liveAuthoredSources !== 0
    || defaultAudit.packageBudgetViolations.length
    || defaultAudit.representationErrors.length) {
    throw new Error(`Default streamed overview audit failed: ${JSON.stringify(defaultAudit, null, 2)}`);
  }

  await page.evaluate(() => {
    const world = window.labIsland;
    const id = 'forensic-cyberforensic-lab';
    const district = world.objectGroups.get(id);
    world.select(id, 'system');
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
  const defaultCloseAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const stats = world.getSceneStatistics();
    let liveAuthoredSources = 0;
    world.scene.traverse((object) => {
      if (object.userData.gpuBatchSource === true) liveAuthoredSources += 1;
    });
    return { stats, liveAuthoredSources };
  });
  if (defaultCloseAudit.stats.drawCalls > 2_000
    || defaultCloseAudit.stats.triangles > 1_200_000
    || defaultCloseAudit.stats.activeAnimationNodes > 250
    || defaultCloseAudit.stats.streaming.loadedPackageCount > 8
    || defaultCloseAudit.liveAuthoredSources !== 0) {
    throw new Error(`Default streamed close-range audit failed: ${JSON.stringify(defaultCloseAudit, null, 2)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/default-close-complete-buildings.png`, fullPage: true });

  await page.locator('#full-island-detail').check({ force: true });
  await page.waitForFunction((targetPackageCount) => {
    const streaming = window.labIsland.getStreamingSnapshot();
    return streaming.fullIslandDetailReady === true
      && streaming.fullIslandDetailProgress.ready === targetPackageCount;
  }, TARGET_PACKAGE_COUNT);
  await page.evaluate(() => {
    const world = window.labIsland;
    world.setMode('explore');
    world.setGraphicsQuality('medium');
    world.overview();
  });
  await settle(1_000);

  const fullAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const stats = world.getSceneStatistics();
    const streaming = stats.streaming;
    const buildingCategories = new Set([
      'academic-building',
      'entry-logistics-building',
      'authored-exterior-building',
    ]);
    const buildingDefinitions = world.getDefinitions().filter((definition) => (
      definition.assetKind === 'building' && buildingCategories.has(definition.category)
    ));
    const buildingIds = buildingDefinitions.map((definition) => definition.id);
    const metadataBuildingIds = new Set();
    let suppressedMeshes = 0;
    let liveAuthoredSources = 0;
    let markedRuntimeObjects = 0;
    let metadataAnchorCount = 0;
    let trueRuntimeBatchCount = 0;
    world.scene.traverse((object) => {
      if (object.userData.streamingBudgetSuppressed === true) suppressedMeshes += 1;
      if (object.userData.gpuBatchSource === true) liveAuthoredSources += 1;
      if (object.userData.gpuRuntimeBatch !== true) return;
      markedRuntimeObjects += 1;
      if (object.userData.gpuBatchMetadataAnchor === true) metadataAnchorCount += 1;
      else trueRuntimeBatchCount += 1;
      (object.userData.batchSelectableIds ?? []).forEach((id) => {
        if (typeof id === 'string' && id) metadataBuildingIds.add(id);
      });
    });

    world.walkController.refreshNavigation();
    const hiddenCollisionSources = new Set([
      ...world.walkController.walkables,
      ...world.walkController.navigationObstacles.map((entry) => entry?.object).filter(Boolean),
    ].filter((object) => object.userData.gpuBatchSource === true));

    let devicePreference = null;
    try {
      devicePreference = JSON.parse(localStorage.getItem('youtopy_device_preferences') ?? 'null');
    } catch {
      devicePreference = null;
    }
    const categoryCounts = buildingDefinitions.reduce((counts, definition) => {
      counts[definition.category] = (counts[definition.category] ?? 0) + 1;
      return counts;
    }, {});
    return {
      stats,
      representationErrors: streaming.packages.filter((pkg) => (
        Number(pkg.detailResident) + Number(pkg.midVisible) + Number(pkg.farVisible) !== 1
      )).map((pkg) => pkg.id),
      nonReadyPackages: streaming.packages.filter((pkg) => (
        pkg.lifecyclePhase !== 'ready' || pkg.visualLevel !== 'detail' || !pkg.detailResident
      )).map((pkg) => ({ id: pkg.id, phase: pkg.lifecyclePhase, level: pkg.visualLevel })),
      suppressedMeshes,
      liveAuthoredSources,
      markedRuntimeObjects,
      metadataAnchorCount,
      trueRuntimeBatchCount,
      stableBuildings: {
        count: buildingDefinitions.length,
        uniqueCount: new Set(buildingIds).size,
        categoryCounts,
        missingObjectGroups: buildingIds.filter((id) => !world.objectGroups.has(id)),
        resolvedByBatchMetadata: buildingIds.filter((id) => metadataBuildingIds.has(id)).length,
        missingBatchMetadata: buildingIds.filter((id) => !metadataBuildingIds.has(id)),
      },
      hiddenSourceCollisionCount: hiddenCollisionSources.size,
      collisionSpatialIndex: world.walkController.getNavigationSpatialIndexSnapshot(),
      legacyPreference: localStorage.getItem('youtopy_full_island_detail'),
      devicePreference,
      projectSchema: world.takeSnapshotPayload().schema,
    };
  });
  const fullStreaming = fullAudit.stats.streaming;
  if (!fullStreaming.fullIslandDetailRequested
    || !fullStreaming.fullIslandDetailReady
    || fullStreaming.totalPackages !== TARGET_PACKAGE_COUNT
    || fullStreaming.fullIslandDetailProgress.total !== TARGET_PACKAGE_COUNT
    || fullStreaming.fullIslandDetailProgress.ready !== TARGET_PACKAGE_COUNT
    || fullStreaming.fullIslandDetailProgress.error !== 0
    || fullStreaming.loadedPackageCount !== TARGET_PACKAGE_COUNT
    || fullStreaming.residentPackageCount !== TARGET_PACKAGE_COUNT
    || fullStreaming.proxyPackageCount !== 0
    || fullStreaming.midPackageCount !== 0
    || fullStreaming.farPackageCount !== 0
    || fullAudit.stats.drawCalls > 1_500
    // The five-building Omics campus replaces four generic anchors and brings
    // the audited full-island baseline to 798 GPU batches, 407 textures, and
    // about 3.40M triangles. Preserve a small regression margin above that
    // authored baseline while keeping the draw-call ceiling fixed.
    || fullStreaming.gpuBatching.batchCount > 810
    || fullAudit.stats.textureCount > 420
    || fullAudit.stats.triangles > 3_450_000
    || fullAudit.stats.activeAnimationNodes > 120
    || fullAudit.suppressedMeshes !== 0
    || fullAudit.liveAuthoredSources !== 0
    || fullStreaming.normalRenderAuthoredSourceCount !== 0
    || !(fullStreaming.detachedAuthoringSourceCount > 0)
    || fullAudit.trueRuntimeBatchCount === 0
    || fullAudit.trueRuntimeBatchCount !== fullStreaming.gpuBatching.batchCount
    || fullAudit.markedRuntimeObjects !== fullAudit.trueRuntimeBatchCount + fullAudit.metadataAnchorCount
    || fullAudit.metadataAnchorCount === 0
    || fullAudit.stableBuildings.count !== TARGET_BUILDING_COUNT
    || fullAudit.stableBuildings.uniqueCount !== TARGET_BUILDING_COUNT
    || fullAudit.stableBuildings.missingObjectGroups.length
    || fullAudit.stableBuildings.resolvedByBatchMetadata !== TARGET_BUILDING_COUNT
    || fullAudit.stableBuildings.missingBatchMetadata.length
    || fullAudit.hiddenSourceCollisionCount === 0
    || fullAudit.collisionSpatialIndex.occupiedCellCount === 0
    || fullAudit.representationErrors.length
    || fullAudit.nonReadyPackages.length
    || fullAudit.legacyPreference !== 'true'
    || fullAudit.devicePreference?.version !== 1
    || fullAudit.devicePreference?.fullIslandDetail !== true
    || fullAudit.projectSchema !== 'youtopy.lab-island/2.0') {
    throw new Error(`Full-island structural audit failed: ${JSON.stringify(fullAudit, null, 2)}`);
  }

  const compactTextAudit = await page.evaluate(() => {
    for (let index = 0; index < 5; index += 1) window.render_game_to_text();
    const elapsedSamples = [];
    let largestBytes = 0;
    let largestPreparationMs = 0;
    let finalPayload = null;
    for (let index = 0; index < 20; index += 1) {
      const startedAt = performance.now();
      const text = window.render_game_to_text();
      elapsedSamples.push(performance.now() - startedAt);
      largestBytes = Math.max(largestBytes, new TextEncoder().encode(text).byteLength);
      finalPayload = JSON.parse(text);
      largestPreparationMs = Math.max(largestPreparationMs, Number(finalPayload.preparationMs ?? 0));
    }
    return {
      elapsedSamples,
      largestBytes,
      largestPreparationMs,
      relevantPackageCount: finalPayload?.streaming?.relevantPackages?.length ?? 0,
      includesPackageArray: Array.isArray(finalPayload?.streaming?.packages),
      authoredBuildingCount: finalPayload?.counts?.authoredBuildings ?? 0,
    };
  });
  compactTextAudit.p95Ms = percentile(compactTextAudit.elapsedSamples, 0.95);
  if (compactTextAudit.largestBytes >= 25 * 1024
    || compactTextAudit.largestPreparationMs > 3
    || compactTextAudit.p95Ms > 3
    || compactTextAudit.includesPackageArray
    || compactTextAudit.relevantPackageCount > 5
    || compactTextAudit.authoredBuildingCount !== TARGET_BUILDING_COUNT) {
    throw new Error(`Compact render_game_to_text budget failed: ${JSON.stringify(compactTextAudit, null, 2)}`);
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
  await settle(500);
  const offAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const stats = world.getSceneStatistics();
    let liveAuthoredSources = 0;
    world.scene.traverse((object) => {
      if (object.userData.gpuBatchSource === true) liveAuthoredSources += 1;
    });
    let devicePreference = null;
    try {
      devicePreference = JSON.parse(localStorage.getItem('youtopy_device_preferences') ?? 'null');
    } catch {
      devicePreference = null;
    }
    return {
      stats,
      legacyPreference: localStorage.getItem('youtopy_full_island_detail'),
      devicePreference,
      warning: world.getGpuDetailCapabilities().performanceWarning,
      liveAuthoredSources,
      representationErrors: stats.streaming.packages.filter((pkg) => (
        Number(pkg.detailResident) + Number(pkg.midVisible) + Number(pkg.farVisible) !== 1
      )).map((pkg) => pkg.id),
    };
  });
  if (offAudit.stats.streaming.cacheCapacity !== 8
    || offAudit.stats.streaming.effectiveCacheCapacity !== 8
    || offAudit.stats.streaming.fullIslandDetailRequested
    || offAudit.stats.streaming.loadedPackageCount > 8
    || offAudit.stats.drawCalls > 1_500
    || offAudit.stats.activeAnimationNodes > 250
    || offAudit.stats.rendererGeometries > 3_500
    || offAudit.liveAuthoredSources !== 0
    || offAudit.representationErrors.length
    || offAudit.legacyPreference !== 'false'
    || offAudit.devicePreference?.version !== 1
    || offAudit.devicePreference?.fullIslandDetail !== false
    || offAudit.warning !== null) {
    throw new Error(`Returning to streamed LRU failed: ${JSON.stringify(offAudit, null, 2)}`);
  }

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.labIsland));
  const reloadAudit = await page.evaluate(() => ({
    checked: document.querySelector('#full-island-detail').checked,
    requested: window.labIsland.isFullIslandDetail(),
  }));
  if (reloadAudit.checked || reloadAudit.requested) {
    throw new Error(`Device-local preference reload failed: ${JSON.stringify(reloadAudit)}`);
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);

  const report = {
    defaultAudit,
    defaultCloseAudit,
    fullAudit,
    compactTextAudit,
    warningAudit,
    offAudit,
    reloadAudit,
    errors,
  };
  await writeFile(`${OUTPUT}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    streamed: {
      overviewDrawCalls: defaultAudit.stats.drawCalls,
      closeDrawCalls: defaultCloseAudit.stats.drawCalls,
      closeTriangles: defaultCloseAudit.stats.triangles,
      loadedPackages: defaultAudit.stats.streaming.loadedPackageCount,
      packageBudgetViolations: defaultAudit.packageBudgetViolations.length,
    },
    full: {
      drawCalls: fullAudit.stats.drawCalls,
      triangles: fullAudit.stats.triangles,
      textures: fullAudit.stats.textureCount,
      loaded: fullAudit.stats.streaming.loadedPackageCount,
      resident: fullAudit.stats.streaming.residentPackageCount,
      ready: fullAudit.stats.streaming.fullIslandDetailProgress.ready,
      proxies: fullAudit.stats.streaming.proxyPackageCount,
      activeAnimationNodes: fullAudit.stats.activeAnimationNodes,
      backend: fullAudit.stats.streaming.gpuBatching.backend,
      runtimeBatches: fullAudit.trueRuntimeBatchCount,
      metadataAnchors: fullAudit.metadataAnchorCount,
      detachedAuthoringSources: fullAudit.stats.streaming.detachedAuthoringSourceCount,
      liveAuthoredSources: fullAudit.liveAuthoredSources,
      stableBuildings: fullAudit.stableBuildings.count,
      buildingsResolvedByBatchMetadata: fullAudit.stableBuildings.resolvedByBatchMetadata,
    },
    compactText: {
      bytes: compactTextAudit.largestBytes,
      preparationMs: compactTextAudit.largestPreparationMs,
      p95Ms: compactTextAudit.p95Ms,
    },
    hiddenSourceCollisionCount: fullAudit.hiddenSourceCollisionCount,
    warning: Boolean(warningAudit.warning),
    streamedAfterToggle: offAudit.stats.streaming.loadedPackageCount,
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
