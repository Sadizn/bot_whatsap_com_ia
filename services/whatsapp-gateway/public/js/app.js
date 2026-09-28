// Estado Central da Aplicação Desktop
const state = {
  config: null,
  whatsapp: null,
  aiService: null,
  conversations: [],
  reminders: [],
  notes: [],
  tasks: [],
  commands: [],
  groups: {},
  logs: [],
  taskFilter: 'all',
  serverOnline: false
};

// ==========================================
// 1. MAPEAMENTO DE ELEMENTOS DOM
// ==========================================
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');
const pageHeading = document.getElementById('page-heading');
const pageSubheading = document.getElementById('page-subheading');

const wppDot = document.getElementById('wpp-dot');
const wppStatusText = document.getElementById('wpp-status-text');
const aiDot = document.getElementById('ai-dot');
const aiStatusText = document.getElementById('ai-status-text');

const serverBadge = document.getElementById('server-connection-badge');
const badgeText = document.getElementById('badge-text');

// Stat Cards
const statReceived = document.getElementById('stat-received');
const statSent = document.getElementById('stat-sent');
const statTasksCount = document.getElementById('stat-tasks-count');
const statGroupsCount = document.getElementById('stat-groups-count');

// WhatsApp Box & Auth Modes
const wppBadge = document.getElementById('wpp-badge');
const authModeSelector = document.getElementById('auth-mode-selector');
const tabBtnPairing = document.getElementById('tab-btn-pairing');
const tabBtnQr = document.getElementById('tab-btn-qr');
const pairingView = document.getElementById('pairing-view');
const qrView = document.getElementById('qr-view');

const formPairing = document.getElementById('form-pairing');
const pairingPhoneInput = document.getElementById('pairing-phone-input');
const btnRequestPairing = document.getElementById('btn-request-pairing');
const btnPairingText = document.getElementById('btn-pairing-text');
const pairingSpinner = document.getElementById('pairing-spinner');
const pairingCodeResult = document.getElementById('pairing-code-result');
const otpDisplay = document.getElementById('otp-display');
const btnCopyPairingCode = document.getElementById('btn-copy-pairing-code');
const copyCodeText = document.getElementById('copy-code-text');

const qrContainer = document.getElementById('qr-container');
const qrImage = document.getElementById('qr-image');
const qrSpinner = document.getElementById('qr-spinner');
const qrHelp = document.getElementById('qr-help');
const connectedInfo = document.getElementById('connected-info');
const userPhone = document.getElementById('user-phone');

const btnRestartWa = document.getElementById('btn-restart-wa');
const btnDisconnectWa = document.getElementById('btn-disconnect-wa');
const btnRefresh = document.getElementById('btn-refresh');

// Containers
const overviewActivityList = document.getElementById('overview-activity-list');
const conversationsContainer = document.getElementById('conversations-container');
const remindersContainer = document.getElementById('reminders-container');
const remindersCountBadge = document.getElementById('reminders-count-badge');
const notesContainer = document.getElementById('notes-container');
const tasksContainer = document.getElementById('tasks-container');
const commandsContainer = document.getElementById('commands-container');
const logsContainer = document.getElementById('logs-container');
const toastEl = document.getElementById('toast');

// Toggles & Forms
const toggleAutoReply = document.getElementById('toggle-autoreply');
const toggleAiEngine = document.getElementById('toggle-ai-engine');
const togglePrivate = document.getElementById('toggle-private');
const toggleGroups = document.getElementById('toggle-groups');
const toggleFollowup = document.getElementById('toggle-followup');

const aiConfigForm = document.getElementById('ai-config-form');
const aiModelSelect = document.getElementById('ai-model-select');
const systemPromptText = document.getElementById('system-prompt-text');
const systemPromptGroupText = document.getElementById('system-prompt-group-text');
const apiKeyInput = document.getElementById('api-key-input');
const btnSaveAi = document.getElementById('btn-save-ai');
const saveStatusIndicator = document.getElementById('save-status-indicator');
const btnToggleKey = document.getElementById('btn-toggle-key-visibility');

// Assistente Chat
const chatMessages = document.getElementById('chat-messages');
const formChat = document.getElementById('form-chat');
const chatInput = document.getElementById('chat-input');
const btnClearChat = document.getElementById('btn-clear-chat');

// ==========================================
// 2. NAVEGAÇÃO ENTRE AS 9 SEÇÕES
// ==========================================
const tabTitles = {
  'tab-overview': { title: 'Início', sub: 'Visão central do estado da Edith, mensagens pendentes e produtividade' },
  'tab-messages': { title: 'Mensagens', sub: 'Acompanhe conversas pendentes, alertas de escalação e responda pelo Desktop' },
  'tab-reminders': { title: 'Lembretes', sub: 'Gerencie prazos e avisos que a Edith deve monitorar para você' },
  'tab-notes': { title: 'Recados', sub: 'Mural de notas rápidas para fixar ideias e detalhes do dia a dia' },
  'tab-tasks': { title: 'Tarefas', sub: 'Acompanhamento de tarefas e afazeres com prioridades' },
  'tab-assistant': { title: 'Assistente', sub: 'Converse diretamente com a Edith pelo Desktop usando o motor de IA existente' },
  'tab-economy': { title: 'Economia & Ranking Semanal', sub: 'Métricas de XP, Ranking Semanal (Segunda a Sábado) e Gestão Administrativa' },
  'tab-groups': { title: 'Bot de Grupos', sub: 'Monitore comandos, permissões e configurações por grupo' },
  'tab-activity': { title: 'Atividade & Logs', sub: 'Streaming de auditoria em tempo real de eventos de WhatsApp, comandos e IA' },
  'tab-settings': { title: 'Definições', sub: 'Central de configurações gerais, WhatsApp, IA e acompanhamento automático' }
};

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const targetTab = item.getAttribute('data-tab');
    navItems.forEach(n => n.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));

    item.classList.add('active');
    const pane = document.getElementById(targetTab);
    if (pane) pane.classList.add('active');

    if (tabTitles[targetTab]) {
      pageHeading.innerText = tabTitles[targetTab].title;
      pageSubheading.innerText = tabTitles[targetTab].sub;
    }

    // Carregamento sob demanda
    if (targetTab === 'tab-messages') fetchConversations();
    if (targetTab === 'tab-reminders') fetchReminders();
    if (targetTab === 'tab-notes') fetchNotes();
    if (targetTab === 'tab-tasks') fetchTasks();
    if (targetTab === 'tab-economy') fetchEconomy();
    if (targetTab === 'tab-groups') { fetchCommands(); fetchGroups(); }
    if (targetTab === 'tab-activity') fetchLogs();
  });
});

