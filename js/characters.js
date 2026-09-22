/* Kids Routines — el grupo: Yuna, Nari y Soomi.
   Personajes ORIGINALES dibujados a mano en SVG, con estética de anime: ojos
   grandes con brillos, mechones en punta con reflejo y ropa de escenario
   (choker, falda plisada, medias altas y botas).
   No copian a ningún grupo ni a ninguna serie: ni el dibujo, ni el nombre.

   Lienzo 200 × 380, y el cuerpo mide así de arriba abajo:
     cabeza 20–110 · cuello 106–122 · top 122–172 · falda 184–226
     muslos 226–262 · medias 262–310 · botas 306–350
   Los ganchos que usa el CSS para animar son .body-g (el cuerpo entero),
   .arm-l / .arm-r (brazos), .mouth (la boca al hablar) y .sparkle. */

const Characters = (function () {
  let uid = 0;

  const LIST = [
    {
      id: 'yuna', name: 'Yuna', hello: "Hi! It's me, Yuna!", pitch: 1.45, rate: 0.95,
      hair: '#8b5cf6', hairDark: '#4c1d95', hairLight: '#c9b6ff', streak: '#ff4fa3',
      eye: '#a855f7', eyeDark: '#3b1470',
      outfit: '#ff4fa3', outfit2: '#ffd1e8', trim: '#ffd447',
      socks: '#ffffff', boots: '#2a1b4d',
      skin: '#ffe3d2', shade: '#f2b79c', style: 'long'
    },
    {
      id: 'nari', name: 'Nari', hello: "Hello! Nari here!", pitch: 1.3, rate: 0.98,
      hair: '#ff6fae', hairDark: '#b81f6d', hairLight: '#ffc2dd', streak: '#ffd447',
      eye: '#ff7aa8', eyeDark: '#6d1038',
      outfit: '#7b4bd8', outfit2: '#d9c6ff', trim: '#3fe0ff',
      socks: '#f3e9ff', boots: '#241638',
      skin: '#fbd3b4', shade: '#e0a180', style: 'ponytail'
    },
    {
      id: 'soomi', name: 'Soomi', hello: "Hey! I'm Soomi!", pitch: 1.6, rate: 0.92,
      hair: '#38c6ee', hairDark: '#0f6f95', hairLight: '#b6f0ff', streak: '#7dff9b',
      eye: '#34d3e8', eyeDark: '#08475e',
      outfit: '#ffd447', outfit2: '#fff4c9', trim: '#ff4fa3',
      socks: '#eafaff', boots: '#16263f',
      skin: '#ffdcc4', shade: '#eaae88', style: 'halfbuns'
    }
  ];

  function byId(id) { return LIST.find(c => c.id === id) || LIST[0]; }

  function random(exceptId) {
    const pool = LIST.filter(c => c.id !== exceptId);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function star(cx, cy, r, fill, cls) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.42 : r;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1);
    }
    return `<path class="${cls || ''}" d="${d}Z" fill="${fill}"/>`;
  }

  /* un ojo de anime: pestaña gruesa arriba, iris en degradado y tres brillos */
  function eye(x, y, c, g, flip) {
    const s = flip ? -1 : 1;
    return `
    <g transform="translate(${x},${y})">
      <ellipse cx="0" cy="1" rx="12.5" ry="14.5" fill="#fffdfa"/>
      <ellipse cx="0" cy="2" rx="11" ry="13.5" fill="url(#${g}iris)"/>
      <ellipse cx="0" cy="4" rx="5" ry="7" fill="${c.eyeDark}"/>
      <ellipse cx="0" cy="11" rx="8" ry="4.5" fill="${c.hairLight}" opacity=".6"/>
      <circle cx="${s * -4.5}" cy="-5" r="4.4" fill="#fff"/>
      <circle cx="${s * 5}" cy="7" r="2.2" fill="#fff" opacity=".9"/>
      <!-- pestaña: pegada al ojo, gruesa en el centro y con rabillo -->
      <path d="M-12.5,-6 q2,-10 12.5,-10 q10.5,0 12.5,10 q-4,-4 -12.5,-4 q-8.5,0 -12.5,4 Z"
            fill="#2a1338"/>
      <path d="M${-s * 12},-7 q${-s * 4},-2 ${-s * 6},-7 q${-s * 1},6 ${s * 3},10 Z" fill="#2a1338"/>
      <path d="M-11,13 q11,6 22,0" stroke="#2a1338" stroke-width="1.3" fill="none" opacity=".35"/>
    </g>`;
  }

  /* melena: masa trasera con puntas, y el peinado propio de cada una */
  function hairBack(c, g) {
    const common = `
      <path d="M100,14
               c-30,0 -50,20 -52,52
               c-2,26 -4,54 -12,94
               c-2,11 4,16 10,11
               c-3,22 -1,42 4,62
               c5,-20 11,-36 16,-48
               c-2,16 0,30 5,42
               c7,-18 11,-38 11,-62
               l36,0
               c0,24 4,44 11,62
               c5,-12 7,-26 5,-42
               c5,12 11,28 16,48
               c5,-20 7,-40 4,-62
               c6,5 12,0 10,-11
               c-8,-40 -10,-68 -12,-94
               c-2,-32 -22,-52 -52,-52 Z" fill="url(#${g}hair)"/>
      <path d="M52,96 c-2,30 -6,58 -11,86 c9,-18 16,-50 19,-84 Z" fill="${c.hairLight}" opacity=".32"/>
      <path d="M148,96 c2,30 6,58 11,86 c-9,-18 -16,-50 -19,-84 Z" fill="${c.hairLight}" opacity=".22"/>
      <path d="M60,104 c-2,34 -6,62 -11,88 c11,-20 16,-54 18,-88 Z" fill="${c.streak}" opacity=".6"/>`;

    if (c.style === 'ponytail') {
      return common + `
        <path d="M142,36 c30,10 40,42 33,76 c-7,34 -26,62 -48,80
                 c17,-30 26,-56 24,-80 c-2,-26 -5,-50 -9,-76 Z" fill="url(#${g}hair)"/>
        <path d="M148,52 c19,11 24,38 17,64 c-7,24 -21,45 -34,57
                 c10,-26 20,-48 20,-70 c0,-17 -1,-34 -3,-51 Z" fill="${c.hairLight}" opacity=".3"/>
        <path d="M155,66 c10,14 10,35 3,54 c-5,14 -13,26 -22,35 c14,-28 19,-58 19,-89 Z"
              fill="${c.streak}" opacity=".5"/>
        <circle cx="137" cy="36" r="6.5" fill="${c.trim}"/>`;
    }
    if (c.style === 'halfbuns') {
      return common + `
        <circle cx="48" cy="26" r="17" fill="url(#${g}hair)"/>
        <circle cx="152" cy="26" r="17" fill="url(#${g}hair)"/>
        <circle cx="44" cy="21" r="7" fill="${c.hairLight}" opacity=".45"/>
        <circle cx="148" cy="21" r="7" fill="${c.hairLight}" opacity=".45"/>
        <path d="M36,19 l-13,-8 12,-3 Z" fill="${c.trim}"/>
        <path d="M164,19 l13,-8 -12,-3 Z" fill="${c.trim}"/>
        ${star(48, 26, 6, c.streak, 'sparkle')}`;
    }
    // 'long' — mechón con cuentas y una estrella en el pelo
    return common + `
      <path d="M54,50 c-9,24 -11,58 -7,90 c5,-30 9,-62 14,-84 Z" fill="${c.hairLight}" opacity=".4"/>
      <g fill="${c.streak}" opacity=".85">
        <ellipse cx="53" cy="84" rx="4.5" ry="6"/>
        <ellipse cx="50" cy="102" rx="4" ry="5.5"/>
      </g>
      ${star(146, 38, 8, c.streak, 'sparkle s2')}`;
  }

  /* flequillo: acaba por encima de los ojos (si no, le tapa la cara) */
  function hairFront(c, g) {
    return `
      <path d="M100,16 c-28,0 -46,18 -48,46 c0,7 1,12 2,16
               c3,-13 7,-21 12,-27 c-1,8 0,14 2,19
               c4,-12 9,-20 16,-24 c-1,6 0,11 2,14
               c6,-8 12,-13 19,-15
               c7,2 13,7 19,15 c2,-3 3,-8 2,-14
               c7,4 12,12 16,24 c2,-5 3,-11 2,-19
               c5,6 9,14 12,27 c1,-4 2,-9 2,-16
               c-2,-28 -20,-46 -48,-46 Z" fill="url(#${g}hair)"/>
      <path d="M58,44 c-5,17 -7,36 -5,54 c3,-4 6,-9 8,-16 c2,10 5,17 10,22
               c-5,-21 -7,-42 -5,-60 Z" fill="url(#${g}hair)"/>
      <path d="M142,44 c5,17 7,36 5,54 c-3,-4 -6,-9 -8,-16 c-2,10 -5,17 -10,22
               c5,-21 7,-42 5,-60 Z" fill="url(#${g}hair)"/>
      <path d="M124,24 c7,12 10,28 9,48 c-3,-3 -6,-8 -7,-13
               c-1,10 -3,18 -7,25 c4,-20 5,-40 5,-60 Z" fill="${c.streak}" opacity=".9"/>
      <path d="M64,36 q34,-23 70,-2 q-7,9 -12,6 q-23,-13 -46,2 q-8,3 -12,-6 Z"
            fill="#ffffff" opacity=".26"/>`;
  }

  /* pose: 'idle' | 'dance' | 'still'  ·  mic: micrófono de mano */
  function svg(charOrId, opts) {
    const c = typeof charOrId === 'string' ? byId(charOrId) : charOrId;
    const o = opts || {};
    const pose = o.pose || 'idle';
    const g = 'k' + (++uid);

    return `
<svg class="kchar ${pose} ${o.action || ''}" viewBox="0 0 200 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.name}">
  <defs>
    <linearGradient id="${g}hair" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.hair}"/>
      <stop offset="55%" stop-color="${c.hair}"/>
      <stop offset="100%" stop-color="${c.hairDark}"/>
    </linearGradient>
    <linearGradient id="${g}iris" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.eyeDark}"/>
      <stop offset="55%" stop-color="${c.eye}"/>
      <stop offset="100%" stop-color="${c.hairLight}"/>
    </linearGradient>
    <linearGradient id="${g}o" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.outfit2}"/><stop offset="1" stop-color="${c.outfit}"/>
    </linearGradient>
    <radialGradient id="${g}glow" cx="50%" cy="40%" r="58%">
      <stop offset="0" stop-color="${c.outfit2}" stop-opacity=".38"/>
      <stop offset="1" stop-color="${c.outfit2}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <ellipse cx="100" cy="180" rx="94" ry="184" fill="url(#${g}glow)"/>

  <g class="body-g" style="transform-origin:100px 350px">

    <!-- piernas, medias altas y botas -->
    <path d="M85,218 h14 v34 h-14 Z" fill="${c.skin}"/>
    <path d="M101,218 h14 v34 h-14 Z" fill="${c.skin}"/>
    <path d="M85,244 h15 v58 q0,4 -7.5,4 q-7.5,0 -7.5,-4 Z" fill="${c.socks}"/>
    <path d="M100,244 h15 v58 q0,4 -7.5,4 q-7.5,0 -7.5,-4 Z" fill="${c.socks}"/>
    <rect x="85" y="244" width="15" height="5" fill="${c.trim}"/>
    <rect x="100" y="244" width="15" height="5" fill="${c.trim}"/>
    <path d="M83,300 h18 v38 q0,6 -6,6 h-8 q-4,0 -4,-6 Z" fill="${c.boots}"/>
    <path d="M99,300 h18 v38 q0,6 -4,6 h-8 q-6,0 -6,-6 Z" fill="${c.boots}"/>
    <path d="M81,336 h22 v8 h-22 Z" fill="${c.trim}" opacity=".8"/>
    <path d="M97,336 h22 v8 h-22 Z" fill="${c.trim}" opacity=".8"/>

    ${hairBack(c, g)}

    <!-- cuello y hombros -->
    <path d="M93,100 h14 v20 h-14 Z" fill="${c.shade}"/>
    <path d="M76,126 q24,-14 48,0 l-4,9 q-20,-9 -40,0 Z" fill="${c.skin}"/>

    <!-- top corto -->
    <path d="M76,126 q24,-13 48,0 l-5,44 q-19,8 -38,0 Z" fill="url(#${g}o)"/>
    <path d="M76,126 q10,12 24,12 q14,0 24,-12 l-3,-6 q-21,10 -42,0 Z" fill="${c.outfit2}" opacity=".75"/>
    <path d="M81,170 q19,7 38,0 l-1,6 q-18,6 -36,0 Z" fill="${c.trim}" opacity=".9"/>
    ${star(100, 148, 8, '#ffffff', 'sparkle')}

    <!-- choker -->
    <rect x="89" y="114" width="22" height="6" rx="3" fill="${c.boots}"/>
    <circle cx="100" cy="122" r="3.2" fill="${c.trim}"/>

    <!-- barriga y falda plisada -->
    <path d="M86,176 h28 v10 h-28 Z" fill="${c.skin}"/>
    <path d="M85,184 q15,7 30,0 l14,40 q-29,12 -58,0 Z" fill="${c.outfit}"/>
    <g stroke="${c.outfit2}" stroke-width="1.5" opacity=".5" fill="none">
      <path d="M92,188 l-4,34"/><path d="M100,190 l0,34"/><path d="M108,188 l4,34"/>
    </g>
    <rect x="84" y="182" width="32" height="6" rx="3" fill="${c.trim}"/>

    <!-- brazos -->
    <g class="arm-l" style="transform-origin:80px 130px">
      <path d="M74,128 q-8,4 -9,13 l-3,42 q0,6 6,6 q6,0 7,-6 l4,-42 Z" fill="${c.skin}"/>
      <path d="M74,128 q-8,4 -9,13 l-1,7 q8,4 15,-2 l2,-13 Z" fill="${c.outfit}"/>
      <circle cx="68" cy="189" r="7" fill="${c.skin}"/>
    </g>
    <g class="arm-r" style="transform-origin:120px 130px">
      <path d="M126,128 q8,4 9,13 l3,42 q0,6 -6,6 q-6,0 -7,-6 l-4,-42 Z" fill="${c.skin}"/>
      <path d="M126,128 q8,4 9,13 l1,7 q-8,4 -15,-2 l-2,-13 Z" fill="${c.outfit}"/>
      <circle cx="132" cy="189" r="7" fill="${c.skin}"/>
      ${o.mic ? `<rect x="128.5" y="172" width="7" height="24" rx="3.5" fill="#3a2a5c"/>
                 <circle cx="132" cy="170" r="7.5" fill="#e6e8f2"/>
                 <circle cx="132" cy="170" r="4.6" fill="#8d90a8"/>` : ''}
      ${o.prop || ''}
    </g>

    <!-- cara -->
    <path d="M100,22 c-19,0 -30,14 -30,38 c0,20 5,34 14,43 c6,6 11,9 16,9
             c5,0 10,-3 16,-9 c9,-9 14,-23 14,-43 c0,-24 -11,-38 -30,-38 Z"
          fill="${c.skin}"/>
    <path d="M70,52 c-4,-1 -6,3 -5,7 c1,5 4,9 8,8 Z" fill="${c.skin}"/>
    <path d="M130,52 c4,-1 6,3 5,7 c-1,5 -4,9 -8,8 Z" fill="${c.skin}"/>
    <circle cx="69" cy="63" r="2.6" fill="${c.trim}"/>
    <circle cx="131" cy="63" r="2.6" fill="${c.trim}"/>

    ${eye(82, 68, c, g, false)}
    ${eye(118, 68, c, g, true)}

    <!-- cejas, nariz, mofletes y boca -->
    <path d="M99,82 q3,2 -1,3.5" stroke="${c.shade}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <ellipse cx="77" cy="82" rx="7" ry="3.4" fill="#ff8fb4" opacity=".45"/>
    <ellipse cx="123" cy="82" rx="7" ry="3.4" fill="#ff8fb4" opacity=".45"/>
    <path class="mouth" d="M93,90 q7,10 14,0 q-7,4 -14,0 Z" fill="#a52a55"
          style="transform-origin:100px 91px"/>

    <!-- micro de diadema -->
    <path d="M130,66 q9,7 0,12 q-6,4 -11,3" stroke="#5a4a80" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <circle cx="118" cy="81" r="2.6" fill="#5a4a80"/>

    ${hairFront(c, g)}

    <!-- destellos de escenario -->
    ${star(32, 52, 7, '#ffffff', 'sparkle s3')}
    ${star(172, 104, 6, '#ffffff', 'sparkle s2')}
    ${star(26, 168, 5, c.streak, 'sparkle')}
  </g>
</svg>`;
  }

  return { LIST, byId, random, svg };
})();
