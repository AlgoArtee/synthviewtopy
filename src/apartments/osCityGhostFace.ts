import * as THREE from 'three';

const ATLAS = '/apartments/holograms/reference-portrait-atlas-v11.png';
const PIXEL = .49 / 1024;
const TOP = 1.85;
// Pixel landmarks refer to the open portrait's 768 x 1024 half of the atlas.
const EYES = [
  { side:'left', x0:165, x1:231, y0:374, y1:369, upper:15, lower:10, closedDx:-8, closedDy:8 },
  { side:'right', x0:297, x1:386, y0:372, y1:355, upper:17, lower:10, closedDx:-8, closedDy:8 },
] as const;

/** Reference-derived portrait relief, with independently articulated, textured eyelids. */
export function createGhostPortrait(color: string, variant: number) {
  const head=new THREE.Group();head.name='Ghost portrait · articulated head';head.position.set(0,1.515,.005);
  const frame=new THREE.Group();frame.position.set(0,-1.515,-.005);head.add(frame);
  const tint=new THREE.Color(color),time={value:0},blink={value:0};
  let loaded!:()=>void,failed!:(reason:Error)=>void;
  const ready=new Promise<void>((resolve,reject)=>{loaded=resolve;failed=reject;});
  const texture=new THREE.TextureLoader().load(ATLAS,()=>loaded(),undefined,()=>failed(new Error('Hologram portrait texture missing: '+ATLAS)));
  // Decode the photographic atlas into linear light before the room's output pass.
  texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.anisotropy=4;
  const smooth=THREE.MathUtils.smoothstep;
  const gauss=(x:number,y:number,cx:number,cy:number,wx:number,wy:number)=>Math.exp(-(((x-cx)/wx)**2+((y-cy)/wy)**2));
  function relief(x:number,y:number) {
    const face=1-((x-318)/167)**2-((y-413)/232)**2;
    const faceVolume=.024+.041*Math.sqrt(Math.max(0,face));
    const headFade=smooth(y,120,270)*(1-smooth(y,615,675));
    const crown=.011+.048*Math.sqrt(Math.max(0,1-((x-394)/279)**2-((y-239)/216)**2));
    const neck=.012+.030*Math.sqrt(Math.max(0,1-((x-388)/103)**2))*(1-smooth(y,735,860));
    return THREE.MathUtils.lerp(y<450?crown:neck,faceVolume,headFade)
      +.010*gauss(x,y,259,400,38,88)+.012*gauss(x,y,250,458,44,37)
      +.004*gauss(x,y,274,474,38,26)+.010*gauss(x,y,207,459,50,48)
      +.014*gauss(x,y,387,449,57,58)-.009*gauss(x,y,195,370,44,23)
      -.011*gauss(x,y,341,363,56,24)+.014*gauss(x,y,270,532,52,24)
      +.012*gauss(x,y,295,597,53,34);
  }
  // Move the cyan nose and its photographic shading together. Feather the bridge
  // into the cheeks while keeping the eye corners and mouth in place.
  const noseShiftPixels=variant===0?12:0;
  function point(x:number,y:number) {
    const noseInfluence=gauss(x,y,258,447,62,85)*smooth(y,382,425)*(1-smooth(y,490,535));
    return new THREE.Vector3((x-noseShiftPixels*noseInfluence-360)*PIXEL,TOP-y*PIXEL,relief(x,y));
  }
  const uv=(x:number,y:number)=>new THREE.Vector2(x/768,1-y/1024);
  function material(region:number) {
    const result=new THREE.ShaderMaterial({
      uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uMap:{value:texture},uTint:{value:tint},uBlink:blink,uTime:time,uRegion:{value:region}}]),
      vertexShader:`varying vec2 vPhotoUv;varying vec2 vClosedUv;varying vec3 vPortraitPosition;varying vec2 vPatch;
        attribute vec2 uvClosed;attribute vec2 patchUv;
        uniform float uTime;
        #include <fog_pars_vertex>
        #include <morphtarget_pars_vertex>
        void main(){vPhotoUv=uv;vClosedUv=uvClosed;vPatch=patchUv;
          #include <morphinstance_vertex>
          vec3 transformed=position;
          #include <morphtarget_vertex>
          float hair=(1.0-smoothstep(.20,.38,uv.x))*smoothstep(.40,.72,uv.y)
            +smoothstep(.64,.78,uv.x)*smoothstep(.38,.73,uv.y)+smoothstep(.80,.96,uv.y);
          transformed.x+=min(hair,1.0)*.0016*sin(uTime*.52+uv.y*9.0+uv.x*6.0);
          vPortraitPosition=transformed;
          vec4 mvPosition=modelViewMatrix*vec4(transformed,1.0);gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader:`uniform sampler2D uMap;uniform vec3 uTint;uniform float uBlink;uniform float uTime;uniform float uRegion;
        varying vec2 vPhotoUv;varying vec2 vClosedUv;varying vec3 vPortraitPosition;varying vec2 vPatch;
        #include <fog_pars_fragment>
        float aperture(vec2 p,vec4 ends,float up,float down){
          float t=(p.x-ends.x)/(ends.z-ends.x);
          if(t<=0.0||t>=1.0)return 0.0;
          float line=mix(ends.y,ends.w,t),shape=sin(t*3.14159265);
          return step(line-up*shape,p.y)*step(p.y,line+down*shape);
        }
        void main(){
          vec2 p=vec2(vPhotoUv.x*768.0,(1.0-vPhotoUv.y)*1024.0);
          if(uRegion<.5 && (aperture(p,vec4(165.,374.,231.,369.),15.,10.)>.5
            ||aperture(p,vec4(297.,372.,386.,355.),17.,10.)>.5))discard;
          vec4 openSample=texture2D(uMap,vec2(vPhotoUv.x*.5,vPhotoUv.y));
          vec4 closedSample=texture2D(uMap,vec2(.5+vClosedUv.x*.5,vClosedUv.y));
          float lidBlend=(1.0-smoothstep(.30,.95,vPatch.y))*smoothstep(0.0,.24,vPatch.x)*(1.0-smoothstep(.76,1.0,vPatch.x));
          vec4 photo=mix(openSample,closedSample,uRegion>1.5?uBlink*lidBlend:0.0);
          if(photo.a<.012)discard;
          float luminance=dot(photo.rgb,vec3(.16,.60,.24));
          vec3 hue=mix(uTint,vec3(.78,.96,1.0),.20);
          vec3 rgb=hue*luminance*1.31;
          float lowerFade=smoothstep(1.405,1.49,vPortraitPosition.y);
          float scan=.985+.015*sin(vPortraitPosition.y*2300.0-uTime*.9);
          // Dense central portrait preserves nose/eye modeling; airy alpha belongs to hair and shoulders.
          float alpha=photo.a*.985*lowerFade;
          gl_FragColor=vec4(rgb*scan,alpha);
          #include <fog_fragment>
        }`,
      transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,fog:true,forceSinglePass:true,
    });
    result.uniforms.uBlink=blink;result.uniforms.uTime=time;result.uniforms.uMap.value=texture;return result;
  }
  const faceMaterial=material(0),eyeMaterial=material(1),lidMaterial=material(2);
  function mesh(name:string,geometry:THREE.BufferGeometry,mat:THREE.Material) {
    const object=new THREE.Mesh(geometry,mat);object.name=name;object.frustumCulled=false;frame.add(object);return object;
  }
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  const columns=128,rows=160;
  for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
    const x=i/columns*768,y=j/rows*1024,p=point(x,y),t=uv(x,y);positions.push(p.x,p.y,p.z);uvs.push(t.x,t.y);
    if(j<rows&&i<columns){const k=j*(columns+1)+i;indices.push(k,k+columns+1,k+1,k+1,k+columns+1,k+columns+2);}
  }
  const portrait=new THREE.BufferGeometry();portrait.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  portrait.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));portrait.setAttribute('uvClosed',new THREE.Float32BufferAttribute(uvs,2));portrait.setAttribute('patchUv',new THREE.Float32BufferAttribute(uvs.map(()=>0),2));portrait.setIndex(indices);portrait.computeVertexNormals();
  mesh('Ghost face · photographic reference on sculpted facial relief',portrait,faceMaterial);
  // A dense facial core participates in the room's AO/depth pass. Hair and shoulders
  // retain their airy alpha; background facade AO must not be projected onto the skin.
  const outline=[[187,235],[246,194],[300,182],[368,209],[412,267],[438,340],[465,410],[471,481],
    [436,550],[385,598],[326,625],[276,631],[221,596],[185,542],[166,462],[155,364],[165,286]];
  function inside(x:number,y:number){let yes=false;for(let i=0,j=outline.length-1;i<outline.length;j=i++){
    const [ax,ay]=outline[i],[bx,by]=outline[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)yes=!yes;
  }return yes;}
  const core=portrait.clone();const coreIndex:number[]=[];
  for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){
    const x=i/columns*768,y=j/rows*1024,dx=768/columns,dy=1024/rows;
    if([inside(x,y),inside(x+dx,y),inside(x,y+dy),inside(x+dx,y+dy)].every(Boolean)){
      const k=j*(columns+1)+i;coreIndex.push(k,k+columns+1,k+1,k+1,k+columns+1,k+columns+2);
    }
  }
  core.setIndex(coreIndex);const coreP=core.attributes.position;
  for(let i=0;i<coreP.count;i++)coreP.setZ(i,coreP.getZ(i)+.00003);
  core.computeVertexNormals();
  const coreMaterial=material(0);coreMaterial.transparent=false;coreMaterial.depthWrite=true;
  mesh('Ghost face · dense facial core with correct foreground depth',core,coreMaterial);
  const animated:THREE.Mesh[]=[];
  function patch(name:string,patchRows:number,pointAt:(u:number,t:number,closed:boolean)=>{x:number;y:number},mat:THREE.Material,dx=0,dy=0) {
    const p:number[]=[],closed:number[]=[],photoUv:number[]=[],closedUv:number[]=[],patchUv:number[]=[],idx:number[]=[];
    for(let j=0;j<=patchRows;j++)for(let i=0;i<=40;i++){
      const u=i/40,t=j/patchRows,a=pointAt(u,t,false),b=pointAt(u,t,true),pa=point(a.x,a.y),pb=point(b.x,b.y);
      pa.z+=.00075;pb.z+=.00075;p.push(pa.x,pa.y,pa.z);closed.push(pb.x,pb.y,pb.z);
      const ta=uv(a.x,a.y),tb=uv(b.x+dx,b.y+dy);photoUv.push(ta.x,ta.y);closedUv.push(tb.x,tb.y);patchUv.push(u,t);
      if(j<patchRows&&i<40){const k=j*41+i;idx.push(k,k+41,k+1,k+1,k+41,k+42);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(photoUv,2));g.setAttribute('uvClosed',new THREE.Float32BufferAttribute(closedUv,2));g.setAttribute('patchUv',new THREE.Float32BufferAttribute(patchUv,2));g.setIndex(idx);g.computeVertexNormals();
    g.morphAttributes.position=[new THREE.Float32BufferAttribute(closed,3)];
    const closedGeometry=g.clone();closedGeometry.setAttribute('position',new THREE.Float32BufferAttribute(closed,3));closedGeometry.computeVertexNormals();g.morphAttributes.normal=[closedGeometry.attributes.normal.clone()];closedGeometry.dispose();
    const object=mesh(name,g,mat);object.updateMorphTargets();animated.push(object);return object;
  }
  for(const eye of EYES){
    const xAt=(u:number)=>THREE.MathUtils.lerp(eye.x0,eye.x1,u);
    const line=(u:number)=>THREE.MathUtils.lerp(eye.y0,eye.y1,u);
    const edge=(u:number,upper:boolean,closed:boolean)=>line(u)+(closed?0:(upper?-eye.upper:eye.lower)*Math.sin(Math.PI*u));
    patch(`Ghost eye · ${eye.side} iris and aperture`,10,(u,t,closed)=>({x:xAt(u),y:THREE.MathUtils.lerp(edge(u,false,closed),edge(u,true,closed),t)}),eyeMaterial);
    for(const upper of [true,false])patch(`Ghost eyelid · ${eye.side} ${upper?'upper':'lower'}`,7,(u,t,closed)=>{
      const inner=edge(u,upper,closed),outer=line(u)+(upper?-40:31)*Math.sin(Math.PI*u);
      return {x:xAt(u),y:THREE.MathUtils.lerp(inner,outer,t)};
    },lidMaterial,eye.closedDx,eye.closedDy);
  }
  // A handful of curved flyaways add silhouette depth without the former curtain of hair ribbons.
  const hairMaterial=new THREE.MeshBasicMaterial({color:tint,transparent:true,opacity:.18,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
  const strands=[[[154,257],[114,348],[108,479],[132,586]],[[153,292],[134,399],[152,538],[174,652]],
    [[518,159],[593,209],[644,307],[641,389]],[[527,239],[624,310],[678,412],[664,479]],
    [[483,396],[561,453],[611,517],[600,584]],[[446,96],[545,105],[617,163],[651,220]]];
  for(const strand of strands){
    const points=strand.map(([x,y],i)=>{const p=point(x,y);p.z-=.018+i*.002;return p;});
    mesh('Ghost hair · fine swept-back flyaway',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),40,.00038,4,false),hairMaterial);
  }
  head.userData.portrait={identity:'Reference portrait · '+(variant?'pink':'cyan'),features:'Reference-matched adult East Asian feminine photographic portrait, luminous irises, anatomical nose/lips/cheeks, swept-back fine hair',articulated:true,blinkDurationSeconds:.29,asset:ATLAS,method:'Textured three-quarter facial relief with real aperture/lid morphs; portrait atlas is not a room backdrop'};
  function setBlink(amount:number){blink.value=amount;for(const object of animated)object.morphTargetInfluences![0]=amount;}
  function setTime(elapsed:number){time.value=elapsed;}
  return {head,frame,setBlink,setTime,ready};
}