// Toast Notificação
function showToast(message, isError = false) {
  if (!toastEl) return;
  toastEl.innerText = message;
  toastEl.style.backgroundColor = isError ? 'var(--danger)' : 'var(--primary)';
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ==========================================
// 3. ATUALIZAÇÕES DE STATUS (WHATSAPP, IA & GATEWAY)
// ==========================================
function updateServerStatusUI(online) {
  state.serverOnline = online;
  if (online) {
    serverBadge.classList.remove('offline');
    badgeText.innerText = 'Conectado ao Gateway';
  } else {
    serverBadge.classList.add('offline');
    badgeText.innerText = 'Gateway Desconectado';
  }
}

function updateWhatsAppUI(wa) {
  state.whatsapp = wa;
  const status = wa.status || 'DISCONNECTED';

  if (status === 'CONNECTED') {
    wppDot.className = 'dot online';
    wppStatusText.innerText = 'Conectado';
    wppBadge.className = 'badge success';
    wppBadge.innerText = 'Conectado';

    if (authModeSelector) authModeSelector.style.display = 'none';
    if (pairingView) pairingView.style.display = 'none';
    if (qrView) qrView.style.display = 'none';
    if (connectedInfo) connectedInfo.style.display = 'flex';
    if (userPhone) userPhone.innerText = `ID: ${wa.userInfo?.id || 'WhatsApp Ativo'}`;
  } else {
    if (authModeSelector) authModeSelector.style.display = 'flex';
    if (connectedInfo) connectedInfo.style.display = 'none';

    const isPairingActive = tabBtnPairing && tabBtnPairing.classList.contains('active');
    if (pairingView) pairingView.style.display = isPairingActive ? 'block' : 'none';
    if (qrView) qrView.style.display = !isPairingActive ? 'block' : 'none';

    if (status === 'AWAITING_PAIRING_CODE') {
      wppDot.className = 'dot warning';
      wppStatusText.innerText = 'Aguardando Código';
      wppBadge.className = 'badge warning';
      wppBadge.innerText = 'Aguardando Pareamento';

      if (wa.pairingCode && otpDisplay) {
        const formatted = wa.pairingCode.length === 8 
          ? `${wa.pairingCode.slice(0, 4)} - ${wa.pairingCode.slice(4)}` 
          : wa.pairingCode;
        otpDisplay.innerText = formatted;
        if (pairingCodeResult) pairingCodeResult.style.display = 'block';
      }
    } else if (status === 'AWAITING_QR_SCAN') {
      wppDot.className = 'dot warning';
      wppStatusText.innerText = 'Aguardando QR';
      wppBadge.className = 'badge warning';
      wppBadge.innerText = 'Aguardando Leitura';

      if (wa.qr) {
        if (qrSpinner) qrSpinner.style.display = 'none';
        if (qrImage) {
          qrImage.src = wa.qr;
          qrImage.style.display = 'block';
        }
        if (qrHelp) qrHelp.innerText = 'Aponte a câmera do WhatsApp para ler o QR Code.';
      } else {
        if (qrSpinner) qrSpinner.style.display = 'block';
        if (qrImage) qrImage.style.display = 'none';
        if (qrHelp) qrHelp.innerText = 'Gerando QR Code...';
      }
    } else if (status === 'CONNECTING') {
      wppDot.className = 'dot warning';
      wppStatusText.innerText = 'Conectando...';
      wppBadge.className = 'badge';
      wppBadge.innerText = 'Conectando...';

      if (qrSpinner) qrSpinner.style.display = 'block';
      if (qrImage) qrImage.style.display = 'none';
      if (qrHelp) qrHelp.innerText = 'Iniciando socket Baileys...';
    } else {
      wppDot.className = 'dot offline';
      wppStatusText.innerText = 'Desconectado';
      wppBadge.className = 'badge danger';
      wppBadge.innerText = 'Desconectado';

      if (qrSpinner) qrSpinner.style.display = 'none';
      if (qrImage) qrImage.style.display = 'none';
      if (qrHelp) qrHelp.innerText = 'WhatsApp desconectado. Escolha um método de conexão.';
    }
  }

  if (wa.stats) {
    if (statReceived) statReceived.innerText = wa.stats.messagesReceived || 0;
    if (statSent) statSent.innerText = wa.stats.messagesSent || 0;
  }
}

function updateAIStatusUI(ai) {
  state.aiService = ai;
  if (ai.online) {
    aiDot.className = 'dot online';
    aiStatusText.innerText = 'Online';
  } else {
    aiDot.className = 'dot offline';
    aiStatusText.innerText = 'Offline';
  }
}

// ==========================================
// 4. MENSAGENS & CONVERSAS
// ==========================================
async function fetchConversations() {
  try {
    const res = await fetch('/api/conversations');
    const data = await res.json();
    state.conversations = data.conversations || [];
    renderConversations(state.conversations);
  } catch (err) {
    console.error('Erro ao buscar conversas:', err);
  }
}

function renderConversations(conversations = []) {
  if (!conversationsContainer) return;

  if (conversations.length === 0) {
    conversationsContainer.innerHTML = '<div class="empty-state">Nenhuma conversa registrada ainda.</div>';
    return;
  }

  conversationsContainer.innerHTML = '';
  conversations.forEach(conv => {
    const isEscalated = conv.last_message && conv.last_message.includes('O Mananga de momento');
    const card = document.createElement('div');
    card.className = `conversation-card ${isEscalated ? 'is-escalated' : ''}`;

    const dateStr = conv.last_active ? new Date(conv.last_active * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
    const initial = (conv.user_name || 'C').charAt(0).toUpperCase();

    card.innerHTML = `
      <div class="conversation-header">
        <div class="conversation-user">
          <div class="user-avatar">${initial}</div>
          <div class="user-meta">
            <h4>${escapeHtml(conv.user_name || 'Contato')}</h4>
            <span>${escapeHtml(conv.user_id)} • ${conv.messages_count || 0} msgs • ${dateStr}</span>
          </div>
        </div>
        <div>
          ${isEscalated ? '<span class="escalation-badge">🚨 Aguardando Resposta do Mananga</span>' : '<span class="badge success">Em Atendimento</span>'}
        </div>
      </div>
      <div class="conversation-body">
        <strong>${conv.last_role === 'assistant' ? 'Edith' : 'Contato'}:</strong> ${escapeHtml(conv.last_message || 'Nenhuma mensagem recente')}
      </div>
      <div class="quick-reply-input">
        <input type="text" class="form-control manual-reply-text" placeholder="Escrever resposta manual do Mananga..." />
        <button class="btn btn-primary btn-sm btn-send-manual" data-jid="${conv.user_id}">Enviar</button>
      </div>
    `;

    const sendBtn = card.querySelector('.btn-send-manual');
    const replyInput = card.querySelector('.manual-reply-text');

    sendBtn.addEventListener('click', async () => {
      const text = replyInput.value.trim();
      if (!text) {
        showToast('Digite uma mensagem para enviar.', true);
        return;
      }
      sendBtn.disabled = true;
      try {
        const res = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: conv.user_id, text })
        });
        const respData = await res.json();
        if (respData.success) {
          showToast('✅ Mensagem enviada pelo WhatsApp!');
          replyInput.value = '';
          fetchConversations();
        } else {
          showToast('❌ Falha ao enviar mensagem: ' + respData.error, true);
        }
      } catch (err) {
        showToast('Erro de conexão ao enviar: ' + err.message, true);
      }
      sendBtn.disabled = false;
    });

    conversationsContainer.appendChild(card);
  });
}

