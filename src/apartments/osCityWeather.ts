import { ACADEMIC_WEATHER_PRESETS } from '../data/academicCampus';

export type OsCityWeather = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog'
  | 'academic-autumn' | 'academic-overcast' | 'academic-rainy-dusk' | 'academic-foggy-night';
export type CityTimeOfDay='night'|'morning'|'day'|'evening';
export const CITY_TIME_OPTIONS:{id:CityTimeOfDay;label:string}[]=[
  {id:'night',label:'Night'},{id:'morning',label:'Morning'},{id:'day',label:'Day'},{id:'evening',label:'Evening'},
];
export const isCityTimeOfDay=(value:string):value is CityTimeOfDay=>CITY_TIME_OPTIONS.some(option=>option.id===value);
const academicLabels:Record<string,string>={'academic-autumn':'Autumn after rain','academic-overcast':'Overcast','academic-rainy-dusk':'Rainy','academic-foggy-night':'Foggy'};
export const CITY_WEATHER_OPTIONS = [
  {id:'clear',label:'Clear'}, {id:'cloudy',label:'Overcast'}, {id:'rain',label:'Rain'},
  {id:'storm',label:'Storm'}, {id:'snow',label:'Snow'}, {id:'fog',label:'Fog'},
  ...ACADEMIC_WEATHER_PRESETS.map(p=>({id:p.id,label:academicLabels[p.id]??p.label})),
];
export interface CityWeatherPreset {
  sky:string; fog:number; sun:number; ambient:number; window:number; color:string;
  precipitation:'none'|'rain'|'snow'; rainIntensity:number; wetness:number; autumn:boolean;
}
export const CITY_WEATHER_PRESETS:Record<OsCityWeather,CityWeatherPreset> = {
  clear:{sky:'#9fc8df',fog:.006,sun:2.6,ambient:.42,window:4.2,color:'#fff0d5',precipitation:'none',rainIntensity:0,wetness:0,autumn:false},
  cloudy:{sky:'#9eafbd',fog:.010,sun:.35,ambient:.44,window:2.5,color:'#d4e3f4',precipitation:'none',rainIntensity:0,wetness:0,autumn:false},
  rain:{sky:'#46647a',fog:.011,sun:.12,ambient:.28,window:1.2,color:'#a0c8ed',precipitation:'rain',rainIntensity:1,wetness:1,autumn:false},
  storm:{sky:'#293e55',fog:.017,sun:.06,ambient:.13,window:.5,color:'#87acd8',precipitation:'rain',rainIntensity:1,wetness:1,autumn:false},
  snow:{sky:'#bad0df',fog:.014,sun:.6,ambient:.47,window:2.8,color:'#cbdff8',precipitation:'snow',rainIntensity:0,wetness:0,autumn:false},
  fog:{sky:'#b4c2ca',fog:.05,sun:.08,ambient:.38,window:2,color:'#d7e4ee',precipitation:'none',rainIntensity:0,wetness:0,autumn:false},
  'academic-autumn':{sky:'#68737a',fog:.014,sun:.20,ambient:.30,window:1.6,color:'#c7d0d7',precipitation:'rain',rainIntensity:.14,wetness:.68,autumn:true},
  'academic-overcast':{sky:'#7a898d',fog:.012,sun:.33,ambient:.44,window:2.3,color:'#ced7df',precipitation:'none',rainIntensity:0,wetness:.12,autumn:false},
  'academic-rainy-dusk':{sky:'#3c4b56',fog:.0145,sun:.07,ambient:.18,window:.78,color:'#adbcca',precipitation:'rain',rainIntensity:.8,wetness:1,autumn:true},
  'academic-foggy-night':{sky:'#101b23',fog:.025,sun:.015,ambient:.07,window:.20,color:'#99b2d2',precipitation:'none',rainIntensity:0,wetness:.34,autumn:false},
};
export const isCityWeather=(value:string):value is OsCityWeather=>Object.hasOwn(CITY_WEATHER_PRESETS,value);

export interface ResolvedCityWeatherPreset extends CityWeatherPreset {
  timeOfDay:CityTimeOfDay;
  sunPosition:[number,number,number];
  ambientColor:string;groundColor:string;environmentIntensity:number;exposure:number;
  neonIntensity:number;windowGlow:number;fixtureIntensity:number;
  bloomStrength:number;bloomRadius:number;bloomThreshold:number;
  /** Absolute inverse metres, for emissive-only exp(-density * viewDepth).
   * Body surfaces continue to use the scene's normal exponential-squared fog. */
  neonFogDensity:number;
}

