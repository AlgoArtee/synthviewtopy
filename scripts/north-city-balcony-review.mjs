import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Evidence and functional checks, separate from the formal screenshot realism grade.
const out = process.env.CITY_OUTPUT ?? 'test-artifacts/north-city/revision-18/review-1';
const origin = process.env.CITY_BASE_URL ?? 'http://127.0.0.1:5178';
const requiredViews = ['balcony', 'balcony-door', 'balcony-return', 'kitchen', 'window-pillows'];
const views = [...requiredViews, 'balcony-corner', 'panorama', 'bed-wide', 'bathroom', 'cat-cushion-row'];
await mkdir(out, { recursive: true });
async function sourceHashes() {
  const files = (await readdir('src/apartments')).filter(name => /^osCity.*\.ts$/.test(name) || ['room.ts', 'roomRendering.ts'].includes(name));
  const paths=[...files.sort().map(name=>`src/apartments/${name}`),'public/apartments/assets/north-city/balcony-city-reference.jpg'];
  return Object.fromEntries(await Promise.all(paths.map(async path=>[path,createHash('sha256').update(await readFile(path)).digest('hex')])));
}
const sourcesBefore = await sourceHashes();
console.log('Launching browser for the North City balcony review');
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const report = { capturedAt: new Date().toISOString(), source: `${origin}/room.html?id=os-city-apartment&qa=1`, screenshots: [], errors: [], failures: [] };
const check = (condition, message) => { if (!condition) report.failures.push(message); };
let livePage;
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
  livePage = page;
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  await page.goto(report.source, { waitUntil: 'domcontentloaded', timeout: 120000 });
  console.log('Room document loaded; waiting for scene and material readiness');
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function' && JSON.parse(window.render_game_to_text()).ready, null, { timeout: 300000 });
  console.log('Room ready; capturing viewpoints');
  const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
  report.initial = await state();
  async function openControls() {
    if ((await state()).controlsCollapsed) await page.locator('#city-controls-toggle').click();
  }
  async function view(id) {
    await openControls();
    if (!(await state()).menuOpen) await page.locator('#room-menu-toggle').click();
    await page.locator(`[data-viewpoint="${id}"]`).click();
    if (!(await state()).controlsCollapsed) await page.locator('#city-controls-toggle').click();
    await page.evaluate(() => window.advanceTime(100));
    await page.waitForTimeout(100);
    assert.equal((await state()).view, id, `Viewpoint ${id} selected`);
  }
  async function capture(id, suffix = '') {
    await view(id);
    const filename = `${id}${suffix}.png`;
    await page.screenshot({ path: `${out}/${filename}` });
    report.screenshots.push({ file: filename, state: await state() });
    console.log(`CAPTURED ${filename}`);
  }
  for (const id of requiredViews) assert.ok(report.initial.viewpoints.some(view => view.id === id), `Missing required viewpoint ${id}`);
  await openControls();
  await page.locator('#city-weather-select').selectOption('rain');
  for (const id of views) await capture(id);
  await openControls();
  await page.locator('#city-weather-select').selectOption('clear');
  await capture('window-pillows', '-clear');
  await capture('balcony', '-clear');
  await openControls();
  await page.locator('#city-weather-select').selectOption('rain');

  // Exercise the same keyboard route users take, with the door viewpoint facing north.
  await view('balcony-door');
  const start = await state();
  await page.keyboard.down('w');
  await page.evaluate(() => window.advanceTime(1200));
  await page.keyboard.up('w');
  const outside = await state();
  check(outside.position[2] < -.7, 'Live W movement crosses the balcony door');
  check(outside.position[0] > 2.1 && outside.position[0] < 3.6, 'Live movement uses the actual door aperture');
  check(outside.navigation.mode === 'walking' && outside.floorHeight === 0, 'Balcony uses ordinary floor-height walking');
  await page.screenshot({ path: `${out}/door-walk-out.png` });
  await page.keyboard.down('s');
  await page.evaluate(() => window.advanceTime(1200));
  await page.keyboard.up('s');
  const returned = await state();
  check(returned.position[2] > .4, 'Live S movement returns through the balcony door');
  report.liveDoorWalk = { start, outside, returned };
  await page.screenshot({ path: `${out}/door-walk-return.png` });

  await page.setViewportSize({ width: 390, height: 844 });
  await capture('balcony', '-mobile');
  report.mobileFit = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  check(report.mobileFit.width === report.mobileFit.scrollWidth, 'Mobile view has no horizontal overflow');
  await page.close();

  // Import the production builder for precise navigation and an actual-mesh plan.
  // The separate page avoids a second live room renderer consuming GPU resources.
  const geometryPage = await browser.newPage();
  geometryPage.on('pageerror', error => report.errors.push(error.message));
  await geometryPage.goto(`${origin}/north-city.html`, { waitUntil: 'domcontentloaded' });
  const geometry = await geometryPage.evaluate(async () => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const { createOsCityApartment } = await import('/src/apartments/osCityApartment.ts');
    const { CITY_BED, CITY_BALCONY, CITY_BALCONY_DOOR, insideCityFootprint } = await import('/src/apartments/osCityLayout.ts');
    const room = createOsCityApartment();
    await room.ready;
    room.scene.updateMatrixWorld(true);
    const failures = [], navigation = room.navigation, p = new THREE.Vector3(), zero = new THREE.Vector3();
    const checks = [];
    const expect = (ok, message) => { checks.push({ check: message, passed: Boolean(ok) }); if (!ok) failures.push(message); };
    function reset(x, z, y = 1.65) { p.set(x, y, z); navigation.reset(p); }
    function step(x, z, frames, jump = false) {
      const d = new THREE.Vector3(x, 0, z).normalize();
      for (let frame = 0; frame < frames; frame++) navigation.step(p, d, 1 / 60, jump, false);
      return p.toArray();
    }
    const route = [], targets = [[2.85, -1.5], [2.85, -4.4], [.2, -4.4], [.2, -7.2], [2.85, -7.2], [2.85, -1.5], [2.85, 1]];
    reset(2.85, 1);
    for (const [x, z] of targets) {
      const start = p.toArray();
      for (let frame = 0; frame < 900 && Math.hypot(x - p.x, z - p.z) > .005; frame++) {
        const d = new THREE.Vector3(x - p.x, 0, z - p.z), distance = d.length();
        navigation.step(p, d.normalize(), Math.min(1 / 60, distance / 2.35), false, false);
      }
      const reached = Math.hypot(x - p.x, z - p.z) < .05;
      route.push({ start, target: [x, z], end: p.toArray(), reached });
      expect(reached, `Continuous balcony route reaches ${x}, ${z}`);
      expect(Math.abs(p.y - 1.65) < .002, `Floor stays level at ${x}, ${z}`);
    }
    const doorway = [];
    for (const x of [2.4, 2.85, 3.3]) {
      reset(x, .7); step(0, -1, 70);
      doorway.push({ x, end: p.toArray() });
      expect(p.z < -1.8, `Door clear width permits walking at x=${x}`);
    }
    const containment = [];
    function boundary(name, x, z, dx, dz, condition) {
      reset(x, z); step(dx, dz, 360);
      containment.push({ name, end: p.toArray() });
      expect(condition(p), name);
      expect(insideCityFootprint(p.x, p.z, .239), `${name}: player remains inside footprint`);
    }
    boundary('East balcony rail contains player', 3, -5, 1, 0, p => p.x <= CITY_BALCONY.maxX - .239 && p.x > 4.1);
    boundary('North balcony rail contains player', 2.85, -7, 0, -1, p => p.z >= CITY_BALCONY.minZ + .239 && p.z < -8.8);
    boundary('Bedroom partition contains balcony player', .2, -6.5, -1, 0, p => p.x >= CITY_BALCONY.minX + .239);
    boundary('Bathroom east wall stays solid', 2.5, -1.4, -1, 0, p => p.x >= CITY_BALCONY.elbowX + .239);
    boundary('Bathroom north wall stays solid', 0, -4.4, 0, 1, p => p.z <= CITY_BALCONY.elbowZ - .239);
    boundary('Wall beside door stays solid', 1.88, .7, 0, -1, p => p.z >= .08);

    // Existing bed semantics use all actual room wall/furniture colliders.
    const bed = {};
    reset(-3, -.35); step(0, -1, 90); bed.beforeClimb = p.toArray();
    expect(room.floorHeight(p.x, p.z) === 0, 'Bed still requires deliberate climb');
    step(0, 0, 50, true); bed.afterClimb = { position: p.toArray(), navigation: navigation.snapshot() };
    expect(navigation.snapshot().mode === 'on-bed' && Math.abs(p.y - 2.37) < .01, 'Space climbs onto bed at its original height');
    step(0, -1, 600); bed.windowStop = p.toArray();
    expect(p.z >= CITY_BED.minZ + .239 && p.z < CITY_BED.minZ + .4, 'Bed window boundary stays solid');
    reset(-4, CITY_BED.centerZ, 2.37); step(-1, 0, 600); bed.westStop = p.toArray();
    expect(p.x >= CITY_BED.minX + .239, 'Bed west wall stays solid');
    reset(-4, CITY_BED.centerZ, 2.37); step(1, 0, 600); bed.eastStop = p.toArray();
    expect(p.x <= CITY_BED.maxX - .239, 'Bed east wall stays solid beside new balcony');
    reset(-3, -2, 2.37); step(0, 1, 70); for (let frame = 0; frame < 90; frame++) navigation.step(p, zero, 1 / 60, false, false);
    bed.afterStepDown = p.toArray();
    expect(room.floorHeight(p.x, p.z) === 0 && Math.abs(p.y - 1.65) < .001, 'Walking off bed settles to normal eye height');

    const bounds = object => { const b = new THREE.Box3().setFromObject(object, true); return { min: b.min.toArray(), max: b.max.toArray() }; };
    const pillows = []; room.scene.traverse(object => { if (object.isGroup && object.name.startsWith('Bed pillow ·')) pillows.push({ name: object.name, ...bounds(object), metadata: object.userData }); });
    expect(pillows.length === 13, 'All thirteen existing pillows remain');
    const duvet = room.scene.getObjectByName('Duvet · large filled white cotton blanket');
    const balcony = room.scene.getObjectByName('Wraparound circuit balcony');
    expect(Boolean(balcony), 'Physical wraparound balcony geometry is present');
    const hiddenExterior = [];
    for (const group of room.scene.children) {
      if (group.isGroup && (group.name === 'North City · behind the island' || /district/i.test(group.name) || group.userData.exterior)) {
        group.visible = false; hiddenExterior.push(group.name);
      }
    }
    expect(hiddenExterior.length >= 2, 'Plan hides both exterior city groups');
    room.scene.traverse(object => { if (/ceiling|concentric/i.test(object.name) && object.isMesh) object.visible = false; });
    room.scene.background = new THREE.Color('#ffffff'); room.scene.fog = null;
    const planMaterial = new THREE.MeshStandardMaterial({ color: '#c9c9c9', roughness: 1 });
    room.scene.overrideMaterial = planMaterial;
    room.scene.add(new THREE.AmbientLight('#ffffff', 1));
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(1500, 1500); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const camera = new THREE.OrthographicCamera(-8.35, 8.35, 8.35, -8.35, .1, 50);
    camera.position.set(-2.5, 20, -1.655); camera.up.set(0, 0, -1); camera.lookAt(-2.5, 0, -1.655);
    renderer.render(room.scene, camera);
    const plan = renderer.domElement.toDataURL('image/png').split(',')[1];
    const result = { failures, checks, route, doorway, containment, bed, pillows, duvet: { ...bounds(duvet), metadata: duvet.userData.duvet }, balcony: balcony ? { ...bounds(balcony), metadata: balcony.userData } : null, layout: { bed: CITY_BED, balcony: CITY_BALCONY, door: CITY_BALCONY_DOOR }, hiddenExterior, plan };
    planMaterial.dispose(); renderer.dispose(); room.dispose();
    return result;
  });
  await writeFile(`${out}/floor-plan.png`, Buffer.from(geometry.plan, 'base64'));
  delete geometry.plan;
  report.geometry = geometry;
  report.failures.push(...geometry.failures);
  const sourcesAfter = await sourceHashes();
  report.modifiedSourceFiles = [...new Set([...Object.keys(sourcesBefore), ...Object.keys(sourcesAfter)])].filter(path => sourcesBefore[path] !== sourcesAfter[path]);
  report.sourcesStable = report.modifiedSourceFiles.length === 0;
  check(report.sourcesStable, 'Scene sources remain stable throughout evidence capture');
  check(report.errors.length === 0, 'No browser page or console errors');
} catch (error) {
  report.failures.push(error.stack ?? String(error));
  if (livePage && !livePage.isClosed()) {
    report.failureState = await livePage.evaluate(() => typeof window.render_game_to_text === 'function' ? JSON.parse(window.render_game_to_text()) : { text: document.body.innerText }).catch(error => ({ inspectionError: String(error) }));
    await livePage.screenshot({ path: `${out}/failure-state.png`, timeout: 10000 }).catch(() => {});
  }
} finally {
  await writeFile(`${out}/source-hashes.json`, JSON.stringify(sourcesBefore, null, 2));
  await writeFile(`${out}/balcony-results.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
assert.deepEqual(report.failures, [], 'Balcony functional review must pass; see balcony-results.json');
console.log(JSON.stringify({ result: 'PASS', screenshots: report.screenshots.length, errors: report.errors, geometryChecks: report.geometry.checks.length, evidence: out }));

