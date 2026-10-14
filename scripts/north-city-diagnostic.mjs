import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1500,height:1050}});
try{
 await page.goto('http://127.0.0.1:5178/north-city.html');
 const images=await page.evaluate(async()=>{
 const THREE=await import('/node_modules/three/build/three.module.js');
 const {createOsCityApartment}=await import('/src/apartments/osCityApartment.ts');
 const {createRoomRendering}=await import('/src/apartments/roomRendering.ts');
 const room=createOsCityApartment();await room.ready;
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1200,900);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const camera=new THREE.PerspectiveCamera(62,1200/900,.08,450);camera.position.set(.61,1.62,.08);camera.lookAt(.05,1.22,-2.18);
 renderer.render(room.scene,camera);const raw=renderer.domElement.toDataURL('image/png').split(',')[1];
 const rendering=createRoomRendering(renderer,room.scene,camera);rendering.render();const post=renderer.domElement.toDataURL('image/png').split(',')[1];
 rendering.dispose();room.dispose();renderer.dispose();return{raw,post};
 });
 for(const [key,value]of Object.entries(images))await writeFile('test-artifacts/north-city/diagnostic-'+key+'.png',Buffer.from(value,'base64'));console.log('Saved material diagnostics');
}finally{await browser.close();}
