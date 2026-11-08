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
  const phone = width < 768 && width <= height;
  const expanded = compact ? projectFrame(width, height, height) : null;
  const w = Math.min(width * .82, height * .54 * 1.5, expanded ? expanded.width * .9 : Infinity);
  const cy = phone && expanded ? expanded.top + expanded.height - w / 3 : height * .48;
  return { left: (width - w) / 2, top: cy - w / 3, width: w, height: w / 1.5 };
}

/** CSS-pixel framing shared by the real mesh and the native fallback. */
export function projectFrame(width: number, height: number, stableHeight: number, aspect = 1.5) {
  const compact = width < 1024 && width <= stableHeight;
  const phone = compact && width < 768;
  const short = !compact && stableHeight < 650;
  // Match the mobile caption/nav budgets in orbit.css; the card's bottom edge
  // stays anchored while it grows, including on short portrait viewports.
  const availableHeight = compact ? Math.max(64, stableHeight - (phone ? stableHeight > 650 ? 460 : 410 : 300)) : stableHeight * (short ? .55 : .64);
  const frameWidth = Math.min(width * (compact ? .94 : short ? .5 : .62), availableHeight * aspect);
  const frameHeight = frameWidth / aspect;
  const cx = width * (compact ? .5 : short ? .68 : .6);
  const topInset = phone ? 144 : 100;
  const bottomInset = phone ? stableHeight > 650 ? 310 : 260 : 200;
  const cy = compact ? Math.max(topInset + frameHeight / 2, Math.min(stableHeight * .42, stableHeight - bottomInset - frameHeight / 2)) : Math.min(height, stableHeight) * .48;
  return { left: cx - frameWidth / 2, top: cy - frameHeight / 2, width: frameWidth, height: frameHeight };
}
