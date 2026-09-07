import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { setMetricUVs } from './roomMaterials';
import { createBed, createChesterfield, createCoffeeTable, createReadingChair, type FurnitureMaterials } from './realisticFurniture';

/** Structural design families. Room colours are still supplied by its individual palette.
 * References: DesignCafe, Living Room Interior Styles; Decorilla, Interior Design Styles 101.
 * These are newly authored meshes, not copies of furniture pictured in either guide.
 */
export type FurnitureStyle = 'traditional' | 'deco' | 'modern' | 'nordic' | 'japanese' | 'industrial' | 'organic' | 'space' | 'bohemian' | 'coastal' | 'rustic' | 'gothic';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const spow = (n: number, p: number) => Math.sign(n) * Math.pow(Math.abs(n), p);
const PI = Math.PI;

/** One mesh per material keeps detailed joinery, weaving and seams inexpensive to draw. */
class Builder {
  private parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, rotation = new THREE.Euler(), scale = v(1, 1, 1)) {
    const geometry = g.index ? g.toNonIndexed() : g.clone(); g.dispose();
    geometry.applyMatrix4(new THREE.Matrix4().compose(v(x, y, z), new THREE.Quaternion().setFromEuler(rotation), scale));
    setMetricUVs(geometry);
    for (const key of Object.keys(geometry.attributes)) if (!['position', 'normal', 'uv'].includes(key)) geometry.deleteAttribute(key);
    const list = this.parts.get(m) ?? []; list.push(geometry); this.parts.set(m, list);
  }
  box(m: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, r = .018, ry = 0, rx = 0, rz = 0) {
    // Author normals on a unit cube before applying dimensions. This preserves truly
    // flat tops on thin tables, avoiding the dimensional skew of the library helper.
    const radius = Math.min(r, w / 2, h / 2, d / 2);
    const geometry = new RoundedBoxGeometry(1, 1, 1, Math.min(w, h, d) < .03 ? 1 : 3, .1);
    const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
    for (let i = 0; i < positions.count; i++) positions.setXYZ(i,
      Math.sign(positions.getX(i)) * (w / 2 - radius) + normals.getX(i) * radius,
      Math.sign(positions.getY(i)) * (h / 2 - radius) + normals.getY(i) * radius,
      Math.sign(positions.getZ(i)) * (d / 2 - radius) + normals.getZ(i) * radius);
    this.add(geometry, m, x, y, z, new THREE.Euler(rx, ry, rz));
  }
  sphere(m: THREE.Material, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) {
    this.add(new THREE.SphereGeometry(1, 24, 16), m, x, y, z, new THREE.Euler(), v(sx, sy, sz));
  }
  cylinder(m: THREE.Material, x: number, y: number, z: number, r: number, h: number, top = r, rx = 0, rz = 0, segments = 32) {
    this.add(new THREE.CylinderGeometry(top, r, h, segments), m, x, y, z, new THREE.Euler(rx, 0, rz));
  }
  tube(m: THREE.Material, points: THREE.Vector3[], r = .012, closed = false) {
    const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
    this.add(new THREE.TubeGeometry(curve, Math.max(12, points.length * 5), r, 8, closed), m);
  }
  strut(m: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, radius = .028) {
    const delta = b.clone().sub(a); const geometry = new THREE.CylinderGeometry(radius, radius, delta.length(), 12);
    this.add(geometry, m, ...a.clone().add(b).multiplyScalar(.5).toArray() as [number, number, number], new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(v(0, 1, 0), delta.normalize())));
  }
  lathe(m: THREE.Material, points: [number, number][], x = 0, z = 0, sx = 1, sz = 1) {
    this.add(new THREE.LatheGeometry(points.map(p => new THREE.Vector2(...p)), 48), m, x, 0, z, new THREE.Euler(), v(sx, 1, sz));
  }
  finish(name: string) {
    const group = new THREE.Group(); group.name = name;
    for (const [material, list] of this.parts) {
      const geometry = mergeGeometries(list, false)!; list.forEach(part => part.dispose());
      const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = mesh.receiveShadow = true; group.add(mesh);
    }
    return group;
  }
}

/** Tailored soft cushions with a gently irregular sewn edge. */
function cushionGeometry(w: number, h: number, d: number, phase = 0) {
  const geometry = new THREE.SphereGeometry(1, 40, 22); const pos = geometry.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = spow(pos.getX(i), .4) * w / 2, z = spow(pos.getZ(i), .4) * d / 2;
    const edge = Math.pow(Math.max(Math.abs(x) / (w / 2), Math.abs(z) / (d / 2)), 8);
    const y = spow(pos.getY(i), .78) * h / 2 + Math.sin(x * 31 + z * 23 + phase) * .004 * edge;
    pos.setXYZ(i, x + Math.sin(z * 29 + phase) * .0015, y, z + Math.sin(x * 29) * .0015);
  }
  geometry.computeVertexNormals(); return geometry;
}

function cushion(b: Builder, material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, rx = 0, rz = 0, phase = 0) {
  b.add(cushionGeometry(w, h, d, phase), material, x, y, z, new THREE.Euler(rx, 0, rz));
}

