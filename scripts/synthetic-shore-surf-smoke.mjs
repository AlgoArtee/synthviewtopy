import { chromium } from 'playwright';
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = process.env.SYNTHETIC_SHORE_OUTPUT ?? 'output/synthetic-shore-surf';
await mkdir(output, { recursive: true });
const layoutBundle = await build({
  stdin: {
    contents: `import { BEACH_COAST_POINTS, sampleBeachCoast } from './src/world/syntheticBeachLayout';
      export const samples = [28,64,104,152,192,232,280,320,356].map(index => {
        const x = BEACH_COAST_POINTS[index*2], z = BEACH_COAST_POINTS[index*2+1];
        return {index,x,z,...sampleBeachCoast(x,z)};
      });`,
    loader: 'ts', resolveDir: resolve('.'),
  }, bundle: true, write: false, platform: 'node', format: 'esm',
});
const { samples } = await import(`data:text/javascript;base64,${Buffer.from(layoutBundle.outputFiles[0].text).toString('base64')}`);
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(120000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const check = (condition, message) => { if (!condition) throw new Error(message); };
try {
  await page.goto(process.env.BASE_URL ?? 'http://127.0.0.1:5182', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.labIsland?.getTextSnapshot);
  await page.waitForSelector('#loading-screen', { state: 'hidden' });
  await page.evaluate(() => window.labIsland.enterSyntheticShore());
  await page.waitForFunction(() => !!window.labIsland.syntheticShore);
  await page.evaluate(() => {
    const world = window.labIsland;
    world.renderer.setAnimationLoop(null);
    world.syntheticShore.setEnvironment({ timeOfDay: 'day', weather: 'clear', waveHeight: 1.2, waterSpeed: 1, reflections: true });
  });
  const coast = await page.evaluate(samples => {
    const s = window.labIsland.syntheticShore;
    return samples.map(p => {
      const at = d => ({ x: p.x + p.normalX*d, z: p.z + p.normalZ*d });
      const inland = at(-10), sea = at(20), wash = at(-1.5);
      const floor = s.effects.groundHeight(wash.x, wash.z);
      const depths = Array.from({ length: 64 }, (_, i) => s.effects.waterHeight(wash.x, wash.z, s.elapsed + i*0.14) - floor);
      return { ...p, inlandHeight: s.effects.groundHeight(inland.x, inland.z), offshoreHeight: s.effects.groundHeight(sea.x, sea.z),
        washFloor: floor, minDepth: Math.min(...depths), maxDepth: Math.max(...depths) };
    });
  }, samples);
  for (const p of coast) {
    check(p.inlandHeight > 0.20 && p.offshoreHeight < -0.10, `Coast ${p.index}: land and sea must meet a continuous sloping beach.`);
    check(p.minDepth < 0 && p.maxDepth > 0.015, `Coast ${p.index}: the swash must cover and uncover the same sand over a wave cycle: ${JSON.stringify(p)}`);
  }
  const screenshots = [];
  const capture = async (name, eye, target, time = 3) => {
    const result = await page.evaluate(({eye,target,time}) => {
      const w = window.labIsland, s = w.syntheticShore;
      s.camera.position.set(...eye);
      s.camera.lookAt(...target);
      s.camera.updateMatrixWorld();
      s.effects.setUnderwater?.(eye[1] < s.effects.waterHeight(eye[0], eye[2], s.elapsed + time) - 0.12);
      s.effects.update(s.camera, s.elapsed + time);
      s.effects.renderReflection(w.renderer, s.scene, s.camera, s.elapsed + time);
      w.renderer.render(s.scene, s.camera);
      return { image: w.renderer.domElement.toDataURL('image/png'), calls: w.renderer.info.render.calls, triangles: w.renderer.info.render.triangles };
    }, { eye,target,time });
    await writeFile(`${output}/${name}.png`, Buffer.from(result.image.split(',')[1], 'base64'));
    screenshots.push({name, calls: result.calls, triangles: result.triangles});
    check(result.calls < 220, `Shore rendering exceeds the existing draw-call budget: ${result.calls}`);
  };
  await capture('01-matching-beach-outline', [42,330,195], [42,0,65], 0);
  const front = samples[3];
  const frontEye = [front.x-front.normalX*4,1.9,front.z-front.normalZ*4];
  const frontTarget = [front.x+front.normalX*15,0,front.z+front.normalZ*15];
  for (const [i,t] of [0,2.8,5.6].entries()) await capture(`02-front-swash-${i}`,frontEye,frontTarget,t);
  for (const [name,p] of [['03-west-wash',samples[1]],['04-east-wash',samples[7]]]) {
    await capture(name,[p.x-p.normalX*4,1.9,p.z-p.normalZ*4],[p.x+p.normalX*18,0,p.z+p.normalZ*18],8.4);
  }
  const sea = { x: front.x+front.normalX*100, z: front.z+front.normalZ*100 };
  const floor = await page.evaluate(p=>window.labIsland.syntheticShore.groundHeight(p.x,p.z),sea);
  const diveY = Math.max(floor+0.9,-2.5);
  check(diveY < -0.3,'The exposed coast must have enough seabed depth for underwater swimming.');
  await capture('05-underwater-seabed',[sea.x,diveY,sea.z],[sea.x+front.normalX*12,floor,sea.z+front.normalZ*12],9);
  await capture('06-underwater-surface',[sea.x,diveY,sea.z],[sea.x,8,sea.z-8],9.2);
  check(errors.length === 0,`Browser/WebGL errors: ${errors.join('\n')}`);
  await writeFile(`${output}/surf-results.json`, JSON.stringify({ status:'passed',coast,screenshots,errors },null,2));
  console.log(JSON.stringify({status:'passed',coastSamples:coast.length,screenshots,errors}));
} finally { await browser.close(); }
