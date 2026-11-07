import assert from 'node:assert/strict';
import test from 'node:test';
import { source, environment } from './helpers.mjs';

function fakeAudio(w, mode = 'pending') {
  const contexts = [];
  const pending = [];
  const parameter = () => ({ value: 0, cancelScheduledValues() {}, setTargetAtTime(value) { this.value = value; } });
  class AudioContext {
    state = 'suspended'; currentTime = 0; destination = {}; onstatechange = null;
    gains = []; oscillators = []; resumeCalls = 0; closed = 0;
    constructor() { contexts.push(this); }
    createGain() { const node = { gain: parameter(), connect() {} }; this.gains.push(node); return node; }
    createBiquadFilter() { return { frequency: parameter(), Q: parameter(), connect() {} }; }
    createOscillator() { const node = { frequency: parameter(), detune: parameter(), start() {}, stops: 0, stop() { this.stops++; }, connect() {} }; this.oscillators.push(node); return node; }
    resume() {
      this.resumeCalls++;
      if (mode === 'reject') return Promise.reject(new Error('Autoplay denied'));
      return new Promise((resolve) => {
        const run = () => { this.state = 'running'; this.onstatechange?.(); resolve(); };
        if (mode === 'resolve') run(); else pending.push(run);
      });
    }
    suspend() { this.state = 'suspended'; this.onstatechange?.(); return Promise.resolve(); }
    close() { this.closed++; this.state = 'closed'; return Promise.resolve(); }
  }
  w.AudioContext = AudioContext;
  return { contexts, async allow() { pending.splice(0).forEach((resume) => resume()); await Promise.resolve(); await Promise.resolve(); } };
}

test('default audio waits for real playback, remembers mute and keeps async resume muted', async (t) => {
  const env = await environment();
  const fake = fakeAudio(env.w);
  const { AmbientEngine, AUDIO_PREFERENCE_KEY } = await source('src/immersive/audio.ts');
  const engine = new AmbientEngine(); const detach = engine.attach(); t.after(() => { detach(); env.cleanup(); });
  assert.deepEqual(engine.getSnapshot(), { enabled: true, phase: 'pending' });
  assert.equal(fake.contexts.length, 1);
  assert.equal(fake.contexts[0].gains[0].gain.value, 0, 'a suspended context stays silent until playback is confirmed');
  engine.setMuted(true);
  await fake.allow();
  assert.deepEqual(engine.getSnapshot(), { enabled: false, phase: 'muted' });
  assert.equal(fake.contexts[0].gains[0].gain.value, 0);
  assert.equal(env.w.localStorage.getItem(AUDIO_PREFERENCE_KEY), 'false');
  const remembered = new AmbientEngine(); const off = remembered.attach();
  assert.equal(remembered.getSnapshot().enabled, false);
  assert.equal(fake.contexts.length, 1, 'stored mute does not construct another audio graph');
  off();
  engine.setMuted(false);
  assert.equal(engine.getSnapshot().phase, 'playing');
  assert.equal(fake.contexts[0].gains[0].gain.value, .05);
  assert.equal(env.w.localStorage.getItem(AUDIO_PREFERENCE_KEY), 'true');
});

test('trusted interaction unlocks pending autoplay, while the mute button never unlocks it', async (t) => {
  const env = await environment();
  const fake = fakeAudio(env.w);
  const handlers = new Map();
  const add = env.w.addEventListener.bind(env.w);
  env.w.addEventListener = (name, handler, options) => { handlers.set(name, handler); add(name, handler, options); };
  const { AmbientEngine } = await source('src/immersive/audio.ts');
  const engine = new AmbientEngine(); const detach = engine.attach(); t.after(() => { detach(); env.cleanup(); });
  const button = document.createElement('button'); button.setAttribute('data-audio-control', ''); document.body.append(button);
  handlers.get('click')({ isTrusted: true, target: button });
  assert.equal(fake.contexts[0].resumeCalls, 1);
  handlers.get('click')({ isTrusted: false, target: document.body });
  assert.equal(fake.contexts[0].resumeCalls, 1);
  handlers.get('click')({ isTrusted: true, target: document.body });
  assert.equal(fake.contexts[0].resumeCalls, 2, 'pending autoplay does not swallow a subsequent user gesture');
  await fake.allow();
  assert.equal(engine.getSnapshot().phase, 'playing');
});

