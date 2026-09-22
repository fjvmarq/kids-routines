# Kids Routines ⭐

Una app de rutinas para niñas y niños pequeños, **en inglés**, con un grupo de
K-pop dibujado a mano: **Yuna, Nari y Soomi**. Inspirada en las tarjetas de
rutina de Kids&Us: la niña toca una tarjeta, **le llama una del grupo por
teléfono**, le dice en inglés lo que toca hacer, le enseña a repetir la palabra
clave, **la acompaña haciéndolo** (con su escenario y su gesto: cepillarse,
enjabonarse, comer, recoger…) y al terminar pulsa **I did it!** y sale la fiesta
con confeti y una estrella.

Trae **38 rutinas** de fábrica, se usa **en horizontal** y funciona **sin
internet**. Sin anuncios, sin cuentas y sin recoger nada: todo lo que guarda se
queda en el móvil.

**En línea:** <https://fjvmarq.github.io/kids-routines/>

---

## Cómo se instala en el móvil

No está en Google Play: es una **app web instalable** (PWA).

1. Abre <https://fjvmarq.github.io/kids-routines/> en **Chrome** (Android).
2. Menú **⋮** → **Instalar aplicación** (o «Añadir a la pantalla de inicio»).
3. Ábrela desde el icono nuevo. Déjala abierta unos segundos con conexión la
   primera vez: ahí se guarda para funcionar sin ella.

Se puede instalar en tantos móviles como quieras, y para compartirla basta con
pasar el enlace. Cada móvil guarda sus propias rutinas y sus propias estrellas.

> ⚠️ **Si el icono no abre nada**, desinstálalo, borra los datos del sitio
> (Chrome › Configuración › Configuración de sitios › Todos los sitios ›
> `fjvmarq.github.io` › Borrar y restablecer) y vuelve a instalar. El icono
> instalado **congela el manifiesto** del momento en que se instaló, así que un
> manifiesto que Android no digiera deja un icono muerto hasta reinstalar.
> Pasó de verdad: con `display_override` y `orientation` en el manifiesto,
> Android instalaba la app y sólo se abría desde la notificación de instalado.

**Diagnóstico:** <https://fjvmarq.github.io/kids-routines/estado.html> dice, en
ese mismo móvil, si el manifiesto carga, si el service worker está registrado,
cuántos audios hay y qué voces inglesas tiene el aparato.

---

## Las voces

La app **trae sus propios audios en inglés**, uno por frase, y **cada chica
tiene su voz**: Yuna suena distinta de Nari y de Soomi. No depende de lo que
tenga instalado el móvil, que era lo que hacía que sonara mal o con acento
español.

| Chica | Voz | Motor |
|---|---|---|
| Yuna | Emma, británica | Kokoro-82M |
| Nari | Lily, británica | Kokoro-82M |
| Soomi | Cori, británica | Piper |

Ninguna voz libre es infantil —todas son de mujer adulta—, así que se generan
más lentas y se les sube el tono: suenan más jóvenes y la duración queda igual.

En la **zona de padres** se elige de dónde sale la voz (los audios de la app, la
voz del móvil, o los audios con el móvil de reserva) y hay un botón que
**comprueba que todas las frases tienen su audio**.

### Regenerar los audios

```bash
# hace falta el entorno con los motores (kokoro-onnx, piper-tts, soundfile)
<python-con-motores> tools/make-voices.py             # las tres voces
<python-con-motores> tools/make-voices.py --solo nari
python tools/make-voices.py --list                    # ver las frases
```

Para comparar candidatas, `tools/make-samples.py` escribe `voces/` y la página
`voces.html` las reproduce.

> **Por qué estas voces y no otras.** Porque se pueden publicar: Kokoro tiene
> licencia **Apache-2.0**, que no impone ninguna condición sobre el audio
> generado, y las voces de Piper elegidas están entrenadas **desde cero con
> grabaciones de dominio público** (LibriVox). Quedan fuera a propósito, aunque
> suenen bien: `jenny`, `amy`, `alba` y `hfc_female` (derivan de la voz
> *lessac*, permitida sólo para investigación) y **edge-tts** (excelente, pero
> usa un endpoint privado de Microsoft sin licencia sobre la salida: vale para
> casa, no para publicar).

---

## Cómo se usa

- **Las tarjetas** están repartidas en Morning · Afternoon · Evening, y la app
  abre por el tramo que toca según la hora.
- **Tocar una tarjeta** = llamada entrante: suena el teléfono, vibra, y la niña
  descuelga con el botón verde (si no lo pulsa, se descuelga sola).
