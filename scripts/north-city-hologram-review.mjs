import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const output=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-42/native';await mkdir(output,{recursive:true});
const source=await readFile('src/apartments/osCityPlazaHolograms.ts','utf8');
const report={checks:[],errors:[],captures:[],sourceHash:createHash('sha256').update(source).digest('hex')};
const check=(passed,name,evidence)=>report.checks.push({passed:!!passed,name,evidence});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});let page;
try{
 page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment',{waitUntil:'domcontentloaded',timeout:120000});
 console.log('Loading full apartment');await page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:360000});console.log('Apartment ready');
 const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
 const show=async()=>{if((await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();};
 const hide=async()=>{if(!(await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();};
 const shot=async name=>{await page.waitForTimeout(1100);await page.screenshot({path:`${output}/${name}.png`});report.captures.push({name,state:await state()});console.log('Captured '+name);};
 const mixer=async()=>{await show();const d=page.locator('#city-hologram-panel > details');if(!await d.getAttribute('open').then(x=>x!==null))await d.locator(':scope > summary').click();};
 const range=async(id,value)=>{await page.locator('#'+id).evaluate((e,value)=>{e.value=String(value);e.dispatchEvent(new Event('input',{bubbles:true}));},value);};
 await show();await page.locator('#room-menu-toggle').click();await page.locator('[data-viewpoint="balcony-plaza"]').click();
 await mixer();await page.locator('#city-hologram-reset').click();await hide();await shot('day-jellyfish');
 const origin=(await state()).plazaHolograms.worldOrigin;
 check([41.8,-37.31,-5].every((value,index)=>Math.abs(origin[index]-value)<.0001),'Projector originates on the central chip',origin);
 await show();await page.locator('#city-time-select').selectOption('night');await hide();await shot('night-jellyfish');
 const ids=['phoenix','bremen','lorelei','rain','clouds','cold','storm','heat','snow','sunrise','noon','sunset','midnight'];
 for(const id of ids){
   await mixer();const button=page.locator('#city-hologram-solo-'+id);const family=button.locator('xpath=ancestor::details[1]');
   if(await family.getAttribute('open')===null)await family.locator(':scope > summary').click();
   await button.click();await hide();await shot('night-'+id);
   const s=(await state()).plazaHolograms;check(s.active.some(a=>a.id===id)&&s.settings.levels[id]===100,`Mixer solo selects ${id}`);
 }
 await mixer();await page.locator('#city-hologram-solo-jellyfish').click();await range('city-hologram-jellyfish',60);await range('city-hologram-snow',40);await hide();await shot('mixed-jellyfish-snow');
 const mixed=(await state()).plazaHolograms;check(mixed.active.length===2&&mixed.settings.levels.jellyfish===60&&mixed.settings.levels.snow===40,'Independent blend sliders combine two projections',mixed.active);
 await mixer();await page.locator('#city-hologram-animate').uncheck();await page.waitForTimeout(200);const frozen=(await state()).plazaHolograms.animationTime;await page.waitForTimeout(500);check((await state()).plazaHolograms.animationTime===frozen,'UI pause freezes the live projector');
 await page.locator('#city-hologram-animate').check();await page.waitForTimeout(200);check((await state()).plazaHolograms.animationTime>frozen,'UI resume continues animation');
 const eye=(await state()).position;await page.locator('#city-hologram-size').focus();await page.keyboard.press('End');await page.keyboard.press('ArrowLeft');
 check((await state()).plazaHolograms.settings.size===139&&JSON.stringify((await state()).position)===JSON.stringify(eye),'Keyboard range adjustment does not move the camera');
 await range('city-hologram-size',100);await page.locator('#city-hologram-off').click();await hide();await shot('all-off');check(!(await state()).plazaHolograms.emitterVisible,'All off clears the full light volume');
 await mixer();await page.locator('#city-hologram-reset').click();await shot('mixer-desktop');
 await page.setViewportSize({width:390,height:844});await page.locator('#city-hologram-panel').scrollIntoViewIfNeeded();await shot('mixer-mobile');
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mixer fits a narrow mobile viewport');
 await page.setViewportSize({width:1440,height:1000});await show();await page.locator('#city-time-select').selectOption('day');await hide();await shot('final-day-jellyfish');
 report.final=await state();check(Object.values(report.final.plazaHolograms.assets).every(v=>v==='ready'),'All fourteen assets loaded in the actual apartment');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('north-city-plaza-holograms-v1')));check(JSON.stringify(stored)===JSON.stringify(report.final.plazaHolograms.settings),'UI changes are saved to browser storage');
}catch(e){report.failure=e.stack;if(page)await page.screenshot({path:output+'/failure.png',timeout:10000}).catch(()=>{});}
finally{check(!report.errors.length,'No browser/WebGL errors',report.errors);check(source===await readFile('src/apartments/osCityPlazaHolograms.ts','utf8'),'Projection source remained unchanged during capture');await writeFile(output+'/results.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({checks:report.checks,failure:report.failure,captures:report.captures.length},null,2));assert.equal(report.failure,undefined);assert.ok(report.checks.every(c=>c.passed));
