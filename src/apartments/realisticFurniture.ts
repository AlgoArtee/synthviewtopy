import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { setMetricUVs } from './roomMaterials';

/** Materials are supplied by the room so authored meshes share its scanned PBR palette. */
export interface FurnitureMaterials {
  walnut: THREE.Material; darkWood: THREE.Material; brass: THREE.Material; iron: THREE.Material;
  upholstery: THREE.Material; leather: THREE.Material; linen: THREE.Material; teal: THREE.Material;
  burgundy: THREE.Material; ceramic: THREE.Material; paper: THREE.Material; black: THREE.Material;
  luminous: THREE.Material;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const signedPow = (x: number, power: number) => Math.sign(x) * Math.pow(Math.abs(x), power);

/** Merge detail by material: upholstery buttons and hardware don't add hundreds of draw calls. */
class FurnitureBuilder {
  private parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0, rotation = new THREE.Euler(), scale = v(1, 1, 1)) {
    const matrix = new THREE.Matrix4().compose(v(x, y, z), new THREE.Quaternion().setFromEuler(rotation), scale);
    const transformed = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    geometry.dispose(); transformed.applyMatrix4(matrix);
    // Every vertex is now in local metres, including deformed cloth and scaled lathe surfaces.
    // Screen glass preserves its authored UVs for its readable phosphor display.
    if (!(material instanceof THREE.MeshStandardMaterial && material.emissiveMap)) setMetricUVs(transformed);
    for (const name of Object.keys(transformed.attributes)) if (!['position', 'normal', 'uv'].includes(name)) transformed.deleteAttribute(name);
    if (!this.parts.has(material)) this.parts.set(material, []);
    this.parts.get(material)!.push(transformed);
  }
  rounded(mat: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, radius = 0.012, ry = 0, rx = 0, rz = 0) {
    this.add(new RoundedBoxGeometry(w, h, d, Math.min(w, h, d) < 0.035 ? 1 : 3, Math.min(radius, w / 2, h / 2, d / 2)), mat, x, y, z, new THREE.Euler(rx, ry, rz));
  }
  sphere(mat: THREE.Material, x: number, y: number, z: number, rx: number, ry = rx, rz = rx) { this.add(new THREE.SphereGeometry(1, rx < 0.015 ? 10 : 20, rx < 0.015 ? 7 : 12), mat, x, y, z, new THREE.Euler(), v(rx, ry, rz)); }
  lathe(mat: THREE.Material, points: [number, number][], x = 0, y = 0, z = 0, sx = 1, sz = 1) {
    this.add(new THREE.LatheGeometry(points.map(p => new THREE.Vector2(...p)), 64), mat, x, y, z, new THREE.Euler(), v(sx, 1, sz));
  }
  tube(mat: THREE.Material, points: THREE.Vector3[], radius = 0.008, closed = false) {
    this.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed, 'centripetal'), Math.max(20, points.length * 9), radius, 7, closed), mat);
  }
  cylinder(mat: THREE.Material, x: number, y: number, z: number, radius: number, height: number, top = radius, rx = 0, rz = 0) {
    this.add(new THREE.CylinderGeometry(top, radius, height, 24), mat, x, y, z, new THREE.Euler(rx, 0, rz));
  }
  ring(mat: THREE.Material, x: number, y: number, z: number, radius: number, tube: number, rx = 0, ry = 0, sx = 1, sy = 1) {
    this.add(new THREE.TorusGeometry(radius, tube, 8, 64), mat, x, y, z, new THREE.Euler(rx, ry, 0), v(sx, sy, 1));
  }
  finish(name: string) {
    const group = new THREE.Group(); group.name = name;
    for (const [material, parts] of this.parts) {
      const geometry = mergeGeometries(parts, false)!;
      parts.forEach(part => part.dispose());
      const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
    }
    return group;
  }
}

function gridGeometry(columns: number, rows: number, point: (u: number, v: number) => THREE.Vector3) {
  const geometry = new THREE.PlaneGeometry(1, 1, columns, rows);
  const positions = geometry.getAttribute('position'); const uvs = geometry.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) { const p = point(uvs.getX(i), 1 - uvs.getY(i)); positions.setXYZ(i, p.x, p.y, p.z); }
  geometry.computeVertexNormals(); return geometry;
}

function reverseWinding(geometry: THREE.BufferGeometry) {
  const index = geometry.getIndex()!;
  for (let i = 0; i < index.count; i += 3) { const a = index.getX(i); index.setX(i, index.getX(i + 2)); index.setX(i + 2, a); }
  geometry.computeVertexNormals(); return geometry;
}

/** A sewn, stuffed cushion, not a beveled rectangular block. */
function pillowGeometry(w: number, h: number, d: number, phase = 0) {
  const geometry = new THREE.SphereGeometry(1, 56, 28);
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const ox = positions.getX(i); const oy = positions.getY(i); const oz = positions.getZ(i);
    let x = signedPow(ox, 0.42) * w / 2; let y = signedPow(oy, 0.78) * h / 2; let z = signedPow(oz, 0.42) * d / 2;
    const edge = Math.pow(Math.max(Math.abs(x) / (w / 2), Math.abs(z) / (d / 2)), 8);
    y += Math.sin(x * 37 + z * 22 + phase) * 0.006 * edge + Math.sin(z * 59 - x * 23) * 0.003 * edge;
    x += Math.sin(z * 28 + phase) * 0.0025; z += Math.sin(x * 31) * 0.003;
    positions.setXYZ(i, x, y, z);
  }
  geometry.computeVertexNormals(); return geometry;
}

