import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { source, environment } from './helpers.mjs';

async function app(t, options) {
  const env = await environment(options);
  const { prepareNavigation } = await source('src/immersive/navigationStartup.ts');
  prepareNavigation();
  const { default: App } = await source('src/App.tsx');
  const root = createRoot(env.q('#root'));
  env.action = async (callback) => { await act(async () => { await callback(); await env.settle(); }); };
  t.after(async () => { try { await env.action(() => root.unmount()); assert.deepEqual(env.errors, []); } finally { env.cleanup(); } });
  await env.action(() => root.render(React.createElement(React.StrictMode, null, React.createElement(App))));
  return env;
}

for (const width of [390, 768, 1440]) {
  for (const [hash, scroll] of [['#home', 0], ['#demos', 1393], ['#demos', 3000], ['#demos', 4900], ['#about', 3000], ['#contact', 3000], ['#work/store', 3100]]) {
    test(`refresh ${hash} at ${scroll}px / ${width}px starts at home`, async (t) => {
      const env = await app(t, { type: 'reload', hash, scroll, width, saved: { imScroll: scroll, imPanel: true, other: 'keep' } });
      assert.equal(location.hash, '#home');
      assert.equal(location.pathname, '/portfolio/');
      assert.equal(location.search, '?lang=fa');
      assert.equal(history.length, 1);
      assert.equal(history.state.other, 'keep');
      assert.equal(history.state.imScroll, undefined); assert.equal(history.state.imPanel, undefined);
      assert.equal(env.scroll, 0);
      assert.equal(env.q('dialog').open, false);
      assert.equal(env.q('.im-experience').dataset.chapter, 'home');
      assert.equal(env.q('.im-orbit__scrubber input').value, '0');
      await env.action(() => { env.w.scrollTo({ top: 2600 }); env.resolveFonts(); env.w.dispatchEvent(new Event('resize')); env.setReduced(true); });
      assert.equal(env.scroll, 2600, 'late fonts, media changes and resize do not restart navigation');
    });
  }
}

for (const hash of ['#demos', '#about', '#contact']) {
  test(`direct ${hash} is honored despite a stale saved position`, async (t) => {
    const env = await app(t, { hash, saved: { imScroll: 3100 } });
    assert.equal(location.hash, hash);
    assert.equal(env.q('dialog').open, hash !== '#demos');
    if (hash === '#demos') assert.equal(env.scroll, env.workTop);
    else {
      await env.action(() => env.q('.im-info-panel__close').click());
      assert.equal(location.hash, '#home');
      assert.equal(env.scroll, 0);
    }
  });
}

test('Back/Forward, modal focus and bfcache retain the exact gallery position', async (t) => {
  const env = await app(t, { hash: '#demos', type: 'back_forward', saved: { imScroll: 3100 } });
  assert.equal(env.scroll, 3100);
  const opener = env.q('a[href="#contact"]');
  opener.focus();
  await env.action(() => opener.click());
  assert.equal(env.q('dialog').open, true);
  assert.equal(document.activeElement, env.q('.im-info-panel__close'));
  await env.action(() => env.q('.im-info-panel__close').dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })));
  assert.ok(env.q('dialog').contains(document.activeElement));
  await env.action(() => env.q('.im-info-panel__close').click());
  assert.equal(env.scroll, 3100);
  assert.equal(document.activeElement, opener);
  await env.action(() => history.forward());
  assert.equal(env.q('dialog').open, true);
  await env.action(() => env.q('dialog').dispatchEvent(new Event('cancel', { cancelable: true })));
  assert.equal(env.q('dialog').open, false);
  assert.equal(env.scroll, 3100);
  await env.action(() => env.w.dispatchEvent(new env.w.PageTransitionEvent('pagehide', { persisted: true })));
  assert.equal(history.state.imScroll, 3100);
  await env.action(() => env.w.dispatchEvent(new env.w.PageTransitionEvent('pageshow', { persisted: true })));
  assert.equal(env.scroll, 3100);
});

