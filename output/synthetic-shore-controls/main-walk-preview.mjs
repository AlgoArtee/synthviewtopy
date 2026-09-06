import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
try{
  await page.addInitScript(()=>{HTMLElement.prototype.requestPointerLock=function(){document.dispatchEvent(new Event('pointerlockerror'));};});
  await page.goto('http://127.0.0.1:5182',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.labIsland),{timeout:120000});
  await page.waitForSelector('#loading-screen',{state:'hidden',timeout:120000});
  await page.click('#walk-mode');
  await page.evaluate(()=>{const w=window.labIsland;w.setTimeOfDay('noon');w.walkController.enter(w.camera.position.clone().set(0,1.61,44),w.camera.position.clone().set(0,0,-1));w.advanceTime(100);});
  const before=await page.evaluate(()=>window.labIsland.walkController.getSnapshot());
  assert(before.active,'Walk must be active.');
  assert(await page.evaluate(()=>window.labIsland.walkController.pointerControls.enabled),'Active Walk must enable pointer controls.');
  await page.click('#walk-look-button');
  await page.mouse.move(650,420);await page.mouse.down();await page.mouse.move(790,460,{steps:6});await page.mouse.up();
  const afterLook=await page.evaluate(()=>window.labIsland.walkController.getSnapshot());
  assert(JSON.stringify(before.direction)!==JSON.stringify(afterLook.direction),'Fallback dragging must change Walk direction.');
  await page.keyboard.down('ArrowUp');await page.evaluate(()=>window.labIsland.advanceTime(1000));await page.keyboard.up('ArrowUp');
  const afterMove=await page.evaluate(()=>window.labIsland.walkController.getSnapshot());
  const travel=Math.hypot(afterMove.positionWorld[0]-afterLook.positionWorld[0],afterMove.positionWorld[2]-afterLook.positionWorld[2])*10;
  assert(travel>0.6,'Active keyboard movement must advance the visitor.');
  const jump=await page.evaluate(()=>{
    const w=window.labIsland,c=w.walkController;
    const reset=()=>{c.enter(w.camera.position.clone().set(0,1.61,44),w.camera.position.clone().set(0,0,-1));c.velocityY=0;c.isJumping=false;c.jumpHeld=false;c.jumpPeakHeight=0;c.setMoveIntent(0,0,false);};
    reset();window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{code:'Space',key:' ',bubbles:true}));w.advanceTime(1600);const tap=c.getSnapshot();
    reset();window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}));w.advanceTime(520);window.dispatchEvent(new KeyboardEvent('keyup',{code:'Space',key:' ',bubbles:true}));w.advanceTime(1400);const held=c.getSnapshot();
    // Exercise PointerLockControls' actual mouse handler while active. Native
    // pointer lock was deliberately unavailable above to verify the fallback.
    const initial=w.camera.quaternion.toArray();c.pointerControls.isLocked=true;document.dispatchEvent(new MouseEvent('mousemove',{movementX:70,movementY:-15,bubbles:true}));const lockedMoved=JSON.stringify(initial)!==JSON.stringify(w.camera.quaternion.toArray());c.pointerControls.isLocked=false;
    return {tapHeight:tap.jumpHeightMetres,heldHeight:held.jumpHeightMetres,tapLanded:tap.grounded,heldLanded:held.grounded,lockedMoved};
  });
  assert(jump.tapHeight>=0.48&&jump.tapHeight<=0.62&&jump.tapLanded,'Tap jump must retain its0.55m height and land.');
  assert(jump.heldHeight>=1.45&&jump.heldHeight<=1.65&&jump.heldLanded,'Held jump must retain its1.6m height and land.');
  assert(jump.lockedMoved,'Active native pointer-control mouse handler must still rotate camera.');
  await page.evaluate(()=>window.labIsland.setMode('explore'));
  assert(!(await page.evaluate(()=>window.labIsland.walkController.pointerControls.enabled)),'Leaving Walk must disable pointer controls.');
  await page.evaluate(()=>{const w=window.labIsland;w.setMode('walk');w.walkController.enter(w.camera.position.clone().set(0,1.61,-540),w.camera.position.clone().set(0,0.30,-1));w.advanceTime(300);});
  const fixedSky=await page.evaluate(()=>window.labIsland.getIslandCygnusSnapshot());
  assert(fixedSky.fixedWorldBearing&&fixedSky.depthPlacement==='background-far-plane','Main scene must use the fixed distant sky.');
  assert(fixedSky.blackHole.inViewport&&fixedSky.companion.inViewport,'Both bodies must appear when facing the north sky at human height.');
  await page.screenshot({path:'output/synthetic-shore-controls/main-fixed-sky.png'});
  assert(errors.length===0,errors.join('\n'));
  const result={status:'passed',travelMetres:travel,before,afterLook,afterMove,jump,fixedSky,errors};
  await writeFile('output/synthetic-shore-controls/main-walk-results.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify({status:result.status,travelMetres:travel,jump,fixedSky,errors},null,2));
}finally{await browser.close();}
