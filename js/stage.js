/* Kids Routines — el escenario del personaje.

   La app no dibuja a las chicas directamente: le pide cosas al escenario
   («enseña a Yuna», «que llame», «que hable», «¡fiesta!») y el escenario decide
   cómo. Así el dibujo se puede cambiar entero sin tocar el resto de la app.

   Hay dos formas de dibujarlas:
     · 3D  — js/stage3d.js: modelo VRM con esqueleto, sombreado anime, parpadeo
             y boca. Es la buena. Se carga sola si el móvil puede con WebGL.
     · 2D  — el SVG de js/characters.js. Es el plan B: si el 3D no carga (móvil
             viejo, sin WebGL, fallo de red), la app sigue funcionando igual.

   Los estados («moods»):
     ring   llamando: móvil en la oreja, esperando a que contesten
     talk   hablando
     wait   ha terminado de hablar y espera a que la niña pulse un botón
     do     HACE la tarea y la termina (la niña ha pulsado «Congratulations!»)
     skip   la empieza y la deja a medias (ha pulsado «I'll try later»)
     party  ¡fiesta! lo ha hecho
     bye    se despide

   do y skip llevan la escena de la rutina ({ scene: 'teeth' }), que dice qué
   objeto coge y qué gesto hace (js/scenes.js). */

const Stage = (function () {
  let host = null;
  let char = null;
  let mood = 'wait';
  let moodOpts = {};
  let talkOn = false;
  let impl3d = null;        // lo pone stage3d.js cuando ha cargado
  let usando3d = false;

  /* ───────── plan B: el dibujo 2D ───────── */
  const MOOD_2D = {
    ring: 'idle', talk: 'idle speaking', wait: 'idle', party: 'dance', bye: 'idle wave',
    do: 'still', skip: 'idle skip'
  };

  function pinta2d() {
    if (!host || !char) return;
    const pose = MOOD_2D[mood] || 'idle';
    const opts = { pose: pose + (talkOn ? ' speaking' : ''), mic: mood === 'talk' || mood === 'wait' };
    if ((mood === 'do' || mood === 'skip') && moodOpts.scene) {
      opts.prop = Scenes.prop(moodOpts.scene);
      if (mood === 'do') opts.action = Scenes.action(moodOpts.scene);
      opts.mic = false;
    }
    host.innerHTML = '<div class="stage-2d">' + Characters.svg(char, opts) + '</div>';
  }

  /* ───────── lo que usa la app ───────── */

  function mount(el) {
    host = el;
    if (usando3d && impl3d) impl3d.mount(host);
  }

  function setCharacter(c) {
    char = c;
    if (usando3d && impl3d) return Promise.resolve(impl3d.setCharacter(c));
    pinta2d();
    return Promise.resolve();
  }

  function setMood(m, opts) {
    mood = m;
    moodOpts = opts || {};
    if (usando3d && impl3d) impl3d.setMood(m, moodOpts);
    else pinta2d();
  }

  /* la habitación de la rutina (baño, cocina, cuarto…): sólo en 3D */
  function setScene(escena) {
    if (usando3d && impl3d && impl3d.setScene) return impl3d.setScene(escena);
    return Promise.resolve();
  }

  /* cuánto dura cada momento que no es hablar (en milisegundos) */
  function duration(m) {
    if (usando3d && impl3d && impl3d.duration) return impl3d.duration(m);
    return m === 'do' ? 4200 : m === 'skip' ? 2600 : 0;
  }

  function talking(on) {
    talkOn = !!on;
    if (usando3d && impl3d) impl3d.talking(talkOn);
    else {
      const svg = host && host.querySelector('.kchar');
      if (svg) svg.classList.toggle('speaking', talkOn);
    }
  }

  function pause() { if (usando3d && impl3d && impl3d.pause) impl3d.pause(); }
  function resume() { if (usando3d && impl3d && impl3d.resume) impl3d.resume(); }

  /* stage3d.js se presenta aquí cuando ya ha cargado Three.js y el modelo */
  function register3D(impl) {
    impl3d = impl;
    usando3d = true;
    document.documentElement.classList.add('has-3d');
    if (host) {
      impl3d.mount(host);
      if (char) impl3d.setCharacter(char);
      impl3d.setMood(mood, moodOpts);
    }
  }

  function is3D() { return usando3d; }

  return { mount, setCharacter, setScene, setMood, duration, talking, pause, resume, register3D, is3D };
})();

/* el 3D (js/stage3d.js) es un módulo y busca el escenario en window: un const
   de nivel superior NO se cuelga de window, y sin esto el 3D se retiraba en silencio */
window.Stage = Stage;
