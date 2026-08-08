import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.FULL_ISLAND_BUILDING_OUTPUT ?? 'output/full-island-building-audit';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(`${OUTPUT}/districts`, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(240_000);
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.setItem('youtopy_full_island_detail', 'true');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getStreamingSnapshot));
  await page.waitForSelector('#loading-screen', { state: 'hidden' });
  await page.waitForFunction(() => window.labIsland.getStreamingSnapshot().fullIslandDetailReady === true);
  await page.evaluate(() => window.labIsland.advanceTime(1_000));
  await page.waitForTimeout(300);

  const audit = await page.evaluate(() => {
    const world = window.labIsland;
    const snapshot = world.getStreamingSnapshot();
    const effectivelyVisible = (object) => {
      let cursor = object;
      while (cursor) {
        if (!cursor.visible) return false;
        cursor = cursor.parent;
      }
      return Boolean(object);
    };
    const runtimeBatches = new Map();
    const runtimeSourcesBySelectableId = new Map();
    world.scene.traverse((object) => {
      if (object.userData.gpuRuntimeBatch !== true || object.userData.gpuBatchMetadataAnchor === true) return;
      runtimeBatches.set(object.name, object);
      const sourceNames = object.userData.batchSourceNames ?? [];
      const selectableIds = object.userData.batchSelectableIds ?? [];
      const semanticIds = object.userData.batchSemanticIds ?? [];
      const importance = object.userData.batchRenderImportance ?? [];
      sourceNames.forEach((sourceName, index) => {
        const selectableId = String(selectableIds[index] ?? '');
        if (!selectableId) return;
        const entries = runtimeSourcesBySelectableId.get(selectableId) ?? [];
        entries.push({
          batchName: object.name,
          sourceName,
          selectableId,
          semanticId: String(semanticIds[index] ?? ''),
          importance: importance[index] ?? null,
        });
        runtimeSourcesBySelectableId.set(selectableId, entries);
      });
    });
    const districtReports = [];
    const allBuildingReports = [];

    for (const packageState of snapshot.packages.filter((entry) => entry.kind === 'district')) {
      const districtId = packageState.id;
      const definition = world.definitions.get(districtId);
      if (!definition) {
        districtReports.push({ districtId, missingDefinition: true, failures: ['missing district definition'] });
        continue;
      }
      const district = world.objectGroups.get(districtId);
      if (!district) {
        districtReports.push({ districtId, missingDistrictRoot: true, failures: ['missing district root'] });
        continue;
      }
      district.updateWorldMatrix(true, true);
      const population = district.userData.population ?? {};
      const expectedCount = Number(population.realizedFacilityCount ?? population.plannedFacilities?.length ?? 0);
      const rawCandidates = [];
      district.traverse((object) => {
        if (!object.isGroup || object === district) return;
        const metadataFacility = object.userData.exteriorProgram === true
          || object.userData.academicFacility === true
          || object.userData.authoredExteriorBuilding === true
          || typeof object.userData.facilityForm === 'string'
          || (typeof object.userData.semanticName === 'string'
            && (object.userData.featureRole === 'building' || object.userData.featureRole === 'lab'));
        if (metadataFacility) rawCandidates.push(object);
      });

      // The preserved legacy annex predates batched facility metadata. Add its
      // named root explicitly without treating process infrastructure as a lab.
      const hasAuthoredIndustrialLegacy = rawCandidates.some((object) => (
        object.userData.preservedExistingBuilding === true
        || object.name === 'INDUSTRIAL__LEGACY_AUTOMATIC_WORKS_ANNEX'
      ));
      if (districtId === 'industrial-labs' && !hasAuthoredIndustrialLegacy) {
        const legacyAnnex = district.getObjectByName('INDUSTRIAL__LEGACY_AUTOMATIC_WORKS_ANNEX');
        if (legacyAnnex?.isGroup) rawCandidates.push(legacyAnnex);
      }

      const buildings = rawCandidates.filter((candidate) => {
        if (candidate.name === 'INDUSTRIAL_NEW__DISTRICT_PRODUCTION_INFRASTRUCTURE') return false;
        let cursor = candidate.parent;
        while (cursor && cursor !== district) {
          if (rawCandidates.includes(cursor)) return false;
          cursor = cursor.parent;
        }
        return true;
      });

      const buildingReports = buildings.map((building) => {
        const authoredSources = [];
        const missingBatchRepresentations = [];
        let directVisibleMeshes = 0;
        let visibleBatchSources = 0;
        let mandatoryArchitecturalSources = 0;
        let representedMandatorySources = 0;
        const semanticOwnershipFailures = [];
        // Authored names are tokenized with underscores. Require a complete
        // architectural token so decorative BIOMARKER pulses cannot be
        // misclassified as an ARK merely because the letters overlap.
        const mandatoryNamePattern = /(?:^|[^A-Z0-9])(?:PRIMARY|MASS|ROOF|FACADE|FAÇADE|ENTRANCE|DOOR|HALL|TOWER|BUILDING|WAREHOUSE|PAVILION|SPIRE|CITADEL|INSTITUTE|FOUNDRY|OBSERVATORY|COMPLEX|VAULT|FORGE|BASTION|MONOLITH|CONSERVATORY|ARK)(?:$|[^A-Z0-9])/i;
        building.traverse((object) => {
          if (!object.isMesh || object.userData.gpuRuntimeBatch === true || object.userData.streamingProxy === true) return;
          let ancestor = object.parent;
          let authoredParentVisible = true;
          while (ancestor && ancestor !== building) {
            if (!ancestor.visible) { authoredParentVisible = false; break; }
            ancestor = ancestor.parent;
          }
          // Deliberately hidden interior, alternate-LOD, and cutaway branches
          // are not part of the exterior representation being audited.
          if (!authoredParentVisible) return;
          const mandatory = mandatoryNamePattern.test(object.name);
          if (mandatory) mandatoryArchitecturalSources += 1;
          if (object.userData.gpuBatchSource === true) {
            authoredSources.push(object.name);
            const batch = runtimeBatches.get(object.userData.batchedInto);
            const represented = Boolean(batch && effectivelyVisible(batch)
              && batch.userData.batchSourceNames?.includes(object.name));
            if (represented) {
              visibleBatchSources += 1;
              if (mandatory) representedMandatorySources += 1;
            } else {
              missingBatchRepresentations.push({ source: object.name, batch: object.userData.batchedInto ?? null });
            }
            return;
          }
          if (effectivelyVisible(object)) {
            directVisibleMeshes += 1;
            if (mandatory) representedMandatorySources += 1;
          }
        });
        const metadataAnchor = building.children.find((object) => object.userData.gpuBatchMetadataAnchor === true);
        const manifestSourceNames = metadataAnchor?.userData.batchSourceNames ?? [];
        const manifestBatchNames = metadataAnchor?.userData.batchNames ?? [];
        const manifestSelectableIds = metadataAnchor?.userData.batchSelectableIds ?? [];
        const manifestSemanticIds = metadataAnchor?.userData.batchSemanticIds ?? [];
        const manifestImportance = metadataAnchor?.userData.batchRenderImportance ?? [];
        const ownerSelectableId = String(building.userData.individualSelectableId ?? building.userData.selectableId ?? '');
        const expectedRuntimeSources = runtimeSourcesBySelectableId.get(ownerSelectableId) ?? [];
        const manifestLengths = [
          manifestSourceNames.length,
          manifestBatchNames.length,
          manifestSelectableIds.length,
          manifestSemanticIds.length,
          manifestImportance.length,
        ];
        const manifestLengthMismatch = manifestLengths.some((length) => length !== manifestSourceNames.length);
        if (!manifestLengthMismatch) {
          manifestSourceNames.forEach((sourceName, index) => {
            const batchName = manifestBatchNames[index];
            const selectableId = String(manifestSelectableIds[index] ?? '');
            const semanticId = String(manifestSemanticIds[index] ?? '');
            const importance = manifestImportance[index];
            authoredSources.push(sourceName);
            const mandatory = mandatoryNamePattern.test(sourceName);
            if (mandatory) mandatoryArchitecturalSources += 1;
            if (!ownerSelectableId || selectableId !== ownerSelectableId) {
              semanticOwnershipFailures.push({ source: sourceName, expected: ownerSelectableId, actual: selectableId });
            }
            const batch = runtimeBatches.get(batchName);
            const represented = Boolean(batch && effectivelyVisible(batch) && (() => {
              const names = batch.userData.batchSourceNames ?? [];
              const selectableIds = batch.userData.batchSelectableIds ?? [];
              const semanticIds = batch.userData.batchSemanticIds ?? [];
              return names.some((name, batchIndex) => name === sourceName
                && String(selectableIds[batchIndex] ?? '') === selectableId
                && String(semanticIds[batchIndex] ?? '') === semanticId);
            })());
            if (represented) {
              visibleBatchSources += 1;
              if (mandatory && importance === 'mandatory') representedMandatorySources += 1;
            } else {
              missingBatchRepresentations.push({ source: sourceName, batch: batchName || null });
            }
          });
        }
        const authoredBounds = building.userData.authoredLocalBounds;
        const bounds = authoredBounds?.isBox3 === true
          ? authoredBounds.clone()
          : new world.selectionBounds.constructor().setFromObject(building, true);
        const size = bounds.getSize(world.camera.position.clone());
        const representedSourceCount = directVisibleMeshes + visibleBatchSources;
        const failures = [];
        if (!effectivelyVisible(building)) failures.push('building root hidden');
        if (representedSourceCount === 0) failures.push('no visible architectural representation');
        if (manifestLengthMismatch) failures.push(`invalid GPU representation manifest lengths ${manifestLengths.join('/')}`);
        if (manifestSourceNames.length !== expectedRuntimeSources.length) {
          failures.push(`building manifest covers ${manifestSourceNames.length}/${expectedRuntimeSources.length} runtime batch sources`);
        }
        if (missingBatchRepresentations.length) failures.push(`${missingBatchRepresentations.length} batched sources not visible`);
        if (semanticOwnershipFailures.length) failures.push(`${semanticOwnershipFailures.length} batched sources have incorrect building ownership`);
        if (mandatoryArchitecturalSources > 0 && representedMandatorySources === 0) failures.push('mandatory architecture not represented');
        if (![size.x, size.y, size.z].every(Number.isFinite) || size.x <= 0 || size.y <= 0 || size.z <= 0) failures.push('invalid authored bounds');
        const report = {
          districtId,
          name: building.userData.semanticName
            ?? building.userData.displayName
            ?? building.userData.buildingName
            ?? building.name,
          rootName: building.name,
          code: building.userData.buildingCode ?? building.userData.academicRecordId ?? null,
          representedSourceCount,
          directVisibleMeshes,
          visibleBatchSources,
          authoredBatchedSources: authoredSources.length,
          expectedRuntimeBatchSources: expectedRuntimeSources.length,
          mandatoryArchitecturalSources,
          representedMandatorySources,
          missingBatchRepresentations,
          semanticOwnershipFailures,
          bounds: [size.x, size.y, size.z].map((value) => Number(value.toFixed(3))),
          failures,
        };
        allBuildingReports.push(report);
        return report;
      });

      const failures = [];
      if (!packageState?.detailResident || packageState.visualLevel !== 'detail') failures.push('district package is not Detail-resident');
      if (packageState?.proxyVisible || packageState?.midVisible || packageState?.farVisible) failures.push('HLOD proxy visible beside Detail');
      if (expectedCount > 0 && buildings.length < expectedCount) failures.push(`discovered ${buildings.length}/${expectedCount} expected buildings`);
      if (buildingReports.some((building) => building.failures.length)) failures.push('one or more buildings lack a complete visible representation');
      districtReports.push({
        districtId,
        name: definition.name,
        expectedCount,
        discoveredCount: buildings.length,
        packageState,
        buildingReports,
        failures,
      });
    }

    return {
      streaming: snapshot,
      districtCount: districtReports.length,
      buildingCount: allBuildingReports.length,
      districtReports,
      failures: districtReports.filter((district) => district.failures.length),
      buildingFailures: allBuildingReports.filter((building) => building.failures.length),
      consoleErrors: [],
    };
  });

  await page.evaluate(() => {
    const world = window.labIsland;
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    world.camera.fov = 48;
    document.querySelectorAll('.atlas, .scene-card, .layerbar, .topbar, .compass, .interaction-hint').forEach((element) => {
      element.setAttribute('style', 'display:none');
    });
  });

  for (let index = 0; index < audit.districtReports.length; index += 1) {
    const district = audit.districtReports[index];
    await page.evaluate((districtId) => {
      const world = window.labIsland;
      const root = world.objectGroups.get(districtId);
      root.updateWorldMatrix(true, true);
      const bounds = new world.selectionBounds.constructor().setFromObject(root, true);
      const center = bounds.getCenter(world.controls.target.clone());
      const size = bounds.getSize(world.camera.position.clone());
      const radial = center.clone().setY(0);
      if (radial.lengthSq() < 0.001) radial.set(0, 0, 1);
      radial.normalize();
      const tangent = radial.clone().cross(world.camera.up).normalize();
      const span = Math.max(size.x, size.z, 16);
      world.camera.position.copy(center)
        .addScaledVector(radial, span * 0.72)
        .addScaledVector(tangent, span * 0.18);
      world.camera.position.y = center.y + Math.max(size.y * 1.15, span * 0.55, 10);
      world.controls.target.copy(center).setY(center.y + size.y * 0.2);
      world.camera.lookAt(world.controls.target);
      world.camera.updateProjectionMatrix();
      world.camera.updateMatrixWorld(true);
      world.controls.update();
      world.advanceTime(180);
    }, district.districtId);
    await page.waitForTimeout(90);
    const number = String(index + 1).padStart(2, '0');
    await page.screenshot({ path: `${OUTPUT}/districts/${number}-${district.districtId}.png` });
  }

  audit.consoleErrors = errors;
  await writeFile(`${OUTPUT}/report.json`, `${JSON.stringify(audit, null, 2)}\n`);
  if (audit.districtCount !== 35
    || audit.failures.length
    || audit.buildingFailures.length
    || errors.length) {
    throw new Error(`Full-island per-building audit failed: ${JSON.stringify({
      districtCount: audit.districtCount,
      buildingCount: audit.buildingCount,
      failures: audit.failures,
      buildingFailures: audit.buildingFailures,
      errors,
    }, null, 2)}`);
  }
  console.log(JSON.stringify({
    districts: audit.districtCount,
    buildings: audit.buildingCount,
    perDistrict: audit.districtReports.map((district) => ({
      id: district.districtId,
      expected: district.expectedCount,
      rendered: district.discoveredCount,
    })),
    failures: 0,
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