function seam(b: Builder, material: THREE.Material, x: number, y: number, z: number, w: number, d: number) {
  b.tube(material, Array.from({ length: 48 }, (_, i) => { const a = i / 48 * PI * 2; return v(x + spow(Math.cos(a), .42) * w / 2, y, z + spow(Math.sin(a), .42) * d / 2); }), .003, true);
}

function surface(columns: number, rows: number, sample: (u: number, t: number) => THREE.Vector3) {
  const geometry = new THREE.PlaneGeometry(1, 1, columns, rows); const pos = geometry.getAttribute('position'), uv = geometry.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) { const p = sample(uv.getX(i), 1 - uv.getY(i)); pos.setXYZ(i, p.x, p.y, p.z); }
  geometry.computeVertexNormals(); return geometry;
}

function fabricMaterial(source: THREE.Material) {
  const mat = source.clone(); mat.side = THREE.DoubleSide;
  // Preserve velvet dye / world-scale PBR callbacks when giving cloth its own two-sided material.
  mat.onBeforeCompile = source.onBeforeCompile; mat.customProgramCacheKey = source.customProgramCacheKey;
  return mat;
}

function throwCloth(b: Builder, m: THREE.Material, x: number, top: number, width: number, fringe = false) {
  const material = fabricMaterial(m);
  const sample = (u: number, t: number) => {
    const drop = Math.max(0, t - .57) / .43;
    return v(x + (u - .5) * width + Math.sin(t * 7) * .015, top - drop * .27 + Math.sin(u * 32 + t * 3) * .004, .13 - Math.min(t, .57) * 1.04 - Math.sin(drop * PI / 2) * .04);
  };
  b.add(surface(32, 30, sample), material);
  if (fringe) for (let i = 0; i < 22; i++) { const p = sample(i / 21, 1); b.tube(m, [p, p.clone().add(v(.006, -.038, .008))], .002); }
}

function feet(b: Builder, m: THREE.Material, halfWidth: number, height: number, kind: 'tapered' | 'sled' | 'block' = 'tapered') {
  if (kind === 'sled') {
    for (const side of [-1, 1]) {
      const path = [v(side * halfWidth, height, -.34), v(side * halfWidth, .03, -.4), v(side * halfWidth, .03, .36), v(side * halfWidth, height, .33)];
      for (let i = 0; i < path.length - 1; i++) b.strut(m, path[i], path[i + 1], .024);
    }
  } else for (const side of [-1, 1]) for (const zz of [-.34, .33]) {
    if (kind === 'block') b.box(m, side * halfWidth, height / 2, zz, .12, height, .12, .008);
    else b.cylinder(m, side * halfWidth, height / 2, zz, .027, height, .045, zz < 0 ? -.1 : .1, side * .1);
  }
}

/** A bent timber/rattan frame with individually woven strands, seen from every side. */
function wovenFrame(b: Builder, m: FurnitureMaterials, width: number, top: number, dense = false) {
  const hw = width / 2;
  for (const side of [-1, 1]) {
    b.tube(m.walnut, [v(side * hw, .22, -.39), v(side * hw, .66, -.4), v(side * hw, .73, -.18), v(side * hw, .76, .36), v(side * hw, .23, .4)], .033);
    for (let i = 0; i < 14; i++) { const z = -.34 + i / 13 * .68; b.tube(m.walnut, [v(side * hw, .31, z), v(side * (hw + .015), .49, z + .012), v(side * hw, .71, z)], .007); }
    for (let row = 0; row < 7; row++) {
      const yy = .34 + row * .05;
      b.tube(m.walnut, Array.from({ length: 20 }, (_, i) => v(side * (hw + Math.sin(i * PI) * .007), yy + Math.sin(i * 1.9) * .005, -.34 + i / 19 * .68)), .006);
    }
  }
  b.tube(m.walnut, [v(-hw, .3, .4), v(-hw, top - .05, .4), v(0, top + .025, .45), v(hw, top - .05, .4), v(hw, .3, .4)], .031);
  const count = Math.round(width * (dense ? 22 : 15));
  for (let i = 0; i < count; i++) {
    const xx = -hw + .06 + i / (count - 1) * (width - .12);
    b.tube(m.walnut, [v(xx, .33, .42), v(xx + .012, top * .6, .452), v(xx, top - .025, .423)], .007);
  }
  for (let yy = .39; yy < top; yy += .055) b.tube(m.walnut, Array.from({ length: 36 }, (_, i) => v(-hw + .04 + i / 35 * (width - .08), yy + Math.sin(i * 2) * .003, .424 + Math.cos(i * 2) * .007)), .006);
}

function accentPillows(b: Builder, m: FurnitureMaterials, width: number, seat: number, mode: 'quiet' | 'layered' | 'striped' = 'quiet') {
  const half = width / 2;
  if (width > 1.5) {
    cushion(b, m.linen, -half + .46, seat + .27, .08, .4, .13, .43, 1.05, -.2, 2);
    cushion(b, m.burgundy, half - .46, seat + .25, .05, .38, .14, .41, 1.13, .17, 4);
  } else cushion(b, m.burgundy, .1, seat + .18, .02, .33, .13, .3, 1.12, .15, 2);
  if (mode === 'layered') {
    const n = width > 1.5 ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const xx = width > 1.5 ? (i - 1) * .62 : -.16;
      cushion(b, i % 2 ? m.upholstery : m.burgundy, xx, seat + .29 + i * .016, .19, .48, .17, .43, 1.15, (i - 1) * .17, i);
      // A woven border and embroidered diamonds make the layered pillows read as textiles.
      const embroidery = [v(-.12, -.086, 0), v(0, -.086, -.09), v(.12, -.086, 0), v(0, -.086, .09)];
      const rotation = new THREE.Euler(1.15, 0, (i - 1) * .17), origin = v(xx, seat + .29 + i * .016, .19);
      b.tube(m.linen, embroidery.map(point => point.applyEuler(rotation).add(origin)), .0035, true);
    }
  }
  if (mode === 'striped' && width > 1.5) for (const xx of [-half + .4, half - .4]) {
    for (let n = -1; n <= 1; n++) b.box(m.upholstery, xx + n * .08, seat + .26, -.105, .025, .26, .006, .002, 0, -.15);
  }
}

