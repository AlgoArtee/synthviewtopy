import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-5/preflight';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
async function restoreControls(){if((await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();}
async function view(name){await restoreControls();if(!(await state()).menuOpen)await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${name}"]`).click();await page.locator('#city-controls-toggle').click();await page.waitForTimeout(200);}
try{
  await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});
  const initial=await state();assert.equal(initial.cityLife.hologramCount,2);assert.match(initial.cityLife.holograms.style,/long wind-blown dresses/);
  for(const name of ['entrance','sleep','on-bed','lounge','city-reference','city-detail','bed-wide','panorama','television','pillows','duvet','ceiling','ceiling-oblique-a','ceiling-oblique-b','corner-sw','corner-se','corner-nw','corner-ne','study','bathroom','kitchen','ghost-cyan-face','ghost-pink-face']){
    if(name==='entrance')await page.locator('#city-controls-toggle').click();else await view(name);
    await page.screenshot({path:`${out}/${name}.png`,timeout:60000});console.log('CAPTURED '+name);
  }
  await view('city-detail');
  const before=await state();
  await page.evaluate(()=>{
    const canvas=document.querySelector('#apartment-viewport canvas'),stream=canvas.captureStream(24),chunks=[];
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:5000000});
    window.__ghostRecorder=recorder;window.__ghostVideoFinished=new Promise(resolve=>{
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recorder.onstop=async()=>{const blob=new Blob(chunks,{type:'video/webm'}),reader=new FileReader();reader.onloadend=()=>{stream.getTracks().forEach(t=>t.stop());resolve(reader.result.split(',')[1]);};reader.readAsDataURL(blob);};
    });recorder.start(1000);
  });
  const wallStart=Date.now(),samples=[];
  for(let i=0;i<6;i++){await page.waitForTimeout(4000);samples.push(await state());await page.screenshot({path:`${out}/motion-${i+1}.png`,timeout:60000});}
  await page.evaluate(()=>window.__ghostRecorder.stop());
  const video=await page.evaluate(()=>window.__ghostVideoFinished);await writeFile(out+'/ghost-motion.webm',Buffer.from(video,'base64'));
  const after=await state(),clipWallMilliseconds=Date.now()-wallStart;assert.notDeepEqual(before.cityLife.holograms.clothProbe,after.cityLife.holograms.clothProbe);assert.notDeepEqual(before.cityLife.holograms.sway,after.cityLife.holograms.sway);
  for(const mode of ['clear','cloudy','rain','storm','snow','fog']){
    await restoreControls();await page.locator('#city-weather-select').selectOption(mode);await view('city-reference');
    assert.equal((await state()).weather.mode,mode);await page.screenshot({path:`${out}/weather-${mode}.png`,timeout:60000});
  }
  await restoreControls();await page.locator('#city-weather-select').selectOption('rain');await view('city-reference');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);await page.screenshot({path:out+'/mobile-ghosts.png',timeout:60000});
  const fit=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.equal(fit.width,fit.scroll);assert.deepEqual(errors,[]);
  await writeFile(out+'/hologram-results.json',JSON.stringify({initial,before,after,samples,clipWallMilliseconds,mobile:fit,errors},null,2));
  console.log(JSON.stringify({ready:true,errors,clip:'ghost-motion.webm',holograms:after.cityLife.holograms}));
}finally{await writeFile(out+'/errors.json',JSON.stringify(errors,null,2));await browser.close();}
