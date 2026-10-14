import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base=(process.env.BASE_URL??'http://127.0.0.1:5178').replace(/\/$/,'');
const output=process.env.POOL_OUTPUT??'test-artifacts/lux-umbrarum-pool';
const assetPath='/apartments/assets/lux-umbrarum-pool-commons.glb';
const id='lux-umbrarum-pool-commons',url=`${base}/room.html?id=${id}`;
await mkdir(output,{recursive:true});
const asset=await readFile(`public${assetPath}`);
const gltf=JSON.parse(asset.subarray(20,20+asset.readUInt32LE(12)).toString());
const primitives=gltf.meshes.flatMap(mesh=>mesh.primitives);
const triangles=primitives.reduce((n,p)=>n+gltf.accessors[p.indices].count/3,0);
assert(triangles<=750000&&primitives.length<=40&&asset.length<40*1024*1024);
assert(gltf.images.length>=10&&gltf.images.every(image=>image.bufferView!==undefined&&!image.uri));
assert(gltf.buffers.every(buffer=>!buffer.uri)); assert(!gltf.cameras?.length&&!gltf.extensions?.KHR_lights_punctual);
const layout=JSON.parse(gltf.nodes.find(node=>node.name==='POOL__Lux_Umbrarum').extras.layout_json);
assert.equal(layout.id,id); assert.equal(layout.openingSchedule.filter(o=>o.type==='window').length,3);
assert.equal(layout.openingSchedule.filter(o=>o.type==='door').length,1); assert.equal(layout.pool.depth,1.6);
assert.deepEqual(layout.dimensions,[21.6,16.6,6.4]); assert.equal(layout.pool.maxX-layout.pool.minX,11.52);
assert.equal(layout.seating.filter(s=>s.kind==='canvas-lounger').length,7);
assert.equal(layout.seating.filter(s=>s.kind==='suspended-oval-pod').length,2);
assert.equal(layout.ceilingArches,0);
assert.deepEqual(layout.instruments.map(i=>[i.id,i.position,i.unit]),[
  ['time','upper','HH:MM:SS'],['pressure','lower-left','hPa'],['oxygen','lower-middle','vol.%'],['carbon-dioxide','lower-right','ppm']
]);
assert.equal(gltf.nodes.filter(n=>n.name?.startsWith('POOL__clock_')&&n.name?.endsWith('_hand')).length,3);
for(const seat of layout.seating) {
  const [x,,z]=seat.position,[fx,,fz]=seat.forward;
  assert((-x*fx-z*fz)/Math.hypot(x,z)>.999,'Each reclining seat must face the pool centre');
  if(seat.kind==='suspended-oval-pod') {
    assert(seat.length>seat.width*1.8); assert(seat.suspension.includes('above and below'));
  }
}
const results={asset:{bytes:asset.length,triangles,primitives:primitives.length,embeddedImages:gltf.images.length},checks:[],errors:[]};
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE??'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist','--disable-features=BackForwardCache']});
const context=await browser.newContext({viewport:{width:1600,height:900}});
const page=await context.newPage(); page.setDefaultTimeout(30000);
page.on('pageerror',error=>results.errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')results.errors.push(message.text())});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const waitRoom=()=>page.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});
const choose=async id=>{await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${id}"]`).click();await page.evaluate(()=>window.advanceTime(80));};
const walk=async (key,ms)=>{await page.keyboard.down(key);await page.evaluate(ms=>window.advanceTime(ms),ms);await page.keyboard.up(key);return state();};
async function walkTo(x,z) {
  let current=await state();const dx=x-current.position[0],dz=z-current.position[2];
  const desired=-Math.atan2(dx,-dz);
  const delta=Math.atan2(Math.sin(desired-current.look.yaw),Math.cos(desired-current.look.yaw));
  await page.mouse.move(800,450);await page.mouse.down();await page.mouse.move(800-delta/.003,450,{steps:8});await page.mouse.up();
  await walk('w',Math.hypot(dx,dz)/2.6*1000);
  current=await state();assert(Math.hypot(current.position[0]-x,current.position[2]-z)<.11,`Deck route blocked at ${x},${z}: ${current.position}`);
  return current.position;
}
try {
  await page.goto(`${base}/apartments.html`);
  await page.locator('#pool-room-link img').evaluate(img=>img.decode());
  const directory=await state();assert.equal(directory.totalRooms,103);assert.equal(directory.sharedRooms,2);assert.equal(directory.additionalRooms,100);
  assert.equal(directory.category,'Interiors');assert.equal(await page.locator('#collection-count').innerText(),'103 student spaces to explore');
  await page.locator('#edit-pool').click();await page.locator('#metadata-room-name').fill('Pool Commons — test name');await page.locator('#metadata-save').click();
  assert.equal(await page.locator('#pool-room-name').innerText(),'Pool Commons — test name');
  await page.locator('#edit-pool').click();await page.locator('#metadata-reset').click();await page.locator('#metadata-save').click();
  await page.locator('#pool-room-link').click();await waitRoom();
  const initial=await state();results.initial=initial;assert.equal(initial.roomId,id);assert.equal(initial.communityRoom.state,'loaded');assert.equal(initial.communityRoom.triangles,triangles);
  assert(initial.roomSignature&&initial.exteriorSignature);assert.equal(initial.collisionCount,layout.colliders.length-1);
  assert.equal(initial.floorArea,358.56);assert.deepEqual(initial.communityRoom.seating,layout.seating);
  assert.equal(initial.communityRoom.ceilingArches,0);assert.match(initial.communityRoom.instruments[0].value,/^\d{2}:\d{2}:\d{2}$/);
  assert.deepEqual(initial.communityRoom.instruments.slice(1),layout.instruments.slice(1));
  await page.screenshot({path:`${output}/reference-view.png`});
  if(!process.env.POOL_OUTPUT) {
    const jpg=await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/jpeg',.9).split(',')[1]);
    await writeFile('public/apartments/pool-commons-preview.jpg',Buffer.from(jpg,'base64'));
  }
  results.checks.push('directory, two shared rooms, real preview, editable pool metadata and loaded asset');
  results.checks.push('expanded hall and pool, seven inward-facing loungers, two elongated double-helix suspension pods');
  await choose('water');await walk('w',2100);const swimmer=await state();
  assert.equal(swimmer.navigation.mode,'swimming');assert(swimmer.navigation.splashCount>0);assert.equal(swimmer.floorHeight,-1.52);
  results.checks.push('pool entry transitions from falling into swimming with an entry splash');
  for(const view of initial.viewpoints) {
    await choose(view.id);const current=await state();assert.equal(current.view,view.id);
    const [x,y,z]=current.position;assert.equal(y,1.65);
    assert(x>=current.bounds.minX+.24&&x<=current.bounds.maxX-.24&&z>=current.bounds.minZ+.24&&z<=current.bounds.maxZ-.24);
    for(const box of layout.colliders.slice(1)) {
      if(box.max[1]<.18||box.min[1]>1.8)continue;
      const nx=Math.max(box.min[0],Math.min(x,box.max[0])),nz=Math.max(box.min[2],Math.min(z,box.max[2]));
      assert((x-nx)**2+(z-nz)**2>=.24**2,`${view.id} is inside furniture`);
    }
    await page.screenshot({path:`${output}/view-${view.id}.png`});
  }
  results.checks.push('eleven viewpoints with body clearance and actual captures');
  await choose('water');
  results.route=[];
  for(const [x,z] of [[9.00,5.15],[9.00,-5.95],[2,-5.95],[2,-4.0],[-2,-4.0],[-2,-5.95],[-9.20,-5.95],[-9.20,5.15],[0,5.15]]) results.route.push(await walkTo(x,z));
  results.checks.push('continuous walking route around all four sides of the pool');
  const before=(await state()).communityRoom.waterTime;await page.evaluate(()=>window.advanceTime(600));
  const after=(await state()).communityRoom.waterTime;assert(after>before);
  await page.screenshot({path:`${output}/water-ripples.png`});results.checks.push('animated water updates without navigation or browser errors');
  await choose('hallway');const hall=await walk('w',900);assert(hall.position[2]>10.8);
  await walk('s',900);await page.locator('.room-back').click();await page.locator('#pool-room-link').waitFor();
  results.checks.push('open arrival corridor and return to student spaces');
  await page.locator('#pool-room-link').click();await waitRoom();await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.locator('#room-menu-toggle').click();assert(await page.locator('[data-viewpoint="machine"]').isVisible());await page.keyboard.press('Escape');
  assert(await page.locator('[data-walk="jump"]').count());assert(await page.locator('[data-walk="dive"]').count());
  await page.screenshot({path:`${output}/mobile.png`});results.checks.push('phone layout and accessible guide');
  if(process.env.POOL_SKIP_MODULE_PROBES!=='1') {
  results.lifecycle=await page.evaluate(async()=>{
    const {createPoolCommons}=await import('/src/apartments/poolCommons.ts');
    const room=createPoolCommons();await room.ready;
    const geometry=new Set(),material=new Set(),texture=new Set();
    room.scene.traverse(obj=>{if(!obj.isMesh)return;geometry.add(obj.geometry);for(const mat of Array.isArray(obj.material)?obj.material:[obj.material]){material.add(mat);for(const value of Object.values(mat))if(value?.isTexture)texture.add(value)}});
    const counts={geometry:0,material:0,texture:0};for(const [items,key] of [[geometry,'geometry'],[material,'material'],[texture,'texture']])for(const item of items)item.addEventListener('dispose',()=>counts[key]++);
    const metadata=room.scene.userData.apartment.communityRoom;room.dispose();room.dispose();room.update(10);
    const late=createPoolCommons();const lateMeta=late.scene.userData.apartment.communityRoom;late.dispose();await late.ready;
    return {expected:{geometry:geometry.size,material:material.size,texture:texture.size},counts,state:metadata.state,released:metadata.resourcesReleased,lateState:lateMeta.state,lateReleased:lateMeta.resourcesReleased,lateChildren:late.scene.children.length};
  });
  assert.deepEqual(results.lifecycle.counts,results.lifecycle.expected);assert.equal(results.lifecycle.state,'disposed');assert(results.lifecycle.released);
  assert.equal(results.lifecycle.lateState,'disposed');assert(results.lifecycle.lateReleased);assert.equal(results.lifecycle.lateChildren,0);
  results.checks.push('exact-once disposal and safe departure during loading');
  }
  const departing=await context.newPage();let arrived;const arrival=new Promise(resolve=>{arrived=resolve});
  await departing.route(`**${assetPath}`,async route=>{arrived();await new Promise(resolve=>setTimeout(resolve,600));await route.fulfill({body:asset,contentType:'model/gltf-binary'}).catch(()=>{});});
  await departing.goto(url,{waitUntil:'domcontentloaded'});await arrival;
  results.departure=await departing.evaluate(async()=>{
    window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}));await new Promise(resolve=>setTimeout(resolve,2000));
    return {ready:typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,guideButtons:document.querySelectorAll('[data-viewpoint]').length};
  });
  assert.equal(results.departure.ready,false);assert.equal(results.departure.guideButtons,0);await departing.close();
  results.checks.push('page departure prevents a delayed pool asset from attaching');
  const failed=await context.newPage();const expected=[];failed.on('console',msg=>{if(msg.type()==='error')expected.push(msg.text())});
  await failed.route(`**${assetPath}`,route=>route.fulfill({status:404,body:'Missing pool fixture'}));
  await failed.goto(url);await failed.getByText('The room could not finish loading.',{exact:false}).waitFor();assert.equal(await failed.locator('canvas').count(),0);
  await failed.screenshot({path:`${output}/missing-glb.png`});await failed.locator('#room-loading a').click();await failed.locator('#pool-room-link').waitFor();
  assert(expected.some(e=>e.includes('Unable to open student space')));await failed.close();results.checks.push('missing pool asset recovery');
  assert.deepEqual(results.errors,[]);console.log(`Pool commons passed ${results.checks.length} check groups; ${triangles} triangles, ${primitives.length} primitives.`);
}catch(error){results.failure=error.stack;console.error(error);await page.screenshot({path:`${output}/failure.png`}).catch(()=>{});process.exitCode=1;}
finally{await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));await browser.close();}
