"""Genera iconos PNG para iPhone y PWA de Judi's Shop con el logo JS 3D."""
from pathlib import Path
from io import BytesIO
from PIL import Image, ImageFilter
import base64
import re

ROOT = Path(__file__).resolve().parents[1]
SVG = (ROOT / "public" / "js-logo-3d.svg").read_text(encoding="utf-8")
match = re.search(r"data:image/webp;base64,([A-Za-z0-9+/=]+)", SVG)
if not match:
    raise RuntimeError("No se encontró el emblema JS 3D")
SOURCE = Image.open(BytesIO(base64.b64decode(match.group(1)))).convert("RGB")

def icon(size, scale=0.96):
    canvas = Image.new("RGB", (size,size), "#000000")
    side = round(size*scale)
    img = SOURCE.resize((side,side), Image.Resampling.LANCZOS)
    img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=95, threshold=2))
    canvas.paste(img, ((size-side)//2,(size-side)//2))
    return canvas

icon(180).save(ROOT / "public" / "apple-touch-icon.png", optimize=True)
icon(192).save(ROOT / "public" / "icon-192.png", optimize=True)
icon(512).save(ROOT / "public" / "icon-512.png", optimize=True)
icon(64).save(ROOT / "app" / "favicon.ico", format="ICO", sizes=[(16,16),(32,32),(48,48),(64,64)])
print("Iconos 3D Judi's Shop listos")
