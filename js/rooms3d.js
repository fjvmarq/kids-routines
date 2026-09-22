/* Kids Routines — las habitaciones en 3D.

   Cada rutina pasa en SU sitio: los dientes, en el baño; la cena, en la cocina;
   dormir, en el cuarto. La chica llama desde ahí, hace la tarea ahí y la fiesta
   es ahí, con un efecto que va con la acción (burbujas de jabón en el baño,
   estrellas y luna en el cuarto, corazones en la cocina…).

   Los muebles son del «Furniture Kit» de Kenney (CC0, rooms/LICENSE-kenney.txt).
   Vienen a media escala respecto a la chica, por eso se multiplican por ESCALA.
   Los materiales se pasan a «toon» (sombreado por bandas) para que casen con el
   dibujo anime de las chicas.

   Coordenadas: la chica está en el origen, mirando a la cámara (+Z). La pared
   del fondo está en z = FONDO. X positiva = derecha de la pantalla. */

import * as THREE from 'three';

const ESCALA = 2.0;
const FONDO = -1.7;

/* qué habitación le toca a cada escena de js/scenes.js */
export const HABITACION = {
  teeth: 'bathroom', hands: 'bathroom', bath: 'bathroom', toilet: 'bathroom', hair: 'bathroom',
  eat: 'kitchen', snack: 'kitchen', drink: 'kitchen',
  sleep: 'bedroom', bed: 'bedroom', wake: 'bedroom', dress: 'bedroom',
  tidy: 'playroom',
  book: 'living', pet: 'living',
  desk: 'study', school: 'study',
  park: 'park',
  stage: 'stage'
};

/* ───────── cómo es cada habitación ─────────
   pared/suelo: colores · luz: tono de la luz ambiente · fx: efecto de la fiesta
   muebles: [modelo, x, z, giroY (en cuartos de vuelta), y opcional] */
const SALAS = {
  bathroom: {
    pared: 0xbfeaf0, zocalo: 0x8fd3e0, suelo: [0xf4fbff, 0xdff3fa], luz: 0xeefaff, fx: 'bubbles',
    ventana: 'day',
    muebles: [
      ['bathroomSink', -0.95, FONDO + 0.3, 0],
      ['bathroomMirror', -0.95, FONDO + 0.06, 0, 1.18],
      ['bathroomCabinet', -1.65, FONDO + 0.25, 0, 1.25],
      ['bathtub', 1.7, FONDO + 0.62, 0],
      ['pottedPlant', 2.35, FONDO + 0.35, 0],
      ['rugRound', -0.3, 0.2, 0]
    ]
  },
  kitchen: {
    pared: 0xffe9c7, zocalo: 0xf5c98f, suelo: [0xf1d3a8, 0xe6c08c], luz: 0xfff4e0, fx: 'hearts',
    ventana: 'day',
    muebles: [
      ['kitchenFridge', -2.05, FONDO + 0.33, 0],
      ['kitchenCabinet', -1.3, FONDO + 0.48, 0],
      ['kitchenSink', -0.45, FONDO + 0.48, 0],
      ['kitchenStove', 0.4, FONDO + 0.48, 0],
      ['kitchenCabinetUpper', -1.3, FONDO + 0.22, 0, 1.45],
      ['kitchenCabinetUpper', 0.4, FONDO + 0.22, 0, 1.45],
      ['toaster', -1.3, FONDO + 0.45, 0, 0.9],
      ['tableRound', 1.75, -0.95, 0],
      ['chairCushion', 1.75, -0.05, 2],
      ['chairCushion', 2.6, -0.95, 3],
      ['plantSmall1', 1.75, -0.95, 0, 0.74]
    ]
  },
  bedroom: {
    pared: 0xe3d4ff, zocalo: 0xc6b0f5, suelo: [0xf6efff, 0xeadfff], luz: 0xf4ecff, fx: 'stars',
    ventana: 'night',
    muebles: [
      ['bedSingle', 1.2, FONDO + 1.95, 0],
      ['pillow', 0.9, FONDO + 0.3, 0, 0.55],
      ['pillowBlue', 1.35, FONDO + 0.3, 0, 0.55],
      ['bear', 1.85, FONDO + 0.5, 0, 0.52, 0.42],
      ['sideTable', -0.25, FONDO + 0.25, 0],
      ['lampRoundTable', -0.25, FONDO + 0.25, 0, 0.77],
      ['rugRound', -0.2, 0.25, 0],
      ['bookcaseOpenLow', -1.7, FONDO + 0.3, 0]
    ]
  },
  playroom: {
    pared: 0xffd6ea, zocalo: 0xffb3d4, suelo: [0xfff3f8, 0xffe4ef], luz: 0xfff0f6, fx: 'confetti',
    ventana: 'day',
    muebles: [
      ['bookcaseOpenLow', -1.6, FONDO + 0.3, 0],
      ['bookcaseOpenLow', -0.8, FONDO + 0.3, 0],
      ['books', -1.6, FONDO + 0.3, 0, 0.8],
      ['cardboardBoxOpen', 1.4, -1.0, 0],
      ['bear', 1.5, -1.0, 0, 0.5, 0.42],
      ['rugRounded', 0.6, 0.1, 0],
      ['pottedPlant', 2.3, FONDO + 0.35, 0]
    ]
  },
  living: {
    pared: 0xd8f1e3, zocalo: 0xa9dcc0, suelo: [0xf3ead9, 0xe7dbc3], luz: 0xf2fff7, fx: 'sparkles',
    ventana: 'day',
    muebles: [
      ['loungeSofa', 1.3, FONDO + 0.5, 0],
      ['tableCoffee', 1.3, -0.3, 0],
      ['books', 1.2, -0.35, 0, 0.46],
      ['bookcaseOpen', -1.6, FONDO + 0.3, 0],
      ['rugRectangle', 1.0, 0.0, 0],
      ['pottedPlant', -0.8, FONDO + 0.35, 0]
    ]
  },
  study: {
    pared: 0xd6f0ff, zocalo: 0xa9d8f5, suelo: [0xeef7ff, 0xdcecfb], luz: 0xf0f8ff, fx: 'sparkles',
    ventana: 'day',
    muebles: [
      ['desk', 1.2, FONDO + 0.5, 0],
      ['laptop', 1.25, FONDO + 0.45, 0, 0.77],
      ['chairDesk', 1.15, -0.3, 2],
      ['lampSquareFloor', 2.25, FONDO + 0.35, 0],
      ['bookcaseOpen', -1.6, FONDO + 0.3, 0],
      ['coatRackStanding', -0.7, FONDO + 0.4, 0],
      ['rugRound', -0.2, 0.25, 0]
    ]
  },
  park: {
    cielo: true, suelo: [0x9be38f, 0x8bd87f], luz: 0xfffbe8, fx: 'sparkles',
    muebles: [
      ['pottedPlant', -1.8, -1.0, 0],
      ['pottedPlant', 2.1, -1.2, 0],
      ['plantSmall2', 1.0, -0.8, 0],
      ['plantSmall1', -0.9, -1.4, 0]
    ]
  },
  stage: { escenario: true, fx: 'confetti' }
};