test('Back then Forward restores a scrolled gallery without visiting a modal', async (t) => {
  const env = await app(t, { hash: '#home' });
  await env.action(() => env.q('a[href="#demos"]').click());
  await env.action(() => env.w.scrollTo({ top: 3150 }));
  await env.action(() => history.back());
  assert.equal(location.hash, '#home'); assert.equal(env.scroll, 0);
  await env.action(() => history.forward());
  assert.equal(location.hash, '#demos'); assert.equal(env.scroll, 3150);
});

test('gallery menus, keyboard, cancelled touch, filtering and all nine demo links', async (t) => {
  const env = await app(t, { hash: '#demos' });
  const links = [...document.querySelectorAll('.im-orbit__project-link')];
  assert.equal(new Set(links.map((link) => link.href)).size, 9);
  links.forEach((link) => { assert.match(link.getAttribute('href'), /^\/demos\/\w+\/$/); assert.equal(link.target, '_blank'); });
  const stage = env.q('.im-orbit__stage');
  await env.action(() => stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })));
  assert.equal(env.q('input[type="range"]').value, '1');
  const pointer = (type, x, y, buttons = 1) => {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, buttons, clientX: x, clientY: y, button: 0 });
    Object.defineProperties(event, { pointerId: { value: 7 }, pointerType: { value: 'touch' } }); stage.dispatchEvent(event);
  };
  const before = env.scroll;
  await env.action(() => { pointer('pointerdown', 300, 300); pointer('pointermove', 303, 350); pointer('pointercancel', 303, 350, 0); });
  assert.equal(env.scroll, before);
  await env.action(() => { pointer('pointerdown', 300, 300); pointer('pointermove', 100, 302); pointer('pointercancel', 100, 302, 0); });
  assert.equal(env.q('input[type="range"]').value, '2');
  const filters = env.q('.im-orbit__filters');
  await env.action(() => { filters.open = true; filters.querySelector('summary').focus(); });
  await env.action(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })));
  assert.equal(filters.open, false); assert.equal(document.activeElement, filters.querySelector('summary'));
  await env.action(() => { filters.open = true; });
  await env.action(() => stage.dispatchEvent(new Event('pointerdown', { bubbles: true })));
  assert.equal(filters.open, false);
  await env.action(() => { filters.open = true; });
  await env.action(() => [...document.querySelectorAll('.im-filter')].find((button) => button.textContent === 'مد و پوشاک').click());
  assert.equal(filters.open, false); assert.equal(document.activeElement, stage);
  assert.equal(document.querySelectorAll('.im-orbit__project-link').length, 1);
  assert.equal(env.q('button[aria-label="پروژهٔ بعدی"]').disabled, true);
  assert.equal(env.q('.im-orbit__fallback a').getAttribute('href'), '/demos/fashion/');
  await env.action(() => env.q('.im-orbit__fallback img').dispatchEvent(new Event('error')));
  assert.ok(env.q('.im-orbit__image-error'));
  assert.equal(env.q('.im-orbit__fallback img').hidden, true);
});

test('startup handles repeated refresh and legacy navigation APIs without adding history entries', async (t) => {
  const env = await environment({ hash: '#contact', saved: { imScroll: 4000, imPanel: true, custom: 7 }, scroll: 4000 });
  t.after(() => env.cleanup());
  const { prepareNavigation, navigationType } = await source('src/immersive/navigationStartup.ts');
  env.w.performance.getEntriesByType = undefined;
  Object.defineProperty(env.w.performance, 'navigation', { value: { type: 1 }, configurable: true });
  assert.equal(navigationType(), 'reload');
  prepareNavigation(); prepareNavigation();
  assert.equal(env.scroll, 0); assert.equal(location.hash, '#home'); assert.equal(history.length, 1);
  assert.deepEqual(history.state, { custom: 7 });
  delete env.w.performance.navigation;
  assert.equal(navigationType(), 'navigate');
});