/** Sofa/chair seat fronts face -Z. Width changes module count, not merely object scale. */
function seating(kind: Exclude<FurnitureStyle, 'traditional' | 'gothic'>, m: FurnitureMaterials, chair: boolean) {
  const b = new Builder(); const width = chair ? .96 : 2.96; const hw = width / 2; const count = chair ? 1 : 3;
  const seatMat = kind === 'industrial' ? m.leather : kind === 'coastal' || kind === 'nordic' || kind === 'japanese' ? m.linen : m.upholstery;
  let top = .56;

  if (kind === 'deco') {
    feet(b, m.brass, hw - .16, .21);
    b.box(m.darkWood, 0, .23, 0, width - .12, .16, .9, .07);
    b.box(m.brass, 0, .26, -.01, width - .05, .035, .94, .06);
    b.box(m.upholstery, 0, .4, -.05, width - .08, .22, .91, .09);
    const channels = chair ? 7 : 17;
    for (let i = 0; i < channels; i++) {
      const f = i / (channels - 1), xx = (f - .5) * (width - .16);
      const crown = 1.07 + .19 * Math.sin(f * PI);
      b.box(m.upholstery, xx, (.43 + crown) / 2, .36, (width - .14) / channels + .012, crown - .43, .28, .09, 0, -.035, -(f - .5) * .12);
      b.tube(m.brass, [v(xx, crown - .015, .202), v(xx, crown - .025, .188)], .0035);
    }
    for (const side of [-1, 1]) {
      b.box(m.upholstery, side * (hw - .12), .64, -.01, .23, .56, .94, .11);
      b.tube(m.brass, [v(side * (hw - .11), .4, -.491), v(side * (hw - .11), .75, -.491), v(side * (hw - .11), .84, -.43)], .004);
    }
  } else if (kind === 'modern') {
    b.box(m.darkWood, 0, .1, .015, width - .2, .17, .78, .015);
    b.box(seatMat, 0, .28, 0, width, .27, .99, .065);
    for (let i = 0; i < count; i++) {
      const xx = (i - (count - 1) / 2) * (width - .3) / count;
      b.box(seatMat, xx, .78, .33, (width - .3) / count - .023, .67, .35, .075, 0, -.12);
    }
    for (const side of [-1, 1]) b.box(seatMat, side * (hw - .11), .53, -.03, .22, .56, .94, .045);
  } else if (kind === 'nordic') {
    feet(b, m.walnut, hw - .13, .33);
    b.box(m.walnut, 0, .33, 0, width - .08, .09, .86, .025);
    b.box(m.walnut, 0, .73, .4, width - .12, .61, .08, .025, 0, -.13);
    for (let i = 0; i < count; i++) cushion(b, seatMat, (i - (count - 1) / 2) * (width - .3) / count, .8, .3, (width - .28) / count - .025, .2, .57, PI / 2 - .13, 0, i);
    for (const side of [-1, 1]) {
      b.strut(m.walnut, v(side * (hw - .08), .32, -.34), v(side * (hw - .08), .68, -.34), .025);
      b.box(m.walnut, side * (hw - .06), .7, -.005, .12, .055, .85, .02);
    }
  } else if (kind === 'japanese') {
    top = .4;
    b.box(m.darkWood, 0, .075, 0, width - .15, .15, .8, .008);
    for (let i = 0; i < 8; i++) b.box(m.walnut, 0, .19, -.42 + i * .12, width, .08, .105, .008);
    for (const side of [-1, 1]) b.box(m.walnut, side * (hw - .055), .385, 0, .11, .33, .91, .012);
    const slats = Math.ceil(width / .13);
    for (let i = 0; i < slats; i++) b.box(m.walnut, -hw + .1 + i / (slats - 1) * (width - .2), .58, .4, .067, .67, .055, .008, 0, -.14);
    for (let i = 0; i < count; i++) cushion(b, m.linen, (i - (count - 1) / 2) * (width - .25) / count, .58, .27, (width - .28) / count - .035, .15, .41, PI / 2 - .13, 0, i);
  } else if (kind === 'industrial') {
    feet(b, m.iron, hw - .085, .35, 'sled');
    b.box(m.iron, 0, .32, 0, width, .1, .9, .015);
    b.box(m.leather, 0, .42, -.02, width - .13, .24, .86, .036);
    for (const side of [-1, 1]) {
      b.tube(m.iron, [v(side * (hw - .05), .35, -.38), v(side * (hw - .05), .72, -.38), v(side * (hw - .05), .76, .35), v(side * (hw - .05), .33, .35)], .026);
      b.box(m.leather, side * (hw - .1), .74, -.035, .17, .105, .75, .04);
      for (let i = 0; i < 5; i++) b.sphere(m.brass, side * (hw - .033), .37 + i * .08, -.4, .007);
    }
    for (let i = 0; i < count; i++) cushion(b, m.leather, (i - (count - 1) / 2) * (width - .3) / count, .83, .3, (width - .32) / count - .026, .2, .65, PI / 2 - .09, 0, i);
  } else if (kind === 'organic') {
    top = .57;
    b.sphere(m.darkWood, 0, .13, .04, hw - .12, .12, .37);
    b.box(seatMat, 0, .35, -.02, width - .05, .35, .93, .17);
    // A single smoothly swept crescent back flows into both arms.
    const path = Array.from({ length: 20 }, (_, i) => {
      const t = i / 19, xx = (t - .5) * (width - .34);
      return v(xx, .83 - .22 * Math.pow(Math.abs(t - .5) * 2, 4), .29 - .36 * Math.pow(Math.abs(t - .5) * 2, 4));
    });
    b.tube(seatMat, path, chair ? .18 : .205);
    for (const end of [path[0], path[path.length - 1]]) b.sphere(seatMat, end.x, end.y, end.z, chair ? .18 : .205);
    b.box(seatMat, 0, .64, .32, width - .53, .42, .3, .14);
  } else if (kind === 'space') {
    top = .58;
    b.lathe(m.iron, [[0, .02], [.3, .02], [.34, .06], [.18, .14], [.09, .29], [.3, .36], [0, .37]], 0, .02, chair ? 1 : 2.4, 1);
    b.box(m.ceramic, 0, .4, 0, width, .24, .97, .11);
    b.box(m.ceramic, 0, .73, .34, width - .08, .76, .31, .145, 0, -.07);
    for (const side of [-1, 1]) b.tube(m.ceramic, [v(side * (hw - .1), .45, -.4), v(side * (hw - .1), .75, -.3), v(side * (hw - .14), .91, .04), v(side * (hw - .14), 1.04, .3)], .09);
    for (let i = 0; i < count; i++) cushion(b, seatMat, (i - (count - 1) / 2) * (width - .34) / count, .8, .175, (width - .32) / count - .024, .18, .55, PI / 2 - .1, 0, i);
    b.tube(m.brass, [v(-hw + .08, .39, -.48), v(0, .355, -.49), v(hw - .08, .39, -.48)], .005);
  } else if (kind === 'bohemian') {
    feet(b, m.walnut, hw - .08, .27, 'block');
    b.box(m.walnut, 0, .29, 0, width - .03, .13, .89, .023);
    wovenFrame(b, m, width - .055, chair ? 1.35 : 1.09, true);
    b.box(m.burgundy, 0, .37, -.025, width - .19, .12, .86, .04);
    top = .55;
    for (let i = 0; i < count; i++) cushion(b, m.linen, (i - (count - 1) / 2) * (width - .25) / count, .76, .28, (width - .27) / count - .028, .16, .5, PI / 2 - .1, 0, i);
  } else if (kind === 'coastal') {
    feet(b, m.walnut, hw - .085, .3, 'block');
    b.box(m.walnut, 0, .31, 0, width, .115, .9, .025);
    for (const side of [-1, 1]) {
      b.box(m.walnut, side * (hw - .055), .56, -.34, .105, .57, .105, .016);
      b.box(m.walnut, side * (hw - .055), .745, -.03, .11, .06, .88, .014);
      for (let row = 0; row < 6; row++) b.strut(m.linen, v(side * (hw - .055), .39 + row * .048, -.3), v(side * (hw - .055), .39 + row * .048, .36), .006);
    }
    const slats = Math.ceil(width / .18);
    for (let i = 0; i < slats; i++) b.box(m.walnut, -hw + .09 + i / (slats - 1) * (width - .18), .77, .39, .1, .84, .07, .01);
    for (let i = 0; i < count; i++) cushion(b, seatMat, (i - (count - 1) / 2) * (width - .3) / count, .83, .27, (width - .3) / count - .028, .18, .6, PI / 2 - .08, 0, i);
  } else {
    // Pegged mortise-and-tenon frame: large exposed members establish the rustic silhouette.
    top = .59;
    feet(b, m.walnut, hw - .1, .37, 'block');
    for (const zz of [-.37, .36]) b.box(m.walnut, 0, .34, zz, width, .18, .15, .008);
    for (const side of [-1, 1]) {
      b.box(m.walnut, side * (hw - .07), .57, -.35, .14, .62, .15, .007);
      b.box(m.walnut, side * (hw - .07), .77, 0, .16, .14, .94, .012);
      b.box(m.walnut, side * (hw - .07), .77, .35, .14, 1.02, .15, .007);
      b.cylinder(m.darkWood, side * (hw - .07), .65, -.433, .018, .012, .018, PI / 2);
    }
    for (let row = 0; row < 3; row++) b.box(m.walnut, 0, .69 + row * .2, .36, width - .21, .16, .09, .009);
    for (let i = 0; i < count; i++) cushion(b, m.linen, (i - (count - 1) / 2) * (width - .32) / count, .84, .25, (width - .32) / count - .04, .19, .57, PI / 2 - .1, 0, i);
  }

  // The organic design uses one continuous bench; the others have individually piped seats.
  const seatCount = kind === 'organic' ? 1 : count;
  const innerWidth = width - (kind === 'space' ? .3 : kind === 'deco' ? .46 : .27);
  for (let i = 0; i < seatCount; i++) {
    const ww = innerWidth / seatCount - .022, xx = (i - (seatCount - 1) / 2) * innerWidth / seatCount;
    cushion(b, seatMat, xx, top - .08, -.095, ww, .19, .73, 0, 0, i);
    seam(b, kind === 'industrial' ? m.leather : seatMat, xx, top - .08, -.095, ww - .008, .724);
  }
  if (kind === 'bohemian') { accentPillows(b, m, width, top, 'layered'); throwCloth(b, m.linen, chair ? 0 : -.75, top + .015, chair ? .35 : .56, true); }
  else if (kind === 'coastal') accentPillows(b, m, width, top, 'striped');
  else if (kind === 'nordic' || kind === 'rustic') { accentPillows(b, m, width, top); if (!chair) throwCloth(b, m.linen, .62, top + .013, .51, true); }
  else if (kind === 'organic') cushion(b, m.burgundy, chair ? 0 : .45, top + .17, -.12, chair ? .33 : .51, .15, .29, .9, -.08);
  else if (kind !== 'space' && kind !== 'japanese' && kind !== 'industrial') accentPillows(b, m, width, top);
  const name = {deco: 'Channelled scallop', modern: 'Low modular', nordic: 'Open timber Nordic', japanese: 'Low slatted Japanese', industrial: 'Steel sled and leather', organic: 'Sculpted crescent', space: 'Moulded pedestal pod', bohemian: 'Woven rattan and layered textile', coastal: 'Rope-strung coastal', rustic: 'Pegged solid timber'}[kind];
  const result = b.finish(`${name} ${chair ? 'reading chair' : 'sofa'}`);
  result.userData.furnitureStyle = kind; return result;
}

