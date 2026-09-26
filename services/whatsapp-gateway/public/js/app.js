// Estado do App no Cliente
const state = {
  config: null,
  whatsapp: null,
  aiService: null,
  logs: []
};

// Elementos DOM
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');
const pageHeading = document.getElementById('page-heading');
const pageSubheading = document.getElementById('page-subheading');

const wppDot = document.getElementById('wpp-dot');
const wppStatusText = document.getElementById('wpp-status-text');
const aiDot = document.getElementById('ai-dot');
const aiStatusText = document.getElementById('ai-status-text');

const statReceived = document.getElementById('stat-received');
const statSent = document.getElementById('stat-sent');
const statModel = document.getElementById('stat-model');
const statActiveIntegrations = document.getElementById('stat-active-integrations');

const wppBadge = document.getElementById('wpp-badge');
const qrContainer = document.getElementById('qr-container');
const qrImage = document.getElementById('qr-image');
const qrSpinner = document.getElementById('qr-spinner');
const qrHelp = document.getElementById('qr-help');
const connectedInfo = document.getElementById('connected-info');
const userPhone = document.getElementById('user-phone');

const btnRestartWa = document.getElementById('btn-restart-wa');
const btnDisconnectWa = document.getElementById('btn-disconnect-wa');
const btnRefresh = document.getElementById('btn-refresh');
const btnClearLogs = document.getElementById('btn-clear-logs');

// Toggles
const toggleAutoReply = document.getElementById('toggle-autoreply');
const toggleAiEngine = document.getElementById('toggle-ai-engine');
const togglePrivate = document.getElementById('toggle-private');
const toggleGroups = document.getElementById('toggle-groups');
const togglePrefix = document.getElementById('toggle-prefix');

const integrationsList = document.getElementById('integrations-list');
const logsContainer = document.getElementById('logs-container');
const toastEl = document.getElementById('toast');

// Form IA
const aiConfigForm = document.getElementById('ai-config-form');
const aiModelSelect = document.getElementById('ai-model-select');
const systemPromptText = document.getElementById('system-prompt-text');
const apiKeyInput = document.getElementById('api-key-input');

// 1. Navegação de Abas
const tabTitles = {
  'tab-overview': { title: 'Visão Geral do Bot', sub: 'Monitore a conexão do WhatsApp e o status das automações' },
  'tab-integrations': { title: 'Integrações & APIs', sub: 'Ligue ou desligue módulos e APIs em tempo real' },
  'tab-ai': { title: 'Configurações de IA & Prompts', sub: 'Personalize as instruções e personalidade do assistente' },
  'tab-logs': { title: 'Logs do Sistema', sub: 'Acompanhe as mensagens recebidas, processamento e erros' }
};

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const targetTab = item.getAttribute('data-tab');
    navItems.forEach(n => n.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));

    item.classList.add('active');
    document.getElementById(targetTab).classList.add('active');

    if (tabTitles[targetTab]) {
      pageHeading.innerText = tabTitles[targetTab].title;
      pageSubheading.innerText = tabTitles[targetTab].sub;
    }
  });
});

// 2. Toast Notificação
function showToast(message, isError = false) {
  toastEl.innerText = message;
  toastEl.style.backgroundColor = isError ? 'var(--danger)' : 'var(--primary)';
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}

// 3. Atualizar UI de Status do WhatsApp
function updateWhatsAppUI(wa) {
  state.whatsapp = wa;
  const status = wa.status || 'DISCONNECTED';

  if (status === 'CONNECTED') {
    wppDot.className = 'dot online';
    wppStatusText.innerText = 'Conectado';
    wppBadge.className = 'badge success';
    wppBadge.innerText = 'Conectado';

    qrContainer.style.display = 'none';
    connectedInfo.style.display = 'block';
    userPhone.innerText = `ID: ${wa.userInfo?.id || 'WhatsApp Ativo'}`;
  } else if (status === 'AWAITING_QR_SCAN') {
    wppDot.className = 'dot';
    wppStatusText.innerText = 'Aguardando QR Code';
    wppBadge.className = 'badge warning';
    wppBadge.innerText = 'Aguardando Leitura';

    connectedInfo.style.display = 'none';
    qrContainer.style.display = 'flex';
    if (wa.qr) {
      qrSpinner.style.display = 'none';
      qrImage.src = wa.qr;
      qrImage.style.display = 'block';
      qrHelp.innerText = 'Aponte a câmera do seu WhatsApp para conectar.';
    } else {
      qrSpinner.style.display = 'block';
      qrImage.style.display = 'none';
      qrHelp.innerText = 'Gerando QR Code...';
    }
  } else {
    wppDot.className = 'dot offline';
    wppStatusText.innerText = status === 'CONNECTING' ? 'Conectando...' : 'Desconectado';
    wppBadge.className = 'badge';
    wppBadge.innerText = status;

    connectedInfo.style.display = 'none';
    qrContainer.style.display = 'flex';
    qrImage.style.display = 'none';
    qrSpinner.style.display = 'block';
    qrHelp.innerText = 'Iniciando serviço de WhatsApp...';
  }

  // Atualizar Estatísticas
  if (wa.stats) {
    statReceived.innerText = wa.stats.messagesReceived || 0;
    statSent.innerText = wa.stats.messagesSent || 0;
  }
}

