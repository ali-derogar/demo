import { profile } from '../data/profile';
import type { ViewId } from './types';

interface Props { view: ViewId; muted: boolean; onToggleAudio: () => void; }

export function ImmersiveNav({ view, muted, onToggleAudio }: Props) {
  return (
    <>
      <header className="im-nav">
        <a className="im-nav__brand" href="#home" aria-label={profile.brand + ' — خانه'} data-cursor="link"><span dir="ltr">{profile.brand}</span></a>
        <nav className="im-nav__links" aria-label="ناوبری اصلی">
          <a href="#demos" aria-current={view === 'work' ? 'location' : undefined} data-cursor="link">کارها<span aria-hidden="true">↗</span></a>
          <a href="#contact" aria-current={view === 'contact' ? 'location' : undefined} data-cursor="link">تماس<span aria-hidden="true">↗</span></a>
        </nav>
      </header>
      <nav className="im-secondary-nav" aria-label="دسترسی‌های تکمیلی">
        <a href="#about" aria-current={view === 'about' ? 'location' : undefined} data-cursor="link">دربارهٔ من</a><span aria-hidden="true">/</span><span>{profile.location}</span>
      </nav>
      <button type="button" className="im-sound-control" onClick={onToggleAudio} aria-pressed={!muted} aria-label={muted ? 'روشن کردن صدا' : 'خاموش کردن صدا'} data-cursor="link">
        <span className="im-sound-bars" data-muted={muted} aria-hidden="true"><i /><i /><i /><i /></span><span>{muted ? 'صدا خاموش' : 'صدا روشن'}</span>
      </button>
    </>
  );
}
