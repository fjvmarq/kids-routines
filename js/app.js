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
  let stepIndex = 0;

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
    if (id !== 'screen-win') Confetti.stop();
    if (id === 'screen-home') keepAwake(false); else keepAwake(true);
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
  }

  function goHome() {
    token++;
    Voice.stop();
    Sound.stopRing();
    clearTimeout(ringTimeout);
    stopVideos();
    renderHome();
    show('screen-home');
  }

  function stopVideos() {
    ['callVideo', 'winVideo'].forEach(id => {
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
    // sin voz inglesa la app calla: hay que decírselo a los padres
    if (!Voice.hasEnglish()) {
      $('#homeFoot').innerHTML = '<span class="warn-line">⚠️ Sin voz inglesa instalada: ' +
        'las chicas no hablan. Ajustes de Android › Idiomas › Texto a voz › instalar inglés.</span>';
      return;
    }
    $('#homeFoot').textContent = total
      ? (doneHere === total ? 'All done! ⭐ ' + PERIOD_LABEL[period] + ' complete!' : doneHere + ' of ' + total + ' done')
      : '';
  }

  /* ───────── la llamada ───────── */

  function pickCaller() {
    const s = Store.getSettings();
    return s.character && s.character !== 'random'
      ? Characters.byId(s.character)
      : Characters.random(caller && caller.id);
  }

  function startCall(r) {
    token++;
    const my = token;
    routine = r;
    caller = pickCaller();
    Sound.unlock();

    $('#callerName').textContent = caller.name;
    paintCharacter($('#callerAvatar'), caller, { pose: 'idle' });
    $('#ringing').hidden = false;
    $('#incall').hidden = true;
    $('#callActions').hidden = true;
    $('#turnBox').hidden = true;
    $('#callBubble').innerHTML = '';
    stopVideos();

    show('screen-call');
    Sound.startRing();
    ringTimeout = setTimeout(() => { if (my === token) answer(); }, 7000);
  }

  function answer() {
    clearTimeout(ringTimeout);
    Sound.stopRing();
    Sound.pickUp();
    $('#ringing').hidden = true;
    $('#incall').hidden = false;
    $('#incallName').textContent = caller.name;
    const scene = Scenes.forRoutine(routine);
    $('#callSet').innerHTML = Scenes.set(scene);
    paintCharacter($('#callStage'), caller, { pose: 'idle', mic: true });
    runCallScript();
  }

  /* mientras habla mueve la boca y se queda quieta; si calla, vuelve a pasearse */
  function mouth(on) {
    const svg = $('#callStage .kchar');
    if (svg) svg.classList.toggle('speaking', !!on);
    $('#callStage').classList.toggle('talking', !!on);
  }

  /* dice una frase moviendo la boca y enseñándola en el bocadillo */
  async function speak(text, bubbleHtml) {
    const my = token;
    $('#callBubble').innerHTML = bubbleHtml === undefined ? esc(text) : bubbleHtml;
    mouth(true);
    await Voice.say(text, caller ? { pitch: caller.pitch, rate: caller.rate } : null);
    mouth(false);
    return my === token;
  }

  async function playVideoBlob(el, blob) {
    return new Promise(resolve => {
      el.src = urlFor(blob);
      el.hidden = false;
      el.onended = resolve;
      el.onerror = resolve;
      el.play().catch(resolve);
    });
  }

  async function runCallScript() {
    const my = token;
    const r = routine, c = caller;
    const name = childName();

    const [voiceBlob, videoBlob] = await Promise.all([
      Media.get(r.id, 'voice'), Media.get(r.id, 'callVideo')
    ]);
    if (my !== token) return;

    if (videoBlob) {
      // vídeo propio de papá y mamá: manda él
      $('#callStage').style.display = 'none';
      $('#callBubble').innerHTML = '';
      await playVideoBlob($('#callVideo'), videoBlob);
      if (my !== token) return;
    } else {
      $('#callStage').style.display = '';
      if (!(await speak(name ? 'Hello, ' + name + '! It\'s me, ' + c.name + '!' : c.hello))) return;
      await Voice.pause(200);

      if (voiceBlob) {
        // la voz grabada en casa sustituye a la del móvil
        $('#callBubble').innerHTML = highlight(r.phrase, r.word);
        mouth(true);
        await Voice.playBlob(voiceBlob);
        mouth(false);
      } else {
        if (!(await speak(r.phrase, highlight(r.phrase, r.word)))) return;
      }
      if (my !== token) return;
    }

    // «Say it with me» — la parte que enseña inglés
    if (r.word) {
      await Voice.pause(250);
      if (!(await speak('Say it with me. ' + r.word + '!',
        '<em>' + esc(r.word) + '</em>'))) return;
      $('#turnBox').hidden = false;
      await Voice.pause(2600);
      $('#turnBox').hidden = true;
      if (my !== token) return;
      Sound.pop();
      if (!(await speak(r.word + '! ' + praise(), '<em>' + esc(r.word) + '</em> ⭐'))) return;
    }

    if (my !== token) return;
    const hasActivity = (r.steps && r.steps.length) || r.count > 0;
    $('#letsGoBtn').hidden = !hasActivity;
    $('#callActions').hidden = false;
    await speak(hasActivity ? "Let's go!" : 'Off you go!', highlight(r.phrase, r.word));
  }

  /* ───────── la actividad (pasos y cuenta en inglés) ───────── */

  function startActivity() {
    token++;
    stepIndex = 0;
    $('#actCounter').hidden = true;
    $('#actDone').hidden = true;
    $('#actNext').hidden = false;

    // aquí la chica HACE la rutina: su sitio detrás, el objeto en la mano y el gesto
    const scene = Scenes.forRoutine(routine);
    $('#actSet').innerHTML = Scenes.set(scene);
    paintCharacter($('#actBand'), caller,
      { pose: 'still', prop: Scenes.prop(scene), action: Scenes.action(scene) });

    show('screen-activity');
    renderStep();
  }

  function renderStep() {
    const r = routine;
    const steps = r.steps || [];
    const dots = $('#actDots');
    dots.innerHTML = steps.map((_, i) => '<i class="' + (i === stepIndex ? 'on' : '') + '"></i>').join('');

    if (stepIndex < steps.length) {
      const st = steps[stepIndex];
      $('#actEmoji').textContent = st.emoji || r.emoji || '⭐';
      $('#actText').textContent = st.text;
      $('#actNext').textContent = (stepIndex === steps.length - 1 && !(r.count > 0)) ? 'Finish ›' : 'Next ›';
      sayStep(st.text);
    } else {
      startCounting();
    }
  }

  async function sayStep(text) {
    const my = token;
    const svg = $('#actBand .kchar');
    svg && svg.classList.add('speaking');
    await Voice.say(text);
    if (my !== token) return;
    const svg2 = $('#actBand .kchar');
    svg2 && svg2.classList.remove('speaking');
  }

  function nextStep() {
    const r = routine;
    const steps = r.steps || [];
    if (stepIndex < steps.length - 1) {
      stepIndex++;
      renderStep();
    } else if (r.count > 0 && $('#actCounter').hidden) {
      stepIndex = steps.length;
      startCounting();
    } else {
      celebrate();
    }
  }

  async function startCounting() {
    const my = token;
    const r = routine;
    if (!(r.count > 0)) { finishActivity(); return; }

    $('#actNext').hidden = true;
    $('#actEmoji').textContent = r.emoji || '⭐';
    $('#actText').textContent = "Let's count to " + r.count + '!';
    $('#actCounter').hidden = false;
    const el = $('#actCounter');

    await Voice.say("Let's count to " + r.count + '!');
    for (let i = 1; i <= r.count; i++) {
      if (my !== token) return;
      el.textContent = i;
      el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
      Sound.tick(i);
      await Voice.say(String(i), { rate: 1.05 });
      await Voice.pause(180);
    }
    if (my !== token) return;
    $('#actText').textContent = 'Finished!';
    await Voice.say('Finished! ' + praise());
    if (my !== token) return;
    finishActivity();
  }

  function finishActivity() {
    $('#actNext').hidden = true;
    $('#actDone').hidden = false;
  }

  /* ───────── la celebración ───────── */

  async function celebrate() {
    token++;
    const my = token;
    const r = routine;

    const isNew = Store.markDone(r.id);
    const p = Store.getProgress();
    const stars = p.done.length;

    $('#winTitle').textContent = praise();
    $('#winSub').textContent = r.done || '';
    paintCharacter($('#winBand'), caller, { pose: 'dance', mic: true });
    $('#winStar').textContent = '⭐'.repeat(Math.min(stars, 5)) || '⭐';
    stopVideos();
    show('screen-win');
    Confetti.start(2600);
    Sound.cheer();

    const winVideo = await Media.get(r.id, 'winVideo');
    if (my !== token) return;
    if (winVideo) {
      $('#winBand').style.display = 'none';
      await playVideoBlob($('#winVideo'), winVideo);
      $('#winBand').style.display = '';
      if (my !== token) return;
    }

    await Voice.say($('#winTitle').textContent);
    if (my !== token) return;
    await Voice.say(r.done || '');
    if (my !== token) return;

    if (isNew) {
      await Voice.say(stars === 1 ? 'You have one star today!' : 'You have ' + stars + ' stars today!');
    }
    if (my !== token) return;

    // ¿ha terminado todo el tramo del día?
    const all = Store.getRoutines().filter(x => x.enabled !== false && x.period === r.period);
    if (all.length && all.every(x => p.done.indexOf(x.id) !== -1)) {
      $('#winSub').textContent = 'All your ' + PERIOD_LABEL[r.period].toLowerCase() + ' routines are done!';
      await Voice.say('Wow! You finished all your ' + PERIOD_LABEL[r.period].toLowerCase() + ' routines!');
      Confetti.start(1800);
    }
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

    $('#callBack').addEventListener('click', goHome);
    $('#actBack').addEventListener('click', goHome);
    $('#winBack').addEventListener('click', goHome);

    $('#answerBtn').addEventListener('click', answer);
    $('#againBtn').addEventListener('click', async () => {
      const r = routine;
      const blob = await Media.get(r.id, 'voice');
      if (blob) {
        $('#callBubble').innerHTML = highlight(r.phrase, r.word);
        mouth(true); await Voice.playBlob(blob); mouth(false);
      } else {
        speak(r.phrase, highlight(r.phrase, r.word));
      }
    });
    $('#letsGoBtn').addEventListener('click', startActivity);
    $('#doneBtn').addEventListener('click', celebrate);

    $('#actNext').addEventListener('click', nextStep);
    $('#actDone').addEventListener('click', celebrate);
    $('#actAgain').addEventListener('click', () => {
      const steps = routine.steps || [];
      if (stepIndex < steps.length) sayStep(steps[stepIndex].text);
    });

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
      if (document.hidden) { token++; Voice.stop(); Sound.stopRing(); }
    });

    document.addEventListener('pointerdown', () => Sound.unlock(), { once: true });
  }

  function init() {
    const s = Store.getSettings();
    Voice.configure({ voiceURI: s.voiceURI, rate: s.rate, pitch: s.pitch });
    bind();
    renderHome();
    show('screen-home');

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(e => console.warn('[sw]', e));
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return { goHome, renderHome, show, get period() { return period; } };
})();
