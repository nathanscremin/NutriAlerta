@echo off
setlocal EnableExtensions
set "ROOT=%~dp0"
set "MANAGER_DIR=%ROOT%NutriAlerta\project\nutri-alerta"
set "SCHOOLS_DIR=%ROOT%Nutri for Schools\project\nutri-alerta"
set "MANAGER_PACKAGE=%MANAGER_DIR%\package.json"
set "SCHOOLS_PACKAGE=%SCHOOLS_DIR%\package.json"
set "MANAGER_NODE_MODULES=%MANAGER_DIR%\node_modules"
set "SCHOOLS_NODE_MODULES=%SCHOOLS_DIR%\node_modules"
set "MANAGER_ENV=%MANAGER_DIR%\.env.local"
set "SCHOOLS_ENV=%SCHOOLS_DIR%\.env.local"
set "WAIT_FOR_USER=1"

if /i "%~1"=="--no-pause" set "WAIT_FOR_USER=0"
if /i "%~1"=="--headless" set "WAIT_FOR_USER=0"

color 0b
cls
title NutriAlerta & Nutri for Schools - Inicializador de Servidores

echo =====================================================================
echo           INICIANDO SERVIDORES DO ECOSSISTEMA NUTRIALERTA
echo =====================================================================
echo.
echo [*] Este script vai iniciar os dois portais locais em tempo real:
echo     1. Portal do Gestor (NutriAlerta)       - http://localhost:3000
echo     2. Portal Escolar (Nutri for Schools)   - http://localhost:3001
echo.
echo [!] As janelas do CMD continuar^ao abertas para mostrar os logs.
echo.
echo =====================================================================
echo.

call :check_tool npm "npm"
if errorlevel 1 exit /b 1
call :check_tool node "node"
if errorlevel 1 exit /b 1
call :check_tool python "python"
if errorlevel 1 exit /b 1

call :check_project "Portal do Gestor" "%MANAGER_DIR%" "%MANAGER_PACKAGE%" "%MANAGER_NODE_MODULES%" "%MANAGER_ENV%"
if errorlevel 1 exit /b 1

call :check_project "Portal Escolar" "%SCHOOLS_DIR%" "%SCHOOLS_PACKAGE%" "%SCHOOLS_NODE_MODULES%" "%SCHOOLS_ENV%"
if errorlevel 1 exit /b 1

echo.
echo [1/2] Iniciando Portal do Gestor (Porta 3000)...
start "NutriAlerta - Portal do Gestor (3000)" /d "%MANAGER_DIR%" cmd /k "npm run dev"
if errorlevel 1 (
    echo [ERRO] Nao foi possivel iniciar o Portal do Gestor.
    exit /b 1
)

timeout /t 2 /nobreak >nul

echo [2/2] Iniciando Portal Escolar (Porta 3001)...
start "Nutri for Schools - Portal Escolar (3001)" /d "%SCHOOLS_DIR%" cmd /k "npm run dev"
if errorlevel 1 (
    echo [ERRO] Nao foi possivel iniciar o Portal Escolar.
    exit /b 1
)

echo.
echo =====================================================================
echo  [SUCCESS] Ambos os servidores foram iniciados em janelas separadas!
echo =====================================================================
echo.
echo  Acesse em seu navegador:
echo  - Portal do Gestor:  http://localhost:3000
echo  - Portal Escolar:   http://localhost:3001
echo.
if "%WAIT_FOR_USER%"=="1" (
    echo  Pressione qualquer tecla para fechar esta janela principal (os servidores continuar^ao rodando).
    pause >nul
)
exit /b 0

:check_tool
where %2 >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Ferramenta obrigatoria nao encontrada: %2
    echo        Verifique se ela esta instalada e no PATH do sistema.
    exit /b 1
)
exit /b 0

:check_project
set "LABEL=%~1"
set "DIR=%~2"
set "PACKAGE=%~3"
set "NODE_MODULES=%~4"
set "ENV_FILE=%~5"

if not exist "%DIR%" (
    echo [ERRO] Pasta do projeto nao encontrada para %LABEL%:
    echo        %DIR%
    echo        Verifique se o caminho esta correto.
    exit /b 1
)

if not exist "%PACKAGE%" (
    echo [ERRO] Arquivo de inicializacao nao encontrado para %LABEL%:
    echo        %PACKAGE%
    echo        O projeto parece estar incompleto ou no local errado.
    exit /b 1
)

if not exist "%NODE_MODULES%" (
    echo [ERRO] Dependencias do projeto nao encontradas para %LABEL%:
    echo        %NODE_MODULES%
    echo        Execute "npm install" dentro do projeto antes de iniciar.
    exit /b 1
)

if not exist "%ENV_FILE%" (
    echo [AVISO] Arquivo de ambiente nao encontrado para %LABEL%:
    echo        %ENV_FILE%
    echo        O servidor pode subir, mas variaveis de ambiente essenciais podem faltar.
)

echo [OK] %LABEL% pronto para subir em tempo real.
exit /b 0
