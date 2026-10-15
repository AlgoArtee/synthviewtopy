import * as THREE from 'three';

/** First-person free look uses one centered perspective at every angle/location.
 * A shifted, level architectural camera cannot be blended with head rotation:
 * it changes foreshortening and apparent scale while the player is looking around. */
export function applyCityCameraProjection(camera:THREE.PerspectiveCamera,yaw:number,pitch:number) {
  const previous=camera.userData.cityProjection;
  if(previous?.mode==='perspective'&&previous.yaw===yaw&&previous.pitch===pitch
    &&previous.fov===camera.fov&&previous.aspect===camera.aspect&&previous.near===camera.near&&previous.far===camera.far
    &&previous.zoom===camera.zoom&&camera.projectionMatrix.elements[9]===0
    &&camera.rotation.order==='YXZ'&&camera.rotation.x===pitch&&camera.rotation.y===yaw&&camera.rotation.z===0)return previous;
  camera.rotation.set(pitch,yaw,0,'YXZ');
  camera.updateProjectionMatrix();
  return camera.userData.cityProjection={mode:'perspective',yaw,pitch,renderedPitch:pitch,correction:0,verticalShift:0,
    fov:camera.fov,aspect:camera.aspect,near:camera.near,far:camera.far,zoom:camera.zoom};
}
