import './islandMenu.css';

type IslandView = 'explore' | 'plan' | 'edit' | 'walk';

/** One disclosure owns the island's general UI; existing controls keep their listeners. */
export function createIslandMenu() {
  const get = <T extends HTMLElement = HTMLElement>(selector: string): T => {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Missing island menu element: ${selector}`);
    return element;
  };
  const app = get('#app');
  const drawer = get('#island-menu');
  const toggle = get<HTMLButtonElement>('#island-menu-toggle');
  const close = get<HTMLButtonElement>('#island-menu-close');
  const backdrop = get('#island-menu-backdrop');
  const inspector = get('#inspector-panel');
  const selectionDetails = get<HTMLButtonElement>('#island-selection-details');
  const walkSection = get('#island-menu-walk');
  const atmosphere = get('#atmosphere-menu');
  const detailStatus = get('#full-island-status-card');
  const topbar = get('.topbar');
  const topActions = get('.top-actions');
  const movementCodes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
  let open = false;
  let activeMode: IslandView = 'explore';
  let selectionName: string | null = null;

  const move = (selector: string, destination: string) => get(destination).append(get(selector));
  move('.atmosphere-monitor', '#island-menu-environment');
  move('#full-island-detail-monitor', '#island-menu-rendering');
  move('.atlas-performance', '#island-menu-rendering');
  move('#debug-stats', '#island-menu-rendering');
  move('.layerbar', '#island-menu-layers');
  move('#toggle-theme', '#island-menu-layers');
  move('#toggle-time', '#island-menu-environment');
  get('#island-menu-tools').append(topActions);
  get('#island-menu-views').append(topbar);
  move('#scene-card', '#island-menu-current');
  move('#interaction-hint', '#island-menu-current');
  move('.compass', '#island-menu-current');
  move('#island-selection-details', '#island-menu-current');
  move('#atlas-panel', '#island-menu-atlas');
  move('#inspector-panel', '#island-menu-inspector');
  move('.walk-readout', '#island-menu-walk');

  // These sections are now inline. Only the outer island menu is collapsible.
  ['#atlas-collapse', '#atmosphere-toggle', '#atmosphere-menu-close',
    '#full-island-status-chip', '#full-island-status-close', '#walk-hud-collapse'].forEach((selector) => {
    const control = get(selector);
    control.hidden = true;
    control.tabIndex = -1;
  });

  const setOpen = (next: boolean, returnFocus = false) => {
    if (next === open) return;
    open = next;
    if (open) {
      if (document.pointerLockElement) document.exitPointerLock();
      // A key held before opening must also stop in drag-look fallback mode.
      movementCodes.forEach((code) => window.dispatchEvent(new KeyboardEvent('keyup', { code })));
    }
    drawer.hidden = !open;
    backdrop.hidden = !open;
    atmosphere.hidden = !open;
    detailStatus.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('island-menu-open', open);
    // Open the menu only with keyboard focus inside it; do not leave focus on hidden controls.
    if (open) close.focus({ preventScroll: true });
    else if (returnFocus || drawer.contains(document.activeElement)) toggle.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent('island-menu-change', { detail: { open } }));
  };

  toggle.addEventListener('click', () => setOpen(!open, true));
  close.addEventListener('click', () => setOpen(false, true));
  backdrop.addEventListener('click', () => setOpen(false, true));
  selectionDetails.addEventListener('click', () => {
    if (activeMode === 'edit') setOpen(false);
    const title = get('#inspector-title');
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
    inspector.scrollIntoView({ block: 'start' });
  });
  drawer.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest('.mode, .district-item, #home-view, #locate-synthetic-shore, #focus-selection, #walk-look-button, #import-trigger')) {
      setOpen(false, true);
    }
  });
  document.addEventListener('keydown', (event) => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(false, true);
      return;
    }
    // Menu scrolling and native form navigation must not move the walking camera.
    if (movementCodes.includes(event.code)) {
      event.stopPropagation();
    }
    if (event.key !== 'Tab') return;
    const controls = Array.from(drawer.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]'))
      .filter((element) => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }, true);

  return {
    isOpen: () => open,
    setOpen,
    setSelection(name: string | null) {
      selectionName = name;
      selectionDetails.hidden = !name || activeMode === 'walk';
      selectionDetails.textContent = name ? `Inspect ${name} ↓` : 'Selected object details ↓';
    },
    setMode(mode: IslandView) {
      activeMode = mode;
      get('#island-menu-mode').textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
      walkSection.hidden = mode !== 'walk';
      selectionDetails.hidden = !selectionName || mode === 'walk';
      // Direct manipulation retains its contextual inspector next to the scene.
      (mode === 'edit' ? app : get('#island-menu-inspector')).append(inspector);
      setOpen(false);
    },
  };
}
