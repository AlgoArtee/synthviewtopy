export type SyntheticBeachTrack = 'tidal' | 'orbital';

/** An original, locally synthesised lounge soundtrack. No remote audio or autoplay. */
export function createSyntheticBeachAudio() {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let playing = false;
  let disposed = false;
  let volume = 0.32;
  let track: SyntheticBeachTrack = 'tidal';
  let nextBeat = 0;
  let beat = 0;
  let revision = 0;
  const activeSources = new Set<AudioScheduledSourceNode>();

  const ensureContext = () => {
    if (context) return context;
    const Constructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) throw new Error('This browser does not support beach-club audio.');
    context = new Constructor();
    master = context.createGain();
    master.gain.value = volume * 0.45;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    master.connect(compressor);
    compressor.connect(context.destination);
    return context;
  };

  function tone(frequency: number, at: number, duration: number, strength: number, type: OscillatorType = 'sine', detune = 0) {
    if (!context || !master) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.detune.value = detune;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(strength, at + Math.min(0.035, duration * 0.15));
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    activeSources.add(oscillator);
    oscillator.onended = () => {
      activeSources.delete(oscillator);
      oscillator.disconnect();
      envelope.disconnect();
    };
    oscillator.start(at);
    oscillator.stop(at + duration + 0.03);
  }

  function kick(at: number) {
    if (!context || !master) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.frequency.setValueAtTime(115, at);
    oscillator.frequency.exponentialRampToValueAtTime(41, at + 0.18);
    envelope.gain.setValueAtTime(0.45, at);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
    oscillator.connect(envelope);
    envelope.connect(master);
    activeSources.add(oscillator);
    oscillator.onended = () => {
      activeSources.delete(oscillator);
      oscillator.disconnect();
      envelope.disconnect();
    };
    oscillator.start(at);
    oscillator.stop(at + 0.32);
  }

  function hat(at: number, accent: boolean) {
    if (!context || !master) return;
    const length = Math.ceil(context.sampleRate * 0.045);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = 7200;
    envelope.gain.value = accent ? 0.1 : 0.047;
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(master);
    activeSources.add(source);
    source.onended = () => {
      activeSources.delete(source);
      source.disconnect();
      filter.disconnect();
      envelope.disconnect();
    };
    source.start(at);
  }

  function schedule() {
    if (!context || !playing || disposed) return;
    const beatLength = 60 / (track === 'tidal' ? 86 : 104);
    // Tab suspension can move the audio clock forward; never catch up old notes.
    if (nextBeat < context.currentTime - 0.1) nextBeat = context.currentTime + 0.04;
    while (nextBeat < context.currentTime + 0.15) {
      const bar = Math.floor(beat / 8);
      const step = beat % 8;
      const roots = track === 'tidal' ? [146.832, 130.813, 174.614, 110] : [164.814, 146.832, 130.813, 196];
      const root = roots[bar % roots.length];
      if (step === 0 || step === 4 || (track === 'orbital' && step === 6)) kick(nextBeat);
      hat(nextBeat, step % 2 === 1);
      if (step === 2 || step === 6) tone(185, nextBeat, 0.075, 0.065, 'triangle');
      if (step === 0 || step === 3 || step === 6) tone(root / 2, nextBeat, beatLength * 0.7, 0.19, 'sine');
      if (step === 0) {
        for (const ratio of [1, Math.pow(2, 3 / 12), Math.pow(2, 7 / 12), Math.pow(2, 10 / 12)]) {
          tone(root * ratio * 2, nextBeat, beatLength * 3.1, 0.025, 'sine', ratio === 1 ? -4 : 4);
        }
      }
      const melody = track === 'tidal' ? [12, 7, 10, 14, 19, 14, 10, 7] : [12, 19, 22, 15, 24, 19, 15, 10];
      if (step % 2 === 1) {
        const frequency = root * Math.pow(2, melody[(step + bar) % melody.length] / 12);
        tone(frequency, nextBeat, beatLength * 0.9, 0.04, 'sine');
        tone(frequency, nextBeat + beatLength * 0.375, beatLength * 0.5, 0.012, 'sine');
      }
      beat += 1;
      nextBeat += beatLength / 2;
    }
  }

  function stopSources() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    for (const source of activeSources) {
      try { source.stop(); } catch { /* A source may have ended before the stop. */ }
    }
    activeSources.clear();
  }

  return {
    async setPlaying(value: boolean) {
      if (disposed) return false;
      const request = ++revision;
      if (!value) {
        playing = false;
        stopSources();
        if (context?.state === 'running') await context.suspend();
        return false;
      }
      const ctx = ensureContext();
      await ctx.resume();
      if (disposed || request !== revision) return false;
      if (!playing) {
        playing = true;
        nextBeat = ctx.currentTime + 0.04;
        beat = 0;
        schedule();
        timer = setInterval(schedule, 50);
      }
      return true;
    },
    setVolume(value: number) {
      if (!Number.isFinite(value)) return;
      volume = Math.max(0, Math.min(1, value));
      if (context && master) master.gain.setTargetAtTime(volume * 0.45, context.currentTime, 0.04);
    },
    selectTrack(value: SyntheticBeachTrack) {
      if (value !== 'tidal' && value !== 'orbital') return;
      track = value;
      beat = 0;
      if (context && playing) {
        stopSources();
        nextBeat = context.currentTime + 0.04;
        schedule();
        timer = setInterval(schedule, 50);
      }
    },
    getSnapshot() {
      return { playing, volume, track, trackName: track === 'tidal' ? 'Tidal / 86 BPM' : 'Orbital / 104 BPM', available: typeof window !== 'undefined' && Boolean(window.AudioContext ?? (window as typeof window & { webkitAudioContext?: unknown }).webkitAudioContext) };
    },
    dispose() {
      disposed = true;
      revision += 1;
      playing = false;
      stopSources();
      master?.disconnect();
      if (context && context.state !== 'closed') void context.close();
      context = null;
      master = null;
    },
  };
}
