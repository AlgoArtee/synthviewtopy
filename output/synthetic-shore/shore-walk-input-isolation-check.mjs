import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
try {
  await page.route('**/__shore_input_check__', route => route.fulfill({
    contentType: 'text/html', body: '<html><body><canvas></canvas></body></html>' }));
  await page.goto('http://127.0.0.1:5178/__shore_input_check__');
  const result = await page.evaluate(async () => {
    const THREE = await import('/node_modules/.vite/deps/three.js');
    const { WalkController } = await import('/src/world/WalkController.ts');
    const camera = new THREE.PerspectiveCamera();
    const element = document.querySelector('canvas');
    const callbacks = [];
    const walk = new WalkController({ camera, element, navigationRoot: new THREE.Group(),
      onLockChange: (...args) => callbacks.push(args) });
    // Reproduce a lock owned by another controller on the same renderer canvas.
    // The real Three event handlers observe this state and dispatch lock events.
    Object.defineProperty(document, 'pointerLockElement', { configurable: true, get: () => element });
    document.dispatchEvent(new Event('pointerlockchange'));
    const original = camera.quaternion.clone();
    document.dispatchEvent(new MouseEvent('mousemove', { movementX: 40, movementY: 10 }));
    const inactivePreserved = original.equals(camera.quaternion) && callbacks.length === 0;
    const inactiveSnapshotCorrect = !walk.getSnapshot().pointerLocked && walk.getSnapshot().lookMode === 'idle';
    let shoreFallbackCalls = 0;
    const shoreFallback = event => { shoreFallbackCalls++; event.stopImmediatePropagation(); };
    document.addEventListener('pointerlockerror', shoreFallback, true);
    document.dispatchEvent(new Event('pointerlockerror'));
    const inactivePassesError = shoreFallbackCalls === 1;
    walk.enter(new THREE.Vector3(0,1.6,40),new THREE.Vector3(0,0,-1));
    document.dispatchEvent(new Event('pointerlockchange'));
    const activeBefore = camera.quaternion.clone();
    document.dispatchEvent(new MouseEvent('mousemove',{movementX:40,movementY:10}));
    const activeLookWorks = !activeBefore.equals(camera.quaternion) && walk.pointerControls.enabled;
    document.dispatchEvent(new Event('pointerlockerror'));
    const activeOwnsError = shoreFallbackCalls === 1;
    walk.exit();
    const callbacksAtExit = callbacks.length;
    const exitedBefore = camera.quaternion.clone();
    document.dispatchEvent(new Event('pointerlockchange'));
    document.dispatchEvent(new MouseEvent('mousemove',{movementX:40,movementY:10}));
    const exitPreserved = exitedBefore.equals(camera.quaternion) && callbacks.length === callbacksAtExit
      && !walk.pointerControls.enabled && callbacks.at(-1)[0] === false;
    document.removeEventListener('pointerlockerror', shoreFallback, true);
    delete document.pointerLockElement;
    walk.dispose();
    return {inactivePreserved,inactiveSnapshotCorrect,inactivePassesError,activeLookWorks,activeOwnsError,exitPreserved};
  });
  if (errors.length || Object.values(result).some(value => !value)) throw new Error(JSON.stringify({result,errors}));
  console.log(JSON.stringify({result,errors},null,2));
} finally { await browser.close(); }
