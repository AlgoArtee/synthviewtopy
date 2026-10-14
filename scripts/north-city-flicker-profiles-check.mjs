import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import ts from 'typescript';
const path='src/apartments/osCityDistantNeon.ts',source=await fs.readFile(path,'utf8');
const javascript=ts.transpileModule(source.replace("'three'",JSON.stringify(import.meta.resolve('three'))),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {sampleCityDistantNeonPulse:sample,CITY_FLICKER_PROFILES:profiles}=await import('data:text/javascript;base64,'+Buffer.from(javascript).toString('base64'));
const seeds=Array.from({length:54},(_,index)=>7321+index*157),stats={};
for(const time of Object.keys(profiles)){
  let minimum=1,loss=0,active=0,samples=0,maxConcurrent=0;
  for(let frame=0;frame<=7200;frame++){
    const elapsed=frame/30;let concurrent=0;
    for(const seed of seeds){
      const pulse=sample(seed,elapsed,false,time);
      assert.ok(Number.isFinite(pulse)&&pulse>=.04&&pulse<=1,'Local flicker stays bounded');
      assert.equal(pulse,sample(seed,elapsed,false,time),'Same scene clock produces deterministic events');
      assert.equal(sample(seed,elapsed,true,time),1,'Reduced motion is fully steady');
      minimum=Math.min(minimum,pulse);loss+=1-pulse;samples++;
      if(pulse<.98){active++;concurrent++;}
    }
    maxConcurrent=Math.max(maxConcurrent,concurrent);
  }
  assert.ok(maxConcurrent<seeds.length/2,'Events remain local rather than a simultaneous city-wide pulse');
  stats[time]={samples,minimum,meanDimming:loss/samples,activeFraction:active/samples,maxConcurrent};
}
for(const time of ['night','evening','morning']){
  assert.ok(stats[time].activeFraction>stats.day.activeFraction*1.8,`${time} flickers more often than day`);
  assert.ok(stats[time].meanDimming>stats.day.meanDimming*4,`${time} flicker has more visible depth than day`);
  assert.ok(stats[time].minimum<.28&&stats.day.minimum>.57,'Daytime dips are gentler');
}
const output='test-artifacts/north-city/revision-25/profiles';await fs.mkdir(output,{recursive:true});
await fs.writeFile(`${output}/validation.json`,JSON.stringify({pass:true,scope:'Pure time-dependent flicker sampler, not rendered visibility',source:path,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),seeds,seconds:240,sampleHz:30,profiles,stats},null,2));
console.log(JSON.stringify({pass:true,stats}));
