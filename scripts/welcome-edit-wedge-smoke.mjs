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
  world.camera.position.set(center.x + size.x * 0.72, center.y + size.y * 1.4 + 42, center.z + size.z * 0.9);
  world.camera.lookAt(center);
  world.controls.update();
  world.advanceTime(500);
});

const audit = () => page.evaluate(() => {
  const world = window.labIsland;
  const pkg = world.worldStreaming.packages.get('entry-commercial');
  const network = world.scene.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK');
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
    || state.roadEntryCount !== 50
    || state.roadBatchCount !== 3
    || state.visibleRoadBatchCount !== 3
    || state.roadBatchMaterials.some((batch) => !batch.visible
      || batch.depthTest
      || batch.depthWrite
      || !batch.polygonOffset
      || batch.polygonOffsetFactor !== -1
      || batch.renderOrder >= 0)
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

  await page.locator('.mode[data-mode="edit"]').click();
  await prepareEntryView();
  await settle();
  const edit = await audit();
  if (edit.mode !== 'edit'
    || !edit.package?.detailResident
    || edit.visibleRoadBatchCount !== 3
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
