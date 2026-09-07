import * as THREE from 'three';
import { enableWorldSpaceUV } from './roomMaterials';
import type { RoomDesign } from './roomDesign';
import type { RoomDefinition } from './roomCatalog';

/** Original repeatable surface patterns; photographic furniture maps remain shared. */
export function createDesignSurfaces(design: RoomDesign, room: RoomDefinition) {
  let seed = room.seed;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const color = (hex: string, toward: string, amount: number) => `#${new THREE.Color(hex).lerp(new THREE.Color(toward), amount).getHexString()}`;
  const light = ['nordic','japanese','coastal','organic','space','modern'].includes(design.furniture);
  const wallColor = color(room.palette.wall, light ? '#e4ded0' : '#bfa884', light ? .6 : .17);
  function canvasMap(draw: (c: CanvasRenderingContext2D) => void, world = false) {
    const canvas = document.createElement('canvas'); canvas.width=1024; canvas.height=1024;
    draw(canvas.getContext('2d')!);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace=THREE.SRGBColorSpace; map.anisotropy=4;
    if (world) { map.wrapS=map.wrapT=THREE.RepeatWrapping; map.repeat.set(.25,.25); }
    return map;
  }
  function grain(c: CanvasRenderingContext2D, amount = 7000) {
    for(let i=0;i<amount;i++) { c.fillStyle=random()>.5?'rgba(255,255,255,.06)':'rgba(0,0,0,.055)'; c.fillRect(random()*1024,random()*1024,1+random()*3,1+random()*2); }
  }
  const wallMap = canvasMap(c => {
    c.fillStyle=wallColor;c.fillRect(0,0,1024,1024);
    if (design.wallTreatment==='brick') {
      c.fillStyle='#6e6255';c.fillRect(0,0,1024,1024);
      for(let row=0;row<16;row++)for(let col=-1;col<9;col++) {
        c.fillStyle=color(room.palette.wood, '#a2674d', .3+random()*.35);
        c.fillRect(col*128+(row%2)*64+4,row*64+4,120,56);
      }
    } else if(design.wallTreatment==='concrete') {
      c.strokeStyle='rgba(28,32,31,.25)';c.lineWidth=3;
      for(let y=0;y<1024;y+=256){c.strokeRect(0,y,1024,256);for(const x of[35,512,989]){c.beginPath();c.arc(x,y+32,5,0,Math.PI*2);c.stroke();}}
      for(let i=0;i<1400;i++){c.fillStyle='rgba(24,30,28,.08)';c.fillRect(random()*1024,random()*1024,40+random()*220,1);}
    } else if(design.wallTreatment==='wallpaper') {
      c.strokeStyle=color(room.palette.accent,room.palette.wall,.3); c.lineWidth=2;
      for(let y=0;y<1024;y+=128)for(let x=0;x<1024;x+=128){c.save();c.translate(x+64,y+64);for(let n=0;n<4;n++){c.rotate(Math.PI/2);c.beginPath();c.ellipse(0,-20,10,30,0,0,Math.PI*2);c.stroke();}c.restore();}
    } else if (design.wallTreatment==='lacquer') {
      c.strokeStyle=color(wallColor,'#151e23',.16);c.lineWidth=3;
      for(let x=0;x<1024;x+=256)c.strokeRect(x+8,8,240,1008);
    }
    grain(c);
  },true);
  const wall = enableWorldSpaceUV(new THREE.MeshStandardMaterial({map:wallMap,roughness:design.wallTreatment==='lacquer'?.3:.9}));
  const floorMap=canvasMap(c=>{
    const kind=design.floorTreatment;
    c.fillStyle=kind==='terracotta'?'#b07857':kind==='tatami'?'#a7a382':kind==='concrete'?'#777e7a':kind==='oak'?'#aa9270':'#b8b6aa';c.fillRect(0,0,1024,1024);
    if(kind==='oak'){
      for(let n=0;n<12;n++){
        const x=n*86;c.fillStyle=color(room.palette.wood,'#d5be8d',.52+random()*.2);c.fillRect(x+1,0,83,1024);
        for(let line=0;line<12;line++){c.strokeStyle='rgba(69,48,23,.16)';c.lineWidth=.7;c.beginPath();const lx=x+random()*83;c.moveTo(lx,0);c.bezierCurveTo(lx+random()*12,300,lx-8,800,lx,1024);c.stroke();}
        c.fillStyle='rgba(38,26,17,.3)';c.fillRect(x,n%2?370:780,85,2);
      }
    } else if(kind==='tatami'){
      for(let x=0;x<1024;x+=4){c.strokeStyle=x%12?'rgba(53,63,42,.13)':'rgba(229,223,181,.5)';c.beginPath();c.moveTo(x,0);c.lineTo(x,1024);c.stroke();}
      c.fillStyle='#445549';c.fillRect(0,0,18,1024);c.fillRect(512,0,18,1024);c.fillRect(0,0,1024,12);
    } else if(kind==='terrazzo'){
      for(let n=0;n<2400;n++){const x=random()*1024,y=random()*1024,r=1+random()*7;c.fillStyle=[room.palette.accent,room.palette.wall,'#ddd9cc','#626965'][n%4];c.beginPath();c.moveTo(x-r,y);c.lineTo(x,y-r*.7);c.lineTo(x+r,y+r);c.closePath();c.fill();}
      c.strokeStyle='rgba(69,77,72,.18)';c.lineWidth=2;c.strokeRect(0,0,1024,1024);
    } else if (kind==='checkerboard'||kind==='terracotta'||kind==='stone') {
      const step=kind==='checkerboard'?256:kind==='terracotta'?128:512;
      for(let y=0;y<1024;y+=step)for(let x=0;x<1024;x+=step){
        c.fillStyle=kind==='checkerboard'?((x+y)/step%2?'#343c3d':'#c8c3ad'):kind==='terracotta'?color('#995734','#d8ad7f',random()*.5):color('#787e74','#d3d0bd',random()*.4);
        c.fillRect(x+2,y+2,step-4,step-4);
        if(kind==='stone'){c.strokeStyle='rgba(221,222,210,.12)';c.lineWidth=2;for(let n=0;n<5;n++){c.beginPath();c.moveTo(x,y+n*103);c.bezierCurveTo(x+130,y+n*90,x+280,y+n*117,x+512,y+n*99);c.stroke();}}
      }
    }
    grain(c,15000);
  },true);
  const floor=enableWorldSpaceUV(new THREE.MeshStandardMaterial({map:floorMap,roughness:design.floorTreatment==='terrazzo'?.44:.78,metalness:0}));
  const rugMap=canvasMap(c=>{
    c.fillStyle=color(room.palette.upholstery,'#bcae8d',design.rugPattern==='woven'?.5:.12);c.fillRect(0,0,1024,1024);
    c.strokeStyle=room.palette.accent;c.fillStyle=room.palette.accent;c.lineWidth=7;
    const pattern=design.rugPattern;
    if(pattern==='stripes'||pattern==='woven') {
      for(let x=0;x<1024;x+=pattern==='stripes'?100:7){c.fillStyle=pattern==='stripes'?room.palette.accent:'rgba(231,218,187,.16)';c.fillRect(x,0,pattern==='stripes'?27:2,1024);}
    }else if(pattern==='geometric'||pattern==='kilim'){
      for(let y=100;y<1024;y+=200)for(let x=100;x<1024;x+=200){c.save();c.translate(x,y);c.rotate(Math.PI/4);c.strokeRect(-58,-58,116,116);if(pattern==='kilim'){c.lineWidth=13;c.strokeRect(-35,-35,70,70);}else if((x+y)%400===0)c.fillRect(-40,-40,80,80);c.restore();}
    }else if(pattern==='orbital'||pattern==='organic'){
      for(let n=0;n<7;n++){c.lineWidth=pattern==='organic'?32:9;c.beginPath();c.ellipse(512+(pattern==='organic'?Math.sin(n)*100:0),512,110+n*53,80+n*40,.35+n*.08,0,Math.PI*2);c.stroke();}
    }else if(pattern==='medallion'){
      for(let border=0;border<4;border++)c.strokeRect(25+border*20,25+border*20,974-border*40,974-border*40);
      c.save();c.translate(512,512);for(let n=0;n<10;n++){c.rotate(Math.PI/5);c.beginPath();c.ellipse(0,-160,60,220,0,0,Math.PI*2);c.stroke();}c.restore();
    }
    c.strokeStyle=color(room.palette.accent,'#cfb78d',.4);c.lineWidth=10;c.strokeRect(13,13,998,998);grain(c,22000);
  });
  const rug=new THREE.MeshStandardMaterial({map:rugMap,roughness:1});
  return {wall,floor,rug,wallColor};
}
