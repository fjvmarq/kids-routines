/* Kids Routines — sonido y voz.
   Los sonidos se sintetizan (no hay ficheros que descargar) y la voz es la del
   propio Android, así que todo funciona sin conexión. */

const Sound = (function () {
  let ctx = null;
  let ringTimer = null;

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  /* un tono simple */
  function tone(freq, start, dur, vol, type) {
    const a = ac(); if (!a) return;
    const t0 = a.currentTime + start;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  /* «rin rin» — doble timbre, como un teléfono */
  function ringOnce() {
    tone(420, 0, 0.38, 0.22, 'triangle');
    tone(470, 0, 0.38, 0.18, 'sine');
    tone(420, 0.55, 0.38, 0.22, 'triangle');
    tone(470, 0.55, 0.38, 0.18, 'sine');
    if (navigator.vibrate) { try { navigator.vibrate([350, 180, 350]); } catch (e) {} }
  }

  function startRing() {
    stopRing();
    ringOnce();
    ringTimer = setInterval(ringOnce, 2400);
  }

  function stopRing() {
    if (ringTimer) { clearInterval(ringTimer); ringTimer = null; }
    if (navigator.vibrate) { try { navigator.vibrate(0); } catch (e) {} }
  }

  function pickUp() {
    tone(660, 0, 0.12, 0.18, 'sine');
    tone(880, 0.1, 0.16, 0.18, 'sine');
  }

  function pop() { tone(720, 0, 0.09, 0.16, 'triangle'); }

  function tick(i) { tone(520 + (i % 8) * 40, 0, 0.12, 0.14, 'sine'); }

  /* fanfarria de celebración */
  function cheer() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => { tone(f, i * 0.12, 0.5, 0.2, 'triangle'); });
    tone(1318.5, 0.5, 0.7, 0.16, 'sine');
    for (let i = 0; i < 6; i++) tone(1200 + Math.random() * 900, 0.6 + i * 0.07, 0.25, 0.07, 'sine');
    if (navigator.vibrate) { try { navigator.vibrate([90, 60, 90, 60, 180]); } catch (e) {} }
  }

  function unlock() { ac(); }

  return { startRing, stopRing, pickUp, pop, tick, cheer, unlock };
})();


/* ───────── audios pregrabados ─────────
   Si en audio/ hay un clip para una frase, se usa ESE en lugar de la voz del
   móvil: así la niña oye siempre la misma voz inglesa, buena y alegre, y la app
   suena igual en todos los teléfonos. Si falta el clip, habla el móvil. */
