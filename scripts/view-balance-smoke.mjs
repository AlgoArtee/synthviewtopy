import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.VIEW_BALANCE_OUTPUT ?? 'output/view-balance';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

const settle = async (milliseconds = 160) => {
  await page.evaluate((duration) => window.labIsland.advanceTime(duration), milliseconds);
  await page.waitForTimeout(80);
};
const read = () => page.evaluate(() => ({
  text: window.labIsland.getTextSnapshot(),
  stats: window.labIsland.getSceneStatistics(),
}));

try {
  await page.addInitScript(() => localStorage.removeItem('youtopy_saved_project'));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForSelector('#loading-screen', { state: 'hidden' });
  await settle(250);

  const overview = await read();
  if (overview.text.mode !== 'explore'
    || overview.stats.streaming.residentPackageCount > 3
    || overview.stats.streaming.loadedPackageCount > 8
    || overview.stats.streaming.proxyPackageCount < 38
    || overview.stats.activeAnimationNodes > 250
    || overview.stats.drawCalls > 1_500) {
    throw new Error(`EXPLORE overview budget failed: ${JSON.stringify(overview.stats, null, 2)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/explore-layered-hlod.png`, fullPage: true });

  await page.click('.mode[data-mode="plan"]');
  await settle();
  const plan = await read();
  if (plan.stats.streaming.residentPackageCount !== 0
    || plan.stats.streaming.activeDetailLimit !== 0
    || plan.stats.drawCalls > 1_500) {
    throw new Error(`PLAN budget failed: ${JSON.stringify(plan.stats, null, 2)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/plan-far-hlod.png`, fullPage: true });

  await page.click('.mode[data-mode="walk"]');
  const closeWalk = await page.evaluate(() => {
    const world = window.labIsland;
    const target = world.objectGroups.get('forensic-cyberforensic-lab');
    const facility = target.children.find((child) => child.userData.exteriorProgram === true) ?? target;
    const bounds = new world.selectionBounds.constructor().setFromObject(facility, true);
    const position = bounds.getCenter(world.camera.position.clone());
    const size = bounds.getSize(world.controls.target.clone());
    const outward = position.clone().setY(0).normalize();
    const stand = position.clone().addScaledVector(outward, Math.max(size.x, size.z) * 0.65 + 2);
    world.walkController.refreshNavigation();
    const ground = world.walkController.sampleGround(stand.x, stand.z) ?? position.y;
    world.camera.position.set(stand.x, ground + 0.162, stand.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(position.x, bounds.min.y + size.y * 0.42, position.z);
    world.camera.updateMatrixWorld(true);
    world.advanceTime(180);
    return true;
  });
  if (!closeWalk) throw new Error('Unable to position WALK view.');
  await page.waitForTimeout(500);
  await settle();
  const walk = await read();
  if (walk.stats.streaming.residentPackageCount > 5
    || walk.stats.streaming.loadedPackageCount > 8
    || walk.stats.activeAnimationNodes > 250
    || walk.stats.drawCalls > 2_000
    || walk.stats.triangles > 1_200_000) {
    throw new Error(`Close WALK budget failed: ${JSON.stringify(walk.stats, null, 2)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/walk-bounded-detail.png`, fullPage: true });

  const academic = await page.evaluate(() => {
    const world = window.labIsland;
    const definitions = Array.from(world.definitions.values()).filter((definition) => definition.category === 'academic-building');
    const buildings = definitions.map((definition) => {
      const root = world.objectGroups.get(definition.id);
      let runtimeInteriors = 0;
      let closedDoors = 0;
      root?.traverse((object) => {
        if (object.userData.runtimeInterior === true) runtimeInteriors += 1;
        if (object.name.includes('CLOSED') && object.name.includes('DOOR')) closedDoors += 1;
      });
      return {
        id: definition.id,
        canEnter: world.canEnterInterior(definition.id),
        definitionInteriorAvailable: definition.interiorAvailable,
        rootInteriorAvailable: root?.userData.interiorAvailable,
        runtimeInteriors,
        closedDoors,
      };
    });
    const district = world.objectGroups.get('academic-libraries-theoretical-labs');
    return {
      districtCanEnter: world.canEnterInterior('academic-libraries-theoretical-labs'),
      districtInteriorAvailable: district?.userData.interiorAvailable,
      buildings,
      compatibility: world.getStreamingSnapshot().cerebrumExternum,
      controlsPresent: Boolean(document.querySelector('[id^="cerebrum-"]')),
    };
  });
  if (academic.districtCanEnter
    || academic.districtInteriorAvailable !== false
    || academic.controlsPresent
    || academic.compatibility.available !== false
    || academic.compatibility.phase !== 'removed'
    || academic.compatibility.mounted
    || academic.buildings.some((building) => building.canEnter
      || building.definitionInteriorAvailable !== false
      || building.rootInteriorAvailable !== false
      || building.runtimeInteriors !== 0
      || building.closedDoors < 1)) {
    throw new Error(`Academic removal audit failed: ${JSON.stringify(academic, null, 2)}`);
  }

  const representation = await page.evaluate(() => {
    const snapshot = window.labIsland.getStreamingSnapshot();
    return snapshot.packages.map((pkg) => ({
      id: pkg.id,
      representationCount: Number(pkg.detailResident) + Number(pkg.midVisible) + Number(pkg.farVisible),
    }));
  });
  if (representation.some((pkg) => pkg.representationCount !== 1)) {
    throw new Error(`Streaming representation overlap/hole: ${JSON.stringify(representation.filter((pkg) => pkg.representationCount !== 1))}`);
  }

  const report = { overview: overview.stats, plan: plan.stats, walk: walk.stats, academic, errors };
  await writeFile(`${OUTPUT}/report.json`, JSON.stringify(report, null, 2));
  if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);
  console.log(JSON.stringify({
    overview: { drawCalls: overview.stats.drawCalls, triangles: overview.stats.triangles, loaded: overview.stats.streaming.loadedPackageCount },
    plan: { drawCalls: plan.stats.drawCalls, resident: plan.stats.streaming.residentPackageCount },
    walk: { drawCalls: walk.stats.drawCalls, triangles: walk.stats.triangles, resident: walk.stats.streaming.residentPackageCount },
    academicBuildingsWithoutInteriors: academic.buildings.length,
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
