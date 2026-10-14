import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createGhostPortrait } from './osCityGhostFace';

const clothWind = `
  vec3 drapeWind(vec3 p, float amount, float phase, float time) {
    float freeHem = pow(clamp((1.22 - p.y) / 1.26, 0.0, 1.0), 1.45);
    float theta = atan(p.z, p.x);
    float breath = sin(time * .36 + phase);
    p.x += amount * freeHem * (.135 * sin(time * .51 - p.y * 3.1 + phase) + .055 * sin(time * .83 - p.y * 6.3 + theta * 1.5 + phase));
    p.z += amount * freeHem * (.10 * cos(time * .39 - p.y * 3.7 + phase) + .035 * sin(theta * 3.0 + time * .67 - p.y * 4.1));
    p.y += amount * freeHem * freeHem * (.025 + .025 * breath + .027 * sin(theta * 4.0 - time * .62 + phase));
    return p;
  }
`;

/** Transparent spectral gowns: authored drape, traveling wind, and curved luminous embroidery. */
export function createCityGhostHolograms() {
  const group = new THREE.Group(); group.name = 'North City · filigree ghosts in wind';
  const time = { value: 0 };
  const figures: {root: THREE.Group; phase: number; x: number; y: number; yaw: number; probe: THREE.Vector3; portrait: ReturnType<typeof createGhostPortrait>; blink: number; variant: number}[] = [];
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const profile = new THREE.CatmullRomCurve3([
    v(.46,-.045,.72),v(.45,.09,.70),v(.39,.29,.70),v(.31,.51,.69),
    v(.22,.74,.68),v(.15,.94,.70),v(.098,1.085,.72),v(.129,1.22,.74),
    v(.174,1.335,.68),v(.195,1.405,.62),v(.148,1.452,.63),v(.058,1.50,.82),
  ], false, 'catmullrom', .35);

  function drapePoint(u: number, t: number, layer = 0) {
    const p = profile.getPoint(t), theta = u * Math.PI * 2;
    const hem = THREE.MathUtils.clamp((1.2-p.y)/1.25,0,1);
    const fold = 1 + (.035 + hem*.12) * (.56*Math.sin(theta*11+p.y*1.8) + .28*Math.sin(theta*17.0-p.y*3.7+.8) + .16*Math.cos(theta*5.0+p.y*2.2));
    const radius = (p.x + layer*.022) * fold;
    return v(Math.cos(theta)*radius, p.y + hem*hem*.018*Math.sin(theta*5.0+.7), Math.sin(theta)*radius*p.z - hem*hem*.075);
  }

  function gown(layer: number) {
    const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
    const around = 112, rows = 58;
    for(let j=0;j<=rows;j++)for(let i=0;i<=around;i++){
      const u=i/around,t=j/rows,p=drapePoint(u,t,layer);
      positions.push(p.x,p.y,p.z);uvs.push(u,t);
    }
    for(let j=0;j<rows;j++)for(let i=0;i<around;i++){
      const a=j*(around+1)+i,b=a+around+1;indices.push(a,b,a+1,b,b+1,a+1);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();geometry.boundingSphere!.radius+=.4;return geometry;
  }

  function material(color: string, opacity: number, wind: number, phase: number, detail = 1) {
    const shaderMaterial=new THREE.ShaderMaterial({
      uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uTime:time,uColor:{value:new THREE.Color(color)},uOpacity:{value:opacity},uWind:{value:wind},uPhase:{value:phase},uDetail:{value:detail}}]),
      vertexShader:`uniform float uTime; uniform float uWind; uniform float uPhase;
        varying vec2 vUv; varying vec3 vViewPosition; varying float vHeight;
        #include <fog_pars_vertex>
        ${clothWind}
        void main(){vUv=uv;vec3 transformed=drapeWind(position,uWind,uPhase,uTime);vHeight=transformed.y;
          vec4 mvPosition=modelViewMatrix*vec4(transformed,1.0);vViewPosition=mvPosition.xyz;gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader:`uniform vec3 uColor; uniform float uOpacity; uniform float uDetail; uniform float uTime; uniform float uPhase;
        varying vec2 vUv; varying vec3 vViewPosition; varying float vHeight;
        #include <fog_pars_fragment>
        void main(){
          vec3 n=normalize(cross(dFdx(vViewPosition),dFdy(vViewPosition)));
          float rim=pow(1.0-abs(dot(n,normalize(-vViewPosition))),1.65);
          float curve=sin(vUv.x*50.2655+sin(vUv.y*7.5+uPhase)*.95+sin(vUv.y*15.0-uTime*.20)*.17);
          float line=1.0-smoothstep(.016,.016+fwidth(curve)*1.25,abs(curve));
          float lace=line*(.44+.56*pow(.5+.5*sin(vUv.y*16.0+vUv.x*12.566),2.0));
          float alpha=uOpacity*(.095+rim*.76+lace*.22*min(uDetail,1.0));
          if(uDetail>1.5)alpha=uOpacity*(.66+rim*.34);
          if(uDetail<-.5)alpha=uOpacity*(.24+rim*.43);
          float hemFade=smoothstep(-.09,.055,vHeight);alpha*=mix(1.0,hemFade,step(.5,uDetail));
          #ifdef USE_FOG
            #ifdef FOG_EXP2
              alpha*=exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
            #else
              alpha*=1.0-smoothstep(fogNear,fogFar,vFogDepth);
            #endif
          #endif
          if(alpha<.001)discard;
          vec3 glow=mix(uColor,vec3(.82,.94,1.0),rim*.28)*(1.25+rim*.55);
          if(uDetail<-.5){float sculpt=.48+.52*max(0.0,dot(n,normalize(vec3(-.45,.75,1.0))));glow*=sculpt;}
          gl_FragColor=vec4(glow,alpha);
        }`,
      transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false,fog:true,forceSinglePass:true,
    });
    shaderMaterial.uniforms.uTime=time;return shaderMaterial;
  }

  function mesh(root: THREE.Group, name: string, geometry: THREE.BufferGeometry, mat: THREE.Material) {
    const object=new THREE.Mesh(geometry,mat);object.name=name;object.frustumCulled=false;root.add(object);return object;
  }
  function ellipsoid(radius: number, x: number, y: number, z: number, sx=1, sy=1, sz=1) {
    const g=new THREE.SphereGeometry(radius,32,24);g.scale(sx,sy,sz);g.translate(x,y,z);return g;
  }
  function join(parts: THREE.BufferGeometry[]) {
    const flat=parts.map(g=>{const n=g.index?g.toNonIndexed():g;if(n!==g)g.dispose();return n;});
    const geometry=mergeGeometries(flat,false)!;flat.forEach(g=>g.dispose());return geometry;
  }
  function ribbon(points: THREE.Vector3[], width: number) {
    const curve=new THREE.CatmullRomCurve3(points),pos: number[]=[],uv: number[]=[],indices: number[]=[];
    for(let j=0;j<=72;j++){
      const t=j/72,p=curve.getPoint(t),tangent=curve.getTangent(t),side=new THREE.Vector3().crossVectors(tangent,v(0,0,1)).normalize();
      if(side.lengthSq()<.1)side.set(1,0,0);
      const w=width*(.45+.55*Math.sin(Math.PI*t));
      for(const s of [-1,1]){pos.push(p.x+side.x*w*s,p.y+side.y*w*s,p.z+side.z*w*s);uv.push((s+1)/2,t);}
      if(j<72){const a=j*2;indices.push(a,a+2,a+1,a+2,a+3,a+1);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
  }

  function figure(name: string, color: string, x: number, y: number, z: number, scale: number, phase: number, yaw: number) {
    const root=new THREE.Group();root.name=name;root.position.set(x,y,z);root.scale.setScalar(scale);group.add(root);
    // Body is deliberately slender and translucent; the continuous dress covers the legs.
    const skin=material(color,.44,0,phase,0);
    const body=join([
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([v(-.172,1.413,0),v(-.255,1.30,.025),v(-.32,1.16,.07),v(-.43,1.19,.11)]),28,.025,10,false),
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([v(.172,1.413,0),v(.25,1.28,.015),v(.29,1.15,.055),v(.425,1.27,.12)]),28,.024,10,false),
      ellipsoid(.025,-.441,1.194,.11,.70,1.45,.60),ellipsoid(.025,.438,1.282,.12,.70,1.45,.60),
    ]);
    mesh(root,'Ghost · slender neck and softly posed arms',body,skin);
    const variant=figures.length,portrait=createGhostPortrait(color,variant);root.add(portrait.head);
    mesh(root,'Ghost gown · continuous flowing full-length gauze',gown(0),material(color,.46,1,phase,1));
    mesh(root,'Ghost gown · offset translucent inner silk',gown(-.65),material(color,.10,.74,phase+.55,1));

    // A rear veil opens around the shoulders and trails behind the hem, rather than sealing a cone.
    const veilPos: number[]=[],veilUv: number[]=[],veilIndices: number[]=[];
    const veilRows=60,veilAcross=52;
    for(let j=0;j<=veilRows;j++)for(let i=0;i<=veilAcross;i++){
      const t=j/veilRows,u=i/veilAcross,theta=Math.PI*(1.04+u*.92),radius=.22+(t*t)*.37;
      veilPos.push(Math.cos(theta)*radius,1.45-t*1.46+.035*Math.sin(u*9)*t*t,Math.sin(theta)*radius*.68-.025-t*t*.20);veilUv.push(u,1-t);
    }
    for(let j=0;j<veilRows;j++)for(let i=0;i<veilAcross;i++){const a=j*(veilAcross+1)+i,b=a+veilAcross+1;veilIndices.push(a,b,a+1,b,b+1,a+1);}
    const veil=new THREE.BufferGeometry();veil.setAttribute('position',new THREE.Float32BufferAttribute(veilPos,3));veil.setAttribute('uv',new THREE.Float32BufferAttribute(veilUv,2));veil.setIndex(veilIndices);veil.computeVertexNormals();
    mesh(root,'Ghost · trailing shoulder veil',veil,material(color,.19,1.28,phase-.65,1));

    // Meridians use fine curved ribbons, never the former triangular wire lattice.
    const threads: THREE.BufferGeometry[]=[];
    for(let i=0;i<14;i++){
      const points: THREE.Vector3[]=[];
      for(let j=0;j<=30;j++){const t=j/30,u=i/14+Math.sin(t*5.5+phase+i*.57)*.018;points.push(drapePoint(u,t,.19));}
      threads.push(ribbon(points,.0027+(i%3)*.00055));
    }
    const hemPoints: THREE.Vector3[]=[];for(let i=0;i<=140;i++)hemPoints.push(drapePoint(i/140,.04,.19));threads.push(ribbon(hemPoints,.003));
    mesh(root,'Ghost · fine luminous filigree threads and floating hem',join(threads),material(color,.40,1,phase,2));

    const halo=new THREE.Mesh(new THREE.TorusGeometry(.38,.003,5,80),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.12,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));halo.rotation.x=Math.PI/2;halo.position.y=-.025;halo.name='Ghost · faint projector halo';root.add(halo);
    root.userData.ghost={longDress:true,translucentLayers:3,filigreeStrands:14,face:portrait.head.userData.portrait.features,motion:'Independent natural eyelid blinks, slow head turns/nods/tilts and traveling wind with offset veil and hair phases'};
    figures.push({root,phase,x,y,yaw,probe:drapePoint(.21,.10),portrait,blink:0,variant});
  }
  figure('Cyan ghost in a long wind-blown gown · right skyline','#8be8ff',.72,-.8,-35,3.15,.55,.35);
  figure('Pink ghost in a long wind-blown gown · left skyline','#ffc0ee',-6.3,-1.7,-49,3.2,2.15,-.28);

  const snapshot={faceDetail:'Reference-matched photographic spectral faces on sculpted relief, luminous irises, anatomical nose/lips and swept-back hair',style:'Filigree ghosts in long wind-blown dresses',yaw:[] as number[],clothProbe:[] as number[][],sway:[] as number[][],blink:[] as number[],headPose:[] as number[][]};
  // Unequal deterministic intervals keep the two figures from blinking in unison.
  function blinkAt(elapsed:number,variant:number) {
    const intervals=variant?[5.2,3.9,6.7,4.5]:[4.1,5.8,3.7,6.3];
    const period=intervals.reduce((a,b)=>a+b,0);
    let t=(Math.max(0,elapsed)+(variant?1.23:.46))%period;
    for(const interval of intervals){
      if(t<interval){const age=t-(interval-.29);if(age<0)return 0;
        if(age<.085)return THREE.MathUtils.smoothstep(age,0,.085);
        if(age<.115)return 1;
        return 1-THREE.MathUtils.smoothstep(age,.115,.29);
      }t-=interval;
    }return 0;
  }
  function update(elapsed: number) {
    time.value=elapsed;
    figures.forEach(h=>{
      h.root.rotation.set(.008*Math.sin(elapsed*.22+h.phase),h.yaw+Math.sin(elapsed*.19+h.phase)*.10,.018*Math.sin(elapsed*.31+h.phase));
      h.root.position.x=h.x+.035*Math.sin(elapsed*.24+h.phase);
      h.root.position.y=h.y+.035*Math.sin(elapsed*.29+h.phase);
      h.portrait.head.rotation.set(.030*Math.sin(elapsed*.32+h.phase)+.012*Math.sin(elapsed*.71+h.phase),
        .105*Math.sin(elapsed*.23+h.phase+.7)+.035*Math.sin(elapsed*.41+h.phase),
        .025*Math.sin(elapsed*.28+h.phase+1.1));
      h.blink=blinkAt(elapsed,h.variant);h.portrait.setBlink(h.blink);h.portrait.setTime(elapsed);
    });
    snapshot.blink=figures.map(h=>+h.blink.toFixed(4));
    snapshot.headPose=figures.map(h=>h.portrait.head.rotation.toArray().slice(0,3).map(n=>+Number(n).toFixed(5)));
    snapshot.yaw=figures.map(h=>+h.root.rotation.y.toFixed(4));
    snapshot.sway=figures.map(h=>[+h.root.position.x.toFixed(4),+h.root.position.y.toFixed(4),+h.root.rotation.z.toFixed(4)]);
    snapshot.clothProbe=figures.map(h=>{
      const p=h.probe.clone(),free=Math.pow(THREE.MathUtils.clamp((1.22-p.y)/1.26,0,1),1.45),theta=Math.atan2(p.z,p.x),y=p.y;
      p.x+=free*(.135*Math.sin(elapsed*.51-y*3.1+h.phase)+.055*Math.sin(elapsed*.83-y*6.3+theta*1.5+h.phase));
      p.z+=free*(.10*Math.cos(elapsed*.39-y*3.7+h.phase)+.035*Math.sin(theta*3+elapsed*.67-y*4.1));
      p.y+=free*free*(.025+.025*Math.sin(elapsed*.36+h.phase)+.027*Math.sin(theta*4-elapsed*.62+h.phase));
      return p.toArray().map(n=>+n.toFixed(5));
    });
  }
  update(0);return {group,update,snapshot,ready:Promise.all(figures.map(h=>h.portrait.ready)).then(()=>undefined)};
}
