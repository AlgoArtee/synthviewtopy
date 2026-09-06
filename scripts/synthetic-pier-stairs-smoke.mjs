import { chromium } from 'playwright';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Use the actual campus geometry and WALK navigation in a small browser fixture.
// The main app's proximity portal intentionally enters the shore before these
// exterior stairs, so testing inside the complete app cannot exercise this route.
const output = process.env.SYNTHETIC_PIER_OUTPUT ?? 'output/playwright/synthetic-pier-stairs';
await mkdir(output, { recursive: true });
const fixture = `
import * as THREE from 'three';
import { createSyntheticPier, disposeSyntheticPier } from './src/world/syntheticPier';
import { WalkController } from './src/world/WalkController';
import { ISLAND_RADIUS, WALK_EYE_HEIGHT, WALK_STEP_HEIGHT } from './src/config/island';

const root = createSyntheticPier();
const scene = new THREE.Scene();
scene.background = new THREE.Color('#416d80');
scene.add(root, new THREE.HemisphereLight('#edfbff', '#234550', 2.5));
const sunlight = new THREE.DirectionalLight('#fff2db', 2.4);
sunlight.position.set(-20, 35, -20);
scene.add(sunlight);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(1280, 800);
renderer.setPixelRatio(1);
document.body.append(renderer.domElement);
const camera = new THREE.PerspectiveCamera(60, 1280 / 800, 0.005, 2000);
const overview = new THREE.PerspectiveCamera(52, 1280 / 800, 0.01, 2000);
const walk = new WalkController({ camera, element: renderer.domElement, navigationRoot: root });
walk.setWalkSpeedKilometresPerHour(6.48);
const layout = root.userData.stairLayout;
const [stairX, deckY, topZ] = layout.top;
const [, shoreY, bottomZ] = layout.bottom;
const stairs = root.getObjectByName('SYNTHETIC_PIER__SILVER_DESCENDING_STAIRS');
const shore = root.getObjectByName('SYNTHETIC_PIER__SILVER_SHORE_APRON');
const bottomLanding = root.getObjectByName('SYNTHETIC_PIER__BEACH_LANDING');
const transform = new THREE.Matrix4();
const scale = new THREE.Vector3();
const position = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
stairs.getMatrixAt(0, transform);
transform.decompose(position, quaternion, scale);
const width = scale.x;
const landingBounds = new THREE.Box3().setFromObject(bottomLanding, true);
const ray = new THREE.Raycaster();
const checks = [];
const check = (condition, name, detail = null) => checks.push({ name, passed: Boolean(condition), detail });
const snapshot = () => ({ ...walk.getSnapshot(), exactPosition: camera.position.toArray() });
const render = (kind = 'walk') => {
  if (kind === 'overview') {
    overview.position.set(stairX - 6.5, deckY + 5, topZ - 6);
    overview.lookAt(stairX + 0.8, deckY / 2, topZ - 0.8);
  }
  renderer.render(scene, kind === 'overview' ? overview : camera);
};
const settle = () => {
  walk.setMoveIntent(0, 0);
  for (let i = 0; i < 40; i++) walk.update(1 / 120);
};
const move = (x, z, distance) => {
  const seconds = distance / 0.18;
  const frames = Math.ceil(seconds * 120);
  const dt = seconds / frames;
  let maxRise = 0;
  let maxDrop = 0;
  let minGroundY = Infinity;
  let maxGroundY = -Infinity;
  let previousY = walk.getSnapshot().groundY;
  walk.setMoveIntent(x, -z);
  for (let i = 0; i < frames; i++) {
    walk.update(dt);
    const y = walk.getSnapshot().groundY;
    if (y !== null) {
      minGroundY = Math.min(minGroundY, y);
      maxGroundY = Math.max(maxGroundY, y);
    }
    if (y !== null && previousY !== null) {
      maxRise = Math.max(maxRise, y - previousY);
      maxDrop = Math.max(maxDrop, previousY - y);
    }
    previousY = y;
  }
  settle();
  return { ...snapshot(), maxRise, maxDrop, minGroundY, maxGroundY };
};
const enter = (x, z) => {
  walk.enter(new THREE.Vector3(x, deckY, z), new THREE.Vector3(0, 0, -1));
  settle();
  return snapshot();
};
const close = (a, b, tolerance = 0.018) => Math.abs(a - b) <= tolerance;
const sampleShore = (x, z) => {
  ray.set(new THREE.Vector3(x, deckY + 4, z), new THREE.Vector3(0, -1, 0));
  return ray.intersectObject(shore)[0]?.point.y ?? null;
};

window.fixture = {
  render,
  run() {
    const samples = [];
    for (const x of [landingBounds.min.x, (landingBounds.min.x + landingBounds.max.x) / 2, landingBounds.max.x]) {
      for (const z of [landingBounds.min.z, (landingBounds.min.z + landingBounds.max.z) / 2, landingBounds.max.z]) {
        const y = sampleShore(x, z);
        samples.push({ x, z, y, gap: y === null ? null : shoreY - y });
      }
    }
    check(samples.every(p => p.y !== null && p.y > 0), 'Entire beach landing lies over dry silver sand', samples);
    check(samples.every(p => p.gap !== null && Math.abs(p.gap) <= WALK_STEP_HEIGHT), 'Landing edges meet sand within a walkable step', samples);

    const startZ = topZ + layout.landingDepth / 2;
    const start = enter(0, startZ);
    const topLanding = move(-1, 0, Math.abs(stairX));
    check(close(topLanding.exactPosition[0], stairX) && close(topLanding.groundY, deckY), 'Deck crosses open side rail onto top landing', topLanding);
    const descent = move(0, -1, startZ - (bottomZ - 0.3));
    check(close(descent.exactPosition[2], bottomZ - 0.3) && close(descent.groundY, shoreY), 'Parallel staircase descends onto the beach landing', descent);
    check(descent.maxRise <= WALK_STEP_HEIGHT + 0.002 && descent.maxDrop <= WALK_STEP_HEIGHT + 0.006, 'Descent remains vertically continuous', descent);
    const beach = move(-1, 0, 0.85);
    check(close(beach.exactPosition[0], stairX - 0.85) && beach.surfaceKind === 'sand', 'Landing opens west onto the silver beach', beach);
    const returnLanding = move(1, 0, 0.85);
    check(close(returnLanding.exactPosition[0], stairX) && close(returnLanding.groundY, shoreY), 'Sand reconnects to beach landing', returnLanding);
    const ascent = move(0, 1, startZ - (bottomZ - 0.3));
    check(close(ascent.exactPosition[2], startZ) && close(ascent.groundY, deckY), 'Reverse ascent reaches the top landing', ascent);
    check(ascent.maxRise <= WALK_STEP_HEIGHT + 0.002 && ascent.maxDrop <= WALK_STEP_HEIGHT + 0.006, 'Ascent remains vertically continuous', ascent);
    const returnDeck = move(1, 0, Math.abs(stairX));
    check(close(returnDeck.exactPosition[0], 0) && close(returnDeck.groundY, deckY), 'Top landing returns onto the pier deck', returnDeck);
    check(returnDeck.safetyRecoveries === start.safetyRecoveries, 'Round trip needs no safety teleport', { start: start.safetyRecoveries, finish: returnDeck.safetyRecoveries });

    const straightStart = enter(stairX, bottomZ - 0.3);
    const straightExit = move(0, -1, 0.8);
    check(close(straightExit.exactPosition[2], bottomZ - 1.1) && straightExit.surfaceKind === 'sand', 'Landing also permits a straight seaward exit', straightExit);
    check(straightExit.safetyRecoveries === straightStart.safetyRecoveries, 'Seaward landing exit needs no safety teleport');
    const straightReturn = move(0, 1, 0.8);
    check(close(straightReturn.exactPosition[2], bottomZ - 0.3) && close(straightReturn.groundY, shoreY), 'Straight seaward route returns to landing', straightReturn);

    const midZ = (topZ + bottomZ) / 2;
    const leftStart = enter(stairX, midZ);
    const leftRail = move(-1, 0, 1.2);
    check(leftRail.exactPosition[0] >= stairX - width / 2 + 0.045 && leftRail.exactPosition[0] < stairX - 0.15, 'Outer stair handrail contains the walker', leftRail);
    check(close(leftRail.groundY, leftStart.groundY, 0.03), 'Outer stair rail prevents falling to sand', leftRail);
    enter(stairX, midZ);
    const rightRail = move(1, 0, 1.2);
    check(rightRail.exactPosition[0] <= stairX + width / 2 - 0.045 && rightRail.exactPosition[0] > stairX + 0.15, 'Inner stair handrail contains the walker', rightRail);
    check(close(rightRail.groundY, leftStart.groundY, 0.03), 'Inner stair rail prevents falling to sand', rightRail);
    enter(0, startZ);
    const pierRail = move(1, 0, 2);
    check(pierRail.exactPosition[0] < 1.25 && pierRail.exactPosition[0] > 1, 'Opposite pier rail remains closed', pierRail);

    // The expanded shelf must have matching dry wings and a physical sand neck,
    // not two visually touching islands separated by water beneath the pier.
    const wingSamples = [];
    for (const [x, offset] of [[8, 5], [14, 5], [20, 5], [14, 12], [20, 12]]) {
      const westY = sampleShore(-x, -ISLAND_RADIUS - offset);
      const eastY = sampleShore(x, -ISLAND_RADIUS - offset);
      wingSamples.push({ x, offset, westY, eastY });
    }
    check(wingSamples.every(p => p.westY !== null && p.westY > 0.06), 'West silver-beach wing stays dry', wingSamples);
    check(wingSamples.every(p => p.eastY !== null && p.eastY > 0.06), 'Mirrored east silver-beach wing stays dry', wingSamples);
    check(wingSamples.every(p => p.westY !== null && p.eastY !== null && Math.abs(p.westY - p.eastY) < 0.018), 'East and west shelf elevations agree within sand relief', wingSamples);
    // Cross the newly filled seaward neck beyond the stair landing, between
    // the pier's support rows at offsets 10 and 18.
    const crossingZ = -ISLAND_RADIUS - 17;
    const neckSamples = [-1.2, -0.6, 0, 0.6, 1.2].map(x => ({ x, z: crossingZ, y: sampleShore(x, crossingZ) }));
    check(neckSamples.every(p => p.y !== null && p.y > 0.06 && Math.abs(p.y - shoreY) < WALK_STEP_HEIGHT), 'Continuous dry silver sand passes beneath the pier', neckSamples);
    const crossingStart = enter(-8, crossingZ);
    const crossingEast = move(1, 0, 16);
    check(close(crossingEast.exactPosition[0], 8) && close(crossingEast.exactPosition[2], crossingZ) && crossingEast.surfaceKind === 'sand', 'WALK crosses west to east under the pier', crossingEast);
    check(crossingEast.minGroundY > 0.06 && crossingEast.maxGroundY < shoreY + 0.03, 'Eastward crossing remains on sand below the raised deck', crossingEast);
    const crossingWest = move(-1, 0, 16);
    check(close(crossingWest.exactPosition[0], -8) && close(crossingWest.exactPosition[2], crossingZ) && crossingWest.surfaceKind === 'sand', 'WALK crosses east to west under the pier', crossingWest);
    check(crossingWest.minGroundY > 0.06 && crossingWest.maxGroundY < shoreY + 0.03, 'Westward crossing remains on sand below the raised deck', crossingWest);
    check(crossingEast.safetyRecoveries === crossingStart.safetyRecoveries && crossingWest.safetyRecoveries === crossingStart.safetyRecoveries, 'Both under-pier crossings need no safety teleport', { start: crossingStart.safetyRecoveries, east: crossingEast.safetyRecoveries, west: crossingWest.safetyRecoveries });
    render('overview');
    return { status: checks.every(c => c.passed) ? 'passed' : 'failed', layout, stairWidth: width, samples, checks, start, topLanding, descent, beach, ascent, returnDeck, straightExit, straightReturn, leftRail, rightRail, pierRail, shoreExtension: { wingSamples, neckSamples, crossingStart, crossingEast, crossingWest } };
  },
  dispose() { walk.dispose(); disposeSyntheticPier(root); renderer.dispose(); },
};
render('overview');
`;

