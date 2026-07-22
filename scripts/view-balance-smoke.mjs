import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.VIEW_BALANCE_OUTPUT ?? 'output/view-balance';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

const readState = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForTimeout(1_200);
  await page.evaluate(() => window.advanceTime(80));

  const explore = await readState();
  if (explore.mode !== 'explore'
    || explore.streaming.residentDetailPackages.length !== 41
    || explore.streaming.proxyPackageCount !== 0
    || explore.runtimePolicies.visibleAuthoredInteriorGroups !== 0
    || explore.runtimePolicies.cerebrumInteriorRendered
    || explore.runtimePolicies.objectInteractionsEnabled) {
    throw new Error(`EXPLORE policy audit failed: ${JSON.stringify({
      mode: explore.mode,
      streaming: explore.streaming,
      policies: explore.runtimePolicies,
    }, null, 2)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/explore-all-exteriors.png`, fullPage: true });

  await page.click('#walk-mode');
  await page.locator('#walk-speed-kmh').fill('18');
  await page.locator('#walk-speed-kmh').press('Enter');
  await page.locator('#walk-speed-kmh').blur();
  await page.evaluate(() => window.advanceTime(80));
  const walkBefore = await readState();
  if (walkBefore.walk.configuredWalkSpeedKilometresPerHour !== 18
    || walkBefore.streaming.proxyPackageCount <= 0
    || walkBefore.streaming.residentDetailPackages.length <= 0
    || walkBefore.streaming.residentDetailPackages.length >= 41
    || walkBefore.runtimePolicies.visibleAuthoredInteriorGroups !== 0) {
    throw new Error(`WALK exterior LOD audit failed: ${JSON.stringify({
      walk: walkBefore.walk,
      streaming: walkBefore.streaming,
      policies: walkBefore.runtimePolicies,
    }, null, 2)}`);
  }

  const distance = await page.evaluate(() => {
    const world = window.labIsland;
    const before = world.camera.position.clone();
    world.setWalkIntent(0, 1, false);
    world.advanceTime(2_000);
    world.setWalkIntent(0, 0, false);
    return {
      metres: before.distanceTo(world.camera.position) * 10,
      state: world.walkController.getSnapshot(),
    };
  });
  if (distance.metres < 9.4 || distance.metres > 10.6 || distance.state.speedKilometresPerHour !== 18) {
    throw new Error(`Configured WALK speed audit failed: ${JSON.stringify(distance, null, 2)}`);
  }

  await page.keyboard.press('e');
  await page.waitForTimeout(50);
  if (!(await page.locator('#walk-interaction-menu').isHidden())) {
    throw new Error('The WALK interaction menu opened while object interactions were disabled.');
  }
  const disabledActions = await page.evaluate(() => ({
    academic: window.labIsland.performAcademicInteraction('ring chapel bell'),
    cerebrum: window.labIsland.performCerebrumLibraryInteraction('reading-lamp-1'),
  }));
  if (disabledActions.academic.state?.interactionsEnabled !== false || disabledActions.cerebrum.handled) {
    throw new Error(`Disabled interaction audit failed: ${JSON.stringify(disabledActions, null, 2)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/walk-speed-and-distant-hlod.png`, fullPage: true });

  const diningInterior = await page.evaluate(() => {
    const world = window.labIsland;
    const host = world.objectGroups.get('academic-building-founders-dining-hall');
    if (!host) throw new Error('Founders Dining Hall host missing');
    host.updateWorldMatrix(true, false);
    const Vector3 = world.camera.position.constructor;
    const center = host.localToWorld(new Vector3(0, 0.02, 3.1));
    const direction = new Vector3(0, -0.03, -1).transformDirection(host.matrixWorld).normalize();
    world.camera.position.copy(center).add(new Vector3(0, 0.2, 0));
    world.advanceTime(50);
    world.walkController.enter(center, direction, center);
    world.advanceTime(80);
    return world.getTextSnapshot().runtimePolicies;
  });
  if (diningInterior.visibleAuthoredInteriorGroups !== 1) {
    throw new Error(`Authored inside-only interior audit failed: ${JSON.stringify(diningInterior, null, 2)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/walk-inside-dining-hall.png`, fullPage: true });

  const cerebrum = await page.evaluate(() => {
    const world = window.labIsland;
    const host = world.objectGroups.get('academic-building-ashcroft-grand-library');
    if (!host) throw new Error('Cerebrum Externum host missing');
    host.updateWorldMatrix(true, false);
    const Vector3 = world.camera.position.constructor;
    const center = host.localToWorld(new Vector3(0, 0.02, 0));
    world.camera.position.copy(center).add(new Vector3(0, 0.2, 0));
    world.advanceTime(50);
    world.walkController.enter(center, new Vector3(0, 0, -1), center);
    world.advanceTime(100);
    return world.getTextSnapshot();
  });
  if (!cerebrum.runtimePolicies.cerebrumInteriorRendered
    || cerebrum.streaming.cerebrumExternum.phase !== 'active'
    || !cerebrum.academicDistrict?.cerebrumExternum?.mounted) {
    throw new Error(`Cerebrum inside-only mount audit failed: ${JSON.stringify({
      policies: cerebrum.runtimePolicies,
      streaming: cerebrum.streaming.cerebrumExternum,
      mounted: cerebrum.academicDistrict?.cerebrumExternum?.mounted,
    }, null, 2)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/walk-inside-cerebrum.png`, fullPage: true });

  const returnedExplore = await page.evaluate(() => {
    window.labIsland.setMode('explore');
    window.advanceTime(80);
    return window.labIsland.getTextSnapshot();
  });
  if (returnedExplore.streaming.residentDetailPackages.length !== 41
    || returnedExplore.streaming.proxyPackageCount !== 0
    || returnedExplore.runtimePolicies.visibleAuthoredInteriorGroups !== 0
    || returnedExplore.runtimePolicies.cerebrumInteriorRendered
    || returnedExplore.academicDistrict?.cerebrumExternum?.mounted) {
    throw new Error(`Return-to-EXPLORE cleanup audit failed: ${JSON.stringify({
      streaming: returnedExplore.streaming,
      policies: returnedExplore.runtimePolicies,
      mounted: returnedExplore.academicDistrict?.cerebrumExternum?.mounted,
    }, null, 2)}`);
  }

  const report = {
    explore: {
      residentDetailPackages: explore.streaming.residentDetailPackages.length,
      proxyPackageCount: explore.streaming.proxyPackageCount,
      runtimePolicies: explore.runtimePolicies,
    },
    walk: {
      residentDetailPackages: walkBefore.streaming.residentDetailPackages.length,
      proxyPackageCount: walkBefore.streaming.proxyPackageCount,
      configuredSpeedKilometresPerHour: walkBefore.walk.configuredWalkSpeedKilometresPerHour,
      measuredDistanceMetresInTwoSeconds: Number(distance.metres.toFixed(2)),
    },
    diningInterior,
    cerebrum: {
      phase: cerebrum.streaming.cerebrumExternum.phase,
      rendered: cerebrum.runtimePolicies.cerebrumInteriorRendered,
    },
    disabledActions,
    errors,
  };
  await writeFile(`${OUTPUT}/report.json`, JSON.stringify(report, null, 2));
  if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await Promise.race([
    browser.close(),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
}
