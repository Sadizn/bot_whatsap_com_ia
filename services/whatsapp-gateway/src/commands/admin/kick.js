import { PERMISSIONS } from '../../modules/permissionManager.js';

export const kickCommand = {
  name: 'kick',
  aliases: ['ban', 'expulsar', 'remover'],
  category: 'admin',
  description: 'Remove um participante do grupo (Requer ser Admin)',
  permission: PERMISSIONS.ADMIN,
  groupOnly: true,

  async execute({ msg, sock, remoteJid, permissions }) {
    if (!permissions.isBotAdmin) {
      await sock.sendMessage(remoteJid, {
        text: '❌ Eu preciso ser Administradora do grupo para poder remover participantes.'
      }, { quoted: msg });
      return;
    }

    const contextInfo = 
      msg.message?.extendedTextMessage?.contextInfo ||
      msg.message?.imageMessage?.contextInfo ||
      {};

    let targetJid = null;
    if (contextInfo.mentionedJid && contextInfo.mentionedJid.length > 0) {
      targetJid = contextInfo.mentionedJid[0];
    } else if (contextInfo.participant) {
      targetJid = contextInfo.participant;
    }

    if (!targetJid) {
      await sock.sendMessage(remoteJid, {
        text: '⚠️ Marque (@) o usuário ou responda a mensagem de quem deseja remover.\nEx: *!kick @usuario*'
      }, { quoted: msg });
      return;
    }

    try {
      await sock.groupParticipantsUpdate(remoteJid, [targetJid], 'remove');
      await sock.sendMessage(remoteJid, {
        text: `👢 Participante removido com sucesso do grupo.`
      }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(remoteJid, {
        text: `❌ Falha ao remover participante: ${err.message}`
      }, { quoted: msg });
    }
  }
};
