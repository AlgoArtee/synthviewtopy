import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({reducedMotion:'reduce',viewport:{width:1920,height:1080}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
let attempts=0;
await page.route('**/audio/north-city/library/*.mp3',async route=>{attempts++;if(attempts===1)await route.fulfill({status:503,body:'Temporary failure'});else await route.continue();});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()).cityAudio);
try{
 await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment&revision=city-audio-retry',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});
 await page.locator('#city-window-select').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.locator('canvas').first().focus();
 await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).cityAudio.state==='error');
 const failed=await state();assert.equal(await page.locator('#city-sound-toggle').textContent(),'Retry city sound');assert.equal(attempts,1);
 await page.locator('#city-sound-toggle').click();
 await page.waitForFunction(()=>{const a=JSON.parse(window.render_game_to_text()).cityAudio;return a.state==='playing'&&a.rms>1e-5;},null,{timeout:45000});
 await page.locator('canvas').first().focus();await page.screenshot({path:'test-artifacts/north-city/weather-audio/validation/desktop-sound-controls.png'});
 const recovered=await state();assert.equal(attempts,2);assert.equal(recovered.error,null);assert.equal(recovered.opening,1);assert.deepEqual(errors,[]);
 await writeFile('test-artifacts/north-city/weather-audio/validation/retry-results.json',JSON.stringify({failed,recovered,attempts,reducedMotion:true,errors},null,2));
 await page.close();
 const phoneContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});await phoneContext.addInitScript(()=>Object.defineProperty(window,'indexedDB',{get(){throw new DOMException('Disabled for fallback test','SecurityError');}}));
 const phone=await phoneContext.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment&revision=touch-weather-sounds',{waitUntil:'domcontentloaded',timeout:120000});await phone.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});await phone.locator('#city-weather-select').selectOption('academic-autumn');await phone.locator('.city-sound-uploads summary').click();
 const n=22050*3,data=Buffer.alloc(44+n*2);data.write('RIFF');data.writeUInt32LE(36+n*2,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(22050,24);data.writeUInt32LE(44100,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(n*2,40);for(let i=0;i<n;i++)data.writeInt16LE(Math.round(Math.sin(i/22050*6.283*220)*1500),44+i*2);
 await phone.locator('#city-sound-upload').setInputFiles({name:'My autumn city ambience.wav',mimeType:'audio/wav',buffer:data});await phone.waitForFunction(()=>JSON.parse(window.render_game_to_text()).cityAudio.custom);const fallback=await phone.evaluate(()=>JSON.parse(window.render_game_to_text()).cityAudio);assert.match(fallback.uploadNotice,/this session/);
 const fits=[];for(const [width,height] of [[390,844],[375,667],[844,390]]){await phone.setViewportSize({width,height});await phone.screenshot({path:'test-artifacts/north-city/weather-audio/validation/touch-'+width+'x'+height+'.png'});const fit=await phone.evaluate(()=>{const panel=document.querySelector('#city-window-panel').getBoundingClientRect(),walk=document.querySelector('.touch-walk').getBoundingClientRect();return{width:innerWidth,scroll:document.documentElement.scrollWidth,panel:{top:panel.top,bottom:panel.bottom,left:panel.left,right:panel.right},walk:{top:walk.top,bottom:walk.bottom,left:walk.left,right:walk.right},height:innerHeight};});assert.equal(fit.width,fit.scroll);assert.ok(fit.panel.bottom<fit.height);assert.ok(fit.panel.bottom<=fit.walk.top||fit.panel.left>=fit.walk.right);fits.push(fit);}
 await phone.setViewportSize({width:390,height:844});await phone.locator('#city-window-select').selectOption('open');await phone.locator('#city-sound-toggle').click();await phone.locator('#city-sound-toggle').click();await phone.waitForFunction(()=>JSON.parse(window.render_game_to_text()).cityAudio.state==='playing',null,{timeout:30000});assert.deepEqual(errors,[]);await writeFile('test-artifacts/north-city/weather-audio/validation/touch-results.json',JSON.stringify({fits,fallback,errors,customAudioWithoutStoragePlays:true},null,2));await phoneContext.close();
 console.log(JSON.stringify({failed:failed.state,recovered:recovered.state,attempts,reducedMotion:true,errors}));
}finally{await browser.close();}
