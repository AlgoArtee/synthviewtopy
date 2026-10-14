import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base=process.env.BASE_URL??'http://127.0.0.1:5178',output=process.env.POOL_SWIM_OUTPUT??'test-artifacts/lux-umbrarum-pool/swimming';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1600,height:900}}),page=await context.newPage();
await context.addInitScript(()=>{window.requestAnimationFrame=()=>0;window.cancelAnimationFrame=()=>{};});
const results={checks:[],errors:[],states:{}};
page.on('pageerror',e=>results.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')results.errors.push(m.text())});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const step=ms=>page.evaluate(ms=>window.advanceTime(ms),ms);
const choose=async id=>{await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${id}"]`).click();await step(20);};
const hold=async(key,ms)=>{await page.keyboard.down(key);await step(ms);await page.keyboard.up(key);return state();};
async function aim(x,y,z) {
  const s=await state(),dx=x-s.position[0],dy=y-s.position[1],dz=z-s.position[2],yaw=-Math.atan2(dx,-dz),pitch=Math.atan2(dy,Math.hypot(dx,dz));
  const delta=Math.atan2(Math.sin(yaw-s.look.yaw),Math.cos(yaw-s.look.yaw));
  await page.mouse.move(800,450);await page.mouse.down();await page.mouse.move(800-delta/.003,450-(pitch-s.look.pitch)/.003,{steps:10});await page.mouse.up();
}
async function swimTo(x,z) {
  const s=await state();await aim(x,s.position[1],z);await hold('w',Math.hypot(x-s.position[0],z-s.position[2])/1.85*1000);
  const landed=await state();assert(Math.hypot(x-landed.position[0],z-landed.position[2])<.12);return landed;
}
try {
  await page.goto(`${base}/room.html?id=lux-umbrarum-pool-commons`);
  await page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000,polling:100});
  await choose('water');await page.keyboard.down('w');await step(300);await page.keyboard.down('Space');await step(220);
  const air=await state();assert.equal(air.navigation.mode,'airborne');assert(air.position[1]>2.0);
  await page.screenshot({path:`${output}/edge-jump.png`});await page.keyboard.up('Space');await step(1200);await page.keyboard.up('w');await step(800);
  const surface=await state();assert.equal(surface.navigation.mode,'swimming');assert(surface.position[1]<.1&&surface.position[1]>-.25);
  assert(surface.navigation.splashCount===1);results.states.surface=surface;results.checks.push('Space edge jump, gravity, water entry splash and stable surface buoyancy');
  const start=surface.position;await hold('d',600);await hold('a',600);const lateral=await state();
  assert(Math.hypot(lateral.position[0]-start[0],lateral.position[2]-start[2])<.09);
  results.checks.push('horizontal swimming and opposing strokes');
  await hold('c',800);const underwater=await state();assert(underwater.navigation.underwater&&underwater.position[1]<-.9&&underwater.position[1]>-1.3);
  await aim(0,-.8,-2.0);await page.screenshot({path:`${output}/underwater.png`});results.states.underwater=underwater;
  await step(800);const risen=await state();assert(!risen.navigation.underwater);assert(risen.position[1]>-.18);
  results.checks.push('C dive, underwater view and release-to-surface ascent');
  await aim(0,0,-10);await hold('w',5000);const wall=await state();assert(wall.position[2]>=-3.22&&wall.position[2]<=-3.15);
  await hold('w',400);const stillWall=await state();assert.deepEqual([stillWall.position[0],stillWall.position[2]],[wall.position[0],wall.position[2]]);
  results.checks.push('basin walls contain the swimmer');
  await swimTo(-4.5,3.12);await hold('Space',20);assert.equal((await state()).navigation.mode,'climbing');await step(1100);
  const exit=await state();assert.equal(exit.navigation.mode,'walking');assert.equal(exit.position[1],1.65);assert(Math.abs(exit.position[2]-4.2)<.03);
  await page.screenshot({path:`${output}/pool-ladder-exit.png`});results.checks.push('swim to the ladder and climb out onto the deck');
  await choose('board-access');const climbed=await hold('w',930);results.states.climbed=climbed;assert(climbed.navigation.onBoard);assert(Math.abs(climbed.position[1]-2.674)<.04);
  await aim(1.7,climbed.position[1],2.45);await hold('w',1700);const tip=await state();assert(tip.navigation.onBoard&&tip.position[0]<2.0&&tip.position[0]>1.15);
  await aim(-2.0,-.15,2.45);await page.screenshot({path:`${output}/on-diving-board.png`});results.states.board=tip;
  results.checks.push('walk up all five real access steps and along the diving board');
  const beforeDive=tip.navigation.splashCount;
  await page.keyboard.down('w');await page.keyboard.down('Space');await step(250);const boardAir=await state();assert(boardAir.position[1]>3.4);
  await page.screenshot({path:`${output}/board-jump.png`});await page.keyboard.up('Space');await step(1120);await page.keyboard.up('w');
  const impact=await state();assert.equal(impact.navigation.mode,'swimming');assert.equal(impact.navigation.splashCount,beforeDive+1);
  assert(impact.navigation.lastImpact>6);assert(impact.splashes.active>0&&impact.splashes.droplets>0);
  results.states.impact=impact;await page.screenshot({path:`${output}/splash-first-person.png`});
  await choose('water');await aim(impact.position[0],-.05,impact.position[2]);await page.screenshot({path:`${output}/splash-observer.png`});
  results.checks.push('board jump lands in water and emits visible droplets, crown and ripples');
  await step(2600);const faded=await state();assert.equal(faded.splashes.active,0);assert.equal(faded.splashes.droplets,0);
  results.checks.push('splash particles and ripples expire cleanly');
  const phoneContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await phoneContext.addInitScript(()=>{window.requestAnimationFrame=()=>0;window.cancelAnimationFrame=()=>{};});
  const phone=await phoneContext.newPage();phone.on('pageerror',e=>results.errors.push(e.message));await phone.goto(`${base}/room.html?id=lux-umbrarum-pool-commons`);
  await phone.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000,polling:100});
  const touch=await phoneContext.newCDPSession(phone),button=await phone.locator('[data-walk="jump"]').boundingBox();assert(button);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:button.x+button.width/2,y:button.y+button.height/2}]});
  await phone.evaluate(()=>window.advanceTime(180));assert.equal(JSON.parse(await phone.evaluate(()=>window.render_game_to_text())).navigation.mode,'airborne');
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await phone.screenshot({path:`${output}/touch-jump.png`});results.checks.push('touch jump control and phone layout');
  await phone.locator('#room-menu-toggle').click();await phone.locator('[data-viewpoint="water"]').click();
  const pressTouch=async(action,ms)=>{
    const rect=await phone.locator(`[data-walk="${action}"]`).boundingBox();assert(rect);
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x+rect.width/2,y:rect.y+rect.height/2}]});
    await phone.evaluate(ms=>window.advanceTime(ms),ms);await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    return JSON.parse(await phone.evaluate(()=>window.render_game_to_text()));
  };
  assert.equal((await pressTouch('forward',3000)).navigation.mode,'swimming');
  assert((await pressTouch('dive',800)).navigation.underwater);await phone.screenshot({path:`${output}/touch-dive.png`});
  await phone.evaluate(()=>window.advanceTime(800));assert(!JSON.parse(await phone.evaluate(()=>window.render_game_to_text())).navigation.underwater);
  await phoneContext.close();results.checks.push('touch swimming, hold-to-dive and release-to-surface controls');
  assert.deepEqual(results.errors,[]);console.log(`Pool swimming passed ${results.checks.length} check groups.`);
}catch(error){results.failure=error.stack;results.states.failure=await state().catch(()=>null);console.error(error);await page.screenshot({path:`${output}/failure.png`}).catch(()=>{});process.exitCode=1;}
finally{await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));await browser.close();}
