import * as THREE from 'three';
import { CITY_BED } from './osCityLayout';
import { createCatPillowPrint } from './osCityCatPillowArt';

type Noise=(x:number,z:number)=>number;
type Support=(x:number,z:number)=>number;

/** The blanket reaches the window; its east edge still meets the upright cushions. */
export const CITY_PILLOW_EDGE={headInset:.025,sideInset:.48};
const WINDOW_PILLOWS=[
  {name:'relaxed west',w:1.37,d:1.02,loft:.365,x:-7.76,z:CITY_BED.minZ+.65,yaw:-.19,pattern:4},
  {name:'relaxed east',w:1.42,d:1.04,loft:.380,x:-3.22,z:CITY_BED.minZ+.65,yaw:.20,pattern:5},
];
/** A feathered pressure patch lets continuous duvet cloth settle beneath each pillow. */
export function cityWindowPillowPressureAt(x:number,z:number){
  let pressure=0;
  for(const spec of WINDOW_PILLOWS){
    const dx=x-spec.x,dz=z-spec.z;
    const lx=dx*Math.cos(spec.yaw)-dz*Math.sin(spec.yaw),lz=dx*Math.sin(spec.yaw)+dz*Math.cos(spec.yaw);
    const radius=Math.max(Math.abs(lx)/(spec.w*.5),Math.abs(lz)/(spec.d*.5));
    pressure=Math.max(pressure,1-THREE.MathUtils.smoothstep(radius,.84,1.48));
  }
  return pressure;
}
const WALL_PILLOWS=[
  {name:'north',width:1.64,height:1.13,z:-8.40,loft:.395,pattern:0},
  {name:'upper',width:1.56,height:1.24,z:-6.36,loft:.414,pattern:1},
  {name:'lower',width:1.62,height:1.09,z:-4.31,loft:.392,pattern:2},
  {name:'south',width:1.58,height:1.16,z:-2.23,loft:.409,pattern:3},
];
function rng(seed:number){return()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}
function wrinkles(pattern:number){
  const r=rng(9473+pattern*913);
  return Array.from({length:88},()=>({edge:Math.floor(r()*4),at:r()*1.84-.92,length:.065+r()*.22,width:.013+r()*.017,depth:.004+r()*.007,slope:(r()-.5)*1.25,curve:(r()-.5)*1.9,branch:r()>.63}));
}
function creaseAt(u:number,v:number,creases:ReturnType<typeof wrinkles>){
  let value=0;
  for(const c of creases){
    const across=c.edge<2?u:v,along=c.edge<2?v:u,sign=c.edge%2?1:-1,into=1-sign*across;
    const centre=c.at+c.slope*into+c.curve*into*into,q=(along-centre)/c.width;
    const end=Math.exp(-Math.pow(into/c.length,3));
    value+=c.depth*end*(-Math.exp(-q*q)+.36*Math.exp(-Math.pow((q-1.6)/1.2,2)));
    if(c.branch){const branch=(along-centre+.10*into)/(c.width*.62);value-=c.depth*.29*end*Math.exp(-branch*branch)*Math.sin(Math.min(1,into)*Math.PI);}
  }
  return value;
}
/** Two cloth panels and a rounded narrow side band, sharing boundary vertices. */
function shell(nu:number,nv:number,point:(u:number,v:number,front:boolean)=>THREE.Vector3,dimensions:THREE.Vector2){
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];
  const row=nu+1,half=row*(nv+1);
  for(let face=0;face<2;face++)for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
    const p=point(i/nu*2-1,j/nv*2-1,face===0);positions.push(p.x,p.y,p.z);uv.push(i/nu*dimensions.x,j/nv*dimensions.y);
    if(i<nu&&j<nv){const k=face*half+j*row+i;
      face===0?indices.push(k,k+1,k+row,k+1,k+row+1,k+row):indices.push(k,k+row,k+1,k+1,k+row,k+row+1);
    }
  }
  const border:number[]=[];
  for(let i=0;i<=nu;i++)border.push(i);for(let j=1;j<=nv;j++)border.push(j*row+nu);
  for(let i=nu-1;i>=0;i--)border.push(nv*row+i);for(let j=nv-1;j>0;j--)border.push(j*row);
  // A soft sidewall retains real thickness at the seam instead of a knife edge.
  const bands=[border];const seam:THREE.Vector3[]=[];
  for(let band=1;band<4;band++){
    const ring:number[]=[],t=band/4;
    for(let n=0;n<border.length;n++){
      const a=border[n]*3,b=(border[n]+half)*3;
      const pa=new THREE.Vector3(positions[a],positions[a+1],positions[a+2]),pb=new THREE.Vector3(positions[b],positions[b+1],positions[b+2]);
      const p=pa.lerp(pb,t);ring.push(positions.length/3);positions.push(p.x,p.y,p.z);uv.push(n/border.length*dimensions.x,t*.06);
      if(band===2)seam.push(p.clone());
    }bands.push(ring);
  }
  bands.push(border.map(n=>n+half));
  for(let band=0;band<bands.length-1;band++)for(let n=0;n<border.length;n++){
    const next=(n+1)%border.length,a=bands[band][n],b=bands[band][next],c=bands[band+1][n],d=bands[band+1][next];
    indices.push(a,c,b,b,c,d);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  return{geometry,seam};
}
export function createCityBedPillows(cotton:THREE.MeshPhysicalMaterial,seamMaterial:THREE.Material,support:Support,noise:Noise){
  const group=new THREE.Group();group.name='Bed · filled cotton pillows and staggered cat cushions';
  const specs:Record<string,unknown>[]=[],toeSamples:{z:number,depth:number}[]=[],wallBodies:THREE.Mesh[]=[];
  function add(name:string,geometry:THREE.BufferGeometry,seam:THREE.Vector3[],wall?:'east',compressedBase=!!wall){
    const p=new THREE.Group();p.name=name;p.userData.supportWall=wall??'fitted sheet';
    const closedCotton=cotton.clone();closedCotton.side=THREE.FrontSide;closedCotton.shadowSide=THREE.BackSide;
    const body=new THREE.Mesh(geometry,closedCotton);body.name=name+' · filled cotton body';body.castShadow=body.receiveShadow=true;p.add(body);
    // Sewn edges follow the actual panel band. Interpolating hundreds of nearly
    // coincident compressed-base points with a cubic spline can overshoot onto
    // the sheet, leaving detached dotted tails. A piecewise linear curve cannot.
    // At the compressed base the seam is buried in cloth; only its upper run is visible.
    const visible=compressedBase?seam.filter(pt=>pt.y>support(pt.x,pt.z)+.022):seam;
    class SewnEdge extends THREE.Curve<THREE.Vector3>{
      constructor(){super();}
      getPoint(t:number,target=new THREE.Vector3()){
        const segments=compressedBase?visible.length-1:visible.length,f=t*segments,i=Math.min(Math.floor(f),segments-1);
        return target.copy(visible[i]).lerp(visible[(i+1)%visible.length],f-i);
      }
      getPointAt(t:number,target=new THREE.Vector3()){return this.getPoint(t,target);}
    }
    const piping=new THREE.Mesh(new THREE.TubeGeometry(new SewnEdge(),visible.length,.0012,5,!compressedBase),seamMaterial);piping.name=name+' · narrow sewn cotton edge';
    // Millimetre stitches receive body shading; a 14mm shadow texel cannot
    // represent their shadow accurately on the sheet.
    piping.castShadow=false;piping.receiveShadow=true;p.add(piping);group.add(p);
    return {p,body};
  }
  for(const spec of WALL_PILLOWS){
    const {width:w,height:h,z,loft,pattern}=spec,creases=wrinkles(pattern);
    const point=(u:number,v:number,front:boolean)=>{
      const t=(v+1)/2,fill=Math.pow(Math.max(0,(1-u*u)*(1-v*v)),.51);
      const corner=Math.pow(Math.abs(u),7),side=1-(.073+pattern*.008)*Math.sin(t*Math.PI)+.020*noise(v*6,pattern+8);
      const settling=Math.exp(-Math.pow(t/.16,2));
      const flaredCorner=(.025+.030*(u*(pattern%2?1:-1)+1)*.5)*corner*settling;
      const pz=z+u*(w*.5*side+flaredCorner)+.028*(pattern%2?1:-1)*Math.sin(t*Math.PI*.7)+.007*noise(v*7+pattern,4)*(1-fill);
      // The seam changes lean gently; the fill has its own rounded front/rear body.
      const seamDepth=.102+(.030+pattern*.016)*(1-t)+.020*noise(v*6,pattern+3)+(.07+.035*(pattern%2))*corner*settling;
      const lowerFullness=(.060+pattern*.006)*Math.exp(-Math.pow((t-.22)/.20,2))*(1-u*u);
      const bulk=loft*fill*(1+.085*noise(u*2.1+pattern,v*2.5)+.040*u)+lowerFullness;
      const crease=creaseAt(u,v,creases)+.007*noise(u*8+pattern,v*9)+.003*noise(u*19+pattern,v*21);
      let depth=front?seamDepth+.005+bulk+crease*fill:seamDepth-.005-loft*1.23*fill+crease*.16;
      // Broad, slightly uneven pressure patch against the wall. Corners remain soft.
      if(!front)depth=.004+Math.max(0,depth-.004);
      depth=Math.max(.004,depth);
      const px=CITY_BED.maxX-depth;
      const rest=support(CITY_BED.maxX-.24,z)+.002;
      const base=rest;
      const lowerCorner=(.005+.004*noise(u*3+pattern,8))*corner*settling;
      const topDent=(.068+.017*pattern)*Math.exp(-Math.pow((u-(pattern%2?.15:-.18))/.43,2))*THREE.MathUtils.smoothstep(t,.78,1);
      const settle=.071+pattern*.009;
      // Monotone rounded compression avoids almost coplanar sliver faces at
      // the toe: their old overlapping facets read as detached dotted threads.
      const settledT=(t-settle*(1-Math.exp(-t/settle)))/(1-settle*(1-Math.exp(-1/settle)));
      const cornerCurl=.016*Math.pow(Math.abs(u),6)*THREE.MathUtils.smoothstep(t,.78,1)*(1+.7*u*(pattern%2?1:-1));
      const py=base+h*settledT+lowerCorner-topDent+cornerCurl+.006*noise(u*5+pattern,v*6)*Math.sin(t*Math.PI);
      return new THREE.Vector3(px,py,pz);
    };
    const result=shell(144,128,point,new THREE.Vector2(w,h));
    const {p,body}=add('Bed pillow · east wall '+spec.name,result.geometry,result.seam,'east');
    const bounds=new THREE.Box3().setFromObject(p,true),position=result.geometry.attributes.position;
    let backContact=0,baseContact=0;
    for(let i=0;i<position.count;i++){
      if(position.getX(i)>CITY_BED.maxX-.012)backContact++;
      if(position.getY(i)<support(position.getX(i),position.getZ(i))+.018)baseContact++;
      if(position.getY(i)<.84)toeSamples.push({z:position.getZ(i),depth:CITY_BED.maxX-position.getX(i)});
    }
    const metadata={kind:'wall-compressed down/feather cotton pillow',width:w,height:h,sideLoft:bounds.max.x-bounds.min.x,rearContactVertices:backContact,baseContactVertices:baseContact,wallGap:.004,underlyingLayer:'fitted sheet',pattern};
    body.userData.pillow=metadata;wallBodies.push(body);specs.push({name:p.name,...metadata});
  }
  for(const spec of WINDOW_PILLOWS){
    const creases=wrinkles(spec.pattern);
    // The geometry helper's winding expects vertical panels; map their axes to X/Y/Z.
    const point=(u:number,v:number,front:boolean)=>{
      const fill=Math.pow(Math.max(0,(1-u*u)*(1-v*v)),.39);
      const lx=u*spec.w*.5*(1-.055*Math.pow(v,8)),lz=v*spec.d*.5*(1-.055*Math.pow(u,8));
      const x=spec.x+lx*Math.cos(spec.yaw)+lz*Math.sin(spec.yaw),z=spec.z-lx*Math.sin(spec.yaw)+lz*Math.cos(spec.yaw);
      const base=support(x,z)+.002;
      const y=front?base+.018+spec.loft*fill*(1+.055*noise(u*2+spec.pattern,v*2.4))+creaseAt(u,v,creases)*fill:base+.015*(1-fill);
      // Flip U to preserve outward orientation when the front panel lies horizontal.
      return new THREE.Vector3(x,y,z);
    };
    const result=shell(78,64,point,new THREE.Vector2(spec.w,spec.d));
    // X×Z points down: reverse the complete shell's orientation for a horizontal pillow.
    const ix=result.geometry.index!;for(let i=0;i<ix.count;i+=3){const b=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,b);}result.geometry.computeVertexNormals();
    const {p,body}=add('Bed pillow · '+spec.name,result.geometry,result.seam);
    p.userData.windowPillow=true;
    body.userData.pillow={kind:'compressed down/feather cotton pillow',width:spec.w,depth:spec.d,loft:spec.loft,underlyingLayer:'fitted sheet',pattern:spec.pattern};specs.push({name:p.name,...body.userData.pillow});
  }
  // A coarse Y/Z front-support field lets the new cushions compress against
  // actual large-pillow surfaces, while staying in front of their filled volume.
  const cellYZ=.018,frontField=new Map<string,number>();
  for(const body of wallBodies){
    const pos=body.geometry.attributes.position,indices=body.geometry.index!;
    for(let k=0;k<indices.count;k+=3){
      const a=new THREE.Vector3().fromBufferAttribute(pos,indices.getX(k)),b=new THREE.Vector3().fromBufferAttribute(pos,indices.getX(k+1)),d=new THREE.Vector3().fromBufferAttribute(pos,indices.getX(k+2));
      const det=(b.z-d.z)*(a.y-d.y)+(d.y-b.y)*(a.z-d.z);if(Math.abs(det)<1e-10)continue;
      for(let iy=Math.floor(Math.min(a.y,b.y,d.y)/cellYZ);iy<=Math.ceil(Math.max(a.y,b.y,d.y)/cellYZ);iy++)for(let iz=Math.floor(Math.min(a.z,b.z,d.z)/cellYZ);iz<=Math.ceil(Math.max(a.z,b.z,d.z)/cellYZ);iz++){
        const y=iy*cellYZ,z=iz*cellYZ,sa=((b.z-d.z)*(y-d.y)+(d.y-b.y)*(z-d.z))/det,sb=((d.z-a.z)*(y-d.y)+(a.y-d.y)*(z-d.z))/det;
        if(sa<0||sb<0||sa+sb>1)continue;
        const key=iy+':'+iz,x=sa*a.x+sb*b.x+(1-sa-sb)*d.x;frontField.set(key,Math.min(frontField.get(key)??Infinity,x));
      }
    }
  }
  const carrierAt=(y:number,z:number)=>{
    const iy=Math.floor(y/cellYZ),iz=Math.floor(z/cellYZ);let x=Infinity;
    for(let a=0;a<=1;a++)for(let b=0;b<=1;b++)x=Math.min(x,frontField.get((iy+a)+':'+(iz+b))??Infinity);
    return x;
  };
  const catCentres=WALL_PILLOWS.flatMap((p,i)=>i===WALL_PILLOWS.length-1?[p.z]:[p.z,(p.z+WALL_PILLOWS[i+1].z)*.5]);
  for(const [index,z] of catCentres.entries()){
    const between=index%2===1,w=between?.80:.86,h=between?.69:.75,pattern=6+index,creases=wrinkles(pattern),seamDepth=between?.45:.61;
    const base=support(CITY_BED.maxX-.90,z)+.002,lean=.31;
    const point=(u:number,v:number,front:boolean)=>{
      const t=(v+1)/2,fill=Math.pow(Math.max(0,(1-u*u)*(1-v*v)),.48),rounded=1-.14*Math.pow(v,8);
      const pz=z+u*w*.5*rounded+.012*Math.sin(t*Math.PI)*(index%2?1:-1);
      const settle=.11,settledT=(t-settle*(1-Math.exp(-t/settle)))/(1-settle*(1-Math.exp(-1/settle)));
      const py=base+h*settledT-.024*Math.exp(-Math.pow((u-.15)/.44,2))*THREE.MathUtils.smoothstep(t,.80,1)+.003*noise(u*4+pattern,v*4)*Math.sin(t*Math.PI);
      const seam=seamDepth+lean*(1-t)+.008*noise(u*4+pattern,v*5);
      const loft=(front?.235:.205)*fill*(1+.045*noise(u*3+pattern,v*3));
      const crease=creaseAt(u,v,creases)*.42*fill;
      let px=CITY_BED.maxX-seam+(front?-loft-.006+crease:loft+.006);
      if(!front)px=Math.min(px,carrierAt(py,pz)-.008);
      return new THREE.Vector3(px,py,pz);
    };
    const result=shell(64,64,point,new THREE.Vector2(w,h));
    const {p,body}=add('Bed pillow · cat cushion '+(index+1),result.geometry,result.seam,undefined,true);
    // The printed front and plain cotton back share the same actual sewn shell.
    const faceIndices=64*64*6;result.geometry.addGroup(0,faceIndices,0);result.geometry.addGroup(faceIndices,result.geometry.index!.count-faceIndices,1);
    body.userData.catPrint=createCatPillowPrint(index,w,h);
    body.userData.pillow={kind:'puffy cotton cat cushion',decorative:true,width:w,height:h,pattern,betweenLargePillows:between,underlyingLayer:'fitted sheet',print:'Original blue/magenta abstract cat line art; matte textile ink on front only'};
    const positions=result.geometry.attributes.position;
    for(let i=0;i<positions.count;i++)if(positions.getY(i)<.90)toeSamples.push({z:positions.getZ(i),depth:CITY_BED.maxX-positions.getX(i)});
    specs.push({name:p.name,...body.userData.pillow});
  }
  group.userData.pillows={count:13,largeCount:6,decorativeCount:7,decorativeRow:'Four in front of large east-wall pillows; three staggered between them',eastWallCount:4,windowUprightCount:0,underlyingLayer:'fitted sheet',construction:'Full front and rear down/feather volumes; broad wall pressure and spread mattress contact, tapered sewn sidewall, unequal seam-fed cotton folds',headDuvetInset:CITY_PILLOW_EDGE.headInset,sideDuvetInset:CITY_PILLOW_EDGE.sideInset,details:specs};
  // A conservative front profile lets the soft blanket stop at actual compressed
  // pillow toes rather than an arbitrary straight line or an intersecting slab.
  const cell=.035,minZ=CITY_BED.minZ,count=Math.ceil(CITY_BED.depth/cell)+1;
  const profile=new Float64Array(count);
  for(const p of toeSamples){const i=Math.floor((p.z-minZ)/cell);for(let d=-1;d<=1;d++)if(i+d>=0&&i+d<count)profile[i+d]=Math.max(profile[i+d],p.depth+.008);}
  // Smooth conservative envelope keeps the hem outside every contact sample
  // without the hard max kinks of a stepped per-vertex support profile.
  const rounded=new Float64Array(count);
  for(let i=0;i<count;i++){let sum=0;for(let d=-6;d<=6;d++){const k=THREE.MathUtils.clamp(i+d,0,count-1);sum+=Math.exp((profile[k]-.003*d*d)/.020);}rounded[i]=.020*Math.log(sum);}
  group.userData.duvetLimitAtZ=(z:number)=>{const f=THREE.MathUtils.clamp((z-minZ)/cell,0,count-2),i=Math.floor(f);return THREE.MathUtils.lerp(rounded[i],rounded[i+1],f-i);};
  return group;
}

