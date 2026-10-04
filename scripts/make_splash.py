"""Generate the iOS launch screens (apple-touch-startup-image) for Titra.

The installed PWA otherwise flashes white while it loads. Each screen is the app's night
lab: graph paper, the two bioluminescent halos, the icon with its glow and the wordmark.
Run:  python scripts/make_splash.py   (writes public/splash/*.png and prints the <link> tags to paste in index.html)
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "splash"
OUT.mkdir(parents=True, exist_ok=True)

BG = (5, 11, 13)
MINT = (92, 242, 196)
VIOLET = (134, 114, 240)
INK = (230, 251, 244)

# (css width, css height, device pixel ratio) of the iPhones in use today.
DEVICES = [
    (440, 956, 3),  # 16 Pro Max
    (430, 932, 3),  # 15/14 Pro Max, 16 Plus
    (428, 926, 3),  # 14 Plus, 13/12 Pro Max
    (414, 896, 3),  # 11 Pro Max, XS Max
    (414, 896, 2),  # 11, XR
    (402, 874, 3),  # 16 Pro
    (393, 852, 3),  # 15/14 Pro, 15, 16
    (390, 844, 3),  # 14, 13, 12
    (375, 812, 3),  # 13/12 mini, X, XS, 11 Pro
    (414, 736, 3),  # 8 Plus
    (375, 667, 2),  # SE, 8
]


def halo(size: tuple[int, int], center: tuple[float, float], radius: float, color, alpha: float) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    steps = 40
    for i in range(steps, 0, -1):
        r = radius * i / steps
        a = int(255 * alpha * (1 - i / steps) ** 2)
        d.ellipse([center[0] - r, center[1] - r, center[0] + r, center[1] + r], fill=(*color, a))
    return layer.filter(ImageFilter.GaussianBlur(radius * 0.05))


def draw(width: int, height: int, scale: int) -> Image.Image:
    img = Image.new("RGBA", (width, height), (*BG, 255))
    unit = scale  # one css pixel

    # Graph paper.
    grid = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    step = 28 * unit
    for x in range(0, width, step):
        gd.line([(x, 0), (x, height)], fill=(*MINT, 14), width=max(1, unit // 2))
    for y in range(0, height, step):
        gd.line([(0, y), (width, y)], fill=(*MINT, 14), width=max(1, unit // 2))
    img.alpha_composite(grid)

    img.alpha_composite(halo((width, height), (width * 0.05, height * 0.02), width * 0.95, MINT, 0.20))
    img.alpha_composite(halo((width, height), (width * 0.98, height * 0.0), width * 0.75, VIOLET, 0.16))

    # Icon with a mint glow, slightly above the optical centre.
    icon = Image.open(ROOT / "public" / "icons" / "icon-512.png").convert("RGBA")
    side = int(width * 0.26)
    icon = icon.resize((side, side), Image.LANCZOS)
    cx, cy = width // 2, int(height * 0.44)
    glow = halo((width, height), (cx, cy), side * 1.1, MINT, 0.38)
    img.alpha_composite(glow)
    img.alpha_composite(icon, (cx - side // 2, cy - side // 2))

    # Wordmark and subtitle, in the silkscreen mono of the app.
    bold = ImageFont.truetype("C:/Windows/Fonts/consolab.ttf", int(26 * unit))
    small = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", int(10.5 * unit))

    def tracked(text: str, font, y: int, fill, tracking: float):
        widths = [font.getlength(ch) for ch in text]
        total = sum(widths) + tracking * (len(text) - 1)
        x = (width - total) / 2
        d = ImageDraw.Draw(img)
        for ch, w in zip(text, widths):
            d.text((x, y), ch, font=font, fill=fill)
            x += w + tracking

    tracked("TITRA", bold, int(cy + side / 2 + 26 * unit), (*INK, 235), 9 * unit)
    tracked("LABORATORIO PERSONAL", small, int(cy + side / 2 + 26 * unit + 40 * unit), (*MINT, 150), 3.2 * unit)
    return img.convert("RGB")


def main() -> None:
    links = []
    for w, h, dpr in DEVICES:
        name = f"splash-{w * dpr}x{h * dpr}.png"
        draw(w * dpr, h * dpr, dpr).save(OUT / name, optimize=True)
        media = (
            f"(device-width: {w}px) and (device-height: {h}px) and "
            f"(-webkit-device-pixel-ratio: {dpr}) and (orientation: portrait)"
        )
        links.append(f'    <link rel="apple-touch-startup-image" media="{media}" href="./splash/{name}" />')
        print(f"{name}  {(OUT / name).stat().st_size // 1024} kB")
    (OUT / "links.html.txt").write_text("\n".join(links) + "\n", encoding="utf-8")
    print("\n".join(links))


if __name__ == "__main__":
    main()
