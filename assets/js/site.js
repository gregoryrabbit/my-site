/* Shared chrome (nav + footer), scroll progress, reveal-on-scroll and parallax. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav + footer ---------- */
  var arrowSvg = '<svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M5 14h18M15 6l8 8-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  window.ARROW = arrowSvg;

  var header = document.querySelector('.site-header');
  if (header) {
    var active = header.getAttribute('data-active');
    var home = active === '';
    /* Home: in-page anchors with scroll-spy. Other pages: Work and Approach are their own pages. */
    var items = [
      ['work', 'Work', home ? '#work' : 'work-snyk.html'],
      ['about', 'About', home ? '#about' : 'index.html#about'],
      ['approach', 'Approach', home ? '#approach' : 'approach.html'],
      ['contact', 'Contact', home ? '#contact' : 'index.html#contact']
    ];
    var links = items.map(function (l) {
      return '<a class="nav-link" data-key="' + l[0] + '" data-label="' + l[1] + '" href="' + l[2] + '"' + (active === l[0] ? ' aria-current="page"' : '') + '>' + l[1] + '</a>';
    }).join('');
    header.innerHTML = '<div class="wrap"><nav class="nav"><a class="logo" href="index.html">Paul Coombs</a><div class="nav-links">' + links + '</div></nav></div>';
  }

  var footer = document.querySelector('.site-footer');
  if (footer) {
    footer.innerHTML = '<div class="wrap"><div class="footer"><span class="name">Paul Coombs</span><div class="links">' +
      '<a href="mailto:paul.coombs@gmail.com">paul.coombs@gmail.com</a>' +
      '<a href="https://www.linkedin.com/in/paulcoombs" target="_blank" rel="noopener">linkedin.com/in/paulcoombs</a></div></div></div>';
  }

  document.querySelectorAll('[data-arrow]').forEach(function (el) { el.innerHTML = arrowSvg; });

  /* ---------- External links always open in a new tab ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="http"]');
    if (!a || a.hostname === location.hostname || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    window.open(a.href, '_blank', 'noopener');
  });

  /* ---------- Copy to clipboard ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var timer;
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      function done() {
        btn.classList.add('copied');
        clearTimeout(timer);
        timer = setTimeout(function () { btn.classList.remove('copied'); }, 1600);
      }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else { fallback(); }
    });
  });

  /* ---------- Scroll-spy for the in-page nav (home only) ---------- */
  if (header && header.getAttribute('data-active') === '') {
    var navLinks = {};
    header.querySelectorAll('.nav-link').forEach(function (a) { navLinks[a.getAttribute('data-key')] = a; });
    var spyIds = ['work', 'about', 'approach', 'contact'];
    var spyEls = spyIds.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var setCurrent = function () {
      var line = window.innerHeight * 0.35, cur = null;
      spyEls.forEach(function (el) { if (el.getBoundingClientRect().top <= line) cur = el.id; });
      var atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atEnd && spyEls.length) cur = spyEls[spyEls.length - 1].id;
      Object.keys(navLinks).forEach(function (k) {
        if (k === cur) navLinks[k].setAttribute('aria-current', 'page'); else navLinks[k].removeAttribute('aria-current');
      });
    };
    window.addEventListener('scroll', setCurrent, { passive: true });
    window.addEventListener('load', setCurrent);
    setCurrent();
  }

  /* ---------- Scroll progress bar ---------- */
  var bar = document.createElement('div');
  bar.id = 'progress';
  document.body.appendChild(bar);

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    var step = parseFloat(group.getAttribute('data-stagger')) || 0.09;
    Array.prototype.forEach.call(group.querySelectorAll(':scope > .reveal'), function (el, i) {
      el.style.setProperty('--d', (i * step).toFixed(2) + 's');
    });
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Parallax ---------- */
  var imgs = Array.prototype.slice.call(document.querySelectorAll('.media-inner > img, .media.ph .media-inner'));
  var drift = Array.prototype.slice.call(document.querySelectorAll('[data-speed]'));
  var hero = document.querySelector('.hero');
  var ticking = false;

  function frame() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight;
    var doc = document.documentElement;

    bar.style.transform = 'scaleX(' + (y / Math.max(1, doc.scrollHeight - vh)) + ')';
    if (header) header.classList.toggle('scrolled', y > 24);
    if (reduce) return;

    /* images drift inside their frames */
    imgs.forEach(function (el) {
      var frameEl = el.closest('.media');
      var r = frameEl.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var rel = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); /* -1 .. 1 */
      rel = Math.max(-1, Math.min(1, rel));
      if (el.tagName === 'IMG') {
        var max = (el.offsetHeight - r.height) / 2;
        el.style.transform = 'translate3d(0,' + (rel * max * 0.95).toFixed(1) + 'px,0)';
      } else {
        el.style.setProperty('--py', (rel * -90).toFixed(1) + 'px');
      }
    });

    /* generic drift: translate by distance from viewport centre */
    drift.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var speed = parseFloat(el.getAttribute('data-speed'));
      var off = (r.top + r.height / 2 - vh / 2) * speed;
      el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
    });

    /* hero: headline lags, blurb lags less, eyebrow fades */
    if (hero && y < vh * 1.4) {
      var h1 = hero.querySelector('h1');
      var blurb = hero.querySelector('.blurb');
      var eyebrow = hero.querySelector('.eyebrow');
      if (h1) h1.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(1) + 'px,0)';
      if (blurb) blurb.style.transform = 'translate3d(0,' + (y * 0.1).toFixed(1) + 'px,0)';
      if (eyebrow) eyebrow.style.transform = 'translate3d(0,' + (y * 0.32).toFixed(1) + 'px,0)';
    }
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', frame);
  frame();
})();
