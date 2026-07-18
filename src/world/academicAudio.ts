export type LibraryFootstepSurface = 'stone' | 'wood' | 'rug';

export interface LibraryAudioContext {
  inside: boolean;
  roomId?: string | null;
  /** 0 is deep inside the building; 1 is directly beside a rain-streaked window. */
  windowProximity?: number;
  surface?: LibraryFootstepSurface | string;
  /** Approximate world-space walking speed. */
  speed?: number;
  quiet?: boolean;
}

export interface LibraryAudioSnapshot {
  inside: boolean;
  roomId: string | null;
  windowProximity: number;
  surface: LibraryFootstepSurface;
  speed: number;
  quiet: boolean;
  pageTurns: number;
  clockTicks: number;
  footsteps: number;
}

type TransientSource = AudioBufferSourceNode | OscillatorNode;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const normalizeSurface = (surface: string | undefined): LibraryFootstepSurface => {
  const normalized = surface?.toLowerCase() ?? '';
  if (normalized.includes('rug') || normalized.includes('carpet')) return 'rug';
  if (normalized.includes('wood') || normalized.includes('oak') || normalized.includes('timber')) return 'wood';
  return 'stone';
};

/** Low-volume synthesized ambience; nothing starts until the user unmutes it. */
export class AcademicAudioController {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private outdoorBus: GainNode | null = null;
  private libraryBus: GainNode | null = null;
  private wind: GainNode | null = null;
  private rain: GainNode | null = null;
  private fountain: GainNode | null = null;
  private fountainHum: GainNode | null = null;
  private ringResonance: GainNode | null = null;
  private libraryRain: GainNode | null = null;
  private libraryRoomTone: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private persistentSources: TransientSource[] = [];
  private transientSources = new Map<TransientSource, AudioNode[]>();
  private muted = true;
  private weather = 'clear';
  private quietMode = false;
  private eventSeed = 0xc3e8_1512;
  private nextPageTurnAt = Number.POSITIVE_INFINITY;
  private nextClockTickAt = Number.POSITIVE_INFINITY;
  private nextFootstepAt = Number.POSITIVE_INFINITY;
  private lastLibraryMixSignature = '';
  private libraryState: LibraryAudioSnapshot = {
    inside: false,
    roomId: null,
    windowProximity: 0,
    surface: 'stone',
    speed: 0,
    quiet: false,
    pageTurns: 0,
    clockTicks: 0,
    footsteps: 0,
  };

  private ensureGraph() {
    if (
      this.context &&
      this.master &&
      this.outdoorBus &&
      this.libraryBus &&
      this.wind &&
      this.rain &&
      this.fountain &&
      this.fountainHum &&
      this.ringResonance &&
      this.libraryRain &&
      this.libraryRoomTone
    ) {
      return;
    }

    const context = new AudioContext();
    const master = context.createGain();
    const outdoorBus = context.createGain();
    const libraryBus = context.createGain();
    master.gain.value = 0;
    outdoorBus.gain.value = 1;
    libraryBus.gain.value = 0;
    outdoorBus.connect(master);
    libraryBus.connect(master);
    master.connect(context.destination);

    const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 0x9e37_79b9;
    for (let index = 0; index < data.length; index += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      data[index] = ((seed / 0xffff_ffff) * 2 - 1) * 0.48;
    }

    const makeNoise = (frequency: number, gainValue: number, destination: AudioNode, type: BiquadFilterType = 'lowpass') => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = frequency;
      const gain = context.createGain();
      gain.gain.value = gainValue;
      source.connect(filter).connect(gain).connect(destination);
      source.start();
      this.persistentSources.push(source);
      return gain;
    };
    const makeTone = (frequency: number, gainValue: number, type: OscillatorType, destination: AudioNode) => {
      const source = context.createOscillator();
      const gain = context.createGain();
      source.type = type;
      source.frequency.value = frequency;
      gain.gain.value = gainValue;
      source.connect(gain).connect(destination);
      source.start();
      this.persistentSources.push(source);
      return gain;
    };

