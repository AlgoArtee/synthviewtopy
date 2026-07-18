/** Low-volume synthesized ambience; nothing starts until the user unmutes it. */
export class AcademicAudioController {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private wind: GainNode | null = null;
  private rain: GainNode | null = null;
  private fountain: GainNode | null = null;
  private fountainHum: GainNode | null = null;
  private ringResonance: GainNode | null = null;
  private muted = true;
  private weather = 'clear';

  private ensureGraph() {
    if (this.context && this.master && this.wind && this.rain && this.fountain && this.fountainHum && this.ringResonance) return;
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);

    const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 0x9e3779b9;
    for (let index = 0; index < data.length; index += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      data[index] = ((seed / 0xffffffff) * 2 - 1) * 0.48;
    }

    const makeNoise = (frequency: number, gainValue: number) => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = frequency;
      const gain = context.createGain();
      gain.gain.value = gainValue;
      source.connect(filter).connect(gain).connect(master);
      source.start();
      return gain;
    };
    const makeTone = (frequency: number, gainValue: number, type: OscillatorType) => {
      const source = context.createOscillator();
      const gain = context.createGain();
      source.type = type;
      source.frequency.value = frequency;
      gain.gain.value = gainValue;
      source.connect(gain).connect(master);
      source.start();
      return gain;
    };

    this.context = context;
    this.master = master;
    this.wind = makeNoise(520, 0.42);
    this.rain = makeNoise(4600, 0);
    this.fountain = makeNoise(1850, 0.12);
    this.fountainHum = makeTone(54, 0, 'sine');
    this.ringResonance = makeTone(311, 0, 'sine');
    this.applyWeather();
  }

  private applyWeather() {
    if (!this.context || !this.wind || !this.rain) return;
    const rainy = this.weather.includes('rain') || this.weather === 'storm';
    const foggy = this.weather.includes('fog');
    const now = this.context.currentTime;
    this.wind.gain.setTargetAtTime(foggy ? 0.18 : rainy ? 0.32 : 0.24, now, 0.45);
    this.rain.gain.setTargetAtTime(rainy ? 0.34 : this.weather === 'academic-autumn' ? 0.07 : 0, now, 0.45);
  }

  async setMuted(muted: boolean) {
    this.muted = muted;
    if (!muted) this.ensureGraph();
    if (!this.context || !this.master) return;
    if (!muted && this.context.state === 'suspended') await this.context.resume();
    this.master.gain.setTargetAtTime(muted ? 0 : 0.028, this.context.currentTime, 0.12);
  }

  isMuted() {
    return this.muted;
  }

  setWeather(weather: string) {
    this.weather = weather;
    this.applyWeather();
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
      oscillator.start(now);
      oscillator.stop(now + 4.5 + index * 0.45);
    });
    return true;
  }

  dispose() {
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.wind = null;
    this.rain = null;
    this.fountain = null;
    this.fountainHum = null;
    this.ringResonance = null;
  }
}