export function createStyleSofa(kind: FurnitureStyle, m: FurnitureMaterials) {
  if (kind === 'traditional') return createChesterfield(m);
  if (kind === 'gothic') {
    const group = createChesterfield(m); const b = new Builder();
    for (let i = 0; i < 5; i++) { const xx = (i - 2) * .55; b.tube(m.darkWood, [v(xx - .21, 1.2, .38), v(xx - .16, 1.32, .38), v(xx, 1.46, .38), v(xx + .16, 1.32, .38), v(xx + .21, 1.2, .38)], .028); }
    group.add(b.finish('Pointed carved tracery crest')); group.name = 'Gothic carved Chesterfield'; return group;
  }
  return seating(kind, m, false);
}

export function createStyleChair(kind: FurnitureStyle, m: FurnitureMaterials) {
  if (kind === 'traditional') return createReadingChair(m);
  if (kind === 'gothic') {
    const group = createReadingChair(m); const b = new Builder();
    b.tube(m.darkWood, [v(-.39, 1.21, .41), v(-.3, 1.46, .4), v(0, 1.71, .39), v(.3, 1.46, .4), v(.39, 1.21, .41)], .035);
    for (const side of [-1, 1]) b.strut(m.walnut, v(side * .39, .29, .4), v(side * .39, 1.4, .4), .024);
    group.add(b.finish('Pointed oak reading-chair crest')); group.name = 'Gothic high-back reading chair'; return group;
  }
  return seating(kind, m, true);
}

