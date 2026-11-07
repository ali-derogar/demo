export type ViewId = 'home' | 'work' | 'about' | 'contact';
export type PanelId = 'about' | 'contact';

export const NAV_ITEMS: { id: ViewId; anchor: string; label: string }[] = [
  { id: 'home', anchor: 'home', label: 'خانه' },
  { id: 'work', anchor: 'demos', label: 'کارها' },
  { id: 'about', anchor: 'about', label: 'درباره' },
  { id: 'contact', anchor: 'contact', label: 'تماس' },
];

/** One mutable timeline for the camera, particles, gallery and overlay mood. */
export interface SceneProgress {
  chapter: ViewId;
  position: number;
  progress: number;
  workBlend: number;
  overlay: PanelId | null;
}
