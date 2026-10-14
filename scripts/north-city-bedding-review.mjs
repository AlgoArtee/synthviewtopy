import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-9/pass-1';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
async function view(id){
 if((await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();
 if(!(await state()).menuOpen)await page.locator('#room-menu-toggle').click();
 await page.locator(`[data-viewpoint="${id}"]`).click();await page.locator('#city-controls-toggle').click();
 await page.evaluate(()=>window.advanceTime(100));await page.waitForTimeout(150);
}
try{
 await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});
 const initial=await state();await page.locator('#city-controls-toggle').click();await page.screenshot({path:out+'/entrance.png'});
 const captureViews=initial.viewpoints.filter(v=>!process.env.CITY_VIEW_FILTER||process.env.CITY_VIEW_FILTER.split(',').includes(v.id));
 for(const v of captureViews){await view(v.id);await page.screenshot({path:out+'/'+v.id+'.png'});console.log('CAPTURED '+v.id);}
 for(const mode of ['clear','rain','snow']){
  await page.locator('#city-controls-toggle').click();await page.locator('#city-weather-select').selectOption(mode);await view('duvet');
  assert.equal((await state()).weather.mode,mode);await page.screenshot({path:out+'/duvet-'+mode+'.png'});
  if(process.env.CITY_PILLOW_WEATHER&&mode==='clear')for(const id of ['pillow-side','pillow-low','duvet-pillow-edge','cat-cushions','cat-cushion-row']){await view(id);await page.screenshot({path:out+'/'+id+'-'+mode+'.png'});}
 }
 if(process.env.CITY_PILLOW_WEATHER){await page.locator('#city-controls-toggle').click();await page.locator('#city-weather-select').selectOption('academic-rainy-dusk');for(const id of ['pillow-side','pillow-low','duvet-pillow-edge','cat-cushions','cat-cushion-row']){await view(id);await page.screenshot({path:out+'/'+id+'-evening.png'});}}
 await page.locator('#city-controls-toggle').click();await page.locator('#city-weather-select').selectOption('rain');await view('panorama');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/mobile-panorama.png'});
 await view('cat-cushions');await page.screenshot({path:out+'/mobile-cat-cushions.png'});
 const fit=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.equal(fit.width,fit.scroll);assert.deepEqual(errors,[]);
 await writeFile(out+'/bedding-results.json',JSON.stringify({initial,views:captureViews.length,fit,errors},null,2));console.log(JSON.stringify({ready:true,views:captureViews.length,errors}));
}finally{await browser.close();}
