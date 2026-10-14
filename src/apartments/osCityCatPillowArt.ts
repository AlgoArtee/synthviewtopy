import * as THREE from 'three';

/** Original continuous-line cat drawings, printed into matte cotton, not luminous decals. */
export function createCatPillowPrint(index:number,width:number,height:number){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=768;
  const c=canvas.getContext('2d')!;c.fillStyle='#f5f5f1';c.fillRect(0,0,768,768);
  c.scale(768,768);c.translate(.5,.5);c.rotate((index%3-1)*.025);c.scale(index%2?-1:1,1);c.translate(-.5,-.5);
  const blue='#287fa8',pink='#b13b82',ink=c.createLinearGradient(.16,.22,.80,.78);
  ink.addColorStop(0,index%2?pink:blue);ink.addColorStop(.48,index%2?pink:blue);ink.addColorStop(1,index%2?blue:pink);
  c.strokeStyle=ink;c.lineWidth=.010;c.lineCap='round';c.lineJoin='round';
  const line=(path:string,color:string|CanvasGradient=ink,weight=.010)=>{c.strokeStyle=color;c.lineWidth=weight;c.stroke(new Path2D(path));};
  const style=index%3;
  if(style===0){
    // One unbroken seated silhouette, a curled tail and softly closed eyes.
    line('M .69 .78 C .54 .86 .25 .83 .23 .68 C .21 .56 .32 .54 .36 .60 C .40 .66 .33 .73 .30 .68 C .29 .65 .34 .66 .35 .68 M .36 .79 C .39 .67 .41 .53 .51 .46 C .42 .42 .40 .34 .42 .28 L .40 .16 L .52 .24 C .56 .21 .61 .22 .64 .24 L .76 .15 L .73 .32 C .79 .40 .73 .47 .66 .48 C .65 .56 .73 .65 .69 .78 L .58 .78 C .57 .67 .59 .62 .60 .58');
    line('M .46 .34 Q .50 .37 .54 .34 M .62 .34 Q .66 .37 .70 .34 M .56 .40 L .58 .42 L .60 .40 M .58 .42 Q .54 .45 .52 .42 M .58 .42 Q .62 .46 .65 .43',pink,.006);
    line('M .46 .41 L .35 .39 M .46 .44 L .35 .45 M .67 .41 L .80 .39 M .67 .44 L .80 .46',blue,.0045);
    line('M .47 .75 C .46 .62 .50 .57 .52 .55',blue,.006);
  }else if(style===1){
    // Sleeping cat curled into an open circular gesture.
    line('M .70 .64 C .81 .56 .80 .36 .65 .29 C .51 .21 .30 .29 .26 .44 C .18 .60 .32 .76 .49 .77 C .66 .79 .77 .69 .70 .61 C .64 .55 .48 .56 .44 .64 C .42 .70 .52 .73 .58 .69 C .61 .67 .58 .65 .56 .66 M .29 .48 L .28 .32 L .40 .39 C .44 .37 .50 .38 .54 .41 L .66 .33 L .62 .50 C .60 .60 .49 .64 .39 .58 C .34 .55 .31 .52 .29 .48');
    line('M .35 .48 Q .39 .52 .43 .48 M .48 .48 Q .52 .52 .56 .48 M .43 .54 L .46 .56 L .49 .54',pink,.0065);
    line('M .32 .54 L .21 .52 M .33 .57 L .23 .60 M .58 .54 L .70 .53',blue,.0045);
    line('M .28 .68 C .39 .82 .69 .85 .80 .67',index%2?pink:blue,.0045);
  }else{
    // A stretched, wandering cat with a long flowing tail.
    line('M .18 .39 C .06 .23 .28 .14 .30 .28 C .32 .36 .22 .39 .21 .34 C .20 .31 .24 .29 .26 .31 M .18 .39 C .20 .52 .31 .51 .40 .47 C .48 .43 .56 .45 .60 .51 C .62 .58 .65 .67 .61 .74 L .68 .74 C .72 .62 .73 .56 .72 .50 C .80 .48 .81 .39 .76 .35 L .78 .22 L .67 .29 C .64 .28 .61 .28 .58 .30 L .49 .24 L .51 .38 C .43 .38 .38 .34 .30 .36 C .26 .37 .22 .40 .18 .39 M .30 .49 C .27 .59 .28 .67 .33 .73 L .40 .73 C .35 .63 .37 .57 .42 .52');
    line('M .58 .37 Q .62 .40 .65 .37 M .69 .37 Q .72 .39 .74 .37 M .65 .43 L .67 .45 L .69 .43',pink,.006);
    line('M .57 .44 L .47 .42 M .58 .46 L .47 .48 M .74 .43 L .83 .40 M .74 .46 L .84 .47',blue,.0045);
  }
  // A single incomplete brush gesture keeps the print abstract and airy.
  line('M .18 .78 C .12 .68 .13 .54 .16 .48 M .79 .22 C .84 .30 .86 .39 .85 .45',index%2?blue:pink,.0035);
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.repeat.set(1/width,1/height);t.name='Cotton print · blue-magenta abstract cat '+(index+1);return t;
}
