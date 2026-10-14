import * as THREE from 'three';
import { getCityWeatherPreset, type CityTimeOfDay, type OsCityWeather } from './osCityWeather';
import { createCityNeonAtmosphere } from './osCityNeonAtmosphere';
import { sampleCityDistantNeonPulse } from './osCityDistantNeon';
import { createOsCityTransit, CITY_TRANSIT_SPEED } from './osCityTransit';
import { createCityStreamClock } from './osCityStreamClock';
import { CITY_PLAZA_SCALE, CITY_CIRCUIT_COLORS, plazaX, plazaZ } from './osCityPlazaLayout';

/** Small, independently animated details in the balcony's dimensional market. */
export function createOsCityPlazaLife(circuitTraces?: number[][][], circuitColors?: string[]): THREE.Group {
  const life = new THREE.Group();
  life.name = 'Circuit Market · walking residents, illuminated transit and flowing circuitry';
  const neonAtmosphere=createCityNeonAtmosphere('Circuit market moving life and lamps');
  // The slab top is -14.02 m. Keep support 2 mm above it to avoid depth noise.
  const floorY = -14.018;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const streamClock=createCityStreamClock();
  life.userData.setStreamSpeed=streamClock.setSpeed;life.userData.getStreamSpeed=streamClock.getSpeed;
  let weather: OsCityWeather = 'rain',timeOfDay:CityTimeOfDay='day', animationTime = 0, lightTime = 0, wetness = 1;
  let seed = 190813;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  function geometry<T extends THREE.BufferGeometry>(g: T): T { geometries.add(g); return g; }
  function atmosphere<T extends THREE.Material>(material: T): T {
    materials.add(material); return material;
  }
  const cloth = atmosphere(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .92, metalness: .02, emissive: '#496579', emissiveIntensity: .12 }));
  const skin = atmosphere(new THREE.MeshStandardMaterial({ color: '#ad9480', roughness: .87, emissive: '#745d4d', emissiveIntensity: .20 }));
  const boots = atmosphere(new THREE.MeshStandardMaterial({ color: '#0c1821', roughness: .77 }));
  const hairMaterial = atmosphere(new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.98,emissive:'#1c2530',emissiveIntensity:.035}));
  const steel = atmosphere(new THREE.MeshStandardMaterial({ color: '#2a404d', metalness: .73, roughness: .36 }));
  const cyan = atmosphere(new THREE.MeshStandardMaterial({ color: '#93eeff', emissive: '#4ddeff', emissiveIntensity: 2.0, roughness: .34 }));
  const eyeLight = atmosphere(new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }));
  neonAtmosphere.register(cyan,'neon','Steady cyan reflective clothing accents');neonAtmosphere.register(eyeLight,'neon','Travelling circuit light packets');
  const up = v(0, 1, 0), xAxis = v(1, 0, 0), matrix = new THREE.Matrix4(), part = new THREE.Matrix4();
  const rotation = new THREE.Quaternion(), position = new THREE.Vector3(), scale = new THREE.Vector3();

  function mesh(g: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(g, material); object.position.set(x, y, z); parent.add(object); return object;
  }
  function box(parent: THREE.Object3D, material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number) {
    return mesh(geometry(new THREE.BoxGeometry(w, h, d)), material, parent, x, y, z);
  }
  function instances(name: string, g: THREE.BufferGeometry, mat: THREE.Material, count: number) {
    const object = new THREE.InstancedMesh(g, mat, count); object.name = name;
    object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Animated bounds are broad but finite; no CPU bounding-sphere rebuild per frame.
    object.boundingSphere = new THREE.Sphere(v(plazaX(35), floorY + 1, -5), 43*CITY_PLAZA_SCALE);
    life.add(object); return object;
  }

  // Open pedestrian lanes avoid all five raised processor installations and benches.
  const pathPoints = [
    [[25.4, -14.2], [42.6, -14.2], [43.2, 4.0], [25.0, 4.0]],
    [[12.3, -26.8], [58.0, -26.8], [58.0, -24.8], [12.3, -24.8]],
    [[12.2, 17.4], [57.0, 17.4], [57.0, 19.3], [12.2, 19.3]],
    [[55.2, -20.2], [58.3, -20.2], [58.3, 13.3], [55.2, 13.3]],
  ];
  const paths = pathPoints.map(points => new THREE.CatmullRomCurve3(points.map(([x, z]) => v(plazaX(x), floorY, plazaZ(z))), true, 'catmullrom', .05));
  const pathLengths = paths.map(path => path.getLength());
  const walkerCount = 48;
  const torso = instances('Residents · varied coats', geometry(new THREE.CapsuleGeometry(.18, .40, 3, 7)), cloth, walkerCount);
  const limbs = instances('Residents · articulated arms and legs', geometry(new THREE.CylinderGeometry(.058, .052, 1, 6)), cloth, walkerCount * 4);
  const heads = instances('Residents · heads', geometry(new THREE.SphereGeometry(.123, 7, 5)), skin, walkerCount);
  const hairCaps=instances('Residents · fitted hair caps',geometry(new THREE.SphereGeometry(.136,8,5,0,Math.PI*2,0,Math.PI*.60)),hairMaterial,walkerCount);
  const hairBacks=instances('Residents · bob and ponytail hair',geometry(new THREE.CapsuleGeometry(.075,.15,3,7)),hairMaterial,walkerCount);
  const shoes = instances('Residents · walking shoes', geometry(new THREE.BoxGeometry(.125, .075, .245)), boots, walkerCount * 2);
  const bags = instances('Residents · messenger bags', geometry(new THREE.BoxGeometry(.255, .34, .14)), steel, walkerCount);
  const trims = instances('Residents · reflective shoulder strips', geometry(new THREE.BoxGeometry(.29, .036, .021)), cyan, walkerCount);
  const umbrellaCount = 12;
  const umbrellas = instances('Residents · rain umbrellas', geometry(new THREE.SphereGeometry(.60, 10, 4, 0, Math.PI * 2, 0, Math.PI * .44)), steel, umbrellaCount);
  const umbrellaStems = instances('Residents · umbrella stems', geometry(new THREE.CylinderGeometry(.011, .011, .84, 5)), steel, umbrellaCount);
  const coatColors = ['#182737', '#4c5360', '#7e685c', '#314954', '#254855', '#534357'];
  const hairColors=['#111822','#34251e','#72503b','#8b8277','#352b42','#1b323e'];
  const walkers = Array.from({ length: walkerCount }, (_, index) => {
    const pathIndex = index < 20 ? 0 : index < 30 ? 1 : index < 40 ? 2 : 3;
    const members = pathIndex === 0 ? 20 : pathIndex === 3 ? 8 : 10;
    const localIndex = pathIndex === 0 ? index : pathIndex === 1 ? index - 20 : pathIndex === 2 ? index - 30 : index - 40;
    const color = new THREE.Color(coatColors[index % coatColors.length]);
    torso.setColorAt(index, color); for (let limb = 0; limb < 4; limb++) limbs.setColorAt(index * 4 + limb, color);
    hairCaps.setColorAt(index,new THREE.Color(hairColors[index%hairColors.length]));hairBacks.setColorAt(index,new THREE.Color(hairColors[index%hairColors.length]));
    return { pathIndex, phase: (localIndex + random() * .25) / members, speed: .83 + random() * .42,
      direction: index % 3 === 0 ? -1 : 1, size: .93 + random() * .13, gait: random() * Math.PI * 2,
      world: new THREE.Matrix4(), position: new THREE.Vector3() };
  });
  torso.instanceColor!.needsUpdate = true; limbs.instanceColor!.needsUpdate = true;
  hairCaps.instanceColor!.needsUpdate=true;hairBacks.instanceColor!.needsUpdate=true;
  function place(object: THREE.InstancedMesh, index: number, world: THREE.Matrix4, x: number, y: number, z: number, angle = 0, sx = 1, sy = 1, sz = 1) {
    position.set(x, y, z); rotation.setFromAxisAngle(xAxis, angle); scale.set(sx, sy, sz);
    part.compose(position, rotation, scale); matrix.multiplyMatrices(world, part); object.setMatrixAt(index, matrix);
  }
  function poseResidents(time: number) {
    let umbrella = 0;
    walkers.forEach((walker, index) => {
      const path = paths[walker.pathIndex];
      const t = THREE.MathUtils.euclideanModulo(walker.phase + time * walker.speed * walker.direction / pathLengths[walker.pathIndex], 1);
      const p = path.getPointAt(t), tangent = path.getTangentAt(t).multiplyScalar(walker.direction);
      // Opposing walkers use separate sides of the same pavement lane.
      const side = .28;
      p.x += tangent.z * side; p.z -= tangent.x * side;
      const gaitPhase = time * walker.speed * 7.4 + walker.gait;
      const stride = Math.sin(gaitPhase) * .43;
      walker.position.copy(p); rotation.setFromAxisAngle(up, Math.atan2(tangent.x, tangent.z));
      walker.world.compose(p, rotation, scale.setScalar(walker.size));
      const bob = Math.cos(time * walker.speed * 14.8 + walker.gait * 2) * .012;
      place(torso, index, walker.world, 0, 1.125 + bob, 0);
      place(heads, index, walker.world, 0, 1.612 + bob, .014);
      place(hairCaps,index,walker.world,0,1.622+bob,.004,0,1,index%3===1?1.12:.96,1.02);
      const hairStyle=index%3;
      place(hairBacks,index,walker.world,0,1.53+bob,-.105,hairStyle===2?.40:0,hairStyle===0?.001:hairStyle===1?1.6:.70,hairStyle===0?.001:hairStyle===1?.83:1.3,hairStyle===0?.001:hairStyle===1?.75:.80);
      place(bags, index, walker.world, .012, 1.13 + bob, -.185);
      place(trims, index, walker.world, 0, 1.31 + bob, .166);
      for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
        const sideSign = sideIndex ? 1 : -1, legAngle = stride * sideSign;
        // The rearward-moving foot remains planted while the other swings forward.
        // Account for the pitched box's full support extent so its sole never floats
        // or penetrates the slab. Uniform person scale preserves this zero datum.
        const swing = Math.max(0, -Math.cos(gaitPhase) * sideSign);
        const shoeAngle = Math.sin(gaitPhase) * swing * .16;
        const shoeZ = -Math.sin(gaitPhase) * sideSign * .30 + .04;
        const shoeY = swing * .10 + .0375 * Math.abs(Math.cos(shoeAngle)) + .1225 * Math.abs(Math.sin(shoeAngle));
        place(shoes, index * 2 + sideIndex, walker.world, sideSign * .093, shoeY, shoeZ, shoeAngle);
        // Join the leg to an ankle point inside the shoe rather than rotating a
        // fixed-length leg independently of its grounded endpoint.
        const ankleY = shoeY + .03 * Math.cos(shoeAngle) + .035 * Math.sin(shoeAngle);
        const ankleZ = shoeZ + .03 * Math.sin(shoeAngle) - .035 * Math.cos(shoeAngle);
        const hipY = .80 + bob, legLength = Math.hypot(hipY - ankleY, ankleZ);
        place(limbs, index * 4 + sideIndex, walker.world, sideSign * .093, (hipY + ankleY) / 2, ankleZ / 2, Math.atan2(-ankleZ, hipY - ankleY), 1.09, legLength, 1.09);
        const armAngle = -legAngle * .70;
        place(limbs, index * 4 + 2 + sideIndex, walker.world, sideSign * .205, 1.35 - Math.cos(armAngle) * .275 + bob, -Math.sin(armAngle) * .275, armAngle, .90, .55, .90);
      }
      if (index % 4 === 0) {
        place(umbrellas, umbrella, walker.world, .12, 1.90 + bob, .02, 0, 1, .33, 1);
        place(umbrellaStems, umbrella, walker.world, .12, 1.48 + bob, .02); umbrella++;
      }
    });
    for (const object of [torso, limbs, heads, hairCaps, hairBacks, shoes, bags, trims, umbrellas, umbrellaStems]) object.instanceMatrix.needsUpdate = true;
  }

  // The physical deck and trains share one closed, arc-length parameterized route.
  const transit = createOsCityTransit(); life.add(transit);
  transit.traverse(object=>{const mat=(object as THREE.Mesh).material;if(mat)(Array.isArray(mat)?mat:[mat]).forEach(material=>neonAtmosphere.register(material,material instanceof THREE.MeshBasicMaterial?'neon':object.name.includes('glazing')?'window':'surface',object.name));});
  function poseTrains(time: number) { transit.userData.pose(time); }

  // Light packets follow selected *existing* circuit traces instead of unrelated paths.
  const packetPaths: THREE.CurvePath<THREE.Vector3>[] = [];
  const tracePoints=circuitTraces??[];
  if(!circuitTraces)for (let quadrant = 0; quadrant < 4; quadrant++) for (let lane=0;lane<13;lane++) {
    const angle = quadrant * Math.PI / 2, dx = Math.cos(angle), dz = Math.sin(angle), side = -3.9 + lane * .61;
    const extent = 15 + (lane % 4) * 2.05;
    const points = [[5.1, side], [9 + lane * .25, side], [13 + lane * .25, side + Math.sign(side || 1) * 4], [extent + 9, side + Math.sign(side || 1) * 4]]
      .map(([along, across]) => [plazaX(Math.max(9, Math.min(58, 34 + dx * along - dz * across))), -13.908, plazaZ(Math.max(-27, Math.min(18, -5 + dz * along + dx * across)))]);
    tracePoints.push(points);
  }
  const packetColors:string[]=[];
  for(const [traceIndex,points] of tracePoints.entries()){
    const path = new THREE.CurvePath<THREE.Vector3>();
    const vertices=points.map(([x,y,z])=>v(x,y,z));
    for (let index = 1; index < vertices.length; index++) if (vertices[index].distanceToSquared(vertices[index - 1]) > .01) path.add(new THREE.LineCurve3(vertices[index - 1], vertices[index]));
    if(path.curves.length){packetPaths.push(path);packetColors.push(circuitColors?.[traceIndex]??CITY_CIRCUIT_COLORS[traceIndex%4]);}
  }
  const streamsPerPath=2,trailCount=3;
  const packets = instances('Circuit traces · travelling data packets', geometry(new THREE.BoxGeometry(.18, .035, .82)), eyeLight, packetPaths.length * streamsPerPath * trailCount);
  const packetGlowCanvas=document.createElement('canvas');packetGlowCanvas.width=packetGlowCanvas.height=64;
  const glowContext=packetGlowCanvas.getContext('2d')!,packetGradient=glowContext.createRadialGradient(32,32,1,32,32,32);
  packetGradient.addColorStop(0,'#ffffffb0');packetGradient.addColorStop(.28,'#ffffff55');packetGradient.addColorStop(1,'#ffffff00');glowContext.fillStyle=packetGradient;glowContext.fillRect(0,0,64,64);
  const packetGlowTexture=new THREE.CanvasTexture(packetGlowCanvas);textures.add(packetGlowTexture);
  const packetGlowMaterial=atmosphere(new THREE.MeshBasicMaterial({color:'#ffffff',map:packetGlowTexture,transparent:true,opacity:.50,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  neonAtmosphere.register(packetGlowMaterial,'neon','Moving data packet pavement glow');
  const packetGlows=instances('Circuit traces · moving light pools',geometry(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2)),packetGlowMaterial,packetPaths.length*streamsPerPath);
  packetColors.forEach((value,index)=>{
    const color=new THREE.Color(value);
    for(let stream=0;stream<streamsPerPath;stream++){
      packetGlows.setColorAt(index*streamsPerPath+stream,color);
      for(let trail=0;trail<trailCount;trail++)packets.setColorAt((index*streamsPerPath+stream)*trailCount+trail,color);
    }
  });
  if(packets.instanceColor)packets.instanceColor.needsUpdate=true;
  if(packetGlows.instanceColor)packetGlows.instanceColor.needsUpdate=true;
  const packetLengths=packetPaths.map(path=>path.getLength());
  const packetPositions: THREE.Vector3[] = packetPaths.map(() => new THREE.Vector3());
  function posePackets(time: number) {
    packetPaths.forEach((path, index) => {
      for(let stream=0;stream<streamsPerPath;stream++)for (let trail = 0; trail < trailCount; trail++) {
        const t = THREE.MathUtils.euclideanModulo(time * (4.4+index%4*.65)/packetLengths[index] + index * .117 + stream/streamsPerPath - trail * .024, 1), p = path.getPoint(t), tangent = path.getTangent(t);
        if (!trail&&!stream) packetPositions[index].copy(p);
        rotation.setFromAxisAngle(up, Math.atan2(tangent.x, tangent.z));
        matrix.compose(p, rotation, scale.set(1 - trail * .23, 1, 1 - trail * .25)); packets.setMatrixAt((index*streamsPerPath+stream)*trailCount+trail, matrix);
        if(!trail){p.y+=.003;matrix.compose(p,rotation,scale.set(.72,1,1.6));packetGlows.setMatrixAt(index*streamsPerPath+stream,matrix);}
      }
    }); packets.instanceMatrix.needsUpdate = packetGlows.instanceMatrix.needsUpdate = true;
  }

  // Added lanterns use warm accents and shopfront pools; only three are real lights.
  const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 128;
  const ctx = glowCanvas.getContext('2d')!, gradient = ctx.createRadialGradient(64, 64, 1, 64, 64, 62);
  gradient.addColorStop(0, '#ffffff85'); gradient.addColorStop(.20, '#ffffff35'); gradient.addColorStop(1, '#ffffff00');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  const glowTexture = new THREE.CanvasTexture(glowCanvas); textures.add(glowTexture);
  const localLights: THREE.PointLight[] = [];
  const lanterns: { seed: number; pulse: number; core: THREE.MeshStandardMaterial; pool: THREE.MeshBasicMaterial; halo: THREE.SpriteMaterial; light?: THREE.PointLight }[] = [];
  const lanternPalette = [
    { color: '#93eeff', emissive: '#4ddeff', intensity: 2.0, roughness: .34, spill: '#56dfff' },
    { color: '#ffbddb', emissive: '#f665b8', intensity: 1.8, roughness: .35, spill: '#ee6bbf' },
    { color: '#fff0c5', emissive: '#ffd39a', intensity: 1.7, roughness: .42, spill: '#ffcd88' },
  ];
  const fixtures = [[22, -27.6, 0], [43, -27.6, 1], [57, -17, 0], [57, 5, 2], [34, 20.4, 1], [13, 8, 2], [13, -11, 0], [43, 20.4, 0]];
  const postGeometry = geometry(new THREE.CylinderGeometry(.045, .067, 3.15, 7));
  const lanternGeometry = geometry(new THREE.CylinderGeometry(.13, .13, .42, 8));
  const poolGeometry = geometry(new THREE.PlaneGeometry(4.8, 4.8)); poolGeometry.rotateX(-Math.PI / 2);
  fixtures.forEach(([baseX, baseZ, palette], index) => {
    const x=plazaX(baseX),z=plazaZ(baseZ);
    const colors = lanternPalette[palette], name = 'Circuit market lantern ' + (index + 1);
    // Every fixture owns its emission and spill, so a voltage dip stays local.
    const coreMaterial = atmosphere(new THREE.MeshStandardMaterial({ color: colors.color, emissive: colors.emissive, emissiveIntensity: colors.intensity, roughness: colors.roughness }));
    const poolMaterial = atmosphere(new THREE.MeshBasicMaterial({ color: colors.spill, map: glowTexture, transparent: true, opacity: .26, depthWrite: false, blending: THREE.AdditiveBlending }));
    const haloMaterial = atmosphere(new THREE.SpriteMaterial({ color: colors.spill, map: glowTexture, transparent: true, opacity: .38, depthWrite: false, blending: THREE.AdditiveBlending }));
    neonAtmosphere.register(coreMaterial, palette === 2 ? 'fixture' : 'neon', name + ' · core');
    neonAtmosphere.register(poolMaterial, 'fixture', name + ' · pavement spill');
    neonAtmosphere.register(haloMaterial, 'fixture', name + ' · halo');
    const lantern: typeof lanterns[number] = { seed: 7321 + index * 157, pulse: 1, core: coreMaterial, pool: poolMaterial, halo: haloMaterial };
    lanterns.push(lantern);
    mesh(postGeometry, steel, life, x, floorY + 1.575, z);
    mesh(lanternGeometry, coreMaterial, life, x, floorY + 3.13, z);
    const cap = box(life, steel, x, floorY + 3.40, z, .36, .075, .36); cap.name = 'Circuit market · sheltered street lantern';
    const pool = mesh(poolGeometry, poolMaterial, life, x, -13.908, z); pool.name = 'Lantern · soft wet-pavement light pool';
    const glow = new THREE.Sprite(haloMaterial); glow.position.set(x, floorY + 3.14, z); glow.scale.set(1.4, 1.4, 1); life.add(glow);
    if ([0, 3, 4].includes(index)) {
      const light = new THREE.PointLight(['#6bdfff', '#ef70c0', '#ffce8d'][palette], 8, 7.2, 2);
      light.position.set(x, floorY + 2.90, z); light.castShadow = false;
      light.name = name + ' · localized lighting'; localLights.push(light); life.add(light); lantern.light = light;
      neonAtmosphere.registerLight(light);
    }
  });
  function animateLight(time: number) {
    lightTime = time;
    for (const lantern of lanterns) {
      // The plaza is subtler than the skyline. No shared clothes, bright flashes,
      // geometry changes, or new lights; each core and its illumination agree.
      lantern.pulse = 1 - (1 - sampleCityDistantNeonPulse(lantern.seed, time, reducedMotion.matches, timeOfDay)) * .7;
      neonAtmosphere.setPulse(lantern.core, lantern.pulse);
      neonAtmosphere.setPulse(lantern.pool, lantern.pulse);
      neonAtmosphere.setPulse(lantern.halo, lantern.pulse);
      lantern.pool.opacity = .14 + wetness * .16;
      if (lantern.light) neonAtmosphere.setLightPulse(lantern.light, (7 + wetness * 3) / 8 * lantern.pulse);
    }
  }
  for(const material of materials)if(material instanceof THREE.MeshStandardMaterial)neonAtmosphere.register(material,'surface',material===cloth?'Pedestrian coats':material===skin?'Pedestrian skin':'Nonluminous street fixtures');
  life.userData.setWeather = (mode: OsCityWeather,time:CityTimeOfDay='day') => {
    weather = mode;timeOfDay=time;const preset=getCityWeatherPreset(mode,time);wetness=preset.wetness;
    umbrellas.visible = umbrellaStems.visible = preset.precipitation === 'rain';
    neonAtmosphere.setWeather(mode,time);
    animateLight(lightTime);
  };
  life.userData.update = (delta: number, _elapsed: number) => {
    // Light timing follows the ambient clock; movement keeps its safe bounded
    // timestep. A slow frame must not stretch a one-second light dip into several.
    animateLight(_elapsed);
    const streamTime=streamClock.step(_elapsed,reducedMotion.matches);
    if (reducedMotion.matches) return;
    // Accumulate bounded real time so restoring a suspended tab cannot teleport actors.
    animationTime += THREE.MathUtils.clamp(delta, 0, .10);
    poseResidents(animationTime); poseTrains(animationTime); posePackets(streamTime);
  };
  life.userData.snapshot = () => ({
    weather,timeOfDay,lighting:neonAtmosphere.snapshot(), reducedMotion: reducedMotion.matches, animationTime, walkerCount, trainCount: transit.userData.snapshot().trainCount, trainCarCount: transit.userData.snapshot().trainCarCount,
    circuitPacketCount: packets.count, circuitPathCount:packetPaths.length,circuitColors:[...new Set(packetColors)],circuitStreamCount:packetPaths.length*streamsPerPath,packetClock:'visible-wall-time-scaled',stream:streamClock.snapshot(),hairCount:walkerCount,hairStyles:['short','bob','ponytail'],localLightCount: localLights.length, lanternCount: fixtures.length,
    pedestrianRoutes: pathPoints, pedestrianPositions: walkers.map(walker => walker.position.toArray()),
    trainPositions: transit.userData.snapshot().trainPositions, transit: transit.userData.snapshot(), packetPositions: packetPositions.map(p => p.toArray()),
    lightIntensities: localLights.map(light => light.intensity), umbrellaCount: umbrellas.visible ? umbrellaCount : 0,
    flicker: { timeOfDay, reducedMotion: reducedMotion.matches, elapsed: lightTime, intensityScale: .7, independentFixtureCount: lanterns.length,
      animatedEmitterCount: lanterns.length, staticGeometry: true, animatedTextures: false,
      emitters: lanterns.map((lantern, index) => ({ name: 'Circuit market lantern ' + (index + 1), seed: lantern.seed, pulse: lantern.pulse,
        emission: lantern.core.emissiveIntensity, color: '#' + lantern.core.emissive.getHexString() })),
      fixtures: lanterns.map((lantern, index) => ({ index, seed: lantern.seed, pulse: lantern.pulse, coreEmission: lantern.core.emissiveIntensity,
        poolColor: lantern.pool.color.toArray(), haloColor: lantern.halo.color.toArray(), pointLightIntensity: lantern.light?.intensity ?? null })) },
    raisedProcessorClearance: true, railSpeedMetersPerSecond: CITY_TRANSIT_SPEED, pedestrianSpeedRange: [.83, 1.25],
  });
  let disposed = false;
  life.userData.dispose = () => {
    if (disposed) return;
    disposed = true;
    transit.userData.dispose();
    life.traverse(object => { if (object instanceof THREE.InstancedMesh && object.parent !== transit) object.dispose(); });
    geometries.forEach(g => g.dispose()); materials.forEach(material => material.dispose()); textures.forEach(texture => texture.dispose());
  };
  poseResidents(0); poseTrains(0); posePackets(0); life.userData.setWeather('rain');
  return life;
}
