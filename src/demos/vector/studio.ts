export type StudioTheme = 'core' | 'drift' | 'shell';
export const studioThemes: StudioTheme[] = ['core', 'drift', 'shell'];
export const capsules = [
  { theme: 'core' as const, product: 'hoodie-03', node: 'CORE', label: 'CORE', position: [.7, .76, -.10], yaw: -.12 },
  { theme: 'drift' as const, product: 'hoodie-01', node: 'DRIFT', label: 'DRIFT', position: [0, .76, 0], yaw: 0 },
  { theme: 'shell' as const, product: 'jacket-01', node: 'SHELL', label: 'SHELL', position: [-.7, .76, -.10], yaw: .12 },
];
export const studioPalette = { core: '#34382f', drift: '#33252b', shell: '#232e30' };
export function capsuleFor(id: string | null) { return capsules.find((c) => c.product === id); }
export function storyProgress(scroll: number, top: number, height: number, viewport: number) { return Math.max(0, Math.min(1, (scroll - top) / Math.max(1, height - viewport))); }
export function range(value: number, from: number, to: number) { return Math.max(0, Math.min(1, (value - from) / (to - from))); }
export function storyPose(progress: number, compact: boolean) {
  const first = range(progress, .04, .24), turn = range(progress, .19, .74), last = range(progress, .77, .94);
  return { first, turn, last, roomY: first * 1.5, shirtYaw: first * Math.PI / 2,
    detailY: .76, detailYaw: Math.PI / 8 - Math.PI * 2 * turn,
    detailPitch: .08 * (1 - range(turn, 0, .2)), detailScale: compact ? .95 : 1.35 - .2 * range(turn, .75, .92),
  };
}
