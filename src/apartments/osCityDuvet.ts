import * as THREE from 'three'
import { CITY_BED } from './osCityLayout'
import { CITY_PILLOW_EDGE, cityWindowPillowPressureAt } from './osCityPillows'

// The material is larger than the wall-fitted mattress. Excess fabric is gathered
// towards the TV side; only the open part of the foot can hang into the room.
export function createOsCityDuvet(
  cotton:THREE.Material,
  sampleSheet:(x:number,z:number)=>number,
  noise:(x:number,z:number)=>number,
  pillowFrontAtZ:(z:number)=>number=()=>0,
) {
  const group=new THREE.Group();group.name='Oversized softly gathered white duvet';
  const cut={width:9.10,depth:10.30};
  const smooth=THREE.MathUtils.smoothstep;
  // Continuous cotton passes beneath both window pillows and ends at the glass.
  // Millimetre variation leaves a soft hem without exposing a sheet-only strip.
  const north=(u:number)=>CITY_BED.minZ+CITY_PILLOW_EDGE.headInset+.009*noise(u*7,3)+.006*Math.sin(u*6.2);
  const west=(_v:number)=>CITY_BED.minX;
  const sidePillowZone=(v:number)=>1-smooth(v,.91,1);
  const east=(v:number)=>{const z=THREE.MathUtils.lerp(CITY_BED.minZ+CITY_PILLOW_EDGE.headInset,CITY_BED.maxZ,v);
    const relaxed=CITY_PILLOW_EDGE.sideInset+.052*noise(v*10,7)+.020*Math.sin(v*19.1)+.023*Math.sin(v*7.3+.9);
    const contact=pillowFrontAtZ(z)+.012;
    const depth=(relaxed+contact+Math.sqrt((relaxed-contact)**2+.022**2))*.5;
    return CITY_BED.maxX-depth*sidePillowZone(v);};
  const atX=(u:number,v:number)=>THREE.MathUtils.lerp(west(v),east(v),u-.065*Math.sin(u*Math.PI));
  const foot=(u:number)=>{
    const x=atX(u,1),open=smooth(x,-4.69,-4.40)*(1-smooth(x,-2.65,-1.98));
    const bow=.46+.075*Math.exp(-Math.pow((x+3.84)/.39,2))-.065*Math.exp(-Math.pow((x+2.93)/.37,2))+.085*Math.exp(-Math.pow((x+2.05)/.46,2));
    return CITY_BED.maxZ+open*bow;
  };
  const creases=Array.from({length:43},(_,i)=>({
    x:CITY_BED.minX+.52+((i*.381966)%1)*6.8,
    z:CITY_BED.minZ+1.10+((i*.618034)%1)*6.9,
    angle:i*.83-.7,length:.31+(i%6)*.15,width:.075+(i%5)*.019,height:.026+(i%4)*.014,
  }));
  const point=(u:number,v:number)=>{
    const x=atX(u,v),z=THREE.MathUtils.lerp(north(u),foot(u),v)+.027*Math.sin(v*Math.PI)*noise(u*12,v*6);
    const edge=smooth(Math.min(u,1-u,v,1-v),0,.032);
    const open=smooth(x,-4.69,-4.40)*(1-smooth(x,-2.65,-1.98));
    const hang=open*smooth(z,CITY_BED.maxZ-.18,foot(u));
    // Unequal gravity folds leave a gently scalloped, thin hem rather than a
    // straight upholstered face. The seam hangs at different heights and depths.
    const hemY=.40-.145*Math.exp(-Math.pow((x+3.82)/.36,2))-.125*Math.exp(-Math.pow((x+2.08)/.40,2))+.065*Math.exp(-Math.pow((x+2.90)/.35,2));
    const support=THREE.MathUtils.lerp(sampleSheet(x,Math.min(z,CITY_BED.maxZ-.14))+.004,hemY,hang);
    const fold1=west(v)+.65+.20*Math.sin(v*9)+.10*noise(v*8,2);
    const fold2=west(v)+1.62+.31*Math.sin(v*7.2+.5);
    // The displaced cotton rolls merge and taper into quiet patches instead of
    // continuing as parallel rails from the head to the foot of the mattress.
    const gather1=.49*Math.exp(-Math.pow((z+5.85)/1.23,4))+.29*Math.exp(-Math.pow((z+3.02)/.73,4));
    const gather2=.37*Math.exp(-Math.pow((z+5.22)/1.12,4))+.24*Math.exp(-Math.pow((z+7.35)/.61,4));
    let lift=gather1*Math.exp(-Math.pow((x-fold1)/(.27+.055*Math.sin(v*5)),2))
      +gather2*Math.exp(-Math.pow((x-fold2)/(.32+.05*Math.cos(v*8)),2));
    lift+=.19*Math.exp(-Math.pow((x+6.60-.31*Math.sin(z*1.1))/.30,2)-Math.pow((z+4.24)/1.18,4));
    lift+=.13*Math.exp(-Math.pow((z+2.40+.25*Math.sin(x*1.4))/.27,2)-Math.pow((x+5.3)/1.52,4));
    // A partly turned corner has no ruler-straight fold running across the bed.
    const headFold=.10+.024*Math.sin(u*8)+.018*noise(u*10,3);
    lift+=.16*(1-smooth(u,.48,.79))*Math.exp(-Math.pow((v-headFold)/.030,2));
    for(const c of creases){
      const dx=x-c.x,dz=z-c.z,along=dx*Math.cos(c.angle)+dz*Math.sin(c.angle),across=-dx*Math.sin(c.angle)+dz*Math.cos(c.angle)-.12*along*along;
      const envelope=Math.exp(-Math.pow(along/c.length,4));
      lift+=c.height*envelope*(Math.exp(-Math.pow(across/c.width,2))-.23*Math.exp(-Math.pow((across-c.width*1.45)/(c.width*.67),2)));
    }
    // Keep the complete lower TV edge and optical rail above the bedding.
    // A smooth reduction of loft/rolls avoids a clipped plateau under the screen.
    const tvZone=(1-smooth(x,CITY_BED.minX+2.4,CITY_BED.minX+3.3))*smooth(z,CITY_BED.centerZ-3.415,CITY_BED.centerZ-2.915)*(1-smooth(z,CITY_BED.centerZ+2.0,CITY_BED.centerZ+2.45));
    lift*=1-tvZone*.87;
    const bulk=(.255+.035*noise(x*1.5+8,z*1.7)+.016*noise(x*4.1,z*3.9))*(1-tvZone*.18);
    let bottom=support+Math.max(0,lift)*edge*(1-hang);
    let top=bottom+.030+edge*bulk*(1-hang*.72);
    // The north hem is thin at the glass; the east hem still settles at the
    // upright cushion fronts. The window pillows press into continuous filling.
    const headPressure=1-smooth(v,0,.028),sidePressure=(1-smooth(east(v)-x,0,.52))*sidePillowZone(v);
    const pressure=Math.max(headPressure,sidePressure);
    bottom=THREE.MathUtils.lerp(bottom,support,pressure);
    let edgeCotton=0;
    for(const c of [[-8.65,.22,.018],[-7.42,.30,.012],[-5.88,.25,.017],[-4.78,.35,.012],[-3.15,.23,.015],[-1.82,.26,.010]]){
      const across=z-c[0]-.30*(east(v)-x),q=across/c[1];
      edgeCotton+=c[2]*Math.exp(-q*q)*Math.exp(-Math.pow((east(v)-x)/.42,2));
    }
    const compressedHem=.042+.018*noise(x*4,z*3)+.017*(.5+.5*Math.sin(z*2.3+.6))*Math.exp(-Math.pow((z+4.7)/3.1,2));
    top=THREE.MathUtils.lerp(top,support+compressedHem+edgeCotton,pressure);
    const pillowPressure=cityWindowPillowPressureAt(x,z);
    bottom=THREE.MathUtils.lerp(bottom,support,pillowPressure);
    const compressedFill=.076+.006*noise(x*3,z*3);
    top=THREE.MathUtils.lerp(top,support+compressedFill,pillowPressure);
    return {x,z,top,bottom};
  };
  const nx=176,nz=184,positions:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let face=0;face<2;face++)for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const u=i/nx,v=j/nz,p=point(u,v);
    positions.push(p.x,face===0?p.top:p.bottom,p.z);uv.push(u*cut.width,v*cut.depth);
    if(i<nx&&j<nz){const k=face*(nx+1)*(nz+1)+j*(nx+1)+i;
      face===0?indices.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2):indices.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);
    }
  }
  const half=(nx+1)*(nz+1),border:number[]=[],seam:THREE.Vector3[]=[];
  for(let i=0;i<=nx;i++)border.push(i);for(let j=1;j<=nz;j++)border.push(j*(nx+1)+nx);
  for(let i=nx-1;i>=0;i--)border.push(nz*(nx+1)+i);for(let j=nz-1;j>0;j--)border.push(j*(nx+1));
  for(let i=0;i<border.length;i++){
    const a=border[i],b=border[(i+1)%border.length];indices.push(a,b,b+half,a,b+half,a+half);
    seam.push(new THREE.Vector3(positions[a*3],(positions[a*3+1]+positions[(a+half)*3+1])*.5,positions[a*3+2]));
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const body=new THREE.Mesh(geometry,cotton);body.name='Duvet · large filled white cotton blanket';body.castShadow=body.receiveShadow=true;group.add(body);
  const hemMaterial=new THREE.MeshStandardMaterial({color:'#f4f3ee',roughness:1});
  const hem=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seam,true),640,.0014,5,true),hemMaterial);
  hem.name='Duvet · soft sewn perimeter hem';hem.castShadow=false;hem.receiveShadow=true;group.add(hem);
  // Spatially indexed actual top triangles measure the final blanket height,
  // including diagonal edges, soft rolls and the hanging foot, without raycast scans.
  const cell=.16,bins=new Map<string,number[]>();
  const key=(x:number,z:number)=>Math.floor(x/cell)+':'+Math.floor(z/cell);
  for(let n=0;n<nx*nz*6;n+=3){
    const a=indices[n]*3,b=indices[n+1]*3,c=indices[n+2]*3;
    const minX=Math.floor(Math.min(positions[a],positions[b],positions[c])/cell),maxX=Math.floor(Math.max(positions[a],positions[b],positions[c])/cell);
    const minZ=Math.floor(Math.min(positions[a+2],positions[b+2],positions[c+2])/cell),maxZ=Math.floor(Math.max(positions[a+2],positions[b+2],positions[c+2])/cell);
    for(let ix=minX;ix<=maxX;ix++)for(let iz=minZ;iz<=maxZ;iz++){const k=ix+':'+iz,bucket=bins.get(k)??[];bucket.push(n);bins.set(k,bucket);}
  }
  const heightAt=(x:number,z:number)=>{
    let height=sampleSheet(x,z);
    for(const n of bins.get(key(x,z))??[]){
      const a=indices[n]*3,b=indices[n+1]*3,c=indices[n+2]*3;
      const ax=positions[a],az=positions[a+2],bx=positions[b],bz=positions[b+2],cx=positions[c],cz=positions[c+2];
      const den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);
      if(Math.abs(den)<1e-10)continue;
      const wa=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/den,wb=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/den,wc=1-wa-wb;
      if(Math.min(wa,wb,wc)>=-1e-6)height=Math.max(height,wa*positions[a+1]+wb*positions[b+1]+wc*positions[c+1]);
    }
    return height;
  };
  const span=(horizontal:boolean,line:number)=>{
    let result=0;const count=horizontal?nx:nz;
    for(let i=1;i<=count;i++){
      const a=(horizontal?line*(nx+1)+i-1:(i-1)*(nx+1)+line)*3,b=(horizontal?line*(nx+1)+i:i*(nx+1)+line)*3;
      const ay=(positions[a+1]+positions[a+half*3+1])*.5,by=(positions[b+1]+positions[b+half*3+1])*.5;
      result+=Math.hypot(positions[b]-positions[a],positions[b+2]-positions[a+2],by-ay);
    }
    return result;
  };
  const widthSpans=Array.from({length:nz+1},(_,j)=>span(true,j));
  const depthSpans=Array.from({length:nx+1},(_,i)=>span(false,i));
  body.userData.duvet={width:cut.width,depth:cut.depth,unfoldedSize:[cut.width,cut.depth],closedShell:true,nominalLoft:.255,fill:'down',color:'white',gatheredSide:'west / TV',offCentre:true,openFootDrape:true,wallFittedSeams:['west','south return'],stopsAtPillowFronts:false,stopsAtEastCushionFronts:true,underPillows:true,underWindowPillows:2,windowPillowCompressedLoft:.076,headInset:CITY_PILLOW_EDGE.headInset,sideInset:CITY_PILLOW_EDGE.sideInset,televisionClear:true,foldedBackHeadEdge:'partial irregular corner',surfaceWidth:Math.max(...widthSpans),surfaceDepth:Math.max(...depthSpans)};
  return {group,heightAt,metadata:body.userData.duvet};
}
