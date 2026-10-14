/* آینه — رفتارهای صفحه */
(function () {
  'use strict';

  var FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function toFa(n) {
    return String(n).replace(/\d/g, function (d) { return FA_DIGITS[+d]; });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- هدر و منوی موبایل ---------- */
  var header = document.getElementById('siteHeader');
  var toggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');

  window.addEventListener('scroll', function () {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }, { passive: true });

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
    if (open) {
      mobileNav.hidden = false;
    } else {
      mobileNav.hidden = true;
    }
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  mobileNav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });

  /* ---------- اسکرول‌اسپای ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.main-nav .nav-link'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  function activate(id) {
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
    });
  }
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) activate(en.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- نمایان‌سازی هنگام اسکرول ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          ro.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { ro.observe(el); });
  }

  /* ---------- فیلتر فصل مجموعه‌ها ---------- */
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.collection-card'));
  var emptyMsg = document.getElementById('filterEmpty');

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var season = chip.dataset.season;
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      var shown = 0;
      cards.forEach(function (card) {
        var match = season === 'all' || card.dataset.season === season;
        card.classList.toggle('is-hidden', !match);
        if (match) shown++;
      });
      emptyMsg.hidden = shown !== 0;
    });
  });

  /* ---------- لایت‌باکس ---------- */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCaption');
  var lbCount = document.getElementById('lbCounter');
  var lbClose = document.getElementById('lbClose');
  var lbPrev = document.getElementById('lbPrev');
  var lbNext = document.getElementById('lbNext');
  var triggers = [];
  var current = 0;
  var lastFocused = null;

  function show(i) {
    var t = triggers[i];
    var host = t.closest('article, figure, li') || t.parentElement;
    var thumb = t.querySelector('img') || (host && host.querySelector('img'));
    lbImg.src = t.dataset.lightbox;
    lbImg.alt = (thumb && thumb.alt) || t.dataset.caption || '';
    lbCap.textContent = t.dataset.caption || '';
    lbCount.textContent = triggers.length > 1
      ? toFa(i + 1) + ' از ' + toFa(triggers.length)
      : '';
  }

  function openLb(list, index) {
    triggers = list;
    current = index;
    lastFocused = document.activeElement;
    show(current);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeLb() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  function step(dir) {
    current = (current + dir + triggers.length) % triggers.length;
    show(current);
  }

  var lookBtns = Array.prototype.slice.call(document.querySelectorAll('.look-btn'));
  lookBtns.forEach(function (btn, i) {
    btn.addEventListener('click', function () { openLb(lookBtns, i); });
  });
  Array.prototype.slice.call(document.querySelectorAll('.card-link[data-lightbox]')).forEach(function (btn) {
    btn.addEventListener('click', function () { openLb([btn], 0); });
  });

  lbClose.addEventListener('click', closeLb);
  lbPrev.addEventListener('click', function () { step(-1); });
  lbNext.addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) {
    if (e.target === lb) closeLb();
  });

  lb.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeLb(); return; }
    if (triggers.length > 1) {
      if (e.key === 'ArrowLeft') { step(1); return; }
      if (e.key === 'ArrowRight') { step(-1); return; }
    }
    if (e.key === 'Tab') {
      var focusables = [lbClose, lbPrev, lbNext];
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  /* ---------- فرم عضویت ---------- */
  var form = document.getElementById('newsForm');
  var nameInput = document.getElementById('fName');
  var emailInput = document.getElementById('fEmail');
  var nameErr = document.getElementById('fNameErr');
  var emailErr = document.getElementById('fEmailErr');
  var status = document.getElementById('formStatus');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(input, errEl, msg) {
    errEl.textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function validateName() {
    var v = nameInput.value.trim();
    if (!v) { setError(nameInput, nameErr, 'نام خود را وارد کنید.'); return false; }
    if (v.length < 3) { setError(nameInput, nameErr, 'نام باید دست‌کم سه حرف باشد.'); return false; }
    setError(nameInput, nameErr, '');
    return true;
  }

  function validateEmail() {
    var v = emailInput.value.trim();
    if (!v) { setError(emailInput, emailErr, 'نشانی رایانامه را وارد کنید.'); return false; }
    if (!EMAIL_RE.test(v)) { setError(emailInput, emailErr, 'قالب رایانامه درست نیست؛ نمونه: name@example.com'); return false; }
    setError(emailInput, emailErr, '');
    return true;
  }

  nameInput.addEventListener('blur', validateName);
  emailInput.addEventListener('blur', validateEmail);
  nameInput.addEventListener('input', function () { if (nameInput.getAttribute('aria-invalid') === 'true') validateName(); });
  emailInput.addEventListener('input', function () { if (emailInput.getAttribute('aria-invalid') === 'true') validateEmail(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var okName = validateName();
    var okEmail = validateEmail();
    if (!okName || !okEmail) {
      status.textContent = 'لطفاً خطاهای فرم را برطرف کنید.';
      status.style.color = '#a2402f';
      (okName ? emailInput : nameInput).focus();
      return;
    }
    status.style.color = '';
    status.textContent = 'عضویت شما ثبت شد. سپاس!';
    form.reset();
    setError(nameInput, nameErr, '');
    setError(emailInput, emailErr, '');
  });
})();
