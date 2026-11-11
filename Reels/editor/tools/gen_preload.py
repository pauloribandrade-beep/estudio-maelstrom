# Gera src/lib/hl3preload.tsx: toda imagem de public/hl3silh e public/hl3 vira <Img> invisível na raiz do vídeo do HL3.
# Motivo (08/10/2026): <image> dentro de SVG não segura o quadro no Remotion; no render os crachás saíam pretos.
# Rodar de novo quando entrar imagem nova nessas pastas:  python tools/gen_preload.py
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = []
for d in ("hl3silh", "hl3"):
    for fn in sorted(os.listdir(os.path.join(ROOT, "public", d))):
        if fn.lower().endswith((".png", ".jpg", ".jpeg", ".svg", ".webp")) and not fn.startswith("_"):
            files.append(f"{d}/{fn}")
src = """// GERADO por tools/gen_preload.py — não editar à mão.
// <image> dentro de SVG (crachás, silhuetas, larva, logos) não segura o quadro no Remotion: no render elas podiam sair
// PRETAS. Aqui cada imagem entra como <Img> invisível na raiz do vídeo: o quadro só é capturado com todas carregadas e
// decodificadas, e a <image> do SVG usa a mesma do cache.
import React from "react";
import { Img, staticFile } from "remotion";
export const SVG_IMAGES: string[] = %s;
export const SvgImagePreload: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
    {SVG_IMAGES.map((s) => (
      <Img key={s} src={staticFile(s)} style={{ width: 1, height: 1 }} />
    ))}
  </div>
);
""" % json.dumps(files, ensure_ascii=False, indent=1)
tmp = os.path.join(ROOT, "src", "lib", "hl3preload.tsx.tmp")
open(tmp, "w", encoding="utf-8").write(src)
os.replace(tmp, tmp[:-4])
print(len(files), "imagens")
