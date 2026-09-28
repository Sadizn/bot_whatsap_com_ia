import { PERMISSIONS } from '../../modules/permissionManager.js';
import { aiClient } from '../../clients/aiClient.js';

export const aiDirectCommand = {
  name: 'ia',
  aliases: ['gemini', 'edith', 'perguntar'],
  category: 'ai',
  description: 'Faz uma pergunta direta para a inteligência artificial Gemini',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, rawArgs, userName }) {
    if (!rawArgs || !rawArgs.trim()) {
      await sock.sendMessage(remoteJid, {
        text: '🤖 *Como usar*: !ia <sua pergunta ou dúvida>\n_Exemplo: !ia Explique o que é computação quântica em 2 frases_'
      }, { quoted: msg });
      return;
    }

    try {
      const aiRes = await aiClient.processMessage({
        userId: msg.key.participant || remoteJid,
        userName: userName || 'Usuário',
        message: rawArgs.trim(),
        isGroup: false
      });

      let text = `╭───────────────╮\n`;
      text += `│ ❖ 𝐄𝐃𝐈𝐓𝐇 𝐈𝐀 ❖\n`;
      text += `╰───────────────╯\n\n`;
      text += aiRes?.reply || 'Não consegui processar a resposta agora.';

      await sock.sendMessage(remoteJid, { text }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(remoteJid, { text: `❌ Erro ao consultar IA: ${err.message}` }, { quoted: msg });
    }
  }
};
