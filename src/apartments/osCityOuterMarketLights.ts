import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getCityWeatherPreset, type OsCityWeather, type CityTimeOfDay } from './osCityWeather';
import type { createCityNeonAtmosphere } from './osCityNeonAtmosphere';

interface Footprint {x:number;z:number;halfWidth:number;halfDepth:number}
type FixtureForm='lantern'|'vertical-sign'|'lightbox'|'festoon'|'ring'|'awning';
interface Glow {x:number;y:number;z:number;color:string;width:number;height:number;intensity:number}

/** Low street-market light clusters continue into the alleys between real towers. */
export function createOsCityOuterMarketLights(neon:ReturnType<typeof createCityNeonAtmosphere>,obstacles:Footprint[]){
  const group=new THREE.Group();group.name='Circuit Market · distant ground-level market lights';
  const floorY=-14.02,palette=['#66cfff','#ff77bf','#ffc889','#b794ff','#ffe3bb'];
  // Independent seed keeps the existing district and pedestrian layout unchanged.
  let seed=401014;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  // Coordinates are outside the plaza. +Z is the balcony viewer's right.
  const candidates=[[70,-82],[89,-79],[104,-83],[122,-72],[144,-58],[152,-90],[130,-117],[160,-128],[107,-134],[77,-118],
    [73,72],[108,78],[133,67],[150,84],[95,98],[122,109],[153,121],[77,111],[110,140],[157,146],
    [204,-116],[215,-59],[202,35],[211,88]];
  const clusters=candidates.map(([x,z],i)=>({x,z,halfWidth:3.8,halfDepth:6.8,seed:i}))
    .filter(f=>!obstacles.some(o=>Math.abs(f.x-o.x)<f.halfWidth+o.halfWidth+1.5&&Math.abs(f.z-o.z)<f.halfDepth+o.halfDepth+1.5));
  const housing=new THREE.MeshStandardMaterial({color:'#1e2c35',roughness:.83,metalness:.25});housing.name='Outer market · grounded frames and canopies';neon.register(housing,'surface',housing.name);
  const lamps=new THREE.MeshBasicMaterial({color:new THREE.Color('#ffffff').multiplyScalar(5),vertexColors:true,toneMapped:false});lamps.name='Outer market · varied neon signs and warm lanterns';neon.register(lamps,'neon',lamps.name);
  const parts=new Map<THREE.Material,THREE.BufferGeometry[]>(),vendors:{x:number;z:number;y:number;color:string;height:number;angle:number;form:FixtureForm}[]=[];
  const fixtures:(Glow&{form:FixtureForm})[]=[],pools:Glow[]=[];
  function add(mat:THREE.Material,source:THREE.BufferGeometry,transform:THREE.Matrix4,color?:string,intensity=1){
    const g=source.index?source.toNonIndexed():source;g.applyMatrix4(transform);
    if(g!==source)source.dispose();
    if(color){const c=new THREE.Color(color).multiplyScalar(intensity),colors=new Float32Array(g.getAttribute('position').count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(colors,3));}
    const batch=parts.get(mat)??[];batch.push(g);parts.set(mat,batch);
  }
  clusters.forEach(c=>{
    const count=2+Math.floor(random()*2),spacing=3.65+random()*.4;
    for(let n=0;n<count;n++){
      const x=c.x+(random()-.5)*1.8,z=c.z+(n-(count-1)/2)*spacing+(random()-.5)*.5;
      const height=2.15+random()*1.05,angle=(random()-.5)*.6,width=2.35+random()*.55,depth=1.65+random()*.55;
      const color=palette[Math.floor(random()*palette.length)],intensity=.55+random()*.85;
      const form=(['lantern','vertical-sign','lightbox','festoon','ring','awning'] as const)[Math.floor(random()*6)];
      vendors.push({x,z,y:floorY,color,height,angle,form});
      const origin=new THREE.Matrix4().makeRotationY(angle).setPosition(x,floorY,z);
      function shape(mat:THREE.Material,g:THREE.BufferGeometry,u:number,y:number,v:number,tint?:string,power=intensity){
        add(mat,g,new THREE.Matrix4().multiplyMatrices(origin,new THREE.Matrix4().makeTranslation(u,y,v)),tint,power);
      }
      function box(mat:THREE.Material,u:number,y:number,v:number,w:number,h:number,d:number,tint?:string,power=intensity){shape(mat,new THREE.BoxGeometry(w,h,d),u,y,v,tint,power);}
      function tube(mat:THREE.Material,a:number[],b:number[],radius:number,tint?:string,power=intensity){
        const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);
        const g=new THREE.CylinderGeometry(radius,radius,direction.length(),5).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));
        const mid=start.add(end).multiplyScalar(.5);shape(mat,g,mid.x,mid.y,mid.z,tint,power);
      }
      function light(u:number,y:number,v:number,tint:string,w:number,h:number,power=intensity){
        const p=new THREE.Vector3(u,y,v).applyMatrix4(origin);fixtures.push({x:p.x,y:p.y,z:p.z,color:tint,width:w,height:h,intensity:power,form});
      }
      const front=-depth/2-.08;
      // Uneven awnings still have counters and grounded frames beneath their lights.
      box(housing,0,.5,0,depth*.84,1,width*.91);
      box(housing,0,height,0,depth,.11,width);
      for(const u of [-1,1])for(const v of [-1,1])box(housing,u*depth*.42,height/2,v*width*.43,.065,height,.065);
      if(form==='lantern'){
        const count=1+Math.floor(random()*3);
        for(let j=0;j<count;j++){
          const v=(j-(count-1)/2)*.85,drop=.28+random()*.48,r=.18+random()*.13;
          const tint=palette[Math.floor(random()*palette.length)],y=height-drop;
          tube(housing,[front,height,v],[front,y+r*.9,v],.016);
          shape(lamps,new THREE.SphereGeometry(r,10,7).scale(1,1.22,1),front,y,v,tint);
          for(const side of [-1,1])box(housing,front,y+side*r*1.12,v,.18,.04,.18);
          light(front,y,v,tint,2.3+r*4,2.7+r*4);
        }
      }else if(form==='vertical-sign'){
        const v=(random()-.5)*width*.5,signY=height+.15;
        box(housing,front+.16,signY-.40,v,.10,1.5,.08);
        box(housing,front,signY,v,.13,1.7,.5);
        // Broken glyph-like strokes give tall signs a different silhouette to lightboxes.
        for(let j=0;j<4;j++){
          box(lamps,front-.08,signY-.59+j*.38,v,.035,.095,.31,color);
          box(lamps,front-.08,signY-.48+j*.38,v+(j%2?-.09:.09),.035,.18,.055,color);
        }
        light(front,signY,v,color,2.9,5.4);
      }else if(form==='lightbox'){
        const w=1.05+random()*1.2,h=.30+random()*.22,y=height-.42;
        box(housing,front,y,0,.16,h+.12,w+.12);
        box(lamps,front-.09,y,0,.03,h,w,color,.45*intensity);
        for(let j=0;j<5;j++)box(lamps,front-.115,y,(j-2)*w*.16,.02,h*.48,.045,palette[4],intensity);
        tube(housing,[front,height,-w*.35],[front,y,-w*.35],.02);
        tube(housing,[front,height,w*.35],[front,y,w*.35],.02);
        light(front,y,0,color,4.8,2.6);
      }else if(form==='festoon'){
        const count=5+Math.floor(random()*4),points:number[][]=[];
        for(let j=0;j<count;j++){
          const t=j/(count-1),v=(t-.5)*width*.94,y=height-.12-Math.sin(t*Math.PI)*(.3+width*.055);
          points.push([front,y,v]);if(j)tube(housing,points[j-1],points[j],.018);
          const tint=palette[Math.floor(random()*palette.length)],r=.065+random()*.04;
          tube(housing,[front,y,v],[front,y-.1,v],.012);
          shape(lamps,new THREE.SphereGeometry(r,8,6),front,y-.15,v,tint,1.1*intensity);
          light(front,y-.15,v,tint,1.4,1.7,.7*intensity);
        }
      }else if(form==='ring'){
        const v=(random()-.5)*.7,r=.36+random()*.18,y=height+.2;
        box(housing,front+.08,y-.35,v,.08,1,.08);
        shape(lamps,new THREE.TorusGeometry(r,.045,6,20).rotateY(Math.PI/2),front,y,v,color);
        box(lamps,front,y,v,.055,.06,r*1.25,color);
        light(front,y,v,color,3.7,3.9);
      }else{
        // Only some awnings carry neon strips, with unequal lengths and an angled return.
        tube(lamps,[front,height-.08,-width*.42],[front,height-.08,width*.12],.035,color);
        tube(lamps,[front,height-.08,width*.12],[front+.4,height-.17,width*.34],.035,color);
        box(lamps,front-.02,1.02,-width*.15,.04,.06,width*.44,palette[(c.seed+n)%2]);
        light(front,height-.13,-width*.12,color,5.3,2.5);
      }
      // Small, offset pools break up in the wet ground instead of repeating identical discs.
      const p=new THREE.Vector3(front-.3-random()*.5,.025,(random()-.5)*width*.6).applyMatrix4(origin);
      pools.push({x:p.x,y:p.y,z:p.z,color,width:3.2+random()*3.8,height:2+random()*2.5,intensity:intensity*(.55+random()*.4)});
    }
  });
  for(const [material,geometries] of parts){const mesh=new THREE.Mesh(mergeGeometries(geometries,false),material);geometries.forEach(g=>g.dispose());mesh.name=material.name;group.add(mesh);}
  const fog={value:.008},brightness={value:1},haloOpacity={value:.15},spillOpacity={value:.22};
  function glow(name:string,billboard:boolean,opacity:{value:number}){
    const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,toneMapped:false,
      uniforms:{uFog:fog,uBrightness:brightness,uOpacity:opacity},
      vertexShader:`varying vec2 vUv;varying vec3 vLight;varying float vDepth;
        void main(){vUv=uv;vLight=instanceColor;
          ${billboard?`vec4 p=modelViewMatrix*instanceMatrix*vec4(0.,0.,0.,1.);
          p.xy+=position.xy*vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));`:
          'vec4 p=modelViewMatrix*instanceMatrix*vec4(position,1.);'}
          vDepth=max(0.,-p.z);gl_Position=projectionMatrix*p;
        }`,
      fragmentShader:`uniform float uFog;uniform float uBrightness;uniform float uOpacity;
        varying vec2 vUv;varying vec3 vLight;varying float vDepth;
        void main(){float radius=length((vUv-.5)*2.);float softness=exp(-radius*radius*4.5)*(1.-smoothstep(.65,1.,radius));
          gl_FragColor=vec4(vLight*uBrightness*exp(-uFog*vDepth),softness*uOpacity);
        }`});
    const sources=billboard?fixtures:pools;
    const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),material,sources.length);mesh.name=name;mesh.frustumCulled=false;
    const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion();
    if(!billboard)rotation.setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
    sources.forEach((v,i)=>{
      position.set(v.x,v.y,v.z);
      scale.set(v.width,v.height,1);matrix.compose(position,rotation,scale);mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,new THREE.Color(v.color).multiplyScalar(v.intensity));
    });group.add(mesh);return mesh;
  }
  const halos=glow('Outer market · light scattered through low haze',true,haloOpacity);
  const spills=glow('Outer market · soft ground light pools',false,spillOpacity);
  let weather:OsCityWeather='rain',timeOfDay:CityTimeOfDay='day';
  function setWeather(mode:OsCityWeather,time:CityTimeOfDay){
    weather=mode;timeOfDay=time;const p=getCityWeatherPreset(mode,time),haze=Math.min(1,p.fog/.018);
    fog.value=p.neonFogDensity;brightness.value=2.6*p.neonIntensity;
    haloOpacity.value=(.10+haze*.21)*(time==='night'?1.15:1);
    spillOpacity.value=.18+p.wetness*.17;
  }
  setWeather(weather,timeOfDay);
  return {group,setWeather,snapshot:()=>({clusterCount:clusters.length,vendorCount:vendors.length,clusters,vendors,palette,fixtures,
    groundY:floorY,weather,timeOfDay,haloOpacity:haloOpacity.value,spillOpacity:spillOpacity.value,fogDensity:fog.value,
    drawCalls:group.children.length,additionalRealtimeLights:0,depthTest:true}),
    dispose:()=>{halos.dispose();spills.dispose();}};
}
