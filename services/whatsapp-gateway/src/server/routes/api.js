import { Router } from 'express';
import { waClient } from '../../whatsapp/client.js';
import { aiClient } from '../../clients/aiClient.js';
import { configStore } from '../../utils/configStore.js';
import { logger } from '../../utils/logger.js';
import { wsManager } from '../websocket.js';

const router = Router();

// 1. Status Geral do Sistema
router.get('/status', async (req, res) => {
  const waStatus = waClient.getStatus();
  const aiHealth = await aiClient.checkHealth();

  res.json({
    whatsapp: waStatus,
    aiService: aiHealth,
    serverTime: new Date().toISOString()
  });
});

// 2. Obter Configurações e Toggles
router.get('/config', (req, res) => {
  res.json(configStore.get());
});

// 3. Atualizar Configurações Gerais
router.post('/config', (req, res) => {
  const success = configStore.update(req.body);
  if (success) {
    wsManager.broadcast('CONFIG_UPDATE', configStore.get());
    logger.info('Configurações atualizadas via Dashboard.');
    res.json({ success: true, config: configStore.get() });
  } else {
    res.status(500).json({ success: false, error: 'Falha ao salvar configurações' });
  }
});

// 4. Ligar / Desligar uma Integração específica
router.post('/integrations/:id/toggle', (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;

  const success = configStore.toggleIntegration(id, enabled);
  if (success) {
    wsManager.broadcast('CONFIG_UPDATE', configStore.get());
    logger.info(`Integração '${id}' agora está: ${enabled ? 'LIGADA' : 'DESLIGADA'}.`);
    res.json({ success: true, config: configStore.get() });
  } else {
    res.status(404).json({ success: false, error: 'Integração não encontrada' });
  }
});

// 5. Listar automações disponíveis no Python
router.get('/automations', async (req, res) => {
  const automations = await aiClient.listAutomations();
  res.json({ automations });
});

// 6. Controle do WhatsApp (Reiniciar / Reconectar)
router.post('/whatsapp/restart', async (req, res) => {
  logger.info('Comando de reinicialização do WhatsApp recebido via Dashboard.');
  try {
    await waClient.start();
    res.json({ success: true, message: 'Reconexão iniciada.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Desconectar / Deslogar WhatsApp
router.post('/whatsapp/disconnect', async (req, res) => {
  logger.info('Comando de desconexão do WhatsApp recebido via Dashboard.');
  try {
    await waClient.disconnect();
    res.json({ success: true, message: 'WhatsApp desconectado.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Obter Logs Recentes
router.get('/logs', (req, res) => {
  const limit = parseInt(req.query.limit || '50', 10);
  res.json({ logs: logger.getRecentLogs(limit) });
});

export default router;
