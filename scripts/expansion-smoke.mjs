import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForSelector('#loading-screen.done', { timeout: 30_000 });
await page.waitForTimeout(900);
await page.screenshot({ path: 'output/lab-island-expansion/overview.png' });

const sceneAudit = await page.evaluate(() => {
  const world = window.labIsland;
  const names = [];
  world.modelRoot.traverse((object) => names.push(object.name));
  const tower = world.scene.getObjectByName('DISTRICT__dark-center-lab-megabuilding');
  let towerMinY = Number.POSITIVE_INFINITY;
  let towerMaxY = Number.NEGATIVE_INFINITY;
  tower?.traverse((object) => {
    if (!object.geometry) return;
    object.geometry.computeBoundingBox();
    const box = object.geometry.boundingBox;
    if (!box) return;
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) {
          const point = box.min.clone().set(x, y, z);
          object.localToWorld(point);
          towerMinY = Math.min(towerMinY, point.y);
          towerMaxY = Math.max(towerMaxY, point.y);
        }
      }
    }
  });
  const districtRadii = ['toxicology-labs', 'medical-labs', 'marketing', 'scientist-residential', 'logistics']
    .map((id) => {
      const state = world.getObjectState(id);
      return { id, radius: state ? Math.hypot(state.position.x, state.position.z) : null };
    });
  return {
    districtRadii,
    towerHeight: Number.isFinite(towerMinY) ? towerMaxY - towerMinY : null,
    coastalRailSegments: names.filter((name) => name.startsWith('Hexagonal coastal rail bed')).length,
    coastalTrains: names.filter((name) => name.startsWith('COASTAL_RAIL__TRAIN_')).length,
    ships: names.filter((name) => name.includes('vessel ')),
    portPresent: names.includes('INFRASTRUCTURE__ALPINE_LOGISTICS_PORT'),
    plazaPresent: names.includes('Corporate Core futuristic plaza'),
    neonSigns: names.filter((name) => name.endsWith('__NEON_SIGN')),
    bridge: {
      placement: world.transitRoot.userData.bridgePlacement,
      start: world.transitRoot.userData.bridgeStart,
      end: world.transitRoot.userData.bridgeEnd,
    },
    city: {
      center: world.cityRoot.userData.cityCenter,
      skylineLength: world.cityRoot.userData.skylineLength,
      towerCount: world.cityRoot.userData.towerCount,
    },
    oceanWidth: world.scene.getObjectByName('Animated ocean surface (presentation)')?.geometry.parameters.width,
  };
});

await page.evaluate(() => {
  const world = window.labIsland;
  world.camera.position.set(70, 48, 82);
  world.controls.target.set(0, 12, 2);
  world.controls.update();
});
await page.waitForTimeout(700);
await page.screenshot({ path: 'output/lab-island-expansion/corporate-plaza-and-tower.png' });

await page.evaluate(() => {
  const world = window.labIsland;
  world.camera.position.set(95, 58, -350);
  world.controls.target.set(35, 0, -292);
  world.controls.update();
});
await page.waitForTimeout(700);
await page.screenshot({ path: 'output/lab-island-expansion/alpine-logistics-port.png' });

await page.evaluate(() => {
  const world = window.labIsland;
  world.camera.position.set(265, 135, 20);
  world.controls.target.set(260, 10, -285);
  world.controls.update();
});
await page.waitForTimeout(700);
await page.screenshot({ path: 'output/lab-island-expansion/restored-bridge-and-long-city.png' });

await page.evaluate(() => {
  const world = window.labIsland;
  const state = world.getObjectState('even-hour-hotel');
  if (!state) throw new Error('Ever Hour Hotel was not found');
  world.camera.position.set(state.position.x + 20, 16, state.position.z + 24);
  world.controls.target.set(state.position.x, 3, state.position.z);
  world.controls.update();
});
await page.waitForTimeout(700);
await page.screenshot({ path: 'output/lab-island-expansion/ever-hour-neon.png' });

console.log(JSON.stringify({ sceneAudit, consoleErrors }, null, 2));
await browser.close();