function piping(builder: FurnitureBuilder, mat: THREE.Material, x: number, y: number, z: number, w: number, d: number, radius = 0.004) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 80; i++) { const a = i / 80 * Math.PI * 2; points.push(v(x + signedPow(Math.cos(a), 0.42) * w / 2, y, z + signedPow(Math.sin(a), 0.42) * d / 2)); }
  builder.tube(mat, points, radius, true);
}

function turnedLeg(builder: FurnitureBuilder, m: FurnitureMaterials, x: number, z: number, height: number, radius = 0.055) {
  const profile: [number, number][] = [[0, 0], [radius * 0.7, 0], [radius * 0.85, 0.04], [radius * 0.7, height * 0.25], [radius * 0.45, height * 0.48], [radius * 0.6, height * 0.58], [radius, height * 0.65], [radius, height * 0.73], [radius * 0.78, height * 0.8], [radius * 0.85, height], [0, height]];
  builder.lathe(m.walnut, profile, x, 0, z);
  builder.cylinder(m.brass, x, 0.02, z, radius * 0.72, 0.027);
}

function tuftedPanel(builder: FurnitureBuilder, m: FurnitureMaterials, width: number, height: number, x: number, y: number, z: number, columns: number, rows: number) {
  const buttons: { x: number; y: number }[] = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    buttons.push({ x: -width / 2 + (col + 0.5 + (row % 2) * 0.4) / columns * width * 0.95, y: -height / 2 + (row + 0.5) / rows * height });
  }
  const surface = (xx: number, yy: number) => {
    let displacement = -0.07 * Math.pow(Math.max(0, 1 - (xx / (width / 2)) ** 6), 0.4) * Math.pow(Math.max(0, 1 - (yy / (height / 2)) ** 6), 0.4);
    for (const button of buttons) {
      const bx = xx - button.x; const by = yy - button.y; const distance = Math.sqrt(bx * bx + by * by);
      displacement += 0.056 * Math.exp(-distance * distance / 0.0016);
      displacement += Math.cos(Math.atan2(by, bx) * 4) * 0.004 * Math.exp(-distance / 0.09);
    }
    return displacement;
  };
  builder.add(reverseWinding(gridGeometry(100, 36, (u, vv) => {
    const xx = (u - 0.5) * width; const yy = (0.5 - vv) * height;
    return v(x + xx, y + yy, z + surface(xx, yy));
  })), m.upholstery);
  for (const button of buttons) builder.sphere(m.upholstery, x + button.x, y + button.y, z + surface(button.x, button.y) - 0.006, 0.011, 0.011, 0.006);
  // Fine diagonal creases converge at each upholstered button.
  for (const button of buttons) for (const sign of [-1, 1]) {
    const endX = button.x + width / columns * 0.42; const endY = button.y + sign * height / rows * 0.42;
    if (endX > width / 2 || Math.abs(endY) > height / 2) continue;
    const points = Array.from({ length: 9 }, (_, i) => {
      const xx = THREE.MathUtils.lerp(button.x, endX, i / 8); const yy = THREE.MathUtils.lerp(button.y, endY, i / 8);
      return v(x + xx, y + yy, z + surface(xx, yy) - 0.002);
    });
    builder.tube(m.leather, points, 0.0017);
  }
}

/** Soft cloth draped over the front of a seat, with its own thickness at the rolled edge. */
function seatThrow(builder: FurnitureBuilder, mat: THREE.Material, x: number, top: number, z: number, width: number) {
  const material = mat.clone(); if (material instanceof THREE.MeshStandardMaterial) material.side = THREE.DoubleSide;
  const sample = (u: number, vv: number) => {
    const drop = Math.max(0, vv - 0.53) / 0.47;
    const zz = z - Math.min(vv, 0.54) * 1.17 - Math.sin(drop * Math.PI * 0.5) * 0.06;
    const xx = x + (u - 0.5) * width + Math.sin(vv * 7) * 0.025;
    const yy = top - drop * 0.4 + Math.sin(u * 26 + vv * 6) * (0.0045 + drop * 0.003) + Math.sin(vv * 18) * 0.002;
    return v(xx, yy, zz);
  };
  builder.add(gridGeometry(50, 55, sample), material);
  builder.tube(mat, Array.from({ length: 40 }, (_, i) => sample(i / 39, 1)), 0.0035);
  for (let i = 0; i < 27; i++) { const end = sample(i / 26, 1); builder.tube(mat, [end, end.clone().add(v(0.001, -0.025, 0.002)), end.clone().add(v(0.005, -0.05, -0.003))], 0.0016); }
}

