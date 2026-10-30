/* =====================================================
   LANDMARK DIGITAL — JS
   ===================================================== */

// Nav: scrolled state
const nav = document.getElementById('nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Mobile menu toggle
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
if (burger && mobileMenu) {
  const setOpen = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    if (open) {
      mobileMenu.removeAttribute('hidden');
      requestAnimationFrame(() => mobileMenu.classList.add('open'));
    } else {
      mobileMenu.classList.remove('open');
      mobileMenu.setAttribute('hidden', '');
    }
  };
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
  });
  mobileMenu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => setOpen(false))
  );
}

// Reveal on scroll
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach((el) => revealObs.observe(el));

// Smooth scroll for in-page anchors (offset for fixed nav)
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - (nav?.offsetHeight || 0) - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// Contact form: POST to /api/contact, fallback to optimistic success
const form = document.getElementById('contactForm');
const success = document.getElementById('formSuccess');
if (form && success) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalLabel = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Sending…';

    const data = Object.fromEntries(new FormData(form).entries());

    // Email the lead via FormSubmit directly from the browser (their
    // Cloudflare blocks server-to-server calls, so this must be client-side).
    try {
      await fetch('https://formsubmit.co/ajax/67925153a16662adff841be3175bb7ce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `New Landmark lead: ${data.firstName || ''} ${data.lastName || ''} — ${data.need || 'inquiry'}`,
          _template: 'table',
          Name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          Email: data.email || '',
          Business: data.business || '',
          Website: data.website || '',
          'Looking for': data.need || '',
          Budget: data.budget || '',
          Message: data.message || '',
        }),
      });
    } catch (_) {
      // Fall through — the /api/contact log below still captures the lead.
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok && res.status !== 404) throw new Error('Request failed');
    } catch (_) {
      // Fall through — show success UX even if endpoint isn't wired yet.
    }

    form.style.display = 'none';
    success.removeAttribute('hidden');
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    btn.disabled = false;
    btn.innerHTML = originalLabel;
  });
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Trust strip: seamless marquee (wrap + duplicate)
const trustList = document.querySelector('.trust-strip__list');
if (trustList) {
  const viewport = document.createElement('div');
  viewport.className = 'trust-strip__viewport';
  trustList.parentNode.insertBefore(viewport, trustList);
  viewport.appendChild(trustList);
  trustList.innerHTML += trustList.innerHTML;
}

// Dashboard: count-up stats when visible
const statEls = document.querySelectorAll('.dash__stat-value');
const countUp = (el) => {
  const m = el.textContent.trim().match(/^([^\d]*)([\d.]+)(.*)$/);
  if (!m) return;
  const [, prefix, numStr, suffix] = m;
  const target = parseFloat(numStr);
  const decimals = (numStr.split('.')[1] || '').length;
  const dur = 1400;
  const t0 = performance.now();
  const tick = (t) => {
    const p = Math.min((t - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
if (statEls.length) {
  const statObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          countUp(e.target);
          statObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  statEls.forEach((el) => statObs.observe(el));
}

// Dashboard: cursor tilt
const dashWrap = document.querySelector('.dash-wrap');
const dash = document.querySelector('.dash');
if (dashWrap && dash && window.matchMedia('(pointer: fine)').matches) {
  let raf = null;
  dashWrap.addEventListener('mousemove', (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const r = dashWrap.getBoundingClientRect();
      const dx = ((e.clientX - r.left) / r.width - 0.5) * 8;
      const dy = ((e.clientY - r.top) / r.height - 0.5) * -5;
      dash.style.transform = `rotateX(${4 + dy}deg) rotateY(${dx}deg)`;
      raf = null;
    });
  });
  dashWrap.addEventListener('mouseleave', () => {
    dash.style.transform = '';
  });
}
