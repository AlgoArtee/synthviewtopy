import type { SyntheticShoreScene, SyntheticShoreView } from './SyntheticShoreScene';
import type { ShoreEnvironmentState } from './syntheticShoreEffects';

/** The shore owns its controls; no island editor settings or shortcuts leak in. */
export class SyntheticShoreUI {
  readonly element = document.createElement('section');
  private scene: SyntheticShoreScene | null = null;

  constructor(onExit: () => void) {
    const root = this.element;
    root.className = 'synthetic-shore-ui';
    root.setAttribute('aria-label', 'Synthetic Shore');
    root.innerHTML = `
      <header class="shore-header">
        <div><span class="shore-eyebrow">LAB ISLAND / ALPINE COAST</span><h1>Synthetic Shore</h1></div>
        <div class="shore-header-actions">
          <details class="shore-controls"><summary>Weather + water <span>☷</span></summary>
            <div class="shore-control-body">
              <h2>Make it your coast</h2>
              <label>Time of day<select data-shore-setting="timeOfDay"><option value="day">Daylight</option><option value="sunset">Sunset</option><option value="night">Night</option></select></label>
              <label>Weather<select data-shore-setting="weather"><option value="clear">Clear sky</option><option value="cloudy">Cloudy</option><option value="rain">Rain</option><option value="storm">Storm</option></select></label>
              <label>Wave height <output data-shore-output="waveHeight">1.2</output><input data-shore-setting="waveHeight" type="range" min="0" max="3" step="0.1" value="1.2"></label>
              <label>Water speed <output data-shore-output="waterSpeed">1.0×</output><input data-shore-setting="waterSpeed" type="range" min="0" max="3" step="0.1" value="1"></label>
              <label class="shore-inline-control">Water tint<input data-shore-setting="waterColor" type="color" value="#047888"></label>
              <label class="shore-inline-control">Live reflections<input data-shore-setting="reflections" type="checkbox" checked></label>
              <button type="button" data-shore-reset>Reset coast</button>
            </div>
          </details>
          <button type="button" data-shore-exit>Return to island <span>↗</span></button>
        </div>
      </header>
      <div class="shore-loading" role="status">Opening the shore…</div>
      <aside class="shore-interaction" hidden aria-label="Beach interaction">
        <header><div><span class="shore-eyebrow">STAY A LITTLE LONGER</span><h2 data-shore-place></h2></div><button type="button" data-shore-close-interaction aria-label="Close interaction">×</button></header>
        <div class="shore-venue-actions"></div>
        <div class="shore-music-controls">
          <label>Soundtrack<select data-shore-track><option value="tidal">Tidal lounge</option><option value="orbital">Orbital afterhours</option></select></label>
          <label>Music volume<input data-shore-volume type="range" min="0" max="100" value="32" step="1"></label>
          <p data-shore-music-state>Music off</p>
        </div>
        <p class="shore-interaction-message" role="status" aria-live="polite"></p>
      </aside>
      <footer class="shore-footer">
        <button type="button" class="shore-nearby" data-shore-interact hidden></button>
        <div class="shore-views" aria-label="Shore viewpoints">
          <button type="button" data-shore-view="ocean" aria-pressed="true">Ocean + Cygnus X-1</button>
          <button type="button" data-shore-view="island">Lab Island</button>
          <button type="button" data-shore-view="pier">Pier + stairs</button>
          <button type="button" data-shore-view="club">Beach club</button>
          <button type="button" data-shore-view="house">Beach house</button>
        </div>
        <div class="shore-movement" aria-label="Walking and swimming controls">
          <button type="button" data-shore-look>Mouse look</button>
          <label>Walk speed <input data-shore-speed aria-label="Walk speed in kilometres per hour" type="number" min="0.5" max="120" step="0.5" value="6.5" inputmode="decimal"> km/h</label>
          <button type="button" data-shore-turbo aria-pressed="false">Turbo · Off</button>
        </div>
        <p data-shore-swim-status role="status">Walking · Silver shore</p>
        <p data-shore-movement-help>WASD / arrows move · Space tap / hold jump · Swim beyond the shallows · Click or drag to look · E interact · Esc release / return</p>
      </footer>`;
    root.querySelector('[data-shore-exit]')!.addEventListener('click', onExit);
    root.querySelector('[data-shore-interact]')!.addEventListener('click', () => this.scene?.openNearbyInteraction());
    root.querySelector('[data-shore-close-interaction]')!.addEventListener('click', () => this.scene?.closeInteraction());
    root.querySelector('[data-shore-look]')!.addEventListener('click', () => this.scene?.requestMouseLook());
    root.querySelector<HTMLInputElement>('[data-shore-speed]')!.addEventListener('change', event => {
      this.scene?.setWalkSpeedKilometresPerHour(Number((event.target as HTMLInputElement).value));
    });
    root.querySelector('[data-shore-turbo]')!.addEventListener('click', () => {
      if (this.scene) this.scene.setTurboEnabled(!this.scene.getMovementState().turboEnabled);
    });
    root.querySelectorAll<HTMLButtonElement>('[data-shore-view]').forEach(button => {
      button.addEventListener('click', () => {
        this.scene?.setView(button.dataset.shoreView as SyntheticShoreView);
        root.querySelectorAll('[data-shore-view]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      });
    });
    root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-shore-setting]').forEach(input => {
      input.addEventListener('input', () => {
        if (!this.scene) return;
        const key = input.dataset.shoreSetting as keyof ShoreEnvironmentState;
        const value = key === 'reflections' ? (input as HTMLInputElement).checked
          : key === 'waveHeight' || key === 'waterSpeed' ? Number(input.value) : input.value;
        this.scene.setEnvironment({ [key]: value });
        this.syncEnvironment();
      });
    });
    root.querySelector('[data-shore-reset]')!.addEventListener('click', () => {
      this.scene?.setEnvironment({ timeOfDay: 'day', weather: 'clear', waveHeight: 1.2, waterSpeed: 1, waterColor: '#047888', reflections: true });
      this.syncEnvironment();
    });
    root.querySelector<HTMLInputElement>('[data-shore-volume]')!.addEventListener('input', event => {
      this.scene?.setMusicVolume(Number((event.target as HTMLInputElement).value) / 100);
    });
    root.querySelector<HTMLSelectElement>('[data-shore-track]')!.addEventListener('change', event => {
      this.scene?.setMusicTrack((event.target as HTMLSelectElement).value as 'tidal' | 'orbital');
    });
  }

