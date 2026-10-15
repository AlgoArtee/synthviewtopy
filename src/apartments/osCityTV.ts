import * as THREE from 'three';
import { CITY_BED } from './osCityLayout';
import { CITY_TV_CHANNELS, CITY_TV_FRAGMENT, CITY_TV_STORIES, drawTVGraphics, type CityTVChannel } from './osCityTVProgramming';

export interface CityTVSettings { channel: CityTVChannel; paused: boolean; autoCycle: boolean }
export interface CityTVControls {
  getSnapshot: () => CityTVSettings & { playing: boolean; reducedMotion: boolean; elapsed: number; headline: string | null; saved: boolean };
  setSettings: (settings: Partial<CityTVSettings>) => void;
  nextStory: () => void;
  subscribe: (listener: () => void) => () => void;
}

/** A wall-mounted optical rail with local animated programming and fictional news. */
export function createOsCityTV() {
  const group=new THREE.Group();group.name='Left-wall holographic television';
  // Local +Z is the inward-facing optical front; local X follows the west wall.
  group.position.set(CITY_BED.minX+.145,2.12,CITY_BED.centerZ);group.rotation.y=Math.PI/2;
  const add=(name:string,g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0)=>{
    const o=new THREE.Mesh(g,m);o.name=name;o.position.set(x,y,z);o.castShadow=false;o.receiveShadow=false;group.add(o);return o;
  };
  const alloy=new THREE.MeshStandardMaterial({color:'#aabcc8',metalness:.88,roughness:.24});
  const black=new THREE.MeshStandardMaterial({color:'#162c39',metalness:.4,roughness:.3});
  const led=new THREE.MeshBasicMaterial({color:'#84cce1',transparent:true,opacity:.55});
  for(const x of [-1.42,1.42])add('TV · short wall attachment',new THREE.BoxGeometry(.08,.18,.15),alloy,x,-1.06,-.075);
  add('TV · wall-mounted optical projector rail',new THREE.BoxGeometry(3.86,.065,.12),alloy,0,-1.06);
  add('TV · black optical aperture',new THREE.BoxGeometry(3.70,.012,.095),black,0,-1.021,.005);
  add('TV · recessed cyan optical slit',new THREE.BoxGeometry(3.55,.004,.008),led,0,-1.012,.035);
  const storageKey='north-city-bed-tv-v1';
  const settings:CityTVSettings={channel:'news',paused:false,autoCycle:false};
  let saved=false;
  const validChannel=(id:unknown):id is CityTVChannel=>CITY_TV_CHANNELS.some(item=>item.id===id);
  try { const stored=JSON.parse(localStorage.getItem(storageKey)??'null');
    if(stored&&typeof stored==='object'){
      saved=true;
      if(validChannel(stored.channel))settings.channel=stored.channel;
      if(typeof stored.paused==='boolean')settings.paused=stored.paused;
      if(typeof stored.autoCycle==='boolean')settings.autoCycle=stored.autoCycle;
    }
  } catch { /* Storage is optional; the TV still works for this visit. */ }
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let playhead=0,lastTime:number|undefined,cycleElapsed=0,lastDraw=-Infinity;
  const listeners=new Set<()=>void>();
  const persist=()=>{try{localStorage.setItem(storageKey,JSON.stringify(settings));saved=true;}catch{saved=false;}};
  const notify=()=>listeners.forEach(listener=>listener());
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=696;
  const c=canvas.getContext('2d')!;
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.generateMipmaps=false;map.minFilter=THREE.LinearFilter;
  const uniforms={time:{value:0},programme:{value:0},graphics:{value:map}};
  const film=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:`varying vec2 q;void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:CITY_TV_FRAGMENT});
  add('TV · translucent animated art channel',new THREE.PlaneGeometry(3.72,2.02),film,0,0,.055);
  // Thin light corners describe a floating television without a heavy opaque chassis.
  for(const sx of [-1,1])for(const sy of [-1,1]){
    add('TV · holographic corner marker',new THREE.PlaneGeometry(.15,.002),led,sx*1.77,sy*.995,.06);
    add('TV · holographic corner marker',new THREE.PlaneGeometry(.002,.10),led,sx*1.845,sy*.945,.06);
  }
  const draw=()=>{drawTVGraphics(c,settings.channel,playhead);map.needsUpdate=true;lastDraw=playhead;};
  const sync=()=>{uniforms.programme.value=CITY_TV_CHANNELS.find(item=>item.id===settings.channel)!.programme;uniforms.time.value=playhead;draw();};
  const controls:CityTVControls={
    getSnapshot:()=>({...settings,playing:!settings.paused&&!motion.matches,reducedMotion:motion.matches,elapsed:Math.round(playhead*1000)/1000,saved,
      headline:settings.channel==='news'?CITY_TV_STORIES[Math.floor(playhead/14)%CITY_TV_STORIES.length].title.join(' '):null}),
    setSettings(patch){
      if(validChannel(patch.channel)){settings.channel=patch.channel;playhead=0;cycleElapsed=0;}
      if(typeof patch.paused==='boolean')settings.paused=patch.paused;
      if(typeof patch.autoCycle==='boolean'){settings.autoCycle=patch.autoCycle;cycleElapsed=0;}
      persist();sync();notify();
    },
    nextStory(){if(settings.channel!=='news')return;playhead=(Math.floor(playhead/14)+1)*14;sync();notify();},
    subscribe(listener){listeners.add(listener);return()=>{listeners.delete(listener);};},
  };
  // Prefer reduced motion immediately, including when it changes while the room is open.
  const onMotion=()=>notify();motion.addEventListener('change',onMotion);
  group.userData.television={wall:'west / left when facing city',centreZ:CITY_BED.centerZ,bedCentreAligned:true,width:3.72,height:2.02,panelClearance:.2,channels:CITY_TV_CHANNELS.map(item=>item.id),news:'Fictional North City bulletins'};
  sync();
  return {group,controls,dispose(){motion.removeEventListener('change',onMotion);listeners.clear();},update(t:number){
    const dt=lastTime===undefined?0:Math.max(0,t-lastTime);lastTime=t;
    if(settings.paused||motion.matches)return;
    const previousStory=Math.floor(playhead/14);playhead+=dt;cycleElapsed+=dt;
    if(settings.autoCycle&&cycleElapsed>=60){
      const index=CITY_TV_CHANNELS.findIndex(item=>item.id===settings.channel);
      settings.channel=CITY_TV_CHANNELS[(index+Math.floor(cycleElapsed/60))%CITY_TV_CHANNELS.length].id;
      cycleElapsed%=60;playhead=cycleElapsed;persist();sync();notify();
    }
    uniforms.time.value=playhead;
    // Only the news graphic uploads a changing texture, capped at 24 fps.
    if(settings.channel==='news'&&playhead-lastDraw>=1/24)draw();
    if(settings.channel==='news'&&Math.floor(playhead/14)!==previousStory)notify();
  }};
}
