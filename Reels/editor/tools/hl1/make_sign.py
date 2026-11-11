# Placa "BLACK MESA · RESEARCH FACILITY · SECTOR C" para a cena do bonde (arte nossa, fonte do vídeo: Geist Mono).
# Uso: python tools/hl1/make_sign.py <geistmono.ttf> <saida.png>
import math, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

FONT, OUT = sys.argv[1], sys.argv[2]
W, H = 2048, 352
random.seed(7)


def font(size, wght):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_axes([wght])
    return f


def spaced(d, xy, text, f, fill, track):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f) + track
    return x


def spaced_len(d, text, f, track):
    return sum(d.textlength(c, font=f) + track for c in text) - track


# chapa: metal escuro escovado com gradiente vertical
img = Image.new("RGB", (W, H))
px = img.load()
for y in range(H):
    base = 46 - 14 * (y / H)
    for x in range(W):
        n = random.gauss(0, 3.2) + 2.2 * math.sin(y * 0.9 + x * 0.002)
        v = base + n
        px[x, y] = (int(v * 0.92), int(v * 0.97), int(v * 1.04))
d = ImageDraw.Draw(img)

# moldura chanfrada com rebites
for i in range(18):
    c = 120 - i * 4 if i < 9 else 60 - (i - 9) * 3
    d.rectangle([i, i, W - 1 - i, H - 1 - i], outline=(c, c + 2, c + 5))
for x in list(range(60, W - 40, 160)):
    for y in (9, H - 10):
        d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(150, 152, 156))
        d.ellipse([x - 3, y - 4, x + 2, y + 1], fill=(205, 207, 210))

# faixa de risco embaixo (dentro da moldura)
sy0, sy1 = H - 58, H - 22
stripe = Image.new("RGB", (W - 44, sy1 - sy0), (24, 22, 18))
sd = ImageDraw.Draw(stripe)
for k in range(-2, (W // 44) + 4):
    x0 = k * 44
    sd.polygon([(x0, 0), (x0 + 22, 0), (x0 + 22 - (sy1 - sy0), sy1 - sy0), (x0 - (sy1 - sy0), sy1 - sy0)], fill=(214, 168, 30))
img.paste(stripe, (22, sy0))
d.line([22, sy0 - 2, W - 23, sy0 - 2], fill=(18, 18, 18), width=3)

# emblema (nosso): anel branco, a mesa (planalto de topo plano) em negativo e uma faixa horizontal
cx, cy, R = 182, 150, 104
d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=(232, 228, 216))
d.ellipse([cx - R + 14, cy - R + 14, cx + R - 14, cy + R - 14], fill=(30, 32, 35))
mesa = [(cx - 78, cy + 30), (cx - 52, cy - 8), (cx - 34, cy - 30), (cx + 30, cy - 30), (cx + 44, cy - 12), (cx + 58, cy - 12), (cx + 80, cy + 30)]
d.polygon(mesa, fill=(232, 228, 216))
d.rectangle([cx - 90, cy + 30, cx + 90, cy + 44], fill=(232, 228, 216))
d.rectangle([cx - 70, cy + 54, cx + 70, cy + 62], fill=(214, 168, 30))

# textos
x0 = 330
f1, f2, f3, f4 = font(132, 800), font(46, 600), font(40, 700), font(26, 500)
spaced(d, (x0, 38), "BLACK MESA", f1, (236, 232, 220), 10)
spaced(d, (x0 + 4, 196), "RESEARCH FACILITY", f2, (214, 168, 30), 15)

# bloco do setor à direita
bx0, bx1, by0, by1 = W - 520, W - 48, 50, 252
d.line([bx0 - 40, 56, bx0 - 40, 246], fill=(90, 92, 96), width=4)
d.rectangle([bx0, by0, bx1, by0 + 96], fill=(214, 168, 30))
tw = spaced_len(d, "SECTOR C", font(70, 800), 8)
spaced(d, (bx0 + (bx1 - bx0 - tw) / 2, by0 + 6), "SECTOR C", font(70, 800), (22, 22, 22), 8)
spaced(d, (bx0 + 6, by0 + 118), "TEST LABS", f3, (236, 232, 220), 8)
ax = bx1 - 70
d.polygon([(ax, by0 + 122), (ax + 44, by0 + 142), (ax, by0 + 162)], fill=(236, 232, 220))
d.rectangle([ax - 34, by0 + 136, ax + 2, by0 + 148], fill=(236, 232, 220))
spaced(d, (bx0 + 6, by0 + 172), "AUTHORIZED PERSONNEL ONLY", f4, (150, 152, 156), 2)

# desgaste: sujeira escorrida, riscos, bordas escurecidas
dirt = Image.new("L", (W, H), 0)
dd = ImageDraw.Draw(dirt)
for _ in range(90):
    x = random.randint(0, W)
    y = random.randint(0, H // 2)
    dd.line([x, y, x + random.randint(-6, 6), y + random.randint(40, 240)], fill=random.randint(20, 60), width=random.randint(2, 9))
for _ in range(240):
    x, y = random.randint(0, W), random.randint(0, H)
    a = random.uniform(0, math.pi)
    l = random.randint(8, 50)
    dd.line([x, y, x + l * math.cos(a), y + l * math.sin(a)], fill=random.randint(10, 35), width=1)
dirt = dirt.filter(ImageFilter.GaussianBlur(2.5))
img = Image.composite(Image.new("RGB", (W, H), (18, 16, 12)), img, dirt)
vig = Image.new("L", (W, H), 0)
vd = ImageDraw.Draw(vig)
for i in range(40):
    vd.rectangle([i, i, W - 1 - i, H - 1 - i], outline=int(120 * (1 - i / 40)))
img = Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), img, vig.filter(ImageFilter.GaussianBlur(6)))
img.save(OUT)
print("ok", OUT)
