import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const output='test-artifacts/north-city/revision-21/neon-helper';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.route('**/neon-atmosphere-helper',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Emission-only fog shader check</title>'}));
  await page.goto('http://127.0.0.1:5178/neon-atmosphere-helper');
  const result=await page.evaluate(async()=>{
    // Use the same Vite module identity as the builder; raw Three imports would
    // create a second set of constructors and invalidate material type guards.
    const helperSource=await(await fetch('/src/apartments/osCityNeonAtmosphere.ts')).text();
    const THREE=await import(helperSource.match(/import \* as THREE from "([^"]+)"/)[1]);
    const {createCityNeonAtmosphere}=await import('/src/apartments/osCityNeonAtmosphere.ts');
    const {getCityWeatherPreset}=await import('/src/apartments/osCityWeather.ts');
    const checks=[],failures=[];const check=(condition,message)=>{checks.push(message);if(!condition)failures.push(message);};
    const atmosphere=createCityNeonAtmosphere('Shader fixture');
    const maskCanvas=document.createElement('canvas');maskCanvas.width=128;maskCanvas.height=64;const ctx=maskCanvas.getContext('2d');ctx.fillStyle='#000000';ctx.fillRect(0,0,128,64);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,64,64);
    const mask=new THREE.CanvasTexture(maskCanvas);mask.colorSpace=THREE.SRGBColorSpace;
    const emitting=atmosphere.register(new THREE.MeshStandardMaterial({color:'#060606',emissive:'#ffffff',emissiveMap:mask,emissiveIntensity:1.5}),'window','Masked fog fixture');
    const body=atmosphere.register(new THREE.MeshStandardMaterial({color:'#101010',emissive:'#ffffff',emissiveIntensity:.1}),'surface','Opaque fog fixture');
    const basic=atmosphere.register(new THREE.MeshBasicMaterial({color:'#88ccff'}),'neon','Basic LED');
    const sprite=atmosphere.register(new THREE.SpriteMaterial({color:'#aaddff',transparent:true,opacity:.1}),'fixture','Fixture halo');
    const light=atmosphere.registerLight(new THREE.PointLight('#ffffff',8));light.name='Fixture light';
    const renderer=new THREE.WebGLRenderer({antialias:false});renderer.setSize(128,64);renderer.outputColorSpace=THREE.LinearSRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
    const target=new THREE.WebGLRenderTarget(128,64),scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-8,8,4,-4,.1,300);scene.fog=new THREE.FogExp2('#102030',.05);scene.background=scene.fog.color;
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(16,8),emitting);plane.position.z=-100;scene.add(plane);
    const pixel=(x,y,buffer)=>Array.from(buffer.slice((y*128+x)*4,(y*128+x)*4+3));
    const render=()=>{renderer.setRenderTarget(target);renderer.render(scene,camera);const buffer=new Uint8Array(128*64*4);renderer.readRenderTargetPixels(target,0,0,128,64,buffer);return {light:pixel(32,32,buffer),body:pixel(96,32,buffer)};};
    const samples={};
    for(const time of ['day','night']){
      atmosphere.setWeather('fog',time);samples[time]=render();
      check(samples[time].light.reduce((a,b)=>a+b)>samples[time].body.reduce((a,b)=>a+b)+60,time+' actual masked emission remains visible at 100m in dense fog');
      const first=atmosphere.snapshot();for(let i=0;i<12;i++)atmosphere.setWeather('fog',time);check(JSON.stringify(atmosphere.snapshot())===JSON.stringify(first),time+' repeated weather application is idempotent');
      plane.material=body;const opaque=render();plane.material=emitting;check(opaque.light.every((channel,i)=>Math.abs(channel-samples[time].body[i])<=1),time+' opaque facade and black emission texels keep identical full fog');
    }
    check(samples.night.light.reduce((a,b)=>a+b)>samples.day.light.reduce((a,b)=>a+b),'night emitter is brighter than day at the actual framebuffer');
    check(samples.night.body.every((channel,i)=>Math.abs(channel-samples.day.body[i])<=1),'changing emission cannot resurrect unlit facade silhouettes');
    atmosphere.setPulse(emitting,.87);atmosphere.setLightPulse(light,.92);atmosphere.setWeather('rain','evening');
    const evening=getCityWeatherPreset('rain','evening');check(Math.abs(emitting.emissiveIntensity-1.5*.87*evening.windowGlow)<1e-10,'animation pulse retains time-dependent window multiplier');check(Math.abs(light.intensity-8*.92*evening.fixtureIntensity)<1e-10,'light animation retains time-dependent fixture multiplier');
    // Compile basic LED and sprite fog paths too, through the same real renderer.
    plane.material=basic;render();plane.visible=false;const halo=new THREE.Sprite(sprite);halo.position.z=-100;halo.scale.set(10,5,1);scene.add(halo);render();
    const snapshot=atmosphere.snapshot();check(snapshot.materials.every(m=>m.fog),'no emitter disables material fog');check(snapshot.transmission.every(t=>t.emission>=t.body&&t.emission<=1),'scattered emission attenuates with bounded transmission');
    target.dispose();renderer.dispose();mask.dispose();[emitting,body,basic,sprite].forEach(m=>m.dispose());plane.geometry.dispose();
    return {checks:checks.length,failures,samples,snapshot};
  });
  await mkdir(output,{recursive:true});await writeFile(output+'/shader-and-idempotence.json',JSON.stringify({...result,errors},null,2));
  assert.deepEqual(result.failures,[]);assert.deepEqual(errors,[]);console.log('PASS: '+result.checks+' real WebGL emission-only fog, opaque silhouette, time, pulse and idempotence checks.');
}finally{await browser.close();}
