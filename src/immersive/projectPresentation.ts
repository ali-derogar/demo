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
  const compact = width < 1024 && width <= height;
  const w = Math.min(width * .82, height * .54 * 1.5, compact ? projectFrame(width, height, height).width * .9 : Infinity);
  return { left: (width - w) / 2, top: height * .48 - w / 3, width: w, height: w / 1.5 };
}

/** CSS-pixel framing shared by the real mesh and the native fallback. */
export function projectFrame(width: number, height: number, stableHeight: number, aspect = 1.5) {
  const compact = width < 1024 && width <= stableHeight;
  const short = !compact && stableHeight < 650;
  // Portrait phones reserve 100px for navigation, 112px for the compact
  // description/actions, a 16px gap and 72px for the bottom navigation.
  const availableHeight = compact ? Math.max(64, stableHeight - 300) : stableHeight * (short ? .55 : .64);
  const frameWidth = Math.min(width * (compact ? .94 : short ? .5 : .62), availableHeight * aspect);
  const frameHeight = frameWidth / aspect;
  const cx = width * (compact ? .5 : short ? .68 : .6);
  const cy = compact ? Math.max(100 + frameHeight / 2, Math.min(stableHeight * .42, stableHeight - 200 - frameHeight / 2)) : Math.min(height, stableHeight) * .48;
  return { left: cx - frameWidth / 2, top: cy - frameHeight / 2, width: frameWidth, height: frameHeight };
}
