import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import ts from 'typescript';
import * as THREE from 'three';
const source='src/apartments/osCityWindowTv.ts',code=await fs.readFile(source,'utf8');
const js=ts.transpileModule(code.replace("'three'",JSON.stringify(import.meta.resolve('three'))),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {createCityWindowTv,cityWindowFlags,cityWindowRank,normalizeCityWindowSettings}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
let checks=0;
for(let block=0;block<20;block++)for(let channel=0;channel<3;channel++){
  assert.equal(new Set(Array.from({length:100},(_,i)=>cityWindowRank(block*100+i,channel))).size,100);checks++;
}
const tv=createCityWindowTv('slider checks');
for(let id=0;id<1000;id++)tv.tagGeometry(new THREE.PlaneGeometry(),id,'room');
for(const illuminatedPercent of [0,25,65,100])for(const shadowsPercent of [0,40,100])for(const tvPercent of [0,40,100]){
  const settings={illuminatedPercent,shadowsPercent,tvPercent};tv.setSettings(settings);const s=tv.snapshot();
  assert.equal(s.illuminatedWindowCount,illuminatedPercent*10);
  assert.equal(s.shadowWindowCount===0,illuminatedPercent===0||shadowsPercent===0);
  assert.equal(s.animatedWindowCount===0,illuminatedPercent===0||tvPercent===0);
  if(shadowsPercent===100)assert.equal(s.shadowWindowCount,s.illuminatedWindowCount);
  if(tvPercent===100)assert.equal(s.animatedWindowCount,s.illuminatedWindowCount);
  for(let id=0;id<1000;id++){
    const flags=cityWindowFlags(id,settings);assert.ok(flags.illuminated||!flags.shadows&&!flags.tv);checks++;
  }
}
tv.setSettings({illuminatedPercent:100,shadowsPercent:0,tvPercent:100});
const material=tv.material(new THREE.MeshStandardMaterial(),'room');
const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};
material.onBeforeCompile(shader,{});assert.deepEqual(shader.uniforms.cityWindowCoverage.value.toArray(),[0,100,100]);
const programKey=material.customProgramCacheKey();tv.setSettings({tvPercent:0,shadowsPercent:100});
assert.deepEqual(shader.uniforms.cityWindowCoverage.value.toArray(),[100,100,0]);assert.equal(material.customProgramCacheKey(),programKey,'Sliders do not rebuild programs');
const wholeQuad=tv.material(new THREE.MeshStandardMaterial(),'room',false,true),wholeShader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};wholeQuad.onBeforeCompile(wholeShader,{});
assert.ok(wholeShader.fragmentShader.includes('float tvOpening = 1.0;'));assert.ok(!shader.fragmentShader.includes('float tvOpening = 1.0;'));assert.notEqual(wholeQuad.customProgramCacheKey(),programKey);checks+=3;
assert.deepEqual(normalizeCityWindowSettings({tvPercent:Infinity,illuminatedPercent:-30,shadowsPercent:400}),{tvPercent:40,illuminatedPercent:0,shadowsPercent:100});
const output=process.env.CITY_WINDOW_CHECK_OUTPUT??'test-artifacts/north-city/revision-26/window-controls';await fs.mkdir(output,{recursive:true});
await fs.writeFile(`${output}/validation.json`,JSON.stringify({pass:true,checks,source,sourceSha256:crypto.createHash('sha256').update(code).digest('hex'),scope:'Independent window states, percentage extremes, lit-room dependency, stable nested selections, live shared uniforms without shader recompilation'},null,2));
console.log(JSON.stringify({pass:true,checks}));