// ==========================================
// 5. PRODUTIVIDADE: LEMBRETES
// ==========================================
async function fetchReminders() {
  try {
    const res = await fetch('/api/reminders');
    const data = await res.json();
    state.reminders = data.reminders || [];
    renderReminders(state.reminders);
  } catch (err) {
    console.error('Erro ao buscar lembretes:', err);
  }
}

function renderReminders(reminders = []) {
  if (!remindersContainer) return;
  const active = reminders.filter(r => !r.completed);
  if (remindersCountBadge) remindersCountBadge.innerText = `${active.length} Ativos`;

  if (reminders.length === 0) {
    remindersContainer.innerHTML = '<div class="empty-state">Nenhum lembrete cadastrado.</div>';
    return;
  }

  remindersContainer.innerHTML = '';
  reminders.forEach(rem => {
    const item = document.createElement('div');
    item.className = `reminder-item ${rem.completed ? 'completed' : ''}`;
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(rem.title)}</strong>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">
          📅 ${escapeHtml(rem.date)} às ⏰ ${escapeHtml(rem.time)}
        </div>
      </div>
      <div class="reminder-actions">
        <button class="btn btn-secondary btn-sm btn-toggle-rem" data-id="${rem.id}">
          ${rem.completed ? '↩️ Reabrir' : '✅ Concluir'}
        </button>
        <button class="btn btn-danger btn-sm btn-del-rem" data-id="${rem.id}">🗑️</button>
      </div>
    `;

    item.querySelector('.btn-toggle-rem').addEventListener('click', async () => {
      await fetch(`/api/reminders/${rem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !rem.completed })
      });
      fetchReminders();
    });

    item.querySelector('.btn-del-rem').addEventListener('click', async () => {
      await fetch(`/api/reminders/${rem.id}`, { method: 'DELETE' });
      showToast('Lembrete excluído.');
      fetchReminders();
    });

    remindersContainer.appendChild(item);
  });
}

const formReminder = document.getElementById('form-reminder');
if (formReminder) {
  formReminder.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('reminder-title').value.trim();
    const date = document.getElementById('reminder-date').value;
    const time = document.getElementById('reminder-time').value;

    if (!title) return;

    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date, time })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Lembrete criado com sucesso!');
        formReminder.reset();
        fetchReminders();
      }
    } catch (err) {
      showToast('Erro ao salvar lembrete.', true);
    }
  });
}

