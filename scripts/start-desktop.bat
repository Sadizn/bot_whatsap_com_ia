@echo off
title Edith Desktop - Inicializando Sistema Completo
echo ========================================================
echo        INICIANDO EDITH DESKTOP COMPLETA
echo   (WhatsApp Gateway + AI Engine Python + Electron Desktop)
echo ========================================================
echo.

cd /d "%~dp0\.."

echo [1/2] Verificando dependencias...
call yarn --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [AVISO] Yarn nao detectado globalmente, usando npm...
    npm run app
) else (
    echo [INFO] Executando via Yarn...
    yarn app
)

pause
