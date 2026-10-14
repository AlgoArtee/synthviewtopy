import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Actual-room temporal evidence. Numeric results do not assign a visual grade.
const output = process.env.CITY_OUTPUT ?? 'test-artifacts/north-city/revision-23/final-1';
const url = process.env.CITY_URL ?? 'http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1';
const times = ['night', 'evening', 'morning', 'day'];
const modes = ['clear', 'cloudy', 'rain', 'storm', 'snow', 'fog', 'academic-autumn', 'academic-overcast', 'academic-rainy-dusk', 'academic-foggy-night'];
const checks = [], errors = [];
const report = { capturedAt: new Date().toISOString(), source: url, checks, errors, screenshots: [], clips: [], activity: {}, weather: {} };
await mkdir(output, { recursive: true });
assert.equal((await readdir(output)).length, 0, 'Preserve earlier evidence: use a fresh CITY_OUTPUT directory');
async function hashes() {
  const names = (await readdir('src/apartments')).filter(name => /^osCity.*\.ts$/.test(name) || ['room.ts', 'roomRendering.ts', 'northCity.css'].includes(name));
  const paths = [...names.sort().map(name => `src/apartments/${name}`), 'scripts/north-city-flicker-review.mjs'];
  return Object.fromEntries(await Promise.all(paths.map(async path => [path, createHash('sha256').update(await readFile(path)).digest('hex')])));
}
const beforeHashes = await hashes();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function check(condition, description, evidence) {
  checks.push({ description, passed: Boolean(condition), ...(evidence === undefined ? {} : { evidence }) });
  if (!condition) console.error(`FAIL ${description}`);
}
function registries(snapshot) {
  return { balcony: snapshot.balconyExterior.distantNeon, north: snapshot.northWeather.distantNeon, plaza: snapshot.balconyExterior.life.flicker };
}
const browser = await chromium.launch({ headless: true, executablePath: process.env.CITY_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
let page;
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'no-preference' });
  page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  console.log('Waiting for actual room readiness');
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function' && JSON.parse(window.render_game_to_text()).ready, null, { timeout: 300000 });
  const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
  const advance = milliseconds => page.evaluate(ms => window.advanceTime(ms), milliseconds);
  async function controls() { if ((await state()).controlsCollapsed) await page.locator('#city-controls-toggle').click(); }
  async function hide() { if (!(await state()).controlsCollapsed) await page.locator('#city-controls-toggle').click(); }
  async function choose(selector, value) {
    await controls(); await page.locator(selector).selectOption(value); await page.locator(selector).focus();
    await page.keyboard.press('Enter'); await page.locator('canvas').first().focus(); await advance(150);
  }
  const setTime = value => choose('#city-time-select', value);
  const setWeather = value => choose('#city-weather-select', value);
  async function view(id) {
    await controls(); if (!(await state()).menuOpen) await page.locator('#room-menu-toggle').click();
    await page.locator(`[data-viewpoint="${id}"]`).click(); await hide(); await advance(100);
  }
  async function frame(ms = 0) {
    return page.evaluate(milliseconds => {
      window.advanceTime(milliseconds);
      return { image: document.querySelector('canvas').toDataURL('image/png').split(',')[1], state: JSON.parse(window.render_game_to_text()) };
    }, ms);
  }
  async function saveFrame(name, data) {
    await writeFile(`${output}/${name}.png`, Buffer.from(data.image, 'base64'));
    report.screenshots.push({ file: `${name}.png`, state: data.state });
    console.log(`CAPTURED ${name}`);
  }
  report.initial = await state();
  check(report.initial.ready, 'The actual WebGL room is ready');
  const options = await page.locator('#city-weather-select option').evaluateAll(elements => elements.map(element => element.value));
  check(same([...options].sort(), [...modes].sort()), 'All ten weather options remain available');
  await setWeather('clear'); await view('balcony');
  for (const time of times) {
    await setTime(time); await hide();
    const samples = [];
    for (let batch = 0; batch < 6; batch++) {
      const chunk = await page.evaluate(() => {
        const values = [];
        for (let i = 0; i < 20; i++) {
          window.advanceTime(400);
          const s = JSON.parse(window.render_game_to_text());
          values.push({ balcony: s.balconyExterior.distantNeon, north: s.northWeather.distantNeon, plaza: s.balconyExterior.life.flicker });
        }
        return values;
      });
      samples.push(...chunk);
    }
    const summaries = {};
    for (const region of ['balcony', 'north', 'plaza']) {
      const groups = samples.map(sample => sample[region]);
      assert.ok(groups[0]?.emitters?.length, `Missing actual ${region} emitters`);
      const pulses = groups.flatMap(group => group.emitters.map(entry => entry.pulse));
      const changed = groups[0].emitters.filter((entry, i) => new Set(groups.map(group => group.emitters[i].pulse)).size > 1).length;
      summaries[region] = {
        emitters: groups[0].emitters.length, samples: groups.length, changed,
        minimum: Math.min(...pulses), meanDimming: pulses.reduce((sum, pulse) => sum + 1 - pulse, 0) / pulses.length,
        dimSampleFraction: pulses.filter(pulse => pulse < .98).length / pulses.length,
        maximumSimultaneous: Math.max(...groups.map(group => group.emitters.filter(entry => entry.pulse < .98).length)),
      };
      check(groups.every(group => group.timeOfDay === time), `Actual ${region} modulation receives ${time}`);
      check(pulses.every(pulse => Number.isFinite(pulse) && pulse > 0 && pulse <= 1), `Actual ${region}/${time} emission only dims and stays finite`);
      check(changed >= Math.ceil(groups[0].emitters.length * .65), `Most local ${region}/${time} emitters participate over the 48-second sample`, summaries[region]);
      // One dimmed local emitter alongside steady neighbors establishes a
      // nonsynchronous event; rare daytime behavior need not dim three at once.
      check(groups.some(group => new Set(group.emitters.map(entry => entry.pulse)).size > 1), `Actual ${region}/${time} emitters vary independently`);
      check(summaries[region].maximumSimultaneous < summaries[region].emitters * .70, `Actual ${region}/${time} modulation stays local instead of flashing the full district`, summaries[region]);
    }
    report.activity[time] = { summaries, samples };
    console.log(`SAMPLED 48 scene seconds: ${time}`);
  }
  for (const region of ['balcony', 'north', 'plaza']) for (const time of times.filter(time => time !== 'day')) {
    const active = report.activity[time].summaries[region], day = report.activity.day.summaries[region];
    check(active.meanDimming > day.meanDimming * 2.5, `${region}/${time} has materially stronger aggregate flicker than day`, { active: active.meanDimming, day: day.meanDimming });
    check(active.dimSampleFraction > day.dimSampleFraction * 1.3, `${region}/${time} flicker is more frequent than day`, { active: active.dimSampleFraction, day: day.dimSampleFraction });
    check(active.minimum < day.minimum - .12, `${region}/${time} has deeper local dips than day`, { active: active.minimum, day: day.minimum });
  }
  await setTime('night');
  for (const mode of modes) {
    await setWeather(mode);
    const s = await state(), regs = registries(s);
    report.weather[mode] = { mode: s.weather.mode, north: s.northWeather.mode, balcony: s.balconyExterior.weather.mode, times: Object.values(regs).map(reg => reg.timeOfDay), counts: Object.values(regs).map(reg => reg.emitters.length), actual: s.weather.actual };
    check(s.weather.mode === mode && s.northWeather.mode === mode && s.balconyExterior.weather.mode === mode, `Selected weather remains synchronized: ${mode}`);
    check(Object.values(regs).every(reg => reg.timeOfDay === 'night' && reg.emitters.length > 0), `Weather changes retain time-aware local flicker: ${mode}`);
  }
  await setWeather('clear');
  // Exact canvas render and snapshot are captured in the same browser task. This
  // avoids a screenshot's asynchronous delay missing a short local voltage dip.
  async function triplet(region, viewpoint) {
    await view(viewpoint); await setTime('night'); await hide();
    let chosen, baseline, dip;
    for (let attempt = 0; attempt < 120 && !dip; attempt++) {
      const current = await frame(120), currentRegistry = registries(current.state)[region];
      if (!chosen) {
        const steady = currentRegistry.emitters.find(entry => entry.pulse > .999);
        if (steady) { chosen = steady.name; baseline = current; }
      }
      const emitter = currentRegistry.emitters.find(entry => entry.name === chosen);
      if (emitter?.pulse > .999) baseline = current;
      if (emitter?.pulse < (region === 'plaza' ? .72 : .60)) dip = current;
    }
    assert.ok(dip && baseline, `Could not find a visible-depth live event: ${region}`);
    let recovered;
    for (let i = 0; i < 30; i++) {
      const current = await frame(100);
      if (registries(current.state)[region].emitters.find(entry => entry.name === chosen).pulse > .999) { recovered = current; break; }
    }
    assert.ok(recovered, `Live emitter failed to recover: ${region}`);
    for (const [suffix, value] of [['before', baseline], ['dim', dip], ['recovered', recovered]]) await saveFrame(`${region}-night-${suffix}`, value);
    report[`${region}Event`] = { emitter: chosen, pulses: [baseline, dip, recovered].map(value => registries(value.state)[region].emitters.find(entry => entry.name === chosen).pulse), times: [baseline, dip, recovered].map(value => registries(value.state)[region].elapsed) };
  }
  await triplet('balcony', 'balcony');
  await triplet('north', 'panorama');
  for (const time of ['morning', 'day', 'evening']) { await setTime(time); await view('balcony'); await hide(); await saveFrame(`balcony-clear-${time}`, await frame()); }
  await setWeather('fog'); await setTime('night'); await hide(); await saveFrame('balcony-fog-night', await frame());
  // Native playback evidence is distinct from explicit-time samples: no manual
  // time stepping occurs while recording. Preserve the actual frame cadence.
  async function clip(region, viewpoint) {
    await setWeather('clear'); await setTime('night'); await view(viewpoint); await hide();
    const recording = await page.evaluate(async () => {
      const canvas = document.querySelector('canvas'), stream = canvas.captureStream(20);
      const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4000000 }), chunks = [], samples = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      const stopped = new Promise(resolve => { recorder.onstop = resolve; });
      recorder.start(250);
      const timer = setInterval(() => { const s = JSON.parse(window.render_game_to_text()); samples.push({ balcony: s.balconyExterior.distantNeon, north: s.northWeather.distantNeon, plaza: s.balconyExterior.life.flicker }); }, 200);
      await new Promise(resolve => setTimeout(resolve, 12000)); clearInterval(timer); recorder.stop(); await stopped; stream.getTracks().forEach(track => track.stop());
      const blob = new Blob(chunks, { type: mimeType });
      const data = await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.readAsDataURL(blob); });
      return { data, mimeType, bytes: blob.size, samples };
    });
    await writeFile(`${output}/${region}-native-12s.webm`, Buffer.from(recording.data, 'base64'));
    delete recording.data; report.clips.push({ file: `${region}-native-12s.webm`, ...recording });
    check(recording.bytes > 10000 && recording.samples.length > 5, `Actual ${region} canvas recording contains native playback and pulse samples`);
    console.log(`RECORDED ${region} native 12-second clip`);
  }
  await clip('balcony', 'balcony'); await clip('north', 'panorama');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await advance(150);
  const reducedStart = registries(await state()); await advance(30000); const reducedEnd = registries(await state());
  report.reducedMotion = { start: reducedStart, end: reducedEnd };
  for (const region of ['balcony', 'north', 'plaza']) {
    check(reducedStart[region].reducedMotion && reducedEnd[region].reducedMotion, `${region} observes reduced-motion preference`);
    check(reducedStart[region].emitters.every(entry => entry.pulse === 1) && reducedEnd[region].emitters.every(entry => entry.pulse === 1), `${region} becomes and remains steady under reduced motion`);
  }
  check(report.screenshots.length === 10, 'Ten exact actual-canvas stills captured');
} catch (error) {
  report.failure = error.stack ?? String(error);
  if (page && !page.isClosed()) await page.screenshot({ path: `${output}/failure-state.png`, timeout: 10000 }).catch(() => {});
} finally {
  const afterHashes = await hashes();
  report.changedSources = [...new Set([...Object.keys(beforeHashes), ...Object.keys(afterHashes)])].filter(path => beforeHashes[path] !== afterHashes[path]);
  check(report.changedSources.length === 0, 'Scene and capture source hashes stay unchanged', report.changedSources);
  check(errors.length === 0, 'No browser console or page errors', errors);
  await writeFile(`${output}/source-hashes.json`, JSON.stringify(beforeHashes, null, 2));
  await writeFile(`${output}/source-hashes-after.json`, JSON.stringify(afterHashes, null, 2));
  await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
assert.equal(report.failure, undefined, report.failure);
assert.equal(checks.filter(entry => !entry.passed).length, 0, 'Inspect results.json for failed checks');
console.log(JSON.stringify({ result: 'PASS', checks: checks.length, screenshots: report.screenshots.length, clips: report.clips.length, output }));