export function createChesterfield(m: FurnitureMaterials) {
  const b = new FurnitureBuilder();
  for (const x of [-1.21, 1.21]) for (const z of [-0.4, 0.38]) turnedLeg(b, m, x, z, 0.25, 0.075);
  b.rounded(m.walnut, 0, 0.3, 0, 2.89, 0.2, 0.94, 0.026);
  b.rounded(m.upholstery, 0, 0.37, -0.027, 2.94, 0.2, 0.98, 0.065);
  b.rounded(m.upholstery, 0, 0.85, 0.4, 2.87, 0.85, 0.34, 0.14);
  tuftedPanel(b, m, 2.54, 0.65, 0, 0.91, 0.205, 10, 3);
  // Swept rolled arms have a continuous curved silhouette, their ends carry nailhead trim.
  for (const side of [-1, 1]) {
    b.tube(m.upholstery, [v(side * 1.25, 0.52, -0.5), v(side * 1.39, 0.71, -0.5), v(side * 1.33, 0.91, -0.45), v(side * 1.31, 0.96, -0.08), v(side * 1.29, 1.03, 0.33)], 0.155);
    b.rounded(m.upholstery, side * 1.34, 0.62, -0.01, 0.3, 0.52, 0.89, 0.105);
    b.tube(m.leather, [v(side * 1.23, 0.44, -0.537), v(side * 1.37, 0.56, -0.547), v(side * 1.43, 0.75, -0.528), v(side * 1.36, 0.884, -0.497), v(side * 1.23, 0.84, -0.489)], 0.004);
    for (let i = 0; i < 18; i++) { const a = -1.5 + i / 17 * Math.PI * 1.63; b.sphere(m.brass, side * (1.3 + Math.cos(a) * 0.115), 0.73 + Math.sin(a) * 0.137, -0.565, 0.0046); }
  }
  for (let i = 0; i < 3; i++) {
    b.add(pillowGeometry(0.79, 0.205, 0.81, i), m.upholstery, (i - 1) * 0.79, 0.535, -0.105);
    piping(b, m.leather, (i - 1) * 0.79, 0.528, -0.105, 0.785, 0.805, 0.0037);
  }
  for (let i = 0; i < 90; i++) b.sphere(m.brass, -1.25 + i / 89 * 2.5, 0.354, -0.523, 0.0035);
  b.add(pillowGeometry(0.5, 0.15, 0.49, 4), m.burgundy, -0.91, 0.81, -0.05, new THREE.Euler(1.08, 0.08, -0.25));
  b.add(pillowGeometry(0.48, 0.16, 0.47, 1), m.linen, 0.97, 0.8, -0.08, new THREE.Euler(1.07, -0.11, 0.22));
  seatThrow(b, m.linen, 0.51, 0.66, 0.025, 0.6);
  return b.finish('Handcrafted tufted Chesterfield sofa');
}

export function createReadingChair(m: FurnitureMaterials) {
  const b = new FurnitureBuilder(); const armMat = { ...m, upholstery: m.leather };
  for (const x of [-0.37, 0.37]) for (const z of [-0.36, 0.37]) turnedLeg(b, m, x, z, 0.27, 0.057);
  b.rounded(m.walnut, 0, 0.3, 0, 0.9, 0.18, 0.91, 0.04);
  b.rounded(m.leather, 0, 0.79, 0.4, 0.83, 1.06, 0.24, 0.11, 0, -0.09);
  tuftedPanel(b, armMat, 0.7, 0.77, 0, 0.9, 0.244, 3, 3);
  b.add(pillowGeometry(0.77, 0.21, 0.82, 2), m.leather, 0, 0.47, -0.045);
  piping(b, m.darkWood, 0, 0.47, -0.045, 0.77, 0.82);
  for (const side of [-1, 1]) {
    b.tube(m.walnut, [v(side * 0.43, 0.34, -0.36), v(side * 0.46, 0.68, -0.34), v(side * 0.47, 0.75, -0.11), v(side * 0.44, 0.79, 0.36)], 0.038);
    b.tube(m.leather, [v(side * 0.46, 0.745, -0.32), v(side * 0.475, 0.765, -0.1), v(side * 0.46, 0.79, 0.23)], 0.054);
    b.rounded(m.leather, side * 0.39, 1.08, 0.22, 0.18, 0.46, 0.31, 0.08, side * -0.17);
    for (let i = 0; i < 20; i++) b.sphere(m.brass, side * 0.41, 0.65 + i * 0.031, 0.252, 0.0035);
  }
  return b.finish('Leather wingback reading chair');
}

export function createDeskChair(m: FurnitureMaterials) {
  const b = new FurnitureBuilder();
  b.lathe(m.brass, [[0.055, 0.11], [0.07, 0.13], [0.04, 0.2], [0.027, 0.25], [0.031, 0.42], [0.06, 0.46]], 0, 0, 0);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2; const x = Math.cos(a) * 0.35; const z = Math.sin(a) * 0.35;
    b.tube(m.walnut, [v(0, 0.22, 0), v(x * 0.55, 0.13, z * 0.55), v(x, 0.075, z)], 0.026);
    b.cylinder(m.iron, x, 0.046, z, 0.037, 0.035, 0.037, Math.PI / 2);
  }
  b.rounded(m.walnut, 0, 0.45, 0, 0.63, 0.06, 0.62, 0.035);
  b.add(pillowGeometry(0.61, 0.12, 0.61), m.leather, 0, 0.535, 0);
  piping(b, m.darkWood, 0, 0.52, 0, 0.6, 0.6, 0.003);
  for (const side of [-1, 1]) {
    b.tube(m.walnut, [v(side * 0.255, 0.47, 0.25), v(side * 0.29, 0.8, 0.29), v(side * 0.27, 1.25, 0.33)], 0.027);
    b.tube(m.walnut, [v(side * 0.28, 0.46, -0.2), v(side * 0.34, 0.71, -0.18), v(side * 0.335, 0.76, 0.02), v(side * 0.28, 0.79, 0.28)], 0.025);
    b.rounded(m.leather, side * 0.335, 0.76, -0.025, 0.065, 0.045, 0.36, 0.018);
  }
  b.rounded(m.walnut, 0, 1.0, 0.31, 0.64, 0.62, 0.08, 0.065, 0, -0.07);
  const back = pillowGeometry(0.56, 0.07, 0.54); b.add(back, m.leather, 0, 1.01, 0.263, new THREE.Euler(Math.PI / 2 - 0.06, 0, 0));
  for (const x of [-0.16, 0, 0.16]) for (const y of [0.87, 1.04, 1.21]) b.sphere(m.leather, x, y, 0.211, 0.009, 0.009, 0.004);
  return b.finish('Antique swivel desk chair');
}

