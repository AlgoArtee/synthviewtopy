import * as THREE from 'three';
import { createCityRobotPumpkin } from './osCityRobotPumpkin';
import { getCityWeatherPreset, type CityTimeOfDay, type OsCityWeather } from './osCityWeather';

export const CITY_HOLOGRAMS = [
  {id:'jellyfish',label:'Jellyfish',category:'Figures',color:'#65dfff'},
  {id:'phoenix',label:'Phoenix',category:'Figures',color:'#ff936b'},
  {id:'bremen',label:'Bremen Town Musicians',category:'Figures',color:'#e98fff'},
  {id:'lorelei',label:'Lorelei',category:'Figures',color:'#ff8cdb'},
  {id:'rain',label:'Rain cloud',category:'Weather',color:'#67dcff'},
  {id:'clouds',label:'Partly cloudy',category:'Weather',color:'#ffe29b'},
  {id:'cold',label:'Cold · −4°C',category:'Weather',color:'#95edff'},
  {id:'storm',label:'Thunderstorm',category:'Weather',color:'#ffe56a'},
  {id:'heat',label:'Heat · 42°C',category:'Weather',color:'#ff8c65'},
  {id:'snow',label:'Snowflake',category:'Weather',color:'#b9edff'},
  {id:'sunrise',label:'Sunrise',category:'Day cycle',color:'#ffd597'},
  {id:'noon',label:'Noon',category:'Day cycle',color:'#ffe7a5'},
  {id:'sunset',label:'Sunset',category:'Day cycle',color:'#ff9db4'},
  {id:'midnight',label:'Midnight',category:'Day cycle',color:'#a4b5ff'},
] as const;
export type CityHologramId = typeof CITY_HOLOGRAMS[number]['id'];
export interface CityHologramSettings {
  brightness:number;
  size:number;
  animated:boolean;
  levels:Record<CityHologramId,number>;
}
export interface CityHologramControls {
  getSettings:()=>CityHologramSettings;
  setSettings:(patch:Partial<Omit<CityHologramSettings,'levels'>>)=>void;
  setLevel:(id:CityHologramId,value:number)=>void;
  solo:(id:CityHologramId)=>void;
  allOff:()=>void;
  reset:()=>void;
  isSaved:()=>boolean;
  getSnapshot:()=>Record<string,unknown>;
}
const STORAGE_KEY='north-city-plaza-holograms-v1';
const defaults=():CityHologramSettings=>({brightness:85,size:100,animated:true,
  levels:Object.fromEntries(CITY_HOLOGRAMS.map(item=>[item.id,item.id==='jellyfish'?85:0])) as CityHologramSettings['levels']});
const finite=(value:unknown,fallback:number,min:number,max:number)=>typeof value==='number'&&Number.isFinite(value)?THREE.MathUtils.clamp(value,min,max):fallback;

/** Reference artwork becomes emitted light in the shader, not an opaque photo.
 * The originals remain unmodified. The display has a fixed world-space tilt;
 * looking up/down never billboards, scales or repositions the projection. */
