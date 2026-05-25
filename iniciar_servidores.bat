@echo off
title NutriAlerta & Nutri for Schools - Inicializador de Servidores
color 0b
echo =====================================================================
echo           INICIANDO SERVIDORES DO ECOSSISTEMA NUTRIALERTA
echo =====================================================================
echo.
echo  [*] Este script ira iniciar ambos os portais locais:
echo      1. Portal do Gestor (NutriAlerta)       - http://localhost:3000
echo      2. Portal Escolar (Nutri for Schools)   - http://localhost:3001
echo.
echo  [!] As janelas do CMD permanecerao abertas para que voce veja os logs.
echo.
echo =====================================================================
echo.

echo [1/2] Iniciando Portal do Gestor (Porta 3000)...
start "NutriAlerta - Portal do Gestor (3000)" cmd /k "cd /d "%~dp0NutriAlerta\project\nutri-alerta" && npm run dev"

timeout /t 2 /nobreak >nul

echo [2/2] Iniciando Portal Escolar (Porta 3001)...
start "Nutri for Schools - Portal Escolar (3001)" cmd /k "cd /d "%~dp0Nutri for Schools\project\nutri-alerta" && npm run dev"

echo.
echo =====================================================================
echo  [SUCCESS] Ambos os servidores foram iniciados em janelas separadas!
echo =====================================================================
echo.
echo  Acesse em seu navegador:
echo  - Portal do Gestor:  http://localhost:3000
echo  - Portal Escolar:   http://localhost:3001
echo.
echo  Pressione qualquer tecla para fechar esta janela principal (os servidores continuarao rodando).
pause >nul
