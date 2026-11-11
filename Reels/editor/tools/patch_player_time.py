"""Contador do player do Remotion em h:mm:ss (o original só tem m:ss e mostra 66:32 num vídeo de 1h06).
Rodar de novo depois de reinstalar/atualizar o @remotion/player (npm install apaga o ajuste)."""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OLD = '''var formatTime = (timeInSeconds) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds - minutes * 60);
  return `${String(minutes)}:${String(seconds).padStart(2, "0")}`;
};'''
NEW = '''var formatTime = (timeInSeconds) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor(timeInSeconds / 60) - hours * 60;
  const seconds = Math.floor(timeInSeconds - Math.floor(timeInSeconds / 60) * 60);
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${String(minutes)}:${String(seconds).padStart(2, "0")}`;
};'''
for rel in ["node_modules/@remotion/player/dist/esm/index.mjs", "node_modules/.vite/deps/@remotion_player.js"]:
    p = os.path.join(ROOT, rel)
    if os.path.exists(p):
        s = open(p, encoding="utf-8").read()
        if OLD in s:
            open(p, "w", encoding="utf-8").write(s.replace(OLD, NEW))
            print("ajustado:", rel)
