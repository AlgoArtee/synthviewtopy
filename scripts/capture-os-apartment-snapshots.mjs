import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,readdir,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';

// Camera-only capture hook, scoped to this browser's served module response.
// All geometry, textures, lighting and postprocessing come from the current room.
const out=resolve(process.env.SNAPSHOT_OUTPUT??'output/playwright/os-apartment-snapshots-100');
const base=process.env.BASE_URL??'http://127.0.0.1:5178';
const only=new Set((process.env.SNAPSHOT_ONLY??'').split(',').filter(Boolean).map(Number));
const resume=process.env.SNAPSHOT_RESUME==='1';
const formats=[
 {id:'ultrawide',folder:'Ultrawide',width:5120,height:2160,label:'Ultrawide · 5120 × 2160'},
 {id:'phone',folder:'Phone',width:2160,height:3840,label:'Vertical phone · 2160 × 3840'},
];
const photo=(title,position,target,fov=62,weather='rain')=>({title,position,target,fov,weather});
const wide=[
 photo('Entrance and expanded living room',[-2.16,1.65,3.72],[-2.9,1.35,-1.3],58),
 photo('Southwest living room panorama',[-4.43,1.72,5.68],[-.15,1.4,.05],55,'clear'),
 photo('Southeast apartment panorama',[4.36,1.7,5.65],[-2.9,1.3,.4],56),
 photo('Living room towards the square bed',[-.42,1.75,2.87],[-4.5,1.32,-3.9],55),
 photo('Living room towards the kitchen',[-3.67,1.7,3.43],[3.3,1.4,1.65],53,'fog'),
 photo('Workstation across the living room',[.77,1.62,.68],[-.3,1.3,5.72],52),
 photo('Desk and ceiling from the west',[-4.32,1.77,3.34],[-.1,1.8,5.72],55),
 photo('Kitchen towards the floating lounge',[3.62,1.7,2.97],[-3.2,1.2,1.66],55,'cloudy'),
 photo('Bed entrance and helix nightstand',[-3.08,1.5,1.43],[-2.8,1.12,-1.8],50),
 photo('Elevated apartment composition',[3.58,2.98,5.53],[-2.35,1.0,.65],56),
 photo('Full oversized square bed',[-1.70,3.02,-1.32],[-6.05,.85,-5.72],55),
 photo('Wall-wide window from the bed foot',[-5.43,2.25,-1.31],[-5.53,1.7,-9.44],54),
 photo('White duvet from the west',[-9.07,2.42,-2.18],[-5.0,1.02,-7.6],56,'clear'),
 photo('White duvet from the east',[-1.69,2.40,-3.28],[-6.85,1.12,-7.45],55),
 photo('Bed towards living room from northwest',[-9.12,2.42,-8.78],[-2.0,1.35,3.5],58),
 photo('Bed towards living room from northeast',[-1.74,2.41,-8.76],[-3.25,1.35,2.2],56,'fog'),
 photo('Holographic TV and wall-fitted duvet',[-5.82,2.08,-4.68],[-9.65,2.03,-6.1],47),
 photo('Holographic TV oblique across the bed',[-3.70,2.15,-7.75],[-9.64,2.06,-6.1],46,'cloudy'),
 photo('Four large pillows opposite the TV',[-5.18,2.5,-4.88],[-1.8,1.3,-5.65],48),
 photo('Clear daylight on white bedding',[-5.55,2.32,-2.02],[-5.53,1.35,-8.85],54,'clear'),
 photo('Floating chair above circular white rug',[-1.74,1.42,3.68],[-3.3,1.1,1.65],52),
 photo('Transparent chair facing the kitchen',[-1.40,1.35,1.49],[-3.36,1.1,1.69],47),
 photo('Floating chair rear and bed beyond',[-4.41,1.36,2.87],[-3.35,1.1,1.5],50),
 photo('Soft cushions within clear chair shell',[-1.91,1.52,1.15],[-3.36,1.08,1.65],40),
 photo('Brilliant white circular rug',[-1.47,2.88,3.78],[-3.2,.22,1.75],49,'clear'),
 photo('Kitchen-facing lounge and bed entrance',[-4.39,1.72,4.27],[-1.25,1.25,1.5],54),
 photo('Holographic workstation front',[-.13,1.45,3.82],[-.05,1.3,5.77],48),
 photo('Holographic workstation left oblique',[-2.22,1.63,4.22],[-.15,1.25,5.65],50),
 photo('Holographic workstation right oblique',[1.88,1.59,4.32],[-.05,1.3,5.7],50),
 photo('Projected keyboard and desktop',[-.43,1.45,4.92],[-.16,.89,5.52],43),
 photo('Floating computer information panels',[-.12,1.55,4.67],[0,1.49,5.82],44),
 photo('Workstation stool and clear desktop',[-1.47,1.34,4.22],[0,.95,5.25],48),
 photo('Bathroom through the sliding doorway',[.63,1.65,.15],[.05,1.3,-2.18],53),
 photo('Bathroom pastel luminous grid',[.94,1.74,-.46],[-.35,1.35,-1.9],58),
 photo('Bathroom mirror and luminous panel seams',[-.62,1.87,-1.12],[.75,1.94,-2.8],49),
 photo('Porcelain soaking tub and neon walls',[.49,1.78,-1.21],[.04,.77,-2.35],50),
 photo('Floating basin and reflective mirror',[.37,1.39,-.72],[-.89,1.12,-1.03],49),
 photo('Kitchen quartz and satin fittings',[1.77,1.63,2.08],[4.3,1.35,1.25],52,'clear'),
 photo('Kitchen from the south',[2.69,1.68,3.38],[4.25,1.4,1.35],49,'fog'),
 photo('Kitchen tap worktop and ceramic cup',[3.12,1.63,1.78],[4.32,1.11,.92],48),
 photo('Concentric ceiling rings',[-1.69,1.60,2.38],[-2.75,3.45,.34],55),
 photo('Ceiling fixture and living room',[-4.27,1.53,2.53],[-2.7,3.25,.25],54),
 photo('Helix nightlight glass construction',[-2.10,1.15,.68],[-1.66,.95,-.4],34),
 photo('Nightstand soft pink reflected light',[-2.44,1.2,.51],[-1.66,.91,-.4],42),
 photo('Full city window and duvet foreground',[-5.50,2.34,-5.34],[-5.53,1.52,-22],51),
 photo('Rainy traffic bridges and neon',[-5.42,2.38,-9.02],[-5.5,-2.0,-42],39),
 photo('Snowy city beyond the white bed',[-6.07,2.15,-8.37],[-5.5,.4,-39],45,'snow'),
 photo('Storm city and flowing spectral figures',[-4.97,2.33,-8.87],[-4.4,2.9,-45],28,'storm'),
 photo('Blue hologram updated facial portrait',[-1.70,4.48,-39.78],[-1.805,4.48,-41.46],48),
 photo('Pink hologram artistic facial portrait',[-8.93,3.66,-53.74],[-8.825,3.66,-55.46],48),
];
// Reframed independently for the narrow phone sensor; these are not landscape crops.
const phone=[
 photo('Entrance vertical room portrait',[-2.33,1.72,4.95],[-3,1.65,-.35],70),
 photo('Living room from southwest',[-4.48,1.78,5.75],[-2.3,1.5,.5],72,'clear'),
 photo('Living room from southeast',[4.42,1.75,5.78],[-1.9,1.5,.1],72),
 photo('Bed entrance beneath the ceiling',[-.15,1.78,4.35],[-3.5,1.6,-2.0],72),
 photo('Kitchen beyond the white lounge',[-4.24,1.75,3.58],[3.8,1.6,1.6],68,'fog'),
 photo('Desk across the room',[.63,1.70,-.02],[-.15,1.5,5.65],65),
 photo('Ceiling and workstation from west',[-3.8,1.65,3.12],[-.1,1.9,5.65],72),
 photo('Floating lounge from the kitchen',[3.9,1.72,2.72],[-3.3,1.3,1.6],65,'cloudy'),
 photo('Alcove opening and nightlight',[-3.0,1.65,2.1],[-2.7,1.45,-1.3],68),
 photo('Apartment vertical overview',[3.9,2.90,5.78],[-2.45,1.2,.6],75),
 photo('Square bed diagonal portrait',[-1.6,3.05,-1.1],[-5.6,1.1,-6.0],75),
 photo('Bed and modern city window',[-5.3,2.38,-1.42],[-5.525,1.65,-9.45],68),
 photo('Soft duvet west diagonal',[-9.23,2.48,-1.52],[-5.6,1.0,-6.0],70,'clear'),
 photo('Soft duvet east diagonal',[-1.57,2.44,-3.05],[-6.6,1.2,-7.3],70),
 photo('Bed to lounge northwest portrait',[-9.32,2.39,-8.91],[-2.5,1.55,2.8],70),
 photo('Bed to lounge northeast portrait',[-1.53,2.43,-9.0],[-3.2,1.65,2.1],70,'fog'),
 photo('Left-wall holographic television',[-3.5,2.12,-5.9],[-9.65,2.12,-6.1],65),
 photo('TV over gently gathered duvet',[-4.15,2.30,-8.1],[-9.64,1.75,-6.1],65,'cloudy'),
 photo('Oversized pillows along opposite wall',[-5.4,2.62,-4.4],[-1.8,1.35,-5.5],69),
 photo('White bed in clear city daylight',[-5.6,2.52,-2.4],[-5.525,1.45,-9.0],68,'clear'),
 photo('Floating chair and brilliant round rug',[-.85,1.55,4.2],[-3.3,1.15,1.65],69),
 photo('Transparent chair front portrait',[-.65,1.35,1.72],[-3.35,1.18,1.65],65),
 photo('Transparent chair rear portrait',[-4.50,1.40,3.8],[-3.35,1.16,1.65],67),
 photo('Chair clear rim and soft white cushion',[-1.3,1.55,.85],[-3.36,1.14,1.65],60),
 photo('Round luminous rug and chair',[-.55,2.9,4.4],[-3.3,.6,1.65],70,'clear'),
 photo('Floating chair with kitchen view',[-4.43,1.70,4.75],[-2.6,1.25,1.7],70),
 photo('Holographic workstation portrait',[-.08,1.55,2.10],[-.05,1.3,5.77],65),
 photo('Workstation luminous left panels',[-2.7,1.65,3.7],[-.2,1.4,5.7],65),
 photo('Workstation right profile',[2.35,1.63,3.85],[-.1,1.4,5.7],65),
 photo('Keyboard and floating screen portrait',[-.35,1.65,4.30],[-.1,1.18,5.6],64),
 photo('Clear information displays',[-.3,1.58,4.05],[0,1.55,5.82],62),
 photo('Desk and sculpted stool portrait',[-1.8,1.45,3.6],[0,1.08,5.4],65),
 photo('Pastel bathroom doorway portrait',[.58,1.68,.32],[.0,1.4,-2.0],70),
 photo('Bathroom neon panel portrait',[1.12,1.72,-.35],[-.42,1.45,-1.85],76),
 photo('Bathroom grid and mirrored light',[-.73,1.68,-.55],[.62,1.75,-2.82],70),
 photo('Soaking tub vertical detail',[.80,1.95,-.55],[0,.85,-2.35],72),
 photo('Floating basin and mirror portrait',[.60,1.55,-.50],[-.94,1.3,-1.05],70),
 photo('Kitchen full-height portrait',[1.36,1.70,2.7],[4.3,1.5,1.3],70,'clear'),
 photo('Kitchen in atmospheric fog',[2.40,1.72,4.2],[4.3,1.5,1.3],68,'fog'),
 photo('Tap and white worktop portrait',[2.95,1.68,2.25],[4.28,1.12,.9],67),
 photo('Concentric ceiling sculptural portrait',[-1.55,1.48,3.15],[-2.75,3.35,.34],78),
 photo('Ceiling rings from the alcove',[-1.61,1.53,-2.35],[-2.7,3.35,.25],78),
 photo('Glassy helix pink nightlight portrait',[-2.48,1.12,1.1],[-1.66,.96,-.4],44),
 photo('Bedside cabinet and soft light',[-2.75,1.25,.93],[-1.66,.85,-.4],58),
 photo('City window vertical from the bed',[-5.2,2.38,-6.25],[-5.525,1.0,-30],66),
 photo('Rainy neon street vertical outlook',[-5.6,2.40,-8.95],[-5.6,-3.2,-43],55),
 photo('Snow and neon towers vertical',[-6.4,2.25,-8.55],[-5.6,.7,-41],62,'snow'),
 photo('Storm bridges and flowing holograms',[-4.75,2.4,-8.8],[-4.2,2.1,-46],46,'storm'),
 photo('Blue ghost face and fine swept hair',[-1.71,4.37,-38.55],[-1.805,4.38,-41.46],55),
 photo('Pink ghost face and flowing gown',[-8.94,3.50,-52.5],[-8.825,3.50,-55.46],55),
];
assert.equal(wide.length,50);assert.equal(phone.length,50);
const shots=formats.flatMap((format,k)=>(k?phone:wide).map((s,i)=>({...s,format,number:k*50+i+1,time:24+i*.37+k*.19})));
assert.equal(new Set(shots.map(s=>JSON.stringify(s.position))).size,100,'100 distinct camera positions');
const manifestPath=join(out,'manifest.json');
await mkdir(out,{recursive:true});
let records=[];
if(resume){try{records=JSON.parse(await readFile(manifestPath,'utf8')).pictures??[];}catch(e){if(e.code!=='ENOENT')throw e;}}
else assert.equal((await readdir(out,{recursive:true})).filter(f=>/\.png$/i.test(f)).length,0,'Fresh export requires an empty staging folder');
const sha=data=>createHash('sha256').update(data).digest('hex');
const sources=['src/apartments/osCityGhostFace.ts','src/apartments/osCityHolograms.ts','src/apartments/osCityApartment.ts','src/apartments/osCityFurnishings.ts','src/apartments/osCityDuvet.ts','src/apartments/osCityTV.ts','public/apartments/holograms/reference-portrait-atlas-v11.png'];
const sourceHashes=Object.fromEntries(await Promise.all(sources.map(async p=>[p,sha(await readFile(p))])));
const previous=resume?JSON.parse(await readFile(manifestPath,'utf8')):null;
if(previous)assert.deepEqual(previous.sourceHashes,sourceHashes,'Do not mix different scene revisions');
const errors=[],browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const hook=`
 window.__apartmentPhotography=spec=>{
  renderer.setAnimationLoop(null);keys.clear();
  const weatherChanged=room.environment&&room.environment.getSnapshot().mode!==spec.weather;
  if(weatherChanged)room.environment.setWeather(spec.weather);
  goTo(new THREE.Vector3(...spec.position),new THREE.Vector3(...spec.target),'photograph',spec.title);
  camera.fov=spec.fov;camera.updateProjectionMatrix();elapsed=spec.time;room.update(elapsed);
  if(weatherChanged)rendering.refreshEnvironment();
  renderer.shadowMap.needsUpdate=true;rendering.render();rendering.render();
  return {position:camera.position.toArray(),target:spec.target,fov:camera.fov,aspect:camera.aspect,weather:room.environment?.getSnapshot(),canvas:[canvas.width,canvas.height],time:elapsed};
 };
`;
async function saveManifest(){await writeFile(manifestPath,JSON.stringify({title:"O's City Apartment",hierarchy:['North City',"O's Apartment"],sceneRevision:12,expectedPictures:100,format:'PNG',nativeRender:true,upscaled:false,interfaceHidden:true,formats,capturedAt:new Date().toISOString(),source:base+'/room.html?id=os-city-apartment',sourceHashes,pictures:[...records].sort((a,b)=>a.number-b.number),errors},null,2)+'\n');}
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function gallery(){
 const sections=formats.map(f=>`<section id="${f.id}"><h2>${f.label}</h2><div class="photos ${f.id}">${records.filter(s=>s.format===f.id).sort((a,b)=>a.number-b.number).map(s=>`<a class="photo" href="${encodeURI(s.filename)}"><img loading="lazy" src="${encodeURI(s.filename)}" alt="${escape(s.title)}"><span>${String(s.number).padStart(3,'0')} · ${escape(s.title)}<small>${s.weather} · ${s.resolution.join(' × ')}</small></span></a>`).join('\n')}</div></section>`).join('');
 return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>O's Apartment — 100 new snapshots</title><style>*{box-sizing:border-box}body{margin:0;background:#eef1f5;color:#223448;font:15px system-ui,sans-serif}header,section{padding:24px 3vw}h1{font-size:32px;margin:8px 0}p,small{color:#526578}nav a{display:inline-block;margin:8px 18px 0 0;color:#24495d}.photos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.phone{grid-template-columns:repeat(5,minmax(0,1fr))}.photo{display:block;color:inherit;text-decoration:none;background:white;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px #132b4512}.photo img{display:block;width:100%;aspect-ratio:64/27;object-fit:contain}.phone img{aspect-ratio:9/16}.photo span{display:block;padding:12px 14px;font-size:13px}small{display:block;margin-top:6px}@media(max-width:1000px){.phone{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:650px){.photos{grid-template-columns:1fr}.phone{grid-template-columns:repeat(2,minmax(0,1fr))}}</style><header><p>Snapshots / North City / O's Apartment</p><h1>O's City Apartment</h1><p>100 new perspectives · 50 ultrawide + 50 vertical phone · Native high-resolution PNG · Current room features and six weather modes.</p><nav><a href="#ultrawide">Ultrawide views</a><a href="#phone">Vertical phone views</a></nav><p>Click any image to open its full-resolution original.</p></header>${sections}</html>`;
}
try{
 for(const format of formats){
  const pending=shots.filter(s=>s.format.id===format.id&&(!only.size||only.has(s.number))&&!records.some(r=>r.number===s.number));
  if(!pending.length)continue;
  await mkdir(join(out,format.folder),{recursive:true});
  const context=await browser.newContext({viewport:{width:format.width,height:format.height},deviceScaleFactor:1});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/src/apartments/room.ts*',async route=>{const response=await route.fetch(),body=await response.text();assert.ok(body.includes('loading.hidden = true;'),'known renderer initialization marker');await route.fulfill({response,body:body.replace('loading.hidden = true;',hook+'\nloading.hidden = true;')});});
  await page.goto(base+'/room.html?id=os-city-apartment&qa=1',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>typeof window.__apartmentPhotography==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});
  await page.addStyleTag({content:'body *{visibility:hidden!important}#apartment-viewport,#apartment-viewport canvas{visibility:visible!important}#apartment-viewport canvas{outline:none!important}'});
  for(const spec of pending){
   const filename=format.folder+'/'+String(spec.number).padStart(3,'0')+'-'+spec.title.toLowerCase().replaceAll(/[^a-z0-9]+/g,'-').replace(/-$/,'')+'.png';
   const {format:unused,...cameraSpec}=spec;
   const actual=await page.evaluate(s=>window.__apartmentPhotography(s),cameraSpec);
   assert.deepEqual(actual.canvas,[format.width,format.height],'native render dimensions');
   const buffer=await page.locator('#apartment-viewport canvas').screenshot({path:join(out,filename),type:'png',timeout:120000});
   assert.deepEqual([buffer.readUInt32BE(16),buffer.readUInt32BE(20)],[format.width,format.height],'PNG dimensions');
   records.push({number:spec.number,filename,format:format.id,resolution:[format.width,format.height],...cameraSpec,actual,bytes:buffer.length,sha256:sha(buffer)});
   await saveManifest();await writeFile(join(out,'index.html'),gallery());console.log('SAVED '+records.length+'/100 '+filename+' '+buffer.length+' bytes');
  }
  await context.close();
 }
 assert.deepEqual(errors,[],'browser errors');
 const allFiles=(await readdir(out,{recursive:true})).filter(f=>/\.png$/i.test(f));assert.equal(allFiles.length,records.length,'no unlisted pictures');
 for(const r of records){const data=await readFile(join(out,r.filename));assert.equal(sha(data),r.sha256);assert.deepEqual([data.readUInt32BE(16),data.readUInt32BE(20)],r.resolution);assert.ok((await stat(join(out,r.filename))).size>200000);}
 assert.equal(new Set(records.map(r=>r.sha256)).size,records.length,'different picture bytes');
 assert.equal(new Set(records.map(r=>JSON.stringify(r.position))).size,records.length,'distinct camera positions');
 if(!only.size){assert.equal(records.length,100);for(const f of formats)assert.equal(records.filter(r=>r.format===f.id).length,50);}
 for(const [p,h]of Object.entries(sourceHashes))assert.equal(sha(await readFile(p)),h,'Scene source remained unchanged during capture');
 await saveManifest();await writeFile(join(out,'index.html'),gallery());
 console.log(JSON.stringify({complete:records.length===100,pictures:records.length,formats,bytes:records.reduce((n,s)=>n+s.bytes,0),errors,out}));
}finally{await browser.close();}
