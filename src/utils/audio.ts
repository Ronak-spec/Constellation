class ConstellationAudio {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  chime(freqs: number[], gainPeak: number = 0.06) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      freqs.forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;

        const startTime = now + i * 0.06;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.9);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1);
      });
    } catch {
      // Audio not permitted or unavailable, fail silently
    }
  }

  chimeAddStar() {
    this.chime([587, 880], 0.05);
  }

  chimeBury() {
    this.chime([330, 440], 0.045);
  }

  chimeConnect() {
    this.chime([392, 494, 587], 0.04);
  }

  chimeCloseNight() {
    this.chime([440, 660, 880], 0.06);
  }

  chimeLightTask() {
    this.chime([880, 1174], 0.055);
  }
}

export const audio = new ConstellationAudio();
