/**
 * Procedural Web Audio API Sound Synthesizer for Canyon Expedition Simulator
 * Realistic 6-cylinder diesel engine, turbo spool, air brake discharge, and suspension creaks.
 * 100% self-contained, zero external audio asset dependencies.
 */

export class CanyonAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;

  // Engine sound generation nodes
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Turbo spool whistling node
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;

  // Brake air hiss & tire crunch noise
  private noiseBuffer: AudioBuffer | null = null;
  private brakeNoiseNode: AudioBufferSourceNode | null = null;
  private brakeGain: GainNode | null = null;
  private ambientNoiseNode: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.initEngineNodes();
      this.initTurboNodes();
      this.initNoiseNodes();
    } catch (e) {
      console.warn('Web Audio initialization failed or blocked:', e);
    }
  }

  private initEngineNodes() {
    if (!this.ctx || !this.masterGain) return;

    // Dual blended harmonic oscillators for heavy diesel cylinder rumble
    this.osc1 = this.ctx.createOscillator();
    this.osc2 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc2.type = 'triangle';

    this.osc1.frequency.setValueAtTime(45, this.ctx.currentTime);
    this.osc2.frequency.setValueAtTime(90, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    this.osc1.connect(this.engineFilter);
    this.osc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.osc1.start();
    this.osc2.start();
  }

  private initTurboNodes() {
    if (!this.ctx || !this.masterGain) return;

    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(this.masterGain);
    this.turboOsc.start();
  }

  private initNoiseNodes() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Ambient mountain wind & river roar
    this.ambientNoiseNode = this.ctx.createBufferSource();
    this.ambientNoiseNode.buffer = this.noiseBuffer;
    this.ambientNoiseNode.loop = true;

    const ambientFilter = this.ctx.createBiquadFilter();
    ambientFilter.type = 'bandpass';
    ambientFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    ambientFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    this.ambientNoiseNode.connect(ambientFilter);
    ambientFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    this.ambientNoiseNode.start();
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

  /**
   * Update engine sound based on speed and throttle load
   */
  public updateEngine(speedKmh: number, throttle: number, isBraking: boolean) {
    if (!this.ctx || this.isMuted || !this.osc1 || !this.osc2 || !this.engineFilter || !this.turboOsc || !this.turboGain) {
      return;
    }

    const now = this.ctx.currentTime;
    const absSpeed = Math.abs(speedKmh);
    const speedRatio = Math.min(1.0, absSpeed / 45);

    // RPM model: Idle 650 -> Max 2400
    const baseFreq = 42 + speedRatio * 85 + Math.abs(throttle) * 35;
    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.osc2.frequency.setTargetAtTime(baseFreq * 2.1, now, 0.08);

    // Filter resonance opens with throttle
    const filterFreq = 220 + speedRatio * 350 + Math.abs(throttle) * 450;
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);

    // Turbo spool sound increases under high throttle and speed
    if (Math.abs(throttle) > 0.3 && absSpeed > 8) {
      const turboFreq = 1200 + speedRatio * 1800;
      const turboVol = Math.min(0.18, speedRatio * 0.18);
      this.turboOsc.frequency.setTargetAtTime(turboFreq, now, 0.12);
      this.turboGain.gain.setTargetAtTime(turboVol, now, 0.12);
    } else {
      this.turboGain.gain.setTargetAtTime(0, now, 0.15);
    }

    // Air brake blast when brake is pressed while in motion
    if (isBraking && absSpeed > 10 && this.noiseBuffer) {
      this.triggerAirBrakeHiss();
    }
  }

  private triggerAirBrakeHiss() {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || this.isMuted || this.brakeNoiseNode) return;

    this.brakeNoiseNode = this.ctx.createBufferSource();
    this.brakeNoiseNode.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2400, this.ctx.currentTime);

    this.brakeGain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    this.brakeGain.gain.setValueAtTime(0.22, now);
    this.brakeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    this.brakeNoiseNode.connect(filter);
    filter.connect(this.brakeGain);
    this.brakeGain.connect(this.masterGain);

    this.brakeNoiseNode.start(now);
    this.brakeNoiseNode.stop(now + 0.35);

    this.brakeNoiseNode.onended = () => {
      this.brakeNoiseNode = null;
    };
  }

  public dispose() {
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch (_) {}
      this.ctx = null;
    }
  }
}
