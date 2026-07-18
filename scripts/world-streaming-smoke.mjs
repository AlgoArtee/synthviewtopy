import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.STREAMING_OUTPUT ?? 'output/world-streaming';
const BUILDING_ID = 'academic-building-ashcroft-grand-library';
const ROOT_NAME = 'CEREBRUM_LIBRARY__PROCEDURAL_INTERIOR';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH
    ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.addInitScript(() => localStorage.removeItem('youtopy_saved_project'));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction((id) => Boolean(window.labIsland?.getDefinition(id)), BUILDING_ID);
  await page.waitForTimeout(1_200);
  await page.evaluate(() => window.labIsland.advanceTime(50));

  const overview = await page.evaluate(({ buildingId, rootName }) => {
    const world = window.labIsland;
    const state = world.getTextSnapshot();
    const manifest = world.createUnrealBootstrapManifest();
    const libraryEntity = manifest.entities.find((entity) => entity.id === buildingId);
    return {
      streaming: state.streaming,
      manifest: {
        schema: manifest.schema,
        productionAuthority: manifest.productionAuthority,
        sourceAuthority: manifest.sourceAuthority,
        importPolicy: manifest.importPolicy,
        packageCount: manifest.packages.length,
        entityCount: manifest.entities.length,
        dynamicEntityCount: manifest.entities.filter((entity) => entity.entityType === 'editor' || entity.entityType === 'imported').length,
        libraryDataLayers: libraryEntity?.streaming.dataLayers,
        libraryLevelInstance: libraryEntity?.streaming.levelInstance,
        libraryStableActorName: libraryEntity?.asset.stableActorName,
        libraryTransformLength: libraryEntity?.transform.unrealMatrixRowMajorCentimetres.length,
      },
      libraryMounted: Boolean(world.objectGroups.get(buildingId)?.getObjectByName(rootName)),
      renderer: { ...world.getSceneStatistics() },
      memory: { ...world.renderer.info.memory },
    };
  }, { buildingId: BUILDING_ID, rootName: ROOT_NAME });
  if (overview.libraryMounted
    || overview.streaming.totalPackages !== 41
    || overview.streaming.residentDetailPackages.length !== 0
    || overview.streaming.proxyPackageCount !== 41
    || overview.streaming.authority !== 'web-sandbox'
    || overview.renderer.drawCalls > 1_500
    || overview.manifest.schema !== 'youtopy.unreal-world/1.0'
    || overview.manifest.productionAuthority !== 'unreal-editor'
    || overview.manifest.sourceAuthority !== 'web-sandbox'
    || overview.manifest.importPolicy !== 'bootstrap-only-no-roundtrip'
    || overview.manifest.packageCount !== 41
    || overview.manifest.dynamicEntityCount !== 0
    || overview.manifest.libraryDataLayers?.length !== 6
    || overview.manifest.libraryLevelInstance !== 'LI_CerebrumExternum'
    || overview.manifest.libraryStableActorName !== 'YT_academic_building_ashcroft_grand_library'
    || overview.manifest.libraryTransformLength !== 16) {
    throw new Error(`Cold overview streaming audit failed: ${JSON.stringify(overview, null, 2)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/streamed-overview.png`, fullPage: true });

  const mount = await page.evaluate(({ buildingId, rootName }) => {
    const world = window.labIsland;
    world.select(buildingId, 'system');
    if (!world.focusCerebrumLibrary()) throw new Error('Explicit library load failed');
    world.advanceTime(100);
    const root = world.objectGroups.get(buildingId)?.getObjectByName(rootName);
    const before = world.getCerebrumLibraryState()?.lamps['reading-lamp-1'];
    const interaction = world.performCerebrumLibraryInteraction('reading-lamp-1');
    const after = world.getCerebrumLibraryState()?.lamps['reading-lamp-1'];
    world.advanceTime(20);
    return {
      rootMounted: Boolean(root),
      before,
      after,
      interactionHandled: interaction.handled,
      streaming: world.getStreamingSnapshot(),
      renderer: { ...world.getSceneStatistics() },
      memory: { ...world.renderer.info.memory },
    };
  }, { buildingId: BUILDING_ID, rootName: ROOT_NAME });
  if (!mount.rootMounted
    || !mount.interactionHandled
    || mount.before === mount.after
    || mount.streaming.cerebrumExternum.phase !== 'active'
    || mount.streaming.residentDetailPackages.length !== 1
    || !mount.streaming.residentDetailPackages.includes('academic-libraries-theoretical-labs')
    || mount.renderer.drawCalls > 800) {
    const renderBreakdown = await page.evaluate(({ buildingId, rootName }) => {
      const world = window.labIsland;
      const host = world.objectGroups.get(buildingId);
      const root = host?.getObjectByName(rootName);
      const vista = world.worldStreaming?.vistaRoot;
      if (!host || !root || !vista) return null;
      const renderCalls = () => {
        world.advanceTime(20);
        return world.renderer.info.render.calls;
      };
      const current = renderCalls();
      const vistaVisible = vista.visible;
      vista.visible = false;
      const withoutVista = renderCalls();
      const hostChildren = host.children.map((child) => [child, child.visible]);
      host.children.forEach((child) => { child.visible = child === root; });
      const rootOnly = renderCalls();
      const high = root.getObjectByName('CEREBRUM__HIGH_DETAIL');
      const medium = root.getObjectByName('CEREBRUM__MEDIUM_DETAIL');
      const highVisible = high?.visible;
      const mediumVisible = medium?.visible;
      if (high) high.visible = false;
      const withoutHigh = renderCalls();
      if (medium) medium.visible = false;
      const withoutHighOrMedium = renderCalls();
      if (high && highVisible !== undefined) high.visible = highVisible;
      if (medium && mediumVisible !== undefined) medium.visible = mediumVisible;
      hostChildren.forEach(([child, visible]) => { child.visible = visible; });
      vista.visible = vistaVisible;
      renderCalls();
      return { current, withoutVista, rootOnly, withoutHigh, withoutHighOrMedium, hostChildCount: host.children.length };
    }, { buildingId: BUILDING_ID, rootName: ROOT_NAME });
    throw new Error(`Mounted interior audit failed: ${JSON.stringify({
      rootMounted: mount.rootMounted,
      interactionHandled: mount.interactionHandled,
      stateChanged: mount.before !== mount.after,
      residentDetailPackages: mount.streaming.residentDetailPackages,
      drawCalls: mount.renderer.drawCalls,
      triangles: mount.renderer.triangles,
      visibleMeshes: mount.renderer.visibleMeshes,
      shadowMapEnabled: await page.evaluate(() => window.labIsland.renderer.shadowMap.enabled),
      renderBreakdown,
    }, null, 2)}`);
  }
  await page.waitForTimeout(850);
  await page.screenshot({ path: `${OUTPUT}/streamed-cerebrum-orbit.png`, fullPage: true });

  const unloaded = await page.evaluate(({ buildingId, rootName }) => {
    const world = window.labIsland;
    world.setMode('explore');
    world.camera.position.set(1170, 915, 1260);
    world.controls.target.set(0, 2, -54);
    world.camera.updateMatrixWorld(true);
    world.advanceTime(16_200);
    world.advanceTime(50);
    return {
      rootMounted: Boolean(world.objectGroups.get(buildingId)?.getObjectByName(rootName)),
      cachedLampState: world.getCerebrumLibraryState()?.lamps['reading-lamp-1'],
      streaming: world.getStreamingSnapshot(),
      renderer: { ...world.getSceneStatistics() },
      memory: { ...world.renderer.info.memory },
    };
  }, { buildingId: BUILDING_ID, rootName: ROOT_NAME });
  if (unloaded.rootMounted
    || unloaded.streaming.cerebrumExternum.phase !== 'unloaded'
    || unloaded.streaming.cerebrumExternum.unloadCount < 1
    || unloaded.cachedLampState !== mount.after
    || unloaded.memory.geometries >= mount.memory.geometries
    || unloaded.renderer.drawCalls > 1_500) {
    throw new Error(`Interior unload/state-cache audit failed: ${JSON.stringify(unloaded, null, 2)}`);
  }

  const remounted = await page.evaluate(({ buildingId, rootName }) => {
    const world = window.labIsland;
    if (!world.focusCerebrumLibrary()) throw new Error('Library remount failed');
    world.advanceTime(80);
    return {
      rootMounted: Boolean(world.objectGroups.get(buildingId)?.getObjectByName(rootName)),
      restoredLampState: world.getCerebrumLibraryState()?.lamps['reading-lamp-1'],
      streaming: world.getStreamingSnapshot(),
    };
  }, { buildingId: BUILDING_ID, rootName: ROOT_NAME });
  if (!remounted.rootMounted || remounted.restoredLampState !== mount.after) {
    throw new Error(`Interior remount persistence audit failed: ${JSON.stringify(remounted, null, 2)}`);
  }

  const report = { overview, mount, unloaded, remounted, errors };
  await writeFile(`${OUTPUT}/report.json`, JSON.stringify(report, null, 2));
  if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);
  console.log(JSON.stringify({
    overview: {
      drawCalls: overview.renderer.drawCalls,
      triangles: overview.renderer.triangles,
      visibleMeshes: overview.renderer.visibleMeshes,
    },
    mountedInterior: {
      drawCalls: mount.renderer.drawCalls,
      triangles: mount.renderer.triangles,
      residentDetailPackages: mount.streaming.residentDetailPackages,
      geometries: mount.memory.geometries,
    },
    unloadedInterior: {
      drawCalls: unloaded.renderer.drawCalls,
      triangles: unloaded.renderer.triangles,
      geometries: unloaded.memory.geometries,
      unloadCount: unloaded.streaming.cerebrumExternum.unloadCount,
    },
    remountedStatePreserved: remounted.restoredLampState === mount.after,
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