// ==========================================
// 6. PRODUTIVIDADE: RECADOS
// ==========================================
async function fetchNotes() {
  try {
    const res = await fetch('/api/notes');
    const data = await res.json();
    state.notes = data.notes || [];
    renderNotes(state.notes);
  } catch (err) {
    console.error('Erro ao buscar recados:', err);
  }
}

function renderNotes(notes = []) {
  if (!notesContainer) return;
  if (notes.length === 0) {
    notesContainer.innerHTML = '<div class="empty-state">Nenhum recado no mural.</div>';
    return;
  }

  notesContainer.innerHTML = '';
  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card';
    const dateStr = note.createdAt ? new Date(note.createdAt).toLocaleDateString() : '';

    card.innerHTML = `
      <div class="note-content">${escapeHtml(note.content)}</div>
      <div class="note-footer">
        <span>${dateStr}</span>
        <button class="btn btn-danger btn-sm btn-del-note" style="padding: 2px 6px;">Excluir</button>
      </div>
    `;

    card.querySelector('.btn-del-note').addEventListener('click', async () => {
      await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
      showToast('Recado removido.');
      fetchNotes();
    });

    notesContainer.appendChild(card);
  });
}

const formNote = document.getElementById('form-note');
if (formNote) {
  formNote.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = document.getElementById('note-content').value.trim();
    if (!content) return;

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Recado fixado no mural!');
        formNote.reset();
        fetchNotes();
      }
    } catch (err) {
      showToast('Erro ao salvar recado.', true);
    }
  });
}

// ==========================================
// 7. PRODUTIVIDADE: TAREFAS
// ==========================================
async function fetchTasks() {
  try {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    state.tasks = data.tasks || [];
    if (statTasksCount) {
      const pending = state.tasks.filter(t => t.status !== 'concluida').length;
      statTasksCount.innerText = pending;
    }
    renderTasks(state.tasks);
  } catch (err) {
    console.error('Erro ao buscar tarefas:', err);
  }
}

function renderTasks(tasks = []) {
  if (!tasksContainer) return;
  const filtered = tasks.filter(t => {
    if (state.taskFilter === 'all') return true;
    if (state.taskFilter === 'pendente') return t.status !== 'concluida';
    if (state.taskFilter === 'concluida') return t.status === 'concluida';
    return true;
  });

  if (filtered.length === 0) {
    tasksContainer.innerHTML = '<div class="empty-state">Nenhuma tarefa para este filtro.</div>';
    return;
  }

  tasksContainer.innerHTML = '';
  filtered.forEach(task => {
    const isDone = task.status === 'concluida';
    const item = document.createElement('div');
    item.className = `task-item ${isDone ? 'completed' : ''}`;

    const priorityLabels = { alta: 'Prioridade Alta', media: 'Prioridade Média', baixa: 'Prioridade Baixa' };

    item.innerHTML = `
      <div>
        <strong>${escapeHtml(task.title)}</strong>
        <div style="margin-top: 4px; display: flex; gap: 8px; align-items: center;">
          <span class="priority-${task.priority || 'media'}">${priorityLabels[task.priority] || 'Média'}</span>
          ${task.dueDate ? `<span style="font-size: 12px; color: var(--text-muted);">Prazo: ${escapeHtml(task.dueDate)}</span>` : ''}
        </div>
      </div>
      <div class="reminder-actions">
        <button class="btn btn-secondary btn-sm btn-toggle-task">
          ${isDone ? '↩️ Reabrir' : '✅ Concluir'}
        </button>
        <button class="btn btn-danger btn-sm btn-del-task">🗑️</button>
      </div>
    `;

    item.querySelector('.btn-toggle-task').addEventListener('click', async () => {
      const newStatus = isDone ? 'pendente' : 'concluida';
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchTasks();
    });

    item.querySelector('.btn-del-task').addEventListener('click', async () => {
      await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      showToast('Tarefa removida.');
      fetchTasks();
    });

    tasksContainer.appendChild(item);
  });
}

const formTask = document.getElementById('form-task');
if (formTask) {
  formTask.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    const priority = document.getElementById('task-priority').value;
    const dueDate = document.getElementById('task-due').value;

    if (!title) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority, dueDate })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Tarefa adicionada!');
        formTask.reset();
        fetchTasks();
      }
    } catch (err) {
      showToast('Erro ao salvar tarefa.', true);
    }
  });
}

document.querySelectorAll('.filter-group button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-group button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.taskFilter = btn.getAttribute('data-filter');
    renderTasks(state.tasks);
  });
});

// ==========================================
// 8. ASSISTENTE (CHAT DIRETO COM EDITH DESKTOP)
// ==========================================
if (formChat) {
  formChat.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;

    // 1. Renderiza mensagem do usuário
    appendChatMessage('user', msg);
    chatInput.value = '';

    const btnSend = document.getElementById('btn-send-chat');
    btnSend.disabled = true;

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      if (data.reply) {
        appendChatMessage('assistant', data.reply);
      } else {
        appendChatMessage('assistant', 'Opa, não consegui processar sua mensagem agora.');
      }
    } catch (err) {
      appendChatMessage('assistant', 'Erro de conexão com o motor da Edith.');
    }
    btnSend.disabled = false;
  });
}