/* ───────── texturas pintadas en un canvas (sin descargar nada) ───────── */

function textura(w, h, pinta) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  pinta(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function css(hex) { return '#' + hex.toString(16).padStart(6, '0'); }

function baldosas(a, b) {
  const t = textura(256, 256, (g, w, h) => {
    g.fillStyle = css(a); g.fillRect(0, 0, w, h);
    g.fillStyle = css(b);
    g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3;
    g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h);
    g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 4);
  return t;
}

function ventana(tipo) {
  return textura(256, 192, (g, w, h) => {
    const cielo = g.createLinearGradient(0, 0, 0, h);
    if (tipo === 'night') {
      cielo.addColorStop(0, '#1b1450'); cielo.addColorStop(1, '#4b3a9a');
    } else {
      cielo.addColorStop(0, '#7fd3ff'); cielo.addColorStop(1, '#d7f3ff');
    }
    g.fillStyle = cielo; g.fillRect(0, 0, w, h);
    if (tipo === 'night') {
      g.fillStyle = '#fff6c9';
      g.beginPath(); g.arc(w * 0.72, h * 0.32, 22, 0, Math.PI * 2); g.fill();
      g.fillStyle = cielo; g.beginPath(); g.arc(w * 0.67, h * 0.27, 20, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff';
      for (let i = 0; i < 26; i++) {
        g.globalAlpha = 0.4 + Math.random() * 0.6;
        g.fillRect(Math.random() * w, Math.random() * h * 0.8, 2, 2);
      }
      g.globalAlpha = 1;
    } else {
      g.fillStyle = 'rgba(255,255,255,.95)';
      [[60, 60, 26], [92, 52, 32], [124, 62, 24], [180, 110, 20], [205, 104, 26]].forEach(([x, y, r]) => {
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      });
    }
    // el marco y la cruz de la ventana
    g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.strokeRect(6, 6, w - 12, h - 12);
    g.lineWidth = 8; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
  });
}

function sprite(dibuja) {
  return textura(64, 64, (g, w, h) => dibuja(g, w, h));
}

const PARTICULAS = {
  bubbles: () => sprite((g, w) => {
    const r = w / 2 - 3;
    const grad = g.createRadialGradient(w * 0.38, w * 0.35, 2, w / 2, w / 2, r);
    grad.addColorStop(0, 'rgba(255,255,255,.95)');
    grad.addColorStop(0.25, 'rgba(200,245,255,.25)');
    grad.addColorStop(0.85, 'rgba(160,220,255,.18)');
    grad.addColorStop(1, 'rgba(255,170,230,.75)');
    g.fillStyle = grad; g.beginPath(); g.arc(w / 2, w / 2, r, 0, Math.PI * 2); g.fill();
  }),
  stars: () => sprite((g, w) => {
    g.fillStyle = '#ffe98a';
    g.shadowColor = '#fff5b8'; g.shadowBlur = 10;
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 11 : 26, a = Math.PI / 5 * i - Math.PI / 2;
      g.lineTo(w / 2 + r * Math.cos(a), w / 2 + r * Math.sin(a));
    }
    g.closePath(); g.fill();
  }),
  hearts: () => sprite((g, w) => {
    g.fillStyle = '#ff6fae';
    g.beginPath();
    g.moveTo(32, 54);
    g.bezierCurveTo(4, 34, 10, 8, 32, 20);
    g.bezierCurveTo(54, 8, 60, 34, 32, 54);
    g.fill();
  }),
  sparkles: () => sprite((g, w) => {
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(255,240,160,.9)');
    grad.addColorStop(1, 'rgba(255,200,80,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#fff';
    g.fillRect(30, 4, 4, 56); g.fillRect(4, 30, 56, 4);
  }),
  confetti: () => sprite((g) => {
    const colores = ['#ff5fb0', '#9b5cff', '#3fe0ff', '#ffd447', '#7dff9b'];
    g.fillStyle = colores[(Math.random() * colores.length) | 0];
    g.fillRect(18, 24, 28, 16);
  })
};

/* ───────── los muebles ───────── */

const cacheModelos = {};

function aToon(obj) {
  obj.traverse(o => {
    if (!o.isMesh) return;
    const viejo = o.material;
    const color = viejo && viejo.color ? viejo.color.clone() : new THREE.Color(0xffffff);
    o.material = new THREE.MeshToonMaterial({ color, map: viejo && viejo.map ? viejo.map : null });
    o.castShadow = false; o.receiveShadow = false;
  });
}

async function mueble(loader, nombre) {
  if (!cacheModelos[nombre]) {
    cacheModelos[nombre] = loader.loadAsync('rooms/' + nombre + '.glb').then(gltf => {
      const escena = gltf.scene;
      aToon(escena);
      escena.scale.setScalar(ESCALA);
      // el origen de Kenney está en una esquina: lo llevamos al centro de la base
      const caja = new THREE.Box3().setFromObject(escena);
      const centro = caja.getCenter(new THREE.Vector3());
      const pivote = new THREE.Group();
      escena.position.set(-centro.x, -caja.min.y, -centro.z);
      pivote.add(escena);
      return pivote;
    });
  }
  const base = await cacheModelos[nombre];
  return base.clone(true);
}

/* ───────── montar una habitación ───────── */

export async function montaHabitacion(loader, id) {
  const sala = SALAS[id] || SALAS.stage;
  const grupo = new THREE.Group();
  grupo.name = 'habitacion-' + id;

  if (sala.escenario) return { grupo, sala };      // el escenario K-pop es el fondo CSS

  // el suelo
  const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 5),
    new THREE.MeshToonMaterial({ map: baldosas(sala.suelo[0], sala.suelo[1]) })
  );
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.set(0.3, 0, FONDO + 2.5);
  grupo.add(suelo);

  if (sala.cielo) {
    // al aire libre: cielo de degradado y unas nubes
    const cielo = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 5),
      new THREE.MeshBasicMaterial({ map: textura(64, 256, (g, w, h) => {
        const d = g.createLinearGradient(0, 0, 0, h);
        d.addColorStop(0, '#5cc4ff'); d.addColorStop(0.7, '#bfe9ff'); d.addColorStop(1, '#e9fbff');
        g.fillStyle = d; g.fillRect(0, 0, w, h);
      }) })
    );
    cielo.position.set(0.3, 2.3, FONDO - 1);
    grupo.add(cielo);
  } else {
    // la pared del fondo, con su zócalo, y una pared lateral para dar profundidad
    const matPared = new THREE.MeshToonMaterial({ color: sala.pared });
    const pared = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.4), matPared);
    pared.position.set(0.3, 1.7, FONDO);
    grupo.add(pared);
    const zocalo = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.9), new THREE.MeshToonMaterial({ color: sala.zocalo }));
    zocalo.position.set(0.3, 0.45, FONDO + 0.005);
    grupo.add(zocalo);
    const lateral = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.4), matPared);
    lateral.rotation.y = Math.PI / 2;
    lateral.position.set(-2.6, 1.7, FONDO + 2.5);
    grupo.add(lateral);

    if (sala.ventana) {
      const v = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.82),
        new THREE.MeshBasicMaterial({ map: ventana(sala.ventana) }));
      v.position.set(0.25, 1.75, FONDO + 0.01);
      grupo.add(v);
    }
  }

  // los muebles, a la vez
  const piezas = await Promise.all(sala.muebles.map(async ([nombre, x, z, giro, y, esc]) => {
    try {
      const m = await mueble(loader, nombre);
      m.position.set(x, y || 0, z);
      if (esc) m.scale.setScalar(esc);
      m.rotation.y = (giro || 0) * Math.PI / 2;
      return m;
    } catch (e) {
      console.warn('[3d] mueble que no carga:', nombre, e);
      return null;
    }
  }));
  piezas.filter(Boolean).forEach(p => grupo.add(p));

  return { grupo, sala };
}

