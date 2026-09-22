/* Kids Routines — el escenario en 3D.

   Tres chicas anime de verdad, en 3D: modelos VRM (el formato de VRoid) con
   esqueleto, sombreado anime (MToon), parpadeo y boca. Se dibujan en el propio
   navegador con Three.js + @pixiv/three-vrm.

   Cómo se mueven, por capas:
     1. DEBAJO, un movimiento de reposo capturado de una persona real (mocap:
        anim/idle_loop.vrma). Es lo que hace que respire y cambie el peso de
        pierna como una persona, y no como un muñeco.
     2. ENCIMA, la postura de cada momento (móvil en la oreja, haciendo la
        tarea, brazos arriba en la fiesta…), fundida con un peso que sube y baja
        con suavidad. Nunca un salto: todo pasa por un amortiguado exponencial.
     3. Y la cara: parpadeo, sonrisa y la boca mientras suena la voz.

   Si algo falla al cargar (móvil sin WebGL, sin red, modelo roto) este fichero
   no hace nada y la app sigue con el dibujo 2D. Nunca rompe la app.

   Los modelos son CC0 (muestras oficiales de VRoid, de pixiv): ver README. */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation';
import { montaHabitacion, HABITACION, creaFiesta, precargaTodo } from './rooms3d.js';

/* cada chica, su modelo (se descarga sólo cuando llama, y se guarda) */
const MODELOS = {
  yuna:  'models/yuna.vrm',     // Sendagaya Shino — melena larga oscura
  nari:  'models/nari.vrm',     // Victoria Rubin — rubia que degrada a rosa
  soomi: 'models/soomi.vrm'     // Vita — plateada con mechas azules
};
const REPOSO = 'anim/idle_loop.vrma';

/* el color de la luz de contra de cada una, para que el escenario sea «suyo» */
const LUZ = { yuna: 0xa66bff, nari: 0xff5fb0, soomi: 0x3fe0ff };

/* ───────── utilidades ───────── */
const lerp = (a, b, t) => a + (b - a) * t;
const suave = (dt, velocidad) => 1 - Math.exp(-dt * velocidad);
const onda = (t, periodo, fase = 0) => Math.sin((t / periodo + fase) * Math.PI * 2);

function hayWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}

/* ───────── las posturas ─────────
   Rotaciones (radianes, orden XYZ) de los huesos NORMALIZADOS del VRM, que
   parten de la pose en T. Sólo se escriben los huesos que cambian; los demás
   se quedan con el movimiento de reposo capturado. */
const POSTURAS = {
  // llamando: el móvil en la oreja derecha, la otra mano relajada
  ring: {
    rightUpperArm: [-0.75, 0.05, 0.6], rightLowerArm: [0.0, 2.45, 0.0], rightHand: [0.0, 0.0, 0.2],
    head: [0.04, -0.06, -0.12]
  },
  // hablando por el móvil
  talk: {
    rightUpperArm: [-0.75, 0.05, 0.6], rightLowerArm: [0.0, 2.45, 0.0], rightHand: [0.0, 0.0, 0.2],
    head: [0.02, -0.05, -0.1]
  },
  // haciendo la tarea: la mano derecha delante de la cara, trabajando
  do: {
    rightUpperArm: [-0.35, 0.55, 1.0], rightLowerArm: [0.0, 2.0, 0.0], rightHand: [0, 0, 0],
    leftUpperArm: [-0.2, -0.3, -1.1], leftLowerArm: [0.0, -1.2, 0.0],
    head: [0.1, 0.0, 0.0]
  },
  // la deja a medias: brazos caídos, cabeza ladeada y un pelín hacia abajo
  skip: {
    rightUpperArm: [0.0, 0.0, 1.25], leftUpperArm: [0.0, 0.0, -1.25],
    head: [0.22, 0.12, 0.16]
  },
  // ¡fiesta!: los dos brazos arriba
  party: {
    rightUpperArm: [-0.3, 0.0, -0.9], leftUpperArm: [-0.3, 0.0, 0.9],
    rightLowerArm: [0.0, 0.6, 0.0], leftLowerArm: [0.0, -0.6, 0.0],
    head: [-0.08, 0, 0]
  },
  // se despide: la mano derecha saluda a la altura de la cara
  bye: {
    rightUpperArm: [-0.35, -0.45, 1.05], rightLowerArm: [0.0, 2.8, 0.0],
    head: [0.05, -0.05, 0.1]
  },
  wait: {}
};

