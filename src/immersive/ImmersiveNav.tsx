import { profile } from '../data/profile';
import type { ViewId } from './types';
import type { AudioSnapshot } from './audio';

interface Props { view: ViewId; audio: AudioSnapshot; onToggleAudio: () => void; }

export function ImmersiveNav({ view, audio, onToggleAudio }: Props) {
  const label = audio.phase === 'unavailable' ? 'صدا در دسترس نیست' : !audio.enabled ? 'صدا خاموش'
    : audio.phase === 'playing' ? 'صدا روشن' : audio.phase === 'paused' ? 'صدا متوقف' : 'صدا آمادهٔ پخش';
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
      <button type="button" className="im-sound-control" onClick={onToggleAudio} disabled={audio.phase === 'unavailable'} aria-pressed={audio.enabled} aria-label={audio.phase === 'unavailable' ? label : audio.enabled ? 'خاموش کردن صدا' : 'روشن کردن صدا'} data-audio-control data-cursor="link">
        <span className="im-sound-bars" data-muted={audio.phase !== 'playing'} aria-hidden="true"><i /><i /><i /><i /></span><span>{label}</span>
      </button>
    </>
  );
}