test('all nine projects enter a routed presentation, then open their native demo link', async (t) => {
  const env = await app(t, { hash: '#demos', reduced: true });
  const stage = env.q('.im-orbit__stage');
  const click = (element, options = {}) => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...options });
    element.dispatchEvent(event); return event;
  };
  for (let i = 0; i < 9; i++) {
    if (i) await env.action(() => stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })));
    const link = env.q('.im-orbit__captions li:not([hidden]) a'); let first, second;
    const y = env.scroll;
    link.focus();
    await env.action(() => { first = click(link); });
    assert.equal(first.defaultPrevented, true);
    assert.match(location.hash, /^#work\//);
    assert.equal(env.scroll, y, 'opening does not change the saved gallery scroll');
    const presentation = env.q('.im-project'); assert.ok(presentation);
    assert.equal(env.q('#im-main').hasAttribute('inert'), true);
    assert.equal(document.querySelectorAll('canvas').length, 1, 'there is only one shared scene surface');
    const entry = env.q('.im-project__hitarea');
    assert.equal(entry.getAttribute('href'), link.getAttribute('href'));
    await env.action(() => { second = click(entry); });
    assert.equal(second.defaultPrevented, false); assert.equal(entry.target, '_blank');
    await env.action(() => env.q('.im-project__actions button').click());
    await env.action(() => env.advance(50));
    assert.equal(env.q('.im-project'), null); assert.equal(location.hash, '#demos');
    assert.equal(env.scroll, y); assert.equal(document.activeElement, link);
  }
  let modified;
  await env.action(() => { modified = click(env.q('.im-orbit__captions li:not([hidden]) a'), { ctrlKey: true }); });
  assert.equal(modified.defaultPrevented, false); assert.equal(env.q('.im-project'), null);
  assert.equal(env.q('.cursor'), null, 'native pointer replaces the old decorative ring');
});

test('touch fallback, keyboard entry, image errors and Escape work with reduced motion and no WebGL', async (t) => {
  const env = await app(t, { hash: '#demos', reduced: true });
  const stage = env.q('.im-orbit__stage'); stage.focus();
  await env.action(() => stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })));
  assert.equal(env.q('.im-project').dataset.phase, 'open');
  assert.equal(env.q('.im-project').dataset.ready, 'false');
  assert.equal(document.body.style.overflow, 'hidden');
  const wheel = new Event('wheel', { bubbles: true, cancelable: true });
  await env.action(() => document.body.dispatchEvent(wheel));
  assert.equal(wheel.defaultPrevented, true, 'wheel cannot dismiss or scroll the underlying gallery');
  assert.ok(env.q('.im-project'));
  await env.action(() => env.q('.im-project__poster img').dispatchEvent(new Event('error')));
  assert.ok(env.q('.im-project__image-error'));
  assert.equal(env.q('.im-project__actions a').getAttribute('href'), '/demos/fashion/');
  await env.action(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })));
  await env.action(() => env.advance(50));
  assert.equal(env.q('.im-project'), null); assert.equal(document.body.style.overflow, '');
  assert.equal(document.activeElement, stage);
  await env.action(() => env.q('.im-orbit__fallback a').click());
  assert.ok(env.q('.im-project'));
});

test('desktop presentation retains the same Stage and desktop filters return after close', async (t) => {
  const env = await app(t, { hash: '#demos', width: 1440, height: 900, reduced: true });
  const filters = env.q('.im-orbit__filters'), canvas = env.q('canvas');
  assert.equal(filters.dataset.persistent, 'true'); assert.equal(filters.open, true);
  await env.action(() => env.q('.im-orbit__captions li:not([hidden]) a').click());
  assert.equal(env.q('canvas'), canvas); assert.equal(env.q('.im-orbit__detail'), null);
  assert.ok(env.q('#im-project-title').textContent.includes('آینه'));
  assert.equal(env.q('.im-project__hitarea').getAttribute('href'), '/demos/fashion/');
  await env.action(() => env.q('.im-project__actions button').click());
  await env.action(() => env.advance(50));
  assert.equal(env.q('.im-project'), null); assert.equal(filters.open, true);
  assert.ok(env.q('.im-nav__links .im-sound-control'));
});

