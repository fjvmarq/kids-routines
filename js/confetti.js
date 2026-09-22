/* Kids Routines — confeti de la celebración. Un canvas y nada más.
   Se dibuja en píxeles CSS (no en los del panel), si no en una pantalla de
   móvil el confeti sale diminuto y cayendo a cámara lenta. */

const Confetti = (function () {
  const COLORS = ['#ff5fb0', '#9b5cff', '#3fe0ff', '#7dff9b', '#ffd447', '#ffffff'];
  let canvas = null, ctx = null, parts = [], raf = 0, until = 0;
  let W = 0, H = 0;

  function size() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(n) {
    for (let i = 0; i < n; i++) {
      parts.push({
        x: Math.random() * W,
        y: -20 - Math.random() * H * 0.5,
        vx: (Math.random() - 0.5) * 2.2,
        vy: 3 + Math.random() * 3,
        s: 7 + Math.random() * 9,
        a: Math.random() * Math.PI,
        va: (Math.random() - 0.5) * 0.3,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        star: Math.random() < 0.3
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    parts = parts.filter(p => p.y < H + 40);
    parts.forEach(p => {
      p.vy += 0.09;                     // gravedad
      p.x += p.vx; p.y += p.vy; p.a += p.va;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.fillStyle = p.c;
      if (p.star) {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? p.s * 0.45 : p.s;
          const ang = (Math.PI / 5) * i - Math.PI / 2;
          ctx.lineTo(r * Math.cos(ang), r * Math.sin(ang));
        }
        ctx.closePath(); ctx.fill();
      } else {
        ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
      }
      ctx.restore();
    });

    if (Date.now() < until && parts.length < 220) spawn(4);
    if (parts.length) raf = requestAnimationFrame(draw);
    else raf = 0;
  }

  function start(ms) {
    canvas = canvas || document.getElementById('confetti');
    if (!canvas) return;
    size();
    if (!W || !H) return;             // la pantalla todavía no está visible
    until = Date.now() + (ms || 2200);
    spawn(70);
    if (!raf) raf = requestAnimationFrame(draw);
  }

  function stop() {
    until = 0; parts = [];
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (ctx) ctx.clearRect(0, 0, W, H);
  }

  window.addEventListener('resize', () => { if (canvas && canvas.clientWidth) size(); });

  return { start, stop };
})();
