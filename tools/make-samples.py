"""Genera una muestra de cada voz candidata diciendo la frase real de la app.

Se ejecuta con el python del entorno que tiene los motores instalados:

    C:\\Users\\fjavi\\AppData\\Local\\Temp\\ttslab\\v\\Scripts\\python.exe tools/make-samples.py

Escribe voces/<id>.wav y no toca nada más. La página voces.html las reproduce
para poder elegir con el oído, que es el único criterio que vale aquí.

Sólo se incluyen voces cuya salida se puede publicar en un repo público:
  · Kokoro-82M → pesos Apache-2.0, sin condiciones sobre el audio generado.
  · Piper cori / kristin → entrenadas DESDE CERO sobre grabaciones de dominio
    público (LibriVox). Se excluyen a propósito jenny, amy, alba y hfc_female:
    derivan de la voz lessac (Blizzard 2013), que es sólo para investigación.
"""

import json
import os
import sys
import wave

LAB = r"C:\Users\fjavi\AppData\Local\Temp\ttslab"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "voces")

# la frase real: saludo + rutina + repetición + piropo
TEXTO = ("Hi! It's me, Yuna! It's time to brush your teeth. "
         "Say it with me. Toothbrush! Great job!")

KOKORO = [
    ("kokoro-bf-emma", "bf_emma", "Kokoro · Emma · británica"),
    ("kokoro-bf-isabella", "bf_isabella", "Kokoro · Isabella · británica"),
    ("kokoro-af-heart", "af_heart", "Kokoro · Heart · americana"),
    ("kokoro-af-bella", "af_bella", "Kokoro · Bella · americana"),
]

PIPER = [
    ("piper-cori", "cori.onnx", "Piper · Cori · británica"),
    ("piper-kristin", "kristin.onnx", "Piper · Kristin · americana"),
]


def guarda(path, audio, sr):
    import soundfile as sf
    sf.write(path, audio, sr)


def kokoro():
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(LAB, "kokoro-v1.0.onnx"), os.path.join(LAB, "voices-v1.0.bin"))
    hechas = []
    for ident, voz, etiqueta in KOKORO:
        lang = "en-gb" if voz.startswith("b") else "en-us"
        audio, sr = k.create(TEXTO, voice=voz, speed=0.95, lang=lang)
        guarda(os.path.join(OUT, ident + ".wav"), audio, sr)
        hechas.append({"id": ident, "etiqueta": etiqueta, "motor": "Kokoro-82M (Apache-2.0)"})
        print("  ", etiqueta)
    return hechas


def piper():
    from piper import PiperVoice
    hechas = []
    for ident, fichero, etiqueta in PIPER:
        ruta = os.path.join(LAB, fichero)
        if not os.path.exists(ruta):
            print("   (falta", fichero, "— la salto)")
            continue
        voz = PiperVoice.load(ruta)
        destino = os.path.join(OUT, ident + ".wav")
        with wave.open(destino, "wb") as w:
            voz.synthesize_wav(TEXTO, w)
        hechas.append({"id": ident, "etiqueta": etiqueta, "motor": "Piper (dominio público)"})
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
