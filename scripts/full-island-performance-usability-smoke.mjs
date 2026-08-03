import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.FULL_ISLAND_PERFORMANCE_OUTPUT ?? 'output/full-island-performance-usability';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_PACKAGE_COUNT = 41;
const TARGET_BUILDING_COUNT = 257;
const COLLECT_DIAGNOSTICS = process.env.FULL_ISLAND_COLLECT_DIAGNOSTICS === '1';
const diagnosticFailures = [];

function failOrCollect(message) {
  if (!COLLECT_DIAGNOSTICS) throw new Error(message);
  diagnosticFailures.push(message);
  console.error(`[diagnostic] ${message}`);
}

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`page: ${error.message}`));

const percentile = (samples, fraction) => {
  if (!samples.length) return 0;
  const sorted = [...samples].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
};

const waitForFullIslandReady = () => page.waitForFunction(() => {
  const snapshot = window.labIsland?.getStreamingSnapshot?.();
  return snapshot?.fullIslandDetailReady === true
    && snapshot?.fullIslandDetailProgress?.ready === 41;
}, undefined, { timeout: 180_000 });

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_full_island_detail');
    localStorage.removeItem('youtopy_device_preferences');
    sessionStorage.removeItem('youtopy_full_island_safe_streamed_session');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(
    window.labIsland?.getStreamingSnapshot
    && window.labIsland?.getSceneStatistics
    && window.render_game_to_text,
  ));
  await page.waitForSelector('#loading-screen', { state: 'hidden' });
  await page.evaluate(() => window.labIsland.advanceTime(350));
  await page.waitForTimeout(150);

  const accessibility = await page.evaluate(() => {
    const input = document.querySelector('#full-island-detail');
    const label = input?.closest('label');
    const labelRect = label?.getBoundingClientRect();
    const chip = document.querySelector('#full-island-status-chip');
    const chipRect = chip?.getBoundingClientRect();
    const card = document.querySelector('#full-island-status-card');
    const progress = document.querySelector('#full-island-status-progress');
    const announcer = document.querySelector('#full-island-status-announcer');
    const requiredActions = [
      '#full-island-retry',
      '#full-island-lower-quality',
      '#full-island-return-streamed',
      '#full-island-safe-session',
    ];
    return {
      toggleDescribedBy: input?.getAttribute('aria-describedby') ?? '',
      toggleTarget: labelRect ? { width: labelRect.width, height: labelRect.height } : null,
      chipVisible: Boolean(chipRect && chipRect.width > 0 && chipRect.height > 0),
      chipControls: chip?.getAttribute('aria-controls') ?? null,
      chipExpanded: chip?.getAttribute('aria-expanded') ?? null,
      cardInitiallyHidden: Boolean(card?.hidden),
      nativeProgress: progress?.tagName === 'PROGRESS',
      progressMaximum: Number(progress?.getAttribute('max')),
      liveRegion: announcer?.getAttribute('aria-live') ?? null,
      actions: requiredActions.map((selector) => ({
        selector,
        present: Boolean(document.querySelector(selector)),
        label: document.querySelector(selector)?.textContent?.trim() ?? '',
      })),
    };
  });
  if (!accessibility.toggleDescribedBy.includes('full-island-detail-help')
    || !accessibility.toggleDescribedBy.includes('full-island-detail-status')
    || !accessibility.toggleTarget
    || accessibility.toggleTarget.height < 44
    || !accessibility.chipVisible
    || accessibility.chipControls !== 'full-island-status-card'
    || accessibility.chipExpanded !== 'false'
    || !accessibility.cardInitiallyHidden
    || !accessibility.nativeProgress
    || accessibility.progressMaximum !== TARGET_PACKAGE_COUNT
    || accessibility.liveRegion !== 'polite'
    || accessibility.actions.some((action) => !action.present || !action.label)) {
    failOrCollect(`Full-detail accessibility surface failed: ${JSON.stringify(accessibility, null, 2)}`);
  }

  // Slow the warm-up callback just enough to make lifecycle phases observable;
  // this preserves package ordering and the production four-millisecond slices.
  await page.evaluate(() => {
    const streaming = window.labIsland.worldStreaming;
    const originalWarmup = streaming.gpuWarmupHandler;
    streaming.gpuWarmupHandler = async (...args) => {
      if (originalWarmup) await originalWarmup(...args);
      await new Promise((resolve) => setTimeout(resolve, 18));
    };
  });

  const priorityPackageId = 'forensic-cyberforensic-lab';
  await page.evaluate((packageId) => window.labIsland.prioritizeFullIslandPackage(packageId), priorityPackageId);
  const activationStartedAt = performance.now();
  await page.locator('#full-island-detail').check({ force: true });
  const lifecycleSamples = [];
  let fullReady = false;
  while (!fullReady && performance.now() - activationStartedAt < 180_000) {
    const sample = await page.evaluate(() => {
      const streaming = window.labIsland.getStreamingSnapshot();
      const lifecycle = streaming.fullIslandLifecycle ?? streaming.fullIslandDetailProgress;
      const progress = document.querySelector('#full-island-status-progress');
      return {
        elapsed: performance.now(),
        lifecycle: { ...lifecycle },
        loaded: streaming.loadedPackageCount,
        resident: streaming.residentPackageCount,
        proxies: streaming.proxyPackageCount,
        ready: streaming.fullIslandDetailReady,
        chip: document.querySelector('#full-island-status-chip-label')?.textContent?.trim() ?? '',
        uiProgress: { value: Number(progress?.value), maximum: Number(progress?.max) },
        activePhases: streaming.packages
          .filter((pkg) => pkg.lifecyclePhase === 'building' || pkg.lifecyclePhase === 'warming-gpu')
          .map((pkg) => ({ id: pkg.id, phase: pkg.lifecyclePhase })),
        priority: streaming.packages.find((pkg) => pkg.id === 'forensic-cyberforensic-lab')?.priorityReason ?? null,
      };
    });
    lifecycleSamples.push(sample);
    fullReady = sample.ready;
    if (!fullReady) await page.waitForTimeout(24);
  }
  if (!fullReady) throw new Error('Full Island Detail did not reach 41/41 ready within 180 seconds.');
  const activationReadyMs = performance.now() - activationStartedAt;
  await page.evaluate(() => window.labIsland.advanceTime(1_100));
  await page.waitForTimeout(180);
  await page.waitForFunction(() => {
    const progress = document.querySelector('#full-island-status-progress');
    return document.querySelector('#full-island-status-chip-label')?.textContent?.trim() === 'Ready'
      && Number(progress?.value) === 41;
  }, undefined, { timeout: 10_000 });

  const lifecyclePhases = new Set(lifecycleSamples.map((sample) => sample.lifecycle.phase));
  const packageLifecyclePhases = new Set(lifecycleSamples.flatMap((sample) => (
    sample.activePhases.map((entry) => entry.phase)
  )));
  const readyCounts = lifecycleSamples.map((sample) => sample.lifecycle.ready ?? 0);
  const progressMonotonic = readyCounts.every((count, index) => index === 0 || count >= readyCounts[index - 1]);
  const queuedObserved = lifecycleSamples.some((sample) => (sample.lifecycle.queued ?? 0) > 0);
  const exactRepresentationThroughout = lifecycleSamples.every((sample) => (
    sample.resident + sample.proxies === TARGET_PACKAGE_COUNT
  ));
  const maximumConcurrentActivation = Math.max(...lifecycleSamples.map((sample) => sample.activePhases.length));
  const finalLifecycle = await page.evaluate(() => {
    const streaming = window.labIsland.getStreamingSnapshot();
    const lifecycle = streaming.fullIslandLifecycle ?? streaming.fullIslandDetailProgress;
    const progress = document.querySelector('#full-island-status-progress');
    return {
      elapsed: performance.now(),
      lifecycle: { ...lifecycle },
      loaded: streaming.loadedPackageCount,
      resident: streaming.residentPackageCount,
      proxies: streaming.proxyPackageCount,
      ready: streaming.fullIslandDetailReady,
      chip: document.querySelector('#full-island-status-chip-label')?.textContent?.trim() ?? '',
      uiProgress: { value: Number(progress?.value), maximum: Number(progress?.max) },
      activePhases: streaming.packages
        .filter((pkg) => pkg.lifecyclePhase === 'building' || pkg.lifecyclePhase === 'warming-gpu')
        .map((pkg) => ({ id: pkg.id, phase: pkg.lifecyclePhase })),
      priority: streaming.packages.find((pkg) => pkg.id === 'forensic-cyberforensic-lab')?.priorityReason ?? null,
    };
  });
  if (!packageLifecyclePhases.has('building')
    || !lifecyclePhases.has('warming-gpu')
    || !lifecyclePhases.has('ready')
    || !queuedObserved
    || !progressMonotonic
    || !exactRepresentationThroughout
    || maximumConcurrentActivation > 4
    || finalLifecycle.lifecycle.ready !== TARGET_PACKAGE_COUNT
    || finalLifecycle.loaded !== TARGET_PACKAGE_COUNT
    || finalLifecycle.resident !== TARGET_PACKAGE_COUNT
    || finalLifecycle.proxies !== 0
    || finalLifecycle.uiProgress.value !== TARGET_PACKAGE_COUNT
    || finalLifecycle.uiProgress.maximum !== TARGET_PACKAGE_COUNT
    || !['manual', 'selected', 'visible', 'nearest'].includes(
      lifecycleSamples.find((sample) => sample.priority)?.priority ?? '',
    )) {
    failOrCollect(`Full-detail lifecycle failed: ${JSON.stringify({
      lifecyclePhases: [...lifecyclePhases],
      queuedObserved,
      progressMonotonic,
      exactRepresentationThroughout,
      maximumConcurrentActivation,
      first: lifecycleSamples[0],
      final: finalLifecycle,
      activationReadyMs: Math.round(activationReadyMs),
    }, null, 2)}`);
  }
  console.log(`Full Island Detail reached 41/41 in ${Math.round(activationReadyMs)} ms (headless diagnostic).`);

  const definitions = await page.evaluate(() => {
    const world = window.labIsland;
    const buildings = world.getDefinitions().filter((definition) => [
      'academic-building',
      'entry-logistics-building',
      'authored-exterior-building',
    ].includes(definition.category));
    const ids = buildings.map((definition) => definition.id);
    const packageIds = new Set(world.getStreamingSnapshot().packages.map((pkg) => pkg.id));
    const missingGroups = buildings.filter((definition) => !world.objectGroups.has(definition.id)).map((definition) => definition.id);
    const missingParents = buildings.filter((definition) => !packageIds.has(definition.parentDistrictId)).map((definition) => definition.id);
    const batchSelectableIds = new Set();
    world.modelRoot.traverse((object) => {
      if (object.userData.gpuRuntimeBatch !== true) return;
      (object.userData.batchSelectableIds ?? []).filter(Boolean).forEach((id) => batchSelectableIds.add(id));
    });
    return {
      count: buildings.length,
      unique: new Set(ids).size,
      missingGroups,
      missingParents,
      batchResolved: buildings.filter((definition) => batchSelectableIds.has(definition.id)).length,
      missingBatchResolved: buildings.filter((definition) => !batchSelectableIds.has(definition.id)).map((definition) => ({
        id: definition.id,
        name: definition.name,
        parentDistrictId: definition.parentDistrictId,
      })),
      compactCount: JSON.parse(window.render_game_to_text()).counts.authoredBuildings,
    };
  });
  if (definitions.count !== TARGET_BUILDING_COUNT
    || definitions.unique !== TARGET_BUILDING_COUNT
    || definitions.missingGroups.length
    || definitions.missingParents.length
    || definitions.batchResolved !== TARGET_BUILDING_COUNT
    || definitions.compactCount !== TARGET_BUILDING_COUNT) {
    failOrCollect(`Stable building definition audit failed: ${JSON.stringify(definitions, null, 2)}`);
  }

  const microdetail = await page.evaluate(() => {
    const world = window.labIsland;
    const streaming = world.worldStreaming;
    const packages = Array.from(streaming.packages.values());
    const pkg = packages.find((candidate) => candidate.microSources.length > 0);
    if (!pkg) return { total: world.getStreamingSnapshot().microdetail.total, failure: 'no tagged microdetail records' };
    const record = pkg.microSources[0];
    const object = record.object;
    const selectedBefore = streaming.lastSelectedPackageId;
    const contextBefore = streaming.lastUpdateContext;
    const cameraPosition = world.camera.position.clone();
    const cameraQuaternion = world.camera.quaternion.clone();
    const controlsTarget = world.controls.target.clone();
    const worldPosition = object.getWorldPosition(world.camera.position.clone());
    const otherPackage = packages.find((candidate) => candidate.id !== pkg.id)?.id ?? null;
    streaming.lastUpdateContext = { ...(contextBefore ?? {}), nearestPackageId: otherPackage };

    // Establish a known visible transition first. A distant package may have
    // been culled by the live camera long before this audit starts; in that
    // valid state its 250 ms dwell has already elapsed and an immediate restore
    // would not exercise the transition hysteresis we intend to verify.
    streaming.lastSelectedPackageId = pkg.id;
    streaming.updateMicrodetailVisibility(world.camera, 1080, 99);
    const visibleBeforeCull = record.visible === true;
    streaming.lastSelectedPackageId = null;

    world.camera.position.copy(worldPosition).add({ x: 0, y: 100_000, z: 100_000 });
    world.camera.lookAt(worldPosition);
    world.camera.updateMatrixWorld(true);
    streaming.updateMicrodetailVisibility(world.camera, 1080, 100);
    const hiddenBelow075 = record.visible === false;

    world.camera.position.copy(worldPosition).add({ x: 0, y: 0.5, z: 0.75 });
    world.camera.lookAt(worldPosition);
    world.camera.updateMatrixWorld(true);
    streaming.updateMicrodetailVisibility(world.camera, 1080, 100.1);
    const remainedHiddenDuringDwell = record.visible === false;
    streaming.updateMicrodetailVisibility(world.camera, 1080, 100.36);
    const restoredAbove09 = record.visible === true;

    world.camera.position.copy(worldPosition).add({ x: 0, y: 100_000, z: 100_000 });
    world.camera.lookAt(worldPosition);
    world.camera.updateMatrixWorld(true);
    streaming.updateMicrodetailVisibility(world.camera, 1080, 101);
    const hiddenAgain = record.visible === false;
    streaming.lastSelectedPackageId = pkg.id;
    streaming.updateMicrodetailVisibility(world.camera, 1080, 101.01);
    const selectedRestoredImmediately = record.visible === true;

    streaming.lastSelectedPackageId = selectedBefore;
    streaming.lastUpdateContext = contextBefore;
    world.camera.position.copy(cameraPosition);
    world.camera.quaternion.copy(cameraQuaternion);
    world.controls.target.copy(controlsTarget);
    world.camera.updateMatrixWorld(true);
    return {
      total: world.getStreamingSnapshot().microdetail.total,
      packageId: pkg.id,
      sourceName: object.name,
      visibleBeforeCull,
      hiddenBelow075,
      remainedHiddenDuringDwell,
      restoredAbove09,
      hiddenAgain,
      selectedRestoredImmediately,
      mandatoryCount: packages.reduce((sum, candidate) => sum + candidate.renderImportance.mandatory, 0),
    };
  });
  if (!(microdetail.total > 0)
    || !microdetail.visibleBeforeCull
    || !microdetail.hiddenBelow075
    || !microdetail.remainedHiddenDuringDwell
    || !microdetail.restoredAbove09
    || !microdetail.hiddenAgain
    || !microdetail.selectedRestoredImmediately
    || !(microdetail.mandatoryCount > 0)) {
    failOrCollect(`Microdetail threshold/dwell audit failed: ${JSON.stringify(microdetail, null, 2)}`);
  }

  const compactText = await page.evaluate(() => {
    for (let index = 0; index < 5; index += 1) window.render_game_to_text();
    const samples = [];
    let largestBytes = 0;
    let largestPreparationMs = 0;
    let finalPayload = null;
    for (let index = 0; index < 30; index += 1) {
      const startedAt = performance.now();
      const text = window.render_game_to_text();
      const elapsedMs = performance.now() - startedAt;
      const payload = JSON.parse(text);
      samples.push(elapsedMs);
      largestBytes = Math.max(largestBytes, new TextEncoder().encode(text).byteLength);
      largestPreparationMs = Math.max(largestPreparationMs, Number(payload.preparationMs));
      finalPayload = payload;
    }
    return { samples, largestBytes, largestPreparationMs, finalPayload };
  });
  const compactP95Ms = percentile(compactText.samples, 0.95);
  console.log(`Compact telemetry: ${compactText.largestBytes} bytes; preparation max ${compactText.largestPreparationMs.toFixed(3)} ms; call p95 ${compactP95Ms.toFixed(3)} ms.`);
  if (compactText.largestBytes >= 25 * 1024
    || compactText.largestPreparationMs >= 3
    || compactP95Ms >= 3
    || Array.isArray(compactText.finalPayload?.streaming?.packages)
    || compactText.finalPayload?.streaming?.relevantPackages?.length > 5) {
    failOrCollect(`Compact render_game_to_text budget failed: ${JSON.stringify({
      largestBytes: compactText.largestBytes,
      largestPreparationMs: compactText.largestPreparationMs,
      p95Ms: compactP95Ms,
      relevantPackageCount: compactText.finalPayload?.streaming?.relevantPackages?.length,
    }, null, 2)}`);
  }

  await page.locator('#full-island-status-chip').click();
  await page.waitForFunction(() => document.querySelector('#full-island-status-card')?.hidden === false);
  const readyUi = await page.evaluate(() => {
    const text = (selector) => document.querySelector(selector)?.textContent?.trim() ?? '';
    const progress = document.querySelector('#full-island-status-progress');
    return {
      state: document.querySelector('#full-island-detail-monitor')?.dataset.state,
      chip: text('#full-island-status-chip-label'),
      expanded: document.querySelector('#full-island-status-chip')?.getAttribute('aria-expanded'),
      progress: { value: Number(progress?.value), maximum: Number(progress?.max) },
      summary: text('#full-island-status-summary'),
      renderer: text('#full-island-renderer'),
      backend: text('#full-island-backend'),
      dpr: text('#full-island-dpr'),
      cpu: text('#full-island-cpu-p95'),
      gpu: text('#full-island-gpu-p95'),
      calls: text('#full-island-draw-calls'),
      triangles: text('#full-island-triangles'),
      memory: text('#full-island-memory'),
    };
  });
  if (readyUi.state !== 'ready'
    || readyUi.chip !== 'Ready'
    || readyUi.expanded !== 'true'
    || readyUi.progress.value !== TARGET_PACKAGE_COUNT
    || readyUi.progress.maximum !== TARGET_PACKAGE_COUNT
    || Object.entries(readyUi).some(([key, value]) => (
      ['summary', 'renderer', 'backend', 'dpr', 'cpu', 'gpu', 'calls', 'triangles', 'memory'].includes(key)
      && (typeof value !== 'string' || value.length === 0)
    ))) {
    failOrCollect(`Ready status card failed: ${JSON.stringify(readyUi, null, 2)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/full-island-ready-status.png`, fullPage: true });

  const atlas = await page.evaluate(() => {
    const world = window.labIsland;
    const districtIds = world.getStreamingSnapshot().packages.filter((pkg) => pkg.kind === 'district').map((pkg) => pkg.id);
    const rows = districtIds.map((id) => {
      const row = document.querySelector(`[data-id="${CSS.escape(id)}"]`);
      const rowContainer = row?.closest('.atlas-district-row, [data-district-row]') ?? row?.parentElement;
      const toggle = row?.matches('[aria-expanded]') ? row : rowContainer?.querySelector('[aria-expanded]');
      const readinessSelector = '[data-atlas-package-readiness], [data-readiness], .district-readiness, .atlas-readiness, .package-readiness';
      const readiness = row?.querySelector(readinessSelector) ?? rowContainer?.querySelector(readinessSelector);
      return {
        id,
        rowPresent: Boolean(row),
        expandable: Boolean(toggle),
        readiness: readiness?.textContent?.trim() ?? '',
      };
    });
    return { rows };
  });
  if (atlas.rows.length !== 35
    || atlas.rows.some((row) => !row.rowPresent || !row.expandable || !/ready/i.test(row.readiness))) {
    failOrCollect(`Atlas district readiness/expandability failed: ${JSON.stringify(atlas, null, 2)}`);
  }

  // Expand a building-rich district and exercise its previous/next controls.
  const atlasNavigation = await page.evaluate(async () => {
    const districtId = 'forensic-cyberforensic-lab';
    const world = window.labIsland;
    const districtRow = document.querySelector(`[data-id="${CSS.escape(districtId)}"]`);
    const rowContainer = districtRow?.closest('.atlas-district-row, [data-district-row]') ?? districtRow?.parentElement;
    const toggle = districtRow?.matches('[aria-expanded]') ? districtRow : rowContainer?.querySelector('[aria-expanded]');
    if (toggle?.getAttribute('aria-expanded') !== 'true') toggle?.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const candidates = Array.from(document.querySelectorAll('[data-id]')).filter((element) => {
      const definition = world.getDefinition(element.dataset.id);
      return definition?.parentDistrictId === districtId
        && element.getClientRects().length > 0
        && element.closest('[hidden]') === null;
    });
    const first = candidates[0];
    first?.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const selectedFirst = JSON.parse(window.render_game_to_text()).selected?.id ?? null;
    const navigation = document.querySelector('#building-navigation');
    const navigationVisible = Boolean(navigation && !navigation.hidden && navigation.getClientRects().length > 0);
    const position = document.querySelector('#building-navigation-position')?.textContent?.trim() ?? '';
    document.querySelector('#next-building')?.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const selectedNext = JSON.parse(window.render_game_to_text()).selected?.id ?? null;
    document.querySelector('#previous-building')?.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const selectedPrevious = JSON.parse(window.render_game_to_text()).selected?.id ?? null;
    return {
      candidateCount: candidates.length,
      selectedFirst,
      selectedNext,
      selectedPrevious,
      navigationVisible,
      position,
    };
  });
  if (atlasNavigation.candidateCount < 15
    || !atlasNavigation.selectedFirst
    || atlasNavigation.selectedNext === atlasNavigation.selectedFirst
    || atlasNavigation.selectedPrevious !== atlasNavigation.selectedFirst
    || !atlasNavigation.navigationVisible
    || !/\d+\s+of\s+\d+/i.test(atlasNavigation.position)) {
    failOrCollect(`Atlas building navigation failed: ${JSON.stringify(atlasNavigation, null, 2)}`);
  }

  await page.evaluate(() => {
    window.labIsland.setMode('explore');
    window.labIsland.overview();
    window.labIsland.advanceTime(350);
  });
  await page.waitForTimeout(180);
  const performanceAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const stats = world.getSceneStatistics();
    const compact = JSON.parse(window.render_game_to_text());
    let liveAuthoredSources = 0;
    world.modelRoot.traverse((object) => {
      if (object.userData.gpuBatchSource === true) liveAuthoredSources += 1;
    });
    return {
      stats,
      compactRenderer: compact.renderer,
      compactPerformance: compact.performance,
      liveAuthoredSources,
    };
  });
  const stats = performanceAudit.stats;
  console.log(`Overview telemetry: ${stats.drawCalls} calls, ${stats.triangles} triangles, ${stats.textureCount} textures, ${stats.streaming.gpuBatching.batchCount} batches, ${stats.activeAnimationNodes} CPU animations, ${performanceAudit.liveAuthoredSources} live authored sources.`);
  if (stats.streaming.loadedPackageCount !== TARGET_PACKAGE_COUNT
    || stats.streaming.fullIslandDetailProgress.ready !== TARGET_PACKAGE_COUNT
    || stats.streaming.gpuBatching.batchCount > 700
    || stats.textureCount > 400
    || stats.triangles > 3_000_000
    || stats.drawCalls > 1_500
    || stats.activeAnimationNodes > 120
    || performanceAudit.liveAuthoredSources !== 0
    || stats.frameTiming.targetFps !== 60
    || !['cpu', 'gpu', 'balanced', 'unknown'].includes(stats.frameTiming.bottleneck)
    || typeof stats.renderer.reverseDepthBuffer !== 'boolean'
    || stats.renderer.transmissionPassActive !== false
    || stats.renderer.recoveryPhase !== 'ready'
    || !(stats.renderer.shaderProgramCount >= 0)
    || !(stats.streaming.gpuBatching.estimatedGeometryBytes > 0)
    || !(stats.streaming.gpuBatching.estimatedTextureBytes >= 0)
    || performanceAudit.compactRenderer.recoveryPhase !== 'ready'
    || performanceAudit.compactPerformance.targetFps !== 60) {
    failOrCollect(`Full-island structural/timing telemetry failed: ${JSON.stringify({
      drawCalls: stats.drawCalls,
      triangles: stats.triangles,
      textures: stats.textureCount,
      runtimeBatches: stats.streaming.gpuBatching.batchCount,
      animations: stats.activeAnimationNodes,
      liveAuthoredSources: performanceAudit.liveAuthoredSources,
      frameTiming: stats.frameTiming,
      renderer: stats.renderer,
      compactRenderer: performanceAudit.compactRenderer,
    }, null, 2)}`);
  }

  await page.locator('#performance-toggle').click();
  const performanceHud = await page.evaluate(() => ({
    visible: !document.querySelector('#debug-stats')?.hidden,
    text: document.querySelector('#debug-stats')?.textContent ?? '',
    debugPressed: document.querySelector('#debug-toggle')?.getAttribute('aria-pressed') ?? 'false',
  }));
  if (!performanceHud.visible
    || !performanceHud.text.includes('PERFORMANCE HUD')
    || !performanceHud.text.includes('GPU p50/95')
    || !performanceHud.text.includes('micro detail')
    || performanceHud.debugPressed !== 'false') {
    failOrCollect(`Separate performance HUD failed: ${JSON.stringify(performanceHud, null, 2)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/full-island-performance-hud.png`, fullPage: true });

  // UI-driven failure and retry: the proxy should remain available until the
  // package returns through queued/building/warming-gpu to ready.
  const failurePackageId = 'tropical-rainforest-dome';
  const simulatedFailure = await page.evaluate(
    (id) => window.labIsland.worldStreaming.simulateLoadError(id, 'Focused regression failure'),
    failurePackageId,
  );
  if (!simulatedFailure) throw new Error(`Could not simulate package failure for ${failurePackageId}.`);
  await page.waitForFunction(() => document.querySelector('#full-island-detail-monitor')?.dataset.state === 'error', undefined, { timeout: 10_000 });
  const errorUi = await page.evaluate((id) => ({
    failed: window.labIsland.getStreamingSnapshot().fullIslandDetailProgress.failedPackageIds.includes(id),
    chip: document.querySelector('#full-island-status-chip-label')?.textContent?.trim(),
    retryDisabled: document.querySelector('#full-island-retry')?.disabled,
    failures: document.querySelector('#full-island-failures')?.textContent?.trim(),
  }), failurePackageId);
  if (!errorUi.failed || errorUi.chip !== 'Error' || errorUi.retryDisabled || !errorUi.failures.includes(failurePackageId)) {
    failOrCollect(`Full-detail failure UI failed: ${JSON.stringify(errorUi, null, 2)}`);
  }
  if (await page.locator('#full-island-status-card').getAttribute('hidden') !== null) {
    await page.locator('#full-island-status-chip').click();
    await page.waitForFunction(() => document.querySelector('#full-island-status-card')?.hidden === false);
  }
  await page.locator('#full-island-retry').click();
  await waitForFullIslandReady();

  // A synthetic context lifecycle exercises preservation/recovery without
  // asking Chromium to discard the physical test context and its diagnostics.
  const selectedBeforeRecovery = await page.evaluate(() => JSON.parse(window.render_game_to_text()).selected?.id ?? null);
  await page.evaluate(() => {
    const canvas = window.labIsland.renderer.domElement;
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
  });
  await page.waitForFunction(() => window.labIsland.getGpuDetailCapabilities().recoveryPhase === 'lost');
  await page.evaluate(() => {
    window.labIsland.renderer.domElement.dispatchEvent(new Event('webglcontextrestored'));
  });
  await page.waitForFunction(() => window.labIsland.getGpuDetailCapabilities().recoveryPhase === 'ready', undefined, { timeout: 180_000 });
  const recovery = await page.evaluate(() => ({
    phase: window.labIsland.getGpuDetailCapabilities().recoveryPhase,
    selected: JSON.parse(window.render_game_to_text()).selected?.id ?? null,
    requested: window.labIsland.isFullIslandDetail(),
    ready: window.labIsland.getStreamingSnapshot().fullIslandDetailReady,
  }));
  if (recovery.phase !== 'ready'
    || recovery.selected !== selectedBeforeRecovery
    || !recovery.requested
    || !recovery.ready) {
    failOrCollect(`Context recovery preservation failed: ${JSON.stringify({ selectedBeforeRecovery, recovery }, null, 2)}`);
  }

  await page.locator('#full-island-return-streamed').click();
  await page.waitForFunction(() => {
    const streaming = window.labIsland.getStreamingSnapshot();
    return streaming.detailPolicy === 'streamed' && streaming.loadedPackageCount <= 8;
  });
  const streamed = await page.evaluate(() => ({
    snapshot: window.labIsland.getStreamingSnapshot(),
    checkbox: document.querySelector('#full-island-detail')?.checked,
    preference: JSON.parse(localStorage.getItem('youtopy_device_preferences') ?? '{}'),
  }));
  if (streamed.snapshot.detailPolicy !== 'streamed'
    || streamed.snapshot.loadedPackageCount > 8
    || streamed.checkbox
    || streamed.preference.fullIslandDetail !== false) {
    failOrCollect(`Return-to-streamed action failed: ${JSON.stringify(streamed, null, 2)}`);
  }

  if (errors.length) failOrCollect(`Browser errors:\n${errors.join('\n')}`);

  const report = {
    target: '1920x1080 Medium Full Island Detail; headless timing is diagnostic only',
    activationMs: Math.round(activationReadyMs),
    accessibility,
    lifecycle: {
      sampleCount: lifecycleSamples.length,
      phases: [...lifecyclePhases],
      maximumConcurrentActivation,
      queuedObserved,
      progressMonotonic,
      exactRepresentationThroughout,
      final: finalLifecycle,
    },
    definitions,
    microdetail,
    compactText: {
      largestBytes: compactText.largestBytes,
      largestPreparationMs: compactText.largestPreparationMs,
      p50Ms: percentile(compactText.samples, 0.5),
      p95Ms: compactP95Ms,
    },
    readyUi,
    atlasNavigation,
    performance: {
      drawCalls: stats.drawCalls,
      triangles: stats.triangles,
      textures: stats.textureCount,
      runtimeBatches: stats.streaming.gpuBatching.batchCount,
      activeAnimationNodes: stats.activeAnimationNodes,
      liveAuthoredSources: performanceAudit.liveAuthoredSources,
      frameTiming: stats.frameTiming,
      renderer: stats.renderer,
    },
    errorUi,
    recovery,
    streamed: {
      loadedPackages: streamed.snapshot.loadedPackageCount,
      detailPolicy: streamed.snapshot.detailPolicy,
      devicePreference: streamed.preference,
    },
    errors,
    diagnosticFailures,
  };
  await writeFile(`${OUTPUT}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (diagnosticFailures.length) {
    throw new Error(`Focused diagnostic completed with ${diagnosticFailures.length} acceptance failure(s). See ${OUTPUT}/report.json.`);
  }
} finally {
  await browser.close();
}
