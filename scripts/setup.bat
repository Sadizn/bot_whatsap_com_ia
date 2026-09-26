@echo off
chcp 65001 > nul
echo ============================================================
echo   Instalação e Configuração do Bot WhatsApp com IA
echo ============================================================

REM 1. Verificar Node e Yarn
where yarn >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Yarn não encontrado no sistema. Instale o Yarn antes de continuar.
    pause
    exit /b 1
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Python não encontrado no sistema. Instale o Python 3.10+ antes de continuar.
    pause
    exit /b 1
)

REM 2. Criar .env se não existir
if not exist .env (
    echo [CONFIG] Criando arquivo .env a partir de config/.env.example...
    copy config\.env.example .env > nul
)

REM 3. Instalar dependências Node.js com Yarn
echo.
echo [1/3] Instalando dependências Node.js na raiz...
call yarn install

echo.
echo [2/3] Instalando dependências do WhatsApp Gateway com Yarn...
cd services\whatsapp-gateway
call yarn install
cd ..\..

REM 4. Configurar ambiente Python
echo.
echo [3/3] Configurando ambiente virtual Python e instalando dependências...
cd services\ai-engine
if not exist venv (
    echo Criando ambiente virtual Python (venv)...
    python -m venv venv
)

echo Ativando venv e instalando pacotes de IA...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..\..

echo.
echo ============================================================
echo   Tudo pronto!
echo   1. Configure sua GEMINI_API_KEY no arquivo .env
echo   2. Execute: scripts\start-all.bat ou yarn dev
echo ============================================================
pause
