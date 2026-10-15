import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = 'test-artifacts/north-city/revision-49/native';
await mkdir(output, { recursive: true });
const report = { checks: [], errors: [], captures: [] };
console.log('Launching browser');
const check = (condition, name, evidence) => { report.checks.push({ passed: !!condition, name, evidence }); assert.ok(condition, name); };
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
console.log('Browser launched');
const page = await context.newPage(); page.setDefaultTimeout(60000);
page.on('pageerror', e => { report.errors.push(e.message); console.error(e.message); });
page.on('console', m => { if (m.type() === 'error') { report.errors.push(m.text()); console.error(m.text()); } });
try {
  await page.route(/\/src\/apartments\/room\.ts(?:\?.*)?$/, async route => {
    const response = await route.fetch(), source = await response.text();
    await route.fulfill({ response, body: source.replace('await room.ready;', 'await room.ready; window.__qaRoom=room;') });
  });
  await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment', { waitUntil: 'domcontentloaded', timeout: 120000 });
  console.log('Document loaded');
  const ready = () => page.waitForFunction(() => window.render_game_to_text && JSON.parse(window.render_game_to_text()).ready, null, { timeout: 300000 });
  await ready(); console.log('Room ready');
  const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
  const show = async () => { if ((await state()).controlsCollapsed) await page.locator('#city-controls-toggle').click(); };
  const select = async value => { await show(); await page.locator('#city-holiday-select').selectOption(value); };
  const view = async id => { await show(); await page.locator('#room-menu-toggle').click(); await page.locator(`[data-viewpoint="${id}"]`).click(); };
  const shot = async name => {
    if (!(await state()).controlsCollapsed) await page.locator('#city-controls-toggle').click();
    await page.screenshot({ path: `${output}/${name}.png` }); report.captures.push(name); console.log('Captured ' + name);
  };
  const advance = ms => page.evaluate(ms => window.advanceTime(ms), ms);
  check(!(await state()).plazaHolograms.seasonalProjection.active, 'Everyday scene starts without pumpkin');
  // A deliberately non-default mix must survive the entire holiday/reload cycle.
  await page.evaluate(() => { const h = window.__qaRoom.plazaHolograms; h.solo('phoenix'); h.setLevel('snow', 35); h.setSettings({ size: 82, brightness: 93, animated: false }); });
  await advance(2000);
  const settings = (await state()).plazaHolograms.settings;
  const weather = (await state()).weather;
  await select('halloween');
  const initial = (await state()).plazaHolograms;
  check(initial.seasonalProjection.active && initial.active.length === 0, 'Halloween replaces the everyday projection', initial.seasonalProjection);
  check(JSON.stringify(initial.settings) === JSON.stringify(settings), 'Holiday preserves every mixer setting');
  check([41.8, -37.31, -5].every((v, i) => Math.abs(v - initial.seasonalProjection.origin[i]) < .0001), 'Beam starts on the actual central chip', initial.seasonalProjection.origin);
  check(JSON.stringify((await state()).weather) === JSON.stringify(weather), 'Holiday preserves weather and time');
  await view('balcony-plaza'); await advance(1000); await shot('pumpkin-day-balcony');
  await show(); await page.locator('#city-time-select').selectOption('night'); await shot('pumpkin-night-balcony');
  const t = (await state()).plazaHolograms.seasonalProjection.animationTime;
  await advance(2000);
  check((await state()).plazaHolograms.seasonalProjection.animationTime > t, 'Seasonal projection animates independently of paused everyday mix');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const frozen = (await state()).plazaHolograms.seasonalProjection.animationTime;
  await advance(2000);
  check((await state()).plazaHolograms.seasonalProjection.animationTime === frozen, 'Reduced motion freezes the pumpkin, scan and beams');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await select('none'); await advance(2000);
  const restored = (await state()).plazaHolograms;
  check(!restored.seasonalProjection.active && restored.active.length === 2, 'None removes pumpkin and restores both everyday projections', restored.active);
  check(JSON.stringify(restored.settings) === JSON.stringify(settings), 'Restoration retains exact mix, brightness, size and pause');
  const hiddenTime = restored.seasonalProjection.animationTime; await advance(2000);
  check((await state()).plazaHolograms.seasonalProjection.animationTime === hiddenTime, 'Inactive pumpkin stops animating');
  await shot('everyday-mix-restored');
  await select('halloween'); await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 }); await ready();
  check((await state()).plazaHolograms.seasonalProjection.active && (await state()).holidays.holiday === 'halloween', 'Saved Halloween restores the pumpkin on reload');
  check(JSON.stringify((await state()).plazaHolograms.settings) === JSON.stringify(settings), 'Reload retains the original everyday mix');
  await view('balcony-plaza'); await show(); await page.locator('#city-weather-select').selectOption('fog'); await shot('pumpkin-fog');
  check((await state()).plazaHolograms.seasonalProjection.active, 'Weather changes preserve holiday projection');
  await page.locator('#city-controls-toggle').click(); await page.locator('#city-weather-select').selectOption('rain');
  await page.setViewportSize({ width: 390, height: 844 }); await shot('pumpkin-mobile');
  await select('none'); check(!(await state()).plazaHolograms.seasonalProjection.active, 'Mobile holiday selector disables the projection');
  await page.setViewportSize({ width: 1440, height: 1000 }); await select('halloween');
  await shot('final-pumpkin');
  report.final = (await state()).plazaHolograms;
  const disposed = await page.evaluate(() => {
    const room = window.__qaRoom, root = room.scene.getObjectByName('Halloween · central chip robot pumpkin projection');
    const geometries = new Set(), materials = new Set();
    root.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); });
    let geometryCount = 0, materialCount = 0;
    geometries.forEach(g => g.addEventListener('dispose', () => geometryCount++));
    materials.forEach(m => m.addEventListener('dispose', () => materialCount++));
    room.dispose();
    return { geometryCount, materialCount, expectedGeometries: geometries.size, expectedMaterials: materials.size };
  });
  check(disposed.geometryCount === disposed.expectedGeometries && disposed.materialCount === disposed.expectedMaterials, 'Room disposal releases all pumpkin resources exactly once', disposed);
  check(report.errors.length === 0, 'No browser or WebGL errors', report.errors);
} catch (e) { report.failure = e.stack; await page.screenshot({ path: `${output}/failure.png`, timeout: 10000 }).catch(() => {}); }
finally { await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2)); await browser.close(); }
console.log(JSON.stringify(report, null, 2)); assert.equal(report.failure, undefined);
