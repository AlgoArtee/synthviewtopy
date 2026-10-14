import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const output='test-artifacts/north-city/revision-29/startup';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage();await page.route('**/backdrop-startup-check',r=>r.fulfill({contentType:'text/html',body:'<!doctype html>Backdrop startup weather checks'}));await page.goto('http://127.0.0.1:5178/backdrop-startup-check');
 const profiles=await page.evaluate(async()=>{const {createOsCityBalconyDistrict}=await import('/src/apartments/osCityBalconyDistrict.ts'),{getCityWeatherPreset}=await import('/src/apartments/osCityWeather.ts'),result=[];for(const [weather,time] of [['rain','day'],['clear','night'],['academic-autumn','morning'],['snow','evening']]){const district=createOsCityBalconyDistrict();district.userData.setWeather(weather,time);district.userData.setWindowSettings({illuminatedPercent:23,tvPercent:67,shadowsPercent:31});await district.userData.ready;const s=district.userData.getSnapshot();result.push({weather,time,rooms:s.lighting.materials.filter(m=>m.name.startsWith('Picture-mounted controllable rooms')),expected:2.0*getCityWeatherPreset(weather,time).windowGlow,backdrop:s.backdrop,tv:s.tvWindows});district.userData.dispose();}return result;});
 for(const p of profiles){assert.equal(p.rooms.length,3);assert.ok(p.rooms.every(m=>Math.abs(m.emission-p.expected)<1e-9));assert.equal(p.backdrop.weather,p.weather);assert.equal(p.backdrop.timeOfDay,p.time);assert.equal(p.backdrop.loaded,true);assert.equal(p.tv.settings.illuminatedPercent,23);assert.equal(p.tv.settings.tvPercent,67);assert.equal(p.tv.settings.shadowsPercent,31);assert.equal(p.tv.windowCount>3828,true);}
 const paths=['src/apartments/osCityBackdrop.ts','src/apartments/osCityBalconyDistrict.ts'],sourceHashes=Object.fromEntries(await Promise.all(paths.map(async p=>[p,createHash('sha256').update(await readFile(p)).digest('hex')])));await writeFile(output+'/results.json',JSON.stringify({pass:true,profiles,sourceHashes},null,2));console.log(JSON.stringify({pass:true,profiles:profiles.length}));
}finally{await browser.close();}
