/** Original, locally synthesized Halloween programs. No downloads or autoplay. */
export const CITY_RADIO_PROGRAMS = [
  {id:'midnight',name:'Midnight Circuit',kind:'Music',description:'Minor-key synth bass, glass arpeggios and a slow electronic beat.'},
  {id:'clockwork',name:'Clockwork Haunt',kind:'Music',description:'A haunted music-box waltz with distant organ chords.'},
  {id:'ghost',name:'Ghost Signal',kind:'Music',description:'Drifting theremin melodies over a deep, spectral drone.'},
  {id:'wind',name:'Whispers in the Wires',kind:'Ambience',description:'Hollow wind, ghostly whispers and faraway chimes.'},
  {id:'reactor',name:'Pumpkin Reactor',kind:'Ambience',description:'A mechanical heartbeat, electrical crackles and low engine hum.'},
] as const;
export type CityRadioProgram = typeof CITY_RADIO_PROGRAMS[number]['id'];
export interface CityRadioState {
  program: CityRadioProgram; volume: number; playing: boolean; loading: boolean;
  error: string | null; context: string; level: number;
}
const storageKey='north-city-desk-radio-v1';
const isProgram=(value:unknown):value is CityRadioProgram=>CITY_RADIO_PROGRAMS.some(p=>p.id===value);

/** Render a complete phrase plus its reverb tail, folding the tail into the loop start. */
export async function renderRadioProgram(program:CityRadioProgram):Promise<AudioBuffer> {
  const sampleRate=24000, duration=program==='midnight'?20:program==='clockwork'?24:32, tail=5;
  const ctx=new OfflineAudioContext(2,Math.ceil((duration+tail)*sampleRate),sampleRate);
  const bus=ctx.createGain();bus.gain.value=.65;bus.connect(ctx.destination);
  const delay=ctx.createDelay(2),feedback=ctx.createGain(),wet=ctx.createGain();
  delay.delayTime.value=program==='clockwork'?.333:.375;feedback.gain.value=.32;wet.gain.value=.3;
  bus.connect(delay);delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(ctx.destination);
  let seed=1729+CITY_RADIO_PROGRAMS.findIndex(p=>p.id===program)*733;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const hz=(midi:number)=>440*2**((midi-69)/12);
  const tone=(time:number,seconds:number,freq:number,amp:number,type:OscillatorType='sine',pan=0,slide=freq,attack=.02)=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain(),panner=ctx.createStereoPanner();
    osc.type=type;osc.frequency.setValueAtTime(freq,time);osc.frequency.exponentialRampToValueAtTime(Math.max(15,slide),time+seconds);
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(amp,time+Math.min(attack,seconds*.2));
    gain.gain.exponentialRampToValueAtTime(.00001,time+seconds);
    panner.pan.value=pan;osc.connect(gain);gain.connect(panner);panner.connect(bus);osc.start(time);osc.stop(time+seconds);
  };
  const noise=ctx.createBuffer(1,sampleRate*2,sampleRate),data=noise.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=random()*2-1;
  const hiss=(time:number,seconds:number,amp:number,freq:number,pan=0,q=.8)=>{
    const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),panner=ctx.createStereoPanner();
    src.buffer=noise;src.loop=true;filter.type='bandpass';filter.frequency.value=freq;filter.Q.value=q;
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(amp,time+Math.min(.6,seconds*.2));
    gain.gain.linearRampToValueAtTime(0,time+seconds);panner.pan.value=pan;
    src.connect(filter);filter.connect(gain);gain.connect(panner);panner.connect(bus);src.start(time,random());src.stop(time+seconds);
  };
  if(program==='midnight') {
    const beat=.625,roots=[33,33,29,28],arp=[0,7,12,15,12,7,3,7];
    for(let i=0;i<32;i++) {
      const t=i*beat,root=roots[Math.floor(i/8)];
      tone(t,.22,110,.48,'sine',0,42,.004);
      tone(t,.43,hz(root),.13,'triangle');
      if(i%2)hiss(t,.18,.24,1700);
      hiss(t+beat/2,.07,.09,6500,.25);
      for(let j=0;j<2;j++)tone(t+j*beat/2,.75,hz(root+24+arp[(i*2+j)%8]),.065,'sine',Math.sin(i)*.55);
    }
  } else if(program==='clockwork') {
    const melody=[81,84,83,81,76,79,80,76,74,77,76,71,72,76,75,71,69,72,71,69,68,71,74,80];
    for(let bar=0;bar<12;bar++) {
      const root=[45,41,38,40][Math.floor(bar/3)];
      for(const interval of [0,7,15])tone(bar*2,1.85,hz(root+interval),.032,'triangle',-.25, hz(root+interval),.18);
      for(let beat=0;beat<3;beat++) {
        const t=bar*2+beat*2/3,note=melody[(bar*3+beat)%melody.length];
        tone(t,1.3,hz(note),beat===0?.13:.085,'sine',.25);
        tone(t,.45,hz(note)*2.76,.025,'sine',-.3);
        hiss(t,.04,.035,3600);
      }
    }
  } else if(program==='ghost') {
    const notes=[69,72,71,68,65,64,68,71];
    for(let i=0;i<8;i++) {
      const t=i*4;
      tone(t,4.8,hz(notes[i]),.12,'sine',Math.sin(i)*.6,hz(notes[(i+1)%8]),.8);
      tone(t,4.9,55,.1,'sine',-.2,55,.8);
      tone(t,4.6,82.4,.045,'triangle',.2,82.8,.8);
      hiss(t,4.5,.035,950,Math.cos(i)*.6,3);
    }
  } else if(program==='wind') {
    for(let i=0;i<16;i++) {
      hiss(i*2,5,.18,270+random()*850,random()*1.4-.7,2);
      hiss(i*2+.8,2.9,.035,1800+random()*700,-.5,7);
      if(i%3===0)tone(i*2+.2,3.5,hz([81,87,88,93][i%4]),.1,'sine',random()-.5);
    }
  } else {
    for(let i=0;i<16;i++) {
      const t=i*2;
      tone(t,.25,76,.38,'sine',0,34,.008);tone(t+.32,.3,64,.27,'sine',0,30,.008);
      tone(t,2.4,48,.05,'triangle',-.2,47.5,.3);
      hiss(t+1+random()*.5,.08,.19,2400,random()*1.6-.8,3);
      tone(t+1.1,.16,900+random()*700,.025,'square',.4,320);
    }
  }
  const rendered=await ctx.startRendering(),length=duration*sampleRate;
  const output=new AudioBuffer({numberOfChannels:2,length,sampleRate});let peak=0;
  for(let channel=0;channel<2;channel++) {
    const source=rendered.getChannelData(channel),target=output.getChannelData(channel);
    for(let i=0;i<source.length;i++)target[i%length]+=source[i];
    // A 5 ms edge taper removes residual oscillator/DC discontinuities at the wrap.
    const fade=120;
    for(let i=0;i<fade;i++){const blend=i/fade;target[i]*=blend;target[length-1-i]*=blend;}
    for(const sample of target)peak=Math.max(peak,Math.abs(sample));
  }
  if(peak>0)for(let channel=0;channel<2;channel++){const data=output.getChannelData(channel);for(let i=0;i<data.length;i++)data[i]*=.8/peak;}
  return output;
}

