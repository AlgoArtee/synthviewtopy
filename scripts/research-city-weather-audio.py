from pathlib import Path
import urllib.request,urllib.parse,re,json,html,time,sys
sys.stdout.reconfigure(encoding="utf-8")
out=Path('test-artifacts/north-city/weather-audio/research');out.mkdir(parents=True,exist_ok=True)
queries=['city ambience','distant traffic ambience','city wind','urban wind','light rain city','rain ambience','thunderstorm ambience','storm wind ambience','winter ambience','snow wind','quiet city night','distant city night','autumn wind','autumn ambience','wind leaves']
all_results={}
for q in queries:
 path=out/('search-'+q.replace(' ','-')+'.html')
 if path.exists():s=path.read_text(encoding='utf-8')
 else:
  u='https://freesound.org/search/?'+urllib.parse.urlencode({'q':q,'f':'duration:[25 TO 600] license:"Creative Commons 0"','s':'score'})
  try:
   s=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=40).read().decode('utf-8');path.write_text(s,encoding='utf-8')
  except Exception as e:print(q,str(e),flush=True);continue
 results=[]
 for block in s.split('class="bw-search__result"')[1:]:
  attrs=dict(re.findall(r'data-([\w-]+)="([^"]*)"',block))
  source=re.search(r'href="(/people/[^/"<>]+/sounds/\d+/)"',block)
  desc=re.search(r'class="max-h-[^"]*" title="([^"]*)"',block)
  if not source or not attrs.get('sound-id'):continue
  item={'id':attrs['sound-id'],'title':html.unescape(attrs.get('title','')),'author':html.unescape(attrs.get('username','')),'duration':float(attrs.get('duration','0')),'preview':attrs.get('mp3','').replace('-lq.mp3','-hq.mp3'),'source':'https://freesound.org'+source.group(1),'description':html.unescape(desc.group(1)) if desc else ''}
  results.append(item)
 all_results[q]=results
 print(q+': '+str(len(results)),flush=True)
 time.sleep(.15)
(out/'candidates.json').write_text(json.dumps(all_results,ensure_ascii=False,indent=2),encoding='utf-8')
for q,results in all_results.items():
 print('\n'+q)
 for a in results:print(a['id']+' | '+a['title']+' | '+a['description'][:170])
