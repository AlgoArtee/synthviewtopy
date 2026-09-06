import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.WELCOME_EDIT_WEDGE_OUTPUT ?? 'output/welcome-edit-wedge';
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

const settle = async (milliseconds = 400) => {
  await page.evaluate((duration) => window.labIsland.advanceTime(duration), milliseconds);
  await page.waitForTimeout(180);
};

const prepareEntryView = () => page.evaluate(() => {
  const world = window.labIsland;
  world.setTimeOfDay('noon');
  world.setWeather('clear');
  world.select('entry-logistics-building-e2', 'system');
  world.cameraTween = null;
  const district = world.objectGroups.get('entry-commercial');
  const bounds = new world.selectionBounds.constructor().setFromObject(district, true);
  const center = bounds.getCenter(world.controls.target.clone());
  const size = bounds.getSize(world.camera.position.clone());
  world.controls.target.copy(center);
  world.camera.up.set(0, 1, 0);
  world.camera.position.set(center.x + size.x * 0.72, center.y + size.y * 1.4 + 42, center.z + size.z * 0.9);
  world.camera.lookAt(center);
  world.controls.update();
  world.advanceTime(500);
});

const prepareWelcomeJunctionView = () => page.evaluate(() => {
  const world = window.labIsland;
  const district = world.scene.getObjectByName('DISTRICT__entry-commercial');
  const network = world.scene.getObjectByName('DISTRICT__entry-commercial')
    ?.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK');
  const focusObjects = [
    world.scene.getObjectByName('ENTRY__E1__BRIDGEHEAD_TUNNEL_AND_ISLAND_GATE'),
    world.scene.getObjectByName('ENTRY__E2__WELCOME_AND_REGISTRATION_HALL'),
  ].filter(Boolean);
  const splitPoint = network?.userData.welcomeSplitGeometry?.splitPoint;
  if (focusObjects.length !== 2 || !district || !splitPoint) {
    throw new Error('Cannot frame the tunnel, split, and Welcome Hall');
  }
  const focusPoints = focusObjects.map((object) => object.getWorldPosition(world.camera.position.clone()));
  focusPoints.push(district.localToWorld(world.camera.position.clone().fromArray(splitPoint)));
  const bounds = new world.selectionBounds.constructor().setFromPoints(focusPoints).expandByScalar(18);
  const center = bounds.getCenter(world.controls.target.clone());
  const size = bounds.getSize(world.camera.position.clone());
  const cameraHeight = Math.max(145, Math.hypot(size.x, size.z) * 1.05);
  const hallPosition = focusObjects[1].getWorldPosition(world.controls.target.clone());
  const splitPosition = focusPoints[2];
  const outwardAxis = splitPosition.sub(hallPosition).setY(0).normalize();
  center.addScaledVector(outwardAxis, -10);
  world.cameraTween = null;
  world.controls.target.copy(center);
  world.camera.up.copy(outwardAxis);
  world.camera.position.set(center.x, center.y + cameraHeight, center.z);
  world.camera.lookAt(center);
  world.controls.update();
  world.advanceTime(400);
});

