/**
 * Procedural Web Audio API sound synthesizer for Subsurface Vault Simulation
 * Zero external audio files; 100% generated in real-time.
 */

export class VaultAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;

  // Sound nodes
  private winchOsc: OscillatorNode | null = null;
  private winchGain: GainNode | null = null;

  private jetNoiseNode: AudioBufferSourceNode | null = null;
  private jetFilter: BiquadFilterNode | null = null;
  private jetGain: GainNode | null = null;

  private pumpOsc: OscillatorNode | null = null;
  private pumpGain: GainNode | null = null;
  private cavitationNode: AudioBufferSourceNode | null = null;
  private cavitationGain: GainNode | null = null;

  private blowerNoiseNode: AudioBufferSourceNode | null = null;
  private blowerFilter: BiquadFilterNode | null = null;
  private blowerGain: GainNode | null = null;

  private alarmOsc1: OscillatorNode | null = null;
  private alarmOsc2: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;
  private alarmInterval: number | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.initNoiseBuffers();
      this.initWinchNode();
      this.initPumpNode();
    } catch (err) {
      console.warn('Web Audio API not supported or blocked:', err);
    }
  }

  private initNoiseBuffers() {
    if (!this.ctx || !this.masterGain) return;

    // Create 2-second looped pink/white noise buffer for water jets and ventilation
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    // Jet Noise
    this.jetNoiseNode = this.ctx.createBufferSource();
    this.jetNoiseNode.buffer = noiseBuffer;
    this.jetNoiseNode.loop = true;
    this.jetFilter = this.ctx.createBiquadFilter();
    this.jetFilter.type = 'bandpass';
    this.jetFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);
    this.jetFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.jetGain = this.ctx.createGain();
    this.jetGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.jetNoiseNode.connect(this.jetFilter);
    this.jetFilter.connect(this.jetGain);
    this.jetGain.connect(this.masterGain);
    this.jetNoiseNode.start();

    // Blower Ventilation Noise
    this.blowerNoiseNode = this.ctx.createBufferSource();
    this.blowerNoiseNode.buffer = noiseBuffer;
    this.blowerNoiseNode.loop = true;
    this.blowerFilter = this.ctx.createBiquadFilter();
    this.blowerFilter.type = 'lowpass';
    this.blowerFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

    this.blowerGain = this.ctx.createGain();
    this.blowerGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.blowerNoiseNode.connect(this.blowerFilter);
    this.blowerFilter.connect(this.blowerGain);
    this.blowerGain.connect(this.masterGain);
    this.blowerNoiseNode.start();

    // Cavitation crackle buffer
    const cavBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const cavOut = cavBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Sporadic sharp impulse clicks
      cavOut[i] = Math.random() > 0.98 ? (Math.random() * 2 - 1) * 0.8 : 0;
    }
    this.cavitationNode = this.ctx.createBufferSource();
    this.cavitationNode.buffer = cavBuffer;
    this.cavitationNode.loop = true;
    this.cavitationGain = this.ctx.createGain();
    this.cavitationGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.cavitationNode.connect(this.cavitationGain);
    this.cavitationGain.connect(this.masterGain);
    this.cavitationNode.start();
  }

  private initWinchNode() {
    if (!this.ctx || !this.masterGain) return;
    this.winchOsc = this.ctx.createOscillator();
    this.winchOsc.type = 'triangle';
    this.winchOsc.frequency.setValueAtTime(140, this.ctx.currentTime);
    this.winchGain = this.ctx.createGain();
    this.winchGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.winchOsc.connect(this.winchGain);
    this.winchGain.connect(this.masterGain);
    this.winchOsc.start();
  }

  private initPumpNode() {
    if (!this.ctx || !this.masterGain) return;
    this.pumpOsc = this.ctx.createOscillator();
    this.pumpOsc.type = 'sawtooth';
    this.pumpOsc.frequency.setValueAtTime(68, this.ctx.currentTime);
    this.pumpGain = this.ctx.createGain();
    this.pumpGain.gain.setValueAtTime(0, this.ctx.currentTime);

    const pumpFilter = this.ctx.createBiquadFilter();
    pumpFilter.type = 'lowpass';
    pumpFilter.frequency.setValueAtTime(180, this.ctx.currentTime);

    this.pumpOsc.connect(pumpFilter);
    pumpFilter.connect(this.pumpGain);
    this.pumpGain.connect(this.masterGain);
    this.pumpOsc.start();
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.35, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setWinch(active: boolean, speedMultiplier = 1.0) {
    if (!this.ctx || !this.winchGain || !this.winchOsc || this.isMuted) return;
    const now = this.ctx.currentTime;
    if (active) {
      this.winchOsc.frequency.setValueAtTime(130 + Math.abs(speedMultiplier) * 35, now);
      this.winchGain.gain.setValueAtTime(0.18, now);
    } else {
      this.winchGain.gain.setValueAtTime(0, now);
    }
  }

  public setJet(pressureBar: number) {
    if (!this.ctx || !this.jetGain || !this.jetFilter || this.isMuted) return;
    const now = this.ctx.currentTime;
    if (pressureBar > 5) {
      const vol = Math.min(0.28, (pressureBar / 70) * 0.28);
      const freq = 2000 + (pressureBar / 70) * 2500;
      this.jetGain.gain.setValueAtTime(vol, now);
      this.jetFilter.frequency.setValueAtTime(freq, now);
    } else {
      this.jetGain.gain.setValueAtTime(0, now);
    }
  }

  public setPump(flowM3h: number, isCavitating: boolean) {
    if (!this.ctx || !this.pumpGain || !this.pumpOsc || !this.cavitationGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    if (flowM3h > 1.0) {
      const vol = Math.min(0.3, (flowM3h / 45) * 0.3);
      this.pumpGain.gain.setValueAtTime(vol, now);
      this.pumpOsc.frequency.setValueAtTime(60 + (flowM3h / 45) * 20, now);

      if (isCavitating) {
        this.cavitationGain.gain.setValueAtTime(0.25, now);
      } else {
        this.cavitationGain.gain.setValueAtTime(0, now);
      }
    } else {
      this.pumpGain.gain.setValueAtTime(0, now);
      this.cavitationGain.gain.setValueAtTime(0, now);
    }
  }

  public setVentilation(active: boolean, cfm: number) {
    if (!this.ctx || !this.blowerGain || !this.blowerFilter || this.isMuted) return;
    const now = this.ctx.currentTime;
    if (active && cfm > 0) {
      const vol = Math.min(0.22, (cfm / 2000) * 0.22);
      this.blowerGain.gain.setValueAtTime(vol, now);
      this.blowerFilter.frequency.setValueAtTime(350 + (cfm / 2000) * 250, now);
    } else {
      this.blowerGain.gain.setValueAtTime(0, now);
    }
  }

  public triggerGasAlarm(hazardLevel: 'SAFE' | 'CAUTION' | 'CRITICAL_ALARM') {
    if (!this.ctx || !this.masterGain || this.isMuted) {
      this.stopGasAlarm();
      return;
    }

    if (hazardLevel === 'SAFE') {
      this.stopGasAlarm();
      return;
    }

    if (this.alarmInterval) return; // already beeping

    this.alarmOsc1 = this.ctx.createOscillator();
    this.alarmOsc2 = this.ctx.createOscillator();
    this.alarmGain = this.ctx.createGain();

    this.alarmOsc1.type = 'sine';
    this.alarmOsc2.type = 'sine';
    this.alarmOsc1.frequency.setValueAtTime(960, this.ctx.currentTime);
    this.alarmOsc2.frequency.setValueAtTime(1440, this.ctx.currentTime);

    this.alarmGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.alarmOsc1.connect(this.alarmGain);
    this.alarmOsc2.connect(this.alarmGain);
    this.alarmGain.connect(this.masterGain);

    this.alarmOsc1.start();
    this.alarmOsc2.start();

    const intervalMs = hazardLevel === 'CRITICAL_ALARM' ? 220 : 650;
    let beepState = false;

    this.alarmInterval = window.setInterval(() => {
      if (!this.ctx || !this.alarmGain) return;
      beepState = !beepState;
      const now = this.ctx.currentTime;
      this.alarmGain.gain.setValueAtTime(beepState ? 0.22 : 0, now);
    }, intervalMs);
  }

  public stopGasAlarm() {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.alarmGain && this.ctx) {
      this.alarmGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (this.alarmOsc1) {
      try { this.alarmOsc1.stop(); } catch (_) {}
      this.alarmOsc1 = null;
    }
    if (this.alarmOsc2) {
      try { this.alarmOsc2.stop(); } catch (_) {}
      this.alarmOsc2 = null;
    }
  }

  public dispose() {
    this.stopGasAlarm();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch (_) {}
      this.ctx = null;
    }
  }
}
