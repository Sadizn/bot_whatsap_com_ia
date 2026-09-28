import { PERMISSIONS } from '../../modules/permissionManager.js';

export const diceCommand = {
  name: 'dado',
  aliases: ['dice', 'roll', 'rolar'],
  category: 'utils',
  description: 'Rola um dado de 6 lados ou moeda',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid }) {
    const diceNumber = Math.floor(Math.random() * 6) + 1;
    const diceIcons = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    let text = `╭───────────────╮\n`;
    text += `│ ❖ 𝐃𝐀𝐃𝐎 ❖\n`;
    text += `│ ✰ ❯ 𝐑𝐞𝐬𝐮𝐥𝐭𝐚𝐝𝐨: ${diceIcons[diceNumber - 1]} (${diceNumber})\n`;
    text += `╰───────────────╯`;

    await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  }
};

export const coinCommand = {
  name: 'moeda',
  aliases: ['caraoucoroa', 'coin', 'flip'],
  category: 'utils',
  description: 'Joga uma moeda e tira Cara ou Coroa',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid }) {
    const isHeads = Math.random() > 0.5;
    const result = isHeads ? '🪙 CARA' : '👑 COROA';

    let text = `╭───────────────╮\n`;
    text += `│ ❖ 𝐂𝐀𝐑𝐀 𝐎𝐔 𝐂𝐎𝐑𝐎𝐀 ❖\n`;
    text += `│ ✰ ❯ 𝐑𝐞𝐬𝐮𝐥𝐭𝐚𝐝𝐨: ${result}\n`;
    text += `╰───────────────╯`;

    await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  }
};
