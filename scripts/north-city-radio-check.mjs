import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const output='test-artifacts/north-city/revision-50/native';await mkdir(output,{recursive:true});
const report={checks:[],errors:[],captures:[]};
const check=(pass,name,evidence)=>{report.checks.push({passed:!!pass,name,evidence});assert.ok(pass,name);console.log('PASS '+name);};
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(60000);
page.on('pageerror',e=>{report.errors.push(e.message);console.error(e.message);});
page.on('console',m=>{if(m.type()==='error'){report.errors.push(m.text());console.error(m.text());}});
try {
  await page.route('**/radio-qa',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Radio audio verification</title><button id="play">Play</button>'}));
  await page.goto('http://127.0.0.1:5178/radio-qa');
  const metrics=await page.evaluate(async()=>{
    const module=await import('/src/apartments/osCityRadioAudio.ts');window.__radioModule=module;
    const rows=[];
    for(const p of module.CITY_RADIO_PROGRAMS){
      const buffer=await module.renderRadioProgram(p.id),samples=buffer.getChannelData(0);let energy=0,peak=0,crossings=0;
      for(let i=0;i<samples.length;i++){energy+=samples[i]*samples[i];peak=Math.max(peak,Math.abs(samples[i]));if(i&&samples[i]>0&&samples[i-1]<=0)crossings++;}
      rows.push({id:p.id,duration:buffer.duration,rms:Math.sqrt(energy/samples.length),peak,crossings,wrap:Math.abs(samples[0]-samples.at(-1))});
    }
    window.__radio=module.createCityRadioAudio();document.querySelector('#play').onclick=()=>window.__radio.play();return rows;
  });
  check(metrics.length===5&&metrics.every(m=>m.rms>.015&&m.peak<=.801&&m.wrap<.001),'Five audible, unclipped loops with click-free wrap endpoints',metrics);
  check(new Set(metrics.map(m=>m.crossings)).size===5,'All five programs have distinct generated waveforms');
  check((await page.evaluate(()=>window.__radio.getSnapshot())).context==='uninitialized','Loading radio creates no audio context or autoplay');
  await page.click('#play');await page.waitForFunction(()=>window.__radio.getSnapshot().playing);await page.waitForTimeout(500);
  check((await page.evaluate(()=>window.__radio.getSnapshot())).level>0,'User Play produces actual Web Audio output');
  await page.evaluate(()=>{window.__radio.select('clockwork');window.__radio.select('ghost');window.__radio.select('reactor');window.__radio.stop();});await page.waitForTimeout(1000);
  check(!(await page.evaluate(()=>window.__radio.getSnapshot())).playing,'Stop cancels synthesis and rapid track switches');
  const saved=await page.evaluate(()=>{window.__radio.select('wind');window.__radio.setVolume(63);const second=window.__radioModule.createCityRadioAudio();const state=second.getSnapshot();second.dispose();return state;});
  check(saved.program==='wind'&&saved.volume===63&&!saved.playing&&saved.context==='uninitialized','Program and volume restore without autoplay');
  await page.click('#play');await page.waitForFunction(()=>window.__radio.getSnapshot().playing);
  const hidden=await page.evaluate(async()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));await new Promise(r=>setTimeout(r,100));const s=window.__radio.getSnapshot();delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));return s;});
  check(!hidden.playing&&hidden.context==='suspended','Visibility handler stops playback and suspends audio');
  await page.evaluate(()=>window.__radio.dispose());await page.waitForFunction(()=>window.__radio.getSnapshot().context==='closed');
  check(true,'Disposal closes audio context');
  await page.evaluate(()=>{localStorage.removeItem('north-city-desk-radio-v1');localStorage.setItem('north-city-holiday-v1','halloween');});
  await page.route(/\/src\/apartments\/room\.ts(?:\?.*)?$/,async route=>{
    const response=await route.fetch(),source=await response.text();
    await route.fulfill({response,body:source.replace('await room.ready;','await room.ready; window.__qaRoom=room;')});
  });
  console.log('Loading full room; cold GPU compilation may take several minutes.');
  await page.goto('http://127.0.0.1:5178/room.html?id=os-city-apartment',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:600000});console.log('Full room ready');
  const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
  const show=async()=>{if((await state()).controlsCollapsed)await page.locator('#city-controls-toggle').click();};
  const view=async id=>{await show();await page.locator('#room-menu-toggle').click();await page.locator(`[data-viewpoint="${id}"]`).click();};
  const capture=async name=>{await page.screenshot({path:`${output}/${name}.png`});report.captures.push(name);};
  const selectRadio=async()=>{
    // The dedicated radio viewpoint centres the stereo; select it with a real canvas click.
    await page.locator('#apartment-viewport canvas').click();await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).radio.panelOpen);
  };
  await view('study');await page.locator('#city-controls-toggle').click();await capture('radio-beside-workstation');
  await view('radio');await page.locator('#city-controls-toggle').click();await capture('radio-closeup');
  await selectRadio();
  check((await state()).radio.panelOpen&&!(await state()).radio.playing,'Clicking the 3D stereo opens its panel without autoplay');
  await page.locator('input[name="city-radio-program"][value="clockwork"]').check();
  check((await state()).radio.program==='clockwork'&&!(await state()).radio.playing,'Selecting a silent station stays silent until Play');
  await page.locator('#city-radio-play').click();await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).radio.playing);await page.waitForTimeout(700);
  check((await state()).radio.level>0,'Radio UI starts audible music');
  for(const id of ['ghost','wind','reactor','midnight']){
    await page.locator(`input[name="city-radio-program"][value="${id}"]`).check();await page.waitForFunction(id=>{const r=JSON.parse(window.render_game_to_text()).radio;return r.program===id&&r.playing;},id);await page.waitForTimeout(500);
    check((await state()).radio.level>0,'Live station switch: '+id);
  }
  await capture('radio-controls-desktop');
  await page.locator('#city-radio-volume').fill('0');await page.waitForTimeout(500);
  check((await state()).radio.volume===0&&(await state()).radio.level<.0001,'Zero volume silences actual output');
  await page.locator('#city-radio-volume').fill('45');
  await page.keyboard.press('Escape');
  check(!(await state()).radio.panelOpen&&(await state()).radio.playing,'Escape closes the dialog while music continues');
  check(await page.evaluate(()=>document.activeElement===document.querySelector('#apartment-viewport canvas')),'Closing returns keyboard focus to the room');
  await capture('radio-playing-display');
  await page.mouse.move(720,500);await page.mouse.down();await page.mouse.move(770,510,{steps:5});await page.mouse.up();
  check(!(await state()).radio.panelOpen,'Looking around does not accidentally select the stereo');
  await show();await page.locator('#city-radio-open').click();
  const before=(await state()).position;await page.keyboard.press('w');
  check(JSON.stringify((await state()).position)===JSON.stringify(before),'Dialog keyboard input does not move the camera');
  await page.setViewportSize({width:390,height:844});await capture('radio-controls-mobile');
  const fits=await page.locator('#city-radio-dialog').evaluate(el=>{const r=el.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight&&el.scrollWidth<=el.clientWidth;});
  check(fits,'Mobile dialog fits the viewport without horizontal scrolling');
  await page.locator('#city-radio-play').click();check(!(await state()).radio.playing,'Stop control halts music');
  await page.locator('.city-radio-close').click();
  report.final=(await state()).radio;
  check(report.errors.length===0,'No browser errors',report.errors);
}catch(e){report.failure=e.stack;await page.screenshot({path:`${output}/failure.png`,timeout:10000}).catch(()=>{});}
finally{await writeFile(`${output}/results.json`,JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report,null,2));assert.equal(report.failure,undefined);
