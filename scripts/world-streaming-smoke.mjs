import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.STREAMING_OUTPUT ?? 'output/world-streaming';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DISTRICTS = [
  'forensic-cyberforensic-lab', 'bioanalytics-lab', 'organic-chemistry-labs',
  'secret-labs', 'biochemistry-labs', 'genomics-labs', 'pharmacology-labs',
  'medical-labs', 'microbiology-labs', 'industrial-labs',
];

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.addInitScript(() => localStorage.removeItem('youtopy_saved_project'));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getStreamingSnapshot));
  await page.waitForTimeout(500);

  const transitions = [];
  for (const id of DISTRICTS) {
    await page.evaluate((districtId) => {
      const world = window.labIsland;
      world.setMode('edit');
      world.select(districtId, 'system');
      const root = world.objectGroups.get(districtId);
      const target = root.getWorldPosition(world.camera.position.clone());
      world.camera.position.set(target.x + 8, target.y + 7, target.z + 9);
      world.controls.target.copy(target);
      world.camera.updateMatrixWorld(true);
      world.advanceTime(100);
    }, id);
    await page.waitForTimeout(100);
    transitions.push(await page.evaluate(() => window.labIsland.getStreamingSnapshot()));
  }

  const final = transitions.at(-1);
  if (!final
    || transitions.some((snapshot) => snapshot.loadedPackageCount > snapshot.cacheCapacity)
    || final.loadedPackageCount !== 8
    || final.residentPackageCount !== 1
    || !final.residentDetailPackages.includes(DISTRICTS.at(-1))
    || final.loadedPackages.includes(DISTRICTS[0])) {
    throw new Error(`LRU residency audit failed: ${JSON.stringify(transitions.map((snapshot) => ({
      loaded: snapshot.loadedPackages,
      resident: snapshot.residentDetailPackages,
    })), null, 2)}`);
  }

  const persistence = await page.evaluate(async (districtId) => {
    const world = window.labIsland;
    const root = world.objectGroups.get(districtId);
    const before = root.position.x;
    root.position.x += 1.25;
    world.worldStreaming.update({
      cameraPosition: world.camera.position,
      mode: 'plan',
      selectedPackageId: null,
      interiorPackageId: null,
      elapsedSeconds: 10,
      force: true,
    });
    world.worldStreaming.update({
      cameraPosition: world.camera.position,
      mode: 'edit',
      selectedPackageId: districtId,
      interiorPackageId: null,
      elapsedSeconds: 11,
      force: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 80));
    return { before, after: root.position.x, state: world.getStreamingSnapshot() };
  }, DISTRICTS[0]);
  if (Math.abs(persistence.after - persistence.before - 1.25) > 0.0001) {
    throw new Error(`Stable transform was lost after remount: ${JSON.stringify(persistence)}`);
  }

  const fallback = await page.evaluate(async (districtId) => {
    const world = window.labIsland;
    world.worldStreaming.simulateLoadError(districtId, 'test activation error');
    const errored = world.getStreamingSnapshot().packages.find((pkg) => pkg.id === districtId);
    world.setMode('edit');
    world.select(districtId, 'system');
    world.worldStreaming.update({
      cameraPosition: world.camera.position,
      mode: 'edit',
      selectedPackageId: districtId,
      interiorPackageId: null,
      elapsedSeconds: 20,
      force: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 120));
    const retried = world.getStreamingSnapshot().packages.find((pkg) => pkg.id === districtId);
    return { errored, retried };
  }, DISTRICTS.at(-1));
  if (fallback.errored.loadState !== 'error'
    || !fallback.errored.proxyVisible
    || fallback.retried.loadState !== 'loaded'
    || !fallback.retried.detailResident) {
    throw new Error(`Proxy fallback/retry audit failed: ${JSON.stringify(fallback, null, 2)}`);
  }

  const packageBudgets = await page.evaluate(() => window.labIsland.getStreamingSnapshot().packages.map((pkg) => ({
    id: pkg.id,
    ...pkg.estimatedCost,
  })));
  const animationViolations = packageBudgets.filter((pkg) => pkg.animationNodes > 150);
  if (animationViolations.length) throw new Error(`Package animation budget failed: ${JSON.stringify(animationViolations, null, 2)}`);

  const report = { transitions, persistence, fallback, packageBudgets, errors };
  await writeFile(`${OUTPUT}/report.json`, JSON.stringify(report, null, 2));
  await page.screenshot({ path: `${OUTPUT}/lru-remount-and-fallback.png`, fullPage: true });
  if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);
  console.log(JSON.stringify({
    cacheCapacity: final.cacheCapacity,
    loadedPackages: final.loadedPackages,
    residentPackages: final.residentDetailPackages,
    transformPreserved: persistence.after - persistence.before,
    retryState: fallback.retried.loadState,
    packageAnimationViolations: animationViolations.length,
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
