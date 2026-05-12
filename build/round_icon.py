"""Apply macOS Big Sur+ app icon shape to a source PNG.

Apple's spec for 1024x1024 app icons:
- Content occupies 824x824 centered in the 1024 canvas (~10% margin each side)
- Corner radius is ~185px (≈22.37% of 824), the "squircle" rounded rectangle

Input:  source PNG (any square size, will be rescaled)
Output: 1024x1024 PNG with rounded corners, transparent outside the rounded square.
"""
import sys
from PIL import Image, ImageDraw

if len(sys.argv) != 3:
    print("usage: round_icon.py <input> <output>")
    sys.exit(1)

src_path, dst_path = sys.argv[1], sys.argv[2]

CANVAS = 1024
TILE = 824
RADIUS = 185
OFFSET = (CANVAS - TILE) // 2

src = Image.open(src_path).convert("RGBA")
src = src.resize((TILE, TILE), Image.LANCZOS)

mask = Image.new("L", (TILE, TILE), 0)
ImageDraw.Draw(mask).rounded_rectangle(
    (0, 0, TILE - 1, TILE - 1), radius=RADIUS, fill=255
)

tile = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
tile.paste(src, (0, 0), mask)

canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
canvas.paste(tile, (OFFSET, OFFSET), tile)

canvas.save(dst_path, "PNG")
print(f"wrote {dst_path} ({CANVAS}x{CANVAS}, rounded-tile {TILE}x{TILE} centered)")
