import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.env.BASE_URL??'http://127.0.0.1:5178',out=process.env.LIBRARY_OUTPUT??'test-artifacts/liminette-library/validation';
const path='/apartments/assets/liminette-ivory-library.glb';await mkdir(out,{recursive:true});
const asset=await readFile(`public${path}`),manifest=JSON.parse(asset.subarray(20,20+asset.readUInt32LE(12)).toString());
const primitives=manifest.meshes.flatMap(m=>m.primitives),triangles=primitives.reduce((s,p)=>s+manifest.accessors[p.indices??p.attributes.POSITION].count/3,0);
assert(triangles<=450000&&primitives.length<=32&&asset.length<30*1024*1024);
assert(manifest.images.length>=8&&manifest.images.every(i=>i.bufferView!==undefined&&!i.uri));assert(!manifest.cameras?.length&&!manifest.extensions?.KHR_lights_punctual);
const layout=JSON.parse(manifest.nodes.find(n=>n.name==='LIBRARY__Liminette').extras.layout_json);assert.equal(layout.sofaLobes,6);assert.equal(layout.valves.upper,12);assert.equal(layout.valves.lower,6);
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1600,height:1000}}),page=await context.newPage();const results={asset:{triangles,primitives:primitives.length,bytes:asset.length},checks:['embedded Blender asset'],errors:[],views:[]};
page.on('pageerror',e=>results.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')results.errors.push(m.text())});
const read=p=>p.evaluate(()=>JSON.parse(window.render_game_to_text()));
const ready=p=>p.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});
const view=async id=>{await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${id}"]`).click();await page.evaluate(()=>window.advanceTime(100))};
try{
  await page.goto(`${base}/liminette.html`);await ready(page);const first=await read(page);results.initial=first;
  assert.equal(first.referenceLibrary.state,'loaded');assert.equal(first.referenceLibrary.id,'liminette-ivory-library');assert.equal(first.referenceLibrary.triangles,triangles);
  assert.equal(first.referenceDesk.state,'loaded');assert.equal(first.floorArea,285);assert.equal(first.referenceLibrary.realWindowApertures,1);
  assert.deepEqual(first.referenceLibrary.sofa.dimensions,[4.66,2.22,1.32]);assert(first.referenceLibrary.sofa.viewingDistance>=4);
  assert(first.referenceLibrary.blanket.width>=2.9&&first.referenceLibrary.blanket.drapedLength>=4);
  assert.equal(first.referenceLibrary.windowFinish,'walnut and brass');assert.equal(first.referenceLibrary.ceilingFinish,'ivory');
  assert(first.referenceLibrary.features.includes('draped cable-knit wool throw'));results.checks.push('readiness, identity and preserved desks');
  await page.screenshot({path:`${out}/entrance.png`});
  for(const {id} of first.viewpoints){
    await view(id);const state=await read(page);assert.equal(state.view,id);await page.screenshot({path:`${out}/${id}.png`});results.views.push({id,position:state.position});
    for(const key of ['a','d','s']){
      await view(id);const before=await read(page);await page.keyboard.down(key);await page.evaluate(()=>window.advanceTime(250));await page.keyboard.up(key);
      const after=await read(page);assert(Math.hypot(after.position[0]-before.position[0],after.position[2]-before.position[2])>.10,`${id} requires a clear ${key} departure`);
    }
  }
  results.checks.push('all viewpoints and departure directions');
  // Reach the TV/sofa aisle, inspect the larger seat, then approach its front.
  await view('library-detail');
  const aim=async(yaw,pitch=0)=>{
    const previous=(await read(page)).look;
    await page.mouse.move(800,500);await page.mouse.down();
    await page.mouse.move(800+(previous.yaw-yaw)/.003,500+(previous.pitch-pitch)/.003,{steps:8});await page.mouse.up();
  };
  await aim(0);await page.keyboard.down('w');await page.evaluate(()=>window.advanceTime(940));await page.keyboard.up('w');
  const aisle=await read(page);assert(aisle.position[2]<-4.7&&aisle.position[2]>-5.0,'Clear central viewing aisle');
  await aim(Math.PI/2);await page.keyboard.down('w');await page.evaluate(()=>window.advanceTime(250));await page.keyboard.up('w');
  await aim(-Math.PI/2,-.32);await page.mouse.wheel(0,900);await page.evaluate(()=>window.advanceTime(100));
  await page.screenshot({path:`${out}/sofa-bed-front.png`});
  await page.keyboard.down('w');await page.evaluate(()=>window.advanceTime(1500));await page.keyboard.up('w');const sofaStop=await read(page);
  await page.keyboard.down('w');await page.evaluate(()=>window.advanceTime(500));await page.keyboard.up('w');const sofaStoppedAgain=await read(page);
  assert(Math.abs(sofaStop.position[0]+7.41)<.10,'Expanded sofa collider matches its relocated front');
  assert(Math.abs(sofaStop.position[0]-sofaStoppedAgain.position[0])<.01,'Sustained walking cannot enter the sofa-bed');
  results.checks.push('clear viewing aisle and relocated sofa collision');
  await view('library-detail');
  // Face the wall squarely. Oblique walking correctly slides along colliders.
  const heading=(await read(page)).look.yaw;
  await page.mouse.move(800,500);await page.mouse.down();await page.mouse.move(800+(heading-Math.PI/2)/.003,500,{steps:8});await page.mouse.up();
  await page.keyboard.down('w');await page.evaluate(()=>window.advanceTime(8000));await page.keyboard.up('w');const stop=await read(page);
  await page.keyboard.down('w');await page.evaluate(()=>window.advanceTime(500));await page.keyboard.up('w');const stoppedAgain=await read(page);
  assert(Math.abs(stoppedAgain.position[0]-stop.position[0])<.01,'Ladder collider stops sustained forward walking');
  assert(Math.abs(stop.position[0]+9.365)<.10,`Imported ladder footprint stops the viewer before its surface: ${stop.position}`);results.checks.push('library furniture collision');
  if(process.env.LIBRARY_SKIP_MODULE_PROBES!=='1'){
    results.lifecycle=await page.evaluate(async()=>{
      const {createReferenceLibrary}=await import('/src/apartments/referenceLibrary.ts');const room=createReferenceLibrary();await room.ready;
      const counts={geometry:0,material:0,texture:0},disposed={geometry:0,material:0,texture:0};const mats=new Set(),maps=new Set();
      room.group.traverse(o=>{if(o.isMesh){counts.geometry++;o.geometry.addEventListener('dispose',()=>disposed.geometry++);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m)}});
      for(const m of mats){counts.material++;m.addEventListener('dispose',()=>disposed.material++);Object.values(m).forEach(v=>{if(v?.isTexture)maps.add(v)})}
      for(const m of maps){counts.texture++;m.addEventListener('dispose',()=>disposed.texture++)}
      room.dispose();room.dispose();const late=createReferenceLibrary();late.dispose();await late.ready;
      return {counts,disposed,loadedChildren:room.group.children.length,lateChildren:late.group.children.length,lateState:late.metadata.state};
    });
    assert.deepEqual(results.lifecycle.counts,results.lifecycle.disposed);assert.equal(results.lifecycle.loadedChildren,0);assert.equal(results.lifecycle.lateChildren,0);assert.equal(results.lifecycle.lateState,'disposed');results.checks.push('exact-once resource disposal and late load');
  }
  await view('library');await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);await page.screenshot({path:`${out}/mobile.png`});assert.equal((await read(page)).referenceLibrary.state,'loaded');results.checks.push('mobile library view');
  const failed=await context.newPage();await failed.route(`**${path}`,r=>r.fulfill({status:404,body:'Missing library fixture'}));await failed.goto(`${base}/liminette.html`);
  await failed.getByText('The room could not finish loading.',{exact:false}).waitFor({timeout:30000});assert.equal(await failed.evaluate(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready),false);assert.equal(await failed.locator('#apartment-viewport canvas').count(),0);
  await failed.screenshot({path:`${out}/missing-glb.png`});await failed.close();results.checks.push('missing library fallback');
  const pending=await context.newPage();let hit;const arrived=new Promise(r=>hit=r);
  await pending.route(`**${path}`,async r=>{hit();await new Promise(resolve=>setTimeout(resolve,800));await r.fulfill({body:asset,contentType:'model/gltf-binary'}).catch(()=>{})});
  await pending.goto(`${base}/liminette.html`,{waitUntil:'domcontentloaded'});await arrived;
  await pending.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));await pending.waitForTimeout(1400);assert.equal(await pending.evaluate(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready),false);await pending.close();results.checks.push('departure during library loading');
  assert.deepEqual(results.errors,[]);console.log(`Ivory library passed ${results.checks.length} check groups; ${triangles} triangles, ${primitives.length} primitives.`);
}catch(e){results.failure=e.stack;await page.screenshot({path:`${out}/failure.png`}).catch(()=>{});console.error(e);process.exitCode=1}
finally{await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close()}
