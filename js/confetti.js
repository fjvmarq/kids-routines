/* Shine Time — confeti de la celebración. Un canvas y nada más. */

const Confetti = (function () {
  const COLORS = ['#ff5fb0', '#9b5cff', '#3fe0ff', '#7dff9b', '#ffd447', '#ffffff'];
  let canvas = null, ctx = null, parts = [], raf = 0, until = 0;

  function size() {
    if (!canvas) return;
    canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
    canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
  }

  function spawn(n) {
    const w = canvas.width, h = canvas.height;
    for (let i = 0; i < n; i++) {
      parts.push({
        x: Math.random() * w,
        y: -Math.random() * h * 0.4,
        vx: (Math.random() - 0.5) * 2.4,
        vy: 2 + Math.random() * 3.4,
        s: 6 + Math.random() * 10,
        a: Math.random() * Math.PI,
        va: (Math.random() - 0.5) * 0.25,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        star: Math.random() < 0.3
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const h = canvas.height;
    parts = parts.filter(p => p.y < h + 40);
    parts.forEach(p => {
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

    if (Date.now() < until && parts.length < 240) spawn(3);
    if (parts.length) raf = requestAnimationFrame(draw);
    else raf = 0;
  }

  function start(ms) {
    canvas = canvas || document.getElementById('confetti');
    if (!canvas) return;
    ctx = ctx || canvas.getContext('2d');
    size();
    until = Date.now() + (ms || 2200);
    spawn(90);
    if (!raf) raf = requestAnimationFrame(draw);
  }

  function stop() {
    until = 0; parts = [];
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener('resize', () => { if (canvas) size(); });

  return { start, stop };
})();
