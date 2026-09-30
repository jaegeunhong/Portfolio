/* =========================================================
   Jae Geun Hong — Portfolio interactions
   ========================================================= */
(function () {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  // Callbacks run once per animation frame while scrolling
  const scrollTasks = [];

  /* ---------- Intro ---------- */
  function initIntro() {
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-loaded')));
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    document.querySelectorAll('[data-stagger]').forEach((group) => {
      Array.from(group.children).forEach((el, i) => el.style.setProperty('--i', i));
    });

    const els = document.querySelectorAll('[data-reveal]');
    const settle = (el) => {
      // Once the entrance is finished, hand the element back to its own transitions (hover etc.)
      const done = () => { el.removeAttribute('data-reveal'); el.style.removeProperty('--i'); };
      const delay = parseFloat(getComputedStyle(el).transitionDelay) * 1000 || 0;
      setTimeout(done, delay + 1900);
    };

    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        settle(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    els.forEach((el) => io.observe(el));
  }

  /* ---------- Number counters ---------- */
  function initCounters() {
    const els = document.querySelectorAll('[data-count]');
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    els.forEach((el) => { el.textContent = '0'; });

    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const duration = 1500;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => run(entry.target), 250);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    els.forEach((el) => io.observe(el));
  }

  /* ---------- Header: progress, hide on scroll, scroll-spy ---------- */
  function initHeader() {
    const header = document.querySelector('[data-header]');
    const bar = document.querySelector('.progress span');
    const nav = document.querySelector('.nav');
    const indicator = nav && nav.querySelector('.nav-indicator');
    const links = Array.from(document.querySelectorAll('[data-nav]'));
    const sections = ['home', 'about', 'work', 'spinlaunch', 'vex', 'contact']
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    let lastY = window.scrollY;
    let current = null;

    const moveIndicator = () => {
      if (!indicator) return;
      const link = nav.querySelector(`[data-nav="${current}"]`);
      if (link && nav.offsetParent !== null) {
        indicator.style.width = link.offsetWidth + 'px';
        indicator.style.transform = `translateX(${link.offsetLeft}px)`;
        indicator.style.opacity = '1';
      } else {
        indicator.style.opacity = '0';
      }
    };

    const setActive = (id) => {
      if (id === current) return;
      current = id;
      links.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === id));
      moveIndicator();
    };

    scrollTasks.push(() => {
      const y = window.scrollY;
      const max = root.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;

      header.classList.toggle('is-scrolled', y > 16);
      if (!document.body.classList.contains('menu-open')) {
        if (y > lastY + 4 && y > 480) header.classList.add('is-hidden');
        else if (y < lastY - 4 || y <= 480) header.classList.remove('is-hidden');
      }
      lastY = y;

      const line = window.innerHeight * 0.4;
      let active = 'home';
      sections.forEach((s) => { if (s.getBoundingClientRect().top <= line) active = s.id; });
      // Contact is short: treat reaching the page bottom as being on it
      if (max > 0 && y >= max - 4) active = 'contact';
      setActive(active);
    });

    window.addEventListener('resize', moveIndicator);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    const btn = document.querySelector('.menu-toggle');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    const set = (open) => {
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (open) menu.querySelector('a').focus({ preventScroll: true });
    };

    menu.inert = true;
    btn.addEventListener('click', () => {
      const open = !document.body.classList.contains('menu-open');
      set(open);
      menu.inert = !open;
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { set(false); menu.inert = true; }));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { set(false); menu.inert = true; btn.focus(); }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => {
      if (e.matches) { set(false); menu.inert = true; }
    });
  }

  /* ---------- Word-by-word statement ---------- */
  function initWords() {
    const el = document.querySelector('[data-words]');
    if (!el) return;
    const words = [];

    const split = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const span = document.createElement('span');
            span.className = 'w';
            span.textContent = part;
            frag.appendChild(span);
            words.push(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          split(child);
        }
      });
    };
    split(el);

    if (reduceMotion) { words.forEach((w) => w.classList.add('on')); return; }

    scrollTasks.push(() => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.9;
      const end = vh * 0.45;
      const p = clamp((start - r.top) / (start - end), 0, 1);
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    });
  }

  /* ---------- Parallax ---------- */
  function initParallax() {
    if (reduceMotion) return;
    const els = Array.from(document.querySelectorAll('[data-parallax]'));
    scrollTasks.push(() => {
      const vh = window.innerHeight;
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const speed = parseFloat(el.dataset.parallax) || 0.08;
        const offset = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.setProperty('--py', clamp(offset, -34, 34).toFixed(1) + 'px');
      });
    });
  }

  /* ---------- Pointer effects ---------- */
  function initPointer() {
    if (!finePointer) return;

    const hero = document.querySelector('.hero');
    const glow = hero && hero.querySelector('.hero-glow');
    if (hero && glow && !reduceMotion) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        glow.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        glow.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    }

    document.querySelectorAll('.card, .panel, .work-card').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Inline videos: play only while visible ---------- */
  const visibleVideos = new Set();
  function initVideos() {
    const vids = document.querySelectorAll('video[data-autoplay]');
    const saveData = navigator.connection && navigator.connection.saveData;
    if (reduceMotion || saveData || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const v = entry.target;
        if (entry.isIntersecting) {
          visibleVideos.add(v);
          if (!document.querySelector('.lightbox[open]')) {
            const p = v.play();
            if (p && p.catch) p.catch(() => {});
          }
        } else {
          visibleVideos.delete(v);
          v.pause();
        }
      });
    }, { threshold: 0.3 });

    vids.forEach((v) => { v.muted = true; io.observe(v); });
  }

  /* ---------- Lightbox ---------- */
  function initLightbox() {
    const dlg = document.querySelector('.lightbox');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    const stage = dlg.querySelector('.lb-stage');
    const caption = dlg.querySelector('.lb-caption');

    const open = (trigger) => {
      stage.innerHTML = '';
      let media;
      if (trigger.dataset.lightbox === 'video') {
        media = document.createElement('video');
        media.src = trigger.dataset.src;
        media.controls = true;
        media.autoplay = true;
        media.playsInline = true;
        if (trigger.dataset.poster) media.poster = trigger.dataset.poster;
      } else {
        media = document.createElement('img');
        media.src = trigger.dataset.src;
        const img = trigger.querySelector('img');
        media.alt = img ? img.alt : '';
      }
      stage.appendChild(media);
      caption.textContent = trigger.dataset.caption || '';
      visibleVideos.forEach((v) => v.pause());
      dlg.showModal();
      if (media.tagName === 'VIDEO') {
        // Some browsers block autoplay with sound — fall back to muted playback
        const p = media.play();
        if (p && p.catch) p.catch(() => { media.muted = true; media.play().catch(() => {}); });
      }
    };

    document.querySelectorAll('[data-lightbox]').forEach((t) => {
      t.addEventListener('click', (e) => { e.preventDefault(); open(t); });
    });

    dlg.addEventListener('click', (e) => {
      if (!e.target.closest('img, video, .lb-caption') || e.target.closest('.lb-close')) dlg.close();
    });
    dlg.addEventListener('close', () => {
      stage.innerHTML = '';
      visibleVideos.forEach((v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); });
    });
  }

  /* ---------- Copy email ---------- */
  function initCopy() {
    const toast = document.querySelector('.toast');
    let timer;
    const show = (msg) => {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('is-on');
      clearTimeout(timer);
      timer = setTimeout(() => toast.classList.remove('is-on'), 2200);
    };
    document.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const text = btn.dataset.copy;
        try {
          await navigator.clipboard.writeText(text);
          show('Email copied to clipboard');
        } catch (err) {
          // Fallback for browsers without the async clipboard API
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
          document.body.appendChild(ta);
          ta.select();
          const ok = document.execCommand && document.execCommand('copy');
          ta.remove();
          if (ok) show('Email copied to clipboard');
          else window.location.href = 'mailto:' + text;
        }
      });
    });
  }

  /* ---------- SpinLaunch principle animation ---------- */
  function initSpinDemo() {
    const svg = document.querySelector('[data-spin-demo]');
    if (!svg) return;

    const q = (sel) => svg.querySelector(sel);
    const arm = q('[data-sd-arm]');
    const proj = q('[data-sd-proj]');
    const trail = q('[data-sd-trail]');
    const force = q('[data-sd-force]');
    const vel = q('[data-sd-vel]');
    const forceLabel = q('[data-sd-force-label]');
    const velLabel = q('[data-sd-vel-label]');
    const trigger = q('[data-sd-trigger]');
    const tangent = q('.sd-tangent');
    const panel = svg.closest('.panel');
    const phaseEl = panel.querySelector('[data-phase]');
    const meter = panel.querySelector('[data-meter]');
    const demoSteps = panel.querySelectorAll('[data-demo-step]');
    const textSteps = document.querySelectorAll('.step[data-step]');

    const CX = 240, CY = 240, R = 130;
    const REL = -Math.PI / 2;                 // release point: top of the housing
    const OMEGA_MAX = Math.PI * 2 * 1.5;      // rad/s at "target speed"
    const SPINUP = 2.6, SPINDOWN = 1.4;       // seconds
    const SLOWMO = 0.16;                      // time scale during flight

    const set = (el, attrs) => { for (const k in attrs) el.setAttribute(k, attrs[k]); };
    const hide = (el, hidden) => { el.style.opacity = hidden ? '0' : '1'; };

    let theta = 0.4, omega = 0, phase = 'load', phaseT = 0, timeScale = 1, stepShown = 0;
    let p = { x: 0, y: 0, vx: 0, vy: 0, attached: true, alpha: 0 };

    const showStep = (n, label) => {
      if (label) phaseEl.textContent = label;
      if (n === stepShown) return;
      stepShown = n;
      demoSteps.forEach((li) => li.classList.toggle('is-on', Number(li.dataset.demoStep) === n));
      textSteps.forEach((li) => li.classList.toggle('is-live', Number(li.dataset.step) === n));
    };

    const arcPath = (a0, a1) => {
      const x0 = CX + R * Math.cos(a0), y0 = CY + R * Math.sin(a0);
      const x1 = CX + R * Math.cos(a1), y1 = CY + R * Math.sin(a1);
      const large = a1 - a0 > Math.PI ? 1 : 0;
      return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    };

    const render = () => {
      set(arm, { transform: `rotate(${(theta * 180 / Math.PI).toFixed(2)} ${CX} ${CY})` });
      meter.style.width = (omega / OMEGA_MAX * 100).toFixed(1) + '%';

      if (p.attached) {
        p.x = CX + R * Math.cos(theta);
        p.y = CY + R * Math.sin(theta);
      }
      set(proj, { cx: p.x.toFixed(1), cy: p.y.toFixed(1) });
      proj.style.opacity = p.alpha.toFixed(2);

      // Motion trail behind the projectile while it is still held
      const sweep = Math.min(omega * 0.11, 1.5);
      if (p.attached && sweep > 0.05) {
        set(trail, { d: arcPath(theta - sweep, theta) });
        trail.style.opacity = (0.08 + 0.2 * omega / OMEGA_MAX).toFixed(2);
      } else {
        trail.style.opacity = '0';
      }

      // Centripetal force (inward) — only exists while held
      const k = omega / OMEGA_MAX;
      if (p.attached && k > 0.08) {
        const ux = Math.cos(theta), uy = Math.sin(theta);
        const len = 16 + 38 * k;
        set(force, {
          x1: (p.x - ux * 16).toFixed(1), y1: (p.y - uy * 16).toFixed(1),
          x2: (p.x - ux * (16 + len)).toFixed(1), y2: (p.y - uy * (16 + len)).toFixed(1)
        });
        // label sits beside the arrow (on the leading side) so it never covers the arm
        const tx = -uy, ty = ux;
        set(forceLabel, { x: (p.x - ux * (16 + len * 0.6) + tx * 20 - 8).toFixed(1), y: (p.y - uy * (16 + len * 0.6) + ty * 20 + 5).toFixed(1) });
        hide(force, false); hide(forceLabel, false);
      } else {
        hide(force, true); hide(forceLabel, true);
      }

      // Velocity: tangent while spinning, straight line after release
      let vx, vy, vlen;
      if (p.attached) {
        vx = -Math.sin(theta); vy = Math.cos(theta); vlen = 16 + 44 * k;
      } else {
        vx = 1; vy = 0; vlen = 60;
      }
      if ((p.attached && k > 0.08) || (!p.attached && p.alpha > 0)) {
        set(vel, {
          x1: (p.x + vx * 14).toFixed(1), y1: (p.y + vy * 14).toFixed(1),
          x2: (p.x + vx * (14 + vlen)).toFixed(1), y2: (p.y + vy * (14 + vlen)).toFixed(1)
        });
        set(velLabel, { x: (p.x + vx * (24 + vlen) - 4).toFixed(1), y: (p.y + vy * (24 + vlen) - 8).toFixed(1) });
        hide(vel, false); hide(velLabel, false);
      } else {
        hide(vel, true); hide(velLabel, true);
      }
    };

    const step = (dtReal) => {
      phaseT += dtReal;
      // ease the time scale towards its target (slow-mo during flight)
      const targetScale = phase === 'flight' ? SLOWMO : 1;
      timeScale += (targetScale - timeScale) * Math.min(1, dtReal * 10);
      const dt = dtReal * timeScale;

      switch (phase) {
        case 'load':
          p.attached = true;
          p.alpha = Math.min(1, phaseT / 0.5);
          showStep(1, 'Load');
          if (phaseT > 0.7) { phase = 'spin'; phaseT = 0; }
          break;
        case 'spin':
          omega = Math.min(OMEGA_MAX, omega + (OMEGA_MAX / SPINUP) * dt);
          showStep(1, 'Spin-up');
          if (omega >= OMEGA_MAX) { phase = 'armed'; phaseT = 0; trigger.classList.add('is-armed'); }
          break;
        case 'armed': {
          showStep(1, 'Target speed · armed');
          const before = Math.floor((theta - REL) / (Math.PI * 2));
          const after = Math.floor((theta + omega * dt - REL) / (Math.PI * 2));
          if (phaseT > 0.5 && after > before) {
            // Release exactly at the top
            theta = REL + after * Math.PI * 2;
            p.attached = false;
            p.x = CX; p.y = CY - R;
            p.vx = omega * R; p.vy = 0;
            trigger.classList.add('is-dropped');
            tangent.classList.add('is-on');
            phase = 'flight'; phaseT = 0;
            showStep(2, 'Release');
          }
          break;
        }
        case 'flight':
          if (phaseT > 0.55) showStep(3, 'Tangent flight · slow-mo');
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x > 470) p.alpha = Math.max(0, p.alpha - dtReal * 4);
          if (p.x > 520 || p.alpha <= 0) { phase = 'spindown'; phaseT = 0; }
          break;
        case 'spindown':
          showStep(0, 'Spin-down');
          omega = Math.max(0, omega - (OMEGA_MAX / SPINDOWN) * dt);
          if (phaseT > 0.4) { trigger.classList.remove('is-dropped', 'is-armed'); tangent.classList.remove('is-on'); }
          if (omega <= 0 && phaseT > 0.8) { phase = 'load'; phaseT = 0; p.alpha = 0; p.attached = true; }
          break;
      }
      theta += omega * dt;
    };

    if (reduceMotion) {
      // Static frame: just after release
      theta = REL + 0.9; omega = OMEGA_MAX;
      p = { x: CX + 150, y: CY - R, vx: 0, vy: 0, attached: false, alpha: 1 };
      trigger.classList.add('is-dropped');
      tangent.classList.add('is-on');
      render();
      showStep(3, 'Release → tangent flight');
      return;
    }

    let running = false, last = 0, raf = 0;
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      step(dt);
      render();
      if (running) raf = requestAnimationFrame(loop);
    };

    render();
    const io = new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      if (visible && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
      else if (!visible && running) { running = false; cancelAnimationFrame(raf); textSteps.forEach((li) => li.classList.remove('is-live')); stepShown = -1; }
    }, { threshold: 0.2 });
    io.observe(svg);
  }

  /* ---------- Trajectory chart: projectile travelling the 45° arc ---------- */
  function initTrajectory() {
    const svg = document.querySelector('[data-traj]');
    if (!svg || reduceMotion) return;
    const path = svg.querySelector('[data-traj-path]');
    const dot = svg.querySelector('[data-traj-dot]');
    const panel = svg.closest('.traj-panel');
    const total = path.getTotalLength();

    let running = false, start = 0, raf = 0;
    const DURATION = 2600, PAUSE = 1400;

    const loop = (now) => {
      const t = (now - start) % (DURATION + PAUSE);
      const p = Math.min(t / DURATION, 1);
      const pt = path.getPointAtLength(total * p);
      dot.setAttribute('cx', pt.x.toFixed(1));
      dot.setAttribute('cy', pt.y.toFixed(1));
      dot.style.opacity = p >= 1 ? String(Math.max(0, 1 - (t - DURATION) / 500)) : '1';
      if (running) raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      if (visible && !running) {
        running = true;
        // let the arcs draw in first
        start = performance.now() + (panel.classList.contains('is-in') ? 0 : 2200);
        raf = requestAnimationFrame(loop);
      } else if (!visible && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    }, { threshold: 0.3 });
    io.observe(svg);
  }

  /* ---------- Scroll loop ---------- */
  function initScrollLoop() {
    let ticking = false;
    const run = () => { scrollTasks.forEach((fn) => fn()); ticking = false; };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    run();
  }

  /* ---------- Misc ---------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  initIntro();
  initReveal();
  initCounters();
  initHeader();
  initMenu();
  initWords();
  initParallax();
  initPointer();
  initVideos();
  initLightbox();
  initCopy();
  initSpinDemo();
  initTrajectory();
  initYear();
  initScrollLoop();
})();
