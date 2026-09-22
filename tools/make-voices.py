"""Genera los audios en inglés de la app: UNA VOZ POR CHICA.

    <python del entorno de motores> tools/make-voices.py            todas
    <python del entorno de motores> tools/make-voices.py --solo yuna
    python tools/make-voices.py --list                              ver las frases

Por qué existe: la voz del móvil cambia de un teléfono a otro y puede sonar mal
(o hablar inglés con acento español si no hay voz inglesa instalada). Con este
pack la niña oye SIEMPRE la misma voz, y además cada chica tiene la suya, que es
lo que las hace distintas al llamar.

Las voces, y por qué se pueden publicar:
  · Kokoro-82M → pesos Apache-2.0, que no ponen ninguna condición sobre el audio
    generado. Emma (bf_emma) y Lily (bf_lily) son británicas.
  · Piper cori → entrenada DESDE CERO con grabaciones de dominio público
    (LibriVox). Se evitan a propósito jenny/amy/alba/hfc_female: derivan de la
    voz lessac (Blizzard 2013), permitida sólo para investigación.

El tono: ninguna voz libre es infantil, todas son de mujer adulta. Se generan
más lentas y se les sube el tono remuestreando la onda, así suenan más jóvenes
y la duración queda igual (ni acelerada ni pastosa).

Las claves de los ficheros las decide slug(), que es la MISMA regla que
Pack.key() en js/audio.js. Si cambias una, cambia la otra.

Hace falta el entorno con los motores instalados:
    C:\\Users\\fjavi\\AppData\\Local\\Temp\\ttslab\\v\\Scripts\\python.exe
"""

import argparse
import json
import os
import re
import sys
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, "audio")
LAB = r"C:\Users\fjavi\AppData\Local\Temp\ttslab"

# ── una voz por chica ────────────────────────────────────────────────────────
VOCES = [
    {"id": "yuna",  "motor": "kokoro", "voz": "bf_emma", "lang": "en-gb",
     "tono": 1.14, "nombre": "Emma (británica)"},
    {"id": "nari",  "motor": "kokoro", "voz": "bf_lily", "lang": "en-gb",
     "tono": 1.16, "nombre": "Lily (británica)"},
    {"id": "soomi", "motor": "piper",  "voz": "cori.onnx",
     "tono": 1.16, "nombre": "Cori (británica)"},
]

# ── frases fijas de la app: tienen que coincidir LETRA A LETRA con js/app.js ──
FIXED = [
    "Congratulations!",
    "OK! See you later!",
    "Say it with me.",
    "Let's go!",
    "Off you go!",
    "Finished!",
    "You have one star today!",
    "Wow! You finished all your morning routines!",
    "Wow! You finished all your afternoon routines!",
    "Wow! You finished all your evening routines!",
]
FIXED += ["You have %d stars today!" % n for n in range(2, 41)]
FIXED += ["Let's count to %d!" % n for n in (5, 10, 20, 30)]
FIXED += [str(n) for n in range(1, 41)]          # la cuenta en voz alta


def slug(text):
    """La misma regla que Pack.key() en js/audio.js."""
    t = text.lower()
    t = re.sub(r"[\u2018\u2019']", "", t)
    t = re.sub(r"[^a-z0-9]+", "-", t)
    return t.strip("-")[:70]


def js_strings(path, field):
    src = open(path, encoding="utf-8").read()
    out = []
    for m in re.finditer(field + r"\s*:\s*(['\"])(.*?)(?<!\\)\1", src, re.S):
        out.append(m.group(2).replace("\\'", "'").replace('\\"', '"'))
    return out


def collect():
    """Todas las frases que la app puede decir, sin repetir."""
    data = os.path.join(ROOT, "js", "data.js")
    chars = os.path.join(ROOT, "js", "characters.js")

    frases = []
    frases += js_strings(data, "phrase")
    frases += js_strings(data, "done")
    frases += js_strings(data, "text")          # los pasos
    frases += js_strings(chars, "hello")
    frases += [w + "!" for w in js_strings(data, "word")]

    src = open(data, encoding="utf-8").read()
    m = re.search(r"const PRAISE = \[(.*?)\]", src, re.S)
    if m:
        frases += [g[1].replace("\\'", "'") for g in re.findall(r"(['\"])(.*?)(?<!\\)\1", m.group(1))]

    frases += FIXED

    vistas, uniq = set(), []
    for f in frases:
        f = f.strip()
        k = slug(f)
        if not f or not k or k in vistas:
            continue
        vistas.add(k)
        uniq.append(f)
    return uniq


