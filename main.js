// main.js — KEEZELabs site animations and interactions
// Requires anime.js loaded before this file

// ── PARTICLE CANVAS (hero background) ──
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function getAccentColor() {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--dark-cyan').trim() || '#0a9396';
}

function initParticles() {
  particles = [];
  const count = Math.floor((canvas.width * canvas.height) / 14000);
  for (let i = 0; i < count; i++) {
    particles.push({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 1.5 + 0.3,
      vx:    (Math.random() - 0.5) * 0.3,
      vy:    (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.6 + 0.2,
    });
  }
}
initParticles();

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const color = getAccentColor();
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width)  p.x = 0;
    if (p.y < 0) p.y = canvas.height;
    if (p.y > canvas.height) p.y = 0;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle   = color;
    ctx.globalAlpha = p.alpha;
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 100) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle  = color;
        ctx.globalAlpha  = (1 - dist / 100) * 0.15;
        ctx.lineWidth    = 0.5;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(drawParticles);
}
drawParticles();

// ── HERO ENTRANCE SEQUENCE ──
const tl = anime.timeline({ easing: 'easeOutExpo' });

tl
  .add({ targets: 'nav',                opacity: [0,1], translateY: [-20,0], duration: 700 })
  .add({ targets: '.hero-eyebrow',      opacity: [0,1], translateX: [-16,0], duration: 600 }, '-=300')
  .add({ targets: '.hero-headline',     opacity: [0,1], duration: 1 },                        '-=200')
  .add({ targets: '.hero-headline .line', translateY: ['110%','0%'], opacity: [0,1],
         duration: 700, delay: anime.stagger(120), easing: 'easeOutQuart' },                  '-=100')
  .add({ targets: '.hero-sub',          opacity: [0,1], translateY: [12,0], duration: 600 }, '-=300')
  .add({ targets: '.hero-cta',          opacity: [0,1], translateY: [12,0], duration: 600 }, '-=400')
  .add({ targets: '.hero-stats',        opacity: [0,1], duration: 300 },                     '-=300')
  .add({ targets: '.stat-item',         opacity: [0,1], translateY: [10,0],
         duration: 500, delay: anime.stagger(100) },                                          '-=200')
  .add({ targets: '.terminal',          opacity: [0,1], translateX: [24,0],
         duration: 700, easing: 'easeOutBack' },                                              '-=600');

// ── TERMINAL TYPEWRITER ──
function typewriterLine(el, text, delay, speed = 55) {
  setTimeout(() => {
    el.textContent = '';
    let i = 0;
    const interval = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) clearInterval(interval);
    }, speed);
  }, delay);
}
setTimeout(() => {
  document.querySelectorAll('.terminal-body .t-cmd').forEach((el, i) => {
    typewriterLine(el, el.textContent, i * 900);
  });
}, 1400);

// ── SCROLL REVEAL — PROJECT CARDS ──
const cardObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter(e => e.isIntersecting).map(e => e.target);
  if (!visible.length) return;
  anime({ targets: visible, opacity: [0,1], translateY: [20,0],
          duration: 550, delay: anime.stagger(80), easing: 'easeOutQuart' });
  visible.forEach(el => cardObserver.unobserve(el));
}, { threshold: 0.1 });

document.querySelectorAll('.project-card').forEach(card => {
  card.style.opacity   = '0';
  card.style.transform = 'translateY(20px)';
  cardObserver.observe(card);
});

// ── SCROLL REVEAL — PHILOSOPHY ITEMS ──
const philObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter(e => e.isIntersecting).map(e => e.target);
  if (!visible.length) return;
  anime({ targets: visible, opacity: [0,1], translateX: [-20,0],
          duration: 500, delay: anime.stagger(100), easing: 'easeOutQuart' });
  visible.forEach(el => philObserver.unobserve(el));
}, { threshold: 0.15 });

document.querySelectorAll('.phil-item').forEach(item => {
  item.style.opacity   = '0';
  item.style.transform = 'translateX(-20px)';
  philObserver.observe(item);
});

// ── SCROLL REVEAL — SECTION TITLES ──
const titleObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    anime({ targets: e.target, opacity: [0,1], translateY: [16,0],
            duration: 600, easing: 'easeOutQuart' });
    titleObserver.unobserve(e.target);
  });
}, { threshold: 0.2 });

document.querySelectorAll('.section-title, .section-eyebrow, .section-desc').forEach(el => {
  el.style.opacity = '0';
  titleObserver.observe(el);
});

// ── STAT COUNTER ANIMATION ──
function animateCounter(el, target, suffix = '') {
  anime({
    targets: { val: 0 }, val: target, duration: 1200, easing: 'easeOutExpo',
    update(anim) {
      el.textContent = Math.round(anim.animations[0].currentValue) + suffix;
    },
  });
}
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const data = [{ val: 5, suffix: '+' }, { val: 100, suffix: '%' }, { val: 0, suffix: '$' }];
    e.target.querySelectorAll('.stat-value').forEach((el, i) =>
      animateCounter(el, data[i].val, data[i].suffix));
    statsObserver.unobserve(e.target);
  });
}, { threshold: 0.5 });
const statsEl = document.querySelector('.hero-stats');
if (statsEl) statsObserver.observe(statsEl);

// ── NAV LINK HOVER ──
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('mouseenter', () =>
    anime({ targets: link, translateY: -2, duration: 200, easing: 'easeOutQuad' }));
  link.addEventListener('mouseleave', () =>
    anime({ targets: link, translateY: 0,  duration: 200, easing: 'easeOutQuad' }));
});

// ── THEME TOGGLE ──
function toggleTheme() {
  const html = document.documentElement;
  const btn  = document.getElementById('themeBtn');
  anime({
    targets: 'body', opacity: [1, 0.85, 1], duration: 300, easing: 'easeInOutQuad',
    complete() {
      if (html.getAttribute('data-theme') === 'dark') {
        html.setAttribute('data-theme', 'light');
        btn.textContent = '☾ Dark';
      } else {
        html.setAttribute('data-theme', 'dark');
        btn.textContent = '☀ Light';
      }
    },
  });
}

// ── PROJECT FILTER ──
function filterCards(tag, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.project-card').forEach(card => {
    const tags = card.getAttribute('data-tags') || '';
    const show = tag === 'all' || tags.includes(tag);
    if (show) {
      card.style.display = '';
      anime({ targets: card, opacity: [0,1], translateY: [12,0],
              duration: 400, easing: 'easeOutQuart' });
    } else {
      anime({ targets: card, opacity: [1,0], translateY: [0,8],
              duration: 250, easing: 'easeInQuart',
              complete() { card.style.display = 'none'; } });
    }
  });
}