function appendChatMessage(role, text) {
  if (!chatMessages) return;
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.innerHTML = `<strong>${role === 'assistant' ? 'Edith' : 'Você'}:</strong> ${escapeHtml(text)}`;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (btnClearChat) {
  btnClearChat.addEventListener('click', () => {
    if (chatMessages) {
      chatMessages.innerHTML = `
        <div class="chat-bubble assistant">
          <strong>Edith:</strong> Conversa limpa. Em que posso te ajudar agora, Mananga? ✨
        </div>
      `;
    }
  });
}

// ==========================================
// 9. BOT DE GRUPOS & COMANDOS
// ==========================================
async function fetchCommands() {
  if (!commandsContainer) return;
  try {
    const res = await fetch('/api/commands');
    const data = await res.json();
    state.commands = data.commands || [];
    renderCommands(state.commands);
  } catch (err) {
    console.error('Erro ao buscar comandos:', err);
  }
}

function renderCommands(commands = []) {
  if (!commandsContainer) return;
  if (commands.length === 0) {
    commandsContainer.innerHTML = '<div class="empty-state">Nenhum comando registrado.</div>';
    return;
  }

  commandsContainer.innerHTML = '';
  commands.forEach(cmd => {
    const item = document.createElement('div');
    item.className = 'integration-card active mb-10';
    
    let permClass = 'badge';
    if (cmd.permission === 'OWNER') permClass = 'badge danger';
    else if (cmd.permission === 'ADMIN') permClass = 'badge warning';
    else permClass = 'badge success';

    item.innerHTML = `
      <div class="d-flex-between align-center">
        <div>
          <strong style="font-size: 1.05rem; color: var(--primary);">!${escapeHtml(cmd.name)}</strong>
          ${cmd.aliases.length > 0 ? `<small style="color: var(--text-muted); margin-left: 8px;">(Aliases: ${cmd.aliases.map(a => '!' + a).join(', ')})</small>` : ''}
          <p style="margin: 4px 0 0 0; color: var(--text-secondary); font-size: 0.88rem;">${escapeHtml(cmd.description)}</p>
        </div>
        <span class="${permClass}">${escapeHtml(cmd.permission)}</span>
      </div>
    `;
    commandsContainer.appendChild(item);
  });
}

const groupSelect = document.getElementById('group-select');
const groupJidInput = document.getElementById('group-jid-input');
const groupPrefixInput = document.getElementById('group-prefix-input');
const groupToggleEnabled = document.getElementById('group-toggle-enabled');
const groupTogglePublic = document.getElementById('group-toggle-public');
const groupConfigForm = document.getElementById('group-config-form');
const groupSaveStatus = document.getElementById('group-save-status');

async function fetchGroups() {
  try {
    const res = await fetch('/api/groups');
    const data = await res.json();
    state.groups = data.groups || {};
    const groupCount = Object.keys(state.groups).length;
    if (statGroupsCount) statGroupsCount.innerText = groupCount;

    if (groupSelect) {
      groupSelect.innerHTML = '<option value="">-- Grupos Conhecidos --</option>';
      Object.keys(state.groups).forEach(jid => {
        const opt = document.createElement('option');
        opt.value = jid;
        opt.innerText = `${jid} (Prefixo: ${state.groups[jid].prefix || '!'})`;
        groupSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Erro ao buscar grupos:', err);
  }
}

if (groupSelect) {
  groupSelect.addEventListener('change', (e) => {
    const jid = e.target.value;
    if (jid && state.groups[jid]) {
      groupJidInput.value = jid;
      groupPrefixInput.value = state.groups[jid].prefix || '!';
      groupToggleEnabled.checked = state.groups[jid].enabled !== false;
      groupTogglePublic.checked = state.groups[jid].allowPublicCommands !== false;
    }
  });
}

if (groupConfigForm) {
  groupConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const jid = groupJidInput.value.trim();
    if (!jid) {
      showToast('Informe o JID do grupo.', true);
      return;
    }

    groupSaveStatus.innerText = 'Salvando...';
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(jid)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix: groupPrefixInput.value.trim() || '!',
          enabled: groupToggleEnabled.checked,
          allowPublicCommands: groupTogglePublic.checked
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Configuração do grupo salva!');
        groupSaveStatus.innerText = '✅ Salvo!';
        fetchGroups();
      }
    } catch (err) {
      showToast('Erro ao salvar grupo.', true);
    }
    setTimeout(() => { groupSaveStatus.innerText = ''; }, 3000);
  });
}

// ==========================================
// 10. ATIVIDADE & TERMINAL DE LOGS
// ==========================================
async function fetchLogs() {
  try {
    const res = await fetch('/api/logs?limit=60');
    const data = await res.json();
    state.logs = data.logs || [];
    renderLogs(state.logs);
  } catch (err) {
    console.error('Erro ao buscar logs:', err);
  }
}

function renderLogs(logs = []) {
  if (!logsContainer) return;
  logsContainer.innerHTML = '';
  logs.forEach(log => appendLog(log, false));
}

function appendLog(log, prepend = true) {
  if (!logsContainer) return;
  const line = document.createElement('div');
  line.className = `log-line ${log.level || 'info'}`;
  const time = new Date(log.timestamp).toLocaleTimeString();
  line.innerHTML = `
    <span class="timestamp">[${time}]</span>
    <span class="level">[${(log.level || 'INFO').toUpperCase()}]</span>
    <span class="msg">${escapeHtml(log.message)}</span>
  `;

  if (prepend) {
    logsContainer.prepend(line);
  } else {
    logsContainer.appendChild(line);
  }

  // Atualiza mini feed de atividades na página Inicial
  if (overviewActivityList && prepend) {
    const actItem = document.createElement('div');
    actItem.className = 'activity-item';
    actItem.style.padding = '8px 0';
    actItem.style.borderBottom = '1px solid var(--border-color)';
    actItem.style.fontSize = '13px';
    actItem.innerHTML = `<span style="color: var(--primary); font-weight:600;">${time}</span> — ${escapeHtml(log.message)}`;
    overviewActivityList.prepend(actItem);
    if (overviewActivityList.children.length > 5) {
      overviewActivityList.removeChild(overviewActivityList.lastChild);
    }
  }
}

