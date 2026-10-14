import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const output='test-artifacts/north-city/revision-20/fog-snow';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
  const page=await browser.newPage({viewport:{width:640,height:360},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.route('**/fog-snow-check',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
  await page.goto('http://127.0.0.1:5178/fog-snow-check');
  const result=await page.evaluate(async()=>{
    const THREE=await import('/node_modules/three/build/three.module.js');
    const {createOsCityBalconyDistrict}=await import('/src/apartments/osCityBalconyDistrict.ts');
    const district=createOsCityBalconyDistrict();await district.userData.ready;
    const snow=district.getObjectByName('Circuit Market · snow on exposed roof surfaces'),caps=snow.userData.surfaces,mesh=snow.children[0];
    district.updateMatrixWorld(true);
    const positions=mesh.geometry.attributes.position,ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),meshes=[];
    district.traverse(object=>{if(object.isMesh&&object!==mesh&&!object.name.includes('sky')&&!object.isInstancedMesh&&!(Array.isArray(object.material)?object.material:[object.material]).some(material=>material.transparent))meshes.push(object);});
    const failures=[];let minThickness=Infinity,maxThickness=0,maxSupportError=0,minX=Infinity,maxBottomError=0;
    caps.forEach((cap,index)=>{
      let bottom=Infinity,top=-Infinity;
      for(let vertex=index*36;vertex<(index+1)*36;vertex++){
        bottom=Math.min(bottom,positions.getY(vertex));top=Math.max(top,positions.getY(vertex));minX=Math.min(minX,positions.getX(vertex));
      }
      const error=Math.abs(bottom-cap.supportY),thickness=top-bottom;maxBottomError=Math.max(maxBottomError,error);minThickness=Math.min(minThickness,thickness);maxThickness=Math.max(maxThickness,thickness);
      if(error>.00001||thickness<.02999||thickness>.03001)failures.push(`${cap.name}: cap geometry datum/thickness incorrect`);
      // The actual cap's lower face, at four inset points, touches opaque roof
      // or equipment geometry directly beneath it (not an imagined datum).
      for(const [u,v] of [[-.3,-.3],[-.3,.3],[.3,-.3],[.3,.3]]){
        const dx=u*cap.width,dz=v*cap.depth,c=Math.cos(cap.rotation),s=Math.sin(cap.rotation);
        ray.set(new THREE.Vector3(cap.x+c*dx+s*dz,cap.supportY+.005,cap.z-s*dx+c*dz),down);
        const hit=ray.intersectObjects(meshes,false)[0];
        const supportError=hit?Math.abs(hit.point.y-cap.supportY):Infinity;
        maxSupportError=Math.max(maxSupportError,supportError);if(supportError>.006)failures.push(`${cap.name}: unsupported snow at ${cap.x}, ${cap.z}: ${supportError}`);
      }
    });
    const states=[];for(const mode of ['rain','snow','fog','clear','storm']){district.userData.setWeather(mode);states.push({mode,...district.userData.getSnapshot().snowAccumulation});if(snow.visible!==(mode==='snow'))failures.push(`${mode}: snow visibility`);}
    if(snow.children.length!==1||minX<=5.08)failures.push('Snow batching or sheltered-terrace exclusion');

    // Compile and render the actual postprocessor, including dynamic camera
    // planes, fog changes and the no-fog fallback, on a small supported scene.
    const {createRoomRendering}=await import('/src/apartments/roomRendering.ts');
    const scene=new THREE.Scene();scene.userData.apartment={northCity:true};scene.background=new THREE.Color('#b4c2ca');scene.fog=new THREE.FogExp2('#b4c2ca',.05);
    scene.add(new THREE.HemisphereLight('#ffffff','#445566',2));
    const material=new THREE.MeshStandardMaterial({color:'#384956'}),ground=new THREE.Mesh(new THREE.BoxGeometry(8,.1,8),material);ground.position.y=-1;scene.add(ground);
    const block=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material);block.position.set(0,-.45,0);scene.add(block);
    const far=new THREE.Mesh(new THREE.BoxGeometry(8,20,8),material);far.position.set(0,3,-100);scene.add(far);
    const camera=new THREE.PerspectiveCamera(62,640/360,.08,450);camera.position.set(0,1,3);camera.lookAt(0,0,-20);
    const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});renderer.setSize(640,360);document.body.append(renderer.domElement);
    const finishing=createRoomRendering(renderer,scene,camera);finishing.render();
    scene.fog.density=.025;camera.near=.12;camera.far=400;camera.updateProjectionMatrix();finishing.render();
    scene.fog=null;finishing.render();
    const programs=renderer.info.programs?.length??0;finishing.dispose();renderer.dispose();district.userData.dispose();
    return {capCount:caps.length,triangleCount:positions.count/3,drawCalls:snow.children.length,minThickness,maxThickness,maxBottomError,maxSupportError,supportRays:caps.length*4,minX,states,shaderPrograms:programs,failures};
  });
  assert.deepEqual(result.failures,[]);assert.deepEqual(errors,[]);assert.ok(result.capCount>40);assert.ok(result.shaderPrograms>0);
  await mkdir(output,{recursive:true});await writeFile(`${output}/validation.json`,JSON.stringify({...result,errors,pass:true},null,2));
  console.log(JSON.stringify({...result,errors,pass:true}));
}finally{await browser.close();}
