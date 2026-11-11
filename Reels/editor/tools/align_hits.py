# Casa a forma do efeito com o movimento na tela (pedido do Paulo, 08/10/2026: "o pico tem que estar sincronizado com
# o que aparece… se a animação sobe devagar, o som sobe junto e o pico bate com a movimentação").
#  · ataque curto (golpe até 0,3 s depois do início): o som começa antes, pelo silêncio/subida, e o GOLPE cai no instante
#    em que foi posto (o quadro do movimento);
#  · subida longa (janela, sopro, dobra, glitch…): o começo do arquivo é cortado (trim) para a subida durar o mesmo que o
#    movimento — o som nasce junto com a animação e o pico chega quando ela termina;
#  · sons contínuos (digitação, lápis, passos, rangidos, criaturas) não mudam.
# Só de 31:18 em diante (o começo está aprovado); não mexe em camas, músicas, entradas suaves (fadeIn) nem em sons já
# alinhados (campo "hitAligned"). Medidas em out/sfx_peaks.json (tools/sfx_peaks.py).
# Uso: python tools/align_hits.py [--apply] [--from 1878] [--doc caminho]
import json, os, shutil, sys, time
sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, "src", "videos", "hl3_M01", "edit.json")
OUT = sys.argv[sys.argv.index("--doc") + 1] if "--doc" in sys.argv else P
T0 = float(sys.argv[sys.argv.index("--from") + 1]) if "--from" in sys.argv else 1878.0
apply = "--apply" in sys.argv
d = json.load(open(OUT, encoding="utf-8"))
peaks = json.load(open(os.path.join(ROOT, "out", "sfx_peaks.json"), encoding="utf-8"))
BED = ("bed", "music", "t3", "amb", "cama")
# subida desejada (s) por família de som com subida longa
RISE = [("k_janela", 0.33), ("dobra_espaco", 0.35), ("tc_glitches", 0.25), ("whoosh", 0.45), ("tp_suckin", 0.5), ("xen_bm_surge", 0.4), ("fis_recarrega", 0.3), ("k_sintoniza", 0.4), ("hl_gman_teleporte", 0.45), ("riser", 0.6), ("passa_2026", 0.45)]
CONT = ("digita", "lapis", "passos", "estresse", "criatura", "range", "tiques", "fita_anda", "marcador", "barnacle", "headcrab", "relogio")
shift = []
trim = []
for x in d["sounds"]:
    if x["start"] < T0 or x.get("hitAligned"):
        continue
    src = x.get("fxSrc") or x["src"]
    base = os.path.basename(src)
    if "music/" in src or any(k in (x.get("track") or "") for k in BED) or "cama" in (x.get("label") or "").lower():
        continue
    if (x.get("fadeIn") or 0) > 0.05:
        continue
    pk = peaks.get(src)
    if not pk or pk["dur"] > 4:
        continue
    hit = pk["hit"] - (x.get("trim") or 0)
    if hit <= 0.06:
        continue
    if hit <= 0.3:
        new = round(max(0.0, x["start"] - hit), 3)
        shift.append((x["start"], new, hit, x["id"], base))
        if apply:
            x["start"] = new
            x["hitAligned"] = round(hit, 3)
        continue
    if any(k in base for k in CONT):
        continue
    want = next((r for k, r in RISE if k in base), None)
    if want is None or hit <= want:
        continue
    cut = round(hit - want, 3)
    trim.append((x["start"], cut, hit, x["id"], base))
    if apply:
        x["trim"] = round((x.get("trim") or 0) + cut, 3)
        if x.get("dur"):
            x["dur"] = round(max(0.1, x["dur"] - cut), 3)
        x["hitAligned"] = round(want, 3)
        x["fadeIn"] = max(x.get("fadeIn") or 0, 0.04)  # entra no meio da subida: 40 ms evita o estalo
print(f"ataque curto: {len(shift)} sons adiantados · subida longa: {len(trim)} sons com o começo cortado (de {T0:.0f} s em diante)")
for a, b, h, i, s in sorted(shift)[:6]:
    print(f"  adianta {a:8.2f} → {b:8.2f}  (golpe +{h:.2f}s)  {i}  {s}")
for a, c, h, i, s in sorted(trim)[:6]:
    print(f"  corta {c:.2f}s do começo em {a:8.2f} (subida {h:.2f}s → {h - c:.2f}s)  {i}  {s}")
if apply:
    if OUT == P:
        shutil.copy(P, os.path.join(ROOT, "out", "hl3_M01", "edit-history", f"edit-{int(time.time())}-antes-golpes.json"))
    tmp = OUT + ".tmp"
    json.dump(d, open(tmp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    os.replace(tmp, OUT)
    print("aplicado")
