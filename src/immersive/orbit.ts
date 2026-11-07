export interface OrbitMotion {
  target: number;
  position: number;
  dragging: boolean;
  blockClickUntil: number;
}

export const ORBIT_RADIUS = 6.6;
export const ORBIT_PITCH = 1.05;
export const ORBIT_CARD_WIDTH = 4.5;
export const ORBIT_CARD_HEIGHT = 3;

export function clampProject(position: number, count: number): number {
  return Math.max(0, Math.min(Math.max(0, count - 1), position));
}

/** Logical project order is a helix; camera travel follows the same curve. */
export function orbitPose(position: number, count: number) {
  const angle = position * (Math.PI * 2 / Math.max(count, 5));
  return {
    x: Math.sin(angle) * ORBIT_RADIUS,
    y: -position * ORBIT_PITCH,
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
