/**
 * nanobots.js
 * Drop-in canvas animation scoped to #nanobot-stage
 * Requires: anime.js (v3.x)
 * Usage: add anime.js CDN + <script src="nanobots.js"></script> before </body>
 * Add <div id="nanobot-stage"></div> where you want the animation
 */

document.addEventListener('DOMContentLoaded', () => {

  const stage = document.getElementById('nanobot-stage');
  if (!stage) return; // bail if no stage element

  // ─────────────────────────────────────────
  // SETUP — Canvas scoped to #nanobot-stage
  // ─────────────────────────────────────────

  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position:      'absolute',
    top:           '0',
    left:          '0',
    width:         '100%',
    height:        '100%',
    pointerEvents: 'none',
    zIndex:        '1',
    display:       'block',
  });
  stage.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // SVG skydiver — injected into stage, not body
  const skydiverWrap = document.createElement('div');
  Object.assign(skydiverWrap.style, {
    position:      'absolute',
    top:           '0',
    left:          '0',
    width:         '100%',
    height:        '100%',
    pointerEvents: 'none',
    zIndex:        '2',
    overflow:      'hidden',
  });
  skydiverWrap.innerHTML = `
    <svg id="nb-skydiver" xmlns="http://www.w3.org/2000/svg"
      width="60" height="95"
      style="position:absolute;opacity:0;filter:drop-shadow(0 0 5px rgba(255,200,100,0.8))"
    >
      <!-- Parachute canopy -->
      <ellipse cx="30" cy="22" rx="26" ry="15" fill="none" stroke="#e9d8a6" stroke-width="1.5"/>
      <path d="M7,22 Q17,42 30,50 Q43,42 53,22" fill="rgba(148,210,189,0.3)" stroke="#94d2bd" stroke-width="1.5"/>
      <!-- Lines -->
      <line x1="14" y1="34" x2="25" y2="54" stroke="#e9d8a6" stroke-width="1" opacity="0.6"/>
      <line x1="30" y1="38" x2="30" y2="56" stroke="#e9d8a6" stroke-width="1" opacity="0.6"/>
      <line x1="46" y1="34" x2="35" y2="54" stroke="#e9d8a6" stroke-width="1" opacity="0.6"/>
      <!-- Head -->
      <circle cx="30" cy="60" r="5" fill="#e9d8a6" stroke="#94d2bd" stroke-width="1"/>
      <!-- Body -->
      <line x1="30" y1="65" x2="30" y2="80" stroke="#e9d8a6" stroke-width="2"/>
      <!-- Arms -->
      <line x1="30" y1="69" x2="17" y2="76" stroke="#e9d8a6" stroke-width="1.5"/>
      <line x1="30" y1="69" x2="43" y2="76" stroke="#e9d8a6" stroke-width="1.5"/>
      <!-- Legs -->
      <line x1="30" y1="80" x2="22" y2="92" stroke="#e9d8a6" stroke-width="1.5"/>
      <line x1="30" y1="80" x2="38" y2="92" stroke="#e9d8a6" stroke-width="1.5"/>
    </svg>
  `;
  stage.appendChild(skydiverWrap);
  const skydiverEl = document.getElementById('nb-skydiver');

  // ─────────────────────────────────────────
  // RESIZE — match canvas to stage size
  // ─────────────────────────────────────────

  function resizeCanvas() {
    canvas.width  = stage.offsetWidth;
    canvas.height = stage.offsetHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ─────────────────────────────────────────
  // PARTICLE SYSTEM
  // ─────────────────────────────────────────

  const PARTICLE_COUNT = 52;
  const SHAPES      = ['square', 'triangle', 'hexagon'];
  const COLD_COLORS = ['#94d2bd','#0a9396','#e9d8a6','#c8d8e8','#7eb8c9','#4db8c4'];
  const WARM_COLORS = ['#ee9b00','#ca6702','#bb3e03','#ae2012','#ff6b35','#ffd166'];

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id:     i,
    x:      0, y: 0,
    size:   8,
    rotate: 0,
    opacity:0,
    color:  COLD_COLORS[i % COLD_COLORS.length],
    shape:  SHAPES[i % SHAPES.length],
    scaleX: 1, scaleY: 1,
  }));

  // ─────────────────────────────────────────
  // DRAW LOOP
  // ─────────────────────────────────────────

  let auraOpacity = 0, auraX = 0, auraY = 0;

  function drawParticle(p) {
    if (p.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotate * Math.PI) / 180);
    ctx.scale(p.scaleX, p.scaleY);
    ctx.fillStyle = p.color;
    const s = p.size / 2;

    if (p.shape === 'square') {
      ctx.fillRect(-s, -s, p.size, p.size);
    } else if (p.shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.2);
      ctx.lineTo(s, s); ctx.lineTo(-s, s);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        i === 0 ? ctx.moveTo(s*Math.cos(a), s*Math.sin(a))
                : ctx.lineTo(s*Math.cos(a), s*Math.sin(a));
      }
      ctx.closePath(); ctx.fill();
    }

    // glow edge
    ctx.globalAlpha = p.opacity * 0.35;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 0.7;
    ctx.stroke();
    ctx.restore();
  }

  function drawAura() {
    if (auraOpacity <= 0) return;
    const grad = ctx.createRadialGradient(auraX, auraY, 0, auraX, auraY, 75);
    grad.addColorStop(0,   `rgba(10,147,150,${auraOpacity * 0.55})`);
    grad.addColorStop(0.5, `rgba(10,147,150,${auraOpacity * 0.18})`);
    grad.addColorStop(1,   'rgba(10,147,150,0)');
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle   = grad;
    ctx.beginPath();
    ctx.arc(auraX, auraY, 75, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAura();
    particles.forEach(drawParticle);
    requestAnimationFrame(drawFrame);
  }
  drawFrame();

  // ─────────────────────────────────────────
  // HELPERS — all relative to stage size
  // ─────────────────────────────────────────

  const W  = () => stage.offsetWidth;
  const H  = () => stage.offsetHeight;
  const cx = () => W() / 2;
  const cy = () => H() / 2;

  function edgePositions() {
    return particles.map((_, i) => {
      const edge = i % 4;
      if (edge === 0) return { x: -20,       y: Math.random() * H() };
      if (edge === 1) return { x: W() + 20,  y: Math.random() * H() };
      if (edge === 2) return { x: Math.random() * W(), y: -20 };
                      return { x: Math.random() * W(), y: H() + 20 };
    });
  }

  // ── ROBOT positions (scaled to stage) ──
  function robotPositions() {
    const bx = cx(), by = cy();
    return particles.map((_, i) => {
      const slot = i % 26;
      let x, y;
      if (slot < 4) {
        // Head
        x = bx + (slot % 2 - 0.5) * 18;
        y = by - 90 + Math.floor(slot / 2) * 18;
      } else if (slot < 12) {
        // Torso
        const ti = slot - 4;
        x = bx + (ti % 2 - 0.5) * 22;
        y = by - 55 + Math.floor(ti / 2) * 18;
      } else if (slot < 18) {
        // Left arm
        const ai = slot - 12;
        x = bx - 48 + (ai % 2) * 7;
        y = by - 50 + Math.floor(ai / 2) * 18;
      } else if (slot < 24) {
        // Right arm
        const ai = slot - 18;
        x = bx + 42 + (ai % 2) * 7;
        y = by - 50 + Math.floor(ai / 2) * 18;
      } else {
        // Legs
        const side = slot === 24 ? -1 : 1;
        x = bx + side * 16;
        y = by + 20;
      }
      return { x, y };
    });
  }

  // ── PLANE positions ──
  function planePositions(offsetX = 0) {
    const bx = cx() + offsetX, by = cy();
    return particles.map((_, i) => {
      const slot = i % 20;
      if (slot < 8)       return { x: bx - 70 + slot * 18,          y: by };
      if (slot < 12) {
        const wi = slot - 8, side = wi < 2 ? -1 : 1;
        return { x: bx + side * (30 + (wi % 2) * 28), y: by + 8 };
      }
      if (slot < 16) {
        const ti = slot - 12;
        return { x: bx - 55 + ti * 8, y: by - 14 - ti * 10 };
      }
      return { x: bx + 32 + (slot - 16) * 8, y: by - 6 };
    });
  }

  function explosionPositions(fromX, fromY) {
    return particles.map(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 50 + Math.random() * Math.min(W(), H()) * 0.45;
      return { x: fromX + Math.cos(angle) * dist, y: fromY + Math.sin(angle) * dist };
    });
  }

  // ─────────────────────────────────────────
  // MAIN ANIMATION LOOP
  // ─────────────────────────────────────────

  let masterTL = null;

  function runAnimation() {
    if (masterTL) masterTL.pause();
    auraOpacity = 0;

    Object.assign(skydiverEl.style, { opacity: '0', transform: 'translate(0px,0px)' });

    const edges     = edgePositions();
    particles.forEach((p, i) => {
      p.x = edges[i].x; p.y = edges[i].y;
      p.size = 5 + Math.random() * 5;
      p.opacity = 0; p.rotate = Math.random() * 360;
      p.color = COLD_COLORS[i % COLD_COLORS.length];
      p.scaleX = 1; p.scaleY = 1;
    });

    const robotPos   = robotPositions();
    const planePos0  = planePositions(-cx() * 0.15);
    const planePos1  = planePositions(cx() * 0.75);
    const explodeFrom = { x: cx() + cx() * 0.75, y: cy() };
    const burstPos   = explosionPositions(Math.min(explodeFrom.x, W() - 30), cy());

    masterTL = anime.timeline({
      complete: () => setTimeout(runAnimation, 500),
    });

    // ══════════════════════════
    // ACT 1 — Swarm → Robot
    // ══════════════════════════

    masterTL.add({
      targets:  particles,
      opacity:  [0, 0.9],
      duration: 500,
      delay:    anime.stagger(14, { from: 'random' }),
      easing:   'easeOutQuad',
    });

    masterTL.add({
      targets:  particles,
      x: () => cx() + (Math.random() - 0.5) * W() * 0.7,
      y: () => cy() + (Math.random() - 0.5) * H() * 0.6,
      rotate: () => anime.random(-180, 180),
      duration: 600,
      delay:    anime.stagger(8, { from: 'random' }),
      easing:   'easeInOutQuad',
    }, '-=150');

    masterTL.add({
      targets:  particles,
      x: (el, i) => robotPos[i % robotPos.length].x,
      y: (el, i) => robotPos[i % robotPos.length].y,
      rotate:   0,
      size:     7,
      duration: 850,
      delay:    anime.stagger(18, { from: 'center' }),
      easing:   'easeOutElastic(1, 0.65)',
    }, '+=80');

    masterTL.add({
      targets:  [{ val: 0 }],
      val:      [0, 0.65, 0.35, 0.65, 0.25],
      duration: 800,
      easing:   'easeInOutSine',
      update(anim) {
        auraOpacity = anim.animations[0].currentValue;
        auraX = cx(); auraY = cy();
      },
    }, '-=200');

    // ══════════════════════════
    // ACT 2 — Robot → Plane
    // ══════════════════════════

    masterTL.add({
      targets:  [{ val: 0.25 }],
      val:      0,
      duration: 350,
      easing:   'easeOutQuad',
      update(anim) { auraOpacity = anim.animations[0].currentValue; },
    });

    masterTL.add({
      targets:  particles,
      x: () => cx() + (Math.random() - 0.5) * W() * 0.5,
      y: () => cy() + (Math.random() - 0.5) * H() * 0.4,
      rotate: () => anime.random(-360, 360),
      duration: 420,
      delay:    anime.stagger(10, { from: 'random' }),
      easing:   'easeInOutQuart',
    }, '-=100');

    masterTL.add({
      targets:  particles,
      x: (el, i) => planePos0[i].x,
      y: (el, i) => planePos0[i].y,
      rotate:   0,
      size:     6,
      duration: 700,
      delay:    anime.stagger(12, { from: 'first' }),
      easing:   'easeInOutQuart',
    }, '+=60');

    // Plane flies right with engine shake
    masterTL.add({
      targets:  particles,
      x: (el, i) => planePos1[i].x,
      y: (el, i) => planePos1[i].y + Math.sin(i * 0.8) * 4,
      duration: 750,
      delay:    anime.stagger(4, { from: 'first' }),
      easing:   'easeInOutSine',
    }, '+=80');

    // Trail fade on last particles
    masterTL.add({
      targets:  particles.slice(40),
      opacity:  [0.85, 0.2],
      x: (el, i) => planePos1[40 + i].x - 30 - i * 10,
      duration: 350,
      delay:    anime.stagger(25),
      easing:   'easeOutQuad',
    }, '-=500');

    // ══════════════════════════
    // ACT 3 — Explosion + Skydiver
    // ══════════════════════════

    masterTL.add({
      targets:  particles,
      x: (el, i) => burstPos[i].x,
      y: (el, i) => burstPos[i].y,
      opacity:  () => [0.9, Math.random() * 0.5],
      rotate:   () => anime.random(-720, 720),
      scaleX:   () => 0.3 + Math.random() * 1.3,
      scaleY:   () => 0.3 + Math.random() * 1.3,
      size:     () => 3 + Math.random() * 9,
      duration: 700,
      delay:    anime.stagger(8, { from: 'random' }),
      easing:   'easeOutExpo',
      begin() {
        particles.forEach((p, i) => { p.color = WARM_COLORS[i % WARM_COLORS.length]; });
      },
    });

    // Skydiver drops in
    masterTL.add({
      targets:  skydiverEl,
      opacity:  [0, 1],
      duration: 350,
      easing:   'easeOutQuad',
      begin() {
        skydiverEl.style.left = `${cx() - 30}px`;
        skydiverEl.style.top  = `${cy() - H() * 0.28}px`;
      },
    }, '-=450');

    masterTL.add({
      targets:    skydiverEl,
      translateY: H() * 0.42,
      translateX: [
        { value:  22, duration: 600, easing: 'easeInOutSine' },
        { value: -18, duration: 600, easing: 'easeInOutSine' },
        { value:  10, duration: 500, easing: 'easeInOutSine' },
      ],
      duration: 1700,
      easing:   'easeInOutQuad',
    }, '-=150');

    // Debris drift + fade
    masterTL.add({
      targets:  particles,
      y: (el, i) => particles[i].y + 30 + Math.random() * 60,
      opacity:  0,
      duration: 1500,
      delay:    anime.stagger(16, { from: 'random' }),
      easing:   'easeOutQuad',
    }, '-=1400');

    masterTL.add({
      targets:  skydiverEl,
      opacity:  0,
      duration: 500,
      easing:   'easeInQuad',
    }, '-=600');

    masterTL.add({
      targets:  particles,
      opacity:  0,
      duration: 150,
      complete() {
        particles.forEach((p, i) => { p.color = COLD_COLORS[i % COLD_COLORS.length]; });
      },
    });
  }

  runAnimation();

}); // end DOMContentLoaded
