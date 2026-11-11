# Pinta os óculos do Gordon na textura do rosto (DM_Face do gordon.mdl, 128×128), em 4× (512) para o traço ficar limpo.
# Coordenadas em pixels da textura 4×: frente à direita (olhos em y ≈ 220), lateral com a orelha à esquerda.
# Uso: python tools/hl1/paint_glasses.py <gordon.mdl> <saida.png>
import importlib.util, os, sys
from PIL import Image, ImageDraw

sp = importlib.util.spec_from_file_location("m", os.path.join(os.path.dirname(__file__), "mdl2glb.py"))
m = importlib.util.module_from_spec(sp)
sp.loader.exec_module(m)
g = m.MDL(sys.argv[1])
tex = next(t for t in g.textures if t["name"] == "DM_Face.bmp")
base = tex["img"].convert("RGB").resize((512, 512), Image.NEAREST)

S = 4  # supersample: desenha em 2048 e reduz, para a armação sair suave
over = Image.new("RGBA", (512 * S, 512 * S), (0, 0, 0, 0))
d = ImageDraw.Draw(over)
FR = (28, 22, 20, 255)
GL = (200, 225, 235, 46)
q = lambda *v: [c * S for c in v]
for x0, x1 in ((284, 356), (398, 470)):
    d.rounded_rectangle(q(x0, 197, x1, 246), radius=14 * S, fill=GL)
    d.rounded_rectangle(q(x0, 197, x1, 246), radius=14 * S, outline=FR, width=5 * S)
    d.line(q(x0 + 10, 204, x0 + 26, 202), fill=(255, 255, 255, 70), width=3 * S)  # reflexo
d.line(q(356, 212, 398, 212), fill=FR, width=5 * S)  # ponte
d.line(q(262, 207, 284, 207), fill=FR, width=5 * S)  # dobradiças até a borda do rosto
d.line(q(470, 207, 497, 207), fill=FR, width=5 * S)
d.line(q(232, 206, 104, 214), fill=FR, width=5 * S)  # lateral: a haste até a orelha
over = over.resize((512, 512), Image.LANCZOS)
out = base.convert("RGBA")
out.alpha_composite(over)
out.convert("RGB").save(sys.argv[2])
print("ok", sys.argv[2])
