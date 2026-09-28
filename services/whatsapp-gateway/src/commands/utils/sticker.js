import baileys from '@whiskeysockets/baileys';
import { PERMISSIONS } from '../../modules/permissionManager.js';
import { logger } from '../../utils/logger.js';

const downloadMediaMessage = baileys.downloadMediaMessage || (baileys.default && baileys.default.downloadMediaMessage);

export const stickerCommand = {
  name: 'sticker',
  aliases: ['s', 'fig', 'figurinha'],
  category: 'utils',
  description: 'Converte uma imagem enviada ou respondida em figurinha',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid }) {
    const isImage = msg.message?.imageMessage;
    const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    if (!isImage && !isQuotedImage) {
      await sock.sendMessage(remoteJid, {
        text: '🖼️ *Como usar*: Envie uma foto com a legenda *!s* ou responda a uma foto com *!sticker*!'
      }, { quoted: msg });
      return;
    }

    try {
      let targetMsg = msg;
      if (isQuotedImage) {
        targetMsg = {
          key: {
            remoteJid: remoteJid,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId
          },
          message: msg.message.extendedTextMessage.contextInfo.quotedMessage
        };
      }

      const buffer = await downloadMediaMessage(
        targetMsg,
        'buffer',
        {},
        {
          logger: pinoLoggerSilent,
          reuploadRequest: sock.updateMediaMessage
        }
      ).catch(() => null);

      if (buffer) {
        await sock.sendMessage(remoteJid, {
          sticker: buffer
        }, { quoted: msg });
      } else {
        await sock.sendMessage(remoteJid, {
          text: '❌ Não foi possível baixar a imagem para converter em figurinha.'
        }, { quoted: msg });
      }
    } catch (err) {
      logger.error('Erro ao gerar sticker: ' + err.message);
      await sock.sendMessage(remoteJid, {
        text: '❌ Erro ao converter para figurinha.'
      }, { quoted: msg });
    }
  }
};

const pinoLoggerSilent = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
  trace: () => {},
  child: () => pinoLoggerSilent
};
