import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out=process.env.CITY_AUDIO_OUT??'test-artifacts/north-city/audio-window';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
await context.addInitScript(()=>{
 const Original=window.AudioContext;window.__audioContexts=[];
 window.AudioContext=class extends Original{constructor(...args){super(...args);window.__audioContexts.push(this);}};
 const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){if(this.buffer)window.__cityAudioBuffer=this.buffer;return start.apply(this,args);};
});
const page=await context.newPage(),errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/audio/'))requests.push(r.url());});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const volume=value=>page.locator('#city-sound-volume').evaluate((input,v)=>{input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}));},String(value));
async function settle(){await page.evaluate(()=>window.advanceTime(4000));await page.waitForTimeout(1600);}
async function selectMode(value){await page.locator('#city-window-select').focus();const values=['closed','open','tilt'],current=await page.locator('#city-window-select').inputValue();const difference=values.indexOf(value)-values.indexOf(current);for(let n=0;n<Math.abs(difference);n++)await page.keyboard.press(difference>0?'ArrowDown':'ArrowUp');await page.keyboard.press('Enter');assert.equal(await page.locator('#city-window-select').inputValue(),value);await settle();}
try{
 await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment&revision=city-window-audio',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});
 const initial=await state();assert.equal(initial.cityAudio.contextState,'not-created');assert.equal(initial.cityAudio.rms,0);assert.equal(requests.length,0,'No asset/network/audio work until window opening');
 await selectMode('open');await page.waitForFunction(()=>{const a=JSON.parse(window.render_game_to_text()).cityAudio;return a.ready&&a.contextState==='running'&&a.rms>1e-5;},null,{timeout:45000});
 const open=await state();assert.equal(open.cityAudio.state,'playing');assert.ok(open.cityAudio.targetGain>.05);assert.ok(open.cityAudio.duration>20);assert.ok(open.cityAudio.normalizationGain>0);assert.equal(requests.length,1);
 await page.locator('canvas').first().focus();await page.screenshot({path:out+'/desktop-sound-controls.png'});
 const loop=await page.evaluate(()=>{const b=window.__cityAudioBuffer;let peak=0,maxSeamStep=0;for(let c=0;c<b.numberOfChannels;c++){const data=b.getChannelData(c);maxSeamStep=Math.max(maxSeamStep,Math.abs(data[0]-data[data.length-1]));for(let i=0;i<data.length;i++)peak=Math.max(peak,Math.abs(data[i]));}return{duration:b.duration,channels:b.numberOfChannels,sampleRate:b.sampleRate,peak,maxSeamStep};});assert.ok(loop.peak<.9,'Loop crossfade retains headroom');assert.ok(loop.maxSeamStep<.025,'Loop boundary is continuous');
 await selectMode('tilt');const tilt=await state();assert.equal(tilt.cityAudio.state,'playing');assert.ok(tilt.cityAudio.rms>1e-5);assert.ok(Math.abs(tilt.cityAudio.targetGain/open.cityAudio.targetGain-.34)<.01);assert.ok(tilt.cityAudio.lowpassHz<open.cityAudio.lowpassHz/2);
 await page.locator('#city-sound-toggle').click();await page.waitForTimeout(1600);const muted=await state();assert.equal(muted.cityAudio.muted,true);assert.equal(muted.cityAudio.rms,0);assert.equal(muted.cityAudio.contextState,'suspended');
 await page.locator('#city-sound-toggle').click();await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).cityAudio.rms>1e-5);assert.equal((await state()).cityAudio.muted,false);
 await volume(27);await page.waitForTimeout(350);assert.equal((await state()).cityAudio.volume,.27);assert.equal(await page.locator('.city-sound-volume-row output').textContent(),'27%');
 await page.locator('canvas').first().focus();await page.keyboard.press('h');assert.equal(await page.locator('#city-sound-toggle').isVisible(),false);assert.ok((await state()).cityAudio.rms>1e-5,'Hiding controls preserves audible window state');await page.keyboard.press('h');
 await selectMode('closed');const closed=await state();assert.equal(closed.cityAudio.targetGain,0);assert.equal(closed.cityAudio.rms,0);assert.equal(closed.cityAudio.contextState,'suspended');
 await page.locator('#city-sound-toggle').click();assert.equal((await state()).cityAudio.muted,true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});const restored=await state();assert.equal(restored.cityAudio.volume,.27);assert.equal(restored.cityAudio.muted,true);assert.equal(restored.cityAudio.contextState,'not-created');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/phone-sound-controls.png'});const fit=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.equal(fit.width,fit.scroll);
 await page.locator('#city-sound-toggle').click();await selectMode('open');await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).cityAudio.ready,null,{timeout:45000});
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(150);assert.equal((await state()).cityAudio.contextState,'suspended');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).cityAudio.contextState==='running');
 await selectMode('closed');await volume(55);
 await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));await page.waitForFunction(()=>window.__audioContexts.every(c=>c.state==='closed'));assert.deepEqual(errors,[]);
 const meta=JSON.parse(await readFile('public/audio/north-city/source.json','utf8')),file=await readFile('public/audio/north-city/cyberpunk-city-ambience.mp3');assert.equal(createHash('sha256').update(file).digest('hex'),meta.sha256);
 await writeFile(out+'/results.json',JSON.stringify({initial:initial.cityAudio,open:open.cityAudio,tilt:tilt.cityAudio,muted:muted.cityAudio,closed:closed.cityAudio,restored:restored.cityAudio,loop,fit,requests,errors,visibilityPauseResume:true,disposeClosesContexts:true,autoplayBypass:false,source:meta},null,2));console.log(JSON.stringify({open:open.cityAudio,tilt:tilt.cityAudio,closed:closed.cityAudio,loop,errors}));
}finally{await browser.close();}
