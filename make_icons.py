#!/usr/bin/env python3
"""Chạy trong GitHub Actions sau 'npx cap add android': thay icon mặc định bằng icon Ocean Life."""
import glob, os, re
from PIL import Image, ImageDraw

SRC = 'icon-1024.png'
RES = 'android/app/src/main/res'
BG = '#0a3a7a'

src = Image.open(SRC).convert('RGBA')

def rounded(img, radius_ratio):
    w, h = img.size
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=int(w * radius_ratio), fill=255)
    out = img.copy(); out.putalpha(mask); return out

def circle(img):
    w, h = img.size
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, w - 1, h - 1), fill=255)
    out = img.copy(); out.putalpha(mask); return out

count = 0
for path in glob.glob(RES + '/mipmap-*/*.png'):
    name = os.path.basename(path)
    if name not in ('ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'):
        continue
    w, h = Image.open(path).size
    base = src.resize((w, h), Image.LANCZOS)
    if name == 'ic_launcher_foreground.png':
        k = int(w * 0.60)
        inner = rounded(src.resize((k, k), Image.LANCZOS), 0.18)
        canvas = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        canvas.paste(inner, ((w - k) // 2, (h - k) // 2), inner)
        out = canvas
    elif name == 'ic_launcher_round.png':
        out = circle(base)
    else:
        out = rounded(base, 0.18)
    out.save(path)
    count += 1

for xml in glob.glob(RES + '/values/ic_launcher_background.xml'):
    s = open(xml, encoding='utf-8').read()
    s = re.sub(r'(<color name="ic_launcher_background">)[^<]*(</color>)', r'\g<1>' + BG + r'\g<2>', s)
    open(xml, 'w', encoding='utf-8').write(s)

print('Đã thay %d tệp icon.' % count)
