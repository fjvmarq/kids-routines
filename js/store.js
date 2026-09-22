/* Kids Routines — guardado.
   Ajustes y rutinas en localStorage; imágenes, vídeos y grabaciones en IndexedDB
   (son ficheros grandes y localStorage no los aguanta).
   Todo vive en el móvil: nada sale de él. */

const Store = (function () {
  const K_SET = 'kidsroutines.settings.v1';
  const K_ROU = 'kidsroutines.routines.v1';
  const K_PRO = 'kidsroutines.progress.v1';

  const DEFAULT_SETTINGS = {
    childName: '',
    character: 'random',      // 'random' | id de personaje
    voiceURI: '',
    rate: 0.88,
    pitch: 1.25
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const val = JSON.parse(raw);
      return (val === null || val === undefined) ? fallback : val;
    } catch (e) {
      console.warn('[store] no se pudo leer', key, e);
      return fallback;      // ojo: no escribimos encima si no pudimos leer
    }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.warn('[store] no se pudo guardar', key, e); return false; }
  }

  /* ───────── ajustes ───────── */
  let settings = Object.assign({}, DEFAULT_SETTINGS, read(K_SET, {}));
  function getSettings() { return settings; }
  function saveSettings(patch) {
    settings = Object.assign({}, settings, patch || {});
    write(K_SET, settings);
    return settings;
  }

  /* ───────── rutinas ───────── */
  let routines = read(K_ROU, null);
  function getRoutines() {
    if (!Array.isArray(routines) || !routines.length) {
      routines = DEFAULT_ROUTINES.map(r => Object.assign({}, r));
      write(K_ROU, routines);
      saveSettings({ catalogVersion: CATALOG_VERSION });
      return routines;
    }
    // catálogo nuevo: añadimos SÓLO las que faltan, sin tocar las suyas
    if ((settings.catalogVersion || 0) < CATALOG_VERSION) {
      const have = {};
      routines.forEach(r => { have[r.id] = true; });
      const nuevas = DEFAULT_ROUTINES.filter(r => !have[r.id]).map(r => Object.assign({}, r));
      if (nuevas.length) {
        routines = routines.concat(nuevas);
        write(K_ROU, routines);
      }
      saveSettings({ catalogVersion: CATALOG_VERSION });
    }
    return routines;
  }

  /* volver al catálogo de fábrica (borra los cambios del usuario) */
  function restoreDefaults() {
    routines = DEFAULT_ROUTINES.map(r => Object.assign({}, r));
    write(K_ROU, routines);
    saveSettings({ catalogVersion: CATALOG_VERSION });
    return routines;
  }
  function saveRoutines(list) {
    routines = list;
    write(K_ROU, routines);
    return routines;
  }
  function getRoutine(id) { return getRoutines().find(r => r.id === id) || null; }
  function upsertRoutine(r) {
    const list = getRoutines().slice();
    const i = list.findIndex(x => x.id === r.id);
    if (i >= 0) list[i] = r; else list.push(r);
    return saveRoutines(list);
  }
  function deleteRoutine(id) {
    Media.clearAll(id);
    return saveRoutines(getRoutines().filter(r => r.id !== id));
  }
  function newId() { return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ───────── progreso del día ───────── */
  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  let progress = read(K_PRO, null) || { day: today(), done: [], total: 0 };
  function getProgress() {
    if (progress.day !== today()) {
      progress = { day: today(), done: [], total: progress.total || 0 };
      write(K_PRO, progress);
    }
    return progress;
  }
  function markDone(id) {
    const p = getProgress();
    if (p.done.indexOf(id) === -1) {
      p.done.push(id);
      p.total = (p.total || 0) + 1;
      write(K_PRO, p);
      return true;          // estrella nueva
    }
    return false;           // ya estaba hecha hoy
  }
  function resetToday() {
    const p = getProgress();
    progress = { day: today(), done: [], total: p.total || 0 };
    write(K_PRO, progress);
  }

  return {
    getSettings, saveSettings,
    getRoutines, saveRoutines, getRoutine, upsertRoutine, deleteRoutine, newId, restoreDefaults,
    getProgress, markDone, resetToday, today,
    DEFAULT_SETTINGS
  };
})();


/* ───────── ficheros grandes (IndexedDB) ───────── */
const Media = (function () {
  const DB = 'kidsroutines-media';
  const STORE = 'files';
  const KINDS = ['image', 'voice', 'callVideo', 'winVideo'];
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error('sin IndexedDB')); return; }
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }).catch(e => { console.warn('[media] sin base de datos', e); return null; });
    return dbp;
  }

  function key(routineId, kind) { return routineId + ':' + kind; }

  async function put(routineId, kind, blob) {
    const db = await open(); if (!db) return false;
    return new Promise(resolve => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, key(routineId, kind));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  async function get(routineId, kind) {
    const db = await open(); if (!db) return null;
    return new Promise(resolve => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key(routineId, kind));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async function del(routineId, kind) {
    const db = await open(); if (!db) return;
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key(routineId, kind));
  }

  function clearAll(routineId) { KINDS.forEach(k => del(routineId, k)); }

  /* qué medios propios tiene una rutina */
  async function summary(routineId) {
    const out = {};
    for (const k of KINDS) out[k] = !!(await get(routineId, k));
    return out;
  }

  return { put, get, del, clearAll, summary, KINDS };
})();
