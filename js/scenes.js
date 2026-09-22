/* Kids Routines — las escenas: la chica HACIENDO la rutina.
   Cada rutina tiene una escena con tres piezas:
     · set()    el decorado que va detrás (lavabo, mesa, bañera, cama…)
     · prop()   lo que lleva en la mano, dibujado DENTRO del brazo derecho
                para que se mueva con él
     · action() la clase CSS que le da el gesto (cepillar, frotar, comer…)
   Las animaciones de cada gesto están en css/app.css, bloque «gestos». */

const Scenes = (function () {

  /* qué escena le toca a cada rutina; si no está aquí, se deduce del id */
  const BY_ID = {
    wake: 'wake', 'make-bed': 'bed', 'toilet-am': 'toilet', 'toilet-pm': 'toilet',
    'hands-am': 'hands', 'hands-pm': 'hands', 'hands-eve': 'hands',
    face: 'hands', 'teeth-am': 'teeth', 'teeth-pm': 'teeth',
    breakfast: 'eat', lunch: 'eat', dinner: 'eat', snack: 'snack',
    dress: 'dress', hair: 'hair', 'sun-cream': 'dress',
    'school-bag': 'school', school: 'school', homework: 'desk',
    book: 'book', story: 'book', dance: 'stage', 'play-outside': 'park',
    tidy: 'tidy', 'tidy-pm': 'tidy', help: 'tidy', 'clothes-away': 'tidy',
    'clear-table': 'eat', pet: 'pet', water: 'drink', 'screen-off': 'stage',
    bath: 'bath', shower: 'bath', pyjamas: 'dress', 'bag-tomorrow': 'school',
    hug: 'stage', bed: 'sleep'
  };

  function forRoutine(r) {
    if (!r) return 'stage';
    if (r.scene) return r.scene;
    return BY_ID[r.id] || 'stage';
  }

  /* ───────── decorados (van detrás, en coordenadas 0–200 × 0–120) ───────── */

  const SETS = {
    hands: `
      <rect x="58" y="62" width="84" height="12" rx="4" fill="#cfd8ea"/>
      <rect x="66" y="74" width="68" height="34" rx="6" fill="#eef3fb"/>
      <rect x="94" y="40" width="7" height="24" rx="3" fill="#b9c3d6"/>
      <path d="M97,40 q0,-12 14,-12 l0,7 q-7,0 -7,7 Z" fill="#b9c3d6"/>
      <g class="drops">
        <ellipse cx="99" cy="80" rx="3" ry="5" fill="#8fd7ff" opacity=".9"/>
        <ellipse cx="104" cy="92" rx="2.4" ry="4" fill="#8fd7ff" opacity=".7"/>
      </g>
      <rect x="120" y="18" width="46" height="40" rx="8" fill="#dbe6f7" opacity=".55"/>`,
    teeth: `
      <rect x="56" y="64" width="88" height="12" rx="4" fill="#cfd8ea"/>
      <rect x="64" y="76" width="72" height="32" rx="6" fill="#eef3fb"/>
      <rect x="118" y="14" width="52" height="44" rx="9" fill="#dbe6f7" opacity=".5"/>
      <rect x="40" y="40" width="12" height="26" rx="4" fill="#7de0b0"/>
      <rect x="42" y="34" width="8" height="8" rx="3" fill="#ffffff"/>`,
    bath: `
      <path d="M40,56 h120 v30 q0,20 -22,20 h-76 q-22,0 -22,-20 Z" fill="#dff1ff"/>
      <path d="M44,70 h112 v16 q0,16 -18,16 h-76 q-18,0 -18,-16 Z" fill="#9fdcff"/>
      <circle cx="70" cy="60" r="9" fill="#ffffff" opacity=".85"/>
      <circle cx="92" cy="52" r="7" fill="#ffffff" opacity=".7"/>
      <circle cx="116" cy="58" r="10" fill="#ffffff" opacity=".8"/>
      <circle cx="138" cy="50" r="6" fill="#ffffff" opacity=".6"/>`,
    eat: `
      <rect x="34" y="66" width="132" height="10" rx="4" fill="#c98b5e"/>
      <rect x="44" y="76" width="10" height="34" rx="3" fill="#a8703f"/>
      <rect x="146" y="76" width="10" height="34" rx="3" fill="#a8703f"/>
      <ellipse cx="100" cy="64" rx="26" ry="8" fill="#ffffff"/>
      <ellipse cx="100" cy="62" rx="18" ry="5" fill="#ffd9a8"/>
      <rect x="132" y="50" width="12" height="16" rx="3" fill="#bfe9ff"/>`,
    snack: `
      <rect x="34" y="70" width="132" height="10" rx="4" fill="#c98b5e"/>
      <circle cx="96" cy="60" r="11" fill="#ff6b6b"/>
      <path d="M96,49 q3,-6 8,-7 q-3,5 -3,8 Z" fill="#7dd87d"/>
      <ellipse cx="120" cy="64" rx="10" ry="7" fill="#ffd447"/>`,
    drink: `
      <rect x="34" y="72" width="132" height="10" rx="4" fill="#c98b5e"/>
      <path d="M88,40 h24 l-3,32 h-18 Z" fill="#cfe9ff" opacity=".9"/>
      <path d="M90,54 h20 l-2,18 h-16 Z" fill="#6fc7ff"/>`,
    dress: `
      <rect x="44" y="14" width="112" height="94" rx="8" fill="#b98a5e" opacity=".55"/>
      <rect x="52" y="22" width="46" height="78" rx="5" fill="#8a5f3c" opacity=".6"/>
      <rect x="102" y="22" width="46" height="78" rx="5" fill="#8a5f3c" opacity=".6"/>
      <path d="M58,34 h34 l-6,26 h-22 Z" fill="#ffd1e8"/>
      <path d="M110,34 h30 l-4,30 h-22 Z" fill="#c9e6ff"/>`,
    hair: `
      <rect x="120" y="16" width="54" height="52" rx="10" fill="#dbe6f7" opacity=".5"/>
      <rect x="40" y="66" width="120" height="10" rx="4" fill="#cfd8ea"/>
      <rect x="52" y="52" width="10" height="14" rx="3" fill="#ff8fc0"/>`,
    tidy: `
      <rect x="112" y="58" width="62" height="50" rx="8" fill="#c98b5e"/>
      <rect x="112" y="52" width="62" height="12" rx="5" fill="#a8703f"/>
      <circle cx="132" cy="46" r="10" fill="#ffd447"/>
      <rect x="146" y="38" width="16" height="16" rx="4" fill="#7ee0ff"/>
      <circle cx="44" cy="100" r="9" fill="#ff8fc0"/>`,
    book: `
      <rect x="120" y="30" width="56" height="78" rx="6" fill="#8a5f3c" opacity=".55"/>
      <rect x="126" y="38" width="44" height="8" rx="3" fill="#ffd447"/>
      <rect x="126" y="52" width="44" height="8" rx="3" fill="#7ee0ff"/>
      <rect x="126" y="66" width="44" height="8" rx="3" fill="#ff8fc0"/>`,
    desk: `
      <rect x="34" y="62" width="132" height="10" rx="4" fill="#c98b5e"/>
      <rect x="44" y="72" width="10" height="38" rx="3" fill="#a8703f"/>
      <rect x="146" y="72" width="10" height="38" rx="3" fill="#a8703f"/>
      <rect x="74" y="50" width="38" height="12" rx="2" fill="#ffffff"/>
      <rect x="122" y="44" width="10" height="18" rx="3" fill="#7ee0ff"/>`,
    school: `
      <path d="M126,52 h44 v46 q0,8 -8,8 h-28 q-8,0 -8,-8 Z" fill="#7b4bd8"/>
      <path d="M132,44 h32 v12 h-32 Z" fill="#5c33ad"/>
      <rect x="134" y="72" width="28" height="16" rx="4" fill="#ffd447"/>
      <rect x="30" y="34" width="44" height="30" rx="5" fill="#ffffff" opacity=".35"/>`,
    park: `
      <circle cx="42" cy="34" r="20" fill="#ffd447" opacity=".8"/>
      <path d="M120,104 q0,-40 22,-40 q22,0 22,40 Z" fill="#7dd87d"/>
      <rect x="138" y="88" width="10" height="20" fill="#8a5f3c"/>
      <path d="M20,104 q14,-20 30,0 Z" fill="#7dd87d" opacity=".7"/>`,
    pet: `
      <ellipse cx="140" cy="96" rx="26" ry="16" fill="#c98b5e"/>
      <circle cx="120" cy="86" r="13" fill="#c98b5e"/>
      <ellipse cx="112" cy="78" rx="5" ry="8" fill="#a8703f"/>
      <circle cx="116" cy="86" r="2.4" fill="#2a1338"/>
      <ellipse cx="72" cy="104" rx="16" ry="6" fill="#dbe6f7"/>`,
    toilet: `
      <rect x="120" y="40" width="38" height="30" rx="6" fill="#eef3fb"/>
      <path d="M112,70 h54 v18 q0,14 -16,14 h-22 q-16,0 -16,-14 Z" fill="#ffffff"/>
      <rect x="118" y="66" width="42" height="8" rx="4" fill="#dbe6f7"/>
      <circle cx="60" cy="52" r="12" fill="#ffffff"/>`,
    bed: `
      <rect x="96" y="66" width="82" height="34" rx="8" fill="#8a5f3c"/>
      <rect x="100" y="58" width="74" height="16" rx="8" fill="#dbe6f7"/>
      <rect x="96" y="46" width="10" height="54" rx="4" fill="#a8703f"/>
      <rect x="168" y="46" width="10" height="54" rx="4" fill="#a8703f"/>`,
    sleep: `
      <rect x="40" y="62" width="130" height="42" rx="10" fill="#6a4fd0" opacity=".55"/>
      <rect x="46" y="52" width="48" height="20" rx="9" fill="#eef3fb"/>
      <circle cx="160" cy="26" r="14" fill="#ffd447" opacity=".85"/>
      <circle cx="154" cy="22" r="12" fill="#2a1052"/>`,
    wake: `
      <rect x="40" y="66" width="130" height="38" rx="10" fill="#6a4fd0" opacity=".5"/>
      <rect x="46" y="56" width="46" height="18" rx="8" fill="#eef3fb"/>
      <circle cx="160" cy="28" r="16" fill="#ffd447"/>
      <g stroke="#ffd447" stroke-width="3" stroke-linecap="round">
        <path d="M160,4 v8"/><path d="M182,28 h8"/><path d="M144,12 l5,5"/><path d="M176,12 l-5,5"/>
      </g>`,
    stage: `
      <circle cx="40" cy="30" r="12" fill="#ff4fa3" opacity=".35"/>
      <circle cx="160" cy="26" r="14" fill="#3fe0ff" opacity=".3"/>
      <circle cx="100" cy="20" r="10" fill="#ffd447" opacity=".3"/>`
  };

  /* ───────── lo que lleva en la mano (va dentro del brazo derecho) ───────── */

  const PROPS = {
    teeth: `<rect x="128" y="150" width="6" height="26" rx="3" fill="#7de0b0"/>
            <rect x="126" y="144" width="10" height="8" rx="3" fill="#ffffff"/>`,
    hands: `<rect x="126" y="176" width="12" height="9" rx="4" fill="#ffe9a8"/>
            <circle cx="132" cy="170" r="4" fill="#ffffff" opacity=".9"/>`,
    bath: `<ellipse cx="132" cy="176" rx="9" ry="7" fill="#ffd1e8"/>
           <circle cx="126" cy="168" r="4" fill="#ffffff" opacity=".85"/>`,
    eat: `<rect x="130" y="158" width="4" height="22" rx="2" fill="#cfd8ea"/>
          <ellipse cx="132" cy="156" rx="6" ry="4" fill="#cfd8ea"/>`,
    snack: `<circle cx="132" cy="176" r="8" fill="#ff6b6b"/>
            <path d="M132,168 q2,-5 6,-6 q-2,4 -2,6 Z" fill="#7dd87d"/>`,
    drink: `<path d="M126,166 h13 l-2,18 h-9 Z" fill="#cfe9ff"/>
            <path d="M127,172 h11 l-1,12 h-9 Z" fill="#6fc7ff"/>`,
    hair: `<rect x="128" y="158" width="7" height="20" rx="3" fill="#ff8fc0"/>
           <rect x="125" y="152" width="13" height="8" rx="3" fill="#ffffff"/>`,
    book: `<path d="M120,172 h24 v16 h-24 Z" fill="#ffd447"/>
           <path d="M132,172 v16" stroke="#c99a10" stroke-width="1.5"/>`,
    desk: `<rect x="130" y="160" width="4" height="22" rx="2" fill="#ffd447"/>
           <path d="M130,182 h4 l-2,5 Z" fill="#2a1338"/>`,
    tidy: `<circle cx="132" cy="178" r="8" fill="#7ee0ff"/>
           ${''}`,
    school: `<path d="M124,164 h20 v22 q0,4 -4,4 h-12 q-4,0 -4,-4 Z" fill="#7b4bd8"/>
             <rect x="128" y="172" width="12" height="7" rx="2" fill="#ffd447"/>`,
    dress: `<path d="M122,168 q10,-6 20,0 l-3,16 h-14 Z" fill="#ffd1e8"/>`,
    toilet: `<rect x="126" y="172" width="12" height="12" rx="3" fill="#ffffff"/>`,
    pet: `<ellipse cx="132" cy="176" rx="9" ry="6" fill="#eef3fb"/>`,
    sleep: '', bed: '', wake: '', park: '', stage: ''
  };

  /* ───────── el gesto (clase CSS) ───────── */

  const ACTIONS = {
    teeth: 'do-brush', hair: 'do-brush',
    hands: 'do-scrub', bath: 'do-scrub', toilet: 'do-scrub',
    eat: 'do-eat', snack: 'do-eat', drink: 'do-eat',
    tidy: 'do-pickup', school: 'do-pickup', dress: 'do-pickup', pet: 'do-pickup',
    book: 'do-read', desk: 'do-read',
    sleep: 'do-sleep', bed: 'do-sleep',
    wake: 'do-stretch', park: 'do-jump', stage: 'dance'
  };

  /* añadir un escenario nuevo es UNA llamada, desde cualquier fichero:
       Scenes.register('garden', { set: '<svg…>', prop: '<rect…>', action: 'do-pickup' });
     El decorado se dibuja en un lienzo 200×120 (el suelo, abajo del todo). */
  function register(id, def) {
    if (!id || !def) return;
    if (def.set !== undefined) SETS[id] = def.set;
    if (def.prop !== undefined) PROPS[id] = def.prop;
    if (def.action !== undefined) ACTIONS[id] = def.action;
    if (def.routines) def.routines.forEach(r => { BY_ID[r] = id; });
  }

  /* los escenarios que hay, para ofrecerlos en la zona de padres */
  function list() { return Object.keys(SETS).sort(); }

  function set(scene) {
    const body = SETS[scene] || SETS.stage;
    return '<svg class="scene-set" viewBox="0 0 200 120" preserveAspectRatio="xMidYMax meet" ' +
      'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + body + '</svg>';
  }

  function prop(scene) { return PROPS[scene] || ''; }
  function action(scene) { return ACTIONS[scene] || ''; }

  return { forRoutine, set, prop, action, register, list, SETS };
})();
