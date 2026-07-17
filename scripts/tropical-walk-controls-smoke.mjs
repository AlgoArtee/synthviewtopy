import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const outputDirectory = process.env.TROPICAL_WALK_OUTPUT_DIRECTORY ?? 'output/tropical-walk-controls';
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE
    ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 1728, height: 900 } });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto('http://127.0.0.1:5178/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForSelector('.mode[data-mode="walk"]', { state: 'visible', timeout: 30_000 });
await page.waitForTimeout(900);
await page.click('.mode[data-mode="walk"]');
await page.waitForTimeout(150);

const audit = await page.evaluate(() => {
  const world = window.labIsland;
  const controller = world.walkController;
  const dome = world.scene.getObjectByName('BIOME__tropical-rainforest-dome');
  if (!dome) throw new Error('Tropical Rainforest Dome was unavailable');
  dome.updateMatrixWorld(true);

  const boundsOf = (object) => {
    object.geometry.computeBoundingBox();
    return object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld);
  };
  const floor = dome.getObjectByName('tropical-rainforest-dome__BIOME_FLOOR');
  const foundation = dome.getObjectByName('tropical-rainforest-dome__SOLID_FOUNDATION');
  if (!floor || !foundation) throw new Error('Tropical floor or foundation was unavailable');
  const floorBounds = boundsOf(floor);
  const foundationBounds = boundsOf(foundation);

  const walkwaySegments = [];
  const authoredBarrierMeshes = [];
  let authoredBarrierSegmentCount = 0;
  dome.traverse((child) => {
    if (child.name === 'TROPICAL__ELEVATED_CANOPY_WALK') walkwaySegments.push(child);
    if (child.userData.navBarrierSegments?.length) {
      authoredBarrierMeshes.push(child.name);
      authoredBarrierSegmentCount += child.userData.navBarrierSegments.length;
    }
  });
  if (walkwaySegments.length < 12) throw new Error('Canopy walkway was unavailable for collision testing');

  controller.refreshNavigation();
  const collisionSegment = walkwaySegments[Math.floor(walkwaySegments.length * 0.55)];
  collisionSegment.updateMatrixWorld(true);
  const segmentCenter = collisionSegment.getWorldPosition(world.camera.position.clone());
  const lateral = world.camera.position.clone().set(1, 0, 0)
    .applyQuaternion(collisionSegment.getWorldQuaternion(world.camera.quaternion.clone()))
    .setY(0)
    .normalize();
  const segmentGround = controller.sampleGround(segmentCenter.x, segmentCenter.z);
  if (segmentGround === null) throw new Error('Chosen canopy segment had no WALK ground');
  world.camera.position.set(segmentCenter.x, segmentGround + 0.162, segmentCenter.z);
  world.camera.lookAt(world.camera.position.clone().add(lateral));
  controller.groundY = segmentGround;
  controller.grounded = true;
  controller.setMoveIntent(0, 1, false);
  world.advanceTime(1600);
  controller.setMoveIntent(0, 0, false);
  const collisionEnd = world.camera.position.clone();
  const lateralTravelWorld = Math.abs(collisionEnd.clone().sub(segmentCenter).dot(lateral));

  const deck = dome.getObjectByName('TROPICAL__OBSERVATION_DECK');
  const deckTargets = walkwaySegments.slice(-8).map((segment) => segment.getWorldPosition(world.camera.position.clone()));
  if (deck) deckTargets.push(deck.getWorldPosition(world.camera.position.clone()));
  const deckApproachStart = walkwaySegments[walkwaySegments.length - 9].getWorldPosition(world.camera.position.clone());
  const deckApproachGround = controller.sampleGround(deckApproachStart.x, deckApproachStart.z);
  if (deckApproachGround === null) throw new Error('Observation-deck approach ground was unavailable');
  world.camera.position.set(deckApproachStart.x, deckApproachGround + 0.162, deckApproachStart.z);
  controller.groundY = deckApproachGround;
  controller.grounded = true;
  const deckTargetRemainingMetres = [];
  for (const target of deckTargets) {
    for (let step = 0; step < 42; step += 1) {
      const distance = Math.hypot(target.x - world.camera.position.x, target.z - world.camera.position.z);
      if (distance < 0.16) break;
      world.camera.lookAt(target.x, world.camera.position.y, target.z);
      controller.setMoveIntent(0, 1, true);
      world.advanceTime(80);
    }
    const remainingMetres = Number((Math.hypot(
      target.x - world.camera.position.x,
      target.z - world.camera.position.z,
    ) * 10).toFixed(3));
    deckTargetRemainingMetres.push(remainingMetres);
  }
  controller.setMoveIntent(0, 0, false);

  const jumpGround = controller.sampleGround(0, 44);
  if (jumpGround === null) throw new Error('Jump test ground was unavailable');
  const resetJump = () => {
    world.camera.position.set(0, jumpGround + 0.162, 44);
    world.camera.lookAt(0, jumpGround + 0.162, 43);
    controller.groundY = jumpGround;
    controller.grounded = true;
    controller.velocityY = 0;
    controller.isJumping = false;
    controller.jumpHeld = false;
    controller.jumpPeakHeight = 0;
    controller.setMoveIntent(0, 0, false);
  };

  resetJump();
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true }));
  world.advanceTime(1600);
  const tapJump = controller.getSnapshot();

  resetJump();
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
  world.advanceTime(520);
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true }));
  world.advanceTime(1400);
  const heldJump = controller.getSnapshot();

  const viewpoint = world.camera.position.clone().set(3.2, 0, 11.2).applyMatrix4(dome.matrixWorld);
  const target = world.camera.position.clone().set(0, 0, -5.5).applyMatrix4(dome.matrixWorld);
  const viewGround = controller.sampleGround(viewpoint.x, viewpoint.z);
  if (viewGround === null) throw new Error('Tropical WALK screenshot ground was unavailable');
  world.camera.position.set(viewpoint.x, viewGround + 0.162, viewpoint.z);
  target.y = viewGround + 0.045;
  world.camera.lookAt(target);
  controller.groundY = viewGround;
  controller.grounded = true;
  document.querySelector('.atlas')?.setAttribute('style', 'display:none');
  document.querySelector('.scene-card')?.setAttribute('style', 'display:none');
  document.querySelector('.layerbar')?.setAttribute('style', 'display:none');
  world.advanceTime(100);

  return {
    floorFoundationGapWorld: Number((floorBounds.min.y - foundationBounds.max.y).toFixed(6)),
    floorTopAboveFoundationTopWorld: Number((floorBounds.max.y - foundationBounds.max.y).toFixed(6)),
    floorDepthWrite: floor.material.depthWrite,
    authoredBarrierMeshCount: authoredBarrierMeshes.length,
    authoredBarrierSegmentCount,
    authoredBarrierMeshNames: [...new Set(authoredBarrierMeshes)].sort(),
    lateralTravelMetres: Number((lateralTravelWorld * 10).toFixed(3)),
    remainedOnWalkway: lateralTravelWorld < 0.09,
    deckTargetRemainingMetres,
    completedDeckTargets: deckTargetRemainingMetres.filter((remaining) => remaining < 2.2).length,
    tapJumpHeightMetres: tapJump.jumpHeightMetres,
    heldJumpHeightMetres: heldJump.jumpHeightMetres,
    jumpHeightRangeMetres: heldJump.jumpHeightRangeMetres,
    tapLanded: tapJump.grounded && tapJump.jumpState === 'grounded',
    heldLanded: heldJump.grounded && heldJump.jumpState === 'grounded',
  };
});