export function createCityRadioAudio() {
  let program:CityRadioProgram='midnight',volume=45,playing=false,loading=false,error:string|null=null;
  let context:AudioContext|undefined,master:GainNode|undefined,analyser:AnalyserNode|undefined;
  let source:AudioBufferSourceNode|undefined,sourceGain:GainNode|undefined,version=0,disposed=false;
  const cache=new Map<CityRadioProgram,Promise<AudioBuffer>>(),listeners=new Set<()=>void>();
  const samples=new Float32Array(256);
  try {const saved=JSON.parse(localStorage.getItem(storageKey)??'null');if(isProgram(saved?.program))program=saved.program;if(typeof saved?.volume==='number'&&Number.isFinite(saved.volume))volume=Math.max(0,Math.min(100,saved.volume));} catch {/* Optional storage. */}
  const notify=()=>listeners.forEach(fn=>fn());
  const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify({program,volume}));}catch{/* Optional storage. */}};
  const retire=()=>{if(source){const old=source,gain=sourceGain!;gain.gain.cancelScheduledValues(context!.currentTime);gain.gain.setTargetAtTime(0,context!.currentTime,.025);old.onended=()=>{old.disconnect();gain.disconnect();};old.stop(context!.currentTime+.15);source=undefined;sourceGain=undefined;}};
  const stop=()=>{version++;playing=false;loading=false;retire();notify();};
  const play=async()=>{
    if(disposed)return;
    const ticket=++version;playing=false;loading=true;error=null;retire();notify();
    try {
      if(!context){context=new AudioContext();master=context.createGain();master.gain.value=volume/100*.65;analyser=context.createAnalyser();analyser.fftSize=512;master.connect(analyser);analyser.connect(context.destination);}
      // Resume before awaiting synthesis, while still inside the user's gesture.
      const resumed=context.resume();
      if(!cache.has(program)){if(cache.size>=2)cache.delete(cache.keys().next().value!);cache.set(program,renderRadioProgram(program));}
      const buffer=await cache.get(program)!;await resumed;
      if(disposed||ticket!==version)return;
      if(document.hidden){stop();return;}
      source=context.createBufferSource();source.buffer=buffer;source.loop=true;sourceGain=context.createGain();
      sourceGain.gain.setValueAtTime(0,context.currentTime);sourceGain.gain.linearRampToValueAtTime(1,context.currentTime+.12);
      source.connect(sourceGain);sourceGain.connect(master!);source.start();playing=true;loading=false;notify();
    } catch {if(ticket!==version||disposed)return;cache.delete(program);playing=false;loading=false;error='Audio could not start. Select Play to try again.';notify();}
  };
  const visibility=()=>{if(document.hidden){stop();void context?.suspend().catch(()=>{});}};
  document.addEventListener('visibilitychange',visibility);
  return {
    play,stop,
    select:(id:string)=>{if(!isProgram(id)||disposed||id===program)return;const active=playing||loading;program=id;save();if(active)void play();else notify();},
    setVolume:(value:number)=>{if(!Number.isFinite(value)||disposed)return;volume=Math.max(0,Math.min(100,value));save();master?.gain.setTargetAtTime(volume/100*.65,context!.currentTime,.03);notify();},
    subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>listeners.delete(fn);},
    getSnapshot:():CityRadioState=>{let level=0;if(analyser&&playing&&context?.state==='running'){analyser.getFloatTimeDomainData(samples);level=Math.sqrt(samples.reduce((sum,v)=>sum+v*v,0)/samples.length);}return{program,volume,playing,loading,error,context:context?.state??'uninitialized',level};},
    dispose:()=>{if(disposed)return;disposed=true;stop();document.removeEventListener('visibilitychange',visibility);listeners.clear();cache.clear();master?.disconnect();analyser?.disconnect();void context?.close().catch(()=>{});},
  };
}
export type CityRadioAudio=ReturnType<typeof createCityRadioAudio>;