const Pack = (function () {
  let files = {};        // { clave: nombre de fichero }
  let base = 'audio/';
  let ready = false;
  const cache = {};      // Audio ya creados, para que no haya retardo la 2ª vez

  /* la clave de una frase es la propia frase, simplificada */
  function key(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[‘’']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70);
  }

  async function load() {
    try {
      const res = await fetch('audio/manifest.json', { cache: 'no-cache' });
      if (!res.ok) return false;
      const data = await res.json();
      files = data.files || {};
      base = data.base || 'audio/';
      ready = Object.keys(files).length > 0;
      return ready;
    } catch (e) {
      return false;        // sin pack no pasa nada: habla el móvil
    }
  }

  function has(text) { return ready && !!files[key(text)]; }

  function play(text) {
    return new Promise(resolve => {
      const k = key(text);
      if (!ready || !files[k]) { resolve(false); return; }
      let a = cache[k];
      if (!a) { a = new Audio(base + files[k]); a.preload = 'auto'; cache[k] = a; }
      const finish = () => { a.onended = a.onerror = null; resolve(true); };
      a.onended = finish;
      a.onerror = () => { a.onended = a.onerror = null; resolve(false); };
      try { a.currentTime = 0; } catch (e) {}
      a.play().catch(() => finish());
    });
  }

  function stop() {
    Object.keys(cache).forEach(k => { try { cache[k].pause(); } catch (e) {} });
  }

  return { load, has, play, stop, key, get ready() { return ready; } };
})();


const Voice = (function () {
  const synth = window.speechSynthesis;
  let voices = [];
  let chosenURI = null;
  let rate = 0.95, pitch = 1.45;
  let cancelled = false;

  function load() {
    if (!synth) return;
    voices = synth.getVoices() || [];
  }
  if (synth) {
    load();
    synth.addEventListener('voiceschanged', load);
  }

  function englishVoices() {
    return voices.filter(v => /^en(-|_|$)/i.test(v.lang));
  }

  function current() {
    const en = englishVoices();
    if (chosenURI) {
      const hit = voices.find(v => v.voiceURI === chosenURI);
      if (hit) return hit;
    }
    // preferimos inglés británico, voz femenina y de las nuevas (suenan naturales)
    const score = v => {
      let s = 0;
      const n = (v.name || '').toLowerCase();
      if (/en[-_]GB/i.test(v.lang)) s += 5;
      if (/en[-_](US|AU|IE|NZ)/i.test(v.lang)) s += 3;
      if (/female|woman|girl|amy|emma|libby|sonia|hazel|zira|joanna|salli|aria|jenny/.test(n)) s += 4;
      if (/google|natural|neural|premium|enhanced/.test(n)) s += 3;
      if (/male|david|mark|george|ryan|guy|brian/.test(n)) s -= 4;
      if (v.localService) s += 2;              // funciona sin conexión
      return s;
    };
    return en.slice().sort((a, b) => score(b) - score(a))[0] || null;
  }

  /* ¿hay alguna voz inglesa en este aparato? Si no, NO hablamos: una voz
     española leyendo inglés le enseña a pronunciar mal, que es peor que callar. */
  function hasEnglish() { return englishVoices().length > 0; }

  function configure(o) {
    if (!o) return;
    if (o.voiceURI !== undefined) chosenURI = o.voiceURI || null;
    if (o.rate) rate = +o.rate;
    if (o.pitch) pitch = +o.pitch;
  }

  function stop() {
    cancelled = true;
    Pack.stop();
    if (synth) { try { synth.cancel(); } catch (e) {} }
  }

  /* ¿podemos decir ESTA frase? (con clip, o con voz inglesa del aparato) */
  function canSay(text) { return Pack.has(text) || hasEnglish(); }

  /* ¿puede hablar la app, de una forma u otra? */
  function canSpeak() { return Pack.ready || hasEnglish(); }

  /* dice una frase y resuelve cuando acaba.
     Android a veces no dispara 'end', así que hay un plazo de seguridad. */
  async function say(text, opts) {
    const o = opts || {};
    cancelled = false;

    // 1) ¿hay un audio grabado para esta frase? Ése manda.
    if (Pack.has(text)) {
      const ok = await Pack.play(text);
      if (ok) return;
    }

    // 2) si no, habla el móvil
    return new Promise(resolve => {
      if (!synth || !text) { setTimeout(resolve, 300); return; }
      if (!hasEnglish()) {           // sin voz inglesa preferimos el silencio
        setTimeout(resolve, Math.min(2600, 600 + text.length * 45));
        return;
      }
      let done = false;
      const finish = () => { if (!done) { done = true; clearTimeout(guard); resolve(); } };

      try { synth.cancel(); } catch (e) {}
      const u = new SpeechSynthesisUtterance(text);
      const v = current();
      if (v) { u.voice = v; u.lang = v.lang; }
      u.rate = o.rate || rate;
      u.pitch = o.pitch === undefined ? pitch : o.pitch;
      u.volume = 1;
      u.onend = finish;
      u.onerror = finish;
      if (o.onStart) u.onstart = o.onStart;

      // plazo de seguridad: si el móvil no avisa del final, seguimos igualmente
      const words = text.split(/\s+/).length;
      const guard = setTimeout(finish, 700 + words * 560 / (u.rate || 1));
      try { synth.speak(u); } catch (e) { finish(); }
    });
  }

  /* reproduce un audio grabado por los padres (Blob) */
  function playBlob(blob) {
    return new Promise(resolve => {
      if (!blob) { resolve(); return; }
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      const finish = () => { URL.revokeObjectURL(url); resolve(); };
      a.onended = finish;
      a.onerror = finish;
      a.play().catch(finish);
    });
  }

  function pause(ms) { return new Promise(r => setTimeout(r, ms)); }

  return {
    say, playBlob, pause, stop, configure, englishVoices, hasEnglish,
    canSay, canSpeak, pack: Pack,
    current, reload: load,
    get available() { return !!synth; },
    get cancelled() { return cancelled; }
  };
})();
