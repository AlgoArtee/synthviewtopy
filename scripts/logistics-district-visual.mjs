import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.LOGISTICS_DISTRICT_OUTPUT ?? 'output/logistics-district';
const DIAGNOSTIC_ONLY = process.env.LOGISTICS_DIAGNOSTIC_ONLY === '1';
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
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

async function captureOverview(kind, path) {
  const state = await page.evaluate((viewKind) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__logistics');
    const runway = world.scene.getObjectByName('LOGISTICS__AIRFIELD__NORTHFIELD_SHORT_RUNWAY');
    if (!district || !runway) throw new Error('Logistics overview targets are missing');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    district.updateMatrixWorld(true);
    runway.updateMatrixWorld(true);
    const Vector3 = world.camera.position.constructor;
    const Box3 = world.selectionBounds.constructor;
    if (viewKind === 'airfield') {
      const target = runway.localToWorld(new Vector3(0, 0, 10));
      const camera = runway.localToWorld(new Vector3(3, 56, 78));
      world.camera.position.copy(camera);
      world.controls.target.copy(target);
    } else {
      const bounds = new Box3().setFromObject(district, true);
      const center = bounds.getCenter(new Vector3());
      const size = bounds.getSize(new Vector3());
      world.camera.position.set(center.x + size.x * 0.08, center.y + 142, center.z + size.z * 0.1);
      world.controls.target.copy(center);
    }
    world.camera.lookAt(world.controls.target);
    world.controls.update();
    world.advanceTime(360);
    world.renderer.render(world.scene, world.camera);
    return {
      viewKind,
      mode: world.mode,
      airfield: runway.userData.airfieldSpecification,
    };
  }, kind);
  await page.waitForTimeout(250);
  await page.screenshot({ path });
  return state;
}

