import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5178';
const OUTPUT = process.env.ENTRY_LOGISTICS_OUTPUT ?? 'output/entry-logistics';
const chrome = process.env.PLAYWRIGHT_BROWSER_PATH
  ?? process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chrome,
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(180_000);
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.addInitScript(() => {
    localStorage.removeItem('youtopy_saved_project');
    localStorage.removeItem('youtopy_walk_speed_kmh');
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.labIsland?.getTextSnapshot));
  await page.waitForTimeout(1_500);
  await page.evaluate(() => window.advanceTime(120));

  const audit = await page.evaluate(async () => {
    const world = window.labIsland;
    let entry = world.scene.getObjectByName('DISTRICT__entry-commercial');
    let logistics = world.scene.getObjectByName('DISTRICT__logistics');
    if (!entry || !logistics) throw new Error('Entry or Logistics district is unavailable');
    entry.updateMatrixWorld(true);
    logistics.updateMatrixWorld(true);

    const auditDistrict = (district, expectedCount, minDegrees, maxDegrees) => {
      const program = district.userData.entryLogisticsProgram;
      const facilities = [];
      district.traverse((object) => {
        if (object.userData.exteriorProgram === true) facilities.push(object);
      });
      const boundaryViolations = [];
      for (const facility of facilities) {
        const corners = [];
        facility.traverse((object) => {
          if (!object.isMesh || !object.geometry) return;
          let ancestor = object.parent;
          while (ancestor && ancestor !== facility) {
            // Streamed interiors occupy isolated pocket space in WALK and are
            // not part of the exterior red-line footprint.
            if (ancestor.userData.runtimeInterior === true) return;
            ancestor = ancestor.parent;
          }
          object.geometry.computeBoundingBox();
          const box = object.geometry.boundingBox;
          if (!box) return;
          for (const x of [box.min.x, box.max.x]) {
            for (const y of [box.min.y, box.max.y]) {
              for (const z of [box.min.z, box.max.z]) {
                const point = world.camera.position.clone().set(x, y, z).applyMatrix4(object.matrixWorld);
                corners.push([point.x, point.z]);
              }
            }
          }
        });
        for (const [x, z] of corners) {
          const radius = Math.hypot(x, z);
          const degrees = ((Math.atan2(z, x) * 180 / Math.PI) + 360) % 360;
          const isAlignedBridgeThreshold = facility.userData.buildingCode === 'E1'
            && facility.userData.bridgeAligned === true
            && radius >= 380
            && radius <= 460
            && degrees >= 296
            && degrees <= 304;
          const isWelcomeForkMedian = facility.userData.buildingCode === 'E2'
            && facility.userData.forkMedian === true
            && radius >= 340
            && radius <= 380
            && degrees >= 296
            && degrees <= 304;
          if (!isAlignedBridgeThreshold
            && !isWelcomeForkMedian
            && (radius < 309 - 0.15 || radius > 416 + 0.15 || degrees < minDegrees - 0.2 || degrees > maxDegrees + 0.2)) {
            boundaryViolations.push({ code: facility.userData.buildingCode, radius, degrees });
          }
        }
      }
      return {
        expectedCount,
        program,
        codes: facilities.map((facility) => facility.userData.buildingCode).sort(),
        names: facilities.map((facility) => facility.userData.displayName).sort(),
        boundaryViolations,
      };
    };

    const entryAudit = auditDistrict(entry, 13, 300, 330);
    const logisticsAudit = auditDistrict(logistics, 7, 270, 300);
    const requiredObjects = [
      'ENTRY__WELCOME_OVAL_ARRIVAL_PLAZA',
      'ENTRY__WELCOME_REFLECTING_POOL',
      'LOGISTICS__NORTHFIELD_RUNWAY',
      'ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK',
      'ENTRY-COMMERCIAL__E1__TUNNEL_SIDEWALK_WEST',
      'ENTRY-COMMERCIAL__E1__TUNNEL_SIDEWALK_EAST',
    ];
    const missingObjects = requiredObjects.filter((name) => !world.scene.getObjectByName(name));
    const obsoleteObjects = [
      'ENTRY__PROTECTED_ALPINE_VIEW_CORRIDOR',
      'ENTRY__E1__ISLAND_SIDE_GLASS_SCREEN',
      'LOGISTICS__TRANSLUCENT_SECURITY_WALL_PANEL_1',
      'LOGISTICS__TRANSLUCENT_SECURITY_WALL_PANEL_9',
      'LOGISTICS__TRANSLUCENT_SECURITY_WALL_PANEL_10',
      'LOGISTICS__TRANSLUCENT_SECURITY_WALL_PANEL_11',
      'LOGISTICS__ACOUSTIC_BERM_1',
      'LOGISTICS__BERM_WINDSHAPED_TREE_1_W__TRUNK',
    ].filter((name) => world.scene.getObjectByName(name));
    const editableDefinitions = Array.from(world.definitions.values()).filter((definition) => definition.category === 'entry-logistics-building');
    const editableRegistration = editableDefinitions.map((definition) => {
      const facility = world.objectGroups.get(definition.id);
      let mistaggedDescendants = 0;
      facility?.traverse((object) => {
        if (object.userData.selectableId === definition.id) return;
        const nestedDefinition = world.definitions.get(object.userData.selectableId);
        // Authored interiors are now independently editable while remaining
        // nested beneath their exterior facility. Their stable component IDs
        // are intentional and must not be reported as exterior mistagging.
        if (nestedDefinition?.category === 'authored-interior') return;
        mistaggedDescendants += 1;
      });
      return {
        id: definition.id,
        code: definition.buildingCode,
        parentDistrictId: definition.parentDistrictId,
        registered: Boolean(facility),
        editable: facility?.userData.editable === true,
        mistaggedDescendants,
        scale3D: world.getObjectState(definition.id)?.scale3D,
        canEnterInterior: world.canEnterInterior(definition.id),
        walkAccessible: facility?.userData.walkAccess?.accessible === true,
        authoredInterior: facility?.userData.authoredInterior === true,
      };
    });
    const poolSelectableId = 'entry-logistics-landscape-welcome-pool';
    const editablePoolDefinition = world.definitions.get(poolSelectableId);
    const editablePoolFeature = world.objectGroups.get(poolSelectableId);
    let mistaggedPoolDescendants = 0;
    editablePoolFeature?.traverse((object) => {
      if (object.userData.selectableId !== poolSelectableId) mistaggedPoolDescendants += 1;
    });
    const editablePoolRegistration = {
      registered: Boolean(editablePoolDefinition && editablePoolFeature),
      category: editablePoolDefinition?.category,
      name: editablePoolDefinition?.name,
      parentDistrictId: editablePoolDefinition?.parentDistrictId,
      editable: editablePoolFeature?.userData.editable === true,
      selectableId: editablePoolFeature?.userData.selectableId,
      mistaggedDescendants: mistaggedPoolDescendants,
      canEnterInterior: world.canEnterInterior(poolSelectableId),
      scale3D: world.getObjectState(poolSelectableId)?.scale3D,
    };
    const roadAudit = (district) => {
      const network = district.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK');
      const roads = [];
      const continuousSurfaces = [];
      const roadMarkings = [];
      network?.traverse((object) => {
        if (object.userData.entranceLinkedRoad === true) roads.push(object);
        if (object.userData.roadMarking === true) {
          roadMarkings.push({
            name: object.name,
            routeId: object.userData.routeId,
            routeKind: object.userData.routeKind,
            pattern: object.userData.roadMarkingPattern,
            dashCount: object.userData.dashCount,
            dashLengthMetres: object.userData.dashLengthMetres,
            gapLengthMetres: object.userData.gapLengthMetres,
            markingElevation: object.userData.markingElevation,
            markingLiftMetres: object.userData.markingLiftMetres,
            occlusionSafeSurfaceDecal: object.userData.occlusionSafeSurfaceDecal === true,
            startClearanceMetres: object.userData.startClearanceMetres,
            endClearanceMetres: object.userData.endClearanceMetres,
            laneCount: object.userData.laneCount,
            dividerIndex: object.userData.dividerIndex,
            lateralOffset: object.userData.lateralOffset,
            color: object.material?.color?.getHexString?.() ?? null,
          });
        }
        if (object.userData.continuousRoadSurface === true) {
          continuousSurfaces.push({
            name: object.name,
            routeId: object.userData.routeId,
            routeKind: object.userData.routeKind,
            widthStart: object.userData.widthStart,
            widthEnd: object.userData.widthEnd,
            logisticsPlatform: object.userData.logisticsPlatform === true,
            districtTransition: object.userData.districtTransition === true,
            laneCount: object.userData.laneCount,
            color: object.material?.color?.getHexString?.() ?? null,
            terrainDepthBias: object.userData.terrainDepthBias === true,
            polygonOffset: object.material?.polygonOffset === true,
            polygonOffsetFactor: object.material?.polygonOffsetFactor,
            polygonOffsetUnits: object.material?.polygonOffsetUnits,
          });
        }
      });
      return {
        dynamic: network?.userData.dynamicRoadNetwork === true,
        entranceLinked: network?.userData.entranceLinked === true,
        doorToDoor: network?.userData.doorToDoor === true,
        uniformContinuousRibbons: network?.userData.uniformContinuousRibbons === true,
        continuousSurfaceCount: network?.userData.continuousSurfaceCount ?? 0,
        districtTransitionCount: network?.userData.districtTransitionCount ?? 0,
        logisticsPlatformCount: network?.userData.logisticsPlatformCount ?? 0,
        surfacePalette: network?.userData.surfacePalette ?? [],
        routeCount: network?.userData.routeCount ?? 0,
        primaryConnectorCount: network?.userData.primaryConnectorCount ?? 0,
        redundantRouteCount: network?.userData.redundantRouteCount ?? -1,
        segmentCount: roads.length,
        buildingThresholdCount: network?.userData.buildingThresholdCount ?? 0,
        entranceApronCount: network?.userData.entranceApronCount ?? 0,
        buildingPairs: roads.map((road) => `${road.userData.fromBuilding}-${road.userData.toBuilding}`),
        directBuildingLinks: roads.filter((road) => road.userData.fromBuilding
          && road.userData.toBuilding
          && road.userData.fromBuilding !== road.userData.toBuilding).map((road) => road.name),
        thresholdCodes: Array.from(new Set(roads.flatMap((road) => [
          road.userData.fromEndpointType === 'building-threshold' ? road.userData.fromBuilding : null,
          road.userData.toEndpointType === 'building-threshold' ? road.userData.toBuilding : null,
        ].filter(Boolean)))).sort(),
        roadMarkings,
        continuousSurfaces,
        roads: roads.map((road) => ({
          name: road.name,
          routeId: road.userData.routeId,
          fromPointId: road.userData.fromPointId,
          toPointId: road.userData.toPointId,
          fromEndpointType: road.userData.fromEndpointType,
          toEndpointType: road.userData.toEndpointType,
          fromBuilding: road.userData.fromBuilding,
          toBuilding: road.userData.toBuilding,
          fromPoint: road.userData.fromPoint,
          toPoint: road.userData.toPoint,
          segmentIndex: road.userData.segmentIndex,
          surfaceOffset: road.userData.surfaceOffset,
          underBuildingPodium: road.userData.underBuildingPodium,
        })),
      };
    };
    const entryRoadAudit = roadAudit(entry);
    const logisticsRoadAudit = roadAudit(logistics);
    const citylineSegments = entryRoadAudit.roads
      .filter((road) => road.routeId === 'e13-to-collector')
      .sort((left, right) => left.segmentIndex - right.segmentIndex);
    const citylineFacility = world.scene.getObjectByName('ENTRY__E13__CITYLINE_ORIENTATION_TOWER');
    const citylineDirections = citylineSegments.map((road) => {
      const dx = road.toPoint[0] - road.fromPoint[0];
      const dz = road.toPoint[2] - road.fromPoint[2];
      const length = Math.hypot(dx, dz);
      return [dx / length, dz / length];
    });
    const citylineTurns = citylineDirections.slice(1).map((direction, index) => {
      const previous = citylineDirections[index];
      const dot = Math.max(-1, Math.min(1, previous[0] * direction[0] + previous[1] * direction[1]));
      return Math.acos(dot) * 180 / Math.PI;
    });
    const liveDoorOutward = world.camera.position.clone()
      .fromArray(citylineFacility.userData.roadRouteStart)
      .sub(world.controls.target.clone().fromArray(citylineFacility.userData.roadDoorThreshold))
      .setY(0)
      .normalize();
    const citylineFirstDirection = world.camera.position.clone().set(
      citylineDirections[0][0],
      0,
      citylineDirections[0][1],
    );
    const citylineRoadAudit = {
      segmentCount: citylineSegments.length,
      firstEndpointType: citylineSegments[0]?.fromEndpointType,
      firstBuilding: citylineSegments[0]?.fromBuilding,
      routeStartGap: Math.hypot(
        citylineSegments[0].fromPoint[0] - citylineFacility.userData.roadRouteStart[0],
        citylineSegments[0].fromPoint[2] - citylineFacility.userData.roadRouteStart[2],
      ),
      doorwayTangentDot: citylineFirstDirection.dot(liveDoorOutward),
      maximumTurnDegrees: Math.max(...citylineTurns),
      continuousSurface: entryRoadAudit.continuousSurfaces
        .find((surface) => surface.routeId === 'e13-to-collector'),
    };
    const arrivalSegments = entryRoadAudit.roads
      .filter((road) => road.routeId === 'arrival')
      .sort((left, right) => left.segmentIndex - right.segmentIndex);
    const entryBranchSegments = entryRoadAudit.roads
      .filter((road) => road.routeId === 'arrival-entry-branch')
      .sort((left, right) => left.segmentIndex - right.segmentIndex);
    const logisticsBranchSegments = entryRoadAudit.roads
      .filter((road) => road.routeId === 'arrival-logistics-branch')
      .sort((left, right) => left.segmentIndex - right.segmentIndex);
    const e2RearSegments = entryRoadAudit.roads
      .filter((road) => road.routeId === 'e2-rear-boundary-link')
      .sort((left, right) => left.segmentIndex - right.segmentIndex);
    const e2FrontSegments = entryRoadAudit.roads
      .filter((road) => road.routeId === 'e2-door-apron')
      .sort((left, right) => left.segmentIndex - right.segmentIndex);
    const toWorldRoadPoint = (point) => entry.localToWorld(world.camera.position.clone().fromArray(point));
    const polarRoadPoint = (point) => {
      const worldPoint = toWorldRoadPoint(point);
      return {
        radius: Math.hypot(worldPoint.x, worldPoint.z),
        degrees: ((Math.atan2(worldPoint.z, worldPoint.x) * 180 / Math.PI) + 360) % 360,
      };
    };
    const branchConnectionGap = (segments) => {
      const branchStart = toWorldRoadPoint(segments[0].fromPoint);
      return Math.min(...arrivalSegments.flatMap((segment) => [segment.fromPoint, segment.toPoint])
        .map((point) => {
          const arrivalPoint = toWorldRoadPoint(point);
          return Math.hypot(arrivalPoint.x - branchStart.x, arrivalPoint.z - branchStart.z);
        }));
    };
    const maximumRoadTurnDegrees = (segments) => {
      const directions = segments.map((road) => {
        const dx = road.toPoint[0] - road.fromPoint[0];
        const dz = road.toPoint[2] - road.fromPoint[2];
        const length = Math.hypot(dx, dz);
        return [dx / length, dz / length];
      });
      return Math.max(0, ...directions.slice(1).map((direction, index) => Math.acos(Math.max(
        -1,
        Math.min(1, direction[0] * directions[index][0] + direction[1] * directions[index][1]),
      )) * 180 / Math.PI));
    };
    const arrivalDirections = arrivalSegments.map((road) => {
      const dx = road.toPoint[0] - road.fromPoint[0];
      const dz = road.toPoint[2] - road.fromPoint[2];
      const length = Math.hypot(dx, dz);
      return [dx / length, dz / length];
    });
    const arrivalTurns = arrivalDirections.slice(1).map((direction, index) => {
      const previous = arrivalDirections[index];
      const dot = Math.max(-1, Math.min(1, previous[0] * direction[0] + previous[1] * direction[1]));
      return Math.acos(dot) * 180 / Math.PI;
    });
    const tunnelSegments = entryRoadAudit.roads
      .filter((road) => road.routeId === 'e1-tunnel-through-road')
      .sort((left, right) => left.segmentIndex - right.segmentIndex);
    const tunnelExit = tunnelSegments.at(-1);
    const tunnelExitDx = tunnelExit.toPoint[0] - tunnelExit.fromPoint[0];
    const tunnelExitDz = tunnelExit.toPoint[2] - tunnelExit.fromPoint[2];
    const tunnelExitLength = Math.hypot(tunnelExitDx, tunnelExitDz);
    const tunnelExitDirection = [tunnelExitDx / tunnelExitLength, tunnelExitDz / tunnelExitLength];
    const tunnelArrivalDot = Math.max(-1, Math.min(
      1,
      tunnelExitDirection[0] * arrivalDirections[0][0] + tunnelExitDirection[1] * arrivalDirections[0][1],
    ));
    const innerCollectorSegments = entryRoadAudit.roads.filter((road) => road.routeId === 'inner-retail-collector');
    const innerCollectorRadii = innerCollectorSegments.flatMap((road) => [road.fromPoint, road.toPoint])
      .map((point) => {
        const worldPoint = entry.localToWorld(world.camera.position.clone().fromArray(point));
        return Math.hypot(worldPoint.x, worldPoint.z);
      });
    const entryNetwork = entry.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK');
    const e2ApronMeshes = [];
    entryNetwork?.traverse((object) => {
      if (object.userData.entranceLinkedRoad === true && object.userData.routeId === 'e2-door-apron') {
        e2ApronMeshes.push(object);
      }
    });
    const e2Base = world.scene.getObjectByName('ENTRY__E2__ELLIPTICAL_PALE_STONE_BASE');
    const e2Facility = world.scene.getObjectByName('ENTRY__E2__WELCOME_AND_REGISTRATION_HALL');
    const welcomePlazaForLevel = world.scene.getObjectByName('ENTRY__WELCOME_OVAL_ARRIVAL_PLAZA');
    const welcomeLandscape = world.scene.getObjectByName('ENTRY__WELCOME_LANDSCAPE');
    const welcomeLoop = world.scene.getObjectByName('ENTRY__WELCOME_VEHICLE_LOOP');
    const redundantWelcomeRoadMeshes = [
      welcomeLoop,
      ...Array.from({ length: 7 }, (_, index) => world.scene.getObjectByName(
        `ENTRY__RADIAL_PAVING_LINE_${index + 1}`,
      )),
      ...['FRONT', 'EAST', 'REAR', 'WEST'].map((direction) => world.scene.getObjectByName(
        `ENTRY__WELCOME_LOOP_ACCESS_${direction}`,
      )),
    ].filter(Boolean);
    const obsoleteWelcomeJunctionObjects = [
      'ENTRY-COMMERCIAL__WELCOME_THREE_WAY_SPLIT__CLEAN_JUNCTION_CAP',
      'ENTRY-COMMERCIAL__WELCOME_THREE_WAY_SPLIT__CENTRAL_ISLAND',
      'ENTRY-COMMERCIAL__WELCOME_THREE_WAY_SPLIT__OUTER_LANE_EDGE',
      'ENTRY-COMMERCIAL__WELCOME_THREE_WAY_SPLIT__TWO_LANE_DASHED_DIVIDER',
      'ENTRY-COMMERCIAL__WELCOME_THREE_WAY_SPLIT__CLOCKWISE_DIRECTION_ARROWS',
      ...Array.from({ length: 4 }, (_, index) => (
        `ENTRY-COMMERCIAL__WELCOME_THREE_WAY_SPLIT__APPROACH_YIELD_BAR_${index + 1}`
      )),
    ].filter((name) => world.scene.getObjectByName(name));
    const welcomeForkSurfaceElevations = [
      'arrival',
      'arrival-entry-branch',
      'arrival-logistics-branch',
      'e2-door-apron',
    ].map((routeId) => {
      const surface = entryNetwork?.getObjectByName(
        `ENTRY-COMMERCIAL__${routeId.toUpperCase()}__CONTINUOUS_SURFACE`,
      );
      return {
        routeId,
        surfaceOffset: surface?.userData.surfaceOffset,
        surfaceElevation: surface?.userData.surfaceElevation,
        widthStart: surface?.userData.widthStart,
        widthEnd: surface?.userData.widthEnd,
        laneCount: surface?.userData.laneCount,
      };
    });
    const worldTop = (object) => {
      object.geometry.computeBoundingBox();
      return object.localToWorld(world.camera.position.clone().set(0, object.geometry.boundingBox.max.y, 0)).y;
    };
    const arrivalGeometryAudit = {
      segmentCount: arrivalSegments.length,
      maximumTurnDegrees: Math.max(...arrivalTurns),
      surfaceOffsets: Array.from(new Set(arrivalSegments.map((road) => road.surfaceOffset))),
      clearOfBuildingPodium: arrivalSegments.every((road) => road.underBuildingPodium !== true),
      e2ApronCount: e2ApronMeshes.length,
      e2ApronSurfaceOffset: e2ApronMeshes[0]?.userData.surfaceOffset,
      e2ApronTopY: e2ApronMeshes[0] ? worldTop(e2ApronMeshes[0]) : null,
      welcomePlazaTopY: welcomePlazaForLevel ? worldTop(welcomePlazaForLevel) : null,
      e2BaseTopY: e2Base ? worldTop(e2Base) : null,
      innerCollectorMinimumRadius: Math.min(...innerCollectorRadii),
      innerCollectorMaximumRadius: Math.max(...innerCollectorRadii),
      tunnelJoinTurnDegrees: Math.acos(tunnelArrivalDot) * 180 / Math.PI,
      entryBranchSegmentCount: entryBranchSegments.length,
      logisticsBranchSegmentCount: logisticsBranchSegments.length,
      entryBranchOriginGap: branchConnectionGap(entryBranchSegments),
      logisticsBranchOriginGap: branchConnectionGap(logisticsBranchSegments),
      entryBranchEndpointId: entryBranchSegments.at(-1)?.toPointId,
      logisticsBranchEndpointId: logisticsBranchSegments.at(-1)?.toPointId,
      entryBranchEndpoint: polarRoadPoint(entryBranchSegments.at(-1).toPoint),
      logisticsBranchEndpoint: polarRoadPoint(logisticsBranchSegments.at(-1).toPoint),
      frontDoorRoad: {
        segmentCount: e2FrontSegments.length,
        maximumTurnDegrees: maximumRoadTurnDegrees(e2FrontSegments),
        firstEndpointType: e2FrontSegments[0]?.fromEndpointType,
        inboundArrivalConnectionGap: Math.hypot(
          (e2FrontSegments[0]?.fromPoint?.[0] ?? Infinity) - (arrivalSegments.at(-1)?.toPoint?.[0] ?? 0),
          (e2FrontSegments[0]?.fromPoint?.[2] ?? Infinity) - (arrivalSegments.at(-1)?.toPoint?.[2] ?? 0),
        ),
        outboundArrivalConnectionGap: Math.hypot(
          (e2FrontSegments.at(-1)?.toPoint?.[0] ?? Infinity) - (arrivalSegments.at(-1)?.toPoint?.[0] ?? 0),
          (e2FrontSegments.at(-1)?.toPoint?.[2] ?? Infinity) - (arrivalSegments.at(-1)?.toPoint?.[2] ?? 0),
        ),
        endpointGap: Math.hypot(
          (e2FrontSegments[0]?.fromPoint?.[0] ?? Infinity) - (e2FrontSegments.at(-1)?.toPoint?.[0] ?? 0),
          (e2FrontSegments[0]?.fromPoint?.[2] ?? Infinity) - (e2FrontSegments.at(-1)?.toPoint?.[2] ?? 0),
        ),
        ...entryNetwork?.userData.welcomeSplitGeometry,
      },
      rearBoundaryRoad: {
        present: e2RearSegments.length > 0,
      },
      parkingRearStairRoadPresent: logisticsRoadAudit.roads
        .some((road) => road.routeId === 'l1-north-stair-hardstand'),
      welcomeBuildingPosition: (() => {
        const point = e2Facility.getWorldPosition(world.camera.position.clone());
        return {
          radius: Math.hypot(point.x, point.z),
          degrees: ((Math.atan2(point.z, point.x) * 180 / Math.PI) + 360) % 360,
        };
      })(),
      welcomeDelimiterClearance: (() => {
        const point = e2Facility.getWorldPosition(world.camera.position.clone());
        const delimiterAngle = 300 * Math.PI / 180;
        return Math.abs(point.x * Math.sin(delimiterAngle) - point.z * Math.cos(delimiterAngle));
      })(),
      welcomeHallJunctionPosition: polarRoadPoint(arrivalSegments.at(-1).toPoint),
      welcomeLogisticsSplitPosition: polarRoadPoint(logisticsBranchSegments[0].fromPoint),
      welcomeLandscapePosition: (() => {
        const point = welcomeLandscape.getWorldPosition(world.camera.position.clone());
        return {
          radius: Math.hypot(point.x, point.z),
          degrees: ((Math.atan2(point.z, point.x) * 180 / Math.PI) + 360) % 360,
        };
      })(),
      welcomeHallJunctionLandscapeClearance: Math.hypot(
        ...(() => {
          const fork = entry.localToWorld(world.camera.position.clone().fromArray(arrivalSegments.at(-1).toPoint));
          const landscape = welcomeLandscape.getWorldPosition(world.controls.target.clone());
          return [fork.x - landscape.x, fork.z - landscape.z];
        })(),
      ),
      welcomeLoopAccessPointCount: welcomeLoop?.userData.accessPointCount ?? 0,
      welcomeLoopArcCount: welcomeLoop?.children.filter((child) => child.name.startsWith('ENTRY__WELCOME_VEHICLE_LOOP_ARC_')).length ?? 0,
      redundantWelcomeRoadMeshCount: redundantWelcomeRoadMeshes.length,
      obsoleteWelcomeJunctionObjects,
      welcomeForkSurfaceElevations,
      welcomeForkMedian: e2Facility?.userData.forkMedian === true,
      welcomeForkBranches: e2Facility?.userData.forkBranches,
      securityPanelCount: Array.from({ length: 11 }, (_, index) => (
        world.scene.getObjectByName(`LOGISTICS__TRANSLUCENT_SECURITY_WALL_PANEL_${index + 1}`)
      )).filter(Boolean).length,
      acousticBermCount: world.scene.children.flatMap((root) => {
        const matches = [];
        root.traverse((object) => {
          if (object.name.startsWith('LOGISTICS__ACOUSTIC_BERM_')) matches.push(object.name);
        });
        return matches;
      }).length,
    };

    const bridge = world.scene.getObjectByName('INFRASTRUCTURE__CYBER_CITY_BRIDGE');
    const e1 = world.scene.getObjectByName('ENTRY__E1__BRIDGEHEAD_TUNNEL_AND_ISLAND_GATE');
    if (!bridge || !e1) throw new Error('Bridge or E1 tunnel is unavailable');
    const bridgeStart = world.camera.position.clone().fromArray(bridge.userData.bridgeStart);
    const bridgeEnd = world.camera.position.clone().fromArray(bridge.userData.bridgeEnd);
    const islandRampStart = world.camera.position.clone().fromArray(bridge.userData.islandRampStart);
    const e1CityRoadEdge = e1.localToWorld(world.camera.position.clone().set(0, 0, -9.5));
    const e1Centre = e1.getWorldPosition(world.camera.position.clone());
    const cityAxis = e1.localToWorld(world.camera.position.clone().set(0, 0, -1)).sub(e1Centre).normalize();
    const bridgeDirection = bridgeEnd.clone().sub(bridgeStart).normalize();
    const bridgeDirectionXZ = bridgeDirection.clone().setY(0).normalize();
    const expectedCoastNormal = world.camera.position.clone().set(
      Math.cos(300 * Math.PI / 180),
      0,
      Math.sin(300 * Math.PI / 180),
    );
    const tunnelEye = e1.localToWorld(world.camera.position.clone().set(0, 0.36, 0));
    const tunnelSightline = bridgeEnd.clone().sub(tunnelEye).normalize();
    const raycaster = world.raycaster;
    raycaster.set(tunnelEye, tunnelSightline);
    raycaster.near = 0.01;
    raycaster.far = tunnelEye.distanceTo(bridgeEnd);
    const tunnelBlockers = raycaster.intersectObjects(e1.children, true).filter((intersection) => {
      const material = intersection.object.material;
      return intersection.object.visible
        && material
        && material.opacity !== 0
        && intersection.object.userData.walkable !== true;
    });
    const islandTransition = bridge.getObjectByName('Bridge island approach smooth transition');
    const transitionMetadata = bridge.userData.islandRoadTransition;
    let tunnelRoad;
    entry.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK')?.traverse((object) => {
      if (!tunnelRoad && object.userData.entranceLinkedRoad === true && object.userData.routeId === 'e1-tunnel-through-road') {
        tunnelRoad = object;
      }
    });
    if (!tunnelRoad) throw new Error('Cannot measure the E1 tunnel road transition');
    tunnelRoad.geometry.computeBoundingBox();
    const tunnelRoadTopY = tunnelRoad.localToWorld(
      world.camera.position.clone().set(0, tunnelRoad.geometry.boundingBox.max.y, 0),
    ).y;
    const transitionGroundSamples = Array.from({ length: 25 }, (_, index) => {
      const point = islandRampStart.clone().lerp(bridgeStart, index / 24);
      return world.walkController.sampleGround(point.x, point.z);
    });
    const transitionGroundSteps = transitionGroundSamples.slice(1).map((ground, index) => (
      ground === null || transitionGroundSamples[index] === null
        ? Infinity
        : ground - transitionGroundSamples[index]
    ));
    const bridgeAudit = {
      centrelineGapXZ: Math.hypot(e1CityRoadEdge.x - islandRampStart.x, e1CityRoadEdge.z - islandRampStart.z),
      cityAxisDot: cityAxis.dot(bridgeDirection),
      coastNormalDot: bridgeDirectionXZ.dot(expectedCoastNormal),
      landingRadiusXZ: Math.hypot(bridgeEnd.x, bridgeEnd.z),
      crossingLengthXZ: Math.hypot(bridgeEnd.x - bridgeStart.x, bridgeEnd.z - bridgeStart.z),
      alignmentMetadata: bridge.userData.entryTunnelAlignment,
      referenceAlignment: bridge.userData.referenceAlignment,
      transitionProfile: islandTransition?.userData.transitionProfile,
      transitionSegments: islandTransition?.userData.segmentCount,
      transitionTunnelWidth: islandTransition?.userData.startWidth,
      transitionBridgeWidth: islandTransition?.userData.endWidth,
      transitionTunnelTopGap: Math.abs((islandTransition?.userData.startTopY ?? Infinity) - tunnelRoadTopY),
      transitionBridgeTopGap: Math.abs((islandTransition?.userData.endTopY ?? Infinity) - (bridgeStart.y + 0.17)),
      transitionMetadata,
      transitionGroundSamples,
      transitionMaximumGroundStep: Math.max(...transitionGroundSteps.map(Math.abs)),
      transitionGroundReversals: transitionGroundSteps.filter((step) => step < -0.003).length,
      tunnelSightlineBlockers: tunnelBlockers.map((intersection) => intersection.object.name),
      tunnelEye: tunnelEye.toArray(),
      cityTarget: bridgeEnd.toArray(),
      tunnelLength: e1.userData.tunnelSightline?.tunnelLength,
      tunnelIslandPortalZ: e1.userData.tunnelSightline?.islandPortalZ,
      longTunnelSidewallCount: e1.children.filter((child) => child.name.startsWith('ENTRY__E1__LONG_TUNNEL_SIDEWALL_')).length,
    };

    world.setMode('walk');
    world.walkController.refreshNavigation();
    const tunnelLocalPoint = (x, z) => e1.localToWorld(world.camera.position.clone().set(x, 0, z));
    const centrelineSamples = Array.from({ length: 143 }, (_, index) => {
      const z = -9 + (27.8 * index / 142);
      const point = tunnelLocalPoint(0, z);
      const ground = world.walkController.sampleGround(point.x, point.z, { spawnSearch: true });
      return {
        z,
        point,
        ground,
        clear: ground !== null && world.walkController.isSpawnClear(point.x, point.z, ground),
      };
    });
    const sidewalkSamples = [-3.7, 3.7].map((x) => Array.from({ length: 91 }, (_, index) => {
      const z = -3.7 + (22.2 * index / 90);
      const point = tunnelLocalPoint(x, z);
      const ground = world.walkController.sampleGround(point.x, point.z, { spawnSearch: true });
      return {
        z,
        ground,
        clear: ground !== null && world.walkController.isSpawnClear(point.x, point.z, ground),
      };
    }));
    const movementStart = centrelineSamples[0];
    world.camera.position.set(
      movementStart.point.x,
      movementStart.ground + 0.162,
      movementStart.point.z,
    );
    world.walkController.groundY = movementStart.ground;
    world.walkController.grounded = true;
    let maximumWalkTargetError = 0;
    let blockedWalkSteps = 0;
    for (const sample of centrelineSamples.slice(1)) {
      const before = world.camera.position.clone();
      world.walkController.tryAxisMove(sample.point.x - world.camera.position.x, 0);
      world.camera.position.y = world.walkController.groundY + 0.162;
      world.walkController.tryAxisMove(0, sample.point.z - world.camera.position.z);
      world.camera.position.y = world.walkController.groundY + 0.162;
      const moved = Math.hypot(world.camera.position.x - before.x, world.camera.position.z - before.z);
      const error = Math.hypot(world.camera.position.x - sample.point.x, world.camera.position.z - sample.point.z);
      maximumWalkTargetError = Math.max(maximumWalkTargetError, error);
      if (moved < 0.12) blockedWalkSteps += 1;
    }
    const movementEndLocal = e1.worldToLocal(world.camera.position.clone());
    const vegetationBlockers = [];
    world.scene.traverse((object) => {
      if (!/(TREE|SHRUB|CANOPY|TRUNK)/i.test(object.name)) return;
      const local = e1.worldToLocal(object.getWorldPosition(world.camera.position.clone()));
      if (Math.abs(local.x) <= 4.05 && local.z >= -9.5 && local.z <= 19.5 && local.y <= 3.35) {
        vegetationBlockers.push({ name: object.name, local: local.toArray() });
      }
    });
    const tunnelSidewalks = [];
    entry.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK')?.traverse((object) => {
      if (object.userData.tunnelSidewalk === true) tunnelSidewalks.push(object.name);
    });
    const tunnelWalkAudit = {
      centrelineSampleCount: centrelineSamples.length,
      missingCentrelineGround: centrelineSamples.filter((sample) => sample.ground === null).length,
      blockedCentrelineSamples: centrelineSamples.filter((sample) => !sample.clear).map((sample) => sample.z),
      sidewalkNames: tunnelSidewalks.sort(),
      sidewalkSampleCounts: sidewalkSamples.map((samples) => samples.length),
      missingSidewalkGround: sidewalkSamples.map((samples) => samples.filter((sample) => sample.ground === null).length),
      blockedSidewalkSamples: sidewalkSamples.map((samples) => samples.filter((sample) => !sample.clear).map((sample) => sample.z)),
      maximumWalkTargetError,
      blockedWalkSteps,
      completedLocalZ: movementEndLocal.z,
      vegetationBlockers,
    };

    const welcomeInterior = e2Facility.getObjectByName('ENTRY__E2__WELCOME_REGISTRATION_INTERIOR');
    const welcomeCollision = e2Facility.getObjectByName('ENTRY__E2__PRECISE_ELLIPTICAL_WALL_COLLISION');
    const welcomeDoorLeaves = e2Facility.children.filter((child) => child.name.startsWith('ENTRY__E2__AUTOMATIC_SLIDING_DOOR_'));
    const welcomeRearDoorLeaves = e2Facility.children.filter((child) => child.name.startsWith('ENTRY__E2__REAR_AUTOMATIC_SLIDING_DOOR_'));
    const welcomeStaircase = e2Facility.getObjectByName('ENTRY__E2__WHITE_ENTRY_STAIRCASE');
    const welcomeStairNavigation = e2Facility.getObjectByName('ENTRY__E2__CONTINUOUS_STAIR_NAVIGATION_SURFACE');
    const welcomeRearStaircase = e2Facility.getObjectByName('ENTRY__E2__WHITE_REAR_EXIT_STAIRCASE');
    const welcomeRearStairNavigation = e2Facility.getObjectByName('ENTRY__E2__CONTINUOUS_REAR_STAIR_NAVIGATION_SURFACE');
    const welcomeRearSteps = [...(welcomeRearStaircase?.children ?? [])]
      .filter((child) => /^ENTRY__E2__WHITE_REAR_EXIT_STEP_\d+$/.test(child.name));
    const welcomePodiumCollision = e2Facility.getObjectByName('ENTRY__E2__PRECISE_PODIUM_COLLISION');
    const welcomeSteps = [...(welcomeStaircase?.children ?? [])]
      .filter((child) => child.userData.stairStep)
      .sort((a, b) => a.userData.stairStep - b.userData.stairStep);
    const welcomeStepGround = welcomeSteps.map((step) => {
      const point = step.getWorldPosition(world.camera.position.clone());
      return world.walkController.sampleGround(point.x, point.z, { spawnSearch: true });
    });
    const welcomeDnaColumns = e2Facility.children
      .filter((child) => child.userData.dnaShapedColumn === true);
    const welcomePoolLandscape = world.scene.getObjectByName('ENTRY__WELCOME_LANDSCAPE');
    const welcomePoolFeature = world.scene.getObjectByName('ENTRY__WELCOME_HALF_COVERED_POOL_EDITABLE');
    const welcomePool = world.scene.getObjectByName('ENTRY__WELCOME_REFLECTING_POOL');
    const welcomePoolRoof = welcomePoolFeature?.getObjectByName('ENTRY__WELCOME_POOL_HALF_ELLIPSE_ROOF');
    const welcomePoolDeck = welcomePoolFeature?.getObjectByName('ENTRY__WELCOME_POOL_WHITE_TERRACE_DECK');
    const welcomePoolSupports = welcomePoolFeature?.children
      .filter((child) => child.userData.poolCoverSupport === true) ?? [];
    const poolTimeBefore = welcomePool?.userData.waveTime ?? null;
    const poolPositionAttribute = welcomePool?.geometry?.getAttribute('position');
    const poolWaveBefore = poolPositionAttribute
      ? Array.from({ length: poolPositionAttribute.count }, (_, index) => poolPositionAttribute.getZ(index))
      : [];
    const poolLocalPosition = welcomePoolLandscape && welcomePool
      ? welcomePoolLandscape.worldToLocal(welcomePool.getWorldPosition(world.camera.position.clone())).toArray()
      : null;
    const poolTableSets = welcomePoolFeature?.children
      .filter((child) => child.userData.poolFurniture === true) ?? [];
    const poolChairs = [];
    const poolTabletops = [];
    poolTableSets.forEach((set) => {
      set.traverse((child) => {
        if (/__CHAIR_\d+$/.test(child.name)) poolChairs.push(child);
        if (/__TABLETOP$/.test(child.name)) poolTabletops.push(child);
      });
    });
    const objectSize = (object) => {
      const size = new world.camera.position.constructor();
      new world.selectionBounds.constructor().setFromObject(object, true).getSize(size);
      return size.toArray();
    };
    const cafeFacility = world.scene.getObjectByName('ENTRY__E4__CLEARLINE_GLASSFRONT_CAFE');
    const cafeTableSets = cafeFacility?.children
      .filter((child) => child.userData.cafeTerraceFurniture === true) ?? [];
    const cafePlanters = cafeFacility?.children
      .filter((child) => child.userData.perimeterPlanter === true
        && /^ENTRY__E4__HERB_PLANTER_\d+$/.test(child.name)) ?? [];
    const cafeHerbs = cafeFacility?.children
      .filter((child) => child.userData.perimeterPlanter === true
        && /^ENTRY__E4__PLANTER_GRASS_\d+_\d+$/.test(child.name)) ?? [];
    const cafeWordmark = cafeFacility?.getObjectByName('ENTRY__E4__CAFE_WORDMARK');
    const cafeAggregateShells = [
      'ENTRY__E4__FLUTED_CERAMIC_SERVICE_WALL',
      'ENTRY__E4__LOW_IRON_GLASS_PAVILION',
      'ENTRY__E4__HOVERING_BRONZE_ROOF',
    ].map((name) => cafeFacility?.getObjectByName(name));
    const cafePreciseCollision = cafeFacility?.getObjectByName(
      'ENTRY__E4__PRECISE_INTERIOR_WALL_COLLISION',
    );
    const fashionClubFacility = world.scene.getObjectByName(
      'ENTRY__E6__THE_CATWALK_FASHION_RUNWAY_CLUB',
    );
    const fashionClubAggregateShells = [
      'ENTRY__E6__BLACK_STAINLESS_CLUB_VOLUME',
      'ENTRY__E6__LIGHTING_TRUSS_CANOPY',
    ].map((name) => fashionClubFacility?.getObjectByName(name));
    const fashionClubPreciseCollision = fashionClubFacility?.getObjectByName(
      'ENTRY__E6__PRECISE_INTERIOR_WALL_COLLISION',
    );
    const cafeChairs = [];
    const cafeTabletops = [];
    const cafeUmbrellas = [];
    cafeTableSets.forEach((set) => {
      set.traverse((child) => {
        if (child.userData.cafeTerraceChair === true) cafeChairs.push(child);
        if (/ENTRY__E4__TERRACE_TABLE_\d+$/.test(child.name)) cafeTabletops.push(child);
        if (/ENTRY__E4__CIRCULAR_UMBRELLA_\d+$/.test(child.name)) cafeUmbrellas.push(child);
      });
    });
    const cafeAccess = cafeFacility?.userData.walkAccess;
    const cafeRouteStart = entry.localToWorld(
      world.camera.position.clone().fromArray(cafeAccess.routeStart),
    );
    const cafeInteriorTarget = entry.localToWorld(
      world.controls.target.clone().fromArray(cafeAccess.interiorTarget),
    );
    world.setMode('walk');
    world.walkController.refreshNavigation();
    const cafeStartGround = world.walkController.sampleGround(
      cafeRouteStart.x,
      cafeRouteStart.z,
      { spawnSearch: true },
    );
    world.camera.position.set(cafeRouteStart.x, cafeStartGround + 0.162, cafeRouteStart.z);
    world.walkController.groundY = cafeStartGround;
    world.walkController.grounded = true;
    world.advanceTime(16);
    let cafeBlockedSteps = 0;
    let cafeMaximumTargetError = 0;
    const cafeStart = world.camera.position.clone();
    for (let index = 1; index <= 90; index += 1) {
      const target = cafeStart.clone().lerp(cafeInteriorTarget, index / 90);
      const before = world.camera.position.clone();
      world.walkController.tryAxisMove(target.x - world.camera.position.x, 0);
      world.camera.position.y = world.walkController.groundY + 0.162;
      world.walkController.tryAxisMove(0, target.z - world.camera.position.z);
      world.camera.position.y = world.walkController.groundY + 0.162;
      world.advanceTime(16);
      const moved = Math.hypot(
        world.camera.position.x - before.x,
        world.camera.position.z - before.z,
      );
      const error = Math.hypot(
        world.camera.position.x - target.x,
        world.camera.position.z - target.z,
      );
      if (moved < 0.01) cafeBlockedSteps += 1;
      cafeMaximumTargetError = Math.max(cafeMaximumTargetError, error);
    }
    const cafeApproachEndGap = Math.hypot(
      world.camera.position.x - cafeInteriorTarget.x,
      world.camera.position.z - cafeInteriorTarget.z,
    );
    world.walkController.sampleGround(
      world.camera.position.x,
      world.camera.position.z,
      { trackSurface: true },
    );
    const wordmarkWidth = cafeWordmark?.geometry?.parameters?.width ?? Infinity;
    const cafeTerraceAudit = {
      tableSetCount: cafeTableSets.length,
      chairCount: cafeChairs.length,
      chairsPerTable: cafeTableSets.map((set) => (
        set.children.filter((child) => child.userData.cafeTerraceChair === true).length
      )),
      umbrellaCount: cafeUmbrellas.length,
      humanScaleMetres: cafeTableSets.map((set) => set.userData.humanScaleMetres),
      tabletopSizes: cafeTabletops.map(objectSize),
      chairSizes: cafeChairs.map(objectSize),
      umbrellaSizes: cafeUmbrellas.map(objectSize),
      tableSetPositions: cafeTableSets.map((set) => set.position.toArray()),
      planterCount: cafePlanters.length,
      herbClusterCount: cafeHerbs.length,
      planterSizes: cafePlanters.map(objectSize),
      herbSizes: cafeHerbs.map(objectSize),
      planterNavigationBlockers: [...cafePlanters, ...cafeHerbs]
        .filter((object) => object.userData.navObstacle === true)
        .map((object) => object.name),
      centralAisleBlockers: [...cafeTableSets, ...cafePlanters]
        .filter((object) => Math.abs(object.position.x) < 2.5)
        .map((object) => object.name),
      wordmark: {
        localPosition: cafeWordmark?.position.toArray(),
        width: wordmarkWidth,
        rightEdge: cafeWordmark ? cafeWordmark.position.x + wordmarkWidth * 0.5 : Infinity,
        doorwayWestEdge: -cafeAccess.doorwayWidth * 0.5,
        clearOfDoor: cafeWordmark?.userData.clearOfCafeDoor === true,
        facadeMount: cafeWordmark?.userData.facadeMount,
      },
      collision: {
        aggregateShells: cafeAggregateShells.map((shell) => ({
          name: shell?.name,
          obstacle: shell?.userData.navObstacle === true,
          aggregateCollisionDisabled: shell?.userData.aggregateCollisionDisabled === true,
          preciseCollisionGuide: shell?.userData.preciseCollisionGuide,
        })),
        preciseBarrierCount: cafePreciseCollision?.userData.navBarrierSegments?.length ?? 0,
        doorwayGapWidth: cafePreciseCollision?.userData.doorwayGapWidth,
        usesPreciseDoorwayCollision: cafeFacility?.userData.cafeUsesPreciseDoorwayCollision === true,
        aggregateObstacleCount: cafeFacility?.userData.cafeAggregateObstacleCount,
      },
      fullDoorApproach: {
        startGround: cafeStartGround,
        blockedSteps: cafeBlockedSteps,
        maximumTargetError: cafeMaximumTargetError,
        endGap: cafeApproachEndGap,
        grounded: world.walkController.getSnapshot().grounded,
        roomId: world.walkController.getSnapshot().roomId,
      },
      facilityMetadata: {
        tableCount: cafeFacility?.userData.cafeTerraceTableCount,
        chairCount: cafeFacility?.userData.cafeTerraceChairCount,
        humanScale: cafeFacility?.userData.cafeTerraceHumanScale === true,
        centralAisleWidthMetres: cafeFacility?.userData.cafeCentralAisleWidthMetres,
        perimeterPlanterCount: cafeFacility?.userData.cafePerimeterPlanterCount,
        plantersNonBlocking: cafeFacility?.userData.cafePlantersNonBlocking === true,
        wordmarkClearOfDoor: cafeFacility?.userData.cafeWordmarkClearOfDoor === true,
      },
    };
    const fashionClubAccessAudit = {
      aggregateShells: fashionClubAggregateShells.map((shell) => ({
        name: shell?.name,
        obstacle: shell?.userData.navObstacle === true,
        aggregateCollisionDisabled: shell?.userData.aggregateCollisionDisabled === true,
        preciseCollisionGuide: shell?.userData.preciseCollisionGuide,
      })),
      preciseBarrierCount: fashionClubPreciseCollision?.userData.navBarrierSegments?.length ?? 0,
      doorwayGapWidth: fashionClubPreciseCollision?.userData.doorwayGapWidth,
      usesPreciseDoorwayCollision:
        fashionClubFacility?.userData.fashionClubUsesPreciseDoorwayCollision === true,
      aggregateObstacleCount: fashionClubFacility?.userData.fashionClubAggregateObstacleCount,
    };
    const poolSize = welcomePool ? objectSize(welcomePool) : null;
    const tabletopSizes = poolTabletops.map(objectSize);
    const chairSizes = poolChairs.map(objectSize);
    world.walkController.refreshNavigation();
    const welcomeStart = e2Facility.localToWorld(world.camera.position.clone().set(0, 0.008, 7.7));
    const welcomeStartGround = world.walkController.sampleGround(welcomeStart.x, welcomeStart.z, { spawnSearch: true });
    world.camera.position.set(welcomeStart.x, welcomeStartGround + 0.162, welcomeStart.z);
    world.walkController.groundY = welcomeStartGround;
    world.walkController.grounded = true;
    let welcomeBlockedSteps = 0;
    let welcomeMaximumTargetError = 0;
    const welcomeGroundTrace = [welcomeStartGround];
    for (let index = 1; index <= 77; index += 1) {
      const target = e2Facility.localToWorld(
        world.controls.target.clone().set(0, 0.008, 7.7 - index * 0.1),
      );
      const before = world.camera.position.clone();
      world.walkController.tryAxisMove(target.x - world.camera.position.x, 0);
      world.camera.position.y = world.walkController.groundY + 0.162;
      world.walkController.tryAxisMove(0, target.z - world.camera.position.z);
      world.camera.position.y = world.walkController.groundY + 0.162;
      world.advanceTime(16);
      const moved = Math.hypot(world.camera.position.x - before.x, world.camera.position.z - before.z);
      const error = Math.hypot(world.camera.position.x - target.x, world.camera.position.z - target.z);
      if (moved < 0.055) welcomeBlockedSteps += 1;
      welcomeMaximumTargetError = Math.max(welcomeMaximumTargetError, error);
      welcomeGroundTrace.push(world.walkController.groundY);
    }
    const welcomeEndLocal = e2Facility.worldToLocal(world.camera.position.clone());
    world.walkController.sampleGround(
      world.camera.position.x,
      world.camera.position.z,
      { trackSurface: true },
    );
    const welcomeAccessAudit = {
      visualDoorLeafCount: welcomeDoorLeaves.length,
      rearVisualDoorLeafCount: welcomeRearDoorLeaves.length,
      preciseWallBarrierCount: welcomeCollision?.userData.navBarrierSegments?.length ?? 0,
      doorwayGapWidth: welcomeCollision?.userData.doorwayGapWidth ?? 0,
      redundantRoadMeshCount: redundantWelcomeRoadMeshes.length,
      blockedWalkSteps: welcomeBlockedSteps,
      maximumWalkTargetError: welcomeMaximumTargetError,
      minimumGround: Math.min(...welcomeGroundTrace),
      maximumGround: Math.max(...welcomeGroundTrace),
      maximumGroundDrop: Math.max(
        0,
        ...welcomeGroundTrace.slice(1).map((ground, index) => welcomeGroundTrace[index] - ground),
      ),
      eyeHeightWorld: world.camera.position.y - world.walkController.groundY,
      endLocal: welcomeEndLocal.toArray(),
      interiorVisible: welcomeInterior?.visible === true,
      interiorRoomId: world.walkController.getSnapshot().roomId,
      walkAccess: e2Facility.userData.walkAccess,
      rearThreshold: e2Facility.userData.roadRearDoorThreshold,
      rearRouteStart: e2Facility.userData.roadRearRouteStart,
    };
    const poolTimeAfter = welcomePool?.userData.waveTime ?? null;
    const poolAnimatedVertexCount = poolPositionAttribute
      ? poolWaveBefore.filter((value, index) => (
        Math.abs(poolPositionAttribute.getZ(index) - value) > 0.00001
      )).length
      : 0;
    const welcomeDesignAudit = {
      stairCount: welcomeSteps.length,
      staircaseMetadata: welcomeStaircase?.userData,
      continuousNavigationSurface: welcomeStairNavigation?.userData.walkable === true,
      rearStairCount: welcomeRearSteps.length,
      rearStaircaseMetadata: welcomeRearStaircase?.userData,
      rearContinuousNavigationSurface: welcomeRearStairNavigation?.userData.walkable === true,
      podiumCollisionSegmentCount: welcomePodiumCollision?.userData.navBarrierSegments?.length ?? 0,
      preventsUnderPodiumAccess: welcomePodiumCollision?.userData.preventsUnderPodiumAccess === true,
      missingStepGround: welcomeStepGround.filter((ground) => ground === null).length,
      maximumStepGroundRise: Math.max(
        ...welcomeStepGround.slice(1).map((ground, index) => (
          ground === null || welcomeStepGround[index] === null
            ? Infinity
            : Math.abs(ground - welcomeStepGround[index])
        )),
      ),
      dnaColumnCount: welcomeDnaColumns.length,
      dnaColumns: welcomeDnaColumns.map((column) => ({
        name: column.name,
        grounded: column.userData.grounded === true,
        groundTouchY: column.userData.groundTouchY,
        strandCount: column.children.filter((child) => /__STRAND_\d+$/.test(child.name)).length,
        basePairCount: column.children.filter((child) => /__BASE_PAIR_\d+$/.test(child.name)).length,
        colors: Array.from(new Set(column.children
          .map((child) => child.material?.color?.getHexString?.())
          .filter(Boolean))),
      })),
      pool: {
        localPosition: poolLocalPosition,
        side: welcomePool?.userData.poolSide,
        selectableRegistration: editablePoolRegistration,
        halfCovered: welcomePoolFeature?.userData.halfCovered === true,
        roofCoverageRatio: welcomePoolFeature?.userData.roofCoverageRatio,
        roofPresent: Boolean(welcomePoolRoof),
        roofThetaLength: welcomePoolRoof?.geometry?.parameters?.thetaLength,
        roofSizeWorld: welcomePoolRoof ? objectSize(welcomePoolRoof) : null,
        roofSupportCount: welcomePoolSupports.length,
        roofSupportsGrounded: welcomePoolSupports.every((support) => {
          const size = objectSize(support);
          const centre = support.getWorldPosition(world.camera.position.clone());
          const featureWorldY = welcomePoolFeature.getWorldPosition(world.controls.target.clone()).y;
          return Math.abs(centre.y - size[1] * 0.5 - featureWorldY - 0.008) < 0.012;
        }),
        deckWalkable: welcomePoolDeck?.userData.walkable === true,
        smallWaves: welcomePool?.userData.smallWaves === true,
        physicalWaterMaterial: Boolean(welcomePool?.material?.isMeshPhysicalMaterial),
        animationAdvance: poolTimeBefore === null || poolTimeAfter === null
          ? null
          : poolTimeAfter - poolTimeBefore,
        animatedVertexCount: poolAnimatedVertexCount,
        sizeWorld: poolSize,
      },
      poolTableCount: poolTableSets.length,
      poolChairCount: poolChairs.length,
      tableHumanScaleMetres: poolTableSets.map((set) => set.userData.humanScaleMetres),
      tabletopSizes,
      chairSizes,
    };

    // The preceding traversal deliberately enters E2's isolated streamed
    // interior, which hides exterior roads. Restore the exterior package
    // before sampling the independent apron-edge route.
    world.setMode('explore');
    world.walkController.refreshNavigation();
    const e2ApronRoad = e2ApronMeshes[Math.floor(e2ApronMeshes.length * 0.7)];
    const apronFrom = entry.localToWorld(world.camera.position.clone().fromArray(e2ApronRoad.userData.fromPoint));
    const apronTo = entry.localToWorld(world.camera.position.clone().fromArray(e2ApronRoad.userData.toPoint));
    const apronDirection = apronTo.clone().sub(apronFrom).setY(0).normalize();
    const apronLateral = world.controls.target.clone().set(apronDirection.z, 0, -apronDirection.x);
    const apronMidpoint = apronFrom.clone().lerp(apronTo, 0.5);
    const shoulderPoint = apronMidpoint.clone().addScaledVector(apronLateral, 4.6);
    const apronSurfacePoint = apronMidpoint.clone().addScaledVector(apronLateral, 1);
    const shoulderGround = world.walkController.sampleGround(shoulderPoint.x, shoulderPoint.z, { spawnSearch: true });
    const apronGround = world.walkController.sampleGround(apronSurfacePoint.x, apronSurfacePoint.z, { spawnSearch: true });
    world.camera.position.set(shoulderPoint.x, shoulderGround + 0.162, shoulderPoint.z);
    world.walkController.groundY = shoulderGround;
    world.walkController.grounded = true;
    let apronEdgeBlockedSteps = 0;
    for (let index = 1; index <= 92; index += 1) {
      const target = shoulderPoint.clone().addScaledVector(apronLateral, -index * 0.05);
      const before = world.camera.position.clone();
      world.walkController.tryAxisMove(target.x - world.camera.position.x, 0);
      world.camera.position.y = world.walkController.groundY + 0.162;
      world.walkController.tryAxisMove(0, target.z - world.camera.position.z);
      world.camera.position.y = world.walkController.groundY + 0.162;
      if (before.distanceTo(world.camera.position) < 0.01) apronEdgeBlockedSteps += 1;
    }
    const welcomeRoadEdgeAudit = {
      shoulderGround,
      apronGround,
      rise: apronGround - shoulderGround,
      blockedSteps: apronEdgeBlockedSteps,
      endOffset: world.camera.position.clone().sub(apronMidpoint).dot(apronLateral),
    };
    const entryInteriorAudit = [];
    world.setMode('walk');
    world.walkController.refreshNavigation();
    for (const code of Array.from({ length: 12 }, (_, index) => `E${index + 2}`)) {
      const facility = world.objectGroups.get(`entry-logistics-building-${code.toLowerCase()}`);
      if (!facility) throw new Error(`Cannot audit ${code} WALK interior`);
      const walkAccess = facility.userData.walkAccess;
      const runtimeInteriors = facility.children.filter((child) => child.userData.runtimeInterior === true);
      const accessVolumes = facility.children.filter((child) => child.userData.navAccess === true);
      const collisionGuide = facility.children.find((child) => child.name.includes('PRECISE_INTERIOR_WALL_COLLISION'));
      const thresholdPoint = entry.localToWorld(world.controls.target.clone().fromArray(walkAccess.threshold));
      const routeStartPoint = entry.localToWorld(world.camera.position.clone().fromArray(walkAccess.routeStart));
      const interiorPoint = entry.localToWorld(world.camera.position.clone().fromArray(walkAccess.interiorTarget));
      const doorwayOutward = routeStartPoint.clone().sub(thresholdPoint).setY(0).normalize();
      const start = thresholdPoint.clone().addScaledVector(doorwayOutward, 0.72);
      const throughDoor = thresholdPoint.clone().addScaledVector(doorwayOutward, -0.82);
      const startGround = world.walkController.sampleGround(start.x, start.z, { spawnSearch: true });
      if (startGround === null) throw new Error(`${code} road has no WALK ground at its live entrance`);
      world.camera.position.set(start.x, startGround + 0.162, start.z);
      world.walkController.groundY = startGround;
      world.walkController.grounded = true;
      world.advanceTime(16);
      let blockedSteps = 0;
      let maximumTargetError = 0;
      const segmentStart = world.camera.position.clone();
      for (let index = 1; index <= 24; index += 1) {
        const target = segmentStart.clone().lerp(throughDoor, index / 24);
        const before = world.camera.position.clone();
        world.walkController.tryAxisMove(target.x - world.camera.position.x, 0);
        world.camera.position.y = world.walkController.groundY + 0.162;
        world.walkController.tryAxisMove(0, target.z - world.camera.position.z);
        world.camera.position.y = world.walkController.groundY + 0.162;
        const moved = Math.hypot(
          world.camera.position.x - before.x,
          world.camera.position.z - before.z,
        );
        const error = Math.hypot(
          world.camera.position.x - target.x,
          world.camera.position.z - target.z,
        );
        if (moved < 0.01) blockedSteps += 1;
        maximumTargetError = Math.max(maximumTargetError, error);
      }
      const doorwayEndGap = Math.hypot(
        world.camera.position.x - throughDoor.x,
        world.camera.position.z - throughDoor.z,
      );
      world.camera.position.set(
        interiorPoint.x,
        world.walkController.groundY + 0.162,
        interiorPoint.z,
      );
      world.advanceTime(32);
      world.walkController.sampleGround(
        world.camera.position.x,
        world.camera.position.z,
        { trackSurface: true },
      );
      const visibleInteriors = facility.children
        .filter((child) => child.userData.runtimeInterior === true && child.visible)
        .map((child) => child.name);
      const disabledAggregateNames = facility.userData.disabledAggregateExteriorObstacles ?? [];
      const disabledAggregateObjects = disabledAggregateNames
        .map((name) => facility.getObjectByName(name));
      entryInteriorAudit.push({
        code,
        accessible: walkAccess.accessible === true,
        exteriorOnly: walkAccess.exteriorOnly === false,
        authoredInterior: facility.userData.authoredInterior === true,
        runtimeInteriorCount: runtimeInteriors.length,
        accessVolumeCount: accessVolumes.length,
        doorwayWidth: walkAccess.doorwayWidth,
        barrierCount: collisionGuide?.userData.navBarrierSegments?.length ?? 0,
        startGround,
        blockedSteps,
        maximumTargetError,
        doorwayEndGap,
        endLocal: facility.worldToLocal(world.camera.position.clone()).toArray(),
        visibleInteriors,
        roomId: world.walkController.getSnapshot().roomId,
        exteriorCollisionPolicy: facility.userData.entryExteriorCollisionPolicy,
        preciseExteriorCollisionGuide: facility.userData.preciseExteriorCollisionGuide,
        disabledAggregateExteriorObstacleCount:
          facility.userData.disabledAggregateExteriorObstacleCount,
        aggregateExteriorObstacleCount: facility.userData.aggregateExteriorObstacleCount,
        disabledAggregateObjectCount: disabledAggregateObjects.length,
        disabledAggregateObjectsValid: disabledAggregateObjects.every((object) =>
          object
          && object.userData.navObstacle !== true
          && object.userData.aggregateCollisionDisabled === true
          && object.userData.preciseCollisionGuide
            === `ENTRY__${code}__PRECISE_INTERIOR_WALL_COLLISION`),
      });
    }

    const e10Facility = world.objectGroups.get('entry-logistics-building-e10');
    const e10Interior = e10Facility?.getObjectByName('ENTRY__E10__AUTHORED_WALK_INTERIOR');
    const e10Channel = e10Facility?.getObjectByName('ENTRY__E10__C_SHAPED_WATER_CHANNEL');
    const e10ChannelCollision = e10Facility?.getObjectByName('ENTRY__E10__PRECISE_WATER_CHANNEL_COLLISION');
    const e10Shell = e10Facility?.getObjectByName('ENTRY__E10__LOW_CIRCULAR_SHOWCASE_SHELL');
    if (!e10Facility || !e10Interior || !e10Channel || !e10ChannelCollision || !e10Shell) {
      throw new Error('E10 water-channel or authored-interior assembly is incomplete');
    }
    const e10ChannelPositions = e10Channel.geometry.getAttribute('position');
    let e10DoorOverlapVertexCount = 0;
    for (let index = 0; index < e10ChannelPositions.count; index += 1) {
      const x = e10ChannelPositions.getX(index);
      const z = e10ChannelPositions.getZ(index);
      if (Math.abs(x) < 2.25 && z > 6.45) e10DoorOverlapVertexCount += 1;
    }
    const e10Center = e10Facility.userData.runtimeInteriorCenter;
    const e10Inside = e10Facility.localToWorld(world.camera.position.clone().set(
      e10Center[0],
      e10Facility.userData.walkAccess.finishedFloorY,
      e10Center[1],
    ));
    const e10InsideGround = world.walkController.sampleGround(e10Inside.x, e10Inside.z, { spawnSearch: true });
    world.camera.position.set(e10Inside.x, e10InsideGround + 0.162, e10Inside.z);
    world.walkController.groundY = e10InsideGround;
    world.walkController.grounded = true;
    world.advanceTime(48);
    const e10VisibleExteriorObjects = [];
    e10Facility.traverse((object) => {
      if (object.userData.hideWhenRuntimeInteriorVisible === true && object.visible) {
        e10VisibleExteriorObjects.push(object.name);
      }
    });
    const showcaseGalleryAudit = {
      channelName: e10Channel.name,
      obsoleteChannelPresent: Boolean(e10Facility.getObjectByName('ENTRY__E10__PARTIAL_WATER_CHANNEL')),
      entranceGapDegrees: e10Channel.userData.entranceGapDegrees,
      entranceGapWidth: e10Channel.userData.entranceGapWidth,
      clearOfPublicEntrance: e10Channel.userData.clearOfPublicEntrance === true,
      collisionSegmentCount: e10ChannelCollision.userData.navBarrierSegments?.length ?? 0,
      doorOverlapVertexCount: e10DoorOverlapVertexCount,
      obsoleteWhiteAislePresent: Boolean(e10Facility.getObjectByName('ENTRY__E10__INTERIOR_CLEAR_CENTRAL_AISLE')),
      interiorVisible: e10Interior.visible === true,
      visibleExteriorObjectsWhileInside: e10VisibleExteriorObjects,
      shellHiddenWhileInside: e10Shell.visible === false,
    };

    const e5Facility = world.objectGroups.get('entry-logistics-building-e5');
    const e5Interior = e5Facility?.getObjectByName('ENTRY__E5__AUTHORED_WALK_INTERIOR');
    const e5InternalCollision = e5Facility?.getObjectByName('ENTRY__E5__PRECISE_INTERNAL_GALLERY_COLLISION');
    const e5Route = e5Facility?.getObjectByName('ENTRY__E5__INTERIOR_CONTINUOUS_GALLERY_ROUTE');
    if (!e5Facility || !e5Interior || !e5InternalCollision || !e5Route) {
      throw new Error('E5 connected gallery route is incomplete');
    }
    const e5Center = e5Facility.userData.runtimeInteriorCenter;
    const e5RouteStart = e5Facility.localToWorld(world.camera.position.clone().set(
      -10.2,
      e5Facility.userData.walkAccess.finishedFloorY,
      e5Center[1],
    ));
    const e5RouteEnd = e5Facility.localToWorld(world.controls.target.clone().set(
      10.2,
      e5Facility.userData.walkAccess.finishedFloorY,
      e5Center[1],
    ));
    const e5StartGround = world.walkController.sampleGround(e5RouteStart.x, e5RouteStart.z, { spawnSearch: true });
    world.camera.position.set(e5RouteStart.x, e5StartGround + 0.162, e5RouteStart.z);
    world.walkController.groundY = e5StartGround;
    world.walkController.grounded = true;
    world.advanceTime(48);
    let e5BlockedSteps = 0;
    let e5MaximumTargetError = 0;
    for (let index = 1; index <= 96; index += 1) {
      const target = e5RouteStart.clone().lerp(e5RouteEnd, index / 96);
      const before = world.camera.position.clone();
      world.walkController.tryAxisMove(target.x - world.camera.position.x, 0);
      world.camera.position.y = world.walkController.groundY + 0.162;
      world.walkController.tryAxisMove(0, target.z - world.camera.position.z);
      world.camera.position.y = world.walkController.groundY + 0.162;
      if (before.distanceTo(world.camera.position) < 0.01) e5BlockedSteps += 1;
      e5MaximumTargetError = Math.max(
        e5MaximumTargetError,
        Math.hypot(world.camera.position.x - target.x, world.camera.position.z - target.z),
      );
    }
    world.advanceTime(48);
    const e5PartitionObjects = [];
    const e5DoorSigns = [];
    const e5VisibleExteriorObjects = [];
    e5Facility.traverse((object) => {
      if (object.name.includes('INTERIOR_') && object.name.includes('_PARTITION_')) {
        e5PartitionObjects.push(object.name);
      }
      if (object.name.includes('OPEN_GALLERY_DOOR_SIGN')) e5DoorSigns.push(object.name);
      if (object.userData.hideWhenRuntimeInteriorVisible === true && object.visible) {
        e5VisibleExteriorObjects.push(object.name);
      }
    });
    const ringwalkGalleryAudit = {
      connectedInternalRoute: e5Interior.userData.connectedInternalRoute === true,
      galleryZones: e5Interior.userData.galleryZones,
      internalDoorCount: e5Interior.userData.internalDoorCount,
      partitionObjectCount: e5PartitionObjects.length,
      doorSignCount: e5DoorSigns.length,
      internalDoorwayWidth: e5InternalCollision.userData.internalDoorwayWidth,
      collisionSegmentCount: e5InternalCollision.userData.navBarrierSegments?.length ?? 0,
      blockedSteps: e5BlockedSteps,
      maximumTargetError: e5MaximumTargetError,
      endGap: Math.hypot(
        world.camera.position.x - e5RouteEnd.x,
        world.camera.position.z - e5RouteEnd.z,
      ),
      interiorVisible: e5Interior.visible === true,
      visibleExteriorObjectsWhileInside: e5VisibleExteriorObjects,
      e10ShellRestoredAfterExit: e10Shell.visible === true,
    };

    const auditFrontWall = (facility, code) => {
      const interior = facility.getObjectByName(`ENTRY__${code}__AUTHORED_WALK_INTERIOR`);
      const frontWallObjects = [];
      interior?.traverse((object) => {
        if (object.userData.frontWallWithDoor === true) frontWallObjects.push(object.name);
      });
      return {
        frontWallObjectCount: frontWallObjects.length,
        frontWallObjects,
        westWallPresent: Boolean(interior?.getObjectByName(`ENTRY__${code}__INTERIOR_FRONT_WALL_WEST`)),
        eastWallPresent: Boolean(interior?.getObjectByName(`ENTRY__${code}__INTERIOR_FRONT_WALL_EAST`)),
        headerPresent: Boolean(interior?.getObjectByName(`ENTRY__${code}__INTERIOR_FRONT_DOOR_HEADER`)),
        jambCount: frontWallObjects.filter((name) => name.includes('FRONT_DOOR_JAMB_')).length,
        doorwayWidth: facility.userData.entryInteriorDoorwayWidth,
      };
    };
    const streamedFrontWallAudit = {
      E5: auditFrontWall(e5Facility, 'E5'),
      E10: auditFrontWall(e10Facility, 'E10'),
    };

    const e8Facility = world.objectGroups.get('entry-logistics-building-e8');
    const e8Interior = e8Facility?.getObjectByName('ENTRY__E8__AUTHORED_WALK_INTERIOR');
    const e8DoorAccess = e8Facility?.getObjectByName('ENTRY__E8__DOOR_NAV_ACCESS');
    const e8Canopy = e8Facility?.getObjectByName('ENTRY__E8__POLISHED_DROP_OFF_CANOPY');
    if (!e8Facility || !e8Interior || !e8DoorAccess || !e8Canopy) {
      throw new Error('E8 hotel entrance assembly is incomplete');
    }
    const e8WalkAccess = e8Facility.userData.walkAccess;
    const e8RouteStart = entry.localToWorld(world.camera.position.clone().fromArray(e8WalkAccess.routeStart));
    const e8InteriorTarget = entry.localToWorld(world.controls.target.clone().fromArray(e8WalkAccess.interiorTarget));
    const e8StartGround = world.walkController.sampleGround(e8RouteStart.x, e8RouteStart.z, { spawnSearch: true });
    world.camera.position.set(e8RouteStart.x, e8StartGround + 0.162, e8RouteStart.z);
    world.walkController.groundY = e8StartGround;
    world.walkController.grounded = true;
    world.advanceTime(48);
    world.walkController.refreshNavigation();
    let e8BlockedSteps = 0;
    let e8MaximumTargetError = 0;
    for (let index = 1; index <= 120; index += 1) {
      const target = e8RouteStart.clone().lerp(e8InteriorTarget, index / 120);
      const before = world.camera.position.clone();
      world.walkController.tryAxisMove(target.x - world.camera.position.x, 0);
      world.camera.position.y = world.walkController.groundY + 0.162;
      world.walkController.tryAxisMove(0, target.z - world.camera.position.z);
      world.camera.position.y = world.walkController.groundY + 0.162;
      if (before.distanceTo(world.camera.position) < 0.01) e8BlockedSteps += 1;
      e8MaximumTargetError = Math.max(
        e8MaximumTargetError,
        Math.hypot(world.camera.position.x - target.x, world.camera.position.z - target.z),
      );
    }
    const e8DirectEndGap = Math.hypot(
      world.camera.position.x - e8InteriorTarget.x,
      world.camera.position.z - e8InteriorTarget.z,
    );
    world.advanceTime(48);
    world.walkController.sampleGround(
      world.camera.position.x,
      world.camera.position.z,
      { trackSurface: true },
    );

    world.camera.position.set(e8RouteStart.x, e8StartGround + 0.162, e8RouteStart.z);
    world.walkController.groundY = e8StartGround;
    world.walkController.grounded = true;
    world.camera.lookAt(e8InteriorTarget.x, e8StartGround + 0.162, e8InteriorTarget.z);
    world.advanceTime(48);
    world.walkController.refreshNavigation();
    world.setWalkSpeedKilometresPerHour(120);
    world.setWalkIntent(0, 1, false);
    world.advanceTime(1_400);
    world.setWalkIntent(0, 0, false);
    world.advanceTime(48);
    world.walkController.sampleGround(
      world.camera.position.x,
      world.camera.position.z,
      { trackSurface: true },
    );
    const e8KeyboardEndLocal = e8Facility.worldToLocal(world.camera.position.clone());
    const e8VisibleExteriorObjects = [];
    e8Facility.traverse((object) => {
      if (object.userData.hideWhenRuntimeInteriorVisible === true && object.visible) {
        e8VisibleExteriorObjects.push(object.name);
      }
    });
    const arrivalHotelAudit = {
      splitBaseWingCount: e8Facility.children.filter((object) => object.userData.hotelEntranceOpening === true).length,
      obsoleteSolidBasePresent: Boolean(e8Facility.getObjectByName('ENTRY__E8__PALE_STONE_TWO_STOREY_BASE')),
      canopyCollisionDisabled: e8Canopy.userData.navObstacle !== true,
      approachProtected: e8DoorAccess.userData.approachProtected === true,
      approachDepth: e8DoorAccess.userData.approachDepth,
      directTraversal: {
        blockedSteps: e8BlockedSteps,
        maximumTargetError: e8MaximumTargetError,
        endGap: e8DirectEndGap,
      },
      highSpeedTraversal: {
        speedKilometresPerHour: world.walkController.getWalkSpeedKilometresPerHour(),
        endLocal: e8KeyboardEndLocal.toArray(),
        roomId: world.walkController.getSnapshot().roomId,
        grounded: world.walkController.getSnapshot().grounded,
      },
      interiorVisible: e8Interior.visible === true,
      visibleExteriorObjectsWhileInside: e8VisibleExteriorObjects,
    };
    world.setWalkSpeedKilometresPerHour(6.5);

    world.setMode('explore');
    world.advanceTime(120);

    const initialSnapshot = world.takeSnapshotPayload();
    const legacyWelcomeSnapshot = JSON.parse(JSON.stringify(initialSnapshot));
    legacyWelcomeSnapshot.masterplan.entryLogisticsLayoutRevision = 5;
    const legacyWelcomeRecord = legacyWelcomeSnapshot.objects
      .find((object) => object.id === 'entry-logistics-building-e2');
    legacyWelcomeRecord.state.position.x += 14;
    legacyWelcomeRecord.state.position.z -= 9;
    legacyWelcomeRecord.state.rotationY += 27;
    legacyWelcomeRecord.state.scale = 2.667;
    legacyWelcomeRecord.state.scale3D = { x: 4, y: 3, z: 1.8 };
    const legacyWelcomePoolRecord = legacyWelcomeSnapshot.objects
      .find((object) => object.id === 'entry-logistics-landscape-welcome-pool');
    legacyWelcomePoolRecord.state.position.x -= 11;
    legacyWelcomePoolRecord.state.position.z += 7;
    legacyWelcomePoolRecord.state.rotationY -= 19;
    legacyWelcomePoolRecord.state.scale3D = { x: 1.7, y: 1, z: 0.65 };
    const initialWelcomeState = world.getObjectState('entry-logistics-building-e2');
    const initialWelcomePoolState = world.getObjectState('entry-logistics-landscape-welcome-pool');
    const welcomeChildCount = e2Facility.children.length;
    world.loadProject(legacyWelcomeSnapshot);
    const migratedWelcome = world.objectGroups.get('entry-logistics-building-e2');
    const migratedWelcomeState = world.getObjectState('entry-logistics-building-e2');
    const migratedWelcomePoolState = world.getObjectState('entry-logistics-landscape-welcome-pool');
    const welcomeGeometryAudit = {
      initial: initialWelcomeState,
      migrated: migratedWelcomeState,
      initialPool: initialWelcomePoolState,
      migratedPool: migratedWelcomePoolState,
      baseScale: migratedWelcome?.userData.editorBaseScale,
      actualScale: migratedWelcome?.scale.toArray(),
      childCountBefore: welcomeChildCount,
      childCountAfter: migratedWelcome?.children.length ?? 0,
      requiredAssembly: [
        'ENTRY__E2__ELLIPTICAL_PALE_STONE_BASE',
        'ENTRY__E2__FLOATING_ELLIPTICAL_ROOF',
        'ENTRY__E2__WELCOME_DOOR_THRESHOLD',
        'ENTRY__E2__REAR_DOOR_THRESHOLD',
        'ENTRY__E2__WHITE_ENTRY_STAIRCASE',
        'ENTRY__E2__WHITE_REAR_EXIT_STAIRCASE',
        'ENTRY__E2__WHITE_DNA_COLUMN_1',
        'ENTRY__E2__CONTINUOUS_STAIR_NAVIGATION_SURFACE',
        'ENTRY__E2__PRECISE_PODIUM_COLLISION',
        'ENTRY__E2__PRECISE_ELLIPTICAL_WALL_COLLISION',
        'ENTRY__E2__WELCOME_REGISTRATION_INTERIOR',
      ].map((name) => ({ name, present: Boolean(migratedWelcome?.getObjectByName(name)) })),
    };
    world.loadProject(initialSnapshot);
    entry = world.scene.getObjectByName('DISTRICT__entry-commercial');
    logistics = world.scene.getObjectByName('DISTRICT__logistics');
    if (!entry || !logistics) throw new Error('Entry/Logistics districts were not reconstructed after Welcome migration');
    const editedId = 'entry-logistics-building-e5';
    const beforeEdit = world.getObjectState(editedId);
    const roadBefore = entry.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK');
    const networkVersionBefore = roadBefore?.uuid;
    world.saveUndoState();
    world.setObjectPosition(editedId, 'x', beforeEdit.position.x + 2.5);
    world.setObjectAxisScale(editedId, 'z', 1.45);
    const afterEdit = world.getObjectState(editedId);
    const networkVersionAfter = entry.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK')?.uuid;
    await world.saveProjectToLocalStorage();
    world.setObjectPosition(editedId, 'x', afterEdit.position.x + 1);
    world.setObjectAxisScale(editedId, 'z', 0.7);
    const reloaded = world.loadProjectFromLocalStorage();
    const afterReload = world.getObjectState(editedId);
    world.loadProject(initialSnapshot);
    const poolId = 'entry-logistics-landscape-welcome-pool';
    const poolBeforeEdit = world.getObjectState(poolId);
    const poolRoadNetworkBefore = world.objectGroups.get('entry-commercial')
      ?.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK')?.uuid;
    world.saveUndoState();
    world.setObjectPosition(poolId, 'x', poolBeforeEdit.position.x + 0.65);
    world.setObjectRotationY(poolId, poolBeforeEdit.rotationY + 11);
    world.setObjectAxisScale(poolId, 'x', 1.32);
    world.setObjectAxisScale(poolId, 'z', 1.18);
    const poolAfterEdit = world.getObjectState(poolId);
    const poolRoadNetworkAfter = world.objectGroups.get('entry-commercial')
      ?.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK')?.uuid;
    await world.saveProjectToLocalStorage();
    world.setObjectPosition(poolId, 'x', poolAfterEdit.position.x + 1);
    world.setObjectRotationY(poolId, poolAfterEdit.rotationY + 7);
    world.setObjectAxisScale(poolId, 'x', 0.6);
    world.setObjectAxisScale(poolId, 'z', 0.7);
    const poolReloaded = world.loadProjectFromLocalStorage();
    const poolAfterReload = world.getObjectState(poolId);
    const poolPersistence = {
      snapshotRecordPresent: initialSnapshot.objects.some((object) => object.id === poolId),
      beforeEdit: poolBeforeEdit,
      afterEdit: poolAfterEdit,
      afterReload: poolAfterReload,
      reloaded: poolReloaded,
      roadsUnaffected: poolRoadNetworkBefore === poolRoadNetworkAfter,
      featurePresentAfterReload: Boolean(world.objectGroups.get(poolId)
        ?.getObjectByName('ENTRY__WELCOME_POOL_HALF_ELLIPSE_ROOF')),
    };
    world.loadProject(initialSnapshot);
    const revisionFiveCitylineSnapshot = JSON.parse(JSON.stringify(initialSnapshot));
    const revisionFiveCitylineRecord = revisionFiveCitylineSnapshot.objects
      .find((object) => object.id === 'entry-logistics-building-e13');
    revisionFiveCitylineRecord.state.position.x += 8.25;
    revisionFiveCitylineRecord.state.position.z -= 5.75;
    revisionFiveCitylineRecord.state.rotationY += 13;
    revisionFiveCitylineRecord.state.scale = 1.04;
    revisionFiveCitylineRecord.state.scale3D = { x: 1.35, y: 1.04, z: 0.8 };
    const revisionFiveLoaded = world.loadProject(revisionFiveCitylineSnapshot);
    const preservedCityline = world.getObjectState('entry-logistics-building-e13');
    const preservedCitylineFacility = world.objectGroups.get('entry-logistics-building-e13');
    let preservedCitylineRoad;
    world.objectGroups.get('entry-commercial')
      ?.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK')
      ?.traverse((object) => {
        if (!preservedCitylineRoad
          && object.userData.entranceLinkedRoad === true
          && object.userData.routeId === 'e13-to-collector') preservedCitylineRoad = object;
      });
    const citylinePreservation = {
      loaded: revisionFiveLoaded,
      requested: revisionFiveCitylineRecord.state,
      preserved: preservedCityline,
      roadStartGap: Math.hypot(
        preservedCitylineRoad.userData.fromPoint[0] - preservedCitylineFacility.userData.roadRouteStart[0],
        preservedCitylineRoad.userData.fromPoint[2] - preservedCitylineFacility.userData.roadRouteStart[2],
      ),
    };
    world.loadProject(initialSnapshot);
    localStorage.removeItem('youtopy_saved_project');
    const afterRestore = world.getObjectState(editedId);
    entry = world.scene.getObjectByName('DISTRICT__entry-commercial');
    logistics = world.scene.getObjectByName('DISTRICT__logistics');
    if (!entry || !logistics) throw new Error('Entry/Logistics districts were not reconstructed after persistence checks');
    const editorAudit = {
      definitionCount: editableDefinitions.length,
      registration: editableRegistration,
      beforeEdit,
      afterEdit,
      afterReload,
      afterRestore,
      reloaded,
      roadRegenerated: networkVersionBefore !== networkVersionAfter,
      citylinePreservation,
      poolPersistence,
    };
    entry.updateMatrixWorld(true);
    logistics.updateMatrixWorld(true);
    world.walkController.refreshNavigation();
    const welcome = world.scene.getObjectByName('ENTRY__WELCOME_OVAL_ARRIVAL_PLAZA');
    const findRoad = (district, routeId) => {
      let match;
      district.getObjectByName('ENTRY_LOGISTICS__EDITABLE_ENTRANCE_ROAD_NETWORK')?.traverse((object) => {
        if (!match && object.userData.entranceLinkedRoad === true && object.userData.routeId === routeId) match = object;
      });
      return match;
    };
    const serviceRoad = findRoad(logistics, 'freight-spine');
    const arrivalRoad = findRoad(entry, 'arrival');
    if (!serviceRoad || !arrivalRoad) throw new Error('The entrance-linked primary road hierarchy is incomplete');
    const welcomePoint = welcome.getWorldPosition(world.camera.position.clone());
    const servicePoint = serviceRoad.getWorldPosition(world.camera.position.clone());
    const arrivalPoint = arrivalRoad.getWorldPosition(world.camera.position.clone());
    const arrivalGround = world.walkController.sampleGround(arrivalPoint.x, arrivalPoint.z);
    if (arrivalGround === null) throw new Error('Public arrival road has no WALK ground');
    world.setMode('walk');
    world.walkController.refreshNavigation();
    world.camera.position.set(arrivalPoint.x, arrivalGround + 0.162, arrivalPoint.z);
    world.walkController.groundY = arrivalGround;
    world.walkController.grounded = true;
    world.camera.lookAt(welcomePoint.x, arrivalGround + 0.162, welcomePoint.z);
    const walkStart = world.camera.position.clone();
    world.setWalkIntent(0, 1, false);
    world.advanceTime(1_200);
    world.setWalkIntent(0, 0);
    const walkEnd = world.camera.position.clone();
    const walkSnapshot = world.walkController.getSnapshot();
    world.setMode('explore');
    world.advanceTime(120);
    const state = JSON.parse(window.render_game_to_text());
    return {
      entry: entryAudit,
      logistics: logisticsAudit,
      editor: editorAudit,
      roads: { entry: entryRoadAudit, logistics: logisticsRoadAudit },
      arrivalGeometry: arrivalGeometryAudit,
      citylineRoad: citylineRoadAudit,
      bridge: bridgeAudit,
      tunnelWalk: tunnelWalkAudit,
      welcomeAccess: welcomeAccessAudit,
      welcomeDesign: welcomeDesignAudit,
      welcomeRoadEdge: welcomeRoadEdgeAudit,
      entryInteriors: entryInteriorAudit,
      showcaseGallery: showcaseGalleryAudit,
      ringwalkGallery: ringwalkGalleryAudit,
      streamedFrontWalls: streamedFrontWallAudit,
      arrivalHotel: arrivalHotelAudit,
      cafeTerrace: cafeTerraceAudit,
      fashionClubAccess: fashionClubAccessAudit,
      welcomeGeometry: welcomeGeometryAudit,
      layoutRevision: initialSnapshot.masterplan?.entryLogisticsLayoutRevision,
      missingObjects,
      obsoleteObjects,
      ground: {
        welcomePlaza: world.walkController.sampleGround(welcomePoint.x, welcomePoint.z),
        freightSpine: world.walkController.sampleGround(servicePoint.x, servicePoint.z),
        e1Tunnel: world.walkController.sampleGround(tunnelEye.x, tunnelEye.z),
      },
      walk: {
        moved: walkStart.distanceTo(walkEnd),
        grounded: walkSnapshot.grounded,
        surface: walkSnapshot.surface,
      },
      planning: state.planning,
      streaming: {
        residentDetailCount: state.streaming.residentDetailPackages.length,
        proxyPackageCount: state.streaming.proxyPackageCount,
      },
      textPrograms: {
        entry: state.entryDistrict,
        logistics: state.logisticsDistrict,
      },
    };
  });
  await writeFile(`${OUTPUT}/report.json`, JSON.stringify({ audit, errors }, null, 2));

  if (audit.entry.program?.realizedBuildingCount !== 13
    || audit.entry.program?.interiorsAuthored !== 12
    || audit.entry.codes.length !== 13) {
    throw new Error(`Entry program is incomplete: ${JSON.stringify(audit.entry)}`);
  }
  if (audit.logistics.program?.realizedBuildingCount !== 7
    || audit.logistics.program?.interiorsAuthored !== 7
    || audit.logistics.codes.length !== 7) {
    throw new Error(`Logistics program is incomplete: ${JSON.stringify(audit.logistics)}`);
  }
  if (audit.editor.definitionCount !== 20
    || audit.editor.registration.some((record) => !record.registered
      || !record.editable
      || record.mistaggedDescendants !== 0
      || (!record.canEnterInterior || !record.walkAccessible)
      || (record.code !== 'E1' && !record.authoredInterior))) {
    throw new Error(`Individual building registration failed: ${JSON.stringify(audit.editor.registration, null, 2)}`);
  }
  if (audit.editor.registration.some((record) => !record.scale3D
    || Math.abs(record.scale3D.x - 1) > 0.001
    || Math.abs(record.scale3D.y - 1) > 0.001
    || Math.abs(record.scale3D.z - 1) > 0.001)) {
    throw new Error(`Relative axis-scale baselines are incorrect: ${JSON.stringify(audit.editor.registration, null, 2)}`);
  }
  if (!audit.editor.roadRegenerated
    || !audit.editor.reloaded
    || Math.abs(audit.editor.afterEdit.position.x - audit.editor.afterReload.position.x) > 0.001
    || Math.abs(audit.editor.afterReload.scale3D.z - 1.45) > 0.001
    || Math.abs(audit.editor.afterRestore.position.x - audit.editor.beforeEdit.position.x) > 0.001
    || Math.abs(audit.editor.afterRestore.scale3D.z - 1) > 0.001
    || !audit.editor.citylinePreservation.loaded
    || Math.abs(
      audit.editor.citylinePreservation.preserved.position.x
      - audit.editor.citylinePreservation.requested.position.x
    ) > 0.001
    || Math.abs(
      audit.editor.citylinePreservation.preserved.position.z
      - audit.editor.citylinePreservation.requested.position.z
    ) > 0.001
    || Math.abs(
      audit.editor.citylinePreservation.preserved.rotationY
      - audit.editor.citylinePreservation.requested.rotationY
    ) > 0.001
    || Math.abs(audit.editor.citylinePreservation.preserved.scale3D.x - 1.35) > 0.001
    || Math.abs(audit.editor.citylinePreservation.preserved.scale3D.y - 1.04) > 0.001
    || Math.abs(audit.editor.citylinePreservation.preserved.scale3D.z - 0.8) > 0.001
    || audit.editor.citylinePreservation.roadStartGap > 0.001) {
    throw new Error(`Move/elongate persistence failed: ${JSON.stringify(audit.editor, null, 2)}`);
  }
  if (!audit.editor.poolPersistence.snapshotRecordPresent
    || !audit.editor.poolPersistence.reloaded
    || !audit.editor.poolPersistence.roadsUnaffected
    || !audit.editor.poolPersistence.featurePresentAfterReload
    || Math.abs(
      audit.editor.poolPersistence.afterEdit.position.x
      - audit.editor.poolPersistence.afterReload.position.x
    ) > 0.001
    || Math.abs(
      audit.editor.poolPersistence.afterEdit.rotationY
      - audit.editor.poolPersistence.afterReload.rotationY
    ) > 0.001
    || Math.abs(audit.editor.poolPersistence.afterReload.scale3D.x - 1.32) > 0.001
    || Math.abs(audit.editor.poolPersistence.afterReload.scale3D.z - 1.18) > 0.001) {
    throw new Error(`Editable pool persistence failed: ${JSON.stringify(audit.editor.poolPersistence, null, 2)}`);
  }
  const expectedEntryCodes = Array.from({ length: 13 }, (_, index) => `E${index + 1}`).sort();
  const expectedLogisticsCodes = Array.from({ length: 7 }, (_, index) => `L${index + 1}`).sort();
  if (!audit.roads.entry.dynamic || !audit.roads.entry.entranceLinked || !audit.roads.entry.doorToDoor
    || audit.roads.entry.routeCount !== 5 || audit.roads.entry.segmentCount < 105
    || !audit.roads.entry.uniformContinuousRibbons
    || audit.roads.entry.continuousSurfaceCount !== 34
    || audit.roads.entry.continuousSurfaces.length !== 34
    || audit.roads.entry.districtTransitionCount !== 2
    || audit.roads.entry.logisticsPlatformCount !== 0
    || audit.roads.entry.buildingThresholdCount !== 13 || audit.roads.entry.entranceApronCount !== 13
    || JSON.stringify(audit.roads.entry.thresholdCodes) !== JSON.stringify(expectedEntryCodes)
    || audit.roads.entry.directBuildingLinks.length
    || !audit.roads.logistics.dynamic || !audit.roads.logistics.entranceLinked || !audit.roads.logistics.doorToDoor
    || audit.roads.logistics.routeCount !== 2 || audit.roads.logistics.segmentCount < 200
    || audit.roads.logistics.primaryConnectorCount !== 7
    || audit.roads.logistics.redundantRouteCount !== 0
    || !audit.roads.logistics.uniformContinuousRibbons
    || audit.roads.logistics.continuousSurfaceCount !== 30
    || audit.roads.logistics.continuousSurfaces.length !== 30
    || audit.roads.logistics.districtTransitionCount !== 2
    || audit.roads.logistics.logisticsPlatformCount !== 19
    || audit.roads.logistics.buildingThresholdCount !== 7 || audit.roads.logistics.entranceApronCount !== 19
    || JSON.stringify(audit.roads.logistics.thresholdCodes) !== JSON.stringify(expectedLogisticsCodes)
    || audit.roads.logistics.directBuildingLinks.length) {
    throw new Error(`Road hierarchy failed: ${JSON.stringify(audit.roads, null, 2)}`);
  }
  const roadMarkings = [...audit.roads.entry.roadMarkings, ...audit.roads.logistics.roadMarkings];
  const expectedThreeLaneRoutes = [
    'arrival',
    'e1-tunnel-through-road',
  ];
  const markedRoutes = Array.from(new Set(audit.roads.entry.roadMarkings.map((marking) => marking.routeId))).sort();
  const markedRouteCounts = Object.fromEntries(expectedThreeLaneRoutes.map((routeId) => [
    routeId,
    audit.roads.entry.roadMarkings.filter((marking) => marking.routeId === routeId).length,
  ]));
  if (roadMarkings.length !== 4
    || audit.roads.logistics.roadMarkings.length !== 0
    || JSON.stringify(markedRoutes) !== JSON.stringify(expectedThreeLaneRoutes)
    || Object.values(markedRouteCounts).some((count) => count !== 2)
    || roadMarkings.some((marking) => marking.pattern !== 'three-lane-highway-divider'
      || marking.laneCount !== 3
      || ![1, 2].includes(marking.dividerIndex)
      || Math.abs(marking.lateralOffset) < 1
      || marking.color !== '646c70'
      || marking.dashCount < 1
      || Math.abs(marking.dashLengthMetres - 4.2) > 0.001
      || Math.abs(marking.gapLengthMetres - 2.6) > 0.001
      || !marking.occlusionSafeSurfaceDecal)) {
    throw new Error(`Three-lane Welcome highway markings failed: ${JSON.stringify({
      entry: audit.roads.entry.roadMarkings,
      logistics: audit.roads.logistics.roadMarkings,
      markedRoutes,
      markedRouteCounts,
    }, null, 2)}`);
  }
  const entrySurfaces = audit.roads.entry.continuousSurfaces;
  const entryTransitions = audit.roads.entry.continuousSurfaces
    .filter((surface) => surface.districtTransition);
  const logisticsPlatforms = audit.roads.logistics.continuousSurfaces
    .filter((surface) => surface.logisticsPlatform);
  const logisticsRoads = audit.roads.logistics.continuousSurfaces;
  const entryDoorConnectors = entrySurfaces.filter((surface) => surface.routeId.endsWith('-to-collector'));
  const logisticsDoorConnectors = logisticsRoads.filter((surface) => surface.routeId.endsWith('-to-corridor'));
  if (!entrySurfaces.length
    || entrySurfaces.some((surface) => surface.color !== 'f3f4f0')
    || JSON.stringify(audit.roads.entry.surfacePalette) !== JSON.stringify(['welcome white'])
    || entryTransitions.length !== 2
    || entryTransitions.some((surface) => surface.widthStart !== 3.6 || surface.widthEnd !== 1.55)
    || entryDoorConnectors.length !== 10
    || logisticsPlatforms.length !== 19
    || logisticsPlatforms.some((surface) => surface.color !== '646c70'
      || surface.widthStart < 2.7
      || surface.widthEnd !== surface.widthStart)
    || logisticsRoads.some((surface) => surface.color !== '646c70')
    || JSON.stringify(audit.roads.logistics.surfacePalette) !== JSON.stringify(['logistics grey'])
    || logisticsDoorConnectors.length !== 7
    || JSON.stringify(logisticsRoads
      .filter((surface) => !surface.logisticsPlatform && !surface.routeId.endsWith('-to-corridor'))
      .map((surface) => surface.routeId).sort()) !== JSON.stringify([
        'freight-spine',
        'logistics-delimiter-link-276',
        'logistics-delimiter-link-300',
        'secure-yard-collector',
      ])) {
    throw new Error(`Two-color palettes, live door connectors, tapered links, or Logistics hardstands failed: ${JSON.stringify({
      entrySurfaces,
      entryTransitions,
      entryDoorConnectors,
      logisticsPlatforms,
      logisticsRoads,
      logisticsDoorConnectors,
    }, null, 2)}`);
  }
  if (audit.citylineRoad.segmentCount < 20
    || audit.citylineRoad.firstEndpointType !== 'building-route-start'
    || audit.citylineRoad.firstBuilding !== 'E13'
    || audit.citylineRoad.routeStartGap > 0.001
    || audit.citylineRoad.doorwayTangentDot < 0.995
    || audit.citylineRoad.maximumTurnDegrees > 8
    || audit.citylineRoad.continuousSurface?.routeKind !== 'promenade'
    || audit.citylineRoad.continuousSurface?.color !== 'f3f4f0') {
    throw new Error(`Cityline live angled road failed: ${JSON.stringify(audit.citylineRoad, null, 2)}`);
  }
  if (audit.bridge.centrelineGapXZ > 0.01
    || audit.bridge.cityAxisDot < 0.999
    || audit.bridge.coastNormalDot < 0.9999
    || Math.abs(audit.bridge.landingRadiusXZ - 900) > 0.01
    || audit.bridge.alignmentMetadata !== 'shared exact centerline'
    || audit.bridge.referenceAlignment !== 'direct red-marked crossing'
    || audit.bridge.transitionProfile !== 'smoothstep-width-and-grade'
    || audit.bridge.transitionSegments < 20
    || Math.abs(audit.bridge.transitionTunnelWidth - 6.8) > 0.001
    || Math.abs(audit.bridge.transitionBridgeWidth - 5.1) > 0.001
    || audit.bridge.transitionTunnelTopGap > 0.001
    || audit.bridge.transitionBridgeTopGap > 0.001
    || audit.bridge.transitionGroundSamples.some((ground) => ground === null)
    || audit.bridge.transitionMaximumGroundStep > 0.11
    || audit.bridge.transitionGroundReversals !== 0
    || audit.bridge.tunnelSightlineBlockers.length
    || audit.bridge.tunnelLength < 23
    || audit.bridge.tunnelIslandPortalZ < 17
    || audit.bridge.longTunnelSidewallCount !== 2) {
    throw new Error(`Bridge/tunnel alignment or Cyber City sightline failed: ${JSON.stringify(audit.bridge, null, 2)}`);
  }
  if (audit.tunnelWalk.centrelineSampleCount < 140
    || audit.tunnelWalk.missingCentrelineGround !== 0
    || audit.tunnelWalk.blockedCentrelineSamples.length
    || audit.tunnelWalk.sidewalkNames.length !== 2
    || audit.tunnelWalk.sidewalkSampleCounts.some((count) => count < 90)
    || audit.tunnelWalk.missingSidewalkGround.some((count) => count !== 0)
    || audit.tunnelWalk.blockedSidewalkSamples.some((samples) => samples.length)
    || audit.tunnelWalk.maximumWalkTargetError > 0.02
    || audit.tunnelWalk.blockedWalkSteps !== 0
    || audit.tunnelWalk.completedLocalZ < 18.75
    || audit.tunnelWalk.vegetationBlockers.length) {
    throw new Error(`City-side tunnel WALK traversal failed: ${JSON.stringify(audit.tunnelWalk, null, 2)}`);
  }
  if (audit.welcomeAccess.visualDoorLeafCount !== 2
    || audit.welcomeAccess.rearVisualDoorLeafCount !== 2
    || audit.welcomeAccess.preciseWallBarrierCount !== 28
    || audit.welcomeAccess.doorwayGapWidth < 3
    || audit.welcomeAccess.redundantRoadMeshCount !== 0
    || audit.welcomeAccess.blockedWalkSteps > 1
    || audit.welcomeAccess.maximumWalkTargetError > 0.11
    || audit.welcomeAccess.maximumGround - audit.welcomeAccess.minimumGround < 0.3
    || audit.welcomeAccess.maximumGroundDrop > 0.002
    || Math.abs(audit.welcomeAccess.eyeHeightWorld - 0.162) > 0.0001
    || Math.abs(audit.welcomeAccess.endLocal.x) > 0.03
    || audit.welcomeAccess.endLocal.z > 0.05
    || !audit.welcomeAccess.interiorVisible
    || audit.welcomeAccess.walkAccess?.accessible !== true
    || audit.welcomeAccess.walkAccess?.exteriorOnly !== false
    || !Array.isArray(audit.welcomeAccess.rearThreshold)
    || !Array.isArray(audit.welcomeAccess.rearRouteStart)
    || JSON.stringify(audit.welcomeAccess.walkAccess?.accessibleSides) !== JSON.stringify(['front', 'rear'])) {
    throw new Error(`Welcome Hall door, interior, or pruned-road access failed: ${JSON.stringify(audit.welcomeAccess, null, 2)}`);
  }
  if (audit.welcomeDesign.stairCount !== 11
    || audit.welcomeDesign.staircaseMetadata?.walkableStaircase !== true
    || audit.welcomeDesign.staircaseMetadata?.worldRiserHeight > 0.038
    || !audit.welcomeDesign.continuousNavigationSurface
    || audit.welcomeDesign.rearStairCount !== 11
    || audit.welcomeDesign.rearStaircaseMetadata?.walkableStaircase !== true
    || audit.welcomeDesign.rearStaircaseMetadata?.exitSide !== 'rear'
    || audit.welcomeDesign.rearStaircaseMetadata?.worldRiserHeight > 0.038
    || !audit.welcomeDesign.rearContinuousNavigationSurface
    || audit.welcomeDesign.podiumCollisionSegmentCount < 60
    || !audit.welcomeDesign.preventsUnderPodiumAccess
    || audit.welcomeDesign.missingStepGround !== 0
    || audit.welcomeDesign.maximumStepGroundRise > 0.038
    || audit.welcomeDesign.dnaColumnCount !== 8
    || audit.welcomeDesign.dnaColumns.some((column) => !column.grounded
      || column.groundTouchY !== 0
      || column.strandCount !== 2
      || column.basePairCount !== 8
      || JSON.stringify(column.colors) !== JSON.stringify(['e2e1d6']))
    || audit.welcomeDesign.pool.localPosition?.[0] >= -8
    || audit.welcomeDesign.pool.side !== 'left'
    || !audit.welcomeDesign.pool.selectableRegistration.registered
    || audit.welcomeDesign.pool.selectableRegistration.category !== 'entry-logistics-landscape'
    || audit.welcomeDesign.pool.selectableRegistration.parentDistrictId !== 'entry-commercial'
    || !audit.welcomeDesign.pool.selectableRegistration.editable
    || audit.welcomeDesign.pool.selectableRegistration.selectableId !== 'entry-logistics-landscape-welcome-pool'
    || audit.welcomeDesign.pool.selectableRegistration.mistaggedDescendants !== 0
    || audit.welcomeDesign.pool.selectableRegistration.canEnterInterior
    || Math.abs((audit.welcomeDesign.pool.selectableRegistration.scale3D?.x ?? 0) - 1) > 0.001
    || Math.abs((audit.welcomeDesign.pool.selectableRegistration.scale3D?.y ?? 0) - 1) > 0.001
    || Math.abs((audit.welcomeDesign.pool.selectableRegistration.scale3D?.z ?? 0) - 1) > 0.001
    || !audit.welcomeDesign.pool.halfCovered
    || audit.welcomeDesign.pool.roofCoverageRatio !== 0.5
    || !audit.welcomeDesign.pool.roofPresent
    || Math.abs(audit.welcomeDesign.pool.roofThetaLength - Math.PI) > 0.001
    || audit.welcomeDesign.pool.roofSupportCount !== 4
    || !audit.welcomeDesign.pool.roofSupportsGrounded
    || !audit.welcomeDesign.pool.deckWalkable
    || !audit.welcomeDesign.pool.smallWaves
    || !audit.welcomeDesign.pool.physicalWaterMaterial
    || audit.welcomeDesign.pool.animationAdvance <= 0
    || audit.welcomeDesign.pool.animatedVertexCount < 200
    || Math.max(
      audit.welcomeDesign.pool.sizeWorld?.[0] ?? 0,
      audit.welcomeDesign.pool.sizeWorld?.[2] ?? 0,
    ) < 1.64
    || Math.min(
      audit.welcomeDesign.pool.sizeWorld?.[0] ?? 0,
      audit.welcomeDesign.pool.sizeWorld?.[2] ?? 0,
    ) < 1.35
    || audit.welcomeDesign.poolTableCount !== 3
    || audit.welcomeDesign.poolChairCount !== 9
    || audit.welcomeDesign.tableHumanScaleMetres.some((scale) => scale.tableHeight !== 0.82
      || scale.tableDiameter !== 1.2
      || scale.chairSeatHeight !== 0.49
      || scale.chairOverallHeight !== 1.08)
    || audit.welcomeDesign.tabletopSizes.some((size) => Math.max(...size) > 0.121)
    || audit.welcomeDesign.chairSizes.some((size) => Math.max(...size) > 0.11)) {
    throw new Error(`Welcome staircase, DNA columns, or pool terrace failed: ${JSON.stringify(audit.welcomeDesign, null, 2)}`);
  }
  if (audit.welcomeRoadEdge.shoulderGround === null
    || audit.welcomeRoadEdge.apronGround === null
    || audit.welcomeRoadEdge.rise > 0.038
    || audit.welcomeRoadEdge.blockedSteps !== 0
    || Math.abs(audit.welcomeRoadEdge.endOffset) > 0.02) {
    throw new Error(`Welcome road edge is not WALK-traversable: ${JSON.stringify(audit.welcomeRoadEdge, null, 2)}`);
  }
  if (audit.cafeTerrace.tableSetCount !== 6
    || audit.cafeTerrace.chairCount !== 24
    || audit.cafeTerrace.chairsPerTable.some((count) => count !== 4)
    || audit.cafeTerrace.umbrellaCount !== 3
    || audit.cafeTerrace.facilityMetadata.tableCount !== 6
    || audit.cafeTerrace.facilityMetadata.chairCount !== 24
    || !audit.cafeTerrace.facilityMetadata.humanScale
    || audit.cafeTerrace.facilityMetadata.centralAisleWidthMetres < 5
    || audit.cafeTerrace.facilityMetadata.perimeterPlanterCount !== 8
    || !audit.cafeTerrace.facilityMetadata.plantersNonBlocking
    || !audit.cafeTerrace.facilityMetadata.wordmarkClearOfDoor
    || audit.cafeTerrace.humanScaleMetres.some((scale) => scale.tableHeight !== 0.75
      || scale.tableDiameter !== 0.9
      || scale.chairCount !== 4
      || scale.chairSeatHeight !== 0.46
      || scale.chairOverallHeight !== 0.94
      || (scale.umbrellaHeight !== null && scale.umbrellaHeight !== 2.35)
      || (scale.umbrellaDiameter !== null && scale.umbrellaDiameter !== 2.5))
    || audit.cafeTerrace.tabletopSizes.some((size) => Math.max(...size) > 0.091)
    || audit.cafeTerrace.chairSizes.some((size) => Math.max(...size) > 0.095)
    || audit.cafeTerrace.umbrellaSizes.some((size) => Math.max(...size) > 0.251)
    || audit.cafeTerrace.tableSetPositions.some((position) => Math.abs(position[0]) < 3.5)
    || audit.cafeTerrace.planterCount !== 8
    || audit.cafeTerrace.herbClusterCount !== 24
    || audit.cafeTerrace.planterSizes.some((size) => Math.max(...size) > 0.116)
    || audit.cafeTerrace.herbSizes.some((size) => Math.max(...size) > 0.035)
    || audit.cafeTerrace.planterNavigationBlockers.length !== 0
    || audit.cafeTerrace.centralAisleBlockers.length !== 0
    || !audit.cafeTerrace.wordmark.clearOfDoor
    || audit.cafeTerrace.wordmark.facadeMount !== 'west of entrance'
    || audit.cafeTerrace.wordmark.rightEdge > audit.cafeTerrace.wordmark.doorwayWestEdge - 0.1
    || audit.cafeTerrace.collision.aggregateShells.length !== 3
    || audit.cafeTerrace.collision.aggregateShells.some((shell) => !shell.name
      || shell.obstacle
      || !shell.aggregateCollisionDisabled
      || shell.preciseCollisionGuide !== 'ENTRY__E4__PRECISE_INTERIOR_WALL_COLLISION')
    || audit.cafeTerrace.collision.preciseBarrierCount !== 10
    || audit.cafeTerrace.collision.doorwayGapWidth !== 2.4
    || !audit.cafeTerrace.collision.usesPreciseDoorwayCollision
    || audit.cafeTerrace.collision.aggregateObstacleCount !== 0
    || audit.cafeTerrace.fullDoorApproach.startGround === null
    || audit.cafeTerrace.fullDoorApproach.blockedSteps !== 0
    || audit.cafeTerrace.fullDoorApproach.maximumTargetError > 0.65
    || audit.cafeTerrace.fullDoorApproach.endGap > 0.11
    || !audit.cafeTerrace.fullDoorApproach.grounded
    || audit.cafeTerrace.fullDoorApproach.roomId !== 'entry-e4-cafe-pavilion') {
    throw new Error(`Clearline Cafe terrace furniture is not human-scale: ${JSON.stringify(audit.cafeTerrace, null, 2)}`);
  }
  if (audit.fashionClubAccess.aggregateShells.length !== 2
    || audit.fashionClubAccess.aggregateShells.some((shell) => !shell.name
      || shell.obstacle
      || !shell.aggregateCollisionDisabled
      || shell.preciseCollisionGuide !== 'ENTRY__E6__PRECISE_INTERIOR_WALL_COLLISION')
    || audit.fashionClubAccess.preciseBarrierCount !== 10
    || audit.fashionClubAccess.doorwayGapWidth !== 2.8
    || !audit.fashionClubAccess.usesPreciseDoorwayCollision
    || audit.fashionClubAccess.aggregateObstacleCount !== 0) {
    throw new Error(`Catwalk Fashion Runway Club collision is not doorway-precise: ${JSON.stringify(audit.fashionClubAccess, null, 2)}`);
  }
  if (audit.entryInteriors.length !== 12
    || audit.entryInteriors.some((interior) => !interior.accessible
      || !interior.exteriorOnly
      || !interior.authoredInterior
      || interior.runtimeInteriorCount !== 1
      || interior.startGround === null
      || interior.blockedSteps > 1
      || interior.maximumTargetError > 0.11
      || interior.doorwayEndGap > 0.11
      || (interior.code !== 'E2' && interior.visibleInteriors.length !== 1)
      || (interior.code !== 'E2' && !interior.roomId.startsWith('entry-')))
    || audit.entryInteriors
      .filter((interior) => interior.code !== 'E2')
      .some((interior) => interior.accessVolumeCount !== 2
        || interior.barrierCount < 8
        || interior.doorwayWidth < 2)) {
    throw new Error(`Welcome District WALK interiors failed: ${JSON.stringify(audit.entryInteriors, null, 2)}`);
  }
  const preciseExteriorCodes = new Set([
    'E3', 'E5', 'E7', 'E8', 'E9', 'E10', 'E11', 'E12', 'E13',
  ]);
  const preciseExteriorInteriors = audit.entryInteriors
    .filter((interior) => preciseExteriorCodes.has(interior.code));
  if (preciseExteriorInteriors.length !== preciseExteriorCodes.size
    || preciseExteriorInteriors.some((interior) =>
      interior.exteriorCollisionPolicy !== 'precise-doorway-barriers'
      || interior.preciseExteriorCollisionGuide
        !== `ENTRY__${interior.code}__PRECISE_INTERIOR_WALL_COLLISION`
      || interior.disabledAggregateExteriorObstacleCount < 1
      || interior.aggregateExteriorObstacleCount !== 0
      || interior.disabledAggregateObjectCount
        !== interior.disabledAggregateExteriorObstacleCount
      || !interior.disabledAggregateObjectsValid)) {
    throw new Error(`Remaining Entry exterior collision is not uniformly doorway-precise: ${JSON.stringify(preciseExteriorInteriors, null, 2)}`);
  }
  if (audit.showcaseGallery.channelName !== 'ENTRY__E10__C_SHAPED_WATER_CHANNEL'
    || audit.showcaseGallery.obsoleteChannelPresent
    || audit.showcaseGallery.entranceGapDegrees < 60
    || audit.showcaseGallery.entranceGapWidth < 7
    || !audit.showcaseGallery.clearOfPublicEntrance
    || audit.showcaseGallery.collisionSegmentCount < 48
    || audit.showcaseGallery.doorOverlapVertexCount !== 0
    || audit.showcaseGallery.obsoleteWhiteAislePresent
    || !audit.showcaseGallery.interiorVisible
    || !audit.showcaseGallery.shellHiddenWhileInside
    || audit.showcaseGallery.visibleExteriorObjectsWhileInside.length !== 0) {
    throw new Error(`E10 entrance channel or interior cleanup failed: ${JSON.stringify(audit.showcaseGallery, null, 2)}`);
  }
  if (!audit.ringwalkGallery.connectedInternalRoute
    || audit.ringwalkGallery.galleryZones?.length !== 3
    || audit.ringwalkGallery.internalDoorCount !== 2
    || audit.ringwalkGallery.partitionObjectCount !== 4
    || audit.ringwalkGallery.doorSignCount !== 4
    || audit.ringwalkGallery.internalDoorwayWidth < 2.6
    || audit.ringwalkGallery.collisionSegmentCount !== 8
    || audit.ringwalkGallery.blockedSteps !== 0
    || audit.ringwalkGallery.maximumTargetError > 0.11
    || audit.ringwalkGallery.endGap > 0.11
    || !audit.ringwalkGallery.interiorVisible
    || audit.ringwalkGallery.visibleExteriorObjectsWhileInside.length !== 0
    || !audit.ringwalkGallery.e10ShellRestoredAfterExit) {
    throw new Error(`E5 internal gallery route failed: ${JSON.stringify(audit.ringwalkGallery, null, 2)}`);
  }
  if (Object.values(audit.streamedFrontWalls).some((wall) => wall.frontWallObjectCount !== 5
    || !wall.westWallPresent
    || !wall.eastWallPresent
    || !wall.headerPresent
    || wall.jambCount !== 2
    || wall.doorwayWidth < 3)) {
    throw new Error(`E5/E10 streamed entrance wall failed: ${JSON.stringify(audit.streamedFrontWalls, null, 2)}`);
  }
  if (audit.arrivalHotel.splitBaseWingCount !== 2
    || audit.arrivalHotel.obsoleteSolidBasePresent
    || !audit.arrivalHotel.canopyCollisionDisabled
    || !audit.arrivalHotel.approachProtected
    || audit.arrivalHotel.approachDepth < 5
    || audit.arrivalHotel.directTraversal.blockedSteps !== 0
    || audit.arrivalHotel.directTraversal.maximumTargetError > 0.11
    || audit.arrivalHotel.directTraversal.endGap > 0.11
    || audit.arrivalHotel.highSpeedTraversal.speedKilometresPerHour !== 120
    || audit.arrivalHotel.highSpeedTraversal.endLocal[2] >= 4.82
    || audit.arrivalHotel.highSpeedTraversal.endLocal[2] <= -2.38
    || audit.arrivalHotel.highSpeedTraversal.roomId !== 'entry-e8-hotel-arrival-lobby'
    || !audit.arrivalHotel.highSpeedTraversal.grounded
    || !audit.arrivalHotel.interiorVisible
    || audit.arrivalHotel.visibleExteriorObjectsWhileInside.length !== 0) {
    throw new Error(`E8 Arrival Hotel entrance failed: ${JSON.stringify(audit.arrivalHotel, null, 2)}`);
  }
  if (Math.abs(audit.welcomeGeometry.migrated.position.x - audit.welcomeGeometry.initial.position.x) > 0.001
    || Math.abs(audit.welcomeGeometry.migrated.position.z - audit.welcomeGeometry.initial.position.z) > 0.001
    || Math.abs(audit.welcomeGeometry.migrated.rotationY - audit.welcomeGeometry.initial.rotationY) > 0.001
    || Math.abs(audit.welcomeGeometry.migrated.scale3D.x - 1) > 0.001
    || Math.abs(audit.welcomeGeometry.migrated.scale3D.y - 1) > 0.001
    || Math.abs(audit.welcomeGeometry.migrated.scale3D.z - 1) > 0.001
    || Math.abs(audit.welcomeGeometry.migratedPool.position.x - audit.welcomeGeometry.initialPool.position.x) > 0.001
    || Math.abs(audit.welcomeGeometry.migratedPool.position.z - audit.welcomeGeometry.initialPool.position.z) > 0.001
    || Math.abs(audit.welcomeGeometry.migratedPool.rotationY - audit.welcomeGeometry.initialPool.rotationY) > 0.001
    || Math.abs(audit.welcomeGeometry.migratedPool.scale3D.x - 1) > 0.001
    || Math.abs(audit.welcomeGeometry.migratedPool.scale3D.y - 1) > 0.001
    || Math.abs(audit.welcomeGeometry.migratedPool.scale3D.z - 1) > 0.001
    || JSON.stringify(audit.welcomeGeometry.actualScale) !== JSON.stringify(audit.welcomeGeometry.baseScale)
    || audit.welcomeGeometry.childCountAfter !== audit.welcomeGeometry.childCountBefore
    || audit.welcomeGeometry.requiredAssembly.some((part) => !part.present)) {
    throw new Error(`Welcome Hall geometry migration is incomplete: ${JSON.stringify(audit.welcomeGeometry, null, 2)}`);
  }
  if (audit.arrivalGeometry.segmentCount < 20
    || audit.arrivalGeometry.maximumTurnDegrees > 15
    || audit.arrivalGeometry.surfaceOffsets.length !== 1
    || Math.abs(audit.arrivalGeometry.surfaceOffsets[0]) > 0.001
    || !audit.arrivalGeometry.clearOfBuildingPodium
    || audit.arrivalGeometry.e2ApronCount < 16
    || Math.abs(audit.arrivalGeometry.e2ApronSurfaceOffset - 0.003) > 0.0001
    || audit.arrivalGeometry.welcomePlazaTopY >= audit.arrivalGeometry.e2ApronTopY
    || audit.arrivalGeometry.innerCollectorMinimumRadius < 317.9
    || audit.arrivalGeometry.tunnelJoinTurnDegrees > 0.05
    || audit.arrivalGeometry.entryBranchSegmentCount < 30
    || audit.arrivalGeometry.logisticsBranchSegmentCount < 30
    || Math.abs(audit.arrivalGeometry.entryBranchOriginGap - 1.8) > 0.01
    || Math.abs(audit.arrivalGeometry.logisticsBranchOriginGap - 1.8) > 0.01
    || audit.arrivalGeometry.entryBranchEndpointId !== 'welcome-entry-fan-clear'
    || audit.arrivalGeometry.logisticsBranchEndpointId !== 'welcome-logistics-fan-clear'
    || Math.abs(audit.arrivalGeometry.welcomeBuildingPosition.radius - 343) > 0.02
    || Math.abs(audit.arrivalGeometry.welcomeBuildingPosition.degrees - 303) > 0.02
    || audit.arrivalGeometry.welcomeDelimiterClearance < 17.8
    || Math.abs(audit.arrivalGeometry.welcomeLandscapePosition.radius - 343) > 0.02
    || Math.abs(audit.arrivalGeometry.welcomeLandscapePosition.degrees - 303) > 0.02
    || audit.arrivalGeometry.frontDoorRoad.segmentCount < 60
    || audit.arrivalGeometry.frontDoorRoad.maximumTurnDegrees > 20
    || audit.arrivalGeometry.frontDoorRoad.firstEndpointType !== 'street-junction'
    || Math.abs(audit.arrivalGeometry.frontDoorRoad.inboundArrivalConnectionGap - 0.72) > 0.001
    || Math.abs(audit.arrivalGeometry.frontDoorRoad.outboundArrivalConnectionGap - 0.72) > 0.001
    || Math.abs(audit.arrivalGeometry.frontDoorRoad.endpointGap - 1.44) > 0.001
    || audit.arrivalGeometry.frontDoorRoad.centralLoopShape !== 'teardrop'
    || !audit.arrivalGeometry.frontDoorRoad.centralLoopOneWay
    || audit.arrivalGeometry.frontDoorRoad.circularJunctionSurface
    || audit.arrivalGeometry.frontDoorRoad.hallRoadCrownClearance < 1.2
    || audit.arrivalGeometry.rearBoundaryRoad.present
    || audit.arrivalGeometry.parkingRearStairRoadPresent
    || audit.arrivalGeometry.welcomeHallJunctionLandscapeClearance < 22
    || audit.arrivalGeometry.welcomeLoopAccessPointCount !== 0
    || audit.arrivalGeometry.welcomeLoopArcCount !== 0
    || audit.arrivalGeometry.redundantWelcomeRoadMeshCount !== 0
    || audit.arrivalGeometry.obsoleteWelcomeJunctionObjects.length !== 0
    || JSON.stringify(
      audit.arrivalGeometry.welcomeForkSurfaceElevations.map((route) => route.surfaceOffset),
    ) !== JSON.stringify([0, 0.001, 0.004, 0.003])
    || JSON.stringify(
      audit.arrivalGeometry.welcomeForkSurfaceElevations.slice(1).map((route) => route.widthStart),
    ) !== JSON.stringify([2.4, 2.4, 2.4])
    || JSON.stringify(
      audit.arrivalGeometry.welcomeForkSurfaceElevations.slice(1).map((route) => route.laneCount),
    ) !== JSON.stringify([1, 1, 1])
    || audit.roads.entry.continuousSurfaces.some((surface) => !surface.terrainDepthBias
      || !surface.polygonOffset
      || surface.polygonOffsetFactor >= 0
      || surface.polygonOffsetUnits >= 0)
    || audit.arrivalGeometry.welcomeForkMedian
    || JSON.stringify(audit.arrivalGeometry.welcomeForkBranches) !== JSON.stringify(['Entry and Commercial', 'Logistics'])
    || audit.arrivalGeometry.securityPanelCount !== 0
    || audit.arrivalGeometry.acousticBermCount !== 0) {
    throw new Error(`Entry arrival geometry failed: ${JSON.stringify(audit.arrivalGeometry, null, 2)}`);
  }
  if (audit.layoutRevision !== 10) throw new Error(`Entry/Logistics layout revision was not persisted: ${audit.layoutRevision}`);
  if (audit.entry.boundaryViolations.length || audit.logistics.boundaryViolations.length) {
    throw new Error(`Red-line boundary violations: ${JSON.stringify({ entry: audit.entry.boundaryViolations, logistics: audit.logistics.boundaryViolations }, null, 2)}`);
  }
  if (audit.missingObjects.length) throw new Error(`Missing site systems: ${audit.missingObjects.join(', ')}`);
  if (audit.obsoleteObjects.length) throw new Error(`Obsolete site systems are still visible: ${audit.obsoleteObjects.join(', ')}`);
  if (audit.ground.welcomePlaza === null || audit.ground.freightSpine === null || audit.ground.e1Tunnel === null) {
    throw new Error(`Primary routes are not walkable: ${JSON.stringify(audit.ground)}`);
  }
  if (!audit.walk.grounded || audit.walk.moved < 0.12) {
    throw new Error(`Public arrival WALK traversal failed: ${JSON.stringify(audit.walk)}`);
  }
  if (audit.planning.cellViolations !== 0) throw new Error(`Masterplan cell violations: ${audit.planning.cellViolations}`);
  if (audit.streaming.residentDetailCount !== 41 || audit.streaming.proxyPackageCount !== 0) {
    throw new Error(`Explore streaming policy regressed: ${JSON.stringify(audit.streaming)}`);
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);

  const keyboardTunnelSetup = await page.evaluate(() => {
    const world = window.labIsland;
    const e1 = world.scene.getObjectByName('ENTRY__E1__BRIDGEHEAD_TUNNEL_AND_ISLAND_GATE');
    if (!e1) throw new Error('Cannot prepare the real-key tunnel traversal');
    world.setMode('walk');
    world.setWalkSpeedKilometresPerHour(120);
    world.walkController.refreshNavigation();
    e1.updateMatrixWorld(true);
    const start = e1.localToWorld(world.camera.position.clone().set(0, 0, -9));
    const target = e1.localToWorld(world.controls.target.clone().set(0, 0, 36));
    const ground = world.walkController.sampleGround(start.x, start.z, { spawnSearch: true });
    if (ground === null) throw new Error('Real-key tunnel traversal has no city-side ground');
    world.camera.position.set(start.x, ground + 0.162, start.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(target.x, ground + 0.162, target.z);
    world.advanceTime(120);
    const streaming = world.worldStreaming.getSnapshot();
    return {
      startLocal: e1.worldToLocal(world.camera.position.clone()).toArray(),
      logisticsDetailed: streaming.packages.find((pkg) => pkg.id === 'logistics')?.detailResident === true,
      visibleDistrictSilhouettes: world.worldStreaming.vistaRoot.children
        .filter((proxy) => proxy.visible && proxy.userData.streamingSilhouetteProfile === 'multi-mass-building-silhouette')
        .map((proxy) => ({
          name: proxy.name,
          massCount: proxy.userData.streamingSilhouetteMassCount ?? 0,
        })),
    };
  });
  await page.keyboard.down('w');
  await page.evaluate(() => window.labIsland.advanceTime(12_000));
  await page.keyboard.up('w');
  const keyboardTunnel = await page.evaluate((setup) => {
    const world = window.labIsland;
    const e1 = world.scene.getObjectByName('ENTRY__E1__BRIDGEHEAD_TUNNEL_AND_ISLAND_GATE');
    const endLocal = e1.worldToLocal(world.camera.position.clone()).toArray();
    world.setWalkSpeedKilometresPerHour(6.5);
    world.setMode('explore');
    return {
      ...setup,
      endLocal,
      walk: world.walkController.getSnapshot(),
    };
  }, keyboardTunnelSetup);
  audit.keyboardTunnel = keyboardTunnel;
  await writeFile(`${OUTPUT}/report.json`, JSON.stringify({ audit, errors }, null, 2));
  if (Math.abs(keyboardTunnel.startLocal[0]) > 0.01
    || keyboardTunnel.endLocal[2] < 30
    || Math.abs(keyboardTunnel.endLocal[0]) > 0.02
    || !keyboardTunnel.logisticsDetailed
    || keyboardTunnel.visibleDistrictSilhouettes.length < 1
    || keyboardTunnel.visibleDistrictSilhouettes.some((proxy) => proxy.massCount < 5)) {
    throw new Error(`Real W-key tunnel or WALK silhouette audit failed: ${JSON.stringify(keyboardTunnel, null, 2)}`);
  }

  await page.evaluate(() => {
    const world = window.labIsland;
    document.querySelector('[data-mode="edit"]')?.click();
    world.select('entry-logistics-building-e5', 'system');
    world.focus('entry-logistics-building-e5');
    world.advanceTime(1_600);
  });
  // focus() uses a real-time camera tween; wait for it to settle before
  // projecting the building centre for the direct canvas click.
  await page.waitForTimeout(1_250);
  const clickPoint = await page.evaluate(() => {
    const world = window.labIsland;
    const centre = world.selectionBounds.getCenter(world.camera.position.clone()).project(world.camera);
    const rect = world.renderer.domElement.getBoundingClientRect();
    world.clearSelection('system');
    return {
      x: rect.left + (centre.x + 1) * 0.5 * rect.width,
      y: rect.top + (1 - centre.y) * 0.5 * rect.height,
    };
  });
  await page.mouse.click(clickPoint.x, clickPoint.y);
  await page.waitForTimeout(120);
  const clickAudit = await page.evaluate(() => ({
    selectedId: window.labIsland.getSelectedDefinition()?.id,
    transformAttached: window.labIsland.transformControls.object?.userData.selectableId,
    atlasEntryCount: document.querySelectorAll('.district-item[data-id^="entry-logistics-building-"]').length,
    axisControlsVisible: !document.querySelector('#building-axis-scale')?.hidden,
  }));
  if (clickAudit.selectedId !== 'entry-logistics-building-e5'
    || clickAudit.transformAttached !== 'entry-logistics-building-e5'
    || clickAudit.atlasEntryCount !== 20
    || !clickAudit.axisControlsVisible) {
    throw new Error(`Direct scene click/editor UI failed: ${JSON.stringify(clickAudit)}`);
  }
  await page.fill('#scale-z', '1.35');
  await page.dispatchEvent('#scale-z', 'change');
  await page.waitForTimeout(120);
  const uiAxisScale = await page.evaluate(() => window.labIsland.getObjectState('entry-logistics-building-e5')?.scale3D?.z);
  if (!Number.isFinite(uiAxisScale) || Math.abs(uiAxisScale - 1.35) > 0.001) throw new Error(`Inspector elongation control failed: ${uiAxisScale}`);
  await page.click('#edit-studio-collapse');
  await page.screenshot({ path: `${OUTPUT}/editable-building-and-logical-roads.png` });
  await page.evaluate(() => window.labIsland.resetObject('entry-logistics-building-e5'));

  await page.evaluate(() => {
    const world = window.labIsland;
    world.select('entry-logistics-landscape-welcome-pool', 'system');
    world.focus('entry-logistics-landscape-welcome-pool');
    world.advanceTime(1_600);
  });
  await page.waitForTimeout(1_250);
  const poolUiAudit = await page.evaluate(() => ({
    selectedId: window.labIsland.getSelectedDefinition()?.id,
    selectedCategory: window.labIsland.getSelectedDefinition()?.category,
    transformAttached: window.labIsland.transformControls.object?.userData.selectableId,
    atlasEntryCount: document.querySelectorAll(
      '.district-item[data-id="entry-logistics-landscape-welcome-pool"]',
    ).length,
    axisControlsVisible: !document.querySelector('#building-axis-scale')?.hidden,
    enterInteriorDisabled: document.querySelector('#enter-interior')?.disabled,
  }));
  if (poolUiAudit.selectedId !== 'entry-logistics-landscape-welcome-pool'
    || poolUiAudit.selectedCategory !== 'entry-logistics-landscape'
    || poolUiAudit.transformAttached !== 'entry-logistics-landscape-welcome-pool'
    || poolUiAudit.atlasEntryCount !== 1
    || !poolUiAudit.axisControlsVisible
    || !poolUiAudit.enterInteriorDisabled) {
    throw new Error(`Editable pool Inspector registration failed: ${JSON.stringify(poolUiAudit)}`);
  }
  await page.fill('#scale-x', '1.24');
  await page.dispatchEvent('#scale-x', 'change');
  await page.fill('#scale-z', '1.12');
  await page.dispatchEvent('#scale-z', 'change');
  await page.waitForTimeout(120);
  const poolUiScale = await page.evaluate(() => (
    window.labIsland.getObjectState('entry-logistics-landscape-welcome-pool')?.scale3D
  ));
  if (Math.abs((poolUiScale?.x ?? 0) - 1.24) > 0.001
    || Math.abs((poolUiScale?.z ?? 0) - 1.12) > 0.001) {
    throw new Error(`Pool Inspector elongation controls failed: ${JSON.stringify(poolUiScale)}`);
  }
  await page.screenshot({ path: `${OUTPUT}/editable-half-covered-welcome-pool.png` });
  await page.evaluate(() => window.labIsland.resetObject('entry-logistics-landscape-welcome-pool'));

  const prepareView = async (focusName, localCamera, localTarget, environment) => {
    await page.evaluate(({ focusName, localCamera, localTarget, environment }) => {
      const world = window.labIsland;
      const focus = world.scene.getObjectByName(focusName);
      if (!focus) throw new Error(`Focus object missing: ${focusName}`);
      document.querySelector('[data-mode="explore"]')?.click();
      world.clearSelection('system');
      world.setLayer('labels', false);
      world.setTimeOfDay(environment.time);
      world.setWeather(environment.weather);
      world.cameraTween = null;
      focus.updateMatrixWorld(true);
      world.camera.position.copy(focus.localToWorld(world.camera.position.clone().fromArray(localCamera)));
      world.controls.target.copy(focus.localToWorld(world.controls.target.clone().fromArray(localTarget)));
      world.controls.update();
      document.querySelector('.atlas')?.setAttribute('style', 'display:none');
      document.querySelector('.topbar')?.setAttribute('style', 'display:none');
      document.querySelectorAll('#inspector-panel, #edit-workspace, #scene-card, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => {
        element.setAttribute('style', 'display:none');
      });
      world.advanceTime(1_200);
    }, { focusName, localCamera, localTarget, environment });
    await page.waitForTimeout(350);
  };

  await prepareView('DISTRICT__entry-commercial', [100, 112, 174], [-18, 0.8, -24], { time: 'noon', weather: 'clear' });
  await page.screenshot({ path: `${OUTPUT}/entry-logistics-red-line-overview.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const bridge = world.scene.getObjectByName('INFRASTRUCTURE__CYBER_CITY_BRIDGE');
    if (!bridge) throw new Error('Cannot prepare direct bridge plan view');
    world.setMode('explore');
    world.clearSelection('system');
    world.setLayer('labels', false);
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    const start = world.camera.position.clone().fromArray(bridge.userData.islandRampStart);
    const end = world.camera.position.clone().fromArray(bridge.userData.bridgeEnd);
    const centre = start.clone().lerp(end, 0.5);
    world.cameraTween = null;
    world.camera.position.set(centre.x + 0.1, 700, centre.z + 0.1);
    world.controls.target.set(centre.x, 1.62, centre.z);
    world.controls.update();
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#inspector-panel, #edit-workspace, #scene-card, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => {
      element.setAttribute('style', 'display:none');
    });
    world.advanceTime(1_200);
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUTPUT}/bridge-red-axis-plan.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const bridge = world.scene.getObjectByName('INFRASTRUCTURE__CYBER_CITY_BRIDGE');
    if (!bridge) throw new Error('Cannot prepare smooth bridge-to-tunnel transition view');
    world.setMode('explore');
    world.clearSelection('system');
    world.setLayer('labels', false);
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    const start = world.camera.position.clone().fromArray(bridge.userData.islandRampStart);
    const end = world.camera.position.clone().fromArray(bridge.userData.bridgeStart);
    const centre = start.clone().lerp(end, 0.38);
    world.cameraTween = null;
    world.camera.position.set(centre.x + 0.05, 48, centre.z + 0.05);
    world.controls.target.set(centre.x, 1.8, centre.z);
    world.controls.update();
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#inspector-panel, #edit-workspace, #scene-card, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => {
      element.setAttribute('style', 'display:none');
    });
    world.advanceTime(1_200);
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUTPUT}/bridge-tunnel-smooth-transition.png` });

  await prepareView('DISTRICT__entry-commercial', [0.1, 320, 0.1], [0, 0, 0], { time: 'noon', weather: 'clear' });
  await page.evaluate(() => {
    const world = window.labIsland;
    const entry = world.scene.getObjectByName('DISTRICT__entry-commercial');
    const positions = [];
    entry?.traverse((object) => {
      if (object.userData.exteriorProgram === true) positions.push(object.getWorldPosition(world.camera.position.clone()));
    });
    const minX = Math.min(...positions.map((point) => point.x));
    const maxX = Math.max(...positions.map((point) => point.x));
    const minZ = Math.min(...positions.map((point) => point.z));
    const maxZ = Math.max(...positions.map((point) => point.z));
    const centreX = (minX + maxX) * 0.5;
    const centreZ = (minZ + maxZ) * 0.5;
    world.camera.position.set(centreX + 0.1, 320, centreZ + 0.1);
    world.controls.target.set(centreX, 1.62, centreZ);
    world.controls.update();
    world.advanceTime(600);
  });
  await page.screenshot({ path: `${OUTPUT}/entry-door-to-door-plan.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const districts = [
      world.scene.getObjectByName('DISTRICT__entry-commercial'),
      world.scene.getObjectByName('DISTRICT__logistics'),
    ].filter(Boolean);
    const positions = [];
    districts.forEach((district) => {
      district.traverse((object) => {
        if (object.userData.exteriorProgram === true) {
          positions.push(object.getWorldPosition(world.camera.position.clone()));
        }
      });
    });
    if (!positions.length) throw new Error('Cannot frame the unified Entry/Logistics road system');
    world.setMode('explore');
    world.clearSelection('system');
    world.setLayer('labels', false);
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    const minX = Math.min(...positions.map((point) => point.x));
    const maxX = Math.max(...positions.map((point) => point.x));
    const minZ = Math.min(...positions.map((point) => point.z));
    const maxZ = Math.max(...positions.map((point) => point.z));
    const centreX = (minX + maxX) * 0.5;
    const centreZ = (minZ + maxZ) * 0.5;
    const span = Math.max(maxX - minX, maxZ - minZ);
    world.cameraTween = null;
    world.camera.position.set(centreX + 0.1, Math.max(230, span * 1.35), centreZ + 0.1);
    world.controls.target.set(centreX, 1.62, centreZ);
    world.controls.update();
    world.advanceTime(1_200);
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUTPUT}/entry-logistics-uniform-road-system.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const logistics = world.scene.getObjectByName('DISTRICT__logistics');
    if (!logistics) throw new Error('Cannot frame the grey Logistics road system');
    const positions = [];
    logistics.traverse((object) => {
      if (object.userData.exteriorProgram === true) {
        positions.push(object.getWorldPosition(world.camera.position.clone()));
      }
    });
    const minX = Math.min(...positions.map((point) => point.x));
    const maxX = Math.max(...positions.map((point) => point.x));
    const minZ = Math.min(...positions.map((point) => point.z));
    const maxZ = Math.max(...positions.map((point) => point.z));
    const centreX = (minX + maxX) * 0.5;
    const centreZ = (minZ + maxZ) * 0.5;
    const span = Math.max(maxX - minX, maxZ - minZ);
    world.cameraTween = null;
    world.camera.position.set(centreX + 0.1, Math.max(145, span * 1.45), centreZ + 0.1);
    world.controls.target.set(centreX, 1.62, centreZ);
    world.controls.update();
    world.advanceTime(900);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUTPUT}/logistics-grey-road-platforms-plan.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const e1 = world.scene.getObjectByName('ENTRY__E1__BRIDGEHEAD_TUNNEL_AND_ISLAND_GATE');
    const e2 = world.scene.getObjectByName('ENTRY__E2__WELCOME_AND_REGISTRATION_HALL');
    if (!e1 || !e2) throw new Error('Cannot prepare the E1-to-E2 arrival plan');
    const start = e1.getWorldPosition(world.camera.position.clone());
    const end = e2.getWorldPosition(world.controls.target.clone());
    const centre = start.clone().lerp(end, 0.5);
    world.cameraTween = null;
    world.camera.position.set(centre.x + 0.1, 96, centre.z + 0.1);
    world.controls.target.set(centre.x, 1.62, centre.z);
    world.controls.update();
    world.advanceTime(600);
  });
  await page.screenshot({ path: `${OUTPUT}/entry-arrival-smooth-tunnel-plan.png` });

  await prepareView(
    'ENTRY__E2__WELCOME_AND_REGISTRATION_HALL',
    [0.1, 100, 0.1],
    [0, 0, 0],
    { time: 'noon', weather: 'clear' },
  );
  await page.screenshot({ path: `${OUTPUT}/welcome-entry-logistics-bifurcation.png` });

  await prepareView(
    'ENTRY__E1__BRIDGEHEAD_TUNNEL_AND_ISLAND_GATE',
    [0, 62, 43],
    [0, 0, 28],
    { time: 'noon', weather: 'clear' },
  );
  await page.screenshot({ path: `${OUTPUT}/tunnel-exit-clear-continuous-curve.png` });

  await prepareView(
    'ENTRY__E2__WELCOME_AND_REGISTRATION_HALL',
    [0, 34, 31],
    [0, 0.4, 0],
    { time: 'noon', weather: 'clear' },
  );
  await page.screenshot({ path: `${OUTPUT}/registration-hall-staged-junction-plan.png` });

  await prepareView(
    'ENTRY__E2__WELCOME_AND_REGISTRATION_HALL',
    [10, 22, -28],
    [0, 0.8, -4],
    { time: 'noon', weather: 'clear' },
  );
  await page.screenshot({ path: `${OUTPUT}/registration-hall-rear-door-to-delimiter-road.png` });

  const welcomeKeyboardSetup = await page.evaluate(() => {
    const world = window.labIsland;
    const e2 = world.scene.getObjectByName('ENTRY__E2__WELCOME_AND_REGISTRATION_HALL');
    if (!e2) throw new Error('Cannot prepare the real-key Welcome Hall traversal');
    world.setMode('walk');
    world.setWalkSpeedKilometresPerHour(30);
    world.walkController.refreshNavigation();
    e2.updateMatrixWorld(true);
    const start = e2.localToWorld(world.camera.position.clone().set(0, 0.008, 7.7));
    const target = e2.localToWorld(world.controls.target.clone().set(0, 0.008, -1.2));
    const ground = world.walkController.sampleGround(start.x, start.z, { spawnSearch: true });
    if (ground === null) throw new Error('Welcome Hall traversal has no entrance ground');
    world.camera.position.set(start.x, ground + 0.162, start.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(target.x, ground + 0.162, target.z);
    world.advanceTime(120);
    return {
      startLocal: e2.worldToLocal(world.camera.position.clone()).toArray(),
    };
  });
  await page.keyboard.down('w');
  await page.evaluate(() => window.labIsland.advanceTime(9_500));
  await page.keyboard.up('w');
  const welcomeKeyboard = await page.evaluate((setup) => {
    const world = window.labIsland;
    const e2 = world.scene.getObjectByName('ENTRY__E2__WELCOME_AND_REGISTRATION_HALL');
    const interior = e2.getObjectByName('ENTRY__E2__WELCOME_REGISTRATION_INTERIOR');
    world.advanceTime(120);
    return {
      ...setup,
      endLocal: e2.worldToLocal(world.camera.position.clone()).toArray(),
      interiorVisible: interior?.visible === true,
      grounded: world.walkController.getSnapshot().grounded,
    };
  }, welcomeKeyboardSetup);
  if (Math.abs(welcomeKeyboard.endLocal[0]) > 0.04
    || welcomeKeyboard.endLocal[2] > 0.8
    || !welcomeKeyboard.interiorVisible
    || !welcomeKeyboard.grounded) {
    throw new Error(`Real W-key Welcome Hall entry failed: ${JSON.stringify(welcomeKeyboard, null, 2)}`);
  }
  audit.welcomeKeyboard = welcomeKeyboard;
  await writeFile(`${OUTPUT}/report.json`, JSON.stringify({ audit, errors }, null, 2));
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUTPUT}/walk-inside-welcome-registration-hall.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const e2 = world.scene.getObjectByName('ENTRY__E2__WELCOME_AND_REGISTRATION_HALL');
    if (!e2) throw new Error('Cannot prepare human-scale Welcome entrance view');
    world.setMode('explore');
    world.select('entry-logistics-building-e2', 'system');
    world.updateWorldStreaming(false, true);
    world.setMode('walk');
    world.updateWorldStreaming(false, true);
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.walkController.refreshNavigation();
    e2.updateMatrixWorld(true);
    const eye = e2.localToWorld(world.camera.position.clone().set(0, 0, 8.2));
    const target = e2.localToWorld(world.controls.target.clone().set(0, 0.8, 3.1));
    const sampledGround = world.walkController.sampleGround(eye.x, eye.z, { spawnSearch: true });
    // This is a presentation-only capture after all traversal assertions. A
    // distant package may still be finishing its detail residency transition;
    // keep the camera on the canonical planted datum in that one-frame case.
    const ground = sampledGround ?? 1.61;
    world.camera.position.set(eye.x, ground + 0.162, eye.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(target);
    document.querySelector('.atlas')?.setAttribute('style', 'display:none');
    document.querySelector('.topbar')?.setAttribute('style', 'display:none');
    document.querySelectorAll('#inspector-panel, #edit-workspace, #scene-card, .layerbar, .compass, .interaction-hint, .walk-hud').forEach((element) => {
      element.setAttribute('style', 'display:none');
    });
    world.advanceTime(1_200);
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUTPUT}/welcome-human-scale-entrance.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const poolFeature = world.scene.getObjectByName('ENTRY__WELCOME_HALF_COVERED_POOL_EDITABLE');
    if (!poolFeature) throw new Error('Cannot prepare human-scale Welcome pool view');
    world.setMode('walk');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.walkController.refreshNavigation();
    poolFeature.updateMatrixWorld(true);
    const eye = poolFeature.localToWorld(world.camera.position.clone().set(1.8, 0, 2.25));
    const target = poolFeature.localToWorld(world.controls.target.clone().set(0, 0.18, 0));
    const ground = world.walkController.sampleGround(eye.x, eye.z, { spawnSearch: true }) ?? 1.61;
    world.camera.position.set(eye.x, ground + 0.162, eye.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(target);
    world.advanceTime(1_200);
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUTPUT}/welcome-human-scale-pool-terrace.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    world.setWalkSpeedKilometresPerHour(6.5);
    world.setMode('explore');
    world.advanceTime(120);
  });

  await page.evaluate(() => {
    const world = window.labIsland;
    const angle = 322 * Math.PI / 180;
    const centre = world.camera.position.clone().set(Math.cos(angle) * 323, 1.62, Math.sin(angle) * 323);
    world.cameraTween = null;
    world.camera.position.set(centre.x + 0.1, 175, centre.z + 0.1);
    world.controls.target.copy(centre);
    world.controls.update();
    world.advanceTime(600);
  });
  await page.screenshot({ path: `${OUTPUT}/entry-collectors-inside-boundary.png` });

  await prepareView('ENTRY__E1__BRIDGEHEAD_TUNNEL_AND_ISLAND_GATE', [0, 4.2, -31], [0, 1.6, 16], { time: 'noon', weather: 'fog' });
  await page.screenshot({ path: `${OUTPUT}/bridge-gate-welcome-sequence.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const e1 = world.scene.getObjectByName('ENTRY__E1__BRIDGEHEAD_TUNNEL_AND_ISLAND_GATE');
    const bridge = world.scene.getObjectByName('INFRASTRUCTURE__CYBER_CITY_BRIDGE');
    if (!e1 || !bridge) throw new Error('Cannot prepare E1 tunnel WALK view');
    world.setMode('walk');
    world.setTimeOfDay('night');
    world.setWeather('clear');
    e1.updateMatrixWorld(true);
    const eye = e1.localToWorld(world.camera.position.clone().set(0, 0.36, 0));
    world.walkController.refreshNavigation();
    const ground = world.walkController.sampleGround(eye.x, eye.z);
    if (ground === null) throw new Error('E1 tunnel WALK view has no ground');
    world.camera.position.set(eye.x, ground + 0.162, eye.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(world.camera.position.clone().fromArray(bridge.userData.bridgeEnd));
    document.querySelector('.walk-hud')?.setAttribute('style', 'display:none');
    world.advanceTime(1_200);
    if (!world.worldStreaming.getSnapshot().residentDetailPackages.includes('entry-commercial')) {
      throw new Error('Entry detail package was not resident while standing inside E1');
    }
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUTPUT}/walk-inside-tunnel-city-sightline.png` });

  await page.evaluate(() => {
    const world = window.labIsland;
    const e1 = world.scene.getObjectByName('ENTRY__E1__BRIDGEHEAD_TUNNEL_AND_ISLAND_GATE');
    if (!e1) throw new Error('Cannot prepare city-side tunnel sidewalk WALK view');
    world.setMode('walk');
    world.setTimeOfDay('noon');
    world.setWeather('clear');
    world.walkController.refreshNavigation();
    e1.updateMatrixWorld(true);
    const eye = e1.localToWorld(world.camera.position.clone().set(0, 0.36, -4));
    const target = e1.localToWorld(world.controls.target.clone().set(0, 0.25, 16));
    const ground = world.walkController.sampleGround(eye.x, eye.z, { spawnSearch: true });
    if (ground === null) throw new Error('City-side tunnel sidewalk WALK view has no ground');
    world.camera.position.set(eye.x, ground + 0.162, eye.z);
    world.walkController.groundY = ground;
    world.walkController.grounded = true;
    world.camera.lookAt(target);
    document.querySelector('.walk-hud')?.setAttribute('style', 'display:none');
    world.advanceTime(1_200);
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUTPUT}/walk-city-through-tunnel-sidewalks.png` });

  await prepareView('ENTRY__E6__THE_CATWALK_FASHION_RUNWAY_CLUB', [18, 4.2, 24], [0, 1.5, 2], { time: 'night', weather: 'fog' });
  await page.screenshot({ path: `${OUTPUT}/entry-evening-quarter.png` });

  await prepareView('DISTRICT__logistics', [-42, 34, 58], [0, 1.5, -12], { time: 'noon', weather: 'clear' });
  await page.screenshot({ path: `${OUTPUT}/logistics-airfield-and-freight.png` });

  console.log(JSON.stringify({
    entryBuildings: audit.entry.codes,
    logisticsBuildings: audit.logistics.codes,
    entryBoundaryViolations: audit.entry.boundaryViolations,
    logisticsBoundaryViolations: audit.logistics.boundaryViolations,
    ground: audit.ground,
    walk: audit.walk,
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
