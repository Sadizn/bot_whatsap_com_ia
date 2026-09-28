import { PERMISSIONS } from '../../modules/permissionManager.js';

export const closeGroupCommand = {
  name: 'fechar',
  aliases: ['close', 'mutar'],
  category: 'admin',
  description: 'Fecha o grupo para que apenas administradores enviem mensagens',
  permission: PERMISSIONS.ADMIN,
  groupOnly: true,

  async execute({ msg, sock, remoteJid, permissions }) {
    if (!permissions.isBotAdmin) {
      await sock.sendMessage(remoteJid, {
        text: '❌ Eu preciso ser Administradora do grupo para alterar as configurações de envio de mensagens.'
      }, { quoted: msg });
      return;
    }

    try {
      await sock.groupSettingUpdate(remoteJid, 'announcement');
      await sock.sendMessage(remoteJid, {
        text: '🔒 *GRUPO FECHADO*\nAgora apenas administradores podem enviar mensagens neste grupo.'
      }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(remoteJid, {
        text: `❌ Erro ao fechar o grupo: ${err.message}`
      }, { quoted: msg });
    }
  }
};

export const openGroupCommand = {
  name: 'abrir',
  aliases: ['open', 'desmutar'],
  category: 'admin',
  description: 'Abre o grupo para que todos os membros possam enviar mensagens',
  permission: PERMISSIONS.ADMIN,
  groupOnly: true,

  async execute({ msg, sock, remoteJid, permissions }) {
    if (!permissions.isBotAdmin) {
      await sock.sendMessage(remoteJid, {
        text: '❌ Eu preciso ser Administradora do grupo para alterar as configurações de envio de mensagens.'
      }, { quoted: msg });
      return;
    }

    try {
      await sock.groupSettingUpdate(remoteJid, 'not_announcement');
      await sock.sendMessage(remoteJid, {
        text: '🔓 *GRUPO ABERTO*\nTodos os participantes agora podem enviar mensagens livremente.'
      }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(remoteJid, {
        text: `❌ Erro ao abrir o grupo: ${err.message}`
      }, { quoted: msg });
    }
  }
};
