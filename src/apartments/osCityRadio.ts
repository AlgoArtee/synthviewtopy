import * as THREE from 'three';
import { CityRoundedBoxGeometry } from './osCityGeometry';
import { CITY_RADIO_PROGRAMS, createCityRadioAudio } from './osCityRadioAudio';

export function createOsCityRadio() {
  const group=new THREE.Group();group.name='Desk radio · Nocturne 01';group.position.set(1.91,0,5.68);group.rotation.y=Math.PI;
  const audio=createCityRadioAudio();
  const pearl=new THREE.MeshStandardMaterial({color:'#dde8ed',metalness:.3,roughness:.28});
  const graphite=new THREE.MeshStandardMaterial({color:'#172634',metalness:.55,roughness:.32});
  const rubber=new THREE.MeshStandardMaterial({color:'#060e17',roughness:.8});
  const metal=new THREE.MeshStandardMaterial({color:'#859fae',metalness:.9,roughness:.23});
  const glow=new THREE.MeshBasicMaterial({color:'#63eaff',toneMapped:false});
  const amber=new THREE.MeshBasicMaterial({color:'#ff9955',toneMapped:false});
  const part=(name:string,geometry:THREE.BufferGeometry,material:THREE.Material,x:number,y:number,z:number)=>{
    const mesh=new THREE.Mesh(geometry,material);mesh.name='Radio · '+name;mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;
  };
  const box=(name:string,w:number,h:number,d:number,material:THREE.Material,x:number,y:number,z:number,r=.015)=>part(name,new CityRoundedBoxGeometry(w,h,d,2,r),material,x,y,z);
  // A separate, stable side stand keeps the keyboard and seasonal desk pumpkin clear.
  box('side stand foot',.65,.035,.43,graphite,0,.022,0);
  box('side stand column',.13,.70,.13,metal,0,.39,0);
  box('side stand surface',.88,.045,.43,pearl,0,.7625,0);
  box('stand inset',.79,.006,.36,graphite,0,.789,0,.003);
  for(const x of [-.28,.28])box('rubber foot',.10,.026,.22,rubber,x,.808,0,.005);
  const body=box('pearl chassis',.78,.275,.255,pearl,0,.956,0,.035);
  box('recessed front fascia',.744,.238,.019,graphite,0,.955,.13,.026);
  box('top orange inlay',.34,.003,.035,amber,0,1.094,-.025,.001);
  for(const x of [-.255,.255]) {
    part('speaker surround',new THREE.TorusGeometry(.084,.009,12,48),rubber,x,.962,.146);
    part('speaker cone',new THREE.CircleGeometry(.077,48),rubber,x,.962,.148);
    part('speaker diaphragm',new THREE.SphereGeometry(.041,24,12),graphite,x,.962,.143).scale.z=.2;
    part('cyan speaker halo',new THREE.TorusGeometry(.091,.0027,8,64),glow,x,.962,.159);
    part('titanium dust cap',new THREE.SphereGeometry(.022,24,12),metal,x,.962,.151).scale.z=.25;
  }
  // Instanced grille mesh: tangible speaker texture without hundreds of draw calls.
  const points:THREE.Vector3[]=[];
  for(const center of [-.255,.255])for(let row=-6;row<=6;row++)for(let col=-6;col<=6;col++){
    const x=col*.011,y=row*.011;if(Math.hypot(x,y)<.073)points.push(new THREE.Vector3(center+x,.962+y,.158));
  }
  const grille=new THREE.InstancedMesh(new THREE.SphereGeometry(.0019,4,3),metal,points.length),matrix=new THREE.Matrix4();
  points.forEach((point,i)=>{matrix.makeTranslation(point);grille.setMatrixAt(i,matrix);});grille.name='Radio · perforated speaker grilles';group.add(grille);
  box('display bezel',.266,.139,.012,rubber,0,.982,.145,.012);
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=300;const c=canvas.getContext('2d')!;
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const screen=part('live program display',new THREE.PlaneGeometry(.25,.117),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}),0,.984,.153);
  screen.castShadow=screen.receiveShadow=false;
  for(const x of [-.09,-.045,0])box('transport key',.027,.014,.009,metal,x,.879,.15,.003);
  const dial=part('volume encoder',new THREE.CylinderGeometry(.026,.026,.022,32),metal,.094,.88,.157);dial.rotation.x=Math.PI/2;
  box('dial index',.003,.012,.002,glow,.094,.892,.169,.001);
  const antenna=part('telescopic antenna',new THREE.CylinderGeometry(.0025,.0035,.28,12),metal,-.29,1.224,-.073);antenna.rotation.z=.22;
  part('antenna pivot',new THREE.SphereGeometry(.013,16,8),graphite,-.26,1.093,-.073);
  const cable=new THREE.CatmullRomCurve3([new THREE.Vector3(.28,.91,-.13),new THREE.Vector3(.35,.7,-.15),new THREE.Vector3(.35,.3,-.19),new THREE.Vector3(.30,.06,-.24)]);
  part('power cable',new THREE.TubeGeometry(cable,20,.005,6,false),rubber,0,0,0);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let lastDraw=-1,signature='';
  const update=(time:number)=>{
    const state=audio.getSnapshot(),key=state.program+state.playing+state.loading+state.volume;
    if(key===signature&&(!state.playing||reduced.matches||time-lastDraw<.12))return;
    signature=key;lastDraw=time;
    c.fillStyle='#061923';c.fillRect(0,0,640,300);c.fillStyle='#87e9f5';c.font='24px monospace';c.fillText('NOCTURNE / 01',28,40);
    c.fillStyle='#e5faff';c.font='bold 34px sans-serif';c.fillText(CITY_RADIO_PROGRAMS.find(p=>p.id===state.program)!.name,28,95,585);
    c.fillStyle='#ffb070';c.font='22px monospace';c.fillText(state.loading?'TUNING…':state.playing?'HALLOWEEN • ON AIR':'HALLOWEEN • STANDBY',28,135);
    for(let i=0;i<28;i++){const height=state.playing?8+Math.min(1,state.level*9)*(22+55*(.5+.5*Math.sin(time*5+i*.8))):3;c.fillStyle=i>22?'#ff9c60':'#5ce6f3';c.fillRect(29+i*21,242-height,12,height);}
    c.fillStyle='#80b6c5';c.font='20px monospace';c.fillText('SELECT TO TUNE',28,279);c.textAlign='right';c.fillText(state.volume+'%',610,279);c.textAlign='left';texture.needsUpdate=true;
  };
  update(0);
  group.userData.appliance={type:'Halloween stereo radio',size:[.78,.275,.255],position:group.position.toArray(),programs:CITY_RADIO_PROGRAMS.map(p=>p.name)};
  return {group,audio,update,dispose:audio.dispose,pickRoot:group,pickTarget:body};
}
export type CityRadio=ReturnType<typeof createOsCityRadio>;
