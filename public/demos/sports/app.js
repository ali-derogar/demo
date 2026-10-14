/* ===== باشگاه ورزشی پیکان — اسکریپت دمو (vanilla) ===== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- اعداد فارسی ---------- */
  var FA = '۰۱۲۳۴۵۶۷۸۹';
  function toFa(n) {
    return String(n).replace(/\d/g, function (d) { return FA[d]; });
  }
  function faGrouped(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '٬').replace(/\d/g, function (d) { return FA[d]; });
  }

  /* ---------- منوی موبایل ---------- */
  var toggle = document.getElementById('menu-toggle');
  var drawer = document.getElementById('nav-drawer');
  function setDrawer(open) {
    toggle.setAttribute('aria-expanded', String(open));
    drawer.hidden = !open;
  }
  toggle.addEventListener('click', function () {
    setDrawer(toggle.getAttribute('aria-expanded') !== 'true');
  });
  drawer.addEventListener('click', function (e) {
    if (e.target.closest('a')) setDrawer(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setDrawer(false);
      toggle.focus();
    }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 860) setDrawer(false);
  });

  /* ---------- شمارش آمار ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll('.stat-num'));
  function runCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) {
      el.textContent = faGrouped(target) + suffix;
      return;
    }
    var dur = 1600, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = faGrouped(Math.round(target * eased)) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var statObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); statObs.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { statObs.observe(c); });
  } else {
    counters.forEach(runCount);
  }

  /* ---------- نمایش هنگام اسکرول ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (r) { r.classList.add('is-visible'); });
  } else {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); revObs.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (r) { revObs.observe(r); });
  }

  /* ---------- فیلتر رشته‌ها ---------- */
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.sport-card'));
  var emptyMsg = document.getElementById('sports-empty');
  var filterStatus = document.querySelector('.filter-status');
  function applyFilter(cat) {
    var shown = 0;
    cards.forEach(function (card) {
      var match = cat === 'all' || card.getAttribute('data-cat') === cat;
      card.hidden = !match;
      if (match) shown++;
    });
    emptyMsg.hidden = shown !== 0;
    filterStatus.textContent = 'نمایش ' + toFa(shown) + ' رشته در دسته‌ی ' +
      (cat === 'all' ? 'همه' : chips.filter(function (c) { return c.dataset.filter === cat; })[0].textContent.trim());
  }
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) {
        c.classList.toggle('is-active', c === chip);
        c.setAttribute('aria-pressed', String(c === chip));
      });
      applyFilter(chip.getAttribute('data-filter'));
    });
  });

  /* ---------- انتخاب برنامه + پیش‌پرکردن فرم ---------- */
  var programCards = Array.prototype.slice.call(document.querySelectorAll('.program-card'));
  var programLive = document.querySelector('.program-live');
  var programInput = document.getElementById('f-program');
  function selectProgram(card) {
    var already = card.classList.contains('is-selected');
    programCards.forEach(function (c) {
      c.classList.remove('is-selected');
      c.setAttribute('aria-pressed', 'false');
    });
    if (already) {
      programInput.value = '';
      programLive.textContent = 'انتخاب برنامه لغو شد.';
      return;
    }
    card.classList.add('is-selected');
    card.setAttribute('aria-pressed', 'true');
    var name = card.getAttribute('data-program');
    programInput.value = name;
    programLive.textContent = 'برنامه‌ی «' + name + '» انتخاب شد و در فرم ثبت‌نام پر شد.';
  }
  programCards.forEach(function (card) {
    card.addEventListener('click', function () { selectProgram(card); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectProgram(card); }
    });
  });

  /* ---------- تب‌های برنامه‌ی هفتگی ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function activateTab(tab, focus) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !selected;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { activateTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var idx = null;
      if (e.key === 'ArrowLeft') idx = (i + 1) % tabs.length;   /* RTL: چپ = بعدی */
      else if (e.key === 'ArrowRight') idx = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') idx = 0;
      else if (e.key === 'End') idx = tabs.length - 1;
      if (idx !== null) { e.preventDefault(); activateTab(tabs[idx], true); }
    });
  });

  /* ---------- دکمه‌های اطلاع‌رسانی رویداد ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.notify-btn'), function (btn) {
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!on));
      btn.textContent = on ? 'اطلاع‌رسانی' : 'فعال شد';
    });
  });

  /* ---------- فرم ثبت‌نام ---------- */
  var form = document.getElementById('reg-form');
  var statusBox = document.getElementById('form-status');

  var rules = [
    {
      id: 'f-name',
      error: function (v) {
        if (!v) return 'لطفاً نام و نام خانوادگی خود را وارد کنید.';
        if (v.trim().length < 3 || !v.trim().includes(' ')) return 'نام کامل را بنویسید (نام و نام خانوادگی، حداقل ۳ حرف).';
        return '';
      }
    },
    {
      id: 'f-phone',
      error: function (v) {
        var digits = v.replace(/[۰-۹]/g, function (d) { return String(FA.indexOf(d)); }).replace(/[\s-]/g, '');
        if (!digits) return 'شماره همراه را وارد کنید.';
        if (!/^09\d{9}$/.test(digits)) return 'شماره همراه باید با ۰۹ شروع شود و ۱۱ رقم باشد (مثلاً ۰۹۱۲۱۲۳۴۵۶۷).';
        return '';
      }
    },
    { id: 'f-sport', error: function (v) { return v ? '' : 'یک رشته برای تمرین انتخاب کنید.'; } },
    { id: 'f-slot', error: function (v) { return v ? '' : 'روز و ساعت تمرین را مشخص کنید.'; } }
  ];

  function fieldError(id) { return document.getElementById('e-' + id.slice(2)); }

  function validateField(rule) {
    var el = document.getElementById(rule.id);
    var msg = rule.error(el.value);
    var errEl = fieldError(rule.id.replace('f-', 'e-'));
    if (msg) {
      el.setAttribute('aria-invalid', 'true');
      errEl.textContent = msg;
      errEl.hidden = false;
    } else {
      el.removeAttribute('aria-invalid');
      errEl.textContent = '';
      errEl.hidden = true;
    }
    return !msg;
  }

  rules.forEach(function (rule) {
    var el = document.getElementById(rule.id);
    el.addEventListener('blur', function () { validateField(rule); });
    el.addEventListener('input', function () {
      if (el.getAttribute('aria-invalid') === 'true') validateField(rule);
    });
  });

  var terms = document.getElementById('f-terms');
  var termsErr = document.getElementById('e-terms');
  function validateTerms() {
    var ok = terms.checked;
    if (ok) {
      terms.removeAttribute('aria-invalid');
      termsErr.textContent = ''; termsErr.hidden = true;
    } else {
      terms.setAttribute('aria-invalid', 'true');
      termsErr.textContent = 'برای ادامه، پذیرش شرایط عضویت ضروری است.';
      termsErr.hidden = false;
    }
    return ok;
  }
  terms.addEventListener('change', validateTerms);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstInvalid = null;
    rules.forEach(function (rule) {
      var ok = validateField(rule);
      if (!ok && !firstInvalid) firstInvalid = document.getElementById(rule.id);
    });
    if (!validateTerms() && !firstInvalid) firstInvalid = terms;

    statusBox.classList.remove('is-success', 'is-error');
    if (firstInvalid) {
      statusBox.innerHTML = '<h3>لطفاً ایرادهای فرم را برطرف کنید</h3><p>پیام خطا زیر فیلدهای ناقص نمایش داده شده است.</p>';
      statusBox.classList.add('is-error');
      firstInvalid.focus();
      return;
    }
    var name = document.getElementById('f-name').value.trim().split(/\s+/)[0];
    statusBox.innerHTML =
      '<h3>' + name + ' عزیز، درخواست شما ثبت شد</h3>' +
      '<p>کارشناسان پیکان برای هماهنگی جلسه‌ی اول با شماره‌ی ' +
      toFa(document.getElementById('f-phone').value.replace(/[^\d۰-۹]/g, '')) + ' با شما تماس می‌گیرند.</p>' +
      '<p>این فرم صرفاً نمونه‌ی نمایشی است و هیچ اطلاعاتی به جایی ارسال یا ذخیره نمی‌شود.</p>' +
      '<button class="again-btn" type="button">ثبت دیگر</button>';
    statusBox.classList.add('is-success');
    statusBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    var again = statusBox.querySelector('.again-btn');
    again.addEventListener('click', function () {
      form.reset();
      programInput.value = '';
      programCards.forEach(function (c) { c.classList.remove('is-selected'); c.setAttribute('aria-pressed', 'false'); });
      programLive.textContent = '';
      rules.forEach(function (rule) {
        var el = document.getElementById(rule.id);
        el.removeAttribute('aria-invalid');
        var err = fieldError(rule.id.replace('f-', 'e-'));
        err.textContent = ''; err.hidden = true;
      });
      terms.removeAttribute('aria-invalid');
      termsErr.textContent = ''; termsErr.hidden = true;
      statusBox.classList.remove('is-success', 'is-error');
      statusBox.innerHTML = '';
      document.getElementById('f-name').focus();
    });
  });
})();
