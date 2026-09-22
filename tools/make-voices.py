"""Genera los audios en inglés de la app (el «pack de voz»).

    python tools/make-voices.py --list          ve qué frases hacen falta
    python tools/make-voices.py --voices        ve qué voces inglesas hay
    python tools/make-voices.py                 genera audio/*.wav + manifest.json
    python tools/make-voices.py --voice "Microsoft Zira Desktop"

Por qué existe: la voz del móvil cambia de un teléfono a otro y puede sonar mal
(o hablar inglés con acento español si no hay voz inglesa instalada). Con este
pack, la niña oye SIEMPRE la misma voz inglesa. La app usa el clip si existe y,
si falta, recurre a la voz del aparato — así que generar el pack nunca rompe
nada, sólo mejora lo que se oye.

Ahora mismo sintetiza con las voces de Windows (SAPI). Cuando tengamos una voz
mejor, se vuelve a ejecutar con --voice y se regeneran todos los ficheros: la
app no cambia.

Las claves de los ficheros las decide slug(), que es la MISMA regla que
Pack.key() en js/audio.js. Si cambias una, cambia la otra.
"""

import argparse
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, "audio")

# ── frases fijas de la app (tienen que coincidir LETRA A LETRA con lo que dice
#    js/app.js, porque la clave se calcula del texto)
FIXED = [
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
    t = re.sub(r"[‘’']", "", t)
    t = re.sub(r"[^a-z0-9]+", "-", t)
    return t.strip("-")[:70]


def js_strings(path, field):
    """Saca los valores de un campo de un fichero .js, con comillas simples o dobles."""
    src = open(path, encoding="utf-8").read()
    out = []
    for m in re.finditer(field + r"\s*:\s*(['\"])(.*?)(?<!\\)\1", src, re.S):
        out.append(m.group(2).replace("\\'", "'").replace('\\"', '"'))
    return out


def collect():
    """Todas las frases que la app puede decir, sin repetir."""
    data = os.path.join(ROOT, "js", "data.js")
    chars = os.path.join(ROOT, "js", "characters.js")

    phrases = []
    phrases += js_strings(data, "phrase")
    phrases += js_strings(data, "done")
    phrases += js_strings(data, "text")          # los pasos
    phrases += js_strings(chars, "hello")

    words = js_strings(data, "word")
    phrases += [w + "!" for w in words]          # la palabra suelta, al repetir

    # los piropos, que están en una lista suelta
    src = open(data, encoding="utf-8").read()
    m = re.search(r"const PRAISE = \[(.*?)\]", src, re.S)
    if m:
        phrases += re.findall(r"(['\"])(.*?)(?<!\\)\1", m.group(1)) and \
            [g[1].replace("\\'", "'") for g in re.findall(r"(['\"])(.*?)(?<!\\)\1", m.group(1))]

    phrases += FIXED

    seen, uniq = set(), []
    for p in phrases:
        p = p.strip()
        k = slug(p)
        if not p or not k or k in seen:
            continue
        seen.add(k)
        uniq.append(p)
    return uniq


# ── síntesis con las voces de Windows ────────────────────────────────────────

PS_LIST = r"""
Add-Type -AssemblyName System.Speech
(New-Object System.Speech.Synthesis.SpeechSynthesizer).GetInstalledVoices() |
  ForEach-Object { '{0}|{1}|{2}' -f $_.VoiceInfo.Name, $_.VoiceInfo.Culture, $_.VoiceInfo.Gender }
"""


def list_voices():
    out = subprocess.run(["powershell", "-NoProfile", "-Command", PS_LIST],
                         capture_output=True, text=True)
    voces = []
    for line in out.stdout.splitlines():
        parts = line.strip().split("|")
        if len(parts) == 3:
            voces.append({"name": parts[0], "culture": parts[1], "gender": parts[2]})
    return voces


def pick_voice(voces, preferida=None):
    if preferida:
        for v in voces:
            if v["name"].lower() == preferida.lower():
                return v
        sys.exit("No encuentro la voz %r. Las que hay:\n  %s" %
                 (preferida, "\n  ".join(v["name"] for v in voces)))
    ingles = [v for v in voces if v["culture"].lower().startswith("en")]
    if not ingles:
        sys.exit(
            "No hay ninguna voz INGLESA instalada en Windows.\n"
            "Instálala en: Configuración > Hora e idioma > Voz > Agregar voces > English.\n"
            "Sin voz inglesa no se puede generar el pack (y una voz española leyendo\n"
            "inglés es justo lo que queremos evitar)."
        )
    mujeres = [v for v in ingles if v["gender"].lower() == "female"]
    return (mujeres or ingles)[0]


PS_SPEAK = r"""
Add-Type -AssemblyName System.Speech
$jobs = Get-Content -Raw -Encoding UTF8 '{jobs}' | ConvertFrom-Json
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('{voice}')
$s.Rate = {rate}
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, 'Sixteen', 'Mono')
foreach ($j in $jobs) {{
  $s.SetOutputToWaveFile($j.file, $fmt)
  $s.Speak($j.text)
}}
$s.SetOutputToNull()
$s.Dispose()
"""


def synth(frases, voz, rate, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    jobs = [{"text": t, "file": os.path.join(out_dir, slug(t) + ".wav")} for t in frases]
    jobs_path = os.path.join(out_dir, "_jobs.json")
    with open(jobs_path, "w", encoding="utf-8") as f:
        json.dump(jobs, f, ensure_ascii=False)

    script = PS_SPEAK.format(jobs=jobs_path.replace("'", "''"), voice=voz["name"], rate=rate)
    res = subprocess.run(["powershell", "-NoProfile", "-Command", script],
                         capture_output=True, text=True)
    os.remove(jobs_path)
    if res.returncode != 0:
        sys.exit("PowerShell falló:\n" + (res.stderr or res.stdout))
    return jobs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true", help="sólo enseña las frases")
    ap.add_argument("--voices", action="store_true", help="sólo enseña las voces instaladas")
    ap.add_argument("--voice", help="nombre exacto de la voz a usar")
    ap.add_argument("--rate", type=int, default=0, help="velocidad SAPI, de -10 a 10")
    args = ap.parse_args()

    if args.voices:
        for v in list_voices():
            print("%-34s %-8s %s" % (v["name"], v["culture"], v["gender"]))
        return

    frases = collect()
    if args.list:
        for f in frases:
            print("%-70s  %s.wav" % (f, slug(f)))
        print("\n%d frases" % len(frases))
        return

    voz = pick_voice(list_voices(), args.voice)
    print("Voz: %s (%s, %s)" % (voz["name"], voz["culture"], voz["gender"]))
    print("Frases: %d" % len(frases))

    jobs = synth(frases, voz, args.rate, AUDIO)

    files, faltan, total = {}, 0, 0
    for j, texto in zip(jobs, frases):
        if os.path.exists(j["file"]) and os.path.getsize(j["file"]) > 1000:
            files[slug(texto)] = os.path.basename(j["file"])
            total += os.path.getsize(j["file"])
        else:
            faltan += 1

    manifest = {
        "base": "audio/",
        "voice": voz["name"],
        "culture": voz["culture"],
        "files": files,
    }
    with open(os.path.join(AUDIO, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)

    print("Escritos %d clips (%.1f MB) en audio/" % (len(files), total / 1e6))
    if faltan:
        print("⚠️  %d frases no se generaron" % faltan)
    print("La app los usará sola: si falta un clip, habla la voz del móvil.")


if __name__ == "__main__":
    main()
