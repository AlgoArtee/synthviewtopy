import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

// This run deliberately never calls the application's manual-time API. Native
// playback at the user's CSS viewport is the primary evidence. Pixel metrics
// describe predetermined regions; they do not award a visual acceptance grade.
const output = process.env.CITY_OUTPUT ?? 'test-artifacts/north-city/revision-25/final-1';
const skipMotionRegression = process.env.CITY_SKIP_MOTION_REGRESSION === '1';
const url = process.env.CITY_URL ?? 'http://127.0.0.1:5178/room.html?id=os-city-apartment';
const viewport = {width: 951, height: 892};
const errors = [], checks = [];
const report = {capturedAt: new Date().toISOString(), source: url, viewport, errors, checks, nativeRuns: [], screenshots: [], manualTimeAdvancement: false};
// Fixed before observing this revision's animation; no brightest-window/event search.
const regions = [
  {name: 'upper-left distant windows', x: 22, y: 12, w: 265, h: 145},
  {name: 'upper-center distant windows', x: 340, y: 12, w: 265, h: 145},
  {name: 'upper-right distant windows', x: 660, y: 12, w: 265, h: 145},
  {name: 'central storefront sign', x: 292, y: 276, w: 335, h: 57},
  {name: 'right storefront sign', x: 703, y: 284, w: 226, h: 66},
];
report.predeterminedRegions = regions;
await mkdir(output, {recursive: true});
assert.equal((await readdir(output)).length, 0, 'Preserve earlier evidence: use a fresh CITY_OUTPUT');
async function hashes() {
  const names = (await readdir('src/apartments')).filter(n => /^osCity.*\.ts$/.test(n) || ['room.ts', 'roomRendering.ts', 'northCity.css'].includes(n));
  const paths = [...names.sort().map(n => `src/apartments/${n}`), 'scripts/north-city-animation-visibility-review.mjs'];
  return Object.fromEntries(await Promise.all(paths.map(async path => [path, createHash('sha256').update(await readFile(path)).digest('hex')])));
}
const beforeHashes = await hashes();
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function check(passed, description, evidence) {
  checks.push({passed: !!passed, description, ...(evidence === undefined ? {} : {evidence})});
  if (!passed) console.error(`FAIL ${description}`);
}
const browser = await chromium.launch({headless: true, executablePath: process.env.CITY_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--ignore-gpu-blocklist']});
let page;
try {
  // No preference override for the main run: record and verify the actual default.
  const context = await browser.newContext({viewport, deviceScaleFactor: 1});
  async function ready(context, label) {
    const p = await context.newPage();
    p.on('pageerror', e => errors.push(`${label}: ${e.message}`));
    p.on('console', m => {if (m.type() === 'error') errors.push(`${label}: ${m.text()}`);});
    await p.goto(url, {waitUntil: 'domcontentloaded', timeout: 120000});
    console.log(`Waiting for ready native room: ${label}`);
    await p.waitForFunction(() => window.render_game_to_text && JSON.parse(window.render_game_to_text()).ready, null, {timeout: 300000});
    return p;
  }
  page = await ready(context, 'normal');
  const state = p => p.evaluate(() => JSON.parse(window.render_game_to_text()));
  async function controls(p) {if ((await state(p)).controlsCollapsed) await p.locator('#city-controls-toggle').click();}
  async function hide(p) {if (!(await state(p)).controlsCollapsed) await p.locator('#city-controls-toggle').click();}
  async function choose(p, selector, value) {
    await controls(p); await p.locator(selector).selectOption(value); await p.locator(selector).focus();
    await p.keyboard.press('Enter'); await p.locator('canvas').first().focus(); await hide(p);
    await p.waitForTimeout(150);
  }
  async function view(p, id) {
    await controls(p); if (!(await state(p)).menuOpen) await p.locator('#room-menu-toggle').click();
    await p.locator(`[data-viewpoint="${id}"]`).click(); await hide(p); await p.waitForTimeout(150);
  }
  const balcony = p => view(p, 'balcony');
  report.initial = await page.evaluate(() => {
    const canvas = document.querySelector('canvas'), rect = canvas.getBoundingClientRect();
    return {state: JSON.parse(window.render_game_to_text()), reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      hidden: document.hidden, css: {width: rect.width, height: rect.height}, backing: {width: canvas.width, height: canvas.height}, devicePixelRatio};
  });
  check(report.initial.state.ready, 'Actual WebGL room is ready');
  check(report.initial.css.width === viewport.width && report.initial.css.height === viewport.height, 'Main proof matches the actual 951×892 CSS viewport', report.initial);
  check(!report.initial.reducedMotion && !report.initial.hidden, 'Default main context matches observed visible, motion-enabled user session');
  check(report.initial.state.animation?.clock === 'visible-wall-time', 'Room exposes the new native city-clock diagnostic');
  assert.ok(!report.initial.reducedMotion, 'Main default context unexpectedly reduces motion; do not silently override the user-session condition');
  await choose(page, '#city-weather-select', 'clear'); await balcony(page);

  async function nativeRun(time) {
    await choose(page, '#city-time-select', time);
    const recording = await page.evaluate(async time => {
      const canvas = document.querySelector('canvas');
      const compact = () => {
        const s = JSON.parse(window.render_game_to_text());
        return {animation: s.animation, view: s.view, look: s.look, position: s.position,
          tv: {balcony: s.balconyExterior.tvWindows, north: s.northWeather.tvWindows},
          flicker: {balcony: s.balconyExterior.distantNeon, north: s.northWeather.distantNeon, plaza: s.balconyExterior.life.flicker}};
      };
      const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
      const stream = canvas.captureStream(20), recorder = new MediaRecorder(stream, {mimeType, videoBitsPerSecond: 4500000});
      const chunks = [], samples = [], frames = [], started = performance.now();
      recorder.ondataavailable = e => {if (e.data.size) chunks.push(e.data);};
      const stopped = new Promise(resolve => {recorder.onstop = resolve;});
      recorder.start(250);
      const timer = setInterval(() => samples.push({wallSeconds: (performance.now() - started) / 1000, ...compact()}), 125);
      for (const targetSeconds of [0, 3, 6, 9, 12]) {
        const remaining = targetSeconds * 1000 - (performance.now() - started);
        if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
        frames.push({targetSeconds, wallSeconds: (performance.now() - started) / 1000, image: canvas.toDataURL('image/png').split(',')[1], state: compact()});
      }
      clearInterval(timer); recorder.stop(); await stopped; stream.getTracks().forEach(track => track.stop());
      const blob = new Blob(chunks, {type: mimeType}), data = await new Promise(resolve => {const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.readAsDataURL(blob);});
      return {timeOfDay: time, wallSeconds: (performance.now() - started) / 1000, mimeType, bytes: blob.size, data, samples, frames};
    }, time);
    const frames = recording.frames;
    for (const frame of frames) {
      const file = `balcony-${time}-native-${frame.targetSeconds}s.png`;
      await writeFile(`${output}/${file}`, Buffer.from(frame.image, 'base64'));
      report.screenshots.push({file, wallSeconds: frame.wallSeconds, state: frame.state});
    }
    const pixelEvidence = await page.evaluate(async ({frames, regions}) => {
      const images = [];
      for (const frame of frames) {const image = new Image(); image.src = `data:image/png;base64,${frame.image}`; await image.decode(); const c = document.createElement('canvas'); c.width = image.width; c.height = image.height; c.getContext('2d').drawImage(image, 0, 0); images.push(c.getContext('2d').getImageData(0, 0, c.width, c.height));}
      return regions.map(region => {
        const luma = data => {const out = []; for (let y = region.y; y < region.y + region.h; y++) for (let x = region.x; x < region.x + region.w; x++) {const i = (y * data.width + x) * 4; out.push(.2126 * data.data[i] + .7152 * data.data[i + 1] + .0722 * data.data[i + 2]);} return out;};
        const samples = images.map(luma), base = samples[0];
        return {region, comparisons: samples.slice(1).map((values, index) => {const differences = values.map((v, i) => Math.abs(v - base[i])); return {targetSeconds: frames[index + 1].targetSeconds, rms: Math.sqrt(differences.reduce((s, x) => s + x * x, 0) / differences.length), changedOver8: differences.filter(x => x > 8).length, changedOver20: differences.filter(x => x > 20).length, totalPixels: differences.length};})};
      });
    }, {frames, regions});
    const first = frames[0].state, last = frames.at(-1).state, wallDelta = frames.at(-1).wallSeconds - frames[0].wallSeconds;
    const roomDelta = last.animation.elapsedSeconds - first.animation.elapsedSeconds;
    check(roomDelta / wallDelta > .8 && roomDelta / wallDelta < 1.2, `${time}: native city clock follows visible wall time`, {wallDelta, roomDelta, ratio: roomDelta / wallDelta});
    check(recording.samples.every(s => !s.animation.documentHidden && !s.animation.reducedMotion), `${time}: native proof stays visible with motion enabled`);
    check(recording.samples.every(s => s.animation.lastNavigationStepSeconds <= .050001), `${time}: navigation retains bounded collision steps`);
    check(recording.samples.every(s => s.view === 'balcony' && equal(s.look, first.look) && equal(s.position, first.position)), `${time}: camera stays fixed during predetermined captures`);
    for (const region of ['balcony', 'north']) {
      const a = first.tv[region], b = last.tv[region];
      check(b.elapsed - a.elapsed > wallDelta * .8, `${time}: ${region} TV clock advances natively`);
      check(!equal(a.samples, b.samples), `${time}: ${region} TV shadow samples change natively`);
      check(Math.abs(a.coverage - .4) < .015, `${time}: ${region} preserves roughly 40% selected windows`);
    }
    for (const region of ['balcony', 'north', 'plaza']) {
      const values = recording.samples.flatMap(s => s.flicker[region].emitters.map(e => e.pulse));
      check(Math.min(...values) < .85, `${time}: ${region} has at least one native local flicker event`, {minimum: Math.min(...values), sampledPulses: values.length});
    }
    check(recording.bytes > 10000 && recording.samples.length > 20, `${time}: native recording contains real rendered frames and telemetry`);
    const file = `balcony-${time}-native-12s.webm`;
    await writeFile(`${output}/${file}`, Buffer.from(recording.data, 'base64'));
    delete recording.data; delete recording.frames;
    report.nativeRuns.push({...recording, file, frames: frames.map(({image, ...rest}) => rest), pixelEvidence});
    console.log(`CAPTURED native ${time}: five unzoomed frames, one clip, clock ratio ${(roomDelta / wallDelta).toFixed(3)}`);
  }
  await nativeRun('evening'); await nativeRun('night');
  await choose(page, '#city-time-select', 'evening'); await view(page, 'panorama');
  report.northEvening = [];
  for (const seconds of [0, 4]) {
    if (seconds) await page.waitForTimeout(seconds * 1000);
    const value = await page.evaluate(() => ({image: document.querySelector('canvas').toDataURL('image/png').split(',')[1], state: JSON.parse(window.render_game_to_text())}));
    const file = `north-evening-native-${seconds}s.png`;
    await writeFile(`${output}/${file}`, Buffer.from(value.image, 'base64'));
    report.screenshots.push({file, state: value.state}); report.northEvening.push({file, state: value.state});
  }
  check(!equal(report.northEvening[0].state.northWeather.tvWindows.samples, report.northEvening[1].state.northWeather.tvWindows.samples), 'North evening TV changes during ordinary native playback');
  await balcony(page);
  await choose(page, '#city-time-select', 'day');
  const day = await state(page); report.day = day;
  for (const region of ['balcony', 'north']) {
    const value = region === 'balcony' ? day.balconyExterior.tvWindows : day.northWeather.tvWindows;
    const night = report.nativeRuns.find(r => r.timeOfDay === 'night').frames[0].state.tv[region];
    check(value.timeOfDay === 'day' && value.strength < night.strength, `${region}: daytime TV wash remains weaker`);
  }
  await page.screenshot({path: `${output}/balcony-day-native.png`}); report.screenshots.push({file: 'balcony-day-native.png', state: day});

  // Reproduce the missed startup preference path in a separate page. Every
  // sample below is from normal playback, including the initial reduced state.
  if (skipMotionRegression) {
    const previousPath = 'test-artifacts/north-city/revision-25/final-1';
    const previous = JSON.parse(await readFile(`${previousPath}/results.json`, 'utf8'));
    const previousHashes = JSON.parse(await readFile(`${previousPath}/source-hashes-after.json`, 'utf8'));
    const reusedChecks = previous.checks.filter(entry => /reduce-at-load|enabled-without-reload|reduced-again-without-reload/.test(entry.description));
    const clockSourceUnchanged = previousHashes['src/apartments/room.ts'] === beforeHashes['src/apartments/room.ts'];
    check(clockSourceUnchanged && reusedChecks.length > 0 && reusedChecks.every(entry => entry.passed), 'Authorized reuse of passed startup-motion regression with unchanged room clock source', {previousPath, clockSourceUnchanged, reusedChecks: reusedChecks.length});
    report.motionTransitionReuse = {authorizedSkip: true, previousPath, clockSourceUnchanged, reusedChecks};
  } else {
  const reducedContext = await browser.newContext({viewport, deviceScaleFactor: 1, reducedMotion: 'reduce'});
  const reducedPage = await ready(reducedContext, 'startup-reduced');
  await choose(reducedPage, '#city-weather-select', 'clear'); await choose(reducedPage, '#city-time-select', 'night'); await balcony(reducedPage);
  async function phase(label) {
    const result = await reducedPage.evaluate(async () => {const started = performance.now(), samples = []; for (let i = 0; i < 11; i++) {const s = JSON.parse(window.render_game_to_text()); samples.push({wallSeconds: (performance.now() - started) / 1000, animation: s.animation, balcony: s.balconyExterior.tvWindows, north: s.northWeather.tvWindows, flicker: s.balconyExterior.distantNeon}); if (i < 10) await new Promise(resolve => setTimeout(resolve, 250));} return samples;});
    console.log(`SAMPLED motion transition: ${label}`); return {label, samples: result};
  }
  const initialReduced = await phase('reduce-at-load');
  await reducedPage.emulateMedia({reducedMotion: 'no-preference'}); await reducedPage.waitForTimeout(250);
  const enabled = await phase('enabled-without-reload');
  await reducedPage.emulateMedia({reducedMotion: 'reduce'}); await reducedPage.waitForTimeout(250);
  const reducedAgain = await phase('reduced-again-without-reload');
  report.motionTransitions = [initialReduced, enabled, reducedAgain];
  for (const entry of report.motionTransitions) {
    const reduced = entry !== enabled, first = entry.samples[0], last = entry.samples.at(-1);
    check(entry.samples.every(s => s.animation.reducedMotion === reduced && s.balcony.reducedMotion === reduced && s.north.reducedMotion === reduced), `${entry.label}: room and helpers observe the live motion preference`);
    check(last.animation.roomTimeSeconds - first.animation.roomTimeSeconds > 1.5, `${entry.label}: city clock is not pinned to zero by startup preference`);
    for (const region of ['balcony', 'north']) check(equal(first[region].samples, last[region].samples) === reduced, `${entry.label}: ${region} ${reduced ? 'stays visually steady' : 'resumes TV changes'} without reload`);
    if (reduced) check(entry.samples.every(s => s.flicker.emitters.every(e => e.pulse === 1)), `${entry.label}: flicker is suppressed under reduced motion`);
  }
  await reducedContext.close();
  }
} catch (error) {
  report.failure = error.stack ?? String(error);
  if (page && !page.isClosed()) await page.screenshot({path: `${output}/failure-state.png`, timeout: 10000}).catch(() => {});
} finally {
  const afterHashes = await hashes();
  report.changedSources = Object.keys(beforeHashes).filter(path => beforeHashes[path] !== afterHashes[path]);
  check(report.changedSources.length === 0, 'Scene and capture source hashes remain unchanged', report.changedSources);
  check(errors.length === 0, 'No browser, WebGL shader or page errors', errors);
  await writeFile(`${output}/source-hashes.json`, JSON.stringify(beforeHashes, null, 2));
  await writeFile(`${output}/source-hashes-after.json`, JSON.stringify(afterHashes, null, 2));
  await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
assert.equal(report.failure, undefined, report.failure);
assert.equal(checks.filter(entry => !entry.passed).length, 0, 'Inspect failed native checks');
console.log(JSON.stringify({result: 'PASS', checks: checks.length, screenshots: report.screenshots.length, clips: report.nativeRuns.length, output, visualGrade: 'not assigned'}));
