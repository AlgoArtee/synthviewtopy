import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-16/geometry';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-gpu','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5178/north-city.html');
 const report=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js');const {createOsCityApartment}=await import('/src/apartments/osCityApartment.ts');
  const {CITY_BED}=await import('/src/apartments/osCityLayout.ts');const room=createOsCityApartment();await room.ready;room.scene.updateMatrixWorld(true);
  const meshes=[];room.scene.traverse(o=>{if(o.isMesh&&o.name.endsWith('filled cotton body'))meshes.push(o);});
  const duvet=room.scene.getObjectByName('Duvet · large filled white cotton blanket'),dp=duvet.geometry.attributes.position;
  // Read the actual support triangles, including the blanket's compressed
  // pressure patches. A fixed mattress Y cannot validate pillows on a duvet.
  function surfaceSampler(surfaces){
   const cell=.16,bins=new Map(),triangles=[];
   for(const mesh of surfaces){const p=mesh.geometry.attributes.position,ix=mesh.geometry.index;
    for(let k=0;k<(ix?.count??p.count);k+=3){
     const v=[0,1,2].map(i=>new THREE.Vector3().fromBufferAttribute(p,ix?ix.getX(k+i):k+i).applyMatrix4(mesh.matrixWorld));
     const [a,b,c]=v,det=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(det)<1e-10)continue;
     const n=triangles.length;triangles.push({a,b,c,det});
     for(let x=Math.floor(Math.min(a.x,b.x,c.x)/cell);x<=Math.floor(Math.max(a.x,b.x,c.x)/cell);x++)for(let z=Math.floor(Math.min(a.z,b.z,c.z)/cell);z<=Math.floor(Math.max(a.z,b.z,c.z)/cell);z++){
      const key=x+':'+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(n);
     }
    }
   }
   return(x,z)=>{
    let height=-Infinity;
    for(const n of bins.get(Math.floor(x/cell)+':'+Math.floor(z/cell))??[]){
     const {a,b,c,det}=triangles[n],s=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/det,t=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/det;
     if(s>=-1e-7&&t>=-1e-7&&s+t<=1+1e-7)height=Math.max(height,s*a.y+t*b.y+(1-s-t)*c.y);
    }
    return Number.isFinite(height)?height:null;
   };
  }
  const sheetAt=surfaceSampler([room.scene.getObjectByName('Bed · fitted sheet'),room.scene.getObjectByName('Bed · relaxed cotton under-sheet')]);
  const duvetAt=surfaceSampler([duvet]);
  const insideTests=new Map();
  const pillows=meshes.map(mesh=>{
   const p=mesh.geometry.attributes.position,ix=mesh.geometry.index,edges=new Map(),bins=new Map(),cell=.05,bounds=new THREE.Box3().setFromObject(mesh);
   const windowPillow=!!mesh.parent.userData.windowPillow,supportAt=windowPillow?duvetAt:sheetAt;
   let volume=0,rearArea=0,baseArea=0,minSupportClearance=Infinity,supportMisses=0,minBlanketThickness=Infinity;const tris=[],clearances=[];
   for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i),height=supportAt(x,z),sheetHeight=windowPillow?sheetAt(x,z):null;
    const clearance=height===null?null:p.getY(i)-height;clearances.push(clearance);
    if(clearance===null)supportMisses++;else minSupportClearance=Math.min(minSupportClearance,clearance);
    if(windowPillow&&height!==null&&sheetHeight!==null)minBlanketThickness=Math.min(minBlanketThickness,height-sheetHeight);
   }
   for(let i=0;i<ix.count;i+=3){const ids=[ix.getX(i),ix.getX(i+1),ix.getX(i+2)],v=ids.map(n=>new THREE.Vector3().fromBufferAttribute(p,n));
    volume+=v[0].dot(v[1].clone().cross(v[2]))/6;
    for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],key=Math.min(a,b)+':'+Math.max(a,b);edges.set(key,(edges.get(key)??0)+1);}
    const cross=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])),area=cross.length()*.5;
    if(v.every(a=>a.x>CITY_BED.maxX-.012))rearArea+=area;
    if(cross.y<0&&ids.every(n=>clearances[n]!==null&&clearances[n]>=-.002&&clearances[n]<.024))baseArea+=area;
    const n=tris.length;tris.push(v);
    for(let x=Math.floor(Math.min(...v.map(a=>a.x))/cell);x<=Math.floor(Math.max(...v.map(a=>a.x))/cell);x++)for(let z=Math.floor(Math.min(...v.map(a=>a.z))/cell);z<=Math.floor(Math.max(...v.map(a=>a.z))/cell);z++){const key=x+':'+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(n);}
   }
   const inside=(x,y,z)=>{
    const ys=[];for(const n of bins.get(Math.floor(x/cell)+':'+Math.floor(z/cell))??[]){const [a,b,c]=tris[n],det=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(det)<1e-10)continue;
     const s=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/det,t=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/det;
     if(s>=-1e-7&&t>=-1e-7&&s+t<=1+1e-7)ys.push(s*a.y+t*b.y+(1-s-t)*c.y);
    }
    ys.sort((a,b)=>a-b);const unique=ys.filter((a,i)=>!i||a-ys[i-1]>1e-5);
    for(let i=0;i+1<unique.length;i+=2)if(y>unique[i]+.002&&y<unique[i+1]-.002)return true;return false;
   };
   insideTests.set(mesh,inside);
   let duvetVerticesInside=0;for(let i=0;i<dp.count;i++){const x=dp.getX(i),y=dp.getY(i),z=dp.getZ(i);if(x<bounds.min.x||x>bounds.max.x||z<bounds.min.z||z>bounds.max.z)continue;if(inside(x,y,z))duvetVerticesInside++;}
   const cameraInside=room.viewpoints.filter(v=>v.id.startsWith('pillow')||v.id==='duvet-pillow-edge'||v.id.startsWith('cat-')).filter(v=>inside(...v.position.toArray())).map(v=>v.id);
   const material=Array.isArray(mesh.material)?mesh.material:[mesh.material];
   return{name:mesh.name,materials:material.map(m=>({map:m.map?.name??null,roughness:m.roughness,emissive:m.emissive?.getHexString(),transparent:m.transparent})),groups:mesh.geometry.groups,metadata:mesh.userData.pillow,size:bounds.getSize(new THREE.Vector3()).toArray(),min:bounds.min.toArray(),max:bounds.max.toArray(),volume,nonManifoldEdges:[...edges.values()].filter(n=>n!==2).length,rearContactArea:rearArea,baseContactArea:baseArea,support:{layer:windowPillow?'duvet':'sheet',samples:p.count,misses:supportMisses,minClearance:minSupportClearance,minBlanketThickness:windowPillow?minBlanketThickness:null},duvetVerticesInside,cameraInside};
  });
  const contacts=[];
  const cats=meshes.filter(m=>m.userData.pillow.decorative);
  for(const cat of cats){const p=cat.geometry.attributes.position;
   for(const carrier of meshes){if(carrier===cat)continue;const bounds=new THREE.Box3().setFromObject(carrier);let verticesInside=0;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(x<bounds.min.x||x>bounds.max.x||y<bounds.min.y||y>bounds.max.y||z<bounds.min.z||z>bounds.max.z)continue;if(insideTests.get(carrier)(x,y,z))verticesInside++;}
    if(verticesInside)contacts.push({cushion:cat.name,carrier:carrier.name,verticesInside});
   }
  }
  const result={pillows,contacts,duvet:duvet.userData.duvet};room.dispose();return result;
 });
 await writeFile(out+'/pillows.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 assert.equal(report.pillows.length,13);
 assert.deepEqual(report.contacts,[],'Decorative cushions must not penetrate the other filled pillows at sampled vertices');
 const cats=report.pillows.filter(p=>p.metadata.decorative);
 assert.equal(cats.length,7);assert.equal(cats.filter(p=>p.metadata.betweenLargePillows).length,3);
 for(const p of cats){assert.ok(p.size[0]>.25&&p.size[1]>.60&&p.size[1]<.80,'Small cushions retain puffy three-dimensional fill');assert.equal(p.materials.length,2);assert.match(p.materials[0].map,/Cotton print/);assert.equal(p.materials[1].map,null,'Backs remain plain white cotton');assert.equal(p.materials[0].emissive,'000000','Ink is matte, not a luminous decal');assert.equal(p.groups.length,2);}
 const windowPillows=report.pillows.filter(p=>p.support.layer==='duvet');assert.equal(windowPillows.length,2);
 for(const p of windowPillows){assert.equal(p.support.misses,0,p.name+' continuous duvet beneath complete pillow footprint');assert.ok(p.support.minBlanketThickness>.05,p.name+' retains real blanket fill beneath pillow');assert.ok(p.baseContactArea>.8,p.name+' broad duvet contact');assert.equal(p.metadata.underlyingLayer,'continuous compressed duvet');}
 for(const p of report.pillows){assert.equal(p.nonManifoldEdges,0,p.name+' closed shell');assert.ok(p.volume>.08,p.name+' positive filled volume');assert.equal(p.duvetVerticesInside,0,p.name+' must not intersect duvet');assert.deepEqual(p.cameraInside,[]);assert.ok(p.support.minClearance>=-.002,p.name+' must not penetrate its actual support');assert.ok(p.baseContactArea>.005,p.name+' broad contact with actual '+p.support.layer);if(p.metadata.wallGap){assert.ok(p.rearContactArea>.40,p.name+' broad wall contact');assert.ok(p.size[0]>.45&&p.size[0]<.65);}}
 console.log('PILLOW AUDIT PASSED');
}finally{await browser.close();}
