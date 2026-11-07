import type { ViewId } from './types';

/**
 * موتور صدای محیطیِ صفحه: یک درونِ گرم و آرام که با «نفسِ» هسته‌ی صحنه
 * هم‌ضرب است. صدا فقط چیزی را همراهی می‌کند که روی صفحه دیده می‌شود
 * (ضربانِ هسته و ته‌رنگِ هر نما)، نه نویزِ مستقل.
 *
 * موتور پیش‌فرض خاموش است و فقط با انتخاب صریح کلید صدا ساخته می‌شود.
 * حرکت موس، پیمایش و کلیدهای دیگر هیچ صدایی را فعال نمی‌کنند.
 *
 * همه‌ی ساختن‌ها داخل try/catch است؛ اگر WebAudio نباشد، موتور بی‌صدا
 * کار می‌کند و هیچ‌چیز نمی‌شکند.
 */

type AudioCtor = typeof AudioContext;

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

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private oscA: OscillatorNode | null = null;
  private oscB: OscillatorNode | null = null;
  private breath: OscillatorNode | null = null;
  private built = false;
  private failed = false;
  private muted = true;
  private view: ViewId = 'home';

  /** ساختِ گرافِ صوتی؛ فقط یک‌بار و فقط وقتی کاربر اجازه‌ی gesture داده */
  private build() {
    if (this.built || this.failed) return;
    const Ctor = getAudioCtor();
    if (!Ctor) {
      this.failed = true;
      return;
    }
    try {
      const ctx = new Ctor();
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

      this.ctx = ctx;
      this.master = master;
      this.filter = filter;
      this.oscA = oscA;
      this.oscB = oscB;
      this.breath = breath;
      this.built = true;
    } catch {
      this.failed = true;
    }
  }

  /** بلندیِ هدف بر پایه‌ی وضعیتِ خاموش/روشن؛ fade برای جلوگیری از کلیک */
  private applyGain() {
    if (!this.ctx || !this.master) return;
    const target = this.muted ? 0 : 0.05;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(target, now, 0.6);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!muted) {
      this.build();
      if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume().then(() => this.applyGain()).catch(() => {});
    }
    this.applyGain();
  }

  isMuted() {
    return this.muted;
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

  dispose() {
    try {
      this.oscA?.stop();
      this.oscB?.stop();
      this.breath?.stop();
      void this.ctx?.close();
    } catch {
      /* noop */
    }
    this.ctx = null;
    this.master = null;
    this.filter = null;
    this.oscA = null;
    this.oscB = null;
    this.breath = null;
    this.built = false;
  }
}

export const ambient = new AmbientEngine();
