/* ═══════════════════════════════════════════════════════════
   FLYBY — Interactive JS
   Plane scroll, particles, counter animations, pricing toggle
═══════════════════════════════════════════════════════════ */

// ── NAV scroll effect ────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── Mobile menu ──────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

// ── Star / particle canvas ───────────────────────────────────
const canvas = document.getElementById('starCanvas');
const ctx = canvas.getContext('2d');
let stars = [];
let mouseX = 0, mouseY = 0;

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function initStars() {
  stars = [];
  const count = Math.floor((canvas.width * canvas.height) / 8000);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.6 + 0.1,
      speed: Math.random() * 0.3 + 0.05,
      drift: (Math.random() - 0.5) * 0.15,
      twinkleOffset: Math.random() * Math.PI * 2,
    });
  }
}

function drawStars(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(s => {
    const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(time * 0.001 * s.speed + s.twinkleOffset));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(168, 200, 232, ${s.alpha * twinkle})`;
    ctx.fill();
    s.y -= s.speed * 0.15;
    s.x += s.drift * 0.1;
    if (s.y < -2) { s.y = canvas.height + 2; s.x = Math.random() * canvas.width; }
    if (s.x < -2) s.x = canvas.width + 2;
    if (s.x > canvas.width + 2) s.x = -2;
  });
}

// Mouse parallax on stars
document.addEventListener('mousemove', e => {
  mouseX = e.clientX / window.innerWidth - 0.5;
  mouseY = e.clientY / window.innerHeight - 0.5;
});

let animFrame;
function animateStars(time) {
  drawStars(time);
  animFrame = requestAnimationFrame(animateStars);
}

window.addEventListener('resize', () => { resizeCanvas(); initStars(); }, { passive: true });
resizeCanvas(); initStars(); animateStars(0);

// ── Scroll-driven plane animation ───────────────────────────
const planeIcon = document.getElementById('planeIcon');
const planeTrack = document.getElementById('planeTrack');

function updatePlane() {
  if (!planeTrack || !planeIcon) return;

  const rect = planeTrack.getBoundingClientRect();
  const windowH = window.innerHeight;

  // Progress: 0 when track top hits bottom of viewport, 1 when track bottom hits top
  const progress = Math.max(0, Math.min(1,
    (windowH - rect.top) / (windowH + rect.height)
  ));

  // Bezier curve: same as the SVG path Q 300,20 600,100 Q 900,180 1300,100
  const t = progress;
  const W = planeTrack.offsetWidth;

  // Quadratic bezier control points (as fractions of W)
  // Two segments: [0→0.5] and [0.5→1]
  let x, y, angle;
  if (t < 0.5) {
    const u = t * 2;
    const p0x = 0, p0y = 100;
    const p1x = W * 0.25, p1y = 20;
    const p2x = W * 0.5, p2y = 100;
    x = (1-u)*(1-u)*p0x + 2*(1-u)*u*p1x + u*u*p2x;
    y = (1-u)*(1-u)*p0y + 2*(1-u)*u*p1y + u*u*p2y;
    const dx = 2*(1-u)*(p1x-p0x) + 2*u*(p2x-p1x);
    const dy = 2*(1-u)*(p1y-p0y) + 2*u*(p2y-p1y);
    angle = Math.atan2(dy, dx) * 180 / Math.PI;
  } else {
    const u = (t - 0.5) * 2;
    const p0x = W * 0.5, p0y = 100;
    const p1x = W * 0.75, p1y = 180;
    const p2x = W, p2y = 100;
    x = (1-u)*(1-u)*p0x + 2*(1-u)*u*p1x + u*u*p2x;
    y = (1-u)*(1-u)*p0y + 2*(1-u)*u*p1y + u*u*p2y;
    const dx = 2*(1-u)*(p1x-p0x) + 2*u*(p2x-p1x);
    const dy = 2*(1-u)*(p1y-p0y) + 2*u*(p2y-p1y);
    angle = Math.atan2(dy, dx) * 180 / Math.PI;
  }

  planeIcon.style.left = x + 'px';
  planeIcon.style.top = y + 'px';
  planeIcon.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

  // Trail opacity based on visibility
  const visible = rect.top < windowH && rect.bottom > 0;
  planeTrack.style.opacity = visible ? '1' : '0';
}

window.addEventListener('scroll', updatePlane, { passive: true });
updatePlane();

// ── Reveal on scroll (Intersection Observer) ─────────────────
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      // Trigger spend bar animations
      if (e.target.classList.contains('feature-card')) {
        e.target.querySelectorAll('.sbar-fill').forEach(bar => {
          bar.style.width = bar.style.width; // re-trigger
        });
      }
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// ── Counter animation ─────────────────────────────────────────
function animateCounter(el, target, duration = 1800) {
  let start = null;
  const isDecimal = String(target).includes('.');
  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(ease * target * 10) / 10;
    el.textContent = isDecimal ? value.toFixed(1) : Math.round(value);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const el = e.target;
      const target = parseFloat(el.dataset.target);
      animateCounter(el, target);
      statObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-big[data-target]').forEach(el => statObserver.observe(el));

// ── Pricing toggle ────────────────────────────────────────────
const billingToggle = document.getElementById('billingToggle');
const toggleThumb = document.getElementById('toggleThumb');
const monthlyLabel = document.getElementById('monthlyLabel');
const annualLabel = document.getElementById('annualLabel');
let isAnnual = false;

function updatePricing() {
  document.querySelectorAll('.price-amount[data-monthly]').forEach(el => {
    const monthly = parseInt(el.dataset.monthly);
    const annual = parseInt(el.dataset.annual);
    const target = isAnnual ? annual : monthly;
    // Animate the price change
    const current = parseInt(el.textContent.replace('$', '')) || monthly;
    let start = null;
    function animPrice(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 300, 1);
      el.textContent = '$' + Math.round(current + (target - current) * (1 - Math.pow(1-p, 3)));
      if (p < 1) requestAnimationFrame(animPrice);
    }
    requestAnimationFrame(animPrice);
  });
}

billingToggle.addEventListener('click', () => {
  isAnnual = !isAnnual;
  billingToggle.classList.toggle('on', isAnnual);
  toggleThumb.classList.toggle('right', isAnnual);
  monthlyLabel.classList.toggle('active', !isAnnual);
  annualLabel.classList.toggle('active', isAnnual);
  updatePricing();
});

// ── Hero mockup interactive hover ─────────────────────────────
document.querySelectorAll('.sidebar-item').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});

// ── Smooth tilt on feature cards ──────────────────────────────
document.querySelectorAll('.feature-card, .testimonial-card, .pricing-card').forEach(card => {
  card.addEventListener('mousemove', function(e) {
    const rect = this.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    this.style.transform = `translateY(-4px) perspective(600px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
  });
  card.addEventListener('mouseleave', function() {
    this.style.transform = '';
  });
});

