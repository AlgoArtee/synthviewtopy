import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
const out=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-13/preflight';
await mkdir(out,{recursive:true});
await mkdir('test-artifacts/north-city/references',{recursive:true});
await copyFile('C:/Users/Admin/AppData/Local/Temp/codex-clipboard-0f624e6c-4f1e-44ca-8616-087d8649718d.png','test-artifacts/north-city/references/09-window-layout.png');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const captures=[];
async function expand(){if((await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();}
async function view(id){await expand();if(!(await state()).menuOpen)await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${id}"]`).click();await page.locator('#city-controls-toggle').click();await page.evaluate(()=>window.advanceTime(100));}
async function mode(id){await expand();await page.locator('#city-window-select').selectOption(id);await page.evaluate(()=>window.advanceTime(3000));const s=await state();assert.equal(s.windowFixture.mode,id);assert.equal(s.windowFixture.transitioning,false);return s.windowFixture;}
async function capture(file){await page.waitForTimeout(120);await page.screenshot({path:out+'/'+file+'.png'});captures.push({file:file+'.png',state:await state()});console.log('CAPTURED '+file);}
try{
 await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1&revision=tilt-turn-panorama',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});
 const initial=await state();assert.equal(initial.windowFixture.mode,'closed');assert.equal(initial.cityExterior.windowLighting.variants,24);
 await view('panorama');await capture('01-panorama-closed');
 await view('window');await capture('02-left-window-closed');
 const open=await mode('open');assert.equal(open.turnDegrees,90);assert.equal(open.tiltDegrees,0);
 await view('window');await capture('03-left-window-fully-open');await view('panorama');await capture('04-panorama-fully-open');
 const tilt=await mode('tilt');assert.equal(tilt.turnDegrees,0);assert.ok(Math.abs(tilt.tiltDegrees-8.594)<.002);assert.ok(tilt.topOpeningMetres>.32);
 await view('window');await capture('05-left-window-top-tilt');await view('panorama');await capture('06-panorama-top-tilt');
 await mode('closed');await view('television');await capture('07-centred-tv');await view('bed-wide');await capture('08-full-bed');
 await view('city-detail');await capture('09-city-interiors');
 for(const weather of ['clear','cloudy','rain','storm','snow','fog']){await expand();await page.locator('#city-weather-select').selectOption(weather);await view('panorama');assert.equal((await state()).weather.mode,weather);await capture('10-weather-'+weather);}
 await expand();await page.locator('#city-weather-select').selectOption('rain');await view('panorama');await expand();await capture('11-desktop-controls');
 await page.setViewportSize({width:390,height:844});await capture('12-phone-controls');
 for(const id of ['open','tilt','closed'])await mode(id);
 await page.keyboard.press('h');assert.equal((await state()).controlsCollapsed,true);assert.equal(await page.locator('#city-window-select').isVisible(),false);assert.equal(await page.locator('.room-back').isVisible(),true);await capture('13-phone-collapsed');await page.keyboard.press('h');assert.equal(await page.locator('#city-window-select').isVisible(),true);
 const fit=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.equal(fit.width,fit.scroll);assert.deepEqual(errors,[]);
 // Actual mesh clearance, two-bay count and mechanically exclusive tilt/turn transition.
 const geometry=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js');const {createOsCityApartment}=await import('/src/apartments/osCityApartment.ts');const {CITY_BED,CITY_WINDOW}=await import('/src/apartments/osCityLayout.ts');
  const room=createOsCityApartment();await room.ready;room.scene.updateMatrixWorld(true);const w=room.windowFixture;
  const sash=room.scene.getObjectByName('Window · opening sash'),duvet=room.scene.getObjectByName('Duvet · large filled white cotton blanket');const left=CITY_BED.minX+.215;
  let duvetMaximum=-Infinity;const p=duvet.geometry.attributes.position;
  for(let i=0;i<p.count;i++)if(p.getX(i)<left+w.getSnapshot().leafWidth+.10&&p.getZ(i)<CITY_WINDOW.z+w.getSnapshot().leafWidth+.20)duvetMaximum=Math.max(duvetMaximum,p.getY(i));
  const westPillows=[];room.scene.traverse(o=>{if(o.isGroup&&o.name.startsWith('Bed pillow ·')){const b=new THREE.Box3().setFromObject(o,true);if(b.min.x<left+w.getSnapshot().leafWidth&&b.min.z<CITY_WINDOW.z+w.getSnapshot().leafWidth+.20)westPillows.push({name:o.name,min:b.min.toArray(),max:b.max.toArray()});}});
  const transitions=[];let t=0,lowestSash=Infinity,highestSash=-Infinity,westmost=Infinity;
  for(const mode of ['open','tilt','open','closed']){w.setMode(mode);let mixed=0;for(let i=0;i<240;i++){room.update(t+=1/60);room.scene.updateMatrixWorld(true);const snap=w.getSnapshot();if(snap.turnDegrees>.06&&snap.tiltDegrees>.06)mixed++;const b=new THREE.Box3().setFromObject(sash,true);lowestSash=Math.min(lowestSash,b.min.y);highestSash=Math.max(highestSash,b.max.y);westmost=Math.min(westmost,b.min.x);}transitions.push({mode,mixed,settled:w.getSnapshot()});}
  let retainedDividers=0,obsoleteDividers=0;room.scene.traverse(o=>{if(o.name==='Panoramic window · single retained divider')retainedDividers++;if(o.name==='Panoramic window · slim vertical mullion')obsoleteDividers++;});
  const report={duvetMaximum,westPillows,lowestSash,highestSash,westmost,retainedDividers,obsoleteDividers,transitions,closed:w.getSnapshot(),bed:CITY_BED};room.dispose();return report;
 });
 await writeFile(out+'/window-clearance.json',JSON.stringify(geometry,null,2));
 assert.equal(geometry.retainedDividers,1);assert.equal(geometry.obsoleteDividers,0);assert.ok(geometry.lowestSash>geometry.duvetMaximum+.01,'Sash clears duvet throughout entire opening sweep');for(const p of geometry.westPillows)assert.ok(geometry.lowestSash>p.max[1]+.01,'Sash clears low pillow');assert.ok(geometry.highestSash<3.5);assert.ok(geometry.westmost>geometry.bed.minX,'Sash clears west wall');for(const transition of geometry.transitions){assert.equal(transition.mixed,0);assert.equal(transition.settled.transitioning,false);}
 const reduced=await browser.newContext({reducedMotion:'reduce'}),rp=await reduced.newPage();await rp.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment',{waitUntil:'domcontentloaded',timeout:120000});await rp.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});await rp.locator('#city-window-select').selectOption('open');assert.equal(await rp.evaluate(()=>JSON.parse(window.render_game_to_text()).windowFixture.turnDegrees),90);await rp.locator('#city-window-select').selectOption('tilt');assert.equal(await rp.evaluate(()=>JSON.parse(window.render_game_to_text()).windowFixture.transitioning),false);await reduced.close();
 await writeFile(out+'/window-results.json',JSON.stringify({initial,open,tilt,fit,geometry,captures,errors,reducedMotion:'Immediate window movement and no city animation'},null,2));console.log(JSON.stringify({captures:captures.length,geometry,errors}));
}finally{await browser.close();}
