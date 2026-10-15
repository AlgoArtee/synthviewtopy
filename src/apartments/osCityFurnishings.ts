import * as THREE from 'three'
import { CityRoundedBoxGeometry as RoundedBoxGeometry } from './osCityGeometry'
import { CITY_BED, CITY_KITCHEN_OFFSET_Z } from './osCityLayout'
import { createOsCityDuvet } from './osCityDuvet'
import { createCityBedPillows, finishCityBedPillowMaterials, settleCityWindowPillowsOnDuvet } from './osCityPillows'

export const OS_CITY_LOUNGE_OFFSET_Z = 1.3

function seeded(seed = 3107) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 } }

export function createOsCityFurnishings(): THREE.Group {
  const group = new THREE.Group()
  group.name = 'O’s City Apartment · bespoke furniture'
  const random = seeded()
  const texture = (kind: 'linen' | 'wood' | 'rug') => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = kind === 'wood' ? '#c4b7a1' : kind === 'rug' ? '#ddd7cc' : '#dfdfd9'; ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < (kind === 'wood' ? 3500 : 30000); i++) {
      const shade = Math.floor(160 + random() * 80)
      ctx.strokeStyle = 'rgba(' + shade + ',' + shade + ',' + shade + ',' + (kind === 'wood' ? .17 : .3) + ')'
      ctx.lineWidth = kind === 'wood' ? .4 + random() * 1.2 : .5
      const x = random() * 512, y = random() * 512
      ctx.beginPath(); ctx.moveTo(x, y)
      ctx.lineTo(x + (kind === 'wood' ? 20 + random() * 120 : kind === 'rug' ? 2 + random() * 5 : 1), y + (kind === 'wood' ? random() * 1.5 : kind === 'rug' ? random() * 8 : 3)); ctx.stroke()
    }
    if (kind === 'linen') for (let n = 0; n < 512; n += 3) {
      ctx.strokeStyle = n % 2 ? '#d3d3cf' : '#eaeae5'; ctx.globalAlpha = .24
      ctx.beginPath(); ctx.moveTo(n, 0); ctx.lineTo(n, 512); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, n); ctx.lineTo(512, n); ctx.stroke()
    }
    const t = new THREE.CanvasTexture(canvas); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(kind === 'wood' ? 2 : 5, kind === 'wood' ? 1 : 5); t.anisotropy = 8
    return t
  }
  const linenTex = texture('linen'), woodTex = texture('wood'), rugTex = texture('rug')
  const linen = new THREE.MeshStandardMaterial({ color: '#f4f2ea', roughness: .96, bumpMap: linenTex, bumpScale: .0035, side: THREE.DoubleSide })
  const pillowMat = new THREE.MeshPhysicalMaterial({ color: '#f5f3ec', roughness: 1, sheen: .24, sheenColor: new THREE.Color('#fffaf2'), sheenRoughness: 1, bumpMap: linenTex, bumpScale: .003, side: THREE.DoubleSide })
  const duvetMat = new THREE.MeshPhysicalMaterial({color:'#fffefd',roughness:1,sheen:.28,sheenColor:new THREE.Color('#ffffff'),sheenRoughness:1,side:THREE.DoubleSide})
  // Real scanned cotton detail is ready before the apartment's reference captures.
  const cottonLoader = new THREE.TextureLoader()
  group.userData.ready = Promise.all([
    cottonLoader.loadAsync('/apartments/materials/cotton_jersey_normal.jpg'),
    cottonLoader.loadAsync('/apartments/materials/cotton_jersey_roughness.jpg'),
  ]).then(([normal, roughness]) => {
    for (const t of [normal, roughness]) {t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); t.anisotropy = 8}
    const cottonRoughnessCanvas = document.createElement('canvas'); cottonRoughnessCanvas.width = cottonRoughnessCanvas.height = 1024
    const roughCtx = cottonRoughnessCanvas.getContext('2d')!; roughCtx.drawImage(roughness.image, 0, 0, 1024, 1024)
    const roughPixels = roughCtx.getImageData(0, 0, 1024, 1024)
    for (let p = 0; p < roughPixels.data.length; p += 4) {const matte = 204 + roughPixels.data[p] * .2; roughPixels.data[p] = roughPixels.data[p + 1] = roughPixels.data[p + 2] = matte}
    roughCtx.putImageData(roughPixels, 0, 0)
    const cottonRoughness = new THREE.CanvasTexture(cottonRoughnessCanvas); cottonRoughness.wrapS = cottonRoughness.wrapT = THREE.RepeatWrapping; cottonRoughness.repeat.set(2, 2); cottonRoughness.anisotropy = 8
    roughness.dispose()
    linen.normalMap = normal; linen.normalScale.set(.23, .23); linen.roughnessMap = cottonRoughness; linen.roughness = 1; linen.bumpMap = null; linen.needsUpdate = true
    pillowMat.normalMap = normal.clone(); pillowMat.normalMap.repeat.set(1.9, 1.7); pillowMat.normalScale.set(.16, .16)
    duvetMat.normalMap = normal.clone(); duvetMat.normalMap.repeat.set(1,1); duvetMat.normalScale.set(.20,.20); duvetMat.roughnessMap = cottonRoughness.clone(); duvetMat.roughnessMap.repeat.set(1,1); duvetMat.needsUpdate = true
    pillowMat.roughnessMap = cottonRoughness.clone(); pillowMat.roughnessMap.repeat.set(1.9, 1.7); pillowMat.bumpMap = null; pillowMat.needsUpdate = true; finishCityBedPillowMaterials(group,pillowMat)
  })
  const white = new THREE.MeshStandardMaterial({ color: '#f1efe9', roughness: .72, metalness: 0, emissive: '#e9e6df', emissiveIntensity: .045 })
  const wood = new THREE.MeshStandardMaterial({ color: '#d2c8b9', roughness: .76, map: woodTex, bumpMap: woodTex, bumpScale: .012 })
  const seamMat = new THREE.MeshStandardMaterial({ color: '#ddded8', roughness: 1 })
  const chrome = new THREE.MeshStandardMaterial({ color: '#b8c2c8', metalness: .95, roughness: .17 })
  const dark = new THREE.MeshStandardMaterial({ color: '#353d46', roughness: .42, metalness: .55 })
  function mesh(name: string, geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, parent: THREE.Object3D = group) {
    const m = new THREE.Mesh(geo, mat); m.name = name; m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m
  }
  function box(name: string, w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material, radius = .03, parent: THREE.Object3D = group) {
    return mesh(name, new RoundedBoxGeometry(w, h, d, 4, Math.min(radius, w / 3, h / 3, d / 3)), mat, x, y, z, parent)
  }
  function tube(name: string, points: THREE.Vector3[], radius: number, mat: THREE.Material, parent: THREE.Object3D = group, closed = false) {
    return mesh(name, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed), Math.max(24, points.length * 5), radius, 7, closed), mat, 0, 0, 0, parent)
  }
  // Custom square mattress fills the alcove on its west, north and east sides.
  const bx=CITY_BED.centerX,bz=CITY_BED.centerZ,bw=CITY_BED.width,bd=CITY_BED.depth
  box('Bed · ash plinth shadow reveal', bw-.32, .13, bd-.32, bx, .12, bz, dark, .025)
  box('Bed · washed ash platform', bw, .23, bd, bx, .295, bz, wood, .035)
  box('Bed · upholstered mattress', bw, .25, bd, bx, .48, bz, linen, .003)
  box('Bed · fitted sheet', bw, .09, bd, bx, .596, bz, pillowMat, .003)
  const piping: THREE.Vector3[] = []
  for (let i=0;i<200;i++) {const a=i/200*Math.PI*2;piping.push(new THREE.Vector3(bx+(bw/2-.014)*Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.075),.535,bz+(bd/2-.014)*Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),.075)))}
  tube('Mattress · hand sewn perimeter piping',piping,.006,seamMat,group,true)
  group.userData.bed={...CITY_BED,wallFittedSides:['west','north-window','east'],pillowSizeMetres:1.64}

  const clothNoise = (x: number, y: number) => {
    const hash = (a: number, b: number) => { const h = Math.sin(a * 127.1 + b * 311.7 + 43.8) * 43758.5453; return h - Math.floor(h) }
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
    return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix, iy), hash(ix + 1, iy), sx), THREE.MathUtils.lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), sx), sy) - .5
  }
  // Relax a slack cloth lattice against the mattress. Structural/shear links preserve
  // fabric area; soft bend links and friction let the spare cotton gather into folds.
  const clothMinX=CITY_BED.minX+.035,clothWidth=bw-.07,clothHeadZ=CITY_BED.minZ+.63,clothLength=bd-.40
  const nx = 190, nz = 182, count = (nx + 1) * (nz + 1)
  const cloth = new Float64Array(count * 3), previous = new Float64Array(count * 3), anchors = new Float64Array(count * 3), invMass = new Float64Array(count)
  const clothUv: number[] = [], clothIndices: number[] = []
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const u = i / nx, v = j / nz, k = j * (nx + 1) + i, p = k * 3
    const x=clothMinX+clothWidth*u,z=clothHeadZ+clothLength*v
    cloth[p] = x + .032 * clothNoise(u * 22, v * 26); cloth[p + 2] = z + .018 * clothNoise(u * 14 + 8, v * 36)
    cloth[p + 1] = .702 + .045 * clothNoise(u * 16 + 2, v * 21) + .018 * clothNoise(u * 32, v * 44)
    invMass[k] = j === 0 && i % 9 === 0 ? 0 : 1
    clothUv.push(u*clothWidth,v*clothLength)
    if (i < nx && j < nz) {const a = j * (nx + 1) + i; clothIndices.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2)}
  }
  previous.set(cloth); anchors.set(cloth)
  const ca: number[] = [], cb: number[] = [], rest: number[] = [], strength: number[] = []
  const link = (a: number, b: number, dx: number, dz: number, stiff: number) => {
    const x = (anchors[a * 3] + anchors[b * 3]) * .5, z = (anchors[a * 3 + 2] + anchors[b * 3 + 2]) * .5
    let gathered=0
    for(let n=0;n<10;n++){
      const gx=clothMinX+clothWidth*(.12+((n*.381966)%1)*.78),gz=clothHeadZ+clothLength*(.12+((n*.618034)%1)*.76)
      gathered+=(.16+(n%3)*.045)*Math.exp(-(((x-gx)/(.35+(n%2)*.16))**2)-(((z-gz)/(.32+(n%3)*.13))**2))
    }
    ca.push(a); cb.push(b); rest.push(Math.hypot(dx*clothWidth/nx,dz*clothLength/nz)*(1.008+gathered));strength.push(stiff)
  }
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const k = j * (nx + 1) + i
    if (i < nx) link(k, k + 1, 1, 0, .68)
    if (j < nz) link(k, k + nx + 1, 0, 1, .68)
    if (i < nx && j < nz) {link(k, k + nx + 2, 1, 1, .26); link(k + 1, k + nx + 1, 1, 1, .26)}
    if (i + 2 <= nx) link(k, k + 2, 2, 0, .075)
    if (j + 2 <= nz) link(k, k + 2 * (nx + 1), 0, 2, .075)
  }
  for (let step = 0; step < 66; step++) {
    for (let k = 0; k < count; k++) {
      if (!invMass[k]) continue
      const p = k * 3
      for (let a = 0; a < 3; a++) {const at = p + a, old = cloth[at]; cloth[at] += (cloth[at] - previous[at]) * .72; previous[at] = old}
      cloth[p + 1] -= .00019
    }
    for (let iteration = 0; iteration < 4; iteration++) {
      for (let q = 0; q < ca.length; q++) {
        const e = iteration % 2 ? ca.length - q - 1 : q, a = ca[e], b = cb[e], pa = a * 3, pb = b * 3, weight = invMass[a] + invMass[b]
        if (!weight) continue
        const dx = cloth[pb] - cloth[pa], dy = cloth[pb + 1] - cloth[pa + 1], dz = cloth[pb + 2] - cloth[pa + 2], dist = Math.hypot(dx, dy, dz)
        const correction = (dist - rest[e]) / Math.max(.00001, dist) * strength[e] / weight
        const wa = correction * invMass[a], wb = correction * invMass[b]
        cloth[pa] += dx * wa; cloth[pa + 1] += dy * wa; cloth[pa + 2] += dz * wa
        cloth[pb] -= dx * wb; cloth[pb + 1] -= dy * wb; cloth[pb + 2] -= dz * wb
      }
      for (let k = 0; k < count; k++) {
        const p = k * 3, x = cloth[p], z = cloth[p + 2]
        if (!invMass[k]) continue
        // Surface friction keeps the hand-gathered extra area on the bed.
        cloth[p] += (anchors[p] - x) * .045; cloth[p + 2] += (anchors[p + 2] - z) * .045
        const outside=Math.max(0,z-(CITY_BED.maxZ-.05))
        const support = .662 - Math.min(.29, outside * 2.8)
        if (cloth[p + 1] < support) {cloth[p + 1] = support; previous[p] = cloth[p]; previous[p + 2] = cloth[p + 2]}
      }
    }
  }
  // Cotton loft softens high frequency buckles while retaining gathered overlap regions.
  const softened = new Float64Array(cloth)
  for (let pass = 0; pass < 5; pass++) {
    for (let j = 1; j < nz; j++) for (let i = 1; i < nx; i++) {
      const p = (j * (nx + 1) + i) * 3 + 1
      softened[p] = cloth[p] * .58 + (cloth[p - 3] + cloth[p + 3] + cloth[p - (nx + 1) * 3] + cloth[p + (nx + 1) * 3]) * .105
    }
    for (let p = 1; p < cloth.length; p += 3) cloth[p] = softened[p]
  }
  // Several broad hand-gathered rolls retain their loft while the intervening cotton
  // stays smooth. Curving seams and unequal lengths avoid a repeated terrain pattern.
  const softRolls=Array.from({length:15},(_,n)=>({
    x:clothMinX+clothWidth*(.10+((n*.381966)%1)*.8),z:clothHeadZ+clothLength*(.10+((n*.618034)%1)*.78),
    angle:(n*.73)%2.5-1.25,length:.38+(n%4)*.11,width:.11+(n%3)*.019,height:.065+(n%4)*.011,
  }))
  softRolls.push(
    {x:bx-.62,z:bz+.12,angle:.41,length:1.13,width:.073,height:.038},
    {x:bx+.88,z:bz+1.49,angle:-.73,length:.86,width:.061,height:.043},
    {x:bx-1.27,z:bz+2.39,angle:.29,length:.97,width:.085,height:.032},
    {x:bx+2.37,z:bz+.42,angle:1.13,length:.74,width:.069,height:.035},
    {x:bx-2.31,z:bz-.54,angle:-.18,length:.82,width:.076,height:.040},
    {x:bx+.15,z:bz-1.16,angle:-.54,length:1.05,width:.062,height:.030},
    {x:bx+1.63,z:bz+2.67,angle:.69,length:.67,width:.078,height:.033},
  )
  for (let k = 0; k < count; k++) {
    const p = k * 3, x = cloth[p], z = cloth[p + 2]
    for (const roll of softRolls) {
      const dx = x - roll.x, dz = z - roll.z, along = dx * Math.cos(roll.angle) + dz * Math.sin(roll.angle)
      const across = -dx * Math.sin(roll.angle) + dz * Math.cos(roll.angle) - .15 * along * along
      const end = Math.exp(-Math.pow(along / roll.length, 4))
      cloth[p + 1] += roll.height*end*(Math.exp(-Math.pow(across/roll.width,2))-.20*Math.exp(-Math.pow((across-roll.width*1.35)/(roll.width*.62),2)))
    }
  }
  // The free foot hangs against the mattress face instead of hovering horizontally.
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const p = (j * (nx + 1) + i) * 3, v = j / nz, x = cloth[p]
    if (v > .966) {
      const t = (v - .966) / .034, blend = THREE.MathUtils.smoothstep(t, 0, .45)
      cloth[p + 2] = CITY_BED.maxZ-.05 + .082 * Math.sin(t * Math.PI * .5) + .006 * clothNoise(x * 5, 3)
      const hangingY = .669 - .245 * t + .012 * clothNoise(x * 4, t * 3)
      cloth[p + 1] = THREE.MathUtils.lerp(cloth[p + 1], hangingY, blend)
    }
    cloth[p]=THREE.MathUtils.clamp(x,CITY_BED.minX+.012,CITY_BED.maxX-.012)
    const side=0 // Side cloth is tucked against the three walls, never draped through them.
    cloth[p + 1] -= side * .135 * (1 - THREE.MathUtils.smoothstep(v, .83, 1))
  }
  // The former cover is now a relaxed under-sheet; reduce its tall gathers beneath the filled duvet.
  for(let k=1;k<cloth.length;k+=3)if(cloth[k]>.662)cloth[k]=.662+(cloth[k]-.662)*.30
  // Pillow weight presses the exposed sheet onto the fitted mattress. Its
  // underlying folds must not be projected up through the entire pillow body.
  for(let k=0;k<cloth.length;k+=3){
    const head=1-THREE.MathUtils.smoothstep(cloth[k+2],CITY_BED.minZ+1.25,CITY_BED.minZ+1.50);
    const side=THREE.MathUtils.smoothstep(cloth[k],CITY_BED.maxX-1.25,CITY_BED.maxX-1.05);
    // Keep this visible cloth above the fitted-sheet top (.641m). Submillimetre
    // separation previously crossed the base sheet and produced dotted z-fighting.
    cloth[k+1]=THREE.MathUtils.lerp(cloth[k+1],.646+.0006*clothNoise(cloth[k]*5,cloth[k+2]*5),Math.max(head,side));
  }
  const sampleDuvet = (x: number, z: number) => {
    const u=THREE.MathUtils.clamp((x-clothMinX)/clothWidth,0,1)*nx,v=THREE.MathUtils.clamp((z-clothHeadZ)/clothLength,0,.96)*nz
    const i = Math.min(nx - 1, Math.floor(u)), j = Math.min(nz - 1, Math.floor(v)), sx = u - i, sy = v - j
    const y = (di: number, dj: number) => cloth[((j + dj) * (nx + 1) + i + di) * 3 + 1]
    return THREE.MathUtils.lerp(THREE.MathUtils.lerp(y(0, 0), y(1, 0), sx), THREE.MathUtils.lerp(y(0, 1), y(1, 1), sx), sy)
  }
  const clothGeo = new THREE.BufferGeometry(); clothGeo.setAttribute('position', new THREE.Float32BufferAttribute(cloth, 3)); clothGeo.setAttribute('uv', new THREE.Float32BufferAttribute(clothUv, 2)); clothGeo.setIndex(clothIndices); clothGeo.computeVertexNormals()
  mesh('Bed · relaxed cotton under-sheet', clothGeo, linen)
  const sheetSupportAt=(x:number,z:number)=>z<clothHeadZ?.6415:sampleDuvet(x,z);
  const bedPillows=createCityBedPillows(pillowMat,seamMat,sheetSupportAt,clothNoise);
  group.add(bedPillows);group.userData.bed.pillows=bedPillows.userData.pillows;
  const oversizedDuvet=createOsCityDuvet(duvetMat,sampleDuvet,clothNoise,bedPillows.userData.duvetLimitAtZ);
  group.add(oversizedDuvet.group);
  settleCityWindowPillowsOnDuvet(bedPillows,sheetSupportAt,oversizedDuvet.heightAt);
  group.userData.bed.duvet=oversizedDuvet.metadata;

  function pillow(name: string, w: number, d: number, thick: number, x: number, y: number, z: number, rz = 0, ry = 0, rx = 0, parent: THREE.Object3D = group) {
    const p = new THREE.Group(); p.name = name; p.position.set(x, y, z); p.rotation.set(rx, ry, rz); parent.add(p)
    const tucks = Array.from({length: 9}, () => ({edge: Math.floor(random() * 4), at: random() * 1.6 - .8, width: .035 + random() * .055, depth: .003 + random() * .007}))
    const n = 52, positions: number[] = [], uv: number[] = [], ix: number[] = []
    for (let face = 0; face < 2; face++) for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const u = i / n * 2 - 1, v = j / n * 2 - 1, edge = Math.pow(Math.max(0, (1 - u * u) * (1 - v * v)), .43)
      let creases = .002 * clothNoise(u * 11 + x * 5, v * 11 + z * 5)
      for (const tuck of tucks) {
        const along = tuck.edge < 2 ? u : v, across = tuck.edge < 2 ? v : u, edge = tuck.edge % 2 ? 1 : -1
        creases -= tuck.depth * Math.exp(-Math.pow((along - tuck.at) / tuck.width, 2)) * Math.exp(-Math.pow((across - edge) / .32, 2))
      }
      positions.push(u * w * .5 * (1 - .075 * Math.pow(v, 6)), (face === 0 ? 1 : -1) * (.009 + thick * .5 * edge + creases * edge), v * d * .5 * (1 - .075 * Math.pow(u, 6)))
      uv.push(i / n, j / n)
      if (i < n && j < n) { const k = face * (n + 1) * (n + 1) + j * (n + 1) + i; face === 0 ? ix.push(k, k + n + 1, k + 1, k + 1, k + n + 1, k + n + 2) : ix.push(k, k + 1, k + n + 1, k + 1, k + n + 2, k + n + 1) }
    }
    // Close the upper/lower pillow edges with cotton. An open gap here looked like a hard metallic band.
    const border: number[] = []; for (let i = 0; i <= n; i++) border.push(i); for (let j = 1; j <= n; j++) border.push(j * (n + 1) + n); for (let i = n - 1; i >= 0; i--) border.push(n * (n + 1) + i); for (let j = n - 1; j > 0; j--) border.push(j * (n + 1))
    const bottom = (n + 1) * (n + 1)
    for (let i = 0; i < border.length; i++) {const a = border[i], b = border[(i + 1) % border.length]; ix.push(a, b, b + bottom, a, b + bottom, a + bottom)}
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(ix); geo.computeVertexNormals(); mesh(name + ' · soft cotton shell', geo, pillowMat, 0, 0, 0, p)
    return p
  }
  // Keep the chair and brilliant-white rug together in the expanded living area.
  const rug = new THREE.Group(); rug.name = 'Luminous white lounge rug'; rug.position.z = OS_CITY_LOUNGE_OFFSET_Z; group.add(rug)
  // Continuous plush underpile with dense, short individually curled wool ends.
  mesh('Rug · circular bound wool backing', new THREE.CylinderGeometry(1.16, 1.16, .033, 96), new THREE.MeshStandardMaterial({color: '#ffffff', emissive: '#ffffff', emissiveIntensity: .06, roughness: 1}), -3.05, .017, .85, rug)
  const rugWool = new THREE.MeshStandardMaterial({color: '#ffffff', emissive: '#ffffff', emissiveIntensity: .22, roughness: 1, bumpMap: rugTex, bumpScale: .006})
  mesh('Rug · round brilliant white underpile', new THREE.CylinderGeometry(1.15, 1.13, .055, 96), rugWool, -3.05, .046, .85, rug)
  const rugEdge = mesh('Rug · rounded soft wool perimeter', new THREE.TorusGeometry(1.13, .017, 8, 96), rugWool, -3.05, .061, .85, rug); rugEdge.rotation.x = Math.PI / 2
  const rp: number[] = [], rc: number[] = []
  for (let i = 0; i < 37000; i++) {
    const radial = Math.sqrt(random()) * 1.135, theta = random() * Math.PI * 2
    const x = -3.05 + Math.cos(theta) * radial, z = .85 + Math.sin(theta) * radial
    const h = .012 + random() * .018, angle = random() * Math.PI * 2, lean = .009 + random() * .008, width = .0018 + random() * .0012
    const shade = .98 + random() * .02, col = [shade, shade, shade]
    const p = (t: number, side: number) => [x + Math.cos(angle) * Math.sin(t * 1.9) * lean + Math.sin(angle) * width * (1 - t * .78) * side, .072 + Math.sin(t * 2.1) * h, z + Math.sin(angle) * Math.sin(t * 1.9) * lean - Math.cos(angle) * width * (1 - t * .78) * side]
    for (let j = 0; j < 3; j++) {
      const a = p(j / 3, -1), b = p(j / 3, 1), c = p((j + 1) / 3, -1), d = p((j + 1) / 3, 1)
      for (const v of [a, b, c, c, b, d]) {rp.push(...v); rc.push(...col)}
    }
  }
  const rugGeo = new THREE.BufferGeometry(); rugGeo.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rugGeo.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3)); rugGeo.computeVertexNormals()
  const fibres = mesh('Rug · luminous white wool curls', rugGeo, new THREE.MeshStandardMaterial({color: '#ffffff', emissive: '#ffffff', emissiveIntensity: .36, vertexColors: true, roughness: .96, side: THREE.DoubleSide}), 0, 0, 0, rug); fibres.castShadow = fibres.receiveShadow = false
  // Clear moulded acrylic lounge bowl with a double-skin lip and upholstered insert.
  const chair = new THREE.Group(); chair.name = 'Floating round acrylic lounge chair'; chair.position.set(-3.40, .08, .39 + OS_CITY_LOUNGE_OFFSET_Z); chair.rotation.y = Math.atan2(4.3 - chair.position.x, 1.25 + CITY_KITCHEN_OFFSET_Z - chair.position.z); group.add(chair)
  const acrylic = new THREE.MeshPhysicalMaterial({ color: '#e2eaf1', roughness: .14, metalness: 0, transmission: .88, thickness: .028, ior: 1.49, transparent: true, opacity: .44, clearcoat: 1, clearcoatRoughness: .07, side: THREE.DoubleSide, depthWrite: false })
  const shellPos: number[] = [], shellUv: number[] = [], shellIx: number[] = [], rim: THREE.Vector3[] = []
  const rings = 34, segments = 100
  for (let j = 0; j <= rings; j++) for (let i = 0; i <= segments; i++) {
    const a = i / segments * Math.PI * 2, r = j / rings, back = (1 - Math.cos(a)) * .5
    const phi = r * (1.07 + .9 * Math.pow(back, .8))
    const x = Math.sin(a) * .68 * Math.sin(phi), z = Math.cos(a) * .65 * Math.sin(phi)
    const y = .43 + .70 * (1 - Math.cos(phi))
    shellPos.push(x, y, z); shellUv.push(i / segments, r)
    if (j === rings) rim.push(new THREE.Vector3(x, y, z))
    if (j < rings && i < segments) { const k = j * (segments + 1) + i; shellIx.push(k, k + 1, k + segments + 1, k + 1, k + segments + 2, k + segments + 1) }
  }
  const shellGeo = new THREE.BufferGeometry(); shellGeo.setAttribute('position', new THREE.Float32BufferAttribute(shellPos, 3)); shellGeo.setAttribute('uv', new THREE.Float32BufferAttribute(shellUv, 2)); shellGeo.setIndex(shellIx); shellGeo.computeVertexNormals()
  const shell = mesh('Chair · transparent formed acrylic shell', shellGeo, acrylic, 0, 0, 0, chair); shell.castShadow = false
  const clearRim = new THREE.MeshPhysicalMaterial({color: '#c2cedc', roughness: .12, metalness: .15, transmission: .65, thickness: .015, transparent: true, opacity: .78})
  tube('Chair · thick polished transparent rim', rim, .014, clearRim, chair, true)
  // Rounded upholstery follows the inside of the moulded bowl, entirely inside its rim.
  const seatPositions: number[] = [], seatUvs: number[] = [], seatIndices: number[] = []
  const seatRings = 36, seatSegments = 96, seatRim: THREE.Vector3[] = []
  for (let j = 0; j <= seatRings; j++) for (let i = 0; i <= seatSegments; i++) {
    const r = j / seatRings, a = i / seatSegments * Math.PI * 2, x = Math.cos(a) * .445 * r, z = Math.sin(a) * .36 * r + .005
    const y = .545 + .115 * r * r + .078 * (1 - r * r) + .002 * clothNoise(x * 25, z * 25)
    seatPositions.push(x, y, z); seatUvs.push(.5 + x, .5 + z)
    if (j === seatRings) seatRim.push(new THREE.Vector3(x, y - .014, z))
    if (j < seatRings && i < seatSegments) { const k = j * (seatSegments + 1) + i; seatIndices.push(k, k + 1, k + seatSegments + 1, k + 1, k + seatSegments + 2, k + seatSegments + 1) }
  }
  const seatGeo = new THREE.BufferGeometry(); seatGeo.setAttribute('position', new THREE.Float32BufferAttribute(seatPositions, 3)); seatGeo.setAttribute('uv', new THREE.Float32BufferAttribute(seatUvs, 2)); seatGeo.setIndex(seatIndices); seatGeo.computeVertexNormals()
  mesh('Chair · fitted round cotton seat', seatGeo, pillowMat, 0, 0, 0, chair)
  tube('Chair · oval cushion edge welt', seatRim, .018, pillowMat, chair, true)
  pillow('Chair · inset curved back cushion', .70, .67, .18, 0, .93, -.315, 0, 0, 1.15, chair)
  box('Nightstand · softly rounded lacquer cabinet', .53, .52, .53, -1.66, .30, -.40, white, .025)
  box('Nightstand · satin pearl top', .55, .036, .55, -1.66, .584, -.40, white, .016).receiveShadow = true
  box('Nightstand · drawer reveal', .465, .006, .003, -1.66, .398, -.132, dark, .001)
  box('Nightstand · recessed drawer grip', .15, .009, .009, -1.66, .426, -.126, chrome, .003)
  const lamp = new THREE.Group(); lamp.name = 'Nightlight · intertwined luminous ribbons'; lamp.position.set(-1.66, .607, -.4); group.add(lamp)
  const pinkBase = new THREE.MeshStandardMaterial({color: '#ead8df', metalness: .24, roughness: .26})
  mesh('Nightlight · satin pink weighted base', new THREE.CylinderGeometry(.125, .138, .035, 56), pinkBase, 0, .018, 0, lamp)
  const pinkLight = new THREE.MeshStandardMaterial({color: '#ffdaef', emissive: '#ff80c8', emissiveIntensity: 1.05, roughness: .25})
  const lampGlass = new THREE.MeshPhysicalMaterial({color: '#fff3fc', roughness: .065, transmission: .86, thickness: .009, ior: 1.46, clearcoat: 1, transparent: true, opacity: .58, depthWrite: false})
  for (let strand = 0; strand < 2; strand++) {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 80; i++) { const t = i / 80; pts.push(new THREE.Vector3(Math.sin(t * Math.PI * 3 + strand * Math.PI) * .091, .052 + t * .365, Math.cos(t * Math.PI * 3 + strand * Math.PI) * .043)) }
    tube('Nightlight · inner pink luminous filament ' + strand, pts, .0042, pinkLight, lamp)
    tube('Nightlight · transparent curved glass sleeve ' + strand, pts, .012, lampGlass, lamp).castShadow = false
    for (const t of [0, 1]) {
      const pt = pts[t ? pts.length - 1 : 0]
      mesh('Nightlight · brushed ferrule ' + strand + ' ' + t, new THREE.CylinderGeometry(.013, .013, .021, 24), chrome, pt.x, pt.y, pt.z, lamp)
    }
  }
  box('Nightlight · recessed touch switch', .022, .002, .011, -.048, .037, .071, chrome, .003, lamp)
  const lampGlow = new THREE.PointLight('#ffb7db', .65, 1.55, 2); lampGlow.position.set(-1.66, .89, -.4); group.add(lampGlow)
  // Move the complete workstation to the expanded southern living-room wall.
  const workstationStart = group.children.length
  // Floating porcelain writing surface with explicit structural brackets and edges.
  box('Desk · thin porcelain working surface', 2.75, .075, .67, -.05, .765, 2.50, white, .025).receiveShadow = true
  box('Desk · lower shadow reveal', 2.65, .015, .615, -.05, .718, 2.50, dark, .005)
  box('Desk · concealed drawer front', 1.06, .091, .022, -.50, .696, 2.16, white, .01)
  box('Desk · second concealed drawer', .99, .091, .022, .56, .696, 2.16, white, .01)
  for (const x of [-1.02, 1.01]) {
    box('Desk · wall bracket', .062, .41, .065, x, .55, 2.78, chrome, .01)
    box('Desk · bracket cantilever', .055, .055, .44, x, .692, 2.55, chrome, .009)
  }
  const monitor = (variant: number) => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 640; const c = canvas.getContext('2d')!
    c.clearRect(0, 0, 1024, 640); c.fillStyle = 'rgba(13,62,80,.37)'; c.fillRect(0, 0, 1024, 640)
    c.strokeStyle = 'rgba(58,222,244,.92)'; c.lineWidth = 2; c.strokeRect(7, 7, 1010, 626)
    const label = (text: string, x: number, y: number, size = 14) => {c.fillStyle = 'rgba(105,231,246,.95)'; c.font = size + 'px monospace'; c.fillText(text, x, y)}
    label(['O / COMPUTATIONAL WORKSPACE', 'NEURAL FIELD / ORGANIC TOPOLOGY', 'ORBIT / REALTIME TELEMETRY', 'NORTH CITY / SENSOR NETWORK', 'FILES / PROJECT ARCHIVE', 'SYSTEM / RESOURCE MONITOR', 'TERMINAL / ACTIVE SESSIONS', 'TASKS / RENDER QUEUE'][variant], 25, 33, 17)
    c.beginPath(); c.moveTo(20, 49); c.lineTo(1004, 49); c.stroke()
    const graph = (x: number, y: number, w: number, h: number, phase: number) => {
      c.strokeStyle = 'rgba(65,192,216,.26)'; c.lineWidth = 1
      for (let j = 0; j <= 4; j++) {c.beginPath(); c.moveTo(x, y + j * h / 4); c.lineTo(x + w, y + j * h / 4); c.stroke()}
      c.strokeStyle = 'rgba(93,237,247,.9)'; c.lineWidth = 2; c.beginPath()
      for (let i = 0; i <= 90; i++) {const v = .46 + Math.sin(i * .18 + phase) * .2 + Math.sin(i * .49 + phase * 3) * .08; i ? c.lineTo(x + i / 90 * w, y + v * h) : c.moveTo(x, y + v * h)} c.stroke()
    }
    if (variant === 0) {
      c.fillStyle = 'rgba(80,191,211,.15)'; c.fillRect(20, 65, 163, 529)
      for (const [i, file] of ['PROJECT / O','  city.field','  neuron.solve','  atmosphere','  render.graph','  streams.cfg','DEPENDENCIES','  space-core','  mesh-signal'].entries()) label(file, 28, 93 + i * 28, 13)
      const code = ['import { Field, Kernel } from "space/core";', '', 'const solver = new Kernel({ precision: 64 });', 'const field = await Field.fromTopology(source);', '', 'export async function integrate(frame) {', '  const { time, origin } = frame;', '  const samples = field.sample(origin, 1024);', '  const weights = samples.map((point) => {', '    const phase = point.gradient.dot(normal);', '    return Math.exp(-phase * phase / 2.0);', '  });', '', '  const solved = await solver.reduce(weights);', '  return solved.normalize().project(camera);', '}', '', '// Stage complete. Stream attached.', 'await viewport.publish(integrate(timeline));']
      for (const [i, line] of code.entries()) {label(String(i + 1).padStart(2, '0'), 195, 86 + i * 23, 13); label(line, 230, 86 + i * 23, 14)}
      c.strokeStyle = 'rgba(83,221,242,.55)'; c.strokeRect(197, 544, 803, 58); label('BUILD SUCCESS    0 ERRORS    4 STREAMS CONNECTED', 215, 580, 14)
    } else if (variant === 1) {
      const project = (lat: number, lon: number) => {
        const radius = 1 + .17 * Math.sin(lon * 3 + .8) * Math.cos(lat * 2) + .12 * Math.sin(lat * 5 + lon * 2) + .05 * Math.cos(lon * 7 - lat * 4)
        const x = Math.cos(lat) * Math.cos(lon) * radius, y = Math.sin(lat) * radius, z = Math.cos(lat) * Math.sin(lon) * radius
        const turn = .48, px = x * Math.cos(turn) - z * Math.sin(turn), pz = x * Math.sin(turn) + z * Math.cos(turn)
        return {x: 508 + px * 152, y: 322 - y * 174 + pz * 25, depth: pz}
      }
      for (let band = 0; band < 28; band++) {
        const lat = -Math.PI / 2 + (band + .5) / 28 * Math.PI
        c.beginPath(); c.strokeStyle = 'rgba(71,220,243,.75)'; c.lineWidth = 1.3
        for (let k = 0; k <= 90; k++) {const p = project(lat, k / 90 * Math.PI * 2); k ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)} c.stroke()
      }
      for (let meridian = 0; meridian < 36; meridian++) {
        c.beginPath(); c.strokeStyle = 'rgba(124,246,255,.64)'
        for (let k = 0; k <= 65; k++) {const p = project(-Math.PI / 2 + k / 65 * Math.PI, meridian / 36 * Math.PI * 2); k ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)} c.stroke()
      }
      label('SUBJECT  082 / MORPHOLOGY', 350, 558, 15)
      for (let i = 0; i < 16; i++) {label('N' + String(i * 17).padStart(3, '0') + '  ' + (0.428 + i * .017).toFixed(3), 27, 88 + i * 22, 12); label('C.' + i + '  ' + (96.2 - i * .41).toFixed(2) + '%', 833, 90 + i * 22, 12)}
      graph(30, 459, 205, 115, 1); graph(790, 459, 205, 115, 3)
    } else if (variant === 2) {
      c.save(); c.translate(504, 289); c.strokeStyle = 'rgba(82,231,248,.88)'; c.lineWidth = 1.8
      for (let i = -5; i <= 5; i++) {c.beginPath(); c.ellipse(0, 0, 140 * Math.sqrt(1 - (i / 6) ** 2), 140, .13, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.ellipse(0, i * 23, 140 * Math.sqrt(1 - (i / 6) ** 2), 19, 0, 0, Math.PI * 2); c.stroke()}
      for (const a of [-.42, .38]) {c.beginPath(); c.ellipse(0, 0, 233, 51, a, 0, Math.PI * 2); c.stroke()}
      c.fillStyle = '#b2faff'; c.beginPath(); c.arc(195, -92, 7, 0, Math.PI * 2); c.fill(); c.restore()
      label('TRAJECTORY  04.17.09', 29, 86); label('DISTANCE  1.82 AU', 733, 87); label('LOCK / NOMINAL', 405, 460, 16)
      graph(38, 490, 446, 101, 2); graph(543, 490, 440, 101, 5)
      for (let i = 0; i < 11; i++) {label('V' + i + ' ' + (i * 31.791 + 312.6).toFixed(2), 30, 127 + i * 25, 13); label('T+' + i + '  ' + (i * .871 + 18).toFixed(2), 849, 127 + i * 25, 13)}
    } else if (variant === 3) {
      label('SIGNAL / 48 CHANNELS', 31, 89, 17); label('NETWORK LATENCY  0.8 MS', 614, 89, 16)
      graph(31, 120, 580, 170, 4); graph(31, 345, 580, 169, 7)
      for (let i = 0; i < 16; i++) {const w = 60 + ((i * 43) % 229); c.fillStyle = i % 4 ? 'rgba(50,218,233,.56)' : 'rgba(142,247,255,.81)'; c.fillRect(656, 124 + i * 25, w, 9); label(String(i + 1).padStart(2, '0'), 973, 133 + i * 25, 12)}
      label('SPECTRAL COHERENCE', 35, 330, 14); label('ALL NODES SYNCHRONIZED / 22:48:09.271', 37, 580, 17)
    } else if (variant === 4) {
      label('WORKSPACE / O / PROJECTS', 32, 89, 19)
      for (let i = 0; i < 8; i++) {
        const y=130+i*55
        c.fillStyle='rgba(74,206,230,.12)';c.fillRect(26,y-25,969,42)
        c.strokeStyle='rgba(109,235,248,.85)';c.strokeRect(42,y-14,28,21)
        label(['city-field','neural-atlas','orbital-study','weather-models','light-maps','render-exports','archive-2087','shared-notes'][i],92,y+3,18)
        label(i<3?'SYNCED':'LOCAL',744,y+3,15);label((128+i*73)+' MB',873,y+3,14)
      }
    } else if (variant === 5) {
      for (let i=0;i<3;i++) {
        const x=177+i*330;c.strokeStyle='rgba(89,227,246,.23)';c.lineWidth=18;c.beginPath();c.arc(x,218,100,0,Math.PI*2);c.stroke()
        c.strokeStyle=i===1?'rgba(241,156,221,.9)':'rgba(102,235,252,.95)';c.beginPath();c.arc(x,218,100,-Math.PI/2,-Math.PI/2+Math.PI*2*[.42,.68,.27][i]);c.stroke()
        label(['CPU 42%','GPU 68%','RAM 27%'][i],x-63,225,24)
      }
      graph(42,385,937,150,3);label('THERMALS NORMAL / ALL SYSTEMS ONLINE',47,585,21)
    } else if (variant === 6) {
      const lines=['> connect workspace.local','  secure channel established','> load neural-atlas --stream','  1024 samples / frame','> watch city-field','  telemetry attached','> compile lighting','  completed in 0.84 s','> _']
      lines.forEach((line,i)=>label(line,38,103+i*53,25))
    } else {
      for (let i=0;i<4;i++) {
        const y=110+i*125;label(['SCENE / NORTH CITY','NEURAL FIELD / SOLVE','ORBIT / SIMULATE','BACKUP / WORKSPACE'][i],35,y,23)
        c.fillStyle='rgba(51,160,193,.22)';c.fillRect(36,y+24,840,27)
        c.fillStyle=i===2?'rgba(236,139,211,.82)':'rgba(103,232,247,.86)';c.fillRect(36,y+24,[840,612,445,269][i],27)
        label(['100%','73%','53%','32%'][i],903,y+47,24)
      }
    }
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
    return new THREE.MeshBasicMaterial({map: t, color: new THREE.Color(1.1, 1.36, 1.42), transparent: true, opacity: .97, side: THREE.DoubleSide, depthWrite: false, blending: THREE.NormalBlending, toneMapped: false})
  }
  // All displays share a wall-parallel plane, 38 mm in front of the plaster.
  // Coordinates below remain local to the workstation's existing 3.15 m offset.
  const panelZ=2.962
  const screenSizes: [number, number, number, number, number][] = [
    [.90,.64,-.96,1.58,0],[1.02,.72,.07,1.58,1],[.62,.60,.95,1.58,2],
    [.88,.55,-.96,2.34,4],[1.00,.60,.07,2.34,5],[.62,.55,.95,2.34,3],
    [1.20,.31,-.79,1.02,6],[1.20,.31,.56,1.02,7],
  ]
  for (const [w, h, x, y, variant] of screenSizes) {
    const s = mesh('Hologram · wall computer panel ' + variant, new THREE.PlaneGeometry(w, h), monitor(variant), x, y, panelZ)
    s.rotation.y = Math.PI; s.castShadow = s.receiveShadow = false
    s.userData.wallProjection={variant,wallZ:6.15,clearance:.038}
    for (const dx of [-w / 2, w / 2]) box('Hologram · thin transparent panel edge', .003, h, .003, x + dx, y, panelZ-.002, new THREE.MeshBasicMaterial({color: variant===7?'#ef9bd7':'#34cce8', transparent: true, opacity: .8, toneMapped: false}), .001)
  }
  box('Hologram · wall-mounted projection rail',2.66,.035,.022,-.05,.845,2.985,chrome,.006)
  box('Hologram · recessed cyan rail lens',2.56,.008,.004,-.05,.847,2.972,new THREE.MeshBasicMaterial({color:'#75e5f7',toneMapped:false}),.001).castShadow=false
  const keys = document.createElement('canvas'); keys.width = 1024; keys.height = 320; const kc = keys.getContext('2d')!
  kc.clearRect(0, 0, 1024, 320); kc.strokeStyle = 'rgba(12,183,220,.98)'; kc.lineWidth = 3; kc.strokeRect(3, 3, 1018, 314)
  for (let j = 0; j < 4; j++) for (let i = 0; i < 15; i++) kc.strokeRect(28 + i * 64 + (j % 2) * 7, 24 + j * 56, 49, 38)
  kc.strokeRect(270, 260, 440, 28)
  const kt = new THREE.CanvasTexture(keys); kt.colorSpace = THREE.SRGBColorSpace
  const keyboard = mesh('Desk · projected cyan keyboard', new THREE.PlaneGeometry(.91, .27), new THREE.MeshBasicMaterial({map: kt, transparent: true, opacity: .92, blending: THREE.NormalBlending, toneMapped: false, depthWrite: false, side: THREE.DoubleSide}), -.32, .807, 2.34)
  keyboard.rotation.x = -Math.PI / 2; keyboard.rotation.z = Math.PI; keyboard.castShadow = keyboard.receiveShadow = false
  box('Desk · optical touchpad glass', .27, .004, .24, .57, .806, 2.35, new THREE.MeshPhysicalMaterial({color: '#e2f9ff', transmission: .5, transparent: true, opacity: .45, roughness: .12}), .015)
  const stool = new THREE.Group(); stool.name = 'Desk · ergonomic round stool'; stool.position.set(0, 0, 1.62); group.add(stool)
  mesh('Stool · chrome base', new THREE.CylinderGeometry(.22, .26, .035, 48), chrome, 0, .05, 0, stool)
  mesh('Stool · support column', new THREE.CylinderGeometry(.032, .041, .44, 24), chrome, 0, .28, 0, stool)
  mesh('Stool · upholstered seat', new THREE.CylinderGeometry(.235, .218, .10, 48), linen, 0, .535, 0, stool)
  mesh('Stool · footrest', new THREE.TorusGeometry(.155, .011, 10, 48), chrome, 0, .24, 0, stool).rotation.x = Math.PI / 2
  const workstation = new THREE.Group(); workstation.name = 'Southern living-room workstation'; workstation.position.z = 3.15
  const workstationParts = group.children.slice(workstationStart)
  for (const part of workstationParts) workstation.add(part)
  workstation.userData.projections={count:screenSizes.length,wallZ:6.15,panelZ:panelZ+workstation.position.z,wallClearance:.038}
  group.add(workstation)
  return group
}








