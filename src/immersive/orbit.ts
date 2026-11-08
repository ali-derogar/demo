import type { DemoCategory, DemoProject } from '../data/projects';
import type { ProjectPresentation } from './projectPresentation';

export interface GallerySnapshot {
  filter: DemoCategory;
  target: number;
  position: number;
  scrollY: number;
  viewport?: number;
  start?: number;
}

export interface OrbitMotion {
  items: DemoProject[];
  target: number;
  position: number;
  dragging: boolean;
  blockClickUntil: number;
  ready: boolean;
  labelsReady?: boolean;
  interactive: boolean;
  selectedIndex: number | null;
  selection: number;
  scrollDriven?: boolean;
  bounds?: { left: number; top: number; width: number; height: number };
  reveal?: number;
  onFrame?: () => void;
  onProjectChange?: (id: string | null) => void;
  onPick?: (index: number) => void;
  presentation?: ProjectPresentation;
  gallery?: {
    capture: () => GallerySnapshot;
    restore: (snapshot: GallerySnapshot) => void;
    forProject: (id: string) => GallerySnapshot;
    open: (id: string, immediate?: boolean) => void;
    collapse: () => void;
  };
}

export const ORBIT_RADIUS = 7.6;
export const ORBIT_PITCH = .84;
export const ORBIT_CARD_WIDTH = 4.8;
export const ORBIT_CARD_HEIGHT = 3.2;
export const ORBIT_CURVE_RADIUS = 12;
export const ORBIT_HOVER_BEND = .018;
export const ORBIT_SPEED_BEND = .025;

export function insideOrbitCard(u: number, v: number): boolean {
  const x = Math.abs(u - .5) - .445, y = Math.abs(v - .5) - .445;
  return Math.hypot(Math.max(x, 0), Math.max(y, 0)) + Math.min(Math.max(x, y), 0) - .055 <= .001;
}

export function clampProject(position: number, count: number): number {
  return Math.max(0, Math.min(Math.max(0, count - 1), position));
}

/** Logical project order is a helix; camera travel follows the same curve. */
export function orbitPose(position: number, count: number, portrait = false) {
  const angle = position * Math.PI / 180 * (portrait ? 45 : 50);
  return {
    x: Math.sin(angle) * ORBIT_RADIUS,
    y: -position * (portrait ? 1.12 : ORBIT_PITCH) * Math.min(7, Math.max(1, count)) / 7,
    z: Math.cos(angle) * ORBIT_RADIUS,
    angle,
  };
}

export interface GalleryMetrics {
  start: number;
  viewport: number;
  count: number;
  entry: number;
  step: number;
  opening: number;
  hold: number;
  closing: number;
  passage: number;
  travel: number;
  height: number;
}

/** Use the sticky's stable svh height, never the changing mobile visual viewport. */
export function galleryMetrics(start: number, stickyHeight: number, count: number, _reduced = false): GalleryMetrics {
  const viewport = Math.max(1, stickyHeight);
  const opening = viewport * .3, hold = viewport * .2, closing = viewport * .3, passage = viewport * .4;
  const step = opening + hold + closing + passage;
  const travel = Math.max(0, count - 1) * step + (count ? opening + hold + closing : 0);
  return { start, viewport, count, entry: 0, step, opening, hold, closing, passage, travel, height: viewport + travel };
}

export function projectFromScroll(scrollY: number, metrics: GalleryMetrics): number {
  return galleryFrame(scrollY, metrics).position;
}

export function scrollForProject(position: number, metrics: GalleryMetrics, open = false): number {
  const next = clampProject(position, metrics.count);
  const index = Math.floor(next), fraction = next - index;
  return metrics.start + index * metrics.step + (open ? metrics.opening + metrics.hold / 2 : fraction ? metrics.opening + metrics.hold + metrics.closing + fraction * metrics.passage : 0);
}

/** Pure scroll sampling: reversing and stopping never need a second animation clock. */
export function galleryFrame(scrollY: number, metrics: GalleryMetrics) {
  const local = Math.max(0, Math.min(metrics.travel, scrollY - metrics.start));
  const index = Math.min(Math.max(0, metrics.count - 1), Math.floor(local / metrics.step));
  const within = local - index * metrics.step;
  const end = metrics.opening + metrics.hold + metrics.closing;
  let progress = within < metrics.opening ? within / metrics.opening
    : within <= metrics.opening + metrics.hold ? 1
    : within < end ? 1 - (within - metrics.opening - metrics.hold) / metrics.closing : 0;
  if (progress < 1e-10) progress = 0;
  if (progress > 1 - 1e-10) progress = 1;
  const position = clampProject(index + Math.max(0, within - end) / metrics.passage, metrics.count);
  return { index, position, progress, phase: progress <= 0 ? 'closed' as const : progress >= 1 ? 'open' as const : within < metrics.opening ? 'opening' as const : 'closing' as const };
}
