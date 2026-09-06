import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const folder='output/synthetic-shore/surf';
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try{
await page.route('**/__surf_check__',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0"></body>'}));
await page.goto('http://127.0.0.1:5178/__surf_check__');
await page.evaluate(async()=>{
const THREE=await import('/node_modules/.vite/deps/three.js');
const {createSyntheticShoreEffects}=await import('/src/world/syntheticShoreEffects.ts');
const layout=await import('/src/world/syntheticBeachLayout.ts');
const effects=createSyntheticShoreEffects();const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(1280,800);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;document.body.append(renderer.domElement);
const scene=new THREE.Scene();scene.add(effects.group);const camera=new THREE.PerspectiveCamera(55,1.6,.05,16000);window.surf={THREE,effects,renderer,scene,camera,layout};});
const views=[];
for(const [name,index,waterDistance,depth] of [['front',192,-3,0],['west',95,-3,0],['east',290,-3,0],['underwater',192,50,1.2]]){
for(const phase of [0,2,4,6]){
const state=await page.evaluate(({index,waterDistance,depth,phase})=>{
const {effects,renderer,scene,camera,layout}=window.surf;
const x=layout.BEACH_COAST_POINTS[index*2],z=layout.BEACH_COAST_POINTS[index*2+1];const n=effects.getCoastSample(x,z);
const px=x+n.normalX*waterDistance,pz=z+n.normalZ*waterDistance;
const py=depth? -depth : effects.groundHeight(px,pz)+1.62;
camera.position.set(px,py,pz);camera.lookAt(px+n.normalX*35,py-(depth?10:2.8),pz+n.normalZ*35);effects.setUnderwater(depth>0);
effects.update(camera,phase+24);effects.renderReflection(renderer,scene,camera,phase+24);renderer.render(scene,camera);
return{coast:[x,z],position:camera.position.toArray(),normal:n,ground:effects.groundHeight(px,pz),water:effects.waterHeight(px,pz,phase+24),cygnus:effects.getCygnusState().visible,calls:renderer.info.render.calls};
},{index,waterDistance,depth,phase});views.push({name,phase,...state});await page.screenshot({path:`${folder}/${name}-${phase}.png`});}
}
const parity=await page.evaluate(async()=>{
const {THREE,effects,renderer,layout}=window.surf;
const {oceanBathymetryGLSL,oceanWaveGLSL}=await import('/src/world/syntheticShore/simulation.ts');
const uniforms={...effects.water.material.uniforms,uProbe:{value:new THREE.Vector2()}};
const material=new THREE.ShaderMaterial({uniforms,vertexShader:'void main(){gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`uniform float uTime;uniform float uWaveHeight;uniform vec2 uProbe;${oceanBathymetryGLSL}${oceanWaveGLSL}void main(){gl_FragColor=vec4(regularWave(uProbe),seafloorHeightGLSL(uProbe.x,uProbe.y),0.,1.);}`});
const probeScene=new THREE.Scene();const probeQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);probeQuad.frustumCulled=false;probeScene.add(probeQuad);
const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.FloatType,format:THREE.RGBAFormat});const values=new Float32Array(4);let maxFloorError=0,maxWaterError=0;
for(const index of [8,38,68,98,128,158,192,226,256,286,316,346,376]){for(const distance of [-20,-4,1,18,65,190]){
const x=layout.BEACH_COAST_POINTS[index*2],z=layout.BEACH_COAST_POINTS[index*2+1],n=effects.getCoastSample(x,z);
const px=x+n.normalX*distance,pz=z+n.normalZ*distance;uniforms.uProbe.value.set(-pz,px);renderer.setRenderTarget(target);renderer.render(probeScene,window.surf.camera);renderer.readRenderTargetPixels(target,0,0,1,1,values);
maxFloorError=Math.max(maxFloorError,Math.abs(values[1]-effects.groundHeight(px,pz)));maxWaterError=Math.max(maxWaterError,Math.abs(values[0]-effects.waterHeight(px,pz,30)));}}
renderer.setRenderTarget(null);target.dispose();material.dispose();return{samples:78,maxFloorError,maxWaterError};});
await writeFile(`${folder}/results.json`,JSON.stringify({views,parity,errors},null,2));console.log(JSON.stringify({errors,parity,views:views.filter(v=>v.phase===0)},null,2));if(errors.length||parity.maxFloorError>.005||parity.maxWaterError>.005)throw new Error('Shader errors or CPU/GPU mismatch');
}finally{await browser.close()}
