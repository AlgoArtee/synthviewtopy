import * as THREE from 'three';
import { insideCityBalcony } from './osCityLayout';

/** Shift the balcony's view down/up without pitching its architectural verticals.
 * Blend back to ordinary perspective for steep floor/ceiling inspection and
 * through the doorway. Both the actual camera and its inverse use this frustum. */
export function applyCityCameraProjection(camera:THREE.PerspectiveCamera,yaw:number,pitch:number) {
  const terrace=insideCityBalcony(camera.position.x,camera.position.z)
    ?THREE.MathUtils.smoothstep(-camera.position.z,.15,.9):0;
  const correction=terrace*(1-THREE.MathUtils.smoothstep(Math.abs(pitch),.38,.70));
  const renderedPitch=pitch*(1-correction);
  const previous=camera.userData.cityProjection;
  if(previous&&previous.yaw===yaw&&previous.pitch===pitch&&previous.correction===correction
    &&previous.fov===camera.fov&&previous.aspect===camera.aspect&&previous.near===camera.near&&previous.far===camera.far
    &&camera.rotation.x===renderedPitch&&camera.rotation.y===yaw&&camera.rotation.z===0)return previous;
  camera.rotation.set(renderedPitch,yaw,0,'YXZ');
  camera.updateProjectionMatrix();
  const verticalShift=Math.tan(pitch-renderedPitch)/Math.tan(THREE.MathUtils.degToRad(camera.fov*.5));
  camera.projectionMatrix.elements[9]=verticalShift;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  return camera.userData.cityProjection={yaw,pitch,renderedPitch,correction,verticalShift,fov:camera.fov,aspect:camera.aspect,near:camera.near,far:camera.far};
}
