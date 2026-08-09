import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.LIVE_WORK_DISTRICT_OUTPUT ?? 'output/residential-ever-hour-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const programs = {
  'scientist-residential': { prefix: 'RESIDENTIAL', count: 36, laneCount: 15, codes: Array.from({ length: 36 }, (_, index) => `R${String(index + 1).padStart(2, '0')}`), metadata: 'residentialScientistsDistrict' },
  'even-hour-hotel': { prefix: 'EVER_HOUR', count: 23, laneCount: 9, codes: Array.from({ length: 23 }, (_, index) => `H${String(index + 1).padStart(2, '0')}`), metadata: 'everHourDistrict' },
};

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1800, height: 1100 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(240_000);
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForFunction(() => document.querySelector('#loading-screen')?.classList.contains('done') === true);
  await page.evaluate(() => window.advanceTime(400));

  const audits = {};
  for (const [districtId, expected] of Object.entries(programs)) {
    await page.evaluate((id) => window.labIsland.select(id, 'scene'), districtId);
    await page.waitForFunction((id) => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => entry.id === id && entry.loadState === 'loaded' && entry.detailResident && entry.visualLevel === 'detail'), districtId);
    if (districtId === 'scientist-residential') {
      await page.evaluate(() => window.labIsland.worldStreaming.ensurePackageResident(window.labIsland.objectGroups.get('environmental-science-labs')));
      await page.waitForFunction(() => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => entry.id === 'environmental-science-labs' && entry.loadState === 'loaded' && entry.detailResident));
    }
    audits[districtId] = await page.evaluate(({ districtId, expected }) => {
      const world = window.labIsland;
      const district = world.objectGroups.get(districtId);
      const definition = world.definitions.get(districtId);
      const pkg = world.worldStreaming.packages.get(districtId);
      if (!district || !definition?.sector || !pkg?.authorityRoot) throw new Error(`Unavailable live-work package ${districtId}`);
      const authorityRoot = pkg.authorityRoot;
      const facilities = [];
      district.traverse((object) => { if (object.userData.exteriorProgram === true) facilities.push(object); });
      const names = [];
      const materialNames = new Set();
      const animations = new Map();
      let meshCount = 0;
      let triangleCount = 0;
      authorityRoot.traverse((object) => {
        if (object.name) names.push(object.name);
        const profile = object.userData.animate ?? object.userData.gpuAnimationProfile;
        if (profile) animations.set(profile, (animations.get(profile) ?? 0) + 1);
        if (!object.isMesh || !object.geometry) return;
        meshCount += 1;
        triangleCount += object.geometry.index ? object.geometry.index.count / 3 : object.geometry.attributes.position.count / 3;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((entry) => materialNames.add(entry.name));
      });

      const normalizeNear = (angle, reference) => reference + Math.atan2(Math.sin(angle - reference), Math.cos(angle - reference));
      const boxes = [];
      const boundaryViolations = [];
      facilities.forEach((facility) => {
        facility.updateMatrixWorld(true);
        const localBounds = facility.userData.authoredLocalBounds;
        if (!localBounds?.min || !localBounds?.max) throw new Error(`Missing authored bounds for ${facility.userData.buildingCode}`);
        const min = world.camera.position.clone().set(Infinity, Infinity, Infinity);
        const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity);
        for (const x of [localBounds.min.x, localBounds.max.x]) for (const y of [localBounds.min.y, localBounds.max.y]) for (const z of [localBounds.min.z, localBounds.max.z]) {
          const point = world.camera.position.clone().set(x, y, z).applyMatrix4(facility.matrixWorld);
          min.min(point); max.max(point);
          const radius = Math.hypot(point.x, point.z);
          const angle = normalizeNear(Math.atan2(point.z, point.x), definition.sector.centerAngle);
          if (radius < definition.sector.innerRadius - 0.3 || radius > definition.sector.outerRadius + 0.3 || angle < definition.sector.startAngle - 0.015 || angle > definition.sector.endAngle + 0.015) boundaryViolations.push({ code: facility.userData.buildingCode, radius: Number(radius.toFixed(3)), angle: Number((angle * 180 / Math.PI).toFixed(2)) });
        }
        boxes.push({ code: facility.userData.buildingCode, min: min.toArray(), max: max.toArray() });
      });
      const overlaps = [];
      for (let left = 0; left < boxes.length; left += 1) for (let right = left + 1; right < boxes.length; right += 1) {
        const a = boxes[left]; const b = boxes[right];
        const overlapX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
        const overlapZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
        if (overlapX > 0.2 && overlapZ > 0.2) overlaps.push({ pair: `${a.code}/${b.code}`, overlapX: Number(overlapX.toFixed(3)), overlapZ: Number(overlapZ.toFixed(3)) });
      }
      const environmentalTerritoryIntrusions = [];
      if (districtId === 'scientist-residential') {
        authorityRoot.traverse((object) => {
          if (object.userData.perimeterResidentialAnnex === true) environmentalTerritoryIntrusions.push(object.name);
          if (!object.isMesh || !object.geometry || !object.userData.greenHighlightedResidentialPocket) return;
          object.geometry.computeBoundingBox();
          const bounds = object.geometry.boundingBox;
          if (!bounds) return;
          for (const x of [bounds.min.x, bounds.max.x]) for (const z of [bounds.min.z, bounds.max.z]) {
            const point = world.camera.position.clone().set(x, 0, z).applyMatrix4(object.matrixWorld);
            if (Math.hypot(point.x, point.z) > definition.sector.outerRadius + 0.3) environmentalTerritoryIntrusions.push(object.name);
          }
        });
      }

      const lookup = (name) => district.getObjectByName(name) ?? authorityRoot.getObjectByName(name);
      const routePrefix = `LIVEWORK__${expected.prefix}`;
      const continuum = lookup(`${routePrefix}__CONTINUUM_WALK`);
      const service = lookup(`${routePrefix}__CONTROLLED_SOUTHERN_SERVICE_LANE`);
      const nightLightingNetwork = lookup(`${routePrefix}__NIGHT_LIGHTING_NETWORK`);
      const approaches = expected.codes.map((code) => lookup(`${routePrefix}__BUILDING_APPROACH_${code}`));
      const organicLanes = [];
      authorityRoot.traverse((object) => { if (object.name.startsWith(`${routePrefix}__ORGANIC_LANE__`)) organicLanes.push(object); });
      const approachStats = approaches.map((approach, index) => ({
        code: expected.codes[index],
        turnCount: Number(approach?.userData.turnCount ?? 0),
        routeLength: Number(approach?.userData.routeLength ?? Infinity),
        directDistance: Number(approach?.userData.directDistance ?? Infinity),
        routePointCount: Number(approach?.userData.routePointCount ?? 0),
        width: approach?.geometry?.attributes?.position ? world.camera.position.clone().fromBufferAttribute(approach.geometry.attributes.position, 0).distanceTo(world.camera.position.clone().fromBufferAttribute(approach.geometry.attributes.position, 1)) : Infinity,
      }));
      const organicPlacements = facilities.map((facility) => ({ code: facility.userData.buildingCode, ...facility.userData.organicPlacement }));
      const transparentBuildingMaterials = [];
      facilities.forEach((facility) => facility.traverse((object) => {
        if (!object.isMesh) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((entry) => {
          if (entry?.transparent === true && entry.opacity < 0.999 && entry.name !== 'Live-work shallow reflecting water') {
            transparentBuildingMaterials.push({ code: facility.userData.buildingCode, mesh: object.name, material: entry.name, opacity: entry.opacity });
          }
        });
      }));
      const cyberpunkAudit = districtId === 'scientist-residential' ? {
        envelopeCount: facilities.filter((facility) => facility.userData.cyberpunkEnvelope === true).length,
        opaqueArchitectureCount: facilities.filter((facility) => facility.userData.opaqueResidentialArchitecture === true).length,
        transparentBuildingMaterials,
        publicRealm: Boolean(lookup('LIVEWORK__RESIDENTIAL__CYBERPUNK_NEON_PUBLIC_REALM')?.userData.cyberpunkPublicRealm),
        laneCenterlights: names.filter((name) => name.startsWith('LIVEWORK__RESIDENTIAL__CYBERPUNK_LANE_CENTERLIGHT__')).length,
        greenPocketRoads: names.filter((name) => name.startsWith('LIVEWORK__RESIDENTIAL__ORGANIC_LANE__GREEN_POCKET_')).length,
        megablocks: facilities.filter((facility) => /^R2[1-7]$/.test(facility.userData.buildingCode)).map((facility) => ({
          code: facility.userData.buildingCode,
          name: facility.userData.buildingName,
          form: facility.userData.facilityForm,
          footprintMetres: facility.userData.footprintMetres,
          heightMetres: facility.userData.heightMetres,
          normalizedRadial: facility.userData.sectorAnchor?.normalizedRadial,
          normalizedAngular: facility.userData.sectorAnchor?.normalizedAngular,
          signature: facility.userData.cyberpunkMegablock,
          towerCount: names.filter((name) => name.startsWith(`LIVEWORK__${facility.userData.buildingCode}__APARTMENT_TOWER_`)).length,
          skybridgeCount: names.filter((name) => name.startsWith(`LIVEWORK__${facility.userData.buildingCode}__INHABITED_CHROMATIC_SKYBRIDGE_`)).length,
        })),
        greenPocketResidences: facilities.filter((facility) => /^R(?:2[8-9]|3[0-6])$/.test(facility.userData.buildingCode)).map((facility) => ({
          code: facility.userData.buildingCode,
          name: facility.userData.buildingName,
          form: facility.userData.facilityForm,
          heightMetres: facility.userData.heightMetres,
          radius: facility.userData.sectorAnchor?.radius,
          normalizedRadial: facility.userData.sectorAnchor?.normalizedRadial,
          normalizedAngular: facility.userData.sectorAnchor?.normalizedAngular,
          ring: facility.userData.sectorAnchor?.ring,
          greenHighlightedResidentialPocket: facility.userData.greenHighlightedResidentialPocket,
          signature: facility.userData.cyberpunkResidentialEdge,
        })),
      } : null;
      const flagship = facilities.find((facility) => facility.userData.buildingCode === 'H23');
      let flagshipAudit = null;
      if (flagship) {
        flagship.updateMatrixWorld(true);
        const localBounds = flagship.userData.authoredLocalBounds;
        const size = world.camera.position.clone().set(
          localBounds.max.x - localBounds.min.x,
          localBounds.max.y - localBounds.min.y,
          localBounds.max.z - localBounds.min.z,
        );
        const inverseFlagship = flagship.matrixWorld.clone().invert();
        const passageIntrusions = [];
        flagship.traverse((object) => {
          if (!object.isMesh || object.userData.navObstacle !== true || !object.geometry) return;
          if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
          const bounds = object.geometry.boundingBox;
          if (!bounds) return;
          const matrix = inverseFlagship.clone().multiply(object.matrixWorld);
          const min = world.camera.position.clone().set(Infinity, Infinity, Infinity);
          const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity);
          for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
            const point = world.camera.position.clone().set(x, y, z).applyMatrix4(matrix);
            min.min(point); max.max(point);
          }
          const occupiesWalkingHeight = min.y < 2.1 && max.y > 0.08;
          const blocksContinuum = min.x < 1.12 && max.x > -1.12 && min.z < 6.5 && max.z > -6.5;
          const blocksCrosswalk = min.z < 0.54 && max.z > -0.54 && min.x < 9.5 && max.x > -9.5;
          if (occupiesWalkingHeight && (blocksContinuum || blocksCrosswalk)) passageIntrusions.push(object.name);
        });
        flagshipAudit = {
          code: flagship.userData.buildingCode,
          name: flagship.userData.buildingName,
          purpose: flagship.userData.purpose,
          form: flagship.userData.facilityForm,
          footprintMetres: flagship.userData.footprintMetres,
          heightMetres: flagship.userData.heightMetres,
          actualSize: size.toArray(),
          normalizedRadial: flagship.userData.sectorAnchor?.normalizedRadial,
          normalizedAngular: flagship.userData.sectorAnchor?.normalizedAngular,
          rotationOffset: flagship.userData.organicPlacement?.rotationOffset,
          publicPassages: flagship.userData.publicPassages,
          wordmark: flagship.userData.wordmark,
          towerQuadrants: names.filter((name) => name.startsWith('LIVEWORK__H23__') && name.endsWith('_HOTEL_TOWER')).length,
          skyLobbies: names.filter((name) => name === 'LIVEWORK__H23__CONTINUUM_SKY_LOBBY' || name === 'LIVEWORK__H23__CROSSING_SKY_LOBBY').length,
          crownRings: names.filter((name) => name.startsWith('LIVEWORK__H23__ASTRONOMICAL_TIME_CROWN_RING_')).length,
          passageIntrusions,
        };
      }
      const positions = continuum?.geometry?.attributes?.position;
      if (!positions) throw new Error(`Missing continuum geometry for ${districtId}`);
      const startA = world.camera.position.clone().fromBufferAttribute(positions, 0).applyMatrix4(continuum.matrixWorld);
      const startB = world.camera.position.clone().fromBufferAttribute(positions, 1).applyMatrix4(continuum.matrixWorld);
      const continuumWidth = startA.distanceTo(startB);
      const endA = world.camera.position.clone().fromBufferAttribute(positions, positions.count - 2).applyMatrix4(continuum.matrixWorld);
      const endB = world.camera.position.clone().fromBufferAttribute(positions, positions.count - 1).applyMatrix4(continuum.matrixWorld);
      const outerEndpoint = startA.add(startB).multiplyScalar(0.5);
      const innerEndpoint = endA.add(endB).multiplyScalar(0.5);
      const midpointPair = Math.floor(positions.count / 4) * 2;
      const midA = world.camera.position.clone().fromBufferAttribute(positions, midpointPair).applyMatrix4(continuum.matrixWorld);
      const midB = world.camera.position.clone().fromBufferAttribute(positions, midpointPair + 1).applyMatrix4(continuum.matrixWorld);
      const roadPoint = midA.add(midB).multiplyScalar(0.5);
      world.walkController.refreshNavigation();
      const roadGround = world.walkController.sampleGround(roadPoint.x, roadPoint.z);
      const text = world.getTextSnapshot();
      const compact = JSON.parse(window.render_game_to_text());
      return {
        codes: facilities.map((facility) => facility.userData.buildingCode).sort(),
        names: facilities.map((facility) => facility.userData.buildingName),
        selectableIds: facilities.map((facility) => facility.userData.individualSelectableId),
        facilityCount: facilities.length,
        meshCount,
        triangleCount,
        materialNames: [...materialNames].sort(),
        animations: Object.fromEntries(animations),
        boundaryViolations,
        overlaps,
        environmentalTerritoryIntrusions,
        topLevelNames: district.children.filter((child) => child.userData.gpuRuntimeBatch !== true).map((child) => child.name),
        program: district.userData[expected.metadata],
        population: district.userData.population,
        textDistrict: text[expected.metadata],
        compactDistrict: compact[expected.metadata],
        compactSelected: compact.selected,
        nightLighting: {
          metadata: nightLightingNetwork?.userData.nightLightingNetwork,
          promenadeLanterns: names.filter((name) => name.startsWith(`${routePrefix}__PROMENADE_LAMP_`) && name.endsWith('__LANTERN')).length,
          laneLightTrees: names.filter((name) => name.startsWith(`${routePrefix}__LANE_LIGHT_TREE_`) && name.endsWith('__TRUNK')).length,
          illuminatedWalkGates: names.filter((name) => name.startsWith(`${routePrefix}__ILLUMINATED_WALK_GATE_`) && name.endsWith('__CROWN')).length,
          skylineBeacons: names.filter((name) => name.startsWith(`${routePrefix}__SKYLINE_BEACON_`) && name.endsWith('__MAST')).length,
          blockingMeshes: (() => {
            const blocking = [];
            nightLightingNetwork?.traverse((object) => { if (object.isMesh && object.userData.navObstacle === true) blocking.push(object.name); });
            return blocking;
          })(),
        },
        revision: text.masterplan.specializedDistrictLayoutRevision,
        planning: text.planning,
        streaming: world.worldStreaming.getSnapshot().packages.find((entry) => entry.id === districtId),
        flagship: flagshipAudit,
        cyberpunk: cyberpunkAudit,
        routes: {
          continuum: Boolean(continuum?.parent) && continuum.userData.walkable === true,
          continuumWidth,
          service: Boolean(service?.parent) && service.userData.walkable === true,
          approaches: approaches.filter((route) => Boolean(route?.parent) && route.userData.walkable === true).length,
          organicLanes: organicLanes.map((lane) => ({ name: lane.name, hierarchy: lane.userData.networkHierarchy, style: lane.userData.routeStyle })),
          approachStats,
          organicPlacements,
          outerEndpoint: outerEndpoint.toArray(),
          innerEndpoint: innerEndpoint.toArray(),
          roadPoint: roadPoint.toArray(),
          roadGround,
        },
      };
    }, { districtId, expected });
  }

  const seamGap = Math.hypot(
    audits['scientist-residential'].routes.innerEndpoint[0] - audits['even-hour-hotel'].routes.outerEndpoint[0],
    audits['scientist-residential'].routes.innerEndpoint[2] - audits['even-hour-hotel'].routes.outerEndpoint[2],
  );
  for (const [districtId, expected] of Object.entries(programs)) {
    const audit = audits[districtId];
    if (audit.facilityCount !== expected.count || audit.codes.join(',') !== expected.codes.join(',')) throw new Error(`${districtId} facility program is incomplete: ${audit.codes.join(', ')}`);
    if (new Set(audit.names).size !== expected.count || audit.names.some((name) => typeof name !== 'string' || !name)) throw new Error(`${districtId} semantic names are incomplete`);
    if (audit.selectableIds.some((id) => typeof id !== 'string' || !id.startsWith(`${districtId}__building-`)) || new Set(audit.selectableIds).size !== expected.count) throw new Error(`${districtId} per-building selection IDs are incomplete`);
    if (audit.meshCount < expected.count * 14 || audit.triangleCount > 250_000) throw new Error(`${districtId} detail/budget failed: ${audit.meshCount} meshes, ${audit.triangleCount} triangles`);
    if (audit.boundaryViolations.length) throw new Error(`${districtId} facilities cross their authorized sector: ${JSON.stringify(audit.boundaryViolations.slice(0, 10))}`);
    if (audit.overlaps.length) throw new Error(`${districtId} facility envelopes overlap: ${JSON.stringify(audit.overlaps.slice(0, 10))}`);
    if (audit.environmentalTerritoryIntrusions.length) throw new Error(`${districtId} still occupies Environmental Science territory: ${JSON.stringify(audit.environmentalTerritoryIntrusions)}`);
    if (!audit.routes.continuum || !audit.routes.service || audit.routes.approaches !== expected.count || audit.routes.roadGround === null) throw new Error(`${districtId} circulation is incomplete: ${JSON.stringify(audit.routes)}`);
    if (audit.routes.organicLanes.length !== expected.laneCount || audit.routes.organicLanes.some((lane) => lane.style !== 'shared-organic-campus-lane' || !['neighborhood-spine', 'cornered-crosswalk', 'green-pocket-weave', 'green-pocket-court'].includes(lane.hierarchy))) throw new Error(`${districtId} organic lane hierarchy is incomplete: ${JSON.stringify(audit.routes.organicLanes)}`);
    if (Math.abs(audit.routes.continuumWidth - 1.9) > 0.03) throw new Error(`${districtId} Continuum remains boulevard-scaled: ${audit.routes.continuumWidth}`);
    if (audit.routes.approachStats.some((route) => route.turnCount < 1 || route.routePointCount < 3 || route.routeLength > 18 || route.width > 0.55)) throw new Error(`${districtId} retained a straight, oversized, or district-spanning building connector: ${JSON.stringify(audit.routes.approachStats)}`);
    if (audit.routes.organicPlacements.length !== expected.count || audit.routes.organicPlacements.some((placement) => placement.deterministic !== true) || audit.routes.organicPlacements.filter((placement) => Math.abs(placement.rotationOffset) > 0.08).length < Math.floor(expected.count * 0.6)) throw new Error(`${districtId} building placement remains regimented: ${JSON.stringify(audit.routes.organicPlacements)}`);
    if (audit.program?.buildingCount !== expected.count || audit.textDistrict?.buildingCount !== expected.count || audit.compactDistrict?.buildingCount !== expected.count) throw new Error(`${districtId} text metadata is incomplete`);
    if (audit.population?.realizedFacilityCount !== expected.count || audit.population?.liveWorkVisitIntegrated !== true) throw new Error(`${districtId} population metadata is incomplete`);
    if (audit.revision !== 26 || audit.planning?.cellViolations !== 0 || !audit.streaming?.detailResident || audit.compactSelected?.packageId !== districtId) throw new Error(`${districtId} integration failed: ${JSON.stringify({ revision: audit.revision, planning: audit.planning, streaming: audit.streaming, selected: audit.compactSelected })}`);
    if ((audit.animations['residential-ever-hour-emissive-pulse'] ?? 0) < 6 || (audit.animations['residential-ever-hour-rotation'] ?? 0) < 1) throw new Error(`${districtId} operational animation is incomplete: ${JSON.stringify(audit.animations)}`);
    const expectedNightLighting = districtId === 'scientist-residential'
      ? { promenadeLanterns: 48, laneLightTrees: 30, illuminatedWalkGates: 7, skylineBeacons: 12, minimumEmitters: 260 }
      : { promenadeLanterns: 56, laneLightTrees: 27, illuminatedWalkGates: 9, skylineBeacons: 14, minimumEmitters: 290 };
    if (audit.nightLighting.promenadeLanterns !== expectedNightLighting.promenadeLanterns
      || audit.nightLighting.laneLightTrees !== expectedNightLighting.laneLightTrees
      || audit.nightLighting.illuminatedWalkGates !== expectedNightLighting.illuminatedWalkGates
      || audit.nightLighting.skylineBeacons !== expectedNightLighting.skylineBeacons
      || audit.nightLighting.metadata?.emissiveElements < expectedNightLighting.minimumEmitters
      || audit.nightLighting.metadata?.nonBlocking !== true
      || audit.nightLighting.blockingMeshes.length) throw new Error(`${districtId} night lighting network is incomplete or blocks WALK: ${JSON.stringify(audit.nightLighting)}`);
    if (audit.topLevelNames.some((name) => !name.startsWith('LIVEWORK__') && name !== 'DISTRICT_ROADS__GENERATED_NETWORK')) throw new Error(`Generic placeholder leaked into ${districtId}: ${audit.topLevelNames.join(', ')}`);
  }
  const residentialCyberpunk = audits['scientist-residential'].cyberpunk;
  if (!residentialCyberpunk?.publicRealm || residentialCyberpunk.envelopeCount !== 36 || residentialCyberpunk.opaqueArchitectureCount !== 36 || residentialCyberpunk.laneCenterlights !== 15 || residentialCyberpunk.greenPocketRoads !== 4) throw new Error(`Residential district-wide cyberpunk treatment is incomplete: ${JSON.stringify(residentialCyberpunk)}`);
  if (residentialCyberpunk.transparentBuildingMaterials.length) throw new Error(`Residential architecture still contains transparent materials: ${JSON.stringify(residentialCyberpunk.transparentBuildingMaterials.slice(0, 20))}`);
  if (residentialCyberpunk.megablocks.length !== 7 || residentialCyberpunk.megablocks.some((block) => block.form !== 'cyberpunk-scientist-megablock' || block.heightMetres < 90 || block.towerCount !== 3 || block.skybridgeCount !== 2 || block.signature?.apartmentBalconyBands !== 96)) throw new Error(`Residential scientist megablock program is incomplete: ${JSON.stringify(residentialCyberpunk.megablocks)}`);
  const megablocksByCode = Object.fromEntries(residentialCyberpunk.megablocks.map((block) => [block.code, block]));
  if (['R21', 'R22', 'R23'].some((code) => megablocksByCode[code]?.normalizedRadial < 0.96)
    || ['R24', 'R25'].some((code) => megablocksByCode[code]?.normalizedAngular > 0.03)
    || ['R26', 'R27'].some((code) => megablocksByCode[code]?.normalizedRadial > 0.03)) throw new Error(`Residential megablocks escaped their red-contour expansion bands: ${JSON.stringify(residentialCyberpunk.megablocks)}`);
  if (residentialCyberpunk.greenPocketResidences.length !== 9 || residentialCyberpunk.greenPocketResidences.some((block) => block.form !== 'cyberpunk-residential-edge-ensemble' || block.heightMetres < 70 || block.radius < 245 || block.radius > 305 || block.normalizedRadial < 0.06 || block.normalizedRadial > 1 || block.normalizedAngular < 0.92 || block.normalizedAngular > 1 || block.ring !== 'outer' || block.greenHighlightedResidentialPocket !== true || block.signature?.apartmentSlabCount !== 2 || block.signature?.inhabitedBalconyBands !== 48)) throw new Error(`Green-highlighted Residential pocket is incomplete: ${JSON.stringify(residentialCyberpunk.greenPocketResidences)}`);
  const flagship = audits['even-hour-hotel'].flagship;
  if (!flagship || flagship.name !== 'The Ever Hour' || flagship.form !== 'four-quadrant-grand-hotel' || !/flagship all-hour hotel/i.test(flagship.purpose)) throw new Error(`The Ever Hour semantic program is incomplete: ${JSON.stringify(flagship)}`);
  if (flagship.heightMetres < 120 || flagship.footprintMetres?.[0] < 180 || flagship.footprintMetres?.[1] < 120 || flagship.actualSize?.[1] < 14) throw new Error(`The Ever Hour is not a huge landmark hotel: ${JSON.stringify(flagship)}`);
  if (Math.abs(flagship.normalizedRadial - 0.53) > 0.002 || Math.abs(flagship.normalizedAngular - 0.5) > 0.002 || Math.abs(flagship.rotationOffset) > 0.001) throw new Error(`The Ever Hour is not fixed at the district middle: ${JSON.stringify(flagship)}`);
  if (flagship.towerQuadrants !== 4 || flagship.skyLobbies !== 2 || flagship.crownRings !== 4 || flagship.wordmark?.text !== 'THE EVER HOUR' || flagship.wordmark?.pixelCount < 60) throw new Error(`The Ever Hour landmark signatures are incomplete: ${JSON.stringify(flagship)}`);
  if (flagship.publicPassages?.openAtGround !== true || flagship.publicPassages?.continuumWidth < 3 || flagship.publicPassages?.crosswalkWidth < 2.2 || flagship.passageIntrusions.length) throw new Error(`The Ever Hour blocks its public crossing: ${JSON.stringify(flagship)}`);
  if (seamGap > 0.02) throw new Error(`Continuum Walk district seam is not continuous: ${seamGap}`);
  const requiredMaterials = ['Live-work warm black brick', 'Live-work reddish ceramic', 'Live-work pale limestone', 'Live-work dark timber composite', 'Ever Hour dark basalt', 'Live-work pale technical ceramic', 'Ever Hour matte titanium', 'Ever Hour champagne metal', 'Live-work transparent photovoltaic glass', 'Residential cyberpunk black-violet alloy', 'Residential cyberpunk cyan neon', 'Residential cyberpunk magenta neon', 'Residential cyberpunk violet neon', 'Residential opaque indigo glazing', 'Residential opaque opaline panel', 'Residential opaque cyan canopy panel', 'Residential opaque photovoltaic panel', 'Residential opaque cyan-violet holographic panel'];
  const combinedMaterials = new Set(Object.values(audits).flatMap((audit) => audit.materialNames));
  requiredMaterials.forEach((name) => { if (!combinedMaterials.has(name)) throw new Error(`Missing shared palette material: ${name}`); });

  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify({ audits, seamGap, errors }, null, 2)}\n`);
  console.log(JSON.stringify(Object.fromEntries(Object.entries(audits).map(([id, audit]) => [id, { facilities: audit.facilityCount, meshes: audit.meshCount, triangles: audit.triangleCount, animations: audit.animations, overlaps: audit.overlaps.length, boundaryViolations: audit.boundaryViolations.length }])), null, 2));

  await page.evaluate(() => {
    document.querySelector('.label-layer')?.setAttribute('style', 'display:none');
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => element.setAttribute('style', 'display:none'));
  });

  const prepareView = async (ids, time = 'noon', plan = false) => {
    await page.evaluate(({ ids, time, plan }) => {
      const world = window.labIsland;
      const min = world.camera.position.clone().set(Infinity, Infinity, Infinity);
      const max = world.camera.position.clone().set(-Infinity, -Infinity, -Infinity);
      ids.forEach((id) => {
        const district = world.objectGroups.get(id); district.updateMatrixWorld(true); world.worldStreaming.ensurePackageResident(district);
        district.traverse((object) => {
          if (!object.isMesh || !object.geometry || object.userData.streamingProxy) return;
          object.geometry.computeBoundingBox(); const bounds = object.geometry.boundingBox; if (!bounds) return;
          for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) { const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld); min.min(point); max.max(point); }
        });
      });
      const center = min.clone().add(max).multiplyScalar(0.5); const size = max.clone().sub(min);
      world.setMode('explore'); world.select(ids[ids.length - 1], 'scene'); world.selectionBox.visible = false; world.setTimeOfDay(time); world.setWeather('clear'); world.cameraTween = null; world.labelRoot.visible = false;
      if (plan) { const extent = Math.max(size.z, size.x / world.camera.aspect); const altitude = extent * 0.62 / Math.tan(world.camera.fov * Math.PI / 360); world.camera.up.set(0, 0, -1); world.camera.position.set(center.x, Math.max(altitude, 88), center.z + 0.001); world.controls.target.set(center.x, 0, center.z); }
      else { world.camera.up.set(0, 1, 0); world.camera.position.set(center.x - size.x * 0.62, center.y + Math.max(size.x, size.z) * 0.36, center.z + size.z * 0.64); world.controls.target.copy(center).setY(1.6); }
      world.controls.update(); world.advanceTime(1_000); world.selectionBox.visible = false;
    }, { ids, time, plan });
    await page.waitForTimeout(350);
    await page.evaluate(() => { const world = window.labIsland; world.selectionBox.visible = false; world.renderer.setAnimationLoop(null); world.renderer.render(world.scene, world.camera); });
  };

  await prepareView(['scientist-residential'], 'noon'); await page.screenshot({ path: `${OUTPUT}/residential-overview.png` });
  await prepareView(['scientist-residential'], 'noon', true); await page.screenshot({ path: `${OUTPUT}/residential-plan.png` });
  await prepareView(['scientist-residential'], 'night'); await page.screenshot({ path: `${OUTPUT}/residential-night.png` });
  await prepareView(['even-hour-hotel'], 'noon'); await page.screenshot({ path: `${OUTPUT}/ever-hour-overview.png` });
  await prepareView(['even-hour-hotel'], 'noon', true); await page.screenshot({ path: `${OUTPUT}/ever-hour-plan.png` });
  await prepareView(['even-hour-hotel'], 'night'); await page.screenshot({ path: `${OUTPUT}/ever-hour-night.png` });
  await prepareView(['scientist-residential', 'even-hour-hotel'], 'noon', true); await page.screenshot({ path: `${OUTPUT}/integrated-live-work-plan.png` });

  const representativeCodes = { 'scientist-residential': ['R01', 'R05', 'R12', 'R14', 'R20', 'R21', 'R22', 'R23', 'R24', 'R25', 'R26', 'R27', 'R28', 'R29', 'R30', 'R31', 'R32', 'R33', 'R34', 'R35', 'R36'], 'even-hour-hotel': ['H01', 'H08', 'H09', 'H12', 'H14', 'H19', 'H22', 'H23'] };
  for (const [districtId, codes] of Object.entries(representativeCodes)) for (const code of codes) {
    await page.evaluate(({ districtId, code }) => {
      const world = window.labIsland; const district = world.objectGroups.get(districtId); let facility = null;
      district.traverse((object) => { if (object.userData.exteriorProgram === true && object.userData.buildingCode === code) facility = object; });
      facility.updateMatrixWorld(true); world.setMode('explore'); world.select(districtId, 'scene'); world.setTimeOfDay(['R05', 'H01', 'H19', 'H22', 'H23'].includes(code) ? 'night' : 'noon'); world.setWeather(code === 'H14' ? 'rain' : 'clear'); world.cameraTween = null; world.camera.up.set(0, 1, 0);
      const center = facility.getWorldPosition(world.controls.target.clone()).setY(Math.max(0.8, Number(facility.userData.heightMetres ?? 15) / 22)); const distance = Math.max(9, Math.max(...facility.userData.footprintMetres) / 7.2);
      world.camera.position.set(center.x + distance, center.y + distance * 0.65, center.z + distance * 0.92); world.controls.target.copy(center); world.controls.update(); world.worldStreaming.ensurePackageResident(district); world.advanceTime(700); world.selectionBox.visible = false;
    }, { districtId, code });
    await page.waitForTimeout(250);
    await page.evaluate(() => { const world = window.labIsland; world.selectionBox.visible = false; world.renderer.setAnimationLoop(null); world.renderer.render(world.scene, world.camera); });
    await page.screenshot({ path: `${OUTPUT}/${code.toLowerCase()}-facility.png` });
  }

  const walkAudits = {};
  for (const [districtId, audit] of Object.entries(audits)) {
    walkAudits[districtId] = await page.evaluate(({ districtId, roadPoint }) => {
      const world = window.labIsland; const district = world.objectGroups.get(districtId); world.setMode('walk'); world.setTimeOfDay('night'); world.setWeather('rain'); world.worldStreaming.ensurePackageResident(district); world.walkController.refreshNavigation(); const ground = world.walkController.sampleGround(roadPoint[0], roadPoint[2]); world.camera.position.set(roadPoint[0], ground + 0.162, roadPoint[2]); world.walkController.groundY = ground; world.walkController.grounded = true;
      const center = world.definitions.get(districtId).sector.centerAngle; world.camera.lookAt(roadPoint[0] - Math.cos(center) * 5, ground + 0.16, roadPoint[2] - Math.sin(center) * 5); const start = world.camera.position.clone(); world.setWalkIntent(0, 1, true); world.advanceTime(900); world.setWalkIntent(0, 0); const end = world.camera.position.clone(); const state = world.walkController.getSnapshot(); return { ground, eyeClearance: start.y - ground, moved: start.distanceTo(end), grounded: state.grounded, position: state.positionWorld };
    }, { districtId, roadPoint: audit.routes.roadPoint });
    const walk = walkAudits[districtId];
    if (Math.abs(walk.eyeClearance - 0.162) > 0.002 || !walk.grounded || walk.moved < 0.12) throw new Error(`${districtId} Continuum WALK traversal failed: ${JSON.stringify(walk)}`);
    await page.screenshot({ path: `${OUTPUT}/${programs[districtId].prefix.toLowerCase()}-continuum-human-height.png` });
  }

  const flagshipWalk = await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('even-hour-hotel');
    let flagship = null;
    district.traverse((object) => { if (object.userData.exteriorProgram === true && object.userData.buildingCode === 'H23') flagship = object; });
    flagship.updateMatrixWorld(true);
    world.setMode('walk');
    world.setTimeOfDay('night');
    world.setWeather('clear');
    world.worldStreaming.ensurePackageResident(district);
    world.walkController.refreshNavigation();
    const startWorld = world.camera.position.clone().set(0, 0, 8.1).applyMatrix4(flagship.matrixWorld);
    const endWorld = world.camera.position.clone().set(0, 0, -8.1).applyMatrix4(flagship.matrixWorld);
    const heading = endWorld.clone().sub(startWorld).setY(0).normalize();
    world.walkController.enter(startWorld, heading, startWorld);
    const start = world.camera.position.clone();
    const startGround = world.walkController.sampleGround(start.x, start.z, { spawnSearch: true });
    world.setWalkSpeedKilometresPerHour(120);
    world.setWalkIntent(0, 1, false);
    world.advanceTime(5_500);
    world.setWalkIntent(0, 0, false);
    world.setWalkSpeedKilometresPerHour(6.5);
    const end = world.camera.position.clone();
    const progress = end.clone().sub(start).dot(heading);
    const lateral = end.clone().sub(start).addScaledVector(heading, -progress).setY(0).length();
    const endLocal = end.clone().applyMatrix4(flagship.matrixWorld.clone().invert());
    const state = world.walkController.getSnapshot();
    return { start: start.toArray(), end: end.toArray(), startGround, progress, lateral, endLocal: endLocal.toArray(), grounded: state.grounded };
  });
  if (flagshipWalk.startGround === null || !flagshipWalk.grounded || flagshipWalk.progress < 14.5 || flagshipWalk.lateral > 0.35 || flagshipWalk.endLocal[2] > -6.2) throw new Error(`The Ever Hour Continuum passage is not WALK-clear: ${JSON.stringify(flagshipWalk)}`);
  await page.evaluate(() => {
    const world = window.labIsland;
    const district = world.objectGroups.get('even-hour-hotel');
    let flagship = null;
    district.traverse((object) => { if (object.userData.exteriorProgram === true && object.userData.buildingCode === 'H23') flagship = object; });
    flagship.updateMatrixWorld(true);
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    const cameraPoint = world.camera.position.clone().set(0, 0.162, 0.9).applyMatrix4(flagship.matrixWorld);
    const target = world.camera.position.clone().set(0, 0.9, -5.5).applyMatrix4(flagship.matrixWorld);
    const ground = world.walkController.sampleGround(cameraPoint.x, cameraPoint.z, { spawnSearch: true });
    world.camera.position.set(cameraPoint.x, ground + 0.162, cameraPoint.z);
    world.camera.lookAt(target.x, ground + 0.75, target.z);
    world.renderer.setAnimationLoop(null);
    world.renderer.render(world.scene, world.camera);
  });
  await page.screenshot({ path: `${OUTPUT}/h23-continuum-passage-walk.png` });

  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ audits, seamGap, walkAudits, flagshipWalk, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ seamGap, walkAudits, flagshipWalk, errors }, null, 2));
} finally {
  await browser.close();
}
