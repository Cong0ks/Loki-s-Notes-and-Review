(() => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile nav
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.querySelector('#navMenu');

  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    menu.classList.toggle('is-open', open);
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
