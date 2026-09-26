# 🤖 WhatsApp Bot com IA & Dashboard de Controlo

Bot de WhatsApp modular e híbrido construído em **Node.js** (conexão WhatsApp via Baileys + Servidor de Dashboard) e **Python** (motor de IA com Google Gemini + arquitetura de automações), acompanhado de um **Dashboard de Controlo em Tempo Real** para monitorar e gerenciar integrações.

---

## 🚀 Principais Recursos

- **Conexão Leve do WhatsApp**: Utiliza `@whiskeysockets/baileys` — conexão direta via WebSocket sem a necessidade de manter navegadores pesados (Chromium/Puppeteer) abertos.
- **Motor de IA Desacoplado**: Microsserviço assíncrono em Python (FastAPI) preparado para modelos de linguagem natural (Google Gemini via SDK oficial `google-genai`), com controle de histórico de conversas e prompt de sistema.
- **Painel de Controlo / Dashboard**:
  - Exibição de QR Code em tempo real via WebSockets.
  - Toggles (interruptores) para ligar e desligar a IA e respostas automáticas sem reiniciar o bot.
  - Controle de filtros (responder apenas no privado, ignorar grupos, exigir prefixo).
  - Editor de prompt de sistema e seleção de modelo de IA diretamente pelo navegador.
  - Visualizador de logs do sistema em tempo real.
- **Estrutura Extensível para Automações**: Camada de plugins em Python onde você pode adicionar facilmente novas regras de negócio, raspagem de dados, integrações com CRM e ferramentas externas.

---

## 📁 Estrutura de Diretórios

```
bot_whatsap_com_ia/
├── services/
│   ├── whatsapp-gateway/          # Node.js: WhatsApp Baileys + API + Dashboard
│   │   ├── src/
│   │   │   ├── config/            # Configurações do serviço
│   │   │   ├── whatsapp/          # Gerenciamento de conexão e QR Code
│   │   │   ├── handlers/          # Filtros e despachante de mensagens
│   │   │   ├── clients/           # Comunicação HTTP com o serviço Python
│   │   │   ├── server/            # Servidor Express, Rotas e WebSockets
│   │   │   └── utils/             # Logger com buffer e persistência de toggles
│   │   ├── public/                # Frontend do Dashboard (HTML/CSS/JS)
│   │   └── package.json
│   │
│   └── ai-engine/                 # Python: FastAPI + Google Gemini + Automações
│       ├── app/
│       │   ├── core/              # Configurações e variáveis de ambiente
│       │   ├── api/               # Endpoints REST (/chat, /health, /automations)
│       │   ├── providers/         # Integração com Google Gemini
│       │   ├── memory/            # Histórico de conversas com contexto
│       │   └── automations/       # Arquitetura de plugins e automações
│       ├── requirements.txt
│       └── main.py
│
├── config/                        # Modelos e arquivos de configuração
│   ├── .env.example
│   └── integrations.json          # Persistência do estado dos switches do Dashboard
│
├── scripts/
│   ├── setup.bat                  # Instalação automatizada com Yarn e Python venv
│   └── start-all.bat              # Inicialização simultânea dos serviços
│
├── docs/
│   └── architecture.md            # Documentação arquitetural detalhada
│
├── package.json                   # Scripts Yarn orquestradores na raiz
└── README.md
```

---

## 🛠️ Como Instalar e Rodar

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **Yarn** (`yarn --version`)
- **Python** (versão 3.10 ou superior)

### 1. Instalação Automática (Windows)
Basta executar o script de configuração:
```cmd
scripts\setup.bat
```
Ou manualmente com Yarn:
```bash
# Na raiz:
yarn install

# No gateway:
yarn --cwd services/whatsapp-gateway install

# No motor de IA (Python):
cd services/ai-engine
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

### 2. Configurar a Chave de IA
Abra o arquivo `.env` gerado na raiz e configure sua chave da API do Gemini (obtida gratuitamente no [Google AI Studio](https://aistudio.google.com/)):
```env
GEMINI_API_KEY=sua_chave_aqui
```

### 3. Iniciar os Serviços
Você pode iniciar tudo com um clique executando:
```cmd
scripts\start-all.bat
```
Ou via linha de comando com Yarn na raiz:
```bash
yarn dev
```

### 4. Acessar o Dashboard
Abra seu navegador em:
👉 **[http://localhost:3000](http://localhost:3000)**

1. Escaneie o QR Code exibido na tela com seu aplicativo do WhatsApp.
2. Controle em tempo real as respostas, ligue/desligue módulos e personalize as instruções do bot!
3. Acesse a documentação Swagger do motor de IA em **[http://localhost:8000/docs](http://localhost:8000/docs)**.
