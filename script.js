(() => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // FX toggle state (default ON). Persist to localStorage.
  const FX_KEY = 'lokiFxEnabled';
  function getFxEnabled() {
    const raw = localStorage.getItem(FX_KEY);
    if (raw === '0') return false;
    if (raw === '1') return true;
    // Default: ON. For reduced-motion users, default OFF unless they explicitly enabled it.
    return !prefersReduced;
  }
  function setFxEnabled(v) {
    localStorage.setItem(FX_KEY, v ? '1' : '0');
  }

  // Neon particle FX (inspired by loki.html demo). Runs behind content.
  function createParticles() {
    const canvas = document.getElementById('fx');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;

    let W = 0;
    let H = 0;
    let DPR = 1;
    let ps = [];
    let raf = 0;
    let running = false;

    const rand = (a, b) => Math.random() * (b - a) + a;

    const mouse = { x: 0, y: 0, active: false };
    function setMouse(x, y) {
      mouse.x = x;
      mouse.y = y;
      mouse.active = true;
    }

    window.addEventListener('mousemove', (e) => setMouse(e.clientX, e.clientY), { passive: true });
    window.addEventListener('mouseleave', () => { mouse.active = false; }, { passive: true });
    window.addEventListener('touchstart', (e) => { if (e.touches[0]) setMouse(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    window.addEventListener('touchmove', (e) => { if (e.touches[0]) setMouse(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    window.addEventListener('touchend', () => { mouse.active = false; }, { passive: true });

    function neon(alpha, warm = 0) {
      const r = 255;
      const g = Math.floor(42 + warm * 45);
      const b = Math.floor(42 + warm * 58);
      return `rgba(${r},${g},${b},${alpha})`;
    }

    const cfg = {
      speed: 0.55,
      driftX: 0.16,
      driftY: -0.06,
      minR: 0.9,
      maxR: 2.6,
      linkDist: 120,
      linkAlpha: 0.20,
      glow: 14,
      repelRadius: 150,
      repelForce: 0.55,
    };

    function computeCount() {
      const raw = Math.floor((W * H) / 11000);
      return Math.max(70, Math.min(190, raw));
    }

    function resize() {
      DPR = Math.max(1, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const count = computeCount();
      ps = Array.from({ length: count }, () => ({
        x: rand(0, W),
        y: rand(0, H),
        r: rand(cfg.minR, cfg.maxR),
        vx: rand(-1, 1) * cfg.speed,
        vy: rand(-1, 1) * cfg.speed,
        phase: rand(0, Math.PI * 2),
        wobble: rand(0.6, 2.2),
      }));
    }

    let resizeTimer = 0;
    window.addEventListener(
      'resize',
      () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          resize();
          if (running && !raf) raf = window.requestAnimationFrame(frame);
        }, 120);
      },
      { passive: true }
    );

    resize();

    document.addEventListener('visibilitychange', () => {
      if (!running) return;
      if (document.visibilityState !== 'visible') {
        if (raf) window.cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        raf = window.requestAnimationFrame(frame);
      }
    });

    let last = performance.now();
    function frame(now) {
      raf = 0;
      if (!running) return;

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ctx.clearRect(0, 0, W, H);
      ctx.shadowBlur = cfg.glow;
      ctx.shadowColor = neon(0.9, 0.25);

      // Update
      for (const p of ps) {
        p.phase += dt * p.wobble;
        const wobX = Math.sin(p.phase) * 0.38;
        const wobY = Math.cos(p.phase) * 0.22;

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          const rr = cfg.repelRadius * cfg.repelRadius;
          if (d2 < rr && d2 > 0.001) {
            const d = Math.sqrt(d2);
            const f = (1 - d / cfg.repelRadius) * cfg.repelForce;
            p.vx += (dx / d) * f * 0.12;
            p.vy += (dy / d) * f * 0.12;
          }
        }

        p.vx *= 1 - 0.015;
        p.vy *= 1 - 0.015;

        p.x += (p.vx + cfg.driftX + wobX) * 60 * dt;
        p.y += (p.vy + cfg.driftY + wobY) * 60 * dt;

        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20;
        if (p.y > H + 20) p.y = -20;
      }

      // Links
      ctx.lineWidth = 1;
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i];
          const b = ps[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          const ld = cfg.linkDist;
          if (d2 < ld * ld) {
            const d = Math.sqrt(d2);
            const t = 1 - d / ld;
            ctx.strokeStyle = neon(cfg.linkAlpha * t, 0.2);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Dots
      for (const p of ps) {
        const warm = (p.r - cfg.minR) / (cfg.maxR - cfg.minR);

        ctx.shadowBlur = cfg.glow;
        ctx.shadowColor = neon(0.9, warm);
        ctx.fillStyle = neon(0.52, warm);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = cfg.glow * 1.2;
        ctx.shadowColor = neon(0.95, warm);
        ctx.fillStyle = neon(0.92, warm);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.6, p.r * 0.55), 0, Math.PI * 2);
        ctx.fill();
      }

      // Soft fog
      ctx.shadowBlur = 0;
      const fog = ctx.createRadialGradient(W * 0.66, H * 0.34, 80, W * 0.66, H * 0.34, Math.max(W, H) * 0.70);
      fog.addColorStop(0, 'rgba(255,42,42,0.07)');
      fog.addColorStop(1, 'rgba(255,42,42,0)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, W, H);

      raf = window.requestAnimationFrame(frame);
    }

    return {
      start() {
        if (running) return;
        running = true;
        last = performance.now();
        if (!raf) raf = window.requestAnimationFrame(frame);
      },
      stop() {
        running = false;
        if (raf) window.cancelAnimationFrame(raf);
        raf = 0;
        ctx.clearRect(0, 0, W, H);
      },
    };
  }

  const particles = createParticles();

  // Mobile nav
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.querySelector('#navMenu');
  const fxToggle = document.querySelector('.nav__fxToggle');
  const fxLabel = fxToggle ? fxToggle.querySelector('.nav__fxLabel') : null;
  const heroVideo = document.getElementById('heroVideo');

  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    menu.classList.toggle('is-open', open);
  }

  function applyFxState(enabled) {
    document.body.classList.toggle('fx-off', !enabled);

    if (fxToggle) {
      fxToggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    }
    if (fxLabel) {
      fxLabel.textContent = enabled ? '特效：开' : '特效：关';
    }

    if (enabled) {
      particles?.start();
      if (heroVideo) heroVideo.play().catch(() => {});
    } else {
      particles?.stop();
      if (heroVideo) {
        heroVideo.pause();
        heroVideo.currentTime = 0;
      }
    }
  }

  let fxEnabled = getFxEnabled();
  applyFxState(fxEnabled);

  if (fxToggle) {
    fxToggle.addEventListener('click', () => {
      fxEnabled = !fxEnabled;
      setFxEnabled(fxEnabled);
      applyFxState(fxEnabled);
    });
  }

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      setMenu(!open);
    });

    // Close menu on link click
    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      setMenu(false);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      setMenu(false);
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      const isClickOnMenu = menu.contains(e.target);
      const isClickOnToggle = toggle.contains(e.target);
      if (!isClickOnMenu && !isClickOnToggle) {
        setMenu(false);
      }
    });
  }

  // Smooth scroll offset fix for sticky header.
  // Use scroll-margin-top in CSS if needed later; JS keeps it simple now.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;

      // Let browser handle new-tab external links.
      if (a.target === '_blank') return;

      e.preventDefault();
      const header = document.querySelector('.site-header');
      const offset = header ? header.getBoundingClientRect().height + 10 : 0;
      const top = window.scrollY + target.getBoundingClientRect().top - offset;

      window.scrollTo({
        top,
        behavior: prefersReduced ? 'auto' : 'smooth',
      });

      // Keep URL hash in sync
      history.pushState(null, '', href);
      setMenu(false);
    });
  });

  // Reveal on scroll
  if (!prefersReduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const ent of entries) {
          if (!ent.isIntersecting) continue;
          ent.target.classList.add('is-visible');
          io.unobserve(ent.target);
        }
      },
      { root: null, threshold: 0.12 }
    );

    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  }
})();

