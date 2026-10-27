document.documentElement.classList.add('js');

(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  function setMenu(open, returnFocus = false) {
    links.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.querySelector('.menu-icon').textContent = open ? '−' : '＋';
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && links.classList.contains('is-open')) setMenu(false, true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) setMenu(false);
  });
  document.addEventListener('focusin', event => {
    if (!event.target.closest('.site-header')) setMenu(false);
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', () => setMenu(false));

  const header = document.querySelector('.site-header');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const main = document.querySelector('main');
  main?.addEventListener('animationend', event => {
    if (event.target === main && event.animationName === 'page-arrive') main.classList.add('page-arrived');
  });
  if (header && 'ResizeObserver' in window) {
    new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    }).observe(header);
  }

  let scrollQueued = false;
  function updateScroll() {
    const range = document.documentElement.scrollHeight - window.innerHeight;
    header?.classList.toggle('is-scrolled', window.scrollY > 8);
    header?.style.setProperty('--scroll-progress', String(range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0));
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  window.addEventListener('resize', updateScroll);
  window.addEventListener('pageshow', updateScroll);
  updateScroll();

  const mediaObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => target.classList.toggle('is-in-view', isIntersecting));
  }, { rootMargin: '80px' }) : null;

  document.querySelectorAll('.media-frame').forEach(frame => {
    const img = frame.querySelector('img');
    if (!img) return;
    let settled = false;
    function finish(success) {
      if (settled) return;
      settled = true;
      const wasLoading = frame.classList.contains('is-loading');
      frame.classList.remove('is-loading');
      frame.removeAttribute('aria-busy');
      mediaObserver?.unobserve(frame);
      if (!success) frame.classList.add('has-error');
      else if (wasLoading && !motion.matches) {
        frame.classList.add('is-ready');
        img.addEventListener('animationend', () => frame.classList.remove('is-ready'), { once: true });
      }
    }
    img.addEventListener('load', () => finish(true), { once: true });
    img.addEventListener('error', () => finish(false), { once: true });
    if (img.complete) { finish(img.naturalWidth > 0); return; }
    frame.classList.add('is-loading');
    frame.setAttribute('aria-busy', 'true');
    if (mediaObserver) mediaObserver.observe(frame);
    else frame.classList.add('is-in-view');
  });

  if ('IntersectionObserver' in window) {
    const reveals = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        reveals.unobserve(target);
        // Anchor navigation and keyboard focus should be immediately readable.
        let anchorId = location.hash.slice(1);
        try { anchorId = decodeURIComponent(anchorId); } catch { /* Keep malformed fragments harmless. */ }
        const anchor = document.getElementById(anchorId);
        if (motion.matches || target.contains(document.activeElement) ||
            (anchor && (target === anchor || target.contains(anchor) || anchor.contains(target)))) return;
        target.classList.add('is-revealing');
        target.addEventListener('animationend', () => target.classList.remove('is-revealing'), { once: true });
      });
    }, { threshold: .08 });
    document.querySelectorAll('.product-row,.section-heading,.manifesto,.engineering-grid,.detail-row,.community-inner,.editorial-section').forEach(element => {
      if (element.getBoundingClientRect().top > window.innerHeight) reveals.observe(element);
    });
  }
})();