export function createWritingDesk(m: FurnitureMaterials) {
  const b = new FurnitureBuilder();
  b.rounded(m.walnut, 0, 0.826, 0, 3.45, 0.125, 1.1, 0.026);
  b.rounded(m.darkWood, 0, 0.754, 0, 3.36, 0.038, 1.03, 0.009);
  b.rounded(m.brass, 0, 0.898, 0, 3.27, 0.006, 0.94, 0.065);
  b.rounded(m.leather, 0, 0.902, 0, 3.23, 0.007, 0.9, 0.06);
  // Inlaid perimeter, framed drawer faces and cast drop handles.
  for (const side of [-1, 1]) {
    b.rounded(m.walnut, side * 1.28, 0.432, 0, 0.59, 0.65, 0.96, 0.018);
    b.rounded(m.darkWood, side * 1.28, 0.125, 0, 0.66, 0.12, 1.02, 0.016);
    for (const z of [-0.34, 0.34]) turnedLeg(b, m, side * 1.28, z, 0.13, 0.05);
    for (let row = 0; row < 3; row++) {
      const y = 0.24 + row * 0.215;
      b.rounded(m.darkWood, side * 1.28, y, 0.493, 0.535, 0.196, 0.023, 0.005);
      b.rounded(m.walnut, side * 1.28, y, 0.51, 0.502, 0.166, 0.02, 0.01);
      b.rounded(m.darkWood, side * 1.28, y, 0.526, 0.438, 0.107, 0.013, 0.008);
      for (const offset of [-0.075, 0.075]) b.sphere(m.brass, side * 1.28 + offset, y + 0.018, 0.55, 0.016, 0.016, 0.006);
      b.tube(m.brass, [v(side * 1.28 - 0.075, y + 0.018, 0.558), v(side * 1.28 - 0.055, y - 0.036, 0.583), v(side * 1.28 + 0.055, y - 0.036, 0.583), v(side * 1.28 + 0.075, y + 0.018, 0.558)], 0.007);
    }
    b.rounded(m.walnut, side * 1.584, 0.452, 0, 0.014, 0.49, 0.72, 0.008);
  }
  b.rounded(m.walnut, 0, 0.705, 0.422, 1.91, 0.14, 0.13, 0.012);
  b.sphere(m.brass, 0, 0.702, 0.501, 0.02, 0.024, 0.007);
  b.rounded(m.black, 0, 0.697, 0.51, 0.005, 0.013, 0.004, 0.002);
  return b.finish('Walnut partners desk with leather inlay');
}

export function createRetroTerminal(m: FurnitureMaterials, screenMaterial: THREE.Material) {
  const b = new FurnitureBuilder();
  // Beveled shell, sloped rear case and an inset gently convex CRT glass face.
  b.rounded(m.ceramic, 0, 0.3, -0.025, 0.85, 0.56, 0.47, 0.045);
  b.rounded(m.ceramic, 0, 0.282, -0.225, 0.7, 0.44, 0.26, 0.06);
  b.rounded(m.iron, 0, 0.327, 0.218, 0.744, 0.43, 0.027, 0.033);
  b.rounded(m.black, 0, 0.334, 0.236, 0.692, 0.373, 0.014, 0.022);
  b.add(gridGeometry(38, 28, (u, vv) => {
    const x = (u - 0.5) * 0.657; const y = (0.5 - vv) * 0.337;
    return v(x, 0.335 + y, 0.252 + 0.018 * (1 - (x / 0.329) ** 2) * (1 - (y / 0.169) ** 2));
  }), screenMaterial);
  b.rounded(m.darkWood, 0, 0.016, -0.045, 0.49, 0.038, 0.37, 0.013);
  for (let i = 0; i < 14; i++) {
    b.rounded(m.iron, 0.427, 0.278 + (i - 6) * 0.022, -0.07, 0.003, 0.006, 0.22, 0.002);
    b.rounded(m.iron, -0.427, 0.278 + (i - 6) * 0.022, -0.07, 0.003, 0.006, 0.22, 0.002);
  }
  b.cylinder(m.brass, 0.319, 0.078, 0.237, 0.022, 0.017, 0.022, Math.PI / 2);
  b.sphere(m.luminous, 0.278, 0.078, 0.249, 0.0048);
  b.rounded(m.brass, -0.21, 0.072, 0.24, 0.18, 0.026, 0.007, 0.003);
  for (let i = 0; i < 4; i++) b.sphere(m.iron, (i % 2 ? 1 : -1) * 0.395, i < 2 ? 0.036 : 0.555, 0.21, 0.0045);
  // Separate sculpted keyboard with staggered keycaps, space bar and coiled lead.
  b.rounded(m.ceramic, 0, 0.047, 0.495, 0.84, 0.075, 0.285, 0.02, 0, -0.075);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 13; col++) {
    b.rounded(row === 3 && col > 3 && col < 9 ? m.ceramic : m.darkWood, -0.364 + col * 0.056 + (row % 2) * 0.008, 0.09 - row * 0.003, 0.395 + row * 0.055, 0.044, 0.018, 0.042, 0.005);
  }
  b.rounded(m.darkWood, 0.01, 0.089, 0.561, 0.277, 0.02, 0.042, 0.005);
  b.tube(m.black, Array.from({ length: 65 }, (_, i) => v(0.34 + Math.cos(i * 0.9) * 0.013, 0.033 + Math.sin(i * 0.9) * 0.013, 0.323 - i * 0.006)), 0.0035);
  return b.finish('Curved phosphor CRT and mechanical keyboard');
}

