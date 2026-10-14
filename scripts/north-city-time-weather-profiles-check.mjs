import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import ts from 'typescript';

// Load the real pure TypeScript modules in memory, without a DOM, WebGL or
// generated source files. The campus module has no runtime dependencies.
const toModule=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const campus=toModule(await readFile('src/data/academicCampus.ts','utf8'));
const weather=await import(toModule((await readFile('src/apartments/osCityWeather.ts','utf8')).replace("'../data/academicCampus'",JSON.stringify(campus))));
const {CITY_TIME_OPTIONS,CITY_WEATHER_OPTIONS,CITY_WEATHER_PRESETS,isCityTimeOfDay,getCityWeatherPreset,getCityWeatherAtmosphere,getCityPrecipitationProfile,getCityWeatherLightning}=weather;
const baseBefore=JSON.stringify(CITY_WEATHER_PRESETS),times=CITY_TIME_OPTIONS.map(option=>option.id);
assert.deepEqual(times,['night','morning','day','evening']);
assert.equal(isCityTimeOfDay('midnight'),false);assert.equal(isCityTimeOfDay('Day'),false);times.forEach(time=>assert.equal(isCityTimeOfDay(time),true));
assert.equal(CITY_WEATHER_OPTIONS.length,10);assert.equal(CITY_WEATHER_OPTIONS.filter(option=>!option.id.startsWith('academic-')).length,6);
assert.deepEqual(CITY_WEATHER_OPTIONS.filter(option=>option.id.startsWith('academic-')).map(option=>option.label),['Autumn after rain','Overcast','Rainy','Foggy']);
const channels=color=>[1,3,5].map(index=>parseInt(color.slice(index,index+2),16));
const luminance=color=>{const [r,g,b]=channels(color);return .2126*r+.7152*g+.0722*b;};
const profiles=[];
for(const [mode,base] of Object.entries(CITY_WEATHER_PRESETS)){
  const day=getCityWeatherPreset(mode,'day'),night=getCityWeatherPreset(mode,'night'),morning=getCityWeatherPreset(mode,'morning'),evening=getCityWeatherPreset(mode,'evening');
  assert.equal(getCityWeatherPreset(mode),day,'Omitted time retains day default');
  assert.ok(day.sun>morning.sun&&morning.sun>evening.sun&&evening.sun>night.sun,`${mode}: sunlight hierarchy`);
  assert.ok(day.ambient>night.ambient*3&&luminance(day.sky)>luminance(night.sky)*2,`${mode}: day/night contrast`);
  assert.ok(morning.sunPosition[0]>0&&evening.sunPosition[0]<0&&day.sunPosition[1]>morning.sunPosition[1]*3,'Low sun comes from opposite sides');
  assert.ok(night.neonIntensity>evening.neonIntensity&&evening.neonIntensity>morning.neonIntensity&&morning.neonIntensity>day.neonIntensity,`${mode}: neon hierarchy`);
  const dailyPhysics=getCityPrecipitationProfile(mode,'day');
  for(const timeOfDay of times){
    const preset=getCityWeatherPreset(mode,timeOfDay),atmosphere=getCityWeatherAtmosphere(mode,timeOfDay),precipitation=getCityPrecipitationProfile(mode,timeOfDay);
    assert.equal(preset,getCityWeatherPreset(mode,timeOfDay),'Resolved settings use a stable cached object');
    assert.equal(atmosphere,getCityWeatherAtmosphere(mode,timeOfDay));assert.equal(precipitation,getCityPrecipitationProfile(mode,timeOfDay));
    assert.equal(preset.timeOfDay,timeOfDay);assert.equal(atmosphere.timeOfDay,timeOfDay);assert.equal(precipitation.timeOfDay,timeOfDay);
    for(const field of ['precipitation','rainIntensity','wetness','autumn','fog'])assert.equal(preset[field],base[field],`${mode}/${timeOfDay}: weather physics changed`);
    for(const field of ['precipitation','amount','fallSpeed','windX','windZ','dropLength','rainOpacity','snowSize','snowOpacity'])assert.equal(precipitation[field],dailyPhysics[field],`${mode}/${timeOfDay}: particle physics changed`);
    for(const field of ['sky','color','ambientColor','groundColor'])assert.match(preset[field],/^#[0-9a-f]{6}$/i);
    for(const field of ['sun','ambient','window','environmentIntensity','exposure','neonIntensity','windowGlow','fixtureIntensity','bloomStrength','bloomRadius','bloomThreshold','neonFogDensity'])assert.ok(Number.isFinite(preset[field])&&preset[field]>0,`${mode}/${timeOfDay}: ${field}`);
    assert.ok(preset.sunPosition.every(Number.isFinite)&&Math.hypot(...preset.sunPosition)<160);
    assert.ok(preset.neonFogDensity<preset.fog&&preset.neonFogDensity>0,'Emission haze stays nonzero and weaker than body fog');
    assert.equal(atmosphere.sky,preset.sky);assert.equal(atmosphere.fogDensity,preset.fog);assert.equal(atmosphere.fogStrength,1);assert.equal(atmosphere.fogTintMix,0);assert.equal(atmosphere.neonFogDensity,preset.neonFogDensity);
    if(mode.startsWith('academic-')&&(timeOfDay==='day'||timeOfDay==='morning')){
      const [r,g,b]=channels(preset.ambientColor);assert.ok(r>g&&g>b,'Dark Academia daytime/morning light is warm, not a cold nighttime preset');
      assert.ok(channels(preset.sky)[0]>channels(preset.sky)[2],'Dark Academia sky carries a warm earthy tint');
    }
    if(mode==='fog'){
      const body=Math.exp(-preset.fog*preset.fog*10000),emission=Math.exp(-preset.neonFogDensity*100);
      assert.ok(body<1e-10&&emission>.05&&emission<.8,'Fog hides distant bodies while attenuated neon survives');
      assert.ok(preset.neonIntensity>getCityWeatherPreset('clear',timeOfDay).neonIntensity,'Fog gets additional neon emission');
      assert.ok(preset.windowGlow>getCityWeatherPreset('clear',timeOfDay).windowGlow,'Fog gets additional window glow');
    }
    profiles.push({mode,timeOfDay,...preset,particles:precipitation});
  }
}
assert.equal(JSON.stringify(CITY_WEATHER_PRESETS),baseBefore,'Historical base preset table must not be mutated');
assert.equal(getCityWeatherLightning('storm',11.625,true),0);assert.equal(getCityWeatherLightning('rain',11.625),0);assert.ok(getCityWeatherLightning('storm',11.625)>.099);
for(const mode of ['rain','storm']){
  const current=getCityWeatherPreset(mode,'day'),previous=CITY_WEATHER_PRESETS[mode],night=getCityWeatherPreset(mode,'night');
  assert.ok(luminance(current.sky)>luminance(previous.sky)*1.45,'Rainy daytime sky is visibly lifted from the old dark baseline');
  assert.ok(current.ambient>previous.ambient*1.4&&current.window>previous.window*1.8,'Diffuse daylight reaches facades and the apartment');
  assert.ok(luminance(current.sky)>luminance(night.sky)*3&&current.ambient>night.ambient*5,'Daytime wet weather stays distinct from night');
}
assert.ok(luminance(getCityWeatherPreset('storm','day').sky)<luminance(getCityWeatherPreset('rain','day').sky),'Storm remains darker than ordinary rain');
const nightFog=getCityWeatherPreset('fog','night');
for(const {id} of CITY_WEATHER_OPTIONS){
  if(id==='fog'||id==='academic-foggy-night')continue;
  const night=getCityWeatherPreset(id,'night');
  assert.ok(night.bloomStrength<nightFog.bloomStrength*.25&&night.bloomRadius<nightFog.bloomRadius*.25&&night.bloomThreshold>nightFog.bloomThreshold*2,'Non-fog night neon has tight cores rather than broad fog halos');
}
const output=process.env.CITY_OUTPUT??'test-artifacts/north-city/revision-22/profiles';await mkdir(output,{recursive:true});
await writeFile(`${output}/validation.json`,JSON.stringify({pass:true,combinations:profiles.length,timeOrder:times,standardWeatherModes:6,darkAcademiaModes:4,basePreserved:true,profiles},null,2));
console.log('PASS: all 40 time/weather combinations, distinct light directions and palettes, stronger nighttime/fog neon, retained precipitation physics and cached profiles.');
