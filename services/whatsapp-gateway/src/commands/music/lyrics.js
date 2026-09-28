import axios from 'axios';
import { PERMISSIONS } from '../../modules/permissionManager.js';
import { aiClient } from '../../clients/aiClient.js';

export const lyricsCommand = {
  name: 'letra',
  aliases: ['lyrics', 'letras'],
  category: 'music',
  description: 'Busca a letra completa de uma música',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, rawArgs }) {
    if (!rawArgs || !rawArgs.trim()) {
      await sock.sendMessage(remoteJid, {
        text: '📝 *Como usar*: !letra <nome da música e artista>\n_Exemplo: !letra Bohemian Rhapsody Queen_'
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(remoteJid, {
      text: `🔍 _Procurando a letra de:_ *"${rawArgs}"*...`
    }, { quoted: msg });

    try {
      // 1. Tenta API pública gratuita de letras
      let lyricsText = null;
      let artistName = '';
      let trackName = rawArgs;

      try {
        const res = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(rawArgs.split('-')[0] || '')}/${encodeURIComponent(rawArgs.split('-')[1] || rawArgs)}`, { timeout: 5000 });
        if (res.data?.lyrics) {
          lyricsText = res.data.lyrics;
        }
      } catch (e) {
        // Fallback para IA
      }

      // 2. Se a API de letras não tiver, consulta a IA Gemini existente
      if (!lyricsText) {
        const aiRes = await aiClient.processMessage({
          userId: 'system_lyrics',
          userName: 'Edith Music',
          message: `Por favor, forneça a letra original da música "${rawArgs}". Se for muito longa, forneça os versos principais e o refrão de forma bem formatada.`,
          isGroup: false
        });
        if (aiRes?.reply) {
          lyricsText = aiRes.reply;
        }
      }

      if (lyricsText) {
        let text = `╭───────────────╮\n`;
        text += `│ ❖ 𝐋𝐄𝐓𝐑𝐀 𝐃𝐀 𝐌𝐔́𝐒𝐈𝐂𝐀 ❖\n`;
        text += `│ ✰ ❯ 𝐁𝐮𝐬𝐜𝐚: ${rawArgs}\n`;
        text += `╰───────────────╯\n\n`;
        text += lyricsText.slice(0, 3000);

        await sock.sendMessage(remoteJid, { text }, { quoted: msg });
      } else {
        await sock.sendMessage(remoteJid, {
          text: `❌ Não foi possível encontrar a letra para "${rawArgs}".`
        }, { quoted: msg });
      }
    } catch (err) {
      await sock.sendMessage(remoteJid, {
        text: `❌ Erro ao buscar letra: ${err.message}`
      }, { quoted: msg });
    }
  }
};