for (const width of [390, 768, 1440]) {
  test(`entry hold and stable gallery metrics survive presentation and address bar resize / ${width}px`, async (t) => {
    const env = await app(t, { hash: '#demos', width });
    const track = env.q('.im-work-track'), h = env.q('.im-work--orbit').offsetHeight;
    assert.equal(env.q('input[type="range"]').value, '0');
    assert.ok(Math.abs(parseFloat(track.style.height) - h * 7.06) < .001);
    await env.action(() => env.w.scrollTo({ top: env.workTop + .7 * h }));
    assert.equal(env.q('input[type="range"]').value, '0');
    const entryY = env.scroll;
    await env.action(() => env.q('.im-orbit__fallback a').click());
    assert.equal(env.scroll, entryY); assert.ok(env.q('.im-project'));
    await env.action(() => env.advance(1600));
    assert.equal(env.q('.im-project').dataset.phase, 'open');
    await env.action(() => env.q('.im-project__actions button').click());
    await env.action(() => env.advance(1700));
    assert.equal(env.q('.im-project'), null); assert.equal(env.scroll, entryY);
    await env.action(() => env.w.scrollTo({ top: env.workTop + (.8 + 3 * .62) * h }));
    assert.equal(env.q('input[type="range"]').value, '3');
    const y = env.scroll, trackHeight = track.style.height;
    await env.action(() => { Object.defineProperty(env.w, 'innerHeight', { value: h + 80, configurable: true }); env.w.dispatchEvent(new Event('resize')); env.resolveFonts(); });
    assert.equal(track.style.height, trackHeight); assert.equal(env.scroll, y); assert.equal(env.q('input[type="range"]').value, '3');
  });
}

for (const id of ['fashion','sports','cars','store','cafe','travel','maktab','nabz','sekke']) {
  test(`direct project route ${id}, native demo link, close and refresh`, async (t) => {
    const env = await app(t, { hash: `#work/${id}`, reduced: true });
    assert.equal(env.q('.im-project')?.dataset.project, id);
    assert.equal(env.q('.im-project__hitarea').getAttribute('href'), `/demos/${id}/`);
    const y = env.scroll;
    await env.action(() => env.q('.im-project__actions button').click());
    await env.action(() => env.advance(50));
    assert.equal(location.hash, '#demos'); assert.equal(env.q('.im-project'), null); assert.equal(env.scroll, y);
  });
}

test('unknown project route falls back to the gallery without an extra history entry', async (t) => {
  const env = await app(t, { hash: '#work/missing', reduced: true });
  assert.equal(location.hash, '#demos'); assert.equal(env.q('.im-project'), null);
  assert.equal(history.length, 1); assert.equal(env.scroll, env.workTop);
});

test('single-project filter, nested panels and Back/Forward preserve presentation and scroll lock ownership', async (t) => {
  const env = await app(t, { hash: '#demos', reduced: true });
  await env.action(() => [...document.querySelectorAll('.im-filter')].find((button) => button.textContent === 'مد و پوشاک').click());
  const y = env.scroll;
  const opener = env.q('.im-orbit__project-link'); opener.focus();
  await env.action(() => opener.click());
  await env.action(() => env.q('a[href="#contact"]').click());
  assert.equal(env.q('dialog').open, true); assert.ok(env.q('.im-project')); assert.equal(document.body.style.overflow, 'hidden');
  await env.action(() => env.q('.im-info-panel__close').click());
  assert.equal(location.hash, '#work/fashion'); assert.equal(env.q('dialog').open, false);
  assert.equal(env.q('.im-project').dataset.phase, 'open'); assert.equal(document.body.style.overflow, 'hidden');
  await env.action(() => history.back()); await env.action(() => env.advance(50));
  assert.equal(env.q('.im-project'), null); assert.equal(document.body.style.overflow, '');
  assert.equal(env.scroll, y); assert.equal(document.querySelectorAll('.im-orbit__project-link').length, 1);
  assert.equal(document.activeElement, opener);
  await env.action(() => history.forward());
  assert.equal(location.hash, '#work/fashion'); assert.equal(env.q('.im-project').dataset.project, 'fashion');
  assert.equal(document.querySelectorAll('.im-orbit__project-link').length, 1);
  await env.action(() => env.w.dispatchEvent(new env.w.PageTransitionEvent('pagehide', { persisted: true })));
  await env.action(() => env.w.dispatchEvent(new env.w.PageTransitionEvent('pageshow', { persisted: true })));
  assert.equal(env.q('.im-project').dataset.phase, 'open');
});
