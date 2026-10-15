import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {chromium} from 'playwright';

const output='test-artifacts/north-city/revision-41/native';await mkdir(output,{recursive:true});
const sourcePath='src/apartments/osCityCamera.ts',source=await readFile(sourcePath,'utf8');
const roundTripName='Returning to the same look angle restores the same camera';
function roundTrip(captures){
 const a=captures.find(c=>c.name==='after-ahead'),b=captures.find(c=>c.name==='after-return-ahead');
 const difference=Math.abs(a.rotation[0]-b.rotation[0]);
 // Browser pointer coordinates have float32 rounding; 1e-6 rad is far below one screen pixel.
 return {passed:difference<1e-6&&a.projection.every((v,i)=>Math.abs(v-b.projection[i])<1e-10),name:roundTripName,evidence:{differenceRadians:difference,toleranceRadians:1e-6}};
}
if(process.argv.includes('--verify-existing')){
 const saved=JSON.parse(await readFile(output+'/results.json','utf8'));
 assert.equal(saved.sourceHash,createHash('sha256').update(source).digest('hex'),'Captured camera source must still match');
 assert.equal(saved.failure,undefined);assert.equal(saved.errors.length,0);
 const corrected=roundTrip(saved.captures);saved.checks=saved.checks.map(c=>c.name===roundTripName?corrected:c);
 saved.validationNote='Revalidated unchanged recorded native camera measurements with a subpixel pointer-rounding tolerance; original results.json retained.';
 await writeFile(output+'/validated-results.json',JSON.stringify(saved,null,2));assert.ok(saved.checks.every(c=>c.passed));
 console.log(JSON.stringify({pass:true,checks:saved.checks.length,captures:saved.captures.length,roundTrip:corrected},null,2));process.exit(0);
}
const previousSource=await readFile('test-artifacts/north-city/revision-41/osCityCamera-before.ts','utf8');
const oldCode=ts.transpileModule(previousSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
 .replace("'three'","'http://127.0.0.1:5178/node_modules/three/build/three.module.js'").replace("'./osCityLayout'","'http://127.0.0.1:5178/src/apartments/osCityLayout.ts'");
const legacyModule='data:text/javascript;base64,'+Buffer.from(oldCode).toString('base64');
const report={checks:[],errors:[],captures:[],sourceHash:createHash('sha256').update(source).digest('hex')};
const check=(passed,name,evidence)=>report.checks.push({passed:!!passed,name,evidence});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});let page;
try{
 page=await browser.newPage({viewport:{width:1280,height:900}});
 await page.addInitScript(()=>{window.__qaObjects=[];window.__THREE_DEVTOOLS__={dispatchEvent:e=>{if(e.type==='observe')window.__qaObjects.push(e.detail);}};});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment',{waitUntil:'domcontentloaded',timeout:120000});
 console.log('Waiting for the actual room');await page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:300000});
 await page.evaluate(async legacyModule=>{
  window.__qaLegacyProjection=(await import(legacyModule)).applyCityCameraProjection;
  const scene=window.__qaObjects.find(o=>o.isScene&&o.userData.apartment?.northCity),original=scene.onBeforeRender;
  scene.onBeforeRender=function(renderer,scene,camera,...args){
   if(camera.userData.cityProjection){window.__qaCamera=camera;if(window.__qaLegacy){const {yaw,pitch}=camera.userData.cityProjection;window.__qaLegacyProjection(camera,yaw,pitch);camera.updateMatrixWorld(true);}}
   original.call(this,renderer,scene,camera,...args);
  };
 },legacyModule);
 await page.waitForFunction(()=>window.__qaCamera);console.log('Room ready');
 const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
 const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const show=async()=>{if((await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();};
 const hide=async()=>{if(!(await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();};
 const view=async id=>{await show();if(!(await state()).menuOpen)await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${id}"]`).click();await hide();await settle();};
 const measure=()=>page.evaluate(()=>{const c=window.__qaCamera;return{state:JSON.parse(window.render_game_to_text()),position:c.position.toArray(),rotation:c.rotation.toArray(),projection:c.projectionMatrix.elements.slice(),inverse:c.projectionMatrixInverse.elements.slice()};});
 const drag=async(dx,dy)=>{await page.mouse.move(640,450);await page.mouse.down();await page.mouse.move(640+dx,450+dy,{steps:12});await page.mouse.up();await settle();};
 const look=async pitch=>{const current=await page.evaluate(()=>window.__qaCamera.userData.cityProjection.pitch);await drag(0,(current-pitch)/.003);};
 const shot=async name=>{await settle();await page.screenshot({path:`${output}/${name}.png`});report.captures.push({name,...await measure()});console.log('Captured '+name);};
 await view('balcony-plaza');const eye=(await measure()).position;
 // Same room, pose and lens. Only the previous projection is restored for these baseline images.
 for(const legacy of [true,false]){
  await page.evaluate(value=>{window.__qaLegacy=value;},legacy);await view('balcony-plaza');
  for(const [name,pitch] of [['ahead',0],['mall',-.25],['transition',-.55],['down',-.95],['up',.25],['return-ahead',0]]){await look(pitch);await shot((legacy?'before-':'after-')+name);}
 }
 const current=report.captures.filter(c=>c.name.startsWith('after-')),lens=current[0].projection;
 check(current.every(c=>JSON.stringify(c.position)===JSON.stringify(eye)),'Ahead/down/up look keeps the eye fixed at the guardrail');
 check(current.every(c=>c.projection.every((v,i)=>Math.abs(v-lens[i])<1e-10)),'No lens shift or zoom change during real pointer drags');
 check(current.every(c=>Math.abs(c.rotation[0]-c.state.look.pitch)<.00051&&c.state.look.verticalCorrection===0),'Full range of pointer look uses ordinary physical camera rotation');
 report.checks.push(roundTrip(report.captures));
 // Sweep through both old transition regions in small real pointer movements.
 await look(-.9);const sweep=[];await page.mouse.move(640,680);await page.mouse.down();
 for(let i=0;i<=15;i++){await page.mouse.move(640,680-i*35);await settle();sweep.push(await measure());}await page.mouse.up();
 check(sweep.every(c=>Math.abs(c.rotation[0]-c.state.look.pitch)<.00051&&c.projection.every((v,i)=>Math.abs(v-lens[i])<1e-10)),'Continuous down-to-up sweep has no projection transition');
 await view('balcony-plaza');await look(-.55);await drag(90,0);const yawed=await measure();
 check(Math.abs(yawed.rotation[1]+Math.PI/2+.27)<1e-8&&yawed.rotation[2]===0,'Horizontal look turns naturally without roll');
 await page.mouse.wheel(0,-240);await settle();const zoom=await measure();await look(-.25);const zoomLook=await measure();
 check(zoom.state.look.fov<62&&zoomLook.state.look.fov===zoom.state.look.fov&&zoomLook.projection[9]===0,'Intentional wheel zoom works and remains fixed while looking');await shot('after-zoom');
 await page.setViewportSize({width:390,height:844});await settle();await shot('after-mobile');
 const mobile=await measure();check(mobile.projection[9]===0&&Math.abs(mobile.state.look.renderedPitch-mobile.state.look.pitch)<.00051,'Portrait resize preserves the natural camera');await page.setViewportSize({width:1280,height:900});
 await view('balcony-plaza');await look(-1.1);await shot('after-over-guardrail');
 await page.keyboard.down('w');await page.waitForTimeout(650);await page.keyboard.up('w');await settle();
 const atRail=await state();check(atRail.position[0]>4.77&&atRail.position[0]<=4.78&&atRail.position[1]===1.65,'Looking down still reaches and stays inside the guardrail');
 await view('balcony-door');await show();await page.locator('#city-balcony-door-select').selectOption('open');await hide();await look(-.25);
 const door=[];await page.keyboard.down('w');for(let i=0;i<8;i++){await page.waitForTimeout(150);door.push(await measure());}await page.keyboard.up('w');
 check(door.at(-1).position[2]<-.6&&door.every(c=>c.state.look.verticalCorrection===0&&c.projection[9]===0),'Walking through the doorway never switches perspective');await shot('after-doorway');
 await view('balcony');await shot('after-final-panorama');
 report.sweep=sweep.map(c=>({look:c.state.look,position:c.position}));report.final=await state();
}catch(error){report.failure=error.stack??String(error);if(page)await page.screenshot({path:output+'/failure.png',timeout:10000}).catch(()=>{});}
finally{check(source===await readFile(sourcePath,'utf8'),'Camera source stayed unchanged during capture');check(!report.errors.length,'No browser/WebGL errors',report.errors);await writeFile(output+'/results.json',JSON.stringify(report,null,2));await browser.close();}
assert.equal(report.failure,undefined,report.failure);assert.ok(report.checks.every(c=>c.passed),JSON.stringify(report.checks.filter(c=>!c.passed)));console.log(JSON.stringify({pass:true,checks:report.checks.length,captures:report.captures.length,output}));
