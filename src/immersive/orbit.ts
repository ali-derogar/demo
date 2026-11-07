import type { DemoProject } from '../data/projects';

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
}

export const ORBIT_RADIUS = 3.8;
export const ORBIT_PITCH = .84;
export const ORBIT_CARD_WIDTH = 5.4;
export const ORBIT_CARD_HEIGHT = 3;
export const ORBIT_CURVE_RADIUS = 12;

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

export function projectFromScroll(scrollY: number, start: number, travel: number, count: number): number {
  return clampProject((scrollY - start) / Math.max(1, travel) * (count - 1), count);
}

export function scrollForProject(position: number, start: number, travel: number, count: number): number {
  return start + clampProject(position, count) / Math.max(1, count - 1) * travel;
}

export function releaseProject(position: number, velocity: number, count: number): number {
  const momentum = Math.max(-.8, Math.min(.8, velocity * .16));
  return Math.round(clampProject(position + momentum, count));
}
