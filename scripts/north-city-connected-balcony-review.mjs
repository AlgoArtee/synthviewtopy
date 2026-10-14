import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const out=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-20/final-2';
await mkdir(out,{recursive:true});
async function hashes(){
  const names=(await readdir('src/apartments')).filter(name=>/^osCity.*\.ts$/.test(name)||['room.ts','roomRendering.ts','roomArchitecture.ts','liminetteRoom.ts','apartments.css','northCity.css'].includes(name));
  return Object.fromEntries(await Promise.all(names.sort().map(async name=>{const path='src/apartments/'+name;return[path,createHash('sha256').update(await readFile(path)).digest('hex')];})));
}
const sourceBefore=await hashes(),errors=[],checks=[];
const report={capturedAt:new Date().toISOString(),source:'http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1',errors,checks,screenshots:[]};
const check=(condition,description)=>{checks.push({description,passed:Boolean(condition)});assert.ok(condition,description);};
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
let page;
try{
  const context=await browser.newContext({viewport:{width:1600,height:1000},reducedMotion:'no-preference'});
  await context.addInitScript(()=>{const Original=window.AudioContext;window.__audioContexts=[];window.AudioContext=class extends Original{constructor(...args){super(...args);window.__audioContexts.push(this);}};});
  page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.goto(report.source,{waitUntil:'domcontentloaded',timeout:120000});
  console.log('Waiting for live room readiness');
  await page.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:300000});
  console.log('Live room ready');
  const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
  async function controls(){if((await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();}
  async function hide(){if(!(await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();}
  async function view(id){await controls();if(!(await state()).menuOpen)await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${id}"]`).click();await hide();await page.evaluate(()=>window.advanceTime(100));}
  async function choose(selector,value){await controls();await page.locator(selector).selectOption(value);await page.locator(selector).focus();await page.keyboard.press('Enter');await page.locator('canvas').first().focus();await page.evaluate(()=>window.advanceTime(3000));}
  async function weather(mode){await choose('#city-weather-select',mode);await hide();}
  async function door(mode){await choose('#city-balcony-door-select',mode);await hide();}
  async function shot(name){await page.screenshot({path:`${out}/${name}.png`});report.screenshots.push({file:name+'.png',state:await state()});console.log('CAPTURED '+name);}
  async function audible(){await page.waitForFunction(()=>{const a=JSON.parse(window.render_game_to_text()).cityAudio;return a.ready&&a.contextState==='running'&&a.rms>1e-6;},null,{timeout:45000});}
  const near=(a,b,tolerance=.002)=>Math.abs(a-b)<tolerance;
  await view('balcony-door');await choose('#city-window-select','closed');await door('closed');await page.waitForTimeout(1600);
  report.closed=await state();check(report.closed.balconyDoor.mode==='closed'&&report.closed.balconyDoor.openFraction<.001,'Balcony door reaches closed state');
  check(report.closed.cityAudio.targetGain===0&&report.closed.cityAudio.rms===0,'Both closed apertures silence indoor sound');await shot('door-closed');
  await door('half');await audible();report.half=await state();
  check(near(report.half.balconyDoor.openFraction,.5),'Balcony door reaches half-open position');
  check(report.half.cityAudio.doorOpening>0&&report.half.cityAudio.windowOpening===0,'Half-open door admits sound independently of window');await shot('door-half');
  await door('open');await audible();report.open=await state();
  check(near(report.open.balconyDoor.openFraction,1),'Balcony door reaches fully open position');
  check(report.open.cityAudio.targetGain>report.half.cityAudio.targetGain,'Full door opening admits more sound than half opening');
  check(report.open.cityAudio.lowpassHz>report.half.cityAudio.lowpassHz,'Half door filters sound more than fully open door');await shot('door-open');
  await door('closed');await choose('#city-window-select','open');await audible();report.windowOnly=await state();
  check(report.windowOnly.cityAudio.windowOpening>.999&&report.windowOnly.cityAudio.doorOpening<.001&&report.windowOnly.cityAudio.targetGain>0,'Window still admits sound with balcony door closed');
  await choose('#city-window-select','tilt');await audible();report.tiltOnly=await state();
  check(near(report.tiltOnly.cityAudio.windowOpening,.34)&&report.tiltOnly.cityAudio.targetGain<report.windowOnly.cityAudio.targetGain,'Window tilt retains quieter filtered audio');
  await choose('#city-window-select','closed');await door('open');await view('balcony');await audible();
  report.outside=await state();check(report.outside.cityAudio.listenerOutside===true,'Balcony listener hears exterior directly');
  await door('closed');await audible();report.outsideClosed=await state();
  check(report.outsideClosed.cityAudio.listenerOutside===true&&report.outsideClosed.cityAudio.targetGain>0,'Closing door behind listener does not mute outdoor ambience');
  await controls();await page.locator('#city-sound-toggle').click();await page.waitForTimeout(1600);
  check((await state()).cityAudio.rms===0&&(await state()).cityAudio.muted,'Mute still silences balcony sound');
  await page.locator('#city-sound-toggle').click();await audible();
  await page.locator('#city-sound-volume').evaluate(input=>{input.value='27';input.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForTimeout(200);
  check((await state()).cityAudio.volume===.27,'Volume remains functional with balcony admission');
  report.savedAudio=await page.evaluate(()=>JSON.parse(localStorage.getItem('north-city-ambience')));check(report.savedAudio.volume===.27,'Sound preferences persist');
  await hide();check(!(await page.locator('#city-balcony-door-select').isVisible()),'Controls collapse hides door selector');
  await controls();await page.locator('#city-sound-toggle').click();await door('open');
  report.modes={};
  for(const mode of ['clear','cloudy','rain','storm','snow','fog','academic-autumn','academic-overcast','academic-rainy-dusk','academic-foggy-night']){
    await weather(mode);await view('balcony');report.modes[mode]=await state();
    const snapshot=report.modes[mode];check(snapshot.weather.mode===mode&&snapshot.balconyExterior.weather.mode===mode&&snapshot.cityAudio.weather===mode,'Weather mode shared by room, balcony and sound: '+mode);
    check(snapshot.northWeather?.mode===mode&&snapshot.northWeather.sharedWeather&&snapshot.balconyExterior.weather.sharedWeather,'Both exterior views use shared weather simulation: '+mode);
    for(const field of ['precipitation','fallSpeed','wind','dropLength','amount','rainOpacity','snowSize','lightning','atmosphere'])check(JSON.stringify(snapshot.northWeather[field])===JSON.stringify(snapshot.balconyExterior.weather[field]),'North and balcony match '+field+': '+mode);
    check(snapshot.weather.fogDensity===snapshot.northWeather.atmosphere.fogDensity,'Global room fog matches exterior atmosphere: '+mode);
    check(snapshot.balconyExterior.snowAccumulation.visible===(mode==='snow')&&snapshot.balconyExterior.snowAccumulation.capCount>30,'Exposed plaza roofs accumulate snow only in snow mode: '+mode);
    check(snapshot.balconyExterior.weather.observedMinX===null||snapshot.balconyExterior.weather.observedMinX>=5.07999,'Precipitation remains outside balcony shelter: '+mode);
    await shot('balcony-'+mode);
    if(['rain','storm','snow','fog','clear','academic-foggy-night'].includes(mode)){await view('panorama');await shot('window-'+mode);}
  }
  await weather('clear');await view('balcony-transit');await shot('transit-clear');
  await page.mouse.move(800,500);await page.mouse.wheel(0,-1000);await page.evaluate(()=>window.advanceTime(100));await shot('transit-clear-zoom');
  await weather('rain');
  for(const id of ['balcony-left','balcony-right','balcony-transit','balcony-ceiling']){if((await state()).viewpoints.some(v=>v.id===id)){await view(id);await shot(id);}}
  await view('balcony-transit');report.motionBefore=await state();await shot('transit-before');
  await page.evaluate(()=>window.advanceTime(12000));report.motionAfter=await state();await shot('transit-after');
  check(JSON.stringify(report.motionBefore.balconyExterior.life.trainPositions)!==JSON.stringify(report.motionAfter.balconyExterior.life.trainPositions),'Trains move on continuous transit route');
  const transit=report.motionAfter.balconyExterior.life.transit;
  check(transit.routeClosed&&transit.routeSeamGap<.00001&&transit.routeLength>400,'Live trains share a closed connected near/far route with no endpoint gap');
  const clip=await page.evaluate(async()=>{
    const stream=document.querySelector('canvas').captureStream(20),chunks=[];
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:2500000});
    const stopped=new Promise(resolve=>recorder.onstop=resolve);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.start();
    await new Promise(resolve=>setTimeout(resolve,10000));recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());
    return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));});
  });await writeFile(out+'/transit-motion.webm',Buffer.from(clip,'base64'));
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.advanceTime(100));report.reducedBefore=await state();await page.evaluate(()=>window.advanceTime(10000));report.reducedAfter=await state();
  check(JSON.stringify(report.reducedBefore.balconyExterior.life)===JSON.stringify(report.reducedAfter.balconyExterior.life),'Reduced motion freezes transit and plaza life');
  await view('balcony-door');await door('closed');check((await state()).balconyDoor.openFraction<.001,'Door control remains usable with reduced motion');await door('half');check(near((await state()).balconyDoor.openFraction,.5),'Half-open door remains usable with reduced motion');await door('open');
  await page.setViewportSize({width:390,height:844});await controls();await shot('mobile-controls');
  report.mobileFit=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,door:document.querySelector('#city-balcony-door-select').getBoundingClientRect().toJSON()}));
  check(report.mobileFit.width===report.mobileFit.scrollWidth,'Mobile controls do not overflow horizontally');
  check(report.mobileFit.door.right<=390&&report.mobileFit.door.top>=0&&report.mobileFit.door.bottom<=844,'Door control is visible on phone');await hide();await view('balcony');await shot('mobile-balcony');
  check(errors.length===0,'No browser errors');
  const sourceAfter=await hashes();report.changedSources=Object.keys(sourceBefore).filter(path=>sourceBefore[path]!==sourceAfter[path]);check(report.changedSources.length===0,'Sources stay stable during final capture');
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));await page.waitForFunction(()=>window.__audioContexts.every(c=>c.state==='closed'));
  check(true,'Audio contexts close on disposal');
}catch(error){
  report.failure=error.stack??String(error);
  if(page&&!page.isClosed()){report.failureState=await page.evaluate(()=>typeof window.render_game_to_text==='function'?JSON.parse(window.render_game_to_text()):{text:document.body.innerText}).catch(e=>({error:String(e)}));await page.screenshot({path:out+'/failure-state.png',timeout:10000}).catch(()=>{});}
}finally{await writeFile(out+'/source-hashes.json',JSON.stringify(sourceBefore,null,2));await writeFile(out+'/results.json',JSON.stringify(report,null,2));await browser.close();}
assert.equal(report.failure,undefined,report.failure);console.log(JSON.stringify({result:'PASS',checks:checks.length,screenshots:report.screenshots.length,out}));
