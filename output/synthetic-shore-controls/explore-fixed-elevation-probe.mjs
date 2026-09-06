import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
try{
 await page.goto('http://127.0.0.1:5182',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.labIsland);await page.waitForSelector('#loading-screen',{state:'hidden',timeout:120000});
 const results=[];
 for(const elevation of [20,10,8,7]){
  const result=await page.evaluate(elevation=>{
   const w=window.labIsland;w.setTimeOfDay('noon');w.setMode('explore');w.cameraTween=null;w.controls.enableDamping=false;
   if(!window.initialSkyQuaternion)window.initialSkyQuaternion=w.islandCygnus.group.quaternion.clone();
   w.islandCygnus.group.quaternion.copy(window.initialSkyQuaternion).premultiply(new w.camera.quaternion.constructor().setFromAxisAngle(w.camera.position.clone().set(1,0,0),(elevation-20)*Math.PI/180));
   w.camera.position.set(0,42,-410);w.controls.target.set(0,0,-1300);w.controls.update();w.advanceTime(100);
   const state=w.getIslandCygnusSnapshot();
   return {elevation,mode:w.mode,fov:w.camera.fov,polarDegrees:w.controls.getPolarAngle()*180/Math.PI,camera:w.camera.position.toArray(),state};
  },elevation);
  await page.screenshot({path:`output/synthetic-shore-controls/explore-sky-${elevation}deg.png`});results.push(result);
 }
 await writeFile('output/synthetic-shore-controls/explore-elevation-probe.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