export function createBankerLamp(m: FurnitureMaterials) {
  const b = new FurnitureBuilder();
  b.lathe(m.brass, [[0, 0], [0.153, 0], [0.17, 0.013], [0.171, 0.024], [0.154, 0.035], [0.145, 0.045], [0.106, 0.052], [0.067, 0.063], [0.037, 0.078], [0.026, 0.088], [0.019, 0.13]], 0, 0, 0);
  b.tube(m.brass, [v(0, 0.1, 0), v(0, 0.23, -0.025), v(0, 0.36, -0.077), v(0, 0.43, -0.06)], 0.015);
  for (const side of [-1, 1]) {
    b.tube(m.brass, [v(0, 0.32, -0.07), v(side * 0.14, 0.345, -0.078), v(side * 0.263, 0.41, -0.02), v(side * 0.263, 0.453, -0.02)], 0.01);
    b.sphere(m.brass, side * 0.264, 0.453, -0.02, 0.024, 0.024, 0.017);
  }
  const greenGlass = new THREE.MeshPhysicalMaterial({ color: '#123e26', roughness: 0.15, metalness: 0.03, clearcoat: 1, clearcoatRoughness: 0.1, side: THREE.DoubleSide });
  const shadePoint = (u: number, vv: number) => {
    const x = (u - 0.5) * 0.51; const a = vv * Math.PI;
    const radius = 0.13 * (1 - Math.pow(Math.abs(x) / 0.33, 6) * 0.24);
    return v(x, 0.445 + Math.sin(a) * radius, -0.02 + Math.cos(a) * radius * 0.84);
  };
  b.add(gridGeometry(36, 36, shadePoint), greenGlass);
  for (const edge of [0, 1]) b.tube(m.brass, Array.from({ length: 40 }, (_, i) => shadePoint(i / 39, edge)), 0.0038);
  for (const side of [0, 1]) b.tube(m.brass, Array.from({ length: 30 }, (_, i) => shadePoint(side, i / 29)), 0.006);
  b.rounded(m.luminous, 0, 0.459, -0.02, 0.36, 0.018, 0.034, 0.009);
  for (let i = 0; i < 19; i++) b.sphere(m.brass, 0.173 + Math.sin(i * 0.35) * 0.002, 0.438 - i * 0.008, 0.043, 0.0032);
  b.lathe(m.brass, [[0.003, 0], [0.01, 0.005], [0.009, 0.025], [0.003, 0.033]], 0.173, 0.25, 0.043);
  b.tube(m.black, [v(0, 0.013, -0.14), v(0.055, 0.01, -0.22), v(0.065, -0.015, -0.41)], 0.003);
  return b.finish("Emerald glass banker's lamp with pull chain");
}

export function createMug(m: FurnitureMaterials, fill = true) {
  const b = new FurnitureBuilder();
  b.lathe(m.ceramic, [[0, 0], [0.045, 0], [0.052, 0.007], [0.057, 0.022], [0.064, 0.123], [0.066, 0.137], [0.062, 0.142], [0.057, 0.138], [0.055, 0.125], [0.049, 0.024], [0, 0.019]]);
  b.tube(m.ceramic, [v(0.057, 0.115, 0), v(0.105, 0.119, 0), v(0.118, 0.078, 0), v(0.098, 0.038, 0), v(0.055, 0.039, 0)], 0.01);
  b.ring(m.brass, 0, 0.135, 0, 0.063, 0.0015, Math.PI / 2);
  if (fill) b.cylinder(m.darkWood, 0, 0.117, 0, 0.054, 0.002);
  return b.finish('Hollow glazed tea mug');
}

export function createTeapot(m: FurnitureMaterials) {
  const b = new FurnitureBuilder();
  b.lathe(m.ceramic, [[0, 0], [0.071, 0], [0.083, 0.012], [0.11, 0.041], [0.125, 0.085], [0.118, 0.135], [0.092, 0.173], [0.069, 0.18], [0.062, 0.173], [0.079, 0.16], [0.102, 0.125], [0.106, 0.073], [0.067, 0.022], [0, 0.02]]);
  b.lathe(m.ceramic, [[0, 0.184], [0.026, 0.184], [0.051, 0.18], [0.078, 0.175], [0.078, 0.181], [0.054, 0.19], [0.02, 0.201], [0, 0.201]]);
  b.sphere(m.brass, 0, 0.211, 0, 0.015, 0.013, 0.015);
  b.tube(m.ceramic, [v(-0.106, 0.141, 0), v(-0.174, 0.166, 0), v(-0.202, 0.116, 0), v(-0.171, 0.044, 0), v(-0.097, 0.042, 0)], 0.014);
  const spout = new THREE.CatmullRomCurve3([v(0.091, 0.076, 0), v(0.155, 0.097, 0), v(0.18, 0.156, 0), v(0.223, 0.182, 0)]);
  const tube = new THREE.TubeGeometry(spout, 36, 1, 18, false); const positions = tube.getAttribute('position'); const uv = tube.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) { const u = uv.getX(i); const center = spout.getPointAt(u); const p = v(positions.getX(i), positions.getY(i), positions.getZ(i)).sub(center).multiplyScalar(0.033 - u * 0.021).add(center); positions.setXYZ(i, p.x, p.y, p.z); }
  tube.computeVertexNormals(); b.add(tube, m.ceramic);
  b.ring(m.brass, 0, 0.016, 0, 0.08, 0.0015, Math.PI / 2);
  return b.finish('Thrown ceramic teapot with hollow curved spout');
}