await page.waitForTimeout(250);
const expandedLayout = await page.evaluate(() => {
  const readout = document.querySelector('.walk-readout');
  const bounds = readout.getBoundingClientRect();
  return {
    viewportWidth: window.innerWidth,
    left: Math.round(bounds.left),
    right: Math.round(bounds.right),
    width: Math.round(bounds.width),
    rightInset: Math.round(window.innerWidth - bounds.right),
    collapsed: readout.classList.contains('collapsed'),
  };
});
await page.screenshot({ path: `${outputDirectory}/tropical-floor-and-hud-expanded.png` });

await page.click('#walk-hud-collapse');
await page.waitForTimeout(240);
const collapsedLayout = await page.evaluate(() => {
  const readout = document.querySelector('.walk-readout');
  const content = document.querySelector('#walk-readout-content');
  return {
    collapsed: readout.classList.contains('collapsed'),
    expandedAria: document.querySelector('#walk-hud-collapse').getAttribute('aria-expanded'),
    contentDisplay: getComputedStyle(content).display,
    width: Math.round(readout.getBoundingClientRect().width),
  };
});
await page.screenshot({ path: `${outputDirectory}/tropical-floor-and-hud-collapsed.png` });

await page.click('#walk-hud-collapse');
await page.waitForTimeout(80);
const reexpanded = await page.evaluate(() => ({
  collapsed: document.querySelector('.walk-readout').classList.contains('collapsed'),
  expandedAria: document.querySelector('#walk-hud-collapse').getAttribute('aria-expanded'),
}));

