# 🤖 EDITH AI — Bot de WhatsApp Inteligente, Economia & Centro de Controlo

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![Electron](https://img.shields.io/badge/Electron-Desktop-47848F.svg)](https://www.electronjs.org/)
[![Baileys](https://img.shields.io/badge/WhatsApp-Baileys%20Socket-25D366.svg)](https://github.com/WhiskeySockets/Baileys)
[![Google Gemini](https://img.shields.io/badge/IA-Google%20Gemini-8E75C2.svg)](https://ai.google.dev/)

> **EDITH AI** é um ecossistema híbrido e modular para WhatsApp que combina **Node.js** (Gateway WhatsApp via Baileys + REST API + WebSockets), **Python** (Motor de IA Generativa Gemini + Streaming de Músicas com `yt-dlp`), um **Centro de Controlo Desktop nativo (Electron)** e um **Dashboard Web** responsivo em tempo real.

---

## 🌟 Principais Funcionalidades

### 🧠 1. Inteligência Artificial Generativa (Google Gemini)
* Respostas naturais contextualizadas com controle de memória de curto e longo prazo.
* Comandos diretos de IA (`!ia <pergunta>`) e conversação livre em grupos ou no privado.
* Suporte multimodal e configuração dinâmica de prompts de persona diretamente pelo painel desktop.

### 💰 2. Sistema Completo de Economia, XP & Ranking Semanal
* **Carteira de XP persistente** com banco de dados em disco (`config/users.json`).
* **Recompensa Diária (`!diaria`)**: Cooldown de 24 horas e prêmio aleatório configurável.
* **Jornada de Trabalho (`!trabalho`)**: Mais de 18 profissões interativas com remuneração em XP.
* **Cassino e Apostas (`!bet <valor>`)**: Multiplicador 2.0x, proteção anti-exploit e estatísticas detalhadas.
* **Transferência / PIX (`!enviar @membro <valor>`)**: Transações atômicas com limite diário de 1.500 XP/dia.
* **Ranking Semanal Competitivo (`!ranking`)**:
  * Temporada ativa de **Segunda-feira (00:00) a Sábado (23:59)**.
  * **Domingo é dia de folga** (o XP ganho vai para a carteira, mas não acumula para a semana seguinte).
  * Zera automaticamente toda segunda-feira para um novo ciclo de disputas.
* **Auditoria Financeira (`!extrato`, `!addxp`, `!removexp`)**: Histórico com log de transações (`config/transactions.json`).

### 🎵 3. Multimídia & Streaming do YouTube
* **Comando `!play <música>`**:
  * Resolução e streaming de áudio de alta qualidade via Python + `yt-dlp`.
  * Envio de **capa HD oficial** com card ornamental e envio direto do arquivo de áudio.
  * Integração de custo com a Economia: **50 XP cobrados apenas após o sucesso do download**.
* `!ytmp3` (áudio direto), `!ytmp4` (vídeo HD) e `!letra` (busca de letras completas).

### 💍 4. Cadastro de Membros & Sistema de Namoro
* Cadastro obrigatório com `!cad <nome> <sexo> <idade>` para uso dos recursos do bot.
* Pedidos de namoro interativos com confirmação (`!namorar`, `!aceitar`, `!recusar`, `!terminar`, `!casal`).

### 🖥️ 5. Centro de Controlo Desktop & Dashboard Web
* **Aplicação Desktop Nativa (Electron)** conectada à porta local `3000`.
* **Emparelhamento Flexível do WhatsApp**: Conexão por **Código de 8 dígitos** (sem câmera) ou por **QR Code**.
* **Gestão de Economia & Membros**: Tabela com ranking semanal, ajuste de saldo em tempo real e extrato ao vivo.
* **Produtividade Integrada**: Lembretes automáticos, mural de recados e gerenciador de tarefas com prioridades.
* **Streaming de Auditoria**: Visualizador de logs do terminal em tempo real via WebSockets.

---

## 📁 Arquitetura do Projeto

```
bot_whatsap_com_ia/
├── desktop/                           # Aplicação Desktop Nativa (Electron)
│   ├── main.js                        # Processo Principal do Electron
│   └── preload.js                     # IPC Bridge seguro
│
├── services/
│   ├── whatsapp-gateway/              # Gateway Node.js (ES Modules)
│   │   ├── src/
│   │   │   ├── commands/              # 40+ Comandos modulares
│   │   │   │   ├── economy/           # !diaria, !trabalho, !bet, !enviar, !carteira, !ranking, !addxp, etc.
│   │   │   │   ├── music/             # !play, !ytmp3, !ytmp4, !letra
│   │   │   │   ├── admin/             # !grupo, !fechar, !abrir, !kick
│   │   │   │   ├── games/             # !quiz, !trivia, !piada
│   │   │   │   └── utils/             # !cad, !perfil, !namorar, !menu, !ping, !sticker, etc.
│   │   │   ├── modules/               # userStore, economyService, permissionManager, followUpManager
│   │   │   ├── whatsapp/              # Cliente Baileys Socket & Gerenciador de Sessão
│   │   │   ├── server/                # Express REST API, Rotas e Servidor WebSocket
│   │   │   └── handlers/              # Despachante e manipulador central de eventos
│   │   ├── public/                    # Frontend do Dashboard (HTML5, CSS3, Vanilla JS)
│   │   │   ├── css/style.css          # Estilos escuros modernos, animações e glassmorphism
│   │   │   ├── js/app.js              # Controlador do Dashboard, WebSockets e API Client
│   │   │   └── index.html             # Interface das 9 seções do painel
│   │   └── package.json
│   │
│   └── ai-engine/                     # Motor de Inteligência Artificial (Python FastAPI)
│       ├── app/
│       │   ├── api/routes/            # Endpoints REST (/chat, /music/resolve, /health)
│       │   ├── services/              # MusicResolver (yt-dlp), GeminiService (google-genai)
│       │   └── memory/                # Gestão de sessões e histórico de conversas
│       ├── requirements.txt
│       └── main.py
│
├── config/                            # Armazenamento e Configurações Persistentes
│   ├── users.json                     # Banco de dados de usuários e saldos de XP
│   ├── transactions.json              # Histórico de transações financeiras
│   ├── productivity.json              # Lembretes, notas e tarefas do painel
│   └── settings.json                  # Toggles, donos e configurações de grupos
│
├── scripts/
│   ├── setup.bat                      # Instalador completo com dependências
│   └── start-all.bat                  # Inicializador dos serviços integrados
│
├── package.json                       # Scripts globais do projeto
└── README.md                          # Este documento
```

---

## 📜 Lista de Comandos Disponíveis

| Comando | Aliases | Permissão | Descrição |
| :--- | :--- | :---: | :--- |
| **`!menu`** | `!ajuda`, `!help`, `!comandos` | `PUBLIC` | Exibe o menu ornamental geral ou por categoria (`!menueconomia`, `!menumusic`, etc.) |
| **`!cad`** | `!registrar`, `!cadastro` | `PUBLIC` | Cadastra o perfil no bot (`!cad <nome> <sexo> <idade>`) |
| **`!perfil`** | `!meuperfil`, `!me` | `PUBLIC` | Exibe o card de perfil, idade, cônjuge e saldo de XP |
| **`!diaria`** | `!daily`, `!recompensa` | `PUBLIC` | Coleta a recompensa diária de XP (Cooldown: 24h) |
| **`!trabalho`** | `!work`, `!trampo` | `PUBLIC` | Trabalha para receber salário em XP (Cooldown: 24h) |
| **`!carteira`** | `!saldo`, `!wallet`, `!xp` | `PUBLIC` | Exibe o saldo de XP, timers de recarga e estatísticas |
| **`!bet <valor>`** | `!apostar`, `!cassino` | `PUBLIC` | Aposta XP no cassino com multiplicador de 2.0x |
| **`!enviar @user <xp>`** | `!pix`, `!pay`, `!transferir` | `PUBLIC` | Transfere XP para outro membro (Limite: 1.500 XP/dia) |
| **`!ranking`** | `!top`, `!rank`, `!topxp` | `PUBLIC` | Ranking Semanal de XP (Seg a Sáb - Reseta toda semana) |
| **`!extrato`** | `!historico` | `PUBLIC` | Histórico das últimas movimentações financeiras |
| **`!play <música>`** | `!tocar`, `!musica` | `PUBLIC` | Baixa e envia música do YouTube com capa HD (Custa 50 XP) |
| **`!ytmp3 <link/nome>`** | `!audio` | `PUBLIC` | Extrai áudio direto de vídeos do YouTube |
| **`!ytmp4 <link/nome>`** | `!video` | `PUBLIC` | Baixa vídeo em MP4 do YouTube |
| **`!letra <música>`** | `!lyrics` | `PUBLIC` | Busca a letra sincronizada/formatada da música |
| **`!namorar @membro`** | `!casar`, `!proposta` | `PUBLIC` | Envia um pedido de namoro ou casamento |
| **`!aceitar` / `!recusar`** | — | `PUBLIC` | Responde ao pedido de relacionamento pendente |
| **`!terminar`** | `!divorcio` | `PUBLIC` | Rompe o relacionamento atual |
| **`!casal`** | `!relacionamento` | `PUBLIC` | Exibe o status e tempo de união do casal |
| **`!ia <pergunta>`** | `!gemini`, `!ask` | `PUBLIC` | Consulta direta à Inteligência Artificial Gemini |
| **`!sticker`** | `!s`, `!fig` | `PUBLIC` | Converte imagens enviadas/respondidas em figurinhas |
| **`!clima <cidade>`** | `!tempo` | `PUBLIC` | Previsão meteorológica detalhada |
| **`!calc <expressão>`** | `!calcular` | `PUBLIC` | Calculadora de operações matemáticas |
| **`!quiz`** | `!jogo` | `PUBLIC` | Jogo de perguntas e respostas de múltipla escolha |
| **`!trivia`** | `!curiosidade` | `PUBLIC` | Exibe curiosidades aleatórias do mundo |
| **`!piada`** | `!joke` | `PUBLIC` | Conta uma piada divertida |
| **`!grupo <abrir\|fechar>`** | `!abrir`, `!fechar` | `ADMIN` | Altera as permissões de envio de mensagens no grupo |
| **`!kick @membro`** | `!ban`, `!remover` | `ADMIN` | Remove o participante marcado do grupo |
| **`!addxp @user <xp>`** | `!darxp` | `ADMIN` | Injeta XP no saldo de um membro |
| **`!removexp @user <xp>`** | `!tirarxp` | `ADMIN` | Deduz XP da conta de um membro |

---

## 🚀 Como Instalar e Executar

### 📋 Pré-requisitos
* **Node.js** v18 ou superior instalado ([Download](https://nodejs.org/))
* **Python** v3.10 ou superior instalado ([Download](https://www.python.org/))
* **FFmpeg** instalado e acessível no PATH do sistema (necessário para processamento de áudio do `yt-dlp`)

---

### 1️⃣ Instalação Automática

Execute o script de instalação para configurar automaticamente o ambiente Node.js e o ambiente virtual Python:

```cmd
scripts\setup.bat
```

---

### 2️⃣ Instalação Manual

Se preferir instalar manualmente passo a passo:

```bash
# 1. Instalar dependências da raiz e gateway
npm install
npm --prefix services/whatsapp-gateway install

# 2. Criar e configurar o ambiente virtual Python do AI Engine
cd services/ai-engine
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

---

### 3️⃣ Configuração das Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (baseado em `.env.example`):

```env
# Porta do Gateway Node.js
PORT=3000

# Chave de API do Google Gemini (Obtenha gratuitamente em: https://aistudio.google.com/)
GEMINI_API_KEY=sua_chave_gemini_aqui

# URL interna do motor de IA em Python
AI_ENGINE_URL=http://127.0.0.1:8000

# Números de telefone dos Administradores/Donos (com código de país, sem espaços)
OWNER_NUMBERS=244923000000,5511999999999
```

---

### 4️⃣ Inicialização do Sistema

Para iniciar todos os serviços simultaneamente:

```bash
# Modo desenvolvimento completo (Node + Python + Desktop)
npm run dev
```

Ou execute o script em lote do Windows:

```cmd
scripts\start-all.bat
```

---

### 🌐 5️⃣ Acesso às Interfaces

* **🖥️ Centro de Controlo Desktop (Electron)**: Abre automaticamente após a inicialização.
* **🌐 Dashboard Web**: [http://localhost:3000](http://localhost:3000)
* **📚 Documentação da API Python (FastAPI Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛡️ Segurança & Anti-Exploit

* **Controle Estrito de Tipos**: Todas as operações financeiras de XP rejeitam números negativos, decimais, `NaN` e valores infinitos.
* **Execução Atômica**: Débitos e créditos em transferências ocorrem em bloco com gravação síncrona para evitar duplicações de saldo.
* **Persistência de Cooldowns**: Timers de diária e trabalho são baseados em timestamps ISO reais, prevenindo fraudes mesmo se o bot for reiniciado.

---

## 👤 Autor

Desenvolvido por **João Mananga** — [GitHub](https://github.com/Sadizn)

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).
