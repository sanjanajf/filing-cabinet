"""Generate the Workspace app icon — a drawer shape (1024x1024 PNG) in Win95-ish style."""
from PIL import Image, ImageDraw
import os

SIZE = 1024
OUT = os.path.join(os.path.dirname(__file__), "icon.png")

# Palette — matches the app: teal background, beige/wood drawer face, dark outline.
TEAL = (0, 128, 128)
WOOD = (210, 180, 140)        # tan
WOOD_DARK = (160, 130, 90)
WOOD_LIGHT = (235, 210, 170)
BLACK = (0, 0, 0)
HANDLE = (60, 50, 40)
HANDLE_HI = (140, 120, 90)

img = Image.new("RGB", (SIZE, SIZE), TEAL)
d = ImageDraw.Draw(img)

# Outer drawer rectangle — leaves a margin so macOS rounded-corner mask doesn't clip it.
margin = int(SIZE * 0.11)
x0, y0 = margin, int(SIZE * 0.20)
x1, y1 = SIZE - margin, SIZE - int(SIZE * 0.20)

# Drop shadow under the drawer
shadow_off = int(SIZE * 0.018)
d.rectangle([x0 + shadow_off, y0 + shadow_off, x1 + shadow_off, y1 + shadow_off],
            fill=(0, 60, 60))

# Main drawer face
d.rectangle([x0, y0, x1, y1], fill=WOOD, outline=BLACK, width=int(SIZE * 0.012))

# Top highlight strip (chunky pixel bevel)
bevel = int(SIZE * 0.018)
d.rectangle([x0, y0, x1, y0 + bevel * 2], fill=WOOD_LIGHT)
# Left highlight
d.rectangle([x0, y0, x0 + bevel * 2, y1], fill=WOOD_LIGHT)
# Bottom shadow
d.rectangle([x0, y1 - bevel * 2, x1, y1], fill=WOOD_DARK)
# Right shadow
d.rectangle([x1 - bevel * 2, y0, x1, y1], fill=WOOD_DARK)
# Re-outline so bevel doesn't overrun
d.rectangle([x0, y0, x1, y1], outline=BLACK, width=int(SIZE * 0.012))

# Handle: horizontal pull, centered
hw = int((x1 - x0) * 0.42)
hh = int(SIZE * 0.075)
cx = (x0 + x1) // 2
cy = (y0 + y1) // 2
hx0, hy0 = cx - hw // 2, cy - hh // 2
hx1, hy1 = cx + hw // 2, cy + hh // 2

# Handle backplate (lighter wood inset)
plate = int(SIZE * 0.012)
d.rectangle([hx0 - plate, hy0 - plate, hx1 + plate, hy1 + plate],
            fill=WOOD_DARK, outline=BLACK, width=int(SIZE * 0.008))
# Handle itself
d.rectangle([hx0, hy0, hx1, hy1], fill=HANDLE, outline=BLACK, width=int(SIZE * 0.008))
# Handle highlight
d.rectangle([hx0 + int(hh * 0.15), hy0 + int(hh * 0.15),
             hx1 - int(hh * 0.15), hy0 + int(hh * 0.35)], fill=HANDLE_HI)

img.save(OUT)
print(f"wrote {OUT}")
