import assert from 'node:assert/strict';
import {mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const output=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-27/final-1';
await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0,'Preserve previous evidence');
const checks=[],errors=[],screenshots=[],report={viewport:{width:951,height:892},checks,errors,screenshots,speedRuns:[],manualTimeAdvancement:false};
const check=(condition,description,evidence)=>{checks.push({passed:!!condition,description,evidence});if(!condition)console.error('FAIL '+description);};
const hashes=async()=>Object.fromEntries(await Promise.all((await readdir('src/apartments')).filter(n=>/^osCity.*\.ts$/.test(n)||['room.ts','roomRendering.ts','liminetteRoom.ts','northCity.css'].includes(n)).map(async n=>{const p='src/apartments/'+n;return[p,createHash('sha256').update(await readFile(p)).digest('hex')];})));
const sourceHashes=await hashes();const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
let page;
try{
  page=await browser.newPage({viewport:report.viewport,deviceScaleFactor:1,reducedMotion:'no-preference'});
  await page.addInitScript(()=>{window.__qaObjects=[];window.__THREE_DEVTOOLS__={dispatchEvent:e=>{if(e.type==='observe')window.__qaObjects.push(e.detail);}};});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const ready=()=>page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:300000});
  await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment',{waitUntil:'domcontentloaded',timeout:120000});await ready();console.log('Ready: skyline/speed review');
  const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
  const show=async()=>{if((await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();};
  const hide=async()=>{if(!(await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();};
  const choose=async(selector,value)=>{await show();await page.locator(selector).selectOption(value);await page.locator('canvas').first().focus();await hide();};
  const view=async id=>{await show();if(!(await state()).menuOpen)await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${id}"]`).click();await hide();};
  const capture=async name=>{await page.screenshot({path:`${output}/${name}.png`});screenshots.push(name+'.png');};
  const initial=await state();report.initial=initial;check(initial.ready,'Actual room ready');
  for(const [label,details] of [['balcony',initial.balconyExterior.skylineDetails],['north',initial.northWeather.skylineDetails]]){
    check(Object.values(details.forms).every(n=>n>0),label+' includes all five dimensional crown forms',details.forms);
    check(details.boardCount>=6&&details.facadeCircuitCount>=6,label+' includes graphic displays and facade circuit lighting',details);
  }
  await choose('#city-time-select','evening');await choose('#city-weather-select','clear');await view('balcony');await capture('skyline-balcony-evening');
  await show();await page.locator('#city-stream-speed').scrollIntoViewIfNeeded();await capture('stream-speed-desktop');
  const beforeKeyboard=await state();await page.locator('#city-stream-speed').focus();await page.keyboard.press('Home');check((await state()).plazaStreams.speed===0,'Native Home pauses streams');
  await page.keyboard.press('End');check((await state()).plazaStreams.speed===3,'Native End selects3x');
  check(JSON.stringify((await state()).position)===JSON.stringify(beforeKeyboard.position),'Speed-slider keys do not move the player');
  async function setSpeed(speed){
    await show();const continuity=await page.locator('#city-stream-speed').evaluate((input,speed)=>{
      const before=JSON.parse(window.render_game_to_text()).balconyExterior.life.stream.elapsedSeconds;
      input.value=String(speed);input.dispatchEvent(new Event('input',{bubbles:true}));
      return{before,after:JSON.parse(window.render_game_to_text()).balconyExterior.life.stream.elapsedSeconds};
    },speed);
    check(continuity.before===continuity.after,'Changing speed to'+speed+' preserves packet phase',continuity);
    const s=await state();check(s.plazaStreams.speed===speed&&s.balconyExterior.life.stream.speed===speed,'Slider and stream agree at'+speed);await hide();
  }
  for(const speed of [0,.4,3,1]){
    await setSpeed(speed);
    const run=await page.evaluate(async()=>{const compact=()=>{const s=JSON.parse(window.render_game_to_text());return{wall:performance.now()/1000,stream:s.balconyExterior.life.stream,packets:s.balconyExterior.life.packetPositions,trains:s.balconyExterior.life.trainPositions,animation:s.animation};};const before=compact();await new Promise(r=>setTimeout(r,1600));return{before,after:compact()};});
    const ratio=(run.after.stream.elapsedSeconds-run.before.stream.elapsedSeconds)/(run.after.wall-run.before.wall);report.speedRuns.push({speed,ratio,...run});
    check(speed===0?ratio===0:Math.abs(ratio-speed)<speed*.20,'Native stream rate matches'+speed+'x',ratio);
    check((JSON.stringify(run.before.packets)===JSON.stringify(run.after.packets))===(speed===0),'Packet positions '+(speed===0?'pause':'move')+' at'+speed+'x');
    check(JSON.stringify(run.before.trains)!==JSON.stringify(run.after.trains),'Train movement stays independent at'+speed+'x');
  }
  console.log('Native speed and continuity checks complete');
  for(const [time,weather,id,name] of [
    ['night','clear','balcony','skyline-balcony-night'],['night','clear','balcony-left','skyline-northern-crowns-night'],
    ['night','clear','balcony-right','skyline-southern-crowns-night'],['night','clear','panorama','skyline-north-window-night'],
    ['morning','cloudy','balcony-left','skyline-morning-cloudy'],['day','clear','balcony','skyline-day-clear'],
    ['evening','fog','balcony-left','skyline-evening-fog'],['day','snow','balcony-left','skyline-day-snow']]){
    await choose('#city-time-select',time);await choose('#city-weather-select',weather);await view(id);await capture(name);
    const s=await state();check(s.plazaStreams.speed===1,time+'/'+weather+' retains stream speed');
  }
  await choose('#city-time-select','night');await choose('#city-weather-select','clear');await view('balcony');
  const native=await page.evaluate(async()=>{
    const canvas=document.querySelector('canvas'),stream=canvas.captureStream(20),chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm',videoBitsPerSecond:4500000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};const done=new Promise(r=>recorder.onstop=r),frames=[],start=performance.now();recorder.start(250);
    for(const seconds of [0,2,4,6,8]){const delay=seconds*1000-(performance.now()-start);if(delay>0)await new Promise(r=>setTimeout(r,delay));const s=JSON.parse(window.render_game_to_text());frames.push({seconds,wall:(performance.now()-start)/1000,stream:s.balconyExterior.life.stream,packets:s.balconyExterior.life.packetPositions,image:canvas.toDataURL('image/png').split(',')[1]});}
    recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:'video/webm'}),video=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.split(',')[1]);f.readAsDataURL(blob);});return{frames,video};
  });
  for(const frame of native.frames){const file=`skyline-native-${frame.seconds}s.png`;await writeFile(`${output}/${file}`,Buffer.from(frame.image,'base64'));delete frame.image;screenshots.push(file);}
  await writeFile(`${output}/skyline-native-8s.webm`,Buffer.from(native.video,'base64'));delete native.video;report.native=native;
  const geometry=await page.evaluate(()=>{
    const scene=window.__qaObjects.find(o=>o.isScene&&o.userData.apartment?.northCity),groups=[];
    scene.traverse(o=>{if(o.name.endsWith('· sculpted crowns and neon district displays'))groups.push(o);});
    return groups.map(group=>{let triangles=0,lights=0,finite=true,meshes=0;group.traverse(o=>{if(o.isLight)lights++;if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;for(const value of o.geometry.attributes.position.array)if(!Number.isFinite(value))finite=false;}});return{name:group.name,triangles,lights,finite,meshes};});
  });report.geometry=geometry;check(geometry.length===2&&geometry.every(g=>g.finite&&g.lights===0),'Both actual skyline detail groups have finite geometry and no extra real-time lights',geometry);
  check(geometry.reduce((sum,g)=>sum+g.triangles,0)<80000,'New static skyline geometry stays within80k triangles',geometry);
  await setSpeed(2.3);await page.reload({waitUntil:'domcontentloaded'});await ready();check((await state()).plazaStreams.speed===2.3,'Stream speed persists across reload');
  await setSpeed(1);await choose('#city-time-select','evening');await choose('#city-weather-select','clear');await view('balcony');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);const reducedA=await state();await page.waitForTimeout(800);const reducedB=await state();
  check(JSON.stringify(reducedA.balconyExterior.life.packetPositions)===JSON.stringify(reducedB.balconyExterior.life.packetPositions),'Reduced motion still holds data streams steady');await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:390,height:844});await show();await page.locator('#city-stream-speed').scrollIntoViewIfNeeded();await capture('stream-speed-mobile');check(await page.locator('#city-stream-speed').isVisible(),'Speed control reachable on mobile');
  report.final=await state();
}catch(error){report.failure=error.stack??String(error);if(page)await page.screenshot({path:`${output}/failure.png`,timeout:10000}).catch(()=>{});}
finally{const after=await hashes();report.sourceHashes=sourceHashes;report.changedSources=Object.keys(sourceHashes).filter(p=>sourceHashes[p]!==after[p]);check(!report.changedSources.length,'Scene source stayed frozen');check(!errors.length,'No page/WebGL errors',errors);await writeFile(`${output}/results.json`,JSON.stringify(report,null,2));await browser.close();}
assert.equal(report.failure,undefined,report.failure);assert.ok(checks.every(c=>c.passed),'Inspect failed checks');console.log(JSON.stringify({pass:true,checks:checks.length,screenshots:screenshots.length,output}));
