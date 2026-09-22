/* Kids Routines — el hilo de la app: casa → llamada → actividad → celebración. */

const App = (function () {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  let period = guessPeriod();
  let routine = null;          // rutina en curso
  let caller = null;           // personaje que llama
  let token = 0;               // corta secuencias antiguas
  let ringTimeout = null;
  let objectUrls = [];         // los liberamos al re-pintar
  let wakeLock = null;

  /* ───────── utilidades ───────── */

  function guessPeriod() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  /* resalta la palabra clave dentro de la frase */
  function highlight(text, word) {
    const safe = esc(text);
    if (!word) return safe;
    const w = esc(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(new RegExp('(' + w + ')', 'i'), '<em>$1</em>');
  }

  function freeUrls() {
    objectUrls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} });
    objectUrls = [];
  }

  function urlFor(blob) {
    const u = URL.createObjectURL(blob);
    objectUrls.push(u);
    return u;
  }

  function praise() { return PRAISE[(Math.random() * PRAISE.length) | 0]; }

  /* pinta un personaje dentro de un hueco: el dibujo de la casa, o el retrato
     que los padres hayan cargado para ella (que manda, y se queda en el móvil) */
  function paintCharacter(el, c, opts) {
    if (!el) return Promise.resolve();
    el.innerHTML = Characters.svg(c, opts || {});
    return Media.get('char:' + c.id, 'image').then(blob => {
      if (blob && el.isConnected) {
        el.innerHTML = '<img class="portrait" alt="' + esc(c.name) + '" src="' + urlFor(blob) + '">';
      }
    });
  }

  function childName() { return (Store.getSettings().childName || '').trim(); }

  async function keepAwake(on) {
    try {
      if (on && 'wakeLock' in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (!on && wakeLock) {
        await wakeLock.release(); wakeLock = null;
      }
    } catch (e) { /* no pasa nada si el móvil no lo permite */ }
  }

  /* ───────── navegación entre pantallas ───────── */

  function show(id) {
    $$('.screen').forEach(s => s.classList.toggle('show', s.id === id));
    if (id !== 'screen-show') Confetti.stop();
    if (id === 'screen-home') keepAwake(false); else keepAwake(true);
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
  }

  function goHome() {
    token++;
    Voice.stop();
    Sound.stopRing();
    clearTimeout(ringTimeout);
    stopVideos();
    Stage.pause();                 // en casa el 3D no gasta batería
    renderHome();
    show('screen-home');
  }

  function stopVideos() {
    ['showVideo'].forEach(id => {
      const v = document.getElementById(id);
      if (v) { try { v.pause(); } catch (e) {} v.hidden = true; v.removeAttribute('src'); v.load && v.load(); }
    });
  }

  /* ───────── casa ───────── */

  function renderHome() {
    freeUrls();
    const s = Store.getSettings();
    const p = Store.getProgress();
    const name = childName();

    $('#helloLine').textContent = PERIOD_HELLO[period] + (name ? ', ' + name : '') + '!';
    $('#starsCount').textContent = p.done.length;

    $$('#periodTabs .period').forEach(b => b.classList.toggle('on', b.dataset.period === period));

    // el grupo saludando
    const band = $('#bandStage');
    band.innerHTML = '';
    Characters.LIST.forEach(c => {
      const slot = document.createElement('div');
      slot.className = 'band-slot';
      band.appendChild(slot);
      paintCharacter(slot, c, { pose: 'idle' });
    });

    const list = Store.getRoutines().filter(r => r.enabled !== false && r.period === period);
    const grid = $('#cardGrid');
    grid.innerHTML = '';

    if (!list.length) {
      grid.innerHTML = '<p class="home-foot" style="grid-column:1/-1">No routines here yet.</p>';
    }

    list.forEach((r, i) => {
      const done = p.done.indexOf(r.id) !== -1;
      const btn = document.createElement('button');
      btn.className = 'card c' + (i % 5) + (done ? ' done' : '');
      btn.innerHTML =
        (done ? '<span class="tick">⭐</span>' : '') +
        '<span class="art" data-art="' + esc(r.id) + '">' + esc(r.emoji || '⭐') + '</span>' +
        '<span class="name">' + esc(r.name) + '</span>' +
        (r.word ? '<span class="word">' + esc(r.word) + '</span>' : '');
      btn.addEventListener('click', () => startCall(r));
      grid.appendChild(btn);

      // imagen propia, si la hay
      Media.get(r.id, 'image').then(blob => {
        if (!blob) return;
        const art = grid.querySelector('[data-art="' + CSS.escape(r.id) + '"]');
        if (art) art.innerHTML = '<img alt="" src="' + urlFor(blob) + '">';
      });
    });

    const total = list.length;
    const doneHere = list.filter(r => p.done.indexOf(r.id) !== -1).length;
    // si no hay ni audios grabados ni voz inglesa, la app calla: hay que decirlo
    if (!Voice.canSpeak()) {
      $('#homeFoot').innerHTML = '<span class="warn-line">⚠️ Sin voz inglesa instalada: ' +
        'las chicas no hablan. Ajustes de Android › Idiomas › Texto a voz › instalar inglés.</span>';
      return;
    }
    $('#homeFoot').textContent = total
      ? (doneHere === total ? 'All done! ⭐ ' + PERIOD_LABEL[period] + ' complete!' : doneHere + ' of ' + total + ' done')
      : '';
  }

  /* ───────── la llamada y la fiesta ─────────
     Como en Kids&Us: la chica llama (rin rin), dice lo que toca, y esperan dos
     botones grandes. «Congratulations!» = lo ha hecho → fiesta y estrella.
     «I'll try later» = todavía no → se despide y vuelve a casa, sin reñir.
     Todo pasa en la misma escena, con la chica en primer plano. */

  const FRASE_FIESTA = 'Congratulations!';
  const FRASE_LUEGO = 'OK! See you later!';

  function pickCaller() {
    const s = Store.getSettings();
    return s.character && s.character !== 'random'
      ? Characters.byId(s.character)
      : Characters.random(caller && caller.id);
  }

  function estado(e) { $('#screen-show').dataset.state = e; }

  /* dice una frase: la enseña en el bocadillo y mueve la boca mientras suena */
  async function say(text) {
    const my = token;
    if (!text) return true;
    $('#bubble').textContent = text;
    Stage.talking(true);
    await Voice.say(text, caller ? { pitch: caller.pitch, rate: caller.rate } : null);
    Stage.talking(false);
    return my === token;
  }

  async function playVideoBlob(blob) {
    const el = $('#showVideo');
    return new Promise(resolve => {
      el.src = urlFor(blob);
      el.hidden = false;
      el.onended = resolve;
      el.onerror = resolve;
      el.play().catch(resolve);
    });
  }

  function startCall(r) {
    token++;
    const my = token;
    routine = r;
    caller = pickCaller();
    Voice.pack.setCharacter(caller.id);      // cada chica, con su voz
    Sound.unlock();

    // los audios de esta llamada, preparados para que no haya esperas
    Voice.pack.warm([caller.hello, r.phrase, FRASE_FIESTA, r.done, FRASE_LUEGO], caller.id);

    estado('ringing');
    $('#callerName').textContent = caller.name;
    $('#callState').textContent = 'is calling…';
    $('#bubble').textContent = '';
    $('#bigActions').hidden = true;
    $('#partyText').hidden = true;
    stopVideos();

    show('screen-show');
    Stage.mount($('#stage'));
    Stage.resume();
    Stage.setMood('ring');
    $('#stage').classList.add('cargando');

    // esperar a que estén su chica y su habitación (llama DESDE el sitio de la
    // rutina). Con todo ya en el móvil es inmediato; la primera vez puede tardar,
    // y no queremos que llame una pantalla vacía. Como mucho, 8 segundos.
    const listo = Promise.all([Stage.setCharacter(caller), Stage.setScene(Scenes.forRoutine(r))]);
    const tope = new Promise(res => setTimeout(res, 8000));
    Promise.race([listo, tope]).then(() => {
      if (my !== token) return;
      $('#stage').classList.remove('cargando');
      Sound.startRing();
      // rin rin… y habla. No hay que descolgar: como en Kids&Us, empieza sola.
      ringTimeout = setTimeout(() => { if (my === token) connect(); }, 3000);
    });
  }

  async function connect() {
    const my = token;
    const r = routine, c = caller;
    Sound.stopRing();
    Sound.pickUp();
    estado('talking');
    $('#callState').textContent = '';

    const [voiceBlob, videoBlob] = await Promise.all([
      Media.get(r.id, 'voice'), Media.get(r.id, 'callVideo')
    ]);
    if (my !== token) return;

    if (videoBlob) {
      // vídeo propio de casa: manda él
      await playVideoBlob(videoBlob);
      if (my !== token) return;
      stopVideos();
    } else {
      Stage.setMood('talk');
      const name = childName();
      const saludo = name ? 'Hello, ' + name + '! It\'s me, ' + c.name + '!' : c.hello;
      if (!(await say(Voice.canSay(saludo) ? saludo : c.hello))) return;
      await Voice.pause(180);
      if (my !== token) return;

      if (voiceBlob) {
        // la voz grabada en casa sustituye a la de la chica
        $('#bubble').textContent = r.phrase;
        Stage.talking(true);
        await Voice.playBlob(voiceBlob);
        Stage.talking(false);
      } else {
        if (!(await say(r.phrase))) return;
      }
      if (my !== token) return;
    }

    Stage.setMood('wait');
    estado('waiting');
    $('#bigActions').hidden = false;
  }

  /* lo ha hecho: ¡fiesta! */
  async function celebrate() {
    token++;
    const my = token;
    const r = routine;

    Store.markDone(r.id);
    const p = Store.getProgress();
    const stars = p.done.length;

    // primero se la ve HACIENDO la tarea y terminándola; luego, la fiesta
    $('#bigActions').hidden = true;
    $('#bubble').textContent = '';
    estado('doing');
    Stage.setMood('do', { scene: Scenes.forRoutine(r) });
    await Voice.pause(Stage.duration('do'));
    if (my !== token) return;

    estado('party');
    $('#partySub').textContent = r.done || '';
    $('#partyStars').textContent = '⭐'.repeat(Math.max(1, Math.min(stars, 5)));
    $('#partyText').hidden = false;
    Stage.setMood('party');
    Confetti.start(4200);
    Sound.cheer();

    const winVideo = await Media.get(r.id, 'winVideo');
    if (my !== token) return;
    if (winVideo) {
      await playVideoBlob(winVideo);
      if (my !== token) return;
      stopVideos();
    }

    if (!(await say(FRASE_FIESTA))) return;
    if (!(await say(r.done))) return;
    $('#bubble').textContent = '';

    // ¿ha terminado todo el tramo del día? Fiesta doble.
    const all = Store.getRoutines().filter(x => x.enabled !== false && x.period === r.period);
    if (all.length && all.every(x => p.done.indexOf(x.id) !== -1)) {
      Confetti.start(3000);
      Sound.cheer();
      if (!(await say('Wow! You finished all your ' + PERIOD_LABEL[r.period].toLowerCase() + ' routines!'))) return;
      $('#bubble').textContent = '';
    }

    // y vuelve sola a casa, con la estrella puesta
    setTimeout(() => { if (my === token) goHome(); }, 3500);
  }

  /* todavía no: se despide con cariño y vuelve a casa (sin estrella, sin reñir) */
  async function tryLater() {
    token++;
    const my = token;
    $('#bigActions').hidden = true;
    $('#bubble').textContent = '';

    // la empieza, la deja a medias y se encoge de hombros: sin reñir
    estado('skipping');
    Stage.setMood('skip', { scene: Scenes.forRoutine(routine) });
    await Voice.pause(Stage.duration('skip'));
    if (my !== token) return;

    estado('bye');
    Stage.setMood('bye');
    await say(FRASE_LUEGO);
    if (my !== token) return;
    setTimeout(() => { if (my === token) goHome(); }, 700);
  }

  /* ───────── comprobar los audios ─────────
     Construye TODAS las frases que la app puede decir y mira cuáles no tienen
     clip grabado. Existe porque una frase sin clip no falla: simplemente se oye
     con la voz del móvil, o no se oye nada. Eso no se ve mirando el código. */
  function auditVoice() {
    const lineas = [];
    const add = t => { if (t && lineas.indexOf(t) === -1) lineas.push(t); };

    Characters.LIST.forEach(c => add(c.hello));
    const rutinas = Store.getRoutines();
    rutinas.forEach(r => { add(r.phrase); add(r.done); });
    add(FRASE_FIESTA);
    add(FRASE_LUEGO);
    ['morning', 'afternoon', 'evening'].forEach(per =>
      add('Wow! You finished all your ' + PERIOD_LABEL[per].toLowerCase() + ' routines!'));

    const faltan = lineas.filter(t => !Voice.pack.has(t));
    return { total: lineas.length, faltan: faltan, clips: lineas.length - faltan.length };
  }

  /* ───────── arranque ───────── */

  function bind() {
    $('#periodTabs').addEventListener('click', e => {
      const b = e.target.closest('.period');
      if (!b) return;
      period = b.dataset.period;
      Sound.unlock();
      renderHome();
    });

    $('#showBack').addEventListener('click', goHome);
    $('#congratsBtn').addEventListener('click', celebrate);
    $('#laterBtn').addEventListener('click', tryLater);

    // la rueda de padres se abre manteniéndola pulsada (una niña no lo hace sin querer)
    const gear = $('#gearBtn');
    let holdTimer = null, holdStart = 0, holdRaf = 0;
    const cancelHold = () => {
      clearTimeout(holdTimer); cancelAnimationFrame(holdRaf);
      gear.style.setProperty('--hold', '0deg');
    };
    const tickHold = () => {
      const pct = Math.min(1, (Date.now() - holdStart) / 1600);
      gear.style.setProperty('--hold', (pct * 360) + 'deg');
      if (pct < 1) holdRaf = requestAnimationFrame(tickHold);
    };
    gear.addEventListener('pointerdown', () => {
      Sound.unlock();
      holdStart = Date.now();
      holdRaf = requestAnimationFrame(tickHold);
      holdTimer = setTimeout(() => { cancelHold(); Parents.open(); }, 1600);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => gear.addEventListener(ev, cancelHold));

    // si el móvil se bloquea o cambiamos de app, callamos
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { token++; Voice.stop(); Sound.stopRing(); Stage.pause(); }
      else Stage.resume();
    });

    document.addEventListener('pointerdown', () => {
      Sound.unlock();
      pideHorizontal();
    }, { once: true });
  }


  /* pide horizontal al móvil. Es una petición, no una orden: si la rechaza,
     queda el aviso de «gira el móvil» y la app funciona igual. */
  function pideHorizontal() {
    try {
      const o = screen.orientation;
      if (o && o.lock) o.lock('landscape').catch(() => {});
    } catch (e) { /* móvil que no lo permite */ }
  }

  function init() {
    const s = Store.getSettings();
    Voice.configure({ voiceURI: s.voiceURI, rate: s.rate, pitch: s.pitch, source: s.voiceSource });
    bind();
    renderHome();
    show('screen-home');

    // los audios grabados, si los hay, mandan sobre la voz del móvil
    Voice.pack.load().then(ok => { if (ok) renderHome(); });

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(e => console.warn('[sw]', e));
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return { goHome, renderHome, show, auditVoice, get period() { return period; } };
})();
