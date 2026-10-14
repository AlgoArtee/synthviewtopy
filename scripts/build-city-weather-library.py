from pathlib import Path
import urllib.request,re,json,html,hashlib,subprocess,concurrent.futures,sys,time
sys.stdout.reconfigure(encoding='utf-8')
root=Path('test-artifacts/north-city/weather-audio/research');out=Path('public/audio/north-city/library');out.mkdir(parents=True,exist_ok=True)
ffmpeg=r'F:/00_AI/roop/roop-unleashed-main/installer/installer_files/ffmpeg/bin/ffmpeg.exe'
ffprobe=str(Path(ffmpeg).with_name('ffprobe.exe'))
data=json.loads((root/'candidates.json').read_text(encoding='utf-8'));lookup={a['id']:a for values in data.values() for a in values}
pools={
 'dry':['580646','164213','488060','470030','563546','631479','631474','380687','856779','451079'],
 'wind':['518459','518460','452407','452434','710536','817606','852236','360775','537333','465785'],
 'rain':['171980','197213','500805','500804','557376','706686','26221','607228','360783','486877'],
 'storm':['700358','641185','546524','704603','429189','352790','632203','638873','638872','649072'],
 'snow':['719961','450239','454377','263497','263496','413386','568973','839943','637566','574552'],
 'quiet':['572530','427841','385104','733843','212146','630584','732690','330427','640635','455949'],
 'autumn':['596454','457318','109485','326652','756756','574553','209763','336503','627076','537333']}
labels={
'dry':['Sunny residential city','Morning city hum','City streets','Downtown atmosphere','Calm morning window','Dawn traffic and early birds','Quiet residential traffic','Soft city park','City air and distant movement','Footsteps and distant traffic'],
'wind':['Wind between buildings','Breezy city streets','Windy city park','Alley breeze and passing cars','Flags, cables and city hum','Trees and passing cars','Breezy railway embankment','Windy evening park','Swirling leaves and traffic','City wind and distant bells'],
'rain':['Light rain in the city','Quiet rainy night','Rain from a third-floor window','Rainy street and pedestrians','Rain at a city window','Calm rainy street','Soft city rain','Rain and passing cars','Rain on glass, wet traffic','Rain in the urban courtyard'],
'storm':['Rain and rolling thunder','Soft rain and distant thunder','Thunderstorm in the distance','Looping rainstorm','Downpour and thunder','Night thunder over the city','Gusts between city buildings','Storm atmosphere I','Storm atmosphere II','Thunder, rain and passing cars'],
'snow':['City snowfall','Winter village traffic','Winter thaw and dripping water','Crows and distant winter traffic','Quiet winter station','Winter elevated station at night','Cold city rooftops','Wind in a winter city park','Wind through bare winter trees','Wind-lashed snowfall'],
'quiet':['Night city from a rooftop','Quiet night air','Night river and city hum','Quiet Bangkok street','Manhattan across the river','Distant night service traffic','Distant city at night','Late-night Little Tokyo','Night traffic atmosphere','Windy night city'],
'autumn':['Autumn breeze in Bergen','Dry autumn leaves','Late-autumn wind gusts','Autumn residential courtyard','Autumn gardens and city','Rustling autumn trees','Windy autumn air','Autumn drainpipe after rain','Autumn hillside atmosphere','Swirling leaves and traffic']}
weatherPools={'clear':'dry','cloudy':'wind','rain':'rain','storm':'storm','snow':'snow','fog':'quiet','academic-autumn':'autumn','academic-overcast':'wind','academic-rainy-dusk':'rain','academic-foggy-night':'quiet'}
def fetch(url,path):
 if not path.exists():
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
  with urllib.request.urlopen(req,timeout=60) as response:path.write_bytes(response.read())
 return path.read_bytes()
