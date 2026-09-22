"""Aligera un modelo VRM reduciendo sus texturas.

    python tools/shrink-vrm.py entrada.vrm salida.vrm [--max 1024]

Los modelos de VRoid traen texturas de 2048 px: 15 MB por chica. En la pantalla
de un móvil no se distingue 2048 de 1024, y a 1024 pesan la cuarta parte. Las
licencias CC0 de estos modelos permiten modificarlos.

Qué hace: un .vrm es un glTF binario (GLB) = cabecera + trozo JSON + trozo BIN.
Se abre cada imagen del BIN, se reduce si pasa de --max, se vuelve a guardar en
PNG (conserva la transparencia que usa el sombreado MToon) y se vuelve a empaquetar
el BIN entero, recolocando TODOS los bufferViews (las mallas también se mueven de
sitio). Los índices de imagen, textura y material no cambian, así que la extensión
VRM, que apunta a texturas por índice, sigue siendo válida.
"""

import argparse
import io
import json
import struct
import sys

from PIL import Image

GLB_MAGIC = 0x46546C67
CHUNK_JSON = 0x4E4F534A
CHUNK_BIN = 0x004E4942


def lee_glb(path):
    data = open(path, "rb").read()
    magic, version, length = struct.unpack_from("<III", data, 0)
    if magic != GLB_MAGIC:
        sys.exit("%s no es un GLB/VRM" % path)
    pos, gltf, binario = 12, None, b""
    while pos < length:
        clen, ctype = struct.unpack_from("<II", data, pos)
        trozo = data[pos + 8: pos + 8 + clen]
        if ctype == CHUNK_JSON:
            gltf = json.loads(trozo.decode("utf-8"))
        elif ctype == CHUNK_BIN:
            binario = trozo
        pos += 8 + clen
    return gltf, binario


def escribe_glb(path, gltf, binario):
    js = json.dumps(gltf, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    js += b" " * ((4 - len(js) % 4) % 4)
    binario += b"\x00" * ((4 - len(binario) % 4) % 4)
    total = 12 + 8 + len(js) + 8 + len(binario)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", GLB_MAGIC, 2, total))
        f.write(struct.pack("<II", len(js), CHUNK_JSON))
        f.write(js)
        f.write(struct.pack("<II", len(binario), CHUNK_BIN))
        f.write(binario)


def reduce_imagen(datos, maximo):
    im = Image.open(io.BytesIO(datos))
    im.load()
    w, h = im.size
    if max(w, h) <= maximo:
        return datos, (w, h), (w, h)
    esc = maximo / float(max(w, h))
    nuevo = (max(1, int(round(w * esc))), max(1, int(round(h * esc))))
    im = im.resize(nuevo, Image.LANCZOS)
    out = io.BytesIO()
    im.save(out, format="PNG", optimize=True)
    return out.getvalue(), (w, h), nuevo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("entrada")
    ap.add_argument("salida")
    ap.add_argument("--max", type=int, default=1024, help="lado máximo de las texturas (px)")
    args = ap.parse_args()

    gltf, binario = lee_glb(args.entrada)
    views = gltf.get("bufferViews", [])

    # el contenido de cada bufferView, para poder recolocarlos todos
    trozos = []
    for v in views:
        ini = v.get("byteOffset", 0)
        trozos.append(bytearray(binario[ini: ini + v["byteLength"]]))

    # reducir las imágenes que viven dentro del BIN
    antes = despues = 0
    for i, img in enumerate(gltf.get("images", [])):
        if "bufferView" not in img:
            continue
        bv = img["bufferView"]
        viejo = bytes(trozos[bv])
        nuevo, t0, t1 = reduce_imagen(viejo, args.max)
        if nuevo is not viejo and t0 != t1:
            img["mimeType"] = "image/png"
            trozos[bv] = bytearray(nuevo)
        antes += len(viejo)
        despues += len(trozos[bv])
        print("  imagen %2d  %4dx%-4d -> %4dx%-4d  %7.0f KB -> %7.0f KB" % (
            i, t0[0], t0[1], t1[0], t1[1], len(viejo) / 1024, len(trozos[bv]) / 1024))

    # volver a empaquetar el BIN, alineando cada trozo a 4 bytes
    nuevo_bin = bytearray()
    for v, trozo in zip(views, trozos):
        nuevo_bin += b"\x00" * ((4 - len(nuevo_bin) % 4) % 4)
        v["byteOffset"] = len(nuevo_bin)
        v["byteLength"] = len(trozo)
        nuevo_bin += trozo

    if gltf.get("buffers"):
        gltf["buffers"][0]["byteLength"] = len(nuevo_bin)

    escribe_glb(args.salida, gltf, bytes(nuevo_bin))

    import os
    print("\n%s: %.1f MB -> %.1f MB (texturas %.1f MB -> %.1f MB)" % (
        os.path.basename(args.salida),
        os.path.getsize(args.entrada) / 1e6, os.path.getsize(args.salida) / 1e6,
        antes / 1e6, despues / 1e6))


if __name__ == "__main__":
    main()
