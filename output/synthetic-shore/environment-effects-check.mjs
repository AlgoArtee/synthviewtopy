import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const folder = 'output/synthetic-shore/environment';
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
try {
  await page.route('**/__shore_environment_check__', route => route.fulfill({
    contentType: 'text/html', body: '<html><body style="margin:0"></body></html>' }));
  await page.goto('http://127.0.0.1:5178/__shore_environment_check__');
  const setup = await page.evaluate(async () => {
    const THREE = await import('/node_modules/.vite/deps/three.js');
    const { createSyntheticShoreEffects } = await import('/src/world/syntheticShoreEffects.ts');
    const effects = createSyntheticShoreEffects({ quality: 'balanced' });
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(960, 640);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    document.body.append(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(effects.group);
    const camera = new THREE.PerspectiveCamera(65, 1.5, 0.05, 16000);
    camera.position.set(0, 1.8, 9);
    camera.lookAt(0, 5, -34);
    window.check = { effects, renderer, scene, camera };
    return effects.getEnvironment();
  });
  const variants = [];
  for (const timeOfDay of ['day', 'sunset', 'night']) {
    for (const weather of ['clear', 'cloudy', 'rain', 'storm']) {
      variants.push(await page.evaluate(({timeOfDay, weather}) => {
        const { effects, renderer, scene, camera } = window.check;
        effects.setEnvironment({ timeOfDay, weather });
        effects.update(camera, 10);
        effects.renderReflection(renderer, scene, camera, 10);
        renderer.render(scene, camera);
        return { ...effects.getEnvironment(), lighting: effects.getLighting(),
          rainVisible: effects.group.getObjectByName('Synthetic shore rainfall').visible,
          calls: renderer.info.render.calls };
      }, {timeOfDay, weather}));
      await page.screenshot({ path: `${folder}/${timeOfDay}-${weather}.png` });
    }
  }
  const validation = await page.evaluate(() => {
    const {effects, renderer, scene, camera} = window.check;
    effects.setEnvironment({waveHeight: 100,waterSpeed:-10,waterColor:'invalid',reflections:false});
    const clamped = effects.getEnvironment();
    effects.update(camera,11);
    const t0 = effects.water.material.uniforms.uTime.value;
    const cygnus0 = effects.getCygnusState().animation.coronaPhase;
    effects.update(camera,12);
    const frozen = effects.water.material.uniforms.uTime.value === t0;
    const cygnusMoves = effects.getCygnusState().animation.coronaPhase !== cygnus0;
    effects.renderReflection(renderer,scene,camera,12);
    const reflectionDisabled = effects.water.material.uniforms.uReflectionStrength.value === 0;
    effects.setEnvironment({waterSpeed:2});
    effects.update(camera,13);
    const continuousSpeed = Math.abs(effects.water.material.uniforms.uTime.value-t0-2) < 1e-6;
    effects.dispose();
    const disposed = effects.group.parent === null;
    return {clamped,frozen,cygnusMoves,reflectionDisabled,continuousSpeed,disposed};
  });
  const results = {setup,variants,validation,errors};
  await writeFile(`${folder}/results.json`, JSON.stringify(results,null,2));
  if(errors.length || !validation.frozen || !validation.cygnusMoves || !validation.reflectionDisabled || !validation.continuousSpeed || !validation.disposed || validation.clamped.waveHeight !== 3 || validation.clamped.waterSpeed !== 0) throw new Error(JSON.stringify(results));
  console.log(JSON.stringify({variants:variants.length,validation,errors},null,2));
} finally { await browser.close(); }
