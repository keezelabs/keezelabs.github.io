/**
 * nanobots.js — KEEZELabs Globe Animation
 * Rotating wireframe globe with data nodes and connection arcs
 * Pure canvas + anime.js, zero eval(), CSP safe
 */

document.addEventListener('DOMContentLoaded', () => {
  const stage = document.getElementById('nanobot-stage');
  if (!stage) return;

   const canvas = document.createElement('canvas');
   Object.assign(canvas.style, {
     position: 'absolute', top: '0', left: '0',
     width: '100%', height: '100%',
     pointerEvents: 'none', display: 'block',
   });
   stage.appendChild(canvas);
   const ctx = canvas.getContext('2d');

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
  const R  = () => Math.min(W(), H()) * 0.48;

  // ── PALETTE ──
  const C = {
    cyan:   '#0a9396',
    aqua:   '#94d2bd',
    gold:   '#ee9b00',
    teal:   '#005f73',
    cream:  '#e9d8a6',
    rust:   '#bb3e03',
  };

  function rgba(hex, a) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  // ── ROTATION STATE ──
  let rotY = 0;   // auto-spin yaw
  let rotX = 0.3; // slight tilt

  // anime.js drives the rotation speed
  const state = { speed: 0.003 };
  anime({
    targets: state,
    speed: 0.006,
    duration: 4000,
    easing: 'easeInOutSine',
    direction: 'alternate',
    loop: true,
  });

  // ── 3D PROJECTION ──
  function project(lat, lon) {
    // spherical to cartesian
    const phi   = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x3 =  Math.sin(phi) * Math.cos(theta);
    const y3 =  Math.cos(phi);
    const z3 =  Math.sin(phi) * Math.sin(theta);

    // rotate around Y axis (spin)
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const x2   =  x3 * cosY + z3 * sinY;
    const z2   = -x3 * sinY + z3 * cosY;

    // rotate around X axis (tilt)
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const y2   =  y3 * cosX - z2 * sinX;
    const z1   =  y3 * sinX + z2 * cosX;

    const scale = R();
    return {
      x:       cx() + x2 * scale,
      y:       cy() - y2 * scale,
      z:       z1,           // depth: positive = front
      visible: z1 > -0.05,  // cull back-facing
    };
  }

  // ── GLOBE GRID LINES ──
  function drawGlobe() {
    const latLines = 12;  // horizontal rings
    const lonLines = 18;  // vertical meridians
    const steps    = 64;  // smoothness per line

    // latitude lines
    for (let i = 1; i < latLines; i++) {
      const lat = -90 + (180 / latLines) * i;
      ctx.beginPath();
      let started = false;
      for (let s = 0; s <= steps; s++) {
        const lon = -180 + (360 / steps) * s;
        const p   = project(lat, lon);
        const a   = Math.max(0, p.z) * 0.5 + 0.05;
        if (!started) {
          ctx.beginPath();
          started = true;
        }
        if (s === 0) ctx.moveTo(p.x, p.y);
        else         ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = rgba(C.teal, 0.35);
      ctx.lineWidth   = 0.6;
      ctx.stroke();
    }

    // longitude lines (meridians)
    for (let i = 0; i < lonLines; i++) {
      const lon = -180 + (360 / lonLines) * i;
      ctx.beginPath();
      let first = true;
      for (let s = 0; s <= steps; s++) {
        const lat = -90 + (180 / steps) * s;
        const p   = project(lat, lon);
        if (first) { ctx.moveTo(p.x, p.y); first = false; }
        else        ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = rgba(C.teal, 0.3);
      ctx.lineWidth   = 0.6;
      ctx.stroke();
    }

    // equator highlight
    ctx.beginPath();
    let first = true;
    for (let s = 0; s <= steps; s++) {
      const lon = -180 + (360 / steps) * s;
      const p   = project(0, lon);
      if (first) { ctx.moveTo(p.x, p.y); first = false; }
      else        ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = rgba(C.cyan, 0.45);
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  // ── GLOBE GLOW ──
  function drawGlowAndAtmo() {
    // atmosphere halo
    const atmo = ctx.createRadialGradient(cx(), cy(), R() * 0.85, cx(), cy(), R() * 1.22);
    atmo.addColorStop(0,   rgba(C.cyan, 0.08));
    atmo.addColorStop(0.5, rgba(C.teal, 0.04));
    atmo.addColorStop(1,   rgba(C.cyan, 0));
    ctx.beginPath();
    ctx.arc(cx(), cy(), R() * 1.22, 0, Math.PI * 2);
    ctx.fillStyle = atmo;
    ctx.fill();

    // inner dim fill (dark side of globe)
    const inner = ctx.createRadialGradient(cx() - R()*0.2, cy() - R()*0.2, 0, cx(), cy(), R());
    inner.addColorStop(0,   rgba(C.teal, 0.12));
    inner.addColorStop(0.6, rgba('#001219', 0.4));
    inner.addColorStop(1,   rgba('#001219', 0.7));
    ctx.beginPath();
    ctx.arc(cx(), cy(), R(), 0, Math.PI * 2);
    ctx.fillStyle = inner;
    ctx.fill();
  }

  // ── DATA NODES (cities/points on globe) ──
  const NODE_COORDS = [
    { lat:  40.7, lon: -74.0, label: 'NYC',    color: C.gold  },
    { lat:  51.5, lon:  -0.1, label: 'LON',    color: C.aqua  },
    { lat:  35.7, lon: 139.7, label: 'TYO',    color: C.cyan  },
    { lat: -23.5, lon: -46.6, label: 'SAO',    color: C.cream },
    { lat:  55.8, lon:  37.6, label: 'MOW',    color: C.rust  },
    { lat:  1.35, lon: 103.8, label: 'SIN',    color: C.gold  },
    { lat: -33.9, lon:  18.4, label: 'CPT',    color: C.aqua  },
    { lat:  19.4, lon: -99.1, label: 'MEX',    color: C.cyan  },
    { lat:  25.2, lon:  55.3, label: 'DXB',    color: C.cream },
    { lat:  48.9, lon:   2.3, label: 'PAR',    color: C.gold  },
    { lat: -37.8, lon: 144.9, label: 'MEL',    color: C.rust  },
    { lat:  28.6, lon:  77.2, label: 'DEL',    color: C.aqua  },
  ];

  // active connection arcs between node pairs
  const ARC_PAIRS = [
    [0, 1], [1, 2], [0, 4], [2, 5],
    [3, 6], [0, 9], [5, 8], [7, 0],
    [6, 1], [2, 11],[8, 9], [4, 10],
  ];

  // animated arc progress driven by anime.js
  const arcStates = ARC_PAIRS.map((_, i) => ({ progress: 0, opacity: 0 }));

  function launchArc(i) {
    arcStates[i].progress = 0;
    arcStates[i].opacity  = 0;
    anime({
      targets: arcStates[i],
      progress: 1,
      opacity: [0, 0.9, 0.9, 0],
      duration: 2200 + Math.random() * 1000,
      easing: 'easeInOutSine',
      complete: () => {
        setTimeout(() => { launchArc(i); }, 600 + Math.random() * 2000);
      },
    });
  }
  // stagger arc launches
  ARC_PAIRS.forEach((_, i) => {
    setTimeout(() => { launchArc(i); }, i * 300 + Math.random() * 500);
  });

  function drawArc(pairIdx) {
    const [ai, bi] = ARC_PAIRS[pairIdx];
    const A   = NODE_COORDS[ai];
    const B   = NODE_COORDS[bi];
    const st  = arcStates[pairIdx];
    if (st.opacity < 0.01) return;

    const steps = 48;
    const end   = Math.floor(st.progress * steps);

    ctx.beginPath();
    let started = false;
    for (let s = 0; s <= end; s++) {
      const t     = s / steps;
      // interpolate lat/lon along great circle (simplified slerp)
      const lat   = A.lat + (B.lat - A.lat) * t;
      const lon   = A.lon + (B.lon - A.lon) * t;
      // arc: lift midpoint off the surface
      const lift  = Math.sin(t * Math.PI) * 0.25;
      const scale = R() * (1 + lift);
      // project with custom scale
      const phi   = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x3    =  Math.sin(phi) * Math.cos(theta);
      const y3    =  Math.cos(phi);
      const z3    =  Math.sin(phi) * Math.sin(theta);
      const cosY  = Math.cos(rotY), sinY = Math.sin(rotY);
      const x2    =  x3 * cosY + z3 * sinY;
      const z2    = -x3 * sinY + z3 * cosY;
      const cosX  = Math.cos(rotX), sinX = Math.sin(rotX);
      const y2    =  y3 * cosX - z2 * sinX;
      const z1    =  y3 * sinX + z2 * cosX;
      const px    = cx() + x2 * scale;
      const py    = cy() - y2 * scale;
      if (z1 < -0.2) { started = false; ctx.beginPath(); continue; }
      if (!started)  { ctx.moveTo(px, py); started = true; }
      else             ctx.lineTo(px, py);
    }

    const col = NODE_COORDS[ai].color;
    ctx.strokeStyle = rgba(col, st.opacity * 0.8);
    ctx.lineWidth   = 1.4;
    ctx.stroke();

    // packet head at tip
    if (end > 0 && end < steps) {
      const t   = end / steps;
      const lat = A.lat + (B.lat - A.lat) * t;
      const lon = A.lon + (B.lon - A.lon) * t;
      const p   = project(lat, lon);
      if (p.visible) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10);
        g.addColorStop(0,   rgba(col, 0.6));
        g.addColorStop(1,   rgba(col, 0));
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
    }
  }

  function drawNodes() {
    NODE_COORDS.forEach(node => {
      const p = project(node.lat, node.lon);
      if (!p.visible) return;

      const depth = (p.z + 1) / 2;
      const size  = 3 + depth * 3;

      // pulse ring — animated via simple sin on time
      const pulse = (Math.sin(Date.now() * 0.002 + node.lon * 0.05) + 1) / 2;
      const ring  = size + pulse * 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ring, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(node.color, pulse * 0.4 * depth);
      ctx.lineWidth   = 1;
      ctx.stroke();

      // node dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fillStyle = rgba(node.color, 0.3 + depth * 0.5);
      ctx.fill();
      ctx.strokeStyle = rgba(node.color, 0.8 * depth);
      ctx.lineWidth   = 1.2;
      ctx.stroke();

      // label
      if (depth > 0.5) {
        ctx.font      = `bold 8px 'JetBrains Mono', monospace`;
        ctx.fillStyle = rgba(node.color, depth * 0.9);
        ctx.fillText(node.label, p.x + size + 3, p.y + 3);
      }
    });
  }

  // ── PING RIPPLES (random surface pings) ──
  const pings = [];
  function addPing() {
    const node = NODE_COORDS[Math.floor(Math.random() * NODE_COORDS.length)];
    pings.push({ lat: node.lat, lon: node.lon, color: node.color, r: 0, maxR: 20, alpha: 0.8 });
  }
  setInterval(addPing, 1400);

  function drawPings() {
    for (let i = pings.length - 1; i >= 0; i--) {
      const ping = pings[i];
      const p    = project(ping.lat, ping.lon);
      if (!p.visible) { pings.splice(i, 1); continue; }
      ping.r     += 0.5;
      ping.alpha -= 0.012;
      if (ping.alpha <= 0) { pings.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, ping.r, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(ping.color, ping.alpha * Math.max(0, p.z));
      ctx.lineWidth   = 1.2;
      ctx.stroke();
    }
  }

  // ── MAIN LOOP ──
  function loop() {
    ctx.clearRect(0, 0, W(), H());

    rotY += state.speed;

    drawGlowAndAtmo();
    drawGlobe();
    ARC_PAIRS.forEach((_, i) => drawArc(i));
    drawNodes();
    drawPings();

    // outer ring
    ctx.beginPath();
    ctx.arc(cx(), cy(), R() * 1.01, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(C.cyan, 0.2);
    ctx.lineWidth   = 1;
    ctx.stroke();

    requestAnimationFrame(loop);
  }
  loop();

});