const audit = () => page.evaluate(() => {
  const world = window.labIsland;
  const pkg = world.worldStreaming.packages.get('entry-commercial');
  const sourceByName = (name) => pkg.authoritySources.find((entry) => entry.source.name === name)?.source;
  const network = world.scene.getObjectByName('DISTRICT__entry-commercial')
    ?.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK');
  const roadObjectByName = (name) => sourceByName(name) ?? network?.getObjectByName(name);
  const effective = (object) => {
    let cursor = object;
    while (cursor) {
      if (!cursor.visible) return false;
      cursor = cursor.parent;
    }
    return Boolean(object);
  };
  const entries = pkg.authoritySources.filter((entry) => (
    entry.source.userData.continuousRoadSurface === true
    || entry.source.userData.welcomeForkJunction === true
    || entry.source.userData.roadMarking === true
  ));
  const roadBatches = pkg.runtimeBatches.filter((record) => (
    record.entries.some((entry) => entries.includes(entry))
  ));
  const surfaceYs = entries.flatMap((entry) => {
    entry.source.geometry.computeBoundingBox();
    const box = entry.source.geometry.boundingBox;
    return box ? [box.min.y, box.max.y] : [];
  });
  const wedge = world.editDistrictContextRoot;
  const obsoleteJunctionNames = [
    'ENTRY-COMMERCIAL__WELCOME_THREE_WAY_SPLIT__CLEAN_JUNCTION_CAP',
    'ENTRY-COMMERCIAL__WELCOME_THREE_WAY_SPLIT__CENTRAL_ISLAND',
    'ENTRY-COMMERCIAL__WELCOME_THREE_WAY_SPLIT__OUTER_LANE_EDGE',
    'ENTRY-COMMERCIAL__WELCOME_THREE_WAY_SPLIT__TWO_LANE_DASHED_DIVIDER',
    'ENTRY-COMMERCIAL__WELCOME_THREE_WAY_SPLIT__CLOCKWISE_DIRECTION_ARROWS',
    ...Array.from({ length: 4 }, (_, index) => (
      `ENTRY-COMMERCIAL__WELCOME_THREE_WAY_SPLIT__APPROACH_YIELD_BAR_${index + 1}`
    )),
  ];
  const routeSurfaces = ['arrival', 'arrival-entry-branch', 'e2-door-apron', 'arrival-logistics-branch']
    .map((routeId) => {
      const surface = roadObjectByName(`ENTRY-COMMERCIAL__${routeId.toUpperCase()}__CONTINUOUS_SURFACE`);
      return {
        routeId,
        present: Boolean(surface),
        widthStart: surface?.userData.widthStart ?? null,
        widthEnd: surface?.userData.widthEnd ?? null,
        laneCount: surface?.userData.laneCount ?? null,
        pointCount: surface?.userData.pointCount ?? null,
        startPointId: surface?.userData.startPointId ?? null,
        endPointId: surface?.userData.endPointId ?? null,
        dividerCount: entries.filter((entry) => (
          entry.source.userData.continuousRoadMarking === true
          && entry.source.userData.routeId === routeId
        )).length,
      };
    });
  const hall = world.scene.getObjectByName('ENTRY__E2__WELCOME_AND_REGISTRATION_HALL');
  const district = world.scene.getObjectByName('DISTRICT__entry-commercial');
  const logisticsNetwork = world.objectGroups.get('logistics')
    ?.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK');
  const splitGeometry = network?.userData.welcomeSplitGeometry;
  const hallRoadCrownWorld = district
    .localToWorld(world.camera.position.clone().fromArray(splitGeometry.hallRoadCrown));
  const hallRoadCrownLocal = hall.worldToLocal(hallRoadCrownWorld).toArray();
  const threshold = hall.userData.roadDoorThreshold;
  const routeStart = hall.userData.roadRouteStart;
  return {
    mode: world.getMode(),
    selectedId: world.selectedId,
    package: world.worldStreaming.getSnapshot().packages.find((entry) => entry.id === 'entry-commercial'),
    networkPresent: Boolean(network),
    networkEffective: effective(network),
    roadEntryCount: entries.length,
    roadEntriesParentVisible: entries.filter((entry) => entry.parentVisible).length,
    roadEntriesMicroVisible: entries.filter((entry) => entry.microVisible).length,
    roadBatchCount: roadBatches.length,
    visibleRoadBatchCount: roadBatches.filter((record) => effective(record.batch)).length,
    roadBatchMaterials: roadBatches.map((record) => ({
      name: record.batch.name,
      kind: record.kind,
      visible: effective(record.batch),
      renderOrder: record.batch.renderOrder,
      depthTest: record.batch.material.depthTest,
      depthWrite: record.batch.material.depthWrite,
      polygonOffset: record.batch.material.polygonOffset,
      polygonOffsetFactor: record.batch.material.polygonOffsetFactor,
      roadEntries: record.entries.filter((entry) => entries.includes(entry)).length,
    })),
    roadLocalYRange: surfaceYs.length ? [Math.min(...surfaceYs), Math.max(...surfaceYs)] : null,
    islandSurfaceY: world.islandShellRoot.getObjectByName('Island planted surface')?.position.y ?? null,
    obsoletePlotCount: [
      sourceByName('entry-commercial__PLOT'),
      world.scene.getObjectByName('logistics__PLOT'),
    ].filter(Boolean).length,
    obsoleteJunctionObjectCount: obsoleteJunctionNames.filter((name) => roadObjectByName(name)).length,
    markedRoadCleanup: {
      hallRearRoadPresent: Boolean(roadObjectByName(
        'ENTRY-COMMERCIAL__E2-REAR-BOUNDARY-LINK__CONTINUOUS_SURFACE',
      )),
      transitCollectorTailPresent: Boolean(roadObjectByName(
        'ENTRY-COMMERCIAL__E3-TO-COLLECTOR__CONTINUOUS_SURFACE',
      )),
      parkingRearStairRoadPresent: Boolean(logisticsNetwork?.getObjectByName(
        'LOGISTICS__L1-NORTH-STAIR-HARDSTAND__CONTINUOUS_SURFACE',
      )),
    },
    routeSurfaces,
    symmetricSplit: {
      layout: network?.userData.welcomeSplitLayout ?? null,
      destinationCount: network?.userData.welcomeSplitDestinationCount ?? 0,
      approachCount: network?.userData.welcomeSplitApproachCount ?? 0,
      ...splitGeometry,
      hallRoadCrownLocal,
      thresholdToRouteStart: Math.hypot(routeStart[0] - threshold[0], routeStart[2] - threshold[2]),
    },
    wedge: wedge ? {
      visible: effective(wedge),
      directVisible: wedge.visible,
      packageId: wedge.userData.packageId ?? null,
      childCount: wedge.children.length,
      innerRadius: wedge.userData.innerRadius ?? null,
      outerRadius: wedge.userData.outerRadius ?? null,
      startAngle: wedge.userData.startAngle ?? null,
      endAngle: wedge.userData.endAngle ?? null,
    } : null,
    compact: JSON.parse(window.render_game_to_text()),
    errors: [],
  };
});

