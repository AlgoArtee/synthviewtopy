import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** A dimensional seasonal light sculpture, in metres above the central chip. */
export function createCityRobotPumpkin() {
  const group = new THREE.Group();
  group.name = 'Halloween · central chip robot pumpkin projection';
  group.visible = false;
  const head = new THREE.Group();
  head.name = 'Giant segmented robot jack-o-lantern';
  head.position.y = 17;
  head.rotation.set(-.40, -Math.PI / 2, 0, 'YXZ');
  head.scale.setScalar(10.5);
  group.add(head);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const geometry = <T extends THREE.BufferGeometry>(g: T) => { geometries.add(g); return g; };
  const material = <T extends THREE.Material>(m: T) => { materials.add(m); return m; };
  const common = { uTime: { value: 0 }, uFog: { value: .008 }, uPower: { value: 1 } };
  const shell = material(new THREE.ShaderMaterial({
    uniforms: common, transparent: true, depthWrite: false, toneMapped: false,
    vertexShader: `varying vec3 vNormal,vView; varying float vHeight;
      void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vView=-p.xyz;
        vNormal=normalize(normalMatrix*normal);vHeight=position.y;
        gl_Position=projectionMatrix*p;}`,
    fragmentShader: `uniform float uTime,uFog,uPower; varying vec3 vNormal,vView; varying float vHeight;
      void main(){float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),2.0);
        float scan=.72+.28*smoothstep(-.3,.8,sin(vHeight*230.0-uTime*2.0));
        float sweep=pow(max(0.0,1.0-abs(vHeight-(mod(uTime*.12,2.0)-1.0))/.055),2.0);
        float facet=.6+.4*max(0.0,dot(normalize(vNormal),normalize(vec3(-.4,.8,1.0))));
        vec3 light=mix(vec3(.30,.045,.006),vec3(1.0,.30,.025),rim)*facet;
        light+=vec3(.08,.65,.9)*sweep*.35;
        gl_FragColor=vec4(light*uPower*scan,(.43+rim*.40)*exp(-uFog*length(vView)));
        #include <colorspace_fragment>
      }`
  }));
  const glow = (color: string, opacity = .9) => material(new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, fog: false,
    blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide
  }));
  const amber = glow('#ff6a12'), cyan = glow('#48eaff'), hot = glow('#ffcc71');
  const recess = material(new THREE.MeshBasicMaterial({ color: '#100615', transparent: true,
    opacity: .82, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  const mesh = (parent: THREE.Object3D, name: string, g: THREE.BufferGeometry, m: THREE.Material, p = [0, 0, 0]) => {
    const object = new THREE.Mesh(geometry(g), m); object.name = name;
    object.position.set(p[0], p[1], p[2]); parent.add(object); return object;
  };
  const tracePositions: number[] = [], traceColors: number[] = [];
  const orangeColor = new THREE.Color('#ff801b'), cyanColor = new THREE.Color('#55eaff');
  const trace = (points: number[][], color = orangeColor) => {
    for (let i = 1; i < points.length; i++) {
      tracePositions.push(...points[i - 1], ...points[i]);
      traceColors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    }
  };
  const surface = (a: number, t: number) => {
    const r = .94 + .06 * Math.cos(a * 12);
    return [Math.cos(a) * Math.sin(t) * r, Math.cos(t) * .78, Math.sin(a) * Math.sin(t) * r];
  };
  // Twelve separate curved armor lobes retain a recognizable pumpkin silhouette.
  const plates: THREE.BufferGeometry[] = [];
  for (let lobe = 0; lobe < 12; lobe++) {
    const g = new THREE.SphereGeometry(1, 12, 24, lobe * Math.PI / 6 + .014, Math.PI / 6 - .028, .15, Math.PI - .30);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const a = Math.atan2(p.getZ(i), p.getX(i)), rib = .94 + .06 * Math.cos(a * 12);
      p.setXYZ(i, p.getX(i) * rib, p.getY(i) * .78, p.getZ(i) * rib);
    }
    g.computeVertexNormals(); plates.push(g);
    const seam = Array.from({ length: 49 }, (_, i) => surface(lobe * Math.PI / 6, .15 + i / 48 * (Math.PI - .30)));
    trace(seam);
  }
  mesh(head, 'Twelve translucent orange armor lobes', mergeGeometries(plates)!, shell);
  plates.forEach(g => g.dispose());
  // Mechanical crown and exposed piston stem, all rendered as projected light.
  mesh(head, 'Crown socket', new THREE.CylinderGeometry(.22, .30, .11, 12), shell, [0, .77, 0]);
  mesh(head, 'Cyan crown seal', new THREE.TorusGeometry(.25, .012, 6, 32), cyan, [0, .83, 0]).rotation.x = Math.PI / 2;
  const stem = mesh(head, 'Bent mechanical pumpkin stem', new THREE.CylinderGeometry(.085, .12, .36, 8), shell, [.06, 1.00, 0]);
  stem.rotation.z = -.32;
  for (let i = 0; i < 4; i++) {
    const ring = mesh(head, 'Stem induction collar', new THREE.TorusGeometry(.105 - i * .004, .012, 5, 16), i % 2 ? amber : cyan, [.02 + i * .025, .87 + i * .075, 0]);
    ring.rotation.set(Math.PI / 2, 0, -.32);
  }
  trace([[.10, 1.12, 0], [.17, 1.24, 0], [.32, 1.24, 0]], cyanColor);
  mesh(head, 'Stem antenna tip', new THREE.OctahedronGeometry(.045), cyan, [.32, 1.24, 0]);
  // Robot temple hubs, armor fasteners and angular cheek circuitry.
  for (const side of [-1, 1]) {
    const hub = mesh(head, 'Robot temple gear', new THREE.CylinderGeometry(.22, .22, .15, 12), shell, [side * .94, .05, 0]);
    hub.rotation.z = Math.PI / 2;
    mesh(head, 'Temple optical bearing', new THREE.TorusGeometry(.15, .018, 6, 24), cyan, [side * 1.025, .05, 0]).rotation.y = Math.PI / 2;
    for (let i = 0; i < 5; i++) {
      const a = -.9 + i * .45;
      mesh(head, 'Armor hex fastener', new THREE.SphereGeometry(.018, 6, 4), hot,
        [side * (.70 + .08 * Math.cos(a)), .49 * Math.sin(a), .55]);
    }
    trace([[side * .80, .29, .47], [side * .72, .19, .67], [side * .73, -.10, .68], [side * .64, -.19, .75]], cyanColor);
    trace([[side * .81, -.06, .46], [side * .84, -.24, .40], [side * .69, -.40, .53]], cyanColor);
  }
  const faceZ = (x: number, y: number) => Math.sqrt(Math.max(.06, .96 ** 2 - x * x - (y / .78) ** 2)) + .04;
  const face = (name: string, points: number[][], m: THREE.Material, lift = 0) => {
    const g = new THREE.ShapeGeometry(new THREE.Shape(points.map(p => new THREE.Vector2(p[0], p[1]))));
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, faceZ(pos.getX(i), pos.getY(i)) + lift);
    const object = mesh(head, name, g, m); object.renderOrder = 3;
    return object;
  };
  for (const side of [-1, 1]) {
    // Downward-slanting brow sockets and narrow hot optics make the face hostile.
    face('Angular black robot eye socket', [[side * .64, .37], [side * .14, .17], [side * .19, -.02], [side * .55, .02]], recess);
    face('Scowling amber eye', [[side * .59, .31], [side * .20, .15], [side * .24, .045], [side * .51, .08]], hot, .025);
    face('Vertical cyan optical pupil', [[side * .35, .205], [side * .31, .19], [side * .31, .06], [side * .35, .065]], cyan, .05);
    trace([[side * .63, .405, faceZ(side * .63, .405)], [side * .16, .23, faceZ(side * .16, .23)]], orangeColor);
  }
  face('Triangular nasal vent', [[-.09, -.10], [0, .055], [.09, -.10]], recess);
  const mouth = [[-.62,-.18],[-.43,-.25],[-.29,-.20],[-.14,-.27],[0,-.22],[.14,-.27],[.29,-.20],[.43,-.25],[.62,-.18],[.50,-.43],[.30,-.56],[0,-.60],[-.30,-.56],[-.50,-.43]];
  face('Deep serrated mechanical snarl', mouth, recess, .025);
  trace([...mouth, mouth[0]].map(([x, y]) => [x, y, faceZ(x, y) + .045]));
  for (const side of [-1, 1]) {
    face('Long upper robotic fang', [[side*.48,-.25],[side*.33,-.23],[side*.34,-.46]], hot, .07);
    face('Lower outer robotic fang', [[side*.41,-.46],[side*.27,-.52],[side*.26,-.36]], hot, .07);
    face('Upper inner serration', [[side*.23,-.25],[side*.10,-.30],[side*.17,-.40]], amber, .07);
    face('Lower inner serration', [[side*.19,-.55],[side*.03,-.57],[side*.07,-.40]], hot, .07);
  }
  trace([[-.20,.55,.61],[-.11,.45,.76],[.11,.45,.76],[.20,.55,.61]], cyanColor);
  const traces = geometry(new THREE.BufferGeometry());
  traces.setAttribute('position', new THREE.Float32BufferAttribute(tracePositions, 3));
  traces.setAttribute('color', new THREE.Float32BufferAttribute(traceColors, 3));
  const traceMaterial = material(new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .9,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
  const lines = new THREE.LineSegments(traces, traceMaterial); lines.name = 'Armor seams and exposed robot circuitry'; head.add(lines);

  // A narrow source on the chip fans into a broad, translucent optical cone.
  const beam = material(new THREE.ShaderMaterial({ uniforms: common, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
    vertexShader: `varying vec2 vUv;varying float vDepth;void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.0);vDepth=length(p.xyz);gl_Position=projectionMatrix*p;}`,
    fragmentShader: `uniform float uTime,uFog,uPower;varying vec2 vUv;varying float vDepth;
      void main(){float strands=pow(.5+.5*sin(vUv.x*100.53),16.0);
        float rise=.7+.3*sin(vUv.y*34.0-uTime*1.3);
        gl_FragColor=vec4(vec3(.08,.65,1.0)*uPower,(.018+strands*.16)*(1.0-vUv.y*.8)*rise*exp(-uFog*vDepth));
        #include <colorspace_fragment>
      }`
  }));
  mesh(group, 'Chip-to-pumpkin projection beam', new THREE.CylinderGeometry(6.8, .7, 11, 64, 1, true), beam, [0, 5.55, 0]);
  const halos: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const halo = mesh(group, 'Segmented emitter focusing ring', new THREE.TorusGeometry(1.3 + i * .60, .035, 6, 80, Math.PI * 1.75), i === 1 ? amber : cyan, [0, .12 + i * .15, 0]);
    halo.rotation.x = Math.PI / 2; halos.push(halo);
  }
  let elapsed = 0, disposed = false;
  return {
    group,
    update(delta: number, reducedMotion: boolean, fog: number, power: number) {
      if (disposed || !group.visible) return;
      if (!reducedMotion) elapsed += Math.min(.1, Math.max(0, delta));
      common.uTime.value = elapsed; common.uFog.value = fog; common.uPower.value = power;
      head.position.y = 17 + Math.sin(elapsed * .65) * .24;
      head.rotation.y = -Math.PI / 2 + Math.sin(elapsed * .21) * .10;
      halos.forEach((halo, i) => { halo.rotation.z = elapsed * (i % 2 ? -.13 : .10) + i * 2.1; });
      const transmission = Math.exp(-fog * 48);
      for (const m of [amber, cyan, hot]) m.opacity = Math.min(1, .96 * transmission * power);
      traceMaterial.opacity = Math.min(1, transmission * power);
    },
    snapshot: () => ({ active: group.visible, kind: 'giant robot pumpkin', width: 23, height: 30,
      origin: group.getWorldPosition(new THREE.Vector3()).toArray(), animationTime: elapsed }),
    dispose() {
      if (disposed) return; disposed = true; group.removeFromParent();
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
    }
  };
}
