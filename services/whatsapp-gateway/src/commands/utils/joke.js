import { PERMISSIONS } from '../../modules/permissionManager.js';
import { aiClient } from '../../clients/aiClient.js';

export const jokeCommand = {
  name: 'piada',
  aliases: ['joke', 'rir'],
  category: 'games',
  description: 'Conta uma piada divertida',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid }) {
    try {
      const aiRes = await aiClient.processMessage({
        userId: 'system_joke',
        userName: 'Edith',
        message: 'Conte uma piada curta e muito engraçada em português.',
        isGroup: false
      });

      const joke = aiRes?.reply || 'Por que o programador não gosta da natureza? Porque tem muitos bugs!';

      let text = `╭───────────────╮\n`;
      text += `│ ❖ 𝐏𝐈𝐀𝐃𝐀 ❖\n`;
      text += `│ ${joke}\n`;
      text += `╰───────────────╯`;

      await sock.sendMessage(remoteJid, { text }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(remoteJid, { text: '😂 O que o pato falou para a pata? Vem Quá!' }, { quoted: msg });
    }
  }
};