/** Seat the two horizontal pillows on the final triangulated duvet surface.
 * Both cotton panels and the sewn edge receive the same displacement field. */
export function settleCityWindowPillowsOnDuvet(group:THREE.Group,sheetSupport:Support,duvetSupport:Support){
  for(const pillow of group.children){
    if(!pillow.userData.windowPillow)continue;
    pillow.userData.supportWall='compressed duvet';
    pillow.traverse(object=>{
      if(!(object instanceof THREE.Mesh))return;
      const position=object.geometry.attributes.position;
      for(let i=0;i<position.count;i++){
        const x=position.getX(i),z=position.getZ(i);
        position.setY(i,position.getY(i)+duvetSupport(x,z)-sheetSupport(x,z));
      }
      position.needsUpdate=true;object.geometry.computeVertexNormals();
      object.geometry.computeBoundingBox();object.geometry.computeBoundingSphere();
      if(object.userData.pillow)object.userData.pillow.underlyingLayer='continuous compressed duvet';
    });
    const detail=group.userData.pillows.details.find((entry:{name:string})=>entry.name===pillow.name);
    if(detail)detail.underlyingLayer='continuous compressed duvet';
  }
  group.userData.pillows.windowPillowSupport='continuous compressed duvet';
  group.userData.pillows.underlyingLayer='duvet under two window pillows; fitted sheet under east-wall cushions';
}

