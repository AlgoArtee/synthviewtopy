import * as THREE from 'three';
import { createLiminetteRoom } from './liminetteRoom';
import { createStyledRoom } from './styledRoom';
import { createOsCityApartment } from './osCityApartment';
import { applyCityCameraProjection } from './osCityCamera';
import { createOsCityAmbience } from './osCityAmbience';
import { createCitySoundControls } from './osCitySoundControls';
import { createCityMallControls } from './osCityMallControls';
import { createCityHologramControls } from './osCityHologramControls';
import { createCityTVControls } from './osCityTVControls';
import { createCityHolidayControls } from './osCityHolidayControls';
import { createCityRadioControls } from './osCityRadioControls';
import { createCommunityRoom, COMMUNITY_ROOM_ID } from './communityRoom';
import { createPoolCommons, POOL_COMMONS_ID } from './poolCommons';
import { getRoomDefinition, getRoomDisplay, ROOM_CATALOG, roomHref } from './roomCatalog';
import { createApartmentSky } from './apartmentSky';
import { createRoomRendering } from './roomRendering';
import './apartments.css';
import './northCity.css';

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
    const back = document.createElement('a'); back.href = '/apartments.html'; back.textContent = 'Browse Lux Umbrarum Student Spaces';
    loading.append(message, back);
    window.render_game_to_text = () => JSON.stringify({page: 'Room not found', ready: false, error: 'unknown-room', roomId: requestedId});
    return;
  }
  const isCity = definition.kind === 'city';
  let controlsCollapsed = false;
  let controlsToggle: HTMLButtonElement | undefined;
  const categoryName = isCity ? 'North City' : 'Lux Umbrarum Student Spaces';
  const display = getRoomDisplay(definition);
  if (isCity) {
    document.body.classList.add('north-city-room');
    const back = document.querySelector<HTMLAnchorElement>('.room-back')!;
    back.href = '/north-city.html'; back.setAttribute('aria-label', 'Back to North City');
    back.querySelector('span')!.textContent = 'North City';
    const backControls = document.createElement('div'); backControls.className = 'city-back-controls';
    back.before(backControls); backControls.append(back);
    controlsToggle = document.createElement('button'); controlsToggle.type = 'button'; controlsToggle.id = 'city-controls-toggle';
    controlsToggle.textContent = '⌃'; controlsToggle.title = 'Hide apartment controls (H)';
    controlsToggle.setAttribute('aria-label', 'Hide apartment controls'); controlsToggle.setAttribute('aria-expanded', 'true');
    controlsToggle.setAttribute('aria-controls', 'city-apartment-tag city-weather-panel city-window-panel room-menu-toggle room-menu');
    controlsToggle.setAttribute('aria-keyshortcuts', 'H');
    controlsToggle.addEventListener('click', () => setCityControlsCollapsed(!controlsCollapsed));
    backControls.append(controlsToggle);
    document.querySelector('.room-title')!.id = 'city-apartment-tag';
    menu.querySelector('.residence-eyebrow')!.textContent = 'NORTH CITY · PRIVATE RESIDENCE';
    loading.querySelector('.residence-seal')!.textContent = 'N';
    document.querySelector('meta[name="description"]')?.setAttribute('content', display.description);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#e0e5eb');
  }
  document.title = `${display.name} · ${categoryName}`;
  document.querySelector('.room-title h1')!.textContent = display.name;
  document.querySelector('.room-title > span')!.textContent = isCity ? 'NORTH CITY / PRIVATE RESIDENCE' : `LUX UMBRARUM / ${definition.kind === 'community' ? 'SHARED SPACES' : definition.number ? `Nº ${String(definition.number).padStart(3, '0')}` : 'THE ORIGINAL'}`;
  document.querySelector('#room-guide-title')!.textContent = display.name;
  const guideDescription = menu.querySelector('h2 + p');
  if (guideDescription) guideDescription.textContent = display.description;
  const pairing = document.createElement('p'); pairing.className = 'room-style-pairing'; pairing.textContent = isCity ? `North City · ${definition.style}` : definition.kind === 'community' ? `Lux Umbrarum · ${definition.style}` : `${definition.style} × Dark Academia`;
  document.querySelector('#room-guide-title')!.after(pairing);
  const collectionRooms = ROOM_CATALOG.filter(room => isCity ? room.kind === 'city' : room.kind !== 'city');
  const neighboringRooms = document.createElement('nav'); neighboringRooms.className = 'room-neighbors'; neighboringRooms.setAttribute('aria-label', isCity ? 'Other North City locations' : 'Other student spaces');
  const index = collectionRooms.findIndex(room => room.id === definition.id);
  for (const [offset, label] of [[-1, '← Previous room'], [1, 'Next room →']] as const) {
    const neighbor = collectionRooms[(index + offset + collectionRooms.length) % collectionRooms.length];
    const link = document.createElement('a'); link.href = roomHref(neighbor); link.textContent = label; link.title = getRoomDisplay(neighbor).name; neighboringRooms.append(link);
  }
  if (collectionRooms.length > 1) menu.append(neighboringRooms);
  loading.querySelector('p')!.textContent = `Opening ${display.name}…`;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  dispose = () => renderer.dispose();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = isCity ? .92 : definition.kind === 'community' ? .95 : 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = isCity ? THREE.VSMShadowMap : THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', `${display.name}. Drag to look around; use W A S D or arrow keys to walk.`);
  viewport.append(canvas);

  const room = definition.id === 'os-city-apartment' ? createOsCityApartment() : definition.id === 'liminette-student-room' ? createLiminetteRoom() : definition.id === COMMUNITY_ROOM_ID ? createCommunityRoom() : definition.id === POOL_COMMONS_ID ? createPoolCommons() : createStyledRoom(definition);
  const sky = isCity ? null : createApartmentSky(); if (sky) room.scene.add(sky.group);
  dispose = () => { sky?.dispose(); room.dispose(); renderer.dispose(); };
  window.addEventListener('pagehide', event => {
    if (event.persisted || cancelled) return;
    cancelled = true;
    dispose();
  });
  await room.ready;
  if (cancelled) return;
  const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, .08, isCity?700:450);
  camera.rotation.order = 'YXZ';
  const rendering = createRoomRendering(renderer, room.scene, camera);
  let refreshCitySound=()=>{};
  let refreshBalconyDoor=()=>{};
  const citySound=isCity&&room.windowFixture?createOsCityAmbience(()=>refreshCitySound(),String(room.environment?.getSnapshot().mode??'rain')):undefined;
  dispose = () => { renderer.setAnimationLoop(null); document.removeEventListener('visibilitychange', resetFrameClock); citySound?.dispose(); rendering.dispose(); sky?.dispose(); room.dispose(); renderer.dispose(); };
  let yaw = 0;
  let pitch = 0;
  let elapsed = 0;
  let lastFrameSeconds = 0, lastNavigationStepSeconds = 0;
  let activeView = 'entrance';
  const keys = new Set<string>();
  const touches = new Map<number, {x: number; y: number}>();
  let lastPinchDistance = 0;
  let drag: {id: number; x: number; y: number} | null = null;
  let radioClick: {id:number;x:number;y:number} | null = null;
  let radioPanel:ReturnType<typeof createCityRadioControls>|undefined;
  const radius = .24;
  const direction = new THREE.Vector3();
  const candidate = new THREE.Vector3();
  const viewpointButtons: HTMLButtonElement[] = [];
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');

  function updateCameraProjection() {
    if(isCity)applyCityCameraProjection(camera,yaw,pitch);
    else camera.updateProjectionMatrix();
  }

  function setMenu(open: boolean, restoreFocus = false) {
    menu.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
    keys.clear();
    drag = null;
    if (open) viewpointButtons[0]?.focus();
    else if (restoreFocus) menuToggle.focus();
  }

  function setCityControlsCollapsed(collapsed: boolean) {
    if (!isCity || !controlsToggle) return;
    controlsCollapsed = collapsed;
    setMenu(false);
    document.body.classList.toggle('city-controls-collapsed', collapsed);
    controlsToggle.textContent = collapsed ? '⌄' : '⌃';
    const label = collapsed ? 'Show apartment controls' : 'Hide apartment controls';
    controlsToggle.setAttribute('aria-expanded', String(!collapsed));
    controlsToggle.setAttribute('aria-label', label); controlsToggle.title = label + ' (H)';
    status.textContent = collapsed ? 'Apartment controls hidden. Press H or use the North City chevron to show them.' : 'Apartment controls shown.';
    canvas.focus({preventScroll: true});
  }

  function goTo(position: THREE.Vector3, target: THREE.Vector3, id: string, label: string) {
    camera.position.copy(position);
    camera.lookAt(target);
    yaw = camera.rotation.y;
    pitch = camera.rotation.x;
    activeView = id;
    room.navigation?.reset(camera.position);
    keys.clear();
    camera.fov = room.fieldOfView ?? 65;
    updateCameraProjection();
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
      if(citySound&&room.windowFixture){citySound.update(room.windowFixture.getSnapshot(),camera.position,yaw,room.doorFixture?.getSnapshot());citySound.prime();}
      setMenu(false);
      canvas.focus({preventScroll: true});
    });
    viewpointButtons.push(button);
    document.querySelector('#room-viewpoints')!.append(button);
  }

  const cityControlStack=document.createElement('div');cityControlStack.className='city-control-stack';
  if(room.environment||room.windowFixture)document.body.append(cityControlStack);
  if (room.environment) {
    const section = document.createElement('section'); section.id = 'city-weather-panel'; section.className = 'city-weather city-weather-panel'; section.setAttribute('aria-label', 'Time of day and weather controls');
    const timeSelect=document.createElement('select');timeSelect.id='city-time-select';
    if(room.environment.timeOptions&&room.environment.setTimeOfDay){
      const timeLabel=document.createElement('label');timeLabel.htmlFor=timeSelect.id;timeLabel.textContent='Time of day';
      for(const option of room.environment.timeOptions){const o=document.createElement('option');o.value=option.id;o.textContent=option.label;timeSelect.append(o);}
      timeSelect.value=String(room.environment.getSnapshot().timeOfDay);
      timeSelect.addEventListener('focus',()=>keys.clear());
      section.append(timeLabel,timeSelect);
    }
    const label = document.createElement('label'); label.htmlFor = 'city-weather-select'; label.textContent = 'Weather outside';
    const select = document.createElement('select'); select.id = 'city-weather-select';
    const standardOptions=document.createElement('optgroup');standardOptions.label=timeSelect.selectedOptions[0]?.textContent??'Weather';
    const academicOptions=document.createElement('optgroup');academicOptions.label='Dark Academia';
    for (const option of room.environment.weatherOptions) { const o = document.createElement('option'); o.value=option.id; o.textContent=option.label; (option.id.startsWith('academic-')?academicOptions:standardOptions).append(o); }
    select.append(standardOptions);
    if(academicOptions.childElementCount)select.append(academicOptions);
    select.value=String(room.environment.getSnapshot().mode);
    select.addEventListener('focus',()=>keys.clear());
    const announce=()=>{status.textContent=[timeSelect.selectedOptions[0]?.textContent,select.value.startsWith('academic-')?'Dark Academia':null,select.selectedOptions[0].textContent].filter(Boolean).join(' · ');};
    select.addEventListener('change',()=>{room.environment!.setWeather(select.value);citySound?.setWeather(select.value);rendering.refreshEnvironment();announce();});
    timeSelect.addEventListener('change',()=>{room.environment!.setTimeOfDay?.(timeSelect.value);standardOptions.label=timeSelect.selectedOptions[0].textContent??'Weather';rendering.refreshEnvironment();announce();});
    const note=document.createElement('p');note.textContent='Every weather is available at every time of day.';
    section.append(label,select,note);cityControlStack.append(section);
  }
  if(room.holidays){const control=createCityHolidayControls(room.holidays,()=>keys.clear());cityControlStack.append(control.element);const disposeRoom=dispose;dispose=()=>{control.dispose();disposeRoom();};}
  if(room.television)cityControlStack.append(createCityTVControls(room.television,()=>keys.clear()).element);
  if(room.radio){
    radioPanel=createCityRadioControls(room.radio.audio,()=>{setMenu(false);keys.clear();touches.clear();drag=null;radioClick=null;},()=>canvas.focus({preventScroll:true}));
    cityControlStack.append(radioPanel.button);
    const disposeRoom=dispose;dispose=()=>{radioPanel?.dispose();disposeRoom();};
    const row=document.createElement('div'),term=document.createElement('dt'),detail=document.createElement('dd');term.textContent='Desk radio';detail.textContent='Click or tap the stereo beside the PC desk to choose Halloween music and sounds.';row.append(term,detail);menu.querySelector('.room-instructions')!.append(row);
  }
  if(room.windowAppearance){
    const section=document.createElement('section');section.id='city-window-appearance-panel';section.className='city-window-panel city-window-appearance-panel';section.setAttribute('aria-label','City window appearance');
    const heading=document.createElement('h2');heading.textContent='City windows';section.append(heading);
    const options=[['shadowsPercent','city-window-shadows','Windows with moving shadows'],['illuminatedPercent','city-window-illuminated','Illuminated windows'],['tvPercent','city-window-tv','Windows with TV lights']] as const;
    for(const [key,id,text] of options){
      const label=document.createElement('label');label.htmlFor=id;label.textContent=text;
      const row=document.createElement('div');row.className='city-window-slider-row';
      const slider=document.createElement('input');slider.id=id;slider.type='range';slider.min='0';slider.max='100';slider.step='1';slider.value=String(room.windowAppearance.getSettings()[key]);
      const output=document.createElement('output');output.setAttribute('for',id);output.textContent=slider.value+'%';
      slider.setAttribute('aria-valuetext',slider.value+'%');slider.setAttribute('aria-describedby','city-window-appearance-note');
      slider.addEventListener('focus',()=>keys.clear());
      slider.addEventListener('input',()=>{room.windowAppearance!.setSettings({[key]:Number(slider.value)});output.textContent=slider.value+'%';slider.setAttribute('aria-valuetext',slider.value+'%');});
      row.append(slider,output);section.append(label,row);
    }
    const note=document.createElement('p');note.id='city-window-appearance-note';note.textContent='Illuminated windows are open / lit. Shadow and TV percentages apply to these rooms.';section.append(note);cityControlStack.append(section);
  }
  if(room.plazaHolograms)cityControlStack.append(createCityHologramControls(room.plazaHolograms,()=>keys.clear()));
  if(room.plazaStreams){
    const section=document.createElement('section');section.id='city-stream-panel';section.className='city-window-panel';section.setAttribute('aria-label','Plaza data streams');
    const label=document.createElement('label');label.htmlFor='city-stream-speed';label.textContent='Plaza & mall data stream speed';
    const row=document.createElement('div');row.className='city-window-slider-row';
    const slider=document.createElement('input');slider.id='city-stream-speed';slider.type='range';slider.min='0';slider.max='3';slider.step='.1';slider.value=String(room.plazaStreams.getSpeed());
    const output=document.createElement('output');output.setAttribute('for',slider.id);
    const refresh=()=>{output.textContent=Number(slider.value).toFixed(1)+'×';slider.setAttribute('aria-valuetext',Number(slider.value)===0?'Paused':output.textContent+' normal speed');};
    refresh();slider.addEventListener('focus',()=>keys.clear());slider.addEventListener('input',()=>{room.plazaStreams!.setSpeed(Number(slider.value));refresh();});
    row.append(slider,output);section.append(label,row);cityControlStack.append(section);
  }
  if(room.mallSigns)cityControlStack.append(createCityMallControls(room.mallSigns,()=>keys.clear()));
  if(room.windowFixture){
    const section=document.createElement('section');section.id='city-window-panel';section.className='city-window-panel';section.setAttribute('aria-label','Window, balcony door and city sound controls');
    const label=document.createElement('label');label.htmlFor='city-window-select';label.textContent='Left city window';
    const select=document.createElement('select');select.id='city-window-select';
    for(const option of room.windowFixture.options){const o=document.createElement('option');o.value=option.id;o.textContent=option.label;select.append(o);}
    select.value=String(room.windowFixture.getSnapshot().mode);
    select.addEventListener('focus',()=>keys.clear());select.addEventListener('change',()=>{room.windowFixture!.setMode(select.value);if(select.value!=='closed')citySound?.prime();status.textContent=select.selectedOptions[0].textContent;});
    const note=document.createElement('p');note.textContent='Open against the left wall or tilt the top inward.';
    section.append(label,select,note);
    if(room.doorFixture){
      const door=document.createElement('div');door.className='city-balcony-door-controls';
      const doorLabel=document.createElement('label');doorLabel.htmlFor='city-balcony-door-select';doorLabel.textContent='Balcony sliding door';
      const doorSelect=document.createElement('select');doorSelect.id='city-balcony-door-select';
      for(const option of room.doorFixture.options){const o=document.createElement('option');o.value=option.id;o.textContent=option.label;doorSelect.append(o);}
      doorSelect.value=String(room.doorFixture.getSnapshot().mode);
      doorSelect.addEventListener('focus',()=>keys.clear());
      doorSelect.addEventListener('change',()=>{room.doorFixture!.setMode(doorSelect.value);citySound?.prime();status.textContent='Balcony door: '+doorSelect.selectedOptions[0].textContent;});
      const doorNote=document.createElement('p');doorNote.id='city-balcony-door-status';doorNote.setAttribute('role','status');doorSelect.setAttribute('aria-describedby',doorNote.id);
      let lastDoorNote='';refreshBalconyDoor=()=>{const snapshot=room.doorFixture!.getSnapshot();const message=snapshot.obstructed?'Doorway occupied — sliding paused.':snapshot.transitioning?'Sliding…':snapshot.mode==='closed'?'Closed. Open the door to walk through.':snapshot.mode==='half'?'Half open. Walk through the gap on the left.':'Open. The balcony is accessible.';if(message!==lastDoorNote){lastDoorNote=message;doorNote.textContent=message;}};
      refreshBalconyDoor();door.append(doorLabel,doorSelect,doorNote);section.append(door);
    }
    if(citySound){const controls=createCitySoundControls(citySound,()=>keys.clear());section.append(controls.element);refreshCitySound=controls.refresh;}
    cityControlStack.append(section);
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
  if (room.navigation && !isCity) {
    canvas.setAttribute('aria-label', `${display.name}. Drag to look; WASD to move or swim; Space to jump or climb out at the ladder; hold C to dive.`);
    movementKeys.add('Space'); movementKeys.add('KeyC');
    hint.textContent = 'WASD move / swim · Space jump · C dive · Climb the brass steps to the board';
    const instructions = menu.querySelector('.room-instructions')!;
    for (const [label, description] of [['Jump / climb out', 'Space — use the pool ladder to leave the water'], ['Dive', 'Hold C'], ['Diving board', 'Walk up the brass steps']]) {
      const row = document.createElement('div'), term = document.createElement('dt'), detail = document.createElement('dd');
      term.textContent = label; detail.textContent = description; row.append(term, detail); instructions.append(row);
    }
    for (const [action, label] of [['jump', 'Jump'], ['dive', 'Dive']]) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.walk = action;
      button.textContent = label; button.setAttribute('aria-label', label); document.querySelector('.touch-walk')!.append(button);
    }
  }
  if (isCity && room.navigation) {
    movementKeys.add('Space');
    hint.textContent='WASD to walk | Space at the bed to climb | H to hide or show controls';
    canvas.setAttribute('aria-label', `${display.name}. Drag to look; WASD to walk; Space at the mattress edge to climb onto the bed.`);
    const row=document.createElement('div');const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent='Climb bed';dd.textContent='Space at the foot of the mattress. Walk off to step down.';row.append(dt,dd);menu.querySelector('.room-instructions')!.append(row);
    const button=document.createElement('button');button.type='button';button.dataset.walk='jump';button.textContent='Climb bed';button.setAttribute('aria-label','Climb onto the bed');document.querySelector('.touch-walk')!.append(button);
  }
  window.addEventListener('keydown', event => {
    if(radioPanel?.isOpen()){keys.clear();return;}
    if (event.key === 'Escape') { setMenu(false, !menu.hidden); keys.clear(); return; }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof HTMLElement && event.target.closest('button, a, input, select, textarea')) return;
    if (isCity && event.code === 'KeyH' && !event.repeat) { event.preventDefault(); setCityControlsCollapsed(!controlsCollapsed); return; }
    if (event.code === 'KeyF' && !event.repeat) { event.preventDefault(); void toggleFullscreen(); return; }
    if (!menu.hidden) return;
    if (movementKeys.has(event.code)) { event.preventDefault(); keys.add(event.code); if(!event.repeat)citySound?.prime(); hint.classList.add('quiet'); }
  });
  window.addEventListener('keyup', event => keys.delete(event.code));
  window.addEventListener('blur', () => { keys.clear(); touches.clear(); drag = null; radioClick=null; });
  document.addEventListener('visibilitychange', () => keys.clear());

  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    citySound?.prime();
    canvas.focus({preventScroll: true});
    canvas.setPointerCapture(event.pointerId);
    touches.set(event.pointerId, {x: event.clientX, y: event.clientY});
    radioClick=touches.size===1?{id:event.pointerId,x:event.clientX,y:event.clientY}:null;
    drag = {id: event.pointerId, x: event.clientX, y: event.clientY};
    lastPinchDistance = 0;
    hint.classList.add('quiet');
  });
  canvas.addEventListener('pointermove', event => {
    if (!touches.has(event.pointerId)) return;
    if(radioClick&&Math.hypot(event.clientX-radioClick.x,event.clientY-radioClick.y)>5)radioClick=null;
    touches.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastPinchDistance) { camera.fov = THREE.MathUtils.clamp(camera.fov - (distance - lastPinchDistance) * .12, 38, 82); updateCameraProjection(); }
      lastPinchDistance = distance;
      drag = null;
      return;
    }
    if (!drag || drag.id !== event.pointerId) return;
    yaw -= (event.clientX - drag.x) * .003;
    pitch = THREE.MathUtils.clamp(pitch - (event.clientY - drag.y) * .003, -1.25, 1.25);
    if(isCity)updateCameraProjection();else camera.rotation.set(pitch, yaw, 0, 'YXZ');
    drag.x = event.clientX;
    drag.y = event.clientY;
  });
  const stopDrag = (event: PointerEvent) => {
    if(event.type==='pointerup'&&radioClick?.id===event.pointerId&&room.radio&&radioPanel){
      const rect=canvas.getBoundingClientRect(),pointer=new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
      const ray=new THREE.Raycaster();ray.far=8;camera.updateMatrixWorld();ray.setFromCamera(pointer,camera);
      const interior=room.radio.group.parent!;interior.updateWorldMatrix(true,true);
      // Respect opaque room geometry so the stereo cannot be selected through a wall.
      const hit=ray.intersectObject(interior,true).find(hit=>{
        let object:THREE.Object3D|null=hit.object;while(object){if(!object.visible)return false;object=object.parent;}
        const material=(hit.object as THREE.Mesh).material;
        return !material|| (Array.isArray(material)?material:[material]).some(m=>m.visible&&(!m.transparent||m.opacity>.5));
      });
      let object:THREE.Object3D|null=hit?.object??null;
      while(object&&object!==room.radio.pickRoot)object=object.parent;
      if(object)radioPanel.open();
    }
    radioClick=null;
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
    updateCameraProjection();
  }, {passive: false});

  const touchKeys: Record<string, string> = {forward: 'KeyW', left: 'KeyA', back: 'KeyS', right: 'KeyD', jump: 'Space', dive: 'KeyC'};
  document.querySelectorAll<HTMLButtonElement>('[data-walk]').forEach(button => {
    const key = touchKeys[button.dataset.walk!];
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      citySound?.prime();
      button.setPointerCapture(event.pointerId);
      keys.add(key);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => keys.delete(key));
  });

  function canStand(position: THREE.Vector3) {
    const {minX, maxX, minZ, maxZ} = room.bounds;
    if (position.x < minX + radius || position.x > maxX - radius || position.z < minZ + radius || position.z > maxZ - radius) return false;
    if (room.canWalk && !room.canWalk(position.x, position.z, radius)) return false;
    const floor = room.floorHeight?.(position.x, position.z) ?? 0;
    // Cross pit edges only via the 18 cm stair treads.
    if (room.floorHeight && Math.abs(floor - room.floorHeight(camera.position.x, camera.position.z)) > .2) return false;
    for (const box of room.colliders) {
      if (box.max.y < floor + .18 || box.min.y > floor + 1.8) continue;
      const nearestX = THREE.MathUtils.clamp(position.x, box.min.x, box.max.x);
      const nearestZ = THREE.MathUtils.clamp(position.z, box.min.z, box.max.z);
      if ((nearestX - position.x) ** 2 + (nearestZ - position.z) ** 2 < radius ** 2) return false;
    }
    return true;
  }

  function update(dt: number, ambientDt = dt) {
    // Movement keeps its short collision step. City lights use visible wall
    // time, so a slow frame does not stretch a TV scene or flicker interval.
    elapsed += isCity ? ambientDt : dt;
    lastFrameSeconds = ambientDt; lastNavigationStepSeconds = dt;
    direction.set(0, 0, 0);
    if (keys.size && menu.hidden) {
      const forward = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
      const right = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
      direction.set(right * Math.cos(yaw) - forward * Math.sin(yaw), 0, -right * Math.sin(yaw) - forward * Math.cos(yaw));
      if (direction.lengthSq() && !room.navigation) {
        direction.normalize().multiplyScalar(2.6 * dt);
        candidate.copy(camera.position); candidate.x += direction.x;
        if (canStand(candidate)) camera.position.x = candidate.x;
        candidate.copy(camera.position); candidate.z += direction.z;
        if (canStand(candidate)) camera.position.z = candidate.z;
        activeView = 'walking';
        viewpointButtons.forEach(button => button.setAttribute('aria-current', 'false'));
      }
    }
    if (room.navigation) {
      direction.normalize();
      room.navigation.step(camera.position, direction, dt, menu.hidden && keys.has('Space'), menu.hidden && keys.has('KeyC'));
      if (keys.size && menu.hidden) {
        activeView = 'walking';
        viewpointButtons.forEach(button => button.setAttribute('aria-current', 'false'));
      }
    } else if (room.floorHeight) camera.position.y = THREE.MathUtils.damp(camera.position.y, room.floorHeight(camera.position.x, camera.position.z) + 1.65, 18, dt);
    if(isCity)updateCameraProjection();
    // City systems observe the live preference themselves. Do not pin their
    // common clock to zero when reduced motion was enabled at page load.
    room.update(isCity || !motionPreference.matches ? elapsed : 0);
    room.doorFixture?.update(dt,camera.position);refreshBalconyDoor();
    if(citySound&&room.windowFixture)citySound.update(room.windowFixture.getSnapshot(),camera.position,yaw,room.doorFixture?.getSnapshot());
    sky?.update(camera, motionPreference.matches ? 0 : elapsed);
  }

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    updateCameraProjection();
    renderer.setSize(innerWidth, innerHeight);
    rendering.resize(innerWidth, innerHeight);
  }
  window.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('resize', resize);

  window.render_game_to_text = () => JSON.stringify({
    page: display.name, scene: isCity ? 'north-city-apartment' : definition.id === 'liminette-student-room' ? 'liminette-apartment' : definition.kind === 'community' ? 'community-room' : 'styled-apartment', ready: loading.hidden,
    roomId: definition.id, category: categoryName, style: isCity ? definition.style : definition.kind === 'community' ? definition.style : `${definition.style} × Dark Academia`, layout: definition.layout,
    roomSignature: room.scene.userData.apartment?.audit?.interior.geometry,
    exteriorSignature: room.scene.userData.apartment?.audit?.exterior.geometry,
    geometryAudit: room.scene.userData.apartment?.audit,
    design: room.scene.userData.apartment?.design,
    workstation: room.scene.userData.apartment?.workstation,
    floorArea: room.scene.userData.apartment?.floorArea,
    referenceDesk: room.scene.userData.apartment?.referenceDesk,
    referenceLibrary: room.scene.userData.apartment?.referenceLibrary,
    communityRoom: room.scene.userData.apartment?.communityRoom, northCity: room.scene.userData.apartment?.northCity,
    navigation: room.navigation?.snapshot(), splashes: room.scene.userData.apartment?.splashes,
    floorHeight: room.floorHeight?.(camera.position.x, camera.position.z) ?? 0,
    celestial: sky?.getSnapshot(camera) ?? null,
    weather: room.environment?.getSnapshot(),
    windowFixture: room.windowFixture?.getSnapshot(),
    balconyDoor:room.doorFixture?.getSnapshot(),
    windowAppearance:room.windowAppearance?.getSettings(),
    plazaStreams:room.plazaStreams?{speed:room.plazaStreams.getSpeed()}:undefined,
    mallSigns:room.mallSigns?.getLabels(),
    plazaHolograms:room.plazaHolograms?.getSnapshot(),
    television:room.television?.getSnapshot(),
    holidays:room.holidays?.getSnapshot(),
    radio:room.radio?{...room.radio.audio.getSnapshot(),panelOpen:radioPanel?.isOpen(),position:room.radio.group.position.toArray()}:undefined,
    cityAudio:citySound?.getSnapshot(),
    cityExterior: isCity ? room.scene.getObjectByName('North City · behind the island')?.userData.exterior : undefined,
    cityLife: isCity ? room.scene.getObjectByName('North City · behind the island')?.userData.life : undefined,
    northWeather: isCity ? room.scene.getObjectByName('North City · behind the island')?.userData.getWeatherSnapshot?.() : undefined,
    balconyExterior: isCity ? room.scene.getObjectByName('Balcony · rain-soaked Circuit Market and layered east skyline')?.userData.getSnapshot?.() : undefined,
    coordinateSystem: 'metres; Y up; north is negative Z; eye height 1.65 m',
    view: activeView, position: camera.position.toArray().map(value => +value.toFixed(3)),
    look: {yaw: +yaw.toFixed(3), pitch: +pitch.toFixed(3), fov: camera.fov,
      ...(isCity?{roll:camera.rotation.z,renderedPitch:camera.rotation.x,verticalCorrection:camera.userData.cityProjection?.correction,verticalShift:camera.userData.cityProjection?.verticalShift}:{})},
    menuOpen: !menu.hidden,
    animation: {clock: isCity ? 'visible-wall-time' : 'capped-frame-time', elapsedSeconds: elapsed,
      reducedMotion: motionPreference.matches, documentHidden: document.hidden,
      roomTimeSeconds: isCity || !motionPreference.matches ? elapsed : 0,
      lastFrameSeconds, lastNavigationStepSeconds},
    controlsCollapsed: isCity ? controlsCollapsed : undefined, bounds: room.bounds, collisionCount: room.colliders.length,
    location: room.scene.userData.apartment?.location,
    outlook: room.scene.userData.apartment?.outlook,
    materials: room.scene.userData.apartment?.design?.materials ?? (definition.kind === 'community' ? 'Embedded Blender-baked oak, boucle, wool and plaster; brass and opal glass' : 'Locally stored scanned PBR wood, leather, velvet, linen and plaster'),
    viewpoints: room.viewpoints.map(view => ({id: view.id, label: view.label})),
    controls: room.navigation?.controls ?? 'Drag to look; WASD/arrows to walk; scroll/pinch to zoom; F fullscreen; Room guide for viewpoints',
    render: {calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, textures: renderer.info.memory.textures},
  });
  window.advanceTime = milliseconds => {
    const total = THREE.MathUtils.clamp(milliseconds / 1000, 0, 30);
    const steps = Math.max(1, Math.ceil(total * 60));
    for (let i = 0; i < steps; i++) update(total / steps);
    rendering.render();
  };

  let previous: number | null = null;
  function resetFrameClock() { previous = null; }
  document.addEventListener('visibilitychange', resetFrameClock);
  renderer.setAnimationLoop(now => {
    if (document.hidden) { resetFrameClock(); return; }
    const frameSeconds = previous === null ? 0 : Math.max(0, (now - previous) / 1000);
    const dt = Math.min(frameSeconds, .05);
    previous = now;
    update(dt, frameSeconds);
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
  if (cancelled) return;
  console.error('Unable to open room:', error);
  loading.replaceChildren();
  const message = document.createElement('p'); message.textContent = 'The room could not finish loading. Check that WebGL is enabled, then reopen this space.';
  const back = document.createElement('a'); const city = document.body.classList.contains('north-city-room'); back.href = city ? '/north-city.html' : '/apartments.html'; back.textContent = city ? 'Back to North City' : 'Back to Lux Umbrarum Student Spaces';
  loading.append(message, back);
}
}
void startApartment();
