/* Shine Time — el grupo. Tres personajes ORIGINALES dibujados en SVG.
   Nada aquí copia a ningún grupo real: son formas y colores propios. */

const Characters = (function () {
  let uid = 0;

  const LIST = [
    {
      id: 'luna', name: 'Luna', hello: "Hi! It's me, Luna!",
      hair: '#b07dff', hairDark: '#6f3ad6', streak: '#ffd447',
      outfit: '#ff5fb0', outfit2: '#ff9ed4', skin: '#ffe0cc', style: 'buns'
    },
    {
      id: 'coco', name: 'Coco', hello: "Hello! Coco here!",
      hair: '#ff8ac0', hairDark: '#d94a95', streak: '#3fe0ff',
      outfit: '#9b5cff', outfit2: '#c9a6ff', skin: '#f6cfae', style: 'tails'
    },
    {
      id: 'hana', name: 'Hana', hello: "Hey! It's Hana!",
      hair: '#6fe3ff', hairDark: '#2b9fd0', streak: '#7dff9b',
      outfit: '#ffd447', outfit2: '#ffe999', skin: '#ffd9c0', style: 'bob'
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

  function hairBack(c) {
    if (c.style === 'tails') {
      return `
        <ellipse cx="40" cy="168" rx="19" ry="62" fill="${c.hairDark}"/>
        <ellipse cx="160" cy="168" rx="19" ry="62" fill="${c.hairDark}"/>
        <ellipse cx="40" cy="160" rx="13" ry="50" fill="${c.hair}"/>
        <ellipse cx="160" cy="160" rx="13" ry="50" fill="${c.hair}"/>
        <ellipse cx="100" cy="112" rx="60" ry="64" fill="${c.hairDark}"/>`;
    }
    if (c.style === 'buns') {
      return `
        <circle cx="48" cy="60" r="23" fill="${c.hairDark}"/>
        <circle cx="152" cy="60" r="23" fill="${c.hairDark}"/>
        <circle cx="48" cy="60" r="15" fill="${c.hair}"/>
        <circle cx="152" cy="60" r="15" fill="${c.hair}"/>
        <ellipse cx="100" cy="112" rx="60" ry="64" fill="${c.hairDark}"/>`;
    }
    return `<ellipse cx="100" cy="118" rx="62" ry="68" fill="${c.hairDark}"/>`;
  }

  function hairFront(c) {
    const fringe = `
      <path d="M46,104 A54,54 0 0 1 154,104 L154,88 A54,54 0 0 0 46,88 Z" fill="${c.hair}"/>
      <path d="M50,96 q18,-34 50,-34 q32,0 50,34 q-16,-14 -50,-14 q-34,0 -50,14 Z" fill="${c.hair}"/>
      <path d="M70,70 q10,26 2,44 q-14,-8 -18,-26 Z" fill="${c.hairDark}" opacity=".55"/>
      <path d="M130,70 q-10,26 -2,44 q14,-8 18,-26 Z" fill="${c.hairDark}" opacity=".55"/>
      <path d="M118,62 q10,20 8,40 q8,-6 10,-20 Z" fill="${c.streak}" opacity=".9"/>`;
    return fringe;
  }

  /* pose: 'idle' | 'dance' | 'still'  ·  mic: micrófono en la mano */
  function svg(charOrId, opts) {
    const c = typeof charOrId === 'string' ? byId(charOrId) : charOrId;
    const o = opts || {};
    const pose = o.pose || 'idle';
    const n = ++uid;
    const g = `sg${n}`;

    return `
<svg class="kchar ${pose}" viewBox="0 0 200 290" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.name}">
  <defs>
    <linearGradient id="${g}o" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.outfit2}"/><stop offset="1" stop-color="${c.outfit}"/>
    </linearGradient>
    <radialGradient id="${g}glow" cx="50%" cy="45%" r="55%">
      <stop offset="0" stop-color="${c.outfit2}" stop-opacity=".45"/>
      <stop offset="1" stop-color="${c.outfit2}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <ellipse cx="100" cy="140" rx="98" ry="130" fill="url(#${g}glow)"/>

  <g class="body-g" style="transform-origin:100px 270px">
    <!-- piernas -->
    <rect x="83" y="226" width="14" height="44" rx="7" fill="${c.skin}"/>
    <rect x="103" y="226" width="14" height="44" rx="7" fill="${c.skin}"/>
    <rect x="79" y="262" width="22" height="14" rx="7" fill="#2b1a3d"/>
    <rect x="99" y="262" width="22" height="14" rx="7" fill="#2b1a3d"/>

    ${hairBack(c)}

    <!-- cuerpo -->
    <path d="M70,176 q30,-12 60,0 l10,52 q-40,14 -80,0 Z" fill="url(#${g}o)"/>
    <path d="M62,228 q38,14 76,0 l8,26 q-46,16 -92,0 Z" fill="${c.outfit}" opacity=".92"/>
    ${star(100, 200, 13, '#ffffff', 'sparkle')}

    <!-- brazos (después del vestido, para que se vean) -->
    <g class="arm-l" style="transform-origin:72px 180px">
      <rect x="57" y="176" width="15" height="52" rx="7.5" fill="${c.skin}"/>
      <circle cx="64.5" cy="228" r="9" fill="${c.skin}"/>
    </g>
    <g class="arm-r" style="transform-origin:128px 180px">
      <rect x="128" y="176" width="15" height="52" rx="7.5" fill="${c.skin}"/>
      <circle cx="135.5" cy="228" r="9" fill="${c.skin}"/>
      ${o.mic ? `<rect x="129.5" y="188" width="12" height="36" rx="6" fill="#3a2a5c"/>
                 <circle cx="135.5" cy="186" r="12" fill="#d7d9e6"/>
                 <circle cx="135.5" cy="186" r="8" fill="#8d90a8"/>` : ''}
    </g>

    <!-- cuello -->
    <rect x="92" y="150" width="16" height="22" rx="8" fill="${c.skin}"/>

    <!-- cara -->
    <circle cx="100" cy="112" r="50" fill="${c.skin}"/>
    <circle cx="52" cy="118" r="8" fill="${c.skin}"/>
    <circle cx="148" cy="118" r="8" fill="${c.skin}"/>
    ${hairFront(c)}

    <!-- ojos -->
    <ellipse cx="79" cy="118" rx="12" ry="14" fill="#2b1a3d"/>
    <ellipse cx="121" cy="118" rx="12" ry="14" fill="#2b1a3d"/>
    <circle cx="75" cy="113" r="4.6" fill="#fff"/>
    <circle cx="117" cy="113" r="4.6" fill="#fff"/>
    <circle cx="83" cy="123" r="2.4" fill="#fff" opacity=".85"/>
    <circle cx="125" cy="123" r="2.4" fill="#fff" opacity=".85"/>
    <path d="M66,104 q13,-9 26,-2" stroke="${c.hairDark}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M108,102 q13,-7 26,2" stroke="${c.hairDark}" stroke-width="4" fill="none" stroke-linecap="round"/>

    <!-- mofletes y boca -->
    <ellipse cx="62" cy="134" rx="10" ry="6" fill="#ff7fae" opacity=".5"/>
    <ellipse cx="138" cy="134" rx="10" ry="6" fill="#ff7fae" opacity=".5"/>
    <ellipse class="mouth" cx="100" cy="138" rx="11" ry="10" fill="#93214f"
             style="transform-origin:100px 138px"/>

    <!-- adornos -->
    ${star(140, 76, 11, c.streak, 'sparkle s2')}
    ${star(30, 40, 9, '#ffffff', 'sparkle s3')}
    ${star(176, 120, 8, '#ffffff', 'sparkle')}
  </g>
</svg>`;
  }

  return { LIST, byId, random, svg };
})();
