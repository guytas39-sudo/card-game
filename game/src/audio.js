// Ember & Oath — audio.js: small WebAudio sounds, built from oscillators
// so the game needs no audio files. Everything is guarded: no sound until
// the player has interacted, and mute silences it all.

export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.unlocked = false;
  }

  unlock() {
    if (this.unlocked) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.unlocked = true;
    } catch (err) {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, duration, type, volume, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  playCard() { this.tone(520, 0.12, 'triangle', 0.16); this.tone(780, 0.1, 'sine', 0.1, 0.04); }
  drawCard() { this.tone(880, 0.07, 'sine', 0.08); }
  hit() { this.tone(140, 0.18, 'sawtooth', 0.18); this.tone(90, 0.22, 'square', 0.1, 0.02); }
  block() { this.tone(320, 0.1, 'triangle', 0.12); }
  heal() { this.tone(660, 0.16, 'sine', 0.1); this.tone(990, 0.2, 'sine', 0.08, 0.08); }
  resonance() { this.tone(1040, 0.1, 'sine', 0.1); this.tone(1560, 0.16, 'sine', 0.09, 0.07); }
  turn() { this.tone(440, 0.09, 'triangle', 0.1); }
  win() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.14, i * 0.13));
  }
  lose() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.12, i * 0.15));
  }
}
