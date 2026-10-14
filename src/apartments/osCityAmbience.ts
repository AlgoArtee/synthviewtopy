import { CITY_BED, CITY_WINDOW, CITY_BALCONY_DOOR, insideCityBalcony } from './osCityLayout';
import { CITY_SOUND_LIBRARY } from './osCitySoundLibrary';
import { createCitySoundUploads, inspectUploadedAudio } from './osCitySoundUploads';
import { isCityWeather, type OsCityWeather } from './osCityWeather';

const STORAGE_KEY='north-city-ambience';
export interface CitySoundChoice {id:string;label:string;title:string;author:string;source:string;license:string;licenseUrl:string;url:string;duration:number;custom:boolean;}
interface LoopData {buffer:AudioBuffer;normalizationGain:number;sourceRms:number;}
interface Voice {id:string;node:AudioNode;gain:GainNode;duration:number;normalizationGain:number;sourceRms:number;media?:HTMLAudioElement;stop:()=>void;}

/** Exterior sound reaches an indoor listener through either actual aperture. */
export function citySoundAdmission(windowState:Record<string,unknown>,doorState:Record<string,unknown>,listener:{x:number;y:number;z:number},yaw:number) {
  const turn=Math.max(0,Math.min(1,(Number(windowState.turnDegrees)||0)/90)),tilt=Math.max(0,Math.min(1,(Number(windowState.topOpeningMetres)||0)/.33));
  const windowOpening=Math.max(turn,tilt*.34),doorOpening=Math.max(0,Math.min(1,(Number(doorState.clearWidth)||0)/(CITY_BALCONY_DOOR.maxX-CITY_BALCONY_DOOR.minX)));
  const listenerOutside=insideCityBalcony(listener.x,listener.z)&&listener.z<CITY_BALCONY_DOOR.z-.12;
  const path=(x:number,y:number,z:number,aperture:number)=>{
    const dx=x-listener.x,dy=y-listener.y,dz=z-listener.z,distance=Math.hypot(dx,dy,dz);
    return {gain:aperture/(1+(distance/11)**1.35),pan:Math.max(-.65,Math.min(.65,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/Math.max(4,distance)))};
  };
  const windowPath=path(CITY_BED.minX+1.1,2.2,CITY_WINDOW.z,windowOpening),doorPath=path((CITY_BALCONY_DOOR.minX+CITY_BALCONY_DOOR.maxX)/2,1.3,CITY_BALCONY_DOOR.z,doorOpening);
  const weight=windowPath.gain+doorPath.gain;
  return {windowOpening,doorOpening,listenerOutside,opening:listenerOutside?1:1-(1-windowOpening)*(1-doorOpening),
    admission:listenerOutside?1:1-(1-windowPath.gain)*(1-doorPath.gain),windowAdmission:windowPath.gain,doorAdmission:doorPath.gain,
    lowpassHz:listenerOutside?9000:weight>0?((360+turn*7240+tilt*1740)*windowPath.gain+(360+doorOpening*7240)*doorPath.gain)/weight:360,
    panning:listenerOutside?0:weight>0?(windowPath.pan*windowPath.gain+doorPath.pan*doorPath.gain)/weight:0};
}