// 4. Atualizar UI de Status da IA
function updateAIStatusUI(aiService) {
  state.aiService = aiService;
  if (aiService && aiService.online) {
    aiDot.className = 'dot online';
    aiStatusText.innerText = 'Online';
  } else {
    aiDot.className = 'dot offline';
    aiStatusText.innerText = 'Offline';
  }
}

// 5. Renderizar Lista de Integrações
function renderIntegrations(integrations = []) {
  integrationsList.innerHTML = '';
  
  if (integrations.length === 0) {
    integrationsList.innerHTML = '<p class="text-muted">Nenhuma integração secundária cadastrada.</p>';
    return;
  }

  let activeCount = 0;
  integrations.forEach(item => {
    if (item.enabled) activeCount++;

    const card = document.createElement('div');
    card.className = 'integration-card';
    card.innerHTML = `
      <div>
        <div class="integration-header">
          <h4>${item.name}</h4>
          <label class="switch">
            <input type="checkbox" data-id="${item.id}" ${item.enabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        <p>${item.description}</p>
      </div>
      <div>
        <span class="badge ${item.enabled ? 'success' : ''}">${item.enabled ? 'Ativo' : 'Desativado'}</span>
      </div>
    `;

    const checkbox = card.querySelector('input');
    checkbox.addEventListener('change', async (e) => {
      const enabled = e.target.checked;
      await toggleIntegrationAPI(item.id, enabled);
    });

    integrationsList.appendChild(card);
  });

  statActiveIntegrations.innerText = activeCount;
}

// 6. Atualizar Toggles Gerais do Form
function updateConfigUI(cfg) {
  state.config = cfg;

  if (cfg.ai) {
    toggleAiEngine.checked = Boolean(cfg.ai.enabled);
    if (cfg.ai.model) {
      aiModelSelect.value = cfg.ai.model;
      statModel.innerText = cfg.ai.model;
    }
    if (cfg.ai.systemPrompt) {
      systemPromptText.value = cfg.ai.systemPrompt;
    }
  }

  if (cfg.whatsapp) {
    toggleAutoReply.checked = cfg.whatsapp.autoReply !== false;
    togglePrivate.checked = cfg.whatsapp.respondPrivate !== false;
    toggleGroups.checked = Boolean(cfg.whatsapp.respondGroups);
    togglePrefix.checked = Boolean(cfg.whatsapp.prefixOnly);
  }

  if (cfg.integrations) {
    renderIntegrations(cfg.integrations);
  }
}

// 7. Renderizar Logs
function renderLogs(logs = []) {
  logsContainer.innerHTML = '';
  logs.forEach(log => {
    const line = document.createElement('div');
    line.className = `log-line ${log.level || 'info'}`;
    const time = new Date(log.timestamp).toLocaleTimeString();
    line.innerHTML = `
      <span class="timestamp">[${time}]</span>
      <span class="level">[${(log.level || 'INFO').toUpperCase()}]</span>
      <span class="msg">${escapeHtml(log.message)}</span>
    `;
    logsContainer.appendChild(line);
  });
}

function appendLog(log) {
  const line = document.createElement('div');
  line.className = `log-line ${log.level || 'info'}`;
  const time = new Date(log.timestamp).toLocaleTimeString();
  line.innerHTML = `
    <span class="timestamp">[${time}]</span>
    <span class="level">[${(log.level || 'INFO').toUpperCase()}]</span>
    <span class="msg">${escapeHtml(log.message)}</span>
  `;
  logsContainer.prepend(line);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 8. Chamadas à API REST
async function fetchStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (data.whatsapp) updateWhatsAppUI(data.whatsapp);
    if (data.aiService) updateAIStatusUI(data.aiService);
  } catch (err) {
    console.error('Erro ao buscar status:', err);
  }
}