test('visibility suspends audio and respects a muted preference on return', async (t) => {
  const env = await environment();
  let hidden = false; Object.defineProperty(document, 'hidden', { get: () => hidden, configurable: true });
  const fake = fakeAudio(env.w, 'resolve');
  const { AmbientEngine } = await source('src/immersive/audio.ts');
  const engine = new AmbientEngine(); const detach = engine.attach(); t.after(() => { detach(); env.cleanup(); });
  assert.equal(engine.getSnapshot().phase, 'playing');
  hidden = true; document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(engine.getSnapshot().phase, 'paused');
  assert.equal(fake.contexts[0].state, 'suspended');
  hidden = false; document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(engine.getSnapshot().phase, 'playing');
  engine.setMuted(true);
  hidden = true; document.dispatchEvent(new Event('visibilitychange'));
  const resumes = fake.contexts[0].resumeCalls;
  hidden = false; document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(engine.getSnapshot().phase, 'muted');
  assert.equal(fake.contexts[0].resumeCalls, resumes);
});

test('resume rejection, missing WebAudio and denied storage are safe', async (t) => {
  const env = await environment(); t.after(() => env.cleanup());
  fakeAudio(env.w, 'reject');
  const { AmbientEngine } = await source('src/immersive/audio.ts');
  const engine = new AmbientEngine(); const detach = engine.attach();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(engine.getSnapshot().phase, 'pending'); detach();
  delete env.w.AudioContext;
  Object.defineProperty(env.w, 'localStorage', { get() { throw new Error('Storage denied'); }, configurable: true });
  const unavailable = new AmbientEngine(); const off = unavailable.attach();
  assert.equal(unavailable.getSnapshot().phase, 'unavailable');
  assert.doesNotThrow(() => unavailable.setMuted(true)); off();
});

test('StrictMode-style setup/cleanup invalidates stale resumes and releases all oscillators', async (t) => {
  const env = await environment(); t.after(() => env.cleanup());
  const fake = fakeAudio(env.w);
  const { AmbientEngine } = await source('src/immersive/audio.ts');
  const engine = new AmbientEngine();
  const first = engine.attach(); first();
  assert.equal(fake.contexts[0].closed, 1);
  assert.ok(fake.contexts[0].oscillators.every((oscillator) => oscillator.stops === 1));
  const second = engine.attach();
  assert.equal(fake.contexts.length, 2);
  await fake.allow();
  assert.equal(engine.getSnapshot().phase, 'playing');
  second(); engine.dispose();
  assert.equal(fake.contexts[1].closed, 1);
});

test('a delayed suspension cannot silence an enabled tab after a rapid return', async (t) => {
  const env = await environment();
  let hidden = false; Object.defineProperty(document, 'hidden', { get: () => hidden, configurable: true });
  const fake = fakeAudio(env.w, 'resolve');
  const { AmbientEngine } = await source('src/immersive/audio.ts');
  const engine = new AmbientEngine(); const detach = engine.attach(); t.after(() => { detach(); env.cleanup(); });
  const ctx = fake.contexts[0]; let finishSuspension;
  ctx.suspend = () => new Promise((resolve) => { finishSuspension = () => { ctx.state = 'suspended'; ctx.onstatechange?.(); resolve(); }; });
  hidden = true; document.dispatchEvent(new Event('visibilitychange'));
  hidden = false; document.dispatchEvent(new Event('visibilitychange'));
  finishSuspension(); await Promise.resolve(); await Promise.resolve();
  assert.equal(engine.getSnapshot().phase, 'playing');
});
