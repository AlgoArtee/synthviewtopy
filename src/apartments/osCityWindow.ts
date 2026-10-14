import * as THREE from 'three';
import { CITY_BED, CITY_WINDOW } from './osCityLayout';

export type CityWindowMode = 'closed' | 'open' | 'tilt';
/** One fixed panorama and a wall-hinged, inward-opening tilt-and-turn side light. */
export function createOsCityWindow() {
  const group=new THREE.Group();group.name='Panoramic window · two-bay tilt-and-turn assembly';
  const frame=new THREE.MeshStandardMaterial({color:'#aab5c1',metalness:.88,roughness:.25});
  const gasket=new THREE.MeshStandardMaterial({color:'#27323e',roughness:.86});
  const hardware=new THREE.MeshStandardMaterial({color:'#c1cbd3',metalness:.93,roughness:.22});
  const glass=new THREE.MeshPhysicalMaterial({color:'#dceaf3',transparent:true,opacity:.032,roughness:.085,metalness:.12,side:THREE.DoubleSide,depthWrite:false});
  const {x:wx,z:wz,width}=CITY_WINDOW;
  const divider=CITY_BED.minX+.045+(width-.09)/4;
  // Keep the operating leaf above the duvet and the low pillow's complete swept envelope.
  const sill=1.24,top=3.448,left=CITY_BED.minX+.215,right=divider-.038;
  const leafWidth=right-left,leafHeight=top-sill;
  function box(name:string,mat:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number,parent:THREE.Object3D=group){
    const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.name=name;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
  }
  function pane(name:string,x:number,y:number,z:number,w:number,h:number,parent:THREE.Object3D=group){
    const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),glass);o.name=name;o.position.set(x,y,z);o.castShadow=false;parent.add(o);return o;
  }
  for(const y of [.0225,3.4775]){
    box('Panoramic window · recessed perimeter frame',frame,wx,y,wz-.105,width,.045,.21);
    box('Panoramic window · EPDM perimeter gasket',gasket,wx,y===.0225?.048:3.452,wz-.055,width-.09,.009,.014);
  }
  for(const x of [CITY_BED.minX+.0225,CITY_BED.maxX-.0225])box('Panoramic window · sealed side jamb',frame,x,1.75,wz-.105,.045,3.5,.21);
  // The wider wall-side reveal provides space for the lever when the sash is fully open.
  box('Window · wall-side hinge reveal',frame,CITY_BED.minX+.124,1.75,wz-.105,.158,3.404,.21);
  box('Panoramic window · single retained divider',frame,divider,1.75,wz-.105,.042,3.41,.16);
  box('Panoramic window · retained divider gasket',gasket,divider,1.75,wz-.018,.009,3.41,.012);
  const largeLeft=divider+.027,largeRight=CITY_BED.maxX-.045;
  pane('Panoramic window · laminated panorama glass', (largeLeft+largeRight)/2,1.75,wz-.105,largeRight-largeLeft,3.404);
  // The low fixed light continues to floor level behind the wall-fitted mattress.
  pane('Panoramic window · laminated lower side light',(left+right)/2,(sill-.045)/2+.045,wz-.105,leafWidth,sill-.045);
  box('Panoramic window · side-light operating sill',frame,(left+right)/2,sill-.024,wz-.09,leafWidth+.055,.048,.18);
  const turn=new THREE.Group();turn.name='Window · wall-side turn hinge';turn.position.set(left,sill,wz-.032);group.add(turn);
  const tilt=new THREE.Group();tilt.name='Window · bottom tilt hinge';turn.add(tilt);
  const sash=new THREE.Group();sash.name='Window · opening sash';tilt.add(sash);
  const rail=.046;
  for(const x of [rail/2,leafWidth-rail/2]){
    box('Window sash · thermally broken vertical rail',frame,x,leafHeight/2,0,rail,leafHeight,.078,sash);
    box('Window sash · continuous black seal',gasket,x,leafHeight/2,.041,.010,leafHeight-.04,.008,sash);
  }
  for(const y of [rail/2,leafHeight-rail/2]){
    box('Window sash · thermally broken horizontal rail',frame,leafWidth/2,y,0,leafWidth-rail,rail,.078,sash);
    box('Window sash · continuous black seal',gasket,leafWidth/2,y,.041,leafWidth-.04,.009,.008,sash);
  }
  pane('Panoramic window · laminated operable glass',leafWidth/2,leafHeight/2,-.008,leafWidth-rail*2,leafHeight-rail*2,sash);
  // Three substantial hinge knuckles and keep plates explain the opening direction.
  for(const y of [.18,leafHeight*.50,leafHeight-.18]){
    box('Window · left hinge attachment plate',hardware,left-.026,sill+y,wz-.04,.055,.12,.055);
    const pin=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.115,12),hardware);pin.name='Window · load-bearing left hinge pin';pin.position.set(0,y,.008);sash.add(pin);
  }
  const handle=new THREE.Group();handle.name='Window · tilt-and-turn handle';handle.position.set(leafWidth-.070,leafHeight*.49,.075);sash.add(handle);
  box('Window · handle backplate',hardware,0,0,0,.036,.13,.018,handle);
  box('Window · lever stem',hardware,0,0,.037,.022,.022,.064,handle);
  const grip=box('Window · three-position lever',hardware,0,-.058,.071,.023,.15,.025,handle);
  // An articulated restrictor stays attached in tilt mode instead of floating in the opening.
  const stayA=box('Window · tilt restrictor arm A',hardware,0,0,0,.014,.014,1);
  const stayB=box('Window · tilt restrictor arm B',hardware,0,0,0,.014,.014,1);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mode:CityWindowMode='closed',turnAngle=0,tiltAngle=0,lastTime:number|undefined;
  const snapshot=()=>({mode,hingeSide:'left / west wall',swing:'inward',turnDegrees:+THREE.MathUtils.radToDeg(-turnAngle).toFixed(3),tiltDegrees:+THREE.MathUtils.radToDeg(tiltAngle).toFixed(3),openingSill:sill,leafWidth,leafHeight,dividerX:divider,largePaneWidth:largeRight-largeLeft,topOpeningMetres:+(Math.sin(tiltAngle)*leafHeight).toFixed(4),transitioning:Math.abs(turnAngle-(mode==='open'?-Math.PI/2:0))>.001||Math.abs(tiltAngle-(mode==='tilt'?.15:0))>.001});
  function sync(){
    turn.rotation.y=turnAngle;tilt.rotation.x=tiltAngle;
    const leverAngle=mode==='closed'?0:mode==='open'?-Math.PI/2:Math.PI;
    grip.rotation.z=leverAngle;grip.position.set(.058*Math.sin(leverAngle),-.058*Math.cos(leverAngle),.071);
    group.updateMatrixWorld(true);
    const a=new THREE.Vector3(left+.08,top-.12,wz-.034),b=new THREE.Vector3(.08,leafHeight-.12,.02).applyMatrix4(sash.matrixWorld),mid=a.clone().lerp(b,.5);mid.y-=.045;
    for(const [arm,start,end]of [[stayA,a,mid],[stayB,mid,b]] as const){const d=end.clone().sub(start);arm.visible=tiltAngle>.008&&Math.abs(turnAngle)<.001;arm.position.copy(start).lerp(end,.5);arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),d.clone().normalize());arm.scale.z=d.length();}
    group.userData.window=snapshot();
  }
  function setMode(value:string){if(value!=='closed'&&value!=='open'&&value!=='tilt')return;mode=value;if(reduced){turnAngle=mode==='open'?-Math.PI/2:0;tiltAngle=mode==='tilt'?.15:0;}sync();}
  function update(t:number){
    const dt=lastTime===undefined?0:Math.max(0,Math.min(.05,t-lastTime));lastTime=t;
    // Close one mechanism before engaging the other, matching tilt-and-turn hardware.
    const targetTurn=mode==='open'&&tiltAngle<.001?-Math.PI/2:0;
    const targetTilt=mode==='tilt'&&Math.abs(turnAngle)<.001?.15:0;
    if(!reduced){turnAngle=THREE.MathUtils.damp(turnAngle,targetTurn,8,dt);tiltAngle=THREE.MathUtils.damp(tiltAngle,targetTilt,8,dt);if(Math.abs(turnAngle-targetTurn)<.0001)turnAngle=targetTurn;if(Math.abs(tiltAngle-targetTilt)<.0001)tiltAngle=targetTilt;}
    sync();
  }
  sync();
  return {group,setMode,update,snapshot,options:[{id:'closed',label:'Closed'},{id:'open',label:'Fully open · left hinge'},{id:'tilt',label:'Tilt open · Kippöffnung'}]};
}
