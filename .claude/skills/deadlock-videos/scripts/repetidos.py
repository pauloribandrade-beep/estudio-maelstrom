"""Aponta frases repetidas e retomadas na transcrição por pedaços (pedacos.txt), para escolher os takes.

Uso: python repetidos.py <slug> [--n 3]

Marca cada pedaço que começa igual (as mesmas N primeiras palavras) a um dos 4 pedaços seguintes, ou que repete
um trecho de 4 palavras de um pedaço vizinho. Regra: fica a ÚLTIMA versão inteira; a de antes só fica se a última
tropeçar. É uma pista, não a decisão: leia os pedaços apontados antes de cortar.
"""
import argparse, json, os, re, sys, unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _caminhos import pastas  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def norm(t):
    t = unicodedata.normalize("NFD", t.lower())
    return re.sub(r"[^a-z0-9 ]", "", "".join(c for c in t if unicodedata.category(c) != "Mn")).split()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--n", type=int, default=3)
    a = ap.parse_args()
    _, O = pastas(a.slug)
    P = json.load(open(os.path.join(O, "pedacos.json"), encoding="utf-8"))
    ws = [norm(p["text"]) for p in P]
    achou = 0
    for i, w in enumerate(ws):
        if len(w) < 2:
            continue
        motivo = None
        for j in range(i + 1, min(i + 5, len(ws))):
            k = min(a.n, len(w), len(ws[j]))
            if k >= 2 and w[:k] == ws[j][:k]:
                motivo = f"começa igual ao {j + 1} ({P[j]['a']:.2f} s)"
                break
            g4 = {tuple(w[x:x + 4]) for x in range(len(w) - 3)}
            if g4 and any(tuple(ws[j][x:x + 4]) in g4 for x in range(len(ws[j]) - 3)):
                motivo = f"repete 4 palavras do {j + 1} ({P[j]['a']:.2f} s)"
                break
        if motivo:
            achou += 1
            print(f"{i + 1:>3} [{P[i]['a']:7.2f}-{P[i]['b']:7.2f}] {P[i]['text']}\n      -> {motivo}: {P[j]['text']}")
    # tentativa abortada dentro do pedaço: a 1ª palavra começa bem depois do início da fala
    for i, p in enumerate(P):
        if p["words"] and p["words"][0]["s"] - p["a"] > 1.0:
            achou += 1
            print(f"{i + 1:>3} [{p['a']:7.2f}-{p['b']:7.2f}] 1ª palavra só em {p['words'][0]['s']:.2f} s: começo não transcrito (retomada?), comece o take na 1ª palavra")
    print(f"\n{achou} pontos para conferir em {len(P)} pedaços")


if __name__ == "__main__":
    main()
