import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='test-artifacts/north-city/revision-5/light-diagnostic';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5178/north-city.html');
 const captures=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js');const {createOsCityApartment}=await import('/src/apartments/osCityApartment.ts');
  const room=createOsCityApartment();await room.ready;const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1200,900);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const view=room.viewpoints.find(v=>v.id==='ceiling');const camera=new THREE.PerspectiveCamera(62,1200/900,.05,250);camera.position.copy(view.position);camera.lookAt(view.target);
  const result={},bounce=room.scene.getObjectByName('White room-side window bounce');
  const snap=name=>{renderer.render(room.scene,camera);result[name]=renderer.domElement.toDataURL('image/png').split(',')[1];};
  snap('original');bounce.visible=false;snap('bounce-disabled');bounce.visible=true;bounce.position.set(-5.525,2.2,-1.8);bounce.lookAt(-5.525,2.2,-9.46);bounce.height=1.8;snap('bounce-relocated');
  room.dispose();renderer.dispose();return result;
 });for(const [name,data]of Object.entries(captures))await writeFile(out+'/'+name+'.png',Buffer.from(data,'base64'));console.log('Saved same-scene bounce-light diagnosis');
}finally{await browser.close();}
