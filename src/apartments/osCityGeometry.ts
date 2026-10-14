import * as THREE from 'three';

/** Rounded box with metre-correct radii and normals, independent of aspect ratio.
 * The installed addon derives normals from already-scaled dimensions; thin slabs
 * acquire inverted normals. Start from a unit cube before projecting the fillets.
 */
export class CityRoundedBoxGeometry extends THREE.BufferGeometry {
  constructor(width:number,height:number,depth:number,segments=3,radius=.015) {
    super();
    const count=Math.max(3,segments*2+1),r=Math.min(radius,width/2,height/2,depth/2);
    const source=new THREE.BoxGeometry(1,1,1,count,count,count).toNonIndexed();
    this.copy(source);source.dispose();
    const p=this.getAttribute('position'),n=this.getAttribute('normal');
    const half=new THREE.Vector3(width/2-r,height/2-r,depth/2-r);
    const point=new THREE.Vector3(),normal=new THREE.Vector3(),step=.5/count;
    for(let i=0;i<p.count;i++){
      point.fromBufferAttribute(p,i);
      normal.set(point.x-Math.sign(point.x)*step,point.y-Math.sign(point.y)*step,point.z-Math.sign(point.z)*step).normalize();
      p.setXYZ(i,half.x*Math.sign(point.x)+normal.x*r,half.y*Math.sign(point.y)+normal.y*r,half.z*Math.sign(point.z)+normal.z*r);
      n.setXYZ(i,normal.x,normal.y,normal.z);
    }
    this.computeBoundingBox();this.computeBoundingSphere();
  }
}
