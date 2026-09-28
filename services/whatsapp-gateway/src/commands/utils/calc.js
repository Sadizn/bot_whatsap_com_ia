import { PERMISSIONS } from '../../modules/permissionManager.js';

export const calcCommand = {
  name: 'calc',
  aliases: ['calcular', 'calculadora'],
  category: 'utils',
  description: 'Calcula expressões matemáticas com segurança',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, rawArgs }) {
    if (!rawArgs || !rawArgs.trim()) {
      await sock.sendMessage(remoteJid, {
        text: '🧮 *Como usar*: !calc <expressão>\n_Exemplo: !calc (15 * 4) + 120 / 2_'
      }, { quoted: msg });
      return;
    }

    const sanitized = rawArgs.replace(/[^0-9+\-*/().%^]/g, '');
    if (!sanitized) {
      await sock.sendMessage(remoteJid, { text: '❌ Expressão inválida.' }, { quoted: msg });
      return;
    }

    try {
      // Avaliação segura com Function restrita
      const result = new Function(`'use strict'; return (${sanitized})`)();

      let text = `╭───────────────╮\n`;
      text += `│ ❖ 𝐂𝐀𝐋𝐂𝐔𝐋𝐀𝐃𝐎𝐑𝐀 ❖\n`;
      text += `│ ✰ ❯ 𝐂𝐚́𝐥𝐜𝐮𝐥𝐨: ${sanitized}\n`;
      text += `│ ✰ ❯ 𝐑𝐞𝐬𝐮𝐥𝐭𝐚𝐝𝐨: ${result}\n`;
      text += `╰───────────────╯`;

      await sock.sendMessage(remoteJid, { text }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(remoteJid, { text: '❌ Erro ao calcular expressão.' }, { quoted: msg });
    }
  }
};
