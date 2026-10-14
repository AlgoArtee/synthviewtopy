import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const base=process.env.BASE_URL??'http://127.0.0.1:5178';
const out='test-artifacts/north-city/integration';await mkdir(out,{recursive:true});
const html=await readFile('index.html','utf8');assert(html.indexOf('href="/north-city.html"')<html.indexOf('href="/apartments.html"'));assert(html.includes('North City'));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto(base+'/north-city.html');await page.waitForLoadState('networkidle');
  assert.match(await page.title(),/North City/);
  const links=page.locator('a[href*="os-city-apartment"]');assert(await links.count()>0);
  await page.screenshot({path:out+'/directory.png'});
  await links.first().click();await page.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});
  assert.equal(await page.locator('.room-back').getAttribute('href'),'/north-city.html');
  await page.locator('.room-back').click();assert.match(page.url(),/north-city/);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/directory-mobile.png'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.goto(base+'/apartments.html');await page.waitForFunction(()=>typeof window.render_game_to_text==='function');
  const student=await page.evaluate(()=>JSON.parse(window.render_game_to_text()));assert.equal(student.totalRooms,103);assert.equal(student.sharedRooms,2);assert.equal(student.additionalRooms,100);assert(!student.apartments.some(r=>r.id==='os-city-apartment'));
  await page.goto(base+'/room.html?id=unknown-city-room');await page.waitForFunction(()=>typeof window.render_game_to_text==='function');const missing=await page.evaluate(()=>JSON.parse(window.render_game_to_text()));assert.equal(missing.error,'unknown-room');
  assert.deepEqual(errors,[]);await writeFile(out+'/results.json',JSON.stringify({categoryOrder:true,directoryToRoomAndBack:true,mobileFit:true,studentCounts:[student.totalRooms,student.sharedRooms,student.additionalRooms],unknownRoom:missing.error,errors},null,2));console.log('PASS: North City directory, route/back, responsive fit, student isolation and unknown room');
}finally{await browser.close();}
