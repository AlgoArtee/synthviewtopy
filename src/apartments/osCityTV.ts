import * as THREE from 'three';
import { CITY_BED } from './osCityLayout';

/** A wall-mounted optical rail projects a translucent, slowly moving art channel. */
export function createOsCityTV() {
  const group=new THREE.Group();group.name='Left-wall holographic television';
  // Local +Z is the inward-facing optical front; local X follows the west wall.
  group.position.set(CITY_BED.minX+.145,2.12,CITY_BED.centerZ);group.rotation.y=Math.PI/2;
  const add=(name:string,g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0)=>{
    const o=new THREE.Mesh(g,m);o.name=name;o.position.set(x,y,z);o.castShadow=false;o.receiveShadow=false;group.add(o);return o;
  };
  const alloy=new THREE.MeshStandardMaterial({color:'#aabcc8',metalness:.88,roughness:.24});
  const black=new THREE.MeshStandardMaterial({color:'#162c39',metalness:.4,roughness:.3});
  const led=new THREE.MeshBasicMaterial({color:'#84cce1',transparent:true,opacity:.55});
  for(const x of [-1.42,1.42])add('TV · short wall attachment',new THREE.BoxGeometry(.08,.18,.15),alloy,x,-1.06,-.075);
  add('TV · wall-mounted optical projector rail',new THREE.BoxGeometry(3.86,.065,.12),alloy,0,-1.06);
  add('TV · black optical aperture',new THREE.BoxGeometry(3.70,.012,.095),black,0,-1.021,.005);
  add('TV · recessed cyan optical slit',new THREE.BoxGeometry(3.55,.004,.008),led,0,-1.012,.035);
  const uniforms={time:{value:0}};
  const film=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:`varying vec2 q;void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`
      varying vec2 q;uniform float time;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
      float fbm(vec2 p){return noise(p)*.57+noise(p*2.13+7.3)*.28+noise(p*4.27+1.8)*.15;}
      void main(){
        vec2 p=q;float t=time*.035;
        vec3 col=mix(vec3(.008,.035,.073),vec3(.055,.18,.24),p.y);
        // Filmy aurora curtains behind an island horizon, with an uneven reflected ocean.
        float curtain=sin(p.x*7.2+t+fbm(vec2(p.x*5.5,t))*3.6)*.12+.70;
        float veil=exp(-pow((p.y-curtain)/(.058+noise(vec2(p.x*18.,t))*.06),2.));
        veil*=smoothstep(.35,.9,p.y)*(.35+.65*fbm(vec2(p.x*32.,p.y*10.-t)));
        col+=mix(vec3(.07,.55,.66),vec3(.42,.18,.57),p.x)*veil*.7;
        float moon=1.-smoothstep(.045,.048,length((p-vec2(.73,.73))*vec2(1.78,1.)));
        col+=vec3(.42,.60,.65)*moon;
        for(int i=0;i<4;i++){
          float k=float(i),h=.24+k*.045+fbm(vec2(p.x*(8.+k*3.)+k*7.,k))*(.05+k*.025);
          float ridge=1.-smoothstep(h-.005,h+.004,p.y);
          col=mix(col,vec3(.018+k*.012,.06+k*.014,.09+k*.022),ridge*.8);
        }
        if(p.y<.27){float r=fbm(vec2(p.x*31.,p.y*130.-time*.13));
          col=mix(vec3(.014,.072,.10),vec3(.08,.30,.36),r*.68);
          col+=vec3(.12,.26,.28)*exp(-pow((p.x-.73)/(.016+(.27-p.y)*.24),2.))*r*.5;
        }
        float scan=.96+.04*sin(p.y*1600.-time*.4);
        float edge=smoothstep(0.,.008,p.x)*smoothstep(1.,.992,p.x)*smoothstep(0.,.012,p.y)*smoothstep(1.,.988,p.y);
        gl_FragColor=vec4(col*scan*1.55,.76*edge);
      }`});
  add('TV · translucent animated art channel',new THREE.PlaneGeometry(3.72,2.02),film,0,0,.055);
  // Thin light corners describe a floating television without a heavy opaque chassis.
  for(const sx of [-1,1])for(const sy of [-1,1]){
    add('TV · holographic corner marker',new THREE.PlaneGeometry(.15,.002),led,sx*1.77,sy*.995,.06);
    add('TV · holographic corner marker',new THREE.PlaneGeometry(.002,.10),led,sx*1.845,sy*.945,.06);
  }
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=64;
  const c=canvas.getContext('2d')!;c.font='20px sans-serif';c.fillStyle='#a3d7e3';c.fillText('NORTH   /   ART CHANNEL',22,40);
  c.textAlign='right';c.fillStyle='#91b1c5';c.fillText('AURORA   ·   LIVE',1000,40);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  add('TV · quiet channel identifier',new THREE.PlaneGeometry(3.54,.22),new THREE.MeshBasicMaterial({map,transparent:true,opacity:.65,depthWrite:false}),0,-.86,.06);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  group.userData.television={wall:'west / left when facing city',centreZ:CITY_BED.centerZ,bedCentreAligned:true,width:3.72,height:2.02,panelClearance:.2,channel:'Aurora / atmospheric ocean',animated:true};
  return {group,update(t:number){uniforms.time.value=reduced?0:t;}};
}
