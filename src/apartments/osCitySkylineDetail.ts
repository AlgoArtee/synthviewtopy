import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { createCityNeonAtmosphere } from './osCityNeonAtmosphere';
import type { createCityDistantNeon } from './osCityDistantNeon';
import { getCityWeatherPreset, type CityTimeOfDay, type OsCityWeather } from './osCityWeather';

interface Tower {x:number;z:number;width:number;depth:number;height:number;groundY:number;roofY:number;rotation:number;index:number;crowns?:boolean}

/** Static dimensional crowns and authored display graphics, shared by both city views. */
export function createOsCitySkylineDetail(atmosphere:ReturnType<typeof createCityNeonAtmosphere>,neon:ReturnType<typeof createCityDistantNeon>,label:string) {
  const group=new THREE.Group();group.name=label+' · sculpted crowns and neon district displays';
  const snowGroup=new THREE.Group();snowGroup.name=label+' · snow on new crown caps';snowGroup.visible=false;group.add(snowGroup);
  const batches=new Map<THREE.Material,THREE.BufferGeometry[]>(),snowBatches:THREE.BufferGeometry[]=[];
  // A weak architectural wash reveals the opaque structure between luminous
  // edges. It retains ordinary body fog, so no floating roof mass pierces mist.
  const metal=new THREE.MeshStandardMaterial({color:'#344e62',emissive:'#294b61',emissiveIntensity:.48,roughness:.48,metalness:.52});
  const silver=new THREE.MeshStandardMaterial({color:'#7893a5',emissive:'#3b5667',emissiveIntensity:.36,roughness:.38,metalness:.64});
  const core=new THREE.MeshStandardMaterial({color:'#193342',emissive:'#316878',emissiveIntensity:.68,roughness:.35,metalness:.32});
  const dark=new THREE.MeshStandardMaterial({color:'#0a1725',roughness:.61,metalness:.35});
  const snow=new THREE.MeshStandardMaterial({color:'#dce5eb',roughness:.96});
  const titles=['SYNAPSE','ORB / NETWORK','ECHO // LIVE','NORTH NODE','LATTICE','NOX / LINK','STACK 09','VANTA'];
  const inks=['#6ceaff','#f181d3','#91aaff','#8ce7bf','#ffc38b','#bc9dff','#70dfee','#f49ea0'];
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;
  const c=canvas.getContext('2d')!;c.scale(.5,.5);
  for(let tile=0;tile<8;tile++){
    const x=tile%2*512,y=Math.floor(tile/2)*512,ink=inks[tile];
    c.fillStyle='#071321';c.fillRect(x,y,512,512);
    const glow=c.createRadialGradient(x+256,y+220,20,x+256,y+220,260);glow.addColorStop(0,ink+'55');glow.addColorStop(1,'#07132100');c.fillStyle=glow;c.fillRect(x,y,512,512);
    c.strokeStyle=ink;c.lineWidth=5;c.strokeRect(x+15,y+15,482,482);
    c.save();c.translate(x+256,y+220);
    if(tile%4===0){
      for(let ring=0;ring<4;ring++){c.lineWidth=ring===0?12:3;c.beginPath();c.arc(0,0,35+ring*37,.18+ring*.4,Math.PI*1.85+ring*.4);c.stroke();}
      for(let spoke=0;spoke<16;spoke++){const a=spoke*Math.PI/8;c.beginPath();c.moveTo(Math.cos(a)*105,Math.sin(a)*105);c.lineTo(Math.cos(a)*169,Math.sin(a)*169);c.stroke();}
    }else if(tile%4===1){
      for(let band=0;band<10;band++){c.beginPath();for(let k=0;k<=36;k++){const px=-205+k*11.4,py=-133+band*29+Math.sin(k*.29+band*.60)*29;if(k)c.lineTo(px,py);else c.moveTo(px,py);}c.stroke();}
    }else if(tile%4===2){
      for(let branch=0;branch<12;branch++){const side=branch%2?1:-1,py=-150+branch*27;c.beginPath();c.moveTo(side*205,py);c.lineTo(side*104,py);c.lineTo(side*58,py+45);c.lineTo(side*12,py+45);c.stroke();c.beginPath();c.arc(side*12,py+45,6,0,Math.PI*2);c.stroke();}
    }else{
      for(let ring=0;ring<4;ring++){c.beginPath();for(let side=0;side<=6;side++){const a=side*Math.PI/3,r=42+ring*39;if(side)c.lineTo(Math.cos(a)*r,Math.sin(a)*r);else c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.stroke();}
      c.lineWidth=12;c.beginPath();c.moveTo(-150,110);c.lineTo(-35,-95);c.lineTo(105,102);c.stroke();
    }
    c.restore();c.textAlign='center';c.textBaseline='middle';c.fillStyle=ink;c.font='700 43px Arial';c.fillText(titles[tile],x+256,y+423,455);
    c.font='500 18px Arial';c.fillText('NORTH CITY  //  CONNECTED 24:7',x+256,y+468,450);
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
  const emissionCanvas=document.createElement('canvas');emissionCanvas.width=512;emissionCanvas.height=1024;
  const ec=emissionCanvas.getContext('2d')!;ec.drawImage(canvas,0,0);const pixels=ec.getImageData(0,0,512,1024);
  for(let p=0;p<pixels.data.length;p+=4)if(Math.max(pixels.data[p],pixels.data[p+1],pixels.data[p+2])<80)pixels.data[p]=pixels.data[p+1]=pixels.data[p+2]=0;
  ec.putImageData(pixels,0,0);const emissiveMap=new THREE.CanvasTexture(emissionCanvas);emissiveMap.colorSpace=THREE.SRGBColorSpace;emissiveMap.anisotropy=8;
  const display=atmosphere.register(new THREE.MeshStandardMaterial({map,emissiveMap,emissive:'#ffffff',emissiveIntensity:2.2,roughness:.43,metalness:.16}),'neon',label+' · eight graphic neon display designs');
  const forms={uplinkSpire:0,lanternCrown:0,haloCrown:0,slopedCrown:0,twinStacks:0};
  let boardCount=0,facadeCircuitCount=0,finished=false,maxCrownHeight=0;
  function add(g:THREE.BufferGeometry,material:THREE.Material,x:number,y:number,z:number,rotation=0){
    if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(rotation)g.rotateY(rotation);g.translate(x,y,z);
    const list=batches.get(material)??[];list.push(g);batches.set(material,list);
  }
  function decorate(t:Tower){
    if(finished)throw new Error('Skyline details are already batched');
    const {x,z,width:w,depth:d,height:h,groundY,roofY,rotation:r,index}=t,c=Math.cos(r),s=Math.sin(r);
    const world=(u:number,y:number,v:number)=>new THREE.Vector3(x+c*u+s*v,y,z-s*u+c*v);
    const box=(material:THREE.Material,u:number,y:number,v:number,bw:number,bh:number,bd:number)=>{const p=world(u,y,v);add(new THREE.BoxGeometry(bw,bh,bd),material,p.x,p.y,p.z,r);};
    const line=(material:THREE.Material,from:number[],to:number[],radius=.10)=>{
      const a=world(from[0],from[1],from[2]),b=world(to[0],to[1],to[2]);
      const g=new THREE.CylinderGeometry(radius,radius,a.distanceTo(b),5);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize()));const mid=a.add(b).multiplyScalar(.5);add(g,material,mid.x,mid.y,mid.z);
    };
    const ink=neon.material(index*3+Math.floor(index/7)+1),secondary=neon.material(index*3+4);
    // Distinct technical silhouettes stay within their host roof footprints.
    if(t.crowns!==false&&(index%2===0||index%5===2)){
      const ch=THREE.MathUtils.clamp(h*.17,5.5,13),form=index%5;maxCrownHeight=Math.max(maxCrownHeight,ch);
      const cap=(u:number,y:number,v:number,bw:number,bd:number)=>{
        const p=world(u,y+.018,v),g=new THREE.BoxGeometry(bw,.036,bd);if(r)g.rotateY(r);g.translate(p.x,p.y,p.z);snowBatches.push(g.toNonIndexed());g.dispose();
      };
      if(form===0){
        forms.uplinkSpire++;const radius=Math.min(w,d)*.22;
        add(new THREE.CylinderGeometry(radius*.12,radius,ch,6),metal,x,roofY+ch/2,z,r);
        for(let side=0;side<6;side++){const a=side*Math.PI/3+Math.PI/2;line(ink,[Math.cos(a)*radius,roofY,Math.sin(a)*radius],[Math.cos(a)*radius*.12,roofY+ch,Math.sin(a)*radius*.12],.18);}
        box(secondary,0,roofY+ch+.22,0,.36,.44,.36);
      }else if(form===1){
        forms.lanternCrown++;box(core,0,roofY+ch*.42,0,w*.27,ch*.84,d*.27);
        for(const side of [-1,1])for(const front of [-1,1])box(silver,side*w*.22,roofY+ch/2,front*d*.22,.26,ch,.26);
        for(let level=0;level<3;level++){
          for(const front of [-1,1])box(level%2?secondary:ink,0,roofY+ch*(.26+level*.32),front*d*.225,w*.46,.30,.18);
          for(const side of [-1,1])box(level%2?secondary:ink,side*w*.225,roofY+ch*(.26+level*.32),0,.18,.30,d*.46);
        }
        box(metal,0,roofY+ch+.13,0,w*.50,.26,d*.50);cap(0,roofY+ch+.26,0,w*.50,d*.50);
      }else if(form===2){
        forms.haloCrown++;const radius=Math.min(w,d)*.22;
        for(let side=0;side<4;side++){const a=side*Math.PI/2;line(silver,[Math.cos(a)*radius,roofY,Math.sin(a)*radius],[Math.cos(a)*radius,roofY+ch,Math.sin(a)*radius],.18);}
        for(const level of [.32,.68,1]){
          const y=roofY+ch*level,torus=new THREE.TorusGeometry(radius,.24,6,24);torus.rotateX(Math.PI/2);add(torus,level===.68?secondary:ink,x,y,z);
          add(new THREE.CylinderGeometry(radius*.96,radius*.96,.22,24),metal,x,y,z);
          const snowCap=new THREE.CylinderGeometry(radius*.96,radius*.96,.036,24).toNonIndexed();snowCap.translate(x,y+.128,z);snowBatches.push(snowCap);
        }
        box(core,0,roofY+ch*.50,0,w*.27,ch,d*.27);
      }else if(form===3){
        forms.slopedCrown++;const g=new THREE.BoxGeometry(w*.48,ch,d*.48),p=g.getAttribute('position');
        for(let i=0;i<p.count;i++)if(p.getY(i)>0)p.setY(i,p.getY(i)+p.getX(i)/(w*.48)*ch*.30);g.computeVertexNormals();add(g,metal,x,roofY+ch/2,z,r);
        for(const front of [-1,1])line(ink,[-w*.24,roofY+ch*.85,front*d*.24],[w*.24,roofY+ch*1.15,front*d*.24],.22);
        line(secondary,[w*.24,roofY+ch*1.15,-d*.24],[w*.24,roofY+ch*1.15,d*.24],.22);
        line(ink,[-w*.24,roofY,-d*.24],[-w*.24,roofY+ch*.85,-d*.24],.18);
        line(ink,[w*.24,roofY,d*.24],[w*.24,roofY+ch*1.15,d*.24],.18);
      }else{
        forms.twinStacks++;for(const side of [-1,1]){const sh=ch*(side<0?.72:1);
          box(metal,side*w*.13,roofY+sh/2,0,w*.18,sh,d*.32);cap(side*w*.13,roofY+sh,0,w*.18,d*.32);
          for(let band=0;band<4;band++)box(band%2?secondary:ink,side*w*.13,roofY+sh*(.2+band*.23),d*.165,w*.18,.28,.10);
          box(ink,side*w*.13,roofY+sh*.5,-d*.165,.24,sh,.10);
        }
      }
    }
    const front=d/2+.19;
    if(index%3!==1){
      facadeCircuitCount++;const side=index%2?1:-1,u=side*w*.34,y=groundY+h*.51;
      box(dark,u,y,front-.11,w*.19,h*.43,.16);
      for(let trace=0;trace<3;trace++){
        const offset=(trace-1)*w*.035;
        const points=[[u+offset,y-h*.19,front+.04],[u+offset,y-h*.03,front+.04],[u-side*w*.13+offset,y+h*.04,front+.04],[u-side*w*.13+offset,y+h*.20,front+.04]];
        for(let p=1;p<points.length;p++)line(trace===1?secondary:ink,points[p-1],points[p],.15);
      }
    }
    if(index%3===0||index%5===2){
      const vertical=index%3===0,bw=w*(vertical?.27:.63),bh=Math.min(h*(vertical?.37:.17),vertical?20:9),u=(index%2?1:-1)*w*.11,y=groundY+h*(vertical?.63:.39);
      box(metal,u,y,front+.20,bw+.24,bh+.24,.30);
      for(const side of [-1,1])box(silver,u+side*bw*.32,y,d/2+.16,.16,bh*.65,.42);
      const tile=((index*3+Math.floor(index/5))%8+8)%8,g=new THREE.PlaneGeometry(bw,bh),uv=g.getAttribute('uv');
      for(let i=0;i<uv.count;i++)uv.setXY(i,(tile%2+.006+uv.getX(i)*.988)/2,1-(Math.floor(tile/2)+.994-uv.getY(i)*.988)/4);
      const p=world(u,y,front+.36),light=index%4===0?neon.localized(index,51031+index*137,label+' graphic tower display '+index,display):display;
      add(g,light,p.x,p.y,p.z,r);boardCount++;
    }
  }
  function finish(){
    if(finished)return;finished=true;
    for(const [material,geometries] of batches){const g=mergeGeometries(geometries,false)!;geometries.forEach(item=>item.dispose());const mesh=new THREE.Mesh(g,material);mesh.name=label+' · batched crown/display geometry';group.add(mesh);}
    if(snowBatches.length){const g=mergeGeometries(snowBatches,false)!;snowBatches.forEach(item=>item.dispose());snowGroup.add(new THREE.Mesh(g,snow));}
  }
  const snapshot=()=>({label,forms:{...forms},landmarkCount:Object.values(forms).reduce((a,b)=>a+b,0),boardCount,facadeCircuitCount,maxCrownHeight,staticDrawCalls:batches.size,staticGeometry:true,staticTextures:true,additionalRealtimeLights:0,displayDesigns:titles,snowCaps:snowBatches.length});
  return {group,decorate,finish,snapshot,displayMaterial:display,setWeather:(mode:OsCityWeather,time:CityTimeOfDay)=>{
    snowGroup.visible=mode==='snow';const glow=getCityWeatherPreset(mode,time).windowGlow;
    metal.emissiveIntensity=.48*glow;silver.emissiveIntensity=.36*glow;core.emissiveIntensity=.68*glow;
  }};
}
