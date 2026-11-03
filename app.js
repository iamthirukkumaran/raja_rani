/* ============================================================
   Raja Rani — site behaviour
   Progressive enhancement: the page reads fine without any of it.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = function () { return reduceMQ.matches; };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- 1. Nav material appears once content is behind it ---------- */

  var nav = document.getElementById('nav');
  if (nav) {
    var stuck = false;
    var onScroll = function () {
      var next = window.scrollY > 6;
      if (next !== stuck) { stuck = next; nav.classList.toggle('is-stuck', stuck); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 1b. Legal pages: the contents rail folds away on small screens ---------- */

  var toc = document.getElementById('toc');
  if (toc) {
    // Open is the no-JS default, which is right on desktop and merely long on a
    // phone — so JS only ever has to close it.
    var narrowMQ = window.matchMedia('(max-width: 900px)');
    var syncToc = function () { toc.open = !narrowMQ.matches; };
    syncToc();
    narrowMQ.addEventListener('change', syncToc);
    // Deep links (privacy.html#delete is printed in the app and in the store
    // listings) land before the fold-away and before the webfonts swap in, so
    // the heading drifts out from under the nav. Put it back once both settle.
    if (window.location.hash.length > 1) {
      var target = document.getElementById(window.location.hash.slice(1));
      if (target) {
        var settle = function () {
          var top = target.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: Math.max(top, 0), behavior: 'auto' });
        };
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
        else window.addEventListener('load', settle);
      }
    }
    // Jumping to a section on a phone should put the list away behind you.
    toc.addEventListener('click', function (e) {
      if (narrowMQ.matches && e.target.closest('a')) toc.open = false;
    });
  }

  /* ---------- 2. Scroll reveal (once, staggered) ---------- */

  var revealables = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    for (var r = 0; r < revealables.length; r++) revealables[r].classList.add('is-in');
  } else {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        revealObs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    for (var i = 0; i < revealables.length; i++) revealObs.observe(revealables[i]);
  }

  function onceInView(el, cb, threshold) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var o = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        o.disconnect();
        cb();
      });
    }, { threshold: threshold || 0.4 });
    o.observe(el);
  }

  /* ---------- 3. The five character cards ---------- */

  var grid = document.getElementById('deckgrid');
  var flipAll = document.getElementById('flipAll');

  if (grid) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.flip'));

    var setFlipped = function (card, on) {
      card.setAttribute('aria-pressed', String(on));
      var name = card.querySelector('.rolecard__name');
      card.setAttribute('aria-label',
        on ? (name ? name.textContent + ' — card revealed' : 'Card revealed')
           : 'Face-down card, activate to reveal');
    };

    var syncFlipAll = function () {
      if (!flipAll) return;
      var anyDown = cards.some(function (c) { return c.getAttribute('aria-pressed') !== 'true'; });
      flipAll.textContent = anyDown ? 'Reveal all' : 'Turn them back';
    };

    cards.forEach(function (card) {
      setFlipped(card, false);
      card.addEventListener('click', function () {
        setFlipped(card, card.getAttribute('aria-pressed') !== 'true');
        syncFlipAll();
      });
    });

    if (flipAll) {
      flipAll.addEventListener('click', function () {
        var anyDown = cards.some(function (c) { return c.getAttribute('aria-pressed') !== 'true'; });
        // 60ms stagger — a dealt hand, not five cards snapping over at once.
        cards.forEach(function (c, idx) {
          var run = function () { setFlipped(c, anyDown); };
          reduce() ? run() : setTimeout(run, idx * 60);
        });
        setTimeout(syncFlipAll, reduce() ? 0 : cards.length * 60);
      });
      syncFlipAll();
    }
  }

  /* ---------- 4. Podium scores count up ---------- */

  var podium = document.getElementById('podium');
  onceInView(podium, function () {
    var nums = podium.querySelectorAll('em[data-count]');
    nums.forEach(function (el, idx) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      if (reduce()) { el.textContent = target; return; }
      var dur = 1000, started = 0, delay = 280 + idx * 90;
      setTimeout(function () {
        var step = function (now) {
          if (!started) started = now;
          var t = Math.min((now - started) / dur, 1);
          var eased = 1 - Math.pow(1 - t, 3);   // fast first, settles — the coin-tick feel
          el.textContent = Math.round(target * eased);
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, delay);
    });
  }, 0.45);

  /* ---------- 5. Pointer tilt on the lobby phone — decorative, mouse only ---------- */

  var device = document.getElementById('heroDevice');
  var zone = document.getElementById('rooms');

  if (device && zone && finePointer.matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;

    var render = function () {
      // Lerp toward the pointer so the tilt carries momentum instead of
      // snapping, which reads as artificial.
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      device.style.transform =
        'perspective(1400px) rotateY(' + (-8 + cx * 5).toFixed(2) + 'deg) ' +
        'rotateX(' + (2.5 - cy * 3.5).toFixed(2) + 'deg) translateZ(0)';
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(render);
      else raf = 0;
    };

    zone.addEventListener('pointermove', function (e) {
      if (reduce() || e.pointerType !== 'mouse') return;
      var b = zone.getBoundingClientRect();
      tx = (e.clientX - b.left) / b.width * 2 - 1;
      ty = (e.clientY - b.top) / b.height * 2 - 1;
      if (!raf) raf = requestAnimationFrame(render);
    });
    zone.addEventListener('pointerleave', function () {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(render);
    });
  }
})();