/** All table tops meet the existing tea tray at y=.502, with a 1.75 × .95 m envelope. */
export function createStyleCoffeeTable(kind: FurnitureStyle, m: FurnitureMaterials) {
  if (kind === 'traditional') return createCoffeeTable(m);
  const b = new Builder();
  if (kind === 'deco') {
    b.box(m.darkWood, 0, .04, 0, 1.3, .08, .66, .1);
    for (const side of [-1, 1]) {
      for (let n = 0; n < 3; n++) b.box(n === 1 ? m.brass : m.walnut, side * .49, .11 + n * .106, 0, .3 - n * .045, .115, .49 - n * .04, .012);
    }
    b.box(m.brass, 0, .455, 0, 1.75, .055, .95, .15);
    b.box(m.ceramic, 0, .488, 0, 1.67, .028, .87, .13);
    seam(b, m.brass, 0, .505, 0, 1.56, .77);
  } else if (kind === 'modern') {
    for (const xx of [-.59, .59]) b.box(m.iron, xx, .235, 0, .055, .47, .73, .009);
    b.box(m.ceramic, 0, .47, 0, 1.75, .064, .95, .034);
  } else if (kind === 'nordic') {
    // Visibly open, splayed tripod base under a softly shaped top.
    for (const [xx, zz] of [[-.66, -.29], [.66, -.24], [.1, .32]]) b.strut(m.walnut, v(xx * 1.08, .03, zz * 1.1), v(xx * .68, .46, zz * .7), .043);
    b.box(m.walnut, 0, .468, 0, 1.75, .068, .95, .19);
    b.box(m.darkWood, 0, .437, 0, 1.57, .025, .78, .15);
  } else if (kind === 'japanese') {
    for (const xx of [-.63, .63]) b.box(m.walnut, xx, .22, 0, .1, .44, .66, .008);
    b.box(m.darkWood, 0, .205, .02, 1.4, .075, .075, .005);
    for (let n = 0; n < 6; n++) b.box(m.walnut, 0, .468, -.398 + n * .159, 1.75, .068, .15, .008);
  } else if (kind === 'industrial') {
    for (const xx of [-.66, .66]) {
      const path = [v(xx, .435, -.33), v(xx, .032, -.33), v(xx, .032, .33), v(xx, .435, .33)];
      for (let i = 0; i < path.length - 1; i++) b.strut(m.iron, path[i], path[i + 1], .029);
    }
    b.strut(m.iron, v(-.66, .09, .29), v(.66, .4, .29), .013);
    b.strut(m.iron, v(-.66, .4, .29), v(.66, .09, .29), .013);
    for (const zz of [-.32, 0, .32]) b.box(m.walnut, 0, .456, zz, 1.75, .092, .309, .009);
    for (const xx of [-.73, .73]) for (const zz of [-.34, .34]) b.cylinder(m.iron, xx, .504, zz, .012, .008);
  } else if (kind === 'organic') {
    const outline = new THREE.Shape(); outline.moveTo(-.8, -.16);
    outline.bezierCurveTo(-.8, -.56, -.09, -.48, .12, -.37); outline.bezierCurveTo(.4, -.49, .84, -.32, .85, .0); outline.bezierCurveTo(.83, .43, .23, .45, -.01, .3); outline.bezierCurveTo(-.39, .52, -.85, .28, -.8, -.16);
    b.add(new THREE.ExtrudeGeometry(outline, {depth: .058, bevelEnabled: true, bevelSize: .012, bevelThickness: .007, bevelSegments: 3, curveSegments: 28, steps: 1}), m.walnut, 0, .436, 0, new THREE.Euler(-PI / 2, 0, 0));
    for (const [xx, zz] of [[-.46, -.13], [.48, -.05], [.02, .25]]) b.lathe(m.walnut, [[0, .025], [.1, .025], [.08, .1], [.055, .26], [.1, .44], [0, .44]], xx, zz);
  } else if (kind === 'space') {
    b.lathe(m.ceramic, [[0, .01], [.42, .01], [.45, .05], [.36, .08], [.13, .2], [.085, .29], [.17, .43], [0, .455]], 0, 0, 1.5, 1);
    b.box(m.ceramic, 0, .472, 0, 1.75, .06, .95, .22);
    seam(b, m.brass, 0, .48, 0, 1.73, .934);
  } else if (kind === 'bohemian') {
    b.cylinder(m.walnut, 0, .215, 0, .41, .39, .37);
    for (let i = 0; i < 42; i++) { const a = i / 42 * PI * 2; b.tube(m.walnut, [v(Math.cos(a) * .4, .04, Math.sin(a) * .4), v(Math.cos(a + .1) * .39, .22, Math.sin(a + .1) * .39), v(Math.cos(a) * .37, .41, Math.sin(a) * .37)], .009); }
    for (const yy of [.08, .16, .24, .32, .4]) b.tube(m.linen, Array.from({length: 64}, (_, i) => {const a = i / 64 * PI * 2; return v(Math.cos(a) * .405, yy, Math.sin(a) * .405);}), .005, true);
    b.box(m.walnut, 0, .469, 0, 1.75, .066, .95, .18);
    seam(b, m.brass, 0, .505, 0, 1.6, .8);
  } else if (kind === 'coastal') {
    for (const side of [-1, 1]) {
      b.strut(m.walnut, v(side * .68, .04, -.33), v(side * .6, .44, .33), .042);
      b.strut(m.walnut, v(side * .68, .04, .33), v(side * .6, .44, -.33), .042);
      for (let i = 0; i < 8; i++) b.tube(m.linen, [v(side * .62 - .018, .195 + i * .009, -.09), v(side * .62 + .045, .195 + i * .009, 0), v(side * .62 - .018, .195 + i * .009, .09)], .004);
    }
    for (let i = 0; i < 5; i++) b.box(m.walnut, -.696 + i * .348, .462, 0, .338, .08, .95, .014);
  } else if (kind === 'rustic') {
    for (const xx of [-.57, .57]) b.box(m.walnut, xx, .2, 0, .16, .4, .69, .007);
    b.box(m.walnut, 0, .15, 0, 1.45, .14, .14, .005);
    for (const xx of [-.7, .7]) b.cylinder(m.darkWood, xx, .15, .081, .027, .02, .027, PI / 2);
    for (const zz of [-.31, 0, .31]) b.box(m.walnut, 0, .435, zz, 1.75, .134, .305, .007);
  } else {
    for (const xx of [-.64, .64]) {
      b.box(m.darkWood, xx, .25, 0, .095, .46, .63, .008);
      b.tube(m.walnut, [v(xx, .11, -.31), v(xx, .26, -.17), v(xx, .39, 0), v(xx, .26, .17), v(xx, .11, .31)], .025);
    }
    b.box(m.walnut, 0, .463, 0, 1.75, .078, .95, .025);
    seam(b, m.brass, 0, .505, 0, 1.59, .8);
  }
  const group = b.finish(`${kind} occasional table`); group.userData.furnitureStyle = kind; return group;
}