- La chica saluda, **dice la frase en inglés** y luego viene lo importante:
  **«Say it with me»** — dice la palabra clave, deja un silencio para que la
  repita, y la felicita.
- **Let's do it** enseña los pasos de uno en uno y, si la rutina lo lleva,
  **cuenta en inglés** mientras se lava las manos o recoge los juguetes.
- **I did it!** → confeti, fanfarria, baile y una estrella. Al completar todo un
  tramo del día, celebración extra.

## La zona de padres

Se abre **manteniendo pulsada la rueda dentada** durante un segundo y medio (una
niña de 5 años no lo hace sin querer). Está en español, y permite:

- el **nombre** de la niña (los personajes la saludan por su nombre);
- **quién llama** (una fija o una cualquiera cada vez);
- de dónde sale la **voz**, y comprobar que no falta ningún audio;
- **editar cada rutina**: nombre, frase, palabra clave, frase final, pasos,
  hasta dónde contar, momento del día y **escenario**;
- **añadir, quitar y reordenar** rutinas, o restaurar el catálogo de fábrica;
- un **retrato propio** para cada chica (sustituye al dibujo, se queda en el
  móvil);
- **medios propios** en cualquier rutina: imagen en la tarjeta, **tu voz**
  grabada diciendo la frase, y vídeo para la llamada y para la celebración;
- **exportar/importar** las rutinas para pasarlas a otro móvil (los vídeos y las
  grabaciones no viajan en el fichero: son del móvil donde se hicieron).

---

## Sobre los personajes

**Yuna, Nari y Soomi** son personajes **originales**, dibujados en SVG dentro de
`js/characters.js`. No copian a ningún grupo ni a ninguna serie: ni sus dibujos,
ni sus nombres, ni sus canciones. Eso permite publicar la app y compartir el
enlace sin problemas de derechos.

Si en casa queréis ver otros personajes, para eso están el **retrato propio** de
cada chica y la imagen o el vídeo propios de cada rutina: los pones tú en la
zona de padres y **se quedan en ese móvil**, no se publican.

---

## Para desarrollar

No hay compilación, ni dependencias, ni npm. Es HTML, CSS y JavaScript a pelo.

```bash
python -m http.server 8777
```

| Fichero | Qué hace |
|---|---|
| `index.html` | las cinco pantallas |
| `css/app.css` | todo el aspecto y **todas las animaciones** |
| `js/characters.js` | el grupo, dibujado en SVG |
| `js/scenes.js` | los escenarios: decorado + objeto en la mano + gesto |
| `js/audio.js` | el «rin rin», la fanfarria, los audios grabados y la voz |
| `js/store.js` | ajustes y rutinas (localStorage) + medios propios (IndexedDB) |
| `js/data.js` | las 38 rutinas de fábrica (y `CATALOG_VERSION`) |
| `js/app.js` | el hilo: casa → llamada → actividad → celebración |
| `js/parents.js` | la zona de padres |
| `sw.js` | funcionar sin conexión |
| `dev-animaciones.html` | las tres chicas en todos sus estados, para juzgar el movimiento |
| `estado.html` | diagnóstico en el propio móvil |
| `voces.html` | comparador de voces candidatas |

### Reglas que han costado un disgusto

- **Las animaciones: lentas, pequeñas y suaves.** Ciclos largos, ángulos de
  pocos grados, `ease-in-out`. Es para una niña de cinco años: tiene que dar
  ternura, no nervio. Nada de deslizarse por el suelo.
- **Un audio cada vez.** Empezar uno sin parar el anterior los solapa: se oyen
  dos voces a la vez y el sonido va desfasado del texto de la pantalla.
- **No mezclar fuentes de voz.** Si una frase la dice el móvil y la siguiente un
  audio grabado, se nota muchísimo. Por eso, con el pack activo, la app elige
  frases que existen en el pack (el saludo con el nombre de la niña, que no
  puede venir grabado, se sustituye por el saludo de la chica).
- **El service worker no guarda las páginas de trabajo** (`voces`, `estado`,
  `dev-animaciones`): si las guarda, se quedan congeladas y uno cree estar
  viendo lo nuevo cuando ve lo viejo.
- **Al añadir rutinas**, sube `CATALOG_VERSION` en `js/data.js`: los móviles que
  ya tengan la app se encontrarán sólo las nuevas, sin perder lo suyo.
- **Un escenario nuevo es una llamada** a `Scenes.register(...)`, y desde la
  zona de padres se puede asignar cualquier escenario a cualquier rutina.

## Licencia

Uso privado y familiar. Voces generadas con
[Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0) y
[Piper](https://github.com/OHF-Voice/piper1-gpl) (voces de dominio público).
