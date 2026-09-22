/* Kids Routines — zona de padres (en español).
   Se abre manteniendo pulsada la rueda dentada: una niña de 5 años no llega ahí. */

const Parents = (function () {
  const $ = s => document.querySelector(s);
  const VERSION = 'v1.0';

  let editing = null;          // copia de la rutina que se está editando
  let pendingMedia = {};       // { image: Blob|null, voice: Blob|null, ... }
  let recorder = null, recChunks = [], recBlobPreview = null;

  /* ───────── abrir / cerrar ───────── */

  function open() {
    fillSettings();
    fillPortraits();
    fillVoices();
    renderRoutines();
    $('#pStarsInfo').textContent = 'Hoy: ' + Store.getProgress().done.length +
      ' estrellas · en total: ' + (Store.getProgress().total || 0) + '.';
    $('#pVersion').textContent = VERSION;
    App.show('screen-parents');
  }

  function close() { App.goHome(); }

  /* ───────── ajustes ───────── */

  function fillSettings() {
    const s = Store.getSettings();
    $('#pName').value = s.childName || '';
    $('#pNameEcho').textContent = s.childName || 'Superstar';

    const sel = $('#pChar');
    sel.innerHTML = '<option value="random">Una cualquiera (cambia cada vez)</option>' +
      Characters.LIST.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('');
    sel.value = s.character || 'random';

    $('#pRate').value = s.rate || 0.88;
    $('#pPitch').value = s.pitch || 1.25;
  }

  function fillVoices() {
    Voice.reload();
    const sel = $('#pVoice');
    const list = Voice.englishVoices();
    const s = Store.getSettings();
    sel.innerHTML = '<option value="">Automática (la mejor que encuentre)</option>' +
      list.map(v => '<option value="' + v.voiceURI + '">' + v.name + ' · ' + v.lang +
        (v.localService ? ' · sin conexión' : '') + '</option>').join('');
    sel.value = s.voiceURI || '';

    const help = $('#pVoiceHelp');
    if (!Voice.available) {
      help.textContent = 'Este navegador no tiene voz. Prueba con Chrome.';
    } else if (!list.length) {
      help.textContent = 'No hay voces en inglés instaladas. En Android: Ajustes › Sistema › Idiomas › Salida de texto a voz › instalar el inglés.';
    } else {
      const v = Voice.current();
      help.textContent = 'Ahora mismo habla: ' + (v ? v.name + ' (' + v.lang + ')' : '—') +
        '. Las marcadas «sin conexión» funcionan sin internet.';
    }
  }

  /* ───────── retratos propios de cada chica ───────── */

  function fillPortraits() {
    const box = $('#pPortraits');
    box.innerHTML = '';
    Characters.LIST.forEach(c => {
      const row = document.createElement('div');
      row.className = 'p-item';
      row.innerHTML =
        '<span class="emo">🎤</span>' +
        '<span class="txt"><b>' + c.name + '</b><small class="state">dibujo de la app</small></span>' +
        '<label class="p-btn tiny">Poner imagen<input type="file" accept="image/*" hidden></label>' +
        '<button class="mini" title="Quitar">✕</button>';

      const input = row.querySelector('input[type=file]');
      const state = row.querySelector('.state');
      const key = 'char:' + c.id;

      Media.get(key, 'image').then(b => { if (b) state.textContent = 'imagen propia'; });

      input.addEventListener('change', async e => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        await Media.put(key, 'image', f);
        state.textContent = 'imagen propia';
        e.target.value = '';
      });
      row.querySelector('.mini').addEventListener('click', async () => {
        await Media.del(key, 'image');
        state.textContent = 'dibujo de la app';
      });

      box.appendChild(row);
    });
  }

  /* ───────── lista de rutinas ───────── */

  function renderRoutines() {
    const box = $('#pRoutines');
    const list = Store.getRoutines();
    box.innerHTML = '';

    list.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'p-item' + (r.enabled === false ? ' off' : '');
      row.innerHTML =
        '<span class="emo">' + (r.emoji || '⭐') + '</span>' +
        '<span class="txt"><b>' + escapeHtml(r.name) + '</b>' +
        '<small>' + periodEs(r.period) + ' · ' + escapeHtml(r.word || '') + '</small></span>' +
        '<button class="mini" data-act="up" title="Subir">↑</button>' +
        '<button class="mini" data-act="down" title="Bajar">↓</button>' +
        '<button class="mini" data-act="toggle" title="Activar o desactivar">' + (r.enabled === false ? '○' : '●') + '</button>' +
        '<button class="mini" data-act="edit" title="Editar">✎</button>';

      row.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        const act = b.dataset.act;
        const all = Store.getRoutines().slice();
        if (act === 'toggle') {
          all[i] = Object.assign({}, r, { enabled: r.enabled === false });
          Store.saveRoutines(all); renderRoutines();
        } else if (act === 'up' && i > 0) {
          all.splice(i - 1, 0, all.splice(i, 1)[0]); Store.saveRoutines(all); renderRoutines();
        } else if (act === 'down' && i < all.length - 1) {
          all.splice(i + 1, 0, all.splice(i, 1)[0]); Store.saveRoutines(all); renderRoutines();
        } else if (act === 'edit') {
          openEditor(r);
        }
      });
      box.appendChild(row);
    });
  }

  function periodEs(p) {
    return p === 'morning' ? 'Mañana' : p === 'afternoon' ? 'Tarde' : 'Noche';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  /* ───────── editor de una rutina ───────── */

  function openEditor(r) {
    editing = Object.assign({}, r);
    pendingMedia = {};
    recBlobPreview = null;

    $('#eTitle').textContent = r.name ? 'Editar rutina' : 'Nueva rutina';
    $('#eName').value = r.name || '';
    $('#ePhrase').value = r.phrase || '';
    $('#eWord').value = r.word || '';
    $('#eDone').value = r.done || '';
    $('#ePeriod').value = r.period || 'morning';
    const sceneSel = $('#eScene');
    sceneSel.innerHTML = '<option value="">Automático (' + Scenes.forRoutine(r) + ')</option>' +
      Scenes.list().map(id => '<option value="' + id + '">' + id + '</option>').join('');
    sceneSel.value = r.scene || '';
    $('#eEmoji').value = r.emoji || '';
    $('#eSteps').value = (r.steps || []).map(s => s.text).join('\n');
    $('#eCount').value = r.count || 0;
    $('#eImage').value = ''; $('#eCallVideo').value = ''; $('#eWinVideo').value = '';
    $('#eRec').classList.remove('rec');
    $('#eRec').textContent = '● Grabar';

    Media.summary(r.id).then(sum => {
      markMedia('image', sum.image);
      markMedia('voice', sum.voice);
      markMedia('callVideo', sum.callVideo);
      markMedia('winVideo', sum.winVideo);
    });

    $('#editSheet').hidden = false;
  }

  function markMedia(kind, has) {
    const btn = document.querySelector('[data-clear="' + kind + '"]');
    if (btn) { btn.textContent = has ? 'Quitar (hay uno)' : 'Quitar'; btn.disabled = !has; }
  }

  async function saveEditor() {
    if (!editing) return;
    const steps = $('#eSteps').value.split('\n').map(t => t.trim()).filter(Boolean)
      .map(text => {
        const old = (editing.steps || []).find(s => s.text === text);
        return { text: text, emoji: old ? old.emoji : (editing.emoji || '⭐') };
      });

    const r = Object.assign({}, editing, {
      name: $('#eName').value.trim() || 'Routine',
      phrase: $('#ePhrase').value.trim(),
      word: $('#eWord').value.trim(),
      done: $('#eDone').value.trim(),
      period: $('#ePeriod').value,
      scene: $('#eScene').value || undefined,
      emoji: $('#eEmoji').value.trim() || '⭐',
      steps: steps,
      count: Math.max(0, Math.min(60, parseInt($('#eCount').value, 10) || 0))
    });

    Store.upsertRoutine(r);

    for (const kind of Media.KINDS) {
      if (pendingMedia[kind] === undefined) continue;
      if (pendingMedia[kind] === null) await Media.del(r.id, kind);
      else await Media.put(r.id, kind, pendingMedia[kind]);
    }

    editing = null; pendingMedia = {};
    $('#editSheet').hidden = true;
    renderRoutines();
  }

  /* ───────── grabar la voz de casa ───────── */

  async function toggleRecording() {
    const btn = $('#eRec');
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      return;
    }
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      alert('Este navegador no puede grabar. Necesita Chrome y una dirección https.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recChunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = e => { if (e.data && e.data.size) recChunks.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(recChunks, { type: recorder.mimeType || 'audio/webm' });
        pendingMedia.voice = blob;
        recBlobPreview = blob;
        btn.classList.remove('rec');
        btn.textContent = '● Grabar otra vez';
        markMedia('voice', true);
      };
      recorder.start();
      btn.classList.add('rec');
      btn.textContent = '■ Parar';
    } catch (e) {
      alert('No he podido usar el micrófono: ' + e.message);
    }
  }

  /* ───────── copia de seguridad ───────── */

  function exportAll() {
    const data = {
      app: 'kids-routines', version: VERSION, date: new Date().toISOString(),
      settings: Store.getSettings(), routines: Store.getRoutines()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kids-routines-' + Store.today() + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function importAll(file) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const data = JSON.parse(fr.result);
        if (!data || !Array.isArray(data.routines)) throw new Error('el fichero no tiene rutinas');
        if (!confirm('Esto sustituye las rutinas y los ajustes de este móvil. ¿Seguimos?')) return;
        Store.saveRoutines(data.routines);
        if (data.settings) Store.saveSettings(data.settings);
        const s = Store.getSettings();
        Voice.configure({ voiceURI: s.voiceURI, rate: s.rate, pitch: s.pitch });
        fillSettings(); renderRoutines();
        alert('Listo: ' + data.routines.length + ' rutinas importadas.');
      } catch (e) {
        alert('No he podido leer el fichero: ' + e.message);
      }
    };
    fr.readAsText(file);
  }

  /* ───────── enganches ───────── */

  function bind() {
    $('#pClose').addEventListener('click', close);

    $('#pName').addEventListener('input', e => {
      Store.saveSettings({ childName: e.target.value });
      $('#pNameEcho').textContent = e.target.value || 'Superstar';
    });
    $('#pChar').addEventListener('change', e => Store.saveSettings({ character: e.target.value }));
    $('#pVoice').addEventListener('change', e => {
      Store.saveSettings({ voiceURI: e.target.value });
      Voice.configure({ voiceURI: e.target.value });
      fillVoices();
    });
    $('#pRate').addEventListener('change', e => {
      Store.saveSettings({ rate: +e.target.value }); Voice.configure({ rate: +e.target.value });
    });
    $('#pPitch').addEventListener('change', e => {
      Store.saveSettings({ pitch: +e.target.value }); Voice.configure({ pitch: +e.target.value });
    });
    $('#pTestVoice').addEventListener('click', () => {
      const n = (Store.getSettings().childName || '').trim();
      Sound.unlock();
      Voice.say(n ? 'Hello, ' + n + '! It\'s time to wash your hands!' : "Hello! It's time to wash your hands!");
    });

    $('#pCheckVoice').addEventListener('click', () => {
      const a = App.auditVoice();
      const help = $('#pVoiceHelp');
      if (!Voice.pack.ready) {
        help.textContent = 'No hay audios grabados en esta versión: habla la voz del móvil.';
        return;
      }
      if (!a.faltan.length) {
        help.textContent = 'Las ' + a.total + ' frases tienen su audio grabado. ✔';
      } else {
        help.textContent = a.clips + ' de ' + a.total + ' frases tienen audio. Sin audio (las dirá el móvil): ' +
          a.faltan.slice(0, 6).join(' · ') + (a.faltan.length > 6 ? ' … y ' + (a.faltan.length - 6) + ' más' : '');
      }
    });

    $('#pAdd').addEventListener('click', () => {
      openEditor({
        id: Store.newId(), period: App.period, emoji: '⭐', enabled: true,
        name: '', phrase: '', word: '', done: '', steps: [], count: 0
      });
    });

    $('#pRestore').addEventListener('click', () => {
      if (!confirm('Esto devuelve las rutinas de fábrica y borra tus cambios en ellas. ¿Seguimos?')) return;
      Store.restoreDefaults();
      renderRoutines();
    });

    $('#pResetDay').addEventListener('click', () => {
      if (!confirm('¿Borro las estrellas de hoy?')) return;
      Store.resetToday();
      $('#pStarsInfo').textContent = 'Hoy: 0 estrellas · en total: ' + (Store.getProgress().total || 0) + '.';
    });

    $('#pExport').addEventListener('click', exportAll);
    $('#pImport').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', e => {
      if (e.target.files && e.target.files[0]) importAll(e.target.files[0]);
      e.target.value = '';
    });

    // editor
    $('#eCancel').addEventListener('click', () => {
      if (recorder && recorder.state === 'recording') recorder.stop();
      editing = null; pendingMedia = {}; $('#editSheet').hidden = true;
    });
    $('#eSave').addEventListener('click', saveEditor);
    $('#eDelete').addEventListener('click', () => {
      if (!editing) return;
      if (!confirm('¿Borro la rutina «' + (editing.name || '') + '»?')) return;
      Store.deleteRoutine(editing.id);
      editing = null; $('#editSheet').hidden = true; renderRoutines();
    });

    $('#eImage').addEventListener('change', e => {
      if (e.target.files[0]) { pendingMedia.image = e.target.files[0]; markMedia('image', true); }
    });
    $('#eCallVideo').addEventListener('change', e => {
      if (e.target.files[0]) { pendingMedia.callVideo = e.target.files[0]; markMedia('callVideo', true); }
    });
    $('#eWinVideo').addEventListener('change', e => {
      if (e.target.files[0]) { pendingMedia.winVideo = e.target.files[0]; markMedia('winVideo', true); }
    });
    $('#eRec').addEventListener('click', toggleRecording);
    $('#ePlayRec').addEventListener('click', async () => {
      const blob = recBlobPreview || (editing ? await Media.get(editing.id, 'voice') : null);
      if (!blob) { alert('Todavía no hay grabación.'); return; }
      Voice.playBlob(blob);
    });

    document.querySelectorAll('[data-clear]').forEach(btn => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.clear;
        pendingMedia[kind] = null;
        markMedia(kind, false);
        if (kind === 'voice') recBlobPreview = null;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', bind);

  return { open, close };
})();
