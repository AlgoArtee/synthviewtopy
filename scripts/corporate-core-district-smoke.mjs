import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.CORPORATE_CORE_OUTPUT ?? 'output/corporate-core-district';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const districtId = 'corporate-core';
const requiredRoots = [
  'CORPORATE__C01__THE_NULL_EXCHANGE', 'CORPORATE__C02__THE_OBSIDIAN_RESERVE',
  'CORPORATE__C03__THE_BLACK_LEDGER_AUTHORITY', 'CORPORATE__C04__THE_QUANTUM_CLEARING_HOUSE',
  'CORPORATE__C05__THE_BLACK_INDEX_BUREAU', 'CORPORATE__C06__THE_VANTA_VENTURE_SPIRE',
  'CORPORATE__C07__COVENANT_CAPITAL_HOUSE', 'CORPORATE__C08__THE_PATRONAGE_ENGINE',
  'CORPORATE__C09__THE_LEGACY_ENDOWMENT', 'CORPORATE__C10__THE_SILENT_PATENT_AUCTION',
  'CORPORATE__C11__UMBRA_UNDERWRITING_HALL', 'CORPORATE__C12__CATASTROPHE_BOND_TOWER',
  'CORPORATE__C13__THE_ARBITRATION_BASILICA', 'CORPORATE__C14__EVENT_HORIZON_CONVENTION_CENTRE',
  'CORPORATE__C15__MOURNINGSTAR_PLENARY_HALL', 'CORPORATE__C16__ECLIPSE_EXPO_GALLERIES',
  'CORPORATE__C17__THE_FUNDING_CRUCIBLE', 'CORPORATE__C18__THE_LAST_PROSPECTUS_MEDIA_HOUSE',
  'CORPORATE__C19__NOCTURNE_DELEGATION_TOWER', 'CORPORATE__C20__THE_CROWN_OF_CONSENSUS',
];

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1800, height: 1100 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
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
  await page.evaluate((id) => window.labIsland.select(id, 'scene'), districtId);
  await page.waitForFunction((id) => window.labIsland.worldStreaming.getSnapshot().packages.some((entry) => entry.id === id && entry.loadState === 'loaded' && entry.detailResident), districtId);

  const atlasAtmosphereControlCount = await page.locator('#atlas-panel #env-time, #atlas-panel #env-weather, #atlas-panel #env-season').count();
  if (atlasAtmosphereControlCount !== 0) throw new Error('Time/weather/season controls still reside inside the Masterplan directory');
  await page.locator('#atmosphere-toggle').click();
  await page.locator('#atmosphere-menu').waitFor({ state: 'visible' });
  await page.locator('#env-time').selectOption('night');
  await page.locator('#env-weather').selectOption('fog');
  await page.locator('#env-season').selectOption('winter');
  await page.locator('#corporate-plaza-light-strength').fill('165');
  const atmosphereUiAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const corporate = world.scene.getObjectByName('DISTRICT__corporate-core');
    const spotlights = [];
    corporate?.traverse((object) => {
      if (object.isSpotLight === true && object.userData.corporatePlazaStadiumLight === true) {
        spotlights.push({ intensity: object.intensity, base: object.userData.corporatePlazaStadiumLightBaseIntensity });
      }
    });
    return {
      timeOfDay: world.getTimeOfDay(),
      weather: world.getWeather(),
      season: world.getSeason(),
      strength: world.getCorporateCorePlazaLightStrength(),
      snapshotStrength: world.takeSnapshotPayload().editor.corporateCorePlazaLightStrength,
      output: document.querySelector('#corporate-plaza-light-strength-output')?.textContent,
      menuVisible: !document.querySelector('#atmosphere-menu')?.hidden,
      textAtmosphere: JSON.parse(window.render_game_to_text()).atmosphere,
      spotlights,
    };
  });
  if (atmosphereUiAudit.timeOfDay !== 'night'
    || atmosphereUiAudit.weather !== 'fog'
    || atmosphereUiAudit.season !== 'winter'
    || Math.abs(atmosphereUiAudit.strength - 1.65) > 0.0001
    || Math.abs(atmosphereUiAudit.snapshotStrength - 1.65) > 0.0001
    || atmosphereUiAudit.output !== '165%'
    || !atmosphereUiAudit.menuVisible
    || Math.abs(Number(atmosphereUiAudit.textAtmosphere?.corporateCorePlazaLightStrength) - 1.65) > 0.0001
    || atmosphereUiAudit.spotlights.length !== 20
    || atmosphereUiAudit.spotlights.some((entry) => Math.abs(entry.intensity - entry.base * 1.65) > 0.001)) {
    throw new Error(`Atmosphere menu interaction failed: ${JSON.stringify(atmosphereUiAudit)}`);
  }
  await page.locator('#env-season').selectOption('summer');
  await page.locator('#env-weather').selectOption('clear');
  await page.evaluate(() => {
    const world = window.labIsland;
    world.select('corporate-core', 'scene');
    world.cameraTween = null;
    world.camera.up.set(0, 1, 0);
    world.camera.position.set(105, 70, 116);
    world.controls.target.set(0, 5.5, 0);
    world.controls.update();
    world.advanceTime(900);
  });
  await page.waitForTimeout(300);
  await page.locator('.toast-region').evaluate((element) => {
    element.style.display = 'none';
  });
  await page.screenshot({ path: `${OUTPUT}/atmosphere-menu.png` });
  await page.locator('#corporate-plaza-light-strength').fill('100');
  await page.locator('#env-time').selectOption('noon');
  await page.locator('#atmosphere-menu-close').click();
  if (await page.locator('#atmosphere-menu').isVisible()) throw new Error('Atmosphere menu did not close');

  const audit = await page.evaluate(({ districtId, requiredRoots }) => {
    const world = window.labIsland;
    const district = world.scene.getObjectByName(`DISTRICT__${districtId}`);
    const central = world.scene.getObjectByName('DISTRICT__dark-center-lab-megabuilding');
    const synthetic = world.scene.getObjectByName('DISTRICT__synthetic-quantum-biosystems');
    if (!district || !central || !synthetic) throw new Error('Corporate Core or central program roots are unavailable');
    world.setMode('explore');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.setLayer('labels', false);
    const restoreCorporate = world.worldStreaming.mountPackageAuthoritySources(districtId);
    const restoreCentral = world.worldStreaming.mountPackageAuthoritySources('dark-center-lab-megabuilding');
    const restoreSynthetic = world.worldStreaming.mountPackageAuthoritySources('synthetic-quantum-biosystems');
    const restoreGlobalEnvironment = world.globalEnvironmentBatching?.mountSources();
    district.updateMatrixWorld(true);
    central.updateMatrixWorld(true);
    const facilities = [];
    const names = [];
    const materials = new Set();
    const animations = new Map();
    const corporateNightLightingNames = [];
    const corporateNightLightingBlocking = [];
    const corporateNightLightingShadowCasters = [];
    let corporateNightLightingPointLights = 0;
    let corporateNightLightingSpotLights = 0;
    let corporatePlazaStadiumLightRigs = 0;
    let corporatePlazaStadiumLightTargets = 0;
    let corporateNightLightingEmissiveMeshes = 0;
    let corporateNightLightingMaximumEmissiveIntensity = 0;
    let meshes = 0;
    let triangles = 0;
    district.traverse((object) => {
      if (object.name) names.push(object.name);
      if (object.userData.exteriorProgram === true) facilities.push(object);
      if (object.userData.corporatePlazaStadiumLightRig === true) corporatePlazaStadiumLightRigs += 1;
      if (object.name.endsWith('__PLAZA_STADIUM_LIGHT_TARGET')) corporatePlazaStadiumLightTargets += 1;
      if (object.userData.corporateNightLight === true) {
        corporateNightLightingNames.push(object.name);
        if (object.userData.navObstacle !== false) corporateNightLightingBlocking.push(object.name);
        if (object.castShadow === true) corporateNightLightingShadowCasters.push(object.name);
        if (object.isPointLight === true) corporateNightLightingPointLights += 1;
        if (object.isSpotLight === true && object.userData.corporatePlazaStadiumLight === true) corporateNightLightingSpotLights += 1;
      }
      const animation = object.userData.animate ?? object.userData.gpuAnimationProfile;
      if (animation) animations.set(animation, (animations.get(animation) ?? 0) + 1);
      if (!object.isMesh || !object.geometry) return;
      meshes += 1;
      const index = object.geometry.index;
      const position = object.geometry.attributes.position;
      triangles += index ? index.count / 3 : position ? position.count / 3 : 0;
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((entry) => {
        materials.add(entry.name);
        if (object.userData.corporateNightLight === true
          && Number(entry.emissiveIntensity ?? 0) > 0
          && Number(entry.emissive?.getHex?.() ?? 0) !== 0) {
          corporateNightLightingEmissiveMeshes += 1;
          corporateNightLightingMaximumEmissiveIntensity = Math.max(corporateNightLightingMaximumEmissiveIntensity, Number(entry.emissiveIntensity));
        }
      });
    });
    const records = facilities.map((facility) => {
      facility.updateMatrixWorld(true);
      const center = facility.getWorldPosition(world.camera.position.clone());
      return {
        code: facility.userData.buildingCode,
        name: facility.userData.buildingName,
        center: center.toArray(),
        radius: Math.hypot(center.x, center.z),
        angle: Math.atan2(center.z, center.x),
        footprintMetres: facility.userData.footprintMetres,
        heightMetres: facility.userData.heightMetres,
        ringAnchor: facility.userData.ringAnchor,
      };
    });
    const ordered = [...records].sort((left, right) => left.ringAnchor.clockwiseIndex - right.ringAnchor.clockwiseIndex);
    const tangentialGaps = ordered.map((record, index) => {
      const next = ordered[(index + 1) % ordered.length];
      const distance = Math.hypot(record.center[0] - next.center[0], record.center[2] - next.center[2]);
      const halfWidths = record.footprintMetres[0] / 20 + next.footprintMetres[0] / 20;
      return { pair: `${record.code}/${next.code}`, gap: distance - halfWidths };
    });
    const centralNames = [];
    let centralMeshes = 0;
    let centralLegacyFacilities = 0;
    let centralLegacyRoads = 0;
    central.traverse((object) => {
      if (object.name) centralNames.push(object.name);
      if (object.isMesh) centralMeshes += 1;
      if (object.name.includes('__FACILITY__')) centralLegacyFacilities += 1;
      if (object.userData.localCampusRoad === true || object.userData.generatedDistrictRoadNetwork === true) centralLegacyRoads += 1;
    });
    let syntheticMeshes = 0;
    let syntheticLegacyFacilities = 0;
    let syntheticLegacyRoads = 0;
    synthetic.traverse((object) => {
      if (object.isMesh) syntheticMeshes += 1;
      if (object.name.includes('__FACILITY__')) syntheticLegacyFacilities += 1;
      if (object.userData.localCampusRoad === true || object.userData.generatedDistrictRoadNetwork === true) syntheticLegacyRoads += 1;
    });
    const skybridgeSegments = [];
    let transparentGreyGlassMeshes = 0;
    district.traverse((object) => {
      if (object.userData.sealedSkybridgeSegment === true) skybridgeSegments.push(object.name);
      if (!object.isMesh) return;
      const entries = Array.isArray(object.material) ? object.material : [object.material];
      if (entries.some((entry) => entry?.name === 'Corporate transparent grey sealed skybridge glass'
        && entry.transparent === true && entry.opacity < 0.6)) transparentGreyGlassMeshes += 1;
    });
    let legacyPlazaPavilions = 0;
    const centralLightPlatforms = [];
    world.scene.traverse((object) => {
      if (object.name.startsWith('Corporate plaza laboratory pavilion')) legacyPlazaPavilions += 1;
      if (object.userData.centralLightPlatform === true) centralLightPlatforms.push(object);
    });
    const plazaSurfaceY = world.scene.getObjectByName('Corporate Core futuristic plaza')
      ?.getWorldPosition(world.camera.position.clone()).y ?? null;
    const verticalBounds = (root) => {
      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      root.updateMatrixWorld(true);
      root.traverse((object) => {
        if (!object.isMesh || !object.geometry) return;
        object.geometry.computeBoundingBox();
        const localBounds = object.geometry.boundingBox;
        if (!localBounds) return;
        for (const x of [localBounds.min.x, localBounds.max.x]) {
          for (const y of [localBounds.min.y, localBounds.max.y]) {
            for (const z of [localBounds.min.z, localBounds.max.z]) {
              const cornerY = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld).y;
              minY = Math.min(minY, cornerY);
              maxY = Math.max(maxY, cornerY);
            }
          }
        }
      });
      return { minY, maxY };
    };
    const centralLightPlatformAudit = centralLightPlatforms.map((platform) => {
      let base = null;
      let tableParts = 0;
      let chairGroups = 0;
      let chairParts = 0;
      let furnitureObstacles = 0;
      let structuralObstacles = 0;
      let subtleEmissiveElements = 0;
      let subtlePointLights = 0;
      let maximumPointLightIntensity = 0;
      let canopyPanels = 0;
      let canopySupports = 0;
      let emitterRails = 0;
      let lightCurrentRibbons = 0;
      let holographicDotFields = 0;
      let holographicDots = 0;
      let legacyOverheadElements = 0;
      platform.traverse((object) => {
        if (object.userData.centralLightPlatformGroundBase === true) base = object;
        if (object.userData.centralLightPlatformTable === true) tableParts += 1;
        if (object.userData.centralLightPlatformChair === true) chairGroups += 1;
        if (object.userData.centralLightPlatformChairPart === true) chairParts += 1;
        if ((object.userData.centralLightPlatformTable === true
          || object.userData.centralLightPlatformChairPart === true)
          && object.userData.navObstacle === true) furnitureObstacles += 1;
        if (object.userData.centralLightPlatformCanopySupport === true
          && object.userData.navObstacle === true) structuralObstacles += 1;
        if (object.userData.centralLightPlatformSubtleEmissive === true) subtleEmissiveElements += 1;
        if (object.userData.centralLightPlatformCanopyPanel === true) canopyPanels += 1;
        if (object.userData.centralLightPlatformCanopySupport === true) canopySupports += 1;
        if (object.userData.centralLightPlatformEmitterRail === true) emitterRails += 1;
        if (object.userData.centralLightPlatformLightCurrent === true) lightCurrentRibbons += 1;
        if (object.userData.centralLightPlatformHolographicDots === true) {
          holographicDotFields += 1;
          holographicDots += Number(object.userData.holographicDotCount ?? 0);
        }
        if (object.userData.centralLightPlatformSubtleLight === true) {
          subtlePointLights += 1;
          maximumPointLightIntensity = Math.max(maximumPointLightIntensity, object.intensity ?? 0);
        }
        if (/ canopy$| support \d+$| holographic light$/.test(object.name)) legacyOverheadElements += 1;
      });
      const bounds = verticalBounds(platform);
      const baseBounds = base ? verticalBounds(base) : null;
      return {
        name: platform.name,
        groundedSeatingPod: platform.userData.groundedPlazaSeatingPod === true,
        futuristicLightPavilion: platform.userData.futuristicLightPavilion === true,
        metadataRoundTables: platform.userData.roundTableCount,
        metadataChairs: platform.userData.chairCount,
        metadataPlatformRadiusMetres: platform.userData.platformRadiusMetres,
        metadataCanopyPanels: platform.userData.canopyPanelCount,
        metadataCanopySupports: platform.userData.canopySupportCount,
        metadataLightCurrentRibbons: platform.userData.lightCurrentRibbonCount,
        metadataHolographicDotFields: platform.userData.holographicDotFieldCount,
        metadataHolographicDots: platform.userData.holographicDotCount,
        tableParts,
        chairGroups,
        chairParts,
        furnitureObstacles,
        structuralObstacles,
        subtleEmissiveElements,
        subtlePointLights,
        maximumPointLightIntensity,
        canopyPanels,
        canopySupports,
        emitterRails,
        lightCurrentRibbons,
        holographicDotFields,
        holographicDots,
        legacyOverheadElements,
        baseWalkable: base?.userData.walkable === true,
        basePreventsUnderwalk: base?.userData.preventUnderwalk === true,
        groundedOffset: baseBounds && plazaSurfaceY !== null ? baseBounds.minY - plazaSurfaceY : null,
        heightAbovePlaza: plazaSurfaceY === null ? null : bounds.maxY - plazaSurfaceY,
      };
    });
    const transit = world.scene.getObjectByName('INFRASTRUCTURE__TRANSIT_NETWORK');
    const routes = [
      world.scene.getObjectByName('CORPORATE__COMPLIANCE_WALK'),
      world.scene.getObjectByName('CORPORATE__PROCESSION_LOOP'),
      ...Array.from({ length: 20 }, (_, index) => world.scene.getObjectByName(`CORPORATE__C${String(index + 1).padStart(2, '0')}__EXACT_INWARD_APPROACH`)),
    ];
    const walkPoint = world.camera.position.clone().set(42, 0.03, 0);
    world.walkController.refreshNavigation();
    const walkGround = world.walkController.sampleGround(walkPoint.x, walkPoint.z);
    const compact = JSON.parse(window.render_game_to_text());
    const deep = world.getTextSnapshot();
    const program = district.userData.corporateCoreDistrict;
    const auctionPolyhedron = district.getObjectByName('CORPORATE__C10__FACETED_AUCTION_POLYHEDRON');
    const auctionElementCount = auctionPolyhedron?.geometry.index?.count
      ?? auctionPolyhedron?.geometry.getAttribute('position')?.count
      ?? 0;
    const auctionDrawnElementCount = auctionPolyhedron?.geometry.groups.reduce((sum, group) => sum + group.count, 0) ?? 0;
    const signatureExpressions = {
      nullTickerLines: /^CORPORATE__C01__CYAN_DIGITAL_RAIN_\d+$/,
      reserveTerraces: /^CORPORATE__C02__BASALT_VAULT_TERRACE_\d+$/,
      ledgerLayers: /^CORPORATE__C03__COMPRESSED_LEDGER_PAGE_\d+$/,
      covenantPillars: /^CORPORATE__C07__INWARD_LEANING_PILLAR_\d+$/,
      covenantDeadEndPassages: /^CORPORATE__C07__SEALED_MEGABUILDING_PASSAGE$/,
      patronageRings: /^CORPORATE__C08__ROTATING_CAPITAL_RING_\d+$/,
      patentPlinths: /^CORPORATE__C10__SEALED_LOT_PLINTH_\d+$/,
      arbitrationPillars: /^CORPORATE__C13__COLOSSAL_SQUARE_PILLAR_\d+$/,
      mourningstarWings: /^CORPORATE__C15__TRIANGULAR_DISTRICT_WING_\d+$/,
      eclipsePavilions: /^CORPORATE__C16__.+_PAVILION_\d+$/,
      nocturneVolumes: /^CORPORATE__C19__OFFSET_DELEGATION_VOLUME_\d+$/,
      consensusSeats: /^CORPORATE__C20__INWARD_JUDICIAL_SEAT_\d+$/,
    };
    const signatureCounts = Object.fromEntries(Object.entries(signatureExpressions).map(([key, expression]) => [key, names.filter((name) => expression.test(name)).length]));
    const districtRoadNetwork = district.userData.districtRoadNetwork;
    const result = {
      facilityCount: facilities.length,
      codes: ordered.map((record) => record.code),
      records,
      meshes,
      triangles,
      uniqueNames: new Set(names).size,
      materials: [...materials].sort(),
      animations: Object.fromEntries(animations),
      missingRoots: requiredRoots.filter((name) => !world.scene.getObjectByName(name)),
      tangentialGaps,
      routes: routes.map((route) => ({ name: route?.name ?? null, resident: Boolean(route?.parent), walkable: route?.userData.walkable === true })),
      walkPoint: walkPoint.toArray(),
      walkGround,
      program,
      compact: compact.corporateCoreDistrict,
      deepProgram: deep.corporateCoreDistrict,
      specializedRevision: deep.masterplan?.specializedDistrictLayoutRevision,
      planning: deep.planning,
      population: district.userData.population,
      signatureCounts,
      districtRoadNetwork: {
        routeCount: districtRoadNetwork?.routeCount ?? -1,
        connectorCount: districtRoadNetwork?.connectorCount ?? -1,
        ringConnectorCount: districtRoadNetwork?.ringConnectorCount ?? -1,
        connectedRingIds: districtRoadNetwork?.connectedRingIds ?? [],
        exceptionReason: districtRoadNetwork?.exceptionReason ?? null,
        gradedConnectorNames: names.filter((name) => name.endsWith('__GRADED_CONNECTOR')),
      },
      nightLighting: {
        metadata: district.getObjectByName('CORPORATE__HIGH_OUTPUT_NIGHT_LIGHTING_NETWORK')?.userData.nightLighting,
        objectCount: corporateNightLightingNames.length,
        outerPromenadePylons: corporateNightLightingNames.filter((name) => /^CORPORATE__OUTER_PROMENADE_LIGHT_PYLON_\d+$/.test(name)).length,
        outerPromenadeNeonLanterns: corporateNightLightingNames.filter((name) => /^CORPORATE__OUTER_PROMENADE_NEON_LANTERN_\d+$/.test(name)).length,
        innerComplianceNeonShards: corporateNightLightingNames.filter((name) => /^CORPORATE__INNER_COMPLIANCE_NEON_SHARD_\d+$/.test(name)).length,
        buildingFacadeBlades: corporateNightLightingNames.filter((name) => /^CORPORATE__C\d{2}__HIGH_OUTPUT_FACADE_BLADE_/.test(name)).length,
        buildingFacadeThresholds: corporateNightLightingNames.filter((name) => /^CORPORATE__C\d{2}__HIGH_OUTPUT_FACADE_THRESHOLD_/.test(name)).length,
        rooftopAuthorityBeacons: corporateNightLightingNames.filter((name) => /^CORPORATE__C\d{2}__ROOF_AUTHORITY_BEACON$/.test(name)).length,
        rooftopNeonHalos: corporateNightLightingNames.filter((name) => /^CORPORATE__C\d{2}__ROOF_NEON_HALO$/.test(name)).length,
        plazaStadiumLightRigs: corporatePlazaStadiumLightRigs,
        plazaStadiumLightMasts: corporateNightLightingNames.filter((name) => /^CORPORATE__C\d{2}__PLAZA_STADIUM_LIGHT_MAST$/.test(name)).length,
        plazaStadiumLightCrossbars: corporateNightLightingNames.filter((name) => /^CORPORATE__C\d{2}__PLAZA_STADIUM_LIGHT_CROSSBAR$/.test(name)).length,
        plazaStadiumLightHousings: corporateNightLightingNames.filter((name) => /^CORPORATE__C\d{2}__PLAZA_STADIUM_LIGHT_HOUSING_\d+$/.test(name)).length,
        plazaStadiumLightLenses: corporateNightLightingNames.filter((name) => /^CORPORATE__C\d{2}__PLAZA_STADIUM_LIGHT_LENS_\d+$/.test(name)).length,
        plazaStadiumLightTargets: corporatePlazaStadiumLightTargets,
        pointLights: corporateNightLightingPointLights,
        spotLights: corporateNightLightingSpotLights,
        emissiveMeshes: corporateNightLightingEmissiveMeshes,
        maximumEmissiveIntensity: corporateNightLightingMaximumEmissiveIntensity,
        blocking: corporateNightLightingBlocking,
        shadowCasters: corporateNightLightingShadowCasters,
      },
      patentAuctionPolyhedron: {
        present: Boolean(auctionPolyhedron),
        visible: auctionPolyhedron?.visible === true,
        primaryMass: auctionPolyhedron?.userData.primaryAuctionMass === true,
        materialCount: Array.isArray(auctionPolyhedron?.material) ? auctionPolyhedron.material.length : 0,
        groupCount: auctionPolyhedron?.geometry.groups.length ?? 0,
        elementCount: auctionElementCount,
        drawnElementCount: auctionDrawnElementCount,
      },
      central: {
        name: central.name,
        meshCount: centralMeshes,
        corporateDescendants: centralNames.filter((name) => name.startsWith('CORPORATE__')),
        canonicalSpinePresent: centralNames.includes('dark-center-lab-megabuilding__ENERGY_SPINE'),
      },
      retiredLegacyCore: {
        centralLegacyFacilities,
        centralLegacyRoads,
        syntheticMeshes,
        syntheticLegacyFacilities,
        syntheticLegacyRoads,
        syntheticRetired: synthetic.userData.retiredCorePlaceholder === true,
        syntheticRoadRouteCount: synthetic.userData.districtRoadNetwork?.routes?.length ?? -1,
        centralRoadRouteCount: central.userData.districtRoadNetwork?.routes?.length ?? -1,
        legacyPlazaPavilions,
        centralLightPlatforms: centralLightPlatforms.length,
        centralLightPlatformAudit,
        centralRoadGapRadius: transit?.userData.masterplan?.centralRoadGapRadius ?? null,
        centralBlackRingRoadsRemoved: transit?.userData.masterplan?.centralBlackRingRoadsRemoved === true,
      },
      skybridges: {
        segmentCount: skybridgeSegments.length,
        buildingBridgeCount: skybridgeSegments.filter((name) => /CORPORATE__C\d{2}__/.test(name)).length,
        centralDockCount: skybridgeSegments.filter((name) => name.includes('CENTRAL_MEGABUILDING')).length,
        transparentGreyGlassMeshes,
        transferRingPresent: Boolean(district.getObjectByName('CORPORATE__CENTRAL_SEALED_SKYBRIDGE_TRANSFER_RING')),
        metadata: district.userData.corporateCoreDistrict?.skybridges,
      },
    };
    restoreGlobalEnvironment?.();
    restoreSynthetic?.();
    restoreCentral?.();
    restoreCorporate?.();
    return result;
  }, { districtId, requiredRoots });

  await writeFile(`${OUTPUT}/preflight-audit.json`, `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({ facilityCount: audit.facilityCount, meshes: audit.meshes, triangles: audit.triangles, signatureCounts: audit.signatureCounts, minimumTangentialGap: Math.min(...audit.tangentialGaps.map((entry) => entry.gap)), central: audit.central }, null, 2));
  const expectedCodes = Array.from({ length: 20 }, (_, index) => `C${String(index + 1).padStart(2, '0')}`).join(',');
  if (audit.facilityCount !== 20 || audit.codes.join(',') !== expectedCodes) throw new Error(`Corporate facilities incomplete: ${audit.codes.join(', ')}`);
  if (audit.missingRoots.length) throw new Error(`Missing authored roots: ${audit.missingRoots.join(', ')}`);
  if (audit.meshes < 500 || audit.uniqueNames < audit.meshes * 0.94 || audit.triangles > 420_000) throw new Error(`Detail budget failed: ${JSON.stringify({ meshes: audit.meshes, uniqueNames: audit.uniqueNames, triangles: audit.triangles })}`);
  if (Math.min(...audit.tangentialGaps.map((entry) => entry.gap)) < 0.9) throw new Error(`Building envelopes are too close: ${JSON.stringify(audit.tangentialGaps)}`);
  if (audit.routes.length !== 22 || audit.routes.some((route) => !route.resident || !route.walkable) || audit.walkGround === null) throw new Error(`Corporate circulation incomplete: ${JSON.stringify({ routes: audit.routes, ground: audit.walkGround })}`);
  if (audit.program?.buildingCount !== 20 || audit.compact?.buildingCount !== 20 || audit.deepProgram?.buildingCount !== 20 || audit.specializedRevision !== 32 || audit.planning?.cellViolations !== 0) throw new Error('Corporate integration metadata incomplete');
  if (audit.program.centralBuildingPreserved !== true || audit.population?.fullClockwiseRing !== true || audit.population?.centralBuildingPreserved !== true) throw new Error('Black Ring or central-preservation metadata incomplete');
  if (audit.districtRoadNetwork.connectorCount !== 0
    || audit.districtRoadNetwork.ringConnectorCount !== 0
    || audit.districtRoadNetwork.connectedRingIds.length !== 0
    || audit.districtRoadNetwork.gradedConnectorNames.length !== 0
    || !audit.districtRoadNetwork.exceptionReason?.includes('no road connector')) {
    throw new Error(`Corporate central-plaza road connector was not fully retired: ${JSON.stringify(audit.districtRoadNetwork)}`);
  }
  if (audit.nightLighting.objectCount !== 576
    || audit.nightLighting.outerPromenadePylons !== 80
    || audit.nightLighting.outerPromenadeNeonLanterns !== 80
    || audit.nightLighting.innerComplianceNeonShards !== 60
    || audit.nightLighting.buildingFacadeBlades !== 40
    || audit.nightLighting.buildingFacadeThresholds !== 60
    || audit.nightLighting.rooftopAuthorityBeacons !== 20
    || audit.nightLighting.rooftopNeonHalos !== 20
    || audit.nightLighting.plazaStadiumLightRigs !== 20
    || audit.nightLighting.plazaStadiumLightMasts !== 20
    || audit.nightLighting.plazaStadiumLightCrossbars !== 20
    || audit.nightLighting.plazaStadiumLightHousings !== 60
    || audit.nightLighting.plazaStadiumLightLenses !== 60
    || audit.nightLighting.plazaStadiumLightTargets !== 20
    || audit.nightLighting.pointLights !== 16
    || audit.nightLighting.spotLights !== 20
    || audit.nightLighting.emissiveMeshes !== 340
    || audit.nightLighting.maximumEmissiveIntensity < 9
    || audit.nightLighting.blocking.length
    || audit.nightLighting.shadowCasters.length
    || audit.nightLighting.metadata?.nonBlocking !== true
    || audit.nightLighting.metadata?.emissiveElements !== 340
    || audit.nightLighting.metadata?.plazaStadiumLightRigs !== 20
    || audit.nightLighting.metadata?.plazaStadiumSpotlights !== 20
    || audit.nightLighting.metadata?.plazaStadiumLampLenses !== 60
    || audit.nightLighting.metadata?.plazaStadiumLightBaseIntensity !== 1100
    || audit.nightLighting.metadata?.plazaStadiumLightStrength !== 1) {
    throw new Error(`Corporate high-output night lighting is incomplete: ${JSON.stringify(audit.nightLighting)}`);
  }
  if (!audit.patentAuctionPolyhedron.present
    || !audit.patentAuctionPolyhedron.visible
    || !audit.patentAuctionPolyhedron.primaryMass
    || audit.patentAuctionPolyhedron.materialCount !== 3
    || audit.patentAuctionPolyhedron.groupCount !== 20
    || audit.patentAuctionPolyhedron.drawnElementCount !== audit.patentAuctionPolyhedron.elementCount) {
    throw new Error(`Silent Patent Auction primary mass is incomplete: ${JSON.stringify(audit.patentAuctionPolyhedron)}`);
  }
  if (audit.central.name !== 'DISTRICT__dark-center-lab-megabuilding' || audit.central.meshCount < 10 || audit.central.corporateDescendants.length) throw new Error(`Central Megabuilding preservation failed: ${JSON.stringify(audit.central)}`);
  if (audit.retiredLegacyCore.centralLegacyFacilities !== 0
    || audit.retiredLegacyCore.centralLegacyRoads !== 0
    || audit.retiredLegacyCore.syntheticMeshes !== 0
    || audit.retiredLegacyCore.syntheticLegacyFacilities !== 0
    || audit.retiredLegacyCore.syntheticLegacyRoads !== 0
    || audit.retiredLegacyCore.syntheticRoadRouteCount !== 0
    || audit.retiredLegacyCore.centralRoadRouteCount !== 0
    || audit.retiredLegacyCore.legacyPlazaPavilions !== 0
    || audit.retiredLegacyCore.syntheticRetired !== true
    || audit.retiredLegacyCore.centralRoadGapRadius < 74
    || audit.retiredLegacyCore.centralBlackRingRoadsRemoved !== true) {
    throw new Error(`Legacy core placeholders or roads remain: ${JSON.stringify(audit.retiredLegacyCore)}`);
  }
  if (audit.retiredLegacyCore.centralLightPlatforms !== 6) {
    throw new Error(`The six original central light platforms were not restored: ${JSON.stringify(audit.retiredLegacyCore)}`);
  }
  if (audit.retiredLegacyCore.centralLightPlatformAudit.length !== 6
    || audit.retiredLegacyCore.centralLightPlatformAudit.some((platform) => !platform.groundedSeatingPod
      || !platform.futuristicLightPavilion
      || platform.metadataRoundTables !== 1
      || platform.metadataChairs !== 4
      || platform.metadataPlatformRadiusMetres !== 8.2
      || platform.metadataCanopyPanels !== 3
      || platform.metadataCanopySupports !== 3
      || platform.metadataLightCurrentRibbons !== 6
      || platform.metadataHolographicDotFields !== 1
      || platform.metadataHolographicDots !== 28
      || platform.tableParts !== 2
      || platform.chairGroups !== 4
      || platform.chairParts !== 12
      || platform.furnitureObstacles !== 14
      || platform.structuralObstacles !== 3
      || platform.subtleEmissiveElements !== 2
      || platform.subtlePointLights !== 0
      || platform.maximumPointLightIntensity !== 0
      || platform.canopyPanels !== 3
      || platform.canopySupports !== 3
      || platform.emitterRails !== 3
      || platform.lightCurrentRibbons !== 6
      || platform.holographicDotFields !== 1
      || platform.holographicDots !== 28
      || platform.legacyOverheadElements !== 0
      || !platform.baseWalkable
      || !platform.basePreventsUnderwalk
      || Math.abs(platform.groundedOffset ?? 1) > 0.003
      || (platform.heightAbovePlaza ?? 0) < 0.35
      || (platform.heightAbovePlaza ?? 1) > 0.39)) {
    throw new Error(`Corporate plaza light pavilions are not large, grounded, furnished, structurally safe, or subtly holographic: ${JSON.stringify(audit.retiredLegacyCore.centralLightPlatformAudit)}`);
  }
  if (audit.skybridges.segmentCount !== 0
    || audit.skybridges.buildingBridgeCount !== 0
    || audit.skybridges.centralDockCount !== 0
    || audit.skybridges.transparentGreyGlassMeshes !== 0
    || audit.skybridges.transferRingPresent
    || audit.skybridges.metadata != null) {
    throw new Error(`Corporate skybridge geometry or metadata remains: ${JSON.stringify(audit.skybridges)}`);
  }
  const expectedSignatures = { nullTickerLines: 22, reserveTerraces: 7, ledgerLayers: 40, covenantPillars: 12, covenantDeadEndPassages: 0, patronageRings: 6, patentPlinths: 12, arbitrationPillars: 24, mourningstarWings: 12, eclipsePavilions: 7, nocturneVolumes: 9, consensusSeats: 40 };
  for (const [key, count] of Object.entries(expectedSignatures)) if (audit.signatureCounts[key] !== count) throw new Error(`Expected ${count} ${key}, found ${audit.signatureCounts[key]}`);
  for (const name of ['Corporate matte light-absorbing basalt', 'Corporate polished obsidian composite', 'Corporate black ceramic', 'Corporate carbon fibre', 'Corporate blackened titanium', 'Corporate smoked black glass', 'Corporate cold cyan verified light', 'Corporate ultraviolet authority light', 'Corporate arterial red risk light']) if (!audit.materials.includes(name)) throw new Error(`Missing Corporate material: ${name}`);

  await page.evaluate(() => {
    const world = window.labIsland;
    window.__corporateCoreCentralRestore = world.worldStreaming.mountPackageAuthoritySources('dark-center-lab-megabuilding');
    world.clearSelection('system');
    world.selectionBox.material.visible = false;
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#scene-card, #inspector-panel, .layerbar, .compass, .interaction-hint, .walk-hud, .label-layer, .toast-region').forEach((element) => element.setAttribute('style', 'display:none'));
  });
  const prepareView = async (time, plan, cameraPosition) => {
    await page.evaluate(({ time, plan, cameraPosition }) => {
      const world = window.labIsland;
      world.select('corporate-core', 'scene');
      world.setMode(plan ? 'plan' : 'explore');
      world.setTimeOfDay(time);
      world.setWeather('clear');
      world.cameraTween = null;
      world.selectionBox.visible = false;
      if (plan) {
        world.camera.up.set(0, 0, -1);
        world.camera.position.set(0, 168, 0.001);
      } else {
        world.camera.up.set(0, 1, 0);
        world.camera.position.fromArray(cameraPosition);
      }
      world.controls.target.set(0, plan ? 0 : 5.5, 0);
      world.controls.update();
      world.advanceTime(900);
      world.selectionBox.visible = false;
    }, { time, plan, cameraPosition });
    await page.waitForTimeout(350);
  };
  await prepareView('noon', false, [105, 70, 116]);
  await page.screenshot({ path: `${OUTPUT}/corporate-core-day.png` });
  await prepareView('noon', true, [0, 168, 0]);
  await page.screenshot({ path: `${OUTPUT}/corporate-core-plan.png` });
  await prepareView('night', false, [-110, 52, -128]);
  await page.screenshot({ path: `${OUTPUT}/corporate-core-night.png` });
  await page.evaluate(() => {
    const world = window.labIsland;
    world.select('corporate-core', 'scene');
    world.setMode('explore');
    world.setTimeOfDay('night');
    world.setWeather('clear');
    world.cameraTween = null;
    world.selectionBox.visible = false;
    world.camera.up.set(0, 1, 0);
    world.camera.position.set(8.5, 3.2, -36);
    world.controls.target.set(0, 4.35, -50.4);
    world.controls.update();
    world.advanceTime(900);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUTPUT}/corporate-plaza-stadium-light.png` });

  for (const record of audit.records) {
    await page.evaluate(({ record }) => {
      const world = window.labIsland;
      const center = world.camera.position.clone().fromArray(record.center);
      const outward = center.clone().setY(0).normalize();
      const tangent = world.camera.position.clone().set(-outward.z, 0, outward.x);
      const extent = Math.max(record.footprintMetres[0], record.footprintMetres[1]) / 10;
      const distance = extent * 1.25 + record.heightMetres / 18;
      world.select('corporate-core', 'scene');
      world.setMode('explore');
      world.setTimeOfDay(record.code === 'C02' || record.code === 'C05' || record.code === 'C10' || record.code === 'C11' || record.code === 'C13' ? 'noon' : 'night');
      world.cameraTween = null;
      world.selectionBox.visible = false;
      world.camera.up.set(0, 1, 0);
      world.camera.position.copy(center).addScaledVector(outward, -distance * 0.82).addScaledVector(tangent, distance * 0.34).setY(Math.max(7, record.heightMetres / 24));
      world.controls.target.copy(center).setY(Math.max(2.5, record.heightMetres / 28));
      world.controls.update();
      world.advanceTime(520);
    }, { record });
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${OUTPUT}/${record.code.toLowerCase()}-${record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png` });
  }

  const walkAudit = await page.evaluate(({ walkPoint }) => {
    const world = window.labIsland;
    const preferred = world.camera.position.clone().fromArray(walkPoint);
    const heading = world.camera.position.clone().set(0, 0, 1);
    world.setMode('walk');
    world.setTimeOfDay('night');
    world.walkController.refreshNavigation();
    world.walkController.enter(preferred, heading, preferred);
    const ground = world.walkController.sampleGround(world.camera.position.x, world.camera.position.z);
    const start = world.camera.position.clone();
    world.setWalkIntent(0, 1, true);
    world.advanceTime(700);
    world.setWalkIntent(0, 0);
    const end = world.camera.position.clone();
    const state = world.walkController.getSnapshot();
    return { ground, eyeClearance: ground === null ? null : start.y - ground, moved: start.distanceTo(end), grounded: state.grounded, position: state.positionWorld };
  }, { walkPoint: audit.walkPoint });
  if (Math.abs(walkAudit.eyeClearance - 0.162) > 0.002 || !walkAudit.grounded || walkAudit.moved < 0.1) throw new Error(`Compliance Walk traversal failed: ${JSON.stringify(walkAudit)}`);
  await page.screenshot({ path: `${OUTPUT}/compliance-walk-human-height.png` });

  const seatingPlatformWalkAudit = await page.evaluate(() => {
    const world = window.labIsland;
    const platform = world.scene.getObjectByName('Corporate plaza light platform 1');
    const plaza = world.scene.getObjectByName('Corporate Core futuristic plaza');
    if (!platform || !plaza) throw new Error('Corporate plaza seating platform or plaza surface is unavailable');
    const center = platform.getWorldPosition(world.camera.position.clone());
    const outward = center.clone().setY(0).normalize();
    const startPoint = center.clone().addScaledVector(outward, 0.92).setY(0.05);
    const heading = center.clone().sub(startPoint).setY(0).normalize();
    const clearDeckPoint = center.clone().addScaledVector(outward, 0.255);
    world.setMode('walk');
    world.setTimeOfDay('night');
    world.setWeather('clear');
    world.walkController.refreshNavigation();
    const plazaGround = world.walkController.sampleGround(startPoint.x, startPoint.z);
    const platformGround = world.walkController.sampleGround(clearDeckPoint.x, clearDeckPoint.z);
    world.walkController.enter(startPoint, heading, startPoint);
    const start = world.camera.position.clone();
    world.setWalkIntent(0, 1, true);
    world.advanceTime(10_000);
    world.setWalkIntent(0, 0);
    const end = world.camera.position.clone();
    const endGround = world.walkController.sampleGround(end.x, end.z);
    const state = world.walkController.getSnapshot();
    return {
      plazaGround,
      platformGround,
      platformRise: plazaGround === null || platformGround === null ? null : platformGround - plazaGround,
      startDistance: start.clone().setY(0).distanceTo(center.clone().setY(0)),
      endDistance: end.clone().setY(0).distanceTo(center.clone().setY(0)),
      moved: start.distanceTo(end),
      crossedCenter: end.clone().sub(center).setY(0).dot(start.clone().sub(center).setY(0)) < 0,
      eyeClearance: endGround === null ? null : end.y - endGround,
      grounded: state.grounded,
      underwalkSurfaces: state.collisionSpatialIndex.totalCandidates.underwalkSurfaces,
      obstacles: state.collisionSpatialIndex.totalCandidates.obstacles,
      position: state.positionWorld,
    };
  });
  if (seatingPlatformWalkAudit.plazaGround === null
    || seatingPlatformWalkAudit.platformGround === null
    || Math.abs(seatingPlatformWalkAudit.platformRise - 0.018) > 0.003
    || seatingPlatformWalkAudit.moved < 0.5
    || seatingPlatformWalkAudit.endDistance >= seatingPlatformWalkAudit.startDistance
    || seatingPlatformWalkAudit.endDistance < 0.085
    || seatingPlatformWalkAudit.crossedCenter
    || Math.abs(seatingPlatformWalkAudit.eyeClearance - 0.162) > 0.003
    || !seatingPlatformWalkAudit.grounded
    || seatingPlatformWalkAudit.underwalkSurfaces < 6
    || seatingPlatformWalkAudit.obstacles < 102) {
    throw new Error(`Grounded seating-platform WALK approach or furniture collision failed: ${JSON.stringify(seatingPlatformWalkAudit)}`);
  }
  await page.evaluate(() => {
    const world = window.labIsland;
    const platform = world.scene.getObjectByName('Corporate plaza light platform 1');
    if (!platform) return;
    const center = platform.getWorldPosition(world.camera.position.clone());
    const outward = center.clone().setY(0).normalize();
    const ground = world.walkController.sampleGround(
      center.x + outward.x * 0.95,
      center.z + outward.z * 0.95,
    ) ?? 1.616;
    world.camera.position.copy(center).addScaledVector(outward, 0.95).setY(ground + 0.162);
    world.camera.lookAt(center.x, ground + 0.18, center.z);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUTPUT}/central-light-platform-walk.png` });
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
  await writeFile(`${OUTPUT}/audit.json`, `${JSON.stringify({ audit, walkAudit, seatingPlatformWalkAudit, errors }, null, 2)}\n`);
  console.log(JSON.stringify({ facilities: audit.facilityCount, meshes: audit.meshes, triangles: audit.triangles, routes: audit.routes.length, walkAudit, seatingPlatformWalkAudit, errors }, null, 2));
} finally {
  await browser.close();
}
