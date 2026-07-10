/* ============================================================
   dalmog.com/871m_v2 - theme toggle, scroll choreography,
   interactive tiered-withholding model (drag the chart or the
   slider), term tooltips. Vanilla JS, degrades gracefully.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ============================================================
     1. Theme toggle (light default, dark optional, persisted)
     ============================================================ */
  (function theme() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    var root = document.documentElement;

    function apply(dark) {
      if (dark) root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      try { localStorage.setItem('871m-theme', dark ? 'dark' : 'light'); } catch (e) { /* private mode */ }
    }

    btn.setAttribute('aria-label',
      root.getAttribute('data-theme') === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    btn.addEventListener('click', function () {
      apply(root.getAttribute('data-theme') !== 'dark');
    });
  })();

  /* ============================================================
     2. Scroll progress bar + timeline draw (one rAF-throttled pass)
     ============================================================ */
  var bar = document.getElementById('progress');
  var timeline = document.getElementById('timeline');
  var ticking = false;

  function onScrollFrame() {
    ticking = false;
    var h = document.documentElement;
    var scrolled = h.scrollTop || document.body.scrollTop;
    var height = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.width = (height > 0 ? (scrolled / height) * 100 : 0) + '%';

    if (timeline && !reduced) {
      var r = timeline.getBoundingClientRect();
      var p = (window.innerHeight * 0.8 - r.top) / r.height;
      timeline.style.setProperty('--draw', clamp(p, 0, 1).toFixed(4));
    }
  }
  function requestScrollFrame() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScrollFrame); }
  }
  window.addEventListener('scroll', requestScrollFrame, { passive: true });
  window.addEventListener('resize', requestScrollFrame);
  onScrollFrame();

  /* ============================================================
     3. Scroll reveals (with stagger groups)
     ============================================================ */
  document.querySelectorAll('.stagger').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.classList.add('reveal');
      child.style.transitionDelay = (i * 60) + 'ms';
    });
  });

  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ============================================================
     4. Section rail highlighting
     ============================================================ */
  var railLinks = document.querySelectorAll('.rail a');
  if (railLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    railLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var railIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          railLinks.forEach(function (a) { a.classList.remove('active'); });
          var link = byId[entry.target.id];
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    document.querySelectorAll('main .sec').forEach(function (sec) { railIO.observe(sec); });
  }

  /* ============================================================
     5. Hero stat counters
     ============================================================ */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var from = parseFloat(el.getAttribute('data-from') || '0');
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (isNaN(target)) return;
    if (reduced) { el.textContent = target.toFixed(decimals); return; }

    var duration = 1300;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = clamp((ts - start) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (from + (target - from) * eased).toFixed(decimals);
      if (t < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  document.querySelectorAll('.stat-num').forEach(function (el) { animateCounter(el); });

  /* ============================================================
     6. The interactive tiered-withholding model
     ============================================================ */
  (function model() {
    var host = document.getElementById('model-chart');
    var slider = document.getElementById('delta-slider');
    if (!host || !slider) return;

    // chart geometry (SVG user units)
    var W = 700, H = 410;
    var X0 = 56, X1 = 676;      // delta 0 -> 1
    var Y0 = 356, YT = 64;      // rate 0 -> RMAX
    var RMAX = 33;

    function px(d) { return X0 + (X1 - X0) * d; }
    function py(r) { return Y0 - (Y0 - YT) * (r / RMAX); }
    function lawRate(d) { return d >= 0.8 ? 30 * d : 0; }
    function tierRate(d) { return d < 0.4 ? 0 : (d < 0.8 ? 30 * d : Math.min(30, 24 + 40 * (d - 0.8))); }
    function fmtRate(r) {
      var v = Math.round(r * 10) / 10;
      return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + '%';
    }

    // ---- build the static SVG ----
    var s = '';
    s += '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Withholding rate as a function of delta, under current law and under the tiered model. Drag horizontally to change delta.">';

    // zones: one soft tint per delta band
    s += '<rect class="mc-zone mc-zone--gate" x="' + px(0) + '" y="' + YT + '" width="' + (px(0.4) - px(0)) + '" height="' + (Y0 - YT) + '"/>';
    s += '<rect class="mc-zone" x="' + px(0.4) + '" y="' + YT + '" width="' + (px(0.8) - px(0.4)) + '" height="' + (Y0 - YT) + '"/>';
    s += '<rect class="mc-zone mc-zone--hi" x="' + px(0.8) + '" y="' + YT + '" width="' + (px(1) - px(0.8)) + '" height="' + (Y0 - YT) + '"/>';

    // revenue collected by the tiered model but lost under current law
    s += '<polygon class="mc-lost" points="' + px(0.4) + ',' + py(0) + ' ' + px(0.4) + ',' + py(12) + ' ' + px(0.8) + ',' + py(24) + ' ' + px(0.8) + ',' + py(0) + '"/>';
    s += '<text class="mc-lost-lbl" x="' + px(0.6) + '" y="' + (py(9)) + '" text-anchor="middle">collected by the tiered model,</text>';
    s += '<text class="mc-lost-lbl" x="' + px(0.6) + '" y="' + (py(9) + 14) + '" text-anchor="middle">lost under current law</text>';

    // horizontal gridlines + y labels
    [0, 10, 20, 30].forEach(function (r) {
      s += '<line class="mc-grid-line" x1="' + X0 + '" y1="' + py(r) + '" x2="' + X1 + '" y2="' + py(r) + '"/>';
      s += '<text class="mc-lbl" x="' + (X0 - 9) + '" y="' + (py(r) + 4) + '" text-anchor="end">' + r + '%</text>';
    });

    // x ticks + labels
    [0, 0.2, 0.4, 0.6, 0.8, 1].forEach(function (d) {
      var gold = (d === 0.8 || d === 0.4) ? ' mc-lbl--gold' : '';
      s += '<line class="mc-axis" x1="' + px(d) + '" y1="' + Y0 + '" x2="' + px(d) + '" y2="' + (Y0 + 6) + '"/>';
      s += '<text class="mc-lbl' + gold + '" x="' + px(d) + '" y="' + (Y0 + 24) + '" text-anchor="middle">' + d.toFixed(2) + '</text>';
    });

    // axes
    s += '<line class="mc-axis" x1="' + X0 + '" y1="' + YT + '" x2="' + X0 + '" y2="' + Y0 + '"/>';
    s += '<line class="mc-axis" x1="' + X0 + '" y1="' + Y0 + '" x2="' + X1 + '" y2="' + Y0 + '"/>';
    s += '<text class="mc-title" x="' + X0 + '" y="' + (YT - 22) + '">effective withholding · % of the dividend</text>';
    s += '<text class="mc-lbl" x="' + ((X0 + X1) / 2) + '" y="' + (H - 8) + '" text-anchor="middle">Δ · how stock-like the derivative is</text>';

    // current law: 0 up to the cliff, then the delta-scaled base (30% x delta, reaching 30% only at delta one)
    s += '<path class="mc-law" d="M' + px(0) + ' ' + py(0) + ' H' + px(0.8) + '"/>';
    s += '<path class="mc-law--dash" d="M' + px(0.8) + ' ' + py(0) + ' V' + py(24) + '"/>';
    s += '<path class="mc-law" d="M' + px(0.8) + ' ' + py(24) + ' L' + px(1) + ' ' + py(30) + '"/>';
    s += '<text class="mc-cliff-lbl" x="' + (px(0.8) + 8) + '" y="' + py(15) + '">the cliff</text>';

    // tiered model: gated 0% below 0.40, linear 30% x delta through the middle band,
    // then a steeper slope from 24% at 0.80 to the full 30% at 0.95, flat through delta one
    s += '<path class="mc-tier" d="M' + px(0) + ' ' + py(0) + ' H' + px(0.4) + '"/>';
    s += '<path class="mc-tier--dash" d="M' + px(0.4) + ' ' + py(0) + ' V' + py(12) + '"/>';
    s += '<path class="mc-tier" d="M' + px(0.4) + ' ' + py(12) + ' L' + px(0.8) + ' ' + py(24) + ' L' + px(0.95) + ' ' + py(30) + ' H' + px(1) + '"/>';
    s += '<text class="mc-lbl" x="' + px(0.2) + '" y="' + (py(0) - 10) + '" text-anchor="middle">0% · de minimis gate</text>';

    // marker
    s += '<g id="mc-marker">';
    s += '<line id="mc-mk-line" class="mc-mk-line" x1="0" y1="' + (YT - 6) + '" x2="0" y2="' + Y0 + '"/>';
    s += '<circle id="mc-mk-law" class="mc-mk-law" r="6.5" cx="0" cy="0"/>';
    s += '<circle id="mc-mk-tier" class="mc-mk-tier" r="4.5" cx="0" cy="0"/>';
    s += '<text id="mc-mk-lbl" class="mc-mk-lbl" x="0" y="' + (YT - 14) + '" text-anchor="middle"></text>';
    s += '</g>';

    s += '</svg>';
    host.innerHTML = s;

    var svg = host.querySelector('svg');
    var mkLine = document.getElementById('mc-mk-line');
    var mkLaw = document.getElementById('mc-mk-law');
    var mkTier = document.getElementById('mc-mk-tier');
    var mkLbl = document.getElementById('mc-mk-lbl');
    var roDelta = document.getElementById('ro-delta');
    var roLaw = document.getElementById('ro-law');
    var roLawSub = document.getElementById('ro-law-sub');
    var roTier = document.getElementById('ro-tier');
    var verdict = document.getElementById('model-verdict');
    var presets = Array.prototype.slice.call(document.querySelectorAll('.model-presets button'));

    function verdictFor(d, law, tier) {
      if (d === 0.79) {
        return 'The purpose-built “0.79 swap”: 99% of the stock’s economics, 0% withheld under current law. The tiered model collects 23.7% - and crossing to 0.80 costs just three-tenths of a point more, so there is nothing left to engineer for.';
      }
      if (d === 1) {
        return 'Delta-one: moves one-for-one with the stock. This thin slice is the only part of the regime the IRS actually enforces today - both regimes withhold the full 30%.';
      }
      if (d < 0.4) {
        return 'Light exposure: exempt under both regimes - but through a gate, not a blank check. The 0% band holds only while the dividend value routed through sub-0.40 positions stays under a de minimis cap.';
      }
      if (d < 0.8) {
        return 'Current law withholds nothing here - this is the zone instruments are engineered into. The tiered model collects ' + fmtRate(tier) + ': the tax tracks what the position actually captures, measured on every dividend date.';
      }
      return 'From 0.80 the slope steepens: the replication discount phases out fast, reaching the full 30% at Δ 0.95. Current law’s delta-scaled base sits just beneath it; delta-one - the only part of the regime that already works - is untouched, and the cliff is gone entirely.';
    }

    function update() {
      var d = parseInt(slider.value, 10) / 100;
      var law = lawRate(d);
      var tier = tierRate(d);
      var x = px(d);

      mkLine.setAttribute('x1', x);
      mkLine.setAttribute('x2', x);
      mkLaw.setAttribute('cx', x);
      mkLaw.setAttribute('cy', py(law));
      mkTier.setAttribute('cx', x);
      mkTier.setAttribute('cy', py(tier));
      mkLbl.setAttribute('x', clamp(x, X0 + 36, X1 - 36));
      mkLbl.textContent = 'Δ ' + d.toFixed(2);

      roDelta.textContent = d.toFixed(2);
      roLaw.textContent = fmtRate(law);
      roTier.textContent = fmtRate(tier);
      roLawSub.textContent = d >= 0.995 ? 'caught by the cliff'
        : (d >= 0.8 ? 'as written; collection deferred to 2027'
        : (d >= 0.4 ? 'engineered under the cliff' : 'tested once, on day one'));
      verdict.textContent = verdictFor(d, law, tier);

      slider.style.setProperty('--fill', slider.value + '%');
      presets.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-delta') === slider.value);
      });
    }

    slider.addEventListener('input', update);
    presets.forEach(function (b) {
      b.addEventListener('click', function () {
        slider.value = b.getAttribute('data-delta');
        update();
      });
    });

    // ---- drag directly on the chart ----
    var dragging = false;

    function setFromPointer(e) {
      var r = svg.getBoundingClientRect();
      var x = (e.clientX - r.left) * (W / r.width);
      var d = clamp((x - X0) / (X1 - X0), 0, 1);
      slider.value = String(Math.round(d * 100));
      update();
    }

    svg.addEventListener('pointerdown', function (e) {
      dragging = true;
      svg.classList.add('dragging');
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
      setFromPointer(e);
      e.preventDefault();
    });
    svg.addEventListener('pointermove', function (e) {
      if (dragging) setFromPointer(e);
    });
    ['pointerup', 'pointercancel'].forEach(function (type) {
      svg.addEventListener(type, function () {
        dragging = false;
        svg.classList.remove('dragging');
      });
    });

    update();
  })();

  /* ============================================================
     7. Term tooltips
     ============================================================ */
  var tip = document.getElementById('tip');
  var terms = Array.prototype.slice.call(document.querySelectorAll('.term'));
  var activeTerm = null;

  terms.forEach(function (t) {
    t.setAttribute('tabindex', '0');
    t.setAttribute('role', 'button');
    t.setAttribute('aria-label', t.textContent + ': definition');
  });

  function positionTip(term) {
    tip.style.left = '0px';
    tip.style.top = '0px';
    tip.classList.remove('above', 'below');

    var r = term.getBoundingClientRect();
    var scrollX = window.pageXOffset;
    var scrollY = window.pageYOffset;
    var margin = 12;
    var gap = 10;
    var tipW = tip.offsetWidth;
    var tipH = tip.offsetHeight;

    var termCenter = r.left + r.width / 2;
    var left = termCenter - tipW / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - tipW - margin));

    var below = true;
    var top = r.bottom + gap;
    if (r.bottom + gap + tipH > window.innerHeight - margin && r.top - gap - tipH > margin) {
      below = false;
      top = r.top - gap - tipH;
    }
    tip.classList.add(below ? 'below' : 'above');

    var arrowX = termCenter - left;
    arrowX = Math.max(16, Math.min(arrowX, tipW - 16));
    tip.style.setProperty('--arrow-x', arrowX + 'px');

    tip.style.left = (left + scrollX) + 'px';
    tip.style.top = (top + scrollY) + 'px';
  }

  function showTip(term) {
    var def = term.getAttribute('data-def');
    if (!def) return;
    activeTerm = term;
    tip.textContent = def;
    tip.setAttribute('aria-hidden', 'false');
    tip.style.visibility = 'hidden';
    tip.classList.add('show');
    positionTip(term);
    tip.style.visibility = '';
  }

  function hideTip() {
    activeTerm = null;
    tip.classList.remove('show');
    tip.setAttribute('aria-hidden', 'true');
  }

  var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  terms.forEach(function (term) {
    if (isTouch) {
      term.addEventListener('click', function (e) {
        e.stopPropagation();
        if (activeTerm === term) { hideTip(); }
        else { showTip(term); }
      });
    } else {
      term.addEventListener('mouseenter', function () { showTip(term); });
      term.addEventListener('mouseleave', hideTip);
      term.addEventListener('focus', function () { showTip(term); });
      term.addEventListener('blur', hideTip);
    }
    term.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showTip(term); }
      if (e.key === 'Escape') { hideTip(); term.blur(); }
    });
  });

  document.addEventListener('click', function (e) {
    if (activeTerm && !(e.target.closest && e.target.closest('.term'))) hideTip();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideTip(); });
  window.addEventListener('scroll', function () { if (activeTerm) hideTip(); }, { passive: true });
  window.addEventListener('resize', function () { if (activeTerm) hideTip(); });
})();
