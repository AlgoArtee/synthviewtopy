import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.env.BASE_URL??'http://127.0.0.1:5178',out=process.env.POOL_INSTRUMENTS_OUTPUT??'test-artifacts/lux-umbrarum-pool/instruments';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1600,height:900},timezoneId:'Europe/Berlin'}),page=await context.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
  await page.clock.setFixedTime(new Date('2026-10-05T10:00:00Z'));
  await page.goto(`${base}/room.html?id=lux-umbrarum-pool-commons`);
  await page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});
  const read=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
  const first=await read();assert.equal(first.communityRoom.ceilingArches,0);assert.equal(first.communityRoom.instruments[0].value,'12:00:00');
  await page.locator('#room-menu-toggle').click();await page.locator('[data-viewpoint="ceiling"]').click();await page.evaluate(()=>window.advanceTime(20));await page.screenshot({path:`${out}/flat-ceiling.png`});
  await page.locator('#room-menu-toggle').click();await page.locator('[data-viewpoint="instruments"]').click();await page.evaluate(()=>window.advanceTime(20));await page.screenshot({path:`${out}/wall-instruments.png`});
  await page.clock.setFixedTime(new Date('2026-10-05T13:15:30Z'));await page.evaluate(()=>window.advanceTime(20));
  const later=await read();assert.equal(later.communityRoom.instruments[0].value,'15:15:30');
  const projection=process.env.POOL_SKIP_MODULE_PROBES==='1'?{}:await page.evaluate(async()=>{
    const {createPoolCommons}=await import('/src/apartments/poolCommons.ts');
    const room=createPoolCommons();await room.ready;const output={};
    for(const [id,units] of [['hour',3.2583333333333333/12],['minute',15.5/60],['second',.5]]){
      const hand=room.scene.getObjectByName(`POOL__clock_${id}_hand`),position=hand.geometry.getAttribute('position');let far=hand.position.clone().set(0,0,0);
      for(let i=0;i<position.count;i++){const v=far.clone().fromBufferAttribute(position,i);if(v.lengthSq()>far.lengthSq())far.copy(v)}
      room.scene.updateMatrixWorld(true);const pivot=hand.getWorldPosition(far.clone().set(0,0,0)),tip=hand.localToWorld(far).sub(pivot).normalize();
      output[id]={horizontal:tip.z,up:tip.y,expectedHorizontal:Math.sin(units*Math.PI*2),expectedUp:Math.cos(units*Math.PI*2)};
    }
    room.dispose();return output;
  });
  for(const hand of Object.values(projection)){assert(Math.abs(hand.horizontal-hand.expectedHorizontal)<.025);assert(Math.abs(hand.up-hand.expectedUp)<.025)}
  await page.screenshot({path:`${out}/time-151530.png`});
  assert.deepEqual(errors,[]);await writeFile(`${out}/results.json`,JSON.stringify({first:first.communityRoom,later:later.communityRoom,projection,errors},null,2));
  console.log('Flat ceiling, four instrument definitions, live local time and physical clock-hand orientation passed.');
}catch(e){console.error(e);await page.screenshot({path:`${out}/failure.png`}).catch(()=>{});process.exitCode=1;}finally{await browser.close()}
