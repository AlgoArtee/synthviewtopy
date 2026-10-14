import assert from 'node:assert/strict';
import { CityRoundedBoxGeometry } from '../src/apartments/osCityGeometry.ts';
for (const [w,h,d,r] of [[2.75,.075,.67,.025],[.49,.69,.052,.005],[2.95,.085,1.65,.04],[.53,.52,.53,.025]]) {
  const g=new CityRoundedBoxGeometry(w,h,d,3,r);const b=g.boundingBox;
  for(const [key,expected]of [['x',w],['y',h],['z',d]]) assert(Math.abs(b.max[key]-b.min[key]-expected)<1e-5,'Rounded geometry must retain metre dimensions');
  const p=g.attributes.position,n=g.attributes.normal;
  for(let i=0;i<p.count;i++)assert(p.getY(i)*n.getY(i)>=-1e-7,'Top/bottom surface normals must face outward');
  g.dispose();
}
console.log('PASS: thin furniture and wall panels retain dimensions and outward normals');
