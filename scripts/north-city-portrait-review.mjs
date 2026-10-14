import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-11/review-1';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const errors=[];
async function ready(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{polling:100,timeout:120000});await page.evaluate(async()=>{const image=new Image();image.src='/apartments/holograms/reference-portrait-atlas-v11.png';await image.decode();});await page.waitForTimeout(300);}
const state=page=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
async function view(page,id){let s=await state(page);if(s.controlsCollapsed)await page.locator('#city-controls-toggle').evaluate(el=>el.click());s=await state(page);if(!s.menuOpen)await page.locator('#room-menu-toggle').evaluate(el=>el.click());await page.locator(`[data-viewpoint="${id}"]`).evaluate(el=>el.click());await page.locator('#city-controls-toggle').evaluate(el=>el.click());await page.evaluate(()=>window.advanceTime(0));}
try{
 // Hold browser RAF only in this capture context. The production renderer is advanced at exact times.
 const fixed=await browser.newContext({viewport:{width:1920,height:1080}});
 await fixed.addInitScript(()=>{window.requestAnimationFrame=()=>0;window.cancelAnimationFrame=()=>{};});
 const page=await fixed.newPage();await ready(page);console.log('READY deterministic portrait capture');
 assert.equal((await state(page)).cityLife.time,0);
 for(const color of ['cyan','pink']){await view(page,`ghost-${color}-portrait`);await page.screenshot({path:`${out}/${color}-open.png`});}
 await page.evaluate(()=>window.advanceTime(3445));
 const cyanClosed=await state(page);assert.ok(cyanClosed.cityLife.holograms.blink[0]>.99);assert.equal(cyanClosed.cityLife.holograms.blink[1],0);
 await view(page,'ghost-cyan-portrait');await page.screenshot({path:`${out}/cyan-blink.png`});
 await page.evaluate(()=>window.advanceTime(330));
 const pinkClosed=await state(page);assert.ok(pinkClosed.cityLife.holograms.blink[1]>.99);assert.equal(pinkClosed.cityLife.holograms.blink[0],0);
 await view(page,'ghost-pink-portrait');await page.screenshot({path:`${out}/pink-blink.png`});
 await page.evaluate(()=>window.advanceTime(8225));
 const headTurn=await state(page);
 for(const color of ['cyan','pink']){await view(page,`ghost-${color}-portrait`);await page.screenshot({path:`${out}/${color}-head-turn.png`});}
 for(const id of ['city-detail','city-reference','panorama','bed-wide']){await view(page,id);await page.screenshot({path:`${out}/${id}.png`});}
 const geometry=await page.evaluate(async()=>{
   const THREE=await import('/node_modules/three/build/three.module.js');
   const {createCityGhostHolograms}=await import('/src/apartments/osCityHolograms.ts');
   const ghosts=createCityGhostHolograms(),roots=ghosts.group.children;
   const read=()=>roots.map(root=>{const head=root.getObjectByName('Ghost portrait · articulated head'),eye=root.getObjectByName('Ghost eye · left iris and aperture'),upper=root.getObjectByName('Ghost eyelid · left upper');
     const a=new THREE.Vector3(),b=new THREE.Vector3(),lid=new THREE.Vector3();eye.getVertexPosition(20,a);eye.getVertexPosition(10*41+20,b);upper.getVertexPosition(20,lid);
     return {apertureHeight:b.y-a.y,upperLid:lid.toArray(),headLocal:head.quaternion.toArray(),body:root.quaternion.toArray(),influence:eye.morphTargetInfluences[0]};});
   ghosts.update(0);const open=read();ghosts.update(3.445);const cyan=read();ghosts.update(3.775);const pink=read();ghosts.update(12);const turned=read();
   const samples=[];for(let i=0;i<=1200;i++){ghosts.update(i/30);samples.push({time:i/30,blink:[...ghosts.snapshot.blink],head:ghosts.snapshot.headPose.map(a=>[...a])});}
   const problems=[];let triangles=0;ghosts.group.traverse(o=>{if(!o.geometry)return;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;for(const [name,a]of Object.entries(o.geometry.attributes)){if(Array.from(a.array).some(x=>!Number.isFinite(x)))problems.push(o.name+':'+name);}for(const list of Object.values(o.geometry.morphAttributes))for(const a of list)if(Array.from(a.array).some(x=>!Number.isFinite(x)))problems.push(o.name+':morph');});
   return {open,cyan,pink,turned,samples,triangles,problems};
 });
 for(let i=0;i<2;i++){
   const closed=i?geometry.pink:geometry.cyan;
   assert.ok(geometry.open[i].apertureHeight>.010);
   assert.ok(Math.abs(closed[i].apertureHeight)<.00001,'Actual eye aperture must close');
   assert.ok(Math.abs(closed[i].upperLid[1]-geometry.open[i].upperLid[1])>.006,'Actual upper lid must move');
   assert.notDeepEqual(geometry.open[i].headLocal,geometry.turned[i].headLocal,'Head must move independently within body');
   assert.ok(geometry.samples.some(s=>s.blink[i]>.99));assert.ok(geometry.samples.some(s=>s.blink[i]===0));
 }
 assert.ok(geometry.samples.some(s=>s.blink[0]>.9&&s.blink[1]===0));assert.ok(geometry.samples.some(s=>s.blink[1]>.9&&s.blink[0]===0));assert.deepEqual(geometry.problems,[]);
 await writeFile(`${out}/portrait-measurements.json`,JSON.stringify({cyanClosed:cyanClosed.cityLife.holograms,pinkClosed:pinkClosed.cityLife.holograms,headTurn:headTurn.cityLife.holograms,geometry,errors},null,2));
 await fixed.close();console.log('Actual eyelid aperture, upper lid, independent head motion and unsynchronised blinks passed.');
 const context=await browser.newContext({viewport:{width:1920,height:1080}}),live=await context.newPage();await ready(live);
 const clips=[];
 for(const color of ['cyan','pink']){
   await view(live,`ghost-${color}-portrait`);const before=await state(live);
   await live.evaluate(()=>{const canvas=document.querySelector('#apartment-viewport canvas'),stream=canvas.captureStream(24),chunks=[];const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:4500000});window.__portraitRecorder=recorder;window.__portraitClip=new Promise(resolve=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{const reader=new FileReader();reader.onloadend=()=>{stream.getTracks().forEach(t=>t.stop());resolve(reader.result.split(',')[1]);};reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};});recorder.start(500);});
   const samples=[];for(let i=0;i<16;i++){await live.waitForTimeout(500);samples.push((await state(live)).cityLife.holograms);}
   await live.evaluate(()=>window.__portraitRecorder.stop());const video=await live.evaluate(()=>window.__portraitClip);await writeFile(`${out}/${color}-motion.webm`,Buffer.from(video,'base64'));
   const after=await state(live);assert.notDeepEqual(before.cityLife.holograms.headPose,after.cityLife.holograms.headPose);assert.notDeepEqual(before.cityLife.holograms.clothProbe,after.cityLife.holograms.clothProbe);clips.push({color,before:before.cityLife.holograms,after:after.cityLife.holograms,samples});console.log('CAPTURED '+color+' motion');
 }
 await context.close();
 const reduced=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'}),rp=await reduced.newPage();await ready(rp);const before=await state(rp);await rp.evaluate(()=>window.advanceTime(12000));const after=await state(rp);assert.deepEqual(after.cityLife.holograms,before.cityLife.holograms);await reduced.close();
 assert.deepEqual(errors,[]);await writeFile(`${out}/animation-results.json`,JSON.stringify({clips,reducedMotion:{before:before.cityLife.holograms,after:after.cityLife.holograms},errors},null,2));console.log(JSON.stringify({ready:true,errors,reducedMotion:true,triangles:geometry.triangles}));
}finally{await writeFile(`${out}/errors.json`,JSON.stringify(errors,null,2));await browser.close();}
