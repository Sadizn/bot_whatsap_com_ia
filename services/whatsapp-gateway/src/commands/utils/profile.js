import { PERMISSIONS } from '../../modules/permissionManager.js';
import { userStore } from '../../modules/userStore.js';

export const profileCommand = {
  name: 'perfil',
  aliases: ['me', 'cargo', 'permissoes', 'xp', 'saldo', 'carteira'],
  category: 'utils',
  description: 'Mostra seus dados cadastrados, saldo de XP, permissão e status de relacionamento',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, senderJid, pushName, permissions, isGroup, activePrefix }) {
    const p = activePrefix || '!';
    const registeredUser = userStore.getUser(senderJid);
    const userXp = userStore.getXp(senderJid);

    const roleIcons = {
      [PERMISSIONS.OWNER]: '👑 OWNER',
      [PERMISSIONS.ADMIN]: '🛡️ ADMIN',
      [PERMISSIONS.PUBLIC]: '👤 MEMBRO'
    };

    let text = `╭───────────────╮\n`;
    text += `│ ❖ 𝐏𝐄𝐑𝐅𝐈𝐋 𝐃𝐎 𝐔𝐒𝐔𝐀́𝐑𝐈𝐎 ❖\n`;
    
    if (registeredUser) {
      text += `│ ✰ ❯ 𝐍𝐨𝐦𝐞: ${registeredUser.name}\n`;
      text += `│ ✰ ❯ 𝐒𝐞𝐱𝐨: ${registeredUser.gender}\n`;
      text += `│ ✰ ❯ 𝐈𝐝𝐚𝐝𝐞: ${registeredUser.age} anos\n`;
      
      if (registeredUser.partner) {
        const partner = userStore.getUser(registeredUser.partner);
        const partnerName = partner?.name || `@${registeredUser.partner.split('@')[0]}`;
        text += `│ ✰ ❯ 𝐒𝐭𝐚𝐭𝐮𝐬: 💍 Namorando com ${partnerName}\n`;
      } else {
        text += `│ ✰ ❯ 𝐒𝐭𝐚𝐭𝐮𝐬: 💔 Solteiro(a)\n`;
      }
    } else {
      text += `│ ✰ ❯ 𝐍𝐨𝐦𝐞: ${pushName || 'Usuário'}\n`;
      text += `│ ✰ ❯ 𝐂𝐚𝐝𝐚𝐬𝐭𝐫𝐨: ❌ Não cadastrado (${p}cad)\n`;
    }

    text += `│ ✰ ❯ 💰 𝐗𝐏 / 𝐒𝐚𝐥𝐝𝐨: ${userXp.toLocaleString('pt-BR')} XP\n`;
    text += `│ ✰ ❯ 𝐏𝐞𝐫𝐦𝐢𝐬𝐬𝐚̃𝐨: ${roleIcons[permissions.role] || permissions.role}\n`;
    text += `│ ✰ ❯ 𝐍𝐮́𝐦𝐞𝐫𝐨: @${senderJid.split('@')[0]}\n`;
    text += `╰───────────────╯\n`;

    if (!registeredUser) {
      text += `💡 _Dica: Registre seu perfil com *${p}cad <nome> <sexo> <idade>* para liberar todas as funções!_`;
    }

    await sock.sendMessage(remoteJid, {
      text: text.trim(),
      mentions: registeredUser?.partner ? [senderJid, registeredUser.partner] : [senderJid]
    }, { quoted: msg });
  }
};
