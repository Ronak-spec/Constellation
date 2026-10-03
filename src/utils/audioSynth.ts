// Web Audio API Harmonic Celestial Synthesizer
class CelestialAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private ambientGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.initContext();
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAmbientPad();
    } else {
      this.startAmbientPad();
      this.playStarTone('A', 1.0, 0.4);
    }
    return !this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public startAmbientPad() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.stopAmbientPad();

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.ambientGain.gain.exponentialRampToValueAtTime(0.06, this.ctx.currentTime + 3);
    this.ambientGain.connect(this.masterGain);

    // Fundamental binaural space hum: 108Hz (deep cosmic octave) and 216Hz + 432Hz
    const freqs = [108, 162, 216, 324];
    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.ambientGain) return;
      const osc = this.ctx.createOscillator();
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);

      if (panner) {
        panner.pan.value = (idx - 1.5) * 0.4;
        osc.connect(panner);
        panner.connect(this.ambientGain);
      } else {
        osc.connect(this.ambientGain);
      }

      osc.start();
      this.oscillators.push(osc);
    });
  }

  public stopAmbientPad() {
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1);
      } catch {
        // ignore
      }
    }
    this.oscillators.forEach(osc => {
      try {
        osc.stop(this.ctx ? this.ctx.currentTime + 1.1 : 0);
      } catch {
        // ignore
      }
    });
    this.oscillators = [];
  }

  // Play a crystal star chime when a star is hovered or selected
  public playStarTone(spectralType: string = 'A', mag: number = 2.0, volume: number = 0.25) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const baseFreqMap: Record<string, number> = {
      O: 880,   // A5 Crystal High
      B: 784,   // G5
      A: 659.25,// E5
      F: 587.33,// D5
      G: 523.25,// C5 Solar Warm
      K: 440,   // A4 Golden
      M: 329.63 // E4 Deep Crimson
    };

    const baseFreq = baseFreqMap[spectralType] || 523.25;
    // Bright stars (mag < 1) sound clearer & resonate longer
    const brightnessMod = Math.max(0.7, 2.5 - mag * 0.25);
    const freq = baseFreq * (1 + (Math.random() * 0.04 - 0.02));

    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = spectralType === 'O' || spectralType === 'B' ? 'sine' : 'triangle';
    subOsc.type = 'sine';

    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    subOsc.frequency.setValueAtTime(freq * 2.005, this.ctx.currentTime); // subtle bell shimmer

    const now = this.ctx.currentTime;
    const dur = 1.2 * brightnessMod;

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.35, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gainNode);
    subOsc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + dur + 0.1);
    subOsc.stop(now + dur + 0.1);
  }

  // Play a celestial arpeggio when a constellation is chosen
  public playConstellationChord(starCount: number = 5) {
    if (this.isMuted) return;
    const notes = [432, 540, 648, 864, 972, 1080, 1296]; // Sacred geometric celestial tuning
    const steps = Math.min(starCount, 7);
    
    for (let i = 0; i < steps; i++) {
      setTimeout(() => {
        if (!this.isMuted) {
          const type = i % 2 === 0 ? 'A' : 'B';
          this.playStarTone(type, 1.5 - i * 0.1, 0.2);
        }
      }, i * 90);
    }
  }
}

export const celestialAudio = new CelestialAudioEngine();