export function createCoffeeTable(m: FurnitureMaterials) {
  const b = new FurnitureBuilder();
  b.rounded(m.walnut, 0, 0.464, 0, 1.75, 0.075, 0.95, 0.037);
  b.rounded(m.darkWood, 0, 0.423, 0, 1.69, 0.027, 0.89, 0.015);
  b.rounded(m.walnut, 0, 0.379, 0, 1.46, 0.1, 0.69, 0.013);
  b.rounded(m.walnut, 0, 0.165, 0, 1.47, 0.045, 0.68, 0.013);
  for (const x of [-0.674, 0.674]) for (const z of [-0.283, 0.283]) turnedLeg(b, m, x, z, 0.43, 0.044);
  // Brass inlaid perimeter follows a rounded, physically modeled edge.
  piping(b, m.brass, 0, 0.504, 0, 1.59, 0.8, 0.0018);
  return b.finish('Turned-leg walnut coffee table');
}

export function createBed(m: FurnitureMaterials) {
  const b = new FurnitureBuilder();
  for (const x of [-0.97, 0.97]) for (const z of [-1.32, 1.32]) turnedLeg(b, m, x, z, 0.33, 0.06);
  b.rounded(m.walnut, 0, 0.345, 0, 2.17, 0.23, 3, 0.026);
  b.rounded(m.darkWood, 0, 0.476, 0, 2.12, 0.065, 2.96, 0.024);
  b.add(pillowGeometry(2.04, 0.27, 2.83), m.linen, 0, 0.607, 0);
  piping(b, m.linen, 0, 0.612, 0, 2.035, 2.825, 0.0045);
  // Headboard has a shaped crown and layered wood frame rather than a flat slab.
  const shape = new THREE.Shape(); shape.moveTo(-1.15, 0.4); shape.lineTo(1.15, 0.4); shape.lineTo(1.15, 1.55); shape.bezierCurveTo(0.92, 1.59, 0.85, 1.62, 0.7, 1.74); shape.bezierCurveTo(0.3, 2.05, -0.3, 2.05, -0.7, 1.74); shape.bezierCurveTo(-0.85, 1.62, -0.92, 1.59, -1.15, 1.55); shape.closePath();
  b.add(new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.023, bevelThickness: 0.019, bevelSegments: 3, steps: 1, curveSegments: 32 }), m.walnut, 0, 0, -1.5);
  b.rounded(m.upholstery, 0, 1.25, -1.336, 1.96, 1.13, 0.1, 0.13);
  // Headboard faces +z; flip the tufted surface built to face -z.
  const headTufts = new FurnitureBuilder(); tuftedPanel(headTufts, m, 1.83, 0.94, 0, 0, 0, 7, 3);
  const headGroup = headTufts.finish('Headboard tufting'); headGroup.rotation.y = Math.PI; headGroup.position.set(0, 1.27, -1.263);
  // Follow the actual carved crown, recessed into its front face rather than floating
  // across the upholstered panel. The panel naturally occludes the lower shoulders.
  const crownRight = new THREE.CubicBezierCurve3(v(1.15, 1.53, -1.357), v(0.92, 1.57, -1.357), v(0.85, 1.60, -1.357), v(0.7, 1.72, -1.357));
  const crownTop = new THREE.CubicBezierCurve3(v(0.7, 1.72, -1.357), v(0.3, 2.03, -1.357), v(-0.3, 2.03, -1.357), v(-0.7, 1.72, -1.357));
  const crownLeft = new THREE.CubicBezierCurve3(v(-0.7, 1.72, -1.357), v(-0.85, 1.60, -1.357), v(-0.92, 1.57, -1.357), v(-1.15, 1.53, -1.357));
  b.tube(m.brass, [...crownRight.getPoints(18), ...crownTop.getPoints(36).slice(1), ...crownLeft.getPoints(18).slice(1)], 0.0035);
  const fabric = m.teal.clone(); if (fabric instanceof THREE.MeshStandardMaterial) fabric.side = THREE.DoubleSide;
  // Three.js clones map references but intentionally omits shader callbacks.
  fabric.onBeforeCompile = m.teal.onBeforeCompile;
  fabric.customProgramCacheKey = m.teal.customProgramCacheKey;
  // One continuous duvet surface droops over all three exposed mattress edges.
  const duvetHeight = (x: number, z: number) => {
    const sideDrop = Math.max(0, Math.abs(x) - 0.98) / 0.185;
    const footDrop = Math.max(0, z - 1.36) / 0.33;
    const sideFall = THREE.MathUtils.smoothstep(sideDrop, 0, 1) * 0.3;
    const footFall = THREE.MathUtils.smoothstep(footDrop, 0, 1) * 0.32;
    const y = 0.785 - Math.max(sideFall, footFall) - Math.min(sideFall, footFall) * 0.055;
    return y + Math.sin(x * 14 + z * 3) * 0.006 + Math.sin(x * 29 - z * 5) * 0.002;
  };
  const duvetSample = (u: number, vv: number) => {
    const x = (u - 0.5) * 2.33; const z = -0.72 + vv * 2.41;
    return v(x, duvetHeight(x, z), z);
  };
  b.add(gridGeometry(100, 110, duvetSample), fabric);
  for (const side of [0, 1]) b.tube(m.teal, Array.from({ length: 60 }, (_, i) => duvetSample(side, i / 59)), 0.004);
  const foldedSheet = m.linen.clone(); if (foldedSheet instanceof THREE.MeshStandardMaterial) foldedSheet.side = THREE.DoubleSide;
  b.add(gridGeometry(80, 25, (u, vv) => {
    const x = (u - 0.5) * 2.05; const z = -0.77 + vv * 0.37;
    return v(x, duvetHeight(x, z) + 0.018 + Math.sin(vv * Math.PI) * 0.018, z);
  }), foldedSheet);
  for (const side of [-1, 1]) {
    b.add(pillowGeometry(0.88, 0.19, 0.54, side), m.linen, side * 0.49, 0.846, -1.019, new THREE.Euler(-0.09, side * 0.055, side * -0.018));
    piping(b, m.linen, side * 0.49, 0.847, -1.019, 0.86, 0.525, 0.0033);
  }
  const throwMat = m.burgundy.clone(); if (throwMat instanceof THREE.MeshStandardMaterial) throwMat.side = THREE.DoubleSide;
  b.add(gridGeometry(95, 34, (u, vv) => {
    const x = (u - 0.5) * 2.3; const z = 0.76 + vv * 0.52 + Math.sin(x * 2) * 0.015;
    // The runner conforms to the same duvet surface everywhere, with a small
    // guaranteed air gap for fabric thickness; separate waves cannot intersect.
    return v(x, duvetHeight(x, z) + 0.011 + Math.sin(x * 21 + vv * 3) * 0.0015, z);
  }), throwMat);
  const group = b.finish('Walnut bed with continuous draped linens'); group.add(headGroup); return group;
}