def sube_el_tono(audio, factor):
    """Remuestrea: sube el tono y acorta igual. Como se generó más lento en la
    misma proporción, la duración final es la de siempre."""
    import numpy as np
    if factor == 1.0:
        return audio
    n = int(len(audio) / factor)
    viejo = np.arange(len(audio))
    nuevo = np.linspace(0, len(audio) - 1, n)
    return np.interp(nuevo, viejo, audio).astype("float32")


def genera_kokoro(cfg, frases, destino):
    import numpy as np
    import soundfile as sf
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(LAB, "kokoro-v1.0.onnx"), os.path.join(LAB, "voices-v1.0.bin"))
    hechos = 0
    for i, texto in enumerate(frases, 1):
        audio, sr = k.create(texto, voice=cfg["voz"], speed=0.95 / cfg["tono"], lang=cfg["lang"])
        audio = sube_el_tono(np.asarray(audio, dtype="float32"), cfg["tono"])
        sf.write(os.path.join(destino, slug(texto) + ".mp3"), audio, sr, format="MP3")
        hechos += 1
        if i % 40 == 0:
            print("    %d/%d" % (i, len(frases)), flush=True)
    return hechos


def genera_piper(cfg, frases, destino):
    import io
    import soundfile as sf
    from piper import PiperVoice
    voz = PiperVoice.load(os.path.join(LAB, cfg["voz"]))
    hechos = 0
    for i, texto in enumerate(frases, 1):
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            voz.synthesize_wav(texto, w)
        buf.seek(0)
        audio, sr = sf.read(buf, dtype="float32")
        audio = sube_el_tono(audio, cfg["tono"])
        sf.write(os.path.join(destino, slug(texto) + ".mp3"), audio, sr, format="MP3")
        hechos += 1
        if i % 40 == 0:
            print("    %d/%d" % (i, len(frases)), flush=True)
    return hechos


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true", help="sólo enseña las frases")
    ap.add_argument("--solo", help="generar sólo la voz de esta chica (yuna/nari/soomi)")
    ap.add_argument("--missing", action="store_true",
                    help="generar sólo las frases que aún no tienen fichero")
    args = ap.parse_args()

    frases = collect()
    if args.list:
        for f in frases:
            print("%-70s  %s.mp3" % (f, slug(f)))
        print("\n%d frases" % len(frases))
        return

    quiere = [v for v in VOCES if not args.solo or v["id"] == args.solo]
    if not quiere:
        sys.exit("No conozco la voz %r" % args.solo)

    os.makedirs(AUDIO, exist_ok=True)
    print("%d frases × %d voces\n" % (len(frases), len(quiere)))

    manifest_path = os.path.join(AUDIO, "manifest.json")
    manifest = {"base": "audio/", "files": {}, "voices": {}}
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, encoding="utf-8") as f:
                viejo = json.load(f)
            if "voices" in viejo:
                manifest["voices"] = viejo["voices"]
        except Exception:
            pass

    for cfg in quiere:
        destino = os.path.join(AUDIO, cfg["id"])
        os.makedirs(destino, exist_ok=True)
        lista = frases
        if args.missing:
            lista = [f for f in frases
                     if not os.path.exists(os.path.join(destino, slug(f) + ".mp3"))]
        print("%s — %s (%d frases)" % (cfg["id"], cfg["nombre"], len(lista)), flush=True)
        if not lista:
            pass
        elif cfg["motor"] == "kokoro":
            genera_kokoro(cfg, lista, destino)
        else:
            genera_piper(cfg, lista, destino)
        manifest["voices"][cfg["id"]] = {
            "dir": cfg["id"] + "/", "voice": cfg["nombre"], "engine": cfg["motor"],
        }
        print("  hecho\n", flush=True)

    manifest["files"] = {slug(f): slug(f) + ".mp3" for f in frases}
    manifest["default"] = "yuna"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)

    total = 0
    for cfg in VOCES:
        d = os.path.join(AUDIO, cfg["id"])
        if os.path.isdir(d):
            total += sum(os.path.getsize(os.path.join(d, x)) for x in os.listdir(d))
    print("Listo: %d frases por voz · %.1f MB en total" % (len(frases), total / 1e6))


if __name__ == "__main__":
    main()
