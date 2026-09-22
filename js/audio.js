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
  /* Los audios grabados. Hay UNA CARPETA POR CHICA, así que cada una tiene su
     propia voz: Yuna suena distinta de Nari y de Soomi, que es lo que las hace
     reconocibles cuando llaman. El fichero de cada frase se llama igual en las
     tres carpetas; lo único que cambia es la carpeta.

     Si falta el clip de esa chica, se prueba con la voz por defecto, y si
     tampoco, habla el móvil. Nunca se queda en silencio por esto. */
  let files = {};        // { clave: nombre de fichero }
  let voices = {};       // { idChica: { dir, voice } }
  let porDefecto = '';
  let base = 'audio/';
  let ready = false;
  let actual = '';       // la chica que habla ahora
  const cache = {};

  /* la clave de una frase es la propia frase, simplificada */
  function key(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[\u2018\u2019']/g, '')
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
      voices = data.voices || {};
      porDefecto = data.default || Object.keys(voices)[0] || '';
      base = data.base || 'audio/';
      ready = Object.keys(files).length > 0 && Object.keys(voices).length > 0;
      if (!actual) actual = porDefecto;
      return ready;
    } catch (e) {
      return false;        // sin pack no pasa nada: habla el móvil
    }
  }

  /* quién habla ahora (el id del personaje) */
  function setCharacter(id) {
    actual = (id && voices[id]) ? id : porDefecto;
  }

  function carpeta(id) {
    const v = voices[id] || voices[porDefecto];
    return v ? v.dir : '';
  }

  function has(text) { return ready && !!files[key(text)]; }

  function url(text, id) {
    const k = key(text);
    if (!ready || !files[k]) return null;
    return base + carpeta(id || actual) + files[k];
  }

  /* Suena UNO cada vez. Antes no se paraba el anterior y se solapaban: se oían
     dos voces a la vez y el audio iba desfasado del texto de la pantalla. */
  let sonando = null;

  function play(text, id) {
    return new Promise(resolve => {
      const src = url(text, id);
      if (!src) { resolve(false); return; }
      stop();                                  // lo primero: callar lo anterior
      let a = cache[src];
      if (!a) { a = new Audio(src); a.preload = 'auto'; cache[src] = a; }
      sonando = a;
      const finish = ok => {
        a.onended = a.onerror = null;
        if (sonando === a) sonando = null;
        resolve(ok);
      };
      a.onended = () => finish(true);
      a.onerror = () => finish(false);
      try { a.currentTime = 0; } catch (e) {}
      a.play().catch(() => finish(false));
    });
  }

  function stop() {
    if (!sonando) return;
    const a = sonando;
    sonando = null;
    a.onended = a.onerror = null;
    try { a.pause(); a.currentTime = 0; } catch (e) {}
  }

  /* deja preparados los audios de una llamada, para que no haya esperas */
  function warm(textos, id) {
    (textos || []).slice(0, 12).forEach(t => {
      const src = url(t, id);
      if (!src || cache[src]) return;
      const a = new Audio(src);
      a.preload = 'auto';
      cache[src] = a;
    });
  }

  /* Descarga todos los audios de todas las chicas. El service worker los va
     guardando según pasan, así que después la app funciona sin cobertura.
     Sin esto, cada clip se baja la primera vez que suena: en el baño sin wifi,
     la primera vez, se quedaría muda. */
  async function downloadAll(onProgress) {
    if (!ready) return { ok: 0, fallos: 0 };
    const urls = [];
    Object.keys(voices).forEach(id => {
      Object.keys(files).forEach(k => urls.push(base + voices[id].dir + files[k]));
    });
    let ok = 0, fallos = 0;
    const LOTE = 8;                      // de ocho en ocho: ni lento ni atragantado
    for (let i = 0; i < urls.length; i += LOTE) {
      await Promise.all(urls.slice(i, i + LOTE).map(async u => {
        try {
          const r = await fetch(u, { cache: 'force-cache' });
          if (r.ok) ok++; else fallos++;
        } catch (e) { fallos++; }
      }));
      if (onProgress) onProgress(Math.min(i + LOTE, urls.length), urls.length);
    }
    return { ok: ok, fallos: fallos, total: urls.length };
  }

  function info() {
    return { ready: ready, voices: voices, actual: actual, clips: Object.keys(files).length };
  }

  return {
    load, has, play, stop, key, url, setCharacter, warm, info, downloadAll,
    get ready() { return ready; }
  };
})();


const Voice = (function () {
  const synth = window.speechSynthesis;
  let voices = [];
  let chosenURI = null;
  let rate = 0.95, pitch = 1.45;
  let cancelled = false;
  /* 'auto'   = el clip si existe, y si no la voz del móvil
     'pack'   = SÓLO los audios de la app (nunca se mezclan voces)
     'device' = SÓLO la voz del móvil */
  let source = 'pack';

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
    if (o.source) source = o.source;
  }

  function stop() {
    cancelled = true;
    Pack.stop();
    if (synth) { try { synth.cancel(); } catch (e) {} }
  }

  /* ¿podemos decir ESTA frase tal cual, sin cambiar de voz por el camino? */
  function canSay(text) {
    if (source === 'device') return hasEnglish();
    if (Pack.ready) return Pack.has(text) || (source === 'auto' && hasEnglish());
    return hasEnglish();
  }

  /* ¿puede hablar la app, de una forma u otra? */
  function canSpeak() {
    if (source === 'device') return hasEnglish();
    return Pack.ready || hasEnglish();
  }

  function getSource() { return source; }

  /* dice una frase y resuelve cuando acaba.
     Android a veces no dispara 'end', así que hay un plazo de seguridad. */
  async function say(text, opts) {
    const o = opts || {};
    cancelled = false;

    // callar lo anterior SIEMPRE: si no, se solapan y suenan dos a la vez
    Pack.stop();
    if (synth) { try { synth.cancel(); } catch (e) {} }

    // 1) el audio grabado manda (salvo que en casa prefieran la voz del móvil)
    if (source !== 'device' && Pack.has(text)) {
      const ok = await Pack.play(text);
      if (ok) return;
    }

    // 2) si no hay clip, habla el móvil — salvo que hayan pedido sólo los audios
    if (source === 'pack' && Pack.ready) return;

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
    canSay, canSpeak, getSource, pack: Pack,
    current, reload: load,
    get available() { return !!synth; },
    get cancelled() { return cancelled; }
  };
})();
