(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  window.__siteReady = true;

  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  // Theme
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var applyTheme = function (t) {
    root.dataset.theme = t;
    if (themeMeta) themeMeta.setAttribute('content', t === 'light' ? '#f6f6f3' : '#07080c');
  };
  applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
  $$('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = root.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  });

  // Mobile menu
  var nav = document.querySelector('.nav');
  var menuBtn = document.querySelector('[data-menu]');
  var closeMenu = function () {
    if (!nav || !menuBtn) return;
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  };
  if (nav && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    $$('.nav-links a', nav).forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  // Scroll progress and compact nav
  var bar = document.querySelector('.progress');
  var ticking = false;
  var onScroll = function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 24);
    ticking = false;
  };
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  // Reveal on scroll
  var reveals = $$('[data-reveal]');
  if (hasIO && !reduce) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { revealIO.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // Scroll spy for the nav and the blog table of contents
  var spyLinks = $$('[data-spy] a[href*="#"]');
  var spyTargets = $$('main section[id], .prose h2[id]');
  if (hasIO && spyLinks.length && spyTargets.length) {
    var spyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        spyLinks.forEach(function (a) {
          a.classList.toggle('active', a.hash === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    spyTargets.forEach(function (t) { spyIO.observe(t); });
  }

  // Count-up stats
  var counters = $$('[data-count]');
  var formatCount = function (el, v) {
    var decimals = (el.dataset.count.split('.')[1] || '').length;
    return v.toFixed(decimals) + (el.dataset.suffix || '');
  };
  var runCount = function (el) {
    var end = parseFloat(el.dataset.count);
    var start = null;
    var frame = function (now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / 1600, 1);
      el.textContent = formatCount(el, end * (1 - Math.pow(1 - t, 4)));
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  if (hasIO && !reduce && counters.length) {
    counters.forEach(function (el) { el.textContent = formatCount(el, 0); });
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCount(entry.target);
          countIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countIO.observe(el); });
  }

  // Typing rotator
  var rot = document.querySelector('[data-rotate]');
  if (rot && !reduce) {
    var words = JSON.parse(rot.dataset.rotate);
    var w = 0;
    var n = words[0].length;
    var deleting = true;
    var typeStep = function () {
      n += deleting ? -1 : 1;
      rot.textContent = words[w].slice(0, n);
      if (deleting && n === 0) {
        deleting = false;
        w = (w + 1) % words.length;
        setTimeout(typeStep, 320);
        return;
      }
      if (!deleting && n === words[w].length) {
        deleting = true;
        setTimeout(typeStep, 2400);
        return;
      }
      setTimeout(typeStep, deleting ? 28 : 62);
    };
    setTimeout(typeStep, 2600);
  }

  // Cursor spotlight on cards
  $$('.card, .pass').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // 3D tilt on the access pass
  var tilt = document.querySelector('[data-tilt]');
  if (tilt && !reduce && window.matchMedia('(pointer: fine)').matches) {
    var area = tilt.parentElement;
    area.addEventListener('pointermove', function (e) {
      var r = area.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = 'rotateX(' + (-y * 9).toFixed(2) + 'deg) rotateY(' + (x * 12).toFixed(2) + 'deg)';
    });
    area.addEventListener('pointerleave', function () { tilt.style.transform = ''; });
  }

  // Copy to clipboard
  var toast = document.querySelector('.toast');
  var toastTimer;
  var showToast = function (msg) {
    if (!toast) return;
    toast.querySelector('span').textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2400);
  };
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.dataset.copy === 'url' ? location.href.split('#')[0] : btn.dataset.copy;
      var done = function () { showToast(btn.dataset.toast || 'Copied to clipboard'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { showToast(text); });
      } else {
        showToast(text);
      }
    });
  });

  // Local time in Bangalore
  var clocks = $$('[data-clock]');
  if (clocks.length && window.Intl) {
    var fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
    var tickClock = function () {
      var t = fmt.format(new Date()) + ' IST';
      clocks.forEach(function (c) { c.textContent = t; });
    };
    tickClock();
    setInterval(tickClock, 30000);
  }

  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  $$('[data-path]').forEach(function (el) { el.textContent = location.pathname; });
})();
