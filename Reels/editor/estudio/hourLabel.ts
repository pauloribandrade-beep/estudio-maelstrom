import { useEffect } from "react";

// O contador do player do Remotion só sabe "m:ss" (um vídeo de 1h09 aparece como 69:23). Aqui a gente acha o rótulo
// dele dentro do player e reescreve os tempos acima de 60 min como "h:mm:ss" toda vez que o Remotion troca o texto.
const M_SS = /^(\d+):(\d\d)$/;
const toH = (s: string) => {
  const m = M_SS.exec(s.trim());
  if (!m) return null;
  const min = Number(m[1]);
  if (min < 60) return null;
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}:${m[2]}`;
};

const fixNode = (el: Element) => {
  for (const n of Array.from(el.childNodes)) {
    if (n.nodeType === 3 && n.nodeValue) {
      const h = toH(n.nodeValue);
      if (h) n.nodeValue = h;
    }
  }
};

export const useHourLabel = (wrap: React.RefObject<HTMLElement | null>, key: unknown) => {
  useEffect(() => {
    let obs: MutationObserver | null = null;
    let label: Element | null = null;
    const find = () => {
      const root = wrap.current;
      if (!root) return;
      if (label && root.contains(label)) return;
      // o rótulo é um div sem filhos-elemento com texto "x:yy / x:yy"
      const cand = Array.from(root.querySelectorAll("div")).find((d) => d.children.length === 0 && /^\s*\d+:\d\d(:\d\d)?\s*\/\s*\d+:\d\d(:\d\d)?\s*$/.test(d.textContent || ""));
      if (!cand) return;
      obs?.disconnect();
      label = cand;
      fixNode(label);
      obs = new MutationObserver(() => label && fixNode(label));
      obs.observe(label, { childList: true, characterData: true, subtree: true });
    };
    find();
    const t = window.setInterval(find, 1000);
    return () => {
      window.clearInterval(t);
      obs?.disconnect();
    };
  }, [wrap, key]);
};
