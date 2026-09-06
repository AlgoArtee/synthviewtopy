import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const errors = [];
try {
 const page = await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
 page.on('console', msg => { if(msg.type()==='error') errors.push(msg.text()); });
 page.on('pageerror', err=>errors.push(err.message));
 await page.route('**/__effects-check', route=>route.fulfill({contentType:'text/html',body:'<!doctype html><style>body{margin:0}</style><body></body>'}));
 await page.goto('http://127.0.0.1:5178/__effects-check');
 const result = await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js');
  const {createSyntheticShoreEffects}=await import('/src/world/syntheticShoreEffects.ts');
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(1280,800);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1;
  document.body.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(62,1280/800,.05,18000);
  const effects=createSyntheticShoreEffects();
  scene.add(effects.group);
  camera.position.set(0,effects.groundHeight(0,18)+1.7,18);
  camera.lookAt(0,5,-120);
  effects.update(camera,2);
  effects.renderReflection(renderer,scene,camera,2);
  renderer.render(scene,camera);
  window.__shoreTest={renderer,scene,camera,effects};
  return {drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,cygnus:effects.getCygnusState(),memory:renderer.info.memory};
 });
 await page.screenshot({path:'output/synthetic-shore/effects-ocean-t2.png'});
 const animated=await page.evaluate(()=>{
  const {renderer,scene,camera,effects}=window.__shoreTest;
  const before=effects.getCygnusState();
  effects.update(camera,6); effects.renderReflection(renderer,scene,camera,6); renderer.render(scene,camera);
  return {before,after:effects.getCygnusState()};
 });
 await page.screenshot({path:'output/synthetic-shore/effects-ocean-t6.png'});
 await page.evaluate(()=>{const {renderer,effects}=window.__shoreTest;effects.dispose();renderer.dispose();});
 console.log(JSON.stringify({result,animated,errors},null,2));
 if(errors.length) process.exitCode=1;
} finally { await browser.close(); }
