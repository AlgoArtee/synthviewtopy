import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = 'test-artifacts/north-city/revision-19/plaza-life';
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  const page = await browser.newPage({ reducedMotion: 'no-preference' });
  await page.route('**/plaza-helper-check', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body>Plaza helper geometry and motion checks</body></html>' }));
  await page.goto('http://127.0.0.1:5178/plaza-helper-check');
  const result = await page.evaluate(async () => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const { createOsCityPlazaLife } = await import('/src/apartments/osCityPlazaLife.ts');
    const life = createOsCityPlazaLife(); window.plazaLife = life;
    const first = life.userData.snapshot(), failures = [];
    const processors = [[34, -5, 8.1], [18, -19, 4.2], [49, 12, 4.9], [50, -22, 3.6], [18, 12, 3.8]];
    let minDistance = Infinity, submittedTriangles = 0, uniqueTriangles = 0, meshCount = 0;
    const slabTop = -14.02, supportY = slabTop + .002;
    const shoes = life.getObjectByName('Residents · walking shoes'), shoeVertices = shoes.geometry.attributes.position;
    const shoeMatrix = new THREE.Matrix4();
    let minSoleClearance = Infinity, maxPlantedClearance = -Infinity, maxSwingClearance = 0, soleSamples = 0;
    const seen = new Set();
    life.traverse(object => {
      if (!object.isMesh) return;
      meshCount++;
      const triangles = (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
      if (!seen.has(object.geometry)) { seen.add(object.geometry); uniqueTriangles += triangles; }
      submittedTriangles += triangles * (object.isInstancedMesh ? object.count : 1);
    });
    for (let tick = 0; tick < 1800; tick++) {
      life.userData.update(.1, tick * .1);
      for (const position of life.userData.snapshot().pedestrianPositions) {
        if (!position.every(Number.isFinite)) failures.push('Nonfinite pedestrian position');
        const [x, y, z] = position;
        if (Math.abs(y - supportY) > .001) failures.push('Pedestrian support datum detached from slab');
        for (const [px, pz, size] of processors) {
          const dx = Math.max(Math.abs(x - px) - size / 2, 0), dz = Math.max(Math.abs(z - pz) - size / 2, 0);
          minDistance = Math.min(minDistance, Math.hypot(dx, dz));
        }
      }
      // Measure real instance geometry, including each person's scale and foot
      // pitch. Testing only actor roots misses hovering or penetrating shoes.
      for (let walker = 0; walker < 48; walker++) {
        const soles = [];
        for (let foot = 0; foot < 2; foot++) {
          shoes.getMatrixAt(walker * 2 + foot, shoeMatrix);
          const elements = shoeMatrix.elements;
          let soleY = Infinity;
          for (let vertex = 0; vertex < shoeVertices.count; vertex++) {
            soleY = Math.min(soleY, elements[1] * shoeVertices.getX(vertex) + elements[5] * shoeVertices.getY(vertex) + elements[9] * shoeVertices.getZ(vertex) + elements[13]);
          }
          soles.push(soleY); soleSamples++;
          minSoleClearance = Math.min(minSoleClearance, soleY - slabTop);
          maxSwingClearance = Math.max(maxSwingClearance, soleY - supportY);
        }
        const plantedClearance = Math.min(...soles) - supportY;
        maxPlantedClearance = Math.max(maxPlantedClearance, Math.abs(plantedClearance));
        if (soles.some(y => y < supportY - .00001)) failures.push('Shoe geometry penetrates support plane');
        if (Math.abs(plantedClearance) > .00001) failures.push('Neither actual shoe sole is planted');
        if (soles.filter(y => y > supportY + .00001).length > 1) failures.push('Both shoes lift during the same gait phase');
      }
    }
    const moved = life.userData.snapshot();
    life.userData.setWeather('clear'); const clear = life.userData.snapshot();
    life.userData.setWeather('storm'); const storm = life.userData.snapshot();
    return { first, moved, clear, storm, failures, minProcessorClearance: minDistance, submittedTriangles, uniqueTriangles, meshCount,
      shoeSupport: { slabTop, supportY, soleSamples, minSoleClearance, maxPlantedClearance, maxSwingClearance } };
  });
  assert.equal(result.failures.length, 0);
  assert.equal(result.first.walkerCount, 48);
  assert.equal(result.first.trainCarCount, 6);
  assert.equal(result.first.localLightCount, 3);
  assert.ok(result.submittedTriangles < 60000, `Triangle budget exceeded: ${result.submittedTriangles}`);
  assert.ok(result.minProcessorClearance > .35, `Walker intersects a raised processor: ${result.minProcessorClearance}`);
  assert.ok(result.shoeSupport.minSoleClearance >= .00199, 'Actual shoe geometry stays above the slab');
  assert.ok(result.shoeSupport.maxPlantedClearance < .00001, 'Each walker has an actual shoe sole on the support plane throughout gait');
  assert.ok(result.shoeSupport.maxSwingClearance > .07 && result.shoeSupport.maxSwingClearance < .107, 'Only the swing foot lifts with a modest stride');
  assert.notDeepEqual(result.first.pedestrianPositions, result.moved.pedestrianPositions);
  assert.notDeepEqual(result.first.trainPositions, result.moved.trainPositions);
  assert.notDeepEqual(result.first.packetPositions, result.moved.packetPositions);
  assert.equal(result.clear.umbrellaCount, 0);
  assert.equal(result.storm.umbrellaCount, 12);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  result.reducedMotion = await page.evaluate(() => {
    const before = window.plazaLife.userData.snapshot();
    for (let tick = 0; tick < 100; tick++) window.plazaLife.userData.update(.1, 500 + tick * .1);
    const after = window.plazaLife.userData.snapshot(); window.plazaLife.userData.dispose();
    return { before, after };
  });
  assert.equal(result.reducedMotion.after.reducedMotion, true);
  assert.deepEqual(result.reducedMotion.after, result.reducedMotion.before);
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/motion-and-geometry.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ pass: true, submittedTriangles: result.submittedTriangles, uniqueTriangles: result.uniqueTriangles, meshCount: result.meshCount, minProcessorClearance: result.minProcessorClearance, walkerCount: 48, trains: 2, localLights: 3, reducedMotionFrozen: true }));
} finally { await browser.close(); }
