/**
 * nanobots.js — Pure vanilla JS, zero dependencies
 * No anime.js required. No eval(). GitHub Pages CSP safe.
 * Drop-in: add <div id="nanobot-stage"></div> and <script src="nanobots.js"></script>
 */

document.addEventListener('DOMContentLoaded', () => {

  const stage = document.getElementById('nanobot-stage');
  if (!stage) return;

  // ── CANVAS SETUP ──
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'absolute', top: '0', left: '0',
    width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '1', display: 'block',
  });
  stage.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // ── SKYDIVER SVG ──
  const skydiverWrap = document.createElement('div');
  Object.assign(skydiverWrap.style, {
    position: 'absolute', top: '0', left: '0',
    width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '2', overflow: 'hidden',
  });
  skydiverWrap.innerHTML = `
    <svg id="nb-skydiver" xmlns="http://www.w3.org/2000/svg" width="60" height="95"
      style="position:absolute;opacity:0;filter:drop-shadow(0 0 5px rgba(255,200,100,0.8))">
      <ellipse cx="30" cy="22" rx="26" ry="15" fill="none" stroke="#e9d8a6" stroke-width="1.5"/>
      <path d="M7,22 Q17,42 30,50 Q43,42 53,22" fill="rgba(148,210,189,0.3)" stroke="#94d2bd" stroke-width="1.5"/>
      <line x1="14" y1="34" x2="25" y2="54" stroke="#e9d8a6" stroke-width="1" opacity="0.6"/>
      <line x1="30" y1="38" x2="30" y2="56" stroke="#e9d8a6" stroke-width="1" opacity="0.6"/>
      <line x1="46" y1="34" x2="35" y2="54" stroke="#e9d8a6" stroke-width="1" opacity="0.6"/>
      <circle cx="30" cy="60" r="5" fill="#e9d8a6" stroke="#94d2bd" stroke-width="1"/>
      <line x1="30" y1="65" x2="30" y2="80" stroke="#e9d8a6" stroke-width="2"/>
      <line x1="30" y1="69" x2="17" y2="76" stroke="#e9d8a6" stroke-width="1.5"/>
      <line x1="30" y1="69" x2="43" y2="76" stroke="#e9d8a6" stroke-width="1.5"/>
      <line x1="30" y1="80" x2="22" y2="92" stroke="#e9d8a6" stroke-width="1.5"/>
      <line x1="30" y1="80" x2="38" y2="92" stroke="#e9d8a6" stroke-width="1.5"/>
    </svg>`;
  stage.appendChild(skydiverWrap);
  const skydiverEl = document.getElementById('nb-skydiver');

  // ── RESIZE ──
  function resize() {
    canvas.width  = stage.offsetWidth;
    canvas.height = stage.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const W  = () => canvas.width;
  const H  = () => canvas.height;
  const cx = () => W() / 2;
  const cy = () => H() / 2;

  // ── EASING FUNCTIONS ──
  function easeOutExpo(t)    { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function easeInOutQuart(t) { return t < 0.5 ? 8*t*t*t*t : 1-Math.pow(-2*t+2,4)/2; }
  function easeOutElastic(t) {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10*t) * Math.sin((t*10 - 0.75) * (2*Math.PI/3)) + 1;
  }
  function easeInOutSine(t)  { return -(Math.cos(Math.PI * t) - 1) / 2; }
  function easeOutQuad(t)    { return 1 - (1-t)*(1-t); }
  function easeInQuad(t)     { return t * t; }

  // ── TWEEN ENGINE ──
  // Returns a promise that resolves when done
  // props: { targets: [...], duration, delay(i), easing, props: { key: [from, to] or fn(i) } }
  function tween({ targets, duration, delay = 0, easing = easeOutQuad, props, onUpdate, onComplete }) {
    return new Promise(resolve => {
      const start = performance.now();
      const items = Array.isArray(targets) ? targets : [targets];

      // pre-compute delays and from/to for each item
      const configs = items.map((item, i) => {
        const d = typeof delay === 'function' ? delay(i) : delay;
        const p = {};
        for (const key in props) {
          const val = props[key];
          if (Array.isArray(val)) {
            p[key] = { from: val[0], to: val[1] };
          } else if (typeof val === 'function') {
            const v = val(item, i);
            p[key] = Array.isArray(v) ? { from: v[0], to: v[1] } : { from: item[key], to: v };
          } else {
            p[key] = { from: item[key], to: val };
          }
        }
        return { item, delay: d, props: p };
      });

      let resolved = false;
      const maxEnd = Math.max(...configs.map(c => c.delay + duration));

      function tick(now) {
        const elapsed = now - start;
        let anyActive = false;

        configs.forEach(({ item, delay: d, props: p }) => {
          const t = Math.min(Math.max((elapsed - d) / duration, 0), 1);
          if (elapsed < d) { anyActive = true; return; }
          if (t < 1) anyActive = true;
          const e = easing(t);
          for (const key in p) {
            item[key] = p[key].from + (p[key].to - p[key].from) * e;
          }
        });

        if (onUpdate) onUpdate();

        if (elapsed < maxEnd) {
          requestAnimationFrame(tick);
        } else {
          // snap to final values
          configs.forEach(({ item, props: p }) => {
            for (const key in p) item[key] = p[key].to;
          });
          if (!resolved) {
            resolved = true;
            if (onComplete) onComplete();
            resolve();
          }
        }
      }
      requestAnimationFrame(tick);
    });
  }

  // Simple value tween (single object)
  function tweenVal(obj, key, from, to, duration, easing) {
    return new Promise(resolve => {
      const start = performance.now();
      obj[key] = from;
      function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        obj[key] = from + (to - from) * easing(t);
        if (t < 1) requestAnimationFrame(tick);
        else { obj[key] = to; resolve(); }
      }
      requestAnimationFrame(tick);
    });
  }

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ── PARTICLES ──
  const COUNT = 52;
  const SHAPES      = ['square', 'triangle', 'hexagon'];
  const COLD_COLORS = ['#94d2bd','#0a9396','#e9d8a6','#c8d8e8','#7eb8c9','#4db8c4'];
  const WARM_COLORS = ['#ee9b00','#ca6702','#bb3e03','#ae2012','#ff6b35','#ffd166'];

  const particles = Array.from({ length: COUNT }, (_, i) => ({
    x: 0, y: 0, size: 7, rotate: 0, opacity: 0,
    color: COLD_COLORS[i % COLD_COLORS.length],
    shape: SHAPES[i % SHAPES.length],
    scaleX: 1, scaleY: 1,
  }));

  // ── AURA ──
  let aura = { opacity: 0, x: 0, y: 0 };

  // ── DRAW ──
  function drawParticle(p) {
    if (p.opacity <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.opacity);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotate * Math.PI / 180);
    ctx.scale(p.scaleX, p.scaleY);
    ctx.fillStyle = p.color;
    const s = p.size / 2;
    if (p.shape === 'square') {
      ctx.fillRect(-s, -s, p.size, p.size);
    } else if (p.shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(0, -s*1.2); ctx.lineTo(s, s); ctx.lineTo(-s, s);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI/3)*i - Math.PI/6;
        i === 0 ? ctx.moveTo(s*Math.cos(a), s*Math.sin(a))
                : ctx.lineTo(s*Math.cos(a), s*Math.sin(a));
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = Math.min(1, p.opacity * 0.3);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.7; ctx.stroke();
    ctx.restore();
  }

  function drawAura() {
    if (aura.opacity <= 0.01) return;
    const g = ctx.createRadialGradient(aura.x, aura.y, 0, aura.x, aura.y, 80);
    g.addColorStop(0,   `rgba(10,147,150,${aura.opacity * 0.55})`);
    g.addColorStop(0.5, `rgba(10,147,150,${aura.opacity * 0.18})`);
    g.addColorStop(1,   'rgba(10,147,150,0)');
    ctx.save(); ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(aura.x, aura.y, 80, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // Continuous draw loop
  function drawLoop() {
    ctx.clearRect(0, 0, W(), H());
    drawAura();
    particles.forEach(drawParticle);
    requestAnimationFrame(drawLoop);
  }
  drawLoop();

  // ── POSITION GENERATORS ──
  function edgePos() {
    return particles.map((_, i) => {
      const e = i % 4;
      if (e === 0) return { x: -20,      y: Math.random()*H() };
      if (e === 1) return { x: W()+20,   y: Math.random()*H() };
      if (e === 2) return { x: Math.random()*W(), y: -20 };
                   return { x: Math.random()*W(), y: H()+20 };
    });
  }

  function robotPos() {
    const bx = cx(), by = cy();
    return particles.map((_, i) => {
      const s = i % 26;
      if (s < 4)  return { x: bx + (s%2-0.5)*18,    y: by - 90 + Math.floor(s/2)*18 };
      if (s < 12) { const t=s-4; return { x: bx+(t%2-0.5)*22, y: by-55+Math.floor(t/2)*18 }; }
      if (s < 18) { const a=s-12; return { x: bx-48+(a%2)*7,  y: by-50+Math.floor(a/2)*18 }; }
      if (s < 24) { const a=s-18; return { x: bx+42+(a%2)*7,  y: by-50+Math.floor(a/2)*18 }; }
      return { x: bx + (s===24?-1:1)*16, y: by+20 };
    });
  }

  function planePos(offsetX = 0) {
    const bx = cx()+offsetX, by = cy();
    return particles.map((_, i) => {
      const s = i % 20;
      if (s < 8)  return { x: bx-70+s*18, y: by };
      if (s < 12) { const w=s-8, side=w<2?-1:1; return { x: bx+side*(30+(w%2)*28), y: by+8 }; }
      if (s < 16) { const t=s-12; return { x: bx-55+t*8, y: by-14-t*10 }; }
      return { x: bx+32+(s-16)*8, y: by-6 };
    });
  }

  function burstPos(fx, fy) {
    return particles.map(() => {
      const a = Math.random()*Math.PI*2;
      const d = 50 + Math.random()*Math.min(W(),H())*0.42;
      return { x: Math.min(fx+Math.cos(a)*d, W()-10), y: fy+Math.sin(a)*d };
    });
  }

  // ── SKYDIVER ANIMATION (pure CSS transform) ──
  let skyAnim = null;
  function animateSkydiver(startX, startY) {
    skydiverEl.style.left    = startX + 'px';
    skydiverEl.style.top     = startY + 'px';
    skydiverEl.style.opacity = '0';
    skydiverEl.style.transform = 'translate(0px, 0px)';

    let sy = 0, sx = 0, startTime = null;
    const fallDist = H() * 0.42;
    const duration = 1800;
    const swayPoints = [[22, 600], [-18, 1200], [10, 1800]];

    // fade in
    let fadeStart = performance.now();
    function fadeIn(now) {
      const t = Math.min((now - fadeStart) / 350, 1);
      skydiverEl.style.opacity = easeOutQuad(t).toFixed(3);
      if (t < 1) requestAnimationFrame(fadeIn);
    }
    requestAnimationFrame(fadeIn);

    // fall + sway
    function fall(now) {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      sy = fallDist * easeInOutSine(t);

      // sway interpolation
      let prevX = 0, prevT = 0;
      for (const [tx, tt] of swayPoints) {
        if (elapsed <= tt) {
          const st = (elapsed - prevT) / (tt - prevT);
          sx = prevX + (tx - prevX) * easeInOutSine(Math.max(0, st));
          break;
        }
        prevX = tx; prevT = tt;
      }

      skydiverEl.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
      if (t < 1) skyAnim = requestAnimationFrame(fall);
    }
    skyAnim = requestAnimationFrame(fall);
  }

  function fadeOutSkydiver() {
    return new Promise(resolve => {
      let start = performance.now();
      function tick(now) {
        const t = Math.min((now - start) / 500, 1);
        skydiverEl.style.opacity = (1 - easeInQuad(t)).toFixed(3);
        if (t < 1) requestAnimationFrame(tick);
        else { skydiverEl.style.opacity = '0'; resolve(); }
      }
      requestAnimationFrame(tick);
    });
  }

  // ── STAGGER HELPER ──
  function stagger(base, i, spread = 12) { return base + i * spread; }

  // ── MAIN SEQUENCE ──
  async function runAnimation() {
    if (skyAnim) cancelAnimationFrame(skyAnim);
    aura.opacity = 0;
    skydiverEl.style.opacity = '0';
    skydiverEl.style.transform = 'translate(0px,0px)';

    // reset particles
    const edges = edgePos();
    particles.forEach((p, i) => {
      p.x = edges[i].x; p.y = edges[i].y;
      p.size = 5 + Math.random()*5;
      p.opacity = 0; p.rotate = Math.random()*360;
      p.color = COLD_COLORS[i % COLD_COLORS.length];
      p.scaleX = 1; p.scaleY = 1;
    });

    // ══════════════════════════
    // ACT 1 — Swarm → Robot
    // ══════════════════════════

    // Fade in from edges
    await tween({
      targets: particles, duration: 450, easing: easeOutQuad,
      delay: (i) => stagger(0, i, 10),
      props: { opacity: [0, 0.9] },
    });

    // Drift and churn
    await tween({
      targets: particles, duration: 550, easing: easeInOutQuart,
      delay: (i) => stagger(0, i % 10, 8),
      props: {
        x: (p) => cx() + (Math.random()-0.5)*W()*0.65,
        y: (p) => cy() + (Math.random()-0.5)*H()*0.55,
        rotate: () => (Math.random()-0.5)*360,
      },
    });

    // Snap to robot
    const rPos = robotPos();
    await tween({
      targets: particles, duration: 900, easing: easeOutElastic,
      delay: (i) => {
        // stagger from center out
        const dx = rPos[i].x - cx(), dy = rPos[i].y - cy();
        const dist = Math.sqrt(dx*dx+dy*dy);
        return dist * 0.3;
      },
      props: {
        x: (p, i) => rPos[i].x,
        y: (p, i) => rPos[i].y,
        rotate: [null, 0],
        size: [null, 7],
      },
    });

    // Aura pulse
    aura.x = cx(); aura.y = cy();
    await tweenVal(aura, 'opacity', 0, 0.65, 300, easeOutQuad);
    await tweenVal(aura, 'opacity', 0.65, 0.35, 200, easeInOutSine);
    await tweenVal(aura, 'opacity', 0.35, 0.65, 250, easeInOutSine);
    await tweenVal(aura, 'opacity', 0.65, 0.3,  200, easeInOutSine);
    await tweenVal(aura, 'opacity', 0.3, 0,     350, easeOutQuad);

    // ══════════════════════════
    // ACT 2 — Robot → Plane
    // ══════════════════════════

    // Brief scatter
    await tween({
      targets: particles, duration: 400, easing: easeInOutQuart,
      delay: (i) => stagger(0, i % 12, 8),
      props: {
        x: () => cx() + (Math.random()-0.5)*W()*0.5,
        y: () => cy() + (Math.random()-0.5)*H()*0.4,
        rotate: () => (Math.random()-0.5)*720,
      },
    });

    // Assemble into plane
    const p0 = planePos(-cx()*0.15);
    await tween({
      targets: particles, duration: 700, easing: easeInOutQuart,
      delay: (i) => stagger(0, i, 10),
      props: {
        x: (p, i) => p0[i].x,
        y: (p, i) => p0[i].y,
        rotate: [null, 0],
        size: [null, 6],
      },
    });

    // Plane flies right with shake
    const p1 = planePos(cx()*0.75);
    await tween({
      targets: particles, duration: 750, easing: easeInOutSine,
      delay: (i) => i * 4,
      props: {
        x: (p, i) => p1[i].x,
        y: (p, i) => p1[i].y + Math.sin(i*0.8)*4,
      },
    });

    // Trail fade
    tween({
      targets: particles.slice(40), duration: 300, easing: easeOutQuad,
      props: { opacity: [null, 0.2] },
    });

    await wait(100);

    // ══════════════════════════
    // ACT 3 — Explosion + Skydiver
    // ══════════════════════════

    // Swap to warm colors
    particles.forEach((p, i) => { p.color = WARM_COLORS[i % WARM_COLORS.length]; });

    const expX = Math.min(cx() + cx()*0.75, W()-40);
    const expY = cy();
    const burst = burstPos(expX, expY);

    // Explode
    tween({
      targets: particles, duration: 700, easing: easeOutExpo,
      delay: (i) => stagger(0, i % 20, 8),
      props: {
        x: (p, i) => burst[i].x,
        y: (p, i) => burst[i].y,
        opacity: () => [0.9, Math.random()*0.45],
        rotate: () => (Math.random()-0.5)*1440,
        scaleX: () => 0.3 + Math.random()*1.3,
        scaleY: () => 0.3 + Math.random()*1.3,
        size: () => 3 + Math.random()*9,
      },
    });

    // Skydiver drops in
    await wait(200);
    animateSkydiver(cx() - 30, cy() - H()*0.28);

    // Debris drift and fade
    await wait(400);
    tween({
      targets: particles, duration: 1400, easing: easeOutQuad,
      delay: (i) => stagger(0, i % 20, 15),
      props: {
        y: (p) => p.y + 30 + Math.random()*60,
        opacity: [null, 0],
      },
    });

    // Fade skydiver out near the end
    await wait(1100);
    await fadeOutSkydiver();

    // Reset colors and loop
    particles.forEach((p, i) => { p.color = COLD_COLORS[i % COLD_COLORS.length]; });
    await wait(400);
    runAnimation();
  }

  runAnimation();

});
