import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

const output=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-43/native';await mkdir(output,{recursive:true});
const sources=['src/apartments/osCityApartment.ts','src/apartments/osCityFurnishings.ts','src/apartments/osCityFridge.ts'];
const hashes=async()=>Object.fromEntries(await Promise.all(sources.map(async path=>[path,createHash('sha256').update(await readFile(path)).digest('hex')])));
const report={checks:[],errors:[],captures:[],sources:await hashes()};
const check=(passed,name,evidence)=>report.checks.push({passed:!!passed,name,evidence});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});let page;
try {
  page=await browser.newPage({viewport:{width:1440,height:1000}});
  // Expose the existing room only inside this test browser; never instantiate a second scene.
  await page.route(/\/src\/apartments\/room\.ts(?:\?.*)?$/,async route=>{
    const response=await route.fetch(),source=await response.text();
    assert.ok(source.includes('await room.ready;'));
    console.log('Attached native room inspection hook: '+route.request().url());
    await route.fulfill({response,body:source.replace('await room.ready;','await room.ready; window.__qaRoom = room;')});
  });
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
  await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment',{waitUntil:'domcontentloaded',timeout:120000});
  console.log('Loading actual apartment');
  await page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:360000});
  console.log('Apartment ready');
  assert.ok(await page.evaluate(()=>!!window.__qaRoom),'Native room inspection hook attached');
  const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
  const show=async()=>{if((await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();};
  const hide=async()=>{if(!(await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();};
  const view=async id=>{await show();if(!(await state()).menuOpen)await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${id}"]`).click();await hide();};
  const shot=async name=>{await page.waitForTimeout(900);await page.screenshot({path:`${output}/${name}.png`});report.captures.push({name,state:await state()});console.log('Captured '+name);};
  for(const time of ['day','night']){
    await show();await page.locator('#city-time-select').selectOption(time);
    for(const id of ['study','kitchen']){await view(id);await shot(`${id}-${time}`);}
  }
  const spatial=await page.evaluate(async()=>{
    const THREE=await import('/node_modules/three/build/three.module.js'),room=window.__qaRoom;
    const scene=room.scene;scene.updateMatrixWorld(true);
    const bounds=o=>{const b=new THREE.Box3().setFromObject(o);return{min:b.min.toArray(),max:b.max.toArray()};};
    const workstation=scene.getObjectByName('Southern living-room workstation');
    const panels=workstation.children.filter(o=>o.userData.wallProjection).map(o=>({name:o.name,...bounds(o),normal:new THREE.Vector3(0,0,1).transformDirection(o.matrixWorld).toArray()}));
    const fridge=scene.getObjectByName('Kitchen · tall pearl refrigerator'),fridgeBox=new THREE.Box3().setFromObject(fridge);
    const collider=room.colliders.find(b=>b.containsBox(fridgeBox));
    const step=(start,dir,n)=>{const p=new THREE.Vector3(...start);room.navigation.reset(p);for(let i=0;i<n;i++)room.navigation.step(p,new THREE.Vector3(...dir),1/60,false);return p.toArray();};
    const approach=step([3,1.65,4.86],[1,0,0],120),aisle=step([3.3,1.65,1],[0,0,1],120);
    return{panels,wall:bounds(scene.getObjectByName('South desk wall')),desk:bounds(scene.getObjectByName('Desk · thin porcelain working surface')),fridge:bounds(fridge),counter:bounds(scene.getObjectByName('Quartz countertop with sink aperture')),collider:collider?{min:collider.min.toArray(),max:collider.max.toArray()}:null,approach,aisle};
  });
  report.spatial=spatial;const {panels,wall,desk,fridge,counter,collider,approach,aisle}=spatial;
  check(panels.length===8,'Eight computer projections are present in the actual room');
  check(panels.every(p=>wall.min[2]-p.max[2]>.005&&wall.min[2]-p.min[2]<.05&&p.normal[2]<-.999),'All projections face the room within 5 cm of the south wall',panels.map(p=>wall.min[2]-p.max[2]));
  check(panels.every(p=>p.min[1]>desk.max[1]&&p.max[1]<3.5),'Panels clear the desktop and ceiling');
  check(panels.every((a,i)=>panels.slice(i+1).every(b=>a.max[0]<=b.min[0]||b.max[0]<=a.min[0]||a.max[1]<=b.min[1]||b.max[1]<=a.min[1])),'Computer displays do not overlap one another');
  check(fridge.max[1]>2&&Math.abs(fridge.min[1])<.001,'Tall fridge rests on the floor',fridge);
  check(fridge.max[0]<4.8&&fridge.min[2]-counter.max[2]>.10&&fridge.max[2]<6.15,'Fridge clears the east wall, countertop and south wall',{counterGap:fridge.min[2]-counter.max[2],eastGap:4.8-fridge.max[0]});
  check(!!collider,'Navigation collider contains the complete fridge including handles',collider);
  check(approach[0]>3.60&&approach[0]<fridge.min[0]-.22,'Walking toward fridge stops before its handles',approach);
  check(aisle[2]>5.6&&Math.abs(aisle[0]-3.3)<.001,'Kitchen aisle remains walkable past fridge',aisle);
  report.final=await state();
}catch(error){report.failure=error.stack;if(page)await page.screenshot({path:output+'/failure.png',timeout:10000}).catch(()=>{});}
finally{
  check(!report.errors.length,'No browser or WebGL errors',report.errors);
  check(JSON.stringify(report.sources)===JSON.stringify(await hashes()),'Sources remained unchanged during native verification');
  await writeFile(output+'/results.json',JSON.stringify(report,null,2));await browser.close();
}
console.log(JSON.stringify({checks:report.checks,captures:report.captures.length,failure:report.failure},null,2));
assert.equal(report.failure,undefined);assert.ok(report.checks.every(c=>c.passed));
