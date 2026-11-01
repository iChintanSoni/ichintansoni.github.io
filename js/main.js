/* =====================================================================
   Chintan Soni — portfolio interactions
   GSAP 3.13 (ScrollTrigger, SplitText) + Lenis, all loaded from CDN.
   Everything degrades: no GSAP → static page; reduced motion → no
   preloader, no smooth scroll, no cursor, static hero canvas.
   ===================================================================== */
(function () {
  'use strict';

  const d = document;
  const w = window;
  const html = d.documentElement;
  const body = d.body;

  const reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = w.matchMedia('(pointer: fine)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const hasSplit = hasGsap && typeof SplitText !== 'undefined';
  const hasLenis = typeof Lenis !== 'undefined';

  if (hasGsap) gsap.registerPlugin(ScrollTrigger, ...(hasSplit ? [SplitText] : []));

  const yearEl = d.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------------
     Smooth scroll (Lenis)
  ------------------------------------------------------------------ */
  let lenis = null;
  if (hasGsap && hasLenis && !reduce) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target, offset) {
    const el = typeof target === 'string' ? d.querySelector(target) : target;
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el, { offset: offset, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else {
      const top = el.getBoundingClientRect().top + w.pageYOffset + offset;
      w.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  d.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id.length < 2 || !d.querySelector(id)) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(id, id === '#hero' ? 0 : -56);
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  /* ------------------------------------------------------------------
     Mobile menu
  ------------------------------------------------------------------ */
  const nav = d.getElementById('nav');
  const burger = d.getElementById('burger');
  const menu = d.getElementById('menu');

  function openMenu() {
    body.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    nav.classList.remove('is-hidden');
    if (lenis) lenis.stop(); else body.style.overflow = 'hidden';
    if (hasGsap && !reduce) {
      gsap.fromTo('.menu-links a', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.25, overwrite: true });
    } else {
      d.querySelectorAll('.menu-links a').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
    }
  }
  function closeMenu() {
    if (!body.classList.contains('menu-open')) return;
    body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start(); else body.style.overflow = '';
  }
  if (burger) burger.addEventListener('click', () => (body.classList.contains('menu-open') ? closeMenu() : openMenu()));
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  w.addEventListener('resize', () => { if (w.innerWidth > 900) closeMenu(); });

  /* ------------------------------------------------------------------
     Hero canvas: drifting neural network that leans toward the pointer
  ------------------------------------------------------------------ */
  function initNet() {
    const c = d.getElementById('net');
    if (!c) return;
    const ctx = c.getContext('2d');
    const hero = c.parentElement;
    const COLORS = ['139,124,255', '79,227,255', '255,122,217'];
    const LINK = 150, LINK2 = LINK * LINK, MOUSE_R = 220, MOUSE_R2 = MOUSE_R * MOUSE_R;
    let W = 0, H = 0, nodes = [], raf = null, visible = true, running = !d.hidden;
    const mouse = { x: -9999, y: -9999, active: false };

    function resize() {
      const dpr = Math.min(w.devicePixelRatio || 1, 2);
      const r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      c.style.width = W + 'px'; c.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(110, Math.max(40, Math.round((W * H) / 14000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: 1 + Math.random() * 1.6,
        c: Math.random() < 0.72 ? COLORS[0] : (Math.random() < 0.7 ? COLORS[1] : COLORS[2]),
        p: Math.random() * Math.PI * 2
      }));
    }

    function step(t) {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (mouse.active) {
          const dx = mouse.x - n.x, dy = mouse.y - n.y, d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_R2 && d2 > 1) {
            const f = (1 - Math.sqrt(d2) / MOUSE_R) * 0.0016;
            n.vx += dx * f; n.vy += dy * f;
          }
        }
        n.vx *= 0.992; n.vy *= 0.992;
        const sp = Math.hypot(n.vx, n.vy);
        if (sp > 0.7) { n.vx *= 0.7 / sp; n.vy *= 0.7 / sp; }
        if (sp < 0.08) { n.vx += (Math.random() - 0.5) * 0.04; n.vy += (Math.random() - 0.5) * 0.04; }
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < LINK2) {
            ctx.strokeStyle = 'rgba(' + a.c + ',' + ((1 - d2 / LINK2) * 0.32).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      if (mouse.active) {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const dx = mouse.x - n.x, dy = mouse.y - n.y, d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_R2) {
            ctx.strokeStyle = 'rgba(79,227,255,' + ((1 - d2 / MOUSE_R2) * 0.45).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(n.x, n.y); ctx.stroke();
          }
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const tw = 0.55 + 0.45 * Math.sin(t * 0.0018 + n.p);
        ctx.fillStyle = 'rgba(' + n.c + ',' + (0.95 * tw).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    function loop(t) {
      if (!running || !visible) { raf = null; return; }
      step(t);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!raf && running && visible) raf = requestAnimationFrame(loop); }

    hero.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.active = false; });
    if ('IntersectionObserver' in w) {
      new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; start(); }, { threshold: 0 }).observe(c);
    }
    d.addEventListener('visibilitychange', () => { running = !d.hidden; start(); });
    let rt;
    w.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

    resize();
    if (!hasGsap || reduce) c.style.opacity = '1';
    if (reduce) { step(0); return; }
    start();
  }

  /* ------------------------------------------------------------------
     Custom cursor (fine pointers only)
  ------------------------------------------------------------------ */
  function initCursor() {
    if (!fine || reduce || !hasGsap) return;
    const cur = d.querySelector('.cursor');
    if (!cur) return;
    html.classList.add('has-cursor');
    const dot = cur.querySelector('.cursor-dot');
    const ring = cur.querySelector('.cursor-ring');
    const label = cur.querySelector('.cursor-label');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.42, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.42, ease: 'power3' });
    gsap.set(cur, { autoAlpha: 0 });
    let shown = false;
    w.addEventListener('pointermove', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      if (!shown) { shown = true; gsap.to(cur, { autoAlpha: 1, duration: 0.4 }); }
    }, { passive: true });
    d.addEventListener('mouseleave', () => gsap.to(cur, { autoAlpha: 0, duration: 0.3 }));
    d.addEventListener('mouseenter', () => { if (shown) gsap.to(cur, { autoAlpha: 1, duration: 0.3 }); });

    const SEL = 'a, button, [data-cursor], input, textarea, label';
    d.addEventListener('pointerover', (e) => {
      const t = e.target.closest(SEL);
      if (!t) return;
      const lab = t.closest('[data-cursor]');
      if (lab) { label.textContent = lab.getAttribute('data-cursor'); cur.classList.add('is-label'); cur.classList.remove('is-hover'); }
      else { cur.classList.add('is-hover'); cur.classList.remove('is-label'); }
    });
    d.addEventListener('pointerout', (e) => {
      const t = e.target.closest(SEL);
      if (!t) return;
      if (e.relatedTarget && t.contains(e.relatedTarget)) return;
      cur.classList.remove('is-hover', 'is-label');
    });
  }

  /* ------------------------------------------------------------------
     Magnetic buttons, spotlight cards, 3D tilt
  ------------------------------------------------------------------ */
  function initHoverFx() {
    d.querySelectorAll('.spot').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });
    if (!fine || reduce || !hasGsap) return;

    d.querySelectorAll('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      }, { passive: true });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });

    d.querySelectorAll('.tilt').forEach((el) => {
      const rX = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3' });
      const rY = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rX(-py * 7); rY(px * 7);
      }, { passive: true });
      el.addEventListener('pointerleave', () => { rX(0); rY(0); });
    });
  }

  /* ------------------------------------------------------------------
     Copy email
  ------------------------------------------------------------------ */
  d.querySelectorAll('.copy-email').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const email = btn.getAttribute('data-email');
      const span = btn.querySelector('span');
      try {
        await navigator.clipboard.writeText(email);
        const old = span.textContent;
        span.textContent = 'Copied';
        btn.classList.add('is-copied');
        setTimeout(() => { span.textContent = old; btn.classList.remove('is-copied'); }, 1800);
      } catch (err) {
        w.location.href = 'mailto:' + email;
      }
    });
  });

  /* ------------------------------------------------------------------
     Counters: always end on the real number, animate when allowed
  ------------------------------------------------------------------ */
  function initCounters() {
    d.querySelectorAll('.count').forEach((el) => {
      const target = parseFloat(el.getAttribute('data-count'));
      const dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      if (!hasGsap || reduce) { el.textContent = target.toFixed(dec); return; }
      const o = { v: 0 };
      gsap.to(o, {
        v: target, duration: 1.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%' },
        onUpdate: () => { el.textContent = o.v.toFixed(dec); }
      });
    });
  }

  /* ------------------------------------------------------------------
     Scroll reveals
  ------------------------------------------------------------------ */
  function initReveals() {
    if (!hasGsap || reduce) return;

    d.querySelectorAll('[data-reveal]').forEach((el) => {
      if (el.getAttribute('data-reveal') === 'clip') {
        gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, {
          clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%' }, clearProps: 'clipPath'
        });
      } else {
        gsap.fromTo(el, { y: 36, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%' }, clearProps: 'transform,opacity,visibility'
        });
      }
    });

    d.querySelectorAll('[data-reveal-stagger]').forEach((el) => {
      const kids = Array.from(el.children);
      if (!kids.length) return;
      gsap.fromTo(kids, { y: 30, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 86%' }, clearProps: 'transform,opacity,visibility'
      });
    });

    if (hasSplit) {
      d.querySelectorAll('[data-split]').forEach((el) => {
        SplitText.create(el, {
          type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
          onSplit(self) {
            return gsap.from(self.lines, {
              yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.09,
              scrollTrigger: { trigger: el, start: 'top 85%' }
            });
          }
        });
      });
    } else {
      d.querySelectorAll('[data-split]').forEach((el) => {
        gsap.fromTo(el, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
      });
    }

    // Experience timeline: progress line + markers + body slide-in
    const tl = d.querySelector('.timeline');
    if (tl) {
      gsap.to('.tl-progress', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: tl, start: 'top 55%', end: 'bottom 55%', scrub: 0.4 } });
      d.querySelectorAll('.tl-item').forEach((item) => {
        ScrollTrigger.create({
          trigger: item, start: 'top 55%', end: 'bottom 55%',
          onEnter: () => item.classList.add('is-active'),
          onLeaveBack: () => item.classList.remove('is-active')
        });
        gsap.fromTo(item.querySelector('.tl-body'), { x: 40, autoAlpha: 0 }, {
          x: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out',
          scrollTrigger: { trigger: item, start: 'top 85%' }, clearProps: 'transform,opacity,visibility'
        });
        gsap.fromTo(item.querySelector('.tl-meta'), { autoAlpha: 0 }, {
          autoAlpha: 1, duration: 1, scrollTrigger: { trigger: item, start: 'top 85%' }
        });
      });
    }

    // Hero drifts up and fades as you leave it
    gsap.to('.hero-inner', { y: 140, autoAlpha: 0.15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-glow', { y: -120, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ------------------------------------------------------------------
     Nav: hide on scroll down, surface on scroll up, highlight section
  ------------------------------------------------------------------ */
  function initNav() {
    if (!hasGsap) return;
    ScrollTrigger.create({
      start: 'top -60', end: 'max',
      onUpdate: (self) => {
        const down = self.direction === 1 && self.scroll() > 320;
        nav.classList.toggle('is-hidden', down && !body.classList.contains('menu-open'));
      },
      onToggle: (self) => nav.classList.toggle('is-scrolled', self.isActive)
    });
    d.querySelectorAll('[data-nav]').forEach((link) => {
      const sec = d.getElementById(link.getAttribute('data-nav'));
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 50%', end: 'bottom 50%',
        onToggle: (self) => link.classList.toggle('is-active', self.isActive)
      });
    });
  }

  /* ------------------------------------------------------------------
     Preloader + hero intro
  ------------------------------------------------------------------ */
  const pre = d.getElementById('preloader');
  function killPreloader() { if (pre) { pre.style.display = 'none'; } }

  function setHeroInitial() {
    gsap.set('.hero-word', { yPercent: 115 });
    gsap.set(['.hero-eyebrow', '.hero-sub', '.hero-cta', '.hero-meta'], { autoAlpha: 0, y: 26 });
    gsap.set(['.scroll-hint', '.nav-inner'], { autoAlpha: 0 });
    gsap.set('.nav-inner', { y: -18 });
  }

  function heroIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.hero-word', { yPercent: 0, duration: 1.5, stagger: 0.14 }, 0)
      .to('#net', { opacity: 1, duration: 2.2, ease: 'power2.out' }, 0.25)
      .to('.hero-eyebrow', { autoAlpha: 1, y: 0, duration: 1 }, 0.35)
      .to(['.hero-sub', '.hero-cta', '.hero-meta'], { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.12 }, 0.6)
      .to('.nav-inner', { autoAlpha: 1, y: 0, duration: 1 }, 0.5)
      .to('.scroll-hint', { autoAlpha: 1, duration: 1 }, 1.3);
  }

  function runPreloader(done) {
    let seen = false;
    try { seen = sessionStorage.getItem('cs-intro') === '1'; } catch (e) { /* private mode */ }
    // Skip the intro when scripts arrived late (slow network): no one should wait twice.
    const late = (w.performance && performance.now() > 4000);
    if (!pre || reduce || seen || late) { killPreloader(); done(); return; }
    try { sessionStorage.setItem('cs-intro', '1'); } catch (e) { /* ignore */ }

    if (lenis) lenis.stop(); else body.style.overflow = 'hidden';
    const counter = { v: 0 };
    const cEl = pre.querySelector('.pre-counter');
    const tl = gsap.timeline({
      onComplete: () => {
        killPreloader();
        if (lenis) lenis.start(); else body.style.overflow = '';
        done();
      }
    });
    tl.from('.pre-word', { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.1 }, 0)
      .to('.pre-bar i', { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0.15)
      .to(counter, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: () => { cEl.textContent = String(Math.round(counter.v)).padStart(2, '0'); } }, 0.15)
      .to('.pre-inner', { yPercent: -30, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, '+=0.15')
      .to(pre, { yPercent: -100, duration: 0.95, ease: 'expo.inOut' }, '-=0.3');
  }

  /* ------------------------------------------------------------------
     Boot
  ------------------------------------------------------------------ */
  function init() {
    if (!hasGsap) {
      html.classList.add('no-gsap');
      killPreloader();
      initNet();
      initHoverFx();
      initCounters();
      return;
    }
    if (!reduce) setHeroInitial();
    initNet();
    initCursor();
    initHoverFx();
    initCounters();
    initReveals();
    initNav();
    runPreloader(() => {
      if (!reduce) heroIntro();
      ScrollTrigger.refresh();
    });
    w.addEventListener('load', () => ScrollTrigger.refresh());
  }

  const fontsReady = (d.fonts && d.fonts.ready) ? d.fonts.ready : Promise.resolve();
  const timeout = new Promise((res) => setTimeout(res, 1500));
  Promise.race([fontsReady, timeout]).then(init, init);
})();