/** Weather-curated recordings, with window/door admission and outdoor listening. */
export function createOsCityAmbience(onChange:()=>void=()=>{},initialWeather:string='rain') {
  let weather:OsCityWeather=isCityWeather(initialWeather)?initialWeather:'rain',muted=false,volume=.55;
  const selections:Partial<Record<OsCityWeather,string>>={};
  try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)??'null');if(saved){muted=saved.muted===true;if(typeof saved.volume==='number'&&Number.isFinite(saved.volume))volume=Math.max(0,Math.min(1,saved.volume));for(const [key,value] of Object.entries(saved.selections??{}))if(isCityWeather(key)&&typeof value==='string')selections[key]=value;}}catch{/* Storage is optional. */}
  const uploads=createCitySoundUploads(),cache=new Map<string,LoopData>(),retiring=new Set<Voice>(),cleanupTimers=new Set<number>();
  let context:AudioContext|undefined,filter:BiquadFilterNode|undefined,pan:StereoPannerNode|undefined,master:GainNode|undefined,analyser:AnalyserNode|undefined;
  let voice:Voice|undefined,pendingId:string|undefined,controller:AbortController|undefined,generation=0,disposed=false,error:string|null=null,uploadNotice='';
  let opening=0,targetGain=0,lowpassHz=360,lastGain=-1,lastFrequency=-1,lastPan=2,closeTimer:number|undefined;
  let acoustic=citySoundAdmission({}, {}, {x:0,y:1.65,z:1},0);
  const notify=()=>{if(!disposed)onChange();};
  function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({muted,volume,selections}));}catch{/* Session settings still work. */}}
  function getChoices():CitySoundChoice[]{
    const builtins=CITY_SOUND_LIBRARY.choices[weather].map(choice=>{const track=CITY_SOUND_LIBRARY.tracks.find(t=>t.id===choice.trackId)!;return{...track,label:choice.label,custom:false};});
    return [...builtins,...uploads.list().filter(u=>u.weather===weather).map(u=>({id:u.id,label:'Your audio · '+u.name,title:u.name,author:'Your audio',source:'',license:'Stored on this device',licenseUrl:'',url:'',duration:u.duration,custom:true}))];
  }
  function selected(){const choices=getChoices();return choices.find(t=>t.id===selections[weather])??choices[0];}
  void uploads.ready.then(()=>{if(disposed)return;notify();if(opening>.001&&!muted&&context)void loadSelected();});
  function clearCloseTimer(){if(closeTimer!==undefined){clearTimeout(closeTimer);closeTimer=undefined;}}
  function createContext(){
    if(context)return context;
    context=new AudioContext();filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=360;
    pan=context.createStereoPanner();master=context.createGain();master.gain.value=0;analyser=context.createAnalyser();analyser.fftSize=1024;
    filter.connect(pan);pan.connect(master);master.connect(analyser);analyser.connect(context.destination);context.onstatechange=notify;return context;
  }
  function seamlessLoop(original:AudioBuffer,ctx:AudioContext):LoopData{
    const overlap=Math.min(Math.round(original.sampleRate*2),Math.floor(original.length/4)),length=original.length-overlap;
    const loop=ctx.createBuffer(original.numberOfChannels,length,original.sampleRate);let energy=0,peak=0;
    for(let c=0;c<original.numberOfChannels;c++){const input=original.getChannelData(c);for(let i=0;i<input.length;i++){energy+=input[i]*input[i];peak=Math.max(peak,Math.abs(input[i]));}}
    const sourceRms=Math.sqrt(energy/(original.length*original.numberOfChannels)),normalizationGain=Math.min(12,.11/Math.max(sourceRms,1e-6),.60/Math.max(peak,1e-6));
    for(let c=0;c<original.numberOfChannels;c++){const input=original.getChannelData(c),output=loop.getChannelData(c);output.set(input.subarray(overlap,original.length-overlap));for(let i=0;i<overlap;i++){const t=i/(overlap-1)*Math.PI/2;output[length-overlap+i]=input[original.length-overlap+i]*Math.cos(t)+input[i]*Math.sin(t);}for(let i=0;i<output.length;i++)output[i]*=normalizationGain;}
    return{buffer:loop,normalizationGain,sourceRms};
  }
  function retire(old:Voice){
    if(!context||retiring.has(old))return;retiring.add(old);old.gain.gain.setTargetAtTime(0,context.currentTime,.16);
    const timer=window.setTimeout(()=>{old.stop();retiring.delete(old);cleanupTimers.delete(timer);},1500);cleanupTimers.add(timer);
  }
  function install(next:Voice){if(voice)retire(voice);voice=next;next.gain.gain.setTargetAtTime(1,context!.currentTime,.18);apply();notify();}
  async function loadSelected(){
    if(selections[weather]?.startsWith('user-'))await uploads.ready;if(disposed||!context)return;const track=selected();
    if(voice?.id===track.id||pendingId===track.id)return;
    controller?.abort();controller=new AbortController();const signal=controller.signal,token=++generation;pendingId=track.id;error=null;notify();
    let preparedGain:GainNode|undefined;
    try{
      const gain=context.createGain();preparedGain=gain;gain.gain.value=0;gain.connect(filter!);
      if(track.custom){
        const record=uploads.get(track.id);if(!record)throw new Error('Saved audio is no longer available.');
        const url=URL.createObjectURL(record.blob),media=new Audio(url);media.loop=true;media.preload='auto';
        const node=context.createMediaElementSource(media);node.connect(gain);
        const next:Voice={id:track.id,node,gain,media,duration:record.duration,normalizationGain:1,sourceRms:0,stop:()=>{media.pause();media.removeAttribute('src');media.load();node.disconnect();gain.disconnect();URL.revokeObjectURL(url);}};
        if(disposed||token!==generation){next.stop();return;}
        install(next);preparedGain=undefined;try{await media.play();}catch{/* The Play control retries a browser-blocked media gesture. */}
      }else{
        let loop=cache.get(track.id);
        if(!loop){const response=await fetch(track.url,{signal});if(!response.ok)throw new Error('Audio download failed');const decoded=await context.decodeAudioData(await response.arrayBuffer());if(disposed||token!==generation){gain.disconnect();return;}loop=seamlessLoop(decoded,context);cache.set(track.id,loop);while(cache.size>2)cache.delete(cache.keys().next().value!);}
        if(disposed||token!==generation){gain.disconnect();return;}
        const source=context.createBufferSource();source.buffer=loop.buffer;source.loop=true;source.connect(gain);source.start();
        install({id:track.id,node:source,gain,duration:loop.buffer.duration,normalizationGain:loop.normalizationGain,sourceRms:loop.sourceRms,stop:()=>{try{source.stop();}catch{/* Already stopped. */}source.disconnect();gain.disconnect();}});preparedGain=undefined;
      }
    }catch(e){if(!disposed&&token===generation&&!signal.aborted){error=e instanceof Error?e.message:'City sound could not load.';if(voice){retire(voice);voice=undefined;}}}
    finally{preparedGain?.disconnect();if(token===generation){pendingId=undefined;notify();}}
  }
  function apply(){
    if(!context||!master||!filter||!pan)return;const desired=!muted&&!document.hidden&&volume>0?targetGain:0,now=context.currentTime;
    if(Math.abs(desired-lastGain)>.001||desired===0&&lastGain!==0){master.gain.setTargetAtTime(desired,now,.18);lastGain=desired;}
    if(Math.abs(lowpassHz-lastFrequency)>20){filter.frequency.setTargetAtTime(lowpassHz,now,.22);lastFrequency=lowpassHz;}
    if(desired>.0001)clearCloseTimer();
    else if(closeTimer===undefined&&context.state==='running')closeTimer=window.setTimeout(()=>{closeTimer=undefined;if(!disposed&&context?.state==='running'&&(opening<.001||muted||volume===0||document.hidden)){voice?.media?.pause();void context.suspend().catch(()=>{});}},1200);
  }
  // Resume synchronously in the user's gesture, before fetching/decoding or IndexedDB.
  function prime(){
    if(disposed||muted||volume===0)return;error=null;clearCloseTimer();
    try{const ctx=createContext();if(ctx.state==='suspended')void ctx.resume().then(notify).catch(notify);if(voice?.media?.paused)void voice.media.play().then(notify).catch(notify);if(opening>.001)void loadSelected();apply();notify();}
    catch{error='City sound is unavailable in this browser.';notify();}
  }
  function update(windowState:Record<string,unknown>,listener:{x:number;y:number;z:number},yaw:number,doorState:Record<string,unknown>={}){
    const previous=acoustic;acoustic=citySoundAdmission(windowState,doorState,listener,yaw);
    const changed=Math.abs(acoustic.opening-opening)>.01||previous.listenerOutside!==acoustic.listenerOutside||Math.abs(previous.doorOpening-acoustic.doorOpening)>.01;
    opening=acoustic.opening;targetGain=.62*volume*acoustic.admission;
    const weatherFilter=weather==='snow'?.72:weather==='fog'||weather==='academic-foggy-night'?.82:1;
    lowpassHz=acoustic.lowpassHz*weatherFilter;
    const panning=acoustic.panning;
    if(context&&pan&&Math.abs(panning-lastPan)>.015){pan.pan.setTargetAtTime(panning,context.currentTime,.25);lastPan=panning;}
    apply();if(opening>.001&&!muted&&volume>0&&context&&!error&&!pendingId&&voice?.id!==selected().id)void loadSelected();if(changed)notify();
  }
  function changeSelection(){generation++;controller?.abort();pendingId=undefined;error=null;save();if(opening>.001&&!muted&&volume>0)prime();notify();}
  function setWeather(value:string){if(!isCityWeather(value)||weather===value)return;weather=value;changeSelection();}
  function setTrack(id:string){if(!getChoices().some(t=>t.id===id))return;selections[weather]=id;changeSelection();}
  function setMuted(value:boolean){muted=value;save();if(!muted&&opening>.001)prime();apply();notify();}
  function setVolume(value:number){if(!Number.isFinite(value))return;volume=Math.max(0,Math.min(1,value));save();if(volume>0&&opening>.001&&!muted)prime();apply();notify();}
  async function upload(file:File){
    uploadNotice='Reading your audio…';notify();const assignedWeather=weather;
    try{const duration=await inspectUploadedAudio(file);if(disposed)return;const id='user-'+crypto.randomUUID(),persisted=await uploads.put({id,weather:assignedWeather,name:file.name,blob:file,duration,created:Date.now()});if(disposed)return;selections[assignedWeather]=id;uploadNotice=persisted?'Saved on this device.':'Available for this session; browser storage is unavailable.';if(weather===assignedWeather)changeSelection();else save();notify();}
    catch(e){uploadNotice=e instanceof Error?e.message:'Could not read this audio.';notify();}
  }
  async function removeUpload(){const track=selected(),assignedWeather=weather;if(!track.custom)return;try{await uploads.remove(track.id);delete selections[assignedWeather];uploadNotice='Your audio was removed from this device.';if(weather===assignedWeather)changeSelection();else{save();notify();}}catch{uploadNotice='Could not remove the saved audio. Please try again.';notify();}}
  function getSnapshot(){
    const track=selected();let rms=0;if(context?.state==='running'&&analyser&&master&&master.gain.value>.0001){const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);rms=Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length);}
    const ready=voice?.id===track.id,playing=ready&&context?.state==='running'&&(!voice?.media||!voice.media.paused);
    return{enabled:!muted,muted,volume,weather,selectedId:track.id,selectedLabel:track.label,custom:track.custom,choices:getChoices().length,builtinChoices:CITY_SOUND_LIBRARY.choices[weather].length,uploadCount:uploads.list().length,uploadStorage:uploads.getSnapshot(),uploadNotice,opening:+opening.toFixed(4),windowOpening:+acoustic.windowOpening.toFixed(4),doorOpening:+acoustic.doorOpening.toFixed(4),listenerOutside:acoustic.listenerOutside,admission:+acoustic.admission.toFixed(5),windowAdmission:+acoustic.windowAdmission.toFixed(5),doorAdmission:+acoustic.doorAdmission.toFixed(5),targetGain:muted||document.hidden?0:+targetGain.toFixed(5),gain:+(master?.gain.value??0).toFixed(5),lowpassHz:+lowpassHz.toFixed(1),pan:+(pan?.pan.value??0).toFixed(3),rms:+rms.toFixed(7),contextState:context?.state??'not-created',ready,loop:true,normalizationGain:voice?.normalizationGain??1,sourceRms:voice?.sourceRms??0,duration:voice?.duration??0,asset:track.url,state:disposed?'disposed':muted?'muted':volume===0?'silent':opening<.001?'closed':error?'error':pendingId?'loading':playing?'playing':'needs-gesture',error};
  }
  function visibility(){clearCloseTimer();apply();if(document.hidden){voice?.media?.pause();if(context?.state==='running')void context.suspend().catch(()=>{});}else if(opening>.001&&!muted&&volume>0){if(context?.state==='suspended')void context.resume().then(()=>{apply();notify();}).catch(notify);if(voice?.media?.paused)void voice.media.play().then(notify).catch(notify);}notify();}
  document.addEventListener('visibilitychange',visibility);
  function dispose(){disposed=true;generation++;controller?.abort();clearCloseTimer();cleanupTimers.forEach(clearTimeout);document.removeEventListener('visibilitychange',visibility);voice?.stop();retiring.forEach(v=>v.stop());retiring.clear();filter?.disconnect();pan?.disconnect();master?.disconnect();analyser?.disconnect();if(context){context.onstatechange=null;void context.close().catch(()=>{});}voice=undefined;cache.clear();uploads.dispose();}
  return{prime,update,setWeather,setTrack,getChoices,setMuted,setVolume,upload,removeUpload,getSnapshot,dispose};
}
export type CityAmbience=ReturnType<typeof createOsCityAmbience>;
