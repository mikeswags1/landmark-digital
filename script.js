/* ============================================
   WEBCRAFT STUDIO — JS
   ============================================ */

// ── Nav scroll ────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── Mobile menu ───────────────────────────────
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
document.querySelectorAll('.nav__mobile-link, .nav__mobile .btn').forEach(el =>
  el.addEventListener('click', () => mobileMenu.classList.remove('open'))
);

// ── Reveal on scroll ──────────────────────────
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ── Counter animation ─────────────────────────
function animateCounter(el, target, dur = 1600) {
  const start = performance.now();
  const update = now => {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = target >= 100 ? Math.floor(eased * target).toLocaleString() : Math.floor(eased * target);
    if (p < 1) requestAnimationFrame(update);
    else el.textContent = target >= 100 ? target.toLocaleString() : target;
  };
  requestAnimationFrame(update);
}
const statsObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.querySelectorAll('.stat__num[data-target]').forEach(el => {
      animateCounter(el, parseInt(el.dataset.target, 10));
      el.removeAttribute('data-target');
    });
    statsObs.unobserve(e.target);
  });
}, { threshold: 0.5 });
const heroStats = document.querySelector('.hero__stats');
if (heroStats) statsObs.observe(heroStats);

// ── Smooth scroll ─────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ── Filter tabs ───────────────────────────────
const filterBtns = document.querySelectorAll('.filter-btn');
const siteCards  = document.querySelectorAll('.site-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    siteCards.forEach(card => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('hidden', !match);
      // re-trigger reveal for newly shown cards
      if (match && !card.classList.contains('visible')) {
        setTimeout(() => card.classList.add('visible'), 50);
      }
    });
  });
});

// ── Contact form ──────────────────────────────
const form = document.getElementById('contactForm');
const success = document.getElementById('formSuccess');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Sending...';
    btn.disabled = true;
    setTimeout(() => {
      form.style.display = 'none';
      success.classList.add('visible');
    }, 900);
  });
}
