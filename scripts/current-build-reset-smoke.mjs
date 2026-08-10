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
    world.setCorporateCorePlazaLightStrength(1.45);
    return {
      canonical,
      moved: world.getObjectState(id),
      plazaLightStrength: world.getCorporateCorePlazaLightStrength(),
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
    plazaLightStrength: window.labIsland.getCorporateCorePlazaLightStrength(),
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
    const mountedCorePackages = [
      'synthetic-quantum-biosystems',
      'dark-center-lab-megabuilding',
      'corporate-core',
    ].map((packageId) => world.worldStreaming.mountPackageAuthoritySources(packageId)).filter(Boolean);
    const restoreGlobalEnvironment = world.globalEnvironmentBatching?.mountSources();
    if (restoreGlobalEnvironment) mountedCorePackages.push(restoreGlobalEnvironment);
    const synthetic = world.objectGroups.get('synthetic-quantum-biosystems');
    const central = world.objectGroups.get('dark-center-lab-megabuilding');
    const corporate = world.objectGroups.get('corporate-core');
    const coreAudit = {
      syntheticMeshes: 0,
      syntheticLegacyRoads: 0,
      centralLegacyFacilities: 0,
      centralLegacyRoads: 0,
      legacyPlazaPavilions: 0,
      centralLightPlatforms: 0,
      groundedLightPlatformBases: 0,
      groundedLightPlatformTables: 0,
      groundedLightPlatformChairGroups: 0,
      groundedLightPlatformChairParts: 0,
      groundedLightPlatformFurnitureObstacles: 0,
      groundedLightPlatformStructuralObstacles: 0,
      groundedLightPlatformSubtleEmissives: 0,
      groundedLightPlatformSubtlePointLights: 0,
      groundedLightPlatformCanopyPanels: 0,
      groundedLightPlatformEmitterRails: 0,
      groundedLightPlatformLightCurrents: 0,
      groundedLightPlatformDotFields: 0,
      groundedLightPlatformHolographicDots: 0,
      groundedLightPlatformLegacyOverheadElements: 0,
      skybridgeSegments: 0,
      covenantDeadEndPassages: 0,
      patentAuctionPrimaryMasses: 0,
      patentAuctionMaterialCount: 0,
      patentAuctionGroupCount: 0,
      patentAuctionElementCount: 0,
      patentAuctionDrawnElementCount: 0,
      corporateNightLightObjects: 0,
      corporateNightLightPointLights: 0,
      corporateNightLightSpotLights: 0,
      corporatePlazaStadiumLightRigs: 0,
      corporateNightLightEmissiveMeshes: 0,
      corporateNightLightBlockingObjects: 0,
      corporateGradedRoadConnectors: 0,
      transparentGreyGlassMeshes: 0,
    };
    synthetic?.traverse((object) => {
      if (object.isMesh) coreAudit.syntheticMeshes += 1;
      if (object.userData.localCampusRoad === true || object.userData.generatedDistrictRoadNetwork === true) coreAudit.syntheticLegacyRoads += 1;
    });
    central?.traverse((object) => {
      if (object.name.includes('__FACILITY__')) coreAudit.centralLegacyFacilities += 1;
      if (object.userData.localCampusRoad === true || object.userData.generatedDistrictRoadNetwork === true) coreAudit.centralLegacyRoads += 1;
    });
    corporate?.traverse((object) => {
      if (object.userData.corporatePlazaStadiumLightRig === true) coreAudit.corporatePlazaStadiumLightRigs += 1;
      if (object.name.endsWith('__GRADED_CONNECTOR')) coreAudit.corporateGradedRoadConnectors += 1;
      if (object.userData.sealedSkybridgeSegment === true) coreAudit.skybridgeSegments += 1;
      if (object.name === 'CORPORATE__C07__SEALED_MEGABUILDING_PASSAGE') coreAudit.covenantDeadEndPassages += 1;
      if (object.userData.corporateNightLight === true) {
        coreAudit.corporateNightLightObjects += 1;
        if (object.isPointLight === true) coreAudit.corporateNightLightPointLights += 1;
        if (object.isSpotLight === true && object.userData.corporatePlazaStadiumLight === true) coreAudit.corporateNightLightSpotLights += 1;
        if (object.userData.navObstacle !== false) coreAudit.corporateNightLightBlockingObjects += 1;
      }
      if (!object.isMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (object.userData.corporateNightLight === true && materials.some((material) => (
        Number(material?.emissiveIntensity ?? 0) > 0 && Number(material?.emissive?.getHex?.() ?? 0) !== 0
      ))) {
        coreAudit.corporateNightLightEmissiveMeshes += 1;
      }
      if (object.name === 'CORPORATE__C10__FACETED_AUCTION_POLYHEDRON') {
        coreAudit.patentAuctionPrimaryMasses += 1;
        coreAudit.patentAuctionMaterialCount = materials.length;
        coreAudit.patentAuctionGroupCount = object.geometry.groups.length;
        coreAudit.patentAuctionElementCount = object.geometry.index?.count ?? object.geometry.getAttribute('position')?.count ?? 0;
        coreAudit.patentAuctionDrawnElementCount = object.geometry.groups.reduce((sum, group) => sum + group.count, 0);
      }
      if (materials.some((material) => material?.name === 'Corporate transparent grey sealed skybridge glass'
        && material.transparent === true && material.opacity < 0.6)) coreAudit.transparentGreyGlassMeshes += 1;
    });
    world.scene.traverse((object) => {
      if (object.name.startsWith('Corporate plaza laboratory pavilion')) coreAudit.legacyPlazaPavilions += 1;
      if (object.userData.centralLightPlatform === true) coreAudit.centralLightPlatforms += 1;
      if (object.userData.centralLightPlatformGroundBase === true
        && object.userData.walkable === true
        && object.userData.preventUnderwalk === true) coreAudit.groundedLightPlatformBases += 1;
      if (object.userData.centralLightPlatformTable === true) coreAudit.groundedLightPlatformTables += 1;
      if (object.userData.centralLightPlatformChair === true) coreAudit.groundedLightPlatformChairGroups += 1;
      if (object.userData.centralLightPlatformChairPart === true) coreAudit.groundedLightPlatformChairParts += 1;
      if ((object.userData.centralLightPlatformTable === true || object.userData.centralLightPlatformChairPart === true)
        && object.userData.navObstacle === true) coreAudit.groundedLightPlatformFurnitureObstacles += 1;
      if (object.userData.centralLightPlatformCanopySupport === true
        && object.userData.navObstacle === true) coreAudit.groundedLightPlatformStructuralObstacles += 1;
      if (object.userData.centralLightPlatformSubtleEmissive === true) coreAudit.groundedLightPlatformSubtleEmissives += 1;
      if (object.userData.centralLightPlatformSubtleLight === true && object.intensity <= 0.25) coreAudit.groundedLightPlatformSubtlePointLights += 1;
      if (object.userData.centralLightPlatformCanopyPanel === true) coreAudit.groundedLightPlatformCanopyPanels += 1;
      if (object.userData.centralLightPlatformEmitterRail === true) coreAudit.groundedLightPlatformEmitterRails += 1;
      if (object.userData.centralLightPlatformLightCurrent === true) coreAudit.groundedLightPlatformLightCurrents += 1;
      if (object.userData.centralLightPlatformHolographicDots === true) {
        coreAudit.groundedLightPlatformDotFields += 1;
        coreAudit.groundedLightPlatformHolographicDots += Number(object.userData.holographicDotCount ?? 0);
      }
      if (object.name.startsWith('Corporate plaza light platform')
        && / canopy$| support \d+$| holographic light$/.test(object.name)) coreAudit.groundedLightPlatformLegacyOverheadElements += 1;
    });
    coreAudit.syntheticRoadRouteCount = synthetic?.userData.districtRoadNetwork?.routes?.length ?? -1;
    coreAudit.centralRoadRouteCount = central?.userData.districtRoadNetwork?.routes?.length ?? -1;
    coreAudit.corporateRoadConnectorCount = corporate?.userData.districtRoadNetwork?.connectorCount ?? -1;
    coreAudit.corporateRoadRingConnectorCount = corporate?.userData.districtRoadNetwork?.ringConnectorCount ?? -1;
    coreAudit.corporatePlazaLightStrength = world.getCorporateCorePlazaLightStrength();
    coreAudit.skybridgeMetadata = corporate?.userData.corporateCoreDistrict?.skybridges ?? null;
    mountedCorePackages.reverse().forEach((restore) => restore());
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
        manualPlazaLightStrength: manualProject?.payload?.editor?.corporateCorePlazaLightStrength ?? null,
      },
      button: {
        present: Boolean(button),
        label: button?.textContent?.replace(/\s+/g, ' ').trim(),
        title: button?.getAttribute('title'),
      },
      coreAudit,
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
    plazaLightStrength: window.labIsland.getCorporateCorePlazaLightStrength(),
    localMirrorPresent: localStorage.getItem('youtopy_saved_project') !== null,
  }), hallId);

  const near = (a, b, tolerance = 0.001) => Math.abs(a - b) <= tolerance;
  if (!near(staleLoad.state.position.x, seeded.saved.position.x)
    || !near(staleLoad.state.position.z, seeded.saved.position.z)
    || !near(staleLoad.plazaLightStrength, seeded.plazaLightStrength)) {
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
    || !near(restored.stores.manualHallState.position.z, seeded.saved.position.z)
    || !near(restored.stores.manualPlazaLightStrength, seeded.plazaLightStrength)) {
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
  if (restored.coreAudit.syntheticMeshes !== 0
    || restored.coreAudit.syntheticLegacyRoads !== 0
    || restored.coreAudit.centralLegacyFacilities !== 0
    || restored.coreAudit.centralLegacyRoads !== 0
    || restored.coreAudit.syntheticRoadRouteCount !== 0
    || restored.coreAudit.centralRoadRouteCount !== 0
    || restored.coreAudit.legacyPlazaPavilions !== 0
    || restored.coreAudit.centralLightPlatforms !== 6
    || restored.coreAudit.groundedLightPlatformBases !== 6
    || restored.coreAudit.groundedLightPlatformTables !== 12
    || restored.coreAudit.groundedLightPlatformChairGroups !== 24
    || restored.coreAudit.groundedLightPlatformChairParts !== 72
    || restored.coreAudit.groundedLightPlatformFurnitureObstacles !== 84
    || restored.coreAudit.groundedLightPlatformStructuralObstacles !== 18
    || restored.coreAudit.groundedLightPlatformSubtleEmissives !== 12
    || restored.coreAudit.groundedLightPlatformSubtlePointLights !== 0
    || restored.coreAudit.groundedLightPlatformCanopyPanels !== 18
    || restored.coreAudit.groundedLightPlatformEmitterRails !== 18
    || restored.coreAudit.groundedLightPlatformLightCurrents !== 36
    || restored.coreAudit.groundedLightPlatformDotFields !== 6
    || restored.coreAudit.groundedLightPlatformHolographicDots !== 168
    || restored.coreAudit.groundedLightPlatformLegacyOverheadElements !== 0
    || restored.coreAudit.skybridgeSegments !== 0
    || restored.coreAudit.covenantDeadEndPassages !== 0
    || restored.coreAudit.patentAuctionPrimaryMasses !== 1
    || restored.coreAudit.patentAuctionMaterialCount !== 3
    || restored.coreAudit.patentAuctionGroupCount !== 20
    || restored.coreAudit.patentAuctionDrawnElementCount !== restored.coreAudit.patentAuctionElementCount
    || restored.coreAudit.corporateNightLightObjects !== 576
    || restored.coreAudit.corporateNightLightPointLights !== 16
    || restored.coreAudit.corporateNightLightSpotLights !== 20
    || restored.coreAudit.corporatePlazaStadiumLightRigs !== 20
    || restored.coreAudit.corporateNightLightEmissiveMeshes !== 340
    || restored.coreAudit.corporateNightLightBlockingObjects !== 0
    || Math.abs(restored.coreAudit.corporatePlazaLightStrength - 1) > 0.0001
    || restored.coreAudit.corporateGradedRoadConnectors !== 0
    || restored.coreAudit.corporateRoadConnectorCount !== 0
    || restored.coreAudit.corporateRoadRingConnectorCount !== 0
    || restored.coreAudit.transparentGreyGlassMeshes !== 0
    || restored.coreAudit.skybridgeMetadata != null) {
    throw new Error(`Current Build retained legacy core placeholders/roads, lost the light platforms, or retained skybridges: ${JSON.stringify(restored.coreAudit)}`);
  }
  if (!near(manualReload.state.position.x, seeded.saved.position.x)
    || !near(manualReload.state.position.z, seeded.saved.position.z)
    || !near(manualReload.plazaLightStrength, seeded.plazaLightStrength)
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
