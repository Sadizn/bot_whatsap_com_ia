import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { configStore } from '../utils/configStore.js';
import { aiClient } from '../clients/aiClient.js';
import { logger } from '../utils/logger.js';
import { followUpManager } from '../modules/followUpManager.js';
import { commandDispatcher } from '../modules/commandDispatcher.js';
import { userStore } from '../modules/userStore.js';

export async function handleIncomingMessage(msg, sock) {
  const remoteJid = msg.key.remoteJid;
  const isGroup = remoteJid.endsWith('@g.us');
  const pushName = msg.pushName || 'Usuário';

  // 1. CANCELAMENTO ATÔMICO DE FOLLOW-UP: Qualquer interação recebida cancela o timer
  followUpManager.cancel(remoteJid);

  // 2. GATEKEEPER: Obter configurações ativas
  const currentConfig = configStore.get();
  const waConfig = currentConfig.whatsapp || {};
  const aiConfig = currentConfig.ai || {};
  const groupConfig = isGroup ? configStore.getGroupConfig(remoteJid) : null;

  // Se autoReply estiver desativado globalmente, NÃO responder nada
  if (waConfig.autoReply === false) {
    return;
  }

  // Se o bot estiver pausado especificamente neste grupo
  if (isGroup && groupConfig?.enabled === false) {
    return;
  }

  // Se for mensagem de grupo e o toggle global "Responder em Grupos" estiver desligado
  if (isGroup && !waConfig.respondGroups) {
    return;
  }

  // Se for mensagem privada e o toggle "Responder no Privado" estiver desligado
  if (!isGroup && waConfig.respondPrivate === false) {
    return;
  }

  // Helper para normalizar identificadores do WhatsApp (JID, LID, formato internacional)
  const getCleanNumber = (jid) => {
    if (!jid || typeof jid !== 'string') return '';
    return jid.split('@')[0].split(':')[0].replace(/\D/g, '');
  };

  // Obter texto inicial para filtros rápidos (suportando múltiplos tipos de mensagem)
  const textFromMsg = 
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    msg.message?.documentWithCaptionMessage?.message?.documentMessage?.caption ||
    msg.message?.templateButtonReplyMessage?.selectedDisplayText ||
    msg.message?.buttonsResponseMessage?.selectedDisplayText ||
    '';
  const cleanText = typeof textFromMsg === 'string' ? textFromMsg.trim() : '';

  // 3. DISPATCHER DE COMANDOS (Prefixos !, #, etc.)
  const wasHandled = await commandDispatcher.dispatch({
    text: cleanText,
    msg,
    sock,
    remoteJid,
    isGroup,
    pushName
  });

  if (wasHandled) {
    return;
  }

  // 4. REGRA PARA GRUPOS: Apenas responder se for MENCIONADA (@), RESPONDIDA (Reply/Citação) ou CHAMADA PELO NOME
  if (isGroup) {
    const myPhoneNum = getCleanNumber(sock.user?.id);
    const myLidNum = getCleanNumber(sock.user?.lid);

    const contextInfo = 
      msg.message?.extendedTextMessage?.contextInfo ||
      msg.message?.imageMessage?.contextInfo ||
      msg.message?.audioMessage?.contextInfo ||
      msg.message?.videoMessage?.contextInfo ||
      msg.message?.documentMessage?.contextInfo ||
      {};

    const rawMentionedJids = contextInfo.mentionedJid || [];
    const mentionedNumbers = rawMentionedJids.map(getCleanNumber);
    const quotedParticipantNum = getCleanNumber(contextInfo.participant);

    // Verifica se o bot foi marcado com @
    const isMentioned = Boolean(
      (myPhoneNum && mentionedNumbers.includes(myPhoneNum)) ||
      (myLidNum && mentionedNumbers.includes(myLidNum))
    );

    // Verifica se alguém respondeu (reply/quote) a uma mensagem enviada pela Edith
    const isQuotedReply = Boolean(
      (myPhoneNum && quotedParticipantNum === myPhoneNum) ||
      (myLidNum && quotedParticipantNum === myLidNum)
    );

    // Verifica se chamou explicitamente por "Edith", "Édith" ou "Mananga" no texto da mensagem
    const lowerText = cleanText.toLowerCase();
    const isCalledByName = 
      lowerText.includes('edith') || 
      lowerText.includes('édith') || 
      lowerText.includes('mananga') ||
      /\b(edith|édith|mananga)\b/i.test(cleanText);

    if (!isMentioned && !isQuotedReply && !isCalledByName) {
      return;
    }

    logger.info(`[GRUPO] Mensagem dirigida à Edith de ${pushName} (Mencionada: ${isMentioned}, Reply: ${isQuotedReply}, Nome: ${isCalledByName})`);
  }

  // 5. REGRA DE PREFIXO GLOBAL (Se ativada)
  if (waConfig.prefixOnly && cleanText) {
    const activePrefix = (isGroup && groupConfig?.prefix) ? groupConfig.prefix : (waConfig.prefix || '!');
    if (!cleanText.startsWith(activePrefix)) {
      return;
    }
  }

  // Se o Motor de IA estiver desativado no Dashboard, NÃO responder em linguagem natural
  if (aiConfig.enabled === false) {
    return;
  }

  // 6. IDENTIFICAR E BAIXAR MÍDIA (Áudio ou Foto)
  const isAudio = Boolean(msg.message?.audioMessage);
  const isImage = Boolean(msg.message?.imageMessage);
  let mediaPayload = null;

  if (isAudio) {
    try {
      logger.info(`Baixando áudio de ${pushName} (${remoteJid})...`);
      const buffer = await downloadMediaMessage(
        msg,
        'buffer',
        {},
        { reuploadRequest: sock.updateMediaMessage }
      );
      mediaPayload = {
        data: buffer.toString('base64'),
        mime_type: msg.message.audioMessage.mimetype || 'audio/ogg; codecs=opus',
        type: 'audio'
      };
      logger.success(`Áudio baixado com sucesso (${buffer.length} bytes).`);
    } catch (err) {
      logger.error(`Erro ao baixar áudio do WhatsApp: ${err.message}`);
    }
  }

  if (isImage) {
    try {
      logger.info(`Baixando foto de ${pushName} (${remoteJid})...`);
      const buffer = await downloadMediaMessage(
        msg,
        'buffer',
        {},
        { reuploadRequest: sock.updateMediaMessage }
      );
      mediaPayload = {
        data: buffer.toString('base64'),
        mime_type: msg.message.imageMessage.mimetype || 'image/jpeg',
        type: 'image'
      };
      logger.success(`Imagem baixada com sucesso (${buffer.length} bytes).`);
    } catch (err) {
      logger.error(`Erro ao baixar imagem do WhatsApp: ${err.message}`);
    }
  }

  // Se não houver texto nem mídia válida, ignorar
  if (!cleanText && !mediaPayload) {
    return;
  }

  logger.info(`Processando mensagem de ${pushName} (${remoteJid}): "${cleanText || (isAudio ? '[Áudio]' : '[Imagem]')}"`);

  try {
    // 7. Identificar usuário cadastrado para enriquecer contexto da IA
    const senderJid = isGroup ? (msg.key.participant || msg.participant || remoteJid) : remoteJid;
    const regUser = userStore.getUser(senderJid);
    const effectiveUserName = regUser ? regUser.name : pushName;

    // 8. Processar com o motor de IA em Python
    const aiResponse = await aiClient.processMessage({
      userId: remoteJid,
      message: cleanText,
      media: mediaPayload,
      userName: effectiveUserName,
      isGroup,
      metadata: {
        senderJid,
        registered: Boolean(regUser),
        userAge: regUser?.age,
        userGender: regUser?.gender,
        partner: regUser?.partner
      }
    });

    // 9. Finalizar indicador de presença
    await sock.sendPresenceUpdate('paused', remoteJid);

    // 10. Enviar resposta no WhatsApp com resiliência
    if (aiResponse && aiResponse.reply) {
      let sentSuccess = false;
      try {
        await sock.sendMessage(remoteJid, { text: aiResponse.reply }, { quoted: msg });
        logger.success(`Resposta enviada para ${pushName} via [${aiResponse.source}].`);
        sentSuccess = true;
      } catch (sendError) {
        logger.warn(`Primeira tentativa de envio falhou (${sendError.message}). Tentando reenvio direto...`);
        
        if (isGroup) {
          try {
            await sock.groupMetadata(remoteJid);
          } catch (e) {
            // Ignora erro de metadados
          }
        }

        try {
          await sock.sendMessage(remoteJid, { text: aiResponse.reply });
          logger.success(`Resposta enviada com sucesso no reenvio para ${pushName} via [${aiResponse.source}].`);
          sentSuccess = true;
        } catch (retryError) {
          logger.error(`Falha definitiva no envio da resposta para ${remoteJid}: ${retryError.message}`);
        }
      }

      // 11. AGENDAMENTO DE FOLLOW-UP INTELIGENTE NO PRIVADO
      if (sentSuccess && !isGroup) {
        followUpManager.schedule({
          remoteJid,
          sock,
          isGroup,
          userName: pushName
        });
      }
    }

  } catch (error) {
    logger.error(`Erro ao processar e responder mensagem de ${remoteJid}: ${error.message}`);
  }
}
