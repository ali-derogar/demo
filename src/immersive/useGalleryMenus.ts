import { useEffect, type RefObject } from 'react';

export function closeGalleryMenu(menu: HTMLDetailsElement | null, restoreFocus = true) {
  if (!menu?.open) return;
  menu.open = false;
  if (restoreFocus) menu.querySelector('summary')?.focus({ preventScroll: true });
}

export function useGalleryMenus(container: RefObject<HTMLElement>) {
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const menus = Array.from(root.querySelectorAll('details'));
    const outside = (event: Event) => {
      menus.forEach((menu) => { if (menu.open && !menu.contains(event.target as Node)) closeGalleryMenu(menu); });
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
      const menu = menus.find((item) => item.open);
      if (menu) { event.preventDefault(); closeGalleryMenu(menu); }
    };
    const onToggle = (event: Event) => {
      const active = event.target as HTMLDetailsElement;
      if (active.open) menus.forEach((menu) => { if (menu !== active) closeGalleryMenu(menu, false); });
    };
    menus.forEach((menu) => menu.addEventListener('toggle', onToggle));
    document.addEventListener('pointerdown', outside);
    document.addEventListener('click', outside);
    document.addEventListener('keydown', onKey);
    return () => {
      menus.forEach((menu) => menu.removeEventListener('toggle', onToggle));
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('click', outside);
      document.removeEventListener('keydown', onKey);
    };
  }, [container]);
}
