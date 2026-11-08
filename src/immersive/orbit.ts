import type { DemoCategory, DemoProject } from '../data/projects';
import type { ProjectPresentation } from './projectPresentation';

export interface GallerySnapshot {
  filter: DemoCategory;
  target: number;
  position: number;
  scrollY: number;
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
  onPick?: (index: number) => void;
  presentation?: ProjectPresentation;
  gallery?: {
    capture: () => GallerySnapshot;
    restore: (snapshot: GallerySnapshot) => void;
    forProject: (id: string) => GallerySnapshot;
  };
}

export const ORBIT_RADIUS = 7.6;
export const ORBIT_PITCH = .84;
export const ORBIT_CARD_WIDTH = 5.4;
export const ORBIT_CARD_HEIGHT = 3;
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
  const angle = position * Math.PI / 180 * (portrait ? 35 : 50);
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
  travel: number;
  height: number;
}

/** Use the sticky's stable svh height, never the changing mobile visual viewport. */
export function galleryMetrics(start: number, stickyHeight: number, count: number, reduced = false): GalleryMetrics {
  const viewport = Math.max(1, stickyHeight);
  const entry = reduced || count < 2 ? 0 : viewport * .8;
  const step = reduced ? 0 : viewport * .62;
  const exit = reduced || count < 2 ? 0 : viewport * .3;
  const travel = entry + Math.max(0, count - 1) * step + exit;
  return { start, viewport, count, entry, step, travel, height: viewport + travel };
}

export function projectFromScroll(scrollY: number, metrics: GalleryMetrics): number {
  return clampProject((scrollY - metrics.start - metrics.entry) / Math.max(1, metrics.step), metrics.count);
}

export function scrollForProject(position: number, metrics: GalleryMetrics): number {
  const next = clampProject(position, metrics.count);
  return metrics.start + (next === 0 ? 0 : metrics.entry + next * metrics.step);
}

export function releaseProject(position: number, velocity: number, count: number): number {
  const momentum = Math.max(-.8, Math.min(.8, velocity * .16));
  return Math.round(clampProject(position + momentum, count));
}