const assertExploreRoads = (state, phase) => {
  if (state.mode !== 'explore'
    || !state.package?.detailResident
    || state.roadEntryCount !== 38
    || state.roadBatchCount !== 2
    || state.visibleRoadBatchCount !== 2
    || state.roadBatchMaterials.some((batch) => !batch.visible
      || batch.depthTest
      || batch.depthWrite
      || !batch.polygonOffset
      || batch.polygonOffsetFactor !== -1
      || batch.renderOrder >= 0)
    || state.obsoletePlotCount !== 0
    || state.obsoleteJunctionObjectCount !== 0
    || state.markedRoadCleanup.hallRearRoadPresent
    || state.markedRoadCleanup.transitCollectorTailPresent
    || state.markedRoadCleanup.parkingRearStairRoadPresent
    || state.routeSurfaces.some((surface) => !surface.present)
    || state.routeSurfaces.find((surface) => surface.routeId === 'arrival')?.laneCount !== 3
    || state.routeSurfaces.find((surface) => surface.routeId === 'arrival')?.dividerCount !== 2
    || state.routeSurfaces.filter((surface) => surface.routeId !== 'arrival').some((surface) => (
      surface.laneCount !== 1
      || Math.abs(surface.widthStart - 2.4) > 0.001
      || Math.abs(surface.widthEnd - 2.4) > 0.001
      || surface.dividerCount !== 0
    ))
    || state.routeSurfaces.find((surface) => surface.routeId === 'arrival-entry-branch')?.pointCount !== 21
    || state.routeSurfaces.find((surface) => surface.routeId === 'arrival-entry-branch')?.endPointId
      !== 'welcome-entry-fan-clear'
    || state.routeSurfaces.find((surface) => surface.routeId === 'arrival-logistics-branch')?.pointCount !== 21
    || state.routeSurfaces.find((surface) => surface.routeId === 'arrival-logistics-branch')?.endPointId
      !== 'welcome-logistics-fan-clear'
    || state.symmetricSplit.layout !== 'three-single-lane-branches-with-central-teardrop-loop'
    || state.symmetricSplit.destinationCount !== 3
    || state.symmetricSplit.approachCount !== 1
    || Math.abs(state.symmetricSplit.entryOriginGap - 1.8) > 0.001
    || Math.abs(state.symmetricSplit.logisticsOriginGap - 1.8) > 0.001
    || Math.abs(state.symmetricSplit.hallInboundOriginGap - 0.72) > 0.001
    || Math.abs(state.symmetricSplit.hallOutboundOriginGap - 0.72) > 0.001
    || Math.abs(state.symmetricSplit.hallLoopEndpointGap - 1.44) > 0.001
    || Math.abs(state.symmetricSplit.entryAngleDegrees - state.symmetricSplit.logisticsAngleDegrees) > 0.05
    || Math.abs(state.symmetricSplit.entryWidth - 2.4) > 0.001
    || Math.abs(state.symmetricSplit.logisticsWidth - 2.4) > 0.001
    || Math.abs(state.symmetricSplit.hallWidth - 2.4) > 0.001
    || state.symmetricSplit.entryLaneCount !== 1
    || state.symmetricSplit.logisticsLaneCount !== 1
    || state.symmetricSplit.hallLaneCount !== 1
    || state.symmetricSplit.centralLoopShape !== 'teardrop'
    || !state.symmetricSplit.centralLoopOneWay
    || state.symmetricSplit.circularJunctionSurface
    || state.symmetricSplit.hallUnderBuildingPodium
    || Math.abs(state.symmetricSplit.hallRoadCrownLocal[0]) > 0.1
    || state.symmetricSplit.hallRoadCrownClearance < 1.2
    || state.symmetricSplit.thresholdToRouteStart < 3.3
    || state.wedge?.visible
    || state.compact.streaming.editWedgeVisible) {
    throw new Error(`Welcome roads are not Explore-visible during ${phase}: ${JSON.stringify(state, null, 2)}`);
  }
};

