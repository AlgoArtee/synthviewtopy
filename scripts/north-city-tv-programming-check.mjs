import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const output='test-artifacts/north-city/revision-45/native';await mkdir(output,{recursive:true});
const report={checks:[],errors:[],captures:[]};
const check=(condition,name,evidence)=>{report.checks.push({passed:!!condition,name,evidence});assert.ok(condition,name);};
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});const page=await context.newPage();
page.on('pageerror',error=>report.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
try{
  await page.route(/\/src\/apartments\/room\.ts(?:\?.*)?$/,async route=>{const response=await route.fetch(),source=await response.text();await route.fulfill({response,body:source.replace('await room.ready;','await room.ready; window.__qaRoom = room;')});});
  await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment',{waitUntil:'domcontentloaded',timeout:120000});
  const ready=()=>page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:300000});await ready();console.log('Actual room ready');
  const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()).television);
  const advance=seconds=>page.evaluate(seconds=>window.advanceTime(seconds*1000),seconds);
  const show=async()=>{if(await page.locator('body').evaluate(el=>el.classList.contains('city-controls-collapsed')))await page.locator('#city-controls-toggle').click();};
  const openTV=async()=>{await show();if(!await page.locator('#city-tv-panel details').getAttribute('open')){if(!await page.locator('#city-tv-channel').isVisible())await page.locator('#city-tv-panel summary').click();}};
  await page.locator('#room-menu-toggle').click();await page.locator('[data-viewpoint="television"]').click();await openTV();
  const select=async id=>{await openTV();await page.locator('#city-tv-channel').selectOption(id);};
  const pause=async value=>{if((await state()).paused!==value)await page.locator('#city-tv-pause').click();};
  const shot=async name=>{await page.locator('#city-controls-toggle').click();await page.screenshot({path:`${output}/${name}.png`});report.captures.push(name);await openTV();};
  check((await state()).channel==='news','News is the initial channel');
  await pause(true);const frozen=(await state()).elapsed;await advance(5);check((await state()).elapsed===frozen,'Pause freezes the entire broadcast');
  const headlines=new Set();
  for(let i=0;i<4;i++){headlines.add((await state()).headline);await page.locator('#city-tv-next-story').click();}
  check(headlines.size===4,'Next story cycles all four distinct bulletins while paused',[...headlines]);
  await shot('news');await pause(false);const headline=(await state()).headline;await advance(15);
  check((await state()).headline!==headline,'News stories advance during playback');
  const textureBefore=await page.evaluate(()=>window.__qaRoom.scene.getObjectByName('TV · translucent animated art channel').material.uniforms.graphics.value.version);
  await advance(2);const textureAfter=await page.evaluate(()=>window.__qaRoom.scene.getObjectByName('TV · translucent animated art channel').material.uniforms.graphics.value.version);
  check(textureAfter>textureBefore,'News graphics upload new animated frames',{textureBefore,textureAfter});
  for(const channel of ['aurora','orbit','jellyfish','city']){
    await select(channel);const before=(await state()).elapsed;await advance(4);
    check((await state()).channel===channel&&(await state()).elapsed>before+3,`${channel} channel plays`);
    check(!await page.locator('#city-tv-next-story').isVisible(),`${channel} hides the news-only action`);
    await pause(true);await shot(channel);await pause(false);
  }
  await select('city');await page.locator('#city-tv-auto').check();await advance(30);await advance(30);
  check((await state()).channel==='news','Automatic channel cycling wraps back to news');
  check(await page.locator('#city-tv-channel').inputValue()==='news','Channel menu follows automatic changes');
  await page.locator('#city-tv-auto').uncheck();await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
  const reduced=(await state()).elapsed;await advance(25);
  check((await state()).elapsed===reduced&&!(await state()).playing,'Reduced motion freezes graphics, ticker and story rotation');
  check(!await page.locator('#city-tv-pause').isEnabled()&&!await page.locator('#city-tv-auto').isEnabled(),'Reduced-motion control state is clear');
  const oldStory=(await state()).headline;await page.locator('#city-tv-next-story').click();check((await state()).headline!==oldStory,'Manual story navigation works with reduced motion');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(100);await select('orbit');await pause(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});await ready();
  check((await state()).channel==='orbit'&&(await state()).paused&&!(await state()).autoCycle&&(await state()).saved,'Channel and playback settings survive reload',await state());
  await page.setViewportSize({width:390,height:844});await openTV();await page.locator('#city-tv-pause').scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/mobile-controls.png`});report.captures.push('mobile-controls');
  const panel=await page.locator('#city-tv-panel').boundingBox();check(panel.x>=0&&panel.x+panel.width<=390,'TV controls fit a phone viewport',panel);
  check(report.errors.length===0,'No browser or WebGL errors',report.errors);
}catch(error){report.failure=error.stack;await page.screenshot({path:`${output}/failure.png`,timeout:10000}).catch(()=>{});}
finally{await writeFile(output+'/results.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report,null,2));assert.equal(report.failure,undefined);
