import * as THREE from 'three';
import { createCityStreamClock } from './osCityStreamClock';

export interface CityMallVisitorLane {
  x:number; y:number; z:number; halfLength:number; radius:number;
  count:number; seed:number;
}

/** Constant-speed gallery walks, confined between shop glazing and terrace rails. */
export function createOsCityMallVisitors(lanes:CityMallVisitorLane[],clothes:THREE.Material,skin:THREE.Material,dark:THREE.Material){
  const group=new THREE.Group();group.name='Data Mall · walking gallery visitors';
  const visitors=lanes.flatMap(lane=>Array.from({length:lane.count},(_,i)=>({lane,
    phase:i/lane.count+(lane.seed*.137)%1,height:1.45+((lane.seed+i)%3)*.08,
    position:new THREE.Vector3(),heading:0,
  })));
  const count=visitors.length,meshes:THREE.InstancedMesh[]=[];
  function instances(name:string,geometry:THREE.BufferGeometry,material:THREE.Material,n:number){
    const mesh=new THREE.InstancedMesh(geometry,material,n);mesh.name='Data Mall · '+name;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // All animated instances stay in the mall; avoid stale initial-pose bounds.
    mesh.frustumCulled=false;meshes.push(mesh);group.add(mesh);return mesh;
  }
  const torsos=instances('walking coats',new THREE.CapsuleGeometry(.16,.4,2,6),clothes,count);
  const heads=instances('walking faces and hands',new THREE.SphereGeometry(1,7,5),skin,count*3);
  const limbs=instances('articulated arms and legs',new THREE.CylinderGeometry(1,1,1,5),clothes,count*8);
  const shoes=instances('walking shoes',new THREE.BoxGeometry(.14,.10,.26),dark,count*2);
  const hair=instances('visitor hair',new THREE.SphereGeometry(.13,7,4,0,Math.PI*2,0,Math.PI*.54),dark,count);
  const coatColors=['#263541','#4c5660','#574553','#294d59','#6b6260','#384355'];
  const skinColors=['#c99e7e','#a57860','#76523e','#d7b595'];
  visitors.forEach((v,i)=>{
    const coat=new THREE.Color(coatColors[(i+v.lane.seed)%coatColors.length]);torsos.setColorAt(i,coat);
    for(let n=0;n<8;n++)limbs.setColorAt(i*8+n,coat);
    for(let n=0;n<3;n++)heads.setColorAt(i*3+n,new THREE.Color(skinColors[i%skinColors.length]));
  });
  // This clock deliberately stays at 1x: the circuit-speed control is unrelated to shoppers.
  const clock=createCityStreamClock(),root=new THREE.Quaternion(),localRotation=new THREE.Quaternion();
  const position=new THREE.Vector3(),scale=new THREE.Vector3(),matrix=new THREE.Matrix4();
  const up=new THREE.Vector3(0,1,0),a=new THREE.Vector3(),b=new THREE.Vector3(),direction=new THREE.Vector3();
  function place(mesh:THREE.InstancedMesh,index:number,v:typeof visitors[number],x:number,y:number,z:number,sx=1,sy=1,sz=1){
    position.set(x,y,z).applyQuaternion(root).add(v.position);scale.set(sx,sy,sz);
    matrix.compose(position,root,scale);mesh.setMatrixAt(index,matrix);
  }
  function bone(index:number,v:typeof visitors[number],from:number[],to:number[],radius:number){
    a.set(...from as [number,number,number]);b.set(...to as [number,number,number]);
    direction.subVectors(b,a);const length=direction.length();
    localRotation.setFromUnitVectors(up,direction.divideScalar(length)).premultiply(root);
    position.copy(a).add(b).multiplyScalar(.5).applyQuaternion(root).add(v.position);
    scale.set(radius,length,radius);matrix.compose(position,localRotation,scale);limbs.setMatrixAt(index,matrix);
  }
  function update(elapsed:number,reducedMotion=false){
    const t=clock.step(elapsed,reducedMotion);
    visitors.forEach((v,i)=>{
      const lane=v.lane,L=lane.halfLength,r=lane.radius,straight=2*L,arc=Math.PI*r,length=2*(straight+arc);
      const speed=.68+(lane.seed%4)*.07,travelDirection=lane.seed%2?1:-1;
      let distance=((v.phase*length+t*speed*travelDirection)%length+length)%length;
      let x:number,z:number,dx:number,dz:number;
      if(distance<straight){x=-L+distance;z=r;dx=1;dz=0;}
      else if((distance-=straight)<arc){const angle=Math.PI/2-distance/r;x=L+r*Math.cos(angle);z=r*Math.sin(angle);dx=Math.sin(angle);dz=-Math.cos(angle);}
      else if((distance-=arc)<straight){x=L-distance;z=-r;dx=-1;dz=0;}
      else{distance-=straight;const angle=-Math.PI/2-distance/r;x=-L+r*Math.cos(angle);z=r*Math.sin(angle);dx=Math.sin(angle);dz=-Math.cos(angle);}
      v.position.set(lane.x+x,lane.y,lane.z+z);v.heading=Math.atan2(dx*travelDirection,dz*travelDirection);
      root.setFromAxisAngle(up,v.heading);
      const h=v.height,gait=t*speed*8.8+i*1.73,bob=.012*(1-Math.cos(gait*2));
      place(torsos,i,v,0,h*.61+bob,0,1,h*.38/.72,.78);
      place(heads,i*3,v,0,h-.135+bob,.015,.125,.135,.12);
      place(hair,i,v,0,h-.13+bob,.015);
      for(let side=0;side<2;side++){
        const sign=side?1:-1,swing=Math.sin(gait+side*Math.PI),lift=Math.max(0,Math.cos(gait+side*Math.PI))*.085;
        const hip=[sign*.095,h*.43+bob,0],knee=[sign*.10,h*.23+lift*.45,swing*.12+.035],ankle=[sign*.10,.09+lift,swing*.23];
        bone(i*8+side*4,v,hip,knee,.066);bone(i*8+side*4+1,v,knee,ankle,.055);
        const shoulder=[sign*.19,h*.75+bob,0],elbow=[sign*.225,h*.59+bob,-swing*.12],hand=[sign*.23,h*.45+bob,.035-swing*.19];
        bone(i*8+side*4+2,v,shoulder,elbow,.052);bone(i*8+side*4+3,v,elbow,hand,.045);
        place(heads,i*3+side+1,v,hand[0],hand[1],hand[2],.05,.063,.05);
        place(shoes,i*2+side,v,ankle[0],.05+lift,ankle[2]+.045);
      }
    });
    meshes.forEach(mesh=>{mesh.instanceMatrix.needsUpdate=true;});
  }
  update(0);
  return {group,count,update,snapshot:()=>({count,animated:true,elapsedSeconds:clock.snapshot().elapsedSeconds,
    lanes:lanes.map(lane=>({...lane})),positions:visitors.map(v=>v.position.toArray()),drawCalls:meshes.length}),
    dispose:()=>meshes.forEach(mesh=>mesh.dispose())};
}
