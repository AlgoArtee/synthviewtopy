import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';

const OUTPUT = process.env.ENTRY_LOGISTICS_OUTPUT ?? 'output/entry-logistics';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ownedServer = process.env.BASE_URL
  ? null
  : await createServer({
    root: process.cwd(),
    server: { host: '127.0.0.1', port: 5178, strictPort: true },
  });
if (ownedServer) await ownedServer.listen();
const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:5178';

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

async function captureFacilityView({
  id,
  cameraLocal,
  targetLocal,
  path,
}) {
  const state = await page.evaluate(({ id: facilityId, cameraLocal: eye, targetLocal: target }) => {
    const world = window.labIsland;
    const facility = world.objectGroups.get(facilityId);
    if (!facility) throw new Error(`Missing visual target ${facilityId}`);
    const walkAccess = facility.userData.walkAccess;
    world.setMode('walk');
    world.walkController.refreshNavigation();
    const cameraPlan = facility.localToWorld(world.camera.position.clone().set(...eye));
    const ground = world.walkController.sampleGround(cameraPlan.x, cameraPlan.z, { spawnSearch: true });
    world.camera.position.set(cameraPlan.x, ground + 0.162, cameraPlan.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    const targetWorld = facility.localToWorld(world.controls.target.clone().set(...target));
    world.camera.lookAt(targetWorld.x, ground + target[1], targetWorld.z);
    world.advanceTime(240);
    world.camera.position.y = world.walkController.groundY + 0.162;
    world.renderer.render(world.scene, world.camera);
    const visibleRuntimeInteriors = [];
    const visibleExteriorOnlyObjects = [];
    facility.traverse((object) => {
      if (object.userData.runtimeInterior === true && object.visible) {
        visibleRuntimeInteriors.push(object.name);
      }
      if (object.userData.hideWhenRuntimeInteriorVisible === true && object.visible) {
        visibleExteriorOnlyObjects.push(object.name);
      }
    });
    return {
      facility: facility.name,
      ground,
      walk: world.walkController.getSnapshot(),
      visibleRuntimeInteriors,
      visibleExteriorOnlyObjects,
      walkAccess,
    };
  }, { id, cameraLocal, targetLocal });
  await page.waitForTimeout(250);
  await page.screenshot({ path });
  return state;
}

async function captureHotelTraversal(path) {
  const state = await page.evaluate(() => {
    const world = window.labIsland;
    const facility = world.objectGroups.get('entry-logistics-building-e8');
    const district = world.objectGroups.get('entry-commercial');
    if (!facility || !district) throw new Error('Missing E8 visual traversal target');
    const walkAccess = facility.userData.walkAccess;
    const routeStart = district.localToWorld(world.camera.position.clone().fromArray(walkAccess.routeStart));
    const interiorTarget = district.localToWorld(world.controls.target.clone().fromArray(walkAccess.interiorTarget));
    world.setMode('walk');
    const ground = world.walkController.sampleGround(routeStart.x, routeStart.z, { spawnSearch: true });
    world.camera.position.set(routeStart.x, ground + 0.162, routeStart.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(interiorTarget.x, ground + 0.162, interiorTarget.z);
    world.advanceTime(48);
    world.walkController.refreshNavigation();
    world.setWalkSpeedKilometresPerHour(120);
    world.setWalkIntent(0, 1, false);
    world.advanceTime(1_400);
    world.setWalkIntent(0, 0, false);
    world.advanceTime(48);
    world.walkController.sampleGround(
      world.camera.position.x,
      world.camera.position.z,
      { trackSurface: true },
    );
    world.renderer.render(world.scene, world.camera);
    const endLocal = facility.worldToLocal(world.camera.position.clone());
    const runtimeInterior = facility.getObjectByName('ENTRY__E8__AUTHORED_WALK_INTERIOR');
    const visibleExteriorOnlyObjects = [];
    facility.traverse((object) => {
      if (object.userData.hideWhenRuntimeInteriorVisible === true && object.visible) {
        visibleExteriorOnlyObjects.push(object.name);
      }
    });
    return {
      endLocal: endLocal.toArray(),
      walk: world.walkController.getSnapshot(),
      interiorVisible: runtimeInterior?.visible === true,
      visibleExteriorOnlyObjects,
    };
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path });
  return state;
}

async function captureCafeKeyboardApproach({ label, startLocal, path }) {
  const setup = await page.evaluate(({ label: approachLabel, startLocal: localStart }) => {
    const world = window.labIsland;
    const facility = world.objectGroups.get('entry-logistics-building-e4');
    const district = world.objectGroups.get('entry-commercial');
    if (!facility || !district) throw new Error('Missing E4 keyboard approach target');
    world.setMode('explore');
    world.advanceTime(32);
    world.setMode('walk');
    world.setWalkSpeedKilometresPerHour(120);
    world.walkController.refreshNavigation();
    const start = facility.localToWorld(world.camera.position.clone().set(...localStart));
    const interiorTarget = district.localToWorld(
      world.controls.target.clone().fromArray(facility.userData.walkAccess.interiorTarget),
    );
    const ground = world.walkController.sampleGround(start.x, start.z, { spawnSearch: true });
    if (ground === null) throw new Error(`${approachLabel} E4 approach has no ground`);
    world.camera.position.set(start.x, ground + 0.162, start.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(interiorTarget.x, ground + 0.162, interiorTarget.z);
    world.advanceTime(120);
    return {
      label: approachLabel,
      startLocal: facility.worldToLocal(world.camera.position.clone()).toArray(),
    };
  }, { label, startLocal });
  await page.keyboard.down('w');
  await page.evaluate(() => window.labIsland.advanceTime(2_250));
  await page.keyboard.up('w');
  const result = await page.evaluate((initial) => {
    const world = window.labIsland;
    const facility = world.objectGroups.get('entry-logistics-building-e4');
    world.advanceTime(48);
    world.walkController.sampleGround(
      world.camera.position.x,
      world.camera.position.z,
      { trackSurface: true },
    );
    world.renderer.render(world.scene, world.camera);
    const snapshot = world.walkController.getSnapshot();
    const result = {
      ...initial,
      endLocal: facility.worldToLocal(world.camera.position.clone()).toArray(),
      walk: snapshot,
      interiorVisible: facility.getObjectByName('ENTRY__E4__AUTHORED_WALK_INTERIOR')?.visible === true,
    };
    world.setWalkSpeedKilometresPerHour(6.5);
    return result;
  }, setup);
  await page.waitForTimeout(200);
  await page.screenshot({ path });
  return result;
}

async function captureFashionClubKeyboardApproach({ label, startLocal, path }) {
  const setup = await page.evaluate(({ label: approachLabel, startLocal: localStart }) => {
    const world = window.labIsland;
    const facility = world.objectGroups.get('entry-logistics-building-e6');
    const district = world.objectGroups.get('entry-commercial');
    if (!facility || !district) throw new Error('Missing E6 keyboard approach target');
    world.setMode('explore');
    world.advanceTime(32);
    world.setMode('walk');
    world.setWalkSpeedKilometresPerHour(120);
    world.walkController.refreshNavigation();
    const start = facility.localToWorld(world.camera.position.clone().set(...localStart));
    const interiorTarget = district.localToWorld(
      world.controls.target.clone().fromArray(facility.userData.walkAccess.interiorTarget),
    );
    const ground = world.walkController.sampleGround(start.x, start.z, { spawnSearch: true });
    if (ground === null) throw new Error(`${approachLabel} E6 approach has no ground`);
    world.camera.position.set(start.x, ground + 0.162, start.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(interiorTarget.x, ground + 0.162, interiorTarget.z);
    world.advanceTime(120);
    return {
      label: approachLabel,
      startLocal: facility.worldToLocal(world.camera.position.clone()).toArray(),
    };
  }, { label, startLocal });
  await page.keyboard.down('w');
  await page.evaluate(() => window.labIsland.advanceTime(2_250));
  await page.keyboard.up('w');
  const result = await page.evaluate((initial) => {
    const world = window.labIsland;
    const facility = world.objectGroups.get('entry-logistics-building-e6');
    world.advanceTime(48);
    world.walkController.sampleGround(
      world.camera.position.x,
      world.camera.position.z,
      { trackSurface: true },
    );
    world.renderer.render(world.scene, world.camera);
    const result = {
      ...initial,
      endLocal: facility.worldToLocal(world.camera.position.clone()).toArray(),
      walk: world.walkController.getSnapshot(),
      interiorVisible: facility.getObjectByName('ENTRY__E6__AUTHORED_WALK_INTERIOR')?.visible === true,
    };
    world.setWalkSpeedKilometresPerHour(6.5);
    return result;
  }, setup);
  await page.waitForTimeout(200);
  await page.screenshot({ path });
  return result;
}

async function captureEntryKeyboardApproach({ code, label, lateralDirection, path }) {
  const setup = await page.evaluate(({ code: buildingCode, label: approachLabel, lateralDirection: side }) => {
    const world = window.labIsland;
    const facility = world.objectGroups.get(`entry-logistics-building-${buildingCode.toLowerCase()}`);
    const district = world.objectGroups.get('entry-commercial');
    if (!facility || !district) throw new Error(`Missing ${buildingCode} keyboard approach target`);
    const walkAccess = facility.userData.walkAccess;
    world.setMode('explore');
    world.advanceTime(32);
    world.setMode('walk');
    world.setWalkSpeedKilometresPerHour(120);
    world.walkController.refreshNavigation();
    const thresholdWorld = district.localToWorld(
      world.camera.position.clone().fromArray(walkAccess.threshold),
    );
    const routeStartWorld = district.localToWorld(
      world.controls.target.clone().fromArray(walkAccess.routeStart),
    );
    const thresholdLocal = facility.worldToLocal(thresholdWorld.clone());
    const routeStartLocal = facility.worldToLocal(routeStartWorld.clone());
    const approachDepth = Math.min(5.5, Math.max(2.4, routeStartLocal.z - thresholdLocal.z));
    const lateralOffset = side * walkAccess.doorwayWidth * 0.55;
    const startLocal = new world.camera.position.constructor(
      thresholdLocal.x + lateralOffset,
      0,
      thresholdLocal.z + approachDepth,
    );
    const start = facility.localToWorld(startLocal.clone());
    const interiorTarget = district.localToWorld(
      world.controls.target.clone().fromArray(walkAccess.interiorTarget),
    );
    const ground = world.walkController.sampleGround(start.x, start.z, { spawnSearch: true });
    if (ground === null) throw new Error(`${approachLabel} ${buildingCode} approach has no ground`);
    world.camera.position.set(start.x, ground + 0.162, start.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(interiorTarget.x, ground + 0.162, interiorTarget.z);
    world.advanceTime(120);
    const distance = Math.hypot(interiorTarget.x - start.x, interiorTarget.z - start.z);
    return {
      code: buildingCode,
      label: approachLabel,
      startLocal: facility.worldToLocal(world.camera.position.clone()).toArray(),
      durationMilliseconds: Math.min(5_000, Math.max(1_200, (distance / (120 / 36) + 0.22) * 1_000)),
      expectedRoomId: facility.userData.entryInteriorRoomId,
    };
  }, { code, label, lateralDirection });
  await page.keyboard.down('w');
  await page.evaluate((duration) => window.labIsland.advanceTime(duration), setup.durationMilliseconds);
  await page.keyboard.up('w');
  const result = await page.evaluate((initial) => {
    const world = window.labIsland;
    const facility = world.objectGroups.get(`entry-logistics-building-${initial.code.toLowerCase()}`);
    world.advanceTime(48);
    world.walkController.sampleGround(
      world.camera.position.x,
      world.camera.position.z,
      { trackSurface: true },
    );
    world.renderer.render(world.scene, world.camera);
    const result = {
      ...initial,
      endLocal: facility.worldToLocal(world.camera.position.clone()).toArray(),
      walk: world.walkController.getSnapshot(),
      interiorVisible:
        facility.getObjectByName(`ENTRY__${initial.code}__AUTHORED_WALK_INTERIOR`)?.visible === true,
    };
    world.setWalkSpeedKilometresPerHour(6.5);
    return result;
  }, setup);
  await page.waitForTimeout(120);
  if (path) await page.screenshot({ path });
  return result;
}

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
  });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.evaluate(() => {
    const world = window.labIsland;
    world.setLayer('labels', false);
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    document.querySelectorAll(
      '.atlas, .topbar, #inspector-panel, #edit-workspace, #scene-card, .layerbar, .compass, .interaction-hint, .walk-hud',
    ).forEach((element) => {
      element.setAttribute('style', 'display:none');
    });
    world.advanceTime(240);
  });

  const e4Terrace = await captureFacilityView({
    id: 'entry-logistics-building-e4',
    cameraLocal: [-3.9, 0, 6.55],
    targetLocal: [-4.2, 0.075, 6.0],
    path: `${OUTPUT}/walk-e4-human-scale-cafe-terrace.png`,
  });

  const e4Facade = await captureFacilityView({
    id: 'entry-logistics-building-e4',
    cameraLocal: [0, 0, 8.8],
    targetLocal: [0, 0.8, 2.45],
    path: `${OUTPUT}/walk-e4-clear-cafe-entry.png`,
  });

  const e4KeyboardApproaches = [];
  for (const approach of [
    { label: 'front', startLocal: [2.1, 0, 7.8] },
    { label: 'west-angle', startLocal: [0.5, 0, 7.2] },
    { label: 'east-angle', startLocal: [3.7, 0, 7.2] },
  ]) {
    e4KeyboardApproaches.push(await captureCafeKeyboardApproach({
      ...approach,
      path: `${OUTPUT}/walk-e4-entry-${approach.label}.png`,
    }));
  }

  const e6KeyboardApproaches = [];
  for (const approach of [
    { label: 'front', startLocal: [0, 0, 7.8] },
    { label: 'west-angle', startLocal: [-1.5, 0, 7.2] },
    { label: 'east-angle', startLocal: [1.5, 0, 7.2] },
  ]) {
    e6KeyboardApproaches.push(await captureFashionClubKeyboardApproach({
      ...approach,
      path: `${OUTPUT}/walk-e6-entry-${approach.label}.png`,
    }));
  }

  const remainingEntryKeyboardApproaches = [];
  for (const code of ['E3', 'E5', 'E7', 'E8', 'E9', 'E10', 'E11', 'E12', 'E13']) {
    for (const approach of [
      { label: 'front', lateralDirection: 0 },
      { label: 'west-angle', lateralDirection: -1 },
      { label: 'east-angle', lateralDirection: 1 },
    ]) {
      remainingEntryKeyboardApproaches.push(await captureEntryKeyboardApproach({
        code,
        ...approach,
        path: approach.label === 'front'
          ? `${OUTPUT}/walk-${code.toLowerCase()}-entry-front-audit.png`
          : null,
      }));
    }
  }

  const e10Exterior = await captureFacilityView({
    id: 'entry-logistics-building-e10',
    cameraLocal: [0, 0, 11.2],
    targetLocal: [0, 0.16, 5.7],
    path: `${OUTPUT}/walk-e10-clear-water-entry.png`,
  });

  const e10Interior = await captureFacilityView({
    id: 'entry-logistics-building-e10',
    cameraLocal: [0, 0, 2.45],
    targetLocal: [0, 0.18, -2.9],
    path: `${OUTPUT}/walk-e10-clean-showcase-interior.png`,
  });

  const e10EntranceWall = await captureFacilityView({
    id: 'entry-logistics-building-e10',
    cameraLocal: [0, 0, 0.65],
    targetLocal: [0, 0.18, 6.72],
    path: `${OUTPUT}/walk-e10-inside-entry-wall.png`,
  });

  const e5Interior = await captureFacilityView({
    id: 'entry-logistics-building-e5',
    cameraLocal: [-10.3, 0, 0.92],
    targetLocal: [10.3, 0.18, 0.92],
    path: `${OUTPUT}/walk-e5-connected-gallery.png`,
  });

  const e5EntranceWall = await captureFacilityView({
    id: 'entry-logistics-building-e5',
    cameraLocal: [0, 0, 0.82],
    targetLocal: [0, 0.18, 5.22],
    path: `${OUTPUT}/walk-e5-inside-entry-wall.png`,
  });

  const e8Exterior = await captureFacilityView({
    id: 'entry-logistics-building-e8',
    cameraLocal: [0, 0, 9.6],
    targetLocal: [0, 0.16, 4.72],
    path: `${OUTPUT}/walk-e8-open-hotel-entrance.png`,
  });

  const e8Interior = await captureHotelTraversal(`${OUTPUT}/walk-e8-inside-arrival-hotel.png`);

  const geometry = await page.evaluate(() => {
    const world = window.labIsland;
    const e10 = world.objectGroups.get('entry-logistics-building-e10');
    const e5 = world.objectGroups.get('entry-logistics-building-e5');
    const e8 = world.objectGroups.get('entry-logistics-building-e8');
    const e4 = world.objectGroups.get('entry-logistics-building-e4');
    const e6 = world.objectGroups.get('entry-logistics-building-e6');
    const channel = e10.getObjectByName('ENTRY__E10__C_SHAPED_WATER_CHANNEL');
    const e5InteriorGroup = e5.getObjectByName('ENTRY__E5__AUTHORED_WALK_INTERIOR');
    const e4TableSets = e4.children.filter((object) => object.userData.cafeTerraceFurniture === true);
    const e4Planters = e4.children.filter((object) => object.userData.perimeterPlanter === true
      && /^ENTRY__E4__HERB_PLANTER_\d+$/.test(object.name));
    const e4Herbs = e4.children.filter((object) => object.userData.perimeterPlanter === true
      && /^ENTRY__E4__PLANTER_GRASS_\d+_\d+$/.test(object.name));
    const e4Wordmark = e4.getObjectByName('ENTRY__E4__CAFE_WORDMARK');
    const e4Collision = e4.getObjectByName('ENTRY__E4__PRECISE_INTERIOR_WALL_COLLISION');
    const e4AggregateShells = [
      'ENTRY__E4__FLUTED_CERAMIC_SERVICE_WALL',
      'ENTRY__E4__LOW_IRON_GLASS_PAVILION',
      'ENTRY__E4__HOVERING_BRONZE_ROOF',
    ].map((name) => e4.getObjectByName(name));
    const e6Collision = e6.getObjectByName('ENTRY__E6__PRECISE_INTERIOR_WALL_COLLISION');
    const e6AggregateShells = [
      'ENTRY__E6__BLACK_STAINLESS_CLUB_VOLUME',
      'ENTRY__E6__LIGHTING_TRUSS_CANOPY',
    ].map((name) => e6.getObjectByName(name));
    const remainingEntryCollisionPolicies = [
      'E3', 'E5', 'E7', 'E8', 'E9', 'E10', 'E11', 'E12', 'E13',
    ].map((code) => {
      const facility = world.objectGroups.get(`entry-logistics-building-${code.toLowerCase()}`);
      const disabledNames = facility.userData.disabledAggregateExteriorObstacles ?? [];
      const preciseCollision = facility.getObjectByName(
        `ENTRY__${code}__PRECISE_INTERIOR_WALL_COLLISION`,
      );
      return {
        code,
        policy: facility.userData.entryExteriorCollisionPolicy,
        preciseExteriorCollisionGuide: facility.userData.preciseExteriorCollisionGuide,
        disabledCount: facility.userData.disabledAggregateExteriorObstacleCount,
        aggregateObstacleCount: facility.userData.aggregateExteriorObstacleCount,
        disabledObjects: disabledNames.map((name) => {
          const object = facility.getObjectByName(name);
          return {
            name,
            obstacle: object?.userData.navObstacle === true,
            aggregateCollisionDisabled: object?.userData.aggregateCollisionDisabled === true,
            preciseCollisionGuide: object?.userData.preciseCollisionGuide,
          };
        }),
        preciseBarrierCount: preciseCollision?.userData.navBarrierSegments?.length ?? 0,
        doorwayGapWidth: preciseCollision?.userData.doorwayGapWidth,
        expectedDoorwayGapWidth: facility.userData.walkAccess.doorwayWidth,
      };
    });
    const e4Chairs = [];
    const e4Tabletops = [];
    e4TableSets.forEach((set) => {
      set.traverse((object) => {
        if (object.userData.cafeTerraceChair === true) e4Chairs.push(object);
        if (/ENTRY__E4__TERRACE_TABLE_\d+$/.test(object.name)) e4Tabletops.push(object);
      });
    });
    const sizeOf = (object) => {
      const size = new world.camera.position.constructor();
      new world.selectionBounds.constructor().setFromObject(object, true).getSize(size);
      return size.toArray();
    };
    const frontWallCount = (facility, code) => {
      let count = 0;
      facility.getObjectByName(`ENTRY__${code}__AUTHORED_WALK_INTERIOR`)?.traverse((object) => {
        if (object.userData.frontWallWithDoor === true) count += 1;
      });
      return count;
    };
    return {
      e4: {
        tableSetCount: e4TableSets.length,
        chairCount: e4Chairs.length,
        chairsPerTable: e4TableSets.map((set) => (
          set.children.filter((object) => object.userData.cafeTerraceChair === true).length
        )),
        humanScaleMetres: e4TableSets.map((set) => set.userData.humanScaleMetres),
        tabletopSizes: e4Tabletops.map(sizeOf),
        chairSizes: e4Chairs.map(sizeOf),
        tableSetPositions: e4TableSets.map((set) => set.position.toArray()),
        planterCount: e4Planters.length,
        herbClusterCount: e4Herbs.length,
        planterSizes: e4Planters.map(sizeOf),
        planterNavigationBlockers: [...e4Planters, ...e4Herbs]
          .filter((object) => object.userData.navObstacle === true)
          .map((object) => object.name),
        centralAisleBlockers: [...e4TableSets, ...e4Planters]
          .filter((object) => Math.abs(object.position.x) < 2.5)
          .map((object) => object.name),
        wordmark: {
          localPosition: e4Wordmark.position.toArray(),
          width: e4Wordmark.geometry.parameters.width,
          rightEdge: e4Wordmark.position.x + e4Wordmark.geometry.parameters.width * 0.5,
          doorwayWestEdge: -e4.userData.walkAccess.doorwayWidth * 0.5,
          clearOfDoor: e4Wordmark.userData.clearOfCafeDoor === true,
        },
        collision: {
          aggregateShells: e4AggregateShells.map((object) => ({
            name: object.name,
            obstacle: object.userData.navObstacle === true,
            aggregateCollisionDisabled: object.userData.aggregateCollisionDisabled === true,
          })),
          preciseBarrierCount: e4Collision.userData.navBarrierSegments?.length ?? 0,
          doorwayGapWidth: e4Collision.userData.doorwayGapWidth,
        },
      },
      e6: {
        collision: {
          aggregateShells: e6AggregateShells.map((object) => ({
            name: object.name,
            obstacle: object.userData.navObstacle === true,
            aggregateCollisionDisabled: object.userData.aggregateCollisionDisabled === true,
          })),
          preciseBarrierCount: e6Collision.userData.navBarrierSegments?.length ?? 0,
          doorwayGapWidth: e6Collision.userData.doorwayGapWidth,
        },
      },
      e10: {
        entranceGapDegrees: channel.userData.entranceGapDegrees,
        entranceGapWidth: channel.userData.entranceGapWidth,
        whiteAislePresent: Boolean(e10.getObjectByName('ENTRY__E10__INTERIOR_CLEAR_CENTRAL_AISLE')),
        frontWallCount: frontWallCount(e10, 'E10'),
      },
      e5: {
        galleryZones: e5InteriorGroup.userData.galleryZones,
        internalDoorCount: e5InteriorGroup.userData.internalDoorCount,
        connectedInternalRoute: e5InteriorGroup.userData.connectedInternalRoute === true,
        frontWallCount: frontWallCount(e5, 'E5'),
      },
      e8: {
        splitBaseWingCount: e8.children.filter((object) => object.userData.hotelEntranceOpening === true).length,
        obsoleteSolidBasePresent: Boolean(e8.getObjectByName('ENTRY__E8__PALE_STONE_TWO_STOREY_BASE')),
        canopyCollisionDisabled: e8.getObjectByName('ENTRY__E8__POLISHED_DROP_OFF_CANOPY')?.userData.navObstacle !== true,
      },
      remainingEntryCollisionPolicies,
    };
  });

  const report = {
    e4Terrace,
    e4Facade,
    e4KeyboardApproaches,
    e6KeyboardApproaches,
    remainingEntryKeyboardApproaches,
    e10Exterior,
    e10Interior,
    e10EntranceWall,
    e5Interior,
    e5EntranceWall,
    e8Exterior,
    e8Interior,
    geometry,
    errors,
  };
  await writeFile(`${OUTPUT}/entry-gallery-visual-report.json`, JSON.stringify(report, null, 2));
  if (geometry.e4.tableSetCount !== 6
    || geometry.e4.chairCount !== 24
    || geometry.e4.chairsPerTable.some((count) => count !== 4)
    || geometry.e4.humanScaleMetres.some((scale) => scale.tableHeight !== 0.75
      || scale.tableDiameter !== 0.9
      || scale.chairSeatHeight !== 0.46
      || scale.chairOverallHeight !== 0.94)
    || geometry.e4.tabletopSizes.some((size) => Math.max(...size) > 0.091)
    || geometry.e4.chairSizes.some((size) => Math.max(...size) > 0.095)
    || geometry.e4.tableSetPositions.some((position) => Math.abs(position[0]) < 3.5)
    || geometry.e4.planterCount !== 8
    || geometry.e4.herbClusterCount !== 24
    || geometry.e4.planterSizes.some((size) => Math.max(...size) > 0.116)
    || geometry.e4.planterNavigationBlockers.length !== 0
    || geometry.e4.centralAisleBlockers.length !== 0
    || !geometry.e4.wordmark.clearOfDoor
    || geometry.e4.wordmark.rightEdge > geometry.e4.wordmark.doorwayWestEdge - 0.1
    || geometry.e4.collision.aggregateShells.some((object) => object.obstacle
      || !object.aggregateCollisionDisabled)
    || geometry.e4.collision.preciseBarrierCount !== 10
    || geometry.e4.collision.doorwayGapWidth !== 2.4
    || e4KeyboardApproaches.length !== 3
    || e4KeyboardApproaches.some((approach) => approach.walk.roomId !== 'entry-e4-cafe-pavilion'
      || !approach.walk.grounded
      || !approach.interiorVisible
      || approach.endLocal[2] >= 2.37
      || approach.endLocal[2] <= -1.83)
    || geometry.e6.collision.aggregateShells.some((object) => object.obstacle
      || !object.aggregateCollisionDisabled)
    || geometry.e6.collision.preciseBarrierCount !== 10
    || geometry.e6.collision.doorwayGapWidth !== 2.8
    || e6KeyboardApproaches.length !== 3
    || e6KeyboardApproaches.some((approach) => approach.walk.roomId !== 'entry-e6-runway-club-foyer'
      || !approach.walk.grounded
      || !approach.interiorVisible
      || approach.endLocal[2] >= 2.62
      || approach.endLocal[2] <= -1.88)
    || remainingEntryKeyboardApproaches.length !== 27
    || remainingEntryKeyboardApproaches.some((approach) =>
      approach.walk.roomId !== approach.expectedRoomId
      || !approach.walk.grounded
      || !approach.interiorVisible)
    || geometry.remainingEntryCollisionPolicies.length !== 9
    || geometry.remainingEntryCollisionPolicies.some((record) =>
      record.policy !== 'precise-doorway-barriers'
      || record.preciseExteriorCollisionGuide !== `ENTRY__${record.code}__PRECISE_INTERIOR_WALL_COLLISION`
      || record.disabledCount < 1
      || record.aggregateObstacleCount !== 0
      || record.disabledObjects.length !== record.disabledCount
      || record.disabledObjects.some((object) => object.obstacle
        || !object.aggregateCollisionDisabled
        || object.preciseCollisionGuide !== `ENTRY__${record.code}__PRECISE_INTERIOR_WALL_COLLISION`)
      || record.preciseBarrierCount !== 10
      || record.doorwayGapWidth !== record.expectedDoorwayGapWidth)
    || geometry.e10.entranceGapDegrees < 60
    || geometry.e10.entranceGapWidth < 7
    || geometry.e10.whiteAislePresent
    || geometry.e10.frontWallCount !== 5
    || e10Interior.visibleRuntimeInteriors.length !== 1
    || e10Interior.visibleExteriorOnlyObjects.length !== 0
    || e10EntranceWall.visibleRuntimeInteriors.length !== 1
    || !geometry.e5.connectedInternalRoute
    || geometry.e5.internalDoorCount !== 2
    || geometry.e5.galleryZones.length !== 3
    || geometry.e5.frontWallCount !== 5
    || e5Interior.visibleRuntimeInteriors.length !== 1
    || e5Interior.visibleExteriorOnlyObjects.length !== 0
    || e5EntranceWall.visibleRuntimeInteriors.length !== 1
    || geometry.e8.splitBaseWingCount !== 2
    || geometry.e8.obsoleteSolidBasePresent
    || !geometry.e8.canopyCollisionDisabled
    || e8Interior.endLocal[2] >= 4.82
    || e8Interior.walk.roomId !== 'entry-e8-hotel-arrival-lobby'
    || !e8Interior.walk.grounded
    || !e8Interior.interiorVisible
    || e8Interior.visibleExteriorOnlyObjects.length !== 0
    || errors.length) {
    throw new Error(`Entry gallery visual audit failed: ${JSON.stringify(report, null, 2)}`);
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  if (ownedServer) await ownedServer.close();
}