async function fetchConfig() {
  try {
    const res = await fetch('/api/config');
    const cfg = await res.json();
    updateConfigUI(cfg);
  } catch (err) {
    console.error('Erro ao buscar configurações:', err);
  }
}

async function fetchLogs() {
  try {
    const res = await fetch('/api/logs?limit=50');
    const data = await res.json();
    renderLogs(data.logs || []);
  } catch (err) {
    console.error('Erro ao buscar logs:', err);
  }
}

async function saveGeneralConfig(partialConfig) {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partialConfig)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Configuração salva com sucesso!');
      updateConfigUI(data.config);
    }
  } catch (err) {
    showToast('Falha ao salvar configuração.', true);
  }
}

async function toggleIntegrationAPI(id, enabled) {
  try {
    const res = await fetch(`/api/integrations/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Integração ${enabled ? 'ativada' : 'desativada'}!`);
      updateConfigUI(data.config);
    }
  } catch (err) {
    showToast('Erro ao alternar integração.', true);
  }
}

// 9. Event Listeners dos Toggles Rápidos
toggleAutoReply.addEventListener('change', (e) => {
  saveGeneralConfig({
    whatsapp: { ...state.config?.whatsapp, autoReply: e.target.checked }
  });
});

toggleAiEngine.addEventListener('change', (e) => {
  saveGeneralConfig({
    ai: { ...state.config?.ai, enabled: e.target.checked }
  });
});

togglePrivate.addEventListener('change', (e) => {
  saveGeneralConfig({
    whatsapp: { ...state.config?.whatsapp, respondPrivate: e.target.checked }
  });
});

toggleGroups.addEventListener('change', (e) => {
  saveGeneralConfig({
    whatsapp: { ...state.config?.whatsapp, respondGroups: e.target.checked }
  });
});

togglePrefix.addEventListener('change', (e) => {
  saveGeneralConfig({
    whatsapp: { ...state.config?.whatsapp, prefixOnly: e.target.checked }
  });
});

// Form IA Submit
aiConfigForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const model = aiModelSelect.value;
  const prompt = systemPromptText.value;

  saveGeneralConfig({
    ai: {
      ...state.config?.ai,
      model: model,
      systemPrompt: prompt
    }
  });
});

// Ações do WhatsApp
btnRestartWa.addEventListener('click', async () => {
  showToast('Solicitando reinicialização do WhatsApp...');
  try {
    await fetch('/api/whatsapp/restart', { method: 'POST' });
    setTimeout(fetchStatus, 1500);
  } catch (err) {
    showToast('Erro ao reiniciar WhatsApp.', true);
  }
});

btnDisconnectWa.addEventListener('click', async () => {
  if (confirm('Tem certeza que deseja desconectar o WhatsApp? Será necessário escanear o QR Code novamente.')) {
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      showToast('WhatsApp desconectado.');
      setTimeout(fetchStatus, 1500);
    } catch (err) {
      showToast('Erro ao desconectar WhatsApp.', true);
    }
  }
});

btnRefresh.addEventListener('click', () => {
  fetchStatus();
  fetchConfig();
  fetchLogs();
  showToast('Dados atualizados!');
});

btnClearLogs.addEventListener('click', () => {
  logsContainer.innerHTML = '';
});

// 10. Conexão WebSocket para Atualizações em Tempo Real
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('Conectado ao WebSocket do servidor.');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'INIT') {
        if (data.payload.whatsapp) updateWhatsAppUI(data.payload.whatsapp);
        if (data.payload.logs) renderLogs(data.payload.logs);
      } else if (data.type === 'STATUS_UPDATE') {
        updateWhatsAppUI(data.payload);
      } else if (data.type === 'CONFIG_UPDATE') {
        updateConfigUI(data.payload);
      } else if (data.type === 'LOG') {
        appendLog(data.payload);
      }
    } catch (err) {
      console.error('Erro ao processar mensagem WS:', err);
    }
  };

  ws.onclose = () => {
    // Tentar reconectar após 3 segundos
    setTimeout(connectWebSocket, 3000);
  };
}

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
  fetchStatus();
  fetchConfig();
  fetchLogs();
  connectWebSocket();

  // Intervalo de segurança para checagem de saúde da IA
  setInterval(fetchStatus, 10000);
});
