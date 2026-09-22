"""Genera una muestra de cada voz candidata diciendo la frase real de la app.

Se ejecuta con el python del entorno que tiene los motores instalados:

    C:\\Users\\fjavi\\AppData\\Local\\Temp\\ttslab\\v\\Scripts\\python.exe tools/make-samples.py

Escribe voces/<id>.wav y voces/voces.json; la página voces.html los reproduce
para poder elegir con el oído, que es el único criterio que vale aquí.

── Por qué hay versiones «de niña» ─────────────────────────────────────────────
Ninguna voz libre es infantil: todas son de mujer adulta y suenan serias. El
truco de toda la vida es generar MÁS LENTO y luego reproducir MÁS RÁPIDO: sube
el tono (que es lo que hace a una voz sonar joven) y la duración vuelve a ser la
normal, así que no queda ni acelerada ni pastosa. Aquí se hace remuestreando la
onda: factor 1.12 ≈ un poco más de niña, 1.22 ≈ claramente de niña.

Sólo se incluyen voces cuya salida se puede publicar en un repo público:
  · Kokoro-82M → pesos Apache-2.0, sin condiciones sobre el audio generado.
  · Piper cori / kristin → entrenadas DESDE CERO sobre grabaciones de dominio
    público (LibriVox). Se excluyen a propósito jenny, amy, alba y hfc_female:
    derivan de la voz lessac (Blizzard 2013), permitida sólo para investigación.
"""

import json
import os
import sys
import wave

import numpy as np

LAB = r"C:\Users\fjavi\AppData\Local\Temp\ttslab"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "voces")

# la frase real: saludo + rutina + repetición + piropo
TEXTO = ("Hi! It's me, Yuna! It's time to brush your teeth. "
         "Say it with me. Toothbrush! Great job!")

# (id, voz de kokoro, etiqueta, tono)
#   tono 1.00 = tal cual · 1.12 = un poco más de niña · 1.22 = claramente de niña
KOKORO = [
    ("emma", "bf_emma", "Emma · británica", 1.00),
    ("emma-nina", "bf_emma", "Emma · británica · MÁS DE NIÑA", 1.14),
    ("lily", "bf_lily", "Lily · británica · la más juvenil", 1.00),
    ("lily-nina", "bf_lily", "Lily · británica · MÁS DE NIÑA", 1.16),
    ("alice", "bf_alice", "Alice · británica", 1.00),
    ("alice-nina", "bf_alice", "Alice · británica · MÁS DE NIÑA", 1.16),
    ("sky-nina", "af_sky", "Sky · americana · MÁS DE NIÑA", 1.16),
    ("nicole-nina", "af_nicole", "Nicole · americana · MÁS DE NIÑA", 1.14),
    ("jessica-nina", "af_jessica", "Jessica · americana · MÁS DE NIÑA", 1.16),
    ("heart-nina", "af_heart", "Heart · americana · MÁS DE NIÑA", 1.14),
    ("emma-mucho", "bf_emma", "Emma · británica · MUY de niña", 1.26),
    ("lily-mucho", "bf_lily", "Lily · británica · MUY de niña", 1.26),
]

PIPER = [
    ("cori", "cori.onnx", "Cori · británica", 1.00),
    ("cori-nina", "cori.onnx", "Cori · británica · MÁS DE NIÑA", 1.16),
    ("kristin-nina", "kristin.onnx", "Kristin · americana · MÁS DE NIÑA", 1.16),
]


def sube_el_tono(audio, factor):
    """Remuestrea la onda: sube el tono y acorta la duración en el mismo factor.

    Como generamos el audio MÁS LENTO en la misma proporción, la duración final
    queda igual que la original y sólo cambia el tono."""
    if factor == 1.0:
        return audio
    n = int(len(audio) / factor)
    viejo = np.arange(len(audio))
    nuevo = np.linspace(0, len(audio) - 1, n)
    return np.interp(nuevo, viejo, audio).astype(np.float32)


def guarda(path, audio, sr):
    import soundfile as sf
    sf.write(path, audio, sr)


def kokoro():
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(LAB, "kokoro-v1.0.onnx"), os.path.join(LAB, "voices-v1.0.bin"))
    hechas = []
    for ident, voz, etiqueta, tono in KOKORO:
        lang = "en-gb" if voz.startswith("b") else "en-us"
        # más lento en la misma proporción en que luego subimos el tono
        audio, sr = k.create(TEXTO, voice=voz, speed=0.95 / tono, lang=lang)
        audio = sube_el_tono(np.asarray(audio, dtype=np.float32), tono)
        guarda(os.path.join(OUT, ident + ".wav"), audio, sr)
        hechas.append({"id": ident, "etiqueta": etiqueta,
                       "motor": "Kokoro-82M (Apache-2.0)",
                       "nina": tono > 1.0})
        print("  ", etiqueta)
    return hechas


def piper():
    from piper import PiperVoice
    import soundfile as sf
    hechas = []
    for ident, fichero, etiqueta, tono in PIPER:
        ruta = os.path.join(LAB, fichero)
        if not os.path.exists(ruta):
            print("   (falta", fichero, "— la salto)")
            continue
        voz = PiperVoice.load(ruta)
        destino = os.path.join(OUT, ident + ".wav")
        with wave.open(destino, "wb") as w:
            voz.synthesize_wav(TEXTO, w)
        if tono > 1.0:
            audio, sr = sf.read(destino, dtype="float32")
            sf.write(destino, sube_el_tono(audio, tono), sr)
        hechas.append({"id": ident, "etiqueta": etiqueta,
                       "motor": "Piper (dominio público)",
                       "nina": tono > 1.0})
        print("  ", etiqueta)
    return hechas


def main():
    os.makedirs(OUT, exist_ok=True)
    print("Frase:", TEXTO)
    print("Kokoro:")
    hechas = kokoro()
    print("Piper:")
    hechas += piper()

    with open(os.path.join(OUT, "voces.json"), "w", encoding="utf-8") as f:
        json.dump({"texto": TEXTO, "voces": hechas}, f, ensure_ascii=False, indent=1)

    total = sum(os.path.getsize(os.path.join(OUT, v["id"] + ".wav")) for v in hechas)
    print("\n%d muestras (%.1f MB) en voces/" % (len(hechas), total / 1e6))


if __name__ == "__main__":
    sys.exit(main())
