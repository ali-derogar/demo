/** Keep high-density mobile previews readable while bounding full-screen GPU work. */
export function scenePixelRatio(deviceRatio: number, mobile: boolean, level = 0): number {
  const nativeRatio = Number.isFinite(deviceRatio) && deviceRatio > 0 ? deviceRatio : 1;
  const limit = mobile ? level === 0 ? 2 : 1.5 : level === 0 ? 1.5 : level === 1 ? 1.25 : 1;
  return Math.min(nativeRatio, limit);
}

/** Downshift only after warm-up and two sustained slow windows; hidden time is excluded by RAF. */
export class FrameQuality {
  private warmup = 0;
  private samples: number[] = [];
  private slowWindows = 0;
  private level = 0;
  constructor(private mobile: boolean) {}

  sample(delta: number): number | null {
    if (!Number.isFinite(delta) || delta <= 0 || this.level >= (this.mobile ? 1 : 2)) return null;
    if (this.warmup < 2000) { this.warmup += delta; return null; }
    this.samples.push(delta);
    if (this.samples.length < 120) return null;
    this.samples.sort((a, b) => a - b);
    const p90 = this.samples[107];
    this.samples = [];
    this.slowWindows = p90 > (this.mobile ? 36 : 20) ? this.slowWindows + 1 : 0;
    if (this.slowWindows < 2) return null;
    this.slowWindows = 0;
    return ++this.level;
  }
}