const bundled = await build({
  stdin: { contents: fixture, loader: 'ts', sourcefile: 'synthetic-pier-stairs-fixture.ts', resolveDir: resolve('.') },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
});
const server = createServer((request, response) => {
  if (request.url === '/fixture.js') {
    response.writeHead(200, { 'Content-Type': 'application/javascript' });
    response.end(bundled.outputFiles[0].text);
  } else if (request.url === '/favicon.ico') {
    response.writeHead(204);
    response.end();
  } else {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end('<!doctype html><html><head><meta charset="utf-8"><title>Parallel synthetic-pier staircase navigation</title></head><body style="margin:0"><script type="module" src="/fixture.js"></script></body></html>');
  }
});
await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
const address = server.address();
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
try {
  await page.goto(`http://127.0.0.1:${address.port}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.fixture), { timeout: 30_000 });
  const result = await page.evaluate(() => window.fixture.run());
  result.errors = errors;
  await page.screenshot({ path: `${output}/parallel-stairs.png` });
  await writeFile(`${output}/results.json`, JSON.stringify(result, null, 2));
  await page.evaluate(() => window.fixture.dispose());
  const failures = result.checks.filter(check => !check.passed);
  console.log(JSON.stringify({ status: result.status, layout: result.layout, checks: result.checks.length, failures, errors }, null, 2));
  if (failures.length || errors.length) throw new Error(`Synthetic pier staircase smoke failed (${failures.length} checks, ${errors.length} browser errors).`);
} finally {
  await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
