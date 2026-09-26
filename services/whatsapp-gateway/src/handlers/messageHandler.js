import { configStore } from '../utils/configStore.js';
import { aiClient } from '../clients/aiClient.js';
import { logger } from '../utils/logger.js';

export async function handleIncomingMessage(msg, sock) {
  const remoteJid = msg.key.remoteJid;
  const isGroup = remoteJid.endsWith('@g.us');
  const pushName = msg.pushName || 'Usuário';

  // 1. Extrair o texto da mensagem
  const messageText = 
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    '';

  if (!messageText || typeof messageText !== 'string' || !messageText.trim()) {
    // Mensagem de mídia sem legenda ou mensagem de sistema
    return;
  }

  const cleanText = messageText.trim();
  logger.info(`Mensagem recebida de ${pushName} (${remoteJid}): "${cleanText}"`);

  // 2. Verificar configurações ativas do Dashboard
  const currentConfig = configStore.get();
  const waConfig = currentConfig.whatsapp || {};

  // Se autoReply estiver desativado globalmente
  if (waConfig.autoReply === false) {
    return;
  }

  // Filtrar grupos ou privado conforme toggles
  if (isGroup && !waConfig.respondGroups) {
    return;
  }
  if (!isGroup && waConfig.respondPrivate === false) {
    return;
  }

  // Se estiver configurado para responder apenas mensagens com prefixo
  if (waConfig.prefixOnly) {
    const prefix = waConfig.prefix || '!';
    if (!cleanText.startsWith(prefix)) {
      return;
    }
  }

  try {
    // 3. Indicador de "digitando..." no WhatsApp
    await sock.sendPresenceUpdate('composing', remoteJid);

    // 4. Processar com o microsserviço de IA / Automações em Python
    const aiResponse = await aiClient.processMessage({
      userId: remoteJid,
      message: cleanText,
      userName: pushName,
      isGroup
    });

    // 5. Finalizar indicador de presença
    await sock.sendPresenceUpdate('paused', remoteJid);

    // 6. Enviar resposta se houver
    if (aiResponse && aiResponse.reply) {
      await sock.sendMessage(remoteJid, { text: aiResponse.reply }, { quoted: msg });
      logger.success(`Resposta enviada para ${pushName} via [${aiResponse.source}].`);
    }

  } catch (error) {
    logger.error(`Erro ao processar e responder mensagem de ${remoteJid}:`, error.message);
  }
}
