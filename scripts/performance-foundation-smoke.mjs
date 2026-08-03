import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.PERFORMANCE_OUTPUT ?? 'output/performance-foundation-harness';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HEAVY_DISTRICTS = [
  'forensic-cyberforensic-lab',
  'bioanalytics-lab',
  'organic-chemistry-labs',
  'biochemistry-labs',
  'genomics-labs',
];

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

const startedAt = performance.now();
await page.addInitScript(() => localStorage.removeItem('youtopy_saved_project'));
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
await page.waitForFunction(() => Boolean(window.labIsland?.getSceneStatistics));
const initialReadyMs = performance.now() - startedAt;
await page.waitForTimeout(800);

const samples = [];
async function sample(name, setup, kind = 'close', setupArg = undefined) {
  await page.evaluate(setup, setupArg);
  await page.waitForTimeout(180);
  await page.evaluate(() => window.labIsland.advanceTime(180));
  await page.waitForTimeout(80);
  const result = await page.evaluate(() => ({
    stats: window.labIsland.getSceneStatistics(),
    text: window.labIsland.getTextSnapshot(),
    rendererGeometries: window.labIsland.renderer.info.memory.geometries,
  }));
  const maximumDrawCalls = kind === 'overview' ? 1_500 : 2_000;
  if (result.stats.drawCalls > maximumDrawCalls
    || (kind !== 'overview' && result.stats.triangles > 1_200_000)
    || result.stats.activeAnimationNodes > 250
    || result.stats.streaming.loadedPackageCount > 8
    || result.rendererGeometries > 3_500) {
    throw new Error(`${name} structural performance budget failed: ${JSON.stringify(result.stats, null, 2)}`);
  }
  samples.push({ name, kind, ...result });
  await page.screenshot({ path: `${OUTPUT}/${String(samples.length).padStart(2, '0')}-${name}.png`, fullPage: true });
}

try {
  await sample('overview-explore', () => {
    const world = window.labIsland;
    world.setMode('explore');
    world.overview();
  }, 'overview');

  for (const districtId of HEAVY_DISTRICTS) {
    await sample(`close-${districtId}`, (id) => {
      const world = window.labIsland;
      world.setMode('explore');
      const root = world.objectGroups.get(id);
      const target = root.getWorldPosition(world.camera.position.clone());
      world.camera.position.set(target.x + 13, target.y + 9, target.z + 12);
      world.controls.target.copy(target);
      world.camera.lookAt(target);
      world.camera.updateMatrixWorld(true);
    }, 'close', districtId);
  }

  await sample('district-boundary-walk', () => {
    const world = window.labIsland;
    world.setMode('walk');
    const a = world.objectGroups.get('medical-labs').getWorldPosition(world.camera.position.clone());
    const b = world.objectGroups.get('pharmacology-labs').getWorldPosition(world.controls.target.clone());
    world.camera.position.copy(a).lerp(b, 0.5).addScalar(2);
    world.camera.lookAt(b);
    world.camera.updateMatrixWorld(true);
  });

  await sample('overview-plan', () => {
    const world = window.labIsland;
    world.setMode('plan');
    world.overview();
  }, 'overview');

  await sample('city-facing', () => {
    const world = window.labIsland;
    world.setMode('explore');
    world.camera.position.set(180, 45, 240);
    world.controls.target.set(360, 18, 0);
    world.camera.lookAt(world.controls.target);
    world.camera.updateMatrixWorld(true);
  });

  await sample('night', () => {
    window.labIsland.setMode('explore');
    window.labIsland.setTimeOfDay('night');
  });

  await sample('rain', () => {
    window.labIsland.setWeather('rain');
  });

  const packageCosts = samples[0].stats.streaming.packages.map((pkg) => ({ id: pkg.id, ...pkg.estimatedCost }));
  const packageBudgetViolations = packageCosts.filter((pkg) => (
    pkg.drawCalls > 450 || pkg.triangles > 250_000 || pkg.animationNodes > 150
  ));
  if (packageBudgetViolations.length) {
    throw new Error(`Isolated detail package budgets failed: ${JSON.stringify(packageBudgetViolations, null, 2)}`);
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);

  const report = {
    target: '1080p Medium / integrated-GPU laptop; headless timing is diagnostic only',
    initialReadyMs: Math.round(initialReadyMs),
    samples: samples.map(({ name, kind, stats, rendererGeometries }) => ({
      name,
      kind,
      drawCalls: stats.drawCalls,
      triangles: stats.triangles,
      visibleMeshes: stats.visibleMeshes,
      rendererGeometries,
      effectivePixelRatio: stats.effectivePixelRatio,
      frameTimeMs: stats.frameTimeMs,
      loadedPackages: stats.streaming.loadedPackageCount,
      residentPackages: stats.streaming.residentPackageCount,
      activeAnimationNodes: stats.activeAnimationNodes,
    })),
    packageBudgetViolations,
    errors,
  };
  await writeFile(`${OUTPUT}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
