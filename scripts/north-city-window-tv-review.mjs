import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const output=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-24/final-1';
const url='http://127.0.0.1:5178/room.html?id=os-city-apartment&qa=1';
const errors=[],checks=[],report={capturedAt:new Date().toISOString(),source:url,errors,checks,times:{},screenshots:[],visible:{}};
await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0,'Use a fresh evidence directory');
async function hashes(){const paths=[...(await readdir('src/apartments')).filter(n=>/^osCity.*\.ts$/.test(n)||['room.ts','roomRendering.ts','northCity.css'].includes(n)).sort().map(n=>`src/apartments/${n}`),'scripts/north-city-window-tv-review.mjs'];return Object.fromEntries(await Promise.all(paths.map(async p=>[p,createHash('sha256').update(await readFile(p)).digest('hex')])));}
const beforeHashes=await hashes(),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function check(condition,description,evidence){checks.push({passed:Boolean(condition),description,...(evidence===undefined?{}:{evidence})});if(!condition)console.error('FAIL '+description);}
const browser=await chromium.launch({headless:true,executablePath:process.env.CITY_CHROME??'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
let page;
try{
 const context=await browser.newContext({viewport:{width:1600,height:1000},reducedMotion:'no-preference'});
 await context.addInitScript(()=>{window.__THREE_DEVTOOLS__=new EventTarget();window.__qaScenes=[];window.__THREE_DEVTOOLS__.addEventListener('observe',e=>{if(e.detail.isScene)window.__qaScenes.push(e.detail);});});
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});console.log('Waiting for actual TV-window scene readiness');
 await page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:300000});
 const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
 const tv=s=>({balcony:s.balconyExterior.tvWindows,north:s.northWeather.tvWindows});
 const advance=ms=>page.evaluate(ms=>window.advanceTime(ms),ms);
 async function controls(){if((await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();}
 async function hide(){if(!(await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();}
 async function choose(selector,value){await controls();await page.locator(selector).selectOption(value);await page.locator(selector).focus();await page.keyboard.press('Enter');await page.locator('canvas').first().focus();await advance(100);}
 async function view(id){await controls();if(!(await state()).menuOpen)await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${id}"]`).click();await hide();await advance(100);}
 async function frame(ms=0){return page.evaluate(ms=>{window.advanceTime(ms);return{image:document.querySelector('canvas').toDataURL('image/png').split(',')[1],state:JSON.parse(window.render_game_to_text())};},ms);}
 async function save(name,value){await writeFile(`${output}/${name}.png`,Buffer.from(value.image,'base64'));report.screenshots.push({file:`${name}.png`,state:value.state});console.log('CAPTURED '+name);}
 report.initial=await state();check(report.initial.ready,'Actual WebGL room is ready');
 await choose('#city-weather-select','clear');
 for(const time of ['night','evening','morning','day']){
  await choose('#city-time-select',time);await hide();const samples=[];
  for(let i=0;i<8;i++){await advance(1170);samples.push(tv(await state()));}
  report.times[time]={samples};
  for(const region of ['balcony','north']){
   const s=samples[0][region];assert.ok(s,'TV runtime snapshot is required');
   check(s.windowCount>50&&s.animatedWindowCount>0,`Actual tagged ${region} window population exists: ${time}`,{windowCount:s.windowCount,animated:s.animatedWindowCount});
   check(Math.abs(s.coverage-.4)<.015&&Math.abs(s.animatedWindowCount/s.windowCount-.4)<.015,`Approximately 40% of ${region} windows receive TV interiors: ${time}`,s.coverage);
   check(samples.every(x=>x[region].timeOfDay===time),`${region} TV interior follows selected ${time}`);
   check(samples.every(x=>x[region].windowCount===s.windowCount&&x[region].animatedWindowCount===s.animatedWindowCount),`${region} selected-room membership stays fixed over time: ${time}`);
   check(samples.some(x=>!same(x[region].samples.map(w=>[w.shadowX,w.shadowY]),s.samples.map(w=>[w.shadowX,w.shadowY]))),`${region}/${time} changes spatial shadow positions over time`);
   check(s.samples.every(w=>w.selected)&&new Set(s.samples.map(w=>w.shadowX)).size>4,`${region}/${time} rooms have independent shadow phases`);
   check(s.staticGeometry&&!s.animatedTextures&&s.extraPointLights===0,`${region}/${time} preserves static geometry/maps and adds no point lights`);
  }
 }
 for(const region of ['balcony','north'])check(report.times.night.samples[0][region].strength>report.times.morning.samples[0][region].strength&&report.times.morning.samples[0][region].strength>report.times.day.samples[0][region].strength,`${region} TV wash is softer by day`);
 await choose('#city-time-select','night');

 // Select real visible windows from merged UV triangles. A raycast rules out
 // invisible/occluded material samples before they can supply visual evidence.
 async function locate(region){
  return page.evaluate(async region=>{
   const THREE=await import('/node_modules/three/build/three.module.js');
   const {isCityTvWindow}=await import('/src/apartments/osCityWindowTv.ts');
   const s=JSON.parse(window.render_game_to_text()),scene=window.__qaScenes.find(scene=>scene.getObjectByName('North City · behind the island'));
   const root=scene.getObjectByName(region==='balcony'?'Balcony · rain-soaked Circuit Market and layered east skyline':'North City · behind the island');
   const camera=new THREE.PerspectiveCamera(s.look.fov,1.6,.1,600);camera.position.fromArray(s.position);camera.rotation.set(s.look.pitch,s.look.yaw,0,'YXZ');camera.updateMatrixWorld();scene.updateMatrixWorld();
   window.advanceTime(0);const source=document.querySelector('canvas'),canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   const all=[],seen=new Set(),attributeAudit=[];
   root.traverse(object=>{
    const material=object.material,meta=material?.userData?.cityWindowTv,g=object.geometry;if(!meta||!g)return;
    const pos=g.getAttribute('position'),uv=g.getAttribute('uv'),face=g.getAttribute('cityTvFace');
    attributeAudit.push({material:material.name,vertices:pos.count,tagged:!!face,layout:meta.layout});
    if(!face||material.name.includes('local window group'))return;
    const indices=g.index?.array,count=indices?.length??pos.count;
    for(let t=0;t<count;t+=3){
     const ids=[indices?indices[t]:t,indices?indices[t+1]:t+1,indices?indices[t+2]:t+2];
     const a=new THREE.Vector2(uv.getX(ids[0]),uv.getY(ids[0])),b=new THREE.Vector2(uv.getX(ids[1]),uv.getY(ids[1])),c=new THREE.Vector2(uv.getX(ids[2]),uv.getY(ids[2]));
     const denom=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(denom)<1e-8)continue;
     const bary=(u,v)=>{const wa=((b.y-c.y)*(u-c.x)+(c.x-b.x)*(v-c.y))/denom,wb=((c.y-a.y)*(u-c.x)+(a.x-c.x)*(v-c.y))/denom;return[wa,wb,1-wa-wb];};
     const world=(u,v)=>{const weights=bary(u,v),point=new THREE.Vector3();for(let i=0;i<3;i++)point.addScaledVector(new THREE.Vector3().fromBufferAttribute(pos,ids[i]),weights[i]);return point.applyMatrix4(object.matrixWorld);};
     const faceId=Math.round(face.getX(ids[0])),cols=meta.columns,rows=meta.rows,min=meta.layout==='atlas'?[.125,.1875]:[.035,.045],max=meta.layout==='atlas'?[.859375,.6328125]:[.965,.955];
     for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const u=(col+(min[0]+max[0])/2)/cols,v=1-(row+(min[1]+max[1])/2)/rows,weights=bary(u,v);if(weights.some(w=>w<-.00001||w>1.00001))continue;
      const point=world(u,v),key=[faceId,col,row,...point.toArray().map(x=>x.toFixed(2))].join('/');if(seen.has(key))continue;seen.add(key);
      const projected=point.clone().project(camera);if(projected.z>1||projected.z<0||Math.abs(projected.x)>.94||Math.abs(projected.y)>.94)continue;
      const corners=[];for(const px of [min[0],max[0]])for(const py of [min[1],max[1]])corners.push(world((col+px)/cols,1-(row+py)/rows).project(camera));
      const rect={x:Math.min(...corners.map(p=>(p.x+1)*800)),y:Math.min(...corners.map(p=>(1-p.y)*500)),right:Math.max(...corners.map(p=>(p.x+1)*800)),bottom:Math.max(...corners.map(p=>(1-p.y)*500))};
      const w=rect.right-rect.x,h=rect.bottom-rect.y;if(w<5||h<4||w*h<35)continue;
      const px=Math.max(0,Math.min(1599,Math.round((projected.x+1)*800))),py=Math.max(0,Math.min(999,Math.round((1-projected.y)*500))),p=(py*1600+px)*4,brightness=(pixels[p]+pixels[p+1]+pixels[p+2])/3;
      if(brightness<15)continue;
      const id=faceId*cols*rows+row*cols+col;
      all.push({id,selected:isCityTvWindow(id),faceId,col,row,rect,world:point.toArray(),ndc:[projected.x,projected.y],distance:point.distanceTo(camera.position),brightness,material:material.name,area:w*h});
     }
    }
   });
   all.sort((a,b)=>b.area-a.area);
   const ray=new THREE.Raycaster(),visible=[];
   for(const candidate of all.slice(0,180)){
    ray.setFromCamera(new THREE.Vector2(...candidate.ndc),camera);ray.far=candidate.distance+.3;
    const hit=ray.intersectObjects(scene.children,true).find(hit=>{let o=hit.object;while(o){if(!o.visible)return false;o=o.parent;}return hit.object.material?.opacity!==0;});
    if(hit&&Math.abs(hit.distance-candidate.distance)<.2)visible.push({...candidate,nearestDistance:hit.distance});
    if(visible.filter(v=>v.selected).length>=5&&visible.filter(v=>!v.selected).length>=2)break;
   }
   return{attributeAudit,candidates:all.length,visible,selected:visible.find(v=>v.selected),control:visible.find(v=>!v.selected)};
  },region);
 }
 async function analyze(region,frames,selection){
  const result=await page.evaluate(async({frames,selection})=>{
   const arrays=[],canvases=[];for(const value of frames){const im=new Image();im.src='data:image/png;base64,'+value.image;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);canvases.push(c);arrays.push(c.getContext('2d').getImageData(0,0,c.width,c.height).data);}
   function samples(candidate){const r=candidate.rect,x=Math.ceil(r.x+1),y=Math.ceil(r.y+1),w=Math.max(2,Math.floor(r.right)-x-1),h=Math.max(2,Math.floor(r.bottom)-y-1);return{rect:{x,y,w,h},values:arrays.map(data=>{const values=[];for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++){const p=(py*1600+px)*4;values.push(.2126*data[p]+.7152*data[p+1]+.0722*data[p+2]);}return values;})};}
   function compare(values){const a=values[0],results=[];for(const b of values.slice(1)){const ma=a.reduce((s,v)=>s+v,0)/a.length,mb=b.reduce((s,v)=>s+v,0)/b.length;let aa=0,ab=0;for(let i=0;i<a.length;i++){aa+=(a[i]-ma)**2;ab+=(a[i]-ma)*(b[i]-mb);}const gain=aa>1e-6?ab/aa:1,offset=mb-gain*ma;const residuals=b.map((v,i)=>v-(gain*a[i]+offset));results.push({gain,offset,spatialResidualRms:Math.sqrt(residuals.reduce((s,v)=>s+v*v,0)/a.length),pixels:a.length,meanLumaA:ma,meanLumaB:mb,rawRms:Math.sqrt(b.reduce((s,v,i)=>s+(v-a[i])**2,0)/a.length)});}return results;}
   const selected=samples(selection.selected),control=selection.control?samples(selection.control):null;
   const r=selection.selected.rect,pad=10,crop={x:Math.max(0,Math.floor(r.x)-pad),y:Math.max(0,Math.floor(r.y)-pad),w:Math.ceil(r.right-r.x)+pad*2,h:Math.ceil(r.bottom-r.y)+pad*2};
   const contact=document.createElement('canvas');contact.width=crop.w*3*4;contact.height=crop.h*4;const ctx=contact.getContext('2d');ctx.imageSmoothingEnabled=false;canvases.forEach((c,i)=>ctx.drawImage(c,crop.x,crop.y,crop.w,crop.h,i*crop.w*4,0,crop.w*4,crop.h*4));
   return{selected:{rect:selected.rect,comparisons:compare(selected.values)},control:control?{rect:control.rect,comparisons:compare(control.values)}:null,crop,cropScale:4,cropPng:contact.toDataURL('image/png').split(',')[1]};
  },{frames,selection});
  await writeFile(`${output}/${region}-window-temporal-crop.png`,Buffer.from(result.cropPng,'base64'));delete result.cropPng;return result;
 }
 for(const [region,viewpoint] of [['balcony','balcony'],['north','panorama']]){
  await view(viewpoint);const selection=await locate(region);report.visible[region]={selection};
  check(selection.attributeAudit.length>0&&selection.attributeAudit.every(m=>m.tagged),`${region} actual TV materials have preserved per-face geometry IDs`);
  assert.ok(selection.selected,`No selected visible TV window found in ${region}`);
  console.log(`VISIBLE ${region} TV room ${selection.selected.id}: ${JSON.stringify(selection.selected.rect)}`);
  const frames=[];for(const [i,ms] of [0,1430,2110].entries()){const value=await frame(ms);frames.push(value);await save(`${region}-night-t${i}`,value);}
  const pixels=await analyze(region,frames,selection);report.visible[region].pixels=pixels;
  // An affine brightness fit removes whole-window brightening/dimming. A
  // residual spatial change is necessary before claiming moving interior shadows.
  check(pixels.selected.comparisons.some(p=>p.spatialResidualRms>1.3&&p.rawRms>2),`${region} actual selected-window pixels change spatially beyond uniform brightness`,pixels.selected);
 }
 await choose('#city-time-select','day');for(const [region,id] of [['balcony','balcony'],['north','panorama']]){await view(id);await save(`${region}-day`,await frame());}
 await choose('#city-time-select','night');await view('balcony');
 const recording=await page.evaluate(async()=>{
  const stream=document.querySelector('canvas').captureStream(20),mimeType=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t)),recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:4000000}),chunks=[],samples=[];
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};const stopped=new Promise(resolve=>{recorder.onstop=resolve;});recorder.start(250);
  const timer=setInterval(()=>{const s=JSON.parse(window.render_game_to_text());samples.push({balcony:s.balconyExterior.tvWindows,north:s.northWeather.tvWindows});},250);
  await new Promise(resolve=>setTimeout(resolve,12000));clearInterval(timer);recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:mimeType});
  const data=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob);});return{data,mimeType,bytes:blob.size,samples};
 });
 await writeFile(`${output}/balcony-tv-native-12s.webm`,Buffer.from(recording.data,'base64'));delete recording.data;report.recording=recording;
 await page.emulateMedia({reducedMotion:'reduce'});await advance(100);const reducedStart=tv(await state());await advance(12000);const reducedEnd=tv(await state());report.reducedMotion={start:reducedStart,end:reducedEnd};
 for(const region of ['balcony','north']){check(reducedStart[region].reducedMotion&&reducedEnd[region].reducedMotion,`${region} observes reduced-motion preference`);check(same(reducedStart[region].samples,reducedEnd[region].samples),`${region} interior shadow/color/light samples stay fixed under reduced motion`);}
 check(report.screenshots.length===8,'Eight actual-canvas temporal and day views captured');
}catch(error){report.failure=error.stack??String(error);if(page&&!page.isClosed())await page.screenshot({path:`${output}/failure-state.png`,timeout:10000}).catch(()=>{});}
finally{const afterHashes=await hashes();report.changedSources=Object.keys(beforeHashes).filter(p=>beforeHashes[p]!==afterHashes[p]);check(report.changedSources.length===0,'Scene and capture sources remain unchanged',report.changedSources);check(errors.length===0,'No browser/WebGL shader or page errors',errors);await writeFile(`${output}/source-hashes.json`,JSON.stringify(beforeHashes,null,2));await writeFile(`${output}/source-hashes-after.json`,JSON.stringify(afterHashes,null,2));await writeFile(`${output}/results.json`,JSON.stringify(report,null,2));await browser.close();}
assert.equal(report.failure,undefined,report.failure);assert.equal(checks.filter(c=>!c.passed).length,0,'Inspect failed checks');console.log(JSON.stringify({result:'PASS',checks:checks.length,screenshots:report.screenshots.length,output}));