    this.context = context;
    this.master = master;
    this.outdoorBus = outdoorBus;
    this.libraryBus = libraryBus;
    this.noiseBuffer = buffer;
    this.wind = makeNoise(520, 0.42, outdoorBus);
    this.rain = makeNoise(4600, 0, outdoorBus);
    this.fountain = makeNoise(1850, 0.12, outdoorBus);
    this.fountainHum = makeTone(54, 0, 'sine', outdoorBus);
    this.ringResonance = makeTone(311, 0, 'sine', outdoorBus);
    this.libraryRain = makeNoise(3400, 0, libraryBus, 'highpass');
    this.libraryRoomTone = makeNoise(260, 0, libraryBus);
    this.applyWeather();
    this.applyLibraryMix(true);
  }

  private nextRandom() {
    this.eventSeed = (this.eventSeed * 1664525 + 1013904223) >>> 0;
    return this.eventSeed / 0xffff_ffff;
  }

  private trackTransient(source: TransientSource, nodes: AudioNode[]) {
    this.transientSources.set(source, nodes);
    source.addEventListener(
      'ended',
      () => {
        this.transientSources.delete(source);
        source.disconnect();
        nodes.forEach((node) => node.disconnect());
      },
      { once: true },
    );
  }

  private applyMasterGain() {
    if (!this.context || !this.master) return;
    const target = this.muted ? 0 : this.quietMode ? 0.012 : 0.028;
    this.master.gain.setTargetAtTime(target, this.context.currentTime, 0.12);
  }

  private applyWeather() {
    if (!this.context || !this.wind || !this.rain) return;
    const rainy = this.weather.includes('rain') || this.weather === 'storm';
    const foggy = this.weather.includes('fog');
    const now = this.context.currentTime;
    this.wind.gain.setTargetAtTime(foggy ? 0.18 : rainy ? 0.32 : 0.24, now, 0.45);
    this.rain.gain.setTargetAtTime(rainy ? 0.34 : this.weather === 'academic-autumn' ? 0.07 : 0, now, 0.45);
    this.applyLibraryMix();
  }

  private applyLibraryMix(immediate = false) {
    if (
      !this.context ||
      !this.outdoorBus ||
      !this.libraryBus ||
      !this.libraryRain ||
      !this.libraryRoomTone
    ) {
      return;
    }

    const now = this.context.currentTime;
    const smoothing = immediate ? 0.01 : 0.32;
    const { inside, roomId, windowProximity } = this.libraryState;
    const underground = /archive|occultum|rare|basement/i.test(roomId ?? '');
    const rainy = this.weather.includes('rain') || this.weather === 'storm';
    const lightRain = this.weather === 'academic-autumn';
    const quietScale = this.quietMode ? 0.34 : 1;
    const windowRain = rainy ? 0.22 : lightRain ? 0.14 : 0.035;
    const quantizedWindowProximity = Math.round(windowProximity * 20) / 20;
    const mixSignature = [inside, underground, quantizedWindowProximity, this.quietMode, this.weather].join(':');
    if (!immediate && mixSignature === this.lastLibraryMixSignature) return;
    this.lastLibraryMixSignature = mixSignature;

    this.outdoorBus.gain.setTargetAtTime(inside ? (this.quietMode ? 0.06 : 0.16) : 1, now, smoothing);
    this.libraryBus.gain.setTargetAtTime(inside ? quietScale : 0, now, smoothing);
    this.libraryRain.gain.setTargetAtTime(
      inside && !underground ? windowRain * (0.25 + quantizedWindowProximity * 0.75) : 0,
      now,
      smoothing,
    );
    this.libraryRoomTone.gain.setTargetAtTime(inside ? (underground ? 0.022 : 0.04) : 0, now, smoothing);
    this.applyMasterGain();
  }

  private resetLibrarySchedule(now: number) {
    this.nextPageTurnAt = now + 3.8 + this.nextRandom() * 4.2;
    this.nextClockTickAt = now + 2.2 + this.nextRandom() * 3.4;
    this.nextFootstepAt = now + 0.08;
  }

  private schedulePageTurn(now: number) {
    if (!this.context || !this.libraryBus || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    const highpass = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const duration = 0.46 + this.nextRandom() * 0.28;
    source.buffer = this.noiseBuffer;
    source.playbackRate.value = 0.82 + this.nextRandom() * 0.24;
    highpass.type = 'highpass';
    highpass.frequency.value = 720 + this.nextRandom() * 420;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.036, now + 0.045);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(highpass).connect(gain).connect(this.libraryBus);
    this.trackTransient(source, [highpass, gain]);
    source.start(now, this.nextRandom() * 1.8, duration);
    source.stop(now + duration + 0.02);
    this.libraryState.pageTurns += 1;
  }

  private scheduleClockTick(now: number) {
    if (!this.context || !this.libraryBus) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 1560 + this.nextRandom() * 260;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.022, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
    oscillator.connect(gain).connect(this.libraryBus);
    this.trackTransient(oscillator, [gain]);
    oscillator.start(now);
    oscillator.stop(now + 0.085);
    this.libraryState.clockTicks += 1;
  }

  private scheduleFootstep(now: number, surface: LibraryFootstepSurface) {
    if (!this.context || !this.libraryBus || !this.noiseBuffer) return;
    const characteristics = {
      stone: { frequency: 980, gain: 0.065, duration: 0.095 },
      wood: { frequency: 570, gain: 0.058, duration: 0.12 },
      rug: { frequency: 260, gain: 0.027, duration: 0.15 },
    }[surface];
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noiseBuffer;
    source.playbackRate.value = 0.86 + this.nextRandom() * 0.22;
    filter.type = 'lowpass';
    filter.frequency.value = characteristics.frequency * (0.9 + this.nextRandom() * 0.2);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(characteristics.gain, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + characteristics.duration);
    source.connect(filter).connect(gain).connect(this.libraryBus);
    this.trackTransient(source, [filter, gain]);
    source.start(now, this.nextRandom() * 1.8, characteristics.duration);
    source.stop(now + characteristics.duration + 0.02);
    this.libraryState.footsteps += 1;
  }

  async setMuted(muted: boolean) {
    this.muted = muted;
    if (!muted) this.ensureGraph();
    if (!this.context || !this.master) return;
    if (!muted && this.context.state === 'suspended') await this.context.resume();
    if (!muted && this.libraryState.inside && !Number.isFinite(this.nextPageTurnAt)) {
      this.resetLibrarySchedule(this.context.currentTime);
    }
    this.applyMasterGain();
  }

  isMuted() {
    return this.muted;
  }

  setWeather(weather: string) {
    this.weather = weather;
    this.applyWeather();
  }

  /**
   * Updates the listener's library context. Call once per frame while exploring;
   * no Web Audio graph is created until the user explicitly unmutes audio.
   */
  setLibraryContext(state: LibraryAudioContext) {
    const wasInside = this.libraryState.inside;
    const roomId = state.roomId ?? null;
    this.libraryState.inside = state.inside;
    this.libraryState.roomId = roomId;
    this.libraryState.windowProximity = clamp01(state.windowProximity ?? 0);
    this.libraryState.surface = normalizeSurface(state.surface);
    this.libraryState.speed = Math.max(0, Number.isFinite(state.speed) ? state.speed ?? 0 : 0);
    if (typeof state.quiet === 'boolean') this.quietMode = state.quiet;
    this.libraryState.quiet = this.quietMode;

    if (!this.context) return;
    this.applyLibraryMix();
    if (!state.inside || this.muted) {
      this.nextFootstepAt = Number.POSITIVE_INFINITY;
      return;
    }

    const now = this.context.currentTime;
    if (!wasInside) this.resetLibrarySchedule(now);
    const underground = /archive|occultum|rare|basement/i.test(roomId ?? '');
    const pageRoom = /reading|stack|catalog|office|gallery|stair/i.test(roomId ?? '');

    if (pageRoom && now >= this.nextPageTurnAt) {
      this.schedulePageTurn(now);
      this.nextPageTurnAt = now + (underground ? 14 : 7) + this.nextRandom() * (underground ? 12 : 9);
    }
    if (now >= this.nextClockTickAt) {
      this.scheduleClockTick(now);
      this.nextClockTickAt = now + (underground ? 8 : 4.2) + this.nextRandom() * 4.8;
    }

    if (this.libraryState.speed > 0.035) {
      if (!Number.isFinite(this.nextFootstepAt)) this.nextFootstepAt = now;
      if (now >= this.nextFootstepAt) {
        this.scheduleFootstep(now, this.libraryState.surface);
        const pace = clamp01(this.libraryState.speed / 1.4);
        this.nextFootstepAt = now + 0.62 - pace * 0.27;
      }
    } else {
      this.nextFootstepAt = now + 0.08;
    }
  }

  setQuietMode(enabled: boolean) {
    this.quietMode = enabled;
    this.libraryState.quiet = enabled;
    this.applyLibraryMix();
  }

  isQuietMode() {
    return this.quietMode;
  }

  getLibrarySnapshot(): LibraryAudioSnapshot {
    return { ...this.libraryState };
  }

  setFountain(flow: number, distanceWorldUnits: number) {
    if (!this.context || !this.fountain || !this.fountainHum || !this.ringResonance || this.muted) return;
    const proximity = Math.max(0, Math.min(1, 1 - distanceWorldUnits / 7));
    const enclosedBoost = distanceWorldUnits < 2.2 ? 1.18 : 1;
    this.fountain.gain.setTargetAtTime(
      (0.012 + Math.max(0, flow) * 0.2) * proximity * enclosedBoost,
      this.context.currentTime,
      0.22,
    );
    this.fountainHum.gain.setTargetAtTime(0.025 * proximity * Math.max(0.15, flow), this.context.currentTime, 0.38);
    this.ringResonance.gain.setTargetAtTime(
      distanceWorldUnits < 1.8 ? 0.0028 * proximity : 0,
      this.context.currentTime,
      0.6,
    );
  }

  ringBell() {
    if (this.muted) return false;
    this.ensureGraph();
    if (!this.context || !this.master) return false;
    const now = this.context.currentTime;
    [196, 293.66, 392].forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12 / (index + 1), now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8 + index * 0.45);
      oscillator.connect(gain).connect(this.master!);
      this.trackTransient(oscillator, [gain]);
      oscillator.start(now);
      oscillator.stop(now + 4.5 + index * 0.45);
    });
    return true;
  }

  dispose() {
    this.transientSources.forEach((nodes, source) => {
      try {
        source.stop();
      } catch {
        // Source may already have ended.
      }
      source.disconnect();
      nodes.forEach((node) => node.disconnect());
    });
    this.transientSources.clear();
    this.persistentSources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Source may already have ended.
      }
      source.disconnect();
    });
    this.persistentSources = [];
    this.master?.disconnect();
    this.outdoorBus?.disconnect();
    this.libraryBus?.disconnect();
    this.wind?.disconnect();
    this.rain?.disconnect();
    this.fountain?.disconnect();
    this.fountainHum?.disconnect();
    this.ringResonance?.disconnect();
    this.libraryRain?.disconnect();
    this.libraryRoomTone?.disconnect();
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.outdoorBus = null;
    this.libraryBus = null;
    this.wind = null;
    this.rain = null;
    this.fountain = null;
    this.fountainHum = null;
    this.ringResonance = null;
    this.libraryRain = null;
    this.libraryRoomTone = null;
    this.noiseBuffer = null;
    this.nextPageTurnAt = Number.POSITIVE_INFINITY;
    this.nextClockTickAt = Number.POSITIVE_INFINITY;
    this.nextFootstepAt = Number.POSITIVE_INFINITY;
    this.lastLibraryMixSignature = '';
  }
}