const mixColor=(a:string,b:string,t:number)=>{
  const x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16);
  const channel=(shift:number)=>Math.round(((x>>shift)&255)*(1-t)+((y>>shift)&255)*t);
  return '#'+((channel(16)<<16)|(channel(8)<<8)|channel(0)).toString(16).padStart(6,'0');
};
const academicDay:Partial<Record<OsCityWeather,Pick<CityWeatherPreset,'sky'|'sun'|'ambient'|'window'|'color'>>>= {
  'academic-autumn':{sky:'#aaa38e',sun:.58,ambient:.43,window:2.5,color:'#f3d7b2'},
  'academic-overcast':{sky:'#b1aa96',sun:.50,ambient:.46,window:2.7,color:'#efd8b7'},
  'academic-rainy-dusk':{sky:'#918c80',sun:.20,ambient:.36,window:1.7,color:'#dec6a6'},
  'academic-foggy-night':{sky:'#b9b1a0',sun:.10,ambient:.39,window:2.0,color:'#ebd7b8'},
};
// Cloud cover reduces direct sun, but daytime rain still receives diffuse sky
// light. Apply this only at Day so dawn, dusk and night retain their own balance.
const rainyDay:Partial<Record<OsCityWeather,Pick<CityWeatherPreset,'sky'|'sun'|'ambient'|'window'|'color'>>>= {
  rain:{sky:'#869eaf',sun:.34,ambient:.41,window:2.35,color:'#c5d8e7'},
  storm:{sky:'#617d92',sun:.18,ambient:.30,window:1.55,color:'#b6ccdf'},
};
const resolvedPresets=new Map<string,ResolvedCityWeatherPreset>();

/** Resolve time independently of weather. Historical weather ids and physical
 * precipitation stay stable; suffixes such as "dusk" are only legacy ids.
 * Results are cached, so lights/materials can share them without frame allocations. */
export function getCityWeatherPreset(mode:OsCityWeather,timeOfDay:CityTimeOfDay='day'):ResolvedCityWeatherPreset {
  const key=`${mode}:${timeOfDay}`,cached=resolvedPresets.get(key);if(cached)return cached;
  const base=CITY_WEATHER_PRESETS[mode],academic=mode.startsWith('academic-');
  const day={...base,...academicDay[mode],...(timeOfDay==='day'?rainyDay[mode]:undefined)};
  const wet=base.precipitation==='rain',foggy=mode==='fog'||mode==='academic-foggy-night';
  // X points toward the east-facing balcony. Low dawn light comes from +X;
  // dusk comes from -X, while the daytime sun is high above both outlooks.
  const lighting={
    night:{sunPosition:[-32,28,-24],sun:.017,ambient:.22,window:.13,sky:'#071423',skyMix:.88,color:'#8daed9',ambientColor:'#708aaa',groundColor:'#172331',environment:.18,exposure:.92,neon:1.65,windows:1.40,fixtures:1.30,bloom:.075,radius:.12,threshold:1.8,neonFog:.28},
    morning:{sunPosition:[65,18,-32],sun:.72,ambient:.82,window:.78,sky:academic?'#c4ac88':'#c8b49e',skyMix:academic?.52:.45,color:'#ffcca0',ambientColor:academic?'#d6be9b':'#ddc6aa',groundColor:academic?'#74634a':'#695f51',environment:.43,exposure:1.04,neon:.98,windows:.88,fixtures:.78,bloom:.22,radius:.62,threshold:1.18,neonFog:.52},
    day:{sunPosition:[18,85,-38],sun:1,ambient:1,window:1,sky:day.sky,skyMix:0,color:day.color,ambientColor:academic?'#e6d2ae':'#d7e8f2',groundColor:academic?'#786b4f':'#697881',environment:.50,exposure:1.0,neon:.74,windows:.67,fixtures:.52,bloom:.15,radius:.48,threshold:1.48,neonFog:foggy?.40:.68},
    evening:{sunPosition:[-65,11,22],sun:.39,ambient:.55,window:.43,sky:academic?'#68584f':'#655974',skyMix:.61,color:'#ffad86',ambientColor:academic?'#aa8266':'#b295ad',groundColor:academic?'#4c392d':'#443346',environment:.31,exposure:1.00,neon:1.36,windows:1.18,fixtures:1.08,bloom:.34,radius:.72,threshold:.94,neonFog:.38},
  }[timeOfDay];
  const sky=mixColor(day.sky,lighting.sky,lighting.skyMix);
  const preset:ResolvedCityWeatherPreset={
    ...day,timeOfDay,sky,
    sun:timeOfDay==='night'?Math.max(.008,day.sun*lighting.sun):day.sun*lighting.sun,
    ambient:day.ambient*lighting.ambient,window:day.window*lighting.window,
    color:lighting.color,ambientColor:lighting.ambientColor,groundColor:lighting.groundColor,
    sunPosition:lighting.sunPosition as [number,number,number],
    environmentIntensity:timeOfDay==='day'&&rainyDay[mode]?(mode==='storm'?.42:.52):lighting.environment*(mode==='storm'?.72:wet?.88:1),exposure:lighting.exposure,
    neonIntensity:lighting.neon*(foggy?1.20:1),windowGlow:lighting.windows*(foggy?1.10:1),fixtureIntensity:lighting.fixtures,
    // Keep readable, bright light cores at night. Only fog produces broad halos;
    // rain reflections continue to come from the existing wet surface response.
    bloomStrength:timeOfDay==='night'?(foggy?.495:.075):lighting.bloom+(foggy?.055:wet?.025:0),
    bloomRadius:timeOfDay==='night'?(foggy?.86:.12):Math.min(.88,lighting.radius+(foggy?.08:0)),
    bloomThreshold:timeOfDay==='night'?(foggy?.5616:1.8):lighting.threshold*(foggy?.72:1),
    neonFogDensity:Math.max(.001,base.fog*lighting.neonFog),
  };
  resolvedPresets.set(key,preset);return preset;
}