const result = { audit, expandedLayout, collapsedLayout, reexpanded, consoleErrors };
console.log(JSON.stringify(result, null, 2));

if (Math.abs(audit.floorFoundationGapWorld) > 0.0001) throw new Error('Tropical floor does not meet the foundation underside cleanly');
if (audit.floorTopAboveFoundationTopWorld < 0.0079) throw new Error('Tropical floor top is still coplanar with the foundation');
if (!audit.floorDepthWrite) throw new Error('Tropical floor does not write depth');
if (audit.authoredBarrierMeshCount < 6 || audit.authoredBarrierSegmentCount < 100) throw new Error('Guardrail collision barriers are incomplete');
if (!audit.remainedOnWalkway || audit.lateralTravelMetres > 0.9) throw new Error(`WALK crossed a canopy guardrail (${audit.lateralTravelMetres} m)`);
if (audit.completedDeckTargets !== 9) throw new Error(`Guardrail sliding blocked the observation-deck route (${audit.completedDeckTargets}/9 targets)`);
if (!audit.tapLanded || !audit.heldLanded) throw new Error('One of the variable jumps did not land');
if (audit.tapJumpHeightMetres < 0.48 || audit.tapJumpHeightMetres > 0.62) throw new Error(`Tap jump was ${audit.tapJumpHeightMetres} m`);
if (audit.heldJumpHeightMetres < 1.45 || audit.heldJumpHeightMetres > 1.65) throw new Error(`Held jump was ${audit.heldJumpHeightMetres} m`);
if (audit.heldJumpHeightMetres - audit.tapJumpHeightMetres < 0.85) throw new Error('Space duration does not materially change jump height');
if (JSON.stringify(audit.jumpHeightRangeMetres) !== JSON.stringify([0.55, 1.6])) throw new Error(`Jump range metadata was ${JSON.stringify(audit.jumpHeightRangeMetres)}`);
if (expandedLayout.rightInset < 15 || expandedLayout.rightInset > 30 || expandedLayout.left < expandedLayout.viewportWidth * 0.5) throw new Error('WALK HUD is not anchored to the lower-right');
if (!collapsedLayout.collapsed || collapsedLayout.expandedAria !== 'false' || collapsedLayout.contentDisplay !== 'none') throw new Error('WALK HUD did not collapse');
if (collapsedLayout.width > 32) throw new Error(`Collapsed WALK HUD remained ${collapsedLayout.width}px wide`);
if (reexpanded.collapsed || reexpanded.expandedAria !== 'true') throw new Error('WALK HUD did not expand again');
if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(' | ')}`);

await browser.close();