/** A closed-profile lathe returns a real hollow ceramic bowl, including its rolled lip. */
function basin(b: FurnitureBuilder, m: FurnitureMaterials, x: number, y: number, z: number, radius: number, depth: number, sx = 1, sz = 1) {
  b.lathe(m.ceramic, [[0, 0], [radius * 0.35, 0], [radius * 0.61, depth * 0.15], [radius * 0.89, depth * 0.64], [radius, depth * 0.96], [radius, depth], [radius * 0.94, depth * 1.02], [radius * 0.9, depth * 0.93], [radius * 0.78, depth * 0.48], [radius * 0.48, depth * 0.15], [radius * 0.2, depth * 0.09], [0, depth * 0.09]], x, y, z, sx, sz);
  b.cylinder(m.brass, x, y + depth * 0.105, z, radius * 0.08, 0.007);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; b.sphere(m.black, x + Math.cos(a) * radius * 0.044, y + depth * 0.117, z + Math.sin(a) * radius * 0.044, 0.002); }
}

function faucet(b: FurnitureBuilder, m: FurnitureMaterials, x: number, y: number, z: number, height = 0.3) {
  b.lathe(m.brass, [[0.034, 0], [0.036, 0.012], [0.021, 0.026], [0.018, height * 0.45]], x, y, z);
  b.tube(m.brass, [v(x, y + height * 0.43, z), v(x, y + height * 0.91, z), v(x, y + height, z - 0.085), v(x, y + height * 0.88, z - 0.17), v(x, y + height * 0.7, z - 0.17)], 0.016);
  b.cylinder(m.brass, x, y + height * 0.7, z - 0.17, 0.024, 0.024);
  for (const side of [-1, 1]) {
    b.cylinder(m.brass, x + side * 0.125, y + 0.042, z, 0.023, 0.064);
    b.tube(m.brass, [v(x + side * 0.17, y + 0.084, z), v(x + side * 0.08, y + 0.084, z)], 0.008);
    b.tube(m.brass, [v(x + side * 0.125, y + 0.084, z - 0.045), v(x + side * 0.125, y + 0.084, z + 0.045)], 0.008);
    b.sphere(m.ceramic, x + side * 0.125, y + 0.099, z, 0.012, 0.006, 0.012);
  }
}

export function createKitchenSink(m: FurnitureMaterials) {
  const b = new FurnitureBuilder(); basin(b, m, 0, -0.235, 0, 0.44, 0.25, 1, 0.81);
  faucet(b, m, 0, 0, 0.416, 0.37);
  b.lathe(m.ceramic, [[0, 0], [0.03, 0], [0.032, 0.11], [0.022, 0.14], [0, 0.14]], 0.47, 0.0, 0.24);
  b.rounded(m.brass, 0.47, 0.164, 0.22, 0.034, 0.024, 0.074, 0.009);
  return b.finish('Hollow inset ceramic sink and bridge tap');
}