  bindScene(scene: SyntheticShoreScene) {
    this.scene = scene;
    this.element.querySelector('.shore-loading')?.remove();
    this.syncEnvironment();
    scene.setInteractionListener(() => this.syncInteraction());
  }

  private syncEnvironment() {
    if (!this.scene) return;
    const state = this.scene.getEnvironment();
    this.element.dataset.timeOfDay = state.timeOfDay;
    this.element.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-shore-setting]').forEach(input => {
      const key = input.dataset.shoreSetting as keyof ShoreEnvironmentState;
      if (key === 'reflections') (input as HTMLInputElement).checked = state.reflections;
      else input.value = String(state[key]);
    });
    this.element.querySelector('[data-shore-output="waveHeight"]')!.textContent = state.waveHeight.toFixed(1);
    this.element.querySelector('[data-shore-output="waterSpeed"]')!.textContent = `${state.waterSpeed.toFixed(1)}×`;
  }

  private syncInteraction() {
    if (!this.scene) return;
    const movement = this.scene.getMovementState();
    const speedInput = this.element.querySelector<HTMLInputElement>('[data-shore-speed]')!;
    if (document.activeElement !== speedInput) speedInput.value = String(movement.configuredWalkSpeedKilometresPerHour);
    const turbo = this.element.querySelector<HTMLButtonElement>('[data-shore-turbo]')!;
    turbo.textContent = movement.turboEnabled ? 'Turbo · On' : 'Turbo · Off';
    turbo.setAttribute('aria-pressed', String(movement.turboEnabled));
    this.element.querySelector('[data-shore-look]')!.textContent = movement.pointerLocked ? 'Esc · Release mouse' : 'Mouse look';
    const swimming = movement.swimming;
    this.element.querySelector('[data-shore-swim-status]')!.textContent = swimming.mode === 'underwater'
      ? `Underwater · ${swimming.depthMetres.toFixed(1)} m depth · Neutral buoyancy`
      : swimming.mode === 'surface-swimming' ? 'Surface swimming · Floating with the waves'
        : swimming.mode === 'wading' ? 'Wading · Walk into deeper water to swim' : 'Walking · Silver shore';
    this.element.querySelector('[data-shore-movement-help]')!.textContent = swimming.swimming
      ? 'WASD / arrows swim · Look to steer underwater · Ctrl / Q dive · Space / E ascend · Shift swim faster · Esc release / return'
      : 'WASD / arrows move · Space tap / hold jump · Swim beyond the shallows · Click or drag to look · E interact · Esc release / return';
    const state = this.scene.getInteractionState();
    const prompt = this.element.querySelector<HTMLButtonElement>('[data-shore-interact]')!;
    prompt.hidden = !state.nearby || !!state.active;
    prompt.textContent = state.nearby ? `E · ${state.nearby.name}` : '';
    const panel = this.element.querySelector<HTMLElement>('.shore-interaction')!;
    panel.hidden = !state.active;
    this.element.querySelector('[data-shore-place]')!.textContent = state.active?.name ?? '';
    const actions = this.element.querySelector('.shore-venue-actions')!;
    const actionSignature = state.active?.id ?? '';
    if (actions.getAttribute('data-owner') !== actionSignature) {
      actions.replaceChildren();
      actions.setAttribute('data-owner', actionSignature);
      for (const action of state.active?.actions ?? []) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.shoreAction = action.id;
        button.textContent = action.label;
        button.addEventListener('click', () => { void this.scene?.performVenueAction(action.id); });
        actions.appendChild(button);
      }
    }
    const music = actions.querySelector<HTMLButtonElement>('[data-shore-action="toggle-music"]');
    if (music) music.textContent = state.audio.playing ? 'Pause music' : 'Play music';
    this.element.querySelector<HTMLSelectElement>('[data-shore-track]')!.value = state.audio.track;
    this.element.querySelector<HTMLInputElement>('[data-shore-volume]')!.value = String(Math.round(state.audio.volume * 100));
    this.element.querySelector('.shore-interaction-message')!.textContent = state.message;
    this.element.querySelector('[data-shore-music-state]')!.textContent = state.audio.playing ? `Now playing · ${state.audio.trackName}` : 'Music off · press Play to listen';
  }

  dispose() {
    this.scene?.setInteractionListener(null);
    this.scene = null;
    this.element.remove();
  }
}