/** One atmosphere and physical precipitation profile for every apartment outlook.
 * Fog densities are world-space values, without per-district tint or extinction
 * overrides. Night fog keeps the near market legible and obscures remote blocks. */
const atmospherePresets=new Map<string,{timeOfDay:CityTimeOfDay;sky:string;fogDensity:number;fogStrength:number;fogTintMix:number;neonFogDensity:number}>();
export function getCityWeatherAtmosphere(mode:OsCityWeather,timeOfDay:CityTimeOfDay='day'){
  const key=`${mode}:${timeOfDay}`,cached=atmospherePresets.get(key);if(cached)return cached;
  const preset=getCityWeatherPreset(mode,timeOfDay);
  const atmosphere={timeOfDay,sky:preset.sky,fogDensity:preset.fog,fogStrength:1,fogTintMix:0,neonFogDensity:preset.neonFogDensity};
  atmospherePresets.set(key,atmosphere);return atmosphere;
}

function resolveCityPrecipitationProfile(mode:OsCityWeather,timeOfDay:CityTimeOfDay){
  const preset=getCityWeatherPreset(mode,timeOfDay),raining=preset.precipitation==='rain',snowy=preset.precipitation==='snow',storm=mode==='storm',autumn=mode==='academic-autumn';
  return {
    timeOfDay,
    precipitation:preset.precipitation,
    amount:storm?1:raining?.24+.66*preset.rainIntensity:snowy?.62:0,
    fallSpeed:snowy?.70:storm?19:autumn?6.8:11.8,
    windX:storm?4.1:autumn?1.1:snowy?.24:.58,
    windZ:storm?1.55:snowy?.10:.24,
    dropLength:storm?1.22:autumn?.44:.70,
    rainOpacity:storm?.47:autumn?.25:.36,
    rainColor:mixColor(preset.color,'#e3f2fb',.65),snowColor:mixColor(preset.ambientColor,'#f4f9ff',.82),snowSize:.072,snowOpacity:.82,
  };
}
const precipitationPresets=new Map<string,ReturnType<typeof resolveCityPrecipitationProfile>>();
export function getCityPrecipitationProfile(mode:OsCityWeather,timeOfDay:CityTimeOfDay='day'){
  const key=`${mode}:${timeOfDay}`,cached=precipitationPresets.get(key);if(cached)return cached;
  const preset=resolveCityPrecipitationProfile(mode,timeOfDay);precipitationPresets.set(key,preset);return preset;
}

/** Pure function of the room clock: sky and daylight see the same gentle pulse. */
export function getCityWeatherLightning(mode:OsCityWeather,elapsed:number,reducedMotion=false){
  if(mode!=='storm'||reducedMotion)return 0;
  const phase=((elapsed%23)+23)%23;
  return phase>11&&phase<12.25?Math.sin((phase-11)/1.25*Math.PI)**2*.10:0;
}

/** Individual leaves tumble differently, but share the precipitation wind field. */
export function getCityLeafMotion(mode:OsCityWeather,elapsed:number,phase:number,speed:number,height:number){
  const wind=getCityPrecipitationProfile(mode),age=(phase/(Math.PI*2)+elapsed*speed/height)%1;
  return {age,dx:Math.sin(elapsed*.43+phase)*.56+age*wind.windX*2.7,dz:Math.sin(elapsed*.31+phase)*.8+age*wind.windZ*2.7,rx:elapsed*.78+phase,ry:elapsed*.46+phase,rz:Math.sin(elapsed*.66+phase)};
}
