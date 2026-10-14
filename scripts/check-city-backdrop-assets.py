"""Validate image inputs and geometric placement masks without editing images."""
from PIL import Image
from pathlib import Path
import hashlib,json,re
root=Path('public/apartments/assets/north-city/skyline-r29')
image=Image.open(root/'unlit-city.png');w,h=image.size
assert image.mode=='RGBA' and w/h==3
text=Path('src/apartments/osCityBackdrop.ts').read_text(encoding='utf-8')
checks=[]
for field in ['SCREEN_ANCHORS','ACCENTS']:
    block=text.split('const '+field+'=[')[1].split('];')[0]
    for i,value in enumerate(re.findall(r'\[([^\[\]]+)\]',block)):
        x,y,bw,bh=map(float,value.split(','))
        crop=image.crop((round((x-bw/2)*w),round((y-bh/2)*h),round((x+bw/2)*w),round((y+bh/2)*h)))
        coverage=sum(p[3]>200 for p in crop.getdata())/(crop.width*crop.height)
        checks.append({'kind':field,'index':i,'paintedSupportCoverage':coverage})
        assert coverage>.995,(field,i,coverage)
pixels=list(image.getdata());transparent=sum(p[3]==0 for p in pixels)
bright=sum(p[3]>200 and max(p[:3])>180 for p in pixels)
assert transparent>w*h*.2
data=json.loads((root/'windows.json').read_text())
assert len(data['placements'])==1276
for x,y,bw,bh,palette in data['placements']:
    assert 0<x<1 and 0<y<1 and 0<bw<.02 and 0<bh<.02 and palette in (0,1,2)
    assert image.getpixel((round(x*w),round(y*h)))[3]>=240
sourceHashes={str(p).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in [root/'lit-source.png',root/'unlit-city.png',root/'windows.json',Path('src/apartments/osCityBackdrop.ts')]}
result={'pass':True,'size':[w,h],'alpha':True,'transparentPixels':transparent,'brightOpaquePixels':bright,'windowsPerPanel':len(data['placements']),'boardAndAccentSupports':checks,'sourceHashes':sourceHashes,'method':'Read-only pixel analysis; no image editing'}
out=Path('test-artifacts/north-city/revision-29/backdrop-assets.json');out.write_text(json.dumps(result,indent=2));print(json.dumps({'pass':True,'supports':len(checks),'windows':len(data['placements']),'brightOpaquePixels':bright}))
