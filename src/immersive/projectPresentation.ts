export interface ProjectPresentation {
  projectId: string | null;
  phase: 'closed' | 'opening' | 'open' | 'closing';
  progress: number;
  ready: boolean;
  surface: 'pending' | 'webgl' | 'fallback' | 'reduced';
  depth?: number;
  bounds: { left: number; top: number; width: number; height: number } | null;
}

export function createPresentation(): ProjectPresentation {
  return { projectId: null, phase: 'closed', progress: 0, ready: false, surface: 'pending', bounds: null };
}

export function advancePresentation(state: ProjectPresentation, dt: number, reduced = false) {
  if (state.phase === 'opening') {
    state.progress = reduced ? 1 : Math.min(1, state.progress + dt / 1.5);
    if (state.progress === 1) state.phase = 'open';
  } else if (state.phase === 'closing') {
    state.progress = reduced ? 0 : Math.max(0, state.progress - dt / 1.5);
    if (state.progress === 0) { state.phase = 'closed'; state.projectId = null; state.ready = false; state.bounds = null; }
  }
}

export function smoothRange(value: number, from: number, to: number) {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

/** CSS-pixel framing shared by the real mesh and the native fallback. */
export function projectFrame(width: number, height: number, stableHeight: number, aspect = 1.5) {
  const compact = width < 1024 && height >= 650;
  const short = height < 650;
  const frameWidth = Math.min(width * (compact ? .9 : short ? .5 : .62), stableHeight * (compact ? .46 : short ? .55 : .64) * aspect);
  const frameHeight = frameWidth / aspect;
  const cx = width * (compact ? .5 : short ? .68 : .6);
  const cy = compact ? Math.max(120 + frameHeight / 2, stableHeight * .35) : height * .48;
  return { left: cx - frameWidth / 2, top: cy - frameHeight / 2, width: frameWidth, height: frameHeight };
}