/* cuánto dura cada momento (ms) */
const DURACION = { do: 5200, skip: 3200 };
window.__posturas = POSTURAS;      // la página de pruebas las toca en vivo

/* ───────── el escenario ───────── */

function crea() {
  let host = null;
  let renderer, scene, camera, clock;
  let luzColor = null, suelo = null;

  const cargados = {};            // id → { vrm, mixer }
  let actual = null;              // el que se ve
  let idChica = null;
  let clipReposo = null;          // el VRMAnimation del reposo, para crear un clip por modelo

  let objetoMano = null;
  let mood = 'wait', moodOpts = {}, moodDesde = 0;
  const habitaciones = {};        // id → promesa de { grupo, sala }
  let salaActual = null, idSala = null;
  let fiesta = null, hemi = null;
  let peso = 0;                   // cuánto manda la postura sobre el reposo (0–1)
  let hablando = false, boca = 0, sonrisa = 0.5, pena = 0;
  let pausado = true, raf = 0;
  let parpadeo = { siguiente: 1.6, t: -1 };

  const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), eu = new THREE.Euler();

  function init() {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(24, 16 / 9, 0.1, 30);
    clock = new THREE.Clock();

    // luces de escenario: principal suave y cálida, contraluz de su color, relleno
    hemi = new THREE.HemisphereLight(0xfff4fb, 0x4a3380, 1.1);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.45);
    key.position.set(0.9, 1.8, 2.6);
    scene.add(key);
    luzColor = new THREE.DirectionalLight(0xff5fb0, 1.2);
    luzColor.position.set(-1.8, 2.2, -1.6);
    scene.add(luzColor);
    const relleno = new THREE.DirectionalLight(0x9fe8ff, 0.45);
    relleno.position.set(2.2, 0.6, -0.8);
    scene.add(relleno);

    // el escenario: un disco que brilla bajo sus pies
    const disco = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 64),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false })
    );
    disco.rotation.x = -Math.PI / 2;
    disco.position.y = 0.003;
    suelo = disco;
    scene.add(disco);

    fiesta = creaFiesta(scene);
    window.addEventListener('resize', encaja);
  }

  /* ───────── la habitación de la rutina ───────── */
  async function ponHabitacion(escena) {
    const id = HABITACION[escena] || 'stage';
    idSala = id;
    if (!habitaciones[id]) {
      habitaciones[id] = montaHabitacion(cargadorMuebles(), id);
      // mientras se monta, fuera la anterior (que no llame del baño desde la cocina)
      if (salaActual && salaActual.grupo.parent) scene.remove(salaActual.grupo);
    }
    let h;
    try { h = await habitaciones[id]; } catch (e) { console.warn('[3d] habitación', id, e); return; }
    if (idSala !== id) return;                        // cambió mientras cargaba
    if (salaActual && salaActual.grupo.parent) scene.remove(salaActual.grupo);
    salaActual = h;
    scene.add(h.grupo);
    const enEscenario = !!h.sala.escenario;
    if (suelo) suelo.visible = enEscenario;            // el disco brillante, sólo en el escenario
    if (hemi) {
      hemi.color.set(h.sala.luz || 0xfff4fb);
      hemi.intensity = enEscenario ? 1.1 : 1.35;
    }
  }

  let _cm = null;
  function cargadorMuebles() { return _cm || (_cm = new GLTFLoader()); }

  /* encuadre: la chica grande a la izquierda, de medio cuerpo para arriba,
     dejando la derecha para el bocadillo y los botones */
  function encaja() {
    if (!host || !renderer) return;
    if (window.__camLibre) return;                    // la página de pruebas mueve la cámara
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const x = 0.36 * Math.min(1.25, (w / h) / 1.9);    // cuanto más apaisado, más a la izquierda
    camera.position.set(x, 1.3, 2.85);
    camera.lookAt(x, 1.16, 0);
    camera.updateProjectionMatrix();
  }

  function cargador() {
    const loader = new GLTFLoader();
    loader.register(parser => new VRMLoaderPlugin(parser));
    loader.register(parser => new VRMAnimationLoaderPlugin(parser));
    return loader;
  }

  async function cargaReposo() {
    try {
      const gltf = await cargador().loadAsync(REPOSO);
      clipReposo = (gltf.userData.vrmAnimations || [])[0] || null;
    } catch (e) {
      console.warn('[3d] sin movimiento de reposo:', e);
    }
  }

  async function cargaChica(id) {
    if (cargados[id]) return cargados[id];
    const gltf = await cargador().loadAsync(MODELOS[id] || MODELOS.yuna);
    const vrm = gltf.userData.vrm;
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    if (VRMUtils.combineSkeletons) VRMUtils.combineSkeletons(gltf.scene);
    VRMUtils.rotateVRM0(vrm);                         // las VRoid 0.x miran hacia atrás
    vrm.scene.traverse(o => { o.frustumCulled = false; });

    // el pivote: lo que giramos nosotros. vrm.scene NO se toca (rotateVRM0 ya
    // lo ha girado 180° para que mire a cámara; pisarlo la ponía de perfil)
    const pivote = new THREE.Group();
    pivote.add(vrm.scene);

    // la física del pelo y la falda (spring bones) guarda su posición de reposo
    // al cargar, ANTES del giro de rotateVRM0: hay que volver a fijarla ya girada,
    // o el pelo arranca al revés y se queda enganchado hacia los lados
    vrm.scene.updateMatrixWorld(true);
    if (vrm.springBoneManager) {
      vrm.springBoneManager.setInitState();
      vrm.springBoneManager.reset();
    }

    let mixer = null;
    if (clipReposo) {
      mixer = new THREE.AnimationMixer(vrm.scene);
      const clip = createVRMAnimationClip(clipReposo, vrm);
      mixer.clipAction(clip).play();
    }
    cargados[id] = { vrm, mixer, pivote };
    return cargados[id];
  }

  async function muestra(id) {
    idChica = id;
    // si hay que descargarla, se quita ya la anterior: si no, se vería a Yuna
    // mientras el cartel dice «Soomi is calling…»
    if (!cargados[id] && actual) {
      if (actual.pivote.parent) scene.remove(actual.pivote);
      actual = null;
    }
    const c = await cargaChica(id);
    if (idChica !== id) return;                       // llamó otra mientras cargaba
    if (actual && actual.pivote.parent) scene.remove(actual.pivote);
    actual = c;
    scene.add(c.pivote);

    // poner ya la postura de reposo y DESPUÉS soltar la física: si no, el salto
    // de la pose en T al reposo empuja el pelo y la falda hacia los lados
    if (c.mixer) c.mixer.update(0);
    c.vrm.humanoid.update();
    c.vrm.scene.updateMatrixWorld(true);
    if (c.vrm.springBoneManager) c.vrm.springBoneManager.reset();
    window.__vrm = c.vrm;                              // para la página de pruebas
    window.__cam = camera;
    window.__render = () => renderer.render(scene, camera);
    if (luzColor) luzColor.color.set(LUZ[id] || 0xff5fb0);
    ponObjeto(objetoPara(mood));
  }

  /* ───────── el objeto de la mano ───────── */
  function mat(c) { return new THREE.MeshToonMaterial({ color: c }); }
  function barra(c, r, largo, punta) {
    const g = new THREE.Group();
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(r, r, largo, 12), mat(c));
    const cabeza = new THREE.Mesh(new THREE.BoxGeometry(r * 2.4, r * 3, r * 2.4), mat(punta));
    cabeza.position.y = largo / 2 + r;
    g.add(palo, cabeza);
    return g;
  }
  function bola(c, r) { return new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), mat(c)); }
  function caja(c, x, y, z) { return new THREE.Mesh(new THREE.BoxGeometry(x, y, z), mat(c)); }
  function telefono() {
    const g = new THREE.Group();
    const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.105, 0.011), mat(0xff4fa3));
    const pantalla = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.09, 0.002), mat(0x1c1030));
    pantalla.position.z = 0.0065;
    g.add(cuerpo, pantalla);
    return g;
  }
  const OBJETOS = {
    phone: telefono,
    teeth: () => barra(0x6fe0b0, 0.009, 0.15, 0xffffff),
    hair:  () => barra(0xff8fc0, 0.012, 0.13, 0xffffff),
    eat:   () => barra(0xdfe3ee, 0.005, 0.14, 0xdfe3ee),
    snack: () => bola(0xff5b6b, 0.04),
    drink: () => new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.09, 20),
      new THREE.MeshToonMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.85 })),
    hands: () => bola(0xfff1a8, 0.035),
    bath:  () => bola(0xffd1e8, 0.045),
    book:  () => caja(0xffd447, 0.13, 0.095, 0.018),
    desk:  () => barra(0xffd447, 0.005, 0.13, 0x2a1338),
    tidy:  () => caja(0x7ee0ff, 0.07, 0.07, 0.07),
    school: () => caja(0x7b4bd8, 0.11, 0.13, 0.045),
    dress: () => caja(0xffd1e8, 0.13, 0.11, 0.015),
    toilet: () => caja(0xffffff, 0.055, 0.055, 0.055),
    pet: () => bola(0xeef3fb, 0.035)
  };
  function objetoPara(m) {
    if (m === 'ring' || m === 'talk') return 'phone';
    if (m === 'do' || m === 'skip') return moodOpts.scene || null;
    return null;
  }
  function ponObjeto(tipo) {
    if (objetoMano && objetoMano.parent) objetoMano.parent.remove(objetoMano);
    objetoMano = null;
    if (!actual || !tipo || !OBJETOS[tipo]) return;
    const mano = actual.vrm.humanoid.getNormalizedBoneNode('rightHand');
    if (!mano) return;
    objetoMano = OBJETOS[tipo]();
    // en la palma: los dedos apuntan a -X en VRM 1.0 y a +X en VRM 0 (espejo)
    const esp = actual.vrm.meta && actual.vrm.meta.metaVersion === '0' ? -1 : 1;
    objetoMano.position.set(-0.07 * esp, -0.012, 0.012);
    if (tipo === 'phone') objetoMano.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    else objetoMano.rotation.set(0, 0, Math.PI / 2);
    mano.add(objetoMano);
  }

  /* ───────── cada fotograma ───────── */

  function hueso(n) { return actual.vrm.humanoid.getNormalizedBoneNode(n); }

  /* funde la postura del momento sobre el reposo capturado */
  function aplicaPostura(dt) {
    const objetivo = POSTURAS[mood] || POSTURAS.wait;
    const quiere = Object.keys(objetivo).length ? 1 : 0;
    peso = window.__instantaneo ? quiere      // página de pruebas: sin transición
      : lerp(peso, quiere, suave(dt, mood === 'party' ? 5 : 3.4));
    if (peso < 0.001) return;
    const esVRM0 = actual.vrm.meta && actual.vrm.meta.metaVersion === '0';
    for (const n in objetivo) {
      const b = hueso(n);
      if (!b) continue;
      const r = objetivo[n];
      q1.copy(b.quaternion);
      q2.setFromEuler(eu.set(r[0], r[1], r[2], 'XYZ'));
      // las posturas están escritas para VRM 1.0 (mira a +Z). Los VRM 0.x
      // tienen el esqueleto en espejo: se invierten X y Z del cuaternión,
      // exactamente como hace three-vrm-animation con el movimiento de reposo
      if (esVRM0) { q2.x = -q2.x; q2.z = -q2.z; }
      b.quaternion.slerpQuaternions(q1, q2, peso);
    }
  }

  /* lo que se suma encima, según el momento */
  function aplicaVida(t, dt) {
    const desde = (performance.now() - moodDesde) / 1000;
    const esp = actual.vrm.meta && actual.vrm.meta.metaVersion === '0' ? -1 : 1;   // espejo VRM 0
    const head = hueso('head'), hips = hueso('hips');
    const raiz = actual.pivote;

    // hablando: asiente un poco, como quien habla por teléfono
    if (hablando && head) head.rotateX(esp * onda(t, 1.5) * 0.035);

    // fiesta: rebote con peso y giro alegre a un lado y a otro
    if (mood === 'party') {
      const bote = Math.max(0, onda(t, 0.95)) * 0.05;
      if (hips) hips.position.y += bote;
      const la = hueso('leftUpperArm'), ra = hueso('rightUpperArm');
      if (la) la.rotateZ(esp * onda(t, 0.95) * 0.22);
      if (ra) ra.rotateZ(-esp * onda(t, 0.95, 0.5) * 0.22);
      raiz.rotation.y = lerp(raiz.rotation.y, onda(t, 3.8) * 0.4, suave(dt, 4));
    } else {
      // un pelín girada hacia los botones, que es donde «mira» la niña
      raiz.rotation.y = lerp(raiz.rotation.y, -0.18, suave(dt, 3));
    }

    // se despide: la mano va y viene
    if (mood === 'bye') {
      const rl = hueso('rightLowerArm');
      if (rl) rl.rotateZ(esp * onda(t, 0.9) * 0.3);
    }

    // haciendo la tarea: el gesto, y al final quieta y contenta
    if (mood === 'do' && desde < DURACION.do / 1000 - 1.2) {
      const escena = moodOpts.scene || 'stage';
      const rl = hueso('rightLowerArm'), ra = hueso('rightUpperArm'), la = hueso('leftUpperArm');
      if (escena === 'teeth' || escena === 'hair') {
        if (rl) rl.rotateY(onda(t, 0.34) * 0.16);                  // cepilla
      } else if (escena === 'hands' || escena === 'bath' || escena === 'toilet') {
        if (ra) ra.rotateX(esp * onda(t, 0.5) * 0.12);             // frota
        if (la) la.rotateX(esp * onda(t, 0.5, 0.5) * 0.12);
      } else if (escena === 'eat' || escena === 'snack' || escena === 'drink') {
        if (rl) rl.rotateY((onda(t, 1.7) * 0.5 + 0.5) * 0.45);     // a la boca
      } else if (escena === 'sleep' || escena === 'bed') {
        if (head) head.rotateZ(esp * 0.28);                        // se acurruca
      } else {
        if (ra) ra.rotateX(esp * onda(t, 1.2) * 0.14);
      }
    }

    // la deja a medias: al cabo de un momento suelta el objeto
    if (mood === 'skip' && desde > 1.6 && objetoMano) ponObjeto(null);
  }

  function aplicaCara(dt, t) {
    const em = actual.vrm.expressionManager;
    if (!em) return;

    // parpadeo: cada 2–6 s, rápido
    parpadeo.siguiente -= dt;
    if (parpadeo.siguiente <= 0 && parpadeo.t < 0) parpadeo.t = 0;
    let blink = 0;
    if (parpadeo.t >= 0) {
      parpadeo.t += dt;
      const f = parpadeo.t / 0.15;
      blink = f < 0.5 ? f * 2 : Math.max(0, 2 - f * 2);
      if (parpadeo.t > 0.15) { parpadeo.t = -1; parpadeo.siguiente = 2 + Math.random() * 4; }
    }

    // la boca, mientras suena la voz
    const quiereBoca = hablando
      ? 0.18 + Math.abs(onda(t, 0.2)) * 0.5 + Math.abs(onda(t, 0.33, 0.3)) * 0.18
      : 0;
    boca = lerp(boca, quiereBoca, suave(dt, 16));

    const quiereSonrisa = mood === 'party' ? 1 : mood === 'skip' ? 0.05 : mood === 'do' ? 0.45 : 0.6;
    sonrisa = lerp(sonrisa, quiereSonrisa, suave(dt, 3));
    pena = lerp(pena, mood === 'skip' ? 0.4 : 0, suave(dt, 3));

    // en VRoid, «happy» (joy) abre la boca de par en par: sólo para la fiesta.
    // Para el resto, «relaxed» (fun), que es una sonrisa con la boca cerrada.
    const fiesta = mood === 'party' ? 1 : 0;
    fija(em, 'happy', fiesta * sonrisa * (1 - boca * 0.5));
    fija(em, 'relaxed', (1 - fiesta) * sonrisa * (1 - boca * 0.7));
    fija(em, 'sad', pena);
    fija(em, 'blink', mood === 'party' ? 0 : blink * (1 - sonrisa * 0.3));
    fija(em, 'aa', boca);
    fija(em, 'oh', boca * 0.2);
  }

  function fija(em, nombre, v) {
    try { em.setValue(nombre, v); } catch (e) { /* ese modelo no tiene esa expresión */ }
  }

  function bucle() {
    if (pausado) { raf = 0; return; }
    raf = requestAnimationFrame(bucle);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (actual) {
      const hips = hueso('hips');
      if (actual.mixer) actual.mixer.update(dt);      // 1. el reposo capturado
      aplicaPostura(dt);                              // 2. la postura del momento
      aplicaVida(t, dt);                              //    y lo que se suma encima
      aplicaCara(dt, t);                              // 3. la cara
      actual.vrm.update(dt);
      void hips;
    }
    if (suelo) suelo.material.opacity = 0.12 + (onda(t, 3.2) * 0.5 + 0.5) * 0.08;
    if (fiesta) fiesta.actualiza(dt);
    renderer.render(scene, camera);
  }

  /* ───────── lo que le pide Stage ───────── */
  return {
    async arranca() {
      init();
      await cargaReposo();
      await cargaChica('yuna');                       // la primera, precargada
      // y lo demás, en segundo plano. PRIMERO los muebles (0,6 MB): si van detrás
      // de los modelos (9 MB cada uno) la primera llamada sale sin habitación
      precargaTodo(cargadorMuebles())
        .then(() => Promise.all([cargaChica('nari'), cargaChica('soomi')]))
        .catch(() => {});
    },

    mount(el) {
      host = el;
      if (renderer.domElement.parentNode !== host) {
        host.innerHTML = '';
        host.appendChild(renderer.domElement);
      }
      encaja();
    },

    setCharacter(c) { return muestra(c.id).catch(e => console.warn('[3d] no cargó', c.id, e)); },

    setMood(m, opts) {
      mood = m;
      moodOpts = opts || {};
      moodDesde = performance.now();
      ponObjeto(objetoPara(m));
      if (m === 'party' && fiesta) fiesta.empieza(salaActual ? salaActual.sala.fx : 'confetti');
      else if (m === 'ring' && fiesta) fiesta.para();
    },

    setScene(escena) { return ponHabitacion(escena); },

    duration(m) { return DURACION[m] || 0; },

    talking(on) { hablando = !!on; },

    pause() { pausado = true; if (raf) { cancelAnimationFrame(raf); raf = 0; } },

    resume() {
      if (!pausado) return;
      pausado = false;
      clock.getDelta();
      encaja();
      if (!raf) raf = requestAnimationFrame(bucle);
    },

    // para la página de pruebas: precargar las otras dos
    precarga(ids) { return Promise.all(ids.map(cargaChica)); }
  };
}

/* ───────── arranque: si todo va bien, el 3D sustituye al 2D ───────── */
(async function () {
  if (!hayWebGL() || !window.Stage) return;
  try {
    const s3d = crea();
    await s3d.arranca();
    window.Stage.register3D(s3d);
    window.__stage3d = s3d;
    console.info('[3d] listo');
  } catch (e) {
    console.warn('[3d] no se pudo cargar; sigue el 2D:', e);
  }
})();
