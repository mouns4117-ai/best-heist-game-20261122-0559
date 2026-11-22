// Procedural sound: no audio files, just a WebAudio oscillator and a little
// noise, so the game stays a handful of static files.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let alarmOsc = null;
  let alarmGain = null;

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    const c = ensure();
    if (!c || muted) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    unlock() { ensure(); },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopAlarm();
      return muted;
    },
    get muted() { return muted; },
    step(sneak) {
      if (!sneak) tone(90 + Math.random() * 30, 0.05, 'triangle', 0.05);
    },
    pickup(vault) {
      tone(660, 0.12, 'sine', 0.14);
      tone(vault ? 520 : 880, 0.18, 'sine', 0.14, 0.09);
      if (vault) tone(1040, 0.22, 'sine', 0.12, 0.18);
    },
    dash() { tone(300, 0.16, 'sawtooth', 0.05, 0, 120); },
    caught() {
      tone(220, 0.25, 'sawtooth', 0.16, 0, 55);
      tone(110, 0.35, 'square', 0.1, 0.1, 40);
    },
    clear() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.13, i * 0.11));
    },
    win() {
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.3, 'triangle', 0.12, i * 0.13));
    },
    startAlarm() {
      const c = ensure();
      if (!c || muted || alarmOsc) return;
      alarmOsc = c.createOscillator();
      alarmGain = c.createGain();
      alarmOsc.type = 'sine';
      alarmOsc.frequency.setValueAtTime(620, c.currentTime);
      alarmOsc.frequency.linearRampToValueAtTime(880, c.currentTime + 0.5);
      alarmGain.gain.setValueAtTime(0.0001, c.currentTime);
      alarmGain.gain.exponentialRampToValueAtTime(0.045, c.currentTime + 0.1);
      alarmOsc.connect(alarmGain).connect(c.destination);
      alarmOsc.start();
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      lfo.frequency.value = 1.4;
      lfoGain.gain.value = 130;
      lfo.connect(lfoGain).connect(alarmOsc.frequency);
      lfo.start();
      alarmOsc._lfo = lfo;
    },
    stopAlarm() {
      if (alarmOsc) {
        try { alarmOsc._lfo.stop(); alarmOsc.stop(); } catch { /* already stopped */ }
        alarmOsc = null;
        alarmGain = null;
      }
    },
  };
}
