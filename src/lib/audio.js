let audioContext = null;

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) audioContext = new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function masterGain(ctx, settings, level = 1) {
  const gain = ctx.createGain();
  const volume = Math.max(0, Math.min(1, settings.volume / 100));
  gain.gain.value = volume * level;
  gain.connect(ctx.destination);
  return gain;
}

function tone(ctx, destination, frequency, start, duration, type = "sine", volume = 0.4) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise(ctx, destination, start, duration, volume = 0.3, filterFrequency = 1800) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = filterFrequency;
  filter.Q.value = 0.8;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(start);
  source.stop(start + duration);
}

export function playSfx(name, settings) {
  const ctx = getAudioContext();
  if (!ctx || settings.volume <= 0) return;
  const now = ctx.currentTime;
  const out = masterGain(ctx, settings, 0.8);

  if (name === "unlock") {
    tone(ctx, out, 420, now, 0.08, "triangle", 0.22);
    tone(ctx, out, 760, now + 0.08, 0.11, "triangle", 0.25);
    tone(ctx, out, 1080, now + 0.18, 0.18, "sine", 0.18);
    noise(ctx, out, now + 0.03, 0.12, 0.08, 3200);
    return;
  }

  if (name === "rustle") {
    noise(ctx, out, now, 0.18, 0.17, 1200);
    noise(ctx, out, now + 0.12, 0.2, 0.12, 2200);
    tone(ctx, out, 130, now + 0.04, 0.12, "sawtooth", 0.05);
    return;
  }

  if (name === "pickup") {
    tone(ctx, out, 520, now, 0.08, "triangle", 0.18);
    tone(ctx, out, 920, now + 0.06, 0.12, "sine", 0.22);
    return;
  }

  if (name === "wood") {
    tone(ctx, out, 110, now, 0.08, "square", 0.09);
    noise(ctx, out, now, 0.16, 0.12, 650);
    return;
  }

  if (name === "drawer") {
    noise(ctx, out, now, 0.24, 0.12, 900);
    tone(ctx, out, 170, now + 0.18, 0.08, "square", 0.08);
    return;
  }

  if (name === "fail") {
    tone(ctx, out, 160, now, 0.15, "triangle", 0.16);
    tone(ctx, out, 118, now + 0.12, 0.18, "triangle", 0.12);
    return;
  }

  if (name === "inspect") {
    tone(ctx, out, 680, now, 0.05, "sine", 0.08);
    tone(ctx, out, 760, now + 0.05, 0.08, "sine", 0.08);
    return;
  }

  tone(ctx, out, 320, now, 0.06, "triangle", 0.1);
}
