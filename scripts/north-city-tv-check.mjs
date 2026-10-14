import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-6/validation';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const samples=[];
try{
 for(const reducedMotion of ['no-preference','reduce']){
  const context=await browser.newContext({reducedMotion});const page=await context.newPage();
  await page.goto('http://127.0.0.1:5178/north-city.html');
  const result=await page.evaluate(async()=>{
    const THREE=await import('/node_modules/three/build/three.module.js');
    const {createOsCityTV}=await import('/src/apartments/osCityTV.ts');
    const tv=createOsCityTV(),film=tv.group.getObjectByName('TV · translucent animated art channel');
    tv.update(1);const before=film.material.uniforms.time.value;tv.update(8);const after=film.material.uniforms.time.value;
    const bounds=new THREE.Box3().setFromObject(tv.group),panel=new THREE.Box3().setFromObject(film);
    const front=new THREE.Vector3(0,0,1).applyQuaternion(tv.group.quaternion);
    return {before,after,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},panelWidth:panel.max.z-panel.min.z,panelHeight:panel.max.y-panel.min.y,front:front.toArray()};
  });
  assert.ok(Math.abs(result.panelWidth-3.72)<.001&&Math.abs(result.panelHeight-2.02)<.001);
  assert.ok(result.front[0]>.999,'TV faces inward from west wall');
  assert.ok(Math.abs(result.bounds.min[0]-(-9.8))<.007,'Wall brackets meet the wall within 7 mm');
  if(reducedMotion==='reduce')assert.equal(result.before,result.after);else assert.ok(result.after>result.before);
  samples.push({reducedMotion,...result});await context.close();
 }
 await mkdir(out,{recursive:true});await writeFile(out+'/television.json',JSON.stringify(samples,null,2));console.log(JSON.stringify({passed:true,samples}));
}finally{await browser.close();}
