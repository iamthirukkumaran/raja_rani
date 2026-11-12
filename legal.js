/* ============================================================
   Raja Rani — legal page behaviour
   Everything here is enhancement: the policy reads with JS off.
   ============================================================ */
(function () {
  'use strict';

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrowMQ = window.matchMedia('(max-width: 1080px)');

  var rail     = document.getElementById('rail');
  var sections = Array.prototype.slice.call(document.querySelectorAll('.ldoc > section'));
  var links    = rail ? Array.prototype.slice.call(rail.querySelectorAll('.lrail__list a')) : [];
  var thumb    = rail ? rail.querySelector('.lrail__thumb') : null;
  var prog     = document.getElementById('prog');
  var bar      = prog ? prog.firstElementChild : null;
  var toTop    = document.getElementById('toTop');

  /* ---------- 1. The rail folds away on narrow screens ---------- */

  if (rail) {
    // Open is the no-JS default: right on desktop, merely long on a phone,
    // so JS only ever has to close it.
    var syncRail = function () { rail.open = !narrowMQ.matches; };
    syncRail();
    narrowMQ.addEventListener('change', syncRail);
    // Jumping to a section on a phone should put the list away behind you —
    // but folding it shrinks the page mid-scroll, so drive the scroll here
    // instead of letting the browser chase a target that has moved.
    rail.addEventListener('click', function (e) {
      if (!narrowMQ.matches) return;
      var a = e.target.closest('a');
      if (!a) return;
      var id = (a.getAttribute('href') || '').slice(1);
      var target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      rail.open = false;
      var top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(top, 0), behavior: reduceMQ.matches ? 'auto' : 'smooth' });
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '#' + id);
      }
    });
  }

  /* ---------- 2. Reading progress + back to top ---------- */

  var ticking = false;

  var onScroll = function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;

      if (bar) bar.style.transform = 'scaleX(' + pct.toFixed(4) + ')';
      if (prog) prog.classList.toggle('is-on', y > 10);
      if (toTop) toTop.classList.toggle('is-on', y > 700);

      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMQ.matches ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 3. The rail follows the section you are reading ---------- */

  if (links.length && sections.length) {
    var current = -1;

    var moveThumb = function (link) {
      if (!thumb || narrowMQ.matches) return;
      thumb.style.height = link.offsetHeight + 'px';
      thumb.style.transform = 'translateY(' + link.offsetTop + 'px)';
      thumb.style.opacity = '1';
    };

    var setActive = function (idx) {
      if (idx === current || idx < 0 || idx >= links.length) return;
      if (current >= 0) links[current].classList.remove('is-here');
      current = idx;
      links[idx].classList.add('is-here');
      links[idx].removeAttribute('aria-current');
      links[idx].setAttribute('aria-current', 'true');
      moveThumb(links[idx]);
    };

    // Whichever heading is nearest below the nav wins — cheaper and steadier
    // than an observer when sections are wildly different heights.
    var pickActive = function () {
      var line = window.scrollY + (document.documentElement.clientHeight * 0.26);
      var idx = 0;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= line) idx = i; else break;
      }
      // At the very bottom, the last section is the one being read.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        idx = sections.length - 1;
      }
      setActive(idx);
    };

    var railTick = false;
    var onRailScroll = function () {
      if (railTick) return;
      railTick = true;
      requestAnimationFrame(function () { pickActive(); railTick = false; });
    };
    window.addEventListener('scroll', onRailScroll, { passive: true });
    window.addEventListener('resize', function () {
      if (current >= 0) moveThumb(links[current]);
      onRailScroll();
    }, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onRailScroll);
    onRailScroll();
  }

  /* ---------- 4. Copy a link to any section ---------- */

  var COPY = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.8 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.8-1.7"/></svg>';
  var DONE = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  sections.forEach(function (sec) {
    var h = sec.querySelector('h2');
    if (!h || !sec.id) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lcopy';
    btn.innerHTML = COPY;
    btn.setAttribute('aria-label', 'Copy a link to this section');
    btn.title = 'Copy link to section';

    var timer = 0;
    btn.addEventListener('click', function () {
      var url = window.location.origin + window.location.pathname + '#' + sec.id;
      var done = function () {
        btn.innerHTML = DONE;
        btn.classList.add('is-done');
        btn.setAttribute('aria-label', 'Link copied');
        clearTimeout(timer);
        timer = setTimeout(function () {
          btn.innerHTML = COPY;
          btn.classList.remove('is-done');
          btn.setAttribute('aria-label', 'Copy a link to this section');
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { window.location.hash = sec.id; });
      } else {
        window.location.hash = sec.id;
      }
    });

    h.appendChild(btn);
  });

  /* ---------- 5. Deep links land under the nav ---------- */

  // privacy.html#delete is printed in the app and in both store listings. The
  // browser jumps before the rail folds and before the webfonts swap in, so
  // the heading drifts; put it back once both have settled.
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
})();
