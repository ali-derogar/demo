export function mountSoundtrack(audio, button) {
  const document = audio.ownerDocument, window = document.defaultView;
  let wanted = true;
  try { wanted = window.localStorage.getItem('vector-sound-v1') !== 'off'; } catch {}
  let disposed = false, unlocked = false, playing = false, pending = false, generation = 0, pageHidden = false;
  audio.loop = true; audio.volume = .3;
  const suspended = () => document.hidden || pageHidden;
  function sync() {
    button.dataset.sound = playing ? 'on' : wanted ? 'pending' : 'off';
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing || pending ? 'قطع موسیقی' : 'پخش موسیقی');
    button.title = playing ? 'قطع موسیقی' : 'پخش موسیقی';
    document.documentElement.dataset.sound = playing ? 'on' : 'off';
  }
  function save() { try { window.localStorage.setItem('vector-sound-v1', wanted ? 'on' : 'off'); } catch {} }
  async function play() {
    if (disposed || suspended() || !wanted || pending || playing) return;
    const token = ++generation; pending = true; sync();
    try {
      await audio.play();
      if (disposed || !wanted || suspended()) { audio.pause(); return; }
      if (token !== generation) return;
      unlocked = true; playing = true;
    } catch { if (token === generation) playing = false; }
    finally { if (token === generation) { pending = false; sync(); } }
  }
  function pause() { generation++; pending = false; playing = false; audio.pause(); sync(); }
  function toggle() {
    if (playing || pending) { wanted = false; save(); pause(); }
    else { wanted = true; unlocked = true; save(); play(); }
  }
  function gesture(event) {
    if (!event.isTrusted || event.target?.closest?.('[data-action="sound"]')) return;
    unlocked = true; if (wanted) play();
  }
  function visibility() { if (suspended()) pause(); else if (wanted && unlocked) play(); }
  function hide() { pageHidden = true; pause(); }
  function show() { pageHidden = false; visibility(); }
  function overlay(event) { audio.volume = event.detail.open ? .14 : .3; }
  function onPause() { playing = false; sync(); }
  function onError() { pending = false; playing = false; sync(); }
  button.addEventListener('click', toggle);
  document.addEventListener('pointerdown', gesture, { passive: true }); document.addEventListener('keydown', gesture);
  document.addEventListener('visibilitychange', visibility); document.addEventListener('vector:overlay', overlay);
  window.addEventListener('pagehide', hide); window.addEventListener('pageshow', show);
  audio.addEventListener('pause', onPause); audio.addEventListener('error', onError);
  sync(); if (wanted) play();
  return { toggle, getState: () => ({ wanted, playing, pending, unlocked }), dispose() {
    if (disposed) return; disposed = true; pause();
    button.removeEventListener('click', toggle); document.removeEventListener('pointerdown', gesture); document.removeEventListener('keydown', gesture);
    document.removeEventListener('visibilitychange', visibility); document.removeEventListener('vector:overlay', overlay);
    window.removeEventListener('pagehide', hide); window.removeEventListener('pageshow', show); audio.removeEventListener('pause', onPause); audio.removeEventListener('error', onError);
  } };
}
