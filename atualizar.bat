@echo off
chcp 65001 >nul
title Atualizar o Estudio Maelstrom
cd /d "%~dp0"
echo.
echo  Buscando a versao nova do Estudio Maelstrom no GitHub...
git pull --ff-only
if errorlevel 1 (
  echo.
  echo  Nao deu para atualizar sozinho (provavelmente voce alterou algum arquivo do
  echo  proprio aplicativo). Abra esta pasta no Claude Code e peca: "atualiza o Estudio".
  pause
  exit /b 1
)
echo.
echo  Atualizando as dependencias (se mudaram)...
pushd Reels\editor
call npm install --no-audit --no-fund
popd
python -m pip install -r requirements.txt -q
echo.
echo  Estudio atualizado. Se ele estava aberto, feche e abra de novo (abrir-estudio.bat).
pause
