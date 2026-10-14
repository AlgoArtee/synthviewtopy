import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const out=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-19/final-1';
await mkdir(out,{recursive:true});
async function hashes(){
  const names=(await readdir('src/apartments')).filter(name=>/^osCity.*\.ts$/.test(name)||['room.ts','roomRendering.ts'].includes(name));
  return Object.fromEntries(await Promise.all(names.sort().map(async name=>{const path='src/apartments/'+name;return[path,createHash('sha256').update(await readFile(path)).digest('hex')];})));
}
const sourceBefore=await hashes(),errors=[],checks=[];
const report={capturedAt:new Date().toISOString(),source:'http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1',errors,checks,screenshots:[]};
const check=(condition,description)=>{checks.push({description,passed:Boolean(condition)});assert.ok(condition,description);};
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
let livePage;
try{
  const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'no-preference'});
  livePage=page;
  page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.goto(report.source,{waitUntil:'domcontentloaded',timeout:120000});
  console.log('Waiting for live room readiness');
  await page.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:300000});
  console.log('Live room ready');
  const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
  async function controls(){if((await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();}
  async function view(id){await controls();if(!(await state()).menuOpen)await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${id}"]`).click();if(!(await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();await page.evaluate(()=>window.advanceTime(100));}
  async function weather(mode){await controls();await page.locator('#city-weather-select').selectOption(mode);if(!(await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();await page.evaluate(()=>window.advanceTime(500));}
  async function shot(name){await page.screenshot({path:`${out}/${name}.png`});report.screenshots.push({file:name+'.png',state:await state()});console.log('CAPTURED '+name);}
  await weather('rain');
  for(const id of ['balcony-ceiling','balcony-door','balcony-corner','balcony-return']){await view(id);await shot(id);}
  await view('balcony');
  report.modes={};
  for(const mode of ['clear','cloudy','rain','storm','snow','fog','academic-autumn','academic-overcast','academic-rainy-dusk','academic-foggy-night']){
    await weather(mode);report.modes[mode]=await state();check(report.modes[mode].weather.mode===mode,'Weather control selects '+mode);await shot('plaza-'+mode);
  }
  for(const [mode,snapshot] of Object.entries(report.modes)){
    const exterior=snapshot.balconyExterior,weather=exterior.weather;
    check(weather.mode===mode&&exterior.life.weather===mode&&exterior.atmosphere.mode===mode,'Balcony weather and plaza share '+mode+' preset');
    check(weather.precipitation==='none'?weather.particleCount===0:weather.nearCount>0&&weather.farCount>0,'Correct near and distant precipitation for '+mode);
    check(weather.observedMinX===null||weather.observedMinX>=5.07999,'Precipitation stays outside balcony roof for '+mode);
    check(weather.autumnLeaves>0===['academic-autumn','academic-rainy-dusk'].includes(mode),'Seasonal leaves match '+mode);
  }
  const rain=report.modes.rain.balconyExterior,storm=report.modes.storm.balconyExterior,snow=report.modes.snow.balconyExterior;
  check(storm.weather.particleCount>rain.weather.particleCount&&storm.weather.fallSpeed>rain.weather.fallSpeed,'Storm rain is denser and faster than normal rain');
  check(snow.weather.fallSpeed<rain.weather.fallSpeed,'Snow falls more slowly than rain');
  check(['fog','academic-foggy-night'].every(mode=>!report.modes[mode].balconyExterior.atmosphere.skylineVisible),'Dense fog obscures the distant skyline');
  check(rain.life.walkerCount===48&&rain.life.trainCount===2&&rain.life.circuitPacketCount===36&&rain.life.localLightCount===3,'Plaza contains added walkers, trains, flowing circuits and local lights');
  await weather('rain');
  report.motionBefore=await state();await shot('plaza-motion-before');
  await page.evaluate(()=>window.advanceTime(7000));report.motionAfter=await state();await shot('plaza-motion-after');
  const moved=(before,after)=>JSON.stringify(before)!==JSON.stringify(after);
  for(const field of ['pedestrianPositions','trainPositions','packetPositions','lightIntensities'])check(moved(report.motionBefore.balconyExterior.life[field],report.motionAfter.balconyExterior.life[field]),'Live plaza animates '+field);
  for(const field of ['nearSample','farSample'])check(moved(report.motionBefore.balconyExterior.weather[field],report.motionAfter.balconyExterior.weather[field]),'Live rain animates '+field);
  // Record the actual renderer after loading so the clip contains only the plaza.
  const clip=await page.evaluate(async()=>{
    const canvas=document.querySelector('#room-canvas')??document.querySelector('canvas');
    const stream=canvas.captureStream(20),chunks=[];
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:2200000});
    const stopped=new Promise(resolve=>recorder.onstop=resolve);recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};recorder.start();
    await new Promise(resolve=>setTimeout(resolve,9000));recorder.stop();await stopped;stream.getTracks().forEach(track=>track.stop());
    return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));});
  });
  await writeFile(out+'/plaza-motion.webm',Buffer.from(clip,'base64'));report.motionVideo='plaza-motion.webm';
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.advanceTime(100));
  report.reducedBefore=await state();await page.evaluate(()=>window.advanceTime(5000));report.reducedAfter=await state();
  await weather('storm');report.reducedStormBefore=await state();await page.evaluate(()=>window.advanceTime(6000));report.reducedStormAfter=await state();
  check(!moved(report.reducedBefore.balconyExterior.life,report.reducedAfter.balconyExterior.life),'Reduced motion freezes pedestrians, trains, circuits and light pulsing');
  for(const field of ['nearSample','farSample','motionUpdates'])check(!moved(report.reducedBefore.balconyExterior.weather[field],report.reducedAfter.balconyExterior.weather[field]),'Reduced motion freezes rain '+field);
  check(report.reducedStormBefore.balconyExterior.weather.lightning===0&&report.reducedStormAfter.balconyExterior.weather.lightning===0,'Reduced motion suppresses storm lightning');
  await weather('rain');await page.setViewportSize({width:390,height:844});await shot('plaza-mobile');
  report.mobileFit=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));check(report.mobileFit.width===report.mobileFit.scrollWidth,'Mobile has no horizontal overflow');
  await page.close();
  const geometryPage=await browser.newPage();await geometryPage.goto('http://127.0.0.1:5178/north-city.html',{waitUntil:'domcontentloaded'});
  report.geometry=await geometryPage.evaluate(async()=>{
    const THREE=await import('/node_modules/three/build/three.module.js'),{createOsCityApartment}=await import('/src/apartments/osCityApartment.ts');
    const room=createOsCityApartment();await room.ready;room.scene.updateMatrixWorld(true);
    const roof=room.scene.getObjectByName('Balcony ceiling · continuous structural floor slab'),ray=new THREE.Raycaster(),up=new THREE.Vector3(0,1,0);
    const samples=[[-.5,-8],[3.9,-8],[3,-5],[.2,-3.5],[2.85,-1.5]].map(([x,z])=>{ray.set(new THREE.Vector3(x,1.65,z),up);return {x,z,hits:ray.intersectObject(roof).map(hit=>hit.point.y)};});
    const outside=[[.2,-1.5],[5.1,-5]].map(([x,z])=>{ray.set(new THREE.Vector3(x,1.65,z),up);return {x,z,hits:ray.intersectObject(roof).length};});
    const bounds=new THREE.Box3().setFromObject(roof),bad=[];let triangles=0;
    const district=room.scene.getObjectByName('Balcony · rain-soaked Circuit Market and layered east skyline');
    district.traverse(object=>{if(!object.geometry)return;for(const attribute of Object.values(object.geometry.attributes))if(Array.from(attribute.array).some(value=>!Number.isFinite(value)))bad.push(object.name);if(object.isMesh)triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3*(object.count??1);});
    const p=new THREE.Vector3(2.85,1.65,1),d=new THREE.Vector3(0,0,-1);room.navigation.reset(p);for(let frame=0;frame<180;frame++)room.navigation.step(p,d,1/60,false);const walked=p.toArray();
    const result={roof:{min:bounds.min.toArray(),max:bounds.max.toArray(),samples,outside},nonfinite:bad,districtSubmittedTriangles:Math.round(triangles),walked};room.dispose();return result;
  });
  check(report.geometry.roof.samples.every(sample=>sample.hits.some(y=>Math.abs(y-3.5)<.001)),'Upper-floor slab covers the full walkable L footprint at 3.5 metres');
  check(report.geometry.roof.outside.every(sample=>sample.hits===0),'Balcony roof does not fill the bathroom cutout or extend beyond its open edge');
  check(report.geometry.walked[2]<-5,'New ceiling preserves doorway and balcony walking route');
  check(report.geometry.nonfinite.length===0,'Animated plaza geometry stays finite');
  check(report.geometry.districtSubmittedTriangles<300000,'District stays within 300k submitted triangles');
  check(errors.length===0,'No browser errors');
  const sourceAfter=await hashes();report.changedSources=Object.keys(sourceBefore).filter(path=>sourceBefore[path]!==sourceAfter[path]);check(report.changedSources.length===0,'Sources stay stable during capture');
}catch(error){
  report.failure=error.stack??String(error);
  if(livePage&&!livePage.isClosed()){
    report.failureState=await livePage.evaluate(()=>typeof window.render_game_to_text==='function'?JSON.parse(window.render_game_to_text()):{text:document.body.innerText}).catch(error=>({error:String(error)}));
    await livePage.screenshot({path:out+'/failure-state.png',timeout:10000}).catch(()=>{});
  }
}finally{
  await writeFile(out+'/source-hashes.json',JSON.stringify(sourceBefore,null,2));await writeFile(out+'/effects-results.json',JSON.stringify(report,null,2));await browser.close();
}
assert.equal(report.failure,undefined,report.failure);console.log(JSON.stringify({result:'PASS',checks:checks.length,screenshots:report.screenshots.length,out}));
