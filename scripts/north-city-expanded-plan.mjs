import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1300,height:1200}});
try{
 await page.goto('http://127.0.0.1:5178/north-city.html');
 const image=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js');
  const {createOsCityApartment}=await import('/src/apartments/osCityApartment.ts');
  const room=createOsCityApartment();await room.ready;
  room.scene.getObjectByName('North City · behind the island').visible=false;
  room.scene.traverse(o=>{if(/ceiling|Ceiling|Concentric|diffuser/i.test(o.name)&&o.isMesh)o.visible=false;});
  room.scene.background=new THREE.Color('#ffffff');room.scene.fog=null;
  room.scene.overrideMaterial=new THREE.MeshStandardMaterial({color:'#c9c9c9',roughness:1});
  room.scene.add(new THREE.AmbientLight('#ffffff',1));
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1300,1200);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const camera=new THREE.OrthographicCamera(-5.35,5.35,4.94,-4.94,.1,40);camera.position.set(0,12,1.575);camera.up.set(0,0,-1);camera.lookAt(0,0,1.575);
  renderer.render(room.scene,camera);const data=renderer.domElement.toDataURL('image/png').split(',')[1];
  room.scene.overrideMaterial.dispose();room.dispose();renderer.dispose();return data;
 });
 await mkdir('test-artifacts/north-city/revision-2',{recursive:true});await writeFile('test-artifacts/north-city/revision-2/floor-plan.png',Buffer.from(image,'base64'));console.log('Saved actual-mesh orthographic floor plan');
}finally{await browser.close();}