try {
  await page.addInitScript(() => localStorage.removeItem('youtopy_saved_project'));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForSelector('#loading-screen', { state: 'hidden' });

  await page.locator('.mode[data-mode="explore"]').click();
  await prepareEntryView();
  await page.waitForFunction(() => window.labIsland.worldStreaming.getSnapshot()
    .residentDetailPackages.includes('entry-commercial'));
  await settle();
  const explore = await audit();
  assertExploreRoads(explore, 'initial Explore');
  await page.screenshot({ path: `${OUTPUT}/welcome-explore.png`, fullPage: true });
  await prepareWelcomeJunctionView();
  await settle();
  await page.screenshot({ path: `${OUTPUT}/welcome-single-lane-loop.png`, fullPage: true });

  await page.locator('.mode[data-mode="edit"]').click();
  await prepareEntryView();
  await settle();
  const edit = await audit();
  if (edit.mode !== 'edit'
    || !edit.package?.detailResident
    || edit.visibleRoadBatchCount !== 2
    || !edit.wedge?.visible
    || edit.wedge.packageId !== 'entry-commercial'
    || edit.wedge.childCount !== 2
    || edit.wedge.innerRadius !== 309
    || edit.wedge.outerRadius !== 416
    || Math.abs(edit.wedge.startAngle - Math.PI * 1.5) > 0.000001
    || Math.abs(edit.wedge.endAngle - Math.PI * 11 / 6) > 0.000001
    || !edit.compact.streaming.editWedgeVisible
    || edit.compact.streaming.editWedgePackageId !== 'entry-commercial') {
    throw new Error(`Complete Welcome wedge context failed: ${JSON.stringify(edit, null, 2)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/welcome-edit-wedge.png`, fullPage: true });

  const moved = await page.evaluate(() => {
    const world = window.labIsland;
    const id = 'entry-logistics-building-e2';
    const before = world.getObjectState(id);
    world.setObjectPosition(id, 'x', before.position.x + 6);
    world.advanceTime(240);
    const during = {
      selectedId: world.selectedId,
      wedgeVisible: world.editDistrictContextRoot.visible,
      wedgePackageId: world.editDistrictContextRoot.userData.packageId,
      wedgeBounds: [
        world.editDistrictContextRoot.userData.innerRadius,
        world.editDistrictContextRoot.userData.outerRadius,
        world.editDistrictContextRoot.userData.startAngle,
        world.editDistrictContextRoot.userData.endAngle,
      ],
    };
    world.resetObject(id);
    world.advanceTime(240);
    return during;
  });
  if (moved.selectedId !== 'entry-logistics-building-e2'
    || !moved.wedgeVisible
    || moved.wedgePackageId !== 'entry-commercial'
    || JSON.stringify(moved.wedgeBounds) !== JSON.stringify([
      edit.wedge.innerRadius,
      edit.wedge.outerRadius,
      edit.wedge.startAngle,
      edit.wedge.endAngle,
    ])) {
    throw new Error(`Wedge context changed while moving Welcome Hall: ${JSON.stringify(moved)}`);
  }

  await page.locator('.mode[data-mode="explore"]').click();
  await prepareEntryView();
  await settle();
  const restored = await audit();
  assertExploreRoads(restored, 'Edit-to-Explore restoration');
  await page.screenshot({ path: `${OUTPUT}/welcome-explore-restored.png`, fullPage: true });

  const report = { explore, edit, moved, restored, errors };
  await writeFile(`${OUTPUT}/report.json`, JSON.stringify(report, null, 2));
  if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);
  console.log(JSON.stringify({
    explore: {
      package: explore.package,
      roadEntryCount: explore.roadEntryCount,
      roadBatchCount: explore.roadBatchCount,
      visibleRoadBatchCount: explore.visibleRoadBatchCount,
      roadLocalYRange: explore.roadLocalYRange,
      islandSurfaceY: explore.islandSurfaceY,
      roadBatchMaterials: explore.roadBatchMaterials,
    },
    edit: {
      package: edit.package,
      visibleRoadBatchCount: edit.visibleRoadBatchCount,
      wedge: edit.wedge,
    },
    moved,
    restored: {
      roadBatchCount: restored.roadBatchCount,
      visibleRoadBatchCount: restored.visibleRoadBatchCount,
      wedge: restored.wedge,
    },
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
