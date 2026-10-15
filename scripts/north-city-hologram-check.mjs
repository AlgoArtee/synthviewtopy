import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const output='test-artifacts/north-city/revision-42/preflight';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const report={checks:[],errors:[]};let page;
try{
 page=await browser.newPage({viewport:{width:800,height:800}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.route('**/hologram-check',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><link rel="icon" href="data:,"></head><body style="margin:0;background:#14232e"></body></html>'}));
 await page.goto('http://127.0.0.1:5178/hologram-check');
 report.initial=await page.evaluate(async()=>{
   const THREE=await import('/node_modules/three/build/three.module.js');const module=await import('/src/apartments/osCityPlazaHolograms.ts');
   localStorage.removeItem('north-city-plaza-holograms-v1');const h=module.createCityHolograms(new THREE.Vector3());await h.ready;
   const scene=new THREE.Scene();scene.background=new THREE.Color('#14232e');scene.add(h.group,new THREE.GridHelper(80,40,'#344656','#22323e'));
   const camera=new THREE.PerspectiveCamera(48,1,.1,200);camera.position.set(-32,30,0);camera.lookAt(0,11,0);
   const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(800,800);renderer.setPixelRatio(1);document.body.append(renderer.domElement);
   const render=()=>{scene.updateMatrixWorld(true);renderer.render(scene,camera);};window.qa={h,module,THREE,scene,camera,renderer,render};h.setWeather('rain','night');h.update(1,true);render();return h.controls.getSnapshot();
 });
 const check=(passed,name,evidence)=>report.checks.push({passed:!!passed,name,evidence});
 check(Object.keys(report.initial.assets).length===14&&Object.values(report.initial.assets).every(v=>v==='ready'),'All fourteen supplied reference textures load');
 for(const id of Object.keys(report.initial.assets)){
   const result=await page.evaluate(id=>{const q=window.qa;q.h.controls.solo(id);q.h.update(1,true);q.render();return{snapshot:q.h.controls.getSnapshot(),calls:q.renderer.info.render.calls};},id);
   await page.screenshot({path:`${output}/${id}.png`});check(result.snapshot.active.length===1&&result.snapshot.active[0].id===id,`Solo renders ${id}`,{calls:result.calls});
 }
 const more=await page.evaluate(async()=>{
   const {h,render,module,THREE,camera}=window.qa,checks=[];const check=(passed,name,evidence)=>checks.push({passed,name,evidence});
   h.controls.solo('jellyfish');h.update(1,true);h.controls.setLevel('phoenix',55);h.controls.setLevel('jellyfish',65);
   for(let i=0;i<100;i++)h.update(.05);render();let state=h.controls.getSnapshot();
   check(state.active.length===2&&state.active.every(x=>x.opacity>0&&x.opacity<1),'Two independently faded designs mix together',state.active);
   const matrix=h.group.children[0].children[0].matrixWorld.elements.slice();camera.position.set(-18,35,15);camera.lookAt(0,11,0);render();
   check(matrix.every((v,i)=>Math.abs(v-h.group.children[0].children[0].matrixWorld.elements[i])<1e-9),'Looking from another angle does not billboard or reshape the hologram');
   h.controls.setSettings({animated:false});const frozen=h.controls.getSnapshot().animationTime;h.update(.1);h.update(.1);check(h.controls.getSnapshot().animationTime===frozen,'Pause freezes scan lines, waves and particles');
   h.controls.setSettings({animated:true});h.update(.1,true);check(h.controls.getSnapshot().animationTime===frozen,'Reduced motion freezes ornamental animation');h.update(.1);check(h.controls.getSnapshot().animationTime>frozen,'Resume advances smoothly from the paused phase');
   h.controls.setSettings({brightness:117,size:123});const restored=module.createCityHolograms(new THREE.Vector3());await restored.ready;
   check(JSON.stringify(restored.controls.getSettings())===JSON.stringify(h.controls.getSettings()),'New instance restores the entire saved mix');restored.dispose();
   h.controls.setSettings({brightness:Infinity,size:-900});h.controls.setLevel('rain',NaN);const clamped=h.controls.getSettings();check(clamped.brightness===117&&clamped.size===60&&clamped.levels.rain===0,'Invalid input is ignored and numeric limits are clamped');
   h.controls.allOff();for(let i=0;i<100;i++)h.update(.05);render();state=h.controls.getSnapshot();check(state.active.length===0&&!state.emitterVisible&&window.qa.renderer.info.render.calls===1,'All off removes artwork, beams and particles after fading');
   h.controls.reset();h.update(1,true);h.controls.setSettings({brightness:0});h.update(1,true);render();check(!h.controls.getSnapshot().emitterVisible,'Master brightness zero switches off the whole projector');
   h.controls.reset();h.update(1,true);render();return checks;
 });report.checks.push(...more);
 await page.screenshot({path:output+'/default.png'});
 report.checks.push({passed:report.errors.length===0,name:'No browser or shader compilation errors'});
}catch(e){report.failure=e.stack;}finally{await writeFile(output+'/results.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report,null,2));assert.equal(report.failure,undefined);assert.ok(report.checks.every(c=>c.passed));
