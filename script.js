(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================
     BACKGROUND STARFIELD — cheap, drawn once,
     gentle drift tied to scroll, no per-frame
     redraw cost beyond a translate.
     ============================================ */
  (function starfield() {
    var canvas = document.getElementById('starfield');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var stars = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function size() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function build() {
      var count = Math.floor((window.innerWidth * window.innerHeight) / 6000);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: Math.random() * 1.3 + 0.2,
          a: Math.random() * 0.6 + 0.25,
          tw: Math.random() * 0.015 + 0.004,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    var t = 0;
    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var flicker = reduceMotion ? s.a : s.a * (0.7 + 0.3 * Math.sin(t * s.tw * 10 + s.phase));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(238,240,251,' + flicker.toFixed(3) + ')';
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      t++;
      if (!reduceMotion) requestAnimationFrame(draw);
    }

    size();
    build();
    draw();

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        size();
        build();
        if (reduceMotion) draw();
      }, 200);
    });
  })();

  /* ============================================
     HERO CONSTELLATION — search engines as nodes
     radiating from a central point, connected by
     pulsing lines. This is the page's signature
     visual: the "network" that GEO/AEO work spans.
     ============================================ */
  (function constellation() {
    var canvas = document.getElementById('constellation');
    var hero = document.getElementById('hero');
    if (!canvas || !hero) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var nodes = [];
    var center = { x: 0, y: 0 };
    var labels = ['Google', 'Bing', 'ChatGPT', 'Gemini', 'Perplexity', 'Claude'];

    function layout() {
      var w = hero.clientWidth;
      var h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      center.x = w * 0.78;
      center.y = h * 0.42;
      var radius = Math.min(w, h) * 0.28;

      nodes = labels.map(function (label, i) {
        var angle = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
        return {
          angle: angle,
          radius: radius * (0.85 + (i % 2) * 0.18),
          label: label,
          speed: 0.0006 + (i % 3) * 0.00015,
          twPhase: Math.random() * Math.PI * 2
        };
      });
    }

    var t = 0;
    function draw() {
      var w = hero.clientWidth, h = hero.clientHeight;
      ctx.clearRect(0, 0, w, h);

      var positions = nodes.map(function (n) {
        var a = n.angle + t * n.speed;
        return {
          x: center.x + Math.cos(a) * n.radius,
          y: center.y + Math.sin(a) * n.radius * 0.72,
          label: n.label,
          twPhase: n.twPhase
        };
      });

      // lines from center + between adjacent nodes
      ctx.lineWidth = 1;
      positions.forEach(function (p, i) {
        var pulse = 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(t * 0.02 + i));
        ctx.strokeStyle = 'rgba(82,229,255,' + pulse.toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });

      // center node
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,207,107,0.9)';
      ctx.arc(center.x, center.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,207,107,0.25)';
      ctx.arc(center.x, center.y, 10, 0, Math.PI * 2);
      ctx.stroke();

      // orbit nodes
      positions.forEach(function (p) {
        var glow = 0.6 + 0.4 * Math.sin(t * 0.03 + p.twPhase);
        ctx.beginPath();
        ctx.fillStyle = 'rgba(155,123,255,' + glow.toFixed(3) + ')';
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '500 11px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'rgba(136,144,181,0.85)';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label, p.x + 10, p.y);
      });

      t++;
      if (!reduceMotion) requestAnimationFrame(draw);
    }

    layout();
    draw();

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        layout();
        if (reduceMotion) draw();
      }, 200);
    });
  })();

  /* ============================================
     SCROLL REVEAL
     ============================================ */
  (function reveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          var delay = entry.target.closest('.timeline') ? i * 90 : 0;
          setTimeout(function () { entry.target.classList.add('visible'); }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { observer.observe(el); });
  })();

  /* ============================================
     JOURNEY RAIL — progress + active section
     ============================================ */
  (function rail() {
    var progress = document.getElementById('railProgress');
    var links = document.querySelectorAll('.rail-stops a');
    var sections = Array.prototype.map.call(links, function (a) {
      return document.getElementById(a.getAttribute('data-target'));
    }).filter(Boolean);

    function onScroll() {
      var doc = document.documentElement;
      var scrollTop = window.scrollY;
      var scrollHeight = doc.scrollHeight - window.innerHeight;
      var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      if (progress) progress.style.height = Math.min(100, Math.max(0, pct)) + '%';

      var current = sections[0];
      sections.forEach(function (s) {
        if (window.scrollY >= s.offsetTop - window.innerHeight * 0.4) current = s;
      });
      links.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('data-target') === (current && current.id));
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ============================================
     CONTACT MODALS
     ============================================ */
  (function modals() {
    var contactModal = document.getElementById('contactModal');
    var mailModal = document.getElementById('mailModal');
    var openContact = document.getElementById('openContact');
    var closeContact = document.getElementById('closeContact');
    var openMail = document.getElementById('openMail');
    var closeMail = document.getElementById('closeMail');

    function open(modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closeAll() {
      contactModal.classList.remove('active');
      mailModal.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (openContact) openContact.addEventListener('click', function () { open(contactModal); });
    if (closeContact) closeContact.addEventListener('click', closeAll);
    if (openMail) openMail.addEventListener('click', function () {
      contactModal.classList.remove('active');
      open(mailModal);
    });
    if (closeMail) closeMail.addEventListener('click', closeAll);

    [contactModal, mailModal].forEach(function (modal) {
      if (!modal) return;
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeAll();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });
  })();

})();
