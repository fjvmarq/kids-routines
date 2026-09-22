"""Dibuja los iconos de la app (fondo de neón + estrella + micrófono).

    python tools/make-icons.py

Escribe icons/icon-192.png, icons/icon-512.png y icons/maskable-512.png.
"""
import math
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "icons")


def star_points(cx, cy, r, inner=0.44, rot=-math.pi / 2):
    pts = []
    for i in range(10):
        rr = r if i % 2 == 0 else r * inner
        a = math.pi / 5 * i + rot
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return pts


def draw_icon(size, pad_ratio=0.0):
    """pad_ratio > 0 deja aire alrededor: es lo que pide un icono 'maskable'."""
    ss = 4                                   # supersampling, para que no salga dentado
    s = size * ss
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # fondo: degradado diagonal morado → azul
    for y in range(s):
        t = y / (s - 1)
        r = int(0x2a + (0x12 - 0x2a) * t)
        g = int(0x10 + 0x0a * (1 - t))
        b = int(0x52 + (0x2a - 0x52) * t)
        d.line([(0, y), (s, y)], fill=(r, max(g, 8), b, 255))

    # un par de halos de color
    halo = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hd.ellipse([-s * 0.1, -s * 0.25, s * 0.75, s * 0.5], fill=(155, 92, 255, 90))
    hd.ellipse([s * 0.45, s * 0.5, s * 1.15, s * 1.2], fill=(63, 224, 255, 70))
    img = Image.alpha_composite(img, halo)
    d = ImageDraw.Draw(img)

    cx = cy = s / 2
    span = s * (0.5 - pad_ratio)

    # estrella grande
    d.polygon(star_points(cx, cy - span * 0.06, span * 0.92), fill=(255, 212, 71, 255))
    d.polygon(star_points(cx, cy - span * 0.06, span * 0.62), fill=(255, 150, 200, 255))

    # micrófono en el centro
    mw, mh = span * 0.26, span * 0.44
    d.rounded_rectangle([cx - mw / 2, cy - span * 0.34, cx + mw / 2, cy - span * 0.34 + mh],
                        radius=mw / 2, fill=(46, 28, 84, 255))
    d.arc([cx - mw * 0.95, cy - span * 0.16, cx + mw * 0.95, cy + span * 0.3],
          start=0, end=180, fill=(46, 28, 84, 255), width=int(span * 0.07))
    d.line([cx, cy + span * 0.22, cx, cy + span * 0.42], fill=(46, 28, 84, 255), width=int(span * 0.07))

    # estrellitas pequeñas
    for (fx, fy, fr) in ((0.22, 0.2, 0.09), (0.8, 0.28, 0.06), (0.74, 0.8, 0.08)):
        d.polygon(star_points(s * fx, s * fy, s * fr), fill=(255, 255, 255, 235))

    return img.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    draw_icon(192).save(os.path.join(OUT, "icon-192.png"))
    draw_icon(512).save(os.path.join(OUT, "icon-512.png"))
    draw_icon(512, pad_ratio=0.12).save(os.path.join(OUT, "maskable-512.png"))
    print("iconos escritos en", OUT)


if __name__ == "__main__":
    main()
