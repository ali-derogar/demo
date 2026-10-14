(function () {
  'use strict';

  var toggle = document.querySelector('#menu-toggle, #navToggle');
  var panel = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
  if (toggle && panel) {
    var header = toggle.closest('header');
    var breakpoint = document.body.dataset.demo === 'fashion' ? 1023 : document.body.dataset.demo === 'sports' ? 860 : 760;
    var mobile = window.matchMedia('(max-width: ' + breakpoint + 'px)');
    var backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'mobile-menu-backdrop';
    backdrop.setAttribute('aria-label', 'بستن منو');
    backdrop.tabIndex = -1;
    backdrop.hidden = true;
    document.body.appendChild(backdrop);
    backdrop.style.zIndex = String((parseInt(getComputedStyle(header).zIndex, 10) || 60) - 1);
    var locked = false, previousOverflow = '';
    var background = Array.from(document.querySelectorAll('main, body > footer'));
    var previousInert = [];

    function closeMenu(restoreFocus) {
      toggle.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
      if (restoreFocus) toggle.focus();
    }
    function syncMenu() {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      if (open && !mobile.matches) { closeMenu(false); open = false; }
      backdrop.hidden = !open;
      backdrop.style.insetBlockStart = header.getBoundingClientRect().bottom + 'px';
      toggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
      if (open && !locked) {
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        previousInert = background.map(function (el) { return el.inert; });
        background.forEach(function (el) { el.inert = true; });
        locked = true;
      } else if (!open && locked) {
        document.body.style.overflow = previousOverflow;
        background.forEach(function (el, i) { el.inert = previousInert[i]; });
        locked = false;
      }
    }
    if (document.body.dataset.demo === 'store') {
      toggle.addEventListener('click', function () {
        var open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(open));
        panel.hidden = !open;
      });
    }
    new MutationObserver(syncMenu).observe(toggle, { attributes: true, attributeFilter: ['aria-expanded'] });
    mobile.addEventListener('change', syncMenu);
    window.addEventListener('resize', syncMenu);
    backdrop.addEventListener('click', function () { closeMenu(true); });
    header.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { closeMenu(false); });
    });
    document.addEventListener('pointerdown', function (event) {
      if (!header.contains(event.target) && toggle.getAttribute('aria-expanded') === 'true') closeMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (event.key === 'Escape') { closeMenu(true); return; }
      if (event.key !== 'Tab') return;
      var focusable = Array.from(header.querySelectorAll('a[href], button:not(.mobile-menu-backdrop)')).filter(function (el) { return el.getClientRects().length; });
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    syncMenu();
  }

  document.addEventListener('click', function (event) {
    var control = event.target.closest('.chip, .day, [role="tab"]');
    if (control && getComputedStyle(control.parentElement).overflowX === 'auto') {
      control.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    }
  });
})();
