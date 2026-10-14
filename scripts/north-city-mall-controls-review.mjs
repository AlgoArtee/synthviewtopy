import assert from 'node:assert/strict';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const output=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-26/final-1';
await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0,'Use a fresh evidence directory');
const checks=[],errors=[],screenshots=[];
const report={viewport:{width:951,height:892},checks,errors,screenshots,capturedAt:new Date().toISOString()};
const check=(condition,description,evidence)=>{checks.push({passed:!!condition,description,evidence});if(!condition)console.error('FAIL '+description);};
const hashes=async()=>Object.fromEntries(await Promise.all((await readdir('src/apartments')).filter(n=>/^osCity.*\.ts$/.test(n)||['room.ts','roomRendering.ts','liminetteRoom.ts','northCity.css'].includes(n)).map(async n=>{const p='src/apartments/'+n;return[p,createHash('sha256').update(await readFile(p)).digest('hex')];})));
const sources=await hashes();
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
let page;
try{
  const context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1,reducedMotion:'no-preference'});
  page=await context.newPage();
  await page.addInitScript(()=>{window.__qaObjects=[];window.__THREE_DEVTOOLS__={dispatchEvent:event=>{if(event.type==='observe')window.__qaObjects.push(event.detail);}};});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const ready=()=>page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:300000});
  await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment',{waitUntil:'domcontentloaded',timeout:120000});await ready();
  const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
  const show=async()=>{if((await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();};
  const hide=async()=>{if(!(await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();};
  const view=async id=>{await show();if(!(await state()).menuOpen)await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${id}"]`).click();await hide();};
  const choose=async(selector,value)=>{await show();await page.locator(selector).selectOption(value);await page.locator('canvas').first().focus();await hide();};
  const capture=async name=>{await page.screenshot({path:`${output}/${name}.png`});screenshots.push(name+'.png');};
  const sliderIds={shadowsPercent:'city-window-shadows',illuminatedPercent:'city-window-illuminated',tvPercent:'city-window-tv'};
  async function sliders(settings){
    await show();
    for(const [key,value] of Object.entries(settings))await page.locator('#'+sliderIds[key]).evaluate((input,value)=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},value);
    await page.waitForTimeout(150);
    const s=await state();
    for(const [key,value] of Object.entries(settings))check(s.windowAppearance[key]===value,'Slider updates '+key,{expected:value,actual:s.windowAppearance[key]});
    for(const [label,district] of [['balcony',s.balconyExterior],['north',s.northWeather]]){
      const tv=district.tvWindows;check(JSON.stringify(tv.settings)===JSON.stringify(s.windowAppearance),label+' shares live settings');
      if(s.windowAppearance.illuminatedPercent===0)check(tv.illuminatedWindowCount===0&&tv.shadowWindowCount===0&&tv.animatedWindowCount===0,label+' has no lit/TV/shadow rooms at 0% open');
      if(s.windowAppearance.illuminatedPercent===100)check(tv.illuminatedWindowCount===tv.windowCount,label+' has every residential room lit at 100% open');
      if(s.windowAppearance.shadowsPercent===0)check(tv.shadowWindowCount===0,label+' has no moving shadows at 0%');
      if(s.windowAppearance.tvPercent===0)check(tv.animatedWindowCount===0,label+' has no TV rooms at 0%');
      if(s.windowAppearance.illuminatedPercent===100&&s.windowAppearance.tvPercent===100)check(tv.animatedWindowCount===tv.windowCount,label+' has every room TV-lit at 100%');
      if(s.windowAppearance.illuminatedPercent===100&&s.windowAppearance.shadowsPercent===100)check(tv.shadowWindowCount===tv.windowCount,label+' has every room shadowed at 100%');
    }
    await hide();return s;
  }
  const initial=await state();report.initial=initial;
  check(initial.ready,'Loaded actual room is ready');check(initial.balconyExterior.dataMall.mergedCircuitDive,'Eastern Circuit Dive merged into Data Mall');
  check(initial.balconyExterior.dataMall.height===initial.balconyExterior.dataMall.previousMallHeight,'Mall roof height retained for rail view');
  check(initial.balconyExterior.life.hairCount===48,'All 48 moving residents have hair');
  check(initial.balconyExterior.life.circuitPathCount===77,'Moving lights use all52 pavement traces and25 processor loops');
  await choose('#city-weather-select','clear');await choose('#city-time-select','evening');await view('balcony');
  await sliders({shadowsPercent:40,illuminatedPercent:65,tvPercent:40});await capture('mall-evening-default');
  await show();await page.locator('#city-window-appearance-panel').scrollIntoViewIfNeeded();await capture('window-sliders-desktop');
  // Native keyboard interaction exercises the range controls without moving the camera.
  const beforeKeyboard=await state();await page.locator('#city-window-tv').focus();await page.keyboard.press('Home');
  check((await state()).windowAppearance.tvPercent===0,'Home sets native range to0');await page.keyboard.press('End');
  check((await state()).windowAppearance.tvPercent===100,'End sets native range to100');
  check(JSON.stringify((await state()).position)===JSON.stringify(beforeKeyboard.position),'Arrow/Home/End range focus does not move the player');
  await sliders({shadowsPercent:100,illuminatedPercent:0,tvPercent:100});await capture('balcony-windows-all-dark');
  await view('panorama');await capture('north-windows-all-dark');
  await sliders({shadowsPercent:0,illuminatedPercent:100,tvPercent:0});await capture('north-windows-all-lit-steady');
  await view('balcony');await capture('balcony-windows-all-lit-steady');
  await sliders({shadowsPercent:100,illuminatedPercent:100,tvPercent:0});await capture('balcony-shadows-only');
  await sliders({shadowsPercent:0,illuminatedPercent:100,tvPercent:100});await capture('balcony-tv-only');
  await sliders({shadowsPercent:40,illuminatedPercent:65,tvPercent:40});
  for(const [time,weather] of [['morning','cloudy'],['day','rain'],['evening','clear'],['night','clear']]){
    await choose('#city-time-select',time);await choose('#city-weather-select',weather);const s=await state();
    check(s.balconyExterior.tvWindows.settings.illuminatedPercent===65&&s.northWeather.tvWindows.settings.tvPercent===40,time+' weather/time keeps window settings');
    await capture(`mall-${time}-${weather}`);
  }
  const native=await page.evaluate(async()=>{
    const canvas=document.querySelector('canvas'),stream=canvas.captureStream(20),chunks=[];
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm',videoBitsPerSecond:4500000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    const done=new Promise(resolve=>recorder.onstop=resolve);const frames=[],start=performance.now();recorder.start(250);
    for(const target of [0,2,4,6,8]){
      const delay=target*1000-(performance.now()-start);if(delay>0)await new Promise(resolve=>setTimeout(resolve,delay));
      const s=JSON.parse(window.render_game_to_text());frames.push({wall:(performance.now()-start)/1000,clock:s.animation.elapsedSeconds,packets:s.balconyExterior.life.packetPositions,people:s.balconyExterior.life.pedestrianPositions,image:canvas.toDataURL('image/png').split(',')[1]});
    }
    recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:'video/webm'});
    const video=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(blob);});return{frames,video};
  });
  for(let i=0;i<native.frames.length;i++){const name=`mall-night-native-${i*2}s.png`;await writeFile(`${output}/${name}`,Buffer.from(native.frames[i].image,'base64'));screenshots.push(name);delete native.frames[i].image;}
  await writeFile(`${output}/mall-night-native-8s.webm`,Buffer.from(native.video,'base64'));delete native.video;report.native=native;
  for(let i=1;i<native.frames.length;i++)check(JSON.stringify(native.frames[i].packets)!==JSON.stringify(native.frames[i-1].packets),'Circuit lights keep moving in native interval '+i);
  const clockRatio=(native.frames.at(-1).clock-native.frames[0].clock)/(native.frames.at(-1).wall-native.frames[0].wall);
  check(clockRatio>.8&&clockRatio<1.2,'Native circuit clock tracks wall time',clockRatio);
  // Inspect the actual loaded scene's hair/interiors with a declared close camera.
  const details=await page.evaluate(async()=>{
    const THREE=await import('/node_modules/three/build/three.module.js');
    const scene=window.__qaObjects.find(o=>o.isScene&&o.userData.apartment?.northCity);
    const renderer=window.__qaObjects.find(o=>o.isWebGLRenderer);if(!scene||!renderer)throw new Error('Actual Three.js observation hook missing');
    const life=scene.getObjectByName('Circuit Market · walking residents, illuminated transit and flowing circuitry'),district=scene.getObjectByName('Balcony · rain-soaked Circuit Market and layered east skyline');
    const heads=life.getObjectByName('Residents · heads'),hair=life.getObjectByName('Residents · fitted hair caps'),a=new THREE.Matrix4(),b=new THREE.Matrix4();
    let maxHairSeparation=0;for(let i=0;i<heads.count;i++){heads.getMatrixAt(i,a);hair.getMatrixAt(i,b);maxHairSeparation=Math.max(maxHairSeparation,new THREE.Vector3().setFromMatrixPosition(a).distanceTo(new THREE.Vector3().setFromMatrixPosition(b)));}
    scene.updateMatrixWorld(true);const person=life.userData.snapshot().pedestrianPositions[0],camera=new THREE.PerspectiveCamera(52,951/892,.08,450),target=renderer.getRenderTarget();
    renderer.setRenderTarget(null);camera.position.set(person[0]+3.4,person[1]+2.0,person[2]-4.2);camera.lookAt(person[0],person[1]+1.25,person[2]);renderer.render(scene,camera);
    const hairImage=renderer.domElement.toDataURL('image/png').split(',')[1];camera.position.set(51,-10.7,3.25);camera.lookAt(63,-10.7,3.25);renderer.render(scene,camera);
    const interiorImage=renderer.domElement.toDataURL('image/png').split(',')[1];renderer.setRenderTarget(target);
    const balconyCamera=new THREE.PerspectiveCamera(62,951/892,.08,450);balconyCamera.position.set(3.8,1.65,-4.76);balconyCamera.lookAt(34,-8,-5.4);balconyCamera.updateMatrixWorld(true);
    const rail=district.userData.transitGuideway,raycaster=new THREE.Raycaster(),visible=[];
    for(const coords of rail.routePoints){if(coords[0]<78||coords[0]>118||coords[2]<-34||coords[2]>36)continue;const p=new THREE.Vector3(...coords);p.y+=1.1;const projected=p.clone().project(balconyCamera);if(Math.abs(projected.x)>.97||Math.abs(projected.y)>.97||projected.z>1)continue;
      const distance=p.distanceTo(balconyCamera.position);raycaster.set(balconyCamera.position,p.clone().sub(balconyCamera.position).normalize());raycaster.far=distance-.5;
      const occluded=raycaster.intersectObject(scene,true).some(hit=>hit.object.visible&&hit.object.isMesh&&!hit.object.material?.transparent);if(!occluded)visible.push({world:p.toArray(),screen:projected.toArray()});}
    return{hairImage,interiorImage,maxHairSeparation,hairInstances:hair.count,railVisibleSamples:visible,mall:district.userData.dataMall};
  });
  for(const [key,name] of [['hairImage','residents-hair-inspection.png'],['interiorImage','mall-interior-inspection.png']]){await writeFile(`${output}/${name}`,Buffer.from(details[key],'base64'));delete details[key];screenshots.push(name);}
  report.details=details;check(details.hairInstances===48&&details.maxHairSeparation<.025,'Hair remains fitted to animated heads',details.maxHairSeparation);
  check(details.railVisibleSamples.length>3,'Rail/train-height samples remain unobstructed above the mall from production balcony camera',details.railVisibleSamples.length);
  await sliders({shadowsPercent:17,illuminatedPercent:73,tvPercent:29});await page.reload({waitUntil:'domcontentloaded'});await ready();const persisted=await state();
  check(JSON.stringify(persisted.windowAppearance)===JSON.stringify({shadowsPercent:17,illuminatedPercent:73,tvPercent:29}),'All three slider values persist across reload');
  await sliders({shadowsPercent:40,illuminatedPercent:65,tvPercent:40});await choose('#city-time-select','evening');await choose('#city-weather-select','clear');await view('balcony');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);const reducedA=await state();await page.waitForTimeout(750);const reducedB=await state();
  check(JSON.stringify(reducedA.balconyExterior.life.packetPositions)===JSON.stringify(reducedB.balconyExterior.life.packetPositions),'Reduced motion holds circuit light geometry steady');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:390,height:844});await show();await page.locator('#city-window-tv').scrollIntoViewIfNeeded();await capture('window-sliders-mobile');
  check(await page.locator('#city-window-tv').isVisible(),'Sliders remain reachable on mobile');
  report.final=await state();
}catch(error){report.failure=error.stack??String(error);if(page)await page.screenshot({path:`${output}/failure.png`,timeout:10000}).catch(()=>{});}
finally{
  const after=await hashes();report.sourceHashes=sources;report.changedSources=Object.keys(sources).filter(p=>sources[p]!==after[p]);check(!report.changedSources.length,'Captured scene source unchanged');check(!errors.length,'No page/WebGL errors',errors);
  await writeFile(`${output}/results.json`,JSON.stringify(report,null,2));await browser.close();
}
assert.equal(report.failure,undefined,report.failure);assert.ok(checks.every(c=>c.passed),'Review failed checks');console.log(JSON.stringify({pass:true,checks:checks.length,screenshots:screenshots.length,output}));
