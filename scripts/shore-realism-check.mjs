import { build } from 'esbuild';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = process.env.SHORE_REALISM_OUTPUT ?? 'output/shore-realism/proof';
await mkdir(output, { recursive: true });
const bundle = await build({ stdin: { contents: `
  export * from './src/world/syntheticShore/shore';
  export * from './src/world/syntheticShore/simulation';
  export { BEACH_COAST_POINTS, sampleBeachCoast } from './src/world/syntheticBeachLayout';
`, loader: 'ts', resolveDir: resolve('.') }, bundle: true, write: false, format: 'esm', platform: 'node' });
const model = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const check = (condition, message) => { if (!condition) throw new Error(message); };
const result = { status: 'running', errors: [] };
const period = model.SHORE_SURF_PERIOD;
const xs = [-11.7, -9.2, -6, -2, 0, 2, 4, 7, 12, 18, 24, 38, 72, 95, 140, 199, 220];
const zs = [-120, 0, 183, 360];
const heights = [0, 0.3, 1.2, 3];
const times = [-2, 0, 1.7, 5.2, 12];
const points = xs.flatMap(x => zs.map(z => [x, z]));

// Independent finite differences catch incorrect analytic normals at wash,
// depth-limiter and shore/offshore transitions, rather than restating the shader.
let maxGradientError = 0, connectedSamples = 0, wetDrySamples = 0;
for (const h of heights) for (const t of times) for (const [x, z] of points) {
  const sample = model.sampleNormalWaveSurface(x, z, t, h);
  const epsilon = 0.0001;
  const dx = (model.sampleNormalWave(x + epsilon, z, t, h) - model.sampleNormalWave(x - epsilon, z, t, h)) / (2 * epsilon);
  const dz = (model.sampleNormalWave(x, z + epsilon, t, h) - model.sampleNormalWave(x, z - epsilon, t, h)) / (2 * epsilon);
  maxGradientError = Math.max(maxGradientError, Math.abs(sample.dx - dx), Math.abs(sample.dz - dz));
}
check(maxGradientError < 0.0004, `Surface normal derivative error: ${maxGradientError}`);
for (const h of heights.slice(1)) for (const z of zs) {
  let minDepth = Infinity, maxDepth = -Infinity;
  for (let frame = 0; frame < 240; frame++) {
    const t = frame * period / 240;
    const depth = model.sampleShoreSurface(-1.5, z, t, h).height - model.seafloorHeight(-1.5, z);
    minDepth = Math.min(minDepth, depth); maxDepth = Math.max(maxDepth, depth);
    for (let x = 4; x <= 90; x += 0.5) {
      check(model.sampleShoreSurface(x, z, t, h).height > model.seafloorHeight(x, z), `Disconnected water at ${x}, ${z}, ${t}, H=${h}`);
      connectedSamples++;
    }
  }
  // Small wave runup may not reach -1.5 m. Normal and storm waves must.
  if (h >= 1.2) { check(minDepth < 0 && maxDepth > 0.01, `No cover/uncover cycle at z=${z}, H=${h}`); wetDrySamples++; }
}
let advancing = 0, retreating = 0;
for (let i = 0; i < 8400; i++) {
  if (model.sampleShoreWash(0, 0, i * period / 8400).rate > 0) advancing++; else retreating++;
}
const uprushSeconds = advancing / 8400 * period, backwashSeconds = retreating / 8400 * period;
check(uprushSeconds > 2.5 && uprushSeconds < 3.3 && backwashSeconds > 5.1, 'Wash timing must have faster uprush and slower drainage.');
const speeds = [0, 5, 20, 50].map(distance => ({ distance, metresPerSecond: model.shoreWaveSpeed(distance) }));
for (let i = 1; i < speeds.length; i++) check(speeds[i].metresPerSecond > speeds[i - 1].metresPerSecond, 'Waves must slow shoreward.');
result.physics = { maxGradientError, connectedSamples, wetDrySamples, uprushSeconds, backwashSeconds, speeds };

