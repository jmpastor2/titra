"""Generate Titra PWA icons (PNG) and the SVG source.

Motif: an ascending titration staircase with a dot at the top (dose reaching target),
on a deep-navy rounded square. Run:  python scripts/make_icons.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

NAVY = (10, 11, 16, 255)
TEAL = (143, 147, 255, 255)
TEAL_DARK = (98, 102, 230, 255)
WHITE = (243, 244, 248, 255)


def draw_icon(size: int, maskable: bool = False, transparent_bg: bool = False) -> Image.Image:
    scale = 8  # supersample for crisp edges
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    pad = 0 if maskable else int(s * 0.06)
    radius = int(s * 0.22)
    if not transparent_bg:
        d.rounded_rectangle([pad, pad, s - pad, s - pad], radius=radius, fill=NAVY)

    # Four rounded bars rising left to right: a titration, the last step lit.
    safe = int(s * (0.24 if maskable else 0.22))
    x0, y0, x1, y1 = safe, safe, s - safe, s - safe
    w = x1 - x0
    h = y1 - y0
    n = 4
    gap = w * 0.09
    bw = (w - gap * (n - 1)) / n
    for i in range(n):
        bh = h * (0.34 + 0.22 * i)
        bx0 = x0 + i * (bw + gap)
        fill = WHITE if i == n - 1 else (*TEAL[:3], int(255 * (0.42 + 0.2 * i)))
        layer = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        ImageDraw.Draw(layer).rounded_rectangle(
            [bx0, y1 - bh, bx0 + bw, y1], radius=int(bw / 2), fill=fill
        )
        img.alpha_composite(layer)

    return img.resize((size, size), Image.LANCZOS)


def draw_badge(size: int) -> Image.Image:
    """Monochrome silhouette for the Android status bar: white on transparent."""
    img = draw_icon(size, maskable=True, transparent_bg=True)
    alpha = img.getchannel("A")
    white = Image.new("RGBA", img.size, (255, 255, 255, 0))
    white.putalpha(alpha)
    return white


def main() -> None:
    draw_badge(72).save(OUT / "badge-72.png")
    draw_icon(192).save(OUT / "icon-192.png")
    draw_icon(512).save(OUT / "icon-512.png")
    draw_icon(512, maskable=True).save(OUT / "icon-512-maskable.png")
    draw_icon(180).save(OUT / "apple-touch-icon.png")
    draw_icon(64).save(OUT / "favicon-64.png")

    svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="6" y="6" width="88" height="88" rx="22" fill="#0a0b10"/>
  <rect x="22" y="58.2" width="11.7" height="19.8" rx="5.85" fill="#8f93ff" fill-opacity="0.42"/>
  <rect x="37.4" y="45.4" width="11.7" height="32.6" rx="5.85" fill="#8f93ff" fill-opacity="0.62"/>
  <rect x="52.9" y="32.6" width="11.7" height="45.4" rx="5.85" fill="#8f93ff" fill-opacity="0.82"/>
  <rect x="68.3" y="19.8" width="11.7" height="58.2" rx="5.85" fill="#f3f4f8"/>
</svg>
"""
    (OUT / "icon.svg").write_text(svg, encoding="utf-8")
    print("icons written to", OUT)


if __name__ == "__main__":
    main()