// ── Typing animation for AI input ─────────────────────────────
const aiCursor = document.querySelector('.ai-cursor');
if (aiCursor) {
  const fullText = "Book a 3-day team offsite in London for 8 people, under $12k total";
  let charIdx = 0;
  let typing = true;

  function typeText() {
    if (typing) {
      if (charIdx < fullText.length) {
        aiCursor.textContent = fullText.slice(0, ++charIdx) + '_';
        setTimeout(typeText, 45 + Math.random() * 40);
      } else {
        setTimeout(() => { typing = false; eraseText(); }, 2500);
      }
    }
  }

  function eraseText() {
    if (charIdx > 0) {
      aiCursor.textContent = fullText.slice(0, --charIdx) + '_';
      setTimeout(eraseText, 18);
    } else {
      typing = true;
      setTimeout(typeText, 600);
    }
  }

  // Start typing when the card becomes visible
  const typingObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      setTimeout(typeText, 800);
      typingObserver.disconnect();
    }
  }, { threshold: 0.4 });

  if (aiCursor.closest('.feature-card')) {
    typingObserver.observe(aiCursor.closest('.feature-card'));
  }
}

// ── Subtle parallax on hero content ───────────────────────────
const heroContent = document.querySelector('.hero-content');
const heroMockup = document.querySelector('.hero-mockup');

window.addEventListener('scroll', () => {
  const sy = window.scrollY;
  if (sy < window.innerHeight && heroContent) {
    heroContent.style.transform = `translateY(${sy * 0.18}px)`;
  }
  if (sy < window.innerHeight && heroMockup) {
    heroMockup.style.transform = `translateY(${sy * 0.08}px)`;
  }
}, { passive: true });

// ── Glow trail on mouse ────────────────────────────────────────
const glowTrail = document.createElement('div');
glowTrail.style.cssText = `
  position: fixed; pointer-events: none; z-index: 9999;
  width: 300px; height: 300px; border-radius: 50%;
  background: radial-gradient(circle, rgba(79,127,191,0.06) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  transition: left .12s ease, top .12s ease;
  mix-blend-mode: screen;
`;
document.body.appendChild(glowTrail);

document.addEventListener('mousemove', e => {
  glowTrail.style.left = e.clientX + 'px';
  glowTrail.style.top = e.clientY + 'px';
});
