import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { RoomDefinition } from './roomCatalog';

type Palette = {wood: THREE.Material, darkWood: THREE.Material, accent: THREE.Material, metal: THREE.Material, glass: THREE.Material, luminous: THREE.Material, paper: THREE.Material};
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const PI = Math.PI;

/** Style changes architectural silhouettes as well as colour. Details batch by material. */
export function createStyleInstallation(room: RoomDefinition, m: Palette) {
  const group = new THREE.Group(); group.name = `${room.style} × Dark Academia / crafted installations`;
  const sculpture = new THREE.Group(); sculpture.name = 'desk sculpture'; group.add(sculpture);
  const parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const sculptParts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  let target = parts;
  function add(geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0, scale = v(1, 1, 1), rotation = new THREE.Euler()) {
    const transformed = geometry.index ? geometry.toNonIndexed() : geometry.clone(); geometry.dispose();
    transformed.applyMatrix4(new THREE.Matrix4().compose(v(x, y, z), new THREE.Quaternion().setFromEuler(rotation), scale));
    if (!transformed.getAttribute('uv')) transformed.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(transformed.getAttribute('position').count * 2), 2));
    if (!target.has(material)) target.set(material, []);
    target.get(material)!.push(transformed);
  }
  const box = (material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, rotation = 0) => add(new RoundedBoxGeometry(w, h, d, 2, Math.min(.055, w / 4, h / 4, d / 4)), material, x, y, z, v(1, 1, 1), new THREE.Euler(0, rotation, 0));
  const sphere = (material: THREE.Material, x: number, y: number, z: number, radius: number, sy = 1) => add(new THREE.SphereGeometry(radius, 24, 16), material, x, y, z, v(1, sy, 1));
  const tube = (material: THREE.Material, points: THREE.Vector3[], radius = .02, closed = false) => add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed, 'centripetal'), Math.max(36, points.length * 8), radius, 8, closed), material);
  const ring = (material: THREE.Material, x: number, y: number, z: number, radius: number, width: number, rx = 0, ry = 0, rz = 0) => add(new THREE.TorusGeometry(radius, width, 9, 64), material, x, y, z, v(1, 1, 1), new THREE.Euler(rx, ry, rz));
  const column = (material: THREE.Material, x: number, y: number, z: number, radius: number, height: number) => add(new THREE.CylinderGeometry(radius, radius, height, 24), material, x, y, z);
  const tint = new THREE.MeshPhysicalMaterial({color: room.palette.accent, roughness: .11, metalness: .15, clearcoat: .9, clearcoatRoughness: .12});
  const mineral = new THREE.MeshStandardMaterial({color: room.palette.wall, roughness: .87});
  const foliage = new THREE.MeshStandardMaterial({color: '#385544', roughness: .79, side: THREE.DoubleSide});
  const p = .7 + (room.number % 17) * .019;
  const rhythm = 5 + room.number % 6;
  const cx = -1.3, cy = 4.14, cz = .5;
  column(m.metal, cx, 4.91, cz, .028, 1.18);

  // Pendant and upper wall vocabulary are visible immediately on entering each space.
  switch (room.motif) {
    case 'aero': {
      for (let i = 0; i < rhythm; i++) {
        const a = i / rhythm * 2 * PI;
        const x = cx + Math.cos(a) * p, z = cz + Math.sin(a) * p;
        sphere(tint, x, cy + Math.sin(a * 2) * .14, z, .19 + (i % 3) * .035, .75);
        sphere(m.luminous, x, cy - .03, z, .11);
        tube(m.metal, [v(cx, cy + .42, cz), v(x * .6 + cx * .4, cy + .24, z), v(x, cy, z)], .016);
      }
      ring(tint, cx, cy + .1, cz, p * 1.2, .045, PI / 2);
      for (let i = 0; i < 3; i++) box(tint, 7.81, 3.15 + i * .46, -3.7, .1, .28, 2.0 - i * .4);
      break;
    }
    case 'art-deco': {
      for (let level = 0; level < 3; level++) {
        const radius = p * (1.24 - level * .28);
        const corners = Array.from({length: 9}, (_, i) => v(cx + Math.cos(i / 8 * 2 * PI) * radius, cy - level * .2, cz + Math.sin(i / 8 * 2 * PI) * radius));
        tube(m.metal, corners, .037);
        for (let i = 0; i < 8; i++) column(m.luminous, corners[i].x, cy - .19 - level * .2, corners[i].z, .032, .29);
      }
      for (let i = 0; i < 11; i++) {
        const a = -.9 + i / 10 * 1.8;
        tube(m.metal, [v(7.78, 2.66, -3.6), v(7.78, 2.66 + Math.cos(a) * 1.72, -3.6 + Math.sin(a) * 1.72)], .023);
      }
      break;
    }
    case 'botanical': {
      for (let i = 0; i < rhythm; i++) {
        const a = i * 2 * PI / rhythm;
        const end = v(cx + Math.cos(a) * p * 1.25, cy - .35, cz + Math.sin(a) * p * 1.25);
        tube(m.metal, [v(cx, cy + .55, cz), v(cx + Math.cos(a) * .4, cy + .25, cz + Math.sin(a) * .4), end], .023);
        sphere(m.luminous, end.x, end.y, end.z, .11, 1.45);
        sphere(foliage, (cx + end.x) / 2, cy, (cz + end.z) / 2, .17, .23);
      }
      for (let i = 0; i < 5; i++) {
        const z = -4.8 + i * .59;
        tube(m.metal, [v(7.75, 2.4, z), v(7.74, 3.18, z + .19), v(7.74, 4.45, z - .21)], .023);
        for (let j = 0; j < 4; j++) sphere(foliage, 7.67, 2.9 + j * .36, z + (j % 2 ? -.19 : .19), .22, .48);
      }
      break;
    }
    case 'celestial': {
      for (let i = 0; i < 3; i++) ring(m.metal, cx, cy, cz, p + i * .15, .019, .5 + i * .4, i * .7);
      sphere(m.luminous, cx, cy, cz, .22);
      for (let i = 0; i < rhythm; i++) { const a = i * 2.399; sphere(tint, cx + Math.cos(a) * p, cy + Math.sin(a * 2) * .45, cz + Math.sin(a) * p, .07 + (i % 3) * .028); }
      for (let i = 0; i < 4; i++) ring(m.metal, 7.79, 3.35, -3.7, .38 + i * .23, .014, 0, PI / 2);
      break;
    }
    case 'industrial': {
      for (let i = 0; i < rhythm; i++) {
        const x = cx - 1.12 + i * 2.24 / (rhythm - 1), drop = (i % 3) * .13;
        tube(m.metal, [v(x, 4.73, cz), v(x, cy - drop, cz)], .018);
        add(new THREE.ConeGeometry(.18, .16, 32, 1, true), m.darkWood, x, cy - drop, cz);
        sphere(m.luminous, x, cy - .11 - drop, cz, .075);
      }
      for (let i = 0; i < 4; i++) {
        tube(m.metal, [v(7.75, 2.48, -4.8 + i * .65), v(7.75, 4.25, -4.8 + i * .65), v(7.75, 4.4, -4.65 + i * .65), v(7.75, 4.4, -4.3 + i * .65)], .035);
        ring(m.metal, 7.68, 3.1, -4.8 + i * .65, .115, .016, 0, PI / 2);
      }
      break;
    }
    case 'gothic': {
      ring(m.darkWood, cx, cy, cz, p, .065, PI / 2);
      for (let i = 0; i < rhythm + 2; i++) {
        const a = i / (rhythm + 2) * 2 * PI, x = cx + Math.cos(a) * p, z = cz + Math.sin(a) * p;
        column(m.metal, x, cy + .12, z, .04, .32); sphere(m.luminous, x, cy + .34, z, .052, 1.65);
      }
      for (let i = 0; i < 3; i++) { const z = -4.65 + i * .95; tube(m.darkWood, [v(7.75, 2.43, z - .36), v(7.75, 3.59, z - .36), v(7.75, 4.28, z), v(7.75, 3.59, z + .36), v(7.75, 2.43, z + .36)], .045); }
      break;
    }
    case 'japonisme': {
      for (let i = 0; i < 3; i++) {
        const x = cx + (i - 1) * .84, y = cy - (i % 2) * .23;
        sphere(m.paper, x, y, cz, .35, 1.1); sphere(m.luminous, x, y - .05, cz, .26);
        for (let j = 0; j < 7; j++) ring(m.wood, x, y - .29 + j * .098, cz, .18 + Math.sin(j / 6 * PI) * .17, .006, PI / 2);
      }
      for (let i = 0; i < 12; i++) box(m.wood, 7.76, 3.3, -5 + i * .24, .045, 2.0, .034);
      for (let i = 0; i < 4; i++) box(m.wood, 7.75, 2.5 + i * .51, -3.7, .05, .033, 2.7);
      break;
    }
    case 'nautical': {
      ring(m.wood, cx, cy, cz, p, .065, PI / 2);
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * 2 * PI, x = cx + Math.cos(a) * (p + .17), z = cz + Math.sin(a) * (p + .17);
        tube(m.wood, [v(cx, cy, cz), v(x, cy, z)], .022);
        column(m.metal, x, cy - .17, z, .07, .24); sphere(m.luminous, x, cy - .17, z, .064, 1.3);
      }
      for (let i = 0; i < 3; i++) { const z = -4.7 + i; ring(m.metal, 7.72, 3.4, z, .38, .045, 0, PI / 2); sphere(tint, 7.75, 3.4, z, .335, 1); }
      break;
    }
    case 'baroque': {
      for (let i = 0; i < rhythm; i++) {
        const a = i / rhythm * 2 * PI, x = Math.cos(a), z = Math.sin(a);
        tube(m.metal, [v(cx, cy + .4, cz), v(cx + x * .44, cy - .22, cz + z * .44), v(cx + x * p, cy - .33, cz + z * p), v(cx + x * (p + .12), cy + .02, cz + z * (p + .12))], .027);
        sphere(m.luminous, cx + x * (p + .12), cy + .15, cz + z * (p + .12), .075, 1.5);
        sphere(m.metal, cx + x * .63, cy - .47, cz + z * .63, .05, 2);
      }
      for (let i = 0; i < 5; i++) {
        const z = -4.9 + i * .54;
        tube(m.metal, Array.from({length: 50}, (_, j) => { const a = j / 49 * PI * 3; const r = .37 * (1 - j / 70); return v(7.72, 3.4 + Math.cos(a) * r, z + Math.sin(a) * r); }), .018);
      }
      break;
    }
    case 'modernist': {
      const brutal = /brutal|concrete|bunker/i.test(room.style);
      for (let i = 0; i < 3; i++) {
        const rotation = i * PI / 3 + room.number * .015;
        box(brutal ? mineral : m.accent, cx, cy - i * .17, cz, 2.8 - i * .5, .13, .24, rotation);
        box(m.luminous, cx, cy - .08 - i * .17, cz, 2.66 - i * .5, .022, .18, rotation);
      }
      for (let i = 0; i < 5; i++) box(i % 2 ? m.accent : mineral, 7.72, 2.7 + (i % 3) * .46, -4.75 + i * .5, .2, .42 + (i % 2) * .65, .42);
      break;
    }
    case 'antiquarian': {
      for (let i = 0; i < rhythm; i++) {
        const a = i * 2 * PI / rhythm;
        tube(m.metal, [v(cx, cy + .2, cz), v(cx + Math.cos(a) * p, cy - .15, cz + Math.sin(a) * p)], .018);
        add(new THREE.CylinderGeometry(.16, .27, .24, 32, 1, true), m.paper, cx + Math.cos(a) * p, cy - .18, cz + Math.sin(a) * p);
        sphere(m.luminous, cx + Math.cos(a) * p, cy - .23, cz + Math.sin(a) * p, .075);
      }
      break;
    }
    default: {
      ring(m.metal, cx, cy, cz, p, .028, PI / 2);
      for (let i = 0; i < rhythm; i++) { const a = i * 2 * PI / rhythm; sphere(m.luminous, cx + Math.cos(a) * p, cy - .08, cz + Math.sin(a) * p, .13); }
      for (let i = 0; i < 3; i++) { const z = -4.7 + i; box(m.wood, 7.76, 3.35, z, .13, 1.55, .74); box(m.accent, 7.67, 3.35, z, .035, 1.38, .56); }
    }
  }

  // A framed study plate combines vintage engraving with the room's secondary style.
  const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 800;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#d0c29f'; context.fillRect(0, 0, 640, 800);
  context.strokeStyle = room.palette.upholstery; context.lineWidth = 3;
  context.strokeRect(25, 25, 590, 750); context.translate(320, 345);
  for (let i = 0; i < rhythm * 3; i++) {
    context.rotate(2 * PI / (rhythm * 3)); context.beginPath();
    context.ellipse(0, -98, 37 + (room.number % 7) * 4, 147, 0, 0, 2 * PI); context.stroke();
  }
  context.setTransform(1, 0, 0, 1, 0, 0); context.textAlign = 'center'; context.fillStyle = room.palette.wood;
  context.font = '24px Georgia'; context.fillText('COLLECTED STUDIES', 320, 680);
  context.font = '16px Georgia'; context.fillText(`PLATE ${String(room.number).padStart(3, '0')} · LUX UMBRARUM`, 320, 720);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  const art = new THREE.MeshStandardMaterial({map, roughness: .9});
  box(m.wood, -.05, 3.25, 5.91, 1.55, 1.96, .1);
  add(new THREE.PlaneGeometry(1.38, 1.78), art, -.05, 3.25, 5.848, v(1, 1, 1), new THREE.Euler(0, PI, 0));
  for (const x of [-.82, .72]) box(m.metal, x, 3.25, 5.83, .033, 1.96, .04);

  // A material-specific sculptural specimen: no two rooms have identical geometry.
  target = sculptParts;
  const radius = .36 + room.number * .0009;
  switch (room.motif) {
    case 'aero':
      for (let i = 0; i < 5; i++) sphere(tint, Math.sin(i * 2.3) * .25, .19 + i * .16, Math.cos(i * 2.3) * .2, .14 + i * .016);
      ring(m.metal, 0, .43, 0, radius, .012, .24, .3); break;
    case 'botanical':
    case 'japonisme': {
      const profile: [number, number][] = [[0, 0], [.2, 0], [.23, .08], [.24, .25], [.15, .4], [.08, .53], [.07, .55], [.064, .5], [.06, .45]];
      add(new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), 48), tint);
      for (let i = 0; i < rhythm; i++) { const a = i * 2.399; tube(m.wood, [v(0, .43, 0), v(Math.cos(a) * .22, .72, Math.sin(a) * .22), v(Math.cos(a) * .35, .89 + .1 * (i % 3), Math.sin(a) * .35)], .009); sphere(foliage, Math.cos(a) * .3, .86 + .1 * (i % 3), Math.sin(a) * .3, .12, .22); }
      break;
    }
    case 'industrial':
      for (let i = 0; i < 3; i++) { const radius = .2 + i * .043; ring(m.metal, (i - 1) * .24, .32 + i * .22, 0, radius, .035); for (let j = 0; j < 12; j++) { const a = j / 12 * PI * 2; box(m.metal, (i - 1) * .24 + Math.cos(a) * radius, .32 + i * .22 + Math.sin(a) * radius, 0, .05, .05, .07, a); } } break;
    case 'modernist':
      for (let i = 0; i < 4; i++) box(i % 2 ? tint : mineral, 0, .14 + i * .21, 0, .56 - i * .07, .17, .5 - i * .075, room.number * .025 + i * .3); break;
    case 'gothic':
    case 'baroque':
      for (let i = 0; i < 3; i++) { const x = (i - 1) * .21; column(m.metal, x, .31, 0, .032, .56 + .13 * (i % 2)); column(m.paper, x, .7 + .09 * (i % 2), 0, .048, .28); sphere(m.luminous, x, .86 + .09 * (i % 2), 0, .02, 1.8); } break;
    case 'art-deco':
      for (let i = 0; i < 7; i++) { const a = -PI * .47 + i / 6 * PI * .94; tube(m.metal, [v(0, .12, 0), v(Math.sin(a) * .5, .2 + Math.cos(a) * .73, 0)], .019); sphere(tint, Math.sin(a) * .5, .2 + Math.cos(a) * .73, 0, .06); } break;
    default:
      sphere(tint, 0, .44, 0, radius * .64);
      for (let i = 0; i < 3; i++) ring(m.metal, 0, .44, 0, radius + i * .07, .011, i * .65 + .4, i * .8);
  }
  for (const [collection, parent] of [[parts, group], [sculptParts, sculpture]] as const) {
    for (const [material, pieces] of collection) {
      const geometry = mergeGeometries(pieces, false)!; pieces.forEach(piece => piece.dispose());
      const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh);
    }
  }
  return group;
}
