import assert from 'node:assert/strict';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const output=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-34/final-1';await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0);
const report={checks:[],errors:[],screenshots:[],manualTimeAdvancement:false};
const check=(passed,description,evidence)=>report.checks.push({passed:!!passed,description,evidence});
const hashes=async()=>Object.fromEntries(await Promise.all((await readdir('src/apartments')).filter(n=>/^osCity.*\.ts$/.test(n)||['room.ts','roomRendering.ts'].includes(n)).map(async n=>{const p='src/apartments/'+n;return[p,createHash('sha256').update(await readFile(p)).digest('hex')];})));
const sources=await hashes(),browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});let page;
try{
 page=await browser.newPage({viewport:{width:1240,height:892}});await page.addInitScript(()=>{window.__qaObjects=[];window.__THREE_DEVTOOLS__={dispatchEvent:e=>{if(e.type==='observe')window.__qaObjects.push(e.detail);}};});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment',{waitUntil:'domcontentloaded',timeout:120000});console.log('Waiting for native room');
 await page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:300000});console.log('Native room ready');
 await page.evaluate(()=>{const s=window.__qaObjects.find(o=>o.isScene&&o.userData.apartment?.northCity);window.__qaScene=s;const old=s.onBeforeRender;s.onBeforeRender=function(r,s,c,...a){if(c.userData.cityProjection)window.__qaCamera=c;old.call(this,r,s,c,...a);};});
 const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text())),settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const show=async()=>{if((await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();},hide=async()=>{if(!(await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();};
 const choose=async(id,value)=>{await show();await page.locator(id).selectOption(value);await hide();await settle();};
 const view=async id=>{await show();if(!(await state()).menuOpen)await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${id}"]`).click();await hide();await settle();};
 const walk=async(key,ms)=>{await page.locator('canvas').first().focus();await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);await settle();};
 const drag=async(dx,dy)=>{await page.mouse.move(600,410);await page.mouse.down();await page.mouse.move(600+dx,410+dy,{steps:10});await page.mouse.up();await settle();};
 const shot=async name=>{await page.screenshot({path:output+'/'+name+'.png'});report.screenshots.push({name:name+'.png',state:await state()});console.log('CAPTURE '+name);};
 await choose('#city-time-select','day');await choose('#city-weather-select','clear');await view('balcony');report.start=await state();await walk('w',1400);report.atRail=await state();
 check(report.atRail.position[0]>4.77&&report.atRail.position[0]<=4.78,'W reaches the east guardrail in the live room',report.atRail.position);
 await walk('w',800);check((await state()).position[0]<=4.78,'Holding forward stays inside the balcony');await shot('walk-to-guardrail-day');
 await drag(0,190);check((await state()).look.pitch<-.9,'Manual drag looks down over the rail');await shot('look-down-day');
 const rayCheck=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js'),s=window.__qaScene,c=window.__qaCamera,objects=[];s.updateMatrixWorld(true);c.updateMatrixWorld(true);
  s.traverse(o=>{let visible=true;for(let p=o;p;p=p.parent)visible&&=p.visible;if(o.isMesh&&!o.isInstancedMesh&&visible&&!o.material.transparent)objects.push(o);});
  const rays=[],ray=new THREE.Raycaster();for(let lane=0;lane<13;lane++){
   const side=-3.9+lane*.61,z=-5+1.3*(-side-Math.sign(side||1)*4),target=new THREE.Vector3(11,-37.93,z);ray.set(c.position,target.clone().sub(c.position).normalize());ray.far=c.position.distanceTo(target)+.1;
   const hit=ray.intersectObjects(objects,false)[0],screen=target.clone().project(c);rays.push({lane,material:hit?.object.material.name,point:hit?.point.toArray(),screen:screen.toArray()});
  }return rays;
 });check(rayCheck.every(r=>r.material?.includes('circuitry')&&Math.abs(r.screen[0])<1&&Math.abs(r.screen[1])<1),'Every near circuit lane is unobstructed and in the downward view',rayCheck);
 await choose('#city-time-select','morning');await shot('look-down-morning');await choose('#city-time-select','night');await shot('look-down-night');
 await view('balcony-plaza');await shot('plaza-viewpoint-night');const a=await state();await page.waitForTimeout(900);const b=await state();check(b.balconyExterior.life.stream.elapsedSeconds>a.balconyExterior.life.stream.elapsedSeconds,'Circuit data streams continue moving');
 await choose('#city-time-select','day');await choose('#city-weather-select','rain');await shot('plaza-viewpoint-rain');await choose('#city-weather-select','clear');await shot('plaza-viewpoint-day');
 await walk('s',500);check((await state()).position[0]<3.9,'S retreats freely from guardrail');await shot('retreat-from-guardrail');
 await view('balcony');await walk('a',2200);const north=await state();check(north.position[2]<-9.43&&north.position[2]>=-9.44,'Sideways walking reaches north rail and remains contained',north.position);await walk('w',1500);const corner=await state();check(corner.position[0]>4.77&&corner.position[0]<=4.78&&corner.position[2]>=-9.44,'Corner stays contained under a second movement direction',corner.position);await drag(0,190);await shot('corner-look-down');
 await choose('#city-balcony-door-select','open');await view('balcony-door');await walk('w',1800);check((await state()).position[2]<-2,'W still crosses the open doorway');await walk('s',1800);check((await state()).position[2]>.7,'S returns through the doorway');await shot('returned-indoors');
 await view('panorama');await shot('north-street-foundations');
 await view('balcony-plaza');await page.setViewportSize({width:390,height:844});await settle();await shot('plaza-mobile');check(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'Mobile viewport has no horizontal overflow');await page.setViewportSize({width:1240,height:892});
 report.final=await state();check(report.final.mallSigns.every((l,i)=>l.level===i+1&&l.left===`LEVEL ${String(i+1).padStart(2,'0')}`&&l.right===l.left),'Correct mall labels remain intact');
 check(report.final.balconyExterior.transitGuideway.closed===false&&report.final.balconyExterior.neonClub.groundFloorEnclosed,'Through railway and enclosed club remain intact');
}catch(error){report.failure=error.stack??String(error);if(page)await page.screenshot({path:output+'/failure.png',timeout:10000}).catch(()=>{});}
finally{const after=await hashes();report.sourceHashes=sources;report.changedSources=Object.keys(sources).filter(p=>sources[p]!==after[p]);check(!report.changedSources.length,'Source stayed frozen during captures');check(!report.errors.length,'No browser/WebGL errors',report.errors);await writeFile(output+'/results.json',JSON.stringify(report,null,2));await browser.close();}
assert.equal(report.failure,undefined,report.failure);assert.ok(report.checks.every(c=>c.passed),JSON.stringify(report.checks.filter(c=>!c.passed)));console.log(JSON.stringify({pass:true,checks:report.checks.length,screenshots:report.screenshots.length,output}));
