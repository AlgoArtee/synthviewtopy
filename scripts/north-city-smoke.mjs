import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.env.BASE_URL??'http://127.0.0.1:5178';
const out=process.env.CITY_OUTPUT??'test-artifacts/north-city/pass-1';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const page=await context.newPage(); const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
try{
  await page.goto(base+'/room.html?id=os-city-apartment&qa=1');
  await page.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});
  await page.waitForTimeout(1200);
  const initial=await state();assert.equal(initial.roomId,'os-city-apartment');assert.equal(initial.location.district,'North City');
  await page.screenshot({path:out+'/entrance.png'});
  const jpeg=await page.locator('#apartment-viewport canvas').evaluate(c=>c.toDataURL('image/jpeg',.93).split(',')[1]);
  await writeFile('public/apartments/os-city-apartment-preview.jpg',Buffer.from(jpeg,'base64'));
  for(const view of initial.viewpoints){
    await page.locator('#room-menu-toggle').click();await page.locator('[data-viewpoint="'+view.id+'"]').click();
    await page.evaluate(()=>window.advanceTime(100));await page.waitForTimeout(200);
    assert.equal((await state()).view,view.id);await page.screenshot({path:out+'/'+view.id+'.png'});
  }
  await page.locator('#room-menu-toggle').click();await page.locator('#room-reset').click();
  await page.locator('#room-menu-toggle').click();await page.locator('[data-viewpoint="kitchen"]').click();
  await page.keyboard.down('w');await page.evaluate(()=>window.advanceTime(5000));await page.keyboard.up('w');const kitchenStop=(await state()).position;
  await page.keyboard.down('w');await page.evaluate(()=>window.advanceTime(1000));await page.keyboard.up('w');assert.deepEqual((await state()).position,kitchenStop);
  await page.locator('#room-menu-toggle').click();await page.locator('#room-reset').click();
  const before=(await state()).position;await page.keyboard.down('w');await page.evaluate(()=>window.advanceTime(150));await page.keyboard.up('w');
  const after=(await state()).position;assert.notDeepEqual(after,before);
  await page.locator('#room-menu-toggle').click();await page.keyboard.press('Escape');assert.equal((await state()).menuOpen,false);
  await page.setViewportSize({width:390,height:844});await page.locator('#room-menu-toggle').click();await page.locator('#room-reset').click();await page.waitForTimeout(300);
  await page.screenshot({path:out+'/mobile.png'});
  const fit=await page.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth}));assert.equal(fit.w,fit.scroll);
  await page.locator('#room-menu-toggle').click();await page.screenshot({path:out+'/mobile-guide.png'});
  await writeFile(out+'/results.json',JSON.stringify({initial,walking:{before,after},mobile:fit,errors},null,2));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({ready:true,views:initial.viewpoints.length,errors,out,render:initial.render}));
}finally{await browser.close();}