export function createCityHolograms(origin:THREE.Vector3) {
  const group=new THREE.Group();group.name='Central chip · holographic projection mixer';group.position.copy(origin);
  const volume=new THREE.Group();volume.name='World-anchored holographic light volume';group.add(volume);
  const pumpkin=createCityRobotPumpkin();group.add(pumpkin.group);
  let settings=defaults(),saved=true,disposed=false,clock=0,weather:OsCityWeather='rain',timeOfDay:CityTimeOfDay='day';
  try {
    const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)??'null');
    if(raw&&typeof raw==='object'){
      settings.brightness=finite(raw.brightness,85,0,150);settings.size=finite(raw.size,100,60,140);
      if(typeof raw.animated==='boolean')settings.animated=raw.animated;
      for(const item of CITY_HOLOGRAMS)settings.levels[item.id]=finite(raw.levels?.[item.id],settings.levels[item.id],0,100);
    }
  } catch { saved=false; }
  const textures=new Set<THREE.Texture>(),geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
  const geometry=<T extends THREE.BufferGeometry>(g:T)=>{geometries.add(g);return g;};
  const material=<T extends THREE.Material>(m:T)=>{materials.add(m);return m;};
  const common={uTime:{value:0},uPower:{value:1},uEnvelope:{value:1},uFog:{value:.008}};
  const vertexShader=`
    varying vec2 vUv; varying float vDepth; uniform float uTime;
    void main(){
      vUv=uv;vec3 p=position;
      p.z+=sin(p.y*.43+uTime*.7)*sin(p.x*.35+uTime*.25)*.075;
      vec4 view=modelViewMatrix*vec4(p,1.0);vDepth=length(view.xyz);
      gl_Position=projectionMatrix*view;
    }`;
  const fragmentShader=`
    uniform sampler2D uArtwork; uniform float uTime,uPower,uFog,uLevel;
    uniform vec4 uCrop,uSun; uniform vec2 uTexel; uniform float uCircular,uDetail,uDisc; varying vec2 vUv; varying float vDepth;
    void main(){
      vec2 uv=mix(uCrop.xy,uCrop.zw,vUv);
      vec3 ink=texture2D(uArtwork,uv).rgb;
      float high=max(ink.r,max(ink.g,ink.b)),low=min(ink.r,min(ink.g,ink.b));
      // Paper emits no light. Preserve colored filaments and dark colored cores,
      // while suppressing the neutral white background and its grey shadows.
      float chroma=high-low;
      float coverage=smoothstep(.035,.32,chroma*1.5+(1.0-high)*.08);
      float edge=smoothstep(0.0,.035,vUv.x)*smoothstep(0.0,.035,1.0-vUv.x)
        *smoothstep(0.0,.025,vUv.y)*smoothstep(0.0,.025,1.0-vUv.y);
      float scan=.88+.12*sin(vUv.y*1150.0-uTime*2.8);
      float sweep=pow(max(0.0,1.0-abs(vUv.y-fract(uTime*.065))/.045),2.0);
      // Remove the paper contribution from antialiased edges as well. Otherwise
      // white-matted source edges turn into a bright opaque-looking fringe.
      vec3 colored=max(vec3(0.0),ink-vec3(low)*.96);
      vec3 light=mix(colored,colored/max(.18,chroma),.44);
      if(uDetail>.5){
        // Keep pale lettering/filaments that sit inside colored weather artwork.
        // Neutral exterior paper has neutral neighbors and remains transparent.
        vec3 nearby=(texture2D(uArtwork,uv+vec2(uTexel.x*4.0,0.0)).rgb
          +texture2D(uArtwork,uv-vec2(uTexel.x*4.0,0.0)).rgb
          +texture2D(uArtwork,uv+vec2(0.0,uTexel.y*4.0)).rgb
          +texture2D(uArtwork,uv-vec2(0.0,uTexel.y*4.0)).rgb)*.25;
        float nearbyChroma=max(nearby.r,max(nearby.g,nearby.b))-min(nearby.r,min(nearby.g,nearby.b));
        float filament=smoothstep(.62,.94,low)*smoothstep(.06,.25,nearbyChroma);
        coverage=max(coverage,filament);
        light=colored*1.1+vec3(.7,.9,1.0)*filament*1.35;
      }
      // These two designs have a continuous dark HUD disk. Its interior is
      // artwork, including white strokes; only the exterior is paper.
      float disc=uDisc*(1.0-smoothstep(.69,.84,length((vUv-.5)*2.0)));
      coverage=mix(coverage,1.0,disc);
      light=mix(light,ink*1.4,disc);
      if(uSun.z>0.0){
        float core=(1.0-smoothstep(.90,1.02,length((uv-uSun.xy)/uSun.z)))
          *smoothstep(.65,.93,low)*mix(1.0,step(uSun.y,uv.y),uSun.w);
        coverage=max(coverage,core);light=mix(light,vec3(1.0,.83,.42),core);
      }
      float aperture=mix(1.0,1.0-smoothstep(.73,1.02,length((vUv-.5)*2.0)),uCircular);
      float alpha=coverage*edge*aperture*uLevel*exp(-uFog*vDepth);
      if(alpha<.002)discard;
      gl_FragColor=vec4(light*(1.4+ sweep*.22)*scan*uPower,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  const stage=new THREE.Group();stage.name='Fixed inclined projection plane';
  stage.rotation.set(-.40,-Math.PI/2,0,'YXZ');stage.position.y=12.5;volume.add(stage);
  const planeGeometry=geometry(new THREE.PlaneGeometry(1,1,28,36));
  const loader=new THREE.TextureLoader();
  const entries=CITY_HOLOGRAMS.map((item,index)=>{
    const uniforms={...common,uArtwork:{value:null as THREE.Texture|null},uLevel:{value:settings.levels[item.id]/100},
      uCircular:{value:item.category==='Day cycle'?1:0},
      uDetail:{value:item.category==='Weather'?1:0},uTexel:{value:new THREE.Vector2(1/1600,1/1600)},
      uDisc:{value:item.id==='cold'||item.id==='snow'?1:0},
      uSun:{value:item.id==='noon'?new THREE.Vector4(.5,.86,.078,0):item.id==='sunrise'?new THREE.Vector4(.5,.355,.073,1):new THREE.Vector4()},
      uCrop:{value:new THREE.Vector4(item.id==='cold'||item.id==='heat'?.19:.04,.03,item.id==='cold'||item.id==='heat'?.81:.96,.97)}};
    const mat=material(new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader,transparent:true,depthWrite:false,
      depthTest:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false}));
    mat.name=`Holographic light · ${item.label}`;
    const mesh=new THREE.Mesh(planeGeometry,mat);mesh.name=`Projection · ${item.label}`;
    // Small depth separation makes simultaneous projections a light volume.
    mesh.position.z=index*.018;mesh.visible=false;stage.add(mesh);
    const entry={id:item.id,mesh,uniforms,level:settings.levels[item.id]/100,status:'loading' as 'loading'|'ready'|'failed'};
    const ready=new Promise<void>(resolve=>{
      const texture=loader.load(`/apartments/assets/north-city/holograms/${item.id}.jpg`,loaded=>{
        if(disposed){loaded.dispose();resolve();return;}
        const crop=uniforms.uCrop.value,aspect=loaded.image.width/loaded.image.height*(crop.z-crop.x)/(crop.w-crop.y);
        uniforms.uTexel.value.set(1/loaded.image.width,1/loaded.image.height);
        const h=Math.min(22,22/aspect);mesh.scale.set(h*aspect,h,1);entry.status='ready';resolve();
      },undefined,()=>{entry.status='failed';resolve();});
      texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;textures.add(texture);uniforms.uArtwork.value=texture;
    });
    return {...entry,ready,source:entry};
  });

  // One batched set of projection rays and focusing rings, rooted in the chip.
  const linePositions:number[]=[],lineColors:number[]=[];
  function segment(a:number[],b:number[],color:THREE.Color){linePositions.push(...a,...b);for(let i=0;i<2;i++)lineColors.push(color.r,color.g,color.b);}
  const blue=new THREE.Color('#65dfff'),pink=new THREE.Color('#f48fcf');
  for(let ring=0;ring<3;ring++)for(let n=0;n<96;n++){
    if(n%24>19)continue;const a=n/96*Math.PI*2,b=(n+1)/96*Math.PI*2,r=1.8+ring*.65;
    segment([Math.cos(a)*r,.06+ring*.03,Math.sin(a)*r],[Math.cos(b)*r,.06+ring*.03,Math.sin(b)*r],ring%2?pink:blue);
  }
  for(let n=0;n<16;n++){
    const a=n/16*Math.PI*2;
    segment([Math.cos(a)*.75,.08,Math.sin(a)*.75],[Math.cos(a)*5.3,10.8,Math.sin(a)*5.3],n%3?blue:pink);
  }
  const raysGeometry=geometry(new THREE.BufferGeometry());raysGeometry.setAttribute('position',new THREE.Float32BufferAttribute(linePositions,3));raysGeometry.setAttribute('color',new THREE.Float32BufferAttribute(lineColors,3));
  const raysMat=material(new THREE.ShaderMaterial({uniforms:common,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,toneMapped:false,
    vertexShader:`varying vec3 vColor;varying float vDepth,vHeight;void main(){vColor=color;vHeight=position.y;vec4 p=modelViewMatrix*vec4(position,1.0);vDepth=length(p.xyz);gl_Position=projectionMatrix*p;}`,
    fragmentShader:`uniform float uTime,uPower,uFog,uEnvelope;varying vec3 vColor;varying float vDepth,vHeight;
      void main(){float pulse=.7+.3*sin(vHeight*1.8-uTime*2.0);float fade=mix(.5,.035,smoothstep(.1,11.0,vHeight));gl_FragColor=vec4(vColor*uPower,fade*pulse*uEnvelope*exp(-uFog*vDepth));
      #include <colorspace_fragment>
      }`}));
  const rays=new THREE.LineSegments(raysGeometry,raysMat);rays.name='Chip focusing rings and rising light rays';volume.add(rays);
  const positions:number[]=[],seeds:number[]=[],colors:number[]=[];
  for(let n=0;n<240;n++){
    const f=(n*.61803398875)%1,a=n*2.399963,r=Math.sqrt(f)*6;
    positions.push(Math.cos(a)*r,1+(n*.41421356237%1)*21,Math.sin(a)*r);
    seeds.push(f);const color=n%3?blue:pink;colors.push(color.r,color.g,color.b);
  }
  const particleGeo=geometry(new THREE.BufferGeometry());particleGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));particleGeo.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,1));particleGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const particleMat=material(new THREE.ShaderMaterial({uniforms:common,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,toneMapped:false,
    vertexShader:`uniform float uTime;attribute float seed;varying vec3 vColor;varying float vDepth,vLife;
      void main(){vec3 p=position;p.y=1.0+mod(p.y+uTime*(.4+seed*.4),22.0);p.x+=sin(uTime*.2+seed*13.0)*.15;
      vLife=sin((p.y-1.0)/22.0*3.14159);vColor=color;vec4 view=modelViewMatrix*vec4(p,1.0);vDepth=length(view.xyz);
      gl_PointSize=clamp((85.0+seed*75.0)/max(1.0,-view.z),1.0,7.0);gl_Position=projectionMatrix*view;}`,
    fragmentShader:`uniform float uPower,uFog,uEnvelope;varying vec3 vColor;varying float vDepth,vLife;
      void main(){float d=length(gl_PointCoord-.5);float glow=pow(max(0.0,1.0-d*2.0),2.0);
      gl_FragColor=vec4(vColor*1.6*uPower,glow*vLife*.6*uEnvelope*exp(-uFog*vDepth));
      #include <colorspace_fragment>
      }`}));
  const particles=new THREE.Points(particleGeo,particleMat);particles.name='Rising holographic data particles';volume.add(particles);
  function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));saved=true;}catch{saved=false;}}
  const controls:CityHologramControls={
    getSettings:()=>({...settings,levels:{...settings.levels}}),
    setSettings:patch=>{settings.brightness=finite(patch.brightness,settings.brightness,0,150);settings.size=finite(patch.size,settings.size,60,140);if(typeof patch.animated==='boolean')settings.animated=patch.animated;persist();},
    setLevel:(id,value)=>{if(!CITY_HOLOGRAMS.some(item=>item.id===id))return;settings.levels[id]=finite(value,settings.levels[id],0,100);persist();},
    solo:id=>{if(!CITY_HOLOGRAMS.some(item=>item.id===id))return;for(const item of CITY_HOLOGRAMS)settings.levels[item.id]=item.id===id?100:0;persist();},
    allOff:()=>{for(const item of CITY_HOLOGRAMS)settings.levels[item.id]=0;persist();},
    reset:()=>{settings=defaults();persist();},
    isSaved:()=>saved,
    getSnapshot:()=>({settings:controls.getSettings(),saved,origin:group.position.toArray(),worldOrigin:group.getWorldPosition(new THREE.Vector3()).toArray(),
      orientation:'fixed world plane, tilted 0.40 radians toward the balcony',animationTime:clock,
      active:entries.filter(e=>volume.visible&&e.mesh.visible).map(e=>({id:e.id,opacity:e.uniforms.uLevel.value})),
      seasonalProjection:pumpkin.snapshot(),
      assets:Object.fromEntries(entries.map(e=>[e.id,e.source.status])),emitterVisible:volume.visible||pumpkin.group.visible,disposed}),
  };
  function setWeather(mode:OsCityWeather,time:CityTimeOfDay){weather=mode;timeOfDay=time;common.uFog.value=getCityWeatherPreset(mode,time).neonFogDensity;}
  function update(delta:number,reducedMotion=false){
    if(disposed)return;
    if(settings.animated&&!reducedMotion)clock+=Math.min(.1,Math.max(0,delta));
    common.uTime.value=clock;
    let sum=0;
    for(const entry of entries){
      const target=settings.levels[entry.id]/100;
      entry.level=reducedMotion?target:THREE.MathUtils.lerp(entry.level,target,1-Math.exp(-Math.max(0,delta)*7));
      if(Math.abs(entry.level-target)<.001)entry.level=target;
      entry.mesh.visible=entry.level>.001&&entry.source.status==='ready';
      if(entry.mesh.visible)sum+=entry.level;
    }
    const normalization=1/Math.max(1,Math.sqrt(sum));
    for(const entry of entries)entry.uniforms.uLevel.value=entry.level*normalization;
    const profile=getCityWeatherPreset(weather,timeOfDay);
    common.uPower.value=settings.brightness/100*(timeOfDay==='day'?1.7:1.1);
    common.uEnvelope.value=Math.min(1,sum);
    // Do not create real lights or shadow passes for additive projections.
    volume.visible=!pumpkin.group.visible&&sum>.001&&settings.brightness>0;volume.scale.setScalar(settings.size/100);
    common.uFog.value=profile.neonFogDensity;
    pumpkin.update(delta,reducedMotion,profile.neonFogDensity,timeOfDay==='day'?1.65:1.2);
  }
  setWeather('rain','day');
  return {group,controls,ready:Promise.all(entries.map(e=>e.ready)).then(()=>{update(0);}),update,setWeather,
    setHalloween:(active:boolean)=>{pumpkin.group.visible=active;update(0);},
    dispose:()=>{if(disposed)return;disposed=true;pumpkin.dispose();group.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
