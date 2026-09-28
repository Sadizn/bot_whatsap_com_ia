import { logger } from '../utils/logger.js';
import { configStore } from '../utils/configStore.js';

class FollowUpManager {
  constructor() {
    this.activeTimers = new Map();
  }

  /**
   * Cancela qualquer timer de acompanhamento pendente para este contato
   * @param {string} remoteJid 
   */
  cancel(remoteJid) {
    if (!remoteJid) return;
    if (this.activeTimers.has(remoteJid)) {
      clearTimeout(this.activeTimers.get(remoteJid));
      this.activeTimers.delete(remoteJid);
      logger.info(`[FOLLOW-UP] Acompanhamento cancelado para ${remoteJid} (o contato interagiu).`);
    }
  }

  /**
   * Agenda um acompanhamento suave de 1-2 minutos para o contato no privado
   * @param {Object} params
   * @param {string} params.remoteJid
   * @param {Object} params.sock
   * @param {boolean} params.isGroup
   * @param {string} params.userName
   */
  schedule({ remoteJid, sock, isGroup, userName = '' }) {
    // 1. Follow-up opera apenas em chats privados para não poluir grupos
    if (isGroup || !remoteJid || remoteJid.endsWith('@g.us')) {
      return;
    }

    // 2. Verificar configurações ativas
    const currentConfig = configStore.get();
    const followUpConfig = currentConfig.followUp || { enabled: true, delaySeconds: 90 };
    if (followUpConfig.enabled === false) {
      return;
    }

    // 3. Cancela timer anterior se existir
    this.cancel(remoteJid);

    const delaySeconds = Math.max(60, Math.min(180, Number(followUpConfig.delaySeconds) || 90));
    const delayMs = delaySeconds * 1000;

    const timer = setTimeout(async () => {
      this.activeTimers.delete(remoteJid);
      try {
        if (!sock || !sock.user) return;
        
        logger.info(`[FOLLOW-UP] Disparando acompanhamento automático (${delaySeconds}s) para ${remoteJid}...`);
        
        const followUpMessages = [
          `Oi ${userName ? userName : ''}! Só passando para confirmar se deu tudo certo ou se ficou com alguma dúvida? 😊`,
          `Ficou alguma dúvida sobre o que conversamos? Se precisar de mais alguma coisa, estou por aqui! ✨`,
          `Oi! Conseguiu dar uma olhada na mensagem? Se precisar de ajuda, é só me chamar!`
        ];
        
        const randomMsg = followUpMessages[Math.floor(Math.random() * followUpMessages.length)].replace('  ', ' ');
        
        await sock.sendMessage(remoteJid, { text: randomMsg });
        logger.success(`[FOLLOW-UP] Mensagem de acompanhamento enviada para ${remoteJid}.`);
      } catch (err) {
        logger.warn(`[FOLLOW-UP] Falha ao enviar acompanhamento para ${remoteJid}: ${err.message}`);
      }
    }, delayMs);

    this.activeTimers.set(remoteJid, timer);
    logger.info(`[FOLLOW-UP] Agendado acompanhamento automático para ${remoteJid} em ${delaySeconds}s.`);
  }

  getActiveCount() {
    return this.activeTimers.size;
  }
}

export const followUpManager = new FollowUpManager();
