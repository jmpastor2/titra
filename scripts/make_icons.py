"""Generate Titra PWA icons (PNG) and the SVG source.

Motif: an ascending titration staircase with a dot at the top (dose reaching target),
on a deep-navy rounded square. Run:  python scripts/make_icons.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

NAVY = (5, 11, 13, 255)
TEAL = (92, 242, 196, 255)
TEAL_DARK = (18, 169, 128, 255)
WHITE = (230, 251, 244, 255)


def draw_icon(size: int, maskable: bool = False, transparent_bg: bool = False) -> Image.Image:
    scale = 8  # supersample for crisp edges
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    pad = 0 if maskable else int(s * 0.06)
    radius = int(s * 0.22)
    if not transparent_bg:
        d.rounded_rectangle([pad, pad, s - pad, s - pad], radius=radius, fill=NAVY)

    # Staircase: 4 steps rising left→right inside a safe zone.
    safe = int(s * (0.20 if maskable else 0.18))
    x0, y0, x1, y1 = safe, safe, s - safe, s - safe
    w = x1 - x0
    h = y1 - y0
    steps = 4
    step_w = w / steps
    bar = h * 0.11  # step thickness
    for i in range(steps):
        sx0 = x0 + i * step_w
        sx1 = x0 + (i + 1) * step_w - w * 0.04
        sy = y1 - (i + 1) * (h / (steps + 1))
        d.rounded_rectangle([sx0, sy - bar / 2, sx1, sy + bar / 2], radius=int(bar / 2), fill=TEAL)
        # riser
        if i < steps - 1:
            rx = sx1 - bar * 0.5
            ny = y1 - (i + 2) * (h / (steps + 1))
            d.rounded_rectangle(
                [rx - bar * 0.45, ny, rx + bar * 0.45, sy], radius=int(bar * 0.45), fill=TEAL_DARK
            )
    # target dot above the last step
    dot_r = h * 0.09
    cx = x0 + (steps - 0.5) * step_w - w * 0.02
    cy = y1 - (steps + 0.9) * (h / (steps + 1))
    d.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=WHITE)

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
  <rect x="6" y="6" width="88" height="88" rx="22" fill="#050b0d"/>
  <g fill="#5cf2c4">
    <rect x="18" y="68.5" width="12.5" height="7" rx="3.5"/>
    <rect x="34" y="55.7" width="12.5" height="7" rx="3.5"/>
    <rect x="50" y="42.9" width="12.5" height="7" rx="3.5"/>
    <rect x="66" y="30.1" width="16" height="7" rx="3.5"/>
  </g>
  <g fill="#12a980">
    <rect x="28.5" y="59.2" width="4" height="12.8" rx="2"/>
    <rect x="44.5" y="46.4" width="4" height="12.8" rx="2"/>
    <rect x="60.5" y="33.6" width="4" height="12.8" rx="2"/>
  </g>
  <circle cx="73" cy="20" r="5.5" fill="#e6fbf4"/>
</svg>
"""
    (OUT / "icon.svg").write_text(svg, encoding="utf-8")
    print("icons written to", OUT)


if __name__ == "__main__":
    main()
