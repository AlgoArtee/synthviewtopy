import * as THREE from 'three';
import { createLiminetteRoom } from './liminetteRoom';
import { createStyledRoom } from './styledRoom';
import { getRoomDefinition, getRoomDisplay, ROOM_CATALOG, roomHref } from './roomCatalog';
import { createApartmentSky } from './apartmentSky';
import { createRoomRendering } from './roomRendering';
import './apartments.css';

const viewport = document.querySelector<HTMLElement>('#apartment-viewport')!;
const menu = document.querySelector<HTMLElement>('#room-menu')!;
const menuToggle = document.querySelector<HTMLButtonElement>('#room-menu-toggle')!;
const status = document.querySelector<HTMLElement>('#room-status')!;
const loading = document.querySelector<HTMLElement>('#room-loading')!;
const hint = document.querySelector<HTMLElement>('#room-hint')!;

async function startApartment() {
let dispose = () => {};
let cancelled = false;
try {
  const requestedId = location.pathname.endsWith('/room.html') ? new URLSearchParams(location.search).get('id') : 'liminette-student-room';
  const definition = getRoomDefinition(requestedId);
  if (!definition) {
    loading.replaceChildren();
    const message = document.createElement('p'); message.textContent = 'This room is not in the collection.';
    const back = document.createElement('a'); back.href = '/apartments.html'; back.textContent = 'Browse Vinculum Apartments';
    loading.append(message, back);
    window.render_game_to_text = () => JSON.stringify({page: 'Room not found', ready: false, error: 'unknown-room', roomId: requestedId});
    return;
  }
  const display = getRoomDisplay(definition);
  document.title = `${display.name} · Vinculum Apartments`;
  document.querySelector('.room-title h1')!.textContent = display.name;
  document.querySelector('.room-title > span')!.textContent = `LUX UMBRARUM / ${definition.number ? `Nº ${String(definition.number).padStart(3, '0')}` : 'THE ORIGINAL'}`;
  document.querySelector('#room-guide-title')!.textContent = display.name;
  const guideDescription = menu.querySelector('h2 + p');
  if (guideDescription) guideDescription.textContent = display.description;
  const pairing = document.createElement('p'); pairing.className = 'room-style-pairing'; pairing.textContent = `${definition.style} × Dark Academia`;
  document.querySelector('#room-guide-title')!.after(pairing);
  const neighboringRooms = document.createElement('nav'); neighboringRooms.className = 'room-neighbors'; neighboringRooms.setAttribute('aria-label', 'Other residences');
  const index = ROOM_CATALOG.findIndex(room => room.id === definition.id);
  for (const [offset, label] of [[-1, '← Previous room'], [1, 'Next room →']] as const) {
    const neighbor = ROOM_CATALOG[(index + offset + ROOM_CATALOG.length) % ROOM_CATALOG.length];
    const link = document.createElement('a'); link.href = roomHref(neighbor); link.textContent = label; link.title = getRoomDisplay(neighbor).name; neighboringRooms.append(link);
  }
  menu.append(neighboringRooms);
  loading.querySelector('p')!.textContent = `Opening ${display.name}…`;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  dispose = () => renderer.dispose();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', `${display.name}. Drag to look around; use W A S D or arrow keys to walk.`);
  viewport.append(canvas);

  const room = definition.id === 'liminette-student-room' ? createLiminetteRoom() : createStyledRoom(definition);
  const sky = createApartmentSky(); room.scene.add(sky.group);
  dispose = () => { sky.dispose(); room.dispose(); renderer.dispose(); };
  window.addEventListener('pagehide', event => {
    if (event.persisted || cancelled) return;
    cancelled = true;
    dispose();
  });
  await room.ready;
  if (cancelled) return;
  const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, .08, 450);
  camera.rotation.order = 'YXZ';
  const rendering = createRoomRendering(renderer, room.scene, camera);
  dispose = () => { renderer.setAnimationLoop(null); rendering.dispose(); sky.dispose(); room.dispose(); renderer.dispose(); };
  let yaw = 0;
  let pitch = 0;
  let elapsed = 0;
  let activeView = 'entrance';
  const keys = new Set<string>();
  const touches = new Map<number, {x: number; y: number}>();
  let lastPinchDistance = 0;
  let drag: {id: number; x: number; y: number} | null = null;
  const radius = .24;
  const direction = new THREE.Vector3();
  const candidate = new THREE.Vector3();
  const viewpointButtons: HTMLButtonElement[] = [];
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setMenu(open: boolean, restoreFocus = false) {
    menu.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
    keys.clear();
    drag = null;
    if (open) viewpointButtons[0]?.focus();
    else if (restoreFocus) menuToggle.focus();
  }

  function goTo(position: THREE.Vector3, target: THREE.Vector3, id: string, label: string) {
    camera.position.copy(position);
    camera.lookAt(target);
    yaw = camera.rotation.y;
    pitch = camera.rotation.x;
    activeView = id;
    keys.clear();
    camera.fov = 65;
    camera.updateProjectionMatrix();
    viewpointButtons.forEach(button => button.setAttribute('aria-current', String(button.dataset.viewpoint === id)));
    status.textContent = label;
  }

  function reset() {
    goTo(room.spawn, room.lookAt, 'entrance', 'Entrance view');
    setMenu(false);
    canvas.focus({preventScroll: true});
  }
  reset();

  for (const view of room.viewpoints) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.viewpoint = view.id;
    button.append(document.createTextNode(view.label));
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    button.append(arrow);
    button.setAttribute('aria-current', 'false');
    button.addEventListener('click', () => {
      goTo(view.position, view.target, view.id, view.label);
      setMenu(false);
      canvas.focus({preventScroll: true});
    });
    viewpointButtons.push(button);
    document.querySelector('#room-viewpoints')!.append(button);
  }

  menuToggle.addEventListener('click', () => setMenu(menu.hidden));
  document.querySelector('#room-reset')!.addEventListener('click', reset);
  document.addEventListener('pointerdown', event => {
    if (!menu.hidden && event.target instanceof Node && !menu.contains(event.target) && !menuToggle.contains(event.target)) setMenu(false);
  });

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      status.textContent = 'Fullscreen is unavailable in this browser.';
    }
  }
  document.querySelector('#room-fullscreen')!.addEventListener('click', () => void toggleFullscreen());

  const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') { setMenu(false, !menu.hidden); keys.clear(); return; }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code === 'KeyF' && !event.repeat) { event.preventDefault(); void toggleFullscreen(); return; }
    if (!menu.hidden || (event.target instanceof HTMLElement && event.target.closest('button, a, input, select, textarea'))) return;
    if (movementKeys.has(event.code)) { event.preventDefault(); keys.add(event.code); hint.classList.add('quiet'); }
  });
  window.addEventListener('keyup', event => keys.delete(event.code));
  window.addEventListener('blur', () => { keys.clear(); touches.clear(); drag = null; });
  document.addEventListener('visibilitychange', () => keys.clear());

  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    canvas.focus({preventScroll: true});
    canvas.setPointerCapture(event.pointerId);
    touches.set(event.pointerId, {x: event.clientX, y: event.clientY});
    drag = {id: event.pointerId, x: event.clientX, y: event.clientY};
    lastPinchDistance = 0;
    hint.classList.add('quiet');
  });
  canvas.addEventListener('pointermove', event => {
    if (!touches.has(event.pointerId)) return;
    touches.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastPinchDistance) { camera.fov = THREE.MathUtils.clamp(camera.fov - (distance - lastPinchDistance) * .12, 38, 82); camera.updateProjectionMatrix(); }
      lastPinchDistance = distance;
      drag = null;
      return;
    }
    if (!drag || drag.id !== event.pointerId) return;
    yaw -= (event.clientX - drag.x) * .003;
    pitch = THREE.MathUtils.clamp(pitch - (event.clientY - drag.y) * .003, -1.25, 1.25);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    drag.x = event.clientX;
    drag.y = event.clientY;
  });
  const stopDrag = (event: PointerEvent) => {
    touches.delete(event.pointerId);
    if (drag?.id === event.pointerId) drag = null;
    lastPinchDistance = 0;
    if (touches.size === 1) {
      const [id, point] = [...touches.entries()][0];
      drag = {id, ...point};
    }
  };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
  canvas.addEventListener('lostpointercapture', stopDrag);
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    camera.fov = THREE.MathUtils.clamp(camera.fov + event.deltaY * .035, 38, 82);
    camera.updateProjectionMatrix();
  }, {passive: false});

  const touchKeys: Record<string, string> = {forward: 'KeyW', left: 'KeyA', back: 'KeyS', right: 'KeyD'};
  document.querySelectorAll<HTMLButtonElement>('[data-walk]').forEach(button => {
    const key = touchKeys[button.dataset.walk!];
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      keys.add(key);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => keys.delete(key));
  });

  function canStand(position: THREE.Vector3) {
    const {minX, maxX, minZ, maxZ} = room.bounds;
    if (position.x < minX + radius || position.x > maxX - radius || position.z < minZ + radius || position.z > maxZ - radius) return false;
    for (const box of room.colliders) {
      if (box.max.y < .18 || box.min.y > 1.8) continue;
      const nearestX = THREE.MathUtils.clamp(position.x, box.min.x, box.max.x);
      const nearestZ = THREE.MathUtils.clamp(position.z, box.min.z, box.max.z);
      if ((nearestX - position.x) ** 2 + (nearestZ - position.z) ** 2 < radius ** 2) return false;
    }
    return true;
  }

  function update(dt: number) {
    elapsed += dt;
    if (keys.size && menu.hidden) {
      const forward = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
      const right = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
      direction.set(right * Math.cos(yaw) - forward * Math.sin(yaw), 0, -right * Math.sin(yaw) - forward * Math.cos(yaw));
      if (direction.lengthSq()) {
        direction.normalize().multiplyScalar(2.6 * dt);
        candidate.copy(camera.position); candidate.x += direction.x;
        if (canStand(candidate)) camera.position.x = candidate.x;
        candidate.copy(camera.position); candidate.z += direction.z;
        if (canStand(candidate)) camera.position.z = candidate.z;
        activeView = 'walking';
        viewpointButtons.forEach(button => button.setAttribute('aria-current', 'false'));
      }
    }
    room.update(prefersReducedMotion ? 0 : elapsed);
    sky.update(camera, prefersReducedMotion ? 0 : elapsed);
  }

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    rendering.resize(innerWidth, innerHeight);
  }
  window.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('resize', resize);

  window.render_game_to_text = () => JSON.stringify({
    page: display.name, scene: definition.id === 'liminette-student-room' ? 'liminette-apartment' : 'styled-apartment', ready: loading.hidden,
    roomId: definition.id, style: `${definition.style} × Dark Academia`, layout: definition.layout,
    roomSignature: room.scene.userData.apartment?.audit?.interior.geometry,
    exteriorSignature: room.scene.userData.apartment?.audit?.exterior.geometry,
    geometryAudit: room.scene.userData.apartment?.audit,
    design: room.scene.userData.apartment?.design,
    workstation: room.scene.userData.apartment?.workstation,
    celestial: sky.getSnapshot(camera),
    coordinateSystem: 'metres; Y up; north is negative Z; eye height 1.65 m',
    view: activeView, position: camera.position.toArray().map(value => +value.toFixed(3)),
    look: {yaw: +yaw.toFixed(3), pitch: +pitch.toFixed(3), fov: camera.fov},
    menuOpen: !menu.hidden, bounds: room.bounds, collisionCount: room.colliders.length,
    location: room.scene.userData.apartment?.location,
    outlook: room.scene.userData.apartment?.outlook,
    materials: 'Locally stored scanned PBR wood, leather, velvet, linen and plaster',
    viewpoints: room.viewpoints.map(view => ({id: view.id, label: view.label})),
    controls: 'Drag to look; WASD/arrows to walk; scroll/pinch to zoom; F fullscreen; Room guide for viewpoints',
    render: {calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, textures: renderer.info.memory.textures},
  });
  window.advanceTime = milliseconds => {
    const total = THREE.MathUtils.clamp(milliseconds / 1000, 0, 30);
    const steps = Math.max(1, Math.ceil(total * 60));
    for (let i = 0; i < steps; i++) update(total / steps);
    rendering.render();
  };

  let previous = performance.now();
  renderer.setAnimationLoop(now => {
    if (document.hidden) { previous = now; return; }
    const dt = Math.min((now - previous) / 1000, .05);
    previous = now;
    update(dt);
    rendering.render();
  });
  rendering.render();
  loading.hidden = true;

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    loading.replaceChildren();
    const message = document.createElement('p'); message.textContent = 'The room’s graphics were interrupted.';
    const reload = document.createElement('a'); reload.href = roomHref(definition); reload.textContent = `Reopen ${display.name}`;
    loading.append(message, reload); loading.hidden = false;
  });
  window.addEventListener('pagehide', event => {
    keys.clear();
  });
} catch (error) {
  dispose();
  viewport.replaceChildren();
  console.error('Unable to open Liminette’s apartment:', error);
  loading.replaceChildren();
  const message = document.createElement('p'); message.textContent = 'The room could not finish loading. Check that WebGL is enabled, then reopen the apartment.';
  const back = document.createElement('a'); back.href = '/apartments.html'; back.textContent = 'Back to Vinculum Apartments';
  loading.append(message, back);
}
}
void startApartment();