/** Common tailored bedding is draped over very different frames, at the same walkable footprint. */
function bedding(b: Builder, m: FurnitureMaterials, low: boolean, layered: boolean) {
  const drop = low ? .16 : 0;
  cushion(b, m.linen, 0, .607 - drop, 0, 2.04, .27, 2.83);
  seam(b, m.linen, 0, .61 - drop, 0, 2.035, 2.825);
  const height = (x: number, z: number) => {
    const side = THREE.MathUtils.smoothstep(Math.max(0, Math.abs(x) - .98) / .185, 0, 1) * .3;
    const foot = THREE.MathUtils.smoothstep(Math.max(0, z - 1.36) / .33, 0, 1) * .32;
    return .785 - drop - Math.max(side, foot) - Math.min(side, foot) * .05 + Math.sin(x * 14 + z * 3) * .006 + Math.sin(x * 29 - z * 5) * .002;
  };
  const cloth = fabricMaterial(m.teal);
  b.add(surface(72, 82, (u, t) => { const x = (u - .5) * 2.33, z = -.72 + t * 2.41; return v(x, height(x, z), z); }), cloth);
  b.add(surface(60, 20, (u, t) => { const x = (u - .5) * 2.05, z = -.77 + t * .36; return v(x, height(x, z) + .018 + Math.sin(t * PI) * .018, z); }), fabricMaterial(m.linen));
  for (const side of [-1, 1]) cushion(b, m.linen, side * .49, .846 - drop, -1.019, .88, .19, .54, -.09, side * -.018, side);
  const runner = fabricMaterial(m.burgundy);
  b.add(surface(68, 26, (u, t) => { const x = (u - .5) * 2.3, z = .72 + t * .54 + Math.sin(x * 2) * .015; return v(x, height(x, z) + .012 + Math.sin(x * 21 + t * 3) * .0015, z); }), runner);
  if (layered) {
    for (const side of [-1, 1]) cushion(b, m.burgundy, side * .43, .95 - drop, -.76, .5, .17, .49, .85, side * .12, side);
    for (let i = 0; i < 35; i++) { const x = -.99 + i / 34 * 1.98; b.tube(m.linen, [v(x, height(x, 1.29) + .014, 1.29), v(x + .008, height(x, 1.29) + .004, 1.345)], .002); }
  }
}

