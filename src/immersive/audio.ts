import type { ViewId } from './types';

/**
 * موتور صدای محیطیِ صفحه: یک درونِ گرم و آرام که با «نفسِ» هسته‌ی صحنه
 * هم‌ضرب است. صدا فقط چیزی را همراهی می‌کند که روی صفحه دیده می‌شود
 * (ضربانِ هسته و ته‌رنگِ هر نما)، نه نویزِ مستقل.
 *
 * ترجیح کاربر و وضعیت واقعی AudioContext جدا هستند. صدا در اولین ورود
 * فعال است؛ اگر autoplay مسدود باشد، اولین تعامل معتبر آن را آزاد می‌کند.
 *
 * همه‌ی ساختن‌ها داخل try/catch است؛ اگر WebAudio نباشد، موتور بی‌صدا
 * کار می‌کند و هیچ‌چیز نمی‌شکند.
 */

type AudioCtor = typeof AudioContext;
export type AudioPhase = 'pending' | 'playing' | 'paused' | 'muted' | 'unavailable';
export interface AudioSnapshot { enabled: boolean; phase: AudioPhase; }
export const AUDIO_PREFERENCE_KEY = 'persianbotyar:audio-enabled';

function readPreference() {
  try { return window.localStorage.getItem(AUDIO_PREFERENCE_KEY) !== 'false'; }
  catch { return true; }
}

