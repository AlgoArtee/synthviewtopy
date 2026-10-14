import assert from 'node:assert/strict';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const output=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-32/final-1';await mkdir(output,{recursive:true});assert.equal((await readdir(output)).length,0);
const report={checks:[],errors:[],screenshots:[],weatherProfiles:[],manualTimeAdvancement:false};
const check=(condition,description,evidence)=>{report.checks.push({passed:!!condition,description,evidence});if(!condition)console.error('FAIL '+description);};
const hashes=async()=>Object.fromEntries(await Promise.all((await readdir('src/apartments')).filter(n=>/^osCity.*\.ts$/.test(n)||['room.ts','roomRendering.ts','roomCatalog.ts'].includes(n)).map(async n=>{const p='src/apartments/'+n;return[p,createHash('sha256').update(await readFile(p)).digest('hex')];})));
const sourceHashes=await hashes(),browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});let page;
try{
 page=await browser.newPage({viewport:{width:951,height:892}});await page.addInitScript(()=>{window.__qaObjects=[];window.__THREE_DEVTOOLS__={dispatchEvent:e=>{if(e.type==='observe')window.__qaObjects.push(e.detail);}};});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:300000});console.log('Through railway ready');
 await page.evaluate(()=>{window.__qaScene=window.__qaObjects.find(o=>o.isScene&&o.userData.apartment?.northCity);const previous=window.__qaScene.onBeforeRender;window.__qaScene.onBeforeRender=function(renderer,scene,camera,...args){previous.call(this,renderer,scene,camera,...args);if(camera.userData.cityProjection)window.__qaCamera=camera;};});await page.waitForFunction(()=>window.__qaCamera);
 const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text())),settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))),show=async()=>{if((await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();},hide=async()=>{if(!(await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();};
 const choose=async(id,value)=>{await show();await page.locator(id).selectOption(value);await hide();await settle();},view=async id=>{await show();if(!(await state()).menuOpen)await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${id}"]`).click();await hide();await settle();},capture=async name=>{await page.screenshot({path:`${output}/${name}.png`});report.screenshots.push(name+'.png');};
 report.initial=await state();check(report.initial.page==='0.8.0'&&(await page.title()).startsWith('0.8.0'),'Level name and document title are 0.8.0');check(report.initial.northCity.residenceElevation===24&&report.initial.northCity.floorAbovePlaza===38,'Residence rises 24m to 38m above plaza');
 check(report.initial.balconyExterior.life.transit.routeClosed===false,'Native trains use the open through line');
 check(report.initial.balconyExterior.transitGuideway.closed===false,'Actual guideway has no return loop');
 check(report.initial.balconyExterior.neonClub.groundFloorEnclosed,'Club exposes its complete side/rear enclosure');
 report.plazaGeometry=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js'),s=window.__qaScene,d=s.getObjectByName('Balcony · rain-soaked Circuit Market and layered east skyline');s.updateMatrixWorld(true);
  const p=d.userData.plaza,m=d.userData.dataMall,slab=d.getObjectByName('Circuit Market · rain-polished slab plaza');slab.geometry.computeBoundingBox();
  const size=slab.geometry.boundingBox.getSize(new THREE.Vector3());
  const eye={x:3.8,z:-5},mallLeft=(m.center[2]-m.width/2-eye.z)/(m.center[0]-m.depth/2-eye.x);
  const leftBuildings=p.leftBuildings.map(b=>{
    const corners=[-1,1].flatMap(x=>[-1,1].map(z=>[b.center[0]+x*(b.width/2+.35),b.center[2]+z*(b.depth/2+2.3)]));
    return{name:b.name,maxHorizontalAngle:Math.max(...corners.map(([x,z])=>(z-eye.z)/(x-eye.x))),mallLeft,fullyLeft:corners.every(([x,z])=>(z-eye.z)/(x-eye.x)<mallLeft)};
  });
  const packets=d.getObjectByName('Circuit traces · travelling data packets'),glows=d.getObjectByName('Circuit traces · moving light pools');
  const colors=o=>{const c=new THREE.Color(),values=new Set();for(let n=0;n<o.count;n++){o.getColorAt(n,c);values.add('#'+c.getHexString());}return[...values];};
  const traceMaterials=[];d.traverse(o=>{if(o.material?.name.includes('circuitry'))traceMaterials.push({name:o.material.name,color:'#'+o.material.color.getHexString()});});
  const ray=new THREE.Raycaster();const clearances=[];
  for(const z of [-25.75,-20,-10,0,10,20,25.75]){
    const origin=new THREE.Vector3(3.8,1.65,-5),target=new THREE.Vector3(m.center[0]-7.2,-12,m.center[2]+z).applyMatrix4(d.matrixWorld);
    ray.set(origin,target.clone().sub(origin).normalize());ray.far=origin.distanceTo(target)-.1;
    const hits=ray.intersectObjects(d.children,true).filter(h=>!h.object.material?.transparent&&h.object.isMesh);
    clearances.push({z,obstructions:hits.slice(0,3).map(h=>({name:h.object.name,point:h.point.toArray()}))});
  }
  return{plaza:p,slabWidth:size.x,slabDepth:size.z,leftBuildings,packetColors:colors(packets),glowColors:colors(glows),traceMaterials,mallGroundSightlines:clearances};
 });
 const pg=report.plazaGeometry;
 check(Math.abs(pg.slabWidth-79*1.3)<.001&&Math.abs(pg.slabDepth-88*1.3)<.001,'Actual slab grows 30% on both horizontal axes',pg);
 check(pg.leftBuildings.every(b=>b.fullyLeft),'Both relocated buildings clear the mall frontage in the balcony sightline',pg.leftBuildings);
 check(pg.packetColors.length===4&&pg.packetColors.every(c=>pg.plaza.circuitColors.includes(c))&&pg.glowColors.every(c=>pg.plaza.circuitColors.includes(c)),'Actual moving packet and glow instances use only the four blue/pink shades');
 check(pg.traceMaterials.length===4&&pg.traceMaterials.every(m=>pg.plaza.circuitColors.includes(m.color)),'Actual static circuit meshes use only blue and pink');
 check(report.initial.balconyExterior.dataMall.center[2]===report.initial.balconyExterior.dataMall.plazaChipCenter[2],'Mall and main chip share their physical centreline');
 const geometry=await page.evaluate(()=>{const s=window.__qaScene,d=s.getObjectByName('Balcony · rain-soaked Circuit Market and layered east skyline'),n=s.getObjectByName('North City · behind the island');s.updateMatrixWorld(true);return{districtY:d.matrixWorld.elements[13],northY:n.matrixWorld.elements[13],mallRoofWorldY:d.userData.dataMall.roofY+d.matrixWorld.elements[13],balconyFloorY:0,lights:s.children.filter(o=>o.isLight).length};});report.geometry=geometry;check(geometry.districtY===-24&&geometry.northY===-24,'Both complete city districts retain matching vertical placement');check(geometry.mallRoofWorldY<0,'Balcony floor is above mall roof');
 await choose('#city-time-select','night');await choose('#city-weather-select','clear');await view('balcony');await capture('raised-balcony-night');
 report.alignment=await page.evaluate(async()=>{const THREE=await import('/node_modules/three/build/three.module.js'),d=window.__qaScene.getObjectByName('Balcony · rain-soaked Circuit Market and layered east skyline'),c=window.__qaCamera,m=d.userData.dataMall;window.__qaScene.updateMatrixWorld(true);const project=p=>new THREE.Vector3(...p).applyMatrix4(d.matrixWorld).project(c).toArray();return{mall:project([m.center[0],m.roofY,m.center[2]]),chip:project(m.plazaChipCenter),eye:c.position.toArray(),correction:c.userData.cityProjection.correction};});check(Math.abs(report.alignment.mall[0]-report.alignment.chip[0])<1e-7,'Mall and chip project onto the same horizontal centre');check(report.alignment.correction>.99,'Main panorama retains upright architecture');
 for(const [id,name] of [['balcony-left','raised-north-night'],['balcony-right','raised-south-night'],['balcony-transit','raised-transit'],['balcony-plaza','chip-alignment']]){await view(id);await capture(name);}
 for(const time of ['morning','day'])for(const weather of ['clear','rain']){
  await choose('#city-time-select',time);await choose('#city-weather-select',weather);await view('balcony-plaza');await capture('plaza-'+time+'-'+weather);
 }
 await choose('#city-time-select','day');await choose('#city-weather-select','clear');await view('balcony-left');await capture('club-and-north-rail-day');await view('balcony-right');await capture('south-rail-day');
 await page.setViewportSize({width:1600,height:1000});await view('balcony');await capture('through-line-wide-day');await choose('#city-time-select','night');await capture('through-line-wide-night');await page.setViewportSize({width:951,height:892});
 await view('balcony');const a=await state();await page.keyboard.down('KeyA');await page.waitForTimeout(350);await page.keyboard.up('KeyA');await settle();const b=await state();report.walk={before:a.camera,after:b.camera,mode:b.navigation.mode,floor:b.floorHeight};check(b.navigation.mode==='walking'&&b.floorHeight===0,'Higher residence remains on the walkable balcony floor');
 const frames=[];for(let i=0;i<2;i++){frames.push(await state());if(i===0)await page.waitForTimeout(1500);}check(JSON.stringify(frames[0].balconyExterior.life.trainPositions)!==JSON.stringify(frames[1].balconyExterior.life.trainPositions),'Trains retain native movement after whole-district translation');
 for(const [time,weather,id,name] of [['day','clear','balcony','raised-day-clear'],['day','rain','balcony','raised-day-rain'],['day','storm','balcony','raised-day-storm'],['night','fog','balcony-left','raised-night-fog'],['day','snow','balcony-left','raised-day-snow'],['morning','academic-autumn','balcony-right','raised-academia-morning']]){
  await choose('#city-time-select',time);await choose('#city-weather-select',weather);await view(id);await capture(name);const s=await state(),volumes=s.balconyExterior.weather.volumes,offset=s.northCity.cityOffsetY;report.weatherProfiles.push({time,weather,near:volumes[0],north:s.northWeather,offset});check(volumes.every(v=>v.minY+offset<0&&v.maxY+offset>3.5),'Weather spans plaza ground and raised balcony: '+time+'/'+weather);
 }
 await choose('#city-time-select','night');await choose('#city-weather-select','clear');await view('panorama');await capture('raised-north-window');await view('balcony-ceiling');await capture('raised-ceiling');await view('balcony-return');await capture('raised-return');
 await view('balcony');await page.setViewportSize({width:390,height:844});await settle();await capture('raised-mobile');check((await state()).look.verticalCorrection>.99,'Mobile high panorama remains upright');await page.setViewportSize({width:951,height:892});
 await choose('#city-time-select','day');await choose('#city-weather-select','rain');await show();await page.locator('#room-menu-toggle').click();await page.locator('#room-reset').click();await hide();await settle();await capture('interior-return');report.final=await state();check(report.final.floorHeight===0&&report.final.northCity.level==='0.8.0','Indoor return retains apartment floor and level name');
 const directory=await browser.newPage();await directory.goto('http://127.0.0.1:5178/north-city.html');check((await directory.locator('#city-apartment-name').innerText())==='0.8.0','Directory uses the renamed level');check((await directory.locator('#city-apartment-link').getAttribute('href'))==='/room.html?id=os-city-apartment','Stable room URL is preserved');await directory.close();
}catch(error){report.failure=error.stack??String(error);if(page)await page.screenshot({path:`${output}/failure.png`,timeout:10000}).catch(()=>{});}
finally{const after=await hashes();report.sourceHashes=sourceHashes;report.changedSources=Object.keys(sourceHashes).filter(p=>sourceHashes[p]!==after[p]);check(!report.changedSources.length,'Source stayed frozen');check(!report.errors.length,'No browser/WebGL errors',report.errors);await writeFile(`${output}/results.json`,JSON.stringify(report,null,2));await browser.close();}
assert.equal(report.failure,undefined,report.failure);assert.ok(report.checks.every(c=>c.passed),'Inspect raised-level failures');console.log(JSON.stringify({pass:true,checks:report.checks.length,screenshots:report.screenshots.length,output}));
