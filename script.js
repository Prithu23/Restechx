(() => {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  const darkSections = [...document.querySelectorAll('.hero, .product, .contact, .footer')];
  const stage = document.getElementById('stage');
  const productImg = document.getElementById('productImg');

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---- Nav: blur on scroll, switch to dark style over dark sections ---- */
  function updateNav() {
    nav.classList.toggle('is-scrolled', window.scrollY > 10);
    const y = nav.offsetHeight / 2;
    const overDark = darkSections.some(s => {
      const r = s.getBoundingClientRect();
      return r.top <= y && r.bottom >= y;
    });
    nav.classList.toggle('is-dark', overDark);
  }

  /* ---- Product image grows as you scroll through the stage ---- */
  function updateStage() {
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / (total * 0.6) + 0.35));
    productImg.style.setProperty('--p', p.toFixed(3));
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateNav(); updateStage(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', updateStage);
  updateNav(); updateStage();

  /* ---- Mobile menu ---- */
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', e => {
    if (e.target.closest('a')) { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', false); }
  });

  /* ---- Reveal on scroll ---- */
  const revealer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealer.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealer.observe(el));

  /* ---- How it works: highlight active step + hotspot ---- */
  const steps = [...document.querySelectorAll('.step')];
  const hotspots = [...document.querySelectorAll('.hotspot')];
  function activate(n) {
    steps.forEach(s => s.classList.toggle('is-active', s.dataset.step === n));
    hotspots.forEach(h => h.classList.toggle('is-active', h.dataset.step === n));
  }
  const stepObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) activate(e.target.dataset.step); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach(s => stepObserver.observe(s));
  activate('1');

  /* ---- FAQ: one open at a time, smooth height ---- */
  const items = [...document.querySelectorAll('.faq details')];
  items.forEach(d => {
    const summary = d.querySelector('summary');
    const body = d.querySelector('.faq__a');
    summary.addEventListener('click', e => {
      e.preventDefault();
      if (d.open) return close(d);
      items.filter(o => o !== d && o.open).forEach(close);
      d.open = true;
      const h = body.scrollHeight;
      body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.22,.61,.36,1)' });
    });
    function close(el) {
      const b = el.querySelector('.faq__a');
      const anim = b.animate([{ height: b.scrollHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 300, easing: 'ease-in', fill: 'forwards' });
      anim.onfinish = () => { el.open = false; anim.cancel(); };
    }
  });

  /* ---- Contact form: opens the visitor's mail app (no backend yet) ---- */
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form);
    const to = document.querySelector('.contact__list a[href^="mailto:"]').getAttribute('href').slice(7);
    const subject = `${f.get('topic')} — ${f.get('name')}`;
    const body = `Name: ${f.get('name')}\nEmail: ${f.get('email')}\nOrganisation: ${f.get('org') || '-'}\n\n${f.get('message') || ''}`;
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
