import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const output=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-40';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/outer-market-check',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><body>Outer market lighting checks</body>'}));await page.goto('http://127.0.0.1:5178/outer-market-check');
 const result=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js'),{createOsCityBalconyDistrict}=await import('/src/apartments/osCityBalconyDistrict.ts');
  const district=createOsCityBalconyDistrict(),initial=district.userData.getSnapshot(),outer=initial.outerMarket,checks=[];
  const check=(passed,name,evidence)=>checks.push({passed,name,evidence});
  check(outer.clusterCount>=18&&outer.vendorCount>=40,'Market lights occupy many tower gaps', {clusters:outer.clusterCount,vendors:outer.vendorCount});
  check(outer.clusters.every(f=>f.x-f.halfWidth>88.6||f.z+f.halfDepth< -60.9||f.z-f.halfDepth>50.9),'Every light cluster is outside the plaza perimeter');
  check(outer.vendors.every(v=>v.y===-14.02&&v.height>=2.1&&v.height<3.3)&&outer.fixtures.every(f=>f.y>-14.02&&f.y< -9.8),'Fixtures stay at ground-level market height');
  const forms=[...new Set(outer.fixtures.map(f=>f.form))],heights=outer.vendors.map(v=>v.height),powers=outer.fixtures.map(f=>f.intensity);
  check(forms.length===6&&Math.max(...heights)-Math.min(...heights)>.85&&Math.max(...powers)-Math.min(...powers)>.7,'Lanterns, signs, strings, rings and strips vary in height and brightness',{forms,fixtureCount:outer.fixtures.length,heightRange:[Math.min(...heights),Math.max(...heights)]});
  check(outer.drawCalls===4&&outer.additionalRealtimeLights===0,'Atmosphere uses only four batches and no extra realtime light passes');
  const conflicts=[];
  for(const f of outer.clusters)for(const [x,z,w,d] of initial.transitGuideway.nearTowerFootprints)if(Math.abs(f.x-x)<f.halfWidth+w/2+1.4&&Math.abs(f.z-z)<f.halfDepth+d/2+1.4)conflicts.push({f,tower:[x,z,w,d]});
  check(!conflicts.length,'Clusters avoid surrounding tower footprints',conflicts);
  const lights=district.getObjectByName('Circuit Market · distant ground-level market lights');
  const escaped=[];
  for(const mesh of lights.children.filter(m=>!m.isInstancedMesh)){
   const positions=mesh.geometry.getAttribute('position');
   for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),z=positions.getZ(i);
    if(!outer.clusters.some(c=>Math.abs(x-c.x)<=c.halfWidth&&Math.abs(z-c.z)<=c.halfDepth))escaped.push([x,z]);
   }
  }
  check(!escaped.length,'Actual varied fixture and canopy geometry stays within the collision-cleared footprints',{escapedVertices:escaped.length});
  district.updateMatrixWorld(true);
  const wallFailures=[],wallMaterials=[];let rayCount=0;
  for(const shell of initial.retailShells.filter(s=>['Circuit Dive','Neuralware'].includes(s.name))){
   const meshes=[];district.traverse(o=>{if(o.isMesh&&o.material.name===shell.name+' · continuous exterior walls')meshes.push(o);});
   wallMaterials.push({name:shell.name,meshes:meshes.length});
   const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),shell.rotation);
   const world=p=>new THREE.Vector3(...p).applyQuaternion(rotation).add(new THREE.Vector3(...shell.center));
   const ray=(p,dir,label)=>{
    rayCount++;const caster=new THREE.Raycaster(world(p),new THREE.Vector3(...dir).applyQuaternion(rotation),0,.6);
    if(!caster.intersectObjects(meshes,false).length)wallFailures.push({name:shell.name,label,p});
   };
   for(const y of [.15,1.4,3.8,5.19,5.21,shell.height-.15]){
    for(const v of [-shell.depth/2+.5,0,shell.depth/2-.5])for(const side of [-1,1])ray([side*(shell.width/2+.2),y,v],[-side,0,0],'outside side wall');
    for(const u of [-shell.width/2+.6,0,shell.width/2-.6])ray([u,y,-shell.depth/2-.2],[0,0,1],'outside rear wall');
   }
   for(const side of [-1,1])ray([side*(shell.width/2-.5),2.6,0],[side,0,0],'inside side wall');
   ray([0,2.6,-shell.depth/2+.5],[0,0,-1],'inside rear wall');
  }
  check(wallMaterials.length===2&&wallMaterials.every(m=>m.meshes>0)&&!wallFailures.length,'Both shops have solid side/rear walls from the ground floor to the roof, visible from inside and outside',{rayCount,wallMaterials,wallFailures});
  district.userData.setWeather('clear','day');const clear=district.userData.getSnapshot().outerMarket;
  district.userData.setWeather('fog','night');const fog=district.userData.getSnapshot().outerMarket;
  district.userData.setWeather('rain','day');const rain=district.userData.getSnapshot().outerMarket;
  check(fog.haloOpacity>clear.haloOpacity&&rain.spillOpacity>clear.spillOpacity,'Haze and wet-ground glow follow the weather',{clear,fog,rain});
  // Compile and render the actual new meshes to catch GLSL/instancing errors cheaply.
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2('#869eaf',.011);scene.add(lights);
  const camera=new THREE.PerspectiveCamera(60,1,.1,600);camera.position.set(40,18,-5);camera.lookAt(110,-12,60);
  const renderer=new THREE.WebGLRenderer();renderer.setSize(320,320);renderer.render(scene,camera);
  check(renderer.info.render.calls===4,'All four light batches render with their real shaders',{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles});
  renderer.dispose();
  return {checks,outerMarket:outer,movedStalls:initial.market.stalls.filter(s=>['myco','spice'].includes(s.type))};
 });result.errors=errors;await writeFile(output+'/outer-market-check.json',JSON.stringify(result,null,2));console.log(JSON.stringify({checks:result.checks.map(({passed,name})=>({passed,name})),clusters:result.outerMarket.clusterCount,vendors:result.outerMarket.vendorCount,errors},null,2));assert.ok(result.checks.every(c=>c.passed));assert.equal(errors.length,0);
}finally{await browser.close();}
