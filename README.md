# Kids Routines ⭐

Una app de rutinas para niñas y niños pequeños, **en inglés**, con un grupo de
K-pop dibujado a mano: **Yuna, Nari y Soomi**. Inspirada en la idea de las
tarjetas de rutina de Kids&Us: la niña toca una tarjeta, **le llama una del
grupo por teléfono**, le dice en inglés lo que toca hacer, le enseña a repetir
la palabra clave, **la acompaña haciéndolo** (con su escenario y su gesto:
cepillarse, enjabonarse, comer, recoger…) y al terminar pulsa **I did it!** y
sale la fiesta con confeti y una estrella.

Trae **38 rutinas** de fábrica (28 encendidas), la app se usa **en horizontal** y
todo lo que guarda se queda en el móvil.

Hecho en casa, para casa: sin anuncios, sin cuentas y sin necesidad de internet.

---

## Cómo se instala en el móvil

No está en Google Play: es una **app web instalable** (PWA).

1. Abre la dirección de la app en **Chrome** (Android).
2. Menú ⋮ → **Añadir a la pantalla de inicio** (o «Instalar aplicación»).
3. Ya está: aparece un icono más, se abre a pantalla completa y funciona
   **sin conexión**.

Se puede instalar en tantos móviles como quieras. Cada uno guarda sus propias
rutinas y sus propias estrellas.

### Que hable en inglés (importante)

La voz la pone el propio Android. **Si no hay ninguna voz inglesa instalada, la
app se calla a propósito** y avisa en la pantalla: una voz española leyendo
inglés le enseñaría a pronunciar mal, que es peor que el silencio.

**Ajustes › Sistema › Idiomas e introducción › Salida de texto a voz** →
instalar el paquete de **inglés** (las voces marcadas «sin conexión» en la app
funcionan también en modo avión). En Windows, para probarlo en el ordenador:
**Configuración › Hora e idioma › Voz › Agregar voces › English**.

Cada chica tiene su tono, así que se distinguen al hablar; velocidad y tono
generales se ajustan en la zona de padres.

---

## Cómo se usa

- **Las tarjetas** están repartidas en Morning · Afternoon · Evening, y la app
  abre por el tramo que toca según la hora.
- **Tocar una tarjeta** = llamada entrante: suena el teléfono, vibra, y la niña
  descuelga con el botón verde (si no lo pulsa, se descuelga sola).
- La chica saluda, **dice la frase en inglés** y luego viene lo importante:
  **«Say it with me»** — dice la palabra clave, deja un silencio para que la
  repita, y la felicita.
- **Let's do it** enseña los pasos de uno en uno (por ejemplo, los cuatro de
  lavarse los dientes) y, si la rutina lo lleva, **cuenta en inglés** mientras se
  lava las manos o recoge los juguetes.
- **I did it!** → confeti, fanfarria, baile y una estrella. Al completar todo un
  tramo del día, extra de celebración.

## La zona de padres

Se abre **manteniendo pulsada la rueda dentada** de arriba a la derecha durante
un segundo y medio (una niña de 5 años no lo hace sin querer). Está en español, y
desde ahí se puede:

- poner el **nombre** de la niña (los personajes la saludan por su nombre);
- elegir **quién llama** (una fija o una cualquiera cada vez);
- elegir la **voz** en inglés, su velocidad y su tono;
- **editar cada rutina**: nombre, frase, palabra clave, frase final, pasos,
  hasta dónde contar, y a qué momento del día pertenece;
- **añadir o quitar** rutinas y cambiarlas de orden;
- poner un **retrato propio** a cada chica: esa imagen sustituye al dibujo en la
  llamada, en la actividad y en la celebración (se queda en el móvil);
- elegir el **escenario** de cada rutina (dónde y cómo lo hace);
- **restaurar** el catálogo de fábrica;
- poner **medios propios** en cualquier rutina:
  - una **imagen** tuya en la tarjeta,
  - **tu voz** grabada diciendo la frase (funciona muy bien: la niña oye a
    papá o a mamá en inglés),
  - un **vídeo** para la llamada y otro para la celebración;
- **exportar/importar** las rutinas para pasarlas a otro móvil (los vídeos y las
  grabaciones no viajan en el fichero: son del móvil donde se hicieron).

---

## Sobre los personajes

**Yuna, Nari y Soomi** son personajes **originales**, dibujados en SVG dentro de
`js/characters.js`. No copian a ningún grupo ni a ninguna serie: ni sus dibujos,
ni sus nombres, ni sus canciones. Eso permite publicar la app y compartir el
enlace sin problemas de derechos.

Si en casa queréis ver otros personajes, para eso están el **retrato propio** de
cada chica y la imagen o el vídeo propios de cada rutina: los pones tú en la zona
de padres y **se quedan en ese móvil**, no se publican.

---

## Para desarrollar

No hay compilación, ni dependencias, ni npm. Es HTML, CSS y JavaScript a pelo.

```bash
python -m http.server 8777
```

y abrir `http://localhost:8777`.

| Fichero | Qué hace |
|---|---|
| `index.html` | las cinco pantallas |
| `css/app.css` | todo el aspecto (colores y medidas, en las variables de `:root`) |
| `js/characters.js` | el grupo, dibujado en SVG |
| `js/audio.js` | el «rin rin», la fanfarria y la voz en inglés |
| `js/store.js` | ajustes y rutinas (localStorage) + imágenes/vídeos/voz (IndexedDB) |
| `js/data.js` | las 38 rutinas de fábrica (y `CATALOG_VERSION`) |
| `js/scenes.js` | los escenarios: decorado + objeto en la mano + gesto |
| `js/app.js` | el hilo: casa → llamada → actividad → celebración |
| `js/parents.js` | la zona de padres |
| `sw.js` | el service worker que la hace funcionar sin conexión |
| `tools/make-icons.py` | vuelve a generar los iconos |

Al cambiar cualquier fichero de la lista, **sube el número de `CACHE` en
`sw.js`**; si no, los móviles que ya la tengan instalada seguirán con la versión
vieja.

### Añadir un escenario nuevo

Los escenarios están pensados para crecer. Uno nuevo es **una llamada**:

```js
Scenes.register('garden', {
  set: '<rect x="20" y="70" width="160" height="10" fill="#7dd87d"/>',  // lienzo 200×120
  prop: '<rect x="128" y="170" width="8" height="26" fill="#8a5f3c"/>', // va en la mano
  action: 'do-pickup',                 // gesto (clases .do-* en css/app.css)
  routines: ['water-plants']           // rutinas que lo usan por defecto
});
```

Y desde la zona de padres se puede asignar cualquier escenario a cualquier
rutina, sin tocar código.

### Al añadir rutinas al catálogo

Sube `CATALOG_VERSION` en `js/data.js`. Los móviles que ya tengan la app se
encontrarán **sólo las nuevas**, sin perder lo que hayan editado ni lo que
tengan desactivado.

## Licencia

Uso privado y familiar.