/** Bed head is -Z, mattress 2.04 × 2.83 m, cloth ±1.165 × [-1.5, 1.69]. */
export function createStyleBed(kind: FurnitureStyle, m: FurnitureMaterials) {
  if (kind === 'traditional') return createBed(m);
  const b = new Builder(); const low = kind === 'japanese' || kind === 'modern'; const level = low ? .16 : 0;
  const structural = kind === 'space' ? m.ceramic : kind === 'industrial' ? m.iron : m.walnut;
  if (kind === 'japanese') {
    b.box(m.darkWood, 0, .09, 0, 1.91, .18, 2.74, .005);
    for (let i = 0; i < 15; i++) b.box(m.walnut, 0, .239, -1.42 + i * .202, 2.24, .12, .19, .006);
    for (let i = 0; i < 19; i++) b.box(m.walnut, -1.08 + i * .12, .83, -1.41, .063, 1.1, .08, .008);
    b.box(m.walnut, 0, 1.42, -1.41, 2.26, .07, .1, .008);
  } else if (kind === 'modern') {
    b.box(m.darkWood, 0, .12, 0, 1.91, .24, 2.65, .017);
    b.box(m.upholstery, 0, .28, 0, 2.22, .2, 3.03, .065);
    b.box(m.upholstery, 0, .94, -1.395, 2.26, 1.35, .2, .06);
    for (const xx of [-.565, .565]) b.box(m.upholstery, xx, .99, -1.272, 1.105, 1.1, .07, .04);
  } else if (kind === 'space') {
    b.box(m.iron, 0, .13, 0, 1.66, .26, 2.49, .09);
    b.box(m.ceramic, 0, .365, 0, 2.22, .24, 3.04, .11);
    b.box(m.ceramic, 0, 1.02, -1.365, 2.26, 1.48, .27, .13);
    b.box(m.upholstery, 0, 1.07, -1.209, 1.99, 1.12, .12, .14);
    b.tube(m.brass, [v(-1.03, .5, 1.51), v(0, .485, 1.54), v(1.03, .5, 1.51)], .008);
    for (const xx of [-.67, 0, .67]) b.box(m.ceramic, xx, 1.59, -1.2, .015, .05, .015, .005);
  } else {
    for (const xx of [-.98, .98]) for (const zz of [-1.3, 1.29]) {
      if (kind === 'deco') b.cylinder(m.brass, xx, .145, zz, .045, .29, .06);
      else b.box(structural, xx, .165, zz, kind === 'rustic' ? .14 : .09, .33, kind === 'rustic' ? .14 : .09, .01);
    }
    b.box(structural, 0, .355, 0, 2.2, .22, 3, kind === 'organic' ? .1 : .02);
    if (kind === 'deco') {
      for (let i = 0; i < 11; i++) {
        const xx = (i - 5) * .204, top = 1.51 + .35 * Math.sin(i / 10 * PI);
        b.box(m.upholstery, xx, (.38 + top) / 2, -1.375, .215, top - .38, .22, .1);
        b.tube(m.brass, [v(xx, top - .018, -1.251), v(xx + .005, top - .045, -1.249)], .004);
      }
      b.box(m.brass, 0, .48, 1.493, 2.18, .035, .022, .008);
    } else if (kind === 'nordic') {
      b.box(m.walnut, 0, .99, -1.42, 2.25, 1.17, .12, .04);
      for (const xx of [-.54, .54]) cushion(b, m.linen, xx, 1.14, -1.297, 1.03, .16, .72, PI / 2, 0, xx);
      b.box(m.walnut, 0, .55, -1.335, 2.25, .07, .12, .012);
    } else if (kind === 'industrial') {
      for (const xx of [-1.03, 1.03]) b.box(m.iron, xx, 1.0, -1.41, .065, 1.64, .065, .01);
      for (const yy of [.55, 1.67]) b.box(m.iron, 0, yy, -1.41, 2.13, .065, .065, .01);
      for (let i = 0; i < 4; i++) {
        b.box(m.walnut, 0, .75 + i * .247, -1.406, 1.99, .22, .065, .009);
        for (const xx of [-.9, .9]) b.cylinder(m.iron, xx, .75 + i * .247, -1.363, .012, .015, .012, PI / 2);
      }
    } else if (kind === 'organic') {
      b.box(m.upholstery, 0, .4, 0, 2.2, .24, 3, .11);
      const head = new THREE.Shape(); head.moveTo(-1.07, .4); head.lineTo(1.07, .4); head.lineTo(1.07, 1.48);
      head.bezierCurveTo(1.07, 1.7, .84, 1.8, .54, 1.71);
      head.bezierCurveTo(.17, 2.04, -.96, 1.99, -1.07, 1.61); head.lineTo(-1.07, .4); head.closePath();
      b.add(new THREE.ExtrudeGeometry(head, {depth: .17, bevelEnabled: true, bevelSize: .045, bevelThickness: .035, bevelSegments: 5, curveSegments: 40, steps: 1}), m.upholstery, 0, 0, -1.465);
    } else if (kind === 'bohemian') {
      const arc = Array.from({length: 50}, (_, i) => { const a = i / 49 * PI; return v(Math.cos(a) * 1.08, .62 + Math.sin(a) * 1.17, -1.413); });
      b.tube(m.walnut, arc, .035);
      b.box(m.walnut, 0, .6, -1.41, 2.16, .07, .07, .015);
      for (let i = 0; i < 37; i++) { const a = i / 36 * PI; b.strut(m.walnut, v(0, .64, -1.41), v(Math.cos(a) * 1.045, .62 + Math.sin(a) * 1.145, -1.41), .009); }
      for (const f of [.35, .54, .72, .89]) b.tube(m.linen, Array.from({length: 42}, (_, i) => {const a = i / 41 * PI; return v(Math.cos(a) * 1.08 * f, .62 + Math.sin(a) * 1.17 * f, -1.387);}), .006);
    } else if (kind === 'coastal') {
      for (const xx of [-1.04, 1.04]) b.box(m.walnut, xx, .99, -1.41, .12, 1.46, .12, .016);
      for (let row = 0; row < 5; row++) b.box(m.walnut, 0, .64 + row * .215, -1.41, 2.11, .15, .065, .012);
      for (const xx of [-1.04, 1.04]) for (let row = 0; row < 10; row++) b.tube(m.linen, [v(xx - .06, 1.49 + row * .011, -1.48), v(xx + .07, 1.49 + row * .011, -1.48), v(xx + .07, 1.49 + row * .011, -1.34), v(xx - .06, 1.49 + row * .011, -1.34)], .003, true);
    } else if (kind === 'rustic') {
      for (const xx of [-1.04, 1.04]) b.box(m.walnut, xx, .91, -1.4, .16, 1.67, .17, .008);
      for (let row = 0; row < 4; row++) {
        b.box(m.walnut, 0, .72 + row * .24, -1.4, 2.11, .23, .13, .008);
        for (const xx of [-.9, .9]) b.cylinder(m.darkWood, xx, .72 + row * .24, -1.322, .018, .013, .018, PI / 2);
      }
    } else {
      // Tall lancet headboard keeps the Gothic family distinct from traditional upholstery.
      for (const xx of [-1.05, 1.05]) {
        b.box(m.darkWood, xx, .94, -1.41, .12, 1.83, .12, .008);
        b.sphere(m.brass, xx, 1.9, -1.41, .055, .095, .055);
      }
      b.box(m.walnut, 0, .88, -1.415, 2.09, 1.12, .08, .009);
      for (let i = 0; i < 3; i++) {
        const xx = (i - 1) * .64;
        b.box(m.upholstery, xx, 1.07, -1.349, .55, .88, .065, .03);
        b.tube(m.walnut, [v(xx - .29, .61, -1.293), v(xx - .29, 1.38, -1.293), v(xx - .17, 1.66, -1.293), v(xx, 1.87, -1.293), v(xx + .17, 1.66, -1.293), v(xx + .29, 1.38, -1.293), v(xx + .29, .61, -1.293)], .029);
      }
    }
  }
  b.box(m.darkWood, 0, .476 - level, 0, 2.12, .05, 2.96, .015);
  bedding(b, m, low, kind === 'bohemian' || kind === 'coastal');
  const group = b.finish(`${kind} bed with continuous tailored bedding`); group.userData.furnitureStyle = kind; return group;
}
