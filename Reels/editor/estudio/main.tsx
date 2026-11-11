import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { Home } from "./Home";
import { ESTUDIO } from "./perfil";

// Mesma fonte do vídeo (Geist). No render ela vem de src/lib/fonts.ts.
for (const [family, file] of [
  ["Geist", "/fonts/geist-latin.woff2"],
  ["Geist Mono", "/fonts/geist-mono-latin.woff2"],
]) {
  new FontFace(family, `url('${file}') format('woff2')`).load().then((f) => document.fonts.add(f));
}

document.title = `Estúdio ${ESTUDIO}`;

// Sem ?v= na barra de endereço: tela inicial com os projetos. Com ?v=<projeto>: o editor.
const slug = new URLSearchParams(location.search).get("v");
createRoot(document.getElementById("root")!).render(slug ? <App /> : <Home onOpen={(s) => (location.href = `/?v=${s}`)} />);
