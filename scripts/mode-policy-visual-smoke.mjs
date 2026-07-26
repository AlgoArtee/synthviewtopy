import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.MODE_POLICY_OUTPUT ?? 'output/persistence-v2';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 1,
});
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

async function capture(name, expectedPolicy) {
  await page.waitForTimeout(900);
  const state = await page.evaluate(() => {
    const snapshot = window.labIsland.getTextSnapshot();
    const activeModeButton = document.querySelector('.mode.active')?.getAttribute('data-mode') ?? null;
    return {
      mode: snapshot.mode,
      activeModeButton,
      activeViewPolicy: snapshot.runtimePolicies.activeViewPolicy,
      canonicalIntegrity: snapshot.canonicalIntegrity,
      runtimeHiddenCount: snapshot.runtimePolicies.runtimeHiddenCount,
    };
  });
  if (state.mode !== state.activeModeButton || state.activeViewPolicy !== expectedPolicy) {
    throw new Error(`Mode UI/policy mismatch for ${name}: ${JSON.stringify(state)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/${name}.png`, fullPage: true });
  return state;
}

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForFunction(() => document.querySelector('#loading-screen')?.classList.contains('done'));

  const captures = {};
  await page.click('[data-mode="explore"]');
  await page.evaluate(() => window.labIsland.focus('entry-commercial'));
  captures.explore = await capture('explore-mode-policy', 'explore-exterior');

  await page.click('[data-mode="plan"]');
  captures.plan = await capture('plan-mode-policy', 'plan-exterior');

  await page.click('[data-mode="edit"]');
  await page.click('#edit-landscape');
  await page.evaluate(() => {
    window.labIsland.select('entry-logistics-building-e4', 'system');
    window.labIsland.focus('entry-logistics-building-e4');
  });
  captures.edit = await capture('edit-landscape-mode-policy', 'edit-exterior');

  await page.click('[data-mode="walk"]');
  captures.walkExterior = await capture('walk-exterior-mode-policy', 'walk-exterior');

  await page.click('[data-mode="edit"]');
  await page.click('#edit-interior');
  await page.evaluate(() => {
    const world = window.labIsland;
    const buildingId = 'entry-logistics-building-e2';
    world.select(buildingId, 'system');
    if (!world.enterInterior(buildingId)) throw new Error('Could not open the Welcome Hall interior');
  });
  captures.editInterior = await capture('edit-interior-mode-policy', 'edit-interior');

  await page.click('[data-mode="walk"]');
  captures.walkInterior = await capture('walk-interior-mode-policy', 'walk-interior');

  if (
    captures.explore.canonicalIntegrity.entry.present !== 13
    || captures.explore.canonicalIntegrity.logistics.present !== 7
    || !captures.explore.canonicalIntegrity.welcomePool.present
    || errors.length
  ) {
    throw new Error(`Mode policy visual audit failed: ${JSON.stringify({ captures, errors }, null, 2)}`);
  }
  await writeFile(`${OUTPUT}/mode-policy-audit.json`, JSON.stringify({ captures, errors }, null, 2));
  console.log(JSON.stringify({
    policies: Object.fromEntries(Object.entries(captures).map(([name, state]) => [name, state.activeViewPolicy])),
    entryBuildings: captures.explore.canonicalIntegrity.entry.present,
    logisticsBuildings: captures.explore.canonicalIntegrity.logistics.present,
    pool: captures.explore.canonicalIntegrity.welcomePool.present,
    errors: errors.length,
  }, null, 2));
} finally {
  await browser.close();
}