async function walkThroughLogisticsDoor(code, entryIndex, screenshotPath = null) {
  const setup = await page.evaluate(({ code: buildingCode, entryIndex: targetEntryIndex }) => {
    const world = window.labIsland;
    const facility = world.objectGroups.get(`entry-logistics-building-${buildingCode.toLowerCase()}`);
    const district = world.objectGroups.get('logistics');
    if (!facility || !district) throw new Error(`Missing ${buildingCode} logistics WALK target`);
    const entry = facility.userData.walkAccess.entries[targetEntryIndex];
    if (!entry) throw new Error(`Missing ${buildingCode} entrance ${targetEntryIndex}`);

    world.setMode('explore');
    world.advanceTime(48);
    world.setMode('walk');
    world.setWalkSpeedKilometresPerHour(120);
    world.walkController.refreshNavigation();
    const Vector3 = world.camera.position.constructor;
    const thresholdWorld = district.localToWorld(new Vector3().fromArray(entry.threshold));
    const thresholdLocal = facility.worldToLocal(thresholdWorld.clone());
    const inward = entry.side === 'front'
      ? new Vector3(0, 0, -1)
      : entry.side === 'rear'
        ? new Vector3(0, 0, 1)
        : entry.side === 'west'
          ? new Vector3(1, 0, 0)
          : new Vector3(-1, 0, 0);
    const targetLocal = thresholdLocal.clone().addScaledVector(inward, 2.0);
    const startLocal = thresholdLocal.clone().addScaledVector(inward, -1.2);
    const startWorld = facility.localToWorld(startLocal.clone());
    const targetWorld = facility.localToWorld(targetLocal.clone());
    const ground = world.walkController.sampleGround(startWorld.x, startWorld.z, { spawnSearch: true });
    if (ground === null) throw new Error(`${buildingCode} ${entry.id} route start has no ground`);
    world.camera.position.set(startWorld.x, ground + 0.162, startWorld.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(targetWorld.x, ground + 0.162, targetWorld.z);
    world.advanceTime(160);
    const distance = Math.hypot(targetWorld.x - startWorld.x, targetWorld.z - startWorld.z);
    return {
      code: buildingCode,
      entryIndex: targetEntryIndex,
      entry,
      startLocal: facility.worldToLocal(world.camera.position.clone()).toArray(),
      targetLocal: targetLocal.toArray(),
      durationMilliseconds: Math.min(5_000, Math.max(900, (distance / (120 / 36) + 0.24) * 1_000)),
      expectedRoomId: facility.userData.logisticsInteriorRoomId,
    };
  }, { code, entryIndex });

  await page.keyboard.down('w');
  await page.evaluate((duration) => window.labIsland.advanceTime(duration), setup.durationMilliseconds);
  await page.keyboard.up('w');
  const result = await page.evaluate((initial) => {
    const world = window.labIsland;
    const facility = world.objectGroups.get(`entry-logistics-building-${initial.code.toLowerCase()}`);
    world.advanceTime(80);
    world.walkController.sampleGround(
      world.camera.position.x,
      world.camera.position.z,
      { trackSurface: true },
    );
    world.renderer.render(world.scene, world.camera);
    const runtimeInterior = facility.getObjectByName(`LOGISTICS__${initial.code}__AUTHORED_WALK_INTERIOR`);
    const result = {
      ...initial,
      endLocal: facility.worldToLocal(world.camera.position.clone()).toArray(),
      walk: world.walkController.getSnapshot(),
      interiorVisible: runtimeInterior?.visible === true,
    };
    world.setWalkSpeedKilometresPerHour(6.5);
    return result;
  }, setup);
  await page.waitForTimeout(100);
  if (screenshotPath) await page.screenshot({ path: screenshotPath });
  return result;
}

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.evaluate(() => {
    document.querySelectorAll(
      '.atlas, .topbar, #inspector-panel, #edit-workspace, #scene-card, .layerbar, .compass, .interaction-hint, .walk-hud',
    ).forEach((element) => {
      element.setAttribute('style', 'display:none');
    });
    window.labIsland.advanceTime(240);
  });

  const networkOverview = await captureOverview(
    'network',
    `${OUTPUT}/logistics-uniform-road-network.png`,
  );
  const airfieldOverview = await captureOverview(
    'airfield',
    `${OUTPUT}/northfield-realistic-airfield.png`,
  );

  const accessResults = [];
  for (const code of DIAGNOSTIC_ONLY ? [] : ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7']) {
    const entranceCount = code === 'L1' ? 2 : 3;
    for (let entryIndex = 0; entryIndex < entranceCount; entryIndex += 1) {
      const screenshotPath = (
        (code === 'L2' && entryIndex < 2)
        || (code === 'L4' && entryIndex < 2)
        || (code === 'L5' && entryIndex === 1)
      )
        ? `${OUTPUT}/walk-${code.toLowerCase()}-entry-${entryIndex + 1}.png`
        : null;
      accessResults.push(await walkThroughLogisticsDoor(code, entryIndex, screenshotPath));
    }
  }

  const geometry = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName('DISTRICT__logistics');
    const runway = world.scene.getObjectByName('LOGISTICS__AIRFIELD__NORTHFIELD_SHORT_RUNWAY');
    const network = district.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK');
    const routeKinds = {};
    const surfaces = [];
    const routeWidths = new Map();
    network.traverse((object) => {
      if (object.userData.continuousRoadSurface !== true) return;
      const kind = object.userData.routeKind;
      routeKinds[kind] = (routeKinds[kind] ?? 0) + 1;
      surfaces.push(object.name);
      routeWidths.set(object.userData.routeId, Math.max(
        object.userData.widthStart ?? 0,
        object.userData.widthEnd ?? 0,
      ));
    });
    const Vector3 = world.camera.position.constructor;
    const runwayRouteClearances = [];
    network.traverse((object) => {
      if (object.userData.semanticRoadSegment !== true) return;
      const from = runway.worldToLocal(
        network.localToWorld(new Vector3().fromArray(object.userData.fromPoint)),
      );
      const to = runway.worldToLocal(
        network.localToWorld(new Vector3().fromArray(object.userData.toPoint)),
      );
      let closestToRunway = null;
      for (let sample = 0; sample <= 200; sample += 1) {
        const point = from.clone().lerp(to, sample / 200);
        if (point.x < -66 || point.x > 66) continue;
        if (!closestToRunway || Math.abs(point.z) < Math.abs(closestToRunway.z)) {
          closestToRunway = point;
        }
      }
      if (!closestToRunway) return;
      runwayRouteClearances.push({
        routeId: object.userData.routeId,
        routeKind: object.userData.routeKind,
        from: from.toArray(),
        to: to.toArray(),
        width: routeWidths.get(object.userData.routeId) ?? 0,
        closest: closestToRunway.toArray(),
        centrelineClearance: Math.abs(closestToRunway.z),
      });
    });
    runwayRouteClearances.sort((left, right) => left.centrelineClearance - right.centrelineClearance);
    const minimumRunwayEdgeClearance = Math.min(
      ...runwayRouteClearances.map((route) => route.centrelineClearance - route.width * 0.5),
    );
    const forbiddenLegacyObjects = [
      'Dedicated logistics-to-port freight road',
      'Automated cold-chain freight guide',
    ].filter((name) => world.scene.getObjectByName(name));
    const forbiddenRouteIds = ['l3-operations-front-to-corridor']
      .filter((routeId) => routeWidths.has(routeId));
    const buildings = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'].map((code) => {
      const facility = world.objectGroups.get(`entry-logistics-building-${code.toLowerCase()}`);
      const collision = facility.getObjectByName(`LOGISTICS__${code}__PRECISE_MULTI_DOOR_COLLISION`);
      return {
        code,
        accessible: facility.userData.walkAccess.accessible === true,
        exteriorOnly: facility.userData.walkAccess.exteriorOnly === false,
        authoredInterior: facility.userData.authoredInterior === true,
        entranceCount: facility.userData.logisticsEntranceCount,
        accessibleSides: facility.userData.logisticsAccessibleSides,
        walkAccessEntries: facility.userData.walkAccess.entries,
        runtimeInteriorCount: facility.children.filter((child) => child.userData.runtimeInterior === true).length,
        accessVolumeCount: facility.children.filter((child) => child.userData.navAccess === true).length,
        doorwayGapCount: collision?.userData.doorwayGapCount ?? 0,
        barrierCount: collision?.userData.navBarrierSegments?.length ?? 0,
        collisionPolicy: facility.userData.logisticsExteriorCollisionPolicy,
      };
    });
    const requiredAirfieldObjects = [
      'LOGISTICS__RUNWAY_GRADED_SHOULDER',
      'LOGISTICS__NORTHFIELD_RUNWAY',
      'LOGISTICS__RUNWAY_DESIGNATOR_09',
      'LOGISTICS__RUNWAY_DESIGNATOR_27',
      'LOGISTICS__PARALLEL_TAXIWAY',
      'LOGISTICS__HANGAR_AIRCRAFT_APRON',
      'LOGISTICS__TERMINAL_AIRCRAFT_APRON',
      'LOGISTICS__NORTHFIELD_PARKED_TURBOPROP',
      'LOGISTICS__AIRFIELD_WINDSOCK',
    ];
    const runwayEnvelopeMeshes = [];
    world.scene.traverse((object) => {
      if (!object.isMesh || !object.visible || runway.getObjectById(object.id)) return;
      const positions = object.geometry?.getAttribute?.('position');
      if (!positions) return;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;
      const local = new Vector3();
      for (let index = 0; index < positions.count; index += 1) {
        local.fromBufferAttribute(positions, index);
        const point = runway.worldToLocal(object.localToWorld(local.clone()));
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
        minZ = Math.min(minZ, point.z);
        maxZ = Math.max(maxZ, point.z);
      }
      if (maxX < -68 || minX > 68 || maxZ < -4 || minZ > 4 || minY > 2 || maxY < -1) return;
      runwayEnvelopeMeshes.push({
        name: object.name,
        parent: object.parent?.name,
        grandparent: object.parent?.parent?.name,
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ],
        userData: {
          routeId: object.userData.routeId,
          routeKind: object.userData.routeKind,
          continuousRoadSurface: object.userData.continuousRoadSurface,
          surfaceKind: object.userData.surfaceKind,
          featureTag: object.userData.featureTag,
        },
      });
    });
    return {
      network: {
        routeCount: network.userData.routeCount,
        branchCount: network.userData.branchCount,
        buildingEntranceCount: network.userData.buildingEntranceCount,
        logisticsPlatformCount: network.userData.logisticsPlatformCount,
        districtTransitionCount: network.userData.districtTransitionCount,
        surfacePalette: network.userData.surfacePalette,
        routeKinds,
        continuousSurfaceCount: surfaces.length,
        runwayRouteClearances,
        minimumRunwayEdgeClearance,
        forbiddenRouteIds,
      },
      buildings,
      airfieldSpecification: runway.userData.airfieldSpecification,
      missingAirfieldObjects: requiredAirfieldObjects.filter((name) => !runway.getObjectByName(name)),
      forbiddenLegacyObjects,
      runwayEnvelopeMeshes,
    };
  });

  if (geometry.network.routeCount !== 4
    || geometry.network.buildingEntranceCount !== 20
    || geometry.network.logisticsPlatformCount !== 20
    || geometry.network.districtTransitionCount !== 2
    || geometry.network.routeKinds['logistics-landside'] < 1
    || geometry.network.routeKinds.freight < 1
    || geometry.network.routeKinds['service-yard'] < 1
    || geometry.network.routeKinds.airside < 1
    || geometry.buildings.some((building) => !building.accessible
      || !building.exteriorOnly
      || !building.authoredInterior
      || building.entranceCount < 2
      || building.accessibleSides.length < 2
      || building.walkAccessEntries.length !== building.entranceCount
      || building.runtimeInteriorCount !== 1
      || building.accessVolumeCount !== building.entranceCount + 1
      || building.doorwayGapCount !== building.entranceCount
      || building.barrierCount < 8
      || building.collisionPolicy !== 'precise-multi-door-barriers')) {
    throw new Error(`Logistics geometry or road hierarchy failed: ${JSON.stringify(geometry, null, 2)}`);
  }
  if (geometry.missingAirfieldObjects.length
    || geometry.airfieldSpecification.runwayLengthWorldUnits !== 120
    || geometry.airfieldSpecification.runwayDesignators.join('/') !== '09/27'
    || !geometry.airfieldSpecification.parallelTaxiway
    || geometry.airfieldSpecification.taxiwayConnectorCount !== 3
    || geometry.airfieldSpecification.terminalStandCount !== 3
    || geometry.airfieldSpecification.parkedAircraftCount !== 1) {
    throw new Error(`Northfield airfield detail failed: ${JSON.stringify(geometry, null, 2)}`);
  }
  if (geometry.forbiddenLegacyObjects.length
    || geometry.network.forbiddenRouteIds.length
    || geometry.network.minimumRunwayEdgeClearance < 4.5) {
    throw new Error(`Northfield protected-runway clearance failed: ${JSON.stringify({
      forbiddenLegacyObjects: geometry.forbiddenLegacyObjects,
      forbiddenRouteIds: geometry.network.forbiddenRouteIds,
      minimumRunwayEdgeClearance: geometry.network.minimumRunwayEdgeClearance,
    }, null, 2)}`);
  }
  if (!DIAGNOSTIC_ONLY && (accessResults.length !== 20
    || accessResults.some((result) => !result.interiorVisible
      || !result.walk.grounded
      || result.walk.roomId !== result.expectedRoomId))) {
    throw new Error(`Multi-side Logistics WALK access failed: ${JSON.stringify(accessResults, null, 2)}`);
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);

  const report = {
    networkOverview,
    airfieldOverview,
    geometry,
    accessResults,
    errors,
  };
  await writeFile(`${OUTPUT}/report.json`, JSON.stringify(report, null, 2));
  const {
    runwayRouteClearances,
    ...networkSummary
  } = geometry.network;
  console.log(JSON.stringify({
    network: networkSummary,
    airfield: geometry.airfieldSpecification,
    walkApproaches: accessResults.length,
    errors,
  }, null, 2));
} finally {
  await Promise.race([
    browser.close(),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
}
