@echo off
chcp 65001 >nul
title Estudio Maelstrom (deixe esta janela aberta enquanto usa)
cd /d "%~dp0Reels\editor"
echo.
echo  Abrindo o Estudio Maelstrom em http://localhost:5173
echo  Deixe esta janela aberta enquanto usa. Para fechar o Estudio, feche esta janela.
echo.
start "" http://localhost:5173
call npm run estudio
