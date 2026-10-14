import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out='test-artifacts/north-city/weather-audio/validation';await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile('public/audio/north-city/weather-library.json','utf8'));
const weatherIds=['clear','cloudy','rain','storm','snow','fog','academic-autumn','academic-overcast','academic-rainy-dusk','academic-foggy-night'];
const assets=[];for(const track of manifest.tracks){const file=await readFile('public'+track.url);assert.equal(file.length,track.bytes);assert.equal(createHash('sha256').update(file).digest('hex'),track.sha256);assets.push({id:track.id,bytes:file.length,duration:track.duration});}assert.equal(new Set(manifest.tracks.map(t=>t.sha256)).size,manifest.tracks.length);
for(const id of weatherIds){assert.ok(manifest.choices[id].length>=10);assert.equal(new Set(manifest.choices[id].map(t=>t.trackId)).size,manifest.choices[id].length);}
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1920,height:1080}});await context.addInitScript(()=>{const Original=window.AudioContext;window.__audioContexts=[];window.AudioContext=class extends Original{constructor(...a){super(...a);window.__audioContexts.push(this);}};});
const page=await context.newPage(),errors=[],audioRequests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/audio/'))audioRequests.push(r.url());});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
async function ready(){await page.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});}
async function select(selector,value){await page.locator(selector).selectOption(value);await page.locator(selector).focus();await page.keyboard.press('Enter');await page.locator('canvas').first().focus();}
async function audible(){await page.waitForFunction(()=>{const a=JSON.parse(window.render_game_to_text()).cityAudio;return a.state==='playing'&&a.rms>1e-6;},null,{timeout:45000});}
async function snapshot(name,clean=false){if(clean){await page.locator('canvas').first().focus();await page.keyboard.press('h');}await page.screenshot({path:out+'/'+name+'.png'});if(clean)await page.keyboard.press('h');}
async function view(id){if(!(await state()).menuOpen)await page.locator('#room-menu-toggle').click();if(id==='entrance')await page.locator('#room-reset').click();else await page.locator('[data-viewpoint=\"'+id+'\"]').click();}
function wav(){const sr=22050,n=sr*4,b=Buffer.alloc(44+n*2);b.write('RIFF');b.writeUInt32LE(36+n*2,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);for(let i=0;i<n;i++)b.writeInt16LE(Math.round(Math.sin(i/sr*2*Math.PI*220)*1800),44+i*2);return b;}
try{
 await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment&revision=weather-sound-library',{waitUntil:'domcontentloaded',timeout:120000});await ready();
 assert.equal((await state()).cityAudio.contextState,'not-created');assert.equal(audioRequests.length,0);assert.deepEqual(await page.locator('#city-weather-select option').evaluateAll(o=>o.map(x=>x.value)),weatherIds);
 await select('#city-window-select','open');await page.evaluate(()=>window.advanceTime(4000));await audible();
 const samples=[];
 for(const weather of weatherIds){
  await select('#city-weather-select',weather);await audible();const options=await page.locator('#city-sound-select option').evaluateAll(o=>o.map(x=>({id:x.value,label:x.textContent})));assert.ok(options.length>=10);assert.equal(new Set(options.map(t=>t.id)).size,options.length);assert.deepEqual(options.map(t=>t.id),manifest.choices[weather].map(t=>t.trackId));
  let s=await state();assert.equal(s.cityAudio.weather,weather);assert.equal(s.weather.mode,weather);assert.ok(s.cityAudio.ready);samples.push({weather,weatherState:s.weather,audio:s.cityAudio,options});
  await page.evaluate(()=>window.advanceTime(1500));await snapshot('weather-'+weather+'-entrance',true);
  await view('outlook');await snapshot('weather-'+weather+'-outlook',true);
  await select('#city-sound-select',options[1].id);await audible();assert.equal((await state()).cityAudio.selectedId,options[1].id);
  await view('entrance');
 }
 // Each weather keeps its own last choice, including shared compatible recordings.
 for(const sample of samples){await select('#city-weather-select',sample.weather);assert.equal((await state()).cityAudio.selectedId,sample.options[1].id);}
 // Rapid selection must install only the last requested recording.
 await select('#city-weather-select','clear');for(const id of samples[0].options.slice(2,6).map(t=>t.id))await select('#city-sound-select',id);await audible();assert.equal((await state()).cityAudio.selectedId,samples[0].options[5].id);
 await select('#city-window-select','tilt');await page.evaluate(()=>window.advanceTime(4000));await page.waitForTimeout(1000);const tilted=(await state()).cityAudio;assert.equal(tilted.opening,.34);assert.ok(tilted.lowpassHz<=2100.1);
 await page.locator('#city-sound-toggle').click();await page.waitForTimeout(1600);assert.equal((await state()).cityAudio.rms,0);assert.equal((await state()).cityAudio.contextState,'suspended');await page.locator('#city-sound-toggle').click();await audible();
 // Upload is local, playable, weather-scoped and restored after reload.
 await page.locator('.city-sound-uploads summary').click();const requestsBeforeUpload=audioRequests.length;
 await page.locator('#city-sound-upload').setInputFiles({name:'My local city loop.wav',mimeType:'audio/wav',buffer:wav()});
 await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).cityAudio.custom);await audible();const uploaded=(await state()).cityAudio;assert.match(uploaded.uploadNotice,/Saved on this device/);assert.equal(uploaded.uploadCount,1);assert.equal(audioRequests.length,requestsBeforeUpload,'Upload never makes an audio network request');
 await page.locator('#city-sound-volume').evaluate(input=>{input.value='31';input.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.setViewportSize({width:390,height:844});await snapshot('phone-upload-controls');let fit=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,panels:[...document.querySelectorAll('.city-window-panel,.city-weather-panel')].map(p=>({top:p.getBoundingClientRect().top,bottom:p.getBoundingClientRect().bottom,right:p.getBoundingClientRect().right}))}));assert.equal(fit.width,fit.scroll);assert.ok(fit.panels.every(p=>p.right<=fit.width&&p.bottom<=844));
 await page.locator('canvas').first().focus();await page.keyboard.press('h');assert.equal(await page.locator('#city-window-panel').isVisible(),false);assert.ok((await state()).cityAudio.rms>0);await page.keyboard.press('h');
 await page.reload({waitUntil:'domcontentloaded'});await ready();await select('#city-weather-select','clear');await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).cityAudio.custom);assert.equal((await state()).cityAudio.selectedId,uploaded.selectedId);assert.equal((await state()).cityAudio.volume,.31);
 await select('#city-window-select','open');await page.evaluate(()=>window.advanceTime(4000));await audible();
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(150);assert.equal((await state()).cityAudio.contextState,'suspended');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});await audible();
 await page.locator('.city-sound-uploads summary').click();await page.locator('#city-sound-remove').click();await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).cityAudio.uploadCount===0);await audible();assert.equal((await state()).cityAudio.custom,false);
 await page.locator('#city-sound-upload').setInputFiles({name:'broken.wav',mimeType:'audio/wav',buffer:Buffer.from('not a wav')});await page.waitForFunction(()=>/could not be read|different file/.test(JSON.parse(window.render_game_to_text()).cityAudio.uploadNotice));assert.equal((await state()).cityAudio.uploadCount,0);
 await select('#city-window-select','closed');await page.evaluate(()=>window.advanceTime(4000));await page.waitForTimeout(1600);assert.equal((await state()).cityAudio.rms,0);assert.equal((await state()).cityAudio.contextState,'suspended');
 await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));await page.waitForFunction(()=>window.__audioContexts.every(c=>c.state==='closed'));assert.deepEqual(errors,[]);
 await writeFile(out+'/results.json',JSON.stringify({distinctRecordings:manifest.tracks.length,weatherCount:weatherIds.length,choices:Object.fromEntries(weatherIds.map(w=>[w,manifest.choices[w].length])),samples,tilted,uploaded,fit,assets,rapidSelection:true,uploadPersistence:true,uploadRemoval:true,invalidUploadRejected:true,visibilityPauseResume:true,disposeClosesContexts:true,autoplayBypass:false,errors},null,2));console.log(JSON.stringify({distinctRecordings:manifest.tracks.length,weatherCount:weatherIds.length,errors}));
}finally{await browser.close();}