const browser = await chromium.launch({ headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(120000);
page.on('pageerror', error => result.errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') result.errors.push(message.text()); });
try {
  await page.goto(process.env.BASE_URL ?? 'http://127.0.0.1:5178', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.labIsland?.getTextSnapshot);
  await page.waitForSelector('#loading-screen', { state: 'hidden' });
  await page.evaluate(() => window.labIsland.enterSyntheticShore());
  await page.waitForFunction(() => !!window.labIsland.syntheticShore);
  await page.evaluate(() => window.labIsland.renderer.setAnimationLoop(null));

  // Execute the actual GLSL on the GPU and compare height, slopes, wetness and
  // all foam channels with CPU buoyancy. No duplicated JavaScript GPU emulation.
  const gpu = await page.evaluate(async ({ bathymetry, waves, points, heights, times }) => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const renderer = window.labIsland.renderer;
    const coords = new Float32Array(points.length * 4);
    points.forEach(([x, z], i) => coords.set([x, z, 0, 1], i * 4));
    const texture = new THREE.DataTexture(coords, points.length, 1, THREE.RGBAFormat, THREE.FloatType);
    texture.needsUpdate = true;
    const uniforms = { uTime: { value: 0 }, uWaveHeight: { value: 0 }, uSamples: { value: texture } };
    const source = `uniform float uTime; uniform float uWaveHeight; uniform sampler2D uSamples;
      ${bathymetry}\n${waves}\nvoid main() {
      vec2 p = texture2D(uSamples, vec2(gl_FragCoord.x / ${points.length}.0, 0.5)).xy;
      OUTPUT
    }`;
    const surfaceMaterial = new THREE.ShaderMaterial({ uniforms, vertexShader: 'void main(){gl_Position=vec4(position.xy,0.0,1.0);}',
      fragmentShader: source.replace('OUTPUT', 'gl_FragColor = vec4(normalWaveSurfaceLocalGLSL(p), shoreLocalWetnessGLSL(p));'), depthTest: false, depthWrite: false });
    const foamMaterial = new THREE.ShaderMaterial({ uniforms, vertexShader: surfaceMaterial.vertexShader,
      fragmentShader: source.replace('OUTPUT', 'gl_FragColor = shoreLocalFoamState(p);'), depthTest: false, depthWrite: false });
    const target = new THREE.WebGLRenderTarget(points.length, 1, { type: THREE.FloatType, depthBuffer: false });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, surfaceMaterial), scene = new THREE.Scene();
    scene.add(mesh);
    const camera = new THREE.Camera(), outputs = [];
    const oldTarget = renderer.getRenderTarget();
    for (const h of heights) for (const t of times) {
      uniforms.uWaveHeight.value = h; uniforms.uTime.value = t;
      const data = {};
      for (const [name, material] of [['surface', surfaceMaterial], ['foam', foamMaterial]]) {
        mesh.material = material;
        renderer.setRenderTarget(target); renderer.render(scene, camera);
        const buffer = new Float32Array(points.length * 4);
        renderer.readRenderTargetPixels(target, 0, 0, points.length, 1, buffer);
        data[name] = Array.from(buffer);
      }
      outputs.push({ h, t, ...data });
    }
    renderer.setRenderTarget(oldTarget);
    geometry.dispose(); surfaceMaterial.dispose(); foamMaterial.dispose(); target.dispose(); texture.dispose();
    return outputs;
  }, { bathymetry: model.oceanBathymetryGLSL, waves: model.oceanWaveGLSL, points, heights, times });
  let maxHeightError = 0, maxSlopeError = 0, maxWetnessError = 0, maxFoamError = 0;
  for (const row of gpu) points.forEach(([x, z], i) => {
    const s = model.sampleNormalWaveSurface(x, z, row.t, row.h);
    const foam = model.sampleShoreFoam(x, z, row.t, row.h);
    maxHeightError = Math.max(maxHeightError, Math.abs(s.height - row.surface[i * 4]));
    maxSlopeError = Math.max(maxSlopeError, Math.abs(s.dx - row.surface[i * 4 + 1]), Math.abs(s.dz - row.surface[i * 4 + 2]));
    maxWetnessError = Math.max(maxWetnessError, Math.abs(model.sampleShoreWetness(x, z, row.t, row.h) - row.surface[i * 4 + 3]));
    [foam.breaker, foam.swashFront, foam.residualFoam].forEach((value, j) => {
      maxFoamError = Math.max(maxFoamError, Math.abs(value - row.foam[i * 4 + j]));
    });
  });
  check(maxHeightError < 0.0002 && maxSlopeError < 0.0005 && maxWetnessError < 0.001 && maxFoamError < 0.001,
    `GPU/CPU disagreement: ${JSON.stringify({ maxHeightError, maxSlopeError, maxWetnessError, maxFoamError })}`);
  result.gpuParity = { samples: gpu.length * points.length, maxHeightError, maxSlopeError, maxWetnessError, maxFoamError };

  const anchorIndex = 166;
  const x = model.BEACH_COAST_POINTS[anchorIndex * 2], z = model.BEACH_COAST_POINTS[anchorIndex * 2 + 1];
  const coast = model.sampleBeachCoast(x, z);
  const at = (distance, lateral, y) => [x + coast.normalX * distance - coast.normalZ * lateral, y, z + coast.normalZ * distance + coast.normalX * lateral];
  const views = {
    wading: { eye: at(3, 1, 1.55), target: at(40, 1, 0.3), pixelRatio: 1 },
    wash: { eye: at(-5, -3, 1.75), target: at(8, 6, 0), pixelRatio: 1 },
    'water-detail': { eye: at(8, 0, 1.4), target: at(10, 0, 0), pixelRatio: 1 },
    'water-detail-low': { eye: at(8, 0, 1.4), target: at(10, 0, 0), pixelRatio: 0.75 },
  };
  result.captures = [];
  for (const [view, pose] of Object.entries(views)) {
    await mkdir(`${output}/${view}`, { recursive: true });
    for (let frame = 0; frame < 32; frame++) {
      const t = frame * period / 32;
      const capture = await page.evaluate(({ pose, t, view }) => {
        const w = window.labIsland, s = w.syntheticShore;
        w.renderer.setPixelRatio(pose.pixelRatio);
        s.setEnvironment({ timeOfDay: view === 'wading' ? 'sunset' : 'day', weather: 'clear', waveHeight: 1.2, waterSpeed: 1, reflections: true });
        s.camera.position.set(...pose.eye); s.camera.lookAt(...pose.target); s.camera.updateMatrixWorld();
        s.effects.setUnderwater(false); s.effects.update(s.camera, t);
        // The runtime clock deliberately never rewinds. Set only the test
        // shader clock so each view depicts exactly the labelled wave phase.
        s.effects.water.material.uniforms.uTime.value = t;
        s.effects.sand.material.uniforms.uTime.value = t;
        s.effects.renderReflection(w.renderer, s.scene, s.camera, t);
        w.renderer.render(s.scene, s.camera);
        return { image: w.renderer.domElement.toDataURL('image/png'), calls: w.renderer.info.render.calls, triangles: w.renderer.info.render.triangles };
      }, { pose, t, view });
      check(capture.calls < 220, `Rendering budget exceeded: ${capture.calls}`);
      await writeFile(`${output}/${view}/${String(frame).padStart(2, '0')}.png`, Buffer.from(capture.image.split(',')[1], 'base64'));
      result.captures.push({ view, frame, seconds: t, pixelRatio: pose.pixelRatio, calls: capture.calls, triangles: capture.triangles });
    }
  }
  check(result.errors.length === 0, `Browser/GLSL errors: ${result.errors.join('\n')}`);
  result.status = 'passed';
  await writeFile(`${output}/results.json`, JSON.stringify(result, null, 2));
  await writeFile(`${output}/wave-cycle.html`, `<!doctype html><meta charset="utf-8"><title>Shore wave cycle verification</title>
    <style>body{margin:28px;background:#10232c;color:#e9f3f4;font:16px system-ui}main{max-width:1100px;margin:auto}img{width:100%;border-radius:8px}button,select,input{margin:12px 10px 12px 0}a{color:#9edbe6}p{line-height:1.5}input{width:50%}</style>
    <main><h1>Shore wave cycle</h1><p>32 rendered frames across 8.4 seconds. Use the slider to inspect the incoming crest, maximum runup and drainage. The camera stays fixed.</p>
    <select id="view"><option value="water-detail">Wading and looking down · daylight</option><option value="water-detail-low">Wading and looking down · reduced resolution</option><option value="wash">Sand and shallow wash · daylight</option><option value="wading">Close water · sunset</option></select><button id="play">Pause</button><input id="frame" type="range" min="0" max="31" value="0"><span id="time"></span><img id="image" alt="Rendered shoreline wave cycle">
    <p>Measured uprush ${uprushSeconds.toFixed(2)} s, drainage ${backwashSeconds.toFixed(2)} s. ${result.gpuParity.samples} GPU/CPU samples; maximum water height disagreement ${(maxHeightError * 1000).toFixed(3)} mm. ${connectedSamples.toLocaleString('en-US')} connected-water samples passed. These verify the rendering approximation; they do not establish engineering accuracy.</p>
    <p><a href="https://oceanservice.noaa.gov/education/tutorial_currents/03coastal2.html">NOAA: shallow-water approach and sheet flow</a> · <a href="https://www.usgs.gov/publications/observations-wave-runup-setup-and-swash-natural-beaches">USGS: observed runup and swash</a> · <a href="results.json">Full measurements</a></p></main>
    <script>let running=true;const frame=document.querySelector('#frame'),view=document.querySelector('#view');function show(){document.querySelector('#image').src=view.value+'/'+String(frame.value).padStart(2,'0')+'.png';document.querySelector('#time').textContent=(frame.value*8.4/32).toFixed(2)+' s';}frame.oninput=()=>{running=false;document.querySelector('#play').textContent='Play';show()};view.onchange=show;document.querySelector('#play').onclick=e=>{running=!running;e.target.textContent=running?'Pause':'Play'};setInterval(()=>{if(running){frame.value=(Number(frame.value)+1)%32;show()}},262.5);show();</script>`);
  console.log(JSON.stringify({ ...result, captures: result.captures.length }));
} finally { await browser.close(); }