const btnClearLogs = document.getElementById('btn-clear-logs');
if (btnClearLogs) {
  btnClearLogs.addEventListener('click', () => {
    if (logsContainer) logsContainer.innerHTML = '';
    showToast('Terminal limpo.');
  });
}

// ==========================================
// 11. DEFINIÇÕES & IA
// ==========================================
async function fetchConfig() {
  try {
    const res = await fetch('/api/config');
    const cfg = await res.json();
    updateConfigUI(cfg);
  } catch (err) {
    console.error('Erro ao buscar configurações:', err);
  }
}

function updateConfigUI(cfg) {
  if (!cfg) return;
  state.config = cfg;

  if (cfg.ai) {
    toggleAiEngine.checked = cfg.ai.enabled !== false;
    if (cfg.ai.model) aiModelSelect.value = cfg.ai.model;
    if (cfg.ai.systemPrompt) systemPromptText.value = cfg.ai.systemPrompt;
    if (cfg.ai.groupSystemPrompt && systemPromptGroupText) systemPromptGroupText.value = cfg.ai.groupSystemPrompt;
  }

  if (cfg.whatsapp) {
    toggleAutoReply.checked = cfg.whatsapp.autoReply !== false;
    togglePrivate.checked = cfg.whatsapp.respondPrivate !== false;
    toggleGroups.checked = Boolean(cfg.whatsapp.respondGroups);
  }

  if (cfg.followUp && toggleFollowup) {
    toggleFollowup.checked = cfg.followUp.enabled !== false;
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
      showToast('✅ Configurações salvas e sincronizadas!');
      updateConfigUI(data.config);
      return true;
    }
  } catch (err) {
    showToast('Erro ao salvar configurações.', true);
  }
  return false;
}

// Toggles listeners
toggleAutoReply.addEventListener('change', (e) => saveGeneralConfig({ whatsapp: { autoReply: e.target.checked } }));
toggleAiEngine.addEventListener('change', (e) => saveGeneralConfig({ ai: { enabled: e.target.checked } }));
togglePrivate.addEventListener('change', (e) => saveGeneralConfig({ whatsapp: { respondPrivate: e.target.checked } }));
toggleGroups.addEventListener('change', (e) => saveGeneralConfig({ whatsapp: { respondGroups: e.target.checked } }));
if (toggleFollowup) {
  toggleFollowup.addEventListener('change', (e) => saveGeneralConfig({ followUp: { enabled: e.target.checked } }));
}

aiConfigForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  btnSaveAi.disabled = true;
  saveStatusIndicator.innerText = 'Salvando...';

  const aiPayload = {
    model: aiModelSelect.value,
    systemPrompt: systemPromptText.value,
    groupSystemPrompt: systemPromptGroupText ? systemPromptGroupText.value : ''
  };
  if (apiKeyInput.value.trim()) aiPayload.apiKey = apiKeyInput.value.trim();

  const ok = await saveGeneralConfig({ ai: aiPayload });
  btnSaveAi.disabled = false;
  saveStatusIndicator.innerText = ok ? '✅ Salvo!' : '❌ Falha';
  setTimeout(() => { saveStatusIndicator.innerText = ''; }, 3000);
});

if (btnToggleKey) {
  btnToggleKey.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      btnToggleKey.innerText = '🔒 Ocultar';
    } else {
      apiKeyInput.type = 'password';
      btnToggleKey.innerText = '👁️ Ver';
    }
  });
}

// Alternância entre abas de Conexão WhatsApp (Número vs QR)
if (tabBtnPairing && tabBtnQr) {
  tabBtnPairing.addEventListener('click', () => {
    tabBtnPairing.classList.add('active');
    tabBtnQr.classList.remove('active');
    if (pairingView) pairingView.style.display = 'block';
    if (qrView) qrView.style.display = 'none';
  });

  tabBtnQr.addEventListener('click', () => {
    tabBtnQr.classList.add('active');
    tabBtnPairing.classList.remove('active');
    if (pairingView) pairingView.style.display = 'none';
    if (qrView) qrView.style.display = 'block';
  });
}

// Formulário de Solicitação de Código de Emparelhamento
if (formPairing) {
  formPairing.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = (pairingPhoneInput.value || '').trim();
    if (!phone) {
      showToast('Por favor, informe o seu número de WhatsApp.', true);
      return;
    }

    if (btnRequestPairing) btnRequestPairing.disabled = true;
    if (btnPairingText) btnPairingText.style.display = 'none';
    if (pairingSpinner) pairingSpinner.style.display = 'inline-block';

    try {
      showToast('Solicitando código ao servidor Baileys...');
      const res = await fetch('/api/whatsapp/pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone })
      });
      const data = await res.json();

      if (data.success && data.code) {
        showToast('Código gerado com sucesso!');
        if (otpDisplay) otpDisplay.innerText = data.formatted || data.code;
        if (pairingCodeResult) pairingCodeResult.style.display = 'block';
        fetchStatus();
      } else {
        showToast(data.error || 'Falha ao gerar código de emparelhamento.', true);
      }
    } catch (err) {
      showToast('Erro de comunicação com o Gateway: ' + err.message, true);
    } finally {
      if (btnRequestPairing) btnRequestPairing.disabled = false;
      if (btnPairingText) btnPairingText.style.display = 'inline-block';
      if (pairingSpinner) pairingSpinner.style.display = 'none';
    }
  });
}

