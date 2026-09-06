import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium } from 'playwright';

// A small isolated render fixture exercises the actual adapter and shader
// without waiting for the complete island's district streaming lifecycle.
const output = process.env.CYGNUS_STABILITY_OUTPUT ?? 'output/island-cygnus-stability';
await mkdir(output, { recursive: true });
const bundle = await build({
  stdin: { contents: "import * as THREE from 'three'; import { createIslandCygnus } from './src/world/islandCygnus.ts'; window.fixture = { THREE, createIslandCygnus };", resolveDir: process.cwd() },
  bundle: true, write: false, format: 'esm', platform: 'browser', logLevel: 'silent',
});
const server = createServer((request, response) => {
  if (request.url === '/fixture.js') {
    response.writeHead(200, { 'Content-Type': 'text/javascript' });
    response.end(bundle.outputFiles[0].text);
    return;
  }
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.end('<!doctype html><html><head><link rel="icon" href="data:,"></head><body style="margin:0;background:#061621"><script type="module" src="/fixture.js"></script></body></html>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => Boolean(window.fixture));
  const results = await page.evaluate(() => {
    const { THREE, createIslandCygnus } = window.fixture;
    const assert = (condition, message) => { if (!condition) throw new Error(message); };
    const camera = new THREE.PerspectiveCamera(42, 800 / 500, 0.65, 3600);
    const binary = createIslandCygnus();
    const direction = new THREE.Vector3(0, Math.tan(THREE.MathUtils.degToRad(7)), -1).normalize();
    const setPose = (position, lookDirection = direction, time = 2) => {
      camera.position.fromArray(position);
      camera.lookAt(camera.position.clone().add(lookDirection));
      camera.updateMatrixWorld(true);
      binary.update(camera, time, 1, 1);
      binary.group.updateMatrixWorld(true);
      return binary.getSnapshot(camera);
    };
    const baseline = setPose([0, 2, 0]);
    const orientation = binary.group.quaternion.clone();
    assert(baseline.fixedWorldBearing && baseline.placement === 'fixed-north-sky', 'Every view must use a fixed north sky.');
    assert(baseline.blackHole.inViewport && baseline.companion.inViewport, 'Looking at the sky must reveal both bodies.');
    const translations = [[125, 0.2, -500], [-400, 80, 720], [40, 240, -180], [780, 610, 840], [0, 1500, 0]];
    for (const position of translations) {
      const current = setPose(position);
      assert(binary.group.quaternion.angleTo(orientation) < 1e-7, `Sky rotated when camera moved to ${position}.`);
      assert(current.fixedWorldBearing && current.cameraTranslationOnly, 'Altitude must never enable camera-oriented placement.');
      for (const body of ['blackHole', 'companion']) {
        assert(current[body].elevationDegrees === baseline[body].elevationDegrees, `${body} elevation changed with camera height.`);
        assert(current[body].screenPosition.x === baseline[body].screenPosition.x
          && current[body].screenPosition.y === baseline[body].screenPosition.y, `${body} gained parallax during translation.`);
      }
    }
    const away = setPose([780, 610, 840], new THREE.Vector3(0, 0.2, 1));
    assert(!away.blackHole.inFront && !away.companion.inFront, 'Looking away must hide the fixed sky.');
    const overview = setPose([780, 610, 840], new THREE.Vector3(-780, -608, -840).normalize());
    assert(!overview.blackHole.inViewport && !overview.companion.inViewport, 'A downward island overview must not pull the sky onto the island.');
    assert(binary.group.quaternion.angleTo(orientation) < 1e-7, 'Orbiting must not rotate celestial artwork.');
    const updated = setPose([0, 2, 0], direction, 4);
    assert(updated.animation.coronaPhase !== baseline.animation.coronaPhase, 'Shared corona animation must advance.');
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), camera);
    assert(ray.intersectObject(binary.group, true).length === 0, 'Celestial artwork must not intercept Explore selection.');

    const occlusion = [];
    for (const reverseDepthBuffer of [false, true]) {
      const renderer = new THREE.WebGLRenderer({ antialias: false, reverseDepthBuffer });
      renderer.setSize(800, 500);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#061621');
      scene.add(binary.group);
      const target = new THREE.WebGLRenderTarget(800, 500);
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      const snapshot = binary.getSnapshot(camera);
      const pixel = new Uint8Array(4);
      const pixelX = Math.round(snapshot.companion.screenPosition.x * 800);
      const pixelY = Math.round((1 - snapshot.companion.screenPosition.y) * 500);
      const sample = () => {
        renderer.render(scene, camera);
        renderer.readRenderTargetPixels(target, pixelX, pixelY, 1, 1, pixel);
        return Array.from(pixel);
      };
      const clearStar = sample();
      assert(clearStar[0] > 180 && clearStar[1] > 180 && clearStar[2] > 180, 'Companion photosphere must render before occlusion.');
      const starRay = new THREE.Vector3(snapshot.companion.screenPosition.x * 2 - 1,
        1 - snapshot.companion.screenPosition.y * 2, 0.5).unproject(camera).sub(camera.position).normalize();
      // The blocker is beyond the angular proxy plane (1260), but still
      // foreground to an astronomical sky. The original depth failed here.
      const blocker = new THREE.Mesh(new THREE.PlaneGeometry(650, 650),
        new THREE.MeshBasicMaterial({ color: '#00ff00', toneMapped: false }));
      blocker.position.copy(camera.position).addScaledVector(starRay, 2200);
      blocker.quaternion.copy(camera.quaternion);
      const architecture = new THREE.Group();
      architecture.renderOrder = 2;
      architecture.add(blocker);
      scene.add(architecture);
      const opaque = sample();
      assert(opaque[0] < 5 && opaque[1] > 250 && opaque[2] < 5,
        `Foreground island geometry must hide the star with reverseDepthBuffer=${reverseDepthBuffer}: ${opaque}`);
      blocker.material.transparent = true;
      blocker.material.depthWrite = false;
      const transparent = sample();
      assert(transparent[0] < 5 && transparent[1] > 250 && transparent[2] < 5,
        `Foreground transparent geometry must composite over the sky: ${transparent}`);
      occlusion.push({ requestedReverseDepth: reverseDepthBuffer, actualReverseDepth: renderer.capabilities.reverseDepthBuffer, clearStar, opaque, transparent });
      scene.remove(architecture);
      blocker.geometry.dispose(); blocker.material.dispose();
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      if (reverseDepthBuffer) document.body.appendChild(renderer.domElement);
      target.dispose();
      renderer.dispose();
    }
    binary.dispose();
    return { status: 'passed', baseline, overview, translationCases: translations.length, occlusion };
  });
  await page.screenshot({ path: `${output}/fixed-north-sky.png` });
  if (errors.length) throw new Error(errors.join('\n'));
  await writeFile(`${output}/results.json`, JSON.stringify({ ...results, errors }, null, 2));
  console.log(JSON.stringify({ ...results, errors }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
