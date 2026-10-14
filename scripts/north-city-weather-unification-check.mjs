import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const output='test-artifacts/north-city/revision-20/weather';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
  const page=await browser.newPage({reducedMotion:'no-preference'});
  await page.route('**/weather-unification-check',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body>Actual north and balcony weather geometry checks</body></html>'}));
  await page.goto('http://127.0.0.1:5178/weather-unification-check');
  const result=await page.evaluate(async()=>{
    const [{createOsCityExterior},{createOsCityBalconyWeather},{CITY_WEATHER_PRESETS}]=await Promise.all([
      import('/src/apartments/osCityExterior.ts'),import('/src/apartments/osCityBalconyWeather.ts'),import('/src/apartments/osCityWeather.ts'),
    ]);
    const north=createOsCityExterior(),balcony=createOsCityBalconyWeather();
    window.weatherCheck={north,balcony};
    const check=(condition,message)=>{if(!condition)throw Error(message);};
    const nearRain=north.group.getObjectByName('North-window weather · street canyon rain');
    const balconyRain=balcony.group.getObjectByName('Balcony weather · roof edge rain');
    check(nearRain.isLineSegments&&balconyRain.isLineSegments,'Both sides use real slanting line rain');
    const report=[];let coordinateSamples=0;
    for(const mode of Object.keys(CITY_WEATHER_PRESETS)){
      north.setWeather(mode);balcony.setWeather(mode);
      const before={north:north.group.userData.getWeatherSnapshot(),balcony:balcony.snapshot()};
      let maxLightning=0;
      for(let tick=1;tick<=1200;tick++){
        const elapsed=tick*.05;north.update(.05,elapsed);balcony.update(.05,elapsed);
        const a=north.group.userData.getWeatherSnapshot(),b=balcony.snapshot();
        for(const key of ['precipitation','fallSpeed','dropLength','rainOpacity','amount','snowSize','lightning','elapsed'])check(a[key]===b[key],`${mode} ${key} differs`);
        check(JSON.stringify(a.wind)===JSON.stringify(b.wind),`${mode} world wind differs`);
        check(JSON.stringify(a.atmosphere)===JSON.stringify(b.atmosphere),`${mode} atmosphere differs`);
        maxLightning=Math.max(maxLightning,a.lightning);
        if(tick%60===0){
          for(const system of [north,balcony])system.group.traverse(object=>{
            if(!object.isLineSegments||!object.visible||!object.name.includes('weather'))return;
            const attribute=object.geometry.attributes.position,range=object.geometry.drawRange;
            for(let index=range.start;index<range.start+range.count;index++){
              check([attribute.getX(index),attribute.getY(index),attribute.getZ(index)].every(Number.isFinite),'Nonfinite rain coordinate');
              if(system===balcony)check(attribute.getX(index)>=5.079999,'Precipitation enters sheltered terrace');
              coordinateSamples++;
            }
          });
        }
      }
      const after={north:north.group.userData.getWeatherSnapshot(),balcony:balcony.snapshot()};
      if(CITY_WEATHER_PRESETS[mode].precipitation!=='none'){
        check(JSON.stringify(before.north.nearSample)!==JSON.stringify(after.north.nearSample),`${mode} north precipitation frozen`);
        check(JSON.stringify(before.balcony.nearSample)!==JSON.stringify(after.balcony.nearSample),`${mode} balcony precipitation frozen`);
      }
      check(mode==='storm'?maxLightning>.099:maxLightning===0,`${mode} lightning profile`);
      const far=after.balcony.volumes[2];check(far.maxX>=280&&far.minZ<=-100&&far.maxZ>=120,'Far loop outside weather volume');
      report.push({mode,fallSpeed:after.north.fallSpeed,wind:after.north.wind,amount:after.north.amount,northCount:after.north.particleCount,balconyCount:after.balcony.particleCount,atmosphere:after.north.atmosphere,maxLightning,elapsed:after.north.elapsed});
    }
    // Measure actual vertices, rather than trusting only equal profile metadata.
    north.setWeather('rain');balcony.setWeather('rain');
    const actualWind=[];
    for(const [system,line] of [[north,nearRain],[balcony,balconyRain]]){
      const attribute=line.geometry.attributes.position,p=[attribute.getX(0),attribute.getY(0),attribute.getZ(0)];
      system.update(.04,61.04);
      const dx=attribute.getX(0)-p[0],dy=attribute.getY(0)-p[1],dz=attribute.getZ(0)-p[2];
      check(Math.abs(dx-.58*.04)<.00001&&Math.abs(dz-.24*.04)<.00001,'Actual world wind differs from common metres/second');
      check(dy<-.35&&dy>-.61,'Actual rain speed outside common seed distribution');
      check(Math.abs(attribute.getY(1)-attribute.getY(0)-.70)<.00001,'Actual rain streak length mismatch');
      actualWind.push({dx,dy,dz});
    }
    return {presets:report,secondsPerMode:60,coordinateSamples,actualWind,pass:true};
  });
  await page.emulateMedia({reducedMotion:'reduce'});
  const reduced=await page.evaluate(()=>{
    const {north,balcony}=window.weatherCheck;north.setWeather('storm');balcony.setWeather('storm');
    const first={north:north.group.userData.getWeatherSnapshot(),balcony:balcony.snapshot()};
    north.update(.05,11.625);balcony.update(.05,11.625);
    const next={north:north.group.userData.getWeatherSnapshot(),balcony:balcony.snapshot()};
    return {northFrozen:JSON.stringify(first.north.nearSample)===JSON.stringify(next.north.nearSample),balconyFrozen:JSON.stringify(first.balcony.nearSample)===JSON.stringify(next.balcony.nearSample),northLightning:next.north.lightning,balconyLightning:next.balcony.lightning};
  });
  assert.equal(reduced.northFrozen,true);assert.equal(reduced.balconyFrozen,true);assert.equal(reduced.northLightning,0);assert.equal(reduced.balconyLightning,0);
  await mkdir(output,{recursive:true});await writeFile(`${output}/simulation.json`,JSON.stringify({...result,reduced},null,2));
  console.log(JSON.stringify({...result,reduced}));
}finally{await browser.close();}
