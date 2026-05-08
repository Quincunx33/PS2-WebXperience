class SoundService {
  private audioCtx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private buffers: Record<string, AudioBuffer> = {};

  init() {
    if (!this.isEnabled) return;
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  enable() { this.isEnabled = true; }
  disable() { this.isEnabled = false; }
  toggle() { this.isEnabled = !this.isEnabled; return this.isEnabled; }
  getEnabled() { return this.isEnabled; }

  private playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1, delay = 0) {
    if (!this.isEnabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const startTime = this.audioCtx.currentTime + (delay || 0);
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      console.warn("Sound play failed", e);
    }
  }

  playHover() {
    this.playTone(440, 'sine', 0.05, 0.02);
  }

  playSelect() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.audioCtx) return;
    this.playTone(880, 'triangle', 0.1, 0.05, 0);
    this.playTone(1174, 'triangle', 0.2, 0.05, 0.05);
  }

  playConfirm() {
    this.playSelect();
  }

  playCancel() {
    this.playTone(220, 'sawtooth', 0.15, 0.04);
  }
  
  playStartup() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.audioCtx) return;
    
    try {
      const duration = 7;
      const gain = this.audioCtx.createGain();
      
      // Synthesis of PS2-like sweeping ambient startup sound
      const numOrbits = 3;
      for (let i = 0; i < numOrbits; i++) {
        const osc = this.audioCtx.createOscillator();
        osc.type = i === 0 ? 'sine' : 'triangle';
        const baseFreq = 55 * Math.pow(2, i); // A1, A2, A3
        
        osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);
        // Slight detune for fullness
        osc.detune.value = i === 1 ? 5 : (i === 2 ? -5 : 0);

        osc.connect(gain);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
      }

      // Filter sweep
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, this.audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2000, this.audioCtx.currentTime + 3);
      filter.frequency.exponentialRampToValueAtTime(500, this.audioCtx.currentTime + 6);
      
      gain.connect(filter);
      filter.connect(this.audioCtx.destination);

      // Volume envelope
      // Start with a small pop/burst
      gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0.1, this.audioCtx.currentTime + 1);
      gain.gain.linearRampToValueAtTime(0.15, this.audioCtx.currentTime + 3); // Swell
      gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + duration); // Fade out

    } catch (e) {
      console.warn("Startup sound failed", e);
    }
  }

  playWhoosh() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.audioCtx) return;
    
    // Noise burst for transition matching PS2 ambient swoosh
    const bufferSize = this.audioCtx.sampleRate * 1.0;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(100, this.audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 1.0);
    
    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 1.0);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    noise.start();
    noise.stop(this.audioCtx.currentTime + 1.0);
  }
}

export const soundService = new SoundService();