export function createVanity(m: FurnitureMaterials) {
  const b = new FurnitureBuilder();
  for (const x of [-0.59, 0.59]) for (const z of [-0.22, 0.22]) turnedLeg(b, m, x, z, 0.16, 0.044);
  b.rounded(m.upholstery, 0, 0.48, 0, 1.38, 0.69, 0.66, 0.024);
  for (const x of [-0.34, 0.34]) {
    b.rounded(m.walnut, x, 0.49, -0.348, 0.66, 0.59, 0.026, 0.009);
    b.rounded(m.upholstery, x, 0.49, -0.368, 0.55, 0.47, 0.017, 0.01);
    b.tube(m.brass, [v(x - 0.07, 0.665, -0.381), v(x - 0.055, 0.64, -0.406), v(x + 0.055, 0.64, -0.406), v(x + 0.07, 0.665, -0.381)], 0.006);
  }
  b.rounded(m.ceramic, 0, 0.854, -0.015, 1.49, 0.08, 0.77, 0.022);
  basin(b, m, 0, 0.898, -0.08, 0.39, 0.142, 1.11, 0.68);
  faucet(b, m, 0, 0.895, 0.28, 0.32);
  b.lathe(m.ceramic, [[0, 0], [0.035, 0], [0.04, 0.08], [0.035, 0.14], [0.03, 0.148], [0.024, 0.14], [0.028, 0.023], [0, 0.02]], -0.59, 0.901, 0.08);
  for (const x of [-0.602, -0.573]) b.cylinder(m.darkWood, x, 1.093, 0.08, 0.005, 0.13);
  return b.finish('Framed vanity with hollow vessel basin');
}

export function createBath(m: FurnitureMaterials) {
  const b = new FurnitureBuilder();
  // The complete inner and outer tub is a continuous oval shell with an asymmetrical slipper end.
  const profile: [number, number][] = [[0, 0.23], [0.52, 0.23], [0.7, 0.29], [0.85, 0.44], [0.96, 0.64], [1, 0.76], [1.01, 0.782], [0.995, 0.797], [0.95, 0.793], [0.921, 0.763], [0.88, 0.61], [0.77, 0.43], [0.6, 0.32], [0, 0.32]];
  const tub = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 128);
  const positions = tub.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i) * 0.57; const z = positions.getZ(i) * 0.975; const y = positions.getY(i);
    const lift = Math.pow(Math.max(0, -z / 0.975), 5) * 0.135 * THREE.MathUtils.smoothstep(y, 0.35, 0.78);
    positions.setXYZ(i, x, y + lift, z);
  }
  tub.computeVertexNormals(); b.add(tub, m.ceramic);
  for (const x of [-0.385, 0.385]) for (const z of [-0.65, 0.65]) {
    b.tube(m.brass, [v(x * 0.88, 0.37, z), v(x, 0.25, z), v(x * 1.12, 0.1, z + Math.sign(z) * 0.025)], 0.045);
    b.sphere(m.brass, x * 1.12, 0.08, z + Math.sign(z) * 0.025, 0.065, 0.045, 0.075);
    for (let toe = 0; toe < 3; toe++) b.sphere(m.brass, x * 1.12 + (toe - 1) * 0.034, 0.063, z + Math.sign(z) * 0.075, 0.019, 0.022, 0.031);
  }
  b.cylinder(m.brass, 0, 0.325, 0.48, 0.034, 0.008);
  faucet(b, m, 0.36, 0.66, -0.68, 0.34);
  b.tube(m.brass, [v(0.46, 0.55, -0.83), v(0.46, 2.18, -0.83), v(0.43, 2.35, -0.81), v(0.12, 2.36, -0.72), v(0.045, 2.28, -0.66)], 0.018);
  b.lathe(m.brass, [[0, 0], [0.13, 0], [0.125, 0.019], [0.045, 0.062], [0.02, 0.067]], 0.045, 2.225, -0.66);
  for (let i = 0; i < 30; i++) { const a = i * 2.399; const r = Math.sqrt(i / 30) * 0.105; b.sphere(m.black, 0.045 + Math.cos(a) * r, 2.223, -0.66 + Math.sin(a) * r, 0.0027, 0.001, 0.0027); }
  return b.finish('Hollow slipper bath with claw feet and rainfall shower');
}

export function createToilet(m: FurnitureMaterials) {
  const b = new FurnitureBuilder();
  b.lathe(m.ceramic, [[0, 0], [0.19, 0], [0.21, 0.03], [0.17, 0.08], [0.12, 0.21], [0.15, 0.29], [0.23, 0.36], [0.255, 0.43], [0.26, 0.47], [0.23, 0.47], [0.2, 0.41], [0.12, 0.29], [0, 0.26]], 0, 0.045, -0.13, 1.08, 1.43);
  b.ring(m.ceramic, 0, 0.528, -0.13, 0.237, 0.03, Math.PI / 2, 0, 1.06, 1.41);
  b.rounded(m.ceramic, 0, 0.65, 0.225, 0.51, 0.61, 0.275, 0.04);
  b.rounded(m.ceramic, 0, 0.963, 0.225, 0.54, 0.041, 0.305, 0.014);
  b.rounded(m.ceramic, 0, 0.763, 0.064, 0.445, 0.032, 0.592, 0.12, 0, 1.48);
  b.cylinder(m.brass, 0.187, 0.88, 0.075, 0.022, 0.025, 0.022, Math.PI / 2);
  b.rounded(m.brass, 0.15, 0.88, 0.056, 0.1, 0.02, 0.018, 0.009);
  return b.finish('Sculpted porcelain WC');
}
