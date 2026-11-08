export interface ProjectPresentation {
  projectId: string | null;
  phase: 'closed' | 'opening' | 'open' | 'closing';
  progress: number;
  ready: boolean;
  surface: 'pending' | 'webgl' | 'fallback' | 'reduced';
  source?: 'scroll' | 'navigation';
  onFrame?: () => void;
  depth?: number;
  bounds: { left: number; top: number; width: number; height: number } | null;
}

export function createPresentation(): ProjectPresentation {
  return { projectId: null, phase: 'closed', progress: 0, ready: false, surface: 'pending', bounds: null };
}

export function smoothRange(value: number, from: number, to: number) {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

export function galleryCardFrame(width: number, height: number) {
  const w = Math.min(width * .82, height * .54 * 1.5);
  return { left: (width - w) / 2, top: height * .48 - w / 3, width: w, height: w / 1.5 };
}

/** CSS-pixel framing shared by the real mesh and the native fallback. */
export function projectFrame(width: number, height: number, stableHeight: number, aspect = 1.5) {
  const compact = width < 1024 && stableHeight >= 650;
  const short = stableHeight < 650;
  const frameWidth = Math.min(width * (compact ? .9 : short ? .5 : .62), stableHeight * (compact ? .46 : short ? .55 : .64) * aspect);
  const frameHeight = frameWidth / aspect;
  const cx = width * (compact ? .5 : short ? .68 : .6);
  const cy = compact ? Math.max(120 + frameHeight / 2, stableHeight * .35) : Math.min(height, stableHeight) * .48;
  return { left: cx - frameWidth / 2, top: cy - frameHeight / 2, width: frameWidth, height: frameHeight };
}
