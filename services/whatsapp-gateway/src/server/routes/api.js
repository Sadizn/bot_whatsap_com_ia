import { Router } from 'express';
import { waClient } from '../../whatsapp/client.js';
import { aiClient } from '../../clients/aiClient.js';
import { configStore } from '../../utils/configStore.js';
import { commandRegistry } from '../../commands/index.js';
import { followUpManager } from '../../modules/followUpManager.js';
import { productivityStore } from '../../modules/productivityStore.js';
import { userStore } from '../../modules/userStore.js';
import { economyService } from '../../modules/economyService.js';
import { logger } from '../../utils/logger.js';
import { wsManager } from '../websocket.js';

const router = Router();

// ==========================================
// 1. STATUS GERAL & HEALTH CHECK
// ==========================================
router.get('/status', async (req, res) => {
  const waStatus = waClient.getStatus();
  const aiHealth = await aiClient.checkHealth();

  res.json({
    whatsapp: waStatus,
    aiService: aiHealth,
    followUpActiveCount: followUpManager.getActiveCount(),
    serverTime: new Date().toISOString()
  });
});

// ==========================================
// 2. CONFIGURAÇÕES & TOGGLES
// ==========================================
router.get('/config', (req, res) => {
  res.json(configStore.get());
});

router.post('/config', (req, res) => {
  try {
    const success = configStore.update(req.body);
    if (success) {
      wsManager.broadcast('CONFIG_UPDATE', configStore.get());
      logger.info('Configurações atualizadas via Desktop / Dashboard.');
      res.json({ success: true, config: configStore.get() });
    } else {
      res.status(500).json({ success: false, error: 'Falha ao salvar configurações no disco.' });
    }
  } catch (err) {
    logger.error('Erro na rota POST /api/config: ' + err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. COMANDOS & GRUPOS
// ==========================================
router.get('/commands', (req, res) => {
  const commands = commandRegistry.getAll().map(c => ({
    name: c.name,
    aliases: c.aliases || [],
    category: c.category || 'utils',
    description: c.description || '',
    permission: c.permission || 'PUBLIC',
    groupOnly: Boolean(c.groupOnly),
    privateOnly: Boolean(c.privateOnly)
  }));
  res.json({ commands });
});

router.get('/groups', (req, res) => {
  res.json({ groups: configStore.listGroups() });
});

router.post('/groups/:id', (req, res) => {
  const { id } = req.params;
  const success = configStore.updateGroupConfig(id, req.body);
  if (success) {
    wsManager.broadcast('CONFIG_UPDATE', configStore.get());
    res.json({ success: true, group: configStore.getGroupConfig(id) });
  } else {
    res.status(500).json({ success: false, error: 'Erro ao salvar configuração do grupo.' });
  }
});

// ==========================================
// 4. MENSAGENS, HISTÓRICO & ENVIO MANUAL
// ==========================================
router.get('/conversations', async (req, res) => {
  const conversations = await aiClient.getConversations();
  res.json({ conversations });
});

router.post('/messages/send', async (req, res) => {
  const { to, text } = req.body;
  if (!to || !text) {
    return res.status(400).json({ success: false, error: 'Campos "to" e "text" são obrigatórios.' });
  }

  try {
    // 1. Cancela timer de follow-up já que o usuário assumiu e respondeu
    followUpManager.cancel(to);

    // 2. Envia mensagem via Baileys WhatsApp existente
    const result = await waClient.sendTextMessage(to, text);
    logger.success(`Mensagem manual enviada pelo Desktop para ${to}: "${text}"`);
    res.json({ success: true, result });
  } catch (err) {
    logger.error(`Erro ao enviar mensagem pelo Desktop para ${to}: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/followup/status', (req, res) => {
  res.json({
    activeCount: followUpManager.getActiveCount(),
    activeJids: Array.from(followUpManager.activeTimers.keys())
  });
});

// ==========================================
// 5. ASSISTENTE DIRETA NO DESKTOP (Chat com Edith)
// ==========================================
router.post('/assistant/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Mensagem vazia.' });
  }

  try {
    // Comunica com o motor de IA em Python existente
    const aiResponse = await aiClient.processMessage({
      userId: 'desktop_owner',
      message: message.trim(),
      userName: 'Mananga (Desktop)',
      isGroup: false
    });

    res.json({
      success: true,
      reply: aiResponse?.reply || 'Opa, não consegui processar sua mensagem agora.',
      source: aiResponse?.source || 'ai_gemini'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. PRODUTIVIDADE: LEMBRETES, RECADOS & TAREFAS
// ==========================================
// Lembretes
router.get('/reminders', (req, res) => {
  res.json({ reminders: productivityStore.getReminders() });
});

router.post('/reminders', (req, res) => {
  const reminder = productivityStore.addReminder(req.body);
  logger.info(`Novo lembrete criado via Desktop: "${reminder.title}"`);
  res.json({ success: true, reminder });
});

router.put('/reminders/:id', (req, res) => {
  const updated = productivityStore.updateReminder(req.params.id, req.body);
  if (updated) res.json({ success: true, reminder: updated });
  else res.status(404).json({ success: false, error: 'Lembrete não encontrado.' });
});

router.delete('/reminders/:id', (req, res) => {
  const deleted = productivityStore.deleteReminder(req.params.id);
  res.json({ success: deleted });
});

// Recados / Notas
router.get('/notes', (req, res) => {
  res.json({ notes: productivityStore.getNotes() });
});

router.post('/notes', (req, res) => {
  const note = productivityStore.addNote(req.body);
  res.json({ success: true, note });
});

router.put('/notes/:id', (req, res) => {
  const updated = productivityStore.updateNote(req.params.id, req.body);
  if (updated) res.json({ success: true, note: updated });
  else res.status(404).json({ success: false, error: 'Recado não encontrado.' });
});

router.delete('/notes/:id', (req, res) => {
  const deleted = productivityStore.deleteNote(req.params.id);
  res.json({ success: deleted });
});

// Tarefas
router.get('/tasks', (req, res) => {
  res.json({ tasks: productivityStore.getTasks() });
});

router.post('/tasks', (req, res) => {
  const task = productivityStore.addTask(req.body);
  res.json({ success: true, task });
});

router.put('/tasks/:id', (req, res) => {
  const updated = productivityStore.updateTask(req.params.id, req.body);
  if (updated) res.json({ success: true, task: updated });
  else res.status(404).json({ success: false, error: 'Tarefa não encontrada.' });
});

router.delete('/tasks/:id', (req, res) => {
  const deleted = productivityStore.deleteTask(req.params.id);
  res.json({ success: deleted });
});

// ==========================================
// 7. CONTROLES DO WHATSAPP & INTEGRAÇÕES
// ==========================================
router.post('/integrations/:id/toggle', (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;
  const success = configStore.toggleIntegration(id, enabled);
  if (success) {
    wsManager.broadcast('CONFIG_UPDATE', configStore.get());
    res.json({ success: true, config: configStore.get() });
  } else {
    res.status(404).json({ success: false, error: 'Integração não encontrada' });
  }
});

router.post('/whatsapp/pairing-code', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ success: false, error: 'O número de telefone é obrigatório.' });
  }
  try {
    const code = await waClient.requestPairingCode(phoneNumber);
    const formatted = code && code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
    res.json({ success: true, code, formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/whatsapp/restart', async (req, res) => {
  try {
    await waClient.start();
    res.json({ success: true, message: 'Reconexão iniciada.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/whatsapp/disconnect', async (req, res) => {
  try {
    await waClient.disconnect();
    res.json({ success: true, message: 'WhatsApp desconectado.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 8. ECONOMIA, XP & RANKING
// ==========================================
router.get('/economy/overview', (req, res) => {
  const users = userStore.getAll();
  const totalXp = users.reduce((sum, u) => sum + (u.xp || 0), 0);
  const leaderboard = economyService.getLeaderboard(10);
  const isSunday = economyService.isSunday();
  const currentWeekKey = economyService.getCurrentWeekKey();

  res.json({
    totalUsers: users.length,
    totalXp,
    topLeader: leaderboard.top[0] || null,
    isSunday,
    currentWeekKey,
    seasonTitle: leaderboard.seasonTitle,
    leaderboard: leaderboard.top
  });
});

router.get('/economy/users', (req, res) => {
  const users = userStore.getAll();
  const currentWeekKey = economyService.getCurrentWeekKey();
  const formattedUsers = users.map(u => ({
    jid: u.jid,
    name: u.name,
    gender: u.gender,
    age: u.age,
    xp: u.xp || 0,
    weeklyXp: (u.weeklyXp?.weekKey === currentWeekKey) ? (u.weeklyXp.amount || 0) : 0,
    partner: u.partner,
    registeredAt: u.registeredAt,
    betStats: u.betStats || { totalBets: 0, wins: 0, losses: 0 }
  }));
  res.json({ users: formattedUsers });
});

router.get('/economy/ranking', (req, res) => {
  const limit = parseInt(req.query.limit || '10', 10);
  const ranking = economyService.getLeaderboard(limit);
  res.json(ranking);
});

router.get('/economy/transactions', (req, res) => {
  const limit = parseInt(req.query.limit || '30', 10);
  const txs = economyService.getAllTransactions(limit);
  res.json({ transactions: txs });
});

router.post('/economy/xp/adjust', (req, res) => {
  const { jid, amount, action } = req.body;
  if (!jid || !amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Dados inválidos (jid e amount positivo obrigatórios).' });
  }

  const cleanJid = userStore.normalizeJid(jid);
  if (action === 'add') {
    const result = economyService.adminAddXp(cleanJid, amount, 'desktop_dashboard');
    if (result.success) {
      wsManager.broadcast('ECONOMY_UPDATE', { jid: cleanJid, user: result.user });
      return res.json({ success: true, result });
    }
    return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
  } else if (action === 'remove') {
    const result = economyService.adminRemoveXp(cleanJid, amount, 'desktop_dashboard');
    if (result.success) {
      wsManager.broadcast('ECONOMY_UPDATE', { jid: cleanJid, user: result.user });
      return res.json({ success: true, result });
    }
    return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
  } else {
    return res.status(400).json({ success: false, error: 'Ação deve ser "add" ou "remove".' });
  }
});

router.get('/logs', (req, res) => {
  const limit = parseInt(req.query.limit || '60', 10);
  res.json({ logs: logger.getRecentLogs(limit) });
});

export default router;
