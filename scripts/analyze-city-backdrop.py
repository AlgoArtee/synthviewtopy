"""Extract placement data from lit source pixels; never alter the bitmap assets."""
from PIL import Image
from collections import deque
import json, hashlib
from pathlib import Path

root=Path('public/apartments/assets/north-city/skyline-r29')
source=Image.open(root/'lit-source.png').convert('RGB')
unlit=Image.open(root/'unlit-city.png').convert('RGBA')
assert source.size==unlit.size
w,h=source.size
rgb=list(source.getdata()); alpha=list(unlit.getchannel('A').getdata())
mask=bytearray(w*h)
for i,(r,g,b) in enumerate(rgb):
    maximum=max(r,g,b)
    if maximum>112 and min(r,g,b)>maximum*.45 and alpha[i]>220:
        mask[i]=1
windows=[]
for start in range(w*h):
    if not mask[start]: continue
    mask[start]=0; pending=[start]; points=[]
    while pending:
        i=pending.pop(); points.append(i)
        x,y=i%w,i//w
        for j in ([i-1] if x else [])+([i+1] if x<w-1 else [])+([i-w] if y else [])+([i+w] if y<h-1 else []):
            if mask[j]: mask[j]=0; pending.append(j)
    xs=[i%w for i in points]; ys=[i//w for i in points]
    x0,x1,y0,y1=min(xs),max(xs),min(ys),max(ys)
    bw,bh=x1-x0+1,y1-y0+1
    if not (2<=bw<=24 and 2<=bh<=10 and 1.15<=bw/bh<=6 and len(points)/(bw*bh)>.45 and y0>h*.19): continue
    center=((x0+x1)/2,(y0+y1)/2)
    # Avoid partial transparency and sky-edge aliasing on antennas.
    if alpha[round(center[1])*w+round(center[0])]<250: continue
    mean=[sum(rgb[i][channel] for i in points)/len(points) for channel in range(3)]
    palette=0 if mean[0]>mean[2]*1.10 else 1 if mean[1]>mean[0]*1.14 else 2
    windows.append([round(center[0]/w,6),round(center[1]/h,6),round(bw/w*.88,6),round(bh/h*.84,6),palette])
windows.sort(key=lambda p:(p[1],p[0]))
assert 100<len(windows)<5000,len(windows)
asset=root/'windows.json'; asset.write_text(json.dumps({'sourceSize':[w,h],'placements':windows},separators=(',',':')))
print(json.dumps({'windowsPerPanel':len(windows),'totalWindows':len(windows)*3,'transparentPixels':sum(a==0 for a in alpha),'opaquePixels':sum(a==255 for a in alpha),'asset':str(asset),'sourceSha256':hashlib.sha256((root/'lit-source.png').read_bytes()).hexdigest(),'unlitSha256':hashlib.sha256((root/'unlit-city.png').read_bytes()).hexdigest()}))