// Copiar Código de Emparelhamento
if (btnCopyPairingCode) {
  btnCopyPairingCode.addEventListener('click', async () => {
    const rawText = (otpDisplay.innerText || '').replace(/[^a-zA-Z0-9]/g, '');
    if (!rawText || rawText.includes('-')) {
      showToast('Nenhum código para copiar.', true);
      return;
    }

    try {
      await navigator.clipboard.writeText(rawText);
      if (copyCodeText) copyCodeText.innerText = 'Copiado!';
      showToast('Código copiado para a área de transferência!');
      setTimeout(() => {
        if (copyCodeText) copyCodeText.innerText = 'Copiar Código';
      }, 2500);
    } catch (err) {
      showToast('Erro ao copiar código.', true);
    }
  });
}

// Ações do WhatsApp
btnRestartWa.addEventListener('click', async () => {
  showToast('Reiniciando conexão do WhatsApp...');
  try {
    await fetch('/api/whatsapp/restart', { method: 'POST' });
    setTimeout(fetchStatus, 1500);
  } catch (err) {
    showToast('Erro ao reiniciar WhatsApp.', true);
  }
});

// ==========================================
// 12. ECONOMIA & RANKING SEMANAL
// ==========================================
const statEconomyTotalXp = document.getElementById('stat-economy-total-xp');
const statEconomyUsersCount = document.getElementById('stat-economy-users-count');
const statEconomyLeader = document.getElementById('stat-economy-leader');
const statEconomySeason = document.getElementById('stat-economy-season');
const economyRankingBody = document.getElementById('economy-ranking-body');
const adjustUserSelect = document.getElementById('adjust-user-select');
const formAdjustXp = document.getElementById('form-adjust-xp');
const adjustAmountInput = document.getElementById('adjust-amount-input');
const adjustActionSelect = document.getElementById('adjust-action-select');
const txListContainer = document.getElementById('tx-list-container');

async function fetchEconomy() {
  try {
    const [overviewRes, usersRes, txRes] = await Promise.all([
      fetch('/api/economy/overview').then(r => r.json()),
      fetch('/api/economy/users').then(r => r.json()),
      fetch('/api/economy/transactions').then(r => r.json())
    ]);

    renderEconomyOverview(overviewRes);
    renderEconomyRanking(overviewRes.leaderboard || []);
    renderEconomyUsersDropdown(usersRes.users || []);
    renderTransactions(txRes.transactions || []);
  } catch (err) {
    console.error('Erro ao buscar dados da economia:', err);
  }
}

function renderEconomyOverview(data) {
  if (!data) return;
  if (statEconomyTotalXp) statEconomyTotalXp.innerText = `${(data.totalXp || 0).toLocaleString('pt-BR')} XP`;
  if (statEconomyUsersCount) statEconomyUsersCount.innerText = data.totalUsers || 0;
  if (statEconomyLeader) {
    if (data.topLeader) {
      statEconomyLeader.innerText = `${data.topLeader.name || data.topLeader.jid} (${(data.topLeader.weeklyXpAmount || 0).toLocaleString('pt-BR')} XP)`;
    } else {
      statEconomyLeader.innerText = 'Sem líder';
    }
  }
  if (statEconomySeason) {
    statEconomySeason.innerText = data.isSunday ? '🏖️ Domingo (Folga)' : '🏆 Ativa (Seg - Sáb)';
    statEconomySeason.style.color = data.isSunday ? 'var(--warning)' : 'var(--success)';
  }
}

function renderEconomyRanking(leaderboard = []) {
  if (!economyRankingBody) return;
  if (leaderboard.length === 0) {
    economyRankingBody.innerHTML = '<tr><td colspan="5" class="empty-state" style="text-align: center; padding: 20px;">Nenhum membro cadastrado ainda.</td></tr>';
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  economyRankingBody.innerHTML = '';

  leaderboard.forEach((u, i) => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--border)';

    const medal = medals[i] || `<span style="color: var(--text-muted); font-weight: 600;">#${i + 1}</span>`;
    const weeklyXp = (u.weeklyXpAmount || 0).toLocaleString('pt-BR');
    const totalXp = (u.xp || 0).toLocaleString('pt-BR');
    const cleanJid = (u.jid || '').split('@')[0];

    tr.innerHTML = `
      <td style="padding: 12px 16px; font-weight: bold; font-size: 1.1rem;">${medal}</td>
      <td style="padding: 12px 16px;">
        <strong style="color: var(--text-primary);">${escapeHtml(u.name || 'Membro')}</strong>
        <div style="font-size: 0.78rem; color: var(--text-muted); font-family: monospace;">+${escapeHtml(cleanJid)}</div>
      </td>
      <td style="padding: 12px 16px;">
        <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--primary); font-weight: 700;">${weeklyXp} XP</span>
      </td>
      <td style="padding: 12px 16px; font-weight: 600; color: var(--text-secondary);">
        ${totalXp} XP
      </td>
      <td style="padding: 12px 16px; text-align: right;">
        <button class="btn btn-secondary btn-sm btn-quick-adjust" data-jid="${escapeHtml(u.jid)}" style="padding: 4px 8px; font-size: 0.78rem;">
          ⚙️ Ajustar
        </button>
      </td>
    `;

    tr.querySelector('.btn-quick-adjust').addEventListener('click', () => {
      if (adjustUserSelect) {
        adjustUserSelect.value = u.jid;
        adjustAmountInput.focus();
      }
    });

    economyRankingBody.appendChild(tr);
  });
}

