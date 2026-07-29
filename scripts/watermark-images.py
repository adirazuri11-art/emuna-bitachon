#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
מטמיע את הלוגו הגרפי "אמונה וביטחון" (הכיתוב מהאתר) בקטן בפינת כל תמונת מוצר.
מקור: public/images/supplier-real/*.jpg  (מקור לא-חתום ב-.supplier-orig/).
הרצה: python3 scripts/watermark-images.py
"""
import os, glob, shutil
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "public/images/supplier-real")
ORIG = os.path.join(ROOT, ".supplier-orig")
LOGO_PATH = os.path.join(ROOT, "public/brand/emuna-vebitachon-logo.png")
os.makedirs(ORIG, exist_ok=True)

def load_wordmark():
    logo = Image.open(LOGO_PATH).convert("RGBA")
    # מסירים את שורת התגית (השליש התחתון) — משאירים רק את הכיתוב
    logo = logo.crop((0, 0, logo.width, int(logo.height * 0.62)))
    logo = logo.crop(logo.getbbox())  # חיתוך שוליים שקופים
    return logo

WORDMARK = load_wordmark()

def watermark(path):
    img = Image.open(path).convert("RGBA")
    W, H = img.size

    target_w = int(W * 0.26)
    scale = target_w / WORDMARK.width
    lw, lh = target_w, int(WORDMARK.height * scale)
    logo = WORDMARK.resize((lw, lh), Image.LANCZOS)

    padx = int(lw * 0.14)
    pady = int(lh * 0.35)
    pill_w, pill_h = lw + padx * 2, lh + pady * 2
    margin = int(W * 0.028)
    x0, y0 = margin, H - margin - pill_h

    # גלולה לבנה שקופה-למחצה — כדי שהכחול והזהב ייקראו על כל רקע
    pill = Image.new("RGBA", (pill_w, pill_h), (0, 0, 0, 0))
    from PIL import ImageDraw
    ImageDraw.Draw(pill).rounded_rectangle(
        [0, 0, pill_w - 1, pill_h - 1], radius=int(pill_h * 0.28),
        fill=(255, 255, 255, 212), outline=(212, 175, 55, 150), width=max(1, int(W * 0.002)))

    img.alpha_composite(pill, (x0, y0))
    img.alpha_composite(logo, (x0 + padx, y0 + pady))
    img.convert("RGB").save(path, "JPEG", quality=88)

def main():
    files = sorted(glob.glob(os.path.join(SRC, "*.jpg")))
    n = 0
    for f in files:
        name = os.path.basename(f)
        orig = os.path.join(ORIG, name)
        if not os.path.exists(orig):
            shutil.copy2(f, orig)
        else:
            shutil.copy2(orig, f)  # מתחילים תמיד מהמקור הנקי
        watermark(f)
        n += 1
    print(f"✓ Applied logo watermark to {n} images")

if __name__ == "__main__":
    main()
