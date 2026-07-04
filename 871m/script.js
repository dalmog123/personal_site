/* ============================================================
   dalmog.com/871m - inline term tooltips + scroll progress
   Vanilla JS, no dependencies. Degrades gracefully.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Scroll progress bar ---------- */
  var bar = document.getElementById('progress');
  function updateProgress() {
    var h = document.documentElement;
    var scrolled = h.scrollTop || document.body.scrollTop;
    var height = h.scrollHeight - h.clientHeight;
    var pct = height > 0 ? (scrolled / height) * 100 : 0;
    if (bar) bar.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  /* ---------- Term tooltips ---------- */
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
