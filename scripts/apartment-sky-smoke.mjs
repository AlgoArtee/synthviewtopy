import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const output = process.env.APARTMENT_SKY_OUTPUT ?? 'test-artifacts/apartment-sky';
const fixtureImports = `import * as THREE from 'three';
import { createIslandCygnus } from './src/world/islandCygnus.ts';
import { createApartmentSky, APARTMENT_SKY_METADATA } from './src/apartments/apartmentSky.ts';`;
await mkdir(output, { recursive: true });

// These assertions run without a browser or GPU, making source drift inexpensive to catch.
const nodeBundle = await build({ stdin: { contents: `${fixtureImports}\nexport { THREE, createIslandCygnus, createApartmentSky, APARTMENT_SKY_METADATA };`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
const { THREE, createIslandCygnus, createApartmentSky, APARTMENT_SKY_METADATA } = await import(`data:text/javascript;base64,${Buffer.from(nodeBundle.outputFiles[0].text).toString('base64')}`);
const camera = new THREE.PerspectiveCamera(65, 1.6, .08, 450);
const centreDirection = new THREE.Vector3(0, Math.tan(THREE.MathUtils.degToRad(20)), -1).normalize();
const reference = createIslandCygnus();
const sky = createApartmentSky();
const meshes = group => { const result = []; group.traverse(object => { if (object instanceof THREE.Mesh) result.push(object); }); return result; };
const actualMeshes = meshes(sky.group);
const referenceMeshes = meshes(reference.group);
assert.equal(actualMeshes.length, 1, 'The complete binary is the single shared shader plane, not primitive bodies.');
assert.equal(actualMeshes.length, referenceMeshes.length);
const actualMesh = actualMeshes[0];
const referenceMesh = referenceMeshes[0];
assert.equal(actualMesh.material.vertexShader, referenceMesh.material.vertexShader, 'Apartment and island vertex shaders must be byte-for-byte identical.');
assert.equal(actualMesh.material.fragmentShader, referenceMesh.material.fragmentShader, 'Apartment and island fragment shaders must be byte-for-byte identical.');
assert.deepEqual(actualMesh.geometry.parameters, referenceMesh.geometry.parameters);
for (const attribute of ['position', 'normal', 'uv']) assert.deepEqual(Array.from(actualMesh.geometry.getAttribute(attribute).array), Array.from(referenceMesh.geometry.getAttribute(attribute).array), `${attribute} artwork geometry differs from Lab Island.`);
assert.deepEqual(Array.from(actualMesh.geometry.index.array), Array.from(referenceMesh.geometry.index.array));
assert.equal(actualMesh.layers.mask, 1 << 1, 'Celestial artwork must be excluded from the layer-0 AO/probe pass.');
assert.equal(actualMesh.material.depthWrite, false);
assert.equal(actualMesh.material.depthTest, true);
assert.equal(actualMesh.material.transparent, true);
assert.equal(actualMesh.castShadow, false);

const pose = (position, time = 2, direction = centreDirection) => {
  camera.position.fromArray(position); camera.lookAt(camera.position.clone().add(direction)); camera.updateMatrixWorld(true);
  sky.update(camera, time); return sky.getSnapshot(camera);
};
const baseline = pose([-1.85, 1.65, -4.72]);
reference.update(camera, 2, 1, .96); reference.group.updateMatrixWorld(true);
for (const key of Object.keys(referenceMesh.material.uniforms)) assert.deepEqual(actualMesh.material.uniforms[key].value, referenceMesh.material.uniforms[key].value, `Uniform ${key} must use the shared island animation.`);
assert.equal(baseline.companionToBlackHoleDiameter, 5.625);
assert.equal(baseline.animation.coronaPeriodSeconds, 8);
assert.equal(baseline.animation.streamTransitSeconds, 10);
assert.equal(baseline.animation.streamDirection, 'companion-to-black-hole');
assert(Math.abs(baseline.skyDistance - 252) < 1e-8);
assert.equal(baseline.angularScale, 1);
assert.equal(baseline.artworkSignature.meshCount, 1);
assert.equal(baseline.artworkSignature.geometryType, 'PlaneGeometry');
assert.equal(baseline.artworkSignature.planeWidth, 7600);
assert.equal(baseline.artworkSignature.planeHeight, 3800);
assert.match(baseline.artworkSignature.fragmentShader, /^fnv1a32:[0-9a-f]{8}$/);
assert(baseline.blackHole.inViewport && baseline.companion.inViewport, 'Both exact bodies must be visible through the north outlook at far=450.');
function cornerAngle(mesh, a, b) {
  const vertices = mesh.geometry.getAttribute('position');
  const first = new THREE.Vector3().fromBufferAttribute(vertices, a).applyMatrix4(mesh.matrixWorld).sub(camera.position).normalize();
  const second = new THREE.Vector3().fromBufferAttribute(vertices, b).applyMatrix4(mesh.matrixWorld).sub(camera.position).normalize();
  return first.angleTo(second);
}
for (const indices of [[0, 1], [0, 2], [0, 3]]) assert(Math.abs(cornerAngle(actualMesh, ...indices) - cornerAngle(referenceMesh, ...indices)) < 1e-7, 'Proxy reduction must preserve every angular artwork dimension.');
const orientation = sky.group.quaternion.clone();
for (const position of [[-5.5, 1.65, -4.3], [5, 1.65, 3], [0, 7.4, 0], [300, 90, -500]]) {
  const current = pose(position);
  assert.deepEqual(current.artworkSignature, baseline.artworkSignature, 'All room positions must use identical artwork fingerprints.');
  assert(sky.group.quaternion.angleTo(orientation) < 1e-7, 'Walking must not rotate the fixed sky.');
  for (const body of ['blackHole', 'companion']) assert.deepEqual(current[body], baseline[body], `${body} gained translation parallax.`);
}
const away = pose([2, 1.65, 2], 2, new THREE.Vector3(0, 0, 1));
assert(!away.blackHole.inFront && !away.companion.inFront);
const animated = pose([-1.85, 1.65, -4.72], 4);
assert.notEqual(animated.animation.coronaPhase, baseline.animation.coronaPhase);
const mirrorCamera = camera.clone(); mirrorCamera.position.set(5.56, 2.13, 7.9); mirrorCamera.updateMatrixWorld(true);
actualMesh.onBeforeRender(null, null, mirrorCamera);
assert(sky.group.position.distanceTo(mirrorCamera.position) < 1e-8, 'Mirror rendering must use camera-relative astronomical placement.');
sky.update(camera, 4);
assert(sky.group.position.distanceTo(camera.position) < 1e-8, 'Main camera placement must be restored after a reflection.');
let geometryDisposals = 0; let materialDisposals = 0;
actualMesh.geometry.addEventListener('dispose', () => geometryDisposals++);
actualMesh.material.addEventListener('dispose', () => materialDisposals++);
sky.dispose(); sky.dispose(); reference.dispose();
assert.equal(geometryDisposals, 1); assert.equal(materialDisposals, 1);
assert.equal(sky.getSnapshot(camera).visible, false);
const exteriorSource = await readFile('src/apartments/academicOutlook.ts', 'utf8');
for (const leftover of ['celestialSphereGeometry', 'celestialWhite', 'const photonRing', 'const accretion', 'Cygnus-inspired celestial pair']) assert(!exteriorSource.includes(leftover), `Remove primitive celestial leftover: ${leftover}`);
const staticResults = { status: 'passed', shaderEquality: true, geometryEquality: true, uniformEquality: true, angularEquality: true, translationCases: 4, primitiveLeftovers: false, baseline, metadata: APARTMENT_SKY_METADATA };
await writeFile(`${output}/source-equality.json`, JSON.stringify(staticResults, null, 2));
if (process.argv.includes('--static-only')) { console.log(JSON.stringify(staticResults, null, 2)); process.exit(0); }

// An isolated render compares the unmodified island art and the apartment adapter
// under equivalent camera angles, then checks opaque/transparent foreground depth.
const browserBundle = await build({ stdin: { contents: `${fixtureImports}\nwindow.fixture = { THREE, createIslandCygnus, createApartmentSky };`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent' });
const server = createServer((request, response) => {
  if (request.url === '/fixture.js') { response.writeHead(200, { 'Content-Type': 'text/javascript' }); response.end(browserBundle.outputFiles[0].text); return; }
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.end('<!doctype html><html><head><link rel="icon" href="data:,"></head><body style="margin:0;background:#061621"><script type="module" src="/fixture.js"></script></body></html>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`); await page.waitForFunction(() => Boolean(window.fixture));
  const renderResults = await page.evaluate(() => {
    const { THREE, createIslandCygnus, createApartmentSky } = window.fixture;
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true }); renderer.setSize(960, 600);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    document.body.append(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#79a9c1');
    const camera = new THREE.PerspectiveCamera(45, 1.6, .08, 450); camera.layers.enable(1);
    const apartment = createApartmentSky(); const island = createIslandCygnus();
    const target = new THREE.WebGLRenderTarget(960, 600);
    const capture = (system, elevation, isIsland) => {
      camera.far = isIsland ? 3600 : 450; camera.updateProjectionMatrix();
      camera.position.set(-1.85, 1.65, -4.72); camera.lookAt(camera.position.clone().add(new THREE.Vector3(0, Math.tan(THREE.MathUtils.degToRad(elevation)), -1))); camera.updateMatrixWorld(true);
      if (isIsland) system.update(camera, 3, 1, .96); else system.update(camera, 3);
      scene.add(system.group); renderer.setRenderTarget(target); renderer.render(scene, camera);
      const pixels = new Uint8Array(960 * 600 * 4); renderer.readRenderTargetPixels(target, 0, 0, 960, 600, pixels); scene.remove(system.group); return pixels;
    };
    const reference = capture(island, 7, true); const actual = capture(apartment, 20, false);
    let changedChannels = 0; let totalDifference = 0; let maxDifference = 0;
    for (let i = 0; i < actual.length; i++) { const difference = Math.abs(reference[i] - actual[i]); if (difference > 2) changedChannels++; totalDifference += difference; maxDifference = Math.max(maxDifference, difference); }
    check(changedChannels / actual.length < .001, `Apartment artwork diverged from the island render (${changedChannels} channels).`);
    scene.add(apartment.group); const snapshot = apartment.getSnapshot(camera);
    const x = Math.round(snapshot.companion.screenPosition.x * 960); const y = Math.round((1 - snapshot.companion.screenPosition.y) * 600);
    const pixel = new Uint8Array(4);
    const sample = () => { renderer.render(scene, camera); renderer.readRenderTargetPixels(target, x, y, 1, 1, pixel); return [...pixel]; };
    const clearStar = sample(); check(clearStar[0] > 180 && clearStar[1] > 180 && clearStar[2] > 180, 'Shared white photosphere must render.');
    const direction = new THREE.Vector3(snapshot.companion.screenPosition.x * 2 - 1, 1 - snapshot.companion.screenPosition.y * 2, .5).unproject(camera).sub(camera.position).normalize();
    const blocker = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshBasicMaterial({ color: '#00ff00', toneMapped: false })); blocker.position.copy(camera.position).addScaledVector(direction, 350); blocker.quaternion.copy(camera.quaternion); scene.add(blocker);
    const opaque = sample(); check(opaque[0] < 5 && opaque[1] > 250 && opaque[2] < 5, 'Campus geometry beyond the 252m proxy must hide astronomical artwork.');
    blocker.material.transparent = true; blocker.material.depthWrite = false;
    const transparent = sample(); check(transparent[0] < 5 && transparent[1] > 250 && transparent[2] < 5, 'Transparent foreground must composite over celestial artwork.');
    scene.remove(blocker); blocker.geometry.dispose(); blocker.material.dispose();
    renderer.setRenderTarget(null); renderer.render(scene, camera);
    window.skyFixture = { scene, camera, apartment, renderer, target, island };
    return { changedChannels, totalDifference, maxDifference, clearStar, opaque, transparent, snapshot };
  });
  await page.screenshot({ path: `${output}/exact-lab-island-artwork.png` });
  const pixelMotion = await page.evaluate(() => {
    const { renderer, scene, camera, apartment, target } = window.skyFixture;
    const capture = () => {
      renderer.setRenderTarget(target); renderer.render(scene, camera);
      const pixels = new Uint8Array(960 * 600 * 4); renderer.readRenderTargetPixels(target, 0, 0, 960, 600, pixels); return pixels;
    };
    const before = capture(); camera.position.add(new window.fixture.THREE.Vector3(14, 4, 11)); camera.updateMatrixWorld(true); apartment.update(camera, 3); const translated = capture();
    let changedChannels = 0; let maxDifference = 0;
    for (let i = 0; i < before.length; i++) { const difference = Math.abs(before[i] - translated[i]); if (difference > 2) changedChannels++; maxDifference = Math.max(maxDifference, difference); }
    renderer.setRenderTarget(null);
    return { translationPixelsStable: changedChannels / before.length < .001, changedChannels, maxDifference };
  });
  assert(pixelMotion.translationPixelsStable, 'Camera translation must not create astronomical parallax.');
  if (errors.length) throw new Error(errors.join('\n'));
  await writeFile(`${output}/results.json`, JSON.stringify({ ...staticResults, renderResults, pixelMotion, errors }, null, 2));
  console.log(JSON.stringify({ status: 'passed', renderResults, pixelMotion, errors }, null, 2));
} finally {
  await page.evaluate(() => { const fixture = window.skyFixture; if (fixture) { fixture.apartment.dispose(); fixture.island.dispose(); fixture.target.dispose(); fixture.renderer.dispose(); } }).catch(() => {});
  await browser.close(); await new Promise(resolve => server.close(resolve));
}