function getAudioCtor(): AudioCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** ته‌رنگِ صوتیِ هر نما: بسامدِ پایه و گشودگیِ فیلتر */
const VIEW_VOICE: Record<ViewId, { base: number; cutoff: number }> = {
  home: { base: 55, cutoff: 520 },
  work: { base: 49, cutoff: 420 },
  about: { base: 62, cutoff: 600 },
  contact: { base: 58, cutoff: 700 },
};

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private oscA: OscillatorNode | null = null;
  private oscB: OscillatorNode | null = null;
  private breath: OscillatorNode | null = null;
  private built = false;
  private failed = false;
  private enabled = readPreference();
  private view: ViewId = 'home';
  private generation = 0;
  private listeners = new Set<() => void>();
  private snapshot: AudioSnapshot = { enabled: this.enabled, phase: this.enabled ? 'pending' : 'muted' };

  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };

  private publish = () => {
    const phase: AudioPhase = this.failed ? 'unavailable' : !this.enabled ? 'muted'
      : document.hidden ? 'paused' : this.ctx?.state === 'running' ? 'playing' : 'pending';
    if (this.snapshot.enabled === this.enabled && this.snapshot.phase === phase) return;
    this.snapshot = { enabled: this.enabled, phase };
    this.listeners.forEach((listener) => listener());
  };

  /** ساختِ گرافِ صوتی؛ autoplay ممکن است Context را تا اولین تعامل معلق نگه دارد. */
  private build() {
    if (this.built || this.failed) return;
    const Ctor = getAudioCtor();
    if (!Ctor) {
      this.failed = true;
      return;
    }
    try {
      const ctx = new Ctor();
      this.ctx = ctx;
      ctx.onstatechange = this.onStateChange;
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = VIEW_VOICE[this.view].cutoff;
      filter.Q.value = 0.7;
      filter.connect(master);

      const voice = ctx.createGain();
      voice.gain.value = 0.5;
      voice.connect(filter);

      const oscA = ctx.createOscillator();
      oscA.type = 'sine';
      oscA.frequency.value = VIEW_VOICE[this.view].base;
      oscA.connect(voice);

      const oscB = ctx.createOscillator();
      oscB.type = 'triangle';
      oscB.frequency.value = VIEW_VOICE[this.view].base * 1.5;
      oscB.detune.value = 6;
      const bGain = ctx.createGain();
      bGain.gain.value = 0.32;
      oscB.connect(bGain);
      bGain.connect(voice);

      // نفسِ هسته: یک LFOِ بسیار کند (~۵.۷ ثانیه، هم‌دوره با sin(t*0.0011) صحنه)
      // که بلندیِ صدا را آرام بالا و پایین می‌برد.
      const breath = ctx.createOscillator();
      breath.type = 'sine';
      breath.frequency.value = 0.175;
      const breathGain = ctx.createGain();
      breathGain.gain.value = 0.16;
      breath.connect(breathGain);
      breathGain.connect(voice.gain);

      oscA.start();
      oscB.start();
      breath.start();

      this.master = master;
      this.filter = filter;
      this.oscA = oscA;
      this.oscB = oscB;
      this.breath = breath;
      this.built = true;
    } catch {
      this.clearGraph();
      this.failed = true;
    }
  }

  private onStateChange = () => {
    if (this.ctx?.state === 'closed') this.failed = true;
    this.applyGain(); this.publish();
  };

  /** A pending autoplay resume must never prevent a new resume inside a gesture. */
  unlock = () => {
    if (!this.enabled || document.hidden) { this.publish(); return; }
    this.build();
    const ctx = this.ctx;
    const generation = this.generation;
    if (ctx && ctx.state !== 'running' && ctx.state !== 'closed') {
      void ctx.resume().then(() => {
        if (generation !== this.generation || ctx !== this.ctx) return;
        this.applyGain(); this.publish();
      }).catch(() => { if (generation === this.generation) this.publish(); });
    }
    this.applyGain();
    this.publish();
  };

  attach() {
    const onGesture = (event: Event) => {
      if (!event.isTrusted || (event.target as Element | null)?.closest?.('[data-audio-control]')) return;
      if (event instanceof KeyboardEvent && (event.repeat || event.metaKey || event.ctrlKey || event.altKey || ['Escape', 'Shift', 'Control', 'Alt', 'Meta'].includes(event.key))) return;
      if (this.snapshot.phase === 'pending') this.unlock();
    };
    const onVisibility = () => {
      if (document.hidden) {
        this.applyGain();
        const ctx = this.ctx;
        void ctx?.suspend().then(() => {
          // A rapid tab switch can finish suspension after the visible resume.
          if (ctx === this.ctx && ctx.state === 'suspended' && this.enabled && !document.hidden) this.unlock();
        }).catch(() => {});
        this.publish();
      } else this.unlock();
    };
    window.addEventListener('click', onGesture, true);
    window.addEventListener('keydown', onGesture, true);
    document.addEventListener('visibilitychange', onVisibility);
    this.unlock();
    return () => {
      window.removeEventListener('click', onGesture, true);
      window.removeEventListener('keydown', onGesture, true);
      document.removeEventListener('visibilitychange', onVisibility);
      this.dispose();
    };
  }

  /** بلندیِ هدف بر پایه‌ی وضعیتِ خاموش/روشن؛ fade برای جلوگیری از کلیک */
  private applyGain() {
    if (!this.ctx || !this.master) return;
    const target = !this.enabled || document.hidden || this.ctx.state !== 'running' ? 0 : 0.05;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(target, now, 0.6);
  }

  setMuted(muted: boolean) {
    this.enabled = !muted;
    try { window.localStorage.setItem(AUDIO_PREFERENCE_KEY, String(this.enabled)); } catch { /* Storage can be denied. */ }
    if (this.enabled) this.unlock();
    this.applyGain();
    this.publish();
  }

  isMuted() {
    return !this.enabled;
  }

  /** تغییرِ نرمِ ته‌رنگِ صوتی با تغییرِ نما */
  setView(view: ViewId) {
    this.view = view;
    if (!this.ctx || !this.filter || !this.oscA || !this.oscB) return;
    const { base, cutoff } = VIEW_VOICE[view];
    const now = this.ctx.currentTime;
    this.filter.frequency.setTargetAtTime(cutoff, now, 0.8);
    this.oscA.frequency.setTargetAtTime(base, now, 0.8);
    this.oscB.frequency.setTargetAtTime(base * 1.5, now, 0.8);
  }

  private clearGraph() {
    for (const oscillator of [this.oscA, this.oscB, this.breath]) {
      try { oscillator?.stop(); } catch { /* Already stopped. */ }
    }
    if (this.ctx) { this.ctx.onstatechange = null; void this.ctx.close().catch(() => {}); }
    this.ctx = null;
    this.master = null;
    this.filter = null;
    this.oscA = null;
    this.oscB = null;
    this.breath = null;
    this.built = false;
  }

  dispose() {
    this.generation++;
    this.clearGraph();
    this.failed = false;
    this.publish();
  }
}

export const ambient = new AmbientEngine();