/* ───────── la fiesta: partículas que van con la acción ───────── */

export function creaFiesta(escena) {
  const grupo = new THREE.Group();
  escena.add(grupo);
  let vivas = [];
  let tipo = 'confetti';
  const texturas = {};

  function tex(t) {
    if (!texturas[t]) texturas[t] = PARTICULAS[t] ? PARTICULAS[t]() : PARTICULAS.sparkles();
    return texturas[t];
  }

  function suelta(n) {
    for (let i = 0; i < n; i++) {
      const mat = new THREE.SpriteMaterial({ map: tipo === 'confetti' ? PARTICULAS.confetti() : tex(tipo),
        transparent: true, depthWrite: false });
      const s = new THREE.Sprite(mat);
      const tam = tipo === 'bubbles' ? 0.08 + Math.random() * 0.12
        : tipo === 'confetti' ? 0.06 + Math.random() * 0.05 : 0.07 + Math.random() * 0.08;
      s.scale.setScalar(tam);
      const deArriba = tipo === 'confetti';
      s.position.set(-1.2 + Math.random() * 2.8, deArriba ? 2.3 + Math.random() : 0.4 + Math.random() * 1.2,
        -0.8 + Math.random() * 1.2);
      grupo.add(s);
      vivas.push({
        s, vida: 0, dura: 3 + Math.random() * 2.5,
        vx: (Math.random() - 0.5) * 0.25,
        vy: deArriba ? -(0.35 + Math.random() * 0.4) : 0.18 + Math.random() * 0.3,
        fase: Math.random() * Math.PI * 2
      });
    }
  }

  return {
    empieza(t) {
      tipo = t || 'confetti';
      suelta(tipo === 'confetti' ? 26 : 14);
      this._goteo = 3.0;            // segundos soltando más
      this._acumulado = 0;
    },
    _goteo: 0,
    _acumulado: 0,
    actualiza(dt) {
      // por SEGUNDO, no por fotograma: a 60 fps, «2 por fotograma» eran 120 por segundo
      if (this._goteo > 0) {
        this._goteo -= dt;
        this._acumulado += dt * (tipo === 'confetti' ? 14 : 7);
        const n = Math.floor(this._acumulado);
        if (n > 0) { suelta(n); this._acumulado -= n; }
      }
      vivas = vivas.filter(p => {
        p.vida += dt;
        p.s.position.x += (p.vx + Math.sin(p.vida * 2 + p.fase) * 0.12) * dt;
        p.s.position.y += p.vy * dt;
        if (tipo === 'stars' || tipo === 'sparkles') p.s.material.rotation += dt;
        const f = p.vida / p.dura;
        p.s.material.opacity = f < 0.1 ? f * 10 : f > 0.75 ? Math.max(0, (1 - f) * 4) : 1;
        if (p.vida > p.dura) { grupo.remove(p.s); p.s.material.dispose(); return false; }
        return true;
      });
    },
    para() {
      this._goteo = 0;
      vivas.forEach(p => { grupo.remove(p.s); p.s.material.dispose(); });
      vivas = [];
    }
  };
}


/* precarga todos los muebles en segundo plano (son 0,6 MB en total), para que
   la primera llamada no tenga que esperar a que se descargue su habitación */
export async function precargaTodo(loader) {
  const nombres = new Set();
  Object.values(SALAS).forEach(sala => (sala.muebles || []).forEach(m => nombres.add(m[0])));
  for (const n of nombres) {
    try { await mueble(loader, n); } catch (e) { /* ya avisará al montarla */ }
  }
}
