import * as THREE from 'three';
import { CITY_BALCONY_DOOR as D } from './osCityLayout';

export type CityBalconyDoorMode = 'closed' | 'half' | 'open';

/** Two real telescoping leaves, with the same bounds used by walking collision. */
export function createOsCityBalconyDoor(colliders: THREE.Box3[], reducedMotion = false) {
  const group = new THREE.Group(); group.name = 'Balcony door · telescoping glazed assembly';
  const metal = new THREE.MeshStandardMaterial({color:'#455b69',metalness:.68,roughness:.31});
  const dark = new THREE.MeshStandardMaterial({color:'#172a35',metalness:.4,roughness:.46});
  const glass = new THREE.MeshPhysicalMaterial({color:'#c5e2e7',metalness:.08,roughness:.11,transparent:true,opacity:.14,side:THREE.DoubleSide,depthWrite:false});
  const part = (name:string,p:number[],d:number[],material:THREE.Material,parent:THREE.Object3D=group) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(d[0],d[1],d[2]),material);
    mesh.name = 'Balcony door · '+name; mesh.position.set(p[0],p[1],p[2]); mesh.castShadow=material!==glass; mesh.receiveShadow=true; parent.add(mesh); return mesh;
  };
  for(const x of [D.minX-.025,D.maxX+.025])part('metal jamb',[x,D.height/2,D.z],[.05,D.height+.06,.23],dark);
  part('continuous recessed head track',[3.45,D.height+.024,D.z+.16],[2.74,.065,.31],metal);
  part('flush threshold',[(D.minX+D.maxX)/2,.008,D.z],[D.maxX-D.minX,.016,.3],metal);
  for(const z of [D.z+.20,D.z+.28])part('floor guide channel',[3.45,.019,z],[2.74,.006,.012],dark);
  const closed=[2.49,3.24],parked=[4.04,4.31],halfWidth=.4175;
  const leaves = closed.map((_,i)=>{
    // The balcony-side pull must also clear the room face of the parking wall
    // at z=-.15; these tracks leave 9.5 mm behind its actual mesh bounds.
    const leaf = new THREE.Group(); leaf.name='Balcony door · sliding leaf '+(i+1); leaf.position.z=D.z+.20+i*.08; group.add(leaf);
    part('laminated glass leaf '+(i+1),[0,1.30,0],[.765,2.51,.024],glass,leaf);
    for(const x of [-.4,.4])part('leaf stile',[x,1.30,0],[.035,2.57,.06],metal,leaf);
    for(const y of [.025,2.58])part('leaf rail',[0,y,0],[.8,.04,.06],metal,leaf);
    if(i===0)for(const z of [-.068,.068]){
      part('two-sided pull',[-.32,1.17,z],[.025,.28,.025],metal,leaf);
      for(const y of [1.05,1.29])part('pull fixing',[-.32,y,z/2],[.024,.023,Math.abs(z)],metal,leaf);
    }
    const collider=new THREE.Box3(); colliders.push(collider);
    return {leaf,collider};
  });
  let mode:CityBalconyDoorMode='open',fraction=1,obstructed=false;
  const target = () => mode==='open'?1:mode==='half'?.5:0;
  const xAt=(i:number,f:number)=>THREE.MathUtils.lerp(closed[i],parked[i],f);
  function sync(){
    leaves.forEach(({leaf,collider},i)=>{
      leaf.position.x=xAt(i,fraction);
      collider.min.set(leaf.position.x-halfWidth,.005,leaf.position.z-.082);
      collider.max.set(leaf.position.x+halfWidth,2.60,leaf.position.z+.082);
    });
    group.userData.door=snapshot();
  }
  function snapshot(){
    const clearWidth=THREE.MathUtils.clamp(leaves[0].leaf.position.x-halfWidth-D.minX,0,D.maxX-D.minX);
    return {mode,type:'telescoping sliding',openFraction:+fraction.toFixed(4),clearWidth:+clearWidth.toFixed(4),openingHeight:D.height,
      transitioning:Math.abs(fraction-target())>.0001,obstructed,playerDiameter:.48,
      leaves:leaves.map(({leaf,collider})=>({x:+leaf.position.x.toFixed(4),z:+leaf.position.z.toFixed(4),minX:+collider.min.x.toFixed(4),maxX:+collider.max.x.toFixed(4),minZ:+collider.min.z.toFixed(4),maxZ:+collider.max.z.toFixed(4)}))};
  }
  function setMode(value:string){if(value==='closed'||value==='half'||value==='open'){mode=value;obstructed=false;}}
  function update(dt:number,listener?:{x:number;y:number;z:number}){
    const desired=target(),next=reducedMotion?desired:THREE.MathUtils.damp(fraction,desired,6,Math.max(0,Math.min(.05,dt)));
    const candidate=Math.abs(next-desired)<.0001?desired:next;
    // Pause before a moving panel can cross the user's body. It resumes when
    // the doorway is clear; controls remain available from either side.
    obstructed=!!listener&&candidate!==fraction&&listener.y<4.25&&leaves.some(({leaf},i)=>{
      const minX=Math.min(xAt(i,candidate),xAt(i,fraction))-halfWidth-.24;
      const maxX=Math.max(xAt(i,candidate),xAt(i,fraction))+halfWidth+.24;
      return listener.x>minX&&listener.x<maxX&&Math.abs(listener.z-leaf.position.z)<.322;
    });
    if(!obstructed)fraction=candidate;
    sync();
  }
  sync();
  return {group,setMode,update,getSnapshot:snapshot,options:[{id:'closed',label:'Closed'},{id:'half',label:'Half open'},{id:'open',label:'Fully open'}]};
}
