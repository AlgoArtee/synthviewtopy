import * as THREE from 'three';
import { CityRoundedBoxGeometry } from './osCityGeometry';

/** Countertop kettle in kitchen-local coordinates; the controls face into the room. */
export function createOsCityKettle() {
  const group=new THREE.Group();group.name='Kitchen · futuristic electric kettle';
  group.position.set(4.58,.908,1.30);
  const pearl=new THREE.MeshPhysicalMaterial({color:'#eef2f3',roughness:.24,metalness:.08,clearcoat:.5});
  const metal=new THREE.MeshStandardMaterial({color:'#b7c9d2',metalness:.92,roughness:.24});
  const graphite=new THREE.MeshStandardMaterial({color:'#20313e',roughness:.4,metalness:.25});
  const cyan=new THREE.MeshBasicMaterial({color:'#70e7fa',toneMapped:false});
  const part=(name:string,geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0)=>{
    const mesh=new THREE.Mesh(geometry,material);mesh.name='Kettle · '+name;
    mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;
  };
  const ring=(name:string,radius:number,tube:number,y:number,material:THREE.Material)=>{
    const mesh=part(name,new THREE.TorusGeometry(radius,tube,8,64),material,0,y);
    mesh.rotation.x=Math.PI/2;return mesh;
  };
  part('cordless power dock',new THREE.CylinderGeometry(.146,.15,.024,64),graphite,0,.012);
  ring('cyan dock status ring',.144,.0035,.026,cyan);
  const bodyProfile=[[0,.027],[.104,.027],[.12,.035],[.13,.055],[.133,.105],[.127,.185],[.115,.258],[.102,.297],[0,.297]];
  part('pearl ceramic insulated vessel',new THREE.LatheGeometry(bodyProfile.map(([r,y])=>new THREE.Vector2(r,y)),64),pearl);
  ring('brushed lower collar',.126,.004,.046,metal);
  ring('sealed lid rim',.103,.004,.298,metal);
  part('graphite lid gasket',new THREE.CylinderGeometry(.101,.101,.008,64),graphite,0,.301);
  part('flush metal lid',new THREE.CylinderGeometry(.099,.101,.011,64),metal,0,.309);
  part('lid touch release',new THREE.CylinderGeometry(.027,.029,.008,32),graphite,0,.319);
  ring('illuminated release edge',.025,.0015,.324,cyan);
  // A genuinely hollow, angled spout with an inset bore and a separate metal lip.
  const start=new THREE.Vector3(0,.207,-.099),end=new THREE.Vector3(0,.273,-.226);
  const axis=end.clone().sub(start),length=axis.length(),orientation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize());
  const spoutProfile=[[.044,0],[.033,length*.65],[.025,length],[.019,length],[.026,length*.65],[.035,0]];
  const spout=part('open tapered pouring spout',new THREE.LatheGeometry(spoutProfile.map(([r,y])=>new THREE.Vector2(r,y)),32),pearl);
  spout.position.copy(start);spout.quaternion.copy(orientation);
  const lip=part('spout polished rim',new THREE.TorusGeometry(.022,.003,8,32),metal);
  lip.position.copy(end);lip.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),axis);
  const bore=part('recessed spout bore',new THREE.CircleGeometry(.019,32),graphite);
  bore.position.copy(end).addScaledVector(axis,-.012);bore.quaternion.copy(lip.quaternion);
  const handlePoints=[[0,.263,.105],[0,.278,.181],[0,.246,.232],[0,.14,.247],[0,.081,.207],[0,.073,.124]];
  const handleCurve=new THREE.CatmullRomCurve3(handlePoints.map(p=>new THREE.Vector3(...p)));
  part('open insulated loop handle',new THREE.TubeGeometry(handleCurve,40,.016,10,false),graphite);
  const trace=new THREE.CatmullRomCurve3(handlePoints.slice(1,-1).map(([x,y,z])=>new THREE.Vector3(x-.0175,y,z)));
  part('cyan handle inlay',new THREE.TubeGeometry(trace,24,.002,6,false),cyan);
  part('inset temperature bezel',new CityRoundedBoxGeometry(.012,.111,.082,2,.008),graphite,-.129,.178,0);
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=352;
  const c=canvas.getContext('2d')!;c.fillStyle='#0c202c';c.fillRect(0,0,256,352);
  c.textAlign='center';c.fillStyle='#88eaff';c.font='19px monospace';c.fillText('AQUA / 01',128,48);
  c.fillStyle='#d8fbff';c.font='bold 72px sans-serif';c.fillText('95°',128,150);
  c.fillStyle='#73dbe9';c.font='20px monospace';c.fillText('READY',128,194);
  c.fillStyle='#375566';c.fillRect(43,235,170,5);c.fillStyle='#88eaff';c.fillRect(43,235,131,5);
  c.font='17px monospace';c.fillText('1.5 L',128,285);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const display=part('cyan temperature readout',new THREE.PlaneGeometry(.073,.101),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}),-.1355,.178);
  display.rotation.y=-Math.PI/2;display.castShadow=display.receiveShadow=false;
  group.userData.appliance={type:'electric kettle',style:'pearl ceramic, satin metal, cyan status lighting',capacityLitres:1.5,displayTemperatureC:95};
  return group;
}
