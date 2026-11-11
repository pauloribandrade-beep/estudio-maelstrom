@echo off
chcp 65001 >nul
title Instalar o Estudio Maelstrom
cd /d "%~dp0"
echo.
echo ================================================================
echo   Estudio Maelstrom - instalacao
echo ================================================================
echo.
echo  1/4  Conferindo os programas (Git, Node, Python e FFmpeg)...
set FALTOU=0
where git >nul 2>nul || (echo      - instalando o Git... & winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements & set FALTOU=1)
where node >nul 2>nul || (echo      - instalando o Node.js LTS... & winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements & set FALTOU=1)
where python >nul 2>nul || (echo      - instalando o Python 3.11... & winget install --id Python.Python.3.11 -e --accept-source-agreements --accept-package-agreements & set FALTOU=1)
where ffmpeg >nul 2>nul || (echo      - instalando o FFmpeg... & winget install --id Gyan.FFmpeg -e --accept-source-agreements --accept-package-agreements & set FALTOU=1)
if "%FALTOU%"=="1" (
  echo.
  echo  Programas novos foram instalados. FECHE esta janela e rode o instalar.bat
  echo  de novo, para o Windows enxergar os programas recem-instalados.
  pause
  exit /b
)
echo.
echo  2/4  Instalando o motor de video (Node)... pode levar alguns minutos
pushd Reels\editor
call npm install
if errorlevel 1 (echo  ERRO no npm install. Veja a mensagem acima. & popd & pause & exit /b 1)
popd
echo.
echo  3/4  Instalando a transcricao (Python + faster-whisper)...
python -m pip install --upgrade pip >nul
python -m pip install -r requirements.txt
if errorlevel 1 (echo  ERRO no pip install. Veja a mensagem acima. & pause & exit /b 1)
echo.
echo  4/4  Pronto!
echo.
echo  - Abrir o Estudio: dois cliques em abrir-estudio.bat
echo  - Editar videos, roteiros e legendas: abra ESTA pasta no Claude Code
echo.
pause
