@echo off
chcp 65001 > nul
echo ============================================================
echo   Iniciando Bot WhatsApp & Motor de IA (Node.js + Python)
echo ============================================================

REM Inicia o Motor de IA em segundo plano ou em nova janela
echo [1/2] Iniciando Motor de IA Python (FastAPI na porta 8000)...
start "AI Engine - FastAPI (Porta 8000)" cmd /k "cd services\ai-engine && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) && uvicorn main:app --reload --port 8000"

timeout /t 2 > nul

REM Inicia o WhatsApp Gateway e Dashboard
echo [2/2] Iniciando WhatsApp Gateway e Dashboard (Porta 3000)...
start "WhatsApp Gateway & Dashboard (Porta 3000)" cmd /k "cd services\whatsapp-gateway && yarn dev"

echo.
echo ============================================================
echo   Serviços iniciados!
echo   Dashboard disponível em: http://localhost:3000
echo   API de IA disponível em: http://localhost:8000/docs
echo ============================================================
