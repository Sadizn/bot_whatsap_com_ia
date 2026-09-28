import axios from 'axios';
import { PERMISSIONS } from '../../modules/permissionManager.js';

export const translateCommand = {
  name: 'traduzir',
  aliases: ['tr', 'translate'],
  category: 'utils',
  description: 'Traduz um texto para qualquer idioma (ex: !tr en Olá mundo)',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, rawArgs }) {
    if (!rawArgs || !rawArgs.trim()) {
      await sock.sendMessage(remoteJid, {
        text: '🌐 *Como usar*: !traduzir <idioma_destino> <texto>\n_Exemplo: !traduzir en Bom dia a todos_'
      }, { quoted: msg });
      return;
    }

    const parts = rawArgs.trim().split(' ');
    const targetLang = parts[0].length === 2 ? parts[0] : 'pt';
    const textToTranslate = parts[0].length === 2 ? parts.slice(1).join(' ') : rawArgs;

    try {
      const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`, { timeout: 5000 });
      let translated = '';
      if (res.data && res.data[0]) {
        translated = res.data[0].map(item => item[0]).join('');
      }

      let text = `╭───────────────╮\n`;
      text += `│ ❖ 𝐓𝐑𝐀𝐃𝐔𝐂̧𝐀̃𝐎 ❖\n`;
      text += `│ ✰ ❯ 𝐎𝐫𝐢𝐠𝐢𝐧𝐚𝐥: ${textToTranslate}\n`;
      text += `│ ✰ ❯ 𝐓𝐫𝐚𝐝𝐮𝐜̧𝐚̃𝐨 (${targetLang.toUpperCase()}): ${translated}\n`;
      text += `╰───────────────╯`;

      await sock.sendMessage(remoteJid, { text }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(remoteJid, { text: '❌ Erro ao traduzir texto.' }, { quoted: msg });
    }
  }
};