/** Fine seam puckering layered with the existing scanned cotton weave. This is
 * normal detail only: silhouette, rear pressure and support remain real geometry. */
export function finishCityBedPillowMaterials(root:THREE.Object3D,cotton:THREE.MeshPhysicalMaterial){
  if(!cotton.normalMap?.image)return;
  const n=1024,scan=document.createElement('canvas');scan.width=scan.height=n;
  const sc=scan.getContext('2d')!;sc.drawImage(cotton.normalMap.image,0,0,n,n);
  const grain=sc.getImageData(0,0,n,n).data;
  root.traverse(object=>{
    if(!(object instanceof THREE.Mesh)||!object.userData.pillow)return;
    const spec=object.userData.pillow,w=spec.width,h=spec.height??spec.depth,r=rng(27193+spec.pattern*1471);
    const height=document.createElement('canvas');height.width=height.height=n;
    const ctx=height.getContext('2d')!;ctx.fillStyle='#808080';ctx.fillRect(0,0,n,n);ctx.lineCap='round';
    // Each short pucker draws inward from its sewn edge. Several quiet spans
    // remain intentionally empty; fine detail is not uniform face-wide noise.
    for(let j=0;j<100;j++){
      const edge=Math.floor(r()*4),sign=edge%2?1:-1,at=r()*1.90-.95,length=.025+r()*.12,slope=(r()-.5)*2.2,curve=(r()-.5)*5.8,width=(.0020+r()*.0030)*n*.5;
      const pt=(t:number,offset=0)=>{const into=length*t,across=sign*(1-into),along=at+slope*into+curve*into*into+offset;const u=edge<2?across:along,v=edge<2?along:across;return[(u+1)*n*.5,(1-v)*n*.5];};
      const start=pt(0),end=pt(1),gradient=ctx.createLinearGradient(start[0],start[1],end[0],end[1]);
      gradient.addColorStop(0,'rgba(58,58,58,.78)');gradient.addColorStop(.30,'rgba(80,80,80,.62)');gradient.addColorStop(1,'rgba(128,128,128,0)');
      for(const [scale,alpha] of [[4,.14],[2.2,.25],[1,.46]]){
        ctx.globalAlpha=alpha;ctx.strokeStyle=gradient;ctx.lineWidth=width*scale;ctx.beginPath();
        for(let i=0;i<=12;i++){const p=pt(i/12);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}ctx.stroke();
      }
      const ridge=ctx.createLinearGradient(start[0],start[1],end[0],end[1]);ridge.addColorStop(0,'rgba(190,190,190,.42)');ridge.addColorStop(1,'rgba(128,128,128,0)');ctx.globalAlpha=.44;ctx.strokeStyle=ridge;ctx.lineWidth=width*1.5;ctx.beginPath();
      for(let i=0;i<=12;i++){const p=pt(i/12,width*2/n);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}ctx.stroke();
    }
    ctx.globalAlpha=1;const relief=ctx.getImageData(0,0,n,n).data;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=n;const normalContext=canvas.getContext('2d')!,pixels=normalContext.createImageData(n,n),data=pixels.data;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const p=(y*n+x)*4,left=(y*n+Math.max(0,x-1))*4,right=(y*n+Math.min(n-1,x+1))*4,up=(Math.max(0,y-1)*n+x)*4,down=(Math.min(n-1,y+1)*n+x)*4;
      const sx=Math.floor(((x/n*w*1.9)%1)*n),sy=Math.floor(((y/n*h*1.7)%1)*n),g=(sy*n+sx)*4;
      const gx=(relief[right]-relief[left])/255*.0032/(2*w/n),gy=(relief[down]-relief[up])/255*.0032/(2*h/n);
      const nx=(grain[g]/127.5-1)*.16-gx,ny=(grain[g+1]/127.5-1)*.16+gy,inv=1/Math.sqrt(nx*nx+ny*ny+1);
      data[p]=(nx*inv*.5+.5)*255;data[p+1]=(ny*inv*.5+.5)*255;data[p+2]=(inv*.5+.5)*255;data[p+3]=255;
    }
    normalContext.putImageData(pixels,0,0);const normal=new THREE.CanvasTexture(canvas);normal.wrapS=normal.wrapT=THREE.RepeatWrapping;normal.repeat.set(1/w,1/h);normal.anisotropy=8;normal.name='Cotton weave and unique short seam puckers '+spec.pattern;
    const material=cotton.clone();material.side=THREE.FrontSide;material.shadowSide=THREE.BackSide;material.normalMap=normal;material.normalScale.set(1,1);material.bumpMap=null;material.needsUpdate=true;const previous=Array.isArray(object.material)?object.material:[object.material];
    if(object.userData.catPrint){const printed=material.clone();printed.color.set('#ffffff');printed.map=object.userData.catPrint;printed.needsUpdate=true;object.material=[printed,material];}else object.material=material;
    for(const old of previous)old.dispose();
    spec.microstructure='Existing scanned cotton weave with independent short seam-local puckering; 1024px tangent normal detail';
  });
}
