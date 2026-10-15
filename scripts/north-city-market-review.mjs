import assert from 'node:assert/strict';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const output=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-37/final-1';await mkdir(output,{recursive:true});
const report={checks:[],errors:[],screenshots:[]};
const check=(passed,description,evidence)=>report.checks.push({passed:!!passed,description,evidence});
const hashes=async()=>Object.fromEntries(await Promise.all((await readdir('src/apartments')).filter(n=>/^osCity.*\.ts$/.test(n)||['room.ts','roomRendering.ts'].includes(n)).map(async n=>{const p='src/apartments/'+n;return[p,createHash('sha256').update(await readFile(p)).digest('hex')];})));
const sources=await hashes(),browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});let page;
try{
 page=await browser.newPage({viewport:{width:1440,height:1000}});await page.addInitScript(()=>{window.__qaObjects=[];window.__THREE_DEVTOOLS__={dispatchEvent:e=>{if(e.type==='observe')window.__qaObjects.push(e.detail);}};});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment',{waitUntil:'domcontentloaded',timeout:120000});console.log('Waiting for actual room');
 await page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:600000});console.log('Actual room ready');
 const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text())),settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const show=async()=>{if((await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();},hide=async()=>{if(!(await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();};
 const choose=async(id,value)=>{await show();await page.locator(id).selectOption(value);await hide();await settle();};
 const view=async id=>{await show();if(!(await state()).menuOpen)await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${id}"]`).click();await hide();await settle();};
 const shot=async name=>{await page.screenshot({path:output+'/'+name+'.png'});report.screenshots.push({name:name+'.png',state:await state()});console.log('CAPTURE '+name);};
 await choose('#city-time-select','day');await choose('#city-weather-select','clear');
 for(const side of ['north','south']){await view('balcony-market-'+side);await shot(side+'-market-day');}
 await view('balcony-plaza');await page.mouse.move(700,450);await page.mouse.wheel(0,350);await settle();await shot('whole-plaza-day');
 const s=await state(),m=s.balconyExterior.market;check(m.count===10,'Ten themed stalls in the actual scene',m);check(m.stalls.filter(s=>s.z<0).length===5&&m.stalls.filter(s=>s.z>0).length===5,'Five stalls on each side');
 check(m.drawCalls<40&&m.triangles<100000,'Market geometry stays within 40 draw calls / 100k triangles', {drawCalls:m.drawCalls,triangles:m.triangles});
 check(s.balconyExterior.life.standingResidents.length===145&&s.balconyExterior.life.walkerCount===48,'Existing neighborhood population retained');
 const a=s.balconyExterior.life.pedestrianPositions;await page.waitForTimeout(900);const b=(await state()).balconyExterior.life.pedestrianPositions;
 check(a.some((p,i)=>Math.hypot(p[0]-b[i][0],p[2]-b[i][2])>.1),'Residents continue walking around the market');
 await choose('#city-time-select','night');await choose('#city-weather-select','rain');
 for(const side of ['north','south']){await view('balcony-market-'+side);await shot(side+'-market-night-rain');}
 await choose('#city-time-select','morning');await choose('#city-weather-select','snow');await view('balcony-market-north');await shot('north-market-snow');check((await state()).balconyExterior.market.snowVisible,'Stall canopies respond to snow');
 await choose('#city-time-select','day');await choose('#city-weather-select','clear');
 // Supplemental close inspection: same actual scene/materials and renderer, a
 // temporary camera override only. Primary evidence above uses public balcony views.
 await page.evaluate(()=>{const scene=window.__qaObjects.find(o=>o.isScene&&o.userData.apartment?.northCity),original=scene.onBeforeRender;scene.onBeforeRender=function(renderer,scene,camera,...args){if(camera.userData.cityProjection&&window.__qaMarketView){const v=window.__qaMarketView;camera.position.set(...v.position);camera.lookAt(...v.target);camera.updateMatrixWorld(true);}original.call(this,renderer,scene,camera,...args);};});
 for(let index=0;index<10;index++){
  const stand=m.stalls[index],front=[Math.sin(stand.rotation),Math.cos(stand.rotation)],side=[Math.cos(stand.rotation),-Math.sin(stand.rotation)];
  const sideOffset=stand.type==='fabric'?-3:3;
  await page.evaluate(v=>{window.__qaMarketView=v;},{position:[stand.x+front[0]*8+side[0]*sideOffset,-34.8,stand.z+front[1]*8+side[1]*sideOffset],target:[stand.x,-36.3,stand.z]});await settle();await shot('detail-'+stand.type);
 }
 await page.evaluate(()=>{delete window.__qaMarketView;});
 report.final=await state();check(report.final.balconyExterior.transitGuideway.closed===false&&report.final.balconyExterior.neonClub.groundFloorEnclosed,'Through railway and enclosed club preserved');
}catch(error){report.failure=error.stack??String(error);if(page)await page.screenshot({path:output+'/failure.png',timeout:10000}).catch(()=>{});}
finally{const after=await hashes();report.sourceHashes=sources;report.changedSources=Object.keys(sources).filter(p=>sources[p]!==after[p]);check(!report.changedSources.length,'Sources unchanged during captures',report.changedSources);check(!report.errors.length,'No browser/WebGL errors',report.errors);await writeFile(output+'/results.json',JSON.stringify(report,null,2));await browser.close();}
assert.equal(report.failure,undefined,report.failure);assert.ok(report.checks.every(c=>c.passed),JSON.stringify(report.checks.filter(c=>!c.passed)));console.log(JSON.stringify({pass:true,checks:report.checks.length,screenshots:report.screenshots.length,output}));
