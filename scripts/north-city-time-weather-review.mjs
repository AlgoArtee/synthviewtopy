import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Actual-room regression and evidence capture. Numeric checks never assign a visual grade.
const output = process.env.CITY_OUTPUT ?? 'test-artifacts/north-city/revision-21/final-1';
const url = process.env.CITY_URL ?? 'http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1';
const times = ['night', 'morning', 'day', 'evening'];
const standardWeather = ['clear', 'cloudy', 'rain', 'storm', 'snow', 'fog'];
const academicWeather = ['academic-autumn', 'academic-overcast', 'academic-rainy-dusk', 'academic-foggy-night'];
const modes = [...standardWeather, ...academicWeather];
const physicalFields = ['precipitation', 'fallSpeed', 'wind', 'dropLength', 'amount', 'rainOpacity', 'snowSize'];
const errors = [], checks = [];
const report = { capturedAt: new Date().toISOString(), source: url, errors, checks, combinations: {}, screenshots: [], mobileCombinations: [] };
await mkdir(output, { recursive: true });
assert.equal((await readdir(output)).length, 0, 'Use a fresh CITY_OUTPUT directory to preserve immutable earlier evidence');

async function sourceHashes() {
  const names = (await readdir('src/apartments')).filter(name => /^osCity.*\.ts$/.test(name)
    || ['room.ts', 'roomRendering.ts', 'roomArchitecture.ts', 'liminetteRoom.ts', 'apartments.css', 'northCity.css', 'types.ts'].includes(name));
  const paths = [...names.sort().map(name => `src/apartments/${name}`), 'src/data/academicCampus.ts', 'scripts/north-city-time-weather-review.mjs'];
  return Object.fromEntries(await Promise.all(paths.map(async path => [path, createHash('sha256').update(await readFile(path)).digest('hex')])));
}
const beforeHashes = await sourceHashes();
function check(condition, description, evidence) {
  checks.push({ description, passed: Boolean(condition), ...(evidence === undefined ? {} : { evidence }) });
  if (!condition) console.error(`FAIL ${description}`);
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const near = (a, b, tolerance = .002) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < tolerance;
const physical = value => Object.fromEntries(physicalFields.map(field => [field, value[field]]));

// Bound to the runtime's emitted-light snapshot once the revision-21 contract is frozen.
function lighting(snapshot) {
  assert.ok(snapshot.weather?.lighting && snapshot.weather?.actual, 'Revision 21 must expose resolved lighting and actual scene lighting');
  assert.ok(snapshot.northWeather?.lighting && snapshot.balconyExterior?.lighting, 'Both exterior snapshots must expose emitted lighting');
  return { resolved: snapshot.weather.lighting, actual: snapshot.weather.actual, north: snapshot.northWeather.lighting, balcony: snapshot.balconyExterior.lighting };
}
function signEmission(registry, outlook) {
  const name = outlook === 'north' ? 'North city masked sign lettering and icons' : 'Masked business sign lettering and borders';
  const material = registry.materials.find(entry => entry.name === name);
  assert.ok(material && Number.isFinite(material.emission), `Missing actual masked sign emission: ${outlook}`);
  return material.emission;
}
function checkEmitters(registry, key, outlook, atmosphere) {
  check(registry.timeOfDay === key.split('/')[1] && registry.weather === key.split('/')[0], `Emitter registry follows selected time and weather: ${outlook}/${key}`);
  check(registry.emissionOnlyFog && near(registry.bodyFogDensity, atmosphere.fogDensity, 1e-8) && near(registry.neonFogDensity, atmosphere.neonFogDensity, 1e-8), `Body and emission fog use the actual shared settings: ${outlook}/${key}`);
  const multiplierKeys = { neon: 'neonIntensity', window: 'windowGlow', fixture: 'fixtureIntensity', surface: 'surfaceAmbient' };
  const numeric = registry.materials.filter(material => material.emission !== null);
  check(numeric.length > 0 && numeric.every(material => near(material.emission, material.baseEmission * registry.multipliers[multiplierKeys[material.kind]] * material.pulse)), `Actual material emission follows selected lighting and pulse: ${outlook}/${key}`);
  check(registry.materials.every(material => material.fog), `Registered exterior emission retains atmospheric attenuation: ${outlook}/${key}`);
  const name = outlook === 'north' ? 'North city masked sign lettering and icons' : 'Masked business sign lettering and borders';
  check(registry.materials.find(material => material.name === name)?.emissiveMap, `Sign emission is masked to its lettering and icons: ${outlook}/${key}`);
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CITY_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
let page;
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'no-preference' });
  await context.addInitScript(() => {
    const Original = window.AudioContext;
    window.__audioContexts = [];
    if (Original) window.AudioContext = class extends Original {
      constructor(...args) { super(...args); window.__audioContexts.push(this); }
    };
  });
  page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  console.log('Waiting for live room readiness (up to 300 seconds)');
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function' && JSON.parse(window.render_game_to_text()).ready, null, { timeout: 300000 });
  console.log('Live room ready');
  const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
  async function controls() { if ((await state()).controlsCollapsed) await page.locator('#city-controls-toggle').click(); }
  async function hide() { if (!(await state()).controlsCollapsed) await page.locator('#city-controls-toggle').click(); }
  async function advance(milliseconds = 500) { await page.evaluate(ms => window.advanceTime(ms), milliseconds); }
  async function choose(selector, value) {
    await controls();
    await page.locator(selector).selectOption(value);
    await page.locator(selector).focus();
    await page.keyboard.press('Enter');
    await page.locator('canvas').first().focus();
    // Tilt-and-turn first closes the other articulation; 500 ms can sample that intermediate state.
    await advance(selector === '#city-window-select' ? 3000 : 500);
  }
  async function setTime(time) { await choose('#city-time-select', time); }
  async function setWeather(mode) { await choose('#city-weather-select', mode); }
  async function setDoor(mode) { await choose('#city-balcony-door-select', mode); await advance(3000); }
  async function view(id) {
    await controls();
    if (!(await state()).menuOpen) await page.locator('#room-menu-toggle').click();
    await page.locator(`[data-viewpoint="${id}"]`).click();
    await hide();
    await advance(100);
  }
  async function capture(name, viewpoint, time, mode) {
    if (mode) await setWeather(mode);
    if (time) await setTime(time);
    if (viewpoint) await view(viewpoint);
    await hide();
    await page.screenshot({ path: `${output}/${name}.png` });
    report.screenshots.push({ file: `${name}.png`, state: await state() });
    console.log(`CAPTURED ${name}`);
  }
  async function audible() {
    await page.waitForFunction(() => {
      const audio = JSON.parse(window.render_game_to_text()).cityAudio;
      return audio.ready && audio.contextState === 'running' && audio.rms > 1e-6;
    }, null, { timeout: 45000 });
  }
  async function mute(value) {
    await controls();
    if ((await state()).cityAudio.muted !== value) await page.locator('#city-sound-toggle').click();
  }

  await controls();
  report.initial = await state();
  check(report.initial.weather.timeOfDay === 'day' && report.initial.weather.mode === 'rain', 'Fresh room initializes to independent day/rain state');
  report.options = await page.evaluate(() => ({
    time: [...document.querySelector('#city-time-select').options].map(option => option.value),
    weather: [...document.querySelector('#city-weather-select').options].map(option => option.value),
    groups: [...document.querySelector('#city-weather-select').querySelectorAll('optgroup')].map(group => ({ label: group.label, values: [...group.children].map(option => option.value) })),
  }));
  check(same(report.options.time, times), 'Four independent time-of-day choices are available', report.options.time);
  check(same([...report.options.weather].sort(), [...modes].sort()), 'All ten original weather IDs remain available');
  check(report.options.groups.some(group => /dark\s*academia/i.test(group.label) && same([...group.values].sort(), [...academicWeather].sort())), 'The four Dark Academia presets are grouped and remain distinct');

  // Functional audio checks exercise the real UI. No audio-listening claim is made.
  await setWeather('rain'); await setTime('night'); await view('balcony-door');
  await choose('#city-window-select', 'closed'); await setDoor('closed'); await mute(false);
  await page.waitForTimeout(1600);
  report.audio = { closed: await state() };
  check(report.audio.closed.balconyDoor.openFraction < .001, 'Closed balcony door covers the aperture');
  check(report.audio.closed.cityAudio.targetGain === 0 && report.audio.closed.cityAudio.rms === 0, 'Both closed apertures silence indoor sound');
  await setDoor('half'); await audible(); report.audio.half = await state();
  check(near(report.audio.half.balconyDoor.openFraction, .5), 'Half-open door reaches its physical midpoint');
  check(report.audio.half.cityAudio.doorOpening > 0 && report.audio.half.cityAudio.windowOpening === 0, 'Door admits sound independently of the north window');
  await setDoor('open'); await audible(); report.audio.open = await state();
  check(near(report.audio.open.balconyDoor.openFraction, 1), 'Fully open balcony door clears its aperture');
  check(report.audio.open.cityAudio.targetGain > report.audio.half.cityAudio.targetGain, 'Open door admits more sound than half-open');
  check(report.audio.open.cityAudio.lowpassHz > report.audio.half.cityAudio.lowpassHz, 'Half opening filters sound more strongly than full opening');
  for (const time of times) {
    await setTime(time); await audible();
    const current = await state();
    check(current.cityAudio.weather === 'rain' && near(current.cityAudio.targetGain, report.audio.open.cityAudio.targetGain), `Changing time preserves the selected rain ambience and aperture gain: ${time}`);
  }
  await setDoor('closed'); await choose('#city-window-select', 'open'); await audible(); report.audio.windowOnly = await state();
  check(report.audio.windowOnly.cityAudio.windowOpening > .999 && report.audio.windowOnly.cityAudio.doorOpening < .001, 'North window retains independent sound admission');
  await choose('#city-window-select', 'tilt'); await audible(); report.audio.tilt = await state();
  check(near(report.audio.tilt.cityAudio.windowOpening, .34) && report.audio.tilt.cityAudio.targetGain < report.audio.windowOnly.cityAudio.targetGain, 'Tilted north window retains quieter admission');
  await choose('#city-window-select', 'closed'); await setDoor('open'); await view('balcony'); await audible();
  await setDoor('closed'); await audible(); report.audio.outside = await state();
  check(report.audio.outside.cityAudio.listenerOutside && report.audio.outside.cityAudio.targetGain > 0, 'Closing the door behind an outdoor listener does not mute the city');
  await mute(true); await page.waitForTimeout(1600);
  check((await state()).cityAudio.rms === 0, 'Mute silences actual analyser output');
  await controls();
  await page.locator('#city-sound-volume').evaluate(input => { input.value = '27'; input.dispatchEvent(new Event('input', { bubbles: true })); });
  check((await state()).cityAudio.volume === .27, 'Volume control remains functional');
  report.savedAudio = await page.evaluate(() => JSON.parse(localStorage.getItem('north-city-ambience')));
  check(report.savedAudio.volume === .27, 'Audio preference is persisted');
  await setDoor('open');

  // One actual running scene; no separately constructed test scene or resolver-only metrics.
  for (const mode of modes) {
    await setWeather(mode);
    const profiles = [];
    for (const time of times) {
      await setTime(time);
      const snapshot = await state(), key = `${mode}/${time}`;
      report.combinations[key] = snapshot;
      const north = snapshot.northWeather, balcony = snapshot.balconyExterior.weather;
      check(snapshot.weather.mode === mode && north.mode === mode && balcony.mode === mode && snapshot.cityAudio.weather === mode, `Selected weather reaches both outlooks and audio: ${key}`);
      check(snapshot.weather.timeOfDay === time && north.timeOfDay === time && balcony.timeOfDay === time, `Selected time reaches the room and both outlooks: ${key}`);
      check(north.sharedWeather && balcony.sharedWeather, `Outlooks share the weather model: ${key}`);
      for (const field of [...physicalFields, 'lightning', 'atmosphere']) check(same(north[field], balcony[field]), `North and balcony agree on ${field}: ${key}`);
      check(north.atmosphere.timeOfDay === time, `Atmosphere identifies the selected time: ${key}`);
      check(near(snapshot.weather.fogDensity, north.atmosphere.fogDensity, 1e-8), `Scene and outlook fog density agree: ${key}`);
      check(snapshot.balconyExterior.snowAccumulation.visible === (mode === 'snow'), `Snow accumulation follows weather, independently of time: ${key}`);
      check(balcony.observedMinX === null || balcony.observedMinX >= 5.07999, `Precipitation stays outside the covered terrace: ${key}`);
      const light = lighting(snapshot);
      check(near(light.actual.fogDensity, north.atmosphere.fogDensity, 1e-8), `Emitted scene fog uses the shared atmosphere: ${key}`);
      check(light.actual.fogColor === light.actual.sky, `Emitted fog and sky color agree: ${key}`);
      check(Number.isFinite(light.actual.sunIntensity) && Number.isFinite(light.actual.ambientIntensity) && Number.isFinite(light.actual.windowIntensity), `Actual light intensities are finite: ${key}`);
      check(Array.isArray(light.actual.sunPosition) && light.actual.sunPosition.length === 3 && light.actual.sunPosition.every(Number.isFinite), `Actual sun transform is exposed: ${key}`);
      check(same(light.actual.sunPosition, light.resolved.sunPosition) && same(light.actual.sunTarget, light.resolved.sunTarget), `Actual sun and shadow direction follow the resolved time: ${key}`);
      check(near(light.actual.shadowRadius, light.resolved.shadowRadius) && near(light.actual.shadowFar, light.resolved.shadowFar), `Actual shadow softness and extent follow resolved lighting: ${key}`);
      for (const field of ['ambientIntensity', 'environmentIntensity', 'exposure', 'bloomStrength', 'bloomRadius', 'bloomThreshold']) check(near(light.actual[field], light.resolved[field]), `Renderer/light ${field} follows the selected combination: ${key}`);
      check(light.actual.sunIntensity >= snapshot.weather.daylightIntensity - .002, `Actual sunlight matches the base or the active storm pulse: ${key}`);
      if (mode !== 'storm') check(near(light.actual.sunIntensity, snapshot.weather.daylightIntensity), `Non-storm sunlight matches the resolved intensity: ${key}`);
      checkEmitters(light.north, key, 'north', north.atmosphere);
      checkEmitters(light.balcony, key, 'balcony', north.atmosphere);
      profiles.push(physical(north));
    }
    check(profiles.every(profile => same(profile, profiles[0])), `Time changes illumination without changing physical precipitation: ${mode}`);
    console.log(`CHECKED ${mode}: four times`);
  }
  const clear = Object.fromEntries(times.map(time => [time, lighting(report.combinations[`clear/${time}`])]));
  check(new Set(times.map(time => clear[time].actual.sky)).size === 4, 'All four clear times emit distinct sky colors');
  check(new Set(times.map(time => JSON.stringify(clear[time].actual.sunPosition))).size === 4, 'All four clear times emit distinct sun positions');
  check(clear.day.actual.sunIntensity > clear.night.actual.sunIntensity, 'Day emits stronger direct illumination than night');
  check(clear.morning.actual.shadowEnabled && clear.day.actual.shadowEnabled && clear.evening.actual.shadowEnabled, 'Morning/day/evening use the actual shadow-casting daylight');
  for (const outlook of ['north', 'balcony']) {
    check(signEmission(clear.night[outlook], outlook) > signEmission(clear.day[outlook], outlook), `Actual night sign emission exceeds daytime emission: ${outlook}`);
    check(signEmission(clear.evening[outlook], outlook) > signEmission(clear.day[outlook], outlook), `Actual evening sign emission exceeds daytime emission: ${outlook}`);
    check(signEmission(lighting(report.combinations['fog/day'])[outlook], outlook) > signEmission(clear.day[outlook], outlook), `Actual day-fog sign emission exceeds clear daylight: ${outlook}`);
  }

  // 24 representative screenshots, with production camera/FOV and actual weather/time UI.
  for (const time of times) {
    await capture(`balcony-clear-${time}`, 'balcony', time, 'clear');
    await capture(`window-clear-${time}`, 'panorama', time, 'clear');
  }
  for (const time of times) await capture(`balcony-fog-${time}`, 'balcony', time, 'fog');
  for (const time of times) await capture(`balcony-academic-autumn-${time}`, 'balcony', time, 'academic-autumn');
  await capture('balcony-rain-night', 'balcony', 'night', 'rain');
  await capture('balcony-snow-day', 'balcony', 'day', 'snow');
  await capture('balcony-storm-evening', 'balcony', 'evening', 'storm');
  await capture('balcony-ceiling-morning', 'balcony-ceiling', 'morning', 'clear');
  await capture('interior-evening', 'sleep', 'evening', 'clear');
  await capture('balcony-door-night', 'balcony-door', 'night', 'rain');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [time, mode] of [['night', 'rain'], ['morning', 'academic-autumn'], ['day', 'snow'], ['evening', 'fog']]) {
    await setTime(time); await setWeather(mode);
    const snapshot = await state();
    check(snapshot.weather.timeOfDay === time && snapshot.weather.mode === mode, `Time/weather controls remain usable with reduced motion: ${time}/${mode}`);
  }
  await setDoor('half'); check(near((await state()).balconyDoor.openFraction, .5), 'Half-open door remains usable with reduced motion'); await setDoor('open');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [time, mode] of [['night', 'rain'], ['morning', 'academic-autumn'], ['day', 'snow'], ['evening', 'fog']]) {
    await setTime(time); await setWeather(mode); await controls();
    const snapshot = await state();
    const fit = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, controls: {} }));
    for (const id of ['city-time-select', 'city-weather-select', 'city-balcony-door-select']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      fit.controls[id] = await page.locator(`#${id}`).evaluate(element => element.getBoundingClientRect().toJSON());
    }
    report.mobileCombinations.push({ time, mode, fit, weather: snapshot.weather });
    check(snapshot.weather.timeOfDay === time && snapshot.weather.mode === mode, `Phone controls select the requested independent combination: ${time}/${mode}`);
    check(fit.width === fit.scrollWidth, `Phone controls do not overflow horizontally: ${time}/${mode}`);
    for (const [id, box] of Object.entries(fit.controls)) check(box.x >= 0 && box.right <= 390 && box.top >= 0 && box.bottom <= 844, `Phone ${id} is reachable within its scroll panel: ${time}/${mode}`);
  }
  await setTime('evening'); await setWeather('academic-autumn'); await controls();
  await page.locator('#city-time-select').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/mobile-controls.png` }); report.screenshots.push({ file: 'mobile-controls.png', state: await state() });
  await capture('mobile-balcony-evening', 'balcony');
  check(report.screenshots.length === 24, 'Compact evidence set contains 24 representative screenshots');
  await hide(); check(!(await page.locator('#city-time-select').isVisible()), 'Collapsing controls hides the time selector');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  await page.waitForFunction(() => window.__audioContexts.every(context => context.state === 'closed'));
  check(true, 'Actual audio contexts close on room disposal');
} catch (error) {
  report.failure = error.stack ?? String(error);
  if (page && !page.isClosed()) {
    report.failureState = await page.evaluate(() => typeof window.render_game_to_text === 'function' ? JSON.parse(window.render_game_to_text()) : { text: document.body.innerText }).catch(error => ({ error: String(error) }));
    await page.screenshot({ path: `${output}/failure-state.png`, timeout: 10000 }).catch(() => {});
  }
} finally {
  const afterHashes = await sourceHashes();
  report.changedSources = [...new Set([...Object.keys(beforeHashes), ...Object.keys(afterHashes)])].filter(path => beforeHashes[path] !== afterHashes[path]);
  check(report.changedSources.length === 0, 'Source hashes remain unchanged during actual capture', report.changedSources);
  check(errors.length === 0, 'No browser errors', errors);
  await writeFile(`${output}/source-hashes.json`, JSON.stringify(beforeHashes, null, 2));
  await writeFile(`${output}/source-hashes-after.json`, JSON.stringify(afterHashes, null, 2));
  await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
assert.equal(report.failure, undefined, report.failure);
assert.equal(checks.filter(check => !check.passed).length, 0, 'Runtime checks failed; inspect results.json');
console.log(JSON.stringify({ result: 'PASS', combinations: Object.keys(report.combinations).length, checks: checks.length, screenshots: report.screenshots.length, output }));