function renderEconomyUsersDropdown(users = []) {
  if (!adjustUserSelect) return;
  const currentVal = adjustUserSelect.value;
  adjustUserSelect.innerHTML = '<option value="">-- Selecione o membro --</option>';

  users.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.jid;
    opt.innerText = `${u.name} (+${u.jid.split('@')[0]}) • Saldo: ${(u.xp || 0).toLocaleString('pt-BR')} XP`;
    adjustUserSelect.appendChild(opt);
  });

  if (currentVal) adjustUserSelect.value = currentVal;
}

function renderTransactions(txs = []) {
  if (!txListContainer) return;
  if (txs.length === 0) {
    txListContainer.innerHTML = '<div class="empty-state">Nenhuma transação recente.</div>';
    return;
  }

  const typeMap = {
    DAILY: { label: '🎁 Diária', color: '#10b981' },
    WORK: { label: '💼 Trabalho', color: '#3b82f6' },
    BET_WIN: { label: '🎰 Cassino +', color: '#8b5cf6' },
    BET_LOSS: { label: '🎰 Cassino -', color: '#ef4444' },
    TRANSFER_SENT: { label: '📤 Enviado', color: '#f59e0b' },
    TRANSFER_RECEIVED: { label: '📥 Recebido', color: '#10b981' },
    ADMIN_ADD: { label: '🛡️ Admin +', color: '#06b6d4' },
    ADMIN_REMOVE: { label: '🛡️ Admin -', color: '#ef4444' },
    MUSIC_PLAY: { label: '🎵 Música', color: '#ec4899' }
  };

  txListContainer.innerHTML = '';
  txs.forEach(tx => {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    item.style.padding = '8px 0';
    item.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
    item.style.fontSize = '0.85rem';

    const info = typeMap[tx.type] || { label: tx.type, color: 'var(--text-muted)' };
    const signal = tx.amount > 0 ? '+' : '';
    const date = new Date(tx.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    item.innerHTML = `
      <div>
        <span style="color: ${info.color}; font-weight: 600;">${info.label}</span>
        <span style="color: var(--text-secondary); margin-left: 6px;">${escapeHtml(tx.description || '')}</span>
      </div>
      <div style="text-align: right;">
        <strong style="color: ${tx.amount >= 0 ? '#10b981' : '#ef4444'};">${signal}${tx.amount.toLocaleString('pt-BR')} XP</strong>
        <div style="font-size: 0.72rem; color: var(--text-muted);">${date}</div>
      </div>
    `;

    txListContainer.appendChild(item);
  });
}

if (formAdjustXp) {
  formAdjustXp.addEventListener('submit', async (e) => {
    e.preventDefault();
    const jid = adjustUserSelect.value;
    const amount = parseInt(adjustAmountInput.value, 10);
    const action = adjustActionSelect.value;

    if (!jid || isNaN(amount) || amount <= 0) {
      showToast('Selecione o membro e informe uma quantidade positiva de XP.', true);
      return;
    }

    try {
      const res = await fetch('/api/economy/xp/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid, amount, action })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ XP ${action === 'add' ? 'adicionado' : 'removido'} com sucesso!`);
        formAdjustXp.reset();
        fetchEconomy();
      } else {
        showToast(data.error || 'Erro ao ajustar XP.', true);
      }
    } catch (err) {
      showToast('Falha na comunicação com o servidor.', true);
    }
  });
}

btnDisconnectWa.addEventListener('click', async () => {
  if (confirm('Tem certeza que deseja desconectar o WhatsApp?')) {
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      showToast('WhatsApp desconectado.');
      if (otpDisplay) otpDisplay.innerText = '--------';
      if (pairingCodeResult) pairingCodeResult.style.display = 'none';
      setTimeout(fetchStatus, 1500);
    } catch (err) {
      showToast('Erro ao desconectar.', true);
    }
  }
});

btnRefresh.addEventListener('click', () => {
  fetchStatus();
  fetchConfig();
  fetchConversations();
  fetchReminders();
  fetchNotes();
  fetchTasks();
  fetchEconomy();
  fetchCommands();
  fetchGroups();
  showToast('Dados atualizados!');
});

// ==========================================
// 13. WEBSOCKET EM TEMPO REAL
// ==========================================
async function fetchStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    updateServerStatusUI(true);
    if (data.whatsapp) updateWhatsAppUI(data.whatsapp);
    if (data.aiService) updateAIStatusUI(data.aiService);
  } catch (err) {
    updateServerStatusUI(false);
  }
}

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  let ws;
  try {
    ws = new WebSocket(wsUrl);
  } catch (e) {
    updateServerStatusUI(false);
    setTimeout(connectWebSocket, 3000);
    return;
  }

  ws.onopen = () => {
    updateServerStatusUI(true);
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
      } else if (data.type === 'ECONOMY_UPDATE') {
        fetchEconomy();
      } else if (data.type === 'LOG') {
        appendLog(data.payload);
      }
    } catch (err) {
      console.error('Erro no WS:', err);
    }
  };

  ws.onclose = () => {
    updateServerStatusUI(false);
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = () => {
    updateServerStatusUI(false);
  };
}

// Inicialização Geral
window.addEventListener('DOMContentLoaded', () => {
  fetchStatus();
  fetchConfig();
  fetchConversations();
  fetchReminders();
  fetchNotes();
  fetchTasks();
  fetchEconomy();
  fetchCommands();
  fetchGroups();
  connectWebSocket();

  setInterval(fetchStatus, 10000);
});
