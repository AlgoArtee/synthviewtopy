import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Actual-room evidence only: runtime checks do not assign a visual grade.
const output = process.env.CITY_OUTPUT ?? 'test-artifacts/north-city/revision-22/final-1';
const url = process.env.CITY_URL ?? 'http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1';
const captureOnly = process.env.CITY_CAPTURE_ONLY === '1';
const times = ['night', 'morning', 'day', 'evening'];
const modes = ['clear', 'cloudy', 'rain', 'storm', 'snow', 'fog', 'academic-autumn', 'academic-overcast', 'academic-rainy-dusk', 'academic-foggy-night'];
const physicalFields = ['precipitation', 'fallSpeed', 'wind', 'dropLength', 'amount', 'rainOpacity', 'snowSize'];
const checks = [], errors = [];
const report = { capturedAt: new Date().toISOString(), source: url, mode: captureOnly ? 'visual-capture-only' : 'runtime-and-visual', checks, errors, combinations: {}, screenshots: [], dynamics: {} };
if (captureOnly) {
  const priorPath = 'test-artifacts/north-city/revision-22/final-1/results.json';
  const prior = JSON.parse(await readFile(priorPath, 'utf8'));
  assert.ok(!prior.failure && prior.errors.length === 0 && prior.changedSources.length === 0 && prior.checks.every(check => check.passed));
  report.priorRuntimeEvidence = { path: priorPath, combinations: Object.keys(prior.combinations).length, checks: prior.checks.length, note: 'Billboard tile selection changed after the full runtime pass; this capture does not repeat unchanged profile or pulse tests.' };
}
const baseline = JSON.parse(await readFile('test-artifacts/north-city/revision-21/final-1b/results.json', 'utf8'));
await mkdir(output, { recursive: true });
assert.equal((await readdir(output)).length, 0, 'Use a fresh output directory; earlier evidence is immutable');
async function sourceHashes() {
  const names = (await readdir('src/apartments')).filter(name => /^osCity.*\.ts$/.test(name)
    || ['room.ts', 'roomRendering.ts', 'roomArchitecture.ts', 'liminetteRoom.ts', 'apartments.css', 'northCity.css', 'types.ts'].includes(name));
  const paths = [...names.sort().map(name => `src/apartments/${name}`), 'src/data/academicCampus.ts', 'scripts/north-city-neon-polish-review.mjs'];
  return Object.fromEntries(await Promise.all(paths.map(async path => [path, createHash('sha256').update(await readFile(path)).digest('hex')])));
}
const beforeHashes = await sourceHashes();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const near = (a, b, tolerance = .002) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < tolerance;
const physical = value => Object.fromEntries(physicalFields.map(field => [field, value[field]]));
const luma = color => { const c = String(color).replace('#', ''); return [.2126, .7152, .0722].reduce((sum, weight, i) => sum + weight * parseInt(c.slice(i * 2, i * 2 + 2), 16), 0); };
function check(condition, description, evidence) {
  checks.push({ description, passed: Boolean(condition), ...(evidence === undefined ? {} : { evidence }) });
  if (!condition) console.error(`FAIL ${description}`);
}
function distant(snapshot, outlook) {
  const value = outlook === 'balcony' ? snapshot.balconyExterior.distantNeon : snapshot.northWeather.distantNeon;
  assert.ok(value, `Missing actual distant neon snapshot for ${outlook}`);
  return value;
}
const browser = await chromium.launch({ headless: true, executablePath: process.env.CITY_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
let page;
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'no-preference' });
  page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  console.log('Waiting for live room readiness');
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function' && JSON.parse(window.render_game_to_text()).ready, null, { timeout: 300000 });
  const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
  async function controls() { if ((await state()).controlsCollapsed) await page.locator('#city-controls-toggle').click(); }
  async function hide() { if (!(await state()).controlsCollapsed) await page.locator('#city-controls-toggle').click(); }
  const advance = async (milliseconds = 500) => page.evaluate(ms => window.advanceTime(ms), milliseconds);
  async function choose(selector, value) {
    await controls(); await page.locator(selector).selectOption(value); await page.locator(selector).focus();
    await page.keyboard.press('Enter'); await page.locator('canvas').first().focus(); await advance();
  }
  const setTime = time => choose('#city-time-select', time);
  const setWeather = mode => choose('#city-weather-select', mode);
  async function view(id) {
    await controls(); if (!(await state()).menuOpen) await page.locator('#room-menu-toggle').click();
    await page.locator(`[data-viewpoint="${id}"]`).click(); await hide(); await advance(100);
  }
  async function capture(name, viewpoint, time, mode) {
    if (mode) await setWeather(mode); if (time) await setTime(time); if (viewpoint) await view(viewpoint);
    await hide(); await page.screenshot({ path: `${output}/${name}.png` });
    report.screenshots.push({ file: `${name}.png`, state: await state() }); console.log(`CAPTURED ${name}`);
  }
  report.initial = await state();
  check(report.initial.ready, 'Actual room reports ready');
  if (!captureOnly) {
  for (const mode of modes) {
    await setWeather(mode);
    const physics = [];
    for (const time of times) {
      await setTime(time);
      const snapshot = await state(), key = `${mode}/${time}`;
      report.combinations[key] = snapshot;
      const north = snapshot.northWeather, balcony = snapshot.balconyExterior.weather;
      check(snapshot.weather.mode === mode && north.mode === mode && balcony.mode === mode, `Weather selector reaches both outlooks: ${key}`);
      check(snapshot.weather.timeOfDay === time && north.timeOfDay === time && balcony.timeOfDay === time, `Time selector preserves weather and reaches both outlooks: ${key}`);
      check(same(physical(north), physical(balcony)), `Physical weather remains unified: ${key}`);
      check(same(north.atmosphere, balcony.atmosphere), `Atmosphere remains unified: ${key}`);
      const actual = snapshot.weather.actual, resolved = snapshot.weather.lighting;
      check(['ambientIntensity', 'environmentIntensity', 'exposure', 'bloomStrength', 'bloomRadius', 'bloomThreshold'].every(field => near(actual[field], resolved[field])), `Actual lights and postprocessing match selected profile: ${key}`);
      check(near(actual.fogDensity, north.atmosphere.fogDensity, 1e-8), `Actual fog retains shared density: ${key}`);
      check(same(physical(north), physical(baseline.combinations[key].northWeather)), `Revision preserves existing precipitation physics: ${key}`);
      check(snapshot.cityAudio.weather === mode, `Time and weather remain wired to ambience selection: ${key}`);
      physics.push(physical(north));
    }
    check(physics.every(value => same(value, physics[0])), `Physical weather remains independent of time: ${mode}`);
    console.log(`CHECKED ${mode}: four times`);
  }
  for (const mode of ['rain', 'storm']) {
    const day = report.combinations[`${mode}/day`].weather, previous = baseline.combinations[`${mode}/day`].weather;
    const night = report.combinations[`${mode}/night`].weather;
    check(day.actual.ambientIntensity > previous.actual.ambientIntensity * 1.2, `Day ${mode} has materially brighter actual ambient light`, { before: previous.actual.ambientIntensity, after: day.actual.ambientIntensity });
    check(luma(day.actual.sky) > luma(previous.actual.sky) * 1.15, `Day ${mode} has a brighter actual sky`, { before: previous.actual.sky, after: day.actual.sky });
    check(day.actual.ambientIntensity > night.actual.ambientIntensity * 3, `Day ${mode} remains clearly above night illumination`);
  }
  for (const mode of modes.filter(mode => !['fog', 'academic-foggy-night'].includes(mode))) {
    const actual = report.combinations[`${mode}/night`].weather.actual, previous = baseline.combinations[`${mode}/night`].weather.actual;
    check(actual.bloomStrength < previous.bloomStrength && actual.bloomRadius < previous.bloomRadius, `Non-fog night ${mode} reduces halo strength and radius`);
  }
  for (const mode of ['fog', 'academic-foggy-night']) {
    const fog = report.combinations[`${mode}/night`].weather.actual, clear = report.combinations['clear/night'].weather.actual;
    check(fog.bloomStrength > clear.bloomStrength && fog.bloomRadius > clear.bloomRadius, `Fog retains softer night emission: ${mode}`);
  }
  }

  // Ten representative condition/viewpoint frames plus one paired dynamic frame per outlook.
  for (const mode of ['rain', 'storm']) {
    await capture(`balcony-${mode}-day`, 'balcony', 'day', mode);
    await capture(`window-${mode}-day`, 'panorama', 'day', mode);
  }
  for (const mode of ['clear', 'rain', 'fog']) {
    await capture(`balcony-${mode}-night`, 'balcony', 'night', mode);
    await capture(`window-${mode}-night`, 'panorama', 'night', mode);
  }

  await setWeather('clear'); await setTime('night');
  if (!captureOnly) {
  // The agent implementing the lights provides actual material pulses in these snapshots.
  report.dynamics.samples = [];
  for (let index = 0; index < 48; index++) {
    await advance(1730);
    const snapshot = await state();
    report.dynamics.samples.push({ index, balcony: distant(snapshot, 'balcony'), north: distant(snapshot, 'north') });
  }
  for (const outlook of ['balcony', 'north']) {
    const samples = report.dynamics.samples.map(sample => sample[outlook]);
    const entries = samples[0].emitters;
    check(Array.isArray(entries) && entries.length > 3, `Actual distant emitters are exposed: ${outlook}`);
    check(new Set(entries.map(entry => JSON.stringify(entry.color))).size >= 4, `At least four distant neon colors are actually present: ${outlook}`);
    const changed = entries.filter((entry, index) => new Set(samples.map(sample => sample.emitters[index].pulse)).size > 1);
    check(changed.length >= 2, `Multiple distant emitters change over discrete live samples: ${outlook}`, { changed: changed.length, total: entries.length });
    check(samples.some(sample => new Set(sample.emitters.map(entry => entry.pulse)).size > 1), `Distant emission pulses vary independently: ${outlook}`);
    check(samples.every(sample => sample.emitters.every(entry => Number.isFinite(entry.pulse) && entry.pulse > 0 && entry.pulse <= 1.5)), `Distant light modulation stays finite and bounded: ${outlook}`);
  }
  } else await advance(9000);
  await capture('balcony-clear-night-later', 'balcony');
  await advance(6500); await capture('window-clear-night-later', 'panorama');
  if (!captureOnly) {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await advance(100);
  const reducedStart = await state(); await advance(30000); const reducedEnd = await state();
  report.dynamics.reducedMotion = { start: { north: distant(reducedStart, 'north'), balcony: distant(reducedStart, 'balcony') }, end: { north: distant(reducedEnd, 'north'), balcony: distant(reducedEnd, 'balcony') } };
  for (const outlook of ['north', 'balcony']) {
    const start = report.dynamics.reducedMotion.start[outlook], end = report.dynamics.reducedMotion.end[outlook];
    check(start.reducedMotion && end.reducedMotion, `Distant emitters observe reduced motion: ${outlook}`);
    check(same(start.emitters.map(entry => entry.pulse), end.emitters.map(entry => entry.pulse)), `Reduced motion holds distant modulation steady: ${outlook}`);
  }
  }
  check(report.screenshots.length === 12, 'Focused evidence contains twelve actual rendered views');
} catch (error) {
  report.failure = error.stack ?? String(error);
  if (page && !page.isClosed()) {
    report.failureState = await page.evaluate(() => typeof window.render_game_to_text === 'function' ? JSON.parse(window.render_game_to_text()) : { text: document.body.innerText }).catch(error => ({ error: String(error) }));
    await page.screenshot({ path: `${output}/failure-state.png`, timeout: 10000 }).catch(() => {});
  }
} finally {
  const afterHashes = await sourceHashes();
  report.changedSources = [...new Set([...Object.keys(beforeHashes), ...Object.keys(afterHashes)])].filter(path => beforeHashes[path] !== afterHashes[path]);
  check(report.changedSources.length === 0, 'Scene and capture source hashes remain unchanged during capture', report.changedSources);
  check(errors.length === 0, 'No browser errors', errors);
  await writeFile(`${output}/source-hashes.json`, JSON.stringify(beforeHashes, null, 2));
  await writeFile(`${output}/source-hashes-after.json`, JSON.stringify(afterHashes, null, 2));
  await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
assert.equal(report.failure, undefined, report.failure);
assert.equal(checks.filter(check => !check.passed).length, 0, 'Inspect results.json for failed runtime checks');
console.log(JSON.stringify({ result: 'PASS', combinations: Object.keys(report.combinations).length, checks: checks.length, screenshots: report.screenshots.length, output }));