def process(sid):
 a=lookup[sid];source='https://freesound.org/people/'+urllib.parse.quote(a['author'])+'/sounds/'+sid+'/'
 page=root/('source-'+sid+'.html');s=fetch(source,page).decode('utf-8')
 attrs=dict(re.findall(r'data-([\w-]+)="([^"]*)"',re.search(r'<div\s+class="bw-player"[^>]*data-sound-id="'+sid+r'"[^>]*>',s,re.S).group(0)))
 licenseUrls=re.findall(r'href="(https?://creativecommons.org/[^" ]+)"',s)
 accepted=[u for u in licenseUrls if re.search(r'/(?:publicdomain/zero/1\.0|licenses/by/[34]\.0)/?$',u)]
 if not accepted:raise RuntimeError('No approved license for '+sid+': '+str(licenseUrls))
 licenseUrl=accepted[0].replace("http://","https://");licenseName='CC0 1.0' if '/zero/' in licenseUrl else 'CC BY '+('4.0' if '/4.0' in licenseUrl else '3.0')
 preview=re.search(r'data-static-file-url="(https://cdn.freesound.org/previews/[^" ]+-hq.mp3)"',s).group(1)
 raw=root/('raw-'+sid+'.mp3');fetch(preview,raw)
 dest=out/('fs-'+sid+'.mp3')
 if not dest.exists():
  subprocess.run([ffmpeg,'-v','error','-y','-i',str(raw),'-t','90','-vn','-ar','44100','-ac','2','-codec:a','libmp3lame','-b:a','128k',str(dest)],check=True,capture_output=True)
 probe=json.loads(subprocess.check_output([ffprobe,'-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels','-of','json',str(dest)]))
 description=re.search(r'<div id="soundDescriptionSection">(.*?)</div>',s,re.S)
 description=html.unescape(re.sub('<[^>]+>',' ',description.group(1))).strip() if description else ''
 if float(probe['format']['duration'])<20:raise RuntimeError('Short recording '+sid)
 meta={'id':'fs-'+sid,'title':html.unescape(attrs['title']),'author':a['author'],'source':source,'license':licenseName,'licenseUrl':licenseUrl,'download':preview,'sourceDuration':float(attrs['duration']),'duration':float(probe['format']['duration']),'url':'/audio/north-city/library/'+dest.name,'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'description':description,'changes':'HQ preview excerpt, up to first 90 seconds, encoded as stereo 44.1 kHz 128 kbps MP3. Runtime normalization, crossfade looping, window gain/filter and stereo positioning.'}
 (root/('meta-'+sid+'.json')).write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
 print(sid+' '+meta['license']+' '+meta['title'],flush=True)
 return meta
tracks={};fail=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 futures={pool.submit(process,sid):sid for sid in sorted(set(sum(pools.values(),[])))}
 for future in concurrent.futures.as_completed(futures):
  try:a=future.result();tracks[a['id']]=a
  except Exception as e:fail.append({'id':futures[future],'error':str(e)});print('FAILED '+futures[future]+' '+str(e),flush=True)
if fail:
 (root/'failures.json').write_text(json.dumps(fail,indent=2),encoding='utf-8');raise SystemExit(1)
tracks=dict(sorted(tracks.items()))
choices={weather:[{'trackId':'fs-'+sid,'label':labels[pool][i]} for i,sid in enumerate(pools[pool])] for weather,pool in weatherPools.items()}
classic=json.loads(Path('public/audio/north-city/source.json').read_text(encoding='utf-8'));tracks['classic-cyberpunk-rain']={**classic,'id':'classic-cyberpunk-rain','url':'/audio/north-city/cyberpunk-city-ambience.mp3','duration':122.88,'sourceDuration':122.88};choices['rain'].append({'trackId':'classic-cyberpunk-rain','label':'Original cyberpunk heavy rain'})
manifest={'version':1,'retrieved':'2026-10-12','tracks':list(tracks.values()),'choices':choices,'note':'Each weather has at least ten distinct recordings. Compatible weather modes share appropriate recordings; choices are not pitch variants or duplicated files.'}
Path('public/audio/north-city/weather-library.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
Path('src/apartments/osCitySoundLibrary.ts').write_text('/** Generated from verified primary source records; see public/audio/north-city/weather-library.json. */\nexport const CITY_SOUND_LIBRARY = '+json.dumps({'tracks':[{k:v for k,v in a.items() if k in ['id','title','author','source','license','licenseUrl','url','duration']} for a in tracks.values()],'choices':choices},ensure_ascii=False,indent=2)+' as const;\n',encoding='utf-8')
credits=['# North City weather sound library','',manifest['note'],'','All source pages and license records were verified individually. Adaptations: HQ public previews excerpted to at most 90 seconds and encoded as stereo 44.1 kHz 128 kbps MP3; runtime normalization, overlap looping, window gain/filter and stereo positioning. Original cyberpunk rain retains its existing full MP3.','']
for a in tracks.values():credits.append('- **'+a['title']+'** by '+a['author']+' — ['+a['license']+']('+a['licenseUrl']+'), [source]('+a['source']+').')
Path('public/audio/north-city/WEATHER_ATTRIBUTION.md').write_text('\n'.join(credits)+'\n',encoding='utf-8')
print(json.dumps({'distinctRecordings':len(tracks),'choices':{k:len(v) for k,v in choices.items()},'bytes':sum(a['bytes'] for a in tracks.values())}),flush=True)
