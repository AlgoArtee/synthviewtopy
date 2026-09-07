import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const point = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** A single, room-independent workstation specification, shared by every apartment. */
export const ADVANCED_WORKSTATION_SPEC = Object.freeze({
  model: 'Vinculum Atlas research workstation',
  technology: 'advanced',
  displayTechnology: 'curved ultrawide OLED, auxiliary displays and glass touch input',
  displays: 3,
  displayCount: 3,
  touchSurfaceCount: 1,
  volumetricProjection: true,
  facing: '+Z',
  paletteIndependent: true,
});

/** Merge small hardware pieces by material while keeping each readable display separate. */
class HardwareBuilder {
  private parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geometry: THREE.BufferGeometry, material: THREE.Material, position = point(0, 0, 0), rotation = new THREE.Euler()) {
    const transformed = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    geometry.dispose();
    transformed.applyMatrix4(new THREE.Matrix4().compose(position, new THREE.Quaternion().setFromEuler(rotation), point(1, 1, 1)));
    if (!this.parts.has(material)) this.parts.set(material, []);
    this.parts.get(material)!.push(transformed);
  }
  box(material: THREE.Material, x: number, y: number, z: number, width: number, height: number, depth: number, radius = .007, rotation = new THREE.Euler()) {
    this.add(new RoundedBoxGeometry(width, height, depth, 2, Math.min(radius, width / 2, height / 2, depth / 2)), material, point(x, y, z), rotation);
  }
  tube(material: THREE.Material, points: THREE.Vector3[], radius: number) {
    this.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, radius, 6, false), material);
  }
  finish(target: THREE.Group) {
    for (const [material, parts] of this.parts) {
      const geometry = mergeGeometries(parts, false)!;
      parts.forEach(part => part.dispose());
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `Atlas hardware · ${material.name}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      target.add(mesh);
    }
  }
}

function dashboardTexture(width: number, height: number, draw: (context: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d')!;
  draw(context);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.name = 'Atlas scientific interface';
  return texture;
}

function panel(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, title: string) {
  context.fillStyle = '#101f2c'; context.fillRect(x, y, width, height);
  context.strokeStyle = '#294553'; context.lineWidth = 2; context.strokeRect(x, y, width, height);
  context.fillStyle = '#9bb5bd'; context.font = '18px sans-serif'; context.fillText(title, x + 18, y + 30);
}

function line(context: CanvasRenderingContext2D, points: number[][], color: string, width = 2) {
  context.strokeStyle = color; context.lineWidth = width; context.beginPath();
  points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
  context.stroke();
}

function mainDashboard() {
  return dashboardTexture(1536, 640, context => {
    context.fillStyle = '#08131e'; context.fillRect(0, 0, 1536, 640);
    context.fillStyle = '#d7ebe9'; context.font = '600 30px sans-serif'; context.fillText('ATLAS', 34, 49);
    context.fillStyle = '#75c9cd'; context.font = '18px sans-serif'; context.fillText('VINCULUM RESEARCH NETWORK', 177, 46);
    context.fillStyle = '#8da6ae'; context.font = '17px monospace'; context.fillText('LUX UMBRARUM   /   LOCAL NODE 01', 1112, 45);
    line(context, [[30, 70], [1506, 70]], '#2e505d');
    panel(context, 30, 92, 305, 506, 'ACTIVE WORKSPACE');
    context.fillStyle = '#bfe4e2'; context.font = '23px sans-serif'; context.fillText('Orbital field study', 48, 167);
    context.fillStyle = '#89a7b3'; context.font = '18px sans-serif';
    ['MODEL / LIVE SOLUTION', 'SPECTRAL ANALYSIS', 'ACADEMIC ARCHIVE', 'PERSONAL NOTEBOOK'].forEach((label, index) => {
      if (!index) { context.fillStyle = '#183c48'; context.fillRect(44, 192, 276, 53); }
      context.fillStyle = index ? '#7e9ba6' : '#a2e1db'; context.fillText(label, 56, 225 + index * 61);
    });
    context.fillStyle = '#527684'; context.font = '15px monospace'; context.fillText('SYNCED TO RESIDENCE', 49, 549);
    context.fillStyle = '#75c9bd'; context.beginPath(); context.arc(57, 572, 4, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#8da8af'; context.fillText('SECURE CONNECTION', 73, 578);

    panel(context, 354, 92, 724, 506, 'CYGNUS / SPATIAL RECONSTRUCTION');
    const cx = 716, cy = 329;
    // A scientific field reconstruction: gridded orbital ellipses, tracked nodes and axes.
    for (let index = 0; index < 9; index++) {
      context.save(); context.translate(cx, cy); context.rotate(-.38);
      context.strokeStyle = index % 3 ? '#21454e' : '#4a8f95'; context.lineWidth = index % 3 ? 1 : 2;
      context.beginPath(); context.ellipse(0, 0, 54 + index * 25, 21 + index * 11, 0, 0, Math.PI * 2); context.stroke(); context.restore();
    }
    for (let index = 0; index < 7; index++) {
      context.save(); context.translate(cx, cy); context.rotate(index * Math.PI / 7);
      context.strokeStyle = '#325f6c'; context.lineWidth = 1.4; context.beginPath(); context.ellipse(0, 0, 135, 35, 0, 0, Math.PI * 2); context.stroke(); context.restore();
    }
    line(context, [[455, 435], [968, 223]], '#376672', 1);
    line(context, [[650, 139], [782, 520]], '#376672', 1);
    const star = context.createRadialGradient(cx, cy, 0, cx, cy, 23);
    star.addColorStop(0, '#e7f2dd'); star.addColorStop(.22, '#94d1c9'); star.addColorStop(1, '#102a36');
    context.fillStyle = star; context.beginPath(); context.arc(cx, cy, 23, 0, Math.PI * 2); context.fill();
    for (const [x, y, label] of [[849, 296, 'FIELD 02'], [549, 416, 'PROBE 08'], [641, 235, 'ARRAY 04']] as const) {
      context.fillStyle = '#99d9d0'; context.beginPath(); context.arc(x, y, 4, 0, Math.PI * 2); context.fill();
      line(context, [[x + 8, y - 4], [x + 24, y - 23], [x + 94, y - 23]], '#609199', 1);
      context.fillStyle = '#8fb7c0'; context.font = '13px monospace'; context.fillText(label, x + 27, y - 29);
    }
    context.fillStyle = '#a5c5ca'; context.font = '17px monospace'; context.fillText('RESOLUTION  4.8 μm', 376, 555);
    context.fillStyle = '#76baae'; context.fillText('CONVERGENCE  99.98%', 844, 555);

    panel(context, 1098, 92, 408, 241, 'SPECTRAL TELEMETRY');
    for (let row = 0; row < 4; row++) line(context, [[1120, 159 + row * 42], [1482, 159 + row * 42]], '#233f4d', 1);
    for (let signal = 0; signal < 2; signal++) {
      line(context, Array.from({ length: 145 }, (_, index) => [1120 + index * 2.5, 236 + Math.sin(index * .105 + signal) * 21 + Math.sin(index * .29) * 8 - Math.exp(-(((index - 59 - signal * 22) / 6) ** 2)) * 71]), signal ? '#c5b988' : '#76c9ca', 2);
    }
    panel(context, 1098, 350, 408, 248, 'PARALLEL COMPUTE');
    ['FIELD SOLVER', 'ARCHIVE INDEX', 'NEURAL ENGINE'].forEach((name, index) => {
      const y = 419 + index * 56;
      context.fillStyle = '#a6c4c9'; context.font = '16px sans-serif'; context.fillText(name, 1117, y);
      context.fillStyle = '#1c3946'; context.fillRect(1117, y + 12, 364, 7);
      context.fillStyle = ['#7ac2c5', '#668aa7', '#a4bda7'][index]; context.fillRect(1117, y + 12, [298, 204, 325][index], 7);
    });
    context.fillStyle = '#597984'; context.font = '13px monospace'; context.fillText('PERSONAL RESEARCH ENVIRONMENT', 31, 624);
    context.fillText('ALL SYSTEMS NOMINAL', 1312, 624);
  });
}

function auxiliaryDashboard(side: 'left' | 'right') {
  return dashboardTexture(512, 640, context => {
    context.fillStyle = '#091721'; context.fillRect(0, 0, 512, 640);
    context.fillStyle = '#a8d9d8'; context.font = '600 24px sans-serif'; context.fillText(side === 'left' ? 'FIELD ARCHIVE' : 'RESEARCH AGENT', 25, 44);
    line(context, [[24, 66], [488, 66]], '#345e6b');
    if (side === 'left') {
      context.fillStyle = '#819fa8'; context.font = '18px sans-serif'; context.fillText('STRUCTURE / 128 NODES', 25, 102);
      for (let index = 0; index < 32; index++) {
        const y = 150 + index * 8;
        const x1 = 256 + Math.sin(index * .34) * 132;
        const x2 = 256 + Math.sin(index * .34 + Math.PI) * 132;
        line(context, [[x1, y], [x2, y]], '#355c70', 2);
        for (const [x, color] of [[x1, '#83cdd2'], [x2, '#b6c8a9']] as const) {
          context.fillStyle = color; context.beginPath(); context.arc(x, y, 5, 0, Math.PI * 2); context.fill();
        }
      }
      panel(context, 24, 455, 464, 145, 'REFERENCE LIBRARY');
      context.font = '17px monospace'; context.fillStyle = '#9bb7c3';
      ['01  Resonance atlas', '02  Field observations', '03  Material memory'].forEach((label, index) => context.fillText(label, 42, 518 + index * 28));
    } else {
      context.fillStyle = '#7699a4'; context.font = '18px sans-serif'; context.fillText('LOCAL / PRIVATE COMPUTE', 25, 103);
      for (let index = 0; index < 4; index++) {
        const y = 137 + index * 96;
        panel(context, 24, y, 464, 78, ['MODEL RECONSTRUCTION', 'CROSS-REFERENCE', 'SOLVER CONFIDENCE', 'MEMORY ALLOCATION'][index]);
        context.font = '22px monospace'; context.fillStyle = index === 2 ? '#9ed2ad' : '#a9c8cf';
        context.fillText(['COMPLETE', '124 SOURCES', '99.98 %', '64 / 256 TB'][index], 42, y + 59);
      }
      line(context, Array.from({ length: 50 }, (_, i) => [30 + i * 9.2, 565 + Math.sin(i * .3) * 11 + Math.cos(i * .73) * 7]), '#69b7b6', 2);
      context.font = '16px monospace'; context.fillStyle = '#819fa8'; context.fillText('READY FOR NEXT QUERY', 32, 612);
    }
  });
}

function touchDashboard() {
  return dashboardTexture(1024, 384, context => {
    context.fillStyle = '#0b1b26'; context.fillRect(0, 0, 1024, 384);
    context.fillStyle = '#8fc3c7'; context.font = '19px sans-serif'; context.fillText('ATLAS / TOUCH DECK', 31, 38);
    for (let row = 0; row < 3; row++) for (let column = 0; column < 12; column++) {
      const x = 30 + column * 56 + row * 7, y = 65 + row * 69;
      context.fillStyle = '#102c38'; context.fillRect(x, y, 47, 54);
      context.strokeStyle = '#39606d'; context.lineWidth = 1; context.strokeRect(x, y, 47, 54);
      context.fillStyle = '#87afb7'; context.font = '22px monospace'; context.fillText(['QWERTYUIOP[]', 'ASDFGHJKL;<>', 'ZXCVBNM,./↵ '][row][column] ?? '', x + 15, y + 33);
    }
    context.strokeStyle = '#3f6b77'; context.strokeRect(158, 287, 408, 48);
    context.strokeRect(754, 63, 239, 272);
    line(context, [[821, 199], [926, 199]], '#477c89', 1);
    line(context, [[873, 146], [873, 251]], '#477c89', 1);
    context.strokeStyle = '#68afb6'; context.beginPath(); context.arc(873, 199, 54, 0, Math.PI * 2); context.stroke();
    context.fillStyle = '#83b5bf'; context.font = '16px sans-serif'; context.fillText('SPATIAL INPUT', 810, 316);
    context.fillStyle = '#365a6a'; context.fillRect(29, 361, 964, 2);
  });
}

/** A cylindrical segment with smooth normals, preserving the interface's original UVs. */
function curvedPanel(width: number, height: number, depth: number, thickness = 0) {
  const geometry = thickness
    ? new THREE.BoxGeometry(width, height, thickness, 64, 2, 1)
    : new THREE.PlaneGeometry(width, height, 64, 2);
  const vertices = geometry.getAttribute('position');
  const radius = 1.55;
  for (let index = 0; index < vertices.count; index++) {
    const angle = vertices.getX(index) / radius;
    vertices.setXYZ(index, Math.sin(angle) * radius, vertices.getY(index), vertices.getZ(index) + depth + radius * (1 - Math.cos(angle)));
  }
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Self-contained 1.31 m × 0.52 m desktop assembly, origin on the desk and all faces toward +Z.
 * All resources are attached to descendant meshes; room traversal owns their disposal.
 */
export function createAdvancedWorkstation(): THREE.Group {
  const group = new THREE.Group();
  group.name = ADVANCED_WORKSTATION_SPEC.model;
  group.userData.advancedWorkstation = { ...ADVANCED_WORKSTATION_SPEC };
  const hardware = new HardwareBuilder();
  const titanium = new THREE.MeshStandardMaterial({ color: '#9cabad', metalness: .86, roughness: .29 }); titanium.name = 'satin titanium';
  const graphite = new THREE.MeshStandardMaterial({ color: '#16212a', metalness: .68, roughness: .31 }); graphite.name = 'graphite alloy';
  const rubber = new THREE.MeshStandardMaterial({ color: '#090f14', roughness: .86 }); rubber.name = 'recessed vents';
  const glass = new THREE.MeshPhysicalMaterial({ color: '#1a3544', roughness: .17, metalness: .32, clearcoat: 1, clearcoatRoughness: .1 }); glass.name = 'touch glass';
  const status = new THREE.MeshStandardMaterial({ color: '#6dbabd', emissive: '#4c9a9e', emissiveIntensity: .6, roughness: .3 }); status.name = 'status light';

  // Open cantilever arm, cable channel and a low, tapered-looking twin foot.
  hardware.box(graphite, 0, .015, -.105, .36, .03, .19, .012);
  hardware.box(titanium, 0, .032, -.12, .22, .014, .125);
  for (const x of [-.151, .151]) hardware.box(rubber, x, .003, -.105, .045, .006, .14, .002);
  hardware.tube(titanium, [point(0, .037, -.14), point(0, .12, -.171), point(0, .248, -.175), point(0, .322, -.123)], .018);
  hardware.tube(graphite, [point(.006, .04, -.159), point(.006, .12, -.19), point(.006, .245, -.194), point(.006, .316, -.149)], .006);
  hardware.box(graphite, 0, .328, -.132, .205, .067, .024);
  hardware.box(titanium, 0, .311, -.123, 1.065, .02, .025);

  hardware.add(curvedPanel(.882, .343, -.101, .022), titanium, point(0, .444, 0));
  hardware.add(curvedPanel(.865, .328, -.087, .006), graphite, point(0, .444, 0));
  const addDisplay = (name: string, geometry: THREE.BufferGeometry, texture: THREE.Texture, position: THREE.Vector3, rotation = new THREE.Euler()) => {
    const material = new THREE.MeshStandardMaterial({ color: '#b9d3d7', map: texture, emissiveMap: texture, emissive: '#c1e0e0', emissiveIntensity: .62, roughness: .36, metalness: .08 });
    material.name = name;
    const mesh = new THREE.Mesh(geometry, material); mesh.position.copy(position); mesh.rotation.copy(rotation);
    mesh.name = name; mesh.userData.workstationDisplay = true; group.add(mesh);
  };
  addDisplay('Atlas curved ultrawide display', curvedPanel(.846, .307, -.082), mainDashboard(), point(0, .444, 0));
  // A discreet camera and status indicator are real millimetre-scale hardware.
  hardware.box(graphite, 0, .62, -.085, .034, .012, .013, .004);
  hardware.add(new THREE.SphereGeometry(.004, 10, 6), glass, point(0, .62, -.077));
  hardware.box(status, .034, .284, -.077, .03, .0018, .002, .0009);
  for (const side of [-1, 1] as const) {
    const rotation = new THREE.Euler(0, -side * .34, 0);
    const position = point(side * .535, .421, -.043);
    hardware.box(titanium, position.x, position.y, position.z, .238, .322, .017, .006, rotation);
    const front = point(0, 0, .009).applyEuler(rotation).add(position);
    hardware.box(graphite, front.x, front.y, front.z, .229, .313, .003, .002, rotation);
    const screen = point(0, 0, .012).applyEuler(rotation).add(position);
    addDisplay(side === -1 ? 'Atlas archive auxiliary display' : 'Atlas research agent auxiliary display', new THREE.PlaneGeometry(.213, .289), auxiliaryDashboard(side === -1 ? 'left' : 'right'), screen, rotation);
    hardware.box(graphite, side * .424, .312, -.087, .027, .058, .025, .006);
  }

  // A thin glass input surface with visible layered edges, rather than a mechanical keyboard.
  hardware.box(titanium, -.032, .015, .195, .666, .02, .239, .011);
  hardware.box(glass, -.032, .029, .195, .658, .009, .231, .005);
  addDisplay('Atlas glass touch input', new THREE.PlaneGeometry(.626, .203), touchDashboard(), point(-.032, .0341, .195), new THREE.Euler(-Math.PI / 2, 0, 0));
  group.children[group.children.length - 1].userData.workstationDisplay = false;
  group.children[group.children.length - 1].userData.workstationTouchSurface = true;
  hardware.box(status, -.032, .03, .313, .175, .0015, .0015, .0007);
  // A machined stylus rests to the left, with a narrow charging cradle.
  hardware.box(graphite, -.414, .012, .195, .034, .02, .219, .005);
  hardware.add(new THREE.CylinderGeometry(.0048, .0048, .188, 12), titanium, point(-.414, .026, .191), new THREE.Euler(Math.PI / 2, 0, 0));
  hardware.add(new THREE.ConeGeometry(.0048, .018, 12), graphite, point(-.414, .026, .294), new THREE.Euler(Math.PI / 2, 0, 0));

  // A separate compact compute dock: fin slots, a lit edge, ports and a tactile encoder.
  hardware.box(graphite, .486, .052, .194, .173, .098, .223, .011);
  hardware.box(titanium, .486, .103, .194, .166, .009, .214, .004);
  for (let index = 0; index < 9; index++) {
    hardware.box(rubber, .417 + index * .017, .066, .307, .008, .039, .002, .001);
    hardware.box(rubber, .574, .039 + index * .005, .169, .002, .002, .118, .0007);
  }
  hardware.add(new THREE.CylinderGeometry(.028, .028, .012, 40), graphite, point(.486, .115, .16));
  hardware.add(new THREE.CylinderGeometry(.023, .025, .016, 40), titanium, point(.486, .127, .16));
  hardware.add(new THREE.TorusGeometry(.032, .0013, 6, 48), status, point(.486, .109, .16), new THREE.Euler(-Math.PI / 2, 0, 0));
  hardware.box(status, .486, .027, .306, .099, .002, .002, .001);
  hardware.box(rubber, .466, .065, .308, .027, .007, .003, .001);
  hardware.box(rubber, .51, .065, .308, .013, .009, .003, .001);
  hardware.finish(group);
  // A suspended molecular model makes the dock a volumetric research interface.
  const projection = new THREE.Group(); projection.name='Atlas volumetric model'; projection.position.set(.486,.257,.16);
  const orbitPoints: number[]=[];
  for(let ring=0;ring<3;ring++)for(let i=0;i<64;i++)for(const step of[i,i+1]) {
    const a=step/64*Math.PI*2;
    const p=point(Math.cos(a)*.073,Math.sin(a)*.073,0).applyEuler(new THREE.Euler(ring*.72,ring*.93,.3));
    orbitPoints.push(p.x,p.y,p.z);
  }
  const orbitGeometry=new THREE.BufferGeometry(); orbitGeometry.setAttribute('position',new THREE.Float32BufferAttribute(orbitPoints,3));
  projection.add(new THREE.LineSegments(orbitGeometry,new THREE.LineBasicMaterial({color:'#61e5df',transparent:true,opacity:.65,depthWrite:false})));
  const molecularPoints:number[]=[];
  for(let i=0;i<26;i++){const a=i*.57;for(const side of[-1,1])molecularPoints.push(Math.cos(a)*.033*side,(i/25-.5)*.115,Math.sin(a)*.033*side);}
  const cloudGeometry=new THREE.BufferGeometry(); cloudGeometry.setAttribute('position',new THREE.Float32BufferAttribute(molecularPoints,3));
  projection.add(new THREE.Points(cloudGeometry,new THREE.PointsMaterial({color:'#a8ffed',size:.007,transparent:true,opacity:.9,depthWrite:false})));
  projection.children.forEach(object => object.layers.set(1));
  group.add(projection);
  return group;
}
